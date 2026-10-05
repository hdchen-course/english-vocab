/* =====================================================================
 * chinese_literature_map_concepts.ts  →  (tsc, tsconfig.legacy.json) →  chinese_literature_map_concepts.js
 * 「文學常識地圖」觀念養成（文體三大分類／時代文學時間軸／唐詩雙星／四大名著）。
 *   國中→高中；系統化中國文學史常識（文體分類、朝代—代表文體對應、名家名著）。
 *   資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）。
 *   推理型 viz 以本頁 local stepped/static SVG 為主（分類樹／判斷流程／時間軸／雙星卡／名著卡——
 *   讀一張地圖或時間軸本就是靜態推理）；lesson 4 teach(2) 重用 anim_core.js 的
 *   window.Anim.textHighlight（四部書名《》依序點亮配作者，順帶複習書名號），不重造場景。
 *   以 IIFE 包住讓 animCanvas / SVG helper 為檔案區域（避免與其他遷移頁同名頂層 helper
 *   在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。純本地進度（progKey），不餵主 XP。
 *   文學史為客觀事實（朝代／文學家），非黨國語彙照用；若觸及今日國家一律「中國」不用「大陸」。
 * ===================================================================== */
(function () {

// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
function animCanvas(w: number, h: number, label: string): string {
  return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
    'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
}

// ---- 本頁 SVG（資訊文字 fill=currentColor 隨主題變色；結構線 currentColor + 透明度；重點用 AC）----
var AC = '#b91c1c', FILL = 'rgba(185,28,28,0.10)';

function arrow(x1: number, y1: number, x2: number, y2: number, color: string, w: number): string {
  var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len;
  var s = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round"/>';
  s += '<polygon points="' + x2 + ',' + y2 + ' ' + (x2 - ux * 10 - uy * 5).toFixed(1) + ',' + (y2 - uy * 10 + ux * 5).toFixed(1) + ' ' + (x2 - ux * 10 + uy * 5).toFixed(1) + ',' + (y2 - uy * 10 - ux * 5).toFixed(1) + '" fill="' + color + '"/>';
  return s;
}

// 文體三大分類樹：文學作品 → 韻文／散文／小說戲劇（連接線止於方塊邊緣，#29）
function genreTree(): string {
  var s = '<svg viewBox="0 0 320 196" role="img" aria-label="文學作品分成韻文、散文、小說戲劇三大類">';
  s += '<rect x="118" y="8" width="84" height="30" rx="9" fill="' + FILL + '" stroke="' + AC + '" stroke-width="2"/>';
  s += '<text x="160" y="28" text-anchor="middle" font-size="15" font-weight="800" fill="currentColor">文學作品</text>';
  // 連接匯流：根方塊底(y=38)→匯流列(y=56)→各子方塊頂(y=72)，皆止於邊緣
  s += '<line x1="160" y1="38" x2="160" y2="56" stroke="currentColor" stroke-opacity="0.55" stroke-width="2"/>';
  s += '<line x1="56" y1="56" x2="264" y2="56" stroke="currentColor" stroke-opacity="0.55" stroke-width="2"/>';
  [56, 160, 264].forEach(function (cx) {
    s += '<line x1="' + cx + '" y1="56" x2="' + cx + '" y2="72" stroke="currentColor" stroke-opacity="0.55" stroke-width="2"/>';
  });
  var cols = [
    { x: 8, t: '韻文', note: '押韻·有節奏', ex: '詩 · 詞 · 曲' },
    { x: 112, t: '散文', note: '不押韻·像說話', ex: '記敘 · 抒情' },
    { x: 216, t: '小說戲劇', note: '有人物·有情節', ex: '故事 · 劇本' }
  ];
  cols.forEach(function (c) {
    s += '<rect x="' + c.x + '" y="72" width="96" height="104" rx="10" fill="' + FILL + '" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.8"/>';
    s += '<text x="' + (c.x + 48) + '" y="100" text-anchor="middle" font-size="15" font-weight="800" fill="' + AC + '">' + c.t + '</text>';
    s += '<text x="' + (c.x + 48) + '" y="124" text-anchor="middle" font-size="10" font-weight="800" fill="currentColor">' + c.note + '</text>';
    s += '<text x="' + (c.x + 48) + '" y="152" text-anchor="middle" font-size="12" fill="currentColor">' + c.ex + '</text>';
  });
  return s + '</svg>';
}

// 文體判斷流程：押韻嗎？→ 韻文；否→有人物情節嗎？→ 小說戲劇／散文（連接線止於邊緣）
function genreDecide(): string {
  var s = '<svg viewBox="0 0 300 206" role="img" aria-label="判斷文體：先問押不押韻，再問有沒有人物情節">';
  function box(x: number, y: number, w: number, h: number, txt: string, fs: number, accent: boolean) {
    s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="9" fill="' + FILL + '" stroke="' + (accent ? AC : 'currentColor') + '" stroke-opacity="' + (accent ? 1 : 0.6) + '" stroke-width="' + (accent ? 2 : 1.8) + '"/>';
    s += '<text x="' + (x + w / 2) + '" y="' + (y + h / 2 + fs * 0.36) + '" text-anchor="middle" font-size="' + fs + '" font-weight="800" fill="' + (accent ? AC : 'currentColor') + '">' + txt + '</text>';
  }
  box(100, 6, 100, 26, '拿到作品', 13, false);
  box(70, 50, 160, 30, '押韻、有節奏嗎？', 13, false);
  box(244, 52, 50, 28, '韻文', 13, true);
  box(70, 104, 160, 30, '有人物情節嗎？', 13, false);
  box(236, 106, 60, 28, '小說戲劇', 11, true);
  box(108, 158, 84, 28, '散文', 13, true);
  s += arrow(150, 32, 150, 50, 'currentColor', 2);        // 作品→Q1
  s += arrow(230, 66, 244, 66, AC, 2.2);                  // Q1→韻文（是）
  s += '<text x="237" y="60" text-anchor="middle" font-size="10" font-weight="800" fill="' + AC + '">是</text>';
  s += arrow(150, 80, 150, 104, 'currentColor', 2);       // Q1→Q2（否）
  s += '<text x="159" y="96" font-size="10" font-weight="800" fill="currentColor">否</text>';
  s += arrow(230, 120, 236, 120, AC, 2.2);                // Q2→小說戲劇（是）
  s += '<text x="231" y="114" text-anchor="middle" font-size="10" font-weight="800" fill="' + AC + '">是</text>';
  s += arrow(150, 134, 150, 158, 'currentColor', 2);      // Q2→散文（否）
  s += '<text x="159" y="150" font-size="10" font-weight="800" fill="currentColor">否</text>';
  return s + '</svg>';
}

// 時代文學時間軸：先秦《詩經》→戰國楚辭→漢賦→唐詩→宋詞→元曲→明清小說（節點依序落在時間軸上）
function eraTimeline(): string {
  var nodes = [
    { era: '先秦', form: '《詩經》' },
    { era: '戰國', form: '楚辭' },
    { era: '漢', form: '漢賦' },
    { era: '唐', form: '唐詩' },
    { era: '宋', form: '宋詞' },
    { era: '元', form: '元曲' },
    { era: '明清', form: '小說' }
  ];
  var s = '<svg viewBox="0 0 700 150" role="img" aria-label="時代文學時間軸：詩經、楚辭、漢賦、唐詩、宋詞、元曲、明清小說">';
  s += '<line x1="34" y1="75" x2="662" y2="75" stroke="currentColor" stroke-opacity="0.5" stroke-width="3" stroke-linecap="round"/>';
  s += arrow(662, 75, 680, 75, 'currentColor', 3);
  var x = 58, step = 100;
  nodes.forEach(function (n) {
    s += '<circle cx="' + x + '" cy="75" r="7" fill="' + AC + '"/>';
    s += '<text x="' + x + '" y="46" text-anchor="middle" font-size="14" font-weight="800" fill="currentColor">' + n.era + '</text>';
    s += '<text x="' + x + '" y="104" text-anchor="middle" font-size="13" font-weight="800" fill="' + AC + '">' + n.form + '</text>';
    x += step;
  });
  s += '<text x="664" y="120" text-anchor="end" font-size="11" font-weight="800" fill="currentColor">時間 →</text>';
  return s + '</svg>';
}

// 朝代配文體（核心四組）：唐詩／宋詞／元曲／明清小說（連接線止於方塊邊緣）
function eraMatch(): string {
  var rows = [
    { d: '唐', f: '唐詩' },
    { d: '宋', f: '宋詞' },
    { d: '元', f: '元曲' },
    { d: '明清', f: '明清小說' }
  ];
  var s = '<svg viewBox="0 0 290 212" role="img" aria-label="朝代配文體：唐詩、宋詞、元曲、明清小說">';
  var y = 16;
  rows.forEach(function (r) {
    s += '<rect x="24" y="' + y + '" width="78" height="34" rx="9" fill="' + FILL + '" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.8"/>';
    s += '<text x="63" y="' + (y + 23) + '" text-anchor="middle" font-size="16" font-weight="800" fill="currentColor">' + r.d + '</text>';
    s += arrow(102, y + 17, 166, y + 17, AC, 2.4);
    s += '<rect x="168" y="' + y + '" width="100" height="34" rx="9" fill="' + FILL + '" stroke="' + AC + '" stroke-width="2"/>';
    s += '<text x="218" y="' + (y + 23) + '" text-anchor="middle" font-size="15" font-weight="800" fill="' + AC + '">' + r.f + '</text>';
    y += 48;
  });
  return s + '</svg>';
}

// 唐詩雙星卡：李白（詩仙·浪漫）／杜甫（詩聖·寫實）
function poetStars(): string {
  var s = '<svg viewBox="0 0 300 182" role="img" aria-label="唐詩雙星：李白詩仙、杜甫詩聖">';
  function card(x: number, name: string, title: string, l1: string, l2: string, work: string) {
    s += '<rect x="' + x + '" y="8" width="135" height="166" rx="12" fill="' + FILL + '" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8"/>';
    s += '<text x="' + (x + 67) + '" y="44" text-anchor="middle" font-size="26" font-weight="800" fill="currentColor">' + name + '</text>';
    s += '<rect x="' + (x + 30) + '" y="58" width="75" height="26" rx="13" fill="none" stroke="' + AC + '" stroke-width="2"/>';
    s += '<text x="' + (x + 67) + '" y="76" text-anchor="middle" font-size="15" font-weight="800" fill="' + AC + '">' + title + '</text>';
    s += '<text x="' + (x + 67) + '" y="112" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">' + l1 + '</text>';
    s += '<text x="' + (x + 67) + '" y="132" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">' + l2 + '</text>';
    s += '<text x="' + (x + 67) + '" y="160" text-anchor="middle" font-size="11" fill="currentColor">例：' + work + '</text>';
  }
  card(10, '李白', '詩仙', '飄逸浪漫', '想像奔放', '〈靜夜思〉');
  card(155, '杜甫', '詩聖', '寫實沉鬱', '關懷社會', '〈春望〉');
  return s + '</svg>';
}

// 判讀雙星：風格偏向？→ 李白（浪漫）／杜甫（寫實）（連接線止於方塊邊緣）
function poetDecide(): string {
  var s = '<svg viewBox="0 0 300 176" role="img" aria-label="判讀唐詩風格：浪漫想像多是李白，寫實關懷多是杜甫">';
  s += '<rect x="95" y="6" width="110" height="28" rx="9" fill="' + FILL + '" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.8"/>';
  s += '<text x="150" y="25" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">讀一首唐詩</text>';
  s += '<rect x="80" y="52" width="140" height="30" rx="9" fill="' + FILL + '" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.8"/>';
  s += '<text x="150" y="72" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">風格偏向？</text>';
  s += arrow(150, 34, 150, 52, 'currentColor', 2);
  s += arrow(110, 82, 73, 120, 'currentColor', 2);        // →李白（左）止於子方塊頂緣
  s += '<rect x="8" y="120" width="130" height="48" rx="10" fill="' + FILL + '" stroke="' + AC + '" stroke-width="2"/>';
  s += '<text x="73" y="140" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">想像奔放·浪漫</text>';
  s += '<text x="73" y="160" text-anchor="middle" font-size="14" font-weight="800" fill="' + AC + '">李白·詩仙</text>';
  s += arrow(190, 82, 227, 120, 'currentColor', 2);       // →杜甫（右）
  s += '<rect x="162" y="120" width="130" height="48" rx="10" fill="' + FILL + '" stroke="' + AC + '" stroke-width="2"/>';
  s += '<text x="227" y="140" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">寫實沉鬱·關懷</text>';
  s += '<text x="227" y="160" text-anchor="middle" font-size="14" font-weight="800" fill="' + AC + '">杜甫·詩聖</text>';
  return s + '</svg>';
}

// 四大名著卡（作者＋歸屬小字註，採學界通說並註）
function fourClassics(): string {
  var rows = [
    { t: '《三國演義》', a: '羅貫中', note: '元末明初·通說' },
    { t: '《水滸傳》', a: '施耐庵', note: '相傳施耐庵（一說與羅貫中合著）' },
    { t: '《西遊記》', a: '吳承恩', note: '相傳吳承恩所著' },
    { t: '《紅樓夢》', a: '曹雪芹', note: '曹雪芹著，後四十回一般認為高鶚續補' }
  ];
  var s = '<svg viewBox="0 0 300 232" role="img" aria-label="四大名著與作者：三國演義、水滸傳、西遊記、紅樓夢">';
  var y = 8;
  rows.forEach(function (r) {
    s += '<rect x="10" y="' + y + '" width="280" height="50" rx="10" fill="' + FILL + '" stroke="currentColor" stroke-opacity="0.55" stroke-width="1.8"/>';
    s += '<text x="22" y="' + (y + 24) + '" font-size="15" font-weight="800" fill="currentColor">' + r.t + '</text>';
    s += '<text x="278" y="' + (y + 24) + '" text-anchor="end" font-size="15" font-weight="800" fill="' + AC + '">' + r.a + '</text>';
    s += '<text x="22" y="' + (y + 42) + '" font-size="10" fill="currentColor">' + r.note + '</text>';
    y += 56;
  });
  return s + '</svg>';
}

window.CONCEPT = {
  progKey: 'chinese_literature_map_v1', practiceHref: 'chinese_advanced.html',
  lessons: [
   { id: 'genre', name: '文學大分類：韻文・散文・小說戲劇', emoji: '🗂️', color: '#b91c1c', sub: '押韻＝韻文、像說話＝散文、有情節＝小說戲劇',
     done: '記得：押韻、有節奏＝韻文（詩、詞、曲）；不押韻、像說話的文章＝散文；有人物、有情節＝小說戲劇。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '文學作品的三大分類', svg: genreTree(),
        text: '文學作品大致分三類。<b>韻文</b>：押韻、有節奏，像<b>詩、詞、曲</b>；<b>散文</b>：不押韻、像平常說話的文章，像記敘、抒情；<b>小說戲劇</b>：有<b>人物、有情節</b>，像故事和劇本。' },
      { type: 'teach', kicker: '怎麼判斷', title: '問兩個問題就能分類', svg: genreDecide(),
        text: '拿到一篇作品，先問：<b>它押韻、有節奏嗎？</b>有，就是<b>韻文</b>。沒有，再問：<b>它有人物、有情節嗎？</b>有，就是<b>小說戲劇</b>；沒有，多半就是<b>散文</b>。' },
      { type: 'quiz', kicker: '換你試試', title: '〈靜夜思〉這類押韻、有節奏的作品屬於？', options: ['韻文', '散文', '小說', '新聞報導'], answer: 0, why: '詩有押韻與節奏，屬於韻文；韻文還包括詞和曲。' },
      { type: 'quiz', kicker: '想一想', title: '有人物、有情節，通常篇幅較長的作品是？', options: ['小說', '散文', '詩', '日記'], answer: 0, why: '小說以人物和情節取勝，是敘事文學，和戲劇同屬小說戲劇這一類。' }
     ] },
   { id: 'era', name: '時代文學地圖：唐詩・宋詞・元曲・明清小說', emoji: '🗺️', color: '#cf1322', sub: '詩經→楚辭→漢賦→唐詩→宋詞→元曲→明清小說',
     done: '記得這條時間軸：先秦《詩經》→戰國楚辭→漢賦→唐詩→宋詞→元曲→明清小說——朝代配文體。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '一條文學時間軸', svg: eraTimeline(),
        text: '不同時代有最具代表性的文學：最早的<b>《詩經》</b>（先秦，最早的詩歌總集）→戰國<b>楚辭</b>→<b>漢賦</b>→<b>唐詩</b>→<b>宋詞</b>→<b>元曲</b>→<b>明清小說</b>。順著時間走一遍，就有了整張地圖。' },
      { type: 'teach', kicker: '記重點', title: '朝代配文體：核心四組', svg: eraMatch(),
        text: '最常考、最好記的四組對應：<b>唐詩、宋詞、元曲、明清小說</b>——詞在<b>宋代</b>最興盛（宋詞）、曲在<b>元代</b>最興盛（元曲）。把「朝代＋代表文體」綁在一起背最省力。' },
      { type: 'quiz', kicker: '換你試試', title: '「詞」最興盛、最具代表的朝代是？', options: ['唐', '宋', '元', '明'], answer: 1, why: '詞在宋代發展得最興盛、最具代表，所以稱「宋詞」。' },
      { type: 'quiz', kicker: '想一想', title: '元代最具代表的文學形式是？', options: ['唐詩', '宋詞', '元曲', '漢賦'], answer: 2, why: '元代以散曲、雜劇（合稱元曲）為代表文學形式。' }
     ] },
   { id: 'poets', name: '唐詩雙星：詩仙李白、詩聖杜甫', emoji: '🌟', color: '#dc2626', sub: '李白＝詩仙（浪漫）、杜甫＝詩聖（寫實）',
     done: '記得：李白＝詩仙，風格飄逸浪漫、想像奔放；杜甫＝詩聖，寫實沉鬱、關懷社會。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '詩仙李白 vs 詩聖杜甫', svg: poetStars(),
        text: '唐詩有兩顆巨星。<b>李白</b>號「<b>詩仙</b>」，風格<b>飄逸浪漫、想像奔放</b>；<b>杜甫</b>號「<b>詩聖</b>」，詩<b>寫實沉鬱、關懷社會</b>。一個像天上的仙氣，一個像人間的真情。' },
      { type: 'teach', kicker: '怎麼判斷', title: '讀到這種風格，多半是誰', svg: poetDecide(),
        text: '讀一首唐詩時，<b>想像奔放、飄逸浪漫</b>的，多半是<b>李白</b>；<b>寫實沉鬱、關懷民生社會</b>的，多半是<b>杜甫</b>。抓住「仙氣／真情」這組對比就不容易弄混。' },
      { type: 'quiz', kicker: '換你試試', title: '被尊稱為「詩聖」、作品關懷社會民生的是？', options: ['李白', '杜甫', '白居易', '王維'], answer: 1, why: '杜甫詩寫實沉鬱、關懷民生社會，世稱「詩聖」。' },
      { type: 'quiz', kicker: '想一想', title: '「詩仙」李白的詩風偏向？', options: ['飄逸浪漫、想像豐富', '寫實沉鬱、關懷民生', '嚴守格律、句句推敲', '平淡質樸、田園隱逸'], answer: 0, why: '李白詩想像奔放、飄逸浪漫，故稱「詩仙」；寫實關懷民生的是杜甫。' }
     ] },
   { id: 'classics', name: '四大名著', emoji: '📚', color: '#e11d48', sub: '三國・水滸・西遊・紅樓（明清章回小說）',
     done: '記得：四大名著＝《三國演義》《水滸傳》《西遊記》《紅樓夢》，都是明清時期的章回小說。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '四大名著與作者', svg: fourClassics(),
        text: '<b>《三國演義》</b>（羅貫中）、<b>《水滸傳》</b>（相傳施耐庵，一說與羅貫中合著）、<b>《西遊記》</b>（相傳吳承恩）、<b>《紅樓夢》</b>（曹雪芹著，後四十回一般認為高鶚續補）。作者歸屬採學界通說，部分為「相傳」。' },
      { type: 'teach', kicker: '順便複習書名號', title: '書名配作者，依序點亮', svg: animCanvas(360, 240, '四大名著書名《三國演義》《水滸傳》《西遊記》《紅樓夢》依序點亮，各配上作者'),
        mount: function (host: HTMLElement) {
          var h = (window as any).Anim.textHighlight(host, {
            title: '四大名著配作者',
            tokens: [
              { t: '四大名著：', },
              { t: '《三國演義》', hl: true, label: '羅貫中' },
              { t: '、' },
              { t: '《水滸傳》', hl: true, label: '施耐庵' },
              { t: '、' },
              { t: '《西遊記》', hl: true, label: '吳承恩' },
              { t: '、' },
              { t: '《紅樓夢》', hl: true, label: '曹雪芹' }
            ],
            caption: '書名一律用《》號；四部明清章回小說依序亮起，配上作者'
          });
          return function () { h.stop(); };
        },
        text: '書名要用<b>書名號《》</b>。四部名著都是<b>明清</b>時期的<b>章回小說</b>——看著書名依序亮起、配上作者，記住「書名＋作者」的配對。' },
      { type: 'quiz', kicker: '換你試試', title: '《西遊記》的作者是？', options: ['羅貫中', '施耐庵', '吳承恩', '曹雪芹'], answer: 2, why: '《西遊記》相傳為吳承恩所著；羅貫中著《三國演義》、施耐庵著《水滸傳》、曹雪芹著《紅樓夢》。' },
      { type: 'quiz', kicker: '想一想', title: '下列哪一部是「四大名著」之一？', options: ['《紅樓夢》', '《背影》', '《論語》', '《詩經》'], answer: 0, why: '四大名著為《三國演義》《水滸傳》《西遊記》《紅樓夢》；《背影》是散文、《論語》是語錄、《詩經》是詩歌總集。' }
     ] }
  ]
};

})();
