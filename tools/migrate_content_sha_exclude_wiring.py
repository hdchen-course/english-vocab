#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""migrate_content_sha_exclude_wiring.py — 一次性遷移：把 page_converge_ledger.json 的
content_sha 由「舊算法（HTML+整個 sidecar bytes）」重新對應到「新算法（HTML+剝除純接線/排程
欄位後的教學正規化 bytes）」。

背景（HD 2026-11-10 裁示 B）：content_sha 改為排除 prerequisites/est_minutes/stage/reuse_pages
（純接線/排程 metadata，非教學內容），使「補先後順序」不再作廢已完成的教學 5-clean 證據。
但算法一變，既有 banked sha（舊算法）全部對不上 → 需重新對應。

忠實重鍵（不偽造）：對每頁
  old_cur = 舊算法指紋（本檔內重算，HTML + \\x00 + 原始 sidecar bytes）
  new_cur = 新算法指紋（import per_page_5clean_gate.content_sha）
  只把 round.content_sha == old_cur 的那些（＝「審在當前內容上」的輪，含 streak）改成 new_cur；
  其餘歷史輪（不同舊 sha）原樣保留（本來就不計入 streak，維持不變）。
  frozen_sha == old_cur 亦改 new_cur。
  clean / l3_exit / recorded_at 一律不動（不新增、不翻真，純換 sha 字串）。
教學內容未變 → streak 語意完全保留；遷移後 per_page --verify 應仍全數通過。

用法：
  python3 tools/migrate_content_sha_exclude_wiring.py --dry-run   # 只報告，不寫
  python3 tools/migrate_content_sha_exclude_wiring.py --apply     # 實際寫回 ledger
"""
import sys, os, json, hashlib, re, importlib.util

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = os.path.join(ROOT, "authoring", "page_converge_ledger.json")

# 載入新算法 content_sha
_spec = importlib.util.spec_from_file_location(
    "ppg", os.path.join(ROOT, "tools", "per_page_5clean_gate.py"))
_ppg = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_ppg)


def old_content_sha(path):
    """重算舊算法：sha256(HTML bytes + \\x00 + 原始 sidecar bytes)[:16]。"""
    with open(path, "rb") as f:
        html_bytes = f.read()
    sidecar_bytes = b""
    m = re.search(rb'data-units\s*=\s*"([^"]+)"', html_bytes)
    if m:
        side = os.path.join(os.path.dirname(path), m.group(1).decode("utf-8"))
        if os.path.exists(side):
            with open(side, "rb") as sf:
                sidecar_bytes = sf.read()
    h = hashlib.sha256()
    h.update(html_bytes)
    h.update(b"\x00")
    h.update(sidecar_bytes)
    return h.hexdigest()[:16]


def main(argv):
    apply = "--apply" in argv
    dry = "--dry-run" in argv or not apply
    d = json.load(open(LEDGER, encoding="utf-8"))
    pages = d.get("pages", {})
    n_pages = 0
    n_rounds = 0
    n_frozen = 0
    missing = []
    for page, rec in pages.items():
        path = os.path.join(ROOT, page)
        if not os.path.exists(path):
            missing.append(page)
            continue
        old_cur = old_content_sha(path)
        new_cur = _ppg.content_sha(path)
        if old_cur == new_cur:
            continue  # 無接線/排程欄位差異，指紋本就相同
        touched = False
        for r in rec.get("rounds", []) or []:
            if isinstance(r, dict) and r.get("content_sha") == old_cur:
                if apply:
                    r["content_sha"] = new_cur
                n_rounds += 1
                touched = True
        if rec.get("frozen_sha") == old_cur:
            if apply:
                rec["frozen_sha"] = new_cur
            n_frozen += 1
            touched = True
        if touched:
            n_pages += 1
    if apply:
        with open(LEDGER, "w", encoding="utf-8") as f:
            json.dump(d, f, ensure_ascii=False, indent=1)
    mode = "APPLIED" if apply else "DRY-RUN"
    print(f"[migrate content_sha] {mode}: pages touched={n_pages}, "
          f"rounds re-keyed={n_rounds}, frozen_sha re-keyed={n_frozen}, "
          f"missing-file pages={len(missing)}")
    if missing:
        print("  missing (skipped):", ", ".join(missing[:10]))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
