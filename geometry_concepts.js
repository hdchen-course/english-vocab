/* =====================================================================
 * geometry_concepts.ts  →  (tsc, tsconfig.legacy.json) →  geometry_concepts.js
 * 幾何觀念養成頁的教學資料（window.CONCEPT）＋專用 SVG 概念圖。
 * 原為 geometry_concepts.html 的 inline <script>；逐檔 TS 遷移抽出成 sibling .js。
 * 載入順序：本檔必須在 concept_engine.js 之前（提供 window.CONCEPT）。
 * 行為與原 inline 版等價（型別剝離、頂層函式仍為全域、window.CONCEPT 不變）。
 * ===================================================================== */
// ---- 幾何專用 SVG 概念圖（文字 currentColor = --ink）----
function cube() { return '<svg viewBox="0 0 170 155" role="img" aria-label="正方體"><rect x="34" y="62" width="72" height="72" fill="rgba(20,184,166,0.18)" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/><polygon points="34,62 64,36 136,36 106,62" fill="rgba(20,184,166,0.10)" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/><polygon points="106,62 136,36 136,108 106,134" fill="rgba(20,184,166,0.13)" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/><text x="85" y="150" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">正方體：6 個正方形的面</text></svg>'; }
function net(valid) {
    var u = 30, ox = 40, oy = 14, cells = valid ? [[2, 0], [1, 1], [2, 1], [3, 1], [2, 2], [2, 3]] : [[1, 0], [2, 0], [1, 1], [2, 1], [1, 2], [2, 2]];
    var s = '<svg viewBox="0 0 220 160" role="img" aria-label="展開圖">';
    cells.forEach(function (c) { s += '<rect x="' + (ox + c[0] * u) + '" y="' + (oy + c[1] * u) + '" width="' + u + '" height="' + u + '" fill="rgba(20,184,166,0.16)" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/>'; });
    return s + '</svg>';
}
function isoBox() { return '<svg viewBox="0 0 220 175" role="img" aria-label="長方體 長3寬2高2"><rect x="40" y="72" width="90" height="60" fill="rgba(20,184,166,0.18)" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/><polygon points="40,72 78,42 168,42 130,72" fill="rgba(20,184,166,0.10)" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/><polygon points="130,72 168,42 168,102 130,132" fill="rgba(20,184,166,0.13)" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/><text x="85" y="150" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">長 3</text><text x="152" y="122" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">高 2</text><text x="120" y="60" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">寬 2</text><text x="110" y="170" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">3 × 2 × 2 = 12 個</text></svg>'; }
function angle(deg, label) {
    var cx = 64, cy = 112, r = 74, rad = deg * Math.PI / 180, x2 = cx + r * Math.cos(-rad), y2 = cy + r * Math.sin(-rad);
    var s = '<svg viewBox="0 0 230 140" role="img" aria-label="' + deg + '度角">';
    s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + r) + '" y2="' + cy + '" stroke="currentColor" stroke-opacity="0.6" stroke-width="3"/>';
    s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="currentColor" stroke-opacity="0.6" stroke-width="3"/>';
    if (deg === 90) {
        s += '<rect x="' + cx + '" y="' + (cy - 16) + '" width="16" height="16" fill="none" stroke="#14b8a6" stroke-width="2"/>';
    }
    s += '<text x="' + (cx + 90) + '" y="' + (cy - 6) + '" text-anchor="middle" font-size="14" font-weight="800" fill="currentColor">' + deg + '°' + (label ? '（' + label + '）' : '') + '</text>';
    return s + '</svg>';
}
// ---- 動畫 teach 步驟的 canvas 容器（本頁沿用 .cn-anim-canvas，零新 class）----
function geoAnimCanvas(w, h, label) {
    return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
}
// ---- 扇形概念圖（stepped SVG；本檔 local，不進 anim_core）----
// 從正上方（-90°）順時針掃出圓心角 theta 的「餅」。
function geoSlice(cx, cy, r, theta) {
    var a0 = -90 * Math.PI / 180, a1 = (-90 + theta) * Math.PI / 180;
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    var large = theta > 180 ? 1 : 0;
    return 'M' + cx + ',' + cy + ' L' + x0.toFixed(1) + ',' + y0.toFixed(1) + ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' Z';
}
function geoCirc(cx, cy, r) {
    return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="2"/>';
}
// ① 整圓 → ② 切出圓心角 θ 的扇形 → ③ 佔整圓 ＝ θ/360
function sectorSteps() {
    var r = 36, cy = 66, th = 110;
    var s = '<svg viewBox="0 0 340 172" role="img" aria-label="扇形佔整圓 θ 除以 360 的三步示意：整圓、切出圓心角 θ 的扇形、佔整圓 θ/360">';
    s += geoCirc(58, cy, r) + '<text x="58" y="128" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">① 一整個圓</text>';
    s += geoCirc(170, cy, r) + '<path d="' + geoSlice(170, cy, r, th) + '" fill="rgba(20,184,166,0.22)" stroke="currentColor" stroke-opacity="0.7" stroke-width="2"/>';
    s += '<text x="188" y="60" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">θ</text>';
    s += '<text x="170" y="128" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">② 切出扇形（角 θ）</text>';
    s += geoCirc(282, cy, r) + '<path d="' + geoSlice(282, cy, r, th) + '" fill="rgba(20,184,166,0.22)" stroke="currentColor" stroke-opacity="0.7" stroke-width="2"/>';
    s += '<text x="282" y="128" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">③ 佔整圓 ＝ θ/360</text>';
    s += '<text x="170" y="160" text-anchor="middle" font-size="11.5" font-weight="800" fill="currentColor">扇形佔整圓的比例 ＝ θ ÷ 360</text>';
    return s + '</svg>';
}
// 扇形：弧長與面積都乘同一比例 θ/360
function sectorFormula() {
    var cx = 78, cy = 82, r = 52, th = 110;
    var s = '<svg viewBox="0 0 340 164" role="img" aria-label="扇形弧長與面積都是整圓乘以 θ 除以 360">';
    s += geoCirc(cx, cy, r) + '<path d="' + geoSlice(cx, cy, r, th) + '" fill="rgba(20,184,166,0.22)" stroke="currentColor" stroke-opacity="0.7" stroke-width="2"/>';
    s += '<text x="' + (cx + 16) + '" y="' + (cy - 6) + '" font-size="13" font-weight="800" fill="currentColor">θ</text>';
    s += '<text x="162" y="48" font-size="12.5" font-weight="800" fill="currentColor">弧長 ＝ 圓周長 ×(θ/360)</text>';
    s += '<text x="188" y="70" font-size="12" font-weight="700" fill="currentColor">＝ 2πr ×(θ/360)</text>';
    s += '<text x="162" y="104" font-size="12.5" font-weight="800" fill="currentColor">面積 ＝ 圓面積 ×(θ/360)</text>';
    s += '<text x="188" y="126" font-size="12" font-weight="700" fill="currentColor">＝ πr² ×(θ/360)</text>';
    return s + '</svg>';
}
// 題目用：半徑 6、圓心角 90° 的扇形
function sectorQuiz90() {
    var cx = 84, cy = 98, r = 58, th = 90;
    var s = '<svg viewBox="0 0 210 150" role="img" aria-label="半徑 6、圓心角 90 度的扇形">';
    s += geoCirc(cx, cy, r) + '<path d="' + geoSlice(cx, cy, r, th) + '" fill="rgba(20,184,166,0.22)" stroke="currentColor" stroke-opacity="0.75" stroke-width="2"/>';
    s += '<rect x="' + cx + '" y="' + (cy - 15) + '" width="15" height="15" fill="none" stroke="currentColor" stroke-opacity="0.7" stroke-width="1.5"/>';
    s += '<text x="' + (cx + 24) + '" y="' + (cy - 20) + '" font-size="12" font-weight="800" fill="currentColor">90°</text>';
    s += '<text x="' + (cx + r / 2) + '" y="' + (cy + 16) + '" text-anchor="middle" font-size="11.5" font-weight="800" fill="currentColor">半徑 6</text>';
    return s + '</svg>';
}
window.CONCEPT = {
    progKey: 'geometry_concepts_v1', practiceHref: 'geometry.html',
    lessons: [
        { id: 'net', name: '立體與展開圖', emoji: '📦', color: '#6366f1', sub: '正方體的面與展開圖', done: '記得：正方體有 6 個面；展開圖是把它剪開攤平，但不是每種排法都摺得回去。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '正方體有 6 個面', svg: cube(), text: '<b>正方體</b>是由 <b>6 個一樣的正方形</b>圍成的立體，像骰子、魔術方塊。它有 6 個面、8 個頂點、12 個邊。' },
                { type: 'teach', kicker: '攤平看看', title: '展開圖 = 剪開攤平', svg: net(true), text: '把正方體沿著邊<b>剪開、攤平</b>，就是<b>展開圖</b>，會有 <b>6 個正方形</b>連在一起。這個十字形摺起來剛好變回正方體。' },
                { type: 'teach', kicker: '注意', title: '不是每種排法都摺得成', svg: net(false), text: '同樣 6 個正方形，<b>排法不對</b>就摺不回正方體。像這個 2×3 的方塊，摺起來會有<b>面重疊、又缺面</b>，所以<b>不是</b>正方體的展開圖。' },
                { type: 'quiz', kicker: '換你試試', title: '正方體有幾個面？', options: ['6 個', '4 個', '8 個', '12 個'], answer: 0, why: '正方體由 6 個正方形圍成，有 6 個面（8 個頂點、12 個邊）。', whyWrong: ['', '你可能只數了看得到的側面，別忘了上面和下面兩個面也要一起算進去喔。', '8 其實是正方體「頂點（角）」的數量，你可能把角的數量當成面的數量了。', '12 是正方體「邊（稜）」的數量，你可能把邊的數量誤當成面來數了。'] },
                { type: 'quiz', kicker: '看圖判斷', title: '這個展開圖能摺成正方體嗎？（十字形）', svg: net(true), options: ['能，6 個面排列正確', '不能，會缺面'], answer: 0, why: '這種十字形排列，摺起來剛好每個面對應一個位置，可以摺成正方體。', whyWrong: ['', '十字形其實剛好有 6 個正方形，你可以把每個方塊對應到上下和四周，再想一遍就不缺面了。'] },
                { type: 'quiz', kicker: '再看一個', title: '這個展開圖能摺成正方體嗎？（2×3 排列）', svg: net(false), options: ['不能，摺起來會有面重疊', '能，剛好 6 個面'], answer: 0, why: '2×3 的方塊雖然也有 6 個正方形，但摺起來會重疊又缺面，摺不成正方體。', whyWrong: ['', '你可能只數到 6 個正方形就覺得可以，但實際摺摺看，排成一整塊會有面疊在一起喔。'] }
            ] },
        { id: 'vol', name: '體積：數積木', emoji: '🧊', color: '#14b8a6', sub: '裡面裝得下幾個小方塊', done: '記得：體積 = 長 × 寬 × 高，就是裡面能裝多少個單位立方體。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '體積 = 裡面裝幾個小方塊', svg: isoBox(), text: '<b>體積</b>是一個立體<b>裡面</b>裝得下多少個<b>單位小方塊</b>。這個箱子每排 3 個、每層 2 排、疊 2 層，數一數共 <b>12</b> 個。' },
                { type: 'teach', kicker: '公式', title: '長 × 寬 × 高', svg: isoBox(), text: '不用一個一個數，直接算：<b>體積 = 長 × 寬 × 高</b>。這個箱子 = 3 × 2 × 2 = <b>12</b>。（面積是「平面鋪滿」，體積是「立體裝滿」。）' },
                { type: 'quiz', kicker: '換你試試', title: '長 3、寬 2、高 2 的箱子，體積是幾個小方塊？', options: ['12', '7', '24', '6'], answer: 0, why: '體積 = 長 × 寬 × 高 = 3 × 2 × 2 = 12。', whyWrong: ['', '3＋2＋2＝7，你可能把三個邊相加了，但求體積要用相乘，不是相加喔。', '你可能多乘了一次，或把某個邊長看成兩倍，回去確認一下長、寬、高各是多少。', '3×2＝6，你可能只算了底面一層，別忘了高是 2，要把好幾層疊起來。'] },
                { type: 'quiz', kicker: '換你試試', title: '長方體的體積公式是哪一個？', options: ['長 × 寬 × 高', '長 ＋ 寬 ＋ 高', '長 × 寬', '四邊相加'], answer: 0, why: '長方體體積 = 長 × 寬 × 高（長×寬只是底面積，四邊相加是平面周長）。', whyWrong: ['', '把三邊相加算出來的是長度，不是體積；體積要看裡面能裝進多少個小方塊。', '長×寬只算了底面一層的面積，還要再乘上高，才知道總共疊了幾層。', '四邊相加是平面圖形求周長的做法，立體的體積不能這樣算喔。'] },
                { type: 'quiz', kicker: '想一想', title: '邊長都是 2 的正方體，體積是多少？', options: ['8', '6', '4', '12'], answer: 0, why: '2 × 2 × 2 = 8 個單位立方體。', whyWrong: ['', '6 是正方體的「面」的數量，你可能把面的個數當成體積了。', '2×2＝4，你可能只乘了兩次；正方體有長、寬、高三個邊都要相乘。', '12 是正方體「邊」的數量，你可能把邊的個數誤當成體積了。'] }
            ] },
        { id: 'angle', name: '認識角度', emoji: '📐', color: '#f59e0b', sub: '直角、銳角、鈍角', done: '記得：直角 90°；比 90° 小是銳角、比 90° 大是鈍角。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '直角 = 90°', svg: angle(90, '直角'), text: '兩條線<b>垂直</b>夾出的角是 <b>90°</b>，叫<b>直角</b>。牆角、書本的角、正方形的角都是直角（常畫一個小方框標示）。' },
                { type: 'teach', kicker: '比一比', title: '銳角比 90° 小、鈍角比 90° 大', svg: angle(45, '銳角'), text: '比直角<b>小</b>（不到 90°）的角叫<b>銳角</b>，尖尖的；比直角<b>大</b>（超過 90°）的叫<b>鈍角</b>，鈍鈍的；剛好 180°（拉成一直線）叫<b>平角</b>。' },
                { type: 'teach', kicker: '看鈍角', title: '鈍角長這樣', svg: angle(120, '鈍角'), text: '這個角超過 90°（例如 120°），開得比較開，就是<b>鈍角</b>。' },
                { type: 'quiz', kicker: '看圖判斷', title: '圖中的角是什麼角？', svg: angle(90, ''), options: ['直角', '銳角', '鈍角'], answer: 0, why: '兩線垂直、夾角剛好 90°（有小方框），是直角。', whyWrong: ['', '銳角要比 90° 更小，注意圖上有小方框代表兩線剛好垂直，別把它看成張得比較小的角。', '鈍角要比 90° 更大，但這裡有小方框表示兩線剛好垂直，並沒有張開超過喔。'] },
                { type: 'quiz', kicker: '換你試試', title: '60° 是什麼角？', options: ['銳角', '直角', '鈍角'], answer: 0, why: '60° 比 90° 小，是銳角。', whyWrong: ['', '直角必須剛好是 90°，而 60° 還沒張到那麼大，再比比看哪一個更接近方正的角。', '鈍角要張開超過 90°，可是 60° 其實比直角還小，方向想反了喔。'] },
                { type: 'quiz', kicker: '想一想', title: '120° 是什麼角？', options: ['鈍角', '銳角', '直角'], answer: 0, why: '120° 比 90° 大（但不到 180°），是鈍角。', whyWrong: ['', '銳角要比 90° 更小，而 120° 已經張得比方正的角還開了，方向想反囉。', '直角剛好是 90°，但 120° 已經超過了，再想想它有沒有比方正的角更開。'] }
            ] },
        { id: 'solidvol', name: '體積：底面積×高', emoji: '🧱', color: '#0ea5e9', sub: '柱體與錐體的體積', done: '記得：柱體 ＝ 底面積 × 高；錐體是同底同高柱體的 1/3（× 1/3）。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '柱體體積 ＝ 底面積 × 高', svg: geoAnimCanvas(340, 240, '柱體體積動畫：底面一層層往上疊，每一層都是一個底面，疊到高 h，體積就是底面積乘以高'), mount: function (host) { var A = window.Anim; var h = A && A.solid3D(host, { shape: 'prism', mode: 'fill' }); return function () { if (h)
                        h.stop(); }; }, text: '<b>柱體</b>（像長方體、圓柱）的體積，就是把<b>底面一層層往上疊</b>。每一層都是一個<b>底面</b>，一直疊到<b>高</b>這麼高——所以<b>體積 ＝ 底面積 × 高</b>。' },
                { type: 'teach', kicker: '再看錐體', title: '錐體 ＝ 同底同高柱體的 1/3', svg: geoAnimCanvas(340, 240, '圓錐倒水動畫：用和圓柱同底同高的圓錐裝水，倒三次剛好把圓柱裝滿，所以錐體積是柱的三分之一'), mount: function (host) { var A = window.Anim; var h = A && A.solid3D(host, { shape: 'cone', mode: 'fill' }); return function () { if (h)
                        h.stop(); }; }, text: '<b>錐體</b>（角錐、圓錐）比較尖。拿一個<b>同底同高</b>的錐裝水，倒進同底同高的柱裡——<b>倒三次剛好裝滿</b>！所以<b>錐體積 ＝ 1/3 × 底面積 × 高</b>，是同底同高柱體的 <b>1/3</b>。' },
                { type: 'quiz', kicker: '換你試試', title: '底面積 12、高 5 的柱體，體積是多少？', options: ['60', '17', '20', '120'], answer: 0, why: '柱體體積 ＝ 底面積 × 高 ＝ 12 × 5 ＝ 60。', whyWrong: ['', '12 ＋ 5 ＝ 17，你把底面積和高相加了；體積要用相乘（底面積 × 高），不是相加。', '20 是把它當成錐體（× 1/3）算的；但這題是柱體，不用乘 1/3，體積就是 12 × 5 ＝ 60。', '120 是 60 的兩倍，你可能多乘了一次或把高看成 10；底面積 12 × 高 5 ＝ 60。'] },
                { type: 'quiz', kicker: '想一想', title: '一個圓錐和某個圓柱同底又同高，圓錐的體積是圓柱的幾倍？', options: ['1/3 倍', '3 倍', '一樣大', '1/2 倍'], answer: 0, why: '同底同高時，用錐裝水要倒 3 次才裝滿柱，所以錐 ＝ 柱的 1/3。', whyWrong: ['', '方向相反了：是「3 個錐」才裝滿「1 個柱」，所以錐比較小，是柱的 1/3，不是柱的 3 倍。', '錐比較尖，裝得比同底同高的柱少，不會一樣大；倒水要倒 3 次才裝滿，所以是 1/3。', '不是一半：實際倒水要倒 3 次（不是 2 次）才裝滿柱，所以是 1/3，不是 1/2。'] }
            ] },
        { id: 'solidsurf', name: '表面積：攤平來算', emoji: '📂', color: '#8b5cf6', sub: '展開圖與圓柱側面', done: '記得：表面積 ＝ 攤平後各面相加；圓柱側面是長方形，長 ＝ 底周長 2πr。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '表面積 ＝ 攤平後各面相加', svg: geoAnimCanvas(340, 240, '長方體展開動畫：把立體攤平成展開圖，露出所有的面，表面積就是這些面的面積全部加起來'), mount: function (host) { var A = window.Anim; var h = A && A.solid3D(host, { shape: 'prism', mode: 'unfold' }); return function () { if (h)
                        h.stop(); }; }, text: '<b>表面積</b>是一個立體<b>外表所有面</b>的面積總和。最好的辦法是把它<b>攤成展開圖</b>（像拆開紙盒），把每一個面都攤出來，再<b>把各面的面積加起來</b>。' },
                { type: 'teach', kicker: '看圓柱', title: '圓柱側面攤開是長方形', svg: geoAnimCanvas(340, 240, '圓柱展開動畫：圓柱攤平成上下兩個底圓加一片長方形，長方形的長等於底圓周長 2πr、寬等於高'), mount: function (host) { var A = window.Anim; var h = A && A.solid3D(host, { shape: 'cylinder', mode: 'unfold' }); return function () { if (h)
                        h.stop(); }; }, text: '<b>圓柱</b>攤開後是<b>兩個底圓 ＋ 一片長方形</b>（側面）。這片長方形的<b>長剛好是底圓的周長 2πr</b>、<b>寬是圓柱的高</b>。所以側面積 ＝ <b>2πr × 高</b>，再加上兩個底圓（每個 <b>πr²</b>，共 <b>2πr²</b>）。' },
                { type: 'quiz', kicker: '換你試試', title: '要算一個立體的表面積，最好的做法是？', options: ['把它攤成展開圖，各面的面積相加', '量最長的一條邊', '算出它的體積再開根號', '只算最大的那一面'], answer: 0, why: '表面積是「外表所有面」的總和，攤成展開圖後把每個面的面積加起來最清楚。', whyWrong: ['', '一條邊是長度，不是面積，更不是所有面的總和；表面積要把每個面都算進去。', '體積是「裡面裝得下多少」，和「外表面積」是兩回事，開根號也換不過去。', '表面積要算「全部的面」，只算最大那一面會漏掉其他面。'] },
                { type: 'quiz', kicker: '想一想', title: '圓柱的側面攤開後是什麼形狀？它的「長」等於什麼？', options: ['長方形；長 ＝ 底圓的周長（2πr）', '三角形；長 ＝ 半徑', '圓形；長 ＝ 直徑', '長方形；長 ＝ 圓柱的高'], answer: 0, why: '圓柱側面攤平是長方形，長等於底圓繞一圈的周長 2πr，寬才是圓柱的高。', whyWrong: ['', '側面攤開是平整的長方形，不是三角形；而且它的長是繞底圓一圈的周長，不是半徑。', '圓形是上下兩個「底」，不是側面；側面攤平後會變成長方形。', '形狀對（長方形），但說反了：長是底圓周長 2πr，高只是這個長方形的「寬」。'] }
            ] },
        { id: 'sector', name: '扇形：弧長與面積', emoji: '🍕', color: '#f43f5e', sub: '都看佔圓的 θ/360', done: '記得：扇形佔圓 θ/360；弧長 ＝ 2πr × (θ/360)、面積 ＝ πr² × (θ/360)。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '扇形是圓的一塊「餅」', svg: sectorSteps(), text: '<b>扇形</b>就像切下來的一塊<b>披薩</b>。它佔<b>整個圓</b>的比例，由<b>圓心角 θ</b> 決定：<b>佔整圓 ＝ θ ÷ 360</b>。例如 θ ＝ 90°，就佔整圓的 90/360 ＝ <b>1/4</b>。' },
                { type: 'teach', kicker: '算弧長與面積', title: '弧長、面積都乘同一個比例', svg: sectorFormula(), text: '既然扇形佔整圓 <b>θ/360</b>，那它的<b>弧長</b>就是整圓<b>周長</b>的 θ/360：<b>弧長 ＝ 2πr × (θ/360)</b>；它的<b>面積</b>就是整圓<b>面積</b>的 θ/360：<b>扇形面積 ＝ πr² × (θ/360)</b>。兩個都乘<b>同一個比例</b>！' },
                { type: 'quiz', kicker: '換你試試', title: '半徑 6、圓心角 90° 的扇形，面積是整個圓的幾分之幾？', svg: sectorQuiz90(), options: ['1/4', '1/6', '1/2', '4 倍'], answer: 0, why: '佔整圓 ＝ θ/360 ＝ 90/360 ＝ 1/4。', whyWrong: ['', '你可能拿半徑 6 去當分母（1/6），但佔圓的比例只看角度：90/360 ＝ 1/4，和半徑無關。', '1/2 是半圓（180°）才對；90° 只有半圓的一半，所以是 1/4。', '90° 比整圓小，佔的是「幾分之一」而不是「幾倍」；90/360 ＝ 1/4。'] },
                { type: 'quiz', kicker: '想一想', title: '承上題：半徑 6、圓心角 90° 的扇形，面積等於多少？（用 π 表示）', eq: '扇形面積 ＝ πr² × (θ/360)', svg: sectorQuiz90(), options: ['9π', '36π', '3π', '12π'], answer: 0, why: '整圓面積 ＝ π × 6² ＝ 36π，扇形佔 1/4，所以 36π × 1/4 ＝ 9π。', whyWrong: ['', '36π 是「整個圓」的面積（π × 6²）；扇形只佔 1/4，要再乘 1/4 ＝ 9π。', '3π 可能是只用了半徑或少乘了一次；正確是整圓 36π 的 1/4 ＝ 9π。', '12π 可能是把 1/4 算錯或用成周長；整圓面積 36π 的 1/4 是 9π。'] }
            ] }
    ]
};
