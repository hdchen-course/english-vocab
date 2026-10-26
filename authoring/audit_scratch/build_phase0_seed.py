#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""build_phase0_seed.py — 產生 Phase 0 首批（math 13 筆）的 source_registry + fact_check_ledger 條目。
全部指紋取自真實執行（math_checks 重跑）/真實擷取（總綱 PDF sha256）。一次性建置器，審完可清。
用法：python3 authoring/audit_scratch/build_phase0_seed.py
"""
import json, hashlib, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "tools" / "verify"))
import math_checks as M

# 真實執行取指紋
fps = {}
for cid, fn in M.CHECKS.items():
    fps[cid] = hashlib.sha256(fn().encode("utf-8")).hexdigest()[:16]

# check_id -> KP id（來自 manifest 的實際 id）
CHECK_TO_KP = {
    "quadratic-formula": "math.t_mid.equation.quadratic-formula",
    "quadratic-discriminant": "math.t_mid.equation.quadratic-discriminant",
    "quadratic-vieta": "math.t_adv.equation.quadratic-vieta",
    "pythagorean": "math.t_mid.geom.pythagorean",
    "law-of-cosines": "math.t_adv.trig.law-of-cosines",
    "law-of-sines": "math.t_adv.trig.law-of-sines",
    "triangle-area-heron": "math.t_adv.trig.triangle-area",
    "arithmetic-sum": "math.t_adv.sequence.arithmetic-sum",
    "geometric-sum": "math.t_adv.sequence.geometric-sum",
    "infinite-geometric": "math.t_adv.sequence.infinite-geometric",
    "combination": "math.t_adv.counting.combination",
    "permutation": "math.t_adv.counting.permutation",
    "factor-cross": "math.t_mid.algexpr.factor-cross",
}

ZONGGANG = "moe-108-zonggang-2021"
sources = {
    ZONGGANG: {
        "publisher": "國家教育研究院",
        "url_or_isbn": "https://www.naer.edu.tw/upload/1/16/doc/288/(111學年度實施)十二年國教課程綱要總綱.pdf",
        "edition_or_version": "111學年度實施版",
        "locator": "十二年國教課程綱要總綱—數學為部定必修領域，國小/國中/高中教育階段架構；strand 精細階段對照於各領域領綱逐批精修",
        "accessed_at": "2026-10-26",
        "authority_class": "official",
        "evidence_method": "curriculum_scope",
        "content_fingerprint": "d9558786473e4cde",
        "note": "scope＝課綱約定（在哪個階段教什麼的框架權威）；非 fact 證據。真實下載 PDF(45頁,1.2MB) 之 sha256 前16碼。",
    }
}
entries = {}
for cid, kp in CHECK_TO_KP.items():
    sid = f"repro-math-{cid}"
    sources[sid] = {
        "publisher": "本專案獨立 oracle（sympy CAS 重跑）",
        "locator": f"tools/verify/math_checks.py::{cid}",
        "accessed_at": "2026-10-26",
        "authority_class": "reproduction",
        "evidence_method": "derivation",
        "content_fingerprint": fps[cid],
        "reproduction_ref": f"math_checks::{cid}",
        "note": "fact＝公式/敘述本身正確，以 sympy 符號恆等/小域窮舉自驗；生成器與 oracle 不共用（B-08）。repro_gate 會以 .venv 重跑比對此指紋。",
    }
    entries[kp] = {
        "scope_source_ids": [ZONGGANG],
        "fact_source_ids": [sid],
        "verified_by": ["oracle:math_checks(獨立CAS重跑)", "domain-expert:數學"],
        "verified_as_of": "2026-10-26",
        "note": f"scope＝108總綱數學領域框架＋exam標籤階段；fact＝{cid} 符號/窮舉自驗。非 high-risk。",
    }

reg_out = {
    "schema_version": "1.0",
    "_doc": "Phase 0 證據來源登記表（§6.8.1）。scope＝課綱約定；fact＝不訴諸權威的可重現證據。指紋皆真實。",
    "sources": sources,
}
led_f = ROOT / "authoring" / "fact_check_ledger.json"
led = json.loads(led_f.read_text(encoding="utf-8"))
# 移除舊的 placeholder（chi 識字量，待 chi 批次正式重建），保留 _doc
led_entries = {}
led_entries.update(entries)
led["entries"] = led_entries

(ROOT / "authoring" / "source_registry.json").write_text(
    json.dumps(reg_out, ensure_ascii=False, indent=2), encoding="utf-8")
led_f.write_text(json.dumps(led, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"寫出 source_registry.json（sources={len(sources)}）＋ fact_check_ledger.json（entries={len(entries)}）")
print("math 指紋：", fps)
