/* =====================================================================
 * chinese_essay_planning_concepts.ts  →  (tsc, tsconfig.legacy.json)
 *     →  chinese_essay_planning_concepts.js
 * 作文「下筆前先想清楚」頁：審題・立意・列大綱・好開頭的構思鷹架，
 *   接 composition.html（寫作工廠）之前的先學觀念。
 * window.CONCEPT ＋ concept_engine.js（教一小段 → 馬上練習）。
 * teach 的 viz：
 *   - 審題／好開頭：PLAYABLE window.Anim.textHighlight（圈出題目關鍵詞與限制／點亮開頭扣題處）。
 *   - 列大綱：PLAYABLE window.Anim.blockAssemble（開頭/主體/結尾方塊組裝；fix 示範補上漏掉的結尾）。
 *   - 立意：local helper aimTarget() 的 stepped 靜態 SVG（材料箭頭都指向中心思想靶心）。
 * IIFE 包住讓 animCanvas()/aimTarget() 為檔案區域（避免與其他已遷移頁同名頂層 helper 在
 *   tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。
 * 載入順序：本檔 → anim_core.js → concept_engine.js。
 * 重用場景：textHighlight 由 chinese_punctuation、blockAssemble 由 chinese_practical_writing
 *   首次加入 src/anim_core.ts；本頁零新增 Anim 場景。
 * ===================================================================== */
