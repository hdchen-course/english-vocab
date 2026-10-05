/* =====================================================================
 * math_advanced_concepts.ts  →  (tsc, tsconfig.legacy.json) →  math_advanced_concepts.js
 * 「進階數學觀念養成」教學頁（國中→高中關卡的 teach-first 動畫觀念頁）。
 *   補齊 math_advanced.html（18 關、只有幾行 keyFacts）的「越難越沒鷹架」結構缺口。
 *   資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）。
 *   動畫課重用 anim_core.js 的 window.Anim.funcPlot / trigTriangle（本頁與其他 spec 共用、
 *   參數化、不重造輪子）；面積模型／數列／科學記號／證明用 stepped SVG（第 2 級 VIZ）。
 *   以 IIFE 包住讓 SVG helper 為檔案區域（避免與其他遷移頁同名頂層 helper 在 tsconfig.legacy
 *   共用全域型別檢查時 TS2393 衝突）。純本地進度（progKey），不餵主 XP。
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
// 圈號（①②③④）小標記。
function badge(x, y, n, color) {
  return '<circle cx="' + x + '" cy="' + y + '" r="9" fill="' + color + '"/>' +
    '<text x="' + x + '" y="' + (y + 4) + '" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">' + n + '</text>';
}

// ---- 色盤（亮暗雙主題皆清楚；文字結構線用 currentColor＝--ink）----
var CX2 = '#2563eb';   // x² 區
var CAX = '#0891b2';   // a·x / b·x 區
var CB = '#16a34a';
var CAB = '#e11d48';   // 常數項 ab 區

// ---- 課1：因式分解＝面積拼圖 --------------------------------------
// teach①：(x+2)(x+3) 面積模型，四塊逐塊標記。
function areaModel() {
  var x0 = 44, y0 = 24, xW = 92, aW = 34, xH = 92, bH = 46;
  var inner = '';
  // 四塊。
  inner += '<rect x="' + x0 + '" y="' + y0 + '" width="' + xW + '" height="' + xH + '" fill="' + CX2 + '" fill-opacity="0.20" stroke="' + CX2 + '" stroke-width="1.5"/>';
  inner += '<rect x="' + (x0 + xW) + '" y="' + y0 + '" width="' + aW + '" height="' + xH + '" fill="' + CAX + '" fill-opacity="0.22" stroke="' + CAX + '" stroke-width="1.5"/>';
  inner += '<rect x="' + x0 + '" y="' + (y0 + xH) + '" width="' + xW + '" height="' + bH + '" fill="' + CB + '" fill-opacity="0.20" stroke="' + CB + '" stroke-width="1.5"/>';
  inner += '<rect x="' + (x0 + xW) + '" y="' + (y0 + xH) + '" width="' + aW + '" height="' + bH + '" fill="' + CAB + '" fill-opacity="0.22" stroke="' + CAB + '" stroke-width="1.5"/>';
  // 區內文字。
  inner += '<text x="' + (x0 + xW / 2) + '" y="' + (y0 + xH / 2 + 5) + '" text-anchor="middle" font-size="18" font-weight="800" fill="' + CX2 + '">x²</text>';
  inner += '<text x="' + (x0 + xW + aW / 2) + '" y="' + (y0 + xH / 2 + 4) + '" text-anchor="middle" font-size="13" font-weight="800" fill="' + CAX + '">2x</text>';
  inner += '<text x="' + (x0 + xW / 2) + '" y="' + (y0 + xH + bH / 2 + 4) + '" text-anchor="middle" font-size="13" font-weight="800" fill="' + CB + '">3x</text>';
  inner += '<text x="' + (x0 + xW + aW / 2) + '" y="' + (y0 + xH + bH / 2 + 4) + '" text-anchor="middle" font-size="12" font-weight="800" fill="' + CAB + '">6</text>';
  // 圈號。
  inner += badge(x0 + 13, y0 + 13, '①', CX2) + badge(x0 + xW + aW - 11, y0 + 13, '②', CAX);
  inner += badge(x0 + 13, y0 + xH + bH - 12, '③', CB) + badge(x0 + xW + aW - 11, y0 + xH + bH - 12, '④', CAB);
  // 邊長標記。
  inner += '<text x="' + (x0 + xW / 2) + '" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">x</text>';
  inner += '<text x="' + (x0 + xW + aW / 2) + '" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">2</text>';
  inner += '<text x="' + (x0 - 12) + '" y="' + (y0 + xH / 2 + 4) + '" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">x</text>';
  inner += '<text x="' + (x0 - 12) + '" y="' + (y0 + xH + bH / 2 + 4) + '" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">3</text>';
  // 總和（兩行，避免單行太寬被裁切）。
  inner += '<text x="105" y="' + (y0 + xH + bH + 18) + '" text-anchor="middle" font-size="10.5" font-weight="800" fill="currentColor">(x+2)(x+3) = x² + 2x + 3x + 6</text>';
  inner += '<text x="105" y="' + (y0 + xH + bH + 36) + '" text-anchor="middle" font-size="12.5" font-weight="800" fill="' + CX2 + '">= x² + 5x + 6</text>';
  return svg('210 214', inner, '長方形面積模型：邊長 (x+2) 乘 (x+3)，拆成四塊 x²、2x、3x、6，加起來是 x²+5x+6');
}
// teach②：反過來「湊面積」＝因式分解（找兩數相乘＝6、相加＝5）。
function factorSearch() {
  var inner = '';
  inner += '<text x="105" y="22" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">因式分解 x² + 5x + 6</text>';
  inner += badge(22, 48, '①', CAX);
  inner += '<text x="38" y="52" font-size="12" font-weight="700" fill="currentColor">先找「相乘 ＝ 6」的兩數：</text>';
  inner += '<text x="40" y="74" font-size="12.5" font-weight="800" fill="currentColor">1 × 6 &#160;&#160;&#160; 2 × 3</text>';
  inner += badge(22, 100, '②', CB);
  inner += '<text x="38" y="104" font-size="12" font-weight="700" fill="currentColor">再看哪一組「相加 ＝ 5」：</text>';
  inner += '<rect x="36" y="116" width="60" height="24" rx="6" fill="' + CB + '" fill-opacity="0.18" stroke="' + CB + '" stroke-width="1.5"/>';
  inner += '<text x="66" y="133" text-anchor="middle" font-size="12.5" font-weight="800" fill="' + CB + '">2 + 3 = 5 ✓</text>';
  inner += '<text x="150" y="133" font-size="11.5" font-weight="700" fill="currentColor">(1+6=7 ✗)</text>';
  inner += badge(22, 160, '③', CAB);
  inner += '<text x="38" y="164" font-size="12.5" font-weight="800" fill="' + CAB + '">所以 = (x + 2)(x + 3)</text>';
  return svg('210 180', inner, '因式分解步驟：先找相乘等於6的兩數1×6、2×3，再挑相加等於5的那組2和3，得到(x+2)(x+3)');
}

// ---- 課6：數列的規律 ----------------------------------------------
function seqArith() {
  var inner = '';
  var nums = [2, 5, 8, 11, 14];
  var xs = [26, 70, 114, 158, 202];
  inner += '<text x="120" y="20" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">等差數列：每次 ＋3</text>';
  for (var i = 0; i < nums.length; i++) {
    var isLast = (i === nums.length - 1);
    var col = isLast ? CAB : CX2;
    inner += '<rect x="' + (xs[i] - 17) + '" y="48" width="34" height="34" rx="7" fill="' + col + '" fill-opacity="0.18" stroke="' + col + '" stroke-width="1.6"/>';
    inner += '<text x="' + xs[i] + '" y="70" text-anchor="middle" font-size="15" font-weight="800" fill="' + col + '">' + nums[i] + '</text>';
    if (i < nums.length - 1) {
      var mx = (xs[i] + xs[i + 1]) / 2;
      inner += '<path d="M' + (xs[i] + 18) + ' 42 Q ' + mx + ' 24 ' + (xs[i + 1] - 18) + ' 42" fill="none" stroke="' + CB + '" stroke-width="1.6"/>';
      inner += '<text x="' + mx + '" y="34" text-anchor="middle" font-size="11" font-weight="800" fill="' + CB + '">+3</text>';
    }
  }
  inner += '<text x="202" y="100" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + CAB + '">第5項</text>';
  inner += '<text x="120" y="122" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">第 n 項 ＝ 首項 ＋ (n − 1) × 公差</text>';
  return svg('244 134', inner, '等差數列2、5、8、11、14，相鄰兩項都差+3，第5項是14；第n項=首項+(n-1)×公差');
}
function seqGeo() {
  var inner = '';
  var nums = [3, 6, 12, 24];
  var xs = [34, 90, 150, 212];
  inner += '<text x="120" y="20" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">等比數列：每次 ×2</text>';
  for (var i = 0; i < nums.length; i++) {
    inner += '<rect x="' + (xs[i] - 18) + '" y="48" width="36" height="34" rx="7" fill="' + CAX + '" fill-opacity="0.18" stroke="' + CAX + '" stroke-width="1.6"/>';
    inner += '<text x="' + xs[i] + '" y="70" text-anchor="middle" font-size="15" font-weight="800" fill="' + CAX + '">' + nums[i] + '</text>';
    if (i < nums.length - 1) {
      var mx = (xs[i] + xs[i + 1]) / 2;
      inner += '<path d="M' + (xs[i] + 19) + ' 42 Q ' + mx + ' 24 ' + (xs[i + 1] - 19) + ' 42" fill="none" stroke="' + CAB + '" stroke-width="1.6"/>';
      inner += '<text x="' + mx + '" y="34" text-anchor="middle" font-size="11" font-weight="800" fill="' + CAB + '">×2</text>';
    }
  }
  inner += '<text x="120" y="110" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">等差「一直加」、等比「一直乘」</text>';
  return svg('244 122', inner, '等比數列3、6、12、24，相鄰兩項都是乘2的關係');
}

// ---- 課7：科學記號（估算脈絡下的簡短複習）------------------------
// 底部加 cross-link 回主場 math_concepts（勿與主場逐字重複）。
function sciBig() {
  var inner = '';
  inner += '<text x="120" y="20" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">300000 寫成科學記號</text>';
  inner += '<text x="120" y="58" text-anchor="middle" font-size="22" font-weight="800" fill="currentColor">3<tspan fill="' + CAB + '">00000.</tspan></text>';
  inner += '<path d="M196 66 Q 150 92 108 66" fill="none" stroke="' + CAB + '" stroke-width="1.8"/>';
  inner += '<polygon points="108,66 114,62 114,71" fill="' + CAB + '"/>';
  inner += '<text x="150" y="92" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + CAB + '">小數點左移 5 位</text>';
  inner += '<text x="120" y="118" text-anchor="middle" font-size="18" font-weight="800" fill="' + CX2 + '">= 3 × 10⁵</text>';
  var link = '<div style="text-align:center;margin-top:6px"><a href="math_concepts.html" style="font-size:var(--fs-small);font-weight:800;color:var(--su);text-decoration:underline">想從頭學？→ 看「科學記號」完整觀念（math_concepts）</a></div>';
  return svg('240 130', inner, '把300000的小數點往左移5位，寫成3×10的5次方') + link;
}
function sciSmall() {
  var inner = '';
  inner += '<text x="120" y="20" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">2.5 × 10⁻³ 等於多少</text>';
  inner += '<text x="120" y="58" text-anchor="middle" font-size="20" font-weight="800" fill="currentColor"><tspan fill="' + CAB + '">0.00</tspan>2<tspan fill="' + CAB + '">5</tspan></text>';
  inner += '<path d="M150 66 Q 120 92 92 66" fill="none" stroke="' + CAB + '" stroke-width="1.8"/>';
  inner += '<polygon points="92,66 98,62 98,71" fill="' + CAB + '"/>';
  inner += '<text x="120" y="92" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + CAB + '">負次方 → 小數點左移 3 位（變小）</text>';
  inner += '<text x="120" y="118" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">a × 10ⁿ 的 a 一定在 1～10 之間（1 ≤ |a| &lt; 10）</text>';
  return svg('240 130', inner, '2.5乘10的負3次方，小數點往左移3位變成0.0025');
}

// ---- 課8：證明的味道 ----------------------------------------------
function proofExamples() {
  var inner = '';
  inner += '<text x="130" y="20" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">舉例 ≠ 證明</text>';
  var ex = ['2 + 4 = 6', '6 + 8 = 14', '10 + 2 = 12'];
  for (var i = 0; i < ex.length; i++) {
    var y = 42 + i * 26;
    inner += '<text x="30" y="' + y + '" font-size="12.5" font-weight="700" fill="currentColor">' + ex[i] + '</text>';
    inner += '<text x="128" y="' + y + '" font-size="12.5" font-weight="800" fill="' + CB + '">偶數 ✓</text>';
  }
  inner += '<rect x="22" y="124" width="236" height="34" rx="8" fill="' + CAB + '" fill-opacity="0.12" stroke="' + CAB + '" stroke-width="1.4"/>';
  inner += '<text x="140" y="139" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + CAB + '">找再多例子都還不夠……</text>';
  inner += '<text x="140" y="153" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + CAB + '">要對「所有偶數」都成立才算證明</text>';
  return svg('280 168', inner, '即使找到很多偶數相加都是偶數的例子，也不算證明，必須對所有情形都成立');
}
function proofChain() {
  var inner = '';
  inner += '<text x="150" y="18" text-anchor="middle" font-size="12.5" font-weight="800" fill="currentColor">證明：任兩偶數相加還是偶數</text>';
  var boxes = [
    ['① 已知', '偶數 = 2m、2n', CX2],
    ['② 理由', '2m + 2n = 2(m + n)', CAX],
    ['③ 所以', '是 2 的倍數 → 偶數', CAB]
  ];
  var y = 34;
  for (var i = 0; i < boxes.length; i++) {
    inner += '<rect x="40" y="' + y + '" width="220" height="34" rx="8" fill="' + boxes[i][2] + '" fill-opacity="0.14" stroke="' + boxes[i][2] + '" stroke-width="1.5"/>';
    inner += '<text x="54" y="' + (y + 21) + '" font-size="11.5" font-weight="800" fill="' + boxes[i][2] + '">' + boxes[i][0] + '</text>';
    inner += '<text x="112" y="' + (y + 21) + '" font-size="12.5" font-weight="800" fill="currentColor">' + boxes[i][1] + '</text>';
    if (i < boxes.length - 1) {
      inner += '<path d="M150 ' + (y + 34) + ' L150 ' + (y + 46) + '" stroke="currentColor" stroke-width="2"/>';
      inner += '<polygon points="150,' + (y + 48) + ' 146,' + (y + 42) + ' 154,' + (y + 42) + '" fill="currentColor"/>';
    }
    y += 48;
  }
  return svg('300 184', inner, '推理鏈：已知偶數是2m、2n，理由是2m+2n=2(m+n)，所以是2的倍數也就是偶數');
}

window.CONCEPT = {
  progKey: 'math_advanced_concepts_v1', practiceHref: 'math_advanced.html',
  lessons: [
   { id:'factor_area', name:'因式分解＝面積拼圖', emoji:'🧩', color:'#2563eb', sub:'乘開＝拼面積、因式分解＝湊面積',
     done:'記得：乘開＝拼面積、因式分解＝湊面積；找「相乘＝常數、相加＝中間係數」的兩數。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'(x+2)(x+3) 就是一塊長方形的面積',svg:areaModel(),text:'把 <b>(x+2)</b> 當長方形的<b>寬</b>、<b>(x+3)</b> 當<b>高</b>，整塊面積就被切成<b>四小塊</b>：大正方形 <b>x²</b>、兩條長方形 <b>2x</b> 和 <b>3x</b>、小方塊 <b>6</b>。全部加起來＝<b>x² + 5x + 6</b>。這就是「乘開」在做的事——<b>拼面積</b>。'},
      {type:'teach',kicker:'反過來想',title:'因式分解就是「湊回那塊面積」',svg:factorSearch(),text:'<b>因式分解</b>是把 <b>x² + 5x + 6</b> 拆回 <b>(x+2)(x+3)</b>。訣竅：先找<b>相乘＝常數項（6）</b>的兩個數，再從中挑<b>相加＝中間係數（5）</b>的那一組——答案是 <b>2 和 3</b>。'},
      {type:'quiz',kicker:'換你試試',title:'x² + 7x + 12 分解成？',eq:'x² + 7x + 12',options:['(x+3)(x+4)','(x+2)(x+6)','(x+1)(x+12)','(x+5)(x+7)'],answer:0,why:'找相乘＝12、相加＝7 的兩數：3×4＝12、3+4＝7，所以是 (x+3)(x+4)。',whyWrong:{1:'2×6＝12 沒錯，但 2+6＝8，不是 7。',2:'1×12＝12，但 1+12＝13，不是 7。',3:'5×7＝35，根本不等於 12（而且 5+7 才等於 12）。'}},
      {type:'quiz',kicker:'想一想',title:'(x+5)(x−2) 乘開後的常數項是多少？',options:['−10','+10','+3','−3'],answer:0,why:'常數項＝兩個數相乘：5 ×(−2)＝−10。有一個是負數，乘出來就是負的。',whyWrong:{1:'忽略了負號：5 ×(−2) 是 −10，不是 +10。',2:'+3 是中間項的係數（5+(−2)＝3），常數項要用相乘，不是相加。',3:'常數項是兩數相乘＝5×(−2)＝−10，不是 −3。'}}
     ]},
   { id:'slope', name:'座標與斜率：直線怎麼跑', emoji:'📈', color:'#2563eb', sub:'斜率＝每往右 1 格上升幾格',
     done:'記得：斜率＝往右 1 格上升幾格；正的往上爬、負的往下滑。',
     steps:[
      {type:'teach',kicker:'先看動畫',title:'描點、連線，看直線怎麼長出來',svg:animCanvas(300,230,'在直角坐標系描出 y=2x+1 上的點、連成直線，再用右1上2的直角三角形示意斜率'),mount:function(host){var h=window.Anim.funcPlot(host,{kind:'linear',m:2,b:1,highlight:'slope'});return function(){h.stop();};},text:'一個點用 <b>(x, y)</b> 定位：先看<b>右／左</b>、再看<b>上／下</b>。把直線上的點連起來，就看出它怎麼跑。<b>斜率</b>就是「每往右 <b>1</b> 格，就<b>上升幾格</b>」。圖中的線每往右 1 格上升 <b>2</b> 格，所以斜率是 <b>2</b>（紅色直角三角形）。'},
      {type:'quiz',kicker:'換你試試',title:'一條直線每往右 1 格就上升 3 格，斜率是多少？',options:['3','1/3','−3','13'],answer:0,why:'斜率＝上升量 ÷ 水平量＝3 ÷ 1＝3。',whyWrong:{1:'剛好相反了：斜率是「上升 ÷ 水平」＝3÷1＝3，不是 1÷3。',2:'上升是正的（往上），斜率不會是負的；每往右上升 3 格就是 +3。',3:'這是把 1 和 3 拼成「13」了；斜率要相除＝3÷1＝3。'}},
      {type:'quiz',kicker:'想一想',title:'斜率是負的，這條直線往右會怎麼走？',options:['往右越走越低（下降）','往右越走越高（上升）','完全水平不動','變成一個圓'],answer:0,why:'斜率是負的，代表每往右 1 格就「下降」，所以往右越走越低。',whyWrong:{1:'那是正斜率。負斜率是往右「下降」。',2:'完全水平是斜率等於 0；負斜率會往右下降，不是不動。',3:'直線永遠是直的，不會變成圓；負斜率只是讓它往右下降。'}}
     ]},
   { id:'linear_fn', name:'線性函數 y = mx + b', emoji:'📐', color:'#2563eb', sub:'m 管斜度、b 管和 y 軸相交的高度',
     done:'記得：y=mx+b 裡 m 管斜度、b 管和 y 軸相交的高度。',
     steps:[
      {type:'teach',kicker:'先看動畫',title:'改 b 線上下移、改 m 線變陡',svg:animCanvas(300,230,'先把截距 b 從0升到2讓直線往上平移，再把斜率 m 從1變2讓直線變陡'),mount:function(host){var h=window.Anim.funcPlot(host,{kind:'linear',highlight:'intercept'});return function(){h.stop();};},text:'一條直線可以寫成 <b>y = mx + b</b>：<b>m</b> 是<b>斜率</b>（陡不陡）、<b>b</b> 是<b>截距</b>（線和 <b>y 軸相交的高度</b>）。動畫先把 <b>b 從 0 升到 2</b>，整條線<b>往上平移</b>；再把 <b>m 從 1 變 2</b>，線<b>繞著截距變陡</b>。'},
      {type:'quiz',kicker:'換你試試',title:'y = 2x + 3 這條線和 y 軸相交在哪裡？',eq:'y = 2x + 3',options:['(0, 3)','(3, 0)','(0, 2)','(2, 3)'],answer:0,why:'線交 y 軸時 x＝0，代入得 y＝2×0+3＝3，所以是 (0, 3)。截距 b 就是那個 3。',whyWrong:{1:'這是把 (0, 3) 的座標對調了；交 y 軸時 x 一定要是 0，代入得 (0, 3)。',2:'2 是斜率 m，不是截距；截距是 b＝3。',3:'(2, 3) 不在這條線的交點上；交 y 軸時 x 一定是 0，不是 2。'}},
      {type:'quiz',kicker:'想一想',title:'y = −x + 1 的斜率是多少？',eq:'y = −x + 1',options:['−1','1','0','−x'],answer:0,why:'y=mx+b 裡 x 前面的係數就是斜率 m。−x 等於 −1·x，所以斜率是 −1。',whyWrong:{1:'少看了負號：−x 的係數是 −1，不是 1。',2:'0 是沒有斜度（水平線），但這條線有 −1 的斜率。',3:'斜率是一個數字，不是 −x 本身；−x 的係數 −1 才是斜率。'}}
     ]},
   { id:'vertex', name:'二次函數的頂點', emoji:'🎢', color:'#2563eb', sub:'拋物線的最高／最低點：x＝−b/(2a)',
     done:'記得：頂點 x＝−b/(2a)；a>0 碗朝上（最低點）、a<0 碗朝下（最高點）。',
     steps:[
      {type:'teach',kicker:'先看動畫',title:'拋物線的頂點長在哪裡',svg:animCanvas(300,230,'描出拋物線 y=x²−4x+3，落下對稱軸 x=2，標出頂點(2,−1)'),mount:function(host){var h=window.Anim.funcPlot(host,{kind:'quadratic',a:1,b:-4,c:3,highlight:'vertex'});return function(){h.stop();};},text:'<b>y = ax² + bx + c</b> 畫出來是一條<b>拋物線</b>。<b>a &gt; 0</b> 開口<b>向上</b>（像碗），有一個<b>最低點</b>；<b>a &lt; 0</b> 開口<b>向下</b>，有一個<b>最高點</b>。這個轉折點叫<b>頂點</b>，它的 x 座標＝<b>−b ÷ (2a)</b>，代回去就得到 y。圖中 y=x²−4x+3 的頂點是 <b>(2, −1)</b>，<b>對稱軸</b>就是過頂點的那條鉛直線 x＝2。'},
      {type:'quiz',kicker:'換你試試',title:'y = x² − 4x + 3 的頂點 x 座標是多少？',eq:'x = −b ÷ (2a)',options:['2','−2','4','−4'],answer:0,why:'這裡 a＝1、b＝−4，頂點 x＝−b/(2a)＝−(−4)/(2×1)＝4/2＝2。',whyWrong:{1:'符號弄反了：−(−4) 是 +4，所以 x＝+2，不是 −2。',2:'4 是 −b 的值，還要再除以 2a＝2，得到 2。',3:'−4 是 b 本身的值；頂點 x 要用 −b/(2a)＝2，不是直接拿 b。'}},
      {type:'quiz',kicker:'想一想',title:'當 a < 0 時，拋物線的頂點是最高還是最低點？',options:['最高點（開口向下）','最低點（開口向上）','沒有頂點','既不是最高也不是最低'],answer:0,why:'a<0 開口向下，像倒過來的碗，頂點在最上面，所以是最高點。',whyWrong:{1:'開口向上（最低點）是 a>0 的情況。a<0 剛好相反。',2:'拋物線一定有一個轉折的頂點；a<0 時那個頂點是最高點。',3:'頂點一定是最高或最低其中之一；a<0 開口向下，頂點是最高點。'}}
     ]},
   { id:'trig', name:'三角比 SOH-CAH-TOA', emoji:'📐', color:'#2563eb', sub:'sin＝對/斜、cos＝鄰/斜、tan＝對/鄰',
     done:'記得：sin＝對/斜、cos＝鄰/斜、tan＝對/鄰（SOH-CAH-TOA）。',
     steps:[
      {type:'teach',kicker:'先看動畫',title:'三角比就是直角三角形三邊的比',svg:animCanvas(300,220,'直角三角形的角θ從小長到約37度，標出對邊3、鄰邊4、斜邊5與三個三角比'),mount:function(host){var h=window.Anim.trigTriangle(host,{angleDeg:37,show:'all'});return function(){h.stop();};},text:'在<b>直角三角形</b>裡，對著角 θ 的那一邊叫<b>對邊</b>、挨著角 θ 的叫<b>鄰邊</b>、最長的斜斜那條叫<b>斜邊</b>。三個比值用口訣 <b>SOH-CAH-TOA</b> 記：<b>sin＝對/斜</b>、<b>cos＝鄰/斜</b>、<b>tan＝對/鄰</b>。圖中是 <b>3-4-5</b> 直角三角形：sin θ＝3/5、cos θ＝4/5、tan θ＝3/4。'},
      {type:'quiz',kicker:'換你試試',title:'直角三角形中，對邊 3、斜邊 5，sin θ 等於多少？',options:['3/5','5/3','4/5','3/4'],answer:0,why:'SOH：sin＝對 ÷ 斜＝3 ÷ 5＝3/5。',whyWrong:{1:'分子分母反了：sin 是「對/斜」，不是「斜/對」。',2:'4/5 是 cos（鄰/斜），不是 sin。',3:'3/4 是 tan（對/鄰），不是 sin（對/斜）。'}},
      {type:'quiz',kicker:'想一想',title:'tan θ 是哪兩邊的比？',options:['對邊 ÷ 鄰邊','對邊 ÷ 斜邊','鄰邊 ÷ 斜邊','斜邊 ÷ 對邊'],answer:0,why:'TOA：tan＝對 ÷ 鄰。',whyWrong:{1:'對/斜 是 sin。',2:'鄰/斜 是 cos。',3:'斜/對 不是任何一個三角比；tan 是「對/鄰」。'}}
     ]},
   { id:'sequence', name:'數列的規律：找出下一項', emoji:'🔢', color:'#2563eb', sub:'等差一直加、等比一直乘',
     done:'記得：等差「一直加」、等比「一直乘」；第 n 項＝首項＋(n−1)×公差。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'等差：每次加同一個數',svg:seqArith(),text:'<b>等差數列</b>的祕密是：<b>每一次都加同一個數</b>（叫<b>公差 d</b>）。2、5、8、11…… 每次都 <b>+3</b>，所以下一項是 11+3＝<b>14</b>。要跳到很後面可以用公式：<b>第 n 項＝首項 ＋ (n − 1) × 公差</b>。'},
      {type:'teach',kicker:'另一種規律',title:'等比：每次乘同一個數',svg:seqGeo(),text:'<b>等比數列</b>則是<b>每次乘同一個數</b>（叫<b>公比 r</b>）。3、6、12、24…… 每次都 <b>×2</b>。分辨訣竅：看相鄰兩項是「<b>差</b>固定」（等差）還是「<b>倍數</b>固定」（等比）。'},
      {type:'quiz',kicker:'換你試試',title:'2, 5, 8, 11, … 第 5 項是多少？',options:['14','15','13','16'],answer:0,why:'公差是 3，第 4 項 11 再 +3＝14（也可用首項2＋(5−1)×3＝2+12＝14）。',whyWrong:{1:'多加了一次：11 只要再 +3 一次＝14，不是加到 15。',2:'少加了：第 4 項 11 要再 +3＝14，13 還差一步。',3:'加太多了：11 只要再 +3 一次＝14，16 是又多加了。'}},
      {type:'quiz',kicker:'想一想',title:'3, 6, 12, 24 是等差還是等比？',options:['等比（每次乘 2）','等差（每次加 3）','既不是等差也不是等比','兩者都是'],answer:0,why:'相鄰兩項是「倍數固定」：6是3的2倍、12是6的2倍……每次 ×2，所以是等比。',whyWrong:{1:'差不固定（+3、+6、+12 都不同），所以不是等差；倍數才固定。',2:'其實有規律：每一項都是前一項的 2 倍（固定倍數），所以是等比。',3:'差不固定，不符合等差；只符合等比（每次 ×2）一種。'}}
     ]},
   { id:'sci_notation', name:'科學記號：很大很小的數怎麼寫', emoji:'🔬', color:'#2563eb', sub:'估算時把數寫成 a × 10ⁿ',
     done:'記得：科學記號＝一個 1 以上、小於 10 的數 × 10 的次方；次方正右移、負左移。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'很大的數：往左數幾位',svg:sciBig(),text:'遇到<b>很大或很小</b>的數要<b>估算</b>時，先寫成 <b>a × 10ⁿ</b>（a 在 <b>1～10</b> 之間）。300000 把小數點<b>往左移 5 位</b>到 3 後面，就是 <b>3 × 10⁵</b>——一眼看出它「大約是 3 的十萬倍」。'},
      {type:'teach',kicker:'負次方',title:'很小的數：次方是負的',svg:sciSmall(),text:'<b>10 的次方</b>＝小數點搬幾位：<b>×10³</b> 右移 3 位（變大）、<b>×10⁻³</b> 左移 3 位（變小）。所以 2.5 × 10⁻³＝<b>0.0025</b>。記得 a 永遠是 1 以上、小於 10 的數，這樣估算最方便。'},
      {type:'quiz',kicker:'換你試試',title:'300000 寫成科學記號是？',options:['3 × 10⁵','3 × 10⁶','30 × 10⁴','3 × 10⁻⁵'],answer:0,why:'小數點從最後往左移到 3 後面，共移 5 位，所以是 3 × 10⁵。',whyWrong:{1:'數錯位數了：300000 往左移是 5 位，不是 6 位。',2:'a 要是 1 以上、小於 10 的數，30 太大；應寫成 3 × 10⁵。',3:'負次方代表很小的數（0.00003）；300000 很大，要用正次方 10⁵。'}},
      {type:'quiz',kicker:'想一想',title:'2.5 × 10⁻³ 等於多少？',eq:'2.5 × 10⁻³',options:['0.0025','2500','0.025','25000'],answer:0,why:'負次方表示變小：小數點從 2.5 往左移 3 位＝0.0025。',whyWrong:{1:'負次方是「變小」，不是變大；2500 是 ×10³（正次方）的結果。',2:'移錯位數了：10⁻³ 要往左移 3 位＝0.0025，不是移 2 位。',3:'負次方是變小，不是變大；25000 的方向完全反了。'}}
     ]},
   { id:'proof', name:'證明的味道：為什麼要證', emoji:'🕵️', color:'#2563eb', sub:'舉例只能找反例，證明是每一步都有理由',
     done:'記得：舉例只能找反例、不能當證明；證明是「每一步都有理由」的推理鏈。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'舉例再多，也可能有反例',svg:proofExamples(),text:'找到 2+4、6+8、10+2 都是偶數，<b>看起來</b>「任兩偶數相加都是偶數」。但<b>舉例再多也不算證明</b>——說不定還有你沒試到的反例。數學要<b>對「所有」情形都成立</b>才算數。'},
      {type:'teach',kicker:'怎麼才算證明',title:'用「已知 → 理由 → 所以」連起來',svg:proofChain(),text:'真正的<b>證明</b>是像偵探一樣<b>一步步推</b>：把兩個偶數寫成 <b>2m、2n</b>（<b>已知</b>），算出 2m+2n＝<b>2(m+n)</b>（<b>理由</b>），所以它是 2 的倍數、也就是偶數（<b>所以</b>）。這對<b>任何</b>偶數都成立，才真的證明了。'},
      {type:'quiz',kicker:'換你試試',title:'找到 3 組「偶數＋偶數＝偶數」的例子，就證明了「任兩偶數相加為偶數」嗎？',options:['還沒，舉例不是證明','是，試 3 次就夠了','是，只要有一個例子就夠','永遠無法證明'],answer:0,why:'舉例只能幫我們「相信」或找反例，不能當證明；要對所有偶數都成立（像用 2m+2n=2(m+n) 推理）才算。',whyWrong:{1:'試幾次都只是例子，不保證所有情形；必須用推理涵蓋全部。',2:'一個例子更不夠：單一例子連規律都難確定，更不能當證明。',3:'其實可以證明——用 2m+2n=2(m+n) 就對所有偶數成立。'}},
      {type:'quiz',kicker:'想一想',title:'證明的每一步都需要什麼？',options:['一個站得住腳的理由（根據定義或已知）','一張漂亮的圖','越多例子越好','一個大膽的猜測'],answer:0,why:'證明的每一步都要有「為什麼對」的理由——根據定義、已知條件或前面已證的結果，環環相扣。',whyWrong:{1:'圖可以幫忙理解，但不能取代每一步的理由。',2:'例子不是理由；證明靠的是推理，不是例子的數量。',3:'猜測只是起點，還要用理由證明它；大膽的猜測本身不是證明的一步。'}}
     ]}
  ]
};

})();
