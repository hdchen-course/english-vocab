// nav_gate.mjs — AC-NAV 的 RENDER 層 fail-closed gate（§6.1/§6.2/§6.7 導覽渲染一致性）。
//
// 本檔是 HEAD 既有 AC-NAV render gate 與「--verify 介面＋自管 server＋DATA↔DOM 對應」機制的
// 「合併」版（careful MERGE，不丟任何原有檢查）：既保留 HEAD 的 R-OPEN 鎖定態掃描與 R14 中文對照
// 收合，又補上 registry 需要的 --verify 進入點、自管 python3 http.server、puppeteer-core +
// chrome-headless-shell、--selftest、exit 1..255 夾制、fail-closed，以及 DATA↔DOM 對應驗證。
//
// 姊妹 gate `tools/nav_gate.py` 管「資料層」（nav_index.json 對 knowledge_points.json 一致），
// 其渲染層（rendered nav DOM 吻合資料）由本 render gate 把關；本 gate 不重做資料層檢查。
//
// 以 iPad Air 13" 橫向（1366×1024，deviceScaleFactor=2）於 http（非 file://——headless Chrome
// 在 /Volumes 下讀不到 file://）實際 render，量測真實渲染結果。實作下列四道：
//
//   (1)+(2) ND 漸進揭露（§6.1）＋頂層島上限：
//       - 頂層「島」＝可見的 .lp-navitem；數量須 ≤ 12（島＝頂層策展群組；且＝nav_index island_count）。
//       - ND＝「預設至多只展開一座島的子節點」：CATMAP hub 首屏自動展開「恰好一座島」、顯示其約 16
//         張類別卡（.lp-scard）是 HD 核可的刻意設計（§6.1 ND 的刻意覆寫）——**不視為違規**；因此 ND 的
//         上限套在「頂層島」而非「可見節點」，**不得**把那一座自動展開島的類別卡算進 ≤15 限制。
//       - ND 仍禁止：**同時展開 ＞1 座島**（首屏若有來自 ≥2 座不同島的類別卡可見＝多島傾倒＝違規），
//         以及任何把全部葉節點攤平傾倒。判法：首屏「被展開的島數」> 1 即違規。
//
//   (3) R-OPEN（§6.1）：學習內容恆為開放，全站學習導覽不得有任何 disabled／灰掉／鎖頭／
//       「尚未解鎖/未解鎖」鎖定態（命中須＝0）。port 自 HEAD，token 與 HEAD 一致：
//       [disabled]/[aria-disabled=true]、class 含 lock/locked/greyed/grey-out/disabled、
//       鎖頭字符 🔒🔓🔐、「尚未解鎖/未解鎖/解鎖」字樣。
//       ※ 刻意不計入（非鎖定態；延續 HEAD 的 informational 佔位豁免精神）：
//         (a)「建置中/coming soon」資訊性佔位（內容仍全開、可達）；
//         (b) 主題切換鈕（data-theme-toggle）；
//         (c) 成就「獎勵徽章牆」（#badge-wall / .lp-badges 容器內）——未亮起的徽章是「下一個小目標」，
//            屬 additive/never-disappear 的獎勵系統，非鎖學習內容。R-OPEN 的規範精神是「學習永遠開放」，
//            故與 HEAD 的 建置中 豁免同理，將此獎勵容器排除；學習導覽（nav/strand/path）他處仍全掃。
//
//   (4) R14：英語科「中文對照（zh_hint）」toggle 預設須收合（spec §6.2：renderer 預設 collapsed；
//       以英文學英文、中文對照預設隱藏）。render 取樣 english_*.html，確認任何「中文對照／zh-hint」
//       元素在首屏不可見（<details> 未 open／aria-expanded≠true／display:none／hidden）。port 自 HEAD
//       的偵測精神並併入 /tmp 版的載體選擇器。
//
//   (D) HUB 資料↔DOM 對應（index_new.html 讀 data/nav_index.json 後渲染 CATMAP）：
//       - nav_index.json 每座島的 title_zh 都要出現在 hub 導覽的渲染文字中（島名無遺漏）；
//       - 渲染出的每個分區（strand）標籤都是其中文正名，**不得等於原始 slug**、**不得含 needs_review**；
//       - 渲染出的頂層島數量 ＝ nav_index.json 的 island_count（且 ≤12）。
//
// 介面（對齊姊妹 gate a11y_gate.mjs / nav_gate.py 慣例，供 verify_learning_path registry 呼叫）：
//   node tools/nav_gate.mjs --verify    掃 hub ＋ 代表性 english_*.html 取樣；人類報告印到 stderr；
//                                        EXIT CODE = 違規數（0＝clean；夾在 1..255 以防 mod-256 歸零誤判）。
//   node tools/nav_gate.mjs --selftest  離線 good/bad fixture（setContent，無 server）：BAD（slug 標籤／
//                                        中文對照展開／鎖定學習節點／兩島同時展開）必產違規，GOOD 必過；
//                                        期望全中才 exit 0，否則 exit 2。
//   無參數                               印用法並 exit 2（同姊妹 gate）。
//
// Fail-closed：瀏覽器／server 無法啟動＝FAILURE（exit 90，非「0 違規」）；某頁無法載入＝記 1 違規
// （nonzero），絕不 silent pass。多餘參數（如 verify_learning_path 會附加的 --release-id/--root）一律忽略。
//
// 環境變數（可選）：NAV_CHROME（chrome 執行檔）、NAV_PORT（server 埠，預設 8098）、
//   NAV_PAGES（逗號分隔覆寫英語取樣清單）、NAV_ALL=1（掃全部 english_*.html 而非取樣）、
//   NAV_SAMPLE（取樣頁數，預設 12）、NAV_MAX_EXAMPLES（每類報告例數上限，預設 8）。
import puppeteer from 'puppeteer-core';
import { readdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const A = join(ROOT, 'authoring');
const CHROME = process.env.NAV_CHROME ||
  '/Users/hdchen/.cache/puppeteer/chrome-headless-shell/mac_arm-152.0.7977.42/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const PORT = parseInt(process.env.NAV_PORT || '8098', 10);
const SAMPLE_N = parseInt(process.env.NAV_SAMPLE || '12', 10);
const MAX_EXAMPLES = parseInt(process.env.NAV_MAX_EXAMPLES || '8', 10);
const MAX_ISLANDS = 12;                                           // §6.1 頂層島上限
const VIEW = { width: 1366, height: 1024, deviceScaleFactor: 2 }; // iPad Air 13" 橫
const SENTINEL_LAUNCH = 90;                                       // 啟動失敗（fail-closed，非「0 違規」）

const err = (...a) => process.stderr.write(a.join(' ') + '\n');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── 於 page context 執行：純 DOM 擷取（回傳可序列化物件；不做「期望值」比對）──
/* eslint-disable */
function domScan() {
  function isVisible(el) {
    if (!el || el.nodeType !== 1) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.visibility === 'collapse') return false;
    if (parseFloat(cs.opacity) === 0) return false;
    if (el.hasAttribute && el.hasAttribute('hidden')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  }
  function hasCJK(s) { return /[㐀-鿿豈-﫿]/.test(s || ''); }
  function sig(el) {
    const cls = typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + cls;
  }
  // 取元素「直屬文字節點」串接（略去子元素如 .lp-step 數字、.lp-aem emoji、.lp-tchip 標籤）
  function directText(el) {
    let t = '';
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue;
    return t.trim();
  }

  // ── (D)+(1) HUB：島名（.lp-navitem .nm）＋ 分區標籤（.lp-scard .snm 的直屬文字）──
  const navItems = [...document.querySelectorAll('.lp-navitem')];
  const islandTitleSet = new Set();
  const islandTitles = [];
  for (const b of navItems) {
    const nm = b.querySelector('.nm');
    const t = nm ? nm.textContent.trim() : directText(b);
    if (t) { islandTitles.push(t); islandTitleSet.add(t); }
  }
  const navItemCount = navItems.length;
  const strandLabels = [];
  for (const card of document.querySelectorAll('.lp-scard .snm')) {
    const lbl = directText(card);
    if (lbl) strandLabels.push(lbl);
  }

  // ── (2) ND：首屏「被展開的島數」──
  // 訊號 A：被標記為 active/current/expanded 的頂層島數。
  let activeNavCount = 0;
  for (const b of navItems) {
    const cls = typeof b.className === 'string' ? b.className : '';
    if (/\bactive\b/.test(cls) || b.getAttribute('aria-current') === 'true' || b.getAttribute('aria-expanded') === 'true') activeNavCount++;
  }
  // 訊號 B：可見 .lp-scard 依「最近含島名標題的祖先容器」歸屬到某座島；相異歸屬島數＝被展開的島數。
  //   （真 hub：所有 scard 都在單一 #panel 下，panel 內 .lp-panel-h 的 h2＝當前島名 → 全歸同一島 → 1。）
  function ownerIsland(scard) {
    let node = scard.parentElement;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      const heads = node.querySelectorAll('h1,h2,h3,.lp-panel-h,[data-island-title]');
      for (const h of heads) {
        if (h.closest && h.closest('#nav')) continue;   // 導覽列裡的島名不算「展開內容」
        const t = (h.textContent || '').trim();
        for (const it of islandTitleSet) { if (it && (t === it || t.startsWith(it))) return it; }
      }
      node = node.parentElement;
    }
    return null;
  }
  const expandedOwners = new Set();
  for (const card of document.querySelectorAll('.lp-scard')) {
    if (!isVisible(card)) continue;
    const o = ownerIsland(card);
    if (o) expandedOwners.add(o);
  }

  // ── (3) R-OPEN：鎖定態掃描（port 自 HEAD；排除獎勵徽章牆／主題切換鈕）──
  // 排除容器：成就徽章牆（#badge-wall / .lp-badges）——未亮徽章是「下一個小目標」，屬獎勵系統非鎖學習。
  function inRewardWall(el) { return !!(el.closest && el.closest('#badge-wall, .lp-badges, .badge-grid')); }
  const lockHits = [];
  // (a) 真正不可互動的 disabled / aria-disabled（排除主題切換鈕與獎勵牆）
  document.querySelectorAll('[disabled],[aria-disabled="true"]').forEach((el) => {
    if (el.getAttribute('data-theme-toggle') !== null) return;
    if (inRewardWall(el)) return;
    lockHits.push({ kind: 'disabled', tag: el.tagName.toLowerCase(), cls: (typeof el.className === 'string' ? el.className : '').slice(0, 40), txt: (el.textContent || '').trim().slice(0, 30) });
  });
  // (b) class 名含 lock/locked/greyed/grey-out/disabled 的鎖定視覺（排除獎勵牆）
  document.querySelectorAll('*').forEach((el) => {
    const c = typeof el.className === 'string' ? el.className : '';
    if (/\b(lock|locked|greyed|grey-?out|disabled)\b/i.test(c)) {
      if (inRewardWall(el)) return;
      lockHits.push({ kind: 'lock-class', tag: el.tagName.toLowerCase(), cls: c.slice(0, 40), txt: (el.textContent || '').trim().slice(0, 30) });
    }
  });
  // (c) 鎖頭 icon 字符 🔒🔓🔐（掃學習區塊；排除獎勵牆文字）
  function textOutsideReward() {
    const wall = document.querySelector('#badge-wall, .lp-badges');
    const body = document.body;
    if (!body) return '';
    if (!wall) return body.innerText || '';
    // 將獎勵牆文字自 body 文字中剔除後再掃
    const full = body.innerText || '';
    const wtxt = wall.innerText || '';
    return wtxt ? full.split(wtxt).join(' ') : full;
  }
  const bodyTxtNoReward = textOutsideReward();
  const lockGlyphs = (bodyTxtNoReward.match(/[\u{1F512}\u{1F513}\u{1F510}]/gu) || []).length;
  if (lockGlyphs) lockHits.push({ kind: 'lock-glyph', count: lockGlyphs });
  // (d)「尚未解鎖/未解鎖/解鎖」字樣（排除獎勵牆文字）
  const unlockMatches = (bodyTxtNoReward.match(/尚未解鎖|未解鎖|解鎖/g) || []).length;
  if (unlockMatches) lockHits.push({ kind: 'unlock-text', count: unlockMatches });

  // ── (4) R14：中文對照 / zh-hint 首屏是否被預設展開 ──
  const zh = [];
  const seen = new Set();
  function flag(el, reason) {
    const s = sig(el) + '|' + reason;
    if (seen.has(s)) return;
    seen.add(s);
    zh.push({ sel: sig(el), reason, text: (el.textContent || '').trim().slice(0, 28) });
  }
  // (4a) <details> 作為中文對照收合容器：summary 文字含「中文對照」或（含「中文」且含「對照」）
  for (const d of document.querySelectorAll('details')) {
    const sm = d.querySelector('summary');
    const label = sm ? sm.textContent.trim() : '';
    const isZh = /中文對照/.test(label) || (/中文/.test(label) && /對照/.test(label));
    if (!isZh) continue;
    if (d.hasAttribute('open')) flag(d, 'details[open] 中文對照首屏展開');
  }
  // (4b) 明確的中文對照載體（併 HEAD 與 /tmp 的選擇器）：首屏可見且含中文字 → 違規（應收合）
  const ZH_SEL = '[data-zh-toggle],[data-zh-hint],[data-zh],.zh-hint,.zhhint,.zh_hint,.zh-gloss,.zhgloss,[class*="zh-hint"],[class*="zh-toggle"],[class*="zh-compare"],[class*="gloss"]';
  for (const el of document.querySelectorAll(ZH_SEL)) {
    if (!hasCJK(el.textContent)) continue;            // 空的／純英文載體不算中文對照
    // aria-expanded=false 明示收合者略過（即使 CSS 尚未藏）
    if (el.getAttribute('aria-expanded') === 'false') continue;
    if (isVisible(el)) flag(el, '中文對照載體首屏可見（應預設收合）');
  }

  return { navItemCount, islandTitles, strandLabels, activeNavCount, expandedOwners: [...expandedOwners], lockHits, zh };
}
/* eslint-enable */

