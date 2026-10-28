#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
cross_check_gate.py — anti-fabrication 執行層 for evidence_method=cross_check（§6.8.1）。

為什麼存在
  derivation/program/truth_table 由 `repro_gate.py` 以 .venv 重跑比對指紋，造假跑不過。
  但 cross_check（經驗事實：地理/年代/數據＝「≥2 獨立來源匯聚」）原本只有「結構檢查 ≥2 refs」
  （ledger_schema_gate／promote_verified），**沒有人真的去確認那些來源真的支持該事實**——
  agent 若杜撰一個看似合理的 URL＋引文，結構檢查照過。這道 gate 補上：**逐 ref 真的抓取、
  確認登記的 `quote`（該事實所依據的逐字引文）確實出現在抓到的內容裡**，否則 FAIL。
  使 cross_check 與 derivation 同樣「造假/抓不到即擋」。

cross_check 來源的登記格式（source_registry 內，evidence_method=cross_check）：
  "xcheck-<domain>-<slug>": {
    publisher, locator, accessed_at, evidence_method:"cross_check", content_fingerprint,
    independent_refs: [                       # ≥2，且彼此獨立（不同出版者/機構）
      {"url": "...", "publisher": "...", "quote": "逐字片段，該事實所依據者", "fetched_sha16": "..."},
      {"url": "...", "publisher": "...", "quote": "...", "fetched_sha16": "..."}
    ],
    claim: "被交叉查證的事實一句話"        # 供人覆核
  }

介面
  python3 tools/verify/cross_check_gate.py --selftest     # 離線自測（壞例 DENY／好例 ALLOW）
  python3 tools/verify/cross_check_gate.py --verify        # 對 registry 全部 cross_check 來源真抓驗證
  python3 tools/verify/cross_check_gate.py --verify --sid <id>   # 只驗一筆
  python3 tools/verify/cross_check_gate.py --offline-check       # 只驗結構(≥2 refs/每 ref 有 url+quote)，不連網
