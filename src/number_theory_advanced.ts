// @ts-nocheck — 機械式 legacy JS→TS 遷移：verbatim 轉檔、行為等價；型別檢查延後
/* =====================================================================
 * number_theory_advanced.ts  →  (tsc) →  number_theory_advanced.js
 * 原為 number_theory_advanced.html 的多個 inline <script> 區塊（連續、同一全域 scope）；
 * 依原順序合併成單一 sibling .js（保留全域 scope 與 onclick 參照、不加 IIFE）。
 * 行為與原 inline 版等價。
 * ===================================================================== */
// ===== Utility Functions =====
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
  document.querySelectorAll('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
  if (event && event.target) event.target.classList.add('active');
}

function showConfetti() {
  var container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);
  var colors = ['#667eea','#f59e0b','#10b981','#ef4444','#a78bfa','#06b6d4','#fbbf24'];
  for (var i = 0; i < 35; i++) {
    var c = document.createElement('div');
    c.className = 'confetti';
    c.style.left = Math.random() * 100 + '%';
    c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = Math.random() * 0.6 + 's';
    c.style.width = (6 + Math.random() * 8) + 'px';
    c.style.height = (6 + Math.random() * 8) + 'px';
    container.appendChild(c);
  }
  setTimeout(function() { container.remove(); }, 2200);
}

function showFeedback(elId, correct, msg, opts) {
  opts = opts || {};
  var el = document.getElementById(elId);
  // 每題只計一次分：此題已顯示過回饋時，連點不再重複記帳（防刷 XP）；載入新題會清空回饋，
  // 故換到新題可再計分（per-題而非 per-元素）。本地徽章 StampBook 不受此限。
  var alreadyAnswered = !!(el && el.querySelector('.feedback'));
  try { if (window.StampBook) StampBook.onFeedback(elId, correct); } catch(e) {}
  if (!alreadyAnswered && window.Game && window.Game.recordAnswer) Game.recordAnswer('math', correct);
  if (correct) {
    el.innerHTML = '<div class="feedback correct">太厲害了！🧠 ' + (msg || '') + '</div>';
    showConfetti();
  } else {
    // 答錯不責備：預設仍用「再想想！」；三個互動小遊戲會傳入 wrongLead 改為與全書一致的
    // 暖心正常化語句，並用 extraHtml 附上「看答案／下一題」出口（見 advExitButtons）。
    var lead = (opts.wrongLead !== undefined) ? opts.wrongLead : '再想想！';
    el.innerHTML = '<div class="feedback wrong">' + lead + (msg || '') + '</div>' + (opts.extraHtml || '');
  }
}

// 全書一致的「無懲罰＋主動揭示」：答錯時給暖心正常化語句，永遠提供出口，
// 連續答錯 2 次後主動揭示正解與一句 why。以下兩個小工具供 mod／費馬／CRT 三個小遊戲共用。
function advExitButtons(revealCall, skipCall) {
  return '<div class="adv-exit" style="display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin-top:10px">' +
    '<button class="game-btn small" onclick="' + revealCall + '">看答案</button>' +
    '<button class="game-btn small" onclick="' + skipCall + '">下一題 →</button>' +
    '</div>';
}
function advReveal(fbId, ansHtml, whyHtml, skipCall) {
  document.getElementById(fbId).innerHTML =
    '<div class="feedback correct adv-revealed" style="animation:none">' +
      '沒關係～再想一想，答錯是學習的一部分！<br>正確答案是 <b>' + ansHtml + '</b>。' +
      (whyHtml ? '<br><span style="font-size:14px; color:var(--ink-soft)">' + whyHtml + '</span>' : '') +
    '</div>' +
    '<div style="display:flex; justify-content:center; margin-top:10px">' +
      '<button class="game-btn small" onclick="' + skipCall + '">下一題 →</button>' +
    '</div>';
}

function gcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }

function modPow(base, exp, mod) {
  var result = 1;
  base = ((base % mod) + mod) % mod;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % mod;
    exp = Math.floor(exp / 2);
    base = (base * base) % mod;
  }
  return result;
}

function eulerPhi(n) {
  var result = n;
  var temp = n;
  for (var p = 2; p * p <= temp; p++) {
    if (temp % p === 0) {
      result -= Math.floor(result / p);
      while (temp % p === 0) temp = Math.floor(temp / p);
    }
  }
  if (temp > 1) result -= Math.floor(result / temp);
  return result;
}

function getFactors(n) {
  var factors = [];
  for (var p = 2; p * p <= n; p++) {
    if (n % p === 0) { factors.push(p); while (n % p === 0) n = Math.floor(n / p); }
  }
  if (n > 1) factors.push(n);
  return factors;
}

// ===== Section 1: GCD Demo =====
var gcdDemoState = { a: 48, b: 18, step: 0, lines: [] };

function gcdDemoReset() {
  gcdDemoState = { a: 48, b: 18, step: 0, lines: [] };
  document.getElementById('gcd-demo').innerHTML = '<span style="color:var(--ink-soft)">按「下一步」觀看 gcd(48, 18) 的計算過程...</span>';
  document.getElementById('bar-a').setAttribute('width', 240);
  document.getElementById('bar-a-text').textContent = '48';
  document.getElementById('bar-b').setAttribute('width', 90);
  document.getElementById('bar-b-text').textContent = '18';
}

function gcdDemoStep() {
  var s = gcdDemoState;
  if (s.b === 0) { gcdDemoReset(); return; }
  var q = Math.floor(s.a / s.b);
  var r = s.a % s.b;
  s.lines.push(s.a + ' ÷ ' + s.b + ' = ' + q + ' ... 餘 ' + r);
  if (r === 0) {
    s.lines.push('✨ 餘數為 0 → gcd = ' + s.b + ' 🎉');
  }
  var html = s.lines.map(function(l, i) {
    return '<div class="step-line' + (i === s.lines.length - 1 ? ' highlight' : '') + '">' + l + '</div>';
  }).join('');
  document.getElementById('gcd-demo').innerHTML = html;
  var maxVal = 48;
  var newA = s.b;
  var newB = r;
  document.getElementById('bar-a').setAttribute('width', Math.max(20, (newA / maxVal) * 260));
  document.getElementById('bar-a-text').textContent = newA;
  document.getElementById('bar-b').setAttribute('width', Math.max(5, (newB / maxVal) * 260));
  document.getElementById('bar-b-text').textContent = newB || '0';
  s.a = newA;
  s.b = newB;
  try { if (window.StampBook) StampBook.onExplore('euclid'); } catch(e) {}
}
gcdDemoReset();

// GCD Game
var gcdGame = { problems: [], current: 0, a: 0, b: 0, steps: [], done: false };

function generateGCDProblems() {
  var pairs = [];
  while (pairs.length < 8) {
    var a = 30 + Math.floor(Math.random() * 170);
    var b = 15 + Math.floor(Math.random() * 90);
    if (a < b) { var t = a; a = b; b = t; }
    if (gcd(a, b) > 1 && a !== b && b > 0) pairs.push([a, b]);
  }
  return pairs;
}

function gcdGameReset() {
  gcdGame.problems = generateGCDProblems();
  gcdGame.current = 0;
  gcdGameLoad();
}

function gcdGameLoad() {
  if (gcdGame.current >= gcdGame.problems.length) {
    document.getElementById('gcd-q').textContent = '全部完成！🎉';
    document.getElementById('gcd-steps').innerHTML = '<div style="text-align:center; color:var(--c-english-ink)">太棒了，你已經掌握輾轉相除法！</div>';
    document.getElementById('gcd-prompt').textContent = '';
    document.getElementById('gcd-feedback').innerHTML = '';
    showConfetti();
    return;
  }
  var p = gcdGame.problems[gcdGame.current];
  gcdGame.a = p[0]; gcdGame.b = p[1];
  gcdGame.steps = []; gcdGame.done = false;
  document.getElementById('gcd-score').textContent = '第 ' + (gcdGame.current + 1) + ' / 8 題';
  document.getElementById('gcd-q').textContent = 'gcd(' + p[0] + ', ' + p[1] + ') = ?';
  document.getElementById('gcd-steps').innerHTML = '<div class="step-line">開始：gcd(' + p[0] + ', ' + p[1] + ')</div>';
  document.getElementById('gcd-prompt').textContent = '按「下一步」執行每一步除法';
  document.getElementById('gcd-feedback').innerHTML = '';
  document.getElementById('gcd-next-btn').textContent = '下一步';
}

