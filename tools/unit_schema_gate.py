#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""unit_schema_gate.py — §6.2.2 單元「內容」資料 schema 的機器強制（AC-SCHEMA 運算元；Phase 1）。

為什麼存在
  §6.2.2 定義每頁 sidecar `<page>.units.json` 的單元內容契約（教→練→評＋claims＋scene），
  §9.5/§9.6 反偷看歸因 join、§6.8.1 四層證據、rubric⑦ 真教真考、R14/R15 皆依賴這些欄位有良好定義
  的載體與唯一鍵。本 gate 以純 Python（零外部依賴）逐條驗；壞 schema 即 FAIL（fail-closed）。

驗哪些（§6.2.2 細則 1–7 ＋ 唯一性/參照完整性鐵律）
  unit 必填：unit_id / knowledge_point_ids[](皆∈manifest) / prerequisites[] / est_minutes(≤12,INV-4) /
             subject / strand
  teach[]：每段 {kind∈text|viz|example, body(非空), kp_ids[](非空,皆∈manifest)}；kind==viz 須帶 scene
  practice[]：每題 {question_id, type, stem, answer, feedback, kp_ids[], required_kp_ids[], validation_method∈
             {exhaustive|oracle|source|expert}}；required_kp_ids 非空且 ⊇ kp_ids 且皆∈manifest；
             type 含 mcq/choice/single/multi → 必填非空 distractor_rationales；
             事實型(validation_method∈{oracle,source,exhaustive})→ 必填 answer_evidence[](指向本單元 claim_id)
  selfeval：三級 {還不熟,快會了,會了}（不假裝自動判讀）
  claims[]：每筆 {claim_id, text, kind∈定義列舉, source_refs[], verification_ref, risk_class∈{normal,high}, status}
  scene（viz teach 段）：{scene_id, claim_ids[](皆∈本單元 claims), 圖例語意, frames[], content_reviewer}
  唯一性：question_id / claim_id / scene_id 在同一 sidecar 內各唯一（重複＝FAIL，比照 AC-COV-2）
  參照完整性：answer_evidence 的 claim_id、scene.claim_ids 皆解析到本單元 claims[]（懸空＝FAIL）
  rubric⑦：knowledge_point_ids ⊆ (∪teach.kp_ids) ∩ (∪practice.kp_ids)（declaration-stuffing 即 FAIL）

介面
  python3 tools/unit_schema_gate.py --selftest            # 離線自測：好 fixture ALLOW、每壞 fixture DENY
  python3 tools/unit_schema_gate.py --verify [--root .]   # 驗 root 下所有 *.units.json（對 manifest 驗 kp 存在）
  python3 tools/unit_schema_gate.py --file <page>.units.json
