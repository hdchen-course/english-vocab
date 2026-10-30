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

# strand 顯示正名（繁體；由各 strand 底下 KP 的 title_zh 歸納，逐一覆核）。
# 鍵＝"<domain>\u001f<strand>"。未列入者 fallback 回 slug 並標 needs_review。
STRAND_ZH = {
    # ── 國語文 chi ──
    "chi\u001fchar": "識字與筆順", "chi\u001fclassical": "文言文基礎",
    "chi\u001fdual": "多文本比較閱讀", "chi\u001fgram": "語法與詞類",
    "chi\u001fgwrk": "知性題寫作", "chi\u001fgwrq": "情意題寫作",
    "chi\u001flit": "文學與文體", "chi\u001fphon": "注音符號",
    "chi\u001fprac": "應用文", "chi\u001fpunc": "標點符號",
    "chi\u001fread": "閱讀理解", "chi\u001frhet": "修辭",
    "chi\u001fword": "字音與字形", "chi\u001fwrit": "命題作文",
    "chi\u001fwritjh": "段落與結構寫作",
    # ── 英語文 eng ──
    "eng\u001fadjadv": "形容詞與副詞", "eng\u001fadvcl": "副詞子句",
    "eng\u001farticle": "冠詞", "eng\u001fconj": "連接詞",
    "eng\u001flistening": "聽力", "eng\u001fmodal": "情態助動詞",
    "eng\u001fmorph": "構詞與字尾", "eng\u001fnonfinite": "不定詞與動名詞",
    "eng\u001fnoun": "名詞", "eng\u001fnouncl": "名詞子句",
    "eng\u001fpattern": "基本句型", "eng\u001fphonics": "自然發音",
    "eng\u001fprep": "介系詞", "eng\u001fpron": "代名詞",
    "eng\u001freading": "閱讀理解", "eng\u001frelcl": "關係子句",
    "eng\u001fspecial": "特殊句型", "eng\u001fsubj": "假設語氣",
    "eng\u001fverb": "動詞與時態", "eng\u001fvocab": "主題字彙",
    "eng\u001fvoice": "被動語態", "eng\u001fwriting": "英文寫作",
    # ── 數學 math ──
    "math\u001falgexpr": "代數與規律", "math\u001fcalc": "極限與微積分",
    "math\u001fcomplex": "複數", "math\u001fconic": "圓錐曲線",
    "math\u001fcounting": "排列組合", "math\u001fdeterminant": "行列式",
    "math\u001fequation": "方程式", "math\u001ffinmath": "財務數學",
    "math\u001ffunction": "函數", "math\u001fgeom": "幾何",
    "math\u001finequality": "不等式", "math\u001flinprog": "線性規劃",
    "math\u001fmatrix": "矩陣", "math\u001fnumquant": "數與計算",
    "math\u001fprob": "機率", "math\u001fratio": "比與比例",
    "math\u001fsequence": "數列與級數", "math\u001fspace": "空間與坐標",
    "math\u001fstats": "統計", "math\u001ftrig": "三角函數",
    "math\u001fvector": "向量",
    # ── 自然科學 sci ──
    "sci\u001finquiry": "科學探究",
    "sci\u001fbio-biodiversity": "生物：分類與多樣性", "sci\u001fbio-biotech": "生物：生物技術",
    "sci\u001fbio-cell-division": "生物：細胞分裂", "sci\u001fbio-cell-structure": "生物：細胞與顯微鏡",
    "sci\u001fbio-circulation": "生物：循環系統", "sci\u001fbio-conservation": "生物：保育與環境",
    "sci\u001fbio-coordination": "生物：神經與感覺", "sci\u001fbio-digestion": "生物：消化與營養",
    "sci\u001fbio-ecology": "生物：生態系", "sci\u001fbio-enzyme-energy": "生物：酵素與能量",
    "sci\u001fbio-evolution": "生物：演化", "sci\u001fbio-excretion": "生物：排泄",
    "sci\u001fbio-gas-exchange": "生物：呼吸與氣體交換", "sci\u001fbio-genetics-classical": "生物：遺傳（性狀）",
    "sci\u001fbio-genetics-molecular": "生物：遺傳（DNA）", "sci\u001fbio-immunity": "生物：免疫與防禦",
    "sci\u001fbio-inquiry": "生物：科學探究", "sci\u001fbio-life-levels": "生物：生命的特徵",
    "sci\u001fbio-membrane-transport": "生物：擴散與滲透", "sci\u001fbio-musculoskeletal": "生物：骨骼與肌肉",
    "sci\u001fbio-photosynthesis": "生物：光合作用", "sci\u001fbio-plant-physiology": "生物：植物的構造與運輸",
    "sci\u001fbio-reproduction": "生物：生殖與生命週期", "sci\u001fbio-respiration": "生物：呼吸作用",
    "sci\u001fchem-acidbase": "化學：酸與鹼", "sci\u001fchem-applied": "化學：生活應用",
    "sci\u001fchem-atom": "化學：原子結構", "sci\u001fchem-bond": "化學：化學鍵",
    "sci\u001fchem-eq": "化學：化學平衡", "sci\u001fchem-gas": "化學：氣體",
    "sci\u001fchem-matter": "化學：物質與三態", "sci\u001fchem-organic": "化學：有機化合物",
    "sci\u001fchem-rate": "化學：反應速率", "sci\u001fchem-redox": "化學：氧化還原",
    "sci\u001fchem-soln": "化學：溶液", "sci\u001fchem-stoich": "化學：化學式與計量",
    "sci\u001fchem-thermo": "化學：反應中的能量",
    "sci\u001fearth-astronomy": "地球科學：天文與星象", "sci\u001fearth-atmosphere": "地球科學：大氣",
    "sci\u001fearth-climate": "地球科學：氣候", "sci\u001fearth-earth-system": "地球科學：地球概觀",
    "sci\u001fearth-environment": "地球科學：資源與災害", "sci\u001fearth-geomorph": "地球科學：地表作用",
    "sci\u001fearth-geotime": "地球科學：化石與地層", "sci\u001fearth-hydrology": "地球科學：水循環",
    "sci\u001fearth-inquiry": "地球科學：觀測與探究", "sci\u001fearth-ocean": "地球科學：海洋",
    "sci\u001fearth-quake-volcano": "地球科學：地震與火山", "sci\u001fearth-rock-mineral": "地球科學：岩石與礦物",
    "sci\u001fearth-tectonics": "地球科學：板塊運動", "sci\u001fearth-weather": "地球科學：天氣",
    "sci\u001fphys-circ": "物理：圓周運動", "sci\u001fphys-em": "物理：電與磁",
    "sci\u001fphys-energy": "物理：能量與功", "sci\u001fphys-estatic": "物理：電路與靜電",
    "sci\u001fphys-fluid": "物理：壓力與浮力", "sci\u001fphys-force": "物理：力",
    "sci\u001fphys-heat": "物理：溫度與熱", "sci\u001fphys-kin": "物理：運動的描述",
    "sci\u001fphys-meas": "物理：測量與單位", "sci\u001fphys-modern": "物理：近代物理",
    "sci\u001fphys-optics": "物理：光學", "sci\u001fphys-wave": "物理：波與聲音",
    # ── 公民與社會 soc-civ ──
    "soc-civ\u001fculture": "文化與族群", "soc-civ\u001feconomy": "經濟生活",
    "soc-civ\u001fglobal": "國際與地球村", "soc-civ\u001fgroup": "社會團體",
    "soc-civ\u001finquiry": "公共議題探究", "soc-civ\u001fissues": "人權與價值衝突",
    "soc-civ\u001flaw": "法律與規範", "soc-civ\u001fpolitics": "政治與國家",
    "soc-civ\u001frights": "權利與人權", "soc-civ\u001fself": "自我認識",
    # ── 地理 soc-geo ──
    "soc-geo\u001fapp-sustain": "環境行動與永續", "soc-geo\u001fhazard": "防災與避難",
    "soc-geo\u001fhum-industry": "產業活動", "soc-geo\u001fhum-pop": "人口",
    "soc-geo\u001fhum-settle": "聚落", "soc-geo\u001fhum-transport": "交通運輸",
    "soc-geo\u001fnat-climate": "氣候", "soc-geo\u001fnat-hydro": "河流與水文",
    "soc-geo\u001fnat-landform": "地形", "soc-geo\u001fnat-soilbio": "土壤與植被",
    "soc-geo\u001freg-cn": "區域地理：中國", "soc-geo\u001freg-tw": "區域地理：台灣",
    "soc-geo\u001freg-world": "區域地理：世界", "soc-geo\u001fskill": "地圖與方位",
    "soc-geo\u001fspatial-decision": "空間規劃與決策",
    # ── 歷史 soc-hist ──
    "soc-hist\u001fcross": "歷史跨科整合", "soc-hist\u001feastasia": "東亞歷史",
    "soc-hist\u001fskill": "時序與史料", "soc-hist\u001ftaiwan": "台灣歷史",
    "soc-hist\u001fworld": "世界歷史",
    # ── 生活應用 life ──
    "life\u001fai-algo": "AI 與演算法素養", "life\u001falgorithm": "演算法思維",
    "life\u001fapply": "專題實作", "life\u001fbias": "認知偏誤",
    "life\u001fbody-boundary": "身體界線", "life\u001fbudget": "預算規劃",
    "life\u001fcharts": "圖表判讀", "life\u001fcitizen": "數位公民",
    "life\u001fcivic-action": "公民行動", "life\u001fclimate": "環保與減碳",
    "life\u001fcredit-risk": "信用與保險", "life\u001fcritical-creative": "批判與創意思考",
    "life\u001fct-pillars": "運算思維", "life\u001fcyberbully": "網路霸凌防治",
    "life\u001fdecision": "決策思考", "life\u001fdeduction-induction": "推理：演繹與歸納",
    "life\u001femergency": "緊急應變", "life\u001fevidence": "事實與證據",
    "life\u001fextra": "安全綜合", "life\u001ffactcheck": "訊息查證",
    "life\u001ffallacy": "邏輯謬誤", "life\u001ffocus": "專注力",
    "life\u001fglobal-citizen": "全球公民", "life\u001fgoals-time": "目標與時間管理",
    "life\u001fgrowth-mindset": "成長型思維", "life\u001fhabits": "學習習慣",
    "life\u001fhardware": "電腦與資料", "life\u001fhome": "居家安全",
    "life\u001finterest": "利息與複利", "life\u001finventions": "發明與科學進展",
    "life\u001fjudgment": "提問與判讀", "life\u001flogic": "邏輯推理",
    "life\u001fmarket": "市場與供需", "life\u001fmedia": "媒體識讀",
    "life\u001fmemory": "記憶策略", "life\u001fmetacognition": "後設認知",
    "life\u001fmindset": "設計與創客思考", "life\u001fmisleading": "誤導性統計圖表",
    "life\u001fmoney-basics": "認識金錢", "life\u001fmoney-values": "金錢價值觀",
    "life\u001fnetwork": "網路原理", "life\u001fnews": "新聞識讀",
    "life\u001fonline": "網路交友安全", "life\u001fpeople": "改變世界的人",
    "life\u001fpersonal": "人身安全", "life\u001fprivacy": "隱私與個資",
    "life\u001frelationship": "人際關係", "life\u001fsaving": "儲蓄與消費",
    "life\u001fscam": "詐騙辨識", "life\u001fsdgs": "永續發展目標 SDGs",
    "life\u001fsecurity": "資訊安全", "life\u001fself-aware": "情緒覺察",
    "life\u001fself-manage": "情緒調節", "life\u001fsocial-aware": "同理與社會覺察",
    "life\u001fstats": "統計概念", "life\u001fstudy-skills": "讀書方法",
    "life\u001fsubstance": "菸酒毒品防制", "life\u001ftech-society": "科技與社會",
    "life\u001ftraffic": "交通安全",
}


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
        key = f"{d}\u001f{s}"  # U+001F 分隔，仿 §9.4
        zh = STRAND_ZH.get(key)
        strand_labels[key] = {"title_zh": zh if zh else s, "needs_review": zh is None}
    json.dump(strand_labels, open(os.path.join(AUTH, "strand_labels.json"), "w"),
              ensure_ascii=False, indent=1)

    # nav_index：島→subject→strand→tier 計數（minimum 與 beyond 分開記）
    tree = collections.defaultdict(lambda: collections.defaultdict(
        lambda: {"min": collections.Counter(), "beyond": collections.Counter()}))
    for r in items:
        d = r["id"].split(".")[0]; s = r.get("strand", ""); ti = r.get("tier", "")
        bucket = "beyond" if r.get("beyond") else "min"
        tree[d][s][bucket][ti] += 1

    # strand 建議學習順序（基礎→進階）：以 tier 分布推「入門階」＝有知識點的最低 tier；
    # 同入門階者，base 數多（更基礎）在前、總數多在前、再以 slug 穩定排序。
    # 這是**粗略線性建議順序**（非完整先備關係 DAG）；完整 §6.1 先備邊由各科領域專家 authored（待 Phase 2）。
    def strand_order_key(cell):
        combined = {t: cell["min"].get(t, 0) + cell["beyond"].get(t, 0) for t in TIERS}
        entry = next((i for i, t in enumerate(TIERS) if combined[t] > 0), len(TIERS))
        return (entry, -cell["min"].get("t_base", 0), -sum(combined.values()))

    islands = []
    for d, (title, order) in sorted(SUBJECTS.items(), key=lambda kv: kv[1][1]):
        ordered = sorted(tree.get(d, {}),
                         key=lambda s: strand_order_key(tree[d][s]) + (s,))
        strands = []
        for pos, s in enumerate(ordered, start=1):
            cell = tree[d][s]
            mn = sum(cell["min"].values()); by = sum(cell["beyond"].values())
            strands.append({"strand": s, "order": pos,  # 1-based 建議順序（基礎→進階）
                            "title_zh": strand_labels[f"{d}\u001f{s}"]["title_zh"],
                            "min_count": mn, "beyond_count": by,
                            "tiers": {t: cell["min"].get(t, 0) + cell["beyond"].get(t, 0)
                                      for t in TIERS if (cell["min"].get(t, 0) + cell["beyond"].get(t, 0))}})
        min_total = sum(x["min_count"] for x in strands)
        islands.append({"island": d, "subject": d, "title_zh": title, "order": order,
                        "order_basis": "coarse-tier-sequence",  # 非 DAG；完整先備關係待 §6.1 authored
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
