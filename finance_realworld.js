/* =====================================================================
 * finance_realworld.ts  →  (tsc, tsconfig.legacy.json) →  finance_realworld.js
 * 「理財・真實世界」教學頁的教學資料（window.CONCEPT）＋專用 SVG 概念圖 helper。
 * 單一頁同時承載三個 lesson 群組：
 *   1) 信用卡循環利息・卡債・借貸（credit_*）
 *   2) 看穿金融詐騙：停・看・查・打 165（scam_*）
 *   3) 保險與投資工具入門—教原理，不報明牌（tools_*）
 * 載入順序：game_core.js → 本檔 → anim_core.js → concept_engine.js
 *   （本檔提供 window.CONCEPT；mount 於執行期才用 window.Anim.compoundGrowth，故解析順序無虞）。
 * 設計：繁體中文（台灣用詞）、非恐嚇、不羞辱、不報明牌；理財金色 --su。
 * 以 IIFE 包住：helper 函式為檔案區域（避免與其他已遷移頁同名 helper 的 TS2393 衝突）。
 * ===================================================================== */
(function () {
    // 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
    function animCanvas(w, h, label) {
        return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
            'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
    }
    var GOLD = '#ca8a04', RED = '#dc2626', GREEN = '#16a34a', INK = 'currentColor', MUT = '#94a3b8';
    // INKL：固定深色墨水，給「畫在硬寫死的淺色塊上」的文字用（currentColor 在暗色主題會變淺 → 淺字壓淺底看不見）。
    var INKL = '#1f2937';
    // ---------- Group 1：信用卡/卡債/借貸 專用 SVG ----------
    // 借 100 → 還 110，多出來的 10 元就是利息（借錢的租金）。
    function coinInterest() {
        var s = '<svg viewBox="0 0 280 140" role="img" aria-label="借出 100 元，到期要還 110 元，多出來的 10 元就是利息">';
        s += '<circle cx="52" cy="56" r="30" fill="#fef3c7" stroke="' + GOLD + '" stroke-width="2.5"/>';
        s += '<text x="52" y="52" text-anchor="middle" font-size="18" font-weight="800" fill="' + GOLD + '">100</text>';
        s += '<text x="52" y="70" text-anchor="middle" font-size="10" fill="' + INKL + '">借來的錢</text>';
        s += '<text x="52" y="112" text-anchor="middle" font-size="11" font-weight="800" fill="' + INK + '">借 100 元</text>';
        s += '<line x1="92" y1="56" x2="150" y2="56" stroke="' + INK + '" stroke-width="2.5"/><polygon points="150,56 140,51 140,61" fill="' + INK + '"/>';
        s += '<text x="121" y="44" text-anchor="middle" font-size="10" fill="' + INK + '">到期要還</text>';
        s += '<circle cx="192" cy="56" r="30" fill="#fef3c7" stroke="' + GOLD + '" stroke-width="2.5"/>';
        s += '<text x="192" y="52" text-anchor="middle" font-size="18" font-weight="800" fill="' + GOLD + '">110</text>';
        s += '<text x="192" y="70" text-anchor="middle" font-size="10" fill="' + INKL + '">要還的錢</text>';
        s += '<text x="192" y="112" text-anchor="middle" font-size="11" font-weight="800" fill="' + INK + '">還 110 元</text>';
        s += '<rect x="236" y="40" width="40" height="32" rx="6" fill="#fee2e2" stroke="' + RED + '" stroke-width="2"/>';
        s += '<text x="256" y="54" text-anchor="middle" font-size="13" font-weight="800" fill="' + RED + '">+10</text>';
        s += '<text x="256" y="67" text-anchor="middle" font-size="9" fill="' + RED + '">利息</text>';
        s += '<text x="140" y="132" text-anchor="middle" font-size="11" font-weight="800" fill="' + INK + '">多出來的 10 元 = 利息 = 借錢的租金</text>';
        return s + '</svg>';
    }
    // 利率＝一段時間要付的租金比例：年利率 15% ＝ 借一年每 100 元付 15 元。
    function rateRuler() {
        var s = '<svg viewBox="0 0 280 140" role="img" aria-label="年利率 15 趴，表示借一年每 100 元要付 15 元的利息">';
        s += '<text x="140" y="22" text-anchor="middle" font-size="12" font-weight="800" fill="' + GOLD + '">利率 = 一段時間要付的租金比例</text>';
        s += '<rect x="24" y="46" width="232" height="30" rx="6" fill="#fef3c7" stroke="' + GOLD + '" stroke-width="2"/>';
        s += '<rect x="24" y="46" width="' + (232 * 0.15).toFixed(1) + '" height="30" rx="6" fill="' + GOLD + '" fill-opacity="0.55"/>';
        s += '<text x="35" y="100" text-anchor="start" font-size="11" font-weight="800" fill="' + INK + '">每 100 元</text>';
        s += '<text x="' + (24 + 232 * 0.075).toFixed(1) + '" y="65" text-anchor="middle" font-size="11" font-weight="800" fill="' + GOLD + '">15</text>';
        s += '<text x="140" y="120" text-anchor="middle" font-size="12" font-weight="800" fill="' + INK + '">年利率 15% ＝ 借一年，每 100 元付 15 元</text>';
        return s + '</svg>';
    }
    // 帳單：全額繳清＝0 利息 vs 只繳最低＝開始滾息。
    function billSvg(mode) {
        var full = (mode === 'full');
        var s = '<svg viewBox="0 0 280 150" role="img" aria-label="' + (full ? '帳單在期限前全額繳清，利息是零' : '帳單只繳最低應繳金額，剩下的錢開始被收循環利息') + '">';
        s += '<rect x="40" y="16" width="200" height="118" rx="10" fill="#ffffff" stroke="' + INK + '" stroke-opacity="0.5" stroke-width="2"/>';
        s += '<text x="140" y="40" text-anchor="middle" font-size="13" font-weight="800" fill="' + INKL + '">信用卡帳單</text>';
        s += '<line x1="56" y1="50" x2="224" y2="50" stroke="' + INK + '" stroke-opacity="0.3" stroke-width="1.5"/>';
        s += '<text x="56" y="72" text-anchor="start" font-size="11" fill="' + INKL + '">本期消費　3000 元</text>';
        if (full) {
            s += '<text x="56" y="96" text-anchor="start" font-size="12" font-weight="800" fill="' + GREEN + '">✅ 全額繳清 3000</text>';
            s += '<rect x="52" y="106" width="176" height="22" rx="6" fill="#dcfce7" stroke="' + GREEN + '" stroke-width="1.5"/>';
            s += '<text x="140" y="121" text-anchor="middle" font-size="11" font-weight="800" fill="' + GREEN + '">循環利息：0 元</text>';
        }
        else {
            s += '<text x="56" y="96" text-anchor="start" font-size="12" font-weight="800" fill="' + RED + '">只繳最低 300</text>';
            s += '<rect x="52" y="106" width="176" height="22" rx="6" fill="#fee2e2" stroke="' + RED + '" stroke-width="1.5"/>';
            s += '<text x="140" y="121" text-anchor="middle" font-size="11" font-weight="800" fill="' + RED + '">剩 2700 開始滾循環利息</text>';
        }
        s += '<text x="258" y="80" text-anchor="middle" font-size="26">' + (full ? '😊' : '⚠️') + '</text>';
        return s + '</svg>';
    }
    // 擺脫雪球三步（停刷 → 優先還高利 → 找正規管道談）。
    function snowballBrake() {
        var s = '<svg viewBox="0 0 280 150" role="img" aria-label="擺脫卡債雪球三步：先停止再刷、優先還利率最高的債、必要時找家人或正規金融機構談">';
        s += '<text x="140" y="20" text-anchor="middle" font-size="12" font-weight="800" fill="' + GOLD + '">踩剎車，雪球就停下來</text>';
        var items = [['①', '🛑', '先停止再刷卡'], ['②', '🎯', '優先還利率最高的債'], ['③', '🤝', '找家人或正規金融機構談']];
        for (var i = 0; i < 3; i++) {
            var y = 36 + i * 36;
            s += '<rect x="20" y="' + y + '" width="240" height="30" rx="8" fill="#fef3c7" stroke="' + GOLD + '" stroke-width="1.6"/>';
            s += '<text x="36" y="' + (y + 20) + '" text-anchor="middle" font-size="13" font-weight="800" fill="' + GOLD + '">' + items[i][0] + '</text>';
            s += '<text x="60" y="' + (y + 21) + '" text-anchor="middle" font-size="16">' + items[i][1] + '</text>';
            s += '<text x="80" y="' + (y + 20) + '" text-anchor="start" font-size="12" font-weight="700" fill="' + INKL + '">' + items[i][2] + '</text>';
        }
        return s + '</svg>';
    }
    // 借貸決策關卡：三個問題像三道關，任一題「否」就亮紅燈別借；三題都「是」才亮綠燈可借。
    function borrowThree() {
        var s = '<svg viewBox="0 0 280 196" role="img" aria-label="要不要借錢，像闖三道關：第一關非借不可嗎、第二關我還得起嗎、第三關是正規管道、利率清楚嗎。只要任何一關答否，就亮紅燈先別借；三關都答是，才亮綠燈可以謹慎地借。這讓你一步步想清楚該不該借">';
        s += '<text x="140" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + GOLD + '">要不要借？過三關才點綠燈</text>';
        var q = ['① 非借不可嗎？', '② 我「還得起」嗎？', '③ 正規管道、利率清楚嗎？'];
        var gy = [28, 76, 124];
        for (var i = 0; i < 3; i++) {
            var y = gy[i];
            // 關卡
            s += '<rect x="16" y="' + y + '" width="150" height="30" rx="8" fill="#fef3c7" stroke="' + GOLD + '" stroke-width="1.8"/>';
            s += '<text x="91" y="' + (y + 20) + '" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + INKL + '">' + q[i] + '</text>';
            // 否 → 紅燈
            s += '<path d="M166 ' + (y + 15) + ' L196 ' + (y + 15) + '" stroke="' + RED + '" stroke-width="1.8" marker-end="url(#btr)"/>';
            s += '<text x="181" y="' + (y + 9) + '" text-anchor="middle" font-size="8.5" font-weight="800" fill="' + RED + '">否</text>';
            // 是 → 往下一關
            if (i < 2) {
                s += '<path d="M91 ' + (y + 30) + ' L91 ' + gy[i + 1] + '" stroke="' + GREEN + '" stroke-width="1.8" marker-end="url(#btg)"/>';
                s += '<text x="99" y="' + (y + 42) + '" text-anchor="middle" font-size="8.5" font-weight="800" fill="' + GREEN + '">是</text>';
            }
        }
        // 紅燈面板（右側，三道否都通到這）
        s += '<rect x="200" y="34" width="68" height="100" rx="10" fill="#fee2e2" stroke="' + RED + '" stroke-width="2"/>';
        s += '<text x="234" y="74" text-anchor="middle" font-size="22">🔴</text>';
        s += '<text x="234" y="98" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + RED + '">任一題「否」</text>';
        s += '<text x="234" y="113" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + RED + '">＝先別借</text>';
        // 綠燈（三關都是）
        s += '<path d="M91 154 L91 164" stroke="' + GREEN + '" stroke-width="1.8" marker-end="url(#btg)"/>';
        s += '<text x="99" y="162" text-anchor="middle" font-size="8.5" font-weight="800" fill="' + GREEN + '">是</text>';
        s += '<rect x="20" y="166" width="240" height="26" rx="8" fill="#dcfce7" stroke="' + GREEN + '" stroke-width="2"/>';
        s += '<text x="140" y="183" text-anchor="middle" font-size="11" font-weight="800" fill="' + GREEN + '">🟢 三關都「是」→ 可以謹慎地借</text>';
        s += '<defs>' +
            '<marker id="btr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + RED + '"/></marker>' +
            '<marker id="btg" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + GREEN + '"/></marker>' +
            '</defs>';
        return s + '</svg>';
    }
    // ---------- Group 2：詐騙辨識 專用 SVG（stepped / static）----------
    // 假訊息聊天泡泡，逐步浮出 n 面紅旗。
    function scamFlags(n) {
        var s = '<svg viewBox="0 0 280 160" role="img" aria-label="一則可疑訊息，逐步標出' + n + '面紅旗">';
        s += '<rect x="18" y="18" width="200" height="30" rx="12" fill="#e0f2fe" stroke="' + INK + '" stroke-opacity="0.3" stroke-width="1.3"/>';
        s += '<text x="30" y="37" text-anchor="start" font-size="11" fill="' + INKL + '">「保證穩賺不賠，名額只剩今天！」</text>';
        s += '<rect x="18" y="54" width="210" height="30" rx="12" fill="#e0f2fe" stroke="' + INK + '" stroke-opacity="0.3" stroke-width="1.3"/>';
        s += '<text x="30" y="73" text-anchor="start" font-size="11" fill="' + INKL + '">「現在不決定就沒了，要馬上處理」</text>';
        s += '<rect x="18" y="90" width="222" height="30" rx="12" fill="#e0f2fe" stroke="' + INK + '" stroke-opacity="0.3" stroke-width="1.3"/>';
        s += '<text x="30" y="109" text-anchor="start" font-size="11" fill="' + INKL + '">「私下付款就好，別跟家人說」</text>';
        var flags = ['🚩 太美好', '🚩 很急', '🚩 要你保密付款'];
        var fy = [33, 69, 105];
        for (var i = 0; i < 3; i++) {
            if (i < n) {
                s += '<text x="246" y="' + fy[i] + '" text-anchor="middle" font-size="16">🚩</text>';
                s += '<rect x="18" y="' + (fy[i] - 15) + '" width="' + (i === 0 ? 200 : (i === 1 ? 210 : 222)) + '" height="30" rx="12" fill="none" stroke="' + RED + '" stroke-width="2"/>';
            }
        }
        s += '<text x="140" y="146" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + RED + '">' + (flags[Math.max(0, n - 1)] || '') + (n >= 3 ? '　＝紅燈！' : '') + '</text>';
        return s + '</svg>';
    }
    // 常見手法 4 卡：highlight 的卡亮紅旗，所有手法最後都「收束」到同一個目的（要你的錢／驗證碼）。
    function scamGallery(hl) {
        var cards = [['📈', '假投資', '老師帶單、穩賺'], ['📞', '假客服', '要你去 ATM 操作'], ['💌', '假交友', '博感情再借錢'], ['🎁', '假中獎', '先繳費才能領獎']];
        hl = hl && hl.length ? hl : [0, 1, 2, 3];
        var on = function (i) { return hl.indexOf(i) >= 0; };
        var s = '<svg viewBox="0 0 280 192" role="img" aria-label="常見詐騙手法像假投資、假客服、假交友、假中獎，手法雖然不同，但每一種的紅旗最後都收束到同一個目的：要你的錢，或要你的驗證碼和個資">';
        s += '<text x="140" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + GOLD + '">手法會變，但最後都通到同一個目的</text>';
        // 一排四卡（highlight 的亮紅旗、其餘淡化）
        for (var i = 0; i < 4; i++) {
            var cx = 8 + i * 68, lit = on(i);
            s += '<rect x="' + cx + '" y="26" width="60" height="50" rx="9" fill="' + (lit ? '#fef3c7' : '#f1f5f9') + '" stroke="' + (lit ? RED : MUT) + '" stroke-width="' + (lit ? 2.2 : 1.2) + '" opacity="' + (lit ? 1 : 0.5) + '"/>';
            s += '<text x="' + (cx + 30) + '" y="46" text-anchor="middle" font-size="18" opacity="' + (lit ? 1 : 0.5) + '">' + cards[i][0] + '</text>';
            s += '<text x="' + (cx + 30) + '" y="60" text-anchor="middle" font-size="10" font-weight="800" fill="' + (lit ? INKL : MUT) + '">' + cards[i][1] + '</text>';
            s += '<text x="' + (cx + 30) + '" y="71" text-anchor="middle" font-size="6.8" fill="' + (lit ? INKL : MUT) + '">' + cards[i][2] + '</text>';
            if (lit) {
                s += '<text x="' + (cx + 52) + '" y="34" text-anchor="middle" font-size="13">🚩</text>';
                s += '<path d="M' + (cx + 30) + ' 78 L140 128" stroke="' + RED + '" stroke-width="1.6" marker-end="url(#sgr)"/>';
            }
            else {
                s += '<path d="M' + (cx + 30) + ' 78 L140 128" stroke="' + MUT + '" stroke-width="1" stroke-dasharray="3 3" opacity="0.5"/>';
            }
        }
        // 收束節點
        s += '<rect x="34" y="130" width="212" height="44" rx="11" fill="#fee2e2" stroke="' + RED + '" stroke-width="2"/>';
        s += '<text x="140" y="150" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + RED + '">不管哪一種，最後都要你的……</text>';
        s += '<text x="140" y="167" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + RED + '">「錢」或「驗證碼／個資」</text>';
        s += '<defs><marker id="sgr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + RED + '"/></marker></defs>';
        return s + '</svg>';
    }
    // 四步防護盾：n 格依序亮起（停→看→查→165）。
    function shieldSteps(n) {
        var cells = [['🛑', '停', '別被催促'], ['👀', '看', '太美好？要你私下付款？'], ['🔎', '查', '走你知道的官方管道'], ['☎️', '打 165', '反詐騙諮詢專線']];
        var s = '<svg viewBox="0 0 280 160" role="img" aria-label="四步防護盾：停、看、查、打 165，已亮起' + n + '格">';
        s += '<path d="M140 10 L246 34 V86 Q246 134 140 152 Q34 134 34 86 V34 Z" fill="#f8fafc" stroke="' + GOLD + '" stroke-width="2.5"/>';
        for (var i = 0; i < 4; i++) {
            var on = i < n;
            var cx = (i % 2) * 86 + 66, cy = Math.floor(i / 2) * 48 + 40;
            s += '<rect x="' + cx + '" y="' + cy + '" width="78" height="40" rx="8" fill="' + (on ? '#fef3c7' : '#eef2f6') + '" stroke="' + (on ? GOLD : MUT) + '" stroke-width="' + (on ? 2 : 1.3) + '"/>';
            s += '<text x="' + (cx + 16) + '" y="' + (cy + 26) + '" text-anchor="middle" font-size="18" opacity="' + (on ? 1 : 0.4) + '">' + cells[i][0] + '</text>';
            s += '<text x="' + (cx + 50) + '" y="' + (cy + 19) + '" text-anchor="middle" font-size="12" font-weight="800" fill="' + (on ? GOLD : MUT) + '">' + cells[i][1] + '</text>';
            s += '<text x="' + (cx + 50) + '" y="' + (cy + 33) + '" text-anchor="middle" font-size="7.5" fill="' + (on ? INKL : MUT) + '">' + cells[i][2] + '</text>';
        }
        return s + '</svg>';
    }
    // ---------- Group 3：保險與投資工具 專用 SVG ----------
    // 保險分攤：很多小人各投一枚硬幣進共同水池，其中一人失火就從池子理賠。
    function insurancePool(step) {
        var s = '<svg viewBox="0 0 280 160" role="img" aria-label="保險分攤：很多人各出一點保費放進共同的池子，誰不幸遇到就從池子理賠">';
        s += '<text x="140" y="18" text-anchor="middle" font-size="12" font-weight="800" fill="#0369a1">' +
            (step >= 2 ? '③ 池子理賠給遇到火災的人' : (step >= 1 ? '② 很多人各出一點點保費' : '① 一個人扛不起的大風險')) + '</text>';
        // 共同水池
        s += '<rect x="86" y="96" width="108" height="46" rx="10" fill="#bae6fd" stroke="#0369a1" stroke-width="2"/>';
        s += '<text x="140" y="124" text-anchor="middle" font-size="11" font-weight="800" fill="#0369a1">共同的池子</text>';
        // 投幣的小人
        var people = [20, 56, 224, 252];
        for (var i = 0; i < 4; i++) {
            var x = people[i];
            s += '<circle cx="' + x + '" cy="48" r="9" fill="#fde68a" stroke="' + GOLD + '" stroke-width="1.5"/>';
            s += '<rect x="' + (x - 7) + '" y="58" width="14" height="16" rx="4" fill="#fcd34d"/>';
            if (step >= 1) {
                s += '<circle cx="' + x + '" cy="86" r="5" fill="' + GOLD + '"/>';
                s += '<line x1="' + x + '" y1="72" x2="' + (x < 140 ? 110 : 170) + '" y2="98" stroke="' + GOLD + '" stroke-width="1.4" stroke-dasharray="3 3"/>';
            }
        }
        // 失火的房子（中間下方）
        s += '<text x="140" y="70" text-anchor="middle" font-size="22">' + (step >= 2 ? '🏠🔥' : '🏠') + '</text>';
        if (step >= 2) {
            s += '<line x1="140" y1="96" x2="140" y2="80" stroke="#0369a1" stroke-width="2.5"/><polygon points="140,74 134,84 146,84" fill="#0369a1"/>';
            s += '<text x="140" y="156" text-anchor="middle" font-size="10.5" fill="' + INK + '">大家分攤的小支出 → 幫一個人擋住大損失</text>';
        }
        return s + '</svg>';
    }
    // 分散風險：一個籃子打翻（全賠）vs 多個籃子（分散）。
    function basketsSvg() {
        var s = '<svg viewBox="0 0 280 150" role="img" aria-label="雞蛋全放一個籃子打翻就全破，分散到多個籃子一個跌還有別的撐">';
        s += '<text x="70" y="20" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + RED + '">全放一籃 → 打翻全破</text>';
        s += '<text x="210" y="20" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + GREEN + '">分散多籃 → 比較穩</text>';
        s += '<line x1="140" y1="28" x2="140" y2="138" stroke="' + INK + '" stroke-opacity="0.25" stroke-width="1.3"/>';
        // 左：一個籃子打翻
        s += '<path d="M40 86 Q70 118 100 86" fill="none" stroke="' + RED + '" stroke-width="2.5"/>';
        s += '<text x="70" y="78" text-anchor="middle" font-size="24">🧺</text>';
        s += '<text x="52" y="112" font-size="15">🥚</text><text x="76" y="120" font-size="15">💥</text>';
        // 右：三個小籃子
        for (var i = 0; i < 3; i++) {
            var x = 168 + i * 30;
            s += '<text x="' + x + '" y="92" text-anchor="middle" font-size="16">🧺</text>';
            s += '<text x="' + (x - 6) + '" y="76" font-size="12">🥚</text>';
        }
        s += '<text x="210" y="120" text-anchor="middle" font-size="10" fill="' + INK + '">一個跌，還有別的撐</text>';
        return s + '</svg>';
    }
    // ETF＝一籃多顆蛋（分散原理示例，非推薦任何商品）。
    function etfBasket() {
        var s = '<svg viewBox="0 0 280 150" role="img" aria-label="ETF 像一次買進一籃子很多公司，天生比較分散，這是在講分散原理不是推薦商品">';
        s += '<text x="140" y="22" text-anchor="middle" font-size="12.5" font-weight="800" fill="' + GOLD + '">ETF ＝ 一次買進「一籃子」很多顆蛋</text>';
        s += '<path d="M70 112 Q140 150 210 112 L200 70 L80 70 Z" fill="#fef3c7" stroke="' + GOLD + '" stroke-width="2.5"/>';
        var eggs = [[110, 92], [140, 86], [170, 92], [125, 104], [155, 104]];
        for (var i = 0; i < eggs.length; i++)
            s += '<text x="' + eggs[i][0] + '" y="' + eggs[i][1] + '" text-anchor="middle" font-size="15">🥚</text>';
        s += '<text x="140" y="140" text-anchor="middle" font-size="10" fill="' + RED + '">這是在講「分散」原理，不是推薦任何商品</text>';
        return s + '</svg>';
    }
    // 定期定額：月月投入的小階梯。
    function stairs() {
        var s = '<svg viewBox="0 0 280 150" role="img" aria-label="定期定額：每隔固定時間投入固定金額，像月月往上疊的小階梯">';
        s += '<text x="140" y="20" text-anchor="middle" font-size="12" font-weight="800" fill="' + GOLD + '">月月投入固定金額</text>';
        for (var i = 0; i < 6; i++) {
            var bh = 14 + i * 16, bx = 30 + i * 38, by = 134 - bh;
            s += '<rect x="' + bx + '" y="' + by + '" width="30" height="' + bh + '" rx="4" fill="' + GOLD + '" fill-opacity="0.6" stroke="' + GOLD + '" stroke-width="1.3"/>';
            s += '<text x="' + (bx + 15) + '" y="146" text-anchor="middle" font-size="8.5" fill="' + INK + '">第' + (i + 1) + '月</text>';
        }
        s += '<text x="150" y="36" text-anchor="middle" font-size="10" fill="' + INK + '">貴時買少、便宜時買多（平均成本）</text>';
        return s + '</svg>';
    }
    // 三層地基：緊急預備金 → 餘裕才投資。
    function foundation() {
        var s = '<svg viewBox="0 0 280 150" role="img" aria-label="先備好緊急預備金當地基，有餘裕才用短期用不到的錢投資">';
        var layers = [['① 緊急預備金（地基）', '#16a34a', 200], ['② 短期用得到的錢', GOLD, 150], ['③ 餘裕才投資', '#7c3aed', 100]];
        for (var i = 0; i < 3; i++) {
            var w = layers[i][2], x = 140 - w / 2, y = 108 - i * 34;
            s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="30" rx="6" fill="' + layers[i][1] + '" fill-opacity="0.22" stroke="' + layers[i][1] + '" stroke-width="1.8"/>';
            s += '<text x="140" y="' + (y + 20) + '" text-anchor="middle" font-size="11" font-weight="800" fill="' + layers[i][1] + '">' + layers[i][0] + '</text>';
        }
        s += '<text x="140" y="146" text-anchor="middle" font-size="10" fill="' + INK + '">先存地基，再談投資</text>';
        return s + '</svg>';
    }
    // ---------- Group 4：匯率與數位支付 專用 SVG（stepped / static）----------
    // 換錢亭：1 美元 ↔ 約 32 新台幣（中性示例，數字每天會變、不預測）。
    function fxBooth() {
        var s = '<svg viewBox="0 0 280 150" role="img" aria-label="換錢亭示意：1 美元大約可以換到 32 元新台幣，這個數字每天都會隨市場變動，只是中性的例子不是預測">';
        s += '<text x="140" y="18" text-anchor="middle" font-size="12" font-weight="800" fill="' + GOLD + '">換錢亭：不同國家的錢互相換</text>';
        // 左：1 美元
        s += '<rect x="24" y="40" width="92" height="58" rx="10" fill="#dcfce7" stroke="' + GREEN + '" stroke-width="2"/>';
        s += '<text x="70" y="68" text-anchor="middle" font-size="22">💵</text>';
        s += '<text x="70" y="90" text-anchor="middle" font-size="13" font-weight="800" fill="' + INKL + '">1 美元</text>';
        // 雙向箭頭
        s += '<line x1="120" y1="69" x2="160" y2="69" stroke="' + INK + '" stroke-width="2.5"/>';
        s += '<polygon points="120,69 130,64 130,74" fill="' + INK + '"/><polygon points="160,69 150,64 150,74" fill="' + INK + '"/>';
        s += '<text x="140" y="58" text-anchor="middle" font-size="10" fill="' + INK + '">換</text>';
        // 右：約 32 新台幣
        s += '<rect x="164" y="40" width="92" height="58" rx="10" fill="#fef3c7" stroke="' + GOLD + '" stroke-width="2"/>';
        s += '<text x="210" y="68" text-anchor="middle" font-size="22">💰</text>';
        s += '<text x="210" y="90" text-anchor="middle" font-size="13" font-weight="800" fill="' + INKL + '">約 32 新台幣</text>';
        s += '<text x="140" y="122" text-anchor="middle" font-size="11" font-weight="800" fill="' + INK + '">匯率 ≈ 1 美元 : 32 新台幣</text>';
        s += '<text x="140" y="140" text-anchor="middle" font-size="9.5" fill="' + MUT + '">（數字每天都會變動，這只是示例）</text>';
        return s + '</svg>';
    }
    // 升值 vs 貶值：同樣 320 新台幣，台幣升值換到較多美元、貶值換到較少（方向示意，不預測）。
    function fxUpDown() {
        var s = '<svg viewBox="0 0 280 184" role="img" aria-label="同樣拿 320 元新台幣去換美元：台幣升值時台幣更值錢，可以換到比較多的美元，出國或買進口貨相對便宜；台幣貶值時換到比較少的美元，出國與進口變貴，但出口相對有利；箭頭只是示意方向，不是預測漲跌">';
        s += '<text x="140" y="16" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + GOLD + '">同樣 320 新台幣，換到的美元不一樣</text>';
        s += '<line x1="140" y1="24" x2="140" y2="166" stroke="' + INK + '" stroke-opacity="0.25" stroke-width="1.3"/>';
        // 左：升值（換到比較多）
        s += '<rect x="12" y="30" width="116" height="28" rx="8" fill="#dcfce7" stroke="' + GREEN + '" stroke-width="1.8"/>';
        s += '<text x="70" y="49" text-anchor="middle" font-size="12.5" font-weight="800" fill="' + GREEN + '">台幣升值 ↑</text>';
        s += '<text x="70" y="88" text-anchor="middle" font-size="24">💵💵</text>';
        s += '<text x="70" y="112" text-anchor="middle" font-size="12" font-weight="800" fill="' + GREEN + '">換到比較多美元</text>';
        s += '<text x="70" y="132" text-anchor="middle" font-size="9.5" fill="' + INK + '">台幣更值錢</text>';
        s += '<text x="70" y="148" text-anchor="middle" font-size="9.5" fill="' + INK + '">出國、買進口貨變便宜</text>';
        // 右：貶值（換到比較少）
        s += '<rect x="152" y="30" width="116" height="28" rx="8" fill="#fee2e2" stroke="' + RED + '" stroke-width="1.8"/>';
        s += '<text x="210" y="49" text-anchor="middle" font-size="12.5" font-weight="800" fill="' + RED + '">台幣貶值 ↓</text>';
        s += '<text x="210" y="88" text-anchor="middle" font-size="24">💵</text>';
        s += '<text x="210" y="112" text-anchor="middle" font-size="12" font-weight="800" fill="' + RED + '">換到比較少美元</text>';
        s += '<text x="210" y="132" text-anchor="middle" font-size="9.5" fill="' + INK + '">台幣變便宜</text>';
        s += '<text x="210" y="148" text-anchor="middle" font-size="9.5" fill="' + INK + '">出國、進口變貴；出口有利</text>';
        s += '<text x="140" y="178" text-anchor="middle" font-size="9" fill="' + MUT + '">↑↓ 只是示意方向，不預測漲跌</text>';
        return s + '</svg>';
    }
    // 匯率每天隨供需上下變動（中性示意，不預測漲跌）。
    function fxWobble() {
        var vals = [32.1, 31.8, 32.2, 31.9, 32.0];
        var s = '<svg viewBox="0 0 280 150" role="img" aria-label="匯率每天隨市場供需上下變動的示意圖，五天的 1 美元兌新台幣在 32 元附近上下跳動，這只是說明會變動，不是預測漲跌">';
        s += '<text x="140" y="16" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + GOLD + '">匯率每天都會上下變動</text>';
        s += '<text x="140" y="28" text-anchor="middle" font-size="8.5" fill="' + MUT + '">1 美元換多少新台幣（示意，不預測）</text>';
        s += '<line x1="24" y1="92" x2="248" y2="92" stroke="' + INK + '" stroke-opacity="0.3" stroke-width="1.3" stroke-dasharray="4 4"/>';
        s += '<text x="26" y="88" text-anchor="start" font-size="8.5" fill="' + MUT + '">約 32</text>';
        var pts = '';
        for (var i = 0; i < 5; i++) {
            var cx = 50 + i * 44, cy = 92 - (vals[i] - 32) * 120;
            pts += cx + ',' + cy.toFixed(1) + ' ';
        }
        s += '<polyline points="' + pts.trim() + '" fill="none" stroke="' + GOLD + '" stroke-width="2"/>';
        for (var j = 0; j < 5; j++) {
            var x = 50 + j * 44, y = 92 - (vals[j] - 32) * 120;
            s += '<circle cx="' + x + '" cy="' + y.toFixed(1) + '" r="4" fill="' + GOLD + '"/>';
            s += '<text x="' + x + '" y="' + (y - 9).toFixed(1) + '" text-anchor="middle" font-size="8.5" font-weight="700" fill="' + INK + '">' + vals[j].toFixed(1) + '</text>';
            s += '<text x="' + x + '" y="136" text-anchor="middle" font-size="9" fill="' + INK + '">第' + (j + 1) + '天</text>';
        }
        return s + '</svg>';
    }
    // 行動支付＝把「錢的鑰匙」放進手機，所以手機與密碼要特別顧好。
    function payKey() {
        var s = '<svg viewBox="0 0 280 150" role="img" aria-label="行動支付就像把錢的鑰匙放進手機，手機裡存著付款的權限，所以手機和它的密碼要特別顧好">';
        s += '<text x="140" y="18" text-anchor="middle" font-size="12" font-weight="800" fill="' + GOLD + '">行動支付＝把「錢的鑰匙」放進手機</text>';
        s += '<rect x="104" y="34" width="72" height="104" rx="12" fill="#fef3c7" stroke="' + GOLD + '" stroke-width="2.5"/>';
        s += '<rect x="112" y="46" width="56" height="68" rx="6" fill="#ffffff" stroke="' + GOLD + '" stroke-opacity="0.5" stroke-width="1.3"/>';
        s += '<text x="140" y="84" text-anchor="middle" font-size="26">🔑</text>';
        s += '<text x="140" y="107" text-anchor="middle" font-size="10" font-weight="800" fill="' + INKL + '">付款權限</text>';
        s += '<circle cx="140" cy="126" r="5" fill="none" stroke="' + GOLD + '" stroke-width="1.5"/>';
        s += '<text x="56" y="92" text-anchor="middle" font-size="22">💰</text>';
        s += '<text x="224" y="92" text-anchor="middle" font-size="22">💳</text>';
        return s + '</svg>';
    }
    // 安全付款四步流程 + 檢查清單。
    function payFlow() {
        var s = '<svg viewBox="0 0 280 230" role="img" aria-label="安全的行動支付流程四步：先開啟官方 App，再用密碼或生物辨識驗證，接著核對金額與收款對象，確認無誤才付款；下方的安全檢查清單包含設密碼或生物辨識、只用官方 App 或可信網站、核對金額與對象、不在公用 Wi-Fi 做金流">';
        s += '<text x="140" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + GOLD + '">安全付款，照順序走四步</text>';
        var steps = [['①', '開啟官方 App'], ['②', '密碼／生物辨識'], ['③', '核對金額與對象'], ['④', '確認無誤才付款']];
        for (var i = 0; i < 4; i++) {
            var y = 26 + i * 28;
            s += '<rect x="30" y="' + y + '" width="220" height="22" rx="7" fill="#fef3c7" stroke="' + GOLD + '" stroke-width="1.6"/>';
            s += '<text x="46" y="' + (y + 15) + '" text-anchor="middle" font-size="12" font-weight="800" fill="' + GOLD + '">' + steps[i][0] + '</text>';
            s += '<text x="64" y="' + (y + 15) + '" text-anchor="start" font-size="11.5" font-weight="700" fill="' + INKL + '">' + steps[i][1] + '</text>';
            if (i < 3)
                s += '<path d="M140 ' + (y + 22) + ' L140 ' + (y + 28) + '" stroke="' + GOLD + '" stroke-width="1.6"/>';
        }
        // 安全檢查清單（2×2）
        s += '<rect x="18" y="150" width="244" height="72" rx="10" fill="#dcfce7" stroke="' + GREEN + '" stroke-width="1.8"/>';
        s += '<text x="140" y="167" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + GREEN + '">安全檢查清單</text>';
        var chk = ['設密碼／生物辨識', '只用官方 App', '核對金額與對象', '不在公用 Wi-Fi 轉錢'];
        for (var k = 0; k < 4; k++) {
            var tx = 30 + (k % 2) * 120, ty = 188 + Math.floor(k / 2) * 22;
            s += '<text x="' + tx + '" y="' + ty + '" text-anchor="start" font-size="10" fill="' + INKL + '">✅ ' + chk[k] + '</text>';
        }
        return s + '</svg>';
    }
    // 遇到可疑付款情境，先停下來查證：陌生 QR 碼、要驗證碼/卡號、幫忙代收代付 → 停 → 打 165/問家人。
    function payDanger() {
        var cards = [['🔳', '陌生 QR 碼', '要你掃碼付款'], ['🔢', '要驗證碼／卡號', '說「報一下就好」'], ['📦', '代收代付', '幫忙收錢再轉出']];
        var s = '<svg viewBox="0 0 280 196" role="img" aria-label="遇到以下情況都要先停下來查證：有人要你掃來路不明的 QR 碼付款、有人要你的簡訊驗證碼或信用卡號、有人要你幫忙代收代付；不管哪一種，先停下來打 165 或問家人再決定">';
        s += '<text x="140" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + RED + '">遇到這些，先停下來查證</text>';
        for (var i = 0; i < 3; i++) {
            var cx = 8 + i * 92;
            s += '<rect x="' + cx + '" y="26" width="84" height="60" rx="9" fill="#fee2e2" stroke="' + RED + '" stroke-width="1.8"/>';
            s += '<text x="' + (cx + 42) + '" y="48" text-anchor="middle" font-size="20">' + cards[i][0] + '</text>';
            s += '<text x="' + (cx + 42) + '" y="66" text-anchor="middle" font-size="9.5" font-weight="800" fill="' + INKL + '">' + cards[i][1] + '</text>';
            s += '<text x="' + (cx + 42) + '" y="79" text-anchor="middle" font-size="7.2" fill="' + INKL + '">' + cards[i][2] + '</text>';
            s += '<text x="' + (cx + 74) + '" y="34" text-anchor="middle" font-size="12">🚩</text>';
            s += '<path d="M' + (cx + 42) + ' 88 L140 118" stroke="' + RED + '" stroke-width="1.5" marker-end="url(#pdr)"/>';
        }
        s += '<rect x="40" y="120" width="200" height="34" rx="10" fill="#fef3c7" stroke="' + GOLD + '" stroke-width="2"/>';
        s += '<text x="140" y="142" text-anchor="middle" font-size="12" font-weight="800" fill="' + GOLD + '">🛑 先停下來，不要馬上照做</text>';
        s += '<rect x="40" y="160" width="200" height="30" rx="10" fill="#dcfce7" stroke="' + GREEN + '" stroke-width="2"/>';
        s += '<text x="140" y="179" text-anchor="middle" font-size="11" font-weight="800" fill="' + GREEN + '">打 165 或問家人，再決定</text>';
        s += '<defs><marker id="pdr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + RED + '"/></marker></defs>';
        return s + '</svg>';
    }
    window.CONCEPT = {
        progKey: 'finance_realworld_v1', practiceHref: 'economics_advanced.html',
        lessons: [
            // ============ 群組 1：信用卡循環利息・卡債・借貸 ============
            { id: 'credit_what', name: '借錢的代價：利息是什麼', emoji: '💵', color: '#ca8a04', sub: '多出來的錢就是利息',
                done: '你懂了——借錢不是免費的，多出來的就是利息。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '借 100 元，為什麼要還 110 元？', svg: coinInterest(),
                        text: '跟別人借 100 元，約定還 <b>110 元</b>，多出來的 <b>10 元</b>就是<b>利息</b>。利息就像「借錢的租金」——借用別人的錢一段時間，要付一點代價。' },
                    { type: 'teach', kicker: '什麼是利率', title: '利率＝要付的租金比例', svg: rateRuler(),
                        text: '<b>利率</b>是「一段時間要付的租金比例」。<b>年利率 15%</b>代表：借一年，每借 100 元要付 <b>15 元</b>利息。數字越大，租金越貴。' },
                    { type: 'teach', kicker: '越借越多', title: '借越久、利率越高，付越多', svg: animCanvas(300, 182, '欠款 100 元、年利率 15%，逐月複利滾大的紅色長條，一個月比一個月高'),
                        mount: function (host) { return window.Anim && window.Anim.compoundGrowth(host, { principal: 100, ratePct: 15, periods: 12, mode: 'debt', unitLabel: '元', title: '欠 100 元不還，逐月滾大（年利率 15%）' }); },
                        text: '借的錢沒還，利息會<b>一個月一個月疊上去</b>。看紅色長條：<b>借越久、利率越高，要付的租金（利息）就越多</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '借 1000 元、年利率 10%，一年後大約要還多少？',
                        options: ['1100 元', '1010 元', '1000 元', '900 元'], answer: 0,
                        whyWrong: { 1: '1010 元只多了 10 元，那是利率 1% 的情況，不是 10%。', 2: '1000 元是本金，別忘了還要加一年的利息。', 3: '借錢只會多還、不會少還，900 元比本金還少是不可能的。' },
                        why: '利息＝1000×10%＝100 元，本金加利息＝1100 元；利率是「每年每 100 元的租金」。' },
                    { type: 'quiz', kicker: '想一想', title: '同樣借 1000 元，哪一種情況付的利息最多？',
                        options: ['年利率 20%、借 2 年', '年利率 20%、借 1 個月', '年利率 5%、借 1 年', '不借'], answer: 0,
                        whyWrong: { 1: '利率雖然高，但只借 1 個月，時間很短，利息比借 2 年少很多。', 2: '年利率只有 5%、又只借 1 年，累積的利息比高利率借更久的少。', 3: '不借就不用付利息，付的利息最少，不是最多喔。' },
                        why: '利率越高、借越久，累積的租金（利息）就越多，所以年利率 20% 又借 2 年付最多。' }
                ] },
            { id: 'credit_card', name: '信用卡怎麼運作', emoji: '💳', color: '#d97706', sub: '先享受、後付款',
                done: '信用卡是工具不是零用錢——能全額繳清才刷。',
                steps: [
                    { type: 'teach', kicker: '先享受後付款', title: '刷卡＝銀行先替你墊錢', svg: billSvg('full'),
                        text: '刷卡時，是<b>銀行先替你墊錢</b>。只要在帳單<b>期限前「全額繳清」</b>，銀行就<b>不收利息</b>——這時候信用卡很好用、很方便。' },
                    { type: 'teach', kicker: '只繳最低會怎樣', title: '沒繳清，就開始滾循環利息', svg: billSvg('min'),
                        text: '如果只繳「<b>最低應繳金額</b>」，剩下沒繳的錢就開始被收<b>循環利息</b>。台灣信用卡循環利率<b>很高</b>：法律上限是<b>年利率 15%</b>（金管會依銀行法規定），遠高於存款利率。' },
                    { type: 'teach', kicker: '雪球效應', title: '循環利息天天計、月月滾', svg: animCanvas(300, 182, '沒繳清的信用卡餘額依年利率 15% 逐月滾大，像雪球越滾越大'),
                        mount: function (host) { return window.Anim && window.Anim.compoundGrowth(host, { principal: 100, ratePct: 15, periods: 12, mode: 'debt', unitLabel: '元', title: '只繳最低，剩下的餘額月月滾息' }); },
                        text: '循環利息「<b>天天計、月月滾</b>」，沒繳清的欠款像<b>雪球</b>一樣越滾越大。所以能<b>全額繳清</b>再刷，才不會被利息追著跑。' },
                    { type: 'quiz', kicker: '換你試試', title: '信用卡帳單怎麼繳才不會被收循環利息？',
                        options: ['在期限前全額繳清', '只繳最低應繳金額', '完全不繳', '繳一半'], answer: 0,
                        whyWrong: { 1: '只繳最低，剩下沒繳的錢就會開始滾循環利息。', 2: '完全不繳不但要付更多利息，還會影響信用紀錄。', 3: '繳一半，剩下沒繳的另一半還是會被收循環利息。' },
                        why: '全額繳清等於沒欠銀行錢，不會產生循環利息；只繳最低或沒繳清，剩下的會開始滾息。' },
                    { type: 'quiz', kicker: '想一想', title: '關於信用卡循環利息，下列何者正確？',
                        options: ['利率很高，欠款會越滾越大', '循環利息是銀行送的優惠', '只繳最低最省錢', '刷卡的錢永遠不用還'], answer: 0,
                        whyWrong: { 1: '循環利息是你要多付出去的錢，不是銀行送的優惠。', 2: '只繳最低看起來付得少，其實剩下的錢一直滾息，長期付最多。', 3: '刷卡是銀行先替你墊錢，一定要還，不還會被追討還影響信用。' },
                        why: '循環利率在台灣很高（法律上限為年利率 15%，金管會依銀行法規定），又逐日計算，欠越久滾越多，不是優惠。' }
                ] },
            { id: 'credit_debt', name: '卡債雪球與聰明借貸', emoji: '❄️', color: '#dc2626', sub: '踩剎車＋借貸三問',
                done: '借貸前先問三句話，雪球就滾不起來。',
                steps: [
                    { type: 'teach', kicker: '雪球怎麼來的', title: '只繳最低＝債務雪球', svg: animCanvas(300, 182, '只繳最低時欠款與利息同時長大形成債務雪球，全額繳清則欠款是零'),
                        mount: function (host) { return window.Anim && window.Anim.compoundGrowth(host, { principal: 100, ratePct: 15, periods: 18, mode: 'debt', unitLabel: '元', title: '只繳最低 → 欠款月月長大（全額繳＝0）' }); },
                        text: '只繳最低時，<b>欠款和利息會同時長大</b>，這就是「<b>債務雪球</b>」。相反地，<b>全額繳清</b>的人欠款是 <b>0</b>，完全不會滾息。' },
                    { type: 'teach', kicker: '怎麼踩剎車', title: '擺脫雪球的三個動作', svg: snowballBrake(),
                        text: '卡債不可怕，重點是<b>趕快踩剎車</b>：① <b>先停止再刷</b>；② <b>優先還利率最高</b>的債；③ 必要時<b>找家人或正規金融機構</b>談。被卡債困住不丟臉，願意面對、求助最重要。' },
                    { type: 'teach', kicker: '借貸三問', title: '真的要借錢，先問三句話', svg: borrowThree(),
                        text: '真的需要借錢時，先問自己三句話：<b>我還得起嗎？利率（年利率 APR）多少？非借不可嗎？</b> 並且<b>遠離</b>來路不明、高利的借貸。' },
                    { type: 'quiz', kicker: '換你試試', title: '不小心欠了卡債，最先該做的是？',
                        options: ['先停止再刷卡、想辦法把欠款還掉', '再多辦幾張卡來刷', '不管它，欠款會自己消失', '只繳最低就好'], answer: 0,
                        whyWrong: { 1: '多辦卡來刷只會讓欠款更多、雪球更大。', 2: '欠款不會自己消失，不管它只會一直滾息、越欠越多。', 3: '只繳最低，剩下的欠款會一直滾息長大。' },
                        why: '欠款會滾息長大，先止血（停刷）再優先清償利率最高的債，才不會越陷越深。' },
                    { type: 'quiz', kicker: '想一想', title: '有人說「免利息、馬上借、不用證件」，這通常代表？',
                        options: ['很可能是高利貸或詐騙，要非常小心', '最佛心的好機會，趕快借', '政府開的銀行', '借了不用還'], answer: 0,
                        whyWrong: { 1: '天下沒有「免利息又不審核」的好借貸，越像佛心越要小心。', 2: '政府或正規銀行都會審核、說明利率，不會打「免證件馬上借」的廣告。', 3: '借的錢一定要還，說「借了不用還」本身就是騙人的話術。' },
                        why: '正規借貸都會審核、說明利率；強調「馬上、不審核、免證件」常是地下錢莊或詐騙的話術。' }
                ] },
            // ============ 群組 2：看穿金融詐騙 ============
            { id: 'scam_pattern', name: '詐騙的共同劇本', emoji: '🚩', color: '#e11d48', sub: '太美好＋很急＋要保密',
                done: '記住劇本：太美好＋很急＋要保密＝紅燈。',
                steps: [
                    { type: 'teach', kicker: '第一招', title: '賣你「聽起來太美好的機會」', svg: scamFlags(1),
                        text: '詐騙都在賣同一種東西——<b>聽起來太美好的機會</b>：穩賺、保證高報酬、限時名額。真正的投資，一定會提醒你「<b>有風險</b>」。' },
                    { type: 'teach', kicker: '第二招', title: '製造緊張，讓你來不及想', svg: scamFlags(2),
                        text: '第二招是<b>製造緊張</b>：「現在不決定就沒了」「帳戶出問題要馬上處理」，讓你<b>來不及冷靜想</b>。越催，越要停下來。' },
                    { type: 'teach', kicker: '第三招', title: '要你私下、快速地付錢或給資料', svg: scamFlags(3),
                        text: '第三招是要你「<b>私下、快速、不要跟別人說</b>」地付錢或給資料。只要同時出現這三面紅旗，<b>幾乎就是詐騙</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '哪一句最像詐騙的開場白？',
                        options: ['保證穩賺不賠，名額只剩今天', '這份工作要面試、有勞健保', '銀行請你本人臨櫃辦理', '投資有風險，請先了解再決定'], answer: 0,
                        whyWrong: { 1: '要面試、有勞健保是正當徵才的樣子，不是詐騙話術。', 2: '請你本人臨櫃辦理是正規銀行的做法，反而比較安全。', 3: '「投資有風險，請先了解」正好是誠實的提醒，和詐騙相反。' },
                        why: '同時出現「保證穩賺＋限時」是最典型的詐騙話術；真正的投資都會提醒有風險。' },
                    { type: 'quiz', kicker: '想一想', title: '對方一直催你「現在馬上處理、不要跟家人說」，這代表？',
                        options: ['很可能是詐騙，越催越要停下來', '對方很貼心', '代表機會很好', '應該照做比較快'], answer: 0,
                        whyWrong: { 1: '真正為你好的人，會讓你慢慢想、跟家人討論，不會逼你保密。', 2: '真正的好機會不會逼你保密，又催你馬上決定。', 3: '一照做就中計了；越被催促，越要停下來查證。' },
                        why: '製造緊張、要你保密、不讓你查證，是詐騙讓人上當的核心手法。' }
                ] },
            { id: 'scam_types', name: '常見手法圖鑑', emoji: '🗂️', color: '#be123c', sub: '假投資／客服／交友／中獎',
                done: '手法百百種，但都在要你的「錢」或「驗證碼／個資」。',
                steps: [
                    { type: 'teach', kicker: '認識一下', title: '假投資 ・ 假飆股群組', svg: scamGallery([0]),
                        text: '<b>假投資／假飆股群組</b>：有「老師帶單」「跟著買就穩賺」。記得——<b>穩賺＝紅旗</b>，群組裡的「獲利截圖」都可以造假。' },
                    { type: 'teach', kicker: '再認識', title: '假客服 ・ 假網拍', svg: scamGallery([1]),
                        text: '<b>假客服／假網拍</b>：謊稱「你的訂單錯誤要退款」，騙你去 ATM 操作，或要你給<b>驗證碼</b>。真正的退款不需要你操作 ATM，也不會跟你要驗證碼。' },
                    { type: 'teach', kicker: '還有這些', title: '假交友 ・ 假中獎 ・ 猜猜我是誰', svg: scamGallery([2, 3]),
                        text: '<b>假交友／假中獎／猜猜我是誰</b>：先博感情或裝成親友，再開口<b>借錢或要你一起投資</b>。手法會變，但都在「<b>要錢或要你的個資／驗證碼</b>」。' },
                    { type: 'quiz', kicker: '換你試試', title: '收到簡訊「您的包裹地址有誤，點連結重新付運費」，最安全的做法是？',
                        options: ['不點連結，自己到官方 App 或網站查訂單', '馬上點連結照它說的做', '回傳自己的信用卡號', '把驗證碼給對方'], answer: 0,
                        whyWrong: { 1: '來路不明的連結可能是假網站，點了照做就中計了。', 2: '把信用卡號回傳給對方，就會被拿去盜刷。', 3: '驗證碼等於帳戶鑰匙，給出去錢就被轉走。' },
                        why: '來路不明的連結與「補運費／給驗證碼」都是假客服常用手法；查證要走你本來就知道的官方管道。' },
                    { type: 'quiz', kicker: '想一想', title: '網路上剛認識的人很快談感情，然後開口借錢或要你一起投資，這通常是？',
                        options: ['假交友詐騙，要提高警覺', '真愛，趕快匯錢', '正常的交友', '好的投資機會'], answer: 0,
                        whyWrong: { 1: '真心交往的人不會急著跟剛認識的你要錢或拉你投資。', 2: '正常交友不會剛認識就開口借錢或拉你一起投資。', 3: '靠感情拉你投資正是假交友詐騙的手法，不是好機會。' },
                        why: '先博感情再要錢／要你投資，是假交友詐騙的典型流程。' }
                ] },
            { id: 'scam_shield', name: '四步防護盾：停・看・查・打 165', emoji: '🛡️', color: '#0d9488', sub: '不確定就打 165',
                done: '遇到可疑的，先停，再打 165——不丟臉，是聰明。',
                steps: [
                    { type: 'teach', kicker: '第一步', title: '停：先停下來', svg: shieldSteps(1),
                        text: '遇到可疑訊息，第一步是<b>停</b>——<b>先停下來，別被催促</b>。只要願意停一下，大部分詐騙就騙不了你。' },
                    { type: 'teach', kicker: '第二步', title: '看：是不是太美好、要你私下付款', svg: shieldSteps(2),
                        text: '第二步是<b>看</b>：看它是不是<b>太美好</b>、是否要你<b>私下付款</b>或<b>給驗證碼</b>。出現這些，就是紅旗。' },
                    { type: 'teach', kicker: '第三、四步', title: '查・打：打 165 查證', svg: shieldSteps(4),
                        text: '第三、四步是<b>查・打</b>：打 <b>165 反詐騙諮詢專線</b>查證，或跟<b>家人、師長</b>討論。<b>驗證碼、密碼、提款卡絕不給任何人</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '懷疑自己可能遇到詐騙時，台灣可以打哪支專線諮詢？',
                        options: ['165 反詐騙專線', '104 查號台', '119 消防', '隨便一個手機號碼'], answer: 0,
                        whyWrong: { 1: '104 是查電話號碼的服務，不是反詐騙諮詢專線。', 2: '119 是火災、救護用的緊急電話，不是反詐騙專線。', 3: '隨便一個號碼可能正是詐騙集團，要打官方的 165。' },
                        why: '165 是台灣的反詐騙諮詢專線，不確定時先打 165，或和家人、師長討論。' },
                    { type: 'quiz', kicker: '想一想', title: '不管對方是誰，哪一樣東西絕對不能給出去？',
                        options: ['簡訊驗證碼、提款卡密碼', '今天星期幾', '你喜歡的顏色', '學校的名字'], answer: 0,
                        whyWrong: { 1: '今天星期幾不是秘密，給了也不會被盜走錢。', 2: '喜歡的顏色不是秘密，給了也不會被盜走錢。', 3: '學校名字不是帳戶鑰匙，給了也不會被轉走錢。' },
                        why: '驗證碼與密碼等於你帳戶的鑰匙，正規機構不會跟你要；給出去錢就被轉走了。' }
                ] },
            // ============ 群組 3：保險與投資工具入門（教原理，不報明牌）============
            { id: 'tools_insurance', name: '保險：把大風險分給大家一起扛', emoji: '☔', color: '#0369a1', sub: '保障，不是賺錢',
                done: '保險＝眾人分攤大風險，先保「垮得起的」。',
                steps: [
                    { type: 'teach', kicker: '什麼是風險', title: '風險＝不一定發生、發生了很傷', svg: insurancePool(0),
                        text: '<b>風險</b>是「不一定會發生、但<b>發生了就很傷</b>」的事，像生病、意外、火災。一個人要獨自扛這種大損失，常常扛不起。' },
                    { type: 'teach', kicker: '保險怎麼運作', title: '很多人各出一點，放進共同的池子', svg: insurancePool(1),
                        text: '<b>保險</b>就是：很多人<b>各出一點點保費</b>放進共同的池子。平常沒事，池子就留著；誰不幸遇到，就<b>從池子理賠</b>給他。' },
                    { type: 'teach', kicker: '重點觀念', title: '保險是「保障」不是「賺錢」', svg: insurancePool(2),
                        text: '保險把「<b>一個人扛不起的大損失</b>」變成「<b>大家分攤的小支出</b>」。所以保險是<b>保障</b>，不是賺錢工具；買保險先保「<b>發生了會垮掉</b>」的大風險。' },
                    { type: 'quiz', kicker: '換你試試', title: '保險最主要的功能是什麼？',
                        options: ['把少數人碰到的大損失，由大家一起分攤', '保證讓你賺大錢', '錢存進去會自己變多', '買了就不會發生壞事'], answer: 0,
                        whyWrong: { 1: '保險是分攤風險的保障，不是用來賺錢的工具。', 2: '保費是拿去分攤風險的，不是存進去就會自己變多的存款。', 3: '保險不能阻止壞事發生，只是在發生時幫忙分攤損失。' },
                        why: '保險是風險分攤機制，提供「保障」，不是增值或賺錢工具。' },
                    { type: 'quiz', kicker: '想一想', title: '下列哪一種情況，最適合用保險來準備？',
                        options: ['萬一重病或意外，醫療費很高扛不起', '想買一包餅乾', '這個月的公車錢', '買一瓶飲料'], answer: 0,
                        whyWrong: { 1: '一包餅乾用零用錢就能買，不需要保險。', 2: '公車錢是固定的小支出，用零用錢或預算安排就好，不需要保險。', 3: '一瓶飲料金額很小、自己付得起，不需要用保險準備。' },
                        why: '保險用來擋「發生機率低、但損失大到自己扛不起」的風險；日常小支出用零用錢或預算就好。' }
                ] },
            { id: 'tools_risk', name: '投資工具原理：報酬、風險與分散', emoji: '⚖️', color: '#7c3aed', sub: '高報酬＝高風險',
                done: '高報酬＝高風險，分散是降風險的基本功。',
                steps: [
                    { type: 'teach', kicker: '報酬與風險', title: '想賺更多，通常要擔更大風險', svg: animCanvas(300, 182, '投資長期可能成長，但會上下波動、不保證，報酬越高風險通常越高'),
                        mount: function (host) { return window.Anim && window.Anim.compoundGrowth(host, { principal: 100, ratePct: 6, periods: 12, mode: 'grow', unitLabel: '元', title: '投資長期可能成長（會上下波動、不保證）', caption: '可能賺也可能虧 —— 報酬越高，風險通常越高' }); },
                        text: '存錢<b>安全但成長慢</b>；投資<b>可能賺更多、也可能虧</b>。鐵則是：<b>報酬越高，風險通常越高，沒有穩賺</b>。長期有機會成長，但一路會上下波動。' },
                    { type: 'teach', kicker: '分散風險', title: '不要把雞蛋放同一個籃子', svg: basketsSvg(),
                        text: '不要把<b>雞蛋放在同一個籃子</b>裡：把錢<b>分散</b>到不同標的，一個跌還有別的撐，可以<b>降低波動</b>、不會一次全賠。' },
                    { type: 'teach', kicker: '分散的例子', title: 'ETF＝一次買一籃子（分散原理）', svg: etfBasket(),
                        text: '<b>ETF</b> 就是一次買進「<b>一籃子</b>」很多公司／資產的工具，天生就比較<b>分散</b>。（這是在講「<b>分散原理</b>」，<b>不是推薦任何商品</b>，投資一樣可能虧、不保證。）' },
                    { type: 'quiz', kicker: '換你試試', title: '有人說某個投資「保證穩賺、報酬超高」，最合理的判斷是？',
                        options: ['不太可能，高報酬通常伴隨高風險，要很小心', '太好了趕快全部投進去', '穩賺就借錢來投', '叫同學一起投'], answer: 0,
                        whyWrong: { 1: '把全部的錢投進「保證穩賺」的東西，一旦是詐騙就全賠。', 2: '借錢來投一旦虧了，不但賠本還欠一屁股債，風險更大。', 3: '拉同學一起投，只會讓更多人一起受騙、一起受害。' },
                        why: '「保證穩賺＋超高報酬」違背風險與報酬的基本關係，常是詐騙。' },
                    { type: 'quiz', kicker: '想一想', title: '「不要把雞蛋放在同一個籃子裡」在投資上的意思是？',
                        options: ['分散到不同標的，降低一次全賠的風險', '只買一支就好', '把錢全部放現金', '借越多錢投越多'], answer: 0,
                        whyWrong: { 1: '只買一支，萬一它大跌就全賠，正好相反。', 2: '把錢全部放現金是不投資，不是「分散」的意思。', 3: '借越多錢投越多會放大風險，和分散降低風險正好相反。' },
                        why: '分散投資能降低單一標的大跌造成的衝擊，是控制風險的基本原則。' }
                ] },
            { id: 'tools_timing', name: '時間的力量：定期定額與長期', emoji: '⏳', color: '#16a34a', sub: '先存地基、再談投資',
                done: '先存地基、再談投資；時間是朋友，但不保證穩賺。',
                steps: [
                    { type: 'teach', kicker: '定期定額', title: '固定時間、投入固定金額', svg: stairs(),
                        text: '<b>定期定額</b>＝每隔固定時間投入固定金額，<b>不用猜高低點</b>：貴的時候買少一點、便宜的時候買多一點，長期下來是<b>平均成本</b>。' },
                    { type: 'teach', kicker: '長期＋複利', title: '時間拉長，雪球效果才明顯', svg: animCanvas(300, 182, '定期定額每月投入固定金額，加上複利，時間拉長本利和逐月疊高，但仍會波動不保證'),
                        mount: function (host) { return window.Anim && window.Anim.compoundGrowth(host, { principal: 0, contribute: 1000, ratePct: 6, periods: 12, mode: 'grow', unitLabel: '元', title: '每月投入 1000 元 + 複利（示意，不保證）' }); },
                        text: '把本金產生的收益<b>再投入</b>，就是<b>複利</b>。<b>時間拉得越長</b>，雪球效果越明顯（但仍會<b>波動、不保證</b>）。看長條：每個月都比上個月再疊高一點。' },
                    { type: 'teach', kicker: '重要前提', title: '先存地基，再談投資', svg: foundation(),
                        text: '開始投資前有個<b>重要前提</b>：先備好<b>緊急預備金</b>，只投入「<b>短期用不到</b>」的錢。年紀小先學<b>原理</b>，長大後再依自己的情況決定。' },
                    { type: 'quiz', kicker: '換你試試', title: '「定期定額」投資指的是？',
                        options: ['每隔固定時間投入固定金額', '一次把所有錢投進去', '看心情隨便投', '只在最高點買'], answer: 0,
                        whyWrong: { 1: '一次把所有錢投進去是「單筆投入」，不是定期定額。', 2: '定期定額是固定節奏投入，不是看心情隨便投。', 3: '沒有人能每次都買在最高或最低點，定期定額正是為了不用猜時機。' },
                        why: '定期定額用固定節奏投入，貴時買少、便宜時買多，不必猜買賣時機。' },
                    { type: 'quiz', kicker: '想一想', title: '開始投資之前，比較合理的順序是？',
                        options: ['先備好緊急預備金，再用短期用不到的錢投資', '先借錢投資', '把學費也拿去投', '把全部的錢都投進去'], answer: 0,
                        whyWrong: { 1: '借錢投資一旦虧了會連本帶利賠，風險很大。', 2: '學費是短期一定要用的錢，拿去投資萬一虧了就繳不出學費。', 3: '把全部的錢都投進去，萬一需要用錢或虧損就完全沒有緩衝。' },
                        why: '先有緊急預備金才不會被迫在低點賣出；只投入短期用不到的閒錢。' }
                ] },
            // ============ 群組 4：匯率與數位支付安全 ============
            { id: 'fx_rate', name: '匯率：不同國家的錢怎麼換', emoji: '💱', color: '#ca8a04', sub: '兩種錢的交換比例',
                done: '匯率是兩種錢的交換比例，每天都在變。',
                steps: [
                    { type: 'teach', kicker: '先認識', title: '匯率＝兩種貨幣交換的比例', svg: fxBooth(),
                        text: '不同國家用不同貨幣：台灣用<b>新台幣</b>、美國用<b>美元</b>。<b>匯率</b>就是兩種貨幣<b>交換的比例</b>，例如約 <b>1 美元換 32 元新台幣</b>（這只是示例，數字每天會變動）。出國換錢、網購付外幣時都會用到。' },
                    { type: 'teach', kicker: '升值與貶值', title: '台幣升值，能換到更多外幣', svg: fxUpDown(),
                        text: '新台幣「<b>升值</b>」代表台幣更值錢：拿同樣的台幣能<b>換到更多外幣</b>，<b>出國、買進口貨相對變便宜</b>。「<b>貶值</b>」相反——換到的外幣變少，出國與進口變貴，但<b>台灣的出口相對有利</b>（外國人買台灣貨變便宜）。' },
                    { type: 'teach', kicker: '每天都在變', title: '匯率隨市場供需上下變動', svg: fxWobble(),
                        text: '匯率不是固定的，會隨<b>市場供需每天上下變動</b>。所以出國換匯、付外幣前，先查<b>當天的匯率</b>。匯率的漲跌沒有人能保證——這裡只教你看懂它<b>是什麼</b>、怎麼變，<b>不預測、也不報明牌</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '「匯率」指的是什麼？',
                        options: ['兩種貨幣互相交換的比例', '銀行的樓層數', '錢幣的重量', '提款機的數量'], answer: 0,
                        whyWrong: { 1: '銀行有幾層樓跟匯率完全無關。', 2: '錢幣多重不是匯率；匯率講的是兩種貨幣交換的比例。', 3: '提款機數量跟匯率無關。' },
                        why: '匯率是兩種貨幣的交換比例，例如 1 美元可換約 32 元新台幣，數字會隨市場變動。' },
                    { type: 'quiz', kicker: '想一想', title: '新台幣「升值」時，拿同樣的台幣去換美元會？',
                        options: ['換到比較多的美元', '換到比較少的美元', '完全不能換', '跟匯率無關'], answer: 0,
                        whyWrong: { 1: '換到比較少剛好相反，那是台幣「貶值」時的情形。', 2: '升值不是不能換，而是同樣的台幣能換到更多外幣。', 3: '能換多少正是由匯率決定的，怎麼會無關呢？' },
                        why: '升值代表台幣更值錢，同樣金額能換到更多外幣，出國或買進口貨相對變便宜。' }
                ] },
            { id: 'fx_pay', name: '數位支付安全：方便但要守規矩', emoji: '📱', color: '#0d9488', sub: '鑰匙要顧好',
                done: '支付很方便，鑰匙更要顧好。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '手機付款＝把錢的鑰匙放進手機', svg: payKey(),
                        text: '<b>行動支付</b>、電子票證、網路刷卡都很方便，掃一下、按一下就付款。但這也等於把「<b>錢的鑰匙</b>」放進手機——所以<b>手機本身和它的密碼</b>，要特別顧好。萬一<b>手機不見了</b>，盡快用另一支裝置<b>鎖定／清除手機、停用付款、改密碼</b>，並通知家人或銀行。' },
                    { type: 'teach', kicker: '安全守則', title: '照順序走，付款才安全', svg: payFlow(),
                        text: '安全付款有幾個習慣：<b>設密碼或生物辨識</b>解鎖、<b>只在官方 App 或可信網站</b>付款、付款前<b>核對金額與收款對象</b>、<b>不在公用 Wi-Fi</b> 做轉帳等金流。照清單一項項確認，就不容易出錯。' },
                    { type: 'teach', kicker: '遇到可疑先停', title: '陌生 QR 碼、要驗證碼？先停下來查證', svg: payDanger(),
                        text: '如果有人要你「<b>掃這個 QR 碼付款</b>」「<b>把驗證碼或卡號報給我</b>」「<b>幫忙代收代付</b>」，先<b>停下來查證</b>：<b>驗證碼、密碼、卡號絕不給任何人</b>。不確定就打 <b>165</b> 或問家人。被騙不是你的錯，願意先停、先問最重要。' },
                    { type: 'quiz', kicker: '換你試試', title: '使用行動支付時，下列哪一個做法最安全？',
                        options: ['設定密碼或生物辨識、只在官方 App 付款、核對金額', '把密碼寫在手機背面', '在公用 Wi-Fi 轉大筆錢', '把驗證碼給陌生人'], answer: 0,
                        whyWrong: { 1: '把密碼寫在手機背面，手機一旦遺失別人就能直接動你的錢。', 2: '公用 Wi-Fi 可能被側錄，不適合做轉帳等金流。', 3: '驗證碼等於帳戶鑰匙，給了陌生人錢就被轉走。' },
                        why: '數位支付等於把錢的鑰匙放進手機，設好驗證、用官方 App、核對金額才安全。' },
                    { type: 'quiz', kicker: '想一想', title: '陌生人要你「掃這個 QR 碼付款」或「把驗證碼給他」，應該？',
                        options: ['先停下來查證，可打 165 或問家人', '馬上照做', '覺得對方好心就相信', '把密碼也一起給'], answer: 0,
                        whyWrong: { 1: '馬上照做正中詐騙下懷；陌生 QR 碼和要驗證碼都很可疑。', 2: '裝好心正是常見話術，不能因為「感覺好心」就相信。', 3: '密碼絕不能給任何人，給了等於把帳戶整個交出去。' },
                        why: '陌生 QR 碼與要驗證碼是常見詐騙手法，先停、查證再決定。' }
                ] }
        ]
    };
})();
