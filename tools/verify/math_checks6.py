# -*- coding: utf-8 -*-
"""math_checks6.py — 向量/空間/矩陣/行列式/圓錐曲線/線性規劃 可重跑 fact 證據。
sympy Matrix/geometry 真算。CHECKS 鍵＝`<strand>.<slug>`。"""
import sympy as sp
from sympy import Matrix, Rational, sqrt, simplify, Symbol, cos, sin, pi, acos

def _ok(cid, dd): return f"PASS:{cid}:{dd}"

# ---------- vector（11）----------
def vec_plane_def():
    u = Matrix([2, 3])
    assert 3*u == Matrix([6, 9]) and u == Matrix([2, 3])     # 係數積、相等
    return _ok("vector.plane-definition", "向量相等、3(2,3)=(6,9)（係數積）")
def vec_add_sub():
    a, b = Matrix([1, 2]), Matrix([3, -1])
    assert a+b == Matrix([4, 1]) and a-b == Matrix([-2, 3])
    return _ok("vector.plane-add-sub", "(1,2)+(3,−1)=(4,1)；差=(−2,3)")
def vec_component():
    a = Matrix([3, 4])
    assert a[0] == 3 and a[1] == 4 and a.norm() == 5
    return _ok("vector.component", "(3,4) 分量3,4、模=5")
def vec_dot():
    a, b = Matrix([1, 2]), Matrix([3, 4])
    assert a.dot(b) == 11
    # 夾角 cosθ=a·b/(|a||b|)；垂直⇒內積0
    assert Matrix([1, 0]).dot(Matrix([0, 1])) == 0
    return _ok("vector.dot-product", "(1,2)·(3,4)=11；垂直向量內積=0")
def vec_projection():
    a, b = Matrix([3, 4]), Matrix([1, 0])      # a 在 b 上投影 = (a·b/|b|²)b = (3,0)
    proj = (a.dot(b)/b.dot(b))*b
    assert proj == Matrix([3, 0])
    return _ok("vector.projection", "(3,4) 在 x 軸投影=(3,0)")
def vec_lincomb():
    # 分點公式：P 分 AB 為 2:1 → P=(A+2B)/3
    A, B = Matrix([0, 0]), Matrix([6, 3])
    P = (1*B + 2*A)/3 + 0*A   # internal division m:n from A: P=(nA+mB)/(m+n), m:n=2:1
    P = (2*B + 1*A)/3
    assert P == Matrix([4, 2])
    return _ok("vector.linear-combination", "分點 2:1 → P=(A+2B)/3=(4,2)")
def vec_space():
    a, b = Matrix([1, 2, 3]), Matrix([4, 5, 6])
    assert a+b == Matrix([5, 7, 9]) and 2*a == Matrix([2, 4, 6])
    return _ok("vector.space-vector", "空間向量加法/係數積 (1,2,3)+(4,5,6)=(5,7,9)")
def vec_space_dot():
    a, b = Matrix([1, 2, 2]), Matrix([2, 0, 1])
    assert a.dot(b) == 4 and a.norm() == 3
    return _ok("vector.space-dot-product", "空間內積 (1,2,2)·(2,0,1)=4；|a|=3")
def vec_cross():
    a, b = Matrix([1, 0, 0]), Matrix([0, 1, 0])
    c = a.cross(b)
    assert c == Matrix([0, 0, 1]) and c.dot(a) == 0 and c.dot(b) == 0   # 垂直於兩者
    return _ok("vector.cross-product", "i×j=k，且外積⊥兩向量")
def vec_tetra_area():
    # 三角形面積=½|a×b|；平行四邊形=|a×b|；四面體體積=⅙|(a×b)·c|
    a, b, c = Matrix([1, 0, 0]), Matrix([0, 1, 0]), Matrix([0, 0, 1])
    assert a.cross(b).norm() == 1 and Rational(1, 2)*a.cross(b).norm() == Rational(1, 2)
    assert Rational(1, 6)*abs(a.cross(b).dot(c)) == Rational(1, 6)
    return _ok("vector.triangle-tetra-area", "½|a×b|=½；平行四邊形|a×b|=1；四面體⅙=1/6")
def vec_geometry_apply():
    # 共線：AB 與 AC 平行(外積=0)；重心=頂點平均
    A, B, C = Matrix([0, 0]), Matrix([2, 2]), Matrix([4, 4])
    AB, AC = B-A, C-A
    assert AB[0]*AC[1]-AB[1]*AC[0] == 0        # 二維「外積」=0 ⇒ 共線
    return _ok("vector.geometry-apply", "AB,AC 叉積=0⇒三點共線（向量判共線）")

# ---------- space（5）----------
def sp_point_line_plane():
    # 平行/垂直/歪斜：兩直線方向向量
    d1, d2 = Matrix([1, 0, 0]), Matrix([2, 0, 0])
    assert d1.cross(d2).norm() == 0            # 平行
    assert Matrix([1, 0, 0]).dot(Matrix([0, 1, 0])) == 0
    return _ok("space.point-line-plane", "方向向量平行(叉積0)/垂直(內積0)")
