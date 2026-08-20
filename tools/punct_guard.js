#!/usr/bin/env node
/*
 * punct_guard.js — deterministic guard against half-width punctuation in Chinese-visible text.
 *
 * WHY: half-width ！？，：；inside Chinese sentences kept getting rediscovered one place at a
 * time (R7 省略號, R21 physics L15 commas, R30 ~120 CJK-adjacent ！？) because every prior fix was
 * finding-scoped, never book-wide, and there was no guard. This closes the class: it scans all
 * game HTML for a CJK ideograph immediately followed by a half-width ! ? (and, in strict mode,
 * ，：；) — the unambiguous "should be full-width" case. English text ("cute!"), code, and numbers
 * (1,000 / 3:30) are NOT CJK-adjacent so they don't match.
 *
 * Exit 1 + list if any CJK-adjacent half-width ！？ remain (hard fail — always wrong in zh text).
 * ，：；are reported as WARN (usually should be full-width too, but occasionally legit next to a
 * number/latin inside a CJK run — human glance). Run every audit round (crosscut-a11y / design dim).
 */
const fs = require('fs');
const DIR = __dirname + '/../';
// Scan game HTML + vocab data (chinese/tip fields are student-visible zh prose). Etymology tips
// mix latin roots with half-width parens as notation — those are NOT prose punctuation, so only
// the hard-fail signals (！？ after CJK, ，：； with CJK on both sides) apply; one-side WARNs in
// vocab are mostly latin-adjacent formula punctuation and are informational only.
const files = fs.readdirSync(DIR).filter(f => (f.endsWith('.html') && f !== 'cses_hints.html') || /^vocab_data_.*\.js$/.test(f));
const CJK = '[\\u4e00-\\u9fff]';
// HARD fail: ！？ right after CJK (always wrong in zh) OR ，：； with CJK on BOTH sides (clear zh prose)
const failBang = new RegExp(CJK + '[!?]', 'g');
const failComma = new RegExp(CJK + '[,:;]' + '(?=' + CJK + ')', 'g');
// WARN: ，：； after CJK but NOT both-sides (latin/number/space next — usually should be full-width, occasionally legit)
const warnRe = new RegExp(CJK + '[,:;](?![\\u4e00-\\u9fff])', 'g');

const fails = [], warns = [];
for (const f of files) {
  const src = fs.readFileSync(DIR + f, 'utf8');
  src.split('\n').forEach((ln, i) => {
    (ln.match(failBang) || []).forEach(() => fails.push(`${f}:${i + 1} [！？] | ${ln.trim().slice(0, 88)}`));
    (ln.match(failComma) || []).forEach(m => fails.push(`${f}:${i + 1} [${m}] | ${ln.trim().slice(0, 88)}`));
    (ln.match(warnRe) || []).forEach(m => warns.push(`${f}:${i + 1} [${m}] | ${ln.trim().slice(0, 78)}`));
  });
}
if (warns.length) {
  console.log(`punct_guard: ${warns.length} warn — CJK-adjacent half-width ，：； (usually should be full-width; verify not a number/latin context):`);
  warns.slice(0, 40).forEach(w => console.log('  ' + w));
  if (warns.length > 40) console.log(`  … +${warns.length - 40} more`);
}
if (!fails.length) { console.log('punct_guard: PASS — 0 CJK-adjacent half-width ！？ in Chinese-visible text.'); process.exit(0); }
console.log(`punct_guard: FAIL — ${fails.length} CJK-adjacent half-width ！？ (always wrong in zh text):`);
fails.forEach(x => console.log('  ' + x));
process.exit(1);
