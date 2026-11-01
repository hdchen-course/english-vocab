// reward_safety_gate.mjs — AC-REWARD-1 的 RUNTIME「獎勵／進度 永不消失」紅隊 gate（§7.1／§7.2／§7.3／§6.3）。
// ---------------------------------------------------------------------------------------------------
// 這是 acceptance_criteria.json 的 AC-REWARD-1 所接線的工具（qualification=--selftest、evidence=--verify）。
// 靜態 DATA 層（catalog baseline／retire-not-delete／grant-provenance）已由 tools/reward_catalog_gate.py
// ＋ tools/reward_provenance_gate.py 覆蓋，本 gate 不重做那些靜態斷言；本 gate 補的是「真正在 headless
// 瀏覽器載入共用引擎（game_core.js ＋ assets/safe_store.js ＋ assets/learning_progress.js）後，施加敵意情境、
// 斷言『已賺得獎勵（player_profile_v1）＋逐單元進度（learning_progress_v1）在惡劣條件下存活』」的 RUNTIME 紅隊。
//
// 以 http（非 file://——/Volumes 下 headless Chrome 讀不到 file://）於代表性 learner 頁（預設
// english_addition.html，同載三支引擎）實際 render，透過 evaluateOnNewDocument 於引擎 init 前 seed
// localStorage 的已知 earned 狀態，再施加敵意條件並斷言存活。
//
// 介面（對齊姊妹 gate tools/a11y_gate.mjs 慣例）：
//   node tools/reward_safety_gate.mjs --verify    於真實站點跑 RT；人類報告印到 stderr；
//                                                  EXIT = 失敗 RT 數（含委派的 .py 靜態 gate 失敗），0＝全綠；夾在 1..255。
//   node tools/reward_safety_gate.mjs --selftest   離線 good/bad stub 自測：證明本 harness 本身能「判別」——
//                                                  BAD stub（壞檔覆寫／無 migrate／save 縮小 earned／reset 無手勢／無匯出匯入）
//                                                  必被每項斷言抓到（fire）；GOOD stub 必全過。期望全中才 exit 0，否則 exit 2。
//   無參數                                          印用法並 exit 2（同姊妹 gate）。
//
// RUNTIME 紅隊案例（本 gate 真跑；對應 §7.3）：
//   RT-1   賺得 skin → 升 schemaVersion（seed 舊版）→ load → skin 仍在、仍可裝備。
//   RT-3   賺得物 ＋ refresh（無版本變）→ 零遺失。
//   RT-4   舊 schemaVersion（缺新欄位）→ migrate → 新欄位補齊且舊賺得保留。
//   RT-6   存檔塞壞 JSON → load → readOnlyUntilResolved、壞字串被備份且 live key 不被空白覆寫、earned 不毀。
//   RT-9   earned 單調不縮小：施加「記憶體 earned 被清空後觸發 save」→ 斷言寫前快照／回滾保全 earned。
//          （對 player_profile_v1 與 learning_progress_v1 兩層分別驗。）
//   RT-10  reset 守門：程式路徑（無使用者手勢／偽造 token）呼叫 reset → 須被擋、已賺得保留；
//          唯有 {userConfirmed:true, gestureToken(真實手勢 mint)} 得以全清。
//   RT-12  localStorage 驅逐緩解：引擎須具「匯出單一 JSON＋非破壞式 additive 匯入」；驗其存在與 additive（不縮小）。
//
// 委派（靜態 DATA 層，本 gate 不重做；--verify 會 shell out 到 .py 並把結果納入總判）：
//   RT-2／RT-5／RT-11（catalog 欄位移除 graceful／id 非 index／可裝備型別 retire graceful，逐型別）
//   RT-13／RT-14（retire-not-delete baseline／no-shrink floor／type 註冊區）→ tools/reward_catalog_gate.py
//   RT-15（頒獎 grant-provenance：所頒 id ∈ live items[]）         → tools/reward_provenance_gate.py
//
// 完整性鐵律：本 gate 對站點唯讀——絕不為了讓某 RT 過而修改 game_core.js／safe_store.js／任何引擎或資料檔。
//   若某 RT 揭露真實的 never-disappear 缺口，就讓它誠實 FAIL（這是給維護者的發現，不是弱化理由）。
//   Fail-closed：瀏覽器／server／harness 失敗＝nonzero（SENTINEL），絕不 silent pass。
//
// 環境變數（可選）：REWARD_CHROME（chrome 執行檔）、REWARD_PORT（server 埠，預設 8123）、
//   REWARD_PAGE（代表頁，預設 english_addition.html）、REWARD_SKIP_DELEGATED=1（跳過委派的 .py，只報 runtime）。
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHROME = process.env.REWARD_CHROME ||
  '/Users/hdchen/.cache/puppeteer/chrome-headless-shell/mac_arm-152.0.7977.42/chrome-headless-shell-mac-arm64/chrome-headless-shell';
const PORT = parseInt(process.env.REWARD_PORT || '8123', 10);
const PAGE = process.env.REWARD_PAGE || 'english_addition.html';
const VIEW = { width: 1366, height: 1024, deviceScaleFactor: 2 };
const SENTINEL_LAUNCH = 90;   // server／瀏覽器無法啟動（fail-closed，非「0 失敗」）
const SENTINEL_HARNESS = 91;  // 其他 harness 層級失敗（fail-closed）
const PKEY = 'player_profile_v1';
const LKEY = 'learning_progress_v1';

const err = (...a) => process.stderr.write(a.join(' ') + '\n');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const url = () => `http://127.0.0.1:${PORT}/${PAGE}?rsg=${Date.now()}`;