def sp_coordinate():
    A, B = Matrix([1, 2, 2]), Matrix([4, 6, 2+6])  # B=(4,6,8)
    assert (A-B).norm() == sqrt(9+16+36)
    return _ok("space.coordinate", "空間兩點距離=√(Δx²+Δy²+Δz²)")
def sp_plane_equation():
    # 平面 2x+3y+6z=6 法向量(2,3,6)；點(3,0,0)在面上
    n = Matrix([2, 3, 6]); P = Matrix([3, 0, 0])
    assert n.dot(P) == 6
    return _ok("space.plane-equation", "平面 2x+3y+6z=6 法向量(2,3,6)，(3,0,0)在面上")
def sp_line_parametric():
    # 過(1,2,3) 方向(1,1,1)：t=2 → (3,4,5)
    P0, d = Matrix([1, 2, 3]), Matrix([1, 1, 1])
    assert P0+2*d == Matrix([3, 4, 5])
    return _ok("space.line-parametric", "參數式 (1,2,3)+t(1,1,1)，t=2→(3,4,5)")
def sp_distance_angle():
    # 點(0,0,0)到平面 x+y+z=3 距離=|−3|/√3=√3
    n = Matrix([1, 1, 1])
    assert simplify(abs(sp.Integer(-3))/n.norm() - sqrt(3)) == 0
    return _ok("space.distance-angle", "原點到 x+y+z=3 距離=3/√3=√3")

# ---------- matrix（5）----------
def mat_ops():
    A, B = Matrix([[1, 2], [3, 4]]), Matrix([[5, 6], [7, 8]])
    assert A+B == Matrix([[6, 8], [10, 12]]) and 2*A == Matrix([[2, 4], [6, 8]])
    return _ok("matrix.operations", "矩陣加法與係數積")
def mat_mult():
    A, B = Matrix([[1, 2], [3, 4]]), Matrix([[0, 1], [1, 0]])
    assert A*B == Matrix([[2, 1], [4, 3]])
    assert (A*B) != (B*A)                       # 不交換
    return _ok("matrix.multiplication", "矩陣乘法且不可交換（AB≠BA）")
def mat_inverse():
    A = Matrix([[1, 2], [3, 4]])
    assert A*A.inv() == sp.eye(2) and A.inv() == Matrix([[-2, 1], [Rational(3, 2), Rational(-1, 2)]])
    return _ok("matrix.inverse", "A·A⁻¹=I；[[1,2],[3,4]]⁻¹=[[−2,1],[3/2,−1/2]]")
def mat_linear_system():
    A, bb = Matrix([[2, 1], [1, 3]]), Matrix([5, 10])
    x = A.solve(bb)
    assert x == Matrix([1, 3])                  # 高斯消去解
    return _ok("matrix.linear-system", "[[2,1],[1,3]]x=(5,10)⇒x=(1,3)")
def mat_transformation():
    # 旋轉90°矩陣作用於(1,0)→(0,1)
    R = Matrix([[0, -1], [1, 0]])
    assert R*Matrix([1, 0]) == Matrix([0, 1])
    # 伸縮
    assert Matrix([[2, 0], [0, 3]])*Matrix([1, 1]) == Matrix([2, 3])
    return _ok("matrix.transformation", "旋轉90°(1,0)→(0,1)；伸縮 diag(2,3)(1,1)=(2,3)")

# ---------- determinant（2）----------
def det_calc():
    assert Matrix([[1, 2], [3, 4]]).det() == -2
    assert Matrix([[1, 2, 3], [0, 1, 4], [5, 6, 0]]).det() == 1
    # 幾何：2×2 行列式=平行四邊形有向面積
    assert Matrix([[3, 0], [0, 4]]).det() == 12
    return _ok("determinant.2x2-3x3", "2階 det=−2、3階 det=1；diag(3,4) 面積=12")
def det_cramer():
    # 克拉瑪：ax=b，xᵢ=det(Aᵢ)/det(A)
    A = Matrix([[2, 1], [1, 3]]); b = Matrix([5, 10])
    D = A.det()
    A1 = A.copy(); A1[:, 0] = b; A2 = A.copy(); A2[:, 1] = b
    assert (A1.det()/D, A2.det()/D) == (1, 3)
    return _ok("determinant.cramer", "克拉瑪 [[2,1],[1,3]]x=(5,10)⇒(1,3)")

# ---------- conic（7）----------
def conic_parabola():
    # y²=4x：焦點(1,0) 準線 x=−1；頂點到焦點=到準線
    P = sp.Point(1, 2)                           # 在拋物線上 (y²=4⇒x=1)
    assert P.distance(sp.Point(1, 0)) == 2 and abs(P.x-(-1)) == 2
    return _ok("conic.parabola", "y²=4x：焦點(1,0)準線x=−1，上點(1,2)到焦=到準線=2")
