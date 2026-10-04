/* =====================================================================
 * data_literacy_concepts.ts  →  (tsc, tsconfig.legacy.json) →  data_literacy_concepts.js
 * 「資料偵探・看穿數字與圖表的把戲」觀念養成（基準線／被切掉的 Y 軸／比例尺花招／
 *   平均數陷阱／以偏概全與倖存者偏誤／相關不等於因果）。國小高年級→國中。
 *   這是「思辨／媒體識讀」角度：教怎麼「識破」廣告與新聞裡會騙人的數字與圖表；
 *   「怎麼正確讀圖（直方圖、盒狀圖、散布圖）」的數學角度在 statistics_concepts 教，兩頁互連不重複。
 *   資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）。
 *   動畫課重用 anim_core.js 的 window.Anim.barGrow / scatterTrend（與 statistics 同一實作、
 *   union cfg，不重造場景）；其餘以 stepped/static SVG。純本地進度（progKey），不餵主 XP。
 *   以 IIFE 包住讓 animCanvas / SVG helper 為檔案區域（避免與其他遷移頁同名頂層 helper
 *   在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。
 * ===================================================================== */
(function () {

// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
function animCanvas(w, h, label) {
  return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
    'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
}

var SU = '#0ea5e9', WARN = '#e11d48', OK = '#16a34a', MUT = '#64748b', GREY = '#94a3b8';

// ---- static / stepped SVG helpers（每個 teach step 都要有視覺，零純文字）----------

// L1：長條從基準線 0 畫起，長條「長度」就等於數值。
function baselineRuler() {
  return '<svg viewBox="0 0 300 180" role="img" aria-label="長條從基準線 0 畫起，長條的長度就等於數值；Y 軸要從 0 開始，比較才公平">' +
    '<line x1="60" y1="20" x2="60" y2="150" stroke="currentColor" stroke-width="1.4" opacity="0.6"/>' +
    '<line x1="60" y1="150" x2="255" y2="150" stroke="currentColor" stroke-width="1.4" opacity="0.6"/>' +
    '<text x="52" y="153" text-anchor="end" font-size="11" fill="currentColor">0</text>' +
    '<text x="52" y="26" text-anchor="end" font-size="11" fill="currentColor">8</text>' +
    '<rect x="90" y="60" width="48" height="90" fill="' + SU + '" opacity="0.82"/>' +
    '<rect x="90" y="60" width="48" height="90" fill="none" stroke="' + SU + '"/>' +
    '<text x="114" y="52" text-anchor="middle" font-size="11" fill="currentColor">6</text>' +
    '<line x1="162" y1="60" x2="162" y2="150" stroke="' + OK + '" stroke-width="1.6"/>' +
    '<path d="M158 60 L166 60 M158 150 L166 150" stroke="' + OK + '" stroke-width="1.6"/>' +
    '<text x="172" y="108" font-size="10.5" fill="' + OK + '">長條長度＝數值</text>' +
    '<text x="150" y="174" text-anchor="middle" font-size="11" fill="currentColor">Y 軸從 0 開始，比較才公平</text>' +
    '</svg>';
}

// L2：同一組 102/105/108，Y 軸從 0 看三根差不多高（真相）；從 100 看差距被放大（誤導）。
function truncatedCompare() {
  var s = '<svg viewBox="0 0 300 188" role="img" aria-label="同一組資料 102、105、108：Y 軸從 0 看三根長條差不多高（真相）；Y 軸從 100 看差距被放大好幾倍（誤導）">';
  // 左：從 0（真相）—— 1px/單位，top=120 於 y=30、0 於 y=150
  s += '<text x="80" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="' + OK + '">Y 軸從 0（真相）</text>';
  s += '<line x1="30" y1="30" x2="30" y2="150" stroke="currentColor" stroke-width="1.3" opacity="0.6"/>';
  s += '<line x1="30" y1="150" x2="132" y2="150" stroke="currentColor" stroke-width="1.3" opacity="0.6"/>';
  s += '<text x="26" y="153" text-anchor="end" font-size="9" fill="currentColor">0</text>';
  s += '<rect x="45" y="48" width="20" height="102" fill="' + SU + '" opacity="0.82"/>';
  s += '<rect x="72" y="45" width="20" height="105" fill="' + SU + '" opacity="0.82"/>';
  s += '<rect x="99" y="42" width="20" height="108" fill="' + SU + '" opacity="0.82"/>';
  s += '<text x="81" y="168" text-anchor="middle" font-size="10" fill="currentColor">三根差不多高</text>';
  // 右：從 100（誤導）—— 9 單位撐滿 120px，top=109 於 y=30、100 於 y=150
  s += '<text x="238" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="' + WARN + '">Y 軸從 100（誤導）</text>';
  s += '<line x1="190" y1="30" x2="190" y2="150" stroke="currentColor" stroke-width="1.3" opacity="0.6"/>';
  s += '<line x1="190" y1="150" x2="292" y2="150" stroke="currentColor" stroke-width="1.3" opacity="0.6"/>';
  s += '<text x="186" y="153" text-anchor="end" font-size="9" fill="currentColor">100</text>';
  s += '<rect x="205" y="123" width="20" height="27" fill="' + WARN + '" opacity="0.82"/>';
  s += '<rect x="232" y="83" width="20" height="67" fill="' + WARN + '" opacity="0.82"/>';
  s += '<rect x="259" y="43" width="20" height="107" fill="' + WARN + '" opacity="0.82"/>';
  s += '<text x="241" y="168" text-anchor="middle" font-size="10" fill="currentColor">差距被放大</text>';
  s += '<text x="150" y="184" text-anchor="middle" font-size="9.5" fill="currentColor">同樣是 102、105、108，只是換了 Y 軸起點</text>';
  return s + '</svg>';
}

// L3-1：面積膨脹——寬×2、高×2 → 面積×4，誇大「翻倍」。
function areaInflate() {
  return '<svg viewBox="0 0 300 180" role="img" aria-label="廣告說銷量翻倍，卻把圖示的寬和高都放大兩倍，面積會變成四倍，看起來誇大很多">' +
    '<text x="150" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">「銷量翻倍」的圖示花招</text>' +
    '<rect x="42" y="92" width="40" height="40" fill="' + SU + '" opacity="0.5"/>' +
    '<rect x="42" y="92" width="40" height="40" fill="none" stroke="' + SU + '"/>' +
    '<text x="62" y="86" text-anchor="middle" font-size="10" fill="currentColor">原來 100</text>' +
    '<text x="62" y="150" text-anchor="middle" font-size="10" fill="currentColor">1 格</text>' +
    '<rect x="150" y="52" width="80" height="80" fill="' + WARN + '" opacity="0.5"/>' +
    '<rect x="150" y="52" width="80" height="80" fill="none" stroke="' + WARN + '"/>' +
    '<text x="190" y="46" text-anchor="middle" font-size="10" fill="currentColor">翻倍 200</text>' +
    '<text x="190" y="96" text-anchor="middle" font-size="10" fill="currentColor">看起來像 4 格！</text>' +
    '<text x="150" y="172" text-anchor="middle" font-size="10" fill="currentColor">寬×2、高×2 → 面積×4（視覺誇大）</text>' +
    '</svg>';
}

// L3-2：cherry-pick——整體下跌，只框出中間上漲的三天。
function cherryPick() {
  return '<svg viewBox="0 0 300 180" role="img" aria-label="股價整體在下跌，卻只框出中間上漲的三天，假裝一直在漲，這叫挑選對自己有利的時間段">' +
    '<text x="150" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">只挑「上漲的那三天」</text>' +
    '<line x1="28" y1="150" x2="285" y2="150" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>' +
    '<polyline points="30,52 70,72 110,96 140,80 170,64 200,108 245,132 282,148" fill="none" stroke="' + MUT + '" stroke-width="2"/>' +
    '<rect x="104" y="54" width="72" height="56" fill="' + WARN + '" opacity="0.12" stroke="' + WARN + '" stroke-dasharray="4 3"/>' +
    '<polyline points="110,96 140,80 170,64" fill="none" stroke="' + WARN + '" stroke-width="2.6"/>' +
    '<text x="140" y="48" text-anchor="middle" font-size="9.5" fill="' + WARN + '">只框這三天→假裝一直漲</text>' +
    '<text x="150" y="170" text-anchor="middle" font-size="10" fill="currentColor">藏起整體的大跌（挑有利區間）</text>' +
    '</svg>';
}

// L3-3：比例尺不一致、沒有基準無法比較；口訣「軸、範圍、單位、比例」。
function scaleTricks() {
  var s = '<svg viewBox="0 0 300 186" role="img" aria-label="其他花招：刻度間距不一致、沒有單位或沒有和什麼比就無法判斷；看圖口訣是先問軸、範圍、單位、比例對不對">';
  s += '<text x="150" y="15" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">還有這些要小心</text>';
  s += '<line x1="30" y1="48" x2="285" y2="48" stroke="currentColor" stroke-width="1.2" opacity="0.6"/>';
  // 不等間距刻度
  var xs = [30, 70, 110, 175, 282];
  var ls = ['0', '10', '20', '30', '100'];
  for (var i = 0; i < xs.length; i++) {
    s += '<line x1="' + xs[i] + '" y1="44" x2="' + xs[i] + '" y2="52" stroke="currentColor" stroke-width="1.2" opacity="0.7"/>';
    s += '<text x="' + xs[i] + '" y="66" text-anchor="middle" font-size="9" fill="currentColor">' + ls[i] + '</text>';
  }
  s += '<text x="150" y="88" text-anchor="middle" font-size="10" fill="' + WARN + '">刻度忽寬忽窄＝比例尺不一致</text>';
  s += '<text x="150" y="110" text-anchor="middle" font-size="10" fill="' + WARN + '">沒單位、沒說「和什麼比」＝無法判斷</text>';
  s += '<rect x="34" y="124" width="232" height="48" rx="8" fill="' + SU + '" opacity="0.14"/>';
  s += '<text x="150" y="146" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + SU + '">看圖先問：軸、範圍、單位、比例</text>';
  s += '<text x="150" y="164" text-anchor="middle" font-size="10" fill="currentColor">對不對？</text>';
  return s + '</svg>';
}

// L4-1：九個人月薪 3 萬、一個老闆 100 萬；平均被極端值拉到 12.7 萬，中位數仍是 3 萬。
function meanOutlier() {
  var s = '<svg viewBox="0 0 300 182" role="img" aria-label="九個人月薪三萬排在左邊，老闆一百萬在最右邊；平均被極端高薪拉到十二點七萬，中位數還是三萬，才貼近多數人">';
  s += '<text x="150" y="15" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">月薪（萬）排排站</text>';
  s += '<line x1="25" y1="110" x2="285" y2="110" stroke="currentColor" stroke-width="1.3" opacity="0.6"/>';
  // 九個低薪點（約 x=28..52）
  var cxs = [28, 34, 40, 46, 52, 31, 37, 43, 49];
  var cys = [100, 100, 100, 100, 100, 90, 90, 90, 90];
  for (var i = 0; i < cxs.length; i++) s += '<circle cx="' + cxs[i] + '" cy="' + cys[i] + '" r="4" fill="' + SU + '"/>';
  s += '<circle cx="261" cy="100" r="5.5" fill="' + WARN + '"/>';
  s += '<text x="40" y="128" text-anchor="middle" font-size="9.5" fill="currentColor">9 人月薪 3 萬</text>';
  s += '<text x="261" y="128" text-anchor="middle" font-size="9.5" fill="' + WARN + '">老闆 100 萬</text>';
  // 中位數 3 萬（x≈32），平均 12.7 萬（x≈55）
  s += '<line x1="32" y1="70" x2="32" y2="110" stroke="' + OK + '" stroke-width="2"/>';
  s += '<text x="32" y="64" text-anchor="middle" font-size="9.5" fill="' + OK + '">中位數 3 萬</text>';
  s += '<line x1="55" y1="56" x2="55" y2="110" stroke="' + WARN + '" stroke-width="2" stroke-dasharray="3 2"/>';
  s += '<text x="70" y="50" text-anchor="middle" font-size="9.5" fill="' + WARN + '">平均 12.7 萬</text>';
  s += '<text x="150" y="152" text-anchor="middle" font-size="10" fill="currentColor">一個極端高薪，就把「平均」往右拉</text>';
  s += '<text x="150" y="170" text-anchor="middle" font-size="10" fill="currentColor">多數人其實是 3 萬（中位數）</text>';
  return s + '</svg>';
}

// L4-2：沒有極端值時 平均≈中位數；有極端值時 平均被拉走——偏態才用中位數（不絕對化）。
function meanVsMedian() {
  var s = '<svg viewBox="0 0 300 188" role="img" aria-label="沒有極端值時平均和中位數幾乎一樣；有極端值時平均被拉走、中位數還代表多數人，所以偏態時看中位數比較準">';
  s += '<text x="150" y="14" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">什麼時候「平均」會騙人？</text>';
  // 上：沒有極端值
  s += '<text x="150" y="34" text-anchor="middle" font-size="10" fill="' + OK + '">沒有極端值：平均 ≈ 中位數</text>';
  s += '<line x1="30" y1="58" x2="270" y2="58" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>';
  var a = [110, 130, 145, 150, 155, 170, 190];
  for (var i = 0; i < a.length; i++) s += '<circle cx="' + a[i] + '" cy="58" r="3.6" fill="' + SU + '"/>';
  s += '<line x1="150" y1="44" x2="150" y2="58" stroke="' + OK + '" stroke-width="2"/>';
  s += '<text x="150" y="40" text-anchor="middle" font-size="9" fill="' + OK + '">平均＝中位數</text>';
  // 下：有極端值
  s += '<text x="150" y="104" text-anchor="middle" font-size="10" fill="' + WARN + '">有極端值：平均被拉走</text>';
  s += '<line x1="30" y1="130" x2="270" y2="130" stroke="currentColor" stroke-width="1.2" opacity="0.5"/>';
  var b = [55, 62, 68, 74, 80, 86];
  for (var j = 0; j < b.length; j++) s += '<circle cx="' + b[j] + '" cy="130" r="3.6" fill="' + SU + '"/>';
  s += '<circle cx="258" cy="130" r="5" fill="' + WARN + '"/>';
  s += '<line x1="71" y1="116" x2="71" y2="130" stroke="' + OK + '" stroke-width="2"/>';
  s += '<text x="71" y="112" text-anchor="middle" font-size="9" fill="' + OK + '">中位數</text>';
  s += '<line x1="120" y1="116" x2="120" y2="130" stroke="' + WARN + '" stroke-width="2" stroke-dasharray="3 2"/>';
  s += '<text x="134" y="112" text-anchor="middle" font-size="9" fill="' + WARN + '">平均→被拉右</text>';
  s += '<text x="150" y="182" text-anchor="middle" font-size="10" fill="currentColor">偏態（有極端值）時，看「中位數」比較準</text>';
  return s + '</svg>';
}

// L5-1：以偏概全——只圈到角落三個同溫層的人，就推論全校。
function populationSample() {
  var s = '<svg viewBox="0 0 300 188" role="img" aria-label="全校有很多人，只圈到角落三個好朋友當樣本，就想推論全校的喜好，樣本太小又不具代表性，推論打叉">';
  s += '<text x="150" y="15" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">只問角落三個好朋友…</text>';
  // 人群 grid
  var rows = 4, cols = 6;
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      var x = 30 + c * 22, y = 48 + r * 30;
      s += '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="17">👤</text>';
    }
  }
  // 圈住角落三個
  s += '<ellipse cx="41" cy="134" rx="32" ry="19" fill="none" stroke="' + WARN + '" stroke-width="2" stroke-dasharray="4 3"/>';
  s += '<text x="52" y="172" text-anchor="middle" font-size="9.5" fill="' + WARN + '">只問這 3 個（同溫層）</text>';
  // 推論打叉
  s += '<text x="205" y="110" text-anchor="middle" font-size="10.5" fill="currentColor">→「全校都喜歡」</text>';
  s += '<text x="205" y="130" text-anchor="middle" font-size="16" fill="' + WARN + '">✗</text>';
  s += '<text x="205" y="150" text-anchor="middle" font-size="9.5" fill="currentColor">樣本太小、不具代表性</text>';
  return s + '</svg>';
}

