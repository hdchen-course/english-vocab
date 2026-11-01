#!/usr/bin/env node
/*
 * content_card_width_lint.js — 內容卡自適應寬 lint（§6.5 R-STYLE-4 第二道 style gate）
 *
 * 搭配 tools/design_consistency_gate.js，同為 Phase 0.5 的 fail-closed style gate。
 * 契約依 LEARNING_PATH_REBUILD_SPEC.md §6.5：
 *   R-STYLE-3（house pattern）：凡「答案／揭曉／題目／內容」卡，一律
 *     width: fit-content; max-width: min(680px,100%); margin-inline: auto;（上限值依卡型微調）
 *     ——不得固定寬、不得全寬（width:100% 無上限）、不得無上限。
 *   R-STYLE-4：偵測卡片類別用固定 `width:` 或 `width:100%` 而未用 `fit-content`+cap → DENY。
 *
 * 本 lint 專抓此缺陷類，且刻意保守（避免 false positive）：
 *   只檢「內容卡」選擇器——class 名含 card/reveal/answer/prompt/panel/callout/result 等內容容器詞。
 *   明確排除版面外殼/格線/按鈕/導覽/app-bar/canvas 等非內容容器。
 *
 * 違規判定（三者皆成立才算一條違規）：
 *   (1) 選擇器的「主體」（最右側 compound）是內容卡 class；
 *   (2) 該 rule 設了 width:100% 或固定 width:<n>px/rem/em（魔術數字）；
 *   (3) 既沒有 max-width 上限（cap；max-width:none 不算 cap），也沒有用 width:fit-content / max-content。
 * → 印出 `file: selector: reason`。
 *
 * 保守設計要點（已文件化，避免 false positive）：
 *   - 只看選擇器「最右側 compound」是否為內容卡：例如 `.u-card__dots i` 的主體是元素 `i`
 *     （一顆進度圓點，width:9px），主體非 class → 不是內容卡 → 不誤報。
 *   - 最右側 compound 若含任一「排除詞」（grid/row/wrap/dots/btn/nav/bar/canvas…）→ 視為版面/控件，不報。
 *   - width:fit-content / max-content 或「有 max-width 上限」→ 合規，不報
 *     （對齊正確範本 `.dct-play > .dct-reveal`：width:fit-content; max-width:min(680px,100%)）。
 *   - width 的 cap 判定：有 max-width 且其值非 `none` 才算真的有上限。
 *
 * ── 兩類結構性豁免（R-STYLE-3 本意外，皆 FALSE POSITIVE；此為修誤報，非放寬真檢查）──
 *   R-STYLE-3 的 width:fit-content+cap 只針對「答案／揭曉／題目／內容」卡（範本 `.dct-reveal`）。
 *   以下兩類卡的 width:100% 是合法結構用途，不在 R-STYLE-3 射程內，故豁免：
 *
 *   (A) 3D 翻卡的卡面（flip-card face）：width:100% 是用來「填滿有尺寸的翻卡容器」，非內容寬度。
 *       判定（命中任一即豁免）：
 *         (A1) 主體 class token 以 `-front`/`-back`/`-face`/`-inner` 結尾（卡面命名慣例）；
 *         (A2) 該 rule 自身 body 帶 flip 語意：`transform-style:preserve-3d` 或 `transform:…rotateY(…)`；
 *         (A3) 同檔另有一條 rule，其選擇器含本卡的同一個 class token，且該 rule 具 flip 語意
 *              （body preserve-3d / rotateY，或選擇器含 `.flipped` 狀態）——即「翻卡脈絡」。
 *       範例：`.flashcard`（自身 preserve-3d + 同檔 `.flashcard.flipped{transform:rotateY}`）、
 *             `.card-inner`（preserve-3d + `.card-inner.flipped`）、`.card-front`/`.card-back`（-front/-back 字尾）。
 *
 *   (B) 格線磚節點卡（grid-tile node card）：width:100% 是用來「填滿自己的 grid/flex cell」，非內容寬度。
 *       判定：主體 class token 形如 `<base>-card`（有連字號），且同檔存在一個同 `<base>` 的容器 rule
 *             `<base>-grid`/`-list`/`-wrap`/`-cards`/`-tiles`，其 body 具 `display:grid` 或
 *             `display:flex` + `flex-wrap:wrap`（或 `flex-flow:…wrap`）——即「本卡是該格線的磚」。
 *       範例：`.id-card`（容器 `.id-grid{display:grid}`）、`.sf-card`（容器 `.sf-grid{display:grid}`）。
 *
 *   兩類豁免皆刻意保守且「偏向不豁免真正的 reveal/answer 卡」：
 *     真·揭曉卡（如 `.qz-reveal{width:100%}`，無 cap、非翻卡面、無同 base 的 grid 容器）仍會被抓。
 *
 * 用法:  node content_card_width_lint.js <dir>
 *   掃描 <dir> 的 *.css ＋ <dir>/assets/*.css ＋ <dir> 根層 *.html 內嵌 <style>。
 *   env CCW_CARD_WORDS   覆寫內容卡詞彙（comma list）
 *   env CCW_EXCLUDE      覆寫排除詞（comma list）
 *   env CCW_SKIP         要略過的檔名（comma list）
 *
 * EXIT CODES（比照 sibling gate，務必 UNPIPED 讀 $?）:
 *   0        = clean（有檢到 rule 但零違規）
 *   1..90    = 該數量的違規
 *   99       = examined-nothing 哨兵（完全沒掃到任何 CSS rule；「這 gate 不適用」≠「你的 corpus 乾淨」）
 *
 * 為何 99 最重要：若輸入沒有任何 CSS rule（空目錄／無 css／無內嵌 style），對任何輸入都回報違規=0，
 * 永遠。那種 0 是空洞的。故：掃到的 rule 總數為 0 時 exit 99 而非 0。
 */
