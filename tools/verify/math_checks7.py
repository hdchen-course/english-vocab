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
def c_integration_parts():
    # 分部積分 ∫u dv = uv − ∫v du
    assert integrate(x*exp(x), x) == (x-1)*exp(x)        # ∫x·eˣ=(x−1)eˣ
    assert integrate(x*cos(x), x) == x*sin(x)+cos(x)     # ∫x·cosx=x·sinx+cosx
    assert integrate(x*exp(x), (x, 0, 1)) == 1           # ∫₀¹x·eˣ=1
    return _ok("calc.integration-by-parts", "∫x·eˣdx=(x−1)eˣ；∫x·cosx dx=x·sinx+cosx；∫₀¹x·eˣ=1")
def c_exp_log_calc():
    assert diff(exp(x), x) == exp(x) and diff(log(x), x) == 1/x
    assert integrate(1/x, (x, 1, exp(1))) == 1
    return _ok("calc.exp-log-calculus", "d(eˣ)=eˣ、d(lnx)=1/x、∫₁ᵉ(1/x)=1")
def c_trig_calc():
    assert diff(sin(x), x) == cos(x) and integrate(sin(x), (x, 0, pi)) == 2
    return _ok("calc.trig-calculus", "d(sinx)=cosx；∫₀^π sinx dx=2")

# ---------- vector（11）----------
def c_vec_plane_def():
    v = sp.Matrix([3, 4])
    assert v.norm() == 5                              # |(3,4)|=5
    assert list((2*v)) == [6, 8]                      # 2v=(6,8) 同向2倍
    assert list((-v)) == [-3, -4]                     # −v=(−3,−4) 等長反向
    assert sp.Matrix([3, 4]) == sp.Matrix([3, 4])     # 分量相同即相等
    return _ok("vector.plane-definition", "|(3,4)|=5；2(3,4)=(6,8)；−(3,4)=(−3,−4)；分量相同即相等")
def c_vec_plane_addsub():
    u = sp.Matrix([3, 1]); v = sp.Matrix([1, 2])
    assert list(u + v) == [4, 3]                      # 加法分量相加 (3,1)+(1,2)=(4,3)
    assert list(u - v) == [2, -1]                     # 減法分量相減 (3,1)−(1,2)=(2,−1)
    assert (u + v).norm() == 5                         # |u+v|=|(4,3)|=5
    assert list(u - v) == list(u + (-v))              # u−v = u+(−v)（三角形法則）
    assert list(2*u + v) == [7, 4]                     # 線性組合 2u+v=(7,4)
    return _ok("vector.plane-add-sub", "(3,1)+(1,2)=(4,3)；(3,1)−(1,2)=(2,−1)；|u+v|=5；u−v=u+(−v)")
def c_vec_linear_combination():
    u = sp.Matrix([2, 1]); v = sp.Matrix([1, 3])
    assert list(2*u + v) == [5, 5]                     # 2u+v=(5,5) 線性組合
    assert list(-u + 2*v) == [0, 5]                    # −u+2v=(0,5)
    a, b = sp.symbols('a b')
    assert list(a*u + b*v) == [2*a + b, a + 3*b]       # au+bv=(2a+b, a+3b) 分量
    assert sp.Matrix([[2, 1], [1, 3]]).det() == 5      # det≠0 ⇒ u,v 不平行、可張成平面
    return _ok("vector.linear-combination", "2u+v=(5,5)；−u+2v=(0,5)；au+bv=(2a+b,a+3b)；det=5≠0 張成平面")
def c_vec_component():
    i = sp.Matrix([1, 0]); j = sp.Matrix([0, 1]); v = sp.Matrix([3, 4])
    assert list(3*i + 4*j) == [3, 4]                   # v=(3,4)=3i+4j 標準基底分解
    assert v.norm() == 5                               # |v|=5
    uhat = v / v.norm()
    assert list(uhat) == [sp.Rational(3, 5), sp.Rational(4, 5)]  # 單位向量=(3/5,4/5)
    assert uhat.norm() == 1                             # 單位向量長度=1
    return _ok("vector.component", "(3,4)=3i+4j；|v|=5；單位向量=(3/5,4/5)；|單位向量|=1")
