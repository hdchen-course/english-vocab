#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""nav_gate.py — AC-NAV 的資料層 fail-closed gate（§6.1/§6.7 導覽資料一致性）。

驗 `authoring/nav_index.json`（hub 首屏唯一讀的輕量導覽檔，R9/ND）對 `knowledge_points.json` 的一致性，
並守 ND 漸進揭露不變量。渲染層（rendered nav DOM 吻合資料）另由 render gate 把關；本 gate 管資料正確。

斷言：
  (1) ND：island_count ＝ len(islands) 且 ≤ 12（§6.1 頂層島上限）。
  (2) 總數守恆：minimum_total ＝ Σ island.min_count ＝ manifest 非 beyond 條數；beyond_total ＝ manifest beyond 條數。
  (3) 每島：strand_count ＝ len(strands)；min_count ＝ Σ strand.min_count；title_zh 存在。
  (4) 每 strand：title_zh 存在且 **≠ strand slug**（中文正名完成、無 needs_review 洩漏到 learner）；
      Σ tiers.values() ＝ min_count ＋ beyond_count（tier 計數含 min＋beyond）。
  (5) 配對雙射：nav 的 (domain,strand) 集合 ＝ manifest 實際出現的集合（無懸空、無遺漏）。
  (6) subject_labels/strand_labels 鍵集合涵蓋 manifest（每鍵恰一、無過時多餘鍵）。

