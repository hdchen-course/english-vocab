/* =====================================================================
 * social_advanced_concepts.ts  →  (tsc, tsconfig.legacy.json) →  social_advanced_concepts.js
 * 進階社會・觀念養成頁的教學資料（window.CONCEPT）＋專用 SVG 概念圖 helper。
 * 國中／高中 teach-first 概念頁：補中學段「只有 keyFacts、缺 teach-first 動畫觀念頁」缺口，
 *   與 social_advanced.html（game）形成「先學觀念 → 再闖關」。單一 window.CONCEPT 承載三個群組：
 *     1. 台灣史因果鏈（twh_）     — playable Anim.causalChain（mode:'cause'，遞進節點數 3→4→6）
 *     2. 世界地理與讀圖（geo_）   — playable Anim.worldLocator（洲別定位，cycle）＋ stepped/static SVG
 *     3. 政府與公民（civ_）       — Anim.causalChain（mode:'flow'，法案流程）＋ static SVG
 * 載入順序（鏡像 earth_science_concepts.html）：game_core.js → 本檔 → anim_core.js → concept_engine.js
 *   （本檔提供 window.CONCEPT；mount 於執行期才用 window.Anim，故解析順序無虞）。
 * 以 IIFE 包住：讓 helper 函式為檔案區域（避免與其他已遷移頁同名 helper 在 tsconfig.legacy
 *   共用全域型別檢查時 TS2393 衝突）。helper 只在建 window.CONCEPT 時同步呼叫。
 * 內容中性鐵則：繁體中文（台灣用詞）；中國 not 大陸（地理「亞洲大陸」保留）；史實優先、政治中立、
 *   哀矜勿喜；二二八採 trauma-informed 陳述；兒少權利守保護性框架、求助＝老師或輔導老師＋113/110。
 * ===================================================================== */
