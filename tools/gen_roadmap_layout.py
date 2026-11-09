#!/usr/bin/env python3
"""gen_roadmap_layout.py — Phase 2 產物：從 units_index + 各 sidecar 的 prerequisites
確定性預生成 roadmap 佈局（節點座標 / 先備 DAG 邊 / 收合群組邊界）。

spec §6.7 line 611：`roadmap_layout.json` = roadmap 節點座標/連線(先備 DAG 邊)/收合群組邊界，
由「預生成佈局工具（從 units_index 的 prerequisites）」產出，驗證＝viz-QA + 連線端點檢查。

用法：
  gen_roadmap_layout.py            # 產生 authoring/roadmap_layout.json
  gen_roadmap_layout.py --verify   # 只驗證既有檔（endpoint 解析 + 無環 + 無 self-loop），exit!=0 即 FAIL

座標模型（確定性、無隨機）：
  x 由 strand 欄位（strand.order）決定、y 由 tier 層（t_base→t_mid→t_adv→t_sub）決定，
  同一 (strand,tier) 桶內的多個單元沿 x 微量展開。收合群組＝每個 strand 一組，bbox 覆蓋其所有節點。
"""
import json, os, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UNITS_INDEX = os.path.join(ROOT, "data", "units_index.json")
NAV_INDEX   = os.path.join(ROOT, "data", "nav_index.json")
SUBJ_LABELS = os.path.join(ROOT, "data", "subject_labels.json")
OUT         = os.path.join(ROOT, "authoring", "roadmap_layout.json")

TIER_ORDER = {"t_base": 0, "t_mid": 1, "t_adv": 2, "t_sub": 3}
STRAND_W = 260      # 每個 strand 欄位寬
TIER_H   = 170      # 每個 tier 列高
NODE_DX  = 52       # 同桶內單元水平微展
PAD      = 36       # 收合群組 bbox 內距


def _load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def _prereqs_by_unit():
    """從所有 *.units.json sidecar 讀 prerequisites（units_index 不帶此欄）。"""
    out = {}
    for f in glob.glob(os.path.join(ROOT, "*.units.json")):
        for u in _load(f).get("units", []):
            out[u["unit_id"]] = list(u.get("prerequisites", []) or [])
    return out


def _parse_uid(uid):
    """eng.<tier>.<strand>.<slug> → (domain, tier, strand)。life.<cat>.<strand>.<slug> tier 不在 id。"""
    parts = uid.split(".")
    domain = parts[0]
    if domain == "life":
        return domain, None, (parts[2] if len(parts) >= 3 else "?")
    return domain, (parts[1] if len(parts) >= 2 else None), (parts[2] if len(parts) >= 3 else "?")


def build():
    units = _load(UNITS_INDEX)["units"]
    prereqs = _prereqs_by_unit()
    subj = _load(SUBJ_LABELS)
    nav = _load(NAV_INDEX)

    # strand → order（取 nav_index 的 island.strands[].order；缺則字典序）
    strand_order = {}
    strand_title = {}
    island_meta = {}
    for isl in nav.get("islands", []):
        island_meta[isl["island"]] = {"title_zh": isl.get("title_zh", isl["island"]), "order": isl.get("order", 99)}
        for s in isl.get("strands", []):
            strand_order[(isl["island"], s["strand"])] = s.get("order", 99)
            strand_title[(isl["island"], s["strand"])] = s.get("title_zh", s["strand"])

    # 依 island 聚合
    by_island = {}
    for u in units:
        domain, tier, strand = _parse_uid(u["unit_id"])
        island = subj.get(domain, {}).get("island", domain)
        by_island.setdefault(island, []).append((u, tier, strand))

    islands_out = []
    tot_nodes = tot_edges = 0
    for island in sorted(by_island, key=lambda i: island_meta.get(i, {}).get("order", 99)):
        rows = by_island[island]
        node_ids = {u["unit_id"] for (u, _, _) in rows}
        # strand 欄位索引（依 order）
        strands = sorted({s for (_, _, s) in rows},
                         key=lambda s: (strand_order.get((island, s), 99), s))
        col = {s: i for i, s in enumerate(strands)}
        # 同一 (strand,tier) 桶計數，決定桶內 x 微展
        bucket = {}
        nodes = []
        for (u, tier, strand) in sorted(rows, key=lambda r: (col[r[2]], TIER_ORDER.get(r[1], 9), r[0]["unit_id"])):
            tl = TIER_ORDER.get(tier, 9)
            key = (strand, tl)
            idx = bucket.get(key, 0); bucket[key] = idx + 1
            x = col[strand] * STRAND_W + idx * NODE_DX
            y = tl * TIER_H
            nodes.append({
                "unit_id": u["unit_id"], "strand": strand, "tier": tier,
                "title_zh": u.get("title_zh", ""), "x": x, "y": y,
            })
        # 收合群組：每 strand 一組，bbox 覆蓋節點
        groups = []
        for s in strands:
            sn = [n for n in nodes if n["strand"] == s]
            xs = [n["x"] for n in sn]; ys = [n["y"] for n in sn]
            groups.append({
                "group_id": f"{island}.{s}", "strand": s,
                "title_zh": strand_title.get((island, s), s),
                "bbox": {"x": min(xs) - PAD, "y": min(ys) - PAD,
                          "w": (max(xs) - min(xs)) + 2 * PAD, "h": (max(ys) - min(ys)) + 2 * PAD},
                "node_ids": [n["unit_id"] for n in sn],
            })
        # 邊：unit → 每個 prerequisite（僅島內、端點須存在）
        edges = []
        for n in nodes:
            for pr in prereqs.get(n["unit_id"], []):
                if pr in node_ids:
                    edges.append({"from": pr, "to": n["unit_id"]})
        tot_nodes += len(nodes); tot_edges += len(edges)
        islands_out.append({
            "island": island, "title_zh": island_meta.get(island, {}).get("title_zh", island),
            "order": island_meta.get(island, {}).get("order", 99),
            "collapse_groups": groups, "nodes": nodes, "edges": edges,
        })

    doc = {
        "_generated_by": "tools/gen_roadmap_layout.py（確定性，從 units_index + sidecar prerequisites）",
        "_verify": {"nodes": tot_nodes, "edges": tot_edges, "islands": len(islands_out)},
        "islands": islands_out,
    }
    return doc


