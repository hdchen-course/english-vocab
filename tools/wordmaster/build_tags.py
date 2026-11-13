#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_tags.py — 單字大師（分級字庫）分級標籤 membership 層（FLASHCARD_BUILD_SPEC §2）。

輸入（皆為版控 committed 來源，見 sources/MANIFEST）：
  - COCA 字卡：Anki/data/cards.jsonl（headword, pos, sense_key, band…）
  - CEFR：sources/cefrj-vocabulary-profile-1.5.csv（A1–B2）+ sources/octanove-vocabulary-profile-c1c2-1.0.csv（C1–C2）
  - GEPT：sources/gept_GEPT_High-Intermediate.pdf（LTTC 官方，含初級/中級/中高級全量，逐字帶級）
  - YLE：sources/yle_{starters,movers,flyers}_hd_paste.txt（劍橋官方 Picture Book A–Z Word List）
  - TOEIC：sources/tsl_TSL_12_lemmatized_for_teaching.csv（TOEIC Service List, Browne & Culligan；代用，明標）
  - 拼寫：sources/american_to_british.json（US→UK；CEFR-J/YLE 多為英式拼寫）

比對（可重現、禁造假）：headword lemma（WordNet，pos-aware）＋US↔UK 正規化後對各官方清單做成員比對。
  CEFR＝單一級（pos 命中優先，否則取最基礎級）；GEPT/YLE 另記級別；TOEIC 為 boolean。無對應＝誠實 null/false。

輸出：
  - assets/wordmaster/tags.json         （keyed by sense_key）
  - assets/wordmaster/tags_report.json  （覆蓋率、match provenance、repro 指紋 fingerprint_sha256）
