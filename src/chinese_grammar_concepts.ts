/* =====================================================================
 * chinese_grammar_concepts.ts  →  (tsc, tsconfig.legacy.json) →  chinese_grammar_concepts.js
 * 國語「語法與病句」觀念頁（詞類／句子骨架／病句修改）的 window.CONCEPT 資料與 SVG helper。
 * 以 IIFE 包住讓 animCanvas／SVG helper 為檔案區域（避免與其他已遷移頁同名頂層 helper
 *   在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。
 * 零新增 Anim 場景：PLAYABLE 視覺一律重用既有 window.Anim.blockAssemble（主詞/動詞/受詞
 *   積木與病句 fix 換塊）與 window.Anim.textHighlight（點亮重複詞）。
 * 載入順序（見 .html）：chinese_grammar_concepts.js → anim_core.js → concept_engine.js。
 * ===================================================================== */
(function () {
// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
function animCanvas(w: number, h: number, label: string) {
  return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
    'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
}

// 詞類／成分配色（傳給 blockAssemble；低透明度底色，文字用 currentColor 隨主題變色）。
var NOUN = '#2563eb', VERB = '#b91c1c', ADJ = '#d97706';         // 名詞／動詞／形容詞
var SUBJ = '#2563eb', ACT = '#b91c1c', OBJ = '#16a34a';         // 主詞／動詞／受詞
var WARN = '#e11d48';
var TINT = 'rgba(185,28,28,0.12)';

// ---- static SVG helpers（每個 teach 都要有推理視覺；文字 fill=currentColor 隨主題變色）----

// L1 teach1：詞有分類——名詞（人事物）／動詞（動作）／形容詞（樣子），各給三個例字。
function wordClassTable() {
  var cols = [
    { x: 10, c: NOUN, head: '名詞', sub: '人、事、物', eg: ['貓', '學校', '朋友'] },
    { x: 106, c: VERB, head: '動詞', sub: '動作', eg: ['跑', '吃', '想'] },
    { x: 202, c: ADJ, head: '形容詞', sub: '樣子', eg: ['紅', '高', '開心'] }
  ];
  var s = '<svg viewBox="0 0 300 182" role="img" aria-label="詞分三類：名詞是人事物（貓、學校、朋友）、動詞是動作（跑、吃、想）、形容詞是樣子（紅、高、開心）">';
  cols.forEach(function (col) {
    s += '<rect x="' + col.x + '" y="10" width="88" height="162" rx="12" fill="' + TINT + '" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.6"/>';
    s += '<rect x="' + col.x + '" y="10" width="88" height="30" rx="12" fill="none" stroke="' + col.c + '" stroke-width="2"/>';
    s += '<text x="' + (col.x + 44) + '" y="30" text-anchor="middle" font-size="15" font-weight="800" fill="currentColor">' + col.head + '</text>';
    s += '<text x="' + (col.x + 44) + '" y="54" text-anchor="middle" font-size="11" fill="currentColor">（' + col.sub + '）</text>';
    var y = 82;
    col.eg.forEach(function (w) {
      s += '<text x="' + (col.x + 44) + '" y="' + y + '" text-anchor="middle" font-size="15" fill="currentColor">' + w + '</text>';
      y += 30;
    });
  });
  return s + '</svg>';
}

// L2 teach1：句子骨架——主詞（誰）→ 動詞（做什麼）→ 受詞（對象）。
function skeletonDiagram() {
  function arrow(x1: number, x2: number, y: number) {
    return '<line x1="' + x1 + '" y1="' + y + '" x2="' + (x2 - 7) + '" y2="' + y + '" stroke="currentColor" stroke-width="2.4" stroke-opacity="0.6"/>' +
      '<polygon points="' + x2 + ',' + y + ' ' + (x2 - 9) + ',' + (y - 5) + ' ' + (x2 - 9) + ',' + (y + 5) + '" fill="currentColor" fill-opacity="0.6"/>';
  }
  var parts = [
    { x: 8, c: SUBJ, head: '主詞', sub: '誰' },
    { x: 110, c: ACT, head: '動詞', sub: '做什麼' },
    { x: 212, c: OBJ, head: '受詞', sub: '對象' }
  ];
  var s = '<svg viewBox="0 0 300 150" role="img" aria-label="句子的骨架：主詞（誰）加上動詞（做什麼），有時再加受詞（動作的對象）">';
  parts.forEach(function (p, i) {
    s += '<rect x="' + p.x + '" y="30" width="80" height="60" rx="12" fill="' + TINT + '" stroke="' + p.c + '" stroke-width="2"/>';
    s += '<text x="' + (p.x + 40) + '" y="58" text-anchor="middle" font-size="15" font-weight="800" fill="currentColor">' + p.head + '</text>';
    s += '<text x="' + (p.x + 40) + '" y="78" text-anchor="middle" font-size="11" fill="currentColor">（' + p.sub + '）</text>';
    if (i < parts.length - 1) s += arrow(p.x + 80, parts[i + 1].x, 60);
  });
  s += '<text x="150" y="118" text-anchor="middle" font-size="12" fill="currentColor">例：小明（主詞）＋ 吃（動詞）＋ 蘋果（受詞）</text>';
  s += '<text x="150" y="138" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.8">「受詞」有時候才會出現，不一定每句都有</text>';
  return s + '</svg>';
}

// L4 teach1：詞語要「搭得起來」——✔ 提高水準／✔ 提高品質；✘ 加強水準（台灣用「水準、品質」）。
function collocationTable() {
  var rows = [
    { ok: true, t: '提高水準' },
    { ok: true, t: '提高品質' },
    { ok: false, t: '加強水準', fix: '改成「提高水準」' }
  ];
  var s = '<svg viewBox="0 0 300 170" role="img" aria-label="詞語搭配：提高水準、提高品質都搭得起來；加強水準搭不起來，要改成提高水準">';
  var y = 20;
  rows.forEach(function (r) {
    var mark = r.ok ? '✓' : '✗';
    var mc = r.ok ? OBJ : WARN;
    s += '<rect x="12" y="' + y + '" width="276" height="42" rx="10" fill="' + TINT + '" stroke="' + mc + '" stroke-width="1.6"/>';
    s += '<circle cx="36" cy="' + (y + 21) + '" r="13" fill="none" stroke="' + mc + '" stroke-width="2"/>';
    s += '<text x="36" y="' + (y + 26) + '" text-anchor="middle" font-size="16" font-weight="800" fill="currentColor">' + mark + '</text>';
    s += '<text x="60" y="' + (y + 26) + '" font-size="15" font-weight="700" fill="currentColor">' + r.t + '</text>';
    if (r.fix) s += '<text x="168" y="' + (y + 26) + '" font-size="12" fill="currentColor" opacity="0.85">→ ' + r.fix + '</text>';
    y += 50;
  });
  return s + '</svg>';
}

window.CONCEPT = {
  progKey: 'chinese_grammar_v1', practiceHref: 'chinese.html',
  lessons: [
    {
      id: 'wordclass', name: '詞有分類：名詞・動詞・形容詞', emoji: '🧩', color: '#b91c1c',
      sub: '名詞是人事物、動詞是動作、形容詞是樣子',
      done: '記得：名詞是人、事、物（貓、學校、朋友）；動詞是動作（跑、吃、想）；形容詞是樣子（紅的、高的、開心的）。',
      steps: [
        { type: 'teach', kicker: '先想一想', title: '詞有三大類', svg: wordClassTable(), text: '我們說的詞，可以先分成三大類。<b>名詞</b>是人、事、物，像<b>貓、學校、朋友</b>；<b>動詞</b>是動作，像<b>跑、吃、想</b>；<b>形容詞</b>是形容樣子，像<b>紅的、高的、開心的</b>。' },
        { type: 'teach', kicker: '組組看', title: '一句話常是「名詞＋動詞」', svg: animCanvas(360, 300, '三色方塊由上而下滑入組成一句話：可愛的（形容詞）、小狗（名詞）、跑（動詞）'), mount: function (host: HTMLElement) { var h = window.Anim.blockAssemble(host, { title: '一句話＝名詞＋動詞（加形容詞更生動）', blocks: [{ label: '可愛的（形容詞）', color: ADJ }, { label: '小狗（名詞）', color: NOUN }, { label: '跑（動詞）', color: VERB }], caption: '形容詞＋名詞＋動詞，組成一句生動的話' }); return function () { h.stop(); }; }, text: '一句話常常是「<b>誰（名詞）＋做什麼（動詞）</b>」，像<b>小狗跑</b>。再加一個<b>形容詞</b>（可愛的），就變成「<b>可愛的小狗跑</b>」，畫面更清楚。' },
        { type: 'quiz', kicker: '換你試試', title: '「跑、吃、想」這些是哪一類詞？', options: ['名詞', '動詞', '形容詞', '數字'], answer: 1, why: '它們都表示「動作」，所以是動詞。', whyWrong: ['名詞是人、事、物（像貓、學校），不是動作。', '', '形容詞是形容樣子（像紅的、高的），不是動作。', '數字是一、二、三這類，不是這裡的分類。'] },
        { type: 'quiz', kicker: '想一想', title: '「美麗的花」裡的「美麗」是哪一類詞？', options: ['名詞', '動詞', '形容詞', '數量詞'], answer: 2, why: '「美麗」在形容「花」的樣子，所以是形容詞。', whyWrong: ['「花」才是名詞；「美麗」是形容它的詞。', '「美麗」沒有動作的意思，不是動詞。', '', '數量詞是「三朵、一隻」這種，這裡沒有。'] }
      ]
    },
    {
      id: 'skeleton', name: '句子的骨架：主詞＋動詞（＋受詞）', emoji: '🦴', color: '#dc2626',
      sub: '找出誰、做什麼、對象，就看懂一句話',
      done: '記得：一句話的骨架＝主詞（誰）＋動詞（做什麼），有時再加受詞（動作的對象）。',
      steps: [
        { type: 'teach', kicker: '先想一想', title: '誰、做什麼、對象', svg: skeletonDiagram(), text: '一句話有骨架。<b>主詞</b>是「<b>誰</b>／什麼」，像小明；<b>動詞</b>是「<b>做什麼</b>」，像跑步、吃；有時候再加一個<b>受詞</b>，是<b>動作的對象</b>，像「吃蘋果」的蘋果。' },
        { type: 'teach', kicker: '組組看', title: '組出「小明 吃 蘋果」', svg: animCanvas(360, 300, '三個方塊由上而下滑入組成句子骨架：小明（主詞）、吃（動詞）、蘋果（受詞）'), mount: function (host: HTMLElement) { var h = window.Anim.blockAssemble(host, { title: '句子骨架：主詞＋動詞＋受詞', blocks: [{ label: '小明（主詞・誰）', color: SUBJ }, { label: '吃（動詞・做什麼）', color: ACT }, { label: '蘋果（受詞・對象）', color: OBJ }], caption: '找到主詞和動詞，就抓到一句話的骨架了' }); return function () { h.stop(); }; }, text: '把「<b>小明</b>（主詞）＋<b>吃</b>（動詞）＋<b>蘋果</b>（受詞）」組起來，就是一句完整的話。先找<b>主詞</b>和<b>動詞</b>，再看有沒有<b>受詞</b>，就能看懂骨架。' },
        { type: 'quiz', kicker: '換你試試', title: '「弟弟在公園玩球。」這句的主詞是？', options: ['弟弟', '公園', '玩', '球'], answer: 0, why: '做這件事的「誰」是弟弟，所以弟弟是主詞。', whyWrong: ['', '公園是地點，不是做事情的那個人。', '「玩」是動作（動詞），不是主詞。', '球是「玩」的對象（受詞），不是主詞。'] },
        { type: 'quiz', kicker: '想一想', title: '「小貓抓老鼠」裡的「老鼠」是句子的哪一部分？', options: ['主詞', '動詞', '受詞', '形容詞'], answer: 2, why: '老鼠是「抓」這個動作的對象，所以是受詞。', whyWrong: ['主詞是做動作的「小貓」。', '動詞是表示動作的「抓」。', '', '這裡沒有形容樣子的詞。'] }
      ]
    },
    {
      id: 'redundant', name: '病句一：重複囉嗦', emoji: '🔍', color: '#e11d48',
      sub: '找出意思重複的詞，刪掉一個就通順',
      done: '記得：意思重複的詞（像「大約」和「差不多」、「全部」和「都」），刪掉一個，句子就乾淨又通順。',
      steps: [
        { type: 'teach', kicker: '先找找看', title: '哪裡怪怪的？意思重複了', svg: animCanvas(360, 230, '句子「他 大約 差不多 十歲」中，「大約」和「差不多」兩個意思重複的詞依序亮起'), mount: function (host: HTMLElement) { var h = window.Anim.textHighlight(host, { title: '找出重複囉嗦的詞', tokens: [{ t: '他' }, { t: '大約', hl: true, label: '重複①', color: WARN }, { t: '差不多', hl: true, label: '重複②', color: WARN }, { t: '十歲' }], caption: '「大約」和「差不多」意思一樣，重複了' }); return function () { h.stop(); }; }, text: '看「<b>他大約差不多十歲</b>」。<b>大約</b>和<b>差不多</b>意思一模一樣，連在一起就<b>重複囉嗦</b>了。常見的重複還有「<b>全部都</b>」「<b>我親眼看見</b>」。' },
        { type: 'teach', kicker: '這樣改', title: '刪掉重複的詞', svg: animCanvas(360, 300, '句子方塊中，紅色的「大約差不多」被劃掉，換成綠色的「大約」，變成通順的「他 大約 十歲」'), mount: function (host: HTMLElement) { var h = window.Anim.blockAssemble(host, { title: '刪掉重複，句子更乾淨', blocks: [{ label: '他', color: SUBJ }, { label: '（修正）', color: WARN }, { label: '十歲', color: NOUN }], fix: { atIndex: 1, wrong: '大約差不多', right: '大約' }, caption: '刪掉重複的詞，意思不變、句子更乾淨' }); return function () { h.stop(); }; }, text: '修法很簡單：<b>刪掉重複的那一個</b>。「大約差不多」留一個就好，改成「<b>他大約十歲</b>」——意思完全沒變，句子卻乾淨多了。' },
        { type: 'quiz', kicker: '換你試試', title: '下面哪一句最通順、沒有多餘的詞？', options: ['他大約差不多十歲', '他大約十歲', '他差不多大約十歲', '他大約差不多大概十歲'], answer: 1, why: '「大約」和「差不多」意思重複，留一個就好，所以「他大約十歲」最乾淨。', whyWrong: ['「大約」和「差不多」意思重複了。', '', '「差不多」和「大約」還是重複，只是順序顛倒，一樣囉嗦。', '「大約」「差不多」「大概」三個意思都一樣，重複更多了。'] },
        { type: 'quiz', kicker: '想一想', title: '「我們全部都要去。」怎麼改比較通順？', options: ['我們全部要去', '我們全部都統統要去', '維持「我們全部都要去」', '我們全部都通通一起去'], answer: 0, why: '「全部」和「都」意思重疊，刪掉一個（像「我們全部要去」或「我們都要去」）就更簡潔。', whyWrong: ['', '「全部」「都」「統統」三個意思重疊，更囉嗦了。', '「全部」和「都」意思重疊，刪一個會更好。', '「全部」「都」「通通」「一起」重疊更多，更囉嗦。'] }
      ]
    },
    {
      id: 'collocation', name: '病句二：搭配不當・語序亂', emoji: '🧷', color: '#be123c',
      sub: '詞要搭得起來、順序要排對',
      done: '記得：詞語要搭得起來（提高水準✔／加強水準✘），順序也要排對（我把作業寫完了✔），句子才不會生病。',
      steps: [
        { type: 'teach', kicker: '先想一想', title: '詞語要「搭得起來」', svg: collocationTable(), text: '有些詞天生就<b>搭得起來</b>，有些搭不起來。「<b>提高水準</b>」「<b>提高品質</b>」都很順；但「<b>加強水準</b>」就怪怪的，要改成「<b>提高水準</b>」。（台灣用「<b>水準</b>、<b>品質</b>」。）' },
        { type: 'teach', kicker: '這樣改', title: '把字句：語序要排對', svg: animCanvas(360, 300, '句子方塊中，紅色亂序的「我寫完把作業了」被劃掉，換成綠色正確的「我把作業寫完了」'), mount: function (host: HTMLElement) { var h = window.Anim.blockAssemble(host, { title: '把字句語序：主詞＋把＋受詞＋動詞', blocks: [{ label: '公式：主詞 ＋ 把 ＋ 受詞 ＋ 動詞', color: SUBJ }, { label: '（照公式修正）', color: WARN }], fix: { atIndex: 1, wrong: '我寫完把作業了', right: '我把作業寫完了' }, caption: '語序排對，句子才通順' }); return function () { h.stop(); }; }, text: '語序排錯也會生病。「把」字句的順序是「<b>主詞＋把＋受詞＋動詞</b>」。所以「我寫完把作業了」要改成「<b>我把作業寫完了</b>」，讀起來才順。' },
        { type: 'quiz', kicker: '換你試試', title: '下面哪一句的語序正確？', options: ['我寫完把作業了', '我把作業寫完了', '作業把我寫完了', '把我作業寫完了'], answer: 1, why: '「把」字句的語序是「主詞＋把＋受詞＋動詞」，所以「我把作業寫完了」才正確。', whyWrong: ['「把」要放在動詞前面：主詞＋把＋受詞＋動詞。', '', '這樣變成「作業」把「我」寫完，意思顛倒了。', '少了主詞，而且語序也不對。'] },
        { type: 'quiz', kicker: '想一想', title: '「他的學習水準（　）了很多。」哪個動詞和「水準」最搭、最通順？', options: ['提高', '加強', '打開', '放大'], answer: 0, why: '「提高」可以搭配「水準」（提高水準）；所以「他的學習水準提高了很多」最通順。', whyWrong: ['', '「加強」常搭「練習、防守」，和「水準」搭不起來。', '「打開」用在門、窗、電器，不搭「水準」。', '「放大」用在圖片、聲音，不搭「水準」。'] }
      ]
    }
  ]
};

})();
