#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""style_token_lint.py — AC-STYLE-2 的 fail-closed lint（R-STYLE-1：顏色只能走 app.css token）。

鐵律 R-STYLE-1：learner 端元件的**顏色**一律取 `assets/app.css` 的設計 token（`var(--…)`），
不得硬編色票字面值（hex / rgb(a) / hsl(a) / 具名色 red|white…）。色票單一來源＝app.css `:root`。

掃描面（scoped 到學習路徑樣式，不含 legacy 舊站）：
  - `assets/unit.css`（250 單元頁共用元件 CSS）、`assets/app.css` 以外的學習路徑共用 CSS；
  - 學習路徑 HTML（index_new.html ＋ english_*.html）的 inline `<style>` 區塊。
**排除**：token 定義本身——`:root{…}` 與 `[data-theme…]{…}`／`@media (prefers-color-scheme…)` 內的
`--foo: <色值>;` 宣告（色票的單一來源允許寫字面值），以及 `url(#…)` 這類非顏色井號。

判定原則凌駕列舉：凡「顏色位置的字面色值」皆命中；偵測 hex(`#rgb/#rgba/#rrggbb/#rrggbbaa`)、
`rgb()/rgba()/hsl()/hsla()` 函式、及一組會當顏色用的 CSS 具名色。token 定義行（`--x: …;`）豁免。

介面：--selftest（好例 ALLOW／各壞例 DENY）；--verify [檔…]（預設掃學習路徑樣式集）。
EXIT：0=無硬編色；1..=命中數；99=fail-closed（掃不到任何目標檔）。
"""
import argparse, glob, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NOTHING = 99

# 會被當顏色用的具名色（白名單式偵測；避免把 transparent/inherit/currentColor 誤判——那些本就允許）。
# 尾端 (?![\w-]) 確保不誤判屬性名（`white-space`）或複合字（`whitesmoke`）——具名色只在值位、後不接 - 或字元。
NAMED = (r"\b(?:white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|"
         r"silver|gold|cyan|magenta|lime|navy|teal|maroon|olive|aqua|fuchsia)(?![\w-])")
HEX = r"#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b"
FUNC = r"\b(?:rgba?|hsla?)\s*\("
COLOR_RE = re.compile(f"(?:{HEX})|(?:{FUNC})|(?:{NAMED})")

# token 定義宣告：`--foo: <值>`（色票單一來源允許字面值；位置不限、含 :root/inline）
TOKEN_DEF_RE = re.compile(r"--[\w-]+\s*:\s*[^;}]*")
COMMENT_RE = re.compile(r"/\*[\s\S]*?\*/")
# url(#id) / url('#id') 的片段井號不是顏色
URL_HASH_RE = re.compile(r"url\(\s*['\"]?#")


def _blank(m):
    """把 match 抹成等長空白、保留換行，使後續掃描行號不位移。"""
    return re.sub(r"[^\n]", " ", m.group(0))


def scan_css(css):
    """回傳 [(line_no, snippet)]。先抹除註解與所有 `--token: 值` 宣告（色票來源，豁免），
    再逐行掃剩餘內容的字面色值；跨行宣告值（如 canvas background）因非 `--` 定義仍會被掃到。"""
    css = COMMENT_RE.sub(_blank, css)
    css = TOKEN_DEF_RE.sub(_blank, css)
    hits = []
    for i, raw in enumerate(css.splitlines(), 1):
        scan = URL_HASH_RE.sub("url(", raw)   # 拿掉 url(# 片段，避免 #id 誤判
        for m in COLOR_RE.finditer(scan):
            hits.append((i, m.group(0)))
    return hits


def inline_styles(html):
    return "\n".join(re.findall(r"<style\b[^>]*>([\s\S]*?)</style>", html, re.I))


def default_targets():
    t = [os.path.join(ROOT, "assets", "unit.css")]
    t += [os.path.join(ROOT, "index_new.html")]
    t += sorted(glob.glob(os.path.join(ROOT, "english_*.html")))
    return t


def run(targets):
    seen = 0
    all_hits = []
    for p in targets:
        if not os.path.exists(p):
            continue
        seen += 1
        txt = open(p, encoding="utf-8").read()
        css = txt if p.endswith(".css") else inline_styles(txt)
        for ln, frag in scan_css(css):
            all_hits.append((os.path.relpath(p, ROOT), ln, frag))
    return seen, all_hits


def _selftest():
    cases = []
    good = ".a{ color:var(--ink); background:var(--card); box-shadow:var(--shadow-sm); }\n" \
           ":root{ --ink:#241E17; --x:rgba(0,0,0,.1); }\n" \
           ".b{ fill:url(#grad1); border-color:transparent; color:currentColor; }"
    cases.append(("token/var＋:root 字面值＋url(#)＋transparent → ALLOW", scan_css(good) == []))
    bads = [
        ("hex #fff", ".x{ color:#fff; }", "#fff"),
        ("hex #e7f6ef", ".x{ background:#e7f6ef; }", "#e7f6ef"),
        ("rgba()", ".x{ box-shadow:0 1px 3px rgba(51,49,46,.05); }", "rgba("),
        ("hsl()", ".x{ color:hsl(120,50%,50%); }", "hsl("),
        ("named white", ".x{ color: white; }", "white"),
    ]
    for label, css, _ in bads:
        cases.append((f"硬編色『{label}』→ DENY", len(scan_css(css)) > 0))
    # 紅隊：:root 內的字面值豁免，但一般規則內同樣字面值要擋
    mixed = ":root{ --c:#abc; }\n.y{ color:#abc; }"
    cases.append((":root 豁免但規則內 #abc 仍 DENY", len(scan_css(mixed)) == 1))
    # 紅隊：`white-space` 屬性名不得被當具名色誤判；值位 `white` 仍要擋
    cases.append(("white-space:nowrap 不誤判（FP 防護）", scan_css(".x{ white-space:nowrap; }") == []))
    cases.append(("值位 color:white 仍 DENY", len(scan_css(".x{ color:white; }")) == 1))
    ok = True
    for msg, good_ in cases:
        print(f"  [{'OK' if good_ else 'BAD'}] {msg}"); ok = ok and good_
    print("RESULT:", "PASS ✅" if ok else "FAIL ❌")
    return ok


def main():
    ap = argparse.ArgumentParser(description="AC-STYLE-2 硬編色 lint（fail-closed）")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("files", nargs="*")
    a = ap.parse_args()
    if a.selftest:
        print("=== style_token_lint --selftest ===")
        sys.exit(0 if _selftest() else 2)
    if a.verify or a.files:
        targets = [os.path.abspath(f) for f in a.files] if a.files else default_targets()
        seen, hits = run(targets)
        if seen == 0:
            print("[style_token_lint] fail-closed：掃不到任何目標檔"); sys.exit(NOTHING)
        for rel, ln, frag in hits[:80]:
            print(f"  [color] {rel}:{ln} → 硬編色『{frag}』應改 var(--token)")
        print(f"RESULT(AC-STYLE-2): {'PASS ✅' if not hits else 'FAIL ❌'}"
              f"（掃 {seen} 檔，硬編色命中 {len(hits)}）")
        sys.exit(0 if not hits else min(len(hits), 98))
    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    main()
