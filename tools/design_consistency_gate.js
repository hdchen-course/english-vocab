#!/usr/bin/env node
/*
 * design_consistency_gate.js — 設計一致性（共用元件重用）gate
 *
 * ADAPTED (未重新發明) 自 static-doc-audit skill 既有同名 gate
 *   來源：~/.claude/skills/static-doc-audit/scripts/design_consistency_gate.js
 * 本專案（english-vocab-deploy，K-12 學習路徑重構）為 §6.5 R-STYLE-4 / §11.A AC-STYLE-1
 * 所引用的 fail-closed gate。唯一的實質調整：預設 SDA_CSS 指向本 repo 的共用樣式單一來源
 *   assets/app.css（§6.5 R-STYLE-1 設計 token 單一來源）＋ game_core.css（共用元件 class）。
 * 其餘偵測邏輯、exit 契約、99=examined-nothing 哨兵一律保留不改。
 *
 * 這道 gate 專抓 CONTENT 稽核永遠看不到的缺陷類：某頁用「私有 class 前綴」重造共用 UI 元件，
 * 而不是重用共用元件。症狀：~20 個 engine 各自宣告自己的 `.XX-card/.XX-opt/.XX-stage/...`，
 * 其 CSS body 複製了共用的 `.q-*`/`.cn-*`/`.u-card`/`.result-card`——於是全站「明顯長得不一樣」，
 * 卻沒有任何 content check 攔得到。
 *
 * 方法（deterministic，無需 render）：抽出每個 HTML 內嵌 <style> 以及共用樣式表的每條 class rule；
 * 正規化每條 rule body（lowercase、去空白、宣告排序）；由共用樣式表（SDA_CSS）建立 canonical body 集合，
 * 以 canonical 元件名為 key；再把任一「私有前綴」rule（selector `.<prefix>-<suffix>`，suffix 屬元件詞彙）
 * body 正規化後若等於某 canonical body → 標記 DUPLICATE（必須以 grouped selector 收斂）；
 * 若共享 >=THRESHOLD 的宣告 → 標記 NEAR（需人工複核）。
 *
 * 用法:  node design_consistency_gate.js <dir>
 *   env SDA_CSS         共用樣式表 comma list（本 repo 預設 assets/app.css,game_core.css）
 *   env SDA_DC_SKIP     要略過的檔案 comma list（本質 bespoke：flashcards / numpad / manipulatives 等）
 *   env SDA_DC_SUFFIX   覆寫元件 suffix 詞彙（comma list）
 *   env SDA_DC_THRESHOLD near-match 宣告重疊比例（預設 0.85）
 *
 * EXIT CODES: 0 = clean, 1..90 = 該數量的 DUPLICATE，99 = 什麼都沒檢（canon 空）。
 *
 * 為何 99 存在、且是本檔最重要的一行：本 gate 只能找到 CANONICAL 元件的重造，所以 canon 載入 0 個時，
 * 對任何輸入都回報 DUPLICATE=0，永遠。若 SDA_CSS 解析不到共用樣式表，"clean" 是空洞的。故：每個 SDA_CSS
 * entry 都對 doc dir 及其祖先逐層解析，印出載入了幾個 canonical 元件、來自哪些檔，canon 為空時 exit 99
 * 而非 0——「這 gate 不適用於你的 corpus」是合法結果，但絕不能和「你的 corpus 乾淨」拼成同一個字。
 */
const fs = require('fs');
const path = require('path');

