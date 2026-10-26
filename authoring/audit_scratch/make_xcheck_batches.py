#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""make_xcheck_batches.py — 由 manifest 產出某 domain 尚未 verified 的 binding KP 批次輸入檔。

輸出 /tmp/xcheck_<tag><START..>.txt，每檔 <=SIZE 行，格式：`<kp_id> | <title_zh>`。
binding-unverified = id 不在 verified_overlay 且 verification_status != 'pending'（pending=scope-待核）。

用法：python3 make_xcheck_batches.py <domain_prefix> <tag> [SIZE=22] [START=1]
  domain_prefix 以 id 的第一段比對（eng/chi/soc-hist/soc-geo/soc-civ/life/math/sci）。
"""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent.parent

def main():
    dom = sys.argv[1]; tag = sys.argv[2]
    size = int(sys.argv[3]) if len(sys.argv) > 3 else 22
    start = int(sys.argv[4]) if len(sys.argv) > 4 else 1
    ov = set(json.loads((ROOT/"authoring"/"verified_overlay.json").read_text(encoding="utf-8"))["verified_ids"])
    items = json.loads((ROOT/"authoring"/"knowledge_points.json").read_text(encoding="utf-8"))["items"]
    todo = [r for r in items
            if r["id"].split(".")[0] == dom
            and r["id"] not in ov
            and r.get("verification_status") != "pending"]
    todo.sort(key=lambda r: r["id"])
    n = 0
    for i in range(0, len(todo), size):
        chunk = todo[i:i+size]; n += 1; idx = start + n - 1
        p = Path(f"/tmp/xcheck_{tag}{idx}.txt")
        p.write_text("".join(f'{r["id"]} | {r.get("title_zh","")}\n' for r in chunk), encoding="utf-8")
        print(f"{p}  ({len(chunk)} KP)")
    print(f"[{dom}] binding-unverified={len(todo)} → {n} 批（每批≤{size}），tag={tag}{start}..{start+n-1}")

if __name__ == "__main__":
    main()
