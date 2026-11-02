#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ia_consistency_gate.py — 資訊架構(IA)一致性 gate（補上既有 33 個 gate 的盲點）。

既有 gate 檢查 schema/claim/答案/簡體/a11y/nav不變量/覆蓋數，但**沒有任何一個**檢查
「同一個單元是否被多個 learner 可見區域重複呈現」——這正是 2026-11-02 HD 抓到的缺陷
（開口說情境 ＋ 文法 strand 牆 同時列同一批單元）。本 gate 把它變成可量測、fail-closed。

spec 依據（LEARNING_PATH_REBUILD_SPEC.md §6.1/§6.2）：
  nav 僅一條正規軸＝島→subject→strand→strand×tier 頁→unit；**每個單元只有一個 home 頁**
  （「某知識點的 home 頁可機械推導」）。spec 未定義「開口說/情境」軸——它來自已刪除、
  非 normative 的 english_island_blueprint.md。故任何單元同時出現在「strand 牆」與
  「開口說情境」即為 IA 重複（違反單一 home 模型）。

斷言（對英語島）：
  (1) 開口說成員（authoring/speaking_cats.json）若存在，其每個 page 必須是真實 eng 單元。
  (2) 重複呈現：開口說成員 ∩（有文法 strand 的單元）＝被雙重呈現的單元；數量須為 0
      （除非 speaking_cats.json 明示 `allow_cross_cut:true`，代表 HD 已接受情境為 cross-cut 軸）。
  (3) 開口說頁不得有「其他/catch-all」把非成員 eng 單元倒進來：報告 eng 單元中「不在開口說成員」
      的數量（供人眼確認那些是純文法單元、不該出現在開口說）。

介面：--verify / --selftest。EXIT：0=過；1=違規；2=selftest 失敗；99=讀不到資料（fail-closed）。
本 gate 為「資料層」IA 檢查；render 層（實站是否真的雙列）另由 nav render 驗證。
"""
import argparse, json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(ROOT, "authoring")
UNITS = os.path.join(A, "units_index.json")
SPEAK = os.path.join(A, "speaking_cats.json")


def load():
    units = json.loads(open(UNITS, encoding="utf-8").read()).get("units", [])
    speak = None
    if os.path.exists(SPEAK):
        speak = json.loads(open(SPEAK, encoding="utf-8").read())
    return units, speak


def analyze(units, speak):
    probs, info = [], {}
    eng = [u for u in units if u.get("subject") == "eng"]
    by_page = {u.get("page"): u for u in eng}
    info["eng_total"] = len(eng)
    if not speak:
        info["speaking_defined"] = False
        return probs, info  # 無開口說定義＝無法判雙列；留給人眼/其他
    allow_cross = bool(speak.get("allow_cross_cut"))
    members = []
    for c in speak.get("cats", []):
        members += c.get("pages", [])
    members = list(dict.fromkeys(members))  # 去重保序
    info["speaking_defined"] = True
    info["speaking_members"] = len(members)
    info["allow_cross_cut"] = allow_cross

    # (1) 成員須為真實 eng 單元
    ghost = [p for p in members if p not in by_page]
    for p in sorted(ghost):
        probs.append(f"開口說成員非真實 eng 單元：{p}")

    # (2) 雙重呈現：開口說成員同時掛了文法 strand（＝會出現在該 strand 牆）
    dual = [p for p in members if p in by_page and by_page[p].get("strand")]
    info["dual_presented"] = len(dual)
    info["dual_examples"] = [(p, by_page[p].get("strand"), by_page[p].get("title_zh")) for p in dual[:10]]
    if dual and not allow_cross:
        probs.append(
            f"IA 重複：{len(dual)} 個單元同時出現在『開口說情境』與其文法 strand 牆"
            f"（違反 spec §6.1 單一 home；若情境確定為 cross-cut 軸，須在 speaking_cats.json "
            f"設 allow_cross_cut:true 並於 spec 正式定義）")

    # (3) 開口說頁的 catch-all 洩漏：非成員 eng 單元數（這些不該出現在開口說）
    non_members = [u for u in eng if u.get("page") not in set(members)]
    info["non_member_eng"] = len(non_members)
    info["non_member_examples"] = [(u.get("page"), u.get("title_zh")) for u in non_members[:10]]
    return probs, info


def _selftest():
    units = [
        {"subject": "eng", "page": "a.html", "strand": "vocab", "title_zh": "A"},
        {"subject": "eng", "page": "b.html", "strand": "verb", "title_zh": "B"},
        {"subject": "eng", "page": "g.html", "strand": "subj", "title_zh": "G"},
    ]
    res = []
    # 好例：開口說成員都沒掛文法 strand → 這裡 a/b 掛了 → 應 DENY
    speak = {"cats": [{"pages": ["a.html", "b.html"]}]}
    p, _ = analyze(units, speak)
    res.append(("成員同時掛 strand（雙列）→ DENY", any("IA 重複" in x for x in p)))
    # allow_cross_cut 放行
    speak2 = {"allow_cross_cut": True, "cats": [{"pages": ["a.html", "b.html"]}]}
    p2, _ = analyze(units, speak2)
    res.append(("allow_cross_cut:true → ALLOW", not any("IA 重複" in x for x in p2)))
    # 幽靈成員
    speak3 = {"cats": [{"pages": ["zzz.html"]}]}
    p3, _ = analyze(units, speak3)
    res.append(("成員非真實單元 → DENY", any("非真實" in x for x in p3)))
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
            units, speak = load()
        except Exception as e:
            print(f"  [ia] 讀不到資料（fail-closed）：{e}"); sys.exit(99)
        probs, info = analyze(units, speak)
        print("=== ia_consistency_gate --verify（英語島 IA 一致性）===")
        print(f"  eng 單元總數：{info.get('eng_total')}")
        if info.get("speaking_defined"):
            print(f"  開口說成員（speaking_cats.json）：{info['speaking_members']}"
                  f"；allow_cross_cut={info['allow_cross_cut']}")
            print(f"  ★ 雙重呈現（開口說＋文法 strand 牆同列同一單元）：{info['dual_presented']}")
            for p, s, t in info.get("dual_examples", []):
                print(f"      - {p}  strand={s}  {t}")
            print(f"  非開口說成員的 eng 單元（不該出現在開口說；多為文法單元）：{info['non_member_eng']}")
        else:
            print("  （authoring/speaking_cats.json 不存在＝開口說成員未定義，無法判雙列）")
        for p in probs:
            print(f"  [ia] {p}")
        print(f"RESULT(IA): {'PASS ✅' if not probs else 'FAIL ❌'}（違規 {len(probs)}）")
        sys.exit(0 if not probs else 1)
    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    main()