// L5-2：倖存者偏誤——只看「飛回來／成功的」，漏掉「沒回來／失敗的」那群。
function survivorship() {
  var s = '<svg viewBox="0 0 300 190" role="img" aria-label="只研究飛回來的飛機、只訪問成功的人，會漏掉沒飛回來、失敗的那一群，結論會偏，這叫倖存者偏誤">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">倖存者偏誤</text>';
  s += '<text x="30" y="46" font-size="10.5" font-weight="700" fill="' + OK + '">飛回來的（看得到）</text>';
  var seen = [70, 120, 170, 220];
  for (var i = 0; i < seen.length; i++) s += '<text x="' + seen[i] + '" y="78" text-anchor="middle" font-size="24">✈️</text>';
  s += '<line x1="24" y1="96" x2="276" y2="96" stroke="currentColor" stroke-width="1" opacity="0.4"/>';
  s += '<text x="30" y="120" font-size="10.5" font-weight="700" fill="' + GREY + '">沒回來的（被忽略）</text>';
  var gone = [70, 120, 170, 220];
  for (var j = 0; j < gone.length; j++) {
    s += '<text x="' + gone[j] + '" y="152" text-anchor="middle" font-size="24" opacity="0.3">✈️</text>';
    s += '<text x="' + gone[j] + '" y="146" text-anchor="middle" font-size="13" fill="' + GREY + '">?</text>';
  }
  s += '<text x="150" y="182" text-anchor="middle" font-size="10" fill="currentColor">只看「活下來／成功的」，漏掉失敗的那群</text>';
  return s + '</svg>';
}

