/* =====================================================================
 * assets/srs_engine.js — 共用「間隔重複」排程核心（window.SRS）
 * ---------------------------------------------------------------------
 * 混合 Leitner 盒（scheduleBox）× SM-2 ease 的排程引擎，供五個閃卡頁共載
 * （比照 game_core.js）。演算法共用、儲存各頁自持 key、絕不跨頁污染。
 *
 * 設計鐵律（見設計計畫 engine.schedulerSpec / risks）：
 *   1. 絕不清空/重寫既有 localStorage：一律用 lazy `ensureCard` 補欄位，
 *      舊 {box} → 同填 scheduleBox+peakBox；舊 {ease,interval,due} → 由
 *      interval 門檻反推 box；原始欄位一律保留。
 *   2. peakBox / lit（視覺收藏）只增不減，與 scheduleBox（可退盒、驅動
 *      dueDate）脫鉤 —— 答錯只退 scheduleBox，收藏視覺一律不降。
 *   3. 引擎「不」綁定特定 key、「不」讀寫 player_profile_v1 / vocab_stats、
 *      「不」跨頁寫他頁 key。呼叫方以 `SRS.createStore(key, opts)` 取得
 *      綁定該頁 key 的 store 實例。
 *   4. 排程本身「不」發 XP —— XP 仍由各頁 Game.recordAnswer / Game.award。
 *   5. 日期一律走 today()/addDays()（優先 Game.localDate），全程以
 *      'YYYY-MM-DD' 字串比較，避免 to-the-minute 時區漂移。
 *
 * 可在瀏覽器（掛 window.SRS）與 Node（module.exports）兩種環境執行，
 * 供 headless 單元測試直接 require。
 * ===================================================================== */
