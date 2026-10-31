// unit_render.mjs — render 單元頁於 16"(1718×890)＋iPad 橫(1366×1024)＋iPad 直(1024×1366)，
// 量測內容右緣填充％與選項欄數，截 PNG 到 /tmp/unit_render 供逐張開圖檢。
// 用法：node tools/unit_render.mjs <page.html>   （需 http server 在 127.0.0.1:8096）
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';
import { join } from 'path';

const PAGE = process.argv[2];
if (!PAGE) { console.error('需指定 page，如 english_greetings.html'); process.exit(2); }
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/tmp/unit_render';
mkdirSync(OUT, { recursive: true });
const VIEWS = [[1718, 890, 'mbp16'], [1366, 1024, 'ipad_land'], [1024, 1366, 'ipad_port']];

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--user-data-dir=/tmp/unit_render_chrome'] });
for (const [w, h, tag] of VIEWS) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
  await p.goto(`http://127.0.0.1:8096/${PAGE}?v=${Date.now()}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 450));
  const m = await p.evaluate(() => {
    const main = document.querySelector('.gr-main');
    const opts = document.querySelector('.gr-opts');
    return {
      winW: window.innerWidth, bodyH: document.body.scrollHeight,
      mainRight: main ? Math.round(main.getBoundingClientRect().right) : 0,
      cards: document.querySelectorAll('.gr-card').length,
      optCols: opts ? getComputedStyle(opts).gridTemplateColumns.split(' ').length : 0,
    };
  });
  const png = `${PAGE.replace(/\W/g, '_')}_${tag}_${w}x${h}.png`;
  await p.screenshot({ path: join(OUT, png), fullPage: false });
  console.log(`${tag} ${w}x${h}: 右緣${Math.round(100 * m.mainRight / m.winW)}% cards=${m.cards} optCols=${m.optCols} bodyH=${m.bodyH} → ${png}`);
  await p.close();
}
await b.close();
