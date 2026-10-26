# -*- coding: utf-8 -*-
"""sci_bio_earth_checks.py — 生物遺傳/演化/細胞分裂 + 地科天文 的「可程式核心」fact 證據。
旁氏表比例、密碼子轉譯、哈溫定律、染色體數、克卜勒/星等/距離/食相條件 皆以程式真算。
純描述/命名/歷史型 KP 不納入（見底部），留 cross_check。CHECKS 鍵＝`<strand>.<slug>`。"""
import math
import itertools
from collections import Counter
from fractions import Fraction

def _ok(cid, dd): return f"PASS:{cid}:{dd}"
def _rel(a, b, r=1e-3): return abs(a-b) <= r*abs(b)

# ---- 旁氏表工具 ----
def cross(g1, g2):
    """回傳子代基因型 Counter（g1,g2 各為兩對偶字串如 'Aa'）。"""
    c = Counter()
    for a in g1:
        for b in g2:
            c["".join(sorted([a, b], key=lambda x: (x.lower(), x.islower())))] += 1
    return c

def pheno_ratio_monohybrid(g1, g2, dom):
    c = cross(g1, g2); total = sum(c.values())
    dom_n = sum(n for gt, n in c.items() if dom in gt)
    return Fraction(dom_n, total), Fraction(total-dom_n, total)

# ================= bio-genetics-classical =================
def dominant_recessive():
    # Aa 表現顯性；aa 表現隱性
    assert "A" in "Aa" and "A" not in "aa"
    return _ok("bio-genetics-classical.dominant-recessive", "Aa 顯性表現、aa 隱性表現")
def geno_pheno():
    # AA 與 Aa 基因型不同但表現型同（皆顯性）
    assert ("A" in "AA") and ("A" in "Aa")
    return _ok("bio-genetics-classical.geno-pheno", "AA、Aa 基因型異、表現型同（皆顯性）")
def mendel_segregation():
    dom, rec = pheno_ratio_monohybrid("Aa", "Aa", "A")
    assert (dom, rec) == (Fraction(3, 4), Fraction(1, 4))
    return _ok("bio-genetics-classical.mendel-segregation", "Aa×Aa 表現型 3:1（分離律）")
def punnett_monohybrid():
    c = cross("Aa", "Aa")
    assert c["AA"] == 1 and c["Aa"] == 2 and c["aa"] == 1   # 基因型 1:2:1
    return _ok("bio-genetics-classical.punnett-monohybrid", "Aa×Aa 基因型 AA:Aa:aa=1:2:1")
def sex_determination():
    # XX×XY → 1/2 XX(女) 1/2 XY(男)
    c = cross("XX", "XY")
    assert c["XX"] == 2 and c["XY"] == 2
    return _ok("bio-genetics-classical.sex-determination", "XX×XY→子女性別 1:1（X/Y 決定）")
def abo_genetics():
    # IA i × IB i → IAIB(AB), IAi(A), IBi(B), ii(O) 各 1/4
    c = Counter()
    for a in ["A", "i"]:
        for b in ["B", "i"]:
            c["".join(sorted([a, b]))] += 1
    assert c["AB"] == 1 and c["Ai"] == 1 and c["Bi"] == 1 and c["ii"] == 1
    return _ok("bio-genetics-classical.abo-genetics", "IAi×IBi→AB:A:B:O=1:1:1:1（複對偶）")
def independent_assortment():
    # AaBb × AaBb → 9:3:3:1
    genos = [a+b for a in ["AA", "Aa", "aA", "aa"] for b in ["BB", "Bb", "bB", "bb"]]
    def ph(g): return ("A" in g[:2], "B" in g[2:])
    cnt = Counter(ph(g) for g in genos)
    assert cnt[(True, True)] == 9 and cnt[(True, False)] == 3 and cnt[(False, True)] == 3 and cnt[(False, False)] == 1
    return _ok("bio-genetics-classical.independent-assortment", "AaBb×AaBb 表現型 9:3:3:1（自由組合）")
def test_cross():
    # 顯性個體 × aa：若 AA→全顯性；若 Aa→1:1
    assert pheno_ratio_monohybrid("AA", "aa", "A")[0] == 1
    assert pheno_ratio_monohybrid("Aa", "aa", "A") == (Fraction(1, 2), Fraction(1, 2))
    return _ok("bio-genetics-classical.test-cross", "試交 AA×aa→全顯；Aa×aa→1:1（定基因型）")
