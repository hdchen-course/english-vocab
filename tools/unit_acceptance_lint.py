#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""unit_acceptance_lint.py — §6.6 單元驗收 rubric 的「確定性、機器可驗」子集 lint（AC-UNIT-1／AC-UNIT-3 運算元；Phase 1）。

為什麼存在
  §6.6 的 10 項單元驗收 rubric 中，有些是設計／語意判斷（需人工 play-through 或 §8 專家 panel），
  有些則是「設計中立、純機械」可由程式確定性判定。本 lint 只實作後者，並對「所需產物尚未建立」的
  檢查採 SKIP-WITH-WARNING（不硬擋未建依賴），清楚報告哪些被跳過與原因，杜絕假裝通過（§0.2）。

  本 lint 聚焦 rubric「語意綁定」（真教真考 tag 綁定、時長、數學型答案可機械驗算部分、結構要素），
  不重做 JSON-schema 形狀驗證——那屬 `tools/unit_schema_gate.py`（AC-SCHEMA）。若該 gate 存在，
  本工具以子行程呼叫它並轉述結果（委派），不重覆實作。

實作（硬檢查，計入 exit code＝失敗單元數）
  ⑦ 真教真考 tag 綁定（§6.2.2／§6.6②／AC-COV-1）：
     knowledge_point_ids[] ⊆ (∪ teach.kp_ids) ∩ (∪ practice.kp_ids)（declaration-stuffing＝FAIL）；
     且**每一個** kp id（knowledge_point_ids ∪ prerequisites ∪ 各 teach.kp_ids ∪ 各 practice.kp_ids）
     必須存在於 `authoring/knowledge_points.json` manifest（懸空＝FAIL）。
  ⑧ est_minutes ≤ 12（INV-4）。
  ④（機械部分）符號／數值型答案：當某 practice 題為數值／符號型（答案字元集為算式字元且含數字，
     或 validation_method∈{oracle,exhaustive}），檢查 answer 存在且形式良好（非空、含數字、無明顯畸形）。
     語言型「正解代入朗讀通順」屬 AC-UNIT-1 人工 play-through，不在此機械清單。
  ⑩ code-download：僅當單元宣告含可執行碼時，檢查有 code-download bundle 參照（presence）；否則 N/A。
  §6.2.2 結構要素（rubric⑦ 的運算元）：unit_id 存在；每 teach 段有非空 kp_ids[]；
     每 practice 題有 question_id ＋ 非空 kp_ids[]。

委派／SKIP-WITH-WARNING（不計入 exit code；僅報告）
  ② token-only／零硬編色碼或 px 魔術數：屬「頁面 CSS」範疇，由 `design_consistency_gate.js`
     ＋ `content_card_width_lint.js` 把關——本工具標記為「delegated」，不重做。
  ⑥ 繁體／零簡體：委派 `tools/scan_simplified.py`（本工具會以子行程對所有 *.units.json 跑它並轉述結果）。
  結構形狀（完整 JSON-schema）：委派 `tools/unit_schema_gate.py --verify`（本工具轉述其結果）。
  AC-UNIT-3 golden-diff ＋ deviation_reason 有效性：`authoring/deviation_categories.json`
     與 `authoring/golden/` **尚未建立** → SKIP-WITH-WARNING（標記為「pending Phase-1 dependency」），
     不捏造通過；若單元已宣告 deviation_reason，僅報告「無法驗證（缺依賴）」，不放行也不假裝。

介面
  python3 tools/unit_acceptance_lint.py                 # 掃 root 下所有 *.units.json
  python3 tools/unit_acceptance_lint.py --root <dir>
  python3 tools/unit_acceptance_lint.py --file <page>.units.json
  python3 tools/unit_acceptance_lint.py --selftest      # 離線自測
  （--no-delegate 可關閉委派子行程呼叫，只跑本工具的硬檢查）

EXIT CODE（請 UNPIPED 讀取）
  0..N   ＝ 未通過本工具「已實作硬檢查」的單元數（skip 是警告、不是失敗）。
  255    ＝ 哨兵：examined nothing（找不到任何 *.units.json／檔案無單元）。
  （委派子行程（⑥／schema gate）的結果僅報告，不改變本工具 exit code。）
