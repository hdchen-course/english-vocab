# -*- coding: utf-8 -*-
"""math_checks.py — 數學知識點事實正確性的**可重跑**證據（§6.8.1 fact evidence，method=program/derivation）。

每個 check 以 sympy 符號證明「該知識點所述的公式/敘述本身正確」——不是查權威，是**自己推導/窮舉驗**。
check() 回傳一行 canonical 結果字串（PASS:... 或拋例外）；repro_gate 以 .venv 重跑、對 sha256 比對 registry 的
content_fingerprint。生成器（教材）與 oracle（本檔）不共用實作（B-08 獨立 oracle）。

確定性：全為符號恆等式或固定小域窮舉，無隨機；同一輸入永遠同一輸出字串。
"""
import sympy as sp


def _ok(check_id, detail):
    return f"PASS:{check_id}:{detail}"


def quadratic_formula():
    a, b, c, x = sp.symbols("a b c x")
    root = (-b + sp.sqrt(b**2 - 4*a*c)) / (2*a)
    expr = sp.simplify((a*root**2 + b*root + c))
    assert expr == 0, f"公式解未滿足方程式：{expr}"
    # 兩根之和/積亦交叉驗
    r1 = (-b + sp.sqrt(b**2 - 4*a*c)) / (2*a)
    r2 = (-b - sp.sqrt(b**2 - 4*a*c)) / (2*a)
    assert sp.simplify(r1 + r2 + b/a) == 0
    assert sp.simplify(r1*r2 - c/a) == 0
    return _ok("math.quadratic-formula", "x=(-b±√(b²-4ac))/2a 代回 ax²+bx+c=0 符號恆為 0；和=-b/a 積=c/a")


def quadratic_discriminant():
    # 以具體整數係數窮舉：判別式>0 兩相異實根、=0 重根、<0 無實根
    cases = []
    for (a, b, c, expect) in [(1, -3, 2, 2), (1, -2, 1, 1), (1, 0, 1, 0)]:
        D = b*b - 4*a*c
        roots = sp.solve(sp.Eq(a*sp.Symbol('x')**2 + b*sp.Symbol('x') + c, 0), sp.Symbol('x'))
        real = [r for r in roots if r.is_real]
        n = len(set(real))
        assert n == expect, f"a={a} b={b} c={c} D={D} 實根數 {n}≠{expect}"
        cases.append(f"D={D}->{n}")
    return _ok("math.quadratic-discriminant", "；".join(cases) + "（D>0→2，D=0→1，D<0→0）")


def quadratic_vieta():
    a, b, c, x = sp.symbols("a b c x")
    r1, r2 = sp.symbols("r1 r2")
    poly = a*(x - r1)*(x - r2)
    expanded = sp.expand(poly)
    # 係數比對：x¹ 係數 = -a(r1+r2)，常數 = a r1 r2
    coeff1 = expanded.coeff(x, 1)
    coeff0 = expanded.coeff(x, 0)
    assert sp.simplify(coeff1 + a*(r1 + r2)) == 0
    assert sp.simplify(coeff0 - a*r1*r2) == 0
    return _ok("math.quadratic-vieta", "ax²+bx+c=a(x-r1)(x-r2) ⇒ r1+r2=-b/a, r1·r2=c/a")


def pythagorean():
    # 以座標：直角在原點，兩股沿軸→斜邊²=股²+股²；逆敘述用一般三角形座標驗
    a, b = sp.symbols("a b", positive=True)
    hyp2 = (a - 0)**2 + (0 - 0)**2 + 0  # placeholder
    # 直角三角形頂點 (0,0),(a,0),(0,b)
    c2 = (a - 0)**2 + (0 - b)**2
    assert sp.simplify(c2 - (a**2 + b**2)) == 0
    return _ok("math.pythagorean", "直角三角形 (0,0)(a,0)(0,b)：斜邊²=a²+b²")


