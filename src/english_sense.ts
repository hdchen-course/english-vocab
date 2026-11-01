// @ts-nocheck — 機械式 legacy JS→TS 遷移：verbatim 轉檔、行為等價；型別檢查延後
/* =====================================================================
 * english_sense.ts  →  (tsc) →  english_sense.js
 * 原為 english_sense.html 的多個 inline <script> 區塊（連續、同一全域 scope）；
 * 依原順序合併成單一 sibling .js（保留全域 scope 與 onclick 參照、不加 IIFE）。
 * 行為與原 inline 版等價。
 * ===================================================================== */
/* 主程式（自足 IIFE）：20 個等級（lv1..lv20）、全部解鎖。選項每題 Fisher–Yates 洗牌；
   answer = 未洗牌前 0-based 索引，以 data-i 判斷，判分不受洗牌影響。每題最多記一次分。
   獨立 key：sense_progress_v1。不呼叫 Game.recordAnswer / award / recordSession。 */
(function () {
  'use strict';

  function toast(msg, kind) {
    try { if (window.Game && Game.showToast) Game.showToast(msg, kind || 'info'); } catch (e) {}
  }

  var PROG_KEY = 'sense_progress_v1';
  function loadProg() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem(PROG_KEY)); } catch (e) { p = null; }
    if (!p || typeof p !== 'object') p = {};
    if (typeof p.badges !== 'object' || !p.badges) p.badges = {};
    return p;
  }
  function saveProg(p) { try { localStorage.setItem(PROG_KEY, JSON.stringify(p)); } catch (e) {} }
  var progress = loadProg();

  window.__sensePlay = function (f) { try { new Audio('audio/' + f + '.mp3').play(); } catch (e) {} };
  function senseVisual(step, lv) {
    if (step.pic) return '<div class="ma-visual" role="img" aria-label="看圖題">' + step.pic + '</div>';
    if (step.audio) return '<div class="ma-visual"><button type="button" class="sense-audio-btn" onclick="__sensePlay(\''+step.audio+'\')">🔊 播放語音</button></div>';
    return '<div class="ma-visual" aria-hidden="true">' + lv.emoji + '</div>';
  }

  // 課程內容（全繁體中文；事實經 WebSearch 查核與雙重審查）。answer = 未洗牌前 0-based 索引。
    // 輕量選單中繼資料（menu metadata）：首屏只需 id／等級／名稱／emoji／色／概念／題數即可渲染選單，
  // 不含任何題目內容。完整題目（keyFacts＋questions）抽到 english_sense_data.js，進入某等級時才按需注入（R9 按需載入）。
  var LEVEL_META = [
      {"id": "lv1", "level": 1, "name": "哪個最自然", "emoji": "🗣️", "color": "#0d9488", "concepts": ["時態", "介系詞", "固定搭配", "冠詞", "可數/不可數"], "qCount": 12},
      {"id": "lv2", "level": 2, "name": "情境對話", "emoji": "💬", "color": "#f59e0b", "concepts": ["打招呼與道別", "禮貌請求", "道謝回應", "道歉", "自然一問一答"], "qCount": 10},
      {"id": "lv3", "level": 3, "name": "看圖說英文", "emoji": "🖼️", "color": "#7c3aed", "concepts": ["現在進行式", "there is / there are", "方位介系詞", "描述畫面"], "qCount": 10},
      {"id": "lv4", "level": 4, "name": "聽力小偵探", "emoji": "👂", "color": "#e11d48", "concepts": ["聽重點", "聽數字顏色", "聽方位", "聽一問一答", "先聽再答"], "qCount": 10},
      {"id": "lv5", "level": 5, "name": "語調小耳朵", "emoji": "🎵", "color": "#7c3aed", "concepts": ["語調是什麼", "上揚↗ 是真問", "平降↘ 是陳述", "同字不同調", "wh- 問句"], "qCount": 10},
      {"id": "lv6", "level": 6, "name": "介系詞的感覺", "emoji": "🧭", "color": "#0d9488", "concepts": ["時間介系詞 at/on/in", "地點介系詞 at/on/in", "to vs for（方向 vs 用途）", "by vs with（方式 vs 工具）", "固定搭配 listen to / good at"], "qCount": 12},
      {"id": "lv7", "level": 7, "name": "a、an、the 的感覺", "emoji": "🔤", "color": "#0891b2", "concepts": ["a／an：第一次提到、眾多之一", "an 看『聲音』不看字母", "the：特定、已知、獨一無二", "泛指複數與不可數：不加冠詞", "先 a 後 the 的敘事流"], "qCount": 12},
      {"id": "lv8", "level": 8, "name": "說得更順的搭配", "emoji": "🔗", "color": "#0891b2", "concepts": ["make／do 的分工感", "say／tell／speak／talk 四兄弟", "much／many／some／any 的量感", "borrow／lend 借的方向", "this／these、that／those 的遠近單複數"], "qCount": 16},
      {"id": "lv9", "level": 9, "name": "學校生活英語", "emoji": "🏫", "color": "#16a34a", "concepts": ["課堂指令", "請求與求助", "校園場所與人", "校園情境用語", "禮貌與語域"], "qCount": 14},
      {"id": "lv10", "level": 10, "name": "打招呼與社交口語", "emoji": "👋", "color": "#FF7043", "concepts": ["打招呼與回應", "道謝與道歉回應", "禮貌用語與邀約", "道別口語", "casual vs 正式（語域）"], "qCount": 14},
      {"id": "lv11", "level": 11, "name": "一聽就懂的慣用語", "emoji": "💬", "color": "#14b8a6", "concepts": ["慣用語看整組意思", "祝福與鼓勵", "天氣與身體狀況", "社交與溝通常用語", "口語 casual"], "qCount": 14},
      {"id": "lv12", "level": 12, "name": "輕鬆口語與縮寫", "emoji": "💬", "color": "#0ea5e9", "concepts": ["口語省音（gonna/wanna）", "訊息縮寫（LOL/BRB）", "casual 用語", "語域（場合）", "看引申義不照字面"], "qCount": 16},
      {"id": "lv13", "level": 13, "name": "關係子句的感覺", "emoji": "🔗", "color": "#6366f1", "concepts": ["who 說明『人』", "which／that 說明『東西、動物』", "口語 that：人、物通吃", "where 說明『地方』", "whose 表示『某人的』"], "qCount": 14},
      {"id": "lv14", "level": 14, "name": "更多情境對話", "emoji": "💬", "color": "#0891b2", "concepts": ["餐廳點餐與結帳", "購物：尺寸／試穿／價錢", "看醫生說症狀", "問路與指路", "電話與邀約的禮貌說法"], "qCount": 14},
      {"id": "lv15", "level": 15, "name": "進階聽力偵探", "emoji": "🎧", "color": "#0f766e", "concepts": ["聽細節抓重點", "聽數字與時間", "聽原因與心情", "聽指令動作", "聽語調辨語氣"], "qCount": 10},
      {"id": "lv16", "level": 16, "name": "語調再進階", "emoji": "🎶", "color": "#7c3aed", "concepts": ["同字不同調", "「?」尾音上揚↗", "「.」尾音下降↘", "「?!」驚訝上揚", "「…, right?」在確認"], "qCount": 8},
      {"id": "lv17", "level": 17, "name": "動詞的語感・後面接什麼", "emoji": "🧩", "color": "#F4845F", "concepts": ["enjoy／keep／mind／finish 後面配 -ing 唸起來最順", "want／decide／hope／plan／would like 後面配 to V", "stop doing（不再做那件事）vs stop to do（停下來去做）", "make／let／have 加人配原形；see／hear 加人配 do 或 -ing", "look forward to／be good at 這類片語固定配 -ing"], "qCount": 14},
      {"id": "lv18", "level": 18, "name": "形容詞的語感", "emoji": "🎨", "color": "#EC4899", "concepts": ["人有感覺用 -ed，事物讓人有感覺用 -ing（I'm bored／it's boring）", "look／feel／sound／smell／taste 後面直接配形容詞（You look tired）", "形容詞排隊順序：感覺→大小→顏色（a nice big red ball）", "-ed 講人的心情、-ing 講事物給人的感受（interested／interesting）", "常見搭配：be afraid of、feel good"], "qCount": 13},
      {"id": "lv19", "level": 19, "name": "數得清嗎・量的語感", "emoji": "🧮", "color": "#E67E22", "concepts": ["much information／much advice（不可數配 much）", "many books／many friends（可數配 many）", "a few friends 對 a little water（幾個 vs 一點點）", "a piece of paper／a glass of water／two pieces of bread（量的說法）", "some tea／any money（some 與 any 的語感）"], "qCount": 12},
      {"id": "lv20", "level": 20, "name": "這樣講最自然・日常動作", "emoji": "🌅", "color": "#F59E0B", "concepts": ["turn on / off the light、turn up / down（開關燈、調音量的固定講法）", "take a shower、have breakfast、do your homework、make the bed（起居動作的道地搭配）", "catch a cold、have a headache（生病、不舒服的講法）", "listen to music、watch TV、take a photo、ride a bike（休閒動作的自然說法）", "make friends、go shopping、play the piano、play basketball（常用的整組搭配）"], "qCount": 12},
  ];
  // 完整題目內容：於進入某等級時按需注入 english_sense_data.js，載入後填入 window.__SENSE_LEVELS。
  var LEVELS = null;
  var SENSE_DATA_SRC = 'english_sense_data.js';
  var dataState = 'idle'; // idle｜loading｜ready（error 後退回 idle 允許重試）
  var dataWaiters = [];
  // 按需注入資料檔。cb(err)：err 為 null 代表已就緒（LEVELS 已可用）。
  // 已載入過不重複注入；載入中的多次呼叫共用同一次注入；失敗退回 idle 以供重試。
  function ensureLevels(cb) {
      if (dataState === 'ready' && LEVELS) { cb(null); return; }
      dataWaiters.push(cb);
      if (dataState === 'loading') return;
      function flush(e) {
          if (e) dataState = 'idle';
          var ws = dataWaiters; dataWaiters = [];
          for (var i = 0; i < ws.length; i++) { try { ws[i](e); } catch (x) { } }
      }
      if (window.__SENSE_LEVELS) { LEVELS = window.__SENSE_LEVELS; dataState = 'ready'; flush(null); return; }
      dataState = 'loading';
      var s = document.createElement('script');
      s.src = SENSE_DATA_SRC;
      s.async = false;
      s.onload = function () {
          if (window.__SENSE_LEVELS) { LEVELS = window.__SENSE_LEVELS; dataState = 'ready'; flush(null); }
          else { flush(new Error('資料格式異常')); }
      };
      s.onerror = function () { flush(new Error('題目載入失敗')); };
      (document.head || document.documentElement).appendChild(s);
  }
  function levelById(id) {
      if (!LEVELS) return null;
      for (var i = 0; i < LEVELS.length; i++) { if (LEVELS[i].id === id) return LEVELS[i]; }
      return null;
  }
  // 進入某等級：先切到練習畫面顯示載入中（不留白畫面），按需注入題目資料後才真正開始；失敗給重試鈕。
  function enterLevel(meta) {
      cur = null;
      stepDots.innerHTML = '';
      playTitle.textContent = meta.emoji + ' 等級 ' + meta.level + '・' + meta.name;
      show(screenPlay);
      stage.innerHTML =
          '<div class="ma-stage" style="text-align:center;padding:var(--s5) var(--s4)">' +
              '<div class="ma-visual" aria-hidden="true">⏳</div>' +
              '<p class="ma-question">正在載入題目…</p>' +
          '</div>';
      ensureLevels(function (err) {
          var full = err ? null : levelById(meta.id);
          if (err || !full) {
              stage.innerHTML =
                  '<div class="ma-stage" style="text-align:center;padding:var(--s5) var(--s4)">' +
                      '<div class="ma-visual" aria-hidden="true">😕</div>' +
                      '<p class="ma-question">題目載入失敗了，請再試一次。</p>' +
                  '</div>' +
                  '<div class="ma-actions">' +
                      '<button type="button" class="btn btn-primary btn-block" id="btn-retry-data">🔄 重新載入</button>' +
                      '<button type="button" class="btn btn-block" id="btn-back-menu">← 回選單</button>' +
                  '</div>';
              var rb = $('btn-retry-data');
              if (rb) rb.addEventListener('click', function () { enterLevel(meta); });
              var bb = $('btn-back-menu');
              if (bb) bb.addEventListener('click', goMenu);
              return;
          }
          startLevel(full);
      });
  }

  var BADGES = [
  {
    "id": "lv1",
    "icon": "🗣️",
    "name": "語感達人"
  },
  {
    "id": "lv2",
    "icon": "💬",
    "name": "對話高手"
  },
  {
    "id": "lv3",
    "icon": "🖼️",
    "name": "看圖高手"
  },
  {
    "id": "lv4",
    "icon": "👂",
    "name": "聽力小偵探"
  },
  {
    "id": "lv5",
    "icon": "🎵",
    "name": "語調小耳朵"
  },
  {
    "id": "lv6",
    "icon": "📍",
    "name": "介系詞達人"
  },
  {
    "id": "lv7",
    "icon": "🔤",
    "name": "冠詞語感"
  },
  {
    "id": "lv8",
    "icon": "🧲",
    "name": "搭配高手"
  },
  {
    "id": "lv9",
    "icon": "🏫",
    "name": "校園英語家"
  },
  {
    "id": "lv10",
    "icon": "👋",
    "name": "社交口語家"
  },
  {
    "id": "lv11",
    "icon": "💬",
    "name": "慣用語偵探"
  },
  {
    "id": "lv12",
    "icon": "😎",
    "name": "口語達人"
  },
  {
    "id": "lv13",
    "icon": "🔗",
    "name": "關係語感家"
  },
  {
    "id": "lv14",
    "icon": "💬",
    "name": "對話達人"
  },
  {
    "id": "lv15",
    "icon": "🎧",
    "name": "聽力偵探"
  },
  {
    "id": "lv16",
    "icon": "🎶",
    "name": "語調進階家"
  },
  { "id": "lv17", "icon": "🧩", "name": "動詞語感家" },
  { "id": "lv18", "icon": "🎨", "name": "形容詞語感家" },
  { "id": "lv19", "icon": "🧮", "name": "量感高手" },
  { "id": "lv20", "icon": "🌅", "name": "生活口語家" },
  {
    "id": "all",
    "icon": "🏆",
    "name": "語感通"
  }
];
  var BADGE_BY_ID = {};
  for (var bi = 0; bi < BADGES.length; bi++) BADGE_BY_ID[BADGES[bi].id] = BADGES[bi];

  var $ = function (id) { return document.getElementById(id); };
  var screenMenu = $('screen-menu');
  var screenPlay = $('screen-play');
  var levelList = $('level-list');
  var stage = $('stage');
  var stepDots = $('step-dots');
  var playTitle = $('play-title');

  var cur = null;

  function starsFor(correct, total) {
    if (total <= 0) return 0;
    var r = correct / total;
    if (r >= 0.9) return 3;
    if (r >= 0.6) return 2;
    if (r > 0) return 1;
    return 0;
  }
  function starStr(n) { var s = ''; for (var i = 0; i < 3; i++) s += (i < n ? '⭐' : '☆'); return s; }

  function awardBadge(id) {
    var def = BADGE_BY_ID[id];
    if (!def) return;
    if (progress.badges[id]) return;
    progress.badges[id] = true;
    saveProg(progress);
    toast('獲得徽章：' + def.icon + ' ' + def.name, 'badge');
    try { if (window.SenseAdvBadges) SenseAdvBadges.refresh(); } catch (e) {}
  }
  function badgeCount() { var n = 0; for (var i = 0; i < BADGES.length; i++) if (progress.badges[BADGES[i].id]) n++; return n; }

  function renderMenu() {
    var doneCount = 0;
    for (var i = 0; i < LEVEL_META.length; i++) if (progress[LEVEL_META[i].id] && progress[LEVEL_META[i].id].done) doneCount++;
    $('ov-done').textContent = doneCount + '/' + LEVEL_META.length;
    $('ov-badges').textContent = badgeCount() + '/' + BADGES.length;

    if (doneCount > 0) {
      $('hello-text').textContent = '歡迎回來！你已完成 ' + doneCount + ' 個等級，很棒！';
      $('hello-sub').textContent = (doneCount >= LEVEL_META.length)
        ? '所有等級都完成了，你是英文語感小達人！🏆'
        : '想挑戰哪一個等級都可以，答錯也沒關係。';
    }

    levelList.innerHTML = '';
    for (var u = 0; u < LEVEL_META.length; u++) {
      (function (lv) {
        var rec = progress[lv.id] || {};
        var done = !!rec.done;
        var total = lv.qCount;
        var st = done ? Math.max(1, starsFor(rec.best || 0, total)) : 0;   // 已完成至少顯示 1 星（與結算畫面一致，避免 0 分空星列打擊士氣）
        var card = document.createElement('button');
        card.type = 'button';
        card.className = 'ma-level';
        card.setAttribute('aria-label', '等級 ' + lv.level + '：' + lv.name);
        card.innerHTML =
          '<div class="ma-level-top">' +
            '<span class="ma-level-emoji" aria-hidden="true" style="background:' + lv.color + '22;color:' + lv.color + '">' + lv.emoji + '</span>' +
            '<div>' +
              '<div class="ma-level-num">等級 ' + lv.level + '</div>' +
              '<div class="ma-level-name">' + lv.name + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="ma-level-concepts">' + lv.concepts.join('・') + '</div>' +
          '<div class="ma-level-foot">' +
            '<span class="ma-level-status ' + (done ? 'done' : 'todo') + '">' +
              (done ? '✅ 已完成（最佳 ' + (rec.best || 0) + '/' + total + '）' : '▶️ 開始挑戰<span style="white-space:nowrap">（共 ' + total + ' 題）</span>') + '</span>' +
            '<span class="ma-level-stars" aria-hidden="true">' + (done ? starStr(st) : '') + '</span>' +
          '</div>';
        card.addEventListener('click', function () { enterLevel(lv); });
        levelList.appendChild(card);
      })(LEVEL_META[u]);
    }
  }

  function show(screen) {
    screenMenu.classList.remove('active');
    screenPlay.classList.remove('active');
    screen.classList.add('active');
    window.scrollTo(0, 0);
  }

  function startLevel(lv) {
    cur = { level: lv, idx: 0, correctCount: 0, phase: 'brief' };
    playTitle.textContent = lv.emoji + ' 等級 ' + lv.level + '・' + lv.name;
    show(screenPlay);
    renderBrief();
  }

  function renderStepDots() {
    stepDots.innerHTML = '';
    if (cur.phase !== 'quiz') return;
    for (var i = 0; i < cur.level.questions.length; i++) {
      var b = document.createElement('i');
      if (i < cur.idx) b.className = 'on';
      else if (i === cur.idx) b.className = 'cur';
      stepDots.appendChild(b);
    }
  }

  function renderBrief() {
    renderStepDots();
    var lv = cur.level;
    var facts = '';
    for (var i = 0; i < lv.keyFacts.length; i++) {
      facts += '<li><span class="ma-kf-dot" aria-hidden="true">◆</span><span>' + lv.keyFacts[i] + '</span></li>';
    }
    stage.innerHTML =
      '<div class="ma-stage ma-brief">' +
        '<div class="ma-visual" aria-hidden="true">' + lv.emoji + '</div>' +
        '<h2>等級 ' + lv.level + '・' + lv.name + '</h2>' +
        '<p class="ma-brief-sub">先看看這一級的重點，再開始 ' + lv.questions.length + ' 題挑戰。</p>' +
        '<ul class="ma-keyfacts">' + facts + '</ul>' +
      '</div>' +
      '<div class="ma-actions">' +
        '<button type="button" class="btn btn-primary btn-block" id="btn-start">開始挑戰 ➡️</button>' +
      '</div>';
    $('btn-start').addEventListener('click', function () { cur.phase = 'quiz'; cur.idx = 0; renderQuestion(); });
  }

  function next() {
    cur.idx++;
    if (cur.idx >= cur.level.questions.length) finishLevel();
    else renderQuestion();
  }

  function renderQuestion() {
    renderStepDots();
    var lv = cur.level;
    var step = lv.questions[cur.idx];

    var order = [];
    for (var oi = 0; oi < step.options.length; oi++) order.push(oi);
    for (var m = order.length - 1; m > 0; m--) {
      var r = Math.floor(Math.random() * (m + 1));
      var tt = order[m]; order[m] = order[r]; order[r] = tt;
    }
    var optsHtml = '';
    for (var k = 0; k < order.length; k++) {
      var origIdx = order[k];
      optsHtml += '<button type="button" class="ma-opt" data-i="' + origIdx + '">' +
        '<span>' + step.options[origIdx] + '</span><span class="ma-opt-mark" aria-hidden="true"></span></button>';
    }

    stage.innerHTML =
      '<div class="ma-stage">' +
        senseVisual(step, lv) +
        '<p class="ma-question">第 ' + (cur.idx + 1) + ' / ' + lv.questions.length + ' 題　' + step.q + '</p>' +
        '<div class="ma-options">' + optsHtml + '</div>' +
        '<div class="ma-reveal" id="reveal"></div>' +
      '</div>' +
      '<div class="ma-actions" id="afteract" style="display:none">' +
        '<button type="button" class="btn btn-primary btn-block" id="btn-next">繼續 ➡️</button>' +
      '</div>';

    var answered = false;
    var btns = stage.querySelectorAll('.ma-opt');

    function revealAndLock(correct) {
      var rev = $('reveal');
      rev.textContent = (correct ? '答對了！' : '再想想～正確答案是這個！') + (step.why || '');
      if (step.sayAudio) {
        rev.appendChild(document.createElement('br'));
        var ab = document.createElement('button');
        ab.type = 'button'; ab.className = 'sense-audio-btn'; ab.style.marginTop = '10px';
        ab.textContent = '🔊 聽聽最自然的說法';
        ab.addEventListener('click', function () { __sensePlay(step.sayAudio); });
        rev.appendChild(ab);
        try { __sensePlay(step.sayAudio); } catch (e) {}
      }
      rev.classList.add('show');
      $('afteract').style.display = 'flex';
      var all = stage.querySelectorAll('.ma-opt');
      for (var a = 0; a < all.length; a++) all[a].disabled = true;
    }

    for (var b = 0; b < btns.length; b++) {
      btns[b].addEventListener('click', function () {
        var i = parseInt(this.getAttribute('data-i'), 10);
        var isCorrect = (i === step.answer);
        if (answered) return;
        answered = true;
        // 唯一例外：作答時維持每日連續學習 streak（不計 XP、不重複計分、同日 idempotent）。
        if (window.Game && typeof Game.pingActive === 'function') { try { Game.pingActive(); } catch (e) {} }
        if (isCorrect) {
          this.classList.add('correct');
          this.querySelector('.ma-opt-mark').textContent = '✅';
          cur.correctCount++;
          revealAndLock(true);
        } else {
          this.classList.add('wrong');
          this.querySelector('.ma-opt-mark').textContent = '❌';
          var correctBtn = stage.querySelector('.ma-opt[data-i="' + step.answer + '"]');
          if (correctBtn) {
            correctBtn.classList.add('correct');
            correctBtn.querySelector('.ma-opt-mark').textContent = '✅';
          }
          revealAndLock(false);
        }
      });
    }

    $('btn-next').addEventListener('click', next);
  }

  function finishLevel() {
    var lv = cur.level;
    var total = lv.questions.length;
    var got = cur.correctCount;

    var prev = progress[lv.id] || {};
    progress[lv.id] = { done: true, best: Math.max(prev.best || 0, got) };
    saveProg(progress);

    awardBadge(lv.id);
    var allDone = true;
    for (var i = 0; i < LEVEL_META.length; i++) if (!(progress[LEVEL_META[i].id] && progress[LEVEL_META[i].id].done)) { allDone = false; break; }
    if (allDone) awardBadge('all');

    var st = Math.max(1, starsFor(got, total)); // 顯示至少 1 顆星，避免 0 分時空星列打擊士氣
    stage.innerHTML =
      '<div class="ma-stage ma-done">' +
        '<div class="ma-done-emoji" aria-hidden="true">🎉</div>' +
        '<div class="ma-done-title">完成「' + lv.name + '」！</div>' +
        '<div class="ma-done-stars" aria-label="得到 ' + st + ' 顆星">' + starStr(st) + '</div>' +
        '<p class="ma-question" style="font-size:clamp(16px,3.6vw,19px);text-align:center">你答對了 ' + got + ' / ' + total + ' 題，真棒！</p>' +
      '</div>' +
      '<div class="ma-actions">' +
        '<button type="button" class="btn" id="btn-menu">回到選單</button>' +
        (nextLevelOf(lv) ? '<button type="button" class="btn btn-primary" id="btn-nextlv">下一個等級 ➡️</button>' : '') +
      '</div>';

    toast('完成「' + lv.name + '」！你答對了 ' + got + ' / ' + total + ' 題，真棒！', 'daily');

    $('btn-menu').addEventListener('click', goMenu);
    var nl = nextLevelOf(lv);
    if (nl) $('btn-nextlv').addEventListener('click', function () { startLevel(nl); });
  }

  function nextLevelOf(lv) {
    for (var i = 0; i < LEVEL_META.length; i++) { if (LEVEL_META[i].id === lv.id) return LEVEL_META[i + 1] ? levelById(LEVEL_META[i + 1].id) : null; }
    return null;
  }

  function goMenu() { cur = null; stepDots.innerHTML = ''; renderMenu(); show(screenMenu); }

  $('btn-back').addEventListener('click', goMenu);

  window.__senseAdv = { LEVELS: LEVEL_META, BADGES: BADGES, getProgress: function () { return progress; } };

  renderMenu();
})();