(function () {
    // ---- SVG 原語（text 用 currentColor＝--ink 隨主題自適應；色塊上的文字用固定色，因色塊不隨主題變）----
    function animCanvas(w, h, label) {
        return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
            'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
    }
    function R(x, y, w, h, fill, o) {
        o = o || {};
        return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (o.r != null ? o.r : 8) +
            '" fill="' + (fill || 'none') + '"' + (o.op != null ? ' fill-opacity="' + o.op + '"' : '') +
            (o.stroke ? ' stroke="' + o.stroke + '" stroke-width="' + (o.sw || 1.5) + '"' : '') +
            (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + '/>';
    }
    function T(x, y, s, c, sz, an, w) {
        return '<text x="' + x + '" y="' + y + '" text-anchor="' + (an || 'middle') + '" font-size="' + (sz || 12) +
            '" font-weight="' + (w || 700) + '" fill="' + (c || 'currentColor') + '">' + s + '</text>';
    }
    function ARR(x1, y1, x2, y2, c, w) {
        var ang = Math.atan2(y2 - y1, x2 - x1), hl = 7;
        var hx1 = x2 - hl * Math.cos(ang - 0.5), hy1 = y2 - hl * Math.sin(ang - 0.5);
        var hx2 = x2 - hl * Math.cos(ang + 0.5), hy2 = y2 - hl * Math.sin(ang + 0.5);
        return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + c +
            '" stroke-width="' + (w || 2) + '" stroke-linecap="round"/>' +
            '<polygon points="' + x2 + ',' + y2 + ' ' + hx1.toFixed(1) + ',' + hy1.toFixed(1) + ' ' + hx2.toFixed(1) + ',' + hy2.toFixed(1) + '" fill="' + c + '"/>';
    }
    function SVG(vb, aria, body) {
        return '<svg viewBox="' + vb + '" role="img" aria-label="' + aria + '">' + body + '</svg>';
    }
    // 色票（色塊上的文字一律用深色 INK 或白，確保日/夜模式皆可讀；透明底文字才用 currentColor）
    var SU = '#b45309', INK = '#1f2937', COLD = '#93c5fd', TEMP = '#86efac', HOT = '#fca5a5';
    // ============ 群組 1：台灣史 — static SVG（因果鏈本身用 Anim.causalChain）============
    // 政權交接：日本統治(約50年) →1945終戰→ 中華民國政府接管
    function handover() {
        var b = T(150, 16, '1945：政權的交接', 'currentColor', 12);
        b += R(16, 36, 100, 50, '#cbd5e1', { stroke: '#94a3b8' });
        b += T(66, 58, '日本統治', INK, 12);
        b += T(66, 74, '約 50 年', INK, 10);
        b += ARR(120, 61, 182, 61, SU, 2.5);
        b += T(151, 50, '1945 終戰', SU, 10);
        b += R(186, 36, 112, 50, '#fde68a', { stroke: '#f59e0b' });
        b += T(242, 56, '中華民國政府', INK, 11);
        b += T(242, 72, '接管台灣', INK, 11);
        return SVG('0 0 314 100', '1945 年第二次世界大戰結束，日本結束在台灣約五十年的統治，由中華民國政府接管台灣。', b);
    }
    // 戰後社會壓力：三個來源 → 社會壓力累積
    function pressure() {
        var srcs = [['📈', '物價飛漲'], ['📦', '物資短缺'], ['🔤', '制度與語言轉換']];
        var b = T(157, 16, '戰後初期：社會壓力累積', 'currentColor', 12);
        for (var i = 0; i < 3; i++) {
            var x = 14 + i * 104;
            b += R(x, 30, 94, 44, '#fed7aa', { stroke: '#fb923c' });
            b += T(x + 47, 50, srcs[i][0], INK, 18);
            b += T(x + 47, 68, srcs[i][1], INK, 10);
            b += ARR(x + 47, 76, 157, 110, '#b45309', 1.8);
        }
        b += R(92, 112, 130, 36, SU, { r: 10 });
        b += T(157, 135, '社會壓力累積', '#ffffff', 12);
        return SVG('0 0 314 158', '戰後初期物價飛漲、物資短缺、制度與語言快速轉換，這些壓力累積成後來衝突的背景。', b);
    }
    // 水平因果 chip 列（戰後 → 遷台 脈絡的靜態輔助圖）
    function rowChain(items, aria) {
        var n = items.length, cw = 86, gap = 20, total = n * cw + (n - 1) * gap, x0 = (320 - total) / 2;
        var b = '';
        for (var i = 0; i < n; i++) {
            var x = x0 + i * (cw + gap);
            b += R(x, 34, cw, 44, '#e9d5ff', { stroke: '#a78bfa' });
            var lines = items[i].split('|');
            if (lines.length > 1) {
                b += T(x + cw / 2, 52, lines[0], INK, 11);
                b += T(x + cw / 2, 68, lines[1], INK, 11);
            }
            else
                b += T(x + cw / 2, 60, items[i], INK, 11);
            if (i < n - 1)
                b += ARR(x + cw + 2, 56, x + cw + gap - 2, 56, '#7c3aed', 2.2);
        }
        return SVG('0 0 320 108', aria, b);
    }
    // 二二八（1947）：trauma-informed 時間軸標記
    function traumaTimeline() {
        var b = T(160, 16, '歷史的傷痕：二二八事件（1947）', 'currentColor', 11);
        b += '<line x1="20" y1="56" x2="300" y2="56" stroke="currentColor" stroke-opacity="0.4" stroke-width="2"/>';
        var yrs = [['1945', 68], ['1947', 160], ['1949', 252]];
        for (var i = 0; i < 3; i++) {
            var x = yrs[i][1];
            b += '<circle cx="' + x + '" cy="56" r="' + (i === 1 ? 7 : 4) + '" fill="' + (i === 1 ? '#be123c' : '#94a3b8') + '"/>';
            b += T(x, 44, yrs[i][0], 'currentColor', 10);
        }
        b += T(160, 86, '二二八事件', '#be123c', 12);
        b += T(160, 104, '以哀矜、尊重史實的態度記得', 'currentColor', 10);
        b += T(160, 120, '重點在記取教訓、守護人權與對話', 'currentColor', 10);
        return SVG('0 0 320 132', '一條時間軸上標出 1947 年的二二八事件；以哀矜、尊重史實的態度理解，重點在記取教訓、守護人權與對話。', b);
    }
    // 戒嚴／解嚴：自由被限制 vs 逐漸開放（以 locked 參數共用）
    function martialLaw(locked) {
        var items = ['言論', '集會', '組黨'];
        var head = locked ? '戒嚴時期（1949–1987）' : '解除戒嚴（1987 之後）';
        var mark = locked ? '🔒' : '🔓';
        var col = locked ? '#94a3b8' : '#86efac';
        var b = T(150, 16, head, 'currentColor', 12);
        for (var i = 0; i < 3; i++) {
            var x = 20 + i * 100;
            b += R(x, 34, 88, 52, col, { stroke: locked ? '#64748b' : '#22c55e' });
            b += T(x + 44, 58, mark, INK, 20);
            b += T(x + 44, 78, items[i], INK, 11);
        }
        b += T(150, 108, locked ? '人民的言論、集會、組黨等自由受到限制' : '言論與結社逐漸開放，是民主化的重要一步', 'currentColor', 10);
        return SVG('0 0 300 124', locked ? '戒嚴時期人民的言論、集會、組黨等自由受到限制。' : '一九八七年解除戒嚴後，言論與結社逐漸開放。', b);
    }
    // ============ 群組 2：世界地理與讀圖 — static / stepped SVG（洲別定位用 Anim.worldLocator）============
    // 七大洲、五大洋 框架清單
    function continentsFrame() {
        var conts = ['亞洲（最大）', '非洲', '歐洲', '北美洲', '南美洲', '大洋洲', '南極洲'];
        var oceans = ['太平洋（最大）', '大西洋', '印度洋', '北冰洋', '南冰洋'];
        var b = T(80, 18, '七大洲', SU, 13);
        b += T(238, 18, '五大洋', '#0369a1', 13);
        for (var i = 0; i < conts.length; i++)
            b += T(80, 40 + i * 20, '• ' + conts[i], 'currentColor', 11);
        for (var j = 0; j < oceans.length; j++)
            b += T(238, 40 + j * 20, '• ' + oceans[j], 'currentColor', 11);
        b += '<line x1="160" y1="28" x2="160" y2="180" stroke="currentColor" stroke-opacity="0.2" stroke-width="1"/>';
        return SVG('0 0 320 190', '陸地分七大洲：亞洲（最大）、非洲、歐洲、北美洲、南美洲、大洋洲、南極洲；海洋分五大洋，太平洋最大。', b);
    }
    // 相對位置三線索：洲別・半球・鄰海（例：台灣）
    function relPosition() {
        var clues = [['🗺️', '哪一洲'], ['🌐', '哪個半球'], ['🌊', '鄰近哪個大洋']];
        var b = T(150, 16, '用三個線索描述「相對位置」', 'currentColor', 12);
        for (var i = 0; i < 3; i++) {
            var x = 16 + i * 96;
            b += R(x, 30, 88, 48, '#bae6fd', { stroke: '#38bdf8' });
            b += T(x + 44, 52, clues[i][0], INK, 18);
            b += T(x + 44, 70, clues[i][1], INK, 10);
        }
        b += R(40, 94, 240, 36, SU, { r: 10 });
        b += T(160, 117, '例：台灣在亞洲東緣・北半球・面向太平洋', '#ffffff', 10);
        return SVG('0 0 300 142', '用洲別、半球、鄰近大洋三個線索描述相對位置；例如台灣在亞洲東緣、北半球、面向太平洋。', b);
    }
    // 氣候帶（stepped）：從兩極到赤道三帶；step2 疊緯線與台灣；step3 疊影響因素
    function climateZones(step) {
        var x = 86, w = 120, y0 = 24, bh = 27;
        var bands = [['寒帶', COLD], ['溫帶', TEMP], ['熱帶', HOT], ['溫帶', TEMP], ['寒帶', COLD]];
        var b = T(150, 16, '從兩極到赤道的氣候帶', 'currentColor', 12);
        for (var i = 0; i < 5; i++) {
            var yy = y0 + i * bh;
            b += R(x, yy, w, bh, bands[i][1], { r: 0, stroke: '#ffffff', sw: 1 });
            b += T(x + w / 2, yy + bh / 2 + 4, bands[i][0], INK, 12);
        }
        b += T(x - 8, y0 + 12, '北極', 'currentColor', 9, 'end');
        b += T(x - 8, y0 + 5 * bh - 2, '南極', 'currentColor', 9, 'end');
        if (step >= 2) {
            var eqY = y0 + 2.5 * bh, trY = y0 + 2 * bh, pcY = y0 + 1 * bh;
            b += '<line x1="' + (x - 4) + '" y1="' + eqY + '" x2="' + (x + w + 4) + '" y2="' + eqY + '" stroke="#b91c1c" stroke-width="1.5" stroke-dasharray="4 3"/>';
            b += T(x + w + 8, eqY + 4, '赤道 0°', '#b91c1c', 9, 'start');
            b += '<line x1="' + (x - 4) + '" y1="' + trY + '" x2="' + (x + w + 4) + '" y2="' + trY + '" stroke="#b45309" stroke-width="1.5" stroke-dasharray="4 3"/>';
            b += T(x + w + 8, trY + 4, '北回歸線 23.5°', '#b45309', 9, 'start');
            b += '<line x1="' + (x - 4) + '" y1="' + pcY + '" x2="' + (x + w + 4) + '" y2="' + pcY + '" stroke="#0369a1" stroke-width="1" stroke-dasharray="3 3"/>';
            b += T(x + w + 8, pcY + 4, '極圈', '#0369a1', 9, 'start');
            b += '<circle cx="' + (x + w * 0.5) + '" cy="' + (trY + 4) + '" r="4" fill="#0f172a"/>';
            b += T(x + w * 0.5, trY + 20, '台灣', '#0f172a', 9);
        }
        if (step >= 3)
            b += T(150, 178, '氣候還受 🌊海洋・⛰️地形・🌬️季風 影響，不只看緯度', 'currentColor', 10);
        return SVG('0 0 300 190', '一條從北極到南極的剖面，依序分成寒帶、溫帶、熱帶、溫帶、寒帶；北回歸線（約北緯 23.5 度）通過台灣，使台灣跨亞熱帶與熱帶；氣候還受海洋、地形、季風影響。', b);
    }
    // 經緯度與時區（stepped）：step1 緯線；step2 疊經線；step3 讀座標＋時區色帶
    function coordGrid(step) {
        var gx = 50, gy = 36, gw = 150, gh = 120;
        var b = T(150, 16, '經緯度：地球上任一點的「地址」', 'currentColor', 12);
        b += R(gx, gy, gw, gh, 'rgba(90,160,210,0.12)', { r: 6, stroke: 'currentColor' });
        for (var i = 1; i < 5; i++) {
            var yy = gy + i * gh / 5;
            b += '<line x1="' + gx + '" y1="' + yy + '" x2="' + (gx + gw) + '" y2="' + yy + '" stroke="currentColor" stroke-opacity="0.25" stroke-width="1"/>';
        }
        var eqY = gy + gh / 2;
        b += '<line x1="' + gx + '" y1="' + eqY + '" x2="' + (gx + gw) + '" y2="' + eqY + '" stroke="#b91c1c" stroke-width="1.5"/>';
        b += T(gx + gw + 6, eqY + 4, '赤道 0°（緯線）', '#b91c1c', 9, 'start');
        if (step >= 2) {
            for (var j = 1; j < 5; j++) {
                var xx = gx + j * gw / 5;
                b += '<line x1="' + xx + '" y1="' + gy + '" x2="' + xx + '" y2="' + (gy + gh) + '" stroke="currentColor" stroke-opacity="0.25" stroke-width="1"/>';
            }
            var pmX = gx + gw / 2;
            b += '<line x1="' + pmX + '" y1="' + gy + '" x2="' + pmX + '" y2="' + (gy + gh) + '" stroke="#15803d" stroke-width="1.5"/>';
            b += T(pmX, gy - 2, '本初子午線 0°（格林威治）', '#15803d', 8);
        }
        if (step >= 3) {
            var px = gx + gw * 0.7, py = gy + gh * 0.3;
            b += '<circle cx="' + px + '" cy="' + py + '" r="5" fill="#be123c"/>';
            b += '<line x1="' + gx + '" y1="' + py + '" x2="' + px + '" y2="' + py + '" stroke="#be123c" stroke-width="1" stroke-dasharray="3 2"/>';
            b += '<line x1="' + px + '" y1="' + (gy + gh) + '" x2="' + px + '" y2="' + py + '" stroke="#be123c" stroke-width="1" stroke-dasharray="3 2"/>';
            b += T(px + 8, py - 6, '讀法：緯度先、經度後', '#be123c', 8, 'start');
            b += R(gx, gy + gh + 10, gw, 16, '#fde68a', { r: 4 });
            b += T(gx + gw / 2, gy + gh + 22, '時區大致沿經線劃分（往東較早）', INK, 9);
        }
        return SVG('0 0 300 ' + (step >= 3 ? 190 : 170), '地球網格：橫的緯線量南北（赤道 0°）、直的經線量東西（本初子午線 0° 通過英國格林威治）；緯度加經度能唯一定位任一點；時區大致沿經線劃分。', b);
    }
    // 進階讀圖：等高線（密＝陡、疏＝緩、一圈圈往內升高是山頂）
    function contourMap() {
        var cx = 150, cy = 92;
        var b = T(150, 16, '等高線：把同高度的點連起來', 'currentColor', 12);
        // 左密（陡）、右疏（緩）的同心封閉曲線
        var rs = [14, 24, 34, 46, 60, 76];
        for (var i = rs.length - 1; i >= 0; i--) {
            var rx = rs[i], ry = rs[i] * 0.62;
            b += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="none" stroke="#b45309" stroke-opacity="' + (0.4 + i * 0.1) + '" stroke-width="1.5"/>';
        }
        b += T(cx, cy + 4, '山頂', '#92400e', 10);
        b += ARR(70, 150, 110, 128, '#be123c', 1.8);
        b += T(64, 158, '線密＝坡陡', '#be123c', 10, 'start');
        b += ARR(250, 150, 206, 120, '#15803d', 1.8);
        b += T(256, 158, '線疏＝坡緩', '#15803d', 10, 'end');
        return SVG('0 0 300 170', '一座山的等高線：越往內一圈圈升高是山頂；等高線擠得密代表坡陡，疏代表坡緩。', b);
    }
    // 比例尺與圖例
    function scaleLegend() {
        var b = T(150, 16, '比例尺與圖例：讀圖的鑰匙', 'currentColor', 12);
        // 比例尺
        b += R(40, 44, 120, 12, '#f1f5f9', { r: 2, stroke: '#94a3b8' });
        for (var i = 0; i < 4; i++)
            b += R(40 + i * 30, 44, 30, 12, i % 2 ? '#1f2937' : '#ffffff', { r: 0, stroke: '#94a3b8', sw: 1 });
        b += T(100, 74, '比例尺：圖上 1 公分 ＝ 實際多少公里', 'currentColor', 10);
        // 圖例
        b += R(40, 92, 14, 14, '#2563eb', { r: 3 });
        b += T(62, 103, '河流', 'currentColor', 10, 'start');
        b += R(40, 114, 14, 14, '#16a34a', { r: 3 });
        b += T(62, 125, '公園／綠地', 'currentColor', 10, 'start');
        b += R(180, 92, 14, 14, '#b45309', { r: 3 });
        b += T(202, 103, '道路', 'currentColor', 10, 'start');
        b += R(180, 114, 14, 14, '#be123c', { r: 3 });
        b += T(202, 125, '重要地標', 'currentColor', 10, 'start');
        b += T(150, 150, '圖例說明每個符號、顏色代表什麼', 'currentColor', 10);
        return SVG('0 0 300 164', '比例尺告訴你圖上一段距離等於實際多少；圖例說明地圖上各種符號與顏色代表的意義。', b);
    }
    // 主題圖：色階 ＋「先讀圖例」
    function thematicMap() {
        var b = T(150, 16, '主題圖：用顏色深淺表達資料', 'currentColor', 12);
        var cols = ['#fee2e2', '#fca5a5', '#ef4444', '#991b1b'];
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < 3; j++) {
                var idx = (i + j) % 4;
                b += R(40 + i * 44, 34 + j * 30, 42, 28, cols[idx], { r: 2, stroke: '#ffffff', sw: 1 });
            }
        }
        // 圖例色階
        b += T(230, 44, '圖例', 'currentColor', 10, 'start');
        for (var k = 0; k < 4; k++)
            b += R(230, 50 + k * 20, 16, 16, cols[k], { r: 3 });
        b += T(252, 62, '少', 'currentColor', 9, 'start');
        b += T(252, 122, '多', 'currentColor', 9, 'start');
        b += T(150, 160, '讀主題圖前先看「標題＋圖例」才不會誤讀', '#be123c', 10);
        return SVG('0 0 300 174', '一張人口分布之類的主題圖，用顏色深淺代表資料多少；閱讀前要先看標題與圖例，才知道深淺代表的意義。', b);
    }
    // ============ 群組 3：政府與公民 — static SVG（法案流程用 Anim.causalChain mode:flow）============
    // 五院分工組織圖（stepped）：step1 五院；step2 疊總統與地方；step3 疊制衡箭頭
    function govChart(step) {
        var yuan = [['行政院', '執行'], ['立法院', '立法'], ['司法院', '審判'], ['考試院', '考選'], ['監察院', '監督']];
        // 間隔加寬（gap 14 > 原 4），讓 step3 的制衡符號能完全落在院與院之間的空白、不越界到方塊文字。
        var bw = 48, gap = 14, x0 = 12, y = 78;
        var b = T(160, 16, '中央政府：五院分工', 'currentColor', 12);
        if (step >= 2) {
            b += R(120, 30, 80, 28, SU, { r: 8 });
            b += T(160, 48, '總統（國家元首）', '#ffffff', 10);
            b += '<line x1="160" y1="58" x2="160" y2="76" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.5"/>';
        }
        for (var i = 0; i < 5; i++) {
            var x = x0 + i * (bw + gap);
            b += R(x, y, bw, 46, '#e9d5ff', { stroke: '#a78bfa' });
            b += T(x + bw / 2, y + 20, yuan[i][0], INK, 10);
            b += T(x + bw / 2, y + 37, yuan[i][1], INK, 9);
        }
        if (step >= 2) {
            b += R(100, 142, 120, 28, '#bae6fd', { stroke: '#38bdf8' });
            b += T(160, 160, '地方政府（縣市）・在地事務', INK, 9);
        }
        if (step >= 3) {
            // 制衡以「⇄」符號置於每兩院之間的空白間隔「正中央」（font 13 半寬≈6.5 < 間隔 14／2＝7，
            // 兩側皆留餘裕，不進入任何方塊、不壓到院名／職掌文字）。四個 ⇄ 串起整列＝彼此監督、互相制衡，
            // 避開了「窄間隔塞不下箭頭頭部而越界到方塊內」的幾何缺陷（Defect class #29）。
            for (var g = 0; g < 4; g++) {
                var gc = x0 + g * (bw + gap) + bw + gap / 2; // 第 g、g+1 院之間的間隔中心
                b += T(gc, y + 27, '⇄', '#be123c', 13);
            }
            b += T(160, 134, '權力分立與制衡：彼此監督，避免權力集中', '#be123c', 9);
        }
        return SVG('0 0 320 ' + (step >= 2 ? 180 : 134), '中央政府分五院：行政院（執行）、立法院（制定法律、審預算）、司法院（依法審判）、考試院（文官考選）、監察院（監督糾彈）；總統是國家元首，地方政府處理在地事務；權力分立與制衡避免權力集中。', b);
    }
    // 法案起點：發現問題 → 提案
    function billStart() {
        return rowChain(['發現|問題', '提出|法案'], '一條法律從有人發現問題、提出法案開始。');
    }
    // 修法循環：施行後發現問題 → 修法
    function amendLoop() {
        var b = T(150, 16, '法律不是一成不變：可以修法', 'currentColor', 12);
        b += R(24, 40, 86, 44, '#bbf7d0', { stroke: '#22c55e' });
        b += T(67, 66, '公布施行', INK, 11);
        b += R(210, 40, 86, 44, '#fde68a', { stroke: '#f59e0b' });
        b += T(253, 60, '發現', INK, 11);
        b += T(253, 76, '問題', INK, 11);
        b += ARR(110, 62, 208, 62, '#be123c', 2);
        b += '<path d="M253 86 q0 34 -93 34 q-93 0 -93 -34" fill="none" stroke="#7c3aed" stroke-width="2"/>';
        b += ARR(72, 100, 67, 86, '#7c3aed', 2);
        b += T(160, 128, '循修法程序調整，讓制度與時俱進', '#7c3aed', 10);
        return SVG('0 0 320 140', '法律公布施行後若發現問題，可以循修法程序調整，讓制度與時俱進。', b);
    }
    // 公民參與五管道圖鑑
    function participateCards() {
        var ps = [['🗳️', '投票'], ['📋', '連署'], ['🙋', '公投'], ['✉️', '陳情'], ['🏛️', '公聽會']];
        var b = T(160, 16, '公民參與不只投票', 'currentColor', 12);
        for (var i = 0; i < 5; i++) {
            var x = 10 + i * 61;
            b += R(x, 32, 56, 56, '#ddd6fe', { stroke: '#a78bfa' });
            b += T(x + 28, 58, ps[i][0], INK, 20);
            b += T(x + 28, 78, ps[i][1], INK, 10);
        }
        b += T(160, 108, '連署、公投、陳情、公聽會、合法集會都是管道', 'currentColor', 10);
        return SVG('0 0 320 122', '公民參與公共事務的管道很多：投票、連署、公民投票、陳情請願、公聽會、合法集會表達。', b);
    }
    // 年齡與公民權（正確性鐵則：公投 18 歲；選舉投票依法律規定）
    function ageRights() {
        var b = T(140, 16, '不同權利有不同年齡規定', 'currentColor', 12);
        b += R(16, 34, 128, 70, '#bbf7d0', { stroke: '#22c55e' });
        b += T(80, 58, '公民投票（公投）', INK, 11);
        b += T(80, 80, '年滿 18 歲可參與', INK, 11);
        b += R(156, 34, 128, 70, '#bae6fd', { stroke: '#38bdf8' });
        b += T(220, 58, '各項選舉的投票', INK, 11);
        b += T(220, 80, '依現行法律規定的', INK, 11);
        b += T(220, 96, '年齡才能參加', INK, 11);
        return SVG('0 0 300 116', '台灣的公民投票（公投）年滿十八歲即可參與；各項選舉的投票則依現行法律規定的年齡才能參加——了解自己到幾歲能行使哪些權利。', b);
    }
    // 公民參與的態度
    function civicAttitude() {
        var ts = [['⚖️', '守法'], ['🧠', '理性表達'], ['🤝', '尊重不同意見']];
        var b = T(150, 16, '參與的態度：守法、理性、尊重', 'currentColor', 12);
        for (var i = 0; i < 3; i++) {
            var x = 16 + i * 96;
            b += R(x, 32, 88, 52, '#fde68a', { stroke: '#f59e0b' });
            b += T(x + 44, 56, ts[i][0], INK, 18);
            b += T(x + 44, 76, ts[i][1], INK, 10);
        }
        return SVG('0 0 300 100', '公民參與時要守法、理性表達，並尊重不同意見，而不是誰大聲誰贏。', b);
    }
    // 生活法律
    function lifeLaw() {
        var ls = [['📝', '契約看清楚再簽'], ['🛒', '網路購物有規則'], ['👨‍👩‍👧', '未成年某些行為需家長同意']];
        var b = T(150, 16, '法律保護我們的生活', 'currentColor', 12);
        for (var i = 0; i < 3; i++) {
            var y = 30 + i * 32;
            b += R(20, y, 280, 28, '#e0e7ff', { r: 8, stroke: '#818cf8' });
            b += T(38, y + 19, ls[i][0], INK, 15, 'start');
            b += T(64, y + 19, ls[i][1], INK, 11, 'start');
        }
        return SVG('0 0 320 134', '法律保護大家的生活：契約要看清楚再簽、網路購物有規則、未成年的某些行為需要家長同意。', b);
    }
    // 兒童權利公約（CRC）四大權利
    function crcRights() {
        var rs = [['🌱', '生存權'], ['🛡️', '受保護權'], ['📚', '發展權'], ['🙋', '參與權']];
        var b = T(140, 16, '兒童權利公約（CRC）四大權利', 'currentColor', 11);
        for (var i = 0; i < 4; i++) {
            var x = 24 + (i % 2) * 136, y = 32 + Math.floor(i / 2) * 60;
            b += R(x, y, 120, 50, '#bbf7d0', { stroke: '#22c55e' });
            b += T(x + 60, y + 26, rs[i][0], INK, 18);
            b += T(x + 60, y + 44, rs[i][1], INK, 11);
        }
        return SVG('0 0 300 162', '兒童權利公約（CRC）保障兒少四大權利：生存權、受保護權、發展權、參與權——你有被保護、受教育、表達意見的權利。', b);
    }
    // 求助地圖：家人 → 老師／輔導老師 → 保護／報案專線
    function helpMap() {
        var b = T(150, 16, '權利被侵害時，可以求助', 'currentColor', 12);
        var steps = [['👨‍👩‍👧', '信任的大人／家人'], ['🧑‍🏫', '老師或輔導老師'], ['📞', '保護專線 113｜報案 110']];
        for (var i = 0; i < 3; i++) {
            var y = 32 + i * 30;
            b += R(28, y, 264, 26, '#bae6fd', { r: 10, stroke: '#38bdf8' });
            b += T(46, y + 18, steps[i][0], INK, 15, 'start');
            b += T(72, y + 18, steps[i][1], INK, 11, 'start');
            if (i < 2)
                b += ARR(160, y + 26, 160, y + 30, '#0369a1', 2);
        }
        b += T(150, 128, '求助是對的，不是你的錯', '#0369a1', 10);
        return SVG('0 0 320 140', '權利被侵害或覺得不安全時可以求助：告訴信任的大人或家人、老師或輔導老師，必要時撥打保護專線 113 或報案 110；求助是對的，不是你的錯。', b);
    }
    // ============ 群組 4：人口 — static / stepped SVG（都市化因果鏈用 Anim.causalChain）============
    // 都市化流向：鄉村少數散落的人 → 匯聚到右側密集城市（箭頭止於色塊邊，不穿入／Defect class #29）
    function urbanFlow() {
        var b = T(150, 16, '都市化：人往城市集中', 'currentColor', 12);
        b += T(46, 40, '鄉村', 'currentColor', 10);
        var rural = [[40, 66], [66, 60], [44, 92], [72, 98], [52, 124]];
        for (var i = 0; i < rural.length; i++)
            b += '<circle cx="' + rural[i][0] + '" cy="' + rural[i][1] + '" r="6" fill="#86efac" stroke="#22c55e"/>';
        b += T(250, 40, '城市', 'currentColor', 10);
        for (var r = 0; r < 3; r++)
            for (var c = 0; c < 4; c++) {
                var bhh = 18 + ((c + r) % 3) * 4;
                b += R(212 + c * 20, 56 + r * 26 + (22 - bhh), 16, bhh, '#93c5fd', { r: 2, stroke: '#3b82f6', sw: 1 });
            }
        b += ARR(96, 76, 206, 78, SU, 2.2);
        b += ARR(96, 112, 206, 98, SU, 2.2);
        b += R(104, 128, 96, 32, '#fde68a', { r: 8 });
        b += T(152, 142, '城市的機會多', INK, 10);
        b += T(152, 155, '工作·教育·醫療·交通', INK, 9);
        return SVG('0 0 300 172', '鄉村少數散落的人沿箭頭匯聚到右側密集的城市；城市因工作、教育、醫療、交通等機會較多，吸引人口往城市集中。', b);
    }
    // 台灣人口分布：西部密集、東部較少（示意輪廓＋中央山脈）
    function twWestConcentration() {
        var b = T(150, 16, '台灣人口集中在西部', 'currentColor', 12);
        b += '<path d="M150 30 Q122 64 120 108 Q118 150 150 162 Q182 150 180 108 Q178 64 150 30 Z" fill="#ecfccb" stroke="#65a30d" stroke-width="1.5"/>';
        b += '<line x1="150" y1="40" x2="150" y2="154" stroke="#78716c" stroke-width="1.5" stroke-dasharray="4 3"/>';
        var west = [[138, 70], [132, 88], [140, 100], [130, 112], [138, 124], [134, 140], [146, 82], [144, 118]];
        for (var i = 0; i < west.length; i++)
            b += '<circle cx="' + west[i][0] + '" cy="' + west[i][1] + '" r="4" fill="#b45309"/>';
        var east = [[166, 96], [170, 124]];
        for (var j = 0; j < east.length; j++)
            b += '<circle cx="' + east[j][0] + '" cy="' + east[j][1] + '" r="3.2" fill="#a8a29e"/>';
        b += T(96, 92, '西部', '#b45309', 10, 'end');
        b += T(96, 106, '都會密集', '#b45309', 9, 'end');
        b += T(206, 110, '東部', '#78716c', 10, 'start');
        b += T(206, 124, '人口較少', '#78716c', 9, 'start');
        b += T(150, 180, '西部都會區（如六都）人口高度集中', 'currentColor', 10);
        return SVG('0 0 300 192', '一個台灣輪廓示意圖，中央有山脈；西部標出密集的人口聚居點、東部僅零星幾點，說明台灣人口高度集中在西部都會區（如六都）。', b);
    }
    // 人口金字塔（stepped）：step1 過去寬底三角／step2 現在中廣／step3 未來窄底倒三角（age band 固定色、只變寬度）
    function popPyramid(step) {
        var profiles = {
            1: [122, 112, 100, 84, 64, 42, 22],
            2: [72, 84, 104, 112, 96, 70, 46],
            3: [42, 58, 78, 100, 112, 106, 92]
        };
        var caps = {
            1: '過去：底寬、頂窄（小孩多、老人少）',
            2: '現在：底變窄、中段變寬',
            3: '未來：底窄、頂寬，接近倒金字塔'
        };
        var w = profiles[step], cols = ['#86efac', '#86efac', '#86efac', '#fcd34d', '#fcd34d', '#fca5a5', '#fca5a5'];
        var cx = 150, bh = 15, gap = 2, y0 = 34, n = 7;
        var b = T(150, 18, '人口金字塔：形狀隨時間改變', 'currentColor', 12);
        for (var i = 0; i < n; i++) {
            var yy = y0 + (n - 1 - i) * (bh + gap);
            b += R(cx - w[i] / 2, yy, w[i], bh, cols[i], { r: 3, stroke: '#ffffff', sw: 1 });
        }
        b += T(96, 44, '老年', 'currentColor', 9, 'end');
        b += T(96, y0 + (n - 1) * (bh + gap) + 12, '幼年', 'currentColor', 9, 'end');
        b += T(150, 170, caps[step], 'currentColor', 10);
        return SVG('0 0 300 184', '一座人口金字塔示意圖，橫條由下而上代表從幼年到高齡的各年齡層、長度代表人數。' + caps[step] + '。', b);
    }
    // 移動的原因：工作／求學／婚姻與家庭／尋求安全 → 匯聚成人口移動（鏡像 pressure 版型）
    function migrationReasons() {
        var rs = [['💼', '工作'], ['📚', '求學'], ['👪', '婚姻與家庭'], ['🛟', '尋求安全']];
        var b = T(157, 16, '人為什麼移動（移入／移出）', 'currentColor', 12);
        for (var i = 0; i < 4; i++) {
            var x = 10 + i * 76;
            b += R(x, 30, 68, 46, '#bae6fd', { stroke: '#38bdf8' });
            b += T(x + 34, 52, rs[i][0], INK, 18);
            b += T(x + 34, 70, rs[i][1], INK, 10);
            b += ARR(x + 34, 78, 157, 112, '#0369a1', 1.8);
        }
        b += R(103, 114, 108, 34, SU, { r: 10 });
        b += T(157, 135, '人口的移動', '#ffffff', 12);
        return SVG('0 0 314 160', '人會因為工作、求學、婚姻與家庭、尋求安全等原因而移動（移入或移出），這些原因匯聚成人口的移動。', b);
    }
    // 多元族群：等大、中性、無刻板印象（同一人形符號），共同組成台灣
    function ethnicGroups() {
        var gs = ['閩南', '客家', '外省', '原住民族', '新住民'];
        var cols = ['#fecaca', '#fed7aa', '#fde68a', '#bbf7d0', '#bae6fd'];
        var b = T(160, 16, '多元族群共同組成台灣', 'currentColor', 12);
        for (var i = 0; i < 5; i++) {
            var x = 8 + i * 61;
            b += R(x, 34, 56, 44, cols[i], { stroke: '#94a3b8' });
            b += T(x + 28, 54, '🧑', INK, 16);
            b += T(x + 28, 72, gs[i], INK, 10);
        }
        b += R(60, 96, 200, 30, SU, { r: 10 });
        b += T(160, 116, '彼此尊重，共同組成多元社會', '#ffffff', 10);
        return SVG('0 0 320 138', '閩南、客家、外省、原住民族與新住民等多元族群，彼此尊重，共同組成多元的台灣社會；新住民是其中重要的一員。', b);
    }
    // 多元帶來活力：不同顏色人形並肩，彼此尊重
    function diversityRespect() {
        var b = T(150, 16, '多元讓社會更有活力', 'currentColor', 12);
        var cols = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
        for (var i = 0; i < 5; i++) {
            var x = 48 + i * 52;
            b += '<circle cx="' + x + '" cy="60" r="10" fill="' + cols[i] + '"/>';
            b += '<rect x="' + (x - 11) + '" y="72" width="22" height="30" rx="8" fill="' + cols[i] + '"/>';
        }
        b += '<text x="150" y="40" text-anchor="middle" font-size="16">✨</text>';
        b += R(50, 116, 220, 32, '#dcfce7', { r: 10, stroke: '#22c55e' });
        b += T(160, 137, '彼此尊重、欣賞不同，社會更好', '#166534', 11);
        return SVG('0 0 300 160', '五個不同顏色的人形並肩站在一起，上方有象徵活力的亮點；彼此尊重、欣賞不同，讓多元社會更有活力。', b);
    }
    // ============ 群組 5：史料探究 — static SVG（證據→推論鏈用 Anim.causalChain）============
    // 一手 vs 二手：左右兩欄分類 ＋ 下方「事件當下 → 事件之後」時間線
    function sourceCompare() {
        var b = T(160, 16, '一手史料 vs 二手史料', 'currentColor', 12);
        b += R(16, 34, 134, 92, '#fef3c7', { stroke: '#f59e0b' });
        b += T(83, 52, '📜 一手史料', '#92400e', 11);
        var p = ['日記', '照片', '文物', '官方檔案'];
        for (var i = 0; i < 4; i++)
            b += T(83, 70 + i * 14, '• ' + p[i], INK, 10);
        b += R(170, 34, 134, 92, '#dbeafe', { stroke: '#3b82f6' });
        b += T(237, 52, '📚 二手史料', '#1e40af', 11);
        var s = ['教科書', '論文', '報導', '紀錄片'];
        for (var j = 0; j < 4; j++)
            b += T(237, 70 + j * 14, '• ' + s[j], INK, 10);
        b += ARR(30, 150, 290, 150, 'currentColor', 1.8);
        b += T(83, 168, '事件當下留下', '#92400e', 9);
        b += T(237, 168, '事件之後整理', '#1e40af', 9);
        return SVG('0 0 320 182', '左欄一手史料（日記、照片、文物、官方檔案）是事件當下留下的；右欄二手史料（教科書、論文、報導、紀錄片）是事件之後整理的；下方時間線由左到右標出「事件當下」到「事件之後」。', b);
    }
    // 兩種史料各有長處與限制：都有價值，要分清楚、互相對照
    function sourceProsCons() {
        var b = T(160, 16, '兩種都有價值，各有限制', 'currentColor', 12);
        b += R(16, 34, 134, 92, '#fef3c7', { stroke: '#f59e0b' });
        b += T(83, 54, '一手史料', '#92400e', 11);
        b += T(83, 78, '✓ 接近現場', '#15803d', 10);
        b += T(83, 100, '！ 可能片面', '#b45309', 10);
        b += R(170, 34, 134, 92, '#dbeafe', { stroke: '#3b82f6' });
        b += T(237, 54, '二手史料', '#1e40af', 11);
        b += T(237, 78, '✓ 有脈絡', '#15803d', 10);
        b += T(237, 100, '！ 經過詮釋', '#b45309', 10);
        b += T(160, 152, '所以要分清楚、互相對照', '#be123c', 11);
        return SVG('0 0 320 170', '一手史料接近現場但可能片面；二手史料有脈絡但經過作者詮釋；兩者都有價值，要分清楚並互相對照。', b);
    }
    // 分類練習：四個例子 → 歸入 一手／二手 兩個箱（箭頭止於箱頂邊）
    function sortSources() {
        var b = T(150, 16, '練習：分清楚手上是哪一種', 'currentColor', 12);
        var items = [['當時的日記', 0], ['歷史教科書', 1], ['老照片', 0], ['現代紀錄片', 1]];
        b += R(20, 128, 120, 34, '#fef3c7', { r: 8, stroke: '#f59e0b' });
        b += T(80, 149, '📜 一手', '#92400e', 11);
        b += R(180, 128, 120, 34, '#dbeafe', { r: 8, stroke: '#3b82f6' });
        b += T(240, 149, '📚 二手', '#1e40af', 11);
        for (var i = 0; i < 4; i++) {
            var x = 18 + i * 72;
            b += R(x, 34, 66, 30, '#f1f5f9', { r: 6, stroke: '#94a3b8' });
            b += T(x + 33, 53, items[i][0], INK, 9);
            var tx = items[i][1] === 0 ? 80 : 240;
            b += ARR(x + 33, 66, tx, 126, items[i][1] === 0 ? '#f59e0b' : '#3b82f6', 1.5);
        }
        return SVG('0 0 320 172', '四個例子分類：當時的日記、老照片歸入一手史料；歷史教科書、現代紀錄片歸入二手史料——做歷史要先分清楚手上的是哪一種。', b);
    }
    // 同一事件、多份說法不同：來源 A/B/C 因立場、記憶、目的不同（箭頭止於來源卡頂邊）
    function differentAccounts() {
        var b = T(150, 16, '同一件事，說法可能不同', 'currentColor', 12);
        b += R(110, 36, 100, 30, SU, { r: 10 });
        b += T(160, 56, '同一個事件', '#ffffff', 11);
        var acc = [['來源 A', '強調這一面', 50, 120], ['來源 B', '記得那一面', 160, 120], ['來源 C', '另一種說法', 270, 120]];
        for (var i = 0; i < 3; i++) {
            var cx = acc[i][2], cy = acc[i][3];
            b += R(cx - 48, cy - 20, 96, 44, '#e0e7ff', { stroke: '#818cf8' });
            b += T(cx, cy - 2, acc[i][0], INK, 10);
            b += T(cx, cy + 16, acc[i][1], INK, 9);
            b += ARR(160, 68, cx, cy - 22, '#6366f1', 1.6);
        }
        b += T(150, 158, '立場、記憶、目的不同，記載就不同', 'currentColor', 10);
        return SVG('0 0 320 172', '同一個事件，來源 A、B、C 三份史料因為立場、記憶、目的不同，留下的說法也不一樣。', b);
    }
    // 證據天秤：兩端放不同來源，中間秤出「一致處＝較可信」
    function evidenceScale() {
        var b = T(150, 16, '多方對照：交叉比對找真相', 'currentColor', 12);
        b += '<line x1="150" y1="44" x2="150" y2="92" stroke="#78716c" stroke-width="3"/>';
        b += '<line x1="60" y1="60" x2="240" y2="60" stroke="#78716c" stroke-width="3"/>';
        b += '<polygon points="150,92 136,116 164,116" fill="#78716c"/>';
        b += '<line x1="60" y1="60" x2="60" y2="80" stroke="#78716c" stroke-width="1.5"/>';
        b += R(26, 80, 68, 26, '#e0e7ff', { r: 6, stroke: '#818cf8' });
        b += T(60, 97, '來源一', INK, 10);
        b += '<line x1="240" y1="60" x2="240" y2="80" stroke="#78716c" stroke-width="1.5"/>';
        b += R(206, 80, 68, 26, '#e0e7ff', { r: 6, stroke: '#818cf8' });
        b += T(240, 97, '來源二', INK, 10);
        b += R(104, 126, 92, 30, '#dcfce7', { r: 8, stroke: '#22c55e' });
        b += T(150, 145, '一致處＝較可信', '#166534', 10);
        b += T(150, 172, '找兩三個獨立來源比對，看一致與出入', 'currentColor', 10);
        return SVG('0 0 300 186', '一座天秤的兩端分別放上「來源一」「來源二」的說法交叉比對；中間標出「一致處＝較可信」——多方對照、找兩三個獨立來源比對，看哪些一致、哪些有出入。', b);
    }
    window.CONCEPT = {
        progKey: 'social_advanced_concepts_v1', practiceHref: 'social_advanced.html',
        lessons: [
            // ===== 群組 1：台灣史因果鏈 =====
            {
                id: 'twh_1945', name: '1945：戰後的交接與社會變動', emoji: '🪢', color: '#b45309',
                sub: '戰爭結束，壓力開始累積', done: '記得：1945 年二戰結束，日本結束在台灣約 50 年的統治，由中華民國政府接管；戰後初期物價、物資、制度與語言的轉換帶來社會壓力，是後來衝突的背景——我們看的是前因後果，不評斷是非。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '1945：政權交接', svg: handover(), text: '1945 年<b>第二次世界大戰結束</b>，日本結束在台灣<b>約 50 年</b>的統治，台灣由<b>中華民國政府接管</b>。這是一次重大的政權交接。' },
                    { type: 'teach', kicker: '為什麼不平靜', title: '戰後社會壓力累積', svg: pressure(), text: '戰後初期<b>物價飛漲</b>、<b>物資短缺</b>，加上<b>制度與語言快速轉換</b>，社會壓力很大。這些累積的緊張，是後來衝突的<b>背景</b>（我們看前因後果，不評斷是非）。' },
                    { type: 'teach', kicker: '把它連起來', title: '一條因果鏈的開端', svg: animCanvas(310, 210, '因果鏈動畫：方塊由上而下依序出現、用向下箭頭相連，呈現「1945 終戰與交接 → 中華民國政府接管台灣 → 戰後社會壓力累積」。'), mount: function (host) { return window.Anim && window.Anim.causalChain(host, { mode: 'cause', title: '戰後台灣：因果鏈（開端）', nodes: [{ label: '1945 終戰與交接', note: '日本結束在台統治', color: '#b45309' }, { label: '中華民國政府接管台灣' }, { label: '戰後社會壓力累積', note: '物價・物資・制度轉換' }] }); }, text: '把事件<b>連成一條因果鏈</b>：終戰與交接 →（因為）政府接管後百廢待舉 →（所以）社會壓力累積。按 ▶ 看方塊依序亮起——歷史不是背年代，而是看<b>一步步的前因後果</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '1945 年台灣結束了哪一段統治？', options: ['日本統治', '荷蘭統治', '清朝統治', '明鄭時期'], answer: 0, why: '1945 年二戰結束，日本在台灣長達約 50 年的統治隨之結束，由中華民國政府接管。' },
                    { type: 'quiz', kicker: '想一想', title: '戰後初期台灣社會壓力大的原因之一是？', options: ['物價飛漲、物資短缺、制度與語言轉換', '大家都變得很有錢', '完全沒有任何改變', '人口突然消失'], answer: 0, why: '戰後經濟困難與制度、語言快速轉換造成社會緊張，是後續衝突的背景。' }
                ]
            },
            {
                id: 'twh_shift', name: '1949 遷台與二二八的歷史脈絡', emoji: '🕯️', color: '#92400e',
                sub: '記取教訓，守護人權', done: '記得：1947 年二二八事件是台灣重要的歷史傷痕，我們以哀矜、尊重史實的態度記得它，重點在守護人權與對話；1949 年中國內戰後，中華民國政府遷台，大量軍民隨之來台。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '為什麼大量軍民來到台灣', svg: rowChain(['中國|內戰', '政府|遷台', '軍民|來台'], '中國內戰後，一九四九年中華民國政府遷到台灣，大量軍民隨之來台，是外省族群的重要來源。'), text: '在<b>中國</b>的內戰之後，<b>1949 年</b>中華民國政府<b>遷到台灣</b>，大量軍民隨之來台（這是<b>外省族群</b>的重要來源之一）。台灣社會由本省、外省、原住民、以及後來的新住民等<b>多元族群</b>共同組成。' },
                    { type: 'teach', kicker: '歷史的傷痕', title: '二二八事件（1947）', svg: traumaTimeline(), text: '在遷台之前，<b>1947 年</b>因緝私衝突引爆<b>二二八事件</b>，官民衝突與後續鎮壓造成許多傷亡，是台灣重要的<b>歷史傷痕</b>。我們以<b>哀矜、尊重史實</b>的態度記得它——重點在<b>記取教訓、守護人權與對話</b>，而不是歸咎任何一個族群。' },
                    { type: 'teach', kicker: '把它連起來', title: '壓力 → 傷痕 → 遷台', svg: animCanvas(310, 250, '因果鏈動畫：方塊由上而下依序出現、用向下箭頭相連，呈現「戰後社會壓力累積 → 二二八事件（1947） → 中國內戰局勢逆轉（1948–49） → 1949 政府遷台」。'), mount: function (host) { return window.Anim && window.Anim.causalChain(host, { mode: 'cause', title: '脈絡：壓力・傷痕・遷台', nodes: [{ label: '戰後社會壓力累積' }, { label: '二二八事件', note: '1947・歷史傷痕', color: '#be123c' }, { label: '中國內戰局勢逆轉', note: '1948–49' }, { label: '1949 政府遷台', note: '大量軍民隨之來台', color: '#92400e' }] }); }, text: '把這段脈絡連起來看（這是時間先後的背景，不是單一因果）：戰後<b>社會壓力</b>、1947 年<b>二二八</b>的傷痕；另一方面<b>中國內戰局勢逆轉</b>，到 <b>1949 年</b>中華民國<b>政府遷台</b>。看懂事件之間的關係，比單背年代更能理解歷史。' },
                    { type: 'quiz', kicker: '換你試試', title: '1949 年前後，大量軍民隨中華民國政府來到台灣，主要是因為？', options: ['中國內戰後政府遷到台灣', '來台灣觀光', '日本把他們送來', '氣候太好'], answer: 0, why: '1949 年中國內戰後，中華民國政府遷台，大量軍民隨之來台，是外省族群的重要來源。' },
                    { type: 'quiz', kicker: '想一想', title: '關於二二八事件，較合適的理解是？', options: ['1947 年官民衝突與鎮壓造成許多傷亡，是台灣重要的歷史傷痕，提醒珍惜人權與對話', '是一場慶典', '跟台灣無關', '沒有造成任何影響'], answer: 0, whyWrong: { 1: '二二八是造成許多傷亡的歷史傷痕，不是慶典；我們以哀矜的態度記得它。' }, why: '二二八是台灣重要歷史事件，以哀矜、尊重史實的態度理解，重點在記取教訓、守護人權。' }
                ]
            },
            {
                id: 'twh_democracy', name: '戒嚴 → 解嚴 → 民主化 → 總統直選', emoji: '🗳️', color: '#a16207',
                sub: '自由是一步步爭取來的', done: '記得：戰後長期戒嚴（1949–1987）限制了言論、集會、組黨等自由；1987 年解除戒嚴，自由逐漸開放；1996 年首次總統直接民選，人民能自己投票選出領導人——這是台灣民主的來時路。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '長期戒嚴（1949–1987）', svg: martialLaw(true), text: '戰後台灣長期實施<b>戒嚴</b>（1949–1987）。在戒嚴之下，人民的<b>言論、集會、組黨</b>等自由受到<b>限制</b>。這段時間很長，影響了好幾個世代。' },
                    { type: 'teach', kicker: '轉變來了', title: '1987 解除戒嚴', svg: martialLaw(false), text: '隨著社會發展與民間長期爭取，<b>1987 年解除戒嚴</b>，言論與結社<b>逐漸開放</b>。這是台灣<b>民主化</b>的重要一步——自由不是突然出現的，而是慢慢爭取、一步步鬆綁的。' },
                    { type: 'teach', kicker: '走到今天', title: '完整的民主化因果鏈', svg: animCanvas(310, 350, '因果鏈動畫：方塊由上而下依序出現、用向下箭頭相連，呈現台灣民主化的完整歷程「戰後社會壓力 → 二二八（1947） → 長期戒嚴（1949–1987） → 社會發展與民間爭取 → 解除戒嚴（1987） → 總統直接民選（1996）」。'), mount: function (host) { return window.Anim && window.Anim.causalChain(host, { mode: 'cause', title: '台灣民主化：完整因果鏈', nodes: [{ label: '戰後社會壓力' }, { label: '二二八', note: '1947', color: '#be123c' }, { label: '長期戒嚴', note: '1949–1987' }, { label: '社會發展與民間爭取' }, { label: '解除戒嚴', note: '1987' }, { label: '總統直接民選', note: '1996', color: '#15803d' }] }); }, text: '把整條路連起來回顧：從長期<b>戒嚴</b>、民間<b>爭取</b>、<b>解嚴</b>，到 1996 年<b>總統直接民選</b>——看完整的因果鏈，你會明白<b>自由是一步步爭取來的</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '台灣在 1987 年發生的重要民主進程是？', options: ['解除戒嚴，言論與結社逐漸開放', '開始戒嚴', '結束日本統治', '首次總統直選'], answer: 0, whyWrong: { 3: '首次總統直選是 1996 年，不是 1987 年。' }, why: '1987 年解嚴，長期的自由限制逐步鬆綁，是民主化的重要一步。' },
                    { type: 'quiz', kicker: '想一想', title: '1996 年台灣第一次做了哪一件事，象徵民主的重要里程碑？', options: ['由人民直接投票選出總統', '第一次舉辦奧運', '開始實施戒嚴', '結束清朝統治'], answer: 0, why: '1996 年首次總統直接民選，人民能自己選出國家領導人，是台灣民主化的重要里程碑。' }
                ]
            },
            // ===== 群組 2：世界地理與讀圖 =====
            {
                id: 'geo_continents', name: '七大洲、五大洋與相對位置', emoji: '🌏', color: '#0e7490',
                sub: '先有框架，世界就不零散', done: '記得：陸地分七大洲（亞洲最大）、海洋分五大洋（太平洋最大）；用「哪一洲、哪個半球、鄰近哪個大洋」描述相對位置，台灣就在亞洲東緣、北半球、面向太平洋。',
                steps: [
                    { type: 'teach', kicker: '先建框架', title: '七大洲與五大洋', svg: continentsFrame(), text: '陸地分<b>七大洲</b>：亞洲（最大）、非洲、歐洲、北美洲、南美洲、大洋洲、南極洲；海洋分<b>五大洋</b>，其中<b>太平洋最大</b>。先把這個框架記住，看世界地圖就不會零散。' },
                    { type: 'teach', kicker: '放回地圖', title: '把各洲定位在世界地圖上', svg: animCanvas(300, 196, '世界地圖定位動畫：一張只畫七大洲色塊與海洋、完全不含國界的風格化世界地圖；動畫依序掉下定位針並脈動光環，先標台灣（在亞洲東緣、面向太平洋），再輪流定位亞洲、歐洲、非洲、北美洲、南美洲，建立相對位置感。'), mount: function (host) { return window.Anim && window.Anim.worldLocator(host, { cycle: true, pins: [{ region: 'tw', xFrac: 0.80, yFrac: 0.44, label: '台灣' }, { region: 'asia', xFrac: 0.70, yFrac: 0.30, label: '亞洲' }, { region: 'europe', xFrac: 0.50, yFrac: 0.25, label: '歐洲' }, { region: 'africa', xFrac: 0.545, yFrac: 0.57, label: '非洲' }, { region: 'namerica', xFrac: 0.17, yFrac: 0.30, label: '北美洲' }, { region: 'samerica', xFrac: 0.29, yFrac: 0.66, label: '南美洲' }] }); }, text: '看動畫：地圖上先掉下一支針標出<b>台灣</b>（在<b>亞洲東緣、面向太平洋</b>），再輪流定位各大洲——這樣就能建立台灣和各洲的<b>相對位置感</b>。（這張地圖只畫洲別和海洋，幫助定位用。）' },
                    { type: 'teach', kicker: '怎麼描述', title: '相對位置的三個線索', svg: relPosition(), text: '描述一個地方在哪，用<b>三個線索</b>最清楚：在<b>哪一洲</b>、在赤道以北或以南的<b>哪個半球</b>、<b>鄰近哪個大洋</b>。用客觀資訊定位，才能在地圖上找到它——這叫建立<b>框架</b>，不是死背地標。' },
                    { type: 'quiz', kicker: '換你試試', title: '面積最大的洲和最大的洋分別是？', options: ['亞洲、太平洋', '非洲、大西洋', '歐洲、印度洋', '南極洲、北冰洋'], answer: 0, why: '亞洲是最大的洲、太平洋是最大的洋；台灣就位在亞洲東緣、太平洋西側。' },
                    { type: 'quiz', kicker: '想一想', title: '描述一個地方的「相對位置」，下列何者最合適？', options: ['它在非洲東北部、鄰近紅海', '它很漂亮', '那裡的人很友善', '我沒去過'], answer: 0, why: '相對位置用洲別、方位、鄰近海洋等客觀資訊描述空間，才能在地圖上定位。' }
                ]
            },
            {
                id: 'geo_climate', name: '氣候帶：從赤道到兩極', emoji: '🌡️', color: '#0891b2',
                sub: '緯度定基調，海陸地形再加料', done: '記得：緯度越低（靠赤道）越熱、越高（靠兩極）越冷，大致分熱帶、溫帶、寒帶；北回歸線（約北緯 23.5 度）通過台灣，使台灣跨亞熱帶與熱帶；氣候還受海洋、地形、季風影響。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '熱帶、溫帶、寒帶', svg: climateZones(1), text: '緯度<b>越低（靠赤道）越熱</b>、<b>越高（靠兩極）越冷</b>。所以從赤道往兩極，氣候大致分成<b>熱帶 → 溫帶 → 寒帶</b>。這是因為陽光照射的角度不同：越靠赤道越直射、越熱。' },
                    { type: 'teach', kicker: '台灣在哪', title: '北回歸線通過台灣', svg: climateZones(2), text: '疊上緯線看：<b>赤道 0°</b>在正中間，<b>北回歸線（約北緯 23.5 度）</b>通過<b>台灣中南部</b>。所以台灣<b>以北偏亞熱帶、以南偏熱帶</b>——這就是台灣跨兩種氣候的原因。' },
                    { type: 'teach', kicker: '不只看緯度', title: '海洋、地形、季風也有影響', svg: climateZones(3), text: '氣候<b>不是只看緯度</b>：還受<b>海洋、地形、季風</b>影響。例如靠海的地方溫差較小、高山上比平地冷。看氣候要做<b>系統思考</b>，把多個因素一起考慮。' },
                    { type: 'quiz', kicker: '換你試試', title: '從赤道往兩極，氣候大致怎麼變化？', options: ['由熱帶漸變成溫帶、再到寒帶', '一路都一樣熱', '越靠赤道越冷', '跟緯度完全無關'], answer: 0, why: '緯度越高、受到的太陽光越斜，氣溫越低，大致由熱帶過渡到寒帶。' },
                    { type: 'quiz', kicker: '想一想', title: '台灣的氣候為什麼跨亞熱帶與熱帶？', options: ['北回歸線（約北緯 23.5 度）通過台灣中南部', '因為台灣在南半球', '因為台灣在赤道上', '因為台灣在北極圈'], answer: 0, why: '北回歸線橫越台灣，以北偏亞熱帶、以南偏熱帶。' }
                ]
            },
            {
                id: 'geo_coord', name: '經緯度與時區：定位地球上任一點', emoji: '🧭', color: '#0369a1',
                sub: '緯度加經度，就是地球的地址', done: '記得：緯線量南北（赤道 0°）、經線量東西（本初子午線 0° 通過英國格林威治）；緯度加經度能唯一定位任一點；時區大致沿經線劃分，往東較早、往西較晚。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '緯線量南北', svg: coordGrid(1), text: '要說清楚一個點在地球上哪裡，先看<b>緯線</b>（橫的，量<b>南北</b>）。最重要的緯線是<b>赤道（0°）</b>，往北是北緯（N）、往南是南緯（S）。' },
                    { type: 'teach', kicker: '再加一條', title: '經線量東西', svg: coordGrid(2), text: '再加上<b>經線</b>（直的，量<b>東西</b>）。基準是<b>本初子午線（0°）</b>，它通過<b>英國格林威治</b>，往東是東經（E）、往西是西經（W）。緯線加經線，就織成一張<b>座標網</b>。' },
                    { type: 'teach', kicker: '讀座標', title: '讀出一個點的座標與時區', svg: coordGrid(3), text: '讀座標：<b>先看緯度（N/S）、再看經度（E/W）</b>，就像報地址。另外，地球<b>自轉</b>讓各地時間不同，<b>時區大致沿經線劃分</b>——往<b>東</b>的地方時間較早、往<b>西</b>較晚。' },
                    { type: 'quiz', kicker: '換你試試', title: '我們把地球劃分時區，主要依據哪一種線？', options: ['經線（經度）', '緯線（緯度）', '海岸線', '航線'], answer: 0, why: '時區大致沿經線由東向西劃分，與地球自轉造成的日照時間差有關。' },
                    { type: 'quiz', kicker: '想一想', title: '要精確說出地球上一個點的位置，需要哪兩個資訊？', options: ['緯度和經度', '氣溫和濕度', '人口和面積', '國旗和語言'], answer: 0, why: '緯度（南北）加經度（東西）像地址一樣能唯一定位地球上任一點。' }
                ]
            },
            {
                id: 'geo_mapread', name: '進階讀圖：等高線與主題圖', emoji: '🗺️', color: '#065f46',
                sub: '會讀圖例，地圖就會說話', done: '記得：等高線把同高度的點連起來，線密＝坡陡、線疏＝坡緩，一圈圈往內升高是山頂；比例尺告訴你圖上距離等於實際多少；主題圖用顏色深淺表達資料，讀前先看標題與圖例。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '等高線：密＝陡、疏＝緩', svg: contourMap(), text: '<b>等高線</b>是把<b>同樣高度</b>的點連起來的線。<b>線擠得密＝坡很陡</b>、<b>線疏＝坡很緩</b>；一圈圈<b>往內升高</b>就是<b>山頂</b>。看等高線就能想像地形的高低起伏。' },
                    { type: 'teach', kicker: '讀圖工具', title: '比例尺與圖例', svg: scaleLegend(), text: '<b>比例尺</b>告訴你<b>圖上 1 公分代表實際多少距離</b>；<b>圖例</b>說明地圖上每個<b>符號、顏色</b>代表什麼。這兩樣是讀任何地圖的<b>鑰匙</b>。' },
                    { type: 'teach', kicker: '別被顏色騙了', title: '主題圖：先讀圖例再讀圖', svg: thematicMap(), text: '<b>主題圖</b>（人口分布圖、降雨圖、產業圖……）用<b>顏色深淺</b>或符號表達資料。讀之前一定要<b>先看標題和圖例</b>，知道深淺代表什麼，才不會<b>誤讀</b>（這也是資料素養的一環）。' },
                    { type: 'quiz', kicker: '換你試試', title: '地圖上等高線「擠得很密」通常代表？', options: ['坡度很陡', '坡度很緩', '那裡是海', '那裡沒有高度變化'], answer: 0, why: '等高線越密，表示短距離內高度變化大，也就是坡越陡。' },
                    { type: 'quiz', kicker: '想一想', title: '看一張「人口分布主題圖」，應該先看什麼才不會誤讀？', options: ['圖例和標題（顏色深淺代表什麼）', '角落的裝飾', '印刷的字體', '紙張大小'], answer: 0, why: '主題圖用顏色或符號表達資料，先看圖例與標題才知道深淺代表的意義，避免誤讀。' }
                ]
            },
            // ===== 群組 3：政府與公民 =====
            {
                id: 'civ_branches', name: '政府在做什麼：五院分工', emoji: '🏛️', color: '#7c3aed',
                sub: '權力分立，彼此監督', done: '記得：中央政府分五院——行政院（執行）、立法院（制定法律、審預算）、司法院（審判）、考試院（文官考選）、監察院（監督糾彈）；總統是國家元首，地方政府處理在地事務；權力分立與制衡能避免權力集中、保障人民。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '中央政府的五院', svg: govChart(1), text: '中央政府分成<b>五院</b>，各有分工：<b>行政院</b>（執行、做事）、<b>立法院</b>（制定法律、審查預算）、<b>司法院</b>（依法審判）、<b>考試院</b>（文官考選）、<b>監察院</b>（監督糾彈）。' },
                    { type: 'teach', kicker: '還有誰', title: '總統與地方政府', svg: govChart(2), text: '<b>總統</b>是<b>國家元首</b>，與行政院分工；<b>地方政府</b>（各縣市）處理<b>在地事務</b>，像道路、學校、垃圾清運等離我們生活很近的事。' },
                    { type: 'teach', kicker: '為什麼要分', title: '權力分立與制衡', svg: govChart(3), text: '把政府權力<b>分給不同機關、彼此監督</b>，叫<b>權力分立與制衡</b>。這樣可以<b>避免權力集中</b>在少數人手中，是民主用來<b>保障人民</b>的重要設計。' },
                    { type: 'quiz', kicker: '換你試試', title: '負責「制定法律、審查預算」的是哪一院？', options: ['立法院', '行政院', '司法院', '考試院'], answer: 0, why: '立法院是台灣的國會，主要工作是制定法律與審查政府預算。' },
                    { type: 'quiz', kicker: '想一想', title: '把政府權力分給不同機關、彼此監督，最主要的用意是？', options: ['避免權力集中在少數人手中，保障人民', '讓做事變慢好玩', '增加官員人數', '方便背機關名字'], answer: 0, why: '權力分立與制衡能防止濫權，是民主保障人民的重要設計。' }
                ]
            },
            {
                id: 'civ_bill', name: '一條法律怎麼誕生', emoji: '📜', color: '#6d28d9',
                sub: '從一個問題開始', done: '記得：有人發現問題、提出法案；立法院審查、討論、表決（三讀）通過；總統公布施行，大家一起遵守；施行後若有問題，還能透過修法調整。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '從發現問題到提案', svg: billStart(), text: '一條法律通常從<b>有人發現問題</b>開始：覺得某件事該有規則來處理，就<b>提出法案</b>（提案）。問題意識，是法律的起點。' },
                    { type: 'teach', kicker: '走完流程', title: '法案誕生的流程', svg: animCanvas(310, 350, '流程圖動畫：方塊由上而下依序出現、用向下箭頭相連，呈現一條法律誕生的流程「發現問題 → 提出法案（提案） → 委員會審查 → 院會討論表決（三讀） → 總統公布施行 → （必要時）修法」。'), mount: function (host) { return window.Anim && window.Anim.causalChain(host, { mode: 'flow', title: '一條法律怎麼誕生', nodes: [{ label: '發現問題' }, { label: '提出法案', note: '提案' }, { label: '委員會審查' }, { label: '院會討論表決', note: '三讀', color: '#7c3aed' }, { label: '總統公布施行', color: '#15803d' }, { label: '（必要時）修法' }] }); }, text: '按 ▶ 看流程一關一關走：<b>發現問題 → 提案 → 委員會審查 → 院會討論表決（三讀） → 總統公布施行</b>。法律由<b>立法院</b>審查、表決通過，再由總統公布，大家一起遵守。' },
                    { type: 'teach', kicker: '還能改', title: '施行後可以修法', svg: amendLoop(), text: '法律<b>不是一成不變</b>：施行後若發現問題，可以<b>循修法程序調整或改善</b>，讓制度<b>與時俱進</b>。這也是為什麼公民要關心、持續參與。' },
                    { type: 'quiz', kicker: '換你試試', title: '一條法律在台灣主要由哪個機關審查、表決通過？', options: ['立法院', '氣象局', '郵局', '消防隊'], answer: 0, why: '法案由立法院審查、討論、表決（三讀）通過，再由總統公布施行。' },
                    { type: 'quiz', kicker: '想一想', title: '法律施行之後發現有問題，可以怎麼辦？', options: ['透過修法來修改或改善', '永遠不能改', '假裝沒看到', '自己亂改'], answer: 0, why: '法律不是一成不變，發現問題可循修法程序調整，讓制度與時俱進。' }
                ]
            },
            {
                id: 'civ_participate', name: '公民怎麼參與公共事務', emoji: '🙋', color: '#be185d',
                sub: '守法又理性，最有力量', done: '記得：參與不只投票，還有連署、公民投票、陳情請願、公聽會、合法集會；公投年滿 18 歲可參與，各項選舉的投票依現行法律規定的年齡；參與要守法、理性、尊重不同意見。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '參與的五種管道', svg: participateCards(), text: '當公民，<b>參與不只投票</b>：還有<b>公民投票</b>（直接對議題表態）、<b>連署</b>（集合眾人支持）、<b>陳情與請願</b>（向政府反映意見）、參加<b>公聽會</b>、<b>合法集會</b>表達。管道很多元。' },
                    { type: 'teach', kicker: '幾歲能用', title: '不同權利，不同年齡', svg: ageRights(), text: '不同公民權利有<b>不同年齡規定</b>：台灣的<b>公民投票（公投）年滿 18 歲</b>即可參與；而各項<b>選舉的投票</b>則依<b>現行法律規定</b>的年齡才能參加。先了解自己<b>到幾歲能行使哪些權利</b>。' },
                    { type: 'teach', kicker: '怎麼參與', title: '守法、理性、尊重', svg: civicAttitude(), text: '參與公共事務時，比較合適的態度是：<b>守法</b>、<b>理性表達</b>，並<b>尊重不同意見</b>。民主強調在法治下理性溝通，而不是誰大聲誰贏、更不是用威脅讓別人閉嘴。' },
                    { type: 'quiz', kicker: '換你試試', title: '除了投票，公民還可以用哪些合法方式參與公共事務？', options: ['連署、公投、陳情、參加公聽會等', '只能投票別無他法', '用暴力解決', '什麼都不能做'], answer: 0, whyWrong: { 2: '暴力不是合法的參與方式；民主強調在法治下理性溝通。' }, why: '民主參與管道多元，包含連署、公民投票、陳情請願、公聽會、合法集會等。' },
                    { type: 'quiz', kicker: '想一想', title: '公民參與公共事務時，比較合適的態度是？', options: ['守法、理性表達，並尊重不同意見', '誰大聲誰贏', '用威脅讓別人閉嘴', '只准自己發言'], answer: 0, why: '民主強調在法治下理性溝通、尊重多元，而非壓制異見。' }
                ]
            },
            {
                id: 'civ_rights', name: '生活法律與兒少權利（CRC）', emoji: '🛡️', color: '#0f766e',
                sub: '你有被保護與發聲的權利', done: '記得：法律保護我們的生活（契約看清楚再簽、網購有規則、未成年某些行為需家長同意）；兒童權利公約（CRC）保障生存、受保護、發展、參與四大權利；權利被侵害時可以求助——告訴信任的大人、老師或輔導老師，必要時打保護專線 113、報案 110。求助是對的，不是你的錯。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '法律保護我們的生活', svg: lifeLaw(), text: '法律就在我們的生活裡保護大家：<b>契約要看清楚再簽</b>、<b>網路購物有規則</b>（例如七天鑑賞期的概念）、<b>未成年</b>的某些行為需要<b>家長同意</b>。懂一點生活法律，能保護自己。' },
                    { type: 'teach', kicker: '你的權利', title: '兒童權利公約的四大權利', svg: crcRights(), text: '<b>兒童權利公約（CRC）</b>保障兒少<b>四大權利</b>：<b>生存權、受保護權、發展權、參與權</b>。也就是說——你有<b>被保護</b>、<b>受教育</b>、<b>表達意見</b>的權利。權利也伴隨尊重他人的界線。' },
                    { type: 'teach', kicker: '遇到事情', title: '怎麼求助', svg: helpMap(), text: '如果覺得權利被侵害、很不安全，<b>可以求助</b>：先告訴<b>信任的大人或家人</b>，或<b>老師、輔導老師</b>；必要時撥打<b>保護專線 113</b>、或<b>報案 110</b>。記得：<b>求助是對的，不是你的錯</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '兒童權利公約（CRC）保障兒少，下列哪一項是你的權利？', options: ['被保護、受教育、表達自己的意見', '想做什麼就做什麼都不用負責', '不用上學', '可以欺負別人'], answer: 0, whyWrong: { 3: '權利伴隨尊重他人的界線；欺負別人會侵害到別人的權利，不是權利。' }, why: 'CRC 保障兒少的生存、受保護、發展與參與權；權利伴隨尊重他人的界線。' },
                    { type: 'quiz', kicker: '想一想', title: '如果覺得自己的權利受到侵害、很不安全，可以怎麼做？', options: ['告訴信任的大人、老師或輔導老師，必要時打保護專線', '自己忍著都不要說', '覺得是自己的錯', '只能認命'], answer: 0, why: '求助是對的、不是你的錯；可以找信任的大人、師長，或撥打保護專線 113、報案 110。' }
                ]
            },
            // ===== 群組 4：人口（都市化・少子高齡・移民）=====
            {
                id: 'pop_urban', name: '都市化：人為什麼往城市集中', emoji: '🏙️', color: '#0d9488',
                sub: '機會把人拉進城市，也帶來課題', done: '記得：都市化是人口往城市集中，因為城市的工作、教育、醫療、交通等機會較多；它帶來便利，也帶來房價上升、交通壅塞、城鄉差距等課題；台灣人口高度集中在西部都會區（如六都）。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '都市化：人往城市集中', svg: urbanFlow(), text: '<b>都市化</b>是指<b>人口往城市集中</b>。因為城市的<b>工作、教育、醫療、交通</b>等機會通常比較多，吸引人們從鄉村移往城市生活。' },
                    { type: 'teach', kicker: '把它連起來', title: '便利背後的課題', svg: animCanvas(310, 250, '因果鏈動畫：方塊由上而下依序出現、用向下箭頭相連，呈現「人口往城市集中 → 住與行的需求大增 → 房價上升、交通壅塞 → 城鄉差距擴大」。'), mount: function (host) { return window.Anim && window.Anim.causalChain(host, { mode: 'cause', title: '都市化的兩面', nodes: [{ label: '人口往城市集中', color: '#0d9488' }, { label: '住與行的需求大增' }, { label: '房價上升、交通壅塞', color: '#be123c' }, { label: '城鄉差距擴大' }] }); }, text: '人口集中帶來便利，也會造成課題。按 ▶ 看這條因果鏈：<b>人口往城市集中 →（住與行的需求大增）→ 房價上升、交通壅塞 → 城鄉差距擴大</b>。看前因後果，才懂都市化的兩面。' },
                    { type: 'teach', kicker: '台灣的情況', title: '人口集中在西部', svg: twWestConcentration(), text: '台灣的人口<b>高度集中在西部都會區</b>（例如<b>六都</b>）。中央山脈以東的東部，人口相對<b>較少</b>——這和地形、交通與工作機會的分布有關。' },
                    { type: 'quiz', kicker: '換你試試', title: '「都市化」主要指的是？', options: ['人口往城市集中', '城市變成鄉村', '大家都搬到山上', '人口平均分散'], answer: 0, why: '都市化指人口與產業向城市集中，多因城市的工作、教育、醫療等機會較多。' },
                    { type: 'quiz', kicker: '想一想', title: '都市化可能帶來的課題之一是？', options: ['房價上升、交通壅塞', '完全沒有缺點', '鄉村人口暴增', '城市變空'], answer: 0, why: '人口集中帶來便利，也造成房價、交通與城鄉差距等壓力。' }
                ]
            },
            {
                id: 'pop_aging', name: '少子化與高齡化', emoji: '🧓', color: '#c2410c',
                sub: '金字塔倒過來，社會一起想辦法', done: '記得：少子化（新生兒變少）與高齡化（老年人口比例上升）同時發生，人口金字塔從底寬的三角，變成底窄、頂寬、接近倒金字塔；工作人口相對變少、長照與年金壓力增加，是台灣與許多國家的共同課題。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '少子化＋高齡化：同時發生', svg: popPyramid(1), text: '<b>少子化</b>是<b>新生兒變少</b>；<b>高齡化</b>是<b>老年人口比例上升</b>。這兩件事在台灣<b>同時發生</b>。先看<b>過去</b>的人口金字塔：<b>底寬、頂窄</b>（小孩多、老人少），像一座金字塔。' },
                    { type: 'teach', kicker: '看形狀改變', title: '底變窄、頂變寬', svg: popPyramid(2), text: '隨著出生變少、壽命延長，<b>現在</b>的金字塔<b>底部（小孩）變窄、中段變寬</b>。用人口金字塔<b>看形狀的改變</b>，就能一眼看懂人口結構正在轉變。' },
                    { type: 'teach', kicker: '帶來的挑戰', title: '接近倒金字塔的未來', svg: popPyramid(3), text: '<b>未來</b>若趨勢持續，金字塔會變成<b>底窄、頂寬</b>的<b>倒金字塔</b>。這表示<b>工作人口相對變少</b>、<b>長照與年金壓力增加</b>，是台灣與許多國家<b>共同的課題</b>，需要大家一起想辦法。' },
                    { type: 'quiz', kicker: '換你試試', title: '「少子化＋高齡化」同時發生，人口金字塔形狀會怎麼變？', options: ['底部（小孩）變窄、頂部（老人）變寬', '底部越來越寬', '完全不變', '變成正方形'], answer: 0, why: '出生少使底部變窄、壽命延長使頂部變寬，金字塔由三角變成接近倒三角。' },
                    { type: 'quiz', kicker: '想一想', title: '少子高齡化可能造成的影響是？', options: ['工作人口相對減少、長照與年金壓力增加', '學校不夠用', '新生兒太多', '完全沒有影響'], answer: 0, why: '勞動人口相對變少、照顧高齡者的需求上升，是少子高齡社會的共同挑戰。' }
                ]
            },
            {
                id: 'pop_migration', name: '移民與多元社會', emoji: '🧳', color: '#0369a1',
                sub: '人會移動，多元帶來活力', done: '記得：人會因工作、求學、婚姻與家庭、尋求安全而移動（移入／移出）；台灣社會由閩南、客家、外省、原住民族與新住民共同組成，新住民是重要的一員；彼此尊重、欣賞不同，讓多元社會更有活力。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '人為什麼移動', svg: migrationReasons(), text: '人會因為<b>工作、求學、婚姻與家庭、尋求安全</b>等原因而<b>移動</b>——<b>移入</b>（搬進來）或<b>移出</b>（搬出去）。移動是人類社會一直都在發生的事。' },
                    { type: 'teach', kicker: '台灣的組成', title: '多元族群共同組成台灣', svg: ethnicGroups(), text: '台灣社會由<b>閩南、客家、外省、原住民族</b>與<b>新住民</b>等多元族群<b>共同組成</b>。從其他國家移居台灣、和我們一起生活的<b>新住民</b>，是台灣社會<b>重要的一員</b>。' },
                    { type: 'teach', kicker: '怎麼相處', title: '多元讓社會更有活力', svg: diversityRespect(), text: '多元帶來不同的<b>文化、語言與生活方式</b>，也帶來<b>活力</b>。<b>彼此尊重、欣賞不同</b>，不以刻板印象看待任何一個族群，社會會更好。' },
                    { type: 'quiz', kicker: '換你試試', title: '從其他國家移居台灣、和我們一起生活的人，常被稱為？', options: ['新住民', '外星人', '過客', '遊客'], answer: 0, why: '新住民是台灣社會的重要成員，與本地人、原住民族等共同組成多元台灣。' },
                    { type: 'quiz', kicker: '想一想', title: '面對移民帶來的多元文化，比較合適的態度是？', options: ['彼此尊重、欣賞不同', '排擠不一樣的人', '要求大家都一樣', '嘲笑別人的文化'], answer: 0, whyWrong: { 1: '排擠不一樣的人會傷害彼此，也讓社會失去多元帶來的活力。' }, why: '多元社會的活力來自互相尊重與理解差異。' }
                ]
            },
            // ===== 群組 5：史料探究（一手二手・證據與多方對照）=====
            {
                id: 'inq_source', name: '一手史料 vs 二手史料', emoji: '📜', color: '#4f46e5',
                sub: '先分清一手二手，史料才說話', done: '記得：一手史料是事件當下、當事人直接留下的（日記、照片、文物、官方檔案）；二手史料是後人整理、研究、轉述的（教科書、論文、報導、紀錄片）。兩者都有價值，但要分清楚、互相對照。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '一手 vs 二手史料', svg: sourceCompare(), text: '<b>一手史料</b>是<b>事件當下、當事人直接留下</b>的，例如<b>日記、照片、文物、官方檔案</b>；<b>二手史料</b>是<b>後人整理、研究、轉述</b>的，例如<b>教科書、論文、報導、紀錄片</b>。' },
                    { type: 'teach', kicker: '各有長處', title: '兩種都有價值', svg: sourceProsCons(), text: '兩者<b>都有用</b>：一手史料<b>接近現場</b>，但可能只記到<b>片面</b>；二手史料<b>有脈絡</b>，但經過作者<b>詮釋</b>。所以不是誰一定對，而是要<b>分清楚、互相對照</b>。' },
                    { type: 'teach', kicker: '動手分類', title: '先分清手上是哪一種', svg: sortSources(), text: '做歷史的第一步，是<b>分清楚自己手上的是哪一種</b>。像<b>當時的日記、老照片</b>是一手；<b>歷史教科書、現代紀錄片</b>是二手。分清來源，史料才會<b>說話</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '下列哪一個是「一手史料」？', options: ['當時當事人寫的日記', '今天的歷史教科書', '後人拍的紀錄片', '現代學者的論文'], answer: 0, why: '一手史料是事件當時、當事人直接留下的材料；教科書、紀錄片、論文多為後人整理的二手史料。' },
                    { type: 'quiz', kicker: '想一想', title: '關於一手與二手史料，下列何者較正確？', options: ['兩者都有價值，但要分清楚、互相對照', '只有一手史料才可信', '二手史料一定錯', '史料種類不重要'], answer: 0, whyWrong: { 1: '一手史料接近現場但可能片面，不代表一定全對，仍要與其他來源對照。' }, why: '一手接近現場但可能片面、二手有脈絡但經詮釋，分清楚並對照才能更接近真相。' }
                ]
            },
            {
                id: 'inq_evidence', name: '證據、觀點與偏誤', emoji: '⚖️', color: '#7c3aed',
                sub: '多方對照、看穿立場，才貼近真相', done: '記得：同一件事，不同人因立場、記憶、目的不同，留下的紀錄可能不同；要多方對照，找兩三個獨立來源比對，看哪些一致、哪些有出入；也要留意記錄者的立場，辨識偏誤，才更貼近真相。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '同一件事，說法不只一種', svg: differentAccounts(), text: '同一件事，不同人留下的紀錄<b>可能不一樣</b>，因為每個人的<b>立場、記憶、目的</b>都不同。所以只看<b>一份</b>史料，容易看到<b>片面</b>。' },
                    { type: 'teach', kicker: '怎麼辦', title: '多方對照找真相', svg: evidenceScale(), text: '方法是<b>多方對照</b>：找<b>兩三個獨立來源</b>互相比對，看哪些說法<b>一致</b>、哪些有<b>出入</b>。多個獨立來源都說一致的部分，通常<b>比較可信</b>。' },
                    { type: 'teach', kicker: '把方法連起來', title: '證據 → 推論', svg: animCanvas(310, 250, '因果鏈動畫：方塊由上而下依序出現、用向下箭頭相連，呈現「多個獨立來源 → 交叉比對一致處 → 辨識記錄者的立場與偏誤 → 更貼近史實」。'), mount: function (host) { return window.Anim && window.Anim.causalChain(host, { mode: 'cause', title: '史料探究：從證據到推論', nodes: [{ label: '多個獨立來源' }, { label: '交叉比對一致處' }, { label: '辨識立場與偏誤', color: '#be123c' }, { label: '更貼近史實', color: '#15803d' }] }); }, text: '按 ▶ 把方法連成一條：<b>多個獨立來源 → 交叉比對一致處 → 辨識記錄者的立場與偏誤 → 更貼近史實</b>。留意記錄者有沒有<b>立場</b>、是不是<b>只講一面</b>——這和查證新聞是<b>同一套能力</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '同一事件有好幾份說法不一樣的史料，比較好的做法是？', options: ['多方對照，看哪些一致、哪些有出入', '只信最先看到的', '全部都不要信', '選最誇張的相信'], answer: 0, why: '交叉比對多個獨立來源能降低單一史料的偏誤，較接近史實。' },
                    { type: 'quiz', kicker: '想一想', title: '判斷一份史料時，為什麼要注意記錄者的「立場」？', options: ['立場可能讓他只講一面、影響記載', '立場完全不影響', '有立場就一定是假的', '立場越強越可信'], answer: 0, whyWrong: { 3: '立場越強，越可能只講對自己有利的一面，不代表越可信。' }, why: '記錄者的立場、目的會影響取捨與詮釋，辨識偏誤才能更客觀地理解。' }
                ]
            }
        ]
    };
})();
