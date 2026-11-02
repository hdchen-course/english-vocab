#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build_status.py — 學習路徑建置「自我稽核」清單（single source of truth for 進度）。

目的（HD 2026-11-02）：計畫不能只是散文。把**權威 KP 母體**（`authoring/knowledge_points.json`，
3103 條＝「該存在什麼」的 binding 清單）對照**實際單元**（`*.units.json`）與**收斂 ledger**
（`authoring/page_converge_ledger.json` 的 per-page 5-clean），逐 domain×strand 算出：
  - binding KP 數（beyond=false／非 t_enrich）
  - 已被單元「真教真考」覆蓋的 KP 數（teach/practice 的 kp_ids 命中）
  - 已建單元數、已 5-clean 收斂的頁數
→ 一個指令看到「哪些建了／哪些還沒建／哪些還沒收斂」，**無法假裝完成**（數字由實檔現算、不手寫）。

這是 spec §1.4／§11.A AC-COV-1（minimum 覆蓋矩陣 100%）與 AC-UNIT-2（每頁 5-clean）的
人可讀前置視圖；真正擋關仍是 coverage_gate／per_page_5clean_gate（本工具不取代 gate，是儀表板）。

用法：
  python3 -I tools/build_status.py              # 印全站矩陣（人可讀）
  python3 -I tools/build_status.py --domain eng # 只看某 domain 的 per-strand 細項
  python3 -I tools/build_status.py --json       # 機器可讀 JSON（供其他工具/CI 消費）
EXIT：恆 0（儀表板，非 gate）。
"""
import argparse, glob, json, os, collections, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_kp():
    m = json.load(open(os.path.join(ROOT, "authoring", "knowledge_points.json"), encoding="utf-8"))
    return m if isinstance(m, list) else (m.get("items") or m.get("knowledge_points") or [])


def strand_of(kid):
    p = kid.split(".")
    return p[2] if len(p) >= 3 else "?"


def load_converged_pages():
    """回傳已達 required_clean 連續 clean 的 page 集合（儘量寬鬆解析，缺檔＝空集）。"""
    p = os.path.join(ROOT, "authoring", "page_converge_ledger.json")
    if not os.path.exists(p):
        return set(), 0
    try:
        d = json.load(open(p, encoding="utf-8"))
    except Exception:
        return set(), 0
    need = d.get("required_clean", 5)
    pages = d.get("pages") or d.get("records") or {}
    done = set()
    if isinstance(pages, dict):
        for page, rec in pages.items():
            rounds = rec.get("rounds", []) if isinstance(rec, dict) else []
            streak = sum(1 for r in rounds[-need:] if r.get("clean") is True and r.get("l3_exit") == 0)
            if len(rounds) >= need and streak >= need:
                done.add(page)
    return done, need


def collect():
    kp = load_kp()
    # binding（非 beyond）KP by (domain, strand)
    binding = collections.defaultdict(set)
    for k in kp:
        if not isinstance(k, dict):
            continue
        if k.get("beyond"):
            continue
        binding[(k["domain"], strand_of(k["id"]))].add(k["id"])
    # 已覆蓋 KP + 單元數 by (domain, strand)；單元的 domain 取 subject 欄，strand 取 strand 欄
    covered = collections.defaultdict(set)
    units_cnt = collections.Counter()
    pages = collections.defaultdict(set)   # (domain,strand) -> set(page)
    kp_domain = {k["id"]: k["domain"] for k in kp if isinstance(k, dict)}
    for f in glob.glob(os.path.join(ROOT, "*.units.json")):
        d = json.load(open(f, encoding="utf-8"))
        page = d.get("page") or os.path.basename(f)
        for u in d.get("units", []):
            dom = u.get("subject") or "?"
            st = u.get("strand") or "?"
            units_cnt[(dom, st)] += 1
            pages[(dom, st)].add(page)
            for seg in (u.get("teach", []) or []) + (u.get("practice", []) or []):
                for kid in seg.get("kp_ids", []) or []:
                    covered[(kp_domain.get(kid, dom), strand_of(kid))].add(kid)
    conv_pages, need = load_converged_pages()
    return binding, covered, units_cnt, pages, conv_pages, need


def build_rows():
    binding, covered, units_cnt, pages, conv_pages, need = collect()
    keys = sorted(set(binding) | set(units_cnt), key=lambda k: (k[0], -len(binding.get(k, set()))))
    rows = []
    for (dom, st) in keys:
        tot = len(binding.get((dom, st), set()))
        cov = len(covered.get((dom, st), set()) & binding.get((dom, st), set()))
        pgs = pages.get((dom, st), set())
        conv = len(pgs & conv_pages)
        rows.append({"domain": dom, "strand": st, "kp_binding": tot, "kp_covered": cov,
                     "kp_missing": tot - cov, "units": units_cnt.get((dom, st), 0),
                     "pages": len(pgs), "pages_converged": conv})
    return rows, need


def main():
    ap = argparse.ArgumentParser(description="學習路徑建置自我稽核清單")
    ap.add_argument("--domain")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    rows, need = build_rows()
    if a.domain:
        rows = [r for r in rows if r["domain"] == a.domain]
    if a.json:
        print(json.dumps({"required_clean": need, "rows": rows}, ensure_ascii=False, indent=1)); return
    # 人可讀
    bydom = collections.defaultdict(list)
    for r in rows:
        bydom[r["domain"]].append(r)
    print("=== 學習路徑建置自我稽核（數字由實檔現算，無法手寫假裝）===")
    print(f"    KP母體＝authoring/knowledge_points.json（binding＝非 beyond/t_enrich）；收斂＝page_converge_ledger 連續 {need} clean\n")
    gtot = gcov = gunits = gpg = gconv = 0
    print(f"{'domain':9} {'strand':14} {'KP':>4} {'覆蓋':>4} {'缺':>4} {'單元':>4} {'頁':>3} {'已收斂頁':>6}")
    for dom in sorted(bydom):
        dt = dc = du = dp = dcv = 0
        for r in bydom[dom]:
            mark = "" if r["kp_missing"] == 0 else "  ← 缺"
            print(f"{dom:9} {r['strand']:14} {r['kp_binding']:4} {r['kp_covered']:4} "
                  f"{r['kp_missing']:4} {r['units']:4} {r['pages']:3} {r['pages_converged']:6}{mark}")
            dt += r["kp_binding"]; dc += r["kp_covered"]; du += r["units"]; dp += r["pages"]; dcv += r["pages_converged"]
        print(f"{dom:9} {'— 小計 —':14} {dt:4} {dc:4} {dt-dc:4} {du:4} {dp:3} {dcv:6}\n")
        gtot += dt; gcov += dc; gunits += du; gpg += dp; gconv += dcv
    print(f"{'全站':9} {'TOTAL':14} {gtot:4} {gcov:4} {gtot-gcov:4} {gunits:4} {gpg:3} {gconv:6}")
    pct = (gcov * 100 // gtot) if gtot else 0
    print(f"\n內容覆蓋：{gcov}/{gtot} binding KP（{pct}%）；未覆蓋 {gtot-gcov}。"
          f" 收斂頁：{gconv}/{gpg}。")
    print("「完成」定義＝spec §11.A 23 條 AC 全綠（AC-COV-1 覆蓋=100% ＋ AC-UNIT-2 每頁 5-clean ＋ …）；"
          "本表只要『缺』或『已收斂頁<頁』非零，即尚未完成。")


if __name__ == "__main__":
    main()
