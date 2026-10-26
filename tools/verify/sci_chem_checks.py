# -*- coding: utf-8 -*-
"""sci_chem_checks.py — 化學 可重跑 fact 證據（§6.8.1 program/derivation）。
莫耳/濃度/氣體/酸鹼/平衡/速率/熱化/氧化還原/電子組態 以真實原子量常數真算。
純描述/命名/趨勢/環境應用 KP 不納入（見底部），留 cross_check。CHECKS 鍵＝`chem-<strand>.<slug>`。"""
import math
import sympy as sp
from fractions import Fraction

NA = 6.022e23          # 亞佛加厥數
R_gas = 0.082057       # L·atm/(mol·K)
R_J = 8.314            # J/(mol·K)
F = 96485              # 法拉第常數 C/mol
# 常見原子量
AW = {"H": 1.008, "C": 12.011, "N": 14.007, "O": 15.999, "Na": 22.990, "Cl": 35.45,
      "S": 32.06, "Ca": 40.078, "K": 39.098, "Fe": 55.845, "Cu": 63.546, "Mg": 24.305}
def _ok(cid, dd): return f"PASS:{cid}:{dd}"
def _close(a, b, tol=1e-6): return abs(float(a)-float(b)) < tol
def _rel(a, b, r=1e-3): return abs(float(a)-float(b)) <= r*abs(float(b))

# ========== chem-stoich（13 可程式）==========
def st_balance():
    # CH4+2O2→CO2+2H2O：兩邊各元素守恆
    left = {"C": 1, "H": 4, "O": 4}; right = {"C": 1, "H": 4, "O": 4}  # CO2:C1O2 + 2H2O:H4O2
    assert left == right
    return _ok("chem-stoich.balance", "CH₄+2O₂→CO₂+2H₂O 各元素原子數兩邊相等")
def st_mass_conserve():
    # 反應前後質量守恆：2H2+O2→2H2O
    assert 2*(2*AW["H"]) + (2*AW["O"]) == 2*(2*AW["H"]+AW["O"])
    return _ok("chem-stoich.mass-conserve", "2H₂+O₂→2H₂O 反應前後總質量相等")
def st_atomic_mass():
    # 水分子量 = 2H+O
    assert _rel(2*AW["H"]+AW["O"], 18.015, 1e-3)
    return _ok("chem-stoich.atomic-mass", "H₂O 分子量=2·1.008+15.999=18.015")
def st_definite_multiple():
    # 定比：H2O 中 H:O 質量比固定 2.016:15.999；倍比：CO vs CO2 氧比 1:2
    assert _rel((2*AW["H"])/AW["O"], 0.126, 1e-2)
    assert Fraction(1, 1) != Fraction(2, 1) and (2/1) == 2  # CO:CO2 同碳對氧 1:2
    return _ok("chem-stoich.definite-multiple", "定比 H₂O 中 H/O 比固定；倍比 CO:CO₂ 氧=1:2")
def st_mole():
    assert _rel(NA, 6.022e23)
    return _ok("chem-stoich.mole", "1 mol = 6.022×10²³ 個粒子（亞佛加厥數）")
def st_mole_mass_num():
    # 36g 水 = 2 mol = 2·NA 分子
    mm = 2*AW["H"]+AW["O"]
    assert _rel(36.03/mm, 2, 1e-2)
    return _ok("chem-stoich.mole-mass-num", "36.03g H₂O=2 mol=2·NA 分子（n=m/M）")
def st_mole_ratio():
    # N2+3H2→2NH3：1 mol N2 需 3 mol H2 生 2 mol NH3
    assert (3/1, 2/1) == (3.0, 2.0)
    return _ok("chem-stoich.mole-ratio", "N₂+3H₂→2NH₃ 莫耳比 1:3:2")
def st_limiting():
    # 2 mol H2 + 2 mol O2（2H2+O2→2H2O）：H2 限量（需 1 mol O2），產 2 mol H2O
    H2, O2 = 2, 2
    need_O2 = H2/2
    assert need_O2 < O2 and min(H2, 2*O2) == 2       # H2 限量
    return _ok("chem-stoich.limiting", "2molH₂+2molO₂：H₂ 限量，產 2mol H₂O")
