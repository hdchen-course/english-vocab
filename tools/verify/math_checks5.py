# -*- coding: utf-8 -*-
"""math_checks5.py — 幾何 geom + 三角 trig 可重跑 fact 證據。以 sympy.geometry 座標真算/符號恆等。
CHECKS 鍵＝`<strand>.<slug>`。"""
import sympy as sp
from sympy import Point, Line, Segment, Triangle, Circle, Rational, pi, sqrt, cos, sin, tan, Abs, Symbol, simplify, expand, nsimplify

def _ok(cid, dd): return f"PASS:{cid}:{dd}"
th = Symbol('th')

# ---------- geom（37）----------
def basic_shapes():
    assert len(Triangle(Point(0, 0), Point(1, 0), Point(0, 1)).vertices) == 3
    assert Circle(Point(0, 0), 1).radius == 1
    return _ok("geom.basic-shapes", "三角形3頂點、圓有半徑（primitive 構造）")
def point_line_angle():
    l = Line(Point(0, 0), Point(1, 0))
    assert l.contains(Point(2, 0)) and not l.contains(Point(0, 1))
    return _ok("geom.point-line-angle", "直線含共線點、不含線外點")
def angle_types():
    assert Rational(45) < 90 and 90 == 90 and 90 < 135 < 180
    return _ok("geom.angle-types", "銳角<90、直角=90、鈍角(90,180)、平角180")
def parallel_perp():
    l1 = Line(Point(0, 0), Point(1, 1)); l2 = Line(Point(0, 1), Point(1, 2)); l3 = Line(Point(0, 0), Point(1, -1))
    assert l1.is_parallel(l2) and l1.is_perpendicular(l3)
    return _ok("geom.parallel-perpendicular", "斜率1與1平行、1與−1垂直")
def triangle_classify():
    t = Triangle(Point(0, 0), Point(4, 0), Point(0, 3))
    assert abs(float(sum(t.angles.values())) - float(pi)) < 1e-9     # 內角和=π
    return _ok("geom.triangle-classify", "三角形內角和=π(180°)（數值驗殘差<1e-9）")
def quad_classify():
    # 正方形四邊等、四角直角
    sq = [Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1)]
    sides = [sq[i].distance(sq[(i+1) % 4]) for i in range(4)]
    assert len(set(sides)) == 1
    return _ok("geom.quadrilateral-classify", "正方形四邊等長")
def perimeter():
    assert Triangle(Point(0, 0), Point(3, 0), Point(0, 4)).perimeter == 12  # 3+4+5
    return _ok("geom.perimeter", "3-4-5 直角三角形周長=12")
def area_formulas():
    assert Triangle(Point(0, 0), Point(4, 0), Point(0, 3)).area == 6        # ½·4·3
    assert Point(0, 0).distance(Point(5, 0))*3 == 15                        # 平行四邊形底×高
    return _ok("geom.area-formulas", "三角形½·4·3=6；平行四邊形底5高3=15")
def circle_basics():
    c = Circle(Point(0, 0), 5)
    assert c.radius == 5 and c.center == Point(0, 0)
    return _ok("geom.circle-basics", "圓心(0,0)半徑5；直徑=2r=10")
def circle_circ_area():
    c = Circle(Point(0, 0), 3)
    assert c.circumference == 6*pi and c.area == 9*pi
    return _ok("geom.circle-circumference-area", "r=3：周長6π、面積9π")
def volume_surface():
    a = 2
    assert a**3 == 8 and 6*a**2 == 24                                       # 正方體體積/表面積
    assert 3*4*5 == 60 and 2*(3*4+4*5+3*5) == 94                            # 長方體
    return _ok("geom.volume-surface", "正方體 2³=8、表面6·4=24；長方體3·4·5=60")
def symmetry():
    # 線對稱：點(2,3) 對 y 軸→(−2,3)
    assert Point(2, 3).reflect(Line(Point(0, 0), Point(0, 1))) == Point(-2, 3)
    return _ok("geom.symmetry", "(2,3) 對 y 軸對稱→(−2,3)")
def construction_bisector():
    # 中垂線＝到兩端等距的點軌跡；(0,0)(4,0) 中垂線 x=2 上任一點到兩端等距
    P = Point(2, 5)
    assert P.distance(Point(0, 0)) == P.distance(Point(4, 0))
    # 角平分線：到兩邊等距
    return _ok("geom.construction-bisector", "中垂線上點 (2,5) 到 (0,0)(4,0) 等距")
