# -*- coding: utf-8 -*-
"""math_checks4.py — 離散/數列/機率/複數：sequence/counting/prob/complex 可重跑 fact 證據。
sympy/數值真算。CHECKS 鍵＝`<strand>.<slug>`。"""
import sympy as sp
from math import comb, perm, factorial, sqrt

x, y, n, k, r, a, d = sp.symbols("x y n k r a d")
def _ok(cid, dd): return f"PASS:{cid}:{dd}"

# ---------- sequence（6）----------
def seq_arithmetic():
    # aₙ=a+(n-1)d；驗 a=3,d=2 → 3,5,7,9；且 a_{n+1}-a_n=d 定值
    A = lambda i: 3+(i-1)*2
    assert [A(i) for i in range(1, 5)] == [3, 5, 7, 9]
    assert len({A(i+1)-A(i) for i in range(1, 10)}) == 1
    return _ok("sequence.arithmetic", "aₙ=a+(n−1)d：3,5,7,9；公差定值")
def seq_geometric():
    G = lambda i: 2*3**(i-1)
    assert [G(i) for i in range(1, 5)] == [2, 6, 18, 54]
    assert len({sp.Rational(G(i+1), G(i)) for i in range(1, 8)}) == 1
    return _ok("sequence.geometric", "aₙ=a·rⁿ⁻¹：2,6,18,54；公比定值")
def seq_sigma():
    nn = sp.Symbol('nn', positive=True, integer=True)
    assert sp.simplify(sp.summation(k, (k, 1, nn)) - nn*(nn+1)/2) == 0
    assert sp.simplify(sp.summation(k**2, (k, 1, nn)) - nn*(nn+1)*(2*nn+1)/6) == 0
    assert sp.simplify(sp.summation(k**3, (k, 1, nn)) - (nn*(nn+1)/2)**2) == 0
    return _ok("sequence.sigma-notation", "Σk=n(n+1)/2,Σk²=n(n+1)(2n+1)/6,Σk³=(Σk)²")
def seq_recursion():
    # 費氏 F(n)=F(n-1)+F(n-2)：1,1,2,3,5,8,13
    f = [1, 1]
    for _ in range(5): f.append(f[-1]+f[-2])
    assert f == [1, 1, 2, 3, 5, 8, 13]
    return _ok("sequence.recursion", "費氏遞迴 F=Fₙ₋₁+Fₙ₋₂→1,1,2,3,5,8,13")
def seq_induction():
    # 歸納證 Σ(2i-1)=n²：基底 n=1 成立；步驟 n→n+1：n²+(2n+1)=(n+1)²
    nn = sp.Symbol('nn')
    assert sp.simplify((nn**2 + (2*nn+1)) - (nn+1)**2) == 0
    assert sum(2*i-1 for i in range(1, 6)) == 25 == 5**2
    return _ok("sequence.induction", "歸納：n²+(2n+1)=(n+1)²；Σ(2i−1)=n² 實例 n=5→25")
def seq_limit():
    nn = sp.Symbol('nn', positive=True)
    assert sp.limit((2*nn+1)/(nn), nn, sp.oo) == 2
    assert sp.limit(sp.Rational(1)/nn, nn, sp.oo) == 0
    return _ok("sequence.limit", "lim(2n+1)/n=2；lim 1/n=0")

# ---------- counting（7）----------
def cnt_add_mult():
    # 乘法原理：3 上衣×4 褲=12；加法原理：互斥選一 3+4=7
    assert 3*4 == 12 and 3+4 == 7
    return _ok("counting.add-mult-principle", "乘法原理 3×4=12；加法原理 3+4=7")
def cnt_perm_repeat():
    # 相同物排列：MISSISSIPPI 的排列數 = 11!/(1!4!4!2!)
    assert factorial(11)//(factorial(1)*factorial(4)*factorial(4)*factorial(2)) == 34650
    # 重複排列：3 位數每位 0-9 可重複=10³
    assert 10**3 == 1000
    return _ok("counting.permutation-repeat", "MISSISSIPPI=11!/(4!4!2!)=34650；重複排列10³")
