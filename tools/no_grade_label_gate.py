#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
no_grade_label_gate.py — AC-NOGRADE 的 fail-closed gate：learner 端畫面不得揭示其「年段/年級」。

為什麼存在（R11）
  學習路徑以能力/先備知識串接，learner 永遠看不到自己「幾年級/國幾/高幾」——避免標籤化、
  避免「我落後了」的挫折、讓同一條路徑對任何起點的人都友善。年段只存在於作者端 metadata，
  絕不出現在 learner 可見文字。CONTENT_AUDIT 難保每頁都看，必須機器逐檔掃 learner 可見文字。

判定原則（凌駕列舉；清單非窮舉，同義詞/變體一律涵蓋，紅隊用「清單未列的年段表述」驗不漏）
  原則：任何「向 learner 揭示其所處學齡/年段/年級」的可見表述即 FAIL，不論用何種寫法：
    - 數字＋年級：「X年級 / 第X學年」（X＝阿拉伯數字或中文數字）
    - 學制＋序數：國一/國二/國三、高一/高二/高三、小一…小六（＝年段序數，非學校名）
    - 西式：Grade N、GN（N=1..12）、Nth grade、Year N（英式）
    - 概念詞：年段、學齡、年級（作為 learner 自身層級的標示）
  僅掃 **learner 可見文字**：剝除 <script>/<style>/<!--註解-->/一般標籤屬性，但保留
  learner 看得到的屬性文字（alt/title/placeholder/aria-label/value/content[meta 除外]）。
  作者端 metadata（data-* 屬性、JSON、JS 常數、註解）**不算 learner 可見**，不誤報。

介面（與 scan_simplified.py / no_backend_gate.py 對齊）
  python3 tools/no_grade_label_gate.py [file ...]   # orchestrator 以 GLOB:*.html 展開
  python3 tools/no_grade_label_gate.py --selftest    # 壞例必 DENY、好例必 ALLOW
  忽略 orchestrator 附加的 --root <dir> / --release-id <id>
