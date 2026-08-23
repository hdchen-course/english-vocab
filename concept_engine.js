/* =====================================================================
 * concept_engine.js — 共用「教學頁（教一小段 → 馬上練習）」引擎。
 *   頁面提供 window.CONCEPT = {
 *     progKey: 'xxx_concepts_v1',         // 獨立 localStorage key（純本地、不餵主 XP）
 *     lessons: [ { id, name, emoji, color, sub, steps: [
 *        { type:'teach', kicker, title, svg, text },        // svg 為 HTML 字串（頁面自備 SVG helper 產生）
 *        { type:'quiz',  kicker, title, svg?, eq?, options:[..], answer:0-based, why }
 *     ] } ]
 *   }
 *   DOM 需求：#screen-menu #screen-play #lesson-list #stage #prog #play-title #btn-back #hello
 *   對錯以邊框 + ✅/❌ + 文字回饋（文字用 --ink）；答錯不罰、可前進；只用 Game.showToast。
 * =================================================================== */
(function () {
  'use strict';
  var C = window.CONCEPT || { progKey: 'concepts_v1', lessons: [] };
  function toast(m) { try { if (window.Game && Game.showToast) Game.showToast(m, 'info'); } catch (e) {} }
  function load() { var p = null; try { p = JSON.parse(localStorage.getItem(C.progKey)); } catch (e) {} return (p && typeof p === 'object') ? p : {}; }
  function save(p) { try { localStorage.setItem(C.progKey, JSON.stringify(p)); } catch (e) {} }
  var prog = load();

  var $ = function (id) { return document.getElementById(id); };
  var screenMenu = $('screen-menu'), screenPlay = $('screen-play'), stage = $('stage'),
      progEl = $('prog'), playTitle = $('play-title'), list = $('lesson-list');
  var cur = null, idx = 0, answered = false;

  function renderMenu() {
    var done = 0;
    C.lessons.forEach(function (ls) { if (prog[ls.id]) done++; });
    var helloEl = $('hello');
    if (helloEl && done > 0) helloEl.textContent = (done >= C.lessons.length)
      ? '所有觀念都學過了！隨時可以回來複習 🎉'
      : '你已經學會 ' + done + ' 個觀念了，繼續加油！';
    list.innerHTML = '';
    C.lessons.forEach(function (ls) {
      var d = prog[ls.id];
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'cn-lesson'; b.setAttribute('aria-label', '觀念：' + ls.name);
      b.innerHTML =
        '<div class="cn-lesson-top"><span class="cn-lesson-emoji" aria-hidden="true" style="background:' + ls.color + '22;color:' + ls.color + '">' + ls.emoji + '</span>' +
        '<div><div class="cn-lesson-name">' + ls.name + '</div><div class="cn-lesson-sub">' + (ls.sub || '') + '</div></div></div>' +
        '<div class="cn-lesson-foot ' + (d ? 'done' : 'todo') + '">' + (d ? '✅ 學過了（隨時可複習）' : '▶️ 開始學') + '</div>';
      b.addEventListener('click', function () { startLesson(ls); });
      list.appendChild(b);
    });
  }
  function show(sc) { screenMenu.classList.remove('active'); screenPlay.classList.remove('active'); sc.classList.add('active'); window.scrollTo(0, 0); }
  function startLesson(ls) { cur = ls; idx = 0; playTitle.textContent = ls.emoji + ' ' + ls.name; show(screenPlay); render(); }
  function renderProg() { var h = ''; for (var i = 0; i < cur.steps.length; i++) h += '<i class="' + (i < idx ? 'done' : (i === idx ? 'cur' : '')) + '"></i>'; progEl.innerHTML = h; }

  function render() {
    renderProg(); answered = false; var s = cur.steps[idx];
    if (s.type === 'teach') {
      stage.innerHTML =
        '<div class="cn-card"><div class="cn-teach-emoji" aria-hidden="true">' + (cur.emoji || '📘') + '</div><h2 class="cn-h">' + s.title + '</h2>' +
        (s.svg ? '<div class="cn-svg">' + s.svg + '</div>' : '') +
        '<div class="cn-block"><div class="cn-block-label">' + s.kicker + '</div><p class="cn-text">' + s.text + '</p></div></div>' +
        '<div class="cn-actions"><button type="button" class="btn btn-primary btn-block" id="next">繼續 ➡️</button></div>';
      $('next').addEventListener('click', advance);
    } else {
      var order = s.options.map(function (_, i) { return i; });
      for (var m = order.length - 1; m > 0; m--) { var r = Math.floor(Math.random() * (m + 1)); var t = order[m]; order[m] = order[r]; order[r] = t; }
      var opts = ''; order.forEach(function (oi) { opts += '<button type="button" class="cn-opt" data-i="' + oi + '">' + s.options[oi] + '</button>'; });
      stage.innerHTML =
        '<div class="cn-card"><span class="cn-kicker quiz">✏️ ' + s.kicker + '</span><h2 class="cn-h">' + s.title + '</h2>' +
        (s.svg ? '<div class="cn-svg" role="img" aria-label="題目圖">' + s.svg.replace(/aria-label="[^"]*"/, 'aria-label="題目圖"') + '</div>' : '') +
        (s.eq ? '<div class="cn-eq">' + s.eq + '</div>' : '') +
        '<div class="cn-options">' + opts + '</div><div class="cn-reveal" id="rev"></div></div>' +
        '<div class="cn-actions" id="after" style="display:none"><button type="button" class="btn btn-primary btn-block" id="next">繼續 ➡️</button></div>';
      stage.querySelectorAll('.cn-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (answered) return; answered = true;
          try { if (window.Game && typeof Game.pingActive === 'function') Game.pingActive(); } catch (e) {}  // 觀念頁純學習不發 XP，但答題＝當日有學習，維持每日連續 streak（只續火焰、不計分）
          var i = parseInt(this.getAttribute('data-i'), 10), ok = (i === s.answer);
          this.classList.add(ok ? 'correct' : 'wrong');
          this.insertAdjacentText('beforeend', ok ? '  ✅' : '  ❌');
          if (!ok) { var cb = stage.querySelector('.cn-opt[data-i="' + s.answer + '"]'); if (cb) { cb.classList.add('correct'); cb.insertAdjacentText('beforeend', '  ✅'); } }
          stage.querySelectorAll('.cn-opt').forEach(function (x) { x.disabled = true; });
          // 答錯針對性回饋：若該選項有 whyWrong[i] 就先給對症說明，再接上一般 why（向下相容：沒有就維持原行為）
          var _wrongMsg = (!ok && s.whyWrong && s.whyWrong[i]) ? (s.whyWrong[i] + ' ') : '';
          var rev = $('rev'); rev.textContent = (ok ? '答對了！' : (s.svg ? '沒關係，再看一次上面的圖～' : '沒關係，再想一想～')) + _wrongMsg + s.why; rev.classList.add('show');
          $('after').style.display = 'flex';
          toast(ok ? '很好，抓到訣竅了！' : (s.svg ? '再想想剛剛的圖 💪' : '再想一想，你可以的 💪'));
        });
      });
      $('next').addEventListener('click', advance);
    }
    window.scrollTo(0, 0);
  }
  function advance() { idx++; if (idx >= cur.steps.length) finish(); else render(); }
  function finish() {
    prog[cur.id] = true; save(prog); renderProg();
    var practiceCta = C.practiceHref
      ? '<a class="btn btn-primary" href="' + C.practiceHref + '">去多練幾題 ➡️</a>'
      : '';
    stage.innerHTML =
      '<div class="cn-card" style="text-align:center"><div style="font-size:60px">🎉</div>' +
      '<h2 class="cn-h">你學會「' + cur.name + '」了！</h2>' +
      '<p class="cn-text" style="text-align:center">' + (cur.done || '用圖來想，是不是清楚多了？下次遇到就會囉。') + '</p></div>' +
      '<div class="cn-actions"><button type="button" class="btn" id="menu">回到觀念選單</button>' + practiceCta + '</div>';
    $('menu').addEventListener('click', goMenu);
    toast('學會「' + cur.name + '」了，太棒了！');
  }
  function goMenu() { cur = null; progEl.innerHTML = ''; renderMenu(); show(screenMenu); }
  $('btn-back').addEventListener('click', goMenu);
  renderMenu();
})();
