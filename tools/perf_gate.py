#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""perf_gate.py — AC-PERF 的靜態效能預算 fail-closed gate（§11.A ＋ web-performance 鐵律）。

守 learner-facing 頁不臃腫、首屏輕量（ND）：
  (1) hub HTML 檔 <= PERF_MAX_HTML_KB（預設 80；骨架頁應遠小於此）。
  (2) 不引重前端框架（react/vue/angular/jquery/bootstrap bundle 的 <script src>）——房屋以 vanilla 為主。
  (3) 不 inline 大資料：任一 inline <script> 區塊 <= PERF_MAX_INLINE_KB（預設 40）；且頁內不得 inline 整包知識點
      （偵測 `"id":` 出現次數 > PERF_MAX_INLINE_IDS（預設 60）＝疑似把 manifest/題庫烤進頁面）。
  (4) 首屏資料輕量：hub 必須 fetch 輕量 `nav_index.json`、**不得**首屏 fetch 重檔 `knowledge_points.json`（ND：~3096 筆不可一次載）。
  (5) nav_index.json（首屏 payload）<= PERF_MAX_NAV_KB（預設 300）。

介面：--selftest；--verify。EXIT：0=過；1=超預算/違規；2=selftest 失敗。
"""
import argparse, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HUB = os.path.join(ROOT, "index_new.html")
NAV = os.path.join(ROOT, "authoring", "nav_index.json")
MAX_HTML_KB = int(os.environ.get("PERF_MAX_HTML_KB", "80"))
MAX_INLINE_KB = int(os.environ.get("PERF_MAX_INLINE_KB", "40"))
MAX_INLINE_IDS = int(os.environ.get("PERF_MAX_INLINE_IDS", "60"))
MAX_NAV_KB = int(os.environ.get("PERF_MAX_NAV_KB", "300"))
HEAVY = re.compile(r"<script[^>]+src=[\"'][^\"']*(react|vue|angular|jquery|bootstrap(\.bundle)?)[^\"']*\.js", re.I)
INLINE_SCRIPT = re.compile(r"<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>", re.S | re.I)


def check_html(html, nav_kb=None):
    probs = []
    kb = len(html.encode("utf-8")) / 1024
    if kb > MAX_HTML_KB:
        probs.append(f"HTML {kb:.1f}KB > 預算 {MAX_HTML_KB}KB")
    if HEAVY.search(html):
        probs.append("引入重前端框架（react/vue/angular/jquery/bootstrap）——房屋應 vanilla")
    for m in INLINE_SCRIPT.finditer(html):
        blk = m.group(1)
        bkb = len(blk.encode("utf-8")) / 1024
        if bkb > MAX_INLINE_KB:
            probs.append(f"inline <script> 區塊 {bkb:.1f}KB > {MAX_INLINE_KB}KB（疑似 inline 大資料）")
    nid = len(re.findall(r'"id"\s*:', html))
    if nid > MAX_INLINE_IDS:
        probs.append(f"頁內 `\"id\":` 出現 {nid} 次 > {MAX_INLINE_IDS}（疑似把 manifest/題庫 inline 進頁面）")
    # 只抓「實際載入」重檔（fetch()/<script|link src>），不誤判頁尾來源說明等純文字提及
    if re.search(r"""(?:fetch\s*\(|\bsrc\s*=|import\s+[^;]*from\s+)['"][^'"]*knowledge_points\.json""", html):
        probs.append("首屏載入重檔 knowledge_points.json（違 ND：~3096 筆不可一次載；應讀輕量 nav_index.json）")
    if not re.search(r"""fetch\s*\(\s*['"][^'"]*nav_index\.json""", html):
        probs.append("未見 fetch 輕量 nav_index.json（hub 首屏資料來源）")
    if nav_kb is not None and nav_kb > MAX_NAV_KB:
        probs.append(f"nav_index.json {nav_kb:.1f}KB > 首屏預算 {MAX_NAV_KB}KB")
    return probs


def _selftest():
    good = ('<html><head><script src="game_core.js"></script></head><body>'
            '<script>fetch("authoring/nav_index.json").then(r=>r.json())</script></body></html>')
    heavy = good.replace('<script src="game_core.js"></script>', '<script src="https://cdn/react.production.min.js"></script>')
    inlinebig = good.replace('</body>', '<script>var X="' + ("x" * (MAX_INLINE_KB * 1024 + 10)) + '";</script></body>')
    manifestinline = good.replace('</body>', '<script>var D=[' + ",".join(['{"id":%d}' % i for i in range(MAX_INLINE_IDS + 5)]) + '];</script></body>')
    heavyfetch = good.replace('authoring/nav_index.json', 'authoring/knowledge_points.json')
    results = [
        ("好例（vanilla＋fetch nav_index）→ ALLOW", check_html(good, 50) == []),
        ("引 react → DENY", any("重前端框架" in p for p in check_html(heavy, 50))),
        ("inline 大區塊 → DENY", any("inline <script>" in p for p in check_html(inlinebig, 50))),
        ("inline 整包 id → DENY", any("manifest/題庫 inline" in p for p in check_html(manifestinline, 50))),
        ("首屏抓 knowledge_points.json → DENY", any("ND" in p for p in check_html(heavyfetch, 50))),
        ("nav_index 超預算 → DENY", any("首屏預算" in p for p in check_html(good, MAX_NAV_KB + 1))),
    ]
    allok = True
    for msg, ok in results:
        print(f"  [{'OK' if ok else 'BAD'}] {msg}"); allok = allok and ok
    return allok


def main():
    ap = argparse.ArgumentParser(description="AC-PERF 靜態效能預算 gate（fail-closed）")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--verify", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        print("=== perf_gate --selftest ==="); ok = _selftest()
        print("RESULT:", "PASS ✅" if ok else "FAIL ❌"); sys.exit(0 if ok else 2)
    if args.verify:
        html = open(HUB, encoding="utf-8").read()
        nav_kb = os.path.getsize(NAV) / 1024 if os.path.exists(NAV) else None
        probs = check_html(html, nav_kb)
        for p in probs:
            print(f"  [perf] {p}")
        hub_kb = len(html.encode("utf-8")) / 1024
        print(f"RESULT(AC-PERF): {'PASS ✅' if not probs else 'FAIL ❌'}"
              f"（hub {hub_kb:.1f}KB，nav_index {nav_kb:.1f}KB，違規 {len(probs)}）")
        sys.exit(0 if not probs else 1)
    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    main()
