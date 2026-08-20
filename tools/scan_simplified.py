#!/usr/bin/env python3
"""
scan_simplified.py — deterministic Simplified-Chinese gate for the 公館國小 e-book.

WHY THIS EXISTS
  Review agents kept getting killed by an output content-filter when their
  scan scripts embedded Simplified glyphs as a comparison table. This scanner
  defines its blocklist purely by Unicode CODE POINTS (integers), so neither
  the source nor the output ever contains a Simplified glyph. Output is
  file:line + U+codepoint + count only — safe to print and to read.

WHAT IT CHECKS
  1. Presence of common Simplified-only characters (curated, unambiguous set;
     ambiguous shared chars like U+540E / U+4E0E are intentionally omitted to
     avoid false positives).
  2. That every scanned .html declares lang="zh-TW".

USAGE
  python3 tools/scan_simplified.py [file ...]
  (no args → scans a sensible default set of the K-12 pages + shared assets)

EXIT CODE
  0 = clean (ship-gate pass), 1 = suspect Simplified found (fail).
"""
import sys, glob, re, os

# Curated Simplified-ONLY code points -> Traditional counterpart (Traditional
# glyphs are allowed; NO Simplified glyph appears anywhere in this file).
SIMPLIFIED = {
    0x4EEC: "們", 0x8FD9: "這", 0x8BF4: "說", 0x56FD: "國", 0x65F6: "時",
    0x8FC7: "過", 0x4E1C: "東", 0x8F66: "車", 0x957F: "長", 0x95E8: "門",
    0x95EE: "問", 0x5F00: "開", 0x5173: "關", 0x5BF9: "對", 0x8BDD: "話",
    0x5E94: "應", 0x56FE: "圖", 0x4E66: "書", 0x5355: "單", 0x8FB9: "邊",
    0x5904: "處", 0x987A: "順", 0x4E3E: "舉", 0x8FBE: "達", 0x4F18: "優",
    0x51FB: "擊", 0x51CF: "減", 0x5F52: "歸", 0x590D: "復", 0x4E60: "習",
    0x5386: "歷", 0x4E49: "義", 0x4E50: "樂", 0x7231: "愛", 0x4EB2: "親",
    0x8282: "節", 0x5E86: "慶", 0x533A: "區", 0x4F17: "眾", 0x7EE7: "繼",
    0x7EED: "續", 0x8D28: "質", 0x53D8: "變", 0x6570: "數", 0x9A6C: "馬",
    0x4E70: "買", 0x5356: "賣", 0x534E: "華", 0x4E3D: "麗", 0x8BA9: "讓",
    0x8BA4: "認", 0x8BC6: "識", 0x8BED: "語", 0x8BFB: "讀", 0x6C49: "漢",
    0x8BCD: "詞", 0x7535: "電", 0x8111: "腦", 0x4F1A: "會", 0x4E2A: "個",
    0x4E3A: "為", 0x5B66: "學", 0x672F: "術", 0x94F6: "銀", 0x94B1: "錢",
    0x5C81: "歲", 0x4E07: "萬", 0x65E0: "無", 0x4ECE: "從", 0x6765: "來",
    0x6837: "樣", 0x73B0: "現", 0x5B9E: "實", 0x53D1: "發", 0x7ECF: "經",
    0x6D4E: "濟", 0x9898: "題", 0x8BFE: "課", 0x7EC3: "練", 0x8BB0: "記",
    0x5FC6: "憶", 0x4EBF: "億", 0x529E: "辦", 0x7B14: "筆", 0x7EA2: "紅",
    0x7EFF: "綠", 0x8D25: "敗", 0x8FDB: "進", 0x8FD0: "運",
    0x9F99: "龍", 0x9E1F: "鳥", 0x9C7C: "魚", 0x513F: "兒",
    0x53F0: "臺",  # 台 is tolerated in TW too; report as info, not hard-fail
}
# Code points to report only as INFO (accepted in Taiwan usage), never fail on.
INFO_ONLY = {0x53F0}

DEFAULT_FILES = [
    "index.html", "home.html", "math.html", "multiply.html",
    "number_theory.html", "chinese.html", "game_core.js", "game_core.css",
    "assets/app.css", "vocab_data_coca_L1.js",
]

def scan(paths):
    fails, infos, lang_fail = {}, {}, []
    for p in paths:
        if not os.path.exists(p):
            print(f"  MISSING: {p}")
            continue
        txt = open(p, encoding="utf-8", errors="replace").read()
        for i, line in enumerate(txt.splitlines(), 1):
            for ch in line:
                cp = ord(ch)
                if cp in SIMPLIFIED:
                    bucket = infos if cp in INFO_ONLY else fails
                    bucket.setdefault(p, {}).setdefault(cp, []).append(i)
        # Accept any Traditional-Chinese lang tag: zh-TW, zh-Hant, zh-Hant-TW.
        if p.endswith(".html") and not re.search(r'lang="zh-(TW|Hant)', txt):
            lang_fail.append(p)
    return fails, infos, lang_fail

def main():
    args = sys.argv[1:]
    paths = []
    for a in args:
        paths.extend(sorted(glob.glob(a)) or [a])
    paths = paths or DEFAULT_FILES

    fails, infos, lang_fail = scan(paths)

    print("=== Simplified-Chinese scan (codepoints only, no glyphs) ===")
    for p in paths:
        if p in fails:
            parts = [f"U+{cp:04X}(→{SIMPLIFIED[cp]})×{len(ls)}@L{ls[:6]}" for cp, ls in sorted(fails[p].items())]
            print(f"  FAIL {p}: " + "; ".join(parts))
        elif os.path.exists(p):
            print(f"  ok   {p}")
    if infos:
        for p, d in infos.items():
            print(f"  info {p}: " + "; ".join(f"U+{cp:04X}(→{SIMPLIFIED[cp]})×{len(ls)}" for cp, ls in d.items()))
    if lang_fail:
        print("  lang FAIL (missing lang=\"zh-TW\"): " + ", ".join(lang_fail))

    ok = not fails and not lang_fail
    print("RESULT:", "PASS ✅" if ok else "FAIL ❌")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(main())