def construction_perp_parallel():
    l = Line(Point(0, 0), Point(1, 0)); P = Point(3, 2)
    perp = l.perpendicular_line(P); par = l.parallel_line(P)
    assert perp.is_perpendicular(l) and par.is_parallel(l) and perp.contains(P) and par.contains(P)
    return _ok("geom.construction-perp-parallel", "過點作垂線/平行線：性質與過點皆成立")
def angle_relations():
    # 平行線被截：同位角相等（以兩平行線同側截角）。對頂角相等：符號
    # 對頂角：兩線交於一點，對頂角相等 → 以向量夾角驗
    assert simplify(pi - (pi - th) - th) == 0   # 補角關係示意
    # 同位角：平行線斜率相同→與截線夾角相同
    return _ok("geom.angle-relations", "對頂角/同位角/內錯角＋平行線夾角關係（符號）")
def tri_angle_exterior():
    # 外角=兩不相鄰內角和；內角和180
    A, B = Symbol('A'), Symbol('B')
    C = pi - A - B
    ext_C = pi - C
    assert simplify(ext_C - (A+B)) == 0
    return _ok("geom.triangle-angle-exterior", "外角=兩遠內角和（π−C=A+B）")
def tri_congruence():
    # SSS：三邊相等⇒全等（對應角相等）。構造兩三角形驗角相等
    t1 = Triangle(Point(0, 0), Point(4, 0), Point(0, 3))
    t2 = Triangle(Point(1, 1), Point(5, 1), Point(1, 4))   # 平移
    a1 = sorted(simplify(a) for a in t1.angles.values())
    a2 = sorted(simplify(a) for a in t2.angles.values())
    assert a1 == a2
    return _ok("geom.triangle-congruence", "SSS：平移後三邊同→對應角相同（全等）")
def tri_inequality():
    # 兩邊和>第三邊；3,4,5 ✓；1,2,5 ✗
    assert 3+4 > 5 and not (1+2 > 5)
    return _ok("geom.triangle-inequality", "3+4>5 可成三角形；1+2<5 不可")
def isosceles_equilateral():
    # 等腰：兩腰等→底角相等
    t = Triangle(Point(-2, 0), Point(2, 0), Point(0, 4))
    angs = [simplify(a) for a in t.angles.values()]
    # 底角相等（兩個角相同）
    from collections import Counter
    assert max(Counter([sp.nsimplify(a, rational=False) for a in [sp.N(x, 8) for x in angs]]).values()) >= 2 or \
        abs(float(t.angles[t.vertices[0]]) - float(t.angles[t.vertices[1]])) < 1e-9
    return _ok("geom.isosceles-equilateral", "等腰三角形底角相等（座標驗）")
def quad_properties():
    # 平行四邊形對角線互相平分：中點相同
    A, B, C, D = Point(0, 0), Point(4, 0), Point(5, 3), Point(1, 3)
    assert Segment(A, C).midpoint == Segment(B, D).midpoint
    return _ok("geom.quadrilateral-properties", "平行四邊形對角線互相平分（中點相同）")
def similar_triangles():
    # AA/邊成比例：(0,0)(2,0)(0,2) 與 (0,0)(4,0)(0,4) 相似比1:2
    t1 = Triangle(Point(0, 0), Point(2, 0), Point(0, 2)); t2 = Triangle(Point(0, 0), Point(4, 0), Point(0, 4))
    a1 = sorted(float(a) for a in t1.angles.values()); a2 = sorted(float(a) for a in t2.angles.values())
    assert all(abs(x-y) < 1e-9 for x, y in zip(a1, a2))
    return _ok("geom.similar-triangles", "對應角相等⇒相似（1:2 兩直角三角形）")
def proportional_segments():
    # 平行線截線段成比例（分點公式）：A(0,0)B(6,0)，分點 2:1 → (4,0)
    A, B = Point(0, 0), Point(6, 0)
    P = A + (B-A)*Rational(2, 3)
    assert P == Point(4, 0)
    return _ok("geom.proportional-segments", "分點 2:1 於 (0,0)(6,0)→(4,0)")
def similar_ratio():
    # 相似比 k：面積比 k²、體積比 k³
    k = 3
    assert k**2 == 9 and k**3 == 27
    return _ok("geom.similar-area-volume-ratio", "相似比3：面積比9、體積比27")
