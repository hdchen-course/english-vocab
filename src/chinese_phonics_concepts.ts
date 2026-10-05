/* =====================================================================
 * chinese_phonics_concepts.ts  →  (tsc, tsconfig.legacy.json) →  chinese_phonics_concepts.js
 * 注音拼讀啟蒙頁的教學資料（window.CONCEPT）＋專用 SVG 概念圖 helper。
 * 識字前置關卡（zero-start literacy gate），排在 chinese_concepts.html 之前。
 * 載入順序：game_core.js → 本檔 → anim_core.js → concept_engine.js
 *   （本檔提供 window.CONCEPT；PLAYABLE teach 的 mount 於執行期才用 window.Anim，
 *    故解析順序無虞——比照 earth_science_concepts.ts）。
 * 以 IIFE 包住：讓 helper 函式為檔案區域（避免與其他已遷移頁的同名 helper 如
 *   animCanvas 在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）；helper 只在建
 *   window.CONCEPT 時同步呼叫，動畫 mount 回傳的 cleanup 由 concept_engine 處理。
 * 注音正確性第一（台灣教育部標準）：一聲不標調號，絕不用 ˉ 橫號。
 * ===================================================================== */
(function () {
// ---- 注音專用 SVG 概念圖（資訊文字 fill=currentColor 隨主題變色；結構線 currentColor + 透明度）----
var AC = '#b91c1c';
// 三個功能分區的半透明底色（深淺主題皆安全：半透明疊在卡片底色上，文字用 currentColor 自適應）
var TINT_SHENG = 'rgba(185,28,28,0.12)';   // 聲母（紅）
var TINT_JIE   = 'rgba(217,119,6,0.14)';   // 介音（橘）
var TINT_YUN   = 'rgba(13,148,136,0.14)';  // 韻母（青）

// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
// 尊重既有 .cn-svg 版面；canvas 給固定邏輯尺寸（含 CSS 尺寸，供 DPR 縮放讀 clientWidth）。
function animCanvas(w: number, h: number, label: string): string {
  return '<canvas class="cn-anim-canvas" width="'+w+'" height="'+h+'" '+
    'style="max-width:'+w+'px" '+
    'role="img" aria-label="'+label+'"></canvas>';
}

// 37 注音全表：三個功能分區（聲母 21／介音 3／韻母 13）各自色塊，字形為正體注音。
// 這是「注音＝幫國字標讀音的 37 個小積木，分成三家族」的推理圖。
function zhuyinChart(): string {
  var zones = [
    { label: '聲母（放在開頭）21 個', glyphs: 'ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ'.split(''), per: 11, tint: TINT_SHENG },
    { label: '介音（夾在中間）3 個',   glyphs: 'ㄧㄨㄩ'.split(''),                                 per: 11, tint: TINT_JIE },
    { label: '韻母（放在結尾）13 個',  glyphs: 'ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ'.split(''),            per: 13, tint: TINT_YUN }
  ];
  var VW = 300, cs = 21, gf = 14, inner = '', y = 8;
  zones.forEach(function (z) {
    var rows = Math.ceil(z.glyphs.length / z.per);
    var zh = 20 + rows * cs + 6;
    inner += '<rect x="10" y="' + y + '" width="280" height="' + zh + '" rx="10" fill="' + z.tint + '" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.5"/>';
    inner += '<text x="18" y="' + (y + 15) + '" font-size="11" font-weight="800" fill="currentColor">' + z.label + '</text>';
    var gy = y + 20;
    z.glyphs.forEach(function (g, i) {
      var r = Math.floor(i / z.per), c = i % z.per;
      var rowCount = Math.min(z.per, z.glyphs.length - r * z.per);
      var rowW = rowCount * cs;
      var gx = (VW - rowW) / 2 + c * cs + cs / 2;
      inner += '<text x="' + gx.toFixed(1) + '" y="' + (gy + r * cs + cs * 0.72).toFixed(1) + '" text-anchor="middle" font-size="' + gf + '" fill="currentColor">' + g + '</text>';
    });
    y += zh + 7;
  });
  return '<svg viewBox="0 0 ' + VW + ' ' + y + '" role="img" aria-label="注音共 37 個符號，分成三個家族：聲母 21 個放開頭、介音 3 個夾中間、韻母 13 個放結尾">' + inner + '</svg>';
}

// 聲母家族前 4 個：ㄅㄆㄇㄈ 四個方塊，說明聲母放在字音最前面、唸起來短。
function initialsRow(): string {
  var gl = ['ㄅ', 'ㄆ', 'ㄇ', 'ㄈ'];
  var s = '<svg viewBox="0 0 280 120" role="img" aria-label="聲母家族前四個：ㄅ ㄆ ㄇ ㄈ，放在字音最前面">';
  s += '<text x="140" y="18" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">聲母：放在一個字音的最前面</text>';
  var x = 20;
  gl.forEach(function (g) {
    s += '<rect x="' + x + '" y="30" width="56" height="56" rx="12" fill="' + TINT_SHENG + '" stroke="currentColor" stroke-opacity="0.5" stroke-width="2"/>';
    s += '<text x="' + (x + 28) + '" y="68" text-anchor="middle" font-size="30" fill="currentColor">' + g + '</text>';
    x += 64;
  });
  s += '<text x="140" y="108" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">ㄅ ㄆ ㄇ ㄈ 唸起來短短的</text>';
  return s + '</svg>';
}

// 拼讀三步驟（程序推理圖）：①看聲母 → ②接韻母 → ③加調號，以 ㄇ→ㄇㄚ→ㄇㄚˇ（馬）示範。
function blendSteps(): string {
  var s = '<svg viewBox="0 0 300 130" role="img" aria-label="拼讀三步驟：先看聲母ㄇ，再接韻母ㄚ成ㄇㄚ，最後加三聲調號成ㄇㄚ三聲，就是馬">';
  var boxes = [
    { x: 8,   label: '①看聲母', big: 'ㄇ' },
    { x: 108, label: '②接韻母', big: 'ㄇㄚ' },
    { x: 208, label: '③加調號', big: 'ㄇㄚˇ' }
  ];
  boxes.forEach(function (b) {
    s += '<rect x="' + b.x + '" y="22" width="84" height="70" rx="12" fill="' + TINT_SHENG + '" stroke="currentColor" stroke-opacity="0.5" stroke-width="2"/>';
    s += '<text x="' + (b.x + 42) + '" y="18" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">' + b.label + '</text>';
    s += '<text x="' + (b.x + 42) + '" y="68" text-anchor="middle" font-size="22" fill="currentColor">' + b.big + '</text>';
  });
  // 兩個箭頭連接三格
  s += '<text x="98" y="62" text-anchor="middle" font-size="18" font-weight="800" fill="currentColor">→</text>';
  s += '<text x="198" y="62" text-anchor="middle" font-size="18" font-weight="800" fill="currentColor">→</text>';
  s += '<text x="150" y="116" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">ㄇㄚˇ 就是「馬」</text>';
  return s + '</svg>';
}

window.CONCEPT = {
  progKey:'chinese_phonics_v1', practiceHref:'chinese.html',
  lessons:[
   { id:'symbols', name:'ㄅㄆㄇ 是什麼', emoji:'🧩', color:'#b91c1c', sub:'注音是幫國字標讀音的 37 個小符號', done:'記得：注音有 37 個符號，用來標國字怎麼唸；開頭的 ㄅㄆㄇㄈ 叫「聲母」。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'注音：幫國字標讀音的小積木',svg:zhuyinChart(),text:'注音符號是用來<b>幫國字標出怎麼唸</b>的小符號，一共<b>37 個</b>，就像拼圖的小積木。它們分成三個家族：<b>聲母</b>（放開頭）、<b>介音</b>（夾中間）、<b>韻母</b>（放結尾）。'},
      {type:'teach',kicker:'先認一家族',title:'聲母家族：ㄅ ㄆ ㄇ ㄈ',svg:initialsRow(),text:'<b>聲母</b>放在一個字音的<b>最前面</b>，唸起來短短的。先認前四個：<b>ㄅ、ㄆ、ㄇ、ㄈ</b>。後面還有 ㄉㄊㄋㄌ…，慢慢就認得了。'},
      {type:'quiz',kicker:'換你試試',title:'注音符號是用來做什麼的？',options:['畫畫','算數學','標出字怎麼唸','記錄日期'],answer:2,why:'注音是標示字音的符號，幫你知道一個字怎麼唸，不是用來計算或畫畫。'},
      {type:'quiz',kicker:'想一想',title:'ㄅ、ㄆ、ㄇ、ㄈ 屬於哪一類？',options:['聲母','數字','標點','部首'],answer:0,why:'ㄅㄆㄇㄈ 是放在一個字音開頭的聲母。'}
     ]},
   { id:'tones', name:'一聲二聲三聲四聲', emoji:'🎵', color:'#dc2626', sub:'同一個音，聲調不同就是不同的字', done:'記得：ˊ二聲往上揚、ˇ三聲先降再升、ˋ四聲往下重；一聲平平的、不加調號。',
     steps:[
      {type:'teach',kicker:'先聽高低',title:'四聲＋輕聲的聲音高低',svg:animCanvas(360,230,'四聲與輕聲的音高曲線：一聲又高又平（不標調號）、二聲ˊ由中往上揚、三聲ˇ先降再升、四聲ˋ由高往下重、輕聲˙又短又輕'),mount:function(host){ if(!window.Anim)return; var h=window.Anim.toneContour(host,{}); return function(){ if(h&&h.stop)h.stop(); }; },text:'同一個音可以用不同的<b>聲調</b>唸。看每條線的高低：<b>一聲</b>又高又平（<b>不加調號</b>）、<b>二聲ˊ</b>往上揚、<b>三聲ˇ</b>先降再升、<b>四聲ˋ</b>往下重、<b>輕聲˙</b>又短又輕。'},
      {type:'teach',kicker:'看同音不同調',title:'ㄇㄚ 配四聲：媽 麻 馬 罵',svg:animCanvas(360,240,'同樣的ㄇㄚ配上不同聲調就是不同的字：ㄇㄚ一聲是媽、ㄇㄚ二聲ˊ是麻、ㄇㄚ三聲ˇ是馬、ㄇㄚ四聲ˋ是罵'),mount:function(host){ if(!window.Anim)return; var h=window.Anim.zhuyinBlend(host,{initial:'ㄇ',medial:'',final:'ㄚ',tones:[{char:'媽',mark:''},{char:'麻',mark:'ˊ'},{char:'馬',mark:'ˇ'},{char:'罵',mark:'ˋ'}]}); return function(){ if(h&&h.stop)h.stop(); }; },text:'同樣是 <b>ㄇㄚ</b>，配上不同聲調，意思全不一樣：<b>媽</b>（ㄇㄚ一聲）、<b>麻</b>（ㄇㄚˊ二聲）、<b>馬</b>（ㄇㄚˇ三聲）、<b>罵</b>（ㄇㄚˋ四聲）。調號寫在韻母的右上角。'},
      {type:'quiz',kicker:'換你試試',title:'「馬」的注音是 ㄇㄚˇ，這是第幾聲？',options:['一聲','二聲','三聲','四聲'],answer:2,why:'ˇ 是三聲的調號，唸起來先降再升，所以 ㄇㄚˇ 是三聲。'},
      {type:'quiz',kicker:'想一想',title:'一聲（陰平）唸起來是怎樣？',options:['又平又長','往上揚','往下重','先降再升'],answer:0,why:'一聲又高又平、聲音拉長，而且台灣注音的一聲不加調號。'}
     ]},
   { id:'blend', name:'把聲母和韻母拼在一起', emoji:'🔗', color:'#e11d48', sub:'聲母＋（介音）＋韻母，連著唸成一個字音', done:'記得：聲母＋（介音）＋韻母，連著唸就是一個字的音。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'ㄅ 加 ㄚ 拼成 ㄅㄚ（八）',svg:animCanvas(360,240,'聲母ㄅ滑向韻母ㄚ，合成一個字音ㄅㄚ，就是數字八'),mount:function(host){ if(!window.Anim)return; var h=window.Anim.zhuyinBlend(host,{initial:'ㄅ',medial:'',final:'ㄚ',tones:[{char:'八',mark:''}]}); return function(){ if(h&&h.stop)h.stop(); }; },text:'聲母像<b>開頭的嘴型</b>，韻母像<b>後面張開的聲音</b>，連著唸就合成一個字音。<b>ㄅ ＋ ㄚ → ㄅㄚ</b>，就是「<b>八</b>」。'},
      {type:'teach',kicker:'多一個介音',title:'ㄏ 加 ㄨ 加 ㄚ 拼成 ㄏㄨㄚ（花）',svg:animCanvas(360,240,'聲母ㄏ、介音ㄨ、韻母ㄚ三個合成一個字音ㄏㄨㄚ，就是花'),mount:function(host){ if(!window.Anim)return; var h=window.Anim.zhuyinBlend(host,{initial:'ㄏ',medial:'ㄨ',final:'ㄚ',tones:[{char:'花',mark:''}]}); return function(){ if(h&&h.stop)h.stop(); }; },text:'有時候中間還會多一個<b>介音</b>（ㄧ、ㄨ、ㄩ）。<b>ㄏ ＋ ㄨ ＋ ㄚ → ㄏㄨㄚ</b>，就是「<b>花</b>」。順序是：聲母 → 介音 → 韻母。'},
      {type:'quiz',kicker:'換你試試',title:'ㄅ ＋ ㄚ 拼起來是哪個音？',options:['ㄅㄚ','ㄆㄚ','ㄇㄚ','ㄈㄚ'],answer:0,why:'聲母 ㄅ 接韻母 ㄚ，連著唸就是 ㄅㄚ。'},
      {type:'quiz',kicker:'想一想',title:'「花」ㄏㄨㄚ 中間的 ㄨ 叫什麼？',options:['聲母','介音','標點','部首'],answer:1,why:'ㄧ、ㄨ、ㄩ 夾在聲母與韻母中間，叫做介音。'}
     ]},
   { id:'practice', name:'自己拼拼看', emoji:'✏️', color:'#be123c', sub:'先聲母、再韻母、最後加調號', done:'記得：先聲母、再韻母、最後加調號，就能把一個字的音拼出來。',
     steps:[
      {type:'teach',kicker:'先學步驟',title:'拼讀三步驟',svg:blendSteps(),text:'拼讀有<b>小步驟</b>：<b>①先看聲母、②再接韻母、③最後加調號</b>。像 ㄇ → ㄇㄚ → <b>ㄇㄚˇ</b>，就是「馬」。由前到後拼，最後補上聲調。'},
      {type:'teach',kicker:'一起拼一次',title:'ㄒ 加 ㄩ 加 ㄝ 加 ˊ 拼成 學',svg:animCanvas(360,240,'聲母ㄒ、介音ㄩ、韻母ㄝ合成ㄒㄩㄝ，再加二聲ˊ，就是學字'),mount:function(host){ if(!window.Anim)return; var h=window.Anim.zhuyinBlend(host,{initial:'ㄒ',medial:'ㄩ',final:'ㄝ',tones:[{char:'學',mark:'ˊ'}]}); return function(){ if(h&&h.stop)h.stop(); }; },text:'照步驟拼一次：<b>ㄒ ＋ ㄩ ＋ ㄝ</b> 合成 ㄒㄩㄝ，再加上<b>二聲 ˊ</b> → <b>ㄒㄩㄝˊ</b>，就是「<b>學</b>」。'},
      {type:'quiz',kicker:'換你試試',title:'ㄇ ＋ ㄚ ＋ ˇ 拼讀出來是哪個字的音？',options:['媽','麻','馬','罵'],answer:2,why:'ㄇㄚ 加上三聲 ˇ 就是 ㄇㄚˇ，正是「馬」。'},
      {type:'quiz',kicker:'想一想',title:'拼讀一個字，正確的順序是？',options:['先聲母 → 再韻母 → 最後加調號','先調號 → 再韻母 → 最後聲母','先韻母 → 再聲母 → 最後調號','隨便哪個順序都可以'],answer:0,why:'由前到後拼：先聲母、再韻母，最後補上聲調。'}
     ]}
  ]
};

})();