"""
import argparse
import glob
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "authoring", "knowledge_points.json")

EST_MINUTES_CAP = 12                       # INV-4
SENTINEL_NOTHING = 255                     # 哨兵：examined nothing

# ④ 機械部分：判定「數值／符號型」候選答案用
#   算式字元集（數字＋常見運算子／等號／變數／括號／分數線／全形乘除）
_SYMBOLIC_CHARS = re.compile(r"^[\s0-9+\-*/^=.(){}\[\]×÷·,:<>≤≥πa-dxyznr_|]+$")
_HAS_DIGIT = re.compile(r"\d")
_MALFORMED_OP = re.compile(r"[+\-*/^×÷=]{2,}")          # 連續運算子（++、==、*/…）＝畸形
_FACT_COMPUTABLE = {"oracle", "exhaustive"}             # §6.8.1 可計算型驗證法

# ⑩ 可執行碼宣告的偵測鍵（單元層或段落層）
_CODE_UNIT_KEYS = ("code", "executable_code", "runnable_code", "code_sample", "code_snippet")
_CODE_BUNDLE_KEYS = ("code_download", "code_bundle", "download_bundle", "bundle_path", "code_bundle_path")


# ────────────────────────── 載入 ──────────────────────────
def load_manifest_ids(root):
    path = os.path.join(root, "authoring", "knowledge_points.json")
    if not os.path.exists(path):
        return None
    data = json.loads(open(path, encoding="utf-8").read())
    return {r["id"] for r in data["items"]}


def iter_units(data):
    """sidecar 可為 unit 陣列，或 {units:[...]}。回傳 unit 物件清單。"""
    if isinstance(data, dict):
        return data.get("units", []) or []
    if isinstance(data, list):
        return data
    return []


# ────────────────────────── 單元層硬檢查 ──────────────────────────
def _collect_kp(u):
    """回傳 (宣告集, teach 聯集, practice 聯集, 全部引用的 kp id 集合)。"""
    decl = [k for k in (u.get("knowledge_point_ids") or []) if isinstance(k, str)]
    teach_kp, prac_kp, allrefs = set(), set(), set()
    allrefs.update(decl)
    allrefs.update(k for k in (u.get("prerequisites") or []) if isinstance(k, str))
    for t in (u.get("teach") or []):
        if isinstance(t, dict):
            for k in (t.get("kp_ids") or []):
                if isinstance(k, str):
                    teach_kp.add(k); allrefs.add(k)
    for p in (u.get("practice") or []):
        if isinstance(p, dict):
            for k in (p.get("kp_ids") or []):
                if isinstance(k, str):
                    prac_kp.add(k); allrefs.add(k)
    return decl, teach_kp, prac_kp, allrefs


def _is_symbolic_answer(ans_str, validation_method):
    """④：判定是否為「數值／符號型」候選（設計中立、保守）。"""
    s = (ans_str or "").strip()
    if not s:
        return False
    if validation_method in _FACT_COMPUTABLE and _HAS_DIGIT.search(s):
        return True
    # 純算式字元集且含數字（排除含英文句子的語言型答案）
    if _SYMBOLIC_CHARS.match(s) and _HAS_DIGIT.search(s):
        return True
    return False


def _symbolic_wellformed(ans_str):
    """④：符號／數值型答案是否形式良好（非空、含數字、無連續運算子畸形）。"""
    s = (ans_str or "").strip()
    if not s:
        return False, "空答案"
    if not _HAS_DIGIT.search(s):
        return False, "數值型卻無任何數字"
    if _MALFORMED_OP.search(s):
        return False, f"連續運算子畸形（{s}）"
    if re.match(r"^[+\-*/^×÷=]", s) or re.search(r"[+\-*/^×÷=]$", s):
        return False, f"首/尾為二元運算子（{s}）"
    # 若為純數值，應可 parse
    if re.fullmatch(r"[-+]?(\d+(\.\d+)?|\.\d+)", s):
        try:
            float(s)
        except ValueError:
            return False, f"純數值無法解析（{s}）"
    return True, ""


def _declares_executable_code(u):
    """⑩：單元是否宣告含可執行碼。"""
    for k in _CODE_UNIT_KEYS:
        if u.get(k):
            return True
    if u.get("has_code") or u.get("runnable"):
        return True
    for seg in (u.get("teach") or []):
        if isinstance(seg, dict) and (seg.get("kind") == "code" or seg.get("code")):
            return True
    for p in (u.get("practice") or []):
        if isinstance(p, dict) and p.get("code"):
            return True
    return False


def _has_code_bundle(u):
    for k in _CODE_BUNDLE_KEYS:
        if u.get(k):
            return True
    return False


def check_unit(u, manifest_ids, where):
    """對單一 unit 跑所有已實作硬檢查。回傳 (failed_checks[], notes{})。
    failed_checks：違反的 rubric 代號清單（去重）。notes：④/⑩ 的統計與 deviation 旁註。"""
    failed = set()
    notes = {"num_symbolic": 0, "code_declared": False, "has_deviation": False}

    uid = u.get("unit_id")
    # ── 結構要素（§6.2.2）：unit_id ──
    if not uid or not isinstance(uid, str):
        failed.add("structural:unit_id")

    decl, teach_kp, prac_kp, allrefs = _collect_kp(u)

    # ── 結構要素：每 teach 段非空 kp_ids ──
    teach = u.get("teach")
    if not isinstance(teach, list) or not teach:
        failed.add("structural:teach")
    else:
        for i, t in enumerate(teach):
            if not isinstance(t, dict) or not (t.get("kp_ids") and isinstance(t["kp_ids"], list)):
                failed.add("structural:teach_kp_ids")
                break

    # ── 結構要素：每 practice 題有 question_id ＋ 非空 kp_ids ──
    prac = u.get("practice")
    if not isinstance(prac, list) or not prac:
        failed.add("structural:practice")
    else:
        for i, p in enumerate(prac):
            if not isinstance(p, dict):
                failed.add("structural:practice_shape"); break
            if not p.get("question_id"):
                failed.add("structural:practice_question_id")
            if not (p.get("kp_ids") and isinstance(p["kp_ids"], list)):
                failed.add("structural:practice_kp_ids")

    # ── ⑦ 真教真考 ＋ 每個 kp id 存在於 manifest ──
    both = teach_kp & prac_kp
    missing_bind = set(decl) - both
    if missing_bind:
        failed.add("7:binding")  # 宣告卻未同時真教真考
    if manifest_ids is not None:
        missing_manifest = {k for k in allrefs if k not in manifest_ids}
        if missing_manifest:
            failed.add("7:manifest")  # 懸空 kp id

    # ── ⑧ est_minutes ≤ 12 ──
    em = u.get("est_minutes")
    if isinstance(em, bool) or not isinstance(em, (int, float)):
        failed.add("8:est_minutes_missing")
    elif em > EST_MINUTES_CAP:
        failed.add("8:est_minutes_cap")

    # ── ④（機械）符號／數值型答案 ──
    for p in (prac if isinstance(prac, list) else []):
        if not isinstance(p, dict):
            continue
        ans = p.get("answer")
        ans_str = ans if isinstance(ans, str) else (json.dumps(ans, ensure_ascii=False) if ans is not None else "")
        vm = p.get("validation_method")
        if _is_symbolic_answer(ans_str, vm):
            notes["num_symbolic"] += 1
            ok, _why = _symbolic_wellformed(ans_str)
            if not ok:
                failed.add("4:symbolic_answer")

    # ── ⑩ code-download（僅宣告含可執行碼時）──
    if _declares_executable_code(u):
        notes["code_declared"] = True
        if not _has_code_bundle(u):
            failed.add("10:code_bundle_missing")

    # ── AC-UNIT-3 旁註（不計入 exit；依賴未建 → SKIP）──
    if u.get("deviation_reason"):
        notes["has_deviation"] = True

    return sorted(failed), notes


# ────────────────────────── 委派子行程 ──────────────────────────
def _run_delegate(argv, label):
    """跑委派工具，回傳 (rc, 首尾輸出摘要)；失敗/缺工具時回傳 (None, 原因)。"""
    try:
        r = subprocess.run(argv, capture_output=True, text=True, timeout=300)
    except FileNotFoundError:
        return None, f"{label}: 工具不存在（{argv[1] if len(argv) > 1 else argv}）"
    except Exception as e:  # noqa: BLE001
        return None, f"{label}: 呼叫失敗 {e}"
    tail = (r.stdout or "").strip().splitlines()
    summary = tail[-1] if tail else (r.stderr or "").strip()[:200]
    return r.returncode, summary


# ────────────────────────── selftest ──────────────────────────
def _clean_unit():
    return {
        "unit_id": "eng.t_base.vocab.demo",
        "knowledge_point_ids": ["eng.t_base.vocab.numbers"],
        "prerequisites": [],
        "est_minutes": 5,
        "subject": "eng", "strand": "vocab",
        "selfeval": ["還不熟", "快會了", "會了"],
        "teach": [{"kind": "text", "body": "x", "kp_ids": ["eng.t_base.vocab.numbers"]}],
        "practice": [{"question_id": "q1", "type": "mcq", "stem": "s", "answer": "One plus one is two.",
                      "feedback": "f", "kp_ids": ["eng.t_base.vocab.numbers"],
                      "required_kp_ids": ["eng.t_base.vocab.numbers"], "validation_method": "expert"}],
    }


def _selftest():
    import copy
    mids = {"eng.t_base.vocab.numbers"}
    cases = []  # (label, mutate, expect_fail, which)

    def mk(mut):
        u = copy.deepcopy(_clean_unit()); mut(u); return u

    cases.append(("clean", lambda u: None, False, None))
    cases.append(("⑦ 宣告未真考（kp 不在 practice）",
                  lambda u: u["practice"][0].__setitem__("kp_ids", ["eng.t_base.vocab.other"]) or
                            u["practice"][0].__setitem__("required_kp_ids", ["eng.t_base.vocab.other"]),
                  True, "7:binding"))
    cases.append(("⑦ kp 不在 manifest",
                  lambda u: u.__setitem__("knowledge_point_ids", ["eng.fake.zzz"]) or
                            u["teach"][0].__setitem__("kp_ids", ["eng.fake.zzz"]) or
                            u["practice"][0].__setitem__("kp_ids", ["eng.fake.zzz"]),
                  True, "7:manifest"))
    cases.append(("⑧ est_minutes=25", lambda u: u.__setitem__("est_minutes", 25), True, "8:est_minutes_cap"))
    cases.append(("結構 unit_id 缺", lambda u: u.pop("unit_id"), True, "structural:unit_id"))
    cases.append(("結構 practice 缺 question_id", lambda u: u["practice"][0].pop("question_id"), True,
                  "structural:practice_question_id"))
    cases.append(("④ 數值答案畸形",
                  lambda u: u["practice"][0].__setitem__("answer", "2++3") or
                            u["practice"][0].__setitem__("validation_method", "oracle"),
                  True, "4:symbolic_answer"))
    cases.append(("④ 數值答案良好（不應擋）",
                  lambda u: u["practice"][0].__setitem__("answer", "5") or
                            u["practice"][0].__setitem__("validation_method", "oracle"),
                  False, None))
    cases.append(("⑩ 宣告碼但無 bundle",
                  lambda u: u.__setitem__("has_code", True), True, "10:code_bundle_missing"))
    cases.append(("⑩ 宣告碼且有 bundle（不應擋）",
                  lambda u: u.__setitem__("has_code", True) or u.__setitem__("code_download", "dl/x.zip"),
                  False, None))

    ok = True
    for label, mut, expect_fail, which in cases:
        failed, _notes = check_unit(mk(mut), mids, "selftest")
        did_fail = len(failed) > 0
        good = (did_fail == expect_fail)
        if which and expect_fail:
            good = good and (which in failed)
        ok = ok and good
        print(f"  [{'OK' if good else 'BAD'}] {label}: {failed or 'PASS'} (expect {'FAIL' if expect_fail else 'PASS'})")
    return ok


# ────────────────────────── main ──────────────────────────
def main():
    ap = argparse.ArgumentParser(description="§6.6 單元驗收 rubric 確定性子集 lint（fail-closed）")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--file")
    ap.add_argument("--root", default=ROOT)
    ap.add_argument("--no-delegate", action="store_true", help="關閉委派子行程（⑥/schema gate）")
    args = ap.parse_args()

    if args.selftest:
        print("=== unit_acceptance_lint --selftest ===")
        ok = _selftest()
        print("RESULT:", "PASS ✅" if ok else "FAIL ❌")
        sys.exit(0 if ok else 2)

    root = os.path.abspath(args.root)
    manifest_ids = load_manifest_ids(root)
    if manifest_ids is None:
        print("  [warn] 找不到 authoring/knowledge_points.json → ⑦ 的 manifest 存在性檢查將跳過")

    files = ([args.file] if args.file
             else sorted(glob.glob(os.path.join(root, "**", "*.units.json"), recursive=True)))

    # 依賴存在性（AC-UNIT-3）
    dev_cats = os.path.join(root, "authoring", "deviation_categories.json")
    golden_dir = os.path.join(root, "authoring", "golden")
    ac_unit3_ready = os.path.exists(dev_cats) and os.path.isdir(golden_dir)

    total_units = 0
    failing = []           # (unit_id, file, [checks])
    num_symbolic = 0
    code_units = 0
    deviation_units = []

    for f in files:
        try:
            data = json.loads(open(f, encoding="utf-8").read())
        except Exception as e:  # noqa: BLE001
            print(f"  [error] {os.path.basename(f)}: JSON 解析失敗 {e}")
            failing.append((f"<parse-error>", os.path.basename(f), ["parse_error"]))
            continue
        for u in iter_units(data):
            total_units += 1
            checks, notes = check_unit(u, manifest_ids, os.path.basename(f))
            num_symbolic += notes["num_symbolic"]
            if notes["code_declared"]:
                code_units += 1
            if notes["has_deviation"]:
                deviation_units.append((u.get("unit_id"), os.path.basename(f)))
            if checks:
                failing.append((u.get("unit_id"), os.path.basename(f), checks))

    # ── 報告 ──
    print("=== unit_acceptance_lint — §6.6 rubric 確定性子集 ===")
    print(f"檔案數：{len(files)}；單元數：{total_units}")

    if total_units == 0:
        print("  （examined nothing：找不到任何 *.units.json 或檔內無單元）")
        print("RESULT: SENTINEL（examined nothing）")
        sys.exit(SENTINEL_NOTHING)

    print("\n[實作硬檢查] ⑦ 真教真考綁定＋kp∈manifest｜⑧ est_minutes≤12｜④ 符號型答案機械驗算｜⑩ code-download presence｜結構要素(unit_id/teach.kp_ids/practice.question_id+kp_ids)")
    print(f"  ④ 偵測到數值/符號型答案題數：{num_symbolic}（English 語言型答案非候選，故多為 0）")
    print(f"  ⑩ 宣告含可執行碼的單元數：{code_units}（0＝全體 N/A）")

    print("\n[SKIP-WITH-WARNING / 委派]")
    print("  ② token-only/零硬編色碼/px：DELEGATED → design_consistency_gate.js ＋ content_card_width_lint.js（頁面 CSS 範疇，不在此重做）")
    if ac_unit3_ready:
        print("  AC-UNIT-3 deviation/golden：依賴已就緒（未在本輪實作 golden-diff，仍為旁註）")
    else:
        print("  AC-UNIT-3 golden-diff＋deviation_reason 有效性：SKIPPED（pending Phase-1 dependency）"
              f" — 缺 {'authoring/deviation_categories.json ' if not os.path.exists(dev_cats) else ''}"
              f"{'authoring/golden/' if not os.path.isdir(golden_dir) else ''}".rstrip())
        if deviation_units:
            print(f"    ⚠ 有 {len(deviation_units)} 單元宣告 deviation_reason，但依賴未建無法驗證（不放行、不假裝）：")
            for uid, fn in deviation_units[:20]:
                print(f"      - {uid} ({fn})")
        else:
            print("    （目前無任何單元宣告 deviation_reason）")

    # 委派子行程：⑥ 簡體掃描 ＋ schema 形狀
    if not args.no_delegate and files:
        py = sys.executable
        rc6, sum6 = _run_delegate([py, "-I", os.path.join(root, "tools", "scan_simplified.py")] + files,
                                  "⑥ scan_simplified")
        if rc6 is None:
            print(f"  ⑥ 繁體/零簡體：DELEGATED（未能執行：{sum6}）")
        else:
            print(f"  ⑥ 繁體/零簡體：DELEGATED → scan_simplified.py rc={rc6} | {sum6}")
        schema_gate = os.path.join(root, "tools", "unit_schema_gate.py")
        if os.path.exists(schema_gate):
            rcs, sums = _run_delegate([py, "-I", schema_gate, "--verify", "--root", root],
                                      "schema 形狀")
            print(f"  結構形狀（完整 schema）：DELEGATED → unit_schema_gate.py --verify rc={rcs} | {sums}")
        else:
            print("  結構形狀：unit_schema_gate.py 不存在 → 本工具僅做 rubric 相關最小結構檢查")
    else:
        print("  ⑥/schema：委派已關閉（--no-delegate）")

    # ── 本工具硬檢查結論 ──
    print(f"\n[本工具硬檢查結果] 通過 {total_units - len(failing)}/{total_units}；未通過 {len(failing)}")
    if failing:
        for uid, fn, checks in failing:
            print(f"  FAIL  {uid}  ({fn})  →  {', '.join(checks)}")
    print("RESULT:", "PASS ✅" if not failing else f"FAIL ❌（{len(failing)} 單元）")
    sys.exit(len(failing))


if __name__ == "__main__":
    main()