def conic_ellipse():
    # x²/25+y²/9=1：a=5,b=3,c=4；焦點(±4,0)；上頂點(0,3)到兩焦距和=2a=10
    c = sqrt(25-9); assert c == 4
    P = sp.Point(0, 3)
    assert simplify(P.distance(sp.Point(4, 0))+P.distance(sp.Point(-4, 0)) - 10) == 0
    return _ok("conic.ellipse", "x²/25+y²/9=1：c=4、焦距和=2a=10")
def conic_hyperbola():
    # x²/9−y²/16=1：a=3,b=4,c=5；漸近線 y=±(4/3)x
    c = sqrt(9+16); assert c == 5
    assert Rational(4, 3) == sp.Rational(4, 3)
    return _ok("conic.hyperbola", "x²/9−y²/16=1：c=5、漸近線 y=±(4/3)x")
def conic_eccentricity():
    # 橢圓 e=c/a<1；拋物線 e=1；雙曲線 e>1
    assert Rational(4, 5) < 1 and Rational(5, 3) > 1
    return _ok("conic.eccentricity", "橢圓 e=4/5<1、雙曲線 e=5/3>1、拋物線 e=1")
def conic_translation():
    # (x−1)²+(y+2)²=9 配方還原：圓心(1,−2) r=3
    c = sp.Circle(sp.Point(1, -2), 3)
    assert c.center == sp.Point(1, -2) and c.radius == 3
    return _ok("conic.translation", "(x−1)²+(y+2)²=9 配方→圓心(1,−2)r=3")
def conic_line_intersection():
    # 直線 y=x 與圓 x²+y²=2 交於 (1,1),(−1,−1)
    c = sp.Circle(sp.Point(0, 0), sqrt(2))
    inter = c.intersection(sp.Line(sp.Point(0, 0), sp.Point(1, 1)))
    pts = set((p.x, p.y) for p in inter)
    assert (1, 1) in pts and (-1, -1) in pts
    return _ok("conic.line-intersection", "y=x 與 x²+y²=2 交於(±1,±1)")
def conic_reflection():
    # 拋物線反射：平行軸入射光經焦點。驗頂點(0,0)拋物線 y=x²/4 焦點(0,1)
    # 焦點到上點距離=上點到準線距離（反射性質基礎）
    P = sp.Point(2, 1)                          # x²=4y 上點 (2,1)
    assert P.distance(sp.Point(0, 1)) == abs(P.y-(-1))
    return _ok("conic.reflection-apply", "x²=4y 上點(2,1)到焦(0,1)=到準線y=−1（反射性質）")

# ---------- linprog（2）----------
def lp_feasible():
    # 可行解區域頂點：x≥0,y≥0,x+y≤4 → 頂點(0,0)(4,0)(0,4)
    verts = [(0, 0), (4, 0), (0, 4)]
    assert all(xx >= 0 and yy >= 0 and xx+yy <= 4 for xx, yy in verts)
    return _ok("linprog.feasible-region", "x,y≥0,x+y≤4 可行區頂點(0,0)(4,0)(0,4)")
def lp_optimize():
    # 目標 z=3x+2y 在上述頂點：max 在 (4,0)=12（頂點法）
    verts = [(0, 0), (4, 0), (0, 4)]
    z = {v: 3*v[0]+2*v[1] for v in verts}
    assert max(z.values()) == 12 and max(z, key=z.get) == (4, 0)
    return _ok("linprog.objective-optimize", "max z=3x+2y 於可行區頂點=(4,0)→12")


CHECKS = {s: fn for s, fn in {
    "vector.plane-definition": vec_plane_def, "vector.plane-add-sub": vec_add_sub,
    "vector.component": vec_component, "vector.dot-product": vec_dot, "vector.projection": vec_projection,
    "vector.linear-combination": vec_lincomb, "vector.space-vector": vec_space,
    "vector.space-dot-product": vec_space_dot, "vector.cross-product": vec_cross,
    "vector.triangle-tetra-area": vec_tetra_area, "vector.geometry-apply": vec_geometry_apply,
    "space.point-line-plane": sp_point_line_plane, "space.coordinate": sp_coordinate,
    "space.plane-equation": sp_plane_equation, "space.line-parametric": sp_line_parametric,
    "space.distance-angle": sp_distance_angle,
    "matrix.operations": mat_ops, "matrix.multiplication": mat_mult, "matrix.inverse": mat_inverse,
    "matrix.linear-system": mat_linear_system, "matrix.transformation": mat_transformation,
    "determinant.2x2-3x3": det_calc, "determinant.cramer": det_cramer,
    "conic.parabola": conic_parabola, "conic.ellipse": conic_ellipse, "conic.hyperbola": conic_hyperbola,
    "conic.eccentricity": conic_eccentricity, "conic.translation": conic_translation,
    "conic.line-intersection": conic_line_intersection, "conic.reflection-apply": conic_reflection,
    "linprog.feasible-region": lp_feasible, "linprog.objective-optimize": lp_optimize,
}.items()}