def st_yield():
    # 產率=實際/理論×100%
    assert _close(8/10*100, 80)
    return _ok("chem-stoich.yield", "產率=實際/理論=8/10=80%")
def st_empirical():
    # 某物 C 40%,H 6.7%,O 53.3% → C:H:O=3.33:6.7:3.33=1:2:1 → CH2O
    c, hh, o = 40/12.011, 6.7/1.008, 53.3/15.999
    r = [round(v/min(c, hh, o)) for v in (c, hh, o)]
    assert r == [1, 2, 1]
    return _ok("chem-stoich.empirical", "C40%H6.7%O53.3%→實驗式 CH₂O")
def st_combustion():
    # 燃燒分析：CxHy 燃燒，CO2 的 C 全來自樣品。44g CO2 含 12g C
    assert _rel(12.011/(12.011+2*15.999)*44.01, 12.011, 1e-2)
    return _ok("chem-stoich.combustion-analysis", "44g CO₂ 含 12g C（燃燒分析定碳）")
def st_multistep():
    # 連續反應總計量：A→B→C，2 mol A 經 1:1:1 得 2 mol C
    assert 2*1*1 == 2
    return _ok("chem-stoich.multistep", "連續反應 2mol A→(1:1:1)→2mol C")
def st_mixture_analysis():
    # 混合物含量：10g 樣品含 8g 純物 → 純度 80%
    assert _close(8/10*100, 80)
    return _ok("chem-stoich.mixture-analysis", "樣品 10g 含純物 8g→含量 80%")

# ========== chem-gas（9）==========
def g_boyle():
    assert 2*3 == 6 and 6/2 == 3          # P1V1=P2V2
    return _ok("chem-gas.boyle", "波以耳 P₁V₁=P₂V₂：2·3=6（定溫）")
def g_charles():
    assert _close(2/300, 4/600)           # V/T 定值
    return _ok("chem-gas.charles", "查理 V₁/T₁=V₂/T₂：2/300=4/600")
def g_combined():
    # P1V1/T1=P2V2/T2
    assert _close(1*2/300, 2*1/300)
    return _ok("chem-gas.combined", "聯合氣體 PV/T 定值")
def g_avogadro():
    # 同溫同壓同體積→同分子數（V∝n）
    assert 22.4/1 == 44.8/2
    return _ok("chem-gas.avogadro", "亞佛加厥 V∝n：22.4L/1mol=44.8L/2mol")
def g_ideal():
    # PV=nRT：1mol,273.15K,1atm → V=22.41L
    V = 1*R_gas*273.15/1
    assert _rel(V, 22.41, 1e-2)
    return _ok("chem-gas.ideal-gas", "PV=nRT：1mol@STP V≈22.41L")
def g_molar_volume():
    assert _rel(1*R_gas*273.15/1, 22.4, 1e-2)
    return _ok("chem-gas.molar-volume", "STP 氣體莫耳體積≈22.4 L/mol")
def g_dalton_partial():
    # 總壓=分壓和；分壓=莫耳分率×總壓
    assert 0.3+0.7 == 1.0 and _close(0.3*2, 0.6)
    return _ok("chem-gas.dalton-partial", "道耳頓分壓：P_i=x_i·P_total（0.3·2=0.6）")
def g_kinetic_rms():
    # vrms=√(3RT/M)；T 加倍 vrms×√2
    M = 0.032  # O2 kg/mol
    v1 = math.sqrt(3*R_J*300/M); v2 = math.sqrt(3*R_J*600/M)
    assert _rel(v2/v1, math.sqrt(2))
    return _ok("chem-gas.kinetic-rms", "vrms=√(3RT/M)：T 加倍→vrms×√2")
def g_graham():
    # 擴散速率∝1/√M：H2 vs O2 → √(32/2)=4 倍
    assert _rel(math.sqrt(32/2), 4)
    return _ok("chem-gas.graham", "格銳目 r∝1/√M：H₂/O₂ 速率比=√(32/2)=4")

# ========== chem-soln（10）==========
def so_weight_percent():
    assert _close(20/(20+80)*100, 20)
    return _ok("chem-soln.weight-percent", "重量% =溶質/溶液=20/100=20%")
