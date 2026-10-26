# -*- coding: utf-8 -*-
"""math_checks7.py — 微積分 calc / 統計 stats / 財務數學 finmath 可重跑 fact 證據。
sympy 微積分 + numpy/statistics 真算。CHECKS 鍵＝`<strand>.<slug>`。"""
import sympy as sp
import numpy as np
import statistics as st
from sympy import Symbol, diff, integrate, limit, oo, sqrt, exp, log, sin, cos, pi, Rational, simplify

x = Symbol('x'); t = Symbol('t')
def _ok(cid, dd): return f"PASS:{cid}:{dd}"

# ---------- calc（20）----------
def c_seq_limit():
    n = Symbol('n', positive=True)
    assert limit((3*n**2+1)/(n**2+n), n, oo) == 3 and limit(1/n, n, oo) == 0
    return _ok("calc.sequence-limit", "lim(3n²+1)/(n²+n)=3；lim1/n=0（收斂）")
def c_func_limit():
    assert limit((x**2-1)/(x-1), x, 1) == 2 and limit(sin(x)/x, x, 0) == 1
    return _ok("calc.function-limit", "lim_{x→1}(x²−1)/(x−1)=2；lim sinx/x=1")
def c_continuity():
    f = x**2
    assert limit(f, x, 2) == f.subs(x, 2) == 4            # 連續：極限=函數值
    return _ok("calc.continuity", "f=x² 於 x=2 連續（極限=函數值=4）")
def c_deriv_def():
    f = x**2; h = Symbol('h')
    d = limit((f.subs(x, x+h)-f)/h, h, 0)
    assert d == 2*x == diff(f, x)                         # 差商極限=導數
    return _ok("calc.derivative-definition", "差商極限 lim(f(x+h)−f(x))/h=2x=f′")
def c_diff_rules():
    assert diff(x**5, x) == 5*x**4
    assert diff(x**2*sin(x), x) == 2*x*sin(x)+x**2*cos(x)  # 積
    assert simplify(diff(x/(x+1), x) - 1/(x+1)**2) == 0    # 商
    return _ok("calc.differentiation-rules", "冪/積/商微分：d(x⁵)=5x⁴ 等")
def c_chain():
    assert diff(sin(x**2), x) == 2*x*cos(x**2)
    return _ok("calc.chain-rule", "d/dx sin(x²)=2x·cos(x²)（鏈鎖）")
def c_higher():
    assert diff(x**4, x, 2) == 12*x**2 and diff(sin(x), x, 2) == -sin(x)
    return _ok("calc.higher-derivative", "d²(x⁴)=12x²；d²sinx=−sinx")
def c_tangent_normal():
    f = x**2; x0 = 1
    m = diff(f, x).subs(x, x0)                            # 切線斜率2，過(1,1)
    assert m == 2 and f.subs(x, x0) == 1
    return _ok("calc.tangent-normal", "y=x² 於(1,1)：切線斜率2、法線斜率−½")
def c_incr_concave():
    f = x**3-3*x
    # f'=3x²−3，x>1 遞增；f''=6x，x>0 凹向上
    assert diff(f, x).subs(x, 2) > 0 and diff(f, x, 2).subs(x, 1) > 0
    return _ok("calc.increasing-concavity", "x³−3x：x=2 f′>0 遞增、x=1 f″>0 凹向上")
def c_extrema():
    f = x**3-3*x
    crit = sp.solve(diff(f, x), x)
    assert set(crit) == {-1, 1} and diff(f, x, 2).subs(x, 1) > 0 and diff(f, x, 2).subs(x, -1) < 0
    return _ok("calc.extrema", "x³−3x：x=1 極小(f″>0)、x=−1 極大(f″<0)")
def c_curve_sketch():
    f = x**3-3*x
    assert f.subs(x, 1) == -2 and f.subs(x, -1) == 2     # 極值點座標
    return _ok("calc.curve-sketch", "x³−3x 極小(1,−2)、極大(−1,2)（描繪關鍵點）")
