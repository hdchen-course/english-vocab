// hub_render.mjs — 列舉學習地圖 hub 的所有畫面狀態、於 iPad Air 13"＋16" 實際 render，
// 產出綁「index_new.html 內容 sha」的 render manifest（authoring/hub_render_manifest.json）。
// 用法：node tools/hub_render.mjs   （需本機 http server 在 127.0.0.1:8096 提供 index_new.html）
// PNG 寫到 /tmp/hub_render（可重生、不入 git）；manifest 入 git，供 figure_signoff_gate 綁 sha 驗。
import puppeteer from 'puppeteer-core';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { createHash } from 'crypto';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = '/tmp/hub_render';
const PORT = process.env.HUB_PORT || '8096';  // 預設 8096；worktree 另起 server 時以 HUB_PORT 覆寫
const BASE = `http://127.0.0.1:${PORT}/index_new.html`;
mkdirSync(OUT, { recursive: true });

const srcSha = createHash('sha256').update(readFileSync(join(ROOT, 'index_new.html'))).digest('hex').slice(0, 16);
const nav = JSON.parse(readFileSync(join(ROOT, 'authoring', 'nav_index.json'), 'utf8'));
const islands = nav.islands.map(i => ({ island: i.island, title: i.title_zh }));

// 要 render 的狀態：主視埠（iPad 橫 1366×1024）逐島；另 eng 島加 16"(1718×890) 與 iPad 直(1024×1366)
const PRIMARY = [1366, 1024];
const engIdx = islands.findIndex(i => i.island === 'eng');
const states = [];
islands.forEach((isl, idx) => states.push({ id: `island:${isl.island}`, islandIndex: idx, island: isl.island, title: isl.title, w: PRIMARY[0], h: PRIMARY[1] }));
states.push({ id: 'island:eng@mbp16', islandIndex: engIdx, island: 'eng', title: '英語文', w: 1718, h: 890 });
states.push({ id: 'island:eng@ipad_port', islandIndex: engIdx, island: 'eng', title: '英語文', w: 1024, h: 1366 });
// 核心新 UI：點「主題字彙」分區卡 → 右側 panel 換成該分區「單元牆」（滿版多欄＋依級別分組＋每卡級別徽章）。
// 左 sidebar 不動；逐張看橫/iPad直/16"，確認右側鋪滿多欄、無窄欄無大空白、分段標題＋徽章可見。
states.push({ id: 'island:eng#vocab-detail', islandIndex: engIdx, island: 'eng', title: '英語文（主題字彙·單元牆）', w: 1366, h: 1024, detailStrand: 'vocab' });
states.push({ id: 'island:eng#vocab-detail@ipad_port', islandIndex: engIdx, island: 'eng', title: '英語文（主題字彙·單元牆）', w: 1024, h: 1366, detailStrand: 'vocab' });
states.push({ id: 'island:eng#vocab-detail@mbp16', islandIndex: engIdx, island: 'eng', title: '英語文（主題字彙·單元牆）', w: 1718, h: 890, detailStrand: 'vocab' });

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--user-data-dir=/tmp/hub_render_chrome'] });
const manifestStates = [];
for (const st of states) {
  const p = await b.newPage();
  await p.setViewport({ width: st.w, height: st.h, deviceScaleFactor: 2 });
  await p.goto(`${BASE}?v=${Date.now()}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 400));
  await p.evaluate((i) => document.querySelectorAll('.lp-navitem')[i]?.click(), st.islandIndex);
  await new Promise(r => setTimeout(r, 250));
  if (st.detailStrand) {
    await p.evaluate((slug) => {
      const btn = document.querySelector(`#panel button.lp-scard-link[data-strand="${slug}"]`);
      if (btn) btn.click();
    }, st.detailStrand);
    await new Promise(r => setTimeout(r, 350));
  }
  const m = await p.evaluate(() => {
    const lay = document.querySelector('.lp-layout'); const g = document.querySelector('.lp-strandgrid');
    const side = document.querySelector('.lp-side');
    return { bodyH: document.body.scrollHeight, winW: window.innerWidth, unitcards: document.querySelectorAll('a.lp-unitcard').length,
      layRight: lay ? Math.round(lay.getBoundingClientRect().right) : 0,
      cols: g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : 0,
      cards: document.querySelectorAll('.lp-scard').length,
      hasBack: !!document.querySelector('.lp-back'),
      tierHeads: document.querySelectorAll('#panel .lp-catsec .lp-cath').length,
      sidebarVisible: !!(side && side.getBoundingClientRect().width > 1) };
  });
  const png = `${st.id.replace(/[:@]/g, '_')}_${st.w}x${st.h}.png`;
  await p.screenshot({ path: join(OUT, png) });
  manifestStates.push({ id: st.id, island: st.island, title: st.title, viewport: `${st.w}x${st.h}`, png,
    cols: m.cols, cards: m.cards, unitcards: m.unitcards, layRightPct: Math.round(100 * m.layRight / m.winW), bodyH: m.bodyH,
    hasBack: m.hasBack, tierHeads: m.tierHeads, sidebarVisible: m.sidebarVisible });
  await p.close();
}
await b.close();

const manifest = {
  _note: 'hub render manifest；綁 index_new.html 內容 sha。sha 變＝舊簽核作廢，須重 render+重簽（仿 Sidewalk .sha-manifest）。',
  source_file: 'index_new.html', source_sha: srcSha,
  generated_at: new Date().toISOString(), render_dir: OUT,
  device_baseline: 'iPad Air 13"（1366×1024 主）＋16"（1718×890）＋iPad 直（1024×1366）',
  required_states: states.map(s => s.id),
  states: manifestStates,
};
writeFileSync(join(ROOT, 'authoring', 'hub_render_manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`render manifest 寫出：${manifestStates.length} 狀態，source_sha=${srcSha}`);
manifestStates.forEach(s => console.log(`  ${s.id} ${s.viewport} cols=${s.cols} cards=${s.cards} unit=${s.unitcards} 級別段=${s.tierHeads} 返回鈕=${s.hasBack} sidebar=${s.sidebarVisible} 右緣${s.layRightPct}%`));