// ── 純 Node：拿 domScan 結果對「期望值」比對（D/1）＋ ND（2）＋ R-OPEN（3）＋ R14（4）彙整 ──
function evaluate(scan, expected, opts) {
  const isHub = !!(opts && opts.isHub);
  const reasons = [];
  let violations = 0;

  // ── (D)+(1) 島數（hub／fixture 帶 islandCount 時）──
  if (typeof expected.islandCount === 'number') {
    if (scan.navItemCount !== expected.islandCount) {
      reasons.push({ kind: 'island_count', msg: `渲染島數 ${scan.navItemCount} ≠ nav_index island_count ${expected.islandCount}` });
      violations += 1;
    }
    if (scan.navItemCount > MAX_ISLANDS) {
      reasons.push({ kind: 'island_count', msg: `渲染島數 ${scan.navItemCount} > ND 上限 ${MAX_ISLANDS}` });
      violations += 1;
    }
    // 每島 title_zh 須現身
    const rendered = new Set(scan.islandTitles);
    const missing = [];
    for (const t of (expected.islandTitles || [])) {
      if (!rendered.has(t) && !scan.islandTitles.some((x) => x.includes(t))) missing.push(t);
    }
    if (missing.length) { reasons.push({ kind: 'island_missing', msg: `nav_index 島名未出現在 DOM：${missing.join('、')}`, ex: missing.slice(0, MAX_EXAMPLES) }); violations += missing.length; }
    // 分區標籤不得為 slug／不得含 needs_review
    const slugSet = expected.slugSet || new Set();
    const badLabels = [];
    for (const lbl of scan.strandLabels) {
      if (/needs_review/i.test(lbl)) badLabels.push({ lbl, why: '含 needs_review' });
      else if (slugSet.has(lbl)) badLabels.push({ lbl, why: '等於 raw slug（中文正名未渲染）' });
    }
    if (badLabels.length) { reasons.push({ kind: 'strand_label', count: badLabels.length, msg: `分區標籤 slug/needs_review 洩漏：${badLabels.length} 個`, ex: badLabels.slice(0, MAX_EXAMPLES) }); violations += badLabels.length; }
  }

  // ── (2) ND：首屏至多展開一座島（hub 專屬）──
  if (isHub) {
    const expandedCount = Math.max(scan.expandedOwners ? scan.expandedOwners.length : 0, scan.activeNavCount || 0);
    if (expandedCount > 1) {
      reasons.push({
        kind: 'nd_disclosure',
        msg: `ND：首屏展開 ${expandedCount} 座島（至多 1 座）——active 島 ${scan.activeNavCount}、有可見類別卡的島 ${JSON.stringify(scan.expandedOwners || [])}`,
      });
      violations += 1;
    }
  }

  // ── (3) R-OPEN：鎖定態命中（port 自 HEAD；hits>0＝違規）──
  if (scan.lockHits && scan.lockHits.length) {
    reasons.push({ kind: 'r_open', count: scan.lockHits.length, msg: `偵測到鎖定態（disabled/灰掉/鎖頭/解鎖字樣）命中 ${scan.lockHits.length}`, ex: scan.lockHits.slice(0, MAX_EXAMPLES) });
    violations += scan.lockHits.length;
  }

  // ── (4) R14：中文對照展開 ──
  if (scan.zh && scan.zh.length) {
    reasons.push({ kind: 'zh_hint', count: scan.zh.length, msg: `中文對照未預設收合：${scan.zh.length} 處`, ex: scan.zh.slice(0, MAX_EXAMPLES) });
    violations += scan.zh.length;
  }

  return { violations, reasons };
}

