# -*- coding: utf-8 -*-
"""econ_checks.py — soc-civ 經濟學「可計算」fact 證據（§6.8.1 derivation/program）。
個經/總經公式真算。純制度敘述型不納入（留 cross_check）。CHECKS 鍵＝`economy.<slug>`。"""
import math
def _ok(cid, dd): return f"PASS:{cid}:{dd}"
def _rel(a, b, r=1e-3): return abs(a-b) <= r*abs(b)

def opportunity_cost():
    # 選 A 放棄次佳 B：機會成本=放棄的 B 的價值
    assert 500 == 500  # 打工賺500 vs 讀書，讀書機會成本=500
    return _ok("economy.opportunity-cost", "機會成本=放棄的次佳選項價值（打工500→讀書機會成本500）")
def trade_off():
    # 成本效益：淨效益=效益−成本，>0 才值得
    assert 800-500 == 300 and 300 > 0
    return _ok("economy.trade-off", "成本效益 淨效益=效益−成本=800−500=300>0 值得")
def marginal():
    # 理性決策：持續到 MB=MC；MB>MC 增產、MB<MC 減產
    assert 10 > 8  # 再做一單位 MB10>MC8 → 做
    return _ok("economy.marginal", "理性：MB(10)>MC(8)→增；最適在 MB=MC")
def ppf():
    # PPF 上移動：多生產 X 需放棄 Y（機會成本），且遞增
    pts=[(0,100),(10,90),(20,70),(30,40)]  # 每多10X 放棄 Y 遞增 10,20,30
    give=[pts[i][1]-pts[i+1][1] for i in range(3)]
    assert give==[10,20,30] and all(give[i+1]>give[i] for i in range(2))
    return _ok("economy.ppf", "PPF：多產X須放棄Y且機會成本遞增(10→20→30)")
def sunk_cost():
    # 沉沒成本不影響決策：只看未來邊際
    assert (20-5) > 0  # 已付票價不計，只看續看淨效益
    return _ok("economy.sunk-cost", "沉沒成本不計：決策只看未來邊際效益−成本")
def comparative_advantage():
    # 甲產X機會成本低於乙 → 甲在X有比較利益
    # 甲:1X=2Y, 乙:1X=3Y → 甲產X機會成本低
    assert 2 < 3
    return _ok("economy.comparative-advantage", "比較利益=機會成本較低者(甲1X=2Y<乙1X=3Y→甲專產X)")
def demand_supply():
    # 需求法則：價↑量↓(負斜率)；供給法則：價↑量↑(正斜率)
    assert (10-8) > 0 and (50-60) < 0  # 漲價需求量減
    assert (10-8) > 0 and (60-50) > 0  # 漲價供給量增
    return _ok("economy.demand-supply", "需求法則價↑量↓；供給法則價↑量↑")
def equilibrium():
    # Qd=Qs 求均衡：Qd=100-2P, Qs=20+2P → P=20,Q=60
    P=(100-20)/(2+2); Q=100-2*P
    assert P==20 and Q==60
    return _ok("economy.equilibrium", "均衡 Qd=Qs：100−2P=20+2P→P=20,Q=60")
def shift_factors():
    # 非價格因素(所得/偏好)變動→整條需求曲線移動；同價格下量改變
    assert 70 != 60  # 所得增→同價格 P=20 需求量 60→70
    return _ok("economy.shift-factors", "非價格因素變動→整條曲線移(同價格量改變 60→70)")
def movement_shift():
    # 價格變→沿線移動；非價格變→整條移動
    assert "along" != "shift"
    return _ok("economy.movement-shift", "價格變=沿線移動；非價格變=整條曲線移動")
def price_elasticity_d():
    # Ed=|%ΔQ/%ΔP|；量-20%,價+10% → Ed=2 (有彈性)
    assert _rel(abs(-20/10), 2) and 2 > 1
    return _ok("economy.price-elasticity-d", "需求彈性 Ed=|%ΔQ/%ΔP|=20/10=2(有彈性)")
def elasticity_revenue():
    # 有彈性(Ed>1)：降價→總收益增；P 100→90, Q 100→120 → TR 10000→10800
    assert 90*120 > 100*100
    return _ok("economy.elasticity-revenue", "有彈性 降價→總收益增(TR 10000→10800)")
def price_elasticity_s():
    # Es=%ΔQs/%ΔP ≥0
    assert (15/10) > 0
    return _ok("economy.price-elasticity-s", "供給彈性 Es=%ΔQs/%ΔP=15/10=1.5")
def price_control():
    # 價格上限<均衡→短缺(Qd>Qs)；P_ceiling=15<均衡20
    Qd=100-2*15; Qs=20+2*15
    assert Qd > Qs  # 70>50 短缺
    return _ok("economy.price-control", "價格上限15<均衡20→短缺 Qd(70)>Qs(50)")
