/* =====================================================================
 * physics_concepts_advanced.ts  →  (tsc, tsconfig.legacy.json) →  physics_concepts_advanced.js
 * 「物理觀念養成・進階（國中）」teach-first 動畫觀念頁。補齊 physics.html（等級 5–14：
 *   運動定律、功能量、電路歐姆、壓力浮力、慣性）的「先學觀念」中學鷹架缺口。
 *   資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）＋ anim_core.js（window.Anim）。
 *   動畫課重用既有場景 window.Anim.circuitFlow / buoyancyFloat（不新增場景、不改 anim_core）；
 *   其餘 teach 步驟一律 stepped / static SVG（第 2、3 級 VIZ），零 text-only。
 *   以 IIFE 包住讓 SVG helper 為檔案區域（避免與其他已遷移頁同名頂層 helper 在 tsconfig.legacy
 *   共用全域型別檢查時 TS2393 衝突）。純本地進度（progKey），不餵主 XP。practiceHref＝physics.html。
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
// 右／左／上／下箭頭。
function aR(x, y, len, color, sw?) { var x2 = x + len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x2 + ',' + y + ' ' + (x2 - 9) + ',' + (y - 6) + ' ' + (x2 - 9) + ',' + (y + 6) + '" fill="' + color + '"/>'; }
function aL(x, y, len, color, sw?) { var x2 = x - len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x2 + ',' + y + ' ' + (x2 + 9) + ',' + (y - 6) + ' ' + (x2 + 9) + ',' + (y + 6) + '" fill="' + color + '"/>'; }
function aU(x, y, len, color, sw?) { var y2 = y - len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x + ',' + y2 + ' ' + (x - 6) + ',' + (y2 + 9) + ' ' + (x + 6) + ',' + (y2 + 9) + '" fill="' + color + '"/>'; }
function aD(x, y, len, color, sw?) { var y2 = y + len; return '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + (sw || 5) + '"/><polygon points="' + x + ',' + y2 + ' ' + (x - 6) + ',' + (y2 - 9) + ' ' + (x + 6) + ',' + (y2 - 9) + '" fill="' + color + '"/>'; }
// 方塊（質量／物體）。
function box(x, y, w, h, color, txt0?) {
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="' + color + '" fill-opacity="0.2" stroke="' + color + '" stroke-width="2.5"/>' +
    (txt0 ? '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + 5) + '" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">' + txt0 + '</text>' : '');
}
// 水平量條（加速度大小）。
function hbar(x, y, len, color, lab?) {
  return '<rect x="' + x + '" y="' + y + '" width="' + len + '" height="11" rx="3" fill="' + color + '"/>' +
    (lab ? tx(x + len + 5, y + 10, lab, 11, color, 'start') : '');
}
function vdiv(x, y1, y2) { return '<line x1="' + x + '" y1="' + y1 + '" x2="' + x + '" y2="' + y2 + '" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.5" stroke-dasharray="4 4"/>'; }

// ---- 色盤（亮暗雙主題皆清楚；結構文字用 currentColor＝--ink）----
var C_F = '#ea580c';   // 力 orange
var C_A = '#2563eb';   // 加速度 blue
var C_M = '#64748b';   // 質量／物體 slate
var C_W = '#16a34a';   // 功 green
var C_PE = '#9333ea';  // 位能 purple
var C_KE = '#e11d48';  // 動能 red
var C_V = '#e11d48';   // 電壓 red
var C_I = '#2563eb';   // 電流 blue
var C_R = '#f59e0b';   // 電阻 amber
var C_BUOY = '#16a34a';// 浮力 green
var C_FRIC = '#f59e0b';// 摩擦力 amber

/* =================== 課1：牛頓第二定律 F=ma =================== */
// ①力讓物體加速——加速度＝速度變化的快慢。
function accelConcept() {
  var inner = '';
  inner += tx(130, 16, '力讓物體加速：速度越變越快');
  inner += box(24, 42, 44, 30, C_M, '箱');
  inner += aR(70, 57, 46, C_F) + tx(93, 48, '力 F', 12, C_F);
  inner += '<line x1="20" y1="82" x2="240" y2="82" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.5"/>';
  inner += tx(40, 100, '1 秒後', 10.5, 'currentColor', 'end') + aR(46, 96, 30, C_A, 4);
  inner += tx(40, 120, '2 秒後', 10.5, 'currentColor', 'end') + aR(46, 116, 56, C_A, 4);
  inner += tx(40, 140, '3 秒後', 10.5, 'currentColor', 'end') + aR(46, 136, 82, C_A, 4);
  inner += tx(210, 118, '速度一直增加', 10.5, C_A);
  inner += tx(130, 156, '速度變化的快慢 ＝ 加速度', 12, C_A);
  return svg('260 164', inner, '一支力箭頭推箱子，箱子每過一秒速度就增加一截，速度變化的快慢就是加速度');
}
// ②同一物體：力越大→加速度越大（正比）。
function fmaForce() {
  var inner = '';
  inner += tx(76, 18, '力小', 12);
  inner += box(52, 36, 42, 28, C_M, '箱');
  inner += aR(96, 50, 22, C_F) + tx(107, 42, '力', 10.5, C_F);
  inner += hbar(44, 94, 32, C_A, '小');
  inner += tx(76, 128, '加速度小', 11);
  inner += vdiv(150, 24, 118);
  inner += tx(224, 18, '力大（兩倍）', 12);
  inner += box(200, 36, 42, 28, C_M, '箱');
  inner += aR(244, 44, 46, C_F) + aR(244, 58, 46, C_F) + tx(267, 36, '力＋力', 10.5, C_F);
  inner += hbar(192, 94, 68, C_A, '大');
  inner += tx(224, 128, '加速度大', 11);
  inner += tx(150, 152, '同一個箱子：力越大 → 加速度越大（正比）', 11.5);
  return svg('300 162', inner, '同一個箱子，左邊一支力配短加速度條，右邊兩支力（兩倍）配長加速度條，力越大加速度越大');
}
// ③同樣的力：質量越大→加速度越小（反比）。
function fmaMass() {
  var inner = '';
  inner += tx(78, 18, '質量小', 12);
  inner += box(56, 44, 30, 24, C_M, '小');
  inner += aR(88, 56, 42, C_F) + tx(109, 48, '力 F', 10.5, C_F);
  inner += hbar(44, 96, 78, C_A, '大');
  inner += tx(78, 130, '加速度大', 11);
  inner += vdiv(150, 24, 120);
  inner += tx(224, 18, '質量大', 12);
  inner += box(196, 36, 54, 44, C_M, '大');
  inner += aR(252, 56, 42, C_F) + tx(275, 48, '力 F', 10.5, C_F);
  inner += hbar(196, 96, 30, C_A, '小');
  inner += tx(224, 130, '加速度小', 11);
  inner += tx(150, 152, '力一樣大：質量越大 → 加速度越小（反比）', 11.5);
  return svg('300 162', inner, '同樣長度的力箭頭，推小箱子得到長加速度條、推大箱子得到短加速度條，質量越大加速度越小');
}
// ④牛頓的單位是「組」出來的：把 m 的單位(kg)乘 a 的單位(m/s²)拼出 N＝kg·m/s²。
function unitTable() {
  var inner = '';
  inner += tx(150, 15, '牛頓（N）的單位是怎麼「組」出來的？');
  // 第一層：F ＝ m × a（每個量的單位）
  inner += box(22, 28, 56, 44, C_M) + tx(50, 48, 'm', 13) + tx(50, 64, 'kg', 11, C_M);
  inner += tx(90, 55, '×', 16);
  inner += box(104, 28, 76, 44, C_A) + tx(142, 48, 'a', 13) + tx(142, 64, 'm/s²', 11, C_A);
  inner += tx(192, 55, '=', 16);
  inner += box(206, 28, 72, 44, C_F) + tx(242, 48, 'F', 13) + tx(242, 64, '力', 10, C_F);
  // 第二層：把單位相乘拼出來
  inner += tx(150, 94, '把單位相乘，就拼出力的單位：', 10, C_A);
  inner += box(26, 104, 46, 26, C_M) + tx(49, 121, 'kg', 12);
  inner += tx(80, 122, '×', 13);
  inner += box(92, 104, 58, 26, C_A) + tx(121, 121, 'm/s²', 11);
  inner += aR(154, 117, 22, C_W, 3);
  inner += box(182, 104, 96, 26, C_W) + tx(230, 121, 'kg·m/s²', 12);
  // 第三層：這一整包就叫牛頓
  inner += '<rect x="40" y="140" width="220" height="30" rx="8" fill="' + C_F + '" fill-opacity="0.12" stroke="' + C_F + '" stroke-width="1.6"/>';
  inner += tx(150, 159, 'kg·m/s² 這一整包 ＝ 1 牛頓（N）', 11.5, C_F);
  return svg('300 178', inner, '牛頓的單位是組出來的：力F等於質量m乘加速度a，把質量的單位公斤kg乘加速度的單位公尺每秒平方mps2，拼出kg乘m每s平方，這一整包就叫1牛頓N');
}