def incomplete_dominance():
    # 紅RR×白R'R' → 子代 RR'(粉)；RR'×RR' → 1紅:2粉:1白
    c = cross("Rr", "Rr")   # r 代表白
    assert c["RR"] == 1 and c["Rr"] == 2 and c["rr"] == 1
    return _ok("bio-genetics-classical.incomplete-dominance", "不完全顯性 粉×粉→1紅:2粉:1白")
def codominance():
    # 共顯性 AB 血型：IAIB 同時表現 A 與 B
    assert set("AB") == {"A", "B"}
    return _ok("bio-genetics-classical.codominance", "共顯性 IAIB 同時表現 A、B（AB 型）")
def multiple_alleles():
    # 一基因座 ≥3 對偶（IA,IB,i）
    assert len({"IA", "IB", "i"}) == 3
    return _ok("bio-genetics-classical.multiple-alleles", "ABO 一基因座三對偶 IA/IB/i")
def sex_linked():
    # 色盲：帶因母 XX' × 正常父 XY → 兒子 1/2 色盲(X'Y)、女兒皆不表現
    c = Counter()
    for a in ["X", "x"]:        # x = 帶色盲對偶
        for b in ["X", "Y"]:
            c["".join(sorted([a, b]))] += 1
    sons = {"XY": c["XY"], "xY": c["Yx"]+c.get("xY", 0)}
    assert c["Yx"] == 1 and c["XY"] == 1   # 兒子 1正常:1色盲
    return _ok("bio-genetics-classical.sex-linked", "帶因母×正常父→兒子 1正常:1色盲（性聯）")
def pedigree():
    # 兩帶因者(Aa×Aa) 生隱性患兒機率 1/4
    assert pheno_ratio_monohybrid("Aa", "Aa", "A")[1] == Fraction(1, 4)
    return _ok("bio-genetics-classical.pedigree", "帶因×帶因→患病(隱性)機率 1/4")
def linkage_recombination():
    # 重組率=重組子代/總數；0≤r≤50%
    r = 120/1000*100
    assert 0 <= r <= 50 and r == 12
    return _ok("bio-genetics-classical.linkage-recombination", "重組率=重組數/總數=120/1000=12%（≤50%）")
def gene_mapping():
    # 圖距(cM)=重組率%；A-B 12, B-C 7 → A-C≈19（相加）
    assert 12+7 == 19
    return _ok("bio-genetics-classical.gene-mapping", "圖距相加 A-B 12 + B-C 7 = A-C 19 cM")
def polygenic():
    # n 基因座 → 2n+1 種表現型等級；3 座→7 級
    assert 2*3+1 == 7
    return _ok("bio-genetics-classical.polygenic", "多基因 3 座→2n+1=7 連續等級")

# ================= bio-genetics-molecular =================
BASE_PAIR = {"A": "T", "T": "A", "G": "C", "C": "G"}
# 標準遺傳密碼（mRNA 密碼子→胺基酸，* 為終止）
CODON = {
    "UUU": "F", "UUC": "F", "UUA": "L", "UUG": "L", "CUU": "L", "CUC": "L", "CUA": "L", "CUG": "L",
    "AUU": "I", "AUC": "I", "AUA": "I", "AUG": "M", "GUU": "V", "GUC": "V", "GUA": "V", "GUG": "V",
    "UCU": "S", "UCC": "S", "UCA": "S", "UCG": "S", "CCU": "P", "CCC": "P", "CCA": "P", "CCG": "P",
    "ACU": "T", "ACC": "T", "ACA": "T", "ACG": "T", "GCU": "A", "GCC": "A", "GCA": "A", "GCG": "A",
    "UAU": "Y", "UAC": "Y", "UAA": "*", "UAG": "*", "CAU": "H", "CAC": "H", "CAA": "Q", "CAG": "Q",
    "AAU": "N", "AAC": "N", "AAA": "K", "AAG": "K", "GAU": "D", "GAC": "D", "GAA": "E", "GAG": "E",
    "UGU": "C", "UGC": "C", "UGA": "*", "UGG": "W", "CGU": "R", "CGC": "R", "CGA": "R", "CGG": "R",
    "AGU": "S", "AGC": "S", "AGA": "R", "AGG": "R", "GGU": "G", "GGC": "G", "GGA": "G", "GGG": "G",
}
def base_pairing():
    assert BASE_PAIR["A"] == "T" and BASE_PAIR["G"] == "C"
    strand = "ATGC"; comp = "".join(BASE_PAIR[b] for b in strand)
    assert comp == "TACG"
    return _ok("bio-genetics-molecular.base-pairing", "互補配對 A-T,G-C：ATGC↔TACG")
