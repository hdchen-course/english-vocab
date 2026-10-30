#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""prereq_dag_gate.py — §6.1 先備關係 DAG 的 schema ＋ fail-closed 驗證 gate。

學習地圖要的不只是線性順序，而是「分區與分區之間的先備關係」（學 X 前要先會 Y）。本層定義**strand 級**先備 DAG
的資料契約與機器驗證；實際的先備邊由各科領域專家 authored 填入（正確性第一，不由啟發式亂猜）。本 gate 保證**無論誰填**，
邊都不會出錯：

資料檔 `authoring/strand_prereqs.json`：{ "nodes": { "<domain>\\u001f<strand>": {"prereqs": ["<domain>\\u001f<strand>", ...]}, ... } }

斷言：
  (1) 節點雙射：nodes 的鍵集合 ＝ manifest 實際出現的 (domain,strand) 集合（無多餘/遺漏）。
  (2) 邊參照完整：每條 prereq 指向的鍵必須是既有節點（無懸空）。
  (3) 無自環：節點不得以自己為先備。
  (4) 無環（DAG）：整張圖必須可拓撲排序（DFS 偵測回邊 → FAIL，附環路徑）。
  (5) 同域先備更前：同一 domain 內，prereq 的建議順序 order 必須 < 該節點 order（後面的分區不能當前面的先備；跨域不設限）。

