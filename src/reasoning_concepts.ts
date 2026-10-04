/* =====================================================================
 * reasoning_concepts.ts  →  (tsc, tsconfig.legacy.json) →  reasoning_concepts.js
 * 「兩種推理・演繹 vs 歸納」觀念養成（論證與推理共用容器頁）。
 *   國小高年級→國中。這是「思辨／邏輯」底層觀念：先弄懂兩種推理怎麼走——
 *   演繹（由通則推個例，前提真＋形式有效 → 結論「一定」為真）、
 *   歸納（由個例推通則，結論「很可能」但不保證、可被反例推翻）。
 *   學會後接 informal_fallacy_concepts（以偏概全＝壞歸納）與 data_literacy_concepts
 *   （樣本／相關），再到 logic_reasoning 做情境應用。
 *   資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）。
 *   動畫課重用 anim_core.js 的 window.Anim.argFlow（論證流，參數化、多頁共用）；
 *   其餘以 stepped/static SVG。每個 teach step 都有視覺，零純文字。純本地進度（progKey）。
 *
 *   ★ lesson-id 命名規則（本頁三 spec 共用、同一 window.CONCEPT.lessons）：
 *     L1–L3（本 spec，演繹 vs 歸納）＝ rc_deduction / rc_induction / rc_compare。
 *     之後 core-argument-structure 追加 L4–L5 用 rc_argstruct_* / rc_premise* 前綴；
 *     core-fact-vs-opinion 追加 L6–L7 用 rc_factopinion_* 前綴。
 *     後續 spec 只 APPEND 到同一 lessons 陣列尾端、沿用 rc_ 前綴，不改既有課。
 *
 *   以 IIFE 包住讓 animCanvas / SVG helper 為檔案區域（避免與其他遷移頁同名頂層
 *   helper 在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。
 * ===================================================================== */
