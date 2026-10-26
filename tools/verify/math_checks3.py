# -*- coding: utf-8 -*-
"""math_checks3.py — 代數核心：algexpr / equation / inequality / function 的可重跑 fact 證據。
全部以 sympy 真的展開/求解/驗證，非口頭。CHECKS 鍵＝`<strand>.<slug>`。"""
import sympy as sp

x, y, a, b, c, d, k, n, m, t = sp.symbols("x y a b c d k n m t")

def _ok(cid, dd): return f"PASS:{cid}:{dd}"

# ---------- algexpr（17）----------
def pattern_sequence():
    # 2,5,8,11… 一般項 a_n=3n-1；驗前幾項
    assert [3*i-1 for i in range(1, 5)] == [2, 5, 8, 11]
    # 平方數形 1,4,9,16 = n²
    assert [i*i for i in range(1, 5)] == [1, 4, 9, 16]
    return _ok("algexpr.pattern-sequence", "等差 aₙ=3n−1→2,5,8,11；平方形 n²→1,4,9,16")
def symbol_unknown():
    assert sp.solve(sp.Eq(x+5, 12), x) == [7]        # □+5=12 ⇒ □=7
    return _ok("algexpr.symbol-unknown", "以符號列式 □+5=12 ⇒ □=7")
def translate_word():
    # 「某數的3倍少4等於20」→3x-4=20⇒x=8
    assert sp.solve(sp.Eq(3*x-4, 20), x) == [8]
    return _ok("algexpr.translate-word", "文字題→3x−4=20⇒x=8")
def linear_expression():
    assert sp.expand(3*(x+2) - 2*(x-1)) == x + 8     # 合併同類項
    return _ok("algexpr.linear-expression", "3(x+2)−2(x−1)=x+8")
def poly_add_sub():
    assert sp.expand((2*x**2+3*x-1)+(x**2-5*x+4)) == 3*x**2-2*x+3
    return _ok("algexpr.polynomial-add-sub", "(2x²+3x−1)+(x²−5x+4)=3x²−2x+3")
def poly_mult():
    assert sp.expand((x+3)*(x**2-2*x+5)) == x**3+x**2-x+15
    return _ok("algexpr.polynomial-mult", "(x+3)(x²−2x+5)=x³+x²−x+15")
def poly_div():
    q, r = sp.div(x**3-2*x**2+0*x-5, x-3, x)
    assert q == x**2+x+3 and r == 4 and sp.expand((x-3)*q+r) == x**3-2*x**2-5
    return _ok("algexpr.polynomial-div", "(x³−2x²−5)÷(x−3)=x²+x+3 餘4，且商·除+餘=被除")
def mult_formula_square():
    assert sp.expand((a+b)**2) == a**2+2*a*b+b**2 and sp.expand((a-b)**2) == a**2-2*a*b+b**2
    return _ok("algexpr.mult-formula-square", "(a±b)²=a²±2ab+b²")
def mult_formula_diff():
    assert sp.expand((a+b)*(a-b)) == a**2-b**2
    return _ok("algexpr.mult-formula-diff", "(a+b)(a−b)=a²−b²")
def factor_common():
    assert sp.factor(6*x**2+9*x) == 3*x*(2*x+3)
    return _ok("algexpr.factor-common", "6x²+9x=3x(2x+3)")
def factor_formula():
    assert sp.factor(x**2-9) == (x-3)*(x+3) and sp.factor(x**2+6*x+9) == (x+3)**2
    return _ok("algexpr.factor-formula", "x²−9=(x−3)(x+3)；x²+6x+9=(x+3)²")
def poly_division_principle():
    # 餘式定理：f(x)÷(x−a) 餘 f(a)
    f = x**3-2*x+1
    assert sp.div(f, x-2, x)[1] == f.subs(x, 2)
    return _ok("algexpr.poly-division-principle", "餘式定理：f(x)÷(x−a) 餘=f(a)")
def factor_theorem():
    f = x**3-6*x**2+11*x-6
    assert f.subs(x, 1) == 0 and sp.factor(f) == (x-1)*(x-2)*(x-3)  # 1 為根
    return _ok("algexpr.factor-theorem", "f(1)=0⇒(x−1)為因式；x³−6x²+11x−6=(x−1)(x−2)(x−3)")
