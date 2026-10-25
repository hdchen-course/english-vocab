// @ts-nocheck
/* =====================================================================
 * src/dictation.ts → dictation.js (DICTATION_BUILD_SPEC.md §9.1 引擎)
 * 聽寫練習引擎：聽音 → canvas 手寫 → 看答案 → 三級自評 → SRS。
 *
 * R3 鐵律：程式「一律不判定答案對錯」——canvas/鍵盤 fallback 的輸入
 *   從不被讀取做對錯比較，揭曉只顯示正解，對錯一律由孩子自評。
 *   本檔不得出現任何「使用者輸入 ↔ 正解」的比較分支 (§10 item 8a 會靜態掃描)。
 * 吃 window.DICT_DK（build 產）、window.SRS（排程）、house game_core.js。
 * ===================================================================== */
(function () {
    'use strict';
    // 本 hub 同時服務 DK 與 CEFR 兩系列；state key 皆 per currentSeries（§7/§10.2）。
    var currentSeries = 'dk'; // startSet 時依該組 series 設定
    function seriesOf(item) { var p = ('' + item.id).split('::')[0]; return (p === 'cefr') ? 'cefr' : 'dk'; }
    function DONE_KEY() { return 'dict_' + currentSeries + '_done_v1'; } // 完成度點依此
    function ACCENT_KEY() { return 'dict_' + currentSeries + '_accent_v1'; } // 'us' | 'gb'
    function SCAFFOLD_KEY() { return 'dict_' + currentSeries + '_scaffold_v1'; }
    function HINTS_KEY() { return 'dict_' + currentSeries + '_hints_v1'; } // 一次性提示 dismissals
    var DICT = [].concat((typeof window !== 'undefined' && window.DICT_DK) ? window.DICT_DK : [], (typeof window !== 'undefined' && window.DICT_CEFR) ? window.DICT_CEFR : []);
    var byLevel = {};
    for (var i = 0; i < DICT.length; i++) {
        var it = DICT[i];
        (byLevel[it.level] = byLevel[it.level] || []).push(it);
    }
    /* ---- 小工具：localStorage JSON（done / accent / scaffold / hints） ---- */
    function readJSON(key, fallback) {
        try {
            var v = JSON.parse(localStorage.getItem(key));
            return (v && typeof v === 'object') ? v : fallback;
        }
        catch (e) {
            return fallback;
        }
    }
    function writeJSON(key, obj) { try {
        localStorage.setItem(key, JSON.stringify(obj));
    }
    catch (e) { } }
    var accent = 'us'; // 預設 us（§2.5）；startSet 時依 currentSeries 重載
    var scaffold = { zh: false, firstLetter: false, ipa: false };
    function loadSeriesState() {
        var a = readJSON(ACCENT_KEY(), null);
        accent = (a && a.accent === 'gb') ? 'gb' : 'us';
        scaffold = readJSON(SCAFFOLD_KEY(), { zh: false, firstLetter: false, ipa: false });
    }
    function setAccent(a) { accent = (a === 'gb') ? 'gb' : 'us'; writeJSON(ACCENT_KEY(), { accent: accent }); }
    function saveScaffold() { writeJSON(SCAFFOLD_KEY(), scaffold); }
    function hintShown(id) { var h = readJSON(HINTS_KEY(), {}); return !!h[id]; }
    function markHint(id) { var h = readJSON(HINTS_KEY(), {}); h[id] = true; writeJSON(HINTS_KEY(), h); }
    /* ---- 完成度（done store；cardId → 最後 grade；per series，由 cardId 前綴決定，
     *      故 renderMenu 不論 currentSeries 都讀對該單元自己 series 的 done store） ---- */
    function doneKeyForSeries(s) { return 'dict_' + s + '_done_v1'; }
    function recordGrade(id, grade) {
        var s = (('' + id).split('::')[0] === 'cefr') ? 'cefr' : 'dk';
        var key = doneKeyForSeries(s), d = readJSON(key, {});
        d[id] = grade;
        writeJSON(key, d);
    }
    // 一組 cardId → 'none' | 'partial' | 'done'（done = 每卡最後 grade ∈ {good,easy}，即 ≥快會）
    function unitState(ids) {
        if (!ids || !ids.length)
            return 'none';
        var s = (('' + ids[0]).split('::')[0] === 'cefr') ? 'cefr' : 'dk';
        var d = readJSON(doneKeyForSeries(s), {}), any = false, allDone = true;
        for (var k = 0; k < ids.length; k++) {
            var g = d[ids[k]];
            if (g != null) {
                any = true;
                if (g !== 'good' && g !== 'easy')
                    allDone = false;
            }
            else {
                allDone = false;
            }
        }
        return !any ? 'none' : (allDone ? 'done' : 'partial');
    }
    /* ---- 卡集建構 ---- */
    function dayCards(level, day) {
        return (byLevel[level] || []).filter(function (it) { return it.day === day; });
    }
    // d5 複習：引擎執行期由該週 d1–d4 確定性合成（不入 sidecar，§4.3）
    function weekD5Cards(level) {
        var src = (byLevel[level] || []).filter(function (it) { return /^d[1-4]$/.test(it.day); });
        return src.map(function (it) {
            var c = {};
            for (var k in it)
                if (it.hasOwnProperty(k))
                    c[k] = it[k];
            c.day = 'd5';
            c.id = 'dk::' + level + '::d5::word::' + it.audioSlug; // 與來源卡區隔，唯一
            return c;
        });
    }
    function bonusCards(level) { return (byLevel[level] || []).slice(); }
    function idsOf(cards) { return cards.map(function (c) { return c.id; }); }
    // store key：§7
    function wn(level) { return level.replace('dk-', ''); } // 'dk-w01' → 'w01'
    function dayStoreKey(level, day) { return 'dict_dk_' + wn(level) + day + '_word_v1'; }
    function d5StoreKey(level) { return 'dict_dk_' + wn(level) + 'd5_word_v1'; }
    function bonusStoreKey(level) { return 'dict_dk_bonus_' + level.replace('dk-bonus-', '') + '_word_v1'; }
    /* ---- 執行期 state ---- */
    var session = [], idx = 0, curStore = null, audioUnlocked = false, ctx = null;
    /* ============================ 畫面切換 ============================ */
    function $(id) { return document.getElementById(id); }
    function show(el) { if (el)
        el.classList.remove('hidden'); }
    function hide(el) { if (el)
        el.classList.add('hidden'); }
    function showScreen(name) {
        ['menu', 'play', 'done'].forEach(function (s) {
            var el = $('dct-screen-' + s);
            if (el)
                el.classList.toggle('hidden', s !== name);
        });
        window.scrollTo(0, 0);
    }
    /* ============================ 選單 ============================ */
    function renderMenu() {
        var grid = $('dct-week-grid');
        if (!grid)
            return;
        grid.innerHTML = '';
        for (var w = 1; w <= 52; w++) {
            var level = 'dk-w' + ('0' + w).slice(-2);
            if (!byLevel[level])
                continue;
            grid.appendChild(weekCard(level, w));
        }
        var bonusWrap = $('dct-bonus');
        if (bonusWrap) {
            bonusWrap.innerHTML = '';
            [['dk-bonus-numbers', '數字 Numbers'], ['dk-bonus-days', '星期 Days'], ['dk-bonus-months', '月份 Months']]
                .forEach(function (b) {
                if (!byLevel[b[0]])
                    return;
                var cards = bonusCards(b[0]);
                var btn = dayButton(b[1] + '（' + cards.length + ' 字）', unitState(idsOf(cards)), function () {
                    startSet(cards, bonusStoreKey(b[0]), cards.length);
                });
                bonusWrap.appendChild(btn);
            });
        }
        // 系列 A（CEFR）單字軌：A1–B1（站內字表）；B2–C2 待 sourcing（§12 OPEN-C 定案）
        var cefrWrap = $('dct-cefr');
        if (cefrWrap) {
            cefrWrap.innerHTML = '';
            [['cefr-a1', 'A1 入門'], ['cefr-a2', 'A2 基礎'], ['cefr-b1', 'B1 進階']].forEach(function (c) {
                if (!byLevel[c[0]])
                    return;
                var cards = (byLevel[c[0]] || []).slice();
                var btn = dayButton(c[1] + '（' + cards.length + ' 字）', unitState(idsOf(cards)), function () {
                    startSet(cards, 'dict_cefr_' + c[0].replace('cefr-', '') + '_word_v1', 10, 'cefr');
                });
                cefrWrap.appendChild(btn);
            });
        }
    }
    function syncScaffoldToggles() {
        [['dct-sc-firstletter', 'firstLetter'], ['dct-sc-ipa', 'ipa'], ['dct-sc-zh', 'zh']].forEach(function (p) {
            var b = $(p[0]);
            if (!b)
                return;
            b.classList.toggle('active', !!scaffold[p[1]]);
            b.setAttribute('aria-pressed', scaffold[p[1]] ? 'true' : 'false');
        });
    }
    function dot(state) {
        var span = document.createElement('span');
        span.className = 'dct-dot dct-dot--' + state;
        // 三態非只靠顏色：附符號（比照 house callout 原則）
        span.textContent = state === 'done' ? '✓' : (state === 'partial' ? '·' : '');
        span.setAttribute('aria-label', state === 'done' ? '已完成' : (state === 'partial' ? '進行中' : '未開始'));
        return span;
    }
    function weekCard(level, w) {
        var card = document.createElement('div');
        card.className = 'dct-week';
        // 週 header（可展開 d1–d5）
        var head = document.createElement('button');
        head.type = 'button';
        head.className = 'dct-week__head';
        var d1 = dayCards(level, 'd1'), d2 = dayCards(level, 'd2'), d3 = dayCards(level, 'd3'), d4 = dayCards(level, 'd4');
        var weekIds = idsOf(d1.concat(d2, d3, d4)).concat(idsOf(weekD5Cards(level)));
        var label = document.createElement('span');
        label.className = 'dct-week__label';
        label.textContent = '第 ' + w + ' 週 · 20 字';
        head.appendChild(label);
        head.appendChild(dot(unitState(weekIds)));
        var body = document.createElement('div');
        body.className = 'dct-week__body hidden';
        head.addEventListener('click', function () {
            var open = body.classList.toggle('hidden');
            head.setAttribute('aria-expanded', open ? 'false' : 'true');
        });
        head.setAttribute('aria-expanded', 'false');
        // 五天
        [['d1', 'Day 1'], ['d2', 'Day 2'], ['d3', 'Day 3'], ['d4', 'Day 4']].forEach(function (d) {
            var cards = dayCards(level, d[0]);
            if (!cards.length)
                return;
            body.appendChild(dayButton(d[1] + '（5 字）', unitState(idsOf(cards)), function () {
                startSet(cards, dayStoreKey(level, d[0]), 5);
            }));
        });
        var d5 = weekD5Cards(level);
        if (d5.length) {
            body.appendChild(dayButton('Day 5 複習（' + d5.length + ' 字）', unitState(idsOf(d5)), function () {
                startSet(d5, d5StoreKey(level), d5.length);
            }));
        }
        card.appendChild(head);
        card.appendChild(body);
        return card;
    }
    function dayButton(text, state, onClick) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'dct-day';
        var t = document.createElement('span');
        t.textContent = text;
        b.appendChild(t);
        b.appendChild(dot(state));
        b.addEventListener('click', onClick);
        return b;
    }
    /* ============================ 開始一組 ============================ */
    function startSet(cards, storeKey, dailyNew, series) {
        currentSeries = series || (cards[0] ? seriesOf(cards[0]) : 'dk');
        loadSeriesState(); // 依 currentSeries 重載 accent/scaffold（§2.5/§2.3 per 系列）
        curStore = window.SRS.createStore(storeKey);
        session = curStore.buildSession(cards, { dailyNew: dailyNew, idOf: function (c) { return c.id; } });
        if (!session.length) {
            renderDone(true);
            showScreen('done');
            return;
        }
        idx = 0;
        showScreen('play');
        syncScaffoldToggles();
        // iOS autoplay 解鎖（§2.5）：_unlock.mp3 fire-and-forget（不得 await），同一同步 handler 內立即 renderItem
        if (!audioUnlocked) {
            try {
                var u = new Audio('audio/_unlock.mp3');
                var up = u.play();
                if (up && up.catch)
                    up.catch(function () { });
            }
            catch (e) { }
            audioUnlocked = true;
        }
        renderItem();
    }
    /* ============================ 一題 ============================ */
    function cur() { return session[idx]; }
    function renderItem() {
        var item = cur();
        resizeCanvas(); // play 畫面可見後 canvas 才有實際尺寸，於此重設 backing store（修 R8：避免 1×1 畫不出筆跡）
        var _fb = $('dct-fallback');
        if (_fb)
            _fb.value = '';
        hide($('dct-reveal'));
        hide($('dct-playbtn'));
        // 題號
        var c = $('dct-counter');
        if (c)
            c.textContent = (idx + 1) + ' / ' + session.length;
        // 腔調 pills 狀態
        syncAccentPills();
        // 鷹架：首字母提示（由 word[0] 導出；預設關）
        var fl = $('dct-firstletter');
        if (fl) {
            fl.textContent = scaffold.firstLetter ? ('提示：' + item.word.charAt(0) + '…') : '';
        }
        // 中文提示（需 zh，缺則隱藏）
        var zh = $('dct-zh-hint');
        if (zh) {
            if (scaffold.zh && item.zh) {
                zh.textContent = '中文：' + item.zh;
                show(zh);
            }
            else
                hide(zh);
        }
        // 揭曉面板清空
        var rv = $('dct-reveal');
        if (rv)
            rv.innerHTML = '';
        // 自動播音（在此同步呼叫鏈內，來自使用者手勢 → 首題起每題自動響，§2.5）
        playAudio(item);
        // 靜音提醒一次（§2.5；旗標存 hints key）
        if (!hintShown('mute')) {
            var m = $('dct-mutehint');
            if (m) {
                show(m);
            }
            markHint('mute');
        }
    }
    function playAudio(item) {
        var name = 'word_dict_' + seriesOf(item) + '_' + item.audioSlug + '_' + accent + '.mp3';
        try {
            var a = new Audio('audio/' + name);
            var p = a.play();
            if (p && p.catch)
                p.catch(function () { show($('dct-playbtn')); }); // reject → 顯示播放鈕，不靜默
        }
        catch (e) {
            show($('dct-playbtn'));
        }
    }
    function syncAccentPills() {
        var us = $('dct-accent-us'), gb = $('dct-accent-gb');
        if (us)
            us.classList.toggle('active', accent === 'us');
        if (gb)
            gb.classList.toggle('active', accent === 'gb');
    }
    /* ---- 揭曉（只顯示正解；絕不比對輸入） ---- */
    function reveal() {
        var item = cur();
        var rv = $('dct-reveal');
        if (!rv)
            return;
        rv.innerHTML = '';
        // US 拼字（必顯，R3）
        var usLine = document.createElement('div');
        usLine.className = 'dct-reveal__word';
        if (item.ukSpelling && item.ukSpelling !== item.word) {
            usLine.innerHTML = '<span class="dct-reveal__us">US：' + esc(item.word) + '</span>'
                + '<span class="dct-reveal__uk">UK：' + esc(item.ukSpelling) + '</span>';
        }
        else {
            usLine.textContent = item.word;
        }
        rv.appendChild(usLine);
        // 音節（有才顯）
        if (item.syll) {
            var s = document.createElement('div');
            s.className = 'dct-reveal__row';
            s.textContent = '音節：' + item.syll;
            rv.appendChild(s);
        }
        // IPA（scaffold 開且有才顯）
        if (scaffold.ipa && item.ipa) {
            var p = document.createElement('div');
            p.className = 'dct-reveal__row';
            p.textContent = 'IPA：' + item.ipa;
            rv.appendChild(p);
        }
        // 中文（有才顯）
        if (item.zh) {
            var z = document.createElement('div');
            z.className = 'dct-reveal__row';
            z.textContent = '中文：' + item.zh;
            rv.appendChild(z);
        }
        // 系列 B（DK）無例句列。
        // 三級自評鈕
        var rate = document.createElement('div');
        rate.className = 'dct-rate fc-rate';
        rate.innerHTML =
            '<button type="button" class="fc-rate__btn again" data-grade="again" aria-label="還不熟">😅<span class="fc-rate__btn__label">還不熟</span></button>'
                + '<button type="button" class="fc-rate__btn good" data-grade="good" aria-label="快會了">🙂<span class="fc-rate__btn__label">快會了</span></button>'
                + '<button type="button" class="fc-rate__btn easy" data-grade="easy" aria-label="會了">😎<span class="fc-rate__btn__label">會了</span></button>';
        rate.addEventListener('click', function (e) {
            var btn = e.target.closest ? e.target.closest('[data-grade]') : null;
            if (btn)
                rateCard(btn.getAttribute('data-grade'));
        });
        rv.appendChild(rate);
        show(rv);
    }
    function rateCard(grade) {
        var item = cur();
        curStore.rate(item.id, grade); // SRS 排程（三級自評，唯一輸入）
        recordGrade(item.id, grade); // 完成度點依此
        idx++;
        if (idx < session.length)
            renderItem();
        else {
            renderDone(false);
            showScreen('done');
        }
    }
    /* ============================ 完成 ============================ */
    function renderDone(alreadyDone) {
        var el = $('dct-done-msg');
        if (el)
            el.textContent = alreadyDone
                ? '這一組今天都複習過了，明天再來鞏固記憶！'
                : '這一組練完了，做得好！';
        renderMenu(); // 回選單時點狀態已更新
    }
    /* ============================ 畫布 ============================ */
    function initCanvas() {
        var canvas = $('dct-canvas');
        if (!canvas)
            return;
        ctx = canvas.getContext('2d');
        resizeCanvas();
        var drawing = false, last = null;
        function pos(e) {
            var r = canvas.getBoundingClientRect();
            var dpr = window.devicePixelRatio || 1;
            return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
        }
        canvas.addEventListener('pointerdown', function (e) {
            drawing = true;
            last = pos(e);
            canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
            e.preventDefault();
        });
        canvas.addEventListener('pointermove', function (e) {
            if (!drawing)
                return;
            var p = pos(e);
            ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--ink') || '#222';
            ctx.lineWidth = 3 * (window.devicePixelRatio || 1);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            last = p;
            e.preventDefault();
        });
        function end() { drawing = false; last = null; }
        canvas.addEventListener('pointerup', end);
        canvas.addEventListener('pointercancel', end);
        canvas.addEventListener('pointerleave', end);
        window.addEventListener('resize', function () { var img = null; resizeCanvas(); });
    }
    function resizeCanvas() {
        var canvas = $('dct-canvas');
        if (!canvas)
            return;
        var dpr = window.devicePixelRatio || 1;
        var w = canvas.clientWidth, h = canvas.clientHeight;
        canvas.width = Math.max(1, Math.round(w * dpr));
        canvas.height = Math.max(1, Math.round(h * dpr));
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }
    function clearCanvas() {
        var canvas = $('dct-canvas');
        if (canvas && ctx)
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        var fb = $('dct-fallback');
        if (fb)
            fb.value = '';
    }
    /* ============================ 綁定 ============================ */
    function bind() {
        initCanvas();
        var clear = $('dct-clear');
        if (clear)
            clear.addEventListener('click', clearCanvas);
        var revealBtn = $('dct-reveal-btn');
        if (revealBtn)
            revealBtn.addEventListener('click', reveal);
        var replay = $('dct-replay');
        if (replay)
            replay.addEventListener('click', function () { playAudio(cur()); });
        var playbtn = $('dct-playbtn');
        if (playbtn)
            playbtn.addEventListener('click', function () { hide(playbtn); playAudio(cur()); });
        var us = $('dct-accent-us');
        if (us)
            us.addEventListener('click', function () { setAccent('us'); syncAccentPills(); playAudio(cur()); });
        var gb = $('dct-accent-gb');
        if (gb)
            gb.addEventListener('click', function () { setAccent('gb'); syncAccentPills(); playAudio(cur()); });
        var back = $('dct-back');
        if (back)
            back.addEventListener('click', function () { renderMenu(); showScreen('menu'); });
        var backDone = $('dct-done-back');
        if (backDone)
            backDone.addEventListener('click', function () { renderMenu(); showScreen('menu'); });
        var fbToggle = $('dct-fallback-toggle');
        if (fbToggle)
            fbToggle.addEventListener('click', function () {
                var fb = $('dct-fallback');
                if (fb)
                    fb.classList.toggle('hidden');
            });
        // 鷹架 toggles
        bindScaffoldToggle('dct-sc-firstletter', 'firstLetter');
        bindScaffoldToggle('dct-sc-ipa', 'ipa');
        bindScaffoldToggle('dct-sc-zh', 'zh');
        renderMenu();
        showScreen('menu');
    }
    function bindScaffoldToggle(id, key) {
        var b = $(id);
        if (!b)
            return;
        b.classList.toggle('active', !!scaffold[key]);
        b.setAttribute('aria-pressed', scaffold[key] ? 'true' : 'false');
        b.addEventListener('click', function () {
            scaffold[key] = !scaffold[key];
            saveScaffold();
            b.classList.toggle('active', !!scaffold[key]);
            b.setAttribute('aria-pressed', scaffold[key] ? 'true' : 'false');
            if (session.length)
                renderItem();
        });
    }
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', bind);
    else
        bind();
})();
