#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""no_grade_label_gate.py — AC-NOGRADE / R11 的 fail-closed gate。

鐵律 R11：**learner 端永不顯示年段**（不出現「幾年級／國小X年級／國中一／高中三／grade N」等就學階段標記）。
學習以能力分級（初階／中階／高階／銜接／延伸＝tier，屬難度非年段）呈現，不綁年級，避免「我才小三不能學」的自我設限。

本 gate 掃 learner-facing 檔（預設 index_new.html ＋ §6.7 衍生檔 nav_index/subject_labels/strand_labels），
以**高精度** deny 樣式抓年段洩漏；tier 詞（初階/中階/高階/銜接/延伸）明確允許、不誤判。

介面：--selftest（離線好例 ALLOW／各壞例 DENY）；--verify [檔...]（預設掃 learner-facing 檔集）。
EXIT：0=無年段洩漏；1=有；2=selftest 失敗。
"""
import argparse, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# AC-NOGRADE（R11）範疇＝學習路徑 learner-facing 頁面：hub（index_new.html）＋其導覽資料
# ＋已建的學習路徑學習單元（english_*.html，共 100+）。**不含 legacy 舊站頁**（live index.html／
# number_theory.html／geometry.html… 等，屬 strangler-fig 待汰換的舊站，其年段洩漏列入 standing-audit
# backlog、非學習路徑 Phase 1 gate 範疇）。由 glob 自動納入所有 english_* 學習單元，避免漏掃新單元。
import glob as _glob
DEFAULT_TARGETS = [
    os.path.join(ROOT, "index_new.html"),
    os.path.join(ROOT, "authoring", "nav_index.json"),
    os.path.join(ROOT, "authoring", "subject_labels.json"),
    os.path.join(ROOT, "authoring", "strand_labels.json"),
] + sorted(_glob.glob(os.path.join(ROOT, "english_*.html")))

# 高精度年段樣式（繁體）；只抓明確就學階段標記，避免「高一點／小一塊」等誤判。
GRADE_PATTERNS = [
    (re.compile(r"[一二三四五六七八九十\d]\s*年級"), "『N 年級』"),
    (re.compile(r"年段"), "『年段』"),
    (re.compile(r"幾年級"), "『幾年級』"),
    (re.compile(r"\b[Gg]rade\s*\d", re.I), "『grade N』"),
    (re.compile(r"\bG(?:[1-9]|1[0-2])\b"), "『G1–G12』"),
    # 就學階段＋序數簡寫；負向 lookahead 排除「高一點/高一層/小三塊」等非年段用法（fail-closed：寧誤擋）
    (re.compile(r"小[一二三四五六](?![點層樓些塊半天])"), "『小一～小六』就學階段簡寫"),
    (re.compile(r"[國高][一二三](?![點層樓些塊半天度])"), "『國一/高三』就學階段簡寫"),
]
# 明確允許詞（tier 難度級別，非年段）——若整段僅含這些不視為違規。
ALLOW_TOKENS = ("初階", "中階", "高階", "銜接", "延伸")

# learner 在瀏覽器永遠看不到的「非內容」區：HTML 註解、整行 JS 註解（行首 //）。
# 這些區塊常含 R11 自我說明（如「R11 不顯年段」「絕不出現年段」）——掃它們是 false-positive。
# 只移除「整行」註解：整行 // 註解不可能是 learner 可見的 JS 字串字面值，故無 string-literal 誤刪風險；
# 行尾 // 註解與 /* */ 區塊「不」移除（fail-closed 寧誤擋，避免誤刪 "https://…年級…" 這類字串字面值）。
_HTML_COMMENT = re.compile(r"<!--.*?-->", re.S)
_FULLLINE_JS_COMMENT = re.compile(r"(?m)^[ \t]*//.*$")


def strip_noncontent(text, path):
    """移除 learner 不可見的註解區（僅 .html/.js/.mjs；JSON 無註解不動）。"""
    ext = os.path.splitext(path)[1].lower()
    if ext not in (".html", ".htm", ".js", ".mjs"):
        return text
    text = _HTML_COMMENT.sub("", text)
    text = _FULLLINE_JS_COMMENT.sub("", text)
    return text


def scan_text(text):
    """回傳 [(pattern_desc, 命中字串)]。"""
    hits = []
    for rx, desc in GRADE_PATTERNS:
        for m in rx.finditer(text):
            frag = m.group(0)
            if frag in ALLOW_TOKENS:
                continue
            hits.append((desc, frag))
    return hits


def _selftest():
    results = []
    # 好例：tier 難度詞、科目名、strand 名——不得誤判
    good = "國語文 15 分區 初階 15 中階 9 高階 10 銜接 14 延伸 1 ｜ 自然科學 物理：光學"
    results.append(("tier/科目/strand 文字 → ALLOW", scan_text(good) == []))
    # 壞例
    bads = [
        ("適合小四學生", "小四"),
        ("國小三年級必學", "年級"),
        ("這是給國一的內容", "國一"),
        ("高三學測總複習", "高三"),
        ("grade 3 reading", "grade"),
        ("本單元屬 G7 範圍", "G7"),
        ("依年段分組", "年段"),
    ]
    for text, label in bads:
        results.append((f"年段洩漏『{label}』→ DENY", len(scan_text(text)) > 0))
    # 紅隊：learner 不可見的註解區不得誤判（strip 後 ALLOW）；但真正 learner 可見文字仍要 DENY。
    c_fullline = "  // R11 不顯年段：絕不出現年段\n  const TIER='初階';\n"
    results.append(("整行 // 註解提及『年段』→ ALLOW",
                    scan_text(strip_noncontent(c_fullline, "x.js")) == []))
    c_html = "<!-- TODO 年段 分組 -->\n<div>初階</div>\n"
    results.append(("HTML 註解提及『年段』→ ALLOW",
                    scan_text(strip_noncontent(c_html, "x.html")) == []))
    # strip 後，真正 DOM 可見的年段仍須被抓（註解剝除不得變成繞過）
    c_leak = "  // 說明\n<div class='card'>適合小四學生</div>\n"
    results.append(("DOM 可見『小四』(同檔有註解) → DENY",
                    len(scan_text(strip_noncontent(c_leak, "x.html"))) > 0))
    # 行尾 // 註解「不」剝除 → 仍 fail-closed 擋（寧誤擋，避免誤刪字串字面值）
    c_trailing = "let u='https://x/小四';\n"
    results.append(("行尾/字串字面值『小四』→ DENY(fail-closed)",
                    len(scan_text(strip_noncontent(c_trailing, "x.js"))) > 0))
    allok = True
    for msg, ok in results:
        print(f"  [{'OK' if ok else 'BAD'}] {msg}")
        allok = allok and ok
    return allok


def main():
    ap = argparse.ArgumentParser(description="AC-NOGRADE / R11 gate（fail-closed）")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("files", nargs="*")
    args = ap.parse_args()
    if args.selftest:
        print("=== no_grade_label_gate --selftest ===")
        ok = _selftest(); print("RESULT:", "PASS ✅" if ok else "FAIL ❌"); sys.exit(0 if ok else 2)
    if args.verify:
        targets = args.files or DEFAULT_TARGETS
        total = 0
        for path in targets:
            if not os.path.exists(path):
                print(f"  [skip] 不存在：{os.path.relpath(path, ROOT)}"); continue
            text = strip_noncontent(open(path, encoding="utf-8").read(), path)
            hits = scan_text(text)
            for desc, frag in hits:
                print(f"  [grade] {os.path.relpath(path, ROOT)}：{desc} → 命中「{frag}」")
            total += len(hits)
        print(f"RESULT(AC-NOGRADE): {'PASS ✅' if total == 0 else 'FAIL ❌'}（掃 {len(targets)} 檔，年段洩漏 {total}）")
        sys.exit(0 if total == 0 else 1)
    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    main()
