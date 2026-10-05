/* =====================================================================
 * english_grammar_plus.ts  →  (tsc, tsconfig.legacy.json) →  english_grammar_plus.js
 *   english_grammar_plus.html 的教學資料（window.CONCEPT）。進階文法觀念（國中→高中）：
 *     被動語態（pv_*）／條件句（cond_*）／關係子句（rel_*）／動名詞與不定詞（ging_*）。
 *   viz 以 REUSE 為先：能用共用 window.Anim 場景就用——
 *     enSentenceBuild（statement＝詞磚飛入彩色欄位、可點放置）組「be+p.p.」「be+p.p.+by」「enjoy+V-ing」句；
 *     enMeter（語氣／可能性量尺）呈現第二類條件句的「與事實相反／想像」。
 *   既有共用場景覆蓋不到的「轉換／合併／選用」圖（主受詞對調、兩句合一、關代選用、to V vs V-ing），
 *     一律用「檔案區域」靜態 SVG helper 畫（不新增 anim_core 共用場景、不新增私有 CSS class）。
 *   以 IIFE 包住讓 helper／animCanvas 為檔案區域（避免與其他已遷移頁同名頂層 helper 在
 *     tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。
 *   引擎＝concept_engine.js（teach→quiz）；型別見 src/types/globals.d.ts。
 *   載入順序（同 english_writing.html）：game_core.js → english_grammar_plus.js → anim_core.js → concept_engine.js。
 * ===================================================================== */
