/* =====================================================================
 * english_modals.ts  →  (tsc, tsconfig.legacy.json) →  english_modals.js
 * 情態助動詞教學頁的教學資料（window.CONCEPT）＋動畫 teach 的 canvas 佔位 helper。
 * 用一支「語氣強度量尺」(window.Anim.enMeter) 看懂：會不會 / 可不可以 / 該不該 /
 *   一定要 / 可能。排在 english_questions.html 之後的「先學觀念」小旅程。
 * 載入順序：game_core.js → 本檔 → anim_core.js → concept_engine.js
 *   （本檔提供 window.CONCEPT；PLAYABLE teach 的 mount 於執行期才用 window.Anim，
 *    故解析順序無虞——比照 english_concepts.ts / chinese_phonics_concepts.ts）。
 * 以 IIFE 包住：讓 helper 函式為檔案區域（避免與其他已遷移頁的同名 helper 如
 *   animCanvas 在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。
 * 文法正確性第一（母語直覺）：情態助動詞後一律接「原形動詞」(can swim)；
 *   mustn't（絕對禁止）≠ don't have to（不必）；may/might/could 表「某事也許會發生」
 *   時意思相近、可互換，不彼此排高低，和表「確定」的 will 對比才是重點。
 * ===================================================================== */
(function () {
// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim.enMeter 接手）。
// 尊重既有 .cn-svg 版面；canvas 給固定邏輯尺寸（含 CSS max-width，供 DPR 縮放讀 clientWidth）。
function animCanvas(w: number, h: number, label: string): string {
  return '<canvas class="cn-anim-canvas" width="'+w+'" height="'+h+'" '+
    'style="max-width:'+w+'px" '+
    'role="img" aria-label="'+label+'"></canvas>';
}

// 掛上「語氣強度量尺」：mount 收 .cn-svg 容器，呼叫 window.Anim.enMeter，回傳清理 {stop}。
function meter(cfg: any) {
  return function (host: HTMLElement) {
    if (!window.Anim) return;
    var h = window.Anim.enMeter(host, cfg);
    return function () { if (h && h.stop) h.stop(); };
  };
}

window.CONCEPT = {
  progKey:'english_modals_v1', practiceHref:'english_sense.html',
  lessons:[
   { id:'can', name:'can / can’t：能力與做得到', emoji:'💪', color:'#0d9488', sub:'會不會、做不做得到；後面接原形動詞',
     done:'can＝做得到，後面動詞原形。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'can＝會、做得到',
       svg:animCanvas(360,240,'能力量尺：左端是 can’t（不會），右端是 can（會、做得到），指針落在 can，例句 I can swim.'),
       mount:meter({axisLabel:'能力', stops:['can’t','can'], pointer:'can', example:'I can swim.'}),
       text:'<b>can</b> 表示「<b>會、做得到</b>」：<b>I can swim.</b>（我會游泳）。反過來<b>做不到／不會</b>就用 <b>can’t</b>（＝cannot）。重要的一點：<b>can 後面的動詞一律用原形</b>——說 <b>can swim</b>，不是 can to swim，也不是 cans。'},
      {type:'quiz',kicker:'換你試試',title:'選出正確的（我會騎腳踏車）',eq:'I ___ ride a bike.',
       options:['can','can to','cans'],answer:0,
       whyWrong:{1:'can 後面直接接原形，不加 to。',2:'情態助動詞 can 不隨主詞加 s。'},
       why:'can 後面接原形動詞，不加 to、也不加 s → I can ride a bike.'},
      {type:'quiz',kicker:'想一想',title:'can 後面的動詞要用哪一種？',
       options:['原形','加 s','加 -ing'],answer:0,
       whyWrong:{1:'情態助動詞後面不加 s，說 can swim 不是 can swims。',2:'can 後面不接 -ing，說 can swim 不是 can swimming。'},
       why:'can 是情態助動詞，後面一律接原形動詞，例如 can swim、can run。'},
      {type:'quiz',kicker:'想一想',title:'選出正確的（魚不會走路）',eq:'A fish ___ walk.',
       options:['can’t','can','don’t can'],answer:0,
       whyWrong:{1:'can 是「會」，但魚不會走路，要用否定。',2:'can 的否定是 can’t（cannot），不借助 don’t。'},
       why:'「不會、做不到」用 can’t（＝cannot）→ A fish can’t walk.'}
     ]},
   { id:'permission', name:'may / can：許可（可不可以）', emoji:'🙋', color:'#0891b2', sub:'問可不可以：Can/May I…?；may 較正式有禮',
     done:'問可不可以：Can/May I…?',
     steps:[
      {type:'teach',kicker:'先想一想',title:'問許可：Can I…? / May I…?',
       svg:animCanvas(360,240,'禮貌量尺：左端 Can I，右端 May I（較正式有禮），指針落在 May I，例句 May I come in?'),
       mount:meter({axisLabel:'禮貌', stops:['Can I','May I'], pointer:'May I', example:'May I come in?'}),
       text:'要問「<b>可不可以</b>」用 <b>Can I…?</b> 或 <b>May I…?</b>（<b>may</b> 聽起來<b>比較正式、有禮貌</b>）。兩個後面都接<b>原形動詞</b>：<b>May I come in?</b>。回答可以說 <b>Yes, you can.</b> ／ 不行說 <b>No, you can’t.</b>'},
      {type:'quiz',kicker:'換你試試',title:'選出正確的（很有禮貌地問）',eq:'___ I come in?',
       options:['May','Do','Am'],answer:0,
       whyWrong:{1:'問許可不用 Do I…?，要用情態助動詞。',2:'Am I…? 是問「我是不是…」，不是問可不可以。'},
       why:'May I…? 是較正式有禮的問許可方式 → May I come in?'},
      {type:'quiz',kicker:'想一想',title:'Can I borrow this? 的意思是？',
       options:['我可以借這個嗎','我會借','我借過了'],answer:0,
       whyWrong:{1:'這裡 Can I…? 是問許可「可不可以」，不是講能力。',2:'這句是問現在能不能借，不是說過去的事。'},
       why:'Can I…? 在這裡是問「可不可以」，所以是「我可以借這個嗎？」'},
      {type:'quiz',kicker:'想一想',title:'有禮貌地問「我可以用你的筆嗎？」',
       options:['May I use your pen?','May I to use your pen?','May I using your pen?'],answer:0,
       whyWrong:{1:'May I 後面直接接原形，不加 to。',2:'May I 後面接原形動詞，不用 -ing。'},
       why:'May I 後面接原形動詞 → May I use your pen?'}
     ]},
   { id:'should', name:'should：建議（該不該）', emoji:'💡', color:'#0e7490', sub:'給建議「最好…」；語氣不是強制',
     done:'給建議用 should；語氣是「最好」，不是「一定」。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'should＝最好、建議這樣做',
       svg:animCanvas(360,240,'建議強度量尺：could 到 should 到 must，指針落在中間的 should，表示「建議、最好」而不是強制，例句 You should rest.'),
       mount:meter({axisLabel:'建議強度', stops:['could','should','must'], pointer:'should', example:'You should rest.'}),
       text:'給別人<b>建議</b>、說「<b>最好這樣做</b>」用 <b>should</b>：<b>You should rest.</b>（你最好休息一下）。它的語氣在<b>中間</b>——是「<b>最好</b>」，不是「<b>一定</b>」。「<b>最好不要</b>」就用 <b>shouldn’t</b>。後面一樣接<b>原形動詞</b>。'},
      {type:'quiz',kicker:'換你試試',title:'選出正確的（你看起來很累，最好早點睡）',eq:'You look tired. You ___ go to bed early.',
       options:['should','can’t','may not'],answer:0,
       whyWrong:{1:'can’t 是「不能」，和「最好早點睡」的建議相反。',2:'may not 是「可能不、不被允許」，不是給建議。'},
       why:'給建議「最好…」用 should → You should go to bed early.'},
      {type:'quiz',kicker:'想一想',title:'選出正確的（我們最好不要浪費水）',eq:'We ___ waste water.',
       options:['shouldn’t','can','may'],answer:0,
       whyWrong:{1:'can 是「會、可以」，講不出「最好不要」。',2:'may 是「可以、也許」，不是勸人「最好不要」。'},
       why:'「最好不要」用 shouldn’t → We shouldn’t waste water.'},
      {type:'quiz',kicker:'想一想',title:'should 後面要接哪一種動詞？',
       options:['原形（should go）','to＋動詞（should to go）','動詞加 -ing（should going）'],answer:0,
       whyWrong:{1:'should 後面不加 to，說 should go 不是 should to go。',2:'should 後面接原形，不用 -ing。'},
       why:'should 也是情態助動詞，後面接原形動詞 → should go、should rest。'}
     ]},
   { id:'must', name:'must / have to：義務與必須', emoji:'⛑️', color:'#0d9488', sub:'一定要＝must/have to；禁止＝mustn’t；不必＝don’t have to',
     done:'一定要＝must／have to；禁止＝mustn’t；不必＝don’t have to。',
     steps:[
      {type:'teach',kicker:'先想一想',title:'must / have to＝一定要、必須',
       svg:animCanvas(360,240,'強制度量尺：should 到 must／have to，指針落在最強端的 must／have to，表示規定一定要做，例句 You must wear a helmet.'),
       mount:meter({axisLabel:'強制度', stops:['should','must／have to'], pointer:'must／have to', example:'You must wear a helmet.'}),
       text:'規定「<b>一定要、必須</b>」做用 <b>must</b> 或 <b>have to</b>：<b>You must wear a helmet.</b>（一定要戴安全帽）。小心兩個長得像、意思卻差很多的否定：<b>mustn’t</b>＝<b>絕對不可以（禁止）</b>；<b>don’t have to</b>＝<b>不必（沒必要，做不做都行）</b>。後面都接<b>原形動詞</b>。'},
      {type:'quiz',kicker:'換你試試',title:'選出正確的（騎車規定一定要戴安全帽）',eq:'On a bike, you ___ wear a helmet.',
       options:['must','may','could'],answer:0,
       whyWrong:{1:'may 是「可以、也許」，講不出「規定一定要」。',2:'could 是「可以、也許能」，不是強制規定。'},
       why:'規定必須做用 must／have to → you must wear a helmet.'},
      {type:'quiz',kicker:'想一想',title:'選出正確的（那個很危險，禁止碰！）',eq:'You ___ touch that—it’s dangerous!',
       options:['mustn’t','don’t have to','shouldn’t'],answer:0,
       whyWrong:{1:'don’t have to 是「不必」，但這裡是「絕對不可以碰」，意思差很多。',2:'shouldn’t 只是「最好不要」，語氣不夠；危險的事要用「絕對禁止」。'},
       why:'mustn’t＝絕對禁止；don’t have to 是「不必」，意思差很多 → You mustn’t touch that.'},
      {type:'quiz',kicker:'想一想',title:'選出正確的（週六，你不用去上學）',eq:'It’s Saturday. You ___ go to school.',
       options:['don’t have to','mustn’t','can’t'],answer:0,
       whyWrong:{1:'mustn’t 是「禁止」，會變成「禁止你去上學」，意思完全不同。',2:'can’t 是「不能、不會」，不是「沒必要」。'},
       why:'「不必、沒必要」用 don’t have to；mustn’t 是「禁止」，兩個意思完全不同。'},
      {type:'quiz',kicker:'想一想',title:'“You mustn’t park here.” 是什麼意思？',
       options:['這裡禁止停車','你不一定要停這裡','你可以停這裡'],answer:0,
       whyWrong:{1:'那是 don’t have to（不必）的意思；mustn’t 是「禁止」。',2:'mustn’t 是「絕對不可以」，不是「可以」。'},
       why:'mustn’t＝絕對禁止，所以是「這裡不可以停車」。'}
     ]},
   { id:'possibility', name:'may / might / could：可能性（也許）', emoji:'🌧️', color:'#0891b2', sub:'不確定會不會發生＝也許；和「確定」的 will 對比',
     done:'不確定用 may／might／could＝也許；確定才用 will。你會用語氣量尺挑對助動詞了！',
     steps:[
      {type:'teach',kicker:'先想一想',title:'may / might / could＝也許會',
       svg:animCanvas(360,240,'確定程度量尺：左端是「也許」（不確定），右端是「一定」（確定），指針落在也許這一端，例句 It might rain later.'),
       mount:meter({axisLabel:'有多確定', stops:['也許','一定'], pointer:'也許', example:'It might rain later.'}),
       text:'不確定一件事「<b>會不會發生</b>」時，用 <b>may / might / could</b>＝「<b>也許</b>」：<b>It might rain later.</b>（等一下也許會下雨）。這三個在表「某件事<b>也許會發生</b>」時意思<b>很接近、可以互換</b>，重點都是「<b>不確定</b>」，不用去比誰強誰弱。真正的對比是：<b>確定</b>才用 <b>will</b>。<br>（小提醒：猜某件事會不會發生<b>不要用 can</b>——can 講的是「一般能力／普遍可能」，不是對這件事的猜測。）'},
      {type:'quiz',kicker:'換你試試',title:'選出正確的（帶把傘，等一下也許會下雨）',eq:'Take an umbrella. It ___ rain later.',
       options:['might','must','can'],answer:0,
       whyWrong:{1:'must 是「一定、很確定」，但這裡只是猜測，不確定。',2:'can 表「一般能力／普遍可能」，不能用來猜等一下會不會下雨。'},
       why:'不確定會不會下雨 → might（也許）。'},
      {type:'quiz',kicker:'想一想',title:'will 和 might 的差別是什麼？',
       options:['will 比較確定、might 是也許','意思一樣','might 比較確定'],answer:0,
       whyWrong:{1:'兩個不一樣：will 是「一定會」，might 只是「也許」。',2:'剛好相反——might 才是「也許」，比較不確定。'},
       why:'will 表「一定會」比較確定；might 是「也許」，比較不確定。'},
      {type:'quiz',kicker:'想一想',title:'表示「他也許知道答案」（不確定），下面哪一個不能用？',eq:'He ___ know the answer.',
       options:['can','might','may'],answer:0,
       whyWrong:{1:'might 可以——它表「也許」，正合適。',2:'may 也可以——它和 might 一樣能表「也許」。'},
       why:'might 和 may 都能表「也許」、可以互換；can 表的是一般能力或普遍可能，不能用來猜某件事會不會發生。'}
     ]}
  ]
};

})();