const fs = require('fs');
const path = require('path');

const NOTHING_EXAMINED = 99;
const DIR = process.argv[2] || process.cwd();

// 內容卡詞彙（§6.5 R-STYLE-3「答案/揭曉/題目/內容」卡 ＋ 常見內容容器同義詞）
const CARD_WORDS = (process.env.CCW_CARD_WORDS ||
  'card,reveal,answer,prompt,panel,callout,result,question,qcard'
).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

// 排除詞：版面外殼/格線/控件/導覽/畫布/裝飾——即使 class 名含卡片詞，只要主體含這些就不是內容卡
const EXCLUDE_WORDS = (process.env.CCW_EXCLUDE ||
  'grid,row,wrap,wrapper,nav,bar,canvas,btn,button,ring,progress,actions,list,' +
  'col,column,layout,dots,dot,emoji,icon,svg,img,input,track,rail,scroll,sr-only,overlay'
).split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

const SKIP = new Set((process.env.CCW_SKIP || '').split(',').map(s => s.trim()).filter(Boolean));

// --- tiny CSS rule scanner（與 sibling gate 同法）：回傳 [{selector, body}] ---
function scanRules(css) {
  const rules = [];
  css = css.replace(/\/\*[\s\S]*?\*\//g, ''); // 去註解
  let i = 0, n = css.length;
  while (i < n) {
    const open = css.indexOf('{', i);
    if (open < 0) break;
    const close = css.indexOf('}', open);
    if (close < 0) break;
    const sel = css.slice(i, open).trim();
    const body = css.slice(open + 1, close).trim();
    if (sel.startsWith('@')) {
      for (const r of scanRules(body)) rules.push(r); // 遞迴進 @media 等
    } else if (sel && !sel.includes('{')) {
      rules.push({ selector: sel, body });
    }
    i = close + 1;
  }
  return rules;
}

// 把宣告 body 解析成 prop->value（lowercase、last-wins）
function declMap(body) {
  const map = {};
  for (const d of body.split(';')) {
    const idx = d.indexOf(':');
    if (idx < 0) continue;
    const prop = d.slice(0, idx).trim().toLowerCase();
    const val = d.slice(idx + 1).trim().toLowerCase();
    if (prop) map[prop] = val;
  }
  return map;
}

// 取選擇器最右側 compound（styled subject），再抽其 class tokens
function rightmostCompound(selector) {
  // 逗號群組已在呼叫端拆開；這裡只處理單一選擇器
  // 以 combinator（空白 / > / + / ~）切，取最後一段
  const parts = selector.split(/\s*[>+~]\s*|\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : selector;
}
function classTokens(compound) {
  const out = [];
  const re = /\.([a-zA-Z_][\w-]*)/g;
  let m;
  while ((m = re.exec(compound))) out.push(m[1].toLowerCase());
  return out;
}

function hasWord(token, words) {
  return words.some(w => token.includes(w));
}

// 判定「最右側 compound 是否為內容卡」
function isContentCardSubject(selector) {
  const compound = rightmostCompound(selector);
  const toks = classTokens(compound);
  if (!toks.length) return false;              // 主體是純元素（如 `i`/`svg`）→ 非內容卡
  if (toks.some(t => hasWord(t, EXCLUDE_WORDS))) return false; // 主體含排除詞 → 版面/控件
  return toks.some(t => hasWord(t, CARD_WORDS)); // 主體含卡片詞 → 內容卡
}

// ── (A) 翻卡卡面豁免用 ──
const FLIP_FACE_SUFFIX = /-(front|back|face|inner)$/; // (A1) 卡面命名字尾
// 判一條 rule 的 body 是否帶 flip 語意（3D 翻卡）
function bodyIsFlip(decls) {
  const ts = decls['transform-style'] || '';
  const tf = decls['transform'] || '';
  return ts.includes('preserve-3d') || /rotatey\s*\(/.test(tf);
}
// 從單一選擇器抽「所有 compound 的所有 class token」（不只最右側）——找翻卡脈絡要掃整條
function allClassTokens(selector) {
  const out = [];
  const re = /\.([a-zA-Z_][\w-]*)/g;
  let m;
  while ((m = re.exec(selector))) out.push(m[1].toLowerCase());
  return out;
}

// ── (B) 格線磚豁免用 ──
const CONTAINER_SEG = new Set(['grid', 'grids', 'list', 'wrap', 'cards', 'tiles']);
// token 去掉最後一個 `-段` 得 base；無連字號則回傳 null（不參與 base 配對）
function tokenBase(token) {
  const i = token.lastIndexOf('-');
  return i > 0 ? token.slice(0, i) : null;
}
function tokenLastSeg(token) {
  const i = token.lastIndexOf('-');
  return i > 0 ? token.slice(i + 1) : token;
}
// 判一條 rule 的 body 是否為「格線/可換行 flex 容器」
function bodyIsGridContainer(decls) {
  const disp = decls['display'] || '';
  if (disp.includes('grid') || disp.includes('inline-grid')) return true;
  if (disp.includes('flex')) {
    const fw = decls['flex-wrap'] || '';
    const ff = decls['flex-flow'] || '';
    if (fw.includes('wrap') && !fw.includes('nowrap')) return true;
    if (ff.includes('wrap') && !ff.includes('nowrap')) return true;
  }
  return false;
}

/*
 * 針對「單一檔」的規則集，預先建兩個索引（§6.5 誤報豁免用）：
 *   flipTokens — 所有「具 flip 語意的 rule」其選擇器出現過的 class token 集合（翻卡脈絡的 (A3) 用）。
 *   gridBases  — 所有「格線容器 rule」其容器 token 的 base 集合（格線磚 (B) 用）。
 * 兩者皆只看同一檔（內嵌 <style> 或同一 .css），不跨檔，保守。
 */
function buildFileContext(fileRules) {
  const flipTokens = new Set();
  const gridBases = new Set();
  for (const r of fileRules) {
    const decls = declMap(r.body);
    const flip = bodyIsFlip(decls);
    const grid = bodyIsGridContainer(decls);
    for (const sub of r.selector.split(',').map(s => s.trim()).filter(Boolean)) {
      const toks = allClassTokens(sub);
      // flip 脈絡：body 帶 flip，或選擇器本身含 `.flipped` 狀態（翻面狀態 rule）
      const selHasFlipped = toks.includes('flipped');
      if (flip || selHasFlipped) {
        for (const t of toks) flipTokens.add(t);
      }
      if (grid) {
        for (const t of toks) {
          if (CONTAINER_SEG.has(tokenLastSeg(t))) {
            const base = tokenBase(t);
            if (base) gridBases.add(base);
          }
        }
      }
    }
  }
  return { flipTokens, gridBases };
}

// (A) 這個 card 子選擇器是否為翻卡卡面/脈絡 → 豁免
function isFlipFaceExempt(subSelector, decls, ctx) {
  const toks = classTokens(rightmostCompound(subSelector));
  if (toks.some(t => FLIP_FACE_SUFFIX.test(t))) return true; // (A1) 字尾
  if (bodyIsFlip(decls)) return true;                        // (A2) 自身 body flip
  if (toks.some(t => ctx.flipTokens.has(t))) return true;    // (A3) 同檔翻卡脈絡
  return false;
}

// (B) 這個 card 子選擇器是否為某格線的磚 → 豁免
function isGridTileExempt(subSelector, ctx) {
  const toks = classTokens(rightmostCompound(subSelector));
  for (const t of toks) {
    if (tokenLastSeg(t) === 'card' || tokenLastSeg(t) === 'tile') {
      const base = tokenBase(t); // 如 id-card → id、sf-card → sf
      if (base && ctx.gridBases.has(base)) return true;
    }
  }
  return false;
}

const FIXED_RE = /^[0-9.]+(px|rem|em)$/; // 固定寬魔術數字

function classify(decls) {
  const w = decls['width'];
  if (w === undefined) return null;
  if (w === 'fit-content' || w === 'max-content') return null; // 合規（shrink-to-fit）
  const mw = decls['max-width'];
  const hasCap = mw !== undefined && mw !== 'none'; // max-width:none 不算 cap
  if (hasCap) return null; // 有上限 → 合規
  if (w === '100%') return 'width:100% 無 max-width 上限（全寬無 cap，違 R-STYLE-3「不得全寬」）';
  if (FIXED_RE.test(w)) return `固定 width:${w} 無 max-width 上限（違 R-STYLE-3「不得固定寬」）`;
  return null; // 其他（%<100、auto、vw…）保守不報
}

// --- 蒐集輸入檔 ---
function gather() {
  const entries = []; // {file(顯示用), css}
  let dirFiles = [];
  try { dirFiles = fs.readdirSync(DIR); } catch (e) { return entries; }
  // 根層 *.css
  for (const f of dirFiles.filter(f => f.endsWith('.css') && !SKIP.has(f)).sort()) {
    entries.push({ file: f, css: safeRead(path.join(DIR, f)) });
  }
  // assets/*.css
  const assetsDir = path.join(DIR, 'assets');
  try {
    for (const f of fs.readdirSync(assetsDir).filter(f => f.endsWith('.css') && !SKIP.has('assets/' + f)).sort()) {
      entries.push({ file: 'assets/' + f, css: safeRead(path.join(assetsDir, f)) });
    }
  } catch (e) { /* 無 assets 目錄 */ }
  // 根層 *.html 內嵌 <style>
  for (const f of dirFiles.filter(f => f.endsWith('.html') && !SKIP.has(f)).sort()) {
    const css = inlineStyles(safeRead(path.join(DIR, f)));
    if (css.trim()) entries.push({ file: f, css });
  }
  return entries;
}
function safeRead(p) { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; } }
function inlineStyles(html) {
  const out = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out.join('\n');
}

// --- 主流程 ---
const entries = gather();
let rulesExamined = 0;
const violations = []; // {file, selector, reason}

for (const { file, css } of entries) {
  const fileRules = scanRules(css);
  const ctx = buildFileContext(fileRules); // 同檔翻卡脈絡 / 格線容器索引
  for (const r of fileRules) {
    rulesExamined++;
    // 逗號群組：逐一判定（任一子選擇器是內容卡即檢）
    const subSelectors = r.selector.split(',').map(s => s.trim()).filter(Boolean);
    const cardSubs = subSelectors.filter(isContentCardSubject);
    if (!cardSubs.length) continue;
    const decls = declMap(r.body);
    const reason = classify(decls);
    if (!reason) continue;
    for (const s of cardSubs) {
      // 結構性豁免（誤報修正）：翻卡卡面/脈絡，或某格線的磚 → 跳過
      if (isFlipFaceExempt(s, decls, ctx)) continue;
      if (isGridTileExempt(s, ctx)) continue;
      violations.push({ file, selector: s, reason });
    }
  }
}

console.log(`content_card_width_lint: ${rulesExamined} CSS rule(s) examined across ${entries.length} file(s) under ${DIR}`);
if (rulesExamined === 0) {
  console.error(`\ncontent_card_width_lint: ZERO CSS rules examined — no *.css / assets/*.css / <style> found.`);
  console.error(`對任何這種輸入，違規數都保證為 0；那種 0 是空洞的。此回合不得記為 clean round。`);
  console.error(`請指向真有 CSS 的 corpus，或接受「此 gate 不適用於此輸入」——但別和「你的 corpus 乾淨」混為一談。`);
  process.exit(NOTHING_EXAMINED);
}

console.log('=== content-card adaptive-width (R-STYLE-3 / R-STYLE-4) ===');
console.log(`VIOLATIONS: ${violations.length}\n`);
for (const v of violations) {
  console.log(`${v.file}: ${v.selector}: ${v.reason}`);
}
console.log(`\nVIOLATIONS=${violations.length}  RULES=${rulesExamined}  FILES=${entries.length}`);
process.exit(Math.min(violations.length, 90));