介面：--init（由 manifest 產空骨架，所有節點 prereqs:[]）；--selftest；--verify。
EXIT：0=過；1=違規；2=selftest 失敗。
"""
import argparse, collections, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "authoring")
PREREQS = os.path.join(A, "strand_prereqs.json")
SEP = "\u001f"


def manifest_pairs():
    items = json.loads(open(os.path.join(A, "knowledge_points.json"), encoding="utf-8").read())["items"]
    return {(r["id"].split(".")[0], r.get("strand", "")) for r in items}


def order_map_from_nav():
    """key -> (domain, order)；order 為 nav_index 內該 strand 的建議順序。"""
    nav = json.loads(open(os.path.join(A, "nav_index.json"), encoding="utf-8").read())
    m = {}
    for isl in nav["islands"]:
        d = isl["island"]
        for s in isl["strands"]:
            m[f"{d}{SEP}{s['strand']}"] = (d, s.get("order", 0))
    return m


def find_cycle(nodes):
    """nodes: key -> [prereq keys]。回傳一條環（list）或 None。DFS 白灰黑。"""
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {k: WHITE for k in nodes}
    stack = []

    def dfs(u):
        color[u] = GRAY; stack.append(u)
        for v in nodes.get(u, []):
            if v not in color:  # 懸空邊，交由 ref 檢查報
                continue
            if color[v] == GRAY:
                i = stack.index(v)
                return stack[i:] + [v]
            if color[v] == WHITE:
                c = dfs(v)
                if c:
                    return c
        color[u] = BLACK; stack.pop()
        return None

    for k in nodes:
        if color[k] == WHITE:
            c = dfs(k)
            if c:
                return c
    return None


def check(data, pairs, order):
    probs = []
    nodes = {k: (v.get("prereqs") or []) for k, v in data.get("nodes", {}).items()}
    keyset = set(nodes)
    want = {f"{d}{SEP}{s}" for (d, s) in pairs}
    for k in sorted(want - keyset):
        probs.append(f"缺節點：{k.replace(SEP, '/')}")
    for k in sorted(keyset - want):
        probs.append(f"多餘節點（不在 manifest）：{k.replace(SEP, '/')}")
    # (2)(3)(5)
    for k, ps in nodes.items():
        for p in ps:
            if p == k:
                probs.append(f"自環：{k.replace(SEP, '/')} 以自己為先備")
            elif p not in keyset:
                probs.append(f"懸空先備：{k.replace(SEP,'/')} → {p.replace(SEP,'/')}（無此節點）")
            else:
                ko, po = order.get(k), order.get(p)
                if ko and po and ko[0] == po[0] and po[1] >= ko[1]:
                    probs.append(f"同域先備未更前：{k.replace(SEP,'/')}(order {ko[1]}) 的先備 {p.replace(SEP,'/')}(order {po[1]}) 未更早")
    # (4) 無環
    cyc = find_cycle({k: [p for p in ps if p in keyset] for k, ps in nodes.items()})
    if cyc:
        probs.append("偵測到環：" + " → ".join(x.replace(SEP, "/") for x in cyc))
    return probs


def _selftest():
    pairs = {("math", "numquant"), ("math", "equation"), ("math", "function"), ("eng", "verb")}
    order = {"math\u001fnumquant": ("math", 1), "math\u001fequation": ("math", 2),
             "math\u001ffunction": ("math", 3), "eng\u001fverb": ("eng", 1)}
    def D(edges):
        n = {f"{d}\u001f{s}": {"prereqs": []} for (d, s) in pairs}
        for a, b in edges:
            n[a]["prereqs"].append(b)
        return {"nodes": n}
    good = D([("math\u001fequation", "math\u001fnumquant"), ("math\u001ffunction", "math\u001fequation")])
    results = [("好例（空+合法前向邊）→ ALLOW", check(good, pairs, order) == [])]
    results.append(("懸空先備 → DENY", any("懸空" in p for p in check(D([("math\u001ffunction", "math\u001fghost")]), pairs, order))))
    results.append(("自環 → DENY", any("自環" in p for p in check(D([("eng\u001fverb", "eng\u001fverb")]), pairs, order))))
    cyc = D([("math\u001fnumquant", "math\u001fequation"), ("math\u001fequation", "math\u001fnumquant")])
    results.append(("環 → DENY", any("環" in p for p in check(cyc, pairs, order))))
    back = D([("math\u001fnumquant", "math\u001ffunction")])  # order1 的先備是 order3 → 未更前
    results.append(("同域先備未更前 → DENY", any("未更前" in p for p in check(back, pairs, order))))
    miss = {"nodes": {"math\u001fnumquant": {"prereqs": []}}}  # 缺節點
    results.append(("節點不雙射 → DENY", any("缺節點" in p for p in check(miss, pairs, order))))
    allok = True
    for msg, ok in results:
        print(f"  [{'OK' if ok else 'BAD'}] {msg}"); allok = allok and ok
    return allok


def main():
    ap = argparse.ArgumentParser(description="§6.1 先備 DAG gate（fail-closed）")
    ap.add_argument("--init", action="store_true", help="由 manifest 產空骨架")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--verify", action="store_true")
    args = ap.parse_args()
    if args.init:
        pairs = sorted(manifest_pairs())
        data = {"_note": "§6.1 strand 級先備關係 DAG。prereqs 由各科領域專家 authored 填入（正確性第一，不由啟發式亂猜）；"
                         "空＝尚未 authored。prereq_dag_gate 保證無論誰填都無環、參照完整、同域先備更前。",
                "nodes": {f"{d}{SEP}{s}": {"prereqs": []} for (d, s) in pairs}}
        json.dump(data, open(PREREQS, "w"), ensure_ascii=False, indent=1)
        print(f"寫出 strand_prereqs.json 骨架：{len(data['nodes'])} 節點（prereqs 皆空，待 authored）")
        return
    if args.selftest:
        print("=== prereq_dag_gate --selftest ==="); ok = _selftest()
        print("RESULT:", "PASS ✅" if ok else "FAIL ❌"); sys.exit(0 if ok else 2)
    if args.verify:
        if not os.path.exists(PREREQS):
            print("  [prereq] 缺 strand_prereqs.json（先跑 --init）"); print("RESULT: FAIL ❌"); sys.exit(1)
        data = json.loads(open(PREREQS, encoding="utf-8").read())
        probs = check(data, manifest_pairs(), order_map_from_nav())
        for p in probs:
            print(f"  [prereq] {p}")
        n = len(data.get("nodes", {}))
        edges = sum(len(v.get("prereqs") or []) for v in data.get("nodes", {}).values())
        print(f"RESULT(prereq-DAG): {'PASS ✅' if not probs else 'FAIL ❌'}（{n} 節點、{edges} 先備邊、違規 {len(probs)}）")
        sys.exit(0 if not probs else 1)
    ap.error("須指定 --init / --selftest / --verify")


if __name__ == "__main__":
    main()
