// @ts-nocheck — 機械式 legacy JS→TS 遷移：verbatim 轉檔、行為等價；型別檢查延後
/* cefr_flashcard__1.ts ← cefr_flashcard.html 的第 1 段連續 inline（flashcard：WORD_DATA/SRS/主程式分段，順序關鍵）。verbatim 轉檔；部分區塊以 IIFE 封裝（如 SRS store/主程式），其餘為全域 scope。 */
window.CEFR_SRS = (window.SRS && window.SRS.createStore) ? window.SRS.createStore('cefr_worddex_v1') : null;
(function () {
    var s = window.CEFR_SRS;
    if (!s)
        return;
    try {
        var cm = s.cards(), changed = false;
        for (var id in cm) {
            var c = window.SRS.ensureCard(cm[id]);
            if (c.lit && (c.scheduleBox || 0) >= 1 && c.status === 'new') {
                c.status = 'review';
                changed = true;
            }
        }
        if (changed)
            s.save();
    }
    catch (e) { }
})();
/* ---- (下一個原 inline <script> 區塊) ---- */
(function () {
    // State
    let currentLevel = null;
    let currentMode = 'flashcard';
    let cards = [];
    let currentIndex = 0;
    let knownCount = 0;
    let isFlipped = false;
    let quizScore = 0;
    let quizTotal = 0;
    let quizAnswered = false;
    let reviewMode = false; // true 時佇列來自「今日複習」
    // 共用排程 store（綁定本頁既有 key；讀時 lazy 補欄位、絕不清空）
    const store = window.CEFR_SRS || null;
    // DOM refs
    const modeToggle = document.getElementById('modeToggle');
    const progressBar = document.getElementById('progressBar');
    const welcomeMsg = document.getElementById('welcomeMsg');
    const flashcardArea = document.getElementById('flashcardArea');
    const quizArea = document.getElementById('quizArea');
    const spellArea = document.getElementById('spellArea');
    const completeScreen = document.getElementById('completeScreen');
    const cardInner = document.getElementById('cardInner');
    const flipBtn = document.getElementById('flipBtn');
    const rateButtons = document.getElementById('rateButtons');
    const btnFlashcard = document.getElementById('btnFlashcard');
    const btnQuiz = document.getElementById('btnQuiz');
    const btnSpell = document.getElementById('btnSpell');
    function reducedMotion() {
        try {
            return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        catch (e) {
            return false;
        }
    }
    // Shuffle array (Fisher-Yates)
    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
    // 由目前卡片還原穩定 id（等級 + 原始單字字串，不正規化）。
    function wordIdOf(c) { return (c._lvl || currentLevel) + '::' + c.word; }
    function currentWordId() { return wordIdOf(cards[currentIndex]); }
    // 占位 emoji：整個牌組的 emoji 若全等於單一占位值（📖），代表沒有語意插圖，
    // 就不顯示大 emoji hero，避免所有字都配同一張「書」圖而誤導。
    // 只要牌組內有任一張帶語意 emoji，就照常顯示（有語意的頁面不受影響）。
    var PLACEHOLDER_EMOJI = '📖';
    function deckHasMeaningfulEmoji(level) {
        var pack = WORD_DATA[level];
        if (!pack || !pack.words || !pack.words.length)
            return false;
        for (var i = 0; i < pack.words.length; i++) {
            var e = pack.words[i].emoji;
            if (e && e !== PLACEHOLDER_EMOJI)
                return true;
        }
        return false;
    }
    function cardEmojiHtml(card) {
        if (!card || !deckHasMeaningfulEmoji(card._lvl || currentLevel))
            return '';
        return '<div class="fc-card__emoji">' + esc(card.emoji || PLACEHOLDER_EMOJI) + '</div>';
    }
    // 雙向：偶數位「看義→回想字」(toWord)，奇數位「看字/聽音→回想義」(toMeaning)，交錯出現。
    function directionAt(i) { return (i % 2 === 0) ? 'toWord' : 'toMeaning'; }
    // 記分＋排程＋收藏＋里程碑，統一走這裡（Worddex 內部再叫 Game.recordAnswer，避免重複計分）。
    function recordRate(id, grade) { if (window.Worddex)
        window.Worddex.rate(id, grade); }
    function recordBinary(id, correct) { if (window.Worddex)
        window.Worddex.gradeBinary(id, correct); }
    // Select level：以共用排程建立佇列（到期優先＋每日新卡上限＋新舊交錯）。
    window.selectLevel = function (level) {
        if (!WORD_DATA[level])
            return;
        currentLevel = level;
        reviewMode = false;
        const words = WORD_DATA[level].words;
        words.forEach(function (c) { c._lvl = level; });
        if (store) {
            cards = store.buildSession(words, {
                dailyNew: 10, reviewCap: 20,
                idOf: function (c) { return (c._lvl || level) + '::' + c.word; }
            });
        }
        else {
            cards = shuffle(words);
        }
        // 佇列為空（今天沒有到期、也沒有新卡）→ 讓孩子仍可自由練整級。
        if (!cards.length)
            cards = shuffle(words);
        currentIndex = 0;
        knownCount = 0;
        quizScore = 0;
        quizTotal = 0;
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
        const cls = level === 'cefr_a1' ? 'a1' : level === 'cefr_a2' ? 'a2' : 'b1';
        const btn = document.querySelector('.level-btn.' + cls);
        if (btn)
            btn.classList.add('active');
        welcomeMsg.classList.add('hidden');
        modeToggle.classList.remove('hidden');
        progressBar.classList.remove('hidden');
        completeScreen.classList.add('hidden');
        showCurrentMode();
    };
    // Switch mode
    window.switchMode = function (mode) {
        currentMode = mode;
        if (currentIndex >= cards.length) {
            currentIndex = 0;
            knownCount = 0;
        } // 牌組已練完時切模式：重設位置，否則新模式一進去就撞到「已完成」守衛、顯示假的「結果 0/0 正確」死結，無法在同一牌組換模式練
        quizScore = 0;
        quizTotal = 0; // quiz 與 spell 共用計分，切換模式要歸零，否則進度列與「結果 X/Y 正確」會把兩個活動的答對數混在一起
        btnFlashcard.classList.toggle('active', mode === 'flashcard');
        btnQuiz.classList.toggle('active', mode === 'quiz');
        btnSpell.classList.toggle('active', mode === 'spell');
        showCurrentMode();
    };
    function showCurrentMode() {
        completeScreen.classList.add('hidden');
        progressBar.classList.remove('hidden'); // 每次進入活動都還原進度條：showComplete 完成牌卡會隱藏它,但完成後切換模式(switchMode 重設 currentIndex 開新一輪)只走這裡,不還原的話整輪都沒有進度/分數指示
        flashcardArea.classList.toggle('hidden', currentMode !== 'flashcard');
        quizArea.classList.toggle('hidden', currentMode !== 'quiz');
        spellArea.classList.toggle('hidden', currentMode !== 'spell');
        if (currentMode === 'flashcard')
            showFlashcard();
        else if (currentMode === 'quiz')
            showQuiz();
        else
            showSpell();
    }
    function playAudioSafely(src) {
        try {
            const p = new Audio(src).play();
            if (p && typeof p.catch === 'function')
                p.catch(function () { });
        }
        catch (e) { /* ignore playback errors */ }
    }
    function audioName(word) { return word.replace(/ /g, '_').replace(/\//g, '_'); }
    window.playWordAudio = function () {
        const c = cards[currentIndex];
        if (!c)
            return;
        const lvl = c._lvl || currentLevel;
        playAudioSafely('audio/word_' + lvl + '_' + audioName(c.word) + '.mp3');
    };
    window.playSentenceAudio = function () {
        const c = cards[currentIndex];
        if (!c)
            return;
        const lvl = c._lvl || currentLevel;
        playAudioSafely('audio/sent_' + lvl + '_' + audioName(c.word) + '.mp3');
    };
    // --- FLASHCARD MODE（audio-first 正面；雙向交錯）---
    function showFlashcard() {
        if (currentIndex >= cards.length) {
            showComplete();
            return;
        }
        const card = cards[currentIndex];
        const dir = directionAt(currentIndex);
        isFlipped = false;
        cardInner.classList.remove('flipped');
        flipBtn.classList.remove('hidden');
        rateButtons.classList.add('hidden');
        const front = document.getElementById('cardFront');
        const back = document.getElementById('cardBack');
        const audioBtn = '<button class="fc-audio fc-audio--lg" onclick="event.stopPropagation();playWordAudio()" aria-label="播放單字發音">🔊</button>';
        const sentAudio = '<button class="fc-audio fc-audio--sm" onclick="event.stopPropagation();playSentenceAudio()" aria-label="播放例句發音">🔊</button>';
        if (dir === 'toMeaning') {
            // 看字/聽音 → 回想義（audio-first：正面顯示單字＋發音鈕，開卡自動播一次）
            front.innerHTML =
                '<div class="fc-card__hint">這個字是什麼意思？</div>' +
                    '<div class="fc-card__word">' + esc(card.word) + '</div>' +
                    audioBtn +
                    '<div class="fc-card__tap">點擊翻面看中文 👆</div>';
            back.innerHTML =
                cardEmojiHtml(card) +
                    '<div class="fc-card__cn">' + esc(card.chinese || '') + '</div>' +
                    '<div class="fc-card__hint">' + esc(card.definition) + '</div>' +
                    '<div style="display:flex;align-items:center;gap:var(--s2);flex-wrap:wrap;justify-content:center">' +
                    '<span class="sentence-text">' + card.sentence + '</span>' + sentAudio + '</div>';
        }
        else {
            // 看義 → 回想字
            front.innerHTML =
                '<div class="fc-card__hint">Definition</div>' +
                    '<div class="fc-card__hint" style="color:var(--ink);font-size:clamp(19px,4.5vw,24px)">' + esc(card.definition) + '</div>' +
                    (card.chinese ? '<div class="fc-card__cn">' + esc(card.chinese) + '</div>' : '') +
                    '<div class="fc-card__tap">點擊翻面看單字 👆</div>';
            back.innerHTML =
                cardEmojiHtml(card) +
                    '<div style="display:flex;align-items:center;gap:var(--s2);flex-wrap:wrap;justify-content:center">' +
                    '<span class="fc-card__word" style="color: var(--c-english-ink)">' + esc(card.word) + '</span>' + audioBtn + '</div>' +
                    '<div class="fc-card__cn">' + esc(card.chinese || '') + '</div>' +
                    '<div style="display:flex;align-items:center;gap:var(--s2);flex-wrap:wrap;justify-content:center">' +
                    '<span class="sentence-text">' + card.sentence + '</span>' + sentAudio + '</div>';
        }
        // audio-first：只在「單字已顯示於正面」的方向自動播放，避免洩漏「看義猜字」的答案。
        if (dir === 'toMeaning')
            window.playWordAudio();
        updateProgress();
    }
    window.flipCard = function () {
        isFlipped = !isFlipped;
        cardInner.classList.toggle('flipped', isFlipped);
        flipBtn.classList.toggle('hidden', isFlipped);
        rateButtons.classList.toggle('hidden', !isFlipped);
    };
    // 三級自評 → 排程（again 退盒＋本 session 內位移重現；good/easy 進盒推進）
    window.rateCard = function (grade) {
        if (!isFlipped)
            return; // 去抖：評分鈕只在翻面後出現；評分後 showFlashcard 立刻把 isFlipped 設回 false，佇列中的第二次點擊會被擋掉，不會誤評並跳過下一張沒看過的卡
        if (currentIndex >= cards.length)
            return;
        const id = currentWordId();
        recordRate(id, grade);
        if (grade === 'again') {
            // session 內位移重插（不緊鄰重複），peakBox/lit 已由排程保護、不倒退
            const card = cards[currentIndex];
            cards.splice(currentIndex, 1);
            const insertAt = currentIndex + Math.floor(Math.random() * Math.min(5, Math.max(1, cards.length - currentIndex))) + 1;
            cards.splice(Math.min(insertAt, cards.length), 0, card);
            showFlashcard();
        }
        else {
            knownCount++;
            currentIndex++;
            showFlashcard();
        }
    };
    // --- QUIZ MODE（雙向：看義選字／看字選義）---
    // 近義守衛（與 coca/toeic/practice/vocabulary_app 一致）：中文釋義去括號後以 / 、 ， ; ／ 切成分，
    // 任一成分重疊即視為近義（如 evening 夜晚/晚上 vs 晚上、angry 生氣的/憤怒的 vs 生氣的），
    // 「看字選義」方向的誘答不可與正解同義，否則第二個正解會被判錯。
    function meaningParts(ch) { return String(ch || '').replace(/[（(][^）)]*[）)]/g, '').split(/[\/、，,;；／]/).map(function (s) { return s.trim(); }).filter(Boolean); }
    function shareMeaning(a, b) { var B = meaningParts(b); return meaningParts(a).some(function (p) { return B.indexOf(p) >= 0; }); }
    function meaningPool(exceptWord) {
        const pool = [];
        const src = (currentLevel && WORD_DATA[currentLevel]) ? WORD_DATA[currentLevel].words : cards;
        src.forEach(function (w) { if (w.word !== exceptWord && w.chinese)
            pool.push(w.chinese); });
        return pool;
    }
    function showQuiz() {
        if (currentIndex >= cards.length) {
            showComplete();
            return;
        }
        quizAnswered = false;
        const card = cards[currentIndex];
        let dir = directionAt(currentIndex);
        if (dir === 'toMeaning' && !card.chinese)
            dir = 'toWord'; // 無中文釋義的卡片不走「看字選義」，否則正解會退回英文字本身，變成自問自答
        const reveal = document.getElementById('quizReveal');
        reveal.className = 'fc-reveal';
        reveal.innerHTML = '';
        const defEl = document.getElementById('quizDefinition');
        const clozeEl = document.getElementById('quizCloze');
        let answer, options;
        if (dir === 'toMeaning') {
            // 看字選義：顯示單字，選出正確中文
            defEl.innerHTML = '<span style="color: var(--c-english-ink)">' + esc(card.word) + '</span>' +
                '<button class="fc-audio fc-audio--sm" style="margin-left:8px;vertical-align:middle" onclick="playWordAudio()" aria-label="播放單字發音">🔊</button>';
            clozeEl.textContent = '這個字是什麼意思？';
            answer = card.chinese || card.word;
            const wrong = shuffle([...new Set(meaningPool(card.word))].filter(m => m !== answer && !shareMeaning(m, answer))).slice(0, 3);
            options = shuffle([answer, ...wrong]);
        }
        else {
            // 看義選字（原方向）：優先用策劃互斥誘答，否則回退 options
            defEl.innerHTML = esc(card.definition) +
                (card.chinese ? '<div style="font-size:0.72em;color:var(--ink-soft);margin-top:6px">' + esc(card.chinese) + '</div>' : '');
            clozeEl.textContent = card.cloze || '';
            answer = card.word;
            let wrong;
            if (Array.isArray(card.distractors) && card.distractors.length >= 3) {
                wrong = shuffle(card.distractors.filter(o => o !== card.word)).slice(0, 3);
            }
            else {
                wrong = shuffle((card.options || []).filter(o => o !== card.word)).slice(0, 3);
            }
            options = shuffle([card.word, ...wrong]);
        }
        const optionsEl = document.getElementById('quizOptions');
        optionsEl.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.onclick = function () { quizAnswer(opt, answer, btn, card); };
            optionsEl.appendChild(btn);
        });
        updateProgress();
    }
    function quizAnswer(selected, correct, btnEl, card) {
        if (quizAnswered)
            return;
        quizAnswered = true;
        quizTotal++;
        const id = currentWordId();
        const reveal = document.getElementById('quizReveal');
        const ok = (selected === correct);
        if (ok) {
            quizScore++;
            recordBinary(id, true);
            btnEl.classList.add('correct');
            showConfetti();
            reveal.className = 'fc-reveal is-ok show';
            reveal.innerHTML =
                '<span class="fc-reveal__msg">太棒了，答對了！ 🎉</span>' +
                    buildRevealBody(card) +
                    '<button class="fc-reveal__next" onclick="quizNext()">繼續 →</button>';
        }
        else {
            recordBinary(id, false);
            btnEl.classList.add('wrong');
            document.querySelectorAll('.quiz-option').forEach(b => {
                if (b.textContent === correct)
                    b.classList.add('highlight');
            });
            reveal.className = 'fc-reveal is-no show';
            reveal.innerHTML =
                '<span class="fc-reveal__msg">沒關係，再看一次就記起來了！正確答案是 ' + esc(correct) + '</span>' +
                    buildRevealBody(card) +
                    '<button class="fc-reveal__next" onclick="quizNext()">繼續 →</button>';
        }
        document.querySelectorAll('.quiz-option').forEach(b => { b.disabled = true; b.setAttribute('aria-disabled', 'true'); }); // 評分後停用所有選項：原生 button 若不 disable 仍可 Tab 回去按 Enter 觸發 quizAnswer(被 quizAnswered 守衛擋成 no-op)=鍵盤可達的死按鈕(與拼字磚、practice/vocabulary_app 一致)
        const nx = reveal.querySelector('.fc-reveal__next');
        if (nx)
            nx.focus();
    }
    function buildRevealBody(card) {
        return '<div style="margin-top:var(--s2)">' +
            '<span class="fc-reveal__word">' + esc(card.word) + '</span>' +
            '<span class="fc-reveal__zh">' + esc(card.chinese || '') + '</span>' +
            '<button class="fc-audio fc-audio--sm" style="margin-left:8px;vertical-align:middle" onclick="playWordAudio()" aria-label="播放單字發音">🔊</button>' +
            '<span class="fc-reveal__sent">' + card.sentence + '</span>' +
            '</div>';
    }
    window.quizNext = function () {
        currentIndex++;
        showQuiz();
    };
    // --- SPELLING MODE（字母磚點選為預設，可切換鍵盤打字）---
    let spellState = null;
    let spellPref = (function () { try {
        return localStorage.getItem('cefr_spell_mode') || 'tiles';
    }
    catch (e) {
        return 'tiles';
    } })();
    window.toggleSpellMode = function () {
        if (spellState && spellState.graded)
            return; // 已評分的卡不可切換輸入法：showSpell 會重建成 graded:false 的空盤面（同一 currentIndex），讓已評分的字能再填再 checkSpelling，造成 recordBinary/quizTotal/quizScore 二次計分
        spellPref = (spellPref === 'tiles') ? 'type' : 'tiles';
        try {
            localStorage.setItem('cefr_spell_mode', spellPref);
        }
        catch (e) { }
        showSpell();
    };
    function isLetter(ch) { return /[a-zA-Z]/.test(ch); }
    function showSpell() {
        if (currentIndex >= cards.length) {
            showComplete();
            return;
        }
        const card = cards[currentIndex];
        const word = card.word;
        const peak = store ? (store.peek(currentWordId()).peakBox || 0) : 0;
        var spellEmojiEl = document.getElementById('spellEmoji');
        if (deckHasMeaningfulEmoji(card._lvl || currentLevel)) {
            spellEmojiEl.textContent = card.emoji || PLACEHOLDER_EMOJI;
            spellEmojiEl.style.display = '';
        }
        else {
            spellEmojiEl.textContent = '';
            spellEmojiEl.style.display = 'none';
        }
        document.getElementById('spellCn').textContent = card.chinese || '';
        document.getElementById('spellHint').textContent = card.definition || '';
        var spellToggleEl = document.getElementById('spellToggle');
        spellToggleEl.textContent = (spellPref === 'tiles') ? '⌨️ 改用鍵盤' : '🔤 改用字母磚';
        spellToggleEl.disabled = false;
        spellToggleEl.removeAttribute('aria-disabled'); // 新卡盤面可自由切換輸入法（評分後會在 checkSpelling 停用）
        const reveal = document.getElementById('spellReveal');
        reveal.className = 'fc-reveal';
        reveal.innerHTML = '';
        // 依 Leitner 高水位分層：基礎（僅正解字母，首字母提示）／進階（混誘答字母）／挖空（高盒只挖 1-2 字）
        const letterIdx = [];
        for (let i = 0; i < word.length; i++)
            if (isLetter(word[i]))
                letterIdx.push(i);
        const hintPositions = {};
        if (peak >= 5 && letterIdx.length > 2) {
            // 挖空：只留 1-2 個空槽，其餘字母預填為 readonly 提示
            const blanks = Math.min(2, Math.max(1, Math.floor(letterIdx.length / 4)));
            const blankSet = {};
            const pick = shuffle(letterIdx.slice());
            for (let k = 0; k < blanks; k++)
                blankSet[pick[k]] = true;
            letterIdx.forEach(function (pi) { if (!blankSet[pi])
                hintPositions[pi] = true; });
        }
        else if (peak < 3 && letterIdx.length > 3) {
            // 基礎：首字母提示
            hintPositions[letterIdx[0]] = true;
        }
        // 建立 slot 模型
        const slots = [];
        for (let i = 0; i < word.length; i++) {
            const ch = word[i];
            if (ch === ' ')
                slots.push({ type: 'gap' });
            else if (!isLetter(ch))
                slots.push({ type: 'sep', ch: ch });
            else if (hintPositions[i])
                slots.push({ type: 'hint', ch: ch });
            else
                slots.push({ type: 'slot', ch: ch, filled: null });
        }
        // 字母磚池：可編輯 slot 的正解字母（保留原始大小寫，否則 ID/USA 等大寫字會被組成並判「正確」成小寫 id/usa，教錯拼法；評分本就大小寫不敏感）；進階加 2-4 個誘答字母
        const allCaps = word === word.toUpperCase() && word !== word.toLowerCase(); // 全大寫字（如 ID）誘答磚也轉大寫，避免磚池大小寫混雜
        let bankLetters = slots.filter(s => s.type === 'slot').map(s => s.ch);
        if (peak >= 3) {
            let decoys = pickDecoys(word, Math.min(4, Math.max(2, Math.round(bankLetters.length / 3))));
            if (allCaps)
                decoys = decoys.map(function (c) { return c.toUpperCase(); });
            bankLetters = bankLetters.concat(decoys);
        }
        const bank = shuffle(bankLetters).map(function (ch, i) { return { ch: ch, id: 'b' + i, used: false }; });
        spellState = { word: word, slots: slots, bank: bank, mode: spellPref, graded: false };
        renderSpell();
    }
    function pickDecoys(word, n) {
        const confuse = { a: 'e', e: 'a', b: 'd', d: 'b', i: 'l', l: 'i', m: 'n', n: 'm', o: 'u', u: 'o', p: 'q', q: 'p', s: 'z', z: 's', c: 'k', k: 'c' };
        const alpha = 'abcdefghijklmnopqrstuvwxyz'.split('');
        const inWord = word.toLowerCase().split('');
        const out = [];
        inWord.forEach(function (ch) { if (confuse[ch] && out.length < n)
            out.push(confuse[ch]); });
        while (out.length < n) {
            const r = alpha[Math.floor(Math.random() * alpha.length)];
            out.push(r);
        }
        return out.slice(0, n);
    }
    function renderSpell() {
        const slotsEl = document.getElementById('spellSlots');
        const bankEl = document.getElementById('spellBank');
        slotsEl.innerHTML = '';
        slotsEl.classList.toggle('is-wrong', false);
        var letterNo = 0; // 只數「字母格」(slot/hint)，略過 gap(空格)與 sep(連字號)，aria 才會報對「第 N 個字母」
        spellState.slots.forEach(function (s, si) {
            if (s.type === 'gap') {
                const g = document.createElement('span');
                g.className = 'fc-spell__gap';
                slotsEl.appendChild(g);
                return;
            }
            const el = document.createElement('div');
            el.className = 'fc-spell__tile fc-spell__slot';
            if (s.type === 'sep') {
                el.classList.add('hint');
                el.textContent = s.ch;
            }
            else if (s.type === 'hint') {
                letterNo++;
                el.classList.add('hint');
                el.textContent = s.ch;
            }
            else {
                // 可編輯 slot
                letterNo++;
                if (spellState.mode === 'type') {
                    const inp = document.createElement('input');
                    inp.type = 'text';
                    inp.maxLength = 1;
                    inp.setAttribute('aria-label', '第 ' + letterNo + ' 個字母');
                    inp.setAttribute('autocapitalize', 'none');
                    inp.setAttribute('autocomplete', 'off');
                    inp.setAttribute('spellcheck', 'false');
                    inp.value = s.filled || '';
                    if (spellState.graded)
                        inp.readOnly = true; // 已評分就鎖住輸入（與字母磚模式一致），避免改動已上色方格造成「字母與對錯顏色不符」
                    inp.oninput = function () { if (spellState.graded)
                        return; s.filled = inp.value.replace(/[^a-zA-Z]/g, ''); inp.value = s.filled; if (s.filled)
                        focusNextInput(si); };
                    inp.onkeydown = function (ev) {
                        if (ev.key === 'Backspace' && !inp.value) {
                            focusPrevInput(si);
                        }
                        else if (ev.key === 'Enter') {
                            ev.preventDefault();
                            checkSpelling();
                        }
                    };
                    if (s.filled)
                        el.classList.add('filled');
                    el.appendChild(inp);
                }
                else if (s.filled) {
                    el.textContent = s.filled;
                    el.classList.add('filled');
                    el.onclick = function () {
                        if (spellState.graded)
                            return;
                        // 退回該字母到磚池
                        const t = spellState.bank.find(function (b) { return b.used && b.slotIdx === si; });
                        if (t) {
                            t.used = false;
                            t.slotIdx = null;
                        }
                        s.filled = null;
                        renderSpell();
                    };
                    // 已填才可點按退回（Tab 聚焦、Enter/空白鍵退回字母），與 COCA/TOEIC/practice 拼字格一致
                    el.setAttribute('role', 'button');
                    el.tabIndex = 0;
                    el.setAttribute('aria-label', '第 ' + letterNo + ' 個字母格，已填入 ' + s.filled + '，按 Enter 或空白鍵退回字母');
                    el.onkeydown = function (ev) { if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        el.onclick();
                    } };
                }
                else {
                    // 空格：spellClear 對空格 no-op，故不設 role=button/tabindex（避免報讀成無作用按鈕），僅標示位置
                    el.textContent = '';
                    el.setAttribute('aria-label', '第 ' + letterNo + ' 個字母格，尚未填入');
                }
            }
            slotsEl.appendChild(el);
        });
        bankEl.innerHTML = '';
        bankEl.style.display = (spellState.mode === 'type') ? 'none' : '';
        if (spellState.mode !== 'type') {
            spellState.bank.forEach(function (t) {
                const b = document.createElement('button');
                b.className = 'fc-spell__tile' + (t.used ? ' used' : '');
                b.textContent = t.ch;
                b.setAttribute('aria-label', '字母 ' + t.ch);
                if (t.used || spellState.graded) {
                    b.disabled = true;
                    b.setAttribute('aria-disabled', 'true');
                } // 已用掉／已評分的磚設 disabled：否則仍是可 focus、報讀成可按的原生 button，但 onclick 已 no-op＝死按鈕（CSS pointer-events:none 只擋滑鼠）；字母可改由已填格子退回
                b.onclick = function () {
                    if (spellState.graded || t.used)
                        return;
                    const target = spellState.slots.find(function (s) { return s.type === 'slot' && s.filled == null; });
                    if (!target)
                        return;
                    const ti = spellState.slots.indexOf(target);
                    target.filled = t.ch;
                    t.used = true;
                    t.slotIdx = ti;
                    renderSpell();
                };
                bankEl.appendChild(b);
            });
        }
        updateProgress();
    }
    function focusNextInput(si) {
        const inputs = [...document.querySelectorAll('#spellSlots input')];
        const cur = document.querySelector('#spellSlots .fc-spell__slot:nth-child(' + (si + 1) + ') input');
        const idx = inputs.indexOf(cur);
        if (idx >= 0 && idx + 1 < inputs.length)
            inputs[idx + 1].focus();
    }
    function focusPrevInput(si) {
        const inputs = [...document.querySelectorAll('#spellSlots input')];
        const cur = document.querySelector('#spellSlots .fc-spell__slot:nth-child(' + (si + 1) + ') input');
        const idx = inputs.indexOf(cur);
        if (idx > 0)
            inputs[idx - 1].focus();
    }
    window.checkSpelling = function () {
        if (!spellState || spellState.graded)
            return;
        // 組出作答字串
        let typed = '';
        spellState.slots.forEach(function (s) {
            if (s.type === 'gap')
                typed += ' ';
            else if (s.type === 'sep')
                typed += s.ch;
            else if (s.type === 'hint')
                typed += s.ch;
            else
                typed += (s.filled || '');
        });
        // 未填滿不判分（保持中性）
        const unfilled = spellState.slots.some(function (s) { return s.type === 'slot' && !s.filled; });
        if (unfilled) {
            const reveal = document.getElementById('spellReveal');
            reveal.className = 'fc-reveal show';
            reveal.innerHTML = '<span class="fc-reveal__msg">先把每個空格都填上，再檢查看看 😊</span>';
            return;
        }
        spellState.graded = true;
        const card = cards[currentIndex];
        const correct = typed.trim().toLowerCase() === spellState.word.trim().toLowerCase();
        const id = currentWordId();
        recordBinary(id, correct);
        // 逐槽上色（綠對紅錯）
        const slotEls = [...document.querySelectorAll('#spellSlots .fc-spell__slot')];
        let ei = 0;
        spellState.slots.forEach(function (s) {
            if (s.type === 'gap')
                return;
            const el = slotEls[ei++];
            if (!el)
                return;
            if (s.type === 'slot') {
                const good = (s.filled || '').toLowerCase() === s.ch.toLowerCase();
                el.classList.add(good ? 'ok' : 'no');
            }
        });
        // 評分後就地鎖定所有格子（checkSpelling 不會重新渲染，故 readOnly/role 必須在此時套用，否則打字格可退格重打、
        // 字母磚格仍自稱可按 Enter 退回，造成「字母與對錯顏色不符」或假的可操作提示）。
        slotEls.forEach(function (el) {
            const inp = el.querySelector('input');
            if (inp)
                inp.readOnly = true;
            if (el.getAttribute('role') === 'button') {
                el.removeAttribute('role');
                el.removeAttribute('tabindex');
                el.setAttribute('aria-disabled', 'true');
                el.setAttribute('aria-label', '已填入 ' + (el.textContent || '') + '，已鎖定'); // 清掉填入時設定的「按 Enter 或空白鍵退回字母」過時提示：評分後 onclick/onkeydown 已 no-op，報讀器不該再宣稱可退回
            }
        });
        var spellToggleEl2 = document.getElementById('spellToggle'); // 評分後停用輸入法切換鈕，避免 toggleSpellMode 的 early-return 變成「按了沒反應」的死按鈕（showSpell 於下一張卡重新啟用）
        if (spellToggleEl2) {
            spellToggleEl2.disabled = true;
            spellToggleEl2.setAttribute('aria-disabled', 'true');
        }
        // 停用整個字母磚庫殘留的誘答磚（peak>=3 會混入）：renderSpell 的 graded 守衛評分後不會再跑（checkSpelling 就地改 DOM、不重繪），不在此停用就留下可 focus、報讀成可按但 onclick no-op 的死按鈕
        [].forEach.call(document.querySelectorAll('#spellBank .fc-spell__tile'), function (b) { b.disabled = true; b.setAttribute('aria-disabled', 'true'); });
        const reveal = document.getElementById('spellReveal');
        if (correct) {
            showConfetti();
            reveal.className = 'fc-reveal is-ok show';
            reveal.innerHTML = '<span class="fc-reveal__msg">拼對了，太厲害了！ 🎉</span>' +
                buildRevealBody(card) + '<button class="fc-reveal__next" onclick="spellNext()">繼續 →</button>';
            quizScore++;
        }
        else {
            if (!reducedMotion()) {
                const slotsEl = document.getElementById('spellSlots');
                slotsEl.classList.add('is-wrong');
                setTimeout(function () { slotsEl.classList.remove('is-wrong'); }, 450);
            }
            reveal.className = 'fc-reveal is-no show';
            reveal.innerHTML = '<span class="fc-reveal__msg">拼對的字母會變綠色；這個字是這樣拼的，再看一次 😊</span>' +
                buildRevealBody(card) + '<button class="fc-reveal__next" onclick="spellNext()">繼續 →</button>';
        }
        quizTotal++;
        const nx = reveal.querySelector('.fc-reveal__next');
        if (nx)
            nx.focus();
    };
    window.spellNext = function () {
        currentIndex++;
        showSpell();
    };
    // --- PROGRESS ---
    function updateProgress() {
        const total = cards.length;
        if (currentMode === 'flashcard') {
            progressBar.textContent = '第 ' + Math.min(currentIndex + 1, total) + ' / ' + total + ' 張　（已練 ' + knownCount + '）';
        }
        else {
            progressBar.textContent = '第 ' + Math.min(currentIndex + 1, total) + ' / ' + total + '　（' + quizScore + ' / ' + quizTotal + ' 正確）';
        }
    }
    // --- COMPLETE ---
    function showComplete() {
        flashcardArea.classList.add('hidden');
        quizArea.classList.add('hidden');
        spellArea.classList.add('hidden');
        progressBar.classList.add('hidden');
        completeScreen.classList.remove('hidden');
        if (currentMode === 'flashcard') {
            document.getElementById('completeMsg').textContent = '這一輪練了 ' + knownCount + ' 個字，做得很好！';
        }
        else {
            document.getElementById('completeMsg').textContent = '結果：' + quizScore + ' / ' + quizTotal + ' 正確';
        }
    }
    window.restartLevel = function () {
        if (reviewMode && window.Worddex) {
            window.Worddex.startReview();
            return;
        }
        if (currentLevel)
            window.selectLevel(currentLevel);
    };
    window.resetAll = function () {
        currentLevel = null;
        reviewMode = false;
        modeToggle.classList.add('hidden');
        progressBar.classList.add('hidden');
        flashcardArea.classList.add('hidden');
        quizArea.classList.add('hidden');
        spellArea.classList.add('hidden');
        completeScreen.classList.add('hidden');
        welcomeMsg.classList.remove('hidden');
        document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
    };
    // --- 單字圖鑑「今日複習」橋接 ---
    window.startWorddexReview = function (queueCards) {
        cards = queueCards;
        currentIndex = 0;
        knownCount = 0;
        quizScore = 0;
        quizTotal = 0;
        reviewMode = true;
        welcomeMsg.classList.add('hidden');
        modeToggle.classList.remove('hidden');
        progressBar.classList.remove('hidden');
        completeScreen.classList.add('hidden');
        showCurrentMode();
    };
    // --- CONFETTI（尊重 reduced-motion）---
    function showConfetti() {
        if (reducedMotion())
            return;
        const container = document.getElementById('confettiContainer');
        // 慶祝彩帶刻意用多彩硬碼（彩帶本就是多色紙屑）：純裝飾、不編碼任何狀態、reduced-motion 下不播放；不套「狀態色禁彩虹」規則。
        const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];
        for (let i = 0; i < 30; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 0.5 + 's';
            piece.style.width = (Math.random() * 8 + 6) + 'px';
            piece.style.height = (Math.random() * 8 + 6) + 'px';
            container.appendChild(piece);
        }
        setTimeout(() => { container.innerHTML = ''; }, 2000);
    }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
    // headless 測試掛鉤（不影響正常使用）
    window.__cefrDebug = {
        cards: function () { return cards; },
        index: function () { return currentIndex; },
        mode: function () { return currentMode; },
        direction: function () { return directionAt(currentIndex); }
    };
})();
/* ---- (下一個原 inline <script> 區塊) ---- */
(function () {
    'use strict';
    // 共用排程 store（與主作答漏斗同一實例；讀 peakBox/lit 作視覺收藏、只增不減）
    var store = window.CEFR_SRS || null;
    var LEVELS = ['cefr_a1', 'cefr_a2', 'cefr_b1'];
    var LEVEL_LABEL = { cefr_a1: 'A1 入門', cefr_a2: 'A2 基礎', cefr_b1: 'B1 進階' };
    var MILE_XP = {
        first_word: 10, lit_25: 30, lit_50: 60, lit_100: 100,
        level_a1_all: 80, level_a2_all: 80, level_b1_all: 80,
        all_lit: 200, master_50: 80, master_all: 300
    };
    var wordIndex = null; // id -> { word物件, level }
    function wordId(level, word) { return level + '::' + word; }
    function today() { return window.SRS ? window.SRS.today() : new Date().toISOString().slice(0, 10); }
    // 取得已遷移的卡片視圖（不存在回傳 null；存在則 ensure 補欄位，不落地新卡）
    function card(id) {
        if (!store)
            return null;
        var cm = store.cards();
        return cm[id] ? window.SRS.ensureCard(cm[id]) : null;
    }
    // 視覺收藏用 peakBox（單調不減）；到期判定用 scheduleBox/dueDate
    function peakOf(c) { return c ? (c.peakBox || 0) : 0; }
    // 掃 WORD_DATA 三級建立 id -> { word物件, level }
    function buildIndex() {
        wordIndex = {};
        for (var li = 0; li < LEVELS.length; li++) {
            var lv = LEVELS[li];
            var pack = window.WORD_DATA && window.WORD_DATA[lv];
            if (!pack || !pack.words)
                continue;
            for (var wi = 0; wi < pack.words.length; wi++) {
                var w = pack.words[wi];
                wordIndex[wordId(lv, w.word)] = { word: w, level: lv };
            }
        }
    }
    function idx() { if (!wordIndex)
        buildIndex(); return wordIndex; }
    // ---- 分母 / 統計（即時由 WORD_DATA 計算） ----
    function levelWords(level) {
        var pack = window.WORD_DATA && window.WORD_DATA[level];
        return (pack && pack.words) ? pack.words : [];
    }
    function totalCount() {
        var n = 0;
        for (var i = 0; i < LEVELS.length; i++)
            n += levelWords(LEVELS[i]).length;
        return n;
    }
    function isLit(level, word) {
        var c = card(wordId(level, word));
        return !!(c && c.lit);
    }
    function isMastered(level, word) {
        var c = card(wordId(level, word));
        return peakOf(c) >= 5;
    }
    function litCount() {
        if (!store)
            return 0;
        var cm = store.cards(), n = 0;
        for (var id in cm)
            if (window.SRS.ensureCard(cm[id]).lit)
                n++;
        return n;
    }
    function masteredCount() {
        if (!store)
            return 0;
        var cm = store.cards(), n = 0;
        for (var id in cm)
            if (peakOf(window.SRS.ensureCard(cm[id])) >= 5)
                n++;
        return n;
    }
    function levelAllLit(level) {
        var ws = levelWords(level);
        if (!ws.length)
            return false;
        for (var i = 0; i < ws.length; i++)
            if (!isLit(level, ws[i].word))
                return false;
        return true;
    }
    function levelAllMastered(level) {
        var ws = levelWords(level);
        if (!ws.length)
            return false;
        for (var i = 0; i < ws.length; i++)
            if (!isMastered(level, ws[i].word))
                return false;
        return true;
    }
    // ---- 里程碑（Game.award 單次發放 + 排程 store 的單調 guard；依 peakBox/lit 只增不減） ----
    function satisfiedMilestones() {
        var out = [];
        var lit = litCount(), b5 = masteredCount();
        if (lit >= 1)
            out.push('first_word');
        if (lit >= 25)
            out.push('lit_25');
        if (lit >= 50)
            out.push('lit_50');
        if (lit >= 100)
            out.push('lit_100');
        if (levelAllLit('cefr_a1'))
            out.push('level_a1_all');
        if (levelAllLit('cefr_a2'))
            out.push('level_a2_all');
        if (levelAllLit('cefr_b1'))
            out.push('level_b1_all');
        var allLit = true;
        for (var i = 0; i < LEVELS.length; i++) {
            if (!levelAllLit(LEVELS[i])) {
                allLit = false;
                break;
            }
        }
        if (allLit && totalCount() > 0)
            out.push('all_lit');
        if (b5 >= 50)
            out.push('master_50');
        var allMaster = true;
        for (var j = 0; j < LEVELS.length; j++) {
            if (!levelAllMastered(LEVELS[j])) {
                allMaster = false;
                break;
            }
        }
        if (allMaster && totalCount() > 0)
            out.push('master_all');
        return out;
    }
    function mileMsg(id) {
        switch (id) {
            case 'first_word': return '🌟 收集到第一個單字！';
            case 'lit_25': return '✨ 已收集 25 個字！';
            case 'lit_50': return '✨ 已收集 50 個字！';
            case 'lit_100': return '✨ 已收集 100 個字！';
            case 'level_a1_all':
            case 'level_a2_all':
            case 'level_b1_all': return '⭐ 完成一整級的單字收集！';
            case 'all_lit': return '🌌 所有單字都收集齊了！';
            case 'master_50': return '🏅 已精通 50 個字！';
            case 'master_all': return '👑 全部單字都精通了！';
            default: return '🎉 達成新成就！';
        }
    }
    function checkMilestones() {
        if (!store)
            return;
        var s = satisfiedMilestones();
        for (var i = 0; i < s.length; i++) {
            var id = s[i];
            // awardOnce：先設 guard → save → 回 true，呼叫方再發 XP/toast（永不重領）
            if (!store.awardOnce(id))
                continue;
            try {
                if (window.Game && window.Game.award)
                    window.Game.award('english', MILE_XP[id] || 0, { silent: true, source: 'worddex-milestone', milestone: id });
            }
            catch (e) { }
            try {
                if (window.Game && window.Game.showToast)
                    window.Game.showToast(mileMsg(id), 'success');
            }
            catch (e) { }
        }
    }
    // ---- 核心：作答（統一計分＋排程＋收藏＋里程碑） ----
    // 三級自評：grade in 'again'|'good'|'easy'
    function rate(id, grade) {
        if (!store)
            return;
        store.rate(id, grade);
        try {
            if (window.Game)
                window.Game.recordAnswer('english', grade !== 'again');
        }
        catch (e) { }
        if (grade !== 'again')
            checkMilestones();
        refreshDisplays();
    }
    // 二元作答（測驗/拼字）
    function gradeBinary(id, correct) {
        if (!store)
            return;
        store.gradeBinary(id, correct);
        try {
            if (window.Game)
                window.Game.recordAnswer('english', !!correct);
        }
        catch (e) { }
        if (correct)
            checkMilestones();
        refreshDisplays();
    }
    function refreshDisplays() {
        if (isScreenOpen()) {
            renderSections();
            renderSummary();
        }
        updateDueDesc();
    }
    // ---- 今日到期佇列（跨等級單一收藏；依 scheduleBox/dueDate 判定） ----
    function dueCardIds(t) {
        if (!store)
            return [];
        var cm = store.cards();
        var out = [];
        for (var id in cm) {
            var s = window.SRS.ensureCard(cm[id]);
            if (s.lit && s.status !== 'new' && s.dueDate && s.dueDate <= t)
                out.push(id);
        }
        out.sort(function (x, y) {
            var sx = cm[x], sy = cm[y];
            if (sx.dueDate !== sy.dueDate)
                return sx.dueDate < sy.dueDate ? -1 : 1;
            if ((sx.scheduleBox || 0) !== (sy.scheduleBox || 0))
                return (sx.scheduleBox || 0) - (sy.scheduleBox || 0);
            return x < y ? -1 : 1;
        });
        return out;
    }
    function dueCount() { return dueCardIds(today()).length; }
    // 產出「已標註 _lvl 的 word 物件陣列」給 flashcard 橋接函式（走共用 buildSession：到期優先＋新卡上限＋交錯）
    function buildQueue() {
        if (!store)
            return [];
        var all = [];
        for (var li = 0; li < LEVELS.length; li++) {
            var lv = LEVELS[li];
            var ws = levelWords(lv);
            for (var wi = 0; wi < ws.length; wi++) {
                ws[wi]._lvl = lv;
                all.push(ws[wi]);
            }
        }
        return store.buildSession(all, {
            dailyNew: 10, reviewCap: 20,
            idOf: function (c) { return wordId(c._lvl, c.word); }
        });
    }
    // ---- 畫面 ----
    function isScreenOpen() {
        var el = document.getElementById('worddexArea');
        return el && !el.classList.contains('hidden');
    }
    function glyph(box) {
        if (!box)
            return '☆';
        if (box >= 5)
            return '🌟';
        return '⭐';
    }
    function stateText(box) {
        if (!box)
            return '未收集';
        if (box >= 5)
            return '精通';
        return '第 ' + box + ' 盒';
    }
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
        if (!host)
            return;
        var t = today();
        var html = '';
        for (var li = 0; li < LEVELS.length; li++) {
            var lv = LEVELS[li];
            var ws = levelWords(lv);
            if (!ws.length)
                continue;
            html += '<div class="worddex-section"><div class="worddex-section-title">' + escapeHtml(LEVEL_LABEL[lv]) + '</div><div class="worddex-grid">';
            for (var wi = 0; wi < ws.length; wi++) {
                var w = ws[wi];
                var id = wordId(lv, w.word);
                var c = card(id);
                var box = peakOf(c); // 視覺高水位（只增不減）
                var boxClass = Math.min(box, 5); // CSS box0..box5
                var due = !!(c && c.lit && c.status !== 'new' && c.dueDate && c.dueDate <= t);
                html += '<div class="worddex-card box' + boxClass + (due ? ' due' : '') + '" role="button" tabindex="0"' +
                    ' onclick="Worddex.openFocus(\'' + lv + '\',' + jsStrAttr(w.word) + ')"' +
                    ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();Worddex.openFocus(\'' + lv + '\',' + jsStrAttr(w.word) + ');}">' +
                    '<span class="wd-emoji">' + escapeHtml(w.emoji || '📖') + '</span>' +
                    '<span class="wd-word">' + escapeHtml(w.word) + '</span>' +
                    '<span class="wd-glyph">' + glyph(box) + (due ? ' <span class="wd-due">🔵</span>' : '') + '</span>' +
                    '<span class="wd-state">' + stateText(box) + '</span>' +
                    '</div>';
            }
            html += '</div></div>';
        }
        host.innerHTML = html;
    }
    function renderSummary() {
        var el = document.getElementById('worddexSummary');
        if (!el)
            return;
        var lit = litCount(), mastered = masteredCount(), due = dueCount(), total = totalCount();
        el.innerHTML = '已收集 <b>' + lit + '</b> / ' + total + '　·　精通 <b>' + mastered + '</b> 個　·　' +
            (due > 0 ? '今天有 <b>' + due + '</b> 個字想跟你打招呼 🔵' : '今天都複習完了');
    }
    function updateDueDesc() {
        var el = document.getElementById('worddexDueDesc');
        if (!el)
            return;
        var due = dueCount();
        el.textContent = due > 0 ? ('今天有 ' + due + ' 個字要複習') : '今天複習完了，明天見！';
    }
    function openScreen() {
        var area = document.getElementById('worddexArea');
        var pc = document.querySelector('.play-column');
        if (pc)
            pc.classList.add('hidden');
        if (area)
            area.classList.remove('hidden');
        renderSections();
        renderSummary();
        updateDueDesc();
    }
    function closeScreen() {
        var area = document.getElementById('worddexArea');
        var pc = document.querySelector('.play-column');
        if (area)
            area.classList.add('hidden');
        if (pc)
            pc.classList.remove('hidden');
    }
    function openFocus(level, word) {
        var id = wordId(level, word);
        var rec = idx()[id];
        var wObj = rec ? rec.word : null;
        var c = card(id);
        var box = peakOf(c);
        var t = today();
        var status;
        if (!box)
            status = '還沒收集，練一次就會亮起來 ✨';
        else if (box >= 5)
            status = '已經精通囉！ 🌟';
        else
            status = '目前收在第 ' + box + ' 盒';
        var when = '';
        if (c && c.lit && c.status !== 'new' && c.dueDate) {
            if (c.dueDate <= t)
                when = '今天適合複習 🔵';
            else
                when = '下次複習日：' + c.dueDate;
        }
        var body = document.getElementById('worddexFocusBody');
        if (body) {
            body.innerHTML =
                '<div class="worddex-focus-emoji">' + escapeHtml(wObj && wObj.emoji || '📖') + '</div>' +
                    '<div class="worddex-focus-word">' + escapeHtml(word) + '</div>' +
                    '<div class="worddex-focus-cn">' + escapeHtml(wObj && wObj.chinese || '') + '</div>' +
                    '<div class="worddex-focus-meta">' + status + (when ? ('<br>' + when) : '') +
                    '<br>答對 ' + (c ? (c.timesCorrect || 0) : 0) + ' 次</div>' +
                    '<button class="worddex-focus-practice" onclick="Worddex.startFocus(\'' + level + '\',' + jsStrAttr(word) + ')">✏️ 練這個字</button>';
        }
        var o = document.getElementById('worddexFocusOverlay');
        if (o)
            o.hidden = false;
    }
    function closeFocus() {
        var o = document.getElementById('worddexFocusOverlay');
        if (o)
            o.hidden = true;
    }
    // ---- 複習 / 單字聚焦（重用既有 flashcard/quiz 流程） ----
    function startReview() {
        closeFocus();
        var q = buildQueue();
        if (!q.length) {
            try {
                if (window.Game && window.Game.showToast)
                    window.Game.showToast('今天都複習完了，明天見！', 'success');
            }
            catch (e) { }
            return;
        }
        closeScreen();
        if (typeof window.startWorddexReview === 'function')
            window.startWorddexReview(q);
    }
    function startFocus(level, word) {
        closeFocus();
        var rec = idx()[wordId(level, word)];
        if (!rec)
            return;
        var w = rec.word;
        w._lvl = rec.level;
        closeScreen();
        if (typeof window.startWorddexReview === 'function')
            window.startWorddexReview([w]);
    }
    window.Worddex = {
        rate: rate,
        gradeBinary: gradeBinary,
        onWord: gradeBinary, // 向後相容別名（二元）
        openScreen: openScreen,
        closeScreen: closeScreen,
        openFocus: openFocus,
        closeFocus: closeFocus,
        startReview: startReview,
        startFocus: startFocus,
        buildQueue: buildQueue,
        dueCount: dueCount
    };
    updateDueDesc();
})();