def c_vec_dot_product():
    u = sp.Matrix([3, 4]); v = sp.Matrix([2, 1])
    assert u.dot(v) == 10                               # 內積 3·2+4·1=10
    a = sp.Matrix([3, 4]); b = sp.Matrix([4, -3])
    assert a.dot(b) == 0                                # 垂直 ⟺ 內積0
    # 夾角 cosθ=u·v/(|u||v|)；u=(3,4),v=(2,1)：10/(5·√5)=2/√5
    cos = u.dot(v) / (u.norm() * v.norm())
    assert sp.simplify(cos - 2/sp.sqrt(5)) == 0
    # 自身內積=模平方
    assert u.dot(u) == u.norm()**2 == 25
    return _ok("vector.dot-product", "(3,4)·(2,1)=10；(3,4)·(4,−3)=0(垂直)；cosθ=2/√5；u·u=|u|²=25")
def c_vec_projection():
    u = sp.Matrix([3, 4]); v = sp.Matrix([4, 0])
    proj = (u.dot(v) / v.dot(v)) * v
    assert list(proj) == [3, 0]                        # proj_v u=(u·v/|v|²)v=(3,0)
    scomp = u.dot(v) / v.norm()
    assert scomp == 3                                  # 純量投影 u·v/|v|=12/4=3
    assert (u - proj).dot(v) == 0                      # u−proj ⊥ v：(0,4)·(4,0)=0
    # transfer：(5,2) 投影到 (0,3)=(0,2)
    u2 = sp.Matrix([5, 2]); v2 = sp.Matrix([0, 3])
    assert list((u2.dot(v2)/v2.dot(v2))*v2) == [0, 2]
    return _ok("vector.projection", "proj_(4,0)(3,4)=(3,0)；純量投影=3；u−proj⊥v；(5,2)→(0,3)=(0,2)")
def c_vec_cross_product():
    def cross(a, b): return a[0]*b[1] - a[1]*b[0]      # 2D 外積(純量)=u₁v₂−u₂v₁
    u = (3, 2); v = (1, 3)
    assert cross(u, v) == 7                             # (3,2)×(1,3)=3·3−2·1=7
    assert u[0]*v[0] + u[1]*v[1] == 9                   # 內積=9≠外積7（避混淆）
    assert abs(cross(u, v)) == 7                        # 平行四邊形面積=|u×v|=7
    assert sp.Rational(abs(cross(u, v)), 2) == sp.Rational(7, 2)  # 三角形面積=7/2
    assert cross((2, 4), (1, 2)) == 0                   # 平行 ⟺ 外積=0
    assert cross(u, v) == -cross(v, u)                  # 反對稱 u×v=−(v×u)
    return _ok("vector.cross-product", "(3,2)×(1,3)=7；內積=9≠7；平行四邊形面積=7；三角形=7/2；(2,4)×(1,2)=0(平行)；u×v=−v×u")
def c_vec_space_vector():
    a = sp.Matrix([1, 2, 3]); b = sp.Matrix([4, 5, 6])
    assert list(a + b) == [5, 7, 9]                   # 空間加法逐分量 (1,2,3)+(4,5,6)=(5,7,9)
    assert list(a - b) == [-3, -3, -3]                # 減法 (1,2,3)−(4,5,6)=(−3,−3,−3)
    assert list(2 * a) == [2, 4, 6]                   # 係數積 2(1,2,3)=(2,4,6)
    assert sp.Matrix([2, 3, 6]).norm() == 7           # 模 |(2,3,6)|=√(4+9+36)=√49=7
    assert a.norm() == sp.sqrt(14)                    # |(1,2,3)|=√14（展示公式）
    assert list(sp.Matrix([2, 4, 6])) == list(2 * a)  # (2,4,6)=2(1,2,3) 平行(係數成比例)
    return _ok("vector.space-vector", "(1,2,3)+(4,5,6)=(5,7,9)；差=(−3,−3,−3)；2(1,2,3)=(2,4,6)；|(2,3,6)|=7；|(1,2,3)|=√14；(2,4,6)∥(1,2,3)")