/* =================== 課2：功、功率與能量 =================== */
// ①W＝力×距離（頂牆不動＝沒做功）。
function workScene() {
  var inner = '';
  inner += tx(76, 18, '有出力 ＋ 有移動', 12, C_W);
  inner += '<rect x="38" y="54" width="40" height="28" rx="6" fill="none" stroke="' + C_M + '" stroke-width="2" stroke-dasharray="4 3" stroke-opacity="0.7"/>';
  inner += box(94, 54, 40, 28, C_M, '箱');
  inner += aR(50, 68, 40, C_F) + tx(70, 48, '力 F', 10.5, C_F);
  inner += '<line x1="58" y1="98" x2="114" y2="98" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/>';
  inner += tx(86, 110, '移動距離 d', 10, 'currentColor');
  inner += tx(76, 134, 'W ＝ 力 × 距離', 12, C_W);
  inner += vdiv(150, 24, 120);
  inner += tx(224, 18, '頂牆、沒移動', 12, C_KE);
  inner += '<rect x="256" y="40" width="12" height="70" fill="' + C_M + '" fill-opacity="0.4" stroke="' + C_M + '" stroke-width="2"/>' + tx(262, 124, '牆', 10, 'currentColor');
  inner += box(206, 60, 34, 26, C_M, '你');
  inner += aR(242, 73, 12, C_F) + tx(224, 50, '很用力', 10.5, C_F);
  inner += tx(224, 110, 'd ＝ 0', 11, C_KE);
  inner += tx(224, 134, 'W ＝ 0', 12, C_KE);
  inner += tx(150, 156, '出力又移動，才算做功', 12);
  return svg('300 164', inner, '左邊箱子被力推移動距離d做了功W等於力乘距離，右邊用力頂牆但牆沒移動距離是零所以做功等於零');
}
// ②功率＝做功的快慢 P＝功÷時間。
function powerScene() {
  var inner = '';
  inner += tx(150, 16, '同樣的功，做得快 → 功率大');
  // 兩人把同一箱書搬到同樣高度
  inner += tx(76, 36, '小明', 11, C_A);
  inner += box(58, 44, 36, 22, C_W, '書') + aU(76, 108, 40, C_A) + tx(76, 122, '3 秒', 11, C_A);
  inner += tx(76, 140, '功率大', 11.5, C_A);
  inner += vdiv(150, 30, 134);
  inner += tx(224, 36, '小華', 11, C_M);
  inner += box(206, 44, 36, 22, C_W, '書') + aU(224, 108, 40, C_M) + tx(224, 122, '6 秒', 11, C_M);
  inner += tx(224, 140, '功率小', 11.5, C_M);
  inner += tx(150, 158, 'P ＝ 功 ÷ 時間（功一樣，時間短＝功率大）', 11);
  return svg('300 166', inner, '小明和小華把同一箱書搬到同樣高度，功一樣多；小明花3秒功率大，小華花6秒功率小');
}
// ③能量守恆：位能↔動能（雲霄飛車）。
function energyCoaster() {
  var inner = '';
  inner += tx(150, 16, '能量只是轉換，總量不變');
  inner += '<path d="M24 48 Q 70 48 86 70 Q 120 120 150 128 Q 185 120 214 78 Q 232 54 276 54" fill="none" stroke="' + C_M + '" stroke-width="3" stroke-opacity="0.7"/>';
  // 高點（位能大）
  inner += '<circle cx="30" cy="44" r="8" fill="' + C_PE + '"/>';
  inner += tx(30, 90, '高點', 10.5, C_PE) + tx(30, 104, '位能大', 10.5, C_PE) + tx(30, 118, '動能小', 10.5, C_PE);
  // 低點（動能大）
  inner += '<circle cx="150" cy="124" r="7" fill="' + C_KE + '" fill-opacity="0.35" stroke="' + C_KE + '" stroke-width="1.5"/>';
  inner += tx(150, 150, '低點：動能大、位能小', 10.5, C_KE);
  // 升回高點
  inner += tx(258, 92, '升高', 10.5, C_PE) + tx(258, 106, '動能→位能', 10, C_PE);
  inner += tx(150, 166, '位能 ↔ 動能 互相轉換（雲霄飛車）', 11);
  return svg('300 174', inner, '雲霄飛車軌道，高點位能大動能小，低點動能大位能小，升回高處動能又變回位能，能量只是轉換總量不變');
}
// ④簡單機械：省力但不省功。
function machineScene() {
  var inner = '';
  inner += tx(150, 16, '槓桿：省力，但要移動更長的距離');
  // 支點三角形
  inner += '<polygon points="196,96 182,120 210,120" fill="' + C_M + '" fill-opacity="0.5" stroke="' + C_M + '" stroke-width="2"/>';
  // 槓桿橫桿
  inner += '<line x1="40" y1="96" x2="256" y2="96" stroke="currentColor" stroke-width="4"/>';
  // 施力端（長臂、小力、移動長）
  inner += aD(56, 56, 28, C_F) + tx(56, 48, '施力小', 10.5, C_F);
  inner += '<path d="M56 100 l0 22" stroke="' + C_F + '" stroke-width="1.5" stroke-dasharray="3 3"/>' + tx(56, 136, '移動長', 10, C_F);
  // 抗力端（短臂、大負載、移動短）
  inner += box(226, 70, 34, 24, C_W, '重');
  inner += aU(243, 68, 20, C_W) + tx(243, 48, '抬起大負載', 10.5, C_W);
  inner += tx(150, 162, '省力就要多走距離 → 功不變（省力不省功）', 11);
  return svg('300 170', inner, '槓桿支點靠近重物，施力端用小力但要往下移動很長，抗力端抬起大負載移動很短，省力卻不省功');
}