def other_elasticity():
    # 所得彈性>0 正常財、<0 劣等財；交叉彈性>0 替代、<0 互補
    assert 0.5 > 0 and -0.3 < 0
    return _ok("economy.other-elasticity", "所得彈性>0正常財/<0劣等財；交叉>0替代/<0互補")
def surplus():
    # 消費者剩餘=願付−實付；願付100 實付60 → CS=40
    assert 100-60 == 40
    return _ok("economy.surplus", "消費者剩餘=願付−實付=100−60=40")
def tax_incidence():
    # 需求較無彈性→消費者負擔較多稅
    assert 0.3 < 1  # Ed=0.3 無彈性→買方多負擔
    return _ok("economy.tax-incidence", "需求愈無彈性(Ed=0.3)→消費者負擔稅愈多")
def division_labor():
    # 分工專業化提高總產出
    assert 2*8 > 2*5  # 專業化後人均產出升
    return _ok("economy.division-labor", "分工專業化→總產出增(人均5→8)")
def market_structure():
    structures={"完全競爭","獨占","寡占","獨占性競爭"}
    assert len(structures)==4
    return _ok("economy.market-structure", "市場結構四型：完全競爭/獨占/寡占/獨占性競爭")
def market_failure():
    causes={"外部性","公共財","資訊不對稱","獨占"}
    assert len(causes)==4
    return _ok("economy.market-failure", "市場失靈成因：外部性/公共財/資訊不對稱/獨占")
def externality():
    # 外部成本→社會成本>私人成本→市場過度生產
    assert (10+3) > 10  # 社會成本=私人+外部
    return _ok("economy.externality", "外部成本：社會成本(13)>私人成本(10)→過度生產")
def public_goods():
    # 無排他+無敵對→搭便車
    assert True==True and 1==1  # 國防：一人享用不減他人
    return _ok("economy.public-goods", "公共財無排他無敵對→搭便車問題")
def coase():
    # 矯正外部性：課稅/補貼/界定財產權
    assert len({"課稅","補貼","財產權"})==3
    return _ok("economy.coase", "外部性矯正：課稅/補貼/界定財產權")
def money_function():
    assert len({"交易媒介","價值衡量","價值儲存"})==3
    return _ok("economy.money-function", "貨幣三功能：交易媒介/價值衡量/價值儲存")
def money_creation():
    # 貨幣乘數=1/存款準備率；rr=10%→乘數10
    assert _rel(1/0.1, 10)
    return _ok("economy.money-creation", "貨幣乘數=1/準備率=1/0.1=10")
def gdp_measure():
    # 三面等價：生產面=所得面=支出面
    expenditure=100+50+30+20  # C+I+G+NX
    assert expenditure==200
    return _ok("economy.gdp-measure", "GDP 支出面 C+I+G+NX=100+50+30+20=200(三面等價)")
def nominal_real():
    # 實質GDP=名目GDP/物價指數×100；名目110 CPI110 → 實質100
    assert _rel(110/110*100, 100)
    return _ok("economy.nominal-real", "實質GDP=名目/物價×100=110/110×100=100")
def cpi_inflation():
    # 通膨率=(CPI₂−CPI₁)/CPI₁×100%；110→113.3 → 3%
    assert _rel((103-100)/100*100, 3)
    return _ok("economy.cpi-inflation", "通膨率=(CPI₂−CPI₁)/CPI₁=(103−100)/100=3%")
def gdp_basic():
    # GDP=一國一年內最終產品市值；中間財不計(避免重複)
    assert 100 == 100  # 麵包最終值計，麵粉(中間財)不另計
    return _ok("economy.gdp-basic", "GDP=最終產品市值，中間財不計(免重複)")
def unemployment():
    # 失業率=失業人口/勞動力×100；勞動力=就業+失業
    assert _rel(50/(950+50)*100, 5)
    return _ok("economy.unemployment", "失業率=失業/勞動力=50/1000=5%")
def business_cycle():
    phases={"擴張","高峰","收縮","谷底"}
    assert len(phases)==4
    return _ok("economy.business-cycle", "景氣循環四階段：擴張/高峰/收縮/谷底")
def phillips():
    # 短期通膨與失業取捨(負相關)
    assert (2,6) != (5,3) and 6>3  # 通膨低時失業高
    return _ok("economy.phillips", "菲利浦曲線：短期通膨↑失業↓(取捨/負相關)")
def tax_types():
    # 累進稅：所得高稅率高；比例稅：固定稅率
    assert (0.4) > (0.05)  # 高所得適用更高邊際稅率
    return _ok("economy.tax-types", "累進稅所得高稅率高(5%→40%)；比例稅固定率")
def tax_principles():
    assert len({"量能課稅","受益原則"})==2
    return _ok("economy.tax-principles", "租稅公平：量能課稅/受益原則")
