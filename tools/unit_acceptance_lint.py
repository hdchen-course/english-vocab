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
    """回傳 (宣告集, teach 聯集, practice 聯集, 全部引用的 kp id 集合)。
    注意：`prerequisites[]` 是**單元 id**（§6.2.2 的 unit-DAG 邊），不是 KP id，故
    **不**併入 allrefs（allrefs 僅供 ⑦ 的「KP 必須存在於 manifest」檢查用）。prereq
    的解析另由 check_unit 對「全站 unit_id 集合」驗證（見 prereq:unknown）。"""
    decl = [k for k in (u.get("knowledge_point_ids") or []) if isinstance(k, str)]
    teach_kp, prac_kp, allrefs = set(), set(), set()
    allrefs.update(decl)
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


def check_unit(u, manifest_ids, where, unit_ids=None):
    """對單一 unit 跑所有已實作硬檢查。回傳 (failed_checks[], notes{})。
    failed_checks：違反的 rubric 代號清單（去重）。notes：④/⑩ 的統計與 deviation 旁註。
    unit_ids：全站 unit_id 集合（供 prereq 解析檢查）；None＝跳過該檢查（向後相容）。"""
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

    # ── prereq 解析：每個 prerequisites[] 必須是已知 unit_id（非 KP id）──
    if unit_ids is not None:
        prereqs = [p for p in (u.get("prerequisites") or []) if isinstance(p, str)]
        if any(p not in unit_ids for p in prereqs):
            failed.add("prereq:unknown")  # 懸空 prereq 單元 id

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
    # ── prereq 解析紅隊（prerequisites 是 unit_id，非 KP id）──
    # 回歸守門：prereq 是「合法 unit_id 但不在 KP manifest」→ 必須 PASS（舊 bug 會誤報 7:manifest）。
    PK = {"eng.t_base.phonics.letters-basics"}
    cases.append(("prereq 合法單元（不在 KP manifest，不應擋）",
                  lambda u: u.__setitem__("prerequisites", ["eng.t_base.phonics.letters-basics"]),
                  False, None, PK))
    # prereq 指向不存在的單元 → 應擋 prereq:unknown。
    cases.append(("prereq 懸空單元（應擋）",
                  lambda u: u.__setitem__("prerequisites", ["eng.nonexistent.unit"]),
                  True, "prereq:unknown", PK))
    # 無 unit_ids（向後相容）＋懸空 prereq → 不檢查、不應擋。
    cases.append(("prereq 懸空但未提供 unit_ids（向後相容，不應擋）",
                  lambda u: u.__setitem__("prerequisites", ["eng.nonexistent.unit"]),
                  False, None, None))

    ok = True
    for case in cases:
        label, mut, expect_fail, which = case[0], case[1], case[2], case[3]
        uids = case[4] if len(case) > 4 else None
        failed, _notes = check_unit(mk(mut), mids, "selftest", uids)
        did_fail = len(failed) > 0
        good = (did_fail == expect_fail)
        if which and expect_fail:
            good = good and (which in failed)
        ok = ok and good
        print(f"  [{'OK' if good else 'BAD'}] {label}: {failed or 'PASS'} (expect {'FAIL' if expect_fail else 'PASS'})")
    return ok


# ──────────────────── AC-UNIT-3：golden 結構 diff ＋ deviation_reason 有效性 ────────────────────
# §8 簽核者角色 allowlist（closed set，spec §8 表末 line 772-773）＝ {golden-owner} ∪ 13 §8 角色 id。
SIGNER_ALLOWLIST = {
    "golden-owner", "domain", "native-en", "linguist", "learning-sci", "knowledge-viz",
    "eye-comfort", "psych", "art", "spatial", "pm", "sim-learner", "animator", "translator",
}
# golden 結構骨架（communicative archetype）：這些 section 必須存在且非空；teach kind 受控。
GOLDEN_REQUIRED_SECTIONS = ("teach", "practice", "selfeval", "shadowing")
GOLDEN_TEACH_KINDS = {"text", "example"}


def _canon(o):
    return json.dumps(o, sort_keys=True, ensure_ascii=False, separators=(",", ":"))


def _sha16(s):
    import hashlib
    return hashlib.sha256(s.encode("utf-8")).hexdigest()[:16]


def _cat_fact_sha(cat):
    return _sha16(_canon({"category": cat["category"],
                          "required_signer_roles": cat["required_signer_roles"]}))


def _strip_signoff(obj):
    """遞迴移除任何 'signoff' 子物件（unit_content_sha pre-image 唯一排除項）。"""
    if isinstance(obj, dict):
        return {k: _strip_signoff(v) for k, v in obj.items() if k != "signoff"}
    if isinstance(obj, list):
        return [_strip_signoff(x) for x in obj]
    return obj


def _unit_content_sha(unit):
    return _sha16(_canon(_strip_signoff(unit)))