def cnt_circular():
    # 環狀排列 n 人 = (n-1)!
    assert factorial(5-1) == 24
    return _ok("counting.circular-permutation", "5 人環狀排列=(5−1)!=24")
def cnt_comb_apply():
    # 分組/路徑：從(0,0)到(3,2)最短路徑=C(5,2)=10
    assert comb(5, 2) == 10
    # 10 選 3 分組
    assert comb(10, 3) == 120
    return _ok("counting.combination-apply", "格子路徑(3,2)=C(5,2)=10；C(10,3)=120")
def cnt_binomial_coeff():
    # 巴斯卡：C(n,k)=C(n-1,k-1)+C(n-1,k)；第5列=1,4,6,4,1
    assert [comb(4, i) for i in range(5)] == [1, 4, 6, 4, 1]
    assert all(comb(n0, k0) == comb(n0-1, k0-1)+comb(n0-1, k0)
               for n0 in range(2, 8) for k0 in range(1, n0))
    return _ok("counting.binomial-coefficient", "巴斯卡三角 C(n,k)=C(n−1,k−1)+C(n−1,k)")
def cnt_incl_excl():
    # |A∪B|=|A|+|B|-|A∩B|；1..100 中 2 或 3 的倍數：50+33-16=67
    A = set(range(2, 101, 2)); B = set(range(3, 101, 3))
    assert len(A | B) == len(A)+len(B)-len(A & B) == 67
    return _ok("counting.inclusion-exclusion", "排容 1..100 中 2或3 倍數=50+33−16=67")
def cnt_distribution():
    # 重複組合 H(n,r)=C(n+r-1,r)：3 種糖取 5 顆=C(7,5)=21
    assert comb(3+5-1, 5) == 21
    return _ok("counting.distribution", "重複組合 3 種取 5=C(7,5)=21")

# ---------- prob（14）----------
def prob_likelihood():
    # 公平硬幣 P=1/2；骰子出 6 的 P=1/6 < 出偶數 1/2
    assert sp.Rational(1, 6) < sp.Rational(1, 2)
    return _ok("prob.likelihood-intuition", "骰子 P(6)=1/6 < P(偶)=1/2（直覺比較）")
def prob_classical():
    # 樣本空間與事件：擲兩骰 36 種，和=7 有 6 種 ⇒1/6
    S = [(i, j) for i in range(1, 7) for j in range(1, 7)]
    assert len(S) == 36 and sp.Rational(sum(1 for i, j in S if i+j == 7), 36) == sp.Rational(1, 6)
    return _ok("prob.classical", "兩骰和=7：6/36=1/6")
def prob_simple():
    # 袋中 3 紅 2 白，取 1 紅=3/5
    assert sp.Rational(3, 3+2) == sp.Rational(3, 5)
    return _ok("prob.simple-event", "3紅2白取1紅=3/5")
def prob_tree_list():
    # 擲兩次硬幣恰一正：樹狀 HT,TH ⇒2/4=1/2
    outcomes = [(a0, b0) for a0 in 'HT' for b0 in 'HT']
    assert sp.Rational(sum(1 for o in outcomes if o.count('H') == 1), 4) == sp.Rational(1, 2)
    return _ok("prob.tree-list", "兩硬幣恰一正=2/4=1/2（樹狀/列表）")
def prob_complement_add():
    # 餘事件 P(A')=1-P(A)；加法 P(A∪B)=P(A)+P(B)-P(A∩B)
    PA, PB, PAB = sp.Rational(1, 2), sp.Rational(1, 3), sp.Rational(1, 6)
    assert 1-PA == sp.Rational(1, 2) and PA+PB-PAB == sp.Rational(2, 3)
    return _ok("prob.complement-addition", "P(A')=1−P(A)；P(A∪B)=P(A)+P(B)−P(A∩B)=2/3")