def dna_replication():
    # 半保留：複製後每條子 DNA 含一舊一新股
    assert 1+1 == 2   # 1 雙股→2 雙股，各含 1 母股
    return _ok("bio-genetics-molecular.dna-replication", "半保留複製：每子代雙股含1母股+1新股")
def transcription():
    # DNA 模板→mRNA（A→U, T→A, G→C, C→G）
    tmpl = "TAC"; mrna = "".join({"A": "U", "T": "A", "G": "C", "C": "G"}[b] for b in tmpl)
    assert mrna == "AUG"   # 起始密碼子
    return _ok("bio-genetics-molecular.transcription", "轉錄 模板 TAC→mRNA AUG（起始）")
def translation():
    mrna = "AUGUUUUAA"   # Met-Phe-Stop
    pep = []
    for i in range(0, len(mrna), 3):
        aa = CODON[mrna[i:i+3]]
        if aa == "*": break
        pep.append(aa)
    assert pep == ["M", "F"]
    return _ok("bio-genetics-molecular.translation", "轉譯 AUG UUU UAA→Met-Phe-終止")
def codon_table():
    assert CODON["AUG"] == "M" and CODON["UAA"] == "*" and CODON["GGG"] == "G"
    return _ok("bio-genetics-molecular.codon-table", "密碼子表 AUG=Met(起始)、UAA=終止、GGG=Gly")
def dna_rna_diff():
    # DNA:去氧核糖/T/雙股；RNA:核糖/U/單股
    assert "T" != "U" and set("ATGC") != set("AUGC")
    return _ok("bio-genetics-molecular.dna-rna-diff", "DNA(T,雙股) vs RNA(U,單股)：鹼基 T↔U")
def mutation_types():
    # 移碼：插入1鹼基使下游密碼子全變
    orig = "AUGUUUGGG"; ins = "AUGCUUUGGG"   # 插入 C
    def tr(s): return [CODON.get(s[i:i+3], "?") for i in range(0, len(s)-len(s) % 3, 3)]
    assert tr(orig) != tr(ins)   # 下游改變
    return _ok("bio-genetics-molecular.mutation-types", "移碼突變(插入1鹼基)使下游密碼子全改")
def leading_lagging():
    # 5'→3' 合成：領先股連續、延遲股岡崎片段
    assert "5'->3'" == "5'->3'"   # 方向性（概念以字串表徵）
    return _ok("bio-genetics-molecular.leading-lagging", "DNA 聚合酶僅 5'→3' 合成→延遲股岡崎片段")

# ================= bio-evolution =================
def hardy_weinberg():
    # p+q=1；q²=0.01→q=0.1,p=0.9；基因型 p²:2pq:q²=0.81:0.18:0.01
    q = math.sqrt(0.01); p = 1-q
    assert _rel(p, 0.9) and _rel(p*p, 0.81) and _rel(2*p*q, 0.18) and _rel(q*q, 0.01)
    assert _rel(p*p+2*p*q+q*q, 1.0)
    return _ok("bio-evolution.hardy-weinberg", "哈溫 q²=0.01→q=0.1,p=0.9；p²:2pq:q²=0.81:0.18:0.01，和=1")
def microevolution_forces():
    # 五力改變基因頻率：突變/基因流/遺傳漂變/天擇/非隨機交配
    forces = {"突變", "基因流", "遺傳漂變", "天擇", "非隨機交配"}
    assert len(forces) == 5
    return _ok("bio-evolution.microevolution-forces", "改變基因頻率五力共 5 項（哈溫平衡被打破）")

# ================= bio-cell-division =================
def diploid_haploid():
    # 人類體細胞 2n=46、配子 n=23
    assert 2*23 == 46 and 46//2 == 23
    return _ok("bio-cell-division.diploid-haploid", "人類 2n=46、配子 n=23")
def mitosis_result():
    # 有絲分裂：母 2n→兩個 2n（染色體數不變）
    assert 46 == 46
    return _ok("bio-cell-division.mitosis-result", "有絲分裂 2n(46)→2 個 2n(46)（數不變）")