// L6-2：一起變，有三種可能——共同原因、反向因果、純屬巧合。
function threeFakeCause() {
  var s = '<svg viewBox="0 0 300 182" role="img" aria-label="兩件事一起變，有三種看起來像因果其實不一定是的情況：共同原因、反向因果、純屬巧合">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">「一起變」有三種可能</text>';
  // 面板1：共同原因 C→A、C→B
  s += '<circle cx="50" cy="46" r="12" fill="' + WARN + '" opacity="0.2" stroke="' + WARN + '"/>';
  s += '<text x="50" y="50" text-anchor="middle" font-size="10" fill="currentColor">因</text>';
  s += '<circle cx="30" cy="92" r="11" fill="' + SU + '" opacity="0.2" stroke="' + SU + '"/>';
  s += '<text x="30" y="96" text-anchor="middle" font-size="10" fill="currentColor">A</text>';
  s += '<circle cx="70" cy="92" r="11" fill="' + SU + '" opacity="0.2" stroke="' + SU + '"/>';
  s += '<text x="70" y="96" text-anchor="middle" font-size="10" fill="currentColor">B</text>';
  s += '<line x1="44" y1="56" x2="33" y2="81" stroke="' + WARN + '" stroke-width="1.6"/>';
  s += '<line x1="56" y1="56" x2="67" y2="81" stroke="' + WARN + '" stroke-width="1.6"/>';
  s += '<text x="50" y="128" text-anchor="middle" font-size="9.5" fill="currentColor">共同原因</text>';
  // 面板2：反向因果 B→A
  s += '<circle cx="130" cy="70" r="11" fill="' + SU + '" opacity="0.2" stroke="' + SU + '"/>';
  s += '<text x="130" y="74" text-anchor="middle" font-size="10" fill="currentColor">A</text>';
  s += '<circle cx="180" cy="70" r="11" fill="' + SU + '" opacity="0.2" stroke="' + SU + '"/>';
  s += '<text x="180" y="74" text-anchor="middle" font-size="10" fill="currentColor">B</text>';
  s += '<line x1="169" y1="70" x2="143" y2="70" stroke="' + WARN + '" stroke-width="1.6"/>';
  s += '<path d="M147 66 L141 70 L147 74" fill="none" stroke="' + WARN + '" stroke-width="1.6"/>';
  s += '<text x="155" y="128" text-anchor="middle" font-size="9.5" fill="currentColor">反向因果</text>';
  // 面板3：巧合——兩條無關折線剛好一起動
  s += '<polyline points="225,58 240,74 255,60 270,78 285,62" fill="none" stroke="' + SU + '" stroke-width="1.8"/>';
  s += '<polyline points="225,86 240,70 255,84 270,66 285,82" fill="none" stroke="' + MUT + '" stroke-width="1.8"/>';
  s += '<text x="255" y="128" text-anchor="middle" font-size="9.5" fill="currentColor">純屬巧合</text>';
  s += '<text x="150" y="150" text-anchor="middle" font-size="10" fill="currentColor">相關只是「一起變」，不代表誰造成誰</text>';
  s += '<text x="150" y="170" text-anchor="middle" font-size="10" fill="currentColor">先想：有沒有第三個共同原因？</text>';
  return s + '</svg>';
}

