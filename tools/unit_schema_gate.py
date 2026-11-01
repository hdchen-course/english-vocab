#!/usr/bin/env python3
"""
unit_schema_gate.py — AC-SCHEMA 單元內容資料契約 gate（學習路徑 Phase 1）

依據（normative，LEARNING_PATH_REBUILD_SPEC.md）：
  §6.2.2「單元『內容』資料 schema（權威欄位表）」細則 1–7
  §6.7  units_index.json 衍生（`unit_id` 跨全部 *.units.json 全域唯一）
  §11.A AC-SCHEMA 條目
  §4 / §6.2 GR「段位抽取」＋ tools/_kp_build.py ID_RE（id 為 opaque，≥3 段）
  §4 R2-05：id 第 2 段為 opaque 命名痕跡、非權威；tier 一律讀 manifest，
            嚴禁由 id 前綴推斷 tier。故本 gate 的「格式」只驗 ID_RE（唯一性＋段數＋字元集），
            不驗第 2 段是否 ∈ VALID_TIERS。

fail-closed 斷言（§6.2.2 / §11.A AC-SCHEMA，本 gate 聚焦 team-lead 指派的 4 項）：
  1. 必備欄位齊備＋型別正確（§6.2.2 細則 1–7；缺欄／型別錯＝violation）。
  2. unit_id 跨所有 *.units.json 全域唯一（§6.3 細則2／§6.7；撞號＝violation）。
  3. unit_id 格式符合 canonical ID_RE（opaque、≥3 段、字元集 [a-z0-9_-]，domain 段 [a-z0-9-]）。
  4. authoring/units_index.json 的 unit_id 集合與磁碟 *.units.json 的 unit_id 集合一致
     （缺漏／多餘皆＝violation；兌現 §6.7 衍生正確）。
  5. 每個單元 knowledge_point_ids[] 的每個 id 皆解析到 authoring/knowledge_points.json 的
     知識點（§6.2 R-GRAIN「知識點≠單元、一單元可掛數個知識點」；懸空參照＝violation）。
     fail-closed：若有單元宣告 KP 參照但 manifest 缺失／無法解析＝violation。

exit code ＝ violation 總數（0＝clean）。人類可讀 log 走 stderr；--json 時 stdout 印純 JSON。
additive 工具，不改任何既有頁/資料/引擎。

用法：
  python tools/unit_schema_gate.py                 # 掃當前 repo root
  python tools/unit_schema_gate.py --root /tmp/xx   # 紅隊：掃暫存副本（不污染正式檔）
  python tools/unit_schema_gate.py --json           # 純 JSON 報告（供 orchestrator）
"""
import argparse
import glob
import json
import numbers
import os
import re
import sys

# canonical id 格式（與 tools/_kp_build.py ID_RE 一致）：domain 段 [a-z0-9-]，
# 其後 ≥2 段 [a-z0-9_-]（含底線——tier 段如 t_base/t_mid 含 _）。id 為 opaque（R2-05）。
ID_RE = re.compile(r"^[a-z0-9-]+(\.[a-z0-9_-]+){2,}$")

# §6.2.2 必備欄位 → (型別檢查, 依據)。
#   str  ：值須為 str
#   list ：值須為 list
#   list[str]：值須為 list 且每元素為 str
#   number：值須為 int/float（排除 bool）
REQUIRED_FIELDS = [
    ("unit_id", "str", "§6.2.2 細則1（§6.3 進度鍵／§6.7 units_index 主 join 鍵）"),
    ("title_zh", "str", "§6.7 units_index 顯示標籤（衍生檔必備）＋team-lead 指派最低清單"),
    ("subject", "str", "§6.2.2 細則1"),
    ("strand", "str", "§6.2.2 細則1"),
    ("knowledge_point_ids", "list[str]", "§6.2.2 細則1（宣告所掛知識點）"),
    ("prerequisites", "list", "§6.2.2 細則1（先備單元）"),
    ("est_minutes", "number", "§6.2.2 細則1／§6.6 est_minutes≤12（INV-4）"),
    ("teach", "list", "§6.2.2 細則2（教學段陣列）"),
    ("practice", "list", "§6.2.2 細則3（練習題陣列）"),
    ("selfeval", "list", "§6.2.2 細則4（固定三級自評）"),
    ("claims", "list", "§6.2.2 細則7（事實宣稱；純技能型可為空陣列）"),
]


