#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""reward_catalog_gate.py — §7.2/§7.4 reward_catalog.json 的 fail-closed 結構 gate（AC-REWARD-1 的一環）。

機器強制（不需人簽、本 gate 直接驗）：
  (1) items[] 每筆 id 兩兩相異，且不重用任何已 retired 的 id（撞號/重用＝FAIL；id 是 never-disappear 解析鍵）。
  (2) items[].type → types[] 參照完整：每個 item.type 必須解析到 types[] 既有條目（live 或 tombstone），懸空＝FAIL。
  (3) types[] sha-bound 三簽驗證：每型別 reward_type_sha 必須＝sha256(canonical({type,equippable}))[:16]；
      型別「生效」需 signoff 帶 art+spatial+pm 且 signoff.sha 相符且 status=="signed"。**未簽/pending/sha 不符＝該型別無效**，
      凡 items[] 引用無效型別＝FAIL（fail-closed；杜絕「新型別無簽無紅隊照 ship」）。
  (4) baseline 集合相等＋no-shrink：`items[]∪tombstone` 的 id 集合 MUST ＝ reward_id_baseline.json 的 ids
      （coverage：baseline⊆items∪tombstone；entry：items∪tombstone⊆baseline）；曾入 baseline 的 id 整筆消失而無 retired tombstone＝FAIL。

