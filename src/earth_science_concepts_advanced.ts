/* =====================================================================
 * earth_science_concepts_advanced.ts  →  (tsc, tsconfig.legacy.json) →  earth_science_concepts_advanced.js
 * 「地球科學觀念養成・進階（國中）」teach-first 動畫觀念頁。補齊 earth_science.html（進階關：
 *   地球的構造與變動／岩石礦物化石／大氣與天氣／太陽系／海洋）的「先學觀念」中學鷹架缺口。
 *   資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）＋ anim_core.js（window.Anim）。
 *   動畫課重用既有場景：window.Anim.earthRevolution（公轉）、earthSeasons（四季/地軸傾斜）、
 *   waterCycle（水循環）——不新增場景、不改 anim_core。其餘 teach 步驟一律 stepped / static SVG，零 text-only。
 *   以 IIFE 包住讓 SVG helper 為檔案區域（避免與其他已遷移頁同名頂層 helper 在 tsconfig.legacy
 *   共用全域型別檢查時 TS2393 衝突）。純本地進度（progKey），不餵主 XP。practiceHref＝earth_science.html。
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
function tx(x, y, s, size?, color?, anchor?, weight?) {
  return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') +
    '" font-size="' + (size || 11.5) + '" font-weight="' + (weight || 800) +
    '" fill="' + (color || 'currentColor') + '">' + s + '</text>';
}
// 右／左／下／上 箭頭。
function aR(x, y, len, color, sw?) { var x2 = x + len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x2 + ',' + y + ' ' + (x2 - 9) + ',' + (y - 6) + ' ' + (x2 - 9) + ',' + (y + 6) + '" fill="' + color + '"/>'; }
function aL(x, y, len, color, sw?) { var x2 = x - len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x2 + ',' + y + ' ' + (x2 + 9) + ',' + (y - 6) + ' ' + (x2 + 9) + ',' + (y + 6) + '" fill="' + color + '"/>'; }
function aD(x, y, len, color, sw?) { var y2 = y + len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x + ',' + y2 + ' ' + (x - 6) + ',' + (y2 - 9) + ' ' + (x + 6) + ',' + (y2 - 9) + '" fill="' + color + '"/>'; }
function aU(x, y, len, color, sw?) { var y2 = y - len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x + ',' + y2 + ' ' + (x - 6) + ',' + (y2 + 9) + ' ' + (x + 6) + ',' + (y2 + 9) + '" fill="' + color + '"/>'; }
// 小色點（圖例用）。
function dot(x, y, color) { return '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + color + '" fill-opacity="0.9"/>'; }

// ---- 色盤（亮暗雙主題皆清楚；結構文字用 currentColor＝--ink）----
var C_CRUST  = '#b45309';  // 地殼 brown
var C_MANTLE = '#ea580c';  // 地函 orange
var C_CORE   = '#e11d48';  // 地核 red
var C_PLATE  = '#78716c';  // 板塊 stone
var C_IGN    = '#dc2626';  // 火成岩 red（岩漿）
var C_SED    = '#eab308';  // 沉積岩 sand yellow
var C_META   = '#7c3aed';  // 變質岩 purple
var C_SKY    = '#38bdf8';  // 天空／對流層 sky
var C_WARMC  = '#e11d48';  // 暖流 red
var C_COLDC  = '#2563eb';  // 寒流 blue
var C_OCEAN  = '#0369a1';  // 海洋 deep blue
var C_LAND   = '#16a34a';  // 陸地 green
var C_SUN    = '#f59e0b';  // 太陽 amber
var C_HL     = '#f59e0b';  // 高亮 amber
var C_MLD    = '#64748b';  // 中性 slate
var C_GRN    = '#16a34a';  // 強調綠

/* =================== 課1：地球構造與板塊運動 =================== */
// 地球剖面：地殼（薄）＋地函＋地核，水煮蛋對照。
function earthLayers() {
  var inner = '';
  inner += tx(150, 14, '地球像水煮蛋，分成三層', 11);
  var cx = 82, cy = 94, r = 64;
  inner += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + C_MANTLE + '" fill-opacity="0.3" stroke="' + C_MANTLE + '" stroke-width="1.6"/>';   // 地函
  inner += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + C_CRUST + '" stroke-width="4"/>';   // 地殼（最外、很薄→用描邊示意）
  inner += '<circle cx="' + cx + '" cy="' + cy + '" r="26" fill="' + C_CORE + '" fill-opacity="0.85"/>';   // 地核
  inner += tx(cx, cy + 4, '地核', 10, '#fff');
  inner += tx(cx, cy - 38, '地函', 10, 'currentColor');
  inner += '<line x1="' + (cx + r - 2) + '" y1="' + (cy - 44) + '" x2="' + (cx + r + 16) + '" y2="' + (cy - 54) + '" stroke="' + C_CRUST + '" stroke-width="1.2"/>';
  inner += tx(cx + r + 20, cy - 54, '地殼（很薄）', 9, C_CRUST, 'start');
  // 右側說明
  var rows: Array<[string, string, string]> = [
    [C_CRUST, '地殼', '最外層、很薄（像蛋殼）'],
    [C_MANTLE, '地函', '最厚、會緩慢流動（像蛋白）'],
    [C_CORE, '地核', '最裡面、很熱（像蛋黃）']
  ];
  rows.forEach(function (r2, i) {
    var y = 50 + i * 28;
    inner += dot(176, y - 3, r2[0]);
    inner += tx(188, y, r2[1], 11, 'currentColor', 'start');
    inner += tx(188, y + 13, r2[2], 9, C_MLD, 'start');
  });
  return svg('300 164', inner, '地球剖面像水煮蛋分三層：最外薄薄的地殼像蛋殼，中間最厚、會緩慢流動的地函像蛋白，最裡面很熱的地核像蛋黃');
}
// 地殼裂成板塊，浮在會流動的地函上緩慢移動。
function platesMove() {
  var inner = '';
  inner += tx(150, 15, '地殼裂成「板塊」，浮在會流動的地函上', 10.5);
  inner += tx(150, 34, '板塊緩慢移動（一年只動幾公分）', 9, C_HL);
  // 地函
  inner += '<rect x="18" y="74" width="264" height="60" rx="8" fill="' + C_MANTLE + '" fill-opacity="0.25" stroke="' + C_MANTLE + '" stroke-width="1.5"/>';
  inner += tx(150, 124, '地函（會緩慢對流）', 9.5, C_MANTLE);
  // 對流示意（兩個旋轉箭頭）
  inner += '<path d="M62 118 A 20 16 0 1 1 62 88" fill="none" stroke="' + C_MANTLE + '" stroke-width="1.8"/><polygon points="62,88 56,96 68,96" fill="' + C_MANTLE + '"/>';
  inner += '<path d="M238 118 A 20 16 0 1 0 238 88" fill="none" stroke="' + C_MANTLE + '" stroke-width="1.8"/><polygon points="238,88 232,96 244,96" fill="' + C_MANTLE + '"/>';
  // 板塊（兩塊）浮在地函上緣
  inner += '<rect x="30" y="56" width="112" height="20" rx="4" fill="' + C_PLATE + '" fill-opacity="0.55" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.2"/>';
  inner += '<rect x="158" y="56" width="112" height="20" rx="4" fill="' + C_PLATE + '" fill-opacity="0.55" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.2"/>';
  inner += tx(86, 70, '板塊', 9.5, '#fff') + tx(214, 70, '板塊', 9.5, '#fff');
  inner += aR(98, 48, 18, C_GRN, 2.6) + aL(202, 48, 18, C_GRN, 2.6);
  return svg('300 142', inner, '地殼裂成好幾塊板塊，浮在下方會緩慢對流的地函上，被帶著一年移動幾公分');
}
// 板塊三種交界：聚合（擠壓）、張裂（拉開）、錯動（錯開）。
function plateBoundaries() {
  var inner = '';
  inner += tx(150, 14, '板塊三種交界，造出地震、火山與山脈', 10.5);
  // 面板1：聚合（擠壓）
  inner += tx(55, 34, '聚合（互相擠壓）', 8.5, C_MANTLE);
  inner += '<rect x="16" y="54" width="34" height="20" rx="3" fill="' + C_PLATE + '" fill-opacity="0.55"/>';
  inner += '<rect x="56" y="54" width="34" height="20" rx="3" fill="' + C_PLATE + '" fill-opacity="0.55"/>';
  inner += aR(26, 46, 14, C_MANTLE, 2.4) + aL(80, 46, 14, C_MANTLE, 2.4);
  inner += '<text x="53" y="52" text-anchor="middle" font-size="15">🌋</text>';
  inner += tx(53, 92, '→ 地震、火山', 8, 'currentColor') + tx(53, 103, '　 、山脈', 8, 'currentColor');
  // 面板2：張裂（拉開）
  inner += tx(150, 34, '張裂（互相拉開）', 8.5, C_IGN);
  inner += '<rect x="110" y="54" width="30" height="20" rx="3" fill="' + C_PLATE + '" fill-opacity="0.55"/>';
  inner += '<rect x="162" y="54" width="30" height="20" rx="3" fill="' + C_PLATE + '" fill-opacity="0.55"/>';
  inner += aL(126, 46, 13, C_IGN, 2.4) + aR(166, 46, 13, C_IGN, 2.4);
  inner += aU(151, 76, 14, C_IGN, 2.4);   // 岩漿上湧
  inner += tx(150, 92, '→ 中洋脊、', 8, 'currentColor') + tx(150, 103, '　 新地殼', 8, 'currentColor');
  // 面板3：錯動（錯開）
  inner += tx(245, 34, '錯動（彼此錯開）', 8.5, C_HL);
  inner += '<rect x="208" y="54" width="30" height="20" rx="3" fill="' + C_PLATE + '" fill-opacity="0.55"/>';
  inner += '<rect x="246" y="54" width="30" height="20" rx="3" fill="' + C_PLATE + '" fill-opacity="0.55"/>';
  inner += aU(223, 52, 12, C_HL, 2.4) + aD(261, 76, 12, C_HL, 2.4);
  inner += tx(245, 92, '→ 地震', 8, 'currentColor') + tx(245, 103, '　（如斷層）', 8, 'currentColor');
  // 台灣
  inner += '<rect x="30" y="118" width="240" height="30" rx="8" fill="' + C_HL + '" fill-opacity="0.12" stroke="' + C_HL + '" stroke-width="1.3"/>';
  inner += tx(150, 137, '台灣位在板塊交界（歐亞板塊與菲律賓海板塊），所以地震多、也造出高山。', 8.5, 'currentColor');
  return svg('300 158', inner, '板塊交界有三種：聚合是兩板塊互相擠壓造出地震火山山脈，張裂是互相拉開形成中洋脊與新地殼，錯動是彼此錯開造成地震。台灣位在板塊交界所以地震多');
}

