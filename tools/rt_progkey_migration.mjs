/* rt_progkey_migration.mjs — 紅隊：舊 progKey → learning_progress_v1 additive 遷移
 * 證明：(1) 已完成舊 lesson → 新 unit mastered；(2) 舊 progKey 永不被刪/改；
 *       (3) idempotent（重跑結果不變、不重複）；(4) 未完成/無 key/未知→不遷移；
 *       (5) SafeStore 未載入→graceful no-op；(6) data.js 與來源一致。
 * 以 node 跑，mock localStorage + 載入真實 assets/safe_store.js + assets/learning_progress.js。
 * 用法：node tools/rt_progkey_migration.mjs   （exit 0＝全過；非 0＝有 case 失敗）
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

let fails = 0;
function ok(cond, msg) { if (cond) { console.log('  ✓', msg); } else { console.log('  ✗ FAIL:', msg); fails++; } }

// ---- mock localStorage ----
function makeLS(seed) {
  const m = Object.assign({}, seed || {});
  return {
    _m: m,
    getItem(k) { return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
    setItem(k, v) { m[k] = String(v); },
    removeItem(k) { delete m[k]; },
  };
}

// 乾淨載入 SafeStore + LearningProgress（綁到給定 localStorage）。回傳 { LP, g }
function freshModules(ls) {
  // 每次用全新 global，避免跨案例殘留；node 環境無 window/document
  const g = globalThis;
  g.localStorage = ls;
  delete g.SafeStore; delete g.LearningProgress; delete g.PROGKEY_MIGRATION;
  // 清 require 快取以重載模組（重綁 global.localStorage）
  for (const p of [require.resolve(path.join(ROOT, 'assets/safe_store.js')),
                   require.resolve(path.join(ROOT, 'assets/learning_progress.js'))]) delete require.cache[p];
  require(path.join(ROOT, 'assets/safe_store.js'));           // 設 global.SafeStore
  const LP = require(path.join(ROOT, 'assets/learning_progress.js'));
  return { LP, g };
}

const MAP = [
  { old_progKey: 'english_concepts_v1', lesson_id: 'plural', new_unit_id: 'eng.t_base.noun.regular-plural' },
  { old_progKey: 'english_tenses_v1', lesson_id: 'future', new_unit_id: 'eng.t_mid.verb.will-vs-going-to' },
  { old_progKey: 'english_tenses_v1', lesson_id: 'nothere', new_unit_id: 'eng.t_mid.verb.past-progressive' }, // 未完成
  { old_progKey: 'no_such_key_v1', lesson_id: 'x', new_unit_id: 'eng.t_base.noun.collective' },               // 無此 key
];

console.log('[RT] case 1：已完成 lesson 遷移 + 未完成/無 key 不遷移');
{
  const ls = makeLS({
    english_concepts_v1: JSON.stringify({ plural: true, other: true }),
    english_tenses_v1: JSON.stringify({ future: 1 }),            // future 完成、nothere 未出現
  });
  const { LP } = freshModules(ls);
  const r = LP.migrateFromProgKeys(MAP, ls);
  ok(r.migrated === 2, `migrated=2（plural+future）實際 ${r.migrated}`);
  ok(LP.getUnit('eng.t_base.noun.regular-plural')?.mastered === true, 'plural→regular-plural mastered');
  ok(LP.getUnit('eng.t_mid.verb.will-vs-going-to')?.mastered === true, 'future→will-vs-going-to mastered');
  ok(LP.getUnit('eng.t_mid.verb.past-progressive') === null, '未完成 lesson 不遷移（past-progressive 無紀錄）');
  ok(LP.getUnit('eng.t_base.noun.collective') === null, '無 key 不遷移（collective 無紀錄）');
  // (2) 舊 progKey 原封不動
  ok(ls.getItem('english_concepts_v1') === JSON.stringify({ plural: true, other: true }), '舊 english_concepts_v1 原封未改');
  ok(ls.getItem('english_tenses_v1') === JSON.stringify({ future: 1 }), '舊 english_tenses_v1 原封未改');
}

console.log('[RT] case 2：idempotent（重跑不變、不重複 migrate）');
{
  const ls = makeLS({ english_concepts_v1: JSON.stringify({ plural: true }) });
  const { LP } = freshModules(ls);
  const r1 = LP.migrateFromProgKeys(MAP, ls);
  const r2 = LP.migrateFromProgKeys(MAP, ls);
  ok(r1.migrated === 1, `首跑 migrated=1 實際 ${r1.migrated}`);
  ok(r2.migrated === 0 && r2.alreadyDone === 1, `重跑 migrated=0 alreadyDone=1 實際 m=${r2.migrated} a=${r2.alreadyDone}`);
  ok(LP.getUnit('eng.t_base.noun.regular-plural')?.mastered === true, '重跑後仍 mastered（未退化）');
}

console.log('[RT] case 3：SafeStore 未載入 → graceful no-op');
{
  const ls = makeLS({ english_concepts_v1: JSON.stringify({ plural: true }) });
  const g = globalThis;
  g.localStorage = ls;
  delete g.SafeStore; delete g.LearningProgress;
  for (const p of [require.resolve(path.join(ROOT, 'assets/learning_progress.js'))]) delete require.cache[p];
  const LP = require(path.join(ROOT, 'assets/learning_progress.js')); // 不載 safe_store → 無 SafeStore
  const r = LP.migrateFromProgKeys(MAP, ls);
  ok(r.available === false, 'SafeStore 缺 → available:false no-op');
  ok(ls.getItem('english_concepts_v1') === JSON.stringify({ plural: true }), '舊 key 仍原封');
}

console.log('[RT] case 4：執行期 data.js 與來源一致 + 所有 new_unit_id 存在');
{
  const fs = require('fs');
  const txt = fs.readFileSync(path.join(ROOT, 'assets/progkey_migration.data.js'), 'utf-8');
  const mm = txt.match(/window\.PROGKEY_MIGRATION\s*=\s*(\[[\s\S]*\]);/);
  ok(!!mm, 'data.js 含 window.PROGKEY_MIGRATION 陣列');
  const entries = mm ? JSON.parse(mm[1]) : [];
  const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'authoring/progkey_migration.json'), 'utf-8'));
  const srcEntries = (src.entries || []).filter(e => e.old_progKey && e.lesson_id && e.new_unit_id)
    .map(e => ({ old_progKey: e.old_progKey, lesson_id: e.lesson_id, new_unit_id: e.new_unit_id }));
  ok(JSON.stringify(entries) === JSON.stringify(srcEntries), `data.js(${entries.length}) 與來源 entries(${srcEntries.length}) 一致`);
  const idx = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/units_index.json'), 'utf-8')).units.map(u => u.unit_id));
  const bad = entries.filter(e => !idx.has(e.new_unit_id));
  ok(bad.length === 0, `data.js 所有 new_unit_id 存在於 units_index（invalid ${bad.length}）`);
}

console.log(fails === 0 ? '\n[RT] ALL PASS ✅' : `\n[RT] ${fails} 個 case FAIL ❌`);
process.exit(fails === 0 ? 0 : 1);
