#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""claim_evidence_gate.py — AC-CORRECT 第二層 claim 證據子閘（§6.8.1 四層證據粒度）。

依據（normative，LEARNING_PATH_REBUILD_SPEC.md）：
  §6.8.1 第二層 claim：每個事實宣稱 `{claim_id, text, kind(definition|numeric|causal|
         historical|legal|health|language-usage), source_refs[], verification_ref,
         risk_class(normal|high), status}`；每個 claim 都要能追到來源。
  §6.2.2 細則7：claims[] 承載於 <page>.units.json sidecar；純技能型可為空陣列。
  §6.2.2 細則3／§6.8.1 第三層：事實型題必填 answer_evidence（指向本單元 claims[] 的 claim_id）。

fail-closed 斷言（逐 root-level *.units.json，比照 unit_schema_gate 掃描範圍）：
  1. 每個 claims[] 條目欄位齊備（上列七欄）＋ kind ∈ enum ＋ risk_class ∈ {normal,high}。
  2. 每個 claim 可追源：source_refs[] 非空 或 verification_ref 非空（§6.8.1「每個 claim 都要能追到來源」）。
  3. claim_id 在單元內唯一（重複＝violation，比照 AC-SCHEMA 細則）。
  4. 每個 practice 題的 answer_evidence[] 之 claim_id 皆解析到本單元 claims[] 既有 claim_id（懸空＝violation）。
  5. 事實型題（type=="mcq"）在「有 claims[] 的單元」中必帶非空 answer_evidence（§6.2.2 事實型題必填）。
     純技能型單元（claims[] 空）＝pass（§6.2.2「純技能型可為空陣列」），其題亦不要求 answer_evidence。
     純練習 drill（type=="dictation"）＝非事實型，answer_evidence 可省。

介面：--verify（對真 repo 掃描，exit=violations clamped 1..255，0=clean）；
      --selftest（好/壞 fixture 證明鑑別力，exit 0 pass / 2 fail）；
      無旗標 → usage exit 2；parse 失敗 fail-closed（計為 violation）。
      相容多餘旗標 --release-id／--root。--json 可選（stdout 純 JSON）。