function gcdGameStep() {
  if (gcdGame.done) { gcdGame.current++; gcdGameLoad(); return; }
  var a = gcdGame.a, b = gcdGame.b;
  if (b === 0) {
    gcdGame.done = true;
    document.getElementById('gcd-next-btn').textContent = '下一題 →';
    showFeedback('gcd-feedback', true, 'gcd = ' + a);
    return;
  }
  var q = Math.floor(a / b);
  var r = a % b;
  gcdGame.steps.push(a + ' ÷ ' + b + ' = ' + q + ' ... 餘 ' + r);
  var html = gcdGame.steps.map(function(l, i) {
    return '<div class="step-line' + (i === gcdGame.steps.length - 1 ? ' highlight' : '') + '">' + l + '</div>';
  }).join('');
  if (r === 0) {
    html += '<div class="step-line highlight" style="color:var(--c-english-ink)">→ gcd = ' + b + '</div>';
    gcdGame.done = true;
    document.getElementById('gcd-next-btn').textContent = '下一題 →';
    showFeedback('gcd-feedback', true, 'gcd = ' + b);
  }
  document.getElementById('gcd-steps').innerHTML = html;
  gcdGame.a = b; gcdGame.b = r;
}
gcdGameReset();

// ===== Section 2: Clock & Mod Game =====
(function initClock() {
  var g = document.getElementById('clock-numbers');
  for (var i = 1; i <= 12; i++) {
    var angle = (i - 3) * 30 * Math.PI / 180;
    var x = 100 + 72 * Math.cos(angle);
    var y = 100 + 72 * Math.sin(angle);
    var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', x); t.setAttribute('y', y + 5);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('fill', '#2d3436');
    t.setAttribute('font-size', '14');
    t.textContent = i;
    g.appendChild(t);
  }
})();

function animateClock(hour) {
  var r = hour % 12;            // 標準餘數 0..11
  var h = (r || 12);            // 時鐘上顯示的鐘面數字 1..12（12 代表餘數 0）
  var angle = (h * 30) - 90;
  var rad = angle * Math.PI / 180;
  var x2 = 100 + 55 * Math.cos(rad);
  var y2 = 100 + 55 * Math.sin(rad);
  var hand = document.getElementById('clock-hand');
  hand.setAttribute('x2', x2);
  hand.setAttribute('y2', y2);
  document.getElementById('clock-label').textContent = hour + ' 點 → 時鐘 ' + h + ' 點（' + hour + ' mod 12 = ' + r + '）';
  try { if (window.StampBook) StampBook.onExplore('mod'); } catch(e) {}
}

// Mod game
var modGame = { problems: [], current: 0 };

function generateModProblems() {
  var probs = [];
  var templates = [
    function() {
      var d = Math.floor(Math.random() * 7);
      var n = 50 + Math.floor(Math.random() * 250);
      var days = ['日','一','二','三','四','五','六'];
      var ans = (d + n) % 7;
      return { q: '今天星期' + days[d] + '，' + n + ' 天後星期幾？', ans: ans, choices: [0,1,2,3,4,5,6], format: function(a) { return '星期' + days[a]; } };
    },
    function() {
      var a = 20 + Math.floor(Math.random() * 50);
      var b = 20 + Math.floor(Math.random() * 50);
      var m = 3 + Math.floor(Math.random() * 7);
      var ans = (a + b) % m;
      var ch = []; for (var j = 0; j < m; j++) ch.push(j);   // 選項限定在 0..m-1 的合法餘數
      return { q: '(' + a + ' + ' + b + ') mod ' + m + ' = ?', ans: ans, choices: ch, format: function(v) { return '' + v; } };
    },
    function() {
      var a = 5 + Math.floor(Math.random() * 20);
      var b = 5 + Math.floor(Math.random() * 20);
      var m = 3 + Math.floor(Math.random() * 6);
      var ans = (a * b) % m;
      var ch = []; for (var j = 0; j < m; j++) ch.push(j);
      return { q: '(' + a + ' × ' + b + ') mod ' + m + ' = ?', ans: ans, choices: ch, format: function(v) { return '' + v; } };
    },
    function() {
      var h = 13 + Math.floor(Math.random() * 12);   // 13..24：真實 24 小時制會顯示的時刻，不產生 36 點／47 點這種不存在的時間
      var ans = ((h % 12) || 12);
      var ch = []; for (var j = 1; j <= 12; j++) ch.push(j);   // 時鐘只會顯示 1..12 點
      return { q: h + ' 點在時鐘上顯示幾點？', ans: ans, choices: ch, format: function(v) { return v + ' 點'; } };
    },
    function() {
      var a = 10 + Math.floor(Math.random() * 30);
      var m = 4 + Math.floor(Math.random() * 6);
      var exp = 2;
      var ans = (a * a) % m;
      var ch = []; for (var j = 0; j < m; j++) ch.push(j);
      return { q: a + '² mod ' + m + ' = ?', ans: ans, choices: ch, format: function(v) { return '' + v; } };
    }
  ];
  for (var i = 0; i < 8; i++) {
    probs.push(templates[i % templates.length]());
  }
  return probs;
}

function modGameReset() {
  modGame.problems = generateModProblems();
  modGame.current = 0;
  modGameLoad();
}

function modGameLoad() {
  if (modGame.current >= modGame.problems.length) {
    document.getElementById('mod-q').textContent = '全部完成！🎉';
    document.getElementById('mod-choices').innerHTML = '';
    document.getElementById('mod-prompt').textContent = '模運算大師！';
    document.getElementById('mod-feedback').innerHTML = '';
    showConfetti();
    return;
  }
  var p = modGame.problems[modGame.current];
  modGame.wrong = 0;
  document.getElementById('mod-score').textContent = '第 ' + (modGame.current + 1) + ' / 8 題';
  document.getElementById('mod-q').textContent = p.q;
  document.getElementById('mod-prompt').textContent = '';
  document.getElementById('mod-feedback').innerHTML = '';
  var choices = [];
  if (p.choices) {
    // 保證正解一定在選項內，再從其餘候選隨機補到最多 5 個
    choices = [p.ans];
    var pool = p.choices.filter(function(c) { return c !== p.ans; });
    pool.sort(function() { return Math.random() - 0.5; });
    for (var k = 0; k < pool.length && choices.length < 5; k++) choices.push(pool[k]);
  } else {
    choices = [p.ans];
    while (choices.length < 4) {
      var c = Math.max(0, p.ans + Math.floor(Math.random() * 8) - 3);
      if (choices.indexOf(c) === -1) choices.push(c);
    }
  }
  choices.sort(function() { return Math.random() - 0.5; });
  var html = choices.map(function(c) {
    return '<button class="game-btn small" onclick="modCheck(' + c + ',' + p.ans + ')">' + p.format(c) + '</button>';
  }).join('');
  document.getElementById('mod-choices').innerHTML = html;
}

function modCheck(chosen, correct) {
  if (document.getElementById('mod-feedback').querySelector('.adv-revealed')) return; // 已揭示答案，忽略再點
  if (chosen === correct) {
    modGame.wrong = 0;
    showFeedback('mod-feedback', true);
    modGame.current++;
    setTimeout(modGameLoad, 800);
  } else {
    modGame.wrong = (modGame.wrong || 0) + 1;
    if (modGame.wrong >= 2) {
      modReveal();
    } else {
      showFeedback('mod-feedback', false, '', { wrongLead: '沒關係～再想一想！', extraHtml: advExitButtons('modReveal()', 'modSkip()') });
    }
  }
}
function modReveal() {
  var p = modGame.problems[modGame.current];
  advReveal('mod-feedback', p.format(p.ans), '餘數就是「除以模數後剩下的部分」，把算式一步步取餘數就會得到它。', 'modSkip()');
}
function modSkip() {
  modGame.wrong = 0;
  modGame.current++;
  modGameLoad();
}
modGameReset();

