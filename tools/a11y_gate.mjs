// a11y_gate.mjs — AC-A11Y-1 的確定性 render-based 無障礙 gate（§11.A，line 930）。
// 以 iPad Air 13" 橫向（1366×1024，deviceScaleFactor=2）於 http（非 file://——headless Chrome
// 在 /Volumes 下讀不到 file://）實際 render 每一頁 learner-facing 畫面，量測真實 computed styles／
// getBoundingClientRect／getAnimations()，判三道 spec 明訂可量測準則（只實作這三道，不自行加碼）：
//
//   (1) 對比度 ≥ 4.5:1（WCAG AA，normal text）：可見且非空白的文字，以其 computed color 對
//       有效背景（沿祖先合成的 background-color，base＝白）算 WCAG 相對亮度對比；< 門檻即違規。
//       （大型文字——≥24px，或 ≥18.66px 且粗體——依 WCAG AA 採 3:1 門檻，避免大標題誤報。）
//   (2) 點擊目標 ≥ 44px：可互動控制（button／a[href]／input／select／textarea／[role=button]／
//       .lp-navitem／option 類按鈕）之 min(width,height) < 44 且可見者＝違規。
//   (3) 尊重 prefers-reduced-motion：emulate `reduce` 後，頁面若仍有非零時長的執行中 CSS
//       動畫（getAnimations() 執行中且 duration>0 於可見元素），或頁面「宣告了 animation/transition
//       卻完全沒有任何 @media (prefers-reduced-motion) 區塊」處理，即該頁記 1 違規。
//
// 掃描頁面（learner-facing）：中央 hub `index_new.html` ＋ repo 根所有 `english_*.html`。
// 每頁由本 gate 自行起 `python3 -m http.server`（背景）→ 掃完 kill；不依賴外部 server。
//
// 介面（對齊姊妹 gate 慣例，供 verify_learning_path 的 registry 呼叫）：
//   node tools/a11y_gate.mjs --verify    掃所有 learner 頁；人類報告印到 stderr；
//                                         EXIT CODE = 違規數（0＝clean；夾在 1..255 以防 mod-256 歸零誤判）。
//   node tools/a11y_gate.mjs --selftest  離線自測：內建 BAD（~3:1 對比／20px 按鈕／無 reduced-motion
//                                         的動畫）必產違規，GOOD fixture 必過；期望全中才 exit 0，否則 exit 2。
//   無參數                                印用法並 exit 2（同姊妹 gate）。
//
// Fail-closed：瀏覽器無法啟動、或某頁無法載入＝FAILURE（nonzero），絕不 silent pass。
// 多餘參數（如 verify_learning_path 會附加的 --release-id/--root）一律忽略，不致 argparse 爆錯。
//
// 環境變數（可選）：A11Y_CHROME（chrome 執行檔路徑）、A11Y_PORT（server 埠，預設 8097）、
//   A11Y_CONTRAST（normal 門檻，預設 4.5）、A11Y_PAGES（以逗號分隔覆寫掃描清單）、
//   A11Y_MAX_EXAMPLES（每頁每類報告例數上限，預設 5）。
import puppeteer from 'puppeteer-core';
import { readdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHROME = process.env.A11Y_CHROME ||
  '/Users/hdchen/.cache/puppeteer/chrome-headless-shell/mac_arm-152.0.7977.42/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const PORT = parseInt(process.env.A11Y_PORT || '8097', 10);
const CONTRAST_MIN = parseFloat(process.env.A11Y_CONTRAST || '4.5');
const LARGE_MIN = 3.0;           // WCAG AA 大型文字門檻
const TAP_MIN = 44;              // px
const MAX_EXAMPLES = parseInt(process.env.A11Y_MAX_EXAMPLES || '5', 10);
const VIEW = { width: 1366, height: 1024, deviceScaleFactor: 2 }; // iPad Air 13" 橫
const SENTINEL_LAUNCH = 90;      // 瀏覽器無法啟動（fail-closed，非「0 違規」）

const err = (...a) => process.stderr.write(a.join(' ') + '\n');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 於 page context 執行：對比＋點擊目標＋靜態動畫宣告（純 DOM，回傳可序列化物件）──
/* eslint-disable */
function pageScan(opts) {
  const { contrastMin, largeMin, tapMin, maxEx } = opts;

  function parseColor(str) {
    if (!str) return null;
    const m = str.match(/rgba?\(([^)]+)\)/i);
    if (!m) return null;
    const p = m[1].split(',').map((s) => parseFloat(s.trim()));
    if (p.length < 3 || p.some((n) => Number.isNaN(n))) return null;
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function over(top, bottom) { // alpha composite top over bottom（bottom 視為不透明）
    const a = top.a;
    return { r: top.r * a + bottom.r * (1 - a), g: top.g * a + bottom.g * (1 - a), b: top.b * a + bottom.b * (1 - a), a: 1 };
  }
  function effectiveBg(el) {
    const layers = [];
    let node = el;
    while (node && node.nodeType === 1) {
      const c = parseColor(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0) layers.push(c);
      node = node.parentElement;
    }
    let base = { r: 255, g: 255, b: 255, a: 1 }; // 預設白底
    for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
    return base;
  }
  function lum(c) {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  }
  function ratio(fg, bg) {
    const l1 = lum(fg), l2 = lum(bg);
    const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }
  function isVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') return false;
    if (parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }
  function sig(el) {
    const cls = typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + cls;
  }

  // (1) 對比
  const contrast = [];
  const seenC = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      return n.nodeValue && n.nodeValue.trim().length ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  let tn;
  let contrastTotal = 0;
  while ((tn = walker.nextNode())) {
    const el = tn.parentElement;
    if (!el || !isVisible(el)) continue;
    // text node 自身 range 需有尺寸（避免被收合/0 尺寸文字）
    const range = document.createRange();
    range.selectNodeContents(tn);
    const rr = range.getBoundingClientRect();
    if (rr.width < 1 || rr.height < 1) continue;
    const cs = getComputedStyle(el);
    let fg = parseColor(cs.color);
    if (!fg) continue;
    const bg = effectiveBg(el);
    if (fg.a < 1) fg = over(fg, bg); // 半透明文字先合成到底色
    const size = parseFloat(cs.fontSize) || 16;
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const thr = large ? largeMin : contrastMin;
    const cr = ratio(fg, bg);
    if (cr + 1e-6 < thr) {
      const s = sig(el) + '|' + cr.toFixed(2);
      if (!seenC.has(s)) {
        seenC.add(s);
        contrastTotal++;
        if (contrast.length < maxEx) {
          contrast.push({ sel: sig(el), ratio: Math.round(cr * 100) / 100, need: thr, text: (tn.nodeValue || '').trim().slice(0, 24) });
        }
      }
    }
  }

  // (2) 點擊目標
  const TAP_SEL = 'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], .lp-navitem, .lp-scard, [class*="option"], [class*="choice"], .opt';
  const tap = [];
  const seenT = new Set();
  let tapTotal = 0;
  document.querySelectorAll(TAP_SEL).forEach((el) => {
    if (!isVisible(el)) return;
    const tag = el.tagName.toLowerCase();
    const role = (el.getAttribute('role') || '').toLowerCase();
    const cs = getComputedStyle(el);
    const actionable =
      ['button', 'a', 'input', 'select', 'textarea'].includes(tag) ||
      role === 'button' ||
      cs.cursor === 'pointer' ||
      el.hasAttribute('onclick') ||
      (el.getAttribute('tabindex') !== null && parseInt(el.getAttribute('tabindex'), 10) >= 0);
    if (!actionable) return;
    const r = el.getBoundingClientRect();
    const mn = Math.min(r.width, r.height);
    if (mn + 1e-6 < tapMin) {
      const s = sig(el) + '|' + Math.round(r.width) + 'x' + Math.round(r.height);
      if (!seenT.has(s)) {
        seenT.add(s);
        tapTotal++;
        if (tap.length < maxEx) {
          tap.push({ sel: sig(el), w: Math.round(r.width), h: Math.round(r.height), text: (el.textContent || '').trim().slice(0, 20) });
        }
      }
    }
  });

  // (3a) 靜態：頁面是否「宣告了動畫/轉場」＋是否有 @media (prefers-reduced-motion) 區塊
  let declaresAnim = false, hasReducedBlock = false;
  const dur = (s) => (s || '').split(',').some((t) => {
    const m = t.trim().match(/^([\d.]+)(m?s)$/);
    if (!m) return false;
    const v = parseFloat(m[1]) * (m[2] === 's' ? 1000 : 1);
    return v > 0;
  });
  function walkRules(rules) {
    for (const rule of rules) {
      if (rule.type === CSSRule.KEYFRAMES_RULE || rule.constructor.name === 'CSSKeyframesRule') { declaresAnim = true; continue; }
      if (rule.type === CSSRule.MEDIA_RULE || rule.media) {
        const mt = (rule.conditionText || (rule.media && rule.media.mediaText) || '');
        if (/prefers-reduced-motion/i.test(mt)) hasReducedBlock = true;
        if (rule.cssRules) walkRules(rule.cssRules);
        continue;
      }
      if (rule.style) {
        const st = rule.style;
        const an = st.animationName || st.getPropertyValue('animation-name');
        if ((an && an !== 'none' && an !== '') && dur(st.animationDuration || st.getPropertyValue('animation-duration'))) declaresAnim = true;
        if (dur(st.transitionDuration || st.getPropertyValue('transition-duration'))) declaresAnim = true;
        const sh = st.animation || st.getPropertyValue('animation');
        if (sh && /\d*\.?\d+m?s/.test(sh) && !/\b0s\b/.test(sh.trim())) declaresAnim = true;
      }
      if (rule.cssRules && !(rule.media)) walkRules(rule.cssRules);
    }
  }
  for (const ss of document.styleSheets) {
    try { if (ss.cssRules) walkRules(ss.cssRules); } catch (e) { /* 同源，理論上不會進此 */ }
  }
  // 行內 style 直接宣告動畫/轉場也算
  if (!declaresAnim) {
    for (const el of document.querySelectorAll('[style]')) {
      const cs = getComputedStyle(el);
      if ((cs.animationName && cs.animationName !== 'none' && dur(cs.animationDuration)) || dur(cs.transitionDuration)) { declaresAnim = true; break; }
    }
  }
  // 正常態執行中的動畫也證明「有動畫」
  const normalRunning = document.getAnimations ? document.getAnimations().filter((a) => a.playState === 'running').length : 0;
  if (normalRunning > 0) declaresAnim = true;

  return { contrastTotal, contrast, tapTotal, tap, declaresAnim, hasReducedBlock, normalRunning };
}

// 於 reduce 模式 reload 後量測：仍在執行、時長非零、且元素可見的 CSS 動畫數
function pageRunningMotion() {
  if (!document.getAnimations) return 0;
  let n = 0;
  for (const a of document.getAnimations()) {
    if (a.playState !== 'running') continue;
    const t = a.effect && a.effect.getTiming ? a.effect.getTiming() : null;
    const d = t ? (typeof t.duration === 'number' ? t.duration : 0) : 0;
    if (!(d > 0)) continue;
    const tgt = a.effect && a.effect.target;
    if (tgt) {
      const cs = getComputedStyle(tgt);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
      const r = tgt.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
    }
    n++;
  }
  return n;
}
/* eslint-enable */

// ── 共用：評估單一已載入 page 的三道準則，回傳 {violations, detail} ──
async function evalPage(page, label) {
  const scan = await page.evaluate(pageScan, { contrastMin: CONTRAST_MIN, largeMin: LARGE_MIN, tapMin: TAP_MIN, maxEx: MAX_EXAMPLES });
  // reduce 模式：emulate → reload（讓 CSS @media 與 JS 重新評估）→ 量執行中動畫
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  let running = 0;
  try {
    await page.reload({ waitUntil: 'networkidle2', timeout: 25000 });
    await sleep(350);
    running = await page.evaluate(pageRunningMotion);
  } catch (e) {
    running = -1; // reload 失敗
  }
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);

  const reasons = [];
  if (scan.contrastTotal > 0) reasons.push({ kind: 'contrast', count: scan.contrastTotal, ex: scan.contrast });
  if (scan.tapTotal > 0) reasons.push({ kind: 'tap', count: scan.tapTotal, ex: scan.tap });
  // 動畫：宣告了動畫卻無 reduced-motion 處理，或 reduce 下仍有執行中非零時長動畫
  let motionViolation = false, motionWhy = '';
  if (scan.declaresAnim && !scan.hasReducedBlock) { motionViolation = true; motionWhy = '宣告 animation/transition 但無任何 @media (prefers-reduced-motion) 區塊'; }
  if (running > 0) { motionViolation = true; motionWhy = (motionWhy ? motionWhy + '；' : '') + `reduce 下仍有 ${running} 個執行中非零時長動畫`; }
  if (motionViolation) reasons.push({ kind: 'motion', count: 1, why: motionWhy });

  const violations = (scan.contrastTotal) + (scan.tapTotal) + (motionViolation ? 1 : 0);
  return { label, violations, reasons, scan };
}