def c_vec_space_dot_product():
    a = sp.Matrix([1, 2, 2]); b = sp.Matrix([2, 0, 1])
    assert a.dot(b) == 4                               # 空間內積 1·2+2·0+2·1=4
    assert a.norm() == 3                               # |a|=√(1+4+4)=3
    assert b.norm() == sp.sqrt(5)                      # |b|=√(4+0+1)=√5
    cos = a.dot(b) / (a.norm() * b.norm())             # 夾角 cosθ=a·b/(|a||b|)=4/(3√5)
    assert sp.simplify(cos - 4 / (3 * sp.sqrt(5))) == 0
    c = sp.Matrix([2, -1, 0])
    assert a.dot(c) == 0                               # 垂直 (1,2,2)·(2,−1,0)=2−2+0=0
    assert a.dot(a) == a.norm()**2 == 9                # 自身內積=模平方
    return _ok("vector.space-dot-product", "(1,2,2)·(2,0,1)=4；|a|=3、|b|=√5；cosθ=4/(3√5)；(1,2,2)·(2,−1,0)=0(垂直)；a·a=|a|²=9")
def c_vec_triangle_tetra_area():
    a = sp.Matrix([2, 0, 0]); b = sp.Matrix([0, 3, 0]); c = sp.Matrix([1, 1, 4])
    cr = a.cross(b)
    assert list(cr) == [0, 0, 6]                       # 3D 外積 a×b=(0,0,6)（垂直 a、b）
    assert cr.dot(a) == 0 and cr.dot(b) == 0           # a×b 同時垂直 a 與 b
    assert cr.norm() == 6                              # 平行四邊形面積=|a×b|=6
    assert sp.Rational(1, 2) * cr.norm() == 3          # 三角形面積=½|a×b|=3
    tp = cr.dot(c)
    assert tp == 24                                    # 純量三重積 (a×b)·c=24=平行六面體體積
    assert sp.Rational(1, 6) * abs(tp) == 4            # 四面體體積=⅙|(a×b)·c|=4
    return _ok("vector.triangle-tetra-area", "a×b=(0,0,6)⊥a,b；|a×b|=6(平行四邊形)；三角形=3；(a×b)·c=24(平行六面體)；四面體=⅙·24=4")
def c_vec_geometry_apply():
    def cross(u, v): return u[0]*v[1] - u[1]*v[0]      # 2D 外積(純量)
    A = sp.Matrix([1, 1]); B = sp.Matrix([3, 2]); C = sp.Matrix([7, 4])
    AB = B - A; AC = C - A
    assert cross(AB, AC) == 0                          # 共線判定 AB×AC=0 ⟺ A,B,C 共線
    P = sp.Matrix([0, 0]); Q = sp.Matrix([6, 0]); R = sp.Matrix([3, 6])
    assert list((P + Q + R) / 3) == [3, 2]             # 重心 G=(A+B+C)/3=(3,2)
    assert list((P + Q) / 2) == [3, 0]                 # 中點 M=(A+B)/2=(3,0)
    assert list((1 * P + 2 * Q) / 3) == [4, 0]         # 分點 分 PQ 為 2:1(從 P)=(A+2B)/3=(4,0)
    return _ok("vector.geometry-apply", "AB×AC=0⇒A,B,C 共線；重心 G=(3,2)；中點=(3,0)；分點 2:1=(4,0)")
