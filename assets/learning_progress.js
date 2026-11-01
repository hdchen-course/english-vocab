/* =====================================================================
 * learning_progress.js — 逐單元學習進度模組（§6.3「進度與精熟」）
 * ---------------------------------------------------------------------
 * 唯一 normative 來源＝LEARNING_PATH_REBUILD_SPEC.md §6.3 ＋ §7.1。
 *
 * 契約（§6.3 細則 1–4）：
 *   1. 獨立 key＝`learning_progress_v1`，**絕不寫入 player_profile_v1**
 *      （§7.2 單一寫者：player_profile_v1 只由 game_core.js 寫；進度模組
 *       不得改寫它，避免兩寫者互毀）。進度前進可另呼叫 window.Game 發獎勵，
 *      但獎勵落在 player_profile_v1、進度留在 learning_progress_v1，兩 key
 *      各自持久化、互不覆寫。
 *   2. 形狀：{version, units:{<unit_id>:{srsState?, selfRatings:[],
 *      lastSeen, mastered:bool}}}。<unit_id>＝§6.2 metadata 的穩定 slug，
 *      與檔名無關、改名不變；嚴禁用陣列索引或頁順序當鍵。
 *   3. additive：selfRatings 只增（push）、mastered 單調為真不回退、
 *      lastSeen 更新。
 *   4. 套 §7.1 三道保護——全部委由共用 `safe_store.js`（單一來源，R5）：
 *      壞檔不重設（備份＋唯讀）／additive 合併（earned 永不縮小）／
 *      真實 migrate（讀存檔 version）。此模組不自己重寫這三道。
 *
 * 純 vanilla JS、零依賴（除 window.SafeStore）、無 build step（靜態站）。
 * 公開 window.LearningProgress。未載入 safe_store 時 graceful no-op，不報錯。
 * 所有註解一律繁體中文（零簡體、零 PRC 詞）。
 * ===================================================================== */
