// @ts-nocheck — 機械式 legacy JS→TS 遷移：verbatim 轉檔、行為等價；型別檢查延後
/* vocabulary_app__1.ts ← vocabulary_app.html 的第 1 段連續 inline（flashcard：WORD_DATA/SRS/主程式分段，順序關鍵）。verbatim、全域 scope、無 IIFE。 */
// ==================== SRS ENGINE（改接共用 window.SRS 排程核心） ====================
// 本頁已是 SR 主路徑：改用共用 assets/srs_engine.js（混合 Leitner 盒 × SM-2 ease），
// 儲存仍綁定本頁自持的扁平 key 'vocab_srs'（word→card map），演算法共用、絕不跨頁污染。
// 對外維持與舊 SRSEngine 相同的公開 API（getCard/isDue/isNew/isLearned/review/
// startLearning/getStats/getStudyQueue），因此既有的 wireEnglishXp 與 Worddex 兩個
// 「包裹 SRSEngine.prototype.review」的側效層完全不需改動即持續生效。
// review(word, quality) 仍是唯一逐答收斂點：quality 0→again、2→good、3→easy；
// 舊卡遷移由 SRS.ensureCard lazy 補欄位（絕不清空既有 vocab_srs）。移除的 hard(1)
// 檔位若仍被舊呼叫傳入，安全對映為 good（不再新增此按鈕，但不破壞既有卡）。
class SRSEngine {
  constructor() {
    this.store = window.SRS.createStore('vocab_srs', { flat: true });
    this.data = this.store.cards();
  }

  load() { this.store.reload(); this.data = this.store.cards(); return this.data; }
  save() { this.store.save(); }

  getCard(word) { return this.store.getCard(word); }

  isDue(word) {
    const card = this.store.peek(word); // 唯讀衍生：不為每個字建卡/落地（避免 vocab_srs 膨脹）
    if (card.status === 'new') return false;
    if (!card.dueDate) return true;
    return card.dueDate <= window.SRS.today();
  }

  isNew(word) { return this.store.peek(word).status === 'new'; }

  isLearned(word) {
    const card = this.store.peek(word); // 唯讀衍生：用 peek，不落地新卡
    return card.status === 'review' && ((card.interval || 0) >= 1 || (card.scheduleBox || 0) >= 1);
  }

  // quality: 0=again, 1=hard(legacy→good), 2=good, 3=easy
  review(word, quality) {
    const grade = quality === 0 ? 'again' : (quality === 3 ? 'easy' : 'good');
    return this.store.rate(word, grade);
  }

  startLearning(word) {
    const card = this.store.getCard(word);
    if (card.status === 'new') {
      card.status = 'learning';
      card.dueDate = window.SRS.today();
      this.store.save();
    }
    return card;
  }

  getStats(tabWords) {
    let due = 0, newCount = 0, learned = 0;
    const t = window.SRS.today();
    tabWords.forEach(w => {
      // peek：唯讀分類，不為整級每個字建卡（避免 vocab_srs 無謂膨脹）
      const card = this.store.peek(w.word);
      if (card.status === 'new') {
        newCount++;
      } else if (card.status === 'review' && ((card.interval || 0) >= 1 || (card.scheduleBox || 0) >= 1)) {
        learned++;
        if (!card.dueDate || card.dueDate <= t) due++;
      } else {
        if (!card.dueDate || card.dueDate <= t) due++;
      }
    });
    return { due, new: newCount, learned };
  }

  getStudyQueue(tabWords, dailyNew) {
    // 到期複習優先 ＋ 每日新卡上限 ＋ 新舊交錯（新卡不全塞前段），id 一律用裸 word.word。
    return this.store.buildSession(tabWords, { dailyNew: dailyNew, idOf: function (w) { return w.word; } });
  }
}

// ==================== APP STATE ====================
let currentTab = 'competition_mid';
let currentMode = 'flashcard';
let currentWordIndex = 0;
let studyQueue = [];
let isFlipped = false;
let matchState = { selected: null, matched: [] };
let srs = new SRSEngine();

// ==================== SETTINGS ====================
function getSettings() {
  try {
    const s = localStorage.getItem('vocab_settings');
    return s ? JSON.parse(s) : { dailyNew: 10, speed: 1.0, darkMode: false };
  } catch(e) {
    return { dailyNew: 10, speed: 1.0, darkMode: false };
  }
}

function saveSettings(settings) {
  localStorage.setItem('vocab_settings', JSON.stringify(settings));
}

// ==================== STATS ====================
function getStudyStats() {
  try {
    const s = localStorage.getItem('vocab_stats');
    return s ? JSON.parse(s) : { streak: 0, lastStudy: null, history: {} };
  } catch(e) {
    return { streak: 0, lastStudy: null, history: {} };
  }
}

function recordStudy() {
  const stats = getStudyStats();
  // 用本地日期（與 SRS 排程、game_core streak 一致），避免 UTC 造成 UTC+8 清晨作答歸錯天。
  const today = (window.SRS && SRS.today) ? SRS.today() : new Date().toISOString().split('T')[0];

  if (!stats.history[today]) {
    stats.history[today] = 0;
  }
  stats.history[today]++;

  // Update streak
  const yesterday = (window.SRS && SRS.addDays) ? SRS.addDays(today, -1) : new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (stats.lastStudy === yesterday || stats.lastStudy === today) {
    if (stats.lastStudy !== today) {
      stats.streak++;
    }
  } else if (stats.lastStudy !== today) {
    stats.streak = 1;
  }
  stats.lastStudy = today;

  localStorage.setItem('vocab_stats', JSON.stringify(stats));
}

// ==================== PRONUNCIATION ====================
// 優先播放本地「童音 mp3」(與 cefr/coca/toeic 一致的 en-US-AnaNeural 童音);
// 找不到對應檔(未涵蓋的字)才退回瀏覽器/Google TTS。audioWord 用於組檔名(例句也要用「單字」當檔名),預設等於 text(單字發音時 text 即單字)。
function speak(text, isWord = true, audioWord) {
  const settings = getSettings();
  const w = String(audioWord !== undefined ? audioWord : text).replace(/ /g, '_').replace(/\//g, '_');
  const src = 'audio/' + (isWord ? 'word' : 'sent') + '_' + currentTab + '_' + w + '.mp3';
  let done = false;
  const fallback = () => { if (done) return; done = true; ttsSpeak(text, settings); };
  try {
    const a = new Audio(src);
    a.playbackRate = settings.speed;
    a.addEventListener('error', fallback, { once: true });
    a.play().then(() => { done = true; }).catch(fallback);
  } catch (e) { fallback(); }
}

// 本地童音 mp3 缺檔時的後備：僅用瀏覽器內建語音合成（離線可用、無外部網路依賴）。
// 刻意不呼叫任何外部 TTS 服務（隱私與離線考量，符合本站「無外部網路依賴」原則）。
function ttsSpeak(text, settings) {
  settings = settings || getSettings();
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = settings.speed;
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Samantha')) ||
                         voices.find(v => v.lang.startsWith('en-US')) ||
                         voices.find(v => v.lang.startsWith('en'));
    if (englishVoice) utterance.voice = englishVoice;
    window.speechSynthesis.speak(utterance);
  } else {
    showToast('這個裝置暫時無法發音，可以看單字練習喔 😊');
  }
}

// ==================== CONFETTI ====================
function showConfetti() {
  const container = document.getElementById('confettiContainer');
  // 慶祝彩帶刻意用多彩硬碼（彩帶本就是多色紙屑）：純裝飾、不編碼狀態、reduced-motion 下不播放；不套「狀態色禁彩虹」規則。
  const colors = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'];

  for (let i = 0; i < 30; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 0.5 + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    piece.style.width = (Math.random() * 8 + 6) + 'px';
    piece.style.height = (Math.random() * 8 + 6) + 'px';
    container.appendChild(piece);
  }

  setTimeout(() => { container.innerHTML = ''; }, 2500);
}

// ==================== UI RENDERING ====================
function initTabs() {
  const tabBar = document.getElementById('tabBar');
  const tabs = Object.entries(WORD_DATA);
  tabBar.innerHTML = tabs.map(([key, data]) =>
    `<div class="tab-item ${key === currentTab ? 'active' : ''}" role="button" tabindex="0" aria-pressed="${key === currentTab}" style="--tab-color: ${data.color}" data-tab="${key}">${data.name}</div>`
  ).join('');

  tabBar.querySelectorAll('.tab-item').forEach(el => {
    el.addEventListener('click', () => {
      currentTab = el.dataset.tab;
      currentWordIndex = 0;
      isFlipped = false;   // 換主題要回到卡片正面（否則新主題第一張直接顯示背面答案，且略過 audio-first 自動發音）
      initTabs();
      updateStats();
      refreshQueue();
      renderMode();
    });
  });
}

function updateStats() {
  const words = WORD_DATA[currentTab].words;
  const stats = srs.getStats(words);
  document.getElementById('dueCount').textContent = stats.due;
  document.getElementById('newCount').textContent = stats.new;
  document.getElementById('learnedCount').textContent = stats.learned;

  // Set tab color
  document.documentElement.style.setProperty('--tab-color', WORD_DATA[currentTab].color);
}

