#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""combine_cross_check.py — 合併兩個獨立 cross_check agent 的查證輸出成一份 checks.json。

兩 agent 各出 {"checks":{kp:{claim, refs:[{url,publisher,quote}], concern?}}}。
一個 KP 被採計進 combined，須：
  - 兩 agent 皆有該 kp 且**皆非 UNVERIFIABLE/WRONG**（claim 不以 UNVERIFIABLE/WRONG 起頭、refs 非空）；
  - 合併雙方 refs（以 url 去重），且 union 後 **≥2 個相異 publisher**。
否則列入 disagreed（一方存疑/查不到→不採，留給後續 defect/pending，不放行）。
輸出 combined 給 add_cross_check_batch.py；另印 disagreed 供人看。
用法：python3 combine_cross_check.py <exp.json> <adv.json> <out.json>
"""
import json, sys, re
from pathlib import Path

def host_publisher(url):
    m = re.search(r"https?://([^/]+)/?", url or "")
    host = (m.group(1) if m else url or "").lower().split(":")[0]
    if "wikipedia.org" in host or "wikimedia.org" in host or "wikidata.org" in host:
        return "wikimedia"
    parts = host.split(".")
    if len(parts) >= 3 and parts[-2] in ("co","com","gov","org","edu","net","ac"):
        return ".".join(parts[-3:])
    return ".".join(parts[-2:]) if len(parts) >= 2 else host

def bad(rec):
    c = (rec.get("claim") or "").strip().upper()
    return c.startswith("UNVERIFIABLE") or c.startswith("WRONG") or not (rec.get("refs") or [])

def main():
    exp = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")).get("checks", {})
    adv = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8")).get("checks", {})
    out, disagreed = {}, []
    for kid in exp:
        e, a = exp.get(kid), adv.get(kid)
        if not a:
            disagreed.append((kid, "對抗方無此 kp")); continue
        if bad(e) or bad(a):
            disagreed.append((kid, f"存疑/查不到 exp={bad(e)} adv={bad(a)} | {e.get('claim','')[:40]} / {a.get('claim','')[:40]}")); continue
        refs, seen = [], set()
        for r in (e.get("refs", []) + a.get("refs", [])):
            u = (r.get("url") or "").strip()
            if u and u not in seen and r.get("quote") and r.get("publisher"):
                seen.add(u); refs.append({"url": u, "publisher": r["publisher"], "quote": r["quote"]})
        pubs = {host_publisher(r["url"]) for r in refs}   # 以 host 判獨立（wiki 各語言＝一家）
        if len(refs) >= 2 and len(pubs) >= 2:
            out[kid] = {"claim": e.get("claim") or a.get("claim"), "refs": refs}
        else:
            disagreed.append((kid, f"union refs 不足（refs={len(refs)},pubs={len(pubs)}）"))
    Path(sys.argv[3]).write_text(json.dumps({"checks": out}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"combined 採 {len(out)}；disagreed {len(disagreed)}")
    for kid, why in disagreed[:40]: print("  SKIP", kid, why)

if __name__ == "__main__":
    main()