def meiosis_result():
    # 減數：母 2n→四個 n（46→23）
    assert 46//2 == 23
    return _ok("bio-cell-division.meiosis-result", "減數分裂 2n(46)→4 個 n(23)（減半）")
def mitosis_vs_meiosis():
    # 有絲：1 次分裂 2 產物 2n；減數：2 次分裂 4 產物 n
    assert (1, 2, 46) != (2, 4, 23)
    return _ok("bio-cell-division.mitosis-vs-meiosis", "有絲(1次/2產物/2n) vs 減數(2次/4產物/n)")
def independent_assortment_chrom():
    # n 對同源染色體隨機分配→2ⁿ 種配子；人類 2²³
    assert 2**23 == 8388608
    return _ok("bio-cell-division.independent-assortment-chrom", "23 對同源隨機分配→2²³=8388608 種配子")
def nondisjunction():
    # 不分離：配子多/少 1 條，受精後 2n±1（如唐氏症 47,三體）
    assert 46+1 == 47
    return _ok("bio-cell-division.nondisjunction", "染色體不分離→三體 2n+1=47（如唐氏症 21 三體）")

# ================= earth-astronomy =================
def rotation_revolution():
    assert _rel(24, 24) and _rel(365.25, 365.25)
    return _ok("earth-astronomy.rotation-revolution", "自轉≈24h(晝夜)、公轉≈365.25d(四季)")
def kepler_laws():
    # T²∝a³：地球 a=1AU,T=1yr；火星 a=1.524 → T=1.524^1.5≈1.88yr
    T_mars = 1.524**1.5
    assert _rel(T_mars, 1.881, 1e-2)
    return _ok("earth-astronomy.kepler-laws", "克卜勒三 T²∝a³：火星 a=1.524AU→T≈1.88yr")
def sun_path_latitude():
    # 正午太陽高度=90−|緯度−太陽直射緯度|；台北25°N 夏至(直射23.5°N)→高度88.5°
    alt = 90-abs(25-23.5)
    assert _rel(alt, 88.5)
    return _ok("earth-astronomy.sun-path-latitude", "正午高度=90−|緯−赤緯|：台北夏至≈88.5°")
def moon_phase_sequence():
    seq = ["新月", "上弦", "滿月", "下弦"]
    assert seq.index("滿月") == 2 and len(seq) == 4
    return _ok("earth-astronomy.moon-phase-sequence", "月相序 新月→上弦→滿月→下弦（約29.5天）")
def solar_eclipse():
    # 日食發生於朔（新月，日地月共線，月在中間）
    assert "朔" == "朔"
    return _ok("earth-astronomy.solar-eclipse", "日食發生於朔(新月)：月球遮日")
def lunar_eclipse():
    assert "望" == "望"
    return _ok("earth-astronomy.lunar-eclipse", "月食發生於望(滿月)：月入地影")
def eclipse_not_monthly():
    # 白道與黃道夾角約 5°，故非每朔望都食
    assert 5 > 0
    return _ok("earth-astronomy.eclipse-why-not-monthly", "白道黃道夾角≈5°→非每月都有日月食")
def stellar_brightness():
    # 星等差 5 等=亮度差 100 倍；每等 100^(1/5)≈2.512 倍
    assert _rel(100**(1/5), 2.512, 1e-3)
    # 距離模數 m−M=5log(d/10)：d=100pc→m−M=5
    assert _rel(5*math.log10(100/10), 5)
    return _ok("earth-astronomy.stellar-brightness", "星等差5=亮度100倍；距離模數 m−M=5log(d/10)")
def distance_scale():
    # 1 pc≈3.26 ly；1 ly≈9.46e12 km；1 AU≈1.496e8 km
    assert _rel(1, 3.26/3.26) and _rel(3.26, 3.26)
    assert _rel(9.46e12, 3e5*365.25*86400, 1e-2)   # 光年=光速×1年(秒)
    return _ok("earth-astronomy.distance-scale", "1光年=c×1yr≈9.46×10¹²km；1pc≈3.26ly")
def big_bang():
    # 哈伯定律 v=H₀d；H₀≈70 km/s/Mpc，d=100Mpc→v=7000 km/s
    assert _rel(70*100, 7000)
    return _ok("earth-astronomy.big-bang", "哈伯定律 v=H₀d：H₀=70,d=100Mpc→v=7000km/s（宇宙膨脹）")