// ── seed 用的已知 earned profile（player_profile_v1）──────────────────────────────────────────
// 擬真的已賺得存檔：subjects 各科 xp 相加＝totalXp（award 永遠同步兩者），且已 seed 過
// （v1_seeded:true＝回訪使用者）——否則 game_core 的一次性 seedOnce 會由 subjects 重算 totalXp，
// 這是正常行為、非 never-disappear bug；seed 不擬真會製造假陽性。
function earnedProfile(version) {
  return {
    version: version,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    displayName: '測試存檔',
    avatar: '🦊',
    totalXp: 5000,
    level: 1,
    coins: 300,
    subjects: {
      math: { xp: 3000, correct: 300, attempts: 360, bestCombo: 8, lastPlayed: '2026-01-01T00:00:00.000Z', badges: [] },
      english: { xp: 2000, correct: 220, attempts: 260, bestCombo: 6, lastPlayed: '2026-01-01T00:00:00.000Z', badges: [] }
    },
    streak: { current: 12, longest: 30, lastActiveDate: null, freezes: 3, freezeProgress: 0 },
    daily: { date: '2000-01-01', goalXp: 50, earnedXp: 0, done: false },
    activity: {},
    badges: { first_answer: { earnedAt: 'x' }, correct_100: { earnedAt: 'x' }, master_math: { earnedAt: 'x' } },
    ownedItems: ['skin-gold', 'border-crown'],
    equippedSkin: 'skin-gold',
    equippedBorder: 'border-crown',
    settings: { sound: true, reduceMotion: false, theme: 'light' },
    migratedFlags: { v1_seeded: true }
  };
}
// v1 且含殘留 equippedMascot（migrate v1→v2 應刪之，作為「migrate 真的跑過」的訊號）。
function earnedProfileV1Legacy() {
  const p = earnedProfile(1);
  p.equippedMascot = 'mascot-legacy';
  return p;
}
// 擬真的舊 v1（缺 streak/daily/activity/equipped*/settings 等新欄位）——驗 migrate＋normalize 補齊
// 且 earned 保留。含 subjects 使 totalXp 自洽、v1_seeded:true 使 seedOnce 不重算（擬真回訪舊檔）。
function minimalV1() {
  return {
    version: 1,
    totalXp: 1234,
    subjects: { math: { xp: 1234, correct: 120, attempts: 150, bestCombo: 4, lastPlayed: '2026-01-01T00:00:00.000Z', badges: [] } },
    badges: { correct_100: { earnedAt: 'x' } },
    ownedItems: ['skin-teal'],
    migratedFlags: { v1_seeded: true }
  };
}
const EARNED_SEED_BADGES = ['first_answer', 'correct_100', 'master_math'];
const EARNED_SEED_OWNED = ['skin-gold', 'border-crown'];

// ── 開一個「已 seed localStorage」的新分頁並載入代表頁（引擎於載入時 auto-init，故 seed 必須在載入前）──
async function seededPage(browser, seedPairs) {
  const page = await browser.newPage();
  await page.setViewport(VIEW);
  // evaluateOnNewDocument 於頁面任何 script 前執行；http 同源下 localStorage 可寫。
  await page.evaluateOnNewDocument((pairs) => {
    try {
      localStorage.clear();
      for (const k in pairs) if (Object.prototype.hasOwnProperty.call(pairs, k)) localStorage.setItem(k, pairs[k]);
    } catch (e) { /* 忽略 */ }
  }, seedPairs);
  const resp = await page.goto(url(), { waitUntil: 'networkidle2', timeout: 25000 });
  if (!resp || !resp.ok()) throw new Error(`頁面載入失敗（${PAGE}，status=${resp ? resp.status() : 'null'}）`);
  await sleep(600); // 等 game_core.init() ＋ safe_store load ＋ learning_progress ensureStore
  return page;
}

// ── 讀取 player_profile_v1 的記憶體／磁碟狀態（供斷言）──
async function readProfileState(page) {
  return await page.evaluate((pkey) => {
    let mem = null;
    try {
      const g = (window.Game && window.Game.getProfile) ? window.Game.getProfile() : null;
      if (g) mem = {
        totalXp: g.totalXp, coins: g.coins,
        badges: Object.keys(g.badges || {}), ownedItems: (g.ownedItems || []).slice(),
        equippedSkin: g.equippedSkin, equippedBorder: g.equippedBorder
      };
    } catch (e) { /* ignore */ }
    let rawLive = null, persisted = null;
    try { rawLive = localStorage.getItem(pkey); } catch (e) { /* ignore */ }
    if (rawLive != null) { try { persisted = JSON.parse(rawLive); } catch (e) { persisted = null; } }
    const backups = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf(pkey + '__corrupt_') === 0) backups.push({ k, v: localStorage.getItem(k) });
      }
    } catch (e) { /* ignore */ }
    return {
      mem,
      rawLive,
      persisted: persisted ? {
        version: persisted.version, totalXp: persisted.totalXp,
        badges: Object.keys(persisted.badges || {}), ownedItems: (persisted.ownedItems || []).slice(),
        equippedSkin: persisted.equippedSkin,
        hasEquippedMascot: Object.prototype.hasOwnProperty.call(persisted, 'equippedMascot'),
        hasStreak: !!persisted.streak, subjectsCount: persisted.subjects ? Object.keys(persisted.subjects).length : 0
      } : null,
      backups,
      isReadOnly: (window.Game && window.Game.isReadOnly) ? !!window.Game.isReadOnly() : null
    };
  }, PKEY);
}

const supersetArr = (big, small) => small.every((x) => big.includes(x));

// ── 各 RT：回傳 { id, title, pass, asserted, detail:[], layers:{} } ──
// RT-1：賺得 skin → 升 schemaVersion（seed 舊版）→ load → skin 仍在、仍可裝備。
async function rt1(browser) {
  const page = await seededPage(browser, { [PKEY]: JSON.stringify(earnedProfileV1Legacy()) });
  try {
    const s = await readProfileState(page);
    const ownedOk = s.mem && s.mem.ownedItems.includes('skin-gold');
    const equipOk = s.mem && s.mem.equippedSkin === 'skin-gold';
    // 「仍可裝備」＝skin-gold ∈ 引擎的 OWNED_ITEM_IDS 允許集（spendCoins／equip 路徑會認）。
    const equippable = await page.evaluate(() =>
      !!(window.Game && window.Game.CONFIG && (window.Game.CONFIG.OWNED_ITEM_IDS || []).indexOf('skin-gold') !== -1));
    const verBumped = s.persisted && s.persisted.version === 2;
    const pass = !!(ownedOk && equipOk && equippable && verBumped);
    return mk('RT-1', '賺得 skin→升版→reload→skin 仍在且可裝備', pass,
      'owned 含 skin-gold＋equippedSkin=skin-gold＋skin-gold∈OWNED_ITEM_IDS＋version 已 migrate 至 2',
      [`owned=${ownedOk} equip=${equipOk} equippable=${equippable} version=${s.persisted && s.persisted.version}`]);
  } finally { await page.close().catch(() => {}); }
}