def c_conic_parabola():
    # y²=4x：標準式 y²=4px，4p=4⇒p=1；焦點(p,0)=(1,0)、準線 x=−p=−1、頂點(0,0)
    p = sp.Rational(4, 4); assert p == 1
    F = sp.Point(1, 0)
    P = sp.Point(1, 2)                                 # 2²=4·1 在拋物線上
    assert P.distance(F) == 2 and abs(sp.Integer(1) - (-1)) == 2   # 到焦=到準線=2
    Q = sp.Point(4, 4)                                 # 4²=16=4·4 在拋物線上
    assert Q.distance(F) == 5 and abs(sp.Integer(4) - (-1)) == 5   # 到焦=到準線=5
    return _ok("conic.parabola", "y²=4x：4p=4⇒p=1、焦點(1,0)、準線x=−1、頂點(0,0)；(1,2)到焦=到準線=2；(4,4)到焦=到準線=5")
def c_conic_ellipse():
    # x²/25+y²/9=1：a=5(長半軸)、b=3(短半軸)、c=√(a²−b²)=4；焦點(±4,0)
    a, b = 5, 3
    c = sp.sqrt(a**2 - b**2); assert c == 4
    assert 2 * a == 10 and 2 * b == 6 and 2 * c == 8         # 長軸10、短軸6、焦距8
    P = sp.Point(0, 3)                                        # 上頂點 到兩焦距和=2a=10
    assert P.distance(sp.Point(4, 0)) + P.distance(sp.Point(-4, 0)) == 10
    Q = sp.Point(5, 0)                                        # 右頂點 (5−4)+(5+4)=10
    assert Q.distance(sp.Point(4, 0)) + Q.distance(sp.Point(-4, 0)) == 10
    return _ok("conic.ellipse", "x²/25+y²/9=1：a=5、b=3、c=4、焦點(±4,0)；長軸10/短軸6/焦距8；到兩焦距和=2a=10")
def c_conic_hyperbola():
    # x²/16−y²/9=1：a=4、b=3、c=√(a²+b²)=5（雙曲線用「加」）；焦點(±5,0)、頂點(±4,0)
    a, b = 4, 3
    c = sp.sqrt(a**2 + b**2); assert c == 5
    assert 2 * a == 8 and 2 * c == 10                           # 貫軸(實軸)長8、焦距10
    V = sp.Point(4, 0)                                          # 右頂點 到兩焦距「差」=2a=8
    assert abs(V.distance(sp.Point(5, 0)) - V.distance(sp.Point(-5, 0))) == 8
    P = sp.Point(8, sp.sqrt(27))                                # 曲線上一點 x=8⇒y²=27
    assert sp.simplify(abs(P.distance(sp.Point(5, 0)) - P.distance(sp.Point(-5, 0))) - 8) == 0
    assert sp.Rational(b, a) == sp.Rational(3, 4)              # 漸近線斜率 ±b/a=±3/4
    return _ok("conic.hyperbola", "x²/16−y²/9=1：a=4、b=3、c=√(a²+b²)=5、焦點(±5,0)、頂點(±4,0)；到兩焦距差=2a=8；漸近線 y=±(3/4)x")
def c_conic_eccentricity():
    # 離心率 e=c/a：橢圓 0<e<1、拋物線 e=1、雙曲線 e>1
    a, b = 5, 3; c = sp.sqrt(a**2 - b**2)            # 橢圓 x²/25+y²/9=1：c=4
    assert c == 4 and sp.Rational(c, a) == sp.Rational(4, 5) and sp.Rational(4, 5) < 1
    a, b = 5, 4; c = sp.sqrt(a**2 - b**2)            # 橢圓 x²/25+y²/16=1：c=3、e=3/5
    assert c == 3 and sp.Rational(c, a) == sp.Rational(3, 5)
    a, b = 4, 3; c = sp.sqrt(a**2 + b**2)            # 雙曲線 x²/16−y²/9=1：c=5、e=5/4
    assert c == 5 and sp.Rational(c, a) == sp.Rational(5, 4) and sp.Rational(5, 4) > 1
    return _ok("conic.eccentricity", "離心率 e=c/a：橢圓 x²/25+y²/9=1 e=4/5<1、x²/25+y²/16=1 e=3/5；雙曲線 x²/16−y²/9=1 e=5/4>1；拋物線 e=1")
