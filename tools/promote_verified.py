#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""promote_verified.py — release-grade verified 唯一具名 promotion 模組（F5-03／F6-02/03/04）。

release-grade verified ＝ **scope_evidence 通過 ＋ fact/procedure_evidence 通過 ＋ 風險 reviewer policy 通過**（F6-03）。
  - scope_evidence：官方課綱/考試說明證明「此知識屬哪個 tier/範圍」（source_ids 指向 source_registry，authority_class=official/standard）。
  - fact_evidence：證明「公式/語法/科學敘述/CPR·消防步驟本身正確」——課綱**不能**自動證明事實（F6-03）。
  - 兩者分開記於 ledger：`scope_source_ids[]` 與 `fact_source_ids[]`；缺任一即不得 verified。
高風險（F6-04）：`life.safety.*`/`life.sel.*`/`life.*.emergency.*`/`soc-civ.*`(法律/權利) 等 → 需官方現行來源
  ＋**≥2 位身分相異**（去重後）reviewer；fact_evidence 須 official 或可執行驗證。

輸出 `authoring/verified_overlay.json`＝{manifest_sha, generated_as_of, verified_ids[], rejected[]}；綁 manifest_sha。
`_kp_build.py` 永不寫 verified；AC-KP-VERIFY 由 orchestrator **先 `promote_verified.py --check`（防偽造 overlay，F6-02）**再從 overlay 現算。