(function () {

// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
function animCanvas(w, h, label) {
  return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
    'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
}

var SU = '#4f46e5', WARN = '#e11d48', OK = '#16a34a', MUT = '#64748b', AMBER = '#d97706';

// ---- static / stepped SVG helpers（每個非動畫 teach step 都要有視覺，零純文字）---------

// L1 teach2：演繹的方向＝由「通則」推到「個例」（上寬下窄的漏斗，必然箭頭）。
function genToSpecific() {
  return '<svg viewBox="0 0 300 180" role="img" aria-label="演繹的方向：從上面的通則「所有金屬都導電」，往下推到個例「銅會導電」；前提若為真，結論就一定為真">' +
    '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">演繹：由通則 → 推到個例</text>' +
    '<rect x="40" y="30" width="220" height="40" rx="10" fill="' + SU + '" opacity="0.12"/>' +
    '<rect x="40" y="30" width="220" height="40" rx="10" fill="none" stroke="' + SU + '" stroke-width="1.6"/>' +
    '<text x="150" y="47" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + SU + '">通則（前提）</text>' +
    '<text x="150" y="63" text-anchor="middle" font-size="11" fill="currentColor">所有金屬都導電</text>' +
    '<path d="M150 72 L150 108" stroke="' + SU + '" stroke-width="2.4" marker-end="url(#rd1)"/>' +
    '<text x="196" y="94" text-anchor="middle" font-size="10" fill="' + MUT + '">套用到銅</text>' +
    '<rect x="92" y="112" width="116" height="40" rx="10" fill="' + OK + '" opacity="0.12"/>' +
    '<rect x="92" y="112" width="116" height="40" rx="10" fill="none" stroke="' + OK + '" stroke-width="1.6"/>' +
    '<text x="150" y="129" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + OK + '">個例（結論）</text>' +
    '<text x="150" y="145" text-anchor="middle" font-size="11" fill="currentColor">銅會導電</text>' +
    '<text x="150" y="170" text-anchor="middle" font-size="10.5" fill="' + MUT + '">前提若為真，結論就「一定」為真。</text>' +
    '<defs><marker id="rd1" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + SU + '"/></marker></defs>' +
    '</svg>';
}

// L1 teach3：有效（valid，形式對）vs 健全（sound，有效＋前提都真）。
function validSound() {
  return '<svg viewBox="0 0 300 196" role="img" aria-label="有效和健全不一樣：有效是形式正確，但前提可能是假的；健全是形式有效加上前提都真，結論才真正被保證。例子：所有魚都會飛、鯊魚是魚、所以鯊魚會飛，形式有效但前提假，所以結論不被保證">' +
    '<text x="150" y="15" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">有效 ≠ 正確（健全）</text>' +
    '<rect x="14" y="26" width="272" height="66" rx="10" fill="' + AMBER + '" opacity="0.1"/>' +
    '<rect x="14" y="26" width="272" height="66" rx="10" fill="none" stroke="' + AMBER + '" stroke-width="1.6"/>' +
    '<text x="150" y="43" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + AMBER + '">有效（valid）：形式對</text>' +
    '<text x="150" y="60" text-anchor="middle" font-size="10" fill="currentColor">所有魚都會飛；鯊魚是魚；所以鯊魚會飛。</text>' +
    '<text x="150" y="77" text-anchor="middle" font-size="10" fill="' + WARN + '">推論形式沒錯，但前提是假的 → 結論不被保證</text>' +
    '<rect x="14" y="102" width="272" height="66" rx="10" fill="' + OK + '" opacity="0.1"/>' +
    '<rect x="14" y="102" width="272" height="66" rx="10" fill="none" stroke="' + OK + '" stroke-width="1.6"/>' +
    '<text x="150" y="119" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + OK + '">健全（sound）：有效 ＋ 前提都真</text>' +
    '<text x="150" y="136" text-anchor="middle" font-size="10" fill="currentColor">所有金屬都導電；銅是金屬；所以銅導電。</text>' +
    '<text x="150" y="153" text-anchor="middle" font-size="10" fill="' + OK + '">形式有效，前提也都真 → 結論一定為真</text>' +
    '<text x="150" y="186" text-anchor="middle" font-size="10.5" fill="' + MUT + '">要「結論一定對」：前提全真＋形式有效，兩個都要。</text>' +
    '</svg>';
}

// L2 teach2：歸納的方向＝由多個「個例」推到「通則」（虛線＝很可能，不保證）。
function specToGen() {
  var s = '<svg viewBox="0 0 300 184" role="img" aria-label="歸納的方向：從下面好幾個看到的個例（白天鵝、白天鵝、白天鵝），用虛線往上推到通則「所有天鵝都是白的」；結論只是很可能，不保證沒有例外">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + AMBER + '">歸納：由個例 → 推到通則</text>';
  var xs = [40, 125, 210];
  for (var i = 0; i < 3; i++) {
    s += '<rect x="' + xs[i] + '" y="118" width="56" height="38" rx="8" fill="' + SU + '" opacity="0.12"/>';
    s += '<rect x="' + xs[i] + '" y="118" width="56" height="38" rx="8" fill="none" stroke="' + SU + '" stroke-width="1.4"/>';
    s += '<text x="' + (xs[i] + 28) + '" y="134" text-anchor="middle" font-size="10" fill="currentColor">看到的</text>';
    s += '<text x="' + (xs[i] + 28) + '" y="148" text-anchor="middle" font-size="10" fill="currentColor">是白的</text>';
    s += '<path d="M' + (xs[i] + 28) + ' 116 L150 78" stroke="' + AMBER + '" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#ri1)"/>';
  }
  s += '<rect x="78" y="36" width="144" height="40" rx="10" fill="' + AMBER + '" opacity="0.12"/>';
  s += '<rect x="78" y="36" width="144" height="40" rx="10" fill="none" stroke="' + AMBER + '" stroke-width="1.6"/>';
  s += '<text x="150" y="53" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + AMBER + '">通則（結論）</text>';
  s += '<text x="150" y="69" text-anchor="middle" font-size="11" fill="currentColor">所有天鵝都是白的</text>';
  s += '<text x="150" y="176" text-anchor="middle" font-size="10.5" fill="' + MUT + '">虛線＝很可能，不保證：看再多也可能有例外。</text>';
  s += '<defs><marker id="ri1" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + AMBER + '"/></marker></defs>';
  return s + '</svg>';
}

// L2 teach3：歸納的強弱看樣本——越多、越有代表性越強（但仍非必然）。
function sampleStrength() {
  return '<svg viewBox="0 0 300 180" role="img" aria-label="歸納的強弱看樣本：只看一兩個、又挑過的樣本，歸納很弱；觀察更多、而且更有代表性的樣本，歸納更強，但仍然只是很可能，不是一定">' +
    '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + AMBER + '">歸納的強弱，看樣本</text>' +
    '<rect x="14" y="30" width="130" height="104" rx="10" fill="' + WARN + '" opacity="0.08"/>' +
    '<rect x="14" y="30" width="130" height="104" rx="10" fill="none" stroke="' + WARN + '" stroke-width="1.4"/>' +
    '<text x="79" y="48" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + WARN + '">弱歸納</text>' +
    '<circle cx="54" cy="74" r="7" fill="' + SU + '" opacity="0.5"/><circle cx="80" cy="74" r="7" fill="' + SU + '" opacity="0.5"/>' +
    '<text x="79" y="104" text-anchor="middle" font-size="10" fill="currentColor">只看一兩個、</text>' +
    '<text x="79" y="119" text-anchor="middle" font-size="10" fill="currentColor">又挑過的樣本</text>' +
    '<rect x="156" y="30" width="130" height="104" rx="10" fill="' + OK + '" opacity="0.08"/>' +
    '<rect x="156" y="30" width="130" height="104" rx="10" fill="none" stroke="' + OK + '" stroke-width="1.4"/>' +
    '<text x="221" y="48" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + OK + '">強歸納</text>' +
    '<circle cx="178" cy="68" r="5" fill="' + SU + '"/><circle cx="196" cy="68" r="5" fill="' + SU + '"/><circle cx="214" cy="68" r="5" fill="' + SU + '"/>' +
    '<circle cx="232" cy="68" r="5" fill="' + SU + '"/><circle cx="250" cy="68" r="5" fill="' + SU + '"/>' +
    '<circle cx="187" cy="84" r="5" fill="' + SU + '"/><circle cx="205" cy="84" r="5" fill="' + SU + '"/><circle cx="223" cy="84" r="5" fill="' + SU + '"/>' +
    '<circle cx="241" cy="84" r="5" fill="' + SU + '"/>' +
    '<text x="221" y="104" text-anchor="middle" font-size="10" fill="currentColor">觀察更多、更</text>' +
    '<text x="221" y="119" text-anchor="middle" font-size="10" fill="currentColor">有代表性的樣本</text>' +
    '<text x="150" y="156" text-anchor="middle" font-size="10.5" fill="' + MUT + '">樣本越多、越有代表性，歸納越強——</text>' +
    '<text x="150" y="172" text-anchor="middle" font-size="10.5" fill="' + AMBER + '">但再強，仍然是「很可能」，不是「一定」。</text>' +
    '</svg>';
}

// L3 teach1：演繹 vs 歸納 兩欄對照表。
function compareTable() {
  var s = '<svg viewBox="0 0 300 196" role="img" aria-label="演繹和歸納對照表：演繹是由通則推個例、結論必然、對錯看前提加形式；歸納是由個例推通則、結論很可能、強弱看樣本數與代表性">';
  s += '<text x="150" y="15" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">演繹 vs 歸納</text>';
  // 兩欄表頭
  s += '<rect x="14" y="24" width="135" height="26" rx="7" fill="' + SU + '" opacity="0.16"/>';
  s += '<text x="81" y="41" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + SU + '">演繹</text>';
  s += '<rect x="151" y="24" width="135" height="26" rx="7" fill="' + AMBER + '" opacity="0.16"/>';
  s += '<text x="218" y="41" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + AMBER + '">歸納</text>';
  var rows = [
    ['方向', '通則 → 個例', '個例 → 通則'],
    ['結論', '一定（必然）', '很可能（不保證）'],
    ['看什麼', '前提真 ＋ 形式有效', '樣本數 ＋ 代表性'],
    ['會不會錯', '前提全真就不會', '可能有例外，可被反例推翻']
  ];
  var y0 = 58, rh = 32;
  for (var i = 0; i < rows.length; i++) {
    var ry = y0 + i * rh;
    if (i % 2 === 0) { s += '<rect x="14" y="' + (ry - 14) + '" width="272" height="' + rh + '" fill="' + MUT + '" opacity="0.06"/>'; }
    s += '<text x="81" y="' + ry + '" text-anchor="middle" font-size="9.5" fill="' + MUT + '">' + rows[i][0] + '</text>';
    s += '<text x="81" y="' + (ry + 13) + '" text-anchor="middle" font-size="10" fill="currentColor">' + rows[i][1] + '</text>';
    s += '<text x="218" y="' + ry + '" text-anchor="middle" font-size="9.5" fill="' + MUT + '">' + rows[i][0] + '</text>';
    s += '<text x="218" y="' + (ry + 13) + '" text-anchor="middle" font-size="10" fill="currentColor">' + rows[i][2] + '</text>';
  }
  s += '<line x1="150" y1="52" x2="150" y2="190" stroke="' + MUT + '" stroke-width="1" opacity="0.4"/>';
  return s + '</svg>';
}

// L3 teach2：科學定律由歸納得來 → 遇到可靠反例就要修正；以偏概全＝太草率的壞歸納。
function lawRevise() {
  return '<svg viewBox="0 0 300 184" role="img" aria-label="科學定律多由大量觀察歸納得來，所以遇到可靠的新反例或新證據就要修正；以偏概全是用太少又偏的例子硬推全體，是太草率的壞歸納">' +
    '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + AMBER + '">歸納也會修正：這是科學的常態</text>' +
    '<rect x="20" y="34" width="76" height="42" rx="9" fill="' + SU + '" opacity="0.12"/>' +
    '<rect x="20" y="34" width="76" height="42" rx="9" fill="none" stroke="' + SU + '" stroke-width="1.5"/>' +
    '<text x="58" y="52" text-anchor="middle" font-size="10" fill="currentColor">大量觀察</text>' +
    '<text x="58" y="67" text-anchor="middle" font-size="10" fill="currentColor">歸納出定律</text>' +
    '<path d="M98 55 L124 55" stroke="' + WARN + '" stroke-width="2" marker-end="url(#rl1)"/>' +
    '<rect x="126" y="30" width="70" height="50" rx="9" fill="' + WARN + '" opacity="0.12"/>' +
    '<rect x="126" y="30" width="70" height="50" rx="9" fill="none" stroke="' + WARN + '" stroke-width="1.5"/>' +
    '<text x="161" y="49" text-anchor="middle" font-size="10" fill="' + WARN + '">出現可靠</text>' +
    '<text x="161" y="63" text-anchor="middle" font-size="10" fill="' + WARN + '">反例／新證據</text>' +
    '<path d="M198 55 L224 55" stroke="' + OK + '" stroke-width="2" marker-end="url(#rl2)"/>' +
    '<rect x="226" y="34" width="60" height="42" rx="9" fill="' + OK + '" opacity="0.12"/>' +
    '<rect x="226" y="34" width="60" height="42" rx="9" fill="none" stroke="' + OK + '" stroke-width="1.5"/>' +
    '<text x="256" y="52" text-anchor="middle" font-size="10" fill="' + OK + '">修正</text>' +
    '<text x="256" y="67" text-anchor="middle" font-size="10" fill="' + OK + '">定律</text>' +
    '<text x="150" y="104" text-anchor="middle" font-size="10.5" fill="currentColor">定律能被新證據修正，不是缺點，正是科學進步的方式。</text>' +
    '<line x1="24" y1="118" x2="276" y2="118" stroke="' + MUT + '" stroke-width="1" opacity="0.35"/>' +
    '<text x="150" y="138" text-anchor="middle" font-size="11" font-weight="700" fill="' + WARN + '">小心「以偏概全」＝太草率的壞歸納</text>' +
    '<text x="150" y="156" text-anchor="middle" font-size="10" fill="currentColor">用太少、又偏的例子硬推全體（如：三個人遲到→全班都不守時）。</text>' +
    '<text x="150" y="174" text-anchor="middle" font-size="10" fill="' + MUT + '">日常裡演繹和歸納常常合用：先歸納出規律，再演繹去應用。</text>' +
    '<defs>' +
    '<marker id="rl1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + WARN + '"/></marker>' +
    '<marker id="rl2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + OK + '"/></marker>' +
    '</defs></svg>';
}

window.CONCEPT = { progKey: 'reasoning_concepts_v1', practiceHref: 'logic_reasoning.html', lessons: [
  {
    id: 'rc_deduction',
    name: '演繹推理',
    emoji: '🔒',
    color: SU,
    sub: '由通則推到個例，前提保證結論',
    done: '記住這句：演繹是「由通則推到個例」；只要前提全部為真、而且推論形式有效（這叫健全／sound），結論就「一定」為真。有效（形式對）和健全（還要前提都真）不一樣。',
    steps: [
      {
        type: 'teach', kicker: '先看動畫', title: '前提像鎖鏈，把結論鎖住',
        svg: animCanvas(300, 216, '演繹論證流：左欄兩張前提卡「所有鳥都有羽毛」「企鵝是鳥」，用實線鎖鏈箭頭流入右側結論卡「企鵝有羽毛」，標示「前提若為真，結論就一定為真」。'),
        mount: function (host) { var h = window.Anim.argFlow(host, { mode: 'deduction', premises: [{ text: '所有鳥都有羽毛' }, { text: '企鵝是鳥' }], conclusion: { text: '企鵝有羽毛' } }); return function () { h.stop(); }; },
        text: '看動畫：「<b>所有鳥都有羽毛</b>」加上「<b>企鵝是鳥</b>」，兩張前提像<b>實線鎖鏈</b>一樣，把結論「<b>企鵝有羽毛</b>」牢牢鎖住。這就是<b>演繹</b>——只要前提<b>為真</b>，結論就<b>一定</b>為真，沒有「可能有例外」的空間。鎖鏈（實線）代表的就是這種「必然」。'
      },
      {
        type: 'teach', kicker: '這是什麼推理', title: '演繹：由通則 → 推到個例',
        svg: genToSpecific(),
        text: '<b>演繹推理</b>＝從一條<b>通則</b>（適用於一整類的規則），往下套到<b>某個個例</b>。像「所有金屬都導電」是通則，套到「銅」這個個例，就推出「銅會導電」。它的特色是：前提若為真，結論就被<b>保證</b>為真——不是「大概」，而是「<b>一定</b>」。數學證明、邏輯推論，走的多半是演繹。'
      },
      {
        type: 'teach', kicker: '進階但重要', title: '有效 ≠ 正確（健全）',
        svg: validSound(),
        text: '這裡有個常被搞混的重點：<b>有效（valid）</b>只是說「推論的<b>形式</b>沒錯」，不保證前提是真的。例如「所有魚都會飛；鯊魚是魚；所以鯊魚會飛」——形式<b>有效</b>，但前提<b>假</b>，結論自然錯。要讓結論「<b>一定對</b>」，需要<b>健全（sound）</b>＝形式有效<b>加上</b>前提都真。所以「有效」不等於「正確」，兩個條件要一起成立。'
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '「所有金屬都導電；銅是金屬；所以銅導電。」這種「前提真就一定對」的推理叫？',
        options: ['演繹：由通則必然推出個例', '歸納：從例子推測通則', '猜測：沒有根據的直覺', '比喻：用相似的東西說明'],
        answer: 0,
        why: '由「所有金屬都導電」這條通則，套到「銅」這個個例，前提若為真，結論就一定為真——這正是演繹。',
        whyWrong: { 1: '歸納是「從看過的例子」推測通則、結論只是很可能；這題是由通則推到個例、結論是必然，所以是演繹。', 2: '這裡每一步都有明確的前提與推理，不是沒根據的直覺猜測。', 3: '比喻是用相似的事物幫助理解；這題是嚴謹地由前提推結論，不是打比方。' }
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '演繹推理若「推論形式有效，但有一個前提是假的」，結論會？',
        options: ['不保證為真（可能錯）', '一定為真', '一定為假', '無法用演繹判斷'],
        answer: 0,
        why: '要「結論一定為真」，需要兩個條件都成立：前提全部為真，而且形式有效（這叫健全／sound）。只要有一個前提是假的，就算形式有效，結論也不被保證——可能剛好對、也可能錯。',
        whyWrong: { 1: '「一定為真」要前提全真＋形式有效兩者都成立；這裡有一個前提是假的，就不被保證了。', 2: '前提假、形式有效時，結論可能剛好對、也可能錯，不是「一定為假」。', 3: '形式有不有效是可以判斷的；問題只在前提假讓結論不被保證，不是無法判斷。' }
      }
    ]
  },
  {
    id: 'rc_induction',
    name: '歸納推理',
    emoji: '🦢',
    color: SU,
    sub: '由個例推通則，很可能但不保證',
    done: '記住這句：歸納是「由多個個例推通則」，結論只是「很可能」而非「必然」，看再多白天鵝也可能冒出一隻黑天鵝。歸納的強弱看樣本——越多、越有代表性越強，但再強也不是「一定」。',
    steps: [
      {
        type: 'teach', kicker: '先看動畫', title: '看到的都白……就一定都白嗎？',
        svg: animCanvas(300, 216, '歸納論證流：左欄三張觀察卡（這隻、那隻、再看都是白的）用虛線箭頭流入右側通則卡「所有天鵝都是白的」，標示「很可能但不保證」，最後浮現一隻黑天鵝反例把結論用紅✗打叉。'),
        mount: function (host) { var h = window.Anim.argFlow(host, { mode: 'induction', premises: [{ text: '這隻天鵝是白的' }, { text: '那隻也是白的' }, { text: '再看還是白的' }], conclusion: { text: '所有天鵝都白' }, counter: { text: '出現一隻黑天鵝', on: true } }); return function () { h.stop(); }; },
        text: '看動畫：看到的天鵝一隻隻都是白的，於是推出「<b>所有天鵝都是白的</b>」。但箭頭是<b>虛線</b>——代表「<b>很可能</b>，但<b>不保證</b>」。果然，最後冒出一隻<b>黑天鵝</b>，一個<b>反例</b>就把結論<b>打叉</b>了。這就是<b>歸納</b>：由看到的個例推通則，看再多也可能有例外。'
      },
      {
        type: 'teach', kicker: '這是什麼推理', title: '歸納：由個例 → 推到通則',
        svg: specToGen(),
        text: '<b>歸納推理</b>＝從<b>多個個例</b>（看到的、量到的、統計到的）往上推出一條<b>通則</b>。它和演繹<b>方向相反</b>：演繹由通則推個例、結論必然；歸納由個例推通則、結論是「<b>很可能</b>」而非「必然」。所以歸納的結論永遠<b>可能被新的反例推翻</b>——這不代表歸納沒用，只是要記得：它給的是「很有把握的猜測」，不是「鐵定」。'
      },
      {
        type: 'teach', kicker: '怎樣算好的歸納', title: '強弱看樣本：多 ＋ 有代表性',
        svg: sampleStrength(),
        text: '既然歸納不保證，那怎麼讓它<b>更可信</b>？看<b>樣本</b>：樣本數<b>越多</b>、而且<b>越有代表性</b>（不是只挑支持自己的、也不是只看特別的那幾個），歸納就<b>越強</b>。相反地，只看一兩個、又挑過的例子，很容易<b>以偏概全</b>。但要記得：就算樣本再好，歸納仍然是「很可能」，<b>不是「一定」</b>。（這一點之後在「資料偵探」會再深入。）'
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '「我看過的烏鴉都是黑的，所以所有烏鴉都是黑的。」這是？',
        options: ['歸納：結論只是很可能、可能有例外', '演繹：結論一定正確', '假兩難', '稻草人'],
        answer: 0,
        why: '由「我看過的」這些個例，推到「所有烏鴉」這個通則，是歸納；看再多黑烏鴉也不能保證沒有例外，結論只是很可能。',
        whyWrong: { 1: '演繹的結論才是「一定」；這裡是從看過的例子推到全體、不保證無例外，是歸納不是演繹。', 2: '假兩難是把選項硬塞成「只有兩種」；這題沒有限縮選項。', 3: '稻草人是扭曲別人的主張再攻擊；這題沒有扭曲誰的話。' }
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '哪種做法會讓歸納的結論「更可信」？',
        options: ['觀察更多、而且更有代表性的樣本', '只挑支持自己想法的例子', '只看一兩個例子就下結論', '改用感動人的情緒來說服'],
        answer: 0,
        why: '歸納的強弱看樣本——樣本數越多、越有代表性，結論越可信（但仍然是「很可能」，不是「一定」）。',
        whyWrong: { 1: '只挑支持自己的例子（選擇性取樣）會讓歸納偏掉，不會更可信。', 2: '只看一兩個例子樣本太小，很容易以偏概全。', 3: '情緒不是證據，用情緒說服不會讓歸納的結論更可信。' }
      }
    ]
  },
  {
    id: 'rc_compare',
    name: '兩者比一比',
    emoji: '⚖️',
    color: SU,
    sub: '演繹 vs 歸納，加上常見陷阱',
    done: '記住這句：演繹（通則→個例、必然、看前提＋形式）和歸納（個例→通則、很可能、看樣本）方向相反；科學定律多由歸納得來，所以會被新證據修正；用太少又偏的例子硬推全體＝以偏概全的壞歸納。',
    steps: [
      {
        type: 'teach', kicker: '一張表看懂', title: '演繹 vs 歸納對照表',
        svg: compareTable(),
        text: '把兩種推理並排比較最清楚：<b>演繹</b>是「<b>通則 → 個例</b>」，結論<b>一定（必然）</b>，對錯看「前提真不真 ＋ 形式有不有效」；<b>歸納</b>是「<b>個例 → 通則</b>」，結論<b>很可能（不保證）</b>，強弱看「<b>樣本數 ＋ 代表性</b>」。一句話記：想要「鐵定」用演繹（但要前提真）；想從經驗找規律用歸納（但要留意例外）。'
      },
      {
        type: 'teach', kicker: '常見陷阱', title: '定律會修正；小心以偏概全',
        svg: lawRevise(),
        text: '因為科學上的「<b>定律</b>」多半是由<b>大量觀察歸納</b>出來的，所以一旦出現<b>可靠的反例或新證據</b>，就該<b>修正</b>——這不是定律很爛，而正是科學<b>進步</b>的方式。另一個陷阱是<b>以偏概全</b>：用<b>太少、又偏</b>的例子硬推全體（像「三個同學遲到→全班都不守時」），這是太草率的<b>壞歸納</b>。日常裡兩種推理常<b>合用</b>：先歸納出規律，再演繹去應用。'
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '科學家觀察很多次後提出一條「定律」，比較像哪種推理？會不會被新證據推翻？',
        options: ['歸納；會，發現反例就要修正', '演繹；永遠不會改變', '兩者都不是', '無法判斷'],
        answer: 0,
        why: '由大量觀察歸納出通則（定律），結論是「很可能」而非「必然」，所以一旦出現可靠的反例或新證據，定律就要修正——科學就是這樣進步的。',
        whyWrong: { 1: '定律是從觀察歸納來的、不是從更高的通則演繹來的；它會隨新證據修正，不是永遠不變。', 2: '它屬於歸納（由觀察推通則），不是「兩者都不是」。', 3: '從「由大量觀察推出通則」就能判斷這是歸納，不是無法判斷。' }
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '「班上三個同學遲到，所以這班學生都不守時。」錯在？',
        options: ['用太少又偏的例子硬推全體（壞歸納、以偏概全）', '這是正確的演繹', '訴諸權威', '假兩難'],
        answer: 0,
        why: '只用三個同學（樣本太小、又不具代表性）就推論「全班都不守時」，是歸納得太草率——這就是以偏概全的壞歸納。',
        whyWrong: { 1: '演繹要有能保證結論的通則前提；這裡只有幾個例子硬推全體，是歸納、而且推得太草率，不是正確的演繹。', 2: '訴諸權威是搬出名人或專家當理由；這句話沒有引用任何權威。', 3: '假兩難是把選項硬塞成二選一；這題沒有限縮選項。' }
      }
    ]
  }
] };

})();
