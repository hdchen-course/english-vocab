#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""pedagogy_gate.py — 教學設計層確定性子閘（additive，fail-closed）。

動機（HD 2026-11-06）：spec/知識驗證保證「事實正確」，但舊 *.units.json 帶有
反覆出現的「教學設計債」缺陷類，過去只能靠每檔 content_audit 的 LLM panel 一輪
一輪被動發現（meaningchange 花 4 輪、modalmust 1 輪）。本 gate 把其中三個可確定性
判定的缺陷類在 harvest 前就擋下，讓每檔接近直接 5-clean。取代 STANDING_AUDIT_SOP
提及卻未實際建於 repo 的 mcq_length_cue_gate.py（涵蓋其職責並擴充）。

三檢（逐 root-level *.units.json，可用 --files 限縮）：
  A [parity] 教→練對等：每個 claim_id 必須被至少一題 practice 的 answer_evidence[]
     引用。教了某事實卻零練習題檢索＝retrieval-practice parity gap（學測/會考單元
     尤忌）。此為「title/can_do 宣告卻無練習」的確定性代理（claim 即原子化可測事實）。
  B [length-cue] MCQ 長度 cue：僅對「詞組型」選項（該題最長選項 ≥ LEN_PHRASE 字）檢。
     若正解字數 > LEN_RATIO × 次長選項字數（明顯離群），或正解獨有括號補述
     「（…）」/"(...)" 而所有誘答皆無 → 測驗取巧 cue（洗牌無法遮蔽字數線索）。
  C [shadow-note] shadowing note 與 per-line intonation 矛盾：note 若含「全稱詞
     （都|皆|兩句|每句|全部|所有）＋單一聲調方向（下收 或 上揚，且不含另一方向）」，
     卻有任一行 intonation 出現相反方向 → 自相矛盾的語調指示。

介面：--verify（exit=violations clamped 1..255，0=clean）；--selftest（exit 0/2）；
      --files a.units.json b.units.json（限縮；預設全 root）；--root；--json。
      無旗標 → usage exit 2；parse 失敗 fail-closed（計為 violation）。
