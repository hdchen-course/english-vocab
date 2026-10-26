#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""run_check.py — 以 .venv 執行單一 reproduction check，印出 canonical 結果行（供 repro_gate 重跑+雜湊）。

用法（務必用 .venv 解譯器，因 checks 需 sympy/numpy）：
    <venv>/bin/python tools/verify/run_check.py <module> <check_id>
  例： .venv/bin/python tools/verify/run_check.py math_checks quadratic-formula
module 相對於本目錄（tools/verify/）。成功印 `PASS:...` exit 0；check 失敗/未知 exit 1。
"""
import importlib, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

def main():
    if len(sys.argv) != 3:
        print("用法：run_check.py <module> <check_id>"); sys.exit(2)
    mod_name, check_id = sys.argv[1], sys.argv[2]
    try:
        mod = importlib.import_module(mod_name)
    except Exception as e:
        print(f"FAIL:import:{mod_name}:{e}"); sys.exit(1)
    checks = getattr(mod, "CHECKS", {})
    fn = checks.get(check_id)
    if fn is None:
        print(f"FAIL:unknown-check:{mod_name}::{check_id}"); sys.exit(1)
    try:
        line = fn()
    except Exception as e:
        print(f"FAIL:{check_id}:{type(e).__name__}:{e}"); sys.exit(1)
    if not isinstance(line, str) or not line.startswith("PASS:"):
        print(f"FAIL:{check_id}:non-PASS-return:{line!r}"); sys.exit(1)
    print(line)
    sys.exit(0)

if __name__ == "__main__":
    main()
