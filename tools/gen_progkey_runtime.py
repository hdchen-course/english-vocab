#!/usr/bin/env python3
"""gen_progkey_runtime.py — 從 authoring/progkey_migration.json（單一事實來源）
生成執行期資料檔 assets/progkey_migration.data.js（設 window.PROGKEY_MIGRATION）。

只取 entries（已對映 old→new），每筆保留瀏覽器遷移所需最小欄位
{old_progKey, lesson_id, new_unit_id}。unmapped 不輸出（無對映目標）。
衍生檔，勿手改；改來源 authoring/progkey_migration.json 再重跑本工具。

用法：
  gen_progkey_runtime.py            # 產生 assets/progkey_migration.data.js
  gen_progkey_runtime.py --verify   # 驗證既有 data.js 與來源一致（entries 數/欄位），exit!=0 即 FAIL
"""
import json, os, sys, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "authoring", "progkey_migration.json")
OUT = os.path.join(ROOT, "assets", "progkey_migration.data.js")


def _entries():
    m = json.load(open(SRC, encoding="utf-8"))
    out = []
    for e in m.get("entries", []):
        if e.get("old_progKey") and e.get("lesson_id") and e.get("new_unit_id"):
            out.append({"old_progKey": e["old_progKey"], "lesson_id": e["lesson_id"],
                        "new_unit_id": e["new_unit_id"]})
    return out


def _render(entries):
    body = json.dumps(entries, ensure_ascii=False, indent=2)
    return (
        "/* 衍生檔，勿手改。由 tools/gen_progkey_runtime.py 從 authoring/progkey_migration.json 生成。\n"
        "   舊 concept_engine progKey/lesson → 新 unit_id 對照；供 assets/learning_progress.js additive 遷移。 */\n"
        "window.PROGKEY_MIGRATION = " + body + ";\n"
    )


def main():
    entries = _entries()
    if "--verify" in sys.argv:
        if not os.path.exists(OUT):
            print(f"[gen_progkey_runtime] FAIL：{OUT} 不存在"); sys.exit(2)
        txt = open(OUT, encoding="utf-8").read()
        m = re.search(r"window\.PROGKEY_MIGRATION\s*=\s*(\[.*\]);", txt, re.S)
        if not m:
            print("[gen_progkey_runtime] FAIL：找不到 window.PROGKEY_MIGRATION 陣列"); sys.exit(1)
        got = json.loads(m.group(1))
        if got != entries:
            print(f"[gen_progkey_runtime] FAIL：data.js 與來源不一致（data={len(got)} 源={len(entries)}）— 請重跑產生"); sys.exit(1)
        print(f"[gen_progkey_runtime] CLEAN：{len(entries)} entries 與來源一致"); sys.exit(0)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(_render(entries))
    print(f"[gen_progkey_runtime] 寫出 {OUT}：{len(entries)} entries")


if __name__ == "__main__":
    main()
