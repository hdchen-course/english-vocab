// dict_render_gate.mjs — english_dictation.html 的 iPad-13 render gate (§10.4).
// portrait + landscape 截 menu 與 play 畫面；驗 canvas + 控制列同屏（R7）。
// 需 puppeteer-core + 本機 Chrome；須以 http 提供（非 file://）。
// 用法: SDA_BASE=http://localhost:8902 node tools/dict_render_gate.mjs
import puppeteer from 'puppeteer-core';
import fs from 'fs';

const BASE = process.env.SDA_BASE || 'http://localhost:8902';
const OUT = process.env.SDA_OUT || '/tmp/dct_render';
const CHROME = process.env.SDA_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
fs.mkdirSync(OUT, { recursive: true });

// iPad Air 13" (M5) CSS points
const VIEWS = [
  { name: 'portrait', width: 1024, height: 1366 },
  { name: 'landscape', width: 1366, height: 1024 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let problems = [];

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--user-data-dir=/tmp/dct_chrome_profile'],
});
try {
  for (const v of VIEWS) {
    const page = await browser.newPage();
    await page.setViewport({ width: v.width, height: v.height, deviceScaleFactor: 2 });
    await page.goto(`${BASE}/english_dictation.html`, { waitUntil: 'networkidle2' });
    await sleep(400);
    // menu: count week cards
    const weeks = await page.$$eval('.dct-week', (els) => els.length);
    if (weeks < 52) problems.push(`${v.name}: week cards=${weeks} (<52)`);
    await page.screenshot({ path: `${OUT}/menu_${v.name}.png`, fullPage: false });

    // enter: expand week 1, click Day 1
    await page.$$eval('.dct-week__head', (els) => els[0] && els[0].click());
    await sleep(200);
    const clicked = await page.evaluate(() => {
      const b = document.querySelector('.dct-week__body .dct-day');
      if (b) { b.click(); return true; } return false;
    });
    if (!clicked) problems.push(`${v.name}: could not click Day 1`);
    await sleep(500);
    // play screen visible?
    const playVisible = await page.$eval('#dct-screen-play', (el) => !el.classList.contains('hidden')).catch(() => false);
    if (!playVisible) problems.push(`${v.name}: play screen not shown after Day 1`);
    // R7: canvas + reveal button within viewport, no vertical scroll needed
    const geo = await page.evaluate(() => {
      const c = document.getElementById('dct-canvas');
      const r = document.getElementById('dct-reveal-btn');
      const back = document.getElementById('dct-back');
      const vh = window.innerHeight;
      const cb = c ? c.getBoundingClientRect() : null;
      const rb = r ? r.getBoundingClientRect() : null;
      return {
        vh,
        docScroll: document.documentElement.scrollHeight,
        canvasBottom: cb ? cb.bottom : null,
        canvasH: cb ? cb.height : null,
        revealBtnBottom: rb ? rb.bottom : null,
        controlsReachable: rb ? (rb.bottom <= vh + 1) : false,
      };
    });
    await page.screenshot({ path: `${OUT}/play_${v.name}.png`, fullPage: false });
    if (!geo.controlsReachable) problems.push(`${v.name}: 看答案鈕 bottom=${geo.revealBtnBottom} > vh=${geo.vh} (控制列需捲動才可達，違反 R7)`);
    if (geo.canvasH && geo.canvasH < 120) problems.push(`${v.name}: canvas 高度僅 ${geo.canvasH}px（過小）`);
    console.log(`${v.name}: weeks=${weeks} play=${playVisible} vh=${geo.vh} canvasBottom=${Math.round(geo.canvasBottom)} canvasH=${Math.round(geo.canvasH)} revealBtnBottom=${Math.round(geo.revealBtnBottom)} controlsReachable=${geo.controlsReachable}`);
    await page.close();
  }
} finally {
  await browser.close();
}
if (problems.length) {
  console.log('\nRENDER GATE PROBLEMS:');
  problems.forEach((p) => console.log(' - ' + p));
  process.exit(1);
} else {
  console.log('\nRENDER GATE: OK (screenshots in ' + OUT + ')');
}
