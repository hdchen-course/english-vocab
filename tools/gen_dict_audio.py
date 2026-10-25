#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
gen_dict_audio.py — 聽寫音檔管線 (DICTATION_BUILD_SPEC.md §6)。

讀全部 src/dict_items_*.json 的 .items 聯集 → 迭代每 item 的 audioKeys[]
（已內嵌 series+slug+accent(+slow)）→ 以 (series, audioSlug|hash, accent[, slow])
為去重鍵呼叫 edge-tts（voice 依 §5.4：us=en-US-AriaNeural / gb=en-GB-SoniaNeural）
→ 寫 audio/word_dict_<series>_<slug>_<accent>.mp3。

冪等（§6 修 r19-D2/r20-F2）：以目標 mp3 檔名為鍵；每檔於合成時原子寫出共置
  audio/<name>.sha = SHA-1(text) 前 12 hex。skip 判定：目標存在 AND 其 .sha ==
  當前資料文字 sha 才跳過，否則重合成覆蓋並更新 .sha。
manifest（持久、增量）：audio_manifest.json 每筆 {audioKey,text,accent,file,text_sha}
  於 synth 呼叫點捕捉；本次未重合成者原封保留。

TTS 輸入文字（§5.4）：word 軌兩腔皆合成 item.word（US headword）；ukSpelling 只
  reveal 顯示、絕不另外合成。_unlock.mp3 不由本工具產生（§4.3 靜態資產）。

用法（venv，需連網）：
  /Volumes/workplace/EnglishTraining/.venv/bin/python -I tools/gen_dict_audio.py
  環境變數 DCT_LIMIT=N 只做前 N 個 slug（smoke test）；DCT_CONC=8 併發數。