// L6-3：要證明因果，做控制變因的公平實驗（兩組只差一個條件）。
function controlExperiment() {
  var s = '<svg viewBox="0 0 300 180" role="img" aria-label="要證明 A 造成 B，做控制變因的公平實驗：兩組其他條件都一樣，只差有沒有做 A，再比較結果">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">想證明「A 造成 B」？做公平實驗</text>';
  s += '<rect x="24" y="34" width="118" height="86" rx="10" fill="' + SU + '" opacity="0.12" stroke="' + SU + '"/>';
  s += '<text x="83" y="54" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + SU + '">實驗組</text>';
  s += '<text x="83" y="76" text-anchor="middle" font-size="10" fill="currentColor">有做 A</text>';
  s += '<text x="83" y="98" text-anchor="middle" font-size="10" fill="currentColor">其他條件相同</text>';
  s += '<rect x="158" y="34" width="118" height="86" rx="10" fill="' + MUT + '" opacity="0.12" stroke="' + MUT + '"/>';
  s += '<text x="217" y="54" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + MUT + '">對照組</text>';
  s += '<text x="217" y="76" text-anchor="middle" font-size="10" fill="currentColor">不做 A</text>';
  s += '<text x="217" y="98" text-anchor="middle" font-size="10" fill="currentColor">其他條件相同</text>';
  s += '<text x="150" y="142" text-anchor="middle" font-size="10" fill="currentColor">只差一個條件 → 比較結果，才知道 A 有沒有效</text>';
  s += '<text x="150" y="162" text-anchor="middle" font-size="10" fill="' + WARN + '">光有相關不夠，要控制變因或有合理機制</text>';
  return s + '</svg>';
}