def c_related_rates():
    # 球 V=4/3πr³，dV/dr=4πr²；r=3 → 4π·9
    r = Symbol('r', positive=True)
    assert diff(Rational(4, 3)*pi*r**3, r) == 4*pi*r**2
    return _ok("calc.related-rates", "V=4/3πr³ ⇒ dV/dr=4πr²（相關變率）")
def c_optimization():
    # 周長固定20的矩形最大面積：x(10−x) 最大在 x=5 → 25（正方形）
    A = x*(10-x)
    xm = sp.solve(diff(A, x), x)[0]
    assert xm == 5 and A.subs(x, 5) == 25
    return _ok("calc.optimization", "周長20矩形最大面積=25（x=5 正方形）")
def c_antiderivative():
    assert integrate(2*x, x) == x**2 and integrate(cos(x), x) == sin(x)
    return _ok("calc.antiderivative", "∫2x dx=x²；∫cosx dx=sinx")
def c_definite_integral():
    assert integrate(x**2, (x, 0, 3)) == 9               # ∫₀³x²=9
    # 微積分基本定理：∫ₐᵇf′=f(b)−f(a)
    f = x**3
    assert integrate(diff(f, x), (x, 1, 2)) == f.subs(x, 2)-f.subs(x, 1)
    return _ok("calc.definite-integral", "∫₀³x²dx=9；FTC ∫f′=f(b)−f(a)")
def c_area():
    # y=x 與 y=x² 間面積 ∫₀¹(x−x²)=1/6
    assert integrate(x-x**2, (x, 0, 1)) == Rational(1, 6)
    return _ok("calc.area", "y=x 與 y=x² 間面積=1/6")
def c_volume_rev():
    # y=x 繞 x 軸 [0,1] 旋轉體積 π∫₀¹x²=π/3
    assert integrate(pi*x**2, (x, 0, 1)) == pi/3
    return _ok("calc.volume-revolution", "y=x 繞 x 軸[0,1]旋轉體積=π/3")
def c_integration_sub():
    # ∫₀¹ 2x·e^{x²} dx = e−1（代換 u=x²）
    assert simplify(integrate(2*x*exp(x**2), (x, 0, 1)) - (exp(1)-1)) == 0
    return _ok("calc.integration-substitution", "∫₀¹2x·e^{x²}dx=e−1（代換）")
def c_exp_log_calc():
    assert diff(exp(x), x) == exp(x) and diff(log(x), x) == 1/x
    assert integrate(1/x, (x, 1, exp(1))) == 1
    return _ok("calc.exp-log-calculus", "d(eˣ)=eˣ、d(lnx)=1/x、∫₁ᵉ(1/x)=1")
def c_trig_calc():
    assert diff(sin(x), x) == cos(x) and integrate(sin(x), (x, 0, pi)) == 2
    return _ok("calc.trig-calculus", "d(sinx)=cosx；∫₀^π sinx dx=2")

# ---------- stats（18）----------
D = [2, 4, 4, 4, 5, 5, 7, 9]      # 共用樣本（std 範例，μ=5,σ=2）
def s_collect():
    cats = ['A', 'B', 'A', 'C', 'B', 'A']
    from collections import Counter
    assert Counter(cats) == {'A': 3, 'B': 2, 'C': 1} and sum(Counter(cats).values()) == 6
    return _ok("stats.collect-organize", "分類計數 A3B2C1，總和=資料數6")
def s_bar_line():
    vals = [10, 20, 15]
    assert sum(vals) == 45 and max(vals) == 20        # 長條高=數值
    return _ok("stats.bar-line-chart", "長條圖數值總和45、最高20（高度=數值）")
def s_pie():
    parts = [30, 50, 20]
    pct = [p/sum(parts)*100 for p in parts]
    assert abs(sum(pct)-100) < 1e-9 and pct[1] == 50
    return _ok("stats.pie-chart", "圓形圖百分比總和=100%")
def s_table():
    table = {'一月': 10, '二月': 15, '三月': 20}
    assert sum(table.values()) == 45 and table['三月'] == 20
    return _ok("stats.table-read", "統計表讀取與加總=45")
def s_mean():
    assert st.mean(D) == 5 and st.mean([1, 2, 3, 4]) == 2.5
    return _ok("stats.mean", "平均數 mean([2,4,4,4,5,5,7,9])=5")
