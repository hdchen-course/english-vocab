#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""question_correctness_gate.py — AC-CORRECT 第三層 question 證據子閘（§6.8.1 四層證據粒度）。

依據（normative，LEARNING_PATH_REBUILD_SPEC.md）：
  §6.8.1 第三層 question：`{question_id, kp_ids[], required_kp_ids[], type, answer,
         answer_evidence[→claim], distractor_rationales{}, validation_method(exhaustive|oracle|source|expert)}`；
         required_kp_ids ⊇ kp_ids；MCQ 須證明唯一可辯護正解（必填 distractor_rationales）。
  §6.2.2 細則3：每題必標 question_id（單元內唯一）＋ kp_ids[]；required_kp_ids 必填非空且 ⊇ kp_ids、
         每 id 存在於 manifest；MCQ 必填 distractor_rationales。

fail-closed 斷言（逐 root-level *.units.json）：
  1. 每題有非空 question_id，且單元內唯一（重複＝violation）。
  2. kp_ids[] ⊆ required_kp_ids[]（§6.8.1 required_kp_ids ⊇ kp_ids）。
  3. required_kp_ids[] 每 id 解析到 knowledge_points.json 的 manifest KP id（懸空＝violation）。
  4. MCQ（type=="mcq"）帶非空 distractor_rationales{}（§6.2.2 MCQ 必填）。
  5. answer 良構：非空；若為數值型（type 含 'num' 或 answer_type=='numeric'）須可 float 解析。
  6. validation_method ∈ {exhaustive, oracle, source, expert}。

介面：--verify（exit=violations clamped 1..255，0=clean）；--selftest（exit 0/2）；
      無旗標 → usage exit 2；parse 失敗 fail-closed。相容 --release-id／--root。--json 可選。
