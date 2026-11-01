#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""release_hash_gate.py — AC-CORRECT release-hash 子閘（§6.8.1「部署產物 hash＝簽核 hash，防『審 A 部署 B』」）。

依據（normative，LEARNING_PATH_REBUILD_SPEC.md）：
  §6.8.1：部署產物 hash＝簽核 hash（防「審 A 部署 B」）；release 受驗 snapshot（F6-05）。
  §11.A AC-CORRECT：release_hash_gate（審 A 部署 B＝FAIL）。
  promote_verified.py：verified_overlay.json 綁 `manifest_sha`＝sha256(knowledge_points.json bytes)[:16]。

本閘斷言「release 的 verified 集所綁定的 manifest hash」＝「當前 manifest 的重算 hash」：
  verified_overlay.json.manifest_sha  ==  sha256(knowledge_points.json)[:16]
不符＝「overlay 審的是舊 manifest、但部署/現用的是新 manifest」（審 A 部署 B）＝violation。
鏡射 promote_verified.manifest_sha()，同一紀律。

snapshot 解析（F6-05）：
  - 給 --release-id 時，對 `releases/<id>/` immutable snapshot 展開（路徑逃逸／不存在＝FAIL）。
  - 未給 --release-id 時，對 --root（預設 repo root）的 workspace 檔展開。
尚無 release 產物（overlay 不存在且未給 release-id）→ honest N/A pass（印明確訊息，exit 0）。

介面：--verify（exit=violations clamped 1..255，0=clean）；--selftest（exit 0/2）；
      無旗標 → usage exit 2；parse 失敗 fail-closed。相容 --root。--json 可選。
