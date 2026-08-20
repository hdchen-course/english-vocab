#!/usr/bin/env node
/*
 * cloze_leak_guard.js — deterministic regression guard for CEFR cloze answer-leaks.
 *
 * Objective class (see k12-defect-class-checklist 類12 cloze-leak): a fill-in-the-blank
 * (cloze) item must NOT contain its own answer word anywhere in the visible stem — e.g.
 * answer "state" inside "United States", "cause" inside "because", "user" inside "username".
 * Such leaks reveal the answer and destroy the item's discrimination.
 *
 * Only CEFR data files carry a `cloze` field. For every entry with a blanked cloze we check
 * whether the answer word (len>=3, case-insensitive) appears as a substring of the stem with
 * the blank removed. Any hit is a HARD FAIL.
 *
 * NOTE: the `cloze` field is display-only text (cefr_flashcard.html renders card.cloze
 * directly); it is INDEPENDENT of the audio-keyed `sentence` field, so fixing a leak by
 * rewording the cloze never desyncs audio.
 *
 * Usage: node tools/cloze_leak_guard.js    (exit 0 = PASS, exit 1 = leaks found)
 */
const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '..');
const files = fs.readdirSync(dir).filter(f => /^vocab_data_cefr.*\.js$/.test(f));

let checked = 0;
const leaks = [];

for (const f of files) {
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  // entries are flat object literals (arrays use [], no nested {}), so match {...} without braces inside
  const entryRe = /\{[^{}]*\}/g;
  let e;
  while ((e = entryRe.exec(src))) {
    const block = e[0];
    const wm = block.match(/word:"([^"]+)"/);
    const cm = block.match(/cloze:"([^"]*)"/);
    if (!wm || !cm) continue;
    const word = wm[1].toLowerCase().trim();
    const cloze = cm[1];
    if (!/_/.test(cloze)) continue; // no blank -> not a cloze item
    checked++;
    const stem = cloze.toLowerCase().replace(/_+/g, ' ');
    if (word.length >= 3 && stem.includes(word)) {
      leaks.push({ file: f, word, cloze });
    }
  }
}

if (leaks.length) {
  console.log('cloze_leak_guard: ' + leaks.length + ' answer-leak(s) — answer word appears in its own cloze stem:');
  for (const l of leaks) console.log('  [' + l.file + '] word="' + l.word + '" | ' + l.cloze);
  console.log('cloze_leak_guard: FAIL');
  process.exit(1);
}
console.log('cloze_leak_guard: PASS — 0 answer-leaks across ' + checked + ' CEFR cloze items (' + files.length + ' files).');
process.exit(0);
