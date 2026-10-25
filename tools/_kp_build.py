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
id 規範： <domain>.<tier>.<strand>.<slug>
tier ∈ {t_base,t_mid,t_adv,t_sub}
用法： python3 tools/_kp_build.py            # 讀 _kp_slices/ → 寫 knowledge_points.json + 印報告
      python3 tools/_kp_build.py --check    # 只檢查/報告，不寫檔
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SLICE_DIR = ROOT / "authoring" / "_kp_slices"
OUT_JSON = ROOT / "authoring" / "knowledge_points.json"

# - [id] title  {tier, exam}   (兩個空白前綴容忍、全半形括號容忍)
LINE_RE = re.compile(
    r"^\s*-\s*\[(?P<id>[A-Za-z0-9][A-Za-z0-9._-]+)\]\s*"
    r"(?P<title>.+?)\s*[\{｛](?P<meta>[^}｝]*)[\}｝].*$"
)
# 任何 "- " 起首的 bullet（用來抓「沒有 [id] 的知識點 bullet」= 不符格式）
BULLET_RE = re.compile(r"^\s*-\s+\S")
VALID_TIERS = {"t_base", "t_mid", "t_adv", "t_sub", "t_enrich"}
ID_RE = re.compile(r"^[a-z0-9-]+(\.[a-z0-9_-]+){2,}$")  # domain.tier.strand[.slug]


def parse_meta(meta: str):
    tier = None
    exams = []
    for tok in re.split(r"[，,]", meta):
        tok = tok.strip()
        if not tok:
            continue
        m = re.match(r"^(?:tier|exam)\s*[:：]\s*(.*)$", tok, re.I)
        if m:
            tok = m.group(1).strip()
        if tok in VALID_TIERS or re.match(r"^t_[a-z]+$", tok):
            tier = tok
        else:
            exams.append(tok)
    return tier, "／".join(exams)


def main():
    check_only = "--check" in sys.argv
    if not SLICE_DIR.is_dir():
        print(f"!! 無 slice 目錄：{SLICE_DIR}")
        sys.exit(2)

    rows = []
    seen_ids = {}
    dup_ids = []
    nonconforming = []  # (file, lineno, text) 的 bullet，有 "- " 但無 [id]{meta}
    files = sorted(SLICE_DIR.glob("*.md"))
    if not files:
        print(f"!! {SLICE_DIR} 內無 .md slice")
        sys.exit(2)

    for f in files:
        for i, raw in enumerate(f.read_text(encoding="utf-8").splitlines(), 1):
            m = LINE_RE.match(raw)
            if m:
                kid = m.group("id").strip()
                title = m.group("title").strip()
                tier, exam = parse_meta(m.group("meta"))
                domain = kid.split(".")[0]
                strand = kid.split(".")[2] if len(kid.split(".")) >= 3 else ""
                row = {
                    "id": kid, "domain": domain, "tier": tier, "strand": strand,
                    "title_zh": title, "exam": exam, "src": f.name, "line": i,
                    "status": "todo", "unit_ids": [],
                }
                if kid in seen_ids:
                    dup_ids.append((kid, seen_ids[kid], f"{f.name}:{i}"))
                else:
                    seen_ids[kid] = f"{f.name}:{i}"
                    rows.append(row)
                if not ID_RE.match(kid) or tier not in VALID_TIERS:
                    nonconforming.append((f.name, i, f"id/tier 不規範: {kid} tier={tier}"))
            elif BULLET_RE.match(raw):
                # 只把看起來像知識點的 bullet 當候選（排除表格/說明）；粗略：含中日韓字
                if re.search(r"[一-鿿]", raw) and "|" not in raw:
                    nonconforming.append((f.name, i, raw.strip()[:80]))

    # 報告
    by_domain, by_tier, by_exam = {}, {}, {}
    for r in rows:
        by_domain[r["domain"]] = by_domain.get(r["domain"], 0) + 1
        by_tier[r["tier"]] = by_tier.get(r["tier"], 0) + 1
        for e in (r["exam"].split("／") if r["exam"] else ["無"]):
            by_exam[e] = by_exam.get(e, 0) + 1

    print(f"=== slice 檔：{len(files)} 個 ===")
    for f in files:
        print(f"  {f.name}")
    print(f"\n=== 解析到 id 知識點：{len(rows)} 條（唯一 id {len(seen_ids)}）===")
    print("by domain:", dict(sorted(by_domain.items())))
    print("by tier  :", dict(sorted(by_tier.items(), key=lambda x: str(x[0]))))
    print("by exam  :", dict(sorted(by_exam.items())))
    if dup_ids:
        print(f"\n!! 重複 id：{len(dup_ids)}（需改）")
        for kid, a, b in dup_ids[:20]:
            print(f"   {kid}  （{a} vs {b}）")
    if nonconforming:
        print(f"\n!! 疑似不符 id 格式的 bullet：{len(nonconforming)}（section G 等需正規化成 - [id] …{{tier,exam}}）")
        for fn, ln, tx in nonconforming[:25]:
            print(f"   {fn}:{ln}  {tx}")

    if not check_only:
        OUT_JSON.write_text(
            json.dumps({"meta": {"count": len(rows), "by_domain": by_domain,
                                 "by_tier": by_tier, "by_exam": by_exam},
                        "items": rows}, ensure_ascii=False, indent=2),
            encoding="utf-8")
        print(f"\n寫出 → {OUT_JSON.relative_to(ROOT)}（{len(rows)} 列）")
    rc = 1 if (dup_ids or nonconforming) else 0
    print(f"\nexit={rc}（0=乾淨；非0=有重複id或不符格式待修）")
    sys.exit(rc)


if __name__ == "__main__":
    main()