function refreshQueue() {
  const settings = getSettings();
  const words = WORD_DATA[currentTab].words;
  studyQueue = srs.getStudyQueue(words, settings.dailyNew);
  if (studyQueue.length === 0) {
    studyQueue = [...words];
  }
  currentWordIndex = 0;
}

function getCurrentWord() {
  if (studyQueue.length === 0) return WORD_DATA[currentTab].words[0];
  return studyQueue[currentWordIndex % studyQueue.length];
}

// 作答鎖：每張卡/每種模式只計分一次。answered 於 renderMode()（換卡、換模式、換主題都會經過）重設；
// hintUsed 記錄本題是否用過提示，用過就不給「記住了」的正向 SRS 學分（避免靠提示洗分、破壞間隔排程）。
let answered = false;
let hintUsed = false;

function nextWord() {
  currentWordIndex++;
  if (currentWordIndex >= studyQueue.length) {
    currentWordIndex = 0;
    refreshQueue();
  }
  isFlipped = false;
  renderMode();
}

// ==================== MODE RENDERERS ====================
function renderMode() {
  answered = false; hintUsed = false; isFlipped = false;   // 新的一題/一種模式開始，解除作答鎖與提示旗標，並回到卡片正面（flipCard 只切 CSS class、不經此；凡 renderMode 都是全新卡片視圖，須從正面開始，才不會翻面殘留＋略過 audio-first）
  const area = document.getElementById('learningArea');
  document.getElementById('dashboard').classList.remove('show');

  const isCloze = WORD_DATA[currentTab].isCloze;
  switch(currentMode) {
    case 'flashcard': isCloze ? renderClozeFront(area) : renderFlashcard(area); break;
    case 'quiz': isCloze ? renderClozeQuiz(area) : renderQuiz(area); break;
    case 'spelling': isCloze ? renderClozeSpelling(area) : renderSpelling(area); break;
    case 'listening': isCloze ? renderClozeListening(area) : renderListening(area); break;
    case 'matching': renderMatching(area); break;
  }
}

function renderFlashcard(area) {
  const word = getCurrentWord();
  if (!word) { area.innerHTML = '<div class="empty-state"><div class="empty-state-emoji">🎉</div><p>太棒了，這個主題今天都複習完囉！要不要換一個主題，或明天再來呢？😊</p></div>'; return; }

  // 字根分段配色改走共用可及性 -ink/tint token 對（亮/暗兩主題皆 ≥4.6:1），
  // 取代原本未主題化的生 hex（暗色只有 ~2.5:1）。
  const rootInk = ['--c-primary-ink', '--c-english-ink', '--c-math-ink', '--c-chinese-ink', '--c-social-ink', '--c-finance-ink'];
  const rootTint = ['--tint-primary', '--tint-english', '--tint-math', '--tint-chinese', '--tint-social', '--tint-finance'];
  // 單音節字（字根切分只有一段、且就等於單字本身，如 boy / egg）不顯示發音小卡，
  // 否則會出現「boy 下面又一張 boy」看起來像重複；多音節才顯示切分輔助。
  const isSingleSyllable = word.roots.length === 1 &&
    String(word.roots[0]).toLowerCase().replace(/\s/g,'') === String(word.word).toLowerCase().replace(/\s/g,'');
  const rootsHtml = isSingleSyllable ? '' : word.roots.map((r, i) => {
    const k = i % rootInk.length;
    return `<span class="root-part" style="background:var(${rootTint[k]});color:var(${rootInk[k]})">${r}</span>`;
  }).join('');

  area.innerHTML = `
    <div class="word-counter">${currentWordIndex + 1} / ${studyQueue.length}</div>
    <div class="flashcard-container">
      <div class="flashcard ${isFlipped ? 'flipped' : ''}" role="button" tabindex="0" aria-label="單字卡，按 Enter 或空白鍵翻面" onclick="flipCard()" onkeydown="if((event.key==='Enter'||event.key===' ')&&event.target===this){event.preventDefault();flipCard();}">
        <div class="flashcard-face">
          <div class="flashcard-headline">
            <div class="flashcard-emoji">${word.emoji}</div>
            <div class="flashcard-word">${word.word}</div>
          </div>
          <div class="flashcard-roots">${rootsHtml}</div>
          <button class="fc-audio fc-audio--lg" aria-label="播放單字發音" onclick="event.stopPropagation(); speak('${word.word.replace(/'/g, "\\'")}')">🔊</button>
          <div class="tap-hint">點擊翻轉</div>
        </div>
        <div class="flashcard-face flashcard-back">
          <div class="flashcard-body">
            ${word.definition ? `<div class="flashcard-definition">${word.definition}</div>` : ''}
            <div class="flashcard-sentence">${word.sentence}</div>
            ${word.tip ? `<div class="flashcard-tip">💡 ${word.tip}</div>` : ''}
            ${word.chinese ? `<div class="chinese-toggle">
              <button class="chinese-btn" onclick="event.stopPropagation(); this.nextElementSibling.style.display='block'; this.style.display='none';">顯示中文</button>
              <div class="flashcard-chinese" style="display:none">${word.chinese}</div>
            </div>` : ''}
          </div>
          <div class="sound-row">
            <button class="fc-audio fc-audio--lg" aria-label="播放單字發音" onclick="event.stopPropagation(); speak('${word.word.replace(/'/g, "\\'")}')">🔊</button>
            <button class="fc-audio fc-audio--sm" aria-label="播放例句發音" onclick="event.stopPropagation(); speak('${jsAttr(word.sentence.replace(/<[^>]*>/g, ''))}', false, '${jsAttr(word.word)}')">📢</button>
          </div>
        </div>
      </div>
    </div>
    <div class="fc-rate">
      <button class="fc-rate__btn again" onclick="reviewWord(0)">😅 還不熟<span class="fc-rate__btn__label">再一起看</span></button>
      <button class="fc-rate__btn good" onclick="reviewWord(2)">🙂 想起來了<span class="fc-rate__btn__label">記住了</span></button>
      <button class="fc-rate__btn easy" onclick="reviewWord(3)">😎 很輕鬆<span class="fc-rate__btn__label">太簡單</span></button>
    </div>
  `;

  // Audio-first：正面(單字面)渲染後自動播放一次單字發音，與 cefr/coca/toeic 閃卡一致。
  // 300ms 後的回呼會「再確認一次」isFlipped：若使用者在這段空檔先翻到背面就不播（flipCard 只切 CSS
  // class、不重新渲染，無法靠 render 取消此 timer，故須在回呼內再判斷），避免在背面亂播。
  // speak() 內含 try/catch 與 play().catch(fallback)，autoplay 被瀏覽器擋不會丟錯。
  if (!isFlipped) setTimeout(() => { if (!isFlipped) speak(word.word); }, 300);
}

function flipCard() {
  isFlipped = !isFlipped;
  const card = document.querySelector('.flashcard');
  if (card) card.classList.toggle('flipped');

  const word = getCurrentWord();
  if (word && isFlipped) {
    srs.startLearning(word.word);
  }
}

function reviewWord(quality) {
  if (answered) return;   // 防連點/雙擊在 setTimeout(nextWord) 空窗內重複計分、跳字
  const word = getCurrentWord();
  if (word) {
    answered = true;
    const card = srs.review(word.word, quality);
    recordStudy();
    if (quality >= 2) showConfetti();
    const msgs = { 0: '沒關係，待會再一起看一次 👋', 2: '記住了！過幾天再複習 ✅', 3: '太厲害了，下次更久才會再見 🚀' };
    showToast(msgs[quality] || '繼續加油！');
    updateStats();
    setTimeout(nextWord, 600);
  }
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);padding:10px 20px;background:rgba(0,0,0,0.8);color:white;border-radius:20px;font-size:0.9rem;font-weight:600;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 1500);
}