def load_deviation_categories(root):
    """回傳 {category: {valid:bool, required_signer_roles:[...], reason:str}}。"""
    p = os.path.join(root, "authoring", "deviation_categories.json")
    if not os.path.exists(p):
        return None
    d = json.loads(open(p, encoding="utf-8").read())
    out = {}
    for cat in d.get("categories", []):
        name = cat.get("category")
        rs = cat.get("required_signer_roles") or []
        so = cat.get("signoff") or {}
        reason = None
        if not rs:
            reason = "required_signer_roles 空"
        elif any(r not in SIGNER_ALLOWLIST for r in rs):
            reason = "required_signer_roles 含非 allowlist id"
        elif set(so.get("by") or []) < {"art", "spatial"}:
            reason = "缺美術/空間雙簽"
        elif so.get("sha") != _cat_fact_sha(cat):
            reason = "signoff.sha≠現算 cat_fact_sha（項被竄改未重簽）"
        out[name] = {"valid": reason is None, "required_signer_roles": rs, "reason": reason}
    return out


def golden_conformant(unit):
    """結構骨架 diff：回傳偏離原因清單（空＝conformant）。"""
    dev = []
    for sec in GOLDEN_REQUIRED_SECTIONS:
        if not unit.get(sec):
            dev.append(f"缺核心區塊 {sec}")
    for t in unit.get("teach", []) or []:
        if t.get("kind") not in GOLDEN_TEACH_KINDS:
            dev.append(f"teach.kind 非骨架允許值：{t.get('kind')}")
    return dev


def validate_deviation(unit, dev_cats):
    """單元有偏離時驗 deviation_reason 是否有效。回傳 None=有效 / str=失敗原因。"""
    dr = unit.get("deviation_reason")
    if not isinstance(dr, dict):
        return "偏離但無 deviation_reason（或非物件）"
    cat = dr.get("category")
    if cat not in (dev_cats or {}):
        return f"category『{cat}』不在 deviation_categories enum"
    ci = dev_cats[cat]
    if not ci["valid"]:
        return f"category『{cat}』enum 項無效：{ci['reason']}"
    so = dr.get("signoff") or {}
    if so.get("sha") != _unit_content_sha(unit):
        return "signoff.sha≠現算 unit_content_sha（單元/偏離理由改動未重簽）"
    by = set(so.get("by") or [])
    if any(b not in SIGNER_ALLOWLIST for b in by):
        return f"signoff.by 含非 allowlist 身分：{sorted(by - SIGNER_ALLOWLIST)}"
    required = {"golden-owner"} | set(ci["required_signer_roles"])
    if not required <= by:
        return f"signoff.by 缺必填簽核者：{sorted(required - by)}"
    return None


def run_golden_verify(root):
    """AC-UNIT-3：對每個單元跑 golden 結構 diff；偏離須有有效 deviation_reason。回傳違規清單。"""
    dev_cats = load_deviation_categories(root)
    golden_dir = os.path.join(root, "authoring", "golden")
    if dev_cats is None or not os.path.isdir(golden_dir):
        return None, "fail-closed：缺 deviation_categories.json 或 authoring/golden/"
    files = sorted(glob.glob(os.path.join(root, "**", "*.units.json"), recursive=True))
    # 排除 golden 自身（§6.6① golden bootstrap 對 AC-UNIT-3 豁免）
    files = [f for f in files if os.path.join("authoring", "golden") not in f]
    viol, n = [], 0
    for f in files:
        try:
            data = json.loads(open(f, encoding="utf-8").read())
        except Exception as e:  # noqa: BLE001
            viol.append((os.path.basename(f), "<parse>", f"JSON 解析失敗 {e}")); continue
        for u in iter_units(data):
            n += 1
            dev = golden_conformant(u)
            has_dr = isinstance(u.get("deviation_reason"), dict)
            if not dev and not has_dr:
                continue  # conformant、無偏離宣告 → OK
            # 有偏離（結構 diff 偵出）或主動宣告 deviation_reason → 須有效 deviation_reason
            why = validate_deviation(u, dev_cats)
            if why:
                reason = f"{why}" + (f"；結構偏離：{dev}" if dev else "")
                viol.append((os.path.basename(f), u.get("unit_id"), reason))
    return (n, viol), None


