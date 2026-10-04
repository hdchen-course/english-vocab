/* =====================================================================
 * english_speaking.ts  →  (tsc, tsconfig.legacy.json) →  english_speaking.js
 * 原為 english_speaking.html 的 inline <script>；逐檔 TS 遷移抽出成 sibling .js。
 * 行為與原 inline 版等價（verbatim；載入位置不變＝執行時機/順序不變）。
 * 原碼本身即單一頂層 IIFE，已自我隔離（tsc 全域型別檢查無名稱外洩）；verbatim 保留。
 * ===================================================================== */
/* eslint-disable */
(function () {
    'use strict';
    function $(id) { return document.getElementById(id); }
    function el(tag, cls, html) { var e = document.createElement(tag); if (cls)
        e.className = cls; if (html != null)
        e.innerHTML = html; return e; }
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    var DATA = window.SPEAKING_DATA || { units: [] };
    var UNITS = DATA.units || [];
    var listened = false; // 本題是否已聽過標準音（決定自評與進度是否解鎖，不綁定錄音）
    var REDUCE = false;
    try {
        REDUCE = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
    catch (e) { }
    function revealRate() { var r = $('sp-rate'); if (r)
        r.classList.add('show'); }
    function markListened() { listened = true; revealRate(); }
    /* ---------- 播放高品質範本音（audio/*.mp3；慢速用 playbackRate）---------- */
    var curAudio = null;
    function stopAudio() { if (curAudio) {
        try {
            curAudio.pause();
        }
        catch (e) { }
        curAudio = null;
    } if (myAudio) {
        try {
            myAudio.pause();
        }
        catch (e) { }
    } }
    function playFile(fname, slow, onend) {
        stopAudio();
        var a = new Audio('audio/' + fname);
        try {
            a.preservesPitch = true;
            a.mozPreservesPitch = true;
            a.webkitPreservesPitch = true;
        }
        catch (e) { }
        a.playbackRate = slow ? 0.72 : 1.0;
        if (onend)
            a.addEventListener('ended', onend);
        a.addEventListener('error', function () { setStatus('（這個音檔載入失敗，看著字自己唸唸看也很棒！）'); });
        curAudio = a;
        var p = a.play();
        if (p && p.catch)
            p.catch(function () { });
        return a;
    }
    function playSeq(files, slow) {
        stopAudio();
        var i = 0;
        (function step() {
            if (i >= files.length)
                return;
            var f = files[i++];
            playFile(f, slow, function () { setTimeout(step, 280); });
        })();
    }
    function modelFiles(u, it) {
        if (u.type === 'pair')
            return [it.af, it.bf];
        if (u.type === 'line')
            return [it.f];
        if (u.type === 'dialog')
            return it.lines.map(function (l) { return l.f; });
        if (u.type === 'prompt')
            return [it.ef];
        return [];
    }
    /* ---------- 錄音（本機、用完即丟；可選）---------- */
    var recOK = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
    var mediaStream = null, recorder = null, chunks = [], myURL = null, myAudio = null;
    var audioCtx = null, analyser = null, meterRAF = 0, recording = false;
    function revokeMine() {
        if (myURL) {
            try {
                URL.revokeObjectURL(myURL);
            }
            catch (e) { }
            myURL = null;
        }
        if (myAudio) {
            try {
                myAudio.pause();
            }
            catch (e) { }
            myAudio = null;
        }
    }
    function stopMeter() { if (meterRAF) {
        cancelAnimationFrame(meterRAF);
        meterRAF = 0;
    } var m = $('sp-meter-bar'); if (m)
        m.style.width = '0%'; }
    function stopStream() {
        if (mediaStream) {
            mediaStream.getTracks().forEach(function (t) { try {
                t.stop();
            }
            catch (e) { } });
            mediaStream = null;
        }
        if (audioCtx) {
            try {
                audioCtx.close();
            }
            catch (e) { }
            audioCtx = null;
            analyser = null;
        }
        stopMeter();
    }
    function startMeter() {
        if (!analyser)
            return;
        var data = new Uint8Array(analyser.frequencyBinCount);
        var bar = $('sp-meter-bar');
        (function tick() {
            analyser.getByteFrequencyData(data);
            var sum = 0;
            for (var i = 0; i < data.length; i++)
                sum += data[i];
            var avg = sum / data.length;
            if (bar)
                bar.style.width = Math.min(100, Math.round(avg / 128 * 100)) + '%';
            meterRAF = requestAnimationFrame(tick);
        })();
    }
    function startRec() {
        if (!recOK || recording)
            return;
        stopAudio();
        revokeMine();
        var cmp = $('sp-compare');
        if (cmp)
            cmp.classList.remove('show');
        var rate = $('sp-rate');
        if (rate)
            rate.classList.remove('show');
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
            mediaStream = stream;
            chunks = [];
            var mime = (window.MediaRecorder.isTypeSupported && window.MediaRecorder.isTypeSupported('audio/webm')) ? 'audio/webm'
                : (window.MediaRecorder.isTypeSupported && window.MediaRecorder.isTypeSupported('audio/mp4')) ? 'audio/mp4' : '';
            try {
                recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
            }
            catch (e) {
                recorder = new MediaRecorder(stream);
            }
            recorder.ondataavailable = function (e) { if (e.data && e.data.size)
                chunks.push(e.data); };
            recorder.onstop = function () {
                var blob = new Blob(chunks, { type: (recorder && recorder.mimeType) || 'audio/webm' });
                myURL = URL.createObjectURL(blob);
                stopStream();
                var cmp = $('sp-compare');
                if (cmp)
                    cmp.classList.add('show');
                var rate = $('sp-rate');
                if (rate)
                    rate.classList.add('show');
                setStatus('錄好了！聽聽看自己 vs 標準音，哪裡不一樣？');
            };
            if (!REDUCE) {
                try {
                    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    var src = audioCtx.createMediaStreamSource(stream);
                    analyser = audioCtx.createAnalyser();
                    analyser.fftSize = 256;
                    src.connect(analyser);
                    startMeter();
                }
                catch (e) { }
            }
            recorder.start();
            recording = true;
            var rb = $('sp-rec');
            if (rb) {
                rb.setAttribute('aria-pressed', 'true');
                rb.textContent = '⏹️ 停止錄音';
            }
            setStatus('錄音中… 對著麥克風把剛剛聽到的唸出來。');
        }).catch(function () {
            recOK = false;
            setStatus('（沒辦法開啟麥克風：可能是沒有允許權限。仍然可以反覆聽、跟著唸喔！）');
            var rb = $('sp-rec');
            if (rb)
                rb.style.display = 'none';
            revealRate();
        });
    }
    function stopRec() {
        if (!recording)
            return;
        recording = false;
        try {
            if (recorder && recorder.state !== 'inactive')
                recorder.stop();
        }
        catch (e) {
            stopStream();
        }
        stopMeter();
        var rb = $('sp-rec');
        if (rb) {
            rb.setAttribute('aria-pressed', 'false');
            rb.textContent = '🎙️ 錄我說';
        }
    }
    function playMine() {
        if (!myURL)
            return;
        stopAudio();
        try {
            if (myAudio) {
                myAudio.pause();
            }
            myAudio = new Audio(myURL);
            myAudio.play();
        }
        catch (e) { }
    }
    function setStatus(msg) { var s = $('sp-status'); if (s)
        s.textContent = msg || ''; }
    /* ---------- 進度（只記練過幾題＋自評，絕不存語音）---------- */
    var STORE_KEY = 'english_speaking_v1';
    function loadProg() { try {
        return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    }
    catch (e) {
        return {};
    } }
    function saveProg(p) { try {
        localStorage.setItem(STORE_KEY, JSON.stringify(p));
    }
    catch (e) { } }
    /* ---------- 進度模型：prog[unitKey]['L'+levelIdx] = {done, ratings} ---------- */
    function unitTotal(u) { var n = 0; (u.levels || []).forEach(function (l) { n += l.items.length; }); return n; }
    function unitDone(prog, u) { var p = prog[u.key] || {}, n = 0; (u.levels || []).forEach(function (l, i) { var e = p['L' + i]; n += (e && e.done) || 0; }); return n; }
    function levelDone(prog, uKey, i) { var e = (prog[uKey] || {})['L' + i]; return (e && e.done) || 0; }
    /* ---------- 主選單（4 單元）---------- */
    function renderMenu() {
        var prog = loadProg();
        var menu = $('sp-menu');
        menu.innerHTML = '';
        if (!UNITS.length) {
            menu.appendChild(el('p', 'sp-menu-note', '（教材資料載入失敗，請重新整理頁面。）'));
            return;
        }
        UNITS.forEach(function (u) {
            var done = unitDone(prog, u), total = unitTotal(u), nlv = (u.levels || []).length;
            var a = el('button', 'cn-lesson');
            a.type = 'button';
            a.setAttribute('aria-label', u.label + '，' + nlv + ' 個等級，共 ' + total + ' 題，已練 ' + done + ' 題');
            a.innerHTML = '<span class="cn-lesson-top"><span class="cn-lesson-emoji" style="background:var(--su-tint)" aria-hidden="true">' + u.emoji + '</span>'
                + '<span class="cn-lesson-name">' + esc(u.label) + '</span></span>'
                + '<span class="cn-lesson-sub">' + esc(u.sub) + '</span>'
                + '<span class="cn-lesson-foot ' + (done > 0 ? 'done' : 'todo') + '">' + nlv + ' 個等級・共 ' + total + ' 題（已練 ' + done + '）</span>';
            a.addEventListener('click', function () { openUnit(u.key); });
            menu.appendChild(a);
        });
    }
    /* ---------- 等級選單（單元 → 5 級）---------- */
    function openUnit(key) {
        curUnit = UNITS.filter(function (u) { return u.key === key; })[0];
        if (!curUnit)
            return;
        if (window.Game && window.Game.pingActive)
            try {
                window.Game.pingActive();
            }
            catch (e) { }
        renderLevels();
        show('screen-levels');
    }
    function renderLevels() {
        var prog = loadProg(), u = curUnit;
        $('levels-title').textContent = u.emoji + ' ' + u.label;
        var wrap = $('sp-levels');
        wrap.innerHTML = '';
        (u.levels || []).forEach(function (lv, i) {
            var done = levelDone(prog, u.key, i), total = lv.items.length;
            var a = el('button', 'cn-lesson');
            a.type = 'button';
            a.setAttribute('aria-label', lv.name + '，共 ' + total + ' 題，已練 ' + done + ' 題');
            a.innerHTML = '<span class="cn-lesson-top"><span class="cn-lesson-emoji" style="background:var(--su-tint)" aria-hidden="true">' + (i + 1) + '</span>'
                + '<span class="cn-lesson-name">' + esc(lv.name) + '</span></span>'
                + '<span class="cn-lesson-sub">' + esc(lv.sub || '') + '</span>'
                + '<span class="cn-lesson-foot ' + (done > 0 ? 'done' : 'todo') + '">已練 ' + done + ' / ' + total + ' 題</span>';
            a.addEventListener('click', function () { startLevel(i); });
            wrap.appendChild(a);
        });
    }
    /* ---------- 練習流程 ---------- */
    var curUnit = null, curLevelIdx = 0, curItems = [], curIdx = 0;
    function startLevel(i) {
        curLevelIdx = i;
        curItems = (curUnit.levels[i] && curUnit.levels[i].items) || [];
        curIdx = 0;
        if (window.Game && window.Game.pingActive)
            try {
                window.Game.pingActive();
            }
            catch (e) { }
        $('play-title').textContent = curUnit.label + '・' + curUnit.levels[i].name;
        show('screen-play');
        renderItem();
    }
    function show(id) {
        var ss = document.querySelectorAll('.sp-screen');
        for (var i = 0; i < ss.length; i++)
            ss[i].classList.remove('active');
        $(id).classList.add('active');
        window.scrollTo(0, 0);
    }
    function renderItem() {
        stopAudio();
        stopRec();
        revokeMine();
        stopStream();
        listened = false;
        var u = curUnit, it = curItems[curIdx];
        var stage = $('stage');
        stage.innerHTML = '';
        var card = el('div', 'sp-card');
        card.appendChild(el('div', 'sp-scorebar', '<span class="sp-lv">' + esc(curUnit.levels[curLevelIdx].name) + '</span><span>第 ' + (curIdx + 1) + ' / ' + curItems.length + ' 題</span>'));
        if (u.type === 'pair') {
            card.appendChild(el('div', 'sp-tag', null)).textContent = '👂 點字聽發音，兩個都唸清楚';
            var pair = el('div', 'sp-pair');
            [['a', 'af'], ['b', 'bf']].forEach(function (kk) {
                var w = el('button', 'sp-word');
                w.type = 'button';
                w.innerHTML = esc(it[kk[0]]) + '<span class="sp-word-ic" aria-hidden="true">🔊</span>';
                w.setAttribute('aria-label', '聽發音：' + it[kk[0]]);
                w.addEventListener('click', function () { playFile(it[kk[1]], false); setStatus('播放：' + it[kk[0]]); markListened(); });
                pair.appendChild(w);
            });
            card.appendChild(pair);
            card.appendChild(el('div', 'sp-zh', esc(it.zh)));
            if (it.note)
                card.appendChild(el('div', 'sp-note', esc(it.note)));
        }
        else if (u.type === 'line') {
            card.appendChild(el('div', 'sp-tag', null)).textContent = '📖 聽一次，跟著唸';
            card.appendChild(el('div', 'sp-say', esc(it.say)));
            card.appendChild(el('div', 'sp-zh', esc(it.zh)));
            if (it.note)
                card.appendChild(el('div', 'sp-note', esc(it.note)));
        }
        else if (u.type === 'dialog') {
            card.appendChild(el('div', 'sp-tag', null)).textContent = '💬 兩邊都唸唸看（點句子可單獨聽）';
            card.appendChild(el('div', 'sp-zh', esc(it.zh)));
            var dlg = el('div', 'sp-dialog');
            it.lines.forEach(function (l) {
                var ln = el('div', 'sp-line');
                ln.appendChild(el('span', 'sp-who', esc(l.who)));
                var en = el('span', 'en', esc(l.en));
                en.setAttribute('role', 'button');
                en.setAttribute('tabindex', '0');
                en.addEventListener('click', function () { playFile(l.f, false); markListened(); });
                en.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    playFile(l.f, false);
                    markListened();
                } });
                ln.appendChild(en);
                dlg.appendChild(ln);
            });
            card.appendChild(dlg);
        }
        else if (u.type === 'prompt') {
            card.appendChild(el('div', 'sp-tag', null)).textContent = '🗣️ 先聽示範，再說自己的';
            card.appendChild(el('div', 'sp-say', (it.emoji ? it.emoji + ' ' : '') + esc(it.prompt)));
            var note = el('div', 'sp-note', '開頭句可以這樣接：');
            var ul = el('ul', 'sp-scaffold');
            it.scaffold.forEach(function (s) { ul.appendChild(el('li', null, '• ' + esc(s))); });
            note.appendChild(ul);
            note.appendChild(el('div', null, '<br>💡 示範：<span class="sp-example">' + esc(it.example) + '</span>'));
            note.appendChild(el('div', null, '<br>' + esc(it.zh) + ' 先按「🔊 聽示範」聽一遍，再換成自己的內容說。'));
            card.appendChild(note);
        }
        // 控制列
        var controls = el('div', 'sp-controls');
        var listenLabel = (u.type === 'pair') ? '🔊 聽兩個字' : (u.type === 'prompt' ? '🔊 聽示範' : (u.type === 'dialog' ? '🔊 聽整段' : '🔊 聽標準音'));
        var bListen = el('button', 'btn btn-secondary');
        bListen.type = 'button';
        bListen.textContent = listenLabel;
        var bSlow = el('button', 'btn btn-secondary');
        bSlow.type = 'button';
        bSlow.textContent = '🐢 慢慢唸';
        controls.appendChild(bListen);
        controls.appendChild(bSlow);
        var bRec = null;
        if (recOK) {
            bRec = el('button', 'btn sp-btn-rec');
            bRec.type = 'button';
            bRec.id = 'sp-rec';
            bRec.textContent = '🎙️ 錄我說';
            bRec.setAttribute('aria-pressed', 'false');
            controls.appendChild(bRec);
        }
        card.appendChild(controls);
        card.appendChild(el('div', 'sp-fallback', '（若沒有聲音，看著上面的字自己唸唸看也很棒！）'));
        var meter = el('div', 'sp-meter');
        meter.setAttribute('aria-hidden', 'true');
        var bar = el('i', null, null);
        bar.id = 'sp-meter-bar';
        meter.appendChild(bar);
        card.appendChild(meter);
        var status = el('div', 'sp-status');
        status.id = 'sp-status';
        status.setAttribute('aria-live', 'polite');
        status.setAttribute('role', 'status');
        card.appendChild(status);
        var cmp = el('div', 'sp-compare');
        cmp.id = 'sp-compare';
        var bStd = el('button', 'btn btn-secondary');
        bStd.type = 'button';
        bStd.textContent = '🔊 再聽標準音';
        var bMine = el('button', 'btn btn-secondary');
        bMine.type = 'button';
        bMine.textContent = '▶️ 聽我的錄音';
        cmp.appendChild(bStd);
        cmp.appendChild(bMine);
        card.appendChild(cmp);
        var rate = el('div', 'sp-rate');
        rate.id = 'sp-rate';
        rate.appendChild(el('div', 'sp-rate-q', '唸完覺得怎麼樣？（沒有對錯，給自己打個氣）'));
        var row = el('div', 'sp-rate-row');
        [['再練練', 'again'], ['不錯', 'ok'], ['很棒！', 'great']].forEach(function (pr) {
            var b = el('button', 'btn btn-secondary');
            b.type = 'button';
            b.textContent = pr[0];
            b.addEventListener('click', function () { rateAndNext(pr[1]); });
            row.appendChild(b);
        });
        rate.appendChild(row);
        card.appendChild(rate);
        var actions = el('div', 'sp-actions');
        var bSkip = el('button', 'btn btn-secondary');
        bSkip.type = 'button';
        bSkip.textContent = (curIdx < curItems.length - 1) ? '下一題 ➡️' : '完成這個等級 🎉';
        bSkip.addEventListener('click', function () { rateAndNext(null); });
        actions.appendChild(bSkip);
        card.appendChild(actions);
        stage.appendChild(card);
        var files = modelFiles(u, it);
        bListen.addEventListener('click', function () { playSeq(files, false); setStatus('播放標準音… 仔細聽，等一下跟著唸。'); markListened(); });
        bSlow.addEventListener('click', function () { playSeq(files, true); setStatus('慢速播放… 一個字一個字聽清楚。'); markListened(); });
        bStd.addEventListener('click', function () { playSeq(files, false); markListened(); });
        bMine.addEventListener('click', playMine);
        if (bRec) {
            bRec.addEventListener('click', function () { if (recording)
                stopRec();
            else
                startRec(); });
        }
        else {
            rate.classList.add('show');
            setStatus('這台裝置不能錄音，聽完跟著唸幾次，再給自己打個氣、進下一題。');
        }
    }
    function rateAndNext(rating) {
        stopAudio();
        stopRec();
        revokeMine();
        stopStream();
        if (rating || listened) { // 聽過就算練過（不綁定錄音），跟讀路徑也記進度
            var prog = loadProg();
            var pu = prog[curUnit.key] || {};
            var lk = 'L' + curLevelIdx;
            var e = pu[lk] || { done: 0, ratings: { again: 0, ok: 0, great: 0 } };
            e.done = Math.max(e.done || 0, curIdx + 1);
            e.ratings = e.ratings || { again: 0, ok: 0, great: 0 };
            if (rating && e.ratings[rating] != null)
                e.ratings[rating]++;
            pu[lk] = e;
            prog[curUnit.key] = pu;
            saveProg(prog);
        }
        if (curIdx < curItems.length - 1) {
            curIdx++;
            renderItem();
        }
        else {
            finishLevel();
        }
    }
    function finishLevel() {
        if (window.Game && window.Game.pingActive)
            try {
                window.Game.pingActive();
            }
            catch (e) { }
        var stage = $('stage');
        stage.innerHTML = '';
        var card = el('div', 'sp-card');
        var hasNext = curLevelIdx < (curUnit.levels.length - 1);
        card.appendChild(el('div', 'sp-say', '🎉 這個等級練完了！'));
        card.appendChild(el('div', 'sp-zh', hasNext ? '開口說的次數越多，會越來越自然。可以挑戰下一個等級，或再練一次。' : '太厲害了，這個單元最高的等級也練完了！再練一次或換個單元都很好。'));
        var actions = el('div', 'sp-actions');
        var again = el('button', 'btn btn-secondary');
        again.type = 'button';
        again.textContent = '再練一次 🔄';
        again.addEventListener('click', function () { curIdx = 0; renderItem(); });
        if (hasNext) {
            var nxt = el('button', 'btn btn-primary');
            nxt.type = 'button';
            nxt.textContent = '下一個等級 ➡️';
            nxt.addEventListener('click', function () { startLevel(curLevelIdx + 1); });
            actions.appendChild(nxt);
        }
        var lvbtn = el('button', 'btn btn-secondary');
        lvbtn.type = 'button';
        lvbtn.textContent = '回等級選單';
        lvbtn.addEventListener('click', backToLevels);
        actions.appendChild(again);
        actions.appendChild(lvbtn);
        card.appendChild(actions);
        stage.appendChild(card);
    }
    function backToLevels() {
        stopAudio();
        stopRec();
        revokeMine();
        stopStream();
        renderLevels();
        show('screen-levels');
    }
    function backToMenu() {
        stopAudio();
        stopRec();
        revokeMine();
        stopStream();
        renderMenu();
        show('screen-menu');
    }
    $('btn-back').addEventListener('click', backToLevels);
    $('btn-back-levels').addEventListener('click', backToMenu);
    window.addEventListener('pagehide', function () { stopAudio(); stopRec(); revokeMine(); stopStream(); });
    window.addEventListener('beforeunload', function () { stopAudio(); revokeMine(); stopStream(); });
    renderMenu();
})();