/* =================== 課2：岩石循環與化石 =================== */
// 三大岩類卡。
function rockTypes() {
  var inner = '';
  inner += tx(150, 15, '三大岩類，形成方式不同', 11);
  var cards: Array<[number, string, string, string, string]> = [
    [60, C_IGN, '🌋', '火成岩', '岩漿冷卻凝固'],
    [150, C_SED, '🏖️', '沉積岩', '碎屑堆積膠結'],
    [240, C_META, '⛰️', '變質岩', '高溫高壓改造']
  ];
  cards.forEach(function (c) {
    inner += '<rect x="' + (c[0] - 40) + '" y="30" width="80" height="94" rx="10" fill="' + c[1] + '" fill-opacity="0.1" stroke="' + c[1] + '" stroke-width="1.8"/>';
    inner += '<text x="' + c[0] + '" y="62" text-anchor="middle" font-size="28">' + c[2] + '</text>';
    inner += tx(c[0], 90, c[3], 11, c[1]);
    inner += tx(c[0], 110, c[4], 8.8, 'currentColor');
  });
  return svg('300 134', inner, '三大岩類：火成岩由岩漿冷卻凝固、沉積岩由碎屑堆積膠結、變質岩由高溫高壓改造而成');
}
// 岩石循環：岩漿→火成岩→沉積岩→變質岩→熔融回岩漿。
function rockCycle() {
  var inner = '';
  inner += tx(150, 14, '岩石會互相轉變＝岩石循環', 11);
  var nodes: Array<[number, number, string, string]> = [
    [150, 40, C_IGN, '岩漿'],
    [250, 96, C_IGN, '火成岩'],
    [150, 152, C_SED, '沉積岩'],
    [50, 96, C_META, '變質岩']
  ];
  nodes.forEach(function (n) {
    inner += '<circle cx="' + n[0] + '" cy="' + n[1] + '" r="24" fill="' + n[2] + '" fill-opacity="0.16" stroke="' + n[2] + '" stroke-width="2"/>';
    inner += tx(n[0], n[1] + 4, n[3], 9.5, 'currentColor');
  });
  // 順時針箭頭＋標籤
  function arc(x1, y1, x2, y2, color, label, lx, ly) {
    var out = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="2.4"/>';
    var a = Math.atan2(y2 - y1, x2 - x1);
    out += '<polygon points="' + x2 + ',' + y2 + ' ' + (x2 - 9 * Math.cos(a - 0.42)) + ',' + (y2 - 9 * Math.sin(a - 0.42)) + ' ' + (x2 - 9 * Math.cos(a + 0.42)) + ',' + (y2 - 9 * Math.sin(a + 0.42)) + '" fill="' + color + '"/>';
    out += tx(lx, ly, label, 8, color);
    return out;
  }
  inner += arc(172, 54, 228, 80, C_MLD, '冷卻', 212, 56);
  inner += arc(240, 118, 176, 142, C_MLD, '風化沉積', 230, 140);
  inner += arc(124, 142, 60, 118, C_MLD, '高溫高壓', 72, 142);
  inner += arc(60, 74, 128, 56, C_MLD, '熔融', 86, 56);
  return svg('300 182', inner, '岩石循環：岩漿冷卻成火成岩，火成岩風化沉積變沉積岩，沉積岩受高溫高壓變變質岩，變質岩熔融又回到岩漿，循環不止');
}
// 化石埋在一層層沉積岩中。
function fossilInSediment() {
  var inner = '';
  inner += tx(150, 15, '化石大多埋在一層層的沉積岩裡', 10.5);
  var bands: Array<[number, string]> = [
    [34, '#fde68a'], [58, '#fcd34d'], [82, '#fbbf24'], [106, '#f59e0b']
  ];
  bands.forEach(function (bd) {
    inner += '<rect x="24" y="' + bd[0] + '" width="252" height="22" fill="' + bd[1] + '" fill-opacity="0.55" stroke="' + C_SED + '" stroke-width="0.8"/>';
  });
  inner += tx(262, 30, '沉積層', 9, C_SED, 'end');
  // 化石（菊石螺旋）埋在第3層
  inner += '<text x="96" y="98" text-anchor="middle" font-size="20">🐚</text>';
  inner += '<text x="186" y="74" text-anchor="middle" font-size="18">🦴</text>';
  inner += tx(150, 140, '生物遺骸被一層層沉積物掩埋，變成化石', 8.5, 'currentColor');
  return svg('300 148', inner, '沉積物一層層堆積，生物遺骸被掩埋在層與層之間變成化石，所以化石大多保存在沉積岩中');
}