additive 工具，不改任何既有資料/gate。
"""
import argparse
import glob
import json
import os
import sys
import tempfile

VALIDATION_METHODS = {"exhaustive", "oracle", "source", "expert"}


def _nonempty_str(v):
    return isinstance(v, str) and v.strip() != ""


def _is_numeric_question(p):
    t = str(p.get("type", "")).lower()
    return "num" in t or str(p.get("answer_type", "")).lower() == "numeric"


def _answer_wellformed(p):
    """非空；數值型須可 float 解析。回傳 (ok, why)。"""
    a = p.get("answer")
    if a is None:
        return False, "answer 缺/為 null"
    if isinstance(a, str) and a.strip() == "":
        return False, "answer 為空字串"
    if isinstance(a, (list, dict)) and len(a) == 0:
        return False, "answer 為空陣列/物件"
    if _is_numeric_question(p):
        try:
            float(a if not isinstance(a, bool) else "x")
        except (TypeError, ValueError):
            return False, f"數值型題 answer '{a}' 無法 float 解析"
    return True, ""


def _load_manifest_kp_ids(root):
    """回傳 (kp_ids:set|None, err:str|None)。None＝讀取失敗（fail-closed 由呼叫端處理）。"""
    kp_path = os.path.join(root, "authoring", "knowledge_points.json")
    if not os.path.isfile(kp_path):
        return None, f"缺 authoring/knowledge_points.json（{kp_path}）"
    try:
        with open(kp_path, encoding="utf-8") as fh:
            kpm = json.load(fh)
    except (OSError, json.JSONDecodeError) as e:
        return None, f"無法解析 knowledge_points.json（{e}）"
    items = kpm.get("knowledge_points") or kpm.get("items") or (kpm if isinstance(kpm, list) else [])
    return {x.get("id") for x in items if isinstance(x, dict) and _nonempty_str(x.get("id"))}, None


def run(root):
    violations = []
    root = os.path.abspath(root)
    unit_files = sorted(glob.glob(os.path.join(root, "*.units.json")))
    if not unit_files:
        violations.append(f"[discovery] 在 {root} 找不到任何 *.units.json（空 glob＝fail-closed）")

    kp_ids, kp_err = _load_manifest_kp_ids(root)
    if kp_err:
        violations.append(f"[manifest] {kp_err}（fail-closed）")
        kp_ids = set()

    n_q = 0
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
            practice = u.get("practice") or []
            if not isinstance(practice, list):
                violations.append(f"[practice-type] {loc}: 'practice' 應為陣列")
                continue
            seen_qid = set()
            for p in practice:
                if not isinstance(p, dict):
                    violations.append(f"[practice-structure] {loc}: practice 題非物件")
                    continue
                n_q += 1
                # 1. question_id 非空＋單元內唯一
                qid = p.get("question_id")
                if not _nonempty_str(qid):
                    violations.append(f"[qid-missing] {loc}: practice 題缺非空 question_id")
                else:
                    if qid in seen_qid:
                        violations.append(f"[qid-dup] {loc}: question_id '{qid}' 單元內重複（§6.2.2 唯一性）")
                    seen_qid.add(qid)
                qref = qid if _nonempty_str(qid) else "?"

                # 2. kp_ids ⊆ required_kp_ids
                kp = p.get("kp_ids")
                rk = p.get("required_kp_ids")
                if not isinstance(kp, list):
                    violations.append(f"[kp-type] {loc} 題 {qref}: kp_ids 應為陣列")
                    kp = []
                if not isinstance(rk, list) or not rk:
                    violations.append(f"[required-kp-missing] {loc} 題 {qref}: required_kp_ids 必填非空（§6.2.2）")
                    rk = rk if isinstance(rk, list) else []
                for k in kp:
                    if k not in rk:
                        violations.append(
                            f"[kp-not-subset] {loc} 題 {qref}: kp_id '{k}' 不在 required_kp_ids（須 required ⊇ kp）")
                # 3. required_kp_ids 解析 manifest
                for k in rk:
                    if k not in kp_ids:
                        violations.append(
                            f"[required-kp-dangling] {loc} 題 {qref}: required_kp_id '{k}' 在 manifest 無對應（懸空）")
                # 4. MCQ distractor_rationales
                if p.get("type") == "mcq":
                    dr = p.get("distractor_rationales")
                    if not isinstance(dr, dict) or len(dr) == 0:
                        violations.append(
                            f"[mcq-no-distractor] {loc} 題 {qref}: MCQ 缺非空 distractor_rationales（§6.2.2）")
                # 5. answer 良構
                ok, why = _answer_wellformed(p)
                if not ok:
                    violations.append(f"[answer-illformed] {loc} 題 {qref}: {why}")
                # 6. validation_method enum
                vm = p.get("validation_method")
                if vm not in VALIDATION_METHODS:
                    violations.append(
                        f"[validation-method] {loc} 題 {qref}: validation_method '{vm}' 不在 "
                        f"{sorted(VALIDATION_METHODS)}")

    stats = {"root": root, "unit_files": len(unit_files), "questions": n_q,
             "kp_manifest_size": len(kp_ids), "violations": len(violations)}
    return violations, stats


# ---------------- selftest ----------------
def _write(root, name, obj):
    with open(os.path.join(root, name), "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False)


def _mk_root(tmp, unit):
    os.makedirs(os.path.join(tmp, "authoring"), exist_ok=True)
    _write(tmp, "a.units.json", {"units": [unit]})
    _write(os.path.join(tmp, "authoring"), "knowledge_points.json",
           {"items": [{"id": "kp.a"}, {"id": "kp.b"}]})


def _good_q():
    return {"question_id": "Q1", "type": "mcq", "kp_ids": ["kp.a"], "required_kp_ids": ["kp.a", "kp.b"],
            "answer": "x", "options": ["x", "y"], "distractor_rationales": {"y": "錯"},
            "validation_method": "expert"}


def _good_unit():
    return {"unit_id": "eng.t_base.vocab.q", "practice": [_good_q()]}


def _selftest():
    results = []
    with tempfile.TemporaryDirectory() as good:
        _mk_root(good, _good_unit())
        v, _ = run(good)
        results.append(("好例 → 0 violation", len(v) == 0, v))

    cases = {
        "question_id 重複": lambda u: u["practice"].append(dict(_good_q())),
        "kp 非 required 子集": lambda u: u["practice"][0].update({"kp_ids": ["kp.a", "kp.z"]}),
        "required_kp 懸空": lambda u: u["practice"][0].update({"required_kp_ids": ["kp.nope"]}),
        "MCQ 缺 distractor": lambda u: u["practice"][0].pop("distractor_rationales"),
        "answer 空": lambda u: u["practice"][0].update({"answer": ""}),
        "validation_method 非 enum": lambda u: u["practice"][0].update({"validation_method": "vibes"}),
        "required_kp_ids 缺": lambda u: u["practice"][0].pop("required_kp_ids"),
    }
    for name, mut in cases.items():
        with tempfile.TemporaryDirectory() as bad:
            u = _good_unit()
            mut(u)
            _mk_root(bad, u)
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
    ap = argparse.ArgumentParser(description="AC-CORRECT question 證據子閘（fail-closed）")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--root", default=".")
    ap.add_argument("--release-id", default=None, help="（相容旗標）")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    if args.selftest:
        print("=== question_correctness_gate --selftest ===")
        ok = _selftest()
        print("RESULT:", "PASS ✅" if ok else "FAIL ❌")
        return 0 if ok else 2

    if args.verify:
        violations, stats = run(args.root)
        if args.json:
            print(json.dumps({"stats": stats, "violations": violations}, ensure_ascii=False, indent=2))
        else:
            print(f"[question_correctness_gate] root={stats['root']} files={stats['unit_files']} "
                  f"questions={stats['questions']} kp_manifest={stats['kp_manifest_size']}", file=sys.stderr)
            if violations:
                print(f"[question_correctness_gate] {len(violations)} violation(s):", file=sys.stderr)
                for v in violations:
                    print("  - " + v, file=sys.stderr)
            else:
                print("[question_correctness_gate] CLEAN（0 violation）", file=sys.stderr)
        return _clamp(len(violations))

    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    sys.exit(main())