/* =================== 課3：歐姆定律與串並聯 =================== */
// 電路矩形外框（左邊電池、頂邊電阻、底邊電流）。
function ohmLaw() {
  var inner = '';
  inner += tx(150, 16, '電壓 V 推電流、電阻 R 擋電流');
  // 迴路（整體下移，讓鋸齒峰與頂端標題不互相壓到）
  inner += '<rect x="60" y="48" width="180" height="74" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="3"/>';
  // 電池（左邊，長短線）
  inner += '<line x1="50" y1="72" x2="70" y2="72" stroke="' + C_V + '" stroke-width="4"/><line x1="55" y1="82" x2="65" y2="82" stroke="' + C_V + '" stroke-width="7"/>';
  inner += '<line x1="50" y1="94" x2="70" y2="94" stroke="' + C_V + '" stroke-width="4"/><line x1="55" y1="104" x2="65" y2="104" stroke="' + C_V + '" stroke-width="7"/>';
  inner += tx(36, 90, '電壓 V', 10.5, C_V, 'end');
  // 電阻（頂邊鋸齒；標籤放鋸齒右側、避開中央標題）
  inner += '<polyline points="118,48 126,40 134,56 142,40 150,56 158,40 166,56 174,48" fill="none" stroke="' + C_R + '" stroke-width="3.5"/>';
  inner += tx(182, 42, '電阻 R', 10.5, C_R, 'start');
  // 電流（底邊箭頭）
  inner += aR(118, 122, 60, C_I) + tx(150, 138, '電流 I', 10.5, C_I);
  inner += '<rect x="196" y="140" width="80" height="28" rx="7" fill="' + C_A + '" fill-opacity="0.12" stroke="' + C_A + '" stroke-width="1.6"/>';
  inner += tx(236, 159, 'V ＝ I × R', 13, C_A);
  inner += tx(96, 154, '電壓越大電流越大；', 10, 'currentColor');
  inner += tx(96, 166, '電阻越大電流越小', 10, 'currentColor');
  return svg('300 176', inner, '一個電路迴路，左邊電池提供電壓V，頂邊電阻R，底邊電流I流動，三者關係是V等於I乘R');
}
// 串聯：一條路、電阻相加、斷一個全暗。
function seriesCircuit() {
  var inner = '';
  inner += tx(150, 16, '串聯：電流只有「一條路」');
  inner += '<rect x="50" y="34" width="200" height="80" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="3"/>';
  // 頂邊兩顆燈泡串在同一條線
  inner += '<circle cx="110" cy="34" r="12" fill="#fde047" stroke="currentColor" stroke-opacity="0.6" stroke-width="2.5"/><text x="110" y="39" text-anchor="middle" font-size="13">💡</text>';
  inner += '<circle cx="190" cy="34" r="12" fill="#fde047" stroke="currentColor" stroke-opacity="0.6" stroke-width="2.5"/><text x="190" y="39" text-anchor="middle" font-size="13">💡</text>';
  // 電池底邊
  inner += '<text x="150" y="120" text-anchor="middle" font-size="18">🔋</text>';
  inner += aR(70, 92, 44, C_I) + tx(92, 108, '電流 I', 10, C_I);
  inner += tx(150, 150, '電阻相加（R₁＋R₂）；斷一個 → 全部都暗', 11, C_KE);
  return svg('300 158', inner, '串聯電路一個迴路，兩顆燈泡串在同一條線上，電流只有一條路，電阻相加，斷掉一個全部都暗');
}
// 並聯：分多條路、各自獨立、拔一個其他還亮。
function parallelCircuit() {
  var inner = '';
  inner += tx(150, 16, '並聯：電流分「多條路」');
  // 上下兩條主幹
  inner += '<line x1="50" y1="44" x2="250" y2="44" stroke="currentColor" stroke-opacity="0.5" stroke-width="3"/>';
  inner += '<line x1="50" y1="120" x2="250" y2="120" stroke="currentColor" stroke-opacity="0.5" stroke-width="3"/>';
  // 電池接左側
  inner += '<line x1="50" y1="44" x2="50" y2="120" stroke="currentColor" stroke-opacity="0.5" stroke-width="3"/>';
  inner += '<text x="38" y="88" text-anchor="middle" font-size="16">🔋</text>';
  // 兩條支路、各一顆燈泡
  inner += '<line x1="140" y1="44" x2="140" y2="120" stroke="currentColor" stroke-opacity="0.5" stroke-width="3"/>';
  inner += '<circle cx="140" cy="82" r="13" fill="#fde047" stroke="currentColor" stroke-opacity="0.6" stroke-width="2.5"/><text x="140" y="87" text-anchor="middle" font-size="14">💡</text>';
  inner += '<line x1="220" y1="44" x2="220" y2="120" stroke="currentColor" stroke-opacity="0.5" stroke-width="3"/>';
  inner += '<circle cx="220" cy="82" r="13" fill="#fde047" stroke="currentColor" stroke-opacity="0.6" stroke-width="2.5"/><text x="220" y="87" text-anchor="middle" font-size="14">💡</text>';
  inner += tx(150, 150, '各走各的路、彼此獨立；拔掉一個 → 其他還亮', 11, C_W);
  return svg('300 158', inner, '並聯電路有上下兩條主幹，兩顆燈泡各在自己的支路上彼此獨立，拔掉一顆其他還亮');
}

