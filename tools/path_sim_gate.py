#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""path_sim_gate.py — AC-PATH-1／AC-PATH-2 的確定性靜態 gate（學習路徑 Phase 1）。

依據（normative，LEARNING_PATH_REBUILD_SPEC.md）：
  §3.2 學習路徑三層模型（階段／科目×主軸／單元；單元宣告 prerequisites＋knowledge-point ids）
  §3.3 路徑不變量 INV-1..4（§9 模擬據此驗證）
  §6.6／§6.2.2 est_minutes≤12（INV-4 不倦怠的可機器判定條款）
  §9   知識受限學習者模擬協定（K(U)=K_pre∪teach(U)；斷層＝INV-1 違反）
  §11.A AC-PATH-1（每條主要路徑無斷層，INV-1）／AC-PATH-2（可學會/記得牢/不倦怠，INV-2/3/4）
  acceptance_criteria.json：AC-PATH-1→`path_sim_gate.py --verify`、
                            AC-PATH-2→`path_sim_gate.py --verify-inv4`

誠實範疇（§0.2；不 overclaim）：
  §9 的完整模擬（INV-2 可學會、INV-3 記得牢、INV-4 倦怠的質性分級）本質需 LLM panel，
  無法在純靜態 gate 內完全機器化——那部分由 §8 panel ＋ `sim_output_schema_gate.py`／
  `path_coverage_gate.py` 承擔。本 gate 只強制「可確定性機器判定」的路徑子基盤，且 fail-closed：

  --verify（AC-PATH-1，INV-1 無斷層的確定性子基盤）斷言——
    (P1) 每個單元的 prerequisites 欄位存在且為 list（缺/型別錯＝violation，fail-closed）。
    (P2) 每條 prerequisite 解析到既有單元 id（disk *.units.json ∪ authoring/units_index.json）；
         懸空參照＝斷層（無此先備單元，學習者走不到）→ violation。
    (P3) 無自環：單元不得以自己為先備。
    (P4) 先備 DAG 無環：整張單元先備圖必須可拓撲排序（存在合法學習順序）；
         有環＝INV-1 無法滿足（無起點）→ violation（附環路徑）。
    (P5) 每個單元 knowledge_point_ids[] 的每個 id 解析到 authoring/knowledge_points.json；
         懸空 KP＝K(U) 無法定義、INV-1 斷層證據 → violation。
    （INV-2/INV-3 的語意判定非靜態可機器化，留 §9 panel；本 gate 不假裝涵蓋。）

  --verify-inv4（AC-PATH-2，INV-4 不倦怠的確定性條款）斷言——
    (I1) 每個單元 est_minutes 存在、為數值（非 bool）、且 ≤ 12（§6.6）。
         缺/非數值/>12 皆＝violation（fail-closed；不得以缺值當 ≤12 放行）。
    （難度階梯/回饋密度等 §9.6 代理僅觸發 panel 複判、非自動 defect，故不列入本硬 gate。）

介面：
  --verify           AC-PATH-1 證據驗證（對真實 repo）
  --verify-inv4      AC-PATH-2 INV-4 est_minutes 驗證（對真實 repo）
  --selftest         好例/壞例 fixtures（含環/懸空/自環/est=20）全數驗證（AC-PATH-1 qualification）
  --selftest-inv4    INV-4 est_minutes fixtures（AC-PATH-2 qualification）
  --root PATH        掃描根目錄（紅隊可指向暫存副本；預設＝repo root）
  --release-id ID    相容 orchestrator（本 gate 為靜態、忽略其值）

EXIT：
  --verify / --verify-inv4：0＝clean；否則＝violation 數 clamp 到 1..255。
  --selftest / --selftest-inv4：0＝PASS，2＝FAIL。
  無參數：印用法、exit 2。
  解析/IO 例外：fail-closed（計為 violation，不靜默放行）。

