/* =====================================================================
 * safe_store.js — 共用持久化 helper（單一來源，§6.3「safe_store.js」）
 * ---------------------------------------------------------------------
 * 唯一 normative 來源＝LEARNING_PATH_REBUILD_SPEC.md §6.3 ＋ §7.1/§7.2/§7.3。
 * game_core.js（`player_profile_v1`）與進度模組（`learning_progress_v1`）
 * 都引用「同一個」此 helper，§7.1 三道保護不得各寫各的。
 *
 * 實作 §6.3 的六項要求（每項對應下列函式，見各函式開頭註解）：
 *   1. load 順序鐵律：raw ← readLS → migrate(raw) → normalize；
 *      normalize 不得注入 `version` 預設（version 只由 migrate 決定）。
 *   2. migrate()：有序 `migrations={2:fn,…}`、每步純函式、
 *      來源＝profile.version、目標＝該 key 的 SCHEMA_VERSION 常數；
 *      找不到步驟→保留原值＋告警，絕不丟棄。
 *   3. additive per-field 合併策略表：union-set／monotonic-max／
 *      last-write（每個可裝備型別的 equipped<Type>，對 reward_catalog
 *      的 equippable 型別枚舉參數化）／union-object；earned 類一律
 *      union/max、永不縮小。策略表對 equippable 型別參數化——型別無對應
 *      equipped<Type> 策略即 FAIL。
 *   4. 壞檔不重設：解析失敗→備份 `<key>__corrupt_<ts>`（同內容只備一次、
 *      最多留 3 份、超出刪最舊）、保留記憶體值；首次 load 即壞→記憶體 fresh
 *      但設 readOnlyUntilResolved 旗標，待使用者確認前禁止寫磁碟。
 *   5. reset 守門（RT-10）：reset() 須帶 {userConfirmed:true, gestureToken}，
 *      token 僅由 UI 手勢產生；程式路徑呼叫一律拒絕。
 *   6. earned 單調不減（RT-9）：save 前驗 earned 集合（ownedItems／badges／
 *      totalXp）不得比上次持久值縮小；縮小＝視為誤清→拒寫＋回滾。
 *
 * 純 vanilla JS、零依賴、無 build step（靜態站）。公開 window.SafeStore。
 * 所有註解一律繁體中文（零簡體、零 PRC 詞）。
 * ===================================================================== */
