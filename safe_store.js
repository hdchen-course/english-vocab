/*
 * safe_store.js — §6.3 / §7.1 單一共用持久化 helper（R5：三道保護不得各寫各的）。
 *
 * game_core.js（player_profile_v1）與逐單元進度模組（learning_progress_v1）都引用「同一個」本檔，
 * 兌現 never-disappear：
 *   (a) 壞檔不重設——解析失敗 → 備份到 <key>__corrupt_<ts>、保留記憶體值、絕不空白覆寫。
 *   (b) additive 合併——只補預設、不覆蓋既有；earned 類一律 union/max、永不縮小。
 *   (c) 真實 migrate()——讀「存檔 version 欄」比對當前 SCHEMA_VERSION 常數逐版遷移，不讀自我恆等值。
 *
 * load 順序鐵律（§6.3 line 548）：raw ← readLS → migrate(raw) → normalize；
 *   normalize 不得注入 version 預設（否則舊檔被補成當前版、migrate 永遠偵測不到 → RT-4 失效）。
 *
 * 用法（每個 key 一個 store）：
 *   var store = SafeStore.create({
 *     storageKey: 'player_profile_v1', schemaVersion: 2,
 *     defaults: {...},                 // 預設 profile（不含 version；version 只由 migrate 決定）
 *     migrations: { 2: function(p){ ...; return p; } },   // 有序表 {targetVersion: fn}
 *     fields: { totalXp:'monotonic-max', ownedItems:'union-set', equippedSkin:'last-write', ... },
 *     equippableTypes: ['skin','border','mascot','avatar'],  // 來源＝reward_catalog.json types[].equippable
 *   });
 *   var profile = store.load();          // 走三道保護
 *   store.save(profile);
 *   store.attachCrossTab();              // onStorage 跨分頁合併（用同一策略表）
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api; // Node / 測試
  root.SafeStore = api;                                                       // 瀏覽器 window.SafeStore
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var STRATEGIES = { 'union-set': 1, 'monotonic-max': 1, 'last-write': 1, 'union-object': 1 };

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // 深拷貝（避免跨 store 共享參照）；只處理 JSON 安全值。
  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }

  // ── per-field 合併（§6.3 line 550 策略表）：b 為「新來值」合併進 a（既有值）────────────
  function mergeField(strategy, a, b) {
    switch (strategy) {
      case 'monotonic-max': // totalXp/coins/longestStreak/mastery 等級——永不變小
        if (typeof b !== 'number') return a;
        if (typeof a !== 'number') return b;
        return Math.max(a, b);
      case 'union-set': { // ownedItems/badges 鍵/已完成 unit 集——earned 只增
        var out = {}, k;
        if (a && typeof a === 'object') for (k in a) if (a[k]) out[k] = true;
        if (b && typeof b === 'object') for (k in b) if (b[k]) out[k] = true;
        return out;
      }
      case 'union-object': { // activity/subjects——鍵聯集，值遞迴取 max（數字）或 last-write
        var o = {}, kk;
        if (a && typeof a === 'object') for (kk in a) o[kk] = a[kk];
        if (b && typeof b === 'object') for (kk in b) {
          o[kk] = (typeof o[kk] === 'number' && typeof b[kk] === 'number')
            ? Math.max(o[kk], b[kk]) : (b[kk] !== undefined ? b[kk] : o[kk]);
        }
        return o;
      }
      case 'last-write': // equipped<Type>/displayName/settings——取新值（新值為 undefined 時留舊）
      default:
        return b === undefined ? a : b;
    }
  }

  // ── additive 合併兩份 profile（base 既有、incoming 新來）；未列策略的欄位 → last-write ──
  function mergeProfiles(fields, base, incoming) {
    var out = clone(base) || {};
    var keys = {}, k;
    for (k in (base || {})) keys[k] = 1;
    for (k in (incoming || {})) keys[k] = 1;
    for (k in keys) {
      if (k === 'version') { // version 不參與合併，取較高者（避免倒退）
        out.version = mergeField('monotonic-max', base ? base.version : undefined,
                                 incoming ? incoming.version : undefined);
        continue;
      }
      var strat = fields[k] || 'last-write';
      var bv = base ? base[k] : undefined, iv = incoming ? incoming[k] : undefined;
      if (iv === undefined) { out[k] = bv; continue; }
      if (bv === undefined) { out[k] = iv; continue; }
      out[k] = mergeField(strat, bv, iv);
    }
    return out;
  }

  // ── migrate()（§6.3 line 549）：version 來源＝profile.version、目標＝schemaVersion 常數 ──
  function migrate(migrations, schemaVersion, profile) {
    if (!profile || typeof profile !== 'object') return profile;
    var v = (typeof profile.version === 'number') ? profile.version : 1; // 無 version 的舊檔視為 v1
    while (v < schemaVersion) {
      var fn = migrations[v + 1];
      if (typeof fn !== 'function') { // 找不到步驟 → 保留原值並告警、不丟棄
        if (typeof console !== 'undefined') console.warn('[safe_store] 缺 migrate 步驟 v' + (v + 1) + '，保留原值');
        break;
      }
      profile = fn(profile) || profile;
      v = v + 1;
      profile.version = v; // 由 migrate 決定 version（normalize 不得碰）
    }
    return profile;
  }

  function create(schema) {
    if (!schema || !schema.storageKey) throw new Error('[safe_store] 缺 storageKey');
    var fields = schema.fields || {};
    var equippable = schema.equippableTypes || [];
    // 策略值合法性
    for (var f in fields) if (!STRATEGIES[fields[f]]) throw new Error('[safe_store] 未知合併策略 ' + fields[f] + '（' + f + '）');
    // 完整性鐵律：每個 equippable 型別都要有 equipped<Type> 的 last-write 策略，否則 FAIL（§6.3 line 550）
    for (var i = 0; i < equippable.length; i++) {
      var key = 'equipped' + cap(equippable[i]);
      if (fields[key] !== 'last-write')
        throw new Error('[safe_store] equippable 型別「' + equippable[i] + '」缺 ' + key + ' 的 last-write 合併策略（型別漂移防呆）');
    }

    var ls = schema.storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    var mem = clone(schema.defaults) || {}; // 記憶體內既有值（壞檔時的回退來源）

    function normalize(p) { // 只補預設、不注入 version
      var base = clone(schema.defaults) || {}, out = clone(p) || {}, k;
      for (k in base) if (out[k] === undefined) out[k] = base[k];
      return out;
    }

    function readRaw() {
      if (!ls) return null;
      var raw = ls.getItem(schema.storageKey);
      if (raw == null) return null;       // 不存在 / 被 removeItem
      return JSON.parse(raw);             // 解析失敗 → 擲出，由 load 接住
    }

    function load() {
      var parsed;
      try { parsed = readRaw(); }
      catch (e) { // (a) 壞檔不重設：備份原字串、保留記憶體值、絕不空白覆寫
        try {
          if (ls) {
            var bad = ls.getItem(schema.storageKey);
            ls.setItem(schema.storageKey + '__corrupt_' + Date.now(), bad);
          }
        } catch (_) {}
        if (typeof console !== 'undefined') console.warn('[safe_store] ' + schema.storageKey + ' 解析失敗，已備份壞檔、保留現值');
        return normalize(mem); // 不寫回、不覆蓋壞檔以外的主 key
      }
      if (parsed == null) { mem = normalize(clone(schema.defaults)); return clone(mem); }
      var migrated = migrate(schema.migrations || {}, schema.schemaVersion, parsed); // (c) 真實 migrate
      var merged = mergeProfiles(fields, schema.defaults, migrated);                 // (b) additive：預設補洞、既有不覆蓋
      mem = normalize(merged);
      return clone(mem);
    }

    function save(profile) {
      mem = clone(profile);
      if (!ls) return false;
      try { ls.setItem(schema.storageKey, JSON.stringify(profile)); return true; }
      catch (e) { if (typeof console !== 'undefined') console.warn('[safe_store] 寫入失敗', e); return false; }
    }

    // 跨分頁：另一分頁寫同 key → 以同一策略表合併（earned union/max，不倒退）
    function mergeIncoming(incoming) {
      var merged = mergeProfiles(fields, mem, migrate(schema.migrations || {}, schema.schemaVersion, incoming));
      mem = normalize(merged);
      return clone(mem);
    }
    function attachCrossTab() {
      if (typeof window === 'undefined' || !window.addEventListener) return function () {};
      var handler = function (e) {
        if (!e || e.key !== schema.storageKey || e.newValue == null) return;
        try { mergeIncoming(JSON.parse(e.newValue)); } catch (_) {}
      };
      window.addEventListener('storage', handler);
      return function () { window.removeEventListener('storage', handler); };
    }

    return {
      load: load, save: save, attachCrossTab: attachCrossTab,
      // 下列為測試/進階用，純函式無副作用
      _migrate: function (p) { return migrate(schema.migrations || {}, schema.schemaVersion, p); },
      _merge: function (b, i) { return mergeProfiles(fields, b, i); },
      _normalize: normalize, _mergeIncoming: mergeIncoming,
      get current() { return clone(mem); }
    };
  }

  return { create: create, mergeField: mergeField, _STRATEGIES: STRATEGIES };
});