window.CONCEPT = {
  progKey: 'data_literacy_concepts_v1', practiceHref: 'math.html',
  lessons: [
   { id:'baseline', name:'長條圖與「基準線」', emoji:'📊', color:SU, sub:'長條從 0 畫起，長度才等於數值',
     done:'記得：長條圖的 Y 軸要從 0 開始，長條的「長度」才等於數值；看圖先確認基準線。',
     steps:[
      {type:'teach',kicker:'先看動畫',title:'三家店的銷量，從 0 畫起看看',svg:animCanvas(300,210,'三家店銷量 102、105、108 的長條圖，Y 軸從 0 畫起，三根長條依次長高、看起來差不多高'),mount:function(host){var h=window.Anim.barGrow(host,{mode:'bar',misleadAxis:false,values:[102,105,108],labels:['A 店','B 店','C 店'],unit:'萬'});return function(){h.stop();};},text:'廣告上有三家飲料店的銷量：<b>102、105、108 萬</b>。把長條<b>從 0 畫起</b>，三根<b>差不多高</b>——因為它們本來就差沒多少。這才是誠實的畫法。'},
      {type:'teach',kicker:'為什麼',title:'長條的「長度」就等於數值',svg:baselineRuler(),text:'長條圖是用長條的<b>長度</b>來代表數值的。所以<b>基準線（Y 軸起點）一定要從 0 開始</b>，長度才會剛好等於數值，大家比起來才<b>公平</b>。看長條圖，第一件事就是<b>確認 Y 軸從不從 0 開始</b>。'},
      {type:'quiz',kicker:'換你試試',title:'長條圖的高度代表什麼？',options:['數值大小','顏色深淺','長條寬度','排列順序'],answer:0,why:'長條的「長度（高度）」對應數值，所以 Y 軸要從 0 起，比較才公平。',whyWrong:{1:'顏色只是美觀，不代表數值的大小。',2:'長條的「寬度」通常都一樣；代表數值的是「長度（高度）」。',3:'排列順序不會改變每根長條代表的數值。'}},
      {type:'quiz',kicker:'想一想',title:'102、105、108 這三個數字其實差多少？',options:['差很小，約百分之幾','差一倍','差十倍','看不出來'],answer:0,why:'108 比 102 只多 6，6÷102 約 6%，差距其實很小。',whyWrong:{1:'差一倍是指多出一整個（例如 102→204），這裡只多 6。',2:'差十倍更誇張（102→1020），和實際只差 6 相差很遠。',3:'其實算得出來：108−102＝6，約 6%。'}}
     ]},
   { id:'truncated', name:'被切掉的 Y 軸', emoji:'✂️', color:SU, sub:'誤導招式#1：截斷 Y 軸放大小差距',
     done:'記得：Y 軸不從 0 開始（截斷軸）會把小差距在視覺上放大；看到長條圖，先檢查 Y 軸起點。',
     steps:[
      {type:'teach',kicker:'先看動畫',title:'把 Y 軸從 0 切到 100，差距就「變大」了',svg:animCanvas(300,210,'同一組 102、105、108，Y 軸起點從 0 切到 100，三根長條瞬間變成矮一截與高一截，小差距被放大成看起來差好幾倍，再把軸拉回 0 還原'),mount:function(host){var h=window.Anim.barGrow(host,{mode:'bar',misleadAxis:true,toggle:true,values:[102,105,108],yStart:100,labels:['A 店','B 店','C 店'],unit:'萬'});return function(){h.stop();};},text:'同樣是 <b>102、105、108</b>，動畫把 <b>Y 軸起點從 0 切到 100</b>，三根長條馬上變成「<b>矮一截</b> vs <b>高一截</b>」——小小的差距被<b>放大成看起來差好幾倍</b>！再把軸<b>拉回 0</b>，你就看到真相：其實差不多高。'},
      {type:'teach',kicker:'看出手腳',title:'同一組資料，換個起點就「變了臉」',svg:truncatedCompare(),text:'左邊 Y 軸<b>從 0</b>（真相）：三根差不多高；右邊 Y 軸<b>從 100</b>（誤導）：差距被放大。資料<b>一模一樣</b>，只是換了起點。所以：<b>截斷 Y 軸</b>（不從 0 開始）是最常見的誤導招式。注意——截斷軸<b>不一定是「造假」</b>（有時為了看清小變化），但<b>拿來誇大小差距</b>就會誤導。'},
      {type:'quiz',kicker:'換你試試',title:'一張長條圖讓「A 比 B 多一點點」看起來像多很多，最可能動了什麼手腳？',options:['Y 軸沒從 0 開始','用了很多顏色','字太小','畫太大張'],answer:0,why:'截斷 Y 軸（不從 0 開始）會把微小差距在視覺上放大成一大截。',whyWrong:{1:'顏色多寡不會改變長條的長度比例。',2:'字的大小不影響長條表現出來的差距。',3:'整張圖畫大或畫小，長條之間的「比例」不會變。'}},
      {type:'quiz',kicker:'想一想',title:'看到一張長條圖，第一個要檢查的是？',options:['Y 軸起點是不是 0','圖好不好看','有沒有標題','誰畫的'],answer:0,why:'先確認基準線（Y 軸起點），長條長度才可信。截斷軸不一定是「造假」，但用來誇大小差距就會誤導。',whyWrong:{1:'好不好看是美觀，和資料有沒有被放大無關。',2:'標題有幫助，但不是「第一個」要檢查的；先看 Y 軸起點。',3:'誰畫的可以參考，但判斷圖本身，先看軸的起點與刻度。'}}
     ]},
   { id:'tricks', name:'其他圖表花招', emoji:'🎭', color:SU, sub:'面積膨脹・挑區間・比例尺・沒基準',
     done:'記得：面積膨脹、挑有利區間、比例尺不一致、沒有基準都會騙人；看圖先問：軸、範圍、單位、比例。',
     steps:[
      {type:'teach',kicker:'花招一',title:'面積膨脹：寬高都兩倍＝面積四倍',svg:areaInflate(),text:'廣告說「<b>銷量翻倍</b>」，卻畫一個<b>寬兩倍、又高兩倍</b>的大圖示。問題來了：寬×2、高×2，<b>面積</b>就變成 2×2＝<b>四倍</b>！看起來<b>遠超過「兩倍」</b>——這是用<b>面積</b>偷偷誇大數字。'},
      {type:'teach',kicker:'花招二',title:'挑區間：只給你看上漲的那幾天',svg:cherryPick(),text:'這支股票<b>整體在下跌</b>，但廣告只<b>框出中間上漲的三天</b>，就說「一直在漲」。這叫 <b>cherry-pick（挑選對自己有利的時間段）</b>：把不利的部分<b>藏起來</b>，造出一個<b>假趨勢</b>。'},
      {type:'teach',kicker:'花招三＋口訣',title:'比例尺、沒基準，還有一句看圖口訣',svg:scaleTricks(),text:'還有：<b>刻度忽寬忽窄</b>（比例尺不一致），以及<b>沒有單位、沒說「和什麼比」</b>就無法判斷。遇到任何圖表，記住一句口訣——<b>看圖先問：軸、範圍、單位、比例，對不對？</b>'},
      {type:'quiz',kicker:'換你試試',title:'廣告說「銷量翻倍」，用一個比原來寬兩倍又高兩倍的大圖示，問題在哪？',options:['面積變四倍，視覺誇大了','顏色不對','字體太大','沒問題'],answer:0,why:'長、寬各放大兩倍，面積就變成 2×2＝四倍，看起來遠超過「兩倍」。',whyWrong:{1:'顏色不是重點，問題出在圖示的面積被放大。',2:'字體大小不是這張圖誤導的原因。',3:'有問題：寬、高都兩倍會讓面積變四倍，誇大了「翻倍」。'}},
      {type:'quiz',kicker:'想一想',title:'一張圖只擷取「股價上漲的那三天」，省略前面的大跌，這叫？',options:['挑選對自己有利的時間段','誠實報導','統計平均','隨機取樣'],answer:0,why:'只擷取上漲那幾天、藏起前面的大跌，是 cherry-pick（挑有利區間），會造出假趨勢。',whyWrong:{1:'誠實報導會呈現完整期間，不會只挑上漲的三天。',2:'統計平均是把資料算成平均，不是只挑有利的片段。',3:'隨機取樣是公平地抽，不是「專挑」對自己有利的那一段。'}}
     ]},
   { id:'average', name:'平均數的陷阱', emoji:'⚖️', color:SU, sub:'極端值會把平均拉偏，中位數更貼近多數人',
     done:'記得：有極端值時，平均會被拉偏、不代表多數人；想知道「一般人」大概多少，看中位數。',
     steps:[
      {type:'teach',kicker:'先看圖',title:'九人 3 萬、老闆 100 萬，平均卻說 12.7 萬',svg:meanOutlier(),text:'一間小公司，九個人月薪 <b>3 萬</b>、老闆 <b>100 萬</b>。算平均：(9×3＋100)÷10 ＝ <b>12.7 萬</b>。可是<b>多數人根本沒這麼多</b>！問題出在：一個<b>極端高薪</b>，就把「平均」<b>往右拉</b>走了。這時<b>中位數</b>（排中間的 3 萬）才貼近多數人。'},
      {type:'teach',kicker:'什麼時候才會騙人',title:'平均不是壞東西——偏態時才要小心',svg:meanVsMedian(),text:'別誤會，<b>平均</b>很有用。只有在資料有<b>極端值（偏態）</b>時，平均才會被拉走、不代表多數人。<b>沒有極端值</b>時，平均和中位數<b>幾乎一樣</b>。所以口訣是：<b>有極端值，就改看中位數</b>。'},
      {type:'quiz',kicker:'換你試試',title:'九人月薪 3 萬、老闆 100 萬，說「平均月薪約 12.7 萬」，哪裡會誤導？',options:['平均被老闆的極端高薪拉高，多數人沒這麼多','算錯了','薪水太低','沒問題'],answer:0,why:'少數極端值（老闆 100 萬）會把平均拉偏，中位數（3 萬）才貼近多數人的情況。',whyWrong:{1:'平均其實沒算錯：(9×3＋100)÷10＝12.7 萬；問題是它被極端值拉高了。',2:'薪水高低不是題目重點，重點是平均被極端值誤導。',3:'有問題：平均被老闆的高薪拉高，不能代表多數人。'}},
      {type:'quiz',kicker:'想一想',title:'想知道「一般人／多數人」大概是多少，較不受極端值影響的是？',options:['中位數','平均數','最大值','總和'],answer:0,why:'中位數是「排中間」的值，不受少數極端值左右，較能代表多數人。',whyWrong:{1:'平均數容易被極端值拉偏，正是這題要避免的。',2:'最大值只看最高的那一個，更不能代表多數人。',3:'總和是全部加起來，不是「一般人」大概多少。'}}
     ]},
   { id:'sample', name:'樣本與以偏概全', emoji:'🔍', color:SU, sub:'樣本要夠多、要有代表性；小心倖存者偏誤',
     done:'記得：樣本太小或不具代表性，結論就不可信；還要小心只看「活下來／成功的」那群（倖存者偏誤）。',
     steps:[
      {type:'teach',kicker:'先看圖',title:'只問三個好朋友，就說「全校都…」',svg:populationSample(),text:'全校有<b>好多人</b>，可是只<b>圈到角落三個好朋友</b>來問，就下結論「<b>全校都喜歡這首歌</b>」。問題是：<b>樣本太小</b>，而且三個都是<b>同溫層</b>（想法相近），<b>推不到全校</b>。要讓結論可信，樣本要<b>夠多</b>、也要<b>有代表性</b>（各種人都問到）。'},
      {type:'teach',kicker:'另一個陷阱',title:'倖存者偏誤：只看活下來／成功的那群',svg:survivorship(),text:'還有一種偏誤最難發現：只研究「<b>飛回來的飛機</b>」「<b>成功的人</b>」，卻<b>漏掉沒回來、失敗的那一群</b>。因為失敗的常常<b>看不到</b>，我們就以為某個做法超有效——這叫<b>倖存者偏誤</b>。要問一句：<b>那些沒成功的人，去哪了？</b>'},
      {type:'quiz',kicker:'換你試試',title:'只問班上三個好朋友就說「全校都喜歡這首歌」，問題是？',options:['樣本太小又不具代表性','問太多人','問得太仔細','沒問題'],answer:0,why:'只問三個好朋友，樣本太小又都是同溫層，推不到全校。',whyWrong:{1:'問太多人反而更準，不是問題所在。',2:'問得仔細是好事；問題在「只問三個同溫層的人」。',3:'有問題：三個好朋友代表不了全校。'}},
      {type:'quiz',kicker:'想一想',title:'研究只訪問「成功的創業家」，歸納出成功祕訣，少看了什麼？',options:['那些用同樣方法卻失敗的人（倖存者偏誤）','成功者的年齡','公司名稱','訪問時間'],answer:0,why:'只看成功的人，漏掉「用同樣方法卻失敗」的人，會高估那套做法的效果，這就是倖存者偏誤。',whyWrong:{1:'成功者的年齡不是關鍵；關鍵是漏掉了失敗的那群人。',2:'公司名稱和結論可不可信無關。',3:'訪問時間不是重點；重點是只訪問了「活下來的成功者」。'}}
     ]},
   { id:'causation', name:'相關不等於因果', emoji:'🔗', color:SU, sub:'一起變≠互相造成；想想第三個共同原因',
     done:'記得：一起變只是相關，不代表誰造成誰；先想共同原因、反向、巧合，因果要靠公平實驗。',
     steps:[
      {type:'teach',kicker:'先看動畫',title:'新聞標題：冰淇淋賣越多，溺水越多？',svg:animCanvas(300,220,'冰淇淋銷量對溺水人數的散布圖呈正相關，接著浮現共同原因「氣溫」的方框，箭頭同時指向兩個軸，提示相關不等於因果'),mount:function(host){var h=window.Anim.scatterTrend(host,{r:'pos',xLabel:'冰淇淋銷量',yLabel:'溺水人數',confound:{label:'氣溫',on:true}});return function(){h.stop();};},text:'有則新聞標題寫：「<b>冰淇淋賣越多，溺水人數也越多</b>！」散布圖確實<b>正相關</b>。但吃冰淇淋會<b>害人溺水</b>嗎？當然不會。動畫浮現真正的<b>共同原因：氣溫</b>——天氣熱，<b>吃冰的人多</b>、<b>去玩水的人也多</b>。兩件事<b>一起變</b>只是<b>相關</b>，不代表一個<b>造成</b>另一個。'},
      {type:'teach',kicker:'三種可能',title:'看起來像因果，其實有三種情況',svg:threeFakeCause(),text:'兩件事「一起變」，背後可能是：①<b>共同原因</b>（有個第三因素同時影響兩者，像氣溫）；②<b>反向因果</b>（其實是 B 造成 A，被講反了）；③<b>純屬巧合</b>（剛好一起動，沒有關係）。所以看到相關，<b>先別急著說誰造成誰</b>。'},
      {type:'teach',kicker:'怎麼確認',title:'要證明因果，得做公平實驗',svg:controlExperiment(),text:'想真的確認「<b>A 造成 B</b>」，要做<b>控制變因的公平實驗</b>：兩組<b>其他條件都一樣</b>，只差<b>有沒有做 A</b>，再比較結果。<b>光有相關不夠</b>，還要有<b>合理的機制</b>說明為什麼 A 會影響 B。'},
      {type:'quiz',kicker:'換你試試',title:'夏天「冰淇淋賣越多，溺水越多」，最合理的解釋是？',options:['天氣熱同時讓人吃冰、也讓人去玩水（共同原因）','吃冰會害人溺水','溺水讓人想吃冰','純屬迷信'],answer:0,why:'氣溫（夏天）是背後的共同原因：天熱讓吃冰和玩水都變多，兩者相關但沒有互為因果。',whyWrong:{1:'吃冰淇淋不會害人溺水，這是把「相關」誤當成「因果」。',2:'溺水也不會讓人想吃冰；方向相反一樣站不住腳。',3:'這不是迷信，有共同原因（氣溫）可以解釋。'}},
      {type:'quiz',kicker:'想一想',title:'看到兩件事「一起變多」，正確的態度是？',options:['先想有沒有第三個共同原因或巧合，別急著說誰造成誰','直接斷定前者造成後者','兩者一定無關','一定是巧合'],answer:0,why:'相關只是線索；因果要排除共同原因、反向因果與巧合，最好有控制變因的公平實驗。',whyWrong:{1:'一起變多只是相關，直接斷定因果容易出錯。',2:'一起變多代表「可能有關」，不能說一定無關。',3:'有時是巧合，但也可能有共同原因；不能一口咬定「一定是巧合」。'}}
     ]}
  ]
};

})();