用法：python3 tools/promote_verified.py [--check]
"""
import hashlib, json, re, sys
from datetime import date, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "authoring" / "knowledge_points.json"
LEDGER = ROOT / "authoring" / "fact_check_ledger.json"
REGISTRY = ROOT / "authoring" / "source_registry.json"
OVERLAY = ROOT / "authoring" / "verified_overlay.json"

# 高風險判定（F6-04：不只 safety/sel prefix；補法律/權利/急救/醫療）
HIGH_RISK_PATTERNS = [
    r"^life\.safety\.", r"^life\.sel\.", r"^life\..*\.emergency",
    r"^soc-civ\..*\.(rights|law|crc|consumer|justice)", r"\.(health|medical|firstaid|cpr)",
]
def is_high_risk(kid):
    return any(re.search(p, kid) for p in HIGH_RISK_PATTERNS)

def manifest_sha():
    return hashlib.sha256(MANIFEST.read_bytes()).hexdigest()[:16]

def load_registry():
    if not REGISTRY.exists():
        return {}
    return json.loads(REGISTRY.read_text(encoding="utf-8")).get("sources", {})

def distinct_reviewers(rv):
    """F6-04：兩個相同字串不算兩位；以正規化身分去重。"""
    norm = {str(r).strip().lower() for r in (rv or []) if str(r).strip()}
    return norm

# evidence_method 分類（使用者 2026-10-26：權威≠正確；推導/重跑優先，非「官方說了算」）
SELF_VERIFIABLE = {"derivation", "program", "truth_table", "corpus"}  # 可重現、零權威，單一即可
SCOPE_METHODS = {"curriculum_scope"}                                   # scope＝約定/成員資格

def _fresh(s, today):
    ra = s.get("recheck_after")
    if not ra: return True, ""
    try:
        return (datetime.strptime(ra, "%Y-%m-%d").date() >= today), f"source 已過 recheck_after {ra}"
    except ValueError:
        return False, f"recheck_after {ra} 非 ISO"

def scope_source_ok(sid, reg):
    # scope＝約定/成員資格：課綱「定義」教什麼，故 scope 來源**必須**是課綱權威（official/standard）。
    # 這與「fact 不訴諸權威」不衝突——fact 另走 evidence_method，不看 authority_class（F6 第3項）。
    s = reg.get(sid)
    if not s: return False, f"scope source {sid} 無法解析"
    if s.get("evidence_method") not in SCOPE_METHODS:
        return False, f"scope source {sid} 非 curriculum_scope"
    if s.get("authority_class") not in ("official", "standard"):
        return False, f"scope source {sid} authority_class 非 official/standard（scope 須課綱權威）"
    if not s.get("content_fingerprint"): return False, f"scope {sid} 無 fingerprint"
    return True, ""

_REVIEW_CACHE = {}
def _load_review(review_ref):
    """讀 review 記錄檔（authoring/reviews/*.json），回傳 (reviews_dict, file_sha16 或 None)。"""
    if review_ref in _REVIEW_CACHE: return _REVIEW_CACHE[review_ref]
    p = ROOT / review_ref
    if not p.exists():
        _REVIEW_CACHE[review_ref] = (None, None); return None, None
    sha = hashlib.sha256(p.read_bytes()).hexdigest()[:16]
    try:
        reviews = json.loads(p.read_text(encoding="utf-8")).get("reviews", {})
    except Exception:
        reviews = None
    _REVIEW_CACHE[review_ref] = (reviews, sha); return reviews, sha

def fact_source_ok(sid, reg, today, high_risk, kid=None):
    """正確性證據：推導/程式/真值表/語料＝自驗(1 即可)；cross_check 需 ≥2 獨立；
    consensus_current 僅限無法自推導(安全急救等)且需 freshness；
    expert_review＝技能/主題型 KP（無單一可重現硬事實）：官方 scope + 真實 review 記錄檔中該 KP
      有 PASS 判定、is_hard_fact=False、≥1 位相異 reviewer（high-risk ≥2）；記錄檔 sha 須對上指紋（防竄改）。
      reviewer 若標 is_hard_fact=True→拒（逼該 KP 改走 reproduction/cross_check，不得以審查繞過硬事實）。
    訴諸權威(只因 official)不接受。"""
    s = reg.get(sid)
    if not s: return False, f"fact source {sid} 無法解析"
    m = s.get("evidence_method")
    if not s.get("content_fingerprint"): return False, f"fact {sid} 無 fingerprint"
    if m in SELF_VERIFIABLE:
        if not s.get("reproduction_ref"): return False, f"fact {sid}({m}) 無 reproduction_ref（須附可重跑證據）"
        return True, ""
    if m == "cross_check":
        if len(s.get("independent_refs") or []) < 2:
            return False, f"fact {sid}(cross_check) 需 ≥2 獨立 refs"
        return True, ""
    if m == "consensus_current":
        ok, why = _fresh(s, today)
        if not ok: return False, f"fact {sid}(consensus): {why}"
        return True, ""
    if m == "expert_review":
        ref = s.get("review_ref")
        if not ref: return False, f"fact {sid}(expert_review) 無 review_ref"
        reviews, sha = _load_review(ref)
        if reviews is None: return False, f"fact {sid}: review 記錄檔缺/壞 {ref}"
        if sha != s.get("content_fingerprint"):
            return False, f"fact {sid}: review 檔 sha {sha}≠指紋（竄改/過時）"
        rv = reviews.get(kid)
        if not rv: return False, f"fact {sid}: review 檔無 {kid} 的判定"
        if rv.get("verdict") != "PASS": return False, f"fact {sid}: {kid} review 非 PASS"
        if rv.get("is_hard_fact"):
            return False, f"fact {sid}: {kid} 被標 is_hard_fact→須走 reproduction/cross_check 非審查"
        revs = {str(r.get("role", r)).strip().lower() for r in (rv.get("reviewers") or []) if r}
        need = 2 if high_risk else 1
        if len(revs) < need:
            return False, f"fact {sid}: {kid} 需 ≥{need} 位相異 reviewer（目前 {len(revs)}）"
        if not all((r.get("reason") or "").strip() for r in (rv.get("reviewers") or [])):
            return False, f"fact {sid}: {kid} reviewer 須附 reason"
        return True, ""
    return False, f"fact {sid} 的 evidence_method='{m}' 不被接受（不得訴諸權威）"

def promote():
    items = {r["id"] for r in json.loads(MANIFEST.read_text(encoding="utf-8"))["items"]}
    ledger = json.loads(LEDGER.read_text(encoding="utf-8")).get("entries", {}) if LEDGER.exists() else {}
    reg = load_registry()
    today = date.today()
    verified, rejected = [], []
    for kid, led in ledger.items():
        why = []
        hr = is_high_risk(kid)
        if kid not in items: why.append("id 不在 manifest")
        scope_ids = led.get("scope_source_ids") or []
        fact_ids = led.get("fact_source_ids") or []
        if not scope_ids: why.append("無 scope_source_ids（課綱範圍=約定）")
        if not fact_ids: why.append("無 fact_source_ids（正確性證據，權威不能代證）")
        for sid in scope_ids:
            ok, m = scope_source_ok(sid, reg)
            if not ok: why.append("scope:" + m)
        fact_methods = []
        for sid in fact_ids:
            ok, m = fact_source_ok(sid, reg, today, hr, kid=kid)
            if not ok: why.append("fact:" + m)
            else: fact_methods.append(reg.get(sid, {}).get("evidence_method"))
        if hr:
            # high-risk 無法自推導→其 fact 須 consensus_current 或 cross_check，且 ≥2 身分相異 reviewer
            if fact_methods and not any(fm in ("consensus_current", "cross_check") for fm in fact_methods):
                why.append("high-risk 的 fact 須 consensus_current 或 cross_check（非單一自述）")
            revs = distinct_reviewers(led.get("verified_by"))
            if len(revs) < 2: why.append(f"high-risk 須 ≥2 位身分相異 reviewer（目前 {len(revs)}）")
        (verified if not why else rejected).append(kid if not why else {"id": kid, "high_risk": hr, "why": why})
    return {"manifest_sha": manifest_sha(), "generated_as_of": today.isoformat(),
            "verified_ids": sorted([v for v in verified if isinstance(v, str)]),
            "rejected": rejected}

def main():
    out = promote()
    text = json.dumps(out, ensure_ascii=False, indent=2)
    if "--check" in sys.argv:
        if not OVERLAY.exists():
            print("overlay 不存在"); sys.exit(1)
        same = OVERLAY.read_text(encoding="utf-8") == text
        print(f"overlay 與重算一致：{same}；verified={len(out['verified_ids'])}")
        sys.exit(0 if same else 1)
    OVERLAY.write_text(text, encoding="utf-8")
    print(f"寫出 {OVERLAY.relative_to(ROOT)}：release-grade verified={len(out['verified_ids'])}、"
          f"rejected={len(out['rejected'])}、綁 sha={out['manifest_sha']}")
    sys.exit(0)

if __name__ == "__main__":
    main()
