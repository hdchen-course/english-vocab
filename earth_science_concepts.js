/* =====================================================================
 * earth_science_concepts.ts  →  (tsc, tsconfig.legacy.json) →  earth_science_concepts.js
 * 地球科學觀念養成頁的教學資料（window.CONCEPT）＋專用 SVG 概念圖 helper。
 * 原為 earth_science_concepts.html 的 inline <script>；逐檔 TS 遷移抽出成 sibling .js。
 * 載入順序：game_core.js → 本檔 → anim_core.js → concept_engine.js
 *   （本檔提供 window.CONCEPT；mount 於執行期才用 window.Anim，故解析順序無虞）。
 * 行為與原 inline 版等價（型別剝離、頂層函式仍為全域、window.CONCEPT 不變）。
 * 註：本頁同時有一個「本地 static SVG waterCycle()」與引擎場景 window.Anim.waterCycle，
 *     兩者 scope 不同、不衝突；本地 waterCycle() 為既有全域，為行為等價保留原樣。
 * 以 IIFE 包住：讓 helper 函式為檔案區域（避免與其他已遷移頁的同名 helper 如 animCanvas
 *   在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）；helper 只在建 window.CONCEPT 時
 *   同步呼叫，行為與原 inline（全域函式）等價。
 * ===================================================================== */