def c_conic_translation():
    # 平移：中心從原點移到 (h,k)；配方法把一般式化回標準式
    x, y = sp.symbols('x y')
    expr = x**2 + y**2 - 6*x + 4*y - 12                 # 圓一般式
    target = (x - 3)**2 + (y + 2)**2 - 25               # ⇒ 中心(3,−2)、r=5
    assert sp.expand(expr - target) == 0
    assert sp.sqrt(25) == 5
    a, b = 5, 3; c = sp.sqrt(a**2 - b**2); assert c == 4  # 平移橢圓 (x−2)²/25+(y+1)²/9=1
    V = sp.Point(7, -1)                                  # 右頂點 (2+5,−1)
    assert V.distance(sp.Point(6, -1)) + V.distance(sp.Point(-2, -1)) == 10  # 到兩焦和=2a
    assert sp.Point(6, -1).midpoint(sp.Point(-2, -1)) == sp.Point(2, -1)     # 中心=兩焦中點
    return _ok("conic.translation", "平移：x²+y²−6x+4y−12=0⇒(x−3)²+(y+2)²=25 中心(3,−2)、r=5；橢圓 (x−2)²/25+(y+1)²/9=1 中心(2,−1)、c=4、焦點(6,−1)&(−2,−1)、到兩焦和=2a=10")
def c_conic_line_intersection():
    # 直線與圓錐曲線的交點：代入消元成二次式，判別式定交點數
    x = sp.symbols('x')
    sec = sp.expand(x**2 + (x + 1)**2 - 25)              # 圓 x²+y²=25 ∩ 割線 y=x+1
    q = sp.simplify(sec / 2); assert sp.expand(q) == x**2 + x - 12
    assert 1**2 - 4*1*(-12) == 49                        # 判別式>0 ⇒ 兩交點
    assert sorted(sp.solve(q, x)) == [-4, 3]             # x=−4,3 ⇒ (−4,−3),(3,4)
    for xv in (-4, 3): assert xv**2 + (xv + 1)**2 == 25
    assert sp.solve(x**2, x) == [0]                      # 切線 y=5：x²=0 重根 ⇒ 一點(0,5)、判別式=0
    assert 0**2 + 5**2 == 25
    assert all(not r.is_real for r in sp.solve(x**2 + 36 - 25, x))  # y=6：x²=−11 無實解 ⇒ 判別式<0
    return _ok("conic.line-intersection", "x²+y²=25：割線 y=x+1⇒x²+x−12=0 判別式49>0 交(3,4)&(−4,−3)；切線 y=5 判別式=0 交(0,5)；y=6 判別式<0 無交點")
