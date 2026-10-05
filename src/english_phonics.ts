/* =====================================================================
 * english_phonics.ts  →  (tsc, tsconfig.legacy.json) →  english_phonics.js
 *   英文「零起點：字母與自然發音（Phonics）」教學頁的資料與 helper。
 *   走 window.CONCEPT + concept_engine.js（教一小段 → 馬上練習）；動畫 teach step
 *   以 window.Anim.enLetter / enBlend 掛載（anim_core.js 既有共用場景）。
 *   以 IIFE 包住讓 helper 為檔案區域（避免與其他已遷移頁同名頂層 helper 如 animCanvas
 *   在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。載入順序：
 *     game_core.js → english_phonics.js → anim_core.js → concept_engine.js
 *
 *   AUDIO：本頁是唯一有語音的英文觀念頁。edge-tts 童聲（en-US-AnaNeural）無法乾淨
 *   唸出「孤立音素」（/b/ 會唸成字母名 bee），所以語音檔只放「整字／字母名」。
 *   子音／母音的「音」用畫面（嘴型＋聲波）教，🔊 一律播「代表單字」或整字，不播孤立音素。
 *   每個 onPlay(text) 經 playPh 轉成 audio/ph_<slug>.mp3；slug = 小寫、[^a-z0-9]+→_、去頭尾 _。
 * ===================================================================== */
