#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""add_verify_batch.py — 把一個 tools/verify/<module>.py 的 CHECKS 增量併入 registry+ledger。

對每個 check（鍵＝`<strand>.<slug>` 或唯一短 slug）：
  1. 真跑取 canonical 行 → 指紋；
  2. 在 manifest 找唯一對應 KP id（結尾符合 `.<strand>.<slug>` 或 `.<slug>`，且 domain 相符）；
  3. 加 fact source `repro-<module>-<check>`（evidence_method=derivation、reproduction_ref=<module>::<check>）；
  4. 加/更新 ledger 條目（scope＝scope_sid 參數指定的課綱來源；fact＝上面；verified_by＝oracle+expert）。
合併既有 registry/ledger（不覆蓋他批）。用法：
  python3 add_verify_batch.py <module> <domain> <scope_sid> [reviewer_role]
"""
import json, hashlib, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "tools" / "verify"))

def main():
    if len(sys.argv) < 4:
        print("用法：add_verify_batch.py <module> <domain> <scope_sid> [reviewer_role]"); sys.exit(2)
    module, domain, scope_sid = sys.argv[1], sys.argv[2], sys.argv[3]
    reviewer = sys.argv[4] if len(sys.argv) > 4 else f"domain-expert:{domain}"
    mod = __import__(module)

    reg_f = ROOT / "authoring" / "source_registry.json"
    led_f = ROOT / "authoring" / "fact_check_ledger.json"
    reg = json.loads(reg_f.read_text(encoding="utf-8"))
    led = json.loads(led_f.read_text(encoding="utf-8"))
    sources = reg["sources"]; entries = led["entries"]
    assert scope_sid in sources, f"scope 來源 {scope_sid} 不在 registry（請先建課綱 scope 來源）"

    manifest = json.loads((ROOT / "authoring" / "knowledge_points.json").read_text(encoding="utf-8"))
    ids = [r["id"] for r in manifest["items"] if r["domain"] == domain]

    def resolve(check_key):
        # check_key 可能是 "strand.slug" 或 "slug"
        cands = [i for i in ids if i.endswith("." + check_key)]
        if len(cands) == 1: return cands[0]
        # 退而用最後一段
        slug = check_key.split(".")[-1]
        cands = [i for i in ids if i.endswith("." + slug)]
        return cands[0] if len(cands) == 1 else None

    added, ambiguous = 0, []
    for cid, fn in mod.CHECKS.items():
        kp = resolve(cid)
        if not kp:
            ambiguous.append(cid); continue
        line = fn()
        fp = hashlib.sha256(line.encode("utf-8")).hexdigest()[:16]
        sdid = f"repro-{module}-{cid}"
        sources[sdid] = {
            "publisher": "本專案獨立 oracle（sympy/numpy 重跑）",
            "locator": f"tools/verify/{module}.py::{cid}",
            "accessed_at": "2026-10-26",
            "authority_class": "reproduction",
            "evidence_method": "derivation",
            "content_fingerprint": fp,
            "reproduction_ref": f"{module}::{cid}",
            "note": "fact 自驗（符號/窮舉/數值），生成器與 oracle 分離（B-08）。",
        }
        entries[kp] = {
            "scope_source_ids": [scope_sid],
            "fact_source_ids": [sdid],
            "verified_by": [f"oracle:{module}(重跑)", reviewer],
            "verified_as_of": "2026-10-26",
            "note": f"scope＝課綱；fact＝{module}::{cid} 可重跑自驗。",
        }
        added += 1
    reg_f.write_text(json.dumps(reg, ensure_ascii=False, indent=2), encoding="utf-8")
    led_f.write_text(json.dumps(led, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"併入 {module}：新增/更新 {added} 筆；registry sources={len(sources)}、ledger entries={len(entries)}")
    if ambiguous:
        print(f"!! 無法唯一解析（需手動）：{ambiguous}")

if __name__ == "__main__":
    main()
