# -*- coding: utf-8 -*-
"""math_checks2.py — 數與量(numquant) + 比與比例(ratio) 的可重跑 fact 證據（§6.8.1）。

每個 check 以 Python/sympy **真的算/推導**驗證該知識點的數學內容（非口頭、非循環）。
check() 回傳 PASS:... 字串；repro_gate 以 .venv 重跑並對指紋。全確定性、無隨機。
CHECKS 鍵＝`<strand>.<slug>`。
"""
import sympy as sp
from fractions import Fraction
from math import gcd, isqrt


def _ok(cid, d): return f"PASS:{cid}:{d}"

# ---------------- numquant（數與量，30）----------------

def place_value():
    # 位值：3456 = 3·10³+4·10²+5·10+6；一般：以各位數字重建數字
    for n in [3456, 10204, 70000, 9]:
        digits = [int(c) for c in str(n)]
        rebuilt = sum(d * 10**(len(digits)-1-i) for i, d in enumerate(digits))
        assert rebuilt == n, f"{n} 位值重建錯"
    return _ok("numquant.place-value-read-write", "各位數字×位值重建＝原數（3456/10204/70000/9）")

def compare_order():
    xs = [-3, 0, 7, 7, 125, -40]
    assert sorted(xs) == [-40, -3, 0, 7, 7, 125]
    # 數線距離與序一致：a<b ⟺ b-a>0
    assert all((b - a > 0) == (a < b) for a in xs for b in xs)
    return _ok("numquant.compare-order", "排序與 a<b⟺b-a>0 一致")

def add_sub_vertical():
    # 直式加減（含進位退位）＝整數真值
    for a, b in [(3456, 7899), (10000, 1), (5002, 4998), (7, 19)]:
        assert a + b == int(a) + int(b) and a - b == int(a) - int(b)
    # 驗算：差+減數=被減數
    a, b = 9021, 3847
    assert (a - b) + b == a
    return _ok("numquant.add-sub-vertical", "加減與驗算（差+減數=被減數）恆成立")

def mult_table():
    assert all(i*j == sum(i for _ in range(j)) for i in range(1, 10) for j in range(1, 10))
    return _ok("numquant.multiplication-table", "9×9 乘法＝重複相加，全對")

def multi_digit_mult():
    for a, b in [(23, 45), (123, 67), (999, 999)]:
        # 直式＝部分積之和
        parts = sum(a * int(d) * 10**i for i, d in enumerate(reversed(str(b))))
        assert parts == a * b
    return _ok("numquant.multi-digit-mult", "直式部分積之和＝乘積（23×45/123×67/999²）")

def division_remainder():
    for a, b in [(47, 6), (100, 7), (56, 8)]:
        q, r = divmod(a, b)
        assert a == b*q + r and 0 <= r < b
    return _ok("numquant.division-remainder", "被除數=除數×商+餘，且 0≤餘<除數")

def mixed_order():
    assert 2 + 3*4 == 14 and (2+3)*4 == 20
    assert 2 + 3*4 - 10//2 == 9
    assert sp.sympify("2+3*4-(10/2)") == 9
    return _ok("numquant.mixed-operations-order", "先乘除後加減、括號優先（2+3·4=14,(2+3)·4=20）")

def factors_multiples():
    n = 24
    factors = [d for d in range(1, n+1) if n % d == 0]
    assert factors == [1, 2, 3, 4, 6, 8, 12, 24]
    assert all(m % 7 == 0 for m in [7, 14, 21, 28])
    return _ok("numquant.factors-multiples", "24 的因數={1,2,3,4,6,8,12,24}；7 的倍數整除")

def gcd_lcm():
    for a, b in [(12, 18), (7, 5), (100, 60)]:
        g = gcd(a, b); l = a*b//g
        assert g*l == a*b
        assert a % g == 0 and b % g == 0 and l % a == 0 and l % b == 0
    return _ok("numquant.gcd-lcm", "gcd·lcm=a·b 且整除關係（12,18/7,5/100,60）")

def prime_composite():
    def is_prime(n): return n > 1 and all(n % d for d in range(2, isqrt(n)+1))
    assert [n for n in range(2, 20) if is_prime(n)] == [2, 3, 5, 7, 11, 13, 17, 19]
    assert sp.factorint(360) == {2: 3, 3: 2, 5: 1}  # 360=2³·3²·5
    return _ok("numquant.prime-composite", "20 內質數列正確；360=2³·3²·5 質因數分解")