// RT-3：賺得物 ＋ refresh（無版本變）→ 零遺失。
async function rt3(browser) {
  const page = await seededPage(browser, { [PKEY]: JSON.stringify(earnedProfile(2)) });
  try {
    const a = await readProfileState(page);
    await page.reload({ waitUntil: 'networkidle2', timeout: 25000 });
    await sleep(600);
    const b = await readProfileState(page);
    const badgesOk = b.mem && supersetArr(b.mem.badges, EARNED_SEED_BADGES);
    const ownedOk = b.mem && supersetArr(b.mem.ownedItems, EARNED_SEED_OWNED);
    const xpOk = b.mem && b.mem.totalXp >= 5000;
    const equipOk = b.mem && b.mem.equippedSkin === 'skin-gold' && b.mem.equippedBorder === 'border-crown';
    const pass = !!(badgesOk && ownedOk && xpOk && equipOk);
    return mk('RT-3', '賺得物＋refresh（無版本變）→零遺失', pass,
      'reload 後 badges／ownedItems／totalXp(≥5000)／equipped 全部保留',
      [`before=xp${a.mem && a.mem.totalXp} after: badges=${badgesOk} owned=${ownedOk} xp=${xpOk} equip=${equipOk}`]);
  } finally { await page.close().catch(() => {}); }
}

// RT-4：舊 schemaVersion（缺新欄位）→ migrate → 新欄位補齊且舊賺得保留。
async function rt4(browser) {
  const page = await seededPage(browser, { [PKEY]: JSON.stringify(minimalV1()) });
  try {
    const s = await readProfileState(page);
    const migrated = s.persisted && s.persisted.version === 2;                 // migrate 真的跑（version 來源＝migrate）
    const fieldsFilled = s.persisted && s.persisted.hasStreak && s.persisted.subjectsCount >= 6; // normalize 補齊
    const earnedKept = s.mem && supersetArr(s.mem.badges, ['correct_100']) &&
      s.mem.ownedItems.includes('skin-teal') && s.mem.totalXp >= 1234;
    const pass = !!(migrated && fieldsFilled && earnedKept);
    return mk('RT-4', '舊 schema（缺欄位）→migrate→補齊且舊賺得保留', pass,
      'version→2（migrate 跑過）＋streak/subjects 等欄位補齊＋badge correct_100／skin-teal／totalXp(≥1234) 保留',
      [`migrated=${migrated} fieldsFilled=${fieldsFilled}(subjects=${s.persisted && s.persisted.subjectsCount}) earnedKept=${earnedKept}`]);
  } finally { await page.close().catch(() => {}); }
}

// RT-6：存檔塞壞 JSON → load → readOnly、壞字串被備份且 live key 不被空白覆寫、earned 不毀。
async function rt6(browser) {
  const corrupt = '{"version":2,"totalXp":5000,"badges":{"correct_100":{"earnedAt":"x"}},"ownedItems":["skin-gold"'; // 截斷＝不可解析
  const page = await seededPage(browser, { [PKEY]: corrupt });
  try {
    // 施壓：壞檔載入後嘗試各種會寫磁碟的動作，驗 live key 不被覆寫。
    await page.evaluate(() => {
      try { if (window.Game) { window.Game.award('math', 50); window.Game.pingActive(); } } catch (e) { /* ignore */ }
    });
    await sleep(700); // 等 debounce saveNow（應被 readOnly 擋下，不寫）
    const s = await readProfileState(page);
    const readOnly = s.isReadOnly === true;
    const backedUp = s.backups.some((b) => b.v === corrupt);
    const liveUntouched = s.rawLive === corrupt;                 // live key 未被空白 fresh 覆寫
    const pass = !!(readOnly && backedUp && liveUntouched);
    return mk('RT-6', '壞 JSON→readOnly＋備份原字串＋live key 不被覆寫（earned 不毀）', pass,
      'Game.isReadOnly()===true＋存在 __corrupt_ 備份==原壞字串＋施壓寫入後 live key 仍==原壞字串',
      [`readOnly=${readOnly} backedUp=${backedUp}(${s.backups.length}份) liveUntouched=${liveUntouched}`]);
  } finally { await page.close().catch(() => {}); }
}

