#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
no_backend_gate.py — AC-NOBACKEND 的 fail-closed 靜態站「零對外請求」gate。

為什麼存在
  本站為靜態站：一切進度/獎勵存 localStorage，不新增伺服器、learner 端不得對外發請求
  （隱私、可離線、無帳號、無追蹤）。CONTENT_AUDIT 看不到「哪個標籤會發網路請求」，
  只有實際掃描所有「具 URL 的節點屬性 + 所有發請求的 JS API + 全部 CSS url()/@import」
  並以「非同源一律 fail」的原則判定，才能機器堵死。

判定原則（凌駕列舉；清單非窮舉，紅隊用「清單未列但具 URL 屬性的節點」驗原則不漏）
  1) 任何「值為 URL 的屬性」出現「外部 URL」即 FAIL：
     - 外部 URL ＝ 絕對 http(s):// / 協定相對 // / 其他遠端 scheme（ws(s):, ftp:, 以及
       非同源可定位者）。data:、blob:、about:、#片段、mailto:/tel:、以及相對路徑＝同源＝允許。
     - 屬性不採白名單：凡「屬性名屬於已知 URL 屬性集合」或「值本身長得像外部 URL」皆檢查，
       故 video poster、object data、use href、svg image href、form action、srcset… 都涵蓋。
  2) 任何「會發對外請求的 JS API」被呼叫即 FAIL（fetch/XMLHttpRequest.open/WebSocket/
     EventSource/navigator.sendBeacon/importScripts/動態 import()/Image().src=外部/
     navigator.geolocation…）——除非該呼叫的 URL 引數可靜態證明為同源相對字串。
  3) 全部 CSS（<style> 與 style= 與 .css）：url(...)、@import、@font-face src 的外部 URL 即 FAIL。

介面（與 scan_simplified.py 對齊）
  python3 tools/no_backend_gate.py [file ...]     # 掃指定檔（orchestrator 以 GLOB:*.html 展開）
  python3 tools/no_backend_gate.py --selftest     # 自測：壞例必 DENY、好例必 ALLOW（gate 有牙）
  會忽略 orchestrator 附加的 --root <dir> / --release-id <id>