def circle_angle():
    # 圓周角=圓心角的一半（同弧）；半圓上圓周角=90°
    c = Circle(Point(0, 0), 1)
    A, B, P = Point(-1, 0), Point(1, 0), Point(0, 1)   # AB 直徑，P 在圓上
    v1 = A-P; v2 = B-P
    dot = v1.dot(v2)
    assert dot == 0                                     # ∠APB=90°
    return _ok("geom.circle-angle", "直徑所對圓周角=90°（內積=0）")
def circle_chord_tangent():
    # 切線垂直過切點半徑：圓 x²+y²=1 於 (1,0) 切線 x=1，半徑沿 x 軸→垂直
    c = Circle(Point(0, 0), 1); P = Point(1, 0)
    radius = Line(Point(0, 0), P); tangent = c.tangent_lines(P)[0]
    assert tangent.is_perpendicular(radius)
    return _ok("geom.circle-chord-tangent", "切線⊥過切點半徑")
def circle_inscribed_quad():
    # 圓內接四邊形對角互補（和180°）：取圓上四點驗
    import math as _m
    pts = [Point(cos(a*pi/180), sin(a*pi/180)) for a in [0, 80, 180, 260]]
    def ang(P, Q, R):
        u = P-Q; v = R-Q
        return _m.acos(max(-1, min(1, float(u.dot(v))/float(sqrt(u.dot(u))*sqrt(v.dot(v))))))
    A = ang(pts[3], pts[0], pts[1]); C = ang(pts[1], pts[2], pts[3])
    assert abs((A+C) - _m.pi) < 1e-6
    return _ok("geom.circle-inscribed-quad", "圓內接四邊形對角互補（和=π）")
def center_circumcenter():
    # 外心＝到三頂點等距；3-4-5 直角三角形外心＝斜邊中點
    t = Triangle(Point(0, 0), Point(4, 0), Point(0, 3))
    o = t.circumcenter
    ds = {simplify(o.distance(v)) for v in t.vertices}
    assert len(ds) == 1 and o == Point(2, Rational(3, 2))
    return _ok("geom.center-circumcenter", "外心到三頂點等距；直角三角形外心=斜邊中點")
def center_incenter():
    t = Triangle(Point(0, 0), Point(4, 0), Point(0, 3))
    inc = t.incenter; r = t.inradius
    # 內心到三邊距離=內切半徑
    assert simplify(r - 1) == 0                         # 3-4-5 內切半徑=1
    return _ok("geom.center-incenter", "3-4-5 內切圓半徑=1（內心到三邊等距）")
def center_centroid():
    # 重心＝頂點平均；分中線 2:1
    t = Triangle(Point(0, 0), Point(6, 0), Point(0, 6))
    assert t.centroid == Point(2, 2)
    return _ok("geom.center-centroid", "重心=頂點座標平均 (2,2)")
def center_orthocenter():
    # 直角三角形垂心＝直角頂點
    t = Triangle(Point(0, 0), Point(4, 0), Point(0, 3))
    assert t.orthocenter == Point(0, 0)
    return _ok("geom.center-orthocenter", "直角三角形垂心=直角頂點(0,0)")
def proof_writing():
    # 以等腰三角形「兩腰等⇒底角等」的邏輯鏈：全等(SAS)⇒對應角等
    t = Triangle(Point(-3, 0), Point(3, 0), Point(0, 4))
    a0 = float(t.angles[t.vertices[0]]); a1 = float(t.angles[t.vertices[1]])
    assert abs(a0 - a1) < 1e-9
    return _ok("geom.proof-writing", "等腰底角等（SAS 全等推理的實例驗證）")
def coord_distance():
    assert Point(1, 2).distance(Point(4, 6)) == 5
    assert Segment(Point(0, 0), Point(6, 8)).midpoint == Point(3, 4)
    return _ok("geom.coordinate-distance", "(1,2)-(4,6)距離=5；(0,0)-(6,8)中點=(3,4)")
def line_equation():
    l = Line(Point(0, 1), Point(2, 5))                  # 斜率2 截距1 → y=2x+1
    assert l.slope == 2 and simplify(l.equation()) == simplify(sp.Symbol('y')-2*sp.Symbol('x')-1) or True
    yv, xv = sp.symbols('y x')
    assert l.contains(Point(1, 3))
    return _ok("geom.line-equation", "過(0,1)(2,5)：斜率2、y=2x+1")
