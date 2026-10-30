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
DEFAULT_TARGETS = [
    os.path.join(ROOT, "index_new.html"),
    os.path.join(ROOT, "authoring", "nav_index.json"),
    os.path.join(ROOT, "authoring", "subject_labels.json"),
    os.path.join(ROOT, "authoring", "strand_labels.json"),
]

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
            text = open(path, encoding="utf-8").read()
            hits = scan_text(text)
            for desc, frag in hits:
                print(f"  [grade] {os.path.relpath(path, ROOT)}：{desc} → 命中「{frag}」")
            total += len(hits)
        print(f"RESULT(AC-NOGRADE): {'PASS ✅' if total == 0 else 'FAIL ❌'}（掃 {len(targets)} 檔，年段洩漏 {total}）")
        sys.exit(0 if total == 0 else 1)
    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    main()
