/* =====================================================================
 * chemistry_concepts_advanced.ts  →  (tsc, tsconfig.legacy.json) →  chemistry_concepts_advanced.js
 * 「化學觀念養成・進階（國中）」teach-first 動畫觀念頁。補齊 chemistry.html（進階關：
 *   週期表、鍵結、化學式書寫與配平、氧化還原、莫耳計量）的「先學觀念」中學鷹架缺口。
 *   資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）＋ anim_core.js（window.Anim）。
 *   動畫課重用既有場景 window.Anim.reactionRebond（配平守恆；不新增場景、不改 anim_core）；
 *   其餘 teach 步驟一律 stepped / static SVG（第 2、3 級 VIZ），零 text-only。
 *   以 IIFE 包住讓 SVG helper 為檔案區域（避免與其他已遷移頁同名頂層 helper 在 tsconfig.legacy
 *   共用全域型別檢查時 TS2393 衝突）。純本地進度（progKey），不餵主 XP。practiceHref＝chemistry.html。
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
function aR(x, y, len, color, sw?) { var x2 = x + len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x2 + ',' + y + ' ' + (x2 - 9) + ',' + (y - 6) + ' ' + (x2 - 9) + ',' + (y + 6) + '" fill="' + color + '"/>'; }
function aL(x, y, len, color, sw?) { var x2 = x - len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x2 + ',' + y + ' ' + (x2 + 9) + ',' + (y - 6) + ' ' + (x2 + 9) + ',' + (y + 6) + '" fill="' + color + '"/>'; }
function aD(x, y, len, color, sw?) { var y2 = y + len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x + ',' + y2 + ' ' + (x - 6) + ',' + (y2 - 9) + ' ' + (x + 6) + ',' + (y2 - 9) + '" fill="' + color + '"/>'; }
// 方塊（物體／物質）。
function box(x, y, w, h, color, txt0?) {
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="' + color + '" fill-opacity="0.2" stroke="' + color + '" stroke-width="2.5"/>' +
    (txt0 ? '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 5) + '" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">' + txt0 + '</text>' : '');
}
// 電子小圓點。
function edot(x, y, color?) { return '<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + (color || C_E) + '" stroke="#333" stroke-width="0.6"/>'; }
// 原子圓（符號在中心）。
function atom(cx, cy, el, fill, tcol, r?) { r = r || 16; return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '" stroke="#555" stroke-width="1.5"/><text x="' + cx + '" y="' + (cy + 5) + '" text-anchor="middle" font-size="' + (r * 0.85) + '" font-weight="800" fill="' + tcol + '">' + el + '</text>'; }
function bond(x1, y1, x2, y2) { return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="#8a8a8a" stroke-width="4"/>'; }

// ---- 色盤（亮暗雙主題皆清楚；結構文字用 currentColor＝--ink）----
var C_MET = '#2563eb';   // 金屬 blue
var C_NON = '#ea580c';   // 非金屬 orange
var C_MLD = '#64748b';   // 類金屬 slate
var C_NOB = '#7c3aed';   // 惰性氣體 purple
var C_FAM = '#f59e0b';   // 高亮一族 amber
var C_E   = '#f59e0b';   // 電子 amber
var C_OX  = '#e11d48';   // 氧／氧化 red
var C_HY  = '#e5e7eb';   // 氫 white
var C_CB  = '#374151';   // 碳 dark
var C_NA  = '#eab308';   // 鈉 gold
var C_CL  = '#16a34a';   // 氯 green
var C_FE  = '#78716c';   // 鐵 grey
var C_RUST= '#b45309';   // 鏽 brown
var C_POS = '#dc2626';   // 正電 red
var C_NEG = '#2563eb';   // 負電 blue
var C_GRN = '#16a34a';   // 強調綠

/* =================== 課1：週期表與元素家族 =================== */
// 迷你週期表（前 20 個元素，標準學校排法；col0=1族、col1=2族、col2–7=13–18族）。
var PX = [18, 45, 94, 121, 148, 175, 202, 229];   // 8 欄 x（第 2、3 欄間留族空隙）
var PY = [22, 48, 74, 100];                        // 4 列 y
var ELS: Array<[number, number, number, string]> = [
  [0, 0, 1, 'H'], [7, 0, 2, 'He'],
  [0, 1, 3, 'Li'], [1, 1, 4, 'Be'], [2, 1, 5, 'B'], [3, 1, 6, 'C'], [4, 1, 7, 'N'], [5, 1, 8, 'O'], [6, 1, 9, 'F'], [7, 1, 10, 'Ne'],
  [0, 2, 11, 'Na'], [1, 2, 12, 'Mg'], [2, 2, 13, 'Al'], [3, 2, 14, 'Si'], [4, 2, 15, 'P'], [5, 2, 16, 'S'], [6, 2, 17, 'Cl'], [7, 2, 18, 'Ar'],
  [0, 3, 19, 'K'], [1, 3, 20, 'Ca']
];
function ptCell(col, row, z, sym, hl) {
  var x = PX[col], y = PY[row];
  return '<rect x="' + x + '" y="' + y + '" width="26" height="24" rx="3" fill="' + (hl || 'none') + '" fill-opacity="' + (hl ? 0.28 : 0) + '" stroke="' + (hl || 'currentColor') + '" stroke-opacity="' + (hl ? 0.9 : 0.5) + '" stroke-width="1.3"/>' +
    '<text x="' + (x + 3.5) + '" y="' + (y + 9) + '" font-size="6.3" font-weight="700" fill="currentColor" fill-opacity="0.7">' + z + '</text>' +
    '<text x="' + (x + 13) + '" y="' + (y + 19.5) + '" text-anchor="middle" font-size="10.5" font-weight="800" fill="currentColor">' + sym + '</text>';
}
function legendSq(x, y, color, label) {
  return '<rect x="' + x + '" y="' + (y - 8) + '" width="11" height="11" rx="2" fill="' + color + '" fill-opacity="0.4" stroke="' + color + '" stroke-width="1.3"/>' + tx(x + 16, y + 1, label, 9.5, 'currentColor', 'start');
}
function periodicTable(mode) {
  var inner = '';
  var famHL: { [k: string]: string } = { Li: C_FAM, Na: C_FAM, K: C_FAM, He: C_NOB, Ne: C_NOB, Ar: C_NOB };
  var metals: { [k: string]: number } = { Li: 1, Be: 1, Na: 1, Mg: 1, Al: 1, K: 1, Ca: 1 };
  var metalloids: { [k: string]: number } = { B: 1, Si: 1 };
  ELS.forEach(function (e) {
    var hl = null as any;
    if (mode === 'family') { hl = famHL[e[3]] || null; }
    else if (mode === 'metal') { hl = metals[e[3]] ? C_MET : (metalloids[e[3]] ? C_MLD : C_NON); }
    inner += ptCell(e[0], e[1], e[2], e[3], hl);
  });
  if (mode === 'order') {
    inner += tx(150, 136, '照「原子序」由小到大排：1 → 2 → 3 → …（左上角小數字）', 9.5, C_MET);
  } else if (mode === 'family') {
    inner += legendSq(44, 134, C_FAM, '鹼金屬（活潑）') + legendSq(176, 134, C_NOB, '惰性氣體（安定）');
  } else if (mode === 'metal') {
    inner += legendSq(20, 134, C_MET, '金屬') + legendSq(96, 134, C_MLD, '類金屬') + legendSq(190, 134, C_NON, '非金屬');
  }
  return svg('300 144', inner, mode === 'order' ? '迷你週期表，前20個元素依原子序由小到大排列，每格左上角是原子序' : (mode === 'family' ? '迷你週期表，高亮最左直行的鹼金屬鋰鈉鉀都活潑、最右直行的惰性氣體氦氖氬都安定，同族性質相似' : '迷你週期表，金屬在左邊塗藍、非金屬在右上塗橘、交界的硼矽是類金屬塗灰'));
}
// 常見元素符號：放回週期表座位（看出位置／金屬非金屬），再看它們組成什麼常見物質。
function elementCards() {
  var inner = '';
  inner += tx(150, 14, '這幾個元素住在表上哪、會組成什麼？', 11);
  // 迷你週期表，高亮 5 個常見元素（各給可辨識的高亮色）
  var hlmap: { [k: string]: string } = { H: '#0891b2', C: C_NOB, O: C_OX, Na: C_NA, Cl: C_CL };
  ELS.forEach(function (e) {
    inner += ptCell(e[0], e[1], e[2], e[3], hlmap[e[3]] || null);
  });
  // 位置／角色提示
  inner += tx(150, 140, '這 5 個裡只有 Na（鈉）是金屬，H O C Cl 都是非金屬', 9.5, C_MLD);
  inner += tx(150, 160, '認得它們，就能看懂常見物質的化學式：', 10);
  // 組合 1：2H ＋ O → 水（兩個非金屬共用電子）
  inner += atom(30, 180, 'H', C_HY, '#333', 10) + tx(50, 184, '＋', 12) + atom(68, 180, 'H', C_HY, '#333', 10) +
    tx(88, 184, '＋', 12) + atom(106, 180, 'O', C_OX, '#fff', 13) + aR(124, 180, 20, C_GRN, 3) + box(150, 168, 58, 24, C_GRN, '水 H₂O');
  // 組合 2：Na ＋ Cl → 食鹽（金屬給、非金屬收）
  inner += atom(30, 206, 'Na', C_NA, '#333', 11) + tx(54, 210, '＋', 12) + atom(74, 206, 'Cl', C_CL, '#fff', 11) +
    aR(94, 206, 20, C_GRN, 3) + box(120, 194, 72, 24, C_GRN, '食鹽 NaCl');
  return svg('300 224', inner, '把 H、C、O、Na、Cl 放回迷你週期表的座位：其中只有 Na 是金屬，其餘是非金屬；再把它們組合起來，兩個氫加一個氧共用電子組成水 H2O，鈉和氯一給一收組成食鹽 NaCl');
}

