// @ts-nocheck — 機械式 legacy JS→TS 遷移：verbatim 轉檔、行為等價；型別檢查延後
/* toeic_gept_flashcard__1.ts ← toeic_gept_flashcard.html 的第 1 段連續 inline（flashcard：WORD_DATA/SRS/主程式分段，順序關鍵）。verbatim、全域 scope、無 IIFE。 */
(function () {
  'use strict';
  var KEY = 'toeic_worddex_v1';
  var REVIEW_CAP = 20;
  var DAILY_NEW = 10;
  var LEVELS = ['toeic', 'gept_elementary'];
  var LEVEL_LABEL = { toeic: 'TOEIC 多益', gept_elementary: 'GEPT 全民英檢初級' };
  var MILE_XP = {
    first_word: 10, lit_25: 30, lit_50: 60, lit_100: 100,
    level_toeic_all: 80, level_gept_elementary_all: 80,
    all_lit: 200, master_50: 80, master_all: 300
  };

  // 共用 SRS store（巢狀格式，與既有 toeic_worddex_v1 相容；讀時 lazy 遷移，絕不清空）。
  var store = (window.SRS && window.SRS.createStore) ? window.SRS.createStore(KEY) : null;
  var wordIndex = null; // id -> { word物件, level }

  function wordId(level, word) { return level + '::' + word; }
  function today() {
    if (window.SRS) return window.SRS.today();
    try { if (window.Game && window.Game.localDate) return window.Game.localDate(); } catch (e) {}
    return new Date().toISOString().slice(0, 10);
  }
  function cards() { return store ? store.cards() : {}; }
  function cardOf(id) { var m = cards(); return m[id] || null; }

  // 掃 WORD_DATA 兩級建立 id -> { word物件, level }
  function buildIndex() {
    wordIndex = {};
    for (var li = 0; li < LEVELS.length; li++) {
      var lv = LEVELS[li];
      var pack = window.WORD_DATA && window.WORD_DATA[lv];
      if (!pack || !pack.words) continue;
      for (var wi = 0; wi < pack.words.length; wi++) {
        var w = pack.words[wi];
        wordIndex[wordId(lv, w.word)] = { word: w, level: lv };
      }
    }
  }
  function idx() { if (!wordIndex) buildIndex(); return wordIndex; }

  // ---- 分母 / 統計（收藏視覺一律讀 peakBox / lit：只增不減） ----
  function levelWords(level) {
    var pack = window.WORD_DATA && window.WORD_DATA[level];
    return (pack && pack.words) ? pack.words : [];
  }
  function totalCount() {
    var n = 0; for (var i = 0; i < LEVELS.length; i++) n += levelWords(LEVELS[i]).length; return n;
  }
  function isLit(level, word) { var c = cardOf(wordId(level, word)); return !!(c && c.lit); }
  function isMastered(level, word) { var c = cardOf(wordId(level, word)); return !!(c && (c.peakBox || 0) >= 5); }
  function litCount() { var m = cards(), n = 0; for (var id in m) if (m[id].lit) n++; return n; }
  function masteredCount() { var m = cards(), n = 0; for (var id in m) if ((m[id].peakBox || 0) >= 5) n++; return n; }
  function levelAllLit(level) {
    var ws = levelWords(level); if (!ws.length) return false;
    for (var i = 0; i < ws.length; i++) if (!isLit(level, ws[i].word)) return false;
    return true;
  }
  function levelAllMastered(level) {
    var ws = levelWords(level); if (!ws.length) return false;
    for (var i = 0; i < ws.length; i++) if (!isMastered(level, ws[i].word)) return false;
    return true;
  }

  // ---- 里程碑（store.awardOnce 單調 guard → 先落地再發 XP） ----
  function satisfiedMilestones() {
    var out = [];
    var lit = litCount(), m5 = masteredCount();
    if (lit >= 1) out.push('first_word');
    if (lit >= 25) out.push('lit_25');
    if (lit >= 50) out.push('lit_50');
    if (lit >= 100) out.push('lit_100');
    if (levelAllLit('toeic')) out.push('level_toeic_all');
    if (levelAllLit('gept_elementary')) out.push('level_gept_elementary_all');
    var allLit = true;
    for (var i = 0; i < LEVELS.length; i++) { if (!levelAllLit(LEVELS[i])) { allLit = false; break; } }
    if (allLit && totalCount() > 0) out.push('all_lit');
    if (m5 >= 50) out.push('master_50');
    var allMaster = true;
    for (var j = 0; j < LEVELS.length; j++) { if (!levelAllMastered(LEVELS[j])) { allMaster = false; break; } }
    if (allMaster && totalCount() > 0) out.push('master_all');
    return out;
  }
  function mileMsg(id) {
    switch (id) {
      case 'first_word': return '🌟 收集到第一個單字！';
      case 'lit_25': return '✨ 已收集 25 個字！';
      case 'lit_50': return '✨ 已收集 50 個字！';
      case 'lit_100': return '✨ 已收集 100 個字！';
      case 'level_toeic_all':
      case 'level_gept_elementary_all': return '⭐ 完成一整級的單字收集！';
      case 'all_lit': return '🌌 所有單字都收集齊了！';
      case 'master_50': return '🏅 已精通 50 個字！';
      case 'master_all': return '👑 全部單字都精通了！';
      default: return '🎉 達成新成就！';
    }
  }
  function checkMilestones() {
    if (!store) return;
    var s = satisfiedMilestones();
    for (var i = 0; i < s.length; i++) {
      var id = s[i];
      // store.awardOnce：先設 guard → save → 回 true；呼叫方再發 XP/toast。
      if (!store.awardOnce(id)) continue;
      try { if (window.Game && window.Game.award) window.Game.award('english', MILE_XP[id] || 0, { silent: true, source: 'worddex-milestone', milestone: id }); } catch (e) {}
      try { if (window.Game && window.Game.showToast) window.Game.showToast(mileMsg(id), 'success'); } catch (e) {}
    }
  }

  // ---- 排程漏斗（主作答導進 SRS；收藏只增不減、與 scheduleBox 脫鉤） ----
  function grade(id, g) {          // 三級自評：again | good | easy
    if (!store) return;
    store.rate(id, g);
    if (g !== 'again') checkMilestones();
    if (isScreenOpen()) { renderSections(); renderSummary(); }
    updateDueDesc();
  }
  function gradeBinary(id, correct) {   // 二元作答（測驗 / 拼字）
    if (!store) return;
    store.gradeBinary(id, correct);
    if (correct) checkMilestones();
    if (isScreenOpen()) { renderSections(); renderSummary(); }
    updateDueDesc();
  }
  function peek(id) { return store ? store.peek(id) : null; }

  // ---- 今日到期佇列（跨等級單一收藏） ----
  function dueCardIds(t) {
    var m = cards(), out = [];
    for (var id in m) {
      var s = m[id];
      if (s.lit && s.dueDate && s.dueDate <= t) out.push(id);
    }
    out.sort(function (x, y) {
      var sx = m[x], sy = m[y];
      if (sx.dueDate !== sy.dueDate) return sx.dueDate < sy.dueDate ? -1 : 1;
      return (sx.scheduleBox || 0) - (sy.scheduleBox || 0);
    });
    return out;
  }
  function dueCount() { return dueCardIds(today()).length; }

  // 建立「主學習」佇列：單一等級，到期優先 + 每日新卡上限 + 新舊交錯。
  function buildLevelSession(level) {
    if (!store) return [];
    var ws = levelWords(level).map(function (w) { w._lvl = level; return w; });
    return store.buildSession(ws, {
      dailyNew: DAILY_NEW,
      idOf: function (c) { return wordId(c._lvl || level, c.word); }
    });
  }
  // 建立「今日複習」佇列：跨等級，到期優先 + 新卡補位（reviewCap 上限）。
  function buildReviewQueue() {
    if (!store) return [];
    var all = [];
    for (var li = 0; li < LEVELS.length; li++) {
      var lv = LEVELS[li];
      var ws = levelWords(lv);
      for (var wi = 0; wi < ws.length; wi++) { ws[wi]._lvl = lv; all.push(ws[wi]); }
    }
    return store.buildSession(all, {
      dailyNew: DAILY_NEW,
      reviewCap: REVIEW_CAP,
      idOf: function (c) { return wordId(c._lvl, c.word); }
    });
  }

  // ---- 畫面 ----
  function isScreenOpen() {
    var el = document.getElementById('worddexArea');
    return el && !el.classList.contains('hidden');
  }
  // glyph / 階名一律由 peakBox 決定（收藏視覺只增不減）。
  function glyph(peak) { if (!peak) return '☆'; if (peak >= 5) return '🌟'; return '⭐'; }
  function stateText(peak) { if (!peak) return '未收集'; if (peak >= 5) return '精通'; return '第 ' + peak + ' 盒'; }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function jsStrAttr(s) {
    return "'" + String(s)
      .replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;') + "'";
  }
  function renderSections() {
    var host = document.getElementById('worddexSections');
    if (!host) return;
    var t = today();
    var m = cards();
    var html = '';
    for (var li = 0; li < LEVELS.length; li++) {
      var lv = LEVELS[li];
      var ws = levelWords(lv);
      if (!ws.length) continue;
      html += '<div class="worddex-section"><div class="worddex-section-title">' + escapeHtml(LEVEL_LABEL[lv]) + '</div><div class="fc-dex__grid">';
      for (var wi = 0; wi < ws.length; wi++) {
        var w = ws[wi];
        var id = wordId(lv, w.word);
        var c = m[id];
        var peak = c ? (c.peakBox || 0) : 0;
        var due = !!(c && c.lit && c.dueDate && c.dueDate <= t);
        html += '<div class="fc-dex__card' + (due ? ' is-due' : '') + '" role="button" tabindex="0"' +
          ' onclick="Worddex.openFocus(\'' + lv + '\',' + jsStrAttr(w.word) + ')"' +
          ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();Worddex.openFocus(\'' + lv + '\',' + jsStrAttr(w.word) + ');}">' +
          '<span class="wd-emoji">' + escapeHtml(w.emoji || '📖') + '</span>' +
          '<span class="fc-dex__glyph">' + glyph(peak) + (due ? ' <span class="fc-dex__due">🔵</span>' : '') + '</span>' +
          '<span class="fc-dex__word">' + escapeHtml(w.word) + '</span>' +
          '<span class="fc-dex__state">' + stateText(peak) + '</span>' +
          '</div>';
      }
      html += '</div></div>';
    }
    host.innerHTML = html;
  }
  function renderSummary() {
    var el = document.getElementById('worddexSummary');
    if (!el) return;
    var lit = litCount(), mastered = masteredCount(), due = dueCount(), total = totalCount();
    el.innerHTML = '已收集 <b>' + lit + '</b> / ' + total + '　·　精通 <b>' + mastered + '</b> 個　·　' +
      (due > 0 ? '今天有 <b>' + due + '</b> 個字想跟你打招呼 🔵' : '今天都複習完了');
  }
  function updateDueDesc() {
    var el = document.getElementById('worddexDueDesc');
    if (!el) return;
    var due = dueCount();
    el.textContent = due > 0 ? ('今天有 ' + due + ' 個字要複習') : '今天複習完了，明天見！';
  }

  function openScreen() {
    var area = document.getElementById('worddexArea');
    var dash = document.querySelector('.dashboard');
    var modes = document.querySelector('.mode-toggle');
    if (dash) dash.classList.add('hidden');
    if (modes) modes.classList.add('hidden');
    if (area) area.classList.remove('hidden');
    renderSections(); renderSummary(); updateDueDesc();
  }
  function closeScreen() {
    var area = document.getElementById('worddexArea');
    var dash = document.querySelector('.dashboard');
    var modes = document.querySelector('.mode-toggle');
    if (area) area.classList.add('hidden');
    if (dash) dash.classList.remove('hidden');
    if (modes) modes.classList.remove('hidden');
  }

  function openFocus(level, word) {
    var id = wordId(level, word);
    var rec = idx()[id];
    var wObj = rec ? rec.word : null;
    var c = cardOf(id);
    var peak = c ? (c.peakBox || 0) : 0;
    var t = today();
    var status;
    if (!peak) status = '還沒收集，練一次就會亮起來 ✨';
    else if (peak >= 5) status = '已經精通囉！🌟';
    else status = '目前在第 ' + peak + ' 盒';
    var when = '';
    if (c && c.lit && c.dueDate) {
      if (c.dueDate <= t) when = '今天適合複習 🔵';
      else when = '下次複習日：' + c.dueDate;
    }
    var body = document.getElementById('worddexFocusBody');
    if (body) {
      body.innerHTML =
        '<div class="worddex-focus-emoji">' + escapeHtml((wObj && wObj.emoji) || '📖') + '</div>' +
        '<div class="worddex-focus-word">' + escapeHtml(word) + '</div>' +
        '<div class="worddex-focus-cn">' + escapeHtml((wObj && wObj.chinese) || '') + '</div>' +
        '<div class="worddex-focus-meta">' + status + (when ? ('<br>' + when) : '') +
          '<br>答對 ' + (c ? (c.timesCorrect || 0) : 0) + ' 次</div>' +
        '<button class="worddex-focus-practice" onclick="Worddex.startFocus(\'' + level + '\',' + jsStrAttr(word) + ')">✏️ 練這個字</button>';
    }
    var o = document.getElementById('worddexFocusOverlay');
    if (o) o.hidden = false;
  }
  function closeFocus() {
    var o = document.getElementById('worddexFocusOverlay');
    if (o) o.hidden = true;
  }

  function startReview() {
    closeFocus();
    var q = buildReviewQueue();
    if (!q.length) {
      try { if (window.Game && window.Game.showToast) window.Game.showToast('今天都複習完了，明天見！', 'success'); } catch (e) {}
      return;
    }
    closeScreen();
    if (typeof window.startWorddexReview === 'function') window.startWorddexReview(q);
  }
  function startFocus(level, word) {
    closeFocus();
    var rec = idx()[wordId(level, word)];
    if (!rec) return;
    var w = rec.word; w._lvl = rec.level;
    closeScreen();
    if (typeof window.startWorddexReview === 'function') window.startWorddexReview([w]);
  }

  window.Worddex = {
    grade: grade,
    gradeBinary: gradeBinary,
    peek: peek,
    buildLevelSession: buildLevelSession,
    buildReviewQueue: buildReviewQueue,
    openScreen: openScreen,
    closeScreen: closeScreen,
    openFocus: openFocus,
    closeFocus: closeFocus,
    startReview: startReview,
    startFocus: startFocus
  };

  updateDueDesc();
})();

/* ---- (下一個原 inline <script> 區塊) ---- */

// ==================== STATE ====================
const LEVELS = [
  { key: 'toeic', label: 'TOEIC 多益' },
  { key: 'gept_elementary', label: 'GEPT 全民英檢初級' }
];
const SPELL_MODE_KEY = 'toeic_spell_mode';

let currentLevel = LEVELS[0].key;
let currentMode = 'flashcard';   // flashcard | quiz | spell
let currentIndex = 0;
let isFlipped = false;
let knownCount = 0;
let againCount = 0;
let studyQueue = [];
let answered = false;            // quiz / spell 作答鎖（自控繼續前不重複計分）
let quizState = null;
let spell = null;
let spellAudioId = null; // 記住已播過發音的 spell.id，避免點磚/清除/切換字母磚↔鍵盤時重播整字發音；換卡（switchMode/nextWord/startWorddexReview）會重設為 null，讓同一個字之後再出現時仍會播一次

// ==================== HELPERS ====================
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function shuffleInPlace(arr) {
  for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  return arr;
}
function shuffle(arr) { return shuffleInPlace(arr.slice()); }

function getWord() {
  if (studyQueue.length === 0) return null;
  return studyQueue[currentIndex % studyQueue.length];
}
// 穩定 id（等級 + 原始單字字串）；卡片可能帶 _lvl（今日複習跨等級佇列）。
function currentWordId() { var w = getWord(); return w ? ((w._lvl || currentLevel) + '::' + w.word) : (currentLevel + '::'); }

// 低品質定義偵測：避免把難以辨認的字典殘句當提示。
function isPoorDefinition(word) {
  const d = (word.definition || '').toLowerCase().trim();
  if (!d) return true;
  const badMarkers = [
    '‘', '’', 'from latin', 'from greek', 'from old', 'from french', 'from middle',
    'latin ', 'greek ', ', from ', 'dates from', '(see ', 'in the sense',
    'became obsolete', 'obsolete', 'as an act which'
  ];
  if (badMarkers.some(m => d.includes(m))) return true;
  const w = (word.word || '').toLowerCase().trim();
  if (w && d.includes(w)) return true;
  return false;
}
function getDefinitionText(word) {
  if (word.definition && !isPoorDefinition(word)) return word.definition;
  if (word.chinese) return word.chinese;
  if (word.cloze) return word.cloze;
  if (word.sentence) return word.sentence.replace(/<strong>.*?<\/strong>/g, '______');
  return word.tip || '（暫無提示）';
}
// 字義標籤（雙向出題共用）：優先中文，退回英文定義。
function meaningOf(word) { return word.chinese || getDefinitionText(word); }

function audioSrc(word, kind) {
  const name = word.word.replace(/ /g, '_').replace(/\//g, '_');
  const lvl = word._lvl || currentLevel;
  return 'audio/' + kind + '_' + lvl + '_' + name + '.mp3';
}
// 播放音檔；缺檔／被瀏覽器擋下時安靜失敗，不對孩子丟錯。
function playAudio(src) {
  try { const a = new Audio(src); const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
}
function playCurrentWord() { const w = getWord(); if (w) playAudio(audioSrc(w, 'word')); }
function playCurrentSentence() { const w = getWord(); if (w) playAudio(audioSrc(w, 'sent')); }

function recordXp(correct) {
  try { if (window.Game && Game.recordAnswer) Game.recordAnswer('english', correct); } catch (e) {}
}
function emptyHTML(msg) {
  return '<div class="empty-state"><div class="empty-state-emoji">🎉</div><p>' + (msg || '這個等級目前沒有要練的字，去圖鑑看看收藏，或明天再回來複習吧！') + '</p></div>';
}

// ==================== INIT / QUEUE ====================
function init() {
  renderLevelSelector();
  resetQueue();
  render();
}
function renderLevelSelector() {
  const container = document.getElementById('levelSelector');
  container.innerHTML = LEVELS.map(lv => {
    const active = lv.key === currentLevel;
    return '<button class="fc-source__btn' + (active ? ' active' : '') + '" aria-pressed="' + active + '"' +
      ' onclick="selectLevel(\'' + lv.key + '\')">' + esc(lv.label) + '</button>';
  }).join('');
}
function selectLevel(key) {
  currentLevel = key;
  currentIndex = 0; isFlipped = false; answered = false; spell = null; spellAudioId = null;   // 與 switchMode/nextWord/startWorddexReview 一致：清掉 render 快取的 spell 盤面，否則重選同一等級、佇列首字仍是剛評分的到期字時，renderSpell 的 id 相符守衛會沿用舊的已評分盤面（answered 已歸零 → 可清空重填再評分，二次 gradeBinary/XP，且抑制 audio-first 重播）
  knownCount = 0; againCount = 0;
  updateScore();
  resetQueue();
  renderLevelSelector();
  render();
}
function switchMode(mode) {
  currentMode = mode;
  currentIndex = 0; isFlipped = false; answered = false; spell = null; spellAudioId = null;
  knownCount = 0; againCount = 0; updateScore();   // 切換活動＝重開一輪：歸零共用的 答對/還不熟 計分，否則會把前一個活動的分數混進來（與 selectLevel 一致）
  document.querySelectorAll('.mode-toggle .fc-source__btn').forEach(b => {
    const on = b.getAttribute('data-mode') === mode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  render();
}
function resetQueue() {
  // 間隔重複為主路徑：到期優先 + 每日新卡上限 + 新舊交錯（新卡段內再洗牌）。
  const q = (window.Worddex && Worddex.buildLevelSession) ? Worddex.buildLevelSession(currentLevel) : [];
  studyQueue = q || [];
}
// 今日複習橋接：跨等級佇列灌入主流程；不重置分數，維持累加。
window.startWorddexReview = function (q) {
  studyQueue = q; currentIndex = 0; isFlipped = false; answered = false; spell = null; spellAudioId = null; render();
};
function updateScore() {
  document.getElementById('knownCount').textContent = knownCount;
  document.getElementById('againCount').textContent = againCount;
}
function nextWord() {
  currentIndex++;
  if (currentIndex >= studyQueue.length) { currentIndex = 0; resetQueue(); }
  isFlipped = false; answered = false; spell = null; spellAudioId = null;
  render();
}

// ==================== RENDER ====================
function render() {
  if (currentMode === 'flashcard') renderFlashcard();
  else if (currentMode === 'quiz') renderQuiz();
  else renderSpell();
}

// ---- 閃卡（audio-first：正面單字＋自動發音 → 回想字義 → 翻面自評） ----
function renderFlashcard() {
  const area = document.getElementById('learningArea');
  const word = getWord();
  if (!word) { area.innerHTML = emptyHTML(); return; }
  const total = studyQueue.length;

  area.innerHTML =
    '<div class="word-counter">第 ' + (currentIndex + 1) + ' / ' + total + ' 張</div>' +
    '<div class="fc-card" tabindex="0" role="button" aria-label="單字卡，點一下或按空白鍵翻面" onclick="flipCard()"' +
      ' onkeydown="if(event.key===\' \'||event.key===\'Enter\'){event.preventDefault();flipCard();}">' +
      '<div class="fc-card__inner' + (isFlipped ? ' flipped' : '') + '" id="fcInner">' +
        '<div class="fc-card__face fc-card__front">' +
          '<div class="fc-card__emoji">' + esc(word.emoji || '📖') + '</div>' +
          '<div class="fc-card__word">' + esc(word.word) + '</div>' +
          '<button type="button" class="fc-audio fc-audio--lg" aria-label="播放單字發音" onclick="event.stopPropagation();playCurrentWord()">🔊</button>' +
          '<div class="fc-card__tap">點一下翻面看意思</div>' +
        '</div>' +
        '<div class="fc-card__face fc-card__back">' +
          (word.chinese ? '<div class="fc-card__cn">' + esc(word.chinese) + '</div>' : '') +
          (getDefinitionText(word) === word.chinese ? '' : '<div class="fc-card__hint">' + esc(getDefinitionText(word)) + '</div>') +
          (word.sentence ? '<div class="flashcard-audio-row">' +
            '<button type="button" class="fc-audio fc-audio--sm" aria-label="播放例句發音" onclick="event.stopPropagation();playCurrentSentence()">🔊</button>' +
            '<span class="fc-card__sent">' + word.sentence + '</span></div>' : '') +
          (word.tip ? '<div class="fc-card__tip">' + esc(word.tip) + '</div>' : '') +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="fc-rate">' +
      '<button type="button" class="fc-rate__btn again" onclick="rateCard(\'again\')">😅<span class="fc-rate__btn__label">還不熟</span></button>' +
      '<button type="button" class="fc-rate__btn good" onclick="rateCard(\'good\')">🙂<span class="fc-rate__btn__label">想起來了</span></button>' +
      '<button type="button" class="fc-rate__btn easy" onclick="rateCard(\'easy\')">😎<span class="fc-rate__btn__label">很輕鬆</span></button>' +
    '</div>';

  playCurrentWord(); // audio-first：卡片一出現先播一次
}
function flipCard() {
  isFlipped = !isFlipped;
  const inner = document.getElementById('fcInner');
  if (inner) inner.classList.toggle('flipped');
}
let lastRateAt = 0;
function rateCard(grade) {
  const now = Date.now();
  // 去抖：評完一張卡會立刻 nextWord 並把下一張的評分鈕 render 到同一位置；350ms 內的第二次點擊
  // 會打在那張還沒看過的新卡上、把它誤評並跳過。用時間冷卻擋掉（render 是同步的，單純旗標擋不住）。
  if (now - lastRateAt < 350) return;
  lastRateAt = now;
  const word = getWord();
  if (!word) return;
  const correct = grade !== 'again';
  if (correct) knownCount++; else againCount++;
  updateScore();
  recordXp(correct);
  try { if (window.Worddex) Worddex.grade(currentWordId(), grade); } catch (e) {}
  // 「還不熟」在本 session 稍後再現（位移重插，不緊鄰重複）。
  if (grade === 'again' && studyQueue.length > 3) {
    const insertAt = Math.min(currentIndex + 3 + Math.floor(Math.random() * 5), studyQueue.length);
    // 只有在插入點確實落在下一張之後才重插，避免最後一張被 clamp 成「附加到隊尾」後，
    // nextWord 的 currentIndex++ 剛好停在它上面而緊鄰重複；此情況改由 SRS 下一輪自然再現。
    if (insertAt > currentIndex + 1) studyQueue.splice(insertAt, 0, word);
  }
  nextWord();
}

// ---- 測驗（雙向：看字選義 / 看義選字，交錯出題） ----
// 釋義正規化：去括號註解＋去空白，供同義／去重比對用。
function normMeaningKey(s) {
  return String(s || '')
    .replace(/[（(][^（()）]*[）)]/g, '') // 去括號補充說明
    .replace(/\s+/g, '')                 // 去空白
    .toLowerCase();
}
// 拆成成分（以 / 、，,；; ｜| 等分隔），任一成分相同即視為同義。
function meaningParts(s) {
  return normMeaningKey(s)
    .split(/[\/、，,；;｜|]+/)
    .map(function (t) { return t.trim(); })
    .filter(Boolean);
}
// 兩個中文釋義是否同義（整體相同或任一成分相同）。
function shareMeaning(a, b) {
  if (!a || !b) return false;
  var ka = normMeaningKey(a), kb = normMeaningKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  var pa = meaningParts(a), pb = meaningParts(b);
  for (var i = 0; i < pa.length; i++) { if (pa[i] && pb.indexOf(pa[i]) >= 0) return true; }
  return false;
}
// opts.correctWord：排除與正解同義的候選（避免第二正解被判錯）。
// opts.meaningDedup：以正規化義去重（w2m 選項為釋義字串時用）。
function pickOptions(pool, correctLabel, labelFn, n, opts) {
  opts = opts || {};
  const correctWord = opts.correctWord;
  const out = [correctLabel];
  const keys = opts.meaningDedup ? [normMeaningKey(correctLabel)] : null;
  let tries = 0;
  while (out.length < n && tries < 300) {
    tries++;
    const cw = pool[Math.floor(Math.random() * pool.length)];
    if (!cw) continue;
    // 與正解同義的候選一律排除（indemnity/indemnify 這類同義對）。
    if (correctWord && cw.chinese && correctWord.chinese && shareMeaning(cw.chinese, correctWord.chinese)) continue;
    const cand = labelFn(cw);
    if (!cand || out.indexOf(cand) >= 0) continue;
    if (keys) {
      const k = normMeaningKey(cand);
      if (keys.indexOf(k) >= 0) continue; // 正規化後同義的釋義選項也去重
      keys.push(k);
    }
    out.push(cand);
  }
  return shuffle(out);
}
function renderQuiz() {
  const area = document.getElementById('learningArea');
  const word = getWord();
  if (!word) { area.innerHTML = emptyHTML(); return; }
  answered = false;
  const total = studyQueue.length;
  const lvl = word._lvl || currentLevel;
  const pool = (WORD_DATA[lvl] && WORD_DATA[lvl].words) || [];
  const dir = (currentIndex % 2 === 0) ? 'w2m' : 'm2w'; // 交錯：看字選義 / 看義選字

  let promptHTML, correctLabel, options, dirLabel;
  if (dir === 'w2m') {
    dirLabel = '看單字，選出意思';
    correctLabel = meaningOf(word);
    options = pickOptions(pool, correctLabel, meaningOf, 4, { correctWord: word, meaningDedup: true });
    promptHTML = '<span class="quiz-dir-label">' + dirLabel + '</span>' +
      '<div class="flashcard-audio-row">' +
      '<button type="button" class="fc-audio" aria-label="播放單字發音" onclick="playCurrentWord()">🔊</button>' +
      '<span class="quiz-word">' + esc(word.word) + '</span></div>';
  } else {
    dirLabel = '看意思，選出單字';
    correctLabel = word.word;
    options = pickOptions(pool, correctLabel, function (w) { return w.word; }, 4, { correctWord: word });
    promptHTML = '<span class="quiz-dir-label">' + dirLabel + '</span>' +
      '<div class="quiz-clue">' + esc(meaningOf(word)) + '</div>';
  }
  quizState = { dir: dir, correct: correctLabel };

  area.innerHTML =
    '<div class="word-counter">第 ' + (currentIndex + 1) + ' / ' + total + ' 題</div>' +
    '<div class="quiz-container">' +
      '<div class="quiz-prompt">' + promptHTML + '</div>' +
      '<div class="quiz-options" id="quizOptions">' +
        options.map((o, i) => '<button type="button" class="quiz-option" data-label="' + esc(o) + '" onclick="checkAnswer(' + i + ')">' + esc(o) + '</button>').join('') +
      '</div>' +
      '<div class="fc-reveal" id="reveal"></div>' +
    '</div>';

  if (dir === 'w2m') playCurrentWord(); // audio-first
}
function checkAnswer(i) {
  if (answered) return;
  answered = true;
  const buttons = Array.prototype.slice.call(document.querySelectorAll('#quizOptions .quiz-option'));
  const selected = buttons[i] ? buttons[i].getAttribute('data-label') : '';
  const correct = quizState.correct;
  const isCorrect = selected === correct;
  buttons.forEach(b => {
    b.style.pointerEvents = 'none';
    if (b.getAttribute('data-label') === correct) b.classList.add('correct');
  });
  if (!isCorrect && buttons[i]) buttons[i].classList.add('wrong');
  if (isCorrect) knownCount++; else againCount++;
  updateScore();
  recordXp(isCorrect);
  try { if (window.Worddex) Worddex.gradeBinary(currentWordId(), isCorrect); } catch (e) {}
  showReveal(getWord(), isCorrect);
}

// ---- 拼字（字母磚點選，預設純觸控；可切換鍵盤） ----
function spellMode() {
  try { const v = localStorage.getItem(SPELL_MODE_KEY); if (v === 'keyboard' || v === 'tiles') return v; } catch (e) {}
  return 'tiles';
}
function setSpellMode(m) { try { localStorage.setItem(SPELL_MODE_KEY, m); } catch (e) {} }
function distractorLetters(exclude, n) {
  const pool = 'abcdefghijklmnopqrstuvwxyz'.split('');
  const ex = {}; exclude.forEach(c => { ex[c.toLowerCase()] = true; });
  const avail = shuffleInPlace(pool.filter(c => !ex[c]));
  return avail.slice(0, Math.max(0, n));
}
function buildSpell(word) {
  const id = currentWordId();
  let peak = 0;
  try { const c = Worddex.peek(id); peak = c ? (c.peakBox || 0) : 0; } catch (e) {}
  // 依 Leitner 高水位分層：基礎 / 進階（誘答）/ 挖空（高盒）。
  const diff = peak >= 5 ? 'blank' : (peak >= 3 ? 'advanced' : 'basic');
  const chars = word.word.split('');
  const alphaIdx = [];
  chars.forEach((ch, i) => { if (ch !== ' ') alphaIdx.push(i); });

  const blanks = {};
  if (diff === 'blank') {
    const nb = Math.max(1, Math.min(2, alphaIdx.length));
    const p = shuffleInPlace(alphaIdx.slice());
    for (let k = 0; k < nb; k++) blanks[p[k]] = true;
  }
  const cells = [];
  const fillLetters = [];
  chars.forEach((ch, i) => {
    if (ch === ' ') { cells.push({ type: 'gap' }); return; }
    let isFill;
    if (diff === 'blank') isFill = !!blanks[i];
    else isFill = (alphaIdx.length <= 1) ? true : (i !== alphaIdx[0]);   // 基礎/進階：首字母預填為提示；單字母詞強制至少一個可填格，避免沒有可填格而卡住
    if (isFill) { cells.push({ type: 'fill', ch: ch, val: null, state: '' }); fillLetters.push(ch); }
    else cells.push({ type: 'hint', ch: ch });
  });

  let bank = fillLetters.slice();
  if (diff === 'advanced') bank = bank.concat(distractorLetters(fillLetters, 2 + Math.floor(Math.random() * 3)));
  else if (diff === 'blank') bank = bank.concat(distractorLetters(fillLetters, 1 + Math.floor(Math.random() * 2)));
  shuffleInPlace(bank);

  spell = { id: id, word: word, cells: cells, bank: bank.map(ch => ({ ch: ch, used: false })), mode: spellMode() };
}
function renderSpell() {
  const area = document.getElementById('learningArea');
  const word = getWord();
  if (!word) { area.innerHTML = emptyHTML(); return; }
  if (!spell || spell.id !== currentWordId()) buildSpell(word);
  const total = studyQueue.length;

  const toggleLabel = spell.mode === 'tiles' ? '⌨️ 改用鍵盤' : '🔤 改用字母磚';

  // 答案槽
  let slotsHTML = '';
  var letterNo = 0; // 只數字母格（hint/fill），跳過 gap(空格)，aria 才報對「第 N 個字母」
  spell.cells.forEach((c, i) => {
    if (c.type === 'gap') { slotsHTML += '<span class="fc-spell__gap" aria-hidden="true"></span>'; return; }
    letterNo++;
    if (c.type === 'hint') { slotsHTML += '<div class="fc-spell__tile fc-spell__slot hint">' + esc(c.ch) + '</div>'; return; }
    // fill
    const stateCls = c.state ? (' ' + c.state) : '';
    if (spell.mode === 'keyboard') {
      slotsHTML += '<div class="fc-spell__tile fc-spell__slot' + (c.val ? ' filled' : '') + stateCls + '">' +
        '<input type="text" inputmode="text" maxlength="1" data-ci="' + i + '" value="' + (c.val ? esc(c.val) : '') + '"' + (answered ? ' disabled' : '') +
        ' aria-label="第 ' + letterNo + ' 個字母" oninput="spellInput(this)" onkeydown="spellKey(event,this)"></div>';   // 已評分就鎖住輸入（與字母磚/quiz 一致），避免改動已上色方格造成字母與對錯顏色不符
    } else if (c.val && !answered) {
      // 未評分、已填：可點按退回字母到磚池（含 aria 標示位置與已填字母）
      slotsHTML += '<div class="fc-spell__tile fc-spell__slot filled' + stateCls + '"' +
        ' role="button" tabindex="0" aria-label="第 ' + letterNo + ' 個字母，已填 ' + esc(c.val) + '，按 Enter 或空白鍵退回字母" onclick="spellClear(' + i + ')"' +
        ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();spellClear(' + i + ');}">' +
        esc(c.val) + '</div>';
    } else if (c.val) {
      // 已評分、已填：靜態格（spellClear 此時 no-op），不設 role=button/tabindex，aria 只報位置與字母，不再宣稱可退回
      slotsHTML += '<div class="fc-spell__tile fc-spell__slot filled' + stateCls + '" aria-label="第 ' + letterNo + ' 個字母，已填 ' + esc(c.val) + '">' + esc(c.val) + '</div>';
    } else {
      // 空格：spellClear 對空格 no-op，故不設 role=button/tabindex（避免螢幕報讀器報成「無作用的按鈕」），僅標示位置
      slotsHTML += '<div class="fc-spell__tile fc-spell__slot' + stateCls + '" aria-label="第 ' + letterNo + ' 個字母，待填入"></div>';
    }
  });

  // 字母磚池
  let bankHTML = '';
  if (spell.mode === 'tiles') {
    bankHTML = '<div class="fc-spell__bank">' + spell.bank.map((b, bi) =>
      '<div class="fc-spell__tile' + (b.used ? ' used' : '') + '" role="button" tabindex="0"' +
      ' onclick="spellPick(' + bi + ')"' +
      ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();spellPick(' + bi + ');}">' +
      esc(b.ch) + '</div>').join('') + '</div>';
  }

  area.innerHTML =
    '<div class="word-counter">第 ' + (currentIndex + 1) + ' / ' + total + ' 題</div>' +
    '<div class="spell-stage">' +
      '<div class="fc-spell">' +
        '<button type="button" class="fc-spell__toggle" onclick="toggleSpellMode()">' + toggleLabel + '</button>' +
        '<div class="fc-spell__head">' +
          '<div class="fc-card__emoji">' + esc(word.emoji || '📖') + '</div>' +
          (word.chinese ? '<div class="fc-card__cn">' + esc(word.chinese) + '</div>' : '') +
          (getDefinitionText(word) === word.chinese ? '' : '<div class="fc-card__hint">' + esc(getDefinitionText(word)) + '</div>') +
          '<button type="button" class="fc-audio fc-audio--lg" aria-label="播放單字發音" onclick="playCurrentWord()">🔊</button>' +
        '</div>' +
        '<div class="fc-spell__slots">' + slotsHTML + '</div>' +
        bankHTML +
      '</div>' +
      '<div class="fc-reveal" id="reveal"></div>' +
    '</div>';

  if (spellAudioId !== spell.id) { spellAudioId = spell.id; playCurrentWord(); } // audio-first（聽寫）：僅卡片首次出現播一次，別在點磚/清除/切換時重播
  if (spell.mode === 'keyboard' && !answered) {
    const first = document.querySelector('#learningArea input[data-ci]');
    if (first) setTimeout(() => { try { first.focus(); } catch (e) {} }, 0);
  }
}
function toggleSpellMode() {
  if (answered) return;   // 已作答的卡片不可再切換輸入法重建（否則會重設 answered 並重複計分/SRS/XP）
  const next = (spell && spell.mode === 'tiles') ? 'keyboard' : 'tiles';
  setSpellMode(next);
  buildSpell(getWord());   // 切換時重來（清空重填）
  answered = false;
  renderSpell();
}
function firstEmptyFill() {
  for (let i = 0; i < spell.cells.length; i++) { const c = spell.cells[i]; if (c.type === 'fill' && !c.val) return i; }
  return -1;
}
function allFilled() {
  return spell.cells.every(c => c.type !== 'fill' || !!c.val);
}
function spellPick(bi) {
  if (answered || !spell) return;
  const b = spell.bank[bi];
  if (!b || b.used) return;
  const ci = firstEmptyFill();
  if (ci < 0) return;
  spell.cells[ci].val = b.ch;
  b.used = true;
  renderSpell();
  if (allFilled()) checkSpell();
}
function spellClear(ci) {
  if (answered || !spell) return;
  const c = spell.cells[ci];
  if (!c || c.type !== 'fill' || !c.val) return;
  // 退回字母到磚池（釋放第一個相同字母的已用磚）。
  for (let i = 0; i < spell.bank.length; i++) {
    if (spell.bank[i].used && spell.bank[i].ch.toLowerCase() === String(c.val).toLowerCase()) { spell.bank[i].used = false; break; }
  }
  c.val = null;
  renderSpell();
}
function spellInput(input) {
  if (answered || !spell) return;
  const ci = parseInt(input.getAttribute('data-ci'), 10);
  const v = input.value;
  if (spell.cells[ci]) spell.cells[ci].val = v || null;
  if (v) {
    // 自動前進到下一個 fill 輸入格
    const inputs = Array.prototype.slice.call(document.querySelectorAll('#learningArea input[data-ci]'));
    const pos = inputs.indexOf(input);
    for (let k = pos + 1; k < inputs.length; k++) { try { inputs[k].focus(); } catch (e) {} break; }
  }
  if (allFilled()) checkSpell();
}
function spellKey(event, input) {
  if (event.key === 'Backspace' && !input.value) {
    const inputs = Array.prototype.slice.call(document.querySelectorAll('#learningArea input[data-ci]'));
    const pos = inputs.indexOf(input);
    if (pos > 0) { try { inputs[pos - 1].focus(); } catch (e) {} event.preventDefault(); }
  } else if (event.key === 'Enter') {
    event.preventDefault();
    if (allFilled()) checkSpell();
  }
}
function checkSpell() {
  if (answered || !spell) return;
  // 蒐集鍵盤模式當前輸入值
  if (spell.mode === 'keyboard') {
    document.querySelectorAll('#learningArea input[data-ci]').forEach(inp => {
      const ci = parseInt(inp.getAttribute('data-ci'), 10);
      if (spell.cells[ci]) spell.cells[ci].val = inp.value || null;
    });
  }
  if (!allFilled()) return;
  let correct = true;
  spell.cells.forEach(c => {
    if (c.type !== 'fill') return;
    const ok = String(c.val || '').toLowerCase() === String(c.ch).toLowerCase();
    c.state = ok ? 'ok' : 'no';
    if (!ok) correct = false;
  });
  answered = true;
  if (correct) knownCount++; else againCount++;
  updateScore();
  recordXp(correct);
  try { if (window.Worddex) Worddex.gradeBinary(currentWordId(), correct); } catch (e) {}
  renderSpell();               // 顯示綠對紅錯 + shake（reduced-motion 已關閉）
  showReveal(getWord(), correct);
  if (correct) { try { if (window.Game && Game.showToast) Game.showToast('拼對了，太棒了！', 'success'); } catch (e) {} }
}

// ---- 揭示面板（答錯不自動跳題，自控「繼續」） ----
function showReveal(word, isCorrect) {
  const el = document.getElementById('reveal');
  if (!el || !word) return;
  const msg = isCorrect ? '答對了，太棒了！' : '沒關係，看一下正確答案，再練一次就會記住了 💪';
  el.className = 'fc-reveal show ' + (isCorrect ? 'is-ok' : 'is-no');
  el.innerHTML =
    '<span class="fc-reveal__word">' + esc(word.word) + '</span>' +
    (word.chinese ? '<span class="fc-reveal__zh">' + esc(word.chinese) + '</span>' : '') +
    (word.sentence ? '<span class="fc-reveal__sent">' + word.sentence + '</span>' : '') +
    '<span class="fc-reveal__msg">' + msg + '</span>' +
    '<button type="button" class="fc-reveal__next" onclick="nextWord()">繼續 →</button>';
  const btn = el.querySelector('.fc-reveal__next');
  if (btn) setTimeout(() => { try { btn.focus(); } catch (e) {} }, 0);
}

// ==================== START ====================
init();