// ==================== 揭示面板（答錯自控繼續，取代自動跳題） ====================
// 兒童友善、無懲罰：顯示正解＋中文＋例句＋發音，由孩子自己按「繼續」才進下一題。
function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function jsAttr(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// 顯示揭示面板；isOk=true 為答對（正向鼓勵），false 為答錯（顯示正解）。
function showReveal(word, isOk, msg) {
  const panel = document.getElementById('revealPanel');
  if (!panel) return;
  const zh = word.chinese || word.definition || '';
  const audio = '<button class="fc-audio fc-audio--sm" aria-label="播放單字發音" onclick="speak(\'' +
    jsAttr(word.word) + '\')">🔊</button>';
  panel.className = 'fc-reveal show ' + (isOk ? 'is-ok' : 'is-no');
  panel.innerHTML =
    '<span class="fc-reveal__word">' + escAttr(word.word) + '</span> ' + audio +
    (zh ? '<span class="fc-reveal__zh">' + escAttr(zh) + '</span>' : '') +
    (word.sentence ? '<span class="fc-reveal__sent">' + word.sentence + '</span>' : '') +
    '<span class="fc-reveal__msg">' + msg + '</span>' +
    '<button class="fc-reveal__next" onclick="continueNext()">繼續 →</button>';
  const btn = panel.querySelector('.fc-reveal__next');
  if (btn) { try { btn.focus(); } catch (e) {} }
}
function continueNext() { nextWord(); }

// 同義群組守衛（quiz 與 matching 共用）：中文釋義字面不重疊、但實為同義的字（如
// dad 爸爸／father 父親、mom 媽媽／mother 母親）shareMeaning 抓不到，需明列群組，
// 避免同一題／同一回合並列造成第二個也成立的正解。
const SYNONYM_GROUPS = [["dad", "father"], ["mom", "mother"]];
// 判斷兩個字是否落在同一同義群組（同群者不可同題／同回合並列）
const inSameSynGroup = (a, b) => SYNONYM_GROUPS.some(g => g.includes(a) && g.includes(b));

function renderQuiz(area) {
  const word = getCurrentWord();
  if (!word) { area.innerHTML = '<div class="empty-state"><div class="empty-state-emoji">🎉</div><p>太棒了，這個主題今天都複習完囉！要不要換一個主題，或明天再來呢？😊</p></div>'; return; }

  const allWords = WORD_DATA[currentTab].words;
  const getMeaning = (w) => w.chinese || w.definition || w.word;
  // 近義守衛（比照 practice.html）：把中文釋義去括號後以 / 、 ， ; ／ 切成語意成分，
  // 任一成分重疊即視為近義（如 speak「說(語言)」vs say「說」、essay/article「文章」、
  // fiction/novel「小說」、paw/claw「爪子」），不可在同一題互當誘答，避免第二個也成立的正解。
  const meaningParts = (ch) => String(ch || '').replace(/[（(][^）)]*[）)]/g, '').split(/[\/、，,;；／]/).map(s => s.trim()).filter(Boolean);
  const shareMeaning = (a, b) => { const B = new Set(meaningParts(b)); return meaningParts(a).some(p => B.has(p)); };
  // 雙向交錯（③）：偶數題「看字選義」、奇數題「看義選字」，避免同方向連續，
  // 讓「拼字→字義」與「字義→拼字」兩種提取都被練到。
  const wordToMeaning = (currentWordIndex % 2 === 0);

  // 同義群組守衛（重用模組層級 SYNONYM_GROUPS）：中文釋義字面不重疊、但實為同義的字（如
  // dad 爸爸／father 父親、mom 媽媽／mother 母親）shareMeaning 抓不到，需明列群組，
  // 避免「dad 是什麼意思？」同時列出爸爸與父親、或反向 dad/father 並列造成第二個正解。
  const synGroup = SYNONYM_GROUPS.find(g => g.includes(word.word));
  const isNear = (cand) => (synGroup && synGroup.includes(cand.word)) || shareMeaning(getMeaning(cand), getMeaning(word));

  let questionHtml, correctAnswer, options;
  if (wordToMeaning) {
    correctAnswer = getMeaning(word);
    options = [correctAnswer];
    let attempts = 0;
    while (options.length < 4 && attempts < 100) {
      const cand = allWords[Math.floor(Math.random() * allWords.length)];
      const m = getMeaning(cand);
      if (m && cand.word !== word.word && !options.includes(m) && !isNear(cand)) options.push(m); // 釋義成分重疊或同義群組者不當誘答
      attempts++;
    }
    questionHtml = `
        <div class="quiz-emoji">${word.emoji}</div>
        <div class="quiz-word">${word.word}</div>
        <button class="fc-audio fc-audio--lg" aria-label="播放單字發音" onclick="speak('${word.word.replace(/'/g, "\\'")}')">🔊</button>
        <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:6px;">這個字是什麼意思？</div>`;
  } else {
    correctAnswer = word.word;
    options = [correctAnswer];
    // 以「釋義」去重（而非英文字串）：確保四個英文選項無任一與提示中文
    // getMeaning(word) 同義；否則同 tab 兩字釋義相同時（如 mad/angry=生氣的、
    // bin/dustbin=垃圾桶），誘答其實也是正解，卻被判錯。
    const usedMeanings = new Set([getMeaning(word)]);
    let attempts = 0;
    while (options.length < 4 && attempts < 100) {
      const cand = allWords[Math.floor(Math.random() * allWords.length)];
      const cm = getMeaning(cand);
      if (cand.word && cand.word !== word.word && !options.includes(cand.word) && cm && !usedMeanings.has(cm) && !isNear(cand)) { // 釋義成分重疊或同義群組者不當誘答
        options.push(cand.word);
        usedMeanings.add(cm);
      }
      attempts++;
    }
    questionHtml = `
        <div class="quiz-emoji">${word.emoji}</div>
        <div class="quiz-word" style="font-size:var(--fs-h2)">${getMeaning(word)}</div>
        <div style="font-size:0.85rem;color:var(--text-secondary);margin-top:6px;">是哪一個英文單字？</div>`;
  }
  options.sort(() => Math.random() - 0.5);

  area.innerHTML = `
    <div class="word-counter">${currentWordIndex + 1} / ${studyQueue.length}</div>
    <div class="quiz-container">
      <div class="quiz-question">
        ${questionHtml}
      </div>
      <div class="quiz-options">
        ${options.map(opt => `<div class="quiz-option" role="button" tabindex="0" onclick="checkQuizAnswer(this, '${jsAttr(opt)}', '${jsAttr(correctAnswer)}')">${escAttr(opt)}</div>`).join('')}
      </div>
      <div class="fc-reveal" id="revealPanel"></div>
    </div>
  `;
}

function checkQuizAnswer(el, selected, correct) {
  if (answered) return;   // pointer-events:none 擋不住全域 Enter 委派觸發的 .click()，用作答鎖才穩
  answered = true;
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(opt => {
    opt.style.pointerEvents = 'none';
    if (opt.textContent === correct) opt.classList.add('correct');
  });
  const word = getCurrentWord();

  if (selected === correct) {
    el.classList.add('correct');
    showConfetti();
    srs.review(word.word, 2);
    recordStudy();
    updateStats();
    setTimeout(nextWord, 900);
  } else {
    el.classList.add('wrong');
    srs.review(word.word, 0);
    recordStudy();
    updateStats();
    // 答錯不自動跳題：顯示正解＋鼓勵，由孩子自己按「繼續」
    showReveal(word, false, '差一點點！正確答案已經幫你標出來囉，記起來下次就會 😊');
  }
}

// ---- 拼字模式偏好：字母磚點選（預設，純觸控）／鍵盤打字，記在 localStorage ----
let spellState = null;
function getSpellMode() { try { return localStorage.getItem('vocab_spell_mode') || 'tiles'; } catch (e) { return 'tiles'; } }
function setSpellMode(m) { try { localStorage.setItem('vocab_spell_mode', m); } catch (e) {} }
function toggleSpellMode() { if (answered || (spellState && spellState.locked)) return; setSpellMode(getSpellMode() === 'tiles' ? 'keyboard' : 'tiles'); renderMode(); }   // 已作答的字不可切輸入法重建（renderMode 會解鎖重開計分）

