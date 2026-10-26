#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
_kp_build.py — 合併 authoring/_kp_slices/*.md 的知識點深掘結果，
產出 (1) 機械可讀 manifest authoring/knowledge_points.json（一列一 id）、
     (2) 統計報告（每 domain/tier/exam 計數、重複 id、不符格式 bullet）。
此為 LEARNING_PATH_REBUILD_SPEC.md §4.1 的組裝工具；中繼用，審完可併入正式流程。

每條知識點的標準行格式（各 slice 深掘 agent 產出）：
    - [<id>] <title_zh>  {<tier>, <exam>}
  例： - [math.t_adv.alg.quadratic-formula] 一元二次方程式的公式解  {t_adv, 學測}
id 規範（**opaque**，R2-05/T3-H8）： <domain>.<histslug>.<strand>.<slug>
  第 2 段為「建立時的 tier 命名痕跡（historical tier slug）」，**非權威**；tier 一律只讀 manifest `tier` 欄，
  任何程式**禁止由 id 前綴推斷 tier**（id 段可與 tier 欄不一致，皆合法）。
tier（manifest 欄，權威） ∈ {t_base,t_mid,t_adv,t_sub,t_enrich}
用法： python3 tools/_kp_build.py            # 讀 _kp_slices/ → 寫 knowledge_points.json + 印報告
      python3 tools/_kp_build.py --check    # 只檢查/報告，不寫檔
"""
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SLICE_DIR = ROOT / "authoring" / "_kp_slices"
OUT_JSON = ROOT / "authoring" / "knowledge_points.json"
OUT_MD = ROOT / "authoring" / "KNOWLEDGE_POINT_INVENTORY.md"  # R2-01：附錄＝生成產物，與 JSON 同源

# - [id] title  {tier, exam} [trailing]   (兩個空白前綴容忍、全半形括號容忍)
# B-01 修：捕捉 `}` 之後的 trailing text，不再用 .*$ 靜默吞掉（否則 (待核) 遺失）。
LINE_RE = re.compile(
    r"^\s*-\s*\[(?P<id>[A-Za-z0-9][A-Za-z0-9._-]+)\]\s*"
    r"(?P<title>.+?)\s*[\{｛](?P<meta>[^}｝]*)[\}｝]\s*(?P<trail>.*?)\s*$"
)
# 任何 "- " 起首的 bullet（用來抓「沒有 [id] 的知識點 bullet」= 不符格式）
BULLET_RE = re.compile(r"^\s*-\s+\S")
VALID_TIERS = {"t_base", "t_mid", "t_adv", "t_sub", "t_enrich"}
ID_RE = re.compile(r"^[a-z0-9-]+(\.[a-z0-9_-]+){2,}$")  # domain.<histslug-opaque>.strand[.slug]；第2段非tier權威

# B-04：exam 受控詞彙（禁自由字串）。裸「分科」無科目、「分科-英文」不存在（分科測驗無英文科）皆非法。
VALID_EXAMS = {
    "無", "會考", "學測", "學測-國綜", "學測-國寫",
    "分科-數甲", "分科-數乙", "分科-物理", "分科-化學",
    "分科-生物", "分科-地理", "分科-歷史", "分科-公民", "探究",
}
# B-07：事實正確性 ledger（可機器讀）。有登記來源者 → verification_status=verified。
LEDGER_JSON = ROOT / "authoring" / "fact_check_ledger.json"

# 「待核」標記：半/全形括號內含「待核」，可帶冒號說明。可出現於 title / exam token / trailing。
PENDING_RE = re.compile(r"[(（]\s*待核\s*[:：]?\s*(?P<note>[^)）]*)[)）]")


def extract_pending(text: str):
    """從任意文字抽出 (待核…) 標記：回傳 (清乾淨的文字, note 或 None)。
    note 為「」時仍代表 pending（有標記、無說明）。backtick 包覆一併剝除。"""
    notes = []
    def _grab(m):
        notes.append(m.group("note").strip())
        return ""
    cleaned = PENDING_RE.sub(_grab, text)
    cleaned = cleaned.replace("`", "").strip()
    if not notes:
        return cleaned, None
    note = "；".join(n for n in notes if n)  # 可能為空字串 → pending 但無說明
    return cleaned, note


def parse_meta(meta: str):
    """回傳 (tier, exam, pending_note)。exam token 內若夾 (待核) 一併抽出並剝除。"""
    tier = None
    exams = []
    pending_note = None
    for tok in re.split(r"[，,]", meta):
        tok = tok.strip()
        if not tok:
            continue
        m = re.match(r"^(?:tier|exam)\s*[:：]\s*(.*)$", tok, re.I)
        if m:
            tok = m.group(1).strip()
        tok, note = extract_pending(tok)
        if note is not None:
            pending_note = note or pending_note or ""
        tok = tok.strip()
        if not tok:
            continue
        if tok in VALID_TIERS or re.match(r"^t_[a-z]+$", tok):
            tier = tok
        else:
            exams.append(tok)
    return tier, "／".join(exams), pending_note


def main():
    global SLICE_DIR, OUT_JSON, OUT_MD, LEDGER_JSON
    check_only = "--check" in sys.argv
    # F6 第2項：支援 --root <dir>（release snapshot）；給了就一律從該 root 讀寫，缺路徑即 FAIL（不得忽略後 exit 0）
    if "--root" in sys.argv:
        try:
            base = Path(sys.argv[sys.argv.index("--root") + 1]).resolve()
        except IndexError:
            print("!! --root 未給路徑"); sys.exit(2)
        if not base.is_dir():
            print(f"!! --root 路徑不存在：{base}"); sys.exit(2)
        SLICE_DIR = base / "authoring" / "_kp_slices"
        OUT_JSON = base / "authoring" / "knowledge_points.json"
        OUT_MD = base / "authoring" / "KNOWLEDGE_POINT_INVENTORY.md"
        LEDGER_JSON = base / "authoring" / "fact_check_ledger.json"
    if not SLICE_DIR.is_dir():
        print(f"!! 無 slice 目錄：{SLICE_DIR}")
        sys.exit(2)

    # B-07：讀事實正確性 ledger（若存在）。entries[<kp_id>] = {sources:[], verified_by:[], verified_as_of}
    ledger = {}
    if LEDGER_JSON.exists():
        try:
            ledger = json.loads(LEDGER_JSON.read_text(encoding="utf-8")).get("entries", {})
        except Exception as e:
            print(f"!! fact_check_ledger 解析失敗：{e}")
            sys.exit(2)

    rows = []
    seen_ids = {}
    dup_ids = []
    nonconforming = []  # (file, lineno, text) 的 bullet，有 "- " 但無 [id]{meta}
    bad_exams = []      # (file, lineno, exam, id) exam 非受控值（B-04）
    files = sorted(SLICE_DIR.glob("*.md"))
    if not files:
        print(f"!! {SLICE_DIR} 內無 .md slice")
        sys.exit(2)

    for f in files:
        for i, raw in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            m = LINE_RE.match(raw)
            if m:
                kid = m.group("id").strip()
                # 待核 可能出現在 title / meta(exam) / trailing 任一處，逐處抽出並剝除（B-01 無損）
                title, note_title = extract_pending(m.group("title"))
                tier, exam, note_meta = parse_meta(m.group("meta"))
                trail, note_trail = extract_pending(m.group("trail"))
                notes = [n for n in (note_title, note_meta, note_trail) if n is not None]
                is_pending = len(notes) > 0
                note = "；".join(n for n in notes if n)
                domain = kid.split(".")[0]
                strand = kid.split(".")[2] if len(kid.split(".")) >= 3 else ""
                # B-07：ledger 有登記來源 → verified（凌駕）；否則 (待核)→pending、無標記→unverified（不假裝 verified）。
                led = ledger.get(kid) or {}
                if led:
                    vstatus = "provisionally_verified"  # T3-05：非 release-grade；真 verified 待 Phase 1 gate
                elif is_pending:
                    vstatus = "pending"
                else:
                    vstatus = "unverified"
                row = {
                    "id": kid, "domain": domain, "tier": tier, "strand": strand,
                    "title_zh": title, "exam": exam,
                    "beyond": (tier == "t_enrich"),  # 超綱延伸(R13)；非 beyond＝課綱 minimum，AC-COV-1 嚴格覆蓋
                    "verification_status": vstatus,
                    "verification_note": note,
                    "authority_refs": led.get("sources", []),
                    "verified_as_of": led.get("verified_as_of"),
                    "verified_by": led.get("verified_by", []),
                    "src": f.name, "line": i,
                    "status": "todo", "unit_ids": [],
                }
                if kid in seen_ids:
                    dup_ids.append((kid, seen_ids[kid], f"{f.name}:{i}"))
                else:
                    seen_ids[kid] = f"{f.name}:{i}"
                    rows.append(row)
                if not ID_RE.match(kid) or tier not in VALID_TIERS:
                    nonconforming.append((f.name, i, f"id/tier 不規範: {kid} tier={tier}"))
                # B-04：exam 必須是受控值（禁自由字串/裸「分科」/「分科-英文」）
                for ex in (exam.split("／") if exam else []):
                    if ex and ex not in VALID_EXAMS:
                        bad_exams.append((f.name, i, ex, kid))
                # B-01：`}` 之後若還有無法識別（非待核）的 trailing text，一律 FAIL，禁止靜默丟棄
                if trail.strip():
                    nonconforming.append((f.name, i, f"未解析 trailing text（禁靜默丟棄）: {trail.strip()[:60]}"))
            elif BULLET_RE.match(raw):
                # 只把「疑似缺 id 的知識點」當候選；排除 H-04 三類非-KP bullet：
                #   (a) `- **label**：…`  統計/說明備註
                #   (b) `- t_base（…）：約 N`  tier 計數列
                #   (c) 含 backtick 引用 id 的覆核備註（如 待核清單彙整），或 `- （…）` 括註
                body = raw.strip()[2:].lstrip()
                is_note = (
                    body.startswith("**")
                    or re.match(r"^t_[a-z]+\s*[（(]", body)
                    or body.startswith("（") or body.startswith("(")
                    or "`" in raw            # backtick 引用 id 的 prose（非定義行）
                )
                if re.search(r"[一-鿿]", raw) and "|" not in raw and not is_note:
                    nonconforming.append((f.name, i, body[:80]))

    # B-01 round-trip 守衛：獨立重數 slice 內「帶 [id] 且含待核」的行，須等於 manifest pending 數
    id_line_re = re.compile(r"^\s*-\s*\[[A-Za-z0-9]")
    slice_pending = 0
    for f in files:
        for raw in f.read_text(encoding="utf-8").splitlines():
            if id_line_re.match(raw) and "待核" in raw:
                slice_pending += 1
    manifest_pending = sum(1 for r in rows if r["verification_status"] == "pending")
    roundtrip_ok = (slice_pending == manifest_pending)

    # R2-04/T3-05：ledger 語意驗證。注意：本 parser 只授予 **provisionally_verified**（非 release-grade）；
    # release-grade verified 須待 Phase 1 的 ledger_schema_gate＋source_registry 完整驗證（含 ISO 日、
    # source id 存在性、authority_class、fingerprint、high-risk≥2 獨立 reviewer）後，由 AC gate 認定。
    # 輕量 shape 檢查；release-grade 語意（source 解析/freshness/risk/scope✓fact✓）由 promote_verified.py（F6-03/04）。
    ledger_errors = []
    for kid, led in ledger.items():
        if kid not in seen_ids:
            ledger_errors.append(f"{kid}: ledger key 不在 manifest")
        if not led.get("scope_source_ids"):
            ledger_errors.append(f"{kid}: 缺 scope_source_ids（課綱範圍證據）")
        if not led.get("fact_source_ids"):
            ledger_errors.append(f"{kid}: 缺 fact_source_ids（事實/步驟正確性證據）")
        if not led.get("verified_by"):
            ledger_errors.append(f"{kid}: verified_by 空")
    # R2-03 的最終 ship-gate（binding minimum 必 verified）由 kp_pending_gate/release 檢查；
    # 此處僅統計供 orchestrator 判 Phase 完成度（不在 build 擋，避免開發期寸步難行）。
    binding_unverified = sum(1 for r in rows
                             if not r["beyond"] and r["verification_status"] != "verified")

    # 報告
    by_domain, by_tier, by_exam, by_vstatus = {}, {}, {}, {}
    for r in rows:
        by_domain[r["domain"]] = by_domain.get(r["domain"], 0) + 1
        by_tier[r["tier"]] = by_tier.get(r["tier"], 0) + 1
        by_vstatus[r["verification_status"]] = by_vstatus.get(r["verification_status"], 0) + 1
        for e in (r["exam"].split("／") if r["exam"] else ["無"]):
            by_exam[e] = by_exam.get(e, 0) + 1

    print(f"=== slice 檔：{len(files)} 個 ===")
    for f in files:
        print(f"  {f.name}")
    print(f"\n=== 解析到 id 知識點：{len(rows)} 條（唯一 id {len(seen_ids)}）===")
    print("by domain:", dict(sorted(by_domain.items())))
    print("by tier  :", dict(sorted(by_tier.items(), key=lambda x: str(x[0]))))
    print("by exam  :", dict(sorted(by_exam.items())))
    print("by vstatus:", dict(sorted(by_vstatus.items())))
    print(f"\n=== B-01 round-trip：slice 待核[id]行={slice_pending} vs manifest pending={manifest_pending} → "
          f"{'OK（無損）' if roundtrip_ok else '!! 不符（有遺失）'} ===")
    if dup_ids:
        print(f"\n!! 重複 id：{len(dup_ids)}（需改）")
        for kid, a, b in dup_ids[:20]:
            print(f"   {kid}  （{a} vs {b}）")
    if nonconforming:
        print(f"\n!! 疑似不符 id 格式的 bullet：{len(nonconforming)}（section G 等需正規化成 - [id] …{{tier,exam}}）")
        for fn, ln, tx in nonconforming[:25]:
            print(f"   {fn}:{ln}  {tx}")
    if bad_exams:
        from collections import Counter as _C
        print(f"\n!! B-04 exam 非受控值：{len(bad_exams)}（禁自由字串/裸「分科」/「分科-英文」；須改受控 enum 或 無）")
        for ex, c in sorted(_C(e[2] for e in bad_exams).items()):
            print(f"   「{ex}」×{c}")
        for fn, ln, ex, kid in bad_exams[:10]:
            print(f"   {fn}:{ln}  exam=「{ex}」 id={kid}")

    if ledger_errors:
        print(f"\n!! R2-04 ledger 語意錯誤：{len(ledger_errors)}")
        for e in ledger_errors[:20]:
            print(f"   {e}")
    print(f"\nbinding minimum 未 verified（供 ship-gate/orchestrator 參考）：{binding_unverified}")

    # R2-01：附錄 Markdown＝由同一 rows 生成，與 JSON 同源，杜絕分裂
    def gen_appendix(rows):
        L = ["# 知識點母體（附錄 A）— 由 tools/_kp_build.py 從 _kp_slices/ 生成，請勿手改",
             f"<!-- generated; count={len(rows)}; 單一 canonical source＝_kp_slices/；手改會被覆蓋 -->", ""]
        cur = None
        for r in sorted(rows, key=lambda x: (x["domain"], x["src"], x["line"])):
            if r["domain"] != cur:
                cur = r["domain"]; L.append(f"\n## {cur}\n")
            ex = r["exam"] or "無"
            st = r["verification_status"]
            L.append(f"- [{r['id']}] {r['title_zh']}  {{{r['tier']}, {ex}}}  · {st}")
        return "\n".join(L) + "\n"
    appendix = gen_appendix(rows)

    # meta 一律由當次 rows 重算（T3-02/T3-03：禁信任 cached meta）
    out_obj = {"meta": {"count": len(rows), "by_domain": by_domain,
                        "by_tier": by_tier, "by_exam": by_exam,
                        "by_vstatus": by_vstatus,
                        "pending": manifest_pending,
                        "binding_unverified": binding_unverified,
                        "bad_exams": len(bad_exams)},
               "items": rows}
    out_text = json.dumps(out_obj, ensure_ascii=False, indent=2)

    divergence = False
    if check_only:
        # R2-01/T3-03：附錄與 JSON 皆做**完整字串 deep-equal**（非只比筆數）；缺檔/解析失敗一律 FAIL
        if not OUT_MD.exists() or OUT_MD.read_text(encoding="utf-8") != appendix:
            divergence = True; print("\n!! T3-03 附錄 Markdown 與重新生成不一致（或缺檔）")
        if not OUT_JSON.exists():
            divergence = True; print("\n!! T3-03 committed JSON 不存在")
        else:
            committed_text = OUT_JSON.read_text(encoding="utf-8")
            try:
                json.loads(committed_text)  # 解析失敗＝FAIL（不吞例外）
            except Exception as e:
                divergence = True; print(f"\n!! T3-03 committed JSON 解析失敗：{e}")
            if committed_text != out_text:
                divergence = True
                print("\n!! T3-03 committed JSON 與重新生成**逐欄位**不一致（含 meta；任一欄被竄改即擋）")
    else:
        OUT_JSON.write_text(out_text, encoding="utf-8")
        OUT_MD.write_text(appendix, encoding="utf-8")
        print(f"\n寫出 → {OUT_JSON.relative_to(ROOT)} ＋ {OUT_MD.relative_to(ROOT)}（{len(rows)} 列，同源）")
    rc = 1 if (dup_ids or nonconforming or bad_exams or ledger_errors or divergence or not roundtrip_ok) else 0
    print(f"\nexit={rc}（0=乾淨；非0=重複id/不符格式/exam非受控/ledger錯/JSON或附錄竄改/round-trip遺失）")
    sys.exit(rc)


if __name__ == "__main__":
    main()
