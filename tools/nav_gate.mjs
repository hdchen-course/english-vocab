// nav_gate.mjs — AC-NAV 的確定性 render gate（§11.A AC-NAV／§6.1 R-OPEN／ND 漸進揭露）。
// 在 iPad Air 13" 兩方向實際 render 中央 hub（預設 index_new.html），量測真實 DOM：
//   1) 首屏頂層「島」節點數 ≤ 12（§6.1：島＝頂層策展群組；「分區」保留給 strand 層，勿混用）。
//   2) 預設可見（非收合、在首屏視窗內）導覽節點數 ≤ 15（ND 漸進揭露 §6.1）。
//   3) R-OPEN：全站不得有任何 disabled／灰掉／鎖頭／「尚未解鎖/未解鎖」鎖定態（命中須＝0）。
//   4) R14：英語科「中文對照」toggle 預設須 collapsed（未收合＝0）。
// 需 puppeteer-core + 本機 Chrome；以 http 提供（非 file://，仿 tools/dict_render_gate.mjs / hub_render.mjs）。
//
// 用法：
//   node tools/nav_gate.mjs
//   NAV_TARGET=http://127.0.0.1:8096/index_new.html node tools/nav_gate.mjs
//   （紅隊：NAV_TARGET=http://127.0.0.1:8097/fixture_a.html node tools/nav_gate.mjs）
//
// 離場碼（務必「不經管線」直接讀 $?）：
//   0            = 全數通過（無 AC-NAV 違規）
//   1..N         = 違規準則數（islands>12／visible>15 任一方向／locked>0／zh 未收合>0，各記 1）
//   99 (SENTINEL)= 無法到達／hub 未 render 出島層（非「量到 0 違規」，須分辨）
import puppeteer from 'puppeteer-core';

const TARGET = process.env.NAV_TARGET || 'http://127.0.0.1:8096/index_new.html';
const CHROME = process.env.NAV_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ISLAND_SEL = process.env.NAV_ISLAND_SEL || '.lp-navitem';
// 導覽節點＝頂層島入口 + 面板內的分區／路徑／練習卡（learner 首屏看得到、點得進的節點）
const NODE_SEL = process.env.NAV_NODE_SEL || '.lp-navitem, .lp-scard';
const SENTINEL = 99;

