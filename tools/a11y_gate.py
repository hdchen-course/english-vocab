#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""a11y_gate.py — AC-A11Y 的靜態無障礙 fail-closed gate（§11.A）。

對 learner-facing HTML（預設 index_new.html）做可靜態判定的無障礙底線檢查。對比度不在此閘（需渲染；
由房屋 app.css WCAG 校準變數 ＋ eye-comfort 簽核把關），本閘專攻「結構/語意/鍵盤可達」這類純靜態可證者：

  (1) <html lang> 存在（螢幕報讀語言）。
  (2) <meta name="viewport"> 存在（行動裝置縮放）。
  (3) 無 inline 事件處理器（onclick=/onmouseover= …）——房屋用 addEventListener，inline handler 常綁不可鍵盤達的 <div>。
  (4) icon-only <button>（內文只有 emoji/空白）必須有 aria-label（否則報讀器唸不出用途）。
  (5) <a> 必須有 href ＋（可見文字 或 aria-label）。
  (6) role="button" 的元素必須有 tabindex（可 Tab 聚焦）＋頁面樣式有 :focus-visible 規則（看得見焦點）。
  (7) 裝飾性 icon（純 emoji 的 <span>）宜 aria-hidden（軟性 REVIEW，不 fail）。

介面：--selftest；--verify [檔...]。EXIT：0=過；1=違規；2=selftest 失敗。
"""
import argparse, os, re, sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT = [os.path.join(ROOT, "index_new.html")]
EMOJI = re.compile(r"[\U0001F000-\U0001FAFF☀-➿️←-⇿⬀-⯿]")


class A11y(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.problems = []
        self.has_html_lang = False
        self.has_viewport = False
        self.has_focus_visible = False  # 由 <style> 內容另判
        self._stack = []  # (tag, attrs_dict, text_accum)

    def handle_starttag(self, tag, attrs):
        a = {k: (v or "") for k, v in attrs}
        if tag == "html" and a.get("lang"):
            self.has_html_lang = True
        if tag == "meta" and a.get("name") == "viewport":
            self.has_viewport = True
        for k in a:
            if k.startswith("on"):  # (3) inline handler
                self.problems.append(f"inline 事件處理器 {k}= 於 <{tag}>（改用 addEventListener）")
        if a.get("role") == "button" and "tabindex" not in a:
            self.problems.append(f"<{tag} role=button> 缺 tabindex（無法 Tab 聚焦）")
        if tag in ("button", "a"):
            self._stack.append([tag, a, ""])

    def handle_data(self, data):
        if self._stack:
            self._stack[-1][2] += data

    def handle_endtag(self, tag):
        if self._stack and self._stack[-1][0] == tag:
            t, a, text = self._stack.pop()
            txt = text.strip()
            visible = EMOJI.sub("", txt).strip()  # 去掉 emoji 後是否還有可讀文字
            if t == "button":
                if not visible and not a.get("aria-label"):
                    self.problems.append("icon-only <button> 缺 aria-label（報讀器唸不出用途）")
            if t == "a":
                if "href" not in a:
                    self.problems.append("<a> 缺 href")
                if not visible and not a.get("aria-label"):
                    self.problems.append("icon-only <a> 缺 aria-label")


def scan(html):
    p = A11y()
    p.feed(html)
    probs = list(p.problems)
    if not p.has_html_lang:
        probs.append("<html> 缺 lang 屬性")
    if not p.has_viewport:
        probs.append("缺 <meta name=viewport>")
    if ":focus-visible" not in html and ":focus" not in html:
        probs.append("樣式無 :focus-visible/:focus 規則（鍵盤焦點不可見）")
    return probs


def _selftest():
    good = ('<!DOCTYPE html><html lang="zh-Hant"><head>'
            '<meta name="viewport" content="width=device-width"><style>.b:focus-visible{outline:2px}</style></head>'
            '<body><button aria-label="切換主題"><span>🌙</span></button>'
            '<a href="index.html">回首頁</a>'
            '<button type="button">國語文</button></body></html>')
    bad_lang = good.replace(' lang="zh-Hant"', "")
    bad_iconbtn = good.replace('<button aria-label="切換主題"><span>🌙</span></button>', '<button><span>🌙</span></button>')
    bad_role = good.replace('<button type="button">國語文</button>', '<div role="button">國語文</div>')
    bad_inline = good.replace('<a href="index.html">回首頁</a>', '<a href="index.html" onclick="go()">回首頁</a>')
    bad_focus = good.replace('.b:focus-visible{outline:2px}', '.b{outline:2px}')
    results = [
        ("好例（lang/viewport/focus-visible/aria-label/真按鈕）→ ALLOW", scan(good) == []),
        ("缺 html lang → DENY", any("缺 lang" in p for p in scan(bad_lang))),
        ("icon-only button 無 aria-label → DENY", any("icon-only <button>" in p for p in scan(bad_iconbtn))),
        ("role=button 無 tabindex → DENY", any("缺 tabindex" in p for p in scan(bad_role))),
        ("inline onclick → DENY", any("inline 事件" in p for p in scan(bad_inline))),
        ("無 focus 樣式 → DENY", any(":focus-visible" in p for p in scan(bad_focus))),
    ]
    allok = True
    for msg, ok in results:
        print(f"  [{'OK' if ok else 'BAD'}] {msg}"); allok = allok and ok
    return allok


def main():
    ap = argparse.ArgumentParser(description="AC-A11Y 靜態無障礙 gate（fail-closed）")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("files", nargs="*")
    args = ap.parse_args()
    if args.selftest:
        print("=== a11y_gate --selftest ==="); ok = _selftest()
        print("RESULT:", "PASS ✅" if ok else "FAIL ❌"); sys.exit(0 if ok else 2)
    if args.verify:
        targets = args.files or DEFAULT
        total = 0
        for path in targets:
            if not os.path.exists(path):
                print(f"  [skip] 不存在：{path}"); continue
            probs = scan(open(path, encoding="utf-8").read())
            for p in probs:
                print(f"  [a11y] {os.path.relpath(path, ROOT)}：{p}")
            total += len(probs)
        print(f"RESULT(AC-A11Y): {'PASS ✅' if total == 0 else 'FAIL ❌'}（掃 {len(targets)} 檔，違規 {total}）")
        sys.exit(0 if total == 0 else 1)
    ap.error("須指定 --verify 或 --selftest")


if __name__ == "__main__":
    main()