(function () {

// ---- 動畫 teach 步驟用：產生 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）----
function animCanvas(w: number, h: number, label: string): string {
  return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
    'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
}

// ---- 檔案區域靜態 SVG 概念圖（資訊文字 fill=currentColor，深／淺主題皆安全；結構線 currentColor + 透明度；
//      強調用 <tspan text-decoration="underline">，不在 <text> 裡放 <b>/<i>；AC 僅用於邊框線條）----
var AC = '#0d9488', FILL = 'rgba(13,148,136,0.12)';
function arrow(x1: number, y1: number, x2: number, y2: number, w: number): string {
  var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len;
  var s = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="currentColor" stroke-opacity="0.65" stroke-width="' + w + '" stroke-linecap="round"/>';
  s += '<polygon points="' + x2 + ',' + y2 + ' ' + (x2 - ux * 11 - uy * 6).toFixed(1) + ',' + (y2 - uy * 11 + ux * 6).toFixed(1) + ' ' + (x2 - ux * 11 + uy * 6).toFixed(1) + ',' + (y2 - uy * 11 - ux * 6).toFixed(1) + '" fill="currentColor" fill-opacity="0.65"/>';
  return s;
}
function box(x: number, y: number, w: number, h: number, strong?: boolean, op?: number): string {
  var o = op == null ? 1 : op;
  if (strong) return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="9" fill="' + FILL + '" stroke="' + AC + '" stroke-width="2" opacity="' + o + '"/>';
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="9" fill="' + FILL + '" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.8" opacity="' + o + '"/>';
}
function tc(x: number, y: number, t: string, sz?: number, op?: number): string {
  return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + (sz || 13) + '" font-weight="800" fill="currentColor"' + (op != null ? ' opacity="' + op + '"' : '') + '>' + t + '</text>';
}
function cap(x: number, y: number, t: string, sz?: number): string {
  return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-size="' + (sz || 11) + '" fill="currentColor">' + t + '</text>';
}
function brick(x: number, y: number, w: number, t: string, strong?: boolean, op?: number): string {
  return box(x, y, w, 34, strong, op) + tc(x + w / 2, y + 22, t, 13, op);
}

// 被動：主動句 → 被動句，主詞與受詞「對調位置」（兩條交叉箭頭呈現 swap），動詞變 be + 過去分詞。
function svgPassiveSwap(): string {
  var s = '<svg viewBox="0 0 300 220" role="img" aria-label="主動句 The cat chased the mouse 的主詞與受詞對調，變成被動句 The mouse was chased，動詞變成 be 加過去分詞；by the cat 是做動作的那個（動作者），可省略">';
  s += cap(150, 14, '主動句：誰做了什麼');
  s += brick(8, 22, 76, 'The cat') + brick(90, 22, 68, 'chased') + brick(166, 22, 126, 'the mouse', true);
  // 交叉箭頭：受詞 → 前面當主詞；主詞 → 後面（原主詞退到後面的 by 位置，此處留白）。
  s += arrow(229, 58, 70, 138, 2.4);
  s += arrow(46, 58, 258, 138, 2.4);
  s += cap(150, 132, '被動句：被做的那個放到前面');
  s += brick(8, 140, 126, 'The mouse', true) + brick(140, 140, 94, 'was chased');
  s += cap(150, 192, 'was chased ＝ be ＋ 過去分詞');
  s += cap(150, 210, '（by the cat）＝做動作的那個（動作者），可省略');
  return s + '</svg>';
}

// 被動：什麼時候用——不知道／不重要誰做的。
function svgPassiveWhen(): string {
  var s = '<svg viewBox="0 0 300 160" role="img" aria-label="My bike was stolen 被偷了，但不知道是誰偷的，所以用被動語態">';
  s += box(8, 20, 150, 118) + '<text x="83" y="68" text-anchor="middle" font-size="30">🚲</text>';
  s += tc(83, 100, 'My bike was stolen.', 12) + cap(83, 122, '（被偷了）');
  s += arrow(160, 79, 188, 79, 2.4);
  s += box(192, 20, 100, 118, true) + '<text x="242" y="68" text-anchor="middle" font-size="30">❓</text>';
  s += tc(242, 100, '誰偷的？', 13) + cap(242, 122, '不知道、不重要');
  return s + '</svg>';
}

// 條件句：if 子句 → 主句（骨牌／連鎖）。ifText／thenText 可含 <tspan text-decoration="underline"> 標結構詞。
function svgIfThen(ifTop: string, ifText: string, thenTop: string, thenText: string, note: string, label: string): string {
  var s = '<svg viewBox="0 0 300 148" role="img" aria-label="' + label + '">';
  s += cap(72, 16, ifTop) + cap(228, 16, thenTop);
  s += box(8, 24, 128, 60) + '<text x="72" y="60" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">' + ifText + '</text>';
  s += box(164, 24, 128, 60, true) + '<text x="228" y="60" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">' + thenText + '</text>';
  s += arrow(138, 54, 162, 54, 2.6);
  s += cap(150, 118, note);
  return s + '</svg>';
}

// 關係子句：兩句（重複名詞）→ 用 who/which 代替重複名詞，合成一句。
function svgJoinClause(): string {
  var s = '<svg viewBox="0 0 300 172" role="img" aria-label="The boy is my brother 和 The boy is singing 兩句，把重複的 The boy 換成 who，合成 The boy who is singing is my brother">';
  s += cap(150, 13, '兩句話，重複了「The boy」');
  s += box(8, 18, 284, 30) + tc(150, 38, 'The boy is my brother.', 13);
  s += box(8, 54, 284, 30) + tc(150, 74, 'The boy is singing.', 13);
  s += cap(150, 102, '↓ 把第二句的 The boy 換成 who，插進第一句');
  s += box(8, 110, 284, 36, true) + '<text x="150" y="133" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">The boy <tspan text-decoration="underline">who is singing</tspan> is my brother.</text>';
  s += cap(150, 166, 'who is singing ＝ 貼在名詞後面的補充說明');
  return s + '</svg>';
}

// 關係子句：先行詞類型 → 用哪個關代（兩欄對照表）。rows=[[type, pronoun], ...]
function svgRelPick(rows: string[][], label: string): string {
  var h = 24 + rows.length * 44 + 6;
  var s = '<svg viewBox="0 0 240 ' + h + '" role="img" aria-label="' + label + '">';
  s += cap(60, 16, '先行詞是…') + cap(187, 16, '就用');
  var y = 28;
  rows.forEach(function (r) {
    s += box(8, y, 104, 34) + tc(60, y + 22, r[0], 12.5);
    s += arrow(114, y + 17, 140, y + 17, 2.4);
    s += box(142, y, 90, 34, true) + tc(187, y + 22, r[1], 15);
    y += 44;
  });
  return s + '</svg>';
}

// 關係子句：關代當受詞 → that 可省略；當主詞 → 不能省略。
function svgOmitThat(): string {
  var s = '<svg viewBox="0 0 300 150" role="img" aria-label="the movie that we saw 的 that 當受詞可省略；the dog that barks 的 that 當主詞不能省略">';
  s += box(8, 20, 284, 32) + '<text x="150" y="41" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">the movie <tspan opacity="0.45">(that)</tspan> we saw</text>';
  s += cap(150, 70, 'that 當受詞（we saw it）→ 可省略 ✓');
  s += box(8, 84, 284, 32, true) + '<text x="150" y="105" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">the dog <tspan text-decoration="underline">that</tspan> barks</text>';
  s += cap(150, 134, 'that 當主詞 → 不能省略 ✗');
  return s + '</svg>';
}

// 動名詞：介系詞 + V-ing。
function svgPrepVing(): string {
  var s = '<svg viewBox="0 0 300 142" role="img" aria-label="介系詞 at in of 後面接動詞，一律用 V-ing，例如 good at drawing、interested in reading">';
  s += cap(68, 22, 'at / in / of…') + box(8, 30, 120, 40, true) + tc(68, 55, '介系詞');
  s += '<text x="148" y="58" text-anchor="middle" font-size="20" font-weight="800" fill="currentColor">+</text>';
  s += cap(228, 22, 'V-ing') + box(168, 30, 124, 40, true) + '<text x="230" y="55" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">動詞<tspan text-decoration="underline">-ing</tspan></text>';
  s += cap(150, 100, '例：good at drawing、interested in reading');
  s += cap(150, 124, '介系詞後面接動詞，一律用 V-ing');
  return s + '</svg>';
}

// 不定詞：to + 原形 表「目的」。
function svgPurpose(): string {
  var s = '<svg viewBox="0 0 300 136" role="img" aria-label="I came here to help，to help 表示目的，用 to 加原形動詞">';
  s += box(8, 32, 148, 42) + tc(82, 58, 'I came here', 13);
  s += arrow(160, 53, 196, 53, 2.6);
  s += cap(246, 26, 'to ＋ 原形') + box(200, 32, 92, 42, true) + tc(246, 58, 'to help', 14);
  s += cap(150, 100, 'to help ＝ 為了幫忙（說明「目的」）');
  s += cap(150, 122, '表「目的／為了」用 to ＋ 原形動詞');
  return s + '</svg>';
}

// 不定詞 vs 動名詞：哪些動詞後面接 to V、哪些接 V-ing（兩欄清單）。
function svgVerbPick(): string {
  var toV = ['want', 'need', 'decide', 'hope'];
  var ving = ['enjoy', 'finish', 'avoid', 'keep'];
  var s = '<svg viewBox="0 0 300 192" role="img" aria-label="want need decide hope 後面接 to 加原形；enjoy finish avoid keep 後面接 V-ing">';
  s += cap(78, 16, '後面接 to ＋ 原形') + cap(222, 16, '後面接 V-ing');
  var y = 26;
  for (var i = 0; i < 4; i++) {
    s += box(8, y, 136, 30, true) + tc(76, y + 20, toV[i] + ' to…', 12.5);
    s += box(156, y, 136, 30, true) + tc(224, y + 20, ving[i] + ' …ing', 12.5);
    y += 36;
  }
  s += cap(150, 182, '接 to V 還是 V-ing，要看前面的動詞');
  return s + '</svg>';
}

window.CONCEPT = {
  progKey: 'english_grammar_plus_v1', practiceHref: 'english_sense.html',
  lessons: [

   // ================= 群組 1：被動語態 pv_* =================
   { id: 'pv_passive_what', name: '被動語態：主角換人當', emoji: '🔄', color: '#0d9488',
     sub: '被動＝be 動詞 ＋ 過去分詞（p.p.）',
     done: '記得：被動語態把「被做的對象」放到前面當主詞，動詞改成 be 動詞 ＋ 過去分詞（p.p.）。The mouse was chased.',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '把「被做的」放到前面',
        svg: svgPassiveSwap(),
        text: '主動句講「<b>誰做了什麼</b>」：The cat <b>chased</b> the mouse.<br>被動句把「<b>被做的對象</b>（the mouse）」放到前面當主詞：The mouse <b>was chased</b>（by the cat）。原本的主詞 the cat 退到後面，需要時用 <b>by</b> 補上。' },
      { type: 'teach', kicker: '記住公式', title: '公式：be 動詞 ＋ 過去分詞',
        svg: animCanvas(360, 240, '造句動畫：The mouse、was、chased 三塊詞磚依序飛進主詞欄、be 動詞欄、過去分詞欄，組成被動句 The mouse was chased.'),
        mount: function (host) { return window.Anim && window.Anim.enSentenceBuild(host, { mode: 'statement', slots: ['主詞', 'be 動詞', '過去分詞 p.p.'], tiles: ['The mouse', 'was', 'chased'], label: '造句動畫：The mouse（主詞）、was（be 動詞）、chased（過去分詞）三塊詞磚依序飛進欄位，組成被動句 The mouse was chased．，示範被動公式 be ＋ 過去分詞。' }); },
        text: '被動語態的公式是 <b>be 動詞（am/is/are/was/were）＋ 過去分詞（p.p.）</b>。be 動詞要跟著時態變：現在用 is／are（is cleaned），過去用 was／were（was chased）。' },
      { type: 'quiz', kicker: '換你試試', title: '選出正確的被動句', eq: 'Someone cleans the room every day.（改成被動）',
        options: ['The room is cleaned every day.', 'The room cleans every day.', 'The room was clean every day.'], answer: 0,
        whyWrong: { 1: 'The room cleans… 是主動，但房間不會「自己打掃」。', 2: 'was clean 是「（過去）很乾淨」的形容詞，不是「被打掃」這個動作。' },
        why: '被動＝be 動詞 ＋ 過去分詞。主詞是單數的 the room、時態是現在，所以用 is cleaned。' },
      { type: 'quiz', kicker: '想一想', title: '被動語態的公式是？',
        options: ['be 動詞 ＋ 過去分詞', 'be 動詞 ＋ V-ing', 'have ＋ 過去分詞'], answer: 0,
        whyWrong: { 1: 'be ＋ V-ing 是現在進行式（be doing），不是被動。', 2: 'have ＋ 過去分詞是完成式（have done），也不是被動。' },
        why: '被動語態固定是 be 動詞 ＋ 過去分詞，例如 is cleaned、was chased。' },
      { type: 'quiz', kicker: '想一想', title: '選出正確的（信昨天被寄出）', eq: 'The letter ___ yesterday.',
        options: ['was sent', 'sent', 'is sent'], answer: 0,
        whyWrong: { 1: 'sent 是主動的過去式；信不會自己寄出。', 2: 'is sent 是現在被動，但 yesterday 是過去，要用 was。' },
        why: 'yesterday 是過去，被動用 was ＋ 過去分詞 → was sent（send 的過去分詞是 sent）。' }
     ] },

   { id: 'pv_passive_when', name: '什麼時候用被動', emoji: '🕵️', color: '#0891b2',
     sub: '不知道／不重要誰做的，就用被動',
     done: '記得：當「做的人」不知道、不重要，或刻意不說時，就用被動；需要點明時再用 by 補上動作者。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '不知道誰做的，就用被動',
        svg: svgPassiveWhen(),
        text: '當「<b>做的人</b>」<b>不知道、不重要</b>，或刻意不說時，用被動最自然：My bike <b>was stolen</b>.（不知道是誰偷的）、English <b>is spoken</b> in many countries.（重點是「英語被說」，不是誰在說）。' },
      { type: 'teach', kicker: '需要時再補', title: '要點明是誰，就用 by',
        svg: animCanvas(360, 240, '造句動畫：The book、was written、by her 三塊詞磚依序飛進欄位，組成 The book was written by her，示範被動句用 by 補上動作者。'),
        mount: function (host) { return window.Anim && window.Anim.enSentenceBuild(host, { mode: 'statement', slots: ['主詞', 'be ＋ 過去分詞', 'by 片語'], tiles: ['The book', 'was written', 'by her'], label: '造句動畫：The book（主詞）、was written（be 加過去分詞）、by her（by 片語）依序飛進欄位，組成 The book was written by her．，示範需要時用 by 補上動作者。' }); },
        text: '如果想點明「<b>是誰做的</b>」，就在後面用 <b>by</b> 補上：The book was written <b>by her</b>.<br>不需要時 by 片語可以省略：The window was broken.（不說是誰打破的也通）。' },
      { type: 'quiz', kicker: '換你試試', title: '哪種情況最適合用被動？',
        options: ['不知道是誰偷了我的腳踏車', '我想強調「是我」做的', '問對方喜歡什麼'], answer: 0,
        why: '不知道、不重要是誰做的時候，用被動最自然（My bike was stolen.）。' },
      { type: 'quiz', kicker: '想一想', title: '選出正確的（蛋糕是媽媽做的）', eq: 'The cake ___ by my mom.',
        options: ['was made', 'made', 'is make'], answer: 0,
        whyWrong: { 1: 'made 是主動；蛋糕不會自己做自己。', 2: 'is make 文法不通；被動要用 be ＋ 過去分詞 made。' },
        why: '被動＝be ＋ 過去分詞。make 的過去分詞是 made，用 by 補上動作者 → was made by my mom。' },
      { type: 'quiz', kicker: '想一想', title: '選出正確的（很多國家都說英語）', eq: 'English ___ in many countries.',
        options: ['is spoken', 'speaks', 'speaking'], answer: 0,
        whyWrong: { 1: 'speaks 是主動；英語不會「自己說」。', 2: 'speaking 少了 be 動詞，不是完整的被動。' },
        why: '重點是「英語被說」、不特別點出誰在說，用被動 be ＋ 過去分詞 → is spoken（speak 的過去分詞是 spoken）。' }
     ] },

   // ================= 群組 2：條件句 cond_* =================
   { id: 'cond_first', name: '真實條件：If + 現在式, will…', emoji: '🌧️', color: '#0e7490',
     sub: '可能發生的事（first conditional）',
     done: '記得：講「可能發生」的事，if 子句用現在式、主句用 will；if 子句放前面要加逗號。講科學事實時兩邊都用現在式（zero conditional）。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '可能發生：If + 現在式, will…',
        svg: svgIfThen('if ＋ 現在式', 'It <tspan text-decoration="underline">rains</tspan>.', '主句 ＋ will', 'I <tspan text-decoration="underline">will</tspan> stay home.', '如果下雨，我就會待在家', 'if 子句用現在式 It rains，主句用 will：I will stay home，像骨牌一樣由 if 推出 then'),
        text: '講「<b>有可能發生</b>」的事：<b>if 子句用現在式</b>、<b>主句用 will</b>。<br>If it <b>rains</b>, I <b>will</b> stay home.（如果下雨，我就會待在家）。注意：if 子句雖然講未來，但<b>用現在式</b>，不是 will rain。' },
      { type: 'teach', kicker: '兩個重點', title: '逗號；科學事實兩邊都現在式',
        svg: svgIfThen('if ＋ 現在式', 'you <tspan text-decoration="underline">heat</tspan> ice', 'then ＋ 現在式', 'it <tspan text-decoration="underline">melts</tspan>', '科學事實（zero）：兩邊都用現在式', '科學事實 zero conditional：If you heat ice, it melts，if 子句與主句都用現在式'),
        text: '兩個重點：(1) <b>if 子句放前面</b>時，中間要加<b>逗號</b>（If it rains, …）；放後面則不用。<br>(2) 講「<b>一定會這樣的科學事實</b>」時，兩邊<b>都用現在式</b>（zero conditional）：If you heat ice, it <b>melts</b>.' },
      { type: 'quiz', kicker: '換你試試', title: '選出正確的', eq: 'If it ___ tomorrow, we will cancel the trip.',
        options: ['rains', 'will rain', 'rained'], answer: 0,
        whyWrong: { 1: 'if 子句就算講未來也用現在式，不用 will。', 2: 'rained 是過去式，這裡講的是未來可能發生的事。' },
        why: 'first conditional：if 子句用現在式（rains），主句才用 will（will cancel）。' },
      { type: 'quiz', kicker: '想一想', title: '選出正確的（科學事實）', eq: 'If you heat ice, it ___.',
        options: ['melts', 'will melt', 'melted'], answer: 0,
        why: '這是一定會發生的科學事實（zero conditional），兩邊都用現在式 → melts。' },
      { type: 'quiz', kicker: '想一想', title: '選出正確的', eq: 'If she ___ hard, she will pass the exam.',
        options: ['studies', 'will study', 'studied'], answer: 0,
        whyWrong: { 1: 'if 子句用現在式，不用 will。', 2: 'studied 是過去式，這裡講的是可能發生的未來。' },
        why: 'first conditional：if 子句用現在式，主詞 she 是單數所以是 studies；主句用 will pass。' }
     ] },

   { id: 'cond_second', name: '假設條件：If + 過去式, would…', emoji: '💭', color: '#0369a1',
     sub: '和事實相反／不太可能的想像（second conditional）',
     done: '記得：講「與現在事實相反」或「不太可能」的想像，用 If + 過去式、主句用 would；be 動詞一律用 were（If I were…）。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '想像：If + 過去式, would…',
        svg: svgIfThen('if ＋ 過去式（假設）', 'I <tspan text-decoration="underline">were</tspan> rich', '主句 ＋ would', 'I <tspan text-decoration="underline">would</tspan> travel.', '這裡的過去式是「假設」，不是真的過去', '假設句 second conditional：If I were rich, I would travel，if 子句用過去式、主句用 would'),
        text: '講「<b>和現在事實相反</b>」或「<b>不太可能</b>」的想像：<b>If + 過去式</b>、<b>主句用 would</b>。<br>If I <b>were</b> rich, I <b>would</b> travel.（我其實不有錢，只是想像）。這裡的過去式是「<b>假設</b>」，不是真的發生過；be 動詞一律用 <b>were</b>（If I were…）。' },
      { type: 'teach', kicker: '用量尺比一比', title: '想像 ↔ 可能 ↔ 事實',
        svg: animCanvas(360, 240, '可能性量尺：左端是「想像（與事實相反，用 would）」，中間是「可能發生（用 will）」，右端是「事實」，指針落在左端的「想像」，例句 If I were rich, I would travel.'),
        mount: function (host) { return window.Anim && window.Anim.enMeter(host, { axisLabel: '可能性', stops: ['想像', '可能', '事實'], pointer: '想像', example: 'If I were rich, I would travel.' }); },
        text: '把條件句放到「可能性」量尺上比一比：<b>想像</b>（與事實相反 → would）在最左、<b>可能發生</b>（→ will）在中間、<b>科學事實</b>（兩邊現在式）在最右。second conditional 落在「<b>想像</b>」這一端。' },
      { type: 'quiz', kicker: '換你試試', title: '選出正確的', eq: 'If I ___ a bird, I would fly.',
        options: ['were', 'am', 'will be'], answer: 0,
        whyWrong: { 1: 'am 是現在事實，但「我是一隻鳥」是不可能的想像。', 2: 'will be 用在真實未來；這裡是與事實相反的假設。' },
        why: 'second conditional 的假設，be 動詞一律用 were（If I were…），主句用 would fly。' },
      { type: 'quiz', kicker: '想一想', title: '這句在講真的還是想像？', eq: 'If I had a million dollars, I would travel the world.',
        options: ['想像／不太可能', '真的發生了', '一定會發生'], answer: 0,
        why: 'If + 過去式（had）+ would 是 second conditional，講的是與事實相反、不太可能的想像。' },
      { type: 'quiz', kicker: '想一想', title: '選出正確的（給建議的假設）', eq: 'If I ___ you, I would say sorry.',
        options: ['were', 'am', 'will be'], answer: 0,
        whyWrong: { 1: 'am 是現在事實，但「我是你」是假設，不是事實。', 2: 'will be 用在真實未來；這裡是假設。' },
        why: 'If I were you（如果我是你）是最常見的假設句，be 動詞用 were、主句用 would。' }
     ] },

   // ================= 群組 3：關係子句 rel_* =================
   { id: 'rel_who_which', name: '關係子句：who / which / that', emoji: '🔗', color: '#0d9488',
     sub: '把兩句合成一句的「補充說明」',
     done: '記得：關係子句像貼在名詞後面的補充說明——人用 who、物用 which、人或物都可用 that，把重複的名詞換成關係代名詞。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '用關代把兩句合成一句',
        svg: svgJoinClause(),
        text: '關係子句像「<b>補充說明</b>」，緊貼在名詞後面。<br>兩句話重複同一個名詞時，把第二句重複的名詞換成<b>關係代名詞</b>，就能合成一句：The boy is my brother. ＋ The boy is singing. → The boy <b>who is singing</b> is my brother.' },
      { type: 'teach', kicker: '選哪一個', title: '人 who、物 which、都可 that',
        svg: svgRelPick([['人（人物）', 'who'], ['物（東西）', 'which'], ['人或物都可', 'that']], '先行詞是人用 who、是物用 which、人或物都可以用 that'),
        text: '關係代名詞怎麼選，要看前面的名詞（<b>先行詞</b>）是什麼：<br>• 先行詞是<b>人</b> → <b>who</b>（a girl who sings）<br>• 先行詞是<b>物</b> → <b>which</b>（a book which sells well）<br>• <b>人或物都可以</b>用 <b>that</b>。' },
      { type: 'quiz', kicker: '換你試試', title: '選出正確的（先行詞是物）', eq: 'The book ___ is on the table is mine.',
        options: ['which', 'who', 'where'], answer: 0,
        whyWrong: { 1: 'who 只用在人；the book 是物。', 2: 'where 用在地點，不是用來指 the book。' },
        why: '先行詞 the book 是物，用 which（也可以用 that）。' },
      { type: 'quiz', kicker: '想一想', title: '選出正確的（先行詞是人）', eq: 'I know a girl ___ speaks three languages.',
        options: ['who', 'which', 'where'], answer: 0,
        whyWrong: { 1: 'which 用在物；a girl 是人。', 2: 'where 用在地點，不是用來指 a girl。' },
        why: '先行詞 a girl 是人，用 who（也可以用 that）。' },
      { type: 'quiz', kicker: '想一想', title: '選出正確的（先行詞是人）', eq: 'The man ___ lives next door is a doctor.',
        options: ['who', 'which', 'where'], answer: 0,
        whyWrong: { 1: 'which 用在物；the man 是人。', 2: 'where 用在地點。' },
        why: '先行詞 the man 是人，用 who（也可以用 that）。' }
     ] },

   { id: 'rel_where_omit', name: 'where / whose 與省略時機', emoji: '📍', color: '#0891b2',
     sub: '地點 where、所屬 whose；當受詞時 that 常可省略',
     done: '記得：指地點用 where、表「某人的」用 whose；當關係代名詞是受詞時（the movie we saw），that 常可省略，當主詞時不行。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '地點 where、所屬 whose',
        svg: svgRelPick([['地點（place）', 'where'], ['所屬（某人的）', 'whose']], '指地點用 where、表某人的東西用 whose'),
        text: '除了 who／which／that，還有兩個常用的：<br>• 指<b>地點</b>用 <b>where</b>：the house <b>where</b> I live（我住的那間房子）。<br>• 表「<b>某人的</b>」用 <b>whose</b>：the man <b>whose</b> dog is cute（那個狗很可愛的人）。' },
      { type: 'teach', kicker: '可以拿掉的時候', title: '當受詞時，that 常可省略',
        svg: svgOmitThat(),
        text: '當關係代名詞是子句裡的<b>受詞</b>時，口語常把它<b>省略</b>：the movie <b>(that)</b> we saw（我們看的那部電影，we saw <b>it</b>）。<br>但當它是子句的<b>主詞</b>時<b>不能省略</b>：the dog <b>that</b> barks（會叫的那隻狗，that 就是主詞）。' },
      { type: 'quiz', kicker: '換你試試', title: '選出正確的（指地點）', eq: 'This is the park ___ we played.',
        options: ['where', 'which', 'who'], answer: 0,
        whyWrong: { 1: 'which 後面會缺一個名詞；這裡 we played 已經完整，缺的是「地點」。', 2: 'who 只用在人。' },
        why: '指地點（在公園裡玩）用 where → the park where we played。' },
      { type: 'quiz', kicker: '想一想', title: '下面哪一句的 that 可以省略？',
        options: ['The song that we heard was nice.', 'The man that lives next door is kind.', 'The dog that barks is mine.'], answer: 0,
        whyWrong: { 1: 'that 是 lives 的主詞，不能省略。', 2: 'that 是 barks 的主詞，不能省略。' },
        why: '第一句 that 是「we heard it」的受詞，可以省略（The song we heard was nice.）；當主詞時不能省。' },
      { type: 'quiz', kicker: '想一想', title: '選出正確的（表「某人的」）', eq: 'I met a man ___ dog is very cute.',
        options: ['whose', 'who', 'which'], answer: 0,
        whyWrong: { 1: 'who 當主詞或受詞，不表「某人的」。', 2: 'which 用在物，且不表所屬。' },
        why: '表「某人的（那個人的狗）」用 whose → the man whose dog is cute。' }
     ] },

   // ================= 群組 4：動名詞與不定詞 ging_* =================
   { id: 'ging_gerund', name: '動名詞 V-ing：動詞當名詞用', emoji: '🏊', color: '#0e7490',
     sub: '動詞加 -ing 可以當主詞或受詞；介系詞後面接 V-ing',
     done: '記得：動詞加 -ing（動名詞）可以當名詞用——當主詞（Swimming is fun.）或受詞（I enjoy reading.）；介系詞後面接動詞，一律用 V-ing（good at drawing）。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '動詞加 -ing，就能當名詞',
        svg: animCanvas(360, 240, '造句動畫：I、enjoy、reading 三塊詞磚依序飛進主詞欄、動詞欄、受詞欄，組成 I enjoy reading，reading 是動名詞當受詞。'),
        mount: function (host) { return window.Anim && window.Anim.enSentenceBuild(host, { mode: 'statement', slots: ['主詞', '動詞', '受詞'], tiles: ['I', 'enjoy', 'reading'], highlight: '受詞', label: '造句動畫：I（主詞）、enjoy（動詞）、reading（受詞）三塊詞磚依序飛進欄位，組成 I enjoy reading．，示範動名詞 reading 當受詞。' }); },
        text: '動詞加上 <b>-ing</b> 就變成<b>動名詞</b>，可以像名詞一樣用：<br>• 當<b>主詞</b>：<b>Swimming</b> is fun.（游泳很好玩）<br>• 當<b>受詞</b>：I enjoy <b>reading</b>.（我喜歡閱讀，enjoy 後面固定接 V-ing）。' },
      { type: 'teach', kicker: '一個好用規則', title: '介系詞後面接 V-ing',
        svg: svgPrepVing(),
        text: '只要是<b>介系詞（at、in、of、about…）後面</b>接動詞，就<b>一律用 V-ing</b>：<br>good <b>at drawing</b>（很會畫畫）、interested <b>in reading</b>（對閱讀有興趣）、Thank you <b>for coming</b>（謝謝你來）。' },
      { type: 'quiz', kicker: '換你試試', title: '選出正確的', eq: "I'm good at ___.",
        options: ['cooking', 'cook', 'to cook'], answer: 0,
        whyWrong: { 1: 'cook 是原形；介系詞 at 後面不能直接接原形。', 2: 'at 後面不接 to V。' },
        why: '介系詞 at 後面接動詞，一律用動名詞 V-ing → cooking。' },
      { type: 'quiz', kicker: '想一想', title: '選出正確的（游泳當主詞）', eq: '___ is good exercise.',
        options: ['Swimming', 'Swim', 'To swims'], answer: 0,
        whyWrong: { 1: 'Swim 是原形動詞，不能直接當主詞。', 2: 'To swims 文法不通（to 後面要用原形 swim）。' },
        why: '動名詞 Swimming 可以當主詞 → Swimming is good exercise.' },
      { type: 'quiz', kicker: '想一想', title: '選出正確的', eq: 'I enjoy ___ books.',
        options: ['reading', 'to read', 'read'], answer: 0,
        whyWrong: { 1: 'enjoy 後面固定接 V-ing，不接 to V。', 2: 'read 原形不行；enjoy 後面要接 V-ing。' },
        why: 'enjoy 後面固定接動名詞 V-ing → enjoy reading。' }
     ] },

   { id: 'ging_infinitive', name: '不定詞 to + V：目的與動詞搭配', emoji: '🎯', color: '#0369a1',
     sub: '表目的用 to V；接 to V 還是 V-ing 看前面的動詞',
     done: '記得：表「目的／為了」用 to ＋ 原形（I came here to help.）；有些動詞固定接 to V（want / need / decide / hope），有些固定接 V-ing（enjoy / finish / avoid / keep）。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '表「目的」用 to ＋ 原形',
        svg: svgPurpose(),
        text: '要說「<b>為了……／目的是</b>」時，用 <b>to ＋ 原形動詞</b>：<br>I came here <b>to help</b>.（我來這裡是為了幫忙）、I study hard <b>to pass</b> the exam.（我用功是為了通過考試）。' },
      { type: 'teach', kicker: '最重要的分組', title: '接 to V 還是 V-ing？看動詞',
        svg: svgVerbPick(),
        text: '動詞後面接 <b>to V</b> 還是 <b>V-ing</b>，要看<b>前面是哪個動詞</b>，分組記最快：<br>• 固定接 <b>to ＋ 原形</b>：<b>want、need、decide、hope</b>（want to go）。<br>• 固定接 <b>V-ing</b>：<b>enjoy、finish、avoid、keep</b>（finish doing）。' },
      { type: 'quiz', kicker: '換你試試', title: '選出正確的', eq: 'I want ___ a doctor.',
        options: ['to be', 'being', 'be'], answer: 0,
        whyWrong: { 1: 'want 後面不接 V-ing。', 2: 'be 少了 to；want 後面要接 to ＋ 原形。' },
        why: 'want 後面固定接不定詞 to ＋ 原形 → want to be。' },
      { type: 'quiz', kicker: '想一想', title: '選出正確的', eq: 'She finished ___ her homework.',
        options: ['doing', 'to do', 'do'], answer: 0,
        whyWrong: { 1: 'finish 後面不接 to V。', 2: 'do 原形不行；finish 後面要接 V-ing。' },
        why: 'finish 後面固定接動名詞 V-ing → finished doing。' },
      { type: 'quiz', kicker: '想一想', title: '選出正確的', eq: 'He decided ___ English every day.',
        options: ['to study', 'studying', 'study'], answer: 0,
        whyWrong: { 1: 'decide 後面不接 V-ing。', 2: 'study 少了 to；decide 後面要接 to ＋ 原形。' },
        why: 'decide 後面固定接不定詞 to ＋ 原形 → decided to study。' },
      { type: 'quiz', kicker: '想一想', title: '選出正確的（表目的）', eq: 'We came here ___ you.',
        options: ['to help', 'helping', 'help'], answer: 0,
        whyWrong: { 1: '表「為了幫你」要用 to V，不是 V-ing。', 2: 'help 少了 to；表目的要用 to ＋ 原形。' },
        why: '表「目的／為了」用 to ＋ 原形 → came here to help you。' }
     ] }
  ]
};

})();