def _selftest_golden(root):
    dev_cats = load_deviation_categories(root)
    ok = True
    def t(label, cond):
        nonlocal ok; print(f"  [{'OK' if cond else 'BAD'}] {label}"); ok = ok and cond
    if dev_cats is None:
        print("  [BAD] 缺 deviation_categories.json"); return False
    # enum 檔本身：3 類皆 valid（sha 綁定）
    t("deviation_categories 3 類 cat_fact_sha 皆有效", all(v["valid"] for v in dev_cats.values()))
    base = {"unit_id": "x", "teach": [{"kind": "text"}], "practice": [{"question_id": "q"}],
            "selfeval": ["a"], "shadowing": {"lines": [{"text": "x"}]}}
    import copy
    # conformant 無偏離 → ALLOW
    t("conformant 單元（四區塊齊）→ ALLOW", golden_conformant(base) == [] )
    # 缺區塊、無 deviation_reason → DENY
    missing = copy.deepcopy(base); missing.pop("shadowing")
    t("缺 shadowing 且無 deviation_reason → DENY",
      validate_deviation(missing, dev_cats) is not None and golden_conformant(missing) != [])
    # 缺區塊 + 自由文字 deviation_reason（非 enum）→ DENY
    free = copy.deepcopy(missing); free["deviation_reason"] = {"note": "我覺得不用"}
    t("自由文字 deviation_reason → DENY", validate_deviation(free, dev_cats) is not None)
    # 有效 deviation：合法 category + 正確 unit_content_sha + by 含必填
    cat = "a11y-accommodation"; req = dev_cats[cat]["required_signer_roles"]
    valid = copy.deepcopy(missing)
    valid["deviation_reason"] = {"category": cat, "note": "對比調整",
                                 "signoff": {"by": ["golden-owner"] + req, "sha": "PLACEHOLDER"}}
    valid["deviation_reason"]["signoff"]["sha"] = _unit_content_sha(valid)
    t("合法 enum+sha-bound+by 含必填 → ALLOW", validate_deviation(valid, dev_cats) is None)
    # by=['self'] → DENY
    bad_by = copy.deepcopy(valid); bad_by["deviation_reason"]["signoff"]["by"] = ["self"]
    bad_by["deviation_reason"]["signoff"]["sha"] = _unit_content_sha(bad_by)
    t("by=['self']（缺 golden-owner+必填）→ DENY", validate_deviation(bad_by, dev_cats) is not None)
    # 竄改 note 不重簽 → sha 失配 DENY
    tamper = copy.deepcopy(valid); tamper["deviation_reason"]["note"] = "偷改理由"
    t("改 note 未重簽（sha 失配）→ DENY", validate_deviation(tamper, dev_cats) is not None)
    print("RESULT:", "PASS ✅" if ok else "FAIL ❌")
    return ok


# ────────────────────────── main ──────────────────────────
def main():
    ap = argparse.ArgumentParser(description="§6.6 單元驗收 rubric 確定性子集 lint（fail-closed）")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--selftest-golden", action="store_true", help="AC-UNIT-3 golden-diff 紅隊自測")
    ap.add_argument("--verify-golden", action="store_true", help="AC-UNIT-3 golden 結構 diff＋deviation 驗")
    ap.add_argument("--file")
    ap.add_argument("--root", default=ROOT)
    ap.add_argument("--no-delegate", action="store_true", help="關閉委派子行程（⑥/schema gate）")
    # AC 介面別名：acceptance_criteria.json 的 AC-UNIT-1 以 `unit_acceptance_lint.py --verify` 呼叫；
    # --verify 等同預設「全量 rubric lint」（AC-UNIT-1），行為完全不變、不弱化任何 check，
    # 僅補上被引用卻未實作的旗標（原本因無此旗標而 argparse exit2 → AC-UNIT-1 假性 FAIL）。
    # 註：AC-UNIT-3 的 `--verify-golden` 尚未加入——其正確實作依賴 authoring/golden/（尚未建），
    #     本工具對缺依賴採 SKIP-WITH-WARNING（不假裝通過），故 AC-UNIT-3 維持誠實 pending，不以旗標樁冒充。
    ap.add_argument("--verify", action="store_true",
                    help="AC 介面別名：等同預設全量 rubric lint（AC-UNIT-1；行為不變）")
    args = ap.parse_args()

    if args.selftest:
        print("=== unit_acceptance_lint --selftest ===")
        ok = _selftest()
        print("RESULT:", "PASS ✅" if ok else "FAIL ❌")
        sys.exit(0 if ok else 2)

    if args.selftest_golden:
        print("=== unit_acceptance_lint --selftest-golden（AC-UNIT-3 紅隊）===")
        sys.exit(0 if _selftest_golden(os.path.abspath(args.root)) else 2)

    if args.verify_golden:
        print("=== unit_acceptance_lint --verify-golden（AC-UNIT-3 golden 結構 diff＋deviation 驗）===")
        res, err = run_golden_verify(os.path.abspath(args.root))
        if err:
            print("  " + err); sys.exit(99)
        n, viol = res
        for fn, uid, why in viol[:60]:
            print(f"  ✗ {fn} [{uid}]：{why}")
        print(f"RESULT(AC-UNIT-3): {'PASS ✅' if not viol else 'FAIL ❌'}"
              f"（掃 {n} 單元，未解釋/無效偏離 {len(viol)}）")
        sys.exit(0 if not viol else min(len(viol), 98))

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

    # 預掃全站 unit_id（供 prereq 解析；永遠掃全部檔，即使 --file 只驗一檔，
    # 才能解析跨檔 prereq）。
    all_unit_ids = set()
    for af in sorted(glob.glob(os.path.join(root, "**", "*.units.json"), recursive=True)):
        if os.path.join("authoring", "golden") in af:
            continue
        try:
            adata = json.loads(open(af, encoding="utf-8").read())
        except Exception:  # noqa: BLE001
            continue
        for au in iter_units(adata):
            uid = au.get("unit_id")
            if isinstance(uid, str):
                all_unit_ids.add(uid)

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
            checks, notes = check_unit(u, manifest_ids, os.path.basename(f), all_unit_ids)
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