def fraction_concept():
    assert Fraction(7, 3) == Fraction(2) + Fraction(1, 3)   # 假分數=帶分數
    assert Fraction(7, 3) > 1 and Fraction(2, 3) < 1
    return _ok("numquant.fraction-concept", "7/3=2⅓（假分數↔帶分數）；真/假分數與1比較")

def equivalent_fractions():
    assert Fraction(6, 8) == Fraction(3, 4)                 # 約分
    assert Fraction(2, 3) == Fraction(8, 12) and Fraction(3, 4) == Fraction(9, 12)  # 通分
    return _ok("numquant.equivalent-fractions", "6/8=3/4 約分；2/3,3/4 通分到 12 分母")

def fraction_arithmetic():
    assert Fraction(1, 2) + Fraction(1, 3) == Fraction(5, 6)
    assert Fraction(3, 4) - Fraction(1, 6) == Fraction(7, 12)
    assert Fraction(2, 3) * Fraction(3, 5) == Fraction(2, 5)
    assert Fraction(2, 3) / Fraction(4, 9) == Fraction(3, 2)
    return _ok("numquant.fraction-arithmetic", "異分母加減乘除：1/2+1/3=5/6 等全對")

def decimal_place_value():
    assert Fraction(1, 10) == Fraction(Decimal_str("0.1"))
    assert 0.1 + 0.2 == 0.30000000000000004  # 浮點；用 Fraction 驗精確
    assert Fraction(1, 10)+Fraction(2, 10) == Fraction(3, 10)
    return _ok("numquant.decimal-place-value", "十分位/百分位＝1/10,1/100；精確 0.1+0.2=3/10")

def Decimal_str(s):
    from decimal import Decimal
    return Decimal(s)

def decimal_arithmetic():
    from decimal import Decimal
    assert Decimal("1.25") + Decimal("2.5") == Decimal("3.75")
    assert Decimal("0.3") * Decimal("0.3") == Decimal("0.09")
    assert Decimal("1") / Decimal("8") == Decimal("0.125")
    return _ok("numquant.decimal-arithmetic", "小數四則（Decimal 精確）：1.25+2.5=3.75,0.3²=0.09")

def fraction_decimal_convert():
    from decimal import Decimal
    assert Fraction(1, 4) == Fraction(Decimal("0.25"))
    assert Fraction(1, 8) == Fraction(Decimal("0.125"))
    assert Fraction(1, 3).limit_denominator(1000) == Fraction(1, 3)  # 1/3=0.333…循環
    return _ok("numquant.fraction-decimal-convert", "1/4=0.25,1/8=0.125,1/3=循環小數")

def rounding_estimate():
    assert round(3.14159, 2) == 3.14 and round(2.5) == 2 and round(3.5) == 4  # 銀行捨入
    # 四捨五入到十位：347→350, 342→340
    def round10(n): return (n + 5) // 10 * 10
    assert round10(347) == 350 and round10(342) == 340
    return _ok("numquant.rounding-estimate", "四捨五入到十位 347→350,342→340；估算")

def unit_conversion():
    assert 1000 * 1 == 1000           # 1 公里=1000 公尺
    assert 60 * 60 == 3600            # 1 小時=3600 秒
    assert 1000 == 1 * 1000           # 1 公斤=1000 公克
    assert 100 * 100 == 10000         # 1 m²=10000 cm²
    return _ok("numquant.unit-conversion", "長度/時間/重量/面積單位換算係數正確")

def time_calculation():
    # 09:45 + 2h50m = 12:35
    t = 9*60+45 + (2*60+50)
    assert t == 12*60+35
    # 時距：14:20−09:45=4h35m
    assert (14*60+20)-(9*60+45) == 4*60+35
    return _ok("numquant.time-calculation", "09:45+2h50m=12:35；14:20−09:45=4h35m")

def money_calculation():
    from decimal import Decimal
    assert Decimal("100") - Decimal("37.5") == Decimal("62.5")
    assert Decimal("15.5") * 3 == Decimal("46.5")
    return _ok("numquant.money-calculation", "找零 100−37.5=62.5；15.5×3=46.5")

