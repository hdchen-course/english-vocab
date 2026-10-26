#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""merge_review_batch.py — 合併兩個獨立審查 agent 的 JSON 判定成 review 記錄檔，並 register+promote。

兩 agent 各出 {"reviews":{kp:{verdict,is_hard_fact,reason}}}；只有「兩者皆 PASS 且皆 is_hard_fact=False」
的 KP 才採為 expert_review verified（對抗式雙審）。產出：
  authoring/reviews/<batch>.json  = {"reviews":{kp:{verdict:"PASS",is_hard_fact:False,
      reviewers:[{role:"english-educator",reason:..},{role:"adversarial-reviewer",reason:..}]}}}
並在 source_registry 加 expert_review 來源（指紋=review 檔 sha16）＋對採用的 KP 加 ledger 條目
（scope=moe-108-zonggang-2021, fact=該 expert_review 來源）。
用法：python3 merge_review_batch.py <batch_name> <domain> <expert.json> <adversary.json>
"""
import json, hashlib, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent.parent

def main():
    batch, domain, f_exp, f_adv = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
    exp = json.loads(Path(f_exp).read_text(encoding="utf-8")).get("reviews", {})
    adv = json.loads(Path(f_adv).read_text(encoding="utf-8")).get("reviews", {})
    manifest_ids = {r["id"] for r in json.loads((ROOT/"authoring"/"knowledge_points.json").read_text(encoding="utf-8"))["items"]}

    reviews, accepted, rejected = {}, [], []
    for kid in exp:
        e, a = exp.get(kid), adv.get(kid)
        if kid not in manifest_ids:
            rejected.append((kid, "不在 manifest")); continue
        if not a:
            rejected.append((kid, "對抗方無判定")); continue
        both_pass = e.get("verdict") == "PASS" and a.get("verdict") == "PASS"
        skill = (e.get("is_hard_fact") is False) and (a.get("is_hard_fact") is False)
        if both_pass and skill:
            reviews[kid] = {"verdict": "PASS", "is_hard_fact": False, "reviewers": [
                {"role": "english-educator", "reason": e.get("reason", "")[:200]},
                {"role": "adversarial-reviewer", "reason": a.get("reason", "")[:200]},
            ]}
            accepted.append(kid)
        else:
            rejected.append((kid, f"expert={e.get('verdict')}/hf={e.get('is_hard_fact')} adv={a.get('verdict')}/hf={a.get('is_hard_fact')}"))

    revdir = ROOT/"authoring"/"reviews"; revdir.mkdir(exist_ok=True)
    rev_path = revdir/f"{batch}.json"
    rev_path.write_text(json.dumps({"reviews": reviews}, ensure_ascii=False, indent=2), encoding="utf-8")
    sha = hashlib.sha256(rev_path.read_bytes()).hexdigest()[:16]

    reg_f = ROOT/"authoring"/"source_registry.json"; led_f = ROOT/"authoring"/"fact_check_ledger.json"
    reg = json.loads(reg_f.read_text(encoding="utf-8")); led = json.loads(led_f.read_text(encoding="utf-8"))
    sid = f"review-{batch}"
    reg["sources"][sid] = {
        "publisher": "本專案雙人對抗式審查（english-educator + adversarial-reviewer）",
        "locator": f"authoring/reviews/{batch}.json",
        "accessed_at": "2026-10-26", "authority_class": "review",
        "evidence_method": "expert_review", "review_ref": f"authoring/reviews/{batch}.json",
        "content_fingerprint": sha,
        "note": "技能/主題型 KP：scope 由課綱、正確性由雙人對抗式審查（兩者皆 PASS 且非硬事實）。",
    }
    for kid in accepted:
        led["entries"][kid] = {
            "scope_source_ids": ["moe-108-zonggang-2021"], "fact_source_ids": [sid],
            "verified_by": ["english-educator", "adversarial-reviewer"],
            "verified_as_of": "2026-10-26",
            "note": "技能型 KP；scope=課綱、fact=雙人對抗式 expert_review。",
        }
    reg_f.write_text(json.dumps(reg, ensure_ascii=False, indent=2), encoding="utf-8")
    led_f.write_text(json.dumps(led, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"review batch {batch}: 採用 {len(accepted)}、退回 {len(rejected)}；sid={sid} sha={sha}")
    for kid, r in rejected[:40]: print("  REJECT", kid, r)

if __name__ == "__main__":
    main()