/* =================== 課4：壓力與浮力（進階） =================== */
// ①壓力＝力÷受力面積。
function pressureArea() {
  var inner = '';
  inner += tx(78, 18, '面積大', 12);
  inner += aD(78, 30, 20, C_F) + tx(104, 40, '力', 10, C_F);
  inner += '<rect x="44" y="54" width="68" height="12" rx="2" fill="' + C_M + '" fill-opacity="0.4" stroke="' + C_M + '" stroke-width="2"/>';
  inner += aD(56, 70, 18, C_A, 3) + aD(78, 70, 18, C_A, 3) + aD(100, 70, 18, C_A, 3);
  inner += '<line x1="34" y1="96" x2="122" y2="96" stroke="currentColor" stroke-opacity="0.4" stroke-width="2"/>';
  inner += tx(78, 128, '壓力小（力分散）', 10.5, C_A);
  inner += vdiv(150, 24, 120);
  inner += tx(224, 18, '面積小（尖端）', 12);
  inner += aD(224, 30, 20, C_F) + tx(250, 40, '力', 10, C_F);
  inner += '<polygon points="224,54 216,66 232,66" fill="' + C_M + '" fill-opacity="0.5" stroke="' + C_M + '" stroke-width="2"/>';
  inner += aD(224, 66, 42, C_A, 6);
  inner += '<line x1="180" y1="96" x2="268" y2="96" stroke="currentColor" stroke-opacity="0.4" stroke-width="2"/>';
  inner += tx(224, 128, '壓力大（力集中）', 10.5, C_A);
  inner += tx(150, 152, '壓力 ＝ 力 ÷ 受力面積', 12);
  return svg('300 162', inner, '同樣的力作用在大面積上壓力分散變小，作用在尖端小面積上壓力集中變大，所以圖釘尖端容易刺入');
}
// ②液體越深，壓力越大。
function depthPressure() {
  var inner = '';
  inner += tx(130, 16, '液體越深，壓力越大');
  inner += '<rect x="40" y="30" width="150" height="124" fill="rgba(14,165,233,0.16)" stroke="#0ea5e9" stroke-width="2"/>';
  inner += tx(176, 44, '水', 11, 'currentColor', 'end');
  inner += aR(42, 56, 16, '#0ea5e9', 4) + tx(66, 60, '淺：壓力小', 10, 'currentColor', 'start');
  inner += aR(42, 96, 34, '#0ea5e9', 4) + tx(84, 100, '較深：壓力較大', 10, 'currentColor', 'start');
  inner += aR(42, 136, 54, '#0ea5e9', 4) + tx(104, 140, '最深：壓力最大', 10, 'currentColor', 'start');
  inner += tx(222, 92, '越深\n上方的水\n越多 →\n壓力越大'.split('\n').map(function (ss, i) { return '<tspan x="222" dy="' + (i ? 15 : 0) + '">' + ss + '</tspan>'; }).join(''), 10, 'currentColor');
  return svg('260 164', inner, '水箱裡越往下壓力的箭頭越長，因為越深上方的水越多，所以液體越深壓力越大');
}

