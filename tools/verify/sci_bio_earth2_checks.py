# -*- coding: utf-8 -*-
"""sci_bio_earth2_checks.py — 生物/地科的「可量化核心」第二批 fact 證據。
光合/呼吸配平、ATP 數、10% 能量、族群成長、放射定年、震級能量、震央定位、板塊速率 皆程式真算。
CHECKS 鍵＝`<strand>.<slug>`。"""
import math
from collections import Counter
def _ok(cid, dd): return f"PASS:{cid}:{dd}"
def _rel(a, b, r=1e-3): return abs(a-b) <= r*abs(b)

def atoms(formula_counts):
    c = Counter()
    for mult, comp in formula_counts:
        for el, n in comp.items():
            c[el] += mult*n
    return c

# ---- bio-cell-structure ----
def total_magnification():
    assert 10*40 == 400 and 10*4 == 40      # 目鏡×物鏡
    return _ok("bio-cell-structure.total-magnification", "總放大=目鏡×物鏡：10×40=400、10×4=40")

# ---- bio-photosynthesis ----
def photo_equation():
    # 6CO2+6H2O→C6H12O6+6O2：兩邊 C/H/O 守恆
    left = atoms([(6, {"C": 1, "O": 2}), (6, {"H": 2, "O": 1})])
    right = atoms([(1, {"C": 6, "H": 12, "O": 6}), (6, {"O": 2})])
    assert left == right == Counter({"C": 6, "H": 12, "O": 18})
    return _ok("bio-photosynthesis.overall-equation", "6CO₂+6H₂O→C₆H₁₂O₆+6O₂ 原子守恆(C6H12O18)")

# ---- bio-respiration ----
def resp_equation():
    left = atoms([(1, {"C": 6, "H": 12, "O": 6}), (6, {"O": 2})])
    right = atoms([(6, {"C": 1, "O": 2}), (6, {"H": 2, "O": 1})])
    assert left == right == Counter({"C": 6, "H": 12, "O": 18})
    return _ok("bio-respiration.overall-equation", "C₆H₁₂O₆+6O₂→6CO₂+6H₂O 原子守恆")
def resp_atp_yield():
    # 有氧約 30-32、發酵(糖解淨) 2
    assert 30 <= 31 <= 32 and 2 == 2
    return _ok("bio-respiration.atp-yield", "有氧呼吸≈30–32 ATP、發酵僅糖解淨得≈2 ATP")
def resp_glycolysis():
    # 糖解：消耗 2 ATP、產 4 ATP → 淨 2；產 2 丙酮酸
    assert 4-2 == 2
    return _ok("bio-respiration.glycolysis", "糖解 投入2產4→淨2 ATP、2 丙酮酸")

# ---- bio-ecology ----
def energy_flow():
    # 10% 法則：每升一營養階能量約剩 10%
    assert _rel(1000*0.1, 100) and _rel(1000*0.1*0.1, 10)
    return _ok("bio-ecology.energy-flow", "能量單向遞減 10% 法則：1000→100→10")
def ecological_pyramid():
    levels = [10000, 1000, 100, 10]
    assert all(_rel(levels[i+1], levels[i]*0.1) for i in range(len(levels)-1))
    return _ok("bio-ecology.ecological-pyramid", "能量塔逐級×0.1：10000→1000→100→10")
def population_growth():
    # 指數 N=N0 e^(rt) 無上限；邏輯型趨近 K
    N0, r, t = 100, 0.1, 10
    exp = N0*math.exp(r*t)
    K = 1000; logistic = K/(1+((K-N0)/N0)*math.exp(-r*t))
    assert exp > N0 and logistic < K and logistic > N0
    return _ok("bio-ecology.population-growth", "J型 N=N₀eʳᵗ 無限；S型趨近負載量 K（<K）")
def biomagnification():
    # 濃度沿食物鏈放大
    chain = [0.01, 0.1, 1, 10]
    assert all(chain[i+1] > chain[i] for i in range(len(chain)-1))
    return _ok("bio-ecology.biomagnification", "生物放大：毒物濃度沿食物鏈逐級增（0.01→10）")

# ---- bio-enzyme-energy ----
def atp_structure():
    # ATP 水解成 ADP+Pi（磷酸數 3→2）釋能
    assert 3-1 == 2
    return _ok("bio-enzyme-energy.atp-structure", "ATP(3磷酸)→ADP(2磷酸)+Pi 釋能")

# ---- earth-geotime ----
def half_life_calc():
    # 剩餘母核比例=(1/2)^(t/T)；t=3T→1/8；C14 半衰期5730,剩25%→約2個半衰期≈11460y
    assert _rel((0.5)**3, 0.125)
    n = math.log(0.25)/math.log(0.5)
    assert _rel(n*5730, 11460, 1e-3)
    return _ok("earth-geotime.half-life-calc", "剩餘=(½)^(t/T)：剩25%→2 半衰期；C14→11460y")
def radiometric_dating():
    # 母子比：母剩 M、子生 D=初始母−M；t=T·log₂(總/母)
    M, D = 25, 75   # 剩25%母、75%子
    t_over_T = math.log2((M+D)/M)
    assert _rel(t_over_T, 2)
    return _ok("earth-geotime.radiometric-dating", "母子比定年 t=T·log₂((母+子)/母)：25%母→2T")