def c_conic_reflection_apply():
    # 圓錐曲線反射性質：拋物線平行光聚焦於焦點；橢圓一焦點射到另一焦點
    def ang(u, v):
        u = sp.Matrix(u); v = sp.Matrix(v)
        return sp.simplify(u.dot(v) / (sp.sqrt(u.dot(u)) * sp.sqrt(v.dot(v))))
    assert 2**2 == 4 * 1                                   # 拋物線 y²=4x 上 P(1,2)
    # 切線斜率 y'=2/y=1；切線方向(1,1) 與「平行軸(1,0)」及「P→F(0,−1)」夾角相等 ⇒ 平行光反射聚焦 F(1,0)
    c1 = abs(ang((1, 1), (1, 0))); c2 = abs(ang((1, 1), (0, -1)))
    assert sp.simplify(c1 - c2) == 0 and c1 == sp.sqrt(2) / 2
    # 橢圓 x²/25+y²/9=1 上 P(0,3)，切線水平；入射 F1(4,0)→P 方向(−4,3) 對水平鏡反射成(−4,−3)，自 P 行進抵 F2(−4,0)
    assert sp.Rational(0, 25) + sp.Rational(9, 9) == 1
    assert (0 + (-4), 3 + (-3)) == (-4, 0)
    assert sp.simplify(abs(ang((1, 0), (4, -3))) - abs(ang((1, 0), (-4, -3)))) == 0  # 兩焦線與切線等角
    # 雙曲線方向鎖（distractor 事實防回歸）：x²−y²=1 右支 P(√2,1)，由 F1(−√2,0) 射出的光反射後
    # 「好像從 F2(√2,0) 射出」(發散) —— 不是「射向一焦點」而是「從一焦點射出」
    s2 = sp.sqrt(2)
    P = sp.Matrix([s2, 1]); F1 = sp.Matrix([-s2, 0]); F2 = sp.Matrix([s2, 0])
    t = sp.Matrix([1, s2])                             # 切線方向 y'=x/y=√2
    d = P - F1                                         # 由 F1 射出、抵 P 的入射方向
    dref = sp.simplify(2 * (d.dot(t) / t.dot(t)) * t - d)  # 對切線反射 ⇒ (0,3)
    assert dref[0] == 0 and dref[1] > 0                # 反射後沿 +y
    assert sp.simplify((F2 - P)[0] * dref[1] - (F2 - P)[1] * dref[0]) == 0  # 反射線(向後延長)過 F2 ⇒ 好像從 F2 射出
    return _ok("conic.reflection-apply", "反射性質：拋物線 y²=4x 上 P(1,2) 切線使平行軸光(1,0)反射聚焦到 F(1,0)（與 PF 等角45°）；橢圓 x²/25+y²/9=1 上 P(0,3) 由 F1(4,0) 來的光反射到 F2(−4,0)；雙曲線 x²−y²=1 上由 F1 射出的光反射後好像從 F2 射出(發散)")

# ---------- complex 複數（6）----------
def c_cplx_definition_operations():
    I = sp.I
    assert sp.expand(I**2) == -1                                  # i²=−1
    assert sp.expand((3 + 2*I) + (1 + 4*I)) == 4 + 6*I            # 加
    assert sp.expand((3 + 2*I) - (1 + 4*I)) == 2 - 2*I            # 減
    assert sp.expand((3 + 2*I) * (1 + 4*I)) == -5 + 14*I          # 乘：3+14i+8i²=−5+14i
    # 除：有理化（乘共軛）(3+2i)/(1+2i)=(3+2i)(1−2i)/5=(7−4i)/5
    q = sp.simplify((3 + 2*I) / (1 + 2*I))
    assert q == sp.Rational(7, 5) - sp.Rational(4, 5)*I
    assert sp.simplify(q * (1 + 2*I) - (3 + 2*I)) == 0            # 驗證除法：商×除數=被除數
    return _ok("complex.definition-operations", "複數四則：i²=−1；(3+2i)+(1+4i)=4+6i；(3+2i)(1+4i)=−5+14i；(3+2i)/(1+2i)=(7−4i)/5（乘共軛有理化）")

def c_cplx_conjugate_modulus():
    I = sp.I
    z = 3 + 4*I
    assert sp.conjugate(z) == 3 - 4*I                            # 共軛 z̄=a−bi
    assert sp.Abs(z) == 5                                         # 模 |z|=√(3²+4²)=5
    assert sp.expand(z * sp.conjugate(z)) == 25                  # z·z̄=|z|²=25
    assert sp.expand(z * sp.conjugate(z)) == sp.Abs(z)**2
    # |z1 z2|=|z1||z2|
    z2 = 1 + 2*I
    assert sp.simplify(sp.Abs(z*z2) - sp.Abs(z)*sp.Abs(z2)) == 0
    return _ok("complex.conjugate-modulus", "共軛與模：z=3+4i, z̄=3−4i, |z|=5, z·z̄=25=|z|²；|z₁z₂|=|z₁||z₂|")

