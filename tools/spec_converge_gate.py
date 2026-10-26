#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
spec_converge_gate.py — AC-SPEC 的 finalization 元件：證明 spec 已達「定案」門檻。

為什麼存在
  spec 定案 ＝ (a) content_audit 連續 N=5 clean 於「未變動的同一份 spec」 ＋ (b) 紅隊通過
  （證明 spec 的規範無法被繞過/丟棄）。這兩件事必須有**不可手造的機器證據**，否則「宣稱定案」
  只是嘴上說。本 gate fail-closed：ledger 不足證據一律 DENY。綁 spec 內容 sha——spec 一改，
  舊的 clean 輪與紅隊全部作廢（仿視覺 QA 的 .sha-manifest）。

Ledger：authoring/spec_converge_ledger.json
  {
    "spec_file": "LEARNING_PATH_REBUILD_SPEC.md",
    "required_clean": 5,
    "rounds": [ {"round":1,"spec_sha":"<16hex>","clean":true,"confirmed":0,"recorded_at":"ISO"} , ... ],
    "redteam": {"spec_sha":"<16hex>","passed":true,"recorded_at":"ISO","note":"..."}
  }
  * clean 輪只應由實際跑 content_audit 後誠實記入（手造＝作弊；此 gate 只驗結構/一致，
    真實性靠「記入時實跑」的紀律 + 綁 sha：改 spec 就得重跑）。

介面
  python3 tools/spec_converge_gate.py --selftest        # 自測（壞 ledger→DENY、好 ledger→ALLOW）
  python3 tools/spec_converge_gate.py --verify-ledger    # 驗當前 spec 的定案證據
  忽略 orchestrator 附加的 --root <dir> / --release-id <id>
EXIT：0=定案證據充分（PASS），1=不足/不一致（FAIL），2=selftest 失敗。
"""
import sys, os, re, json, hashlib, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = os.path.join(ROOT, "authoring", "spec_converge_ledger.json")
DEFAULT_SPEC = "LEARNING_PATH_REBUILD_SPEC.md"
REQUIRED_CLEAN = 5

def spec_sha(spec_path):
    with open(spec_path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()[:16]

def _iso_ok(s):
    try:
        datetime.date.fromisoformat(str(s)[:10]); return True
    except Exception:
        return False

def evaluate(ledger, cur_sha):
    """回傳 (ok, reasons[])，fail-closed。"""
    reasons = []
    if not isinstance(ledger, dict):
        return False, ["ledger 非物件"]
    need = int(ledger.get("required_clean", REQUIRED_CLEAN))
    rounds = ledger.get("rounds")
    if not isinstance(rounds, list) or len(rounds) < need:
        return False, [f"clean 輪不足：需 {need}，有 {len(rounds) if isinstance(rounds,list) else 0}"]
    # 取「最後連續、clean、同 cur_sha」的輪數
    streak = 0
    for r in reversed(rounds):
        if not isinstance(r, dict): break
        if r.get("clean") is True and r.get("spec_sha") == cur_sha and _iso_ok(r.get("recorded_at")):
            streak += 1
        else:
            break
    if streak < need:
        reasons.append(f"未達連續 {need} clean（同 spec sha={cur_sha}）：目前連續 {streak}")
    rt = ledger.get("redteam")
    if not (isinstance(rt, dict) and rt.get("passed") is True
            and rt.get("spec_sha") == cur_sha and _iso_ok(rt.get("recorded_at"))):
        reasons.append(f"紅隊未通過或未綁當前 spec sha={cur_sha}")
    ok = (streak >= need) and not any("紅隊" in x for x in reasons)
    return (ok and not reasons), reasons

def _strip_orchestrator_flags(raw):
    args, skip = [], False
    for a in raw:
        if skip:
            skip = False; continue
        if a in ("--root", "--release-id"):
            skip = True; continue
        args.append(a)
    return args

def verify_ledger():
    spec_path = os.path.join(ROOT, DEFAULT_SPEC)
    if not os.path.exists(spec_path):
        print(f"  FAIL：找不到 spec {DEFAULT_SPEC}"); print("RESULT: FAIL ❌"); return 1
    cur = spec_sha(spec_path)
    if not os.path.exists(LEDGER):
        print(f"  FAIL：尚無 spec 收斂 ledger（{os.path.relpath(LEDGER,ROOT)}）——spec 尚未開始 5-clean/紅隊。")
        print(f"  （當前 spec sha={cur}）"); print("RESULT: FAIL ❌"); return 1
    try:
        ledger = json.load(open(LEDGER, encoding="utf-8"))
    except Exception as e:
        print(f"  FAIL：ledger 解析失敗 {e}"); print("RESULT: FAIL ❌"); return 1
    ok, reasons = evaluate(ledger, cur)
    print(f"=== spec 定案證據（spec sha={cur}）===")
    for r in reasons:
        print("  ✗", r)
    if ok:
        print(f"  ✓ 連續 {ledger.get('required_clean',REQUIRED_CLEAN)} clean 同 sha ＋ 紅隊通過綁同 sha")
    print("RESULT:", "PASS ✅" if ok else "FAIL ❌")
    return 0 if ok else 1

def selftest():
    sha = "abcd1234abcd1234"
    today = datetime.date.today().isoformat()
    good = {"required_clean": 5,
            "rounds": [{"round": i, "spec_sha": sha, "clean": True, "recorded_at": today} for i in range(1, 6)],
            "redteam": {"spec_sha": sha, "passed": True, "recorded_at": today}}
    ok = True
    r, _ = evaluate(good, sha)
    if not r: print("  selftest FAIL：好 ledger 應 PASS"); ok = False
    else: print("  selftest：好 ledger（5 clean 同 sha ＋ 紅隊）→ ALLOW ✅")
    # 壞例們皆須 DENY
    bad_cases = {
        "只有 4 clean": {**good, "rounds": good["rounds"][:4]},
        "第 3 輪 clean=false 打斷連續": {**good, "rounds": [{**x, "clean": (x["round"] != 3)} for x in good["rounds"]]},
        "其中一輪 sha 不同（spec 改過）": {**good, "rounds": [{**x, "spec_sha": ("zzzz0000zzzz0000" if x["round"] == 5 else sha)} for x in good["rounds"]]},
        "紅隊未通過": {**good, "redteam": {"spec_sha": sha, "passed": False, "recorded_at": today}},
        "紅隊綁舊 sha": {**good, "redteam": {"spec_sha": "ffff9999ffff9999", "passed": True, "recorded_at": today}},
        "無紅隊": {k: v for k, v in good.items() if k != "redteam"},
        "未來日期": {**good, "rounds": [{**x, "recorded_at": "0000"} for x in good["rounds"]]},
    }
    for name, bad in bad_cases.items():
        r, _ = evaluate(bad, sha)
        if r: print(f"  selftest FAIL：壞例『{name}』竟被放行"); ok = False
        else: print(f"  selftest：壞例『{name}』→ DENY ✅")
    print("SELFTEST:", "PASS ✅" if ok else "FAIL ❌")
    return 0 if ok else 2

def main():
    raw = _strip_orchestrator_flags(sys.argv[1:])
    if "--selftest" in sys.argv[1:]:
        return selftest()
    if "--verify-ledger" in raw:
        return verify_ledger()
    print("用法：--selftest | --verify-ledger"); return 1

if __name__ == "__main__":
    sys.exit(main())
