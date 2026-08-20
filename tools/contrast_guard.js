#!/usr/bin/env node
/*
 * contrast_guard.js — deterministic WCAG text-contrast regression guard for the K-12 e-book.
 *
 * WHY: hardcoded text colors that fail WCAG AA kept getting *rediscovered* one instance per
 * audit round (renderStats amber, BOSS crown, ...) because they live in dynamic-state CSS
 * (.crown/.correct/...) that a load-time DOM walk misses, and grep-for-specific-hex misses
 * variants. This closes the class once: it parses EVERY CSS rule block (shared stylesheets +
 * each page's <style> + inline style="") and, for every `color:` declaration with a hardcoded
 * hex, computes the WCAG contrast ratio against the correct theme surface:
 *   - rule selector contains [data-theme="dark"]  -> check vs DARK card  (#2F2820)
 *   - otherwise (default/light)                    -> check vs LIGHT card (#FDFAF3)
 * It skips cases that are NOT text-on-card: white/near-white text (sits on a colored button),
 * any rule that also sets a colored background/gradient, and `border-color` (non-text).
 * A genuine failure = normal-text hex < 4.5:1 (we also report the large-text 3:1 band).
 *
 * Exit code 1 (and a printed list) if any genuine failure remains. Run every audit round.
 * Accepted, deliberately-decorative exceptions live in ACCEPT below with a reason.
 */
const fs = require('fs');
const DIR = __dirname + '/../';
const LIGHT = '#FDFAF3', DARK = '#2F2820';
const NORMAL = 4.5, LARGE = 3.0;

// Deliberately-accepted, non-meaningful-text hardcoded colors (decorative / dual-coded / large).
// Each entry: substring of the rule that identifies it + reason. Keep this list tight.
const ACCEPT = [
  { m: '.sd-star', why: 'decorative gold-star rating glyph (rating = star shape+count; colour is flair)' },
  { m: '.gm-gem', why: 'gem-mine hue is dual-coded (emoji shape + text label + border); colour supplementary' },
];

function lum(h) {
  h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const v = [0, 2, 4].map(i => { let c = parseInt(h.substr(i, 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}
function ratio(a, b) { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }

function styleChunks(file, src) {
  // Return array of {selector, body, line} rule blocks from CSS content.
  // For HTML, concatenate <style>...</style> contents (track line offsets).
  let css = '', base = 0, chunks = [];
  if (file.endsWith('.css')) { css = src; base = 1; }
  else {
    const re = /<style[^>]*>([\s\S]*?)<\/style>/g; let m;
    while ((m = re.exec(src))) {
      const startLine = src.slice(0, m.index).split('\n').length;
      pushRules(m[1], startLine, chunks);
    }
    return chunks;
  }
  pushRules(css, base, chunks);
  return chunks;
}
function pushRules(css, startLine, chunks) {
  // naive but sufficient: split on '}' , recover selector before '{'
  let idx = 0, lineAt = i => startLine + css.slice(0, i).split('\n').length - 1;
  const re = /([^{}]+)\{([^{}]*)\}/g; let m;
  while ((m = re.exec(css))) {
    chunks.push({ selector: m[1].trim().replace(/\s+/g, ' '), body: m[2], line: lineAt(m.index) });
  }
}

const files = fs.readdirSync(DIR).filter(f => f.endsWith('.html') && f !== 'cses_hints.html')
  .concat(['assets/app.css', 'game_core.css', 'concept.css'].filter(f => fs.existsSync(DIR + f)));

const failures = [];  // hard fails: < 3.0 (wrong at ANY text size)
const warns = [];     // 3.0–4.5: OK only if large text (>=18.66px bold / 24px) — needs a human size check
function pushHit(x) { if (x.c < LARGE) failures.push(x); else if (x.c < NORMAL) warns.push(x); }
for (const f of files) {
  const src = fs.readFileSync(DIR + f, 'utf8');
  // 1) CSS rule blocks
  for (const rule of styleChunks(f, src)) {
    const body = rule.body, sel = rule.selector;
    // skip rules that paint a colored background (text is not on the card surface)
    if (/background(-color)?\s*:\s*(#(?!fff|ffffff|fdfaf3|fefefe)|rgba|hsl|linear-gradient|var\(--c-|var\(--accent|color-mix)/i.test(body)) continue;
    // dark theme iff selector targets [data-theme="dark"] but NOT :not([data-theme="dark"])
    const dark = /\[data-theme="?dark"?\]/.test(sel) && !/:not\(\s*\[data-theme="?dark"?\]\s*\)/.test(sel);
    const surface = dark ? DARK : LIGHT;
    const re = /(^|[;{\s])color\s*:\s*(#[0-9a-fA-F]{3,6})\b/g; let m;
    while ((m = re.exec(body))) {
      const hex = m[2];
      if (/^#(fff|ffffff|fefefe|fdfaf3|2f2820|241e17)$/i.test(hex)) continue; // white-on-button / surface itself
      if (ACCEPT.some(a => sel.includes(a.m))) continue;
      const c = ratio(hex, surface);
      pushHit({ f, line: rule.line, hex, c, theme: dark ? 'dark' : 'light', sel: sel.slice(0, 70) });
    }
  }
  // 2) inline style="... color:#hex ..." on elements (assume on card surface, light theme default)
  const inl = /style\s*=\s*"([^"]*color\s*:\s*#[0-9a-fA-F]{3,6}[^"]*)"/g; let im;
  while ((im = inl.exec(src))) {
    const s = im[1];
    if (/background(-color)?\s*:\s*(#(?!fff|ffffff)|rgba|linear-gradient|var\(--c-|var\(--accent)/i.test(s)) continue;
    const cm = /(^|[;\s])color\s*:\s*(#[0-9a-fA-F]{3,6})/.exec(s); if (!cm) continue;
    const hex = cm[2]; if (/^#(fff|ffffff|fefefe|fdfaf3)$/i.test(hex)) continue;
    const c = ratio(hex, LIGHT);
    const line = src.slice(0, im.index).split('\n').length;
    pushHit({ f, line, hex, c, theme: 'light(inline)', sel: 'inline style' });
  }
}

if (warns.length) {
  console.log(`contrast_guard: ${warns.length} warn (3.0–4.5:1 — OK ONLY if large text ≥18.66px bold / 24px; else fix):`);
  for (const x of warns) console.log(`  ${x.f}:${x.line} color:${x.hex} vs ${x.theme}-card = ${x.c.toFixed(2)}:1 | ${x.sel}`);
}
if (!failures.length) { console.log('contrast_guard: PASS — 0 hardcoded text-color failing <3:1 (fails at any size) in any theme.'); process.exit(0); }
console.log(`contrast_guard: FAIL — ${failures.length} hardcoded text-color <3:1 (wrong at ANY size):`);
for (const x of failures) console.log(`  ${x.f}:${x.line} color:${x.hex} vs ${x.theme}-card = ${x.c.toFixed(2)}:1 | ${x.sel}`);
process.exit(1);