EXIT：0=全過；1=有 schema 違規；2=selftest 失敗（gate 本身不可信）。
"""
import argparse, glob, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "authoring", "knowledge_points.json")

TEACH_KINDS = {"text", "viz", "example"}
CLAIM_KINDS = {"definition", "numeric", "causal", "historical", "legal", "health", "language-usage"}
RISK_CLASSES = {"normal", "high"}
VALIDATION_METHODS = {"exhaustive", "oracle", "source", "expert"}
FACT_METHODS = {"exhaustive", "oracle", "source"}        # 事實型 → 必附 answer_evidence
MCQ_TYPES = {"mcq", "choice", "single", "multi", "single-choice", "multiple-choice"}
SELFEVAL_LEVELS = {"還不熟", "快會了", "會了"}
EST_MINUTES_CAP = 12                                     # INV-4


def load_manifest_ids(root=None):
    path = os.path.join(root, "authoring", "knowledge_points.json") if root else MANIFEST
    if not os.path.exists(path):
        return None
    return {r["id"] for r in json.loads(open(path, encoding="utf-8").read())["items"]}


def _req(obj, field, where, errs):
    if field not in obj or obj[field] in (None, "", [], {}):
        errs.append(f"{where}: 缺必填欄位或空值 `{field}`")
        return False
    return True


def validate_unit(u, manifest_ids, seen_q, seen_claim, seen_scene, where, errs):
    """驗單一 unit 物件；seen_* 為跨整個 sidecar 的 id 集合（唯一性）。"""
    for f in ("unit_id", "est_minutes", "subject", "strand"):   # 純量必填非空
        _req(u, f, where, errs)
    uid = u.get("unit_id", where)
    w = f"unit {uid}"

    # knowledge_point_ids：必填非空陣列，皆存在於 manifest
    kp_decl = u.get("knowledge_point_ids")
    if not isinstance(kp_decl, list) or not kp_decl:
        errs.append(f"{w}: knowledge_point_ids 缺或空（必填非空陣列）")
        kp_decl = kp_decl if isinstance(kp_decl, list) else []
    # prerequisites：必填為陣列，但可為空（無先備）
    if not isinstance(u.get("prerequisites"), list):
        errs.append(f"{w}: prerequisites 缺或非陣列（可空陣列但須存在）")
    if manifest_ids is not None:
        for kid in kp_decl:
            if kid not in manifest_ids:
                errs.append(f"{w}: knowledge_point_ids 的 `{kid}` 不在 manifest")
    for kid in u.get("prerequisites") or []:
        if manifest_ids is not None and kid not in manifest_ids:
            errs.append(f"{w}: prerequisites 的 `{kid}` 不在 manifest")

    # est_minutes ≤ 12
    em = u.get("est_minutes")
    if isinstance(em, (int, float)) and em > EST_MINUTES_CAP:
        errs.append(f"{w}: est_minutes={em} 超過 INV-4 上限 {EST_MINUTES_CAP}")

    # claims[]（先收集本單元 claim_id，供 answer_evidence/scene 參照）
    unit_claim_ids = set()
    for i, c in enumerate(u.get("claims") or []):
        cw = f"{w} claims[{i}]"
        for f in ("claim_id", "text", "kind", "source_refs", "verification_ref", "risk_class", "status"):
            _req(c, f, cw, errs)
        cid = c.get("claim_id")
        if cid:
            if cid in seen_claim:
                errs.append(f"{cw}: claim_id `{cid}` 重複（sidecar 內須唯一）")
            seen_claim.add(cid); unit_claim_ids.add(cid)
        if c.get("kind") and c["kind"] not in CLAIM_KINDS:
            errs.append(f"{cw}: kind `{c['kind']}` 非列舉 {sorted(CLAIM_KINDS)}")
        if c.get("risk_class") and c["risk_class"] not in RISK_CLASSES:
            errs.append(f"{cw}: risk_class `{c['risk_class']}` 非 {sorted(RISK_CLASSES)}")

    # teach[]
    teach_kp = set()
    teach = u.get("teach")
    if not isinstance(teach, list) or not teach:
        errs.append(f"{w}: teach[] 缺或空")
        teach = []
    for i, t in enumerate(teach):
        tw = f"{w} teach[{i}]"
        if t.get("kind") not in TEACH_KINDS:
            errs.append(f"{tw}: kind `{t.get('kind')}` 非 {sorted(TEACH_KINDS)}")
        _req(t, "body", tw, errs)
        kps = t.get("kp_ids")
        if not isinstance(kps, list) or not kps:
            errs.append(f"{tw}: kp_ids 缺或空（每 teach 段必標）")
        else:
            for kid in kps:
                teach_kp.add(kid)
                if manifest_ids is not None and kid not in manifest_ids:
                    errs.append(f"{tw}: kp_ids 的 `{kid}` 不在 manifest")
        # viz 段須帶 scene（§6.8.1 第四層）
        if t.get("kind") == "viz":
            sc = t.get("scene")
            if not isinstance(sc, dict):
                errs.append(f"{tw}: kind==viz 須帶 scene 物件")
            else:
                sw = f"{tw} scene"
                for f in ("scene_id", "claim_ids", "圖例語意", "frames", "content_reviewer"):
                    _req(sc, f, sw, errs)
                sid = sc.get("scene_id")
                if sid:
                    if sid in seen_scene:
                        errs.append(f"{sw}: scene_id `{sid}` 重複（sidecar 內須唯一）")
                    seen_scene.add(sid)
                for cref in sc.get("claim_ids") or []:
                    if cref not in unit_claim_ids:
                        errs.append(f"{sw}: claim_ids 的 `{cref}` 未解析到本單元 claims[]（懸空）")

    # practice[]
    prac_kp = set()
    prac = u.get("practice")
    if not isinstance(prac, list) or not prac:
        errs.append(f"{w}: practice[] 缺或空")
        prac = []
    for i, p in enumerate(prac):
        pw = f"{w} practice[{i}]"
        for f in ("question_id", "type", "stem", "answer", "feedback", "kp_ids",
                  "required_kp_ids", "validation_method"):
            _req(p, f, pw, errs)
        qid = p.get("question_id")
        if qid:
            if qid in seen_q:
                errs.append(f"{pw}: question_id `{qid}` 重複（sidecar 內須唯一）")
            seen_q.add(qid)
        kps = set(p.get("kp_ids") or [])
        for kid in kps:
            prac_kp.add(kid)
            if manifest_ids is not None and kid not in manifest_ids:
                errs.append(f"{pw}: kp_ids 的 `{kid}` 不在 manifest")
        req = p.get("required_kp_ids")
        if not isinstance(req, list) or not req:
            errs.append(f"{pw}: required_kp_ids 缺或空（必填非空）")
        else:
            reqs = set(req)
            if not kps <= reqs:
                errs.append(f"{pw}: required_kp_ids 未 ⊇ kp_ids（缺 {sorted(kps - reqs)}）")
            for kid in reqs:
                if manifest_ids is not None and kid not in manifest_ids:
                    errs.append(f"{pw}: required_kp_ids 的 `{kid}` 不在 manifest")
        vm = p.get("validation_method")
        if vm and vm not in VALIDATION_METHODS:
            errs.append(f"{pw}: validation_method `{vm}` 非 {sorted(VALIDATION_METHODS)}")
        if (p.get("type") or "").lower() in MCQ_TYPES:
            if not p.get("distractor_rationales"):
                errs.append(f"{pw}: MCQ 型必填非空 distractor_rationales")
        if vm in FACT_METHODS:
            ae = p.get("answer_evidence")
            if not isinstance(ae, list) or not ae:
                errs.append(f"{pw}: 事實型(validation_method={vm}) 必填 answer_evidence[]")
            else:
                for cref in ae:
                    cid = cref.get("claim_id") if isinstance(cref, dict) else cref
                    if cid not in unit_claim_ids:
                        errs.append(f"{pw}: answer_evidence 的 claim_id `{cid}` 未解析到本單元 claims[]（懸空）")

    # selfeval 三級（細則4 必填；不假裝自動判讀手寫）
    se = u.get("selfeval")
    if se is None:
        errs.append(f"{w}: 缺必填 selfeval（固定三級自評）")
    else:
        levels = set(se) if isinstance(se, (list, dict)) else set()
        if not SELFEVAL_LEVELS <= levels:
            errs.append(f"{w}: selfeval 須含三級 {sorted(SELFEVAL_LEVELS)}（缺 {sorted(SELFEVAL_LEVELS - levels)}）")

    # rubric⑦：宣告 kp ⊆ (∪teach.kp) ∩ (∪practice.kp)
    both = teach_kp & prac_kp
    missing = set(kp_decl) - both
    if missing:
        errs.append(f"{w}: rubric⑦ 違反——宣告 kp {sorted(missing)} 未同時出現在某 teach 段與某 practice 題")


def validate_sidecar(units, manifest_ids, fname, errs):
    """一個 sidecar（檔內為 unit 物件陣列，或 {units:[...]}）。唯一性 id 跨整檔。"""
    if isinstance(units, dict):
        units = units.get("units", [])
    if not isinstance(units, list):
        errs.append(f"{fname}: 頂層非 unit 陣列（或 {{units:[...]}}）")
        return
    seen_q, seen_claim, seen_scene = set(), set(), set()
    for j, u in enumerate(units):
        validate_unit(u, manifest_ids, seen_q, seen_claim, seen_scene, f"{fname}[{j}]", errs)


# ---------- selftest fixtures ----------
def _good_unit():
    return {
        "unit_id": "eng.t_mid.verb.present-perfect",
        "knowledge_point_ids": ["eng.t_mid.verb.present-perfect"],
        "prerequisites": [], "est_minutes": 4, "subject": "eng", "strand": "verb",
        "selfeval": ["還不熟", "快會了", "會了"],
        "claims": [{"claim_id": "c1", "text": "present perfect 連接過去到現在",
                    "kind": "language-usage", "source_refs": ["s1"], "verification_ref": "v1",
                    "risk_class": "normal", "status": "ok"}],
        "teach": [{"kind": "viz", "body": "時間軸動畫", "kp_ids": ["eng.t_mid.verb.present-perfect"],
                   "scene": {"scene_id": "sc1", "claim_ids": ["c1"], "圖例語意": "時間軸",
                             "frames": ["f1"], "content_reviewer": "domain:英文"}}],
        "practice": [{"question_id": "q1", "type": "cloze", "stem": "She ___ here for ten years.",
                      "answer": "has lived", "feedback": "連續到現在用現在完成",
                      "kp_ids": ["eng.t_mid.verb.present-perfect"],
                      "required_kp_ids": ["eng.t_mid.verb.present-perfect"],
                      "validation_method": "expert"}],
    }


def _selftest():
    mids = {"eng.t_mid.verb.present-perfect"}
    cases = []  # (label, mutate_fn, expect_fail)
    import copy
    def mk(mut):
        u = copy.deepcopy(_good_unit()); mut(u); return [u]
    cases.append(("good", lambda u: None, False))
    cases.append(("缺 unit_id", lambda u: u.pop("unit_id"), True))
    cases.append(("kp 不在 manifest", lambda u: u.__setitem__("knowledge_point_ids", ["eng.fake.x"]), True))
    cases.append(("est_minutes>12", lambda u: u.__setitem__("est_minutes", 99), True))
    cases.append(("teach 段無 kp_ids", lambda u: u["teach"][0].pop("kp_ids"), True))
    cases.append(("viz 段無 scene", lambda u: u["teach"][0].pop("scene"), True))
    cases.append(("practice 無 required_kp_ids", lambda u: u["practice"][0].pop("required_kp_ids"), True))
    cases.append(("required 未 ⊇ kp_ids", lambda u: u["practice"][0].__setitem__("required_kp_ids", ["eng.t_mid.verb.present-perfect"]) or u["practice"][0].__setitem__("kp_ids", ["eng.t_mid.verb.present-perfect", "x"]) or u["practice"][0].__setitem__("required_kp_ids", ["eng.t_mid.verb.present-perfect"]), True))
    cases.append(("selfeval 非三級", lambda u: u.__setitem__("selfeval", ["會了"]), True))
    cases.append(("claim kind 非列舉", lambda u: u["claims"][0].__setitem__("kind", "bogus"), True))
    cases.append(("scene claim 懸空", lambda u: u["teach"][0]["scene"].__setitem__("claim_ids", ["nope"]), True))
    cases.append(("question_id 重複", lambda u: None, True))  # 特製下方
    cases.append(("rubric⑦ 宣告未真教真考", lambda u: u.__setitem__("knowledge_point_ids", ["eng.t_mid.verb.present-perfect", "eng.t_mid.verb.present-perfect"]) or u["teach"][0].__setitem__("kp_ids", ["other"]), True))
    cases.append(("事實型缺 answer_evidence", lambda u: u["practice"][0].__setitem__("validation_method", "source"), True))

    ok = True
    for label, mut, expect_fail in cases:
        errs = []
        if label == "question_id 重複":
            import copy as _c
            u = _c.deepcopy(_good_unit()); p2 = _c.deepcopy(u["practice"][0]); u["practice"].append(p2)
            validate_sidecar([u], mids, "selftest", errs)
        else:
            validate_sidecar(mk(mut), mids, "selftest", errs)
        failed = len(errs) > 0
        good = (failed == expect_fail)
        ok = ok and good
        print(f"  [{'OK' if good else 'BAD'}] {label}: {'FAIL' if failed else 'ALLOW'} (expect {'FAIL' if expect_fail else 'ALLOW'})"
              + (f"  →{errs[0]}" if (failed and expect_fail) else ""))
    return ok


def main():
    ap = argparse.ArgumentParser(description="§6.2.2 unit content schema gate（fail-closed）")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--file")
    ap.add_argument("--root", default=ROOT)
    args = ap.parse_args()

    if args.selftest:
        print("=== unit_schema_gate --selftest ===")
        ok = _selftest()
        print("RESULT:", "PASS ✅" if ok else "FAIL ❌")
        sys.exit(0 if ok else 2)

    manifest_ids = load_manifest_ids(args.root)
    files = [args.file] if args.file else sorted(glob.glob(os.path.join(args.root, "**", "*.units.json"), recursive=True))
    errs = []
    for f in files:
        try:
            data = json.loads(open(f, encoding="utf-8").read())
        except Exception as e:
            errs.append(f"{f}: JSON 解析失敗 {e}"); continue
        validate_sidecar(data, manifest_ids, os.path.basename(f), errs)
    if not files:
        print("（無 *.units.json——Phase 1 尚未產單元 sidecar；gate 本身以 --selftest 證資格）")
        sys.exit(0)
    for e in errs:
        print("  [unit-schema]", e)
    print(f"RESULT: {'PASS ✅' if not errs else 'FAIL ❌（%d）' % len(errs)}（{len(files)} 檔）")
    sys.exit(0 if not errs else 1)


if __name__ == "__main__":
    main()