/* =================== 課2：原子結構與離子鍵／共價鍵 =================== */
// 原子結構：原子核（質子＋中子）＋電子殼層。highlightOuter=true 時高亮最外層。
function atomStruct(highlightOuter) {
  var cx = 150, cy = 72, inner = '';
  // 殼層圈
  inner += '<circle cx="' + cx + '" cy="' + cy + '" r="26" fill="none" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.4" stroke-dasharray="4 3"/>';
  inner += '<circle cx="' + cx + '" cy="' + cy + '" r="50" fill="none" stroke="' + (highlightOuter ? C_FAM : 'currentColor') + '" stroke-opacity="' + (highlightOuter ? 0.85 : 0.3) + '" stroke-width="' + (highlightOuter ? 2.4 : 1.4) + '" stroke-dasharray="4 3"/>';
  // 原子核
  inner += '<circle cx="' + cx + '" cy="' + cy + '" r="14" fill="' + C_OX + '" fill-opacity="0.2" stroke="' + C_OX + '" stroke-width="1.6"/>';
  // 核內標示 6＋（6 個質子），與外圍畫出的 6 個電子（內層2＋外層4）一樣多 → 原子不帶電（避免質子數與電子數不一致的矛盾）。
  inner += '<text x="' + cx + '" y="' + (cy + 4) + '" text-anchor="middle" font-size="12" font-weight="800" fill="' + C_OX + '">6＋</text>';
  // 內層電子（2）
  var dim = highlightOuter ? 'opacity="0.4"' : '';
  inner += '<g ' + dim + '>' + edot(cx, cy - 26) + edot(cx, cy + 26) + '</g>';
  // 外層電子（4）
  var oc = highlightOuter ? C_FAM : C_E;
  inner += edot(cx + 50, cy, oc) + edot(cx - 50, cy, oc) + edot(cx, cy - 50, oc) + edot(cx, cy + 50, oc);
  // 標示
  if (highlightOuter) {
    inner += aL(cx + 62, cy, 0, C_FAM) + tx(cx + 66, cy - 4, '最外層電子', 10, C_FAM, 'start') + tx(cx + 66, cy + 10, '（價電子）', 10, C_FAM, 'start');
  } else {
    inner += tx(cx - 5, cy + 36, '原子核', 9, C_OX);
    inner += '<line x1="' + (cx + 50) + '" y1="' + cy + '" x2="' + (cx + 70) + '" y2="' + cy + '" stroke="' + C_E + '" stroke-width="1.4"/>' + tx(cx + 74, cy + 4, '電子', 10, C_E, 'start');
  }
  inner += tx(150, 142, highlightOuter ? '最外層電子決定它怎麼和別人結合' : '原子核（質子＋中子）＋外圍一層層的電子', 11);
  return svg('300 150', inner, highlightOuter ? '原子結構圖，高亮最外層的電子，說明最外層電子決定如何結合' : '原子結構圖，中間是原子核含質子和中子，外圍兩層殼層上有電子');
}
// 離子鍵：鈉給電子、氯收電子 → Na⁺、Cl⁻ 互相吸引。
function ionicBond() {
  var inner = '';
  inner += tx(150, 16, '金屬鈉「給」電子、非金屬氯「收」電子', 11);
  // 鈉（1 個外層電子）
  inner += atom(58, 54, 'Na', C_NA, '#333', 18) + edot(80, 54);
  inner += tx(58, 86, '鈉 Na', 10.5, 'currentColor');
  // 電子轉移箭頭
  inner += aR(90, 54, 56, C_E, 3) + tx(118, 44, 'e⁻', 10, C_E);
  // 氯（7 個外層電子，缺 1）
  inner += atom(176, 54, 'Cl', C_CL, '#fff', 18);
  var cdots = [[176, 32], [196, 40], [202, 54], [196, 70], [176, 76], [156, 68], [156, 40]];
  cdots.forEach(function (d) { inner += edot(d[0], d[1]); });
  inner += tx(176, 90, '氯 Cl', 10.5, 'currentColor');
  // 產物
  inner += '<circle cx="70" cy="122" r="18" fill="' + C_POS + '" fill-opacity="0.14" stroke="' + C_POS + '" stroke-width="1.6"/>' + tx(70, 127, 'Na⁺', 12, C_POS);
  inner += '<circle cx="176" cy="122" r="18" fill="' + C_NEG + '" fill-opacity="0.14" stroke="' + C_NEG + '" stroke-width="1.6"/>' + tx(176, 127, 'Cl⁻', 12, C_NEG);
  inner += aR(92, 122, 62, C_MLD, 2) + aL(158, 122, 62, C_MLD, 2);
  inner += tx(230, 118, '帶正電', 9.5, C_POS, 'start') + tx(230, 130, '＋帶負電', 9.5, C_NEG, 'start');
  inner += tx(150, 150, '一正一負互相吸引 ＝ 離子鍵（如食鹽 NaCl）', 11, C_GRN);
  return svg('300 158', inner, '鈉把一個電子給氯，鈉變成帶正電的鈉離子、氯變成帶負電的氯離子，一正一負互相吸引形成離子鍵就是食鹽');
}
// 共價鍵：兩個非金屬「共用」電子（水 H₂O）。
function covalentBond() {
  var inner = '';
  inner += tx(150, 16, '兩個非金屬「共用」電子', 11);
  // O 中間、兩個 H
  inner += atom(150, 60, 'O', C_OX, '#fff', 18);
  inner += atom(104, 104, 'H', C_HY, '#333', 14);
  inner += atom(196, 104, 'H', C_HY, '#333', 14);
  // 共用電子對（鍵上各兩顆）
  inner += bond(150, 60, 104, 104) + bond(150, 60, 196, 104);
  inner += edot(122, 78) + edot(132, 90) + edot(178, 78) + edot(168, 90);
  inner += tx(150, 94, '水 H₂O', 12, 'currentColor');
  inner += tx(150, 134, '共用的電子把原子綁在一起 ＝ 共價鍵', 11, C_GRN);
  inner += tx(150, 150, 'H 和 O 都是非金屬，不給不收、改用「共用」', 10, 'currentColor');
  return svg('300 158', inner, '水分子裡氧和兩個氫之間各有一對共用的電子，共用電子把原子綁在一起就是共價鍵');
}

/* =================== 課3：化學式與配平 =================== */
// 下標讀法（static）。
function subscriptRead() {
  var inner = '';
  inner += '<text x="150" y="54" text-anchor="middle" font-size="44" font-weight="800" fill="currentColor">H₂O</text>';
  inner += aD(118, 60, 14, C_MET, 2.5) + tx(118, 90, '下標 2', 10.5, C_MET) + tx(118, 103, '＝ 2 個 H', 10, C_MET);
  inner += aD(186, 60, 14, C_NON, 2.5) + tx(186, 90, 'O 沒數字', 10.5, C_NON) + tx(186, 103, '＝ 1 個 O', 10, C_NON);
  inner += tx(150, 20, '右下角的小數字 ＝ 原子個數', 11.5);
  return svg('300 112', inner, '化學式 H2O，H 右下的下標 2 代表 2 個氫原子，O 沒寫數字代表 1 個氧原子');
}
// 係數 vs 下標（stepped）。
function coeffVsSub() {
  var inner = '';
  inner += tx(150, 18, '配平只能改前面的「係數」，不能動「下標」', 10.5);
  inner += '<text x="150" y="68" text-anchor="middle" font-size="46" font-weight="800" fill="currentColor">2H₂O</text>';
  // 係數
  inner += '<rect x="98" y="34" width="22" height="42" rx="5" fill="' + C_GRN + '" fill-opacity="0.14" stroke="' + C_GRN + '" stroke-width="1.6"/>';
  inner += aD(109, 86, 10, C_GRN, 2.5) + tx(109, 110, '係數 2', 10, C_GRN) + tx(109, 123, '可以改 ✓', 10, C_GRN);
  // 下標
  inner += '<rect x="150" y="46" width="20" height="30" rx="5" fill="' + C_OX + '" fill-opacity="0.12" stroke="' + C_OX + '" stroke-width="1.6"/>';
  inner += aD(160, 86, 10, C_OX, 2.5) + tx(200, 110, '下標 2（分子本身）', 10, C_OX) + tx(200, 123, '不可以改 ✗', 10, C_OX);
  return svg('300 132', inner, '2H₂O 裡前面的係數2可以改來配平，右下的下標2是分子本身的組成不能改');
}

/* =================== 課4：氧化還原入門 =================== */
// 鐵生鏽：鐵＋氧氣 → 氧化鐵（鏽）。
function rustScene() {
  var inner = '';
  inner += tx(150, 16, '氧化：得到氧（鐵生鏽、燃燒）', 11.5, C_OX);
  inner += box(26, 44, 54, 34, C_FE, '鐵');
  inner += tx(53, 92, '鐵 Fe', 10, 'currentColor');
  inner += tx(104, 54, '＋', 15);
  inner += '<circle cx="128" cy="48" r="11" fill="' + C_OX + '" fill-opacity="0.25" stroke="' + C_OX + '" stroke-width="1.6"/><text x="128" y="52" text-anchor="middle" font-size="10" font-weight="800" fill="currentColor">O₂</text>';
  inner += tx(128, 76, '氧氣', 10, C_OX);
  inner += aR(150, 60, 42, C_GRN, 4);
  inner += box(206, 44, 68, 34, C_RUST, '氧化鐵');
  inner += tx(240, 92, '鏽（Fe₂O₃）', 10, C_RUST);
  inner += tx(150, 118, '鐵和空氣中的氧結合 → 生成鏽，這就是「氧化」', 10.5);
  return svg('300 128', inner, '鐵加上空氣中的氧氣，結合生成氧化鐵也就是鐵鏽，鐵得到氧就是氧化');
}
// 還原：失去氧／得到電子（把氧奪回來）。
function reductionScene() {
  var inner = '';
  inner += tx(150, 16, '還原：失去氧（或得到電子）', 11.5, C_MET);
  inner += box(26, 44, 68, 34, C_RUST, '氧化鐵');
  inner += tx(60, 92, '鏽（Fe₂O₃）', 10, C_RUST);
  inner += aR(102, 60, 44, C_MET, 4) + tx(124, 50, '移走氧', 9.5, C_MET);
  inner += box(160, 44, 50, 34, C_FE, '鐵');
  inner += tx(185, 92, '鐵 Fe', 10, 'currentColor');
  inner += tx(238, 54, '＋', 15);
  inner += '<circle cx="266" cy="48" r="11" fill="' + C_OX + '" fill-opacity="0.25" stroke="' + C_OX + '" stroke-width="1.6"/><text x="266" y="52" text-anchor="middle" font-size="9" font-weight="800" fill="currentColor">O</text>';
  inner += tx(150, 118, '把氧從氧化鐵「移走」還原成鐵；得到電子也是還原', 10.5);
  return svg('300 128', inner, '把氧從氧化鐵移走，還原成純鐵，失去氧就是還原，得到電子也是還原');
}
// 一給一收：氧化與還原同時發生。
function redoxPair() {
  var inner = '';
  inner += tx(150, 16, '有人失電子，就有人得電子（成對發生）', 11);
  inner += '<circle cx="70" cy="66" r="22" fill="' + C_OX + '" fill-opacity="0.14" stroke="' + C_OX + '" stroke-width="1.8"/>' + tx(70, 62, '甲', 13, 'currentColor') + edot(70, 80);
  inner += '<circle cx="230" cy="66" r="22" fill="' + C_MET + '" fill-opacity="0.14" stroke="' + C_MET + '" stroke-width="1.8"/>' + tx(230, 71, '乙', 13, 'currentColor');
  inner += aR(96, 56, 108, C_E, 3) + tx(150, 46, '電子 e⁻', 10.5, C_E);
  inner += tx(70, 104, '失去電子', 10.5, C_OX) + tx(70, 118, '＝ 氧化', 11, C_OX);
  inner += tx(230, 104, '得到電子', 10.5, C_MET) + tx(230, 118, '＝ 還原', 11, C_MET);
  inner += tx(150, 142, '氧化和還原一定同時發生，少不了對方', 11, C_GRN);
  return svg('300 150', inner, '甲把電子交給乙，甲失去電子是氧化、乙得到電子是還原，兩者同時成對發生');
}
// 生活裡的氧化還原：把「得到氧／失電子」套到生鏽與燃燒（看出誰得到氧）。
function redoxLife() {
  var inner = '';
  inner += tx(150, 15, '生活裡的氧化：東西「得到氧」', 11.5);
  // 第 1 列：生鏽（鐵 ＋ 氧 → 鏽）
  inner += tx(26, 51, '生鏽', 10, C_RUST);
  inner += box(50, 36, 44, 28, C_FE) + tx(72, 55, '鐵', 12);
  inner += tx(104, 55, '＋', 13);
  inner += '<circle cx="126" cy="50" r="11" fill="' + C_OX + '" fill-opacity="0.25" stroke="' + C_OX + '" stroke-width="1.6"/><text x="126" y="54" text-anchor="middle" font-size="9" font-weight="800" fill="currentColor">O₂</text>';
  inner += aR(142, 50, 30, C_GRN, 4) + tx(157, 42, '得到氧', 8, C_GRN);
  inner += box(180, 36, 74, 28, C_RUST) + tx(217, 55, '鏽 Fe₂O₃', 10);
  // 第 2 列：燃燒（木柴（碳）＋ 氧 → CO₂ ＋ 熱光）
  inner += tx(26, 103, '燃燒', 10, C_NON);
  inner += box(50, 88, 44, 28, C_CB) + tx(72, 107, '木柴', 11);
  inner += tx(104, 107, '＋', 13);
  inner += '<circle cx="126" cy="102" r="11" fill="' + C_OX + '" fill-opacity="0.25" stroke="' + C_OX + '" stroke-width="1.6"/><text x="126" y="106" text-anchor="middle" font-size="9" font-weight="800" fill="currentColor">O₂</text>';
  inner += aR(142, 102, 30, C_GRN, 4) + tx(157, 94, '得到氧', 8, C_GRN);
  inner += box(180, 88, 74, 28, C_NON) + tx(217, 107, 'CO₂＋熱光', 9.5);
  // 結論：得到氧＝氧化，同時氧得電子＝還原
  inner += tx(150, 138, '都是「得到氧」＝被氧化（同時氧得到電子＝還原）', 9.5);
  inner += tx(150, 152, '電池也靠這種氧化還原反應放出電', 9.5, C_MLD);
  return svg('300 160', inner, '生鏽是鐵加氧氣變成鏽、燃燒是木柴（碳）加氧氣變成二氧化碳和熱光，兩個都是得到氧也就是被氧化，同時氧得到電子就是還原；電池也靠氧化還原放電');
}

