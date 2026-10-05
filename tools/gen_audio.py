#!/usr/bin/env python3
# =====================================================================
# gen_audio.py — 用 edge-tts（兒童嗓音 en-US-AnaNeural）把一份 manifest
# 的英文文字批次產生成 mp3，存進 repo 的 audio/ 目錄。全書英文語音共用
# 同一把嗓音以保持一致（flashcards / speaking / sense / idioms / phonics…）。
#
# 用法：
#   /Volumes/workplace/EnglishTraining/.venv/bin/python tools/gen_audio.py <manifest.json> [--force]
#
# manifest.json 格式（陣列）：
#   [ { "text": "cat", "file": "ph_cat.mp3" },
#     { "text": "the", "file": "ph_the.mp3" }, ... ]
#   - text：要唸的英文（整字／字母名；edge-tts 無法乾淨唸出孤立音素，所以
#           只放整字或字母名，不要放 /b/ 這種孤立音素）。
#   - file：輸出檔名（相對 audio/）。慣例前綴：ph_（phonics）、word_/sent_、
#           sp_、idiom_、sense_。slug = 小寫、[^a-z0-9]+→_、去頭尾 _。
#
# 預設「跳過已存在的檔」（可重跑、冪等）；--force 可覆寫重產。
# 依賴：venv 已裝 edge_tts（勿對系統 python pip install）。
# =====================================================================
import asyncio
import json
import sys
from pathlib import Path

VOICE = "en-US-AnaNeural"  # 全書統一兒童嗓音
REPO = Path(__file__).resolve().parent.parent
AUDIO_DIR = REPO / "audio"


async def _one(communicate_cls, text: str, out: Path) -> None:
    await communicate_cls(text, VOICE).save(str(out))


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv[1:]
    if len(args) != 1:
        print("usage: gen_audio.py <manifest.json> [--force]", file=sys.stderr)
        return 2
    try:
        import edge_tts  # noqa: F401  (venv-only dependency)
    except ImportError:
        print("ERROR: edge_tts not found. Use the repo venv:\n"
              "  /Volumes/workplace/EnglishTraining/.venv/bin/python tools/gen_audio.py ...",
              file=sys.stderr)
        return 2
    from edge_tts import Communicate

    manifest = json.loads(Path(args[0]).read_text(encoding="utf-8"))
    AUDIO_DIR.mkdir(exist_ok=True)

    made, skipped, failed = 0, 0, 0
    for i, item in enumerate(manifest):
        text, fname = item["text"], item["file"]
        out = AUDIO_DIR / fname
        if out.exists() and not force:
            skipped += 1
            continue
        try:
            asyncio.run(_one(Communicate, text, out))
            made += 1
            print(f"[{i+1}/{len(manifest)}] {fname}  <- {text!r}")
        except Exception as e:  # noqa: BLE001
            failed += 1
            print(f"FAILED {fname} <- {text!r}: {e}", file=sys.stderr)
    print(f"\ndone: made={made} skipped(exists)={skipped} failed={failed} "
          f"voice={VOICE} dir={AUDIO_DIR}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
