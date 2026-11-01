#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""reward_catalog_gate.py — 獎勵 id registry 的 fail-closed gate（§6.7／§7）。

用 workspace venv 跑：
  /Volumes/workplace/EnglishTraining/.venv/bin/python tools/reward_catalog_gate.py

驗 authoring/reward_catalog.json ＋ authoring/reward_id_baseline.json 三組斷言：

(A) items[] id 唯一性：
    每筆 id 兩兩相異、且不重用任何 retired:true 的 id（重複/重用＝FAIL）。
    （id 是 §7.1 byId/isOwned/equipped 的 never-disappear 唯一解析鍵，撞號致歧義。）

(B) frozen-id baseline 三道（retire-not-delete 機器強制）：
    (1) no-shrink／append-only：當前 baseline.ids ⊇ 所有 release snapshot FILE
        （releases/<id>/reward_id_baseline.json）的 id 聯集。
        —— genesis（無 snapshot）時 vacuously pass；release ledger／snapshot 屬部署側 TODO，
           本 gate 於 repo 層只驗「若 snapshot FILE 存在則其 id ⊆ 當前 baseline」，不在 repo 造假。
    (2) coverage：items[]∪tombstone 的 id 集合 ⊇ baseline
        （任一曾入 baseline 的 id 自 items 消失且無 retired:true tombstone＝FAIL）。
    (3) entry/completeness：items[]∪tombstone 的 id 集合 ⊆ baseline
        （任一 id 上架卻未入 baseline＝FAIL）。
    (2)+(3) ⟹ items∪tombstone 的 id 集合 == baseline。

(C) types[]：
    - 每筆帶有效 sha-bound 三簽：signoff.by ⊇ {art,spatial,pm} 且 signoff.sha ==
      現算 reward_type_sha＝sha256(canonical_json({type,equippable}))[:16]（排除 signoff 欄、消自我指涉）。
      不符＝該 type 無效＝FAIL。
    - types[] 內 type 兩兩相異、retired type 之 type 字串不被重用。
    - items[].type 必解析到 types[] 既有條目（live 或 tombstone）；懸空＝FAIL。
    - types[] 同受 no-shrink／coverage／entry（型別維度 baseline，§6.7 B-2）：
      baseline.types 與 types[]∪type-tombstone 的 type 集合相等＋no-shrink。

exit code＝violation 數（0＝clean）。讀 exit 不要 pipe 遮蔽。
canonical_json＝json.dumps(o, sort_keys=True, ensure_ascii=False, separators=(",",":"))。

部署側 TODO（§6.7；repo 層不造假）：
  - release_snapshot_on_ship_gate（部署使 id earnable 前先寫 releases/<id>/reward_id_baseline.json ⊇ live items）
  - deploy-side append-only release ledger（{id, snapshot_content_sha}；存 repo＋git 歷史之外的不可變儲存）
  - reward_baseline_rewrite_gate（git 歷史改寫前 fail-closed：backup-premigrate ref ＋ 改寫後 ⊇ 改寫前）
  本 gate 於此類 snapshot FILE 存在時驗其 id ⊆ 當前 baseline（no-shrink 下限），其餘誠實標為部署側。
  另：反向 equipped<Type>→types 參照完整性、award/grant/equip-provenance 靜態掃描（§6.7／§7.3 RT-14/RT-15）
  需掃 game_core.js，不在本 task 指派範圍，列為後續 gate。