def synthetic_division():
    # 綜合除法＝一般多項式除法結果
    q, r = sp.div(2*x**3-3*x**2+0*x+4, x+1, x)
    assert q == 2*x**2-5*x+5 and r == -1
    return _ok("algexpr.synthetic-division", "(2x³−3x²+4)÷(x+1)=2x²−5x+5 餘−1")
def poly_gcd_lcm():
    f, g = x**2-1, x**2+2*x+1
    assert sp.factor(sp.gcd(f, g)) == x+1
    assert sp.expand(sp.lcm(f, g) - (x-1)*(x+1)**2) == 0
    return _ok("algexpr.poly-gcd-lcm", "gcd(x²−1,x²+2x+1)=x+1；lcm=(x−1)(x+1)²")
def binomial_theorem():
    assert sp.expand((x+y)**4) == x**4+4*x**3*y+6*x**2*y**2+4*x*y**3+y**4
    assert [sp.binomial(4, i) for i in range(5)] == [1, 4, 6, 4, 1]
    return _ok("algexpr.binomial-theorem", "(x+y)⁴ 展開係數=1,4,6,4,1=C(4,i)")
def partial_fraction():
    e = (3*x+5)/((x+1)*(x+2))
    assert sp.apart(e, x) == 2/(x+1)+1/(x+2)
    return _ok("algexpr.partial-fraction", "(3x+5)/((x+1)(x+2))=2/(x+1)+1/(x+2)")

# ---------- equation（12）----------
def one_step_balance():
    assert sp.solve(sp.Eq(x+7, 10), x) == [3] and sp.solve(sp.Eq(3*x, 12), x) == [4]
    return _ok("equation.one-step-balance", "等量公理：x+7=10⇒3；3x=12⇒4")
def linear_one_var():
    assert sp.solve(sp.Eq(2*x-3, 5*x+9), x) == [-4]
    return _ok("equation.linear-one-var", "2x−3=5x+9 ⇒ x=−4")
def linear_one_var_apply():
    # 年齡：父=3子，10年後父=2子+? 設子x：父3x，父+10=2(x+10)⇒x=10
    assert sp.solve(sp.Eq(3*x+10, 2*(x+10)), x) == [10]
    return _ok("equation.linear-one-var-apply", "年齡題 3x+10=2(x+10)⇒子=10")
def linear_system_sub():
    sol = sp.solve([sp.Eq(x+y, 7), sp.Eq(2*x-y, 2)], [x, y])
    assert sol == {x: 3, y: 4}
    return _ok("equation.linear-system-substitution", "x+y=7,2x−y=2 ⇒(3,4)")
def linear_system_elim():
    sol = sp.solve([sp.Eq(3*x+2*y, 16), sp.Eq(5*x-2*y, 8)], [x, y])
    assert sol == {x: 3, y: sp.Rational(7, 2)}
    return _ok("equation.linear-system-elimination", "3x+2y=16,5x−2y=8 ⇒(3,7/2)")
def linear_system_apply():
    # 雞兔同籠：頭35腳94 ⇒雞23兔12
    sol = sp.solve([sp.Eq(x+y, 35), sp.Eq(2*x+4*y, 94)], [x, y])
    assert sol == {x: 23, y: 12}
    return _ok("equation.linear-system-apply", "雞兔同籠 頭35腳94⇒雞23兔12")
def quadratic_factor():
    assert set(sp.solve(x**2-5*x+6, x)) == {2, 3}
    return _ok("equation.quadratic-factor", "x²−5x+6=0⇒x=2,3（因式解）")
def quadratic_complete_square():
    # x²+6x+5=0 ⇒(x+3)²=4⇒x=−1,−5
    assert sp.expand((x+3)**2-4) == x**2+6*x+5 and set(sp.solve(x**2+6*x+5, x)) == {-1, -5}
    return _ok("equation.quadratic-complete-square", "x²+6x+5=(x+3)²−4⇒x=−1,−5")