不改任何既有資料/其他 gate。
"""
import argparse
import glob
import json
import os
import re
import sys
import tempfile

LEN_PHRASE = 8      # 選項 ≥ 此字數才視為「詞組型」，短單字選項（must/may/cat）不檢 B
LEN_RATIO = 1.5     # 正解 > 此倍率 × 次長選項 → 長度離群
_PAREN = re.compile(r"[（(][^）)]{2,}[）)]")   # 括號補述（內含 ≥2 字）
_UNIV = re.compile(r"(都|皆|兩句|每句|全部|所有)")
_FALL = "下收"
_RISE = "上揚"


def _nonempty_str(v):
    return isinstance(v, str) and v.strip() != ""


def _disp_len(s):
    """選項顯示字數：去頭尾空白後的字元數。"""
    return len(s.strip()) if isinstance(s, str) else 0


def _check_parity(loc, unit, advisory):
    """ADVISORY 專用：每 claim 是否被 practice answer_evidence 引用。
    注意：支援性/刻意 teach-only claim（如禮貌回應、附帶 vocab、延伸說明）未被引用是
    常見且合理的設計選擇，content_audit expert panel 會依 scope 判 NOT A DEFECT，故此檢
    僅輸出 advisory 候選、不計入 fail-closed exit code（避免誤擋）。真正的 parity gap
    （title/can_do 並列的頭條項目卻零覆蓋，如 meaningchange 的 forget/try）仍由 panel 確認。"""
    claims = unit.get("claims") or []
    claim_ids = [c.get("claim_id") for c in claims
                 if isinstance(c, dict) and _nonempty_str(c.get("claim_id"))]
    cited = set()
    for p in (unit.get("practice") or []):
        if not isinstance(p, dict):
            continue
        for ev in (p.get("answer_evidence") or []):
            if isinstance(ev, str):
                cited.add(ev)
    for cid in claim_ids:
        if cid not in cited:
            advisory.append(
                f"[parity-advisory] {loc}: claim '{cid}' 未被任何 practice answer_evidence 引用"
                f"（候選：若為 title/can_do 並列頭條項目＝真 gap；若為支援性/teach-only＝panel 多半放行）")


def _check_length_cue(loc, unit, violations):
    for p in (unit.get("practice") or []):
        if not isinstance(p, dict) or p.get("type") != "mcq":
            continue
        opts = p.get("options")
        ans = p.get("answer")
        if not isinstance(opts, list) or not _nonempty_str(ans) or ans not in opts:
            continue
        # 僅檢「中文散文語意選項」：任一選項含 ASCII 字母（英文詞/片語，長度由文法決定，
        # 如 must/must not/to lock）即跳過，避免把文法性長度差誤判為 cue。
        if any(isinstance(o, str) and re.search(r"[A-Za-z]", o) for o in opts):
            continue
        lens = {o: _disp_len(o) for o in opts if isinstance(o, str)}
        if not lens or max(lens.values()) < LEN_PHRASE:
            continue  # 短選項不檢
        qid = p.get("question_id", "?")
        a_len = _disp_len(ans)
        distractor_lens = [lens[o] for o in opts if o != ans and isinstance(o, str)]
        if distractor_lens:
            second = max(distractor_lens)
            if a_len > LEN_RATIO * second:
                violations.append(
                    f"[length-cue] {loc} 題 {qid}: 正解字數 {a_len} > {LEN_RATIO}× 次長選項 {second}"
                    f"（正解明顯最長＝長度 cue）")
        ans_paren = bool(_PAREN.search(ans))
        if ans_paren and not any(_PAREN.search(o) for o in opts if o != ans and isinstance(o, str)):
            violations.append(
                f"[length-cue] {loc} 題 {qid}: 僅正解帶括號補述、誘答皆無（詳細度 cue）")


def _check_shadow_note(loc, unit, violations):
    sh = unit.get("shadowing")
    if not isinstance(sh, dict):
        return
    note = sh.get("note") or ""
    if not isinstance(note, str) or not note:
        return
    note_fall = _FALL in note
    note_rise = _RISE in note
    has_univ = bool(_UNIV.search(note))
    # note 作出「全稱 + 單一方向」宣稱（只有一種方向）
    universal_dir = None
    if has_univ and note_fall and not note_rise:
        universal_dir = _FALL
    elif has_univ and note_rise and not note_fall:
        universal_dir = _RISE
    if universal_dir is None:
        return
    opposite = _RISE if universal_dir == _FALL else _FALL
    for ln in (sh.get("lines") or []):
        if isinstance(ln, dict) and opposite in str(ln.get("intonation", "")):
            violations.append(
                f"[shadow-note] {loc}: note 全稱宣稱句尾『{universal_dir}』，但某行 intonation "
                f"出現相反的『{opposite}』（{ln.get('text','?')}）＝語調指示自相矛盾")
            return


def run(root, files=None):
    """回傳 (hard_violations, advisory, stats)。
    hard_violations＝fail-closed（length-cue + shadow-note + 結構/parse）；計入 exit code。
    advisory＝parity 候選；不計入 exit code。"""
    violations = []
    advisory = []
    root = os.path.abspath(root)
    if files:
        unit_files = [os.path.join(root, f) for f in files]
    else:
        unit_files = sorted(glob.glob(os.path.join(root, "*.units.json")))
    if not unit_files:
        violations.append(f"[discovery] 在 {root} 找不到 *.units.json（空 glob＝fail-closed）")
    n_units = 0
    for f in unit_files:
        base = os.path.basename(f)
        try:
            with open(f, encoding="utf-8") as fh:
                data = json.load(fh)
        except (OSError, json.JSONDecodeError) as e:
            violations.append(f"[parse] {base}: 無法解析 JSON（{e}）＝fail-closed")
            continue
        units = data.get("units")
        if not isinstance(units, list):
            violations.append(f"[structure] {base}: 頂層缺 'units' 陣列")
            continue
        for i, u in enumerate(units):
            if not isinstance(u, dict):
                violations.append(f"[structure] {base}[units#{i}]: 單元非物件")
                continue
            n_units += 1
            uid = u.get("unit_id")
            loc = f"{base}[{uid if isinstance(uid, str) else '#'+str(i)}]"
            _check_parity(loc, u, advisory)
            _check_length_cue(loc, u, violations)
            _check_shadow_note(loc, u, violations)
    stats = {"root": root, "unit_files": len(unit_files), "units": n_units,
             "violations": len(violations), "advisory": len(advisory)}
    return violations, advisory, stats


# ---------------- selftest ----------------
def _mk(tmp, unit):
    with open(os.path.join(tmp, "a.units.json"), "w", encoding="utf-8") as fh:
        json.dump({"units": [unit]}, fh, ensure_ascii=False)


def _good_unit():
    return {
        "unit_id": "eng.t_mid.x.y",
        "claims": [{"claim_id": "c-a"}, {"claim_id": "c-b"}],
        "practice": [
            {"question_id": "P1", "type": "mcq", "answer": "cat",
             "options": ["cat", "dog", "fish", "bird"], "answer_evidence": ["c-a"]},
            {"question_id": "P2", "type": "mcq", "answer": "我停下手邊的事跟朋友說話",
             "options": ["我停下手邊的事跟朋友說話", "我停止跟朋友說話這件事",
                         "我努力嘗試跟朋友說話", "我忘記了要跟朋友說話"],
             "answer_evidence": ["c-b"]},
        ],
        "shadowing": {"note": "第一句陳述下收；第二句以 Danger! 警示上揚。",
                      "lines": [{"text": "A.", "intonation": "下收"},
                                {"text": "Danger!", "intonation": "警示上揚"}]},
    }


def _selftest():
    results = []
    with tempfile.TemporaryDirectory() as g:
        _mk(g, _good_unit())
        v, adv, _ = run(g)
        results.append(("好例 → 0 hard violation", len(v) == 0, v))

    def mut_parity(u):      # c-b 無題引用 → 應進 advisory（非 hard）
        u["practice"][1]["answer_evidence"] = ["c-a"]

    def mut_lencue_ratio(u):  # 正解明顯最長
        u["practice"][1]["answer"] = "我停下原本正在手邊進行的事情特地走過去跟朋友說話聊天"
        u["practice"][1]["options"] = ["我停下原本正在手邊進行的事情特地走過去跟朋友說話聊天",
                                       "我不再說話", "我試著說話", "我忘了說話"]

    def mut_lencue_paren(u):  # 僅正解帶括號補述
        u["practice"][1]["answer"] = "我停下（原本在做的事）跟朋友說話"
        u["practice"][1]["options"] = ["我停下（原本在做的事）跟朋友說話", "我停止跟朋友說話這件事",
                                       "我努力嘗試跟朋友說話", "我忘記了要跟朋友說話"]

    def mut_shadow(u):      # note 全稱下收，但某行上揚
        u["shadowing"]["note"] = "兩句都是陳述句，句尾自然下收。"
        u["shadowing"]["lines"][1]["intonation"] = "前句警示上揚"

    # parity → advisory（不計 hard）；length-cue/shadow-note → hard
    hard_cases = {"length-cue: 正解離群長": mut_lencue_ratio,
                  "length-cue: 僅正解帶括號": mut_lencue_paren,
                  "shadow-note: 全稱下收 vs 行上揚": mut_shadow}
    for name, mut in hard_cases.items():
        with tempfile.TemporaryDirectory() as b:
            u = _good_unit()
            mut(u)
            _mk(b, u)
            v, adv, _ = run(b)
            results.append((f"壞例：{name} → ≥1 hard violation", len(v) >= 1, v))

    with tempfile.TemporaryDirectory() as b:
        u = _good_unit()
        mut_parity(u)
        _mk(b, u)
        v, adv, _ = run(b)
        results.append(("parity: claim 無題引用 → advisory（非 hard）",
                        len(v) == 0 and len(adv) >= 1, (v, adv)))

    # 短單字選項不應觸發 length-cue（避免 must/may 誤擋）
    with tempfile.TemporaryDirectory() as s:
        u = _good_unit()
        u["practice"][1]["answer"] = "must not"
        u["practice"][1]["options"] = ["must not", "must", "may", "can"]
        _mk(s, u)
        v, adv, _ = run(s)
        results.append(("短單字選項 → 不觸發 length-cue",
                        not any("length-cue" in x and "P2" in x for x in v), v))

    ok = True
    for desc, passed, v in results:
        print(f"  [{'OK' if passed else 'BAD'}] {desc}")
        if not passed:
            ok = False
            print(f"       (violations={v})")
    return ok


def _clamp(n):
    return 0 if n == 0 else max(1, min(255, n))


def main(argv=None):
    ap = argparse.ArgumentParser(description="教學設計層確定性子閘（parity/length-cue/shadow-note，fail-closed）")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--root", default=".")
    ap.add_argument("--files", nargs="*", default=None, help="限縮檢查的 *.units.json 檔名（預設全 root）")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)

    if args.selftest:
        print("=== pedagogy_gate --selftest ===")
        ok = _selftest()
        print("RESULT:", "PASS ✅" if ok else "FAIL ❌")
        return 0 if ok else 2

    if args.verify:
        violations, advisory, stats = run(args.root, args.files)
        if args.json:
            print(json.dumps({"stats": stats, "violations": violations, "advisory": advisory},
                             ensure_ascii=False, indent=2))
        else:
            print(f"[pedagogy_gate] root={stats['root']} files={stats['unit_files']} "
                  f"units={stats['units']} advisory={len(advisory)}", file=sys.stderr)
            if advisory:
                print(f"[pedagogy_gate] {len(advisory)} ADVISORY（parity 候選，不計 exit；交 panel 判定）:",
                      file=sys.stderr)
                for a in advisory:
                    print("  · " + a, file=sys.stderr)
            if violations:
                print(f"[pedagogy_gate] {len(violations)} HARD violation(s):", file=sys.stderr)
                for v in violations:
                    print("  - " + v, file=sys.stderr)
            else:
                print("[pedagogy_gate] CLEAN（0 hard violation）", file=sys.stderr)
        return _clamp(len(violations))

    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    sys.exit(main())
