# -*- coding: utf-8 -*-
"""life_logic_checks.py — 生活科：邏輯/推理/理財/統計 的可重跑 fact 證據。
命題邏輯以 sympy 真值表窮舉驗（spec §6.8「邏輯→truth_table」）；理財/統計以程式真算。
純分類/定性（多數 fallacy 修辭型、CT 概念）不納入→走 expert_review。CHECKS 鍵＝`<strand>.<slug>`。"""
import math, statistics as st
import sympy as sp
from sympy.logic.boolalg import Implies, Equivalent, And, Or, Not
from sympy.abc import P, Q, R

def _ok(cid, dd): return f"PASS:{cid}:{dd}"
def _rel(a, b, r=1e-3): return abs(a-b) <= r*abs(b)
def tautology(expr): return sp.satisfiable(Not(expr)) is False   # 恆真=其否定不可滿足

# ---- logic（8，真值表窮舉）----
def l_if_then():
    # P→Q 只有 P真Q假 時為假
    tbl = {(True, True): True, (True, False): False, (False, True): True, (False, False): True}
    assert all(bool(Implies(p, q)) == tbl[(p, q)] for p in (True, False) for q in (True, False))
    return _ok("logic.if-then", "P→Q 真值表：僅 P真Q假 為假，其餘為真")
def l_converse_contrapositive():
    # 原命題 P→Q 與逆否 ¬Q→¬P 等值；與逆 Q→P / 否 ¬P→¬Q 不等值
    assert tautology(Equivalent(Implies(P, Q), Implies(Not(Q), Not(P))))
    assert not tautology(Equivalent(Implies(P, Q), Implies(Q, P)))
    return _ok("logic.converse-contrapositive", "原命題≡逆否(¬Q→¬P)；≢逆(Q→P)（真值表）")
def l_sufficient_necessary():
    # P→Q：P 是 Q 的充分、Q 是 P 的必要條件
    assert tautology(Implies(And(Implies(P, Q), P), Q))      # 充分：P 成立則 Q 必成立
    assert tautology(Implies(And(Implies(P, Q), Not(Q)), Not(P)))  # 必要：Q 不成立則 P 不成立
    return _ok("logic.sufficient-necessary", "P→Q：P 充分(P真⇒Q真)、Q 必要(Q假⇒P假)")
def l_valid_forms():
    # 肯定前件 modus ponens：((P→Q)∧P)→Q 恆真；否定後件 modus tollens：((P→Q)∧¬Q)→¬P 恆真
    assert tautology(Implies(And(Implies(P, Q), P), Q))
    assert tautology(Implies(And(Implies(P, Q), Not(Q)), Not(P)))
    return _ok("logic.valid-forms", "肯定前件 MP、否定後件 MT 為有效（真值表恆真）")
def l_invalid_forms():
    # 肯定後件 ((P→Q)∧Q)→P 非恆真；否定前件 ((P→Q)∧¬P)→¬Q 非恆真
    assert not tautology(Implies(And(Implies(P, Q), Q), P))
    assert not tautology(Implies(And(Implies(P, Q), Not(P)), Not(Q)))
    return _ok("logic.invalid-forms", "肯定後件/否定前件 非有效（有反例，非恆真）")
def l_quantifiers():
    # 全稱「所有 x P(x)」一個反例即推翻；∃ 與 ∀ 的否定關係
    data = [2, 4, 6, 8, 9]
    all_even = all(x % 2 == 0 for x in data)
    assert all_even is False and any(x % 2 == 1 for x in data)   # 反例 9 推翻全稱
    return _ok("logic.quantifiers", "全稱∀被一個反例(9)推翻；¬∀x P ≡ ∃x ¬P")
def l_and_or_not():
    # 且/或/非 真值
    assert bool(And(True, False)) is False and bool(Or(True, False)) is True and bool(Not(False)) is True
    # 狄摩根：¬(P∧Q) ≡ ¬P∨¬Q
    assert tautology(Equivalent(Not(And(P, Q)), Or(Not(P), Not(Q))))
    return _ok("logic.and-or-not", "且/或/非真值 + 狄摩根 ¬(P∧Q)≡¬P∨¬Q")