/* =================== 課3：大氣與天氣的成因 =================== */
// 大氣分層：對流層＝天氣發生處。
function atmosphereLayers() {
  var inner = '';
  inner += tx(150, 14, '天氣發生在最靠近地面的「對流層」', 10.5);
  // 由上而下：太空、平流層、對流層、地面
  inner += '<rect x="24" y="26" width="252" height="24" rx="4" fill="#1e293b" fill-opacity="0.3" stroke="' + C_MLD + '" stroke-width="1"/>';
  inner += tx(42, 42, '太空', 9, 'currentColor', 'start') + '<text x="248" y="46" text-anchor="middle" font-size="15">🌌</text>';
  inner += '<rect x="24" y="54" width="252" height="24" rx="4" fill="' + C_SKY + '" fill-opacity="0.18" stroke="' + C_SKY + '" stroke-width="1"/>';
  inner += tx(42, 70, '平流層', 9, 'currentColor', 'start');
  inner += '<rect x="24" y="82" width="252" height="40" rx="4" fill="' + C_SKY + '" fill-opacity="0.38" stroke="' + C_SKY + '" stroke-width="1.6"/>';
  inner += tx(42, 98, '對流層', 9.5, 'currentColor', 'start');
  inner += '<text x="150" y="110" text-anchor="middle" font-size="15">☁️🌧️</text>';
  inner += tx(230, 100, '天氣在這裡', 8.5, C_IGN, 'start');
  inner += '<rect x="24" y="124" width="252" height="14" rx="3" fill="' + C_LAND + '" fill-opacity="0.5"/>';
  inner += tx(150, 135, '地面', 8.5, '#fff');
  return svg('300 150', inner, '大氣由下往上有對流層、平流層等；最靠近地面的對流層水氣多、對流旺盛，雲雨風等天氣都發生在這一層');
}
// 對流：暖升冷降生風。
function convection() {
  var inner = '';
  inner += tx(150, 14, '太陽加熱不均，暖空氣上升、冷空氣下沉＝風', 9.8);
  // 地面
  inner += '<rect x="18" y="120" width="264" height="16" rx="3" fill="' + C_LAND + '" fill-opacity="0.5"/>';
  inner += '<text x="60" y="118" text-anchor="middle" font-size="16">☀️</text>';
  inner += tx(60, 134, '被曬熱的地面', 8.5, '#fff');
  inner += tx(236, 134, '較涼的地面', 8.5, '#fff');
  // 暖空氣上升（紅）；標籤置於箭頭左側避免壓線
  inner += aU(74, 112, 60, C_WARMC, 3.4);
  inner += tx(58, 74, '暖空氣', 9, C_WARMC, 'end') + tx(58, 88, '上升', 9, C_WARMC, 'end');
  // 冷空氣下沉（藍）；標籤置於箭頭右側避免壓線
  inner += aD(226, 48, 60, C_COLDC, 3.4);
  inner += tx(242, 74, '冷空氣', 9, C_COLDC, 'start') + tx(242, 88, '下沉', 9, C_COLDC, 'start');
  // 高空回流 + 近地回流（風）
  inner += aR(92, 46, 108, C_MLD, 2.2);
  inner += aL(214, 110, 110, C_GRN, 2.6);
  inner += tx(150, 102, '空氣流動＝風', 9, C_GRN);
  return svg('300 146', inner, '太陽把地面曬得不均勻，較熱處的暖空氣上升、較涼處的冷空氣下沉，空氣這樣流動起來就是風');
}

