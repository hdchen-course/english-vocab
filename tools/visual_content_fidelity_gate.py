#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""visual_content_fidelity_gate.py — AC-CORRECT 第四層 visual 證據子閘（§6.8.1 四層證據粒度）。

依據（normative，LEARNING_PATH_REBUILD_SPEC.md）：
  §6.8.1 第四層 visual：每圖/動畫 scene 列 `{scene_id, claim_ids[], 圖例語意, frames[], content_reviewer}`；
         Visual QA 的美術/裁切簽核（§AC-VIZ）不取代內容正確性簽核（圖文須一致，如四季動畫的地軸方向）。
  §6.2.2 細則7：各 teach[] 中 kind=="viz" 段的 `scene` 承載於 <page>.units.json sidecar；
         scene.claim_ids[] 每元素須解析到本單元 claims[] 既有 claim_id（懸空＝FAIL）。

本閘斷言「圖/動畫 scene 的內容證據」結構完整、且其 claim 綁定可解析（內容層，非美術層）：
  1. scene_id 非空，且單元內唯一（重複＝violation）。
  2. scene.claim_ids[] 每元素解析到本單元 claims[] 既有 claim_id（懸空＝violation）——兌現「圖文 claim 對應」。
  3. frames 良構：為非空陣列、每 frame 為物件（§6.8.1 frames[]）。
  4. content_reviewer 非空（§6.8.1：內容 reviewer，非美術簽核代替）。

英語島目前無任何 viz scene → honest pass（印「0 scenes」）；但本閘為真 gate：
  --selftest 證明它會擋下懸空 scene.claim_id、重複 scene_id、壞 frames、缺 content_reviewer。

scene 來源（任一出現即視為一個 scene）：teach[] 項中 kind=="viz" 且帶 `scene` 物件；或任何帶 `scene` 的 teach 項。

介面：--verify（exit=violations clamped 1..255，0=clean）；--selftest（exit 0/2）；
      無旗標 → usage exit 2；parse 失敗 fail-closed。相容 --release-id／--root。--json 可選。