def prob_mutually_excl():
    # 互斥 P(A∩B)=0⇒P(A∪B)=P(A)+P(B)；獨立 P(A∩B)=P(A)P(B)
    PA, PB = sp.Rational(1, 3), sp.Rational(1, 4)
    assert PA+PB == sp.Rational(7, 12)                  # 互斥並
    assert PA*PB == sp.Rational(1, 12)                  # 獨立交
    return _ok("prob.mutually-exclusive", "互斥並=1/3+1/4=7/12；獨立交=1/12")
def prob_conditional():
    # P(A|B)=P(A∩B)/P(B)：兩骰和>=10 給定第一顆=5
    S = [(i, j) for i in range(1, 7) for j in range(1, 7)]
    B = [s for s in S if s[0] == 5]
    AB = [s for s in B if sum(s) >= 10]
    assert sp.Rational(len(AB), len(B)) == sp.Rational(2, 6) == sp.Rational(1, 3)
    return _ok("prob.conditional", "P(和≥10|第一顆5)=2/6=1/3")
def prob_mult_rule():
    # 不放回：兩次都紅 (3/5)(2/4)=3/10
    assert sp.Rational(3, 5)*sp.Rational(2, 4) == sp.Rational(3, 10)
    return _ok("prob.multiplication-rule", "不放回兩紅=(3/5)(2/4)=3/10")
def prob_bayes():
    # Bayes：P(A|B)=P(B|A)P(A)/P(B)。疾病 1%，檢出率 99%，偽陽 5%
    PA = sp.Rational(1, 100); PnA = 1-PA
    PBgA = sp.Rational(99, 100); PBgnA = sp.Rational(5, 100)
    PB = PBgA*PA + PBgnA*PnA
    post = PBgA*PA/PB
    assert sp.simplify(post - sp.Rational(99*1, 99*1+5*99)) == 0  # =1/6 近似
    assert abs(float(post) - 0.1666666) < 1e-5
    return _ok("prob.bayes", "Bayes 疾病1%/檢99%/偽陽5%→後驗≈1/6")
def prob_expected():
    # E[X]=Σx·p：骰子點數期望=3.5
    assert sum(sp.Rational(i, 6) for i in range(1, 7)) == sp.Rational(7, 2)
    return _ok("prob.expected-value", "骰子期望值 E=Σi/6=7/2=3.5")
def prob_variance():
    # Var=E[X²]-(E[X])²：骰子 Var=35/12
    EX = sp.Rational(7, 2); EX2 = sum(sp.Rational(i**2, 6) for i in range(1, 7))
    assert EX2 - EX**2 == sp.Rational(35, 12)
    return _ok("prob.variance", "骰子變異數 E[X²]−E[X]²=35/12")
def prob_binomial():
    # 二項 B(n,p)：P(X=k)=C(n,k)pᵏ(1-p)ⁿ⁻ᵏ；E=np,Var=np(1-p)
    nn, p = 5, sp.Rational(1, 2)
    assert sum(comb(nn, kk)*p**kk*(1-p)**(nn-kk) for kk in range(nn+1)) == 1
    E = sum(kk*comb(nn, kk)*p**kk*(1-p)**(nn-kk) for kk in range(nn+1))
    assert E == nn*p == sp.Rational(5, 2)
    return _ok("prob.binomial-distribution", "B(5,½)：ΣP=1、E=np=5/2")
def prob_normal():
    # 標準化 z=(x-μ)/σ；對稱 P(Z<0)=1/2；68-95-99.7 近似
    mu, sigma = 100, 15
    assert (115-mu)/sigma == 1 and (70-mu)/sigma == -2
    return _ok("prob.normal-distribution", "z=(x−μ)/σ：x=115→z=1、x=70→z=−2")
def prob_sampling():
    # 樣本平均的標準誤 σ/√n 隨 n 增大而縮小
    import math as _m
    assert 15/_m.sqrt(100) < 15/_m.sqrt(25)
    return _ok("prob.sampling-confidence", "標準誤 σ/√n 隨 n 增大而縮小（n=100<n=25）")

