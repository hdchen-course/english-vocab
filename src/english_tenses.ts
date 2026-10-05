/* =====================================================================
 * english_tenses.ts  →  (tsc, tsconfig.legacy.json) →  english_tenses.js
 * 英文時態全套（過去・未來・完成）教學資料（window.CONCEPT）。
 * 延續 english_concepts.html（現在式）往過去／未來／完成擴展，teach-first 鷹架。
 * 載入順序：game_core.js → 本檔 → anim_core.js → concept_engine.js
 *   （本檔提供 window.CONCEPT；PLAYABLE teach 的 mount 於執行期才用 window.Anim，
 *    故解析順序無虞——比照 chinese_phonics_concepts.ts）。
 * 以 IIFE 包住：讓 helper 函式為檔案區域（避免與其他已遷移頁的同名 helper 如
 *   animCanvas 在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）；helper 只在建
 *   window.CONCEPT 時同步呼叫，動畫 mount 回傳的 cleanup 由 concept_engine 處理。
 * 文法正確性第一（母語自然）：不規則過去式 go→went／eat→ate／see→saw／make→made；
 *   was/were 主詞一致；be going to vs will；現在完成 have/has + 過去分詞（already/yet/ever/never）。
 * 繁中（絕不簡體、無中國用詞）；正面教「什麼情境用什麼時態」，不做台式錯誤對比。
 * ===================================================================== */