(function (global) {
  'use strict';

  // ===================================================================
  // 共用小工具
  // ===================================================================
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function num(v) { var n = Number(v); return (typeof v === 'number' && isFinite(v)) ? v : (isFinite(n) ? n : 0); }
  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }
  function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function warn() {
    try { if (global.console && global.console.warn) global.console.warn.apply(global.console, arguments); }
    catch (e) { /* 無 console 也不可崩 */ }
  }

  // union-set 的「成員集合」：陣列→元素；物件→鍵（如 badges 的 id 鍵）。
  function memberSet(v) {
    var s = Object.create(null);
    if (Array.isArray(v)) { for (var i = 0; i < v.length; i++) s[String(v[i])] = true; }
    else if (isObj(v)) { for (var k in v) if (Object.prototype.hasOwnProperty.call(v, k)) s[k] = true; }
    return s;
  }
  // 判斷 bigger 的成員集合是否 ⊇ smaller（earned 永不縮小用）。
  function isSupersetMembers(bigger, smaller) {
    var a = memberSet(bigger), b = memberSet(smaller);
    for (var k in b) if (!(k in a)) return false;
    return true;
  }

  // ===================================================================
  // 合併策略實作（要求 3）
  // union-set／monotonic-max／last-write／union-object
  // ===================================================================
  function mergeUnionSet(baseVal, incVal) {
    // earned 集合：聯集、永不縮小。陣列→去重聯集；物件→鍵聯集（既有值優先保留）。
    if (Array.isArray(baseVal) || Array.isArray(incVal)) {
      var out = [], seen = Object.create(null), src = [];
      if (Array.isArray(baseVal)) src = src.concat(baseVal);
      if (Array.isArray(incVal)) src = src.concat(incVal);
      for (var i = 0; i < src.length; i++) {
        var key = String(src[i]);
        if (!seen[key]) { seen[key] = true; out.push(src[i]); }
      }
      return out;
    }
    // 物件（如 badges map）：鍵聯集，既有（base）值優先、incoming 補其獨有鍵。
    var merged = {};
    if (isObj(incVal)) for (var ik in incVal) if (Object.prototype.hasOwnProperty.call(incVal, ik)) merged[ik] = incVal[ik];
    if (isObj(baseVal)) for (var bk in baseVal) if (Object.prototype.hasOwnProperty.call(baseVal, bk)) merged[bk] = baseVal[bk];
    return merged;
  }
  function mergeMonotonicMax(baseVal, incVal) {
    return Math.max(num(baseVal), num(incVal));
  }
  function mergeLastWrite(baseVal, incVal) {
    // last-write＝採較新寫入（incoming＝來自他分頁的最新 storage 事件）；
    // incoming 未定義時保留 base。
    return (typeof incVal === 'undefined') ? baseVal : incVal;
  }
  function mergeUnionObject(baseVal, incVal) {
    // activity／subjects：鍵聯集；同鍵若皆數字取 max（不縮小計數）、
    // 皆物件遞迴聯集、否則以 base（記憶體）優先、base 無則取 incoming。
    if (!isObj(baseVal) && !isObj(incVal)) return (typeof baseVal === 'undefined') ? incVal : baseVal;
    var out = {}, k;
    if (isObj(baseVal)) for (k in baseVal) if (Object.prototype.hasOwnProperty.call(baseVal, k)) out[k] = baseVal[k];
    if (isObj(incVal)) for (k in incVal) {
      if (!Object.prototype.hasOwnProperty.call(incVal, k)) continue;
      if (!(k in out)) { out[k] = incVal[k]; continue; }
      var a = out[k], b = incVal[k];
      if (typeof a === 'number' && typeof b === 'number') out[k] = Math.max(a, b);
      else if (isObj(a) && isObj(b)) out[k] = mergeUnionObject(a, b);
      // 其餘型別：保留 base（already in out）
    }
    return out;
  }

  var STRATEGY_FNS = {
    'union-set': mergeUnionSet,
    'monotonic-max': mergeMonotonicMax,
    'last-write': mergeLastWrite,
    'union-object': mergeUnionObject
  };

  // ===================================================================
  // 手勢 token 管理（要求 5 / RT-10）
  // token 僅由 mintGestureToken() 產生，應在「真實 UI 手勢」事件處理器內呼叫；
  // 程式自動路徑拿不到有效 token，故 reset 被擋。單次使用＋短 TTL。
  // ===================================================================
  var _tokens = Object.create(null);
  var TOKEN_TTL_MS = 8000;
  function mintGestureToken() {
    var t = 'gt_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
    _tokens[t] = Date.now() + TOKEN_TTL_MS;
    return t;
  }
  function consumeGestureToken(t) {
    if (!t || typeof t !== 'string') return false;
    var exp = _tokens[t];
    if (!exp) return false;            // 未經 mint（程式自造）→無效
    delete _tokens[t];                 // 單次使用
    if (Date.now() > exp) return false; // 過期→無效
    return true;
  }

  // ===================================================================
  // defineStore — 建立一個綁定某 localStorage key 的 store 實例
  // 每個 key（player_profile_v1／learning_progress_v1）各自 define 一次，
  // 傳入自己的 SCHEMA_VERSION／migrations／mergeStrategies／freshFactory…
  // ===================================================================
  function defineStore(config) {
    config = config || {};
    var key = config.key;
    if (!key) throw new Error('safe_store: 缺少 key');
    var SCHEMA_VERSION = ('schemaVersion' in config) ? config.schemaVersion : 1;
    var migrations = config.migrations || {};           // {2:fn,3:fn,…}
    var freshFactory = config.freshFactory || function () { return { version: SCHEMA_VERSION }; };
    var normalizeFn = config.normalize || function (p) { return p; };
    var LS = config.storage || global.localStorage;
    var onQuota = typeof config.onQuota === 'function' ? config.onQuota : null;

    // --- 合併策略表（要求 3）：對 equippable 型別參數化 ------------------
    // equippableTypes 來自 reward_catalog.json 的 types[] 中 equippable:true 枚舉
    // （目前 skin/border/mascot/avatar）。每個型別自動對映 equipped<Type> → last-write。
    var equippableTypes = (config.equippableTypes || []).slice();
    var strategies = {};
    (function buildTable() {
      var s = config.mergeStrategies || {};
      for (var f in s) if (Object.prototype.hasOwnProperty.call(s, f)) {
        if (!STRATEGY_FNS[s[f]]) throw new Error('safe_store: 未知合併策略 ' + s[f] + '（欄位 ' + f + '）');
        strategies[f] = s[f];
      }
      // 對 equippable 型別枚舉參數化：每型別 MUST 有 equipped<Type> 策略，
      // 無則補 last-write；若配置明確把某型別設成非 last-write 以外策略則保留，
      // 若完全缺且被明文禁止自動補（config.strictEquipped）則 FAIL。
      var equippedFields = [];
      for (var i = 0; i < equippableTypes.length; i++) {
        var field = 'equipped' + cap(equippableTypes[i]);
        equippedFields.push(field);
        if (!strategies[field]) {
          if (config.strictEquipped) {
            throw new Error('safe_store: equippable 型別「' + equippableTypes[i] +
              '」無對應 ' + field + ' 合併策略（型別漂移＝FAIL）');
          }
          strategies[field] = 'last-write';
        }
      }
      // 記錄 equipped 欄位集合供合併時「反向偵測漂移」：若日後出現未宣告型別的
      // equipped<Type> 欄位（type ∉ equippableTypes）→ 合併時 FAIL（杜絕靜默丟棄）。
      strategies.__equippedFields = equippedFields;
    })();

    // --- earned 單調不減守門欄位（要求 6 / RT-9）------------------------
    // RT-9 明列 earned 集合＝ownedItems／badges／totalXp。預設即此三者；
    // 可由 config.earned 覆寫。注意：coins 於合併表為 monotonic-max，但 coins
    // 可被消費（game_core spendCoins 會減少），故「不」納入 RT-9 shrink 守門。
    var earnedSets = (config.earned && config.earned.sets) || ['ownedItems', 'badges'];
    var earnedMonotonic = (config.earned && config.earned.monotonic) || ['totalXp'];

    // --- 實例狀態 ------------------------------------------------------
    var value = null;                 // 目前記憶體值
    var readOnlyUntilResolved = false; // 首次 load 即壞檔時為 true，禁止寫磁碟
    var lastStatus = 'init';

    // 讀原始字串（不 parse；parse 由 load 控制以區分 null 與壞檔）。
    function readRaw() {
      try { return LS.getItem(key); }
      catch (e) { return null; }
    }

    // ---------- 要求 4：壞檔備份（同內容只備一次、最多 3 份、刪最舊）----------
    function listCorruptBackupKeys() {
      var prefix = key + '__corrupt_';
      var out = [];
      try {
        for (var i = 0; i < LS.length; i++) {
          var k = LS.key(i);
          if (k && k.indexOf(prefix) === 0) out.push(k);
        }
      } catch (e) { /* 列舉失敗則視為無備份 */ }
      out.sort(); // 鍵含時間戳，字典序≈時間序
      return out;
    }
    function backupCorrupt(rawStr) {
      var prefix = key + '__corrupt_';
      var existing = listCorruptBackupKeys();
      // 同內容只備份一次：比對現有備份字串，若已存在相同內容則略過。
      for (var i = 0; i < existing.length; i++) {
        try { if (LS.getItem(existing[i]) === rawStr) return; } catch (e) { /* 忽略 */ }
      }
      var bk = prefix + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
      try { LS.setItem(bk, rawStr); } catch (e) { warn('[safe_store] 壞檔備份寫入失敗（可能配額滿）', key); return; }
      // 最多留 3 份、超出刪最舊。
      var all = listCorruptBackupKeys();
      while (all.length > 3) {
        var oldest = all.shift();
        try { LS.removeItem(oldest); } catch (e) { /* 忽略 */ }
      }
    }

    // ---------- 要求 2：migrate() ----------
    // 來源＝profile.version（缺則視為 1），目標＝SCHEMA_VERSION。
    // 逐版套用 migrations[v]（純函式）；找不到步驟→保留原值＋告警、絕不丟棄。
    function migrate(raw) {
      var p = raw;
      var from = (p && typeof p.version === 'number') ? p.version : 1;
      var to = SCHEMA_VERSION;
      if (from === to) return p;
      if (from > to) {
        warn('[safe_store] 存檔版本(' + from + ')高於目前 SCHEMA_VERSION(' + to + ')，保留原值不降級', key);
        return p;
      }
      for (var v = from + 1; v <= to; v++) {
        var step = migrations[v];
        if (typeof step === 'function') {
          p = step(p) || p;           // 純函式；回傳新 profile
        } else {
          warn('[safe_store] 缺少 migrate 步驟 v' + v + '，保留原值不丟棄', key);
        }
      }
      if (p && typeof p === 'object') p.version = to; // 標記已遷移至目標版
      return p;
    }

    // ---------- 要求 1：load 順序鐵律 ----------
    // raw ← readLS → migrate(raw) → normalize；version 只由 migrate 決定，
    // normalize 不得注入／改寫 version（此處機械強制：normalize 後把 version
    // 還原為 migrate 的結果，使任何 normalize 的 version 注入都無法遮蔽 migrate）。
    function load() {
      var rawStr = readRaw();
      if (rawStr === null || typeof rawStr === 'undefined') {
        value = normalizeAfterMigrate(freshFactory());
        readOnlyUntilResolved = false;
        lastStatus = 'fresh';
        return snapshot();
      }
      var parsed;
      try {
        parsed = JSON.parse(rawStr);
      } catch (e) {
        // 要求 4：壞檔不重設——備份、保留記憶體值；首次即壞→fresh＋唯讀旗標。
        backupCorrupt(rawStr);
        if (value !== null) {
          lastStatus = 'corrupt-kept'; // 已有記憶體值（reload 情境）→保留、不覆寫
        } else {
          value = normalizeAfterMigrate(freshFactory());
          readOnlyUntilResolved = true; // 禁止 save 覆寫磁碟，待使用者確認
          lastStatus = 'corrupt-fresh-readonly';
        }
        return snapshot();
      }
      var beforeVersion = (parsed && typeof parsed.version === 'number') ? parsed.version : 1;
      var migrated = migrate(parsed);
      var migratedVersion = (migrated && typeof migrated.version === 'number') ? migrated.version : SCHEMA_VERSION;
      value = normalizeAfterMigrate(migrated, migratedVersion);
      readOnlyUntilResolved = false;
      lastStatus = (migratedVersion !== beforeVersion) ? 'migrated' : 'loaded';
      return snapshot();
    }

    // normalize + 強制 version 由 migrate 決定（要求 1 的機械保證）。
    function normalizeAfterMigrate(obj, forcedVersion) {
      var fv = (typeof forcedVersion === 'number')
        ? forcedVersion
        : ((obj && typeof obj.version === 'number') ? obj.version : SCHEMA_VERSION);
      var n = normalizeFn(obj);
      if (n && typeof n === 'object') {
        if (typeof n.version === 'number' && n.version !== fv) {
          warn('[safe_store] normalize 嘗試改寫 version（' + n.version + '→還原為 ' + fv + '）', key);
        }
        n.version = fv; // version 權威來源＝migrate，normalize 不得遮蔽（要求 1）
      }
      return n;
    }

    // ---------- 要求 3：additive 合併（跨分頁 onStorage 與匯入共用）----------
    // 以策略表合併 incoming 進 base（記憶體）；earned 類 union/max、永不縮小。
    function mergeInto(baseVal, incVal) {
      var base = clone(baseVal) || {};
      if (!isObj(incVal)) return base;
      var fields = {};
      var f;
      for (f in base) if (Object.prototype.hasOwnProperty.call(base, f)) fields[f] = true;
      for (f in incVal) if (Object.prototype.hasOwnProperty.call(incVal, f)) fields[f] = true;
      for (f in fields) {
        if (f === 'version') { base.version = SCHEMA_VERSION; continue; }
        var strat = strategies[f];
        if (!strat) {
          // 反向偵測型別漂移：出現 equipped<Type> 但 Type ∉ equippableTypes → FAIL。
          var m = /^equipped(.+)$/.exec(f);
          if (m) {
            var t = m[1].charAt(0).toLowerCase() + m[1].slice(1);
            if (equippableTypes.indexOf(t) === -1) {
              throw new Error('safe_store: 偵測到未宣告 equippable 型別的欄位 ' + f +
                '（型別「' + t + '」不在 equippableTypes 枚舉）＝型別漂移 FAIL');
            }
          }
          strat = 'last-write'; // 其餘未宣告欄位預設 last-write
        }
        base[f] = STRATEGY_FNS[strat](base[f], incVal[f]);
      }
      base.version = SCHEMA_VERSION;
      return base;
    }
    // 對外：把他分頁／匯入的值 additive 併入記憶體（要求 3；供 onStorage 用）。
    function mergeIncoming(incoming) {
      value = mergeInto(value, incoming);
      return snapshot();
    }

    // ---------- 要求 6：earned 單調不減（RT-9）----------
    // save 前與「磁碟上一次持久值」比對：earned 集合不得縮小、earned 數值不得變小。
    function earnedShrinkCheck(next, persisted) {
      if (!isObj(persisted)) return null; // 無前值可比→放行
      var i;
      for (i = 0; i < earnedSets.length; i++) {
        var fld = earnedSets[i];
        if (!(fld in persisted)) continue;
        if (!isSupersetMembers(next[fld], persisted[fld])) {
          return { field: fld, kind: 'set' };
        }
      }
      for (i = 0; i < earnedMonotonic.length; i++) {
        var mf = earnedMonotonic[i];
        if (!(mf in persisted)) continue;
        if (num(next[mf]) < num(persisted[mf])) {
          return { field: mf, kind: 'monotonic', was: num(persisted[mf]), now: num(next[mf]) };
        }
      }
      return null;
    }

    // ---------- save（寫前先讀＋RT-9＋壞檔不重設＋配額告警）----------
    function save(next) {
      if (readOnlyUntilResolved) {
        warn('[safe_store] readOnlyUntilResolved 生效中，拒絕寫磁碟（待使用者確認）', key);
        return { ok: false, reason: 'read-only-until-resolved' };
      }
      if (!isObj(next)) return { ok: false, reason: 'invalid-value' };

      // 寫前先讀磁碟上一次持久值（RT-9 以磁碟為權威，獨立於記憶體）。
      var persistedStr = readRaw();
      var persisted = null;
      if (persistedStr !== null && typeof persistedStr !== 'undefined') {
        try {
          persisted = JSON.parse(persistedStr);
        } catch (e) {
          // 磁碟壞檔：壞檔不重設——備份後以記憶體好值續寫（保全 earned），不比對。
          backupCorrupt(persistedStr);
          warn('[safe_store] 寫入前偵測磁碟壞檔，已備份，改以記憶體值續寫', key);
          persisted = null;
        }
      }

      // 要求 6（RT-9）：earned 不得縮小。縮小＝視為誤清→拒寫＋回滾。
      var shrink = earnedShrinkCheck(next, persisted);
      if (shrink) {
        warn('[safe_store] earned 縮小被擋（' + shrink.field + '）＝疑似誤清，拒寫並回滾', key, shrink);
        // 回滾：把磁碟持久的 earned 值 additive 併回記憶體，使 earned 不被就地清空。
        value = mergeInto(next, persisted);
        return { ok: false, reason: 'earned-shrink', detail: shrink, rolledBack: true };
      }

      // 實際寫入（配額滿→呼叫 onQuota 讓呼叫端釋放空間後重試一次；仍失敗→告警、
      // 保留記憶體值不遺失，回傳 quota 失敗，不靜默吞掉，§R6/RT-7）。
      var str = JSON.stringify(next);
      try {
        LS.setItem(key, str);
      } catch (e) {
        if (onQuota) {
          try { onQuota(key); } catch (e2) { /* 呼叫端釋放失敗 */ }
          try { LS.setItem(key, str); }
          catch (e3) {
            warn('[safe_store] 配額滿，寫入失敗（已告警，記憶體值保全）', key);
            value = next;
            return { ok: false, reason: 'quota' };
          }
        } else {
          warn('[safe_store] 配額滿，寫入失敗（已告警，記憶體值保全）', key);
          value = next;
          return { ok: false, reason: 'quota' };
        }
      }
      value = next;
      return { ok: true };
    }

    // ---------- 要求 5：reset 守門（RT-10）----------
    function reset(opts) {
      opts = opts || {};
      if (opts.userConfirmed !== true || !consumeGestureToken(opts.gestureToken)) {
        warn('[safe_store] reset 被拒：須 {userConfirmed:true, gestureToken}（手勢 token），程式路徑不得全清', key);
        return { ok: false, reason: 'reset-denied' };
      }
      var fresh = normalizeAfterMigrate(freshFactory());
      // reset 為使用者授權的全清，繞過 RT-9（直接寫，不經 earned 守門）。
      try { LS.setItem(key, JSON.stringify(fresh)); }
      catch (e) { warn('[safe_store] reset 寫入失敗', key); }
      value = fresh;
      readOnlyUntilResolved = false;
      lastStatus = 'reset';
      return { ok: true, value: snapshot() };
    }

    // ---------- readOnlyUntilResolved 解除（須使用者確認；要求 4 尾端）----------
    function confirmReadOnlyResolved(opts) {
      opts = opts || {};
      if (opts.userConfirmed !== true || !consumeGestureToken(opts.gestureToken)) {
        return { ok: false, reason: 'confirm-denied' };
      }
      readOnlyUntilResolved = false;
      return { ok: true };
    }

    function snapshot() { return clone(value); }

    return {
      key: key,
      SCHEMA_VERSION: SCHEMA_VERSION,
      load: load,
      save: save,
      migrate: migrate,                 // 曝露供測試／工具（純函式）
      mergeIncoming: mergeIncoming,     // 跨分頁 onStorage／匯入用（additive）
      reset: reset,
      confirmReadOnlyResolved: confirmReadOnlyResolved,
      getInMemory: snapshot,
      isReadOnly: function () { return readOnlyUntilResolved; },
      status: function () { return lastStatus; },
      // 測試輔助：檢視策略表（含參數化後的 equipped<Type> 欄）。
      _strategies: function () { return clone(strategies); }
    };
  }

  // ===================================================================
  // 公開 API
  // ===================================================================
  var SafeStore = {
    defineStore: defineStore,
    mintGestureToken: mintGestureToken,   // 應在真實 UI 手勢事件處理器內呼叫
    // 合併策略原語（供測試／進階呼叫端）
    _strategyFns: STRATEGY_FNS,
    version: '1.0.0'
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = SafeStore; // node 測試
  global.SafeStore = SafeStore;                                                   // 瀏覽器全域

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