function renderSpelling(area) {
  const word = getCurrentWord();
  if (!word) { area.innerHTML = '<div class="empty-state"><div class="empty-state-emoji">🎉</div><p>太棒了，這個主題今天都複習完囉！要不要換一個主題，或明天再來呢？😊</p></div>'; return; }

  const mode = getSpellMode();
  const hint = word.chinese || word.definition || '';
  const audioBtn = '<button class="fc-audio fc-audio--lg" aria-label="播放單字發音" onclick="speak(\'' + jsAttr(word.word) + '\')">🔊</button>';
  const toggleBtn = '<button class="fc-spell__toggle" onclick="toggleSpellMode()">' +
    (mode === 'tiles' ? '⌨️ 改用鍵盤' : '🔤 改用字母磚') + '</button>';
  const head = '<div class="fc-spell__head"><div class="flashcard-emoji">' + escAttr(word.emoji || '') +
    '</div><div class="spelling-hint">' + escAttr(hint) + '</div>' + audioBtn + '</div>';

  if (mode === 'keyboard') {
    // 鍵盤打字模式：逐格上色 + 首字母提示（沿用既有 checkSpelling 判分）
    const letters = word.word.split('');
    const boxes = letters.map((ch, i) => ch === ' '
      ? '<span class="fc-spell__gap"></span>'
      : '<div class="letter-box" id="lb' + i + '"></div>').join('');
    area.innerHTML =
      '<div class="word-counter">' + (currentWordIndex + 1) + ' / ' + studyQueue.length + '</div>' +
      '<div class="spelling-container"><div class="fc-spell">' + toggleBtn + head +
      '<div class="spelling-boxes">' + boxes + '</div>' +
      '<input type="text" class="spelling-input" id="spellingInput" placeholder="輸入單字..." autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" onkeyup="checkSpelling(event)">' +
      '<div><button class="hint-btn" onclick="showSpellingHint()">💡 提示</button></div>' +
      '<div class="fc-reveal" id="revealPanel"></div></div></div>';
    setTimeout(() => { const el = document.getElementById('spellingInput'); if (el) el.focus(); }, 100);
    return;
  }

  // 字母磚點選模式（預設，純觸控）：點磚→填下一空槽並淡出；點已填槽→退回磚池（等同退格）。
  const chars = word.word.split('');
  let slotsHtml = '';
  chars.forEach((ch, i) => {
    if (ch === ' ') { slotsHtml += '<span class="fc-spell__gap"></span>'; }
    else { slotsHtml += '<button class="fc-spell__tile fc-spell__slot" id="ss' + i + '" onclick="spellTapSlot(' + i + ')" aria-label="第 ' + (i + 1) + ' 格，尚未填入"></button>'; }
  });
  const bankChars = chars.filter(c => c !== ' ').sort(() => Math.random() - 0.5);
  let bankHtml = '';
  bankChars.forEach((ch, k) => { bankHtml += '<button class="fc-spell__tile" id="sb' + k + '" onclick="spellTapTile(' + k + ')" aria-label="字母 ' + escAttr(ch) + '">' + escAttr(ch) + '</button>'; });

  spellState = { word: word, chars: chars, slots: {}, bank: bankChars.map(c => ({ ch: c, used: false })), locked: false };
  chars.forEach((ch, i) => { if (ch !== ' ') spellState.slots[i] = { ch: null, bankIdx: null }; });

  area.innerHTML =
    '<div class="word-counter">' + (currentWordIndex + 1) + ' / ' + studyQueue.length + '</div>' +
    '<div class="spelling-container"><div class="fc-spell">' + toggleBtn + head +
    '<div class="fc-spell__slots" id="spellSlots">' + slotsHtml + '</div>' +
    '<div class="fc-spell__bank" id="spellBank">' + bankHtml + '</div>' +
    '<div class="fc-reveal" id="revealPanel"></div></div></div>';
}

function spellAllFilled() {
  const st = spellState; if (!st) return false;
  for (let i = 0; i < st.chars.length; i++) {
    if (st.chars[i] !== ' ' && st.slots[i].ch === null) return false;
  }
  return true;
}

function spellTapTile(k) {
  const st = spellState; if (!st || st.locked) return;
  const tile = st.bank[k]; if (!tile || tile.used) return;
  let target = -1;
  for (let i = 0; i < st.chars.length; i++) {
    if (st.chars[i] !== ' ' && st.slots[i].ch === null) { target = i; break; }
  }
  if (target < 0) return;
  st.slots[target].ch = tile.ch; st.slots[target].bankIdx = k; tile.used = true;
  const slotEl = document.getElementById('ss' + target);
  if (slotEl) { slotEl.textContent = tile.ch; slotEl.classList.add('filled'); slotEl.setAttribute('aria-label', '第 ' + (target + 1) + ' 格，已填入 ' + tile.ch + '，點一下可退回字母'); }
  const tileEl = document.getElementById('sb' + k);
  if (tileEl) tileEl.classList.add('used');
  if (spellAllFilled()) spellCheckTiles();
}

function spellTapSlot(i) {
  const st = spellState; if (!st || st.locked) return;
  const slot = st.slots[i]; if (!slot || slot.ch === null) return;
  const k = slot.bankIdx;
  if (k != null && st.bank[k]) {
    st.bank[k].used = false;
    const te = document.getElementById('sb' + k);
    if (te) te.classList.remove('used');
  }
  slot.ch = null; slot.bankIdx = null;
  const se = document.getElementById('ss' + i);
  if (se) { se.textContent = ''; se.classList.remove('filled', 'ok', 'no'); se.setAttribute('aria-label', '第 ' + (i + 1) + ' 格，尚未填入'); }
}

function spellCheckTiles() {
  const st = spellState; if (!st) return;
  const word = st.word;
  let attempt = '';
  st.chars.forEach((ch, i) => { attempt += (ch === ' ') ? ' ' : (st.slots[i].ch || ''); });
  const correct = attempt.toLowerCase() === word.word.toLowerCase();
  st.locked = true; answered = true;   // 鎖住本題（含 answered，讓 toggleSpellMode 的守衛涵蓋 tiles→keyboard 方向）
  // 綠對紅錯（不只靠顏色：.ok/.no class 之外，正解也在揭示面板呈現）
  st.chars.forEach((ch, i) => {
    if (ch === ' ') return;
    const se = document.getElementById('ss' + i);
    if (!se) return;
    if ((st.slots[i].ch || '').toLowerCase() === ch.toLowerCase()) se.classList.add('ok');
    else se.classList.add('no');
  });
  if (correct) {
    showConfetti();
    srs.review(word.word, 2);
    recordStudy();
    updateStats();
    setTimeout(nextWord, 900);
  } else {
    srs.review(word.word, 0);
    recordStudy();
    updateStats();
    showReveal(word, false, '綠色的字母是對的！正確拼法幫你放在上面了，下次一定行 💪');
  }
}

function checkSpelling(e) {
  if (answered) return;   // 已計分就別再因重複 keyup/Enter 重跑計分與跳字
  const word = getCurrentWord();
  const input = document.getElementById('spellingInput').value.toLowerCase();
  const target = word.word.toLowerCase();
  const letters = target.split('');

  // 空白字元不必由使用者輸入（多字詞如 ice cream 的空格位置是 .fc-spell__gap，沒有方格）；
  // 比對與完成判定一律先去掉空白，並把「非空白字母」依序對應到各方格。
  const targetNS = target.replace(/\s+/g, '');
  const inputNS = input.replace(/\s+/g, '');
  const complete = inputNS.length === targetNS.length;
  let j = 0; // 已填的非空白字母數 = inputNS 的索引（空白位置略過、不佔方格）
  letters.forEach((letter, i) => {
    const box = document.getElementById('lb' + i);
    if (!box) return; // 空白字元位置為 .fc-spell__gap，沒有對應方格
    if (j < inputNS.length) {
      box.textContent = inputNS[j];
      box.classList.add('filled');
      // 打字途中維持中性色，避免半途一片紅色造成挫折；打完才判對錯上色
      if (complete) {
        if (inputNS[j] === letter) {
          box.classList.remove('wrong');
          box.classList.add('correct');
        } else {
          box.classList.remove('correct');
          box.classList.add('wrong');
        }
      } else {
        box.classList.remove('correct', 'wrong');
      }
    } else {
      box.textContent = '';
      box.classList.remove('filled', 'correct', 'wrong');
    }
    j++;
  });

  if (inputNS === targetNS) {
    answered = true;
    // 靠提示把整個字補滿不算真的記住：不給「記住了」(quality 2) 的正向學分，避免洗分破壞間隔排程。
    if (hintUsed) {
      srs.review(word.word, 0);
      showToast('靠提示完成～下次自己拼拼看也可以 💪');
    } else {
      showConfetti();
      srs.review(word.word, 2);
    }
    recordStudy();
    updateStats();
    setTimeout(nextWord, 900);
  } else if (e && e.key === 'Enter' && inputNS.length === targetNS.length) {
    answered = true;
    srs.review(word.word, 0);
    recordStudy();
    updateStats();
    // Show correct answer in boxes
    letters.forEach((letter, i) => {
      const box = document.getElementById('lb' + i);
      if (!box) return;
      box.textContent = letter;
      box.classList.add('correct');
    });
    // 答錯不自動跳題：揭示正解＋鼓勵，由孩子自己按「繼續」
    showReveal(word, false, '沒關係，正確拼法是這樣，下次一定行 💪');
  }
}

function showSpellingHint() {
  const word = getCurrentWord();
  const target = word.word.toLowerCase();
  const input = document.getElementById('spellingInput');
  const current = input.value.toLowerCase();

  // Reveal next letter（跳過空格，確保每次提示都真的多露出一個字母；多字詞如 ice cream 的空格位沒有方格）
  if (current.length < target.length) {
    hintUsed = true;   // 用過提示：completion 時只給 0 分，不給「記住了」
    var k = current.length + 1;
    while (k < target.length && target.charAt(k - 1) === ' ') k++;
    input.value = target.substring(0, k);
    checkSpelling(null);
  }
}