(function (root) {
  'use strict';

  /* 盒 → 基準間隔（天）。1..5 沿用既有 Worddex/Album 表，延伸第 6 盒（精通）。 */
  var INTERVAL = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 15, 6: 30 };
  var DEFAULT_DAILY_NEW = 10;
  var DEFAULT_INTERLEAVE_EVERY = 3; // 每 N 張到期複習插 1 張新卡

  /* ---- 環境橋接（瀏覽器 / Node 皆可） ---- */
  function win() {
    if (typeof window !== 'undefined') return window;
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof global !== 'undefined') return global;
    return {};
  }
  function ls() {
    try { if (typeof localStorage !== 'undefined') return localStorage; } catch (e) {}
    var w = win();
    return (w && w.localStorage) ? w.localStorage : null;
  }
  function game() {
    var w = win();
    if (w && w.Game) return w.Game;
    try { if (typeof Game !== 'undefined') return Game; } catch (e) {}
    return null;
  }

  /* ---- 日期工具（本地 YYYY-MM-DD，非 UTC；比照 game_core.localDate） ---- */
  function fmtLocal(d) {
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }
  function today() {
    var G = game();
    try { if (G && G.localDate) return G.localDate(); } catch (e) {}
    return fmtLocal(new Date());
  }
  function addDays(dateStr, n) {
    var d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    var G = game();
    try { if (G && G.localDate) return G.localDate(d); } catch (e) {}
    return fmtLocal(d);
  }
  function isoToLocalDate(iso) {
    if (!iso) return null;
    var d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    var G = game();
    try { if (G && G.localDate) return G.localDate(d); } catch (e) {}
    return fmtLocal(d);
  }

  /* ---- interval(天) → 盒（vocab_srs 舊卡反推用） ---- */
  function intervalToBox(iv) {
    // 以 INTERVAL[box] 為「下界包含值」反推盒：box = 使 iv >= INTERVAL[box] 成立的最大盒。
    // INTERVAL = {1:1,2:2,3:4,4:7,5:15,6:30};邊界值(如 iv=1→box1、iv=15→box5)須落在
    // 「該」盒而非下一盒,否則會系統性把舊 vocab_srs 卡高估一盒(over-promotion)。
    iv = iv || 0;
    if (iv < 2) return 1;
    if (iv < 4) return 2;
    if (iv < 7) return 3;
    if (iv < 15) return 4;
    if (iv < 30) return 5;
    return 6;
  }

  /* =====================================================================
   * ensureCard(card) — lazy 遷移：只補缺欄位、絕不清既有欄位。就地修改並回傳。
   * 三種來源：
   *   (a) 舊 Worddex/Album {box, lit, dueDate, ...} → scheduleBox=peakBox=box。
   *   (b) 舊 vocab_srs {ease, interval, due, status, reps} → box 由 interval
   *       門檻反推（見 intervalToBox：依 INTERVAL 下界，<2→1/<4→2/<7→3/<15→4/<30→5/>=30→6），status==='new'→0；
   *       due(ISO) → dueDate('YYYY-MM-DD')；peakBox=box。
   *   (c) 全新卡 → scheduleBox=peakBox=0、status='new'。
   * ===================================================================== */
  function ensureCard(card) {
    var c = card || {};

    if (c.scheduleBox == null) {
      if (typeof c.box === 'number') {
        // (a) 舊盒模型：scheduleBox 與 peakBox 同填
        c.scheduleBox = c.box;
        if (c.peakBox == null) c.peakBox = c.box;
        // box≥1 視為已收集點亮，與分支(b)一致（避免 lit 落為 false 造成收藏統計矛盾）
        if (c.lit == null && c.box >= 1) c.lit = true;
      } else if (typeof c.interval === 'number' || typeof c.ease === 'number' || c.due != null) {
        // (b) 舊 ease 模型（vocab_srs）：由 interval 門檻反推盒。
        //     status==='new'（全新）與 status==='learning' 且 interval<1（只答錯過、還沒畢業出正式間隔）
        //     都應從 box 0 起跳，對齊執行期「box-0 卡答錯維持 0」的規則，避免遷移多給一盒。
        var _iv = (typeof c.interval === 'number') ? c.interval : 0;
        // 沒有明確 interval(僅有 due/ease)或 status 為 new/未畢業 learning → 一律從 box 0 起跳，
        // 不因 intervalToBox(0)=1 而誤升一盒。
        var box = (c.status === 'new' || typeof c.interval !== 'number' || (c.status === 'learning' && _iv < 1)) ? 0 : intervalToBox(_iv);
        c.scheduleBox = box;
        if (c.peakBox == null) c.peakBox = box;
        if (c.dueDate == null && c.due) c.dueDate = isoToLocalDate(c.due);
        // review/learning 舊卡視為已點亮收藏（只補、既有 lit 不覆寫）
        if (c.lit == null && box >= 1 && c.status !== 'new') c.lit = true;
      } else {
        // (c) 全新卡
        c.scheduleBox = 0;
      }
    }

    // 補其餘欄位（既有值一律保留）
    if (c.peakBox == null) c.peakBox = c.scheduleBox || 0;
    if (c.peakBox < c.scheduleBox) c.peakBox = c.scheduleBox; // peak 對 scheduleBox 單調
    if (c.ease == null) c.ease = 2.5;
    if (c.interval == null) c.interval = 0;
    if (c.lapses == null) c.lapses = 0;
    if (c.reps == null) c.reps = 0;
    if (c.timesSeen == null) c.timesSeen = 0;
    if (c.timesCorrect == null) c.timesCorrect = 0;
    if (c.lit == null) c.lit = false;
    // status 由遷移後的 scheduleBox 反推：box≥1 的舊卡（(a) 舊盒模型無 status、
    // (b) 舊 ease 卡缺 status）應視為 review，不可誤判成 new（否則被當新卡重教、
    // 佔用每日新卡上限，且 dailyNew=0 時整批到期複習被漏掉）。真正的 box-0 新卡維持 new。
    if (c.status == null) c.status = ((c.scheduleBox || 0) >= 1) ? 'review' : 'new';
    if (c.dueDate === undefined) c.dueDate = null;
    if (c.lastReviewedDate === undefined) c.lastReviewedDate = null;
    // 遷移防護：review/learning 舊卡若缺 dueDate（null/空）→ 補 today()，
    // 否則 buildSession 既非到期也非新卡，會被永久漏掉而不再出現。
    if (c.status !== 'new' && !c.dueDate) c.dueDate = today();
    return c;
  }

  /* 全新卡預設（供 buildSession 對「尚未建卡」的字做唯讀分類，不落地儲存） */
  function freshCard() {
    return {
      scheduleBox: 0, peakBox: 0, ease: 2.5, interval: 0,
      lapses: 0, reps: 0, timesSeen: 0, timesCorrect: 0,
      lit: false, status: 'new', dueDate: null, lastReviewedDate: null
    };
  }

  /* 由 word 物件推導穩定 id（預設）：優先 card.id，其次 (_lvl|level)+'::'+word */
  function defaultIdOf(c) {
    if (c == null) return '';
    if (c.id != null) return c.id;
    var lvl = (c._lvl != null) ? c._lvl : (c.level != null ? c.level : '');
    return lvl + '::' + c.word;
  }

  /* =====================================================================
   * createStore(key, opts) — 綁定單一 localStorage key 的 store 實例。
   *   opts.flat : true 表示該 key 為「扁平 word→card map」（vocab_srs 舊格式）；
   *               預設 false = 巢狀 { version, cards:{id:card}, awarded:{} }
   *               （Worddex / Album 格式）。
   * ===================================================================== */
  function createStore(key, opts) {
    opts = opts || {};
    var flat = !!opts.flat;
    var container, cardMap;

    function loadRaw() {
      var raw = null, store = ls();
      try { if (store) raw = store.getItem(key); } catch (e) {}
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') return parsed;
        } catch (e) {}
      }
      return flat
        ? {}
        : { version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), cards: {}, awarded: {} };
    }

    function bind() {
      container = loadRaw();
      if (flat) {
        cardMap = container;
      } else {
        if (!container.cards || typeof container.cards !== 'object') container.cards = {};
        if (!container.awarded || typeof container.awarded !== 'object') container.awarded = {};
        cardMap = container.cards;
      }
    }
    bind();

    function save() {
      var store = ls();
      if (!flat) container.updatedAt = new Date().toISOString();
      try { if (store) store.setItem(key, JSON.stringify(container)); } catch (e) { /* 配額滿：靜默 */ }
    }

    // 取得（必要時建立）並遷移卡片
    function getCard(id) {
      if (!cardMap[id]) cardMap[id] = freshCard();
      return ensureCard(cardMap[id]);
    }
    // 唯讀窺看：已存在則遷移回傳；不存在回傳「暫時的新卡」但不落地
    function peek(id) {
      if (cardMap[id]) return ensureCard(cardMap[id]);
      return freshCard();
    }

    /* ---- 三級自評：grade in 'again' | 'good' | 'easy' ---- */
    function rate(id, grade) {
      var c = getCard(id);
      var t = today();
      c.timesSeen = (c.timesSeen || 0) + 1;
      c.reps = (c.reps || 0) + 1;
      c.lastReviewedDate = t;

      if (grade === 'again') {
        // 退盒＋lapses++；ease 微降；今天重排。peakBox / lit 一律不動。
        // 全新卡(box 0)答錯維持 0（不誤升為已學）；已學卡(box≥1)才退盒，下限 1。
        var _sb = (c.scheduleBox || 0);
        c.scheduleBox = _sb >= 1 ? Math.max(1, _sb - 1) : 0;
        c.lapses = (c.lapses || 0) + 1;
        c.ease = Math.max(1.3, (c.ease || 2.5) - 0.2);
        c.interval = INTERVAL[c.scheduleBox] || 0; // 與退盒後的 scheduleBox 保持一致(box0→0)
        c.status = 'learning';
        c.dueDate = t;
      } else if (grade === 'easy') {
        // 跳盒（≥3 盒跳 2）＋ease 微升；間隔額外 ×1.15。收藏只增不減。
        var jump = (c.scheduleBox || 0) >= 3 ? 2 : 1;
        c.scheduleBox = Math.min(6, (c.scheduleBox || 0) + jump);
        c.ease = Math.min(3.0, (c.ease || 2.5) + 0.15);
        c.interval = INTERVAL[c.scheduleBox];
        c.status = 'review';
        c.timesCorrect = (c.timesCorrect || 0) + 1;
        c.lit = true;
        c.peakBox = Math.max(c.peakBox || 0, c.scheduleBox);
        c.dueDate = addDays(t, Math.max(1, Math.round(c.interval * (c.ease / 2.5) * 1.15)));
      } else {
        // 預設 'good'：升一盒；dueDate 依 interval×(ease/2.5) 成長。收藏只增不減。
        c.scheduleBox = Math.min(6, (c.scheduleBox || 0) + 1);
        c.ease = c.ease || 2.5; // ease 不變
        c.interval = INTERVAL[c.scheduleBox];
        c.status = 'review';
        c.timesCorrect = (c.timesCorrect || 0) + 1;
        c.lit = true;
        c.peakBox = Math.max(c.peakBox || 0, c.scheduleBox);
        c.dueDate = addDays(t, Math.max(1, Math.round(c.interval * (c.ease / 2.5))));
      }
      save();
      return c;
    }

    /* ---- 二元作答（測驗/聽力/配對/字母磚）→ 自評對映 ---- */
    function gradeBinary(id, correct) {
      return rate(id, correct ? 'good' : 'again');
    }

    /* ---- 里程碑單調 guard（比照 Worddex）：先設 guard→save→回 true，
     *      呼叫方再發 XP/toast。已領過回 false。排程本身不發 XP。 ---- */
    function isAwarded(mid) {
      if (flat) return false; // 扁平 store 不承載里程碑（各頁自有收藏模組）
      return !!container.awarded[mid];
    }
    function awardOnce(mid) {
      if (flat) return false;
      if (container.awarded[mid]) return false;
      container.awarded[mid] = true;
      save();
      return true;
    }

    /* =====================================================================
     * buildSession(cards, opts) — 建立學習佇列。
     *   cards : word 物件陣列（原始順序＝新卡優先序）。
     *   opts.dailyNew        : 每日新卡上限（預設 10）。
     *   opts.idOf            : card → id（預設 card.id 或 (_lvl|level)::word）。
     *   opts.interleaveEvery : 每 N 張到期複習插 1 張新卡（預設 3）。
     *   opts.reviewCap       : 佇列總長上限（預設不限）。
     * 規則：到期複習優先（首段一定是到期卡）＋每日新卡上限＋新舊交錯
     *      （新卡不全塞前段）。
     * ===================================================================== */
    function buildSession(cards, opts) {
      opts = opts || {};
      var dailyNew = (opts.dailyNew != null) ? opts.dailyNew : DEFAULT_DAILY_NEW;
      var idOf = opts.idOf || defaultIdOf;
      var every = (opts.interleaveEvery != null) ? opts.interleaveEvery : DEFAULT_INTERLEAVE_EVERY;
      if (every < 1) every = 1;
      var cap = (opts.reviewCap != null) ? opts.reviewCap : null;
      var t = today();

      var due = [], fresh = [], seen = new Set();
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        var _id = idOf(card);
        // 依 id 去重：同一 id 重複輸入只處理一次。
        if (seen.has(_id)) continue;
        seen.add(_id);
        var c = peek(_id);
        if (c.status !== 'new' && c.dueDate && c.dueDate <= t) {
          due.push({ card: card, c: c });
        } else if (c.status === 'new') {
          fresh.push(card);
        }
        // 已學但尚未到期者不進本次 session
      }

      // 到期：依 dueDate 升冪 → scheduleBox 升冪（沿用 dueCardIds 比較器精神）
      due.sort(function (x, y) {
        if (x.c.dueDate !== y.c.dueDate) return x.c.dueDate < y.c.dueDate ? -1 : 1;
        return (x.c.scheduleBox || 0) - (y.c.scheduleBox || 0);
      });
      var dueCards = due.map(function (o) { return o.card; });
      // 有 reviewCap 時，先保障到期複習卡的名額；新卡只能用剩餘名額，
      // 不可把逾期複習擠出當日 session（避免複習債越滾越大）。
      var newAllow = (cap != null) ? Math.max(0, Math.min(dailyNew, cap - dueCards.length)) : dailyNew;
      var newCards = fresh.slice(0, Math.max(0, newAllow));

      // 交錯：每 every 張到期插 1 張新卡；首段必為到期卡；新卡不全塞前段。
      var result = [];
      var ni = 0, di = 0;
      while (di < dueCards.length) {
        result.push(dueCards[di++]);
        if (di % every === 0 && ni < newCards.length) result.push(newCards[ni++]);
      }
      while (ni < newCards.length) result.push(newCards[ni++]);

      if (cap != null && result.length > cap) result = result.slice(0, cap);
      return result;
    }

    return {
      key: key,
      flat: flat,
      data: function () { return container; },
      cards: function () { return cardMap; },
      reload: bind,
      save: save,
      getCard: getCard,
      ensureCard: getCard,
      peek: peek,
      rate: rate,
      gradeBinary: gradeBinary,
      buildSession: buildSession,
      isAwarded: isAwarded,
      awardOnce: awardOnce
    };
  }

  var SRS = {
    INTERVAL: INTERVAL,
    today: today,
    addDays: addDays,
    ensureCard: ensureCard,       // 純遷移（就地補欄位）
    intervalToBox: intervalToBox,
    createStore: createStore,
    _fmtLocal: fmtLocal,
    _isoToLocalDate: isoToLocalDate
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = SRS;
  root.SRS = SRS;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