/* =================== 課5：運動定律總覽（慣性） =================== */
// ①慣性：公車急停、乘客前傾。
function inertiaBus() {
  var inner = '';
  inner += tx(76, 18, '行進中 →', 12, C_A);
  inner += aR(40, 34, 60, C_A, 4);
  inner += '<rect x="36" y="44" width="80" height="46" rx="8" fill="' + C_M + '" fill-opacity="0.18" stroke="' + C_M + '" stroke-width="2.5"/>';
  inner += '<circle cx="76" cy="60" r="8" fill="' + C_A + '" fill-opacity="0.4" stroke="' + C_A + '" stroke-width="2"/><line x1="76" y1="68" x2="76" y2="84" stroke="' + C_A + '" stroke-width="3"/>';
  inner += '<circle cx="54" cy="96" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="98" cy="96" r="6" fill="none" stroke="currentColor" stroke-width="2"/>';
  inner += tx(76, 128, '人站得直', 10.5);
  inner += vdiv(150, 24, 120);
  inner += tx(224, 18, '← 突然煞車！', 12, C_KE);
  inner += aL(260, 34, 44, C_KE, 4);
  inner += '<rect x="184" y="44" width="80" height="46" rx="8" fill="' + C_M + '" fill-opacity="0.18" stroke="' + C_M + '" stroke-width="2.5"/>';
  inner += '<circle cx="236" cy="58" r="8" fill="' + C_KE + '" fill-opacity="0.4" stroke="' + C_KE + '" stroke-width="2"/><line x1="236" y1="66" x2="248" y2="82" stroke="' + C_KE + '" stroke-width="3"/>';
  inner += '<circle cx="202" cy="96" r="6" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="246" cy="96" r="6" fill="none" stroke="currentColor" stroke-width="2"/>';
  inner += aR(224, 74, 20, C_KE, 3) + tx(224, 128, '身體往前倒', 10.5, C_KE);
  inner += tx(150, 152, '慣性：身體想保持原本的前進運動', 11.5);
  return svg('300 162', inner, '公車行進中乘客站直，突然煞車時車子慢下來但乘客因為慣性想保持前進所以身體往前倒');
}
// ②作用力與反作用力：一樣大、方向相反；火箭噴氣。
function actionReaction() {
  var inner = '';
  inner += tx(80, 18, '你推牆、牆也推你', 11.5);
  inner += box(40, 48, 34, 30, C_A, '你');
  inner += '<rect x="106" y="40" width="12" height="52" fill="' + C_M + '" fill-opacity="0.4" stroke="' + C_M + '" stroke-width="2"/>' + tx(123, 58, '牆', 10, 'currentColor', 'start');
  inner += aR(76, 60, 26, C_F) + tx(89, 42, '你推牆', 9.5, C_F);
  inner += aL(104, 76, 26, C_V) + tx(89, 100, '牆推你', 9.5, C_V);
  inner += tx(80, 124, '一樣大、方向相反', 10.5);
  inner += vdiv(150, 24, 118);
  inner += tx(224, 18, '火箭噴氣', 11.5);
  inner += '<polygon points="224,40 236,70 212,70" fill="' + C_A + '" fill-opacity="0.3" stroke="' + C_A + '" stroke-width="2.5"/>';
  inner += aU(224, 40, 22, C_A) + tx(252, 36, '推力↑', 10, C_A);
  inner += '<path d="M216 72 l-4 14 M224 72 l0 16 M232 72 l4 14" stroke="' + C_F + '" stroke-width="2.5"/>';
  inner += aD(224, 90, 20, C_F) + tx(252, 108, '噴氣↓', 10, C_F);
  inner += tx(224, 124, '氣往下 → 火箭往上', 10);
  inner += tx(150, 150, '作用力與反作用力：一樣大、方向相反（成對）', 11);
  return svg('300 160', inner, '你推牆牆也用一樣大方向相反的力推你，火箭往下噴氣就得到往上的反作用力推力');
}
// ③摩擦力：方向與運動相反。
function frictionScene() {
  var inner = '';
  inner += tx(140, 16, '摩擦力：方向和運動相反');
  inner += box(98, 50, 54, 32, C_M, '箱');
  inner += aR(156, 46, 44, C_A, 4) + tx(178, 38, '運動方向 →', 10, C_A);
  inner += '<line x1="20" y1="86" x2="260" y2="86" stroke="currentColor" stroke-opacity="0.4" stroke-width="2.5"/>';
  for (var i = 0; i < 10; i++) { inner += '<line x1="' + (26 + i * 24) + '" y1="86" x2="' + (18 + i * 24) + '" y2="96" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.5"/>'; }
  inner += aL(98, 80, 34, C_FRIC, 4) + tx(72, 76, '摩擦力', 10, C_FRIC);
  inner += tx(140, 118, '摩擦力擋住運動，把它慢慢停下來', 11);
  return svg('280 128', inner, '箱子在粗糙地面往右運動，地面給一個往左方向與運動相反的摩擦力，擋住運動讓箱子慢慢停下');
}

