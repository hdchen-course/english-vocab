/* =====================================================================
 * concept_engine.ts  →  (tsc, tsconfig.legacy.json) →  concept_engine.js
 *   共用「教學頁（教一小段 → 馬上練習）」引擎。
 *   頁面提供 window.CONCEPT = {
 *     progKey: 'xxx_concepts_v1',         // 獨立 localStorage key（純本地、不餵主 XP）
 *     lessons: [ { id, name, emoji, color, sub, steps: [
 *        { type:'teach', kicker, title, svg, text },        // svg 為 HTML 字串（頁面自備 SVG helper 產生）
 *        { type:'quiz',  kicker, title, svg?, eq?, options:[..], answer:0-based, why }
 *     ] } ]
 *   }
 *   DOM 需求：#screen-menu #screen-play #lesson-list #stage #prog #play-title #btn-back #hello
 *   對錯以邊框 + ✅/❌ + 文字回饋（文字用 --ink）；答錯不罰、可前進；只用 Game.showToast。
 *   型別見 src/types/globals.d.ts（ConceptConfig / ConceptLesson / ConceptLessonStep）。
 * =================================================================== */
(function () {
  'use strict';
  var C = window.CONCEPT || { progKey: 'concepts_v1', lessons: [] };
  function toast(m: string) { try { if (window.Game && window.Game.showToast) window.Game.showToast(m, 'info'); } catch (e) {} }
  function load() { var p = null; try { p = JSON.parse(localStorage.getItem(C.progKey) as string); } catch (e) {} return (p && typeof p === 'object') ? p : {}; }
  function save(p: any) { try { localStorage.setItem(C.progKey, JSON.stringify(p)); } catch (e) {} }
  var prog = load();

  var $ = function (id: string) { return document.getElementById(id); };
  var screenMenu = $('screen-menu'), screenPlay = $('screen-play'), stage = $('stage'),
      progEl = $('prog'), playTitle = $('play-title'), list = $('lesson-list');
  var cur: any = null, idx = 0, answered = false, curCleanup: any = null;
  // 動畫 teach 步驟（step.mount）回傳的清理控制；換頁/離場前務必呼叫，
  // 以取消 requestAnimationFrame、移除事件監聽與重播鈕（向下相容：沒有 mount 的既有 lesson 完全不受影響）。
  // 接受兩種回傳：清理「函式」，或 window.Anim 場景的 { stop } 物件（既有頁 mount 多半 `return window.Anim.x(host)`，
  // 回傳的是 {stop} 物件而非函式——先前只呼叫函式型，導致場景的 rAF 永遠沒被 stop()；此處一併支援）。
  function runCleanup() {
    var c = curCleanup;
    curCleanup = null;
    try {
      if (typeof c === 'function') c();
      else if (c && typeof c.stop === 'function') c.stop();
    } catch (e) {}
  }

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
  function show(sc: HTMLElement) { screenMenu.classList.remove('active'); screenPlay.classList.remove('active'); sc.classList.add('active'); window.scrollTo(0, 0); }
  function startLesson(ls: any) { cur = ls; idx = 0; playTitle.textContent = ls.emoji + ' ' + ls.name; show(screenPlay); render(); }
  function renderProg() { var h = ''; for (var i = 0; i < cur.steps.length; i++) h += '<i class="' + (i < idx ? 'done' : (i === idx ? 'cur' : '')) + '"></i>'; progEl.innerHTML = h; }

  function render() {
    runCleanup();
    renderProg(); answered = false; var s = cur.steps[idx];
    if (s.type === 'teach') {
      stage.innerHTML =
        '<div class="cn-card"><div class="cn-teach-emoji" aria-hidden="true">' + (cur.emoji || '📘') + '</div><h2 class="cn-h">' + s.title + '</h2>' +
        (s.svg ? '<div class="cn-svg">' + s.svg + '</div>' : '') +
        '<div class="cn-block"><div class="cn-block-label">' + s.kicker + '</div><p class="cn-text">' + s.text + '</p></div></div>' +
        '<div class="cn-actions"><button type="button" class="btn btn-primary btn-block" id="next">繼續 ➡️</button></div>';
      // 選用：動畫 teach 步驟。step.mount(host) 收 .cn-svg 容器、回傳清理函式。
      if (typeof s.mount === 'function') {
        var host = stage.querySelector('.cn-svg');
        if (host) { try { curCleanup = s.mount(host); } catch (e) { curCleanup = null; } }
      }
      $('next')!.addEventListener('click', advance);
    } else {
      var order = s.options.map(function (_: any, i: number) { return i; });
      for (var m = order.length - 1; m > 0; m--) { var r = Math.floor(Math.random() * (m + 1)); var t = order[m]; order[m] = order[r]; order[r] = t; }
      var opts = ''; order.forEach(function (oi: number) { opts += '<button type="button" class="cn-opt" data-i="' + oi + '">' + s.options[oi] + '</button>'; });
      stage.innerHTML =
        '<div class="cn-card"><span class="cn-kicker quiz">✏️ ' + s.kicker + '</span><h2 class="cn-h">' + s.title + '</h2>' +
        (s.svg ? '<div class="cn-svg" role="img" aria-label="題目圖">' + s.svg.replace(/aria-label="[^"]*"/, 'aria-label="題目圖"') + '</div>' : '') +
        (s.eq ? '<div class="cn-eq">' + s.eq + '</div>' : '') +
        '<div class="cn-options">' + opts + '</div><div class="cn-reveal" id="rev"></div></div>' +
        '<div class="cn-actions" id="after" style="display:none"><button type="button" class="btn btn-primary btn-block" id="next">繼續 ➡️</button></div>';
      stage.querySelectorAll('.cn-opt').forEach(function (btn) {
        btn.addEventListener('click', function (this: HTMLElement) {
          if (answered) return; answered = true;
          try { if (window.Game && typeof window.Game.pingActive === 'function') window.Game.pingActive(); } catch (e) {}  // 觀念頁純學習不發 XP，但答題＝當日有學習，維持每日連續 streak（只續火焰、不計分）
          var i = parseInt(this.getAttribute('data-i') as string, 10), ok = (i === s.answer);
          this.classList.add(ok ? 'correct' : 'wrong');
          this.insertAdjacentText('beforeend', ok ? '  ✅' : '  ❌');
          if (!ok) { var cb = stage.querySelector('.cn-opt[data-i="' + s.answer + '"]'); if (cb) { cb.classList.add('correct'); cb.insertAdjacentText('beforeend', '  ✅'); } }
          stage.querySelectorAll('.cn-opt').forEach(function (x) { (x as HTMLButtonElement).disabled = true; });
          // 答錯針對性回饋：若該選項有 whyWrong[i] 就先給對症說明，再接上一般 why（向下相容：沒有就維持原行為）
          var _wrongMsg = (!ok && s.whyWrong && s.whyWrong[i]) ? (s.whyWrong[i] + ' ') : '';
          var rev = $('rev')!; rev.textContent = (ok ? '答對了！' : (s.svg ? '沒關係，再看一次上面的圖～' : '沒關係，再想一想～')) + _wrongMsg + s.why; rev.classList.add('show');
          $('after')!.style.display = 'flex';
          toast(ok ? '很好，抓到訣竅了！' : (s.svg ? '再想想剛剛的圖 💪' : '再想一想，你可以的 💪'));
        });
      });
      $('next')!.addEventListener('click', advance);
    }
    window.scrollTo(0, 0);
  }
  function advance() { idx++; if (idx >= cur.steps.length) finish(); else render(); }
  function finish() {
    runCleanup();
    prog[cur.id] = true; save(prog); renderProg();
    var practiceCta = C.practiceHref
      ? '<a class="btn btn-primary" href="' + C.practiceHref + '">去多練幾題 ➡️</a>'
      : '';
    stage.innerHTML =
      '<div class="cn-card" style="text-align:center"><div style="font-size:60px">🎉</div>' +
      '<h2 class="cn-h">你學會「' + cur.name + '」了！</h2>' +
      '<p class="cn-text" style="text-align:center">' + (cur.done || '用圖來想，是不是清楚多了？下次遇到就會囉。') + '</p></div>' +
      '<div class="cn-actions"><button type="button" class="btn" id="menu">回到觀念選單</button>' + practiceCta + '</div>';
    $('menu')!.addEventListener('click', goMenu);
    toast('學會「' + cur.name + '」了，太棒了！');
  }
  function goMenu() { runCleanup(); cur = null; progEl.innerHTML = ''; renderMenu(); show(screenMenu); }
  $('btn-back')!.addEventListener('click', goMenu);
  renderMenu();
})();
