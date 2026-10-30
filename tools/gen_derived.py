#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_derived.py — §6.7 衍生檔產生管線（Phase 1）。從 knowledge_points.json 衍生前端輕量檔。

產出（皆進 git、不得手改、手改來源再 regen）：
  authoring/subject_labels.json  domain→{title_zh, island, order}
  authoring/strand_labels.json   "(domain,strand)"→{title_zh, needs_review}  （211 配對；中文名半自動，需人工覆核）
  authoring/nav_index.json       島→subject→strand→tier 計數（不含 3096 逐條；前端首屏只讀此檔，R9/ND）

注意：島↔subject 的 §6.1 策展 9 島 rollup 與 strand 中文正名屬人工精修項；本工具先產**鍵集合完整、計數正確**
的骨架（island 暫以 domain 為單位、strand title 自 slug 衍生並標 needs_review），供 hub 骨架渲染與 gate 鍵集合檢查；
正名後 regen 即覆寫。覆蓋矩陣/顯示正名不因此 vacuous 通過——strand_labels 的 needs_review 供後續人工清零。
"""
import collections, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "authoring", "knowledge_points.json")
AUTH = os.path.join(ROOT, "authoring")

# 8 個 domain 的中文正名（最高層，確定）；island 暫＝domain（§6.1 九島 rollup 為人工精修項）
SUBJECTS = {
    "chi":      ("國語文",   1),
    "eng":      ("英語文",   2),
    "math":     ("數學",     3),
    "sci":      ("自然科學", 4),
    "soc-civ":  ("公民與社會", 5),
    "soc-geo":  ("地理",     6),
    "soc-hist": ("歷史",     7),
    "life":     ("生活應用", 8),
}
TIERS = ["t_base", "t_mid", "t_adv", "t_sub", "t_enrich"]
# sci 子領域前綴中文（strand 正名用；其餘 strand 暫以 slug + needs_review）
SCI_PREFIX = {"bio": "生物", "chem": "化學", "earth": "地球科學", "phys": "物理"}


def main():
    items = json.loads(open(MANIFEST, encoding="utf-8").read())["items"]

    # subject_labels
    subject_labels = {d: {"title_zh": t, "island": d, "order": o} for d, (t, o) in SUBJECTS.items()}
    json.dump(subject_labels, open(os.path.join(AUTH, "subject_labels.json"), "w"),
              ensure_ascii=False, indent=1)

    # strand_labels：(domain,strand) 鍵集合（精確等於 manifest 實際出現的配對）
    pairs = sorted({(r["id"].split(".")[0], r.get("strand", "")) for r in items})
    strand_labels = {}
    for d, s in pairs:
        pref = s.split("-")[0]
        zh = SCI_PREFIX.get(pref, "") if d == "sci" else ""
        title = (zh + "・" + s) if zh else s
        strand_labels[f"{d}\u001f{s}"] = {"title_zh": title, "needs_review": True}  # U+001F 分隔，仿 §9.4
    json.dump(strand_labels, open(os.path.join(AUTH, "strand_labels.json"), "w"),
              ensure_ascii=False, indent=1)

    # nav_index：島→subject→strand→tier 計數（minimum 與 beyond 分開記）
    tree = collections.defaultdict(lambda: collections.defaultdict(
        lambda: {"min": collections.Counter(), "beyond": collections.Counter()}))
    for r in items:
        d = r["id"].split(".")[0]; s = r.get("strand", ""); ti = r.get("tier", "")
        bucket = "beyond" if r.get("beyond") else "min"
        tree[d][s][bucket][ti] += 1

    islands = []
    for d, (title, order) in sorted(SUBJECTS.items(), key=lambda kv: kv[1][1]):
        strands = []
        for s in sorted(tree.get(d, {})):
            cell = tree[d][s]
            mn = sum(cell["min"].values()); by = sum(cell["beyond"].values())
            strands.append({"strand": s,
                            "title_zh": strand_labels[f"{d}\u001f{s}"]["title_zh"],
                            "min_count": mn, "beyond_count": by,
                            "tiers": {t: cell["min"].get(t, 0) + cell["beyond"].get(t, 0)
                                      for t in TIERS if (cell["min"].get(t, 0) + cell["beyond"].get(t, 0))}})
        min_total = sum(x["min_count"] for x in strands)
        islands.append({"island": d, "subject": d, "title_zh": title, "order": order,
                        "strand_count": len(strands), "min_count": min_total,
                        "strands": strands})
    nav = {"_generated_by": "tools/gen_derived.py", "island_count": len(islands),
           "minimum_total": sum(1 for r in items if not r.get("beyond")),
           "beyond_total": sum(1 for r in items if r.get("beyond")),
           "islands": islands}
    json.dump(nav, open(os.path.join(AUTH, "nav_index.json"), "w"), ensure_ascii=False, indent=1)

    print(f"寫出 subject_labels({len(subject_labels)})、strand_labels({len(strand_labels)} 配對)、"
          f"nav_index({len(islands)} 島、minimum {nav['minimum_total']})")


if __name__ == "__main__":
    main()
