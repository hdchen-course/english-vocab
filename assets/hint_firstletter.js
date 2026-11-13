/* 共用元件：首字母提示（click-to-reveal）
 * 行為＝單字大師閃卡：預設只顯示虛線按鈕「💡 提示（首字母）」，遮罩隱藏；
 *   點按鈕才揭示遮罩「a _ _」（首字母＋其餘每字母一底線）且按鈕消失（one-way，本卡不再收回）；
 *   換卡（setWord 新字）自動重置回按鈕、遮罩隱藏。
 * 樣式＝共用 .hintfl / .hintfl-btn / .hintfl-show（見 assets/unit.css）。
 * 由 word_master.html（單字大師）與 word_dictation.html（分級聽寫）共用，避免各頁各做一套。
 * 純 vanilla、無相依；掛到 window.HintFirstLetter。 */
(function () {
  // 一次性注入共用樣式（虛線按鈕＝單字大師 .wm-hintbtn；大字綠遮罩＝.wm-hintshow）。
  // 用英語科 token（兩頁皆英語島）：--c-english / --c-english-ink，退回 --accent。
  if (!document.getElementById('hintfl-style')) {
    var st = document.createElement('style');
    st.id = 'hintfl-style';
    st.textContent =
      '.hintfl{text-align:center;}' +
      '.hintfl-btn{border:1px dashed var(--c-english,var(--accent));background:none;' +
      'color:var(--c-english-ink,var(--accent-ink,var(--ink)));border-radius:999px;padding:5px 13px;' +
      'font-size:13px;font-weight:700;cursor:pointer;}' +
      '.hintfl-btn:focus-visible{outline:3px solid var(--c-focus,#2684ff);outline-offset:2px;}' +
      '.hintfl-show{font-size:22px;letter-spacing:.3em;color:var(--c-english-ink,var(--accent-ink,var(--ink)));' +
      'font-weight:800;margin:2px 0 8px;text-align:center;}';
    (document.head || document.documentElement).appendChild(st);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function mask(w) {
    w = String(w || '');
    if (!w) return '';
    return w.charAt(0) + ' ' + Array(Math.max(0, w.length - 1)).fill('_').join(' ');
  }
  // create(hostEl, opts) → { setWord(word), reset() }
  // opts.minLen：字長 ≥ minLen 才顯示提示（預設 3，與單字大師「length>2」一致）。
  function create(host, opts) {
    opts = opts || {};
    var minLen = (typeof opts.minLen === 'number') ? opts.minLen : 3;
    var word = '', revealed = false;
    host.classList.add('hintfl');
    function render() {
      if (!word || word.length < minLen) { host.innerHTML = ''; return; }
      if (revealed) {
        host.innerHTML = '<div class="hintfl-show">' + esc(mask(word)) + '</div>';
      } else {
        host.innerHTML = '<button type="button" class="hintfl-btn">💡 提示（首字母）</button>';
        var b = host.querySelector('.hintfl-btn');
        if (b) b.addEventListener('click', function () { revealed = true; render(); });
      }
    }
    render();
    return {
      setWord: function (w) { word = String(w || ''); revealed = false; render(); },
      reset: function () { revealed = false; render(); },
      el: host
    };
  }
  window.HintFirstLetter = { create: create, mask: mask };
})();