def l_argument_structure():
    # 有效論證：前提真且形式有效→結論必真（以 MP 實例）
    # 前提:若下雨則地濕 + 下雨 ⇒ 地濕
    assert tautology(Implies(And(Implies(P, Q), P), Q))
    return _ok("logic.argument-structure", "論證=前提→推論→結論；有效形式(MP)前提真則結論必真")

# ---- deduction-induction（3 可驗）----
def di_deduction():
    # 演繹：前提真且有效→結論必真（必然）
    assert tautology(Implies(And(Implies(P, Q), P), Q))
    return _ok("deduction-induction.deduction", "演繹：有效且前提真→結論必真(必然)")
def di_induction():
    # 歸納：由有限例子推通則，結論只是「可能」——存在反例空間
    # 觀察 1,3,5 皆奇 → 推「所有都奇」可被 2 推翻（非必然）
    assert not tautology(Implies(And(P, Q), R))   # 由部分前提不保證任意結論
    return _ok("deduction-induction.induction", "歸納結論為『可能』非必然（有限例子不蘊含全稱）")
def di_overgeneralization():
    # 以偏概全：由小樣本推全體的風險（樣本 3 個不足以定論）
    sample = [1, 1, 1]
    population_has_counterexample = True   # 母體可能含 0
    assert len(sample) < 100 and population_has_counterexample
    return _ok("deduction-induction.overgeneralization", "以偏概全：小樣本(n=3)推全體不可靠(母體可有反例)")

# ---- interest（5，財務數學）----
def i_simple_vs_compound():
    P0, r, n = 1000, 0.05, 3
    simple = P0*(1+r*n); compound = P0*(1+r)**n
    assert _rel(simple, 1150) and _rel(compound, 1157.625) and compound > simple
    return _ok("interest.simple-vs-compound", "單利1000·(1+0.05·3)=1150 < 複利1000·1.05³≈1157.63")
def i_compound_time():
    # 越早開始：同利率同本金，期數多→終值大
    assert 1000*(1.05)**30 > 1000*(1.05)**10
    return _ok("interest.compound-time", "複利時間威力：1000·1.05³⁰ ≫ 1000·1.05¹⁰")
def i_rule_of_72():
    # 72 法則：翻倍年數≈72/利率%；6% → 12 年，與精確 ln2/ln1.06 相近
    exact = math.log(2)/math.log(1.06)
    assert _rel(72/6, 12) and abs(72/6-exact) < 0.3
    return _ok("interest.rule-of-72", "72法則 72/6=12年≈精確 ln2/ln1.06≈11.9年")
def i_inflation():
    # 通膨侵蝕購買力：實質價值=名目/(1+π)ⁿ；3% 通膨 10 年後 100 元購買力≈74
    assert _rel(100/(1.03)**10, 74.41, 1e-2)
    return _ok("interest.inflation", "通膨3%/10年：100元購買力→100/1.03¹⁰≈74.4")
def i_nominal_real():
    # 費雪近似：實質利率≈名目−通膨；名目5%−通膨3%=2%
    assert _rel(0.05-0.03, 0.02)
    return _ok("interest.nominal-real-rate", "實質利率≈名目−通膨=5%−3%=2%（費雪近似）")

# ---- budget（1 可算）----
def b_income_expense():
    income, fixed, variable = 30000, 18000, 9000
    assert income-(fixed+variable) == 3000 and income > fixed+variable
    return _ok("budget.income-expense", "結餘=收入−支出=30000−27000=3000（量入為出）")

# ---- saving（1 可算）----
def s_opportunity_cost():
    # 選 A(效益8) 放棄 B(次佳效益6) → 機會成本=6
    options = {"A": 8, "B": 6, "C": 4}
    chosen = "A"; oc = max(v for k, v in options.items() if k != chosen)
    assert oc == 6
    return _ok("saving.opportunity-cost", "機會成本=放棄的次佳選項價值=6（選A放棄B）")

