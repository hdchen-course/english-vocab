#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""generator_property_gate.py — AC-CORRECT 生成器 property 子閘（§6.8.1 獨立 oracle／property tests）。

依據（normative，LEARNING_PATH_REBUILD_SPEC.md）：
  §6.8.1 獨立 oracle（B-08）：隨機題生成器須固定 seed＋property tests＋小域窮舉，
         並測零/負/極端/邊界/單位/四捨五入。
  §11.A AC-CORRECT：generator_property_gate（固定 seed＋窮舉/property）。

本閘對「單元宣告的程序化生成題（generator）」靜態斷言其宣告的不變量在所列樣本上成立；
若 repo 目前無任何 generator → honest N/A pass（不是 vacuous-cheat，是誠實的「無適用對象」）。

生成器宣告載體（本閘承認的來源，任一出現即視為「有 generator」）：
  (a) 單元層 `generators[]`，每筆 `{generator_id, invariants?{bounds?{<field>:[lo,hi]}}, samples|items[]}`；
  (b) practice 題帶 `generated==true` 或 `procedural==true`（視該題物件本身為一個生成樣本）。

每個生成樣本（sample/item 物件，或上述 (b) 的 practice 題）斷言：
  1. 若有 options[]：選項無重複（§6.8.1 no duplicate options）。
  2. 若有 options[] 且有 answer：answer ∈ options（§6.8.1 answer∈options）。
  3. bounds：invariants.bounds（generator 層）或 sample.bounds（樣本層）宣告的每個
     `<field>:[lo,hi]`，若樣本帶該數值欄位，值須落在 [lo,hi]（§6.8.1 bounds）。

介面：--verify（exit=violations clamped 1..255，0=clean；無 generator→0 並印 N/A）；
      --selftest（exit 0/2）；無旗標 → usage exit 2；parse 失敗 fail-closed。
      相容 --release-id／--root。--json 可選。additive，不改既有資料/gate。