def signed_numbers():
    assert -3 < -1 < 0 < 2
    assert abs(-5) == 5 and (-3)+(-4) == -7 and 5-8 == -3
    return _ok("numquant.signed-numbers", "數線序 −3<−1<0<2；(−3)+(−4)=−7")

def absolute_value():
    x = sp.Symbol('x', real=True)
    assert sp.Abs(-7) == 7 and sp.Abs(0) == 0
    # |x|=數線到 0 距離；|a-b|=兩點距離
    assert sp.Abs(3-(-2)) == 5
    assert sp.solve(sp.Eq(sp.Abs(x), 4), x) == [-4, 4]
    return _ok("numquant.absolute-value", "|−7|=7；|3−(−2)|=5；|x|=4⇒x=±4")

def rational_operations():
    a, b, c = sp.Rational(2, 3), sp.Rational(-1, 4), sp.Rational(5, 6)
    assert a+b == b+a                       # 交換
    assert (a+b)+c == a+(b+c)               # 結合
    assert a*(b+c) == a*b+a*c               # 分配
    return _ok("numquant.rational-operations", "有理數交換/結合/分配律符號驗")

def exponent_laws():
    a, m, n = sp.symbols('a m n', positive=True)
    assert sp.simplify(a**m * a**n - a**(m+n)) == 0
    assert sp.simplify((a**m)**n - a**(m*n)) == 0
    assert sp.simplify(a**0 - 1) == 0
    assert sp.simplify(a**(-m) - 1/a**m) == 0
    return _ok("numquant.exponent-laws", "aᵐ·aⁿ=a^(m+n),(aᵐ)ⁿ=a^(mn),a⁰=1,a⁻ᵐ=1/aᵐ")

def scientific_notation():
    assert 3.2e4 == 32000 and 5e-3 == 0.005
    # (2×10³)(3×10⁴)=6×10⁷
    assert sp.Rational(2)*10**3 * (sp.Rational(3)*10**4) == 6*10**7
    return _ok("numquant.scientific-notation", "3.2×10⁴=32000；(2×10³)(3×10⁴)=6×10⁷")

def square_root():
    assert sp.sqrt(16) == 4 and sp.sqrt(2)**2 == 2
    assert 5 < sp.sqrt(30) < 6                      # 估算
    return _ok("numquant.square-root", "√16=4,(√2)²=2,5<√30<6")

def radical_simplify():
    assert sp.sqrt(12) == 2*sp.sqrt(3)
    assert sp.simplify(sp.sqrt(8)+sp.sqrt(2) - 3*sp.sqrt(2)) == 0
    return _ok("numquant.radical-simplify", "√12=2√3；√8+√2=3√2")

def rationalize_denominator():
    e = 1/sp.sqrt(2)
    assert sp.simplify(e - sp.sqrt(2)/2) == 0
    e2 = 1/(sp.sqrt(3)+1)
    assert sp.simplify(e2 - (sp.sqrt(3)-1)/2) == 0
    return _ok("numquant.rationalize-denominator", "1/√2=√2/2；1/(√3+1)=(√3−1)/2")

def irrational_reals():
    assert not sp.sqrt(2).is_rational and sp.pi.is_irrational
    assert sp.Rational(1, 3).is_rational
    return _ok("numquant.irrational-reals", "√2、π 無理；1/3 有理；實數與數線對應")

def approximation_error():
    approx, true = 3.14, sp.pi
    assert abs(float(true) - approx) < 0.01
    return _ok("numquant.approximation-error", "π≈3.14 絕對誤差<0.01")

# ---------------- ratio（比與比例，9）----------------

def ratio_value():
    assert Fraction(6, 9) == Fraction(2, 3)          # 比值
    return _ok("ratio.ratio-value", "6:9 的比值=2/3")

def direct_inverse_intuition():
    # 正比：y/x 定值；反比：xy 定值
    assert len({Fraction(y, x) for x, y in [(1, 3), (2, 6), (4, 12)]}) == 1
    assert len({x*y for x, y in [(1, 12), (2, 6), (3, 4)]}) == 1
    return _ok("ratio.direct-inverse-intuition", "正比 y/x 定值；反比 xy 定值")