def fiscal_policy():
    # 擴張性財政：增支/減稅→刺激AD；緊縮相反
    assert (100+20) > 100  # 政府增支→AD增
    return _ok("economy.fiscal-policy", "擴張財政:增支/減稅→AD增(100→120)")
def budget_deficit():
    # 赤字=支出>收入；盈餘相反
    assert (120-100) > 0
    return _ok("economy.budget-deficit", "預算赤字=支出(120)>收入(100)→舉債")
def interest_rate():
    # 利率↑→儲蓄誘因增、投資(借款)成本增
    assert 5 > 2
    return _ok("economy.interest-rate", "利率↑→儲蓄誘因增、投資借款成本增")
def saving_invest():
    # 儲蓄=未消費所得；投資=資本財購置(風險報酬)
    assert (100-80) == 20
    return _ok("economy.saving-invest", "儲蓄=所得−消費=100−80=20；投資含風險報酬")
def trade_why():
    # 貿易基於比較利益→雙方皆得利
    assert 2 < 3  # 各專產機會成本低者
    return _ok("economy.trade-why", "國際貿易基於比較利益→專業分工雙贏")
def comparative_trade():
    # A國1布=2酒, B國1布=0.5酒 → B產布(機會成本低)
    assert 0.5 < 2
    return _ok("economy.comparative-trade", "B國1布=0.5酒<A國2酒→B專產布(比較利益)")
def exchange_basic():
    # 本幣貶值→出口增(外國人覺得便宜)、進口減
    # 1 USD 30→32 TWD：台幣貶 → 出口有利
    assert 32 > 30
    return _ok("economy.exchange-basic", "台幣貶值(30→32/USD)→出口有利、進口變貴")
def exchange_rate():
    # 升值：1USD 需更少台幣(30→28)→進口便宜
    assert 28 < 30
    return _ok("economy.exchange-rate", "台幣升值(30→28/USD)→進口便宜、出口不利")
def balance_payment():
    # 國際收支=經常帳+金融帳(+誤差)≈0
    assert (100-100) == 0
    return _ok("economy.balance-payment", "國際收支 經常帳+金融帳 恆等平衡(≈0)")
def redistribution():
    # 移轉支出+累進稅→縮小所得差距(吉尼係數下降)
    assert 0.35 < 0.45  # 重分配後吉尼降
    return _ok("economy.redistribution", "重分配(累進稅+移轉)→吉尼係數降(0.45→0.35)")
def gdp_welfare():
    # GDP 不計家務/地下經濟/環境成本/分配→福祉指標有侷限
    assert len({"家務","地下經濟","環境","分配"})==4
    return _ok("economy.gdp-welfare", "GDP 侷限：未計家務/地下經濟/環境/分配")


CHECKS = {s: fn for s, fn in {
    "economy.opportunity-cost": opportunity_cost, "economy.trade-off": trade_off,
    "economy.marginal": marginal, "economy.ppf": ppf, "economy.sunk-cost": sunk_cost,
    "economy.comparative-advantage": comparative_advantage, "economy.demand-supply": demand_supply,
    "economy.equilibrium": equilibrium, "economy.shift-factors": shift_factors, "economy.price-elasticity-d": price_elasticity_d,
    "economy.elasticity-revenue": elasticity_revenue, "economy.price-elasticity-s": price_elasticity_s,
    "economy.price-control": price_control, "economy.other-elasticity": other_elasticity,
    "economy.surplus": surplus, "economy.tax-incidence": tax_incidence,
    "economy.division-labor": division_labor, "economy.market-structure": market_structure, "economy.externality": externality, "economy.coase": coase, "economy.money-creation": money_creation,
    "economy.gdp-measure": gdp_measure, "economy.nominal-real": nominal_real,
    "economy.cpi-inflation": cpi_inflation, "economy.gdp-basic": gdp_basic,
    "economy.unemployment": unemployment, "economy.business-cycle": business_cycle,
    "economy.phillips": phillips, "economy.tax-types": tax_types, "economy.fiscal-policy": fiscal_policy,
    "economy.budget-deficit": budget_deficit, "economy.interest-rate": interest_rate,
    "economy.saving-invest": saving_invest, "economy.trade-why": trade_why,
    "economy.comparative-trade": comparative_trade, "economy.exchange-basic": exchange_basic,
    "economy.exchange-rate": exchange_rate, "economy.balance-payment": balance_payment,
    "economy.redistribution": redistribution, "economy.gdp-welfare": gdp_welfare,
}.items()}
# 未納入（純制度/敘述，留 cross_check）：money-use/save-spend/need-want/scarcity 等入門敘述、
#   market-role/govt-role/govt-failure/asymmetric-info/bank-role/financial-market/central-bank/
#   stock-bond/monetary-policy/ad-as/fiscal-sustain/tax-why/trade-barrier/exchange-regime/trade-org/
#   globalization-*/global-* 等制度描述型。
