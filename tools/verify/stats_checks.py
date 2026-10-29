#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""stats_checks.py — 統計/資料素養知識點的**可重跑**證據（§6.8.1 fact evidence，method=program）。
每個 check() 回傳一行 canonical 結果字串（PASS:...）或拋例外；repro_gate 以 .venv 重跑比對 sha256 指紋。
生成器（教材）與 oracle（本檔）不共用實作（B-08 獨立 oracle）。"""

def _ok(check_id, detail):
    return f"PASS:{check_id}:{detail}"

def simpson_paradox():
    # 辛普森悖論：分組看與合併看趨勢相反。用經典腎結石治療數據（Charig 1986 風格）窮舉驗證反轉成立。
    # 治療 A / 治療 B 的「成功數/總數」：
    a_small, a_large = (81, 87), (192, 263)     # A：小結石、大結石
    b_small, b_large = (234, 270), (55, 80)      # B：小結石、大結石
    ra_s, rb_s = a_small[0]/a_small[1], b_small[0]/b_small[1]
    ra_l, rb_l = a_large[0]/a_large[1], b_large[0]/b_large[1]
    # 兩個分組內 A 的成功率皆高於 B
    assert ra_s > rb_s, f"小結石組 A 未勝：{ra_s} vs {rb_s}"
    assert ra_l > rb_l, f"大結石組 A 未勝：{ra_l} vs {rb_l}"
    # 合併後反轉：B 的整體成功率高於 A
    a_tot = (a_small[0]+a_large[0], a_small[1]+a_large[1])   # (273, 350)
    b_tot = (b_small[0]+b_large[0], b_small[1]+b_large[1])   # (289, 350)
    ra, rb = a_tot[0]/a_tot[1], b_tot[0]/b_tot[1]
    assert ra < rb, f"合併未反轉：A {ra} 不應 < B {rb}"
    return _ok("life.simpson-paradox",
               f"分組A皆勝(小{ra_s:.3f}>{rb_s:.3f}、大{ra_l:.3f}>{rb_l:.3f})"
               f"但合併B勝(A{ra:.3f}<B{rb:.3f})→趨勢反轉；肇因組別大小與分派不均(潛在混淆變項)")

CHECKS = {
    "simpson-paradox": simpson_paradox,
}