/* =================== 課5：莫耳與基本計量 =================== */
// 一打＝12 的類比。
function dozenMole() {
  var inner = '';
  inner += tx(150, 16, '就像「一打＝12 個」，用一個固定的量來數', 10.5);
  // 一打蛋
  inner += '<rect x="24" y="34" width="110" height="40" rx="8" fill="' + C_FAM + '" fill-opacity="0.12" stroke="' + C_FAM + '" stroke-width="1.6"/>';
  for (var i = 0; i < 12; i++) { inner += '<text x="' + (34 + (i % 6) * 17) + '" y="' + (52 + Math.floor(i / 6) * 17) + '" font-size="13">🥚</text>'; }
  inner += tx(79, 90, '1 打 ＝ 12 個', 11, C_FAM);
  inner += aR(140, 54, 22, C_MLD, 3);
  // 一莫耳
  inner += '<rect x="172" y="34" width="104" height="40" rx="8" fill="' + C_MET + '" fill-opacity="0.12" stroke="' + C_MET + '" stroke-width="1.6"/>';
  inner += tx(224, 58, '一大堆粒子', 12, C_MET);
  inner += tx(224, 90, '1 莫耳 ＝ 固定一大包', 10.5, C_MET);
  inner += tx(150, 118, '原子太小、數目太多，所以用「莫耳」一包一包數', 10.5);
  return svg('300 128', inner, '一打等於12個蛋，類比一莫耳等於固定一大包粒子，用來方便計數很小很多的原子');
}
// 亞佛加厥數。
function avogadro() {
  var inner = '';
  inner += tx(150, 18, '1 莫耳 ＝ 固定的粒子數', 12);
  // 一堆小點
  var cols = [C_MET, C_OX, C_GRN, C_NOB, C_FAM];
  for (var r = 0; r < 4; r++) for (var c = 0; c < 14; c++) { inner += '<circle cx="' + (26 + c * 18) + '" cy="' + (40 + r * 15) + '" r="4" fill="' + cols[(r + c) % 5] + '" fill-opacity="0.75"/>'; }
  inner += '<rect x="60" y="104" width="180" height="30" rx="8" fill="' + C_MET + '" fill-opacity="0.12" stroke="' + C_MET + '" stroke-width="1.6"/>';
  inner += tx(150, 124, '約 6×10²³ 個（亞佛加厥數）', 13, C_MET);
  return svg('300 146', inner, '一莫耳等於固定一大堆粒子，數量約是6乘10的23次方個，稱為亞佛加厥數');
}
// 水莫耳質量＝18 克（static）。
function waterMolarMass() {
  var inner = '';
  inner += tx(150, 16, '莫耳質量（克）＝ 分子量的數值', 11);
  inner += bond(150, 46, 118, 62) + bond(150, 46, 182, 62) + atom(150, 46, 'O', C_OX, '#fff', 15) + atom(118, 62, 'H', C_HY, '#333', 12) + atom(182, 62, 'H', C_HY, '#333', 12);
  inner += tx(150, 92, '水 H₂O', 12.5);
  inner += tx(60, 116, 'H：1', 11, 'currentColor') + tx(118, 116, 'H：1', 11, 'currentColor') + tx(176, 116, 'O：16', 11, C_OX);
  inner += tx(240, 116, '＝ 18', 12, C_GRN, 'start');
  inner += '<rect x="56" y="128" width="188" height="26" rx="8" fill="' + C_GRN + '" fill-opacity="0.12" stroke="' + C_GRN + '" stroke-width="1.6"/>';
  inner += tx(150, 146, '分子量 18 → 1 莫耳水 ＝ 18 克', 11.5, C_GRN);
  return svg('300 162', inner, '水分子由兩個氫原子量各1和一個氧原子量16組成，分子量是18，所以1莫耳水等於18克');
}
// 莫耳↔質量換算。
function molConvert() {
  var inner = '';
  inner += tx(150, 18, '質量 ＝ 莫耳數 × 莫耳質量', 12, C_MET);
  inner += box(26, 40, 60, 30, C_MET, '2 莫耳');
  inner += tx(104, 60, '×', 15);
  inner += box(120, 40, 72, 30, C_FAM, '18 克/莫耳');
  inner += aR(200, 55, 24, C_GRN, 3);
  inner += box(232, 40, 46, 30, C_GRN, '36 克');
  inner += tx(150, 96, '例：2 莫耳的水 ＝ 2 × 18 ＝ 36 克', 11);
  inner += tx(150, 116, '知道莫耳數和莫耳質量，就能算出有幾克', 10.5);
  return svg('300 128', inner, '質量等於莫耳數乘莫耳質量，例如2莫耳水乘每莫耳18克等於36克');
}

// reactionRebond mount（配平守恆動畫；離場呼叫 stop 收掉 rAF）。
function rebondMount(host) {
  var h = window.Anim && window.Anim.reactionRebond(host);
  return function () { if (h && h.stop) h.stop(); };
}
// reactionRate mount 工廠：每個 teach 步驟掛「一個」factor 的粒子碰撞／速率模型
// （temp／conc／surface／catalyst），離場呼叫 stop 收掉 rAF。
function rateMount(factor, label) {
  return function (host) {
    var h = window.Anim && window.Anim.reactionRate(host, { factor: factor, label: label });
    return function () { if (h && h.stop) h.stop(); };
  };
}

/* =================== 課8：有機化合物入門（碳的世界） =================== */
var C_ORG = '#059669';   // 有機 emerald
// 碳的四根手：一個碳原子有 4 個可結合的鍵（四個方向伸出，末端畫空「手」）。
function carbonFourBonds() {
  var cx = 150, cy = 80, inner = '';
  inner += tx(150, 16, '一個碳原子有 4 個可以牽手的「鍵」', 11);
  var ends = [[108, 46], [192, 46], [108, 114], [192, 114]];
  ends.forEach(function (e, i) {
    inner += bond(cx, cy, e[0], e[1]);
    inner += '<circle cx="' + e[0] + '" cy="' + e[1] + '" r="9" fill="' + C_ORG + '" fill-opacity="0.18" stroke="' + C_ORG + '" stroke-width="1.6" stroke-dasharray="3 2"/>';
    inner += tx(e[0], e[1] + 4, String(i + 1), 10, C_ORG);
  });
  inner += atom(cx, cy, 'C', C_CB, '#fff', 20);
  inner += tx(150, 146, '四根手可以各牽一個原子，所以碳很會「連東西」', 10.5, C_ORG);
  return svg('300 158', inner, '一個碳原子向四個方向伸出四個鍵，就像四根手，每根手都可以牽住一個別的原子');
}
// 接氫成甲烷 CH₄。
function methaneMol() {
  var cx = 150, cy = 78, inner = '';
  inner += tx(150, 16, '四根手各牽一個氫 → 甲烷 CH₄', 11);
  var hs = [[108, 44], [192, 44], [108, 112], [192, 112]];
  hs.forEach(function (h) { inner += bond(cx, cy, h[0], h[1]); });
  hs.forEach(function (h) { inner += atom(h[0], h[1], 'H', C_HY, '#333', 13); });
  inner += atom(cx, cy, 'C', C_CB, '#fff', 20);
  inner += tx(150, 142, '甲烷 CH₄ 是最簡單的有機物（天然氣的主成分）', 10.5, C_ORG);
  return svg('300 154', inner, '一個碳原子的四個鍵各牽一個氫原子，組成甲烷 CH4，是最簡單的有機化合物');
}
// 連成長鏈與環：碳一個接一個，造就有機物的多樣性。
function carbonChains() {
  var inner = '';
  inner += tx(150, 16, '碳能一個接一個，連成長鏈或環', 11);
  var cy1 = 56, xs = [50, 92, 134, 176];
  for (var i = 0; i < xs.length - 1; i++) inner += bond(xs[i], cy1, xs[i + 1], cy1);
  xs.forEach(function (x) { inner += atom(x, cy1, 'C', C_CB, '#fff', 13); });
  inner += tx(224, cy1 + 4, '…長鏈', 10.5, C_ORG, 'start');
  var rc = [150, 114], rr = 28, ring = '', pts: Array<[number, number]> = [];
  for (var k = 0; k < 6; k++) { var a = Math.PI / 2 + k * Math.PI / 3; pts.push([rc[0] + rr * Math.cos(a), rc[1] - rr * Math.sin(a)]); }
  for (var k = 0; k < 6; k++) { var p = pts[k], q = pts[(k + 1) % 6]; ring += bond(p[0], p[1], q[0], q[1]); }
  pts.forEach(function (p) { ring += atom(p[0], p[1], 'C', C_CB, '#fff', 11); });
  inner += ring + tx(226, 118, '環狀', 10.5, C_ORG, 'start');
  inner += tx(150, 168, '連接方式千變萬化，所以有機物種類超級多', 10.5, C_ORG);
  return svg('300 180', inner, '碳原子可以一個接一個連成長鏈，也可以連成環狀，連接方式千變萬化，造就有機化合物種類非常多');
}
// 生活中的有機物 + 「大多數含碳」保守註記。
function organicExamples() {
  var inner = '';
  inner += tx(150, 15, '生活中常見的有機物（大多含碳）', 11);
  var cards: Array<[number, string, string]> = [[16, '甲烷 CH₄', '天然氣（管線瓦斯）'], [106, '乙醇（酒精）', '消毒、飲料'], [196, '乙酸（醋酸）', '醋的酸味']];
  cards.forEach(function (c) {
    inner += '<rect x="' + c[0] + '" y="30" width="88" height="46" rx="7" fill="' + C_ORG + '" fill-opacity="0.14" stroke="' + C_ORG + '" stroke-width="1.6"/>';
    inner += tx(c[0] + 44, 50, c[1], 10.5, 'currentColor') + tx(c[0] + 44, 68, c[2], 9, C_MLD);
  });
  inner += tx(150, 98, '身體、食物、燃料、塑膠……也大多是有機物', 10.5);
  inner += '<rect x="30" y="112" width="240" height="40" rx="8" fill="' + C_MLD + '" fill-opacity="0.1" stroke="' + C_MLD + '" stroke-width="1.4"/>';
  inner += tx(150, 128, '注意：有機物＝「大多數」含碳的化合物', 10, C_MLD);
  inner += tx(150, 143, '少數含碳物（如 CO₂、碳酸鹽）傳統上歸「無機」', 9.5, C_MLD);
  return svg('300 162', inner, '甲烷、乙醇酒精、乙酸醋酸都是常見有機物，身體食物燃料塑膠也大多是有機物；但有機物是指大多數含碳的化合物，少數像二氧化碳和碳酸鹽傳統上歸為無機');
}