"""
import argparse
import glob
import json
import numbers
import os
import sys
import tempfile


def _num(v):
    return isinstance(v, numbers.Number) and not isinstance(v, bool)


def _check_sample(sample, bounds, loc, violations):
    """對單一生成樣本套三項 property。"""
    opts = sample.get("options")
    if isinstance(opts, list):
        # 1. 無重複選項（以 JSON 正規化比較，容許非 hashable 元素）
        seen = []
        for o in opts:
            key = json.dumps(o, ensure_ascii=False, sort_keys=True)
            if key in seen:
                violations.append(f"[dup-option] {loc}: 選項重複 '{o}'（§6.8.1 no duplicate options）")
            seen.append(key)
        # 2. answer ∈ options
        if "answer" in sample:
            a = sample.get("answer")
            answers = a if isinstance(a, list) else [a]
            for one in answers:
                if one not in opts:
                    violations.append(f"[answer-not-in-options] {loc}: answer '{one}' 不在 options（§6.8.1）")
    # 3. bounds
    eff_bounds = {}
    if isinstance(bounds, dict):
        eff_bounds.update(bounds)
    if isinstance(sample.get("bounds"), dict):
        eff_bounds.update(sample["bounds"])
    for field, rng in eff_bounds.items():
        if not (isinstance(rng, list) and len(rng) == 2 and _num(rng[0]) and _num(rng[1])):
            violations.append(f"[bad-bounds-spec] {loc}: bounds['{field}'] 非 [lo,hi] 數值對")
            continue
        if field in sample:
            val = sample.get(field)
            if not _num(val):
                violations.append(f"[bound-nonnumeric] {loc}: 欄位 '{field}' 非數值，無法驗 bounds")
            elif not (rng[0] <= val <= rng[1]):
                violations.append(f"[out-of-bounds] {loc}: '{field}'={val} 超出 [{rng[0]},{rng[1]}]（§6.8.1 bounds）")


def run(root):
    violations = []
    root = os.path.abspath(root)
    unit_files = sorted(glob.glob(os.path.join(root, "*.units.json")))
    if not unit_files:
        violations.append(f"[discovery] 在 {root} 找不到任何 *.units.json（空 glob＝fail-closed）")

    n_gen = n_samples = 0
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
                continue
            uid = u.get("unit_id")
            loc0 = f"{base}[{uid if isinstance(uid, str) else '#'+str(i)}]"

            # (a) 單元層 generators[]
            gens = u.get("generators")
            if isinstance(gens, list):
                for g in gens:
                    if not isinstance(g, dict):
                        violations.append(f"[generator-structure] {loc0}: generator 非物件")
                        continue
                    n_gen += 1
                    gid = g.get("generator_id", "?")
                    inv = g.get("invariants") or {}
                    bounds = inv.get("bounds") if isinstance(inv, dict) else None
                    samples = g.get("samples") or g.get("items") or []
                    if not isinstance(samples, list) or not samples:
                        violations.append(
                            f"[generator-no-samples] {loc0} gen {gid}: 無 samples/items（固定 seed 的 property "
                            f"測試須列出窮舉樣本，§6.8.1）")
                        continue
                    for k, s in enumerate(samples):
                        if not isinstance(s, dict):
                            violations.append(f"[sample-structure] {loc0} gen {gid} sample#{k}: 非物件")
                            continue
                        n_samples += 1
                        _check_sample(s, bounds, f"{loc0} gen {gid} sample#{k}", violations)

            # (b) practice 題帶 generated/procedural
            practice = u.get("practice") or []
            if isinstance(practice, list):
                for p in practice:
                    if isinstance(p, dict) and (p.get("generated") is True or p.get("procedural") is True):
                        n_gen += 1
                        n_samples += 1
                        inv = p.get("invariants") or {}
                        bounds = inv.get("bounds") if isinstance(inv, dict) else None
                        _check_sample(p, bounds, f"{loc0} 題 {p.get('question_id', '?')}（generated）", violations)

    stats = {"root": root, "unit_files": len(unit_files), "generators": n_gen,
             "samples": n_samples, "violations": len(violations)}
    return violations, stats


# ---------------- selftest ----------------
def _write(root, name, obj):
    with open(os.path.join(root, name), "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False)


def _good_unit():
    return {"units": [{"unit_id": "math.t_base.arith.add", "generators": [{
        "generator_id": "g-add", "invariants": {"bounds": {"a": [0, 9], "b": [0, 9]}},
        "samples": [
            {"a": 2, "b": 3, "options": ["5", "6", "4"], "answer": "5"},
            {"a": 9, "b": 0, "options": ["9", "0", "18"], "answer": "9"}]}]}]}


def _selftest():
    results = []
    # 好例：生成器樣本全部合規
    with tempfile.TemporaryDirectory() as good:
        _write(good, "g.units.json", _good_unit())
        v, st = run(good)
        results.append(("好例（合規生成器）→ 0 violation", len(v) == 0, v))
    # honest N/A：無任何 generator 的單元 → 0 violation（誠實放行，非 vacuous-cheat）
    with tempfile.TemporaryDirectory() as na:
        _write(na, "x.units.json", {"units": [{"unit_id": "eng.t_base.vocab.x", "practice": [
            {"question_id": "Q1", "type": "mcq"}]}]})
        v, st = run(na)
        results.append(("無 generator → 0 violation 且 samples==0（honest N/A）", len(v) == 0 and st["samples"] == 0, v))

    cases = {
        "answer 不在 options": lambda u: u["units"][0]["generators"][0]["samples"][0].update({"answer": "99"}),
        "選項重複": lambda u: u["units"][0]["generators"][0]["samples"][0].update({"options": ["5", "5", "4"]}),
        "超出 bounds": lambda u: u["units"][0]["generators"][0]["samples"][0].update({"a": 42}),
        "生成器無 samples": lambda u: u["units"][0]["generators"][0].pop("samples"),
    }
    for name, mut in cases.items():
        with tempfile.TemporaryDirectory() as bad:
            u = _good_unit()
            mut(u)
            _write(bad, "g.units.json", u)
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
    ap = argparse.ArgumentParser(description="AC-CORRECT generator property 子閘（fail-closed）")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--root", default=".")
    ap.add_argument("--release-id", default=None, help="（相容旗標）")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    if args.selftest:
        print("=== generator_property_gate --selftest ===")
        ok = _selftest()
        print("RESULT:", "PASS ✅" if ok else "FAIL ❌")
        return 0 if ok else 2

    if args.verify:
        violations, stats = run(args.root)
        if args.json:
            print(json.dumps({"stats": stats, "violations": violations}, ensure_ascii=False, indent=2))
        else:
            print(f"[generator_property_gate] root={stats['root']} files={stats['unit_files']} "
                  f"generators={stats['generators']} samples={stats['samples']}", file=sys.stderr)
            if stats["generators"] == 0 and not violations:
                print("[generator_property_gate] 未發現任何宣告的 generator（honest N/A，0 violation）", file=sys.stderr)
            elif violations:
                print(f"[generator_property_gate] {len(violations)} violation(s):", file=sys.stderr)
                for v in violations:
                    print("  - " + v, file=sys.stderr)
            else:
                print("[generator_property_gate] CLEAN（0 violation）", file=sys.stderr)
        return _clamp(len(violations))

    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    sys.exit(main())