# ---------- complex（6）----------
def cx_def_ops():
    z1, z2 = 2+3*sp.I, 1-sp.I
    assert z1+z2 == 3+2*sp.I and sp.expand(z1*z2) == 5+sp.I
    assert sp.I**2 == -1
    return _ok("complex.definition-operations", "(2+3i)+(1−i)=3+2i；(2+3i)(1−i)=5+i；i²=−1")
def cx_conj_mod():
    z = 3+4*sp.I
    assert sp.conjugate(z) == 3-4*sp.I and sp.Abs(z) == 5
    assert sp.expand(z*sp.conjugate(z)) == 25                 # z·z̄=|z|²
    return _ok("complex.conjugate-modulus", "z=3+4i：z̄=3−4i、|z|=5、z·z̄=25")
def cx_plane():
    z = 1+sp.I
    assert sp.re(z) == 1 and sp.im(z) == 1 and sp.Abs(z) == sp.sqrt(2)
    return _ok("complex.plane", "1+i 在複數平面：實部1虛部1、模√2")
def cx_polar():
    # 1+i = √2 (cos45°+i sin45°)
    z = 1+sp.I
    assert sp.simplify(sp.Abs(z) - sp.sqrt(2)) == 0
    assert sp.simplify(sp.arg(z) - sp.pi/4) == 0
    return _ok("complex.polar-form", "1+i=√2∠45°（模√2、幅角π/4）")
def cx_de_moivre():
    # (cosθ+i sinθ)ⁿ=cos nθ+i sin nθ；(1+i)²=2i
    assert sp.expand((1+sp.I)**2) == 2*sp.I
    th = sp.pi/6
    lhs = sp.simplify((sp.cos(th)+sp.I*sp.sin(th))**3)
    assert sp.simplify(lhs - (sp.cos(3*th)+sp.I*sp.sin(3*th))) == 0
    return _ok("complex.de-moivre", "棣美弗 (cosθ+isinθ)³=cos3θ+isin3θ；(1+i)²=2i")
def cx_roots_unity():
    # x³=1 的三根：1, ω, ω²，且和為 0
    roots = sp.solve(x**3-1, x)
    assert len(roots) == 3 and sp.simplify(sum(roots)) == 0
    return _ok("complex.roots-of-unity", "x³=1 三單位根，和=0")


CHECKS = {s: fn for s, fn in {
    "sequence.arithmetic": seq_arithmetic, "sequence.geometric": seq_geometric,
    "sequence.sigma-notation": seq_sigma, "sequence.recursion": seq_recursion,
    "sequence.induction": seq_induction, "sequence.limit": seq_limit,
    "counting.add-mult-principle": cnt_add_mult, "counting.permutation-repeat": cnt_perm_repeat,
    "counting.circular-permutation": cnt_circular, "counting.combination-apply": cnt_comb_apply,
    "counting.binomial-coefficient": cnt_binomial_coeff, "counting.inclusion-exclusion": cnt_incl_excl,
    "counting.distribution": cnt_distribution,
    "prob.likelihood-intuition": prob_likelihood, "prob.classical": prob_classical,
    "prob.simple-event": prob_simple, "prob.tree-list": prob_tree_list,
    "prob.complement-addition": prob_complement_add, "prob.mutually-exclusive": prob_mutually_excl,
    "prob.conditional": prob_conditional, "prob.multiplication-rule": prob_mult_rule,
    "prob.bayes": prob_bayes, "prob.expected-value": prob_expected, "prob.variance": prob_variance,
    "prob.binomial-distribution": prob_binomial, "prob.normal-distribution": prob_normal,
    "prob.sampling-confidence": prob_sampling,
    "complex.definition-operations": cx_def_ops, "complex.conjugate-modulus": cx_conj_mod,
    "complex.plane": cx_plane, "complex.polar-form": cx_polar, "complex.de-moivre": cx_de_moivre,
    "complex.roots-of-unity": cx_roots_unity,
}.items()}