def _type_ok(value, spec):
    if spec == "str":
        return isinstance(value, str)
    if spec == "list":
        return isinstance(value, list)
    if spec == "list[str]":
        return isinstance(value, list) and all(isinstance(e, str) for e in value)
    if spec == "number":
        return isinstance(value, numbers.Number) and not isinstance(value, bool)
    raise ValueError(spec)


def run(root):
    """回傳 (violations:list[str], stats:dict)。violations 每條一個字串 finding。"""
    violations = []
    root = os.path.abspath(root)
    unit_files = sorted(glob.glob(os.path.join(root, "*.units.json")))
    index_path = os.path.join(root, "authoring", "units_index.json")

    if not unit_files:
        violations.append(f"[discovery] 在 {root} 找不到任何 *.units.json（空 glob＝fail-closed）")
    if not os.path.isfile(index_path):
        violations.append(f"[units_index] 缺 authoring/units_index.json（{index_path}）")

    disk_ids = []          # [(unit_id, file_basename, unit_index)]
    id_to_locations = {}   # unit_id -> [location str]
    kp_refs = []           # [(kid, loc)] 每個單元宣告的 knowledge_point 參照

    # ---- 斷言 1 + 3：逐檔逐單元驗必備欄位/型別 + id 格式 ----
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
            loc = f"{base}[units#{i}]"
            if not isinstance(u, dict):
                violations.append(f"[structure] {loc}: 單元非物件")
                continue
            uid = u.get("unit_id")
            loc = f"{base}[{uid if isinstance(uid, str) else '#'+str(i)}]"

            # 1. 必備欄位齊備＋型別
            for field, spec, basis in REQUIRED_FIELDS:
                if field not in u:
                    violations.append(f"[field-missing] {loc}: 缺必備欄位 '{field}'（{basis}）")
                elif not _type_ok(u[field], spec):
                    violations.append(
                        f"[field-type] {loc}: '{field}' 型別應為 {spec}，"
                        f"實為 {type(u[field]).__name__}（{basis}）"
                    )

            # 3. id 格式（opaque ID_RE；不推斷 tier，R2-05）
            if isinstance(uid, str):
                if not ID_RE.match(uid):
                    violations.append(
                        f"[id-format] {loc}: unit_id '{uid}' 不符 canonical ID_RE "
                        f"{ID_RE.pattern}（§4／_kp_build ID_RE；opaque、≥3 段）"
                    )
                disk_ids.append(uid)
                id_to_locations.setdefault(uid, []).append(loc)
            # uid 非 str 已由 field-type 記錄

            # 收集 KP 參照（供斷言 5）；非 str 元素已由 field-type list[str] 記錄
            kpids = u.get("knowledge_point_ids")
            if isinstance(kpids, list):
                for kid in kpids:
                    if isinstance(kid, str):
                        kp_refs.append((kid, loc))

    # ---- 斷言 2：unit_id 跨所有 *.units.json 全域唯一 ----
    for uid, locs in sorted(id_to_locations.items()):
        if len(locs) > 1:
            violations.append(
                f"[id-duplicate] unit_id '{uid}' 跨檔撞號（出現於：{', '.join(locs)}）"
                f"——§6.3/§6.7 要求全域唯一"
            )

    # ---- 斷言 4：units_index 與磁碟 unit_id 集合一致 ----
    if os.path.isfile(index_path):
        try:
            with open(index_path, encoding="utf-8") as fh:
                idx = json.load(fh)
            idx_units = idx.get("units")
            if not isinstance(idx_units, list):
                violations.append("[units_index] authoring/units_index.json 缺 'units' 陣列")
            else:
                idx_ids = set()
                for j, u in enumerate(idx_units):
                    if isinstance(u, dict) and isinstance(u.get("unit_id"), str):
                        idx_ids.add(u["unit_id"])
                    else:
                        violations.append(f"[units_index] units#{j} 缺合法 unit_id")
                disk_set = set(disk_ids)
                for missing in sorted(disk_set - idx_ids):
                    violations.append(
                        f"[units_index] 磁碟有但 units_index 缺：'{missing}'（§6.7 衍生漏彙總）"
                    )
                for extra in sorted(idx_ids - disk_set):
                    violations.append(
                        f"[units_index] units_index 有但磁碟 *.units.json 無：'{extra}'（過時/多餘條目）"
                    )
        except (OSError, json.JSONDecodeError) as e:
            violations.append(f"[units_index] 無法解析 authoring/units_index.json（{e}）")

    # ---- 斷言 5：knowledge_point_ids 參照完整性（§6.2 R-GRAIN）----
    kp_valid = 0
    if kp_refs:
        kp_path = os.path.join(root, "authoring", "knowledge_points.json")
        kp_ids = None
        if not os.path.isfile(kp_path):
            violations.append(
                f"[kp-ref] 有單元宣告 knowledge_point_ids 但缺 authoring/knowledge_points.json"
                f"（{kp_path}；fail-closed）"
            )
        else:
            try:
                with open(kp_path, encoding="utf-8") as fh:
                    kpm = json.load(fh)
                items = kpm.get("knowledge_points") or kpm.get("items") or (kpm if isinstance(kpm, list) else [])
                kp_ids = set(x.get("id") for x in items if isinstance(x, dict) and isinstance(x.get("id"), str))
                kp_valid = len(kp_ids)
            except (OSError, json.JSONDecodeError) as e:
                violations.append(f"[kp-ref] 無法解析 authoring/knowledge_points.json（{e}；fail-closed）")
        if kp_ids:
            for kid, loc in kp_refs:
                if kid not in kp_ids:
                    violations.append(
                        f"[kp-ref] {loc}: knowledge_point_id '{kid}' 在 knowledge_points.json 無對應"
                        f"（§6.2 R-GRAIN 懸空參照）"
                    )

    stats = {
        "root": root,
        "unit_files": len(unit_files),
        "units_on_disk": len(disk_ids),
        "unique_unit_ids": len(set(disk_ids)),
        "kp_refs": len(kp_refs),
        "kp_manifest_size": kp_valid,
        "violations": len(violations),
    }
    return violations, stats


def main(argv=None):
    ap = argparse.ArgumentParser(description="AC-SCHEMA 單元內容資料契約 gate")
    ap.add_argument("--root", default=".", help="掃描根目錄（紅隊可指向暫存副本）")
    ap.add_argument("--json", action="store_true", help="stdout 印純 JSON 報告")
    args = ap.parse_args(argv)

    violations, stats = run(args.root)

    if args.json:
        print(json.dumps({"stats": stats, "violations": violations}, ensure_ascii=False, indent=2))
    else:
        print(
            f"[unit_schema_gate] root={stats['root']} files={stats['unit_files']} "
            f"units={stats['units_on_disk']} unique={stats['unique_unit_ids']}",
            file=sys.stderr,
        )
        if violations:
            print(f"[unit_schema_gate] {len(violations)} violation(s):", file=sys.stderr)
            for v in violations:
                print("  - " + v, file=sys.stderr)
        else:
            print("[unit_schema_gate] CLEAN（0 violation）", file=sys.stderr)

    return len(violations)


if __name__ == "__main__":
    sys.exit(main())