// iPad Air 13"（CSS points），deviceScaleFactor=2
const VIEWS = [
  { name: 'landscape', width: 1366, height: 1024 },
  { name: 'portrait', width: 1024, height: 1366 },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 於 page context 執行的量測函式（純 DOM，回傳可序列化物件）──
function measureInPage(islandSel, nodeSel) {
  const vw = window.innerWidth, vh = window.innerHeight;
  const isVisible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
    if (el.offsetParent === null && cs.position !== 'fixed') return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const inViewport = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < vh && r.bottom > 0 && r.left < vw && r.right > 0;
  };

  // 1) 頂層島：可見的 island 入口節點
  const islands = [...document.querySelectorAll(islandSel)].filter(isVisible);

  // 2) 可見節點：可見且落在首屏視窗內的導覽節點
  const nodesAll = [...document.querySelectorAll(nodeSel)];
  const visibleNodes = nodesAll.filter((el) => isVisible(el) && inViewport(el));

  // 3) 鎖定態掃描（R-OPEN 禁止集合：disabled／灰掉／鎖頭／「尚未解鎖/未解鎖」）
  //    「建置中/coming soon」屬資訊性佔位（內容仍全開、可達），非鎖定態，刻意不計入。
  const lockHits = [];
  // (a) 真正不可互動的 disabled / aria-disabled
  document.querySelectorAll('[disabled],[aria-disabled="true"]').forEach((el) => {
    const t = (el.getAttribute('data-theme-toggle') !== null) ? '' : el;
    if (t) lockHits.push({ kind: 'disabled', tag: el.tagName.toLowerCase(), cls: el.className || '', txt: (el.textContent || '').trim().slice(0, 30) });
  });
  // (b) class 名含 lock/locked/greyed/grey-out/disabled 的鎖定視覺
  document.querySelectorAll('*').forEach((el) => {
    const c = typeof el.className === 'string' ? el.className : '';
    if (/\b(lock|locked|greyed|grey-?out|disabled)\b/i.test(c)) {
      lockHits.push({ kind: 'lock-class', tag: el.tagName.toLowerCase(), cls: c.slice(0, 40), txt: (el.textContent || '').trim().slice(0, 30) });
    }
  });
  // (c) 鎖頭 icon 字符
  const htmlAll = document.body ? document.body.innerHTML : '';
  const lockGlyphs = (htmlAll.match(/[\u{1F512}\u{1F513}\u{1F510}]/gu) || []).length; // 🔒🔓🔐
  if (lockGlyphs) lockHits.push({ kind: 'lock-glyph', count: lockGlyphs });
  // (d) 「尚未解鎖/未解鎖/解鎖」字樣（R-OPEN 明列）
  const bodyTxt = document.body ? (document.body.innerText || '') : '';
  const unlockMatches = (bodyTxt.match(/尚未解鎖|未解鎖|解鎖/g) || []).length;
  if (unlockMatches) lockHits.push({ kind: 'unlock-text', count: unlockMatches });

  // 4) R14：中文對照 toggle 預設收合？掃可能的 zh 對照 toggle
  const zhExpanded = [];
  const zhCandidates = new Set();
  document.querySelectorAll('[data-zh-toggle],[data-zh-hint],[class*="zh-hint"],[class*="zh-toggle"],[class*="zh-compare"],[class*="zh_hint"]').forEach((e) => zhCandidates.add(e));
  // details/summary 以「中文對照/中文」為提要者
  document.querySelectorAll('details').forEach((d) => {
    const sum = d.querySelector('summary');
    if (sum && /中文對照|中文|對照/.test(sum.textContent || '')) zhCandidates.add(d);
  });
  zhCandidates.forEach((el) => {
    let open = false;
    if (el.tagName === 'DETAILS') open = el.open === true;
    else if (el.getAttribute('aria-expanded') === 'true') open = true;
    else {
      // 容器型：若其內容目前可見（display 非 none 且有尺寸）＝未收合
      const cs = getComputedStyle(el);
      open = cs.display !== 'none' && el.getBoundingClientRect().height > 1 && /true|open|show|expanded/i.test(el.className + ' ' + (el.getAttribute('data-state') || ''));
    }
    if (open) zhExpanded.push({ tag: el.tagName.toLowerCase(), cls: (typeof el.className === 'string' ? el.className : '').slice(0, 40) });
  });

  return {
    vw, vh,
    islandCount: islands.length,
    islandTitles: islands.slice(0, 15).map((e) => (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24)),
    visibleNodeCount: visibleNodes.length,
    totalNodeCount: nodesAll.length,
    lockHits,
    zhExpandedCount: zhExpanded.length,
    zhExpanded,
  };
}

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--no-sandbox', '--user-data-dir=/tmp/nav_gate_chrome'],
});