// ── 讀 nav_index.json 取期望值（島名集、slug 集、island_count）──
function loadExpected() {
  const nav = JSON.parse(readFileSync(join(ROOT, 'data', 'nav_index.json'), 'utf-8'));
  const islands = nav.islands || [];
  const islandTitles = islands.map((i) => i.title_zh).filter(Boolean);
  const slugSet = new Set();
  for (const isl of islands) {
    if (isl.island) slugSet.add(isl.island);
    for (const s of (isl.strands || [])) if (s.strand) slugSet.add(s.strand);
  }
  return { islandCount: nav.island_count, islandTitles, slugSet };
}

// ── http server（自管；對齊 a11y_gate）──
function startServer() {
  return new Promise((resolve, reject) => {
    const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', ROOT],
      { stdio: ['ignore', 'ignore', 'ignore'] });
    srv.on('error', reject);
    (async () => {
      for (let i = 0; i < 60; i++) {
        try {
          const r = await fetch(`http://127.0.0.1:${PORT}/index_new.html`, { method: 'HEAD' });
          if (r.ok || r.status === 404) return resolve(srv);
        } catch (e) { /* not up yet */ }
        await sleep(200);
      }
      reject(new Error('http server 起不來'));
    })();
  });
}

// 代表性英語取樣：預設跨排序清單等距取 SAMPLE_N 個，並確保納入含中文/對照機制的頁
function englishSample() {
  if (process.env.NAV_PAGES) return process.env.NAV_PAGES.split(',').map((s) => s.trim()).filter(Boolean);
  const all = readdirSync(ROOT).filter((f) => /^english_.*\.html$/.test(f)).sort();
  if (process.env.NAV_ALL === '1') return all;
  if (all.length <= SAMPLE_N) return all;
  const picked = new Set();
  const step = all.length / SAMPLE_N;
  for (let i = 0; i < SAMPLE_N; i++) picked.add(all[Math.floor(i * step)]);
  for (const p of ['english_advanced.html', 'english_morefamily.html', 'english_listening.html', 'english_idioms.html'])
    if (all.includes(p)) picked.add(p);
  return [...picked].sort();
}

