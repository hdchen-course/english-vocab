#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""source_freshness_gate.py — AC-CORRECT 的 freshness 子閘（§6.8.1「time-sensitive 內容帶 recheck_after，過期擋 release」）。

對 `authoring/source_registry.json` 內**帶 `recheck_after` 的來源**（法律/考試/人口/地理數據/AI 平台、
以及安全類 consensus_current 源），斷言其 `recheck_after` **未過期**（>= 今日）；過期＝FAIL（須重核後更新日期）。
格式錯（非 ISO）亦 FAIL。無 `recheck_after` 的來源不在本閘範圍（由其 evidence_method 各自的閘管）。

與 promote_verified._fresh 同義、同紀律；獨立成閘供 AC-CORRECT 的 `freshness:` component 直接呼叫，
並讓「哪些安全/時效來源快過期」有單一可跑的體檢點。

介面：--selftest（離線壞例 DENY/好例 ALLOW）；--verify（對真 registry 跑）。
EXIT：0=全新鮮；1=有過期/壞日期；2=selftest 失敗。
"""
import argparse, json, os, sys
from datetime import date, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REG = os.path.join(ROOT, "authoring", "source_registry.json")


def check(sources, today):
    """回傳 [(sid, 問題字串)]。只看帶 recheck_after 者。"""
    probs = []
    for sid, s in sources.items():
        ra = s.get("recheck_after")
        if not ra:
            continue
        try:
            d = datetime.strptime(ra, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            probs.append((sid, f"recheck_after `{ra}` 非 ISO 日期")); continue
        if d < today:
            probs.append((sid, f"已過期 recheck_after={ra}（<今日 {today.isoformat()}），須重核更新"))
    return probs


def _selftest():
    today = date(2026, 10, 30)
    srcs = {
        "fresh-1": {"recheck_after": "2027-10-30"},     # 未來 → OK
        "today-1": {"recheck_after": "2026-10-30"},     # 等於今日 → OK（>=）
        "no-recheck": {"evidence_method": "derivation"},  # 無 recheck → 不在範圍
        "expired-1": {"recheck_after": "2025-01-01"},    # 過期 → FAIL
        "baddate-1": {"recheck_after": "2026/13/40"},    # 壞格式 → FAIL
    }
    probs = dict(check(srcs, today))
    ok1 = "fresh-1" not in probs and "today-1" not in probs and "no-recheck" not in probs
    ok2 = "expired-1" in probs
    ok3 = "baddate-1" in probs
    print(f"  [{'OK' if ok1 else 'BAD'}] 未來/等於今日/無recheck → 放行")
    print(f"  [{'OK' if ok2 else 'BAD'}] 過期來源 → FAIL")
    print(f"  [{'OK' if ok3 else 'BAD'}] 壞日期格式 → FAIL")
    return ok1 and ok2 and ok3


def main():
    ap = argparse.ArgumentParser(description="AC-CORRECT freshness 子閘（fail-closed）")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--verify", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        print("=== source_freshness_gate --selftest ===")
        ok = _selftest(); print("RESULT:", "PASS ✅" if ok else "FAIL ❌"); sys.exit(0 if ok else 2)
    if args.verify:
        sources = json.loads(open(REG, encoding="utf-8").read()).get("sources", {})
        probs = check(sources, date.today())
        for sid, why in probs:
            print(f"  [freshness] {sid}: {why}")
        n_tracked = sum(1 for s in sources.values() if s.get("recheck_after"))
        print(f"RESULT(freshness): {'PASS ✅' if not probs else 'FAIL ❌'}（帶 recheck_after {n_tracked} 源，過期/壞 {len(probs)}）")
        sys.exit(0 if not probs else 1)
    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    main()