const perView = [];
let reachedAny = false;
let islandLayerRendered = false;
try {
  for (const v of VIEWS) {
    const page = await browser.newPage();
    await page.setViewport({ width: v.width, height: v.height, deviceScaleFactor: 2 });
    let loaded = true;
    try {
      const resp = await page.goto(`${TARGET}${TARGET.includes('?') ? '&' : '?'}v=${Date.now()}`, { waitUntil: 'networkidle0', timeout: 20000 });
      if (!resp || !resp.ok()) loaded = false;
    } catch (e) {
      loaded = false;
    }
    if (!loaded) {
      console.log(`[${v.name}] 無法到達／載入失敗：${TARGET}`);
      await page.close();
      continue;
    }
    reachedAny = true;
    await sleep(500); // 等 fetch(nav_index.json) 與 select(0) 完成

    // 首屏量測
    const m = await page.evaluate(measureInPage, ISLAND_SEL, NODE_SEL);
    if (m.islandCount > 0) islandLayerRendered = true;

    // R14：若存在「英語」島，另切到英語島再掃 zh 對照（真實 hub 首屏島0非英語）
    let zhAfterEng = { zhExpandedCount: 0, zhExpanded: [] };
    const engIdx = await page.evaluate((sel) => {
      const els = [...document.querySelectorAll(sel)];
      return els.findIndex((e) => /英語|英文|English/i.test(e.textContent || ''));
    }, ISLAND_SEL);
    if (engIdx >= 0) {
      await page.evaluate((sel, i) => document.querySelectorAll(sel)[i]?.click(), ISLAND_SEL, engIdx);
      await sleep(300);
      const me = await page.evaluate(measureInPage, ISLAND_SEL, NODE_SEL);
      zhAfterEng = { zhExpandedCount: me.zhExpandedCount, zhExpanded: me.zhExpanded };
    }
    const zhExpandedTotal = m.zhExpandedCount + zhAfterEng.zhExpandedCount;

    await page.screenshot({ path: `/tmp/nav_gate_${v.name}.png` }).catch(() => {});
    perView.push({ view: v.name, ...m, engIdx, zhAfterEng, zhExpandedTotal });
    console.log(`[${v.name}] vw=${m.vw} vh=${m.vh} 島=${m.islandCount} 可見節點=${m.visibleNodeCount}/${m.totalNodeCount} 鎖定命中=${m.lockHits.length} zh未收合(首屏)=${m.zhExpandedCount} zh未收合(英語島)=${zhAfterEng.zhExpandedCount}`);
    console.log(`   島標題: ${m.islandTitles.join(' | ')}`);
    if (m.lockHits.length) console.log(`   鎖定命中明細: ${JSON.stringify(m.lockHits)}`);
    if (zhExpandedTotal) console.log(`   zh 未收合明細: ${JSON.stringify([...m.zhExpanded, ...zhAfterEng.zhExpanded])}`);
    await page.close();
  }
} finally {
  await browser.close();
}

// ── 判定 ──
if (!reachedAny) {
  console.log(`\nSENTINEL(${SENTINEL})：兩方向皆無法到達 hub（${TARGET}）。`);
  process.exit(SENTINEL);
}
if (!islandLayerRendered) {
  console.log(`\nSENTINEL(${SENTINEL})：hub 可達但未 render 出任何頂層島（選擇器 ${ISLAND_SEL} 命中 0）——hub 尚未 spec-shaped，無法判 AC-NAV。`);
  process.exit(SENTINEL);
}

// 跨方向彙總：每個失敗「準則」記 1 個違規
const reasons = [];
const islandsOver = perView.some((p) => p.islandCount > 12);
const visibleOver = perView.some((p) => p.visibleNodeCount > 15);
const lockedAny = perView.some((p) => p.lockHits.length > 0);
const zhOpenAny = perView.some((p) => p.zhExpandedTotal > 0);
if (islandsOver) reasons.push(`首屏頂層島 > 12（實測 ${perView.map((p) => `${p.view}:${p.islandCount}`).join(', ')}）`);
if (visibleOver) reasons.push(`預設可見節點 > 15（實測 ${perView.map((p) => `${p.view}:${p.visibleNodeCount}`).join(', ')}）`);
if (lockedAny) reasons.push(`偵測到鎖定態（disabled/灰掉/鎖頭/解鎖字樣）命中 > 0`);
if (zhOpenAny) reasons.push(`英語科中文對照未預設收合（R14）`);

console.log('\n========== AC-NAV 判定 ==========');
console.log(`目標：${TARGET}`);
console.log(`門檻：島≤12、可見節點≤15、鎖定命中=0、zh未收合=0`);
if (reasons.length === 0) {
  console.log('結果：PASS（0 違規）');
  process.exit(0);
} else {
  console.log(`結果：FAIL（${reasons.length} 項違規）`);
  reasons.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  process.exit(reasons.length);
}