// ===== Section 3: Fermat Game =====
function showFermatDemo(base, p) {
  var html = '';
  for (var i = 1; i <= p - 1; i++) {
    var val = modPow(base, i, p);
    var marker = (i === p - 1) ? ' ← <span style="color:var(--c-english-ink)">= 1！費馬小定理 ✓</span>' : '';
    html += base + '^' + i + ' mod ' + p + ' = ' + val + marker + '<br>';
  }
  document.getElementById('fermat-demo-result').innerHTML = html;
  try { if (window.StampBook) StampBook.onExplore('fermat'); } catch(e) {}
}

function showEulerPhi(n) {
  var result = n;
  var temp = n;
  var factors = [];
  for (var p = 2; p * p <= temp; p++) {
    if (temp % p === 0) {
      factors.push(p);
      result -= Math.floor(result / p);
      while (temp % p === 0) temp = Math.floor(temp / p);
    }
  }
  if (temp > 1) { factors.push(temp); result -= Math.floor(result / temp); }
  var html = '<strong>φ(' + n + ')</strong><br>';
  html += n + ' 的質因數：' + factors.join(', ') + '<br>';
  html += 'φ(' + n + ') = ' + n;
  factors.forEach(function(f) { html += ' × (1-1/' + f + ')'; });
  html += ' = <span style="color:var(--c-coin-ink); font-weight:bold">' + result + '</span><br>';
  var coprimes = [];
  for (var i = 1; i < n; i++) { if (gcd(i, n) === 1) coprimes.push(i); }
  html += '<span style="font-size:14px; color:var(--ink-soft)">互質的數：' + coprimes.join(', ') + ' (' + coprimes.length + '個)</span>';
  document.getElementById('phi-result').innerHTML = html;
  try { if (window.StampBook) StampBook.onExplore('fermat'); } catch(e) {}
}

var fermatGame = { problems: [], current: 0 };

function generateFermatProblems() {
  var primes = [5, 7, 11, 13];
  var probs = [];
  for (var i = 0; i < 6; i++) {
    var p = primes[Math.floor(Math.random() * primes.length)];
    var base = 2 + Math.floor(Math.random() * (p - 2));
    var exp = 20 + Math.floor(Math.random() * 80);
    var ans = modPow(base, exp, p);
    var remainder = exp % (p - 1);
    var hint = base + '^(' + (p-1) + ') ≡ 1 (mod ' + p + ')<br>' + exp + ' = ' + Math.floor(exp/(p-1)) + '×' + (p-1) + ' + ' + remainder + '<br>所以 ' + base + '^' + exp + ' ≡ ' + base + '^' + remainder + ' (mod ' + p + ')，自己算算看！';
    probs.push({ q: base + '^' + exp + ' mod ' + p + ' = ?', ans: ans, hint: hint, p: p });
  }
  return probs;
}

function fermatGameReset() {
  fermatGame.problems = generateFermatProblems();
  fermatGame.current = 0;
  fermatGameLoad();
}

function fermatGameLoad() {
  if (fermatGame.current >= fermatGame.problems.length) {
    document.getElementById('fermat-q').textContent = '全部完成！🎉';
    document.getElementById('fermat-choices').innerHTML = '';
    document.getElementById('fermat-hint').innerHTML = '<div style="text-align:center; color:var(--c-english-ink)">快速冪大師！</div>';
    document.getElementById('fermat-feedback').innerHTML = '';
    showConfetti();
    return;
  }
  var p = fermatGame.problems[fermatGame.current];
  fermatGame.wrong = 0;
  document.getElementById('fermat-score').textContent = '第 ' + (fermatGame.current + 1) + ' / 6 題';
  document.getElementById('fermat-q').textContent = p.q;
  document.getElementById('fermat-hint').innerHTML = '<span style="font-size:14px; color:var(--ink-soft)">💡 提示：' + p.hint + '</span>';
  document.getElementById('fermat-feedback').innerHTML = '';
  var choices = [p.ans];
  while (choices.length < 4) {
    var c = Math.floor(Math.random() * p.p);
    if (choices.indexOf(c) === -1) choices.push(c);
  }
  choices.sort(function() { return Math.random() - 0.5; });
  var html = choices.map(function(c) {
    return '<button class="game-btn small" onclick="fermatCheck(' + c + ',' + p.ans + ')">' + c + '</button>';
  }).join('');
  document.getElementById('fermat-choices').innerHTML = html;
}

function fermatCheck(chosen, correct) {
  if (document.getElementById('fermat-feedback').querySelector('.adv-revealed')) return; // 已揭示答案，忽略再點
  if (chosen === correct) {
    fermatGame.wrong = 0;
    showFeedback('fermat-feedback', true);
    fermatGame.current++;
    setTimeout(fermatGameLoad, 800);
  } else {
    fermatGame.wrong = (fermatGame.wrong || 0) + 1;
    if (fermatGame.wrong >= 2) {
      fermatReveal();
    } else {
      showFeedback('fermat-feedback', false, '', { wrongLead: '沒關係～再想一想！', extraHtml: advExitButtons('fermatReveal()', 'fermatSkip()') });
    }
  }
}
function fermatReveal() {
  var p = fermatGame.problems[fermatGame.current];
  advReveal('fermat-feedback', p.ans, p.hint, 'fermatSkip()');
}
function fermatSkip() {
  fermatGame.wrong = 0;
  fermatGame.current++;
  fermatGameLoad();
}
fermatGameReset();

// ===== Section 4: CRT Game =====
var crtGame = { problems: [], current: 0 };

function generateCRTProblems() {
  var probs = [];
  var modSets = [[3,5,7],[3,4,5],[2,5,7],[3,7,11],[4,5,7],[2,3,7]];
  for (var i = 0; i < 6; i++) {
    var ms = modSets[i];
    var r0 = 1 + Math.floor(Math.random() * (ms[0] - 1));
    var r1 = 1 + Math.floor(Math.random() * (ms[1] - 1));
    var r2 = Math.floor(Math.random() * ms[2]);
    var product = ms[0] * ms[1] * ms[2];
    var ans = -1;
    for (var x = 1; x <= product; x++) {
      if (x % ms[0] === r0 && x % ms[1] === r1 && x % ms[2] === r2) { ans = x; break; }
    }
    if (ans <= 0) { r2 = 1; for (var x2 = 1; x2 <= product; x2++) { if (x2 % ms[0] === r0 && x2 % ms[1] === r1 && x2 % ms[2] === r2) { ans = x2; break; } } }
    var q = 'x ≡ ' + r0 + ' (mod ' + ms[0] + ')\nx ≡ ' + r1 + ' (mod ' + ms[1] + ')\nx ≡ ' + r2 + ' (mod ' + ms[2] + ')';
    probs.push({ q: q, ans: ans, mods: ms, rems: [r0, r1, r2] });
  }
  return probs;
}

function crtGameReset() {
  crtGame.problems = generateCRTProblems();
  crtGame.current = 0;
  crtGameLoad();
}

function crtGameLoad() {
  if (crtGame.current >= crtGame.problems.length) {
    document.getElementById('crt-q').textContent = '全部完成！🎉';
    document.getElementById('crt-prompt').textContent = '你已經掌握中國剩餘定理！';
    document.getElementById('crt-feedback').innerHTML = '';
    showConfetti();
    return;
  }
  var p = crtGame.problems[crtGame.current];
  crtGame.wrong = 0;
  document.getElementById('crt-score').textContent = '第 ' + (crtGame.current + 1) + ' / 6 題';
  document.getElementById('crt-q').textContent = p.q;
  document.getElementById('crt-prompt').textContent = '將軍問：符合所有條件的最小正整數是？';
  document.getElementById('crt-feedback').innerHTML = '';
  document.getElementById('crt-input').value = '';
}