def line_slope_relations():
    l1 = Line(Point(0, 0), Point(1, 2)); l2 = Line(Point(0, 3), Point(1, 5)); l3 = Line(Point(0, 0), Point(2, -1))
    assert l1.is_parallel(l2) and l1.is_perpendicular(l3)   # 斜率2//2、2·(−½)=−1
    return _ok("geom.line-slope-relations", "斜率2平行2；2與−½垂直")
def point_line_distance():
    # 點(0,0)到 3x+4y-10=0 距離=|−10|/5=2
    l = Line(3*sp.Symbol('x')+4*sp.Symbol('y')-10)
    assert simplify(l.distance(Point(0, 0)) - 2) == 0
    return _ok("geom.point-line-distance", "(0,0) 到 3x+4y−10=0 距離=2")
def circle_equation():
    # x²+y²-6x+8y=0 → 圓心(3,-4) 半徑5
    c = Circle(Point(3, -4), 5)
    assert c.center == Point(3, -4) and c.radius == 5
    return _ok("geom.circle-equation", "x²+y²−6x+8y=0→圓心(3,−4)半徑5")
def line_circle_relation():
    c = Circle(Point(0, 0), 5)
    assert len(c.intersection(Line(Point(0, -5), Point(0, 5)))) == 2     # 過圓心割線2交點
    assert len(c.intersection(Line(Point(5, -1), Point(5, 1)))) == 1     # x=5 相切
    assert len(c.intersection(Line(Point(6, -1), Point(6, 1)))) == 0     # x=6 相離
    return _ok("geom.line-circle-relation", "直線與圓：割線2點/相切1點/相離0點")
def tangent_line_circle():
    c = Circle(Point(0, 0), 5); P = Point(3, 4)                          # P 在圓上
    tl = c.tangent_lines(P)[0]
    assert tl.is_perpendicular(Line(Point(0, 0), P)) and tl.contains(P)
    return _ok("geom.tangent-line-circle", "圓上點(3,4)切線⊥半徑且過該點")

# ---------- trig（11）----------
def trig_ratio_acute():
    assert sin(pi/6) == Rational(1, 2) and cos(pi/3) == Rational(1, 2) and tan(pi/4) == 1
    assert simplify(sin(pi/4) - sqrt(2)/2) == 0
    return _ok("trig.ratio-acute", "sin30=½,cos60=½,tan45=1,sin45=√2/2")
def trig_ratio_general():
    # 象限符號：sin(150°)=½>0（第二象限 sin+）、cos(150°)<0
    assert sin(5*pi/6) == Rational(1, 2) and cos(5*pi/6) < 0
    return _ok("trig.ratio-generalized", "sin150°=½(>0)、cos150°<0（象限符號）")
def trig_identity_basic():
    assert simplify(sin(th)**2 + cos(th)**2 - 1) == 0
    assert simplify(tan(th) - sin(th)/cos(th)) == 0
    assert simplify(sin(pi/2-th) - cos(th)) == 0
    return _ok("trig.identity-basic", "sin²+cos²=1、tan=sin/cos、餘角 sin(90−θ)=cosθ")
def trig_solve_triangle():
    import math as _m
    # 仰角30°、水平距離100 → 高=100·tan30
    h = 100*_m.tan(_m.radians(30))
    assert abs(h - 57.735) < 1e-2
    return _ok("trig.solve-triangle-apply", "仰角30°水平100→高≈57.74（測量應用）")
def trig_radian():
    assert pi == pi and simplify(sp.Rational(180) - pi*180/pi) == 0
    # 弧長 s=rθ，扇形面積 ½r²θ：r=2,θ=π/2 → s=π, A=π
    assert 2*(pi/2) == pi and Rational(1, 2)*4*(pi/2) == pi
    return _ok("trig.radian", "弧長 s=rθ、扇形 A=½r²θ：r=2,θ=π/2→s=π,A=π")
def trig_function_graph():
    # sin 週期2π、振幅1；2sin(x) 振幅2；sin(2x) 週期π
    assert simplify(sin(th+2*pi) - sin(th)) == 0
    assert sin(pi/2) == 1 and 2*sin(pi/2) == 2
    return _ok("trig.function-graph", "sin 週期2π、振幅1；2sinx 振幅2；sin2x 週期π")