/* =================== 課4：太陽系與地球運動 =================== */
// 太陽系：太陽＋八大行星，地球第三顆，類地vs類木。
function solarSystem() {
  var inner = '';
  inner += tx(150, 14, '太陽系：太陽加八大行星，地球是第三顆', 10);
  inner += '<circle cx="26" cy="78" r="16" fill="' + C_SUN + '" stroke="#ea580c" stroke-width="1.5"/>';
  inner += tx(26, 108, '太陽', 9, C_SUN);
  var planets: Array<[string, number, string]> = [
    ['水', 4, C_MLD], ['金', 5.5, '#eab308'], ['地', 6, '#2563eb'], ['火', 4.5, '#dc2626'],
    ['木', 13, '#d97706'], ['土', 11, '#ca8a04'], ['天', 8, '#0891b2'], ['海', 8, '#1d4ed8']
  ];
  var xs = [60, 86, 114, 142, 182, 224, 256, 282];
  planets.forEach(function (p, i) {
    var hl = (i === 2);
    inner += '<circle cx="' + xs[i] + '" cy="78" r="' + p[1] + '" fill="' + p[2] + '" fill-opacity="0.85"' + (hl ? ' stroke="' + C_HL + '" stroke-width="2.5"' : '') + '/>';
    inner += tx(xs[i], 78 + p[1] + 11, p[0], 8.5, hl ? C_HL : 'currentColor');
  });
  inner += '<line x1="46" y1="78" x2="282" y2="78" stroke="' + C_MLD + '" stroke-width="0.8" stroke-dasharray="2 3" opacity="0.5"/>';
  inner += tx(114, 46, '↑ 地球（第三顆）', 8.5, C_HL);
  // 類地 / 類木 分組
  inner += '<rect x="52" y="100" width="104" height="16" rx="5" fill="none" stroke="#2563eb" stroke-width="1.2"/>';
  inner += tx(104, 111, '類地行星（岩質、小）', 8, '#2563eb');
  inner += '<rect x="168" y="100" width="124" height="16" rx="5" fill="none" stroke="#d97706" stroke-width="1.2"/>';
  inner += tx(230, 111, '類木行星（氣體巨行星、大）', 7.6, '#d97706');
  return svg('300 124', inner, '太陽系由內往外有水星金星地球火星木星土星天王星海王星八大行星，地球是第三顆；內側四顆是岩質較小的類地行星，外側四顆是氣體巨大的類木行星');
}