介面：--selftest（離線紅隊好例 ALLOW／各壞例 DENY）；--verify（對真檔跑）。
EXIT：0=過；1=有違規；2=selftest 失敗。
"""
import argparse, hashlib, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAT = os.path.join(ROOT, "authoring", "reward_catalog.json")
BASE = os.path.join(ROOT, "authoring", "reward_id_baseline.json")
REQUIRED_SIGNOFF = {"art", "spatial", "pm"}


def _canon(o):
    return json.dumps(o, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def type_sha(t, eq):
    return hashlib.sha256(_canon({"type": t, "equippable": eq}).encode("utf-8")).hexdigest()[:16]


def check(catalog, baseline):
    """回傳違規字串 list（空＝過）。純函式，供 selftest 與 verify 共用。"""
    probs = []
    items = catalog.get("items", [])
    types = catalog.get("types", [])

    # (3) 先判定每個 type 是否「有效」
    type_by_name = {}
    valid_types = set()
    live_or_tomb_types = set()
    for t in types:
        name = t.get("type")
        if name is None:
            probs.append("types[] 有缺 type 欄的條目"); continue
        type_by_name[name] = t
        live_or_tomb_types.add(name)
        eq = bool(t.get("equippable", False))
        want = type_sha(name, eq)
        if t.get("reward_type_sha") != want:
            probs.append(f"type `{name}` reward_type_sha 不符（應 {want}）")
        so = t.get("signoff") or {}
        by = set(so.get("by") or [])
        ok_sign = (REQUIRED_SIGNOFF <= by) and so.get("sha") == want and so.get("status") == "signed"
        if ok_sign:
            valid_types.add(name)

    # (1) id 唯一 + 不重用 retired
    seen = {}
    retired_ids = set()
    item_ids = []
    for it in items:
        iid = it.get("id")
        if iid is None:
            probs.append("items[] 有缺 id 欄的條目"); continue
        item_ids.append(iid)
        if it.get("retired"):
            retired_ids.add(iid)
        if iid in seen:
            probs.append(f"items[] id 重複：`{iid}`")
        seen[iid] = it
    # (1b) 不重用已 retired id：live（非 retired）筆不得用到某個也被標 retired 的 id —— 同 id 同時 live+retired
    # （本結構為單筆，重用偵測＝同 id 出現在多筆；上面的重複檢查已涵蓋；此處另防 live 筆 id ∈ retired 的跨筆情形）
    for it in items:
        if not it.get("retired") and it.get("id") in retired_ids and sum(1 for x in items if x.get("id") == it.get("id")) > 1:
            probs.append(f"items[] 重用已 retired 的 id：`{it.get('id')}`")

    # (2) items.type → types[] 參照完整；(3) 引用無效型別＝FAIL
    for it in items:
        ty = it.get("type")
        if ty not in live_or_tomb_types:
            probs.append(f"items[] `{it.get('id')}` 的 type `{ty}` 在 types[] 找不到（懸空）")
        elif ty not in valid_types:
            probs.append(f"items[] `{it.get('id')}` 引用未生效型別 `{ty}`（三簽未完成/sha 不符）")

    # (4) baseline 集合相等
    base_ids = set(baseline.get("ids", []))
    cur_ids = set(item_ids)  # items∪tombstone（tombstone 仍在 items[] 內，retired:true）
    missing = base_ids - cur_ids
    extra = cur_ids - base_ids
    for m in sorted(missing):
        probs.append(f"baseline id `{m}` 自 items[] 消失且無 tombstone（no-shrink/coverage FAIL）")
    for e in sorted(extra):
        probs.append(f"items[] id `{e}` 未入 baseline（entry FAIL：ship-but-never-baselined）")
    return probs


# ---------- selftest ----------
def _good():
    def signed(t, eq):
        return {"type": t, "equippable": eq, "reward_type_sha": type_sha(t, eq),
                "signoff": {"by": ["art", "spatial", "pm"], "status": "signed", "sha": type_sha(t, eq)}}
    cat = {"items": [{"id": "skin-blue", "type": "skin"}, {"id": "b1", "type": "badge"}],
           "types": [signed("skin", True), signed("badge", False)]}
    base = {"ids": ["b1", "skin-blue"]}
    return cat, base


def _selftest():
    results = []
    good, gbase = _good()
    results.append(("好例（全簽、id 唯一、type 完整、baseline 相等）→ ALLOW", check(good, gbase) == []))

    import copy
    # 壞 1：id 重複
    b = copy.deepcopy(good); b["items"].append({"id": "skin-blue", "type": "skin"})
    results.append(("id 重複 → DENY", any("重複" in p for p in check(b, {"ids": ["b1", "skin-blue"]}))))
    # 壞 2：懸空 type
    b = copy.deepcopy(good); b["items"].append({"id": "x1", "type": "ghost"})
    results.append(("懸空 type → DENY", any("懸空" in p for p in check(b, {"ids": ["b1", "skin-blue", "x1"]}))))
    # 壞 3：type 未簽（pending）→ 引用它的 item FAIL
    b = copy.deepcopy(good); b["types"][0]["signoff"] = {"by": [], "status": "pending", "sha": b["types"][0]["reward_type_sha"]}
    results.append(("型別三簽 pending → 引用它的 item DENY", any("未生效型別" in p for p in check(b, gbase))))
    # 壞 4：reward_type_sha 竄改
    b = copy.deepcopy(good); b["types"][0]["reward_type_sha"] = "deadbeef00000000"
    results.append(("reward_type_sha 竄改 → DENY", any("reward_type_sha 不符" in p for p in check(b, gbase))))
    # 壞 5：baseline 少一個（id 消失無 tombstone）
    results.append(("baseline id 消失無 tombstone → DENY", any("no-shrink" in p for p in check(good, {"ids": ["b1", "skin-blue", "border-star"]}))))
    # 壞 6：ship 但未入 baseline
    b = copy.deepcopy(good); b["items"].append({"id": "new-skin", "type": "skin"})
    results.append(("ship-but-never-baselined → DENY", any("未入 baseline" in p for p in check(b, gbase))))
    # 壞 7：只缺一方簽核（如少 pm）
    b = copy.deepcopy(good)
    sha = b["types"][1]["reward_type_sha"]
    b["types"][1]["signoff"] = {"by": ["art", "spatial"], "status": "signed", "sha": sha}
    results.append(("缺 pm 簽核 → 引用它的 item DENY", any("未生效型別" in p for p in check(b, gbase))))

    allok = True
    for msg, ok in results:
        print(f"  [{'OK' if ok else 'BAD'}] {msg}")
        allok = allok and ok
    return allok


def main():
    ap = argparse.ArgumentParser(description="reward_catalog 結構 gate（fail-closed）")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--verify", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        print("=== reward_catalog_gate --selftest ===")
        ok = _selftest(); print("RESULT:", "PASS ✅" if ok else "FAIL ❌"); sys.exit(0 if ok else 2)
    if args.verify:
        catalog = json.loads(open(CAT, encoding="utf-8").read())
        baseline = json.loads(open(BASE, encoding="utf-8").read())
        probs = check(catalog, baseline)
        for p in probs:
            print(f"  [reward] {p}")
        n_items = len(catalog.get("items", []))
        n_pending = sum(1 for t in catalog.get("types", [])
                        if (t.get("signoff") or {}).get("status") != "signed")
        print(f"RESULT: {'PASS ✅' if not probs else 'FAIL ❌'}"
              f"（items {n_items}，types {len(catalog.get('types', []))}，未簽型別 {n_pending}，違規 {len(probs)}）")
        if n_pending and probs:
            print("  （備註：未簽型別＝fail-closed 擋住，待 art+spatial+pm 三簽後才生效——此為正確的誠實 RED，非程式缺陷）")
        sys.exit(0 if not probs else 1)
    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    main()