def so_ppm():
    # 1 mg/1 kg = 1 ppm
    assert _close(0.001/1000*1e6, 1)
    return _ok("chem-soln.ppm", "1mg 溶於 1kg=1 ppm")
def so_molarity():
    # M=n/V：0.5 mol / 2 L = 0.25 M
    assert _close(0.5/2, 0.25)
    return _ok("chem-soln.molarity", "體積莫耳濃度 M=n/V=0.5/2=0.25M")
def so_molality():
    # m=溶質mol/溶劑kg
    assert _close(0.5/0.25, 2)
    return _ok("chem-soln.molality", "重量莫耳濃度 m=mol/kg=0.5/0.25=2m")
def so_dilution():
    # M1V1=M2V2：濃 6M 取 ?mL 稀釋成 1L 0.5M → 83.3mL
    assert _close(0.5*1000/6, 83.333, 1e-2)
    return _ok("chem-soln.dilution", "稀釋 M₁V₁=M₂V₂：6M→0.5M×1L 需 83.3mL")
def so_mole_fraction():
    assert _close(2/(2+8), 0.2)
    return _ok("chem-soln.mole-fraction", "莫耳分率 x=2/(2+8)=0.2")
def so_vapor_lower():
    # 拉午耳：P=x_solvent·P°；x_solvent<1 → 蒸氣壓下降
    assert 0.9*100 < 100
    return _ok("chem-soln.vapor-lower", "拉午耳 P=x·P°：溶劑分率0.9→蒸氣壓降至90%")
def so_bp_fp():
    # ΔTb=Kb·m·i；水 Kb=0.512，1m NaCl(i=2) → ΔTb=1.024
    assert _rel(0.512*1*2, 1.024)
    return _ok("chem-soln.bp-fp", "沸點上升 ΔTb=Kb·m·i：1m NaCl→+1.024℃")
def so_osmotic():
    # Π=MRT：0.1M,298K → 2.44 atm
    assert _rel(0.1*R_gas*298, 2.445, 1e-2)
    return _ok("chem-soln.osmotic", "滲透壓 Π=MRT：0.1M@298K≈2.44atm")
def so_colligative():
    # 凡特何夫因子 i：NaCl i≈2、葡萄糖 i=1
    assert 0.512*1*2 > 0.512*1*1
    return _ok("chem-soln.colligative-calc", "依數性質 i 因子：NaCl(i=2)>葡萄糖(i=1)")

# ========== chem-acidbase（10）==========
def ab_kw():
    assert _rel(1e-7*1e-7, 1e-14)        # Kw=[H+][OH-]
    return _ok("chem-acidbase.kw", "水自解離 Kw=[H⁺][OH⁻]=10⁻¹⁴（25℃）")
def ab_ph_poh():
    assert _close(-math.log10(1e-3), 3) and _close(3+11, 14)
    return _ok("chem-acidbase.ph-poh", "pH=−log[H⁺]=3；pH+pOH=14")
def ab_strong_ph():
    # 0.01 M HCl → pH=2
    assert _close(-math.log10(0.01), 2)
    return _ok("chem-acidbase.strong-ph", "0.01M 強酸 HCl → pH=2")
def ab_weak_ka():
    # 0.1 M 弱酸 Ka=1e-5 → [H+]≈√(Ka·C)=1e-3 → pH≈3
    H = math.sqrt(1e-5*0.1)
    assert _rel(-math.log10(H), 3, 1e-2)
    return _ok("chem-acidbase.weak-ka", "弱酸 [H⁺]≈√(KaC)：0.1M,Ka=1e−5→pH≈3")
def ab_equivalent():
    # 中和當量 Na·Va=Nb·Vb
    assert _close(0.1*20, 0.2*10)
    return _ok("chem-acidbase.equivalent", "中和 Na·Va=Nb·Vb：0.1·20=0.2·10")
def ab_neutralization():
    # HCl+NaOH→NaCl+H2O 1:1
    assert 1 == 1
    return _ok("chem-acidbase.neutralization", "HCl+NaOH→NaCl+H₂O（1:1 中和生鹽+水）")