additive，不改既有資料/gate。
"""
import argparse
import glob
import json
import os
import sys
import tempfile


def _nonempty_str(v):
    return isinstance(v, str) and v.strip() != ""


def _iter_scenes(unit):
    """回傳 [(scene_obj, teach_index)]。teach[] 項 kind=='viz' 或含 'scene' 者。"""
    out = []
    teach = unit.get("teach") or []
    if isinstance(teach, list):
        for idx, t in enumerate(teach):
            if isinstance(t, dict) and (t.get("kind") == "viz" or "scene" in t):
                out.append((t.get("scene"), idx))
    return out


def run(root):
    violations = []
    root = os.path.abspath(root)
    unit_files = sorted(glob.glob(os.path.join(root, "*.units.json")))
    if not unit_files:
        violations.append(f"[discovery] 在 {root} 找不到任何 *.units.json（空 glob＝fail-closed）")

    n_scenes = 0
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
            claim_ids = {c.get("claim_id") for c in (u.get("claims") or [])
                         if isinstance(c, dict) and _nonempty_str(c.get("claim_id"))}

            seen_scene = set()
            for scene, tidx in _iter_scenes(u):
                loc = f"{loc0} teach#{tidx}.scene"
                if not isinstance(scene, dict):
                    violations.append(f"[scene-structure] {loc}: kind=='viz' 段缺合法 scene 物件")
                    continue
                n_scenes += 1
                # 1. scene_id 非空＋唯一
                sid = scene.get("scene_id")
                if not _nonempty_str(sid):
                    violations.append(f"[scene-id-missing] {loc}: 缺非空 scene_id")
                else:
                    if sid in seen_scene:
                        violations.append(f"[scene-id-dup] {loc0}: scene_id '{sid}' 單元內重複（§6.2.2 唯一性）")
                    seen_scene.add(sid)
                sref = sid if _nonempty_str(sid) else "?"
                # 2. claim_ids 解析
                cids = scene.get("claim_ids")
                if not isinstance(cids, list):
                    violations.append(f"[scene-claim-type] {loc0} scene {sref}: claim_ids 應為陣列")
                    cids = []
                for cid in cids:
                    if cid not in claim_ids:
                        violations.append(
                            f"[scene-claim-dangling] {loc0} scene {sref}: claim_id '{cid}' 在本單元 claims[] "
                            f"無對應（§6.8.1 圖文 claim 對應，懸空＝FAIL）")
                # 3. frames 良構
                frames = scene.get("frames")
                if not isinstance(frames, list) or not frames:
                    violations.append(f"[scene-frames] {loc0} scene {sref}: frames 須為非空陣列")
                else:
                    for k, fr in enumerate(frames):
                        if not isinstance(fr, dict):
                            violations.append(f"[scene-frame-structure] {loc0} scene {sref} frame#{k}: frame 非物件")
                # 4. content_reviewer
                if not _nonempty_str(scene.get("content_reviewer")):
                    violations.append(
                        f"[scene-no-reviewer] {loc0} scene {sref}: 缺 content_reviewer（§6.8.1 內容 reviewer，"
                        f"非美術簽核代替）")

    stats = {"root": root, "unit_files": len(unit_files), "scenes": n_scenes, "violations": len(violations)}
    return violations, stats


# ---------------- selftest ----------------
def _write(root, name, obj):
    with open(os.path.join(root, name), "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False)


def _good_unit():
    return {"units": [{
        "unit_id": "earth.t_mid.astro.seasons",
        "claims": [{"claim_id": "c-tilt"}, {"claim_id": "c-sun"}],
        "teach": [{"kind": "viz", "scene": {
            "scene_id": "s-seasons", "claim_ids": ["c-tilt", "c-sun"],
            "圖例語意": "地軸傾斜造成四季", "frames": [{"t": 0}, {"t": 1}],
            "content_reviewer": "earth-science-expert"}}]}]}


def _selftest():
    results = []
    with tempfile.TemporaryDirectory() as good:
        _write(good, "s.units.json", _good_unit())
        v, _ = run(good)
        results.append(("好例（合規 scene）→ 0 violation", len(v) == 0, v))
    # honest 0-scenes：無 viz 單元 → 0 violation
    with tempfile.TemporaryDirectory() as na:
        _write(na, "x.units.json", {"units": [{"unit_id": "eng.t_base.vocab.x",
                "teach": [{"kind": "text", "body": "hi"}]}]})
        v, st = run(na)
        results.append(("無 scene → 0 violation 且 scenes==0（honest 0 scenes）", len(v) == 0 and st["scenes"] == 0, v))

    cases = {
        "scene.claim_id 懸空": lambda u: u["units"][0]["teach"][0]["scene"].update({"claim_ids": ["c-nope"]}),
        "scene_id 重複": lambda u: u["units"][0]["teach"].append(dict(u["units"][0]["teach"][0])),
        "frames 空": lambda u: u["units"][0]["teach"][0]["scene"].update({"frames": []}),
        "frame 非物件": lambda u: u["units"][0]["teach"][0]["scene"].update({"frames": ["oops"]}),
        "缺 content_reviewer": lambda u: u["units"][0]["teach"][0]["scene"].pop("content_reviewer"),
        "scene_id 缺": lambda u: u["units"][0]["teach"][0]["scene"].pop("scene_id"),
    }
    for name, mut in cases.items():
        with tempfile.TemporaryDirectory() as bad:
            u = _good_unit()
            mut(u)
            _write(bad, "s.units.json", u)
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
    ap = argparse.ArgumentParser(description="AC-CORRECT visual 內容忠實度子閘（fail-closed）")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--root", default=".")
    ap.add_argument("--release-id", default=None, help="（相容旗標）")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    if args.selftest:
        print("=== visual_content_fidelity_gate --selftest ===")
        ok = _selftest()
        print("RESULT:", "PASS ✅" if ok else "FAIL ❌")
        return 0 if ok else 2

    if args.verify:
        violations, stats = run(args.root)
        if args.json:
            print(json.dumps({"stats": stats, "violations": violations}, ensure_ascii=False, indent=2))
        else:
            print(f"[visual_content_fidelity_gate] root={stats['root']} files={stats['unit_files']} "
                  f"scenes={stats['scenes']}", file=sys.stderr)
            if stats["scenes"] == 0 and not violations:
                print("[visual_content_fidelity_gate] 0 scenes（無 viz；honest pass，0 violation）", file=sys.stderr)
            elif violations:
                print(f"[visual_content_fidelity_gate] {len(violations)} violation(s):", file=sys.stderr)
                for v in violations:
                    print("  - " + v, file=sys.stderr)
            else:
                print("[visual_content_fidelity_gate] CLEAN（0 violation）", file=sys.stderr)
        return _clamp(len(violations))

    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    sys.exit(main())
