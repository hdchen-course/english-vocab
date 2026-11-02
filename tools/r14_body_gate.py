#!/usr/bin/env python3
"""R14 body gate — fail-closed（§6.2.2 zh_hint／R14 英文為教學媒介）。

鐵律：英語島每個單元 teach 段的 `body` 必須是英文教學媒介（零 CJK / 零全形），
中文一律放 `zh_hint`（預設收合）。本 gate 以確定性掃描強制：
  (1) 任一 teach body 含 CJK／全形字元  → FAIL
  (2) 任一 teach 段（text 或 example）缺 zh_hint → FAIL
  (3) zh_hint 若含簡體碼點 → 交給 scan_simplified（此 gate 不重複，但空 zh_hint 視為缺）

用法：
  python3 -I tools/r14_body_gate.py --verify           # 掃 english_*.units.json，exit=違規數
  python3 -I tools/r14_body_gate.py --selftest         # 紅隊：壞案例必 FAIL、好案例必 PASS
退出碼：0=clean、1..=違規數、99=fail-closed（掃不到檔/解析錯）。
"""
import glob
import json
import os
import re
import sys

# CJK 統一表意文字 + 全形標點/空格 + 全形 ASCII 變體（U+3000 ideographic space、U+FF00–FFEF fullwidth）
CJK = re.compile(r"[　-〿㐀-䶿一-鿿＀-￯豈-﫿]")


def scan_text(body: str):
    """回傳 body 中命中的 CJK/全形字元（去重，保序）。"""
    hits = []
    seen = set()
    for ch in body or "":
        if CJK.match(ch) and ch not in seen:
            seen.add(ch)
            hits.append(ch)
    return hits


def run(root):
    violations = []
    files = sorted(glob.glob(os.path.join(root, "english_*.units.json")))
    if not files:
        return None, []  # fail-closed 由呼叫端處理
    for f in files:
        base = os.path.basename(f)
        try:
            with open(f, encoding="utf-8") as fh:
                data = json.load(fh)
        except (OSError, json.JSONDecodeError) as e:
            return None, [f"[parse] {base}: {e}"]
        for u in data.get("units", []):
            uid = u.get("unit_id", "?")
            for i, t in enumerate(u.get("teach", [])):
                kind = t.get("kind")
                if kind not in ("text", "example"):
                    continue
                loc = f"{base}[{uid}] teach#{i}({kind})"
                hits = scan_text(t.get("body", ""))
                if hits:
                    violations.append(f"[body-cjk] {loc}: body 含 CJK/全形 {hits[:6]}")
                zh = t.get("zh_hint")
                if zh is None:
                    violations.append(f"[no-zh_hint] {loc}: 缺 zh_hint（中文對照）")
                elif not isinstance(zh, str) or not zh.strip():
                    violations.append(f"[empty-zh_hint] {loc}: zh_hint 空")
    return len(files), violations


def selftest():
    import tempfile
    ok = True
    with tempfile.TemporaryDirectory() as d:
        # 好案例
        good = {"units": [{"unit_id": "x", "teach": [
            {"kind": "text", "body": "This is English only.", "zh_hint": "這是中文對照。"},
            {"kind": "example", "body": "I like apples.", "zh_hint": "我喜歡蘋果。"}]}]}
        open(os.path.join(d, "english_good.units.json"), "w", encoding="utf-8").write(
            json.dumps(good, ensure_ascii=False))
        n, v = run(d)
        if v:
            print("SELFTEST FAIL: good case flagged:", v); ok = False
        # 壞案例 A：body 含中文
        bad1 = {"units": [{"unit_id": "y", "teach": [
            {"kind": "text", "body": "這是中文 body.", "zh_hint": "對照"}]}]}
        open(os.path.join(d, "english_bad1.units.json"), "w", encoding="utf-8").write(
            json.dumps(bad1, ensure_ascii=False))
        # 壞案例 B：缺 zh_hint
        bad2 = {"units": [{"unit_id": "z", "teach": [
            {"kind": "text", "body": "English body no gloss."}]}]}
        open(os.path.join(d, "english_bad2.units.json"), "w", encoding="utf-8").write(
            json.dumps(bad2, ensure_ascii=False))
        n, v = run(d)
        has_cjk = any("body-cjk" in x for x in v)
        has_noz = any("no-zh_hint" in x for x in v)
        if not has_cjk:
            print("SELFTEST FAIL: bad1 (CJK body) not caught"); ok = False
        if not has_noz:
            print("SELFTEST FAIL: bad2 (missing zh_hint) not caught"); ok = False
    print("SELFTEST PASS ✅" if ok else "SELFTEST FAILED ❌")
    return 0 if ok else 1


def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    if "--selftest" in sys.argv:
        sys.exit(selftest())
    n, v = run(root)
    if n is None:
        print("[r14_body_gate] fail-closed:", v or "找不到 english_*.units.json")
        sys.exit(99)
    if v:
        print(f"[r14_body_gate] {len(v)} 違規／掃 {n} 檔：")
        for x in v[:50]:
            print("  " + x)
        sys.exit(min(len(v), 98))
    print(f"[r14_body_gate] CLEAN（{n} 檔，所有 teach body 零 CJK、皆有 zh_hint）")
    sys.exit(0)


if __name__ == "__main__":
    main()