function crtCheck() {
  if (document.getElementById('crt-feedback').querySelector('.adv-revealed')) return; // 已揭示答案，忽略再送出
  var p = crtGame.problems[crtGame.current];
  var val = parseInt(document.getElementById('crt-input').value);
  if (isNaN(val)) {
    showFeedback('crt-feedback', false, ' 請輸入數字');
    return;
  }
  if (val === p.ans) {
    showFeedback('crt-feedback', true, '驗算：' + val + ' mod ' + p.mods[0] + '=' + (val%p.mods[0]) + ', mod ' + p.mods[1] + '=' + (val%p.mods[1]) + ', mod ' + p.mods[2] + '=' + (val%p.mods[2]));
    crtGame.current++;
    setTimeout(crtGameLoad, 1200);
  } else {
    crtGame.wrong = (crtGame.wrong || 0) + 1;
    if (crtGame.wrong >= 2) {
      crtReveal();
    } else {
      var checks = p.mods.map(function(m, i) { return val + ' mod ' + m + '=' + (val%m) + (val%m === p.rems[i] ? '✓' : '✗'); });
      showFeedback('crt-feedback', false, '<br><span style="font-size:14px">' + checks.join(', ') + '</span><br>看看哪個條件還沒滿足～再想一想！', { wrongLead: '沒關係～', extraHtml: advExitButtons('crtReveal()', 'crtSkip()') });
    }
  }
}
function crtReveal() {
  var p = crtGame.problems[crtGame.current];
  var why = '它是同時滿足三個餘數條件的最小正整數：' +
    p.mods.map(function(m, i) { return 'x mod ' + m + '=' + p.rems[i]; }).join('、') + '。';
  advReveal('crt-feedback', p.ans, why, 'crtSkip()');
}
function crtSkip() {
  crtGame.wrong = 0;
  crtGame.current++;
  crtGameLoad();
}
crtGameReset();

// ===== Section 5: RSA =====
var rsaDemoState = { step: 0 };
var rsaSteps = [
  '① 選兩個質數：p = 5, q = 11',
  '② 計算 n = p × q = 5 × 11 = 55',
  '③ 計算 φ(n) = (p-1)(q-1) = 4 × 10 = 40',
  '④ 選公鑰指數 e = 3（需要 gcd(3, 40) = 1 ✓）',
  '⑤ 求私鑰 d：e×d ≡ 1 (mod 40)',
  '   3×27 = 81 = 2×40 + 1 → d = 27 ✓',
  '⑥ 公鑰 = (n=55, e=3)  ← 公開給全世界',
  '   私鑰 = (n=55, d=27) ← 自己保管',
  '⑦ 加密：m=2 → c = 2³ mod 55 = 8',
  '⑧ 解密：c=8 → m = 8²⁷ mod 55 = 2 ✓ 🎉'
];

function rsaDemoReset() {
  rsaDemoState.step = 0;
  document.getElementById('rsa-demo').innerHTML = '<span style="color:var(--ink-soft)">按「下一步」看 RSA 如何運作...</span>';
}

function rsaDemoStep() {
  if (rsaDemoState.step >= rsaSteps.length) { rsaDemoReset(); return; }
  var html = '';
  for (var i = 0; i <= rsaDemoState.step; i++) {
    html += '<div class="step-line' + (i === rsaDemoState.step ? ' highlight' : '') + '">' + rsaSteps[i] + '</div>';
  }
  document.getElementById('rsa-demo').innerHTML = html;
  rsaDemoState.step++;
  try { if (window.StampBook) StampBook.onExplore('rsa'); } catch(e) {}
}
rsaDemoReset();

function factorChallenge(n) {
  var html = '分解 ' + n + '：<br>';
  for (var i = 2; i * i <= n; i++) {
    if (n % i === 0) {
      html += '嘗試 ' + i + '... ' + n + ' ÷ ' + i + ' = ' + (n/i) + ' ✓<br>';
      html += '<span style="color:var(--c-english-ink); font-weight:bold">' + n + ' = ' + i + ' × ' + (n/i) + '</span>';
      document.getElementById('factor-result').innerHTML = html;
      try { if (window.StampBook) StampBook.onExplore('rsa'); } catch(e) {}
      return;
    }
    html += '嘗試 ' + i + '... 不整除<br>';
  }
  html += '<span style="color:var(--c-english-ink)">' + n + ' 是質數！</span>';
  document.getElementById('factor-result').innerHTML = html;
  try { if (window.StampBook) StampBook.onExplore('rsa'); } catch(e) {}
}

var rsaEncrypted = 0;
var rsaOriginal = 0;

function rsaEncrypt() {
  var m = parseInt(document.getElementById('rsa-msg').value);
  if (isNaN(m) || m < 1 || m > 50) {
    document.getElementById('rsa-result').innerHTML = '<span style="color:var(--c-streak-ink)">請輸入 1~50 的數字</span>';
    return;
  }
  rsaOriginal = m;
  var c = modPow(m, 3, 55);
  rsaEncrypted = c;
  document.getElementById('rsa-result').innerHTML =
    '📝 你的秘密：m = <span style="color:var(--c-english-ink)">' + m + '</span><br>' +
    '🔒 加密：c = m^e mod n = ' + m + '³ mod 55<br>' +
    '   = ' + (m*m*m) + ' mod 55 = <span style="color:var(--c-coin-ink); font-size:26px; font-weight:bold">' + c + '</span><br>' +
    '<span style="font-size:14px; color:var(--ink-soft)">↑ 別人看到的只有密文 ' + c + '，猜不出原文！</span>';
  document.getElementById('rsa-decrypt-btn').style.display = 'inline-block';
  document.getElementById('rsa-feedback').innerHTML = '';
}

function rsaDecrypt() {
  var c = rsaEncrypted;
  var m = modPow(c, 27, 55);
  document.getElementById('rsa-feedback').innerHTML =
    '<div class="feedback correct">🔓 解密：m = ' + c + '^27 mod 55 = <strong>' + m + '</strong><br>原文完美還原！魔法就是 e×d = 3×27 = 81 ≡ 1 (mod 40)</div>';
  document.getElementById('rsa-decrypt-btn').style.display = 'none';
  showConfetti();
  try { if (window.StampBook) StampBook.onExplore('rsa'); } catch(e) {}
}

// RSA Decrypt Game
var rsaGame = { problems: [], current: 0 };

function generateRSAProblems() {
  var probs = [];
  var messages = [2, 4, 7, 8, 9, 13, 16, 18, 19, 23];
  var used = [];
  for (var i = 0; i < 5; i++) {
    var idx = Math.floor(Math.random() * messages.length);
    while (used.indexOf(idx) !== -1) idx = Math.floor(Math.random() * messages.length);
    used.push(idx);
    var m = messages[idx];
    var c = modPow(m, 3, 55);
    probs.push({ cipher: c, plain: m });
  }
  return probs;
}

function rsaGameReset() {
  rsaGame.problems = generateRSAProblems();
  rsaGame.current = 0;
  rsaGameLoad();
}

function rsaGameLoad() {
  if (rsaGame.current >= rsaGame.problems.length) {
    document.getElementById('rsa-game-q').textContent = '全部完成！🎉';
    document.getElementById('rsa-game-choices').innerHTML = '';
    document.getElementById('rsa-game-feedback').innerHTML = '';
    showConfetti();
    return;
  }
  var p = rsaGame.problems[rsaGame.current];
  document.getElementById('rsa-game-score').textContent = '第 ' + (rsaGame.current + 1) + ' / 5 題';
  document.getElementById('rsa-game-q').textContent = '密文 c = ' + p.cipher + '，原文 m = ?';
  document.getElementById('rsa-game-feedback').innerHTML = '';
  var choices = [p.plain];
  while (choices.length < 4) {
    var c = 2 + Math.floor(Math.random() * 48);
    if (choices.indexOf(c) === -1) choices.push(c);
  }
  choices.sort(function() { return Math.random() - 0.5; });
  document.getElementById('rsa-game-choices').innerHTML = choices.map(function(c) {
    return '<button class="game-btn small" onclick="rsaGameCheck(' + c + ',' + p.plain + ')">' + c + '</button>';
  }).join('');
}

