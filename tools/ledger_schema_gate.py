#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ledger_schema_gate.py — Phase 0 的 source_registry + fact_check_ledger 語意閘（§6.8.1）。

此閘**只驗結構與語意契約**（禁造假的形狀層）；證據是否「真的跑得出來」由 `tools/verify/repro_gate.py`
重跑 reproduction_ref 驗證（anti-fabrication 的執行層）。兩者皆綠，promote_verified 才會升 verified。

驗：
  A. source_registry.json 合 schema（結構 + 每個 evidence_method 的必填欄）：
     - curriculum_scope → authority_class∈{official,standard}
     - derivation/program/truth_table/corpus → 必有 reproduction_ref
     - cross_check → 必有 ≥2 independent_refs
     - consensus_current → 必有 recheck_after（且不過期）
     - content_fingerprint 一律必填（禁空）；accessed_at/recheck_after 為 ISO 且不晚於今天（accessed_at）
  B. fact_check_ledger entries：
     - key 必在 manifest；scope_source_ids[] 與 fact_source_ids[] 皆非空
     - 每個 source_id 必在 registry 可解；scope 的 source 必 curriculum_scope、fact 的 source 不得為 curriculum_scope
     - verified_by 非空；high-risk（promote_verified.HIGH_RISK_PATTERNS）→ ≥2 位身分相異 reviewer
     - verified_as_of（若有）ISO 且不晚於今天
