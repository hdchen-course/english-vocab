#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""auto_wire_prerequisites.py — 確定性自動接線：為尚未宣告 prerequisites 的英語島單元
補上「同 strand、鄰近下一級別 anchor」的先備邊，比照既有 175 單元的慣例
（t_mid.X → t_base.X、t_adv.X → t_mid.X、t_sub.X → t_adv.X；單一 anchor；186/187 同 strand）。

規則（prerequisites＝「建議不是門鎖」spec §5.3，故確定性啟發可接受、可後修）：
  tier rank: t_base<t_mid<t_adv<t_sub。
  對每個「prerequisites 為空」的單元 U(strand S, tier T)：
    - 找同 strand 中 rank 嚴格小於 T 的「最接近下級」所有單元；
    - 若無（例如 t_base 根節點，或該 strand 無下級）→ prerequisites 保持 []（根節點，正確）；
    - 否則 anchor＝該層單元中「在本 strand 內被最多既有單元引用為 prereq」者（平手→unit_id 字典序最小），
      設 U.prerequisites = [anchor]。
  已有 prerequisites 的單元一律不動。

因 content_sha 已排除 prerequisites（migrate_content_sha_exclude_wiring 後），本編輯不作廢教學 5-clean。

用法：
  python3 tools/auto_wire_prerequisites.py --dry-run
  python3 tools/auto_wire_prerequisites.py --apply
"""
import sys, os, glob, json, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TIER_RANK = {"t_base": 0, "t_mid": 1, "t_adv": 2, "t_sub": 3}


def tier_of(uid):
    seg = uid.split(".")
    return seg[1] if len(seg) > 1 else ""


def load_units():
    files = {}
    for f in glob.glob(os.path.join(ROOT, "english_*.units.json")):
        try:
            d = json.load(open(f, encoding="utf-8"))
        except Exception:
            continue
        files[f] = d
    return files


def main(argv):
    apply = "--apply" in argv
    files = load_units()
    # 全域：unit_id → (strand, tier), 與既有 prereq 引用計數（本 strand 內）
    strand_of, tier_of_id = {}, {}
    units_by_strand_tier = collections.defaultdict(list)
    prereq_ref_count = collections.defaultdict(collections.Counter)  # strand -> Counter(anchor_id)
    all_units = []
    for f, d in files.items():
        for u in d.get("units", []):
            uid = u.get("unit_id")
            if not isinstance(uid, str):
                continue
            st = u.get("strand")
            ti = tier_of(uid)
            strand_of[uid] = st
            tier_of_id[uid] = ti
            units_by_strand_tier[(st, ti)].append(uid)
            all_units.append((f, u, uid, st, ti))
            for p in (u.get("prerequisites") or []):
                prereq_ref_count[st][p] += 1

    def anchor_for(st, ti):
        r = TIER_RANK.get(ti)
        if r is None:
            return None
        # 找最接近的下級（rank 最大且 < r）有同 strand 單元的那層
        for lower_rank in range(r - 1, -1, -1):
            lower_tier = [t for t, rr in TIER_RANK.items() if rr == lower_rank][0]
            cands = units_by_strand_tier.get((st, lower_tier), [])
            if cands:
                # anchor＝本 strand 內最常被引用為 prereq 者；平手→字典序最小
                cnt = prereq_ref_count.get(st, {})
                return sorted(cands, key=lambda c: (-cnt.get(c, 0), c))[0]
        return None

    # 基礎節點＝已被其他單元宣告為 prerequisite 者（如 core-1200 被 health-illness 依賴、
    # participial-active 被 absolute-with 依賴）。這類是 foundation，不該反過來自動接一條
    # backward 先備邊（會把基礎單元錯接到更淺的字）。護欄：foundation 一律留空（視為根）。
    foundation = set()
    for st, cnt in prereq_ref_count.items():
        foundation.update(cnt.keys())

    proposed = []  # (uid, anchor)
    roots = []     # (uid) 留空的根
    for f, u, uid, st, ti in all_units:
        if (u.get("prerequisites") or []):
            continue  # 已接線，不動
        if uid in foundation:
            roots.append(uid)   # 基礎節點：不自動接線
            continue
        a = anchor_for(st, ti)
        if a and a != uid:
            proposed.append((f, u, uid, a))
        else:
            roots.append(uid)

    # 報告
    print(f"[auto-wire] 未接線單元: {len(proposed)+len(roots)}｜可接 anchor: {len(proposed)}｜根節點留空: {len(roots)}")
    for _, _, uid, a in sorted(proposed, key=lambda x: x[2])[:40]:
        print(f"  {uid}  <-  {a}")
    if len(proposed) > 40:
        print(f"  …（另 {len(proposed)-40} 筆）")

    if apply:
        # 寫回：按檔聚合
        touched_files = set()
        for f, u, uid, a in proposed:
            u["prerequisites"] = [a]
            touched_files.add(f)
        for f in touched_files:
            with open(f, "w", encoding="utf-8") as fh:
                json.dump(files[f], fh, ensure_ascii=False, indent=1)
                fh.write("\n")
        print(f"[auto-wire] APPLIED: 寫入 {len(proposed)} 條先備邊，跨 {len(touched_files)} 檔。根節點 {len(roots)} 個保持 []。")
    else:
        print("[auto-wire] DRY-RUN（未寫檔）。加 --apply 實際寫入。")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
