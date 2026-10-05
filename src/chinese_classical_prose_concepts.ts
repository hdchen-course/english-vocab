/* =====================================================================
 * chinese_classical_prose_concepts.ts
 *   →  (tsc, tsconfig.legacy.json) →  chinese_classical_prose_concepts.js
 * 國語進階挑戰：短文言鑑賞（虛詞・斷句句讀・翻譯五法・小故事守株待兔）。
 *   銜接 chinese_advanced lv5 文言文入門。教學資料 window.CONCEPT + concept_engine.js 驅動。
 * 虛詞／斷句／文白對照三課皆用 PLAYABLE window.Anim.textHighlight（執行期才取用，建資料時
 *   只放 animCanvas 佔位）；翻譯五法用檔案區域靜態 SVG（fanyiWu）。IIFE 包住讓 helper 為
 *   檔案區域，避免與其他已遷移頁同名頂層 helper 在 tsconfig.legacy 共用全域型別檢查時
 *   TS2393 衝突。文言原文照錄不改字（說＝通悅，讀ㄩㄝˋ，照錄）；間隔號用台灣全形「‧」。
 * ===================================================================== */
(function () {
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
// ---- 翻譯五法靜態 SVG（留刪補換調，各配一個迷你例子；文言→白話；node-link：箭頭止於字邊） ----
var AC = '#b91c1c', FILL = 'rgba(185,28,28,0.12)';
function arrow(x1: number, x2: number, y: number): string {
  // 水平短箭頭（文言 → 白話），兩端留白、箭頭止於目標字左緣
  return '<line x1="'+x1+'" y1="'+y+'" x2="'+(x2-7)+'" y2="'+y+'" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'+
    '<polygon points="'+x2+','+y+' '+(x2-7)+','+(y-4)+' '+(x2-7)+','+(y+4)+'" fill="currentColor"/>';
}
function fanyiWu(): string {
  var rows = [
    { c:'留', name:'留＝照留', wen:'孔子', bai:'孔子' },
    { c:'刪', name:'刪＝刪去', wen:'夫戰', bai:'戰（刪「夫」）' },
    { c:'補', name:'補＝補足', wen:'見漁人', bai:'（村人）見漁人' },
    { c:'換', name:'換＝換今義', wen:'曰', bai:'說' },
    { c:'調', name:'調＝調語序', wen:'何陋之有', bai:'有何陋' }
  ];
  var s = '<svg viewBox="0 0 344 236" role="img" aria-label="翻譯五法：留、刪、補、換、調，各一個文言翻成白話的例子">';
  s += '<text x="172" y="15" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">翻譯五法：文言 → 白話</text>';
  var cy = 46;
  rows.forEach(function (r) {
    s += '<rect x="8" y="'+(cy-17)+'" width="34" height="34" rx="9" fill="'+FILL+'" stroke="'+AC+'" stroke-width="2"/>';
    s += '<text x="25" y="'+(cy+7)+'" text-anchor="middle" font-size="21" fill="currentColor">'+r.c+'</text>';
    s += '<text x="50" y="'+(cy+5)+'" font-size="12" font-weight="800" fill="currentColor">'+r.name+'</text>';
    s += '<text x="196" y="'+(cy+5)+'" text-anchor="end" font-size="13" fill="currentColor">'+r.wen+'</text>';
    s += arrow(202, 224, cy);
    s += '<text x="230" y="'+(cy+5)+'" text-anchor="start" font-size="13" fill="currentColor">'+r.bai+'</text>';
    cy += 40;
  });
  return s + '</svg>';
}

(window as any).CONCEPT = {
  progKey:'chinese_classical_prose_v1', practiceHref:'chinese_advanced.html',
  lessons:[
   // ---------- 1. 文言很短，因為有「虛詞」 ----------
   { id:'xuci', name:'文言很短，因為有「虛詞」', emoji:'📜', color:'#b91c1c', sub:'之、乎、者、也、而、以、於——多半表語氣或連接',
     done:'記得：之乎者也而以於是常見虛詞，多半不翻成具體意思，先認出它們，句子就好懂一大半。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'虛詞：表語氣或連接的字',
       svg:animCanvas(360,240,'《論語》「學而時習之，不亦說乎？」裡的虛詞「而、之、乎」依序亮起並標示功能'),
       mount:hl({title:'學而時習之，不亦說乎？',caption:'虛詞「而、之、乎」依序亮起，看它們在句子裡的作用',loops:2,dwellMs:1300,
         tokens:[{t:'學'},{t:'而',hl:true,label:'虛詞「而」：並且'},{t:'時習'},{t:'之',hl:true,label:'虛詞「之」：它（代詞）'},{t:'，不亦說'},{t:'乎',hl:true,label:'虛詞「乎」：嗎'},{t:'？'}]}),
       text:'文言很短，是因為有很多<b>虛詞</b>：之、乎、者、也、而、以、於。它們<b>多半不翻成具體意思</b>，而是表<b>語氣</b>或<b>連接</b>。像《論語》「學而時習之，不亦說乎？」裡，<b>而</b>＝並且、<b>之</b>＝它、<b>乎</b>＝嗎。'},
      {type:'teach',kicker:'再看一次',title:'認出虛詞，剩下的實詞就是骨架',
       svg:animCanvas(360,240,'同一句話裡表示真正意思的實詞「學、時習、說」依序亮起，顯示句子的骨架'),
       mount:hl({title:'拿掉虛詞，剩下實詞骨架',caption:'把虛詞拿掉，剩下的實詞「學、時習、說」就是意思的骨架',loops:2,
         tokens:[{t:'學',hl:true,label:'實詞：學習'},{t:'而'},{t:'時習',hl:true,label:'實詞：按時溫習'},{t:'之'},{t:'，不亦'},{t:'說',hl:true,label:'實詞：愉快（通「悅」）'},{t:'乎？'}]}),
       text:'認得虛詞，句子結構就清楚一半。把<b>而、之、乎</b>這些虛詞先放一邊，剩下的<b>實詞</b>「學、時習、說」就是整句的<b>骨架</b>——學習、按時溫習、感到愉快。（「說」在這裡通「悅」，讀ㄩㄝˋ。）'},
      {type:'quiz',kicker:'換你試試',title:'文言文裡「之、乎、者、也」多半是？',
       options:['虛詞（表語氣或連接）','人名','數字','標點符號'],answer:0,
       whyWrong:{1:'它們不是人名；人名在文言裡通常照錄不譯。',2:'它們不表示數字。',3:'它們是字，不是標點符號。'},
       why:'之、乎、者、也多半不表具體意義，用於語氣或語法連接，屬於虛詞。'},
      {type:'quiz',kicker:'想一想',title:'「不亦說乎」的「乎」相當於白話的哪個字？',
       options:['嗎（表疑問）','的','了','在'],answer:0,
       why:'句末的「乎」表疑問語氣，約等於白話的「嗎」。'}
     ]},
   // ---------- 2. 斷句（句讀）：把長句切對地方 ----------
   { id:'duanju', name:'斷句（句讀）：把長句切對地方', emoji:'✂️', color:'#cf1322', sub:'古書沒標點，找虛詞和主謂來斷句',
     done:'記得：斷句找線索——句末常見也、矣、乎；句首常見夫、蓋；再找主謂，就能把長句切對地方。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'古書沒標點，要自己斷句',
       svg:animCanvas(360,240,'「學而時習之不亦說乎」在正確的斷句位置依序插入停頓標記'),
       mount:hl({title:'學而時習之／不亦說乎',caption:'在語意完整、句末虛詞處插入停頓，就把長句斷對了',loops:2,dwellMs:1300,
         tokens:[{t:'學而時習之'},{t:'，',hl:true,label:'斷句：語意完整，停一下',color:'--su'},{t:'不亦說乎'},{t:'？',hl:true,label:'句末「乎」收問句'}]}),
       text:'古書本來<b>沒有標點</b>，要自己<b>斷句</b>（又叫句讀）。斷錯了，意思就全變。像「學而時習之不亦說乎」，要在<b>「之」後面</b>語意完整的地方停一下，再在<b>句末「乎」</b>收成問句：「學而時習之，不亦說乎？」'},
      {type:'teach',kicker:'找線索',title:'找虛詞：句末也矣乎、句首夫蓋',
       svg:animCanvas(360,240,'「有朋自遠方來不亦樂乎」在「來」後與句末「乎」處依序插入停頓標記'),
       mount:hl({title:'有朋自遠方來／不亦樂乎',caption:'「來」後語意完整要斷開；句末「乎」是斷句線索',loops:2,dwellMs:1300,
         tokens:[{t:'有朋自遠方來'},{t:'，',hl:true,label:'斷句：「來」後語意完整',color:'--su'},{t:'不亦樂乎'},{t:'？',hl:true,label:'句末「乎」：斷句線索'}]}),
       text:'斷句的方法：先<b>找虛詞</b>——<b>也、矣、乎</b>常在<b>句末</b>，<b>夫、蓋</b>常在<b>句首</b>；再<b>找主謂</b>（誰＋做什麼）。像「有朋自遠方來不亦樂乎」，「來」後語意完整要斷開，句末「乎」收問句：「有朋自遠方來，不亦樂乎？」'},
      {type:'quiz',kicker:'換你試試',title:'「有朋自遠方來不亦樂乎」正確的斷句是？',
       options:['有朋自遠方來，不亦樂乎？','有朋自遠，方來不亦，樂乎？','有朋，自遠方來不亦樂乎？','有朋自遠方，來不亦樂乎？'],answer:0,
       whyWrong:{1:'「自遠」「方來」把詞拆散了，語意不通。',2:'「有朋」後不必斷，「來」後才語意完整。',3:'「來」是前一小句的收尾，應在「來」後斷開，不是在「方」後。'},
       why:'「乎」為句末疑問語氣，「來」後語意完整應斷開，所以斷成「有朋自遠方來，不亦樂乎？」。'},
      {type:'quiz',kicker:'想一想',title:'斷句時，常出現在句末、可當斷點線索的字是？',
       options:['也、矣、乎','山、水、木','一、二、三','你、我、他'],answer:0,
       why:'也、矣、乎這些語氣詞多位於句末，是斷句的好線索。'}
     ]},
   // ---------- 3. 翻譯五法：留刪補換調 ----------
   { id:'wufa', name:'翻譯五法：留刪補換調', emoji:'🔁', color:'#dc2626', sub:'留、刪、補、換、調——文言翻白話的五個步驟',
     done:'記得：翻譯五法——留（照留）、刪（刪虛詞）、補（補省略）、換（換今義）、調（調語序）。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'留、刪、補：照留、刪虛詞、補省略',
       svg:fanyiWu(),
       text:'文言翻白話有五個方法。<b>留</b>：人名、地名、官名<b>照留</b>不譯（孔子→孔子）。<b>刪</b>：只表語氣、無義的<b>虛詞刪去</b>（「夫戰」的發語詞「夫」不譯）。<b>補</b>：<b>補出省略</b>的主詞或受詞（「見漁人」補成「（村人）見漁人」）。'},
      {type:'teach',kicker:'再兩個',title:'換、調：換成今義、調成今序',
       svg:fanyiWu(),
       text:'<b>換</b>：古今詞<b>換成今義</b>——像「<b>曰</b>」換成「<b>說</b>」。<b>調</b>：把文言的<b>語序調成現代順序</b>——像「<b>何陋之有</b>」（賓語提前）調回「<b>有何陋</b>」（有什麼簡陋呢）。留、刪、補、換、調五法合用，就能把一句文言好好翻成白話。'},
      {type:'quiz',kicker:'換你試試',title:'文言「曰」翻成白話，要用哪一法？',
       options:['換（換成「說」）','留','刪','調'],answer:0,
       whyWrong:{1:'「留」是人名、地名照錄不譯，「曰」不是專有名詞。',2:'「刪」是刪去無義虛詞，「曰」有實義不能刪。',3:'「調」是調整語序，這裡只是換詞，語序沒變。'},
       why:'「曰」是古詞，翻譯時換成今義「說」，用的是「換」法。'},
      {type:'quiz',kicker:'想一想',title:'人名、地名在翻譯時通常怎麼處理？',
       options:['保留不譯（留）','全部刪掉（刪）','換成別的字（換）','顛倒順序（調）'],answer:0,
       why:'人名、地名、官名等專有名詞照錄即可，用的是「留」法。'}
     ]},
   // ---------- 4. 讀一則小故事：守株待兔 ----------
   { id:'shouzhu', name:'讀一則小故事：守株待兔', emoji:'🐰', color:'#e11d48', sub:'出自《韓非子》，文白對照讀寓言',
     done:'記得：讀文言＝先認虛詞 → 斷句 → 用五法翻譯 → 想寓意。守株待兔告訴我們：別把偶然當常態、守僥倖不努力。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'文白對照：故事的開頭',
       svg:animCanvas(360,240,'守株待兔原文「宋人有耕者，田中有株，兔走觸株，折頸而死」逐句亮起並對照白話'),
       mount:hl({title:'守株待兔（《韓非子‧五蠹》）',caption:'文言原句依序亮起，標籤是它的白話意思',loops:2,dwellMs:1400,
         tokens:[{t:'宋人有耕者',hl:true,label:'宋國有個種田的人'},{t:'，'},{t:'田中有株',hl:true,label:'田裡有個樹樁'},{t:'，'},{t:'兔走觸株',hl:true,label:'一隻兔子跑來撞上樹樁'},{t:'，'},{t:'折頸而死',hl:true,label:'折斷脖子死了'},{t:'。'}]}),
       text:'「守株待兔」出自<b>《韓非子‧五蠹》</b>。故事說：<b>宋人有耕者，田中有株，兔走觸株，折頸而死。</b>——宋國有個種田的人，田裡有個樹樁，一隻兔子跑來撞上樹樁，折斷脖子死了。對照白話，文言就讀懂了。'},
      {type:'teach',kicker:'想寓意',title:'文白對照：他做了什麼',
       svg:animCanvas(360,240,'守株待兔原文「因釋其耒而守株，冀復得兔」逐句亮起並對照白話'),
       mount:hl({title:'他放下農具，守著樹樁',caption:'看他之後的行為，就懂這則寓言在諷刺什麼',loops:2,dwellMs:1400,
         tokens:[{t:'因釋其耒而守株',hl:true,label:'於是放下農具守著樹樁'},{t:'，'},{t:'冀復得兔',hl:true,label:'希望再撿到兔子'},{t:'。'}]}),
       text:'接著：<b>因釋其耒而守株，冀復得兔。</b>——他於是<b>放下農具</b>，守著那個樹樁，希望能<b>再撿到兔子</b>。結果當然再也等不到。寓意是：<b>把偶然當常態、守著僥倖不肯努力，終究會落空。</b>'},
      {type:'quiz',kicker:'換你試試',title:'「守株待兔」的寓意最接近哪一個？',
       options:['守著僥倖不努力，終會落空','越努力就越幸運','做事要先計畫再行動','團結合作力量大'],answer:0,
       whyWrong:{1:'故事諷刺的正是「只等運氣、不努力」，不是鼓勵等幸運。',2:'這則寓言談的不是計畫，而是不該依賴偶然。',3:'故事只有一個人，和團結合作無關。'},
       why:'故事諷刺依賴偶然、守著僥倖、不肯付出努力的人，所以寓意是守僥倖不努力終會落空。'},
      {type:'quiz',kicker:'想一想',title:'這則寓言「守株待兔」出自哪一本書？',
       options:['《韓非子》','《論語》','《史記》','《詩經》'],answer:0,
       why:'「守株待兔」典出《韓非子‧五蠹》。'}
     ]}
  ]
};

})();