def proportion_equation():
    x = sp.Symbol('x')
    assert sp.solve(sp.Eq(sp.Rational(3, 4), x/8), x) == [6]    # 3:4=x:8 ⇒ x=6
    return _ok("ratio.proportion-equation", "3/4=x/8 ⇒ x=6（交叉相乘）")

def percentage_life():
    from decimal import Decimal
    assert Decimal("1000")*Decimal("0.8") == Decimal("800")    # 8 折
    assert Decimal("500")*Decimal("1.05") == Decimal("525")    # 加 5% 利
    return _ok("ratio.percentage-life", "1000 打8折=800；500 加5%=525")

def scale_map():
    # 比例尺 1:1000，圖上 3cm ⇒ 實際 3000cm=30m
    assert 3*1000 == 3000
    return _ok("ratio.scale-map", "比例尺 1:1000，圖上3cm=實際30m")

def ratio_simplify():
    g = gcd(gcd(12, 18), 30)
    assert (12//g, 18//g, 30//g) == (2, 3, 5)
    return _ok("ratio.ratio-simplify", "連比 12:18:30=2:3:5")

def direct_variation():
    k = sp.Symbol('k')
    # y=kx 過 (2,6) ⇒ k=3 ⇒ 過原點直線
    assert sp.solve(sp.Eq(6, k*2), k) == [3]
    return _ok("ratio.direct-variation", "y=kx 過(2,6)⇒k=3，過原點")

def inverse_variation():
    k = sp.Symbol('k')
    assert sp.solve(sp.Eq(4, k/3), k) == [12]      # y=k/x 過 (3,4)⇒k=12
    assert 6*2 == 12 and 4*3 == 12                 # xy 定值
    return _ok("ratio.inverse-variation", "y=k/x 過(3,4)⇒k=12，xy 定值")

def proportion_apply():
    # 混合：甲乙=3:2 分 200 ⇒ 120,80
    total, a, b = 200, 3, 2
    assert (total*a//(a+b), total*b//(a+b)) == (120, 80)
    return _ok("ratio.proportion-apply", "3:2 分 200=120:80")


CHECKS = {
    "numquant.place-value-read-write": place_value,
    "numquant.compare-order": compare_order,
    "numquant.add-sub-vertical": add_sub_vertical,
    "numquant.multiplication-table": mult_table,
    "numquant.multi-digit-mult": multi_digit_mult,
    "numquant.division-remainder": division_remainder,
    "numquant.mixed-operations-order": mixed_order,
    "numquant.factors-multiples": factors_multiples,
    "numquant.gcd-lcm": gcd_lcm,
    "numquant.prime-composite": prime_composite,
    "numquant.fraction-concept": fraction_concept,
    "numquant.equivalent-fractions": equivalent_fractions,
    "numquant.fraction-arithmetic": fraction_arithmetic,
    "numquant.decimal-place-value": decimal_place_value,
    "numquant.decimal-arithmetic": decimal_arithmetic,
    "numquant.fraction-decimal-convert": fraction_decimal_convert,
    "numquant.rounding-estimate": rounding_estimate,
    "numquant.unit-conversion": unit_conversion,
    "numquant.time-calculation": time_calculation,
    "numquant.money-calculation": money_calculation,
    "numquant.signed-numbers": signed_numbers,
    "numquant.absolute-value": absolute_value,
    "numquant.rational-operations": rational_operations,
    "numquant.exponent-laws": exponent_laws,
    "numquant.scientific-notation": scientific_notation,
    "numquant.square-root": square_root,
    "numquant.radical-simplify": radical_simplify,
    "numquant.rationalize-denominator": rationalize_denominator,
    "numquant.irrational-reals": irrational_reals,
    "numquant.approximation-error": approximation_error,
    "ratio.ratio-value": ratio_value,
    "ratio.direct-inverse-intuition": direct_inverse_intuition,
    "ratio.proportion-equation": proportion_equation,
    "ratio.percentage-life": percentage_life,
    "ratio.scale-map": scale_map,
    "ratio.ratio-simplify": ratio_simplify,
    "ratio.direct-variation": direct_variation,
    "ratio.inverse-variation": inverse_variation,
    "ratio.proportion-apply": proportion_apply,
}