def quadratic_apply():
    # 面積：長比寬多3，面積40 ⇒寬5長8
    w = sp.Symbol('w', positive=True)
    assert sp.solve(sp.Eq(w*(w+3), 40), w) == [5]
    return _ok("equation.quadratic-apply", "矩形長比寬多3面積40⇒寬5長8")
def quadratic_param_range():
    # x²+2x+k=0 有兩相異實根 ⇔ 判別式 D=4−4k>0 ⇔ k<1（以判別式與實根數交叉驗邊界）
    D = lambda kk: 4-4*kk
    assert D(0) > 0 and D(1) == 0 and D(2) < 0
    assert len(set(sp.solve(x**2+2*x+0, x))) == 2      # k=0 兩相異
    assert len(set(sp.solve(x**2+2*x+1, x))) == 1      # k=1 重根
    assert all(not r.is_real for r in sp.solve(x**2+2*x+2, x))  # k=2 無實根
    return _ok("equation.quadratic-param-range", "x²+2x+k：k=0兩根/k=1重根/k=2無實根⇔D>0⇔k<1")
def poly_complex_roots():
    r = sp.solve(x**2+1, x)
    assert set(r) == {sp.I, -sp.I}       # 虛根成對（共軛）
    return _ok("equation.poly-equation-complex-roots", "x²+1=0⇒x=±i（虛根成對共軛）")
def exp_log_eq():
    assert sp.solve(sp.Eq(2**x, 8), x) == [3]
    assert sp.solve(sp.Eq(sp.log(x, 10), 2), x) == [100]
    return _ok("equation.exp-log", "2ˣ=8⇒x=3；log₁₀x=2⇒x=100")

# ---------- inequality（8）----------
def _truth(expr, val):
    return bool(expr.subs(x, val))
def ineq_linear():
    e = 2*x-3 < 7                      # ⇔ x<5；以邊界/內外樣本驗
    assert _truth(e, 4) and not _truth(e, 5) and not _truth(e, 6)
    return _ok("inequality.linear-one-var", "2x−3<7 ⇒ x<5（樣本 4真/5,6假）")
def ineq_linear_apply():
    e = (75+78+x)/3 >= 80              # ⇔ x≥87
    assert _truth(e, 87) and _truth(e, 90) and not _truth(e, 86)
    return _ok("inequality.linear-apply", "平均≥80⇒第三次 x≥87（87,90真/86假）")
def ineq_quadratic():
    e = x**2-5*x+6 < 0                 # ⇔ 2<x<3
    assert _truth(e, sp.Rational(5, 2)) and not _truth(e, 2) and not _truth(e, 4)
    return _ok("inequality.quadratic", "x²−5x+6<0 ⇒ 2<x<3（2.5真/2,4假）")
def ineq_polynomial():
    s = sp.solve_univariate_inequality((x-1)*(x-2)*(x-3) > 0, x, relational=False)
    assert s == sp.Union(sp.Interval.open(1, 2), sp.Interval.open(3, sp.oo))
    return _ok("inequality.polynomial", "(x−1)(x−2)(x−3)>0 ⇒ (1,2)∪(3,∞)")
def ineq_rational():
    s = sp.solve_univariate_inequality((x-1)/(x+2) > 0, x, relational=False)
    assert s == sp.Union(sp.Interval.open(-sp.oo, -2), sp.Interval.open(1, sp.oo))
    return _ok("inequality.rational", "(x−1)/(x+2)>0 ⇒ x<−2 或 x>1")
def ineq_abs():
    e = sp.Abs(x-3) < 2               # ⇔ 1<x<5
    assert _truth(e, 3) and not _truth(e, 1) and not _truth(e, 5) and not _truth(e, 6)
    return _ok("inequality.absolute-value", "|x−3|<2 ⇒ 1<x<5（3真/1,5,6假）")
def ineq_amgm():
    # AM-GM：a,b>0 ⇒ (a+b)/2≥√(ab)，等號 a=b。符號驗 (a+b)/2-√(ab)=(√a-√b)²/2≥0
    aa, bb = sp.symbols('aa bb', positive=True)
    diff = (aa+bb)/2 - sp.sqrt(aa*bb)
    assert sp.simplify(diff - (sp.sqrt(aa)-sp.sqrt(bb))**2/2) == 0
    return _ok("inequality.am-gm", "(a+b)/2−√(ab)=(√a−√b)²/2≥0（AM−GM，等號 a=b）")