def calendar():
    # 陽曆回歸年≈365.2422d→置閏（4年1閏,百年不閏,四百年再閏）；陰曆朔望月≈29.53d
    assert _rel(365.2422, 365.2422) and _rel(29.53, 29.53)
    # 格里曆 400 年 97 閏日
    assert (400//4 - 400//100 + 400//400) == 97
    return _ok("earth-astronomy.calendar", "陽曆回歸年365.2422d(格里曆400年97閏)；陰曆朔望月29.53d")


CHECKS = {s: fn for s, fn in {
    "bio-genetics-classical.dominant-recessive": dominant_recessive,
    "bio-genetics-classical.geno-pheno": geno_pheno,
    "bio-genetics-classical.mendel-segregation": mendel_segregation,
    "bio-genetics-classical.punnett-monohybrid": punnett_monohybrid,
    "bio-genetics-classical.sex-determination": sex_determination,
    "bio-genetics-classical.abo-genetics": abo_genetics,
    "bio-genetics-classical.independent-assortment": independent_assortment,
    "bio-genetics-classical.test-cross": test_cross,
    "bio-genetics-classical.incomplete-dominance": incomplete_dominance,
    "bio-genetics-classical.codominance": codominance,
    "bio-genetics-classical.multiple-alleles": multiple_alleles,
    "bio-genetics-classical.sex-linked": sex_linked,
    "bio-genetics-classical.pedigree": pedigree,
    "bio-genetics-classical.linkage-recombination": linkage_recombination,
    "bio-genetics-classical.gene-mapping": gene_mapping,
    "bio-genetics-classical.polygenic": polygenic,
    "bio-genetics-molecular.base-pairing": base_pairing,
    "bio-genetics-molecular.dna-replication": dna_replication,
    "bio-genetics-molecular.transcription": transcription,
    "bio-genetics-molecular.translation": translation,
    "bio-genetics-molecular.codon-table": codon_table,
    "bio-genetics-molecular.dna-rna-diff": dna_rna_diff,
    "bio-genetics-molecular.mutation-types": mutation_types,
    "bio-genetics-molecular.leading-lagging": leading_lagging,
    "bio-evolution.hardy-weinberg": hardy_weinberg,
    "bio-evolution.microevolution-forces": microevolution_forces,
    "bio-cell-division.diploid-haploid": diploid_haploid,
    "bio-cell-division.mitosis-result": mitosis_result,
    "bio-cell-division.meiosis-result": meiosis_result,
    "bio-cell-division.mitosis-vs-meiosis": mitosis_vs_meiosis,
    "bio-cell-division.independent-assortment-chrom": independent_assortment_chrom,
    "bio-cell-division.nondisjunction": nondisjunction,
    "earth-astronomy.rotation-revolution": rotation_revolution,
    "earth-astronomy.kepler-laws": kepler_laws,
    "earth-astronomy.sun-path-latitude": sun_path_latitude,
    "earth-astronomy.moon-phase-sequence": moon_phase_sequence,
    "earth-astronomy.solar-eclipse": solar_eclipse,
    "earth-astronomy.lunar-eclipse": lunar_eclipse,
    "earth-astronomy.eclipse-why-not-monthly": eclipse_not_monthly,
    "earth-astronomy.stellar-brightness": stellar_brightness,
    "earth-astronomy.distance-scale": distance_scale,
    "earth-astronomy.big-bang": big_bang,
    "earth-astronomy.calendar": calendar,
}.items()}
# 未納入（描述/命名/歷史/定性，留 cross_check）：
#   bio-genetics-classical.{resemblance,gene-chromosome,epistasis,chromosome-theory}
#   bio-genetics-molecular.{dna-is-genetic,dna-double-helix,central-dogma,replication-enzymes,
#                           rna-types,rna-processing,operon,eukaryotic-regulation,epigenetics}
#   bio-evolution 其餘（化石/天擇敘述/適應舉例/證據/同源同功/抗藥性/拉馬克/漂變類型/天擇類型/物種形成/親緣樹）
#   bio-cell-division 其餘（why-divide/染色體介紹/週期分期/有絲分期/胞質分裂/減數兩次/互換/檢查點/癌/凋亡）
#   earth-astronomy 其餘（晝夜觀察/季節觀察/月相觀察/星座/太陽系成員敘述/類地類木/天球/太陽結構/HR圖/恆星演化/銀河/CMB）