/* ---- (下一個原 inline <script> 區塊) ---- */

(function () {
  'use strict';
  function api() { return window.__senseAdv || null; }
  function unlockedCount() {
    var a = api(); if (!a) return 0;
    var prog = a.getProgress(); var n = 0;
    for (var i = 0; i < a.BADGES.length; i++) if (prog.badges[a.BADGES[i].id]) n++;
    return n;
  }
  function renderGrid() {
    var a = api(); if (!a) return;
    var prog = a.getProgress();
    var host = document.getElementById('senseAdvBadgeGrid');
    if (!host) return;
    var html = '';
    for (var i = 0; i < a.BADGES.length; i++) {
      var def = a.BADGES[i];
      var got = !!prog.badges[def.id];
      var cls = 'ma-badge ' + (got ? 'unlocked' : 'locked');
      var glyph = got ? def.icon : '🔒';
      var state = got ? '已收集' : '尚未解鎖';
      var star = got ? '<span class="ma-badge-star" aria-hidden="true">★</span>' : '';
      var label = def.name + '（' + state + '）';
      html += '<div class="' + cls + '" title="' + label + '" aria-label="' + label + '">' +
        '<span class="ma-badge-glyph" aria-hidden="true">' + glyph + '</span>' +
        '<span class="ma-badge-name">' + def.name + '</span>' +
        '<span class="ma-badge-state">' + state + '</span>' + star + '</div>';
    }
    host.innerHTML = html;
  }
  function renderSummary() {
    var a = api(); if (!a) return;
    var el = document.getElementById('senseAdvBadgeSummary');
    if (!el) return;
    el.innerHTML = '已收集 <b>' + unlockedCount() + '</b> / ' + a.BADGES.length + ' 枚徽章（收藏只增不減，慢慢玩就好）';
  }
  function updateFabCount() {
    var a = api(); if (!a) return;
    var badge = document.getElementById('senseAdvBadgeFabCount');
    if (badge) badge.textContent = unlockedCount() + '/' + a.BADGES.length;
  }
  function refresh() { updateFabCount(); if (isOpen()) { renderGrid(); renderSummary(); } }
  function isOpen() { var el = document.getElementById('senseAdvBadgeOverlay'); return el && !el.hidden; }
  function openBook() { renderGrid(); renderSummary(); var o = document.getElementById('senseAdvBadgeOverlay'); if (o) o.hidden = false; }
  function closeBook() { var o = document.getElementById('senseAdvBadgeOverlay'); if (o) o.hidden = true; }
  function buildDom() {
    var host = document.createElement('div');
    host.innerHTML =
      '<button id="senseAdvBadgeFab" type="button" aria-label="打開語感徽章冊" onclick="SenseAdvBadges.openBook()">' +
        '🏅 徽章冊 <span id="senseAdvBadgeFabCount">0/21</span></button>' +
      '<div id="senseAdvBadgeOverlay" class="ma-overlay" hidden>' +
        '<div class="ma-card" role="dialog" aria-modal="true" aria-label="語感徽章冊">' +
          '<div class="ma-card-head"><h1>🏅 英文語感徽章冊</h1>' +
            '<button class="ma-card-back" onclick="SenseAdvBadges.closeBook()">← 返回</button></div>' +
          '<div class="ma-card-note">這本徽章冊只存在你自己的裝置上，純粹紀念你完成過哪些進階等級。它不會計入學習基地的等級或經驗值——放輕鬆挑戰就好 🌱</div>' +
          '<div id="senseAdvBadgeSummary" class="ma-card-summary"></div>' +
          '<div id="senseAdvBadgeGrid" class="ma-badge-grid"></div>' +
        '</div></div>';
    while (host.firstChild) document.body.appendChild(host.firstChild);
  }
  window.SenseAdvBadges = { openBook: openBook, closeBook: closeBook, refresh: refresh };
  function boot() { buildDom(); updateFabCount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