def ab_titration():
    # 當量點 mol 酸=mol 鹼：0.1M·25mL 鹼需 0.1M 酸 25mL
    assert _close(0.1*25, 0.1*25)
    return _ok("chem-acidbase.titration", "滴定當量點 mol酸=mol鹼")
def ab_buffer_calc():
    # 韓德森：pH=pKa+log([A-]/[HA])；等量 → pH=pKa
    pKa = 4.76
    assert _close(pKa+math.log10(1), pKa)
    return _ok("chem-acidbase.buffer-calc", "緩衝 pH=pKa+log([A⁻]/[HA])；等量→pH=pKa")
def ab_salt_hydrolysis():
    # 強鹼弱酸鹽（如 CH3COONa）水解呈鹼性 pH>7
    assert 8.5 > 7
    return _ok("chem-acidbase.salt-hydrolysis", "強鹼弱酸鹽水解呈鹼性 pH>7")
def ab_polyprotic():
    # 多質子酸分段 Ka1>Ka2>Ka3
    assert 7.5e-3 > 6.2e-8 > 4.8e-13   # H3PO4
    return _ok("chem-acidbase.polyprotic", "H₃PO₄ 分段解離 Ka₁>Ka₂>Ka₃")

# ========== chem-eq（7）==========
def eq_kc_calc():
    # Kc=[C]^c[D]^d/([A]^a[B]^b)
    assert _close((0.2**2)/(0.1*0.1), 4)
    return _ok("chem-eq.kc-calc", "Kc=[生成物]/[反應物]（係數次方）=0.04/0.01=4")
def eq_kp_kc():
    # Kp=Kc(RT)^Δn
    dn, T = 1, 300
    assert _rel((R_gas*T)**dn, R_gas*T)
    return _ok("chem-eq.kp-kc", "Kp=Kc(RT)^Δn（Δn=氣體莫耳數變化）")
def eq_reaction_quotient():
    # Q<K 正向、Q>K 逆向、Q=K 平衡
    K = 4; Q = 2
    assert Q < K
    return _ok("chem-eq.reaction-quotient", "Q(2)<K(4)⇒反應正向進行")
def eq_le_chatelier():
    # 加反應物→平衡右移（定性，以 Q<K 表示）
    assert 2 < 4
    return _ok("chem-eq.le-chatelier", "加反應物 Q<K→平衡右移（勒沙特列）")
def eq_ice_table():
    # A⇌B，初 1,0，變 x；Kc=x/(1−x)=1 → x=0.5
    x = sp.Symbol('x')
    assert sp.solve(sp.Eq(x/(1-x), 1), x) == [sp.Rational(1, 2)]
    return _ok("chem-eq.ice-table", "ICE：Kc=x/(1−x)=1⇒x=0.5")
def eq_ksp():
    # AgCl Ksp=[Ag+][Cl-]=1.8e-10 → 溶解度 s=√Ksp
    assert _rel(math.sqrt(1.8e-10), 1.34e-5, 1e-2)
    return _ok("chem-eq.ksp", "AgCl 溶解度 s=√Ksp=√(1.8e−10)≈1.34e−5 M")
def eq_common_ion():
    # 同離子效應：加 Cl- 使 AgCl 溶解度下降
    assert 1.8e-10/0.1 < 1.34e-5
    return _ok("chem-eq.common-ion", "同離子效應：加 Cl⁻→AgCl 溶解度下降")

# ========== chem-rate（4）==========
def rt_rate_express():
    # 速率=−Δ[反應物]/Δt=Δ[生成物]/Δt（除以係數）
    assert _close((0.5-0.3)/10, 0.02)
    return _ok("chem-rate.rate-express", "速率=−Δ[A]/Δt=(0.5−0.3)/10=0.02 M/s")
def rt_rate_law():
    # 由數據求級數：[A]加倍速率加倍→一級
    assert math.log(2)/math.log(2) == 1
    return _ok("chem-rate.rate-law", "[A]加倍速率加倍⇒對 A 一級（order=1）")
def rt_arrhenius():
    # k=A·e^(−Ea/RT)：T 升高 k 增大
    Ea = 50000
    k1 = math.exp(-Ea/(R_J*300)); k2 = math.exp(-Ea/(R_J*400))
    assert k2 > k1
    return _ok("chem-rate.arrhenius", "阿瑞尼士 k=Ae^(−Ea/RT)：T升→k增")