function renderListening(area) {
  const word = getCurrentWord();
  if (!word) { area.innerHTML = '<div class="empty-state"><div class="empty-state-emoji">🎉</div><p>太棒了，這個主題今天都複習完囉！要不要換一個主題，或明天再來呢？😊</p></div>'; return; }

  const allWords = WORD_DATA[currentTab].words;
  const options = [word.word];
  let attempts = 0;
  while (options.length < 4 && attempts < 100) {   // 誘答取樣上限，主題不足 4 個相異字時降級為較少選項，不卡死
    const rand = allWords[Math.floor(Math.random() * allWords.length)];
    if (!options.includes(rand.word)) options.push(rand.word);
    attempts++;
  }
  options.sort(() => Math.random() - 0.5);

  area.innerHTML = `
    <div class="word-counter">${currentWordIndex + 1} / ${studyQueue.length}</div>
    <div class="listening-container">
      <p style="font-size:1.1rem; margin-bottom:8px; color:var(--text-secondary)">聽一聽，選出正確的單字</p>
      <button class="fc-audio fc-audio--lg" aria-label="播放單字發音，再聽一次" onclick="speak('${word.word.replace(/'/g, "\\'")}')">🔊</button>
      <div class="quiz-options" style="margin-top:20px;">
        ${options.map(opt => `<div class="quiz-option" role="button" tabindex="0" onclick="checkListeningAnswer(this, '${jsAttr(opt)}', '${jsAttr(word.word)}')">${escAttr(opt)}</div>`).join('')}
      </div>
      <div class="fc-reveal" id="revealPanel"></div>
    </div>
  `;

  // Auto play
  setTimeout(() => speak(word.word), 300);
}

function checkListeningAnswer(el, selected, correct) {
  if (answered) return;
  answered = true;
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(opt => {
    opt.style.pointerEvents = 'none';
    if (opt.textContent === correct) opt.classList.add('correct');
  });
  const word = getCurrentWord();

  if (selected === correct) {
    el.classList.add('correct');
    showConfetti();
    srs.review(word.word, 2);
    recordStudy();
    updateStats();
    setTimeout(nextWord, 900);
  } else {
    el.classList.add('wrong');
    srs.review(word.word, 0);
    recordStudy();
    updateStats();
    showReveal(word, false, '再聽一次就抓到了！正確的字幫你標出來囉 😊');
  }
}

// ==================== CLOZE MODE (for CEFR) ====================
function renderClozeFront(area) {
  const word = getCurrentWord();
  if (!word) { area.innerHTML = '<div class="empty-state"><div class="empty-state-emoji">🎉</div><p>太棒了，這個主題今天都複習完囉！要不要換一個主題，或明天再來呢？😊</p></div>'; return; }

  area.innerHTML = `
    <div class="word-counter">${currentWordIndex + 1} / ${studyQueue.length}</div>
    <div class="flashcard-container">
      <div class="flashcard ${isFlipped ? 'flipped' : ''}" role="button" tabindex="0" aria-label="單字卡，按 Enter 或空白鍵翻面" onclick="flipCard()" onkeydown="if((event.key==='Enter'||event.key===' ')&&event.target===this){event.preventDefault();flipCard();}">
        <div class="flashcard-face">
          <div style="font-size:1.1rem;text-align:center;line-height:1.8;max-width:100%;overflow-wrap:break-word;">${word.cloze || word.sentence}</div>
          <div class="tap-hint">點擊翻轉看答案</div>
        </div>
        <div class="flashcard-face flashcard-back">
          <div class="flashcard-body">
            <div class="flashcard-word">${word.word}</div>
            ${word.definition ? `<div class="flashcard-definition">${word.definition}</div>` : ''}
            <div class="flashcard-sentence">${word.sentence}</div>
          </div>
          <div class="sound-row">
            <button class="fc-audio fc-audio--lg" aria-label="播放單字發音" onclick="event.stopPropagation(); speak('${word.word.replace(/'/g, "\\'")}')">🔊</button>
            <button class="fc-audio fc-audio--sm" aria-label="播放例句發音" onclick="event.stopPropagation(); speak('${jsAttr(word.sentence.replace(/<[^>]*>/g, ''))}', false, '${jsAttr(word.word)}')">📢</button>
          </div>
        </div>
      </div>
    </div>
    <div class="fc-rate">
      <button class="fc-rate__btn again" onclick="reviewWord(0)">😅 還不熟<span class="fc-rate__btn__label">再一起看</span></button>
      <button class="fc-rate__btn good" onclick="reviewWord(2)">🙂 想起來了<span class="fc-rate__btn__label">記住了</span></button>
      <button class="fc-rate__btn easy" onclick="reviewWord(3)">😎 很輕鬆<span class="fc-rate__btn__label">太簡單</span></button>
    </div>
  `;
}

function renderClozeQuiz(area) {
  const word = getCurrentWord();
  if (!word) { area.innerHTML = '<div class="empty-state"><div class="empty-state-emoji">🎉</div><p>太棒了，這個主題今天都複習完囉！要不要換一個主題，或明天再來呢？😊</p></div>'; return; }

  // Pick 5 random options from the word's option list + ensure answer is included
  let choices = (word.options || []).filter(o => o !== word.word);
  choices = choices.sort(() => Math.random() - 0.5).slice(0, 5);
  choices.push(word.word);
  choices = choices.sort(() => Math.random() - 0.5);

  area.innerHTML = `
    <div class="word-counter">${currentWordIndex + 1} / ${studyQueue.length}</div>
    <div class="quiz-container">
      <div class="quiz-question">
        <div style="font-size:1.05rem;text-align:center;line-height:1.8;margin-bottom:12px;">${word.cloze || word.sentence}</div>
      </div>
      <div class="quiz-options" style="grid-template-columns:1fr 1fr;">
        ${choices.map(opt => `<div class="quiz-option" role="button" tabindex="0" onclick="checkClozeAnswer(this, '${jsAttr(opt)}', '${jsAttr(word.word)}')">${escAttr(opt)}</div>`).join('')}
      </div>
      <div class="fc-reveal" id="revealPanel"></div>
    </div>
  `;
}

function checkClozeAnswer(el, selected, correct) {
  if (answered) return;
  answered = true;
  const options = document.querySelectorAll('.quiz-option');
  options.forEach(opt => {
    opt.style.pointerEvents = 'none';
    if (opt.textContent === correct) opt.classList.add('correct');
  });

  const word = getCurrentWord();
  if (selected === correct) {
    el.classList.add('correct');
    showConfetti();
    srs.review(word.word, 2);
    recordStudy();
    updateStats();
    setTimeout(nextWord, 900);
  } else {
    el.classList.add('wrong');
    srs.review(word.word, 0);
    recordStudy();
    updateStats();
    showReveal(word, false, '差一點點！正確答案已經幫你標出來囉，記起來下次就會 😊');
  }
}

function renderClozeSpelling(area) {
  const word = getCurrentWord();
  if (!word) { area.innerHTML = '<div class="empty-state"><div class="empty-state-emoji">🎉</div><p>太棒了，這個主題今天都複習完囉！要不要換一個主題，或明天再來呢？😊</p></div>'; return; }

  const letters = word.word.split('');
  // 空白位置（多字詞如 ice cream）輸出 .fc-spell__gap（無方格），與 renderSpelling 一致；
  // 否則 checkSpelling 以 lb<i> 對位時，字母會被擠進空格方格、後面全部錯位。
  const boxes = letters.map((ch, i) => ch === ' ' ? '<span class="fc-spell__gap"></span>' : `<div class="letter-box" id="lb${i}"></div>`).join('');

  area.innerHTML = `
    <div class="word-counter">${currentWordIndex + 1} / ${studyQueue.length}</div>
    <div class="spelling-container">
      <div style="font-size:1rem;text-align:center;line-height:1.8;margin-bottom:12px;color:var(--text-secondary);">${word.cloze || word.sentence}</div>
      <div style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:10px;font-style:italic;">${word.chinese || word.definition || ''}</div>
      <div class="spelling-boxes">${boxes}</div>
      <input type="text" class="spelling-input" id="spellingInput" placeholder="輸入單字..." autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" onkeyup="checkSpelling(event)">
      <br>
      <button class="hint-btn" onclick="showSpellingHint()">💡 提示</button>
      <button class="fc-audio fc-audio--lg" aria-label="播放單字發音" onclick="speak('${word.word.replace(/'/g, "\\'")}')">🔊</button>
      <div class="fc-reveal" id="revealPanel"></div>
    </div>
  `;
  setTimeout(() => { const el = document.getElementById('spellingInput'); if (el) el.focus(); }, 100);
}

function renderClozeListening(area) {
  const word = getCurrentWord();
  if (!word) { area.innerHTML = '<div class="empty-state"><div class="empty-state-emoji">🎉</div><p>太棒了，這個主題今天都複習完囉！要不要換一個主題，或明天再來呢？😊</p></div>'; return; }

  // Show sentence with blank, play the word audio, select from options
  let choices = (word.options || []).filter(o => o !== word.word);
  choices = choices.sort(() => Math.random() - 0.5).slice(0, 5);
  choices.push(word.word);
  choices = choices.sort(() => Math.random() - 0.5);

  area.innerHTML = `
    <div class="word-counter">${currentWordIndex + 1} / ${studyQueue.length}</div>
    <div class="listening-container">
      <div style="font-size:1rem;text-align:center;line-height:1.8;margin-bottom:12px;color:var(--text-secondary);">${word.cloze || word.sentence}</div>
      <p style="font-size:0.9rem; margin-bottom:8px; color:var(--text-secondary)">聽一聽，選出正確的單字填入空格</p>
      <button class="fc-audio fc-audio--lg" aria-label="播放單字發音，再聽一次" onclick="speak('${word.word.replace(/'/g, "\\'")}')">🔊</button>
      <div class="quiz-options" style="margin-top:16px;grid-template-columns:1fr 1fr;">
        ${choices.map(opt => `<div class="quiz-option" role="button" tabindex="0" onclick="checkClozeAnswer(this, '${jsAttr(opt)}', '${jsAttr(word.word)}')">${escAttr(opt)}</div>`).join('')}
      </div>
      <div class="fc-reveal" id="revealPanel"></div>
    </div>
  `;
  setTimeout(() => speak(word.word), 300);
}