def c_cplx_plane():
    I = sp.I
    # 複數平面：z=a+bi ↔ 點(a,b)；模=到原點距離；加法=向量加
    z = 3 + 4*I
    pt = (sp.re(z), sp.im(z))
    assert pt == (3, 4)
    assert sp.sqrt(pt[0]**2 + pt[1]**2) == 5                     # 模=到原點距離
    # 加法對應向量加：(1+2i)+(3+i)=4+3i ↔ (1,2)+(3,1)=(4,3)
    s = (1 + 2*I) + (3 + I)
    assert (sp.re(s), sp.im(s)) == (4, 3) == (1 + 3, 2 + 1)
    assert sp.sqrt(sp.Integer(6)**2 + sp.Integer(8)**2) == 10        # (6,8)↔6+8i 到原點距離=10
    return _ok("complex.plane", "複數平面：3+4i↔點(3,4)，模=到原點距離5；(1+2i)+(3+i)=4+3i↔(1,2)+(3,1)=(4,3) 向量加；(6,8)↔6+8i 距離原點=10")

def c_cplx_polar_form():
    I = sp.I
    # 極式 z=r(cosθ+isinθ)，r=|z|，θ=arg
    z = 1 + I
    r = sp.Abs(z); th = sp.arg(z)
    assert r == sp.sqrt(2) and th == sp.pi/4
    assert sp.simplify(r*(sp.cos(th) + I*sp.sin(th)) - z) == 0   # 極式還原
    z2 = 1 + sp.sqrt(3)*I
    assert sp.Abs(z2) == 2 and sp.arg(z2) == sp.pi/3
    assert sp.simplify(2*(sp.cos(sp.pi/3) + I*sp.sin(sp.pi/3)) - z2) == 0
    return _ok("complex.polar-form", "極式 z=r(cosθ+isinθ)：1+i→r=√2,θ=π/4；1+√3i→r=2,θ=π/3（還原驗證）")

def c_cplx_de_moivre():
    I = sp.I
    # 棣美弗 (r(cosθ+isinθ))ⁿ=rⁿ(cos nθ+i sin nθ)
    # (1+i)⁸：r=√2,θ=π/4 → (√2)⁸(cos2π+isin2π)=16·1=16
    assert sp.expand((1 + I)**8) == 16
    r, th, n = sp.sqrt(2), sp.pi/4, 8
    assert sp.simplify(r**n*(sp.cos(n*th) + I*sp.sin(n*th)) - 16) == 0
    # (cosθ+isinθ)²=cos2θ+isin2θ，θ=π/6
    th2 = sp.pi/6
    lhs = sp.expand((sp.cos(th2) + I*sp.sin(th2))**2)
    assert sp.simplify(lhs - (sp.cos(2*th2) + I*sp.sin(2*th2))) == 0
    # 單位圓旋轉鎖（figure）：(cos30°+isin30°)³=cos90°+isin90°=i（輻角 30→60→90）
    th30 = sp.pi/6
    assert sp.simplify((sp.cos(th30) + I*sp.sin(th30))**3 - I) == 0
    # Q4 鎖：(cos20°+isin20°)⁹=cos180°+isin180°=−1
    th20 = sp.pi*sp.Rational(20, 180)
    assert sp.simplify((sp.cos(th20) + I*sp.sin(th20))**9 - (-1)) == 0
    return _ok("complex.de-moivre", "棣美弗：(1+i)⁸=16（r=√2,θ=π/4,n=8→16(cos2π+isin2π)）；(cosθ+isinθ)²=cos2θ+isin2θ；(cos30°+isin30°)³=i；(cos20°+isin20°)⁹=−1")