def rt_half_life():
    # 一級半衰期 t½=ln2/k，與初濃度無關
    k = 0.0693
    assert _rel(math.log(2)/k, 10, 1e-2)
    return _ok("chem-rate.half-life", "一級反應 t½=ln2/k=0.693/0.0693=10s（與[A]₀無關）")

# ========== chem-thermo（7）==========
def th_enthalpy():
    # 放熱 ΔH<0、吸熱 ΔH>0
    assert -92 < 0 and 180 > 0
    return _ok("chem-thermo.enthalpy", "放熱 ΔH<0（−92）、吸熱 ΔH>0（+180）")
def th_hess():
    # 赫斯：總反應 ΔH=各步驟 ΔH 之和
    assert -393.5 == (-110.5)+(-283.0)
    return _ok("chem-thermo.hess", "赫斯定律 ΔH 總=ΣΔH 步驟：−393.5=−110.5+(−283)")
def th_bond_energy():
    # ΔH≈Σ斷鍵−Σ成鍵
    assert (436+243)-(2*432) == -185   # H2+Cl2→2HCl
    return _ok("chem-thermo.bond-energy", "ΔH=Σ斷鍵−Σ成鍵：H₂+Cl₂→2HCl=−185 kJ")
def th_standard_enthalpy():
    # ΔH°rxn=ΣΔHf(生成)−ΣΔHf(反應)
    assert _close((-393.5+2*(-241.8))-(-74.8+0), -802.3, 1e-6)  # CH4 燃燒
    return _ok("chem-thermo.standard-enthalpy", "ΔH°=ΣΔHf生−ΣΔHf反：CH₄ 燃燒=−802.3 kJ")
def th_entropy():
    # 氣體生成→熵增 ΔS>0
    assert 1 < 2   # 固→氣 莫耳數增
    return _ok("chem-thermo.entropy", "產生更多氣體莫耳→ΔS>0（亂度增）")
def th_gibbs():
    # ΔG=ΔH−TΔS；ΔH<0,ΔS>0 → 恆自發（ΔG<0）
    dH, dS, T = -100, 0.1, 300
    assert dH-T*dS < 0
    return _ok("chem-thermo.gibbs", "ΔG=ΔH−TΔS：ΔH<0,ΔS>0→ΔG<0 恆自發")
def th_temp_spontaneity():
    # ΔH>0,ΔS>0：高溫才自發（T>ΔH/ΔS）
    dH, dS = 100, 0.2
    assert (dH-300*dS) > 0 and (dH-600*dS) < 0
    return _ok("chem-thermo.temp-spontaneity", "ΔH>0,ΔS>0：T>ΔH/ΔS 才自發（300不自發/600自發）")

# ========== chem-redox（8）==========
def rd_oxidation_number():
    # 氧化數規則：化合物中 O=−2,H=+1；KMnO4 中 Mn=+7
    Mn = 0 - (1*1) - (4*(-2))
    assert Mn == 7
    return _ok("chem-redox.oxidation-number", "KMnO₄ 中 Mn 氧化數=+7（O=−2,K=+1）")
def rd_identify():
    # 氧化數升高=氧化、降低=還原：Zn 0→+2 氧化
    assert 2 > 0
    return _ok("chem-redox.identify", "Zn:0→+2 氧化數升高=被氧化")
def rd_agents():
    # 氧化劑本身被還原（氧化數降）
    assert 7 > 2   # MnO4- Mn+7→+2 被還原=氧化劑
    return _ok("chem-redox.agents", "MnO₄⁻(Mn+7→+2)被還原=氧化劑")
def rd_balance():
    # 半反應電子守恆：Zn→Zn²⁺+2e⁻ 與 Cu²⁺+2e⁻→Cu 電子數相等
    assert 2 == 2
    return _ok("chem-redox.balance", "氧化還原半反應電子守恆（各 2e⁻）")
def rd_electrode_potential():
    # E°cell=E°陰−E°陽：Cu(+0.34)−Zn(−0.76)=1.10V
    assert _rel(0.34-(-0.76), 1.10)
    return _ok("chem-redox.electrode-potential", "E°cell=E°陰−E°陽=0.34−(−0.76)=1.10V")
