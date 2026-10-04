// @ts-nocheck — 機械式 legacy JS→TS 遷移：verbatim 轉檔、行為等價；型別檢查延後
/* =====================================================================
 * multiply.ts  →  (tsc) →  multiply.js
 * 原為 multiply.html 的多個 inline <script> 區塊（連續、同一全域 scope）；
 * 依原順序合併成單一 sibling .js（保留全域 scope 與 onclick 參照、不加 IIFE）。
 * 行為與原 inline 版等價。
 * ===================================================================== */
// ====================================================================
// DATA DEFINITIONS
// ====================================================================
const STAGES = [
    { id: 1, name: '九九乘法 ①', desc: '1~9 × 1~5', gen: () => genPairs(1, 9, 1, 5) },
    { id: 2, name: '九九乘法 ②', desc: '1~9 × 6~9', gen: () => genPairs(1, 9, 6, 9) },
    { id: 3, name: '×10 系列', desc: '進階：1~9 × 10', gen: () => genFixed(10, 1, 9) },
    { id: 4, name: '×11 系列', desc: '進階：11×1 ~ 11×9', gen: () => genFixed(11, 1, 9) },
    { id: 5, name: '×12 系列', desc: '進階：12×1 ~ 12×9', gen: () => genFixed(12, 1, 9) },
    { id: 6, name: '×13 系列', desc: '進階：13×1 ~ 13×9', gen: () => genFixed(13, 1, 9) },
    { id: 7, name: '×14 系列', desc: '進階：14×1 ~ 14×9', gen: () => genFixed(14, 1, 9) },
    { id: 8, name: '×15 系列', desc: '進階：15×1 ~ 15×9', gen: () => genFixed(15, 1, 9) },
    { id: 9, name: '×16 系列', desc: '進階：16×1 ~ 16×9', gen: () => genFixed(16, 1, 9) },
    { id: 10, name: '×17 系列', desc: '進階：17×1 ~ 17×9', gen: () => genFixed(17, 1, 9) },
    { id: 11, name: '×18 系列', desc: '進階：18×1 ~ 18×9', gen: () => genFixed(18, 1, 9) },
    { id: 12, name: '×19 系列', desc: '進階：19×1 ~ 19×9', gen: () => genFixed(19, 1, 9) },
    { id: 13, name: '11~15 互乘', desc: '進階：11×11 ~ 15×15', gen: () => genPairs(11, 15, 11, 15) },
    { id: 14, name: '11~15 × 16~19', desc: '進階：大數混合', gen: () => genPairs(11, 15, 16, 19) },
    { id: 15, name: '16~19 互乘', desc: '進階挑戰關', gen: () => genPairs(16, 19, 16, 19) },
    { id: 16, name: '👑 BOSS', desc: '進階：1~19全部隨機', gen: () => genPairs(1, 19, 1, 19) }
];
const RANKS = [
    { min: 0, max: 99, title: '乘法新手上路', icon: '🐣' },
    { min: 100, max: 299, title: '計算新手', icon: '🌱' },
    { min: 300, max: 599, title: '九九戰士', icon: '⚔️' },
    { min: 600, max: 999, title: '乘法達人', icon: '🌟' },
    { min: 1000, max: 1999, title: '心算高手', icon: '🔥' },
    { min: 2000, max: 3499, title: '大九九王者', icon: '👑' },
    { min: 3500, max: Infinity, title: '乘法之神', icon: '🏆' }
];
// ====================================================================
// STATE
// ====================================================================
let progress = loadProgress();
let currentGame = null;
let soundEnabled = true;
let audioCtx = null;
let tableAnswersHidden = false;
let tableMax = 9;
let answerTimeout = null;
// ====================================================================
// PERSISTENCE
// ====================================================================
function getDefaultProgress() {
    return { stages: {}, mastery: {}, mistakes: {}, totalCorrect: 0, totalAttempts: 0, bestSpeed: 0, exp: 0 };
}
function loadProgress() {
    try {
        const s = localStorage.getItem('mult_progress');
        if (s) {
            const p = JSON.parse(s);
            // Ensure all fields exist
            return Object.assign(Object.assign({}, getDefaultProgress()), p);
        }
    }
    catch (e) { }
    return getDefaultProgress();
}
function saveProgress() {
    try {
        localStorage.setItem('mult_progress', JSON.stringify(progress));
    }
    catch (e) { }
}
function resetProgress() {
    if (confirm('確定要重置所有進度嗎？此操作無法復原！')) {
        progress = getDefaultProgress();
        saveProgress();
        updateHomeStats();
    }
}
// ====================================================================
// AUDIO (Web Audio API)
// ====================================================================
function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended')
        audioCtx.resume();
    return audioCtx;
}
function playSound(type) {
    if (!soundEnabled)
        return;
    try {
        const ctx = getAudioCtx();
        const now = ctx.currentTime;
        if (type === 'click') {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g);
            g.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            g.gain.setValueAtTime(0.08, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.start(now);
            osc.stop(now + 0.04);
        }
        else if (type === 'correct') {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g);
            g.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
            g.gain.setValueAtTime(0.25, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        }
        else if (type === 'wrong') {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.connect(g);
            g.connect(ctx.destination);
            osc.type = 'sine'; /* 柔和音色，避免鋸齒波「失敗蜂鳴」的懲罰感（與全書去懲罰化一致） */
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);
            g.gain.setValueAtTime(0.15, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        }
        else if (type === 'combo') {
            [660, 880, 1100].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.connect(g);
                g.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.06);
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.2, now + i * 0.06);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.1);
                osc.start(now + i * 0.06);
                osc.stop(now + i * 0.06 + 0.1);
            });
        }
        else if (type === 'stageClear') {
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.connect(g);
                g.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.12);
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.25, now + i * 0.12);
                g.gain.setValueAtTime(0.25, now + i * 0.12 + 0.1);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
                osc.start(now + i * 0.12);
                osc.stop(now + i * 0.12 + 0.3);
            });
        }
        else if (type === 'levelup') {
            const notes = [440, 554, 659, 880];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.connect(g);
                g.connect(ctx.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + i * 0.1);
                g.gain.setValueAtTime(0, now);
                g.gain.linearRampToValueAtTime(0.2, now + i * 0.1);
                g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.2);
            });
        }
    }
    catch (e) { }
}
function toggleSound() {
    soundEnabled = !soundEnabled;
    var b = document.getElementById('soundToggle');
    b.textContent = soundEnabled ? '🔊' : '🔇';
    b.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
    if (soundEnabled)
        playSound('click');
}
// ====================================================================
// HELPERS
// ====================================================================
function genPairs(a1, a2, b1, b2) {
    const p = [];
    for (let a = a1; a <= a2; a++)
        for (let b = b1; b <= b2; b++)
            p.push([a, b]);
    return p;
}
function genFixed(n, b1, b2) {
    const p = [];
    for (let b = b1; b <= b2; b++) {
        p.push([n, b]);
        p.push([b, n]);
    }
    // deduplicate
    const seen = new Set();
    return p.filter(([a, b]) => { const k = a + ',' + b; if (seen.has(k))
        return false; seen.add(k); return true; });
}
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function getRank(exp) {
    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (exp >= RANKS[i].min)
            return Object.assign(Object.assign({}, RANKS[i]), { index: i });
    }
    return Object.assign(Object.assign({}, RANKS[0]), { index: 0 });
}
function getNextRank(exp) {
    const current = getRank(exp);
    if (current.index < RANKS.length - 1)
        return RANKS[current.index + 1];
    return null;
}
function isStageUnlocked(stageId) {
    // 所有關卡永遠開放，不受前一關是否過關限制（避免重新整理後被鎖住）
    return true;
}
function masteryKey(a, b) {
    return Math.min(a, b) + '×' + Math.max(a, b);
}
function getMasteryLevel(key) {
    const c = progress.mastery[key] || 0;
    if (c >= 3)
        return 'mastered';
    if (c >= 1)
        return 'learning';
    return 'not-attempted';
}
function countStagesCleared() {
    return Object.values(progress.stages).filter(s => s > 0).length;
}
// ====================================================================
// NAVIGATION
// ====================================================================
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    // 遊戲畫面右上角已有離開鈕，隱藏固定音效鈕避免重疊誤觸
    const st = document.getElementById('soundToggle');
    if (st)
        st.style.display = (id === 'gameScreen') ? 'none' : 'block';
}
function goHome() {
    cleanupGame();
    showScreen('homeScreen');
    updateHomeStats();
}
function cleanupGame() {
    if (answerTimeout) {
        clearTimeout(answerTimeout);
        answerTimeout = null;
    }
    if (currentGame && currentGame.timer) {
        clearInterval(currentGame.timer);
        currentGame.timer = null;
    }
    currentGame = null;
}
// ====================================================================
// HOME SCREEN
// ====================================================================
function updateHomeStats() {
    // 成長條改由統一角色（Game.getProfile）驅動，讓乘法頁與其他科目共用同一等級/經驗值。
    // 若引擎不可用（離線/舊環境），回退到本頁 legacy 的 mult_progress.exp 排名系統。
    const G = window.Game;
    const p = (G && G.getProfile) ? G.getProfile() : null;
    if (p && p.derived) {
        const d = p.derived;
        document.getElementById('rankDisplay').textContent =
            (d.rankIcon || '🌱') + ' ' + (d.rankName || '探險新手') + ' · 第 ' + (p.level || 1) + ' 級';
        document.getElementById('expBarFill').style.width = Math.round((d.levelProgress || 0) * 100) + '%';
        document.getElementById('expLabel').textContent = d.isMaxLevel
            ? '經驗值 ' + (p.totalXp || 0) + '（已達最高等級！）'
            : '經驗值 ' + (p.totalXp || 0) + '　距離下一級還差 ' + (d.xpToNext || 0);
    }
    else {
        const rank = getRank(progress.exp);
        const next = getNextRank(progress.exp);
        document.getElementById('rankDisplay').textContent = rank.icon + ' ' + rank.title;
        // EXP bar（legacy 回退）
        let pct = 100;
        let label = '經驗值 ' + progress.exp + ' (MAX)';
        if (next) {
            const range = next.min - rank.min;
            const current = progress.exp - rank.min;
            pct = Math.min(100, Math.round(current / range * 100));
            label = '經驗值 ' + progress.exp + ' / ' + next.min + ' (→ ' + next.icon + ' ' + next.title + ')';
        }
        document.getElementById('expBarFill').style.width = pct + '%';
        document.getElementById('expLabel').textContent = label;
    }
    document.getElementById('statCorrect').textContent = progress.totalCorrect;
    const acc = progress.totalAttempts > 0 ? Math.round(progress.totalCorrect / progress.totalAttempts * 100) : 0;
    document.getElementById('statAccuracy').textContent = acc + '%';
    document.getElementById('statStages').textContent = countStagesCleared() + '/16';
    document.getElementById('statBest').textContent = progress.bestSpeed;
}
// ====================================================================
// STAGE SELECT
// ====================================================================
function showStageSelect() {
    showScreen('stageSelectScreen');
    renderStageList();
}
function renderStageList() {
    const el = document.getElementById('stageList');
    el.innerHTML = STAGES.map((stage, i) => {
        const id = stage.id;
        const stars = progress.stages[id] || 0;
        const unlocked = isStageUnlocked(id);
        const cleared = stars > 0;
        const starsStr = stars >= 3 ? '⭐⭐⭐' : stars >= 2 ? '⭐⭐☆' : stars >= 1 ? '⭐☆☆' : '☆☆☆';
        const cls = 'stage-card' + (unlocked ? '' : ' locked') + (cleared ? ' cleared' : '');
        return `<div class="${cls}" ${unlocked ? 'role="button" tabindex="0"' : ''} onclick="${unlocked ? 'startStage(' + id + ')' : ''}">
      <div class="stage-num">第 ${id} 關</div>
      <div class="stage-name">${stage.name}</div>
      <div class="stage-stars">${starsStr}</div>
    </div>`;
    }).join('');
}
// ====================================================================
// GAME ENGINE
// ====================================================================
function startStage(stageId) {
    const stage = STAGES[stageId - 1];
    const pool = stage.gen();
    let questions = shuffle(pool).slice(0, 20);
    // Pad if pool < 20
    while (questions.length < 20) {
        questions.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    questions = shuffle(questions);
    currentGame = {
        mode: 'stage', stageId, questions,
        idx: 0, score: 0, combo: 0, maxCombo: 0, correct: 0, total: 20,
        input: '', answered: false, qStart: 0, hintUsed: false
    };
    enterGameScreen(false);
}
function startSpeedMode() {
    // Use all unlocked stage pools
    let pool = [];
    for (let i = 0; i < STAGES.length; i++) {
        if (isStageUnlocked(STAGES[i].id))
            pool.push(...STAGES[i].gen());
    }
    if (pool.length === 0)
        pool = genPairs(1, 9, 1, 9);
    // Deduplicate
    const seen = new Set();
    pool = pool.filter(([a, b]) => { const k = a + ',' + b; if (seen.has(k))
        return false; seen.add(k); return true; });
    currentGame = {
        mode: 'speed', pool,
        idx: 0, score: 0, combo: 0, maxCombo: 0, correct: 0, total: 0,
        input: '', answered: false, qStart: 0, hintUsed: false,
        timeLeft: 60, timer: null, startTime: 0, currentPair: null
    };
    enterGameScreen(true);
    nextSpeedQuestion();
    currentGame.startTime = Date.now();
    currentGame.timer = setInterval(speedTick, 50);
}
function startWeaknessDrill() {
    const weak = getWeakItems().slice(0, 10);
    if (weak.length === 0)
        return;
    let questions = [];
    weak.forEach(w => {
        const [a, b] = w.key.split('×').map(Number);
        questions.push([a, b]);
        questions.push([a, b]);
        if (a !== b)
            questions.push([b, a]);
    });
    while (questions.length < 20 && weak.length > 0) {
        const w = weak[Math.floor(Math.random() * weak.length)];
        const [a, b] = w.key.split('×').map(Number);
        questions.push([a, b]);
    }
    questions = shuffle(questions).slice(0, 20);
    currentGame = {
        mode: 'weakness', questions,
        idx: 0, score: 0, combo: 0, maxCombo: 0, correct: 0, total: questions.length,
        input: '', answered: false, qStart: 0, hintUsed: false
    };
    enterGameScreen(false);
}
function enterGameScreen(showTimer) {
    showScreen('gameScreen');
    document.getElementById('timerBarContainer').style.display = showTimer ? 'block' : 'none';
    if (showTimer)
        document.getElementById('timerBarFill').style.width = '100%';
    document.getElementById('hintBtn').style.display = (currentGame.mode === 'speed') ? 'none' : 'block';
    showCurrentQuestion();
}
function showCurrentQuestion() {
    if (!currentGame)
        return;
    let pair;
    if (currentGame.mode === 'speed') {
        pair = currentGame.currentPair;
    }
    else {
        if (currentGame.idx >= currentGame.total) {
            endGame();
            return;
        }
        pair = currentGame.questions[currentGame.idx];
    }
    if (!pair)
        return;
    currentGame.currentPair = pair;
    currentGame.input = '';
    currentGame.answered = false;
    currentGame.hintUsed = false;
    currentGame.qStart = Date.now();
    const qEl = document.getElementById('questionText');
    qEl.textContent = pair[0] + ' × ' + pair[1];
    qEl.className = 'question-text';
    document.getElementById('answerDisplay').textContent = '';
    document.getElementById('answerDisplay').className = 'answer-display';
    document.getElementById('feedbackText').textContent = '';
    document.getElementById('feedbackText').style.color = '';
    updateGameUI();
}
function nextSpeedQuestion() {
    if (!currentGame || currentGame.mode !== 'speed')
        return;
    const pair = currentGame.pool[Math.floor(Math.random() * currentGame.pool.length)];
    currentGame.currentPair = pair;
    currentGame.total++;
    showCurrentQuestion();
}
function speedTick() {
    if (!currentGame)
        return;
    const elapsed = (Date.now() - currentGame.startTime) / 1000;
    const remaining = Math.max(0, 60 - elapsed);
    currentGame.timeLeft = remaining;
    const pct = (remaining / 60) * 100;
    document.getElementById('timerBarFill').style.width = pct + '%';
    if (remaining <= 0) {
        clearInterval(currentGame.timer);
        currentGame.timer = null;
        endGame();
    }
}
function updateGameUI() {
    if (!currentGame)
        return;
    const comboEl = document.getElementById('gameCombo');
    if (currentGame.combo >= 10) {
        comboEl.innerHTML = '<span class="combo-fire">⚡</span> x' + currentGame.combo;
    }
    else if (currentGame.combo >= 5) {
        comboEl.innerHTML = '<span class="combo-fire">🔥</span> x' + currentGame.combo;
    }
    else if (currentGame.combo >= 3) {
        comboEl.textContent = '🔥 x' + currentGame.combo;
    }
    else {
        comboEl.textContent = '';
    }
    document.getElementById('gameScore').textContent = currentGame.score + ' 分';
    if (currentGame.mode === 'speed') {
        document.getElementById('gameProgress').textContent = '答對: ' + currentGame.correct;
    }
    else {
        document.getElementById('gameProgress').textContent = '第 ' + (currentGame.idx + 1) + ' / ' + currentGame.total + ' 題';
    }
}
// ====================================================================
// INPUT HANDLING
// ====================================================================
function numpadInput(key) {
    if (!currentGame || currentGame.answered)
        return;
    if (key === 'back') {
        playSound('click');
        currentGame.input = currentGame.input.slice(0, -1);
        document.getElementById('answerDisplay').textContent = currentGame.input;
    }
    else if (key === 'enter') {
        if (currentGame.input === '')
            return;
        playSound('click');
        submitAnswer();
    }
    else {
        if (currentGame.input.length >= 3)
            return;
        playSound('click');
        currentGame.input += key;
        document.getElementById('answerDisplay').textContent = currentGame.input;
    }
}
function submitAnswer() {
    if (!currentGame || currentGame.answered)
        return;
    currentGame.answered = true;
    const pair = currentGame.currentPair;
    const correctAnswer = pair[0] * pair[1];
    const userAnswer = parseInt(currentGame.input, 10);
    const timeTaken = (Date.now() - currentGame.qStart) / 1000;
    const key = masteryKey(pair[0], pair[1]);
    progress.totalAttempts++;
    if (userAnswer === correctAnswer) {
        handleCorrect(pair, key, timeTaken);
    }
    else {
        handleWrong(pair, key, correctAnswer, userAnswer);
    }
    saveProgress();
}
function handleCorrect(pair, key, timeTaken) {
    currentGame.correct++;
    currentGame.combo++;
    if (currentGame.combo > currentGame.maxCombo)
        currentGame.maxCombo = currentGame.combo;
    progress.totalCorrect++;
    progress.mastery[key] = (progress.mastery[key] || 0) + 1;
    try {
        if (window.Stardex)
            Stardex.onAnswer(pair[0], pair[1], true);
    }
    catch (e) { }
    // 統一記帳：乘法歸入「數學」科目，讓經驗值/等級跨頁共用（§4.4）。
    // legacy mult_progress.exp 仍照舊累加，但已由 data-game-wired="mult" 抑制引擎重複補發。
    try {
        if (window.Game && Game.recordAnswer)
            Game.recordAnswer('math', true);
    }
    catch (e) { }
    // Points calculation
    let points = 10;
    if (timeTaken <= 3)
        points += 5; // speed bonus
    // Combo multiplier: 1, 1.5, 2, 2.5, 3 (max)
    const mult = Math.min(3, 1 + (currentGame.combo - 1) * 0.5);
    points = Math.round(points * mult);
    currentGame.score += points;
    // Check rank up before adding exp
    const oldRank = getRank(progress.exp);
    progress.exp += points;
    const newRank = getRank(progress.exp);
    // Visual feedback
    document.getElementById('questionText').classList.add('correct-flash');
    document.getElementById('answerDisplay').classList.add('correct-border');
    let feedbackMsg = '✓ +' + points;
    if (timeTaken <= 3)
        feedbackMsg += ' ⚡快速！';
    if (currentGame.combo >= 5)
        feedbackMsg += ' 🔥連擊x' + currentGame.combo;
    document.getElementById('feedbackText').textContent = feedbackMsg;
    document.getElementById('feedbackText').style.color = 'var(--ink)';
    showPointsFly('+' + points);
    if (currentGame.combo >= 5)
        playSound('combo');
    else
        playSound('correct');
    // Rank up notification
    if (newRank.index > oldRank.index) {
        setTimeout(() => playSound('levelup'), 300);
    }
    updateGameUI();
    answerTimeout = setTimeout(() => advanceQuestion(), 500);
}
function handleWrong(pair, key, correctAnswer, userAnswer) {
    currentGame.combo = 0;
    // 答錯不扣分（連擊已歸零），避免讓孩子有被懲罰的感覺
    progress.mistakes[key] = (progress.mistakes[key] || 0) + 1;
    try {
        if (window.Stardex)
            Stardex.onAnswer(pair[0], pair[1], false);
    }
    catch (e) { }
    document.getElementById('questionText').classList.add('wrong-shake');
    document.getElementById('answerDisplay').classList.add('wrong-border');
    document.getElementById('feedbackText').innerHTML =
        '正確答案是 <b>' + pair[0] + ' × ' + pair[1] + ' = ' + correctAnswer + '</b>，再記一次就會囉！';
    document.getElementById('feedbackText').style.color = 'var(--ink)';
    playSound('wrong');
    updateGameUI();
    answerTimeout = setTimeout(() => advanceQuestion(), 2200);
}
function advanceQuestion() {
    answerTimeout = null;
    if (!currentGame)
        return;
    if (currentGame.mode === 'speed') {
        if (currentGame.timeLeft > 0)
            nextSpeedQuestion();
    }
    else {
        currentGame.idx++;
        showCurrentQuestion();
    }
}
// 乘法策略口訣：依題目的數字給「怎麼想」的方法，引導但不直接報答案
function multStrategy(a, b) {
    var has = function (n) { return a === n || b === n; };
    var other = function (n) { return a === n ? b : a; }; // 另一個因數
    if (a === b)
        return '這是「' + a + ' 的平方」（同一個數乘自己），可以特別記起來。';
    if (has(1))
        return '任何數 ×1 就等於它本身。';
    if (has(10))
        return '×10 的訣竅：在 ' + other(10) + ' 的後面加一個 0。';
    if (has(9))
        return '遇到 ×9：先算 ' + other(9) + '×10，再減掉一個 ' + other(9) + '。';
    if (has(5))
        return '遇到 ×5：先算 ' + other(5) + '×10，再除以 2（一半）。';
    if (has(2))
        return '×2 就是「加倍」：把 ' + other(2) + ' 加自己一次。';
    if (has(4))
        return '遇到 ×4：把 ' + other(4) + ' 加倍，再加倍一次。';
    if (has(6))
        return '遇到 ×6：先算 ×3，再加倍（或先加倍再 ×3）。';
    if (has(3))
        return '×3 就是把它加三次，或先加倍再多加一個它。';
    if (has(8))
        return '遇到 ×8：把 ' + other(8) + ' 連續加倍三次（×2、再×2、再×2）。';
    if (has(7))
        return '遇到 ×7：可拆成 ×5 加 ×2（' + other(7) + '×5 再加 ' + other(7) + '×2）。';
    return '可以用交換律：先算比較好背的那一個；也可以把大的拆開來算。';
}
function showHint() {
    if (!currentGame || currentGame.answered || currentGame.hintUsed)
        return;
    currentGame.hintUsed = true;
    const pair = currentGame.currentPair;
    document.getElementById('feedbackText').textContent = '💡 ' + multStrategy(pair[0], pair[1]);
    document.getElementById('feedbackText').style.color = 'var(--ink)';
}
function showPointsFly(text) {
    const area = document.getElementById('questionArea');
    const el = document.createElement('div');
    el.className = 'points-fly';
    el.textContent = text;
    el.style.left = '50%';
    el.style.top = '20%';
    el.style.transform = 'translateX(-50%)';
    area.appendChild(el);
    setTimeout(() => el.remove(), 800);
}
// ====================================================================
// END GAME
// ====================================================================
function endGame() {
    if (!currentGame)
        return;
    const mode = currentGame.mode;
    if (mode === 'stage')
        endStageGame();
    else if (mode === 'speed')
        endSpeedGame();
    else if (mode === 'weakness')
        endWeaknessGame();
    else if (mode === 'review')
        endReviewGame();
    else if (mode === 'starfocus')
        endStarFocusGame();
}
function endStageGame() {
    const { stageId, correct, score, maxCombo } = currentGame;
    let stars = 0;
    if (correct >= 19)
        stars = 3;
    else if (correct >= 17)
        stars = 2;
    else if (correct >= 15)
        stars = 1;
    const prev = progress.stages[stageId] || 0;
    if (stars > prev)
        progress.stages[stageId] = stars;
    saveProgress();
    const passed = stars > 0;
    const starsStr = stars >= 3 ? '⭐⭐⭐' : stars >= 2 ? '⭐⭐' : stars >= 1 ? '⭐' : '🌱';
    if (passed)
        playSound('stageClear');
    else
        playSound('correct');
    if (stars === 3)
        spawnConfetti();
    const nextBtn = (passed && stageId < 16)
        ? `<button class="modal-btn" onclick="closeModal(); startStage(${stageId + 1})">下一關 →</button>`
        : '';
    const newUnlock = (passed && stageId < 16 && prev === 0)
        ? `<div style="color:var(--ink); margin:8px 0; font-size:0.9rem;">🌟 過關！第 ${stageId + 1} 關也準備好囉</div>`
        : '';
    const need = Math.max(0, 15 - correct);
    showModal(`
    <h2>${passed ? '🎉 過關！' : '💪 差一點點，再來一次！'}</h2>
    <div class="modal-stars">${starsStr}</div>
    <div class="modal-score">答對 ${correct} / 20</div>
    <div class="modal-score">得分: ${score} | 最高連擊: ${maxCombo}</div>
    ${!passed ? '<div style="color:var(--ink); margin:8px 0; font-size:0.85rem;">你已經答對 ' + correct + ' 題！再答對 ' + need + ' 題就過關囉</div>' : ''}
    ${newUnlock}
    <div style="margin-top:12px;">
      <button class="modal-btn" onclick="closeModal(); startStage(${stageId})">再試一次</button>
      ${nextBtn}
    </div>
    <button class="modal-btn secondary" onclick="closeModal(); showStageSelect()">選關卡</button>
  `);
}
function endSpeedGame() {
    const { correct, score, maxCombo } = currentGame;
    const isNewBest = correct > progress.bestSpeed;
    if (isNewBest)
        progress.bestSpeed = correct;
    saveProgress();
    if (isNewBest && correct > 0)
        spawnConfetti();
    playSound(isNewBest ? 'stageClear' : 'correct');
    showModal(`
    <h2>⏱️ 時間到！</h2>
    <div style="font-size:3rem; margin:12px 0; font-weight:bold; color:var(--c-math);">${correct}</div>
    <div class="modal-score">答對 ${correct} 題 | 得分 ${score}</div>
    <div class="modal-score">最高連擊: ${maxCombo}</div>
    ${isNewBest ? '<div style="color:var(--c-star); margin:8px 0;">🏆 新紀錄！</div>' : '<div class="modal-score">個人最佳: ' + progress.bestSpeed + '</div>'}
    <div style="color:var(--ink-soft); margin:10px 0 4px; font-size:0.85rem; line-height:1.6;">計時只是換個方式練習，慢慢想、答錯都沒關係，多玩幾次自然會更快 😊</div>
    <div style="margin-top:12px;">
      <button class="modal-btn" onclick="closeModal(); startSpeedMode()">再來一次</button>
      <button class="modal-btn secondary" onclick="closeModal(); goHome()">返回</button>
    </div>
  `);
}
function endWeaknessGame() {
    const { correct, total, score } = currentGame;
    playSound(correct >= total * 0.8 ? 'stageClear' : 'correct');
    showModal(`
    <h2>🎯 特訓完成！</h2>
    <div style="font-size:2.2rem; margin:12px 0;">${correct} / ${total}</div>
    <div class="modal-score">得分: ${score}</div>
    <div style="color:var(--ink-soft); margin:8px 0; font-size:0.85rem;">多練幾次，這些乘法就會越來越熟囉！</div>
    <div style="margin-top:12px;">
      <button class="modal-btn" onclick="closeModal(); showWeaknessDrill()">繼續特訓</button>
      <button class="modal-btn secondary" onclick="closeModal(); goHome()">返回</button>
    </div>
  `);
}
function confirmQuit() {
    if (currentGame && currentGame.mode === 'speed' && currentGame.timeLeft > 0) {
        // In speed mode, quitting early ends the game
        if (currentGame.timer) {
            clearInterval(currentGame.timer);
            currentGame.timer = null;
        }
        endGame();
    }
    else {
        goHome();
    }
}
// ====================================================================
// TABLE VIEW
// ====================================================================
function showTableView() {
    showScreen('tableScreen');
    renderTable();
}
function renderTable() {
    const w = document.getElementById('tableWrapper');
    let h = '<table class="mult-table"><thead><tr><th>×</th>';
    for (let c = 1; c <= tableMax; c++)
        h += '<th>' + c + '</th>';
    h += '</tr></thead><tbody>';
    for (let r = 1; r <= tableMax; r++) {
        h += '<tr><td>' + r + '</td>';
        for (let c = 1; c <= tableMax; c++) {
            const key = masteryKey(r, c);
            const level = getMasteryLevel(key);
            const val = r * c;
            const hiddenCls = tableAnswersHidden ? ' hidden-answer' : '';
            h += '<td class="' + level + hiddenCls + '" role="button" tabindex="0" onclick="practiceCell(' + r + ',' + c + ')" title="' + r + '×' + c + '=' + val + '" aria-label="' + r + '乘以' + c + '，練習這一格">' + val + '</td>';
        }
        h += '</tr>';
    }
    h += '</tbody></table>';
    w.innerHTML = h;
}
function setTableRange(n) {
    tableMax = n;
    const b9 = document.getElementById('range9Btn');
    const b19 = document.getElementById('range19Btn');
    if (b9)
        b9.classList.toggle('active', n === 9);
    if (b19)
        b19.classList.toggle('active', n === 19);
    renderTable();
}
function toggleTableAnswers() {
    tableAnswersHidden = !tableAnswersHidden;
    const btn = document.getElementById('toggleAnswersBtn');
    btn.textContent = tableAnswersHidden ? '顯示答案' : '隱藏答案';
    btn.classList.toggle('active', tableAnswersHidden);
    renderTable();
}
function resetTableView() {
    tableAnswersHidden = false;
    document.getElementById('toggleAnswersBtn').textContent = '隱藏答案';
    document.getElementById('toggleAnswersBtn').classList.remove('active');
    renderTable();
}
function practiceCell(r, c) {
    // Create a mini practice with this cell and neighbors
    let questions = [];
    // Add the target multiple times
    for (let i = 0; i < 5; i++)
        questions.push([r, c]);
    // Add neighbors
    for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
            if (dr === 0 && dc === 0)
                continue;
            const nr = r + dr, nc = c + dc;
            if (nr >= 1 && nr <= 19 && nc >= 1 && nc <= 19 && Math.abs(dr) + Math.abs(dc) <= 2) {
                questions.push([nr, nc]);
            }
        }
    }
    questions = shuffle(questions).slice(0, 10);
    currentGame = {
        mode: 'weakness', questions,
        idx: 0, score: 0, combo: 0, maxCombo: 0, correct: 0, total: questions.length,
        input: '', answered: false, qStart: 0, hintUsed: false
    };
    enterGameScreen(false);
}
// ====================================================================
// WEAKNESS DRILL
// ====================================================================
function showWeaknessDrill() {
    showScreen('weaknessScreen');
    renderWeaknessList();
}
function getWeakItems() {
    return Object.entries(progress.mistakes)
        .map(([key, wrongCount]) => {
        const correctCount = progress.mastery[key] || 0;
        // Show items where wrong count is significant relative to correct count
        const ratio = wrongCount / Math.max(1, correctCount);
        return { key, wrongCount, correctCount, ratio };
    })
        .filter(item => item.wrongCount > 0 && item.ratio > 0.3)
        .sort((a, b) => b.wrongCount - a.wrongCount || b.ratio - a.ratio);
}
function renderWeaknessList() {
    const list = document.getElementById('weaknessList');
    const items = getWeakItems().slice(0, 20);
    if (items.length === 0) {
        list.innerHTML = '<div class="no-weakness">🎉 目前沒有明顯弱點！<br><br>繼續闖關練習，<br>系統會自動記錄需要加強的乘法。</div>';
        document.getElementById('startDrillBtn').style.display = 'none';
        return;
    }
    list.innerHTML = items.map(item => {
        const [a, b] = item.key.split('×').map(Number);
        return `<div class="weakness-item">
      <span class="problem">${item.key} = ${a * b}</span>
      <span class="count">再練 ${item.wrongCount} 次就熟囉</span>
    </div>`;
    }).join('');
    document.getElementById('startDrillBtn').style.display = 'block';
}
// ====================================================================
// MODAL
// ====================================================================
function showModal(html) {
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modalOverlay').classList.add('show');
}
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('show');
}
function handleModalOverlayClick(e) {
    if (e.target === document.getElementById('modalOverlay')) {
        // Don't close on overlay click during game to prevent accidental dismissal
    }
}
// ====================================================================
// CONFETTI
// ====================================================================
function spawnConfetti() {
    const colors = ['#ff5252', '#ff4081', '#e040fb', '#7c4dff', '#448aff', '#69f0ae', '#ffd740', '#ff6e40'];
    const shapes = ['circle', 'rect', 'triangle'];
    for (let i = 0; i < 60; i++) {
        const el = document.createElement('div');
        el.className = 'confetti-piece';
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const size = 6 + Math.random() * 10;
        el.style.left = (Math.random() * 100) + 'vw';
        el.style.setProperty('--fall-duration', (2.5 + Math.random() * 2) + 's');
        el.style.setProperty('--fall-delay', (Math.random() * 0.6) + 's');
        el.style.setProperty('--spin', (360 + Math.random() * 720) + 'deg');
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.background = color;
        if (shape === 'circle')
            el.style.borderRadius = '50%';
        else if (shape === 'triangle') {
            el.style.width = '0';
            el.style.height = '0';
            el.style.background = 'transparent';
            el.style.borderLeft = (size / 2) + 'px solid transparent';
            el.style.borderRight = (size / 2) + 'px solid transparent';
            el.style.borderBottom = size + 'px solid ' + color;
        }
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 5000);
    }
}
// ====================================================================
// KEYBOARD SUPPORT (for desktop/testing)
// ====================================================================
document.addEventListener('keydown', (e) => {
    if (!currentGame || currentGame.answered)
        return;
    if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        numpadInput(e.key);
    }
    else if (e.key === 'Backspace') {
        e.preventDefault();
        numpadInput('back');
    }
    else if (e.key === 'Enter') {
        e.preventDefault();
        numpadInput('enter');
    }
});
// Prevent zoom on double tap
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300)
        e.preventDefault();
    lastTouchEnd = now;
}, false);
// Resume audio context on first interaction
document.addEventListener('touchstart', () => {
    if (audioCtx && audioCtx.state === 'suspended')
        audioCtx.resume();
}, { once: true });
document.addEventListener('click', () => {
    if (audioCtx && audioCtx.state === 'suspended')
        audioCtx.resume();
}, { once: true });
// ====================================================================
// INIT
// ====================================================================
// 統一角色更新時（本頁記帳、升級，或其他分頁同步）即時刷新成長條。
if (window.Game && Game.on) {
    Game.on('xp', updateHomeStats);
    Game.on('levelup', updateHomeStats);
}
updateHomeStats();
/* ---- (下一個原 inline <script> 區塊) ---- */
(function () {
    'use strict';
    var KEY = 'mult_stardex_v1';
    var INTERVAL = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 15 };
    var REVIEW_TARGET = 15, REVIEW_CAP = 20;
    var FAMILY_ORDER = [2, 3, 4, 5, 6, 7, 8, 9, 1];
    var MILE_XP = { first_star: 10, lit_10: 20, lit_25: 40, lit_50: 60, lit_all: 150, galaxy_all: 300 };
    var FAM_XP = 30;
    function starId(a, b) { return a + '×' + b; }
    function today() {
        try {
            if (window.Game && Game.localDate)
                return Game.localDate();
        }
        catch (e) { }
        return new Date().toISOString().slice(0, 10);
    }
    function addDays(dateStr, n) {
        var d = new Date(dateStr + 'T00:00:00');
        d.setDate(d.getDate() + n);
        try {
            if (window.Game && Game.localDate)
                return Game.localDate(d);
        }
        catch (e) { }
        return d.toISOString().slice(0, 10);
    }
    function reduceMotion() {
        try {
            return !!(window.Game && Game.getProfile && Game.getProfile().settings && Game.getProfile().settings.reduceMotion);
        }
        catch (e) {
            return false;
        }
    }
    var data = null;
    function freshStars() {
        var stars = {};
        for (var a = 1; a <= 9; a++) {
            for (var b = 1; b <= 9; b++) {
                stars[starId(a, b)] = { a: a, b: b, box: 0, lit: false, lastReviewedDate: null, dueDate: null, timesCorrect: 0, timesSeen: 0 };
            }
        }
        return stars;
    }
    function load() {
        var raw = null;
        try {
            raw = localStorage.getItem(KEY);
        }
        catch (e) { }
        if (raw) {
            try {
                var parsed = JSON.parse(raw);
                if (parsed && parsed.stars) {
                    data = parsed;
                    ensureAllStars();
                    return;
                }
            }
            catch (e) { }
        }
        // 首次建立 + 從 mult_progress.mastery 一次性遷移（不補發任何里程碑 XP）
        data = { version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), migratedFrom: null, stars: freshStars(), awarded: {} };
        migrateFromMastery();
        save();
    }
    function ensureAllStars() {
        var base = freshStars();
        for (var id in base) {
            if (!data.stars[id])
                data.stars[id] = base[id];
        }
        if (!data.awarded)
            data.awarded = {};
    }
    function migrateFromMastery() {
        var mastery = null;
        try {
            if (typeof progress !== 'undefined' && progress && progress.mastery)
                mastery = progress.mastery;
        }
        catch (e) { }
        if (!mastery)
            return;
        var t = today();
        for (var k in mastery) {
            var parts = String(k).split('×');
            if (parts.length !== 2)
                continue;
            var a = parseInt(parts[0], 10), b = parseInt(parts[1], 10);
            if (!(a >= 1 && a <= 9 && b >= 1 && b <= 9))
                continue;
            var cnt = mastery[k] | 0;
            if (cnt <= 0)
                continue;
            var box = Math.max(1, Math.min(5, cnt));
            var st = data.stars[starId(a, b)];
            st.lit = true;
            st.box = box;
            st.timesCorrect = cnt;
            st.lastReviewedDate = t;
            st.dueDate = addDays(t, INTERVAL[box]);
        }
        data.migratedFrom = 'mult_progress.mastery@' + t;
        // 將「當下已達成」的里程碑標記為已領（但不發 XP），避免老玩家一載入就爆量領獎
        markSatisfiedMilestonesAsAwarded();
    }
    function save() {
        if (!data)
            return;
        data.updatedAt = new Date().toISOString();
        try {
            localStorage.setItem(KEY, JSON.stringify(data));
        }
        catch (e) { }
    }
    // ---- 統計 ----
    function litCount() { var n = 0; for (var id in data.stars)
        if (data.stars[id].lit)
            n++; return n; }
    function box5Count() { var n = 0; for (var id in data.stars)
        if (data.stars[id].box >= 5)
            n++; return n; }
    function familyAllBox5(fam) {
        for (var b = 1; b <= 9; b++) {
            if (data.stars[starId(fam, b)].box < 5)
                return false;
        }
        return true;
    }
    function satisfiedMilestones() {
        var out = [];
        var lit = litCount(), b5 = box5Count();
        if (lit >= 1)
            out.push('first_star');
        if (lit >= 10)
            out.push('lit_10');
        if (lit >= 25)
            out.push('lit_25');
        if (lit >= 50)
            out.push('lit_50');
        if (lit >= 81)
            out.push('lit_all');
        for (var f = 1; f <= 9; f++) {
            if (familyAllBox5(f))
                out.push('fam_' + f);
        }
        if (b5 >= 81)
            out.push('galaxy_all');
        return out;
    }
    function markSatisfiedMilestonesAsAwarded() {
        var s = satisfiedMilestones();
        for (var i = 0; i < s.length; i++)
            data.awarded[s[i]] = true;
    }
    function mileXp(id) { if (id.indexOf('fam_') === 0)
        return FAM_XP; return MILE_XP[id] || 0; }
    function mileMsg(id) {
        if (id === 'first_star')
            return '🌟 點亮第一顆乘法星！';
        if (id === 'lit_10')
            return '✨ 已點亮 10 顆星！';
        if (id === 'lit_25')
            return '✨ 已點亮 25 顆星！';
        if (id === 'lit_50')
            return '✨ 已點亮 50 顆星！';
        if (id === 'lit_all')
            return '🌌 81 顆星全部點亮！';
        if (id === 'galaxy_all')
            return '👑 整片星空全部精通！';
        if (id.indexOf('fam_') === 0)
            return '⭐ ' + id.slice(4) + ' 的乘法家族全部精通！';
        return '🎉 達成新成就！';
    }
    function checkMilestones() {
        var s = satisfiedMilestones();
        for (var i = 0; i < s.length; i++) {
            var id = s[i];
            if (data.awarded[id])
                continue;
            // 先設 guard → save → 再發 XP，確保即使當下關閉頁面也不會重領
            data.awarded[id] = true;
            save();
            try {
                if (window.Game && Game.award)
                    Game.award('math', mileXp(id), { silent: true, source: 'stardex-milestone', milestone: id });
            }
            catch (e) { }
            try {
                if (window.Game && Game.showToast)
                    Game.showToast(mileMsg(id), 'success');
            }
            catch (e) { }
        }
    }
    // ---- 核心：一次作答（由 handleCorrect / handleWrong 呼叫） ----
    function onAnswer(a, b, correct) {
        if (!data)
            load();
        if (!(a >= 1 && a <= 9 && b >= 1 && b <= 9))
            return; // 只收錄 9×9 以內
        var st = data.stars[starId(a, b)];
        if (!st)
            return;
        var t = today();
        st.timesSeen++;
        if (correct) {
            st.lit = true; // 只會 false→true，永不回退
            st.box = Math.min((st.box || 0) + 1, 5);
            st.timesCorrect++;
            st.lastReviewedDate = t;
            st.dueDate = addDays(t, INTERVAL[st.box]);
        }
        else {
            // 答錯不退階、不熄滅、不扣分；只是「等一下會再見到它」
            st.dueDate = t;
        }
        save();
        if (correct)
            checkMilestones();
        if (isScreenOpen()) {
            renderGrid();
            renderSummary();
        }
        updateDueDesc();
    }
    // ---- 今日複習佇列 ----
    function dueStars(t) {
        var out = [];
        for (var id in data.stars) {
            var s = data.stars[id];
            if (s.lit && s.dueDate && s.dueDate <= t)
                out.push(s);
        }
        out.sort(function (x, y) {
            if (x.dueDate !== y.dueDate)
                return x.dueDate < y.dueDate ? -1 : 1;
            if (x.box !== y.box)
                return x.box - y.box;
            return starId(x.a, x.b) < starId(y.a, y.b) ? -1 : 1;
        });
        return out;
    }
    function dueCount() { if (!data)
        load(); return dueStars(today()).length; }
    function buildQueue() {
        var t = today();
        var due = dueStars(t);
        var queue = due.map(function (s) { return [s.a, s.b]; });
        if (queue.length < REVIEW_TARGET) {
            // 以「新星（未點亮）」依課程順序補位
            for (var fi = 0; fi < FAMILY_ORDER.length && queue.length < REVIEW_TARGET; fi++) {
                var fam = FAMILY_ORDER[fi];
                for (var b = 1; b <= 9 && queue.length < REVIEW_TARGET; b++) {
                    var s = data.stars[starId(fam, b)];
                    if (!s.lit)
                        queue.push([fam, b]);
                }
            }
        }
        return queue.slice(0, REVIEW_CAP);
    }
    // ---- 畫面 ----
    function isScreenOpen() {
        var el = document.getElementById('stardexScreen');
        return el && el.classList.contains('active');
    }
    function glyph(s) {
        if (!s.lit)
            return '☆'; // ☆
        if (s.box >= 5)
            return '🌟'; // 🌟
        return '⭐'; // ⭐
    }
    function renderGrid() {
        if (!data)
            load();
        var grid = document.getElementById('stardexGrid');
        if (!grid)
            return;
        var t = today();
        var html = '<div class="sd-cell sd-corner"></div>';
        for (var b = 1; b <= 9; b++)
            html += '<div class="sd-cell sd-head">' + b + '</div>';
        for (var a = 1; a <= 9; a++) {
            html += '<div class="sd-cell sd-head">' + a + '</div>';
            for (var c = 1; c <= 9; c++) {
                var s = data.stars[starId(a, c)];
                var due = (s.lit && s.dueDate && s.dueDate <= t) ? ' due' : '';
                html += '<div class="sd-cell sd-star box' + s.box + due + '" role="button" tabindex="0"' +
                    ' title="' + a + '×' + c + '=' + (a * c) + '"' +
                    ' onclick="Stardex.openFocus(' + a + ',' + c + ')">' + glyph(s) + '</div>';
            }
        }
        grid.innerHTML = html;
        grid.parentNode.parentNode.classList.toggle('stardex-reduce', reduceMotion());
    }
    function renderSummary() {
        var el = document.getElementById('stardexSummary');
        if (!el)
            return;
        var lit = litCount(), mastered = box5Count(), due = dueCount();
        el.innerHTML = '已點亮 <b>' + lit + '</b> / 81 顆　·　精通 <b>' + mastered + '</b> 顆' +
            (due > 0 ? '　·　今天有 <b>' + due + '</b> 顆想跟你打招呼 🔵' : '　·　今天都複習完了，明天見！');
    }
    function updateDueDesc() {
        var el = document.getElementById('stardexDueDesc');
        if (!el)
            return;
        var due = dueCount();
        el.textContent = due > 0 ? ('今天有 ' + due + ' 顆星要複習') : '今天複習完了，明天見！';
    }
    function openScreen() {
        if (!data)
            load();
        if (typeof showScreen === 'function')
            showScreen('stardexScreen');
        renderGrid();
        renderSummary();
        updateDueDesc();
    }
    function openFocus(a, b) {
        if (!data)
            load();
        var s = data.stars[starId(a, b)];
        var body = document.getElementById('starFocusBody');
        var t = today();
        var status;
        if (!s.lit)
            status = '還沒點亮，練一次就會亮起來 ✨';
        else if (s.box >= 5)
            status = '已經精通囉！（第 5 盒 🌟）';
        else
            status = '目前在第 ' + s.box + ' 盒';
        var when = '';
        if (s.lit && s.dueDate) {
            if (s.dueDate <= t)
                when = '今天適合複習 🔵';
            else
                when = '下次複習日：' + s.dueDate;
        }
        body.innerHTML =
            '<div class="star-focus-fact">' + a + ' × ' + b + ' = ' + (a * b) + '</div>' +
                '<div class="star-focus-meta">' + status + (when ? ('<br>' + when) : '') +
                '<br>答對 ' + s.timesCorrect + ' 次</div>' +
                '<button class="modal-btn" onclick="Stardex.startFocus(' + a + ',' + b + ')">✏️ 練這顆</button>';
        document.getElementById('starFocusOverlay').hidden = false;
    }
    function closeFocus() {
        var o = document.getElementById('starFocusOverlay');
        if (o)
            o.hidden = true;
    }
    // ---- 複習 / 單顆聚焦（重用既有 gameScreen 引擎） ----
    function startReview() {
        if (!data)
            load();
        closeFocus();
        var queue = buildQueue();
        if (!queue.length) {
            if (typeof showModal === 'function') {
                showModal('<h2>🌙 今天複習完了</h2><div class="modal-score">星星們都好好休息中，明天再來點亮更多吧！</div>' +
                    '<div style="margin-top:12px;"><button class="modal-btn" onclick="closeModal(); Stardex.openScreen()">看看星圖</button>' +
                    '<button class="modal-btn secondary" onclick="closeModal(); goHome()">返回</button></div>');
            }
            return;
        }
        currentGame = { mode: 'review', questions: queue, idx: 0, score: 0, combo: 0, maxCombo: 0, correct: 0, total: queue.length, input: '', answered: false, qStart: 0, hintUsed: false };
        if (typeof enterGameScreen === 'function')
            enterGameScreen(false);
    }
    function startFocus(a, b) {
        if (!data)
            load();
        closeFocus();
        currentGame = { mode: 'starfocus', questions: [[a, b]], idx: 0, score: 0, combo: 0, maxCombo: 0, correct: 0, total: 1, input: '', answered: false, qStart: 0, hintUsed: false };
        if (typeof enterGameScreen === 'function')
            enterGameScreen(false);
    }
    // 由主程式的 endGame() 分派呼叫（全域函式）
    window.endReviewGame = function () {
        var c = currentGame ? currentGame.correct : 0, tot = currentGame ? currentGame.total : 0;
        if (typeof showModal === 'function') {
            showModal('<h2>🔭 今日複習完成！</h2><div style="font-size:2rem;margin:12px 0;">' + c + ' / ' + tot + '</div>' +
                '<div class="modal-score">星星又更亮了一點 ✨</div>' +
                '<div style="margin-top:12px;"><button class="modal-btn" onclick="closeModal(); Stardex.openScreen()">回星圖</button>' +
                '<button class="modal-btn secondary" onclick="closeModal(); goHome()">← 回首頁</button></div>');
        }
        updateDueDesc();
    };
    window.endStarFocusGame = function () {
        var ok = currentGame && currentGame.correct > 0;
        if (typeof showModal === 'function') {
            showModal('<h2>' + (ok ? '⭐ 答對了！' : '💪 再記一次') + '</h2>' +
                '<div class="modal-score">' + (ok ? '這顆星又更亮了！' : '沒關係，等一下再遇到它就會更熟。') + '</div>' +
                '<div style="margin-top:12px;"><button class="modal-btn" onclick="closeModal(); Stardex.openScreen()">回星圖</button>' +
                '<button class="modal-btn secondary" onclick="closeModal(); goHome()">← 回首頁</button></div>');
        }
        updateDueDesc();
    };
    window.Stardex = {
        onAnswer: onAnswer,
        openScreen: openScreen,
        openFocus: openFocus,
        closeFocus: closeFocus,
        startReview: startReview,
        startFocus: startFocus
    };
    // 初始化（progress 於主程式解析時已載入；DOM 已就緒）
    load();
    updateDueDesc();
})();
/* ---- (下一個原 inline <script> 區塊) ---- */
/* kbd-activate-delegation: role=button 的 div 可用 Enter/空白鍵觸發 */
document.addEventListener("keydown", function (e) { if (e.key !== "Enter" && e.key !== " ")
    return; var t = e.target; if (t && t.getAttribute && t.getAttribute("role") === "button" && t.tagName !== "BUTTON" && t.tagName !== "A" && t.tagName !== "INPUT" && t.tagName !== "TEXTAREA" && !t.hasAttribute("onkeydown") && !(t.classList && t.classList.contains("numpad-btn"))) {
    e.preventDefault();
    t.click();
} });
