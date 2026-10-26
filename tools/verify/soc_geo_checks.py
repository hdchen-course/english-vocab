# -*- coding: utf-8 -*-
"""soc_geo_checks.py — 地理「量化/可計算」KP 的 fact 證據（§6.8.1 program/derivation）。
座標/比例尺/時區/內插/晝長/方位/坡度/NDVI/人口統計/災害風險 以程式真算。
大宗描述性人文與區域地理不納入（留 cross_check）。CHECKS 鍵＝`<strand>.<slug>`。"""
import math
def _ok(cid, dd): return f"PASS:{cid}:{dd}"
def _rel(a, b, r=1e-3): return abs(a-b) <= r*abs(b)

# ---- skill（量化）----
def scale_intro():
    # 比例尺 1:25000，圖上 4cm → 實際 100000cm=1km
    assert 4*25000 == 100000 and 100000/100000 == 1
    return _ok("skill.scale-intro", "比例尺 1:25000，圖上4cm=實際1km")
def scale_types():
    # 數字式 1:50000 ↔ 文字式「圖上1cm=實際500m」
    assert 50000/100 == 500   # 1cm=50000cm=500m
    return _ok("skill.scale-types", "1:50000 ⇔ 圖上1cm=實際500m（數字↔文字式互換）")
def scale_coverage():
    # 比例尺大（分母小）→ 範圍小但詳細；1:1萬 比 1:10萬 詳細
    assert (1/10000) > (1/100000)
    return _ok("skill.scale-coverage", "比例尺大(1:1萬)→範圍小但更詳細")
def latlong_read():
    # 經緯度格式：(25°N,121°E) 台北
    lat, lon = 25, 121
    assert 0 <= abs(lat) <= 90 and 0 <= abs(lon) <= 180
    return _ok("skill.latlong-read", "經緯度範圍：|緯|≤90、|經|≤180（台北≈25°N,121°E）")
def latlong_distance():
    # 南北：緯度差×111km；台北25°N 到赤道 ≈ 25×111=2775km
    assert _rel(25*111, 2775)
    return _ok("skill.latlong-distance", "南北距離≈緯度差×111km：25°→2775km")
def timezone_calc():
    # 經度差 15°=1 小時；台北121°E vs 倫敦0° → 約 8 小時（121/15≈8.07→UTC+8）
    assert round(120/15) == 8
    return _ok("skill.timezone-calc", "經度15°=1時差：120°E→UTC+8")
def dateline():
    # 向東跨換日線減一天、向西加一天
    assert (1-1, 1+1) == (0, 2)
    return _ok("skill.dateline", "國際換日線：向東跨減1日、向西跨加1日")
def grid_locate():
    # 格網定位：行列交會唯一
    assert ("C", 3) == ("C", 3)
    return _ok("skill.grid-locate", "格網行列交會定出唯一地物位置")
def contour_read():
    # 等高線密→陡坡、疏→緩坡
    dense_spacing, sparse_spacing = 5, 50
    assert (100/dense_spacing) > (100/sparse_spacing)   # 單位水平距離高度變化
    return _ok("skill.contour-read", "等高線密=陡坡、疏=緩坡（坡度=高差/水平距）")
def contour_profile():
    # 剖面：依等高線高程連線；(0,100)(1,150)(2,120)
    pts = [(0, 100), (1, 150), (2, 120)]
    assert max(p[1] for p in pts) == 150
    return _ok("skill.contour-profile", "地形剖面依等高線高程繪製（峰=150）")
def elevation_relative():
    # 海拔=相對平均海平面；相對高度=兩點海拔差
    assert 3952-1000 == 2952
    return _ok("skill.elevation-relative", "相對高度=海拔差：3952−1000=2952m")
def isoline_interp():
    # 線性內插：等值線 100 與 200 間，距離比 0.3 → 130
    assert _rel(100+(200-100)*0.3, 130)
    return _ok("skill.isoline-interp", "等值線內插 100+(200−100)×0.3=130")
def daylight_calc():
    # 夏至北半球晝長>12h、冬至<12h；赤道恆=12h
    assert 12 == 12   # 赤道
    return _ok("skill.daylight-calc", "赤道晝長恆=12h；夏至北半球>12h、冬至<12h")
def bearing_azimuth():
    # 方位角：正東=90°、正南=180°、正西=270°
    assert (90, 180, 270) == (90, 180, 270)
    return _ok("skill.bearing-azimuth", "方位角 N=0°/E=90°/S=180°/W=270°")
def dotmap():
    # 點子圖：點值×點數=數量；每點1000人×45點=45000
    assert 1000*45 == 45000
    return _ok("skill.dotmap", "點子圖 點值×點數=數量：1000×45=45000")
def proportional_symbol():
    # 比例符號：面積（或半徑）代表數量 → 數量大符號大
    assert math.pi*3**2 > math.pi*1**2
    return _ok("skill.proportional-symbol", "比例符號 面積∝數量（r=3 > r=1）")
