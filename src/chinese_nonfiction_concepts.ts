/* =====================================================================
 * chinese_nonfiction_concepts.ts  →  (tsc, tsconfig.legacy.json) →  chinese_nonfiction_concepts.js
 * 「非記敘文閱讀策略」觀念養成（說明文結構／議論文論點論據／事實vs意見／圖表非連續文本判讀）。
 *   國小高年級→國中；補既有閱讀幾乎全為記敘、缺說明/議論結構與圖表判讀的缺口。
 *   資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）。
 *   動畫課重用 anim_core.js 的 window.Anim.textHighlight（點亮主題句/關聯詞/論點）與
 *   window.Anim.barChartCallout（長條依序長高＋逐一拉出說明旗，含 misleadFlag 誤導示範）——
 *   兩者皆為跨科共用場景，不重造。事實/意見兩欄卡為本頁 local stepped SVG（只給 svg、無 mount）。
 *   以 IIFE 包住讓 animCanvas / SVG helper 為檔案區域（避免與其他遷移頁同名頂層 helper
 *   在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。純本地進度（progKey），不餵主 XP。
 * ===================================================================== */
(function () {

// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
function animCanvas(w: number, h: number, label: string): string {
  return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
    'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
}

var AC = '#b91c1c', FILL = 'rgba(185,28,28,0.10)';
var GRN = '#16a34a', OPI = '#d97706';

// CJK 斷行：把一段字切成每行最多 n 字的多行（SVG <text> 不會自動換行）。
function wrap(str: string, n: number): string[] {
  var out: string[] = [];
  for (var i = 0; i < str.length; i += n) out.push(str.slice(i, i + n));
  return out;
}

// 事實 vs 意見：兩欄卡片。左＝事實（✔ 可查證，綠），右＝意見（💭 看法，橙）。
// 用半透明底色＋currentColor 文字（夜間模式安全：底色透明，卡片背景透出來）。
function factOpinion(fact: string, opinion: string): string {
  var s = '<svg viewBox="0 0 300 180" role="img" aria-label="左欄是可以查證的事實，右欄是個人看法的意見">';
  // 左欄：事實
  s += '<rect x="8" y="12" width="134" height="156" rx="12" fill="rgba(22,163,74,0.10)" stroke="' + GRN + '" stroke-width="2"/>';
  s += '<text x="75" y="36" text-anchor="middle" font-size="14" font-weight="800" fill="' + GRN + '">事實 ✔</text>';
  s += '<text x="75" y="54" text-anchor="middle" font-size="10.5" fill="currentColor">可以查證</text>';
  wrap(fact, 7).forEach(function (ln, i) {
    s += '<text x="75" y="' + (84 + i * 20) + '" text-anchor="middle" font-size="12" fill="currentColor">' + ln + '</text>';
  });
  // 右欄：意見
  s += '<rect x="158" y="12" width="134" height="156" rx="12" fill="rgba(217,119,6,0.10)" stroke="' + OPI + '" stroke-width="2"/>';
  s += '<text x="225" y="36" text-anchor="middle" font-size="14" font-weight="800" fill="' + OPI + '">意見 💭</text>';
  s += '<text x="225" y="54" text-anchor="middle" font-size="10.5" fill="currentColor">個人看法</text>';
  wrap(opinion, 7).forEach(function (ln, i) {
    s += '<text x="225" y="' + (84 + i * 20) + '" text-anchor="middle" font-size="12" fill="currentColor">' + ln + '</text>';
  });
  return s + '</svg>';
}

(window as any).CONCEPT = {
  progKey: 'chinese_nonfiction_v1', practiceHref: 'chinese.html',
  lessons: [
   { id: 'expository', name: '說明文：把事情說清楚', emoji: '📋', color: '#b91c1c',
     sub: '總說→分項→總結；順著「首先/接著/最後」抓結構',
     done: '記得：說明文＝把一件事「說清楚」（是什麼、怎麼做、為什麼），常用「總說→分項→總結」，順著「首先/接著/最後」就抓到結構。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '說明文的骨架：總說 → 分項 → 總結',
        svg: animCanvas(360, 240, '一段介紹蜜蜂的說明文，依序點亮三個語塊並掛上標籤：總說、分項、總結'),
        mount: function (host: HTMLElement) {
          var h = (window as any).Anim.textHighlight(host, {
            title: '說明文的三段骨架',
            tokens: [
              { t: '蜜蜂是勤勞的昆蟲。', hl: true, label: '總說' },
              { t: '牠們到處採花蜜、也幫花朵傳粉，', hl: true, label: '分項' },
              { t: '所以對大自然很重要。', hl: true, label: '總結' }
            ],
            caption: '先總說主題，再一項一項說明，最後收尾'
          });
          return function () { h.stop(); };
        },
        text: '說明文的目的是把事情<b>說清楚</b>：是什麼、怎麼做、為什麼。常見的骨架是<b>總說→分項→總結</b>——先一句點出主題（總說），再一項一項說明（分項），最後收個尾（總結）。' },
      { type: 'teach', kicker: '看一個例子', title: '「如何泡一杯茶」：找出步驟詞',
        svg: animCanvas(360, 240, '泡茶的說明文，依序點亮步驟關聯詞：首先、接著、最後'),
        mount: function (host: HTMLElement) {
          var h = (window as any).Anim.textHighlight(host, {
            title: '步驟詞：首先 / 接著 / 最後',
            tokens: [
              { t: '泡一杯茶：' },
              { t: '首先', hl: true, label: '步驟1' },
              { t: '把水燒開，' },
              { t: '接著', hl: true, label: '步驟2' },
              { t: '放入茶葉泡幾分鐘，' },
              { t: '最後', hl: true, label: '步驟3' },
              { t: '倒進杯子就完成了。' }
            ],
            caption: '「首先/接著/最後」標出先後步驟'
          });
          return function () { h.stop(); };
        },
        text: '說明「怎麼做」時，常用<b>首先、接著、最後</b>這類詞標出<b>先後步驟</b>。看到它們，就知道作者正在一步一步教你做一件事——這就是說明文的結構線索。' },
      { type: 'quiz', kicker: '換你試試', title: '說明文主要是為了什麼？',
        options: ['抒發自己的情感', '把一件事說清楚', '編一個精彩的故事', '發表自己的立場'], answer: 1,
        whyWrong: { 0: '抒發情感是抒情文的重點。', 2: '編故事是記敘文／故事。', 3: '發表立場是議論文。' },
        why: '說明文重在客觀地把事物或方法「說清楚」。' },
      { type: 'quiz', kicker: '想一想', title: '「首先…接著…最後…」這些詞，幫你看出什麼？',
        options: ['作者的心情', '先後步驟或順序', '句子有沒有押韻', '文章有幾個字'], answer: 1,
        why: '這些關聯詞標示先後步驟，是說明文的結構線索。' }
     ] },
   { id: 'argument', name: '議論文：立場＋理由', emoji: '⚖️', color: '#dc2626',
     sub: '論點（主張）＋論據（理由證據）＋論證（推論）',
     done: '記得：議論文＝先找出作者的<b>主張（論點）</b>，再看他給了哪些<b>理由證據（論據）</b>來說服你。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '議論文的三件事：論點 → 論據 → 論證',
        svg: animCanvas(360, 240, '一段主張多運動的議論文，依序點亮並標籤：論點、論據、論證'),
        mount: function (host: HTMLElement) {
          var h = (window as any).Anim.textHighlight(host, {
            title: '論點 / 論據 / 論證',
            tokens: [
              { t: '我們應該多運動，', hl: true, label: '論點（主張）' },
              { t: '因為運動能讓身體更健康、心情更好，', hl: true, label: '論據（理由）' },
              { t: '由此可見，多運動對大家都有好處。', hl: true, label: '論證（推論）' }
            ],
            caption: '先表明立場，再給理由，最後推出結論'
          });
          return function () { h.stop(); };
        },
        text: '議論文＝提出一個<b>主張（論點）</b>＋給出<b>理由證據（論據）</b>＋做出<b>推論（論證）</b>。作者是要<b>說服你</b>接受他的立場，所以讀的時候要分清楚：哪句是主張，哪些是理由。' },
      { type: 'teach', kicker: '看一個例子', title: '找出主張句，和支持它的兩個理由',
        svg: animCanvas(360, 240, '一段主張學校延後上學的議論文，依序點亮主張句與兩個理由並標籤：論點、論據1、論據2'),
        mount: function (host: HTMLElement) {
          var h = (window as any).Anim.textHighlight(host, {
            title: '主張句 → 理由1 → 理由2',
            tokens: [
              { t: '學校應該延後上學時間。', hl: true, label: '論點' },
              { t: '第一，這樣學生可以睡得更飽；', hl: true, label: '論據1' },
              { t: '第二，上課時也更能專心。', hl: true, label: '論據2' }
            ],
            caption: '一個主張，底下通常有好幾個理由撐著'
          });
          return function () { h.stop(); };
        },
        text: '這段話的<b>主張（論點）</b>是「學校應該延後上學時間」；後面「<b>睡得更飽</b>」「<b>更能專心</b>」是兩個<b>理由（論據）</b>。讀議論文時，先抓主張，再數一數他給了幾個理由。' },
      { type: 'quiz', kicker: '換你試試', title: '議論文裡一定會有的是什麼？',
        options: ['一段優美的風景描寫', '一個主張和支持它的理由', '一個完整的故事情節', '很多角色的對話'], answer: 1,
        whyWrong: { 0: '那偏向寫景的記敘／抒情。', 2: '完整情節是記敘文／故事。', 3: '大量對話也多見於記敘文。' },
        why: '議論文要表明立場，並用理由來說服別人。' },
      { type: 'quiz', kicker: '想一想', title: '「我認為學校應該延後上學時間」這句話是？',
        options: ['一個主張（論點）', '一項可以查證的事實', '一段抒情的描寫', '一個故事的開頭'], answer: 0,
        why: '它表明了作者的立場，是論點，而不是證據或事實。' }
     ] },
   { id: 'fact-opinion', name: '分清楚事實和意見', emoji: '🔍', color: '#e11d48',
     sub: '可查證＝事實；個人看法＝意見',
     done: '記得：能客觀<b>查證</b>的是「事實」，<b>個人看法</b>是「意見」；讀議論文先分清楚，才不會被說服詞牽著走。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '事實 ✔ 可查證　vs　意見 💭 看法',
        svg: factOpinion('台北101有101層', '台北101最漂亮'),
        text: '<b>事實</b>是可以<b>客觀查證</b>的，像「台北101有101層」——去查就知道對不對。<b>意見</b>是<b>個人看法</b>，像「台北101最漂亮」——每個人想法不同，沒辦法證明誰對誰錯。' },
      { type: 'teach', kicker: '讀議論文要會分', title: '別被「意見」當成「事實」牽著走',
        svg: factOpinion('這本書賣了十萬本', '這本書最好看'),
        text: '作者常把<b>意見</b>講得很像<b>事實</b>來說服你。像「這本書賣了十萬本」是可查證的<b>事實</b>；但「這本書最好看」只是<b>意見</b>。讀的時候要一句一句分清楚，才不會被說服詞騙了。' },
      { type: 'quiz', kicker: '換你試試', title: '下列哪一句是「事實」？',
        options: ['這首歌最好聽', '一年有十二個月', '紅色比藍色美', '他跑得超快'], answer: 1,
        whyWrong: { 0: '「最好聽」是個人評價。', 2: '「比較美」每個人看法不同。', 3: '「超快」是主觀感覺，沒有標準。' },
        why: '可以客觀查證的才是事實；其餘三句都是主觀評價。' },
      { type: 'quiz', kicker: '想一想', title: '「這部電影是今年最棒的」這句是？',
        options: ['事實', '意見', '一個數字', '一個標題'], answer: 1,
        why: '「最棒」是主觀評價，無法客觀證明，所以屬於意見。' }
     ] },
   { id: 'chart-reading', name: '讀圖表：先看標題、單位、軸', emoji: '📊', color: '#be123c',
     sub: '非連續文本：先看標題＋單位＋座標軸，別被「看起來」騙',
     done: '記得：讀圖表先看<b>標題＋單位＋座標軸</b>，再找你要的數字；兩條長條「看起來差很多」時，先檢查 Y 軸是不是從 0 開始。',
     steps: [
      { type: 'teach', kicker: '先看動畫', title: '長條圖怎麼讀：找最多、找最少',
        svg: animCanvas(360, 230, '班級各月借書量的長條圖，長條依序長高，再拉出說明旗標出三月最多、一月最少'),
        mount: function (host: HTMLElement) {
          var h = (window as any).Anim.barChartCallout(host, {
            title: '各月借書量（單位：本）', unit: '本',
            bars: [
              { label: '一月', value: 12 }, { label: '二月', value: 20 },
              { label: '三月', value: 35 }, { label: '四月', value: 28 }, { label: '五月', value: 16 }
            ],
            callouts: [{ barIndex: 2, note: '三月最多' }, { barIndex: 0, note: '一月最少' }]
          });
          return function () { h.stop(); };
        },
        text: '圖表<b>不是從頭讀到尾</b>——先看<b>標題</b>（在講什麼）、<b>單位和座標軸</b>，再去找你要的數字。這張是各月借書量，一眼就能比出<b>三月最多、一月最少</b>。' },
      { type: 'teach', kicker: '小心誤導', title: 'Y 軸沒從 0 開始，差距會被放大',
        svg: animCanvas(360, 240, '兩班借書量78與82的長條圖，Y軸沒有從0開始，兩條長條看起來差很多，畫面標出Y軸沒從0開始'),
        mount: function (host: HTMLElement) {
          var h = (window as any).Anim.barChartCallout(host, {
            title: '兩班借書量（Y 軸沒從 0）', unit: '本', misleadFlag: true,
            bars: [{ label: '甲班', value: 78 }, { label: '乙班', value: 82 }],
            callouts: [{ barIndex: 1, note: '看起來高好多' }]
          });
          return function () { h.stop(); };
        },
        text: '甲班 78 本、乙班 82 本，其實只差 4 本。但如果<b>Y 軸不從 0 開始</b>（例如從 70 畫起），乙班的長條就會<b>看起來高出一大截</b>——差距被視覺放大了。所以永遠要<b>先看軸的起點</b>，再回到「標題＋單位＋軸」好好判讀。' },
      { type: 'quiz', kicker: '換你試試', title: '看一張長條圖，應該最先看什麼？',
        options: ['哪一條顏色最漂亮', '標題和座標軸（單位）', '圖畫得大不大', '一共用了幾種顏色'], answer: 1,
        whyWrong: { 0: '顏色漂不漂亮和資料無關。', 2: '圖的大小不代表數字大小。', 3: '顏色數量不是重點。' },
        why: '先看標題與單位，才知道這些數字代表什麼。' },
      { type: 'quiz', kicker: '想一想', title: '兩條長條「看起來差很多」，但數字只差一點，可能是因為？',
        options: ['Y 軸沒有從 0 開始', '長條用了不同顏色', '圖畫得太小', '紙張太白'], answer: 0,
        why: '座標軸的起點不是 0，會把差距在視覺上放大，是常見的誤導手法。' }
     ] }
  ]
};

})();
