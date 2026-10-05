/* =====================================================================
 * study_skills_concepts.ts  →  (tsc, tsconfig.legacy.json) →  study_skills_concepts.js
 * 「學習執行力」教學頁的資料（window.CONCEPT）＋頁內靜態 SVG 概念圖 helper。
 * 鏡像 math_concepts.ts 的模式，但本頁 **不用 window.Anim**：每個 teach 步驟
 *   的 VIZ 都是「檔案區域的 static / stepped SVG」（讓孩子看圖推理，而非裝飾的條列）。
 * 載入順序：game_core.js → 本檔 → concept_engine.js（省略 anim_core.js）。
 * 文字一律用 currentColor（= --ink，亮暗皆清楚）；需要色塊時，白字只放在飽和色塊上。
 * 繁體中文（台灣用詞）：筆記／複習／自我測驗／關鍵詞／待辦；SVG <text> 不放 <b>/<i>。
 * ===================================================================== */
// ---- 共用：扇形（番茄鐘時鐘用），文字另外放，色塊夠飽和白字才讀得到 ----
function wedge(cx, cy, r, a0, a1, fill) {
    var r0 = (a0 - 90) * Math.PI / 180, r1 = (a1 - 90) * Math.PI / 180;
    var x0 = cx + r * Math.cos(r0), y0 = cy + r * Math.sin(r0), x1 = cx + r * Math.cos(r1), y1 = cy + r * Math.sin(r1);
    var large = (a1 - a0) > 180 ? 1 : 0;
    return '<path d="M' + cx + ',' + cy + ' L' + x0.toFixed(1) + ',' + y0.toFixed(1) + ' A' + r + ',' + r + ' 0 ' + large + ' 1 ' + x1.toFixed(1) + ',' + y1.toFixed(1) + ' Z" fill="' + fill + '"/>';
}
// ---- L1 SMART：目標升級器（模糊 → 具體/可衡量/有期限）----
function smartTransform() {
    var s = '<svg viewBox="0 0 300 158" role="img" aria-label="目標升級器：把模糊目標「我要變厲害」升級成具體、可衡量、有期限的 SMART 目標：這週每天讀英文 20 分鐘、週日自測能拼 30 個單字">';
    s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="#4f46e5">目標升級器：模糊 → 清楚</text>';
    s += '<rect x="10" y="44" width="104" height="76" rx="12" fill="rgba(79,70,229,0.10)" stroke="#9aa1ab" stroke-width="2" stroke-dasharray="5 4"/>';
    s += '<text x="62" y="80" text-anchor="middle" font-size="14" font-weight="800" fill="currentColor">我要變厲害</text>';
    s += '<text x="62" y="104" text-anchor="middle" font-size="10" font-weight="700" fill="#e11d48">看不出做到沒</text>';
    s += '<line x1="118" y1="82" x2="150" y2="82" stroke="#4f46e5" stroke-width="3"/><polygon points="150,82 142,77 142,87" fill="#4f46e5"/>';
    s += '<rect x="156" y="30" width="136" height="104" rx="12" fill="none" stroke="#4f46e5" stroke-width="2.5"/>';
    s += '<text x="224" y="49" text-anchor="middle" font-size="11" font-weight="800" fill="#4f46e5">SMART 目標</text>';
    s += '<text x="224" y="73" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">這週每天讀英文</text>';
    s += '<text x="224" y="92" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">20 分鐘，週日</text>';
    s += '<text x="224" y="111" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">自測能拼 30 字</text>';
    return s + '</svg>';
}
function smartTable() {
    var rows = [['S', '具體：要做什麼很清楚', false], ['M', '可衡量：做到沒看得出來', true], ['A', '做得到：踮腳搆得到', false], ['R', '有關聯：對你真的重要', false], ['T', '有期限：訂好到什麼時候', true]];
    var s = '<svg viewBox="0 0 300 196" role="img" aria-label="SMART 五要素：S 具體、M 可衡量、A 做得到、R 有關聯、T 有期限；其中可衡量與有期限最關鍵">';
    s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="#4f46e5">SMART ＝ 五個要素都想清楚</text>';
    var y = 38;
    rows.forEach(function (r) {
        var hot = r[2];
        s += '<rect x="14" y="' + (y - 15) + '" width="22" height="22" rx="6" fill="' + (hot ? '#e11d48' : '#4f46e5') + '"/>';
        s += '<text x="25" y="' + (y + 1) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#ffffff">' + r[0] + '</text>';
        s += '<text x="44" y="' + (y + 1) + '" font-size="12.5" font-weight="' + (hot ? '800' : '700') + '" fill="currentColor">' + r[1] + '</text>';
        if (hot)
            s += '<text x="288" y="' + (y + 1) + '" text-anchor="end" font-size="12" font-weight="800" fill="#e11d48">★</text>';
        y += 31;
    });
    s += '<text x="150" y="192" text-anchor="middle" font-size="10.5" font-weight="700" fill="#e11d48">★ 可衡量 和 有期限 最關鍵</text>';
    return s + '</svg>';
}
// ---- L2 番茄鐘：時鐘（25＋5）＋ 四輪時序條 ----
function pomodoroClock() {
    var cx = 92, cy = 96, r = 54;
    var s = '<svg viewBox="0 0 300 180" role="img" aria-label="番茄鐘一個循環：專注 25 分鐘佔大部分，接著休息 5 分鐘">';
    s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="#4f46e5">一個番茄：專注 25 ＋ 休息 5</text>';
    s += wedge(cx, cy, r, 0, 300, '#4f46e5');
    s += wedge(cx, cy, r, 300, 360, '#14b8a6');
    s += '<text x="76" y="100" text-anchor="middle" font-size="13" font-weight="800" fill="#ffffff">專注</text>';
    s += '<text x="76" y="118" text-anchor="middle" font-size="13" font-weight="800" fill="#ffffff">25 分</text>';
    s += '<text x="70" y="70" text-anchor="middle" font-size="10" font-weight="800" fill="#ffffff">休5</text>';
    s += '<rect x="196" y="84" width="16" height="16" rx="4" fill="#4f46e5"/><text x="218" y="97" font-size="12" font-weight="700" fill="currentColor">專注段</text>';
    s += '<rect x="196" y="110" width="16" height="16" rx="4" fill="#14b8a6"/><text x="218" y="123" font-size="12" font-weight="700" fill="currentColor">短休息</text>';
    return s + '</svg>';
}
function pomodoroTimeline() {
    var s = '<svg viewBox="0 0 300 132" role="img" aria-label="番茄鐘：專注 25、休息 5，重複四輪，第四輪之後改成比較長的休息">';
    s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="#4f46e5">專注 → 短休息，重複 4 輪 → 長休息</text>';
    var x = 10, y = 40, h = 30, fw = 42, bw = 12, lw = 36;
    for (var i = 0; i < 4; i++) {
        s += '<rect x="' + x + '" y="' + y + '" width="' + fw + '" height="' + h + '" fill="#4f46e5"/>';
        s += '<text x="' + (x + fw / 2) + '" y="' + (y + h / 2 + 4) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#ffffff">25</text>';
        s += '<text x="' + (x + fw / 2) + '" y="' + (y + h + 15) + '" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor">第' + (i + 1) + '輪</text>';
        x += fw;
        s += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" fill="#14b8a6"/>';
        x += bw;
    }
    s += '<rect x="' + x + '" y="' + y + '" width="' + lw + '" height="' + h + '" fill="#0d9488"/>';
    s += '<text x="' + (x + lw / 2) + '" y="' + (y + h / 2 + 4) + '" text-anchor="middle" font-size="9" font-weight="800" fill="#ffffff">長休</text>';
    s += '<rect x="40" y="104" width="14" height="14" rx="3" fill="#4f46e5"/><text x="60" y="115" font-size="11" font-weight="700" fill="currentColor">專注 25</text>';
    s += '<rect x="128" y="104" width="14" height="14" rx="3" fill="#14b8a6"/><text x="148" y="115" font-size="11" font-weight="700" fill="currentColor">休息 5</text>';
    s += '<rect x="206" y="104" width="14" height="14" rx="3" fill="#0d9488"/><text x="226" y="115" font-size="11" font-weight="700" fill="currentColor">長休息</text>';
    return s + '</svg>';
}
// ---- L3 康乃爾筆記：三區版面 ＋ 使用流程 ----
function cornellLayout() {
    var px = 18, py = 24, pw = 264, ph = 150, cueW = 92, sumY = py + ph - 44;
    var s = '<svg viewBox="0 0 300 190" role="img" aria-label="康乃爾筆記一頁分三區：右邊大區記上課筆記、左邊窄欄寫關鍵字或問題、下方寫自己的總結">';
    s += '<rect x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" rx="8" fill="rgba(79,70,229,0.05)" stroke="#4f46e5" stroke-width="2"/>';
    s += '<line x1="' + (px + cueW) + '" y1="' + py + '" x2="' + (px + cueW) + '" y2="' + sumY + '" stroke="#4f46e5" stroke-width="1.5"/>';
    s += '<line x1="' + px + '" y1="' + sumY + '" x2="' + (px + pw) + '" y2="' + sumY + '" stroke="#4f46e5" stroke-width="1.5"/>';
    s += '<text x="' + (px + cueW / 2) + '" y="' + (py + 22) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#4f46e5">關鍵字</text>';
    s += '<text x="' + (px + cueW / 2) + '" y="' + (py + 38) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#4f46e5">／問題</text>';
    s += '<text x="' + (px + cueW + (pw - cueW) / 2) + '" y="' + (py + 24) + '" text-anchor="middle" font-size="12.5" font-weight="800" fill="currentColor">上課筆記</text>';
    s += '<text x="' + (px + cueW + (pw - cueW) / 2) + '" y="' + (py + 44) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#8a8a8a">（記老師講的重點）</text>';
    s += '<text x="' + (px + pw / 2) + '" y="' + (sumY + 26) + '" text-anchor="middle" font-size="11.5" font-weight="800" fill="currentColor">我的總結（用一兩句話）</text>';
    return s + '</svg>';
}
function cornellFlow() {
    var px = 18, py = 24, pw = 264, ph = 150, cueW = 92, sumY = py + ph - 44;
    var s = '<svg viewBox="0 0 300 190" role="img" aria-label="康乃爾筆記的使用流程：① 上課在右區記筆記、② 課後在左欄寫問題、③ 下方寫一兩句總結、④ 複習時遮住右區只看左欄問題自我測驗">';
    s += '<rect x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" rx="8" fill="rgba(79,70,229,0.05)" stroke="#4f46e5" stroke-width="2"/>';
    s += '<line x1="' + (px + cueW) + '" y1="' + py + '" x2="' + (px + cueW) + '" y2="' + sumY + '" stroke="#4f46e5" stroke-width="1.5"/>';
    s += '<line x1="' + px + '" y1="' + sumY + '" x2="' + (px + pw) + '" y2="' + sumY + '" stroke="#4f46e5" stroke-width="1.5"/>';
    // 右區：① 記筆記，疊一層虛線「④ 遮住自測」
    var rx = px + cueW + (pw - cueW) / 2;
    s += '<text x="' + rx + '" y="' + (py + 26) + '" text-anchor="middle" font-size="11.5" font-weight="800" fill="currentColor">① 上課記這裡</text>';
    s += '<rect x="' + (px + cueW + 6) + '" y="' + (py + 36) + '" width="' + (pw - cueW - 12) + '" height="40" rx="6" fill="rgba(225,29,72,0.08)" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="4 3"/>';
    s += '<text x="' + rx + '" y="' + (py + 61) + '" text-anchor="middle" font-size="10.5" font-weight="800" fill="#e11d48">④ 複習時遮住、自測</text>';
    // 左欄：② 寫問題
    s += '<text x="' + (px + cueW / 2) + '" y="' + (py + 24) + '" text-anchor="middle" font-size="10.5" font-weight="800" fill="#4f46e5">② 寫問題</text>';
    s += '<text x="' + (px + cueW / 2) + '" y="' + (py + 70) + '" text-anchor="middle" font-size="13" font-weight="800" fill="#4f46e5">？</text>';
    // 底部：③ 總結
    s += '<text x="' + (px + pw / 2) + '" y="' + (sumY + 26) + '" text-anchor="middle" font-size="11.5" font-weight="800" fill="currentColor">③ 用一兩句話總結</text>';
    return s + '</svg>';
}
// ---- L4 心智圖：放射結構 ＋ 一個分支一個關鍵詞 ----
function mindmapGood() {
    var cx = 150, cy = 96;
    var leaves = [[238, 46, '蒸發', '#4f46e5', 'M150,96 Q198,60 238,50'], [252, 120, '凝結', '#0ea5e9', 'M150,96 Q208,112 252,120'], [150, 170, '降水', '#16a34a', 'M150,96 Q166,136 150,162'], [48, 96, '匯流', '#f59e0b', 'M150,96 Q98,96 60,96']];
    var s = '<svg viewBox="0 0 300 190" role="img" aria-label="心智圖：中央主題「水循環」往外長出蒸發、凝結、降水、匯流四條分支">';
    s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="#4f46e5">心智圖：中央主題 → 分支 → 細節</text>';
    leaves.forEach(function (lf) { s += '<path d="' + lf[4] + '" fill="none" stroke="' + lf[3] + '" stroke-width="2.5"/>'; });
    s += '<ellipse cx="' + cx + '" cy="' + cy + '" rx="38" ry="22" fill="#4f46e5"/>';
    s += '<text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" font-size="14" font-weight="800" fill="#ffffff">水循環</text>';
    leaves.forEach(function (lf) {
        s += '<rect x="' + (lf[0] - 24) + '" y="' + (lf[1] - 12) + '" width="48" height="24" rx="8" fill="rgba(79,70,229,0.10)" stroke="' + lf[3] + '" stroke-width="2"/>';
        s += '<text x="' + lf[0] + '" y="' + (lf[1] + 5) + '" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">' + lf[2] + '</text>';
    });
    return s + '</svg>';
}
function mindmapKeyword() {
    var s = '<svg viewBox="0 0 300 176" role="img" aria-label="心智圖好習慣：每條分支只寫簡短關鍵詞（看得出重點），不要在分支上寫一整句話">';
    // 好：關鍵詞
    s += '<text x="14" y="20" font-size="11" font-weight="800" fill="#16a34a">✓ 一個分支一個關鍵詞</text>';
    s += '<path d="M70,52 Q104,40 134,36" fill="none" stroke="#16a34a" stroke-width="2.5"/>';
    s += '<path d="M70,52 Q104,64 134,70" fill="none" stroke="#16a34a" stroke-width="2.5"/>';
    s += '<ellipse cx="46" cy="52" rx="30" ry="18" fill="#16a34a"/><text x="46" y="57" text-anchor="middle" font-size="13" font-weight="800" fill="#ffffff">食物</text>';
    s += '<rect x="134" y="24" width="44" height="24" rx="8" fill="rgba(22,163,74,0.12)" stroke="#16a34a" stroke-width="2"/><text x="156" y="40" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">水果</text>';
    s += '<rect x="134" y="58" width="44" height="24" rx="8" fill="rgba(22,163,74,0.12)" stroke="#16a34a" stroke-width="2"/><text x="156" y="74" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">蔬菜</text>';
    s += '<text x="200" y="48" font-size="10.5" font-weight="700" fill="currentColor">看得出</text><text x="200" y="64" font-size="10.5" font-weight="700" fill="currentColor">重點</text>';
    // 壞：整句話
    s += '<text x="14" y="112" font-size="11" font-weight="800" fill="#e11d48">✗ 分支上寫一整句話</text>';
    s += '<rect x="40" y="124" width="220" height="40" rx="10" fill="rgba(225,29,72,0.08)" stroke="#e11d48" stroke-width="2" stroke-dasharray="5 4"/>';
    s += '<text x="150" y="140" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">我今天吃了很多</text>';
    s += '<text x="150" y="156" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">好吃的東西……</text>';
    return s + '</svg>';
}
// ---- L5 待辦與優先序：重要×緊急四象限 ＋ 大目標拆解 ----
function eisenhower() {
    var gx = 52, gy = 40, gw = 200, gh = 140, mx = gx + gw / 2, my = gy + gh / 2;
    var s = '<svg viewBox="0 0 300 200" role="img" aria-label="重要乘以緊急四象限：又重要又緊急的先做、重要但不緊急的排時間做、不重要但緊急的快點做掉、不重要又不緊急的可以少做">';
    s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="#4f46e5">重要 × 緊急，分四格排順序</text>';
    // 先做格高亮（右上：重要＋緊急）
    s += '<rect x="' + mx + '" y="' + gy + '" width="' + (gw / 2) + '" height="' + (gh / 2) + '" fill="rgba(225,29,72,0.10)" stroke="#e11d48" stroke-width="2.5"/>';
    // 外框與分隔線
    s += '<rect x="' + gx + '" y="' + gy + '" width="' + gw + '" height="' + gh + '" fill="none" stroke="#9aa1ab" stroke-width="2"/>';
    s += '<line x1="' + mx + '" y1="' + gy + '" x2="' + mx + '" y2="' + (gy + gh) + '" stroke="#9aa1ab" stroke-width="2"/>';
    s += '<line x1="' + gx + '" y1="' + my + '" x2="' + (gx + gw) + '" y2="' + my + '" stroke="#9aa1ab" stroke-width="2"/>';
    // 軸標
    s += '<text x="' + (gx + gw / 4) + '" y="' + (gy - 6) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#8a8a8a">不緊急</text>';
    s += '<text x="' + (mx + gw / 4) + '" y="' + (gy - 6) + '" text-anchor="middle" font-size="10" font-weight="800" fill="#e11d48">緊急</text>';
    s += '<text x="26" y="' + (gy + gh / 4 + 4) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#8a8a8a">重要</text>';
    s += '<text x="26" y="' + (my + gh / 4 + 4) + '" text-anchor="middle" font-size="10" font-weight="700" fill="#8a8a8a">不重要</text>';
    // 四格內容
    s += '<text x="' + (gx + gw / 4) + '" y="' + (gy + gh / 4 - 4) + '" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">排時間做</text>';
    s += '<text x="' + (gx + gw / 4) + '" y="' + (gy + gh / 4 + 12) + '" text-anchor="middle" font-size="8.5" font-weight="700" fill="#8a8a8a">（複習、運動）</text>';
    s += '<text x="' + (mx + gw / 4) + '" y="' + (gy + gh / 4 - 4) + '" text-anchor="middle" font-size="11.5" font-weight="800" fill="#e11d48">先做！</text>';
    s += '<text x="' + (mx + gw / 4) + '" y="' + (gy + gh / 4 + 12) + '" text-anchor="middle" font-size="8.5" font-weight="700" fill="#8a8a8a">（明天要考）</text>';
    s += '<text x="' + (gx + gw / 4) + '" y="' + (my + gh / 4 - 4) + '" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">可以少做</text>';
    s += '<text x="' + (gx + gw / 4) + '" y="' + (my + gh / 4 + 12) + '" text-anchor="middle" font-size="8.5" font-weight="700" fill="#8a8a8a">（一直滑手機）</text>';
    s += '<text x="' + (mx + gw / 4) + '" y="' + (my + gh / 4 - 4) + '" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">快點做掉</text>';
    s += '<text x="' + (mx + gw / 4) + '" y="' + (my + gh / 4 + 12) + '" text-anchor="middle" font-size="8.5" font-weight="700" fill="#8a8a8a">（回個訊息）</text>';
    return s + '</svg>';
}
function goalBreakdown() {
    var s = '<svg viewBox="0 0 300 180" role="img" aria-label="把大目標「這學期學會游泳」拆成今天做得到、可以打勾的小任務：今天去上一堂課、練習換氣 10 次">';
    s += '<text x="150" y="15" text-anchor="middle" font-size="10.5" font-weight="700" fill="#8a8a8a">大目標（這學期）</text>';
    s += '<rect x="68" y="22" width="164" height="38" rx="10" fill="rgba(79,70,229,0.10)" stroke="#4f46e5" stroke-width="2"/>';
    s += '<text x="150" y="46" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">這學期學會游泳</text>';
    s += '<line x1="150" y1="62" x2="150" y2="80" stroke="#4f46e5" stroke-width="3"/><polygon points="150,82 145,74 155,74" fill="#4f46e5"/>';
    s += '<text x="214" y="76" text-anchor="middle" font-size="9.5" font-weight="700" fill="#4f46e5">拆成今天做</text>';
    s += '<rect x="50" y="86" width="200" height="74" rx="10" fill="none" stroke="#4f46e5" stroke-width="2"/>';
    s += '<text x="150" y="104" text-anchor="middle" font-size="11.5" font-weight="800" fill="#4f46e5">今天可以做（打勾）</text>';
    s += '<rect x="68" y="113" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><text x="94" y="126" font-size="11.5" font-weight="700" fill="currentColor">今天去上一堂課</text>';
    s += '<rect x="68" y="137" width="16" height="16" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><text x="94" y="150" font-size="11.5" font-weight="700" fill="currentColor">練習換氣 10 次</text>';
    s += '<text x="150" y="175" text-anchor="middle" font-size="10" font-weight="700" fill="#16a34a">完成就打勾 ✔</text>';
    return s + '</svg>';
}
window.CONCEPT = {
    progKey: 'study_skills_v1', practiceHref: 'learn_how_to_learn.html',
    lessons: [
        { id: 'smart', name: 'SMART 目標', emoji: '🎯', color: '#4f46e5', sub: '把「想學好」變成清楚、做得到的目標', done: '記得：好目標要具體、可衡量、有期限（SMART）——寫得出來、檢查得了，才不會只是喊口號。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '把模糊目標「升級」成清楚的目標', svg: smartTransform(), text: '「我要變厲害」聽起來很棒，但<b>沒辦法知道有沒有做到</b>。把它放進「目標升級器」，變成<b>具體、可衡量、有期限</b>的樣子：「這週每天讀英文 20 分鐘、週日自測能拼 30 個單字」——這樣你每天都知道要做什麼，週日也能<b>檢查</b>自己做到沒。' },
                { type: 'teach', kicker: '記五個字', title: 'SMART：好目標的五個要素', svg: smartTable(), text: 'SMART 是五個要素的開頭字母：<b>S 具體</b>、<b>M 可衡量</b>、<b>A 做得到</b>、<b>R 有關聯</b>、<b>T 有期限</b>。其中最關鍵的是<b>可衡量</b>（做到沒看得出來）和<b>有期限</b>（訂好什麼時候）——有了這兩個，你才檢查得了進度，不會只是喊口號。' },
                { type: 'quiz', kicker: '換你試試', title: '下列哪個最像 SMART 目標？', options: ['這週每天練 10 題數學，週五前把這單元訂正完', '我要變成數學高手', '我要多讀點書', '我以後要很強'], answer: 0, why: '它寫清楚了要做什麼（練 10 題、訂正完）、做多少、到什麼時候（週五前）——具體、可衡量、有期限。', whyWrong: ['', '「數學高手」沒有說要做什麼、做多少、到什麼時候，沒辦法檢查有沒有做到；SMART 目標要具體、可衡量、有期限。', '「多讀點書」太模糊，讀什麼、讀多少都不清楚；要像第一個選項那樣寫出具體、可衡量、有期限的做法。', '「以後很強」沒有期限、也沒有可檢查的標準；SMART 目標要能看出做到沒、什麼時候做到。'] },
                { type: 'quiz', kicker: '換你試試', title: 'SMART 的「M」指的是？', options: ['可衡量（做到沒有看得出來）', '很神祕', '最大', '手動'], answer: 0, why: 'M 是 Measurable＝可衡量，意思是訂一個做到沒看得出來的標準，才檢查得了進度。', whyWrong: ['', 'M 是 Measurable＝可衡量，不是神祕；意思是訂一個做到沒看得出來的標準。', 'M 不是「最大（Max）」；它是 Measurable 可衡量，重點在能不能檢查做到了沒。', 'M 不是「手動（Manual）」；它是 Measurable 可衡量，讓你看得出有沒有達成。'] }
            ] },
        { id: 'pomo', name: '番茄鐘', emoji: '🍅', color: '#ef4444', sub: '專注 25 分、休息 5 分，不容易累', done: '記得：專注 25 分、休息 5 分，4 輪後長休息；專注段一次只做一件事、關掉通知。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '番茄鐘：專注 25 分、休息 5 分', svg: pomodoroClock(), text: '把時間切成一顆一顆「<b>番茄</b>」：<b>專注 25 分鐘</b>，然後<b>休息 5 分鐘</b>。比起一次坐很久，這樣<b>不容易累</b>、也更容易專心。休息時記得<b>真的離開桌子</b>動一動，大腦才會真的放鬆。' },
                { type: 'teach', kicker: '怎麼安排', title: '四輪之後，給自己一個長休息', svg: pomodoroTimeline(), text: '一顆番茄做完，就重複下一顆。做滿<b>4 輪</b>之後，給自己一個<b>比較長的休息</b>（像 15 到 30 分鐘）。專注段裡<b>一次只做一件事、把通知關掉</b>——這和「學會如何學習」說的「一次做一件事」是同一個道理。' },
                { type: 'quiz', kicker: '換你試試', title: '番茄鐘的核心做法是？', options: ['專注一小段（如 25 分）後短暫休息，再重複', '一次讀 3 小時不休息', '邊讀邊滑手機', '只休息不讀'], answer: 0, why: '把時間切成「專注一段＋短休息」交替進行，可以維持專注、減少疲勞。', whyWrong: ['', '一次坐太久反而更累、更難專注；番茄鐘是把時間切成專注一小段加短休息，交替進行。', '邊讀邊滑手機會一直分心，等於沒有真正專注；番茄鐘的專注段要關掉干擾、只做一件事。', '只休息不讀就沒有學習了；番茄鐘是「專注一段＋短休息」交替，兩者都要有。'] },
                { type: 'quiz', kicker: '換你試試', title: '番茄鐘「專注段」裡最該做的是？', options: ['只做這一件事，把通知關掉', '同時回訊息', '一直換科目', '發呆'], answer: 0, why: '專注段要一次只做一件事、關掉干擾（呼應「一次做一件事」的單工原則）。', whyWrong: ['', '回訊息會打斷專注，等於一心二用；專注段要把通知關掉、一次只做一件事。', '一直換科目會讓大腦不停重新開機、更累；專注段要固定做同一件事。', '發呆就沒有在專注學習了；專注段要投入在這一件事上，休息留到休息段。'] }
            ] },
        { id: 'cornell', name: '康乃爾筆記法', emoji: '📝', color: '#0ea5e9', sub: '一頁分三區，筆記自動變複習工具', done: '記得：康乃爾筆記分三區——右記筆記、左寫問題、下做總結；複習時遮右區用左欄自測。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '康乃爾筆記：一頁分成三區', svg: cornellLayout(), text: '把筆記紙分成三區：<b>右邊大區</b>記上課筆記、<b>左邊窄欄</b>寫關鍵字和問題、<b>下方</b>寫自己的總結。光是這樣分區，筆記就會<b>自動變成複習工具</b>，不只是抄一堆字。' },
                { type: 'teach', kicker: '使用流程', title: '怎麼用：記 → 問 → 總結 → 自測', svg: cornellFlow(), text: '<b>① 上課</b>在右區記重點 → <b>② 課後</b>在左欄寫下關鍵問題 → <b>③</b> 在下方用一兩句<b>總結</b> → <b>④ 複習</b>時<b>遮住右區</b>，只看左欄問題考自己。遮住自測就是「<b>主動回想</b>」，用自己的話總結就是「<b>費曼法</b>」——都是最有效的學法。' },
                { type: 'quiz', kicker: '換你試試', title: '康乃爾筆記左邊窄欄主要寫？', options: ['關鍵字或可以拿來自測的問題', '整段抄課本', '塗鴉', '日期而已'], answer: 0, why: '左欄寫關鍵字和問題，複習時遮住右邊筆記、用這些問題自我測驗。', whyWrong: ['', '左欄不是用來再抄一次課本；它寫關鍵字和問題，之後遮住右邊筆記、用這些問題自我測驗。', '塗鴉幫不上複習；左欄要寫能拿來自測的關鍵字或問題。', '只寫日期沒辦法幫你複習；左欄要寫關鍵字或可以自測的問題。'] },
                { type: 'quiz', kicker: '換你試試', title: '康乃爾筆記最後的「總結區」怎麼用最有效？', options: ['用自己的話寫一兩句重點（像講給別人聽）', '把筆記再抄一遍', '留白', '貼貼紙'], answer: 0, why: '用自己的話總結，就是費曼式的精緻化，能幫你真正弄懂、記得更牢。', whyWrong: ['', '再抄一遍只是照抄，大腦沒有真的整理；總結區要用自己的話把重點講出來（像講給別人聽）。', '留白就沒有總結的效果了；用自己的話寫一兩句，才會記得更牢。', '貼貼紙不會幫你整理重點；總結區要用自己的話寫下這頁的重點。'] }
            ] },
        { id: 'mindmap', name: '心智圖', emoji: '🧠', color: '#16a34a', sub: '用分支看見一個主題的結構', done: '記得：心智圖從中央主題長出分支，一個分支一個關鍵詞，看得見結構也方便聯想。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '心智圖：從中央主題長出分支', svg: mindmapGood(), text: '把一個主題寫在<b>中央</b>，再像樹枝一樣往外長出<b>主幹（分類）</b>，每條主幹再長出<b>細節</b>。例如「水循環」分成蒸發、凝結、降水、匯流。這樣整個主題的<b>結構</b>一眼就看得見，也更容易<b>聯想</b>。' },
                { type: 'teach', kicker: '畫圖的好習慣', title: '一個分支，一個關鍵詞', svg: mindmapKeyword(), text: '每條分支<b>只寫簡短的關鍵詞</b>，不要寫一整句話——關鍵詞才看得出重點、方便往外再長細節。可以用<b>不同顏色</b>幫不同分類分組，結構會更清楚。整理得愈清楚，之後複習就愈快。' },
                { type: 'quiz', kicker: '換你試試', title: '心智圖最適合用來做什麼？', options: ['把一個主題的重點分門別類、看出彼此關係', '逐字背整課', '算數學', '計時'], answer: 0, why: '心智圖的放射結構，適合整理一個主題的重點、看出彼此之間的關係與聯想。', whyWrong: ['', '心智圖不是用來逐字背整課；它是把一個主題的重點分門別類、看出彼此關係。', '算數學用的是別的工具；心智圖適合整理一個主題的結構與關係。', '計時是番茄鐘在做的事；心智圖的用途是整理主題結構、看出重點之間的關係。'] },
                { type: 'quiz', kicker: '換你試試', title: '畫心智圖的好習慣是？', options: ['每個分支用簡短關鍵詞、再往外長細節', '每格寫整段文字', '只畫一條線', '全部同一個顏色不分類'], answer: 0, why: '用簡短關鍵詞加上分層，結構才清楚、方便往外長細節，也容易一眼看懂。', whyWrong: ['', '每格寫整段文字會看不出重點；心智圖的好習慣是一個分支一個簡短關鍵詞，再往外長細節。', '只畫一條線就看不出分類和關係；要從主題長出好幾條分支，每條用關鍵詞。', '全部同一個顏色、不分類會很難看出結構；用分支和分層（也可用顏色）把關係整理清楚。'] }
            ] },
        { id: 'todo', name: '待辦與優先序', emoji: '✅', color: '#f59e0b', sub: '先做重要的事，把大目標拆成今天的小任務', done: '記得：用「重要×緊急」排順序，先做重要的事，再把大目標拆成今天可以打勾的小任務。',
            steps: [
                { type: 'teach', kicker: '先想一想', title: '待辦清單：用「重要 × 緊急」排順序', svg: eisenhower(), text: '事情很多時，先把它們按<b>重要</b>和<b>緊急</b>分成四格：<b>又重要又緊急</b>的<b>先做</b>；重要但不緊急的<b>排時間慢慢做</b>（這格最常被忽略！）；不重要但緊急的<b>快點處理掉</b>；不重要又不緊急的<b>可以少做</b>。' },
                { type: 'teach', kicker: '動手做', title: '把大目標拆成今天做得到的小任務', svg: goalBreakdown(), text: '大目標（像「這學期學會游泳」）沒辦法今天就完成，但可以<b>拆成今天做得到的 2–3 件小事</b>：今天去上一堂課、練習換氣 10 次。寫成<b>可以打勾</b>的待辦，完成就打勾——這和 SMART 的「具體、有期限」是同一招。把今天的小任務放進首頁的「<b>今日任務</b>」，每天前進一點點。' },
                { type: 'quiz', kicker: '換你試試', title: '有很多事要做時，較好的做法是？', options: ['先分出重要/緊急、挑今天最該做的 2–3 件先做', '想到什麼做什麼', '先做最簡單最好玩的', '全部拖到最後'], answer: 0, why: '依優先序聚焦，先做最重要的 2–3 件，才不會瞎忙、把重要的事漏掉。', whyWrong: ['', '想到什麼做什麼容易瞎忙、重要的事反而沒做到；先分出重要/緊急，挑今天最該做的 2–3 件。', '先挑最簡單好玩的，常常把重要的事一直往後拖；要先看重要和緊急來排順序。', '全部拖到最後會來不及、壓力更大；把事情排好優先序、今天先做最重要的 2–3 件。'] },
                { type: 'quiz', kicker: '換你試試', title: '把「這學期學會游泳」變成今天做得到的任務，最好是？', options: ['今天去上一堂課、練習換氣 10 次', '今天就學會所有泳姿', '先報名明年的', '先買泳具就好'], answer: 0, why: '拆成今天就能完成、可以打勾的小步驟（呼應 SMART 的具體與拆解），每天前進一點點。', whyWrong: ['', '「今天就學會所有泳姿」做不到，不是今天能完成的任務；要拆成今天做得到、可以打勾的小步驟。', '報名明年的把事情往後拖，今天沒有真的往目標前進；要拆出今天就能做、能打勾的小任務。', '只買泳具沒有真的開始練習；把大目標拆成今天去上課、練換氣這種做得到的小步驟。'] }
            ] }
    ]
};