介面：--selftest；--verify。EXIT：0=過；1=違規；2=selftest 失敗。
"""
import argparse, collections, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "authoring")
MAX_ISLANDS = 12


def manifest_pairs_counts(items):
    pairs = set()
    minc = 0
    beyondc = 0
    for r in items:
        d = r["id"].split(".")[0]; s = r.get("strand", "")
        pairs.add((d, s))
        if r.get("beyond"): beyondc += 1
        else: minc += 1
    return pairs, minc, beyondc


def check(nav, items, subject_labels=None, strand_labels=None):
    probs = []
    islands = nav.get("islands", [])
    # (1)
    if nav.get("island_count") != len(islands):
        probs.append(f"island_count {nav.get('island_count')} ≠ 實際島數 {len(islands)}")
    if len(islands) > MAX_ISLANDS:
        probs.append(f"頂層島數 {len(islands)} > ND 上限 {MAX_ISLANDS}")
    # (2)
    pairs, minc, beyondc = manifest_pairs_counts(items)
    sum_min = sum(i.get("min_count", 0) for i in islands)
    if nav.get("minimum_total") != minc:
        probs.append(f"minimum_total {nav.get('minimum_total')} ≠ manifest 非 beyond {minc}")
    if sum_min != minc:
        probs.append(f"Σ island.min_count {sum_min} ≠ manifest 非 beyond {minc}")
    if nav.get("beyond_total") != beyondc:
        probs.append(f"beyond_total {nav.get('beyond_total')} ≠ manifest beyond {beyondc}")
    # (3)(4)(5)
    nav_pairs = set()
    for isl in islands:
        d = isl.get("island")
        strands = isl.get("strands", [])
        if isl.get("strand_count") != len(strands):
            probs.append(f"島 {d} strand_count {isl.get('strand_count')} ≠ {len(strands)}")
        if isl.get("min_count") != sum(s.get("min_count", 0) for s in strands):
            probs.append(f"島 {d} min_count 與 strand 加總不符")
        if not isl.get("title_zh"):
            probs.append(f"島 {d} 缺 title_zh")
        for s in strands:
            slug = s.get("strand", "")
            nav_pairs.add((d, slug))
            tz = s.get("title_zh", "")
            if not tz:
                probs.append(f"{d}/{slug} 缺 title_zh")
            elif tz == slug:
                probs.append(f"{d}/{slug} title_zh 仍為 slug（中文正名未完成/洩漏）")
            tsum = sum(s.get("tiers", {}).values())
            if tsum != s.get("min_count", 0) + s.get("beyond_count", 0):
                probs.append(f"{d}/{slug} tiers 加總 {tsum} ≠ min+beyond {s.get('min_count',0)+s.get('beyond_count',0)}")
    # (5) 雙射
    for p in sorted(pairs - nav_pairs):
        probs.append(f"manifest 配對 {p} 未出現在 nav（遺漏）")
    for p in sorted(nav_pairs - pairs):
        probs.append(f"nav 配對 {p} 不在 manifest（懸空）")
    # (6) label 鍵覆蓋
    if strand_labels is not None:
        want = {f"{d}\u001f{s}" for (d, s) in pairs}
        have = set(strand_labels.keys())
        for k in sorted(want - have): probs.append(f"strand_labels 缺鍵 {k!r}")
        for k in sorted(have - want): probs.append(f"strand_labels 多餘/過時鍵 {k!r}")
    if subject_labels is not None:
        wantd = {d for (d, _) in pairs}
        haved = set(subject_labels.keys())
        for k in sorted(wantd - haved): probs.append(f"subject_labels 缺域 {k!r}")
        for k in sorted(haved - wantd): probs.append(f"subject_labels 多餘域 {k!r}")
    return probs


def _selftest():
    items = [{"id": "eng.t_base.verb.a", "strand": "verb"},
             {"id": "eng.t_mid.verb.b", "strand": "verb"},
             {"id": "math.t_adv.geom.c", "strand": "geom", "beyond": True}]
    nav_good = {"island_count": 2, "minimum_total": 2, "beyond_total": 1, "islands": [
        {"island": "eng", "title_zh": "英語文", "strand_count": 1, "min_count": 2,
         "strands": [{"strand": "verb", "title_zh": "動詞與時態", "min_count": 2, "beyond_count": 0, "tiers": {"t_base": 1, "t_mid": 1}}]},
        {"island": "math", "title_zh": "數學", "strand_count": 1, "min_count": 0,
         "strands": [{"strand": "geom", "title_zh": "幾何", "min_count": 0, "beyond_count": 1, "tiers": {"t_adv": 1}}]},
    ]}
    sl = {"eng\u001fverb": {"title_zh": "動詞與時態"}, "math\u001fgeom": {"title_zh": "幾何"}}
    subj = {"eng": {}, "math": {}}
    results = [("好例 → ALLOW", check(nav_good, items, subj, sl) == [])]
    import copy
    b = copy.deepcopy(nav_good); b["islands"][0]["strands"][0]["title_zh"] = "verb"
    results.append(("strand title 仍為 slug → DENY", any("slug" in p for p in check(b, items, subj, sl))))
    b = copy.deepcopy(nav_good); b["minimum_total"] = 99
    results.append(("minimum_total 不符 → DENY", any("minimum_total" in p for p in check(b, items, subj, sl))))
    b = copy.deepcopy(nav_good); b["islands"][0]["strands"][0]["tiers"] = {"t_base": 5}
    results.append(("tiers 加總不符 → DENY", any("tiers 加總" in p for p in check(b, items, subj, sl))))
    b = copy.deepcopy(nav_good); b["island_count"] = 2
    b["islands"] = b["islands"] + [{"island": "x%d" % i, "title_zh": "x", "strand_count": 0, "min_count": 0, "strands": []} for i in range(13)]
    b["island_count"] = len(b["islands"])
    results.append(("島數 > 12 → DENY", any("ND 上限" in p for p in check(b, items, subj, sl))))
    b = copy.deepcopy(nav_good); del b["islands"][1]["strands"][0]  # 移除 geom → 遺漏配對
    b["islands"][1]["strand_count"] = 0
    results.append(("manifest 配對遺漏 → DENY", any("遺漏" in p for p in check(b, items, subj, sl))))
    allok = True
    for msg, ok in results:
        print(f"  [{'OK' if ok else 'BAD'}] {msg}"); allok = allok and ok
    return allok


def main():
    ap = argparse.ArgumentParser(description="AC-NAV 資料層 gate（fail-closed）")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--verify", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        print("=== nav_gate --selftest ===")
        ok = _selftest(); print("RESULT:", "PASS ✅" if ok else "FAIL ❌"); sys.exit(0 if ok else 2)
    if args.verify:
        nav = json.loads(open(os.path.join(A, "nav_index.json"), encoding="utf-8").read())
        items = json.loads(open(os.path.join(A, "knowledge_points.json"), encoding="utf-8").read())["items"]
        sl = json.loads(open(os.path.join(A, "strand_labels.json"), encoding="utf-8").read())
        subj = json.loads(open(os.path.join(A, "subject_labels.json"), encoding="utf-8").read())
        probs = check(nav, items, subj, sl)
        for p in probs:
            print(f"  [nav] {p}")
        print(f"RESULT(AC-NAV): {'PASS ✅' if not probs else 'FAIL ❌'}（{len(nav.get('islands', []))} 島，違規 {len(probs)}）")
        sys.exit(0 if not probs else 1)
    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    main()
