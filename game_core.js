/* =====================================================================
 * game_core.js — 公館國小電子書 統一遊戲化引擎（唯一全域 window.Game）
 * ---------------------------------------------------------------------
 * 依 BLUEPRINT.md §4（並參 §3、§5.6）實作：
 *   - 資料模型 player_profile_v1（§4.3）
 *   - 事件 API（§4.4）：recordAnswer / award / recordSession / pingActive /
 *                        awardBadge / getProfile / on / off / showToast / reset
 *   - 非破壞式一次性 seed + 冪等 delta-sync + reset/null 防護（§4.6）
 *   - HUD 策略（§4.5）：只在「無原生 HUD」的頁注入浮動 HUD
 *   - 本地 YYYY-MM-DD 日界、debounced try/catch 存檔、跨分頁 storage 事件、
 *     activity 裁剪 365 天
 *
 * 無框架、無外部網路依賴、無 build step。單一 IIFE。
 * 所有面向孩子的字串一律繁體中文。
 *
 * 設計守則（§3.6）：無寶箱/轉蛋/隨機獎勵、無真錢/IAP、無失落厭惡文案。
 *   金幣＝累積的「學習點數」，純粹記錄努力；不綁任何可解鎖物品/造型
 *   （靜態網頁一旦資料被清除，綁兌換會造成孩子的失落感），也不提供買提示/跳關路徑。
 *   spendCoins() 為休眠 API（目前全站無任何消費點），保留僅為介面完整、不影響此政策。
 * ===================================================================== */