additive 工具，不改任何既有頁/資料/引擎。繁體中文（零簡體）。
"""
import argparse
import glob
import json
import numbers
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EST_MINUTES_MAX = 12  # §6.6 / §6.2.2 INV-4


def _clamp(n):
    """violation 數 → exit code：0 維持 0；>0 clamp 到 1..255。"""
    if n <= 0:
        return 0
    return min(255, max(1, n))


# ---------------------------------------------------------------------------
# 資料載入
# ---------------------------------------------------------------------------
def load_units(root):
    """掃 *.units.json。回傳 (units, disk_ids, parse_problems)。

    units：list[dict]，每筆至少含 unit_id（原始物件，保留 prerequisites/est_minutes/
           knowledge_point_ids 等欄位，供各檢查自行驗型別）。
    disk_ids：set[str]，磁碟上所有合法 str unit_id。
    parse_problems：list[str]，JSON/結構層級的 fail-closed 問題。
    """
    units = []
    disk_ids = set()
    problems = []
    files = sorted(glob.glob(os.path.join(root, "*.units.json")))
    if not files:
        problems.append(f"[discovery] 在 {root} 找不到任何 *.units.json（空 glob＝fail-closed）")
    for f in files:
        base = os.path.basename(f)
        try:
            with open(f, encoding="utf-8") as fh:
                data = json.load(fh)
        except (OSError, json.JSONDecodeError) as e:
            problems.append(f"[parse] {base}: 無法解析 JSON（{e}）")
            continue
        arr = data.get("units")
        if not isinstance(arr, list):
            problems.append(f"[structure] {base}: 頂層缺 'units' 陣列")
            continue
        for i, u in enumerate(arr):
            if not isinstance(u, dict):
                problems.append(f"[structure] {base}[units#{i}]: 單元非物件")
                continue
            uid = u.get("unit_id")
            u["_loc"] = f"{base}[{uid if isinstance(uid, str) else '#' + str(i)}]"
            if isinstance(uid, str):
                disk_ids.add(uid)
            units.append(u)
    return units, disk_ids, problems


def load_index_ids(root):
    """authoring/units_index.json 的 unit_id 集合（供 prereq 解析的額外來源）。
    回傳 (ids, problems)。缺檔不視為致命（disk 為權威），但解析失敗 fail-closed 記問題。"""
    ids = set()
    problems = []
    path = os.path.join(root, "authoring", "units_index.json")
    if not os.path.isfile(path):
        return ids, problems
    try:
        with open(path, encoding="utf-8") as fh:
            idx = json.load(fh)
    except (OSError, json.JSONDecodeError) as e:
        problems.append(f"[units_index] 無法解析 authoring/units_index.json（{e}；fail-closed）")
        return ids, problems
    for u in idx.get("units", []) if isinstance(idx.get("units"), list) else []:
        if isinstance(u, dict) and isinstance(u.get("unit_id"), str):
            ids.add(u["unit_id"])
    return ids, problems


def load_kp_ids(root):
    """authoring/knowledge_points.json 的知識點 id 集合。回傳 (ids_or_None, problems)。
    None＝無法解析（caller 視為 fail-closed，但僅在有單元宣告 KP 時才記違規）。"""
    problems = []
    path = os.path.join(root, "authoring", "knowledge_points.json")
    if not os.path.isfile(path):
        return None, problems
    try:
        with open(path, encoding="utf-8") as fh:
            kpm = json.load(fh)
    except (OSError, json.JSONDecodeError) as e:
        problems.append(f"[kp-ref] 無法解析 authoring/knowledge_points.json（{e}；fail-closed）")
        return None, problems
    items = kpm.get("knowledge_points") or kpm.get("items") or (kpm if isinstance(kpm, list) else [])
    ids = {x.get("id") for x in items if isinstance(x, dict) and isinstance(x.get("id"), str)}
    return ids, problems


# ---------------------------------------------------------------------------
# 核心檢查（純函式，吃 in-memory 單元清單 → 供 fixtures 與真實 repo 共用）
# ---------------------------------------------------------------------------
def find_cycle(graph):
    """graph: id -> [後繼 id]（此處邊＝unit→其 prerequisite）。回傳一條環或 None。DFS 白灰黑。"""
    WHITE, GRAY, BLACK = 0, 1, 2
    color = {k: WHITE for k in graph}
    stack = []

    def dfs(u):
        color[u] = GRAY
        stack.append(u)
        for v in graph.get(u, []):
            if v not in color:  # 邊指向非圖內節點（懸空／僅在 index）→ 不成環，交 P2 報
                continue
            if color[v] == GRAY:
                return stack[stack.index(v):] + [v]
            if color[v] == WHITE:
                c = dfs(v)
                if c:
                    return c
        color[u] = BLACK
        stack.pop()
        return None

    for k in list(graph):
        if color[k] == WHITE:
            c = dfs(k)
            if c:
                return c
    return None


def check_path(units, known_ids, kp_ids):
    """AC-PATH-1 的 INV-1 確定性子基盤。回傳 violations:list[str]。
    known_ids：所有可解析的單元 id（disk ∪ index）；kp_ids：知識點 id 集合或 None。"""
    violations = []
    graph = {}            # disk 單元先備圖（僅納入 disk 單元作節點）
    disk_unit_ids = {u.get("unit_id") for u in units if isinstance(u.get("unit_id"), str)}
    declares_kp = False

    for u in units:
        loc = u.get("_loc", "<unknown>")
        uid = u.get("unit_id")

        # (P1) prerequisites 欄位存在且為 list
        pre = u.get("prerequisites")
        if not isinstance(pre, list):
            violations.append(
                f"[prereq-type] {loc}: prerequisites 缺或型別錯（應為 list，實為 "
                f"{type(pre).__name__}）——§6.2.2 細則1 fail-closed"
            )
            pre = []

        node_edges = []
        for p in pre:
            if not isinstance(p, str):
                violations.append(f"[prereq-type] {loc}: prerequisites 元素非字串（{p!r}）")
                continue
            # (P3) 自環
            if p == uid:
                violations.append(f"[prereq-self] {loc}: 以自己為先備（自環）")
                continue
            # (P2) 懸空參照
            if p not in known_ids:
                violations.append(
                    f"[prereq-dangling] {loc}: 先備單元 '{p}' 不存在（disk *.units.json ∪ "
                    f"units_index 皆無）——INV-1 斷層"
                )
                continue
            node_edges.append(p)
        if isinstance(uid, str):
            graph[uid] = [p for p in node_edges if p in disk_unit_ids]

        # (P5) knowledge_point_ids 解析
        kids = u.get("knowledge_point_ids")
        if isinstance(kids, list):
            for kid in kids:
                if isinstance(kid, str):
                    declares_kp = True
                    if kp_ids is not None and kid not in kp_ids:
                        violations.append(
                            f"[kp-ref] {loc}: knowledge_point_id '{kid}' 在 "
                            f"knowledge_points.json 無對應——K(U) 無法定義、INV-1 斷層"
                        )

    if declares_kp and kp_ids is None:
        violations.append(
            "[kp-ref] 有單元宣告 knowledge_point_ids 但 authoring/knowledge_points.json "
            "缺失／無法解析（fail-closed）"
        )

    # (P4) 無環
    cyc = find_cycle(graph)
    if cyc:
        violations.append("[prereq-cycle] 先備 DAG 偵測到環：" + " → ".join(cyc))

    return violations


def check_inv4(units):
    """AC-PATH-2 的 INV-4 est_minutes≤12 確定性條款。回傳 violations:list[str]。"""
    violations = []
    for u in units:
        loc = u.get("_loc", "<unknown>")
        em = u.get("est_minutes")
        if em is None or "est_minutes" not in u:
            violations.append(f"[inv4-missing] {loc}: 缺 est_minutes（fail-closed，不得當 ≤12 放行）")
            continue
        if isinstance(em, bool) or not isinstance(em, numbers.Number):
            violations.append(
                f"[inv4-type] {loc}: est_minutes 非數值（實為 {type(em).__name__}）——fail-closed"
            )
            continue
        if em > EST_MINUTES_MAX:
            violations.append(
                f"[inv4-overload] {loc}: est_minutes={em} > {EST_MINUTES_MAX}"
                f"（§6.6 INV-4 過載，須拆單元）"
            )
    return violations


# ---------------------------------------------------------------------------
# selftest fixtures
# ---------------------------------------------------------------------------
def _U(uid, prereqs=None, kps=None, est=8):
    return {
        "unit_id": uid,
        "prerequisites": [] if prereqs is None else prereqs,
        "knowledge_point_ids": [] if kps is None else kps,
        "est_minutes": est,
        "_loc": f"fixture[{uid}]",
    }


def _selftest_path():
    """AC-PATH-1 fixtures：好例 ALLOW；環/懸空/自環/缺型別/懸空KP DENY。"""
    kp_ids = {"kp.a", "kp.b"}
    results = []

    good = [
        _U("x.t_base.s.a", kps=["kp.a"]),
        _U("x.t_base.s.b", prereqs=["x.t_base.s.a"], kps=["kp.b"]),
        _U("x.t_base.s.c", prereqs=["x.t_base.s.a", "x.t_base.s.b"]),
    ]
    known = {u["unit_id"] for u in good}
    results.append(("好例（合法前向先備＋KP 解析）→ ALLOW", check_path(good, known, kp_ids) == []))

    cyc = [
        _U("x.t_base.s.a", prereqs=["x.t_base.s.b"]),
        _U("x.t_base.s.b", prereqs=["x.t_base.s.a"]),
    ]
    kc = {u["unit_id"] for u in cyc}
    results.append(("環（a↔b）→ DENY",
                    any("prereq-cycle" in v for v in check_path(cyc, kc, kp_ids))))

    dangling = [_U("x.t_base.s.a", prereqs=["x.t_base.s.ghost"])]
    results.append(("懸空先備 → DENY",
                    any("prereq-dangling" in v for v in check_path(dangling, {"x.t_base.s.a"}, kp_ids))))

    selfdep = [_U("x.t_base.s.a", prereqs=["x.t_base.s.a"])]
    results.append(("自環 → DENY",
                    any("prereq-self" in v for v in check_path(selfdep, {"x.t_base.s.a"}, kp_ids))))

    badtype = [{"unit_id": "x.t_base.s.a", "prerequisites": "nope",
                "knowledge_point_ids": [], "est_minutes": 8, "_loc": "fixture[badtype]"}]
    results.append(("prerequisites 型別錯 → DENY",
                    any("prereq-type" in v for v in check_path(badtype, {"x.t_base.s.a"}, kp_ids))))

    dangkp = [_U("x.t_base.s.a", kps=["kp.ghost"])]
    results.append(("懸空 knowledge_point → DENY",
                    any("kp-ref" in v for v in check_path(dangkp, {"x.t_base.s.a"}, kp_ids))))

    return results


def _selftest_inv4():
    """AC-PATH-2 fixtures：est≤12 ALLOW；est=20／缺／非數值 DENY。"""
    results = []
    good = [_U("x.t_base.s.a", est=8), _U("x.t_base.s.b", est=12)]
    results.append(("est_minutes 皆 ≤12 → ALLOW", check_inv4(good) == []))

    over = [_U("x.t_base.s.a", est=20)]
    results.append(("est_minutes=20 → DENY",
                    any("inv4-overload" in v for v in check_inv4(over))))

    missing = [{"unit_id": "x.t_base.s.a", "prerequisites": [],
                "knowledge_point_ids": [], "_loc": "fixture[miss]"}]
    results.append(("缺 est_minutes → DENY",
                    any("inv4-missing" in v for v in check_inv4(missing))))

    booltype = [_U("x.t_base.s.a", est=True)]
    results.append(("est_minutes 為 bool → DENY",
                    any("inv4-type" in v for v in check_inv4(booltype))))

    return results


def _run_selftest(results, label):
    print(f"=== path_sim_gate {label} ===")
    allok = True
    for msg, ok in results:
        print(f"  [{'OK' if ok else 'BAD'}] {msg}")
        allok = allok and ok
    print("RESULT:", "PASS ✅" if allok else "FAIL ❌")
    return allok


# ---------------------------------------------------------------------------
# verify（真實 repo）
# ---------------------------------------------------------------------------
def verify(root, inv4_only):
    units, disk_ids, problems = load_units(root)
    idx_ids, idx_problems = load_index_ids(root)
    problems += idx_problems
    known_ids = disk_ids | idx_ids

    violations = list(problems)
    if inv4_only:
        violations += check_inv4(units)
        tag = "AC-PATH-2 / INV-4 (est_minutes≤12)"
    else:
        kp_ids, kp_problems = load_kp_ids(root)
        violations += kp_problems
        violations += check_path(units, known_ids, kp_ids)
        tag = "AC-PATH-1 / INV-1 (先備 DAG 無斷層)"

    print(f"[path_sim_gate] {tag}  root={os.path.abspath(root)}  "
          f"units={len(units)}  disk_ids={len(disk_ids)}  known_ids={len(known_ids)}",
          file=sys.stderr)
    for v in violations:
        print("  - " + v, file=sys.stderr)
    if violations:
        print(f"RESULT: FAIL ❌（{len(violations)} violation）", file=sys.stderr)
    else:
        print("RESULT: PASS ✅（0 violation）", file=sys.stderr)
    return _clamp(len(violations))


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="AC-PATH-1／AC-PATH-2 學習路徑確定性靜態 gate（fail-closed）",
        add_help=True,
    )
    ap.add_argument("--verify", action="store_true", help="AC-PATH-1 證據驗證（真實 repo）")
    ap.add_argument("--verify-inv4", action="store_true", help="AC-PATH-2 INV-4 est_minutes 驗證")
    ap.add_argument("--selftest", action="store_true", help="好例/壞例 fixtures（path＋inv4）")
    ap.add_argument("--selftest-inv4", action="store_true", help="INV-4 est_minutes fixtures")
    ap.add_argument("--root", default=ROOT, help="掃描根目錄（預設 repo root）")
    ap.add_argument("--release-id", default=None, help="相容 orchestrator（靜態 gate，忽略）")
    # 容忍其他未知旗標（orchestrator 可能夾帶）
    args, _unknown = ap.parse_known_args(argv)

    try:
        if args.selftest:
            ok = _run_selftest(_selftest_path(), "--selftest [AC-PATH-1]")
            ok2 = _run_selftest(_selftest_inv4(), "--selftest [AC-PATH-2/INV-4]")
            return 0 if (ok and ok2) else 2
        if args.selftest_inv4:
            ok = _run_selftest(_selftest_inv4(), "--selftest-inv4 [AC-PATH-2/INV-4]")
            return 0 if ok else 2
        if args.verify_inv4:
            return verify(args.root, inv4_only=True)
        if args.verify:
            return verify(args.root, inv4_only=False)
    except Exception as e:  # fail-closed：任何未預期例外都不靜默放行
        print(f"[path_sim_gate] 未預期例外（fail-closed）：{e}", file=sys.stderr)
        return 1

    ap.print_usage(sys.stderr)
    print("須指定 --verify / --verify-inv4 / --selftest / --selftest-inv4", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
