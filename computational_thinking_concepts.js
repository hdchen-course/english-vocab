/* =====================================================================
 * computational_thinking_concepts.ts
 *   →  (tsc, tsconfig.legacy.json) →  computational_thinking_concepts.js
 * 運算思維養成頁的教學資料（window.CONCEPT）＋專用「推理型」SVG 概念圖 helper。
 * 鏡像 math_concepts.ts：頂層函式為檔案內 SVG helper，字串拼接產生 <svg>。
 * 載入順序：game_core.js → 本檔 → concept_engine.js
 *   （本頁 viz 全為靜態／分步 SVG，不使用 window.Anim，故不載入 anim_core.js）。
 *
 * 配色規範（亮暗雙主題安全）：
 *   - 畫在卡片底色上、會隨主題翻色的文字 → fill="currentColor"（＝--ink）。
 *   - 壓在「硬寫死淺色塊」上的文字 → 不可用 currentColor（暗色會淺字壓淺底看不見，
 *     見缺陷類 #28）。本頁策略：表格／流程圖一律「不填底色」（fill="none" + 中性灰
 *     邊框 #9aa1ab），文字用 currentColor 或強調色，故不踩 #28。
 *   - 強調色（靛藍 #4f46e5、綠 #16a34a、紅 #e11d48）在亮暗皆足夠對比。
 * SVG <text> 內一律純文字，不放 <b>/<i>（教學 text 欄才用 <b>）。
 * ===================================================================== */