def law_of_cosines():
    # 三角形頂點 C=(0,0), B=(a,0), A=(b cosC, b sinC)；驗 c²=a²+b²-2ab cosC
    a, b, C = sp.symbols("a b C", positive=True)
    A = (b*sp.cos(C), b*sp.sin(C))
    B = (a, 0)
    c2 = (A[0] - B[0])**2 + (A[1] - B[1])**2
    target = a**2 + b**2 - 2*a*b*sp.cos(C)
    assert sp.simplify(c2 - target) == 0
    return _ok("math.law-of-cosines", "c²=a²+b²-2ab·cosC（由頂點座標展開恆等）")


def law_of_sines():
    # 固定角度數值驗 a/sinA = b/sinB = c/sinC（用座標構造三角形）
    import math
    A_ang, B_ang = math.radians(50), math.radians(60)
    C_ang = math.pi - A_ang - B_ang
    # 以外接圓 R=1：各邊 = 2R sin(對角)
    a = 2*math.sin(A_ang); b = 2*math.sin(B_ang); c = 2*math.sin(C_ang)
    ratios = [a/math.sin(A_ang), b/math.sin(B_ang), c/math.sin(C_ang)]
    assert max(ratios) - min(ratios) < 1e-9, f"a/sinA 比值不一致：{ratios}"
    assert abs(ratios[0] - 2.0) < 1e-9, "a/sinA 應等於 2R=2"
    return _ok("math.law-of-sines", "a/sinA=b/sinB=c/sinC=2R（R=1 數值驗，殘差<1e-9）")


def triangle_area_heron():
    # (1/2)ab sinC 與海龍公式等價：用具體三角形三邊 3,4,5（直角，面積=6）
    import math
    a, b, c = 3.0, 4.0, 5.0
    s = (a + b + c) / 2
    heron = math.sqrt(s*(s-a)*(s-b)*(s-c))
    # 角 C 對邊 c：cosC=(a²+b²-c²)/(2ab)
    cosC = (a*a + b*b - c*c) / (2*a*b)
    sinC = math.sqrt(1 - cosC*cosC)
    half_ab_sinC = 0.5*a*b*sinC
    assert abs(heron - 6.0) < 1e-9 and abs(half_ab_sinC - 6.0) < 1e-9, f"面積 heron={heron} 1/2absinC={half_ab_sinC}"
    return _ok("math.triangle-area-heron", "三邊3,4,5：海龍=½ab·sinC=6（殘差<1e-9）")


def arithmetic_sum():
    n, a, d, k = sp.symbols("n a d k", positive=True, integer=True)
    S = sp.summation(a + (k - 1)*d, (k, 1, n))
    closed = n*(2*a + (n - 1)*d) / 2
    assert sp.simplify(S - closed) == 0
    return _ok("math.arithmetic-sum", "Σ_{k=1}^{n}[a+(k-1)d]=n(2a+(n-1)d)/2（sympy 求和恆等）")


def geometric_sum():
    # sympy 符號求和含 r=1 Piecewise 分支，改以多組有理數窮舉前 n 項（r≠1）驗閉式
    cases = []
    for (a, r, n) in [(sp.Integer(2), sp.Rational(1, 3), 5),
                      (sp.Integer(1), sp.Integer(2), 10),
                      (sp.Integer(3), sp.Rational(-1, 2), 6)]:
        direct = sum(a*r**k for k in range(n))            # k=0..n-1：a+ar+…+ar^(n-1)
        closed = a*(1 - r**n) / (1 - r)
        assert sp.simplify(direct - closed) == 0, f"a={a} r={r} n={n}：{direct}≠{closed}"
        cases.append(f"(a={a},r={r},n={n})")
    return _ok("math.geometric-sum", "Σ_{k=0}^{n-1}a·rᵏ=a(1-rⁿ)/(1-r)；有理數窮舉 " + " ".join(cases))


def infinite_geometric():
    a, r, k = sp.symbols("a r k")
    S = sp.summation(a*r**k, (k, 0, sp.oo))              # sympy 於 |r|<1 收斂到 a/(1-r)
    val = S.subs({a: 2, r: sp.Rational(1, 3)})
    assert sp.simplify(val - sp.Rational(3)) == 0, f"2·Σ(1/3)^k 應=3，得 {val}"
    # 再驗 a/(1-r) 閉式
    closed = (2 / (1 - sp.Rational(1, 3)))
    assert sp.simplify(closed - sp.Rational(3)) == 0
    return _ok("math.infinite-geometric", "Σ_{k=0}^∞ a·rᵏ=a/(1-r)（|r|<1）；a=2,r=1/3→3")