/* =================== 課5：海洋、洋流與水在地球 =================== */
// 海洋約七成覆蓋地球。
function oceanCoverage() {
  var inner = '';
  inner += tx(150, 15, '地球約七成被海洋覆蓋', 11);
  inner += '<text x="40" y="78" text-anchor="middle" font-size="40">🌍</text>';
  // 10 格：7 海 3 陸
  for (var i = 0; i < 10; i++) {
    var sea = i < 7;
    var x = 92 + (i % 5) * 36;
    var y = 42 + Math.floor(i / 5) * 36;
    inner += '<rect x="' + x + '" y="' + y + '" width="30" height="30" rx="5" fill="' + (sea ? C_OCEAN : C_LAND) + '" fill-opacity="0.8"/>';
  }
  inner += dot(96, 118, C_OCEAN) + tx(108, 121, '海洋 7 格', 9, 'currentColor', 'start');
  inner += dot(188, 118, C_LAND) + tx(200, 121, '陸地 3 格', 9, 'currentColor', 'start');
  return svg('300 132', inner, '把地球表面分成十格，大約七格是海洋、三格是陸地，所以地球約七成被海洋覆蓋');
}
// 洋流：暖流低緯往高緯、寒流高緯往低緯，調節氣候。
function currents() {
  var inner = '';
  inner += tx(150, 14, '洋流把熱量從低緯搬到高緯，調節冷熱', 9.8);
  inner += '<rect x="24" y="26" width="252" height="104" rx="8" fill="' + C_OCEAN + '" fill-opacity="0.18" stroke="' + C_OCEAN + '" stroke-width="1.4"/>';
  inner += tx(44, 40, '北極（冷）', 8, C_COLDC, 'start');
  inner += tx(256, 122, '赤道（熱）', 8, C_WARMC, 'end');
  // 赤道線
  inner += '<line x1="24" y1="112" x2="276" y2="112" stroke="' + C_WARMC + '" stroke-width="1" stroke-dasharray="4 3" opacity="0.7"/>';
  // 暖流：赤道往上（低緯→高緯）；標籤置於箭頭左側避免壓線
  inner += aU(96, 108, 56, C_WARMC, 3.2);
  inner += tx(78, 74, '暖流', 8.5, C_WARMC, 'end') + tx(78, 88, '低緯→高緯', 8, C_WARMC, 'end');
  // 寒流：高緯往下（高緯→低緯）；標籤置於箭頭右側避免壓線
  inner += aD(204, 50, 56, C_COLDC, 3.2);
  inner += tx(222, 74, '寒流', 8.5, C_COLDC, 'start') + tx(222, 88, '高緯→低緯', 8, C_COLDC, 'start');
  inner += tx(150, 146, '暖流帶來溫暖、寒流帶來涼爽，調節沿岸氣候', 8.8, C_GRN);
  return svg('300 156', inner, '洋流是海水大規模流動：暖流把低緯度的熱往高緯度送、寒流把高緯度的涼往低緯度送，調節各地沿岸的冷熱');
}

