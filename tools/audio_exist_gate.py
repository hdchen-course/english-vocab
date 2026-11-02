#!/usr/bin/env python3
"""Audio existence/playability gate — fail-closed（DICTATION/LEARNING_PATH 鐵律：每個音檔必須真實存在且可播）。

英語島每個單元引用的音檔（teach[].audio / practice[].audio / shadowing.lines[].audio）
都必須在 audio/<ref>.mp3 真實存在、非截斷、且是合法 mp3（ID3 或 MPEG frame sync）。
play() 以 `audio/<ref>.mp3` 載入（assets/unit.js），故此 gate 直掃該路徑。

用法：
  python3 -I tools/audio_exist_gate.py --verify      # exit=問題數
  python3 -I tools/audio_exist_gate.py --selftest    # 紅隊：missing/empty/bad-header 必被抓
退出碼：0=clean、1..=問題數、99=fail-closed（掃不到單元檔）。
"""
import glob
import json
import os
import sys

MIN_BYTES = 1500  # edge-tts 童聲最短句 ~11KB；<1500B 視為截斷/占位


def valid_mp3_header(path):
    with open(path, "rb") as fh:
        h = fh.read(3)
    if h[:3] == b"ID3":
        return True
    return len(h) >= 2 and h[0] == 0xFF and (h[1] & 0xE0) == 0xE0


def collect_refs(root):
    refs = set()
    for f in glob.glob(os.path.join(root, "english_*.units.json")):
        with open(f, encoding="utf-8") as fh:
            d = json.load(fh)
        for u in d.get("units", []):
            for t in u.get("teach", []):
                if t.get("audio"):
                    refs.add(t["audio"])
            for p in u.get("practice", []):
                if p.get("audio"):
                    refs.add(p["audio"])
            for l in (u.get("shadowing", {}) or {}).get("lines", []) or []:
                if l.get("audio"):
                    refs.add(l["audio"])
    return refs


def run(root):
    units = glob.glob(os.path.join(root, "english_*.units.json"))
    if not units:
        return None, ["找不到 english_*.units.json"]
    refs = collect_refs(root)
    adir = os.path.join(root, "audio")
    bad = []
    for ref in sorted(refs):
        p = os.path.join(adir, ref + ".mp3")
        if not os.path.exists(p):
            bad.append(f"[missing] {ref}.mp3")
            continue
        sz = os.path.getsize(p)
        if sz < MIN_BYTES:
            bad.append(f"[truncated] {ref}.mp3 ({sz}B < {MIN_BYTES})")
            continue
        if not valid_mp3_header(p):
            bad.append(f"[bad-header] {ref}.mp3")
    return len(refs), bad


def selftest():
    import tempfile
    ok = True
    with tempfile.TemporaryDirectory() as d:
        os.makedirs(os.path.join(d, "audio"))
        unit = {"units": [{"unit_id": "x",
                           "teach": [{"kind": "example", "audio": "good"},
                                     {"kind": "example", "audio": "gone"},
                                     {"kind": "example", "audio": "tiny"},
                                     {"kind": "example", "audio": "junk"}]}]}
        open(os.path.join(d, "english_x.units.json"), "w", encoding="utf-8").write(
            json.dumps(unit))
        # good: valid header + big enough
        open(os.path.join(d, "audio", "good.mp3"), "wb").write(b"ID3" + b"\x00" * 2000)
        # tiny: valid header but truncated
        open(os.path.join(d, "audio", "tiny.mp3"), "wb").write(b"ID3" + b"\x00" * 10)
        # junk: wrong header
        open(os.path.join(d, "audio", "junk.mp3"), "wb").write(b"NOPE" + b"\x00" * 2000)
        # gone: not created
        n, bad = run(d)
        kinds = " ".join(bad)
        for need in ("missing] gone", "truncated] tiny", "bad-header] junk"):
            if need not in kinds:
                print("SELFTEST FAIL: not caught ->", need); ok = False
        if any("good.mp3" in b for b in bad):
            print("SELFTEST FAIL: good flagged"); ok = False
    print("SELFTEST PASS ✅" if ok else "SELFTEST FAILED ❌")
    return 0 if ok else 1


def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    n, bad = run(root)
    if n is None:
        print("[audio_exist_gate] fail-closed:", bad)
        sys.exit(99)
    if bad:
        print(f"[audio_exist_gate] {len(bad)} 問題／{n} refs：")
        for b in bad[:60]:
            print("  " + b)
        sys.exit(min(len(bad), 98))
    print(f"[audio_exist_gate] CLEAN（{n} 音檔 refs 全存在、非截斷、合法 mp3）")
    sys.exit(0)


if __name__ == "__main__":
    main()