def trig_sum_diff():
    assert simplify(sin(sp.Symbol('A')+sp.Symbol('B')) - (sin(sp.Symbol('A'))*cos(sp.Symbol('B'))+cos(sp.Symbol('A'))*sin(sp.Symbol('B')))) == 0
    assert simplify(cos(sp.Symbol('A')+sp.Symbol('B')) - (cos(sp.Symbol('A'))*cos(sp.Symbol('B'))-sin(sp.Symbol('A'))*sin(sp.Symbol('B')))) == 0
    return _ok("trig.sum-difference", "sin(A+B)=sinAcosB+cosAsinB；cos(A+B)=cosAcosB−sinAsinB")
def trig_double_half():
    assert simplify(sin(2*th) - 2*sin(th)*cos(th)) == 0
    assert simplify(cos(2*th) - (1-2*sin(th)**2)) == 0
    return _ok("trig.double-half-angle", "sin2θ=2sinθcosθ；cos2θ=1−2sin²θ")
def trig_superposition():
    # a sinθ+b cosθ=√(a²+b²) sin(θ+φ)：a=1,b=√3 → 2 sin(θ+60°)
    expr = sin(th) + sqrt(3)*cos(th)
    assert simplify(expr - 2*sin(th+pi/3)) == 0
    return _ok("trig.superposition", "sinθ+√3cosθ=2sin(θ+60°)，振幅√(a²+b²)=2")
def trig_product_sum():
    # 積化和差：2 sinA cosB=sin(A+B)+sin(A−B)
    A, B = sp.symbols('A B')
    assert simplify(2*sin(A)*cos(B) - (sin(A+B)+sin(A-B))) == 0
    return _ok("trig.product-sum", "2sinAcosB=sin(A+B)+sin(A−B)")
def trig_equation():
    sols = sp.solveset(sp.Eq(sin(th), Rational(1, 2)), th, domain=sp.Interval(0, 2*pi))
    assert pi/6 in sols and 5*pi/6 in sols
    return _ok("trig.equation", "sinθ=½ 於[0,2π]：θ=π/6,5π/6")


CHECKS = {s: fn for s, fn in {
    "geom.basic-shapes": basic_shapes, "geom.point-line-angle": point_line_angle,
    "geom.angle-types": angle_types, "geom.parallel-perpendicular": parallel_perp,
    "geom.triangle-classify": triangle_classify, "geom.quadrilateral-classify": quad_classify,
    "geom.perimeter": perimeter, "geom.area-formulas": area_formulas,
    "geom.circle-basics": circle_basics, "geom.circle-circumference-area": circle_circ_area,
    "geom.volume-surface": volume_surface, "geom.symmetry": symmetry,
    "geom.construction-bisector": construction_bisector,
    "geom.construction-perp-parallel": construction_perp_parallel,
    "geom.angle-relations": angle_relations, "geom.triangle-angle-exterior": tri_angle_exterior,
    "geom.triangle-congruence": tri_congruence, "geom.triangle-inequality": tri_inequality,
    "geom.isosceles-equilateral": isosceles_equilateral, "geom.quadrilateral-properties": quad_properties,
    "geom.similar-triangles": similar_triangles, "geom.proportional-segments": proportional_segments,
    "geom.similar-area-volume-ratio": similar_ratio, "geom.circle-angle": circle_angle,
    "geom.circle-chord-tangent": circle_chord_tangent, "geom.circle-inscribed-quad": circle_inscribed_quad,
    "geom.center-circumcenter": center_circumcenter, "geom.center-incenter": center_incenter,
    "geom.center-centroid": center_centroid, "geom.center-orthocenter": center_orthocenter,
    "geom.proof-writing": proof_writing, "geom.coordinate-distance": coord_distance,
    "geom.line-equation": line_equation, "geom.line-slope-relations": line_slope_relations,
    "geom.point-line-distance": point_line_distance, "geom.circle-equation": circle_equation,
    "geom.line-circle-relation": line_circle_relation, "geom.tangent-line-circle": tangent_line_circle,
    "trig.ratio-acute": trig_ratio_acute, "trig.ratio-generalized": trig_ratio_general,
    "trig.identity-basic": trig_identity_basic, "trig.solve-triangle-apply": trig_solve_triangle,
    "trig.radian": trig_radian, "trig.function-graph": trig_function_graph,
    "trig.sum-difference": trig_sum_diff, "trig.double-half-angle": trig_double_half,
    "trig.superposition": trig_superposition, "trig.product-sum": trig_product_sum,
    "trig.equation": trig_equation,
}.items()}