用法：python3 tools/ledger_schema_gate.py [--root <dir>]（缺 root 檔即 FAIL，不靜默 exit0）
exit 0=乾淨；非0=契約違反。
"""
import json, re, sys
from datetime import date, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def _root():
    if "--root" in sys.argv:
        try:
            b = Path(sys.argv[sys.argv.index("--root") + 1]).resolve()
        except IndexError:
            print("!! --root 未給路徑"); sys.exit(2)
        if not b.is_dir():
            print(f"!! --root 不存在：{b}"); sys.exit(2)
        return b
    return ROOT

def _load(p, what):
    if not p.exists():
        print(f"!! 缺檔（{what}）：{p}"); sys.exit(1)
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"!! {what} 解析失敗：{e}"); sys.exit(1)

SELF_VERIFIABLE = {"derivation", "program", "truth_table", "corpus"}
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")

def iso_ok(s):
    if not isinstance(s, str) or not ISO.match(s): return None
    try: return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError: return None

def validate_registry(reg, today):
    errs = []
    srcs = reg.get("sources")
    if not isinstance(srcs, dict):
        return ["source_registry 無 sources 物件"], {}
    for sid, s in srcs.items():
        if not isinstance(s, dict): errs.append(f"{sid}: 非物件"); continue
        m = s.get("evidence_method")
        fp = s.get("content_fingerprint")
        if not fp or len(str(fp)) < 8: errs.append(f"{sid}: content_fingerprint 缺/過短（禁造假、禁空）")
        aa = s.get("accessed_at")
        if iso_ok(aa) is None: errs.append(f"{sid}: accessed_at 非 ISO")
        elif iso_ok(aa) > today: errs.append(f"{sid}: accessed_at 晚於今天")
        if not s.get("publisher"): errs.append(f"{sid}: 缺 publisher")
        if not s.get("locator"): errs.append(f"{sid}: 缺 locator")
        if m == "curriculum_scope":
            if s.get("authority_class") not in ("official", "standard"):
                errs.append(f"{sid}: curriculum_scope 的 authority_class 必 official/standard")
        elif m in SELF_VERIFIABLE:
            if not s.get("reproduction_ref"):
                errs.append(f"{sid}: {m} 必附 reproduction_ref（可重跑證據）")
        elif m == "cross_check":
            if len(s.get("independent_refs") or []) < 2:
                errs.append(f"{sid}: cross_check 必附 ≥2 independent_refs")
        elif m == "consensus_current":
            ra = s.get("recheck_after")
            d = iso_ok(ra)
            if d is None: errs.append(f"{sid}: consensus_current 必附 ISO recheck_after")
            elif d < today: errs.append(f"{sid}: consensus_current 已過 recheck_after {ra}")
        elif m == "expert_review":
            if not s.get("review_ref"):
                errs.append(f"{sid}: expert_review 必附 review_ref（指向 review 記錄檔）")
            elif not (ROOT / s["review_ref"]).exists():
                errs.append(f"{sid}: expert_review 的 review_ref 檔不存在：{s['review_ref']}")
        else:
            errs.append(f"{sid}: evidence_method='{m}' 非法")
    return errs, srcs

def validate_ledger(ledger, srcs, manifest_ids, today, high_risk_fn):
    errs = []
    for kid, led in ledger.items():
        if kid not in manifest_ids: errs.append(f"{kid}: ledger key 不在 manifest")
        scope_ids = led.get("scope_source_ids") or []
        fact_ids = led.get("fact_source_ids") or []
        if not scope_ids: errs.append(f"{kid}: scope_source_ids 空")
        if not fact_ids: errs.append(f"{kid}: fact_source_ids 空")
        for sid in scope_ids:
            s = srcs.get(sid)
            if not s: errs.append(f"{kid}: scope source {sid} 不在 registry")
            elif s.get("evidence_method") != "curriculum_scope":
                errs.append(f"{kid}: scope source {sid} 非 curriculum_scope")
        for sid in fact_ids:
            s = srcs.get(sid)
            if not s: errs.append(f"{kid}: fact source {sid} 不在 registry")
            elif s.get("evidence_method") == "curriculum_scope":
                errs.append(f"{kid}: fact source {sid} 用 curriculum_scope 代證事實（訴諸權威，禁）")
        if not (led.get("verified_by") or []): errs.append(f"{kid}: verified_by 空")
        va = led.get("verified_as_of")
        if va is not None:
            d = iso_ok(va)
            if d is None: errs.append(f"{kid}: verified_as_of 非 ISO")
            elif d > today: errs.append(f"{kid}: verified_as_of 晚於今天")
        if high_risk_fn(kid):
            revs = {str(r).strip().lower() for r in (led.get("verified_by") or []) if str(r).strip()}
            if len(revs) < 2:
                errs.append(f"{kid}: high-risk 須 ≥2 位身分相異 reviewer（目前 {len(revs)}）")
    return errs

def selftest():
    """qualify 模式：對嵌入的壞 fixture 跑驗證邏輯，gate 正確抓到才 PASS（證明有牙）。"""
    today = date(2026, 1, 1)
    # 壞 registry：fact 來源誤用 curriculum_scope + 一個缺 fingerprint
    bad_reg = {"sources": {
        "s-scope": {"publisher": "x", "locator": "x", "accessed_at": "2025-01-01",
                     "authority_class": "official", "evidence_method": "curriculum_scope",
                     "content_fingerprint": "aaaaaaaaaaaaaaaa"},
        "s-nofp": {"publisher": "x", "locator": "x", "accessed_at": "2025-01-01",
                    "authority_class": "reproduction", "evidence_method": "derivation",
                    "content_fingerprint": "", "reproduction_ref": "m::c"},
    }}
    bad_led = {"k1": {"scope_source_ids": ["s-scope"], "fact_source_ids": ["s-scope"],
                       "verified_by": ["r1"]},
               "life.safety.x": {"scope_source_ids": ["s-scope"], "fact_source_ids": ["s-nofp"],
                                  "verified_by": ["only-one"]}}
    sys.path.insert(0, str(ROOT / "tools"))
    from promote_verified import is_high_risk
    reg_errs, srcs = validate_registry(bad_reg, today)
    led_errs = validate_ledger(bad_led, srcs, {"k1", "life.safety.x"}, today, is_high_risk)
    expect = [
        ("registry 抓到缺 fingerprint", any("fingerprint" in e for e in reg_errs)),
        ("ledger 抓到 fact 訴諸 curriculum_scope", any("訴諸權威" in e for e in led_errs)),
        ("ledger 抓到 high-risk <2 reviewer", any("high-risk" in e for e in led_errs)),
    ]
    ok = all(v for _, v in expect)
    print("=== ledger_schema_gate --selftest（壞 fixture 應被抓）===")
    for name, v in expect: print(f"  [{'OK' if v else 'MISS'}] {name}")
    print(f"RESULT: {'PASS ✅（gate 有牙）' if ok else 'FAIL ❌（gate 漏抓壞案例）'}")
    sys.exit(0 if ok else 1)

def main():
    if "--selftest" in sys.argv:
        selftest(); return
    root = _root()
    sys.path.insert(0, str(ROOT / "tools"))
    from promote_verified import is_high_risk
    reg = _load(root / "authoring" / "source_registry.json", "source_registry")
    ledger = _load(root / "authoring" / "fact_check_ledger.json", "fact_check_ledger").get("entries", {})
    manifest = _load(root / "authoring" / "knowledge_points.json", "manifest")
    manifest_ids = {r["id"] for r in manifest["items"]}
    today = date.today()

    reg_errs, srcs = validate_registry(reg, today)
    led_errs = validate_ledger(ledger, srcs, manifest_ids, today, is_high_risk)
    print(f"=== ledger_schema_gate（root={root.name}）===")
    print(f"registry sources={len(srcs)}  ledger entries={len(ledger)}")
    for e in reg_errs: print("  [registry] " + e)
    for e in led_errs: print("  [ledger]   " + e)
    total = len(reg_errs) + len(led_errs)
    print(f"RESULT: {'PASS ✅' if total == 0 else f'FAIL ❌（{total}）'}")
    sys.exit(0 if total == 0 else 1)

if __name__ == "__main__":
    main()