(function (window, document) {
  'use strict';

  // ===================================================================
  // CONFIG — 集中所有可調參數（§4.2）。全繁體字串。
  // ===================================================================
  var CONFIG = {
    storageKey: 'player_profile_v1',
    schemaVersion: 1,

    // 每答對一題的基礎 XP；乘上 combo 倍率。
    baseXp: 5,

    // 每日目標 XP（§4.3 daily.goalXp 預設）。
    dailyGoalXp: 50,

    // 連續天數「護盾」(freeze) 設定（§3.4 緩解失落厭惡）。
    // 護盾在缺席一天時自動續接連續紀錄，避免生病／放假的孩子被重置而受挫。
    // 舊版只給固定 2 個且用盡後永不補充；改為隨活躍緩慢回補：
    // 每累積 streakFreezeEarnEvery 個「有效活躍日」回補 1 個，最多到 streakFreezeMax。
    // 回補只增不減、單調安全，且對舊存檔相容（normalizeProfile 會補齊欄位）。
    streakFreezeMax: 3,
    streakFreezeEarnEvery: 7,

    // 達成每日目標的一次性金幣獎勵（純為累積的學習點數，不綁兌換）。
    dailyCompleteCoinBonus: 20,

    // 賺得 XP 時同步賺得的金幣比例（豐足、可預期；§3.3 守則 4）。
    coinsPerXp: 0.2,

    // 預設頭像與暱稱（無 PII）。
    defaultAvatar: '🦊',
    defaultName: '小小探險家',

    // activity heatmap 最多保留天數（§4.7 配額）。
    activityMaxDays: 365,

    // 存檔 debounce（毫秒）。
    saveDebounceMs: 400,

    // combo 倍率曲線（§4.4）。連續答對越多，單題 XP 越高，但有上限，
    // 避免鼓勵馬拉松式刷題（§3.3）。
    comboMultiplier: function (combo) {
      if (combo >= 10) return 3;
      if (combo >= 6) return 2;
      if (combo >= 3) return 1.5;
      return 1;
    },

    // 等級曲線（§3.2：前期升級快、之後緩升）。
    // 第 1 級門檻為 0；升到第 L+1 級所需的「該級花費」= base * growth^(L-1)。
    levelCurve: {
      baseCost: 40,
      growth: 1.15,
      maxLevel: 99
    },

    // 中文階名（§3.2），依「達到的最低等級」對應。全繁體。
    // 低階童趣、逐階「長大」為莊重／學術風，讓一路成長到進階內容的大孩子（小四→高一）
    // 仍覺得被當大人對待、不幼稚。階名只加在既有等級之上（純加成、對既有使用者零影響）。
    // 上限落在曲線「多年重度仍可達」的區間（詳見 levelCurve 註記）；Lv.40 為遠程榮譽階。
    RANKS: [
      { minLevel: 1,  name: '探險新手',   icon: '🌱' },
      { minLevel: 3,  name: '小小學者',   icon: '📖' },
      { minLevel: 6,  name: '知識小勇者', icon: '🗡️' },
      { minLevel: 10, name: '智慧達人',   icon: '🧠' },
      { minLevel: 15, name: '學問大俠',   icon: '🏅' },
      { minLevel: 20, name: '博學宗師',   icon: '👑' },
      { minLevel: 24, name: '飽學之士',   icon: '🎓' },
      { minLevel: 28, name: '睿智賢者',   icon: '🦉' },
      { minLevel: 33, name: '學識大師',   icon: '🌠' },
      { minLevel: 40, name: '學界泰斗',   icon: '🌌' }
    ],

    // 成就徽章定義（里程碑式、一次性；§3.2/§3.4）。全繁體。
    // 分三群：入門里程碑（快速給到成就感）、長期里程碑（撐多年成長，一路小四→高一都有目標）、
    // 各科精熟（鼓勵每科都持續深耕，成長不中斷）。順序＝徽章牆顯示順序。
    BADGES: {
      // — 入門里程碑 —
      first_answer: { name: '第一步',       icon: '👣', desc: '答對第一題' },
      correct_100:  { name: '百題達人',     icon: '💯', desc: '累積答對 100 題' },
      correct_500:  { name: '答題高手',     icon: '🎯', desc: '累積答對 500 題' },
      streak_7:     { name: '一週不間斷',   icon: '🔥', desc: '連續學習 7 天' },
      streak_30:    { name: '月月用功',     icon: '🌟', desc: '連續學習 30 天' },
      level_5:      { name: '穩步向前',     icon: '🚀', desc: '達到等級 5' },
      level_10:     { name: '知識探險家',   icon: '🧭', desc: '達到等級 10' },
      daily_first:  { name: '今日任務達成', icon: '✅', desc: '完成一次每日任務' },
      all_subjects: { name: '全能小達人',   icon: '🌈', desc: '每個科目都玩過' },
      // — 長期里程碑（撐多年、皆為可達目標：答對數與連續天數隨遊玩線性累積，不像等級曲線後段那樣難達）—
      level_20:     { name: '勇攀高峰',     icon: '⛰️', desc: '達到等級 20' },
      correct_1000: { name: '千題達人',     icon: '🏆', desc: '累積答對 1000 題' },
      correct_2000: { name: '兩千題達人',   icon: '🎖️', desc: '累積答對 2000 題' },
      correct_5000: { name: '五千題大師',   icon: '🥇', desc: '累積答對 5000 題' },
      streak_100:   { name: '百日恆心',     icon: '🗓️', desc: '連續學習 100 天' },
      streak_365:   { name: '全年恆心',     icon: '🎆', desc: '連續學習 365 天' },
      // — 各科精熟（每科答對 200 題）—
      master_math:    { name: '數學達人', icon: '➗', desc: '數學答對 200 題' },
      master_english: { name: '英文達人', icon: '🔤', desc: '英文答對 200 題' },
      master_chinese: { name: '國語達人', icon: '✍️', desc: '國語答對 200 題' },
      master_social:  { name: '社會達人', icon: '🗺️', desc: '社會答對 200 題' },
      master_finance: { name: '理財達人', icon: '💰', desc: '理財答對 200 題' },
      master_science: { name: '自然達人', icon: '🔬', desc: '自然答對 200 題' },
      // — 全科通才（每一科都達精熟；長遠的總目標）—
      all_subjects_master: { name: '全科通才', icon: '🏛️', desc: '每一科都答對 200 題' }
    }
  };

  // 科目 enum（§4.3 + §6.5 finance）。science = 自然（理化/生物/地科），計入總 XP 與等級，
  // 讓學生成長到進階/國高中內容時獎勵不中斷（normalizeProfile 會自動為既有存檔補上此科目）。
  var SUBJECTS = ['math', 'english', 'chinese', 'social', 'finance', 'science'];

  // 事件名稱（§4.4）。
  var EVENTS = ['xp', 'levelup', 'badge', 'streak', 'daily-complete', 'theme'];

  // ===================================================================
  // 內部狀態
  // ===================================================================
  var profile = null;              // 記憶體中的 player_profile_v1
  var sessionCombo = {};           // 每科 in-session 連答（不持久化）
  var listeners = {};              // 事件匯流排
  var saveTimer = null;            // debounce 計時器
  var storageAvailable = true;     // localStorage 是否可用
  var writingSelf = false;         // 標記自身寫入，過濾 storage 事件
  var levelThresholdCache = null;  // 等級累積門檻快取

  // ===================================================================
  // 主題（夜間模式）—— 使用者可切換、預設亮色（不跟隨系統）（§spec）
  // -------------------------------------------------------------------
  // 真相來源為 profile.settings.theme；另存一支獨立輕量 key 'ui_theme'，
  // 好讓本 IIFE 能在 profile 載入前、首次 paint 前就套上 data-theme，避免
  // 進入夜間模式時的「亮色閃爍」（flash-of-light）。
  // ===================================================================
  var THEME_KEY = 'ui_theme';
  var THEME_BG = { light: '#FAF6EE', dark: '#241E17' };  // 對應 --bg，同步 meta theme-color

  function normTheme(t) { return (t === 'dark') ? 'dark' : 'light'; }

  // 讀取獨立主題偏好（key 不存在/不可用 → 'light'）。
  function readThemePref() {
    try { return normTheme(localStorage.getItem(THEME_KEY)); }
    catch (e) { return 'light'; }
  }

  // 同步行動瀏覽器 chrome 顏色，避免載入時 chrome 閃亮色。
  function updateThemeMeta(theme) {
    try {
      var meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        (document.head || document.documentElement).appendChild(meta);
      }
      meta.setAttribute('content', THEME_BG[theme] || THEME_BG.light);
    } catch (e) { /* ignore */ }
  }

  // 純套用：設/清 data-theme + 同步 meta（不寫入儲存）。
  function applyTheme(theme) {
    theme = normTheme(theme);
    try {
      var root = document.documentElement;
      if (theme === 'dark') root.setAttribute('data-theme', 'dark');
      else root.removeAttribute('data-theme');
    } catch (e) { /* ignore */ }
    updateThemeMeta(theme);
    return theme;
  }

  function currentTheme() {
    try { return (document.documentElement.getAttribute('data-theme') === 'dark') ? 'dark' : 'light'; }
    catch (e) { return 'light'; }
  }

  // 盡早套用（在 HUD render 前、首次 paint 前）：本 script 於 <head> 同步執行，
  // 此行在 CONFIG/profile 準備好之前就先把 data-theme 上好，消除閃爍。
  applyTheme(readThemePref());

  // ===================================================================
  // 工具函式
  // ===================================================================

  // 本地 YYYY-MM-DD（非 UTC；§4.7 streak 日界）。
  function localDate(d) {
    d = d || new Date();
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }

  function nowISO() { return new Date().toISOString(); }

  // 兩個本地日期字串相差幾天（a 較早 → 正值）。
  function dayDiff(fromStr, toStr) {
    if (!fromStr || !toStr) return null;
    var a = new Date(fromStr + 'T00:00:00');
    var b = new Date(toStr + 'T00:00:00');
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
    return Math.round((b - a) / 86400000);
  }

  function isSubject(s) { return SUBJECTS.indexOf(s) !== -1; }

  function num(v) { return (typeof v === 'number' && isFinite(v)) ? v : 0; }

  // 安全讀取 localStorage → 解析 JSON。key 不存在/被 removeItem 回 null（null-guard，§4.6）。
  function readLS(key) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null || raw === undefined) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  // ===================================================================
  // 等級曲線
  // ===================================================================

  // 建立「達到第 L 級所需的累積 XP」門檻表（cumulative[L] = 到達 L 級門檻）。
  function ensureThresholds() {
    if (levelThresholdCache) return levelThresholdCache;
    var lc = CONFIG.levelCurve;
    var cum = [0, 0]; // index 0 未用；level 1 門檻 = 0
    var total = 0;
    for (var L = 1; L < lc.maxLevel; L++) {
      var cost = Math.round(lc.baseCost * Math.pow(lc.growth, L - 1));
      total += cost;
      cum[L + 1] = total; // 到達 L+1 級所需累積
    }
    levelThresholdCache = cum;
    return cum;
  }

  // 由 totalXp 推導等級（§4.3 level 為快取值）。
  function levelForXp(xp) {
    xp = num(xp);
    var cum = ensureThresholds();
    var level = 1;
    for (var L = 2; L < cum.length; L++) {
      if (xp >= cum[L]) level = L; else break;
    }
    return level;
  }

  // 回傳等級相關的衍生資訊，供 HUD / getProfile 使用。
  function levelInfo(xp) {
    xp = num(xp);
    var cum = ensureThresholds();
    var level = levelForXp(xp);
    var floor = cum[level] || 0;
    var ceil = cum[level + 1];
    var into = xp - floor;
    var need = (ceil === undefined) ? 0 : (ceil - floor);
    var remaining = (ceil === undefined) ? 0 : (ceil - xp);
    return {
      level: level,
      xpIntoLevel: into,
      xpForLevel: need,          // 本級總需求（滿級為 0）
      xpToNext: remaining,       // 距下一級（滿級為 0）
      progress: need > 0 ? Math.min(1, into / need) : 1,
      isMax: ceil === undefined
    };
  }

  function rankForLevel(level) {
    var r = CONFIG.RANKS[0];
    for (var i = 0; i < CONFIG.RANKS.length; i++) {
      if (level >= CONFIG.RANKS[i].minLevel) r = CONFIG.RANKS[i];
    }
    return r;
  }

  // ===================================================================
  // Profile 建立 / 載入 / 存檔
  // ===================================================================

  function freshSubject() {
    return { xp: 0, correct: 0, attempts: 0, bestCombo: 0, lastPlayed: null, badges: [] };
  }

  function freshProfile() {
    var subjects = {};
    for (var i = 0; i < SUBJECTS.length; i++) subjects[SUBJECTS[i]] = freshSubject();
    var today = localDate();
    return {
      version: CONFIG.schemaVersion,
      createdAt: nowISO(),
      updatedAt: nowISO(),
      displayName: CONFIG.defaultName,
      avatar: CONFIG.defaultAvatar,
      totalXp: 0,
      level: 1,
      coins: 0,
      subjects: subjects,
      streak: { current: 0, longest: 0, lastActiveDate: null, freezes: 2, freezeProgress: 0 },
      daily: { date: today, goalXp: CONFIG.dailyGoalXp, earnedXp: 0, done: false },
      activity: {},
      badges: {},
      ownedItems: [],
      equippedMascot: null,
      lastRoute: null,
      settings: { sound: true, reduceMotion: false, theme: 'light' },
      legacyShadow: {
        math_progress_exp: 0,
        mult_progress_exp: 0,
        chinese_exp: 0,
        english_total_reviews: 0
      },
      // 「已接線來源」黏著旗標：任一頁宣告 data-game-wired 後即持久化於此，
      // 之後所有頁（含未宣告的 hub / 其他科目頁）一律抑制該來源的 delta 補發，
      // 避免「在接線頁即時記帳的 legacy 成長」被其他頁當成 delta 重複計分。
      wiredSources: {},
      migratedFlags: { v1_seeded: false }
    };
  }

  // 修補由舊版/損毀資料載入的 profile，確保所有欄位存在（防禦式）。
  function normalizeProfile(p) {
    if (!p || typeof p !== 'object') return freshProfile();
    var base = freshProfile();
    // 淺合併頂層，逐一補齊巢狀結構。
    for (var k in base) {
      if (!(k in p) || p[k] === null || p[k] === undefined) p[k] = base[k];
    }
    if (typeof p.subjects !== 'object' || !p.subjects) p.subjects = {};
    for (var i = 0; i < SUBJECTS.length; i++) {
      var s = SUBJECTS[i];
      var fs = freshSubject();
      if (typeof p.subjects[s] !== 'object' || !p.subjects[s]) p.subjects[s] = fs;
      else for (var f in fs) if (!(f in p.subjects[s])) p.subjects[s][f] = fs[f];
    }
    if (typeof p.streak !== 'object' || !p.streak) p.streak = base.streak;
    else for (var sf in base.streak) if (!(sf in p.streak)) p.streak[sf] = base.streak[sf];
    if (typeof p.daily !== 'object' || !p.daily) p.daily = base.daily;
    if (typeof p.activity !== 'object' || !p.activity) p.activity = {};
    if (typeof p.badges !== 'object' || !p.badges) p.badges = {};
    if (typeof p.legacyShadow !== 'object' || !p.legacyShadow) p.legacyShadow = base.legacyShadow;
    else for (var ls in base.legacyShadow) if (!(ls in p.legacyShadow)) p.legacyShadow[ls] = base.legacyShadow[ls];
    if (typeof p.wiredSources !== 'object' || !p.wiredSources) p.wiredSources = {};
    if (typeof p.migratedFlags !== 'object' || !p.migratedFlags) p.migratedFlags = base.migratedFlags;
    if (typeof p.settings !== 'object' || !p.settings) p.settings = base.settings;
    // 主題：舊 profile 無此欄位時，優先採用獨立 key 的偏好（維持已選的夜間模式）。
    if (p.settings.theme !== 'dark' && p.settings.theme !== 'light') p.settings.theme = readThemePref();
    if (!Array.isArray(p.ownedItems)) p.ownedItems = [];
    p.totalXp = num(p.totalXp);
    p.coins = num(p.coins);
    p.level = levelForXp(p.totalXp);
    return p;
  }

  function loadProfile() {
    try {
      localStorage.setItem('_game_test', '1');
      localStorage.removeItem('_game_test');
      storageAvailable = true;
    } catch (e) {
      storageAvailable = false;
    }
    var raw = readLS(CONFIG.storageKey);
    profile = normalizeProfile(raw);
    return profile;
  }

  // 立即寫入（try/catch；配額滿不可讓頁面崩潰，§4.7）。
  function saveNow() {
    if (!storageAvailable || !profile) return;
    profile.updatedAt = nowISO();
    try {
      writingSelf = true;
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(profile));
    } catch (e) {
      // 配額滿或被停用：先嘗試裁剪 activity 再存一次，仍失敗則靜默放棄。
      try {
        trimActivity(180);
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(profile));
      } catch (e2) { /* 靜默；不阻斷頁面 */ }
    } finally {
      writingSelf = false;
    }
  }

  // debounced 存檔（§4.2）。
  function save() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { saveTimer = null; saveNow(); }, CONFIG.saveDebounceMs);
  }

  function trimActivity(maxDays) {
    maxDays = maxDays || CONFIG.activityMaxDays;
    var keys = Object.keys(profile.activity);
    if (keys.length <= maxDays) return;
    keys.sort(); // YYYY-MM-DD 字典序 = 時間序
    var remove = keys.length - maxDays;
    for (var i = 0; i < remove; i++) delete profile.activity[keys[i]];
  }

  // ===================================================================
  // 事件匯流排（§4.4）
  // ===================================================================
  function on(evt, cb) {
    if (typeof cb !== 'function') return;
    if (!listeners[evt]) listeners[evt] = [];
    listeners[evt].push(cb);
  }
  function off(evt, cb) {
    if (!listeners[evt]) return;
    if (!cb) { listeners[evt] = []; return; }
    listeners[evt] = listeners[evt].filter(function (f) { return f !== cb; });
  }
  function emit(evt, payload) {
    var arr = listeners[evt];
    if (!arr) return;
    for (var i = 0; i < arr.length; i++) {
      try { arr[i](payload); } catch (e) { /* 監聽者錯誤不影響引擎 */ }
    }
  }

  // ===================================================================
  // 每日任務 / 徽章
  // ===================================================================

  // 確保 daily 對應到今天；跨日則重置（§4.4）。
  function ensureDaily() {
    var today = localDate();
    if (!profile.daily || profile.daily.date !== today) {
      profile.daily = { date: today, goalXp: CONFIG.dailyGoalXp, earnedXp: 0, done: false };
    }
  }

  function totalCorrect() {
    var t = 0;
    for (var i = 0; i < SUBJECTS.length; i++) t += num(profile.subjects[SUBJECTS[i]].correct);
    return t;
  }

  function playedSubjectCount() {
    var c = 0;
    for (var i = 0; i < SUBJECTS.length; i++) if (num(profile.subjects[SUBJECTS[i]].attempts) > 0) c++;
    return c;
  }

  // 內部授予徽章（不重複），回傳 def；未新增回 null。
  function grantBadge(id) {
    if (!CONFIG.BADGES[id]) return null;
    if (profile.badges[id]) return null;
    profile.badges[id] = { earnedAt: nowISO() };
    var def = CONFIG.BADGES[id];
    return { id: id, name: def.name, icon: def.icon, desc: def.desc };
  }

  // 各科精熟徽章對照：subject → badge id（門檻 MASTER_THRESHOLD 題答對）。
  var MASTER_BADGE = {
    math: 'master_math', english: 'master_english', chinese: 'master_chinese',
    social: 'master_social', finance: 'master_finance', science: 'master_science'
  };
  var MASTER_THRESHOLD = 200;

  // 檢查所有里程碑徽章，回傳本次新解鎖的清單。
  function checkBadges() {
    var earned = [];
    var tc = totalCorrect();
    var lvl = profile.level;
    var cur = num(profile.streak.current);
    var candidates = [];
    if (tc >= 1) candidates.push('first_answer');
    if (tc >= 100) candidates.push('correct_100');
    if (tc >= 500) candidates.push('correct_500');
    if (tc >= 1000) candidates.push('correct_1000');
    if (tc >= 2000) candidates.push('correct_2000');
    if (tc >= 5000) candidates.push('correct_5000');
    if (cur >= 7) candidates.push('streak_7');
    if (cur >= 30) candidates.push('streak_30');
    if (cur >= 100) candidates.push('streak_100');
    if (cur >= 365) candidates.push('streak_365');
    if (lvl >= 5) candidates.push('level_5');
    if (lvl >= 10) candidates.push('level_10');
    if (lvl >= 20) candidates.push('level_20');
    if (profile.daily && profile.daily.done) candidates.push('daily_first');
    if (playedSubjectCount() >= SUBJECTS.length) candidates.push('all_subjects');
    // 各科精熟：該科答對達門檻。全科皆達精熟 → 全科通才。
    var masteredAll = true;
    for (var si = 0; si < SUBJECTS.length; si++) {
      var subj = SUBJECTS[si];
      if (num(profile.subjects[subj].correct) >= MASTER_THRESHOLD) candidates.push(MASTER_BADGE[subj]);
      else masteredAll = false;
    }
    if (masteredAll) candidates.push('all_subjects_master');
    for (var i = 0; i < candidates.length; i++) {
      var b = grantBadge(candidates[i]);
      if (b) earned.push(b);
    }
    return earned;
  }

  // ===================================================================
  // 核心 API：award（§4.4）
  // ===================================================================
  // opts.silent：不自動彈 toast（供 delta-sync 靜默補算）。
  function award(subject, xp, meta) {
    meta = meta || {};
    var result = { xpDelta: 0, totalXp: profile ? profile.totalXp : 0, level: profile ? profile.level : 1, leveledUp: false, newBadges: [] };
    if (!profile) return result;
    if (!isSubject(subject)) return result;
    xp = Math.round(num(xp));
    if (xp <= 0) return result;

    ensureDaily();
    var today = localDate();
    var s = profile.subjects[subject];

    var oldLevel = profile.level;

    s.xp = num(s.xp) + xp;
    s.lastPlayed = nowISO();
    profile.totalXp = num(profile.totalXp) + xp;
    profile.daily.earnedXp = num(profile.daily.earnedXp) + xp;
    profile.activity[today] = num(profile.activity[today]) + xp;
    trimActivity();

    // 金幣：由學習賺得，純為累積的「學習點數」（記錄努力，不綁兌換物品；§3.3）。
    var coinDelta = Math.max(1, Math.round(xp * CONFIG.coinsPerXp));
    profile.coins = num(profile.coins) + coinDelta;

    // 重算等級（快取）。
    var newLevel = levelForXp(profile.totalXp);
    profile.level = newLevel;
    var leveledUp = newLevel > oldLevel;

    // 每日任務達標（一次性；發 daily-complete + 金幣 bonus）。
    var justCompletedDaily = false;
    if (!profile.daily.done && profile.daily.earnedXp >= profile.daily.goalXp) {
      profile.daily.done = true;
      profile.coins = num(profile.coins) + CONFIG.dailyCompleteCoinBonus;
      justCompletedDaily = true;
    }

    // 觸及任一科 → 更新 streak（同日 idempotent）。
    pingActive();

    // 徽章檢查。
    var newBadges = checkBadges();

    save();

    // 發事件。
    var xpPayload = {
      subject: subject, xpDelta: xp, coinDelta: coinDelta,
      totalXp: profile.totalXp, level: profile.level, coins: profile.coins
    };
    var mature = pageMaturity() === 'advanced';  // 進階頁：中性莊重、不用童趣 persona
    emit('xp', xpPayload);
    if (leveledUp) {
      var rank = rankForLevel(newLevel);
      emit('levelup', { level: newLevel, prevLevel: oldLevel, rank: rank });
      if (!meta.silent) {
        queueToast(mature ? ('升級！已達等級 ' + newLevel)
                          : ('升級！你現在是 ' + rank.icon + ' ' + rank.name + '（第 ' + newLevel + ' 級）'), 'levelup');
      }
    }
    if (justCompletedDaily) {
      emit('daily-complete', { goalXp: profile.daily.goalXp, earnedXp: profile.daily.earnedXp, coinBonus: CONFIG.dailyCompleteCoinBonus });
      if (!meta.silent) {
        queueToast(mature ? '今日目標達成。' : '今天做完囉！可以休息，也可以繼續玩 🎉', 'daily');
      }
    }
    for (var i = 0; i < newBadges.length; i++) {
      emit('badge', newBadges[i]);
      if (!meta.silent) {
        queueToast(mature ? ('達成成就：' + newBadges[i].icon + ' ' + newBadges[i].name)
                          : ('獲得徽章：' + newBadges[i].icon + ' ' + newBadges[i].name), 'badge');
      }
    }

    updateHud();

    result.xpDelta = xp;
    result.totalXp = profile.totalXp;
    result.level = profile.level;
    result.leveledUp = leveledUp;
    result.newBadges = newBadges;
    return result;
  }

  // recordAnswer（§4.4）
  function recordAnswer(subject, correct, meta) {
    meta = meta || {};
    if (!profile || !isSubject(subject)) {
      return { xpDelta: 0, totalXp: profile ? profile.totalXp : 0, level: profile ? profile.level : 1, leveledUp: false, newBadges: [] };
    }
    var s = profile.subjects[subject];
    s.attempts = num(s.attempts) + 1;

    if (correct) {
      s.correct = num(s.correct) + 1;
      sessionCombo[subject] = num(sessionCombo[subject]) + 1;
      var combo = sessionCombo[subject];
      if (combo > num(s.bestCombo)) s.bestCombo = combo;
      var xp = Math.round(CONFIG.baseXp * CONFIG.comboMultiplier(combo));
      var res = award(subject, xp, meta);
      res.combo = combo;
      return res;
    } else {
      sessionCombo[subject] = 0;
      s.lastPlayed = nowISO();
      save();
      updateHud();
      return { xpDelta: 0, totalXp: profile.totalXp, level: profile.level, leveledUp: false, newBadges: [], combo: 0 };
    }
  }

  // recordSession（§4.4）
  function recordSession(subject, data) {
    data = data || {};
    if (!profile || !isSubject(subject)) {
      return { xpDelta: 0, totalXp: profile ? profile.totalXp : 0, level: profile ? profile.level : 1, leveledUp: false, newBadges: [] };
    }
    var correct = Math.max(0, Math.round(num(data.correct)));
    var total = Math.max(correct, Math.round(num(data.total)));
    var s = profile.subjects[subject];
    s.attempts = num(s.attempts) + total;
    s.correct = num(s.correct) + correct;
    var xp = correct * CONFIG.baseXp;
    if (xp > 0) return award(subject, xp, data.meta || {});
    save();
    updateHud();
    return { xpDelta: 0, totalXp: profile.totalXp, level: profile.level, leveledUp: false, newBadges: [] };
  }

  // pingActive（§4.4）— streak 引擎，本地日界。
  function pingActive() {
    if (!profile) return { current: 0, longest: 0 };
    var today = localDate();
    var st = profile.streak;
    if (st.lastActiveDate === today) {
      return { current: st.current, longest: st.longest, changed: false };
    }
    var diff = dayDiff(st.lastActiveDate, today);
    var changed = false;
    var activeToday = false;   // 今天是否算一個「有效活躍日」（供護盾回補計數）
    var usedFreeze = false;    // 本次是否用護盾續接了連續紀錄
    var didReset = false;      // 本次是否因護盾用盡而從 1 重新開始
    if (st.lastActiveDate === null || diff === null) {
      st.current = 1; changed = true; activeToday = true;
    } else if (diff === 1) {
      st.current = num(st.current) + 1; changed = true; activeToday = true;
    } else if (diff > 1) {
      // 缺口 >1：先用護盾(freeze)續接（友善、不懲罰；§3.4），用盡才從 1 重新開始。
      if (num(st.freezes) > 0) { st.freezes = num(st.freezes) - 1; st.current = num(st.current) + 1; usedFreeze = true; }
      else { st.current = 1; didReset = true; }
      changed = true; activeToday = true;
    } else {
      // diff <= 0（時鐘回退）：僅移動日期，不動計數。
    }
    // 護盾隨活躍緩慢回補（§3.4 緩解失落厭惡）：每 streakFreezeEarnEvery 個有效活躍日 +1，
    // 上限 streakFreezeMax。此邏輯單調、只增不減，用盡後仍可靠持續學習慢慢賺回，避免永久懲罰。
    if (activeToday) {
      var earnEvery = num(CONFIG.streakFreezeEarnEvery) || 7;
      var cap = num(CONFIG.streakFreezeMax) || 3;
      if (num(st.freezes) < cap) {
        st.freezeProgress = num(st.freezeProgress) + 1;
        while (st.freezeProgress >= earnEvery && num(st.freezes) < cap) {
          st.freezes = num(st.freezes) + 1;
          st.freezeProgress = num(st.freezeProgress) - earnEvery;
        }
        if (num(st.freezes) >= cap) st.freezeProgress = 0; // 到上限即歸零，下次從頭累積
      } else {
        st.freezeProgress = 0; // 已在上限，不累積進度
      }
    }
    if (st.current > num(st.longest)) st.longest = st.current;
    st.lastActiveDate = today;
    if (changed) {
      emit('streak', { current: st.current, longest: st.longest, freezes: st.freezes });
      // 面向孩子的安撫語（§3.4）：只鼓勵、不威脅/催促。
      if (usedFreeze) {
        queueToast('休息一下也沒關係，護盾幫你把連續紀錄接住了 🛡️', 'streak');
      } else if (didReset) {
        queueToast('休息一下很好，今天重新開始就好，之前學過的都還在 🌱', 'streak');
      }
      var nb = checkBadges();
      for (var i = 0; i < nb.length; i++) emit('badge', nb[i]);
    }
    save();
    return { current: st.current, longest: st.longest, changed: changed };
  }

  function awardBadge(id) {
    if (!profile) return null;
    var b = grantBadge(id);
    if (b) {
      save();
      emit('badge', b);
      var mature = pageMaturity() === 'advanced';
      queueToast((mature ? '達成成就：' : '獲得徽章：') + b.icon + ' ' + b.name, 'badge');
      updateHud();
    }
    return b;
  }

  // getProfile（§4.4）— 回傳深拷貝 + 衍生欄位，外部不可直接改動內部狀態。
  function getProfile() {
    if (!profile) return null;
    var clone;
    try { clone = JSON.parse(JSON.stringify(profile)); }
    catch (e) { clone = profile; }
    var info = levelInfo(clone.totalXp);
    var rank = rankForLevel(info.level);
    clone.derived = {
      rankName: rank.name,
      rankIcon: rank.icon,
      xpIntoLevel: info.xpIntoLevel,
      xpForLevel: info.xpForLevel,
      xpToNext: info.xpToNext,
      levelProgress: info.progress,
      isMaxLevel: info.isMax,
      totalCorrect: totalCorrect(),
      dailyProgress: clone.daily && clone.daily.goalXp > 0
        ? Math.min(1, num(clone.daily.earnedXp) / clone.daily.goalXp) : 0
    };
    return clone;
  }

  // getBadgeWall — 供 hub 徽章牆：回傳有序徽章清單（BADGES 定義順序）+ 已得狀態。
  // 未得徽章一律顯示（含名稱/icon/desc 作為「可努力的目標」），earned=false。
  function getBadgeWall() {
    var out = [];
    var owned = (profile && profile.badges) ? profile.badges : {};
    for (var id in CONFIG.BADGES) {
      if (!Object.prototype.hasOwnProperty.call(CONFIG.BADGES, id)) continue;
      var def = CONFIG.BADGES[id];
      var e = owned[id];
      out.push({
        id: id, name: def.name, icon: def.icon, desc: def.desc,
        earned: !!e, earnedAt: (e && e.earnedAt) ? e.earnedAt : null
      });
    }
    return out;
  }

  // reset（§4.4）— scope: 'all'（整份） | 'daily' | 'streak' | 'session'
  function reset(scope) {
    scope = scope || 'all';
    if (scope === 'all') {
      profile = freshProfile();
      // 全新 profile：立即標記已 seed，避免又把 legacy 值倒灌進來。
      profile.migratedFlags.v1_seeded = true;
      snapshotShadows();
      sessionCombo = {};
      saveNow();
      updateHud();
      emit('xp', { subject: null, xpDelta: 0, totalXp: 0, level: 1, coins: 0 });
    } else if (scope === 'daily') {
      profile.daily = { date: localDate(), goalXp: CONFIG.dailyGoalXp, earnedXp: 0, done: false };
      saveNow(); updateHud();
    } else if (scope === 'streak') {
      profile.streak = { current: 0, longest: profile.streak.longest, lastActiveDate: null, freezes: profile.streak.freezes, freezeProgress: num(profile.streak.freezeProgress) };
      saveNow(); updateHud();
    } else if (scope === 'session') {
      sessionCombo = {};
    }
    return getProfile();
  }

  // ===================================================================
  // 主題 API（夜間模式）—— 持久化（profile + 獨立 key）＋套用＋發事件
  // ===================================================================
  function setTheme(theme) {
    theme = normTheme(theme);
    applyTheme(theme);
    // 獨立輕量 key：供下次載入時盡早套用、消除閃爍。
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
    // 同步進 profile.settings（真相來源、跨頁一致）。
    if (profile) {
      if (typeof profile.settings !== 'object' || !profile.settings) {
        profile.settings = { sound: true, reduceMotion: false, theme: theme };
      } else {
        profile.settings.theme = theme;
      }
      save();
    }
    emit('theme', { theme: theme });
    return theme;
  }

  function toggleTheme() {
    return setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  }

  function getTheme() { return currentTheme(); }

  // ===================================================================
  // Legacy 遷移（§4.6）— 非破壞式：舊 key 永不刪除/覆寫
  // ===================================================================

  // 讀取英語「真正累積」計數：vocab_stats.history 各日次數總和（單調遞增）。
  // key 被 removeItem → null（null-guard），回 null 表示「無法取得，跳過」。
  function readEnglishTotalReviews() {
    var vs = readLS('vocab_stats');
    if (!vs || typeof vs !== 'object') return null;
    var h = vs.history;
    if (!h || typeof h !== 'object') return 0;
    var total = 0;
    for (var k in h) if (Object.prototype.hasOwnProperty.call(h, k)) total += num(h[k]);
    return total;
  }

  function readMathExp() { var p = readLS('math_progress'); return p ? num(p.exp) : 0; }
  function readMultExp() { var p = readLS('mult_progress'); return p ? num(p.exp) : 0; }
  function readChineseExp() { var p = readLS('chinese_game_state'); return p ? num(p.exp) : 0; }

  function readLegacyStreak() {
    var best = 0;
    var ms = readLS('math_stats');
    if (ms) best = Math.max(best, num(ms.streak));
    var vs = readLS('vocab_stats');
    if (vs) best = Math.max(best, num(vs.streak));
    return best;
  }

  // 把目前 legacy 值寫入 shadow 快照。
  function snapshotShadows() {
    var eng = readEnglishTotalReviews();
    profile.legacyShadow.math_progress_exp = readMathExp();
    profile.legacyShadow.mult_progress_exp = readMultExp();
    profile.legacyShadow.chinese_exp = readChineseExp();
    profile.legacyShadow.english_total_reviews = (eng === null) ? num(profile.legacyShadow.english_total_reviews) : eng;
  }

  // (1) 一次性 seed（v1_seeded 守衛）。
  function seedOnce() {
    if (profile.migratedFlags.v1_seeded) return;

    var mathExp = readMathExp();
    var multExp = readMultExp();
    var chExp = readChineseExp();

    profile.subjects.math.xp = num(profile.subjects.math.xp) + mathExp + multExp;
    profile.subjects.chinese.xp = num(profile.subjects.chinese.xp) + chExp;
    // 英語不由 streak/history 推導 XP（§4.6-4）；vocab_srs 完全不動。
    // seed 時僅記錄 shadow，過往複習不追溯發 XP，只計 seed 後的新增。

    // 全域 totalXp = 各科 XP 總和。
    var t = 0;
    for (var i = 0; i < SUBJECTS.length; i++) t += num(profile.subjects[SUBJECTS[i]].xp);
    profile.totalXp = t;
    profile.level = levelForXp(t);

    // 全域 streak 取各來源最大值；並把 lastActiveDate 設為今天，
    // 使隨後的 pingActive() 同日 noop、保留 seed 的連續天數（否則會被重設為 1）。
    // 全新使用者（legacyStreak 為 0）則保持 lastActiveDate = null，
    // 讓 pingActive() 正常把今天計為第 1 天。
    var legacyStreak = readLegacyStreak();
    if (legacyStreak > num(profile.streak.current)) {
      profile.streak.current = legacyStreak;
      profile.streak.longest = Math.max(num(profile.streak.longest), legacyStreak);
      profile.streak.lastActiveDate = localDate();
    }

    snapshotShadows();
    profile.migratedFlags.v1_seeded = true;
    saveNow();
  }

  // 「已接線來源」對應：data-game-wired 的逗號 token → legacyShadow 欄位。
  //   math=math_progress.exp、mult=mult_progress.exp、
  //   chinese=chinese_game_state.exp、english=english_total_reviews。
  var WIRED_SOURCE_MAP = {
    math: 'math_progress_exp',
    mult: 'mult_progress_exp',
    chinese: 'chinese_exp',
    english: 'english_total_reviews'
  };

  // 讀取頁面宣告的「已接線來源」集合（§4.6 雙記帳防護）。
  // 頁面於 `<body data-game-wired="math,mult">` 宣告：該頁已直接呼叫
  // Game.recordAnswer/award 即時記帳，故 delta-sync 對這些來源「只前移 shadow、
  // 不再發 XP」，避免舊頁同時寫 legacy exp 造成下次載入重複計分。
  // 由於本引擎於 <head> 同步執行（body 尚未解析），除 <body> 外也讀 <html>
  // (documentElement) 作為 head 期可用的後備位置；讀兩者的聯集。
  function wiredSourceSet() {
    var set = {};
    // (a) 先併入已持久化的黏著旗標：任一頁曾宣告過該來源即全站抑制，
    //     避免接線頁的 legacy 成長在其他未宣告頁（hub / 別科）被 delta 重複計分。
    if (profile && profile.wiredSources) {
      for (var k in profile.wiredSources) {
        if (profile.wiredSources[k]) set[k] = true;
      }
    }
    // (b) 再讀本頁 DOM 宣告（<body> ∪ <html>），並把新宣告的來源黏著持久化。
    var raw = '';
    try {
      var b = document.body;
      var h = document.documentElement;
      var bv = b && b.getAttribute && b.getAttribute('data-game-wired');
      var hv = h && h.getAttribute && h.getAttribute('data-game-wired');
      if (bv) raw += ',' + bv;
      if (hv) raw += ',' + hv;
    } catch (e) { /* ignore */ }
    if (!raw) return set;
    var parts = raw.split(',');
    for (var i = 0; i < parts.length; i++) {
      var tok = parts[i].trim().toLowerCase();
      var field = WIRED_SOURCE_MAP[tok];
      if (field) {
        set[field] = true;
        if (profile) {
          if (typeof profile.wiredSources !== 'object' || !profile.wiredSources) profile.wiredSources = {};
          profile.wiredSources[field] = true; // 黏著：deltaSync 結尾的 save() 會持久化
        }
      }
    }
    return set;
  }

  // (2) 冪等 delta-sync + (3) reset/null 防護（每次 load）。
  // 對「真正單調計數器」：delta = current - shadow。
  //   delta>0 → 加入並前移 shadow；delta<0 → legacy reset，只降 shadow、不從 profile 扣。
  // 「已接線來源」（wired[...]===true）：不論 delta 正負，一律只把 shadow 前移到
  //   目前 legacy 值、絕不發 XP（避免與該頁 recordAnswer 即時記帳重複計分）。
  function deltaSync() {
    var sh = profile.legacyShadow;
    var wired = wiredSourceSet();
    var totalDelta = 0;

    // 數學：math_progress.exp
    var mathExp = readMathExp();
    if (wired.math_progress_exp) {
      sh.math_progress_exp = mathExp; // 已接線：只前移 shadow、不發 XP
    } else if (mathExp > num(sh.math_progress_exp)) {
      totalDelta += (mathExp - sh.math_progress_exp);
      award('math', mathExp - sh.math_progress_exp, { silent: true, source: 'delta' });
      sh.math_progress_exp = mathExp;
    } else if (mathExp < num(sh.math_progress_exp)) {
      sh.math_progress_exp = mathExp; // reset：只降 shadow
    }

    // 數學：mult_progress.exp（映射 math）
    var multExp = readMultExp();
    if (wired.mult_progress_exp) {
      sh.mult_progress_exp = multExp; // 已接線：只前移 shadow、不發 XP
    } else if (multExp > num(sh.mult_progress_exp)) {
      totalDelta += (multExp - sh.mult_progress_exp);
      award('math', multExp - sh.mult_progress_exp, { silent: true, source: 'delta' });
      sh.mult_progress_exp = multExp;
    } else if (multExp < num(sh.mult_progress_exp)) {
      sh.mult_progress_exp = multExp;
    }

    // 國語：chinese_game_state.exp
    var chExp = readChineseExp();
    if (wired.chinese_exp) {
      sh.chinese_exp = chExp; // 已接線：只前移 shadow、不發 XP
    } else if (chExp > num(sh.chinese_exp)) {
      totalDelta += (chExp - sh.chinese_exp);
      award('chinese', chExp - sh.chinese_exp, { silent: true, source: 'delta' });
      sh.chinese_exp = chExp;
    } else if (chExp < num(sh.chinese_exp)) {
      sh.chinese_exp = chExp;
    }

    // 英語：真正累積欄位 english_total_reviews（§4.6-4）。
    var eng = readEnglishTotalReviews();
    if (eng !== null) { // null-guard：key 被移除時跳過，不誤判
      if (wired.english_total_reviews) {
        sh.english_total_reviews = eng; // 已接線：只前移 shadow、不發 XP
      } else if (eng > num(sh.english_total_reviews)) {
        var revDelta = eng - sh.english_total_reviews;
        award('english', revDelta * CONFIG.baseXp, { silent: true, source: 'delta' });
        sh.english_total_reviews = eng;
      } else if (eng < num(sh.english_total_reviews)) {
        sh.english_total_reviews = eng;
      }
    }

    if (totalDelta > 0) saveNow();
    else save();
  }

  // ===================================================================
  // HUD / Toast DOM（§4.5）
  // ===================================================================
  var toastQueue = [];
  var domReady = false;

  function pageMode() {
    var body = document.body;
    if (!body) return 'float';
    var m = body.getAttribute('data-game-hud');
    if (m === 'off') return 'off';       // 逃生口（§4.5）
    if (m === 'native') return 'native'; // 有原生 HUD：不注入浮動 HUD
    return 'float';                      // 預設：注入浮動 HUD
  }

  // 成熟度（§成長）：進階／國高中內容頁可宣告 <body data-game-maturity="advanced">，
  // 讓一路成長上來的大孩子（高一）不再被童趣 persona 稱呼／彈幼稚 toast。
  // 進階頁仍照常記帳、發事件、更新 HUD，只是把慶祝 toast 換成莊重中性版本
  // （保留能力回饋，但不用「小小探險家」這類幼齡框架）。讀 <body> ∪ <html>。
  function pageMaturity() {
    try {
      var b = document.body, h = document.documentElement;
      var v = (b && b.getAttribute && b.getAttribute('data-game-maturity')) ||
              (h && h.getAttribute && h.getAttribute('data-game-maturity'));
      return (v === 'advanced') ? 'advanced' : 'default';
    } catch (e) { return 'default'; }
  }

  function buildHud() {
    if (pageMode() !== 'float') return;
    if (document.getElementById('game-hud-root')) return;
    var root = document.createElement('div');
    root.id = 'game-hud-root';
    root.className = 'game-hud';
    root.setAttribute('role', 'status');
    root.setAttribute('aria-live', 'polite');
    root.innerHTML =
      '<div class="game-hud-chip game-hud-level" title="等級">' +
        '<span class="game-hud-rank-icon">🌱</span>' +
        '<span class="game-hud-level-num">Lv.1</span>' +
      '</div>' +
      '<div class="game-hud-xp"><div class="game-hud-xp-fill"></div></div>' +
      '<div class="game-hud-chip game-hud-streak" title="連續天數">🔥 <span class="game-hud-streak-num">0</span></div>' +
      '<div class="game-hud-chip game-hud-coins" title="金幣">🪙 <span class="game-hud-coins-num">0</span></div>' +
      '<div class="game-hud-ring" title="今日任務">' +
        '<svg viewBox="0 0 36 36" aria-hidden="true">' +
          '<circle class="game-hud-ring-bg" cx="18" cy="18" r="15.9"></circle>' +
          '<circle class="game-hud-ring-fg" cx="18" cy="18" r="15.9"></circle>' +
        '</svg>' +
        '<span class="game-hud-ring-label">0%</span>' +
      '</div>';
    // 與共用 .app-bar（全站唯一 top chrome）併存：
    //   - 有 app-bar → 把 HUD 插到 app-bar「之後」並加 .game-hud--docked，
    //     使其停靠在 app-bar 正下方（top = app-bar 高度），兩列不重疊。
    //   - 無 app-bar → 維持舊行為：插到 <body> 最前面，作為 sticky top:0 的流內列
    //     佔位、把頁面內容往下推（見 game_core.css .game-hud 註解）。
    var appBar = document.querySelector('.app-bar');
    if (appBar) {
      root.className = 'game-hud game-hud--docked';
      appBar.insertAdjacentElement('afterend', root);
    } else {
      document.body.insertBefore(root, document.body.firstChild);
    }
  }

  // 共用 .app-bar 的主題切換鈕：任何帶 data-theme-toggle 的按鈕都自動接線並
  // 同步 ☀️/🌙 圖示與 aria，讓各頁貼上同一段 markup 即可、免寫頁面 JS。
  var themeTogglesWired = false;
  function syncThemeToggles() {
    var dark = currentTheme() === 'dark';
    var btns = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var icon = b.querySelector('.app-bar__theme-icon') || b;
      icon.textContent = dark ? '☀️' : '🌙';
      b.setAttribute('aria-pressed', dark ? 'true' : 'false');
      var lbl = dark ? '切換成白天模式' : '切換成夜間模式';
      b.setAttribute('aria-label', lbl);
      b.setAttribute('title', lbl);
    }
  }
  function wireThemeToggles() {
    if (!themeTogglesWired) {
      themeTogglesWired = true;
      document.addEventListener('click', function (e) {
        var t = e.target;
        var btn = (t && t.closest) ? t.closest('[data-theme-toggle]') : null;
        if (btn) toggleTheme();
      });
      on('theme', syncThemeToggles);
    }
    syncThemeToggles();
  }

  function ensureToastRoot() {
    var r = document.getElementById('game-toast-root');
    if (!r && document.body) {
      r = document.createElement('div');
      r.id = 'game-toast-root';
      r.className = 'game-toast-root';
      r.setAttribute('aria-live', 'polite');
      document.body.appendChild(r);
    }
    return r;
  }

  function updateHud() {
    if (!profile) return;
    var root = document.getElementById('game-hud-root');
    if (!root) return;
    var info = levelInfo(profile.totalXp);
    var rank = rankForLevel(info.level);
    var q = function (sel) { return root.querySelector(sel); };
    var set = function (sel, txt) { var el = q(sel); if (el) el.textContent = txt; };
    set('.game-hud-level-num', 'Lv.' + info.level);
    var ri = q('.game-hud-rank-icon'); if (ri) ri.textContent = rank.icon;
    var fill = q('.game-hud-xp-fill'); if (fill) fill.style.width = Math.round(info.progress * 100) + '%';
    set('.game-hud-streak-num', num(profile.streak.current));
    set('.game-hud-coins-num', num(profile.coins));
    var dp = (profile.daily && profile.daily.goalXp > 0) ? Math.min(1, num(profile.daily.earnedXp) / profile.daily.goalXp) : 0;
    var ring = q('.game-hud-ring-fg');
    if (ring) {
      var circ = 2 * Math.PI * 15.9;
      ring.style.strokeDasharray = circ;
      ring.style.strokeDashoffset = circ * (1 - dp);
    }
    set('.game-hud-ring-label', Math.round(dp * 100) + '%');
  }

  function queueToast(msg, kind) {
    toastQueue.push({ msg: msg, kind: kind || 'info' });
    if (domReady) flushToasts();
  }

  function flushToasts() {
    var root = ensureToastRoot();
    if (!root) return;
    while (toastQueue.length) {
      var t = toastQueue.shift();
      renderToast(root, t.msg, t.kind);
    }
  }

  function renderToast(root, msg, kind) {
    var el = document.createElement('div');
    el.className = 'game-toast game-toast-' + kind;
    el.textContent = msg;
    root.appendChild(el);
    // 進場
    requestAnimationFrame(function () { el.classList.add('game-toast-show'); });
    var ttl = (kind === 'levelup' || kind === 'badge') ? 3200 : 2200;
    setTimeout(function () {
      el.classList.remove('game-toast-show');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    }, ttl);
  }

  // showToast（§4.4）— 公開 API。
  function showToast(msg, kind) {
    if (!msg) return;
    queueToast(String(msg), kind || 'info');
    return true;
  }

  // ===================================================================
  // 跨分頁同步（§4.2 storage 事件）
  // ===================================================================
  function onStorage(e) {
    if (!e) return;
    // 跨分頁主題同步：另一分頁切了夜間模式 → 本頁即時跟上。
    if (e.key === THEME_KEY) {
      var t = readThemePref();
      applyTheme(t);
      if (profile && profile.settings) profile.settings.theme = t;
      emit('theme', { theme: t, external: true });
      return;
    }
    if (e.key !== CONFIG.storageKey) return;
    if (writingSelf) return;
    var incoming = readLS(CONFIG.storageKey);
    if (incoming) {
      profile = normalizeProfile(incoming);
      updateHud();
      emit('xp', { subject: null, xpDelta: 0, totalXp: profile.totalXp, level: profile.level, coins: profile.coins, external: true });
    }
  }

  // ===================================================================
  // 記錄最後路徑（供 hub「繼續上次」深連結；§5.3）
  // ===================================================================
  function recordRoute() {
    try {
      var path = location.pathname.split('/').pop() || 'index.html';
      if (path && path !== 'index.html' && path !== 'home.html') {
        profile.lastRoute = path;
        save();
      }
    } catch (e) { /* ignore */ }
  }

  // ===================================================================
  // 自動初始化（§4.2）
  // ===================================================================
  function init() {
    loadProfile();          // (0) 載入 + null-guard
    // 主題對齊：以 profile.settings.theme 為準套用，並回寫獨立 key（首次 paint
    // 前已用獨立 key 套過；這裡讓兩者一致，涵蓋 profile 內存有不同值的情形）。
    if (profile && profile.settings) {
      var t = normTheme(profile.settings.theme);
      applyTheme(t);
      try { localStorage.setItem(THEME_KEY, t); } catch (e) { /* ignore */ }
    }
    seedOnce();             // (1) 一次性 seed
    deltaSync();            // (2)(3) 冪等 delta-sync + reset/null 防護
    ensureDaily();          // 每日任務對齊今天
    pingActive();           // (3) ping 每日 streak
    // 回溯里程碑：載入時靜默補授已達標徽章。既有重度使用者若當天已活躍，
    // 不會再經 award()/pingActive() 觸發 checkBadges，導致徽章牆把早已達標者顯示為未解鎖。
    // 這裡直接補跑一次（不彈 toast、不 emit），讓 hub 首次載入即正確點亮。
    var backfilled = checkBadges();
    if (backfilled.length) save();
    recordRoute();

    // (4c) 全站頁尾版權聲明：以共用 JS 注入，避免逐頁手改。每頁只注入一次。
    var ensureCopyright = function () {
      if (!document.body) return;
      if (document.querySelector('[data-site-copyright]')) return;
      var f = document.createElement('footer');
      f.setAttribute('data-site-copyright', '1');
      f.style.cssText = 'text-align:center;font-size:12px;line-height:1.6;padding:20px 16px 28px;' +
        'margin-top:24px;color:var(--ink-soft,#94a3b8);border-top:1px solid var(--line,rgba(148,163,184,.25));';
      f.textContent = '© 2026 HD Chen · 保留所有權利 All Rights Reserved · 請勿轉載';
      document.body.appendChild(f);
    };

    var domInit = function () {
      domReady = true;
      buildHud();           // (4) HUD 策略
      wireThemeToggles();   // (4b) 接線共用 app-bar 的主題切換鈕 + 同步圖示
      ensureToastRoot();
      ensureCopyright();    // (4c) 全站頁尾版權聲明（每頁只注入一次）
      updateHud();
      flushToasts();        // (5) flush 佇列
    };
    if (document.body) domInit();
    else document.addEventListener('DOMContentLoaded', domInit);

    // 存檔於離開頁面時 flush（避免 debounce 丟失）。
    window.addEventListener('pagehide', saveNow);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') saveNow();
    });
    window.addEventListener('storage', onStorage);
  }

  // ===================================================================
  // 曝露 window.Game
  // ===================================================================
  var Game = {
    // 事件 API（§4.4）
    recordAnswer: recordAnswer,
    award: award,
    recordSession: recordSession,
    pingActive: pingActive,
    awardBadge: awardBadge,
    getProfile: getProfile,
    getBadgeWall: getBadgeWall,
    on: on,
    off: off,
    showToast: showToast,
    reset: reset,

    // 主題 API（夜間模式）
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    getTheme: getTheme,

    // 輔助 / HUD
    updateHud: updateHud,
    setProfileField: function (key, value) {
      // 僅允許安全的個人化欄位（無 PII 外流；本地儲存）。
      if (!profile) return;
      if (key === 'displayName') profile.displayName = String(value).slice(0, 24);
      else if (key === 'avatar') profile.avatar = String(value).slice(0, 8);
      else if (key === 'equippedMascot') profile.equippedMascot = value;
      else return;
      save(); updateHud();
    },
    spendCoins: function (amount, itemId) {
      // 休眠 API：目前全站無消費點（金幣不綁兌換物品）。保留僅供未來需要時使用；
      // 不足則不成交、無隨機/寶箱。若未來啟用，須維持「不綁會因清資料而失去的解鎖物」政策。
      if (!profile) return false;
      amount = Math.round(num(amount));
      if (amount <= 0 || profile.coins < amount) return false;
      profile.coins -= amount;
      if (itemId && profile.ownedItems.indexOf(itemId) === -1) profile.ownedItems.push(itemId);
      save(); updateHud();
      emit('xp', { subject: null, xpDelta: 0, totalXp: profile.totalXp, level: profile.level, coins: profile.coins });
      return true;
    },

    // 常數 / 純函式（供頁面共用同一套曲線與階名）
    CONFIG: CONFIG,
    SUBJECTS: SUBJECTS.slice(),
    EVENTS: EVENTS.slice(),
    levelForXp: levelForXp,
    levelInfo: levelInfo,
    rankForLevel: rankForLevel,
    localDate: localDate
  };

  window.Game = Game;

  // 立即初始化（同步 <script src> 於 <head> 末端載入；§4.2）。
  init();

})(window, document);