def c_cplx_roots_of_unity():
    I = sp.I
    # n 次單位根 = cos(2kπ/n)+i sin(2kπ/n)，k=0..n−1；zⁿ=1；和=0（n≥2）；模皆1
    n = 3
    roots = [sp.simplify(sp.cos(2*sp.pi*k/n) + I*sp.sin(2*sp.pi*k/n)) for k in range(n)]
    assert sp.simplify(roots[1] - (sp.Rational(-1, 2) + sp.sqrt(3)/2*I)) == 0   # ω
    assert sp.simplify(roots[2] - (sp.Rational(-1, 2) - sp.sqrt(3)/2*I)) == 0   # ω²
    for z in roots:
        assert sp.simplify(z**n - 1) == 0                        # 每根 zⁿ=1
        assert sp.simplify(sp.Abs(z) - 1) == 0                   # 模=1（在單位圓上）
    assert sp.simplify(sum(roots)) == 0                          # 1+ω+ω²=0
    # 6 次單位根鎖（Q4）：6 根都在單位圓上、z⁶=1、相鄰相隔 360°/6=60°、和=0
    assert sp.Integer(360) / 6 == 60
    roots6 = [sp.simplify(sp.cos(2*sp.pi*k/6) + I*sp.sin(2*sp.pi*k/6)) for k in range(6)]
    for z in roots6:
        assert sp.simplify(z**6 - 1) == 0 and sp.simplify(sp.Abs(z) - 1) == 0
    assert sp.simplify(sum(roots6)) == 0
    return _ok("complex.roots-of-unity", "單位根：z³=1 的三根 1、−½+√3/2i、−½−√3/2i，各模=1 在單位圓等分、和=0；z⁶=1 六根相隔60°、和=0")

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
    # 半衰期衰減：N=N₀(½)^(t/T)。N₀=80, T=5：t=5→40, t=10(2T)→20, t=15(3T)→10；剩餘比例 2T→¼
    assert (0.5)**2 == 0.25
    assert 80*(0.5)**(5/5) == 40 and 80*(0.5)**(10/5) == 20 and 80*(0.5)**(15/5) == 10
    # 指數成長（倍增）：N=N₀·2^(t/D)。N₀=100, D=20min：60min=3 倍增 → 800
    assert 100*2**(60/20) == 800 and 100*2**(20/20) == 200
    return _ok("finmath.growth-decay-model", "半衰期 80→40→20→10（2T 剩¼）；倍增 100·2³=800")
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
    "calc.integration-by-parts": c_integration_parts,
    "calc.exp-log-calculus": c_exp_log_calc, "calc.trig-calculus": c_trig_calc,
    "vector.plane-definition": c_vec_plane_def,
    "vector.plane-add-sub": c_vec_plane_addsub,
    "vector.linear-combination": c_vec_linear_combination,
    "vector.component": c_vec_component,
    "vector.dot-product": c_vec_dot_product,
    "vector.projection": c_vec_projection,
    "vector.cross-product": c_vec_cross_product,
    "vector.space-vector": c_vec_space_vector,
    "vector.space-dot-product": c_vec_space_dot_product,
    "vector.triangle-tetra-area": c_vec_triangle_tetra_area,
    "vector.geometry-apply": c_vec_geometry_apply,
    "conic.parabola": c_conic_parabola,
    "conic.ellipse": c_conic_ellipse,
    "conic.hyperbola": c_conic_hyperbola,
    "conic.eccentricity": c_conic_eccentricity,
    "conic.translation": c_conic_translation,
    "conic.line-intersection": c_conic_line_intersection,
    "conic.reflection-apply": c_conic_reflection_apply,
    "complex.definition-operations": c_cplx_definition_operations,
    "complex.conjugate-modulus": c_cplx_conjugate_modulus,
    "complex.plane": c_cplx_plane,
    "complex.polar-form": c_cplx_polar_form,
    "complex.de-moivre": c_cplx_de_moivre,
    "complex.roots-of-unity": c_cplx_roots_of_unity,
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
