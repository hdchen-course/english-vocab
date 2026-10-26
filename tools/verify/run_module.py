#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""run_module.py — 以 .venv 一次跑完某 module 的所有 CHECKS，印 `check_id<TAB>canonical_line`。
供 repro_gate 批次重跑（每模組一支子程序，取代每來源一支，大幅加速）。
用法：<venv>/bin/python tools/verify/run_module.py <module>
任一 check 拋例外 → 該行印 `check_id<TAB>FAIL:...`；module import 失敗 → exit 1。
"""
import importlib, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))

def main():
    if len(sys.argv) != 2:
        print("用法：run_module.py <module>"); sys.exit(2)
    try:
        mod = importlib.import_module(sys.argv[1])
    except Exception as e:
        print(f"__module__\tFAIL:import:{e}"); sys.exit(1)
    for cid, fn in getattr(mod, "CHECKS", {}).items():
        try:
            line = fn()
            if not isinstance(line, str) or not line.startswith("PASS:"):
                line = f"FAIL:non-PASS:{line!r}"
        except Exception as e:
            line = f"FAIL:{type(e).__name__}:{e}"
        print(f"{cid}\t{line}")
    sys.exit(0)

if __name__ == "__main__":
    main()