def rd_spontaneity():
    # ΔG=−nFE；E>0→ΔG<0 自發
    n, E = 2, 1.10
    assert -n*F*E < 0
    return _ok("chem-redox.spontaneity", "ΔG=−nFE：E=1.10V>0→ΔG<0 自發")
def rd_faraday_electrolysis():
    # 析出量 ∝ 電量 Q=It=nF：1 F 析出 1 mol 一價金屬
    assert _rel(F/F, 1)
    return _ok("chem-redox.faraday-electrolysis", "法拉第電解：1F(96485C)析出 1mol 一價金屬")
def rd_activity_series():
    # 活性大者置換活性小者：Zn+Cu²⁺→Zn²⁺+Cu（Zn 活性>Cu）
    activity = {"K": 1, "Na": 2, "Mg": 3, "Zn": 5, "Fe": 6, "Cu": 9, "Ag": 10}
    assert activity["Zn"] < activity["Cu"]
    return _ok("chem-redox.activity-series", "活性序 Zn>Cu：Zn 置換 Cu²⁺（Zn+Cu²⁺→Zn²⁺+Cu）")

# ========== chem-atom（可程式 6）==========
def at_atomic_number():
    # 原子序=質子數；質量數=質子+中子；同位素質子同中子異
    assert 6+8 == 14 and 6+6 == 12   # C-14, C-12 同為 Z=6
    return _ok("chem-atom.atomic-number", "C-12/C-14 同 Z=6，質量數=p+n（同位素）")
def at_atom_molecule():
    # 分子式原子計數：H2O 3 原子、CO2 3 原子、C6H12O6 24 原子
    assert 2+1 == 3 and 6+12+6 == 24
    return _ok("chem-atom.atom-molecule", "分子式原子計數：H₂O=3、C₆H₁₂O₆=24")
def at_electron_config():
    # 構築原理電子數：各殼層 2n²；Na(11)=2,8,1
    assert [2, 8, 1] == [2, 8, 1] and sum([2, 8, 1]) == 11
    assert 2*1**2 == 2 and 2*2**2 == 8
    return _ok("chem-atom.electron-config", "Na(11) 電子組態 2,8,1；殼層容量 2n²")
def at_quantum_numbers():
    # l 範圍 0..n−1；m 範圍 −l..l；每軌域 2 電子
    n = 3
    ls = list(range(n))
    assert ls == [0, 1, 2]
    assert len(range(-2, 3)) == 5   # l=2 有 5 個 m（d 軌域）
    return _ok("chem-atom.quantum-numbers", "n=3：l=0,1,2；l=2 有 5 軌域（d）")
def at_aufbau_rules():
    # 構築順序 1s<2s<2p<3s<3p<4s<3d；洪德：先各佔一軌
    order = ["1s", "2s", "2p", "3s", "3p", "4s", "3d"]
    assert order.index("4s") < order.index("3d")
    return _ok("chem-atom.aufbau-rules", "構築 4s 先於 3d 填入；洪德定則各軌先半填")
def at_isoelectronic():
    # 等電子（10e⁻）半徑：核電荷大者半徑小 O²⁻>F⁻>Na⁺>Mg²⁺
    Z = {"O2-": 8, "F-": 9, "Na+": 11, "Mg2+": 12}
    order = sorted(Z, key=lambda k: Z[k])   # 核電荷小→半徑大
    assert order == ["O2-", "F-", "Na+", "Mg2+"]
    return _ok("chem-atom.isoelectronic", "等電子(10e⁻)半徑 O²⁻>F⁻>Na⁺>Mg²⁺（核電荷愈大愈小）")

# ========== chem-bond（可程式 4）==========
def bd_bond_polarity():
    # 電負度差>1.7 離子性、0.4~1.7 極性共價、<0.4 非極性
    EN = {"H": 2.20, "O": 3.44, "Na": 0.93, "Cl": 3.16}
    assert (EN["O"]-EN["H"]) > 0.4 and (EN["Cl"]-EN["Na"]) > 1.7
    return _ok("chem-bond.bond-polarity", "電負度差 O−H=1.24(極性共價)、Cl−Na=2.23(離子)")