"""
import json
import hashlib
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CATALOG = os.path.join(REPO, "authoring", "reward_catalog.json")
BASELINE = os.path.join(REPO, "authoring", "reward_id_baseline.json")
RELEASES_DIR = os.path.join(REPO, "releases")


def canonical_json(o):
    return json.dumps(o, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def reward_type_sha(t, equippable):
    """§6.7：sha256(canonical_json({type, equippable}))[:16]；排除 signoff 欄、消自我指涉。"""
    return hashlib.sha256(
        canonical_json({"type": t, "equippable": bool(equippable)}).encode("utf-8")
    ).hexdigest()[:16]


def _load(path, problems):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:  # noqa: BLE001
        problems.append(f"讀取/解析失敗 {path}: {e}")
        return None


def check(catalog_path=CATALOG, baseline_path=BASELINE, releases_dir=RELEASES_DIR):
    problems = []
    cat = _load(catalog_path, problems)
    base = _load(baseline_path, problems)
    if cat is None or base is None:
        for p in problems:
            print("FAIL:", p)
        return len(problems) or 1

    items = cat.get("items")
    types = cat.get("types")
    if not isinstance(items, list):
        problems.append("reward_catalog.json 缺 items[]（或非陣列）")
        items = []
    if not isinstance(types, list):
        problems.append("reward_catalog.json 缺 types[]（或非陣列）")
        types = []

    # ---- (A) items[] id 唯一性 ＋ retired id 不重用 ----
    seen = {}
    retired_ids = set()
    live_item_ids = set()
    all_item_ids = set()
    for idx, it in enumerate(items):
        iid = it.get("id")
        if not isinstance(iid, str) or not iid:
            problems.append(f"(A) items[{idx}] 缺合法字串 id")
            continue
        if iid in seen:
            problems.append(f"(A) items[] id 重複：`{iid}`（index {seen[iid]} 與 {idx}）")
        seen[iid] = idx
        all_item_ids.add(iid)
        if it.get("retired") is True:
            retired_ids.add(iid)
        else:
            live_item_ids.add(iid)
    # retired id 不得被再度以 live 身分重用
    for iid in sorted(retired_ids & live_item_ids):
        problems.append(f"(A) retired id 被重用為 live：`{iid}`")

    # ---- (B) frozen-id baseline 三道 ----
    base_ids = set(base.get("ids") or [])
    if not base_ids:
        problems.append("(B) reward_id_baseline.json ids[] 空或缺")
    items_union_tombstone = all_item_ids  # items[]（含 retired tombstone 筆）之 id 集合

    # (B2) coverage：baseline ⊆ items∪tombstone
    missing_from_items = base_ids - items_union_tombstone
    for iid in sorted(missing_from_items):
        problems.append(
            f"(B2 coverage) baseline id `{iid}` 自 items[] 消失且無 retired tombstone＝FAIL"
        )
    # (B3) entry：items∪tombstone ⊆ baseline
    not_in_baseline = items_union_tombstone - base_ids
    for iid in sorted(not_in_baseline):
        problems.append(
            f"(B3 entry) items[] id `{iid}` 上架卻未入 baseline＝FAIL"
        )

    # (B1) no-shrink：baseline ⊇ 所有 release snapshot FILE 的 id 聯集
    snapshot_union = set()
    snapshot_count = 0
    if os.path.isdir(releases_dir):
        for name in sorted(os.listdir(releases_dir)):
            snap = os.path.join(releases_dir, name, "reward_id_baseline.json")
            if os.path.isfile(snap):
                snapshot_count += 1
                snp = {}
                try:
                    with open(snap, "r", encoding="utf-8") as f:
                        snp = json.load(f)
                except Exception as e:  # noqa: BLE001
                    problems.append(f"(B1 no-shrink) release snapshot 解析失敗 {snap}: {e}")
                    continue
                snapshot_union |= set(snp.get("ids") or [])
    shrunk = snapshot_union - base_ids
    for iid in sorted(shrunk):
        problems.append(
            f"(B1 no-shrink) 曾發行 id `{iid}`（release snapshot FILE）自 baseline 消失＝FAIL"
        )
    # genesis（snapshot_count==0）→ snapshot_union 空 → vacuously pass（正確、非漏洞）

    # baseline_sha 損毀偵測（pre-image 檢查；非防竄改）
    want_bsha = hashlib.sha256(
        canonical_json(sorted(base_ids)).encode("utf-8")
    ).hexdigest()[:16]
    if base.get("baseline_sha") != want_bsha:
        problems.append(
            f"(B) baseline_sha 不符現算值（應 {want_bsha}，實 {base.get('baseline_sha')}）"
        )

    # ---- (C) types[] ----
    type_seen = {}
    retired_types = set()
    live_types = set()
    all_types = set()
    valid_type_set = set()  # 通過 sha-bound 三簽的 live/tombstone type（供 items.type 解析）
    for idx, t in enumerate(types):
        tname = t.get("type")
        if not isinstance(tname, str) or not tname:
            problems.append(f"(C) types[{idx}] 缺合法字串 type")
            continue
        if tname in type_seen:
            problems.append(f"(C) types[] type 重複：`{tname}`（index {type_seen[tname]} 與 {idx}）")
        type_seen[tname] = idx
        all_types.add(tname)
        if t.get("retired") is True:
            retired_types.add(tname)
        else:
            live_types.add(tname)
        # sha-bound 三簽
        equippable = t.get("equippable")
        if not isinstance(equippable, bool):
            problems.append(f"(C) type `{tname}` 缺 equippable:bool")
            continue
        so = t.get("signoff") or {}
        by = set(so.get("by") or [])
        want = reward_type_sha(tname, equippable)
        type_ok = True
        if not {"art", "spatial", "pm"} <= by:
            problems.append(
                f"(C) type `{tname}`：signoff.by 缺必備三簽（需 art+spatial+pm，實為 {sorted(by)}）"
            )
            type_ok = False
        if so.get("sha") != want:
            problems.append(
                f"(C) type `{tname}`：signoff.sha 不符現算 reward_type_sha（應 {want}，實 {so.get('sha')}）＝該 type 無效"
            )
            type_ok = False
        if type_ok:
            valid_type_set.add(tname)
    for tname in sorted(retired_types & live_types):
        problems.append(f"(C) retired type 被重用為 live：`{tname}`")

    # items[].type → types[] 參照完整性（須解析到「有效」type，live 或 tombstone）
    for idx, it in enumerate(items):
        iid = it.get("id")
        itype = it.get("type")
        if itype not in all_types:
            problems.append(f"(C) items id `{iid}` 的 type `{itype}` 不存在於 types[]（懸空）")
        elif itype not in valid_type_set:
            problems.append(f"(C) items id `{iid}` 的 type `{itype}` 無有效 sha-bound 三簽（type 無效）")

    # types 維度 baseline（no-shrink/coverage/entry，§6.7 B-2）
    base_types = set(base.get("types") or [])
    if base_types:
        for tname in sorted(base_types - all_types):
            problems.append(f"(C type-baseline coverage) baseline type `{tname}` 自 types[] 消失且無 tombstone＝FAIL")
        for tname in sorted(all_types - base_types):
            problems.append(f"(C type-baseline entry) type `{tname}` 註冊卻未入 type baseline＝FAIL")
        want_tsha = hashlib.sha256(
            canonical_json(sorted(base_types)).encode("utf-8")
        ).hexdigest()[:16]
        if base.get("type_baseline_sha") != want_tsha:
            problems.append(
                f"(C) type_baseline_sha 不符現算值（應 {want_tsha}，實 {base.get('type_baseline_sha')}）"
            )

    for p in problems:
        print("FAIL:", p)
    if not problems:
        print(
            f"OK: items={len(items)}（live {len(live_item_ids)}／tombstone {len(retired_ids)}）"
            f"，types={len(types)}（live {len(live_types)}／tombstone {len(retired_types)}）"
            f"，baseline ids={len(base_ids)}，release snapshot FILE={snapshot_count}"
            f"（genesis＝0→no-shrink vacuously pass）"
        )
    return len(problems)


if __name__ == "__main__":
    sys.exit(check())