async function loadPage(browser, url) {
  const page = await browser.newPage();
  await page.setViewport(VIEW);
  let ok = true;
  try {
    const resp = await page.goto(`${url}?v=${Date.now()}`, { waitUntil: 'networkidle2', timeout: 25000 });
    if (!resp || !resp.ok()) ok = false;
  } catch (e) { ok = false; }
  return { page, ok };
}

function reportReasons(reasons) {
  for (const rs of reasons) {
    if (rs.kind === 'island_count') err(`   島數：${rs.msg}`);
    else if (rs.kind === 'island_missing') err(`   島名缺渲染：${rs.msg}`);
    else if (rs.kind === 'strand_label') {
      err(`   ${rs.msg}`);
      (rs.ex || []).forEach((e2) => err(`     - 「${e2.lbl}」：${e2.why}`));
    } else if (rs.kind === 'nd_disclosure') {
      err(`   ${rs.msg}`);
    } else if (rs.kind === 'r_open') {
      err(`   R-OPEN：${rs.msg}`);
      (rs.ex || []).forEach((e2) => err(`     - ${JSON.stringify(e2)}`));
    } else if (rs.kind === 'zh_hint') {
      err(`   ${rs.msg}`);
      (rs.ex || []).forEach((e2) => err(`     - ${e2.sel}：${e2.reason}「${e2.text}」`));
    }
  }
}