const NOTHING_EXAMINED = 99;
// CLI 相容層（§11.A AC-STYLE 由 acceptance_criteria.json 以 `--verify` 呼叫；orchestrator
// 另可能附加 `--release-id <id>`／`--root <dir>`）。原僅取 argv[2] 當 <dir>，故 `--verify`
// 會被誤當目錄 → readdirSync('--verify') ENOENT crash。此處解析 argv：忽略 `--verify` 等旗標、
// 吃掉 `--release-id <id>`、把 `--root <dir>` 或裸參數當掃描目錄；無指定則預設 repo cwd。
// 行為對既有 `<dir>` 用法完全不變（偵測邏輯/exit 契約/SDA_CSS 一律不改）。
const DIR = (() => {
  const a = process.argv.slice(2);
  let dir = process.cwd();
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--root') { if (a[i + 1]) { dir = a[i + 1]; i++; } continue; }
    if (a[i] === '--release-id') { i++; continue; }   // 跳過旗標＋其值
    if (a[i].startsWith('--')) continue;              // 忽略 --verify 等
    dir = a[i];                                        // 第一個裸參數＝掃描目錄
  }
  return dir;
})();
const SHARED = (process.env.SDA_CSS || 'assets/app.css,game_core.css').split(',').map(s => s.trim()).filter(Boolean);
const SKIP = new Set((process.env.SDA_DC_SKIP || '').split(',').map(s => s.trim()).filter(Boolean));
const SUFFIX = (process.env.SDA_DC_SUFFIX ||
  'card,opt,options,stage,reveal,actions,teach,level,lesson,done,feedback,prompt,progress,options-grid,qcard'
).split(',').map(s => s.trim()).filter(Boolean);
const THRESHOLD = parseFloat(process.env.SDA_DC_THRESHOLD || '0.85');

// canonical prefixes/roots that ARE the shared vocabulary — never flag these as "private".
const CANON_PREFIX = new Set(['q', 'u', 'cn', 'result', 'stat', 'app', 'fc', 'id', 'game', 'hud']);

// --- tiny CSS rule scanner: returns [{selector, body}] for top-level "sel { decls }" ---
function scanRules(css) {
  const rules = [];
  // strip comments
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let i = 0, n = css.length;
  while (i < n) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const close = css.indexOf('}', open);
    if (close < 0) break;
    const sel = css.slice(i, open).trim();
    const body = css.slice(open + 1, close).trim();
    // skip at-rules / nested blocks (@media etc.) — their body contains more rules; we recurse
    if (sel.startsWith('@')) {
      // recurse into the block content for media queries
      for (const r of scanRules(body)) rules.push(r);
    } else if (sel && !sel.includes('{')) {
      rules.push({ selector: sel, body });
    }
    i = close + 1;
  }
  return rules;
}

// normalize a declaration body → sorted array of "prop:value" (lowercased, spaces stripped)
function declSet(body) {
  return body.split(';')
    .map(d => d.replace(/\s+/g, '').toLowerCase())
    .filter(Boolean)
    .sort();
}
function declKey(body) { return declSet(body).join(';'); }

function overlap(aSet, bSet) {
  const b = new Set(bSet);
  let hit = 0;
  for (const d of aSet) if (b.has(d)) hit++;
  const denom = Math.max(aSet.length, bSet.length) || 1;
  return hit / denom;
}

// extract inline <style> blocks from HTML
function inlineStyles(html) {
  const out = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out.join('\n');
}