用法：/Volumes/workplace/EnglishTraining/.venv/bin/python -I tools/wordmaster/build_tags.py
repro_gate：重跑本腳本，tags.json 的 fingerprint_sha256 必須一致。
"""
import csv, io, json, hashlib, re, os, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # english-vocab-deploy/
SRC  = os.path.join(ROOT, "assets", "wordmaster", "sources")
CARDS = os.path.abspath(os.path.join(ROOT, "..", "Anki", "data", "cards.jsonl"))
OUT_TAGS = os.path.join(ROOT, "assets", "wordmaster", "tags.json")
OUT_REP  = os.path.join(ROOT, "assets", "wordmaster", "tags_report.json")

CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"]
GEPT_ORDER = ["初級", "中級", "中高級"]
YLE_ORDER  = ["starters", "movers", "flyers"]
POS_CODES = {"adj","adv","conj","det","dis","excl","int","n","poss","prep","pron","v","title","num"}

def na(w):
    """alpha-only 正規化（單字比對鍵）。"""
    return re.sub(r"[^a-z]", "", (w or "").lower())

def sha256_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(65536), b""):
            h.update(b)
    return h.hexdigest()

# ---------- WordNet lemmatizer (pos-aware) ----------
from nltk.stem import WordNetLemmatizer
_LEM = WordNetLemmatizer()
def wn_pos(pos):
    p = (pos or "").lower()
    if p.startswith("n"): return "n"
    if p.startswith("v") or "modal" in p: return "v"
    if p.startswith("adj") or p == "a": return "a"
    if p.startswith("adv"): return "r"
    return None
def lemmas(word, pos):
    forms = set()
    w = word.lower().strip()
    for p in ([wn_pos(pos)] if wn_pos(pos) else []) + ["n", "v", "a", "r"]:
        try:
            forms.add(_LEM.lemmatize(w, p))
        except Exception:
            pass
    return {f for f in forms if f}

# ---------- US<->UK ----------
def load_us_uk():
    us2uk = {}
    p = os.path.join(SRC, "american_to_british.json")
    d = json.load(open(p, encoding="utf-8"))
    for k, v in d.items():
        if isinstance(v, str):
            us2uk[na(k)] = na(v)
    # repo 的小對照表（補充）
    rp = os.path.join(ROOT, "src", "dict_us_uk.json")
    if os.path.exists(rp):
        for k, v in json.load(open(rp, encoding="utf-8")).items():
            if isinstance(v, str) and not k.startswith("_"):
                us2uk.setdefault(na(k), na(v))
    uk2us = {}
    for u, b in us2uk.items():
        uk2us.setdefault(b, u)
    return us2uk, uk2us
US2UK, UK2US = load_us_uk()

def spelling_variants(keys):
    out = set(keys)
    for k in list(keys):
        if k in US2UK: out.add(US2UK[k])
        if k in UK2US: out.add(UK2US[k])
    return out

def candidate_keys(headword, pos):
    """deck headword → 比對候選鍵集合（直接 / lemma / US↔UK）。"""
    base = {na(headword)}
    base |= {na(x) for x in lemmas(headword, pos)}
    base = {b for b in base if b}
    return spelling_variants(base)

# ---------- CEFR ----------
def load_cefr():
    by_pos = {}   # key -> {coarse_pos -> set(levels)}
    any_lv = {}   # key -> set(levels)
    def coarse(p):
        p = (p or "").lower()
        if "noun" in p: return "n"
        if "verb" in p: return "v"
        if "adject" in p: return "a"
        if "adverb" in p: return "r"
        return p.strip() or "x"
    for fn in ["cefrj-vocabulary-profile-1.5.csv", "octanove-vocabulary-profile-c1c2-1.0.csv"]:
        for r in csv.DictReader(open(os.path.join(SRC, fn), encoding="utf-8-sig")):
            k = na(r["headword"]); lv = (r.get("CEFR") or "").strip()
            if not k or lv not in CEFR_ORDER:
                continue
            cp = coarse(r.get("pos"))
            by_pos.setdefault(k, {}).setdefault(cp, set()).add(lv)
            any_lv.setdefault(k, set()).add(lv)
    return by_pos, any_lv

# ---------- Oxford 3000/5000 (CEFR fallback：補 CEFR-J 基本字缺口；A1–C1) ----------
def load_oxford():
    any_lv = {}  # key -> set(levels)
    for fn in ["oxford_20260715160822-oxford-3000.en.tsv",
               "oxford_20260715165539-oxford-5000-expanded.en.tsv"]:
        p = os.path.join(SRC, fn)
        if not os.path.exists(p): continue
        for r in csv.DictReader(open(p, encoding="utf-8"), delimiter="\t"):
            # Word 欄可能是 "a, an"；Level 欄可能是 "A1, B1"
            for w in re.split(r"[,/]", r.get("Word","")):
                k = na(w)
                if not k: continue
                for lv in re.findall(r"[ABC][12]", r.get("Level","")):
                    any_lv.setdefault(k, set()).add(lv)
    return any_lv

# ---------- Supplementary CEFR（kamome cefr-highlight index；僅補 authoritative 全缺的進階字）----------
# 來源：github.com/kamome1037/cefr-highlight server/data/cefr_index.json（社群彙編，72k 詞）。
# ★正確性守則：此源低端(A1/A2/B1)標註對「本就不在 CEFR-J/Oxford(A1–C1)/octanove 的罕用字」明顯不可靠
#   （實測 copulate→A1、annul→A2、burnish→A2），且與權威清單的沉默矛盾。故 **只接受 B2/C1/C2**，
#   低端一律丟棄（該字誠實留 unclassified）。僅用於 authoritative 全部落空的字，絕不覆蓋 authoritative。
def load_supplementary():
    any_lv = {}  # na-key -> set(levels)
    p = os.path.join(SRC, "kamome_cefr_index.json")
    if not os.path.exists(p):
        return any_lv
    d = json.load(open(p, encoding="utf-8"))
    for term, entries in d.items():
        k = na(term)
        if not k:
            continue
        for e in (entries or []):
            lv = (e.get("level") or "").strip().upper()
            if lv in CEFR_ORDER:
                any_lv.setdefault(k, set()).add(lv)
    return any_lv

# ---------- GEPT (High-Intermediate PDF: all 3 levels, per-word) ----------
def load_gept():
    import pdfplumber
    m = {}  # key -> level(初級/中級/中高級)  取最基礎
    p = os.path.join(SRC, "gept_GEPT_High-Intermediate.pdf")
    pdf = pdfplumber.open(p)
    for pg in pdf.pages:
        for ln in (pg.extract_text() or "").splitlines():
            lv = None
            for cand in ["中高級", "中級", "初級"]:
                if cand in ln: lv = cand; break
            if not lv: continue
            mobj = re.match(r"^([A-Za-z][A-Za-z.\-'/]*)", ln)
            if not mobj: continue
            k = na(mobj.group(1))
            if not k: continue
            if k not in m or GEPT_ORDER.index(lv) < GEPT_ORDER.index(m[k]):
                m[k] = lv
    pdf.close()
    return m

# ---------- YLE (3 paste txt) ----------
def parse_yle_line(line):
    """一列 → (surface_forms set). 去 POS 尾碼、處理 (US x)/(UK x)、slash、去雜括號。"""
    s = line.strip()
    if not s: return set()
    # 抽 (US x)/(UK x) 拼寫變體
    forms = set()
    for mm in re.finditer(r"\((?:US|UK)\s+([A-Za-z][A-Za-z ]*?)\)", s):
        forms.add(mm.group(1))
    # 去掉所有括號內容（含 (music)/(e.g...)/(as in...)/(US x)…）
    core = re.sub(r"\([^)]*\)", " ", s)
    # 去尾端 POS 串（含 +, of place/time, s + pl…）
    toks = core.replace("!", " ").split()
    head = []
    for t in toks:
        tl = t.strip(".").lower()
        if tl in POS_CODES or t == "+" or tl in {"of","place","time","s","pl"}:
            break
        head.append(t)
    phrase = " ".join(head).strip()
    if not phrase:
        return forms
    # slash 變體：child/children, foot/feet, television/TV, businessman/woman
    if "/" in phrase:
        for part in phrase.split("/"):
            forms.add(part.strip())
    else:
        forms.add(phrase)
    return {f for f in forms if f and re.search(r"[A-Za-z]", f)}

def load_yle():
    m = {}  # key -> level
    files = {"starters":"yle_starters_hd_paste.txt","movers":"yle_movers_hd_paste.txt","flyers":"yle_flyers_hd_paste.txt"}
    for lv, fn in files.items():
        for ln in open(os.path.join(SRC, fn), encoding="utf-8"):
            # 跳過標題/文法鍵行
            if ln.startswith(("Starters","Movers","Flyers","Grammatical","Word List")):
                continue
            for form in parse_yle_line(ln):
                for key in spelling_variants({na(form)}) | {na(form)}:
                    if not key: continue
                    if key not in m or YLE_ORDER.index(lv) < YLE_ORDER.index(m[key]):
                        m[key] = lv
    return m

# ---------- TSL (TOEIC) ----------
def load_tsl():
    # 權威 TSL 1.2（官方編號清單；1250 headword、98.5% TOEIC 覆蓋）。行格式 "N.  word"。
    keys = set()
    p = os.path.join(SRC, "tsl_TSL_12_alphabetized_description.txt")
    for ln in open(p, encoding="utf-8-sig"):
        m = re.match(r"^\s*\d+\.\s+(.+?)\s*$", ln)
        if not m: continue
        k = na(m.group(1))
        if k: keys.add(k)
    return keys

def load_awl():
    # Academic Word List（Coxhead 2000；570 word families, Sublists 1-10）。
    # HD 2026-11-13：併入 TOEIC 標籤。行格式＝每行一個 headword，# 開頭為註解。
    keys = set()
    p = os.path.join(SRC, "awl_headwords.txt")
    if not os.path.exists(p):
        return keys
    for ln in open(p, encoding="utf-8-sig"):
        ln = ln.strip()
        if not ln or ln.startswith("#"):
            continue
        k = na(ln)
        if k:
            keys.add(k)
    return keys

def load_bsl():
    # Business Service List v1.20（Browne & Culligan；1744 商業英語詞族，含變化形）。
    # HD 2026-11-13：併入 TOEIC 標籤（商業英語與 TOEIC 高度相關）。行格式＝headword,form,form,...
    keys = set()
    p = os.path.join(SRC, "bsl_1.20_lemmatized.txt")
    if not os.path.exists(p):
        return keys
    for ln in open(p, encoding="utf-8-sig"):
        ln = ln.strip()
        if not ln or ln.startswith("#"):
            continue
        for tok in ln.split(","):
            k = na(tok)
            if k:
                keys.add(k)
    return keys

# ---------- CEFR 估級（authoritative 全缺時的透明估計；絕不覆蓋 authoritative cefr）----------
# HD 2026-11-13：「1007 個單字在 CEFR 沒有分類，你有辦法自己大概分一分嗎？」
# 原則：只對 cefr 為 None 的卡補 cefr_est，並記 cefr_est_src，UI 以「約 Bx」與官方分級視覺區分；
# 不動 authoritative cefr（null 保持 null＝維持「誠實留空」）。優先序：官方對照 > 頻率對照。
GEPT2CEFR = {"初級": "A2", "中級": "B1", "中高級": "B2"}      # LTTC 官方 GEPT-CEFR 對照
YLE2CEFR  = {"starters": "A1", "movers": "A1", "flyers": "A2"}  # Cambridge（Pre-A1/A1/A2→就近取 A1/A1/A2）
BAND2CEFR = {"1k": "A1", "2k": "A2", "3k": "B1", "4k": "B2", "5k": "B2",
             "6k": "C1", "7k": "C1", "8k": "C1", "9k": "C2", "10k": "C2", "tail": "C2"}  # COCA 頻率帶→CEFR（粗估）

def estimate_cefr(gept_lv, yle_lv, band):
    if gept_lv and gept_lv in GEPT2CEFR:
        return GEPT2CEFR[gept_lv], "gept"
    if yle_lv and yle_lv in YLE2CEFR:
        return YLE2CEFR[yle_lv], "yle"
    b = (band or "").strip().lower()
    if b in BAND2CEFR:
        return BAND2CEFR[b], "coca"
    return None, None

def main():
    cards = [json.loads(l) for l in open(CARDS, encoding="utf-8")]
    cefr_by_pos, cefr_any = load_cefr()
    oxford = load_oxford()
    suppl = load_supplementary()
    gept = load_gept()
    yle = load_yle()
    tsl = load_tsl()
    awl = load_awl()
    bsl = load_bsl()

    def coarse_card_pos(p):
        p = (p or "").lower()
        if p.startswith("n"): return "n"
        if p.startswith("v") or "modal" in p: return "v"
        if p.startswith("adj") or p == "a": return "a"
        if p.startswith("adv"): return "r"
        return "x"

    tags = {}
    stats = {"total": len(cards), "cefr": 0, "cefr_pos_matched": 0, "cefr_src": {}, "gept": 0, "yle": 0, "toeic": 0,
             "cefr_levels": {}, "gept_levels": {}, "yle_levels": {}, "none_of_four": 0,
             "toeic_tsl": 0, "toeic_awl": 0, "toeic_awl_only": 0, "toeic_bsl": 0, "toeic_bsl_only": 0,
             "cefr_est": 0, "cefr_est_src": {}, "cefr_est_levels": {}, "cefr_still_unclassified": 0}
    misses = []
    for c in cards:
        hw, pos, sk = c["headword"], c.get("pos",""), c["sense_key"]
        keys = candidate_keys(hw, pos)
        # CEFR（主：CEFR-J+Octanove；fallback：Oxford 3000/5000）
        cefr = None; cefr_posmatch = False; cefr_src = None
        hit_keys = [k for k in keys if k in cefr_any]
        if hit_keys:
            cp = coarse_card_pos(pos)
            pos_levels = set()
            for k in hit_keys:
                if cp in cefr_by_pos.get(k, {}):
                    pos_levels |= cefr_by_pos[k][cp]
            if pos_levels:
                cefr = min(pos_levels, key=CEFR_ORDER.index); cefr_posmatch = True
            else:
                alllv = set()
                for k in hit_keys: alllv |= cefr_any[k]
                cefr = min(alllv, key=CEFR_ORDER.index)
            cefr_src = "cefrj"
        else:
            ox = set()
            for k in keys:
                if k in oxford: ox |= oxford[k]
            if ox:
                cefr = min(ox, key=CEFR_ORDER.index); cefr_src = "oxford"
            else:
                # supplementary（kamome）：僅補 authoritative 全缺的進階字；只接受 B2/C1/C2，
                # 低端(A1/A2/B1)對罕用字不可靠（見 load_supplementary 註），一律丟棄→誠實留 unclassified。
                sv = set()
                for k in keys:
                    if k in suppl: sv |= suppl[k]
                adv = sv & {"B2", "C1", "C2"}
                if adv:
                    cefr = min(adv, key=CEFR_ORDER.index); cefr_src = "kamome-suppl"
        # GEPT
        g_hit = [gept[k] for k in keys if k in gept]
        gept_lv = min(g_hit, key=GEPT_ORDER.index) if g_hit else None
        # YLE
        y_hit = [yle[k] for k in keys if k in yle]
        yle_lv = min(y_hit, key=YLE_ORDER.index) if y_hit else None
        # TOEIC＝TSL（官方替代）∪ AWL（Academic Word List）∪ BSL（Business Service List）；HD 2026-11-13 併入
        in_tsl = any(k in tsl for k in keys)
        in_awl = any(k in awl for k in keys)
        in_bsl = any(k in bsl for k in keys)
        toeic = in_tsl or in_awl or in_bsl
        # CEFR 估級（只在 authoritative cefr 全缺時）
        cefr_est = None; cefr_est_src = None
        if not cefr:
            cefr_est, cefr_est_src = estimate_cefr(gept_lv, yle_lv, c.get("band"))

        tags[sk] = {"cefr": cefr, "cefr_est": cefr_est, "cefr_est_src": cefr_est_src,
                    "gept": gept_lv, "yle": yle_lv, "toeic": bool(toeic)}
        if in_tsl: stats["toeic_tsl"] += 1
        if in_awl: stats["toeic_awl"] += 1
        if in_awl and not in_tsl: stats["toeic_awl_only"] += 1
        if in_bsl: stats["toeic_bsl"] += 1
        if in_bsl and not (in_tsl or in_awl): stats["toeic_bsl_only"] += 1
        if cefr_est:
            stats["cefr_est"] += 1
            stats["cefr_est_src"][cefr_est_src] = stats["cefr_est_src"].get(cefr_est_src,0)+1
            stats["cefr_est_levels"][cefr_est] = stats["cefr_est_levels"].get(cefr_est,0)+1
        elif not cefr:
            stats["cefr_still_unclassified"] += 1
        if cefr:
            stats["cefr"] += 1; stats["cefr_levels"][cefr] = stats["cefr_levels"].get(cefr,0)+1
            stats["cefr_src"][cefr_src] = stats["cefr_src"].get(cefr_src,0)+1
        if cefr_posmatch: stats["cefr_pos_matched"] += 1
        if gept_lv: stats["gept"] += 1; stats["gept_levels"][gept_lv] = stats["gept_levels"].get(gept_lv,0)+1
        if yle_lv: stats["yle"] += 1; stats["yle_levels"][yle_lv] = stats["yle_levels"].get(yle_lv,0)+1
        if toeic: stats["toeic"] += 1
        if not (cefr or gept_lv or yle_lv or toeic):
            stats["none_of_four"] += 1
            if len(misses) < 60: misses.append(hw)

    # canonical dump + fingerprint
    canon = json.dumps(tags, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    fp = hashlib.sha256(canon.encode("utf-8")).hexdigest()

    manifest = {}
    for fn in ["cefrj-vocabulary-profile-1.5.csv","octanove-vocabulary-profile-c1c2-1.0.csv",
               "oxford_20260715160822-oxford-3000.en.tsv","oxford_20260715165539-oxford-5000-expanded.en.tsv",
               "gept_GEPT_High-Intermediate.pdf","yle_starters_hd_paste.txt","yle_movers_hd_paste.txt",
               "yle_flyers_hd_paste.txt","tsl_TSL_12_alphabetized_description.txt","american_to_british.json",
               "kamome_cefr_index.json","awl_headwords.txt","bsl_1.20_lemmatized.txt"]:
        pth = os.path.join(SRC, fn)
        if os.path.exists(pth):
            manifest[fn] = {"sha256": sha256_file(pth), "bytes": os.path.getsize(pth)}

    out = {"schema": "wordmaster-tags/1", "fingerprint_sha256": fp,
           "built_utc": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
           "cards_sha256": sha256_file(CARDS),
           "sources": {"cefr":"CEFR-J Vocabulary Profile 1.5 + Octanove C1/C2 1.0 (openlanguageprofiles); fallback Oxford 3000/5000 (A1–C1) 補基本字缺口; 最後 supplementary=kamome1037/cefr-highlight（社群彙編；僅接受 B2/C1/C2 補 authoritative 全缺進階字，低端 A1/A2/B1 因對罕用字不可靠而丟棄；絕不覆蓋 authoritative）",
                       "gept":"LTTC 全民英檢官方參考字表（初級/中級/中高級）",
                       "yle":"Cambridge YLE Starters/Movers/Flyers Picture Book A–Z Word List (2018)",
                       "toeic":"TOEIC Service List (TSL v1.2, Browne & Culligan) — 代用，非 ETS 官方 ∪ Academic Word List (Coxhead 2000, 570 families, Sublists 1-10) ∪ Business Service List v1.20 (Browne & Culligan, 1744 families；HD 2026-11-13 併入 TOEIC)",
                       "cefr_est":"authoritative CEFR 全缺時的透明估計（不覆蓋 authoritative）：GEPT 初級→A2/中級→B1/中高級→B2（LTTC）、YLE starters/movers→A1 flyers→A2（Cambridge）、否則 COCA 頻率帶→CEFR（1k A1,2k A2,3k B1,4-5k B2,6-8k C1,9k-tail C2）"},
           "source_files": manifest, "stats": stats, "sample_unmapped": misses}

    with open(OUT_TAGS, "w", encoding="utf-8") as f:
        json.dump({"schema":"wordmaster-tags/1","fingerprint_sha256":fp,"tags":tags}, f, ensure_ascii=False, sort_keys=True, separators=(",",":"))
    with open(OUT_REP, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    print("fingerprint", fp)
    print(json.dumps(stats, ensure_ascii=False, indent=2))
    print("sample unmapped:", misses[:40])

if __name__ == "__main__":
    main()