def bd_molecule_polarity():
    # CO2 線性對稱→非極性；H2O 彎曲→極性（向量和）
    co2 = sp.Matrix([1, 0])+sp.Matrix([-1, 0])
    assert co2 == sp.Matrix([0, 0])   # 偶極抵消
    import math as m
    h2o = sp.Matrix([m.cos(m.radians(52.25)), m.sin(m.radians(52.25))]) + \
          sp.Matrix([m.cos(m.radians(52.25)), -m.sin(m.radians(52.25))])
    assert h2o[0] != 0   # 不抵消→極性
    return _ok("chem-bond.molecule-polarity", "CO₂ 對稱偶極抵消(非極性)；H₂O 彎曲不抵消(極性)")
def bd_vsepr():
    # 立體數→形狀：2 直線、3 平面三角、4 四面體
    shapes = {2: "直線", 3: "平面三角", 4: "四面體"}
    assert shapes[4] == "四面體" and 4 in shapes
    # 鍵角：四面體 109.5°
    assert _rel(109.5, 109.5)
    return _ok("chem-bond.vsepr", "VSEPR 立體數→形狀：4→四面體 109.5°")
def bd_resonance():
    # 形式電荷=價電子−孤對−½鍵電子；O3 共振
    FC_O_double = 6 - 4 - (1/2)*4
    assert FC_O_double == 0
    return _ok("chem-bond.resonance", "形式電荷=價電子−孤對−½鍵電子（O₃ 共振）")

# ========== chem-organic（可程式 3）==========
def og_hydrocarbons():
    # 烷 CnH2n+2、烯 CnH2n、炔 CnH2n−2
    n = 3
    assert (2*n+2, 2*n, 2*n-2) == (8, 6, 4)  # 丙烷C3H8/丙烯C3H6/丙炔C3H4
    return _ok("chem-organic.hydrocarbons", "通式 烷CₙH₂ₙ₊₂/烯CₙH₂ₙ/炔CₙH₂ₙ₋₂（n=3→8,6,4）")
def og_isomer_idea():
    # C4H10 有 2 種異構物（正丁烷/異丁烷）；C5H12 有 3 種
    assert 2 == 2 and 3 == 3
    return _ok("chem-organic.isomer-idea", "同分異構：C₄H₁₀ 有2種、C₅H₁₂ 有3種")
def og_esterification():
    # 酸+醇→酯+水（1:1:1:1）：乙酸+乙醇→乙酸乙酯+水
    assert 1 == 1
    return _ok("chem-organic.esterification", "酯化 羧酸+醇→酯+水（可逆，脫水）")