"""
import asyncio
import glob
import hashlib
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
AUDIO = os.path.join(ROOT, "audio")
MANIFEST = os.path.join(AUDIO, "audio_manifest.json")

VOICE = {"us": "en-US-AriaNeural", "gb": "en-GB-SoniaNeural"}
SLOW_RATE = "-25%"  # 僅例句軌用；word 軌不用（§5.4）

CONC = int(os.environ.get("DCT_CONC", "8"))
LIMIT = int(os.environ.get("DCT_LIMIT", "0"))


def sha12(text):
    return hashlib.sha1(text.encode("utf-8")).hexdigest()[:12]


def load_items():
    """全部 src/dict_items_*.json 的 .items 聯集。"""
    items = []
    for path in sorted(glob.glob(os.path.join(SRC, "dict_items_*.json"))):
        with open(path, "r", encoding="utf-8") as f:
            doc = json.load(f)
        items.extend(doc.get("items", []))
    return items


def build_jobs(items):
    """去重鍵 (series, slug|hash, accent, slow) → job。word 軌 text=word。"""
    jobs = {}  # audioKey(filename stem) -> {text, accent, slow, file, series}
    # item.word 需從 .items 的 word 欄取；audioKeys 內嵌 series/slug/accent
    for it in items:
        word = it.get("word")
        kind = it.get("kind", "word")
        for key in it.get("audioKeys", []):
            if key in jobs:
                continue
            # key 形如 word_dict_dk_<slug>_<accent> 或 sent_dict_dk_<hash>_<accent>[_slow]
            parts = key.split("_")
            # word_dict / sent_dict 前綴
            slow = key.endswith("_slow")
            accent = "gb" if ("_gb" in key) else "us"
            fname = key + ".mp3"
            # word 軌：兩腔皆合成 item.word（US headword）
            text = word
            jobs[key] = {
                "audioKey": key, "text": text, "accent": accent,
                "slow": slow, "file": fname, "kind": kind,
            }
    return jobs


def load_manifest():
    if os.path.exists(MANIFEST):
        try:
            with open(MANIFEST, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


async def synth_one(job, sem, manifest, stats):
    import edge_tts
    key = job["audioKey"]
    text = job["text"]
    accent = job["accent"]
    target = os.path.join(AUDIO, job["file"])
    shapath = target + ".sha"
    cur_sha = sha12(text)

    # 冪等：目標存在 AND 共置 .sha == 當前 sha → 跳過
    if os.path.exists(target) and os.path.exists(shapath):
        try:
            with open(shapath, "r", encoding="utf-8") as f:
                if f.read().strip() == cur_sha:
                    # 保留既有 manifest 條目（持久增量）；若缺則補 synth-time 快照不可得，
                    # 但既跳過代表先前已寫過 manifest；缺則以當前 text 補（text 未變，sha 一致）。
                    if key not in manifest:
                        manifest[key] = {"audioKey": key, "text": text, "accent": accent,
                                         "file": job["file"], "text_sha": cur_sha}
                    stats["skip"] += 1
                    return
        except Exception:
            pass

    voice = VOICE[accent]
    kwargs = {}
    if job["slow"]:
        kwargs["rate"] = SLOW_RATE
    async with sem:
        last_err = None
        for attempt in range(3):
            try:
                comm = edge_tts.Communicate(text, voice, **kwargs)
                await comm.save(target)
                if os.path.getsize(target) <= 0:
                    raise RuntimeError("empty output")
                # 原子寫 .sha（synth-time 見證）
                with open(shapath, "w", encoding="utf-8") as f:
                    f.write(cur_sha)
                # manifest 於 synth 呼叫點捕捉（text=實際傳給 edge-tts 的字面）
                manifest[key] = {"audioKey": key, "text": text, "accent": accent,
                                 "file": job["file"], "text_sha": cur_sha}
                stats["made"] += 1
                return
            except Exception as e:  # noqa
                last_err = e
                # 刪掉失敗留下的 0-byte / 半寫檔，避免 gate(a) size>0 誤判
                try:
                    if os.path.exists(target):
                        os.remove(target)
                except Exception:
                    pass
                await asyncio.sleep(1.5 * (attempt + 1))
        stats["fail"] += 1
        stats["fail_keys"].append((key, str(last_err)))


async def run():
    items = load_items()
    jobs = build_jobs(items)
    keys = sorted(jobs.keys())
    if LIMIT > 0:
        # 取前 LIMIT 個 base slug（us+gb 成對），以便 smoke test
        def base_of(k):
            return k[:-3] if (k.endswith("_us") or k.endswith("_gb")) else k
        bases = []
        for k in keys:
            b = base_of(k)
            if b not in bases:
                bases.append(b)
            if len(bases) >= LIMIT:
                break
        pick = set(bases[:LIMIT])
        keys = [k for k in keys if base_of(k) in pick]

    manifest = load_manifest()
    stats = {"made": 0, "skip": 0, "fail": 0, "fail_keys": []}
    sem = asyncio.Semaphore(CONC)
    sys.stdout.write("gen_dict_audio: %d audioKeys（%d items 聯集）conc=%d%s\n" % (
        len(keys), len(items), CONC, (" LIMIT=%d" % LIMIT) if LIMIT else ""))
    sys.stdout.flush()

    batch = []
    done = 0
    for k in keys:
        batch.append(synth_one(jobs[k], sem, manifest, stats))
        if len(batch) >= 200:
            await asyncio.gather(*batch)
            batch = []
            done += 200
            # 中途存 manifest（崩潰可續）
            with open(MANIFEST, "w", encoding="utf-8") as f:
                json.dump(manifest, f, ensure_ascii=False, indent=0)
            sys.stdout.write("  …progress made=%d skip=%d fail=%d\n" % (stats["made"], stats["skip"], stats["fail"]))
            sys.stdout.flush()
    if batch:
        await asyncio.gather(*batch)

    with open(MANIFEST, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=0)
        f.write("\n")

    sys.stdout.write("DONE made=%d skip=%d fail=%d manifest=%d entries\n" % (
        stats["made"], stats["skip"], stats["fail"], len(manifest)))
    if stats["fail"]:
        sys.stdout.write("FAILS:\n")
        for k, e in stats["fail_keys"][:30]:
            sys.stdout.write("  %s : %s\n" % (k, e))
        sys.exit(2)


if __name__ == "__main__":
    asyncio.run(run())
