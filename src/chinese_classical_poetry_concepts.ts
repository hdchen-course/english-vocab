/* =====================================================================
 * chinese_classical_poetry_concepts.ts
 *   →  (tsc, tsconfig.legacy.json) →  chinese_classical_poetry_concepts.js
 * 國語進階挑戰（先學觀念）：古典詩詞鑑賞入門。
 *   絕句（四句・五言/七言）/ 押韻（句尾韻母相同）/ 對仗（上下句相對）/ 詩與詞的差別（詞牌・長短句）。
 * 教學資料 window.CONCEPT + concept_engine.js 驅動；lesson 1〜3 的 teach 皆用 PLAYABLE
 *   的 window.Anim.textHighlight（執行期才取用，建資料時只放 animCanvas 佔位）點亮句數/字數、
 *   韻腳、對仗詞；lesson 4「詩 vs 詞」以本檔 local 靜態 SVG 對比（非 Anim）。
 * 所引詩詞原文 byte-exact 照錄不改字（台灣課本通行版）：
 *   〈靜夜思〉李白：床前明月光，疑是地上霜。舉頭望明月，低頭思故鄉。（五絕，韻腳 光/霜/鄉 收ㄤ）
 *   〈登鸛雀樓〉王之渙：白日依山盡，黃河入海流。欲窮千里目，更上一層樓。（五絕，首聯對仗）
 * 全文繁體＋台灣用詞（絕句/律詩/押韻/對仗/詞牌）；嚴禁簡體。IIFE 包住讓 helper 為檔案區域，
 *   避免與其他已遷移頁的同名頂層 helper 在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突。
 * ===================================================================== */