window.CONCEPT = {
  progKey: 'earth_science_concepts_adv_v1', practiceHref: 'earth_science.html',
  lessons: [
   { id:'plates', name:'地球構造與板塊運動', emoji:'🌋', color:'#ea580c', sub:'地球分層、板塊運動、地震火山的成因',
     done:'記得：地球由地殼（薄）、地函、地核組成；板塊浮在會流動的地函上緩慢移動，交界處因板塊擠壓、張裂、錯動而多地震與火山。台灣就位在板塊交界，所以地震多。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'地球像水煮蛋，分三層',svg:earthLayers(),text:'把地球切開來看，像一顆<b>水煮蛋</b>：最外面薄薄的<b>地殼</b>（像蛋殼）、中間最厚、會<b>緩慢流動</b>的<b>地函</b>（像蛋白）、最裡面又熱又重的<b>地核</b>（像蛋黃）。我們就住在薄薄的地殼上。'},
      {type:'teach',kicker:'會動的地殼',title:'板塊浮在地函上緩慢移動',svg:platesMove(),text:'地殼不是完整一片，而是<b>裂成好幾塊</b>，叫做<b>板塊</b>。板塊<b>浮在下方會緩慢對流的地函上</b>，被帶著<b>緩慢移動</b>——雖然慢（一年只動幾公分），但經過很長時間，就能改變海陸的位置。'},
      {type:'teach',kicker:'交界最熱鬧',title:'三種交界造出地震、火山、山脈',svg:plateBoundaries(),text:'板塊的<b>交界</b>有三種：<b>聚合</b>（互相擠壓）會造出<b>地震、火山、高山</b>；<b>張裂</b>（互相拉開）會形成<b>中洋脊和新地殼</b>；<b>錯動</b>（彼此錯開）會造成<b>地震</b>。<b>台灣正好位在板塊交界</b>（歐亞板塊與菲律賓海板塊），所以<b>地震特別多</b>，也被擠出了高山。'},
      {type:'quiz',kicker:'換你試試',title:'地震和火山為什麼常發生在板塊「交界」？',options:['交界處板塊互相擠壓、錯動，累積的能量釋放出來','交界的地方比較冷','交界埋著大磁鐵','純屬巧合'],answer:0,why:'板塊在交界相對運動，能量在此累積並釋放，造成地震與岩漿活動（火山）。',whyWrong:{1:'冷熱不是原因；關鍵是板塊在交界相對運動、釋放能量。',2:'交界沒有大磁鐵；地震火山來自板塊運動釋放的能量。',3:'不是巧合——地震火山明顯沿著板塊交界集中分布。'}},
      {type:'quiz',kicker:'換你試試',title:'板塊是浮在什麼上面緩慢移動？',options:['會緩慢流動的地函','空氣','地核的鐵','海水'],answer:0,why:'板塊漂浮在具可塑性、會緩慢對流的地函之上，被帶著緩慢移動。',whyWrong:{1:'板塊不是浮在空氣上；它下面是會流動的地函。',2:'地核在很深的地方，板塊直接接觸的是上方的地函，不是地核的鐵。',3:'海水在板塊上面（海洋）；板塊是浮在下方的地函上。'}},
      {type:'quiz',kicker:'想一想',title:'台灣為什麼地震特別多？',options:['台灣正好位在板塊的交界上','台灣沒有山','台灣在地核裡','台灣離太陽比較近'],answer:0,why:'台灣位於歐亞板塊與菲律賓海板塊的交界，板塊相互擠壓，所以地震多、也造出高山。',whyWrong:{1:'台灣有很多高山（像中央山脈）；地震多是因為位在板塊交界。',2:'沒有地方在地核裡；台灣在地表、剛好在板塊交界上。',3:'離太陽遠近和地震無關；地震來自板塊運動。'}}
     ]},
   { id:'rocks', name:'岩石循環與化石', emoji:'🪨', color:'#b45309', sub:'三大岩類、岩石循環、化石',
     done:'記得：火成岩（岩漿冷卻）、沉積岩（碎屑堆積膠結）、變質岩（高溫高壓改造）會透過岩石循環互相轉變；化石大多保存在沉積岩中。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'三大岩類怎麼分',svg:rockTypes(),text:'岩石依<b>形成方式</b>分三大類：<b>火成岩</b>是<b>岩漿冷卻凝固</b>而成；<b>沉積岩</b>是碎屑（砂、泥）<b>一層層堆積、膠結</b>而成；<b>變質岩</b>是原有岩石在地下受<b>高溫高壓改造</b>而成。'},
      {type:'teach',kicker:'會互相變',title:'岩石循環：互相轉變',svg:rockCycle(),text:'這三類岩石<b>會互相轉變</b>，叫做<b>岩石循環</b>：岩漿<b>冷卻</b>成火成岩 → 露出地表被<b>風化、侵蝕、沉積</b>變成沉積岩 → 深埋地下受<b>高溫高壓</b>變成變質岩 → 再被<b>熔融</b>回到岩漿……一直循環。'},
      {type:'teach',kicker:'岩石裡的時光',title:'化石大多在沉積岩裡',svg:fossilInSediment(),text:'<b>化石</b>是古代生物留下的遺骸或痕跡。生物死後被<b>一層層沉積物掩埋</b>，慢慢變成化石，所以化石<b>大多保存在沉積岩中</b>。火成岩和變質岩因為經歷高溫高壓，比較少保存化石。'},
      {type:'quiz',kicker:'換你試試',title:'岩漿冷卻凝固形成的是哪一類岩石？',options:['火成岩','沉積岩','變質岩','化石'],answer:0,why:'岩漿或熔岩冷卻結晶，形成火成岩。',whyWrong:{1:'沉積岩是碎屑堆積膠結而成，不是岩漿冷卻。',2:'變質岩是原有岩石受高溫高壓改造而成，不是直接由岩漿冷卻。',3:'化石是生物遺骸的痕跡，不是一類岩石。'}},
      {type:'quiz',kicker:'換你試試',title:'化石最常保存在哪一類岩石中？',options:['沉積岩','火成岩','變質岩','都不會有'],answer:0,why:'生物遺骸隨沉積物一層層堆積掩埋，所以化石多見於沉積岩。',whyWrong:{1:'火成岩由高溫岩漿冷卻而成，高溫會破壞生物遺骸，很少有化石。',2:'變質岩經高溫高壓改造，原有化石多半被破壞，較少保存。',3:'化石其實很常見——它們大多保存在沉積岩中。'}},
      {type:'quiz',kicker:'想一想',title:'原有的岩石受到高溫高壓「改造」後，會變成哪一類？',options:['變質岩','火成岩','沉積岩','不會改變'],answer:0,why:'岩石在地下受高溫、高壓作用改變結構或成分，形成變質岩。',whyWrong:{1:'火成岩是岩漿冷卻而成，不是固態岩石被高溫高壓改造。',2:'沉積岩是碎屑堆積膠結而成，不是高溫高壓改造。',3:'會改變——三大岩類會透過岩石循環互相轉變。'}}
     ]},
   { id:'weather', name:'大氣與天氣的成因', emoji:'🌤️', color:'#0ea5e9', sub:'大氣分層、對流與風、雲雨的形成',
     done:'記得：天氣發生在最靠近地面的對流層；太陽加熱不均使暖空氣上升、冷空氣下沉形成風；水氣上升遇冷凝結成雲，水滴夠大就降水。高氣壓多晴、低氣壓多雲雨。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'天氣在「對流層」發生',svg:atmosphereLayers(),text:'大氣由下往上分成好幾層。最靠近地面的叫<b>對流層</b>——這裡<b>水氣多、空氣對流旺盛</b>，所以<b>雲、雨、風等天氣</b>幾乎都發生在這一層。再往上還有平流層等，空氣稀薄、很少天氣變化。'},
      {type:'teach',kicker:'風怎麼來',title:'暖升冷降，空氣流動就是風',svg:convection(),text:'太陽把地面曬得<b>不均勻</b>：被曬熱的地方，<b>暖空氣</b>比較輕會<b>上升</b>；比較涼的地方，<b>冷空氣</b>比較重會<b>下沉</b>。空氣這樣<b>流動</b>起來，就是我們感覺到的<b>風</b>。'},
      {type:'teach',kicker:'雲和雨',title:'水氣遇冷凝結成雲雨',svg:animCanvas(320,188,'水循環動畫：太陽曬熱海水，水變成水蒸氣往上升（蒸發），升到高空變冷凝結成小水滴聚成雲，水滴變大落下成雨（降水），雨水流回海洋，一直循環——當作雲和雨怎麼形成的對照'),mount:function(host){return window.Anim&&window.Anim.waterCycle(host);},text:'空氣中看不見的<b>水氣上升</b>，到高空變冷就<b>凝結</b>成許多小水滴或冰晶，聚在一起就是<b>雲</b>；水滴越聚越大、重到撐不住就<b>落下成雨</b>（降水）。看動畫複習這段「蒸發 → 凝結成雲 → 降水」。另外：<b>高氣壓</b>（下沉氣流）多半<b>晴朗</b>，<b>低氣壓</b>（上升氣流）才<b>多雲雨</b>。'},
      {type:'quiz',kicker:'換你試試',title:'天氣現象（雲、雨、風）主要發生在大氣的哪一層？',options:['對流層','外太空','地核','海底'],answer:0,why:'對流層最靠近地面、水氣多又對流旺盛，是天氣發生的地方。',whyWrong:{1:'外太空幾乎沒有空氣，不會有雲雨風等天氣。',2:'地核在地球內部很深處，和大氣天氣無關。',3:'海底是海水，不是大氣；天氣發生在大氣的對流層。'}},
      {type:'quiz',kicker:'換你試試',title:'雲是怎麼形成的？',options:['空氣中的水氣上升遇冷，凝結成小水滴或冰晶','天空本來就有棉花','太陽把雲燒出來','風直接吹出來的'],answer:0,why:'空氣上升變冷，水氣凝結成微小水滴或冰晶，聚在一起就是雲。',whyWrong:{1:'雲不是棉花，而是水氣凝結成的小水滴或冰晶。',2:'太陽提供蒸發的熱，但雲是水氣遇冷凝結而成，不是被燒出來。',3:'風只是空氣流動；雲是水氣凝結形成的。'}},
      {type:'quiz',kicker:'想一想',title:'高氣壓籠罩時，天氣通常是？',options:['多半晴朗、乾爽','一定會下大雪','一定打雷下冰雹','天空會消失'],answer:0,why:'高氣壓是下沉氣流，水氣不易凝結，所以多半晴朗；低氣壓是上升氣流，才多雲雨。',whyWrong:{1:'下雪要有上升、水氣凝結的條件，比較像低氣壓；高氣壓多半晴朗。',2:'雷雨冰雹是強烈上升氣流（低氣壓、對流旺盛）造成，不是高氣壓。',3:'天空不會消失；高氣壓只是讓天氣多半晴朗。'}}
     ]},
   { id:'solar', name:'太陽系與地球運動', emoji:'🪐', color:'#7c3aed', sub:'八大行星、自轉與公轉、四季成因',
     done:'記得：太陽系有太陽加八大行星，地球是第三顆、屬岩質的類地行星；自轉造成晝夜、公轉加地軸傾斜造成四季（看陽光角度，不是距離）。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'太陽系與八大行星',svg:solarSystem(),text:'<b>太陽系</b>的中心是<b>太陽</b>，外面有<b>八大行星</b>繞著它轉：由內往外是<b>水星、金星、地球、火星、木星、土星、天王星、海王星</b>，<b>地球是第三顆</b>。內側四顆（水金地火）是<b>岩質、較小</b>的<b>類地行星</b>；外側四顆（木土天海）是<b>氣體、巨大</b>的<b>類木行星</b>。'},
      {type:'teach',kicker:'地球怎麼轉',title:'自轉造成晝夜、公轉繞一年',svg:animCanvas(300,180,'公轉動畫：地球沿著軌道繞太陽轉一大圈，繞一圈大約一年；地球同時也自己自轉'),mount:function(host){return window.Anim&&window.Anim.earthRevolution(host);},text:'地球有兩種轉：<b>自轉</b>（自己轉一圈約一天）造成<b>白天和晚上</b>輪流；<b>公轉</b>（繞太陽轉一大圈約一年）。看動畫裡地球沿著軌道繞太陽走——這就是公轉，繞一圈就是一年。'},
      {type:'teach',kicker:'為什麼有四季',title:'地軸傾斜加公轉造成四季',svg:animCanvas(330,182,'四季動畫：地球繞太陽時地軸方向固定、斜向同一邊，北半球有時朝太陽、陽光直射是夏天，半年後斜離太陽、陽光斜射是冬天；右邊示意同樣多的陽光，直射時集中變熱、斜射時攤開變涼；四個位置離太陽一樣遠'),mount:function(host){return window.Anim&&window.Anim.earthSeasons(host);},text:'地球<b>斜著</b>轉、地軸<b>一直斜向同一邊</b>。公轉時，同一個地方有時<b>朝太陽、陽光直射</b>（集中→熱，夏天），半年後<b>斜離太陽、陽光斜射</b>（攤開→涼，冬天），這就是<b>四季</b>。重點：四季看的是<b>陽光角度</b>，<b>不是</b>離太陽的遠近——四個位置離太陽的遠近變化很小。'},
      {type:'quiz',kicker:'換你試試',title:'四季變化主要是因為？',options:['地軸傾斜加上公轉，使陽光直射的角度改變','地球離太陽忽遠忽近','太陽會變大變小','月亮擋住太陽'],answer:0,why:'地軸固定傾斜，公轉時各地受陽光直射或斜射的角度改變，形成四季；和距離變化無關。',whyWrong:{1:'四季看陽光角度，不是距離；地球離太陽遠近變化很小，不是主因。',2:'太陽的大小並沒有在一年中變大變小。',3:'月亮擋太陽是日食，很少發生，不是四季的原因。'}},
      {type:'quiz',kicker:'換你試試',title:'白天和晚上的交替，是因為地球的？',options:['自轉','公轉','被月亮繞','太陽在天上移動'],answer:0,why:'地球自轉使同一地點輪流朝向、背對太陽，形成白天和晚上。',whyWrong:{1:'公轉是繞太陽一圈約一年，造成四季；晝夜是自轉造成的。',2:'月亮繞地球和晝夜無關；晝夜是地球自己自轉造成。',3:'看起來太陽在移動，其實是地球在自轉，不是太陽真的繞地球跑。'}},
      {type:'quiz',kicker:'想一想',title:'地球在太陽系裡是第幾顆行星？屬於哪一類？',options:['第三顆，屬於岩質的「類地行星」','第一顆，屬於氣體巨行星','第八顆，屬於類木行星','太陽也算行星，所以地球是第四顆'],answer:0,why:'由內往外數：水星、金星、地球……地球是第三顆；內側四顆是岩質的類地行星。',whyWrong:{1:'第一顆是水星，而且地球是岩質的類地行星，不是氣體巨行星。',2:'第八顆是海王星；地球是第三顆、屬類地行星。',3:'太陽是恆星不是行星；由內往外數，地球是第三顆。'}}
     ]},
   { id:'ocean', name:'海洋、洋流與水在地球', emoji:'🌊', color:'#0369a1', sub:'海洋覆蓋、洋流調節氣候、水循環系統',
     done:'記得：地球約七成被海洋覆蓋；洋流把熱量從低緯帶到高緯、調節氣候；水循環把海洋、雲、雨、河川、地下水連成一個不停流動的系統。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'地球是「水的行星」',svg:oceanCoverage(),text:'從太空看，地球是藍色的——因為<b>約七成（約 71%）的表面被海洋覆蓋</b>，陸地只有約三成。這麼多的水讓地球和其他行星很不一樣，所以地球又被叫做<b>水的行星</b>。'},
      {type:'teach',kicker:'海水在搬熱',title:'洋流調節各地氣候',svg:currents(),text:'<b>洋流</b>是海水<b>大規模的流動</b>。<b>暖流</b>把<b>低緯度（赤道）的熱</b>往<b>高緯度</b>送、<b>寒流</b>把高緯度的涼往低緯度送。這樣<b>搬運熱量</b>，讓沿岸的氣候<b>比較溫和或比較涼</b>，調節了全球的冷熱。（深層洋流還會因海水<b>溫度和鹽度（密度）</b>差異而流動。）'},
      {type:'teach',kicker:'水的大循環',title:'水循環串起全部的水',svg:animCanvas(320,188,'水循環動畫：太陽曬熱海水，水變成水蒸氣往上升（蒸發），升到高空變冷凝結成雲，水滴變大落下成雨（降水），雨水流進河川、流回海洋，然後又被曬蒸發，一直循環'),mount:function(host){return window.Anim&&window.Anim.waterCycle(host);},text:'地球上的水一直在<b>循環</b>：海水受太陽加熱<b>蒸發</b>成水氣上升 → 遇冷<b>凝結成雲</b> → <b>降水</b>（雨、雪）落下 → 流進<b>河川、地下水</b>，再<b>流回海洋</b>……看動畫走一輪。<b>水循環</b>把海洋、雲、雨、河川、地下水連成<b>一個不停流動的系統</b>，所以地球的水用不完。'},
      {type:'quiz',kicker:'換你試試',title:'洋流對氣候的影響是？',options:['把熱量從低緯度搬到高緯度，調節各地的冷熱','讓海水慢慢變不見','專門製造地震','對氣候完全沒有影響'],answer:0,why:'暖流和寒流輸送熱量，使沿岸氣候較溫和或較涼，調節全球的熱量分布。',whyWrong:{1:'洋流只是海水流動，不會讓海水變不見。',2:'地震來自板塊運動，不是洋流造成的。',3:'洋流會影響——它把熱量搬來搬去，明顯調節沿岸冷熱。'}},
      {type:'quiz',kicker:'換你試試',title:'水循環中，海水是怎麼變成雲的？',options:['受太陽加熱蒸發成水氣上升，遇冷凝結','整片海水直接飛上天','被魚帶上去','被風把整片海水吹上天'],answer:0,why:'海面的水受太陽加熱蒸發成看不見的水氣，上升到高空遇冷凝結成雲。',whyWrong:{1:'海水不會整片飛上天；是先蒸發成水氣（看不見）才上升。',2:'魚不會把海水帶上天；水是靠蒸發變成水氣上升。',3:'風吹不起整片海水；變成雲靠的是蒸發與凝結。'}},
      {type:'quiz',kicker:'想一想',title:'地球表面大約有多少被海洋覆蓋？',options:['大約七成（約 71%）','大約一成','幾乎沒有，大部分是陸地','百分之百都是海'],answer:0,why:'海洋約覆蓋地球表面的七成，所以地球又被稱為水的行星。',whyWrong:{1:'海洋覆蓋的比例遠不止一成，大約是七成。',2:'剛好相反——海洋約占七成，陸地只有約三成。',3:'不是全部；還有約三成是陸地。'}}
     ]}
  ]
};

})();