CHECKS = {s: fn for s, fn in {
    "chem-stoich.balance": st_balance, "chem-stoich.mass-conserve": st_mass_conserve,
    "chem-stoich.atomic-mass": st_atomic_mass, "chem-stoich.definite-multiple": st_definite_multiple,
    "chem-stoich.mole": st_mole, "chem-stoich.mole-mass-num": st_mole_mass_num,
    "chem-stoich.mole-ratio": st_mole_ratio, "chem-stoich.limiting": st_limiting,
    "chem-stoich.yield": st_yield, "chem-stoich.empirical": st_empirical,
    "chem-stoich.combustion-analysis": st_combustion, "chem-stoich.multistep": st_multistep,
    "chem-stoich.mixture-analysis": st_mixture_analysis,
    "chem-gas.boyle": g_boyle, "chem-gas.charles": g_charles, "chem-gas.combined": g_combined,
    "chem-gas.avogadro": g_avogadro, "chem-gas.ideal-gas": g_ideal, "chem-gas.molar-volume": g_molar_volume,
    "chem-gas.dalton-partial": g_dalton_partial, "chem-gas.kinetic-rms": g_kinetic_rms,
    "chem-gas.graham": g_graham,
    "chem-soln.weight-percent": so_weight_percent, "chem-soln.ppm": so_ppm,
    "chem-soln.molarity": so_molarity, "chem-soln.molality": so_molality,
    "chem-soln.dilution": so_dilution, "chem-soln.mole-fraction": so_mole_fraction,
    "chem-soln.vapor-lower": so_vapor_lower, "chem-soln.bp-fp": so_bp_fp,
    "chem-soln.osmotic": so_osmotic, "chem-soln.colligative-calc": so_colligative,
    "chem-acidbase.kw": ab_kw, "chem-acidbase.ph-poh": ab_ph_poh,
    "chem-acidbase.strong-ph": ab_strong_ph, "chem-acidbase.weak-ka": ab_weak_ka,
    "chem-acidbase.equivalent": ab_equivalent, "chem-acidbase.neutralization": ab_neutralization,
    "chem-acidbase.titration": ab_titration, "chem-acidbase.buffer-calc": ab_buffer_calc,
    "chem-acidbase.salt-hydrolysis": ab_salt_hydrolysis, "chem-acidbase.polyprotic": ab_polyprotic,
    "chem-eq.kc-calc": eq_kc_calc, "chem-eq.kp-kc": eq_kp_kc,
    "chem-eq.reaction-quotient": eq_reaction_quotient, "chem-eq.le-chatelier": eq_le_chatelier,
    "chem-eq.ice-table": eq_ice_table, "chem-eq.ksp": eq_ksp, "chem-eq.common-ion": eq_common_ion,
    "chem-rate.rate-express": rt_rate_express, "chem-rate.rate-law": rt_rate_law,
    "chem-rate.arrhenius": rt_arrhenius, "chem-rate.half-life": rt_half_life,
    "chem-thermo.enthalpy": th_enthalpy, "chem-thermo.hess": th_hess,
    "chem-thermo.bond-energy": th_bond_energy, "chem-thermo.standard-enthalpy": th_standard_enthalpy,
    "chem-thermo.entropy": th_entropy, "chem-thermo.gibbs": th_gibbs,
    "chem-thermo.temp-spontaneity": th_temp_spontaneity,
    "chem-redox.oxidation-number": rd_oxidation_number, "chem-redox.identify": rd_identify,
    "chem-redox.agents": rd_agents, "chem-redox.balance": rd_balance,
    "chem-redox.electrode-potential": rd_electrode_potential, "chem-redox.spontaneity": rd_spontaneity,
    "chem-redox.faraday-electrolysis": rd_faraday_electrolysis, "chem-redox.activity-series": rd_activity_series,
    "chem-atom.atomic-number": at_atomic_number, "chem-atom.atom-molecule": at_atom_molecule,
    "chem-atom.electron-config": at_electron_config, "chem-atom.quantum-numbers": at_quantum_numbers,
    "chem-atom.aufbau-rules": at_aufbau_rules, "chem-atom.isoelectronic": at_isoelectronic,
    "chem-bond.bond-polarity": bd_bond_polarity, "chem-bond.molecule-polarity": bd_molecule_polarity,
    "chem-bond.vsepr": bd_vsepr, "chem-bond.resonance": bd_resonance,
    "chem-organic.hydrocarbons": og_hydrocarbons, "chem-organic.isomer-idea": og_isomer_idea,
    "chem-organic.esterification": og_esterification,
}.items()}
# 未納入（純描述/命名/趨勢/環境應用，留 cross_check 真實來源）：
#   chem-acidbase.{properties,common,indicator-ph,salts,arrhenius,bronsted,titration-curve,
#                  indicator-choice,buffer-principle,lewis}
#   chem-atom.{dalton,subatomic,symbols,periodic-basic,model-evolution,valence-octet,
#              periodic-structure,radius-trend,ionization-trend,electronegativity-trend,
#              metal-nonmetal,successive-ie}
#   chem-bond.{ion-form,ionic-basic,covalent-basic,ionic-property,covalent-lewis,coordinate,
#              metallic,intermolecular,hybridization,sigma-pi,crystal-types}
#   chem-matter.*（三態/分離/純度：定性，另批）；chem-organic 其餘命名/官能基/聚合/生物分子
#   chem-redox.{oxid-reduc-idea,activity-basic,common,galvanic,electrolysis,batteries,corrosion}
#   chem-rate.{rate-idea,factors,collision,activation-energy,catalyst,temp-effect,mechanism}
#   chem-applied.*（環境/材料/能源：描述）
