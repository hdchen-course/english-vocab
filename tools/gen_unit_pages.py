#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""gen_unit_pages.py — 為 units_index 參照但磁碟上缺的單元頁，確定性產生 HTML 殼。

為什麼：先補齊階段建了 KP 內容（*.units.json），但部分單元的「渲染頁」（HTML 殼）未建，
units_index 的 `page` 欄指向不存在的檔 → 不可達/不可渲染/不可 audit（per_page_5clean_gate 報缺）。
本頁殼不含教學內容（內容在已 gate 的 sidecar，由 assets/unit.js 讀 <body data-units> fetch 注入），
故此為**模板實例化**非內容撰寫：逐缺頁依既有 english_*.units 頁範本（如 english_asas.html）產生。

規則：
  - 只建**缺的**頁（已存在不覆蓋，idempotent）。
  - page `english_<slug>.html` ↔ sidecar `english_<slug>.units.json`（檔名對應；sidecar 不存在則跳過報錯）。
  - <title>／app-bar 標題取 sidecar 首單元 title_zh，去尾全形括號群以符簡潔房規；加 strand emoji。
  - script 順序與版本與範本一致：game_core → safe_store → progkey_migration.data → learning_progress → unit.js。

用法：
  gen_unit_pages.py            # 建所有缺頁
  gen_unit_pages.py --verify   # 驗證 units_index 每個 page 都存在於磁碟（exit!=0=仍有缺）
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UNITS_INDEX = os.path.join(ROOT, "data", "units_index.json")
ASSET_VER = "20261102e"

STRAND_EMOJI = {
    "phonics": "🔤", "listening": "👂", "reading": "📖", "writing": "✍️",
    "vocab": "📚", "noun": "🔖", "pron": "👥", "verb": "🏃", "adjadv": "🎨",
    "prep": "📍", "conj": "🔗", "article": "🅰️", "modal": "💭", "voice": "🔄",
    "relcl": "🔀", "nouncl": "🧩", "advcl": "⏳", "nonfinite": "➡️",
    "subj": "🌙", "special": "✨", "pattern": "🧱", "morph": "🧬",
}

TEMPLATE = """<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<link rel="stylesheet" href="assets/app.css">
<link rel="stylesheet" href="assets/unit.css?v={ver}">
<script src="game_core.js"></script>
</head>
<body data-game-hud="off" data-units="{sidecar}">
<header class="app-bar">
  <a class="app-bar__home" href="index_new.html" aria-label="回到學習地圖">
    <span class="app-bar__home-icon" aria-hidden="true">🏠</span><span class="app-bar__home-label">學習地圖</span>
  </a>
  <span class="app-bar__title">{bar_title}</span>
  <button type="button" class="app-bar__theme" data-theme-toggle aria-label="切換日間／夜間模式" aria-pressed="false" title="切換日間／夜間模式">
    <span class="app-bar__theme-icon" aria-hidden="true">🌙</span>
  </button>
</header>
<main class="gr-wrap"><div id="root"><p id="loading">載入中…</p></div></main>
<script src="assets/safe_store.js"></script>
<script src="assets/progkey_migration.data.js"></script>
<script src="assets/learning_progress.js"></script>
<script src="assets/unit.js?v={ver}"></script>
</body>
</html>
"""


def short_title(t):
    """去尾全形括號群（如「with 獨立結構（...）」→「with 獨立結構」）；無則原樣。"""
    return re.sub(r"（[^（）]*）\s*$", "", (t or "").strip()).strip() or (t or "").strip()


def _page_titles():
    """回傳 {page: (title_zh, strand)}，取該頁第一個單元。"""
    us = json.load(open(UNITS_INDEX, encoding="utf-8"))["units"]
    out = {}
    for u in us:
        pg = u.get("page")
        if pg and pg not in out:
            strand = u["unit_id"].split(".")[2] if u["unit_id"].startswith("eng") and len(u["unit_id"].split(".")) >= 3 else ""
            out[pg] = (u.get("title_zh", ""), strand)
    return out


def main():
    titles = _page_titles()
    if "--verify" in sys.argv:
        missing = [pg for pg in titles if not os.path.exists(os.path.join(ROOT, pg))]
        if missing:
            print(f"[gen_unit_pages] FAIL：{len(missing)} 個 units_index page 仍缺（樣本 {missing[:8]}）")
            sys.exit(min(len(missing), 255))
        print(f"[gen_unit_pages] CLEAN：units_index 全部 {len(titles)} 頁皆存在於磁碟")
        sys.exit(0)

    created = skipped = noSide = 0
    for pg, (title, strand) in titles.items():
        path = os.path.join(ROOT, pg)
        if os.path.exists(path):
            skipped += 1
            continue
        sidecar = pg[:-5] + ".units.json"
        if not os.path.exists(os.path.join(ROOT, sidecar)):
            print(f"  ⚠ 跳過 {pg}：對應 sidecar {sidecar} 不存在")
            noSide += 1
            continue
        st = short_title(title)
        emoji = STRAND_EMOJI.get(strand, "")
        bar = (st + " " + emoji).strip() if emoji else st
        html = TEMPLATE.format(title=st, bar_title=bar, sidecar=sidecar, ver=ASSET_VER)
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        created += 1
    print(f"[gen_unit_pages] 建立 {created} 頁 | 已存在略過 {skipped} | 缺 sidecar 跳過 {noSide}")


if __name__ == "__main__":
    main()
