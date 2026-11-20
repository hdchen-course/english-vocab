#!/usr/bin/env python3
"""PRC-term gate — catch China-locale terms written in Traditional characters.

The scan_simplified gate only catches Simplified *characters*. The biggest
locale blind spot (banked lesson: memory terminology-china-not-mainland) is a
China term written with Traditional glyphs — e.g. 屏幕 (PRC) where Taiwan uses
螢幕 / optics 屏・光屏. Those pass scan_simplified yet violate the site's
"zero PRC terms" iron rule, and until now only the (expensive, non-deterministic)
content_audit panel caught them (it caught 屏幕 x16 in plane-mirror on round 4).

This gate makes the unambiguous subset DETERMINISTIC and cheap, so a unit's
phase-1 self-check fails fast before freezing instead of burning audit rounds.

Usage:
    python3 -I tools/prc_term_gate.py <file1> [<file2> ...]
    python3 -I tools/prc_term_gate.py --verify            # scan every *.units.json

Exit code = number of HARD hits (0 = clean). Prints each hit's term + the
Taiwan replacement + the file + a short surrounding snippet.

Scope discipline: only UNAMBIGUOUS PRC terms with a clean Taiwan equivalent are
HARD. Context-dependent words (大陸 can be 亞洲大陸=continent, 水平 can be a real
word, 數據/質量/程序 overlap technical usage) are deliberately NOT listed here —
they stay with the content_audit panel to avoid false positives. Add a term here
ONLY once you are sure it is never legitimate in this corpus.
"""
import json
import re
import sys
import glob
import os

# term -> Taiwan replacement (note). HARD: unambiguous, always wrong here.
HARD = {
    "屏幕": "螢幕 / 光學投影屏作「屏・光屏」",
    "軟件": "軟體",
    "硬件": "硬體",
    "視頻": "影片",
    "網絡": "網路",
    "信息": "資訊",
    "服務器": "伺服器",
    "數據庫": "資料庫",
    "內存": "記憶體",
    "硬盤": "硬碟",
    "打印": "列印",
    "字節": "位元組",
    "調試": "除錯",
    "菜單": "選單",
    "單擊": "點選",
    "登錄": "登入",
    "賬號": "帳號",
    "短信": "簡訊",
    "鼠標": "滑鼠",
    "激光": "雷射",
    "博客": "部落格",
    "塑料": "塑膠",
    "自行車": "腳踏車",
    "公交車": "公車",
    "出租車": "計程車",
    "土豆": "馬鈴薯",
    "西紅柿": "番茄",
    "幼兒園": "幼稚園",
    "代碼": "程式碼",
    "默認": "預設",
    "鼠標": "滑鼠",
    "互聯網": "網際網路",
    "攝像頭": "攝影機／鏡頭",
    "分辨率": "解析度",
}


def scan_text(text):
    hits = []
    for term, repl in HARD.items():
        start = 0
        while True:
            i = text.find(term, start)
            if i < 0:
                break
            snippet = text[max(0, i - 12):i + len(term) + 12].replace("\n", " ")
            hits.append((term, repl, snippet))
            start = i + len(term)
    return hits


def scan_file(path):
    try:
        raw = open(path, encoding="utf-8").read()
    except Exception as e:
        print(f"  ?? cannot read {path}: {e}")
        return []
    # scan the raw text so it works for both .units.json and .html
    return scan_text(raw)


def main():
    args = [a for a in sys.argv[1:]]
    if not args:
        print("usage: prc_term_gate.py <file...> | --verify")
        sys.exit(0)
    if args == ["--verify"]:
        files = sorted(glob.glob("*.units.json"))
    else:
        files = args
    total = 0
    for f in files:
        if not os.path.exists(f):
            continue
        hits = scan_file(f)
        for term, repl, snip in hits:
            total += 1
            print(f"  ✗ {os.path.basename(f)}: PRC詞「{term}」→「{repl}」  …{snip}…")
    if total == 0:
        print("RESULT: PASS ✅  (no HARD PRC terms)")
    else:
        print(f"RESULT: FAIL ❌  {total} HARD PRC-term hit(s)")
    sys.exit(total)


if __name__ == "__main__":
    main()
