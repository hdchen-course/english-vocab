#!/usr/bin/env node
/*
 * design_consistency_gate.mjs — AC-STYLE-1 的專案 fail-closed gate（R-STYLE-1/-3/-4）。
 *
 * 契約（LEARNING_PATH_REBUILD_SPEC §6.5 R-STYLE-4 / AC-STYLE-1）：
 *   「design_consistency_gate.js（接用 static-doc-audit skill 既有同名 gate，Phase 0.5 前接線成
 *    專案 gate 並紅隊，SDA_CSS=app.css,game_core.css）＋ content-card lint」，指標＝重造=0、違規卡=0。
 *
 * 本專案 gate 做兩件事：
 *  (A) 共用元件重造檢查：呼叫 skill 的 design_consistency_gate.js，scoped 到學習路徑頁
 *      （index_new.html ＋ english_*.html），SDA_CSS=assets/app.css,assets/unit.css,game_core.css。
 *      skill gate exit：0=clean、1..90=DUPLICATE 數、99=examined nothing（canon 空→不算通過）。
 *  (B) content-card 自適應寬 lint（R-STYLE-3）：凡「答案/揭曉/題目/內容」卡（.gr-card/.gr-opt/
 *      .lp-scard/.lp-unitcard 及 inline 同義卡）不得以固定 px `width`／窄 `max-width` 造「置中窄島」，
 *      須自適應填滿欄寬（width:100% 或不設固定寬）。命中固定窄寬＝違規卡。
 *
 * 用法：node tools/design_consistency_gate.mjs [--verify|--selftest]
 * EXIT：0=通過（重造0＋違規卡0）；1..=違規數；2=selftest 失敗；99=skill gate examined nothing。
 */
import { execFileSync } from 'child_process';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SKILL_GATE = join(homedir(), '.claude/skills/static-doc-audit/scripts/design_consistency_gate.js');
const CANON_CSS = 'assets/app.css,assets/unit.css,game_core.css';

// 內容卡 class（學習路徑共用元件＋ bespoke 同義）——這些卡必須自適應寬（R-STYLE-3）。
const CARD_CLASSES = [
  'gr-card', 'gr-opt', 'gr-en', 'zh-hint',            // 單元頁教學/題目/內容卡（unit.css）
  'lp-scard', 'lp-unitcard', 'lp-navitem',            // hub 分區/單元/導覽卡
  'ea-opt', 'ma-opt', 'id-opt', 'sp-unit',            // bespoke 英語頁選項/單元卡
];
// 違規：卡類 class 的規則體設固定 px 寬或窄 max-width（置中窄島）。width:100%/auto/fit-content 允許。
const FIXED_W = /\b(?:max-)?width\s*:\s*(\d{2,4})px/gi;
const ISLAND_MAX = 520;  // < 520px 的固定卡寬視為「置中窄島」嫌疑（學習路徑欄寬遠大於此）

function inlineStyles(html) {
  const out = [];
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/gi; let m;
  while ((m = re.exec(html))) out.push(m[1]);
  return out.join('\n');
}
function stripComments(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ''); }

// 掃一段 css：回傳 [{selector, px}]，限卡類 class 且設固定窄寬者
function scanCards(css) {
  css = stripComments(css);
  const hits = [];
  // 粗略切 "sel { body }"
  const re = /([^{}]+)\{([^{}]*)\}/g; let m;
  while ((m = re.exec(css))) {
    const sel = m[1].trim(), body = m[2];
    if (!CARD_CLASSES.some(c => new RegExp(`\\.${c}\\b`).test(sel))) continue;
    let w; FIXED_W.lastIndex = 0;
    while ((w = FIXED_W.exec(body))) {
      const px = parseInt(w[1], 10);
      if (px < ISLAND_MAX) hits.push({ selector: sel, px });
    }
  }
  return hits;
}

function lpFiles() {
  const fs_ = readdirSync(ROOT);
  const files = ['index_new.html', ...fs_.filter(f => /^english_.*\.html$/.test(f))];
  return files.filter(f => existsSync(join(ROOT, f)));
}

