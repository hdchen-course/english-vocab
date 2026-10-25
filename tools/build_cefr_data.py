#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_cefr_data.py — 系列 A（CEFR）單字軌轉檔（DICTATION_BUILD_SPEC.md §12 OPEN-C 定案 / §9）。
A 期（單字軌）：讀版控 src/cefr_words_{LV}.json（words only，站內字表抽出的事實）
  + 可選 src/dict_authored_cefr.json（B 期 sentence/zh/syll/ipa/pos，keyed by authKey）
  + 可選 src/dict_slug_overrides_cefr.json（per-series slug 碰撞覆寫）
  + src/dict_us_uk.json（US↔UK，填 ukSpelling）
→ src/dict_data_cefr_{LV}.ts（→ window.DICT_CEFR，concat）+ 單一 per-series sidecar
  src/dict_items_cefr.json（{meta:{expectedAudioCount:{6 鍵}}, items:[...]}）。

word 軌：level=cefr-{lv}、day='na'、kind='word'、audioSlug=word 正規化、
  檔名 word_dict_cefr_<slug>_<accent>.mp3。sent_* 於 A 期為 0（B 期才 >0）。
asserts：slug 1:1（兩不同字→同 slug 報錯，需 override 解）、反向唯一（字→一 slug）、
  authored orphan / 無兩 item 共用 authKey。