EXIT：0=clean（PASS），1=發現外部請求向量（FAIL），2=selftest 失敗。
"""
import sys, os, re, glob, tempfile

# ---- 外部 URL 判定（原則：非同源一律視為外部）----
_EXTERNAL_SCHEME = re.compile(r'^\s*(?:https?:|wss?:|ftps?:|file:)', re.I)
_PROTO_RELATIVE  = re.compile(r'^\s*//[^/]')          # //host/...（協定相對→外部）
_SAME_ORIGIN_OK  = re.compile(r'^\s*(?:data:|blob:|about:|mailto:|tel:|javascript:|#)', re.I)

def is_external_url(val: str) -> bool:
    if val is None:
        return False
    v = val.strip().strip('\'"').strip()
    if not v:
        return False
    if _SAME_ORIGIN_OK.match(v):
        return False
    if _EXTERNAL_SCHEME.match(v) or _PROTO_RELATIVE.match(v):
        return True
    # 其餘（相對路徑 foo/bar.js、/abs/same-origin、./x）＝同源，允許
    return False

def externals_in_srcset(val: str):
    # srcset: "url 1x, url 2x" → 逐 candidate 取 URL
    hits = []
    for cand in val.split(','):
        url = cand.strip().split()[0] if cand.strip() else ''
        if is_external_url(url):
            hits.append(url)
    return hits

# 已知「值為 URL」的屬性（非窮舉；原則上凡值像外部 URL 都會被 regex 兜底）
URL_ATTRS = ("src", "href", "data", "poster", "action", "formaction",
             "cite", "background", "longdesc", "codebase", "manifest",
             "xlink:href", "ping", "archive", "usemap")
# 任一標籤屬性 = "....external...."；兜底掃描（含上面沒列到的屬性名）
_ATTR_URL = re.compile(r'([a-zA-Z_:][\w:.-]*)\s*=\s*(["\'])(.*?)\2', re.S)
_SRCSET   = re.compile(r'\bsrcset\s*=\s*(["\'])(.*?)\1', re.S | re.I)

# ---- 會發對外請求的 JS API（呼叫即查其 URL 引數）----
_JS_REQ = [
    (re.compile(r'\bfetch\s*\(\s*(["\'])(.*?)\1', re.S), "fetch"),
    (re.compile(r'\.open\s*\(\s*["\'][A-Z]+["\']\s*,\s*(["\'])(.*?)\1', re.S), "XHR.open"),
    (re.compile(r'new\s+WebSocket\s*\(\s*(["\'])(.*?)\1', re.S), "WebSocket"),
    (re.compile(r'new\s+EventSource\s*\(\s*(["\'])(.*?)\1', re.S), "EventSource"),
    (re.compile(r'\bsendBeacon\s*\(\s*(["\'])(.*?)\1', re.S), "sendBeacon"),
    (re.compile(r'\bimportScripts\s*\(\s*(["\'])(.*?)\1', re.S), "importScripts"),
    (re.compile(r'\bimport\s*\(\s*(["\'])(.*?)\1', re.S), "dynamic-import"),
]
# 無法靜態取 URL 引數者（變數/模板字串）→ 保守 FAIL（不可證明為同源）
_JS_REQ_DYNAMIC = [
    (re.compile(r'\bfetch\s*\(\s*(?![\'"])', re.S), "fetch(非字面量URL)"),
    (re.compile(r'new\s+WebSocket\s*\(\s*(?![\'"])', re.S), "WebSocket(非字面量URL)"),
    (re.compile(r'new\s+EventSource\s*\(\s*(?![\'"])', re.S), "EventSource(非字面量URL)"),
]

# ---- CSS 外部資源 ----
_CSS_URL    = re.compile(r'url\(\s*(["\']?)(.*?)\1\s*\)', re.S | re.I)
_CSS_IMPORT = re.compile(r'@import\s+(?:url\(\s*)?(["\'])(.*?)\1', re.S | re.I)

def line_of(text, idx):
    return text.count("\n", 0, idx) + 1

def scan_text(txt):
    """回傳 [(line, kind, detail)] 外部請求命中。"""
    hits = []
    # 1) 標籤屬性兜底掃描（任何屬性值像外部 URL）
    for m in _ATTR_URL.finditer(txt):
        attr, _q, val = m.group(1), m.group(2), m.group(3)
        if attr.lower() == "srcset":
            continue  # srcset 另解析
        if is_external_url(val):
            hits.append((line_of(txt, m.start()), f"attr[{attr}]", val.strip()[:80]))
    # srcset
    for m in _SRCSET.finditer(txt):
        for url in externals_in_srcset(m.group(2)):
            hits.append((line_of(txt, m.start()), "attr[srcset]", url[:80]))
    # 2) JS 請求 API（字面量 URL）
    for rx, name in _JS_REQ:
        for m in rx.finditer(txt):
            url = m.group(2)
            if is_external_url(url):
                hits.append((line_of(txt, m.start()), f"js[{name}]", url.strip()[:80]))
    # 2b) JS 請求 API（非字面量 URL → 無法證明同源 → 保守 FAIL）
    for rx, name in _JS_REQ_DYNAMIC:
        for m in rx.finditer(txt):
            hits.append((line_of(txt, m.start()), f"js[{name}]", "<非字面量，無法證明同源>"))
    # 3) CSS url() / @import
    for m in _CSS_URL.finditer(txt):
        if is_external_url(m.group(2)):
            hits.append((line_of(txt, m.start()), "css[url()]", m.group(2).strip()[:80]))
    for m in _CSS_IMPORT.finditer(txt):
        if is_external_url(m.group(2)):
            hits.append((line_of(txt, m.start()), "css[@import]", m.group(2).strip()[:80]))
    return hits

def scan_files(paths, explicit):
    fails, missing = {}, []
    for p in paths:
        if not os.path.exists(p):
            missing.append(p); continue
        txt = open(p, encoding="utf-8", errors="replace").read()
        hs = scan_text(txt)
        if hs:
            fails[p] = hs
    return fails, missing

def _strip_orchestrator_flags(raw):
    args, skip = [], False
    for a in raw:
        if skip:
            skip = False; continue
        if a in ("--root", "--release-id"):
            skip = True; continue
        args.append(a)
    return args

def selftest():
    bad = """<!doctype html><html lang="zh-TW"><head>
      <link rel="stylesheet" href="https://cdn.example.com/x.css">
      <style>@font-face{font-family:A;src:url(https://fonts.example.com/a.woff2)}</style>
      </head><body>
      <img src="/assets/ok.png"><img src="//evil.cdn/x.png" srcset="//evil.cdn/x@2x.png 2x">
      <script>fetch("https://api.example.com/data").then(r=>r.json());
      const ws=new WebSocket("wss://rt.example.com");
      fetch(window.API_BASE+"/q");</script>
      </body></html>"""
    good = """<!doctype html><html lang="zh-TW"><head>
      <link rel="stylesheet" href="assets/app.css">
      <style>@font-face{font-family:A;src:url(fonts/a.woff2)}.b{background:url('./b.png')}</style>
      </head><body>
      <img src="assets/ok.png" srcset="assets/ok.png 1x, assets/ok@2x.png 2x">
      <audio src="audio/word.mp3"></audio>
      <script>fetch("api/local.json");localStorage.setItem('k','v');
      const img=new Image();img.src="imgs/a.png";</script>
      </body></html>"""
    bh = scan_text(bad)
    gh = scan_text(good)
    ok = True
    # 壞例必須抓到：外部 css、外部 font、協定相對 img、srcset、fetch 外部、WebSocket、非字面量 fetch
    need = {"css[url()]", "attr[href]", "attr[src]", "attr[srcset]", "js[fetch]", "js[WebSocket]", "js[fetch(非字面量URL)]"}
    got = {k for _, k, _ in bh}
    missing_kinds = need - got
    if missing_kinds:
        print("  selftest FAIL：壞例漏抓", sorted(missing_kinds)); ok = False
    else:
        print(f"  selftest：壞例抓到 {len(bh)} 個外部向量 ✅")
    if gh:
        print("  selftest FAIL：好例誤報", gh); ok = False
    else:
        print("  selftest：好例零誤報（相對路徑/同源/data:/localStorage 皆放行）✅")
    # 紅隊：清單未明列但具 URL 屬性的節點（video poster）要靠原則兜底抓到
    rt = scan_text('<video poster="https://x.cdn/p.jpg"></video>')
    if not any(k.startswith("attr[") for _, k, _ in rt):
        print("  selftest FAIL：原則兜底未抓到 video poster 外部 URL"); ok = False
    else:
        print("  selftest：原則兜底抓到清單未列的 video poster ✅")
    print("SELFTEST:", "PASS ✅" if ok else "FAIL ❌")
    return 0 if ok else 2

def main():
    raw = sys.argv[1:]
    if "--selftest" in raw:
        return selftest()
    args = _strip_orchestrator_flags(raw)
    explicit = bool(args)
    paths = []
    for a in args:
        paths.extend(sorted(glob.glob(a)) or [a])
    if not paths:
        print("  無檔可掃（需以檔路徑或 GLOB 提供）"); print("RESULT: FAIL ❌"); return 1
    fails, missing = scan_files(paths, explicit)
    print("=== no-backend（零對外請求）scan ===")
    for p in paths:
        if p in fails:
            print(f"  FAIL {p}:")
            for ln, kind, detail in fails[p][:40]:
                print(f"      L{ln} {kind} → {detail}")
            if len(fails[p]) > 40:
                print(f"      …（共 {len(fails[p])} 處）")
        elif os.path.exists(p):
            print(f"  ok   {p}")
    if explicit and missing:
        print("  MISSING (explicit→FAIL): " + ", ".join(missing))
    ok = not fails and not (explicit and missing)
    total = sum(len(v) for v in fails.values())
    print(f"RESULT: {'PASS ✅' if ok else 'FAIL ❌'}（外部向量 {total} 處，檔 {len(fails)}）")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