additive，不改既有資料/gate。
"""
import argparse
import hashlib
import json
import os
import sys
import tempfile

MANIFEST_REL = os.path.join("authoring", "knowledge_points.json")
OVERLAY_REL = os.path.join("authoring", "verified_overlay.json")


def _sha16(path):
    with open(path, "rb") as fh:
        return hashlib.sha256(fh.read()).hexdigest()[:16]


def _resolve_base(root, release_id):
    """回傳 (base_dir, violations_prefix:list)。release-id 走 releases/<id>/ snapshot（F6-05）。"""
    root = os.path.abspath(root)
    if not release_id:
        return root, []
    releases = os.path.join(root, "releases")
    snap = os.path.abspath(os.path.join(releases, release_id))
    # 防路徑逃逸（比照 verify_learning_path）
    if os.path.commonpath([snap, os.path.abspath(releases)]) != os.path.abspath(releases):
        return None, [f"[release-escape] release-id '{release_id}' 逃逸 releases/（拒）"]
    if not os.path.isdir(snap):
        return None, [f"[release-missing] release snapshot 不存在：releases/{release_id}（F6-05 FAIL）"]
    return snap, []


def run(root, release_id=None):
    violations = []
    base, pre = _resolve_base(root, release_id)
    if pre:
        return pre, {"root": os.path.abspath(root), "release_id": release_id, "violations": len(pre),
                     "status": "release-snapshot-error"}

    manifest = os.path.join(base, MANIFEST_REL)
    overlay = os.path.join(base, OVERLAY_REL)

    if not os.path.isfile(overlay):
        # 尚無 release 產物：誠實 N/A（未給 release-id 時）。給了 release-id 卻缺 overlay＝該 snapshot 不完整→FAIL。
        if release_id:
            violations.append(f"[overlay-missing] release snapshot {release_id} 缺 verified_overlay.json（不完整）")
            status = "overlay-missing-in-snapshot"
        else:
            status = "na-no-release-artifact"
        return violations, {"root": os.path.abspath(root), "release_id": release_id,
                            "violations": len(violations), "status": status}

    if not os.path.isfile(manifest):
        violations.append(f"[manifest-missing] 缺 {MANIFEST_REL}（無法重算 manifest hash，fail-closed）")
        return violations, {"root": os.path.abspath(root), "release_id": release_id,
                            "violations": len(violations), "status": "manifest-missing"}

    try:
        stored = json.loads(open(overlay, encoding="utf-8").read())
    except (OSError, json.JSONDecodeError) as e:
        violations.append(f"[overlay-parse] 無法解析 verified_overlay.json（{e}；fail-closed）")
        return violations, {"root": os.path.abspath(root), "release_id": release_id,
                            "violations": len(violations), "status": "overlay-parse-error"}

    stored_sha = stored.get("manifest_sha")
    recomputed = _sha16(manifest)
    status = "verified"
    if not isinstance(stored_sha, str) or not stored_sha:
        violations.append("[overlay-no-sha] verified_overlay.json 缺 manifest_sha（無綁定＝fail-closed）")
    elif stored_sha != recomputed:
        violations.append(
            f"[hash-mismatch] overlay.manifest_sha={stored_sha} ≠ 當前 manifest 重算={recomputed}"
            f"——審 A 部署 B（§6.8.1 部署產物 hash＝簽核 hash）")

    return violations, {"root": os.path.abspath(root), "release_id": release_id,
                        "stored_sha": stored_sha, "recomputed_sha": recomputed,
                        "violations": len(violations), "status": status}


# ---------------- selftest ----------------
def _mk(tmp, manifest_bytes, overlay_obj):
    os.makedirs(os.path.join(tmp, "authoring"), exist_ok=True)
    with open(os.path.join(tmp, MANIFEST_REL), "wb") as fh:
        fh.write(manifest_bytes)
    with open(os.path.join(tmp, OVERLAY_REL), "w", encoding="utf-8") as fh:
        json.dump(overlay_obj, fh, ensure_ascii=False)


def _selftest():
    results = []
    mb = json.dumps({"items": [{"id": "kp.a"}]}, ensure_ascii=False).encode("utf-8")
    good_sha = hashlib.sha256(mb).hexdigest()[:16]

    with tempfile.TemporaryDirectory() as good:
        _mk(good, mb, {"manifest_sha": good_sha, "verified_ids": ["kp.a"]})
        v, _ = run(good)
        results.append(("好例：overlay sha＝重算 → 0 violation", len(v) == 0, v))

    with tempfile.TemporaryDirectory() as bad:
        _mk(bad, mb, {"manifest_sha": "deadbeefdeadbeef", "verified_ids": ["kp.a"]})
        v, _ = run(bad)
        results.append(("壞例：sha 不符（審 A 部署 B）→ ≥1 violation", len(v) >= 1, v))

    with tempfile.TemporaryDirectory() as nosha:
        _mk(nosha, mb, {"verified_ids": ["kp.a"]})
        v, _ = run(nosha)
        results.append(("壞例：overlay 缺 manifest_sha → ≥1 violation", len(v) >= 1, v))

    with tempfile.TemporaryDirectory() as na:
        os.makedirs(os.path.join(na, "authoring"), exist_ok=True)
        v, st = run(na)
        results.append(("N/A：無 overlay 且無 release-id → 0 violation（honest N/A）",
                        len(v) == 0 and st["status"] == "na-no-release-artifact", v))

    with tempfile.TemporaryDirectory() as miss:
        v, st = run(miss, release_id="nope-1")
        results.append(("壞例：給 release-id 但 snapshot 不存在 → ≥1 violation",
                        len(v) >= 1 and st["status"] == "release-snapshot-error", v))

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
    ap = argparse.ArgumentParser(description="AC-CORRECT release-hash 子閘（fail-closed）")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--root", default=".")
    ap.add_argument("--release-id", default=None, help="releases/<id>/ immutable snapshot（F6-05）")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    if args.selftest:
        print("=== release_hash_gate --selftest ===")
        ok = _selftest()
        print("RESULT:", "PASS ✅" if ok else "FAIL ❌")
        return 0 if ok else 2

    if args.verify:
        violations, stats = run(args.root, args.release_id)
        if args.json:
            print(json.dumps({"stats": stats, "violations": violations}, ensure_ascii=False, indent=2))
        else:
            print(f"[release_hash_gate] root={stats['root']} release_id={stats.get('release_id')} "
                  f"status={stats.get('status')}", file=sys.stderr)
            if stats.get("status") == "na-no-release-artifact":
                print("[release_hash_gate] 尚無 release 產物（verified_overlay.json 不存在）→ honest N/A pass",
                      file=sys.stderr)
            elif violations:
                print(f"[release_hash_gate] {len(violations)} violation(s):", file=sys.stderr)
                for v in violations:
                    print("  - " + v, file=sys.stderr)
            else:
                print(f"[release_hash_gate] CLEAN（overlay.manifest_sha={stats.get('stored_sha')} "
                      f"＝重算，0 violation）", file=sys.stderr)
        return _clamp(len(violations))

    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    sys.exit(main())