def s_freq_table():
    from collections import Counter
    c = Counter(D)
    assert c[4] == 3 and sum(c.values()) == 8
    return _ok("stats.frequency-table", "次數分配：4 出現3次，總次數8")
def s_cumulative():
    freq = [2, 3, 5]
    cum = np.cumsum(freq).tolist()
    assert cum == [2, 5, 10] and [f/sum(freq) for f in freq][0] == 0.2
    return _ok("stats.cumulative-relative", "累積次數[2,5,10]；相對次數首項0.2")
def s_central():
    assert st.mean(D) == 5 and st.median(D) == 4.5 and st.mode(D) == 4
    return _ok("stats.central-tendency", "平均5、中位數4.5、眾數4")
def s_range_quartile():
    assert max(D)-min(D) == 7
    q1, q3 = np.percentile(D, [25, 75])
    assert q1 == 4.0 and q3 == 5.5
    return _ok("stats.range-quartile", "全距=7；Q1=4、Q3=5.5")
def s_box_plot():
    q1, med, q3 = np.percentile(D, [25, 50, 75])
    assert (q1, med, q3) == (4.0, 4.5, 5.5) and (min(D), max(D)) == (2, 9)
    return _ok("stats.box-plot", "箱形圖五數：2,4,4.5,5.5,9")
def s_percentile():
    assert np.percentile(D, 50) == 4.5 and np.percentile([1, 2, 3, 4, 5], 100) == 5
    return _ok("stats.percentile", "第50百分位=中位數4.5")
def s_variance_std():
    assert st.pstdev(D) == 2.0 and st.pvariance(D) == 4.0   # 母體σ=2
    return _ok("stats.variance-std", "母體變異數=4、標準差=2")
def s_standardization():
    # 線性變換 y=ax+b：平均→a·μ+b，標準差→|a|·σ
    a, b = 2, 3
    Y = [a*v+b for v in D]
    assert st.mean(Y) == a*st.mean(D)+b and abs(st.pstdev(Y)-abs(a)*st.pstdev(D)) < 1e-9
    return _ok("stats.standardization", "y=2x+3：μ→2μ+3、σ→2σ")
def s_bivariate():
    xs, ys = [1, 2, 3], [2, 4, 6]
    assert len(xs) == len(ys)                             # 散布圖成對
    return _ok("stats.bivariate-scatter", "二維資料成對（散布圖點數=3）")
def s_correlation():
    xs = [1, 2, 3, 4]; ys = [2, 4, 6, 8]                  # 完全正相關 r=1
    r = np.corrcoef(xs, ys)[0, 1]
    assert abs(r-1.0) < 1e-9
    xs2, ys2 = [1, 2, 3, 4], [8, 6, 4, 2]                 # 完全負相關 r=−1
    assert abs(np.corrcoef(xs2, ys2)[0, 1]+1.0) < 1e-9
    return _ok("stats.correlation", "完全正相關 r=1、完全負相關 r=−1")
def s_regression():
    xs = np.array([1, 2, 3, 4]); ys = np.array([2, 4, 6, 8])
    m, b = np.polyfit(xs, ys, 1)
    assert abs(m-2) < 1e-9 and abs(b) < 1e-9              # y=2x
    return _ok("stats.regression-line", "最適直線 y=2x（斜率2截距0）")
def s_sampling():
    # 簡單隨機抽樣每個體被抽機率相同
    N, n = 100, 10
    assert n/N == 0.1
    return _ok("stats.sampling-survey", "簡單隨機抽樣：N=100 取 n=10，個體機率0.1")
def s_risk_decision():
    # 期望值決策：方案A 0.5·100+0.5·0=50；方案B 確定40 → 選 A
    EA = 0.5*100+0.5*0; EB = 40
    assert EA > EB and EA == 50
    return _ok("stats.risk-decision", "期望值決策 E(A)=50>E(B)=40（風險/決策）")

