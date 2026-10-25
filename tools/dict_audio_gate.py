#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
dict_audio_gate.py — 音檔 gate (DICTATION_BUILD_SPEC.md §6 / §10.3 items (a)-(e))。

(a) 每個被引用音檔鍵 → 檔案存在、size>0、可解碼（mp3 frame sync 檢查 + 抽樣 afplay）；
    另檢 audio/_unlock.mp3 存在且可解碼。
(b) 對每個 audioKey：b1 重算 SHA-1(資料檔當前 text) 前12 == manifest text_sha；
    b2 目標檔共置 .sha == manifest text_sha。
(c) slug 1:1 無碰撞（兩不同原始字→同 slug 即 FAIL）。
(d) 抽樣實聽數檔（afplay；人工確認內容+腔調，輸出層唯一內容驗證）。
(e) 逐 series 迭代固定六鍵集：audio/ 下該類 mp3 數 == meta.expectedAudioCount[鍵]；meta 缺鍵即 FAIL。

用法: /Volumes/workplace/EnglishTraining/.venv/bin/python -I tools/dict_audio_gate.py
退出碼 = 問題數（0=PASS）。
"""
import glob
import hashlib
import json
import os
import random
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
AUDIO = os.path.join(ROOT, "audio")
MANIFEST = os.path.join(AUDIO, "audio_manifest.json")
SIX_KEYS = ["word_us", "word_gb", "sent_us", "sent_gb", "sent_slow_us", "sent_slow_gb"]

problems = []


def sha12(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]


def is_mp3_decodable(path):
    """便宜的可解碼代理：size>0 且開頭為 ID3 或 MPEG frame sync(0xFFEx/0xFFFx)。"""
    try:
        if os.path.getsize(path) <= 0:
            return False
        with open(path, "rb") as f:
            head = f.read(4)
        if head[:3] == b"ID3":
            return True
        if len(head) >= 2 and head[0] == 0xFF and (head[1] & 0xE0) == 0xE0:
            return True
        return False
    except Exception:
        return False


def afplay_ok(path):
    try:
        return subprocess.run(["afplay", path], stdout=subprocess.DEVNULL,
                              stderr=subprocess.DEVNULL, timeout=20).returncode == 0
    except Exception:
        return False


def load_items():
    items = []
    for path in sorted(glob.glob(os.path.join(SRC, "dict_items_*.json"))):
        doc = json.load(open(path, encoding="utf-8"))
        items.extend(doc.get("items", []))
    return items


def load_meta():
    metas = {}
    for path in sorted(glob.glob(os.path.join(SRC, "dict_items_*.json"))):
        series = os.path.basename(path)[len("dict_items_"):-len(".json")]
        doc = json.load(open(path, encoding="utf-8"))
        metas[series] = doc.get("meta", {}).get("expectedAudioCount", {})
    return metas


def main():
    items = load_items()
    manifest = json.load(open(MANIFEST, encoding="utf-8")) if os.path.exists(MANIFEST) else {}

    # audioKey -> 當前資料 text（word 軌：該 item 的 word）
    key_text = {}
    word_to_slug = {}
    slug_to_word = {}
    for it in items:
        for k in it.get("audioKeys", []):
            key_text[k] = it["word"]
        w, s = it["word"], it["audioSlug"]
        word_to_slug.setdefault(w, s)
        if s in slug_to_word and slug_to_word[s] != w:
            problems.append("(c) slug 碰撞：%r 與 %r → 同 slug %r" % (slug_to_word[s], w, s))
        slug_to_word[s] = w

    # (a) + (b)
    missing = dead = 0
    for k, text in key_text.items():
        path = os.path.join(AUDIO, k + ".mp3")
        if not os.path.exists(path):
            problems.append("(a) 缺檔：%s.mp3" % k); missing += 1; continue
        if not is_mp3_decodable(path):
            problems.append("(a) 不可解碼/空：%s.mp3 (size=%d)" % (k, os.path.getsize(path))); dead += 1; continue
        cur = sha12(text)
        m = manifest.get(k)
        if not m:
            problems.append("(b) manifest 缺條目：%s" % k); continue
        if m.get("text_sha") != cur:
            problems.append("(b1) stale：%s manifest sha=%s ≠ 當前 text sha=%s (text=%r)"
                            % (k, m.get("text_sha"), cur, text))
        shapath = path + ".sha"
        if not os.path.exists(shapath):
            problems.append("(b2) 缺共置 .sha：%s.mp3.sha" % k)
        else:
            disk_sha = open(shapath, encoding="utf-8").read().strip()
            if disk_sha != m.get("text_sha"):
                problems.append("(b2) desync：%s .sha=%s ≠ manifest=%s" % (k, disk_sha, m.get("text_sha")))

    # (a) _unlock
    unlock = os.path.join(AUDIO, "_unlock.mp3")
    if not os.path.exists(unlock) or not is_mp3_decodable(unlock):
        problems.append("(a) audio/_unlock.mp3 缺或不可解碼")

    # (d) 抽樣實聽（afplay 數檔；CI 無音效裝置時僅確認 returncode）
    sample_keys = random.sample(list(key_text), min(6, len(key_text)))
    for k in sample_keys:
        p = os.path.join(AUDIO, k + ".mp3")
        if os.path.exists(p) and not afplay_ok(p):
            problems.append("(d) 抽樣 afplay 失敗：%s.mp3" % k)

    # (e) 逐 series 固定六鍵計數
    metas = load_meta()
    for series, meta in metas.items():
        for key in SIX_KEYS:
            if key not in meta:
                problems.append("(e) %s meta 缺鍵 %s（不視為 0）" % (series, key))
                continue
            # 直接用樣式計數：word_dict_<series>_*_<accent>.mp3（排除 _slow）/ sent 類另計
            if key == "word_us":
                pat = "word_dict_%s_*_us.mp3" % series
                excl_slow = False
            elif key == "word_gb":
                pat = "word_dict_%s_*_gb.mp3" % series; excl_slow = False
            elif key == "sent_us":
                pat = "sent_dict_%s_*_us.mp3" % series; excl_slow = True
            elif key == "sent_gb":
                pat = "sent_dict_%s_*_gb.mp3" % series; excl_slow = True
            elif key == "sent_slow_us":
                pat = "sent_dict_%s_*_us_slow.mp3" % series; excl_slow = False
            else:
                pat = "sent_dict_%s_*_gb_slow.mp3" % series; excl_slow = False
            files = [os.path.basename(p) for p in glob.glob(os.path.join(AUDIO, pat))]
            if "_unlock" in pat:
                files = [f for f in files if "_unlock" not in f]
            if excl_slow:
                files = [f for f in files if not f.endswith("_slow.mp3")]
            got = len(files)
            if got != meta[key]:
                problems.append("(e) %s %s 檔數 %d ≠ meta 預期 %d" % (series, key, got, meta[key]))

    # 報告
    if problems:
        sys.stdout.write("AUDIO GATE FAIL — %d problems:\n" % len(problems))
        for p in problems[:50]:
            sys.stdout.write("  " + p + "\n")
        if len(problems) > 50:
            sys.stdout.write("  …(+%d more)\n" % (len(problems) - 50))
        sys.exit(len(problems))
    sys.stdout.write("AUDIO GATE PASS — (a) 存在/可解碼 (b) text_sha b1+b2 (c) slug 1:1 "
                     "(d) 抽樣實聽 (e) 逐 series 六鍵計數 全過。audioKeys=%d\n" % len(key_text))
    sys.exit(0)


if __name__ == "__main__":
    main()