function renderMatching(area) {
  const allWords = WORD_DATA[currentTab].words;
  if (!allWords || !allWords.length) { area.innerHTML = '<div class="empty-state"><div class="empty-state-emoji">🎉</div><p>太棒了，這個主題今天都複習完囉！要不要換一個主題，或明天再來呢？😊</p></div>'; return; }
  const getMeaning = (w) => w.chinese || w.definition || w.word;
  // 以「釋義」去重再取最多 5 個字，避免出現兩張中文字面相同的 tile，
  // 造成同一中文對應兩個英文卻只認一個而配對判錯。
  // 以「釋義成分重疊」去重（非僅完全相同字串），避免 paw/claw、fiction/novel、article/essay
  // 這類語意包含的字同組出現時，孩子的合理配對被判錯。
  const mParts = (ch) => String(ch || '').replace(/[（(][^）)]*[）)]/g, '').split(/[\/、，,;；／]/).map(s => s.trim()).filter(Boolean);
  const shareM = (a, b) => { const B = new Set(mParts(b)); return mParts(a).some(p => B.has(p)); };
  const shuffled = [];
  for (const w of [...allWords].sort(() => Math.random() - 0.5)) {
    // 釋義成分重疊、或屬同一同義群組（如 dad/father、mom/mother）者不同回合並列，
    // 否則孩子把 dad 連到「父親」這類合理配對會被判錯，與 quiz 模式不一致。
    if (shuffled.some(x => shareM(getMeaning(x), getMeaning(w)) || inSameSynGroup(x.word, w.word))) continue;
    shuffled.push(w);
    if (shuffled.length === 5) break;
  }
  const englishItems = shuffled.map(w => ({ type: 'en', word: w.word, pair: getMeaning(w) }));
  const chineseItems = shuffled.map(w => ({ type: 'zh', word: getMeaning(w), pair: w.word }));

  const leftCol = englishItems.sort(() => Math.random() - 0.5);
  const rightCol = chineseItems.sort(() => Math.random() - 0.5);

  matchState = { selected: null, matched: [], pairs: shuffled };

  // Interleave left and right into flat grid (row by row for alignment)
  // 對屬性值做跳脫，避免資料含雙引號或角括號時破壞標籤或比對
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let gridItems = '';
  for (let i = 0; i < shuffled.length; i++) {
    gridItems += `<div class="match-item" role="button" tabindex="0" data-type="en" data-word="${esc(leftCol[i].word)}" data-pair="${esc(leftCol[i].pair)}" onclick="selectMatch(this)">${esc(leftCol[i].word)}</div>`;
    gridItems += `<div class="match-item" role="button" tabindex="0" data-type="zh" data-word="${esc(rightCol[i].word)}" data-pair="${esc(rightCol[i].pair)}" onclick="selectMatch(this)">${esc(rightCol[i].word)}</div>`;
  }

  area.innerHTML = `
    <div style="text-align:center; margin-bottom:12px; color:var(--text-secondary)">左右配對</div>
    <div class="matching-container">
      ${gridItems}
    </div>
  `;
}

function selectMatch(el) {
  if (el.classList.contains('matched')) return;

  if (matchState.selected && matchState.selected.dataset.type === el.dataset.type) {
    // Same type - deselect first, select new
    matchState.selected.classList.remove('selected');
    matchState.selected = el;
    el.classList.add('selected');
    return;
  }

  if (!matchState.selected) {
    matchState.selected = el;
    el.classList.add('selected');
  } else {
    // Check match
    const first = matchState.selected;
    const second = el;

    let isMatch = false;
    if (first.dataset.type === 'en' && second.dataset.pair === first.dataset.word) isMatch = true;
    if (first.dataset.type === 'zh' && second.dataset.pair === first.dataset.word) isMatch = true;
    if (second.dataset.type === 'en' && first.dataset.pair === second.dataset.word) isMatch = true;
    if (second.dataset.type === 'zh' && first.dataset.pair === second.dataset.word) isMatch = true;

    if (isMatch) {
      first.classList.remove('selected');
      first.classList.add('matched');
      second.classList.add('matched');
      matchState.matched.push(first.dataset.word);

      // Find the english word to record SRS
      const enWord = first.dataset.type === 'en' ? first.dataset.word : second.dataset.word;
      srs.startLearning(enWord);
      srs.review(enWord, 2);
      recordStudy();

      if (matchState.matched.length >= matchState.pairs.length) { // 以實際配對數為準（去重後可能 <5），否則配完整盤仍不觸發完成、孩子卡住
        showConfetti();
        updateStats();
        setTimeout(() => { if (currentMode === 'matching') renderMatching(document.getElementById('learningArea')); }, 1500); // 慶祝視窗內若已切換模式就別把畫面蓋回配對盤
      }
    } else {
      second.classList.add('wrong-match');
      first.classList.add('wrong-match');
      setTimeout(() => {
        first.classList.remove('selected', 'wrong-match');
        second.classList.remove('wrong-match');
      }, 500);
    }
    matchState.selected = null;
  }
}

// ==================== DASHBOARD ====================
function showDashboard() {
  document.getElementById('learningArea').innerHTML = '';
  const dash = document.getElementById('dashboard');
  dash.classList.add('show');

  const stats = getStudyStats();
  document.getElementById('streakNumber').textContent = stats.streak || 0;

  // Heatmap
  const heatmap = document.getElementById('heatmap');
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const key = (window.SRS && SRS.addDays && SRS.today) ? SRS.addDays(SRS.today(), -i) : new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
    const count = (stats.history && stats.history[key]) || 0;
    const dayName = ['日','一','二','三','四','五','六'][new Date(key + 'T00:00:00').getDay()];
    let level = '';
    if (count > 0) level = 'level-1';
    if (count > 5) level = 'level-2';
    if (count > 15) level = 'level-3';
    if (count > 30) level = 'level-4';
    days.push(`<div class="heatmap-day ${level}" title="${key}: ${count}次">${dayName}</div>`);
  }
  heatmap.innerHTML = days.join('');

  // Tab progress
  const barsDiv = document.getElementById('tabProgressBars');
  barsDiv.innerHTML = Object.entries(WORD_DATA).map(([key, data]) => {
    const total = data.words.length;
    const learned = data.words.filter(w => srs.isLearned(w.word)).length;
    const pct = total > 0 ? Math.round(learned / total * 100) : 0;
    return `
      <div class="progress-section" style="margin-top:12px;">
        <div class="progress-title" style="color:var(--accent-ink)">${data.name}</div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar-fill" style="width:${pct}%; background:linear-gradient(90deg, ${data.color}, ${data.color}88)"></div>
        </div>
        <div class="progress-text">${learned} / ${total} (${pct}%)</div>
      </div>
    `;
  }).join('');
}

function hideDashboard() {
  document.getElementById('dashboard').classList.remove('show');
  renderMode();
}

// ==================== SETTINGS ====================
function showSettings() {
  const settings = getSettings();
  document.getElementById('dailyNewInput').value = settings.dailyNew;
  document.getElementById('speedSelect').value = String(settings.speed);
  document.getElementById('settingsModal').classList.add('show');
}

function hideSettings() {
  const settings = getSettings();
  settings.dailyNew = parseInt(document.getElementById('dailyNewInput').value) || 10;
  settings.speed = parseFloat(document.getElementById('speedSelect').value) || 1.0;
  saveSettings(settings);
  document.getElementById('settingsModal').classList.remove('show');
  refreshQueue();
  renderMode();
}

function resetProgress() {
  if (confirm('確定要重置所有學習進度嗎？此操作無法復原。')) {
    localStorage.removeItem('vocab_srs');
    localStorage.removeItem('vocab_stats');
    srs = new SRSEngine();
    updateStats();
    refreshQueue();
    renderMode();
    hideSettings();
  }
}

// ==================== MODE SELECTOR ====================
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    currentWordIndex = 0;
    isFlipped = false;
    renderMode();
  });
});

// ==================== ENGINE WIRING (english XP via live recordAnswer) ====================
// 每一種模式（閃卡 / 測驗 / 拼字 / 聽力 / 克漏字 / 配對）的評分最終都會呼叫
// srs.review(word, quality)，因此在此單一漏斗外層包一層副作用即可涵蓋全部路徑。
// 只加上 Game.recordAnswer 的側效，SRS 排程邏輯與回傳值完全不動；改寫 prototype
// 可在 resetProgress() 重新 new SRSEngine() 後仍持續生效。
// quality：0=還不會/答錯 → false；1=有點難、2=記住了、3=太簡單 → true。
(function wireEnglishXp(){
  if (typeof Game === 'undefined' || typeof Game.recordAnswer !== 'function') return;
  const _origReview = SRSEngine.prototype.review;
  SRSEngine.prototype.review = function(word, quality) {
    const card = _origReview.call(this, word, quality);
    try { Game.recordAnswer('english', quality !== 0, { word: word, quality: quality }); } catch (e) {}
    return card;
  };
})();