function rsaGameCheck(chosen, correct) {
  if (chosen === correct) {
    showFeedback('rsa-game-feedback', true, 'c^d mod n = ' + modPow(rsaGame.problems[rsaGame.current].cipher, 27, 55));
    rsaGame.current++;
    setTimeout(rsaGameLoad, 900);
  } else {
    showFeedback('rsa-game-feedback', false, ' 提示：把每個選項 m 算 m³ mod 55，等於密文 ' + rsaGame.problems[rsaGame.current].cipher + ' 的就是答案！');
    setTimeout(function() { document.getElementById('rsa-game-feedback').innerHTML = ''; }, 2500);
  }
}
rsaGameReset();

// ===== Section 6: Perfect Numbers =====
var perfectGame = { problems: [], current: 0 };

function classifyNumber(n) {
  var sum = 0;
  for (var i = 1; i < n; i++) { if (n % i === 0) sum += i; }
  if (sum === n) return 'perfect';
  if (sum > n) return 'abundant';
  return 'deficient';
}

function getDivisors(n) {
  var divs = [];
  for (var i = 1; i < n; i++) { if (n % i === 0) divs.push(i); }
  return divs;
}

function generatePerfectProblems() {
  var numbers = [6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 24, 25, 27, 28, 30, 32, 33, 35, 36, 40, 42, 44, 45, 48, 50];
  var probs = [];
  var used = [];
  while (probs.length < 8 && used.length < numbers.length) {
    var idx = Math.floor(Math.random() * numbers.length);
    if (used.indexOf(idx) === -1) {
      used.push(idx);
      var n = numbers[idx];
      var divs = getDivisors(n);
      probs.push({ n: n, type: classifyNumber(n), divisors: divs, sum: divs.reduce(function(a, b) { return a + b; }, 0) });
    }
  }
  return probs;
}

function perfectGameReset() {
  perfectGame.problems = generatePerfectProblems();
  perfectGame.current = 0;
  perfectGameLoad();
}

function perfectGameLoad() {
  if (perfectGame.current >= perfectGame.problems.length) {
    document.getElementById('perfect-q').textContent = '全部完成！🎉';
    document.getElementById('perfect-prompt').textContent = '你已經認識各種特殊數了！';
    document.getElementById('perfect-feedback').innerHTML = '';
    showConfetti();
    return;
  }
  var p = perfectGame.problems[perfectGame.current];
  document.getElementById('perfect-score').textContent = '第 ' + (perfectGame.current + 1) + ' / 8 題';
  document.getElementById('perfect-q').textContent = p.n;
  document.getElementById('perfect-prompt').textContent = '真因數：' + p.divisors.join(' + ') + ' = ' + p.sum;
  document.getElementById('perfect-feedback').innerHTML = '';
}

function perfectCheck(type) {
  var p = perfectGame.problems[perfectGame.current];
  var typeNames = { perfect: '完全數', abundant: '過剩數', deficient: '不足數' };
  var symbol = p.sum > p.n ? '>' : (p.sum < p.n ? '<' : '=');
  if (type === p.type) {
    showFeedback('perfect-feedback', true, p.sum + ' ' + symbol + ' ' + p.n + ' → ' + typeNames[p.type]);
    perfectGame.current++;
    setTimeout(perfectGameLoad, 800);
  } else {
    showFeedback('perfect-feedback', false, ' 提示：真因數之和 ' + p.sum + ' ' + symbol + ' ' + p.n + '，再想想是哪一種？');
    setTimeout(function() { document.getElementById('perfect-feedback').innerHTML = ''; }, 1800);
  }
}
perfectGameReset();

// ===== Section 7: Quadratic Residue check =====
function showQRCheck(a, p) {
  var residues = [];
  for (var x = 1; x < p; x++) { var r = (x * x) % p; if (residues.indexOf(r) === -1) residues.push(r); }
  residues.sort(function(m, n) { return m - n; });
  var target = ((a % p) + p) % p;
  var isQR = residues.indexOf(target) !== -1;
  var euler = modPow(a, (p - 1) / 2, p); // QR → 1，NQR → p-1
  var html = 'mod ' + p + ' 的二次剩餘：{' + residues.join(', ') + '}<br>';
  html += '歐拉判準：' + a + '^((' + p + '−1)/2) = ' + a + '^' + ((p - 1) / 2) + ' mod ' + p + ' = ' + euler + '<br>';
  if (isQR) {
    html += '<span style="color:var(--c-english-ink); font-weight:bold">→ ' + a + ' 是二次剩餘，x² ≡ ' + a + ' (mod ' + p + ') 有解！</span>';
  } else {
    html += '<span style="color:var(--c-streak-ink); font-weight:bold">→ ' + a + ' 不是二次剩餘，x² ≡ ' + a + ' (mod ' + p + ') 無解！</span>';
  }
  document.getElementById('qr-check-result').innerHTML = html;
  try { if (window.StampBook) StampBook.onExplore('qr'); } catch(e) {}
}

// ===== Section 7: Primitive Roots Game =====
var qrGame = { problems: [], current: 0 };

function isPrimitiveRoot(g, p) {
  var seen = {};
  var val = 1;
  for (var i = 1; i < p; i++) {
    val = (val * g) % p;
    if (seen[val]) return false;
    seen[val] = true;
  }
  return Object.keys(seen).length === p - 1;
}

function findPrimitiveRoots(p) {
  var roots = [];
  for (var g = 2; g < p; g++) {
    if (isPrimitiveRoot(g, p)) roots.push(g);
  }
  return roots;
}

function generateQRProblems() {
  var primes = [7, 11, 13, 17];
  var probs = [];
  var shuffled = primes.sort(function() { return Math.random() - 0.5; });
  for (var i = 0; i < 5; i++) {
    var p = shuffled[i % shuffled.length];
    var roots = findPrimitiveRoots(p);
    var nonRoots = [];
    for (var g = 2; g < p; g++) { if (roots.indexOf(g) === -1) nonRoots.push(g); }
    probs.push({ p: p, roots: roots, nonRoots: nonRoots });
  }
  return probs;
}

function qrGameReset() {
  qrGame.problems = generateQRProblems();
  qrGame.current = 0;
  qrGameLoad();
}

function qrGameLoad() {
  if (qrGame.current >= qrGame.problems.length) {
    document.getElementById('qr-q').textContent = '全部完成！🎉';
    document.getElementById('qr-choices').innerHTML = '';
    document.getElementById('qr-prompt').textContent = '原根大師！';
    document.getElementById('qr-feedback').innerHTML = '';
    showConfetti();
    return;
  }
  var p = qrGame.problems[qrGame.current];
  document.getElementById('qr-score').textContent = '第 ' + (qrGame.current + 1) + ' / 5 題';
  document.getElementById('qr-q').textContent = '找 mod ' + p.p + ' 的原根';
  document.getElementById('qr-prompt').textContent = '哪個數的次方（1 到 ' + (p.p-1) + '）能生出所有 1~' + (p.p - 1) + '？';
  document.getElementById('qr-feedback').innerHTML = '';
  var choices = [];
  var root = p.roots[Math.floor(Math.random() * p.roots.length)];
  choices.push(root);
  var nrCopy = p.nonRoots.slice().sort(function() { return Math.random() - 0.5; });
  // 只用「非原根」當誘答，永遠不加入第二個原根 → 保證選項中至多一個正解
  for (var i = 0; i < nrCopy.length && choices.length < 4; i++) choices.push(nrCopy[i]);
  choices.sort(function(a, b) { return a - b; });
  var html = choices.map(function(c) {
    return '<button class="game-btn small" onclick="qrCheck(' + c + ',' + p.p + ')">' + c + '</button>';
  }).join('');
  document.getElementById('qr-choices').innerHTML = html;
}