(function () {
    // ---- 地科專用 SVG 概念圖（文字 currentColor = --ink；結構線 currentColor 主題自適應）----
    // 晝夜：太陽在左，地球半亮半暗（面向太陽=白天）
    function dayNight() {
        var s = '<svg viewBox="0 0 270 150" role="img" aria-label="地球面向太陽的一側是白天，背對的一側是晚上">';
        // 太陽
        s += '<circle cx="34" cy="75" r="22" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>';
        for (var a = 0; a < 8; a++) {
            var r = a * Math.PI / 4, x1 = 34 + 26 * Math.cos(r), y1 = 75 + 26 * Math.sin(r), x2 = 34 + 34 * Math.cos(r), y2 = 75 + 34 * Math.sin(r);
            s += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="#f59e0b" stroke-width="2"/>';
        }
        s += '<text x="34" y="120" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">太陽</text>';
        // 地球：整顆先畫白天色，再用右半（背對太陽）覆蓋夜色
        var ex = 190, ey = 75, er = 42;
        s += '<circle cx="' + ex + '" cy="' + ey + '" r="' + er + '" fill="#bae6fd" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/>';
        s += '<path d="M' + ex + ' ' + (ey - er) + ' A' + er + ' ' + er + ' 0 0 1 ' + ex + ' ' + (ey + er) + ' Z" fill="rgba(15,23,42,0.86)"/>';
        s += '<text x="' + (ex - 20) + '" y="' + (ey + 4) + '" text-anchor="middle" font-size="12" font-weight="800" fill="#0f172a">白天</text>';
        s += '<text x="' + (ex + 21) + '" y="' + (ey + 4) + '" text-anchor="middle" font-size="12" font-weight="800" fill="#e2e8f0">晚上</text>';
        // 自轉箭頭
        s += '<path d="M' + (ex - 14) + ' ' + (ey - er - 8) + ' A 18 10 0 1 1 ' + (ex + 16) + ' ' + (ey - er - 8) + '" fill="none" stroke="#0369a1" stroke-width="2.5"/><polygon points="' + (ex + 16) + ',' + (ey - er - 8) + ' ' + (ex + 9) + ',' + (ey - er - 13) + ' ' + (ex + 11) + ',' + (ey - er - 2) + '" fill="#0369a1"/>';
        s += '<text x="' + ex + '" y="' + (ey + er + 22) + '" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">地球自轉一圈 = 一天</text>';
        return s + '</svg>';
    }
    // 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
    // 尊重既有 .cn-svg 版面；canvas 給固定邏輯尺寸（含 CSS 尺寸，供 DPR 縮放讀 clientWidth）。
    function animCanvas(w, h, label) {
        return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
            'style="max-width:' + w + 'px" ' +
            'role="img" aria-label="' + label + '"></canvas>';
    }
    // 水循環：太陽曬海→蒸發上升→凝結成雲→降水→回到海
    function waterCycle() {
        var s = '<svg viewBox="0 0 280 170" role="img" aria-label="水循環：海水蒸發上升、凝結成雲、下雨降回地面流回海">';
        s += '<text x="30" y="34" text-anchor="middle" font-size="24">☀️</text>';
        s += '<text x="212" y="40" text-anchor="middle" font-size="30">☁️</text>';
        // 海
        s += '<rect x="10" y="128" width="260" height="34" rx="6" fill="#0369a1" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.5"/>';
        s += '<text x="55" y="150" text-anchor="middle" font-size="12" font-weight="800" fill="#f0f9ff">海洋</text>';
        // 蒸發（左，往上升進雲裡）——箭頭指向雲，讓「海→雲→雨→海」循環連得起來
        s += '<line x1="66" y1="126" x2="183" y2="54" stroke="#0891b2" stroke-width="2.5"/><polygon points="183,54 173,58 178,66" fill="#0891b2"/>';
        s += '<text x="70" y="104" font-size="11" font-weight="800" fill="currentColor">蒸發 ↑</text>';
        // 降水（右，往下）
        s += '<line x1="212" y1="58" x2="212" y2="124" stroke="#2563eb" stroke-width="2.5"/><polygon points="212,124 206,114 218,114" fill="#2563eb"/>';
        s += '<text x="238" y="96" font-size="11" font-weight="800" fill="currentColor">降水 ↓</text>';
        s += '<text x="140" y="20" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">水一直循環，用不完</text>';
        return s + '</svg>';
    }
    window.CONCEPT = {
        progKey: 'earth_science_concepts_v1', practiceHref: 'earth_science.html',
        lessons: [
            { id: 'daynight', name: '白天和晚上', emoji: '🌗', color: '#0369a1', sub: '地球自轉造成晝夜', done: '記得：地球自己轉（自轉）一圈是一天；面向太陽的那面是白天，背對的那面是晚上。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '地球自己在轉', svg: dayNight(), text: '地球像陀螺一樣<b>自己轉</b>，叫<b>自轉</b>。面向太陽的那一面照到光，是<b>白天</b>；背對太陽的那一面照不到，是<b>晚上</b>。' },
                    { type: 'teach', kicker: '多久一圈', title: '自轉一圈 = 一天', svg: dayNight(), text: '地球自轉<b>一圈大約 24 小時</b>，也就是<b>一天</b>。所以白天和晚上會<b>輪流出現</b>。（不是太陽繞著地球跑，是地球自己在轉。）' },
                    { type: 'quiz', kicker: '換你試試', title: '為什麼會有白天和晚上？', options: ['地球自轉，面向太陽是白天、背對是晚上', '太陽自己會開燈和關燈', '月亮把太陽遮住', '地球離太陽忽遠忽近'], answer: 0, why: '地球自轉時，面向太陽的一面是白天、背對的一面是晚上，輪流交替。' },
                    { type: 'quiz', kicker: '想一想', title: '地球自轉一圈大約是多久？', options: ['一天（約 24 小時）', '一年', '一個月', '一小時'], answer: 0, why: '地球自轉一圈約 24 小時，就是一天。' }
                ] },
            { id: 'year', name: '一年與四季', emoji: '🍂', color: '#16a34a', sub: '地球繞太陽公轉', done: '記得：地球繞太陽一圈（公轉）約一年；四季是因為地軸「斜斜的」，不是因為離太陽比較遠或近。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '地球繞著太陽走', svg: animCanvas(300, 180, '地球沿軌道繞太陽公轉一圈約一年'), mount: function (host) { return window.Anim && window.Anim.earthRevolution(host); }, text: '地球一邊自轉，還一邊<b>繞著太陽轉一大圈</b>，這叫<b>公轉</b>。繞完一圈大約是<b>一年</b>（365 天）。看看地球沿著軌道走，上面的讀數就是走了幾天、第幾個月。' },
                    { type: 'quiz', kicker: '換你試試', title: '地球繞太陽公轉一圈大約是多久？', options: ['一年', '一天', '一個月', '一星期'], answer: 0, why: '地球繞太陽公轉一圈約 365 天，就是一年。' },
                    { type: 'teach', kicker: '為什麼有四季', title: '因為地球「斜斜的」轉', svg: animCanvas(330, 182, '地球繞太陽時地軸方向固定，北半球有時朝向太陽是夏天、半年後斜離太陽是冬天；右邊示意同樣多的陽光，直射時集中變熱、斜射時攤開變涼；四個位置離太陽一樣遠'), mount: function (host) { return window.Anim && window.Anim.earthSeasons(host); }, text: '地球<b>斜著</b>轉、地軸<b>一直斜向同一邊</b>（紅線）。所以同一個地方有時<b>朝太陽、陽光直射</b>（集中→熱，夏天），半年後<b>斜離太陽、陽光斜射</b>（攤開→涼，冬天）。右圖就是這個差別。<b>四個位置離太陽一樣遠</b>——四季看<b>角度</b>不是距離！' },
                    { type: 'quiz', kicker: '想一想', title: '為什麼會有春夏秋冬四季？', options: ['因為地軸是斜的，陽光照射的角度不同', '因為地球離太陽忽遠忽近', '因為太陽會變大變小', '因為月亮擋住太陽'], answer: 0, why: '四季是地軸傾斜、陽光照射角度不同造成的，不是因為地球離太陽的遠近。' }
                ] },
            { id: 'water', name: '水循環', emoji: '💧', color: '#0891b2', sub: '水在天地間繞圈圈', done: '記得：太陽曬海→水蒸發上升→高空變冷凝結成雲→下雨（降水）→流回海洋，一直循環。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '水會「跑上天」再回來', svg: animCanvas(320, 188, '水循環：太陽曬熱海水，水蒸氣往上升（蒸發），升到高空變冷凝結成雲，水滴變大落下成雨（降水），雨水流進河川流回海洋，不斷循環'), mount: function (host) { return window.Anim && window.Anim.waterCycle(host); }, text: '太陽曬熱海水和地面的水，水就變成看不見的<b>水蒸氣往上升</b>（<b>蒸發</b>）。升到高空變冷，<b>凝結</b>成小水滴，聚成<b>雲</b>。' },
                    { type: 'teach', kicker: '再回到地面', title: '變成雨再回到海', svg: animCanvas(320, 188, '水循環：雲裡的小水滴越聚越大，掉下來變成雨（降水），雨水流進河川、流回海洋，然後又被太陽曬蒸發，一直循環'), mount: function (host) { return window.Anim && window.Anim.waterCycle(host); }, text: '雲裡的水滴越聚越大，就掉下來變成<b>雨或雪</b>（<b>降水</b>），流進河流、回到<b>海洋</b>。然後又被曬蒸發……<b>一直循環</b>，所以地球的水用不完。' },
                    { type: 'quiz', kicker: '換你試試', title: '海水被太陽曬，變成水蒸氣往上升，這叫什麼？', options: ['蒸發', '降水', '結冰', '凝結成雲'], answer: 0, why: '水受熱變成水蒸氣往上升，叫做蒸發。' },
                    { type: 'quiz', kicker: '想一想', title: '水循環大致的順序是？', options: ['蒸發 → 凝結成雲 → 降水 → 流回海洋', '降水 → 蒸發 → 結冰 → 融化', '下雨 → 太陽消失 → 海水變少', '雲 → 太陽 → 星星 → 月亮'], answer: 0, why: '水從海洋蒸發上升、凝結成雲、降水落下、再流回海洋，週而復始。' }
                ] },
            { id: 'moon', name: '月亮的變化', emoji: '🌙', color: '#f59e0b', sub: '月相為什麼會變', done: '記得：月亮自己不發光，是反射太陽光；它繞地球一圈約一個月，我們看到被照亮的部分不同，就有了新月、滿月等變化。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '月亮自己不會發光', svg: animCanvas(340, 184, '月球繞地球，太陽從右側照來；左圖俯視太陽照亮月球哪一半，右圖是地球上看到的形狀'), mount: function (host) { return window.Anim && window.Anim.moonPhases(host); }, text: '月亮<b>自己不會發光</b>，我們看到的月光其實是它<b>反射太陽的光</b>。左邊俯視圖的太陽一直從右邊照來、月球繞著地球轉，右邊就是我們在地球上看到的樣子——<b>被照亮的部分多少不同</b>，形狀就跟著變。' },
                    { type: 'teach', kicker: '一個月一循環', title: '新月 → 滿月 → 又回新月', svg: animCanvas(340, 184, '月相一輪：新月、上弦月、滿月、下弦月，再回到新月'), mount: function (host) { return window.Anim && window.Anim.moonPhases(host); }, text: '月亮繞地球一圈大約<b>一個月</b>。形狀會規律變化：看不到的<b>新月</b> → 半邊亮的<b>上弦月</b> → 圓圓的<b>滿月</b> → 半邊亮的<b>下弦月</b>，再回到新月。（這是因為我們看到<b>被太陽照亮</b>的部分多少不同，<b>不是</b>地球的影子擋住月亮喔——那是「月食」，不一樣。）' },
                    { type: 'quiz', kicker: '換你試試', title: '月亮的光是哪裡來的？', options: ['反射太陽的光', '月亮自己發光', '星星照給它的', '地球照給它的'], answer: 0, why: '月亮自己不發光，我們看到的是它反射太陽的光。' },
                    { type: 'quiz', kicker: '想一想', title: '月亮有一部分看起來暗暗的，是為什麼？', options: ['那一部分正好照不到太陽光，我們只看到被照亮的一邊', '被地球的影子擋住了', '月亮自己把燈關掉', '被雲遮住了'], answer: 0, whyWrong: { 1: '被地球影子擋住是「月食」，很少發生、不是每天的月相喔。' }, why: '太陽只照亮月球朝太陽的一半；我們從地球看，看到被照亮的部分多少不同，就有了圓缺。（被地球影子擋住那是「月食」，不一樣。）' },
                    { type: 'quiz', kicker: '想一想', title: '月亮繞地球一圈、月相變化一輪大約是多久？', options: ['大約一個月', '大約一天', '大約一年', '大約一小時'], answer: 0, why: '月亮繞地球一圈約一個月，所以月相大約一個月變化一輪。' }
                ] }
        ]
    };
})();