(function () {
// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
// canvas 給固定邏輯尺寸（含 CSS max-width，供 DPR 縮放讀 clientWidth）；時間軸場景為 window.Anim.enTimeline。
function animCanvas(w: number, h: number, label: string): string {
  return '<canvas class="cn-anim-canvas" width="'+w+'" height="'+h+'" '+
    'style="max-width:'+w+'px" '+
    'role="img" aria-label="'+label+'"></canvas>';
}
// 時間軸 mount：掛上 enTimeline 場景，回傳 concept_engine 可用的 cleanup。
function tl(cfg: any) {
  return function (host: any) {
    if (!window.Anim) return;
    var h = window.Anim.enTimeline(host, cfg);
    return function () { if (h && h.stop) h.stop(); };
  };
}

window.CONCEPT = {
  progKey:'english_tenses_v1', practiceHref:'english_sense.html',
  lessons:[
   // ---- 1. 過去簡單式（規則 -ed） ----
   { id:'past_ed', name:'過去簡單式（規則加 -ed）', emoji:'⏪', color:'#0d9488', sub:'昨天做完的事：動詞加 -ed', done:'過去做完的事＝動詞加 -ed（play→played、walk→walked），常和 yesterday、last night、ago 一起出現。抓到了！',
     steps:[
      {type:'teach',kicker:'先想一想',title:'做完了的事，動詞加 -ed',
       svg:animCanvas(360,240,'時間軸上，played 這個動作標在過去 past 的點上並打勾，表示昨天已經做完'),
       mount:tl({when:'past',aspect:'simple',marker:'played',label:'yesterday'}),
       text:'講<b>已經發生、做完了</b>的事，用<b>過去簡單式</b>。規則動詞的做法是<b>字尾加 -ed</b>：play → <b>played</b>、walk → <b>walked</b>。看時間軸：動作標在<b>過去 past</b> 的點上，還打了勾表示做完了。'},
      {type:'teach',kicker:'找時間詞',title:'yesterday、last night、ago 的好朋友',
       svg:animCanvas(360,240,'時間軸上，walked 這個動作標在過去 past 的點上並打勾'),
       mount:tl({when:'past',aspect:'simple',marker:'walked',label:'last night'}),
       text:'看到 <b>yesterday</b>（昨天）、<b>last night</b>（昨晚）、<b>…ago</b>（…以前）這些字，常常就是在講過去，動詞要用過去式：I <b>walked</b> home last night.'},
      {type:'quiz',kicker:'換你試試',title:'選出正確的',eq:'I ___ soccer yesterday.',options:['played','play','playing'],answer:0,
       whyWrong:['','play 是現在式（常常做），配不上 yesterday。','playing 要先加 be 動詞（am/is/are/was）才完整。'],
       why:'yesterday 是過去、而且做完了，規則動詞加 -ed → played。'},
      {type:'quiz',kicker:'想一想',title:'walk 的過去式是哪一個？',options:['walked','walks','walking'],answer:0,
       whyWrong:['','walks 是現在式、主詞單數時用的。','walking 是進行式用的 -ing 形。'],
       why:'walk 是規則動詞，過去式字尾加 -ed → walked。'},
      {type:'quiz',kicker:'再一題',title:'選出正確的',eq:'We ___ a movie last night.',options:['watched','watch','watches'],answer:0,
       whyWrong:['','watch 是現在式，配不上 last night。','watches 是現在式、主詞單數時用的。'],
       why:'last night 是過去，watch 加 -ed → watched。'}
     ]},
   // ---- 2. 過去簡單式（常見不規則） ----
   { id:'past_irr', name:'過去簡單式（常見不規則）', emoji:'🔁', color:'#0891b2', sub:'go→went、eat→ate、see→saw', done:'有些常用動詞過去式不加 -ed，而是換一個樣子：go→went、eat→ate、see→saw、have→had。見多就記住了。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'有些動詞「換個樣子」',
       svg:animCanvas(360,240,'時間軸上，went 這個動作標在過去 past 的點上並打勾，表示上週日去過了'),
       mount:tl({when:'past',aspect:'simple',marker:'went',label:'last Sunday'}),
       text:'有些<b>最常用</b>的動詞，過去式<b>不加 -ed</b>，而是<b>整個換一個樣子</b>：go → <b>went</b>、have → <b>had</b>、see → <b>saw</b>。一樣是過去做完的事，標在時間軸的過去點。'},
      {type:'teach',kicker:'記熟最划算',title:'eat → ate、see → saw',
       svg:animCanvas(360,240,'時間軸上，ate 這個動作標在過去 past 的點上並打勾'),
       mount:tl({when:'past',aspect:'simple',marker:'ate',label:'this morning'}),
       text:'這些不規則動詞用得<b>非常頻繁</b>，記熟最划算：eat → <b>ate</b>、see → <b>saw</b>、make → <b>made</b>、take → <b>took</b>。多讀幾次就記起來了。'},
      {type:'quiz',kicker:'換你試試',title:'選出正確的',eq:'We ___ to the zoo last Sunday.',options:['went','goed','go'],answer:0,
       whyWrong:['','go 的過去式不是 goed（它是不規則動詞）。','go 是原形，last Sunday 要用過去式。'],
       why:'go 的過去式是 went（不規則），所以 We went to the zoo.'},
      {type:'quiz',kicker:'想一想',title:'eat 的過去式是哪一個？',options:['ate','eated','eat'],answer:0,
       whyWrong:['','eat 的過去式不是 eated（它是不規則動詞）。','eat 是原形，不是過去式。'],
       why:'eat 的過去式是 ate（不規則）。'},
      {type:'quiz',kicker:'再一題',title:'選出正確的',eq:'I ___ a bird in the tree yesterday.',options:['saw','seed','see'],answer:0,
       whyWrong:['','see 的過去式不是 seed（它是不規則動詞）。','see 是原形，yesterday 要用過去式。'],
       why:'see 的過去式是 saw（不規則），所以 I saw a bird.'}
     ]},
   // ---- 3. 過去進行式（was/were + V-ing） ----
   { id:'past_prog', name:'過去進行式（was/were + V-ing）', emoji:'🎞️', color:'#0e7490', sub:'過去某一刻「正在」做', done:'過去某個時刻「正在進行」的動作＝was/were + 動詞-ing。I 和單數用 was，複數（they/we/you）用 were。常當背景：…when the phone rang。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'過去某一刻「正在」做',
       svg:animCanvas(360,240,'時間軸上，was reading 畫成過去點上的一段色帶，表示那段時間正在進行'),
       mount:tl({when:'past',aspect:'progressive',marker:'was reading',span:0.16}),
       text:'要講<b>過去某個時刻正在進行</b>的動作，用<b>過去進行式</b>＝<b>was / were ＋ 動詞-ing</b>：At 8 pm I <b>was reading</b>. 看時間軸：它不是一個點，而是過去的<b>一段「進行中」</b>。'},
      {type:'teach',kicker:'當背景用',title:'正在做…，另一件事突然發生',
       svg:animCanvas(360,240,'時間軸上，were playing 畫成過去點上的一段色帶'),
       mount:tl({when:'past',aspect:'progressive',marker:'were playing',span:0.16}),
       text:'過去進行式常用來<b>當背景</b>，再接一件突然發生的事：We <b>were playing</b> outside <b>when</b> it started to rain.（我和同伴用 <b>were</b>；一個人用 <b>was</b>。）'},
      {type:'quiz',kicker:'換你試試',title:'選出正確的',eq:'I ___ TV when you called.',options:['was watching','watched','am watching'],answer:0,
       whyWrong:['','watched 是過去「做完」的一件事；這裡強調你打來「那一刻正在看」。','am watching 是現在正在做，不是過去。'],
       why:'你打來的那一刻我正在看 → 過去進行式 was ＋ 動詞-ing → was watching。'},
      {type:'quiz',kicker:'想一想',title:'選出正確的（主詞是 They）',eq:'They ___ in the park then.',options:['were playing','was playing','are playing'],answer:0,
       whyWrong:['','They 是複數，要用 were，不是 was。','are playing 是現在正在做，then 是過去。'],
       why:'They 是複數，過去進行式用 were ＋ 動詞-ing → were playing。'},
      {type:'quiz',kicker:'再一題',title:'選出正確的',eq:'At eight last night, she ___ her homework.',options:['was doing','did','is doing'],answer:0,
       whyWrong:['','did 是過去做完一次；這裡強調八點「那時正在做」。','is doing 是現在正在做，不是過去。'],
       why:'過去某個時刻正在做，she 是單數 → was ＋ 動詞-ing → was doing。'}
     ]},
   // ---- 4. 未來式 will / be going to ----
   { id:'future', name:'未來式 will / be going to', emoji:'⏩', color:'#0d9488', sub:'當下決定用 will、已有打算或跡象用 be going to', done:'要講以後的事：will（當下才決定、或單純預測）、be going to（事先有打算，或眼前有跡象）。兩個都對，差在「情境」。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'未來的事標在時間軸右邊',
       svg:animCanvas(360,240,'時間軸上，will go 標在未來 future 的點上，表示明天要去'),
       mount:tl({when:'future',aspect:'simple',marker:'will go',label:'tomorrow'}),
       text:'要講<b>以後</b>的事，動作標在時間軸的<b>未來 future</b>。<b>will</b> 用在<b>當下才決定</b>或<b>單純預測</b>：I think it <b>will</b> be sunny. I\'<b>ll</b> help you.'},
      {type:'teach',kicker:'已有打算或跡象',title:'be going to：早有打算、眼前有跡象',
       svg:animCanvas(360,240,'時間軸上，is going to 標在未來 future 的點上'),
       mount:tl({when:'future',aspect:'simple',marker:'is going to',label:'soon'}),
       text:'<b>be going to</b>（am/is/are going to）用在<b>事先就有打算</b>，或<b>眼前有跡象</b>的預測：We <b>are going to</b> visit grandma. Look at those clouds — it\'s <b>going to</b> rain!'},
      {type:'quiz',kicker:'換你試試',title:'選出正確的',eq:'Look at those clouds! It ___ rain.',options:['is going to','will','was'],answer:0,
       whyWrong:['','will 文法沒錯，但眼前有「烏雲」這種跡象的預測，母語者更自然用 be going to。','was 是過去，這裡在講馬上要發生的事。'],
       why:'眼前有跡象（烏雲）的預測，用 be going to 最自然 → It is going to rain.'},
      {type:'quiz',kicker:'想一想',title:'選出正確的',eq:'A: I\'m cold. B: I ___ close the window.',options:['will','am going to','closed'],answer:0,
       whyWrong:['','am going to 用在事先就有打算；這裡是聽到之後「當下才決定」。','closed 是過去，這件事還沒做。'],
       why:'聽到之後當下才決定要做的事，用 will → I will close the window.'},
      {type:'quiz',kicker:'再一題',title:'選出正確的（早就計畫好了）',eq:'We ___ visit grandma next week.',options:['are going to','will','visit'],answer:0,
       whyWrong:['','will 文法沒錯，但「事先計畫好」的事，母語者更自然用 be going to。','visit 是原形，要講未來不能只用原形。'],
       why:'已經計畫好的事用 be going to 最自然 → We are going to visit grandma.'}
     ]},
   // ---- 5. 現在完成式（have/has + 過去分詞） ----
   { id:'present_perfect', name:'現在完成式（have/has + 過去分詞）', emoji:'✅', color:'#0891b2', sub:'到現在為止：已完成、對現在有影響', done:'「到現在為止」用 have/has ＋ 過去分詞，強調已完成、對現在有影響；常和 already/yet/just/ever/never 一起用，不講明確的過去時間點。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'從過去「連到現在」',
       svg:animCanvas(360,240,'時間軸上，have finished 畫成從過去 past 一路連到現在 now 的箭頭，並在 now 打勾，和過去簡單式只點過去一點不同'),
       mount:tl({aspect:'perfect',marker:'have finished'}),
       text:'<b>現在完成式</b>＝<b>have / has ＋ 過去分詞</b>，講<b>到現在為止</b>已完成、對<b>現在</b>有影響的事：I <b>have finished</b> my homework.（所以現在能玩了。）看時間軸：它是從<b>過去一路連到現在</b>，不是只點過去一個點。'},
      {type:'teach',kicker:'常見好朋友',title:'already / yet / ever / never',
       svg:animCanvas(360,240,'時間軸上，have seen 畫成從過去 past 連到現在 now 的箭頭並在 now 打勾'),
       mount:tl({aspect:'perfect',marker:'have seen'}),
       text:'現在完成式常和 <b>already</b>（已經）、<b>yet</b>（還、尚未）、<b>just</b>（剛剛）、<b>ever</b>（曾經）、<b>never</b>（從不）一起用，而且<b>不講明確的過去時間點</b>：She <b>has never seen</b> snow.'},
      {type:'quiz',kicker:'換你試試',title:'選出正確的',eq:'I ___ my homework, so I can play now.',options:['have finished','finished yesterday','am finishing'],answer:0,
       whyWrong:['','講出明確過去時間點（yesterday）就用過去簡單式，不是完成式。','am finishing 表示還在做、沒做完。'],
       why:'強調現在已完成、對現在有影響 → 現在完成式 have finished。'},
      {type:'quiz',kicker:'想一想',title:'選出正確的（她從沒看過雪）',eq:'She ___ snow.',options:['has never seen','never saw','never sees'],answer:0,
       whyWrong:['','never saw 是過去簡單式；「到現在為止從沒…」用現在完成式。','never sees 是現在簡單式（講習慣），不是經驗。'],
       why:'「到現在為止從來沒有過」的經驗，用 has ＋ 過去分詞 → has never seen。'},
      {type:'quiz',kicker:'再一題',title:'選出正確的',eq:'___ you ___ your lunch yet?',options:['Have…eaten','Did…ate','Are…eating'],answer:0,
       whyWrong:['','Did 後面要用原形（eat），而且問 yet（到現在為止）用現在完成式。','Are…eating 是問現在正不正在吃，不是問做完沒。'],
       why:'yet 問「到現在為止做完了沒」→ 現在完成式 Have you eaten …？（eat 的過去分詞是 eaten。）'}
     ]},
   // ---- 6. 把時態放在一起比一比 ----
   { id:'choose', name:'比一比，選對時態', emoji:'🧭', color:'#0e7490', sub:'看時間詞和「做完沒／連到現在」選時態', done:'看時間線選時態：yesterday→過去、now／當下正在→現在／進行、tomorrow→未來、already/yet/ever→現在完成。你已經會用英文講清楚「什麼時候」了！',
     steps:[
      {type:'teach',kicker:'先看全圖',title:'同一條時間軸，四種時態站在哪裡',
       svg:animCanvas(460,300,'同一條時間軸上同時標出四種時態：過去簡單式 played 在過去的點、過去進行式 was playing 在過去的一段、未來式 will play 在未來的點、現在完成式 have played 從過去連到現在'),
       mount:tl({markers:[
         {when:'past',aspect:'simple',marker:'played'},
         {when:'past',aspect:'progressive',marker:'was playing'},
         {when:'future',aspect:'simple',marker:'will play'},
         {when:'past',aspect:'perfect',marker:'have played',highlight:true}
       ]}),
       text:'把學過的時態放在<b>同一條時間軸</b>看：<b>played</b> 是過去的一個點、<b>was playing</b> 是過去的一段「正在」、<b>will play</b> 在未來、<b>have played</b> 從過去連到現在。位置不同，意思就不同。'},
      {type:'teach',kicker:'一句話整理',title:'靠時間詞挑時態',
       svg:animCanvas(460,300,'時間軸上高亮未來式 will play，另外三種時態變淡做對照'),
       mount:tl({markers:[
         {when:'past',aspect:'simple',marker:'played'},
         {when:'past',aspect:'progressive',marker:'was playing'},
         {when:'future',aspect:'simple',marker:'will play',highlight:true},
         {when:'past',aspect:'perfect',marker:'have played'}
       ]}),
       text:'挑時態的小訣竅：<b>yesterday → 過去</b>、<b>now／當下正在 → 現在／進行</b>、<b>tomorrow → 未來</b>、<b>already／yet／ever → 現在完成</b>。先找時間詞，再看「做完沒、連不連到現在」。'},
      {type:'quiz',kicker:'換你試試',title:'選出正確的',eq:'___ you ever ___ to Japan?',options:['Have…been','Did…went','Are…being'],answer:0,
       whyWrong:['','Did 後面要用原形（go），而且 ever 問經驗用現在完成式。','be 動詞沒有這種用法；問經驗要用 Have you been。'],
       why:'ever 問「到現在為止的經驗」→ 現在完成式 Have you ever been to Japan?（go 的過去分詞是 been。）'},
      {type:'quiz',kicker:'想一想',title:'選出正確的',eq:'While I ___, it started to snow.',options:['was walking','walk','have walked'],answer:0,
       whyWrong:['','walk 少了時態；這裡要講過去正在做的背景。','have walked 是「到現在為止」，配不上「正走著時突然下雪」的背景。'],
       why:'「正走著的時候」突然下雪 → 過去進行式當背景 → was walking。'},
      {type:'quiz',kicker:'再一題',title:'選出正確的',eq:'I ___ my keys. I can\'t find them now.',options:['have lost','lost yesterday','am losing'],answer:0,
       whyWrong:['','講出明確過去時間（yesterday）就用過去簡單式。','am losing 表示正在遺失中，意思不對。'],
       why:'過去弄丟、現在還找不到（對現在有影響）→ 現在完成式 have lost。'},
      {type:'quiz',kicker:'最後一題',title:'選出正確的',eq:'Yesterday we ___ a cake for Mom.',options:['made','make','have made'],answer:0,
       whyWrong:['','make 是原形，yesterday 要用過去式。','有明確過去時間（yesterday）就用過去簡單式，不用完成式。'],
       why:'yesterday 是過去，make 的過去式（不規則）是 made。'}
     ]}
  ]
};

})();