/* =================== 課9：溶液與濃度 =================== */
var C_SUG = '#a16207';   // 糖（溶質）amber-brown
var C_WAT = '#0284c7';   // 水（溶劑）sky
// 溶液三要素：溶質溶在溶劑裡。
function solutionParts() {
  var inner = '';
  inner += tx(150, 15, '溶液 ＝ 溶質 溶解在 溶劑 裡', 11.5);
  inner += box(14, 34, 66, 38, C_SUG, '') + tx(47, 52, '糖', 13) + tx(47, 66, '溶質', 9, C_SUG);
  inner += tx(96, 57, '＋', 15);
  inner += box(112, 34, 66, 38, C_WAT, '') + tx(145, 52, '水', 13) + tx(145, 66, '溶劑', 9, C_WAT);
  inner += aR(184, 53, 24, C_GRN, 3);
  inner += box(216, 34, 70, 38, C_GRN, '') + tx(251, 52, '糖水', 12) + tx(251, 66, '溶液', 9, C_GRN);
  inner += '<path d="M110 92 L190 92 L182 150 L118 150 Z" fill="' + C_WAT + '" fill-opacity="0.14" stroke="' + C_WAT + '" stroke-width="1.8"/>';
  for (var i = 0; i < 10; i++) { inner += '<circle cx="' + (124 + (i % 5) * 13) + '" cy="' + (108 + Math.floor(i / 5) * 16) + '" r="3" fill="' + C_SUG + '"/>'; }
  inner += tx(150, 166, '被溶解的是溶質（糖），把它溶解的是溶劑（水）', 10, 'currentColor');
  return svg('300 178', inner, '糖是溶質、水是溶劑，溶解後變成糖水溶液；杯子裡糖粒溶散在水中');
}
// 濃度：同量水、糖越多越濃（粒子密度）。
function concBars() {
  var inner = '';
  inner += tx(150, 15, '溶質越多 → 越濃（濃度越高）', 11.5);
  var cups: Array<[number, number, string, string]> = [[72, 1, '1 匙糖', '淡'], [212, 3, '3 匙糖', '濃']];
  cups.forEach(function (cup) {
    var cx = cup[0] as number;
    inner += '<path d="M' + (cx - 30) + ' 42 L' + (cx + 30) + ' 42 L' + (cx + 24) + ' 108 L' + (cx - 24) + ' 108 Z" fill="' + C_WAT + '" fill-opacity="0.14" stroke="' + C_WAT + '" stroke-width="1.8"/>';
    var n = (cup[1] as number) * 6;
    for (var i = 0; i < n; i++) { inner += '<circle cx="' + (cx - 18 + (i % 6) * 7) + '" cy="' + (54 + Math.floor(i / 6) * 9) + '" r="2.6" fill="' + C_SUG + '"/>'; }
    inner += tx(cx, 124, cup[2] as string, 10.5, 'currentColor') + tx(cx, 140, cup[3] as string, 11, C_SUG);
  });
  inner += tx(150, 162, '水一樣多，糖越多的這杯粒子越密 ＝ 越濃', 10, C_GRN);
  return svg('300 174', inner, '兩杯一樣多的水，右邊加比較多糖，糖粒子比較密集所以比較濃；溶質越多濃度越高');
}
// 加水變稀、蒸發變濃（點密度代表濃度）。
function diluteConcentrate() {
  var inner = '';
  inner += tx(150, 14, '加水變稀、蒸發變濃（點越密＝越濃）', 10.5);
  function cup(cx, nDots, label, sub, col) {
    var s = '<path d="M' + (cx - 26) + ' 32 L' + (cx + 26) + ' 32 L' + (cx + 20) + ' 94 L' + (cx - 20) + ' 94 Z" fill="' + C_WAT + '" fill-opacity="0.12" stroke="' + C_WAT + '" stroke-width="1.7"/>';
    for (var i = 0; i < nDots; i++) { s += '<circle cx="' + (cx - 16 + (i % 5) * 8) + '" cy="' + (44 + Math.floor(i / 5) * 10) + '" r="2.6" fill="' + C_SUG + '"/>'; }
    return s + tx(cx, 110, label, 10.5, col) + tx(cx, 125, sub, 9, C_MLD);
  }
  inner += cup(52, 4, '加水→稀', '濃度變低', C_WAT);
  inner += cup(150, 10, '原本', '', 'currentColor');
  inner += cup(248, 20, '蒸發→濃', '濃度變高', C_SUG);
  inner += aL(96, 60, 16, C_WAT, 2.5) + aR(204, 60, 16, C_SUG, 2.5);
  inner += tx(150, 148, '溶質沒變，水變多就變稀、水變少就變濃', 10, C_GRN);
  return svg('300 160', inner, '三杯糖水：加水後糖粒變疏濃度變低（變稀），蒸發水分後糖粒變密濃度變高（變濃），溶質沒變只是水量改變');
}
// 質量百分濃度計算：溶質÷溶液×100%（分母用溶液總質量）。
function massPercent() {
  var inner = '';
  inner += tx(150, 15, '質量百分濃度 ＝ 溶質 ÷ 溶液 × 100%', 11);
  inner += box(14, 34, 68, 34, C_SUG, '') + tx(48, 50, '糖 20 克', 10) + tx(48, 63, '溶質', 8.5, C_SUG);
  inner += tx(94, 55, '＋', 14);
  inner += box(108, 34, 68, 34, C_WAT, '') + tx(142, 50, '水 80 克', 10) + tx(142, 63, '溶劑', 8.5, C_WAT);
  inner += aR(182, 51, 22, C_MLD, 2.5);
  inner += box(212, 34, 74, 34, C_GRN, '') + tx(249, 50, '糖水 100 克', 9.5) + tx(249, 63, '溶液', 8.5, C_GRN);
  inner += '<rect x="40" y="88" width="220" height="54" rx="9" fill="' + C_MET + '" fill-opacity="0.1" stroke="' + C_MET + '" stroke-width="1.6"/>';
  inner += tx(150, 110, '20 ÷ 100 × 100% ＝ 20%', 14, C_MET);
  inner += tx(150, 131, '（分母要用「溶液」100 克，不是只有水 80 克）', 9, C_MLD);
  return svg('300 154', inner, '20克糖加80克水組成100克糖水，質量百分濃度等於溶質20克除以溶液100克再乘100%等於20%；分母要用溶液總質量不是只有水');
}

/* =================== 課10：放熱與吸熱反應 =================== */
var C_HOT = '#ef4444';   // 熱／放熱 red
var C_COLD = '#3b82f6';  // 冷／吸熱 blue
// 溫度計：rise=true 水銀高（紅）、false 水銀低（藍）。
function thermo(x, rise) {
  var top = 36, bulbY = 118, s = '';
  s += '<rect x="' + (x - 5) + '" y="' + top + '" width="10" height="' + (bulbY - top) + '" rx="5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-opacity="0.6"/>';
  s += '<circle cx="' + x + '" cy="' + bulbY + '" r="10" fill="' + (rise ? C_HOT : C_COLD) + '" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.3"/>';
  var mTop = rise ? top + 10 : top + 48;
  s += '<rect x="' + (x - 3) + '" y="' + mTop + '" width="6" height="' + (bulbY - mTop) + '" fill="' + (rise ? C_HOT : C_COLD) + '"/>';
  return s;
}
// 放熱：反應向周圍放出熱、溫度計上升。
function exoScene() {
  var inner = '';
  inner += tx(150, 16, '放熱反應：放出熱，周圍變熱', 11.5, C_HOT);
  inner += thermo(44, true) + tx(44, 142, '周圍↑', 9.5, C_HOT);
  inner += box(110, 60, 80, 44, C_HOT, '反應');
  inner += aR(192, 72, 26, C_HOT, 3) + aR(192, 92, 26, C_HOT, 3) + aL(108, 72, 26, C_HOT, 3) + aL(108, 92, 26, C_HOT, 3);
  inner += tx(245, 82, '放出熱', 10, C_HOT, 'middle');
  inner += tx(150, 128, '暖暖包、燃燒、酸鹼中和都是放熱反應', 10.5);
  inner += tx(150, 146, '反應把能量以熱的形式釋出，周圍溫度上升', 10, 'currentColor');
  return svg('300 158', inner, '放熱反應示意：溫度計上升，反應盒向四周射出熱箭頭，周圍溫度上升；暖暖包、燃燒、酸鹼中和都是放熱反應');
}
// 吸熱：反應從周圍吸走熱、溫度計下降。
function endoScene() {
  var inner = '';
  inner += tx(150, 16, '吸熱反應：吸收熱，周圍變冷', 11.5, C_COLD);
  inner += thermo(44, false) + tx(44, 142, '周圍↓', 9.5, C_COLD);
  inner += box(110, 60, 80, 44, C_COLD, '反應');
  inner += aR(80, 72, 26, C_COLD, 3) + aR(80, 92, 26, C_COLD, 3) + aL(220, 72, 26, C_COLD, 3) + aL(220, 92, 26, C_COLD, 3);
  inner += tx(150, 128, '冷敷包、部分鹽類溶解是吸熱反應', 10.5);
  inner += tx(150, 146, '反應從周圍吸走熱，周圍溫度下降', 10, 'currentColor');
  return svg('300 158', inner, '吸熱反應示意：溫度計下降，熱從四周被吸進反應盒，周圍溫度下降；冷敷包、部分鹽類溶解是吸熱反應');
}
// 能量轉換守恆：化學能↔熱能，總量不變。
function energyTransform() {
  var inner = '';
  inner += tx(150, 16, '能量只是「換形式」，不會消失', 11.5);
  inner += box(28, 50, 90, 40, C_ORG, '化學能') + box(182, 50, 90, 40, C_HOT, '熱能');
  inner += aR(122, 62, 56, C_HOT, 3) + tx(150, 56, '放熱', 9, C_HOT);
  inner += aL(178, 80, 56, C_COLD, 3) + tx(150, 98, '吸熱', 9, C_COLD);
  inner += tx(150, 124, '放熱：化學能→熱能（放給周圍）', 10, C_HOT);
  inner += tx(150, 140, '吸熱：熱能→化學能（從周圍吸收）', 10, C_COLD);
  inner += tx(150, 158, '不管哪一種，能量總量都不變（能量守恆）', 10.5, C_GRN);
  return svg('300 170', inner, '化學能和熱能可以互相轉換：放熱是化學能變熱能放給周圍，吸熱是從周圍吸收熱能，能量總量不變');
}

