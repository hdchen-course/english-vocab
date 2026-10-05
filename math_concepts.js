/* =====================================================================
 * math_concepts.ts  →  (tsc, tsconfig.legacy.json) →  math_concepts.js
 * 數學觀念養成頁的教學資料（window.CONCEPT）＋專用 SVG 概念圖 helper。
 * 原為 math_concepts.html 的 inline <script>；逐檔 TS 遷移抽出成 sibling .js。
 * 載入順序：game_core.js → 本檔 → anim_core.js → concept_engine.js
 *   （本檔提供 window.CONCEPT；mount 於執行期才用 window.Anim，故解析順序無虞）。
 * 行為與原 inline 版等價（型別剝離、頂層函式仍為全域、window.CONCEPT 不變）。
 * ===================================================================== */
// ---- 數學專用 SVG 概念圖 helper（文字用 currentColor = --ink，亮暗皆清楚）----
function balance(l, r, tilt) {
    var d = tilt === 'left' ? -10 : (tilt === 'right' ? 10 : 0);
    return '<svg viewBox="0 0 300 165" role="img" aria-label="天平 左' + l + ' 右' + r + '"><polygon points="150,49 121,150 179,150" fill="#8a8a8a"/><g class="beam" style="transform:rotate(' + d + 'deg)"><line x1="45" y1="45" x2="255" y2="45" stroke="currentColor" stroke-opacity="0.6" stroke-width="7" stroke-linecap="round"/><line x1="80" y1="45" x2="80" y2="72" stroke="#9a9a9a" stroke-width="3"/><path d="M52 72 Q80 100 108 72" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="4"/><text x="80" y="66" text-anchor="middle" font-size="19" font-weight="800" fill="currentColor">' + l + '</text><line x1="220" y1="45" x2="220" y2="72" stroke="#9a9a9a" stroke-width="3"/><path d="M192 72 Q220 100 248 72" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="4"/><text x="220" y="66" text-anchor="middle" font-size="19" font-weight="800" fill="currentColor">' + r + '</text></g></svg>';
}
function blocks(label, n) { var s = '<svg viewBox="0 0 300 90" role="img" aria-label="' + n + '個' + label + '">', x = (300 - n * 52) / 2; for (var i = 0; i < n; i++) {
    s += '<rect x="' + x + '" y="24" width="42" height="42" rx="8" fill="none" stroke="currentColor" stroke-width="3"/><text x="' + (x + 21) + '" y="51" text-anchor="middle" font-size="18" font-weight="800" fill="currentColor">' + label + '</text>';
    x += 52;
} return s + '</svg>'; }
function numline(mark, arrow) {
    var W = 300, pad = 20, span = W - 2 * pad, y = 55, x = function (v) { return pad + ((v + 5) / 10) * span; };
    var s = '<svg viewBox="0 0 300 90" role="img" aria-label="數線"><line x1="' + pad + '" y1="' + y + '" x2="' + (W - pad) + '" y2="' + y + '" stroke="#8a8a8a" stroke-width="3"/>';
    for (var v = -5; v <= 5; v++) {
        var xx = x(v);
        s += '<line x1="' + xx + '" y1="' + (y - 5) + '" x2="' + xx + '" y2="' + (y + 5) + '" stroke="#8a8a8a" stroke-width="2"/><text x="' + xx + '" y="' + (y + 20) + '" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">' + v + '</text>';
    }
    if (arrow) {
        var x1 = x(arrow.from), x2 = x(arrow.to), ay = y - 16, dir = x2 >= x1 ? 1 : -1;
        s += '<line x1="' + x1 + '" y1="' + ay + '" x2="' + x2 + '" y2="' + ay + '" stroke="#2563eb" stroke-width="3"/><polygon points="' + x2 + ',' + ay + ' ' + (x2 - dir * 7) + ',' + (ay - 5) + ' ' + (x2 - dir * 7) + ',' + (ay + 5) + '" fill="#2563eb"/><circle cx="' + x1 + '" cy="' + y + '" r="4" fill="#2563eb"/>';
    }
    if (mark != null) {
        var arr = Array.isArray(mark) ? mark : [mark];
        arr.forEach(function (mv) { var mx = x(mv); s += '<circle cx="' + mx + '" cy="' + y + '" r="6" fill="#e11d48"/><text x="' + mx + '" y="' + (y - 12) + '" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">' + mv + '</text>'; });
    }
    return s + '</svg>';
}
function fracbar(parts, shaded, color) { color = color || '#2563eb'; var W = 300, pad = 14, bw = W - 2 * pad, cw = bw / parts, s = '<svg viewBox="0 0 300 70" role="img" aria-label="' + shaded + '/' + parts + '">'; for (var i = 0; i < parts; i++) {
    var xx = pad + i * cw;
    s += '<rect x="' + xx + '" y="16" width="' + cw + '" height="38" fill="' + (i < shaded ? color : 'none') + '" stroke="currentColor" stroke-width="2"/>';
} return s + '</svg>'; }
function fraccircle(parts, shaded, color) { color = color || '#2563eb'; var cx = 150, cy = 42, r = 34, s = '<svg viewBox="0 0 300 90" role="img" aria-label="' + shaded + '/' + parts + '">'; for (var i = 0; i < parts; i++) {
    var a0 = (i / parts) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / parts) * 2 * Math.PI - Math.PI / 2;
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    var large = (a1 - a0) > Math.PI ? 1 : 0;
    s += '<path d="M' + cx + ',' + cy + ' L' + x0.toFixed(1) + ',' + y0.toFixed(1) + ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' Z" fill="' + (i < shaded ? color : 'none') + '" stroke="currentColor" stroke-width="2"/>';
} return s + '</svg>'; }
// 方格長方形：mode 'area'（鋪滿藍格）｜'perim'（紅粗外框）
function gridRect(cols, rows, mode) {
    var u = 26, W = cols * u, H = rows * u, pad = 10, vw = W + 2 * pad, vh = H + 2 * pad, s = '<svg viewBox="0 0 ' + vw + ' ' + vh + '" role="img" aria-label="' + cols + '乘' + rows + '長方形">';
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            var xx = pad + c * u, yy = pad + r * u;
            s += '<rect x="' + xx + '" y="' + yy + '" width="' + u + '" height="' + u + '" fill="' + (mode === 'area' ? 'rgba(37,99,235,0.20)' : 'none') + '" stroke="#9aa1ab" stroke-width="1"/>';
        }
    }
    s += '<rect x="' + pad + '" y="' + pad + '" width="' + W + '" height="' + H + '" fill="none" stroke="' + (mode === 'perim' ? '#e11d48' : 'currentColor') + '" stroke-opacity="' + (mode === 'perim' ? 1 : 0.6) + '" stroke-width="' + (mode === 'perim' ? 5 : 2) + '"/>';
    return s + '</svg>';
}
// 科學記號 stepped SVG（檔案區域 helper，非 anim_core 場景）：a×10ⁿ → 展開數。
//   畫出科學記號形式、再用「小數點搬 n 位」的 n 個編號跳格弧（右移變大／左移變小）示意次方。
//   math_advanced_concepts L7 的簡短複習可共用本函式，不複製。文字用 currentColor（亮暗皆清楚）。
function sciSteps(a, exp, expanded) {
    var sup = function (n) { var m = '⁰¹²³⁴⁵⁶⁷⁸⁹', s = (n < 0 ? '⁻' : ''), t = '' + Math.abs(n); for (var i = 0; i < t.length; i++)
        s += m.charAt(+t.charAt(i)); return s; };
    var hops = Math.abs(exp), right = exp >= 0, W = 300, H = 170;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="科學記號 ' + a + ' 乘以 10 的 ' + exp + ' 次方 等於 ' + expanded + '">';
    s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="#0ea5e9">科學記號：小數點搬 ' + hops + ' 位（' + (right ? '右移、數變大' : '左移、數變小') + '）</text>';
    s += '<text x="150" y="54" text-anchor="middle" font-size="23" font-weight="800" fill="currentColor">' + a + ' × 10' + sup(exp) + '</text>';
    var x0 = 52, x1 = 248, y = 112, step = (x1 - x0) / hops, circ = '①②③④⑤⑥⑦⑧⑨';
    s += '<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="#9aa1ab" stroke-width="2"/>';
    for (var i = 0; i < hops; i++) {
        var from = right ? (x0 + i * step) : (x1 - i * step), to = right ? (x0 + (i + 1) * step) : (x1 - (i + 1) * step), mx = (from + to) / 2;
        s += '<path d="M' + from.toFixed(1) + ',' + y + ' Q' + mx.toFixed(1) + ',' + (y - 22) + ' ' + to.toFixed(1) + ',' + y + '" fill="none" stroke="#e11d48" stroke-width="2"/>';
        var baseX = to + (from < to ? -6 : 6);
        s += '<polygon points="' + to.toFixed(1) + ',' + y + ' ' + baseX.toFixed(1) + ',' + (y - 4) + ' ' + baseX.toFixed(1) + ',' + (y + 4) + '" fill="#e11d48"/>';
        s += '<text x="' + mx.toFixed(1) + '" y="' + (y - 25) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#e11d48">' + circ.charAt(i) + '</text>';
    }
    s += '<circle cx="' + (right ? x0 : x1) + '" cy="' + y + '" r="4" fill="#e11d48"/>';
    s += '<text x="150" y="152" text-anchor="middle" font-size="21" font-weight="800" fill="currentColor">= ' + expanded + '</text>';
    return s + '</svg>';
}
// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
function animCanvas(w, h, label) {
    return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
        'style="max-width:' + w + 'px" ' +
        'role="img" aria-label="' + label + '"></canvas>';
}
window.CONCEPT = {
    progKey: 'math_concepts_v1', practiceHref: 'math.html',
    lessons: [
        { id: 'place', name: '位值與大數', emoji: '🔢', color: '#0ea5e9', sub: '每一位代表多少、大數怎麼讀', done: '記得：數字看「站哪一位」決定大小；大數每四位分一節（個級・萬級・億級）來讀。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '同一個數字，站的位置不同就不一樣大', svg: animCanvas(360, 220, '數字 333 的每個 3 對齊到位值欄：個位的 3 代表 3、十位的 3 代表 30、百位的 3 代表 300；同一個 3 站的位置不同，代表的大小就不同。'), mount: function (host) { if (!window.Anim)
                        return; var h = window.Anim.placeValue(host, { number: 333 }); return function () { h.stop(); }; }, text: '看這三個都是 <b>3</b>：站在<b>個位</b>只代表 3、站在<b>十位</b>代表 30、站在<b>百位</b>代表 300。同一個數字，<b>站的位置</b>決定它有多大——這就是「位值」。' },
                { type: 'teach', kicker: '讀大數', title: '每「四位」分一節：個級・萬級・億級', svg: animCanvas(360, 220, '數字 50830 對齊到位值欄，從右邊每四位落下一道分節，分成萬級與個級，讀作五萬零八百三十。'), mount: function (host) { if (!window.Anim)
                        return; var h = window.Anim.placeValue(host, { number: 50830 }); return function () { h.stop(); }; }, text: '大數從右邊起<b>每四位分一節</b>：個級（個十百千）、<b>萬級</b>、億級。從<b>高位往低位</b>逐節讀、補上位名。例：<b>50830</b> 讀作「<b>五萬零八百三十</b>」（中間空的位要讀一個「零」）。' },
                { type: 'quiz', kicker: '換你試試', title: '數字 4700 裡的「7」代表多少？', options: ['700', '7', '70', '7000'], answer: 0, why: '4700 由左到右是 千・百・十・個；7 站在百位，代表 7 個百，就是 700。', whyWrong: ['', '你只看了數字 7，忘了看它站的位置；7 站在百位，代表 7 個百＝700。', '你可能把 7 當成在十位了；4700 裡 7 其實站在百位，是 700。', '你可能把 7 當成在千位了；千位是最左邊的 4，7 在百位，是 700。'] },
                { type: 'quiz', kicker: '換你試試', title: '「三萬零五十」寫成數字是？', options: ['30050', '3050', '300050', '35000'], answer: 0, why: '三萬＝30000，中間沒有千位、百位（讀作「零」），再加五十（50），合起來是 30050。', whyWrong: ['', '你可能把三萬寫成了三千（少一個位階）；三萬是 30000，加五十是 30050。', '你可能把三萬寫成了三十萬（300000）；三萬只有 30000，加五十是 30050。', '你可能把「五十」聽成了「五千」；五十是 50，三萬加五十是 30050。'] }
            ] },
        { id: 'round', name: '概數（四捨五入）', emoji: '📏', color: '#14b8a6', sub: '取大約的數：四捨五入到整十、整百', done: '記得：四捨五入看「要捨去那一位」——0~4 捨、5~9 進；數線上滾向比較近的整十／整百。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '概數：取「大約的數」好估算', svg: animCanvas(360, 180, '數線上 60 到 70，68 比較靠近 70，動畫把 68 滾向 70，示意四捨五入到整十是 70。'), mount: function (host) { if (!window.Anim)
                        return; var h = window.Anim.numberLine(host, { mode: 'round', value: 68, roundTo: 10 }); return function () { h.stop(); }; }, text: '<b>概數</b>就是取「<b>大約</b>的數」，方便估算和比較。把 <b>68</b> 放上數線：它離 <b>70</b> 比離 60 近，所以四捨五入到整十會<b>滾向 70</b>。' },
                { type: 'teach', kicker: '記規則', title: '0~4 捨去、5~9 進位', svg: animCanvas(360, 180, '數線上 60 到 70，63 比較靠近 60，動畫把 63 滾向 60，示意個位 3 要捨去。'), mount: function (host) { if (!window.Anim)
                        return; var h = window.Anim.numberLine(host, { mode: 'round', value: 63, roundTo: 10 }); return function () { h.stop(); }; }, text: '看<b>要捨去的那一位</b>：<b>0~4 捨去</b>（往下）、<b>5~9 進位</b>（往上）。<b>63</b> 的個位是 3（屬於 0~4），所以捨去變成 <b>60</b>；若是 68（個位 8）就進位到 70。' },
                { type: 'quiz', kicker: '換你試試', title: '248 四捨五入到整百是多少？', options: ['200', '300', '250', '240'], answer: 0, why: '四捨五入到整百看十位：248 的十位是 4，0~4 要捨去，所以 248 ≈ 200。', whyWrong: ['', '你可能以為要進位；看十位 4 比 5 小，要捨去，所以是 200。', '你可能四捨五入到整十了；題目要到整百，看十位 4 捨去，是 200。', '你可能只把個位去掉；四捨五入到整百要看十位（4）決定，捨去後是 200。'] },
                { type: 'quiz', kicker: '換你試試', title: '四捨五入到整十，65 會變成？', options: ['70', '60', '65', '100'], answer: 0, why: '四捨五入到整十看個位：65 的個位是 5，5~9 要進位，所以 65 ≈ 70。', whyWrong: ['', '你可能把 5 當成要捨去；規則是 5~9 要進位，個位 5 進位到 70。', '你可能忘了概數的個位要變成 0；到整十的概數個位是 0，65 進位成 70。', '你可能進位進太多了；65 到最近的整十是 70，不是整百 100。'] }
            ] },
        { id: 'frac', name: '分數是什麼', emoji: '🍕', color: '#f59e0b', sub: '分割、比大小、等值分數', done: '記得：分母是分成幾份、分子是拿幾份；分越少份每份越大。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '把一個東西平分', svg: fraccircle(4, 1, '#f59e0b'), text: '一個披薩<b>平分成 4 份</b>，拿走其中 <b>1 份</b>，就是 <b>1/4</b>。下面那個數（分母）是「分成幾份」，上面那個數（分子）是「拿了幾份」。' },
                { type: 'teach', kicker: '看長條', title: '分子 / 分母', svg: fracbar(4, 3, '#f59e0b') + '<div class="cn-eq">3/4</div>', text: '這條分成 4 份、塗了 3 份，就是 <b>3/4</b>。分母 4＝總份數，分子 3＝塗色份數。' },
                { type: 'quiz', kicker: '換你試試', title: '塗色的部分是幾分之幾？', svg: fracbar(5, 2, '#f59e0b'), options: ['2/5', '5/2', '2/3', '3/5'], answer: 0, why: '分成 5 份、塗了 2 份，就是 2/5（分子在上、分母在下）。', whyWrong: ['', '你可能把總份數5寫到上面、塗色份數2寫到下面了，記得塗的份數才是分子。', '你可能把「沒塗色」的3份當成了分母，分母要數的是全部平分的總份數。', '你可能數到了「沒塗色」的份數當分子，分子要數的是被塗色的份數喔。'] },
                { type: 'teach', kicker: '比大小', title: '同樣拿 1 份，分越少份、每份越大', svg: fracbar(2, 1, '#f59e0b') + fracbar(4, 1, '#f59e0b'), text: '兩條一樣長：上面 <b>1/2</b>（分成 2 份、拿 1 份）比下面 <b>1/4</b>（分成 4 份、拿 1 份）<b>大</b>——分的份數越少，每一份反而越大。' },
                { type: 'quiz', kicker: '換你試試', title: '1/2 和 1/4，哪個比較大？', options: ['1/2', '1/4', '一樣大', '不能比'], answer: 0, why: '分成 2 份的每一份，比分成 4 份的每一份大，所以 1/2 比較大。', whyWrong: ['', '你可能以為分母4比2大分數就比較大，其實同一個整體分越多份，每一份反而越小。', '你可能覺得都是「一份」就一樣，但每份多大要看整體被切成幾份喔。', '你可能覺得分母不同就沒法比，其實想成切同一個披薩，一份大小就能比出來。'] },
                { type: 'teach', kicker: '等值分數', title: '切更細，面積一樣大', svg: animCanvas(300, 200, '一條長條塗了左邊一半是1/2，把每一塊切得更細，塗色的面積都沒變，分子分母同時變大：1/2=2/4=3/6'), mount: function (host) { return window.Anim && window.Anim.fractionEquiv(host); }, text: '<b>1/2</b>、<b>2/4</b>、<b>3/6</b> 塗色的<b>面積一模一樣</b>，其實是同樣多！把每一塊<b>切得更細</b>，分子和分母<b>同時變大</b>，大小卻沒變——這叫<b>等值分數</b>：1/2 = 2/4 = 3/6。（約分、通分就是在做這件事。）' },
                { type: 'quiz', kicker: '換你試試', title: '2/4 等於下面哪一個？', options: ['1/2', '1/4', '2/2', '4/2'], answer: 0, why: '2/4 塗色長度和 1/2 一樣，所以 2/4 = 1/2。', whyWrong: ['', '你可能只把分子2變成1、分母4卻沒動，約分要分子分母同時除以一樣的數。', '注意2/2代表全部都塗滿了（等於1），比塗一半多很多喔。', '你可能把分子和分母上下顛倒了；4/2 其實比 1 還大，可是塗色只有一半，不會比整個還多喔。'] }
            ] },
        { id: 'area', name: '面積 vs 周長', emoji: '📐', color: '#16a34a', sub: '裡面有多大 vs 邊上一圈多長', done: '記得：面積算「裡面」（幾格）、周長算「邊上」（繞一圈）。兩個不一樣喔！',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '面積 = 裡面鋪滿幾格', svg: gridRect(4, 3, 'area') + '<div class="cn-eq">面積 = 4 × 3 = 12</div>', text: '這個長方形長 <b>4</b>、寬 <b>3</b>，裡面鋪滿 <b>12</b> 個小方格。<b>面積 = 長 × 寬</b>，算的是<b>裡面</b>有多大。' },
                { type: 'teach', kicker: '換個角度', title: '周長 = 沿著邊走一圈', svg: gridRect(4, 3, 'perim') + '<div class="cn-eq">周長 = 4+3+4+3 = 14</div>', text: '沿著紅色的<b>邊</b>走一圈，總長就是<b>周長</b>：4 + 3 + 4 + 3 = <b>14</b>。周長算的是<b>邊上</b>一圈有多長。' },
                { type: 'teach', kicker: '別搞混', title: '一個算「裡面」，一個算「邊上」', svg: gridRect(4, 3, 'area'), text: '同一個長方形：<b>面積</b>看<b>裡面</b>有幾格（12）、<b>周長</b>看<b>邊上</b>繞一圈（14）。兩個是<b>不一樣</b>的東西，別搞混囉！' },
                { type: 'quiz', kicker: '換你試試', title: '長 5、寬 2 的長方形，面積是多少？', options: ['10', '14', '7', '20'], answer: 0, why: '面積 = 長 × 寬 = 5 × 2 = 10。', whyWrong: ['', '你可能算成了「周長」（把四邊加起來），面積要用長和寬相乘喔。', '你可能把長和寬相加（5+2）了，面積是相乘不是相加。', '你可能多乘了一次（像把某一邊算成兩倍），面積只要長×寬各算一次就好。'] },
                { type: 'quiz', kicker: '換你試試', title: '同一個長 5、寬 2 的長方形，周長是多少？', options: ['14', '10', '7', '20'], answer: 0, why: '周長 = 四邊相加 = 5 + 2 + 5 + 2 = 14。', whyWrong: ['', '你可能算成了「面積」（長×寬），周長是要把四個邊長全加起來喔。', '你可能只加了一個長和一個寬（5+2），周長要把兩組長寬都加進去。', '你可能把每一邊都當成5、加了四次，記得長和寬不一樣長，要分開數。'] },
                { type: 'quiz', kicker: '想深一點', title: '兩個長方形面積都是 12，周長一定一樣嗎？', options: ['不一定，面積一樣周長也可能不同', '一定一樣', '周長一定是面積的兩倍', '沒辦法知道'], answer: 0, why: '例如 3×4（周長 14）和 2×6（周長 16），面積都是 12，但周長不一樣！', whyWrong: ['', '你可能以為面積一樣形狀就一樣，其實同面積能排成又扁又長或方正，周長會不同。', '你可能剛好看到某個例子是兩倍就當成規則，面積和周長之間沒有固定倍數關係。', '你可能覺得情況太多沒法判斷，其實只要各舉一個例子比比看就有答案了。'] }
            ] },
        { id: 'neg', name: '數線與負數', emoji: '🌡️', color: '#7c3aed', sub: '負數比大小與加減（進階挑戰）', done: '記得：數線越右邊越大；加往右、減往左。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '數線：0 在中間', svg: numline(0, null), text: '把數字排成一條線，<b>0 在中間</b>，右邊是正數（1、2、3…），左邊是<b>負數</b>（−1、−2、−3…），像溫度計一樣。' },
                { type: 'teach', kicker: '比大小', title: '越右邊，數字越大', svg: numline([-3, -1], null), text: '在數線上<b>越靠右邊就越大</b>。看圖：<b>−1 在 −3 的右邊</b>，所以 <b>−1 比 −3 大</b>；負數裡，離 0 越近反而越大。' },
                { type: 'quiz', kicker: '換你試試', title: '−3 和 1，哪個比較大？', options: ['1', '−3', '一樣大', '無法比較'], answer: 0, why: '1 在數線右邊、−3 在左邊，右邊較大，所以 1 比較大。', whyWrong: ['', '你可能只比了 3 和 1、忽略前面的負號；−3 帶負號表示比 0 還小，在數線的左邊，所以比 1 小喔。', '你可能忽略了那個負號；一個在 0 的左邊、一個在右邊，位置不同，大小就不一樣喔。', '你可能覺得有負數就不能比，其實在數線上誰在右邊誰就比較大。'] },
                { type: 'teach', kicker: '學加減', title: '加 = 往右走，減 = 往左走', svg: numline(null, { from: -2, to: 1 }), text: '算 <b>−2 + 3</b>：從 <b>−2</b> 出發，<b>往右走 3 格</b>，走到 <b>1</b>。所以 −2 + 3 = <b>1</b>。加就往右、減就往左。' },
                { type: 'quiz', kicker: '換你試試', title: '−2 + 3 = ？', options: ['1', '−5', '5', '−1'], answer: 0, why: '從 −2 往右走 3 格 → −1 → 0 → 1，答案是 1。', whyWrong: ['', '你可能把2和3相加又保留了負號，這裡是要往右走，不是往左喔。', '你可能直接把2和3相加，忘了−2的負號要先從0的左邊起算。', '你可能往右少走了幾格就停了，記得要從−2一步一步往右走滿3格。'] },
                { type: 'quiz', kicker: '再試一題', title: '1 − 4 = ？', options: ['−3', '3', '5', '−5'], answer: 0, why: '從 1 往左走 4 格 → 0 → −1 → −2 → −3，答案是 −3。', whyWrong: ['', '你可能把4−1算成3、順序相反了，這裡是要從1往左走4格喔。', '你可能把1和4相加了，可是減法要往左走、數字會越走越小。', '你可能把1和4加起來再加負號，其實是從1往左走4格，不是相加。'] }
            ] },
        { id: 'negrule', name: '負數的乘除', emoji: '➗', color: '#db2777', sub: '符號法則：負負得正（國中）', done: '記得：乘除看符號——同號得正、異號得負；負負相乘＝方向翻兩次＝轉回正。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '乘 −1 ＝ 把方向翻到另一邊', svg: animCanvas(360, 180, '數線上以 0 為界，一個指向 +3 的箭頭乘以 −1 後翻向左邊的 −3，示意乘負數方向相反。'), mount: function (host) { if (!window.Anim)
                        return; var h = window.Anim.numberLine(host, { mode: 'negative', min: -5, max: 5, flip: { from: 3, to: -3, label: '× (−1)：+3 翻到 −3，方向相反' } }); return function () { h.stop(); }; }, text: '在數線上，<b>乘 −1</b> 就是把箭頭<b>翻到 0 的另一邊</b>：<b>+3</b> 乘 −1 變成 <b>−3</b>，方向整個相反。所以「異號相乘」（一正一負）結果是<b>負</b>。' },
                { type: 'teach', kicker: '再翻一次', title: '翻兩次（負負）就轉回正', svg: animCanvas(360, 180, '數線上一個指向 −3 的箭頭再乘以 −1，翻回右邊的 +3，示意負負得正。'), mount: function (host) { if (!window.Anim)
                        return; var h = window.Anim.numberLine(host, { mode: 'negative', min: -5, max: 5, flip: { from: -3, to: 3, label: '再 × (−1)：−3 翻回 +3，負負得正' } }); return function () { h.stop(); }; }, text: '從 <b>−3</b> <b>再乘一次 −1</b>，箭頭<b>又翻回右邊</b>變成 <b>+3</b>。翻兩次就回到正向——這就是「<b>負 × 負 ＝ 正</b>」。整理成口訣：<b>同號得正、異號得負</b>，除法也一樣。' },
                { type: 'quiz', kicker: '換你試試', title: '(−4) × (−3) ＝ ？', options: ['12', '−12', '−7', '7'], answer: 0, why: '同號相乘得正：負×負＝正，4×3＝12，所以 (−4)×(−3)＝12。', whyWrong: ['', '你算對了 4×3＝12，但以為負×負還是負；其實負負得正，是正的 12。', '你可能把 −4 和 −3 相加成 −7 了；這題是相乘，4×3＝12 且負負得正。', '你可能把 4 和 3 相加成 7 了；要用乘法 4×3＝12，負負得正是正 12。'] },
                { type: 'quiz', kicker: '換你試試', title: '(−12) ÷ 4 ＝ ？', options: ['−3', '3', '−48', '48'], answer: 0, why: '異號相除得負：一負一正，12÷4＝3，加上負號是 −3。', whyWrong: ['', '你算對了 12÷4＝3，但忘了異號相除要得負；一負一正，答案是 −3。', '你可能把 12 和 4 相乘了；這題是除法，12÷4＝3，異號得負是 −3。', '你可能用了乘法又忽略負號；除法 12÷4＝3，一負一正得負，是 −3。'] }
            ] },
        { id: 'sci', name: '科學記號入門', emoji: '🔬', color: '#2563eb', sub: '很大很小的數怎麼寫（國中）', done: '記得：科學記號＝(1 到小於 10 的數)×10 的次方；次方正右移變大、負左移變小。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '科學記號 ＝ (1 到小於 10 的數) × 10 的次方', svg: sciSteps('3', 5, '300000'), text: '很大的數可以寫成 <b>a × 10ⁿ</b>，其中 <b>a 是 1 以上、小於 10 的數</b>（1≤|a|<10）。例如 <b>300000 ＝ 3 × 10⁵</b>：把小數點從 3 的後面<b>往右移 5 位</b>，就補出 5 個 0。' },
                { type: 'teach', kicker: '次方＝搬幾位', title: '正次方右移變大、負次方左移變小', svg: sciSteps('2.5', -3, '0.0025'), text: '次方就是<b>小數點要搬幾位</b>：<b>×10³</b> 向<b>右</b>移 3 位（數變大）、<b>×10⁻³</b> 向<b>左</b>移 3 位（數變小）。例：<b>2.5 × 10⁻³</b> 把小數點左移 3 位 ＝ <b>0.0025</b>。' },
                { type: 'quiz', kicker: '換你試試', title: '300000 寫成科學記號是？', options: ['3 × 10⁵', '3 × 10⁶', '30 × 10⁴', '3 × 10⁻⁵'], answer: 0, why: '小數點從 3 的後面往右移 5 位會補上 5 個 0 得到 300000，且前面的數 3 是 1 以上、小於 10 的數，所以 300000＝3 × 10⁵。', whyWrong: ['', '你可能把 0 的個數數成了 6；300000 的小數點只右移 5 位，是 10⁵。', '這個值雖然也等於 300000，但科學記號規定前面的數要是 1 以上、小於 10 的數；30 太大，要改寫成 3 × 10⁵。', '負次方代表很小的數（左移、變小）；300000 很大，次方要用正的 10⁵。'] },
                { type: 'quiz', kicker: '換你試試', title: '2.5 × 10⁻³ 等於多少？', options: ['0.0025', '0.025', '0.00025', '2500'], answer: 0, why: '10⁻³ 代表小數點往左移 3 位：2.5 → 0.25 → 0.025 → 0.0025，所以 2.5 × 10⁻³＝0.0025。', whyWrong: ['', '你可能只把小數點左移了 2 位；−3 次方要左移 3 位，是 0.0025。', '你可能把小數點左移了 4 位；−3 次方只左移 3 位，是 0.0025。', '負次方是「變小」要往左移；你往右移（變大）了，正確是左移 3 位的 0.0025。'] }
            ] },
        { id: 'eq', name: '用天平學方程式', emoji: '⚖️', color: '#0ea5e9', sub: '一元一次方程式（進階挑戰）', done: '記得訣竅：兩邊做一樣的事，天平就平衡。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '等號 = 就像一座天平', svg: balance('x + 3', '5', 'level'), text: '方程式 <b>x + 3 = 5</b> 是說：左邊和右邊<b>一樣重</b>，天平剛好平衡。我們要找出 <b>x</b> 是多少。' },
                { type: 'teach', kicker: '關鍵祕訣', title: '兩邊做「一樣的事」還是平衡', svg: balance('x', '2', 'level'), text: '把<b>兩邊都拿掉 3</b>：左邊剩 <b>x</b>，右邊 5−3 剩 <b>2</b>。所以 <b>x = 2</b>。只要兩邊做一樣的事，天平永遠平衡。' },
                { type: 'quiz', kicker: '換你試試', title: 'x + 2 = 6，x 是多少？', eq: 'x + 2 = 6', options: ['4', '8', '2', '6'], answer: 0, why: '兩邊都拿掉 2：6−2＝4，所以 x = 4。', whyWrong: ['', '你可能把兩邊相加（6+2）了，要讓x單獨留下應該是拿掉2，不是再加上去。', '你可能把式子裡被加上去的 2 直接當成了 x；其實 x 是還沒加 2 之前的數，要用 6−2 才對喔。', '你可能把等號右邊的6直接當成x，別忘了x還加了2才等於6喔。'] },
                { type: 'teach', kicker: '再學一招', title: '遇到 2x：兩邊「平分」', svg: blocks('x', 2) + '<div class="cn-eq">2x = 8</div>', text: '<b>2x</b> 是「兩個 x」合起來 8。要知道一個 x，把兩邊<b>平分成 2 份</b>：8 ÷ 2 = 4，所以 <b>x = 4</b>。' },
                { type: 'quiz', kicker: '換你試試', title: '3x = 12，x 是多少？', eq: '3x = 12', options: ['4', '9', '36', '3'], answer: 0, why: '三個 x 合起來是 12，平分成 3 份：12 ÷ 3 = 4。', whyWrong: ['', '你可能把12減掉3了，但3x是3乘以x，要用除法把12平分成3份。', '你可能把3和12相乘了，這裡3已經乘了x才等於12，要反過來用除的。', '你可能直接把 x 前面的 3 當成答案，那個 3 是說「有 3 個 x 合起來」，不是 x 本身喔。'] },
                { type: 'quiz', kicker: '綜合一下', title: 'x + 5 = 9，x 是多少？', eq: 'x + 5 = 9', options: ['4', '14', '5', '9'], answer: 0, why: '兩邊都拿掉 5：9−5＝4。', whyWrong: ['', '你可能把兩邊相加（9+5）了，要讓x單獨留下應該是拿掉5，不是再加上去。', '你可能把式子裡被加上去的 5 直接當成了 x；其實 x 是還沒加 5 之前的數，要用 9−5 才對喔。', '你可能把等號右邊的9直接當成x，別忘了x還要加5才等於9喔。'] }
            ] }
    ]
};