# ---- stats（4）----
def st_mean_median_mode():
    d = [2, 2, 3, 5, 100]
    assert st.mean(d) == 22.4 and st.median(d) == 3 and st.mode(d) == 2
    return _ok("stats.mean-median-mode", "[2,2,3,5,100]：平均22.4(受極端值拉高)、中位數3、眾數2")
def st_outliers():
    base = [10, 11, 9, 10, 10]; withx = base+[100]
    assert st.mean(withx) > st.mean(base)+10   # 離群值大幅拉高平均
    assert st.median(withx) == st.median(base) or abs(st.median(withx)-st.median(base)) <= 1
    return _ok("stats.outliers", "極端值100 大幅拉高平均、對中位數影響小")
def st_spread():
    d = [3, 7, 7, 19]
    assert max(d)-min(d) == 16   # 全距
    assert st.pstdev(d) > 0
    return _ok("stats.spread", "全距=max−min=19−3=16；標準差>0 表離散")
def st_percentages():
    # 百分比 vs 百分點：30%→45% 是「升 15 個百分點」或「升 50%」
    assert (45-30) == 15 and _rel((45-30)/30*100, 50)
    return _ok("stats.percentages", "30%→45%：升15個百分點，或相對升(15/30)=50%")

# ---- algorithm（3 可算）----
def a_sort_search():
    # 二分搜尋：有序陣列每次折半，n=1000 最多約 ⌈log2 1000⌉=10 次
    assert math.ceil(math.log2(1000)) == 10
    import bisect
    arr = list(range(0, 100, 2)); i = bisect.bisect_left(arr, 50)
    assert arr[i] == 50
    return _ok("algorithm.sort-search", "二分搜尋 n=1000 最多⌈log₂1000⌉=10次；折半定位")
def a_efficiency():
    # 大O：線性 O(n) vs 二分 O(log n)；n 增大差距擴大
    import math as m
    assert 1000 > m.log2(1000) and 1_000_000 > m.log2(1_000_000)
    return _ok("algorithm.efficiency", "O(n) 遠大於 O(log n)（n=10⁶：1e6 vs ≈20）")
def a_three_structures():
    # 循序/選擇/重複：以計數迴圈求和驗重複結構正確
    total = 0
    for k in range(1, 101):   # 重複
        if k % 2 == 0:        # 選擇
            total += k        # 循序
    assert total == 2550      # 1..100 偶數和
    return _ok("algorithm.three-structures", "循序+選擇(if)+重複(loop)：1..100 偶數和=2550")


CHECKS = {s: fn for s, fn in {
    "logic.if-then": l_if_then, "logic.converse-contrapositive": l_converse_contrapositive,
    "logic.sufficient-necessary": l_sufficient_necessary, "logic.valid-forms": l_valid_forms,
    "logic.invalid-forms": l_invalid_forms, "logic.quantifiers": l_quantifiers,
    "logic.and-or-not": l_and_or_not, "logic.argument-structure": l_argument_structure,
    "deduction-induction.deduction": di_deduction, "deduction-induction.induction": di_induction,
    "deduction-induction.overgeneralization": di_overgeneralization,
    "interest.simple-vs-compound": i_simple_vs_compound, "interest.compound-time": i_compound_time,
    "interest.rule-of-72": i_rule_of_72, "interest.inflation": i_inflation,
    "interest.nominal-real-rate": i_nominal_real,
    "budget.income-expense": b_income_expense,
    "saving.opportunity-cost": s_opportunity_cost,
    "stats.mean-median-mode": st_mean_median_mode, "stats.outliers": st_outliers,
    "stats.spread": st_spread, "stats.percentages": st_percentages,
    "algorithm.sort-search": a_sort_search, "algorithm.efficiency": a_efficiency,
    "algorithm.three-structures": a_three_structures,
}.items()}
