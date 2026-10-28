#!/usr/bin/env node
// js_fetch.mjs — headless-Chrome fallback fetcher for cross_check_gate.py。
//
// 為什麼存在：cross_check_gate 的 urllib fetch 抓不到 (a) JS-render 後才有內容的頁、
// (b) gov.tw 憑證鏈不全導致 SSL 驗證失敗的頁（如國健署 hpa.gov.tw）。headless Chrome
// 有自己的信任庫＋能跑 JS，可把這兩類「公開但 urllib 抓不到」的頁 render 出純文字，
// 供 gate 做逐字 quote 比對。**它只讀取公開頁、只回傳文字，從不送出任何資料。**
// Cambridge 這類真正反機器人（Cloudflare 安全驗證）headless 也不會過——回傳的安全驗證頁
// 不含登記 quote，故 gate 照樣判「不計入確認」，不會假放行（§1.3 不破解反機器人）。
//
// 協定（持久化，單一瀏覽器重用）：stdin 一行一個 URL；每行回一個 JSON：
//   {"url":"...","ok":true,"status":200,"text":"<innerText>"}  或  {"url":"...","ok":false,"err":"..."}
// 收到 EOF 即關閉瀏覽器退出。逾時 30s；--ignore-certificate-errors 僅為讀 gov.tw 不全鏈公開頁。
import puppeteer from '/Volumes/workplace/EnglishTraining/english-vocab-deploy/node_modules/puppeteer-core/lib/cjs/puppeteer/puppeteer-core.js';
import readline from 'node:readline';

const CHROME = process.env.CHROME_HEADLESS_SHELL ||
  "/Users/hdchen/.cache/puppeteer/chrome-headless-shell/mac_arm-152.0.7977.42/chrome-headless-shell-mac-arm64/chrome-headless-shell";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--no-sandbox', '--ignore-certificate-errors',
         `--user-data-dir=/tmp/js_fetch_chrome_${process.pid}`],
});

const rl = readline.createInterface({ input: process.stdin });
for await (const line of rl) {
  const url = line.trim();
  if (!url) continue;
  let out = { url, ok: false };
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent(UA);
    const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    // 給遲到的 ajax 一點時間（如 law.moj 條文以 ajax 塞入）
    await new Promise(r => setTimeout(r, 800));
    const text = await page.evaluate(() => document.body ? document.body.innerText : "");
    out = { url, ok: true, status: resp ? resp.status() : 0, text };
  } catch (e) {
    out = { url, ok: false, err: String(e && e.message || e).slice(0, 160) };
  } finally {
    if (page) { try { await page.close(); } catch {} }
  }
  process.stdout.write(JSON.stringify(out) + "\n");
}
await browser.close();
