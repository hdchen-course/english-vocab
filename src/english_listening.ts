/* =====================================================================
 * english_listening.ts  →  (tsc, tsconfig.legacy.json) →  english_listening.js
 * 「延伸聽力：聽短文回答問題」教學頁的資料與音訊控制。
 *   每個 lesson＝一篇短文：第一個 teach step＝聽短文（波形視覺 + 播放鈕 + 可選字幕），
 *   其後 2–4 個 quiz step＝理解題（主旨／細節／推論）。複用 concept_engine 的 teach/quiz 引擎
 *   （window.CONCEPT），不重寫 bespoke 引擎。
 *   音訊：mirror english_speaking 的音訊按鈕——頁面層 helper 以 new Audio('audio/lis_<slug>.mp3')
 *   播放整篇短文（edge-tts en-US-AnaNeural 童聲，一篇一個 mp3）。播放與「顯示字幕」皆用
 *   document 層事件委派（data-lis-play / data-lis-caption），因 quiz step 無 mount 掛點。
 *   以 IIFE 包住讓 helper 為檔案區域（避免與其他已遷移頁同名頂層 helper 的全域型別衝突）。
 * ===================================================================== */
/* eslint-disable */
(function () {
  'use strict';

  var AC = '#0d9488';

  // 短文朗讀檔名 slug：lower、[^a-z0-9]+→_、修去頭尾 _。檔名＝lis_<slug>.mp3（整篇一個 mp3）。
  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }
  function audioFile(title) { return 'lis_' + slug(title) + '.mp3'; }

  // 裝飾用音訊波形（currentColor，隨 --su 與日夜模式變色；純視覺，aria-hidden）。
  function waveSvg() {
    var hs = [6, 14, 10, 20, 28, 18, 24, 12, 30, 16, 22, 34, 20, 26, 14, 30, 18, 24, 10, 28, 16, 22, 12, 20, 8, 16];
    var w = 8, gap = 4, pad = 6, max = 40, H = 56;
    var total = pad * 2 + hs.length * (w + gap) - gap;
    var s = '<svg viewBox="0 0 ' + total + ' ' + H + '" width="100%" height="56" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">';
    var x = pad;
    for (var i = 0; i < hs.length; i++) {
      var h = Math.min(max, hs[i]);
      var y = (H - h) / 2;
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3" fill="currentColor" fill-opacity="' + (0.35 + (h / max) * 0.45).toFixed(2) + '"/>';
      x += w + gap;
    }
    return s + '</svg>';
  }

  // teach step 的「聽短文」面板：波形 + 播放鈕 + 顯示字幕（字幕預設隱藏，練真聽力）。
  function listenPanel(file, capId, lines) {
    var caps = lines.map(function (l) { return '• ' + l; }).join('<br>');
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:12px">'
      + '<div style="width:100%;color:' + AC + '">' + waveSvg() + '</div>'
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">'
      + '<button type="button" class="btn btn-secondary" data-lis-play="' + file + '">🔊 播放短文</button>'
      + '<button type="button" class="btn btn-secondary" data-lis-caption="' + capId + '" aria-expanded="false" aria-controls="' + capId + '">👁️ 顯示字幕</button>'
      + '</div>'
      + '<div id="' + capId + '" style="display:none;width:100%;text-align:left;line-height:1.8">' + caps + '</div>'
      + '</div>';
  }

  // 每題上方的「再聽一次」小鈕（quiz step 用，放進 eq 區；同樣走事件委派）。
  function replayBtn(file) {
    return '<button type="button" class="btn btn-secondary" data-lis-play="' + file + '">🔊 再聽一次</button>';
  }

  // ---- 短文資料（transcript 分句 = captions = mp3 朗讀內容，byte-exact）----
  // 每課：title（決定檔名 slug）、captions（分句）、listen step 導引、quiz（主旨/細節/推論）。
  var PASSAGES = [
    {
      id: 'weekend', emoji: '🏞️', color: '#0d9488',
      title: 'My Weekend',
      name: '週末日常：My Weekend',
      sub: '日常短文・先聽再答（主旨＋細節）',
      done: '聽懂一整段了！抓住「做了什麼、為什麼」。',
      lines: [
        'On Saturday, I went to the park with my family.',
        'We rode bikes and ate sandwiches.',
        'It started to rain in the afternoon, so we went home early.'
      ],
      quiz: [
        { kicker: '細節', title: 'What did the family do at the park?',
          options: ['They rode bikes and ate sandwiches.', 'They watched a movie.', 'They went swimming.'], answer: 0,
          why: '短文說 We rode bikes and ate sandwiches。',
          whyWrong: { 1: '短文沒有提到看電影。', 2: '短文沒有提到游泳。' } },
        { kicker: '細節・因果', title: 'Why did they go home early?',
          options: ['Because it started to rain.', 'Because they were hungry.', 'Because it got dark.'], answer: 0,
          why: '短文說 It started to rain in the afternoon, so we went home early。',
          whyWrong: { 1: '短文沒說他們肚子餓。', 2: '是因為下雨，不是天黑。' } },
        { kicker: '主旨', title: 'What is the passage mainly about?',
          options: ['A family day out.', 'A school lesson.', 'A birthday party.'], answer: 0,
          why: '整段在講週六和家人出門去公園的一天。',
          whyWrong: { 1: '短文和上課無關。', 2: '短文沒有提到生日派對。' } }
      ]
    },
    {
      id: 'announce', emoji: '📢', color: '#0891b2',
      title: 'A School Trip Announcement',
      name: '校園廣播：A School Trip Announcement',
      sub: '校園廣播・抓時間地點與指示',
      done: '主旨＋細節都抓到了，聽力更穩了！',
      lines: [
        'Good morning, students.',
        'This is a reminder about our school trip to the science museum this Friday.',
        'Please meet your teacher at the main gate at eight o\'clock.',
        'The buses will leave at eight fifteen, so do not be late.',
        'Remember to bring your lunch, a water bottle, and a jacket, because the museum can be cold.',
        'We will be back at school by four in the afternoon.'
      ],
      quiz: [
        { kicker: '主旨', title: 'What is this announcement mainly about?',
          options: ['A school trip this Friday.', 'A lost dog.', 'A weather report.'], answer: 0,
          why: '整段都在講這週五的校外教學時間、集合與要帶的東西。',
          whyWrong: { 1: '短文沒提到走失的狗。', 2: '短文不是氣象報告。' } },
        { kicker: '細節・地點', title: 'Where should students meet?',
          options: ['At the main gate.', 'In the library.', 'On the bus.'], answer: 0,
          why: '短文說 meet your teacher at the main gate。',
          whyWrong: { 1: '短文沒提到圖書館。', 2: '學生是在校門口集合，不是在車上。' } },
        { kicker: '細節・時間', title: 'What time will the buses leave?',
          options: ['At eight fifteen.', 'At eight o\'clock.', 'At four.'], answer: 0,
          why: '短文說 The buses will leave at eight fifteen；八點是集合時間，不是發車時間。',
          whyWrong: { 1: '八點（eight o\'clock）是集合時間，不是發車時間。', 2: '四點是回到學校的時間。' } },
        { kicker: '細節・指示', title: 'Why should students bring a jacket?',
          options: ['Because the museum can be cold.', 'Because it will rain.', 'Because it is a long walk.'], answer: 0,
          why: '短文說 bring a jacket, because the museum can be cold。',
          whyWrong: { 1: '短文沒說會下雨。', 2: '短文沒提到路程很遠。' } }
      ]
    },
    {
      id: 'concert', emoji: '🎹', color: '#0e7490',
      title: 'Ben\'s Concert',
      name: '小故事：Ben\'s Concert',
      sub: '小故事・推論角色的心情',
      done: '連「沒明講的感覺」都聽得出來，聽力到位了！',
      lines: [
        'Ben had been practicing the piano for months.',
        'Every day after school, he played the same difficult song again and again.',
        'Sometimes his fingers hurt, and sometimes he wanted to give up.',
        'On the day of the school concert, his hands were shaking as he walked onto the stage.',
        'He took a deep breath and began to play.',
        'When he finished, the whole room was clapping.',
        'Ben looked at his parents and smiled.'
      ],
      quiz: [
        { kicker: '推論・心情', title: 'How did Ben probably feel at the end?',
          options: ['Proud and happy.', 'Bored.', 'Angry.'], answer: 0,
          why: '他練了好幾個月、演奏完全場鼓掌、他看著父母微笑——雖沒明講，可推論出驕傲又開心。',
          whyWrong: { 1: '全場鼓掌、他微笑，不像覺得無聊。', 2: '沒有任何生氣的線索。' } },
        { kicker: '細節', title: 'What did Ben do every day after school?',
          options: ['He practiced the same piano song.', 'He played with his dog.', 'He watched TV.'], answer: 0,
          why: '短文說 Every day after school, he played the same difficult song again and again。',
          whyWrong: { 1: '短文沒提到狗。', 2: '短文沒提到看電視。' } },
        { kicker: '推論・掙扎', title: 'Was learning the song easy for Ben?',
          options: ['No — sometimes he wanted to give up.', 'Yes — it was always easy.', 'He never practiced.'], answer: 0,
          why: '短文說 his fingers hurt, and sometimes he wanted to give up，可推論過程並不輕鬆。',
          whyWrong: { 1: '手指會痛、有時想放棄，過程並不輕鬆。', 2: '相反，他每天放學都在練。' } }
      ]
    },
    {
      id: 'newstudent', emoji: '🧑‍🏫', color: '#0d9488',
      title: 'A New Student',
      name: '校園故事：A New Student',
      sub: '校園故事・細節＋推論＋主旨',
      done: '聽出重點，也讀懂了角色的心情——聽力更進一步了！',
      lines: [
        'Last week, a new student named Maya joined our class.',
        'She was a little shy at first and sat quietly in the corner.',
        'During lunch, I asked her to sit with us.',
        'We talked about music and found out we both love the same band.',
        'Now Maya and I eat lunch together every day.'
      ],
      quiz: [
        { kicker: '細節', title: 'Where did Maya sit at first?',
          options: ['In the corner.', 'Next to the teacher.', 'By the window.'], answer: 0,
          why: '短文說 sat quietly in the corner。',
          whyWrong: { 1: '短文沒提到老師旁邊。', 2: '短文沒提到窗邊。' } },
        { kicker: '推論・心情', title: 'How did Maya probably feel on her first day?',
          options: ['Nervous and shy.', 'Angry.', 'Excited to perform.'], answer: 0,
          why: '短文說 She was a little shy at first and sat quietly——可推論她緊張、害羞。',
          whyWrong: { 1: '沒有任何生氣的線索。', 2: '短文沒提到表演。' } },
        { kicker: '主旨', title: 'What is the passage mainly about?',
          options: ['Making friends with a new student.', 'A music concert.', 'A lunch menu.'], answer: 0,
          why: '整段在講和新同學 Maya 慢慢成為朋友。',
          whyWrong: { 1: '他們只是聊到喜歡同一個樂團，不是去聽演唱會。', 2: '短文沒有列出午餐菜單。' } }
      ]
    }
  ];

  // ---- 由短文資料組出 window.CONCEPT（listen teach step + 理解題 quiz steps）----
  var lessons = PASSAGES.map(function (p) {
    var file = audioFile(p.title);
    var capId = 'lis-cap-' + p.id;
    var steps = [];
    steps.push({
      type: 'teach', kicker: '先聽一遍', title: '🎧 聽短文：' + p.title,
      svg: listenPanel(file, capId, p.lines),
      text: '先按 <b>🔊 播放短文</b>，仔細聽一遍（想聽幾次都可以）。先用<b>耳朵</b>聽懂整段，想對照文字時再按 <b>顯示字幕</b> 檢查。聽完按「繼續」回答問題；作答時也可以隨時 <b>🔊 再聽一次</b>。'
    });
    p.quiz.forEach(function (q) {
      steps.push({
        type: 'quiz', kicker: '聽力理解・' + q.kicker, title: q.title,
        eq: replayBtn(file),
        options: q.options, answer: q.answer, why: q.why, whyWrong: q.whyWrong
      });
    });
    return { id: p.id, name: p.name, emoji: p.emoji, color: p.color, sub: p.sub, done: p.done, steps: steps };
  });

  window.CONCEPT = {
    progKey: 'english_listening_v1',
    practiceHref: 'english_sense.html',
    lessons: lessons
  };

  // ---- 音訊播放 + 字幕揭露（document 層事件委派；quiz step 無 mount 掛點，故用委派）----
  var curAudio = null;
  function stopAudio() { if (curAudio) { try { curAudio.pause(); } catch (e) {} curAudio = null; } }
  function playLis(file) {
    stopAudio();
    var a = new Audio('audio/' + file);
    curAudio = a;
    var pr = a.play(); if (pr && pr.catch) pr.catch(function () {});
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target as any;
    if (!t || !t.closest) return;
    var pb = t.closest('[data-lis-play]');
    if (pb) { playLis(pb.getAttribute('data-lis-play')); return; }
    var cb = t.closest('[data-lis-caption]');
    if (cb) {
      var box = document.getElementById(cb.getAttribute('data-lis-caption'));
      if (box) {
        var showIt = (box.style.display === 'none' || box.style.display === '');
        box.style.display = showIt ? 'block' : 'none';
        cb.setAttribute('aria-expanded', showIt ? 'true' : 'false');
        cb.textContent = showIt ? '🙈 隱藏字幕' : '👁️ 顯示字幕';
      }
      return;
    }
  });
  window.addEventListener('pagehide', stopAudio);
  window.addEventListener('beforeunload', stopAudio);
})();
