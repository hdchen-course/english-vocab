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
    var C_BACT = '#16a34a'; // 細菌 green（活細胞）
    var C_VIRUS = '#dc2626'; // 病毒 red（寄生顆粒）
    var C_WBC = '#2563eb'; // 白血球 blue（免疫）
    var C_ANTIB = '#7c3aed'; // 抗體 purple
    var C_HORM = '#0891b2'; // 荷爾蒙 cyan（化學訊息）
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
        // 複製後的染色體：兩股姊妹染色分體在中節相連，畫成 X 形（仍是「一條」染色體）
        function dchr(cx, cy, col) {
            return '<g transform="rotate(26 ' + cx + ' ' + cy + ')">' + chr(cx, cy, col) + '</g>' +
                '<g transform="rotate(-26 ' + cx + ' ' + cy + ')">' + chr(cx, cy, col) + '</g>';
        }
        // Stage 1：1 個細胞，2 條染色體
        inner += '<circle cx="48" cy="74" r="26" fill="' + C_CELL + '" fill-opacity="0.1" stroke="' + C_CELL + '" stroke-width="2"/>';
        inner += chr(42, 74, C_DNA1) + chr(54, 74, C_DNA2);
        inner += tx(48, 116, '1 個細胞', 10) + tx(48, 130, '(2 條染色體)', 8.5, C_MLD);
        inner += aR(80, 74, 24, C_MLD, 3) + tx(92, 62, '複製', 9, C_MLD);
        // Stage 2：複製後仍是 2 條，每條含 2 股姊妹染色分體（X 形）
        inner += '<circle cx="150" cy="74" r="28" fill="' + C_CELL + '" fill-opacity="0.1" stroke="' + C_CELL + '" stroke-width="2"/>';
        inner += dchr(142, 74, C_DNA1) + dchr(158, 74, C_DNA2);
        inner += tx(150, 116, '複製 DNA', 10) + tx(150, 130, '(每條變兩股，仍是 2 條)', 8, C_MLD);
        inner += aR(184, 74, 24, C_MLD, 3) + tx(196, 62, '平分', 9, C_MLD);
        // Stage 3：分成兩個相同
        inner += '<circle cx="238" cy="54" r="20" fill="' + C_CELL + '" fill-opacity="0.1" stroke="' + C_GRN + '" stroke-width="2"/>';
        inner += chr(233, 54, C_DNA1) + chr(243, 54, C_DNA2);
        inner += '<circle cx="238" cy="98" r="20" fill="' + C_CELL + '" fill-opacity="0.1" stroke="' + C_GRN + '" stroke-width="2"/>';
        inner += chr(233, 98, C_DNA1) + chr(243, 98, C_DNA2);
        inner += tx(238, 130, '2 個相同細胞', 9.5, C_GRN);
        return svg('300 140', inner, '一個細胞先把兩條染色體各複製成兩股姊妹染色分體（畫成 X 形，仍是兩條），再平均分給兩個子細胞，每個子細胞都拿到完整的兩條染色體');
    }
    // 細胞分裂在生活裡：傷口癒合三格微序列（缺口 → 細胞分裂 → 補滿）。
    function divisionLife() {
        var inner = '';
        inner += tx(150, 14, '傷口怎麼好起來？細胞分裂把缺口補滿', 10.5);
        // 一顆細胞小工具（膜＋核點）
        function cell(cx, cy, r, col) {
            return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + C_CELL + '" fill-opacity="0.25" stroke="' + col + '" stroke-width="1.4"/>' +
                '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.35) + '" fill="' + C_NUC + '"/>';
        }
        var ys = 70; // 皮膚細胞列的中心 y
        var xs = []; // 五個細胞欄位 x（每格間隔 13）
        // 第 1 格：剛受傷，中間缺兩顆（缺口）
        inner += tx(54, 34, '① 剛受傷', 10, C_RESP);
        for (var i = 0; i < 5; i++)
            xs[i] = 28 + i * 13;
        inner += cell(xs[0], ys, 6, C_CELL) + cell(xs[1], ys, 6, C_CELL) + cell(xs[3], ys, 6, C_CELL) + cell(xs[4], ys, 6, C_CELL);
        // 缺口（紅虛線）
        inner += '<path d="M' + (xs[2] - 8) + ' ' + (ys - 8) + ' Q' + xs[2] + ' ' + (ys + 10) + ' ' + (xs[2] + 8) + ' ' + (ys - 8) + '" fill="none" stroke="' + C_RESP + '" stroke-width="1.6" stroke-dasharray="3 2"/>';
        inner += tx(xs[2], ys + 24, '缺口', 8.5, C_RESP);
        inner += aR(98, ys, 14, C_MLD, 3);
        // 第 2 格：細胞分裂，一顆分成兩顆往缺口長
        inner += tx(150, 34, '② 細胞分裂', 10, C_GRN);
        var bx = 124;
        for (var j = 0; j < 2; j++)
            inner += cell(bx + j * 13, ys, 6, C_CELL);
        // 分裂中的細胞（兩顆相黏的新細胞，綠框）
        inner += cell(bx + 26, ys - 4, 5.5, C_GRN) + cell(bx + 26, ys + 6, 5.5, C_GRN);
        inner += '<text x="' + (bx + 26) + '" y="' + (ys - 14) + '" text-anchor="middle" font-size="9" font-weight="800" fill="' + C_GRN + '">1→2</text>';
        for (var k = 3; k < 5; k++)
            inner += cell(bx + k * 13, ys, 6, C_CELL);
        inner += tx(150, ys + 24, '長出新細胞填進去', 8.5, C_GRN);
        inner += aR(198, ys, 14, C_MLD, 3);
        // 第 3 格：補滿、癒合
        inner += tx(246, 34, '③ 癒合完成', 10, C_GRN);
        for (var m = 0; m < 5; m++)
            inner += cell(220 + m * 13, ys, 6, C_GRN);
        inner += '<text x="246" y="' + (ys - 16) + '" text-anchor="middle" font-size="14">✅</text>';
        inner += tx(246, ys + 24, '缺口補滿', 8.5, C_GRN);
        inner += tx(150, 115, '細胞不斷分裂、長出新細胞，把缺口一點一點補滿', 9);
        inner += tx(150, 130, '長高、指甲變長，也是靠同樣的細胞分裂', 9, C_MLD);
        return svg('300 142', inner, '傷口癒合的三格過程：剛受傷時皮膚細胞中間有缺口，接著細胞分裂長出新細胞填進缺口，最後缺口補滿、傷口癒合；長高和指甲變長也是靠同樣的細胞分裂');
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
    /* =================== 課6：病毒與細菌 =================== */
    // 病毒小工具：外殼＋突起（spike）＋遺傳物質。顏色 C_VIRUS，隨主題清楚。
    function virusIcon(cx, cy, r) {
        var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + C_VIRUS + '" fill-opacity="0.25" stroke="' + C_VIRUS + '" stroke-width="1.5"/>';
        for (var a = 0; a < 8; a++) {
            var ang = a * Math.PI / 4;
            var x1 = (cx + Math.cos(ang) * r).toFixed(1), y1 = (cy + Math.sin(ang) * r).toFixed(1);
            var x2 = (cx + Math.cos(ang) * (r + r * 0.42)).toFixed(1), y2 = (cy + Math.sin(ang) * (r + r * 0.42)).toFixed(1);
            s += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + C_VIRUS + '" stroke-width="1.3"/>';
            s += '<circle cx="' + x2 + '" cy="' + y2 + '" r="' + (r * 0.16).toFixed(1) + '" fill="' + C_VIRUS + '"/>';
        }
        s += '<path d="M' + (cx - r * 0.4) + ' ' + cy + ' q' + (r * 0.4) + ' ' + (-r * 0.5) + ' ' + (r * 0.8) + ' 0" fill="none" stroke="' + C_HL + '" stroke-width="1.3"/>';
        return s;
    }
    // 細菌＝活的單細胞，可自行分裂繁殖（有細胞壁、膜、環狀 DNA，沒有細胞核）。
    function bacteriaCell() {
        var inner = '';
        inner += tx(150, 14, '細菌是「活的單細胞」，能自己分裂繁殖', 10.5);
        inner += '<ellipse cx="64" cy="62" rx="40" ry="25" fill="' + C_BACT + '" fill-opacity="0.12" stroke="' + C_WALL + '" stroke-width="3"/>'; // 細胞壁
        inner += '<ellipse cx="64" cy="62" rx="34" ry="20" fill="none" stroke="' + C_BACT + '" stroke-width="1.6"/>'; // 細胞膜
        inner += '<ellipse cx="60" cy="62" rx="10" ry="6.5" fill="none" stroke="' + C_DNA2 + '" stroke-width="2"/>'; // 環狀 DNA
        inner += '<path d="M104 62 q10 -7 18 0 q8 7 16 0" fill="none" stroke="' + C_MLD + '" stroke-width="2"/>'; // 鞭毛
        inner += tx(64, 100, '細菌（單細胞）', 9.5, C_BACT);
        inner += tx(64, 113, '有細胞壁、膜、環狀 DNA；沒有細胞核', 8, C_MLD);
        inner += aR(150, 62, 24, C_GRN, 3) + tx(162, 50, '分裂', 9, C_GRN);
        inner += '<ellipse cx="214" cy="50" rx="27" ry="16" fill="' + C_BACT + '" fill-opacity="0.12" stroke="' + C_WALL + '" stroke-width="2.4"/>';
        inner += '<ellipse cx="214" cy="50" rx="7" ry="4.5" fill="none" stroke="' + C_DNA2 + '" stroke-width="1.6"/>';
        inner += '<ellipse cx="214" cy="88" rx="27" ry="16" fill="' + C_BACT + '" fill-opacity="0.12" stroke="' + C_WALL + '" stroke-width="2.4"/>';
        inner += '<ellipse cx="214" cy="88" rx="7" ry="4.5" fill="none" stroke="' + C_DNA2 + '" stroke-width="1.6"/>';
        inner += tx(266, 72, '→ 2 隻', 9.5, C_GRN, 'start');
        inner += tx(150, 132, '有些是益菌（腸道、發酵），有些會致病', 9.5, C_MLD);
        return svg('300 144', inner, '細菌是活的單細胞，有細胞壁、細胞膜和環狀DNA但沒有細胞核，可以自己分裂成兩隻繁殖；有些是對人體有益的益菌，有些會致病');
    }
    // 病毒不是細胞，必須侵入宿主細胞、借細胞工廠複製。
    function virusHost() {
        var inner = '';
        inner += tx(150, 14, '病毒不是細胞，要「侵入細胞」才能複製', 10.5);
        inner += virusIcon(42, 56, 13) + tx(42, 86, '病毒', 9.5, C_VIRUS) + tx(42, 98, '外殼＋遺傳物質', 7.5, C_MLD);
        inner += aR(68, 58, 20, C_MLD, 3) + tx(78, 46, '侵入', 8.5, C_MLD);
        inner += '<ellipse cx="150" cy="62" rx="46" ry="38" fill="' + C_CELL + '" fill-opacity="0.1" stroke="' + C_CELL + '" stroke-width="2.4"/>';
        inner += '<circle cx="150" cy="62" r="12" fill="' + C_NUC + '" fill-opacity="0.25" stroke="' + C_NUC + '" stroke-width="1.4"/>';
        inner += virusIcon(126, 46, 7) + virusIcon(172, 48, 7) + virusIcon(132, 82, 7) + virusIcon(170, 82, 7);
        inner += tx(150, 112, '宿主細胞（被借用工廠）', 9);
        inner += aR(200, 58, 18, C_VIRUS, 3) + tx(209, 46, '複製', 8.5, C_VIRUS);
        var vs = [[242, 42], [270, 46], [250, 62], [276, 66], [244, 82], [272, 86]];
        vs.forEach(function (p) { inner += virusIcon(p[0], p[1], 6); });
        inner += tx(260, 112, '複製出許多病毒', 9, C_VIRUS);
        inner += tx(150, 132, '病毒自己不能繁殖，一定要寄生在宿主細胞裡', 9.5, C_MLD);
        return svg('300 144', inner, '病毒是蛋白質外殼加遺傳物質的小顆粒，不是細胞，自己不能繁殖，必須侵入宿主細胞借用細胞的工廠才能複製出許多新病毒');
    }
    // 細菌 vs 病毒：大小與構造對照（推理用）。
    function virusBacteriaCompare() {
        var inner = '';
        inner += tx(150, 14, '病毒比細菌小很多，構造也簡單', 10.5);
        inner += '<ellipse cx="60" cy="66" rx="38" ry="26" fill="' + C_BACT + '" fill-opacity="0.12" stroke="' + C_WALL + '" stroke-width="2.6"/>';
        inner += '<ellipse cx="56" cy="66" rx="9" ry="5.5" fill="none" stroke="' + C_DNA2 + '" stroke-width="1.6"/>';
        inner += tx(60, 102, '細菌（是細胞）', 8.5, C_BACT);
        inner += virusIcon(118, 62, 7) + tx(118, 102, '病毒（小）', 8.5, C_VIRUS);
        inner += '<line x1="156" y1="36" x2="156" y2="112" stroke="' + C_MLD + '" stroke-width="0.8" stroke-opacity="0.4"/>';
        inner += tx(206, 34, '細菌', 9, C_BACT) + tx(268, 34, '病毒', 9, C_VIRUS);
        inner += '<line x1="166" y1="42" x2="292" y2="42" stroke="' + C_MLD + '" stroke-width="0.8" stroke-opacity="0.4"/>';
        var rows = [['是細胞', '是', '不是'], ['自己繁殖', '可以', '要宿主']];
        rows.forEach(function (r, i) {
            var y = 62 + i * 30;
            inner += tx(170, y, r[0], 9, 'currentColor', 'start');
            inner += tx(206, y, r[1], 9.5, C_GRN) + tx(268, y, r[2], 9, C_VIRUS);
        });
        inner += tx(150, 132, '構造不同，對付它們的方法也不一樣', 9.5, C_MLD);
        return svg('300 144', inner, '細菌是細胞、體型較大、可以自己繁殖；病毒小很多、不是細胞、必須靠宿主細胞才能複製，兩者構造差很多');
    }
    // 抗生素只對細菌有效、對病毒無效。
    function antibioticViz() {
        var inner = '';
        inner += tx(150, 14, '抗生素只對細菌有效，對病毒沒用', 10.5);
        inner += '<rect x="130" y="30" width="40" height="20" rx="10" fill="' + C_HL + '" fill-opacity="0.3" stroke="' + C_HL + '" stroke-width="1.8"/>';
        inner += '<line x1="150" y1="30" x2="150" y2="50" stroke="' + C_HL + '" stroke-width="1.4"/>';
        inner += tx(150, 64, '抗生素', 9.5, C_HL);
        inner += aL(122, 72, 20, C_GRN, 3);
        inner += '<ellipse cx="68" cy="92" rx="26" ry="16" fill="' + C_BACT + '" fill-opacity="0.12" stroke="' + C_WALL + '" stroke-width="2.2"/>';
        inner += '<line x1="52" y1="80" x2="84" y2="104" stroke="' + C_GRN + '" stroke-width="2.6"/>';
        inner += tx(68, 122, '細菌：被消滅 ✓', 9, C_GRN);
        inner += aR(178, 72, 20, C_RESP, 3);
        inner += virusIcon(232, 92, 11);
        inner += tx(232, 122, '病毒：沒有用 ✗', 9, C_RESP);
        inner += tx(150, 138, '感冒多是病毒；濫用抗生素還會養出抗藥性細菌', 8.5, C_MLD);
        return svg('300 150', inner, '抗生素作用在細菌的構造上，可以消滅細菌，但對沒有細胞構造的病毒完全沒用；一般感冒多是病毒引起，亂吃抗生素不但無效還會養出抗藥性細菌');
    }
    /* =================== 課7：免疫與疫苗 =================== */
    // 白血球辨識並清除入侵病原（免疫系統像保全）。
    function whiteBloodCell() {
        var inner = '';
        inner += tx(150, 14, '免疫系統像保全：白血球清除入侵的病原', 10.5);
        inner += '<circle cx="110" cy="72" r="40" fill="' + C_WBC + '" fill-opacity="0.12" stroke="' + C_WBC + '" stroke-width="2.6"/>';
        inner += '<circle cx="100" cy="66" r="12" fill="' + C_WBC + '" fill-opacity="0.3" stroke="' + C_WBC + '" stroke-width="1.4"/>';
        inner += '<path d="M146 72 q16 -5 28 0 q-10 7 0 14 q-20 2 -28 -5 z" fill="' + C_WBC + '" fill-opacity="0.2" stroke="' + C_WBC + '" stroke-width="1.6"/>'; // 偽足伸向病原
        inner += tx(110, 124, '白血球', 10, C_WBC);
        inner += virusIcon(190, 78, 9) + tx(190, 118, '病原', 9, C_RESP);
        inner += tx(150, 140, '白血球會辨識並清除入侵的病原，保護身體', 9.5, C_MLD);
        return svg('300 150', inner, '免疫系統像保全，白血球會辨識入侵的病原並把它吞噬清除，保護身體不受感染');
    }
    // 免疫記憶時間線：第一次反應慢又低、留下記憶、第二次又快又強（before/after 推理圖）。
    function immuneMemory() {
        var inner = '';
        inner += tx(150, 14, '第一次反應慢；有了記憶，第二次又快又強', 10);
        var ox = 30, oy = 118, w = 252, h = 86;
        inner += '<line x1="' + ox + '" y1="' + oy + '" x2="' + (ox + w) + '" y2="' + oy + '" stroke="' + C_MLD + '" stroke-width="1.4"/>';
        inner += '<line x1="' + ox + '" y1="' + oy + '" x2="' + ox + '" y2="' + (oy - h) + '" stroke="' + C_MLD + '" stroke-width="1.4"/>';
        inner += tx(ox + 2, oy - h + 2, '抗體量', 8, C_MLD, 'start');
        inner += tx(ox + w, oy + 12, '時間 →', 8, C_MLD, 'end');
        inner += '<path d="M' + ox + ' ' + oy + ' C 70 ' + oy + ', 90 ' + (oy - 30) + ', 110 ' + (oy - 34) + ' S 140 ' + oy + ', 150 ' + (oy - 4) + '" fill="none" stroke="' + C_WBC + '" stroke-width="2.6"/>';
        inner += tx(98, oy - 44, '第一次：慢又低', 8.5, C_WBC);
        inner += '<circle cx="150" cy="' + (oy - 6) + '" r="4" fill="' + C_HL + '"/>' + tx(170, oy - 20, '留下記憶細胞', 8, C_HL, 'start');
        inner += '<path d="M152 ' + (oy - 4) + ' C 165 ' + (oy - 60) + ', 185 ' + (oy - 72) + ', 205 ' + (oy - 70) + ' S 250 ' + (oy - 10) + ', 276 ' + (oy - 6) + '" fill="none" stroke="' + C_GRN + '" stroke-width="2.6"/>';
        inner += tx(216, oy - 80, '第二次：快又強', 8.5, C_GRN);
        return svg('300 132', inner, '抗體量對時間的曲線：第一次遇到病原時抗體產生得慢、量也低；康復後身體留下記憶細胞，第二次再遇到同一種病原時抗體反應又快又強');
    }
    // 疫苗＝病原的無害版本（抗原），讓免疫系統先練習、產生記憶細胞與抗體。
    function vaccineRehearsal() {
        var inner = '';
        inner += tx(150, 14, '疫苗＝病原的「無害版本」，讓身體先練習', 10);
        inner += '<text x="42" y="70" text-anchor="middle" font-size="30">💉</text>';
        inner += tx(42, 96, '疫苗', 9.5, C_WBC) + tx(42, 108, '無害的抗原', 7.5, C_MLD);
        inner += aR(70, 64, 22, C_MLD, 3) + tx(82, 52, '練習', 8.5, C_MLD);
        inner += '<circle cx="140" cy="64" r="28" fill="' + C_WBC + '" fill-opacity="0.12" stroke="' + C_WBC + '" stroke-width="2.2"/>';
        inner += '<circle cx="132" cy="60" r="8" fill="' + C_WBC + '" fill-opacity="0.3"/>';
        inner += tx(140, 104, '免疫系統預演', 9);
        inner += aR(176, 64, 20, C_GRN, 3);
        inner += '<circle cx="232" cy="50" r="12" fill="' + C_HL + '" fill-opacity="0.3" stroke="' + C_HL + '" stroke-width="1.6"/>' + tx(232, 54, '記憶', 8);
        inner += '<path d="M262 82 l9 -6 l9 6" fill="none" stroke="' + C_ANTIB + '" stroke-width="2.2"/><line x1="271" y1="76" x2="271" y2="90" stroke="' + C_ANTIB + '" stroke-width="2.2"/>'; // Y 形抗體
        inner += tx(236, 108, '記憶細胞＋抗體', 8.5, C_GRN);
        inner += tx(150, 128, '疫苗不會讓你生病，而是讓免疫系統先演練、記住病原', 9, C_MLD);
        return svg('300 140', inner, '疫苗是病原的無害版本（減毒、去活化、片段或mRNA製作的抗原），讓免疫系統先練習、產生記憶細胞和抗體，之後遇到真的病原就能快速反應，而且疫苗本身不會讓人生病');
    }
    // 群體免疫（中性說明）：周圍的人有免疫，病原不易傳到脆弱者。
    function herdImmunity() {
        var inner = '';
        inner += tx(150, 14, '保護自己，也保護身邊的人', 10.5);
        var people = [[70, 56], [150, 44], [230, 56], [58, 102], [242, 102], [108, 122], [192, 122]];
        people.forEach(function (p) {
            inner += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="15" fill="' + C_GRN + '" fill-opacity="0.14" stroke="' + C_GRN + '" stroke-width="1.8"/>';
            inner += '<text x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle" font-size="15">🛡️</text>';
        });
        inner += '<circle cx="150" cy="88" r="16" fill="' + C_HL + '" fill-opacity="0.14" stroke="' + C_HL + '" stroke-width="1.8"/>';
        inner += '<text x="150" y="94" text-anchor="middle" font-size="16">🧒</text>';
        inner += tx(150, 148, '周圍的人有免疫，病原不容易傳到還不能打疫苗的人', 9, C_MLD);
        return svg('300 160', inner, '當周圍的人大多有免疫力時，病原不容易傳開，連還不能打疫苗或抵抗力較弱的人也比較受到保護');
    }
    /* =================== 課8：內分泌與荷爾蒙 =================== */
    // 內分泌腺→荷爾蒙隨血流→目標器官反應。
    function endocrineMessenger() {
        var inner = '';
        inner += tx(150, 14, '內分泌腺把荷爾蒙放進血液，送到目標器官', 10);
        inner += '<ellipse cx="46" cy="64" rx="24" ry="20" fill="' + C_HORM + '" fill-opacity="0.16" stroke="' + C_HORM + '" stroke-width="2.2"/>';
        inner += tx(46, 100, '內分泌腺', 9.5, C_HORM);
        inner += '<rect x="76" y="52" width="150" height="24" rx="12" fill="' + C_RESP + '" fill-opacity="0.1" stroke="' + C_RESP + '" stroke-width="1.4"/>';
        inner += tx(151, 44, '血液（血管）', 8.5, C_RESP);
        for (var i = 0; i < 5; i++)
            inner += dot(92 + i * 30, 64, C_HORM);
        inner += aR(214, 64, 14, C_HORM, 2.5);
        inner += '<rect x="232" y="46" width="46" height="38" rx="8" fill="' + C_GRN + '" fill-opacity="0.14" stroke="' + C_GRN + '" stroke-width="2"/>';
        inner += '<text x="255" y="73" text-anchor="middle" font-size="18">🫀</text>';
        inner += tx(255, 100, '目標器官', 9.5, C_GRN);
        inner += tx(150, 124, '荷爾蒙＝化學訊息，隨血流送到需要它的器官', 9.5, C_MLD);
        return svg('300 136', inner, '內分泌腺把荷爾蒙分泌到血液裡，荷爾蒙像化學訊息隨著血流送到全身，抵達目標器官讓它產生反應');
    }
    // 三個荷爾蒙例子：胰島素/生長激素/腎上腺素。
    function hormoneExamples() {
        var inner = '';
        inner += tx(150, 14, '荷爾蒙的例子', 11);
        var cols = [['🍬', '胰島素', '調節血糖'], ['📏', '生長激素', '幫助長高'], ['⚡', '腎上腺素', '緊張時心跳加快']];
        cols.forEach(function (c, i) {
            var x = 60 + i * 90;
            inner += '<circle cx="' + x + '" cy="52" r="24" fill="' + C_HORM + '" fill-opacity="0.12" stroke="' + C_HORM + '" stroke-width="2"/>';
            inner += '<text x="' + x + '" y="60" text-anchor="middle" font-size="22">' + c[0] + '</text>';
            inner += tx(x, 92, c[1], 10, C_HORM) + tx(x, 106, c[2], 8.5, C_MLD);
        });
        inner += tx(150, 128, '不同荷爾蒙負責不同的身體調節', 9.5, C_MLD);
        return svg('300 140', inner, '荷爾蒙的例子：胰島素調節血糖、生長激素幫助長高、腎上腺素在緊張時讓心跳加快，不同荷爾蒙負責不同的身體調節');
    }
    // 神經（快、短）vs 內分泌（慢、持久）兩種通訊系統對照。
    function nerveVsHormone() {
        var inner = '';
        inner += tx(150, 14, '兩種通訊系統：神經快、荷爾蒙慢但持久', 10);
        inner += tx(78, 36, '神經系統', 10.5, C_NUC);
        inner += '<text x="78" y="68" text-anchor="middle" font-size="24">⚡</text>';
        inner += tx(78, 92, '電訊號，快、短暫', 8.5, C_MLD);
        inner += tx(222, 36, '內分泌（荷爾蒙）', 10, C_HORM);
        inner += '<text x="222" y="68" text-anchor="middle" font-size="24">🩸</text>';
        inner += tx(222, 92, '隨血液，慢、持久', 8.5, C_MLD);
        inner += '<line x1="150" y1="28" x2="150" y2="100" stroke="' + C_MLD + '" stroke-width="1" stroke-dasharray="4 3" stroke-opacity="0.5"/>';
        inner += tx(150, 122, '兩者合作，調節身體各種運作', 9.5, C_MLD);
        return svg('300 134', inner, '神經系統用電訊號傳遞速度快但作用短暫，內分泌系統用荷爾蒙隨血液傳遞速度慢但作用持久，兩者合作調節身體運作');
    }
    /* =================== 課9：青春期與成長 =================== */
    // 腦（下視丘／腦下垂體）→性腺→性荷爾蒙→第二性徵。
    function pubertyBrainGonad() {
        var inner = '';
        inner += tx(150, 14, '青春期：腦送出訊號，身體開始成長', 10.5);
        inner += '<text x="48" y="60" text-anchor="middle" font-size="26">🧠</text>';
        inner += tx(48, 82, '腦（下視丘／', 8.5, C_NUC) + tx(48, 93, '腦下垂體）', 8.5, C_NUC);
        inner += aR(72, 52, 22, C_HORM, 3) + tx(84, 40, '訊號', 8, C_HORM);
        inner += '<circle cx="138" cy="52" r="22" fill="' + C_HORM + '" fill-opacity="0.14" stroke="' + C_HORM + '" stroke-width="2"/>';
        inner += tx(138, 56, '性腺', 9.5, C_HORM) + tx(138, 90, '分泌性荷爾蒙', 8.5, C_MLD);
        inner += aR(164, 52, 22, C_GRN, 3) + tx(176, 40, '荷爾蒙', 8, C_GRN);
        inner += '<rect x="200" y="32" width="88" height="46" rx="10" fill="' + C_GRN + '" fill-opacity="0.1" stroke="' + C_GRN + '" stroke-width="1.8"/>';
        inner += tx(244, 48, '第二性徵', 9.5, C_GRN) + tx(244, 62, '長高、聲音／', 8, C_MLD) + tx(244, 72, '體型變化等', 8, C_MLD);
        inner += tx(150, 112, '這是每個人都會經歷、正常又健康的成長', 9.5, C_GRN);
        return svg('300 124', inner, '青春期時腦的下視丘和腦下垂體送出訊號給性腺，性腺分泌性荷爾蒙，讓身體出現長高、聲音或體型變化等第二性徵，這是正常又健康的成長');
    }
    // 每個人節奏不同：成長軌起點不同、終點都健康（affirming、不排名、不比數字）。
    function diversePace() {
        var inner = '';
        inner += tx(150, 14, '每個人開始的時間、速度都不同，都正常', 10);
        var lanes = [['小雨', 40, C_CELL], ['阿哲', 88, C_GRN], ['小美', 20, C_DNA2], ['大寶', 66, C_HL]];
        lanes.forEach(function (l, i) {
            var y = 40 + i * 24;
            inner += tx(26, y + 4, l[0], 9, 'currentColor', 'start');
            inner += '<rect x="58" y="' + (y - 5) + '" width="190" height="10" rx="5" fill="' + C_MLD + '" fill-opacity="0.12"/>';
            var sx = 58 + l[1];
            inner += '<rect x="' + sx + '" y="' + (y - 5) + '" width="' + (248 - sx) + '" height="10" rx="5" fill="' + l[2] + '" fill-opacity="0.5"/>';
            inner += '<text x="258" y="' + (y + 4) + '" text-anchor="middle" font-size="11">✅</text>';
        });
        inner += tx(150, 142, '沒有「標準進度」——早一點或晚一點都健康', 9.5, C_HL);
        return svg('300 154', inner, '四個人的成長時間軸：每個人青春期開始的時間和速度都不同，有人早有人晚，但最後都健康地長大，沒有標準進度，早晚都正常');
    }
    // 身體與情緒都在變化、求助出口（非恐嚇、不是你的錯）。
    function changesCare() {
        var inner = '';
        inner += tx(150, 14, '身體和心情都在變，好好照顧自己', 10.5);
        var cards = [['🌱', '身體在成長', C_GRN], ['💭', '心情會起伏', C_HORM], ['🤝', '有疑問找人聊', C_WBC]];
        cards.forEach(function (c, i) {
            var x = 24 + i * 92;
            inner += '<rect x="' + x + '" y="32" width="84" height="60" rx="12" fill="' + c[2] + '" fill-opacity="0.1" stroke="' + c[2] + '" stroke-width="1.8"/>';
            inner += '<text x="' + (x + 42) + '" y="66" text-anchor="middle" font-size="24">' + c[0] + '</text>';
            inner += tx(x + 42, 85, c[1], 9, c[2]);
        });
        inner += tx(150, 112, '有疑問或不舒服，找信任的大人、老師、輔導老師或醫生', 9);
        inner += tx(150, 128, '這些變化都正常，不是你的錯，也不用覺得丟臉', 9, C_MLD);
        return svg('300 140', inner, '青春期身體在成長、心情也會起伏，都是正常的；有疑問或不舒服，可以找信任的大人、老師、輔導老師或醫生聊聊，這些變化都正常，不是你的錯');
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
                ] },
            { id: 'virus', name: '病毒與細菌', emoji: '🦠', color: '#dc2626', sub: '細菌是活細胞可自繁、病毒須寄生、抗生素只對細菌',
                done: '記得：細菌是活的單細胞，可以自己分裂繁殖；病毒不是細胞，必須侵入宿主細胞才能複製；抗生素只對細菌有效、對病毒沒用，一般感冒多是病毒，亂吃抗生素還會養出抗藥性。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '細菌：活的單細胞', svg: bacteriaCell(), text: '<b>細菌</b>是一種<b>活的單細胞</b>生物，有<b>細胞壁、細胞膜</b>和一圈<b>環狀 DNA</b>（但<b>沒有</b>真正的細胞核）。它可以<b>自己分裂繁殖</b>。細菌不全是壞的——有些是<b>益菌</b>（幫助消化、做發酵食品），有些才會<b>致病</b>。' },
                    { type: 'teach', kicker: '不一樣的病原', title: '病毒：不是細胞，要靠宿主', svg: virusHost(), text: '<b>病毒</b>比細菌<b>小很多</b>，而且<b>不是細胞</b>——它只是<b>蛋白質外殼</b>包著一段<b>遺傳物質</b>。病毒<b>自己不能繁殖</b>，一定要<b>侵入宿主細胞</b>，借用細胞裡的「工廠」才能<b>複製</b>出許多新病毒。' },
                    { type: 'teach', kicker: '比一比', title: '大小與構造大不同', svg: virusBacteriaCompare(), text: '整理一下：<b>細菌</b>是<b>細胞</b>、體型較大、能<b>自己繁殖</b>；<b>病毒</b>小很多、<b>不是細胞</b>、必須<b>靠宿主</b>才能複製。因為構造差這麼多，<b>對付它們的方法也不一樣</b>。' },
                    { type: 'teach', kicker: '重要觀念', title: '抗生素只對細菌有效', svg: antibioticViz(), text: '<b>抗生素</b>是靠破壞<b>細菌的構造</b>來消滅細菌，所以<b>只對細菌有效</b>。病毒沒有那些構造，<b>抗生素對病毒完全沒用</b>。一般<b>感冒</b>多是<b>病毒</b>引起，吃抗生素沒幫助，<b>濫用</b>還會養出<b>抗藥性細菌</b>。平常<b>勤洗手、生病時戴口罩</b>可以減少病原傳播。' },
                    { type: 'quiz', kicker: '換你試試', title: '病毒和細菌最大的不同是？', options: ['病毒不是細胞、要靠侵入宿主細胞才能複製', '病毒比較大', '細菌不會致病', '兩者完全相同'], answer: 0, why: '細菌是能自行繁殖的單細胞；病毒非細胞，必須寄生宿主細胞才能複製。', whyWrong: { 1: '病毒其實比細菌小很多，不是比較大。', 2: '細菌有些是益菌、有些會致病，不能說都不會致病。', 3: '兩者在構造、大小、能否自行繁殖上都差很多，並不相同。' } },
                    { type: 'quiz', kicker: '換你試試', title: '得了病毒性感冒，吃抗生素有用嗎？', options: ['沒有用，抗生素只對細菌有效', '很有用，能殺病毒', '能讓病毒變細菌', '一定要吃'], answer: 0, why: '抗生素作用於細菌結構，對病毒無效；濫用還會造成抗藥性。', whyWrong: { 1: '抗生素殺的是細菌，對病毒沒有效果。', 2: '抗生素不會也不可能把病毒變成細菌。', 3: '病毒性感冒不需要抗生素，亂吃反而有害。' } },
                    { type: 'quiz', kicker: '換你試試', title: '關於細菌，下列何者正確？', options: ['細菌是活的單細胞，可以自己分裂繁殖', '細菌全部都對人體有害', '細菌不是生物', '細菌一定比病毒小'], answer: 0, why: '細菌是能自行分裂繁殖的單細胞生物，有益菌也有致病菌。', whyWrong: { 1: '很多細菌是益菌，像腸道菌和發酵用的菌，並非全都有害。', 2: '細菌是活的單細胞生物，當然是生物。', 3: '細菌通常比病毒大很多，不是比較小。' } },
                    { type: 'quiz', kicker: '想一想', title: '病毒為什麼一定要「侵入宿主細胞」？', options: ['它自己不能繁殖，要借細胞的工廠複製', '它想找地方睡覺', '它要幫細胞工作', '它比細胞大，擠不進去'], answer: 0, why: '病毒不是細胞、沒有自己的繁殖機制，必須利用宿主細胞才能複製。', whyWrong: { 1: '病毒不是生物體那樣會休息，它進入細胞是為了複製。', 2: '病毒侵入是為了複製自己，不是幫細胞工作。', 3: '病毒比細胞小很多，不是因為太大。' } },
                    { type: 'quiz', kicker: '想一想', title: '下列哪個做法最能減少病原傳播？', options: ['勤洗手、生病時戴口罩', '從不洗手', '對著別人咳嗽', '和發燒的人共用餐具'], answer: 0, why: '勤洗手與戴口罩能擋住病原、減少傳播，是簡單有效的衛生習慣。', whyWrong: { 1: '不洗手會讓手上的病原更容易傳給別人或自己。', 2: '對著別人咳嗽會把病原噴出去，增加傳播。', 3: '共用餐具會把病原傳給別人，不利防疫。' } },
                    { type: 'quiz', kicker: '想一想', title: '為什麼不要亂吃抗生素？', options: ['濫用會養出抗藥性細菌，而且對病毒無效', '抗生素可以當糖果吃', '吃越多越健康', '抗生素能預防所有疾病'], answer: 0, why: '濫用抗生素會篩選出抗藥性細菌，日後更難治療；對病毒本來就沒用。', whyWrong: { 1: '抗生素是藥物，不能當零食亂吃。', 2: '吃越多不會越健康，反而增加抗藥性風險與副作用。', 3: '抗生素只對部分細菌有效，無法預防所有疾病。' } }
                ] },
            { id: 'immunity', name: '免疫與疫苗', emoji: '💉', color: '#2563eb', sub: '白血球防禦、免疫記憶、疫苗＝安全預演',
                done: '記得：白血球會辨識並清除入侵的病原；第一次遇到新病原反應慢，康復後留下免疫記憶，第二次會更快更強；疫苗是病原的無害版本，讓免疫系統先練習、產生記憶細胞與抗體，保護自己也保護身邊的人。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '免疫系統像保全', svg: whiteBloodCell(), text: '身體有一套<b>免疫系統</b>，像<b>保全</b>一樣巡邏。其中的<b>白血球</b>會<b>辨識</b>入侵的<b>病原</b>（細菌、病毒等），把它們<b>清除</b>掉，保護身體不被感染。' },
                    { type: 'teach', kicker: '身體會記住', title: '免疫記憶：第二次更快', svg: immuneMemory(), text: '第一次遇到<b>新病原</b>時，免疫系統要花<b>時間</b>學習，所以反應<b>慢又弱</b>，比較容易生病。康復後身體會留下<b>記憶細胞</b>。等<b>第二次</b>再遇到<b>同一種</b>病原，就能<b>又快又強</b>地反應，常常在發病前就擋下來。' },
                    { type: 'teach', kicker: '聰明的辦法', title: '疫苗＝安全的預演', svg: vaccineRehearsal(), text: '<b>疫苗</b>是把病原做成<b>無害版本</b>（減毒、去活化、片段，或用 mRNA 做出的<b>抗原</b>）。打疫苗等於讓免疫系統先<b>安全地練習</b>一次，<b>產生記憶細胞和抗體</b>。重點：<b>疫苗不會讓你得這個病</b>，而是讓身體先記住它。' },
                    { type: 'teach', kicker: '一起更安全', title: '保護自己也保護別人', svg: herdImmunity(), text: '當身邊<b>大多數人</b>都有免疫力時，病原就<b>不容易傳開</b>，連那些<b>還不能打疫苗</b>或抵抗力較弱的人也比較<b>受到保護</b>。所以免疫不只保護自己，也保護<b>整個群體</b>。（打不打某種疫苗的個別決定，交給醫生和家長討論。）' },
                    { type: 'quiz', kicker: '換你試試', title: '疫苗為什麼能保護我們？', options: ['先讓免疫系統認識病原的無害版本，產生記憶、下次更快反應', '直接把所有病毒殺光一輩子', '讓人永遠不會生任何病', '把病原變成食物'], answer: 0, why: '疫苗提供無害的抗原讓免疫系統預先學習、形成記憶細胞與抗體，之後遇到真病原能快速反應。', whyWrong: { 1: '疫苗不是去殺光病毒，而是訓練免疫系統先認識病原。', 2: '疫苗針對特定病原，不可能讓人永遠不生任何病。', 3: '疫苗是讓身體練習防禦，不是把病原變成食物。' } },
                    { type: 'quiz', kicker: '換你試試', title: '身體第二次遇到「同一種」已康復過的病原，通常會？', options: ['反應更快更有效（有免疫記憶）', '完全沒有抵抗力', '比第一次更慢', '立刻死亡'], answer: 0, why: '免疫記憶讓再次遭遇時更快產生大量抗體，常在發病前就擋下。', whyWrong: { 1: '康復後留下記憶細胞，不會變成完全沒有抵抗力。', 2: '有了記憶，第二次反而比第一次更快，不是更慢。', 3: '免疫記憶讓身體更能防禦，不會因此立刻死亡。' } },
                    { type: 'quiz', kicker: '換你試試', title: '身體裡負責辨識並清除入侵病原的是？', options: ['白血球（免疫系統）', '紅血球', '指甲', '頭髮'], answer: 0, why: '白血球是免疫系統的主力，會辨識並清除入侵的病原。', whyWrong: { 1: '紅血球主要負責運送氧氣，不負責清除病原。', 2: '指甲是保護構造，不能辨識或清除病原。', 3: '頭髮不具備免疫功能。' } },
                    { type: 'quiz', kicker: '想一想', title: '疫苗裡的「抗原」是什麼？', options: ['病原的無害版本，用來讓身體練習', '大量活的病毒', '一種抗生素', '糖水'], answer: 0, why: '疫苗的抗原是病原的無害版本，讓免疫系統安全地學習、產生記憶。', whyWrong: { 1: '疫苗不是打進大量會致病的活病毒。', 2: '疫苗不是抗生素；抗生素是用來對付細菌的藥。', 3: '抗原是用來訓練免疫系統的，不是單純的糖水。' } },
                    { type: 'quiz', kicker: '想一想', title: '打疫苗後，身體會產生什麼來幫助防禦？', options: ['記憶細胞和抗體', '更多病毒', '蛀牙', '近視'], answer: 0, why: '疫苗促使免疫系統產生記憶細胞與抗體，之後能快速反應。', whyWrong: { 1: '疫苗用的是無害抗原，不會讓身體產生更多病毒。', 2: '蛀牙和免疫防禦沒有關係。', 3: '近視和打疫苗沒有關係。' } },
                    { type: 'quiz', kicker: '想一想', title: '當周圍大多數人都有免疫力時？', options: ['病原不容易傳開，也保護還不能打疫苗的人', '病原傳得更快', '大家都會生病', '完全沒有影響'], answer: 0, why: '周圍的人有免疫力時病原不易傳播，連脆弱的人也較受保護。', whyWrong: { 1: '大家有免疫力時，病原反而更難傳開。', 2: '有免疫力的人多，整體生病的機會會下降。', 3: '群體的免疫力會明顯影響病原傳播，不是沒有影響。' } }
                ] },
            { id: 'endocrine', name: '內分泌與荷爾蒙', emoji: '🧪', color: '#0891b2', sub: '荷爾蒙＝隨血液傳遞的化學訊息、神經 vs 內分泌',
                done: '記得：內分泌腺分泌的「荷爾蒙（激素）」是化學訊息，隨血液送到目標器官；例子有胰島素調血糖、生長激素幫助長高、腎上腺素讓心跳加快；和神經系統一樣是通訊系統，但荷爾蒙比較慢、作用較久。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '荷爾蒙：身體的化學訊息', svg: endocrineMessenger(), text: '身體裡有一些<b>內分泌腺</b>，會分泌<b>荷爾蒙（激素）</b>。荷爾蒙像一種<b>化學訊息</b>，被放進<b>血液</b>裡，隨著<b>血流</b>送到全身，抵達<b>目標器官</b>讓它產生反應。' },
                    { type: 'teach', kicker: '舉幾個例子', title: '常見的荷爾蒙', svg: hormoneExamples(), text: '幾個例子：<b>胰島素</b>幫忙<b>調節血糖</b>；<b>生長激素</b>幫助<b>長高</b>；<b>腎上腺素</b>在你<b>緊張或害怕</b>時讓<b>心跳加快</b>、準備應付狀況。不同荷爾蒙負責不同的身體調節。' },
                    { type: 'teach', kicker: '比一比', title: '神經 vs 內分泌', svg: nerveVsHormone(), text: '身體有<b>兩套通訊系統</b>：<b>神經系統</b>用<b>電訊號</b>傳遞，<b>速度快</b>但作用<b>短暫</b>（像馬上縮手）；<b>內分泌系統</b>用<b>荷爾蒙</b>隨<b>血液</b>傳遞，<b>速度慢</b>但作用<b>持久</b>。兩者<b>合作</b>調節身體的各種運作。' },
                    { type: 'quiz', kicker: '換你試試', title: '荷爾蒙（激素）是靠什麼送到全身的？', options: ['血液', '骨頭', '空氣', '神經電流直接送'], answer: 0, why: '內分泌腺把荷爾蒙分泌到血液，隨血流運送到目標器官。', whyWrong: { 1: '骨頭不是運送荷爾蒙的管道。', 2: '荷爾蒙在體內靠血液運送，不是靠空氣。', 3: '荷爾蒙隨血液運送；神經電流是另一套系統，不是直接送荷爾蒙。' } },
                    { type: 'quiz', kicker: '換你試試', title: '下列何者是荷爾蒙的作用例子？', options: ['胰島素調節血糖', '牙齒咀嚼食物', '頭髮擋太陽', '指甲保護手指'], answer: 0, why: '胰島素是胰臟分泌、調節血糖的荷爾蒙。', whyWrong: { 1: '咀嚼是牙齒的機械作用，不是荷爾蒙的作用。', 2: '頭髮擋太陽是物理遮蔽，和荷爾蒙無關。', 3: '指甲保護手指是構造功能，不是荷爾蒙調節。' } },
                    { type: 'quiz', kicker: '換你試試', title: '分泌荷爾蒙的腺體屬於哪個系統？', options: ['內分泌系統', '骨骼系統', '只負責消化的系統', '都不是'], answer: 0, why: '分泌荷爾蒙的腺體屬於內分泌系統，負責用化學訊息調節身體。', whyWrong: { 1: '骨骼系統負責支撐與保護，不是分泌荷爾蒙的系統。', 2: '分泌荷爾蒙的是內分泌腺，不是單純的消化系統。', 3: '它確實屬於內分泌系統，並非都不是。' } },
                    { type: 'quiz', kicker: '想一想', title: '比較神經和荷爾蒙的傳遞，下列最正確的是？', options: ['神經快而短暫，荷爾蒙慢但持久', '兩者完全一樣', '荷爾蒙用電訊號', '神經靠血液運送'], answer: 0, why: '神經用電訊號快但短暫，荷爾蒙隨血液慢但作用持久。', whyWrong: { 1: '兩者速度與持續時間不同，並非完全一樣。', 2: '用電訊號的是神經；荷爾蒙是化學訊息。', 3: '靠血液運送的是荷爾蒙；神經用的是電訊號。' } },
                    { type: 'quiz', kicker: '想一想', title: '「緊張時心跳加快」和哪種荷爾蒙最有關？', options: ['腎上腺素', '生長激素', '胰島素', '都沒關係'], answer: 0, why: '腎上腺素在緊張、害怕時分泌，讓心跳加快以準備應付狀況。', whyWrong: { 1: '生長激素主要和長高有關，不是讓心跳加快。', 2: '胰島素主要調節血糖，不是緊張時加快心跳。', 3: '心跳加快確實和腎上腺素有關，不是都沒關係。' } },
                    { type: 'quiz', kicker: '想一想', title: '荷爾蒙在身體裡扮演的角色最接近？', options: ['傳遞訊息的化學訊號', '建造骨頭的材料', '消化食物的牙齒', '保護身體的皮膚'], answer: 0, why: '荷爾蒙是化學訊息，隨血液傳遞、調節目標器官的運作。', whyWrong: { 1: '建造骨頭靠鈣等材料，不是荷爾蒙本身的角色。', 2: '消化食物是牙齒和消化器官的工作，不是荷爾蒙。', 3: '保護身體是皮膚的功能，荷爾蒙是傳遞訊息的化學訊號。' } }
                ] },
            { id: 'puberty', name: '青春期與成長', emoji: '🌱', color: '#16a34a', sub: '荷爾蒙帶來的正常成長、每個人節奏不同都正常',
                done: '記得：青春期時腦（下視丘／腦下垂體）送訊號給性腺，分泌性荷爾蒙，身體出現第二性徵，這是正常又健康的成長；每個人開始的時間和速度都不同，早一點或晚一點都正常，沒有標準進度；有疑問或不舒服，找信任的大人、老師、輔導老師或醫生聊聊。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '青春期：荷爾蒙啟動的成長', svg: pubertyBrainGonad(), text: '到了<b>青春期</b>，腦裡的<b>下視丘</b>和<b>腦下垂體</b>會送出<b>訊號</b>給<b>性腺</b>，性腺開始分泌<b>性荷爾蒙</b>。身體因此慢慢出現<b>第二性徵</b>（像長高、聲音或體型變化等）。<b>這是每個人都會經歷、正常又健康的成長</b>。' },
                    { type: 'teach', kicker: '很重要', title: '每個人的節奏都不同', svg: diversePace(), text: '<b>每個人開始青春期的時間和速度都不一樣</b>——有人早、有人晚，<b>都正常</b>。<b>沒有所謂「標準進度」</b>，<b>早一點或晚一點都在健康範圍</b>。不需要和別人比較，也不用因為快一點或慢一點而擔心或難過。' },
                    { type: 'teach', kicker: '照顧好自己', title: '身體和心情都在變', svg: changesCare(), text: '青春期不只<b>身體</b>在變，<b>心情</b>也可能比較起伏，這些<b>都很正常，不是你的錯，也不用覺得丟臉</b>。有<b>疑問或不舒服</b>，可以找<b>信任的大人、老師、輔導老師或醫生</b>聊聊。想多了解<b>身體界線與自主</b>可以看 <a href="body_safety.html">身體安全</a>；想練習<b>照顧情緒</b>可以看 <a href="emotion_skills.html">情緒練習</a>。' },
                    { type: 'quiz', kicker: '換你試試', title: '關於青春期開始的時間，下列最正確的是？', options: ['每個人節奏不同，早一點或晚一點都正常', '大家一定同時開始', '越早越好', '越晚代表身體有問題'], answer: 0, why: '青春期由荷爾蒙啟動，個別差異大，早晚都在健康範圍，沒有標準進度。', whyWrong: { 1: '每個人的節奏不同，不會大家同時開始。', 2: '青春期不是越早越好，早晚都正常，不需要比快。', 3: '晚一點開始也在健康範圍，不代表身體有問題。' } },
                    { type: 'quiz', kicker: '換你試試', title: '青春期出現的身體變化（如長高、聲音改變）主要是因為？', options: ['性荷爾蒙的作用', '吃太多糖', '睡太少', '運動太多'], answer: 0, why: '腦下垂體促使性腺分泌性荷爾蒙，引發第二性徵等正常成長變化。', whyWrong: { 1: '吃糖多寡不是青春期第二性徵的原因。', 2: '睡眠不足不是造成第二性徵的原因。', 3: '運動多寡不是引發第二性徵的原因。' } },
                    { type: 'quiz', kicker: '換你試試', title: '青春期時，是哪裡送出訊號讓性腺分泌性荷爾蒙？', options: ['腦（下視丘與腦下垂體）', '牙齒', '指甲', '頭髮'], answer: 0, why: '下視丘與腦下垂體送出訊號給性腺，性腺才開始分泌性荷爾蒙。', whyWrong: { 1: '牙齒負責咀嚼，不會送這種訊號。', 2: '指甲是保護構造，不參與荷爾蒙訊號。', 3: '頭髮不會送出啟動性腺的訊號。' } },
                    { type: 'quiz', kicker: '想一想', title: '青春期的身體變化應該被看成？', options: ['正常又健康的成長', '奇怪又丟臉的事', '一種疾病', '需要隱瞞的祕密'], answer: 0, why: '青春期的變化是每個人都會經歷的正常成長，健康而自然。', whyWrong: { 1: '這是自然成長，不是奇怪或丟臉的事。', 2: '青春期的變化是正常發育，不是疾病。', 3: '這是正常成長，有疑問時找信任的人聊聊，不需要隱瞞。' } },
                    { type: 'quiz', kicker: '想一想', title: '青春期有身體或心情上的疑問時，最好的做法是？', options: ['找信任的大人、老師、輔導老師或醫生聊聊', '自己憋著不講', '相信網路上的謠言', '覺得是自己的錯而難過'], answer: 0, why: '遇到疑問找信任的大人或專業的人討論，才能得到正確又安心的幫助。', whyWrong: { 1: '憋著不講不會解決疑問，說出來才能得到幫助。', 2: '網路謠言常常不正確，應該找可信任的人確認。', 3: '這些變化都正常，不是你的錯，不需要為此難過。' } },
                    { type: 'quiz', kicker: '想一想', title: '看到同學發育得比自己快或慢，正確的想法是？', options: ['每個人節奏不同，都在健康範圍，不需要比較', '發育快的比較厲害', '發育慢的有問題', '應該取笑對方'], answer: 0, why: '每個人的成長節奏不同，都在健康範圍，彼此尊重、不需要比較。', whyWrong: { 1: '發育快慢只是節奏不同，不代表誰比較厲害。', 2: '發育慢也在健康範圍，不代表有問題。', 3: '取笑別人的身體是不尊重，應該彼此體諒與尊重。' } }
                ] }
        ]
    };
})();
