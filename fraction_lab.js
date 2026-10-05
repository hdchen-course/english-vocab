/* =====================================================================
 * fraction_lab.ts  →  (tsc, tsconfig.legacy.json) →  fraction_lab.js
 * 原為 fraction_lab.html 的 inline <script>；逐檔 TS 遷移抽出成 sibling .js。
 * 行為與原 inline 版等價（verbatim；載入位置不變＝執行時機/順序不變）。
 * 原碼本身即單一頂層 IIFE，已自我隔離（tsc 全域型別檢查無名稱外洩）；verbatim 保留。
 * ===================================================================== */
/* eslint-disable */
(function () {
    'use strict';
    function $(id) { return document.getElementById(id); }
    function ri(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) {
        var t = b;
        b = a % b;
        a = t;
    } return a || 1; }
    // 化簡分數 → {n,d} 最簡(d>0)
    function reduce(n, d) { if (d < 0) {
        n = -n;
        d = -d;
    } var g = gcd(n, d); return { n: n / g, d: d / g }; }
    // 分數轉可讀文字
    function ftxt(n, d) { if (d === 1)
        return '' + n; return n + '/' + d; }
    // 分數 HTML(直式)
    function fhtml(n, d) {
        if (d === 1)
            return '<span class="fl-whole">' + n + '</span>';
        return '<span class="fl-frac"><span class="fl-num">' + n + '</span><span class="fl-den">' + d + '</span></span>';
    }
    // 帶分數 HTML：整數 ＋「又」＋ 真分數（重用 .fl-whole / fhtml，零新 class）
    function mixedHtml(w, n, d) { return '<span class="fl-whole">' + w + '</span> 又 ' + fhtml(n, d); }
    // 帶分數長條圖(靜態 SVG，主題感知)：whole 條「整條」(d/d 全塗) ＋ 1 條切成 d 份、塗 r 份，
    // 讓孩子看見「假分數 = 幾整條 ＋ 剩下幾分之幾」。塗色用 var(--su)(淺/深色皆可見)，文字用 currentColor，
    // 條內不放字→無「淺底深字」問題。回傳 SVG 字串。
    function barMixed(whole, r, d) {
        var segW = 20, segH = 26, gap = 14, pad = 10, x = pad, g = '';
        function oneBar(fill) {
            for (var i = 0; i < d; i++) {
                var fx = x + i * segW, on = i < fill;
                g += '<rect x="' + fx + '" y="' + pad + '" width="' + segW + '" height="' + segH + '" rx="3" ' +
                    'fill="' + (on ? 'var(--su)' : 'none') + '" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.5"/>';
            }
            x += d * segW + gap;
        }
        for (var k = 0; k < whole; k++) {
            oneBar(d);
        } // 整條：d 份全塗
        oneBar(r); // 剩下一條：塗 r 份
        var W = x - gap + pad, H = pad + segH + 28, cx = W / 2, cy = pad + segH + 20, imp = whole * d + r;
        var cap = imp + '/' + d + ' ＝ ' + whole + ' 又 ' + r + '/' + d;
        return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;height:auto;display:block;margin:0 auto" ' +
            'role="img" aria-label="長條圖：' + whole + ' 條整條，再加上一條切成 ' + d + ' 份塗 ' + r + ' 份，等於帶分數 ' + whole + ' 又 ' + d + '分之' + r + '">' +
            g + '<text x="' + cx + '" y="' + cy + '" text-anchor="middle" font-size="13" fill="currentColor">' + cap + '</text></svg>';
    }
    // 生成器：每個回傳 { html, aN, aD(最簡正解), tip, spoken }
    var CATS = [
        { key: 'reduce', label: '約分（化到最簡）', emoji: '✂️', sub: '分子分母同時除以最大公因數，把分數變最簡',
            teach: '<b>約分</b>就是把分數變成「最簡」的樣子：分子和分母<b>同時除以它們的最大公因數</b>，大小不變、數字變小。<br><br><b>例：</b>8/12 → 8 和 12 的最大公因數是 4 → 8÷4=2、12÷4=3 → 得 <b>2/3</b>。<br><br>💡 找不到最大的沒關係，可以一次除一點：8/12 先同除以 2 = 4/6，再同除以 2 = 2/3，一樣會到最簡。',
            gen: function (lv) {
                var base, g2 = 0;
                do {
                    base = reduce(ri(1, lv + 1), ri(2, lv + 2));
                } while ((base.d === 1 || base.n >= base.d) && g2++ < 40); // 造一個真分數(分母>1、分子<分母)，與 teach 的 proper→proper 一致，避免 k/k→整數的退化題
                if (base.d < 2 || base.n >= base.d)
                    base = { n: 1, d: 2 };
                if (base.n === 0)
                    base.n = 1;
                var k = ri(2, lv <= 2 ? 4 : (lv <= 4 ? 6 : 9)); // 乘一個公因數把它「放大」成可約分的題目
                var n = base.n * k, d = base.d * k;
                var tip = '把 ' + n + '/' + d + ' 約分：' + n + ' 和 ' + d + ' 的最大公因數是 ' + gcd(n, d) + '，同時除以它 → ' + (base.d === 1 ? ('整數 ' + base.n) : (base.n + '/' + base.d)) + '。';
                return { html: '把 ' + fhtml(n, d) + ' <span class="fl-op">化成最簡</span>', aN: base.n, aD: base.d, tip: tip, spoken: d + '分之' + n + ' 化成最簡分數' };
            } },
        { key: 'mixed', label: '帶分數 ↔ 假分數', emoji: '🍰', sub: '整數部分和分數部分互換，大小不變',
            teach: '<b>帶分數</b>是「整數 ＋ 真分數」，和<b>假分數</b>（分子比分母大）大小一樣，只是把整數的部分「拆出來」寫。<br><br>' +
                '<b>假分數 → 帶分數：</b>分子 ÷ 分母，<b>商</b>當整數部分、<b>餘數</b>當新分子、分母不變。<br>例：7/3 → 7÷3 商 2 餘 1 → <b>2 又 1/3</b>。' +
                '<div style="margin:10px 0">' + barMixed(2, 1, 3) + '</div>' +
                '<b>帶分數 → 假分數：</b>整數 × 分母 ＋ 分子，當新分子、分母不變。<br>例：3 又 2/5 → 3×5＋2 ＝ 17 → <b>17/5</b>。' +
                '<div style="margin:10px 0">' + barMixed(3, 2, 5) + '</div>' +
                '💡 帶分數只是把假分數「拆出整數」，大小完全一樣，只是換個樣子寫。',
            gen: function (lv) {
                var dLo = lv <= 2 ? 2 : 5, dHi = lv <= 2 ? 4 : 9;
                var b = ri(dLo, dHi);
                var W = ri(1, lv <= 2 ? 3 : 4);
                var a = ri(1, b - 1), guard = 0;
                while (gcd(a, b) !== 1 && guard++ < 30) {
                    a = ri(1, b - 1);
                }
                if (gcd(a, b) !== 1)
                    a = 1; // b≥2 → 1 必與 b 互質（保底，分數部分永遠最簡）
                var n = W * b + a; // 假分數分子；因 a<b，商必為 W、餘數必為 a（絕無餘數≥分母）
                var kind = pick([0, 1, 2]); // 0 帶→假；1 假→帶(整數部分)；2 假→帶(分數部分)
                if (kind === 0) {
                    return { html: '把 ' + mixedHtml(W, a, b) + ' <span class="fl-op">寫成假分數</span>',
                        aN: n, aD: b,
                        tip: '整數 ' + W + ' × 分母 ' + b + ' ＋ 分子 ' + a + ' ＝ ' + n + '，分母不變 → ' + n + '/' + b + '。',
                        spoken: W + '又' + b + '分之' + a + ' 寫成假分數' };
                }
                else if (kind === 1) {
                    return { html: '把 ' + fhtml(n, b) + ' 寫成帶分數：' + n + ' ÷ ' + b + ' 的 <span class="fl-op">商</span> 是多少？（答案是整數，分母欄請填 1）',
                        aN: W, aD: 1,
                        tip: n + ' ÷ ' + b + ' ＝ 商 ' + W + ' 餘 ' + a + '；商 ' + W + ' 就是帶分數的整數部分 → ' + W + ' 又 ' + a + '/' + b + '。',
                        spoken: n + ' 除以 ' + b + ' 的商是多少' };
                }
                else {
                    return { html: '把 ' + fhtml(n, b) + ' 寫成帶分數，<span class="fl-op">分數部分是多少</span>？',
                        aN: a, aD: b,
                        tip: n + ' ÷ ' + b + ' ＝ 商 ' + W + ' 餘 ' + a + ' → ' + W + ' 又 ' + a + '/' + b + '；分數部分是 ' + a + '/' + b + '。',
                        spoken: b + '分之' + n + ' 寫成帶分數，分數部分是幾分之幾' };
                }
            } },
        { key: 'addsame', label: '同分母加減', emoji: '➕', sub: '分母不變，分子直接相加減，再約分',
            teach: '分母<b>一樣</b>的分數相加減，最簡單：<b>分母不變，分子直接加或減</b>，最後記得約分。<br><br><b>例：</b>2/7 + 3/7 → 分母都是 7，分子 2+3=5 → <b>5/7</b>。<br><b>例：</b>5/6 − 1/6 → 分母不變（還是 6），分子 5−1=4 → 4/6 → 約分成 <b>2/3</b>。',
            gen: function (lv) {
                var d = pick(lv <= 1 ? [3, 4, 5] : lv <= 2 ? [4, 5, 6, 8] : lv <= 3 ? [6, 8, 9, 10] : lv <= 4 ? [8, 9, 10, 12] : [10, 12, 15, 16]);
                var add = pick([true, false]);
                var a, b;
                if (add) {
                    a = ri(1, d - 1);
                    b = ri(1, d - a);
                } // 和的分子 ≤ d，結果為真分數或恰為 1
                else {
                    a = ri(2, d - 1);
                    b = ri(1, a - 1);
                } // 差為正
                var rn = add ? a + b : a - b;
                var ans = reduce(rn, d);
                var tip = '分母都是 ' + d + '，分子 ' + a + (add ? ' + ' : ' − ') + b + ' = ' + rn + ' → ' + rn + '/' + d + (gcd(rn, d) > 1 && ans.d !== 1 ? '，約分成 ' + ans.n + '/' + ans.d : '') + (ans.d === 1 ? '（等於整數 ' + ans.n + '）' : '') + '。';
                return { html: fhtml(a, d) + ' <span class="fl-op">' + (add ? '+' : '−') + '</span> ' + fhtml(b, d), aN: ans.n, aD: ans.d, tip: tip, spoken: d + '分之' + a + (add ? ' 加 ' : ' 減 ') + d + '分之' + b };
            } },
        { key: 'adddiff', label: '異分母加減（通分）', emoji: '🔗', sub: '先通分成同分母，再加減，最後約分',
            teach: '分母<b>不一樣</b>時，要先<b>通分</b>：把兩個分數換成分母相同的樣子，再照同分母加減。<br><br><b>例：</b>1/2 + 1/3 → 公分母用 6：1/2=3/6、1/3=2/6 → 3+2=5 → <b>5/6</b>。<br><br>💡 公分母可以直接用「兩分母相乘」，算完再約分就好；分子要跟著一起乘。',
            gen: function (lv) {
                var pool = lv <= 1 ? [2, 3, 4] : lv <= 2 ? [2, 3, 4, 5, 6] : lv <= 3 ? [3, 4, 5, 6, 8] : lv <= 4 ? [4, 5, 6, 8, 9, 10] : [6, 8, 9, 10, 12];
                var b = pick(pool), d = pick(pool);
                var guard = 0;
                while (d === b && guard++ < 20) {
                    d = pick(pool);
                }
                if (d === b)
                    d = b + 1;
                var add = pick([true, false]);
                var a = ri(1, b - 1), c = ri(1, d - 1);
                // 通分到 b*d
                var n1 = a * d, n2 = c * b, D = b * d;
                var rn = add ? n1 + n2 : n1 - n2;
                if (!add && rn <= 0) { // 保證差為正，交換
                    var tmpN = n1;
                    n1 = n2;
                    n2 = tmpN;
                    var tb = b;
                    b = d;
                    d = tb;
                    var ta = a;
                    a = c;
                    c = ta;
                    rn = n1 - n2;
                }
                var ans = reduce(rn, D);
                var tip = '通分：公分母用 ' + b + '×' + d + ' = ' + D + '。' + a + '/' + b + ' = ' + n1 + '/' + D + '，' + c + '/' + d + ' = ' + n2 + '/' + D + '；分子 ' + n1 + (add ? ' + ' : ' − ') + n2 + ' = ' + rn + ' → ' + rn + '/' + D + (gcd(rn, D) > 1 && ans.d !== 1 ? '，約分成 ' + ans.n + '/' + ans.d : '') + (ans.d === 1 ? '（等於整數 ' + ans.n + '）' : '') + '。';
                return { html: fhtml(a, b) + ' <span class="fl-op">' + (add ? '+' : '−') + '</span> ' + fhtml(c, d), aN: ans.n, aD: ans.d, tip: tip, spoken: b + '分之' + a + (add ? ' 加 ' : ' 減 ') + d + '分之' + c };
            } },
        { key: 'mul', label: '分數乘法', emoji: '✖️', sub: '分子乘分子、分母乘分母，再約分',
            teach: '分數相乘最直接：<b>分子乘分子、分母乘分母</b>，最後約分。<br><br><b>例：</b>2/3 × 4/5 → 分子 2×4=8、分母 3×5=15 → <b>8/15</b>。<br><b>例：</b>2/3 × 3/4 → 6/12 → 約分成 <b>1/2</b>。<br><br>💡 也可以「先約分再乘」更快，但先乘完再約分一定不會錯。',
            gen: function (lv) {
                var hi = lv <= 1 ? 4 : lv <= 2 ? 5 : lv <= 3 ? 6 : lv <= 4 ? 8 : 9;
                var a = ri(1, hi), b = ri(2, hi + 1), c = ri(1, hi), d = ri(2, hi + 1);
                var rn = a * c, D = b * d;
                var ans = reduce(rn, D);
                var tip = '分子相乘 ' + a + '×' + c + ' = ' + rn + '，分母相乘 ' + b + '×' + d + ' = ' + D + ' → ' + rn + '/' + D + (gcd(rn, D) > 1 && ans.d !== 1 ? '，約分成 ' + ans.n + '/' + ans.d : '') + (ans.d === 1 ? '（等於整數 ' + ans.n + '）' : '') + '。';
                return { html: fhtml(a, b) + ' <span class="fl-op">×</span> ' + fhtml(c, d), aN: ans.n, aD: ans.d, tip: tip, spoken: b + '分之' + a + ' 乘以 ' + d + '分之' + c };
            } },
        { key: 'div', label: '分數除法', emoji: '➗', sub: '除以一個分數＝乘以它的倒數',
            teach: '除以一個分數，就是<b>乘以它的「倒數」</b>（把那個分數的分子分母上下顛倒），然後照乘法算。<br><br><b>例：</b>2/3 ÷ 4/5 → 把 4/5 顛倒成 5/4 → 2/3 × 5/4 = 10/12 → 約分成 <b>5/6</b>。<br><br>💡 口訣：「除以分數，顛倒相乘」。',
            gen: function (lv) {
                var hi = lv <= 1 ? 4 : lv <= 2 ? 5 : lv <= 3 ? 6 : lv <= 4 ? 8 : 9;
                var a = ri(1, hi), b = ri(2, hi + 1), c = ri(1, hi), d = ri(2, hi + 1);
                // 2nd 分數 c/d 顛倒成 d/c
                var rn = a * d, D = b * c;
                var ans = reduce(rn, D);
                var tip = '把 ' + c + '/' + d + ' 顛倒成 ' + d + '/' + c + '：' + a + '/' + b + ' × ' + d + '/' + c + ' = (' + a + '×' + d + ')/(' + b + '×' + c + ') = ' + rn + '/' + D + (gcd(rn, D) > 1 && ans.d !== 1 ? '，約分成 ' + ans.n + '/' + ans.d : '') + (ans.d === 1 ? '（等於整數 ' + ans.n + '）' : '') + '。';
                return { html: fhtml(a, b) + ' <span class="fl-op">÷</span> ' + fhtml(c, d), aN: ans.n, aD: ans.d, tip: tip, spoken: b + '分之' + a + ' 除以 ' + d + '分之' + c };
            } }
    ];
    var CAT_BY = {};
    CATS.forEach(function (c) { CAT_BY[c.key] = c; });
    function showScreen(name) {
        $('screen-menu').classList.toggle('active', name === 'menu');
        $('screen-play').classList.toggle('active', name === 'play');
        try {
            window.scrollTo(0, 0);
        }
        catch (e) { }
    }
    function renderMenu() {
        var html = '';
        CATS.forEach(function (c) {
            html += '<button type="button" class="cn-lesson" data-cat="' + c.key + '">' +
                '<span class="cn-lesson-top"><span class="cn-lesson-emoji" style="background:var(--su-tint)" aria-hidden="true">' + c.emoji + '</span><span class="cn-lesson-name">' + c.label + '</span></span>' +
                '<span class="cn-lesson-sub">' + c.sub + '</span><span class="cn-lesson-foot todo">▶️ 開始練習</span></button>';
        });
        html += '<button type="button" class="cn-lesson" data-cat="mix">' +
            '<span class="cn-lesson-top"><span class="cn-lesson-emoji" style="background:var(--su-tint)" aria-hidden="true">🎲</span><span class="cn-lesson-name">綜合練習（各種混合）</span></span>' +
            '<span class="cn-lesson-sub">上面幾種都學過之後再來這裡混合練，最能練到「看到題目就知道用哪一招」</span><span class="cn-lesson-foot todo">▶️ 開始練習</span></button>';
        $('fl-menu').innerHTML = html;
        Array.prototype.forEach.call($('fl-menu').querySelectorAll('.cn-lesson'), function (b) {
            b.addEventListener('click', function () { startMode(b.getAttribute('data-cat')); });
        });
    }
    var mode = null, cur = null, answered = false, correct = 0, total = 0, streak = 0, bestStreak = 0, lv = 1;
    var lvCorrect = 0, missStreak = 0, lvChange = 0;
    var LVL_UP = 5, LVL_DOWN = 3;
    function startMode(m) {
        mode = m;
        correct = 0;
        total = 0;
        streak = 0;
        bestStreak = 0;
        lv = 1;
        lvCorrect = 0;
        missStreak = 0;
        lvChange = 0;
        showScreen('play');
        $('play-title').textContent = (m === 'mix' ? '綜合練習 🎲' : CAT_BY[m].label + ' ' + CAT_BY[m].emoji);
        if (m === 'mix') {
            renderMixPrimer();
        }
        else {
            renderTeach(m);
        }
    }
    function renderMixPrimer() {
        $('stage').innerHTML =
            '<div class="fl-card">' +
                '<div class="cn-teach-emoji" aria-hidden="true">🎲</div><h2 class="cn-h">綜合練習</h2>' +
                '<div class="fl-teach">這裡會把<b>六種分數算法混在一起</b>出題。看到題目時，先<b>想想它是哪一種</b>：<br><br>' +
                '・看到 <b>單一分數要化簡</b> → 約分（同除最大公因數）<br>・<b>帶分數↔假分數</b> → 假分數：分子÷分母，商當整數、餘數當分子；帶分數：整數×分母＋分子<br>・<b>同分母加減</b> → 分母不變、分子加減<br>・<b>異分母加減</b> → 先通分再加減<br>・<b>×</b> → 分子乘分子、分母乘分母<br>・<b>÷</b> → 顛倒相乘<br><br>' +
                '想不起來也沒關係，答完每題都會再示範一步步怎麼算。<b>建議先把上面六種各自練過再來這裡</b>。</div>' +
                '<div class="fl-actions"><button type="button" class="btn btn-primary" id="btn-begin">開始混合練習 🎲</button></div>' +
                '</div>';
        $('btn-begin').addEventListener('click', function () { beginPractice(); });
        try {
            $('btn-begin').focus();
        }
        catch (e) { }
    }
    function renderTeach(m) {
        var c = CAT_BY[m];
        $('stage').innerHTML =
            '<div class="fl-card">' +
                '<div class="cn-teach-emoji" aria-hidden="true">' + c.emoji + '</div><h2 class="cn-h">' + c.label + '</h2>' +
                '<div class="cn-block"><div class="fl-teach">' + c.teach + '</div></div>' +
                '<div class="fl-actions"><button type="button" class="btn btn-primary" id="btn-begin">我學會了，開始練習 ✏️</button></div>' +
                '</div>';
        $('btn-begin').addEventListener('click', function () { beginPractice(); });
        try {
            $('btn-begin').focus();
        }
        catch (e) { }
    }
    function beginPractice() { nextProblem(); }
    function genOne() { var c = mode === 'mix' ? pick(CATS) : CAT_BY[mode]; var p = c.gen(lv); p.cat = c; return p; }
    function nextProblem() {
        cur = genOne();
        answered = false;
        var bestTxt = bestStreak > streak ? ('（最佳 ' + bestStreak + '）') : '';
        var selfAsked = (cur.cat.key === 'reduce' || cur.cat.key === 'mixed'); // 這兩類的 spoken 已自帶問句（化成最簡／寫成假分數…），不可再補「等於多少」
        $('stage').innerHTML =
            '<div class="fl-card">' +
                '<div class="fl-scorebar"><span>答對 ' + correct + ' / ' + total + '　連對 ' + streak + ' ' + bestTxt + '🔥</span><span class="fl-lv">難度 Lv.' + lv + '</span></div>' +
                '<span class="fl-tag">' + cur.cat.emoji + ' ' + cur.cat.label + '</span>' +
                '<div class="fl-problem" id="fl-prob" tabindex="-1" role="img" aria-label="題目：' + cur.spoken + (selfAsked ? '' : '，等於多少') + '？">' + cur.html + (selfAsked ? '' : ' <span class="fl-op">=</span> <span style="color:var(--su-d)">?</span>') + '</div>' +
                '<div class="fl-answer">' +
                '<div class="fl-inpfrac">' +
                '<input type="text" inputmode="numeric" id="fl-n" aria-label="答案的分子" autocomplete="off">' +
                '<div class="fl-inpbar" aria-hidden="true"></div>' +
                '<input type="text" inputmode="numeric" id="fl-d" aria-label="答案的分母" autocomplete="off">' +
                '</div>' +
                '</div>' +
                '<div class="fl-whole-hint">答案是整數的話，分母填 1 就好；填好按「送出」。</div>' +
                '<div class="fl-actions"><button type="button" class="btn btn-primary" id="btn-submit">送出答案 ✓</button></div>' +
                '<div class="fl-reveal" id="fl-reveal" aria-live="assertive"></div>' +
                '<div class="fl-actions" id="fl-next-actions" style="display:none"><button type="button" class="btn btn-primary" id="btn-next">下一題 ➡️</button></div>' +
                '</div>';
        try {
            $('fl-prob').focus();
        }
        catch (e) { }
        $('btn-submit').addEventListener('click', submit);
        // Enter 於輸入框送出
        ['fl-n', 'fl-d'].forEach(function (id) { $(id).addEventListener('keydown', function (e) { if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (!answered)
                submit();
        } }); }); // stopPropagation：同一次 Enter 不要再冒泡到 document handler 觸發 nextProblem()（否則送出後立刻跳題、看不到回饋）
        $('btn-next').onclick = function () { nextProblem(); };
    }
    function parseIntStrict(s) { s = (s || '').trim(); if (!/^-?\d+$/.test(s))
        return null; return parseInt(s, 10); }
    function submit() {
        if (answered)
            return;
        var pn = parseIntStrict($('fl-n').value), pd = parseIntStrict($('fl-d').value);
        if (pn === null || pd === null || pd === 0) {
            var rev0 = $('fl-reveal');
            rev0.className = 'fl-reveal show no';
            rev0.textContent = '請在兩個格子都填入整數，分母不可以是 0 喔（答案是整數的話分母填 1）。';
            return;
        }
        // 等值判定（交叉相乘）：允許任何與正解等值的分數，含未約分或整數形式
        var equal = (pn * cur.aD === cur.aN * pd);
        // 約分題必須化到最簡才算對（否則填原式也會等值，失去約分的意義）
        var reducedEnough = (cur.cat.key !== 'reduce') || (gcd(Math.abs(pn), pd) === 1);
        if (cur.cat.key === 'reduce' && equal && !reducedEnough) {
            // 值對但還沒最簡，給明確提示、不計為答對、讓他再試（不鎖定）
            var revH = $('fl-reveal');
            revH.className = 'fl-reveal show no';
            revH.textContent = '大小對了，但還沒「化到最簡」喔——把分子和分母再同時除以它們的公因數（' + gcd(Math.abs(pn), pd) + '）試試看。';
            return;
        }
        answered = true;
        total++;
        var ok = equal && reducedEnough;
        lvChange = 0;
        if (ok) {
            correct++;
            streak++;
            if (streak > bestStreak)
                bestStreak = streak;
            missStreak = 0;
            lvCorrect++;
            if (lvCorrect >= LVL_UP && lv < 5) {
                lv++;
                lvCorrect = 0;
                lvChange = 1;
            }
        }
        else {
            streak = 0;
            missStreak++;
            if (missStreak >= LVL_DOWN && lv > 1) {
                lv--;
                lvCorrect = 0;
                missStreak = 0;
                lvChange = -1;
            }
        }
        try {
            if (window.Game && typeof window.Game.pingActive === 'function')
                window.Game.pingActive();
        }
        catch (e) { }
        var lvMsg = lvChange > 0 ? ('　🎉 難度升到 Lv.' + lv + '！') : (lvChange < 0 ? ('　難度降到 Lv.' + lv + '，先把手感找回來 🙂') : '');
        var ansTxt = ftxt(cur.aN, cur.aD);
        var rev = $('fl-reveal');
        rev.className = 'fl-reveal show ' + (ok ? 'ok' : 'no');
        rev.textContent = (ok ? '答對了！👍 最簡答案是 ' + ansTxt + '。' : ('沒關係～最簡答案是 ' + ansTxt + '。')) + cur.tip + lvMsg;
        $('btn-submit').disabled = true;
        $('fl-n').disabled = true;
        $('fl-d').disabled = true;
        $('fl-next-actions').style.display = 'flex';
        try {
            $('btn-next').focus();
        }
        catch (e) { }
    }
    document.addEventListener('keydown', function (e) {
        if (!$('screen-play').classList.contains('active'))
            return;
        if (e.key === 'Enter') {
            var onActionBtn = e.target && e.target.tagName === 'BUTTON';
            if (onActionBtn)
                return;
            if (answered && $('btn-next')) {
                e.preventDefault();
                nextProblem();
            }
        }
    });
    $('btn-back').addEventListener('click', function () { showScreen('menu'); });
    showScreen('menu');
    renderMenu();
})();