// RT-9：earned 單調不縮小（寫前快照／回滾）——兩層分別驗。
async function rt9(browser) {
  const detail = [];
  // ── 層 A：player_profile_v1（game_core）──
  // 施壓：以同分頁合成 storage 事件把「縮小的 earned」灌入 → game_core.onStorage 以 normalize 取代記憶體
  // （非聯集）→ 再觸發一次 award 落地。斷言：磁碟 earned 不得縮小（若縮小＝無寫前快照/回滾守門＝gap）。
  const pageA = await seededPage(browser, { [PKEY]: JSON.stringify(earnedProfile(2)) });
  let layerA = false, aDetail = '';
  try {
    const before = await readProfileState(pageA);
    await pageA.evaluate((pkey) => {
      const shrunk = JSON.stringify({ version: 2, totalXp: 0, coins: 0, badges: {}, ownedItems: [], equippedSkin: null, equippedBorder: null });
      const old = localStorage.getItem(pkey);
      localStorage.setItem(pkey, shrunk);
      try {
        window.dispatchEvent(new StorageEvent('storage', { key: pkey, newValue: shrunk, oldValue: old, storageArea: localStorage }));
      } catch (e) { /* 某些環境 StorageEvent 建構受限時略過 */ }
      try { if (window.Game) window.Game.award('math', 10); } catch (e) { /* ignore */ }
    }, PKEY);
    await sleep(700);
    const after = await readProfileState(pageA);
    const badgesKept = after.persisted && supersetArr(after.persisted.badges, EARNED_SEED_BADGES);
    const ownedKept = after.persisted && supersetArr(after.persisted.ownedItems, EARNED_SEED_OWNED);
    const xpKept = after.persisted && after.persisted.totalXp >= 5000;
    layerA = !!(badgesKept && ownedKept && xpKept);
    aDetail = `before=xp${before.persisted && before.persisted.totalXp}/owned${before.persisted && before.persisted.ownedItems.length} → after: badgesKept=${badgesKept} ownedKept=${ownedKept} xpKept=${xpKept}(xp=${after.persisted && after.persisted.totalXp})`;
  } finally { await pageA.close().catch(() => {}); }

  // ── 層 B：learning_progress_v1（safe_store）──
  // (i) 真實接線行為：seed 兩個單元 → 合成他分頁 storage 事件灌入「縮小的 units」→ LearningProgress onStorage
  //     走 store.mergeIncoming（union-object）→ 單元不應被丟。
  // (ii) safe_store 守門原語：直接 defineStore 一個 temp store，save 一個縮小 earned 集合 → 應拒寫＋回滾。
  const seedLP = JSON.stringify({ version: 1, units: { u1: { selfRatings: [{ rating: 3, at: 'x' }], mastered: true }, u2: { selfRatings: [], mastered: false, lastSeen: 'x' } } });
  const pageB = await seededPage(browser, { [LKEY]: seedLP });
  let layerB_union = false, layerB_guard = false, bDetail = '';
  try {
    const r = await pageB.evaluate((lkey) => {
      const out = { union: false, guard: false, notes: [] };
      // (i) 跨分頁灌縮小 units
      try {
        if (window.LearningProgress && window.LearningProgress.isAvailable && window.LearningProgress.isAvailable()) {
          const shrunk = JSON.stringify({ version: 1, units: { u1: { selfRatings: [], mastered: false } } });
          window.dispatchEvent(new StorageEvent('storage', { key: lkey, newValue: shrunk, oldValue: localStorage.getItem(lkey), storageArea: localStorage }));
          const units = (window.LearningProgress.getProgress() || {}).units || {};
          out.union = !!(units.u1 && units.u2);           // u2 不得被縮小丟掉
          out.notes.push('union units=' + Object.keys(units).join(','));
        } else { out.notes.push('LearningProgress 不可用'); }
      } catch (e) { out.notes.push('union err:' + e.message); }
      // (ii) safe_store earned-shrink 守門原語
      try {
        if (window.SafeStore && window.SafeStore.defineStore) {
          const st = window.SafeStore.defineStore({
            key: '__rsg_selftest_shrink__', schemaVersion: 1,
            freshFactory: () => ({ version: 1, ownedItems: [], badges: {}, totalXp: 0 }),
            normalize: (p) => p,
            mergeStrategies: { ownedItems: 'union-set', badges: 'union-set', totalXp: 'monotonic-max' },
            earned: { sets: ['ownedItems', 'badges'], monotonic: ['totalXp'] }
          });
          st.load();
          const r1 = st.save({ version: 1, ownedItems: ['a', 'b'], badges: { x: 1 }, totalXp: 100 }); // 建立磁碟 earned
          const r2 = st.save({ version: 1, ownedItems: [], badges: {}, totalXp: 0 });                  // 試圖縮小
          out.guard = !!(r1 && r1.ok && r2 && r2.ok === false && r2.reason === 'earned-shrink');
          out.notes.push('guard r2=' + JSON.stringify(r2));
          try { localStorage.removeItem('__rsg_selftest_shrink__'); } catch (e) { /* ignore */ }
        } else { out.notes.push('SafeStore 不可用'); }
      } catch (e) { out.notes.push('guard err:' + e.message); }
      return out;
    }, LKEY);
    layerB_union = r.union; layerB_guard = r.guard; bDetail = r.notes.join(' ; ');
  } finally { await pageB.close().catch(() => {}); }

  const layerB = layerB_union && layerB_guard;
  const pass = layerA && layerB;
  detail.push(`層A player_profile_v1(game_core)=${layerA ? 'PASS' : 'FAIL'}：${aDetail}`);
  detail.push(`層B learning_progress_v1(safe_store)=${layerB ? 'PASS' : 'FAIL'}：union=${layerB_union} guard=${layerB_guard}｜${bDetail}`);
  return mk('RT-9', 'earned 單調不縮小（寫前快照／回滾，兩層）', pass,
    '兩層皆須：縮小的 earned 寫入被拒／被 union 併回，磁碟 earned 不縮小',
    detail);
}