// ── --verify ──
async function verify() {
  err('=== nav_gate --verify（AC-NAV render 層）===');
  err(`裝置基準：iPad Air 13" 橫 ${VIEW.width}×${VIEW.height}（dsf ${VIEW.deviceScaleFactor}）；http（非 file://）`);

  let expected;
  try { expected = loadExpected(); }
  catch (e) { err(`FAIL：讀 nav_index.json 失敗——${e.message}`); process.exit(SENTINEL_LAUNCH); }
  const sample = englishSample();
  err(`掃描：hub index_new.html（D/1 島↔DOM＋2 ND＋3 R-OPEN＋4 R14）＋ english 取樣 ${sample.length} 頁（4 R14）；期望島數 ${expected.islandCount}、島名 ${expected.islandTitles.length} 個`);

  let srv;
  try { srv = await startServer(); }
  catch (e) { err(`FAIL：http server 無法啟動——${e.message}`); process.exit(SENTINEL_LAUNCH); }

  let browser;
  try { browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox', '--user-data-dir=/tmp/nav_gate_chrome'] }); }
  catch (e) {
    err(`FAIL：瀏覽器無法啟動（fail-closed，非 0 違規）——${e.message}`);
    try { srv.kill('SIGKILL'); } catch {}
    process.exit(SENTINEL_LAUNCH);
  }

  let total = 0;
  const flagged = [];
  try {
    // ── hub（全部四道）──
    {
      const { page, ok } = await loadPage(browser, `http://127.0.0.1:${PORT}/index_new.html`);
      if (!ok) {
        total += 1; flagged.push({ label: 'index_new.html', violations: 1 });
        err('[載入失敗] index_new.html —— 記 1 違規（fail-closed）');
        await page.close().catch(() => {});
      } else {
        await sleep(600); // 等 fetch(nav_index.json/units_index.json) 完成並渲染
        let scan;
        try { scan = await page.evaluate(domScan); }
        catch (e) { scan = null; }
        if (!scan) {
          total += 1; flagged.push({ label: 'index_new.html', violations: 1 });
          err('[量測失敗] index_new.html —— 記 1 違規（fail-closed）');
        } else {
          const r = evaluate(scan, expected, { isHub: true });
          total += r.violations;
          err(`[hub] index_new.html：渲染島數 ${scan.navItemCount}、分區標籤 ${scan.strandLabels.length} 個、active島 ${scan.activeNavCount}、展開島 ${JSON.stringify(scan.expandedOwners)}、鎖定命中 ${scan.lockHits.length}、zh ${scan.zh.length}、違規 ${r.violations}`);
          if (r.violations > 0) { flagged.push({ label: 'index_new.html', violations: r.violations }); reportReasons(r.reasons); }
        }
        await page.close().catch(() => {});
      }
    }
    // ── english 取樣（只檢 R14 中文對照收合；island 期望值／ND 不適用英語內頁）──
    for (const pg of sample) {
      const { page, ok } = await loadPage(browser, `http://127.0.0.1:${PORT}/${pg}`);
      if (!ok) {
        total += 1; flagged.push({ label: pg, violations: 1 });
        err(`[載入失敗] ${pg} —— 記 1 違規（fail-closed）`);
        await page.close().catch(() => {});
        continue;
      }
      await sleep(400);
      let scan;
      try { scan = await page.evaluate(domScan); }
      catch (e) { scan = null; }
      if (!scan) {
        total += 1; flagged.push({ label: pg, violations: 1 });
        err(`[量測失敗] ${pg} —— 記 1 違規（fail-closed）`);
        await page.close().catch(() => {});
        continue;
      }
      // 英語內頁：只評 R14（zh）；不帶 island 期望、非 hub（不評 ND／島數）
      const r = evaluate({ ...scan, lockHits: [] }, {}, { isHub: false });
      total += r.violations;
      if (r.violations > 0) { flagged.push({ label: pg, violations: r.violations }); err(`[違規] ${pg}：${r.violations}`); reportReasons(r.reasons); }
      await page.close().catch(() => {});
    }
  } finally {
    await browser.close().catch(() => {});
    try { srv.kill('SIGKILL'); } catch {}
  }

  err('\n========== AC-NAV（render 層）判定 ==========');
  err(`掃描 ${sample.length + 1} 頁（hub+取樣），違規總數 ${total}（有違規頁 ${flagged.length}）`);
  if (total === 0) err('結果：PASS（0 違規）');
  else { err('結果：FAIL'); err(`  違規頁：${flagged.slice(0, 20).map((f) => `${f.label}:${f.violations}`).join(', ')}`); }
  process.exit(total === 0 ? 0 : Math.min(total, 255));
}

// ── --selftest（離線 fixture；setContent，無 server）──
// 共用骨架：nav（navitems）＋ 一或多個 panel（含島名標題 h2 ＋ 分區卡）。
function hubShell(navTitles, panelsHtml, extraHead, extraBody) {
  const nav = navTitles.map((t, i) =>
    `<button type="button" class="lp-navitem${i === 0 ? ' active' : ''}" ${i === 0 ? 'aria-current="true"' : ''}><span class="nm">${t}</span></button>`).join('');
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">${extraHead || ''}</head><body>
  <nav id="nav" aria-label="學習島">${nav}</nav>
  ${panelsHtml}
  ${extraBody || ''}
  </body></html>`;
}
function panel(islandTitle, cardsInner) {
  return `<section class="lp-panel"><div class="lp-panel-h"><h2>${islandTitle}</h2><span class="sub">分區</span></div>
    <div class="lp-strandgrid">${cardsInner}</div></section>`;
}
function card(label) { return `<div class="lp-scard"><span class="snm"><span class="lp-step">1</span>${label}</span></div>`; }

const FX_EXPECTED = { islandCount: 2, islandTitles: ['英語文', '數學'], slugSet: new Set(['verb', 'char', 'eng', 'math']) };

// GOOD：2 島、單一 panel（恰一座島展開）、分區中文正名、中文對照收合、無鎖定態。
const GOOD_HTML = hubShell(['英語文', '數學'],
  panel('英語文', card('自然發音') + card('動詞與時態')),
  `<style>.zh-hint{display:none}</style>`,
  `<details><summary>中文對照</summary><div>她在這裡住了十年。</div></details>
   <div class="zh-hint">預設收合的中文對照</div>
   <section id="badge-wall" class="lp-badges"><div class="badge-grid">
     <div class="badge-item is-locked"><div class="b-state">尚未解鎖</div></div>
   </div></section>`);

// BAD-SLUG：分區標籤留 raw slug "verb"（中文正名未渲染）。
const BAD_SLUG_HTML = hubShell(['英語文', '數學'],
  panel('英語文', card('識字與筆順') + card('verb')),
  `<style>.zh-hint{display:none}</style>`,
  `<details><summary>中文對照</summary><div>x</div></details>`);

// BAD-ZH：中文對照 <details open> 展開＋.zh-hint 首屏可見。
const BAD_ZH_HTML = hubShell(['英語文', '數學'],
  panel('英語文', card('自然發音') + card('動詞與時態')),
  `<style>.zh-hint{color:#111}</style>`,
  `<details open><summary>中文對照</summary><div>她在這裡住了十年。</div></details>
   <div class="zh-hint">這是預設展開的中文對照</div>`);

// BAD-LOCK：學習導覽節點被鎖（disabled＋lock class＋「尚未解鎖」字樣）——非獎勵牆。
const BAD_LOCK_HTML = hubShell(['英語文', '數學'],
  panel('英語文', card('自然發音') + `<button class="lp-scard locked" disabled><span class="snm">進階閱讀</span><span class="lock-note">尚未解鎖</span></button>`),
  `<style>.zh-hint{display:none}</style>`, ``);

// BAD-ND：兩座島同時展開（兩個 panel 各帶島名＋分區卡；兩個 navitem 皆 active）。
const BAD_ND_HTML = (() => {
  const nav = ['英語文', '數學'].map((t) =>
    `<button type="button" class="lp-navitem active" aria-current="true"><span class="nm">${t}</span></button>`).join('');
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><style>.zh-hint{display:none}</style></head><body>
  <nav id="nav" aria-label="學習島">${nav}</nav>
  ${panel('英語文', card('自然發音') + card('動詞與時態'))}
  ${panel('數學', card('整數與運算') + card('分數'))}
  </body></html>`;
})();

async function scanFixture(browser, html) {
  const page = await browser.newPage();
  await page.setViewport(VIEW);
  await page.setContent(html, { waitUntil: 'networkidle2' });
  await sleep(150);
  const scan = await page.evaluate(domScan);
  await page.close();
  return { scan, res: evaluate(scan, FX_EXPECTED, { isHub: true }) };
}

async function selftest() {
  err('=== nav_gate --selftest（render 層）===');
  let browser;
  try { browser = await puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox', '--user-data-dir=/tmp/nav_gate_chrome'] }); }
  catch (e) { err(`FAIL：瀏覽器無法啟動——${e.message}`); process.exit(2); }

  let good, bslug, bzh, block, bnd;
  try {
    good = await scanFixture(browser, GOOD_HTML);
    bslug = await scanFixture(browser, BAD_SLUG_HTML);
    bzh = await scanFixture(browser, BAD_ZH_HTML);
    block = await scanFixture(browser, BAD_LOCK_HTML);
    bnd = await scanFixture(browser, BAD_ND_HTML);
  } catch (e) { err(`FAIL：selftest render 失敗——${e.message}`); await browser.close().catch(() => {}); process.exit(2); }
  finally { await browser.close().catch(() => {}); }

  const has = (r, k) => r.res.reasons.some((x) => x.kind === k);
  const checks = [
    ['GOOD：分區中文正名／中文對照收合／恰一島展開／獎勵牆未亮徽章不計鎖 → 0 違規', good.res.violations === 0],
    ['BAD-SLUG：分區標籤留 raw slug "verb" → DENY（strand_label）', has(bslug, 'strand_label')],
    ['BAD-ZH：中文對照 <details open>／.zh-hint 可見 → DENY（zh_hint）', has(bzh, 'zh_hint')],
    ['BAD-LOCK：鎖定學習節點（disabled/locked/尚未解鎖） → DENY（r_open）', has(block, 'r_open')],
    ['BAD-ND：兩島同時展開 → DENY（nd_disclosure）', has(bnd, 'nd_disclosure')],
    ['BAD：四個壞案例總違規皆 > 0', bslug.res.violations > 0 && bzh.res.violations > 0 && block.res.violations > 0 && bnd.res.violations > 0],
  ];
  let allok = true;
  for (const [msg, ok] of checks) { err(`  [${ok ? 'OK' : 'BAD'}] ${msg}`); allok = allok && ok; }
  err(`  GOOD：違規=${good.res.violations}（active島=${good.scan.activeNavCount} 展開島=${JSON.stringify(good.scan.expandedOwners)} 鎖定=${good.scan.lockHits.length} zh=${good.scan.zh.length}）`);
  err(`  BAD-SLUG：違規=${bslug.res.violations}；BAD-ZH：違規=${bzh.res.violations}；BAD-LOCK：違規=${block.res.violations}（鎖定=${block.scan.lockHits.length}）；BAD-ND：違規=${bnd.res.violations}（active島=${bnd.scan.activeNavCount} 展開島=${JSON.stringify(bnd.scan.expandedOwners)}）`);
  err(`RESULT：${allok ? 'PASS' : 'FAIL'}`);
  process.exit(allok ? 0 : 2);
}

// ── 入口 ──
const argv = process.argv.slice(2);
if (argv.includes('--selftest')) await selftest();
else if (argv.includes('--verify')) await verify();
else {
  err('用法：node tools/nav_gate.mjs --verify | --selftest');
  err('  --verify   render hub（島↔DOM＋ND＋R-OPEN＋R14）＋ english 取樣（R14）；EXIT=違規數（0=clean）');
  err('  --selftest 離線 good/bad fixture 自測（PASS=exit 0；期望未全中=exit 2）');
  process.exit(2);
}
