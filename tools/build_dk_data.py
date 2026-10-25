#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_dk_data.py — DK《5 Words a Day》資料轉檔 (DICTATION_BUILD_SPEC.md §9 轉檔).

讀「版控快照」 src/dk_index_us.json (§5.3；rebuild 一律讀此、不抓 live CloudFront → R12 確定性)
 + 自寫檔 src/dict_authored_dk.json (zh/syll/ipa/pos；以 authKey merge，§4.2)
 + per-series slug 碰撞覆寫 src/dict_slug_overrides_dk.json (keyed by 原始 word，§4.1)
 + US↔UK 對照 src/dict_us_uk.json (authored；填 ukSpelling，§5.3)
→ 出 src/dict_data_dk.ts (→ window.DICT_DK，含 reveal 欄) + src/dict_items_dk.json sidecar
   ({meta:{expectedAudioCount:{6 鍵}}, items:[...]}，§4.3).

只取 CloudFront 的 text (事實性單字)；day5 (text:null) 由引擎執行期合成、不入 sidecar。
build 的 asserts (§4.1/§4.2/§7)：
  (i) slug 1:1 — 兩個不同原始字映到同 audioSlug → 報錯 (需 overrides 解)
  (ii) 反向唯一 — 任一原始 word → 一個 audioSlug
  (iii) 預期音檔數寫入 meta.expectedAudioCount (實際 mp3 數比對在音檔 gate (e)，非本 build)
  intra-week — 每週 d1–d4 恰 20 個相異 audioSlug (否則 d5 的 20 張會塌，§7 修 r51)
  authored — 每筆 authored key 對得到現存 item；無兩個相異 item 共用同一 authKey
  bonus allowlist — 僅 numbers/days/months 三個 bonus level

用法 (venv)：
  /Volumes/workplace/EnglishTraining/.venv/bin/python -I tools/build_dk_data.py
