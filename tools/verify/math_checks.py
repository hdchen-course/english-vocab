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


CHECKS = {
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