(function () {

// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
// 比照 biology_concepts.ts；尊重 .cn-svg 版面，canvas 給固定邏輯尺寸供 DPR 縮放讀 clientWidth。
function animCanvas(w: number, h: number, label: string): string {
  return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
    'style="max-width:' + w + 'px" ' +
    'role="img" aria-label="' + label + '"></canvas>';
}

// 語音：播預錄 mp3。text 轉 slug 後取 audio/ph_<slug>.mp3（與產生腳本／manifest 一致）。
function playPh(text: string): void {
  try {
    var s = 'ph_' + String(text).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    var p = new Audio('audio/' + s + '.mp3').play();
    if (p && (p as any).catch) { (p as any).catch(function () {}); }
  } catch (e) {}
}
// 題目內嵌的 🔊 鈕用（reuse 既有 btn btn-icon，零新 class）。
(window as any).__phPlay = playPh;
function spk(word: string): string {
  return '<button type="button" class="btn btn-icon" onclick="__phPlay(\'' + word + '\')" ' +
    'aria-label="播放發音">🔊</button>';
}

// 掛載一個 window.Anim 場景並回傳清理函式（stop 對重複呼叫／容器已清空保持安全）。
function mountLetter(cfg: any) {
  return function (host: HTMLElement) {
    var h: any = (window.Anim && typeof (window.Anim as any).enLetter === 'function')
      ? (window.Anim as any).enLetter(host, cfg) : null;
    return function () { try { if (h && typeof h.stop === 'function') h.stop(); } catch (e) {} };
  };
}
function mountBlend(cfg: any) {
  return function (host: HTMLElement) {
    var h: any = (window.Anim && typeof (window.Anim as any).enBlend === 'function')
      ? (window.Anim as any).enBlend(host, cfg) : null;
    return function () { try { if (h && typeof h.stop === 'function') h.stop(); } catch (e) {} };
  };
}

var W = 330, H = 206;

window.CONCEPT = {
  progKey: 'english_phonics_v1', practiceHref: 'english_concepts.html',
  lessons: [

   // ── 1. 字母名字 A–Z（大小寫配對）──────────────────────────────
   { id: 'letters', name: '字母名字 A–Z（大小寫配對）', emoji: '🔤', color: '#0d9488',
     sub: '26 個字母各有名字，也有大寫和小寫兩種樣子',
     done: '26 個字母都認得啦！接下來學它們會發出什麼聲音。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '每個字母都有名字和樣子',
        svg: animCanvas(W, H, '把字母 a 的大寫 A 和小寫 a 由上往下一筆一筆描出來'),
        mount: mountLetter({ letter: 'a', mode: 'trace' }),
        text: '英文有 <b>26 個字母</b>。每個字母都有自己的<b>名字</b>（像 A 唸「ei」），也有兩種樣子：<b>大寫</b>（A）和<b>小寫</b>（a）。看筆尖怎麼把字母描出來。' },
      { type: 'teach', kicker: '記住重點', title: '大寫和小寫是「同一個字母」',
        svg: animCanvas(W, H, '把字母 r 的大寫 R 和小寫 r 由上往下一筆一筆描出來'),
        mount: mountLetter({ letter: 'r', mode: 'trace' }),
        text: '<b>大寫 R</b> 和<b>小寫 r</b> 長得不太一樣，但它們是<b>同一個字母</b>的兩種寫法（R＝r）。句子開頭和名字會用大寫，其他地方多半用小寫。' },
      { type: 'quiz', kicker: '換你試試', title: '哪一個是小寫的 R？',
        options: ['r', 'n', 'f'], answer: 0,
        whyWrong: { 1: 'n 是另一個字母（唸「en」）。', 2: 'f 是另一個字母（唸「ef」）。' },
        why: '大寫 R 和小寫 r 是同一個字母的兩種寫法。' },
      { type: 'quiz', kicker: '想一想', title: '字母 B 的大寫長什麼樣？',
        options: ['B', 'D', 'P'], answer: 0,
        whyWrong: { 1: 'D 只有一個圓肚子，在右邊。', 2: 'P 只有上面一個圓肚子。' },
        why: 'B 有上下兩個圓肚子，所以是 B。' },
      { type: 'quiz', kicker: '想一想', title: 'a 和 A 是什麼關係？',
        options: ['同一個字母的小寫和大寫', '兩個不同的字母', 'a 是字母、A 是數字'], answer: 0,
        why: 'a 和 A 是同一個字母的兩種寫法（小寫 a、大寫 A）。' }
     ] },

   // ── 2. 子音的聲音（consonant sounds）──────────────────────────
   { id: 'consonants', name: '子音的聲音', emoji: '🅱️', color: '#0891b2',
     sub: '字母的「名字」和它「發的音」常常不一樣',
     done: '子音的聲音抓到了！',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '名字 ≠ 發的音',
        svg: animCanvas(W, H, '字母 b 的字形放大，點喇叭聽代表單字 ball 的發音'),
        mount: mountLetter({ grapheme: 'b', mode: 'sound', onPlay: function () { playPh('ball'); } }),
        text: '字母的<b>名字</b>和它<b>發的音</b>常常不一樣：b 的名字唸「bee」，但它發的音是 <b>/b/</b>（嘴巴輕輕一彈），就像 <b>ball</b> 開頭的音。點 🔊 聽 ball。' },
      { type: 'teach', kicker: '一次一個', title: '一次聽一個子音',
        svg: animCanvas(W, H, '字母 m 的字形放大，點喇叭聽代表單字 monkey 的發音'),
        mount: mountLetter({ grapheme: 'm', mode: 'sound', onPlay: function () { playPh('monkey'); } }),
        text: '字母 <b>m</b> 發的音是 <b>/m/</b>（閉著嘴輕輕哼），就像 <b>monkey</b> 開頭的音。學發音時，一次專心聽一個字母的音最清楚。' },
      { type: 'quiz', kicker: '換你試試', title: '聽聽看，開頭是哪個字母的音？',
        eq: spk('monkey') + ' monkey 開頭的聲音 /m/，是哪個字母發的？',
        options: ['m', 'n', 'w'], answer: 0,
        whyWrong: { 1: 'n 發 /n/（舌尖頂上牙齦）。', 2: 'w 發 /w/（嘴巴嘟起來）。' },
        why: 'monkey 開頭是 /m/，由字母 m 發出來。' },
      { type: 'quiz', kicker: '想一想', title: 'dog 開頭的音是哪個字母？',
        eq: spk('dog') + ' dog 開頭的聲音 /d/，是哪個字母？',
        options: ['d', 'b', 'p'], answer: 0,
        whyWrong: { 1: 'b 發 /b/（嘴唇輕彈），是 ball 的開頭。', 2: 'p 發 /p/（嘴唇噴一下氣）。' },
        why: '/d/ 是舌尖輕點上牙齦的音，由字母 d 發出來。' },
      { type: 'quiz', kicker: '想一想', title: '字母的「名字」和「發的音」……',
        options: ['常常不一樣', '永遠一模一樣', '字母沒有名字'], answer: 0,
        why: '字母的名字和它發的音常常不一樣，例如 b 名字唸「bee」、發音是 /b/。' }
     ] },

   // ── 3. 短母音 a e i o u（short vowels）────────────────────────
   { id: 'vowels', name: '短母音 a e i o u', emoji: '🅰️', color: '#0e7490',
     sub: '五個母音各有一個最常見的短音，是每個字的「心臟」',
     done: '五個短母音記起來，就能拼好多字！',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '母音是單字的「心臟」',
        svg: animCanvas(W, H, '字母 a 的字形放大，點喇叭聽代表單字 apple 的發音'),
        mount: mountLetter({ grapheme: 'a', mode: 'sound', onPlay: function () { playPh('apple'); } }),
        text: '英文有五個<b>母音</b>：<b>a e i o u</b>。幾乎每個單字都一定有一個母音，就像單字的「心臟」。a 的短音是 <b>/æ/</b>，就像 <b>apple</b> 開頭。點 🔊 聽 apple。' },
      { type: 'teach', kicker: '五個短音', title: '每個母音的「短音」',
        svg: animCanvas(W, H, '字母 o 的字形放大，點喇叭聽代表單字 octopus 的發音'),
        mount: mountLetter({ grapheme: 'o', mode: 'sound', onPlay: function () { playPh('octopus'); } }),
        text: '五個短母音記住代表字就好：<b>a</b> /æ/ apple、<b>e</b> /ɛ/ egg、<b>i</b> /ɪ/ igloo、<b>o</b> /ɑ/ octopus（像 hot）、<b>u</b> /ʌ/（像 cup）。點 🔊 聽 octopus 的 o。' },
      { type: 'quiz', kicker: '換你試試', title: '聽聽看，開頭的短母音是？',
        eq: spk('egg') + ' egg 開頭的短母音，是哪個字母？',
        options: ['e', 'a', 'i'], answer: 0,
        whyWrong: { 1: 'a 的短音是 /æ/（apple）。', 2: 'i 的短音是 /ɪ/（igloo）。' },
        why: 'egg 開頭是 /ɛ/，是母音 e 的短音。' },
      { type: 'quiz', kicker: '想一想', title: 'sit 中間的短母音是？',
        eq: spk('sit') + ' sit 中間的短母音 /ɪ/，是哪個字母？',
        options: ['i', 'e', 'a'], answer: 0,
        whyWrong: { 1: 'e 的短音是 /ɛ/（egg）。', 2: 'a 的短音是 /æ/（apple）。' },
        why: 'sit 中間的 /ɪ/ 是母音 i 的短音。' },
      { type: 'quiz', kicker: '想一想', title: 'cup 中間的短母音是？',
        eq: spk('cup') + ' cup 中間的短母音，是哪個字母？',
        options: ['u', 'o', 'a'], answer: 0,
        whyWrong: { 1: 'o 的短音像 hot、octopus 裡的 o。', 2: 'a 的短音是 /æ/（apple）。' },
        why: 'cup 中間的 /ʌ/ 是母音 u 的短音。' }
     ] },

   // ── 4. 把音黏起來：CVC 拼讀（blending）────────────────────────
   { id: 'blend', name: '把音黏起來：CVC 拼讀', emoji: '🔗', color: '#0d9488',
     sub: '把子音＋母音＋子音一個接一個黏起來，唸出整個字',
     done: '你會自己拼出新單字了——這就是閱讀的鑰匙！',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '拼讀＝把音「黏」起來',
        svg: animCanvas(W, H, '字母磚 c、a、t 從分開滑到一起，融成 cat，點喇叭連讀整個字'),
        mount: mountBlend({ parts: ['c', 'a', 't'], mode: 'phoneme', onPlay: playPh }),
        text: '<b>拼讀</b>就是把每個字母的音「<b>一個接一個、不要停</b>」黏起來，唸成整個字。<b>c /k/ + a /æ/ + t /t/</b> 黏起來就是 <b>cat</b>。點 🔊 聽拼好的字。' },
      { type: 'teach', kicker: '再練一個', title: '子音＋母音＋子音（CVC）',
        svg: animCanvas(W, H, '字母磚 b、i、g 從分開滑到一起，融成 big，點喇叭連讀整個字'),
        mount: mountBlend({ parts: ['b', 'i', 'g'], mode: 'phoneme', onPlay: playPh }),
        text: '<b>子音＋母音＋子音（CVC）</b>是最好練的三音節奏：<b>b /b/ + i /ɪ/ + g /g/</b> → <b>big</b>。中間一定有一個母音當心臟。點 🔊 聽聽看。' },
      { type: 'quiz', kicker: '換你試試', title: '黏起來是哪個字？',
        eq: 'c /k/ + a /æ/ + t /t/ 黏起來是哪個字？',
        options: ['cat', 'cut', 'kit'], answer: 0,
        whyWrong: { 1: 'cut 中間是 /ʌ/，不是 /æ/。', 2: 'kit 開頭是 /k/ 但中間是 /ɪ/。' },
        why: 'c /k/ + a /æ/ + t /t/ 連起來就是 cat。' },
      { type: 'quiz', kicker: '想一想', title: '黏起來是哪個字？',
        eq: 'b /b/ + i /ɪ/ + g /g/ 黏起來是哪個字？',
        options: ['big', 'bag', 'bug'], answer: 0,
        whyWrong: { 1: 'bag 中間是 /æ/（像 apple）。', 2: 'bug 中間是 /ʌ/（像 cup）。' },
        why: '中間是短音 /ɪ/，所以拼出來是 big。' },
      { type: 'quiz', kicker: '想一想', title: '黏起來是哪個字？',
        eq: 's /s/ + u /ʌ/ + n /n/ 黏起來是哪個字？',
        options: ['sun', 'sin', 'son'], answer: 0,
        whyWrong: { 1: 'sin 中間是 /ɪ/。', 2: 'son 雖然唸起來像，但拼法不是 s-u-n。' },
        why: 's /s/ + u /ʌ/ + n /n/ 連起來就是 sun。' }
     ] },

   // ── 5. 常見字母組合（digraphs / 長母音）──────────────────────
   { id: 'digraphs', name: '常見字母組合 sh · ch · th · ee · oo', emoji: '🧩', color: '#0891b2',
     sub: '有些兩個字母合起來發「一個新音」',
     done: '這些組合超常見，認得它們單字就好讀多了。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '兩個字母，一個新音',
        svg: animCanvas(W, H, '把 sh 當成一塊磚，和 i、p 滑在一起拼成 ship，點喇叭連讀'),
        mount: mountBlend({ parts: ['sh', 'i', 'p'], mode: 'phoneme', onPlay: playPh }),
        text: '有些兩個字母合起來發「<b>一個新音</b>」：<b>sh</b> 發 <b>/ʃ/</b>（像要人安靜的「噓」），不是把 /s/ 和 /h/ 分開唸。拼 ship 時，<b>sh 當成一塊磚</b>：sh-i-p。點 🔊 聽。' },
      { type: 'teach', kicker: '還有這些', title: '長母音 ee、oo 和 ch、th',
        svg: animCanvas(W, H, '把 m、oo、n 滑在一起拼成 moon，點喇叭連讀'),
        mount: mountBlend({ parts: ['m', 'oo', 'n'], mode: 'phoneme', onPlay: playPh }),
        text: '<b>oo</b> 發長音 <b>/uː/</b>（<b>moon</b>）、<b>ee</b> 發長音 <b>/iː/</b>（see）。還有 <b>ch</b> /tʃ/（chair）、<b>th</b> /θ/（think）也是兩個字母發一個音。點 🔊 聽 moon。' },
      { type: 'quiz', kicker: '換你試試', title: 'ship 開頭的 sh 發什麼音？',
        eq: spk('ship') + ' ship 開頭的 sh 發什麼音？',
        options: ['/ʃ/（噓的音）', '/s/ 和 /h/ 分開唸', '/tʃ/'], answer: 0,
        whyWrong: { 1: 'sh 是一個新音，不是把 /s/ 和 /h/ 分開唸。', 2: '/tʃ/ 是 ch 的音（chair）。' },
        why: 'sh 兩個字母合起來發一個新音 /ʃ/，像「噓」。' },
      { type: 'quiz', kicker: '想一想', title: 'see 裡的 ee 發什麼音？',
        options: ['長音 /iː/', '短音 /ɛ/', '兩個 e 分開唸'], answer: 0,
        whyWrong: { 1: '/ɛ/ 是 e 的短音（egg）。', 2: 'ee 合起來只發一個長音，不分開唸。' },
        why: 'ee 兩個字母發一個長音 /iː/，像 see、tree。' },
      { type: 'quiz', kicker: '想一想', title: '哪一個是「兩個字母發一個音」的組合？',
        options: ['sh', 'st', 'br'], answer: 0,
        whyWrong: { 1: 'st 是 /s/ 和 /t/ 兩個音黏在一起（stop）。', 2: 'br 是 /b/ 和 /r/ 兩個音（bread）。' },
        why: 'sh 是兩個字母合發一個新音 /ʃ/；st、br 其實是兩個音黏在一起。' }
     ] },

   // ── 6. 高頻視覺字（sight words）───────────────────────────────
   { id: 'sight', name: '高頻視覺字（the, you, is…）', emoji: '👀', color: '#0e7490',
     sub: '超常用、不完全照拼讀規則的字，看一眼就認得最快',
     done: '字母 → 聲音 → 拼讀 → 常用字，你已經可以開始讀簡單句子了！下一步到「英文句型觀念養成」。',
     steps: [
      { type: 'teach', kicker: '先想一想', title: '有些字看一眼就認得',
        svg: animCanvas(W, H, '常見字閃卡翻入後顯示 the，點喇叭讀整個字'),
        mount: mountLetter({ word: 'the', mode: 'flash', onPlay: playPh }),
        text: '有些超常用的字<b>不完全照拼讀規則</b>，像 <b>the</b>、was、of——與其慢慢拼，不如<b>看一眼就記住整個字</b>最快。點 🔊 聽 the 怎麼唸。' },
      { type: 'teach', kicker: '到處都看得到', title: '常用字到處都是',
        svg: animCanvas(W, H, '常見字閃卡翻入後顯示 you，點喇叭讀整個字'),
        mount: mountLetter({ word: 'you', mode: 'flash', onPlay: playPh }),
        text: '<b>you</b>、is、go、to 這些字在句子裡<b>到處都是</b>。把它們記熟，讀句子就會順很多。點 🔊 聽 you。' },
      { type: 'quiz', kicker: '換你試試', title: '下面哪個是「the」？',
        eq: spk('the') + ' 聽一遍，再選出正確的拼法：',
        options: ['the', 'teh', 'hte'], answer: 0,
        whyWrong: { 1: 'teh 把字母順序弄反了。', 2: 'hte 開頭字母放錯了。' },
        why: '正確拼法是 the（t-h-e）。' },
      { type: 'quiz', kicker: '想一想', title: '聽聽看，是哪個字？',
        eq: spk('you') + ' 剛剛聽到的是哪個字？',
        options: ['you', 'your', 'yes'], answer: 0,
        whyWrong: { 1: 'your 多了結尾的 r 音（「你的」）。', 2: 'yes 結尾是 /s/。' },
        why: '剛剛讀的是 you。' },
      { type: 'quiz', kicker: '想一想', title: '聽聽看，是哪個字？',
        eq: spk('is') + ' 剛剛聽到的是哪個字？',
        options: ['is', 'in', 'it'], answer: 0,
        whyWrong: { 1: 'in 結尾是 /n/。', 2: 'it 結尾是 /t/。' },
        why: '剛剛讀的是 is（結尾是 /z/ 的音）。' }
     ] }
  ]
};

})();