(function (global) {
  'use strict';

  var KEY = 'learning_progress_v1';
  var SCHEMA_VERSION = 1;

  // ---- 島（subject/domain）解析：unit_id 的首個「.」段 ------------------
  // §6.3：unit_id＝`<domain>.<tier>.<strand>.<slug>`（life 域為
  // `life.<category>.<strand>.<slug>`）。首段 domain 即 nav_index 的島鍵
  // （chi/eng/math/sci/soc-civ/soc-geo/soc-hist/life；social 子域含連字號、
  // 但以「.」切首段仍得到完整島鍵）。純讀取、不影響持久化。
  function islandOf(unitId) {
    if (typeof unitId !== 'string') return '';
    var dot = unitId.indexOf('.');
    return dot === -1 ? unitId : unitId.slice(0, dot);
  }

  function nowIso() {
    try { return new Date().toISOString(); } catch (e) { return '' + Date.now(); }
  }

  // ---- freshFactory / normalize（version 由 safe_store 的 migrate 決定，
  //      此處不得注入 version——§6.3 safe_store 要求 1）----------------------
  function freshFactory() { return { version: SCHEMA_VERSION, units: {} }; }
  function normalize(p) {
    var obj = (p && typeof p === 'object') ? p : {};
    if (!obj.units || typeof obj.units !== 'object' || Array.isArray(obj.units)) obj.units = {};
    // 逐單元補預設（additive：只補不覆蓋既有欄位）
    for (var id in obj.units) {
      if (!Object.prototype.hasOwnProperty.call(obj.units, id)) continue;
      var u = obj.units[id];
      if (!u || typeof u !== 'object' || Array.isArray(u)) { obj.units[id] = u = {}; }
      if (!Array.isArray(u.selfRatings)) u.selfRatings = [];
      if (typeof u.mastered !== 'boolean') u.mastered = !!u.mastered;
    }
    return obj;
  }

  // ---- 建立 store（委由 safe_store 做 §7.1 三道保護）----------------------
  // `units` 用 union-object 合併策略：跨分頁 onStorage／匯入時至少聯集單元鍵，
  // 不整筆丟棄其他分頁已學的單元（never-disappear）。
  // earned.sets=['units']：save 前驗 units 鍵集合不得縮小（RT-9 類保護，
  // 任何 bug 想就地清空單元集合→拒寫＋回滾）。
  var store = null;
  var available = false;
  function ensureStore() {
    if (store) return store;
    var SS = global.SafeStore;
    if (!SS || typeof SS.defineStore !== 'function') {
      available = false;
      return null;
    }
    store = SS.defineStore({
      key: KEY,
      schemaVersion: SCHEMA_VERSION,
      migrations: {},                 // v1：尚無前版；未來改欄位語意才加步驟
      freshFactory: freshFactory,
      normalize: normalize,
      mergeStrategies: { units: 'union-object' },
      earned: { sets: ['units'], monotonic: [] }
    });
    store.load();                     // 首次 load（壞檔保護在 safe_store 內）
    available = true;
    // 跨分頁同步：他分頁寫 learning_progress_v1 → additive 併入（不覆蓋較高/既有）
    try {
      if (global.addEventListener) {
        global.addEventListener('storage', function (e) {
          if (!e || e.key !== KEY || e.newValue == null) return;
          try { store.mergeIncoming(JSON.parse(e.newValue)); } catch (_) { /* 壞值略過 */ }
        });
      }
    } catch (_) { /* 無 window 事件也不可崩 */ }
    return store;
  }

  function current() {
    var s = ensureStore();
    if (!s) return freshFactory();
    var v = s.getInMemory();
    return (v && typeof v === 'object') ? v : freshFactory();
  }

  // ===================================================================
  // 公開 API
  // ===================================================================

  // recordUnit(unitId, {selfRating, mastered, srsState})
  //  - selfRating：三級自評字串或索引 → push 進 selfRatings（additive，只增）
  //  - mastered：true 時把 mastered 單調設為真（永不回退為 false）
  //  - srsState：可選，更新 SRS 狀態（last-write）
  // 回傳合併後的該單元物件；safe_store 未載入時 graceful no-op 回 null。
  function recordUnit(unitId, opts) {
    if (!unitId || typeof unitId !== 'string') return null;
    var s = ensureStore();
    if (!s) return null;              // graceful no-op（不報錯）
    opts = opts || {};
    var state = current();
    if (!state.units || typeof state.units !== 'object') state.units = {};
    var u = state.units[unitId];
    if (!u || typeof u !== 'object' || Array.isArray(u)) u = { selfRatings: [], mastered: false };
    if (!Array.isArray(u.selfRatings)) u.selfRatings = [];

    if (typeof opts.selfRating !== 'undefined' && opts.selfRating !== null) {
      u.selfRatings.push({ rating: opts.selfRating, at: nowIso() });   // additive：只增
    }
    if (opts.mastered === true) u.mastered = true;                     // 單調為真、不回退
    if (typeof opts.srsState !== 'undefined') u.srsState = opts.srsState;
    u.lastSeen = nowIso();

    state.units[unitId] = u;
    s.save(state);                    // safe_store：寫前先讀＋earned 不縮小＋壞檔保護
    return JSON.parse(JSON.stringify(u));
  }

  // 標記「看過」（開啟單元但尚未自評時可選用）：只更新 lastSeen，不動 mastered。
  function touchUnit(unitId) {
    if (!unitId || typeof unitId !== 'string') return null;
    var s = ensureStore();
    if (!s) return null;
    var state = current();
    if (!state.units || typeof state.units !== 'object') state.units = {};
    var u = state.units[unitId];
    if (!u || typeof u !== 'object' || Array.isArray(u)) u = { selfRatings: [], mastered: false };
    if (!Array.isArray(u.selfRatings)) u.selfRatings = [];
    u.lastSeen = nowIso();
    state.units[unitId] = u;
    s.save(state);
    return JSON.parse(JSON.stringify(u));
  }

  function getUnit(unitId) {
    var units = current().units || {};
    var u = units[unitId];
    return u ? JSON.parse(JSON.stringify(u)) : null;
  }

  function getProgress() {
    return JSON.parse(JSON.stringify(current()));
  }

  // islandCounts()：以 unit_id 首段 domain 聚合 → {<island>:{seen, mastered}}
  //  seen＝有任何進度紀錄（曾自評/看過）的單元數；mastered＝mastered:true 數。
  function islandCounts() {
    var units = current().units || {};
    var out = {};
    for (var id in units) {
      if (!Object.prototype.hasOwnProperty.call(units, id)) continue;
      var isl = islandOf(id);
      if (!out[isl]) out[isl] = { seen: 0, mastered: 0 };
      out[isl].seen += 1;
      if (units[id] && units[id].mastered === true) out[isl].mastered += 1;
    }
    return out;
  }

  // 全站總計（hub 總進度概覽用）：{seen, mastered}
  function totals() {
    var c = islandCounts(), t = { seen: 0, mastered: 0 };
    for (var k in c) if (Object.prototype.hasOwnProperty.call(c, k)) {
      t.seen += c[k].seen; t.mastered += c[k].mastered;
    }
    return t;
  }

  var LearningProgress = {
    KEY: KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    recordUnit: recordUnit,
    touchUnit: touchUnit,
    getUnit: getUnit,
    getProgress: getProgress,
    islandCounts: islandCounts,
    totals: totals,
    islandOf: islandOf,
    isAvailable: function () { ensureStore(); return available; },
    status: function () { var s = ensureStore(); return s ? s.status() : 'no-safe-store'; },
    version: '1.0.0'
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = LearningProgress; // node 測試
  global.LearningProgress = LearningProgress;                                             // 瀏覽器全域

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
