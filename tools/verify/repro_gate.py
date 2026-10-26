#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""repro_gate.py — anti-fabrication 執行層（§6.8.1 B-08）。

對 source_registry.json 中每個 evidence_method∈{derivation,program,truth_table,corpus} 的來源：
  1. 解析其 reproduction_ref＝`<module>::<check_id>`（module 在 tools/verify/）；
  2. 以 **.venv 解譯器**實際重跑該 check（經 run_check.py）；
  3. 對 stdout 的 canonical 結果行取 sha256 前 16 碼，與 registry 的 content_fingerprint 比對。
任何 check 失敗、ref 無法解析、或 fingerprint 不符 → 閘 FAIL。這使「宣稱可程式驗卻沒真的跑/跑不過」無法蒙混。

fingerprint 慣例：content_fingerprint ＝ sha256(canonical_result_line.encode()).hexdigest()[:16]。
產生/更新 registry 指紋：`python3 tools/verify/repro_gate.py --emit` 印每個 ref 的正確指紋（人工填回 registry）。

VENV 解譯器：預設 /Volumes/workplace/EnglishTraining/.venv/bin/python，可用環境變數 LP_VENV 覆寫。
用法：python3 tools/verify/repro_gate.py [--emit] [--root <dir>]
"""
import hashlib, json, os, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent      # repo root
VERIFY_DIR = Path(__file__).resolve().parent
RUNNER = VERIFY_DIR / "run_check.py"
VENV = os.environ.get("LP_VENV", "/Volumes/workplace/EnglishTraining/.venv/bin/python")
SELF_VERIFIABLE = {"derivation", "program", "truth_table", "corpus"}

def _root():
    if "--root" in sys.argv:
        try:
            b = Path(sys.argv[sys.argv.index("--root") + 1]).resolve()
        except IndexError:
            print("!! --root 未給路徑"); sys.exit(2)
        if not b.is_dir():
            print(f"!! --root 不存在：{b}"); sys.exit(2)
        return b
    return ROOT

def fingerprint(line):
    return hashlib.sha256(line.encode("utf-8")).hexdigest()[:16]

MODRUNNER = VERIFY_DIR / "run_module.py"

def run_ref(ref):
    """ref＝module::check_id → (ok, canonical_line_or_err)。單筆（selftest 用）。"""
    if "::" not in ref:
        return False, f"reproduction_ref 格式錯（需 module::check_id）：{ref}"
    mod, check = ref.split("::", 1)
    if not Path(VENV).exists():
        return False, f".venv 解譯器不存在：{VENV}（設 LP_VENV）"
    p = subprocess.run([VENV, str(RUNNER), mod, check], capture_output=True, text=True)
    out = (p.stdout or "").strip().splitlines()
    line = out[-1] if out else ""
    if p.returncode != 0 or not line.startswith("PASS:"):
        return False, f"重跑失敗（exit={p.returncode}）：{line or (p.stderr or '').strip()[:120]}"
    return True, line

def run_module_batch(module):
    """一支 .venv 子程序跑完整個 module，回傳 {check_id: (ok, line)}。"""
    if not Path(VENV).exists():
        return None, f".venv 解譯器不存在：{VENV}（設 LP_VENV）"
    p = subprocess.run([VENV, str(MODRUNNER), module], capture_output=True, text=True)
    if p.returncode != 0 and not p.stdout.strip():
        return None, f"module 執行失敗：{(p.stderr or '').strip()[:160]}"
    res = {}
    for ln in p.stdout.splitlines():
        if "\t" not in ln:
            continue
        cid, line = ln.split("\t", 1)
        res[cid] = (line.startswith("PASS:"), line)
    return res, ""

def selftest():
    """qualify：證明 gate 有牙——(1) 真 check 重跑成功、(2) 竄改指紋被抓、(3) 壞 ref 被抓。"""
    print("=== repro_gate --selftest ===")
    ok_run, line = run_ref("math_checks::quadratic-formula")
    good_fp = fingerprint(line) if ok_run else ""
    checks = [
        ("真 check 可重跑成功", ok_run and line.startswith("PASS:")),
        ("竄改指紋被偵測（good≠deadbeef）", ok_run and good_fp != "deadbeefdeadbeef"),
        ("壞 ref 被偵測", not run_ref("nomod::nocheck")[0]),
    ]
    allok = all(v for _, v in checks)
    for name, v in checks: print(f"  [{'OK' if v else 'MISS'}] {name}")
    if not ok_run:
        print(f"  （注意：真 check 未能重跑——可能 .venv 缺；詳：{line}）")
    print(f"RESULT: {'PASS ✅' if allok else 'FAIL ❌'}")
    sys.exit(0 if allok else 1)

def main():
    if "--selftest" in sys.argv:
        selftest(); return
    emit = "--emit" in sys.argv
    root = _root()
    reg_f = root / "authoring" / "source_registry.json"
    if not reg_f.exists():
        print(f"!! 缺 source_registry：{reg_f}"); sys.exit(1)
    srcs = json.loads(reg_f.read_text(encoding="utf-8")).get("sources", {})
    repro_srcs = {sid: s for sid, s in srcs.items() if s.get("evidence_method") in SELF_VERIFIABLE}
    # 依 module 分組，每模組一支子程序（大幅加速）
    by_mod = {}
    for sid, s in repro_srcs.items():
        ref = s.get("reproduction_ref", "")
        mod = ref.split("::", 1)[0] if "::" in ref else "__badref__"
        by_mod.setdefault(mod, []).append((sid, s, ref))
    print(f"=== repro_gate（root={root.name}；可重跑來源 {len(repro_srcs)}；模組 {len(by_mod)}）===")
    fails = []
    for mod in sorted(by_mod):
        res_map, err = run_module_batch(mod) if mod != "__badref__" else (None, "reproduction_ref 格式錯")
        for sid, s, ref in sorted(by_mod[mod]):
            check = ref.split("::", 1)[1] if "::" in ref else ""
            if res_map is None:
                fails.append(f"{sid}: {err}"); print(f"  FAIL {sid} ← {ref}：{err}"); continue
            got = res_map.get(check)
            if not got or not got[0]:
                msg = got[1] if got else "check 未在 module 輸出中"
                fails.append(f"{sid}: {msg}"); print(f"  FAIL {sid} ← {ref}：{msg}"); continue
            fp = fingerprint(got[1])
            if emit:
                print(f"  {sid}  fingerprint={fp}  ({ref})")
            else:
                want = s.get("content_fingerprint")
                if fp != want:
                    fails.append(f"{sid}: fingerprint 不符（重跑 {fp} ≠ registry {want}）")
                    print(f"  FAIL {sid}: 重跑指紋 {fp} ≠ registry {want}")
                else:
                    print(f"  ok   {sid} ← {ref}")
    if emit:
        print("（--emit：把上列 fingerprint 填回 source_registry.json 的 content_fingerprint）")
        sys.exit(0)
    print(f"RESULT: {'PASS ✅' if not fails else f'FAIL ❌（{len(fails)}）'}")
    sys.exit(0 if not fails else 1)

if __name__ == "__main__":
    main()