window.CONCEPT = {
  progKey: 'physics_concepts_adv_v1', practiceHref: 'physics.html',
  lessons: [
   { id:'fma', name:'牛頓第二定律 F＝ma', emoji:'🚀', color:'#2563eb', sub:'力越大加速度越大、質量越大越難加速',
     done:'記得 F＝ma：力越大 → 加速度越大；質量越大 → 越難加速（加速度越小）。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'力會讓物體「加速」',svg:accelConcept(),text:'<b>力</b>會讓物體改變運動：本來靜止的開始動、本來在動的變更快或變慢。速度<b>變化的快慢</b>就叫<b>加速度</b>。圖中力一直推著箱子，它每過一秒速度就多增加一截——這就是在<b>加速</b>。'},
      {type:'teach',kicker:'力越大',title:'同一物體：力越大 → 加速度越大',svg:fmaForce(),text:'對<b>同一個箱子</b>，用<b>越大的力</b>推，它就加速得<b>越快</b>（加速度越大）。力變兩倍，加速度也變兩倍——力和加速度成<b>正比</b>。'},
      {type:'teach',kicker:'質量越大',title:'同樣的力：質量越大 → 加速度越小',svg:fmaMass(),text:'用<b>一樣大的力</b>，推<b>比較重</b>（質量大）的東西，它加速得<b>比較慢</b>（加速度較小）。質量越大越<b>難</b>加速——質量和加速度成<b>反比</b>。合起來就是 <b>F ＝ m × a</b>。'},
      {type:'teach',kicker:'記住單位',title:'F＝ma 的單位',svg:unitTable(),text:'力用<b>牛頓（N）</b>、質量用<b>公斤（kg）</b>、加速度用<b>公尺每秒平方（m/s²）</b>。它們的關係是 <b>1 牛頓 ＝ 1 公斤·公尺/秒²</b>。算的時候：<b>a ＝ F ÷ m</b>。'},
      {type:'quiz',kicker:'換你試試',title:'2 kg 的物體受到 10 N 的力，加速度多大？',eq:'a ＝ F ÷ m',options:['5 m/s²','20 m/s²','0.2 m/s²','2 m/s²'],answer:0,why:'a ＝ F ÷ m ＝ 10 ÷ 2 ＝ 5 m/s²。',whyWrong:{1:'這是把力和質量相乘（10×2）了；要用「除」：F÷m。',2:'除反了：是 F÷m（10÷2），不是 m÷F（2÷10）。',3:'2 是質量，不是加速度；還要用 10÷2 算出 5。'}},
      {type:'quiz',kicker:'換你試試',title:'同樣用 6 N 的力，推 1 kg 和推 3 kg，哪個加速度大？',options:['1 kg 的','3 kg 的','一樣大','都不動'],answer:0,why:'質量越小、加速度越大（a＝F÷m）：1 kg 的 a＝6、3 kg 的 a＝2。',whyWrong:{1:'質量大反而更難加速；分母越大，a 越小。',2:'力一樣，但質量不同，加速度就不同。'}},
      {type:'quiz',kicker:'想一想',title:'想讓同一台購物車加速得更快，可以怎麼做？',options:['用更大的力推','裝更多東西讓它更重','慢慢地輕輕推','完全不要碰它'],answer:0,why:'力越大，加速度越大（a＝F÷m）；所以用更大的力推會加速得更快。',whyWrong:{1:'東西變多＝質量變大，反而更難加速（a 變小）。',3:'力越小加速度越小，不會更快。'}}
     ]},
   { id:'work', name:'功、功率與能量', emoji:'⚙️', color:'#16a34a', sub:'功＝力×距離、功率＝快慢、能量只會轉換',
     done:'記得：功＝力×距離（要移動才算）；功率＝做功快慢；能量只會轉換不會不見。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'出力又移動，才算「做功」',svg:workScene(),text:'物理裡的<b>做功</b>有條件：要<b>出力</b>，而且物體<b>沿著力的方向移動</b>。公式是 <b>W ＝ 力 × 距離</b>。如果你用力<b>頂著牆</b>，牆<b>沒有移動</b>（距離＝0），那你做的功就是 <b>0</b>——再累也沒做功。'},
      {type:'teach',kicker:'做得快不快',title:'功率＝做功的快慢',svg:powerScene(),text:'<b>功率</b>是「做功的<b>快慢</b>」：<b>P ＝ 功 ÷ 時間</b>。同樣把一箱書搬到同樣高度（功一樣多），<b>花的時間越短</b>，功率就<b>越大</b>。'},
      {type:'teach',kicker:'能量去哪了',title:'能量守恆：只會轉換、不會不見',svg:energyCoaster(),text:'能量<b>不會憑空消失，也不會憑空出現，只會從一種變成另一種</b>。雲霄飛車在<b>高點</b>有很多<b>位能</b>（動能小）；滑到<b>低點</b>位能變成<b>動能</b>（跑得最快）；再升高時動能又變回位能——總量不變。'},
      {type:'teach',kicker:'聰明省力',title:'簡單機械：省力但不省功',svg:machineScene(),text:'<b>槓桿</b>、<b>滑輪</b>這些<b>簡單機械</b>可以讓我們<b>省力</b>（用比較小的力抬起重物）。但天下沒有白吃的午餐：省了力，就得<b>多移動一些距離</b>，所以<b>功</b>（力×距離）其實<b>沒有變少</b>——省力不省功。'},
      {type:'quiz',kicker:'換你試試',title:'用 20 N 的力把箱子推 3 公尺，做了多少功？',eq:'W ＝ 力 × 距離',options:['60 焦耳','23 焦耳','6.7 焦耳','0'],answer:0,why:'W ＝ 力 × 距離 ＝ 20 × 3 ＝ 60 焦耳（J）。',whyWrong:{1:'這是把力和距離相加（20＋3）了；要用「乘」。',2:'這是用除的（20÷3）；功是力乘距離。'}},
      {type:'quiz',kicker:'換你試試',title:'用力頂著牆壁，牆壁沒有移動，你做了多少功？',options:['0（沒做功）','很多','看你多用力','無法計算'],answer:0,why:'做功要「有出力且物體沿力的方向移動」，距離＝0，所以 W ＝ 0。',whyWrong:{1:'沒有移動就沒有做功，不管出了多少力。',2:'用力大小不影響；關鍵是物體有沒有移動（這裡距離＝0）。'}},
      {type:'quiz',kicker:'想一想',title:'同樣把一箱書搬到二樓，小明花 10 秒、小華花 20 秒，誰的功率比較大？',options:['小明（時間短、功率大）','小華','一樣大','兩人都沒做功'],answer:0,why:'功一樣多（同一箱書、同樣高度），時間越短功率越大（P＝功÷時間），所以小明功率大。',whyWrong:{1:'小華花的時間比較長，功率反而比較小。',2:'功一樣，但時間不同，功率就不同。'}}
     ]},
   { id:'ohm', name:'歐姆定律與串並聯', emoji:'🔋', color:'#f59e0b', sub:'V＝IR、串聯共用一條路、並聯各走各的',
     done:'記得：V＝I×R；串聯只有一條路（斷一個全暗）、並聯各走各的（拔一個其他還亮）。',
     steps:[
      {type:'teach',kicker:'先看動畫',title:'電要繞完整一圈才會流動',svg:animCanvas(320,180,'電路動畫：通路時電流像一圈小點繞著電路流動、燈泡亮；打開開關變成斷路有缺口時，電流就不流、燈泡不亮'),mount:function(host){var h=window.Anim.circuitFlow(host);return function(){h.stop();};},text:'電流要能<b>繞完整一圈</b>（通路）才會流動、燈泡才會亮；斷了一個缺口（斷路）電流就停。<b>電壓 V</b> 像幫浦，把電流<b>推</b>著走；<b>電阻 R</b> 則<b>擋住</b>電流。看動畫裡的小點：接通時繞一圈流動，斷開時就停住。'},
      {type:'teach',kicker:'三者的關係',title:'歐姆定律 V＝I×R',svg:ohmLaw(),text:'<b>電壓 V</b> 推電流、<b>電阻 R</b> 擋電流，流出來的就是<b>電流 I</b>。三者的關係是<b>歐姆定律：V ＝ I × R</b>。所以電壓越大、電流越大；電阻越大、電流越小。要算電流就用 <b>I ＝ V ÷ R</b>。'},
      {type:'teach',kicker:'接法一',title:'串聯：只有一條路',svg:seriesCircuit(),text:'<b>串聯</b>是把元件<b>排成一直線</b>，電流<b>只有一條路</b>可走。這條路上的<b>電阻會相加</b>（R₁＋R₂）。缺點：只要<b>任何一個</b>斷掉，整條路就斷了，<b>全部都暗</b>（像一串壞掉的小燈泡）。'},
      {type:'teach',kicker:'接法二',title:'並聯：電流分多條路',svg:parallelCircuit(),text:'<b>並聯</b>是讓電流<b>分成好幾條路</b>，每條路<b>各走各的、彼此獨立</b>。好處：<b>拔掉或壞掉一個</b>，其他路<b>不受影響、還是亮</b>。家裡的電器大多是並聯，所以關掉一個不會害別的也不能用。'},
      {type:'quiz',kicker:'換你試試',title:'電壓 6 V、電阻 2 Ω，電流多大？',eq:'I ＝ V ÷ R',options:['3 A','12 A','8 A','0.3 A'],answer:0,why:'I ＝ V ÷ R ＝ 6 ÷ 2 ＝ 3 A。',whyWrong:{1:'這是把 V 和 R 相乘（6×2）了；要用「除」：V÷R。',2:'這是把 V 和 R 相加（6＋2）了。'}},
      {type:'quiz',kicker:'換你試試',title:'兩顆燈泡「並聯」，拿掉其中一顆，另一顆會？',options:['還是亮','也跟著熄滅','變亮兩倍','爆掉'],answer:0,why:'並聯各走各的路、彼此獨立，拿掉一顆不影響另一條路，所以另一顆還是亮。',whyWrong:{1:'那是「串聯」（共用一條路）才會一起暗；並聯是獨立的。'}},
      {type:'quiz',kicker:'想一想',title:'三顆燈泡「串聯」成一串，其中一顆燒掉了，其他兩顆會？',options:['也跟著熄滅（整條路斷了）','變得更亮','不受影響還是亮','只有旁邊那顆會暗'],answer:0,why:'串聯只有一條路，一顆燒掉這條路就斷了，電流流不過去，所以其他的也全暗。',whyWrong:{2:'那是「並聯」的特性；串聯共用一條路，斷一個就全斷。'}}
     ]},
   { id:'pressure', name:'壓力與浮力（進階）', emoji:'🌊', color:'#0891b2', sub:'壓力看面積與深度、浮力＝排開的水重',
     done:'記得：壓力＝力÷面積（面積小、壓力大；越深越大）；浮力＝物體排開液體的重量。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'壓力＝力÷受力面積',svg:pressureArea(),text:'<b>壓力</b>是「力<b>集中</b>的程度」：<b>壓力 ＝ 力 ÷ 受力面積</b>。<b>同樣的力</b>，壓在<b>大面積</b>上會<b>分散</b>（壓力小）；壓在<b>小小的尖端</b>上會<b>集中</b>（壓力大）。所以<b>圖釘的尖端</b>特別容易刺進木板。'},
      {type:'teach',kicker:'往下潛',title:'液體越深，壓力越大',svg:depthPressure(),text:'在水裡，<b>越深的地方壓力越大</b>，因為上面<b>壓著的水越多</b>。所以潛水越潛越深，耳朵會越來越感覺到壓力；水壩的牆也是<b>越靠底部做得越厚</b>來擋住大壓力。'},
      {type:'teach',kicker:'為什麼會浮',title:'浮力＝物體排開液體的重量',svg:animCanvas(330,200,'浮力動畫：一樣大、不同重的木塊和鐵塊放入水中；木塊浮力大於重力會浮起停在水面，鐵塊重力大於浮力會沉到底；浮或沉看兩個力誰大'),mount:function(host){var h=window.Anim.buoyancyFloat(host);return function(){h.stop();};},text:'東西放進水裡會<b>排開</b>一些水，水就給它一個<b>往上的浮力</b>。<b>阿基米德</b>發現：<b>浮力 ＝ 物體排開液體的重量</b>——<b>排開越多水，浮力越大</b>。看動畫：木塊浮力大於重力就浮起、鐵塊重力大於浮力就下沉。（浮在水面不動時，浮力剛好<b>等於</b>重力。）'},
      {type:'quiz',kicker:'換你試試',title:'為什麼圖釘的「尖端」容易刺進木板？',options:['面積小、壓力大','尖端比較重','尖端有磁力','木板突然變軟'],answer:0,why:'壓力＝力÷面積，面積越小壓力越大，尖端把力集中到很小的點上，所以能刺入。',whyWrong:{1:'跟尖端重不重無關，是因為面積小讓壓力集中。',2:'圖釘並沒有磁力；靠的是壓力集中。'}},
      {type:'quiz',kicker:'換你試試',title:'鐵做的大船為什麼能浮在水面？',options:['船身排開很多水、浮力夠大','鐵其實很輕','水有磁力托住它','船裡一定裝了氣球'],answer:0,why:'船的形狀排開大量的水，浮力＝排開水的重量，大到足以撐住整艘船的重量，所以浮得起來。',whyWrong:{1:'鐵本身比水重；靠的是船的「形狀」排開大量水。',2:'水沒有磁力；是浮力（排開水的重量）托住船。'}},
      {type:'quiz',kicker:'想一想',title:'潛水時越潛越深，耳朵越來越感覺到壓力，是因為？',options:['水越深，上方的水越多、壓力越大','水越深越冷','水越深氧氣越多','水越深越亮'],answer:0,why:'液體越深，上方壓著的水越多，壓力就越大，所以耳朵感覺到的壓力隨深度增加。',whyWrong:{1:'冷不冷和壓力無關；壓力變大是因為上方的水變多。'}}
     ]},
   { id:'inertia', name:'運動定律總覽（慣性）', emoji:'🏃', color:'#7c3aed', sub:'慣性維持原狀、力總是成對、摩擦力擋運動',
     done:'記得：不受力就維持原狀（慣性）；力總是成對出現（作用力與反作用力）；摩擦力方向和運動相反。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'慣性：物體想「維持原狀」',svg:inertiaBus(),text:'<b>慣性</b>是：不受力時，<b>靜止的東西會一直靜止、運動的東西會保持等速直線前進</b>。公車<b>突然煞車</b>時，車子慢下來，但乘客的身體因為<b>慣性</b>還想<b>保持原本的前進</b>，所以會<b>往前倒</b>。<b>安全帶</b>就是用來對抗這個慣性、把你拉住。'},
      {type:'teach',kicker:'力成雙成對',title:'作用力與反作用力',svg:actionReaction(),text:'力總是<b>成對出現</b>：你<b>推牆</b>，牆也用<b>一樣大、方向相反</b>的力<b>推你</b>。<b>火箭</b>也是這樣——它用力把氣體<b>往下噴</b>，氣體就給火箭一個<b>往上</b>的反作用力，把火箭推上天。'},
      {type:'teach',kicker:'擋住運動',title:'摩擦力：方向和運動相反',svg:frictionScene(),text:'<b>摩擦力</b>發生在兩個接觸面之間，它的<b>方向永遠和運動方向相反</b>，會<b>擋住</b>運動。所以在地上推一個箱子，放手後它會<b>慢慢停下來</b>——摩擦力一直在把它的動能消耗掉。'},
      {type:'quiz',kicker:'換你試試',title:'公車突然煞車，站著的人為什麼會往前倒？',options:['慣性：身體想保持原本的前進','地板用力把他往前推','被風吹的','公車突然變重了'],answer:0,why:'慣性讓身體維持原本的前進運動，車子停了身體還想往前，所以往前倒。',whyWrong:{1:'地板並沒有推他往前；真正的原因是慣性。',3:'車子的重量沒有變；是慣性讓人往前。'}},
      {type:'quiz',kicker:'換你試試',title:'火箭往下噴氣，為什麼會往上飛？',options:['反作用力：氣往下、火箭被往上推','像氣球洩氣亂飛','下方的空氣托住它','地球排斥它'],answer:0,why:'作用力與反作用力一樣大、方向相反：火箭把氣往下噴，就受到一個往上的反作用力。',whyWrong:{2:'就算在沒有空氣的太空，火箭一樣能飛，靠的是反作用力，不是空氣托住。'}},
      {type:'quiz',kicker:'想一想',title:'在地上推一個箱子，放手後它會慢慢停下來，是因為？',options:['摩擦力擋住運動（方向和運動相反）','慣性讓它停下來','空氣把它吸住','重力把它往後拉'],answer:0,why:'摩擦力的方向和運動相反，會擋住運動、把動能慢慢消耗掉，所以箱子停下來。',whyWrong:{1:'慣性其實是讓它「想繼續動」，不是讓它停；讓它停的是摩擦力。',3:'重力是往下的，不會把它往後拉。'}}
     ]}
  ]
};

})();
