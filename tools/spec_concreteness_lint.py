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

# 標題開頭數字/代號 → 是否免檢(描述性、索引、事實、已關閉)。比對用標題「前綴」。
EXEMPT_PREFIXES = (
    "## 0", "### 0.1", "### 0.2",        # 文件控制/待回填/防漂移錨點(本身是說明)
    "## 1",                               # 目的與範圍
    "## 3",                               # 讀者畫像(描述性；INV 由 §9 驗)
    "### 3.1", "### 3.2", "### 3.3",
    "## 5", "### 5.1", "### 5.2", "### 5.3", "### 5.4", "### 5.5",  # 現況盤點(事實)
    "### 4.x",                            # 應考能力清單(清單型)
    "## 13",                              # ledger(表格)
    "## 14",                              # 開放問題(已全關閉)
    "## 4.",                              # §4 摘要(明細在附錄A/§4.1)
)
# 規範段關鍵前綴：必須具體化(細則+範例+❌)
def is_exempt(title: str) -> bool:
    t = title.strip()
    return any(t.startswith(p) for p in EXEMPT_PREFIXES)


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
