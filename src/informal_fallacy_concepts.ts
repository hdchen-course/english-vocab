/* =====================================================================
 * informal_fallacy_concepts.ts  →  (tsc, tsconfig.legacy.json) →  informal_fallacy_concepts.js
 * 「拆穿話術・五種常見謬誤」觀念養成（稻草人／訴諸人身／滑坡／假兩難／訴諸權威·群眾·情緒）。
 *   國小高年級→國中。這是「思辨／邏輯」角度：教怎麼「認出」論證／話術裡的毛病（非形式謬誤），
 *   與 thinking_traps_concepts（認知偏誤＝大腦的傾向）互補不重疊；學會後到 logic_reasoning
 *   「識破謬誤」關做情境應用。資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）。
 *   動畫課重用 anim_core.js 的 window.Anim.fallacySpotlight（論證聚光燈，參數化、多頁共用）；
 *   其餘以 stepped/static SVG。每個 teach step 都有視覺，零純文字。純本地進度（progKey），不餵主 XP。
 *   以 IIFE 包住讓 animCanvas / SVG helper 為檔案區域（避免與其他遷移頁同名頂層 helper
 *   在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。
 * ===================================================================== */
(function () {

// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
function animCanvas(w, h, label) {
  return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
    'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
}

var SU = '#4f46e5', WARN = '#e11d48', OK = '#16a34a', MUT = '#64748b';

// ---- static / stepped SVG helpers（每個非動畫 teach step 都要有視覺，零純文字）---------

// L1 teach2：稻草人的三步驟（聽到溫和主張 → 換成誇張版本 → 攻擊假版本）。
function strawThreeStep() {
  return '<svg viewBox="0 0 300 176" role="img" aria-label="稻草人的三步驟：先聽到溫和主張，偷偷換成誇張的假版本，再攻擊那個假版本；駁倒假版本不等於駁倒你">' +
    '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">稻草人的三步驟</text>' +
    '<rect x="18" y="40" width="80" height="52" rx="9" fill="' + SU + '" opacity="0.12"/>' +
    '<rect x="18" y="40" width="80" height="52" rx="9" fill="none" stroke="' + SU + '" stroke-width="1.6"/>' +
    '<text x="58" y="62" text-anchor="middle" font-size="10.5" fill="currentColor">聽到</text>' +
    '<text x="58" y="78" text-anchor="middle" font-size="10.5" fill="currentColor">溫和主張</text>' +
    '<path d="M100 66 L116 66" stroke="' + MUT + '" stroke-width="2" marker-end="url(#fa1)"/>' +
    '<rect x="118" y="40" width="80" height="52" rx="9" fill="' + WARN + '" opacity="0.12"/>' +
    '<rect x="118" y="40" width="80" height="52" rx="9" fill="none" stroke="' + WARN + '" stroke-width="1.6"/>' +
    '<text x="158" y="62" text-anchor="middle" font-size="10.5" fill="currentColor">偷換成</text>' +
    '<text x="158" y="78" text-anchor="middle" font-size="10.5" fill="currentColor">誇張版本</text>' +
    '<path d="M200 66 L216 66" stroke="' + WARN + '" stroke-width="2" marker-end="url(#fa2)"/>' +
    '<rect x="218" y="40" width="68" height="52" rx="9" fill="' + WARN + '" opacity="0.12"/>' +
    '<rect x="218" y="40" width="68" height="52" rx="9" fill="none" stroke="' + WARN + '" stroke-width="1.6"/>' +
    '<text x="252" y="62" text-anchor="middle" font-size="10.5" fill="' + WARN + '">攻擊</text>' +
    '<text x="252" y="78" text-anchor="middle" font-size="10.5" fill="' + WARN + '">假版本</text>' +
    '<text x="150" y="124" text-anchor="middle" font-size="11.5" font-weight="700" fill="' + WARN + '">駁倒「假版本」≠ 駁倒你真正的主張</text>' +
    '<text x="150" y="150" text-anchor="middle" font-size="10.5" fill="currentColor">破解法：把對方「原本的主張」講清楚，就事論事</text>' +
    '<defs>' +
    '<marker id="fa1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + MUT + '"/></marker>' +
    '<marker id="fa2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + WARN + '"/></marker>' +
    '</defs></svg>';
}

// L2 teach2：對事不對人——論點看理由證據（✓）vs 攻擊這個人（✗）；利益衝突註記。
function adHomSplit() {
  return '<svg viewBox="0 0 300 180" role="img" aria-label="對事不對人：要看論點的理由與證據（合理），不是攻擊提出者的身分或人品（謬誤）；指出利益衝突有時相關，但不能取代對論點本身的檢驗">' +
    '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">對事，不對人</text>' +
    '<rect x="16" y="32" width="128" height="70" rx="10" fill="' + OK + '" opacity="0.1"/>' +
    '<rect x="16" y="32" width="128" height="70" rx="10" fill="none" stroke="' + OK + '" stroke-width="1.6"/>' +
    '<text x="80" y="52" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + OK + '">✓ 看論點</text>' +
    '<text x="80" y="72" text-anchor="middle" font-size="10.5" fill="currentColor">它的理由</text>' +
    '<text x="80" y="88" text-anchor="middle" font-size="10.5" fill="currentColor">與證據站得住嗎</text>' +
    '<rect x="156" y="32" width="128" height="70" rx="10" fill="' + WARN + '" opacity="0.1"/>' +
    '<rect x="156" y="32" width="128" height="70" rx="10" fill="none" stroke="' + WARN + '" stroke-width="1.6"/>' +
    '<text x="220" y="52" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + WARN + '">✗ 攻擊人</text>' +
    '<text x="220" y="72" text-anchor="middle" font-size="10.5" fill="currentColor">他的成績</text>' +
    '<text x="220" y="88" text-anchor="middle" font-size="10.5" fill="currentColor">身分、人品</text>' +
    '<text x="150" y="128" text-anchor="middle" font-size="10.5" fill="currentColor">誰提的，和提案好不好，是兩回事。</text>' +
    '<text x="150" y="152" text-anchor="middle" font-size="10" fill="' + MUT + '">註：指出「利益衝突」有時相關，</text>' +
    '<text x="150" y="167" text-anchor="middle" font-size="10" fill="' + MUT + '">但仍不能取代對論點本身的檢驗。</text>' +
    '</svg>';
}

// L3 teach1：滑坡——骨牌 A→B→C→災難，中間用虛線問號連接（每一步都「一定」會發生？沒有根據）。
function slopeDominoes() {
  var s = '<svg viewBox="0 0 300 182" role="img" aria-label="滑坡謬誤：一串骨牌 A 到 B 到 C 再到災難，骨牌之間用虛線問號連接，提醒每一步都「一定」會發生嗎？沒有根據">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">滑坡：真的會一路倒下去嗎？</text>';
  var xs = [26, 96, 166], labs = ['A', 'B', 'C'];
  for (var i = 0; i < 3; i++) {
    s += '<rect x="' + xs[i] + '" y="54" width="30" height="60" rx="4" fill="' + SU + '" opacity="0.5"/>';
    s += '<rect x="' + xs[i] + '" y="54" width="30" height="60" rx="4" fill="none" stroke="' + SU + '"/>';
    s += '<text x="' + (xs[i] + 15) + '" y="90" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">' + labs[i] + '</text>';
    var qx = xs[i] + 30 + 20;
    s += '<path d="M' + (xs[i] + 30) + ' 84 L' + (qx - 8) + ' 84" stroke="' + WARN + '" stroke-width="1.8" stroke-dasharray="3 3"/>';
    s += '<text x="' + (qx - 4) + '" y="78" text-anchor="middle" font-size="13" font-weight="800" fill="' + WARN + '">?</text>';
  }
  s += '<rect x="236" y="46" width="52" height="68" rx="6" fill="' + WARN + '" opacity="0.14"/>';
  s += '<rect x="236" y="46" width="52" height="68" rx="6" fill="none" stroke="' + WARN + '" stroke-width="1.6"/>';
  s += '<text x="262" y="76" text-anchor="middle" font-size="10.5" fill="' + WARN + '">災難</text>';
  s += '<text x="262" y="92" text-anchor="middle" font-size="10.5" fill="' + WARN + '">結局</text>';
  s += '<text x="150" y="142" text-anchor="middle" font-size="11" fill="currentColor">每個「?」都需要理由：這一步真的「一定」會發生嗎？</text>';
  s += '<text x="150" y="164" text-anchor="middle" font-size="10.5" fill="' + MUT + '">少了這些理由，連鎖就不成立——這就是滑坡。</text>';
  return s + '</svg>';
}

// L3 teach2：連鎖裡有一環斷掉（紅圈），缺的是「每一步都一定發生」的理由。
function slopeBrokenLink() {
  return '<svg viewBox="0 0 300 168" role="img" aria-label="滑坡的破綻在連接：鏈子中有一環是斷的，缺的是每一步都一定會發生的理由，連鎖因此不成立">' +
    '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">破綻在「連接」，不在起點</text>' +
    '<ellipse cx="52" cy="70" rx="16" ry="11" fill="none" stroke="' + SU + '" stroke-width="3"/>' +
    '<ellipse cx="92" cy="70" rx="16" ry="11" fill="none" stroke="' + SU + '" stroke-width="3"/>' +
    '<ellipse cx="150" cy="70" rx="16" ry="11" fill="none" stroke="' + WARN + '" stroke-width="3" stroke-dasharray="4 4"/>' +
    '<line x1="138" y1="58" x2="162" y2="82" stroke="' + WARN + '" stroke-width="2.4"/>' +
    '<line x1="162" y1="58" x2="138" y2="82" stroke="' + WARN + '" stroke-width="2.4"/>' +
    '<ellipse cx="208" cy="70" rx="16" ry="11" fill="none" stroke="' + SU + '" stroke-width="3"/>' +
    '<ellipse cx="248" cy="70" rx="16" ry="11" fill="none" stroke="' + SU + '" stroke-width="3"/>' +
    '<text x="150" y="112" text-anchor="middle" font-size="11" font-weight="700" fill="' + WARN + '">少了「這一步一定會發生」的理由</text>' +
    '<text x="150" y="136" text-anchor="middle" font-size="10.5" fill="currentColor">只要有一環接不起來，整條連鎖就斷了。</text>' +
    '</svg>';
}

// L4 teach1：假兩難——先只給兩道門（要嘛…要嘛…），再打開其實還有第三、第四道門。
function falseDilemmaDoors() {
  var s = '<svg viewBox="0 0 300 184" role="img" aria-label="假兩難：一開始只給兩道門，要嘛這個要嘛那個；其實打開看還有第三、第四道門，選項不只兩個">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">只有兩道門嗎？</text>';
  // 左：只給兩道門
  s += '<text x="76" y="38" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + WARN + '">他說：只有兩種</text>';
  s += '<rect x="34" y="48" width="34" height="66" rx="4" fill="' + WARN + '" opacity="0.12"/><rect x="34" y="48" width="34" height="66" rx="4" fill="none" stroke="' + WARN + '"/>';
  s += '<circle cx="62" cy="82" r="2.2" fill="' + WARN + '"/><text x="51" y="130" text-anchor="middle" font-size="11" fill="currentColor">A</text>';
  s += '<rect x="84" y="48" width="34" height="66" rx="4" fill="' + WARN + '" opacity="0.12"/><rect x="84" y="48" width="34" height="66" rx="4" fill="none" stroke="' + WARN + '"/>';
  s += '<circle cx="112" cy="82" r="2.2" fill="' + WARN + '"/><text x="101" y="130" text-anchor="middle" font-size="11" fill="currentColor">B</text>';
  // 中：箭頭
  s += '<path d="M126 82 L150 82" stroke="' + MUT + '" stroke-width="2" marker-end="url(#fd1)"/>';
  // 右：其實還有更多門
  s += '<text x="226" y="38" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + OK + '">其實還有更多</text>';
  var dx = [158, 198, 238, 266];
  var dl = ['A', 'B', 'C', 'D'];
  for (var i = 0; i < 4; i++) {
    var col = i < 2 ? SU : OK;
    s += '<rect x="' + dx[i] + '" y="48" width="26" height="66" rx="4" fill="' + col + '" opacity="0.12"/>';
    s += '<rect x="' + dx[i] + '" y="48" width="26" height="66" rx="4" fill="none" stroke="' + col + '"/>';
    s += '<circle cx="' + (dx[i] + 20) + '" cy="82" r="2" fill="' + col + '"/>';
    s += '<text x="' + (dx[i] + 13) + '" y="130" text-anchor="middle" font-size="10" fill="currentColor">' + dl[i] + '</text>';
  }
  s += '<text x="150" y="158" text-anchor="middle" font-size="11" fill="currentColor">把很多選擇硬塞成「二選一」，就是假兩難。</text>';
  s += '<text x="150" y="176" text-anchor="middle" font-size="10" fill="' + MUT + '">先問：真的只有這兩種嗎？</text>';
  s += '<defs><marker id="fd1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + MUT + '"/></marker></defs>';
  return s + '</svg>';
}

// L4 teach2：中間地帶——支持 ←→ 反對 之間還有「支持但有意見」等立場。
function falseDilemmaSpectrum() {
  return '<svg viewBox="0 0 300 160" role="img" aria-label="立場不是只有兩端：支持和反對之間還有支持但有意見、保留等中間地帶，不該被硬塞成二選一">' +
    '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">立場是一條線，不是兩個點</text>' +
    '<line x1="34" y1="78" x2="266" y2="78" stroke="currentColor" stroke-width="1.6" opacity="0.6"/>' +
    '<circle cx="34" cy="78" r="6" fill="' + WARN + '"/><text x="34" y="104" text-anchor="middle" font-size="10.5" fill="currentColor">完全反對</text>' +
    '<circle cx="266" cy="78" r="6" fill="' + WARN + '"/><text x="266" y="104" text-anchor="middle" font-size="10.5" fill="currentColor">完全支持</text>' +
    '<circle cx="112" cy="78" r="5" fill="' + OK + '"/><text x="112" y="58" text-anchor="middle" font-size="10" fill="' + OK + '">有保留</text>' +
    '<circle cx="190" cy="78" r="5" fill="' + OK + '"/><text x="190" y="58" text-anchor="middle" font-size="10" fill="' + OK + '">支持但有意見</text>' +
    '<text x="150" y="134" text-anchor="middle" font-size="11" fill="currentColor">「不支持就是不愛班」忽略了中間這一大段。</text>' +
    '</svg>';
}

// L5 teach2：引用權威的界線——相關專家＋證據（✓）vs 不相關名氣／人多／情緒（✗）。
function appealBoundary() {
  return '<svg viewBox="0 0 300 190" role="img" aria-label="引用權威的界線：相關領域專家根據證據的判斷是合理的；而不相關名氣、人多、情緒代替理由才是謬誤">' +
    '<text x="150" y="15" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">引用權威：合理 vs 謬誤</text>' +
    '<rect x="16" y="26" width="268" height="60" rx="10" fill="' + OK + '" opacity="0.1"/>' +
    '<rect x="16" y="26" width="268" height="60" rx="10" fill="none" stroke="' + OK + '" stroke-width="1.6"/>' +
    '<text x="150" y="43" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + OK + '">✓ 合理</text>' +
    '<text x="150" y="61" text-anchor="middle" font-size="10.5" fill="currentColor">相關領域專家，根據「證據」的判斷</text>' +
    '<text x="150" y="77" text-anchor="middle" font-size="10" fill="' + MUT + '">（例：牙醫依研究建議「飯後刷牙」）</text>' +
    '<rect x="16" y="98" width="268" height="60" rx="10" fill="' + WARN + '" opacity="0.1"/>' +
    '<rect x="16" y="98" width="268" height="60" rx="10" fill="none" stroke="' + WARN + '" stroke-width="1.6"/>' +
    '<text x="150" y="115" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + WARN + '">✗ 謬誤</text>' +
    '<text x="150" y="133" text-anchor="middle" font-size="10.5" fill="currentColor">不相關名氣、人多就對、用恐嚇或感動</text>' +
    '<text x="150" y="149" text-anchor="middle" font-size="10" fill="' + MUT + '">——用名氣／人數／情緒代替理由與證據</text>' +
    '<text x="150" y="180" text-anchor="middle" font-size="10.5" fill="' + MUT + '">關鍵看：是不是「相關專家」＋有沒有「證據」。</text>' +
    '</svg>';
}

window.CONCEPT = { progKey: 'informal_fallacy_concepts_v1', practiceHref: 'logic_reasoning.html', lessons: [
  {
    id: 'if_strawman',
    name: '稻草人',
    emoji: '🥀',
    color: SU,
    sub: '扭曲對方的話，再去打那個假版本',
    done: '記住這句：稻草人是「把對方的主張扭曲成誇張、好反駁的版本再攻擊」；破解法是回到對方「原本的主張」，就事論事。',
    steps: [
      {
        type: 'teach', kicker: '先看動畫', title: '把「晚一點睡」偷換成「整晚不睡」',
        svg: animCanvas(300, 210, '稻草人聚光燈：左框是原本溫和的主張「我們晚一點睡吧」，紅箭頭把它偷換成右框誇張的假版本「你想整晚不睡」，中間標紅斷裂處'),
        mount: function (host) { var h = window.Anim.fallacySpotlight(host, { type: 'strawman', left: { label: '原本的主張', text: '晚一點睡吧' }, right: { label: '被扭曲的版本', text: '整晚不睡！' }, breakLabel: '偷偷換成誇張、好打的版本再攻擊' }); return function () { h.stop(); }; },
        text: '小明說：「我們<b>晚一點</b>睡吧。」媽媽卻回：「你是想<b>整晚不睡</b>、把身體搞壞嗎？」看出來了嗎——媽媽沒有回應「晚一點」這個溫和的主張，而是<b>偷偷換成</b>一個誇張、好反駁的版本（整晚不睡），再去打它。這個被架起來的「假版本」，就叫<b>稻草人</b>。'
      },
      {
        type: 'teach', kicker: '這是什麼謬誤', title: '稻草人：扭曲後再攻擊',
        svg: strawThreeStep(),
        text: '<b>稻草人謬誤</b>＝故意把對方的說法<b>扭曲成誇張、好反駁的版本</b>，再去攻擊那個版本。它分三步：聽到溫和主張 → 偷換成誇張版本 → 攻擊假版本。問題在於：你駁倒的是自己架起來的<b>稻草人</b>，不是對方<b>真正</b>的主張。破解法是——先把對方「原本的主張」講清楚，再就事論事。'
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '小明說「我們晚一點睡吧」，媽媽回「你是想整晚不睡覺、把身體搞壞嗎？」媽媽犯了哪種謬誤？',
        options: ['稻草人：把「晚一點」誇大成「整晚不睡」', '合理回應', '訴諸人身', '滑坡'],
        answer: 0,
        why: '媽媽把溫和的「晚一點睡」偷換成極端的「整晚不睡」再反駁，攻擊的是被誇大的假版本，這正是稻草人。',
        whyWrong: { 1: '媽媽沒有針對「晚一點睡」本身回應，而是換了個誇張版本來打，不算合理回應。', 2: '訴諸人身是攻擊「小明這個人」（例如罵他懶）；這裡攻擊的是被誇大的「主張」，所以是稻草人。', 3: '滑坡是說一件小事會「一路連鎖」滑到災難；這裡是把主張「換成」誇張版本，不是推一串後果。' }
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '要破解稻草人，最該做的是？',
        options: ['把對方真正的主張講清楚、就事論事', '比誰聲音大', '換個話題', '人身攻擊'],
        answer: 0,
        why: '回到對方「原本的主張」、就事論事，才不會打到自己架起來的假版本，這樣討論才公平。',
        whyWrong: { 1: '比誰聲音大不會讓論點變對，也沒回到對方真正的主張。', 2: '換話題是逃避，根本沒處理對方原本的主張。', 3: '人身攻擊是另一種謬誤（訴諸人身），只會讓討論更離題。' }
      }
    ]
  },
  {
    id: 'if_adhominem',
    name: '訴諸人身',
    emoji: '🙅',
    color: SU,
    sub: '不談主張對不對，改攻擊提出的人',
    done: '記住這句：訴諸人身是「不討論主張對不對，改攻擊提出者的身分或人品」；破解法是對事不對人，只看論點的理由與證據。',
    steps: [
      {
        type: 'teach', kicker: '先看動畫', title: '箭頭射向「人」，而不是論點',
        svg: animCanvas(300, 210, '訴諸人身聚光燈：左框是對方的論點（環保提案），紅箭頭卻射向右邊「這個人」而不是論點，中間標紅攻擊人、不談理由'),
        mount: function (host) { var h = window.Anim.fallacySpotlight(host, { type: 'adhominem', left: { label: '對方的論點', text: '環保提案' }, right: { label: '這個人' }, breakLabel: '攻擊人，不談論點對不對' }); return function () { h.stop(); }; },
        text: '同學提出一個<b>環保提案</b>，有人卻回：「你<b>成績那麼爛</b>，提什麼意見！」注意看動畫——該檢驗的是<b>論點本身</b>，紅箭頭卻一轉，射向了「<b>這個人</b>」。<b>訴諸人身</b>就是：不討論主張對不對，改去攻擊<b>提出者</b>的身分、成績或人品。但成績和提案好不好，根本是兩回事。'
      },
      {
        type: 'teach', kicker: '這是什麼謬誤', title: '對事，不對人',
        svg: adHomSplit(),
        text: '<b>訴諸人身謬誤</b>＝把焦點從「<b>論點</b>」移到「<b>人</b>」身上。要回應一個主張，該看它的<b>理由與證據</b>站不站得住，而不是提出者是誰。<b>嚴謹註記</b>：指出對方有「利益衝突」（例如他賣這個產品）有時<b>相關</b>、值得留意，但那只是提醒我們小心，<b>不能取代</b>對論點本身的檢驗——論點對不對，最後還是要看理由與證據。'
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '同學提出一個環保提案，有人回「你成績那麼爛，提什麼意見」，這是？',
        options: ['訴諸人身：攻擊人而非提案', '合理質疑', '稻草人', '假兩難'],
        answer: 0,
        why: '對方沒有討論提案的好壞，只拿「成績爛」攻擊提出者；成績和提案的對錯無關，這就是訴諸人身。',
        whyWrong: { 1: '合理質疑要針對「提案的內容」給理由；這裡只罵成績，沒碰提案本身。', 2: '稻草人是把提案「扭曲成誇張版本」再打；這裡沒扭曲提案，而是直接攻擊人。', 3: '假兩難是硬塞「只有兩種選擇」；這題並沒有把選項限縮成二選一。' }
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '要正確回應一個提案，應該看？',
        options: ['提案本身的理由與證據', '提案人是誰', '提案人長相', '提案人幾歲'],
        answer: 0,
        why: '對事不對人：一個提案好不好，要看它的理由與證據，而不是誰提的。',
        whyWrong: { 1: '誰提的，和提案好不好是兩回事；對事不對人。', 2: '長相和提案的對錯完全無關。', 3: '年紀不能決定一個提案有沒有道理。' }
      }
    ]
  },
  {
    id: 'if_slope',
    name: '滑坡',
    emoji: '🎿',
    color: SU,
    sub: '把一小步說成一定會滑到大災難',
    done: '記住這句：滑坡是「主張做了小事就一定會無可避免滑到極端後果，卻沒給每一步成立的理由」；破解法是檢查每一環是否真有理由支撐。',
    steps: [
      {
        type: 'teach', kicker: '先看圖', title: '骨牌真的會一路倒到底嗎？',
        svg: slopeDominoes(),
        text: '「今天讓你<b>多玩十分鐘</b>，明天你就會<b>整天不讀書</b>、以後<b>一定考不上</b>、<b>人生就毀了</b>！」聽起來很嚇人，但看看圖裡每個骨牌之間的<b>紅色問號</b>——這一步真的「<b>一定</b>」會推倒下一步嗎？<b>滑坡謬誤</b>就是：把一件小事說成會<b>無可避免</b>地連鎖滑到極端後果，卻<b>沒給出每一步成立的理由</b>。'
      },
      {
        type: 'teach', kicker: '這是什麼謬誤', title: '破綻在「連接」，不在起點',
        svg: slopeBrokenLink(),
        text: '滑坡的毛病<b>不在起點</b>（多玩十分鐘沒什麼大不了），而在中間一環一環的「<b>連接</b>」。它假裝每一步都會「一定」發生，可是只要有<b>一環接不起來</b>（為什麼多玩十分鐘就「一定」整天不讀書？），整條連鎖就<b>斷了</b>。破解法：逐一追問每一環——「這一步真的一定會發生嗎？根據是什麼？」'
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '「今天讓你多玩十分鐘，明天你就會整天不讀書、以後一定考不上、人生就毀了」，這是？',
        options: ['滑坡：把一小步說成必然的連鎖災難', '合理推論', '訴諸權威', '稻草人'],
        answer: 0,
        why: '它把「多玩十分鐘」說成會一路必然滑到「人生毀了」，中間每一步都用「一定」帶過卻沒根據，這就是滑坡。',
        whyWrong: { 1: '合理推論會給出「每一步為什麼會發生」的理由；這裡每一步都用「一定」帶過，缺乏根據。', 2: '訴諸權威是搬出名人或專家當理由；這句話沒有引用任何權威。', 3: '稻草人是扭曲對方的主張再攻擊；這裡是誇大「後果的連鎖」，屬於滑坡。' }
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '滑坡論證最大的破綻是？',
        options: ['沒有證明每一步都「一定」會發生', '結論太溫和', '證據太多', '太有禮貌'],
        answer: 0,
        why: '連鎖的每一環都需要理由支撐；滑坡的破綻正是沒有證明「每一步都一定會發生」。',
        whyWrong: { 1: '滑坡的結論通常很誇張（人生就毀了），不是太溫和。', 2: '滑坡的問題正是「缺乏證據」，不是證據太多。', 3: '有沒有禮貌和論證成不成立無關。' }
      }
    ]
  },
  {
    id: 'if_dilemma',
    name: '假兩難',
    emoji: '🚪',
    color: SU,
    sub: '明明有很多選擇，卻說「只能二選一」',
    done: '記住這句：假兩難是「把其實有很多選擇的情況，說成只有兩種、二選一」；破解法是先問「真的只有這兩種嗎？有沒有第三種？」',
    steps: [
      {
        type: 'teach', kicker: '先看圖', title: '真的只有兩道門嗎？',
        svg: falseDilemmaDoors(),
        text: '「你<b>不支持</b>這個計畫，<b>就是不愛</b>我們班！」這句話把你逼到只剩<b>兩道門</b>：要嘛支持、要嘛不愛班。但看看右邊——其實還有<b>第三、第四道門</b>：你可以「<b>支持但有意見</b>」、可以「先保留再想想」。<b>假兩難謬誤</b>就是：把本來<b>有很多選擇</b>的情況，硬說成「<b>只有兩種、二選一</b>」。'
      },
      {
        type: 'teach', kicker: '這是什麼謬誤', title: '立場是一條線，不是兩個點',
        svg: falseDilemmaSpectrum(),
        text: '很多事情的立場像一條<b>連續的線</b>，從一端到另一端中間還有<b>一大段</b>：完全支持、支持但有意見、有保留、完全反對……<b>假兩難</b>把這條線硬壓成<b>兩個端點</b>，逼你二選一，忽略了<b>中間地帶</b>。破解法：聽到「不是 A 就是 B」時，先問自己——<b>真的只有這兩種嗎？有沒有第三種？</b>'
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '「你不支持這個計畫，就是不愛我們班」，問題在？',
        options: ['假兩難：其實還有「支持但有意見」等選項', '訴諸人身', '稻草人', '合理'],
        answer: 0,
        why: '這句話把立場硬塞成「支持」或「不愛班」二選一，忽略了「支持但有意見」等中間選項，這就是假兩難。',
        whyWrong: { 1: '訴諸人身是攻擊某個人的身分或人品；這句話是把選項硬塞成二選一，屬假兩難。', 2: '稻草人是扭曲對方的主張；這裡沒有扭曲誰的主張，而是限縮選項。', 3: '把「有很多可能」說成「只有兩種」並不合理，中間還有很多立場。' }
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '聽到「不是 A 就是 B」時，該先問？',
        options: ['真的只有這兩種嗎？有沒有第三種', 'A 和 B 哪個好聽', '誰說的', '快點選一個'],
        answer: 0,
        why: '假兩難的破解法，就是先檢查「選項是不是被人為限縮」——真的只有這兩種嗎？',
        whyWrong: { 1: '好不好聽不是重點，重點是選項有沒有被人為限縮。', 2: '先問「誰說的」容易滑向訴諸人身；該先檢查「選項是不是真的只有兩個」。', 3: '急著二選一，正好中了假兩難的圈套。' }
      }
    ]
  },
  {
    id: 'if_appeal',
    name: '訴諸權威·群眾·情緒',
    emoji: '📣',
    color: SU,
    sub: '用名氣、人多、情緒代替理由',
    done: '記住這句：引用「相關領域專家依證據的共識」是合理的；謬誤是訴諸不相關／假權威、把「人多」當「正確」、或用情緒取代證據。',
    steps: [
      {
        type: 'teach', kicker: '先看動畫', title: '名氣、人多、情緒都不是「理由」',
        svg: animCanvas(300, 220, '訴諸權威、群眾、情緒聚光燈：三格並呈名人掛保證但非這領域專家、大家都這樣所以對、用恐嚇或感動代替理由，各標紅✗，底部點出都用人氣與情緒代替理由證據'),
        mount: function (host) { var h = window.Anim.fallacySpotlight(host, { type: 'appeal', panels: [{ label: '🌟 名人掛保證', text: '但他不是這領域專家' }, { label: '👥 大家都這樣', text: '人多就一定對？' }, { label: '😱 恐嚇或感動', text: '用情緒代替理由' }], breakLabel: '都用人氣／情緒／不相關名氣，代替理由與證據' }); return function () { h.stop(); }; },
        text: '這三種話術很常見：①「<b>當紅歌星代言</b>，這款鞋一定好！」（名氣）②「<b>大家都這樣</b>做，所以一定對！」（人多）③「<b>廣告好感人</b>，照做就對了！」（情緒）。它們的共同毛病是：用<b>人氣、人數或情緒</b>來<b>代替理由與證據</b>。歌星不是製鞋專家、人多不代表正確、感動也不能證明一件事是對的。'
      },
      {
        type: 'teach', kicker: '這是什麼謬誤', title: '引用權威：合理 vs 謬誤的界線',
        svg: appealBoundary(),
        text: '這裡有一條<b>重要的界線</b>，別一竿子打翻所有「引用權威」：引用「<b>相關領域專家</b>，根據<b>證據</b>的共識」是<b>合理</b>的——例如牙醫師依研究建議「飯後要刷牙」。會變成<b>謬誤</b>的是：訴諸<b>不相關／假權威</b>（歌星代言鞋）、把「<b>人多</b>」當成「正確」（訴諸群眾）、或用<b>恐嚇／感動</b>代替理由（訴諸情緒）。關鍵看兩點：是不是「<b>相關</b>專家」？背後有沒有「<b>證據</b>」？'
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '「這款鞋一定好，因為當紅歌星代言！」這是？',
        options: ['訴諸（不相關）權威：歌星非製鞋專家', '合理推薦', '假兩難', '滑坡'],
        answer: 0,
        why: '歌星是演藝名人、不是製鞋或材料專家，代言並不是「鞋子品質」的證據；用不相關的名氣當理由，就是訴諸（不相關）權威。',
        whyWrong: { 1: '合理推薦要有「鞋子本身」的證據（用料、測試）；明星代言不是品質的證據。', 2: '假兩難是把選項限縮成二選一；這題沒有限縮選項。', 3: '滑坡是誇大一連串後果；這題沒有推論連鎖後果。' }
      },
      {
        type: 'quiz', kicker: '換你試試',
        title: '下列哪一個「不是」謬誤？',
        options: ['牙醫師根據研究證據建議「飯後要刷牙」', '因為大家都這樣做所以一定對', '因為廣告很感人所以照做', '因為明星這樣做所以照做'],
        answer: 0,
        why: '相關領域專家（牙醫師）根據「證據」對專業「做法」的判斷，是合理的依據；這裡刻意說「做法」而不指定某個商品品牌，以免和業配混在一起。其餘三個都用人多、情緒或不相關名氣代替理由，才是謬誤。',
        whyWrong: { 1: '「大家都這樣」是訴諸群眾——人多不等於正確。', 2: '「廣告很感人」是訴諸情緒——感動不能代替理由。', 3: '「明星這樣做」是訴諸不相關權威——明星的名氣不是證據。' }
      }
    ]
  }
] };

})();