"""
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")

SNAPSHOT = os.path.join(SRC, "dk_index_us.json")
AUTHORED = os.path.join(SRC, "dict_authored_dk.json")
OVERRIDES = os.path.join(SRC, "dict_slug_overrides_dk.json")
US_UK = os.path.join(SRC, "dict_us_uk.json")

OUT_TS = os.path.join(SRC, "dict_data_dk.ts")
OUT_SIDECAR = os.path.join(SRC, "dict_items_dk.json")

SERIES = "dk"
BONUS_TITLES = {"Numbers": "numbers", "Days": "days", "Months": "months"}


def die(msg):
    sys.stderr.write("BUILD FAIL: " + msg + "\n")
    sys.exit(1)


def load_json(path, default):
    if not os.path.exists(path):
        return default
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def normalize_slug(word):
    """lower、NFC、空白→'-'、去非 [a-z0-9-]；合併連續 '-'。"""
    s = unicodedata.normalize("NFC", word).strip().lower()
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"[^a-z0-9-]", "", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s


def zpad2(n):
    return ("0" + str(n))[-2:]


def main():
    index = load_json(SNAPSHOT, None)
    if index is None:
        die("找不到版控快照 src/dk_index_us.json (§5.3；請先 commit 快照)")
    authored = load_json(AUTHORED, {})
    overrides = load_json(OVERRIDES, {})
    us_uk = load_json(US_UK, {})
    us_uk = {k: v for k, v in us_uk.items() if not k.startswith("_")}

    weeks = index.get("data", {}).get("ref", {}).get("weeks", [])
    if not weeks:
        die("快照無 data.ref.weeks[]")

    items = []           # 每筆 DictItem (dict)
    slug_to_word = {}    # audioSlug -> 原始 word (查 1:1 碰撞)
    word_to_slug = {}    # 原始 word -> audioSlug (查反向唯一)
    authkeys = {}        # authKey -> item id (查無兩 item 共用)
    override_used = set()

    def resolve_slug(word):
        """套 override (keyed by 原始 word) → 否則正規化。"""
        if word in overrides:
            override_used.add(word)
            return overrides[word]
        return normalize_slug(word)

    def add_item(word, level, day, src):
        slug = resolve_slug(word)
        if not slug:
            die("word %r 正規化後為空 slug (level=%s day=%s)" % (word, level, day))
        # (i) slug 1:1：兩個「不同原始字」映到同 slug → 報錯 (需 override 解)
        if slug in slug_to_word and slug_to_word[slug] != word:
            die("slug 碰撞：%r 與 %r 都映到 audioSlug=%r；請在 src/dict_slug_overrides_dk.json "
                "為其一指定不同 slug (§4.1)" % (slug_to_word[slug], word, slug))
        # (ii) 反向唯一：同一原始字跨週必須同 slug
        if word in word_to_slug and word_to_slug[word] != slug:
            die("反向唯一性違反：word %r 映到兩個 slug %r / %r (§4.1 assert ii)"
                % (word, word_to_slug[word], slug))
        slug_to_word[slug] = word
        word_to_slug[word] = slug

        kind = "word"
        item_id = "%s::%s::%s::%s::%s" % (SERIES, level, day, kind, slug)
        auth_key = "%s::%s::%s::%s" % (level, day, kind, word)  # §4.2：原始 word，保留大小寫
        if auth_key in authkeys:
            die("兩個相異 item 共用同一 authKey=%r (§4.2 修 r22-F2)" % auth_key)
        authkeys[auth_key] = item_id

        it = {
            "id": item_id,
            "word": word,
            "kind": kind,
            "day": day,
            "level": level,
            "src": src,
            "audioSlug": slug,
            # 每 item 需要的音檔鍵 (§4.3；每鍵內嵌 series+slug+accent)
            "audioKeys": [
                "word_dict_%s_%s_us" % (SERIES, slug),
                "word_dict_%s_%s_gb" % (SERIES, slug),
            ],
            "authKey": auth_key,
        }
        uk = us_uk.get(word)
        if uk and uk != word:
            it["ukSpelling"] = uk
        items.append(it)
        return it

    # ---- 逐週解析 ----
    regular_count = 0
    bonus_levels_seen = set()
    for wi, wk in enumerate(weeks):
        title = (wk.get("title") or "").strip()
        days = wk.get("days", [])
        bonus_key = BONUS_TITLES.get(title)
        if bonus_key:
            # 加碼集：單一 day，整組字 (§4.4)
            level = "dk-bonus-" + bonus_key
            bonus_levels_seen.add(level)
            texts = [a.get("text") for d in days for g in d.get("groups", [])
                     for a in g.get("audio", []) if a.get("text")]
            for w in texts:
                add_item(w, level, "bonus", "dk-bonus-" + bonus_key)
        else:
            # 一般週：title 應為 'Week N'
            m = re.match(r"^Week\s+(\d+)$", title)
            if not m:
                die("第 %d 週 title 非 'Week N' 也非 bonus：%r" % (wi, title))
            wn = int(m.group(1))
            level = "dk-w" + zpad2(wn)
            regular_count += 1
            # 只取 day1–4 (days[0:4])；day5 (text:null) 跳過，由引擎合成
            week_slugs = []
            for dj in range(min(4, len(days))):
                d = days[dj]
                day_label = "d%d" % (dj + 1)
                texts = [a.get("text") for g in d.get("groups", [])
                         for a in g.get("audio", []) if a.get("text")]
                for w in texts:
                    it = add_item(w, level, day_label, "dk-w%sd%d" % (zpad2(wn), dj + 1))
                    week_slugs.append(it["audioSlug"])
            # intra-week：每週 d1–d4 恰 20 個相異 audioSlug (§7 修 r51)
            if len(week_slugs) != 20:
                die("Week %d 的 d1–d4 共 %d 字 (預期 20)" % (wn, len(week_slugs)))
            if len(set(week_slugs)) != 20:
                die("Week %d 的 d1–d4 有 intra-week 重複字 (相異 slug=%d≠20)；"
                    "d5 的 20 張會塌 (§7 修 r51)" % (wn, len(set(week_slugs))))

    # ---- bonus allowlist (§4.1/R5) ----
    allowed_bonus = {"dk-bonus-numbers", "dk-bonus-days", "dk-bonus-months"}
    extra = bonus_levels_seen - allowed_bonus
    if extra:
        die("出現非 allowlist 的 bonus level：%s (§4.1)" % sorted(extra))

    # ---- authored merge (§4.2；以 authKey) ----
    AUTHORED_FIELDS = ("zh", "syll", "ipa", "pos")
    item_by_authkey = {it["authKey"]: it for it in items}
    for ak, fields in authored.items():
        if ak.startswith("_"):
            continue
        if ak not in item_by_authkey:
            die("authored key %r 對不到任何現存 item (孤兒，§4.2)" % ak)
        tgt = item_by_authkey[ak]
        if isinstance(fields, dict):
            for fk in AUTHORED_FIELDS:
                if fk in fields and fields[fk] not in (None, ""):
                    tgt[fk] = fields[fk]

    # ---- override 皆被套用 (§4.1) ----
    unused = set(k for k in overrides if not k.startswith("_")) - override_used
    if unused:
        die("src/dict_slug_overrides_dk.json 有未被套用的 key（對不到任何字）：%s" % sorted(unused))

    # ---- expectedAudioCount (§4.3/§4.1 iii)：DK 為 word-only ----
    distinct_slugs = set(it["audioSlug"] for it in items)
    n = len(distinct_slugs)
    expected = {
        "word_us": n, "word_gb": n,
        "sent_us": 0, "sent_gb": 0, "sent_slow_us": 0, "sent_slow_gb": 0,
    }

    # ---- 輸出 sidecar (items 不含 authKey 內部欄) ----
    sidecar_items = []
    for it in items:
        row = {
            "id": it["id"], "kind": it["kind"], "day": it["day"],
            "level": it["level"], "src": it["src"], "word": it["word"],
            "audioSlug": it["audioSlug"], "audioKeys": it["audioKeys"],
        }
        if "ukSpelling" in it:
            row["ukSpelling"] = it["ukSpelling"]
        sidecar_items.append(row)
    sidecar = {"meta": {"expectedAudioCount": expected}, "items": sidecar_items}
    with open(OUT_SIDECAR, "w", encoding="utf-8") as f:
        json.dump(sidecar, f, ensure_ascii=False, indent=1)
        f.write("\n")

    # ---- 輸出 dict_data_dk.ts (→ window.DICT_DK；含 reveal 欄，不含 audioKeys/authKey) ----
    DATA_FIELDS = ("id", "word", "ukSpelling", "syll", "ipa", "zh", "pos",
                   "audioSlug", "kind", "day", "level", "src")
    data_rows = []
    for it in items:
        row = {}
        for fk in DATA_FIELDS:
            if fk in it and it[fk] not in (None, ""):
                row[fk] = it[fk]
        data_rows.append(row)
    with open(OUT_TS, "w", encoding="utf-8") as f:
        f.write("// @ts-nocheck\n")
        f.write("// 由 tools/build_dk_data.py 從版控快照 src/dk_index_us.json 生成；請勿手改。\n")
        f.write("// 自寫欄 (zh/syll/ipa/pos) 來自 src/dict_authored_dk.json；ukSpelling 來自 src/dict_us_uk.json。\n")
        f.write("window.DICT_DK = ")
        json.dump(data_rows, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    # ---- 摘要 ----
    n_regular = sum(1 for it in items if it["day"].startswith("d"))
    n_bonus = sum(1 for it in items if it["day"] == "bonus")
    sys.stdout.write(
        "OK build_dk_data: 一般週 %d 卡 (52×20=1040 預期)、加碼 %d 卡、"
        "總 item %d、相異 audioSlug %d → 預期 mp3 %d×2腔=%d；"
        "ukSpelling %d 筆；authored merged %d key。\n" % (
            n_regular, n_bonus, len(items), n,
            n, n * 2, sum(1 for it in items if "ukSpelling" in it),
            len([k for k in authored if not k.startswith("_")]),
        )
    )
    if n_regular != 1040:
        sys.stderr.write("WARN: 一般週卡數 %d ≠ 1040 (52×20)，請檢查快照。\n" % n_regular)


if __name__ == "__main__":
    main()