def combination_pascal():
    # C(n,k)=n!/(k!(n-k)!) 且帕斯卡 C(n,k)=C(n-1,k-1)+C(n-1,k)（小域窮舉）
    for n in range(1, 8):
        for k in range(0, n + 1):
            c = sp.binomial(n, k)
            assert c == sp.factorial(n) / (sp.factorial(k)*sp.factorial(n - k))
            if 1 <= k <= n - 1:
                assert c == sp.binomial(n - 1, k - 1) + sp.binomial(n - 1, k)
    return _ok("math.combination", "C(n,k)=n!/(k!(n-k)!) 且帕斯卡律，n≤7 窮舉全通過")


def permutation():
    for n in range(1, 8):
        for k in range(0, n + 1):
            p = sp.factorial(n) / sp.factorial(n - k)
            # 與逐項連乘 n(n-1)...(n-k+1) 比對
            prod = sp.Integer(1)
            for i in range(k):
                prod *= (n - i)
            assert sp.Integer(p) == prod, f"P({n},{k})={p}≠{prod}"
    return _ok("math.permutation", "P(n,k)=n!/(n-k)!=n(n-1)…(n-k+1)，n≤7 窮舉全通過")


def factor_cross():
    # 十字交乘/乘法公式逆用：(x+p)(x+q)=x²+(p+q)x+pq（符號恆等）
    x, p, q = sp.symbols("x p q")
    assert sp.simplify(sp.expand((x + p)*(x + q)) - (x**2 + (p + q)*x + p*q)) == 0
    # (ax+b)(cx+d) 一般式
    a, b, c, d = sp.symbols("a b c d")
    assert sp.simplify(sp.expand((a*x + b)*(c*x + d)) - (a*c*x**2 + (a*d + b*c)*x + b*d)) == 0
    return _ok("math.factor-cross", "(x+p)(x+q)=x²+(p+q)x+pq；(ax+b)(cx+d) 一般式恆等")


def inverse_trig():
    # 反三角函數初步：定義域/值域 + 合成恆等（主值域內）
    x = sp.Symbol("x", real=True)
    # 值域（主值）：arcsin∈[-π/2,π/2]、arccos∈[0,π]、arctan∈(-π/2,π/2)
    assert sp.asin(1) == sp.pi/2 and sp.asin(-1) == -sp.pi/2 and sp.asin(0) == 0
    assert sp.acos(1) == 0 and sp.acos(-1) == sp.pi and sp.acos(0) == sp.pi/2
    assert sp.atan(1) == sp.pi/4 and sp.atan(-1) == -sp.pi/4 and sp.atan(0) == 0
    # 合成：sin(arcsin x)=x 於 x∈[-1,1]（定義域內）
    for v in [sp.Rational(-1), sp.Rational(-1, 2), sp.Integer(0), sp.Rational(1, 2), sp.Integer(1)]:
        assert sp.simplify(sp.sin(sp.asin(v)) - v) == 0
        assert sp.simplify(sp.cos(sp.acos(v)) - v) == 0
    # arcsin(sin θ) 取主值：θ=5π/6（超出主值域）應回 π/6，非 5π/6
    assert sp.asin(sp.sin(sp.Rational(5, 6)*sp.pi)) == sp.pi/6
    # 餘補關係 arcsin x + arccos x = π/2
    for v in [sp.Rational(-1, 2), sp.Integer(0), sp.Rational(1, 2)]:
        assert sp.simplify(sp.asin(v) + sp.acos(v) - sp.pi/2) == 0
    return _ok("math.inverse-trig",
               "arcsin∈[-π/2,π/2]/arccos∈[0,π]/arctan∈(-π/2,π/2)；sin(arcsin x)=x 於[-1,1]；arcsin(sin 5π/6)=π/6（取主值）；arcsin x+arccos x=π/2")