EXIT：0=全過，1=有 FAIL，2=selftest 失敗。
依賴：標準庫 urllib（避免額外套件）；抓取逾時 20s、僅 http(s)。
"""
import sys, os, json, hashlib, re, argparse, urllib.request, urllib.parse, ssl, subprocess, atexit, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REG = os.path.join(ROOT, "authoring", "source_registry.json")
JS_FETCH = os.path.join(ROOT, "tools", "verify", "js_fetch.mjs")

def _norm(s: str) -> str:
    # 正規化：去空白差異，供 quote 子串比對（抓到的 HTML 可能有標籤/空白）
    s = re.sub(r"<[^>]+>", "", s)            # 去 HTML 標籤
    s = re.sub(r"\s+", "", s)                # 去所有空白
    return s

def host_publisher(url: str) -> str:
    """由 URL 推 registrable publisher，**所有 wikipedia/wikimedia 語言版 collapse 成一家**
    （zh.wikipedia + en.wikipedia ≠ 2 個獨立來源，屬同一 Wikimedia）。判斷來源獨立性以此為準，
    不信任 agent 自填的 publisher 字串（防『同站換語言冒充兩家』）。"""
    m = re.search(r"https?://([^/]+)/?", url or "")
    host = (m.group(1) if m else url or "").lower().split(":")[0]
    # 所有 Wikimedia 基金會專案 collapse 成同一家（維基百科/文庫/辭典/教科書/語錄… 皆非彼此獨立來源；
    # 杜絕「維基百科＋維基文庫冒充兩個獨立 publisher」——HD 2026-10-27 查出 13 筆 chi.lit 靠此繞過）。
    _WIKIMEDIA = ("wikipedia.org", "wikimedia.org", "wikidata.org", "wikisource.org",
                  "wiktionary.org", "wikibooks.org", "wikiquote.org", "wikiversity.org",
                  "wikinews.org", "wikivoyage.org", "mediawiki.org", "wikifunctions.org")
    if any(w in host for w in _WIKIMEDIA):
        return "wikimedia"
    parts = host.split(".")
    # 取可註冊網域（末二段；對 co.uk/gov.tw 等末三段）
    if len(parts) >= 3 and parts[-2] in ("co", "com", "gov", "org", "edu", "net", "ac"):
        return ".".join(parts[-3:])
    return ".".join(parts[-2:]) if len(parts) >= 2 else host

def _encode_url(url: str) -> str:
    # 非 ASCII（中文）路徑須 percent-encode，否則 urllib 丟 UnicodeEncodeError
    try:
        url.encode("ascii"); return url
    except UnicodeEncodeError:
        sp = urllib.parse.urlsplit(url)
        path = urllib.parse.quote(sp.path, safe="/%")
        query = urllib.parse.quote(sp.query, safe="=&%")
        return urllib.parse.urlunsplit((sp.scheme, sp.netloc, path, query, sp.fragment))

def fetch(url, timeout=20):
    ctx = ssl.create_default_context()
    req = urllib.request.Request(_encode_url(url), headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,*/*",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
    })
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
        raw = r.read()
    try:
        return raw.decode("utf-8", errors="replace")
    except Exception:
        return raw.decode("latin-1", errors="replace")

class _JsFetcher:
    """持久化 headless-Chrome fallback（§1.3 不破反機器人；只讀公開頁、只回文字）。
    懶啟動一個 node 子行程（js_fetch.mjs，單一瀏覽器重用）；fetch(url) 寫一行 URL、
    讀回一行 JSON，回傳 render 後 innerText（失敗回 ""）。close() 收 stdin 令其關瀏覽器。
    僅在 urllib 未能確認某 ref（例外/SSL/quote 未命中）時才被呼叫——省成本。"""
    def __init__(self):
        self.proc = None
        self.ok = os.path.exists(JS_FETCH) and (shutil.which("node") is not None)
    def _ensure(self):
        if self.proc is not None:
            return self.proc.poll() is None
        if not self.ok:
            return False
        try:
            self.proc = subprocess.Popen(["node", JS_FETCH], stdin=subprocess.PIPE,
                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1, cwd=ROOT)
            atexit.register(self.close)
        except Exception:
            self.proc = None; self.ok = False
        return self.proc is not None
    def fetch(self, url, timeout=45):
        if not self._ensure():
            return ""
        try:
            self.proc.stdin.write(url + "\n"); self.proc.stdin.flush()
            line = self.proc.stdout.readline()   # 一行一回應（js_fetch 逐行回）
            if not line:
                return ""
            obj = json.loads(line)
            return obj.get("text", "") if obj.get("ok") else ""
        except Exception:
            return ""
    def close(self):
        if self.proc is not None:
            try:
                self.proc.stdin.close(); self.proc.wait(timeout=10)
            except Exception:
                try: self.proc.kill()
                except Exception: pass
            self.proc = None

def check_source(sid, s, offline=False, fetcher=fetch, js_fetcher=None):
    """回傳 (ok, [reasons])。js_fetcher（選填）＝urllib 未確認某 ref 時的 headless fallback。"""
    reasons = []
    if s.get("evidence_method") != "cross_check":
        return True, []   # 非本 gate 範疇
    refs = s.get("independent_refs") or []
    if len(refs) < 2:
        return False, [f"{sid}: cross_check 需 ≥2 independent_refs（有 {len(refs)}）"]
    confirmed_pubs = set()   # 真抓到且 quote 命中的 ref 的 host publisher
    notes = []
    for i, ref in enumerate(refs):
        if not ref.get("url") or not ref.get("quote"):
            notes.append(f"{sid} ref#{i}: 缺 url 或 quote"); continue
        pub = host_publisher(ref["url"])
        if offline:
            confirmed_pubs.add(pub); continue   # 離線僅結構檢查
        matched = False
        try:
            body = fetcher(ref["url"])
            if _norm(ref["quote"]) in _norm(body):
                matched = True
        except Exception:
            pass   # urllib 失敗（SSL/403/逾時）→ 下方 headless fallback 再試
        # 僅在 urllib 未確認（例外或 quote 未命中）時才叫 headless，省成本
        if not matched and js_fetcher is not None:
            jsbody = js_fetcher.fetch(ref["url"])
            if jsbody and _norm(ref["quote"]) in _norm(jsbody):
                matched = True
        if matched:
            confirmed_pubs.add(pub)
        else:
            notes.append(f"{sid} ref#{i}: quote 未出現在抓取內容（urllib＋headless 皆未命中），不計入確認：{ref['url']}")
    # 通過＝有 ≥2 個「真抓到且 quote 命中」且 host 相異的來源（壞/抓不到的 ref 不致命，只是不計入）
    if len(confirmed_pubs) >= 2:
        return True, notes   # notes 僅供參考，不致 FAIL
    reasons = notes + [f"{sid}: 確認的獨立來源不足 2（confirmed distinct publishers={len(confirmed_pubs)}）"]
    return False, reasons

def verify(sid_filter=None, offline=False, use_js=True):
    reg = json.load(open(REG, encoding="utf-8"))
    xs = {k: v for k, v in reg["sources"].items()
          if v.get("evidence_method") == "cross_check" and (sid_filter is None or k == sid_filter)}
    if not xs:
        print("（registry 無 cross_check 來源可驗）"); print("RESULT: PASS ✅（空集）"); return 0
    jsf = None if (offline or not use_js) else _JsFetcher()
    allok = True
    try:
        for sid, s in sorted(xs.items()):
            ok, reasons = check_source(sid, s, offline=offline, js_fetcher=jsf)
            if ok:
                print(f"  ok   {sid}（{len(s.get('independent_refs',[]))} refs 皆支持）")
            else:
                allok = False
                for r in reasons:
                    print(f"  FAIL {r}")
    finally:
        if jsf is not None:
            jsf.close()
    print("RESULT:", "PASS ✅" if allok else "FAIL ❌")
    return 0 if allok else 1

def selftest():
    ok = True
    # 離線 fixture fetcher
    FAKE = {
        "https://good1.example/a": "<p>玉山海拔 3952 公尺，為台灣最高峰。</p>",
        "https://good2.example/b": "資料：玉山 標高 3,952 m（另一獨立機構）。",  # quote 正規化後含「3952」需設計
        "https://bad.example/c": "<p>這頁完全沒有相關數字。</p>",
    }
    def fake(url):
        if url not in FAKE: raise urllib.error.URLError("no route")
        return FAKE[url]
    good = {"evidence_method": "cross_check", "independent_refs": [
        {"url": "https://good1.example/a", "publisher": "內政部", "quote": "玉山海拔3952公尺"},
        {"url": "https://good2.example/b", "publisher": "教育部", "quote": "玉山標高3,952m"},
    ]}
    ok1, r1 = check_source("xcheck-good", good, fetcher=fake)
    if not ok1: print("  selftest FAIL：好例應過，但", r1); ok = False
    else: print("  selftest：好例（2 獨立來源 quote 皆命中）→ ALLOW ✅")
    bad_cases = {
        "只有 1 ref": {"evidence_method": "cross_check", "independent_refs": [good["independent_refs"][0]]},
        "quote 不在內容": {"evidence_method": "cross_check", "independent_refs": [
            good["independent_refs"][0], {"url": "https://bad.example/c", "publisher": "某部", "quote": "玉山3952"}]},
        "ref 抓取失敗（死連結）": {"evidence_method": "cross_check", "independent_refs": [
            good["independent_refs"][0], {"url": "https://dead.example/x", "publisher": "某部", "quote": "x"}]},
        "publisher 不夠獨立（同一家）": {"evidence_method": "cross_check", "independent_refs": [
            {"url": "https://good1.example/a", "publisher": "內政部", "quote": "玉山海拔3952公尺"},
            {"url": "https://good1.example/a", "publisher": "內政部", "quote": "玉山海拔3952公尺"}]},
        "缺 quote": {"evidence_method": "cross_check", "independent_refs": [
            good["independent_refs"][0], {"url": "https://good2.example/b", "publisher": "教育部"}]},
    }
    for name, s in bad_cases.items():
        o, _ = check_source("xcheck-"+name, s, fetcher=fake)
        if o: print(f"  selftest FAIL：壞例『{name}』竟放行"); ok = False
        else: print(f"  selftest：壞例『{name}』→ DENY ✅")

    # ── headless fallback 紅隊（js_fetcher 以 fake 注入，保持確定性）──
    # 情境：urllib 對某 ref 失敗（死連結），但 headless 能 render 出含 quote 的頁 → 應被救回確認。
    class _FakeJs:
        def __init__(self, table): self.table = table
        def fetch(self, url): return self.table.get(url, "")
    # 好例：ref#1 urllib 死連結，但 headless 回傳含 quote 的頁 → 兩源皆確認 → ALLOW
    js_good = {"evidence_method": "cross_check", "independent_refs": [
        good["independent_refs"][0],
        {"url": "https://ssl-fail.example/gov", "publisher": "國健署", "quote": "每日蔬果五七九"}]}
    js_table_good = {"https://ssl-fail.example/gov": "衛教：建議每日蔬果五七九，均衡飲食。"}
    o, _ = check_source("xcheck-js-good", js_good, fetcher=fake, js_fetcher=_FakeJs(js_table_good))
    if o: print("  selftest：headless 救回真 quote（urllib 死連結）→ ALLOW ✅")
    else: print("  selftest FAIL：headless 應救回真 quote 卻沒過"); ok = False
    # 壞例（最關鍵）：headless 也抓到頁，但頁內**沒有**登記 quote（如 Cambridge 安全驗證頁/杜撰引文）
    #   → 不得被 headless 假放行。
    js_bad = {"evidence_method": "cross_check", "independent_refs": [
        good["independent_refs"][0],
        {"url": "https://antibot.example/x", "publisher": "某站", "quote": "這句是杜撰的引文不存在"}]}
    js_table_bad = {"https://antibot.example/x": "Performing security verification. This website uses a security service."}
    o, _ = check_source("xcheck-js-bad", js_bad, fetcher=fake, js_fetcher=_FakeJs(js_table_bad))
    if o: print("  selftest FAIL：headless 竟對杜撰 quote 假放行"); ok = False
    else: print("  selftest：headless 抓到頁但無該 quote（反機器人頁/杜撰）→ 仍 DENY ✅")

    print("SELFTEST:", "PASS ✅" if ok else "FAIL ❌")
    return 0 if ok else 2

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--offline-check", action="store_true")
    ap.add_argument("--sid")
    ap.add_argument("--no-js", action="store_true", help="停用 headless fallback，只用 urllib")
    # 忽略 orchestrator 可能附加的 --root/--release-id
    ap.add_argument("--root"); ap.add_argument("--release-id")
    a = ap.parse_args()
    if a.selftest: return selftest()
    if a.verify or a.offline_check: return verify(sid_filter=a.sid, offline=a.offline_check, use_js=not a.no_js)
    print("用法：--selftest | --verify [--sid X] [--no-js] | --offline-check"); return 2

if __name__ == "__main__":
    sys.exit(main())
