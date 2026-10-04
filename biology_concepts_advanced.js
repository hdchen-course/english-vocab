/* =====================================================================
 * biology_concepts_advanced.ts  →  (tsc, tsconfig.legacy.json) →  biology_concepts_advanced.js
 * 「生物觀念養成・進階（國中）」teach-first 動畫觀念頁。補齊 biology.html（進階關：
 *   胞器、細胞分裂、遺傳、演化、呼吸與碳循環）的「先學觀念」中學鷹架缺口。
 *   資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）＋ anim_core.js（window.Anim）。
 *   動畫課重用既有場景 window.Anim.photosynthesis（光合對照；不新增場景、不改 anim_core）；
 *   碳循環課先用「本頁 stepped SVG」（共用 carbonCycle 場景由 tier1 sustainability 日後建立，屆時可一行替換）；
 *   其餘 teach 步驟一律 stepped / static SVG（第 2、3 級 VIZ），零 text-only。
 *   以 IIFE 包住讓 SVG helper 為檔案區域（避免與其他已遷移頁同名頂層 helper 在 tsconfig.legacy
 *   共用全域型別檢查時 TS2393 衝突）。純本地進度（progKey），不餵主 XP。practiceHref＝biology.html。
 * ===================================================================== */
(function () {
    // ---- 共用小工具 -----------------------------------------------------
    // 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
    function animCanvas(w, h, label) {
        return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
            'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
    }
    function svg(vb, inner, label) {
        return '<svg viewBox="0 0 ' + vb + '" role="img" aria-label="' + label + '">' + inner + '</svg>';
    }
    // 文字（預設置中、currentColor＝--ink）。
    function tx(x, y, s, size, color, anchor, weight) {
        return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') +
            '" font-size="' + (size || 11.5) + '" font-weight="' + (weight || 800) +
            '" fill="' + (color || 'currentColor') + '">' + s + '</text>';
    }
    // 右／左／下／上 箭頭。
    function aR(x, y, len, color, sw) { var x2 = x + len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x2 + ',' + y + ' ' + (x2 - 9) + ',' + (y - 6) + ' ' + (x2 - 9) + ',' + (y + 6) + '" fill="' + color + '"/>'; }
    function aL(x, y, len, color, sw) { var x2 = x - len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x2 + ',' + y + ' ' + (x2 + 9) + ',' + (y - 6) + ' ' + (x2 + 9) + ',' + (y + 6) + '" fill="' + color + '"/>'; }
    function aD(x, y, len, color, sw) { var y2 = y + len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x + ',' + y2 + ' ' + (x - 6) + ',' + (y2 - 9) + ' ' + (x + 6) + ',' + (y2 - 9) + '" fill="' + color + '"/>'; }
    function aU(x, y, len, color, sw) { var y2 = y - len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x + ',' + y2 + ' ' + (x - 6) + ',' + (y2 + 9) + ' ' + (x + 6) + ',' + (y2 + 9) + '" fill="' + color + '"/>'; }
    // 小色點（圖例用）。
    function dot(x, y, color) { return '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + color + '" fill-opacity="0.9"/>'; }
    // ---- 色盤（亮暗雙主題皆清楚；結構文字用 currentColor＝--ink）----
    var C_CELL = '#0891b2'; // 細胞膜／細胞 cyan
    var C_NUC = '#7c3aed'; // 細胞核 purple
    var C_MITO = '#e11d48'; // 粒線體 red（發電廠）
    var C_CHL = '#16a34a'; // 葉綠體 green（廚房）
    var C_VAC = '#0ea5e9'; // 大液泡 blue
    var C_WALL = '#b45309'; // 細胞壁 brown
    var C_HL = '#f59e0b'; // 高亮 amber
    var C_MLD = '#64748b'; // 中性 slate
    var C_GRN = '#16a34a'; // 強調綠
    var C_DNA1 = '#2563eb'; // 來自爸 blue
    var C_DNA2 = '#db2777'; // 來自媽 pink
    var C_BIRD = '#334155'; // 捕食者 dark
    var C_AIR = '#64748b'; // 大氣 CO₂
    var C_RESP = '#e11d48'; // 呼吸（放碳）red
    var C_PHOTO = '#16a34a'; // 光合（吸碳）green
    var C_BURN = '#ea580c'; // 燃燒（放碳）orange
    var C_DEC = '#b45309'; // 分解（放碳）brown
    /* =================== 課1：細胞與胞器 =================== */
    // 生物體放大 → 一個個細胞。
    function organismToCells() {
        var inner = '';
        inner += tx(150, 15, '把生物體放大，看到的是一個個細胞', 11);
        inner += '<rect x="22" y="34" width="72" height="72" rx="14" fill="' + C_CELL + '" fill-opacity="0.1" stroke="' + C_CELL + '" stroke-width="2"/>';
        inner += '<text x="58" y="82" text-anchor="middle" font-size="36">🧒</text>';
        inner += tx(58, 124, '生物體', 10.5);
        inner += aR(102, 70, 40, C_MLD, 3) + tx(122, 58, '放大', 9.5, C_MLD);
        var gx = 154, gy = 38;
        for (var r = 0; r < 3; r++)
            for (var c = 0; c < 4; c++) {
                inner += '<rect x="' + (gx + c * 33) + '" y="' + (gy + r * 23) + '" width="29" height="19" rx="8" fill="' + C_CELL + '" fill-opacity="0.18" stroke="' + C_CELL + '" stroke-width="1.4"/>';
                inner += '<circle cx="' + (gx + c * 33 + 14.5) + '" cy="' + (gy + r * 23 + 9.5) + '" r="3.4" fill="' + C_NUC + '"/>';
            }
        inner += tx(216, 124, '許多細胞（生命的基本單位）', 9.5);
        return svg('300 136', inner, '把一個生物體放大，看到的是許多細胞排在一起，每個細胞中間有細胞核，細胞是生命的基本單位');
    }
    // 動物細胞 vs 植物細胞（植物多了細胞壁、葉綠體、大液泡）。
    function cellCompare() {
        var inner = '';
        inner += tx(150, 14, '植物細胞比動物細胞多了三樣', 11);
        // 動物細胞
        inner += tx(72, 32, '動物細胞', 10.5, C_CELL);
        inner += '<ellipse cx="72" cy="86" rx="54" ry="44" fill="' + C_CELL + '" fill-opacity="0.1" stroke="' + C_CELL + '" stroke-width="2.6"/>';
        inner += '<circle cx="66" cy="84" r="15" fill="' + C_NUC + '" fill-opacity="0.3" stroke="' + C_NUC + '" stroke-width="1.6"/>' + tx(66, 88, '核', 10);
        inner += '<ellipse cx="100" cy="104" rx="11" ry="6.5" fill="' + C_MITO + '" fill-opacity="0.35" stroke="' + C_MITO + '" stroke-width="1.4"/>';
        // 植物細胞
        inner += tx(222, 32, '植物細胞', 10.5, C_CELL);
        inner += '<rect x="166" y="44" width="112" height="86" rx="8" fill="none" stroke="' + C_WALL + '" stroke-width="4.5"/>'; // 細胞壁（植物才有）
        inner += '<rect x="172" y="50" width="100" height="74" rx="5" fill="' + C_CELL + '" fill-opacity="0.08" stroke="' + C_CELL + '" stroke-width="1.8"/>'; // 細胞膜
        inner += '<rect x="196" y="56" width="58" height="40" rx="10" fill="' + C_VAC + '" fill-opacity="0.16" stroke="' + C_VAC + '" stroke-width="1.8"/>'; // 大液泡（植物才有）
        inner += '<circle cx="188" cy="106" r="12" fill="' + C_NUC + '" fill-opacity="0.3" stroke="' + C_NUC + '" stroke-width="1.5"/>' + tx(188, 110, '核', 9);
        inner += '<ellipse cx="224" cy="112" rx="12" ry="6.5" fill="' + C_CHL + '" fill-opacity="0.4" stroke="' + C_CHL + '" stroke-width="1.5"/>'; // 葉綠體（植物才有）
        inner += '<ellipse cx="250" cy="112" rx="12" ry="6.5" fill="' + C_CHL + '" fill-opacity="0.4" stroke="' + C_CHL + '" stroke-width="1.5"/>';
        inner += '<ellipse cx="256" cy="62" rx="9" ry="5.5" fill="' + C_MITO + '" fill-opacity="0.35" stroke="' + C_MITO + '" stroke-width="1.3"/>'; // 粒線體（兩者都有）
        // 圖例
        inner += dot(30, 150, C_WALL) + tx(40, 153, '細胞壁', 9, 'currentColor', 'start');
        inner += dot(96, 150, C_CHL) + tx(106, 153, '葉綠體', 9, 'currentColor', 'start');
        inner += dot(166, 150, C_VAC) + tx(176, 153, '大液泡', 9, 'currentColor', 'start');
        inner += tx(232, 153, '←植物才有', 9, C_HL, 'start');
        return svg('300 162', inner, '動物細胞是圓的，有細胞核、細胞膜、粒線體；植物細胞多了外層的細胞壁、綠色的葉綠體和大液泡，核、膜、粒線體兩者都有');
    }
    // 主要胞器的分工。
    function organelleRoles() {
        var inner = '';
        inner += tx(150, 14, '細胞裡的胞器各有分工', 11);
        // 細胞（左）
        inner += '<ellipse cx="76" cy="90" rx="62" ry="54" fill="' + C_CELL + '" fill-opacity="0.08" stroke="' + C_CELL + '" stroke-width="2.4"/>';
        inner += '<circle cx="66" cy="80" r="15" fill="' + C_NUC + '" fill-opacity="0.3" stroke="' + C_NUC + '" stroke-width="1.6"/>';
        inner += '<ellipse cx="96" cy="110" rx="11" ry="6.5" fill="' + C_MITO + '" fill-opacity="0.35" stroke="' + C_MITO + '" stroke-width="1.5"/>';
        inner += '<ellipse cx="52" cy="116" rx="12" ry="6.5" fill="' + C_CHL + '" fill-opacity="0.4" stroke="' + C_CHL + '" stroke-width="1.5"/>';
        // 說明（右）
        var rows = [
            [C_NUC, '細胞核', '指揮中心（存放 DNA）'],
            [C_MITO, '粒線體', '發電廠（呼吸作用產能）'],
            [C_CHL, '葉綠體', '廚房（光合作用，植物才有）'],
            [C_CELL, '細胞膜', '控制進出的門']
        ];
        rows.forEach(function (r, i) {
            var y = 46 + i * 26;
            inner += dot(154, y - 3, r[0]);
            inner += tx(166, y, r[1], 11, 'currentColor', 'start');
            inner += tx(166, y + 13, r[2], 9.5, C_MLD, 'start');
        });
        return svg('300 160', inner, '一個細胞裡：細胞核是指揮中心存放DNA、粒線體是發電廠進行呼吸作用產能、葉綠體是廚房進行光合作用是植物才有、細胞膜是控制進出的門');
    }
    /* =================== 課2：細胞分裂與生長 =================== */
    // 長大＝細胞變多（✓），不是變大（✗）。
    function growByDivision() {
        var inner = '';
        inner += tx(150, 14, '長大是細胞「變多」，不是「變大」', 11);
        // 左：變多 ✓
        inner += tx(74, 34, '細胞變多 ✓', 10.5, C_GRN);
        for (var i = 0; i < 2; i++)
            for (var j = 0; j < 2; j++)
                inner += '<circle cx="' + (34 + j * 16) + '" cy="' + (56 + i * 16) + '" r="6.5" fill="' + C_CELL + '" fill-opacity="0.3" stroke="' + C_CELL + '" stroke-width="1.4"/>';
        inner += aR(74, 64, 20, C_GRN, 3);
        for (var a = 0; a < 3; a++)
            for (var b = 0; b < 4; b++)
                inner += '<circle cx="' + (104 + b * 15) + '" cy="' + (48 + a * 15) + '" r="6" fill="' + C_CELL + '" fill-opacity="0.3" stroke="' + C_CELL + '" stroke-width="1.3"/>';
        // 右：變大 ✗
        inner += tx(226, 34, '細胞變大 ✗', 10.5, C_RESP);
        inner += '<circle cx="186" cy="64" r="7" fill="' + C_CELL + '" fill-opacity="0.3" stroke="' + C_CELL + '" stroke-width="1.4"/>';
        inner += aR(200, 64, 18, C_MLD, 3);
        inner += '<circle cx="248" cy="64" r="22" fill="' + C_CELL + '" fill-opacity="0.2" stroke="' + C_RESP + '" stroke-width="2" stroke-dasharray="4 3"/>';
        inner += '<line x1="232" y1="48" x2="264" y2="80" stroke="' + C_RESP + '" stroke-width="2.6"/>';
        inner += tx(150, 104, '身體長大，是細胞一直分裂、數目變多', 10);
        return svg('300 116', inner, '長大是細胞分裂讓數目變多（打勾），不是每個細胞變超大（打叉）');
    }
    // 有絲分裂三步：複製 DNA → 平分 → 兩個相同子細胞。
    function mitosisSteps() {
        var inner = '';
        inner += tx(150, 14, '先複製 DNA，再平均分成兩個相同的細胞', 10.5);
        // 染色體小工具（兩種顏色，代表兩條）
        function chr(cx, cy, col) { return '<rect x="' + (cx - 2.5) + '" y="' + (cy - 9) + '" width="5" height="18" rx="2.5" fill="' + col + '"/>'; }
        // Stage 1：1 個細胞，2 條染色體
        inner += '<circle cx="48" cy="74" r="26" fill="' + C_CELL + '" fill-opacity="0.1" stroke="' + C_CELL + '" stroke-width="2"/>';
        inner += chr(42, 74, C_DNA1) + chr(54, 74, C_DNA2);
        inner += tx(48, 116, '1 個細胞', 10) + tx(48, 130, '(2 條染色體)', 8.5, C_MLD);
        inner += aR(80, 74, 24, C_MLD, 3) + tx(92, 62, '複製', 9, C_MLD);
        // Stage 2：複製後 4 條
        inner += '<circle cx="150" cy="74" r="28" fill="' + C_CELL + '" fill-opacity="0.1" stroke="' + C_CELL + '" stroke-width="2"/>';
        inner += chr(138, 74, C_DNA1) + chr(146, 74, C_DNA1) + chr(154, 74, C_DNA2) + chr(162, 74, C_DNA2);
        inner += tx(150, 116, '複製 DNA', 10) + tx(150, 130, '(變 4 條)', 8.5, C_MLD);
        inner += aR(184, 74, 24, C_MLD, 3) + tx(196, 62, '平分', 9, C_MLD);
        // Stage 3：分成兩個相同
        inner += '<circle cx="238" cy="54" r="20" fill="' + C_CELL + '" fill-opacity="0.1" stroke="' + C_GRN + '" stroke-width="2"/>';
        inner += chr(233, 54, C_DNA1) + chr(243, 54, C_DNA2);
        inner += '<circle cx="238" cy="98" r="20" fill="' + C_CELL + '" fill-opacity="0.1" stroke="' + C_GRN + '" stroke-width="2"/>';
        inner += chr(233, 98, C_DNA1) + chr(243, 98, C_DNA2);
        inner += tx(238, 130, '2 個相同細胞', 9.5, C_GRN);
        return svg('300 140', inner, '一個細胞先把兩條染色體複製成四條，再平均分成兩個，得到兩個染色體完全相同的子細胞');
    }
    // 細胞分裂在生活裡：傷口癒合、長高。
    function divisionLife() {
        var inner = '';
        inner += tx(150, 14, '傷口癒合、長高，都靠細胞分裂', 11);
        var items = [[62, '🩹', '傷口癒合'], [150, '📏', '長高'], [238, '💅', '指甲變長']];
        items.forEach(function (it) {
            inner += '<circle cx="' + it[0] + '" cy="58" r="26" fill="' + C_GRN + '" fill-opacity="0.1" stroke="' + C_GRN + '" stroke-width="1.6"/>';
            inner += '<text x="' + it[0] + '" y="66" text-anchor="middle" font-size="26">' + it[1] + '</text>';
            inner += tx(it[0], 98, it[2], 10.5);
        });
        inner += tx(150, 118, '身體隨時都在用細胞分裂補充、修復', 10);
        return svg('300 128', inner, '傷口癒合、長高、指甲變長，都是靠細胞分裂產生新細胞');
    }
    /* =================== 課3：遺傳 =================== */
    // 細胞 → 核 → 染色體 → DNA → 基因（一層層放大）。
    function geneNesting() {
        var inner = '';
        inner += tx(150, 14, '基因藏在哪裡？一層層放大來看', 11);
        var cols = [[40, '細胞', C_CELL], [112, '細胞核', C_NUC], [186, '染色體', C_DNA2]];
        cols.forEach(function (c, i) {
            inner += '<circle cx="' + c[0] + '" cy="62" r="22" fill="' + c[2] + '" fill-opacity="0.14" stroke="' + c[2] + '" stroke-width="2"/>';
            if (i === 2) { // 染色體畫成 X
                inner += '<line x1="' + (c[0] - 8) + '" y1="52" x2="' + (c[0] + 8) + '" y2="72" stroke="' + c[2] + '" stroke-width="4" stroke-linecap="round"/>';
                inner += '<line x1="' + (c[0] + 8) + '" y1="52" x2="' + (c[0] - 8) + '" y2="72" stroke="' + c[2] + '" stroke-width="4" stroke-linecap="round"/>';
            }
            inner += tx(c[0], 100, c[1], 9.5);
            if (i < 2)
                inner += aR(c[0] + 24, 62, 20, C_MLD, 2.5);
        });
        inner += aR(210, 62, 20, C_MLD, 2.5);
        // DNA（雙螺旋梯）＋高亮一段＝基因
        inner += '<rect x="236" y="36" width="52" height="52" rx="8" fill="none" stroke="' + C_MLD + '" stroke-width="1.2" stroke-dasharray="3 2"/>';
        for (var k = 0; k < 5; k++) {
            var yy = 42 + k * 10;
            var col = (k === 2) ? C_HL : C_GRN;
            inner += '<line x1="248" y1="' + yy + '" x2="276" y2="' + yy + '" stroke="' + col + '" stroke-width="' + (k === 2 ? 4 : 2.4) + '"/>';
        }
        inner += '<line x1="248" y1="42" x2="248" y2="82" stroke="' + C_GRN + '" stroke-width="2"/>';
        inner += '<line x1="276" y1="42" x2="276" y2="82" stroke="' + C_GRN + '" stroke-width="2"/>';
        inner += tx(262, 100, 'DNA', 9.5);
        inner += tx(262, 114, '黃色＝基因', 8.5, C_HL);
        inner += tx(150, 128, 'DNA 上一小段遺傳訊息＝基因', 9.5);
        return svg('300 136', inner, '一層層放大：細胞裡有細胞核，核裡有染色體，染色體是由DNA組成，DNA上帶有遺傳訊息的一小段就是基因');
    }
    // 小孩一半基因來自爸、一半來自媽。
    function halfFromEach() {
        var inner = '';
        inner += tx(150, 14, '小孩的基因，一半來自爸爸、一半來自媽媽', 10.5);
        // 爸
        inner += '<text x="56" y="48" text-anchor="middle" font-size="26">👨</text>' + tx(56, 66, '爸爸', 10, C_DNA1);
        inner += '<rect x="40" y="72" width="32" height="14" rx="4" fill="' + C_DNA1 + '" fill-opacity="0.3" stroke="' + C_DNA1 + '" stroke-width="1.4"/>' + tx(56, 83, '一半基因', 7.5, C_DNA1);
        // 媽
        inner += '<text x="244" y="48" text-anchor="middle" font-size="26">👩</text>' + tx(244, 66, '媽媽', 10, C_DNA2);
        inner += '<rect x="228" y="72" width="32" height="14" rx="4" fill="' + C_DNA2 + '" fill-opacity="0.3" stroke="' + C_DNA2 + '" stroke-width="1.4"/>' + tx(244, 83, '一半基因', 7.5, C_DNA2);
        // 箭頭往小孩
        inner += '<line x1="62" y1="92" x2="128" y2="118" stroke="' + C_DNA1 + '" stroke-width="3"/><polygon points="128,118 118,114 121,124" fill="' + C_DNA1 + '"/>';
        inner += '<line x1="238" y1="92" x2="172" y2="118" stroke="' + C_DNA2 + '" stroke-width="3"/><polygon points="172,118 179,124 182,114" fill="' + C_DNA2 + '"/>';
        // 小孩
        inner += '<text x="150" y="128" text-anchor="middle" font-size="28">🧒</text>' + tx(150, 146, '小孩', 10);
        inner += '<rect x="128" y="150" width="44" height="14" rx="4" fill="' + C_CELL + '" fill-opacity="0.14" stroke="' + C_MLD + '" stroke-width="1.2"/>';
        inner += '<rect x="128" y="150" width="22" height="14" rx="4" fill="' + C_DNA1 + '" fill-opacity="0.3"/>';
        inner += '<rect x="150" y="150" width="22" height="14" rx="4" fill="' + C_DNA2 + '" fill-opacity="0.3"/>';
        inner += tx(150, 161, '爸一半＋媽一半', 7.5);
        return svg('300 170', inner, '爸爸給一半基因、媽媽給一半基因，合起來組成小孩的基因，所以小孩會像爸爸也像媽媽');
    }
    // 顯性 / 隱性（概念層，不做龐氏方格計算）。
    function dominantRecessive() {
        var inner = '';
        inner += tx(150, 14, '顯性只要有一個就表現；兩個都隱性才表現隱性', 10);
        function tile(x, y, letter, col) { return '<rect x="' + x + '" y="' + y + '" width="22" height="22" rx="5" fill="' + col + '" fill-opacity="0.25" stroke="' + col + '" stroke-width="1.6"/><text x="' + (x + 11) + '" y="' + (y + 16) + '" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">' + letter + '</text>'; }
        function eye(cx, cy, brown) { return '<circle cx="' + cx + '" cy="' + cy + '" r="12" fill="' + (brown ? C_WALL : C_VAC) + '" fill-opacity="0.3" stroke="' + (brown ? C_WALL : C_VAC) + '" stroke-width="1.8"/><circle cx="' + cx + '" cy="' + cy + '" r="4" fill="currentColor"/>'; }
        var rows = [
            [40, 'B', 'B', true, '棕眼'],
            [78, 'B', 'b', true, '棕眼'],
            [116, 'b', 'b', false, '藍眼']
        ];
        rows.forEach(function (r, i) {
            var y = r[0];
            inner += tile(30, y, r[1], r[1] === 'B' ? C_GRN : C_MLD) + tx(63, y + 16, '＋', 13) + tile(74, y, r[2], r[2] === 'B' ? C_GRN : C_MLD);
            inner += aR(104, y + 11, 24, C_MLD, 2.5);
            inner += eye(146, y + 11, r[3]) + tx(176, y + 15, r[4], 11, 'currentColor', 'start');
            if (i === 1)
                inner += tx(214, y + 15, '← 有一個 B 就是棕眼', 8.5, C_HL, 'start');
        });
        inner += tx(150, 148, 'B＝顯性（棕眼）、b＝隱性（藍眼）', 9.5, C_MLD);
        return svg('300 158', inner, '顯性基因大寫B是棕眼、隱性基因小寫b是藍眼。BB是棕眼、Bb也是棕眼只要有一個顯性就表現、bb兩個都隱性才是藍眼');
    }
    /* =================== 課4：演化與天擇 =================== */
    // 蛾小工具（深淺）。
    // 外框與身體線用 currentColor（隨主題：淺色模式深、深色模式淺），避免最深色的蛾（#1e293b）在深色背景上看不見。
    function moth(cx, cy, shade, r) { r = r || 9; return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r + '" ry="' + (r * 0.62) + '" fill="' + shade + '" stroke="currentColor" stroke-opacity="0.65" stroke-width="0.9"/><line x1="' + cx + '" y1="' + (cy - r * 0.62) + '" x2="' + cx + '" y2="' + (cy + r * 0.62) + '" stroke="currentColor" stroke-opacity="0.65" stroke-width="0.9"/>'; }
    // 同種生物有「變異」。
    function variation() {
        var inner = '';
        inner += tx(150, 14, '同一種生物，每個個體長得略有不同＝變異', 10.5);
        var shades = ['#f1f5f9', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#1e293b'];
        shades.forEach(function (sh, i) {
            inner += moth(42 + i * 43, 60, sh, 13);
            inner += tx(42 + i * 43, 90, i === 0 ? '最淺' : (i === 5 ? '最深' : ''), 8.5, C_MLD);
        });
        inner += tx(150, 112, '同樣是蛾，有的顏色淺、有的顏色深', 10);
        return svg('300 124', inner, '同一種蛾，身體顏色從最淺到最深都有，每隻個體略有不同，這就是變異');
    }
    // 環境篩選：深色樹幹上，淺色蛾易被鳥吃。
    function selection() {
        var inner = '';
        inner += tx(150, 14, '深色樹幹上，淺色蛾容易被鳥發現吃掉', 10);
        // 深色樹幹背景
        inner += '<rect x="20" y="26" width="260" height="78" rx="10" fill="#475569" fill-opacity="0.55" stroke="' + C_MLD + '" stroke-width="1.4"/>';
        inner += tx(44, 40, '深色樹幹', 8.5, '#e2e8f0', 'start');
        // 深色蛾（融入、安全）
        inner += moth(70, 70, '#334155', 12) + tx(70, 96, '深色：藏得住 ✓', 8.5, C_GRN);
        inner += moth(120, 86, '#3f4a5c', 11);
        // 淺色蛾（顯眼、被吃）
        inner += moth(190, 62, '#f1f5f9', 12);
        inner += '<line x1="180" y1="52" x2="200" y2="72" stroke="' + C_RESP + '" stroke-width="2.4"/><line x1="200" y1="52" x2="180" y2="72" stroke="' + C_RESP + '" stroke-width="2.4"/>';
        inner += tx(190, 96, '淺色：很顯眼 ✗', 8.5, C_RESP);
        // 鳥
        inner += '<text x="244" y="74" text-anchor="middle" font-size="30">🐦</text>';
        inner += tx(150, 120, '比較不容易被吃的，活下來、留下後代的機會較大', 9.5);
        return svg('300 130', inner, '在深色樹幹上，深色的蛾藏得住比較安全，淺色的蛾很顯眼容易被鳥發現吃掉，較適應環境的個體較容易存活繁殖');
    }
    // 經過很多世代，族群深色比例上升＝演化。
    function generationsShift() {
        var inner = '';
        inner += tx(150, 14, '經過很多世代，族群中深色蛾越來越多', 10.5);
        var gens = [['第 1 代', 2], ['第 2 代', 4], ['第 3 代', 6]];
        gens.forEach(function (g, gi) {
            var x0 = 44 + gi * 96;
            inner += tx(x0, 34, g[0], 10);
            // 一排 6 隻：深色 g[1] 隻在前
            for (var m = 0; m < 6; m++) {
                var dark = m < g[1];
                inner += moth(x0 - 36 + (m % 3) * 24, 52 + Math.floor(m / 3) * 22, dark ? '#1e293b' : '#e2e8f0', 8.5);
            }
            inner += tx(x0, 100, '深色 ' + g[1] + ' / 6', 9, C_MLD);
            if (gi < 2)
                inner += aR(x0 + 42, 66, 14, C_GRN, 3);
        });
        inner += tx(150, 120, '是「族群」跨世代改變，不是某一隻蛾自己變色', 9.5, C_HL);
        return svg('300 130', inner, '第一代族群深色蛾2隻、第二代4隻、第三代6隻，深色比例一代一代上升，這是整個族群跨世代的改變，不是單一個體自己變色');
    }
    /* =================== 課5：呼吸作用與碳循環 =================== */
    // 碳循環 stepped SVG：stage1=光合吸碳＋呼吸放碳；stage2＝＋燃燒；stage3＝＋分解。
    function carbonCycle(stage) {
        var inner = '';
        // 大氣 CO₂ 帶
        inner += '<rect x="18" y="24" width="264" height="28" rx="10" fill="' + C_AIR + '" fill-opacity="0.18" stroke="' + C_AIR + '" stroke-width="1.6"/>';
        inner += tx(150, 42, '大氣中的二氧化碳 CO₂', 11, 'currentColor');
        // 底部四個角色
        var icons = [[52, '🌳', '植物'], [120, '🐇', '動物'], [192, '🔥', '燃燒'], [256, '🍄', '分解者']];
        icons.forEach(function (it) {
            inner += '<text x="' + it[0] + '" y="124" text-anchor="middle" font-size="26">' + it[1] + '</text>';
            inner += tx(it[0], 144, it[2], 9.5);
        });
        // 箭頭在上半（air→icon 區），文字在下半（icon 上方），彼此分行不重疊、皆置中於該角色欄。
        // 光合：空氣 → 植物（往下，吸碳）green
        inner += aD(52, 54, 22, C_PHOTO, 4) + tx(52, 90, '光合', 8, C_PHOTO) + tx(52, 100, '吸碳', 8, C_PHOTO);
        // 呼吸：動物 → 空氣（往上，放碳）red
        inner += aU(120, 76, 22, C_RESP, 4) + tx(120, 90, '呼吸', 8, C_RESP) + tx(120, 100, '放碳', 8, C_RESP);
        // 燃燒（stage>=2）
        if (stage >= 2) {
            inner += aU(192, 76, 22, C_BURN, 4) + tx(192, 90, '燃燒', 8, C_BURN) + tx(192, 100, '放碳', 8, C_BURN);
        }
        else {
            inner += tx(192, 97, '…', 12, C_MLD);
        }
        // 分解（stage>=3）
        if (stage >= 3) {
            inner += aU(256, 76, 22, C_DEC, 4) + tx(256, 90, '分解', 8, C_DEC) + tx(256, 100, '放碳', 8, C_DEC);
        }
        else if (stage >= 2) {
            inner += tx(256, 97, '…', 12, C_MLD);
        }
        var cap = stage >= 3 ? '光合吸碳；呼吸、燃燒、分解都放碳——碳在生物與空氣間循環'
            : (stage >= 2 ? '燃燒木柴或化石燃料，也把碳放回空氣中' : '植物光合吸碳（↓）、生物呼吸放碳（↑）');
        inner += tx(150, 162, cap, 9.5, C_GRN);
        return svg('300 172', inner, stage >= 3 ? '碳循環：植物光合作用把大氣的二氧化碳吸收固定，動植物呼吸、燃燒、分解者分解遺體都把二氧化碳放回大氣，碳在生物與空氣之間循環'
            : (stage >= 2 ? '碳循環：除了光合吸碳和呼吸放碳，燃燒木柴和化石燃料也把二氧化碳放回大氣'
                : '碳循環：植物光合作用把大氣二氧化碳往下吸收，動物和植物呼吸把二氧化碳往上放回大氣'));
    }
    window.CONCEPT = {
        progKey: 'biology_concepts_adv_v1', practiceHref: 'biology.html',
        lessons: [
            { id: 'cell', name: '細胞與胞器', emoji: '🔬', color: '#0891b2', sub: '細胞是生命單位、動植物細胞的差別、胞器分工',
                done: '記得：細胞是生命的基本單位；植物細胞比動物多了細胞壁、葉綠體、大液泡；粒線體＝發電廠（呼吸產能）、葉綠體＝廚房（光合）、細胞核＝指揮中心。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '生物都由細胞組成', svg: organismToCells(), text: '把一個生物體一直<b>放大</b>，會看到它是由<b>一個個細胞</b>組成的。<b>細胞</b>是<b>生命的基本單位</b>——不管是人、狗還是一棵樹，身體都是許多細胞合作而成。' },
                    { type: 'teach', kicker: '比一比', title: '動物細胞 vs 植物細胞', svg: cellCompare(), text: '動物細胞和植物細胞都有<b>細胞核、細胞膜、粒線體</b>。但<b>植物細胞多了三樣</b>：外層硬硬的<b>細胞壁</b>、綠色的<b>葉綠體</b>、還有一個大大的<b>大液泡</b>。（注意：植物也有粒線體，不是只有葉綠體！）' },
                    { type: 'teach', kicker: '各司其職', title: '主要胞器的分工', svg: organelleRoles(), text: '細胞裡的<b>胞器</b>各有工作：<b>細胞核</b>是<b>指揮中心</b>（存放 DNA）；<b>粒線體</b>是<b>發電廠</b>，進行<b>呼吸作用</b>把養分變成能量；<b>葉綠體</b>是<b>廚房</b>，進行<b>光合作用</b>（植物才有）；<b>細胞膜</b>像一道<b>門</b>，控制物質進出。' },
                    { type: 'quiz', kicker: '換你試試', title: '哪一個是植物細胞有、動物細胞「沒有」的？', options: ['細胞壁與葉綠體', '細胞核', '細胞膜', '粒線體'], answer: 0, why: '細胞壁、葉綠體、大液泡是植物細胞特有；細胞核、細胞膜、粒線體則是兩者都有。', whyWrong: { 1: '細胞核動植物細胞都有，不是植物特有。', 2: '細胞膜是所有細胞的基本構造，動植物都有。', 3: '粒線體動植物細胞都有——植物不是只有葉綠體。' } },
                    { type: 'quiz', kicker: '換你試試', title: '細胞裡負責產生能量的「發電廠」是？', options: ['粒線體', '細胞核', '細胞壁', '大液泡'], answer: 0, why: '粒線體進行呼吸作用，把養分轉成細胞可用的能量，所以叫發電廠。', whyWrong: { 1: '細胞核是指揮中心、存放 DNA，不負責產能。', 2: '細胞壁是植物的保護外層，不產生能量（而且動物細胞沒有）。', 3: '大液泡主要是儲存，不是產能。' } },
                    { type: 'quiz', kicker: '想一想', title: '植物進行光合作用的胞器是？', options: ['葉綠體', '粒線體', '細胞核', '細胞膜'], answer: 0, why: '葉綠體裡有葉綠素，是植物行光合作用、製造養分的地方。', whyWrong: { 1: '粒線體負責呼吸作用產能，不是光合作用。', 2: '細胞核是指揮中心，不進行光合作用。', 3: '細胞膜控制物質進出，不進行光合作用。' } }
                ] },
            { id: 'division', name: '細胞分裂與生長', emoji: '➗', color: '#16a34a', sub: '長大＝細胞分裂變多、先複製DNA再平分',
                done: '記得：身體長大是細胞「分裂、數目變多」而不是變大；分裂前會先複製 DNA，再平均分成兩個完全相同的子細胞。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '長大是細胞「變多」', svg: growByDivision(), text: '你長高、長大，<b>不是</b>身上的細胞一個個<b>變超大</b>，而是細胞不斷<b>分裂</b>、讓<b>數目變多</b>。細胞長到一定大小就會分裂成兩個，身體才能一直長大。' },
                    { type: 'teach', kicker: '怎麼分', title: '先複製 DNA，再一分為二', svg: mitosisSteps(), text: '一個細胞要分裂時，會<b>先把裡面的 DNA（染色體）複製一份</b>，再<b>平均分</b>到兩邊，最後<b>一分為二</b>。這樣得到的<b>兩個子細胞</b>才會有<b>完整、一模一樣</b>的遺傳物質。' },
                    { type: 'teach', kicker: '身體裡的例子', title: '癒合、長高都靠它', svg: divisionLife(), text: '細胞分裂隨時都在發生：<b>傷口癒合</b>（長出新細胞補起來）、<b>長高</b>、<b>指甲和頭髮變長</b>，都是靠細胞不斷分裂、補充新的細胞。' },
                    { type: 'quiz', kicker: '換你試試', title: '人為什麼會長高？主要因為？', options: ['細胞分裂，數目變多', '每個細胞變超大', '骨頭吸水膨脹', '細胞變重'], answer: 0, why: '生長主要靠細胞分裂使細胞數目增加，身體才會變大、長高。', whyWrong: { 1: '細胞長到一定大小就會分裂，不是一直變超大。', 2: '長高不是骨頭吸水膨脹，而是骨骼細胞分裂增生。', 3: '變重不等於長高；關鍵是細胞數目增加。' } },
                    { type: 'quiz', kicker: '換你試試', title: '一個細胞分裂前會先做什麼，才能讓兩個子細胞一樣？', options: ['複製 DNA', '丟掉一半 DNA', '把細胞核丟掉', '什麼都不做'], answer: 0, why: '先複製遺傳物質（DNA），再平分，兩個子細胞才會有完整相同的 DNA。', whyWrong: { 1: '丟掉一半 DNA，子細胞就會缺少遺傳物質，無法正常運作。', 2: '細胞核裝著 DNA，丟掉核就沒有遺傳物質可分了。', 3: '什麼都不做就直接分，兩邊會分不到完整的 DNA。' } },
                    { type: 'quiz', kicker: '想一想', title: '細胞分裂結束後，兩個子細胞的 DNA 是？', options: ['完全相同', '完全不同', '各缺一半', '隨機亂湊'], answer: 0, why: '因為分裂前先複製再平分，兩個子細胞拿到的 DNA 完全相同。', whyWrong: { 1: '先複製再平分，所以不會完全不同。', 2: '複製後才平分，兩邊都是完整的，不會各缺一半。', 3: 'DNA 是精準複製平分，不是隨機亂湊。' } }
                ] },
            { id: 'genetics', name: '遺傳：為什麼像爸媽', emoji: '🧬', color: '#9333ea', sub: '基因在DNA上、父母各給一半、顯性隱性',
                done: '記得：特徵由基因決定，基因是 DNA 上的一小段；小孩的基因一半來自爸爸、一半來自媽媽；顯性基因只要有一個就會表現。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '特徵由「基因」決定', svg: geneNesting(), text: '你的眼睛顏色、頭髮、長相，這些<b>特徵</b>由<b>基因</b>決定。一層層放大來看：細胞裡有<b>細胞核</b>，核裡有<b>染色體</b>，染色體是由 <b>DNA</b> 組成，而 <b>DNA 上帶有遺傳訊息的一小段，就是基因</b>。' },
                    { type: 'teach', kicker: '一半一半', title: '爸媽各給你一半', svg: halfFromEach(), text: '小孩的基因是<b>爸爸給一半、媽媽給一半</b>，合起來組成的。所以你有些地方<b>像爸爸</b>、有些地方<b>像媽媽</b>——這就是為什麼小孩會像父母，又不完全一樣。' },
                    { type: 'teach', kicker: '誰說了算', title: '顯性只要有一個就表現', svg: dominantRecessive(), text: '同一個特徵可能有<b>顯性</b>和<b>隱性</b>兩種版本的基因。<b>顯性</b>基因<b>只要有一個就會表現出來</b>；只有<b>兩個都是隱性</b>時，隱性特徵才表現。例如棕眼（B）是顯性、藍眼（b）是隱性：<b>BB、Bb 都是棕眼</b>，只有 <b>bb 才是藍眼</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '小孩的基因大約是？', options: ['一半來自爸爸、一半來自媽媽', '全部來自媽媽', '全部來自爸爸', '自己長出來的'], answer: 0, why: '有性生殖中，子代各從父母得到一半的基因，合起來就是小孩的基因。', whyWrong: { 1: '不是全部來自媽媽；爸爸也給了一半。', 2: '不是全部來自爸爸；媽媽也給了一半。', 3: '基因是從父母遺傳來的，不是自己憑空長出來的。' } },
                    { type: 'quiz', kicker: '換你試試', title: '基因儲存在哪裡？', options: ['DNA 上', '血液顏色裡', '皮膚表面', '牙齒裡'], answer: 0, why: '基因是 DNA 上帶有遺傳訊息的片段，DNA 存在細胞核的染色體裡。', whyWrong: { 1: '血液顏色不是基因；基因在 DNA 上。', 2: '皮膚表面不儲存基因；基因在細胞核的 DNA 上。', 3: '牙齒不是儲存基因的地方；基因在 DNA 上。' } },
                    { type: 'quiz', kicker: '想一想', title: '棕眼（B）顯性、藍眼（b）隱性。哪一組會是「棕眼」？', options: ['Bb（有一個顯性 B）', 'bb', '只有 BB', '都不是棕眼'], answer: 0, why: '顯性基因只要有一個就會表現，所以 BB 和 Bb 都是棕眼；只有 bb 才是藍眼。', whyWrong: { 1: 'bb 兩個都是隱性，才會表現藍眼。', 2: '不只 BB，Bb 也是棕眼——只要有一個顯性 B 就表現。', 3: '有顯性 B 時就是棕眼，所以 BB、Bb 都是棕眼。' } }
                ] },
            { id: 'evolution', name: '演化與天擇', emoji: '🐢', color: '#f59e0b', sub: '變異＋環境篩選＋很多世代＝族群改變',
                done: '記得：演化＝同種有變異＋環境篩選（天擇）＋經過很多世代，使「族群」的特徵改變；不是某個個體在一生中「想變就變」。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '同種生物有「變異」', svg: variation(), text: '同一種生物，每一隻個體都<b>長得略有不同</b>——有的顏色深、有的淺，有的大、有的小。這些<b>天生的差異</b>叫做<b>變異</b>。變異是演化的<b>原料</b>。' },
                    { type: 'teach', kicker: '環境來篩選', title: '天擇：較適應的較容易活下來', svg: selection(), text: '環境會像一個<b>篩子</b>。例如在<b>深色樹幹</b>上，<b>淺色</b>的蛾很顯眼、容易被鳥<b>發現吃掉</b>；<b>深色</b>的蛾藏得住、<b>比較容易活下來、留下後代</b>。這種「環境篩選出較適應個體」的過程，就叫<b>天擇</b>。' },
                    { type: 'teach', kicker: '很多世代以後', title: '族群特徵跨世代改變＝演化', svg: generationsShift(), text: '較適應的個體留下較多後代，所以<b>一代一代</b>下來，族群中<b>深色蛾的比例越來越高</b>。<b>經過很多世代，整個族群的特徵改變，這就是演化。</b>重點：演化是<b>「族群」跨世代</b>的改變，<b>不是</b>某一隻蛾在一生中「努力」或「想變」就把自己變色。' },
                    { type: 'quiz', kicker: '換你試試', title: '天擇的意思最接近？', options: ['較適應環境的個體較容易存活繁殖', '生物想變就能變', '最強壯的一定不死', '動物會互相投票'], answer: 0, why: '環境篩選出較適應的個體，使牠們較容易存活、把基因傳給後代。', whyWrong: { 1: '生物不能「想變就變」——變異是天生就有的差異，由環境來篩選。', 2: '天擇講的是「較容易」存活繁殖，不是「一定不死」；強壯也可能因意外死亡。', 3: '天擇是環境篩選，不是生物互相投票決定。' } },
                    { type: 'quiz', kicker: '換你試試', title: '演化發生在哪個層次、需要什麼？', options: ['族群、經過很多世代', '單一個體的一生', '一天之內', '只要許願'], answer: 0, why: '演化是族群層次、跨世代的基因頻率改變，不是個體一生內的變化。', whyWrong: { 1: '單一個體一生中不會演化；演化是整個族群跨世代的改變。', 2: '演化要經過很多世代，不可能在一天之內完成。', 3: '演化靠變異加環境篩選，不是靠許願就能發生。' } },
                    { type: 'quiz', kicker: '想一想', title: '深色樹幹上，哪一種蛾比較容易活下來？', options: ['深色蛾（藏得住）', '淺色蛾（很顯眼）', '顏色不影響', '最大隻的蛾'], answer: 0, why: '在深色樹幹上，深色蛾藏得住、較不易被鳥發現，存活與繁殖的機會較大。', whyWrong: { 1: '淺色蛾在深色樹幹上很顯眼，反而容易被鳥吃掉。', 2: '顏色會影響——是否容易被天敵發現正是關鍵。', 3: '關鍵是體色能不能融入環境，不是體型大小。' } }
                ] },
            { id: 'carbon', name: '呼吸作用與碳循環', emoji: '🌳', color: '#059669', sub: '呼吸＝光合的相反；碳在生物與空氣間循環',
                done: '記得：呼吸作用＝養分＋氧氣 → 能量＋CO₂＋水（和光合相反）；光合吸碳，呼吸、燃燒、分解都放碳——碳在生物與空氣之間不停循環。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '呼吸作用：和光合相反', svg: animCanvas(330, 206, '光合作用動畫：葉子吸收陽光的能量，吸入二氧化碳、根部吸水，做出養分（葡萄糖）並放出氧氣——當作對照'), mount: function (host) { return window.Anim && window.Anim.photosynthesis(host); }, text: '先看動畫複習<b>光合作用</b>：陽光＋<b>二氧化碳</b>＋水 → 養分＋<b>氧氣</b>。<b>呼吸作用</b>剛好<b>相反</b>：細胞（在粒線體裡）把<b>養分＋氧氣 → 能量＋二氧化碳＋水</b>。動植物都要呼吸，才能把養分裡的能量拿出來用。' },
                    { type: 'teach', kicker: '碳怎麼流動', title: '光合吸碳、呼吸放碳', svg: carbonCycle(1), text: '<b>光合作用</b>把空氣中的<b>二氧化碳「吸」進</b>植物，變成養分（把碳<b>固定</b>下來，箭頭往下）；<b>呼吸作用</b>則把二氧化碳<b>「放」回</b>空氣（箭頭往上）。動物和植物都會呼吸，所以碳就在<b>生物和空氣之間</b>來回流動。' },
                    { type: 'teach', kicker: '還有誰在放碳', title: '燃燒也把碳放回空氣', svg: carbonCycle(2), text: '除了呼吸，<b>燃燒</b>也會放碳：燒<b>木柴</b>、燒<b>汽油或煤</b>（化石燃料），都會把裡面的碳變成<b>二氧化碳</b>放回空氣中（箭頭往上）。這也是為什麼人類大量燃燒化石燃料，會讓空氣中的 CO₂ 變多。' },
                    { type: 'teach', kicker: '最後一步', title: '分解者把碳還給環境', svg: carbonCycle(3), text: '當動植物死亡，<b>分解者</b>（像細菌、黴菌）會把遺體<b>分解</b>，也把裡面的碳以<b>二氧化碳</b>放回環境（箭頭往上）。於是：<b>光合吸碳；呼吸、燃燒、分解放碳</b>——碳就這樣在生物與空氣之間<b>不停循環</b>，這叫<b>碳循環</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '呼吸作用和光合作用的關係是？', options: ['大致相反：光合吸 CO₂、呼吸放 CO₂', '完全一樣', '都只有植物會', '都不需要氧'], answer: 0, why: '光合把 CO₂＋水＋光→養分＋O₂；呼吸把養分＋O₂→能量＋CO₂＋水，方向大致相反。', whyWrong: { 1: '兩者方向相反，不是完全一樣。', 2: '呼吸作用動物和植物都會，不是只有植物。', 3: '呼吸作用需要氧氣（把養分氧化放出能量）。' } },
                    { type: 'quiz', kicker: '換你試試', title: '下列哪一項會把碳「放回」空氣中？', options: ['燃燒木柴或汽油', '植物行光合作用', '把葉子冰起來', '關燈'], answer: 0, why: '燃燒和呼吸、分解一樣都釋放 CO₂；光合作用則是把 CO₂ 吸收固定。', whyWrong: { 1: '光合作用是把 CO₂「吸收」固定，不是放回空氣。', 2: '把葉子冰起來不會放出 CO₂。', 3: '關燈省電和碳放回空氣沒有直接關係。' } },
                    { type: 'quiz', kicker: '想一想', title: '動植物死亡後，誰會把遺體裡的碳放回環境？', options: ['分解者（細菌、黴菌）', '太陽', '月亮', '石頭'], answer: 0, why: '分解者分解遺體，把其中的碳以二氧化碳等形式放回環境，完成碳循環。', whyWrong: { 1: '太陽提供能量給光合作用，不負責分解遺體。', 2: '月亮和碳循環沒有關係。', 3: '石頭不會分解生物遺體放出碳。' } }
                ] }
        ]
    };
})();