var CT_SU = '#4f46e5', CT_GRID = '#9aa1ab', CT_OK = '#16a34a', CT_BAD = '#e11d48';
// L1：把大問題拆成有順序的小步驟（左側脊線 + 編號節點）。
function decompTree(root, steps) {
    var W = 300, n = steps.length, rowH = 40, top = 52, spineX = 46;
    var H = top + (n - 1) * rowH + 24;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="把「' + root + '」這個大問題拆成 ' + n + ' 個有順序的小步驟">';
    s += '<rect x="22" y="8" width="256" height="30" rx="9" fill="none" stroke="' + CT_SU + '" stroke-width="2.5"/>';
    s += '<text x="150" y="28" text-anchor="middle" font-size="14.5" font-weight="800" fill="currentColor">' + root + '</text>';
    s += '<line x1="' + spineX + '" y1="38" x2="' + spineX + '" y2="' + (top + (n - 1) * rowH - 2) + '" stroke="' + CT_GRID + '" stroke-width="2"/>';
    for (var i = 0; i < n; i++) {
        var cy = top + i * rowH;
        s += '<line x1="' + spineX + '" y1="' + cy + '" x2="' + (spineX + 14) + '" y2="' + cy + '" stroke="' + CT_GRID + '" stroke-width="2"/>';
        s += '<circle cx="' + (spineX + 28) + '" cy="' + cy + '" r="12" fill="none" stroke="' + CT_SU + '" stroke-width="2"/>';
        s += '<text x="' + (spineX + 28) + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="12" font-weight="800" fill="' + CT_SU + '">' + (i + 1) + '</text>';
        s += '<text x="' + (spineX + 48) + '" y="' + (cy + 4) + '" font-size="13" font-weight="700" fill="currentColor">' + steps[i] + '</text>';
    }
    return s + '</svg>';
}
// L1：一個大問題拆成多個「簡單、好檢查」的小方塊（扇形箭頭）。
function splitBig(bigLabel, smalls) {
    var W = 300, H = 150, n = smalls.length, topCx = 150, topY = 10, topH = 30;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + bigLabel + '拆成 ' + n + ' 個簡單的小步驟，每一步都好檢查">';
    s += '<rect x="90" y="' + topY + '" width="120" height="' + topH + '" rx="9" fill="none" stroke="' + CT_SU + '" stroke-width="2.5"/>';
    s += '<text x="150" y="' + (topY + 20) + '" text-anchor="middle" font-size="14" font-weight="800" fill="currentColor">' + bigLabel + '</text>';
    var bw = 78, gap = (W - n * bw) / (n + 1), boxY = 96;
    for (var i = 0; i < n; i++) {
        var bx = gap + i * (bw + gap), mid = bx + bw / 2;
        s += '<line x1="' + topCx + '" y1="' + (topY + topH) + '" x2="' + mid + '" y2="' + boxY + '" stroke="' + CT_GRID + '" stroke-width="1.6"/>';
        s += '<polygon points="' + mid + ',' + boxY + ' ' + (mid - 4) + ',' + (boxY - 7) + ' ' + (mid + 4) + ',' + (boxY - 7) + '" fill="' + CT_GRID + '"/>';
        s += '<rect x="' + bx + '" y="' + boxY + '" width="' + bw + '" height="34" rx="7" fill="none" stroke="' + CT_SU + '" stroke-width="2"/>';
        s += '<text x="' + mid + '" y="' + (boxY + 16) + '" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">' + smalls[i] + '</text>';
        s += '<text x="' + mid + '" y="' + (boxY + 29) + '" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + CT_OK + '">✓ 好檢查</text>';
    }
    return s + '</svg>';
}
// L2：數列的「每次 +d」規律（圓點數字 + 弧線標 +d）。
function seqPattern(nums, deltaLabel) {
    var W = 300, n = nums.length, pad = 26, y = 74, gap = (W - 2 * pad) / (n - 1);
    var s = '<svg viewBox="0 0 300 118" role="img" aria-label="數列 ' + nums.join('、') + '，每一項都比前一項' + deltaLabel + '">';
    for (var i = 0; i < n - 1; i++) {
        var x1 = pad + i * gap, x2 = pad + (i + 1) * gap, mx = (x1 + x2) / 2;
        s += '<path d="M' + x1 + ',' + (y - 16) + ' Q' + mx + ',' + (y - 44) + ' ' + x2 + ',' + (y - 16) + '" fill="none" stroke="' + CT_BAD + '" stroke-width="2"/>';
        s += '<polygon points="' + x2 + ',' + (y - 16) + ' ' + (x2 - 6) + ',' + (y - 20) + ' ' + (x2 - 6) + ',' + (y - 11) + '" fill="' + CT_BAD + '"/>';
        s += '<text x="' + mx + '" y="' + (y - 46) + '" text-anchor="middle" font-size="12" font-weight="800" fill="' + CT_BAD + '">' + deltaLabel + '</text>';
    }
    for (var j = 0; j < n; j++) {
        var cx = pad + j * gap;
        s += '<circle cx="' + cx + '" cy="' + y + '" r="15" fill="none" stroke="' + CT_SU + '" stroke-width="2.5"/>';
        s += '<text x="' + cx + '" y="' + (y + 5) + '" text-anchor="middle" font-size="14" font-weight="800" fill="currentColor">' + nums[j] + '</text>';
    }
    s += '<text x="150" y="112" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">找到規律，就能一直接下去……</text>';
    return s + '</svg>';
}
// L2：抽象＝把「畫一個正多邊形」看成「重複『前進、轉角』N 次」。
function repeatShape(sides, turnDeg) {
    var W = 300, H = 170, cx = 150, cy = 86, r = 54;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="畫一個 ' + sides + ' 邊形，就是重複「前進一段、右轉 ' + turnDeg + ' 度」' + sides + ' 次">';
    var pts = [];
    for (var i = 0; i < sides; i++) {
        var a = (i / sides) * 2 * Math.PI - Math.PI / 2;
        pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    s += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="' + CT_SU + '" stroke-width="2.5"/>';
    // 標第一條邊「前進」與第一個頂點「右轉」
    var p0 = pts[0].split(','), p1 = pts[1 % sides].split(',');
    var emx = (parseFloat(p0[0]) + parseFloat(p1[0])) / 2, emy = (parseFloat(p0[1]) + parseFloat(p1[1])) / 2;
    s += '<circle cx="' + p0[0] + '" cy="' + p0[1] + '" r="4" fill="' + CT_BAD + '"/>';
    s += '<text x="' + emx + '" y="' + (emy - 6) + '" text-anchor="middle" font-size="11" font-weight="800" fill="' + CT_BAD + '">前進</text>';
    s += '<text x="' + (parseFloat(p1[0]) + 14) + '" y="' + parseFloat(p1[1]) + '" font-size="11" font-weight="800" fill="' + CT_OK + '">右轉 ' + turnDeg + '°</text>';
    s += '<text x="150" y="156" text-anchor="middle" font-size="12.5" font-weight="800" fill="currentColor">＝ 重複「前進、右轉 ' + turnDeg + '°」 × ' + sides + '</text>';
    return s + '</svg>';
}
// L3：流程圖（開始→動作→菱形判斷→兩路→結束），邏輯需正確可追。
function flowDecide(action, q, yesLabel, noLabel) {
    var s = '<svg viewBox="0 0 300 250" role="img" aria-label="流程圖：先' + action + '，再判斷「' + q + '」，是就' + yesLabel + '、否就' + noLabel + '，最後結束">';
    function node(txt, x, y, w, h, kind) {
        var o = '';
        if (kind === 'term')
            o += '<rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h + '" rx="' + (h / 2) + '" fill="none" stroke="' + CT_SU + '" stroke-width="2.2"/>';
        else if (kind === 'act')
            o += '<rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h + '" rx="6" fill="none" stroke="' + CT_SU + '" stroke-width="2.2"/>';
        else
            o += '<polygon points="' + x + ',' + (y - h / 2) + ' ' + (x + w / 2) + ',' + y + ' ' + x + ',' + (y + h / 2) + ' ' + (x - w / 2) + ',' + y + '" fill="none" stroke="' + CT_SU + '" stroke-width="2.2"/>';
        o += '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-size="12.5" font-weight="800" fill="currentColor">' + txt + '</text>';
        return o;
    }
    function arrow(x1, y1, x2, y2) {
        var o = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + CT_GRID + '" stroke-width="1.8"/>';
        var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
        var bx = x2 - ux * 8, by = y2 - uy * 8, px = -uy * 4, py = ux * 4;
        o += '<polygon points="' + x2 + ',' + y2 + ' ' + (bx + px) + ',' + (by + py) + ' ' + (bx - px) + ',' + (by - py) + '" fill="' + CT_GRID + '"/>';
        return o;
    }
    // 開始
    s += node('開始', 110, 22, 86, 30, 'term');
    s += arrow(110, 37, 110, 50);
    // 動作
    s += node(action, 110, 68, 100, 32, 'act');
    s += arrow(110, 84, 110, 92);
    // 菱形判斷
    s += node(q, 110, 122, 118, 60, 'dec');
    // 是 → 左下
    s += arrow(110, 152, 110, 168);
    s += '<text x="118" y="164" font-size="11" font-weight="800" fill="' + CT_OK + '">是</text>';
    s += node(yesLabel, 110, 186, 108, 32, 'act');
    // 否 → 右
    s += arrow(169, 122, 181, 122);
    s += '<text x="190" y="114" font-size="11" font-weight="800" fill="' + CT_BAD + '">否</text>';
    s += node(noLabel, 236, 122, 110, 32, 'act');
    s += arrow(236, 138, 236, 212);
    // 匯流到結束
    s += arrow(110, 202, 110, 212);
    s += '<line x1="110" y1="212" x2="173" y2="212" stroke="' + CT_GRID + '" stroke-width="1.8"/>';
    s += '<line x1="236" y1="212" x2="173" y2="212" stroke="' + CT_GRID + '" stroke-width="1.8"/>';
    s += arrow(173, 212, 173, 220);
    s += node('結束', 173, 236, 86, 28, 'term');
    return s + '</svg>';
}
// L3 / L4 / L6：程式碼（虛擬碼）面板。縮排以 x 位移表現（SVG 會吃掉前導空白）。
function codeBox(label, lines, bugIdx) {
    var W = 300, lh = 22, top = 24, H = top + lines.length * lh + 6;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + label + '">';
    s += '<text x="12" y="15" font-size="11" font-weight="800" fill="' + CT_SU + '">' + label + '</text>';
    for (var i = 0; i < lines.length; i++) {
        var lead = 0;
        while (lines[i].charAt(lead) === ' ')
            lead++;
        var txt = lines[i].slice(lead), y = top + i * lh + 15, buggy = (i === bugIdx);
        s += '<text x="12" y="' + y + '" font-size="11" font-weight="700" fill="' + CT_GRID + '">' + (i + 1) + '</text>';
        s += '<text x="' + (28 + lead * 8) + '" y="' + y + '" font-size="13" font-weight="700" font-family="monospace" fill="' + (buggy ? CT_BAD : 'currentColor') + '">' + txt + '</text>';
    }
    return s + '</svg>';
}
// L4 / L6：程式追蹤表（當電腦，一輪輪把變數值寫下來）。全不填底色→亮暗皆清楚。
function traceTable(headers, rows, opts) {
    opts = opts || {};
    var W = 300, cols = headers.length, tx0 = 10, cw = (W - 2 * tx0) / cols;
    var hH = 26, rH = 26, top = 8, noteH = opts.finalNote ? 24 : 0;
    var H = top + hH + rows.length * rH + 6 + noteH;
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + (opts.aria || '程式追蹤表') + '">';
    for (var c = 0; c < cols; c++) {
        var hx = tx0 + c * cw;
        s += '<rect x="' + hx + '" y="' + top + '" width="' + cw + '" height="' + hH + '" fill="none" stroke="' + CT_GRID + '" stroke-width="1.6"/>';
        s += '<text x="' + (hx + cw / 2) + '" y="' + (top + 17) + '" text-anchor="middle" font-size="12" font-weight="800" fill="' + CT_SU + '">' + headers[c] + '</text>';
    }
    for (var r = 0; r < rows.length; r++) {
        var ry = top + hH + r * rH, mism = (opts.mismatchRow === r);
        for (var k = 0; k < cols; k++) {
            var cx = tx0 + k * cw;
            s += '<rect x="' + cx + '" y="' + ry + '" width="' + cw + '" height="' + rH + '" fill="none" stroke="' + (mism ? CT_BAD : CT_GRID) + '" stroke-width="' + (mism ? 2.5 : 1) + '"/>';
            s += '<text x="' + (cx + cw / 2) + '" y="' + (ry + 17) + '" text-anchor="middle" font-size="12.5" font-weight="700" fill="' + (mism ? CT_BAD : 'currentColor') + '">' + (rows[r][k] || '') + '</text>';
        }
    }
    if (opts.finalNote)
        s += '<text x="150" y="' + (top + hH + rows.length * rH + 17) + '" text-anchor="middle" font-size="13" font-weight="800" fill="' + CT_SU + '">' + opts.finalNote + '</text>';
    return s + '</svg>';
}
// L4：累加鏈 0 →(+1) 1 →(+2) 3 →(+3) 6，讓孩子看懂 sum 怎麼長大。
function accumChain(start, adds) {
    var vals = [start];
    for (var a = 0; a < adds.length; a++)
        vals.push(vals[vals.length - 1] + adds[a]);
    var W = 300, n = vals.length, pad = 20, y = 54, gap = (W - 2 * pad) / (n - 1);
    var s = '<svg viewBox="0 0 300 92" role="img" aria-label="sum 從 ' + start + ' 開始，逐輪加上 i，最後變成 ' + vals[vals.length - 1] + '">';
    for (var i = 0; i < n - 1; i++) {
        var x1 = pad + i * gap, x2 = pad + (i + 1) * gap, mx = (x1 + x2) / 2;
        s += '<line x1="' + (x1 + 16) + '" y1="' + y + '" x2="' + (x2 - 16) + '" y2="' + y + '" stroke="' + CT_GRID + '" stroke-width="1.8"/>';
        s += '<polygon points="' + (x2 - 16) + ',' + y + ' ' + (x2 - 22) + ',' + (y - 4) + ' ' + (x2 - 22) + ',' + (y + 4) + '" fill="' + CT_GRID + '"/>';
        s += '<text x="' + mx + '" y="' + (y - 10) + '" text-anchor="middle" font-size="12" font-weight="800" fill="' + CT_BAD + '">+' + adds[i] + '</text>';
    }
    for (var j = 0; j < n; j++) {
        var cx = pad + j * gap, last = (j === n - 1);
        s += '<circle cx="' + cx + '" cy="' + y + '" r="15" fill="none" stroke="' + (last ? CT_OK : CT_SU) + '" stroke-width="' + (last ? 3 : 2.2) + '"/>';
        s += '<text x="' + cx + '" y="' + (y + 5) + '" text-anchor="middle" font-size="13.5" font-weight="800" fill="currentColor">' + vals[j] + '</text>';
    }
    s += '<text x="150" y="86" text-anchor="middle" font-size="11.5" font-weight="700" fill="currentColor">圓圈裡就是每一輪的 sum</text>';
    return s + '</svg>';
}
// L5：條件判斷 if／else 的分岔（菱形 + 是／否 兩路），litPath 點亮走到的那條。
function branch(q, yesLabel, noLabel, litPath) {
    var s = '<svg viewBox="0 0 300 196" role="img" aria-label="條件判斷：' + q + '，成立走「' + yesLabel + '」，不成立走「' + noLabel + '」">';
    // 菱形
    s += '<polygon points="150,14 232,54 150,94 68,54" fill="none" stroke="' + CT_SU + '" stroke-width="2.4"/>';
    s += '<text x="150" y="59" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">' + q + '</text>';
    var yesLit = litPath === 'yes', noLit = litPath === 'no';
    // 是（左路）
    s += '<line x1="90" y1="68" x2="70" y2="120" stroke="' + (yesLit ? CT_OK : CT_GRID) + '" stroke-width="' + (yesLit ? 3 : 1.8) + '"/>';
    s += '<text x="60" y="96" font-size="12" font-weight="800" fill="' + CT_OK + '">是</text>';
    s += '<rect x="14" y="122" width="124" height="40" rx="8" fill="none" stroke="' + (yesLit ? CT_OK : CT_SU) + '" stroke-width="' + (yesLit ? 3 : 2) + '"/>';
    s += '<text x="76" y="146" text-anchor="middle" font-size="12.5" font-weight="800" fill="currentColor">' + yesLabel + '</text>';
    // 否（右路）
    s += '<line x1="210" y1="68" x2="230" y2="120" stroke="' + (noLit ? CT_OK : CT_GRID) + '" stroke-width="' + (noLit ? 3 : 1.8) + '"/>';
    s += '<text x="232" y="96" font-size="12" font-weight="800" fill="' + CT_BAD + '">否</text>';
    s += '<rect x="162" y="122" width="124" height="40" rx="8" fill="none" stroke="' + (noLit ? CT_OK : CT_SU) + '" stroke-width="' + (noLit ? 3 : 2) + '"/>';
    s += '<text x="224" y="146" text-anchor="middle" font-size="12.5" font-weight="800" fill="currentColor">' + noLabel + '</text>';
    if (litPath)
        s += '<text x="150" y="186" text-anchor="middle" font-size="12" font-weight="800" fill="' + CT_OK + '">→ 走「' + (yesLit ? yesLabel : noLabel) + '」這條路</text>';
    return s + '</svg>';
}
// L6：除錯＝比對「錯寫法 vs 對寫法」，鎖定出錯那一行。
function bugFix(wrong, right, note) {
    var s = '<svg viewBox="0 0 300 118" role="img" aria-label="除錯：把寫錯的 ' + wrong + ' 改成正確的 ' + right + '">';
    s += '<text x="14" y="22" font-size="12" font-weight="800" fill="' + CT_BAD + '">✗ 錯：</text>';
    s += '<text x="58" y="22" font-size="13" font-weight="700" font-family="monospace" fill="' + CT_BAD + '">' + wrong + '</text>';
    s += '<text x="14" y="52" font-size="12" font-weight="800" fill="' + CT_OK + '">✓ 對：</text>';
    s += '<text x="58" y="52" font-size="13" font-weight="700" font-family="monospace" fill="' + CT_OK + '">' + right + '</text>';
    s += '<line x1="14" y1="66" x2="286" y2="66" stroke="' + CT_GRID + '" stroke-width="1"/>';
    s += '<text x="150" y="90" text-anchor="middle" font-size="12.5" font-weight="700" fill="currentColor">' + note + '</text>';
    s += '<text x="150" y="108" text-anchor="middle" font-size="11.5" font-weight="700" fill="' + CT_SU + '">鎖定「第一個不對的地方」就是除錯</text>';
    return s + '</svg>';
}
window.CONCEPT = {
    progKey: 'comp_thinking_v1', practiceHref: 'computer_science.html',
    lessons: [
        { id: 'decomp', name: '拆解問題', emoji: '🧩', color: '#4f46e5', sub: '把大問題拆成一步步小步驟', done: '記得：遇到大問題別慌——拆成有順序的小步驟，每一步都簡單、好檢查哪裡出錯。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '大問題，拆成一步步小步驟', svg: decompTree('做一份三明治', ['拿兩片麵包', '塗上果醬', '放進配料', '蓋起來、對半切']), text: '「做一份三明治」聽起來是一件事，其實可以<b>拆成有順序的小步驟</b>：拿麵包 → 塗醬 → 放配料 → 蓋起來切半。把<b>大問題拆成一步步小問題</b>，就不難了——這就是運算思維的第一招「<b>拆解</b>」。' },
                { type: 'teach', kicker: '為什麼有用', title: '拆小了，每一步都好檢查', svg: splitBig('大問題', ['小步驟', '小步驟', '小步驟']), text: '把大問題拆成幾個<b>簡單的小步驟</b>後，每一步都好做；萬一結果不對，也能<b>一步一步檢查</b>是哪一步出錯，而不是對著一大團手足無措。' },
                { type: 'quiz', kicker: '換你試試', title: '要完成「整理書包」，最像運算思維「拆解」的做法是？', options: ['拿出課本 → 對照課表 → 放回明天要用的 → 拉上拉鍊', '一次全倒出來、亂塞回去', '叫別人幫你整理', '太麻煩，乾脆放棄'], answer: 0, why: '把「整理書包」拆成有順序的小步驟（拿出、對照、放回、拉鍊），就是「拆解」。', whyWrong: ['', '全倒出來亂塞沒有把事情拆成有順序的小步驟，反而更亂、也沒辦法檢查。', '請別人做，你自己並沒有把問題拆解開來理解。', '放棄就沒有解決問題；拆解的用意正是讓難題變得可以一步步完成。'] },
                { type: 'quiz', kicker: '換你試試', title: '把問題「拆解」成小步驟，最大的好處是？', options: ['每個小步驟都簡單，也好檢查哪裡出錯', '會讓問題變得更大更難', '這樣就可以完全不用動腦', '一定會比不拆解還慢'], answer: 0, why: '拆成小步驟後每一步都簡單易做，出錯時也能逐步定位，是拆解的核心好處。', whyWrong: ['', '拆解是把大問題變成好處理的小塊，不會讓問題變大。', '拆解仍要動腦規劃每一步，只是把思考分段、變得輕鬆。', '拆解讓步驟清楚、少走冤枉路，通常更有效率而不是更慢。'] }
            ] },
        { id: 'pattern', name: '找規律與抽象', emoji: '🔁', color: '#6366f1', sub: '找出重複的規律、抽掉細節只留重點', done: '記得：找出重複的規律，再抽掉枝節只留關鍵規則，就能用一個簡單規則處理很多情況。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '找出重複的規律', svg: seqPattern([2, 4, 6, 8, 10], '+2'), text: '看這串數字 2、4、6、8、10……每一項都比前一項<b>多 2</b>。一旦找到「<b>每次 +2</b>」這個<b>重複的規律</b>，不用把每個數字都背下來，也能一直接下去。找規律，是運算思維很重要的一招。' },
                { type: 'teach', kicker: '再進一步', title: '抽象：抽掉細節，只留關鍵規則', svg: repeatShape(4, 90), text: '想「畫一個正方形」，與其一筆一筆記四條線，不如看出它其實是<b>重複「前進一段、右轉 90°」四次</b>。把不重要的細節<b>抽掉</b>、只留下<b>關鍵的重複規則</b>，這叫「<b>抽象</b>」——同一個規則，換個次數就能畫三角形、六邊形。' },
                { type: 'quiz', kicker: '換你試試', title: '要畫一個邊長相等的六邊形，用運算思維最省事的描述是？', options: ['重複「前進一段、右轉 60°」六次', '一筆一筆硬寫六條不一樣的指令', '拿尺慢慢量著畫', '隨便亂畫就好'], answer: 0, why: '六邊形每個外角 60°，所以「前進、右轉 60°」重複六次剛好畫完一圈，這就是找規律＋抽象。', whyWrong: ['', '六條邊其實是同一個動作重複，寫成六條不同指令沒有用上重複的規律。', '用尺量能畫出來，但沒有找出可重複的規則，無法交給程式自動重複。', '隨便畫無法保證邊長相等、角度正確，也沒有可重複的規律。'] },
                { type: 'quiz', kicker: '換你試試', title: '這裡說的「抽象」，意思最接近？', options: ['抽掉不重要的細節，只留下關鍵規則', '把東西變得模糊看不清', '畫一幅抽象畫', '把資料整個刪掉'], answer: 0, why: '抽象是「保留關鍵、略去枝節」，讓一個簡單規則能處理很多情況。', whyWrong: ['', '抽象不是變模糊，反而是讓重點更清楚、更好用。', '這裡的抽象是思考方法，和畫抽象畫無關。', '抽象是略去細節、保留重點，不是刪掉資料。'] }
            ] },
        { id: 'flow', name: '讀流程圖與虛擬碼', emoji: '📊', color: '#0ea5e9', sub: '看懂流程圖符號、讀虛擬碼', done: '記得：流程圖用圖形表示步驟（菱形＝判斷）；虛擬碼用白話步驟寫演算法、不綁特定程式語言。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '流程圖：用圖形表示每一步', svg: flowDecide('看天氣', '會下雨嗎？', '帶雨傘', '不用帶'), text: '流程圖用<b>圖形</b>把步驟畫出來：<b>圓角框</b>是開始／結束、<b>長方形</b>是一個動作、<b>菱形</b>是一個<b>判斷</b>（會分成「是／否」兩條路）。順著箭頭走，就知道程式會怎麼跑。' },
                { type: 'teach', kicker: '換個寫法', title: '虛擬碼：用白話步驟寫演算法', svg: codeBox('虛擬碼（用接近白話的步驟寫）', ['讀入 分數', '如果 分數 ≥ 60：', '    顯示「及格」', '否則：', '    顯示「再加油」'], -1), text: '<b>虛擬碼</b>是用<b>接近白話的步驟</b>把演算法寫下來，<b>不綁定特定程式語言</b>。它重點在把<b>邏輯</b>講清楚、方便人看懂，之後再翻成任何一種程式都行。流程圖用畫的、虛擬碼用寫的，說的是同一套步驟。' },
                { type: 'quiz', kicker: '換你試試', title: '流程圖裡的「菱形」通常代表什麼？', options: ['一個判斷（分出「是／否」兩條路）', '一個動作', '流程的開始', '流程的結束'], answer: 0, why: '菱形是判斷（條件），依條件成立與否分成兩條路，是流程圖裡的分岔點。', whyWrong: ['', '動作通常畫成長方形，不是菱形。', '開始通常畫成圓角框，不是菱形。', '結束通常畫成圓角框，不是菱形。'] },
                { type: 'quiz', kicker: '換你試試', title: '虛擬碼的用途是？', options: ['用好懂的步驟描述演算法，方便人看懂', '它一定要能直接被電腦執行', '故意寫得只有專家看得懂', '和程式完全沒有關係'], answer: 0, why: '虛擬碼重在用白話把邏輯表達清楚、方便人閱讀，不綁特定語言、不一定能直接執行。', whyWrong: ['', '虛擬碼不是真正的程式，通常不能直接執行，重點是表達邏輯。', '虛擬碼刻意寫得白話好懂，正是為了讓更多人看得懂。', '虛擬碼描述的正是程式的邏輯，和程式關係很密切。'] }
            ] },
        { id: 'trace', name: '跟著迴圈跑一遍', emoji: '🏃', color: '#8b5cf6', sub: '當電腦，用追蹤表把每一步寫下來', done: '記得：看不懂一段程式？就當自己是電腦，拿追蹤表把每一輪的變數值一步步寫下來跑一遍。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '當電腦，拿紙筆跑一遍', svg: codeBox('這段程式（迴圈）', ['sum = 0', '重複 i 從 1 到 3：', '    sum = sum + i'], -1), text: '這段程式有一個<b>迴圈</b>：先讓 <b>sum = 0</b>，再讓 <b>i 從 1 跑到 3</b>，每一輪都把 <b>sum 加上現在的 i</b>。不確定它會做什麼？別用猜的——下一步我們<b>當電腦</b>，把每一輪的值寫下來。' },
                { type: 'teach', kicker: '用追蹤表', title: '追蹤表：每一輪都寫下 i 和 sum', svg: traceTable(['輪次', 'i', 'sum'], [['起始', '—', '0'], ['①', '1', '1'], ['②', '2', '3'], ['③', '3', '6']], { finalNote: '跑完：sum = 6', aria: 'sum 從 0 開始，第一輪加 1 變 1，第二輪加 2 變 3，第三輪加 3 變 6' }), text: '把每一輪的 <b>i</b> 和 <b>sum</b> 填進<b>追蹤表</b>：i=1 時 sum 變 <b>1</b>；i=2 時 sum 變 <b>3</b>；i=3 時 sum 變 <b>6</b>。這樣一行一行跑，程式再也不神祕——跑完 <b>sum = 6</b>（就是 1＋2＋3）。' },
                { type: 'teach', kicker: '看它怎麼長大', title: 'sum 是這樣一輪一輪加大的', svg: accumChain(0, [1, 2, 3]), text: '把過程連起來看：<b>0 →(+1) 1 →(+2) 3 →(+3) 6</b>。每一輪加上去的，都是<b>當時的 i</b>，所以 sum 一路長到 <b>6</b>。記住這個加法的順序，待會兒除錯會用到。' },
                { type: 'quiz', kicker: '換你試試', title: '「sum = 0；i 從 1 到 3，每輪 sum = sum + i」，跑完 sum 是多少？', options: ['6', '3', '0', '9'], answer: 0, why: '逐輪累加：1 → 1+2=3 → 3+3=6，所以跑完 sum = 6（可用追蹤表驗證）。', whyWrong: ['', '3 只是跑到 i=2 那一輪的 sum，還要再加 i=3 才跑完，答案是 6。', '0 是還沒進迴圈的起始值，跑完三輪後是 6。', '9 多加了；i 只到 3，1+2+3 是 6，不是 9。'] },
                { type: 'quiz', kicker: '換你試試', title: '看不懂一段迴圈到底在做什麼，最可靠的方法是？', options: ['用追蹤表把每一輪的變數值寫下來、跑一遍', '用猜的就好', '直接問別人答案、自己不跑', '太難就跳過不看'], answer: 0, why: '手動追蹤（trace）＝把每一步的變數狀態寫下來，能最確實地看清迴圈做了什麼。', whyWrong: ['', '用猜的常常會錯，追蹤表才能確實看出每一輪的變化。', '問到答案也不懂過程；自己跑一遍追蹤表才真的學會。', '跳過就永遠不懂；拆成一輪一輪寫下來，其實沒那麼難。'] }
            ] },
        { id: 'cond', name: '條件判斷 if／else', emoji: '🔀', color: '#0891b2', sub: '讓程式依情況走不同的路', done: '記得：if／else 讓程式依條件成立與否走不同動作；注意邊界值——「≥」包含等於。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '條件判斷：依情況走不同路', svg: branch('分數 ≥ 60 ？', '顯示「及格」', '顯示「再加油」', ''), text: '<b>條件判斷（if／else）</b>讓程式<b>依情況走不同的路</b>：如果「分數 ≥ 60」<b>成立</b>，就顯示「及格」；<b>不成立</b>就走另一條路，顯示「再加油」。一個條件，兩種結果。' },
                { type: 'teach', kicker: '小心邊界', title: '剛好 60，走哪一條？', svg: branch('分數 = 60，有 ≥ 60 嗎？', '及格', '再加油', 'yes'), text: '要特別留意<b>邊界值</b>。「<b>≥</b>」是「大於<b>或等於</b>」，所以分數<b>剛好 60</b> 也算<b>成立</b>，會走「及格」。如果寫成「<b>></b>」（只有大於、不含等於），60 就會變成不及格——差一個符號，結果就不同。' },
                { type: 'quiz', kicker: '換你試試', title: '「如果 分數 ≥ 60 顯示及格，否則顯示不及格」，分數剛好 60 會顯示？', options: ['及格（≥ 包含等於）', '不及格', '兩個都顯示', '沒有反應'], answer: 0, why: '「≥」是大於或等於，60 等於 60 條件成立，所以顯示「及格」。', whyWrong: ['', '≥ 含「等於」，60 符合條件，不會走到「否」那條路。', 'if／else 只會走成立或不成立其中一條，不會兩個都顯示。', '條件成立就會執行對應動作，不會沒反應。'] },
                { type: 'quiz', kicker: '換你試試', title: 'if…else 的作用是？', options: ['依條件成立與否，走不同的動作', '把同一件事重複很多次', '不管怎樣都只做同一件事', '和判斷沒有關係'], answer: 0, why: 'if…else 是條件分支：條件成立做一件事、不成立做另一件事。', whyWrong: ['', '把事情重複很多次是「迴圈」的工作，不是 if…else。', 'if…else 正是為了依情況做不同的事，不是永遠做同一件。', 'if…else 的核心就是「判斷」，關係非常密切。'] }
            ] },
        { id: 'debug', name: '除錯：找出哪一步錯了', emoji: '🔍', color: '#db2777', sub: '比對預期與實際，鎖定出錯的那一步', done: '記得：除錯＝用追蹤表比對「預期 vs 實際」，找出第一個不一樣的地方，就能鎖定錯在哪。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '結果不對？比對「預期 vs 實際」', svg: traceTable(['輪次', 'i', '預期', '實際'], [['①', '1', '1', '1'], ['②', '2', '3', '2'], ['③', '3', '6', '3']], { mismatchRow: 1, finalNote: '預期 6，實際卻是 3', aria: '預期逐輪 1、3、6，實際逐輪 1、2、3，第二輪開始不一樣' }), text: '這段程式<b>本該算 1＋2＋3＝6</b>，實際卻只跑出 <b>3</b>。把<b>預期值</b>和<b>實際值</b>並排進追蹤表，一輪一輪比對：第①輪都是 1、沒問題；到<b>第②輪就不一樣了</b>（預期 3、實際 2）。這裡就是出錯的起點。' },
                { type: 'teach', kicker: '鎖定那一行', title: '原來加錯了：是常數 1，不是 i', svg: bugFix('sum = sum + 1', 'sum = sum + i', '每一輪都只加固定的 1，難怪變成 1、2、3'), text: '找到第一個偏差後，去看那一行：原本寫成 <b>sum = sum + 1</b>——每一輪都只加<b>固定的 1</b>，而不是<b>當時的 i</b>，所以結果變成 1、2、3。改成 <b>sum = sum + i</b> 就對了。<b>除錯＝比對預期與實際、鎖定第一個不對的步驟</b>。' },
                { type: 'quiz', kicker: '換你試試', title: '程式結果不如預期時，最有效的第一步是？', options: ['用追蹤表比對每一步的「預期 vs 實際」，找出第一個不一樣的地方', '整段程式打掉重寫', '把程式刪掉算了', '把電腦重新開機'], answer: 0, why: '找出「預期與實際第一次不同」的那一步，就能把錯誤鎖定在很小的範圍，是最有效率的第一步。', whyWrong: ['', '還沒找到錯在哪就整段重寫，很可能再犯同樣的錯，也浪費力氣。', '刪掉程式問題並沒有解決，下次還是會遇到。', '重開機不會修正程式邏輯的錯誤，問題依舊存在。'] },
                { type: 'quiz', kicker: '換你試試', title: '上面的迴圈本該算 1＋2＋3，卻把每一輪都 +1 得到 3，錯在哪？', options: ['迴圈裡加的是固定的 1，而不是當前的 i', '迴圈跑的次數錯了', '變數的名字取錯了', '其實沒有錯'], answer: 0, why: '應該累加「當前的 i」(1、2、3)，卻誤寫成固定的常數 1，所以每輪只加 1、得到 3。', whyWrong: ['', '迴圈一樣跑了三輪（i＝1、2、3），次數沒錯，錯在加的東西。', '變數名字沒問題，問題出在把 i 寫成了固定的 1。', '結果 3 不等於預期的 6，確實有錯，就在加號後面那個 1。'] }
            ] }
    ]
};