def verify(doc):
    """endpoint 解析 + 無 self-loop + 無環（逐島）。回傳違規清單。"""
    errs = []
    for isl in doc["islands"]:
        ids = {n["unit_id"] for n in isl["nodes"]}
        adj = {}
        for e in isl["edges"]:
            if e["from"] not in ids:
                errs.append(f"[{isl['island']}] edge.from 不存在: {e['from']}")
            if e["to"] not in ids:
                errs.append(f"[{isl['island']}] edge.to 不存在: {e['to']}")
            if e["from"] == e["to"]:
                errs.append(f"[{isl['island']}] self-loop: {e['from']}")
            adj.setdefault(e["to"], []).append(e["from"])  # to 依賴 from
        # 無環（Kahn）
        indeg = {i: 0 for i in ids}
        for to, froms in adj.items():
            indeg[to] += len(froms)
        from collections import deque
        q = deque([i for i in ids if indeg[i] == 0]); seen = 0
        radj = {}
        for to, froms in adj.items():
            for fr in froms:
                radj.setdefault(fr, []).append(to)
        while q:
            n = q.popleft(); seen += 1
            for m in radj.get(n, []):
                indeg[m] -= 1
                if indeg[m] == 0:
                    q.append(m)
        if seen != len(ids):
            errs.append(f"[{isl['island']}] 有環（拓撲移除 {seen}/{len(ids)}）")
        # 每個收合群組 node_ids 皆為真節點
        for g in isl["collapse_groups"]:
            for nid in g["node_ids"]:
                if nid not in ids:
                    errs.append(f"[{isl['island']}] group {g['group_id']} 含不存在節點 {nid}")
    return errs


def main():
    if "--verify" in sys.argv:
        if not os.path.exists(OUT):
            print(f"[gen_roadmap_layout] FAIL：{OUT} 不存在"); sys.exit(2)
        doc = _load(OUT)
        errs = verify(doc)
        if errs:
            print(f"[gen_roadmap_layout] FAIL（{len(errs)} 違規）")
            for e in errs[:40]:
                print("  -", e)
            sys.exit(1)
        v = doc.get("_verify", {})
        print(f"[gen_roadmap_layout] CLEAN：nodes={v.get('nodes')} edges={v.get('edges')} islands={v.get('islands')}、endpoint 全解析、無 self-loop、無環")
        sys.exit(0)
    doc = build()
    errs = verify(doc)
    if errs:
        print(f"[gen_roadmap_layout] 產生後自驗 FAIL（{len(errs)} 違規）— 不寫出")
        for e in errs[:40]:
            print("  -", e)
        sys.exit(1)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)
    v = doc["_verify"]
    print(f"[gen_roadmap_layout] 寫出 {OUT}：nodes={v['nodes']} edges={v['edges']} islands={v['islands']}、自驗 CLEAN")


if __name__ == "__main__":
    main()