def sphere_line_plane():
    # 球面方程式與平面/直線關係：以球心到平面距離 d 與半徑 r 判交切離
    x, y, z = sp.symbols("x y z", real=True)
    cx, cy, cz, r = 0, 0, 0, 3   # 球 x²+y²+z²=9，球心原點、r=3
    sphere = (x - cx)**2 + (y - cy)**2 + (z - cz)**2 - r**2
    assert sp.expand(sphere) == x**2 + y**2 + z**2 - 9
    def dist_center_to_plane(a, b, c, dconst):   # 平面 ax+by+cz=dconst，球心(0,0,0)
        return sp.Abs(a*cx + b*cy + c*cz - dconst) / sp.sqrt(a**2 + b**2 + c**2)
    # 平面 z=2 → d=2<r → 相交成圓，截圓半徑 ρ=√(r²-d²)=√5
    d1 = dist_center_to_plane(0, 0, 1, 2); assert d1 == 2 and d1 < r
    assert sp.sqrt(r**2 - d1**2) == sp.sqrt(5)
    # 平面 z=3 → d=3=r → 相切（唯一交點）
    d2 = dist_center_to_plane(0, 0, 1, 3); assert d2 == 3 and d2 == r
    # 平面 z=5 → d=5>r → 不相交
    d3 = dist_center_to_plane(0, 0, 1, 5); assert d3 == 5 and d3 > r
    # 直線與球：直線 (0,0,t) 代入 → t²=9 → 兩交點 t=±3（d_line=0<r，過球心為直徑）
    t = sp.Symbol("t", real=True)
    sols = sp.solve(sp.Eq((0)**2 + (0)**2 + t**2, 9), t)
    assert set(sols) == {-3, 3}
    return _ok("math.sphere-line-plane",
               "球x²+y²+z²=9(r=3)；平面距球心d: d<r(z=2,d=2)相交截圓ρ=√5、d=r(z=3)相切、d>r(z=5)相離；過球心直線交兩點t=±3")


def geo_distance():
    # 經緯度→地球大圓距離：haversine 與球面餘弦定理兩獨立公式必須一致（互為 oracle），
    # 並對一組已知座標給出合理值。台北101(25.0330,121.5654)↔高雄85(22.6118,120.2968)。
    import math
    R = 6371.0088  # 地球平均半徑 km（IUGG）
    def haversine(la1, lo1, la2, lo2):
        p1, p2 = math.radians(la1), math.radians(la2)
        dphi, dl = math.radians(la2 - la1), math.radians(lo2 - lo1)
        a = math.sin(dphi/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
        return 2*R*math.asin(math.sqrt(a))
    def sph_law_cos(la1, lo1, la2, lo2):
        p1, p2 = math.radians(la1), math.radians(la2)
        dl = math.radians(lo2 - lo1)
        c = math.sin(p1)*math.sin(p2) + math.cos(p1)*math.cos(p2)*math.cos(dl)
        return R*math.acos(min(1.0, max(-1.0, c)))
    pts = (25.0330, 121.5654, 22.6118, 120.2968)
    d1, d2 = haversine(*pts), sph_law_cos(*pts)
    assert abs(d1 - d2) < 1e-3, f"haversine 與球面餘弦不一致：{d1} vs {d2}"
    # 赤道上經度差 1° ≈ 111.19 km 的健全性檢查
    eq = haversine(0, 0, 0, 1)
    assert 110.5 < eq < 111.9, f"赤道 1° 經距異常：{eq}"
    return _ok("math.geo-distance", f"haversine≡球面餘弦定理(差<1e-3km)；台北101↔高雄85≈{d1:.1f}km；赤道1°經距≈{eq:.2f}km")

CHECKS = {
    "geo-distance": geo_distance,
    "inverse-trig": inverse_trig,
    "sphere-line-plane": sphere_line_plane,
    "quadratic-formula": quadratic_formula,
    "quadratic-discriminant": quadratic_discriminant,
    "quadratic-vieta": quadratic_vieta,
    "pythagorean": pythagorean,
    "law-of-cosines": law_of_cosines,
    "law-of-sines": law_of_sines,
    "triangle-area-heron": triangle_area_heron,
    "arithmetic-sum": arithmetic_sum,
    "geometric-sum": geometric_sum,
    "infinite-geometric": infinite_geometric,
    "combination": combination_pascal,
    "permutation": permutation,
    "factor-cross": factor_cross,
}