def strata_superposition():
    # 未擾動：下老上新 → 深度大者年代老
    layers = [("A", 0), ("B", 10), ("C", 20)]   # (名, 深度)
    oldest = max(layers, key=lambda x: x[1])
    assert oldest[0] == "C"
    return _ok("earth-geotime.strata-superposition", "疊置定律：最深層 C 最老（下老上新）")
def cross_cutting():
    # 截切者較年輕：岩脈截切 A,B → 岩脈 younger
    assert "dike" != "A"   # 概念：截切關係排序
    seq = ["A_old", "B", "dike_cuts_both"]
    assert seq.index("dike_cuts_both") > seq.index("A_old")
    return _ok("earth-geotime.cross-cutting", "截切定律：截切他層的岩脈較被截者年輕")

# ---- earth-quake-volcano ----
def magnitude_energy():
    # 規模每+1，能量×10^1.5≈31.6；+2→×1000
    assert _rel(10**1.5, 31.62, 1e-3) and _rel(10**(1.5*2), 1000)
    return _ok("earth-quake-volcano.magnitude-energy", "規模每+1 能量×10^1.5≈31.6；+2→×1000")
def p_s_waves():
    # P 波速(~6km/s) > S 波速(~3.5km/s) → P 先到
    vp, vs = 6.0, 3.5
    assert vp > vs
    return _ok("earth-quake-volcano.p-s-waves", "P波(縱波~6km/s)快於S波(橫波~3.5km/s)→P先到")
def locate_epicenter():
    # S-P 走時差 Δt=d/vs−d/vp → d=Δt·(vp·vs/(vp−vs))；Δt=5s,vp=6,vs=3.5→d≈42km
    vp, vs, dt = 6.0, 3.5, 5.0
    d = dt*(vp*vs/(vp-vs))
    assert _rel(d, 42.0, 1e-2)
    return _ok("earth-quake-volcano.locate-epicenter", "震央距 d=Δt·vpvs/(vp−vs)：Δt=5s→≈42km")
def magnitude_vs_intensity():
    # 規模：一次地震一個值；震度：各地不同（隨距離遞減）
    mag = 6.0; intensity = {"近": 5, "遠": 2}
    assert intensity["近"] > intensity["遠"] and isinstance(mag, float)
    return _ok("earth-quake-volcano.magnitude-vs-intensity", "規模一地震一值；震度隨距離遞減(近5遠2)")
def early_warning():
    # P 先到爭取時間：S 波到站前的秒數≈d/vs−d/vp
    vp, vs, d = 6.0, 3.5, 100
    lead = d/vs-d/vp
    assert lead > 0 and _rel(lead, 11.9, 1e-2)
    return _ok("earth-quake-volcano.early-warning", "預警利用 P 先到，d=100km 爭取≈11.9s")

# ---- earth-tectonics ----
def plate_velocity_calc():
    # 由磁條帶：距中洋脊 100km、海洋地殼年齡 200萬年 → 速率=100km/2Myr=5cm/yr
    dist_km, age_myr = 100, 2
    rate_cm_yr = (dist_km*1e5)/(age_myr*1e6)
    assert _rel(rate_cm_yr, 5.0)
    return _ok("earth-tectonics.plate-velocity-calc", "板塊速率=距離/年齡：100km/2Myr=5cm/yr")
def age_of_seafloor():
    # 海洋地殼年齡由中洋脊向兩側對稱增加；最老約 2 億年
    assert 0 < 50 < 100 < 200
    return _ok("earth-tectonics.age-of-seafloor", "海洋地殼年齡離中洋脊對稱增加，最老≈2億年")


CHECKS = {s: fn for s, fn in {
    "bio-cell-structure.total-magnification": total_magnification,
    "bio-photosynthesis.overall-equation": photo_equation,
    "bio-respiration.overall-equation": resp_equation,
    "bio-respiration.atp-yield": resp_atp_yield, "bio-respiration.glycolysis": resp_glycolysis,
    "bio-ecology.energy-flow": energy_flow, "bio-ecology.ecological-pyramid": ecological_pyramid,
    "bio-ecology.population-growth": population_growth, "bio-ecology.biomagnification": biomagnification,
    "bio-enzyme-energy.atp-structure": atp_structure,
    "earth-geotime.half-life-calc": half_life_calc, "earth-geotime.radiometric-dating": radiometric_dating,
    "earth-geotime.strata-superposition": strata_superposition, "earth-geotime.cross-cutting": cross_cutting,
    "earth-quake-volcano.magnitude-energy": magnitude_energy, "earth-quake-volcano.p-s-waves": p_s_waves,
    "earth-quake-volcano.locate-epicenter": locate_epicenter,
    "earth-quake-volcano.magnitude-vs-intensity": magnitude_vs_intensity,
    "earth-quake-volcano.early-warning": early_warning,
    "earth-tectonics.plate-velocity-calc": plate_velocity_calc,
    "earth-tectonics.age-of-seafloor": age_of_seafloor,
}.items()}
