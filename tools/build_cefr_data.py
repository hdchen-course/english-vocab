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
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
SERIES = "cefr"
LEVELS = ["a1", "a2", "b1"]  # A 期：站內現有；B2–C2 待 sourcing（延後）
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

    distinct = set(it["audioSlug"] for it in items)
    n = len(distinct)
    # A 期 word-only：sent_* = 0（固定 6 鍵，缺鍵 gate(e) FAIL，故恆列）
    expected = {"word_us": n, "word_gb": n, "sent_us": 0, "sent_gb": 0,
                "sent_slow_us": 0, "sent_slow_gb": 0}

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
          "audioSlug", "kind", "day", "level", "src")
    for lv in LEVELS:
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

    sys.stdout.write("OK build_cefr_data: %s；總 item %d；相異 audioSlug %d → word mp3 %d×2腔=%d；"
                     "ukSpelling %d；authored %d。\n" % (
                         per_level, len(items), n, n, n * 2,
                         sum(1 for it in items if "ukSpelling" in it),
                         len([k for k in authored if not k.startswith("_")])))


if __name__ == "__main__":
    main()