# ---------- finmath（6）----------
def f_interest():
    # 單利 P·r·t；複利 P(1+r)ⁿ。1000,5%,2年
    assert 1000*0.05*2 == 100                             # 單利利息
    assert abs(1000*(1.05)**2 - 1102.5) < 1e-9            # 複利本利和
    return _ok("finmath.simple-compound-interest", "單利 1000·5%·2=100；複利 1000·1.05²=1102.5")
def f_annuity():
    # 年金終值 FV=PMT·((1+r)ⁿ−1)/r；PMT=100,r=5%,n=3
    r, n, pmt = 0.05, 3, 100
    fv = pmt*((1+r)**n-1)/r
    assert abs(fv - 315.25) < 1e-2
    return _ok("finmath.annuity", "年金終值 100·((1.05)³−1)/0.05≈315.25")
def f_loan():
    # 等額攤還 PMT=P·r/(1−(1+r)⁻ⁿ)；P=1000,r=5%,n=3
    P, r, n = 1000, 0.05, 3
    pmt = P*r/(1-(1+r)**-n)
    assert abs(pmt - 367.21) < 1e-2
    # 攤還表：n 期付清
    bal = P
    for _ in range(n): bal = bal*(1+r)-pmt
    assert abs(bal) < 1e-6
    return _ok("finmath.loan-installment", "1000 借5%分3期月付≈367.21，期末餘額=0")
def f_growth_decay():
    # 半衰期：N=N₀(½)^(t/T)，t=2T → ¼
    assert (0.5)**2 == 0.25
    return _ok("finmath.growth-decay-model", "半衰期 t=2T → 剩¼")
def f_geo_distance():
    # 經度每15°=1 小時時差；地球半徑 R，緯圈半徑 R·cosφ
    import math as _m
    assert 360/24 == 15 and abs(_m.cos(_m.radians(60)) - 0.5) < 1e-9
    return _ok("finmath.geo-distance", "經度15°=1時差；緯度60°緯圈半徑=R·cos60°=R/2")
def f_marginal():
    # 邊際＝導數：成本 C=x²+10，邊際成本 dC/dx=2x
    assert diff(x**2+10, x) == 2*x
    return _ok("finmath.marginal-elasticity", "邊際成本=dC/dx；C=x²+10⇒MC=2x")


CHECKS = {s: fn for s, fn in {
    "calc.sequence-limit": c_seq_limit, "calc.function-limit": c_func_limit,
    "calc.continuity": c_continuity, "calc.derivative-definition": c_deriv_def,
    "calc.differentiation-rules": c_diff_rules, "calc.chain-rule": c_chain,
    "calc.higher-derivative": c_higher, "calc.tangent-normal": c_tangent_normal,
    "calc.increasing-concavity": c_incr_concave, "calc.extrema": c_extrema,
    "calc.curve-sketch": c_curve_sketch, "calc.related-rates": c_related_rates,
    "calc.optimization": c_optimization, "calc.antiderivative": c_antiderivative,
    "calc.definite-integral": c_definite_integral, "calc.area": c_area,
    "calc.volume-revolution": c_volume_rev, "calc.integration-substitution": c_integration_sub,
    "calc.exp-log-calculus": c_exp_log_calc, "calc.trig-calculus": c_trig_calc,
    "stats.collect-organize": s_collect, "stats.bar-line-chart": s_bar_line,
    "stats.pie-chart": s_pie, "stats.table-read": s_table, "stats.mean": s_mean,
    "stats.frequency-table": s_freq_table, "stats.cumulative-relative": s_cumulative,
    "stats.central-tendency": s_central, "stats.range-quartile": s_range_quartile,
    "stats.box-plot": s_box_plot, "stats.percentile": s_percentile,
    "stats.variance-std": s_variance_std, "stats.standardization": s_standardization,
    "stats.bivariate-scatter": s_bivariate, "stats.correlation": s_correlation,
    "stats.regression-line": s_regression, "stats.sampling-survey": s_sampling,
    "stats.risk-decision": s_risk_decision,
    "finmath.simple-compound-interest": f_interest, "finmath.annuity": f_annuity,
    "finmath.loan-installment": f_loan, "finmath.growth-decay-model": f_growth_decay,
    "finmath.geo-distance": f_geo_distance, "finmath.marginal-elasticity": f_marginal,
}.items()}
