// safe_store_selftest.mjs — safe_store.js 的紅隊自測（§6.3/§7.1）。
// 執行：node tools/safe_store_selftest.mjs   （EXIT 0=全過，1=有失敗）
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const require = createRequire(import.meta.url);
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SafeStore = require(join(ROOT, 'safe_store.js'));

// 假 localStorage
function fakeLS(seed) {
  const m = Object.assign({}, seed || {});
  return {
    _m: m,
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
  };
}

const SCHEMA = (storage) => ({
  storageKey: 'player_profile_v1', schemaVersion: 2, storage,
  defaults: { totalXp: 0, coins: 0, ownedItems: {}, badges: {},
    equippedSkin: null, equippedBorder: null, equippedMascot: null, equippedAvatar: null,
    displayName: '', activity: {} },
  fields: { totalXp: 'monotonic-max', coins: 'monotonic-max', longestStreak: 'monotonic-max',
    ownedItems: 'union-set', badges: 'union-set',
    equippedSkin: 'last-write', equippedBorder: 'last-write', equippedMascot: 'last-write', equippedAvatar: 'last-write',
    displayName: 'last-write', activity: 'union-object' },
  equippableTypes: ['skin', 'border', 'mascot', 'avatar'],
  migrations: { 2: (p) => { if (p.xp !== undefined && p.totalXp === undefined) { p.totalXp = p.xp; delete p.xp; } return p; } },
});

let pass = 0, fail = 0;
function ok(cond, msg) { (cond ? (pass++, console.log('  [OK] ' + msg)) : (fail++, console.log('  [BAD] ' + msg))); }

console.log('=== safe_store 紅隊 selftest ===');

// 1) 壞檔不重設：解析失敗 → 備份 corrupt key、保留記憶體/預設、不空白覆寫主 key
{
  const ls = fakeLS({ player_profile_v1: '{壞掉的 JSON' });
  const s = SafeStore.create(SCHEMA(ls));
  const p = s.load();
  const corruptKeys = Object.keys(ls._m).filter(k => k.startsWith('player_profile_v1__corrupt_'));
  ok(ls._m['player_profile_v1'] === '{壞掉的 JSON', '壞檔主 key 未被空白覆寫（保留原字串）');
  ok(corruptKeys.length === 1, '壞檔已備份到 __corrupt_<ts>');
  ok(p && p.totalXp === 0, 'load 回退到預設/記憶體值（非 null）');
}

// 2) additive：舊檔缺新預設欄位 → 補預設、既有 earned 不被覆蓋
{
  const ls = fakeLS({ player_profile_v1: JSON.stringify({ version: 2, totalXp: 500, ownedItems: { 'skin-a': true } }) });
  const s = SafeStore.create(SCHEMA(ls));
  const p = s.load();
  ok(p.totalXp === 500, 'additive：既有 totalXp=500 保留');
  ok(p.ownedItems['skin-a'] === true, 'additive：既有 ownedItems 保留');
  ok(p.coins === 0 && p.equippedSkin === null, 'additive：缺的新欄位補預設（未覆蓋既有）');
}

// 3) migrate 偵測舊檔（讀 profile.version，非自我恆等常數）：v1 舊檔 {xp} → v2 {totalXp}
{
  const ls = fakeLS({ player_profile_v1: JSON.stringify({ version: 1, xp: 300 }) });
  const s = SafeStore.create(SCHEMA(ls));
  const p = s.load();
  ok(p.totalXp === 300 && p.xp === undefined, 'migrate v1→v2：xp 改名 totalXp 成功觸發');
  ok(p.version === 2, 'migrate 後 version 升到 2');
  // 自我恆等 bug 反例：若 migrate 讀的是常數，舊 v1 檔不會被偵測 → 上面會失敗
}
// 3b) migrate 缺步驟 → 保留原值、不丟棄
{
  const sc = SCHEMA(fakeLS({})); sc.schemaVersion = 3; // 無 migrations[3]
  const s = SafeStore.create(sc);
  const out = s._migrate({ version: 2, totalXp: 10 });
  ok(out.totalXp === 10 && out.version === 2, 'migrate 缺步驟 → 保留原值不丟棄（停在 v2）');
}

// 4) earned union/max 永不縮小；equipped<Type> last-write
{
  const s = SafeStore.create(SCHEMA(fakeLS({})));
  const base = { totalXp: 900, ownedItems: { a: true, b: true }, equippedSkin: 'skin-x' };
  const incoming = { totalXp: 100, ownedItems: { c: true }, equippedSkin: 'skin-y' };
  const m = s._merge(base, incoming);
  ok(m.totalXp === 900, 'monotonic-max：100 合進 900 仍 900（不倒退）');
  ok(m.ownedItems.a && m.ownedItems.b && m.ownedItems.c, 'union-set：owned 聯集不丟');
  ok(m.equippedSkin === 'skin-y', 'last-write：equippedSkin 取新值');
}

// 5) 完整性鐵律：equippable 型別缺 equipped<Type> 策略 → create 應 throw（FAIL-closed）
{
  const bad = SCHEMA(fakeLS({}));
  delete bad.fields.equippedMascot; // 移除 mascot 策略，但仍在 equippableTypes
  let threw = false;
  try { SafeStore.create(bad); } catch (e) { threw = /mascot/.test(e.message); }
  ok(threw, '缺某 equippable 型別的 equipped<Type> 策略 → create throw（型別漂移防呆）');
}
// 5b) 未知策略名 → throw
{
  const bad = SCHEMA(fakeLS({})); bad.fields.totalXp = 'bogus';
  let threw = false; try { SafeStore.create(bad); } catch (e) { threw = /bogus/.test(e.message); }
  ok(threw, '未知合併策略名 → create throw');
}

// 6) 跨分頁 incoming 合併不倒退（earned union/max）
{
  const s = SafeStore.create(SCHEMA(fakeLS({})));
  s.save({ version: 2, totalXp: 700, ownedItems: { a: true }, equippedSkin: 'x' });
  const after = s._mergeIncoming({ version: 2, totalXp: 50, ownedItems: { b: true }, equippedSkin: 'y' });
  ok(after.totalXp === 700, '跨分頁：totalXp 不被較小值蓋掉');
  ok(after.ownedItems.a && after.ownedItems.b, '跨分頁：owned 聯集');
  ok(after.equippedSkin === 'y', '跨分頁：equipped last-write');
}

// 7) normalize 不得注入 version（否則舊檔偵測不到）
{
  const s = SafeStore.create(SCHEMA(fakeLS({})));
  const n = s._normalize({ totalXp: 1 });
  ok(n.version === undefined, 'normalize 不注入 version 預設（RT-4：留給 migrate 判斷）');
}

console.log('RESULT: ' + (fail === 0 ? 'PASS ✅' : 'FAIL ❌') + ' (' + pass + ' pass, ' + fail + ' fail)');
process.exit(fail === 0 ? 0 : 1);