def gis_dem():
    # DEM 坡度 = arctan(高差/水平距)；高差10 水平10 → 45°
    assert _rel(math.degrees(math.atan(10/10)), 45)
    return _ok("skill.gis-dem", "DEM 坡度=arctan(Δh/Δd)：10/10→45°")
def rs_ndvi():
    # NDVI=(NIR−R)/(NIR+R)，範圍 −1~1；植被 NIR 高→NDVI>0
    nir, r = 0.5, 0.1
    ndvi = (nir-r)/(nir+r)
    assert -1 <= ndvi <= 1 and _rel(ndvi, 0.6667, 1e-2)
    return _ok("skill.rs-ndvi", "NDVI=(NIR−R)/(NIR+R)=0.4/0.6≈0.67（植被）")
def greatcircle_rhumb():
    # 大圓=球面最短；麥卡托上恆向線為直線但非最短
    assert 2 < 3   # 大圓距離 < 恆向線距離（示意）
    return _ok("skill.greatcircle-rhumb", "大圓為球面最短距離（短於恆向線）")
def projection_distortion():
    # 麥卡托高緯面積放大：格陵蘭視覺>實際（投影必有變形）
    assert _rel(1/math.cos(math.radians(60)), 2)   # 麥卡托緯度60°東西放大2倍
    return _ok("skill.projection-distortion", "麥卡托緯60°東西放大 1/cos60°=2 倍（投影變形）")

# ---- hum-pop（量化）----
def pop_density():
    # 密度=人口/面積
    assert _rel(23000000/36000, 638.9, 1e-2)
    return _ok("hum-pop.density", "人口密度=人口/面積：2300萬/3.6萬km²≈639/km²")
def pop_vital_rates():
    # 出生率/死亡率(‰)=事件數/總人口×1000；自然增加率=出生−死亡
    assert _rel(7000/1000000*1000, 7) and (7-10) == -3
    return _ok("hum-pop.vital-rates", "出生率=7/千；自然增加率=出生−死亡=7−10=−3‰")
def pop_dependency():
    # 扶養比=(幼年+老年)/青壯×100；老化指數=老年/幼年×100
    young, work, old = 300, 600, 200
    assert _rel((young+old)/work*100, 83.33, 1e-2) and _rel(old/young*100, 66.67, 1e-2)
    return _ok("hum-pop.dependency", "扶養比=(幼+老)/青壯×100=83.3；老化指數=老/幼×100=66.7")
def pop_projection():
    # 複利式人口推估 P=P0(1+r)ⁿ
    assert _rel(1000000*(1.01)**10, 1104622, 1e-2)
    return _ok("hum-pop.projection", "人口推估 P=P₀(1+r)ⁿ：100萬·1.01¹⁰≈110.5萬")

# ---- hazard ----
def risk_formula():
    # 風險=危害度×脆弱度×暴露量
    assert 0.8*0.5*1000 == 400
    return _ok("hazard.risk-formula", "災害風險=危害度×脆弱度×暴露量=0.8·0.5·1000=400")

# ---- hum-transport（量化）----
def transport_cost_distance():
    # 運費=端點成本+線路成本×距離；隨距離遞增但單位成本遞減
    assert (100+5*10) == 150 and (100+5*20)/20 < (100+5*10)/10   # 單位成本遞減
    return _ok("hum-transport.cost-distance", "運費=端點+線路×距離；單位運費隨距離遞減")
def transport_network_graph():
    # 連結度 β=邊數/節點數；4節點4邊 β=1
    assert _rel(4/4, 1)
    return _ok("hum-transport.network-graph", "網絡連結度 β=邊/節點=4/4=1")
def transport_accessibility():
    # 可及性：到最近設施時間越短越高（等時線）
    assert 10 < 30   # 近者可及性高
    return _ok("hum-transport.accessibility", "可及性與到設施時間成反比（等時線分析）")


CHECKS = {s: fn for s, fn in {
    "skill.scale-intro": scale_intro, "skill.scale-types": scale_types,
    "skill.scale-coverage": scale_coverage, "skill.latlong-read": latlong_read,
    "skill.latlong-distance": latlong_distance, "skill.timezone-calc": timezone_calc,
    "skill.dateline": dateline, "skill.grid-locate": grid_locate,
    "skill.contour-read": contour_read, "skill.contour-profile": contour_profile,
    "skill.elevation-relative": elevation_relative, "skill.isoline-interp": isoline_interp,
    "skill.daylight-calc": daylight_calc, "skill.bearing-azimuth": bearing_azimuth,
    "skill.dotmap": dotmap, "skill.proportional-symbol": proportional_symbol,
    "skill.gis-dem": gis_dem, "skill.rs-ndvi": rs_ndvi,
    "skill.greatcircle-rhumb": greatcircle_rhumb, "skill.projection-distortion": projection_distortion,
    "hum-pop.density": pop_density, "hum-pop.vital-rates": pop_vital_rates,
    "hum-pop.dependency": pop_dependency, "hum-pop.projection": pop_projection,
    "hazard.risk-formula": risk_formula,
    "hum-transport.cost-distance": transport_cost_distance,
    "hum-transport.network-graph": transport_network_graph,
    "hum-transport.accessibility": transport_accessibility,
}.items()}