additive 工具，不改任何既有頁/資料/其他 gate。
"""
import argparse
import glob
import json
import os
import sys
import tempfile

CLAIM_FIELDS = ("claim_id", "text", "kind", "source_refs", "verification_ref", "risk_class", "status")
CLAIM_KINDS = {"definition", "numeric", "causal", "historical", "legal", "health", "language-usage"}
RISK_CLASSES = {"normal", "high"}
FACT_TYPES = {"mcq"}  # 事實型題（知識點選擇，斷言某答案為正確）；dictation 等純技能 drill 非事實型


def _nonempty_str(v):
    return isinstance(v, str) and v.strip() != ""


def _traceable(claim):
    """§6.8.1：每個 claim 都要能追到來源——source_refs[] 非空 或 verification_ref 非空。"""
    srcs = claim.get("source_refs")
    has_src = isinstance(srcs, list) and any(_nonempty_str(s) for s in srcs)
    return has_src or _nonempty_str(claim.get("verification_ref"))


def run(root):
    violations = []
    root = os.path.abspath(root)
    unit_files = sorted(glob.glob(os.path.join(root, "*.units.json")))
    if not unit_files:
        violations.append(f"[discovery] 在 {root} 找不到任何 *.units.json（空 glob＝fail-closed）")

    n_claims = n_fact_q = 0
    for f in unit_files:
        base = os.path.basename(f)
        try:
            with open(f, encoding="utf-8") as fh:
                data = json.load(fh)
        except (OSError, json.JSONDecodeError) as e:
            violations.append(f"[parse] {base}: 無法解析 JSON（{e}）")
            continue
        units = data.get("units")
        if not isinstance(units, list):
            violations.append(f"[structure] {base}: 頂層缺 'units' 陣列")
            continue
        for i, u in enumerate(units):
            if not isinstance(u, dict):
                violations.append(f"[structure] {base}[units#{i}]: 單元非物件")
                continue
            uid = u.get("unit_id")
            loc = f"{base}[{uid if isinstance(uid, str) else '#'+str(i)}]"

            claims = u.get("claims")
            if claims is None:
                claims = []
            if not isinstance(claims, list):
                violations.append(f"[claims-type] {loc}: 'claims' 應為陣列")
                claims = []

            # 斷言 1/2/3：逐 claim
            claim_ids = set()
            for j, c in enumerate(claims):
                cloc = f"{loc} claims#{j}"
                if not isinstance(c, dict):
                    violations.append(f"[claim-structure] {cloc}: claim 非物件")
                    continue
                n_claims += 1
                for fld in CLAIM_FIELDS:
                    if fld not in c:
                        violations.append(f"[claim-field] {cloc}: 缺必備欄位 '{fld}'（§6.8.1 第二層）")
                cid = c.get("claim_id")
                if _nonempty_str(cid):
                    if cid in claim_ids:
                        violations.append(f"[claim-dup] {loc}: claim_id '{cid}' 單元內重複（§6.2.2 唯一性）")
                    claim_ids.add(cid)
                kind = c.get("kind")
                if kind is not None and kind not in CLAIM_KINDS:
                    violations.append(f"[claim-kind] {cloc}: kind '{kind}' 不在 enum {sorted(CLAIM_KINDS)}")
                rc = c.get("risk_class")
                if rc is not None and rc not in RISK_CLASSES:
                    violations.append(f"[claim-risk] {cloc}: risk_class '{rc}' 不在 {sorted(RISK_CLASSES)}")
                if not _traceable(c):
                    violations.append(
                        f"[claim-untraceable] {cloc}: 無可追源（source_refs[] 與 verification_ref 皆空）"
                        f"——§6.8.1「每個 claim 都要能追到來源」"
                    )

            # 斷言 4/5：逐 practice 題的 answer_evidence
            practice = u.get("practice") or []
            if not isinstance(practice, list):
                violations.append(f"[practice-type] {loc}: 'practice' 應為陣列")
                practice = []
            for p in practice:
                if not isinstance(p, dict):
                    violations.append(f"[practice-structure] {loc}: practice 題非物件")
                    continue
                qid = p.get("question_id", "?")
                ev = p.get("answer_evidence") or []
                if not isinstance(ev, list):
                    violations.append(f"[answer-evidence-type] {loc} 題 {qid}: answer_evidence 應為陣列")
                    ev = []
                # 斷言 4：懸空參照
                for a in ev:
                    if a not in claim_ids:
                        violations.append(
                            f"[answer-evidence-dangling] {loc} 題 {qid}: answer_evidence '{a}' "
                            f"在本單元 claims[] 無對應（§6.2.2 懸空參照）"
                        )
                # 斷言 5：事實型題（有 claims 的單元）必帶非空 answer_evidence
                if p.get("type") in FACT_TYPES and claim_ids:
                    n_fact_q += 1
                    if not ev:
                        violations.append(
                            f"[fact-no-evidence] {loc} 題 {qid}: 事實型題（type={p.get('type')}）"
                            f"缺 answer_evidence（§6.2.2 事實型題必填，指向本單元 claims[]）"
                        )

    stats = {"root": root, "unit_files": len(unit_files), "claims": n_claims,
             "fact_questions": n_fact_q, "violations": len(violations)}
    return violations, stats


# ---------------- selftest ----------------
def _write(root, name, obj):
    with open(os.path.join(root, name), "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False)


def _good_unit():
    return {"units": [{
        "unit_id": "eng.t_base.vocab.good", "claims": [
            {"claim_id": "c1", "text": "t", "kind": "numeric", "source_refs": ["Cambridge"],
             "verification_ref": "v", "risk_class": "normal", "status": "provisional"}],
        "practice": [{"question_id": "Q1", "type": "mcq", "answer_evidence": ["c1"]},
                     {"question_id": "Q2", "type": "dictation"}]}]}


def _good_skill_unit():
    # 純技能型：claims 空、mcq 無 answer_evidence → 應 pass
    return {"units": [{"unit_id": "eng.t_base.skill.x", "claims": [],
                       "practice": [{"question_id": "S1", "type": "mcq"}]}]}


def _selftest():
    results = []
    with tempfile.TemporaryDirectory() as good:
        _write(good, "a.units.json", _good_unit())
        _write(good, "b.units.json", _good_skill_unit())
        v, _ = run(good)
        results.append(("好例（含純技能空 claims）→ 0 violation", len(v) == 0, v))

    cases = {
        "claim 缺欄位": lambda u: u["units"][0]["claims"][0].pop("status"),
        "claim 不可追源": lambda u: (u["units"][0]["claims"][0].update({"source_refs": [], "verification_ref": ""})),
        "kind 非 enum": lambda u: u["units"][0]["claims"][0].update({"kind": "bogus"}),
        "claim_id 重複": lambda u: u["units"][0]["claims"].append(dict(u["units"][0]["claims"][0])),
        "answer_evidence 懸空": lambda u: u["units"][0]["practice"][0].update({"answer_evidence": ["c-nope"]}),
        "事實型題缺 answer_evidence": lambda u: u["units"][0]["practice"][0].pop("answer_evidence"),
    }
    for name, mut in cases.items():
        with tempfile.TemporaryDirectory() as bad:
            u = _good_unit()
            mut(u)
            _write(bad, "a.units.json", u)
            v, _ = run(bad)
            results.append((f"壞例：{name} → ≥1 violation", len(v) >= 1, v))

    ok = True
    for desc, passed, v in results:
        print(f"  [{'OK' if passed else 'BAD'}] {desc}")
        if not passed:
            ok = False
            print(f"       (violations={v})")
    return ok


def _clamp(n):
    return 0 if n == 0 else max(1, min(255, n))


def main(argv=None):
    ap = argparse.ArgumentParser(description="AC-CORRECT claim 證據子閘（fail-closed）")
    ap.add_argument("--verify", action="store_true", help="對真 repo 掃描（exit=violations）")
    ap.add_argument("--selftest", action="store_true", help="好/壞 fixture 鑑別力（exit 0/2）")
    ap.add_argument("--root", default=".", help="掃描根目錄（紅隊可指向暫存副本）")
    ap.add_argument("--release-id", default=None, help="（相容旗標；本閘對 --root 展開）")
    ap.add_argument("--json", action="store_true", help="stdout 印純 JSON 報告")
    args = ap.parse_args(argv)

    if args.selftest:
        print("=== claim_evidence_gate --selftest ===")
        ok = _selftest()
        print("RESULT:", "PASS ✅" if ok else "FAIL ❌")
        return 0 if ok else 2

    if args.verify:
        violations, stats = run(args.root)
        if args.json:
            print(json.dumps({"stats": stats, "violations": violations}, ensure_ascii=False, indent=2))
        else:
            print(f"[claim_evidence_gate] root={stats['root']} files={stats['unit_files']} "
                  f"claims={stats['claims']} fact_q={stats['fact_questions']}", file=sys.stderr)
            if violations:
                print(f"[claim_evidence_gate] {len(violations)} violation(s):", file=sys.stderr)
                for v in violations:
                    print("  - " + v, file=sys.stderr)
            else:
                print("[claim_evidence_gate] CLEAN（0 violation）", file=sys.stderr)
        return _clamp(len(violations))

    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    sys.exit(main())
