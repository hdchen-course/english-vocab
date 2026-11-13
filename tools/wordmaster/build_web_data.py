#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_web_data.py — 單字大師 web 資料層：COCA cards.jsonl + tags.json → 站上輕量 shard。
難易度軸＝CEFR（a1..c2 + unclassified）分 shard 延遲載入（R9）；每卡帶 tags（gept/yle/toeic）供次級篩選。
只轉格式不改事實（R3）：事實改要回 Anki 來源。
用法：/Volumes/workplace/EnglishTraining/.venv/bin/python -I tools/wordmaster/build_web_data.py
"""
import json, os, hashlib

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CARDS = os.path.abspath(os.path.join(ROOT, "..", "Anki", "data", "cards.jsonl"))
TAGS  = os.path.join(ROOT, "assets", "wordmaster", "tags.json")
OUTDIR = os.path.join(ROOT, "assets", "wordmaster", "cards")
INDEX = os.path.join(ROOT, "assets", "wordmaster", "index.json")

CEFR_BUCKETS = ["a1","a2","b1","b2","c1","c2","unclassified"]

def is_content_word(pos):
    """單字卡只收實詞：noun/verb/adjective/adverb/interjection。
    排除虛詞（determiner/pronoun/preposition/conjunction/number/modal/article/abbreviation）——
    對這類做「看義想字」無學習價值（HD：頻率≠難易度，別讓 a/the/of 占據牌組）。"""
    p = (pos or "").lower()
    if p.startswith(("noun","n.","n ")) or p == "n": return True
    if p.startswith(("verb","v.","v ")) or p == "v": return "modal" not in p
    if p.startswith(("adj","adv")): return True
    if p.startswith(("interj","exclam")): return True
    return False

def main():
    os.makedirs(OUTDIR, exist_ok=True)
    all_cards = [json.loads(l) for l in open(CARDS, encoding="utf-8")]
    cards = [c for c in all_cards if is_content_word(c.get("pos",""))]
    tags = json.load(open(TAGS, encoding="utf-8"))["tags"]

    buckets = {b: [] for b in CEFR_BUCKETS}
    counts = {"cefr": {}, "gept": {}, "yle": {}, "toeic": 0, "coca": {},
              "total": len(cards), "excluded_function_words": len(all_cards)-len(cards)}
    for c in cards:
        sk = c["sense_key"]; t = tags.get(sk, {})
        cefr = t.get("cefr"); gept = t.get("gept"); yle = t.get("yle"); toeic = bool(t.get("toeic"))
        cefr_est = t.get("cefr_est"); cefr_est_src = t.get("cefr_est_src")
        exs = []
        for col in (c.get("collocations") or [])[:2]:
            ex = col.get("example")
            if ex: exs.append(ex)
        rec = {
            "sk": sk, "hw": c["headword"], "pos": c.get("pos",""),
            "ipaus": c.get("ipa_us",""), "ipauk": c.get("ipa_uk",""),
            "def": c.get("definition",""), "ex": exs,
            "aw": c.get("audio_word",""), "ae": (c.get("audio_examples") or [])[:2],
            "band": c.get("band",""), "rank": c.get("rank"),
            "cefr": cefr, "cefr_est": cefr_est, "cefr_est_src": cefr_est_src,
            "gept": gept, "yle": yle, "toeic": toeic,
        }
        b = cefr.lower() if cefr else "unclassified"
        buckets[b].append(rec)
        if cefr: counts["cefr"][cefr] = counts["cefr"].get(cefr,0)+1
        else: counts["cefr"]["unclassified"] = counts["cefr"].get("unclassified",0)+1
        if gept: counts["gept"][gept] = counts["gept"].get(gept,0)+1
        if yle: counts["yle"][yle] = counts["yle"].get(yle,0)+1
        if toeic: counts["toeic"] += 1
        bd=c.get("band","")
        if bd: counts["coca"][bd] = counts["coca"].get(bd,0)+1

    # 跨-scheme shard（GEPT/YLE/TOEIC level → 卡）供單檔延遲載入
    scheme_buckets = {}  # "gept/初級" -> [rec]
    for b, recs in buckets.items():
        for r in recs:
            if r["gept"]: scheme_buckets.setdefault("gept/"+r["gept"], []).append(r)
            if r["yle"]:  scheme_buckets.setdefault("yle/"+r["yle"], []).append(r)
            if r["toeic"]: scheme_buckets.setdefault("toeic/toeic", []).append(r)
            if r["band"]: scheme_buckets.setdefault("coca/"+r["band"], []).append(r)  # COCA 頻率（非難易度）

    def rank_key(r): return r["rank"] if isinstance(r["rank"], int) else 999999
    shard_meta = {}
    def dump(key, recs):
        recs = sorted(recs, key=rank_key)
        p = os.path.join(OUTDIR, key.replace("/", "_") + ".json")
        payload = json.dumps({"bucket": key, "cards": recs}, ensure_ascii=False, separators=(",",":"))
        open(p, "w", encoding="utf-8").write(payload)
        shard_meta[key] = {"count": len(recs), "bytes": len(payload.encode("utf-8")),
                           "sha256": hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]}
    for b, recs in buckets.items():
        dump(b, recs)
    for key, recs in scheme_buckets.items():
        dump(key, recs)

    # all.json：依字母排序的全卡（供「統計圖表」與「字母序瀏覽」兩頁共用；buckets 依 CEFR 分割，每卡恰一次）
    all_recs = []
    for b in CEFR_BUCKETS:
        all_recs.extend(buckets[b])
    def hw_key(r):
        h = (r.get("hw") or "").lower()
        return (h, r.get("sk") or "")
    all_recs = sorted(all_recs, key=hw_key)
    allp = os.path.join(OUTDIR, "all.json")
    all_payload = json.dumps({"bucket": "all", "count": len(all_recs), "cards": all_recs},
                             ensure_ascii=False, separators=(",", ":"))
    open(allp, "w", encoding="utf-8").write(all_payload)
    shard_meta["all"] = {"count": len(all_recs), "bytes": len(all_payload.encode("utf-8")),
                         "sha256": hashlib.sha256(all_payload.encode("utf-8")).hexdigest()[:16]}
    print("all.json:", len(all_recs), "cards,", len(all_payload.encode("utf-8")), "bytes")

    # stats_index.json：精簡 sk→tags（供「統計圖表」頁把 SRS 盒分布 join 到各分級；不含 def/ex，省頻寬）
    si = [{"sk": r["sk"], "hw": r["hw"],
           "cefr": r["cefr"], "cefr_est": r["cefr_est"],
           "gept": r["gept"], "yle": r["yle"], "toeic": r["toeic"], "band": r["band"]}
          for r in all_recs]
    sip = os.path.join(OUTDIR, "stats_index.json")
    si_payload = json.dumps({"schema": "wordmaster-stats-index/1", "count": len(si), "cards": si},
                            ensure_ascii=False, separators=(",", ":"))
    open(sip, "w", encoding="utf-8").write(si_payload)
    print("stats_index.json:", len(si), "cards,", len(si_payload.encode("utf-8")), "bytes")

    index = {
        "schema": "wordmaster-web/1",
        "tags_fingerprint": json.load(open(TAGS, encoding="utf-8"))["fingerprint_sha256"],
        "counts": counts,
        "cefr_buckets": CEFR_BUCKETS,
        "schemes": {
            "cefr":  {"label_zh":"CEFR 分級","label_en":"CEFR","levels":["a1","a2","b1","b2","c1","c2"],"primary":True},
            "gept":  {"label_zh":"全民英檢 GEPT","label_en":"GEPT","levels":["初級","中級","中高級"]},
            "yle":   {"label_zh":"劍橋兒少 YLE","label_en":"YLE","levels":["starters","movers","flyers"]},
            "toeic": {"label_zh":"TOEIC(TSL)","label_en":"TOEIC","levels":["toeic"]},
            "coca":  {"label_zh":"COCA 高頻（頻率）","label_en":"COCA frequency","levels":["1k","2k","3k","4k","5k","6k","7k","8k","9k","10k","tail"]},
        },
        "shards": shard_meta,
        "note": "難易度軸＝CEFR；band 為 COCA 頻率 metadata（非難易度）。GEPT/YLE/TOEIC 為替代分級，於已載入卡片上用 tags 次級篩選。未分級＝官方清單皆無對應（誠實留空）。",
    }
    open(INDEX, "w", encoding="utf-8").write(json.dumps(index, ensure_ascii=False, indent=2))
    print("shards:", {b: shard_meta[b]["count"] for b in CEFR_BUCKETS})
    print("total bytes:", sum(m["bytes"] for m in shard_meta.values()))
    print("counts:", json.dumps(counts, ensure_ascii=False))

if __name__ == "__main__":
    main()
