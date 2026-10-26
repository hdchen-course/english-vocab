#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""anti_drift_gate.py — AC-ANTIDRIFT：§0.2 四防漂移錨點「已交付且 fail-closed」驗收。

--verify：四錨點存在性——
  (a) 專案 `.claude/settings.json` 的 PreToolUse 掛了 `lp-reanchor-guard.py`；
  (b) `~/.claude/hooks/inject-sop-carriers.py` 含 `[learning-path-sop]` carrier echo；
  (c) `~/.claude/rules/learning-path-sop-do-not-delete.md` 存在；
  (d) 某 `~/.claude/projects/**/MEMORY.md` 含學習路徑 spec 指標。
--selftest：紅隊 hook 真有牙（以隔離 state 跑 lp-reanchor-guard.py）——
  (1) 未重讀即宣告收斂（Bash sentinel / Edit spec→定案）→ DENY；
  (2) 同 session 先 Read spec 後再宣告 → ALLOW；(3) 壞輸入 fail-open。
exit 0=PASS；非0=FAIL。存在性不足→嚴格 FAIL（§0.2：只有 fail-closed 機器強制有效）。
"""
import json, os, subprocess, sys, tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
HOOK = REPO / ".claude" / "hooks" / "lp-reanchor-guard.py"
SETTINGS = REPO / ".claude" / "settings.json"
CARRIER = Path.home() / ".claude" / "hooks" / "inject-sop-carriers.py"
RULE = Path.home() / ".claude" / "rules" / "learning-path-sop-do-not-delete.md"
PROJECTS = Path.home() / ".claude" / "projects"
SPEC = str(REPO / "LEARNING_PATH_REBUILD_SPEC.md")
DECLARE = "LP-DECLARE-" + "CONVERGENCE"   # 分段組字，避免守門 hook 誤擋本檔原始碼

def _run_hook(payload, state):
    env = dict(os.environ, CLAUDE_LP_STATE=state)
    p = subprocess.run([sys.executable, str(HOOK)], input=json.dumps(payload),
                       capture_output=True, text=True, env=env)
    denied = '"permissionDecision": "deny"' in p.stdout or '"permissionDecision":"deny"' in p.stdout
    return denied, p.returncode, p.stdout.strip()

def verify():
    errs = []
    try:
        if "lp-reanchor-guard.py" not in SETTINGS.read_text(encoding="utf-8"):
            errs.append("(a) 專案 settings.json 未掛 lp-reanchor-guard.py")
    except Exception as e:
        errs.append(f"(a) 讀 settings 失敗：{e}")
    if not HOOK.exists(): errs.append("(a) hook 檔不存在")
    try:
        if "[learning-path-sop]" not in CARRIER.read_text(encoding="utf-8"):
            errs.append("(b) carrier 無 [learning-path-sop] echo")
    except Exception as e:
        errs.append(f"(b) 讀 carrier 失敗：{e}")
    if not RULE.exists(): errs.append("(c) 規則檔不存在")
    found = False
    if PROJECTS.exists():
        for mm in PROJECTS.rglob("MEMORY.md"):
            try:
                if "LEARNING_PATH_REBUILD_SPEC" in mm.read_text(encoding="utf-8"):
                    found = True; break
            except Exception:
                pass
    if not found: errs.append("(d) 無 MEMORY.md 含 LEARNING_PATH_REBUILD_SPEC 指標")
    print("=== anti_drift_gate --verify（四錨點存在性）===")
    for e in errs: print("  [MISS] " + e)
    if not errs: print("  四錨點齊備 (a hook+settings)(b carrier)(c rule)(d memory)")
    print(f"RESULT: {'PASS ✅' if not errs else f'FAIL ❌（{len(errs)}）'}")
    return 0 if not errs else 1

def selftest():
    print("=== anti_drift_gate --selftest（紅隊 hook 有牙）===")
    results = []
    with tempfile.TemporaryDirectory() as td:
        d1, _, _ = _run_hook({"tool_name": "Bash", "session_id": "S1",
                              "tool_input": {"command": "echo " + DECLARE}}, td)
        results.append(("未重讀+Bash宣告收斂→DENY", d1))
        d2, _, _ = _run_hook({"tool_name": "Edit", "session_id": "S2",
                              "tool_input": {"file_path": SPEC, "new_string": "狀態：定案 v1.0"}}, td)
        results.append(("未重讀+Edit狀態→定案→DENY", d2))
        _run_hook({"tool_name": "Read", "session_id": "S3", "tool_input": {"file_path": SPEC}}, td)
        d3, _, _ = _run_hook({"tool_name": "Bash", "session_id": "S3",
                              "tool_input": {"command": "echo " + DECLARE}}, td)
        results.append(("已重讀同session再宣告→ALLOW", not d3))
        # 好案例對照：一般編修（非狀態宣告）即使未重讀也 ALLOW（不誤擋）
        d4, _, _ = _run_hook({"tool_name": "Edit", "session_id": "S4",
                              "tool_input": {"file_path": SPEC, "new_string": "修個錯字"}}, td)
        results.append(("未重讀但一般編修→ALLOW(不誤擋)", not d4))
        env = dict(os.environ, CLAUDE_LP_STATE=td)
        p = subprocess.run([sys.executable, str(HOOK)], input="not json{",
                           capture_output=True, text=True, env=env)
        results.append(("壞輸入 fail-open(exit0,不deny)", p.returncode == 0 and "deny" not in p.stdout))
    allok = all(v for _, v in results)
    for name, v in results: print(f"  [{'OK' if v else 'MISS'}] {name}")
    print(f"RESULT: {'PASS ✅（擋壞案例、放好案例、fail-open）' if allok else 'FAIL ❌'}")
    return 0 if allok else 1

def main():
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    sys.exit(verify())

if __name__ == "__main__":
    main()