window.CONCEPT = {
  progKey: 'chemistry_concepts_adv_v1', practiceHref: 'chemistry.html',
  lessons: [
   { id:'periodic', name:'週期表與元素家族', emoji:'🧪', color:'#0891b2', sub:'依原子序排、同一直行性質相似',
     done:'記得：週期表是元素的「座位表」——依原子序（質子數）由小到大排，同一直行（族）化學性質相似。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'元素照「原子序」排排站',svg:periodicTable('order'),text:'<b>週期表</b>是元素的「<b>座位表</b>」。每個元素都有一個<b>原子序</b>（＝原子裡<b>質子的數目</b>）。週期表就是<b>照原子序由小到大</b>排：氫（1）、氦（2）、鋰（3）……這樣排才會讓性質呈現<b>規律</b>。'},
      {type:'teach',kicker:'同一直行',title:'同一「族」化學性質相似',svg:periodicTable('family'),text:'週期表的<b>每一個直行叫一「族」</b>。同一族的元素<b>最外層電子數相同</b>，所以<b>化學性質很像</b>。例如最左邊的<b>鈉、鉀</b>（鹼金屬）都<b>很活潑</b>；最右邊的<b>惰性氣體</b>（氦、氖、氬）都<b>很安定、不太反應</b>。'},
      {type:'teach',kicker:'左右分區',title:'金屬在左、非金屬在右上',svg:periodicTable('metal'),text:'週期表大致分成兩大類：<b>金屬</b>（像鈉、鎂、鋁）在<b>左邊和中間</b>，大多會導電、有金屬光澤；<b>非金屬</b>（像碳、氧、氯）在<b>右上角</b>。交界附近的硼、矽性質介於中間，叫<b>類金屬</b>。'},
      {type:'teach',kicker:'認符號',title:'認得常見元素符號',svg:elementCards(),text:'每個元素都有自己的<b>符號</b>：<b>H</b>（氫）、<b>O</b>（氧）、<b>C</b>（碳）、<b>Na</b>（鈉）、<b>Cl</b>（氯）。符號第一個字母大寫、第二個字母小寫。認得符號，才看得懂化學式。'},
      {type:'quiz',kicker:'換你試試',title:'週期表是依什麼順序排列元素的？',options:['原子序（質子數）','筆畫','顏色','重量隨便排'],answer:0,why:'依原子序（質子數）由小到大排，才會呈現週期性的規律。',whyWrong:{1:'不是依中文筆畫排；是依原子序（質子數）。',2:'週期表不是依顏色排，是依原子序（質子數）由小到大。',3:'不是隨便排，是嚴格照原子序由小到大。'}},
      {type:'quiz',kicker:'換你試試',title:'鈉(Na)和鉀(K)在同一族，代表它們？',options:['化學性質相似','完全相同','毫無關係','是同一種元素'],answer:0,why:'同族元素最外層電子數相同，所以化學性質相似（鈉、鉀都很活潑）。',whyWrong:{1:'性質「相似」不等於「完全相同」，它們仍是不同元素。',2:'同族正是因為有關聯（性質相似），不是毫無關係。',3:'鈉和鉀是不同元素（原子序不同），只是同族性質相似。'}},
      {type:'quiz',kicker:'想一想',title:'元素符號 Na 代表哪一種元素？',options:['鈉','氮','鈣','鎂'],answer:0,why:'Na 是鈉（鈉的拉丁文 Natrium）。氮是 N、鈣是 Ca、鎂是 Mg。',whyWrong:{1:'氮的符號是 N，只有一個字母。',2:'鈣的符號是 Ca，不是 Na。',3:'鎂的符號是 Mg。'}}
     ]},
   { id:'bond', name:'原子結構與鍵結', emoji:'🔗', color:'#9333ea', sub:'最外層電子決定離子鍵或共價鍵',
     done:'記得：給／收電子 → 離子鍵（NaCl）；共用電子 → 共價鍵（H₂O）；關鍵都是最外層電子。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'原子的樣子：核＋電子',svg:atomStruct(false),text:'<b>原子</b>中間是<b>原子核</b>，由<b>質子</b>（帶正電）和<b>中子</b>（不帶電）組成；核的外圍有<b>一層層的電子</b>（帶負電）繞著。原子通常不帶電，因為質子和電子一樣多。'},
      {type:'teach',kicker:'關鍵在外層',title:'最外層電子決定怎麼結合',svg:atomStruct(true),text:'原子要和別人結合時，真正出力的是<b>最外層的電子</b>（又叫<b>價電子</b>）。原子都「想」讓最外層<b>湊滿、變穩定</b>，所以會去<b>給、收或共用</b>電子——這就是為什麼會形成不同的鍵。'},
      {type:'teach',kicker:'給與收',title:'離子鍵：一個給、一個收',svg:ionicBond(),text:'<b>金屬</b>（如鈉 Na）最外層電子少，容易<b>把電子給出去</b>，變成帶正電的<b>離子</b>（Na⁺）；<b>非金屬</b>（如氯 Cl）容易<b>收下電子</b>，變成帶負電的離子（Cl⁻）。一正一負<b>互相吸引</b>，就是<b>離子鍵</b>（食鹽 NaCl）。'},
      {type:'teach',kicker:'一起共用',title:'共價鍵：大家一起共用',svg:covalentBond(),text:'如果是<b>兩個非金屬</b>（都想收電子，誰也不給誰），它們就改成<b>共用</b>電子。被共用的電子把原子<b>綁在一起</b>，這就是<b>共價鍵</b>。<b>水 H₂O</b> 就是氧和兩個氫共用電子組成的。'},
      {type:'quiz',kicker:'換你試試',title:'食鹽 NaCl 的結合方式是？',options:['離子鍵（鈉給電子、氯收電子）','共價鍵','沒有鍵','磁力'],answer:0,why:'金屬鈉失去電子、非金屬氯得到電子，形成帶電離子互相吸引，就是離子鍵。',whyWrong:{1:'共價鍵是「共用」電子；NaCl 是一給一收，屬離子鍵。',2:'原子之間確實有鍵（離子鍵）才會結合在一起。',3:'NaCl 不是靠磁力結合，而是正負離子互相吸引的離子鍵。'}},
      {type:'quiz',kicker:'換你試試',title:'決定原子怎麼跟別人結合的，主要是？',options:['最外層的電子','中子數量','原子的顏色','原子的重量'],answer:0,why:'最外層（價）電子決定成鍵行為——給、收還是共用。',whyWrong:{1:'中子在原子核裡，不參與結合。',2:'原子沒有「顏色」這種決定成鍵的性質。',3:'原子的重量不決定成鍵；決定的是最外層（價）電子。'}},
      {type:'quiz',kicker:'想一想',title:'水 H₂O 裡，氫和氧之間是哪一種鍵？',options:['共價鍵（共用電子）','離子鍵','金屬鍵','完全沒有鍵'],answer:0,why:'氫和氧都是非金屬，彼此「共用」電子，所以是共價鍵。',whyWrong:{1:'離子鍵是金屬＋非金屬一給一收；H、O 都是非金屬，用共用。',2:'金屬鍵發生在金屬之間，水裡沒有金屬。',3:'氫和氧之間確實有鍵（共價鍵）才會組成水分子。'}}
     ]},
   { id:'balance', name:'化學式與配平', emoji:'⚖️', color:'#0ea5e9', sub:'下標＝原子數、配平＝兩邊一樣多',
     done:'記得：下標＝原子個數；配平是為了讓反應前後每種原子總數相等（質量守恆），只改係數不改下標。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'下標：告訴你有幾個原子',svg:subscriptRead(),text:'化學式<b>右下角的小數字（下標）</b>代表那種原子有<b>幾個</b>。<b>H₂O</b>：H 右下的 <b>2</b> ＝ 2 個氫；O 沒寫數字 ＝ <b>1 個</b>氧。沒寫數字就代表 1 個。'},
      {type:'teach',kicker:'看動畫',title:'反應式：箭頭左邊變右邊',svg:animCanvas(340,210,'化學反應動畫 2H₂＋O₂→2H₂O：箭頭左邊是反應物（兩個氫分子和一個氧分子），斷鍵後原子重新組合成箭頭右邊的生成物（兩個水分子）'),mount:rebondMount,text:'反應式用<b>箭頭「→」</b>表示變化：箭頭<b>左邊</b>是<b>反應物</b>（原本的東西），<b>右邊</b>是<b>生成物</b>（變出來的東西）。看動畫——兩個氫分子和一個氧分子<b>斷鍵</b>後，原子<b>重新組合</b>成右邊的兩個水分子。'},
      {type:'teach',kicker:'為什麼要配平',title:'配平：兩邊原子一樣多',svg:animCanvas(340,210,'化學反應動畫 2H₂＋O₂→2H₂O：頂端一直顯示原子總數 氫 H 共4個、氧 O 共2個，反應前後都一樣，原子沒有消失也沒有新生'),mount:rebondMount,text:'原子<b>不會消失、也不會新生</b>（質量守恆），所以反應前後<b>每種原子的總數必須相等</b>——這叫<b>配平</b>。看動畫頂端的讀數：全程都是<b>氫 4、氧 2</b>。左邊 2H₂＋O₂ 是 4 個 H、2 個 O；右邊 2H₂O 也是 4 個 H、2 個 O，<b>剛好一樣多</b>。'},
      {type:'teach',kicker:'怎麼配',title:'只改係數，不改下標',svg:coeffVsSub(),text:'配平時只能調整寫在<b>式子前面的大數字（係數）</b>，<b>不能</b>去改化學式<b>右下的下標</b>——因為改下標會變成<b>另一種物質</b>！例如把 H₂O 改成 H₂O₂ 就變雙氧水了。所以：<b>加係數 ✓、改下標 ✗</b>。'},
      {type:'quiz',kicker:'換你試試',title:'H₂O 這個化學式代表一個分子有幾個氫原子？',options:['2 個','1 個','3 個','0 個'],answer:0,why:'下標 2 寫在 H 右下，表示 2 個氫原子。',whyWrong:{1:'下標是 2，不是 1；1 個的話就不會寫下標。',2:'下標寫的是 2，不是 3。',3:'H₂O 裡有氫原子（下標 2），不是 0 個。'}},
      {type:'quiz',kicker:'換你試試',title:'配平化學反應式，是為了讓？',options:['反應前後每種原子數目相等','式子比較短','箭頭變漂亮','生成物變多'],answer:0,why:'原子不會消失也不會新生（質量守恆），兩邊同種原子數必須相等。',whyWrong:{1:'配平和式子長短無關，重點是原子守恆。',2:'配平和箭頭美觀無關，是為了讓反應前後原子數相等。',3:'配平不會「製造」更多生成物，只是讓兩邊原子相等。'}},
      {type:'quiz',kicker:'想一想',title:'下面哪一個反應式「有配平」（兩邊原子一樣多）？',options:['2H₂ ＋ O₂ → 2H₂O','H₂ ＋ O₂ → H₂O','2H₂ ＋ O₂ → H₂O','H₂ ＋ O₂ → 2H₂O'],answer:0,why:'2H₂＋O₂→2H₂O：左邊 4 個 H、2 個 O，右邊也是 4 個 H、2 個 O，完全相等。',whyWrong:{1:'氫兩邊都是 2 個，但右邊只有 1 個 O、左邊有 2 個 O，氧不相等，所以沒配平。',2:'左邊 2 個 O、右邊只有 1 個 O，氧不相等。',3:'右邊 4 個 H、左邊只有 2 個 H，氫不相等。'}}
     ]},
   { id:'redox', name:'氧化還原入門', emoji:'🔥', color:'#ea580c', sub:'得氧／失電子＝氧化，兩者成對發生',
     done:'記得：得到氧／失去電子＝氧化（生鏽、燃燒）；失去氧／得到電子＝還原；氧化和還原一定同時發生。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'氧化：得到氧',svg:rustScene(),text:'<b>氧化</b>最早的意思就是「<b>得到氧</b>」。<b>鐵生鏽</b>就是鐵和空氣中的<b>氧</b>慢慢結合，變成<b>氧化鐵</b>（鏽）；<b>燃燒</b>也是東西快速和氧結合、放出光和熱。用電子看，氧化＝<b>失去電子</b>。'},
      {type:'teach',kicker:'反過來',title:'還原：失去氧',svg:reductionScene(),text:'<b>還原</b>正好相反：<b>失去氧</b>（或<b>得到電子</b>）。例如把<b>氧化鐵</b>裡的氧<b>移走</b>，就能<b>還原</b>成純鐵——煉鐵就是這樣把鐵礦還原出來的。'},
      {type:'teach',kicker:'成雙成對',title:'氧化與還原同時發生',svg:redoxPair(),text:'電子不會憑空消失。<b>有一個物質失去電子（氧化），一定有另一個物質得到那些電子（還原）</b>。所以<b>氧化和還原永遠同時發生</b>、成對出現，合稱<b>氧化還原反應</b>。'},
      {type:'teach',kicker:'生活裡',title:'生鏽、燃燒、電池',svg:redoxLife(),text:'氧化還原在生活裡到處都是：<b>鐵生鏽</b>、<b>木柴燃燒</b>都是氧化；<b>電池</b>則是靠內部的氧化還原反應，把化學能變成<b>電</b>來用。'},
      {type:'quiz',kicker:'換你試試',title:'鐵生鏽屬於哪一種變化？',options:['氧化（鐵和氧結合）','還原','蒸發','融化'],answer:0,why:'鐵與空氣中的氧結合＝氧化，生成氧化鐵（鏽）。',whyWrong:{1:'還原是「失去氧」，和生鏽相反。',2:'蒸發是狀態改變，沒有新物質生成；生鏽有生成鏽。',3:'融化是狀態改變，沒有新物質；生鏽生成了新物質（鏽）。'}},
      {type:'quiz',kicker:'換你試試',title:'氧化和還原的關係是？',options:['一定同時發生','不可能一起發生','完全無關','只有金屬才有'],answer:0,why:'有物質失去電子（氧化）就有物質得到電子（還原），兩者成對發生。',whyWrong:{1:'剛好相反——它們一定一起發生，少不了對方。',2:'兩者緊密相關，是同一個反應的兩面。',3:'氧化還原不限金屬，許多非金屬反應（如燃燒）也是氧化還原。'}},
      {type:'quiz',kicker:'想一想',title:'從電子的角度看，「氧化」是指物質？',options:['失去電子','得到電子','得到中子','失去質子'],answer:0,why:'氧化＝失去電子（得到氧也是失去電子的一種情況）。',whyWrong:{1:'得到電子是「還原」，剛好相反。',2:'中子在原子核裡，氧化還原講的是電子的得失。',3:'氧化還原是電子的得失，不是質子；失去質子會變成別的元素。'}}
     ]},
   { id:'mole', name:'莫耳與基本計量', emoji:'🔢', color:'#2563eb', sub:'莫耳＝固定一大包粒子',
     done:'記得：1 莫耳＝固定一大包粒子（約 6×10²³ 個）；莫耳質量（克）的數值＝分子量（水 H₂O＝18）。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'用「莫耳」一包一包數',svg:dozenMole(),text:'原子和分子<b>又小又多</b>，一顆一顆數根本數不完。所以化學家用<b>莫耳</b>來數——就像買蛋用「<b>一打＝12 個</b>」一樣，<b>一莫耳＝固定的一大包</b>粒子，計算起來方便多了。'},
      {type:'teach',kicker:'一包有多少',title:'1 莫耳 ＝ 約 6×10²³ 個',svg:avogadro(),text:'<b>1 莫耳</b>到底是幾個？是一個固定的大數目：<b>約 6×10²³ 個</b>（寫全是 602,000,000,000,000,000,000,000），這個數叫<b>亞佛加厥數</b>。不管是哪種粒子，1 莫耳都是這麼多個。'},
      {type:'teach',kicker:'換成重量',title:'莫耳質量：1 莫耳有幾克',svg:waterMolarMass(),text:'<b>莫耳質量</b>是「1 莫耳物質的<b>克數</b>」，它的<b>數值剛好等於原子量／分子量</b>。例如水 <b>H₂O</b>：氫 1＋氫 1＋氧 16 ＝ 分子量 <b>18</b>，所以 <b>1 莫耳水 ＝ 18 克</b>。'},
      {type:'teach',kicker:'算算看',title:'用莫耳換算質量',svg:molConvert(),text:'有了莫耳質量，就能<b>把莫耳換成克</b>：<b>質量 ＝ 莫耳數 × 莫耳質量</b>。例如 <b>2 莫耳</b>的水 ＝ 2 × 18 ＝ <b>36 克</b>。反過來，36 克水也就是 2 莫耳。'},
      {type:'quiz',kicker:'換你試試',title:'化學家為什麼用「莫耳」來數粒子？',options:['原子太小太多，用固定一大包比較方便','莫耳比較好聽','莫耳是一種元素','可以讓反應變快'],answer:0,why:'就像「一打＝12」，莫耳是固定數量的粒子包，方便計量極小極多的原子分子。',whyWrong:{1:'這是為了計算方便，不是因為名字好聽。',2:'莫耳是「數量單位」，不是元素。',3:'莫耳只是計數單位，和反應快慢無關。'}},
      {type:'quiz',kicker:'換你試試',title:'水 H₂O 的分子量約 18，1 莫耳水大約是幾克？',options:['18 克','1 克','180 克','6 克'],answer:0,why:'莫耳質量（克）的數值等於分子量，所以 1 莫耳水約 18 克。',whyWrong:{1:'1 是一個氫原子的原子量，不是整個水分子。',2:'多了一個 0；分子量 18 對應 18 克，不是 180 克。',3:'6 不是水的分子量；H₂O＝1＋1＋16＝18，所以 1 莫耳約 18 克。'}},
      {type:'quiz',kicker:'想一想',title:'1 莫耳的任何物質，大約含有多少個粒子？',options:['約 6×10²³ 個','100 個','18 個','12 個'],answer:0,why:'1 莫耳就是亞佛加厥數，約 6×10²³ 個粒子。',whyWrong:{1:'100 太少了；1 莫耳約是 6×10²³ 個粒子。',2:'18 是水的分子量（克數），不是粒子數目。',3:'12 是「一打」的數目，別和莫耳搞混了。'}}
     ]},
   { id:'rate', name:'反應速率：快與慢', emoji:'⏱️', color:'#0d9488', sub:'碰撞越多越有力＝越快；溫度／濃度／表面積',
     done:'記得：化學反應要靠粒子互相碰撞，碰得越頻繁、越有力就越快。升高溫度、提高濃度、把固體磨碎（增加表面積）都讓有效碰撞變多、反應變快；反過來降溫（冰箱）就讓反應變慢。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'反應靠「碰撞」，溫度越高撞得越兇',svg:animCanvas(330,210,'反應速率碰撞模型動畫：左盒粒子動得慢、右盒高溫粒子動得快，右盒粒子互相碰撞的次數明顯比左盒多，示意溫度越高碰撞越頻繁反應越快'),mount:rateMount('temp','左盒低溫粒子慢、右盒高溫粒子快，右盒碰撞次數累加得更快，示意升溫讓碰撞更頻繁反應更快'),text:'化學反應要靠粒子<b>互相碰撞</b>才會發生；碰得<b>越頻繁、越用力（能量越高）</b>，反應就<b>越快</b>。<b>溫度升高</b>時，粒子<b>動得更快</b>，單位時間撞得<b>更多次、也更用力</b>，所以反應變快。看動畫——右邊的高溫盒，碰撞次數累加得比左邊快得多。反過來，把東西放進<b>冰箱降溫</b>，就是讓粒子變慢、碰撞變少，反應（包含食物變質）就<b>變慢</b>。'},
      {type:'teach',kicker:'擠得越密',title:'濃度越高，粒子越容易相撞',svg:animCanvas(330,210,'反應速率濃度模型動畫：左盒粒子少、右盒同樣大小但粒子多，右盒粒子彼此碰撞的機會明顯比左盒高，示意濃度越高碰撞越多反應越快'),mount:rateMount('conc','左盒粒子少、右盒同體積塞更多粒子，右盒碰撞次數累加更快，示意濃度越高碰撞越多反應越快'),text:'在<b>一樣大的空間</b>裡放<b>更多粒子</b>（也就是<b>濃度越高</b>，氣體則是<b>壓力越大</b>），粒子彼此<b>靠得更近、更容易相撞</b>，所以<b>碰撞次數變多、反應變快</b>。看動畫——右邊塞了比較多粒子的盒子，撞得明顯比左邊頻繁。'},
      {type:'teach',kicker:'切得越碎',title:'表面積越大，接觸面越多',svg:animCanvas(330,210,'反應速率表面積模型動畫：左邊一整塊固體只有外圈露在外面，右邊同樣體積切成許多小塊，露出的表面段數大幅增加，示意表面積越大可反應的接觸點越多反應越快'),mount:rateMount('surface','左邊整塊固體露出的表面少、右邊同體積切成小塊露出的表面大幅變多，示意表面積越大反應越快'),text:'<b>固體</b>反應時，只有<b>露在表面</b>的粒子能參加反應。把固體<b>磨碎或切成小塊</b>（<b>體積沒變</b>，但<b>表面積變大</b>），就露出<b>更多可反應的接觸面</b>，反應因此<b>變快</b>。看動畫——同樣多的固體，切成小塊後露出的表面段數大增。這就是為什麼<b>糖粉比方糖溶得快</b>、木屑比木塊容易燒。'},
      {type:'quiz',kicker:'換你試試',title:'把食物放進冰箱，為什麼比較不容易壞？',options:['低溫讓造成變質的化學反應和微生物活動都變慢','冰箱會把所有細菌永久殺光','低溫會讓食物變多','冰箱裡額外加了防腐劑'],answer:0,why:'降溫讓粒子碰撞變少、變慢，造成腐敗的化學與微生物作用速率都下降，所以食物比較不容易壞；冰箱只是把反應「調慢」，不是殺菌永久。',whyWrong:{1:'冰箱只是讓微生物變慢，不會把細菌全部殺光，更不是永久的。',2:'低溫不會讓食物變多，只是讓變質反應變慢。',3:'一般冰箱靠低溫保鮮，並沒有額外加防腐劑。'}},
      {type:'quiz',kicker:'換你試試',title:'同樣重量的糖，哪一種溶解（反應）得比較快？',options:['磨成糖粉的（表面積大）','一大顆完整的方糖','兩種一樣快','冰過的方糖'],answer:0,why:'磨成粉表面積大、和水的接觸面多，溶解（反應）速率比較快。',whyWrong:{1:'一大顆方糖表面積小、接觸面少，溶得比較慢。',2:'表面積不同，溶解速率就不同，不會一樣快。',3:'冰過（溫度低）反而溶得更慢，而且它仍是整顆方糖、表面積小。'}},
      {type:'quiz',kicker:'想一想',title:'為什麼粒子碰撞得越頻繁、越用力，反應就越快？',options:['反應本來就要靠有效碰撞才發生，有效碰撞越多就越快','碰撞其實會讓反應變慢','碰撞和反應快慢完全無關','碰撞會讓粒子消失不見'],answer:0,why:'反應必須靠粒子互相碰撞、而且要夠用力才會發生，所以有效碰撞越頻繁，反應速率就越快。',whyWrong:{1:'剛好相反，碰撞越多反應越快，不是變慢。',2:'碰撞次數正是決定反應快慢的關鍵，並非無關。',3:'碰撞是讓粒子重新組合成新物質，不是讓粒子消失。'}},
      {type:'quiz',kicker:'想一想',title:'升高溫度為什麼會加快反應？',options:['粒子動得更快，碰撞更頻繁也更用力','粒子會憑空變多','粒子會停下來不動','溫度和反應速率沒有關係'],answer:0,why:'溫度升高使粒子運動更快，單位時間內碰撞更多次、每次也更有力（能量更高），有效碰撞增加，反應就變快。',whyWrong:{1:'升溫不會讓粒子數量憑空變多，是讓它們動得更快。',2:'升溫讓粒子動得更快，不是停下來。',3:'溫度和反應速率關係很大，升溫通常加快反應。'}},
      {type:'quiz',kicker:'想一想',title:'其他條件相同時，提高反應物的濃度通常會讓反應？',options:['變快，因為粒子更密集、碰撞機會變多','變慢','完全不受影響','立刻停止'],answer:0,why:'濃度越高，一樣的空間裡粒子更密集，彼此碰撞的機會變多，反應速率因此變快。',whyWrong:{1:'濃度升高碰撞變多，反應會變快而不是變慢。',2:'濃度明顯影響碰撞頻率，不會完全沒影響。',3:'提高濃度是加快反應，不會讓反應停止。'}},
      {type:'quiz',kicker:'挑戰題',title:'下面哪一組做法「都會」加快反應速率？',options:['升高溫度、把固體磨碎、提高濃度','降低溫度、保持整塊不切、稀釋','冷凍、乾燥、密封','把溫度和濃度都降到最低'],answer:0,why:'升溫、磨碎（增加表面積）、提高濃度都讓有效碰撞變多，所以都會加快反應。',whyWrong:{1:'降溫、不切、稀釋都減少碰撞，是讓反應變慢。',2:'冷凍、乾燥、密封是用來把反應「調慢」保存食物的做法。',3:'把溫度和濃度降到最低會讓碰撞變少、反應變慢。'}}
     ]},
   { id:'rate_life', name:'催化劑與生活中的快慢', emoji:'🧫', color:'#db2777', sub:'催化劑加速但不被消耗；保存＝把速率調慢',
     done:'記得：催化劑能降低反應需要的「門檻」能量（活化能）、加快反應，但自己在反應前後數量不變、不被消耗，可以重複使用。生鏽、腐敗、發酵都是反應；保存食物就是用低溫、乾燥、密封把反應速率「調慢」。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'催化劑：開一條門檻比較低的路',svg:animCanvas(330,210,'催化劑活化能示意動畫：紅色高山代表沒有催化劑時反應要越過的高門檻，綠色矮山代表催化劑另外開的一條較低路徑，門檻變矮後更多粒子能翻過去反應變快，而催化劑在反應前後數量不變'),mount:rateMount('catalyst','紅色高山是沒有催化劑的高活化能門檻、綠色矮山是催化劑開的較低路徑，門檻變矮讓更多粒子翻過去反應變快，催化劑前後數量不變不被消耗'),text:'反應要發生，粒子得先越過一個<b>能量門檻</b>（叫<b>活化能</b>），就像翻過一座山。<b>催化劑</b>的本事，是幫反應<b>另外開一條「矮一點」的路</b>——把<b>活化能降低</b>，讓<b>更多粒子翻得過去</b>，反應就<b>變快</b>。重點是：催化劑<b>自己在反應前後數量不變、不會被消耗掉</b>，可以<b>重複使用</b>。看動畫——綠色的矮山比紅色高山好翻，但旁邊的催化劑數量從頭到尾一樣多。'},
      {type:'teach',kicker:'把反應調慢',title:'冷藏保鮮：用低溫讓變質變慢',svg:animCanvas(330,210,'反應速率溫度模型動畫：左盒代表冷藏低溫、粒子慢碰撞少，右盒代表常溫、粒子快碰撞多，示意降溫讓造成腐敗的反應變慢，所以食物放冰箱可以保存比較久'),mount:rateMount('temp','左盒代表冷藏低溫粒子慢碰撞少、右盒代表常溫粒子快碰撞多，示意降溫讓腐敗反應變慢所以能保鮮'),text:'<b>食物腐敗</b>是微生物和一些化學反應造成的，它們也遵守同樣的規則：<b>溫度越低越慢</b>。所以把食物<b>冷藏、冷凍</b>，就是用<b>低溫把反應速率「調慢」</b>，讓食物能放久一點。<b>注意</b>：冰箱不是把細菌<b>殺光</b>，只是讓它們<b>變慢</b>，拿出來回溫後還是會繼續變質。看動畫——代表冷藏的左盒（低溫）碰撞得比常溫的右盒少很多。'},
      {type:'teach',kicker:'隔絕就變慢',title:'生鏽、腐敗、發酵：少接觸就慢',svg:animCanvas(330,210,'反應速率濃度模型動畫：左盒反應物粒子少，代表乾燥密封後能接觸的水氣與氧氣很少；右盒粒子多，代表潮濕又通風，右盒碰撞多反應快，示意乾燥密封能把生鏽腐敗等反應調慢'),mount:rateMount('conc','左盒粒子少代表乾燥密封後可接觸的水氣氧氣很少、右盒粒子多代表潮濕通風，右盒碰撞多反應快，示意隔絕水和空氣能把反應調慢'),text:'<b>生鏽</b>是鐵和<b>水＋氧氣</b>慢慢發生的<b>氧化</b>反應（有<b>鹽</b>當電解質會更快）；<b>腐敗</b>是微生物作用；<b>發酵</b>則是我們<b>刻意</b>讓有益微生物工作（像優格、麵包）。想讓前兩種變慢，就把能參加反應的粒子<b>變少</b>：<b>乾燥、密封（隔絕空氣）、低溫</b>，都是減少<b>水和氧氣</b>的接觸。看動畫——乾燥密封後（左盒粒子少）碰撞變少，反應就慢下來。'},
      {type:'quiz',kicker:'換你試試',title:'關於「催化劑」，下列何者正確？',options:['能加快反應，但自己在反應前後不被消耗','反應後會全部被用光','會讓反應永遠停止','只是單純把溫度升高而已'],answer:0,why:'催化劑降低反應需要的活化能（門檻）、加快反應，本身在反應前後數量不變、不被消耗，可以重複使用。',whyWrong:{1:'催化劑不會被用光，反應前後數量不變，可重複使用。',2:'催化劑是加快反應，不是讓反應停止。',3:'催化劑是降低活化能、另闢路徑，不是靠升高溫度。'}},
      {type:'quiz',kicker:'換你試試',title:'為什麼鐵製品在又潮濕又有鹽分的海邊特別容易生鏽？',options:['水和鹽加速了鐵的氧化反應','海邊太熱使鐵融化','鹽會把鐵變成黃金','海風直接把鏽吹到鐵上'],answer:0,why:'生鏽是鐵的氧化，需要水和氧氣；鹽（電解質）會加速這個反應，所以海邊的鐵件鏽得特別快。',whyWrong:{1:'鐵的熔點很高，海邊的氣溫遠不足以讓鐵融化。',2:'鹽不會把鐵變成黃金，那不是化學反應能做到的。',3:'鏽是鐵自己氧化長出來的，不是被海風吹來的。'}},
      {type:'quiz',kicker:'想一想',title:'催化劑是「怎麼」讓反應變快的？',options:['降低反應要越過的活化能（門檻），讓更多粒子能反應','提高活化能、讓門檻更高','把反應物變不見','讓粒子停止碰撞'],answer:0,why:'催化劑提供一條活化能較低的路徑，門檻變低後有更多粒子能成功反應，所以反應變快。',whyWrong:{1:'催化劑是「降低」活化能，不是提高門檻。',2:'催化劑不會讓反應物消失，只是加快反應。',3:'催化劑讓更多碰撞變有效，而不是讓粒子停止碰撞。'}},
      {type:'quiz',kicker:'想一想',title:'關於「冷藏保鮮」，下列敘述何者正確？',options:['低溫讓造成腐敗的反應變慢，但沒有把微生物殺光','低溫會把所有微生物永久殺死','冷藏會讓食物永遠不壞','溫度和腐敗快慢沒有關係'],answer:0,why:'冷藏是用低溫把腐敗（化學與微生物）反應速率調慢，微生物只是變慢並沒有被殺光，回溫後仍會繼續繁殖。',whyWrong:{1:'低溫只是讓微生物變慢，並不會把它們永久殺死。',2:'冷藏只能延緩變質，食物放久了還是會壞。',3:'溫度越低腐敗越慢，兩者關係很大。'}},
      {type:'quiz',kicker:'想一想',title:'乾燥、密封、低溫這些保存食物的方法，共同的原理是？',options:['減少反應需要的條件，把變質反應的速率調慢','讓食物裡的養分變多','反而提高反應速率','靠高溫把食物煮熟殺菌'],answer:0,why:'乾燥減少水、密封隔絕氧氣、低溫降低溫度，都是減少反應所需的條件，把造成變質的反應速率調慢。',whyWrong:{1:'這些方法是保存食物，不會讓養分變多。',2:'它們是把反應「調慢」，不是提高速率。',3:'乾燥、密封、低溫靠的是減緩反應，不是加熱殺菌（那是另一種保存方法）。'}},
      {type:'quiz',kicker:'挑戰題',title:'優格、麵包、泡菜這類「發酵」食品，是怎麼來的？',options:['刻意讓有益的微生物在食物裡作用做出來的','完全沒有任何微生物參與','靠食物自己氧化生鏽做出來的','把食物冷凍到最低溫做出來的'],answer:0,why:'發酵是人們刻意利用有益微生物（像酵母、乳酸菌）的作用，做出好吃又能保存的食品。',whyWrong:{1:'發酵正是靠有益微生物作用，不是沒有微生物參與。',2:'生鏽是金屬氧化，和發酵食品無關。',3:'冷凍是用來把反應「調慢」保存食物，不是用來發酵。'}}
     ]},
   { id:'organic', name:'有機化合物入門', emoji:'🧬', color:'#059669', sub:'碳有四個鍵，連成千變萬化的有機物',
     done:'記得：碳原子能形成 4 個鍵，彼此連成長鏈或環，所以種類超多；「有機化合物」＝大多數含碳的化合物（甲烷、酒精、葡萄糖、塑膠），身體、食物、燃料也大多是有機物。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'碳有「四根手」',svg:carbonFourBonds(),text:'<b>碳原子</b>最特別的地方，是它可以同時形成<b>4 個鍵</b>——就像有<b>四根手</b>，每根手都能牽住一個別的原子。正因為能牽四個，碳才特別會「<b>連東西</b>」，組成各式各樣的分子。'},
      {type:'teach',kicker:'牽上氫',title:'接氫 → 甲烷 CH₄',svg:methaneMol(),text:'如果碳的四根手各牽一個<b>氫</b>，就組成<b>甲烷 CH₄</b>——這是<b>最簡單的有機化合物</b>，也是<b>天然氣（管線瓦斯）的主成分</b>。CH₄ 代表 1 個碳、4 個氫。'},
      {type:'teach',kicker:'連起來',title:'連成長鏈或環',svg:carbonChains(),text:'碳的手還能<b>彼此相連</b>：一個碳接一個碳，可以排成<b>長鏈</b>，也可以首尾相接成<b>環</b>。連接的方式<b>千變萬化</b>，所以含碳的<b>有機物種類超級多</b>，從瓦斯、酒精到塑膠、DNA 都是。'},
      {type:'teach',kicker:'認識它們',title:'生活中的有機物',svg:organicExamples(),text:'生活裡常見的有機物：<b>甲烷</b>（天然氣的主成分）、<b>乙醇</b>（酒精）、<b>乙酸</b>（醋的酸味）、葡萄糖、塑膠……我們的<b>身體、食物、燃料</b>也大多是有機物。<b>要注意</b>：有機物是指「<b>大多數</b>」含碳的化合物；少數含碳物（像二氧化碳 CO₂、碳酸鹽）傳統上仍歸為<b>無機</b>。'},
      {type:'quiz',kicker:'換你試試',title:'碳原子為什麼能組成這麼多種化合物？',options:['能形成 4 個鍵、彼此連成長鏈或環','碳很重','碳會發光','碳有磁性'],answer:0,why:'碳可形成四個共價鍵並與自身相連成鏈／環，造就龐大的有機分子多樣性。',whyWrong:{1:'碳能組成多種化合物和重量無關，而是因為能形成四個鍵。',2:'碳不會發光；關鍵是它能形成四個鍵、連成鏈或環。',3:'碳沒有磁性這種特質；重點在四個鍵。'}},
      {type:'quiz',kicker:'換你試試',title:'下列何者是有機化合物的典型例子？',options:['甲烷 CH₄','食鹽 NaCl','鐵 Fe','氧氣 O₂'],answer:0,why:'甲烷是最簡單的碳氫化合物（有機物）；NaCl、Fe、O₂ 不是有機物。',whyWrong:{1:'食鹽 NaCl 不含碳，是無機物。',2:'鐵 Fe 是金屬元素，不是有機物。',3:'氧氣 O₂ 不含碳，不是有機物。'}},
      {type:'quiz',kicker:'想一想',title:'一個碳原子最多可以形成幾個鍵？',options:['4 個','1 個','2 個','8 個'],answer:0,why:'碳有四個可結合的鍵（像四根手），這是有機物多樣性的關鍵。',whyWrong:{1:'碳不是只能連 1 個；它最多能形成 4 個鍵。',2:'碳最多能形成 4 個鍵，不是 2 個。',3:'碳的鍵數是 4，不是 8。'}},
      {type:'quiz',kicker:'想一想',title:'大多數「有機化合物」都含有哪一種元素？',options:['碳','鐵','金','氦'],answer:0,why:'有機化合物＝大多數含碳的化合物，碳是它們共同的核心元素。',whyWrong:{1:'鐵是金屬元素，不是有機物的共同元素。',2:'金是金屬，不是有機物的核心；核心是碳。',3:'氦是惰性氣體，有機物的共同元素是碳。'}},
      {type:'quiz',kicker:'挑戰題',title:'下列關於有機物的敘述，何者正確？',options:['我們的身體、食物和燃料大多是有機物','有機物都不含碳','所有含碳的物質都一定是有機物','金屬像鐵、鋁都是有機物'],answer:0,why:'身體、食物、燃料大多由含碳的有機物組成，這也是「有機」最初和生物相關的由來。',whyWrong:{1:'剛好相反——有機物的共同點正是「含碳」。',2:'大多數含碳的是有機物，但少數含碳物（像二氧化碳、碳酸鹽）傳統上歸為無機，所以不是「一定」。',3:'金屬（鐵、鋁）不是有機物。'}},
      {type:'quiz',kicker:'挑戰題',title:'甲烷 CH₄ 中，一個碳原子連著幾個氫原子？',options:['4 個','1 個','2 個','6 個'],answer:0,why:'CH₄ 的下標 4 寫在 H 右下，表示 1 個碳連著 4 個氫，剛好用上碳的四個鍵。',whyWrong:{1:'下標是 4，不是 1。',2:'甲烷是 4 個氫，不是 2 個。',3:'CH₄ 是 4 個氫，不是 6 個。'}}
     ]},
   { id:'solution', name:'溶液與濃度', emoji:'🥤', color:'#0284c7', sub:'溶質＋溶劑＝溶液；溶質越多越濃',
     done:'記得：溶質溶在溶劑裡＝溶液（糖＝溶質、水＝溶劑）；溶質越多越濃，加溶劑變稀、蒸發變濃；質量百分濃度＝溶質質量÷溶液質量×100%。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'溶質、溶劑、溶液',svg:solutionParts(),text:'把糖加進水裡攪一攪，糖就「不見了」——其實是<b>溶解</b>到水裡。被溶解的（<b>糖</b>）叫<b>溶質</b>，把它溶解的（<b>水</b>）叫<b>溶劑</b>，兩者合起來的<b>糖水</b>就叫<b>溶液</b>。'},
      {type:'teach',kicker:'多與少',title:'濃度：溶質越多越濃',svg:concBars(),text:'<b>濃度</b>是指<b>溶質相對於溶液有多少</b>。同樣多的水，加<b>越多糖</b>，水裡的糖粒子<b>越密集</b>，糖水就<b>越濃</b>；加得少就<b>越淡</b>。不過溶解有<b>上限</b>——加到溶不下去（<b>飽和</b>）就不會再變濃了。'},
      {type:'teach',kicker:'變稀變濃',title:'加水變稀、蒸發變濃',svg:diluteConcentrate(),text:'溶質的量<b>沒有改變</b>時：<b>加入更多溶劑（水）</b>，溶質被攤得更開，濃度<b>下降 ＝ 變稀</b>；<b>蒸發掉一些溶劑</b>，剩下的溶質擠得更密，濃度<b>上升 ＝ 變濃</b>。'},
      {type:'teach',kicker:'算算看',title:'質量百分濃度',svg:massPercent(),text:'要用數字講清楚有多濃，可用<b>質量百分濃度</b>：<b>溶質質量 ÷ 溶液質量 × 100%</b>。例如 <b>20 克糖</b>溶在 <b>80 克水</b>裡，溶液共 <b>100 克</b>，濃度 ＝ 20 ÷ 100 × 100% ＝ <b>20%</b>。注意分母要用<b>溶液（100 克）</b>，不是只有水的 80 克。'},
      {type:'quiz',kicker:'換你試試',title:'把糖水加入更多白開水，糖水會變得？',options:['比較稀（濃度變低）','比較濃','濃度不變','變成固體'],answer:0,why:'溶劑變多、溶質不變，單位體積的溶質變少，濃度下降＝變稀。',whyWrong:{1:'加水會變稀而不是變濃；溶質沒增加，水卻變多了。',2:'加入更多水會改變濃度（變低），不會不變。',3:'加水是變稀的液體，不會變成固體。'}},
      {type:'quiz',kicker:'換你試試',title:'一杯糖水中，糖和水分別扮演？',options:['糖是溶質、水是溶劑','糖是溶劑、水是溶質','兩者都是溶劑','兩者都是溶質'],answer:0,why:'被溶解的（糖）是溶質，把它溶解的（水）是溶劑。',whyWrong:{1:'角色相反了——被溶解的糖才是溶質，水是溶劑。',2:'水是溶劑、糖是溶質，不是兩者都是溶劑。',3:'水是溶劑、糖是溶質，不是兩者都是溶質。'}},
      {type:'quiz',kicker:'想一想',title:'「濃度」指的是什麼？',options:['溶質相對於溶液有多少','溶液有多重','水有多燙','杯子有多大'],answer:0,why:'濃度描述的是溶質相對於溶液的多寡——溶質越多就越濃。',whyWrong:{1:'濃度不是看溶液多重，而是看溶質佔多少比例。',2:'水的溫度和濃度是兩回事。',3:'杯子大小不影響濃度，重點是溶質佔的比例。'}},
      {type:'quiz',kicker:'想一想',title:'質量百分濃度的算法是？',options:['溶質質量 ÷ 溶液質量 × 100%','溶劑質量 ÷ 溶質質量','溶質質量 × 溶劑質量','溶液質量 ÷ 溶質質量'],answer:0,why:'質量百分濃度＝溶質質量÷溶液質量×100%，分母是溶液（溶質＋溶劑）的總質量。',whyWrong:{1:'算反了，而且分母該用溶液總質量，不是溶質。',2:'濃度是「比例」（除法），不是把兩個質量相乘。',3:'分子分母顛倒了；應該是溶質÷溶液。'}},
      {type:'quiz',kicker:'挑戰題',title:'把 20 克糖完全溶在 80 克水裡，這杯糖水的質量百分濃度是多少？',options:['20%','25%','80%','100%'],answer:0,why:'溶液＝20＋80＝100 克，20 ÷ 100 × 100% ＝ 20%。',whyWrong:{1:'25% 是用 20÷80 算錯了——分母要用溶液總質量 100 克，不是溶劑 80 克。',2:'80 克是水（溶劑）的質量，不是濃度。',3:'100% 代表整杯都是糖、沒有水，不合理。'}},
      {type:'quiz',kicker:'挑戰題',title:'一杯糖水放在窗邊，水分慢慢蒸發掉一些，剩下的糖水會？',options:['變濃（濃度變高）','變稀','濃度不變','糖會不見'],answer:0,why:'溶質（糖）沒變、溶劑（水）變少，溶質擠得更密，濃度上升＝變濃。',whyWrong:{1:'蒸發是水變少，糖不變，會變濃而不是變稀。',2:'水減少、糖不變，濃度一定改變（升高）。',3:'蒸發跑掉的是水，糖留在杯子裡不會不見。'}}
     ]},
   { id:'thermo', name:'放熱與吸熱反應', emoji:'🌡️', color:'#ef4444', sub:'放熱＝周圍變熱、吸熱＝周圍變冷',
     done:'記得：放熱反應放出熱、周圍溫度上升（暖暖包、燃燒、酸鹼中和）；吸熱反應吸收熱、周圍溫度下降（冷敷包、部分鹽類溶解）；能量只是在化學能和熱能間轉換，總量不變。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'放熱：反應放出熱',svg:exoScene(),text:'有些反應進行時會<b>放出熱能</b>，使<b>周圍溫度上升</b>，這叫<b>放熱反應</b>。像<b>暖暖包</b>（裡面鐵粉的氧化）、<b>燃燒</b>、<b>酸鹼中和</b>都是——摸起來會<b>變熱</b>。'},
      {type:'teach',kicker:'反過來',title:'吸熱：反應吸收熱',svg:endoScene(),text:'另一些反應進行時會<b>從周圍吸收熱能</b>，使<b>周圍溫度下降</b>，這叫<b>吸熱反應</b>。像<b>冷敷包</b>、以及<b>部分鹽類溶解在水裡</b>，摸起來會<b>變冷</b>。'},
      {type:'teach',kicker:'能量不滅',title:'能量只是換形式',svg:energyTransform(),text:'不管放熱還是吸熱，<b>能量都沒有消失</b>，只是在<b>化學能</b>和<b>熱能</b>之間<b>轉換</b>：放熱是化學能變成熱能放給周圍，吸熱是從周圍吸收熱能存成化學能。<b>能量總量始終不變</b>（能量守恆）。'},
      {type:'quiz',kicker:'換你試試',title:'暖暖包會變熱，是因為裡面發生了？',options:['放熱反應（放出熱）','吸熱反應','蒸發','結冰'],answer:0,why:'暖暖包內的反應放出熱能，使周圍溫度上升。',whyWrong:{1:'吸熱會讓周圍變冷，和暖暖包變熱相反。',2:'蒸發是狀態改變且會吸熱，不是暖暖包變熱的原因。',3:'結冰是放熱沒錯但屬狀態改變，暖暖包是靠內部的放熱反應。'}},
      {type:'quiz',kicker:'換你試試',title:'某反應進行時，杯子摸起來「變冷」，代表這是？',options:['吸熱反應（從周圍吸走熱）','放熱反應','沒有反應','爆炸'],answer:0,why:'反應吸收周圍的熱能，使周圍（杯子）溫度下降＝吸熱反應。',whyWrong:{1:'放熱會讓杯子變熱，和「變冷」相反。',2:'摸起來變冷正是反應吸熱的現象，不是沒有反應。',3:'爆炸是劇烈的放熱，會變熱不是變冷。'}},
      {type:'quiz',kicker:'想一想',title:'放熱反應會讓周圍的溫度？',options:['上升','下降','不變','消失'],answer:0,why:'放熱反應釋出熱能給周圍，所以周圍溫度上升。',whyWrong:{1:'下降是吸熱反應的現象，和放熱相反。',2:'放熱會把熱給周圍，溫度會改變（上升），不會不變。',3:'溫度是一種量，不會「消失」；放熱是讓它上升。'}},
      {type:'quiz',kicker:'想一想',title:'吸熱反應會讓周圍的溫度？',options:['下降','上升','不變','翻倍'],answer:0,why:'吸熱反應從周圍吸走熱能，所以周圍溫度下降。',whyWrong:{1:'上升是放熱反應的現象，和吸熱相反。',2:'吸熱會把熱從周圍吸走，溫度會改變（下降），不會不變。',3:'溫度不會因為吸熱而「翻倍」，而是會下降。'}},
      {type:'quiz',kicker:'挑戰題',title:'下列何者是放熱反應（或放熱現象）的例子？',options:['燃燒木柴，放出光和熱','冷敷包讓周圍變冷','把水一直加熱才能煮沸','都不是放熱'],answer:0,why:'燃燒會放出大量光和熱給周圍，是典型的放熱反應。',whyWrong:{1:'冷敷包是吸熱（周圍變冷），不是放熱。',2:'煮沸需要「一直吸收」熱才能進行，屬於吸熱過程。',3:'燃燒就是放熱的例子，所以不是「都不是」。'}},
      {type:'quiz',kicker:'挑戰題',title:'關於放熱與吸熱反應中的能量，下列何者正確？',options:['能量只是在化學能和熱能間轉換，不會憑空消失','放熱反應會把能量消滅掉','吸熱反應會憑空創造出新的能量','能量會越反應越少，最後不見'],answer:0,why:'能量守恆——放熱是化學能轉成熱能、吸熱是熱能轉成化學能，總量始終不變。',whyWrong:{1:'能量不會被消滅，放熱只是把它以熱的形式放出。',2:'能量不會被憑空創造，吸熱是從周圍「吸來」熱能。',3:'能量不會越反應越少不見，它只是換形式、總量守恆。'}}
     ]}
  ]
};

})();