(function () {
// 國語專用 SVG 概念圖配色（資訊文字用 currentColor 隨主題變色；AC 紅只做靶心重點，FILL 做底色）。
var AC = '#b91c1c', FILL = 'rgba(185,28,28,0.12)';
function arrow(x1:number,y1:number,x2:number,y2:number,color:string,w:number):string{
  var dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy)||1, ux=dx/len, uy=dy/len;
  var s='<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+w+'" stroke-linecap="round"/>';
  s+='<polygon points="'+x2+','+y2+' '+(x2-ux*10-uy*5).toFixed(1)+','+(y2-uy*10+ux*5).toFixed(1)+' '+(x2-ux*10+uy*5).toFixed(1)+','+(y2-uy*10-ux*5).toFixed(1)+'" fill="'+color+'"/>';
  return s;
}
// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
function animCanvas(w:number,h:number,label:string):string{
  return '<canvas class="cn-anim-canvas" width="'+w+'" height="'+h+'" '+
    'style="max-width:'+w+'px" '+
    'role="img" aria-label="'+label+'"></canvas>';
}
// textHighlight 的 mount 工廠：把一組 tokens 設定包成 concept_engine 需要的 mount(host)。
function hl(cfg:any){
  return function(host:HTMLElement){
    return (window as any).Anim && (window as any).Anim.textHighlight(host, cfg);
  };
}
// blockAssemble 的 mount 工廠。
function blk(cfg:any){
  return function(host:HTMLElement){
    return (window as any).Anim && (window as any).Anim.blockAssemble(host, cfg);
  };
}
// 立意靶心：一個「中心思想」靶心；withMaterials 時四周材料方塊的箭頭都「指向靶心外環邊緣」
//   （node-link #29：連接線在靶框邊緣就停，不插進中心）。
function aimTarget(withMaterials:boolean):string{
  var W=260, H= withMaterials?196:150;
  var cx= withMaterials?196:130, cy= withMaterials?98:78, R=38;
  var s='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+
    (withMaterials?'許多材料的箭頭都指向中間的中心思想靶心':'一個寫著中心思想的靶心')+'">';
  // 靶心三環（由外到內）。
  s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="'+FILL+'" stroke="currentColor" stroke-opacity="0.5" stroke-width="2"/>';
  s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(R*0.64)+'" fill="none" stroke="currentColor" stroke-opacity="0.4" stroke-width="1.6"/>';
  s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(R*0.3)+'" fill="'+AC+'" fill-opacity="0.2" stroke="'+AC+'" stroke-width="2"/>';
  s+='<text x="'+cx+'" y="'+(cy-3)+'" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">中心</text>';
  s+='<text x="'+cx+'" y="'+(cy+12)+'" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">思想</text>';
  if(withMaterials){
    var mats=['材料','例子','感受','道理'];
    var ys=[28,74,120,166];
    for(var i=0;i<mats.length;i++){
      var by=ys[i], bx=10, bw=66, bh=28;
      s+='<rect x="'+bx+'" y="'+(by-bh/2)+'" width="'+bw+'" height="'+bh+'" rx="7" fill="'+FILL+'" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.6"/>';
      s+='<text x="'+(bx+bw/2)+'" y="'+(by+4)+'" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">'+mats[i]+'</text>';
      // 箭頭：從方塊右緣指向靶心外環邊緣（停在半徑 R 處，不插進中心）。
      var sx=bx+bw+2, sy=by;
      var dx=sx-cx, dy=sy-cy, len=Math.sqrt(dx*dx+dy*dy)||1;
      var ex=cx+(dx/len)*R, ey=cy+(dy/len)*R;
      s+=arrow(sx,sy,ex,ey,'currentColor',2.4);
    }
  }
  return s+'</svg>';
}

(window as any).CONCEPT = {
  progKey:'chinese_essay_planning_v1', practiceHref:'composition.html',
  lessons:[
   // ---------- 1. 審題 ----------
   { id:'shenti', name:'審題：先看懂題目要什麼', emoji:'🔍', color:'#b91c1c', sub:'圈出關鍵詞與限制：寫什麼、什麼文體、範圍多大',
     done:'記得：下筆前先審題——圈出題目的關鍵詞，再看清楚限制（文體、對象、範圍）。看錯題，整篇就會離題。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'圈出關鍵詞與限制',
       svg:animCanvas(360,240,'題目「一次難忘的旅行」裡的關鍵詞與限制依序亮起並標上說明'),
       mount:hl({title:'審題：圈出關鍵詞與限制',caption:'先看清楚：寫什麼、要寫出什麼、範圍多大',loops:2,
         tokens:[{t:'一次',hl:true,label:'範圍：只寫一次'},{t:'難忘',hl:true,label:'關鍵：要寫出為何難忘'},{t:'的'},{t:'旅行',hl:true,label:'主題：寫一趟旅行'}]}),
       text:'拿到題目〈<b>一次難忘的旅行</b>〉，先把它拆開看：關鍵詞是「<b>難忘</b>」和「<b>旅行</b>」——要寫一趟旅行，而且要寫出<b>為什麼難忘</b>；「<b>一次</b>」是範圍，只寫<b>一趟</b>。這類題目通常是<b>記敘文</b>（記一件事）。'},
      {type:'teach',kicker:'看錯就全盤皆輸',title:'看錯題＝全篇離題',
       svg:animCanvas(360,240,'題目「我最敬佩的一個人」裡的關鍵詞「敬佩」與限制「一個人」依序亮起'),
       mount:hl({title:'關鍵詞和限制都不能偏',caption:'漏掉「敬佩」或寫成很多人，就離題了',loops:2,
         tokens:[{t:'我最'},{t:'敬佩',hl:true,label:'要寫出「敬佩」之情'},{t:'的'},{t:'一個人',hl:true,label:'限制：只能寫一個人'}]}),
       text:'再看〈<b>我最敬佩的一個人</b>〉：關鍵是「<b>敬佩</b>」，限制是「<b>一個人</b>」。如果寫成<b>很多人</b>、或只介紹他是誰卻<b>沒寫出敬佩</b>，就算文筆再好也<b>離題</b>了。所以審題是最重要的第一步。'},
      {type:'quiz',kicker:'換你試試',title:'題目〈我最敬佩的一個人〉，最關鍵、不能寫偏的是？',
       options:['聚焦「一個人」，並寫出對他的敬佩','把你認識的很多人都寫一遍','寫一個你最討厭的人','只介紹這個人幾歲、住哪裡'],answer:0,
       whyWrong:{1:'題目限制是「一個人」，寫成很多人就離題了。',2:'題目要的是「敬佩」，寫討厭的人與題意相反。',3:'只寫基本資料卻沒寫出「敬佩」，等於沒扣住關鍵詞。'},
       why:'關鍵詞是「敬佩」「一個人」——要聚焦一個人、並表達敬佩，才不離題。'},
      {type:'quiz',kicker:'想一想',title:'審題最主要的目的是什麼？',
       options:['看懂題目的要求，避免離題','讓文章的字數變多','先想好要用幾個成語','把字寫得漂亮一點'],answer:0,
       whyWrong:{1:'字數多寡不是審題的目的。',2:'用幾個成語和審題無關。',3:'字寫得漂亮是書寫，不是審題。'},
       why:'審題是先確定主題與限制，這是全篇不離題的前提。'}
     ]},
   // ---------- 2. 立意 ----------
   { id:'liyi', name:'立意：決定你想說的一句話', emoji:'🎯', color:'#dc2626', sub:'定出全篇的中心思想，所有材料都扣住它',
     done:'記得：立意＝用一句話定下中心思想，所有材料都要扣住它。一篇只扣一個中心，文章才不會散。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'立意＝全篇的中心思想',
       svg:aimTarget(false),
       text:'<b>立意</b>就是定出整篇的<b>中心思想</b>——用<b>一句話</b>說清楚「<b>我想表達什麼</b>」。像寫〈一次難忘的旅行〉，中心可以是「這趟旅行讓我學會互相幫忙」。先把這句話定下來，整篇才有方向。'},
      {type:'teach',kicker:'材料都要扣住它',title:'所有材料都指向中心',
       svg:aimTarget(true),
       text:'中心明確了，<b>選材料</b>才知道怎麼挑。發生的事、舉的例子、你的感受和道理，<b>每一樣都要扣住同一個中心</b>，像箭頭都射向靶心。一篇<b>只扣一個中心</b>；材料若各說各話，文章就會散、也容易離題。'},
      {type:'quiz',kicker:'換你試試',title:'作文裡的「立意」指的是？',
       options:['整篇文章想表達的中心思想','文章總共寫了幾個字','用了幾個成語','標題的字體大小'],answer:0,
       whyWrong:{1:'字數不是立意，立意是中心想法。',2:'用幾個成語和立意無關。',3:'標題字體是外觀，不是中心思想。'},
       why:'立意是確立全篇要傳達的核心想法——用一句話說清楚「我想表達什麼」。'},
      {type:'quiz',kicker:'想一想',title:'材料和中心思想的關係應該是？',
       options:['所有材料都扣住同一個中心','材料越雜、越多越好','每一段各講一個不同的中心','材料和中心沒什麼關係'],answer:0,
       whyWrong:{1:'材料雜亂會讓文章散、容易離題。',2:'一篇只扣一個中心，多個中心會失焦。',3:'材料必須為中心服務，不能和中心無關。'},
       why:'選材要圍繞同一個中心，文章才集中、不離題。'}
     ]},
   // ---------- 3. 列大綱 ----------
   { id:'dagang', name:'列大綱：鳳頭・豬肚・豹尾', emoji:'🗂️', color:'#e11d48', sub:'先列骨架：開頭吸引人、中段充實、結尾有力',
     done:'記得：先列大綱——鳳頭（開頭吸引人）、豬肚（中段充實、分段舉例）、豹尾（結尾有力）。每段先寫一句段落大意。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'先列骨架：鳳頭・豬肚・豹尾',
       svg:animCanvas(360,300,'作文大綱四個方塊由上而下滑入組成：開頭（鳳頭）、中段兩段（豬肚）、結尾（豹尾）'),
       mount:blk({title:'先列大綱骨架',caption:'鳳頭（開頭）→豬肚（充實中段）→豹尾（結尾）',
         label:'作文大綱四個方塊由上而下滑入組成骨架：開頭（鳳頭）、兩個中段（豬肚）、結尾（豹尾）。',
         blocks:[{label:'開頭（鳳頭）：吸引人',color:'#b91c1c'},{label:'中段①（豬肚）：舉第一個例子',color:'#dc2626'},{label:'中段②（豬肚）：再舉一個例子',color:'#e11d48'},{label:'結尾（豹尾）：有力收束',color:'#be123c'}]}),
       text:'寫之前先列<b>骨架</b>——「<b>鳳頭豬肚豹尾</b>」：<b>開頭（鳳頭）</b>要像鳳凰的頭一樣<b>吸引人</b>；<b>中段（豬肚）</b>要像豬肚一樣<b>充實有料</b>、分段舉例；<b>結尾（豹尾）</b>要像豹尾一樣<b>短而有力</b>地收束。'},
      {type:'teach',kicker:'別漏掉結尾',title:'每段先寫段落大意，別忘了結尾',
       svg:animCanvas(360,300,'大綱方塊滑入，再把漏掉的結尾補上，示範每段都先寫一句段落大意'),
       mount:blk({title:'每段先寫一句段落大意',caption:'先定每段要講什麼，別漏掉結尾',
         label:'大綱方塊滑入，每段標上段落大意，最後把漏掉的結尾補成「結尾（豹尾）：有力收束」。',
         blocks:[{label:'開頭：點題、吸引人',color:'#b91c1c'},{label:'中段①：一件事＋例子',color:'#dc2626'},{label:'中段②：再一個例子',color:'#e11d48'},{label:'結尾',color:'#be123c'}],
         fix:{atIndex:3,wrong:'忘了寫結尾',right:'結尾（豹尾）：有力收束'}}),
       text:'列大綱時，<b>每一段先寫一句「這段要講什麼」</b>當<b>段落大意</b>，寫起來才不會偏題。最常犯的錯是<b>忘了結尾</b>、草草收場。記得把<b>結尾（豹尾）</b>補上，整篇才完整、有力。'},
      {type:'quiz',kicker:'換你試試',title:'作文的「豬肚」指的是哪一部分？',
       options:['中間段落，要內容充實、分段舉例','文章的開頭','文章的結尾','文章的標題'],answer:0,
       whyWrong:{1:'開頭是「鳳頭」，不是豬肚。',2:'結尾是「豹尾」，不是豬肚。',3:'標題不在「鳳頭豬肚豹尾」裡。'},
       why:'「鳳頭豬肚豹尾」的豬肚＝中段，要像豬肚一樣飽滿有料、分段舉例。'},
      {type:'quiz',kicker:'想一想',title:'列大綱時，每一段最好先寫什麼？',
       options:['一句「這段要講什麼」當段落大意','這段最後要用的標點','這段會用到的生字','這段大概有幾個字'],answer:0,
       whyWrong:{1:'標點不是段落大意。',2:'生字和段落大意無關。',3:'字數多少不能幫你抓住這段的重點。'},
       why:'先替每段定一句段落大意，寫起來才不會偏題、結構也清楚。'}
     ]},
   // ---------- 4. 好開頭 ----------
   { id:'kaitou', name:'把構思變成第一段', emoji:'✒️', color:'#be123c', sub:'開門見山、設問、情境——開頭要扣題、讓人想讀下去',
     done:'記得：構思四步——審題→立意→列大綱→寫一個扣題的好開頭。開頭招式有開門見山、設問、情境。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'好開頭的招式：設問',
       svg:animCanvas(360,240,'一個設問式開頭句子裡，問句與扣題關鍵詞依序亮起'),
       mount:hl({title:'開頭招式：設問＋扣題',caption:'用問句引起好奇，同時點到題目關鍵詞',loops:2,
         tokens:[{t:'你有沒有'},{t:'一次難忘的旅行',hl:true,label:'扣題：點到題目關鍵詞'},{t:'？',hl:true,label:'設問：用問句引起好奇'}]}),
       text:'好開頭有幾種常見招式：<b>開門見山</b>（直接點題）、<b>設問</b>（用問句引起好奇）、<b>情境</b>（先描一個畫面）。像這句用<b>問句</b>開場就是「<b>設問</b>」，而且一開頭就<b>點到題目關鍵詞</b>，讓人想往下讀。'},
      {type:'teach',kicker:'最重要的一點',title:'開頭要扣題、讓人想讀下去',
       svg:animCanvas(360,240,'一個開門見山式開頭句子裡，扣題關鍵詞與吸引人的句子依序亮起'),
       mount:hl({title:'開門見山：一開頭就扣題',caption:'直接點題，又讓人想繼續讀',loops:2,
         tokens:[{t:'校園角落'},{t:'有一棵大樹',hl:true,label:'扣題：直接點「校園的大樹」'},{t:'每天為我們遮陽',hl:true,label:'吸引人：讓人想往下讀'}]}),
       text:'不管用哪種招式，開頭最重要的是<b>扣住題目</b>、又能<b>讓人想繼續讀</b>。像〈校園的大樹〉用<b>開門見山</b>直接點題，再加一句吸引人的話。<b>千萬別離題鋪陳太久</b>，繞半天還沒進主題，讀者就沒耐心了。'},
      {type:'quiz',kicker:'換你試試',title:'用一個問句當開頭、引起讀者好奇，這種開頭招式叫？',
       options:['設問','開門見山','流水帳','結論先行'],answer:0,
       whyWrong:{1:'開門見山是直接點題，不是用問句。',2:'流水帳是從頭到尾記事，不是開頭招式。',3:'結論先行是先把結論講完，不是用問句引起好奇。'},
       why:'用提問開場、引起讀者好奇，就是「設問」開頭法。'},
      {type:'quiz',kicker:'想一想',title:'寫開頭時最該注意的是什麼？',
       options:['要扣住題目，並讓人想繼續讀','先把結局整個講完','用越多成語越好','從早上起床慢慢寫起'],answer:0,
       whyWrong:{1:'開頭就把結局講完，後面就沒看頭了。',2:'堆成語不等於好開頭，重點是扣題又吸引人。',3:'從起床慢慢寫是流水帳，容易離題又拖太久。'},
       why:'開頭要扣住題目、又能吸引人往下讀，不要離題鋪陳太久。'}
     ]}
  ]
};

})();
