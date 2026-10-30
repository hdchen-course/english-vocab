#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""coverage_gate.py — AC-COV-1／AC-COV-2 的機器強制（Phase 1 建、Phase 2/3 內容到位後真正咬）。

AC-COV-2（`--verify-count`／`--selftest-count`）：`knowledge_points.json` 的 id **兩兩相異、重複＝0**
  （§6 AC-COV-2『manifest 重複 id＝0』；id 是全站 join 主鍵，撞號毀覆蓋矩陣/索引）。此檢查**現在即可驗**
  （manifest 已存在），且為其他 AC-COV-2 依賴者（reward id/unit_id 唯一性）的母體基準。

AC-COV-1（`--verify`／`--selftest`）：每一條 **minimum（`beyond=false`）** 知識點都須被站上某單元**真教＋真考**
  ——即存在某 unit，其 `(∪teach.kp_ids)` 與 `(∪practice.kp_ids)` **皆**含該 kp（§6.2.2 rubric⑦／§10.1
  Phase 3 DONE-GATE『未真覆蓋 minimum id＝0』）。單元來源＝`authoring/units_index.json`（build 工具彙總
  所有 `*.units.json`，見 §6.7）。**此為最終覆蓋門檻**：Phase 1/2 內容未齊時本檢查誠實 FAIL（列出未覆蓋
  minimum 數），不 vacuous 放行——覆蓋矩陣 100% 是 Phase 3 exit，不得假裝提前達成。

介面：--selftest-count / --verify-count（AC-COV-2）；--selftest / --verify（AC-COV-1）。
EXIT：0=過；1=有違規（重複 id>0，或未覆蓋 minimum>0）；2=selftest 失敗。
"""
import argparse, collections, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "authoring", "knowledge_points.json")
UNITS_INDEX = os.path.join(ROOT, "authoring", "units_index.json")


def _load_items(path=MANIFEST):
    return json.loads(open(path, encoding="utf-8").read())["items"]


def dup_ids(items):
    """回傳重複的 id → 次數（>1）。"""
    c = collections.Counter(r["id"] for r in items)
    return {k: n for k, n in c.items() if n > 1}


def uncovered_minimums(items, units):
    """units＝unit 物件 list（或 units_index 的彙總）。回傳未『真教＋真考』的 minimum id 集合。"""
    taught, tested = set(), set()
    for u in units:
        for t in u.get("teach", []):
            taught.update(t.get("kp_ids") or [])
        for p in u.get("practice", []):
            tested.update(p.get("kp_ids") or [])
    covered = taught & tested
    minimums = [r["id"] for r in items if not r.get("beyond")]
    return [kid for kid in minimums if kid not in covered]


def _units_from_index():
    if not os.path.exists(UNITS_INDEX):
        return []
    data = json.loads(open(UNITS_INDEX, encoding="utf-8").read())
    return data.get("units", data) if isinstance(data, (dict, list)) else []


# ---------- selftests ----------
def _selftest_count():
    good = [{"id": "a"}, {"id": "b"}, {"id": "c"}]
    bad = [{"id": "a"}, {"id": "b"}, {"id": "a"}]
    ok1 = (dup_ids(good) == {})
    ok2 = (dup_ids(bad) == {"a": 2})
    print(f"  [{'OK' if ok1 else 'BAD'}] no-dup manifest → 0 dup")
    print(f"  [{'OK' if ok2 else 'BAD'}] dup id 'a'×2 → 偵測到")
    return ok1 and ok2


def _selftest():
    items = [{"id": "m1", "beyond": False}, {"id": "m2", "beyond": False},
             {"id": "e1", "beyond": True}]
    full = [{"teach": [{"kp_ids": ["m1", "m2"]}], "practice": [{"kp_ids": ["m1", "m2"]}]}]
    taught_only = [{"teach": [{"kp_ids": ["m1", "m2"]}], "practice": [{"kp_ids": ["m1"]}]}]
    none = []
    ok1 = (uncovered_minimums(items, full) == [])                 # 全覆蓋（beyond e1 不計）
    ok2 = (uncovered_minimums(items, taught_only) == ["m2"])      # m2 教了沒考 → 未覆蓋
    ok3 = (sorted(uncovered_minimums(items, none)) == ["m1", "m2"])  # 無單元 → minimum 全未覆蓋
    print(f"  [{'OK' if ok1 else 'BAD'}] 真教真考全 minimum → 0 未覆蓋（beyond 不計）")
    print(f"  [{'OK' if ok2 else 'BAD'}] 教了沒考 → 該 id 未覆蓋")
    print(f"  [{'OK' if ok3 else 'BAD'}] 無單元 → minimum 全未覆蓋（誠實 FAIL，非 vacuous）")
    return ok1 and ok2 and ok3


def main():
    ap = argparse.ArgumentParser(description="AC-COV-1/2 coverage gate（fail-closed）")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--selftest-count", action="store_true")
    ap.add_argument("--verify-count", action="store_true")
    args = ap.parse_args()

    if args.selftest_count:
        print("=== coverage_gate --selftest-count (AC-COV-2) ===")
        ok = _selftest_count(); print("RESULT:", "PASS ✅" if ok else "FAIL ❌"); sys.exit(0 if ok else 2)
    if args.selftest:
        print("=== coverage_gate --selftest (AC-COV-1) ===")
        ok = _selftest(); print("RESULT:", "PASS ✅" if ok else "FAIL ❌"); sys.exit(0 if ok else 2)

    items = _load_items()
    if args.verify_count:
        d = dup_ids(items)
        if d:
            for k, n in sorted(d.items()):
                print(f"  [cov-2] 重複 id `{k}` ×{n}")
        print(f"RESULT(AC-COV-2): {'PASS ✅' if not d else 'FAIL ❌'}（manifest {len(items)} 條，重複 {len(d)}）")
        sys.exit(0 if not d else 1)
    if args.verify:
        units = _units_from_index()
        unc = uncovered_minimums(items, units)
        n_min = sum(1 for r in items if not r.get("beyond"))
        if unc:
            print(f"  [cov-1] 未真教真考覆蓋的 minimum id：{len(unc)}（示例 {unc[:5]}）"
                  + ("　＊units_index.json 尚未產出（Phase 2 內容未齊）" if not units else ""))
        print(f"RESULT(AC-COV-1): {'PASS ✅' if not unc else 'FAIL ❌'}（minimum {n_min}，未覆蓋 {len(unc)}；覆蓋矩陣 100% 為 Phase 3 exit）")
        sys.exit(0 if not unc else 1)
    ap.error("須指定 --verify / --verify-count / --selftest / --selftest-count")


if __name__ == "__main__":
    main()