function runReuse() {
  // 將學習路徑頁 stage 到臨時目錄跑 skill gate（skill gate 掃 dir 下所有 .html）
  const stage = join(ROOT, `.sda_dc_stage_${process.pid}`);
  execFileSync('mkdir', ['-p', stage]);
  try {
    for (const f of lpFiles()) execFileSync('cp', [join(ROOT, f), join(stage, f)]);
    try {
      const out = execFileSync('node', [SKILL_GATE, stage], {
        env: { ...process.env, SDA_CSS: CANON_CSS }, encoding: 'utf8',
      });
      return { code: 0, out };
    } catch (e) {
      return { code: e.status ?? 1, out: (e.stdout || '') + (e.stderr || '') };
    }
  } finally {
    execFileSync('rm', ['-rf', stage]);
  }
}

function runContentCardLint() {
  const hits = [];
  // unit.css + app.css（共用元件）
  for (const css of ['assets/unit.css', 'assets/app.css']) {
    const p = join(ROOT, css);
    if (existsSync(p)) for (const h of scanCards(readFileSync(p, 'utf8'))) hits.push({ file: css, ...h });
  }
  // 各學習路徑頁 inline style
  for (const f of lpFiles()) {
    for (const h of scanCards(inlineStyles(readFileSync(join(ROOT, f), 'utf8')))) hits.push({ file: f, ...h });
  }
  return hits;
}

function selftest() {
  let ok = true;
  const good = '.gr-card{ width:100%; padding:14px; } .lp-scard{ border-radius:14px; }';
  if (scanCards(good).length !== 0) { console.log('  [BAD] 自適應卡(width:100%)→應 ALLOW'); ok = false; }
  else console.log('  [OK] 自適應卡(width:100%)→ALLOW');
  const bad = '.gr-card{ width:360px; } .gr-opt{ max-width:300px; }';
  if (scanCards(bad).length !== 2) { console.log('  [BAD] 固定窄寬卡(360/300px)→應 DENY×2'); ok = false; }
  else console.log('  [OK] 固定窄寬卡(360px/max-width300px)→DENY');
  // 非卡類固定寬不誤判
  const nonCard = '.sidebar{ width:248px; } .foo-thumb{ width:40px; }';
  if (scanCards(nonCard).length !== 0) { console.log('  [BAD] 非卡類固定寬→應 ALLOW'); ok = false; }
  else console.log('  [OK] 非卡類固定寬(sidebar/thumb)→ALLOW');
  // 寬卡（>=ISLAND_MAX）非窄島不誤判
  const wide = '.lp-scard{ width:900px; }';
  if (scanCards(wide).length !== 0) { console.log('  [BAD] 寬卡(900px≥島門檻)→應 ALLOW'); ok = false; }
  else console.log('  [OK] 寬卡(900px)→ALLOW');
  console.log('RESULT:', ok ? 'PASS ✅' : 'FAIL ❌');
  return ok;
}

const arg = process.argv[2] || '--verify';
if (arg === '--selftest') {
  console.log('=== design_consistency_gate (project) --selftest ===');
  process.exit(selftest() ? 0 : 2);
}
// --verify
if (!existsSync(SKILL_GATE)) { console.error(`fail-closed：找不到 skill gate ${SKILL_GATE}`); process.exit(99); }
console.log('=== AC-STYLE-1 專案 design_consistency_gate --verify ===');
const reuse = runReuse();
process.stdout.write(reuse.out);
if (reuse.code === 99) { console.error('skill gate examined nothing（canon 空）→ fail-closed'); process.exit(99); }
const cards = runContentCardLint();
console.log(`\n--- content-card 自適應寬 lint（R-STYLE-3）---`);
for (const h of cards) console.log(`  [card] ${h.file}：${h.selector} 固定窄寬 ${h.px}px（置中窄島嫌疑，應自適應填欄寬）`);
const dup = reuse.code === 0 ? 0 : reuse.code;
const total = dup + cards.length;
console.log(`\nRESULT(AC-STYLE-1): ${total === 0 ? 'PASS ✅' : 'FAIL ❌'}（重造 ${dup}、違規卡 ${cards.length}）`);
process.exit(Math.min(total, 98));
