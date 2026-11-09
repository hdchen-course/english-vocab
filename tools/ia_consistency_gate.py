#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ia_consistency_gate.py — 資訊架構(IA)一致性 gate（補既有 gate 的盲點）。

既有 gate 檢查 schema/claim/答案/簡體/a11y/nav不變量/覆蓋數，但**沒有任何一個**檢查
「同一單元是否被多個 learner 可見區域重複呈現」。2026-11-02 HD 抓到：開口說情境單元同時被
上方 spec strand 牆重播。本 gate 把「分軌不重複」變成可量測、fail-closed。

定案模型（HD 2026-11-02）：
  - **core track**＝spec §6.1 strand 軸教材；顯示於上方編號 strand 分區牆（每單元單一 home）。
  - **speaking track**＝開口說（情境會話，舊版 blueprint 移植、spec 外補充）；**只**顯示於
    「練習與應用」的開口說頁，**不得**出現在任何 strand 牆。成員 SSOT＝authoring/speaking_cats.json。
  - units_index 的 `track` 由 gen_derived 依 speaking_cats 成員機械標定；hub `unitsOf` 以
    `track!=='speaking'` 過濾 strand 牆 → 零重複。

斷言：
  (1) 每個 speaking_cats 成員都是真實 eng 單元。
  (2) track 標定正確：成員↔track=="speaking"、非成員 eng↔track=="core"（gen_derived 需先 regen）。
  (3) hub 接線：index_new.html 的 unitsOf 必含 `track!=='speaking'` 過濾（防有人靜默移除→strand 牆又重播）。
介面：--verify / --selftest。EXIT：0=過；1=違規；2=selftest 失敗；99=讀不到資料（fail-closed）。
"""
import argparse, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "authoring")
UNITS = os.path.join(ROOT, "data", "units_index.json")
SPEAK = os.path.join(A, "speaking_cats.json")
HUB = os.path.join(ROOT, "index_new.html")


def analyze(units, speak, hub_src):
    probs, info = [], {}
    eng = [u for u in units if u.get("subject") == "eng"]
    by_page = {u.get("page"): u for u in eng}
    info["eng_total"] = len(eng)
    if not speak:
        info["speaking_defined"] = False
        probs.append("authoring/speaking_cats.json 不存在＝開口說成員未定義（fail-closed）")
        return probs, info
    members = []
    for c in speak.get("cats", []):
        members += c.get("pages", [])
    members = list(dict.fromkeys(members))
    mset = set(members)
    info["speaking_defined"] = True
    info["speaking_members"] = len(members)

    # (1) 成員須為真實 eng 單元
    for p in sorted(mset - set(by_page)):
        probs.append(f"開口說成員非真實 eng 單元：{p}")

    # (2) track 標定正確（需 gen_derived 已 regen）
    missing_track = [u.get("page") for u in eng if "track" not in u]
    if missing_track:
        probs.append(f"units_index {len(missing_track)} 個 eng 單元缺 track 欄（需跑 gen_derived regen）："
                     f"{missing_track[:3]}")
    bad_member = [p for p in members if p in by_page and by_page[p].get("track") != "speaking"]
    for p in sorted(bad_member):
        probs.append(f"開口說成員 track≠speaking：{p}（track={by_page[p].get('track')}）")
    bad_core = [u.get("page") for u in eng if u.get("page") not in mset and u.get("track") == "speaking"]
    for p in sorted(bad_core):
        probs.append(f"非開口說成員卻標 track=speaking：{p}")
    info["speaking_track"] = sum(1 for u in eng if u.get("track") == "speaking")
    info["core_track"] = sum(1 for u in eng if u.get("track") == "core")

    # strand 牆組成（core per strand；僅報告）
    from collections import Counter
    wall = Counter(u.get("strand") for u in eng if u.get("track") == "core")
    info["core_by_strand"] = sorted(wall.items(), key=lambda kv: -kv[1])

    # (3) hub 接線：unitsOf 必須過濾 speaking
    if hub_src is not None:
        m = re.search(r"unitsOf\s*=\s*\(strand\)\s*=>\s*us\.filter\([^)]*\)", hub_src)
        wired = bool(m) and "track!=='speaking'" in m.group(0).replace(" ", "")
        if not wired:
            probs.append("index_new.html unitsOf 未過濾 track=='speaking'（strand 牆會重播開口說教材）")
        info["hub_wired"] = wired
    return probs, info


def _selftest():
    base = [
        {"subject": "eng", "page": "g.html", "strand": "vocab", "track": "speaking"},
        {"subject": "eng", "page": "v.html", "strand": "vocab", "track": "core"},
    ]
    speak = {"cats": [{"pages": ["g.html"]}]}
    good_hub = "const unitsOf=(strand)=>us.filter(u=>u.strand===strand && u.track!=='speaking').slice()"
    bad_hub = "const unitsOf=(strand)=>us.filter(u=>u.strand===strand).slice()"
    res = []
    p, _ = analyze(base, speak, good_hub)
    res.append(("正確分軌＋hub 已接線 → ALLOW", p == []))
    p, _ = analyze(base, speak, bad_hub)
    res.append(("hub 未過濾 speaking → DENY", any("未過濾" in x for x in p)))
    bad = [{"subject": "eng", "page": "g.html", "strand": "vocab", "track": "core"},
           {"subject": "eng", "page": "v.html", "strand": "vocab", "track": "core"}]
    p, _ = analyze(bad, speak, good_hub)
    res.append(("成員 track≠speaking → DENY", any("track≠speaking" in x for x in p)))
    p, _ = analyze(base, {"cats": [{"pages": ["zzz.html"]}]}, good_hub)
    res.append(("成員非真實單元 → DENY", any("非真實" in x for x in p)))
    ok = True
    for m, r in res:
        print(f"  [{'OK' if r else 'BAD'}] {m}"); ok = ok and r
    return ok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        print("=== ia_consistency_gate --selftest ===")
        ok = _selftest(); print("RESULT:", "PASS ✅" if ok else "FAIL ❌"); sys.exit(0 if ok else 2)
    if args.verify:
        try:
            units = json.loads(open(UNITS, encoding="utf-8").read()).get("units", [])
            speak = json.loads(open(SPEAK, encoding="utf-8").read()) if os.path.exists(SPEAK) else None
            hub_src = open(HUB, encoding="utf-8").read() if os.path.exists(HUB) else None
        except Exception as e:
            print(f"  [ia] 讀不到資料（fail-closed）：{e}"); sys.exit(99)
        probs, info = analyze(units, speak, hub_src)
        print("=== ia_consistency_gate --verify（英語島 IA 分軌一致性）===")
        print(f"  eng 單元：{info.get('eng_total')}；開口說成員：{info.get('speaking_members')}")
        print(f"  track：speaking={info.get('speaking_track')}（開口說頁）／core={info.get('core_track')}（strand 牆）")
        print(f"  hub unitsOf 已過濾 speaking：{info.get('hub_wired')}")
        print(f"  strand 牆(core)組成：{info.get('core_by_strand')}")
        for p in probs:
            print(f"  [ia] {p}")
        print(f"RESULT(IA): {'PASS ✅' if not probs else 'FAIL ❌'}（違規 {len(probs)}）")
        sys.exit(0 if not probs else 1)
    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    main()