EXIT：0=clean（PASS），1=發現 learner 可見年段標示（FAIL），2=selftest 失敗。
"""
import sys, os, re, glob

# ---- 剝除非 learner 可見區塊，保留可見文字 + 可見屬性值 ----
_SCRIPT = re.compile(r'<script\b[^>]*>.*?</script>', re.S | re.I)
_STYLE  = re.compile(r'<style\b[^>]*>.*?</style>', re.S | re.I)
_COMMENT= re.compile(r'<!--.*?-->', re.S)
# learner 看得到的屬性（其值會被顯示/朗讀）——保留其值作為可見文字
_VISIBLE_ATTR = re.compile(r'\b(?:alt|title|placeholder|aria-label|value)\s*=\s*(["\'])(.*?)\1', re.S | re.I)
_TAG = re.compile(r'<[^>]+>', re.S)

def visible_text(html: str) -> str:
    # 先抽出可見屬性值（在標籤被剝除前）
    vis_attrs = " ".join(m.group(2) for m in _VISIBLE_ATTR.finditer(html))
    t = _SCRIPT.sub(" ", html)
    t = _STYLE.sub(" ", t)
    t = _COMMENT.sub(" ", t)
    t = _TAG.sub(" ", t)            # 去除所有標籤（含 data-* 等作者端屬性）
    # 還原常見 HTML 實體中與偵測相關者
    t = (t.replace("&nbsp;", " ").replace("&amp;", "&"))
    return t + "\n" + vis_attrs

# ---- 年段/年級揭示 patterns（原則式；非窮舉）----
_CN_NUM = "一二三四五六七八九十兩"
PATTERNS = [
    (re.compile(rf'[0-9{_CN_NUM}]\s*年級'), "X年級"),
    (re.compile(rf'第\s*[0-9{_CN_NUM}]\s*學年'), "第X學年"),
    # 國/高/小 + 序數＝年段；排除後接「連續數字」及「比較/量詞延續字」(點/些/層/階…) 以免誤報
    #   例：高一點(higher)/高一層/高一些/高一階、小一點/小一號、國一號 皆非年段。
    (re.compile(r'國[一二三](?![一二三四五六七八九十點些下層階格籌招步半樣起多深大小矮低號])'), "國一/二/三(年段序數)"),
    (re.compile(r'高[一二三](?![一二三四五六七八九十點些下層階格籌招步半樣起多深大小矮低號])'), "高一/二/三(年段序數)"),
    (re.compile(r'小[一二三四五六](?![一二三四五六七八九十點些下層階格籌招步半樣起多深大小矮低號])'), "小一…小六(年段序數)"),
    (re.compile(r'\bGrade\s*(?:1[0-2]|[1-9])\b', re.I), "Grade N"),
    (re.compile(r'\bG(?:1[0-2]|[1-9])\b'), "GN"),
    (re.compile(r'\b(?:1[0-2]|[1-9])\s*(?:st|nd|rd|th)\s*grade\b', re.I), "Nth grade"),
    (re.compile(r'\bYear\s*(?:1[0-2]|[1-9])\b', re.I), "Year N"),
    (re.compile(r'年段'), "年段"),
    (re.compile(r'學齡'), "學齡"),
]
# 降低誤報：這些上下文裡的 token 非「年段」義（白名單，窄用）
# 例：「高一點」「高一層」「國三號」→ 已由上面 negative-lookahead 擋掉連續中文數字；
#     「高一中學」之類校名極少見於 learner UI，如需再收斂於此加 context。

def scan_text(txt: str):
    hits = []
    for rx, label in PATTERNS:
        for m in rx.finditer(txt):
            ln = txt.count("\n", 0, m.start()) + 1
            hits.append((ln, label, m.group(0).strip()))
    return hits

def scan_files(paths, explicit):
    fails, missing = {}, []
    for p in paths:
        if not os.path.exists(p):
            missing.append(p); continue
        html = open(p, encoding="utf-8", errors="replace").read()
        vis = visible_text(html)
        hs = scan_text(vis)
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
    bad = """<!doctype html><html lang="zh-TW"><body>
      <h1>歡迎，六年級的小朋友！</h1>
      <p>這是國一的數學練習。Grade 7 unit.</p>
      <img alt="高三複習地圖">
      <button>第三學年挑戰</button>
      </body></html>"""
    good = """<!doctype html><html lang="zh-TW"><body>
      <h1>歡迎回來！</h1>
      <p>這是「分數加法」單元，先備：整數加法。</p>
      <!-- 作者端 metadata：stage=G6（註解不算 learner 可見） -->
      <div data-stage="G6" data-grade="六年級">分數加法</div>
      <script>const STAGE="國一";const g=6;/* 年級 in code */</script>
      <style>.g6{color:red}</style>
      <img alt="分數加法示意圖">
      <p>你完成了 3 個關卡，繼續加油！高一點點就到了終點。</p>
      </body></html>"""
    bh = scan_text(visible_text(bad))
    gh = scan_text(visible_text(good))
    ok = True
    need = {"X年級", "國一/二/三(年段序數)", "Grade N", "高一/二/三(年段序數)", "第X學年"}
    got = {lbl for _, lbl, _ in bh}
    miss = need - got
    if miss:
        print("  selftest FAIL：壞例漏抓", sorted(miss)); ok = False
    else:
        print(f"  selftest：壞例抓到 {len(bh)} 處 learner 可見年段標示 ✅")
    if gh:
        print("  selftest FAIL：好例誤報", gh); ok = False
    else:
        print("  selftest：好例零誤報（data-*/註解/JS/CSS 作者端年段 + 「高一點」皆不誤報）✅")
    # 紅隊：清單未逐一列的變體（「第 6 學年」「G12」「Year 8」）靠原則抓到
    rt = scan_text(visible_text("<p>第 6 學年，G12，Year 8 的課程</p>"))
    rtl = {lbl for _, lbl, _ in rt}
    if not {"第X學年", "GN", "Year N"} <= rtl:
        print("  selftest FAIL：原則未抓到變體", sorted(rtl)); ok = False
    else:
        print("  selftest：原則抓到未逐列變體（第X學年/GN/Year N）✅")
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
    print("=== no-grade-label（learner 不見年段，R11）scan ===")
    for p in paths:
        if p in fails:
            print(f"  FAIL {p}:")
            seen = fails[p]
            for ln, label, frag in seen[:40]:
                print(f"      L{ln} {label} → 「{frag}」")
            if len(seen) > 40:
                print(f"      …（共 {len(seen)} 處）")
        elif os.path.exists(p):
            print(f"  ok   {p}")
    if explicit and missing:
        print("  MISSING (explicit→FAIL): " + ", ".join(missing))
    ok = not fails and not (explicit and missing)
    total = sum(len(v) for v in fails.values())
    print(f"RESULT: {'PASS ✅' if ok else 'FAIL ❌'}（年段標示 {total} 處，檔 {len(fails)}）")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