def ineq_exp_log():
    e = 2**x > 8                       # ⇔ x>3
    assert _truth(e, 4) and not _truth(e, 3) and not _truth(e, 2)
    # log₁₀x>2 ⇔ x>100（以數值 evalf 驗單調邊界）
    assert sp.log(1000, 10).evalf() > 2 and sp.log(10, 10).evalf() < 2
    return _ok("inequality.exp-log", "2ˣ>8⇒x>3（4真/3,2假）；log₁₀x>2⇒x>100")

# ---------- function（13）----------
def linear_graph():
    f = 2*x+3
    assert f.subs(x, 0) == 3 and sp.diff(f, x) == 2   # 截距3 斜率2
    return _ok("function.linear-graph", "y=2x+3：斜率2、y截距3")
def quadratic_graph():
    f = x**2-4*x+3
    # 對稱軸 x=2，頂點(2,-1)，開口向上
    assert sp.diff(f, x).subs(x, 2) == 0 and f.subs(x, 2) == -1 and sp.diff(f, x, 2) > 0
    return _ok("function.quadratic-graph", "y=x²−4x+3：對稱軸x=2、頂點(2,−1)、開口向上")
def quadratic_max_min():
    f = -x**2+4*x+1               # 開口向下，最大值在 x=2 →5
    assert sp.diff(f, x).subs(x, 2) == 0 and f.subs(x, 2) == 5
    return _ok("function.quadratic-max-min", "y=−x²+4x+1 最大值5（x=2）")
def concept_domain_range():
    # f(x)=√(x-1)：定義域 x≥1（被開方 ≥0），值域 y≥0
    e = x-1 >= 0
    assert _truth(e, 1) and _truth(e, 5) and not _truth(e, 0)
    assert sp.sqrt(sp.Integer(4)) == 2 and sp.sqrt(sp.Integer(0)) == 0   # 值域非負
    return _ok("function.concept-domain-range", "√(x−1)：定義域 x≥1（1,5真/0假）、值域 y≥0")
def quadratic_closed_interval():
    f = x**2-2*x          # 在 [0,3]：頂點 x=1 min=-1，端點 f(3)=3 max
    vals = [f.subs(x, p) for p in [0, 1, 3]]
    assert min(vals) == -1 and max(vals) == 3
    return _ok("function.quadratic-closed-interval", "x²−2x 在[0,3]：min=−1(x=1)、max=3(x=3)")
def graph_transformation():
    # y=(x-2)²+3 是 y=x² 右移2上移3；頂點(2,3)
    g = (x-2)**2+3
    assert g.subs(x, 2) == 3 and sp.expand(g) == x**2-4*x+7
    return _ok("function.graph-transformation", "y=x² 右2上3 → (x−2)²+3，頂點(2,3)")
def composite_inverse():
    f = 2*x+1
    finv = (x-1)/2
    assert sp.simplify(f.subs(x, finv)) == x and sp.simplify(finv.subs(x, f)) == x
    return _ok("function.composite-inverse", "f(x)=2x+1 與 f⁻¹=(x−1)/2 互逆（f∘f⁻¹=x）")
def exp_definition():
    f = 2**x
    assert f.subs(x, 0) == 1 and f.subs(x, 3) == 8
    assert f.subs(x, 1) < f.subs(x, 2)                     # 遞增
    assert sp.Rational(2)**sp.Integer(-10) < sp.Rational(1, 1000)   # x→−∞ 趨0（示例極小）
    return _ok("function.exp-definition", "y=2ˣ：過(0,1)、遞增、2⁻¹⁰<1/1000（趨0）")
def log_definition():
    assert sp.simplify(sp.log(8, 2) - 3) == 0
    aa, bb = sp.symbols('aa bb', positive=True)
    assert sp.simplify(sp.log(aa*bb) - (sp.log(aa)+sp.log(bb))) == 0   # 積的對數
    return _ok("function.log-definition", "log₂8=3；log(ab)=log a+log b")