用法：/Volumes/workplace/EnglishTraining/.venv/bin/python -I tools/build_cefr_data.py
"""
import glob
import hashlib
import json
import os
import re
import sys
import unicodedata


def sha12(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
SERIES = "cefr"
LEVELS = ["a1", "a2", "b1", "b2", "c1", "c2"]  # A1–B1 站內字表；B2–C2 開放清單（NGSL/AWL，review 定案）
# 高價值「主題例句」集（只有例句、無單字軌）：日常/片語/慣用/數字情境/金句。
# level=cefr-<set>，與 CEFR 等級並存於 cefr series（store key dict_cefr_<set>_sent_v1）。
SENT_SETS = ["daily", "phrasal", "idioms", "practical", "quotes"]
OVERRIDES = os.path.join(SRC, "dict_slug_overrides_cefr.json")
AUTHORED = os.path.join(SRC, "dict_authored_cefr.json")
US_UK = os.path.join(SRC, "dict_us_uk.json")
OUT_SIDECAR = os.path.join(SRC, "dict_items_cefr.json")


def die(m):
    sys.stderr.write("BUILD FAIL: " + m + "\n"); sys.exit(1)


def load_json(p, d):
    return json.load(open(p, encoding="utf-8")) if os.path.exists(p) else d


def normalize_slug(word):
    s = unicodedata.normalize("NFC", word).strip().lower()
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^a-z0-9-]", "", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s


def main():
    overrides = {k: v for k, v in load_json(OVERRIDES, {}).items() if not k.startswith("_")}
    authored = load_json(AUTHORED, {})
    us_uk = {k: v for k, v in load_json(US_UK, {}).items() if not k.startswith("_")}

    items = []
    slug_to_word, word_to_slug, authkeys = {}, {}, {}
    override_used = set()

    def resolve_slug(word):
        if word in overrides:
            override_used.add(word); return overrides[word]
        return normalize_slug(word)

    def add(word, level):
        slug = resolve_slug(word)
        if not slug:
            die("word %r 正規化後為空 (level=%s)" % (word, level))
        if slug in slug_to_word and slug_to_word[slug] != word:
            die("slug 碰撞：%r 與 %r → %r；請在 src/dict_slug_overrides_cefr.json 指定 (§4.1)"
                % (slug_to_word[slug], word, slug))
        if word in word_to_slug and word_to_slug[word] != slug:
            die("反向唯一違反：%r → %r / %r" % (word, word_to_slug[word], slug))
        slug_to_word[slug] = word; word_to_slug[word] = slug
        kind = "word"
        item_id = "%s::cefr-%s::na::%s::%s" % (SERIES, level, kind, slug)
        ak = "cefr-%s::na::%s::%s" % (level, kind, word)
        if ak in authkeys:
            die("兩 item 共用 authKey=%r" % ak)
        authkeys[ak] = item_id
        it = {
            "id": item_id, "word": word, "kind": kind, "day": "na",
            "level": "cefr-%s" % level, "src": "cefr-%s" % level, "audioSlug": slug,
            "audioKeys": ["word_dict_%s_%s_us" % (SERIES, slug),
                          "word_dict_%s_%s_gb" % (SERIES, slug)],
            "authKey": ak,
        }
        uk = us_uk.get(word)
        if uk and uk != word:
            it["ukSpelling"] = uk
        items.append(it)

    per_level = {}
    for lv in LEVELS:
        path = os.path.join(SRC, "cefr_words_%s.json" % lv)
        if not os.path.exists(path):
            die("缺 %s（請先抽站內字表）" % path)
        words = load_json(path, {}).get("words", [])
        before = len(items)
        for w in words:
            add(w, lv)
        per_level[lv] = len(items) - before

    # 例句軌（B 期）：讀 src/cefr_sentences_{LV}.json（自寫句，6-lens team 審）
    # sent item：word=整句、audioSlug=hash(句)、kind='sent'、4 音檔鍵（us/gb × 正常/slow）；
    # wordTimings 由 gen_dict_audio 的 WordBoundary 擷取回填（src/cefr_wordtimings.json，§5.4）。
    timings = load_json(os.path.join(SRC, "cefr_wordtimings.json"), {})
    sent_per_level = {}
    for lv in LEVELS + SENT_SETS:
        spath = os.path.join(SRC, "cefr_sentences_%s.json" % lv)
        if not os.path.exists(spath):
            sent_per_level[lv] = 0
            continue
        cnt = 0
        for s in load_json(spath, {}).get("items", []):
            sentence = (s.get("sentence") or "").strip()
            if not sentence:
                continue
            ak = "cefr-%s::na::sent::%s" % (lv, sentence)
            if ak in authkeys:
                continue  # 同級同句去重
            authkeys[ak] = 1
            h = sha12(sentence)
            it = {
                "id": "%s::cefr-%s::na::sent::%s" % (SERIES, lv, h),
                "word": sentence, "kind": "sent", "day": "na",
                "level": "cefr-%s" % lv, "src": "cefr-%s-sent" % lv, "audioSlug": h,
                "audioKeys": ["sent_dict_%s_%s_us" % (SERIES, h), "sent_dict_%s_%s_gb" % (SERIES, h),
                              "sent_dict_%s_%s_us_slow" % (SERIES, h), "sent_dict_%s_%s_gb_slow" % (SERIES, h)],
                "authKey": ak,
            }
            if s.get("zh"):
                it["zh"] = s["zh"]
            if h in timings:
                it["wordTimings"] = timings[h]
            items.append(it)
            cnt += 1
        sent_per_level[lv] = cnt

    # authored merge（B 期；A 期檔空）
    AF = ("zh", "syll", "ipa", "pos", "sentence")
    by_ak = {it["authKey"]: it for it in items}
    for ak, fields in authored.items():
        if ak.startswith("_"):
            continue
        if ak not in by_ak:
            die("authored key %r 孤兒 (§4.2)" % ak)
        if isinstance(fields, dict):
            for fk in AF:
                if fields.get(fk) not in (None, ""):
                    by_ak[ak][fk] = fields[fk]

    unused = set(overrides) - override_used
    if unused:
        die("未套用的 override key：%s" % sorted(unused))

    word_slugs = set(it["audioSlug"] for it in items if it["kind"] == "word")
    sent_h = set(it["audioSlug"] for it in items if it["kind"] == "sent")
    nw, ns = len(word_slugs), len(sent_h)
    # 固定 6 鍵恆列（缺鍵 gate(e) FAIL）：word 兩腔；sent 兩腔 + 兩腔 slow（例句軌才 >0）
    expected = {"word_us": nw, "word_gb": nw, "sent_us": ns, "sent_gb": ns,
                "sent_slow_us": ns, "sent_slow_gb": ns}

    sidecar_items = []
    for it in items:
        row = {k: it[k] for k in ("id", "kind", "day", "level", "src", "word", "audioSlug", "audioKeys")}
        if "ukSpelling" in it:
            row["ukSpelling"] = it["ukSpelling"]
        sidecar_items.append(row)
    json.dump({"meta": {"expectedAudioCount": expected}, "items": sidecar_items},
              open(OUT_SIDECAR, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # per-level dict_data_cefr_{LV}.ts（→ window.DICT_CEFR concat）
    DF = ("id", "word", "ukSpelling", "syll", "ipa", "zh", "pos", "sentence",
          "wordTimings", "audioSlug", "kind", "day", "level", "src")
    for lv in LEVELS + SENT_SETS:
        rows = []
        for it in items:
            if it["level"] != "cefr-%s" % lv:
                continue
            rows.append({k: it[k] for k in DF if it.get(k) not in (None, "")})
        with open(os.path.join(SRC, "dict_data_cefr_%s.ts" % lv), "w", encoding="utf-8") as f:
            f.write("// @ts-nocheck\n// 由 tools/build_cefr_data.py 生成（站內字表 word 欄，事實）；勿手改。\n")
            f.write("window.DICT_CEFR = (window.DICT_CEFR || []).concat(")
            json.dump(rows, f, ensure_ascii=False, separators=(",", ":"))
            f.write(");\n")

    sys.stdout.write("OK build_cefr_data: 單字 %s（%d 相異 slug→%d mp3）；例句 %s（%d 相異句→%d mp3: us/gb×正常/slow）；"
                     "總 item %d；ukSpelling %d；authored %d。\n" % (
                         per_level, nw, nw * 2, sent_per_level, ns, ns * 4,
                         len(items), sum(1 for it in items if "ukSpelling" in it),
                         len([k for k in authored if not k.startswith("_")])))


if __name__ == "__main__":
    main()
