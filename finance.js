// @ts-nocheck — 機械式 legacy JS→TS 遷移：verbatim 轉檔、行為等價；型別檢查延後（見 memory stickiness-animation-live Phase 3B）
/* =====================================================================
 * finance.ts  →  (tsc, tsconfig.legacy.json) →  finance.js
 * 原為 finance.html 的 inline <script>；逐檔 TS 遷移抽出成 sibling .js。
 * 行為與原 inline 版等價（verbatim；載入位置不變＝執行時機/順序不變）。
 * 原碼本身即單一頂層 IIFE，已自我隔離（tsc 全域型別檢查無名稱外洩）；verbatim 保留。
 * ===================================================================== */
(function () {
    'use strict';
    // ---- 安全呼叫引擎（引擎必定已於 <head> 同步載入，但仍防禦式檢查） ----
    function record(correct) {
        try {
            if (window.Game && window.Game.recordAnswer)
                window.Game.recordAnswer('finance', !!correct);
        }
        catch (e) { /* 靜默：不阻斷孩子的遊戲 */ }
    }
    function toast(msg, kind) {
        try {
            if (window.Game && window.Game.showToast)
                window.Game.showToast(msg, kind);
        }
        catch (e) { }
    }
    function speak(text) {
        /* 已移除 TTS：本頁非英文發音頁，不需朗讀 */
    }
    // ---- 本頁進度（獨立 key，不與引擎 profile 衝突） ----
    var PROG_KEY = 'finance_progress_v1';
    function loadProg() {
        try {
            return JSON.parse(localStorage.getItem(PROG_KEY)) || {};
        }
        catch (e) {
            return {};
        }
    }
    function saveProg() {
        try {
            localStorage.setItem(PROG_KEY, JSON.stringify(progress));
        }
        catch (e) { }
    }
    var progress = loadProg(); // { units:{ id:{done,best} }, piggy:Number }
    if (!progress.units)
        progress.units = {};
    if (typeof progress.piggy !== 'number')
        progress.piggy = 0;
    function addPiggy(n) { progress.piggy = Math.max(0, progress.piggy + n); saveProg(); }
    // =====================================================================
    // 課程內容（全繁體中文；理財觀念以 9–10 歲可懂、且健康為準）
    // 計分步型別（每題只計一次分）：choose / match / nw / budget / pricing / addet /
    //                                stall（旗艦，於結算理解題計一次分）
    // 不計分步型別（互動或情感，不呼叫 record）：fact / fork / piggy / bank / share
    // =====================================================================
    var SCORED = { choose: 1, match: 1, nw: 1, budget: 1, pricing: 1, addet: 1, stall: 1 };
    var UNITS = [
        // ---------- 第 1 關 ----------
        {
            id: 'u1', emoji: '🪙', name: '錢從哪裡來？工作與價值', game: '工作配對',
            steps: [
                { t: 'fact', v: '🪙', s: '錢，是大家同意用來交換東西的好工具。',
                    more: '假如今天全世界都沒有錢：你想拿高麗菜換一條魚，可是賣魚的人不缺高麗菜，怎麼辦呢？有了大家都同意的「錢」，交換就方便多了。' },
                { t: 'choose', v: '💼', s: '大部分的錢，是從哪裡來的？',
                    opts: ['靠工作賺來的', '從天上掉下來', '撿到就會有'], ans: 0,
                    why: '錢多半來自工作，工作就是幫別人解決問題、做出別人需要的東西。' },
                { t: 'match', v: '🧩', s: '把「工作」連到它幫大家解決的問題！',
                    pairs: [
                        { job: '👩‍⚕️ 醫生', prob: '有人生病了' },
                        { job: '🚌 公車司機', prob: '有人要去比較遠的地方' },
                        { job: '👨‍🌾 農夫', prob: '大家肚子餓，要吃東西' },
                        { job: '👩‍🏫 老師', prob: '有人想學新的知識' }
                    ],
                    why: '每一種工作，都是在幫別人解決一個問題、提供大家需要的東西或服務。' },
                { t: 'choose', v: '💡', s: '所以「賺錢」，其實就是？',
                    opts: ['提供別人需要的東西或服務', '憑空把錢變出來', '把別人的錢搶過來'], ans: 0,
                    why: '賺錢＝幫別人解決問題、提供價值，不是憑空出現，也不是搶來的。' }
            ]
        },
        // ---------- 第 2 關 ----------
        {
            id: 'u2', emoji: '🧺', name: '需要 vs 想要', game: '兩個籃子',
            steps: [
                { t: 'fact', v: '🧺', s: '需要是生活不能少的；想要是有了更開心、沒有也能活。',
                    more: '需要：食物、乾淨的水、衣服、住的地方。想要：貼紙、扭蛋、新玩具。錢有限的時候，先顧需要。' },
                { t: 'nw', v: '🧺', s: '幫每樣東西找到正確的籃子！',
                    items: [
                        { e: '🍱', n: '便當', need: true },
                        { e: '💧', n: '乾淨的水', need: true },
                        { e: '🧥', n: '下雨天的雨衣', need: true },
                        { e: '✨', n: '貼紙', need: false },
                        { e: '🥚', n: '扭蛋', need: false },
                        { e: '🚗', n: '新玩具車', need: false }
                    ],
                    why: '便當、乾淨的水、雨衣是「需要」；貼紙、扭蛋、玩具車是「想要」。' },
                { t: 'choose', v: '🤔', s: '同一樣東西，會不會有時是需要、有時是想要？',
                    opts: ['會，要看情況', '不會，永遠都一樣'], ans: 0,
                    why: '例如雨傘：下雨天出門一定要用，是需要；天氣好時只是想拿好看的款式，就變成想要了。' },
                { t: 'choose', v: '💰', s: '錢不夠用的時候，我們應該先顧？',
                    opts: ['需要', '想要'], ans: 0,
                    why: '錢有限，先把「需要」顧好，剩下的再考慮「想要」。' }
            ]
        },
        // ---------- 第 3 關 ----------
        {
            id: 'u3', emoji: '🐷', name: '存錢高手：設定目標', game: '撲滿溫度計',
            steps: [
                { t: 'fact', v: '🐷', s: '存錢就是先不花，把錢留到以後用。',
                    more: '拿到錢，先分三罐：存起來、花用、分享。看得到的目標，會讓存錢更有動力！' },
                { t: 'choose', v: '🧱', s: '小傑想買 300 元的樂高，每週存 30 元，要存幾週？',
                    opts: ['10 週', '3 週', '30 週'], ans: 0,
                    why: '300 ÷ 30 ＝ 10，所以要存 10 週。慢慢存，一定存得到！' },
                { t: 'piggy', v: '🐷', s: '一格一格把撲滿存滿，達成你的目標！',
                    goal: 10, per: 30,
                    why: '每存一筆就填滿一格，看著目標一步步接近，這就是存錢的成就感。' },
                { t: 'choose', v: '⏳', s: '想買的東西還要再等一下才存夠，這叫做？',
                    opts: ['延遲享受（先忍一下，之後更值得）', '永遠都不能買'], ans: 0,
                    why: '延遲享受＝先等一下、先存夠，之後拿到會更開心，也不會亂花錢。' },
                { t: 'choose', v: '🎯', s: '存錢最主要的動力，應該是？',
                    opts: ['達成自己想要的目標', '希望錢自己愈變愈多'], ans: 0,
                    why: '存錢是為了達成目標的成就感，不是為了不勞而獲喔。' }
            ]
        },
        // ---------- 第 4 關 ----------
        {
            id: 'u4', emoji: '📋', name: '做預算：聰明花錢', game: '同樂會採購',
            steps: [
                { t: 'fact', v: '📋', s: '預算就是先計畫錢怎麼分，再去花。',
                    more: '把錢分給需要、想要、存錢和分享，才不會提早花光。買東西前先看看：這樣會不會超過預算？' },
                { t: 'budget', v: '🎉', s: '同樂會有 200 元，挑東西但不要超過喔！',
                    budget: 200,
                    items: [
                        { e: '🍪', n: '大家分著吃的餅乾', price: 60 },
                        { e: '🧃', n: '果汁', price: 50 },
                        { e: '🎈', n: '氣球布置', price: 40 },
                        { e: '🍭', n: '棒棒糖', price: 30 },
                        { e: '🎁', n: '小禮物（想要）', price: 80 },
                        { e: '🎊', n: '拉炮（想要）', price: 45 }
                    ],
                    why: '控制在 200 元以內就過關了！剩下的錢，可以存進撲滿。' },
                { t: 'choose', v: '⚖️', s: '「量入為出」是什麼意思？',
                    opts: ['看自己有多少錢，再決定怎麼花', '想花多少就花多少'], ans: 0,
                    why: '量入為出＝先看有多少收入，再照著計畫花，不會透支。' },
                { t: 'choose', v: '🧮', s: '收入 100 元，花掉 70 元，還剩多少？',
                    opts: ['30 元', '170 元', '70 元'], ans: 0,
                    why: '收入 100 減支出 70 ＝ 剩下 30 元。剩下的可以存起來。' }
            ]
        },
        // ---------- 第 5 關 ----------
        {
            id: 'u5', emoji: '🍴', name: '選一個就少一個（取捨）', game: '岔路二選一',
            steps: [
                { t: 'fact', v: '🍴', s: '資源有限，選了一個，就要放掉另一個。',
                    more: '被你放掉的那個選擇，就是這次的「代價」。時間也是一種資源喔！（大人叫它「機會成本」）' },
                { t: 'fork', v: '🕑', s: '週六只有 2 小時，你會選哪一個？（兩個都很好，選了就要放掉另一個）',
                    left: { e: '⚽', name: '去打球' }, right: { e: '📺', name: '看兩集卡通' } },
                { t: 'choose', v: '📚', s: '把 100 元拿去買漫畫，你的撲滿會怎樣？',
                    opts: ['少一格（因為錢用掉了）', '多一格', '完全不變'], ans: 0,
                    why: '錢花掉了，撲滿就少一格。這就是選擇的代價——選了漫畫，就少了存款。' },
                { t: 'choose', v: '🔀', s: '所以，每一個決定都會？',
                    opts: ['有代價（要放掉別的東西）', '什麼都不用放掉'], ans: 0,
                    why: '沒有「全部都要」這回事；每個選擇都要放掉別的，先比較再決定最聰明。' }
            ]
        },
        // ---------- 第 6 關 ----------
        {
            id: 'u6', emoji: '🏦', name: '銀行與利息：錢放對地方更安全', game: '小小銀行家',
            steps: [
                { t: 'fact', v: '🏦', s: '銀行是幫大家保管錢的地方，比放家裡更安全。',
                    more: '你存進去的錢，銀行會拿去借給需要的人；因為用了你的錢，就回饋你一點點當謝禮——這不是讓錢自己變多的方法喔。' },
                { t: 'bank', v: '🏦', s: '把金幣存進銀行，看看會發生什麼事！',
                    why: '你存了 10 個，銀行多給你 1 個。因為銀行拿你的錢去借給別人用，所以回饋你一點點；利息不是憑空變出來的。' },
                { t: 'choose', v: '🎁', s: '銀行為什麼會多給你「一點點謝禮」？',
                    opts: ['銀行拿你的錢去借給別人用，就回饋你一點點', '因為錢會自己愈變愈多'], ans: 0,
                    why: '銀行把你存的錢借給需要的人，用了你的錢，就回饋你一點點。利息是這樣來的，不是憑空出現的喔。' },
                { t: 'choose', v: '🤝', s: '（可選小知識）跟銀行借 10 個，之後大約要還幾個？',
                    opts: ['要還比較多，例如 11 個', '只要還 10 個', '可以都不用還'], ans: 0,
                    why: '借錢是要負責任、要還的事，而且要多還一些。借之前先問自己：「我還得起嗎？非借不可嗎？」' },
                { t: 'choose', v: '🛒', s: '同樣的錢，以後東西可能變貴。所以存錢最主要是為了？',
                    opts: ['安全，還有為了達成目標', '讓錢自己愈滾愈多'], ans: 0,
                    why: '錢放銀行主要是「安全」，而且以後東西可能變貴，所以要為目標好好存，不是空等就會變多。' }
            ]
        },
        // ---------- 第 7 關 ----------
        {
            id: 'u7', emoji: '🏷️', name: '價格的祕密：供需', game: '訂價滑桿',
            steps: [
                { t: 'fact', v: '🏷️', s: '想買的人多、東西又少，價格通常會變貴。',
                    more: '反過來，想買的人少、東西又多，價格就會變便宜。這就是「供需」——先看有多少人想買，再決定價格。' },
                { t: 'choose', v: '☀️', s: '夏天大家都搶著買冰紅茶，可是只有一攤在賣，價格會？',
                    opts: ['比較貴（想買的人多、東西少）', '比較便宜'], ans: 0,
                    why: '想買的人多、貨又少，賣 25 元也有人買，價格就會比較貴。' },
                { t: 'choose', v: '❄️', s: '冬天幾乎沒人想喝冰紅茶，想把它賣掉就要？',
                    opts: ['降價（沒人買就要便宜一點）', '賣得更貴'], ans: 0,
                    why: '想買的人變少，就要降價，甚至送小餅乾，才賣得出去。' },
                { t: 'pricing', v: '🥤', s: '幫小攤子找到「剛剛好」的價格！',
                    weather: '☀️ 今天大晴天，很多人想喝冰的', customers: 20, cost: 5, min: 10, max: 30,
                    why: '價格太高沒人買、太低賺不多；找到剛剛好的「甜蜜價格」，賺最多！' }
            ]
        },
        // ---------- 第 8 關（旗艦） ----------
        {
            id: 'u8', emoji: '🍋', name: '小小創業家：我的小攤子', game: '經營模擬', flagship: true,
            steps: [
                { t: 'fact', v: '🍋', s: '創業就是發現別人的需要，做出來、賺一點利潤。',
                    more: '利潤＝收入減成本。做生意會有賣不掉的風險，虧本是很正常的學習，誠實對客人，生意才做得久。' },
                { t: 'choose', v: '🔖', s: '一張書籤成本 3 元，賣 10 元，賺多少？',
                    opts: ['7 元', '13 元', '3 元'], ans: 0,
                    why: '利潤＝收入 10 減成本 3 ＝ 7 元。賣一張賺 7 元。' },
                { t: 'stall', v: '🍋',
                    why: '打烊了！你的「決定」（進貨量、訂價）和「運氣」（天氣）是分開的——運氣不能控制，但你的決定可以愈來愈聰明。' }
            ]
        },
        // ---------- 第 9 關 ----------
        {
            id: 'u9', emoji: '📢', name: '聰明消費者：看穿廣告', game: '廣告偵探',
            steps: [
                { t: 'fact', v: '📢', s: '廣告的目的是讓你想買，不代表你真的需要。',
                    more: '聰明的消費者會比價、先想一想再決定，不會被「限時」「大家都有」牽著走。' },
                { t: 'addet', v: '🕵️', s: '找出這張假廣告裡「催你快買」的話術！',
                    tricks: ['最後一天！', '大家都買了！', '買到賺到，不買虧大了！'],
                    plains: ['成分：茶葉、水', '一杯 25 元'],
                    why: '「限時」「大家都有」「誇大」都是催你快花錢的話術。看到它們，先停一下！' },
                { t: 'choose', v: '⏸️', s: '廣告大喊「最後一天！限時特價！」，聰明的你會？',
                    opts: ['先停一下，想想我需不需要', '馬上衝去買，不然來不及'], ans: 0,
                    why: '買前三問：停一下、比一比、問自己「這是需要嗎？」。「限時」常常只是催你快花錢。' },
                { t: 'choose', v: '🔍', s: '要買水壺：A 店一個 120 元，B 店買一送一（兩個一共 130 元）。聰明消費會先做什麼？',
                    opts: ['先想需要幾個，再比每個多少錢', '看到買一送一就馬上多買'], ans: 0,
                    why: '先想需要幾個：只要一個時，A 店 120 元比較省；真的需要兩個，B 店平均一個 65 元才划算。先想需要、再比價，別被「送一個」牽著多買。' },
                { t: 'choose', v: '🎁', s: '有人說「只要先付一點錢，就能免費得到大獎，保證穩賺！」聰明的你會？',
                    opts: ['不太可能有這種好康，先停下來、問爸媽或老師', '太棒了，趕快先把錢付出去'], ans: 0,
                    why: '天上不會掉下免費的大獎；「先付錢、保證穩賺」常常是騙人的。遇到好得不像真的的事，先停下來，跟爸媽或老師討論。' }
            ]
        },
        // ---------- 第 10 關 ----------
        {
            id: 'u10', emoji: '🌍', name: '分享、幫助與公平的社會', game: '分享罐',
            steps: [
                { t: 'fact', v: '🌍', s: '努力和好點子可以換到報酬，但每個人的起點不一樣。',
                    more: '市場社會讓人靠努力得到回報（有動力、有選擇），可是有人比較辛苦，所以我們也要注意公平、願意幫忙。' },
                { t: 'choose', v: '🍞', s: '阿明的麵包做得又好又用心，客人很多、收入不錯。這代表？',
                    opts: ['努力和好點子，會有回報', '他只是運氣好而已'], ans: 0,
                    why: '用心做出大家需要的好東西，就會有回報。這是市場的好處之一。' },
                { t: 'choose', v: '🤝', s: '腳受傷的阿婆工作不方便，村子裡的人可以怎麼做？',
                    opts: ['大家輪流幫忙她', '不理她，那是她的事'], ans: 0,
                    why: '除了自己過得好，也可以關心比較辛苦的人。一起幫忙，社會更溫暖、更公平。' },
                { t: 'share', v: '💚', s: '你願意把一點利潤放進「分享罐」，幫助食物銀行嗎？（做不做都可以）',
                    why: '分享是自願的。不管放不放，你都很棒——分享不是為了得分，是因為想讓別人也好一點。' },
                { t: 'fact', v: '🌈', s: '自己過得好，也幫別人一起好，社會就會愈來愈美。',
                    more: '賺錢、存錢、分清楚需要和想要、當聰明又善良的消費者，還願意分享——你就是真正的理財小達人！' }
            ]
        }
    ];
    // =====================================================================
    // DOM 參照
    // =====================================================================
    var $ = function (id) { return document.getElementById(id); };
    var screenMenu = $('screen-menu');
    var screenPlay = $('screen-play');
    var unitList = $('unit-list');
    var stage = $('stage');
    var stepDots = $('step-dots');
    var playTitle = $('play-title');
    var cur = null; // { unit, idx, correctCount, total }
    // =====================================================================
    // 選單渲染
    // =====================================================================
    function scoringSteps(unit) {
        var n = 0;
        for (var i = 0; i < unit.steps.length; i++)
            if (SCORED[unit.steps[i].t])
                n++;
        return n;
    }
    function renderMenu() {
        var doneCount = 0;
        for (var i = 0; i < UNITS.length; i++)
            if (progress.units[UNITS[i].id] && progress.units[UNITS[i].id].done)
                doneCount++;
        $('ov-done').textContent = doneCount + '/' + UNITS.length;
        var p = null;
        try {
            p = window.Game && window.Game.getProfile ? window.Game.getProfile() : null;
        }
        catch (e) { }
        if (p)
            $('ov-xp').textContent = (p.subjects && p.subjects.finance ? p.subjects.finance.xp : 0);
        $('ov-piggy').textContent = progress.piggy;
        if (doneCount > 0) {
            $('hello-text').textContent = '歡迎回來！你已經完成 ' + doneCount + ' 關，好棒！';
            $('hello-sub').textContent = doneCount >= UNITS.length ? '十關都完成了，你是理財小達人！🏆' : '接著挑戰還沒玩過的關卡吧！';
        }
        unitList.innerHTML = '';
        for (var u = 0; u < UNITS.length; u++) {
            (function (unit, num) {
                var st = progress.units[unit.id] || {};
                var done = !!st.done;
                var stars = st.best || 0;
                var total = scoringSteps(unit);
                var card = document.createElement('button');
                card.type = 'button';
                card.className = 'fi-unit' + (unit.flagship ? ' flagship' : '');
                card.setAttribute('aria-label', '第 ' + num + ' 關：' + unit.name);
                var dots = '';
                for (var d = 0; d < total; d++)
                    dots += '<i class="' + (d < stars ? 'on' : '') + '"></i>';
                card.innerHTML =
                    '<div class="fi-unit-top">' +
                        '<span class="fi-unit-emoji" aria-hidden="true">' + unit.emoji + '</span>' +
                        '<div>' +
                        '<div class="fi-unit-num">第 ' + num + ' 關・' + unit.game + (unit.flagship ? ' ⭐旗艦' : '') + '</div>' +
                        '<div class="fi-unit-name">' + unit.name + '</div>' +
                        '</div>' +
                        '</div>' +
                        '<div class="fi-unit-foot">' +
                        '<span class="fi-unit-status ' + (done ? 'done' : 'todo') + '">' +
                        (done ? '✅ 已完成' : '▶️ 開始玩<span style="white-space:nowrap">（共 ' + total + ' 題）</span>') + '</span>' +
                        '<span class="fi-unit-dots" aria-hidden="true">' + dots + '</span>' +
                        '</div>';
                card.addEventListener('click', function () { startUnit(unit); });
                unitList.appendChild(card);
            })(UNITS[u], u + 1);
        }
    }
    // =====================================================================
    // 遊玩流程
    // =====================================================================
    function show(screen) {
        screenMenu.classList.remove('active');
        screenPlay.classList.remove('active');
        screen.classList.add('active');
        window.scrollTo(0, 0);
    }
    function startUnit(unit) {
        cur = { unit: unit, idx: 0, correctCount: 0, total: scoringSteps(unit) };
        playTitle.textContent = unit.emoji + ' ' + unit.name;
        show(screenPlay);
        renderStep();
    }
    function renderStepDots() {
        stepDots.innerHTML = '';
        for (var i = 0; i < cur.unit.steps.length; i++) {
            var b = document.createElement('i');
            if (i < cur.idx)
                b.className = 'on';
            else if (i === cur.idx)
                b.className = 'cur';
            stepDots.appendChild(b);
        }
    }
    function next() {
        cur.idx++;
        if (cur.idx >= cur.unit.steps.length)
            finishUnit();
        else
            renderStep();
    }
    function ttsButton(text) {
        /* 已移除 TTS：本頁非英文發音頁，不再顯示朗讀按鈕 */
        return '';
    }
    function bindTts(root) {
        /* 已移除 TTS：本頁非英文發音頁，無朗讀按鈕可綁定 */
    }
    function scoreOnce(step, correct) {
        // 每個計分步只計一次；答對才 correctCount++（星等用）。
        record(correct);
        if (correct)
            cur.correctCount++;
    }
    function renderStep() {
        renderStepDots();
        var step = cur.unit.steps[cur.idx];
        var fn = {
            fact: renderFact, choose: renderChoose, match: renderMatch, nw: renderNW,
            piggy: renderPiggy, budget: renderBudget, fork: renderFork, bank: renderBank,
            pricing: renderPricing, stall: renderStall, addet: renderAdDetective, share: renderShare
        }[step.t];
        if (fn)
            fn(step);
    }
    // ---- fact ----
    function renderFact(step) {
        stage.innerHTML =
            '<div class="fi-stage">' +
                '<div class="fi-visual" aria-hidden="true">' + step.v + '</div>' +
                '<p class="fi-sentence">' + step.s + '</p>' +
                '<div class="fi-toolrow">' + ttsButton(step.s) +
                (step.more ? '<button type="button" class="btn" id="btn-more">💡 看更多</button>' : '') + '</div>' +
                (step.more ? '<div class="fi-reveal" id="reveal">' + step.more + '</div>' : '') +
                '</div>' +
                '<div class="fi-actions"><button type="button" class="btn btn-primary btn-block" id="btn-next">繼續 ➡️</button></div>';
        bindTts(stage);
        if (step.more)
            $('btn-more').addEventListener('click', function () { $('reveal').classList.add('show'); speak(step.more); });
        $('btn-next').addEventListener('click', next);
    }
    // ---- choose ----
    function renderChoose(step) {
        var order = [];
        for (var oi = 0; oi < step.opts.length; oi++)
            order.push(oi);
        for (var m = order.length - 1; m > 0; m--) {
            var r = Math.floor(Math.random() * (m + 1));
            var tt = order[m];
            order[m] = order[r];
            order[r] = tt;
        }
        var optsHtml = '';
        for (var k = 0; k < order.length; k++) {
            var origIdx = order[k];
            optsHtml += '<button type="button" class="fi-opt" data-i="' + origIdx + '">' +
                '<span>' + step.opts[origIdx] + '</span><span class="fi-opt-mark" aria-hidden="true"></span></button>';
        }
        stage.innerHTML =
            '<div class="fi-stage">' +
                '<div class="fi-visual" aria-hidden="true">' + step.v + '</div>' +
                '<p class="fi-sentence">' + step.s + '</p>' +
                '<div class="fi-toolrow">' + ttsButton(step.s) + '</div>' +
                '<div class="fi-options">' + optsHtml + '</div>' +
                '<div class="fi-reveal" id="reveal"></div>' +
                '</div>' +
                '<div class="fi-actions" id="afteract" style="display:none">' +
                '<button type="button" class="btn btn-primary btn-block" id="btn-next">繼續 ➡️</button></div>';
        bindTts(stage);
        var answered = false;
        var btns = stage.querySelectorAll('.fi-opt');
        for (var b = 0; b < btns.length; b++) {
            btns[b].addEventListener('click', function () {
                var i = parseInt(this.getAttribute('data-i'), 10);
                var isCorrect = (i === step.ans);
                if (answered) {
                    // 第一次答錯後的重試：只給視覺提示，不再重複計分。
                    if (isCorrect) {
                        this.classList.add('correct');
                        this.querySelector('.fi-opt-mark').textContent = '✅';
                    }
                    else {
                        this.classList.add('wrong');
                        this.querySelector('.fi-opt-mark').textContent = '❌';
                    }
                    return;
                }
                answered = true;
                scoreOnce(step, isCorrect); // 每題只計一次分（第一次作答）
                if (isCorrect) {
                    this.classList.add('correct');
                    this.querySelector('.fi-opt-mark').textContent = '✅';
                }
                else {
                    this.classList.add('wrong');
                    this.querySelector('.fi-opt-mark').textContent = '❌';
                    var correctBtn = stage.querySelector('.fi-opt[data-i="' + step.ans + '"]');
                    if (correctBtn) {
                        correctBtn.classList.add('correct');
                        correctBtn.querySelector('.fi-opt-mark').textContent = '✅';
                    }
                }
                var rev = $('reveal');
                rev.textContent = (isCorrect ? '答對了！' : '沒關係，再想想～答案是這個！') + (step.why || '');
                rev.classList.add('show');
                $('afteract').style.display = 'flex';
                var all = stage.querySelectorAll('.fi-opt');
                for (var q = 0; q < all.length; q++)
                    all[q].disabled = true;
            });
        }
        $('btn-next').addEventListener('click', next);
    }
    // ---- match（工作 → 問題 配對） ----
    function renderMatch(step) {
        var jobs = step.pairs.map(function (p, i) { return { text: p.job, i: i }; });
        var probs = step.pairs.map(function (p, i) { return { text: p.prob, i: i }; });
        shuffle(jobs);
        shuffle(probs);
        var jobsHtml = '', probsHtml = '';
        for (var a = 0; a < jobs.length; a++)
            jobsHtml += '<button type="button" class="fi-tile fi-job" data-i="' + jobs[a].i + '">' + jobs[a].text + '</button>';
        for (var b = 0; b < probs.length; b++)
            probsHtml += '<button type="button" class="fi-tile fi-prob" data-i="' + probs[b].i + '">' + probs[b].text + '</button>';
        stage.innerHTML =
            '<div class="fi-stage">' +
                '<div class="fi-visual" aria-hidden="true">' + step.v + '</div>' +
                '<p class="fi-sentence">' + step.s + '</p>' +
                '<div class="fi-toolrow">' + ttsButton(step.s) + '</div>' +
                '<div class="fi-match">' +
                '<div><div class="fi-match-col-label">工作</div>' + jobsHtml + '</div>' +
                '<div><div class="fi-match-col-label">幫忙解決的問題</div>' + probsHtml + '</div>' +
                '</div>' +
                '<div class="fi-reveal" id="reveal">' + (step.why || '') + '</div>' +
                '</div>' +
                '<div class="fi-actions" id="afteract" style="display:none">' +
                '<button type="button" class="btn btn-primary btn-block" id="btn-next">全部配對好了，繼續 ➡️</button></div>';
        bindTts(stage);
        var selJob = null, matched = 0, scored = false;
        var total = step.pairs.length;
        function clearSel() {
            var s = stage.querySelector('.fi-job.sel');
            if (s)
                s.classList.remove('sel');
            selJob = null;
        }
        function tryFinish() {
            if (matched === total && !scored) {
                scored = true;
                scoreOnce(step, true); // 全部正確配對＝完成，計一次正向互動
                $('reveal').classList.add('show');
                $('afteract').style.display = 'flex';
                toast('全部配對成功！🎉', 'badge');
            }
        }
        function onProb(probEl) {
            if (!selJob) {
                probEl.classList.add('shake');
                setTimeout(function () { probEl.classList.remove('shake'); }, 320);
                return;
            }
            var ji = selJob.getAttribute('data-i');
            var pi = probEl.getAttribute('data-i');
            if (ji === pi) {
                selJob.classList.remove('sel');
                selJob.classList.add('matched');
                selJob.disabled = true;
                probEl.classList.add('matched');
                probEl.disabled = true;
                selJob = null;
                matched++;
                tryFinish();
            }
            else {
                probEl.classList.add('shake');
                var jb = selJob;
                setTimeout(function () { probEl.classList.remove('shake'); if (jb)
                    jb.classList.remove('sel'); }, 320);
                selJob = null;
            }
        }
        var jobBtns = stage.querySelectorAll('.fi-job');
        for (var jj = 0; jj < jobBtns.length; jj++) {
            jobBtns[jj].addEventListener('click', function () {
                if (this.classList.contains('matched'))
                    return;
                clearSel();
                this.classList.add('sel');
                selJob = this;
            });
        }
        var probBtns = stage.querySelectorAll('.fi-prob');
        for (var pp = 0; pp < probBtns.length; pp++) {
            probBtns[pp].addEventListener('click', function () { if (!this.classList.contains('matched'))
                onProb(this); });
        }
        $('btn-next').addEventListener('click', next);
    }
    // ---- nw（需要 / 想要） ----
    function renderNW(step) {
        var items = step.items.slice();
        shuffle(items);
        var rows = '';
        for (var i = 0; i < items.length; i++) {
            rows += '<div class="fi-nw-row" data-i="' + i + '" data-need="' + (items[i].need ? '1' : '0') + '">' +
                '<span class="fi-nw-item"><span class="fi-nw-emoji" aria-hidden="true">' + items[i].e + '</span>' + items[i].n + '</span>' +
                '<span class="fi-nw-btns">' +
                '<button type="button" class="fi-nw-btn" data-ans="1">需要</button>' +
                '<button type="button" class="fi-nw-btn" data-ans="0">想要</button>' +
                '</span></div>';
        }
        stage.innerHTML =
            '<div class="fi-stage">' +
                '<div class="fi-visual" aria-hidden="true">' + step.v + '</div>' +
                '<p class="fi-sentence">' + step.s + '</p>' +
                '<div class="fi-toolrow">' + ttsButton(step.s) + '</div>' +
                '<div>' + rows + '</div>' +
                '<div class="fi-reveal" id="reveal">' + (step.why || '') + '</div>' +
                '</div>' +
                '<div class="fi-actions" id="afteract" style="display:none">' +
                '<button type="button" class="btn btn-primary btn-block" id="btn-next">全部分好了，繼續 ➡️</button></div>';
        bindTts(stage);
        var done = 0, scored = false;
        var total = items.length;
        var rowEls = stage.querySelectorAll('.fi-nw-row');
        for (var r = 0; r < rowEls.length; r++) {
            (function (row) {
                var need = row.getAttribute('data-need') === '1';
                var btns = row.querySelectorAll('.fi-nw-btn');
                for (var b = 0; b < btns.length; b++) {
                    btns[b].addEventListener('click', function () {
                        if (row.classList.contains('done'))
                            return;
                        var ans = this.getAttribute('data-ans') === '1';
                        if (ans === need) {
                            row.classList.add('done');
                            row.querySelector('.fi-nw-btns').innerHTML = '<span class="fi-nw-tag">✅ ' + (need ? '需要' : '想要') + '</span>';
                            done++;
                            if (done === total && !scored) {
                                scored = true;
                                scoreOnce(step, true);
                                $('reveal').classList.add('show');
                                $('afteract').style.display = 'flex';
                                toast('全部分對了！👍', 'badge');
                            }
                        }
                        else {
                            this.classList.add('wrong');
                            var badBtn = this;
                            badBtn.textContent = '再想想';
                            setTimeout(function () { badBtn.textContent = ans ? '需要' : '想要'; badBtn.classList.remove('wrong'); }, 700);
                        }
                    });
                }
            })(rowEls[r]);
        }
        $('btn-next').addEventListener('click', next);
    }
    // ---- piggy（撲滿溫度計；不計分、達標情感慶祝） ----
    function renderPiggy(step) {
        var goal = step.goal, per = step.per, filled = 0;
        var segs = '';
        for (var i = 0; i < goal; i++)
            segs += '<div class="fi-thermo-seg" data-i="' + i + '"></div>';
        stage.innerHTML =
            '<div class="fi-stage">' +
                '<div class="fi-visual" aria-hidden="true">' + step.v + '</div>' +
                '<p class="fi-sentence">' + step.s + '</p>' +
                '<div class="fi-note" style="max-width:34ch;margin:0 auto var(--s3)"><span class="fi-note-ico">💡</span><span>這是學習點數，不是真的錢。</span></div>' +
                '<div class="fi-thermo" id="thermo" aria-hidden="true">' + segs + '</div>' +
                '<div class="fi-goal-line" id="goal-line">已存 0 / ' + (goal * per) + ' 元</div>' +
                '<div class="fi-toolrow" style="margin-top:var(--s3)">' +
                '<button type="button" class="btn btn-primary" id="btn-save">存 ' + per + ' 元 🐷</button></div>' +
                '<div class="fi-reveal" id="reveal">' + (step.why || '') + '</div>' +
                '</div>' +
                '<div class="fi-actions" id="afteract" style="display:none">' +
                '<button type="button" class="btn btn-primary btn-block" id="btn-next">達成目標，繼續 ➡️</button></div>';
        bindTts(stage);
        $('btn-save').addEventListener('click', function () {
            if (filled >= goal)
                return;
            var seg = stage.querySelector('.fi-thermo-seg[data-i="' + filled + '"]');
            if (seg)
                seg.classList.add('on');
            filled++;
            $('goal-line').textContent = '已存 ' + (filled * per) + ' / ' + (goal * per) + ' 元';
            if (filled >= goal) {
                this.disabled = true;
                this.textContent = '存滿了！🎉';
                $('reveal').classList.add('show');
                $('afteract').style.display = 'flex';
                toast('達成存錢目標！🎉 你好有耐心！', 'badge');
                speak('達成目標！你好棒，靠耐心存到了！');
            }
        });
        $('btn-next').addEventListener('click', next);
    }
    // ---- budget（同樂會採購） ----
    function renderBudget(step) {
        var items = step.items;
        var picked = {};
        var itemsHtml = '';
        for (var i = 0; i < items.length; i++) {
            itemsHtml += '<div class="fi-shop-item" data-i="' + i + '">' +
                '<span class="fi-shop-check" aria-hidden="true">⬜</span>' +
                '<span class="fi-shop-emoji" aria-hidden="true">' + items[i].e + '</span>' +
                '<span class="fi-shop-name">' + items[i].n + '</span>' +
                '<span class="fi-shop-price">' + items[i].price + ' 元</span></div>';
        }
        stage.innerHTML =
            '<div class="fi-stage">' +
                '<div class="fi-visual" aria-hidden="true">' + step.v + '</div>' +
                '<p class="fi-sentence">' + step.s + '</p>' +
                '<div class="fi-toolrow">' + ttsButton(step.s) + '</div>' +
                '<div class="fi-note" style="max-width:34ch;margin:0 auto var(--s3)"><span class="fi-note-ico">💡</span><span>這是假裝的同樂會，用來練習算錢，不是真的錢。</span></div>' +
                '<div>還剩 <span class="fi-money" id="remain">' + step.budget + '</span> 元</div>' +
                '<div class="fi-shop">' + itemsHtml + '</div>' +
                '<div class="fi-reveal" id="reveal"></div>' +
                '</div>' +
                '<div class="fi-actions">' +
                '<button type="button" class="btn btn-primary" id="btn-checkout" disabled>就買這些 ✓</button>' +
                '<button type="button" class="btn btn-primary" id="btn-next" style="display:none">繼續 ➡️</button></div>';
        bindTts(stage);
        var answered = false;
        function total() { var t = 0; for (var k in picked)
            if (picked[k])
                t += items[k].price; return t; }
        function refresh() {
            var spent = total();
            var remain = step.budget - spent;
            var el = $('remain');
            el.textContent = remain;
            el.classList.toggle('over', remain < 0);
            var anyPicked = spent > 0;
            $('btn-checkout').disabled = !(anyPicked && remain >= 0) || answered;
        }
        var rows = stage.querySelectorAll('.fi-shop-item');
        for (var r = 0; r < rows.length; r++) {
            rows[r].addEventListener('click', function () {
                if (answered)
                    return;
                var i = this.getAttribute('data-i');
                picked[i] = !picked[i];
                this.classList.toggle('pick', picked[i]);
                this.querySelector('.fi-shop-check').textContent = picked[i] ? '✅' : '⬜';
                refresh();
            });
        }
        $('btn-checkout').addEventListener('click', function () {
            if (answered)
                return;
            answered = true;
            var remain = step.budget - total();
            var ok = remain >= 0; // 能到這裡一定 >=0，但保險判斷
            scoreOnce(step, ok);
            var rev = $('reveal');
            rev.textContent = '控制在預算內，過關！剩下的 ' + remain + ' 元可以存進撲滿。' + (step.why || '');
            rev.classList.add('show');
            if (remain > 0) {
                addPiggy(remain);
                toast('剩下 ' + remain + ' 元存進撲滿！🐷', 'badge');
            }
            this.style.display = 'none';
            $('btn-next').style.display = 'inline-flex';
        });
        $('btn-next').addEventListener('click', next);
        refresh();
    }
    // ---- fork（岔路二選一；不計分、感受取捨） ----
    function renderFork(step) {
        stage.innerHTML =
            '<div class="fi-stage">' +
                '<div class="fi-visual" aria-hidden="true">' + step.v + '</div>' +
                '<p class="fi-sentence">' + step.s + '</p>' +
                '<div class="fi-toolrow">' + ttsButton(step.s) + '</div>' +
                '<div class="fi-fork" id="fork">' +
                '<button type="button" class="fi-fork-card" data-side="left">' +
                '<div class="fi-fork-emoji" aria-hidden="true">' + step.left.e + '</div>' +
                '<div class="fi-fork-name">' + step.left.name + '</div></button>' +
                '<button type="button" class="fi-fork-card" data-side="right">' +
                '<div class="fi-fork-emoji" aria-hidden="true">' + step.right.e + '</div>' +
                '<div class="fi-fork-name">' + step.right.name + '</div></button>' +
                '</div>' +
                '<div class="fi-fork-result" id="fork-result"></div>' +
                '</div>' +
                '<div class="fi-actions" id="afteract" style="display:none">' +
                '<button type="button" class="btn btn-primary btn-block" id="btn-next">我懂取捨了，繼續 ➡️</button></div>';
        bindTts(stage);
        var chosen = false;
        var cards = stage.querySelectorAll('.fi-fork-card');
        for (var c = 0; c < cards.length; c++) {
            cards[c].addEventListener('click', function () {
                if (chosen)
                    return;
                chosen = true;
                var side = this.getAttribute('data-side');
                var got = side === 'left' ? step.left : step.right;
                var lost = side === 'left' ? step.right : step.left;
                var res = $('fork-result');
                res.innerHTML =
                    '<div class="fi-fork-got">✅ 你選了：' + got.e + ' ' + got.name + '</div>' +
                        '<div class="fi-fork-lost">😌 你放掉了：' + lost.e + ' ' + lost.name + '（這就是代價）</div>';
                res.classList.add('show');
                speak('你選了' + got.name + '，就要放掉' + lost.name + '，這就是這次選擇的代價。');
                $('afteract').style.display = 'flex';
            });
        }
        $('btn-next').addEventListener('click', next);
    }
    // ---- bank（小小銀行家；不計分、即時小回饋） ----
    function renderBank(step) {
        var saved = 0, thanks = 0;
        stage.innerHTML =
            '<div class="fi-stage">' +
                '<div class="fi-visual" aria-hidden="true">' + step.v + '</div>' +
                '<p class="fi-sentence">' + step.s + '</p>' +
                '<div class="fi-note" style="max-width:34ch;margin:0 auto var(--s3)"><span class="fi-note-ico">💡</span><span>這是學習點數，不是真的錢。</span></div>' +
                '<div class="fi-bank"><div>存進去：<b id="bank-saved" style="color:var(--fi-ink)">0</b> 個</div>' +
                '<div>保管謝禮：<b id="bank-thanks" style="color:var(--c-correct-ink)">0</b> 個</div></div>' +
                '<div class="fi-cups" id="bank-anim" aria-hidden="true"></div>' +
                '<div class="fi-toolrow"><button type="button" class="btn btn-primary" id="btn-deposit">存 10 個 🏦</button></div>' +
                '<div class="fi-reveal" id="reveal">' + (step.why || '') + '</div>' +
                '</div>' +
                '<div class="fi-actions" id="afteract" style="display:none">' +
                '<button type="button" class="btn btn-primary btn-block" id="btn-next">我懂了，繼續 ➡️</button></div>';
        bindTts(stage);
        $('btn-deposit').addEventListener('click', function () {
            saved += 10;
            thanks += 1; // 存 10 個，多給 1 個（數東西、非百分比）
            $('bank-saved').textContent = saved;
            $('bank-thanks').textContent = thanks;
            var anim = $('bank-anim');
            anim.innerHTML = '<span class="fi-coin-pop">🪙 銀行說謝謝，多給你 1 個！</span>';
            speak('你存了十個，銀行多給你一個當作保管的謝禮。');
            $('reveal').classList.add('show');
            $('afteract').style.display = 'flex';
        });
        $('btn-next').addEventListener('click', next);
    }
    // 需求模型（供 pricing 與 stall 共用）：價格越高、想買的人越少。
    // demand = customers * (1 - 0.9*(price-min)/(max-min))，四捨五入、下限 0（最貴時仍保留約一成買氣）。
    function demandAt(price, customers, min, max) {
        var frac = (price - min) / (max - min);
        if (frac < 0)
            frac = 0;
        if (frac > 1)
            frac = 1;
        var d = Math.round(customers * (1 - frac * 0.9)); // 就算最貴也還有一點點人買
        return Math.max(0, d);
    }
    // ---- pricing（訂價滑桿） ----
    function renderPricing(step) {
        var price = Math.round((step.min + step.max) / 2);
        // 找出最佳利潤，用來定義「甜蜜價格」門檻（≥ 最佳的 75%）。
        var best = 0;
        for (var pr = step.min; pr <= step.max; pr++) {
            var sold = demandAt(pr, step.customers, step.min, step.max);
            var profit = sold * (pr - step.cost);
            if (profit > best)
                best = profit;
        }
        var target = Math.round(best * 0.75);
        stage.innerHTML =
            '<div class="fi-stage">' +
                '<div class="fi-visual" aria-hidden="true">' + step.v + '</div>' +
                '<p class="fi-sentence">' + step.s + '</p>' +
                '<div class="fi-toolrow">' + ttsButton(step.s) + '</div>' +
                '<div class="fi-note" style="max-width:34ch;margin:0 auto var(--s3)"><span class="fi-note-ico">💡</span><span>這是假裝的小攤子，用來練習算錢；金幣是學習點數，不是真的錢。</span></div>' +
                '<div class="fi-event"><span class="fi-event-ico" aria-hidden="true">📣</span>' +
                '<span class="fi-event-txt">' + step.weather + '，今天大約有 ' + step.customers + ' 個人經過。</span></div>' +
                '<div class="fi-slider-wrap">' +
                '<div>一杯賣 <span class="fi-slider-val" id="pr-val">' + price + '</span> 元（成本 ' + step.cost + ' 元）</div>' +
                '<input type="range" class="fi-slider" id="pr-slider" min="' + step.min + '" max="' + step.max + '" step="1" value="' + price + '" aria-label="調整價格">' +
                '</div>' +
                '<div class="fi-cups" id="pr-cups" aria-hidden="true"></div>' +
                '<div class="fi-readout">' +
                '<div class="fi-stat">賣出<b id="pr-sold">0</b>杯</div>' +
                '<div class="fi-stat">賺到<b id="pr-profit">0</b>元</div>' +
                '</div>' +
                '<div class="fi-reveal" id="reveal"></div>' +
                '</div>' +
                '<div class="fi-actions">' +
                '<button type="button" class="btn btn-primary" id="btn-sell">就賣這個價！</button>' +
                '<button type="button" class="btn btn-primary" id="btn-next" style="display:none">繼續 ➡️</button></div>';
        bindTts(stage);
        var answered = false;
        function recompute() {
            var p = parseInt($('pr-slider').value, 10);
            var sold = demandAt(p, step.customers, step.min, step.max);
            var profit = sold * (p - step.cost);
            $('pr-val').textContent = p;
            $('pr-sold').textContent = sold;
            $('pr-profit').textContent = profit;
            var cups = '';
            for (var c = 0; c < Math.min(sold, 20); c++)
                cups += '🥤';
            $('pr-cups').textContent = cups;
            return { p: p, sold: sold, profit: profit };
        }
        $('pr-slider').addEventListener('input', recompute);
        $('btn-sell').addEventListener('click', function () {
            if (answered)
                return;
            var res = recompute();
            var good = res.profit >= target;
            var rev = $('reveal');
            if (good) {
                answered = true;
                scoreOnce(step, true);
                rev.textContent = '找到甜蜜價格啦！賣出 ' + res.sold + ' 杯，賺了 ' + res.profit + ' 元！' + (step.why || '');
                rev.classList.add('show');
                this.style.display = 'none';
                $('btn-next').style.display = 'inline-flex';
                toast('好棒的定價！🥤', 'badge');
            }
            else {
                // 不計分、不懲罰，只給提示，讓孩子再調整。
                var tooHigh = res.p > (step.min + step.max) / 2;
                rev.textContent = tooHigh
                    ? '價格有點高，想買的人變少了。試著調低一點點看看？'
                    : '價格有點低，每杯賺得少。試著調高一點點看看？';
                rev.classList.add('show');
            }
        });
        $('btn-next').addEventListener('click', next);
        recompute();
    }
    // ---- stall（旗艦：我的小攤子） ----
    function renderStall(step) {
        // 事前明示、但真正隨機的天氣事件：讓「運氣」真的會變，孩子的「決定」才需要因應。
        // 天氣在開店「前」就先公開（事前明示），結算時再把「決定」與「運氣」分開說明。
        var WEATHER = [
            { ico: '☀️', name: '大晴天', customers: 22, before: '明天是大晴天，會有很多人想喝冰檸檬水！', luck: '今天是大晴天，想喝冰的人比較多。' },
            { ico: '🥵', name: '大熱天', customers: 28, before: '明天超級熱！大家都想喝冰的，人潮會很多。', luck: '今天很熱，想喝冰的人特別多。' },
            { ico: '⛅', name: '多雲', customers: 16, before: '明天多雲、不太熱，想喝冰的人普普通通。', luck: '今天多雲不太熱，想喝冰的人普通。' },
            { ico: '🌧️', name: '下雨天', customers: 9, before: '明天會下雨，出門的人少，想喝冰的人也會變少。', luck: '今天下雨，出門的人少，想喝冰的人也少。' }
        ];
        var EVENT = WEATHER[Math.floor(Math.random() * WEATHER.length)];
        var CUSTOMERS = EVENT.customers, COST = 5, MINP = 10, MAXP = 30, START = 150;
        var st = { phase: 0, stock: 0, price: 20, sold: 0, revenue: 0, cost: 0, profit: 0,
            jars: { save: 0, spend: 0, share: 0 } };
        function wrap(inner, actions, showNote) {
            stage.innerHTML =
                '<div class="fi-stage">' +
                    '<div class="fi-visual" aria-hidden="true">' + step.v + '</div>' +
                    (showNote ? '<div class="fi-note" style="max-width:34ch;margin:0 auto var(--s3)"><span class="fi-note-ico">💡</span><span>金幣是學習點數，不是真的錢。</span></div>' : '') +
                    inner +
                    '</div>' +
                    '<div class="fi-actions">' + actions + '</div>';
            bindTts(stage);
        }
        // 階段 0：事前明示事件（先公開天氣，再進貨）
        function phaseEvent() {
            wrap('<p class="fi-sentence">歡迎光臨你的小攤子！先看看明天的天氣。</p>' +
                '<div class="fi-event"><span class="fi-event-ico" aria-hidden="true">' + EVENT.ico + '</span>' +
                '<span class="fi-event-txt">' + EVENT.before + '（天氣是運氣，不是我們能控制的）</span></div>' +
                '<p class="fi-sub">你有 ' + START + ' 個學習點數可以進貨。</p>', '<button type="button" class="btn btn-primary btn-block" id="s-go">開始進貨 🛒</button>', true);
            $('s-go').addEventListener('click', phaseStock);
        }
        // 階段 1：進貨（花成本）
        function phaseStock() {
            var choices = [10, 20, 30];
            var btns = '';
            for (var i = 0; i < choices.length; i++)
                btns += '<button type="button" class="fi-opt s-stock" data-q="' + choices[i] + '"><span>進 ' + choices[i] +
                    ' 杯（花 ' + (choices[i] * COST) + ' 點）</span><span class="fi-opt-mark">🍋</span></button>';
            wrap('<p class="fi-sentence">要進多少杯的材料呢？（每杯成本 ' + COST + ' 點）</p>' +
                '<div class="fi-event"><span class="fi-event-ico" aria-hidden="true">' + EVENT.ico + '</span>' +
                '<span class="fi-event-txt">' + EVENT.name + '：大約 ' + CUSTOMERS + ' 個人會經過。進太多賣不完也會虧本喔。</span></div>' +
                '<div class="fi-options">' + btns + '</div>', '', true);
            var opts = stage.querySelectorAll('.s-stock');
            for (var k = 0; k < opts.length; k++) {
                opts[k].addEventListener('click', function () {
                    st.stock = parseInt(this.getAttribute('data-q'), 10);
                    phasePrice();
                });
            }
        }
        // 階段 2：訂價
        function phasePrice() {
            wrap('<p class="fi-sentence">一杯要賣多少錢？（成本 ' + COST + ' 點）</p>' +
                '<div class="fi-event"><span class="fi-event-ico" aria-hidden="true">' + EVENT.ico + '</span>' +
                '<span class="fi-event-txt">' + EVENT.name + '，大約 ' + CUSTOMERS + ' 個人會經過。</span></div>' +
                '<div class="fi-slider-wrap"><div>一杯賣 <span class="fi-slider-val" id="s-pval">' + st.price + '</span> 點</div>' +
                '<input type="range" class="fi-slider" id="s-slider" min="' + MINP + '" max="' + MAXP + '" step="1" value="' + st.price + '" aria-label="調整價格"></div>' +
                '<div class="fi-cups" id="s-preview" aria-hidden="true"></div>' +
                '<div class="fi-readout">' +
                '<div class="fi-stat">大概賣出<b id="s-psold">0</b>杯</div>' +
                '<div class="fi-stat">大概賺<b id="s-pprofit">0</b>點</div>' +
                '</div>', '<button type="button" class="btn btn-primary btn-block" id="s-open">開店做生意 🛎️</button>');
            function prev() {
                var p = parseInt($('s-slider').value, 10);
                st.price = p;
                $('s-pval').textContent = p;
                var d = Math.min(st.stock, demandAt(p, CUSTOMERS, MINP, MAXP));
                $('s-psold').textContent = d;
                $('s-pprofit').textContent = (d * p) - (st.stock * COST); // 收入 − 已花的進貨成本
                var cups = '';
                for (var c = 0; c < Math.min(d, 20); c++)
                    cups += '🥤';
                $('s-preview').textContent = cups;
            }
            $('s-slider').addEventListener('input', prev);
            $('s-open').addEventListener('click', phaseServe);
            prev();
        }
        // 階段 3：服務顧客（供需上場）
        function phaseServe() {
            var demand = demandAt(st.price, CUSTOMERS, MINP, MAXP);
            st.sold = Math.min(st.stock, demand);
            st.revenue = st.sold * st.price;
            st.cost = st.stock * COST;
            st.profit = st.revenue - st.cost;
            var cups = '';
            for (var c = 0; c < Math.min(st.sold, 25); c++)
                cups += '🥤';
            wrap('<p class="fi-sentence">開店囉！客人一個一個來買冰檸檬水～</p>' +
                '<div class="fi-cups" style="font-size:30px">' + (cups || '（今天客人不多）') + '</div>' +
                '<p class="fi-sub">你賣出了 ' + st.sold + ' 杯（進了 ' + st.stock + ' 杯）。</p>', '<button type="button" class="btn btn-primary btn-block" id="s-settle">打烊、來結算 🧾</button>');
            $('s-settle').addEventListener('click', phaseSettle);
        }
        // 階段 4：結算（把「決定」與「運氣」分開）
        function phaseSettle() {
            var even = st.profit === 0; // 利潤剛好 0：打平，不顯示「賺了 0」慶祝
            var up = st.profit > 0;
            var demand = demandAt(st.price, CUSTOMERS, MINP, MAXP);
            var youText;
            if (st.sold === st.stock) {
                // 賣光了。只有在進貨量接近「會想買的人數」時才算「剛剛好」；
                // 若進太少（想買的人明顯比進貨多），是賣光但可惜，可以再多進一點。
                var closeEnough = st.stock >= demand - Math.max(2, Math.round(demand * 0.1));
                youText = closeEnough
                    ? '進 ' + st.stock + ' 杯、賣 ' + st.price + ' 點，全部賣光，進貨量抓得剛剛好！'
                    : '進 ' + st.stock + ' 杯、賣 ' + st.price + ' 點，全部賣光了！下次天氣好時可以多進一點，說不定賺更多。';
            }
            else {
                youText = (st.price > 22 ? '價格有點高，有些人沒買，剩了一些沒賣掉。' : '進的比賣掉的多，剩下的成本收不回來。');
            }
            var luckText = EVENT.luck + '天氣是「運氣」，不是你能控制的。';
            wrap('<p class="fi-sentence">打烊結算！</p>' +
                '<div class="fi-visual fi-pop" style="font-size:clamp(30px,8vw,44px);margin:0">' +
                (even ? '😊 剛好打平，沒賺也沒虧'
                    : (up ? '🎉 賺了 ' : '💪 虧了 ') + '<span class="fi-profit ' + (up ? 'up' : 'down') + '">' + Math.abs(st.profit) + '</span> 點') + '</div>' +
                '<div class="fi-readout">' +
                '<div class="fi-stat">收入<b>' + st.revenue + '</b>點</div>' +
                '<div class="fi-stat">成本<b>' + st.cost + '</b>點</div>' +
                '</div>' +
                ((up || even) ? '' : '<div class="fi-event" style="border-color:var(--c-chinese)"><span class="fi-event-ico">🌈</span>' +
                    '<span class="fi-event-txt">虧一點點沒關係！虧本是做生意很正常的學習。下次可以少進一點、或把價格調得剛剛好。</span></div>') +
                '<div class="fi-settle">' +
                '<div class="fi-settle-box you"><h4>🧠 你的決定</h4><p>' + youText + '</p></div>' +
                '<div class="fi-settle-box luck"><h4>🍀 運氣（不能控制）</h4><p>' + luckText + '</p></div>' +
                '</div>', up
                ? '<button type="button" class="btn btn-primary btn-block" id="s-jars">分配今天賺的錢 🫙</button>'
                : '<button type="button" class="btn btn-primary" id="s-retry">🔄 再挑戰一次</button>' +
                    '<button type="button" class="btn" id="s-check">我學到了，繼續 ➡️</button>');
            if (up) {
                $('s-jars').addEventListener('click', function () { phaseJars(); });
            }
            else {
                // 虧本：溫柔、不歸零、不懲罰；提供再挑戰，也可直接進理解題完成。
                $('s-retry').addEventListener('click', function () { st = { phase: 0, stock: 0, price: 20, sold: 0, revenue: 0, cost: 0, profit: 0, jars: { save: 0, spend: 0, share: 0 } }; phaseStock(); });
                $('s-check').addEventListener('click', phaseCheck);
            }
        }
        // 階段 5：三罐分配（存 / 花 / 分享）
        function phaseJars() {
            var pool = st.profit;
            var jars = { save: 0, spend: 0, share: 0 };
            function view() {
                return '<div class="fi-jars">' +
                    jarBox('save', '🐷', '存起來', jars.save) +
                    jarBox('spend', '🛍️', '花用', jars.spend) +
                    jarBox('share', '💚', '分享', jars.share) +
                    '</div>';
            }
            function jarBox(key, emo, name, val) {
                return '<div class="fi-jar"><div class="fi-jar-emoji" aria-hidden="true">' + emo + '</div>' +
                    '<div class="fi-jar-name">' + name + '</div><div class="fi-jar-val" id="jar-' + key + '">' + val + '</div>' +
                    '<div class="fi-jar-btns"><button type="button" data-k="' + key + '" data-d="-1" aria-label="減少">−</button>' +
                    '<button type="button" data-k="' + key + '" data-d="1" aria-label="增加">＋</button></div></div>';
            }
            wrap('<p class="fi-sentence">今天賺了 ' + pool + ' 點！分成三罐：存、花、分享。</p>' +
                '<p class="fi-sub">還沒分配：<b id="jar-pool" style="color:var(--fi-ink)">' + pool + '</b> 點（分享完全自願喔）</p>' +
                view(), '<button type="button" class="btn btn-primary btn-block" id="s-jardone">分好了，打烊 ✅</button>', true);
            function refresh() {
                var used = jars.save + jars.spend + jars.share;
                $('jar-pool').textContent = pool - used;
                $('jar-save').textContent = jars.save;
                $('jar-spend').textContent = jars.spend;
                $('jar-share').textContent = jars.share;
            }
            var btns = stage.querySelectorAll('.fi-jar-btns button');
            for (var i = 0; i < btns.length; i++) {
                btns[i].addEventListener('click', function () {
                    var key = this.getAttribute('data-k');
                    var d = parseInt(this.getAttribute('data-d'), 10);
                    var used = jars.save + jars.spend + jars.share;
                    if (d > 0 && used >= pool)
                        return; // 不能超過賺到的
                    if (d < 0 && jars[key] <= 0)
                        return; // 不能變負
                    jars[key] += d;
                    refresh();
                });
            }
            $('s-jardone').addEventListener('click', function () {
                st.jars = jars;
                if (jars.save > 0) {
                    addPiggy(jars.save);
                }
                // 分享罐：純情感回饋，不加經驗值、不給徽章、不影響分數（見 phaseCheck）。
                phaseCheck();
            });
        }
        // 階段 6：理解題（計一次分）——教「決定 vs 運氣」
        function phaseCheck() {
            wrap('<p class="fi-sentence">最後一個小問題：下次想賺更多，你最該用心調整哪一個？</p>' +
                '<div class="fi-options">' +
                '<button type="button" class="fi-opt s-ck" data-ok="1"><span>我的決定：進貨量和價格</span><span class="fi-opt-mark"></span></button>' +
                '<button type="button" class="fi-opt s-ck" data-ok="0"><span>天氣，因為我可以控制它</span><span class="fi-opt-mark"></span></button>' +
                '</div>' +
                '<div class="fi-reveal" id="reveal"></div>', '<button type="button" class="btn btn-primary btn-block" id="s-fin" style="display:none">完成 🎉</button>');
            var answered = false;
            var opts = stage.querySelectorAll('.s-ck');
            for (var i = 0; i < opts.length; i++) {
                opts[i].addEventListener('click', function () {
                    if (answered)
                        return;
                    answered = true;
                    var ok = this.getAttribute('data-ok') === '1';
                    scoreOnce(step, ok);
                    this.classList.add(ok ? 'correct' : 'wrong');
                    this.querySelector('.fi-opt-mark').textContent = ok ? '✅' : '❌';
                    if (!ok) {
                        var good = stage.querySelector('.s-ck[data-ok="1"]');
                        good.classList.add('correct');
                        good.querySelector('.fi-opt-mark').textContent = '✅';
                    }
                    $('reveal').textContent = (ok ? '答對了！' : '沒關係～') + (step.why || '');
                    $('reveal').classList.add('show');
                    var all = stage.querySelectorAll('.s-ck');
                    for (var q = 0; q < all.length; q++)
                        all[q].disabled = true;
                    $('s-fin').style.display = 'inline-flex';
                });
            }
            $('s-fin').addEventListener('click', next);
        }
        phaseEvent();
    }
    // ---- addet（廣告偵探） ----
    function renderAdDetective(step) {
        var chips = step.tricks.map(function (t) { return { text: t, trick: true }; })
            .concat(step.plains.map(function (t) { return { text: t, trick: false }; }));
        shuffle(chips);
        var chipsHtml = '';
        for (var i = 0; i < chips.length; i++) {
            chipsHtml += chips[i].trick
                ? '<button type="button" class="fi-ad-trick" data-trick="1">' + chips[i].text + '</button>'
                : '<span class="fi-ad-plain">' + chips[i].text + '</span>';
        }
        stage.innerHTML =
            '<div class="fi-stage">' +
                '<div class="fi-visual" aria-hidden="true">' + step.v + '</div>' +
                '<p class="fi-sentence">' + step.s + '</p>' +
                '<div class="fi-toolrow">' + ttsButton(step.s) + '</div>' +
                '<div class="fi-ad"><div class="fi-ad-head">🥤 超好喝冰紅茶 大特賣！</div>' + chipsHtml + '</div>' +
                '<p class="fi-sub" id="ad-hint">點出所有「催你快買」的話術（還剩 ' + step.tricks.length + ' 個）</p>' +
                '<div class="fi-reveal" id="reveal">' + (step.why || '') + '</div>' +
                '</div>' +
                '<div class="fi-actions" id="afteract" style="display:none">' +
                '<button type="button" class="btn btn-primary btn-block" id="btn-next">🛑 買前三問，再繼續 ➡️</button></div>';
        bindTts(stage);
        var found = 0, total = step.tricks.length, scored = false;
        var tricks = stage.querySelectorAll('.fi-ad-trick');
        for (var t = 0; t < tricks.length; t++) {
            tricks[t].addEventListener('click', function () {
                if (this.classList.contains('found'))
                    return;
                this.classList.add('found');
                found++;
                $('ad-hint').textContent = found >= total ? '你全部找到了！這些都是催你快買的話術。' : '點出所有「催你快買」的話術（還剩 ' + (total - found) + ' 個）';
                if (found >= total && !scored) {
                    scored = true;
                    scoreOnce(step, true);
                    $('reveal').classList.add('show');
                    $('afteract').style.display = 'flex';
                    toast('好眼力，廣告偵探！🕵️', 'badge');
                }
            });
        }
        // 「買前三問」做成過關前必看的暫停畫面（遊戲內卡片，不用瀏覽器彈窗）。
        $('btn-next').addEventListener('click', function () {
            stage.innerHTML =
                '<div class="fi-stage">' +
                    '<div class="fi-visual" aria-hidden="true">🛑</div>' +
                    '<p class="fi-sentence">買東西前，先問自己「買前三問」！</p>' +
                    '<div class="fi-ad" style="border-style:solid;border-color:var(--fi);background:var(--fi-tint)">' +
                    '<div class="fi-ad-head">1️⃣ 停一下</div>' +
                    '<div class="fi-ad-head">2️⃣ 比一比</div>' +
                    '<div class="fi-ad-head" style="margin-bottom:0">3️⃣ 問自己「這是需要嗎？」</div>' +
                    '</div>' +
                    '</div>' +
                    '<div class="fi-actions"><button type="button" class="btn btn-primary btn-block" id="btn-thinked">想清楚了，繼續 ➡️</button></div>';
            $('btn-thinked').addEventListener('click', next);
        });
    }
    // ---- share（分享罐；完全脫離獎勵、只給情感回饋，不呼叫 record） ----
    function renderShare(step) {
        var scene = ['🏚️🐕', '🏠🐕🐈', '🏡🐕🐈🐰', '🏡✨🐕🐈🐰🐦'];
        var idx = 0;
        stage.innerHTML =
            '<div class="fi-stage">' +
                '<div class="fi-visual" aria-hidden="true">' + step.v + '</div>' +
                '<p class="fi-sentence">' + step.s + '</p>' +
                '<div class="fi-toolrow">' + ttsButton(step.s) + '</div>' +
                '<div class="fi-share-scene" id="share-scene">' + scene[0] + '</div>' +
                '<div class="fi-share-thanks" id="share-thanks"></div>' +
                '<div class="fi-toolrow">' +
                '<button type="button" class="btn btn-primary" id="btn-share">放一點進分享罐 💚</button>' +
                '<button type="button" class="btn" id="btn-skip">這次先不放</button>' +
                '</div>' +
                '<div class="fi-reveal" id="reveal">' + (step.why || '') + '</div>' +
                '</div>' +
                '<div class="fi-actions" id="afteract" style="display:none">' +
                '<button type="button" class="btn btn-primary btn-block" id="btn-next">完成這一關 🎉</button></div>';
        bindTts(stage);
        var thanksMsgs = ['謝謝你！收容所變乾淨了一點。', '謝謝你！又有小動物有家了。', '謝謝你！大家都好開心～', '謝謝你！村民向你揮揮手 👋'];
        function reveal() { $('reveal').classList.add('show'); $('afteract').style.display = 'flex'; }
        $('btn-share').addEventListener('click', function () {
            if (idx < scene.length - 1)
                idx++;
            $('share-scene').innerHTML = '<span class="fi-pop" style="display:inline-block">' + scene[idx] + '</span>';
            var msg = thanksMsgs[Math.min(idx - 1, thanksMsgs.length - 1)] || thanksMsgs[0];
            $('share-thanks').textContent = msg;
            speak(msg);
            reveal();
            // 注意：分享不呼叫 record()、不加經驗值、不給徽章、不影響星等（安全規則）。
        });
        $('btn-skip').addEventListener('click', function () {
            $('share-thanks').textContent = '沒關係，做不做都可以，你一樣很棒 💛';
            reveal();
        });
        $('btn-next').addEventListener('click', next);
    }
    // =====================================================================
    // 完成單元
    // =====================================================================
    function finishUnit() {
        var unit = cur.unit;
        var stars = cur.correctCount;
        var total = cur.total;
        var prev = progress.units[unit.id] || {};
        progress.units[unit.id] = { done: true, best: Math.max(prev.best || 0, stars) };
        saveProg();
        var starStr = '';
        for (var i = 0; i < total; i++)
            starStr += (i < stars ? '⭐' : '☆');
        stage.innerHTML =
            '<div class="fi-stage fi-done">' +
                '<div class="fi-done-emoji" aria-hidden="true">🎉</div>' +
                '<div class="fi-done-title">完成「' + unit.name + '」！</div>' +
                (total > 0 ? '<div class="fi-done-stars" aria-label="得到 ' + stars + ' 顆星">' + starStr + '</div>' +
                    '<p class="fi-sentence" style="font-size:clamp(16px,3.6vw,19px)">你答對了 ' + stars + ' / ' + total + ' 題，好棒！</p>'
                    : '<p class="fi-sentence" style="font-size:clamp(16px,3.6vw,19px)">你完成了這一關，好棒！</p>') +
                '</div>' +
                '<div class="fi-actions">' +
                '<button type="button" class="btn" id="btn-menu">回到選單</button>' +
                (nextUnitOf(unit) ? '<button type="button" class="btn btn-primary" id="btn-nextunit">下一關 ➡️</button>' : '') +
                '</div>';
        toast('完成關卡：' + unit.emoji + ' ' + unit.name + '！', 'badge');
        $('btn-menu').addEventListener('click', goMenu);
        var nu = nextUnitOf(unit);
        if (nu)
            $('btn-nextunit').addEventListener('click', function () { startUnit(nu); });
    }
    function nextUnitOf(unit) {
        for (var i = 0; i < UNITS.length; i++)
            if (UNITS[i].id === unit.id)
                return UNITS[i + 1] || null;
        return null;
    }
    function goMenu() {
        cur = null;
        renderMenu();
        show(screenMenu);
    }
    // 小工具：Fisher–Yates 洗牌（就地）
    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = arr[i];
            arr[i] = arr[j];
            arr[j] = t;
        }
        return arr;
    }
    // =====================================================================
    // 頂列按鈕
    // =====================================================================
    function toggleTheme() {
        try {
            if (window.Game && window.Game.toggleTheme)
                window.Game.toggleTheme();
        }
        catch (e) { }
        syncThemeIcon();
    }
    function syncThemeIcon() {
        var dark = false;
        try {
            dark = window.Game && window.Game.getTheme ? window.Game.getTheme() === 'dark' : (document.documentElement.getAttribute('data-theme') === 'dark');
        }
        catch (e) { }
        var icon = dark ? '☀️' : '🌙';
        if ($('btn-theme'))
            $('btn-theme').textContent = icon;
        if ($('btn-theme2'))
            $('btn-theme2').textContent = icon;
    }
    // 主題切換已交給共用 .app-bar 的 data-theme-toggle 鈕（由 game_core 自動接線）；
    // 本頁不再自行接線主題鈕，只保留回到選單（in-page 導覽，非回首頁）。
    $('btn-back').addEventListener('click', goMenu);
    try {
        if (window.Game && window.Game.on)
            window.Game.on('theme', syncThemeIcon);
    }
    catch (e) { }
    // =====================================================================
    // 啟動
    // =====================================================================
    renderMenu();
    syncThemeIcon();
})();
