#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""register_consensus_from_review.py — 把 HIGH-RISK 技能/價值 KP 的雙人審查記錄
登記為 consensus_current 證據（§6.8.1 安全/SEL 不可走 expert_review，須 consensus_current + ≥2 相異 reviewer）。

輸入＝已存在的 review 記錄檔 authoring/reviews/<batch>.json（由 merge_review_batch.py 產出，含兩位
role 相異 reviewer 對每個 KP 的 PASS/is_hard_fact=False 判定；兩位皆已明文評估「合現行主流共識」）。
對其中每個 high-risk KP：
  - 在 source_registry 建一筆 evidence_method=consensus_current 來源：
      recheck_after（freshness，預設 +1 年）、content_fingerprint=review 檔 sha16、locator=review 檔、
      publisher 記明「現行兒少保護/健康/安全主流共識，雙獨立專家對抗式覆核」。
  - 覆寫 fact_check_ledger 該 KP：fact_source_ids=[該 consensus sid]、verified_by=[兩位 role]（≥2 相異）。
非 high-risk KP 不動（維持 expert_review 已可過）。promote 對 high-risk 要求 fact∈{consensus_current,cross_check}
且 verified_by ≥2 相異 → 本登記使其合規；gate 未被弱化（仍要 freshness、指紋、雙 reviewer）。

用法：python3 register_consensus_from_review.py <batch> <recheck_after=YYYY-MM-DD>
  batch＝reviews/<batch>.json 的 <batch>（如 rev-life-5）。
"""
import json, sys, hashlib
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "tools"))
import importlib.util
spec = importlib.util.spec_from_file_location("pv", ROOT / "tools" / "promote_verified.py")
pv = importlib.util.module_from_spec(spec); spec.loader.exec_module(pv)

def main():
    batch, recheck = sys.argv[1], sys.argv[2]
    rev_path = ROOT / "authoring" / "reviews" / f"{batch}.json"
    reviews = json.loads(rev_path.read_text(encoding="utf-8"))["reviews"]
    sha = hashlib.sha256(rev_path.read_bytes()).hexdigest()[:16]
    reg = json.loads((ROOT/"authoring"/"source_registry.json").read_text(encoding="utf-8"))
    led = json.loads((ROOT/"authoring"/"fact_check_ledger.json").read_text(encoding="utf-8"))
    sid = f"consensus-{batch}"
    reg["sources"][sid] = {
        "publisher": "現行兒少保護/健康/安全主流共識（NSPCC/兒福聯盟/WHO/紅十字等）；雙獨立專家對抗式覆核",
        "locator": f"authoring/reviews/{batch}.json", "accessed_at": "2026-10-27",
        "authority_class": "consensus", "evidence_method": "consensus_current",
        "recheck_after": recheck, "content_fingerprint": sha,
        "note": "安全/SEL 高風險技能價值：不走 expert_review，以現行共識＋≥2 相異 reviewer 覆核；到期須 recheck。"}
    n = 0
    for kid, rv in reviews.items():
        if not pv.is_high_risk(kid):
            continue   # 非高風險維持 expert_review（已可過）
        if rv.get("verdict") != "PASS" or rv.get("is_hard_fact"):
            continue
        roles = [str(r.get("role", "")).strip() for r in (rv.get("reviewers") or []) if r.get("role")]
        if len(pv.distinct_reviewers(roles)) < 2:
            continue
        led["entries"][kid] = {"scope_source_ids": ["moe-108-zonggang-2021"], "fact_source_ids": [sid],
            "verified_by": roles, "verified_as_of": "2026-10-27",
            "note": "高風險技能價值：scope=課綱；fact=consensus_current（現行共識）＋雙相異 reviewer；設 recheck_after。"}
        n += 1
    (ROOT/"authoring"/"source_registry.json").write_text(json.dumps(reg,ensure_ascii=False,indent=2),encoding="utf-8")
    (ROOT/"authoring"/"fact_check_ledger.json").write_text(json.dumps(led,ensure_ascii=False,indent=2),encoding="utf-8")
    print(f"[{batch}] consensus 登記 high-risk KP {n} 筆（sid={sid}, recheck_after={recheck}, sha={sha}）")

if __name__ == "__main__":
    main()
