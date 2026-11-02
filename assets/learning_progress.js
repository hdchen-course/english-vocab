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

  // ===================================================================
  // §6.3／§7.1 舊 concept_engine progKey → learning_progress_v1 additive 遷移
  //   舊格式：localStorage[progKey] = { <lesson_id>: <truthy 代表已完成> }
  //   對照表：authoring/progkey_migration.json → 執行期 window.PROGKEY_MIGRATION
  //           （每筆 {old_progKey, lesson_id, new_unit_id}；見 gen_progkey_runtime.py）
  //   規則（never-disappear 雙保險）：
  //     - 舊 lesson 已完成 → 對新 unit 呼 recordUnit(id,{mastered:true})（additive、
  //       mastered 單調不回退 → 天然 idempotent，重跑安全）。
  //     - **絕不刪除或改寫任何 old_progKey**（舊進度永久保留，雙保險）。
  //     - SafeStore 未載入 → graceful no-op；未完成/無此 key/對不到 → 跳過不報錯。
  //   storageObj 參數供測試注入；預設 global.localStorage。
  // ===================================================================
  function migrateFromProgKeys(mapping, storageObj) {
    var s = ensureStore();
    if (!s) return { available: false };            // graceful no-op
    mapping = mapping || global.PROGKEY_MIGRATION || [];
    var ls = storageObj || (typeof global.localStorage !== 'undefined' ? global.localStorage : null);
    var res = { available: true, scanned: 0, migrated: 0, alreadyDone: 0, noKey: 0, notDone: 0 };
    if (!ls || !Array.isArray(mapping)) return res;
    var cache = {};                                 // 每個 progKey 只解析一次
    function parsed(k) {
      if (!(k in cache)) {
        var raw = null;
        try { raw = ls.getItem(k); } catch (_) { raw = null; }
        if (raw == null) { cache[k] = null; }       // key 不存在
        else { try { var p = JSON.parse(raw); cache[k] = (p && typeof p === 'object') ? p : {}; } catch (_) { cache[k] = {}; } }
      }
      return cache[k];
    }
    for (var i = 0; i < mapping.length; i++) {
      var e = mapping[i];
      if (!e || !e.old_progKey || !e.lesson_id || !e.new_unit_id) continue;
      res.scanned++;
      var prog = parsed(e.old_progKey);
      if (prog == null) { res.noKey++; continue; }          // 舊 key 不存在（沒玩過該頁）
      if (!prog[e.lesson_id]) { res.notDone++; continue; }  // 該課未完成
      var existing = getUnit(e.new_unit_id);
      if (existing && existing.mastered === true) { res.alreadyDone++; continue; }  // 已遷移/已學會
      recordUnit(e.new_unit_id, { mastered: true });        // additive、單調、舊 key 不動
      res.migrated++;
    }
    return res;   // 全程未觸碰任何 old_progKey
  }

  // 頁面載入時自動遷移一次（讀當下的 window.PROGKEY_MIGRATION；node 無 document 時不自動跑，由測試顯式呼叫）
  function autoMigrate() { try { if (global.PROGKEY_MIGRATION) migrateFromProgKeys(); } catch (_) { /* 遷移失敗不可崩頁 */ } }
  try {
    if (typeof document !== 'undefined' && document.addEventListener) {
      if (document.readyState !== 'loading') autoMigrate();
      else document.addEventListener('DOMContentLoaded', autoMigrate);
    }
  } catch (_) { /* 無 document 環境略過 */ }

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

  // ===================================================================
  // 壞檔唯讀查詢／使用者確認解除（§6.3 要求 4 尾端：待使用者確認才可寫）
  // -------------------------------------------------------------------
  // isReadOnly()：首次 load 即壞檔時為 true（safe_store 禁止寫磁碟，保護既有
  //   進度不被空白 fresh 覆寫）。呼叫會確保 store 已 load（才知道是否壞檔）。
  //
  // confirmReadOnlyResolved(evt)：唯一對外的「解除唯讀」入口，必須由**真實
  //   使用者手勢**（click/keydown 等 DOM 事件）同步呼叫，並把該事件物件傳入。
  //   防線分兩層：
  //     (1) 瀏覽器層可驗證的手勢證明＝`evt.isTrusted === true`。真實使用者操作
  //         產生的事件 isTrusted 為 true；由程式 dispatchEvent 合成的事件
  //         isTrusted 為 false → 一律拒絕。此為**可強制**的手勢閘門。
  //     (2) safe_store 的 gesture token：本函式在通過 (1) 後才呼叫
  //         SafeStore.mintGestureToken() 取 token，再帶 token 呼叫私有的
  //         store.confirmReadOnlyResolved({userConfirmed, gestureToken})。store
  //         實例為本模組閉包私有、未對外曝露，故程式唯一可達路徑就是本函式，
  //         而本函式被 (1) 擋住無真實事件者。
  //   誠實限制：SafeStore.mintGestureToken() 本身並非由瀏覽器手勢 API 直接
  //   gating（任何程式都能呼叫它產生 token）；真正「把 mint 綁到真實手勢」的，
  //   是本函式的 isTrusted 檢查。若沒有 (1)，程式即可 mint＋confirm 繞過防線——
  //   故 (1) 不可省。無真實事件、或 isTrusted 非 true → 回 {ok:false}，唯讀保持。
  function isReadOnly() {
    var s = ensureStore();
    return !!(s && typeof s.isReadOnly === 'function' && s.isReadOnly());
  }
  function confirmReadOnlyResolved(evt) {
    // (1) 可強制的真實手勢閘門：必須是 isTrusted 的 DOM 事件。
    if (!evt || evt.isTrusted !== true) {
      return { ok: false, reason: 'no-user-gesture' };
    }
    var s = ensureStore();
    if (!s || typeof s.confirmReadOnlyResolved !== 'function') {
      return { ok: false, reason: 'no-safe-store' };
    }
    if (!s.isReadOnly()) return { ok: true, reason: 'not-read-only' };
    var SS = global.SafeStore;
    if (!SS || typeof SS.mintGestureToken !== 'function') {
      return { ok: false, reason: 'no-mint' };
    }
    // (2) 通過真實手勢後才 mint token，立即帶 token 呼叫私有解除（單次使用、短 TTL）。
    var token = SS.mintGestureToken();
    return s.confirmReadOnlyResolved({ userConfirmed: true, gestureToken: token });
  }

  var LearningProgress = {
    KEY: KEY,
    SCHEMA_VERSION: SCHEMA_VERSION,
    recordUnit: recordUnit,
    touchUnit: touchUnit,
    getUnit: getUnit,
    migrateFromProgKeys: migrateFromProgKeys,
    getProgress: getProgress,
    islandCounts: islandCounts,
    totals: totals,
    islandOf: islandOf,
    isReadOnly: isReadOnly,
    confirmReadOnlyResolved: confirmReadOnlyResolved,
    isAvailable: function () { ensureStore(); return available; },
    status: function () { var s = ensureStore(); return s ? s.status() : 'no-safe-store'; },
    version: '1.0.0'
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = LearningProgress; // node 測試
  global.LearningProgress = LearningProgress;                                             // 瀏覽器全域

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