// ── http server（自管）──
function startServer() {
  return new Promise((resolve, reject) => {
    const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', ROOT],
      { stdio: ['ignore', 'ignore', 'ignore'] });
    srv.on('error', reject);
    // 輪詢直到可連線
    (async () => {
      for (let i = 0; i < 60; i++) {
        try {
          const r = await fetch(`http://127.0.0.1:${PORT}/index_new.html`, { method: 'HEAD' });
          if (r.ok || r.status === 404) return resolve(srv); // server 已起（404 也代表 server 活著）
        } catch (e) { /* not up yet */ }
        await sleep(200);
      }
      reject(new Error('http server 起不來'));
    })();
  });
}

function learnerPages() {
  if (process.env.A11Y_PAGES) return process.env.A11Y_PAGES.split(',').map((s) => s.trim()).filter(Boolean);
  const pages = [];
  if (existsSync(join(ROOT, 'index_new.html'))) pages.push('index_new.html');
  for (const f of readdirSync(ROOT)) if (/^english_.*\.html$/.test(f)) pages.push(f);
  return pages;
}

// ── --verify ──
async function verify() {
  const pages = learnerPages();
  err(`=== a11y_gate --verify ===`);
  err(`裝置基準：iPad Air 13" 橫 ${VIEW.width}×${VIEW.height}（dsf ${VIEW.deviceScaleFactor}）；對比門檻 normal ${CONTRAST_MIN}:1／large ${LARGE_MIN}:1；點擊目標 ≥${TAP_MIN}px`);
  err(`掃描頁數：${pages.length}`);

  let srv;
  try { srv = await startServer(); }
  catch (e) { err(`FAIL：http server 無法啟動——${e.message}`); process.exit(SENTINEL_LAUNCH); }

  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox', '--user-data-dir=/tmp/a11y_gate_chrome'] });
  } catch (e) {
    err(`FAIL：瀏覽器無法啟動（fail-closed，非 0 違規）——${e.message}`);
    try { srv.kill('SIGKILL'); } catch {}
    process.exit(SENTINEL_LAUNCH);
  }

  let total = 0;
  const flagged = [];
  try {
    for (const pg of pages) {
      const url = `http://127.0.0.1:${PORT}/${pg}`;
      const page = await browser.newPage();
      await page.setViewport(VIEW);
      let loaded = true;
      try {
        const resp = await page.goto(`${url}?v=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 25000 });
        if (!resp || !resp.ok()) loaded = false;
      } catch (e) { loaded = false; }
      if (!loaded) {
        total += 1; // fail-closed：載不到＝1 違規
        flagged.push({ label: pg, violations: 1, loadFail: true });
        err(`[載入失敗] ${pg} —— 記 1 違規（fail-closed，不 silent pass）`);
        await page.close().catch(() => {});
        continue;
      }
      await sleep(400); // 等 fetch(nav_index.json) 等非同步內容
      let r;
      try { r = await evalPage(page, pg); }
      catch (e) {
        total += 1;
        flagged.push({ label: pg, violations: 1, scanFail: e.message });
        err(`[量測失敗] ${pg} —— ${e.message}（記 1 違規，fail-closed）`);
        await page.close().catch(() => {});
        continue;
      }
      total += r.violations;
      if (r.violations > 0) {
        flagged.push(r);
        err(`[違規] ${pg}：共 ${r.violations}`);
        for (const rs of r.reasons) {
          if (rs.kind === 'contrast') {
            err(`   對比 <門檻：${rs.count} 處`);
            rs.ex.forEach((e2) => err(`     - ${e2.sel} 對比 ${e2.ratio}:1（需 ${e2.need}:1）「${e2.text}」`));
          } else if (rs.kind === 'tap') {
            err(`   點擊目標 <${TAP_MIN}px：${rs.count} 個`);
            rs.ex.forEach((e2) => err(`     - ${e2.sel} ${e2.w}×${e2.h}px「${e2.text}」`));
          } else if (rs.kind === 'motion') {
            err(`   prefers-reduced-motion：${rs.why}`);
          }
        }
      }
      await page.close().catch(() => {});
    }
  } finally {
    await browser.close().catch(() => {});
    try { srv.kill('SIGKILL'); } catch {}
  }

  err(`\n========== AC-A11Y-1 判定 ==========`);
  err(`掃描 ${pages.length} 頁，違規總數 ${total}（有違規頁 ${flagged.length}）`);
  if (total === 0) err(`結果：PASS（0 違規）`);
  else {
    err(`結果：FAIL`);
    const by = flagged.slice(0, 20).map((f) => `${f.label}:${f.violations}`).join(', ');
    err(`  違規頁（前 20）：${by}`);
  }
  // EXIT CODE = 違規數，夾在 1..255（防 mod-256 歸零誤判成 PASS）
  process.exit(total === 0 ? 0 : Math.min(total, 255));
}

// ── --selftest（離線 fixture）──
const BAD_HTML = `<!doctype html><html lang="zh-Hant"><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
@keyframes a11yspin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.bad-contrast{color:#999999;background:#ffffff;font-size:16px}
.spin{width:50px;height:50px;background:#eee;animation:a11yspin 2s linear infinite}
.smallbtn{width:20px;height:20px;padding:0;border:0}
</style></head><body>
<p class="bad-contrast">對比不足的文字範例</p>
<button class="smallbtn">x</button>
<div class="spin"></div>
</body></html>`;

const GOOD_HTML = `<!doctype html><html lang="zh-Hant"><head><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
@keyframes a11yspin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.good-contrast{color:#111111;background:#ffffff;font-size:16px}
.spin{width:50px;height:50px;background:#eee;animation:a11yspin 2s linear infinite}
@media (prefers-reduced-motion: reduce){ .spin{animation:none} }
.okbtn{min-width:48px;min-height:48px;width:48px;height:48px;padding:0;border:0}
</style></head><body>
<p class="good-contrast">對比足夠的文字範例</p>
<button class="okbtn">好</button>
<div class="spin"></div>
</body></html>`;

async function scanFixture(browser, html) {
  const page = await browser.newPage();
  await page.setViewport(VIEW);
  // 先 emulate reduce，再 setContent，讓 @media 於初次評估即生效（fixture 無 server/reload）
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setContent(html, { waitUntil: 'networkidle2' });
  await sleep(200);
  const scan = await page.evaluate(pageScan, { contrastMin: CONTRAST_MIN, largeMin: LARGE_MIN, tapMin: TAP_MIN, maxEx: MAX_EXAMPLES });
  const running = await page.evaluate(pageRunningMotion);
  await page.close();
  const motionViolation = (scan.declaresAnim && !scan.hasReducedBlock) || running > 0;
  return { contrast: scan.contrastTotal, tap: scan.tapTotal, motionViolation, declaresAnim: scan.declaresAnim, hasReducedBlock: scan.hasReducedBlock, running };
}

async function selftest() {
  err(`=== a11y_gate --selftest ===`);
  let browser;
  try { browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox', '--user-data-dir=/tmp/a11y_gate_chrome'] }); }
  catch (e) { err(`FAIL：瀏覽器無法啟動——${e.message}`); process.exit(2); }

  let bad, good;
  try {
    bad = await scanFixture(browser, BAD_HTML);
    good = await scanFixture(browser, GOOD_HTML);
  } catch (e) {
    err(`FAIL：selftest render 失敗——${e.message}`);
    await browser.close().catch(() => {});
    process.exit(2);
  } finally {
    await browser.close().catch(() => {});
  }

  const checks = [
    ['BAD：對比 <4.5:1 被抓 → DENY', bad.contrast > 0],
    ['BAD：20px 按鈕被抓 → DENY', bad.tap > 0],
    ['BAD：有動畫無 reduced-motion 處理被抓 → DENY', bad.motionViolation === true],
    ['GOOD：對比足夠 → 0 違規', good.contrast === 0],
    ['GOOD：按鈕 ≥44px → 0 違規', good.tap === 0],
    ['GOOD：動畫有 reduced-motion 處理 → 0 違規', good.motionViolation === false],
  ];
  let allok = true;
  for (const [msg, ok] of checks) { err(`  [${ok ? 'OK' : 'BAD'}] ${msg}`); allok = allok && ok; }
  err(`  BAD 明細：對比=${bad.contrast} 點擊=${bad.tap} 動畫違規=${bad.motionViolation}（declares=${bad.declaresAnim} reducedBlock=${bad.hasReducedBlock} running=${bad.running}）`);
  err(`  GOOD 明細：對比=${good.contrast} 點擊=${good.tap} 動畫違規=${good.motionViolation}（declares=${good.declaresAnim} reducedBlock=${good.hasReducedBlock} running=${good.running}）`);
  err(`RESULT：${allok ? 'PASS' : 'FAIL'}`);
  process.exit(allok ? 0 : 2);
}

// ── 入口 ──
const argv = process.argv.slice(2);
if (argv.includes('--selftest')) await selftest();
else if (argv.includes('--verify')) await verify();
else {
  err('用法：node tools/a11y_gate.mjs --verify | --selftest');
  err('  --verify   掃所有 learner 頁（index_new.html + english_*.html），EXIT=違規數（0=clean）');
  err('  --selftest 離線 good/bad fixture 自測（PASS=exit 0；期望未全中=exit 2）');
  process.exit(2);
}
