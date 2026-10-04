/* =====================================================================
 * index.ts  →  (tsc, tsconfig.legacy.json) →  index.js
 * 原為 index.html 的 inline <script>；逐檔 TS 遷移抽出成 sibling .js。
 * 行為與原 inline 版等價（verbatim；載入位置不變＝執行時機/順序不變）。
 * 原碼本身即單一頂層 IIFE，已自我隔離（tsc 全域型別檢查無名稱外洩）；verbatim 保留。
 * ===================================================================== */
(function () {
  'use strict';
  var G = window.Game;

  // lastRoute → 友善名稱（供「繼續上次」深連結）。
  var ROUTE_NAMES = {
    'math.html': '數學冒險王', 'multiply.html': '乘法樂園', 'mental_math.html': '心算特訓', 'fraction_lab.html': '分數特訓', 'unit_lab.html': '單位換算特訓', 'area_lab.html': '面積與周長特訓', 'percent_lab.html': '百分比特訓', 'time_lab.html': '時間特訓',
    'number_theory.html': '數字魔法師 · 數論基礎', 'number_theory_advanced.html': '數論進階冒險', 'math_modeling.html': '數學偵探 · 看穿問題', 'math_solving.html': '多步驟解題', 'logic_reasoning.html': '推理偵探 · 邏輯推理', 'detective.html': '抽絲剝繭 · 小偵探', 'self_protection.html': '留心眼 · 觀察與自我保護', 'emotion_skills.html': '心情練習場 · 照顧情緒的本領', 'emotion_practice.html': '這時候我可以怎麼做 · 情境演練', 'digital_citizenship.html': '數位公民 · 網路世界求生課', 'media_ai_literacy.html': '媒體與 AI 識讀 · 看懂訊息不被騙', 'learn_how_to_learn.html': '學會如何學習', 'thinking_traps_concepts.html': '思考陷阱 · 清晰思考', 'thinking_traps_practice.html': '情境偵探 · 這是哪一種陷阱',
    'geometry.html': '立體積木工坊',
    'vocabulary_app.html': '單字大師', 'english_sense.html': '英文語感', 'english_advanced.html': '進階英文語感', 'cefr_flashcard.html': 'CEFR 閃卡',
    'coca_flashcard.html': 'COCA 分級字彙', 'toeic_gept_flashcard.html': '多益 / 英檢閃卡',
    'practice.html': '單字探險家', 'chinese.html': '國語大冒險',
    'chinese_advanced.html': '進階國文挑戰',
    'social_advanced.html': '進階社會探索',
    'computer_science.html': '電腦與網路探索',
    'economics_advanced.html': '經濟與資本探索',
    'earth_science.html': '地球與太空探索',
    'innovators.html': '改變世界的人',
    'math_concepts.html': '數學觀念養成',
    'math2_concepts.html': '數學觀念養成 2',
    'physics_concepts.html': '物理觀念養成',
    'chemistry_concepts.html': '化學觀念養成',
    'number_theory_concepts.html': '數論觀念養成',
    'geometry_concepts.html': '幾何觀念養成', 'linear_algebra_concepts.html': '向量與變換・數學的力量', 'math_drill.html': '數理腦・綜合特訓',
    'biology_concepts.html': '生物觀念養成',
    'earth_science_concepts.html': '地球科學觀念養成', 'everyday_science_concepts.html': '生活理化・小百科',
    'economics_concepts.html': '理財觀念養成', 'finance_mindset_concepts.html': '理財心態・財務自由',
    'chinese_concepts.html': '國語觀念養成',
    'english_concepts.html': '英文句型觀念養成', 'english_reading.html': '英語閱讀技巧', 'english_idioms.html': '英文慣用語・看圖秒懂', 'english_speaking.html': '英文口說・跟著唸',
    'social_concepts.html': '社會觀念養成',
    'composition.html': '小小作家 · 寫作工廠',
    'finance.html': '理財小達人',
    'social_studies.html': '社會大冒險',
    'physics.html': '物理探險',
    'chemistry.html': '化學實驗室',
    'biology.html': '基礎生物',
    'math_advanced.html': '進階數學挑戰',
    'safety.html': '安全小達人', 'body_safety.html': '身體界線・保護自己',
    'idiom_stories.html': '成語故事館'
  };

  var AVATARS = ['🦊','🐰','🐼','🐯','🐶','🐱','🦁','🐨','🐸','🦉','🐢','🦄'];

  // 首訪推薦的友善起點：導向「生活安全」——最要緊、最低壓力、科目中性（與硬約束①一致）。
  // href 為頁內錨點（平滑捲到 #path-safety），走與導覽相同的「捲動＋聚焦」路徑。
  var FRIENDLY_START = { href: '#path-safety', name: '生活安全' };

  // 回訪無 lastRoute 時的「挑一個科目繼續玩」目標：同樣導向頁內安全區，不再寫死英文。
  var RETURN_START = { href: '#path-safety' };

  // 今日任務用：6 個計分科目 key → 短名 + hub 區段錨點（沿用 rail-nav 的 #path-* 路徑，不另造路徑）+ 既有 .chip-{科} class。
  // 順序與 rail-nav 一致（數學→英文→國語→自然→社會→理財）。
  var SUBJECT_TASKS = [
    { key: 'math',    name: '數學', href: '#path-math',    chip: 'chip-math' },
    { key: 'english', name: '英文', href: '#path-english', chip: 'chip-english' },
    { key: 'chinese', name: '國語', href: '#path-chinese', chip: 'chip-chinese' },
    { key: 'science', name: '自然', href: '#path-science', chip: 'chip-science' },
    { key: 'social',  name: '社會', href: '#path-social',  chip: 'chip-social' },
    { key: 'finance', name: '理財', href: '#path-finance', chip: 'chip-finance' }
  ];
  var MAX_TASK_CHIPS = 3;   // 畫面保持冷靜：最多 3 個 chip（最多 2 個待辦 + 補 1 個已完成）

  function $(id): any { return document.getElementById(id); }

  // 有效的頁內錨點（區段 / 主要內容 / 最上）。
  var HASH_RE = /^#(top|main-content|path-[a-z]+)$/;

  // 尊重使用者的「減少動態效果」偏好（前庭安全）。
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // 把焦點移到錨點目標（SR/鍵盤使用者「跳了真的有跳」）。
  function focusTarget(el) {
    if (!el) return;
    if (el.getAttribute('tabindex') === null) el.setAttribute('tabindex', '-1');
    try { el.focus({ preventScroll: true }); }
    catch (e) { el.focus(); }
  }

  // ---- 統一的「捲動 + 聚焦」錨點導覽：scrollToHash 與 rail/bottom-nav 點擊共用 ----
  //      區段全展開，只需捲動；用 scrollIntoView + CSS scroll-margin-top 讓開 sticky app-bar，
  //      並把焦點移到區段標題；reduce-motion 時瞬間定位（不做平滑動畫）。
  function goToHash(h) {
    if (!HASH_RE.test(h)) return false;
    var el = document.querySelector(h);
    if (!el) return false;
    var behavior = reduceMotion.matches ? 'auto' : 'smooth';
    try { el.scrollIntoView({ behavior: behavior, block: 'start' }); }
    catch (e) { el.scrollIntoView(); }
    focusTarget(el);
    return true;
  }
  function scrollToHash() { goToHash(location.hash || ''); }

  // ---- 徽章牆：全部徽章（已解鎖 + 未解鎖當目標） ----
  function renderBadges() {
    if (!G || !G.getBadgeWall) return;
    var wall = G.getBadgeWall();
    var grid = $('badge-grid');
    if (!grid) return;
    var earned = 0;
    grid.innerHTML = '';
    wall.forEach(function (b) {
      if (b.earned) earned++;
      var el = document.createElement('div');
      el.className = 'badge-item ' + (b.earned ? 'is-earned' : 'is-locked');
      var ico = document.createElement('div'); ico.className = 'b-ico'; ico.textContent = b.icon;
      var nm = document.createElement('div'); nm.className = 'b-name'; nm.textContent = b.name;
      var ds = document.createElement('div'); ds.className = 'b-desc'; ds.textContent = b.desc;
      var st = document.createElement('div'); st.className = 'b-state'; st.textContent = b.earned ? '✓ 已解鎖' : '尚未解鎖';
      el.appendChild(ico); el.appendChild(nm); el.appendChild(ds); el.appendChild(st);
      el.setAttribute('aria-label', b.name + '：' + b.desc + '，' + (b.earned ? '已解鎖' : '尚未解鎖'));
      grid.appendChild(el);
    });
    var cnt = $('badge-count');
    if (cnt) cnt.textContent = '已收集 ' + earned + ' / ' + wall.length;
  }

  // ---- 今日任務 chips：讀各科 lastPlayed，挑最少碰的 1–2 科當「{科} 玩 1 關」待辦，今天玩過→打勾變灰保留 ----
  // 回傳最優先的待辦 entry（供 hero-status 文案點名「接下來」），無則 null。首訪/無任務時隱藏整列。
  function playedMs(sub) {
    if (!sub || !sub.lastPlayed) return 0;
    var t = Date.parse(sub.lastPlayed);
    return isNaN(t) ? 0 : t;
  }
  function renderHeroTasks(p, returning) {
    var wrap = $('hero-tasks'), list = $('hero-tasks-list'), label = $('hero-tasks-label');
    if (!wrap || !list) return null;
    list.innerHTML = '';
    // 首訪：不顯示任何任務 noise（與 hero/Profile 卡的首訪壓縮一致）
    if (!returning) { wrap.hidden = true; return null; }

    var today = (G.localDate ? G.localDate() : (p.daily && p.daily.date)) || '';
    var subs = p.subjects || {};
    var pending = [], doneToday = [];
    SUBJECT_TASKS.forEach(function (t) {
      var ms = playedMs(subs[t.key]);
      var day = ms && G.localDate ? G.localDate(new Date(ms)) : '';
      var isToday = !!ms && day === today;
      var entry = { meta: t, ms: ms };
      if (isToday) doneToday.push(entry); else pending.push(entry);
    });
    pending.sort(function (a, b) { return a.ms - b.ms; });     // 最久沒碰的（含從未玩=0）排前面
    doneToday.sort(function (a, b) { return b.ms - a.ms; });   // 今天最近玩的排前面

    var chips = [], topPending = null;
    if (p.daily && p.daily.done) {
      // 今日達標：慶祝——只秀今天玩過的科目（打勾灰），不再催未完成
      doneToday.slice(0, MAX_TASK_CHIPS).forEach(function (e) { chips.push({ e: e, done: true }); });
      label.textContent = '今天都完成了 🎉';
    } else {
      pending.slice(0, 2).forEach(function (e) { chips.push({ e: e, done: false }); });
      topPending = pending.length ? pending[0] : null;
      doneToday.slice(0, Math.max(0, MAX_TASK_CHIPS - chips.length)).forEach(function (e) { chips.push({ e: e, done: true }); });
      label.textContent = '今天的小任務';
    }
    if (!chips.length) { wrap.hidden = true; return null; }

    chips.forEach(function (c) {
      var m = c.e.meta;
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'chip ' + m.chip + (c.done ? ' is-done' : '');
      a.setAttribute('href', m.href);
      if (c.done) {
        a.textContent = '✓ ' + m.name;
        a.setAttribute('aria-label', m.name + '：今天玩過了，很棒！');
      } else {
        a.textContent = m.name + ' 玩 1 關';
        a.setAttribute('aria-label', '今天的小任務：' + m.name + ' 玩 1 關');
      }
      li.appendChild(a);
      list.appendChild(li);
    });
    wrap.hidden = false;
    return topPending;
  }

  // ---- 依 profile 更新所有動態內容 ----
  function render() {
    if (!G || !G.getProfile) return;
    var p = G.getProfile();
    if (!p) return;
    var d = p.derived || {};

    // Profile 頭部
    $('avatar-btn').textContent = p.avatar || '🦊';
    $('pf-name').textContent = p.displayName || '小小探險家';
    $('pf-rank').textContent = (d.rankIcon || '🌱') + ' ' + (d.rankName || '探險新手') + ' · 第 ' + (p.level || 1) + ' 級';

    // XP bar
    var prog = d.levelProgress || 0;
    $('pf-xpfill').style.width = Math.round(prog * 100) + '%';
    var bar = $('pf-xpbar'); if (bar) bar.setAttribute('aria-valuenow', String(Math.round(prog * 100)));
    $('pf-xptext').textContent = d.isMaxLevel
      ? '已達最高等級，你太厲害了！'
      : '距離下一級還差 ' + (d.xpToNext || 0) + ' 點經驗值';

    // 火焰 / 金幣
    $('pf-streak-num').textContent = (p.streak && p.streak.current) || 0;
    $('pf-coins-num').textContent = p.coins || 0;

    // 歡迎語（正向、非失落厭惡；斷線只在回來時暖心，不預警「保住火焰」）
    // 首訪判定只看是否真的賺過經驗值；streak 一載入就會被 pingActive 設為 1 天，
    // 不能拿它當「回訪」依據（否則第一次來就被說「歡迎回來」）。
    var cur = (p.streak && p.streak.current) || 0;
    // 首訪判定：真的賺過 XP、或連續學習≥2天（純 pingActive 的思考挑戰頁也算數）、
    // 或曾造訪任一科目頁（lastRoute；recordRoute 已排除 hub/home，不會是首訪假象）。
    // 不能只看 totalXp：思考挑戰頁只 pingActive 不發 XP，否則天天玩仍被當首訪、且與「連續 N 天」自相矛盾。
    var returning = (p.totalXp > 0) || cur >= 2 || !!(p.lastRoute && ROUTE_NAMES[p.lastRoute]);
    // 首訪壓縮 Profile 卡（隱藏空經驗條與 0 火焰/0 金幣 noise）：由 body class 控制。
    document.body.classList.toggle('first-visit', !returning);
    $('greet-title').textContent = returning ? '歡迎回來！🎒' : '歡迎來到學習冒險基地！🏰';
    if (cur >= 2) {
      $('greet-sub').textContent = '你已經連續學習 ' + cur + ' 天，好棒！繼續今天的冒險吧！';
    } else {
      $('greet-sub').textContent = returning ? '很高興再看到你，選一個科目繼續玩吧！' : '選一個科目，開始今天的冒險吧！';
    }

    // 單一「從這裡開始」hero：整併「繼續上次」＋「今日任務」，畫面上只有一個最醒目的下一步。
    var hero = $('hero-start');
    var heroStatus = $('hero-status');
    var parentNote = $('hero-parent-note');
    var done = !!(p.daily && p.daily.done);
    var dprog = done ? 1 : (d.dailyProgress || 0);
    var dailyLine = done
      ? '今天做完囉！繼續玩還是有經驗值喔 🎉'
      : '今天的任務 ' + Math.round(dprog * 100) + '%，再玩幾題就完成（大約 5–8 分鐘）';
    if (returning) {
      // 回訪：優先「繼續上次」；若無 lastRoute 則導向友善起點。今日進度改由獨立 role=status 承載。
      if (p.lastRoute && ROUTE_NAMES[p.lastRoute]) {
        $('hero-eyebrow').textContent = '繼續上次';
        $('hero-title').textContent = ROUTE_NAMES[p.lastRoute];
        hero.setAttribute('href', p.lastRoute);
      } else {
        $('hero-eyebrow').textContent = '繼續冒險';
        $('hero-title').textContent = '挑一個科目繼續玩 ▶';
        hero.setAttribute('href', RETURN_START.href);
      }
      $('hero-icon').textContent = '▶️';
      $('hero-sub').textContent = '';
      // 具體化今日任務 chip 列（下方 chip 已點名科目）；hero-status 只講進度，不重複科目名，避免與 chip 字面重複。
      renderHeroTasks(p, true);
      if (heroStatus) heroStatus.textContent = dailyLine;
      if (parentNote) { parentNote.hidden = true; parentNote.textContent = ''; }
    } else {
      // 首訪：導向「生活安全」友善起點；eyebrow 用全形「？」且與 title 不重複；隱藏「今日任務 0%」noise。
      $('hero-eyebrow').textContent = '第一次來？';
      $('hero-title').textContent = '先看最要緊的「' + FRIENDLY_START.name + '」 ▶';
      $('hero-sub').textContent = '放輕鬆看，一次幾分鐘就好，這些本領會一直保護你。';
      hero.setAttribute('href', FRIENDLY_START.href);
      $('hero-icon').textContent = '🛡️';
      renderHeroTasks(p, false);   // 首訪：隱藏任務列，保持乾淨無 noise
      if (heroStatus) heroStatus.textContent = '';
      if (parentNote) {
        parentNote.textContent = '給家長：這是國小到高中的分科練習，孩子想練哪一科都行；免註冊、進度存在本機裝置，陪他放輕鬆練就好。';
        parentNote.hidden = false;
      }
    }

    // 成就徽章牆
    renderBadges();
  }

  // ---- bottom-sheet 共用 a11y：焦點移入 / Tab 焦點陷阱 / 關閉還原焦點（更多 & 編輯共用） ----
  var FOCUSABLE_SEL = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function getFocusable(container) {
    return Array.prototype.slice.call(container.querySelectorAll(FOCUSABLE_SEL))
      .filter(function (el) {
        return el === document.activeElement ||
          (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0);
      });
  }
  function focusFirstIn(container) {
    var f = getFocusable(container);
    if (f.length) { f[0].focus(); }
    else if (container && container.focus) { container.focus(); }
  }
  // 於指定 sheet（未 hidden 時）套用 Tab 焦點陷阱，避免焦點跑出 dialog。
  function trapTab(container, e) {
    if (e.key !== 'Tab' || !container || container.hidden) return;
    var f = getFocusable(container);
    if (!f.length) { e.preventDefault(); return; }
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first || !container.contains(document.activeElement)) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last || !container.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  }

  // ---- 頭像 / 暱稱編輯 sheet ----
  var overlay = $('edit-overlay');
  // 開啟 bottom-sheet 時，把背景三大容器設 inert + aria-hidden（縱深防護，勝過只攔 Tab；overlay 為其同層兄弟不受影響）
  function setBgInert(on) {
    ['.app-bar', '.hub', '.bottom-nav'].forEach(function (sel) {
      var el = document.querySelector(sel); if (!el) return;
      if (on) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); }
      else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }
    });
  }
  var editLastFocus = null;   // 開啟前的觸發元素，關閉時還原焦點
  function openEdit() {
    if (!G) return;
    editLastFocus = document.activeElement;
    var p = G.getProfile() || {};
    $('name-input').value = p.displayName || '';
    var grid = $('emoji-grid');
    grid.innerHTML = '';
    AVATARS.forEach(function (em) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = em;
      if (em === p.avatar) b.classList.add('sel');
      b.addEventListener('click', function () {
        Array.prototype.forEach.call(grid.children, function (c) { c.classList.remove('sel'); });
        b.classList.add('sel');
      });
      grid.appendChild(b);
    });
    overlay.hidden = false;
    setBgInert(true);
    requestAnimationFrame(function () {
      overlay.classList.add('open');
      focusFirstIn(overlay);   // 焦點移入 sheet 內首個可聚焦元素
    });
  }
  function closeEdit() {
    overlay.classList.remove('open');
    setBgInert(false);
    setTimeout(function () { overlay.hidden = true; }, 300);
    // 還原焦點至開啟前的觸發鈕
    if (editLastFocus && editLastFocus.focus) { try { editLastFocus.focus(); } catch (err) {} }
    editLastFocus = null;
  }
  function saveEdit() {
    if (!G || !G.setProfileField) { closeEdit(); return; }
    var name = ($('name-input').value || '').trim();
    if (name) G.setProfileField('displayName', name);
    var sel = $('emoji-grid').querySelector('.sel');
    if (sel) G.setProfileField('avatar', sel.textContent);
    closeEdit();
    render();
  }

  // ---- 事件綁定 ----
  $('avatar-btn').addEventListener('click', openEdit);
  $('name-btn').addEventListener('click', openEdit);
  $('edit-cancel').addEventListener('click', closeEdit);
  $('edit-save').addEventListener('click', saveEdit);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeEdit(); });

  // 夜間模式切換：改由共用 app-bar 的 [data-theme-toggle] 按鈕負責，
  // 由 game_core.js 自動綁定與圖示同步，這裡不再另設按鈕。

  // 遊戲事件 → 重繪（含跨分頁 storage 觸發的 xp 事件）
  if (G && G.on) {
    ['xp', 'levelup', 'streak', 'badge', 'daily-complete'].forEach(function (evt) {
      G.on(evt, render);
    });
  }

  // ---- 「更多」科目 bottom-sheet（沿用 edit-sheet 樣式與開合動線） ----
  var moreOverlay = $('more-overlay');
  var moreBtn = $('more-btn');
  var moreLastFocus = null;   // 開啟前的觸發元素，關閉時還原焦點
  function openMore() {
    if (!moreOverlay) return;
    moreLastFocus = document.activeElement;
    moreOverlay.hidden = false;
    setBgInert(true);
    if (moreBtn) moreBtn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () {
      moreOverlay.classList.add('open');
      focusFirstIn(moreOverlay);   // 焦點移入 sheet 內首個可聚焦元素
    });
  }
  function closeMore() {
    if (!moreOverlay) return;
    moreOverlay.classList.remove('open');
    setBgInert(false);
    if (moreBtn) moreBtn.setAttribute('aria-expanded', 'false');
    setTimeout(function () { moreOverlay.hidden = true; }, 300);
    // 還原焦點至開啟前的觸發鈕（若 focus 已在錨點導覽轉移，則不搶回）
    if (moreLastFocus && moreLastFocus.focus &&
        (moreOverlay.contains(document.activeElement) || document.activeElement === document.body)) {
      try { moreLastFocus.focus(); } catch (err) {}
    }
    moreLastFocus = null;
  }
  if (moreBtn) moreBtn.addEventListener('click', openMore);
  var moreClose = $('more-close');
  if (moreClose) moreClose.addEventListener('click', closeMore);
  if (moreOverlay) moreOverlay.addEventListener('click', function (e) { if (e.target === moreOverlay) closeMore(); });
  // Esc 關閉 + Tab 焦點陷阱：更多 & 編輯 兩個 aria-modal sheet 皆處理。
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (moreOverlay && !moreOverlay.hidden) { closeMore(); return; }
      if (overlay && !overlay.hidden) { closeEdit(); return; }
    }
    if (e.key === 'Tab') {
      if (moreOverlay && !moreOverlay.hidden) { trapTab(moreOverlay, e); return; }
      if (overlay && !overlay.hidden) { trapTab(overlay, e); return; }
    }
  });

  // ---- 統一錨點導覽：所有頁內 # 連結（skip-link / rail-nav / bottom-nav / 更多 / hero）走同一條「捲動＋聚焦」 ----
  document.addEventListener('click', function (e) {
    var a = (e.target as any).closest ? (e.target as any).closest('a[href^="#"]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!HASH_RE.test(href)) return;
    e.preventDefault();
    var inMore = moreOverlay && moreOverlay.contains(a);
    if (inMore) closeMore();
    goToHash(href);
    if (history.pushState) { try { history.pushState(null, '', href); } catch (err) {} }
  });

  // ---- 進階挑戰次層：桌面/iPad 預設展開、手機預設收合（matchMedia 判斷；opt-in 揭示非隱藏） ----
  var advDetails = Array.prototype.slice.call(document.querySelectorAll('details.adv-details'));
  var wideMq = window.matchMedia('(min-width: 1024px)');
  function syncAdvDetails() {
    advDetails.forEach(function (d) { if (!d.dataset.userToggled) d.open = wideMq.matches; });
  }
  syncAdvDetails();
  // 使用者手動展開/收合後標記該層，斷點切換（iPad 旋轉／分割畫面跨 1024px）時不再覆寫其選擇。
  advDetails.forEach(function (d) {
    var sm = d.querySelector('summary');
    if (sm) sm.addEventListener('click', function () { d.dataset.userToggled = '1'; });
  });
  if (wideMq.addEventListener) wideMq.addEventListener('change', syncAdvDetails);
  else if (wideMq.addListener) wideMq.addListener(syncAdvDetails);

  // ---- scroll-spy：IntersectionObserver 依目前所在 .path 高亮 rail-nav 與 bottom-nav，並更新 aria-current ----
  var MORE_PATHS = ['path-core', 'path-social', 'path-finance', 'path-science', 'path-tech'];
  var railLinks = Array.prototype.slice.call(document.querySelectorAll('.rail-nav a'));
  var bottomLinks = Array.prototype.slice.call(document.querySelectorAll('.bottom-nav a'));
  var currentActive = null;
  function setActive(id) {
    if (id === currentActive) return;
    currentActive = id;
    railLinks.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    var moreActive = MORE_PATHS.indexOf(id) >= 0;
    bottomLinks.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    if (moreBtn) {
      moreBtn.classList.toggle('active', moreActive);
      if (moreActive) moreBtn.setAttribute('aria-current', 'true'); else moreBtn.removeAttribute('aria-current');
    }
  }
  var spyTargets = Array.prototype.slice.call(document.querySelectorAll('#top, .path[id]'));
  if ('IntersectionObserver' in window && spyTargets.length) {
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) visible[en.target.id] = en.boundingClientRect.top;
        else delete visible[en.target.id];
      });
      // 取目前落在觀測帶內、最靠近頂端的區段當「你在這裡」。
      var pick = null, pickTop = Infinity;
      spyTargets.forEach(function (t) {
        if (t.id in visible) {
          var top = t.getBoundingClientRect().top;
          if (top < pickTop) { pickTop = top; pick = t.id; }
        }
      });
      // 在頁面最上方時，觀測帶可能已越過 #top 而選到下方區段；此時一律以「最上」為準。
      if (window.scrollY < 80) setActive('top');
      else if (pick) setActive(pick);
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    spyTargets.forEach(function (t) { spy.observe(t); });
    // 捲回頁面最上方時，觀測帶內可能沒有任何區段；直接把「首頁/最上」標為目前位置。
    window.addEventListener('scroll', function () {
      if (window.scrollY < 80) setActive('top');
    }, { passive: true });
  }

  // ---- hashchange：手動改網址列 hash（或前進/後退）到任何區段都重跑「捲動＋聚焦」，與點擊一致 ----
  window.addEventListener('hashchange', function () { scrollToHash(); });

  render();
  // 首次載入即帶 #path-xxx 深連結時，於非同步內容（徽章牆）渲染後校正最終位置並移焦點。
  if (location.hash) scrollToHash();
  else setActive('top');
})();
