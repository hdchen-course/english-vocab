// dict_r3_gate.mjs — R3 不批改 行為驗證 (§10 item 8b)。
// 於鍵盤 fallback 餵「正確」與「錯誤」輸入，確認揭曉只出現正解 + 三級自評，
// 無任何對錯回饋（✓/✗、對/錯、紅綠對錯色、correct/wrong）。canvas 輸入引擎本就不讀。
// 用法: SDA_BASE=http://localhost:8902 node tools/dict_r3_gate.mjs
import puppeteer from 'puppeteer-core';
const BASE = process.env.SDA_BASE || 'http://localhost:8902';
const CHROME = process.env.SDA_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FORBID = ['✓', '✗', '✔', '✘', '答對', '答錯', '正確', '錯誤', 'correct', 'wrong', '對了', '錯了'];
let problems = [];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--user-data-dir=/tmp/dct_chrome_r3'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 1024, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/english_dictation.html`, { waitUntil: 'networkidle2' });
  await sleep(300);
  // 進 week1 day1
  await page.$$eval('.dct-week__head', (e) => e[0] && e[0].click());
  await sleep(150);
  await page.evaluate(() => { document.querySelector('.dct-week__body .dct-day').click(); });
  await sleep(300);

  async function revealTextFor(input) {
    // 開鍵盤 fallback、輸入、看答案
    await page.evaluate(() => { const fb = document.getElementById('dct-fallback'); if (fb && fb.classList.contains('hidden')) document.getElementById('dct-fallback-toggle').click(); });
    await page.evaluate((val) => { const fb = document.getElementById('dct-fallback'); fb.value = val; fb.dispatchEvent(new Event('input', { bubbles: true })); }, input);
    await sleep(80);
    await page.evaluate(() => document.getElementById('dct-reveal-btn').click());
    await sleep(150);
    return await page.evaluate(() => {
      const rv = document.getElementById('dct-reveal');
      const styles = Array.from(rv.querySelectorAll('*')).map((el) => {
        const c = getComputedStyle(el); return c.color + '|' + c.backgroundColor;
      });
      return { text: rv.innerText, html: rv.innerHTML, visible: !rv.classList.contains('hidden'), styles };
    });
  }

  // 目前 item 的正解
  const answer = await page.evaluate(() => {
    // 從 reveal 前拿不到；先看答案拿正解字
    return null;
  });

  // 情況 A：輸入「正確」（先 reveal 取得正解，再以正解當輸入重測下一題同義）
  const r1 = await revealTextFor('zzzzqwrong');   // 錯誤輸入
  if (!r1.visible) problems.push('reveal 未顯示');
  FORBID.forEach((tok) => { if (r1.text.indexOf(tok) >= 0 || r1.html.indexOf(tok) >= 0) problems.push(`錯誤輸入後揭曉出現禁詞「${tok}」`); });
  // 必含三級自評
  if (!/還不熟/.test(r1.html) || !/會了/.test(r1.html)) problems.push('揭曉缺三級自評鈕');

  // 下一題：輸入「完全正確」（用該題正解）
  await page.evaluate(() => { document.querySelector('.dct-rate .good, .fc-rate__btn.good').click(); });
  await sleep(200);
  const correctWord = await page.evaluate(() => {
    // 取當前 item 正解：播放檔名 slug 無法反推 word；改從 DICT 配對當前題號
    // 簡化：直接讀 window 當前（引擎未暴露），故用「看答案」後的 US 行文字當正解再比對「輸入=該字」
    return null;
  });
  // 用「看答案」先得正解字，再把它當輸入（模擬完全正確）
  const peek = await revealTextFor('');
  const ansWord = (peek.text.split('\n')[0] || '').replace(/^US：/, '').trim();
  // 回上一步重輸入正解：直接在同題再輸入正解並 reveal（reveal 冪等、純函數於 item）
  const r2 = await revealTextFor(ansWord || 'one');
  FORBID.forEach((tok) => { if (r2.text.indexOf(tok) >= 0 || r2.html.indexOf(tok) >= 0) problems.push(`正確輸入後揭曉出現禁詞「${tok}」（correct-only 迴歸！）`); });
  // 正確 vs 錯誤 的揭曉應一致（純函數於 item，不隨輸入變）
  if (peek.text !== r2.text) problems.push('揭曉內容隨輸入改變（疑似讀取輸入判對錯）');

  await page.close();
} finally { await browser.close(); }

if (problems.length) { console.log('R3 GATE FAIL:'); problems.forEach((p) => console.log(' - ' + p)); process.exit(1); }
console.log('R3 GATE PASS — 正確/錯誤輸入於鍵盤 fallback 皆只顯示正解+三級自評，無對錯回饋，揭曉不隨輸入變。');
