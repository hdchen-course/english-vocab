/* =====================================================================
 * math2_concepts.ts  →  (tsc, tsconfig.legacy.json) →  math2_concepts.js
 * 原為 math2_concepts.html 的 inline <script>（教學資料 window.CONCEPT ＋ SVG 概念圖 helper）。
 * 逐檔 TS 遷移抽出成 sibling .js；以 IIFE 包住讓 helper 為檔案區域（避免與其他已遷移頁
 *   的同名頂層 helper 如 animCanvas 在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。
 * helper 只在建 window.CONCEPT 時同步呼叫；若有動畫 mount 於執行期才用 window.Anim。
 * 行為與原 inline 版等價。載入順序與原頁一致（本檔取代原 inline 位置）。
 * ===================================================================== */
(function () {
    // ---- 數學2 專用 SVG 概念圖（文字 currentColor = --ink）----
    // 座標平面：原點左下，range 0..5，可標一個點 (px,py)
    function coordGrid(px, py, showLabel) {
        var ox = 34, oy = 150, u = 22, n = 5;
        var s = '<svg viewBox="0 0 210 178" role="img" aria-label="座標平面上的點 ' + (showLabel ? ('(' + px + ', ' + py + ')') : '') + '">';
        // 格線
        for (var i = 1; i <= n; i++) {
            s += '<line x1="' + (ox + i * u) + '" y1="' + (oy - n * u) + '" x2="' + (ox + i * u) + '" y2="' + oy + '" stroke="#c7d2da" stroke-width="1"/>';
            s += '<line x1="' + ox + '" y1="' + (oy - i * u) + '" x2="' + (ox + n * u) + '" y2="' + (oy - i * u) + '" stroke="#c7d2da" stroke-width="1"/>';
        }
        // 軸
        s += '<line x1="' + ox + '" y1="' + oy + '" x2="' + (ox + n * u + 10) + '" y2="' + oy + '" stroke="currentColor" stroke-opacity="0.6" stroke-width="2.5"/>';
        s += '<line x1="' + ox + '" y1="' + oy + '" x2="' + ox + '" y2="' + (oy - n * u - 10) + '" stroke="currentColor" stroke-opacity="0.6" stroke-width="2.5"/>';
        // 刻度數字
        for (var t = 1; t <= n; t++) {
            s += '<text x="' + (ox + t * u) + '" y="' + (oy + 13) + '" text-anchor="middle" font-size="11" fill="currentColor">' + t + '</text>';
            s += '<text x="' + (ox - 8) + '" y="' + (oy - t * u + 3) + '" text-anchor="middle" font-size="11" fill="currentColor">' + t + '</text>';
        }
        s += '<text x="' + (ox + n * u + 8) + '" y="' + (oy + 13) + '" font-size="11" font-weight="800" fill="currentColor">x</text>';
        s += '<text x="' + (ox - 9) + '" y="' + (oy - n * u - 12) + '" font-size="11" font-weight="800" fill="currentColor">y</text>';
        s += '<text x="' + (ox - 8) + '" y="' + (oy + 13) + '" text-anchor="middle" font-size="11" fill="currentColor">O</text>';
        if (px != null) {
            var cx = ox + px * u, cy = oy - py * u;
            s += '<line x1="' + cx + '" y1="' + oy + '" x2="' + cx + '" y2="' + cy + '" stroke="#0ea5e9" stroke-width="1.5" stroke-dasharray="3 3"/>';
            s += '<line x1="' + ox + '" y1="' + cy + '" x2="' + cx + '" y2="' + cy + '" stroke="#0ea5e9" stroke-width="1.5" stroke-dasharray="3 3"/>';
            s += '<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="#0ea5e9" stroke="#fff" stroke-width="1.5"/>';
            if (showLabel)
                s += '<text x="' + (cx + 8) + '" y="' + (cy - 6) + '" font-size="11" font-weight="800" fill="currentColor">(' + px + ', ' + py + ')</text>';
        }
        return s + '</svg>';
    }
    // 比：a 個紅方塊 : b 個藍方塊
    function ratioBlocks(a, b) {
        var u = 24, gap = 6, pad = 10, groupGap = 22;
        var w = pad * 2 + a * (u + gap) + groupGap + b * (u + gap);
        var s = '<svg viewBox="0 0 ' + Math.max(w, 120) + ' 84" role="img" aria-label="比 ' + a + ' 比 ' + b + '">';
        var x = pad;
        for (var i = 0; i < a; i++) {
            s += '<rect x="' + x + '" y="14" width="' + u + '" height="' + u + '" rx="4" fill="rgba(239,68,68,0.7)" stroke="#b91c1c" stroke-width="1.5"/>';
            x += u + gap;
        }
        x += groupGap - gap;
        for (var j = 0; j < b; j++) {
            s += '<rect x="' + x + '" y="14" width="' + u + '" height="' + u + '" rx="4" fill="rgba(59,130,246,0.7)" stroke="#1d4ed8" stroke-width="1.5"/>';
            x += u + gap;
        }
        s += '<text x="' + (Math.max(w, 120) / 2) + '" y="66" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">紅 ' + a + ' ： 藍 ' + b + '　＝　' + a + ' : ' + b + '</text>';
        return s + '</svg>';
    }
    // 袋子裡 r 顆紅、bl 顆藍
    function bag(r, bl) {
        var s = '<svg viewBox="0 0 200 130" role="img" aria-label="袋子裡 ' + r + ' 顆紅球 ' + bl + ' 顆藍球">';
        s += '<path d="M46 34 L154 34 L166 108 Q166 118 156 118 L44 118 Q34 118 34 108 Z" fill="rgba(148,163,184,0.18)" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/>';
        s += '<rect x="60" y="22" width="80" height="14" rx="5" fill="rgba(148,163,184,0.30)" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/>';
        var total = r + bl, cols = Math.min(total, 4), cx0 = 56, cy0 = 58, sx = 30, sy = 28;
        for (var i = 0; i < total; i++) {
            var col = i % cols, row = Math.floor(i / cols);
            var fill = i < r ? 'rgba(239,68,68,0.85)' : 'rgba(59,130,246,0.85)';
            var stk = i < r ? '#b91c1c' : '#1d4ed8';
            s += '<circle cx="' + (cx0 + col * sx) + '" cy="' + (cy0 + row * sy) + '" r="11" fill="' + fill + '" stroke="' + stk + '" stroke-width="1.5"/>';
        }
        return s + '</svg>';
    }
    // 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
    function animCanvas(w, h, label) {
        return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
            'style="max-width:' + w + 'px" ' +
            'role="img" aria-label="' + label + '"></canvas>';
    }
    // 骰子（六面，標出點數 face）
    function die(face) {
        var pips = { 1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]], 5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]] };
        var s = '<svg viewBox="0 0 110 110" role="img" aria-label="骰子 ' + face + ' 點"><rect x="15" y="15" width="80" height="80" rx="14" fill="rgba(14,165,233,0.12)" stroke="currentColor" stroke-opacity="0.6" stroke-width="2.5"/>';
        (pips[face] || []).forEach(function (p) { s += '<circle cx="' + (15 + p[0] * 20) + '" cy="' + (15 + p[1] * 20) + '" r="7" fill="currentColor"/>'; });
        return s + '</svg>';
    }
    window.CONCEPT = {
        progKey: 'math2_concepts_v1', practiceHref: 'math.html',
        lessons: [
            { id: 'coord', name: '座標數對', emoji: '📍', color: '#0ea5e9', sub: '用 (x, y) 標出位置', done: '記得：座標 (x, y) 先看橫走幾格（x），再看直走幾格（y）；(0, 0) 是原點。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '座標平面：兩條數線交叉', svg: coordGrid(null, null, false), text: '橫著的數線叫 <b>x 軸</b>，直著的叫 <b>y 軸</b>，它們相交的點叫<b>原點</b>，座標是 <b>(0, 0)</b>。用這兩條線，就能標出平面上任何位置。' },
                    { type: 'teach', kicker: '怎麼讀', title: '座標 (x, y)：先橫再直', svg: coordGrid(3, 2, true), text: '座標寫成 <b>(x, y)</b>：<b>先</b>看從原點<b>向右走幾格</b>（x），<b>再</b>看<b>向上走幾格</b>（y）。圖中的點是 <b>(3, 2)</b> ＝ 右 3、上 2。<b>順序不能反</b>，(3, 2) 和 (2, 3) 不一樣。' },
                    { type: 'teach', kicker: '再看一個', title: '換個點：(2, 4)', svg: coordGrid(2, 4, true), text: '這個點向右 <b>2</b> 格、向上 <b>4</b> 格，所以是 <b>(2, 4)</b>。沿著虛線就能對回 x 軸和 y 軸的刻度。' },
                    { type: 'quiz', kicker: '換你試試', title: '座標 (3, 2) 代表什麼？', options: ['從原點向右 3、向上 2', '從原點向右 2、向上 3', '向右 3、向右 2', '向上 3、向上 2'], answer: 0, why: '座標 (x, y) 先看 x（向右 3），再看 y（向上 2）。', whyWrong: ['', '你可能把兩個數看反了；要先讀前面那個數往右走，再讀後面那個數往上走。', '你可能忘了第二個數是往「上」走的；兩個數管的方向不同，一個左右、一個上下。', '你可能把兩個數都當成往上走；其實第一個數管的是往右走的距離喔。'] },
                    { type: 'quiz', kicker: '看圖判斷', title: '圖中的點座標是多少？', svg: coordGrid(4, 1, false), options: ['(4, 1)', '(1, 4)', '(4, 4)', '(1, 1)'], answer: 0, why: '這個點向右 4 格、向上 1 格，先橫（4）再直（1），所以是 (4, 1)。', whyWrong: ['', '你可能把橫和直的格數寫反了；座標要先寫向右的格數，再寫向上的格數。', '你可能只注意到向右的格數就兩格都填它；往上走的格數要另外再數一次。', '你可能把向右的格數也數成和向上一樣；再仔細數一次往右走了幾格。'] },
                    { type: 'quiz', kicker: '想一想', title: '原點的座標是多少？', options: ['(0, 0)', '(1, 1)', '(1, 0)', '(0, 1)'], answer: 0, why: '原點是 x 軸和 y 軸的交點，向右 0、向上 0，座標是 (0, 0)。', whyWrong: ['', '你可能以為數字要從 1 開始；原點是還沒往右也沒往上的起點，兩邊都走了 0 步。', '你可能覺得橫向要先走一步；但原點就在起點上，往右並沒有移動喔。', '你可能覺得直向要先走一步；但原點就在起點上，往上並沒有移動喔。'] }
                ] },
            { id: 'ratio', name: '比與比例', emoji: '⚖️', color: '#8b5cf6', sub: 'a : b 與等值的比', done: '記得：比 a:b 是兩個量的關係；同乘（或同除）一個數，比不變 —— 2:3 = 4:6。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '比 a : b 是「幾比幾」', svg: ratioBlocks(2, 3), text: '<b>比</b>用來說兩個量的關係。像紅色 2 個、藍色 3 個，就寫成 <b>紅 : 藍 = 2 : 3</b>，唸作「二比三」。比在意的是<b>倍數關係</b>，不是差多少。' },
                    { type: 'teach', kicker: '關鍵', title: '同乘同一個數，比不變', svg: ratioBlocks(4, 6), text: '把紅、藍<b>都變成 2 倍</b>：2:3 → <b>4:6</b>。數量變多了，但「紅比藍」的關係<b>沒變</b>。所以 <b>2:3 = 4:6 = 6:9</b>…這些叫<b>等值的比</b>。' },
                    { type: 'teach', kicker: '反過來', title: '同除也一樣：化到最簡', svg: ratioBlocks(2, 3), text: '反過來，把 6:9 <b>同除以 3</b> 就變回 <b>2:3</b>。除到不能再約的整數比，叫<b>最簡整數比</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '2 : 3 ＝ 4 : ？', options: ['6', '5', '8', '9'], answer: 0, why: '2 和 4 是 2 倍關係，所以 3 也要乘 2 → 6。2:3 = 4:6。', whyWrong: ['', '你可能用「加」的想法（2 加 2 變 4，所以 3 也加 2）；比例要看乘幾倍，不是加同一個數。', '你可能把 4 又乘了一次 2（算成 4×2=8）；但要放大的是後項 3，先看 2 變 4 是 2 倍，再把 3 也乘 2。', '你可能照著 3 直接乘 3（因為 3×3）；但倍數要由前項 2 變成 4 來決定。'] },
                    { type: 'quiz', kicker: '化簡', title: '把 6 : 9 化成最簡整數比', options: ['2 : 3', '3 : 2', '6 : 9', '1 : 2'], answer: 0, why: '6 和 9 都能除以 3：6÷3=2、9÷3=3，所以是 2:3。', whyWrong: ['', '你可能算對了倍數卻把前後兩項寫反了；化簡不能把兩個數的順序對調。', '你可能覺得這樣就結束了；但 6 和 9 還能同時除以 3，要化到最簡才行。', '你可能用「減」的方式：6−3 得 3、9−3 得 6，再把 3:6 化成 1:2；但比要看「除以同一個數」的倍數關係，不能用相減喔。'] },
                    { type: 'quiz', kicker: '想一想', title: '調果汁，濃縮 : 水 = 1 : 3。用 4 杯濃縮，要幾杯水？', options: ['12 杯', '7 杯', '4 杯', '3 杯'], answer: 0, why: '濃縮從 1 變 4（×4），水也要 ×4：3×4 = 12 杯。1:3 = 4:12。', whyWrong: ['', '你可能用「加」的想法算成 4＋3；但比例要看放大幾倍，不是用加的喔。', '你可能以為濃縮和水一樣多；但配方裡水本來就比濃縮多，倍數要一起放大。', '你可能只記得原本配方的水量沒跟著變；濃縮變多了，水也要乘上相同倍數。'] }
                ] },
            { id: 'faces_a', name: '一個數的四種臉', emoji: '🎭', color: '#14b8a6', sub: '分數 ↔ 小數 ↔ 百分比 ↔ 比', done: '記得：分數÷得小數、小數×100 得百分比、百分比÷100 回分數、比 a:b 就是 a/b——同一個量，四種臉。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '一塊披薩，四種說法', svg: animCanvas(340, 300, '在 10×10 的百格裡填滿 3/4（75 格），同時出現四個讀數框：分數 3/4、小數 0.75、百分比 75%、比 3:4，說明它們其實都是同一個量。'), mount: function (host) { if (!window.Anim)
                            return; var h = window.Anim.partWhole100(host, { num: 3, den: 4 }); return function () { h && h.stop(); }; }, text: '一塊披薩切成 <b>4</b> 份、拿走 <b>3</b> 份。這一份量可以寫成 <b>分數 3/4</b>、<b>小數 0.75</b>、<b>百分比 75%</b>，或 <b>比 3:4</b>（填的 3 份 ∶ 全部 4 份）。看百格：塗滿的面積一直是同一塊——<b>同一個量，只是換四種寫法</b>。' },
                    { type: 'teach', kicker: '互換心法', title: '四種臉怎麼互相換', svg: animCanvas(340, 300, '在 10×10 的百格裡填滿 2/5（40 格），四個讀數框同步顯示分數 2/5、小數 0.4、百分比 40%、比 2:5，示範分數換小數、小數換百分比的方法。'), mount: function (host) { if (!window.Anim)
                            return; var h = window.Anim.partWhole100(host, { num: 2, den: 5 }); return function () { h && h.stop(); }; }, text: '換臉有固定心法：<b>分數→小數</b>就「<b>分子÷分母</b>」（2÷5＝0.4）；<b>小數→百分比</b>就「<b>×100 再加 %</b>」（0.4→40%）；<b>百分比→分數</b>就「<b>÷100 再約分</b>」（40%＝40/100＝2/5）；而<b>比 a:b</b> 其實就是分數 <b>a/b</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '0.6 等於百分之幾？', options: ['60%', '6%', '600%', '0.6%'], answer: 0, why: '小數換百分比要「×100 再加 %」：0.6×100＝60，所以是 60%。', whyWrong: ['', '你可能忘了乘 100，只把小數點後的 6 直接當成 6%；小數換百分比要先 ×100。', '你可能把 0.6 當成 6 再 ×100；但 0.6 本身還不到 1，×100 只會到 60，不是 600。', '你可能以為要「÷100」；方向相反了，小數換百分比是乘 100 把它放大，不是縮小。'] },
                    { type: 'quiz', kicker: '想一想', title: '3/4 用百分比寫是多少？', options: ['75%', '34%', '43%', '7.5%'], answer: 0, why: '先分子÷分母：3÷4＝0.75，再 ×100 加 %＝75%。', whyWrong: ['', '你可能把分子、分母的數字直接拼成 34%；分數要先做「3÷4」算出小數，不能把兩個數字並排。', '你可能把分子分母對調又拼成 43%；要算的是 3÷4，而且算完還要 ×100 變百分比。', '你可能算出 0.75 卻忘了 ×100，把它寫成 7.5%；小數換百分比要乘 100，0.75 是 75%。'] }
                ] },
            { id: 'faces_b', name: '百分比與比解生活題', emoji: '🛒', color: '#f97316', sub: '打折、調配，都用四種臉', done: '記得：打折＝付百分比、×小數最快；比先算「共幾份、某項佔幾分之幾」。',
                steps: [
                    { type: 'teach', kicker: '打折怎麼算', title: '打 8 折＝付 80%＝×0.8', svg: animCanvas(340, 300, '在 10×10 的百格裡填滿 4/5（80 格），四個讀數框顯示分數 4/5、小數 0.8、百分比 80%、比 4:5，說明打 8 折就是付原價的 80%。'), mount: function (host) { if (!window.Anim)
                            return; var h = window.Anim.partWhole100(host, { num: 4, den: 5 }); return function () { h && h.stop(); }; }, text: '<b>打 8 折</b>就是只付原價的 <b>80%</b>，也就是 <b>×0.8</b>（百格塗滿 80 格＝4/5）。反過來，<b>增加 20%</b> 就是付 <b>120%</b>＝<b>×1.2</b>。先把折扣或增減換成「<b>要付幾成（小數）</b>」，再乘原價，最快。' },
                    { type: 'teach', kicker: '調配怎麼算', title: '比：先算共幾份、佔幾分之幾', svg: animCanvas(340, 300, '在 10×10 的百格裡填滿 3/4（75 格），四個讀數框顯示分數 3/4、小數 0.75、百分比 75%、比 3:4。這裡的比 3:4 是「水:全部」，說明水佔全部的 3/4。'), mount: function (host) { if (!window.Anim)
                            return; var h = window.Anim.partWhole100(host, { num: 3, den: 4 }); return function () { h && h.stop(); }; }, text: '調果汁 <b>水 : 濃縮 ＝ 3 : 1</b>，每 <b>3</b> 份水配 <b>1</b> 份濃縮——這是「<b>部分比部分</b>」。加起來<b>一共 4 份</b>，所以<b>水 : 全部 ＝ 3 : 4</b>（部分比全部），也就是分數 <b>3/4 ＝ 75%</b>，正是畫面塗滿的那一塊。<b>注意：</b>同樣寫成 a:b，「部分比部分」和「部分比全部」意思不同，要看清楚比的是誰跟誰。' },
                    { type: 'quiz', kicker: '換你試試', title: '原價 500 元打 8 折，要付多少？', options: ['400 元', '100 元', '460 元', '540 元'], answer: 0, why: '打 8 折＝付 80%＝×0.8，所以 500×0.8＝400 元。', whyWrong: ['', '你算的是「省下多少」：500×20%＝100 元是折掉的部分，題目問的是「要付」的錢。', '你可能把 8 折當成「減 8%」，算成 500×0.92＝460；但打 8 折是付 80%，要乘 0.8。', '你可能把打折當成加價算成 500×1.08；打折是變便宜，要乘比 1 小的 0.8。'] },
                    { type: 'quiz', kicker: '想一想', title: '水和濃縮汁以 3:1 調，一共 400 毫升，水有多少？', options: ['300 毫升', '100 毫升', '133 毫升', '400 毫升'], answer: 0, why: '水:濃縮＝3:1，一共 3+1＝4 份，水佔 3/4，所以 400×3/4＝300 毫升。', whyWrong: ['', '你算的是濃縮汁的量：濃縮佔 1/4，400×1/4＝100 毫升，不是水。', '你可能用 400÷3；但要先算「一共 4 份」，水佔的是 3/4，不是除以 3。', '你可能把 400 毫升整杯都當成水；但裡面還有濃縮汁，水只佔其中的 3/4。'] }
                ] },
            { id: 'prob', name: '機率', emoji: '🎲', color: '#f59e0b', sub: '某件事發生的可能性', done: '記得：機率 = 想要的結果數 ÷ 所有可能結果數；不可能是 0，一定發生是 1。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '機率 = 想要的 ÷ 全部', svg: bag(3, 1), text: '<b>機率</b>是某件事發生的可能性，算法是<b>「想要的結果數 ÷ 所有可能的結果數」</b>。袋子裡 3 紅 1 藍共 4 顆，閉眼抽一顆是紅的機率 = <b>3/4</b>（想要 3 顆紅 ÷ 全部 4 顆）。' },
                    { type: 'teach', kicker: '骰子', title: '公平的骰子：每面都是 1/6', svg: die(3), text: '骰子有 <b>6 個面</b>，每面機會一樣。擲出某一個特定點數（例如 3）的機率 = <b>1/6</b>（想要 1 面 ÷ 全部 6 面）。' },
                    { type: 'teach', kicker: '兩個極端', title: '不可能 = 0，一定 = 1', svg: bag(4, 0), text: '機率介於 <b>0 到 1</b>。袋子全是紅球時，抽到藍球<b>不可能</b>，機率 = <b>0</b>；抽到紅球<b>一定會發生</b>，機率 = <b>1</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '擲一顆骰子，出現「3」的機率是多少？', options: ['1/6', '1/3', '6', '1/2'], answer: 0, why: '骰子 6 面機會相同，想要 1 面（3）÷ 全部 6 面 = 1/6。（骰子有 6 面不代表機率是 6，機率一定介於 0 到 1。）', whyWrong: ['', '你可能把面數記成 3；骰子其實有 6 個面，分母要用全部面的數量。', '你可能把「面的數量」直接當成機率；但機率一定介於 0 到 1 之間，不會是 6。', '你可能覺得不是中就是不中所以算一半；但骰子有 6 種同樣可能的結果，不只 2 種。'] },
                    { type: 'quiz', kicker: '看圖算算', title: '袋子裡 2 顆紅、3 顆藍。抽到藍球的機率？', svg: bag(2, 3), options: ['3/5', '2/5', '3/2', '1/5'], answer: 0, why: '藍球 3 顆 ÷ 全部（2+3=5）顆 = 3/5。', whyWrong: ['', '你可能數成紅球的顆數當分子了；分子要放的是「藍球」有幾顆。', '你可能拿藍球去比紅球了；機率的分母要用全部球的總數，不是只算紅球。', '你可能算成「抽中某一顆」的機率 1/5（5 顆裡挑 1 顆）；但「抽到藍球」要把 3 顆藍球都算進分子＝3/5。'] },
                    { type: 'quiz', kicker: '想一想', title: '丟一枚硬幣，出現正面的機率是多少？', options: ['1/2', '1/4', '1', '1/6'], answer: 0, why: '硬幣只有正、反 2 種結果且機會相同，正面 = 1 ÷ 2 = 1/2。', whyWrong: ['', '你可能把好幾次的結果乘在一起了；丟一次硬幣只有正、反 2 種結果，分母是 2。', '你可能以為一定會出現正面；但反面也可能出現，正面並不是每次都發生。', '你可能把硬幣和骰子搞混了；硬幣只有 2 面，不是 6 面喔。'] }
                ] }
        ]
    };
})();