// RT-10：reset 守門——程式路徑呼叫 reset 須被擋、earned 保留；僅真實手勢 token 得全清。
async function rt10(browser) {
  const detail = [];
  // ── 層 A：player_profile_v1（game_core）── 程式呼叫 Game.reset('all') → 應被擋；若真的全清＝gap。
  const pageA = await seededPage(browser, { [PKEY]: JSON.stringify(earnedProfile(2)) });
  let layerA = false, aDetail = '';
  try {
    const before = await readProfileState(pageA);
    await pageA.evaluate(() => { try { if (window.Game && window.Game.reset) window.Game.reset('all'); } catch (e) { /* ignore */ } });
    await sleep(500);
    const after = await readProfileState(pageA);
    const badgesKept = after.mem && supersetArr(after.mem.badges, EARNED_SEED_BADGES);
    const ownedKept = after.mem && supersetArr(after.mem.ownedItems, EARNED_SEED_OWNED);
    const xpKept = after.mem && after.mem.totalXp >= 5000;
    layerA = !!(badgesKept && ownedKept && xpKept); // 守門存在＝earned 仍在；若被清空＝gap（layerA=false）
    aDetail = `before xp=${before.mem && before.mem.totalXp}/owned${before.mem && before.mem.ownedItems.length} → after: badgesKept=${badgesKept} ownedKept=${ownedKept} xpKept=${xpKept}(xp=${after.mem && after.mem.totalXp})`;
  } finally { await pageA.close().catch(() => {}); }

  // ── 層 B：safe_store reset 守門原語 ── 無 token／偽 token 拒、真實 mint token 放行；且 LearningProgress 無對外 reset。
  const pageB = await seededPage(browser, {});
  let layerB = false, bDetail = '';
  try {
    const r = await pageB.evaluate(() => {
      const out = { noToken: null, fakeToken: null, realToken: null, lpNoReset: null, notes: [] };
      try {
        if (window.SafeStore && window.SafeStore.defineStore) {
          const st = window.SafeStore.defineStore({ key: '__rsg_selftest_reset__', schemaVersion: 1, freshFactory: () => ({ version: 1 }), normalize: (p) => p });
          st.load();
          out.noToken = st.reset({});                                            // 應 ok:false
          out.fakeToken = st.reset({ userConfirmed: true, gestureToken: 'gt_forged' }); // 應 ok:false
          const tok = window.SafeStore.mintGestureToken();
          out.realToken = st.reset({ userConfirmed: true, gestureToken: tok });   // 應 ok:true
          try { localStorage.removeItem('__rsg_selftest_reset__'); } catch (e) { /* ignore */ }
        } else { out.notes.push('SafeStore 不可用'); }
      } catch (e) { out.notes.push('err:' + e.message); }
      // LearningProgress 不得對外曝露 program-path reset（進度不可被程式全清）。
      out.lpNoReset = !(window.LearningProgress && typeof window.LearningProgress.reset === 'function');
      return out;
    });
    layerB = !!(r.noToken && r.noToken.ok === false && r.fakeToken && r.fakeToken.ok === false &&
      r.realToken && r.realToken.ok === true && r.lpNoReset === true);
    bDetail = `noToken=${r.noToken && r.noToken.ok} fakeToken=${r.fakeToken && r.fakeToken.ok} realToken=${r.realToken && r.realToken.ok} lpNoReset=${r.lpNoReset} ${r.notes.join(' ')}`;
  } finally { await pageB.close().catch(() => {}); }

  const pass = layerA && layerB;
  detail.push(`層A player_profile_v1(game_core)=${layerA ? 'PASS' : 'FAIL'}：${aDetail}`);
  detail.push(`層B safe_store reset 守門=${layerB ? 'PASS' : 'FAIL'}：${bDetail}`);
  return mk('RT-10', 'reset 守門（程式路徑被擋，僅真實手勢 token 全清）', pass,
    '兩層皆須：無手勢／偽 token 的 reset 被擋且 earned 保留；真實 mint token 才放行',
    detail);
}

// RT-12：localStorage 驅逐緩解＝匯出單一 JSON＋非破壞式 additive 匯入。驗其存在與 additive。
async function rt12(browser) {
  const page = await seededPage(browser, { [PKEY]: JSON.stringify(earnedProfile(2)), [LKEY]: JSON.stringify({ version: 1, units: { u1: { selfRatings: [], mastered: true } } }) });
  try {
    const probe = await page.evaluate(() => {
      const found = { exportFns: [], importFns: [], ui: [], mergeIncoming: false, notes: [] };
      const scan = (o, label) => {
        if (!o) return;
        for (const k in o) {
          try {
            if (/^(export|download|backup|serialize|dump|匯出)/i.test(k) && typeof o[k] === 'function') found.exportFns.push(label + '.' + k);
            if (/^(import|restore|merge|load|匯入)/i.test(k) && typeof o[k] === 'function') found.importFns.push(label + '.' + k);
          } catch (e) { /* ignore */ }
        }
      };
      scan(window.Game, 'Game'); scan(window.LearningProgress, 'LearningProgress'); scan(window.SafeStore, 'SafeStore');
      // 使用者可見的匯出／匯入 UI 控制？
      try {
        document.querySelectorAll('button,a,[role="button"],input[type="file"]').forEach((el) => {
          const t = ((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '')).trim();
          if (/匯出|匯入|下載備份|備份檔|export|import|backup|restore/i.test(t)) found.ui.push(t.slice(0, 30));
        });
      } catch (e) { /* ignore */ }
      // additive 匯入原語（safe_store mergeIncoming）是否存在且 additive（不縮小）。
      try {
        if (window.SafeStore && window.SafeStore.defineStore) {
          const st = window.SafeStore.defineStore({
            key: '__rsg_selftest_import__', schemaVersion: 1,
            freshFactory: () => ({ version: 1, ownedItems: ['a'], badges: {} }),
            normalize: (p) => p,
            mergeStrategies: { ownedItems: 'union-set', badges: 'union-set' },
            earned: { sets: ['ownedItems', 'badges'], monotonic: [] }
          });
          st.load();
          const merged = st.mergeIncoming({ ownedItems: ['b'], badges: {} }); // additive：應得 a∪b
          found.mergeIncoming = !!(merged && merged.ownedItems && merged.ownedItems.indexOf('a') !== -1 && merged.ownedItems.indexOf('b') !== -1);
          try { localStorage.removeItem('__rsg_selftest_import__'); } catch (e) { /* ignore */ }
        }
      } catch (e) { found.notes.push('mergeIncoming err:' + e.message); }
      return found;
    });
    // RT-12 要求：須有「可匯出為單一 JSON（export）」＋「非破壞式 additive 匯入（import）」的對外路徑（API 或 UI）。
    const hasExport = probe.exportFns.length > 0 || probe.ui.some((t) => /匯出|下載備份|備份檔|export|backup/i.test(t));
    const hasImport = probe.importFns.length > 0 || probe.ui.some((t) => /匯入|restore|import/i.test(t));
    const pass = !!(hasExport && hasImport);
    const detail = [
      `exportFns=[${probe.exportFns.join(',')}] importFns=[${probe.importFns.join(',')}] ui=[${probe.ui.join('|')}]`,
      `safe_store.mergeIncoming additive 原語存在=${probe.mergeIncoming}（import-merge 底層正確，但非對外「驅逐緩解」匯出/匯入入口）`
    ];
    return mk('RT-12', 'localStorage 驅逐緩解：匯出單一 JSON＋additive 匯入', pass,
      '引擎須對外提供（API 或 UI）一鍵匯出 ＋ additive（不縮小）匯入；mergeIncoming 僅為底層原語，不足以滿足',
      detail);
  } finally { await page.close().catch(() => {}); }
}