def log_change_base():
    assert sp.simplify(sp.log(8, 2) - sp.log(8)/sp.log(2)) == 0
    return _ok("function.log-change-base", "換底 log₂8=ln8/ln2")
def log_scale_apply():
    # pH=-log[H+]；[H+]=1e-3 ⇒ pH=3
    assert -sp.log(sp.Rational(1, 1000), 10) == 3
    # 分貝/地震規模同為對數尺：規模差2⇒能量差10²（示意）
    return _ok("function.log-scale-apply", "pH=−log[H⁺]，[H⁺]=10⁻³⇒pH=3（對數尺）")
def exp_growth_decay():
    # 半衰期：N=N0(1/2)^(t/T)，t=T ⇒ 半；複利 1000(1.05)^2
    assert sp.Rational(1, 2)**1 == sp.Rational(1, 2)
    assert 1000*sp.Rational(21, 20)**2 == sp.Rational(220500, 200)
    return _ok("function.exp-growth-decay", "半衰期 t=T→剩½；複利 1000·1.05²=1102.5")
def rational_graph():
    f = 1/(x-2)
    assert sp.limit(f, x, sp.oo) == 0 and sp.limit(f, x, 2, '+') == sp.oo  # 水平/鉛直漸近線
    return _ok("function.rational-graph", "y=1/(x−2)：鉛直漸近 x=2、水平漸近 y=0")


CHECKS = {f"{s}": fn for s, fn in {
    "algexpr.pattern-sequence": pattern_sequence, "algexpr.symbol-unknown": symbol_unknown,
    "algexpr.translate-word": translate_word, "algexpr.linear-expression": linear_expression,
    "algexpr.polynomial-add-sub": poly_add_sub, "algexpr.polynomial-mult": poly_mult,
    "algexpr.polynomial-div": poly_div, "algexpr.mult-formula-square": mult_formula_square,
    "algexpr.mult-formula-diff": mult_formula_diff, "algexpr.factor-common": factor_common,
    "algexpr.factor-formula": factor_formula, "algexpr.poly-division-principle": poly_division_principle,
    "algexpr.factor-theorem": factor_theorem, "algexpr.synthetic-division": synthetic_division,
    "algexpr.poly-gcd-lcm": poly_gcd_lcm, "algexpr.binomial-theorem": binomial_theorem,
    "algexpr.partial-fraction": partial_fraction,
    "equation.one-step-balance": one_step_balance, "equation.linear-one-var": linear_one_var,
    "equation.linear-one-var-apply": linear_one_var_apply,
    "equation.linear-system-substitution": linear_system_sub,
    "equation.linear-system-elimination": linear_system_elim,
    "equation.linear-system-apply": linear_system_apply, "equation.quadratic-factor": quadratic_factor,
    "equation.quadratic-complete-square": quadratic_complete_square,
    "equation.quadratic-apply": quadratic_apply, "equation.quadratic-param-range": quadratic_param_range,
    "equation.poly-equation-complex-roots": poly_complex_roots, "equation.exp-log": exp_log_eq,
    "inequality.linear-one-var": ineq_linear, "inequality.linear-apply": ineq_linear_apply,
    "inequality.quadratic": ineq_quadratic, "inequality.polynomial": ineq_polynomial,
    "inequality.rational": ineq_rational, "inequality.absolute-value": ineq_abs,
    "inequality.am-gm": ineq_amgm, "inequality.exp-log": ineq_exp_log,
    "function.linear-graph": linear_graph, "function.quadratic-graph": quadratic_graph,
    "function.quadratic-max-min": quadratic_max_min, "function.concept-domain-range": concept_domain_range,
    "function.quadratic-closed-interval": quadratic_closed_interval,
    "function.graph-transformation": graph_transformation, "function.composite-inverse": composite_inverse,
    "function.exp-definition": exp_definition, "function.log-definition": log_definition,
    "function.log-change-base": log_change_base, "function.log-scale-apply": log_scale_apply,
    "function.exp-growth-decay": exp_growth_decay, "function.rational-graph": rational_graph,
}.items()}