(function () {
var AC = '#b91c1c', FILL = 'rgba(185,28,28,0.12)';

// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
function animCanvas(w: number, h: number, label: string): string {
  return '<canvas class="cn-anim-canvas" width="'+w+'" height="'+h+'" '+
    'style="max-width:'+w+'px" '+
    'role="img" aria-label="'+label+'"></canvas>';
}
// textHighlight 的 mount 工廠：把一組 tokens 設定包成 concept_engine 需要的 mount(host)。
function hl(cfg: any) {
  return function (host: HTMLElement) {
    return (window as any).Anim && (window as any).Anim.textHighlight(host, cfg);
  };
}
// 連線（線尾為實心箭頭，端點座標即落在方塊邊緣，不穿進方塊中心）—— node-link #29。
function arrow(x1: number, y1: number, x2: number, y2: number, color: string, w: number): string {
  var dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy)||1, ux=dx/len, uy=dy/len;
  var s='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+w+'" stroke-linecap="round"/>';
  s+='<polygon points="'+x2+','+y2+' '+(x2-ux*10-uy*5).toFixed(1)+','+(y2-uy*10+ux*5).toFixed(1)+' '+(x2-ux*10+uy*5).toFixed(1)+','+(y2-uy*10-ux*5).toFixed(1)+'" fill="'+color+'"/>';
  return s;
}

// ---- lesson 4 teach(1)：詩（每句字數固定）vs 詞（長短句）靜態對比 ----
// 左欄：五言絕句＝四個等長方塊（每句都是 5 字）；右欄：詞＝開頭詞牌名＋長短不一的句子方塊。
function shiVsCi(): string {
  var s='<svg viewBox="0 0 300 196" role="img" aria-label="詩每句字數固定（左：五言絕句四個等長方塊），詞是長短句（右：開頭是詞牌名，句子長短不一）">';
  s+='<text x="150" y="14" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">詩：每句字數固定　｜　詞：長短句</text>';
  // 左欄：五言絕句（四個等長方塊）
  s+='<text x="72" y="36" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">五言絕句</text>';
  [48,78,108,138].forEach(function(y){
    s+='<rect x="16" y="'+y+'" width="112" height="22" rx="6" fill="'+FILL+'" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.8"/>';
    s+='<text x="72" y="'+(y+15)+'" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">五個字</text>';
  });
  s+='<text x="72" y="182" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">每句一樣長</text>';
  // 右欄：詞（開頭詞牌名＋長短不一）
  s+='<text x="226" y="36" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">詞（長短句）</text>';
  s+='<rect x="168" y="48" width="78" height="22" rx="6" fill="'+FILL+'" stroke="'+AC+'" stroke-width="2"/>';
  s+='<text x="207" y="63" text-anchor="middle" font-size="11" font-weight="800" fill="'+AC+'">詞牌名</text>';
  var widths=[104,56,120,44];
  [78,108,138,168].forEach(function(y,i){
    s+='<rect x="168" y="'+y+'" width="'+widths[i]+'" height="20" rx="6" fill="'+FILL+'" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.8"/>';
  });
  s+='<text x="226" y="194" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">句子長短不一</text>';
  return s+'</svg>';
}
// ---- lesson 4 teach(2)：詞牌決定格律；題目/內容另外寫 ----
function ciPaiRole(): string {
  var s='<svg viewBox="0 0 300 150" role="img" aria-label="詞牌名決定格律（字數、押韻等），作品的題目或內容另外寫">';
  s+='<rect x="14" y="40" width="104" height="42" rx="10" fill="'+FILL+'" stroke="'+AC+'" stroke-width="2"/>';
  s+='<text x="66" y="66" text-anchor="middle" font-size="17" fill="currentColor">水調歌頭</text>';
  s+='<text x="66" y="98" text-anchor="middle" font-size="11" font-weight="800" fill="'+AC+'">詞牌名</text>';
  s+=arrow(118,61,148,61,'currentColor',3);  // 端點落在右方塊左緣（x=150）前，不穿入
  s+='<rect x="150" y="40" width="136" height="42" rx="10" fill="'+FILL+'" stroke="currentColor" stroke-opacity="0.6" stroke-width="2"/>';
  s+='<text x="218" y="60" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">決定格律</text>';
  s+='<text x="218" y="76" text-anchor="middle" font-size="10" font-weight="800" fill="currentColor">句數・字數・押韻</text>';
  s+='<text x="150" y="124" text-anchor="middle" font-size="11.5" font-weight="800" fill="currentColor">作品的題目或內容，另外寫</text>';
  return s+'</svg>';
}

(window as any).CONCEPT = {
  progKey:'chinese_classical_poetry_v1', practiceHref:'chinese_advanced.html',
  lessons:[
   // ---------- 1. 絕句：四句、每句字數一樣 ----------
   { id:'jueju', name:'絕句：四句、每句字數一樣', emoji:'📜', color:'#b91c1c', sub:'四句就是絕句；每句五字＝五絕，七字＝七絕',
     done:'記得：絕句一共四句；每句五個字是五言絕句（五絕），每句七個字是七言絕句（七絕）。讀詩先數句數、字數，就知道是哪種。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'絕句＝四句，每句字數一樣',
       svg:animCanvas(360,250,'李白〈靜夜思〉四句逐句亮起，每句都是五個字，標示第1句到第4句'),
       mount:hl({title:'〈靜夜思〉·四句，每句5字',caption:'四句逐句亮起，每句都剛好五個字＝五言絕句',loops:2,dwellMs:1200,
         tokens:[{t:'床前明月光',hl:true,label:'第1句·5字'},{t:'，'},{t:'疑是地上霜',hl:true,label:'第2句·5字'},{t:'。'},{t:'舉頭望明月',hl:true,label:'第3句·5字'},{t:'，'},{t:'低頭思故鄉',hl:true,label:'第4句·5字'},{t:'。'}]}),
       text:'<b>絕句</b>是一種整齊的詩，一共<b>四句</b>。李白〈靜夜思〉就是絕句：「床前明月光，疑是地上霜。舉頭望明月，低頭思故鄉。」數一數——四句、每句剛好<b>五個字</b>，所以叫<b>五言絕句</b>（五絕）。'},
      {type:'teach',kicker:'怎麼分辨',title:'先數句數，再數字數',
       svg:animCanvas(360,250,'再看一次〈靜夜思〉，先數四句、再數每句五字，判斷它是五言絕句'),
       mount:hl({title:'先數：4句、每句5字',caption:'數句數→四句=絕句；數字數→每句五字=五言',loops:2,dwellMs:1200,
         tokens:[{t:'床前明月光',hl:true,label:'共4句'},{t:'，疑是地上霜。'},{t:'舉頭望明月，低頭思故鄉。'}]}),
       text:'讀一首詩，先<b>數句數</b>：四句就是絕句。再<b>數每句的字數</b>：每句五字是<b>五言絕句</b>，每句七字是<b>七言絕句</b>。先數句、再數字，馬上就認得出是哪種絕句。'},
      {type:'quiz',kicker:'換你試試',title:'〈靜夜思〉每句五個字、剛好四句，屬於哪一種？',
       options:['五言絕句','七言絕句','詞','散文'],answer:0,
       whyWrong:{1:'七言絕句每句是七個字，〈靜夜思〉每句只有五個字。',2:'詞是長短句、開頭有詞牌名；〈靜夜思〉每句字數一樣，是詩不是詞。',3:'散文不講究固定句數字數；〈靜夜思〉四句、每句五字，是整齊的詩。'},
       why:'每句五個字、剛好四句，就是五言絕句（五絕）。'},
      {type:'quiz',kicker:'想一想',title:'「七言絕句」的每句是幾個字？',
       options:['七個字','五個字','四個字','長短不一'],answer:0,
       whyWrong:{1:'每句五個字、四句的是五言絕句，不是七言。',2:'「四」是絕句的句數，不是每句的字數。',3:'長短不一是詞的特色；絕句每句字數一樣。'},
       why:'「七言」就是每句七個字；而「絕句」一樣是四句。'}
     ]},
   // ---------- 2. 押韻：句尾聲音相押 ----------
   { id:'yayun', name:'押韻：句尾聲音相押', emoji:'🎵', color:'#dc2626', sub:'某些句子的最後一個字韻母相同，讀來順口',
     done:'記得：押韻＝某些句子的句尾字韻母相同，讀起來順口。〈靜夜思〉的「光、霜、鄉」都收ㄤ；絕句常在第一、二、四句押韻。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'押韻：句尾字韻母相同',
       svg:animCanvas(360,250,'〈靜夜思〉的句尾字光、霜、鄉依序亮起，它們的韻母都收ㄤ，所以押韻'),
       mount:hl({title:'光・霜・鄉　都收ㄤ',caption:'句尾字的韻母相同，讀起來才順口＝押韻',loops:2,dwellMs:1250,
         tokens:[{t:'床前明月'},{t:'光',hl:true,label:'韻腳·收ㄤ'},{t:'，疑是地上'},{t:'霜',hl:true,label:'韻腳·收ㄤ'},{t:'。舉頭望明月，低頭思故'},{t:'鄉',hl:true,label:'韻腳·收ㄤ'},{t:'。'}]}),
       text:'<b>押韻</b>是指某些句子的<b>最後一個字韻母相同</b>，唸起來特別順口和諧。〈靜夜思〉句尾的「<b>光</b>、<b>霜</b>、<b>鄉</b>」韻母都收<b>ㄤ</b>，所以讀起來一氣呵成。這些押韻的句尾字叫<b>韻腳</b>。'},
      {type:'teach',kicker:'規律',title:'絕句：第二、四句一定押韻',
       svg:animCanvas(360,250,'〈靜夜思〉第二、四句句尾一定押ㄤ韻，第一句可押可不押（這裡光剛好也押），第三句句尾月不押'),
       mount:hl({title:'②④必押・①可押可不押',caption:'絕句第二、四句一定押韻；第一句可押可不押、第三句不押',loops:2,dwellMs:1250,
         tokens:[{t:'床前明月'},{t:'光',hl:true,label:'①可押'},{t:'，疑是地上'},{t:'霜',hl:true,label:'②必押'},{t:'。舉頭望明'},{t:'月'},{t:'，低頭思故'},{t:'鄉',hl:true,label:'④必押'},{t:'。'}]}),
       text:'押韻有固定的位置。<b>絕句</b>一定在<b>第二、四句</b>的句尾押韻；<b>第一句可押可不押</b>——〈靜夜思〉的「光」剛好也押，但〈登鸛雀樓〉的「盡」就不押。<b>第三句</b>的句尾（這裡是「月」）則<b>不押</b>。'},
      {type:'quiz',kicker:'換你試試',title:'〈靜夜思〉的「光、霜、鄉」為什麼讀起來順口？',
       options:['它們押同一個韻（都收ㄤ）','它們都是名詞','它們的筆畫一樣多','它們都在第一句'],answer:0,
       whyWrong:{1:'詞性相同不會讓它變得押韻；順口是因為句尾韻母相同。',2:'筆畫多少和押不押韻沒有關係。',3:'它們分別在第一、二、四句的句尾，不是都在第一句。'},
       why:'句尾字的韻母相同（都收ㄤ）就是押韻，讀起來才和諧順口。'},
      {type:'quiz',kicker:'想一想',title:'要看一首詩有沒有押韻，通常看哪個字？',
       options:['每句的最後一個字','每句的第一個字','句子正中間的字','標點符號'],answer:0,
       whyWrong:{1:'押韻看句尾（韻腳），不是看句子開頭的字。',2:'中間的字不決定押韻，要看句尾字的韻母。',3:'標點不是字，不涉及押韻。'},
       why:'押韻是看句尾字（韻腳）的韻母是否相同，所以要看每句的最後一個字。'}
     ]},
   // ---------- 3. 對仗：兩句像照鏡子 ----------
   { id:'duizhang', name:'對仗：兩句像照鏡子', emoji:'🪞', color:'#e11d48', sub:'上下兩句字數相同、詞性相對、意思相映',
     done:'記得：對仗＝上下兩句字數相同、同位置的詞詞性相對、意思互相映襯。〈登鸛雀樓〉「白日依山盡，黃河入海流」就是對仗。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'對仗：上下句同位置相對',
       svg:animCanvas(360,250,'王之渙〈登鸛雀樓〉首聯白日對黃河、依山對入海、盡對流，上下句同位置的詞依序亮起'),
       mount:hl({title:'白日↔黃河　依山↔入海　盡↔流',caption:'上下兩句同一個位置的詞相對，像照鏡子',loops:2,dwellMs:1250,
         tokens:[{t:'白日',hl:true,label:'名詞·對黃河'},{t:'依山',hl:true,label:'對入海'},{t:'盡',hl:true,label:'動詞·對流'},{t:'，'},{t:'黃河',hl:true,label:'名詞·對白日'},{t:'入海',hl:true,label:'對依山'},{t:'流',hl:true,label:'動詞·對盡'},{t:'。欲窮千里目，更上一層樓。'}]}),
       text:'<b>對仗</b>是讓上下兩句<b>像照鏡子</b>：字數相同、同位置的詞<b>詞性相對</b>、意思互相映襯。〈登鸛雀樓〉「白日依山盡，黃河入海流」——<b>白日</b>對<b>黃河</b>（都是名詞）、<b>依山</b>對<b>入海</b>、<b>盡</b>對<b>流</b>（都是動詞），對得非常工整。'},
      {type:'teach',kicker:'為什麼好聽',title:'對仗讓詩整齊有力',
       svg:animCanvas(360,250,'再看〈登鸛雀樓〉首聯的對仗，上下句字數相同、詞性相對，讀來整齊有力'),
       mount:hl({title:'字數相同・詞性相對',caption:'上下句一一對位，整齊又有氣勢',loops:2,dwellMs:1200,
         tokens:[{t:'白日',hl:true,label:'上句'},{t:'依山盡，'},{t:'黃河',hl:true,label:'下句·對位'},{t:'入海流。'}]}),
       text:'對仗的兩句<b>字數一樣多</b>、每個位置的詞又互相對應，讀起來<b>整齊、有氣勢</b>。像「白日依山盡」對「黃河入海流」，兩句一上一下，畫面開闊、節奏有力，這就是對仗的魅力。'},
      {type:'quiz',kicker:'換你試試',title:'「白日依山盡，黃河入海流」中，與「白日」相對的是？',
       options:['入海','黃河','千里','一層'],answer:1,
       whyWrong:{0:'「入海」對的是上句的「依山」，不是「白日」。',2:'「千里」在第三句「欲窮千里目」，不在這組對仗聯裡。',3:'「一層」在第四句「更上一層樓」，不在這組對仗聯裡。'},
       why:'上下兩句同一個位置的詞相對；「白日」在上句句首、「黃河」在下句句首，都是名詞，所以互相對。'},
      {type:'quiz',kicker:'想一想',title:'構成對仗的兩句，需要具備什麼？',
       options:['字數相同、詞性相對','押一樣的韻','字數越多越好','用很多標點'],answer:0,
       whyWrong:{1:'押韻看的是句尾字的韻母，和對仗是兩回事；對仗看上下句相對。',2:'對仗要的是上下句字數「一樣」，不是越多越好。',3:'標點多寡和對仗沒有關係。'},
       why:'對仗要求上下句字數一樣、同位置的詞詞性相對、意思互相映襯。'}
     ]},
   // ---------- 4. 詩和詞不一樣：詞有「詞牌」 ----------
   { id:'shi_ci', name:'詩和詞不一樣：詞有「詞牌」', emoji:'🎼', color:'#be123c', sub:'詩每句字數多半固定；詞是長短句，開頭是詞牌名',
     done:'記得：詞是長短句（每句字數不一定一樣），開頭標的是詞牌名（如〈水調歌頭〉），不是題目；詞牌決定格律。詩（像絕句）則多半每句字數固定。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'詩每句字數固定，詞是長短句',svg:shiVsCi(),
       text:'<b>詩</b>（像絕句）每句字數多半<b>固定</b>——五絕每句都是五字，整整齊齊。<b>詞</b>不一樣，它的句子<b>長短不一</b>（所以又叫「長短句」），而且開頭標的不是題目，而是一個<b>詞牌名</b>，像〈水調歌頭〉。'},
      {type:'teach',kicker:'詞牌是什麼',title:'詞牌名決定格律',svg:ciPaiRole(),
       text:'詞開頭的<b>詞牌名</b>（如〈水調歌頭〉〈念奴嬌〉）決定這首詞的<b>格律</b>——句數、每句字數、押韻的位置都照詞牌走。詞牌<b>不是</b>作品的題目；作品的題目或內容，會<b>另外寫</b>。'},
      {type:'quiz',kicker:'換你試試',title:'一首詞開頭的「水調歌頭」是什麼？',
       options:['作者名','詞牌名','朝代','押的韻'],answer:1,
       whyWrong:{0:'作者是寫這首詞的人（如蘇軾），不是開頭標的「水調歌頭」。',2:'朝代是時代（如宋朝），不是詞牌。',3:'押的韻是句尾字的韻母，不是開頭標的名稱。'},
       why:'詞開頭標的是詞牌名，它決定這首詞的格律；詞牌名不是作品的題目。'},
      {type:'quiz',kicker:'想一想',title:'詩和詞最明顯的差別之一是？',
       options:['詞的句子長短不一','詞一定比詩長','詩不能押韻','詞沒有作者'],answer:0,
       whyWrong:{1:'「長短」指的是每句字數不一，不是比整首誰長。',2:'詩也會押韻，像絕句常押第一、二、四句。',3:'詞和詩都有作者（如蘇軾、李白）。'},
       why:'詞是長短句、每句字數不一定一樣；詩（像絕句）則多半每句字數固定。'}
     ]}
  ]
};

})();
