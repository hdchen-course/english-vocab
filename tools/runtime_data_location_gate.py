#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
runtime_data_location_gate.py — fail-closed gate

規則（HD 2026-11-09）：
  runtime 會載入的檔（repo 根的 *.html ＋ assets/*.js / *.mjs）**不得**把
  `authoring/<something>` 當成「要被瀏覽器載入的資源路徑」去 fetch / import / <script src> /
  <link href> / XHR.open / new URL(...)。

  理由：authoring/ 是 agent 的「工作區」，常駐 loop 會清理暫存/中間產物，放在那裡的
  runtime 資料有被誤刪的風險 → 線上 404（曾真的發生：speaking_nav_map.json）。
  runtime 資料一律放 repo 根的 data/（published、穩定）。

  只擋「被當資源路徑載入」的字串字面值；**註解裡提到 authoring/ 路徑是允許的**
  （例如衍生檔頂部的「由 authoring/X.json 生成」註解、對照表說明），因為那不是 runtime 載入。
  build-only SSOT（knowledge_points.json、speaking_cats.json、progkey_migration.json…）
  本來就不被 runtime fetch、被編譯成已 commit 的 assets/*.data.js，故不受此 gate 影響。

用法：
  python3 -I tools/runtime_data_location_gate.py --verify        # 掃全站 runtime 檔
  python3 -I tools/runtime_data_location_gate.py <file> [...]    # 掃指定檔
  python3 -I tools/runtime_data_location_gate.py --selftest      # 紅隊（壞案例擋、好案例放行）

exit code = 違規數（0 = CLEAN）；--selftest 專用 exit（0 = 紅隊通過）。
"""
import os
import re
import sys
import glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 被當「資源路徑」載入的語法，後面緊接一個 quoted 字串
LOAD_CTX = re.compile(
    r"""(?:fetch|import|require|XMLHttpRequest|\.open|new\s+URL|axios(?:\.\w+)?|\$\.(?:get|getJSON|ajax)|loadJSON|load)\s*\(\s*['"`]"""
    r"""|<script[^>]*\bsrc\s*=\s*['"]"""
    r"""|<link[^>]*\bhref\s*=\s*['"]"""
    r"""|\bsrc\s*=\s*['"]"""
    , re.IGNORECASE)

# 任意字串字面值裡含 authoring/<name>（.json/.js/.mjs/.css…或目錄）
AUTHORING_IN_STRING = re.compile(r"""['"`]([^'"`]*\bauthoring/[^'"`]*)['"`]""")


def strip_comments(text, is_html):
    """移除 // 行註解、/* */ 區塊註解；HTML 另移除 <!-- -->。粗略但足以避免把註解當程式。"""
    # 區塊註解 /* ... */
    text = re.sub(r"/\*.*?\*/", " ", text, flags=re.DOTALL)
    if is_html:
        text = re.sub(r"<!--.*?-->", " ", text, flags=re.DOTALL)
    out = []
    for line in text.splitlines():
        # 行註解 //（簡化：不處理字串內含 // 的極端情形；寧可少擋不誤放——
        # 但為 fail-closed，只有「// 之前沒有引號」才視為整行註解砍掉，否則保留整行）
        idx = line.find("//")
        if idx != -1 and ('"' not in line[:idx]) and ("'" not in line[:idx]) and ("`" not in line[:idx]):
            line = line[:idx]
        out.append(line)
    return "\n".join(out)


def scan_file(path):
    """回傳 violations: [(lineno, matched_string)]。"""
    viol = []
    try:
        with open(path, encoding="utf-8") as f:
            raw = f.read()
    except (OSError, UnicodeDecodeError):
        return viol
    is_html = path.lower().endswith((".html", ".htm"))
    code = strip_comments(raw, is_html)
    # 以行掃描，找「資源載入語法 + authoring/ 字串」
    lines = code.splitlines()
    for i, line in enumerate(lines, 1):
        if "authoring/" not in line:
            continue
        # 該行有載入語法，且有 authoring/ 在字串裡 → 違規
        if LOAD_CTX.search(line):
            for m in AUTHORING_IN_STRING.finditer(line):
                viol.append((i, m.group(1)))
        else:
            # 保守再檢：即使沒抓到明確載入語法，若 authoring/ 出現在 quoted 字串且像資源路徑，
            # 仍標為「疑似」——但為降低誤擋，只在字串以 authoring/ 開頭（相對資源路徑）時算違規。
            for m in AUTHORING_IN_STRING.finditer(line):
                s = m.group(1).strip()
                if s.startswith("authoring/") and re.search(r"\.(json|js|mjs|css|svg|png|jpg|webp|mp3|woff2?)$", s, re.I):
                    viol.append((i, s))
    return viol


def runtime_files():
    files = sorted(glob.glob(os.path.join(ROOT, "*.html")))
    files += sorted(glob.glob(os.path.join(ROOT, "assets", "*.js")))
    files += sorted(glob.glob(os.path.join(ROOT, "assets", "*.mjs")))
    return files


def run_verify(paths):
    total = 0
    for p in paths:
        viol = scan_file(p)
        if viol:
            rel = os.path.relpath(p, ROOT)
            for ln, s in viol:
                print(f"  VIOLATION  {rel}:{ln}  runtime 檔載入 authoring/ 資源 → 應改放 data/：{s}")
                total += 1
    if total == 0:
        print("[runtime_data_location_gate] CLEAN（0 violation）—— runtime 檔無載入 authoring/")
    else:
        print(f"[runtime_data_location_gate] {total} violation（runtime 檔不得 fetch/import/src authoring/；移到 data/）")
    return total


def selftest():
    import tempfile
    ok = True
    with tempfile.TemporaryDirectory() as d:
        # 壞案例：真的 fetch authoring/
        bad1 = os.path.join(d, "bad1.html")
        open(bad1, "w").write("<script>fetch('authoring/units_index.json').then(r=>r.json())</script>")
        bad2 = os.path.join(d, "bad2.js")
        open(bad2, "w").write("const u = await fetch(\"authoring/nav_index.json\"); // load map\n")
        bad3 = os.path.join(d, "bad3.html")
        open(bad3, "w").write('<script src="authoring/foo.js"></script>')
        # 好案例：data/ 載入 + 註解提到 authoring/（應放行）
        good1 = os.path.join(d, "good1.js")
        open(good1, "w").write(
            "// 衍生檔，由 authoring/progkey_migration.json 生成\n"
            "const u = await fetch('data/units_index.json');\n"
            "/* 對照表：authoring/progkey_migration.json → window.X */\n")
        good2 = os.path.join(d, "good2.html")
        open(good2, "w").write('<!-- source: authoring/speaking_cats.json -->\n<script src="data/x.js"></script>')

        bad_hits = sum(len(scan_file(p)) for p in (bad1, bad2, bad3))
        good_hits = sum(len(scan_file(p)) for p in (good1, good2))
        print(f"[selftest] 壞案例命中={bad_hits}（期望 >=3），好案例命中={good_hits}（期望 0）")
        if bad_hits < 3:
            print("  FAIL：壞案例未被擋"); ok = False
        if good_hits != 0:
            print("  FAIL：好案例被誤擋"); ok = False
    print("[selftest] PASS ✅ 紅隊通過（壞案例擋、好案例放行）" if ok else "[selftest] FAIL ❌")
    return 0 if ok else 1


def main(argv):
    if "--selftest" in argv:
        return selftest()
    if "--verify" in argv or len(argv) == 0:
        return run_verify(runtime_files())
    paths = [a if os.path.isabs(a) else os.path.join(ROOT, a) for a in argv if not a.startswith("--")]
    return run_verify(paths)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