function mk(id, title, pass, asserted, detail) {
  return { id, title, pass: !!pass, asserted, detail: detail || [] };
}

// ── 委派的靜態 .py gate（RT-2/5/11/13/14/15 的 DATA 層；本 gate 不重做）──
function runPyGate(script) {
  return new Promise((resolve) => {
    let p;
    try { p = spawn('python3', [script], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { resolve({ ran: false, exit: -1, tail: 'spawn 失敗：' + e.message }); return; }
    let out = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { out += d; });
    p.on('error', (e) => resolve({ ran: false, exit: -1, tail: 'spawn error：' + e.message }));
    p.on('close', (code) => resolve({ ran: true, exit: code, tail: out.trim().split('\n').slice(-2).join(' | ') }));
  });
}

// ── http server（自管，對齊 a11y_gate）──
function startServer() {
  return new Promise((resolve, reject) => {
    let srv;
    try { srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1', '--directory', ROOT], { stdio: ['ignore', 'ignore', 'ignore'] }); }
    catch (e) { reject(e); return; }
    srv.on('error', reject);
    (async () => {
      for (let i = 0; i < 60; i++) {
        try {
          const r = await fetch(`http://127.0.0.1:${PORT}/${PAGE}`, { method: 'HEAD' });
          if (r.ok || r.status === 404) return resolve(srv);
        } catch (e) { /* not up yet */ }
        await sleep(200);
      }
      reject(new Error('http server 起不來'));
    })();
  });
}

async function launchBrowser(dir) {
  return puppeteer.launch({ executablePath: CHROME, args: ['--no-sandbox', `--user-data-dir=${dir}`] });
}

// ── --verify ──
async function verify() {
  err('=== reward_safety_gate --verify ===');
  err(`代表頁：${PAGE}（同載 game_core.js＋assets/safe_store.js＋assets/learning_progress.js）；viewport ${VIEW.width}×${VIEW.height}`);
  if (!existsSync(join(ROOT, PAGE))) { err(`FAIL：找不到代表頁 ${PAGE}（fail-closed）`); process.exit(SENTINEL_HARNESS); }

  let srv;
  try { srv = await startServer(); }
  catch (e) { err(`FAIL：http server 無法啟動——${e.message}`); process.exit(SENTINEL_LAUNCH); }

  let browser;
  try { browser = await launchBrowser('/tmp/reward_safety_gate_chrome'); }
  catch (e) {
    err(`FAIL：瀏覽器無法啟動（fail-closed，非 0 失敗）——${e.message}`);
    try { srv.kill('SIGKILL'); } catch (e2) { /* ignore */ }
    process.exit(SENTINEL_LAUNCH);
  }

  const RTS = [rt1, rt3, rt4, rt6, rt9, rt10, rt12];
  const results = [];
  try {
    for (const fn of RTS) {
      try { results.push(await fn(browser)); }
      catch (e) {
        // harness 例外＝fail-closed（記為失敗，絕不當作通過）。
        results.push(mk(fn.name.toUpperCase(), '(harness 例外)', false, '該 RT 應可被確定性驅動', ['harness 例外：' + e.message]));
      }
    }
  } finally {
    await browser.close().catch(() => {});
    try { srv.kill('SIGKILL'); } catch (e) { /* ignore */ }
  }

  // 委派的靜態 gate。
  const skipDelegated = process.env.REWARD_SKIP_DELEGATED === '1';
  const delegated = [];
  if (!skipDelegated) {
    const catalog = await runPyGate('tools/reward_catalog_gate.py');
    const prov = await runPyGate('tools/reward_provenance_gate.py');
    delegated.push({ name: 'reward_catalog_gate.py', covers: 'RT-2/5/11/13/14（catalog retire-not-delete／no-shrink floor／type 註冊區）', ...catalog });
    delegated.push({ name: 'reward_provenance_gate.py', covers: 'RT-15（頒獎 grant-provenance：所頒 id ∈ live items[]）', ...prov });
  }

  // 報告。
  err('\n--- RUNTIME 紅隊（本 gate 真跑）---');
  let runtimeFail = 0;
  for (const r of results) {
    const ok = r.pass;
    if (!ok) runtimeFail++;
    err(`[${ok ? 'PASS' : 'FAIL'}] ${r.id} ${r.title}`);
    err(`        斷言：${r.asserted}`);
    for (const d of r.detail) err(`        ${d}`);
  }

  let delegatedFail = 0;
  err('\n--- 委派的靜態 DATA 層 gate（.py；不重做）---');
  if (skipDelegated) {
    err('（REWARD_SKIP_DELEGATED=1，本次跳過；僅報 runtime）');
  } else {
    for (const d of delegated) {
      const ok = d.ran && d.exit === 0;
      if (!ok) delegatedFail++;
      err(`[${ok ? 'PASS' : (d.ran ? 'FAIL' : 'ERROR')}] ${d.name}（涵蓋 ${d.covers}）exit=${d.exit}`);
      err(`        ${d.tail}`);
    }
  }

  const total = runtimeFail + delegatedFail;
  err('\n========== AC-REWARD-1 判定 ==========');
  err(`RUNTIME RT：${results.length - runtimeFail}/${results.length} PASS（失敗 ${runtimeFail}）`);
  if (!skipDelegated) err(`委派靜態 gate：${delegated.length - delegatedFail}/${delegated.length} PASS（失敗 ${delegatedFail}）`);
  if (total === 0) err('結果：PASS（獎勵／進度 never-disappear RT 全綠）');
  else {
    err('結果：FAIL');
    const failedIds = results.filter((r) => !r.pass).map((r) => r.id);
    if (failedIds.length) err(`  失敗 RT：${failedIds.join(', ')} — 為真實 never-disappear 缺口（請修引擎、勿弱化本 gate）`);
  }
  process.exit(total === 0 ? 0 : Math.min(total, 255));
}

// ── --selftest（離線 good/bad stub；證明 harness 能判別）──
// 兩個 stub 各實作一個極小引擎（window.RSG），GOOD 具備全部守門、BAD 全缺。
// 下列判別函式（migrate 保 earned／壞檔不覆寫／reset 手勢閘／earned-shrink 守門／匯出匯入存在）
// 即各 RT 的邏輯核心；GOOD 必全過、BAD 必全被抓到，才證明本 harness 不會 silent pass。
function stubHtml(good) {
  // 極小引擎：以 localStorage 為後端，load/save/reset/migrate/export/import。
  const bad = !good;
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"></head><body>
<script>
(function(){
  'use strict';
  var KEY='rsg_stub_v1', SV=2;
  var mem=null, readOnly=false, lastDiskEarned=null;
  var _tok={};
  function mint(){var t='t'+Date.now()+Math.random();_tok[t]=1;return t;}
  function consume(t){ if(!t||!_tok[t]) return false; delete _tok[t]; return true; }
  function fresh(){ return {version:SV, totalXp:0, ownedItems:[], badges:{}}; }
  function migrate(p){
    ${bad
      ? 'return p;' /* BAD：無 migrate，version 永遠照舊（偵不出舊檔） */
      : 'if(!p||typeof p!=="object") return p; var from=(typeof p.version==="number")?p.version:1; if(from>=SV) return p; p.version=SV; return p;'}
  }
  function normalize(p){ if(!p||typeof p!=="object") return fresh(); if(!Array.isArray(p.ownedItems)) p.ownedItems=[]; if(typeof p.badges!=="object"||!p.badges) p.badges={}; if(typeof p.totalXp!=="number") p.totalXp=0; return p; }
  function supersetArr(big,small){ for(var i=0;i<small.length;i++){ if(big.indexOf(small[i])===-1) return false; } return true; }
  function supersetKeys(big,small){ for(var k in small){ if(!(k in big)) return false; } return true; }
  function load(){
    var raw=null; try{ raw=localStorage.getItem(KEY); }catch(e){}
    if(raw==null){ mem=normalize(fresh()); readOnly=false; return; }
    var parsed;
    try{ parsed=JSON.parse(raw); }
    catch(e){
      ${bad
        ? 'mem=normalize(fresh()); try{ localStorage.setItem(KEY, JSON.stringify(mem)); }catch(_){}' /* BAD：壞檔直接以空白覆寫 */
        : 'try{ localStorage.setItem(KEY+"__corrupt_"+Date.now(), raw); }catch(_){} mem=normalize(fresh()); readOnly=true;' /* GOOD：備份＋唯讀 */}
      return;
    }
    parsed=migrate(parsed); mem=normalize(parsed);
  }
  function diskEarned(){ try{ var r=localStorage.getItem(KEY); if(r==null) return null; return JSON.parse(r); }catch(e){ return null; } }
  function save(next){
    if(readOnly) return {ok:false, reason:'read-only'};
    var disk=diskEarned();
    ${bad
      ? '' /* BAD：無 earned-shrink 守門 */
      : 'if(disk){ if(!supersetArr(next.ownedItems||[], disk.ownedItems||[]) || !supersetKeys(next.badges||{}, disk.badges||{}) || (next.totalXp||0)<(disk.totalXp||0)){ mem={version:SV, totalXp:Math.max(next.totalXp||0, disk.totalXp||0), ownedItems:(disk.ownedItems||[]).slice(), badges:disk.badges||{}}; return {ok:false, reason:"earned-shrink", rolledBack:true}; } }'}
    try{ localStorage.setItem(KEY, JSON.stringify(next)); }catch(e){}
    mem=next; return {ok:true};
  }
  function reset(opts){
    opts=opts||{};
    ${bad
      ? '' /* BAD：無手勢閘，直接全清 */
      : 'if(opts.userConfirmed!==true || !consume(opts.gestureToken)){ return {ok:false, reason:"reset-denied"}; }'}
    mem=fresh(); try{ localStorage.setItem(KEY, JSON.stringify(mem)); }catch(e){}
    return {ok:true};
  }
  var api={
    load:load, save:save, reset:reset, mint:mint,
    getProfile:function(){ return mem?JSON.parse(JSON.stringify(mem)):null; },
    isReadOnly:function(){ return readOnly; }
  };
  ${good
    ? 'api.exportProfile=function(){ return JSON.stringify(mem); }; api.importProfile=function(j){ var inc=(typeof j==="string")?JSON.parse(j):j; mem=mem||fresh(); var o={}; (mem.ownedItems||[]).concat(inc.ownedItems||[]).forEach(function(x){o[x]=1;}); mem.ownedItems=Object.keys(o); for(var k in (inc.badges||{})) if(!(k in mem.badges)) mem.badges[k]=inc.badges[k]; mem.totalXp=Math.max(mem.totalXp||0, inc.totalXp||0); return mem; };'
    : '/* BAD：無匯出／匯入 */'}
  window.RSG=api;
  load();
})();
<\/script></body></html>`;
}

// setContent 會給 opaque origin（localStorage 丟 SecurityError），故 stub 必須也跑在 http origin 上：
// 先 goto 本機 server 的目錄根（200，取得 http origin）→ evaluate 清空／seed localStorage → 再 setContent 跑 stub。
async function stubPage(browser, html, seedRaw) {
  const page = await browser.newPage();
  await page.setViewport(VIEW);
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.evaluate((s) => { try { localStorage.clear(); if (s != null) localStorage.setItem('rsg_stub_v1', s); } catch (e) { /* ignore */ } }, (typeof seedRaw === 'undefined') ? null : seedRaw);
  await page.setContent(html, { waitUntil: 'networkidle2' });
  await sleep(120);
  return page;
}

// 對一個 stub page 跑五項判別，回傳每項 boolean（true＝守門存在/行為正確）。
async function probeStub(browser, good) {
  const html = stubHtml(good);
  // 判別 1：migrate 保 earned —— seed v1 earned → load → version 升到 2 且 earned 保留。
  const p1 = await stubPage(browser, html, JSON.stringify({ version: 1, totalXp: 50, ownedItems: ['s1'], badges: { b1: 1 } }));
  const migrateOk = await p1.evaluate(() => { const g = window.RSG.getProfile(); return !!(g && g.version === 2 && g.ownedItems.indexOf('s1') !== -1 && g.badges.b1 && g.totalXp >= 50); });
  await p1.close().catch(() => {});

  // 判別 2：壞檔不覆寫 —— seed 壞字串 → load → readOnly 且 live key 未被覆寫。
  const p2 = await stubPage(browser, html, '{"totalXp":9,"ownedItems":[');
  const corruptOk = await p2.evaluate(() => { const ro = window.RSG.isReadOnly(); let live = null; try { live = localStorage.getItem('rsg_stub_v1'); } catch (e) { /* ignore */ } return !!(ro === true && live === '{"totalXp":9,"ownedItems":['); });
  await p2.close().catch(() => {});

  // 判別 3：earned-shrink 守門 —— save 大 earned 後 save 縮小 → 第二次應被拒。
  const p3 = await stubPage(browser, html, null);
  const shrinkOk = await p3.evaluate(() => {
    const r1 = window.RSG.save({ version: 2, totalXp: 100, ownedItems: ['a', 'b'], badges: { x: 1 } });
    const r2 = window.RSG.save({ version: 2, totalXp: 0, ownedItems: [], badges: {} });
    let live = null; try { live = JSON.parse(localStorage.getItem('rsg_stub_v1')); } catch (e) { /* ignore */ }
    return !!(r1 && r1.ok && r2 && r2.ok === false && live && live.ownedItems.length === 2);
  });
  await p3.close().catch(() => {});

  // 判別 4：reset 手勢閘 —— 無 token 拒、真實 mint token 放行。
  const p4 = await stubPage(browser, html, null);
  const resetOk = await p4.evaluate(() => {
    const noTok = window.RSG.reset({});
    const tok = window.RSG.mint();
    const withTok = window.RSG.reset({ userConfirmed: true, gestureToken: tok });
    return !!(noTok && noTok.ok === false && withTok && withTok.ok === true);
  });
  await p4.close().catch(() => {});

  // 判別 5：匯出／匯入存在且 additive。
  const p5 = await stubPage(browser, html, JSON.stringify({ version: 2, totalXp: 10, ownedItems: ['a'], badges: {} }));
  const exportOk = await p5.evaluate(() => {
    if (typeof window.RSG.exportProfile !== 'function' || typeof window.RSG.importProfile !== 'function') return false;
    const dump = window.RSG.exportProfile();
    const merged = window.RSG.importProfile({ ownedItems: ['b'], badges: {}, totalXp: 5 });
    return !!(typeof dump === 'string' && merged && merged.ownedItems.indexOf('a') !== -1 && merged.ownedItems.indexOf('b') !== -1 && merged.totalXp === 10);
  });
  await p5.close().catch(() => {});

  return { migrateOk, corruptOk, shrinkOk, resetOk, exportOk };
}

async function selftest() {
  err('=== reward_safety_gate --selftest ===');
  let srv;
  try { srv = await startServer(); }
  catch (e) { err(`FAIL：http server 無法啟動——${e.message}`); process.exit(2); }
  let browser;
  try { browser = await launchBrowser('/tmp/reward_safety_gate_selftest_chrome'); }
  catch (e) { err(`FAIL：瀏覽器無法啟動——${e.message}`); try { srv.kill('SIGKILL'); } catch (e2) { /* ignore */ } process.exit(2); }

  let good, bad;
  try {
    good = await probeStub(browser, true);
    bad = await probeStub(browser, false);
  } catch (e) {
    err(`FAIL：selftest render 失敗——${e.message}`);
    await browser.close().catch(() => {});
    try { srv.kill('SIGKILL'); } catch (e2) { /* ignore */ }
    process.exit(2);
  } finally {
    await browser.close().catch(() => {});
    try { srv.kill('SIGKILL'); } catch (e2) { /* ignore */ }
  }

  const checks = [
    ['GOOD：migrate 保 earned → 過', good.migrateOk === true],
    ['GOOD：壞檔不覆寫＋唯讀 → 過', good.corruptOk === true],
    ['GOOD：earned-shrink 守門 → 過', good.shrinkOk === true],
    ['GOOD：reset 手勢閘 → 過', good.resetOk === true],
    ['GOOD：匯出／匯入 additive → 過', good.exportOk === true],
    ['BAD：無 migrate → 被抓（fire）', bad.migrateOk === false],
    ['BAD：壞檔被覆寫 → 被抓（fire）', bad.corruptOk === false],
    ['BAD：earned 縮小寫入 → 被抓（fire）', bad.shrinkOk === false],
    ['BAD：reset 無手勢即全清 → 被抓（fire）', bad.resetOk === false],
    ['BAD：無匯出／匯入 → 被抓（fire）', bad.exportOk === false]
  ];
  let allok = true;
  for (const [msg, ok] of checks) { err(`  [${ok ? 'OK' : 'BAD'}] ${msg}`); allok = allok && ok; }
  err(`  GOOD 明細：${JSON.stringify(good)}`);
  err(`  BAD  明細：${JSON.stringify(bad)}`);
  err(`RESULT：${allok ? 'PASS' : 'FAIL'}（harness 判別力：GOOD 全過＋BAD 全被抓 才 exit 0）`);
  process.exit(allok ? 0 : 2);
}

// ── 入口（容忍多餘參數如 --release-id/--root）──
const argv = process.argv.slice(2);
if (argv.includes('--selftest')) await selftest();
else if (argv.includes('--verify')) await verify();
else {
  err('用法：node tools/reward_safety_gate.mjs --verify | --selftest');
  err('  --verify    於真實站點跑 RT-1/3/4/6/9/10/12（RUNTIME）＋委派 reward_catalog_gate.py／reward_provenance_gate.py；EXIT=失敗 RT 數（0=全綠）');
  err('  --selftest  離線 good/bad stub 自測（PASS=exit 0；期望未全中=exit 2）');
  process.exit(2);
}
