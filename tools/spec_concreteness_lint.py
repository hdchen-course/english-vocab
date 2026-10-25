#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
spec_concreteness_lint.py — LEARNING_PATH_REBUILD_SPEC.md §0.3 anti-vagueness gate。
每個「規範性」標題段(## / ###)的內文必須同時含「細則」「範例」且至少一個「❌」(反例)。
描述性/索引/已關閉的段落列入 EXEMPT 白名單(文件控制/目的/讀者畫像/現況盤點/開放問題/ledger…)。
用法：python3 tools/spec_concreteness_lint.py [spec.md]
退出碼＝不合規的規範段數(0＝乾淨)。
"""
import re
import sys
from pathlib import Path

SPEC = Path(sys.argv[1]) if len(sys.argv) > 1 else \
    Path(__file__).resolve().parent.parent / "LEARNING_PATH_REBUILD_SPEC.md"

# 免檢章(描述性/索引/事實/已關閉)——以「精確章號」比對，不用 startswith(避免 `## 1` 吞 §10/§11/§12)。
# 章號取自 "## <num>"，num 形如 0,1,2,...,11,11.A。免檢集合：
EXEMPT_CHAPTERS = {"0", "1", "3", "4", "5", "13", "14"}
# 需具體化(細則+範例+❌)的章：2,6,7,8,9,10,11,11.A,12（即非免檢的規範章）。
_CH_RE = re.compile(r"^##\s+([0-9]+(?:\.[A-Za-z0-9]+)?)")


def is_exempt(title: str) -> bool:
    m = _CH_RE.match(title.strip())
    if not m:
        return True  # 無法辨識章號(異常標題)→不強制
    return m.group(1) in EXEMPT_CHAPTERS


def main():
    text = SPEC.read_text(encoding="utf-8")
    lines = text.splitlines()
    # 章(##)級聚合：一個 ## 到下一個 ## 之間(含其所有 ### 子節)為一章。
    # 規範章整段內必須含 細則＋範例＋❌(可落在任一子節，如 §9.5/§10.1)。
    chapters = []
    cur_title, cur_body, cur_line = None, [], 0
    for i, ln in enumerate(lines, 1):
        if re.match(r"^##\s+\S", ln):  # 只在 ## 切章(### 併入所屬章)
            if cur_title is not None:
                chapters.append((cur_title, cur_line, "\n".join(cur_body)))
            cur_title, cur_body, cur_line = ln, [], i
        else:
            if cur_title is not None:
                cur_body.append(ln)
    if cur_title is not None:
        chapters.append((cur_title, cur_line, "\n".join(cur_body)))

    bad = []
    checked = 0
    for title, ln, body in chapters:
        if is_exempt(title):
            continue
        checked += 1
        has_detail = "細則" in body
        has_example = "範例" in body
        has_counter = "❌" in body
        if not (has_detail and has_example and has_counter):
            miss = []
            if not has_detail: miss.append("細則")
            if not has_example: miss.append("範例")
            if not has_counter: miss.append("❌反例")
            bad.append((ln, title.strip(), "、".join(miss)))

    print(f"=== spec_concreteness_lint（章級）：檢查 {checked} 個規範章 ===")
    if bad:
        print(f"!! 不合規 {len(bad)} 段（缺細則/範例/反例）：")
        for ln, title, miss in bad:
            print(f"  L{ln}  {title}  → 缺：{miss}")
    else:
        print("全部規範段皆含 細則＋範例＋❌反例 ✅")
    print(f"exit={len(bad)}")
    sys.exit(len(bad))


if __name__ == "__main__":
    main()
