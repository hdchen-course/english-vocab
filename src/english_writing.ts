/* =====================================================================
 * english_writing.ts  →  (tsc, tsconfig.legacy.json) →  english_writing.js
 *   english_writing.html 的教學資料（window.CONCEPT）。寫作鷹架：句 → 段 → 短文。
 *   每個 teach step 的 viz 都是 PLAYABLE：共用 window.Anim.enSentenceBuild
 *     （statement＝詞磚飛入彩色欄位、可點放置；paragraph＝句子橫條堆成一段、可選檢查表）。
 *   以 IIFE 包住讓 animCanvas() 為檔案區域（避免與其他已遷移頁同名頂層 helper 在
 *     tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。
 *   行為、載入順序與其他 concept 頁一致（本檔取代原 inline 位置）。
 *   引擎＝concept_engine.js（teach→quiz）；型別見 src/types/globals.d.ts。
 * ===================================================================== */
(function () {
// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
// statement 用 360×240；paragraph（含結尾句／檢查表）需要更寬，用 440–470 寬。
function animCanvas(w: number, h: number, label: string): string {
  return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
    'style="max-width:' + w + 'px" ' +
    'role="img" aria-label="' + label + '"></canvas>';
}

window.CONCEPT = {
  progKey: 'english_writing_v1',
  lessons: [
   // ---- L1：主詞 + 動詞（S + V）----
   { id:'sv', name:'句子的骨架：主詞＋動詞', emoji:'🧱', color:'#0d9488',
     sub:'一個英文句子最少要有「誰＋做什麼」',
     done:'記得：主詞（誰）＋動詞（做什麼）＝一個完整句子；句首大寫、句尾加句點。骨架有了！',
     steps:[
      {type:'teach',kicker:'先想一想',title:'一個句子最少要有兩塊',
       svg:animCanvas(360,240,'造句動畫：The dog、runs 兩塊詞磚依序飛進主詞欄、動詞欄，組成 The dog runs，句末彈出句點'),
       mount:function(host){return window.Anim && window.Anim.enSentenceBuild(host,{mode:'statement',slots:['Subject','Verb'],tiles:['The dog','runs'],label:'造句動畫：The dog（主詞）、runs（動詞）兩塊詞磚依序飛進彩色欄位，組成 The dog runs．，句首大寫、句末加句點。'});},
       text:'一個英文句子最少要有兩塊：<b>主詞</b>（誰／什麼）＋<b>動詞</b>（做什麼）。像 <b>The dog</b>（主詞）＋ <b>runs</b>（動詞）＝ <b>The dog runs.</b> 這樣就是一個完整的句子了。'},
      {type:'teach',kicker:'別忘了兩件事',title:'句首大寫、句尾句點',
       svg:animCanvas(360,240,'造句動畫：The sun、rises 兩塊詞磚飛進欄位組成 The sun rises，標出句首大寫與句末句點'),
       mount:function(host){return window.Anim && window.Anim.enSentenceBuild(host,{mode:'statement',slots:['Subject','Verb'],tiles:['The sun','rises'],label:'造句動畫：The sun（主詞）、rises（動詞）飛進欄位組成 The sun rises．，強調句首第一個字母大寫、句末加句點。'});},
       text:'寫好句子還要記得<b>兩件事</b>：第一個字母要<b>大寫</b>（The…），句子結束要加<b>句點</b>（.）。像 <b>The sun rises.</b>——大寫開頭、句點結尾，句子才算寫完整。'},
      {type:'quiz',kicker:'換你試試',title:'下面哪一個是完整的句子？',
       options:['The dog runs.','Running fast.','A big dog.'],answer:0,
       whyWrong:{1:'Running fast. 只有動作，缺一個主詞（誰在跑？），不是完整句子。',2:'A big dog. 只有一個名詞詞組，缺動詞（做什麼？），不是完整句子。'},
       why:'有主詞 The dog ＋ 動詞 runs，才是完整句子：The dog runs.'},
      {type:'quiz',kicker:'想一想',title:'英文句子的開頭要用什麼？',
       options:['大寫字母','小寫字母','數字'],answer:0,
       whyWrong:{1:'小寫開頭不行，英文句子的第一個字母一定要大寫。',2:'數字也不行，句子要用大寫字母開頭。'},
       why:'英文句子開頭的第一個字母要大寫，例如 The、I、She。'},
      {type:'quiz',kicker:'想一想',title:'把句子補完整',eq:'The cat ___ .',
       options:['sleeps','happy','very'],answer:0,
       whyWrong:{1:'happy 是形容詞，不是動詞；句子還是缺「做什麼」。',2:'very 不能當動詞，句子仍然不完整。'},
       why:'The cat sleeps. 有主詞 The cat ＋ 動詞 sleeps，才是完整句子。'}
     ]},

   // ---- L2：S + V + O / 加形容詞 ----
   { id:'svo', name:'加上受詞與形容詞', emoji:'🎨', color:'#0891b2',
     sub:'很多動詞後面要接受詞；形容詞放在名詞前面',
     done:'記得：很多動詞後面要接「做的對象」＝受詞（I like pizza.）；形容詞放在名詞前面，順序是「大小→顏色」（a big red ball）。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'動詞後面常常要接受詞',
       svg:animCanvas(360,240,'造句動畫：I、like、pizza 三塊詞磚飛進主詞欄、動詞欄、受詞欄，組成 I like pizza'),
       mount:function(host){return window.Anim && window.Anim.enSentenceBuild(host,{mode:'statement',slots:['Subject','Verb','Object'],tiles:['I','like','pizza'],highlight:'Object',label:'造句動畫：I（主詞）、like（動詞）、pizza（受詞）三塊詞磚依序飛進彩色欄位，組成 I like pizza．'});},
       text:'很多動詞後面要接一個<b>受詞</b>——也就是「做的對象」。像 <b>I</b>（主詞）＋ <b>like</b>（動詞）＋ <b>pizza</b>（受詞）＝ <b>I like pizza.</b> 有了受詞，句子才說得完整。'},
      {type:'teach',kicker:'讓句子更具體',title:'形容詞放在名詞前面',
       svg:animCanvas(360,240,'造句動畫：She、has、a big red ball 三塊詞磚飛進欄位，組成 She has a big red ball'),
       mount:function(host){return window.Anim && window.Anim.enSentenceBuild(host,{mode:'statement',slots:['Subject','Verb','Object'],tiles:['She','has','a big red ball'],highlight:'Object',label:'造句動畫：She（主詞）、has（動詞）、a big red ball（受詞）飛進欄位，示範形容詞放在名詞前面。'});},
       text:'<b>形容詞</b>放在名詞<b>前面</b>，可以讓句子更具體。像 ball 前面加上 <b>big</b>、<b>red</b> ＝ <b>a big red ball</b>（一顆又大又紅的球）。英文形容詞有順序：<b>大小</b>（big）放在<b>顏色</b>（red）前面。'},
      {type:'quiz',kicker:'換你試試',title:'排成最自然的句子：ball / a / red / big',
       eq:'___',
       options:['a big red ball','a red big ball','big a red ball'],answer:0,
       whyWrong:{1:'英文形容詞順序是「大小」在「顏色」前面，所以 big 要放在 red 前面。',2:'冠詞 a 要放在最前面，順序是 a → 大小 → 顏色 → 名詞。'},
       why:'英文形容詞順序：先大小（big）再顏色（red），所以是 a big red ball。'},
      {type:'quiz',kicker:'想一想',title:'選出正確的動詞',eq:'I ___ a book.',
       options:['read','reads','reading'],answer:0,
       whyWrong:{1:'reads 用在單數的 he / she / it；主詞是 I，要用原形 read。',2:'reading 是進行式用的，不能單獨當主要動詞。'},
       why:'主詞 I 用動詞原形：I read a book.'},
      {type:'quiz',kicker:'想一想',title:'動詞 like 後面要接什麼？',eq:'I like ___ .',
       options:['pizza','quickly','very'],answer:0,
       whyWrong:{1:'quickly 是副詞，不能當 like 的受詞。',2:'very 不能單獨當受詞；like 後面要接一個名詞。'},
       why:'動詞 like 後面要接受詞（一個名詞），例如 I like pizza.'}
     ]},

   // ---- L3：連接詞 and / but / because / so ----
   { id:'conn', name:'用連接詞把句子接起來', emoji:'🔗', color:'#0e7490',
     sub:'and 加訊息、but 轉折、because 給原因、so 給結果',
     done:'記得：and＝再加一個訊息；but＝相反、轉折；because＝給原因；so＝給結果。連接詞讓兩個想法合成一句更順的話。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'連接詞把兩個想法接起來',
       svg:animCanvas(360,240,'造句動畫：I was tired、so、I went to bed 三塊詞磚接成一句 I was tired, so I went to bed'),
       mount:function(host){return window.Anim && window.Anim.enSentenceBuild(host,{mode:'statement',slots:['Clause','Conn','Clause'],tiles:['I was tired','so','I went to bed'],highlight:'Conn',label:'造句動畫：I was tired、so、I went to bed 三塊接成一句，連接詞 so 把兩個子句接起來。'});},
       text:'<b>連接詞</b>可以把兩個想法接成一句更順的話。常用的有四個：<b>and</b>（再加訊息）、<b>but</b>（相反、轉折）、<b>because</b>（給原因）、<b>so</b>（給結果）。像 <b>I was tired, so I went to bed.</b>（累了，所以去睡覺）。'},
      {type:'teach',kicker:'看語意選連接詞',title:'意思不同，選的連接詞也不同',
       svg:animCanvas(360,240,'造句動畫：She is small、but、she is strong 接成一句 She is small, but she is strong'),
       mount:function(host){return window.Anim && window.Anim.enSentenceBuild(host,{mode:'statement',slots:['Clause','Conn','Clause'],tiles:['She is small','but','she is strong'],highlight:'Conn',label:'造句動畫：She is small、but、she is strong 接成一句，連接詞 but 表示前後相反的轉折。'});},
       text:'選哪個連接詞，要看<b>兩個想法的關係</b>：相反、對比用 <b>but</b>（She is small, <b>but</b> she is strong.）；原因用 <b>because</b>；結果用 <b>so</b>；單純再加一件事用 <b>and</b>。先想關係，再選連接詞。'},
      {type:'quiz',kicker:'換你試試',title:'選出最合適的連接詞',eq:'I was hungry, ___ I ate a sandwich.',
       options:['so','but','because'],answer:0,
       whyWrong:{1:'but 是轉折；但這裡前後是「原因→結果」，不是相反。',2:'because 後面要接原因；但這句的後半是結果，不是原因。'},
       why:'肚子餓是原因、吃三明治是結果，用 so（所以）。'},
      {type:'quiz',kicker:'想一想',title:'選出最合適的連接詞',eq:'She is small ___ strong.',
       options:['but','so','because'],answer:0,
       whyWrong:{1:'so 表示結果；但「小」和「強壯」是相反的對比，不是結果。',2:'because 要接原因；但這裡是對比，不是原因。'},
       why:'「小」和「強壯」是相反的對比，用 but（但是）。'},
      {type:'quiz',kicker:'想一想',title:'選出最合適的連接詞',eq:'I stayed home ___ I was sick.',
       options:['because','so','but'],answer:0,
       whyWrong:{1:'so 要放在「結果」前面；但這裡後半是原因（生病），不是結果。',2:'but 是轉折；但前後沒有相反的意思。'},
       why:'「生病」是待在家的原因，用 because（因為）。'}
     ]},

   // ---- L4：主題句 + 支持句 ----
   { id:'topic', name:'主題句＋支持句', emoji:'🏔️', color:'#0d9488',
     sub:'一句主題句講重點，再用幾句支持句補細節',
     done:'記得：一個小段落先用一句「主題句」講重點，再用 2–3 句「支持句」補細節。像金字塔：先講大的，再講小的。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'一句領頭，幾句補充',
       svg:animCanvas(440,270,'段落動畫：主題句 My dog is a great pet 高亮在最上面，下面兩條支持句依序堆成一段'),
       mount:function(host){return window.Anim && window.Anim.enSentenceBuild(host,{mode:'paragraph',slots:['Topic','Detail','Detail'],tiles:['My dog is a great pet.','He plays with me every day.','He likes to eat bones.'],label:'段落動畫：主題句 My dog is a great pet. 高亮在最上面，下面兩條支持細節句依序堆成一段。'});},
       text:'一個小段落，先用一句<b>主題句</b>說出整段的<b>重點</b>（My dog is a great pet.），再用 <b>2–3 句支持句</b>補上細節（He plays with me every day. / He likes to eat bones.）。主題句領頭，支持句補充。'},
      {type:'teach',kicker:'像一座金字塔',title:'先講大的，再講小的',
       svg:animCanvas(440,270,'段落動畫：主題句 Summer is the best season 高亮在最上，兩條支持句堆在下面'),
       mount:function(host){return window.Anim && window.Anim.enSentenceBuild(host,{mode:'paragraph',slots:['Topic','Detail','Detail'],tiles:['Summer is the best season.','I can swim in the sea.','I eat lots of ice cream.'],label:'段落動畫：主題句 Summer is the best season. 高亮在最上面，兩條支持細節句堆在下面。'});},
       text:'段落就像一座<b>金字塔</b>：最上面是<b>大的（主題句）</b>，下面是<b>小的（支持句）</b>。所有支持句都要<b>圍繞同一個主題</b>，不能跳到別的話題，整段才會清楚、不離題。'},
      {type:'quiz',kicker:'換你試試',title:'下面哪一句最適合當主題句？',
       options:['My dog is a great pet.','He likes bones.','He is brown.'],answer:0,
       whyWrong:{1:'He likes bones. 只講一件小事，是支持細節，不能概括整段。',2:'He is brown. 只描述顏色，是細節，不是整段的重點。'},
       why:'主題句要講整段的重點（我的狗是很棒的寵物），其他兩句都是支持細節。'},
      {type:'quiz',kicker:'想一想',title:'支持句的作用是什麼？',
       options:['補充說明主題句','換一個新主題','問一個問題'],answer:0,
       whyWrong:{1:'換新主題會讓段落離題；支持句要圍繞同一個主題。',2:'支持句是用來說明的，不是用來問問題。'},
       why:'支持句的作用是補充細節、說明主題句。'},
      {type:'quiz',kicker:'想一想',title:'主題句是「My dog is a great pet.」，哪一句最適合當支持句？',
       options:['He plays with me every day.','Cats are nice too.','What time is it?'],answer:0,
       whyWrong:{1:'Cats are nice too. 跳到貓，離題了，沒有支持「我的狗」。',2:'這是一個問句，和主題無關。'},
       why:'支持句要圍繞主題（我的狗很棒）補充細節，例如 He plays with me every day.'}
     ]},

   // ---- L5：寫一小段短文 + 自我檢查 ----
   { id:'paragraph', name:'寫一小段短文＋檢查', emoji:'📝', color:'#0891b2',
     sub:'主題句 → 2–3 支持句 → 結尾句，寫完自我檢查',
     done:'記得：一小段＝主題句 → 2–3 支持句 → 一句結尾；寫完自我檢查三件事：每句有主詞動詞？時態一致？大寫開頭、句點結尾？你會寫一小段通順的英文了！',
     steps:[
      {type:'teach',kicker:'先想一想',title:'組合：主題句 → 支持句 → 結尾句',
       svg:animCanvas(440,290,'段落動畫：主題句、兩條支持句、結尾句四條橫條由上而下堆成一段'),
       mount:function(host){return window.Anim && window.Anim.enSentenceBuild(host,{mode:'paragraph',slots:['Topic','Detail','Detail','Closing'],tiles:['Summer is my favorite season.','I can swim at the beach.','I eat cold ice cream.','I love summer so much.'],closing:true,label:'段落動畫：主題句 Summer is my favorite season.、兩條支持句、結尾句 I love summer so much. 四條橫條由上而下堆成一段。'});},
       text:'把學過的組合起來，就能寫一小段：先一句<b>主題句</b>（Summer is my favorite season.），再 <b>2–3 句支持句</b>（I can swim… / I eat…），最後一句<b>結尾句</b>收起來（I love summer so much.）。',},
      {type:'teach',kicker:'寫完一定要做',title:'自我檢查三件事',
       svg:animCanvas(470,300,'段落動畫：四條句子堆成一段，右側逐項打勾檢查：每句有主詞動詞、時態一致、大寫開頭句點結尾'),
       mount:function(host){return window.Anim && window.Anim.enSentenceBuild(host,{mode:'paragraph',slots:['Topic','Detail','Detail','Closing'],tiles:['My family is big.','I have two brothers.','We play games together.','I love my family.'],closing:true,checklist:true,label:'段落動畫：四條句子堆成一段，右側逐項打勾檢查三件事：每句有主詞加動詞、時態一致、大寫開頭與標點結尾。'});},
       text:'寫完別急著交，先<b>自我檢查三件事</b>：①每一句都有<b>主詞＋動詞</b>嗎？②整段<b>時態一致</b>嗎（都在講現在、還是都在講過去）？③每句<b>大寫開頭、句點結尾</b>嗎？三個都打勾，這段就通順又正確了。'},
      {type:'quiz',kicker:'換你試試',title:'這一小段少了什麼？',
       eq:'I like summer. I can swim. I eat ice cream.',
       options:['一句結尾句','主題句','動詞'],answer:0,
       whyWrong:{1:'第一句 I like summer. 已經可以當主題句了。',2:'每一句都有動詞（like、swim、eat），不缺動詞。'},
       why:'已經有主題句＋細節，缺一句收尾，例如 Summer is my favorite season.'},
      {type:'quiz',kicker:'想一想',title:'檢查這句，哪裡要改？',
       eq:'she go to school yesterday',
       options:['go 改成 went，she 要大寫，句尾加句點','完全正確','只有 school 要大寫'],answer:0,
       whyWrong:{1:'這句有三個問題：小寫開頭、動詞時態不對、沒有句點，不是完全正確。',2:'school 是普通名詞不用大寫；要改的是大寫開頭、go→went、加句點。'},
       why:'yesterday 是過去，動詞用 went；句首大寫、句尾加句點 → She went to school yesterday.'},
      {type:'quiz',kicker:'想一想',title:'選出正確的動詞',eq:'Yesterday I ___ to the park.',
       options:['went','go','going'],answer:0,
       whyWrong:{1:'Yesterday 表示過去，go 是現在式；要用過去式 went。',2:'going 不能單獨當主要動詞。'},
       why:'Yesterday 表示過去，動詞用過去式：Yesterday I went to the park.'},
      {type:'quiz',kicker:'想一想',title:'哪一句的大寫和標點完全正確？',
       options:['My family is big.','my family is big','My family is big'],answer:0,
       whyWrong:{1:'開頭沒有大寫、句尾也沒有句點。',2:'開頭有大寫，但句尾少了句點。'},
       why:'句子要大寫開頭、句尾加句點：My family is big.'}
     ]}
  ]
};

})();