// ==================== INIT ====================
function init() {
  initTabs();
  updateStats();
  refreshQueue();
  renderMode();

  // Load voices
  if ('speechSynthesis' in window) {
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
  }
}

init();

/* ---- (下一個原 inline <script> 區塊) ---- */

(function () {
  'use strict';
  var KEY = 'worddex_vocab_v1';
  // 進化門檻（天）：集中成常數方便日後調校，不影響「純讀 SRS」性質
  var THRESH = { hatch: 1, grow: 7, master: 21 }; // interval>=1 收集中、>=7 成長、>=21 精通
  var STAGE_NAME = ['未收集', '剛孵化', '收集中', '成長', '精通'];
  var STAGE_GLYPH = ['☆', '🥚', '⭐', '🌿', '🌟'];

  var data = null;

  // ---------- 純視覺 key 的讀寫（獨立於 vocab_srs / vocab_stats / player_profile_v1） ----------
  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.peak) {
          data = parsed;
          if (!data.awarded) data.awarded = {};
          return;
        }
      } catch (e) {}
    }
    data = { version: 1, updatedAt: new Date().toISOString(), peak: {}, awarded: {} };
  }
  function save() {
    if (!data) return;
    data.updatedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* 配額滿：靜默放棄，不崩頁 */ }
  }
  function reload() { load(); if (isScreenOpen()) { renderSummary(); renderShelf(); renderSections(); } }

  // ---------- 進化階段：純讀 vocab_srs 卡片欄位推導（不落地、不回寫） ----------
  // id 一律用裸 word.word，與 SRSEngine 的 key 完全一致（跨 tab 同字共用同一張卡）
  function liveStage(word) {
    var card = null;
    try { card = srs.store.peek(word); } catch (e) { card = null; } // 唯讀窺看：進化階推導不落地建卡
    if (!card || card.status === 'new') return 0;
    var iv = (card.interval || 0);   // 與 isLearned/getStats 一致：interval 缺值視為 0，避免 undefined<THRESH 全 false 落到「精通」(return 4) 誤判、灌水 masteredCount/徽章
    if (card.status !== 'review' || iv < THRESH.hatch) return 1;
    if (iv < THRESH.grow) return 2;
    if (iv < THRESH.master) return 3;
    return 4;
  }
  function peakOf(word) { return (data && data.peak && data.peak[word]) || 0; }
  // 顯示階 = max(liveStage, peak)：高水位覆蓋，圖鑑只升不退（child-safe，無失落厭惡）
  function showStage(word) { return Math.max(liveStage(word), peakOf(word)); }
  function isDue(word) { try { return srs.isDue(word); } catch (e) { return false; } }

  // ---------- 分母 / 計數：即時由 WORD_DATA + srs 計算，不落地 ----------
  // WORD_DATA 是主 script 的頂層 let（共享詞法全域，非掛在 window 上），故用裸名讀取，
  // 與本模組讀 srs/currentTab 一致；用 window.WORD_DATA 會是 undefined → 圖鑑空殼。
  function tabKeys() { return Object.keys((typeof WORD_DATA !== 'undefined' && WORD_DATA) || {}); }
  function tabWords(tab) {
    var pack = (typeof WORD_DATA !== 'undefined' && WORD_DATA) && WORD_DATA[tab];
    return (pack && pack.words) ? pack.words : [];
  }
  function tabName(tab) {
    var pack = (typeof WORD_DATA !== 'undefined' && WORD_DATA) && WORD_DATA[tab];
    return (pack && pack.name) ? pack.name : tab;
  }
  function totalCount() {
    var n = 0, keys = tabKeys();
    for (var i = 0; i < keys.length; i++) n += tabWords(keys[i]).length;
    return n;
  }
  function collectedCount() {
    var n = 0, keys = tabKeys();
    for (var i = 0; i < keys.length; i++) {
      var ws = tabWords(keys[i]);
      for (var j = 0; j < ws.length; j++) if (showStage(ws[j].word) >= 2) n++;
    }
    return n;
  }
  function masteredCount() {
    var n = 0, keys = tabKeys();
    for (var i = 0; i < keys.length; i++) {
      var ws = tabWords(keys[i]);
      for (var j = 0; j < ws.length; j++) if (showStage(ws[j].word) >= 4) n++;
    }
    return n;
  }
  function dueCount() {
    var n = 0, keys = tabKeys();
    for (var i = 0; i < keys.length; i++) {
      var ws = tabWords(keys[i]);
      for (var j = 0; j < ws.length; j++) if (showStage(ws[j].word) >= 2 && isDue(ws[j].word)) n++;
    }
    return n;
  }
  function tabAllCollected(tab) {
    var ws = tabWords(tab); if (!ws.length) return false;
    for (var i = 0; i < ws.length; i++) if (showStage(ws[i].word) < 2) return false;
    return true;
  }
  function allMastered() {
    var keys = tabKeys(); if (!keys.length) return false;
    for (var i = 0; i < keys.length; i++) {
      var ws = tabWords(keys[i]); if (!ws.length) return false;
      for (var j = 0; j < ws.length; j++) if (showStage(ws[j].word) < 4) return false;
    }
    return totalCount() > 0;
  }

  // ---------- 里程碑：純本地徽章（先落 guard→save→再以 showToast 慶祝，不呼叫 Game.award） ----------
  function badgeList() {
    // {id, label, on}；on 由 read-only 計數即時算
    var out = [];
    var col = collectedCount(), mas = masteredCount();
    out.push({ id: 'first_word', label: '🌟 第一個字', on: col >= 1 });
    out.push({ id: 'collect_25', label: '✨ 收集 25', on: col >= 25 });
    out.push({ id: 'collect_50', label: '✨ 收集 50', on: col >= 50 });
    out.push({ id: 'collect_100', label: '✨ 收集 100', on: col >= 100 });
    var keys = tabKeys();
    for (var i = 0; i < keys.length; i++) {
      out.push({ id: 'tab_all_' + keys[i], label: '📚 ' + tabName(keys[i]) + ' 全收集', on: tabAllCollected(keys[i]) });
    }
    out.push({ id: 'master_25', label: '🏅 精通 25', on: mas >= 25 });
    out.push({ id: 'master_all', label: '👑 全部精通', on: allMastered() });
    return out;
  }
  function mileMsg(id) {
    switch (id) {
      case 'first_word': return '收集到第一個單字！🌟';
      case 'collect_25': return '已收集 25 個字！✨';
      case 'collect_50': return '已收集 50 個字！✨';
      case 'collect_100': return '已收集 100 個字！✨';
      case 'master_25': return '已精通 25 個字！🏅';
      case 'master_all': return '全部單字都精通了！👑';
      default:
        if (id.indexOf('tab_all_') === 0) return '完成一個主題的全部收集！📚';
        return '達成新成就！🎉';
    }
  }
  function checkMilestones() {
    var list = badgeList();
    for (var i = 0; i < list.length; i++) {
      var b = list[i];
      if (!b.on || data.awarded[b.id]) continue;
      // 嚴格順序：先設 guard → 先 save 落地 → 再以 showToast 慶祝（showToast 只顯示 UI，不加 XP）
      data.awarded[b.id] = true;
      save();
      try { if (window.Game && window.Game.showToast) window.Game.showToast(mileMsg(b.id), 'success'); } catch (e) {}
    }
  }

  // ---------- 進化慶祝 overlay（純表演，尊重 prefers-reduced-motion） ----------
  function celebrateEvolution(word, before, after) {
    var rec = wordRecord(word);
    var wObj = rec ? rec.word : null;
    var body = document.getElementById('worddexFocusBody');
    if (body) {
      body.innerHTML =
        '<div class="worddex-focus-emoji">' + escapeHtml((wObj && wObj.emoji) || '📖') + '</div>' +
        '<div class="worddex-focus-word">' + escapeHtml(word) + '</div>' +
        '<div class="worddex-focus-evo">' + STAGE_GLYPH[before] +
          '<span class="arrow">→</span>' + STAGE_GLYPH[after] + '</div>' +
        '<div class="worddex-focus-cn">進化啦！這個字長大了 🌱→🌟</div>' +
        '<div class="worddex-focus-meta">' + escapeHtml(STAGE_NAME[before]) + ' → <b>' + escapeHtml(STAGE_NAME[after]) + '</b></div>';
    }
    var o = document.getElementById('worddexFocusOverlay');
    if (o) o.hidden = false;
    try {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!reduce && typeof showConfetti === 'function') showConfetti();
    } catch (e) {}
  }

  // ---------- 主 hook 收斂點：每次 srs.review 之後（讀剛存好的卡） ----------
  function onReview(word, quality) {
    if (!data) load();
    var live = liveStage(word);
    var oldPeak = peakOf(word);
    var newPeak = Math.max(live, oldPeak);
    if (newPeak > oldPeak) {
      data.peak[word] = newPeak;
      save();
    }
    checkMilestones();
    // 顯示階上升 → 彈一次進化慶祝（僅在圖鑑畫面未開時獨立呈現，避免蓋掉練習流程）
    if (newPeak > oldPeak && !isScreenOpen()) {
      celebrateEvolution(word, oldPeak, newPeak);
    }
    if (isScreenOpen()) { renderSummary(); renderShelf(); renderSections(); }
  }

  // ---------- UI 輔助 ----------
  function isScreenOpen() {
    var el = document.getElementById('worddexArea');
    return !!(el && !el.classList.contains('hidden'));
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  // 產出可安全嵌入 double-quoted onclick 屬性的單引號 JS 字串字面值
  function jsStrAttr(s) {
    return "'" + String(s)
      .replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;') + "'";
  }
  // tab::word 僅供 UI 導覽（定位 word 物件 + 所屬 tab），絕不用於讀 SRS
  function wordRecord(word) {
    var keys = tabKeys();
    for (var i = 0; i < keys.length; i++) {
      var ws = tabWords(keys[i]);
      for (var j = 0; j < ws.length; j++) if (ws[j].word === word) return { word: ws[j], tab: keys[i] };
    }
    return null;
  }
  function findInTab(tab, word) {
    var ws = tabWords(tab);
    for (var i = 0; i < ws.length; i++) if (ws[i].word === word) return ws[i];
    return null;
  }

  // ---------- 畫面渲染 ----------
  function renderSummary() {
    var el = document.getElementById('worddexSummary');
    if (!el) return;
    var col = collectedCount(), mas = masteredCount(), due = dueCount(), total = totalCount();
    el.innerHTML = '已收集 <b>' + col + '</b> / ' + total + '　·　精通 <b>' + mas + '</b> 個　·　' +
      (due > 0 ? '今天有 <b>' + due + '</b> 個字想跟你打招呼 🔵' : '今天都複習完了，明天見！');
  }
  function renderShelf() {
    var host = document.getElementById('worddexShelf');
    if (!host) return;
    var list = badgeList();
    var html = '';
    for (var i = 0; i < list.length; i++) {
      html += '<span class="worddex-badge ' + (list[i].on ? 'on' : 'off') + '">' + escapeHtml(list[i].label) + '</span>';
    }
    host.innerHTML = html;
  }
  function renderSections() {
    var host = document.getElementById('worddexSections');
    if (!host) return;
    var keys = tabKeys();
    var html = '';
    for (var i = 0; i < keys.length; i++) {
      var tab = keys[i];
      var ws = tabWords(tab);
      if (!ws.length) continue;
      html += '<div class="worddex-section"><div class="worddex-section-title">' + escapeHtml(tabName(tab)) + '</div><div class="worddex-grid">';
      for (var j = 0; j < ws.length; j++) {
        var w = ws[j];
        var st = showStage(w.word);
        var due = (st >= 2 && isDue(w.word));
        html += '<div class="worddex-card st' + st + (due ? ' due' : '') + '" role="button" tabindex="0"' +
          ' onclick="Worddex.openFocus(' + jsStrAttr(tab) + ',' + jsStrAttr(w.word) + ')"' +
          ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();Worddex.openFocus(' + jsStrAttr(tab) + ',' + jsStrAttr(w.word) + ');}">' +
          '<span class="wd-emoji">' + escapeHtml(w.emoji || '📖') + '</span>' +
          '<span class="wd-word">' + escapeHtml(w.word) + '</span>' +
          '<span class="wd-glyph">' + STAGE_GLYPH[st] + (due ? ' <span class="wd-due">🔵</span>' : '') + '</span>' +
          '<span class="wd-state">' + escapeHtml(STAGE_NAME[st]) + '</span>' +
          '</div>';
      }
      html += '</div></div>';
    }
    host.innerHTML = html;
  }

  // ---------- 開關畫面（與 .vocab-layout 互斥，比照 cefr 切換法） ----------
  function openScreen() {
    if (!data) load();
    var area = document.getElementById('worddexArea');
    var layout = document.querySelector('.vocab-layout');
    if (layout) layout.classList.add('hidden');
    if (area) area.classList.remove('hidden');
    renderSummary(); renderShelf(); renderSections();
  }
  function closeScreen() {
    var area = document.getElementById('worddexArea');
    var layout = document.querySelector('.vocab-layout');
    if (area) area.classList.add('hidden');
    if (layout) layout.classList.remove('hidden');
  }

  // ---------- 單字聚焦 overlay ----------
  function openFocus(tab, word) {
    if (!data) load();
    var wObj = findInTab(tab, word);
    var st = showStage(word);
    var status;
    if (st === 0) status = '還沒收集，練一次就會亮起來 ✨';
    else status = '目前：' + STAGE_GLYPH[st] + ' ' + STAGE_NAME[st];
    var when = '';
    var card = null;
    try { card = srs.store.peek(word); } catch (e) {} // 唯讀窺看：焦點卡顯示不落地建卡
    var nextDue = (card && (card.dueDate || card.due)) || null;
    if (card && card.status !== 'new' && nextDue) {
      if (isDue(word)) when = '今天想跟你複習 🔵';
      else when = '下次複習日：' + String(nextDue).slice(0, 10);
    }
    var reps = (card && card.reps) ? card.reps : 0;
    var body = document.getElementById('worddexFocusBody');
    if (body) {
      body.innerHTML =
        '<div class="worddex-focus-emoji">' + escapeHtml((wObj && wObj.emoji) || '📖') + '</div>' +
        '<div class="worddex-focus-word">' + escapeHtml(word) + '</div>' +
        '<div class="worddex-focus-cn">' + escapeHtml((wObj && wObj.chinese) || '') + '</div>' +
        '<div class="worddex-focus-meta">' + status + (when ? ('<br>' + when) : '') +
          '<br>複習 ' + reps + ' 次</div>' +
        '<button class="worddex-focus-practice" onclick="Worddex.startFocus(' + jsStrAttr(tab) + ',' + jsStrAttr(word) + ')">✏️ 練這個字</button>';
    }
    var o = document.getElementById('worddexFocusOverlay');
    if (o) o.hidden = false;
  }
  function closeFocus() {
    var o = document.getElementById('worddexFocusOverlay');
    if (o) o.hidden = true;
  }

  // ---------- 「練這個字」bridge：重用既有作答流程、走既有 XP 路徑（不新增計分） ----------
  function startFocus(tab, word) {
    if (!data) load();
    closeFocus();
    var wObj = findInTab(tab, word);
    if (!wObj) return;
    try {
      currentTab = tab;               // 同步 tab（共享全域詞法綁定）
      if (typeof initTabs === 'function') initTabs();
      if (typeof updateStats === 'function') updateStats();
      studyQueue = [wObj];            // 只練這個字
      currentWordIndex = 0;
    } catch (e) {}
    closeScreen();
    if (typeof renderMode === 'function') renderMode();
  }

  window.Worddex = {
    onReview: onReview,
    reload: reload,
    openScreen: openScreen,
    closeScreen: closeScreen,
    openFocus: openFocus,
    closeFocus: closeFocus,
    startFocus: startFocus
  };

  // ==================== HOOK 1：包裹 SRSEngine.prototype.review（唯一逐答收斂點） ====================
  // 獨立於 wireEnglishXp 的 compose 包裹：即使 Game 缺席也生效；只加側效，不改邏輯/回傳值。
  try {
    var _review = SRSEngine.prototype.review;
    SRSEngine.prototype.review = function (w, q) {
      var card = _review.call(this, w, q);
      try { onReview(w, q); } catch (e) {}
      return card;
    };
  } catch (e) {}

  // ==================== HOOK 2：包裹 window.resetProgress（reset 一致性） ====================
  // 僅當原函式確實清掉 vocab_srs（使用者按了確認）才連帶清視覺 key，保持圖鑑與 SRS 一致。
  try {
    var _rp = window.resetProgress;
    if (typeof _rp === 'function') {
      window.resetProgress = function () {
        _rp.apply(this, arguments);
        try {
          if (localStorage.getItem('vocab_srs') === null) {
            localStorage.removeItem(KEY);
            reload();
          }
        } catch (e) {}
      };
    }
  } catch (e) {}

  load();
})();

/* ---- (下一個原 inline <script> 區塊) ---- */

/* kbd-activate-delegation: role=button 的 div 可用 Enter/空白鍵觸發 */
document.addEventListener("keydown",function(e){if(e.key!=="Enter"&&e.key!==" ")return;var t=e.target;if(t&&t.getAttribute&&t.getAttribute("role")==="button"&&t.tagName!=="BUTTON"&&t.tagName!=="A"&&t.tagName!=="INPUT"&&t.tagName!=="TEXTAREA"&&!t.hasAttribute("onkeydown")){e.preventDefault();t.click();}});