// --- build canonical body map from shared stylesheets ---
const canon = []; // {name, decls, key}
const canonFiles = [], canonMissing = [];
// Resolve each entry against the doc dir, then walk up to the filesystem root. A corpus that
// keeps one stylesheet at its own root (assets/) is the normal shape, and the doc-dir-only
// join silently found none of it.
function resolveShared(rel) {
  if (path.isAbsolute(rel)) return fs.existsSync(rel) ? rel : null;
  let dir = path.resolve(DIR);
  for (;;) {
    const p = path.join(dir, rel);
    if (fs.existsSync(p)) return p;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}
for (const rel of SHARED) {
  const p = resolveShared(rel);
  if (!p) { canonMissing.push(rel); continue; }
  canonFiles.push(p);
  for (const r of scanRules(fs.readFileSync(p, 'utf8'))) {
    // only single-class canonical selectors like ".q-opt" ".u-card" ".cn-card"
    const m = r.selector.match(/^\.([a-z][a-z0-9]*(?:-[a-z0-9]+)*)$/i);
    if (!m) continue;
    if (declSet(r.body).length < 3) continue; // ignore trivial rules
    canon.push({ name: m[1], decls: declSet(r.body), key: declKey(r.body) });
  }
}
const canonByKey = new Map();
for (const c of canon) if (!canonByKey.has(c.key)) canonByKey.set(c.key, c.name);

console.log(`design_consistency_gate: ${canon.length} canonical component rule(s) loaded from ` +
            `${canonFiles.length} stylesheet(s)${canonFiles.length ? ': ' + canonFiles.join(', ') : ''}`);
if (canonMissing.length) console.log(`  NOT FOUND (searched ${DIR} and its ancestors): ${canonMissing.join(', ')}`);
if (!canon.length) {
  console.error(`\ndesign_consistency_gate: ZERO canonical components loaded, so there is nothing a page`);
  console.error(`could duplicate and DUPLICATE=0 is guaranteed regardless of the corpus. This run proves`);
  console.error(`NOTHING. Point SDA_CSS at the corpus's real shared stylesheet(s), or accept that this`);
  console.error(`gate does not apply here -- but do not record it as a clean round.`);
  process.exit(NOTHING_EXAMINED);
}

function isPrivate(prefix) { return !CANON_PREFIX.has(prefix); }
function suffixOf(cls) {
  // cls like "ph-level-progress" -> prefix "ph", trailing suffix token(s)
  const parts = cls.split('-');
  if (parts.length < 2) return null;
  const prefix = parts[0];
  const rest = parts.slice(1).join('-');
  // match if any SUFFIX vocab word is the whole rest OR the last token
  const last = parts[parts.length - 1];
  const hit = SUFFIX.includes(rest) || SUFFIX.includes(last);
  return hit ? { prefix, rest } : null;
}

const dups = [];   // exact duplicates of a canonical component
const nears = [];  // near matches
const files = fs.readdirSync(DIR).filter(f => f.endsWith('.html') && !SKIP.has(f));
for (const f of files) {
  const html = fs.readFileSync(path.join(DIR, f), 'utf8');
  const css = inlineStyles(html);
  if (!css.trim()) continue;
  const seen = new Set();
  for (const r of scanRules(css)) {
    const m = r.selector.match(/^\.([a-z][a-z0-9]*(?:-[a-z0-9]+)*)$/i);
    if (!m) continue;
    const cls = m[1].toLowerCase();
    const sx = suffixOf(cls);
    if (!sx || !isPrivate(sx.prefix)) continue;
    const ds = declSet(r.body);
    if (ds.length < 3) continue;
    const key = declKey(r.body);
    if (seen.has(cls)) continue; seen.add(cls);
    if (canonByKey.has(key)) {
      dups.push({ file: f, cls, canon: canonByKey.get(key) });
    } else {
      // near-match against any canonical of the same component family
      let best = null;
      for (const c of canon) {
        const ov = overlap(ds, c.decls);
        if (ov >= THRESHOLD && (!best || ov > best.ov)) best = { name: c.name, ov };
      }
      if (best) nears.push({ file: f, cls, canon: best.name, ov: best.ov.toFixed(2) });
    }
  }
}

function group(list) {
  const byFile = {};
  for (const d of list) (byFile[d.file] = byFile[d.file] || []).push(d);
  return byFile;
}

console.log('=== design-consistency (shared-component reuse) ===');
console.log(`canonical components loaded: ${canonByKey.size} unique bodies from ${SHARED.join(', ')}`);
const dg = group(dups);
console.log(`\nDUPLICATE (private class reinvents a shared component — consolidate via grouped selector): ${dups.length}`);
for (const f of Object.keys(dg).sort()) {
  console.log(`  ${f}`);
  for (const d of dg[f]) console.log(`     .${d.cls}  ==  canonical .${d.canon}`);
}
const ng = group(nears);
console.log(`\nNEAR (>=${THRESHOLD} decl overlap — review; may be intentional variant): ${nears.length}`);
for (const f of Object.keys(ng).sort()) {
  console.log(`  ${f}`);
  for (const d of ng[f]) console.log(`     .${d.cls}  ~~  canonical .${d.canon}  (overlap ${d.ov})`);
}
console.log(`\nDUPLICATE=${dups.length} NEAR=${nears.length}  FILES=${files.length} CANON=${canon.length}`);
process.exit(Math.min(dups.length, 90));