function qrCheck(g, p) {
  if (isPrimitiveRoot(g, p)) {
    var powers = [];
    var val = 1;
    for (var i = 1; i < p; i++) { val = (val * g) % p; powers.push(val); }
    showFeedback('qr-feedback', true, '<br><span style="font-size:13px">' + g + ' 的次方：' + powers.join(', ') + ' → 全部！</span>');
    qrGame.current++;
    setTimeout(qrGameLoad, 1500);
  } else {
    var val2 = 1;
    var generated = [];
    for (var j = 1; j < p; j++) {
      val2 = (val2 * g) % p;
      if (generated.indexOf(val2) !== -1) break;
      generated.push(val2);
    }
    showFeedback('qr-feedback', false, ' ' + g + ' 只能生出 ' + generated.length + ' 個數（需要 ' + (p-1) + ' 個）');
    setTimeout(function() { document.getElementById('qr-feedback').innerHTML = ''; }, 2000);
  }
}
qrGameReset();

// ===== Section 8: Diophantine =====
// Extended GCD demo
var extGcdState = { step: 0, steps: [] };

function computeExtGcdSteps() {
  // 35x + 15y = 5
  // Forward pass
  var forward = [
    { text: '輾轉相除法（前進）：', type: 'header' },
    { text: '35 = 2 × 15 + 5', type: 'step' },
    { text: '15 = 3 × 5 + 0 → gcd = 5', type: 'step' },
    { text: '', type: 'space' },
    { text: '回代法（倒退）：', type: 'header' },
    { text: '從 35 = 2 × 15 + 5 得到：', type: 'step' },
    { text: '5 = 35 - 2 × 15', type: 'highlight' },
    { text: '即 5 = 1×35 + (-2)×15', type: 'highlight' },
    { text: '', type: 'space' },
    { text: '答案：x = 1, y = -2', type: 'result' },
    { text: '驗算：35×1 + 15×(-2) = 35 - 30 = 5 ✓ 🎉', type: 'result' }
  ];
  return forward;
}

function extGcdDemoReset() {
  extGcdState.step = 0;
  extGcdState.steps = computeExtGcdSteps();
  document.getElementById('ext-gcd-demo').innerHTML = '<span style="color:var(--ink-soft)">求解 35x + 15y = 5...</span>';
}

function extGcdDemoStep() {
  if (extGcdState.step >= extGcdState.steps.length) { extGcdDemoReset(); return; }
  var html = '';
  for (var i = 0; i <= extGcdState.step; i++) {
    var s = extGcdState.steps[i];
    if (s.type === 'header') html += '<div style="color:var(--c-math-ink); font-weight:bold; margin-top:8px">' + s.text + '</div>';
    else if (s.type === 'highlight') html += '<div class="step-line highlight">' + s.text + '</div>';
    else if (s.type === 'result') html += '<div style="color:var(--c-english-ink); font-weight:bold">' + s.text + '</div>';
    else if (s.type === 'space') html += '<br>';
    else html += '<div class="step-line">' + s.text + '</div>';
  }
  document.getElementById('ext-gcd-demo').innerHTML = html;
  extGcdState.step++;
  try { if (window.StampBook) StampBook.onExplore('diophantine'); } catch(e) {}
}
extGcdDemoReset();

// Pythagorean Triples Game
var dioGame = { problems: [], current: 0 };

function generatePythTriples() {
  var triples = [];
  for (var a = 3; a < 50; a++) {
    for (var b = a; b < 50; b++) {
      var c2 = a * a + b * b;
      var c = Math.round(Math.sqrt(c2));
      if (c * c === c2 && c < 50) {
        triples.push([a, b, c]);
      }
    }
  }
  return triples;
}

function generateDioProblems() {
  var allTriples = generatePythTriples();
  var probs = [];
  var usedIdx = [];
  for (var i = 0; i < 5; i++) {
    var idx = Math.floor(Math.random() * allTriples.length);
    while (usedIdx.indexOf(idx) !== -1) idx = Math.floor(Math.random() * allTriples.length);
    usedIdx.push(idx);
    var triple = allTriples[idx];
    var wrong = [];
    var attempts = 0;
    while (wrong.length < 3 && attempts < 50) {
      attempts++;
      var da = Math.floor(Math.random() * 3) - 1;
      var db = Math.floor(Math.random() * 5) - 2;
      var fa = triple[0] + da;
      var fb = triple[1] + db;
      if (fa <= 0 || fb <= 0) continue;
      var fc = Math.round(Math.sqrt(fa*fa + fb*fb));
      if (fc <= 0) continue;
      if (fa*fa + fb*fb !== fc*fc) {
        var ws = '(' + fa + ', ' + fb + ', ' + fc + ')';
        if (wrong.indexOf(ws) === -1) wrong.push(ws);
      }
    }
    while (wrong.length < 3) {
      var pa = triple[0] + 2, pb = triple[1] + 1, pc = triple[2] + 1;
      // 若 (a+2,b+1,c+1) 本身竟也是畢氏三元組，改用保證非三元組的 (a,b,c+1)
      if (pa*pa + pb*pb === pc*pc) { pa = triple[0]; pb = triple[1]; pc = triple[2] + 1; }
      wrong.push('(' + pa + ', ' + pb + ', ' + pc + ')');
    }
    var correctStr = '(' + triple[0] + ', ' + triple[1] + ', ' + triple[2] + ')';
    probs.push({ correct: correctStr, triple: triple, wrong: wrong });
  }
  return probs;
}

function dioGameReset() {
  dioGame.problems = generateDioProblems();
  dioGame.current = 0;
  dioGameLoad();
}

