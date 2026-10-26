#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""add_cross_check_batch.py — 把一個 cross_check 查證批（agent 產出的 JSON）接進 registry+ledger。

輸入 JSON（agent 真查後產出）：
  {"checks": { "<full.kp.id>": {
       "claim": "被查證的事實一句話",
       "refs": [ {"url":"...", "publisher":"...", "quote":"逐字片段，事實所依據"}, ... ]  # ≥2，publisher 相異
  }, ... }}

對每筆：在 source_registry 建 `xcheck-<batch>-<n>` 來源（evidence_method=cross_check、independent_refs=refs、
content_fingerprint=該筆記錄 sha16）；在 ledger 加條目（scope=scope_sid、fact=該來源、verified_by）。
**不自動 promote**——接著必須跑 `tools/verify/cross_check_gate.py --verify`（真抓每個 ref、quote 命中、≥2 相異 publisher），
全過才可 promote。gate 未過的來源不得升 verified（反杜撰：登記≠已驗，必經真抓）。

用法：python3 add_cross_check_batch.py <batch_name> <scope_sid> <checks.json> [reviewer_role]
"""
import json, hashlib, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent.parent

def main():
    if len(sys.argv) < 4:
        print("用法：add_cross_check_batch.py <batch> <scope_sid> <checks.json> [reviewer]"); sys.exit(2)
    batch, scope_sid, f_checks = sys.argv[1], sys.argv[2], sys.argv[3]
    reviewer = sys.argv[4] if len(sys.argv) > 4 else "domain-expert+adversarial(cross_check)"
    data = json.loads(Path(f_checks).read_text(encoding="utf-8")).get("checks", {})
    manifest_ids = {r["id"] for r in json.loads((ROOT/"authoring"/"knowledge_points.json").read_text(encoding="utf-8"))["items"]}

    reg_f = ROOT/"authoring"/"source_registry.json"; led_f = ROOT/"authoring"/"fact_check_ledger.json"
    reg = json.loads(reg_f.read_text(encoding="utf-8")); led = json.loads(led_f.read_text(encoding="utf-8"))
    assert scope_sid in reg["sources"], f"scope 來源 {scope_sid} 不在 registry"

    added, skipped = 0, []
    for n, (kid, rec) in enumerate(sorted(data.items())):
        if kid not in manifest_ids:
            skipped.append((kid, "不在 manifest")); continue
        refs = rec.get("refs") or []
        pubs = {r.get("publisher") for r in refs if r.get("publisher")}
        if len(refs) < 2 or len(pubs) < 2 or any(not r.get("url") or not r.get("quote") for r in refs):
            skipped.append((kid, f"refs 不足/缺 url 或 quote/publisher<2（refs={len(refs)},pubs={len(pubs)}）")); continue
        rec_sha = hashlib.sha256(json.dumps(rec, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:16]
        sid = f"xcheck-{batch}-{n}"
        reg["sources"][sid] = {
            "publisher": "；".join(sorted(pubs)),
            "locator": rec.get("claim", "")[:200] or kid,
            "accessed_at": "2026-10-27", "authority_class": "cross_check",
            "evidence_method": "cross_check",
            "content_fingerprint": rec_sha,
            "independent_refs": [{"url": r["url"], "publisher": r.get("publisher", ""), "quote": r["quote"]} for r in refs],
            "claim": rec.get("claim", ""),
            "note": "經驗事實，≥2 獨立來源匯聚；由 cross_check_gate 真抓驗 quote 命中後才可 promote。",
        }
        led["entries"][kid] = {
            "scope_source_ids": [scope_sid], "fact_source_ids": [sid],
            "verified_by": [reviewer], "verified_as_of": "2026-10-27",
            "note": "scope=課綱；fact=cross_check（≥2 獨立來源，cross_check_gate 真抓驗）。",
        }
        added += 1
    reg_f.write_text(json.dumps(reg, ensure_ascii=False, indent=2), encoding="utf-8")
    led_f.write_text(json.dumps(led, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"cross_check 批 {batch}：登記 {added} 筆（待 cross_check_gate --verify 真抓後才 promote）；跳過 {len(skipped)}")
    for kid, why in skipped[:40]: print("  SKIP", kid, why)

if __name__ == "__main__":
    main()