function dioGameLoad() {
  if (dioGame.current >= dioGame.problems.length) {
    document.getElementById('dio-q').textContent = '全部完成！🎉';
    document.getElementById('dio-choices').innerHTML = '';
    document.getElementById('dio-feedback').innerHTML = '';
    showConfetti();
    return;
  }
  var p = dioGame.problems[dioGame.current];
  document.getElementById('dio-score').textContent = '第 ' + (dioGame.current + 1) + ' / 5 題';
  document.getElementById('dio-q').textContent = '哪一組是畢氏三元組？';
  document.getElementById('dio-feedback').innerHTML = '';
  var choices = [p.correct].concat(p.wrong);
  choices.sort(function() { return Math.random() - 0.5; });
  var html = choices.map(function(c) {
    var escaped = c.replace(/'/g, "\\'");
    return '<button class="game-btn small" onclick="dioCheck(\'' + escaped + '\',\'' + p.correct.replace(/'/g, "\\'") + '\')" style="font-size:15px; min-width:130px">' + c + '</button>';
  }).join('');
  document.getElementById('dio-choices').innerHTML = html;
}

function dioCheck(chosen, correct) {
  var nums = chosen.replace(/[()]/g, '').split(', ').map(Number);
  var sum = nums[0]*nums[0] + nums[1]*nums[1];
  var csq = nums[2]*nums[2];
  if (chosen === correct) {
    showFeedback('dio-feedback', true, nums[0] + '²+' + nums[1] + '²=' + sum + '=' + nums[2] + '² ✓');
    dioGame.current++;
    setTimeout(dioGameLoad, 1200);
  } else {
    showFeedback('dio-feedback', false, ' ' + nums[0] + '²+' + nums[1] + '²=' + sum + ' ≠ ' + csq + '=' + nums[2] + '²');
    setTimeout(function() { document.getElementById('dio-feedback').innerHTML = ''; }, 2000);
  }
}
dioGameReset();

// Linear Diophantine Game
var dio2Game = { problems: [], current: 0 };

function generateDio2Problems() {
  var probs = [];
  var configs = [
    { a: 6, b: 9, c: 12, has: true },  // gcd(6,9)=3, 3|12
    { a: 4, b: 6, c: 5, has: false },   // gcd(4,6)=2, 2∤5
    { a: 15, b: 10, c: 25, has: true },  // gcd(15,10)=5, 5|25
    { a: 12, b: 8, c: 7, has: false },   // gcd(12,8)=4, 4∤7
    { a: 7, b: 11, c: 3, has: true },    // gcd(7,11)=1, 1|3
    { a: 9, b: 6, c: 4, has: false },    // gcd(9,6)=3, 3∤4
    { a: 14, b: 21, c: 35, has: true },  // gcd(14,21)=7, 7|35
    { a: 10, b: 15, c: 9, has: false }   // gcd(10,15)=5, 5∤9
  ];
  var shuffled = configs.sort(function() { return Math.random() - 0.5; });
  for (var i = 0; i < 5; i++) {
    var cfg = shuffled[i];
    probs.push({ q: cfg.a + 'x + ' + cfg.b + 'y = ' + cfg.c, has: cfg.has, a: cfg.a, b: cfg.b, c: cfg.c });
  }
  return probs;
}

function dio2GameReset() {
  dio2Game.problems = generateDio2Problems();
  dio2Game.current = 0;
  dio2GameLoad();
}

function dio2GameLoad() {
  if (dio2Game.current >= dio2Game.problems.length) {
    document.getElementById('dio2-q').textContent = '全部完成！🎉';
    document.getElementById('dio2-feedback').innerHTML = '';
    showConfetti();
    return;
  }
  var p = dio2Game.problems[dio2Game.current];
  document.getElementById('dio2-score').textContent = '第 ' + (dio2Game.current + 1) + ' / 5 題';
  document.getElementById('dio2-q').textContent = p.q;
  document.getElementById('dio2-feedback').innerHTML = '';
}

function dio2Check(answer) {
  var p = dio2Game.problems[dio2Game.current];
  var g = gcd(p.a, p.b);
  if (answer === p.has) {
    var reason = p.has ? 'gcd(' + p.a + ',' + p.b + ')=' + g + '，' + g + '|' + p.c + ' ✓' : 'gcd(' + p.a + ',' + p.b + ')=' + g + '，' + g + '∤' + p.c + ' ✗';
    showFeedback('dio2-feedback', true, reason);
    dio2Game.current++;
    setTimeout(dio2GameLoad, 1200);
  } else {
    showFeedback('dio2-feedback', false, ' 提示：先算 gcd(' + p.a + ',' + p.b + ')=' + g + '，再看它能不能整除 ' + p.c + '？');
    setTimeout(function() { document.getElementById('dio2-feedback').innerHTML = ''; }, 2200);
  }
}
dio2GameReset();

// ===== Handle Enter key =====
document.getElementById('crt-input').addEventListener('keypress', function(e) { if (e.key === 'Enter') crtCheck(); });
document.getElementById('rsa-msg').addEventListener('keypress', function(e) { if (e.key === 'Enter') rsaEncrypt(); });

// ===== Scroll spy for nav =====
var sectionIds = ['s1','s2','s3','s4','s5','s6','s7','s8'];
var navBtns = document.querySelectorAll('.nav-btn');
window.addEventListener('scroll', function() {
  var scrollPos = window.scrollY + 80;
  for (var i = sectionIds.length - 1; i >= 0; i--) {
    var el = document.getElementById(sectionIds[i]);
    if (el && el.offsetTop <= scrollPos) {
      navBtns.forEach(function(b) { b.classList.remove('active'); });
      if (navBtns[i]) navBtns[i].classList.add('active');
      break;
    }
  }
});

/* ---- (下一個原 inline <script> 區塊) ---- */

(function () {
  'use strict';

  var KEY = 'nta_stamps_v1';

  // 8 個進階主題＝天然的「章」；穩定語意 slug（非位置號），另記 sec 供跳轉。
  var TOPICS = [
    { id:'euclid',      title:'輾轉相除法',        emoji:'🔗', sec:'s1', color:'#6c5ce7' },
    { id:'mod',         title:'同餘與模運算',      emoji:'🕐', sec:'s2', color:'#0ea5e9' },
    { id:'fermat',      title:'費馬・歐拉定理',    emoji:'🔮', sec:'s3', color:'#a855f7' },
    { id:'crt',         title:'中國剩餘定理',      emoji:'📜', sec:'s4', color:'#f59e0b' },
    { id:'rsa',         title:'RSA 加密',          emoji:'🔐', sec:'s5', color:'#10b981' },
    { id:'perfect',     title:'完全數與特殊數',    emoji:'✨', sec:'s6', color:'#ec4899' },
    { id:'qr',          title:'二次剩餘與原根',    emoji:'⚡', sec:'s7', color:'#eab308' },
    { id:'diophantine', title:'Diophantine 方程',  emoji:'📐', sec:'s8', color:'#06b6d4' }
  ];
  var TOPIC_BY_ID = {};
  TOPICS.forEach(function (t) { TOPIC_BY_ID[t.id] = t; });

  // 回饋容器 id → 主題 id（8 個小遊戲的對/錯回饋皆收斂於 showFeedback，此處反查）。
  var FEEDBACK_MAP = {
    'gcd-feedback':'euclid', 'mod-feedback':'mod', 'fermat-feedback':'fermat',
    'crt-feedback':'crt', 'rsa-game-feedback':'rsa', 'perfect-feedback':'perfect',
    'qr-feedback':'qr', 'dio-feedback':'diophantine', 'dio2-feedback':'diophantine'
  };

  // 本地徽章（純本地：只寫 awarded guard + localToast；絕不 Game.award、絕不給 XP）。
  var BADGES = [
    { id:'first_stamp',  test:function (s) { return s.explored >= 1; }, msg:'🗺️ 蓋下第一枚探索章！純紀念，不影響冒險進度' },
    { id:'half_map',     test:function (s) { return s.explored >= 4; }, msg:'🧭 地圖過半！已經逛過 4 個進階主題' },
    { id:'all_explored', test:function (s) { return s.explored >= 8; }, msg:'🏔️ 探索地圖全部點亮！8 個進階主題都逛過了，太有好奇心了' },
    { id:'first_gold',   test:function (s) { return s.gold >= 1; },     msg:'✨ 拿到第一枚金章！答對的小驚喜（沒有金章也完全 OK）' },
    { id:'all_gold',     test:function (s) { return s.gold >= 8; },     msg:'🌟 8 枚金章全收集！這只是額外彩蛋，你早就把地圖逛完啦' }
  ];

  function today() {
    try { if (window.Game && Game.localDate) return Game.localDate(); } catch (e) {}
    return new Date().toISOString().slice(0, 10);
  }
  function reduceMotion() {
    try { return !!(window.Game && Game.getProfile && Game.getProfile().settings && Game.getProfile().settings.reduceMotion); } catch (e) { return false; }
  }

  var data = null;

  function freshStamps() {
    var stamps = {};
    TOPICS.forEach(function (t) {
      stamps[t.id] = { id:t.id, explored:false, gold:false, exploredDate:null, goldDate:null, seen:0 };
    });
    return stamps;
  }
  function ensureAllStamps() {
    if (!data.stamps) data.stamps = {};
    var base = freshStamps();
    for (var id in base) { if (!data.stamps[id]) data.stamps[id] = base[id]; }
    if (!data.awarded) data.awarded = {};
  }
  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    if (raw) {
      try { var p = JSON.parse(raw); if (p && p.stamps) { data = p; ensureAllStamps(); return; } } catch (e) {}
    }
    // 無既有進度 → 從零建立（8 個全 false）；awarded 起始為空，不回溯補發任何徽章。
    data = { version:1, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), stamps:freshStamps(), awarded:{} };
    save();
  }
  function save() {
    if (!data) return;
    data.updatedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  // ---- 統計 ----
  function exploredCount() { var n = 0; for (var id in data.stamps) if (data.stamps[id].explored) n++; return n; }
  function goldCount() { var n = 0; for (var id in data.stamps) if (data.stamps[id].gold) n++; return n; }

  // ---- 本地徽章：先設 guard → save → 再 toast（確保關頁不重發） ----
  function checkBadges() {
    var s = { explored:exploredCount(), gold:goldCount() };
    for (var i = 0; i < BADGES.length; i++) {
      var b = BADGES[i];
      if (data.awarded[b.id]) continue;
      if (!b.test(s)) continue;
      data.awarded[b.id] = true;
      save();
      localToast(b.msg);
    }
  }

  // ---- 核心：單調蓋章（只升不降；答錯/重來/關頁都不熄章） ----
  function stamp(id, tier) {
    if (!data) load();
    var st = data.stamps[id];
    if (!st) return;
    var t = today();
    if (tier === 'explore') {
      if (!st.explored) { st.explored = true; st.exploredDate = t; }
    } else if (tier === 'gold') {
      if (!st.gold) { st.gold = true; st.goldDate = t; }
      if (!st.explored) { st.explored = true; if (!st.exploredDate) st.exploredDate = t; }
    }
    save();
    checkBadges();
    if (isMapOpen()) { renderMap(); renderSummary(); }
    updateEntryBadge();
  }

  function onFeedback(elId, correct) {
    if (!data) load();
    var id = FEEDBACK_MAP[elId];
    if (!id) return;                 // 非收錄的 elId 忽略
    data.stamps[id].seen++;
    save();
    stamp(id, 'explore');            // 有回饋＝有嘗試＝已探索
    if (correct) stamp(id, 'gold');  // 答對再升金章（純額外）
  }
  function onExplore(id) {
    if (!data) load();
    if (!data.stamps[id]) return;
    data.stamps[id].seen++;
    stamp(id, 'explore');
  }

  // ---- 本地 toast（自備，不依賴 game_core；保住 HUD-off 契約） ----
  function toastRoot() {
    var r = document.getElementById('ntaToastRoot');
    if (!r) {
      r = document.createElement('div');
      r.id = 'ntaToastRoot';
      r.setAttribute('role', 'status');
      r.setAttribute('aria-live', 'polite');
      document.body.appendChild(r);
    }
    return r;
  }
  function localToast(msg) {
    var root = toastRoot();
    var el = document.createElement('div');
    el.className = 'nta-toast' + (reduceMotion() ? ' nta-reduce show' : '');
    el.textContent = msg;
    root.appendChild(el);
    if (!reduceMotion()) { requestAnimationFrame(function () { el.classList.add('show'); }); }
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, reduceMotion() ? 0 : 320);
    }, 3000);
  }

  // ---- 畫面：集章冊 ----
  function isMapOpen() { var el = document.getElementById('ntaStampOverlay'); return el && !el.hidden; }

  function renderMap() {
    if (!data) load();
    var host = document.getElementById('ntaStampGrid');
    if (!host) return;
    var html = '';
    TOPICS.forEach(function (t) {
      var st = data.stamps[t.id];
      var cls = 'nta-stamp ' + (st.gold ? 'gold explored' : (st.explored ? 'explored' : 'unexplored'));
      var glyph = st.explored ? t.emoji : '◇';
      var state = st.gold ? '金章 ★' : (st.explored ? '已探索' : '未探索');
      var style = st.explored ? (' style="border-color:' + t.color + '"') : '';
      var label = t.title + '（' + state + '）';
      var star = st.gold ? '<span class="nta-star">★</span>' : '';
      var check = (st.explored && !st.gold) ? '<span class="nta-check">✓</span>' : '';
      html += '<div class="' + cls + '"' + style + ' role="button" tabindex="0"' +
        ' title="' + label + '" aria-label="' + label + '"' +
        ' onclick="StampBook._tap(\'' + t.id + '\')"' +
        ' onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();StampBook._tap(\'' + t.id + '\');}">' +
        '<span class="nta-glyph">' + glyph + '</span>' +
        '<span class="nta-name">' + t.title + '</span>' +
        '<span class="nta-state">' + state + '</span>' + star + check + '</div>';
    });
    host.innerHTML = html;
  }

  function renderSummary() {
    var el = document.getElementById('ntaStampSummary');
    if (!el) return;
    el.innerHTML = '已探索 <b>' + exploredCount() + '</b>/8 個主題　·　金章 <b>' + goldCount() + '</b> 枚（金章是額外小彩蛋，沒有也 OK）';
    renderTodo();
  }

  function renderTodo() {
    var host = document.getElementById('ntaStampTodo');
    if (!host) return;
    var todo = TOPICS.filter(function (t) { return !data.stamps[t.id].explored; });
    if (todo.length === 0) {
      var links = TOPICS.map(function (t) {
        return '<div class="nta-todo-item"><span class="nta-todo-label">' + t.emoji + ' ' + t.title + '</span>' +
          '<button class="nta-go" onclick="StampBook._go(\'' + t.sec + '\')">再逛一次 →</button></div>';
      }).join('');
      host.innerHTML = '<div class="nta-alldone">🏔️ 整張地圖都逛過囉！想再回味哪個主題都可以</div>' + links;
      return;
    }
    var items = todo.map(function (t) {
      return '<div class="nta-todo-item"><span class="nta-todo-label">' + t.emoji + ' ' + t.title + '</span>' +
        '<button class="nta-go" onclick="StampBook._go(\'' + t.sec + '\')">去看看 →</button></div>';
    }).join('');
    host.innerHTML = '<div class="nta-todo-title">還沒探索的主題（想看看嗎？）</div>' + items;
  }

  function updateEntryBadge() {
    if (!data) load();
    var badge = document.getElementById('ntaStampFabBadge');
    if (badge) badge.textContent = exploredCount() + '/8';
  }

  function _tap(id) {
    var t = TOPIC_BY_ID[id];
    if (t) _go(t.sec);   // 未探索＝去看看；已探索＝回味；一律跳轉並關閉集章冊
  }
  function _go(sec) {
    closeMap();
    var el = document.getElementById(sec);
    if (el) el.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' });
  }

  function openMap() { if (!data) load(); renderMap(); renderSummary(); document.getElementById('ntaStampOverlay').hidden = false; }
  function closeMap() { var o = document.getElementById('ntaStampOverlay'); if (o) o.hidden = true; }

  // ---- 附加 DOM（皆 append 於 body 尾端，不動既有 section；浮層帶 [hidden]） ----
  function buildDom() {
    var host = document.createElement('div');
    host.innerHTML =
      '<button id="ntaStampFab" type="button" aria-label="打開探索集章冊" onclick="StampBook.openMap()">' +
        '🗺️ 集章冊 <span id="ntaStampFabBadge">0/8</span></button>' +
      '<div id="ntaStampOverlay" class="nta-overlay" hidden>' +
        '<div class="nta-card" role="dialog" aria-modal="true" aria-label="探索集章冊">' +
          '<div class="nta-head"><h1>🗺️ 探索集章冊</h1>' +
            '<button class="nta-back" onclick="StampBook.closeMap()">← 返回</button></div>' +
          '<div class="nta-note">這本集章冊只存在你自己的裝置上，純粹紀念你逛過哪些進階主題。它不會計入冒險進度，也不會影響經驗值或等級——放輕鬆探索就好 🌱</div>' +
          '<div id="ntaStampSummary" class="nta-summary"></div>' +
          '<div class="nta-legend"><span>◇ 虛線＝還沒探索</span><span>主題圖示＝已蓋章</span><span>★ 金框＝答對過的金章</span></div>' +
          '<div id="ntaStampGrid" class="nta-grid"></div>' +
          '<div id="ntaStampTodo" class="nta-todo"></div>' +
        '</div></div>';
    while (host.firstChild) document.body.appendChild(host.firstChild);
  }

  window.StampBook = {
    onFeedback: onFeedback,
    onExplore: onExplore,
    openMap: openMap,
    closeMap: closeMap,
    _tap: _tap,
    _go: _go
  };
  window.Stamps = window.StampBook; // 別名（相容）

  function boot() { buildDom(); load(); updateEntryBadge(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
