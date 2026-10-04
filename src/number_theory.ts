// @ts-nocheck — 機械式 legacy JS→TS 遷移：verbatim 轉檔、行為等價；型別檢查延後
/* =====================================================================
 * number_theory.ts  →  (tsc) →  number_theory.js
 * 原為 number_theory.html 的多個 inline <script> 區塊（連續、同一全域 scope）；
 * 依原順序合併成單一 sibling .js（保留全域 scope 與 onclick 參照、不加 IIFE）。
 * 行為與原 inline 版等價。
 * ===================================================================== */
// ========== UTILITIES ==========
function scrollToSection(id) {
  document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

// 把每次作答結果回報統一遊戲引擎（本頁對應數學科）。引擎未載入時安全略過。
function recordMath(correct) {
  try { if (window.Game && Game.recordAnswer) Game.recordAnswer('math', !!correct); } catch (e) {}
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isPrime(n) {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i <= Math.sqrt(n); i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

function getFactors(n) {
  const factors = [];
  for (let i = 1; i <= n; i++) {
    if (n % i === 0) factors.push(i);
  }
  return factors;
}

function gcd(a, b) {
  while (b !== 0) { [a, b] = [b, a % b]; }
  return a;
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

function primeFactorize(n) {
  const factors = [];
  let d = 2;
  while (n > 1) {
    while (n % d === 0) {
      factors.push(d);
      n /= d;
    }
    d++;
  }
  return factors;
}

// Turn [2,2,3,3] into "2² × 3²"; returns null when no exponents are needed
function toExponentForm(factors) {
  const counts = {};
  factors.forEach(f => { counts[f] = (counts[f] || 0) + 1; });
  const supers = { 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸' };
  let hasPower = false;
  const parts = Object.keys(counts).map(p => {
    const c = counts[p];
    if (c > 1) { hasPower = true; return p + (supers[c] || ('^' + c)); }
    return p;
  });
  return hasPower ? parts.join(' × ') : null;
}

function showConfetti() {
  const container = document.getElementById('confettiContainer');
  const colors = ['#fbbf24', '#ef4444', '#10b981', '#667eea', '#a78bfa', '#f59e0b', '#ec4899'];
  for (let i = 0; i < 30; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = randInt(10, 90) + '%';
    piece.style.top = randInt(20, 50) + '%';
    piece.style.backgroundColor = colors[randInt(0, colors.length - 1)];
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    piece.style.width = randInt(6, 12) + 'px';
    piece.style.height = randInt(6, 12) + 'px';
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    piece.style.animationDuration = (1 + Math.random()) + 's';
    container.appendChild(piece);
  }
  setTimeout(() => { container.innerHTML = ''; }, 2000);
}

function getScoreMessage(score, total) {
  const pct = score / total;
  if (pct === 1) return '🎉 太棒了！你每一題都很認真思考，全部答對！';
  if (pct >= 0.8) return '🌟 好棒！你已經掌握得很好了！';
  if (pct >= 0.6) return '👍 不錯喔！再多練習就能更好！';
  if (pct >= 0.4) return '💪 繼續加油！你已經學到很多了！';
  return '🌱 慢慢來，多練幾次就會進步囉！';
}

function showScoreCard(container, score, total) {
  container.style.display = 'block';
  container.innerHTML = `
    <div class="score-card">
      <div class="message">${getScoreMessage(score, total)}</div>
      <div class="big-score">${score} / ${total}</div>
    </div>`;
  if (score >= total * 0.8) showConfetti();
}

// 答後自控前進：在回饋下方放「繼續 ➡️」鈕，由學習者按下才換題（取代固定計時器自動跳題）。
function showNextBtn(fbEl, nextFn) {
  if (!fbEl) return;
  const parent = fbEl.parentElement;
  let btn = parent.querySelector('.continue-btn');
  if (!btn) {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'continue-btn';
    fbEl.insertAdjacentElement('afterend', btn);
  }
  btn.textContent = '繼續 ➡️';
  btn.setAttribute('aria-label', '繼續下一題');
  btn.onclick = function() { btn.remove(); nextFn(); };
  try { btn.focus(); } catch (e) {}
}
function clearNextBtn(fbEl) {
  if (!fbEl) return;
  const btn = fbEl.parentElement.querySelector('.continue-btn');
  if (btn) btn.remove();
}

// ========== SECTION 1: ODD / EVEN ==========
let oeState = {};

function startOddEven() {
  oeState = { round: 0, score: 0, numbers: [], answered: false };
  // Generate 10 numbers with increasing difficulty
  for (let i = 0; i < 4; i++) oeState.numbers.push(randInt(1, 20));
  for (let i = 0; i < 3; i++) oeState.numbers.push(randInt(20, 100));
  for (let i = 0; i < 3; i++) oeState.numbers.push(randInt(100, 999));
  document.getElementById('oeResult').style.display = 'none';
  nextOddEven();
}

function nextOddEven() {
  if (oeState.round >= 10) {
    showScoreCard(document.getElementById('oeResult'), oeState.score, 10);
    document.getElementById('oeNumber').textContent = '—';
    return;
  }
  oeState.answered = false;
  document.getElementById('oeRound').textContent = oeState.round + 1;
  document.getElementById('oeScore').textContent = oeState.score;
  document.getElementById('oeNumber').textContent = oeState.numbers[oeState.round];
  document.getElementById('oeFeedback').textContent = '';
  document.getElementById('oeFeedback').className = 'feedback';
  clearNextBtn(document.getElementById('oeFeedback'));
}

function answerOddEven(answer) {
  if (oeState.answered || oeState.round >= 10) return;
  oeState.answered = true;
  const num = oeState.numbers[oeState.round];
  const correct = num % 2 === 0 ? 'even' : 'odd';
  const fb = document.getElementById('oeFeedback');
  if (answer === correct) {
    oeState.score++;
    fb.textContent = '✅ 答對了！太棒了！';
    fb.className = 'feedback correct';
  } else {
    const ans = correct === 'even' ? '偶數' : '奇數';
    fb.textContent = `差一點！${num} 是${ans}喔`;
    fb.className = 'feedback wrong';
  }
  recordMath(answer === correct);
  document.getElementById('oeScore').textContent = oeState.score;
  oeState.round++;
  showNextBtn(fb, nextOddEven);
}

// ========== SECTION 2: SIEVE ==========
function startSieve() {
  const grid = document.getElementById('sieveGrid');
  grid.innerHTML = '';
  document.getElementById('sieveFeedback').textContent = '';
  for (let i = 1; i <= 50; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.textContent = i;
    cell.dataset.num = i;
    if (i === 1) {
      cell.classList.add('disabled');
      cell.style.opacity = '0.3';
    } else {
      cell.setAttribute('role', 'button');
      cell.tabIndex = 0;
      cell.onclick = function() {
        this.classList.toggle('eliminated');
      };
    }
    grid.appendChild(cell);
  }
}

function checkSieve() {
  const cells = document.querySelectorAll('#sieveGrid .grid-cell');
  // Clear previous check feedback so corrected cells no longer look wrong
  cells.forEach(cell => {
    cell.style.border = '';
    cell.classList.remove('prime-highlight');
    cell.classList.remove('sieve-wrong');
  });
  let correct = 0, total = 0;
  cells.forEach(cell => {
    const num = parseInt(cell.dataset.num);
    if (num === 1) return;
    total++;
    const shouldBeEliminated = !isPrime(num);
    const isEliminated = cell.classList.contains('eliminated');
    if (shouldBeEliminated === isEliminated) {
      correct++;
      if (isPrime(num) && !isEliminated) {
        cell.classList.add('prime-highlight');
      }
    } else {
      cell.classList.add('sieve-wrong');
    }
  });
  const fb = document.getElementById('sieveFeedback');
  if (correct === total) {
    fb.textContent = '🎉 完美！你找出了所有質數！';
    fb.className = 'feedback correct';
    showConfetti();
  } else {
    fb.textContent = `還差一點！答對了 ${correct}/${total}，打叉 ✗ 的格子再看看喔`;
    fb.className = 'feedback wrong';
  }
  recordMath(correct === total);
  try { if (window.GemMine) GemMine.onSieve(cells); } catch(e){}
}

// ========== SECTION 2: PRIME QUIZ ==========
let pqState = {};

function startPrimeQuiz() {
  const numbers = [];
  // Mix of primes and non-primes
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47];
  const composites = [4, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20, 21, 22, 24, 25, 26, 27, 28, 33, 35, 39, 49];
  for (let i = 0; i < 5; i++) numbers.push(primes[randInt(0, primes.length - 1)]);
  for (let i = 0; i < 5; i++) numbers.push(composites[randInt(0, composites.length - 1)]);
  pqState = { round: 0, score: 0, numbers: shuffle(numbers), answered: false };
  document.getElementById('pqResult').style.display = 'none';
  nextPrimeQuiz();
}

function nextPrimeQuiz() {
  if (pqState.round >= 10) {
    showScoreCard(document.getElementById('pqResult'), pqState.score, 10);
    document.getElementById('pqNumber').textContent = '—';
    return;
  }
  pqState.answered = false;
  document.getElementById('pqRound').textContent = pqState.round + 1;
  document.getElementById('pqScore').textContent = pqState.score;
  document.getElementById('pqNumber').textContent = pqState.numbers[pqState.round];
  document.getElementById('pqFeedback').textContent = '';
  document.getElementById('pqFeedback').className = 'feedback';
  clearNextBtn(document.getElementById('pqFeedback'));
}

function answerPrime(answer) {
  if (pqState.answered || pqState.round >= 10) return;
  pqState.answered = true;
  const num = pqState.numbers[pqState.round];
  const correct = isPrime(num);
  const fb = document.getElementById('pqFeedback');
  if (answer === correct) {
    pqState.score++;
    fb.textContent = '✅ 答對了！';
    fb.className = 'feedback correct';
  } else {
    if (correct) {
      fb.textContent = `差一點！${num} 是質數，只能被 1 和 ${num} 整除`;
    } else {
      // Find a factor
      let factor = 2;
      for (let i = 2; i < num; i++) {
        if (num % i === 0) { factor = i; break; }
      }
      fb.textContent = `差一點！${num} 不是質數，因為 ${num} = ${factor} × ${num / factor}`;
    }
    fb.className = 'feedback wrong';
  }
  recordMath(answer === correct);
  try { if (window.GemMine) GemMine.onAnswer('prime', num, answer === correct); } catch(e){}
  document.getElementById('pqScore').textContent = pqState.score;
  pqState.round++;
  showNextBtn(fb, nextPrimeQuiz);
}

// ========== SECTION 3: FACTOR GAME ==========
let factorState = {};

function startFactorGame() {
  const targets = [12, 15, 16, 18, 20, 24, 28, 30, 36, 40, 42, 48];
  const target = targets[randInt(0, targets.length - 1)];
  const correctFactors = getFactors(target);
  factorState = { target, correctFactors, selected: new Set() };

  document.getElementById('factorTarget').textContent = target;
  document.getElementById('factorFeedback').textContent = '';
  document.getElementById('factorFeedback').className = 'feedback';

  const grid = document.getElementById('factorGrid');
  grid.innerHTML = '';
  // Show every number from 1 up to the target so all factors (including the number itself) can be picked
  const maxShow = target;
  for (let i = 1; i <= maxShow; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.textContent = i;
    cell.dataset.num = i;
    cell.setAttribute('role', 'button');
    cell.tabIndex = 0;
    cell.onclick = function() {
      const n = parseInt(this.dataset.num);
      if (factorState.selected.has(n)) {
        factorState.selected.delete(n);
        this.classList.remove('selected');
      } else {
        factorState.selected.add(n);
        this.classList.add('selected');
      }
    };
    grid.appendChild(cell);
  }
}

function checkFactors() {
  const fb = document.getElementById('factorFeedback');
  const correct = factorState.correctFactors;
  const selected = [...factorState.selected];

  const missed = correct.filter(f => !factorState.selected.has(f));
  const extra = selected.filter(s => !correct.includes(s));

  if (missed.length === 0 && extra.length === 0) {
    fb.textContent = `🎉 完美！${factorState.target} 的因數就是 {${correct.join(', ')}}`;
    fb.className = 'feedback correct';
    showConfetti();
  } else {
    let msg = `差一點！${factorState.target} 的因數是 {${correct.join(', ')}}`;
    if (missed.length > 0) msg += ` 漏了 ${missed.join(', ')}`;
    if (extra.length > 0) msg += ` 多了 ${extra.join(', ')}`;
    fb.textContent = msg;
    fb.className = 'feedback wrong';
  }
  recordMath(missed.length === 0 && extra.length === 0);
}

// ========== SECTION 3: MULTIPLE GAME ==========
let multipleState = {};

function startMultipleGame() {
  const bases = [2, 3, 4, 5, 6, 7, 8, 9];
  const base = bases[randInt(0, bases.length - 1)];
  const max = base * 10 + randInt(1, 5);
  multipleState = { base, max, selected: new Set() };

  document.getElementById('multipleTarget').textContent = base;
  document.getElementById('multipleFeedback').textContent = '';
  document.getElementById('multipleFeedback').className = 'feedback';

  const line = document.getElementById('multipleLine');
  line.innerHTML = '';
  for (let i = 1; i <= Math.min(max, 30); i++) {
    const cell = document.createElement('div');
    cell.className = 'nl-cell';
    cell.textContent = i;
    cell.dataset.num = i;
    cell.setAttribute('role', 'button');
    cell.tabIndex = 0;
    cell.onclick = function() {
      const n = parseInt(this.dataset.num);
      if (multipleState.selected.has(n)) {
        multipleState.selected.delete(n);
        this.classList.remove('hit');
      } else {
        multipleState.selected.add(n);
        this.classList.add('hit');
      }
    };
    line.appendChild(cell);
  }
}

function checkMultiples() {
  const fb = document.getElementById('multipleFeedback');
  const base = multipleState.base;
  const max = Math.min(multipleState.max, 30);
  const correctMultiples = [];
  for (let i = base; i <= max; i += base) correctMultiples.push(i);

  const selected = [...multipleState.selected];
  const missed = correctMultiples.filter(m => !multipleState.selected.has(m));
  const extra = selected.filter(s => s % base !== 0);

  if (missed.length === 0 && extra.length === 0) {
    fb.textContent = `🎉 太棒了！${base} 的倍數你全找到了！`;
    fb.className = 'feedback correct';
    showConfetti();
  } else {
    fb.textContent = `差一點！${base} 的倍數是 ${correctMultiples.join(', ')}`;
    fb.className = 'feedback wrong';
  }
  recordMath(missed.length === 0 && extra.length === 0);
}

// ========== SECTION 4: DIVISIBILITY GAME ==========
let divState = {};

function isDivisible(num, by) {
  return num % by === 0;
}

function startDivGame() {
  const divisors = [2, 3, 4, 5, 6, 9, 10];
  const questions = [];
  for (let i = 0; i < 10; i++) {
    const d = divisors[randInt(0, divisors.length - 1)];
    let num;
    if (Math.random() > 0.4) {
      // Make it divisible
      num = d * randInt(10, 99);
    } else {
      // Make it not divisible
      num = d * randInt(10, 99) + randInt(1, d - 1);
    }
    questions.push({ num, divisor: d });
  }
  divState = { round: 0, score: 0, questions, answered: false };
  document.getElementById('divResult').style.display = 'none';
  nextDivQuestion();
}

function nextDivQuestion() {
  if (divState.round >= 10) {
    showScoreCard(document.getElementById('divResult'), divState.score, 10);
    document.getElementById('divNumber').textContent = '—';
    document.getElementById('divPrompt').textContent = '—';
    return;
  }
  divState.answered = false;
  const q = divState.questions[divState.round];
  document.getElementById('divRound').textContent = divState.round + 1;
  document.getElementById('divScore').textContent = divState.score;
  document.getElementById('divNumber').textContent = q.num;
  document.getElementById('divPrompt').textContent = `${q.num} 能被 ${q.divisor} 整除嗎？`;
  document.getElementById('divFeedback').textContent = '';
  document.getElementById('divFeedback').className = 'feedback';
  clearNextBtn(document.getElementById('divFeedback'));
}

// 整除判別口訣（標準規則；答錯時補上，幫下次判斷）
function divRule(d) {
  var R = {
    2: '看個位數：是 0、2、4、6、8（偶數）就能被 2 整除。',
    3: '把各位數字全部加起來，總和能被 3 整除，原數就能被 3 整除。',
    4: '只看最後兩位數，能被 4 整除，整個數就能被 4 整除。',
    5: '看個位數：是 0 或 5 就能被 5 整除。',
    6: '同時能被 2 和 3 整除（也就是偶數、而且各位數字和能被 3）。',
    8: '只看最後三位數，能被 8 整除，整個數就能被 8 整除。',
    9: '把各位數字全部加起來，總和能被 9 整除，原數就能被 9 整除。',
    10: '看個位數：是 0 就能被 10 整除。'
  };
  return R[d] || '';
}
function answerDiv(answer) {
  if (divState.answered || divState.round >= 10) return;
  divState.answered = true;
  const q = divState.questions[divState.round];
  const correct = isDivisible(q.num, q.divisor);
  const fb = document.getElementById('divFeedback');

  if (answer === correct) {
    divState.score++;
    fb.textContent = '✅ 答對了！魔法口訣用得好！';
    fb.className = 'feedback correct';
  } else {
    if (correct) {
      fb.textContent = `差一點！${q.num} 可以被 ${q.divisor} 整除（${q.num} ÷ ${q.divisor} = ${q.num / q.divisor}）`;
    } else {
      fb.textContent = `差一點！${q.num} 不能被 ${q.divisor} 整除（餘 ${q.num % q.divisor}）`;
    }
    var _rule = divRule(q.divisor);
    if (_rule) fb.textContent += `　🔑 口訣：${_rule}`;
    fb.className = 'feedback wrong';
  }
  recordMath(answer === correct);
  try { if (window.GemMine) GemMine.onAnswer('div', q.divisor, answer === correct); } catch(e){}
  document.getElementById('divScore').textContent = divState.score;
  divState.round++;
  showNextBtn(fb, nextDivQuestion);
}

// ========== SECTION 5: GCD GAME ==========
let gcdState = {};

function startGcdGame() {
  const pairs = [];
  for (let i = 0; i < 8; i++) {
    const a = randInt(6, 36);
    const b = randInt(6, 36);
    if (a !== b) pairs.push([a, b]);
    else pairs.push([a, a + randInt(2, 10)]);
  }
  gcdState = { round: 0, score: 0, pairs, answered: false };
  document.getElementById('gcdResult').style.display = 'none';
  nextGcdQuestion();
}

function nextGcdQuestion() {
  if (gcdState.round >= 8) {
    showScoreCard(document.getElementById('gcdResult'), gcdState.score, 8);
    document.getElementById('gcdA').textContent = '—';
    document.getElementById('gcdB').textContent = '—';
    document.getElementById('gcdChoices').innerHTML = '';
    return;
  }
  gcdState.answered = false;
  const [a, b] = gcdState.pairs[gcdState.round];
  const answer = gcd(a, b);

  document.getElementById('gcdRound').textContent = gcdState.round + 1;
  document.getElementById('gcdScore').textContent = gcdState.score;
  document.getElementById('gcdA').textContent = a;
  document.getElementById('gcdB').textContent = b;
  document.getElementById('gcdFeedback').textContent = '';
  document.getElementById('gcdFeedback').className = 'feedback';
  clearNextBtn(document.getElementById('gcdFeedback'));

  // Generate choices
  const choices = new Set([answer]);
  const factorsA = getFactors(a);
  const factorsB = getFactors(b);
  while (choices.size < 4) {
    const pool = [...factorsA, ...factorsB, answer * 2, answer + 1, answer - 1, Math.max(a, b)];
    const c = pool[randInt(0, pool.length - 1)];
    if (c > 0 && c !== answer) choices.add(c);
    if (choices.size < 4) choices.add(randInt(1, Math.max(a, b)));
  }

  const grid = document.getElementById('gcdChoices');
  grid.innerHTML = '';
  shuffle([...choices]).forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c;
    btn.onclick = function() { checkGcdAnswer(c, answer, a, b); };
    grid.appendChild(btn);
  });
}

function checkGcdAnswer(chosen, answer, a, b) {
  if (gcdState.answered) return;
  gcdState.answered = true;
  const fb = document.getElementById('gcdFeedback');
  const btns = document.querySelectorAll('#gcdChoices .choice-btn');
  btns.forEach(btn => {
    if (parseInt(btn.textContent) === answer) btn.classList.add('correct-choice');
    else if (parseInt(btn.textContent) === chosen && chosen !== answer) btn.classList.add('wrong-choice');
  });

  if (chosen === answer) {
    gcdState.score++;
    fb.textContent = `✅ 答對了！GCD(${a}, ${b}) = ${answer}`;
    fb.className = 'feedback correct';
  } else {
    fb.textContent = `差一點！GCD(${a}, ${b}) = ${answer}`;
    fb.className = 'feedback wrong';
  }
  recordMath(chosen === answer);
  document.getElementById('gcdScore').textContent = gcdState.score;
  gcdState.round++;
  showNextBtn(fb, nextGcdQuestion);
}

// ========== SECTION 6: LCM GAME ==========
let lcmState = {};

function startLcmGame() {
  const pairs = [];
  for (let i = 0; i < 8; i++) {
    const a = randInt(2, 12);
    const b = randInt(2, 12);
    if (a !== b) pairs.push([a, b]);
    else pairs.push([a, a + randInt(1, 5)]);
  }
  lcmState = { round: 0, score: 0, pairs, answered: false };
  document.getElementById('lcmResult').style.display = 'none';
  nextLcmQuestion();
}

function nextLcmQuestion() {
  if (lcmState.round >= 8) {
    showScoreCard(document.getElementById('lcmResult'), lcmState.score, 8);
    document.getElementById('lcmA').textContent = '—';
    document.getElementById('lcmB').textContent = '—';
    document.getElementById('lcmChoices').innerHTML = '';
    return;
  }
  lcmState.answered = false;
  const [a, b] = lcmState.pairs[lcmState.round];
  const answer = lcm(a, b);

  document.getElementById('lcmRound').textContent = lcmState.round + 1;
  document.getElementById('lcmScore').textContent = lcmState.score;
  document.getElementById('lcmA').textContent = a;
  document.getElementById('lcmB').textContent = b;
  document.getElementById('lcmFeedback').textContent = '';
  document.getElementById('lcmFeedback').className = 'feedback';
  clearNextBtn(document.getElementById('lcmFeedback'));

  // Generate choices
  const choices = new Set([answer]);
  while (choices.size < 4) {
    const options = [a * b, answer + a, answer + b, answer - a, answer * 2, a * randInt(2, 5), b * randInt(2, 5)];
    const c = options[randInt(0, options.length - 1)];
    if (c > 0 && c !== answer) choices.add(c);
  }

  const grid = document.getElementById('lcmChoices');
  grid.innerHTML = '';
  shuffle([...choices]).forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c;
    btn.onclick = function() { checkLcmAnswer(c, answer, a, b); };
    grid.appendChild(btn);
  });
}

function checkLcmAnswer(chosen, answer, a, b) {
  if (lcmState.answered) return;
  lcmState.answered = true;
  const fb = document.getElementById('lcmFeedback');
  const btns = document.querySelectorAll('#lcmChoices .choice-btn');
  btns.forEach(btn => {
    if (parseInt(btn.textContent) === answer) btn.classList.add('correct-choice');
    else if (parseInt(btn.textContent) === chosen && chosen !== answer) btn.classList.add('wrong-choice');
  });

  if (chosen === answer) {
    lcmState.score++;
    fb.textContent = `✅ 答對了！LCM(${a}, ${b}) = ${answer}`;
    fb.className = 'feedback correct';
  } else {
    fb.textContent = `差一點！LCM(${a}, ${b}) = ${answer}`;
    fb.className = 'feedback wrong';
  }
  recordMath(chosen === answer);
  document.getElementById('lcmScore').textContent = lcmState.score;
  lcmState.round++;
  showNextBtn(fb, nextLcmQuestion);
}

// ========== SECTION 7: FACTOR TREE GAME ==========
let treeState = {};

function startTreeGame() {
  const numbers = [12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 50, 54, 56, 60, 72, 80, 90, 100];
  const questions = [];
  for (let i = 0; i < 8; i++) {
    questions.push(numbers[randInt(0, numbers.length - 1)]);
  }
  treeState = { round: 0, score: 0, questions, answered: false };
  document.getElementById('treeResult').style.display = 'none';
  nextTreeQuestion();
}

function nextTreeQuestion() {
  if (treeState.round >= 8) {
    showScoreCard(document.getElementById('treeResult'), treeState.score, 8);
    document.getElementById('treeTarget').textContent = '—';
    document.getElementById('treeChoices').innerHTML = '';
    return;
  }
  treeState.answered = false;
  const num = treeState.questions[treeState.round];
  const factors = primeFactorize(num);
  const answer = factors.join(' × ');

  document.getElementById('treeRound').textContent = treeState.round + 1;
  document.getElementById('treeScore').textContent = treeState.score;
  document.getElementById('treeTarget').textContent = num;
  document.getElementById('treeFeedback').textContent = '';
  document.getElementById('treeFeedback').className = 'feedback';
  clearNextBtn(document.getElementById('treeFeedback'));

  // Generate wrong answers
  const choices = new Set([answer]);
  while (choices.size < 4) {
    // Create plausible wrong factorizations
    const wrongFactors = [...factors];
    const method = randInt(0, 3);
    if (method === 0 && wrongFactors.length > 1) {
      // Combine two factors
      const i = randInt(0, wrongFactors.length - 2);
      wrongFactors[i] = wrongFactors[i] * wrongFactors[i + 1];
      wrongFactors.splice(i + 1, 1);
    } else if (method === 1) {
      // Change one factor
      const i = randInt(0, wrongFactors.length - 1);
      wrongFactors[i] = wrongFactors[i] + (Math.random() > 0.5 ? 1 : -1);
      if (wrongFactors[i] < 2) wrongFactors[i] = 2;
    } else if (method === 2) {
      // Add an extra factor
      wrongFactors.push(randInt(2, 5));
    } else {
      // Remove a factor
      if (wrongFactors.length > 1) wrongFactors.splice(randInt(0, wrongFactors.length - 1), 1);
    }
    const wrong = wrongFactors.sort((a,b) => a-b).join(' × ');
    if (wrong !== answer) choices.add(wrong);
  }

  const grid = document.getElementById('treeChoices');
  grid.innerHTML = '';
  shuffle([...choices]).forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c;
    btn.onclick = function() { checkTreeAnswer(c, answer, num); };
    grid.appendChild(btn);
  });
}

function checkTreeAnswer(chosen, answer, num) {
  if (treeState.answered) return;
  treeState.answered = true;
  const fb = document.getElementById('treeFeedback');
  const btns = document.querySelectorAll('#treeChoices .choice-btn');
  btns.forEach(btn => {
    if (btn.textContent === answer) btn.classList.add('correct-choice');
    else if (btn.textContent === chosen && chosen !== answer) btn.classList.add('wrong-choice');
  });

  if (chosen === answer) {
    treeState.score++;
    const expForm = toExponentForm(primeFactorize(num));
    fb.textContent = expForm
      ? `✅ 答對了！${num} = ${answer}，也可以寫成 ${expForm}`
      : `✅ 答對了！${num} = ${answer}`;
    fb.className = 'feedback correct';
  } else {
    fb.textContent = `差一點！${num} = ${answer}`;
    fb.className = 'feedback wrong';
  }
  recordMath(chosen === answer);
  try { if (window.GemMine) GemMine.onAnswer('fact', num, chosen === answer); } catch(e){}
  document.getElementById('treeScore').textContent = treeState.score;
  treeState.round++;
  showNextBtn(fb, nextTreeQuestion);
}

// ========== SECTION 8: CHICKENS & RABBITS ==========
let crState = {};

function newCR() {
  const rabbits = randInt(3, 15);
  const chickens = randInt(3, 20);
  const heads = rabbits + chickens;
  const legs = chickens * 2 + rabbits * 4;
  crState = { heads, legs, chickens, rabbits };

  document.getElementById('crHeads').textContent = heads;
  document.getElementById('crLegs').textContent = legs;
  document.getElementById('crSlider').max = heads;
  document.getElementById('crSlider').value = Math.floor(heads / 2);
  document.getElementById('crFeedback').textContent = '';
  document.getElementById('crFeedback').className = 'feedback';
  document.getElementById('crHint').style.display = 'none';
  updateCR();
}

function updateCR() {
  const slider = document.getElementById('crSlider');
  const chickenVal = parseInt(slider.value);
  const rabbitVal = crState.heads - chickenVal;
  const legVal = chickenVal * 2 + rabbitVal * 4;
  document.getElementById('crSliderVal').textContent = `雞：${chickenVal} 隻 ｜ 兔：${rabbitVal} 隻`;
  document.getElementById('crLegCount').textContent = `腿的數量：${chickenVal}×2 + ${rabbitVal}×4 = ${legVal}`;
  document.getElementById('crLegCount').style.color = legVal === crState.legs ? 'var(--c-english-ink)' : 'var(--ink-soft)';
}

function checkCR() {
  const chickenVal = parseInt(document.getElementById('crSlider').value);
  const rabbitVal = crState.heads - chickenVal;
  const fb = document.getElementById('crFeedback');

  if (chickenVal === crState.chickens) {
    fb.textContent = `🎉 答對了！${crState.chickens} 隻雞 + ${crState.rabbits} 隻兔 = ${crState.heads} 個頭、${crState.legs} 條腿`;
    fb.className = 'feedback correct';
    showConfetti();
  } else {
    const legVal = chickenVal * 2 + rabbitVal * 4;
    if (legVal > crState.legs) {
      fb.textContent = `腿太多了（${legVal} > ${crState.legs}），試試多一些雞！`;
    } else {
      fb.textContent = `腿太少了（${legVal} < ${crState.legs}），試試多一些兔！`;
    }
    fb.className = 'feedback wrong';
    // Show hint
    const hint = document.getElementById('crHint');
    hint.style.display = 'block';
    hint.textContent = `💡 提示：假設全部是雞，${crState.heads} 個頭就有 ${crState.heads * 2} 條腿。但現在有 ${crState.legs} 條腿，多了 ${crState.legs - crState.heads * 2} 條。每把一隻雞換成兔子就多 2 條腿，所以兔子有 ${(crState.legs - crState.heads * 2) / 2} 隻！`;
  }
  recordMath(chickenVal === crState.chickens);
}

// ========== SECTION 8: AGE PROBLEM ==========
let ageState = {};

function newAgeQuestion() {
  const types = [
    function() {
      const childAge = randInt(8, 12);
      const mult = randInt(3, 5);
      const parentAge = childAge * mult;
      const diff = parentAge - childAge;
      return {
        prompt: `爸爸的年齡是小明的 ${mult} 倍，兩人相差 ${diff} 歲。小明幾歲？`,
        answer: childAge,
        hint: `把小明畫成一條短長條，爸爸就是 ${mult} 條一樣長的長條接起來。爸爸比小明多了 ${mult - 1} 條，這 ${mult - 1} 條正好是相差的 ${diff} 歲。所以一條（小明的年齡）= ${diff} ÷ ${mult - 1} = ${childAge} 歲！`,
        choices: [childAge, childAge + 2, childAge - 2, childAge + mult]
      };
    },
    function() {
      const childAge = randInt(6, 14);
      const sibDiff = randInt(2, 5);
      const sibAge = childAge + sibDiff;
      const sum = childAge + sibAge;
      return {
        prompt: `姐姐比弟弟大 ${sibDiff} 歲，兩人年齡加起來是 ${sum} 歲。弟弟幾歲？`,
        answer: childAge,
        hint: `兩人加起來 ${sum} 歲，姐姐比弟弟大 ${sibDiff} 歲。先把差距去掉：${sum} - ${sibDiff} = ${sum - sibDiff}，這是兩個「弟弟的年齡」。所以弟弟 = ${sum - sibDiff} ÷ 2 = ${childAge} 歲！`,
        choices: [childAge, childAge + 1, childAge - 1, sibAge]
      };
    }
  ];

  const gen = types[randInt(0, types.length - 1)]();
  ageState = gen;
  ageState.answered = false;   // 每題重置作答鎖，避免連點重複記分

  document.getElementById('agePrompt').innerHTML = gen.prompt;
  document.getElementById('ageFeedback').textContent = '';
  document.getElementById('ageFeedback').className = 'feedback';
  document.getElementById('ageHintContent').className = 'step-content';
  document.getElementById('ageHintContent').textContent = '';

  const choices = new Set(gen.choices.filter(c => c > 0));
  while (choices.size < 4) {
    choices.add(gen.answer + randInt(-4, 4) || gen.answer + 1);
  }

  const grid = document.getElementById('ageChoices');
  grid.innerHTML = '';
  shuffle([...choices]).forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c + ' 歲';
    btn.onclick = function() { checkAgeAnswer(c); };
    grid.appendChild(btn);
  });
}

function checkAgeAnswer(chosen) {
  if (ageState.answered) return;   // 作答鎖：連點其他選項不再重複 recordMath 灌分
  ageState.answered = true;
  const fb = document.getElementById('ageFeedback');
  const btns = document.querySelectorAll('#ageChoices .choice-btn');
  btns.forEach(btn => {
    btn.disabled = true;
    if (parseInt(btn.textContent) === ageState.answer) btn.classList.add('correct-choice');
    else if (parseInt(btn.textContent) === chosen && chosen !== ageState.answer) btn.classList.add('wrong-choice');
  });

  if (chosen === ageState.answer) {
    fb.textContent = `✅ 答對了！答案是 ${ageState.answer} 歲！`;
    fb.className = 'feedback correct';
    showConfetti();
  } else {
    fb.textContent = `差一點！答案是 ${ageState.answer} 歲`;
    fb.className = 'feedback wrong';
  }
  recordMath(chosen === ageState.answer);
}

function revealAgeHint() {
  const content = document.getElementById('ageHintContent');
  content.textContent = ageState.hint;
  content.className = 'step-content visible';
}

// ========== SECTION 8: REMAINDER PROBLEM ==========
let remState = {};

function newRemQuestion() {
  const divisor = [3, 4, 5, 6, 7][randInt(0, 4)];
  const remainder = randInt(1, divisor - 1);
  const base = randInt(2, 5);
  const correctAnswer = divisor * base + remainder;

  const scenarios = [
    `${correctAnswer} 顆糖果分給 ${divisor} 個小朋友，每人一樣多，會剩幾顆？`,
    `把 ${correctAnswer} 個球裝進箱子，每箱 ${divisor} 個，最後一箱剩幾個？`,
    `${correctAnswer} 本書平均放在 ${divisor} 個書架上，會多出幾本？`
  ];

  remState = { divisor, remainder, number: correctAnswer, answered: false };

  document.getElementById('remPrompt').innerHTML = scenarios[randInt(0, scenarios.length - 1)];
  document.getElementById('remFeedback').textContent = '';
  document.getElementById('remFeedback').className = 'feedback';

  // 誘答只從「小於除數」的合法餘數中抽（含 0＝剛好分完），確保沒有選項 ≥ 除數。
  // 除數可能為 3，可用值只有 {0,1,2}，故將選項數上限設為 min(4, 除數)。
  const choices = new Set([remainder]);
  const maxChoices = Math.min(4, divisor);
  while (choices.size < maxChoices) {
    const c = randInt(0, divisor - 1);
    choices.add(c);
  }

  const grid = document.getElementById('remChoices');
  grid.innerHTML = '';
  shuffle([...choices]).forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c + (c === 0 ? '（剛好分完）' : ' 個');
    btn.onclick = function() { checkRemAnswer(c); };
    grid.appendChild(btn);
  });
}

function checkRemAnswer(chosen) {
  if (remState.answered) return;   // 作答鎖：連點其他選項不再重複 recordMath 灌分
  remState.answered = true;
  const fb = document.getElementById('remFeedback');
  const btns = document.querySelectorAll('#remChoices .choice-btn');
  btns.forEach(btn => {
    btn.disabled = true;
    if (parseInt(btn.textContent) === remState.remainder) btn.classList.add('correct-choice');
    else if (parseInt(btn.textContent) === chosen && chosen !== remState.remainder) btn.classList.add('wrong-choice');
  });

  if (chosen === remState.remainder) {
    fb.textContent = `✅ 答對了！${remState.number} ÷ ${remState.divisor} = ${Math.floor(remState.number / remState.divisor)} 餘 ${remState.remainder}`;
    fb.className = 'feedback correct';
    showConfetti();
  } else {
    fb.textContent = `差一點！${remState.number} ÷ ${remState.divisor} = ${Math.floor(remState.number / remState.divisor)} 餘 ${remState.remainder}`;
    fb.className = 'feedback wrong';
  }
  recordMath(chosen === remState.remainder);
}

// ========== INITIALIZATION ==========
function init() {
  startOddEven();
  startSieve();
  startPrimeQuiz();
  startFactorGame();
  startMultipleGame();
  startDivGame();
  startGcdGame();
  startLcmGame();
  startTreeGame();
  newCR();
  newAgeQuestion();
  newRemQuestion();
}

// Highlight active nav on scroll
function updateNavOnScroll() {
  const sections = ['sec1','sec2','sec3','sec4','sec5','sec6','sec7','sec8'];
  const navBtns = document.querySelectorAll('.nav-btn');
  let current = 0;

  sections.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top <= 100) {
      current = i;
    }
  });

  navBtns.forEach((btn, i) => {
    btn.classList.toggle('active', i === current);
  });
}

window.addEventListener('scroll', updateNavOnScroll);
window.addEventListener('DOMContentLoaded', init);

/* ---- (下一個原 inline <script> 區塊) ---- */

(function () {
  'use strict';

  var KEY = 'nt_gems_v1';
  var INTERVAL = { 1:1, 2:2, 3:4, 4:7, 5:15 };
  var REVIEW_TARGET = 12, REVIEW_CAP = 16;
  var MILE_XP = { first_gem:10, mined_10:20, mined_25:40, mined_all:150, polished_10:40, mine_mastered:300 };
  var VEIN_XP = 30;

  // ---- CATALOG：三條礦脈固定枚舉（決定性、可重建），與本頁題庫 1:1 對映 ----
  var PRIME_KEYS = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47];                 // 15
  var DIV_KEYS   = [2,3,4,5,6,9,10];                                            // 7
  var FACT_KEYS  = [12,18,20,24,28,30,36,40,42,45,48,50,54,56,60,72,80,90,100]; // 19
  var CATALOG = [];
  PRIME_KEYS.forEach(function (k) { CATALOG.push({ vein:'prime', key:k }); });
  DIV_KEYS.forEach(function (k) { CATALOG.push({ vein:'div', key:k }); });
  FACT_KEYS.forEach(function (k) { CATALOG.push({ vein:'fact', key:k }); });

  var VEIN_EMOJI = { prime:'💎', div:'🔶', fact:'🟣' };
  var VEIN_TITLE = { prime:'💎 質數原石', div:'🔶 整除符文', fact:'🟣 質因數礦脈' };

  function gemId(vein, key) { return (vein === 'prime' ? 'p:' : vein === 'div' ? 'd:' : 'f:') + key; }
  function today() {
    try { if (window.Game && Game.localDate) return Game.localDate(); } catch (e) {}
    return new Date().toISOString().slice(0, 10);
  }
  function addDays(dateStr, n) {
    var d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + n);
    try { if (window.Game && Game.localDate) return Game.localDate(d); } catch (e) {}
    return d.toISOString().slice(0, 10);
  }
  function reduceMotion() {
    try { return !!(window.Game && Game.getProfile && Game.getProfile().settings && Game.getProfile().settings.reduceMotion); } catch (e) { return false; }
  }

  // 重用本頁既有純函式（answerPrime/answerDiv/checkTreeAnswer 共用的邏輯）。
  function _isPrime(n) { return (typeof isPrime === 'function') ? isPrime(n) : null; }
  function _isDivisible(a, b) { return (typeof isDivisible === 'function') ? isDivisible(a, b) : (a % b === 0); }
  function _primeFactorize(n) { return (typeof primeFactorize === 'function') ? primeFactorize(n) : [n]; }
  function _randInt(a, b) { return (typeof randInt === 'function') ? randInt(a, b) : (a + Math.floor(Math.random() * (b - a + 1))); }
  function _shuffle(arr) { return (typeof shuffle === 'function') ? shuffle(arr) : arr.slice(); }

  var data = null;

  function freshGems() {
    var gems = {};
    CATALOG.forEach(function (c) {
      gems[gemId(c.vein, c.key)] = { vein:c.vein, key:c.key, box:0, lit:false, lastReviewedDate:null, dueDate:null, timesCorrect:0, timesSeen:0 };
    });
    return gems;
  }
  function ensureAllGems() {
    var base = freshGems();
    for (var id in base) { if (!data.gems[id]) data.gems[id] = base[id]; }
    if (!data.awarded) data.awarded = {};
  }
  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) {}
    if (raw) {
      try { var p = JSON.parse(raw); if (p && p.gems) { data = p; ensureAllGems(); return; } } catch (e) {}
    }
    // 無可安全對映的既有進度 → 從零開始收集；不回溯補發任何里程碑（awarded 起始為空）。
    data = { version:1, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), migratedFrom:null, gems:freshGems(), awarded:{} };
    save();
  }
  function save() {
    if (!data) return;
    data.updatedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  // ---- 統計 ----
  function minedCount() { var n = 0; for (var id in data.gems) if (data.gems[id].lit) n++; return n; }
  function polishedCount() { var n = 0; for (var id in data.gems) if (data.gems[id].box >= 5) n++; return n; }
  function veinAllMined(vein) {
    for (var id in data.gems) { var g = data.gems[id]; if (g.vein === vein && !g.lit) return false; }
    return true;
  }

  function satisfiedMilestones() {
    var out = [], mined = minedCount(), pol = polishedCount();
    if (mined >= 1) out.push('first_gem');
    if (mined >= 10) out.push('mined_10');
    if (mined >= 25) out.push('mined_25');
    if (veinAllMined('prime')) out.push('vein_prime_all');
    if (veinAllMined('div')) out.push('vein_div_all');
    if (veinAllMined('fact')) out.push('vein_fact_all');
    if (mined >= 41) out.push('mined_all');
    if (pol >= 10) out.push('polished_10');
    if (pol >= 41) out.push('mine_mastered');
    return out;
  }
  function mileXp(id) { if (MILE_XP[id] != null) return MILE_XP[id]; if (id.indexOf('vein_') === 0) return VEIN_XP; return 0; }
  function mileMsg(id) {
    switch (id) {
      case 'first_gem': return '💎 挖到第一顆寶石！';
      case 'mined_10': return '✨ 已開採 10 顆寶石！';
      case 'mined_25': return '✨ 已開採 25 顆寶石！';
      case 'vein_prime_all': return '💎 質數礦脈全部採齊！';
      case 'vein_div_all': return '🔶 整除符文全部採齊！';
      case 'vein_fact_all': return '🟣 質因數礦脈全部採齊！';
      case 'mined_all': return '🏆 41 顆寶石全部到手！';
      case 'polished_10': return '🌟 已琢磨 10 顆寶石！';
      case 'mine_mastered': return '👑 整座礦坑全部精通！';
    }
    return '🎉 達成新成就！';
  }
  function checkMilestones() {
    var s = satisfiedMilestones();
    for (var i = 0; i < s.length; i++) {
      var id = s[i];
      if (data.awarded[id]) continue;
      // 先設 guard → save → 再發 XP → 再 toast，確保中途關頁也不重領。
      data.awarded[id] = true;
      save();
      try { if (window.Game && Game.award) Game.award('math', mileXp(id), { silent:true, source:'gemmine-milestone', milestone:id }); } catch (e) {}
      try { if (window.Game && Game.showToast) Game.showToast(mileMsg(id), 'success'); } catch (e) {}
    }
  }

  // ---- 核心：一次作答 ----
  function onAnswer(vein, key, correct) {
    if (!data) load();
    var g = data.gems[gemId(vein, key)];
    if (!g) return; // 非本頁收錄（質數題的合數、num>47 等）
    g.timesSeen++;
    var t = today();
    if (correct) {
      g.lit = true;                              // 只 false→true，永不回退
      g.box = Math.min((g.box || 0) + 1, 5);     // 首採 0→1；達 5 維持 5
      g.timesCorrect++;
      g.lastReviewedDate = t;
      g.dueDate = addDays(t, INTERVAL[g.box]);
    } else {
      g.dueDate = t;                             // 答錯不退階、不熄滅、不扣分，只今天重排
    }
    save();
    if (correct) checkMilestones();
    if (isScreenOpen()) { renderGrid(); renderSummary(); }
    updateDueBadges();
  }
  // 篩法網格：逐格；質數(2..47) 未劃掉→對；質數被劃掉→錯；合數忽略。
  function onSieve(cells) {
    if (!cells) return;
    Array.prototype.forEach.call(cells, function (cell) {
      var num = parseInt(cell.dataset.num, 10);
      if (!(num >= 2 && num <= 47)) return;
      if (!_isPrime(num)) return; // 合數格忽略
      var eliminated = cell.classList.contains('eliminated');
      onAnswer('prime', num, !eliminated);
    });
  }

  // ---- 今日到期佇列 ----
  function dueGems(t) {
    var out = [];
    for (var id in data.gems) { var g = data.gems[id]; if (g.lit && g.dueDate && g.dueDate <= t) out.push(g); }
    out.sort(function (x, y) {
      if (x.dueDate !== y.dueDate) return x.dueDate < y.dueDate ? -1 : 1;
      if (x.box !== y.box) return x.box - y.box;
      return gemId(x.vein, x.key) < gemId(y.vein, y.key) ? -1 : 1;
    });
    return out;
  }
  function dueCount() { if (!data) load(); return dueGems(today()).length; }
  function buildQueue() {
    var t = today();
    var queue = dueGems(t).map(function (g) { return { vein:g.vein, key:g.key }; });
    if (queue.length < REVIEW_TARGET) {
      for (var i = 0; i < CATALOG.length && queue.length < REVIEW_TARGET; i++) {
        var c = CATALOG[i], g = data.gems[gemId(c.vein, c.key)];
        if (!g.lit) queue.push({ vein:c.vein, key:c.key });
      }
    }
    return queue.slice(0, REVIEW_CAP);
  }

  // ---- 畫面：礦坑圖鑑 ----
  function isScreenOpen() { var el = document.getElementById('gemMineOverlay'); return el && !el.hidden; }
  function glyph(g) { if (!g.lit) return '◇'; if (g.box >= 5) return '🌟'; return '💎'; }
  function statusText(g) {
    if (!g.lit) return '未開採';
    if (g.box >= 5) return '已琢磨（第 5 盒）';
    return '第 ' + g.box + ' 個寶石盒';
  }
  function veinKeysOf(vein) { return vein === 'prime' ? PRIME_KEYS : vein === 'div' ? DIV_KEYS : FACT_KEYS; }
  function renderGrid() {
    if (!data) load();
    var host = document.getElementById('gemMineGrids');
    if (!host) return;
    var t = today(), html = '';
    ['prime', 'div', 'fact'].forEach(function (vein) {
      html += '<div class="gm-vein-title">' + VEIN_TITLE[vein] + '</div><div class="gm-grid">';
      veinKeysOf(vein).forEach(function (key) {
        var g = data.gems[gemId(vein, key)];
        var due = (g.lit && g.dueDate && g.dueDate <= t);
        var cls = 'gm-gem gm-' + vein + ' box' + g.box + (g.lit ? ' lit' : ' unlit') + (due ? ' due' : '');
        var badge = '';
        if (g.lit && g.box >= 5) badge = '<span class="gm-star-badge">★</span>';
        else if (g.lit && g.box >= 1) { var dots = ''; for (var i = 0; i < g.box; i++) dots += '<i></i>'; badge = '<span class="gm-box-badge">' + dots + '</span>'; }
        var label = key + '（' + statusText(g) + (due ? '，今天待複習' : '') + '）';
        html += '<div class="' + cls + '" role="button" tabindex="0" title="' + label + '" aria-label="' + label + '"' +
          ' onclick="GemMine.openFocus(\'' + vein + '\',' + key + ')">' +
          '<span class="gm-glyph">' + glyph(g) + '</span><span class="gm-key">' + key + '</span>' + badge + '</div>';
      });
      html += '</div>';
    });
    host.innerHTML = html;
    var card = document.getElementById('gemMineCard');
    if (card) card.classList.toggle('gm-reduce', reduceMotion());
  }
  function renderSummary() {
    var el = document.getElementById('gemMineSummary');
    if (!el) return;
    var n = minedCount(), m = polishedCount(), d = dueCount();
    el.innerHTML = d > 0
      ? '已開採 <b>' + n + '</b>/41 顆　·　已琢磨 <b>' + m + '</b> 顆　·　今天有 <b>' + d + '</b> 顆想再看看你 🔵'
      : '已開採 <b>' + n + '</b>/41 顆　·　已琢磨 <b>' + m + '</b> 顆　·　今天都採完了，明天見！';
    var rb = document.getElementById('gemMineReviewBtn');
    if (rb) rb.textContent = '🔭 開始今日複習（' + d + '）';
  }
  function updateDueBadges() {
    if (!data) load();
    var d = dueCount();
    var badge = document.getElementById('gemMineFabBadge');
    if (badge) { if (d > 0) { badge.hidden = false; badge.textContent = '🔵 ' + d; } else { badge.hidden = true; } }
    if (isScreenOpen()) renderSummary();
  }

  function openScreen() { if (!data) load(); closeFocus(); closeReview(); renderGrid(); renderSummary(); document.getElementById('gemMineOverlay').hidden = false; }
  function closeScreen() { var o = document.getElementById('gemMineOverlay'); if (o) o.hidden = true; }

  function openFocus(vein, key) {
    if (!data) load();
    var g = data.gems[gemId(vein, key)];
    if (!g) return;
    var t = today(), body = document.getElementById('gemFocusBody');
    var status = !g.lit ? '還沒開採，答對一次就會挖到它 ✨'
      : (g.box >= 5 ? '已經琢磨完成囉！（第 5 盒 🌟）' : '目前在第 ' + g.box + ' 個寶石盒');
    var when = '';
    if (g.lit && g.dueDate) when = (g.dueDate <= t) ? '今天很適合再看看它 🔵' : '下次複習日：' + g.dueDate;
    body.innerHTML =
      '<div class="gm-focus-glyph">' + glyph(g) + '</div>' +
      '<div class="gm-focus-fact">' + VEIN_EMOJI[vein] + ' ' + key + '</div>' +
      '<div class="gm-focus-meta">' + status + (when ? '<br>' + when : '') + '<br>答對 ' + g.timesCorrect + ' 次</div>' +
      '<button class="gm-btn" onclick="GemMine.practiceOne(\'' + vein + '\',' + key + ')">✏️ 練這顆</button>';
    document.getElementById('gemFocusOverlay').hidden = false;
  }
  function closeFocus() { var o = document.getElementById('gemFocusOverlay'); if (o) o.hidden = true; }

  // ---- 複習跑者（模組自備極簡答題器，重用本頁純函式產題/批改） ----
  var review = null;

  function makeQuestion(item) {
    if (item.vein === 'prime') {
      // 複習的仍是這顆質數寶石（key 不變，SRS 照常給分、佇列照常清空）；
      // 但偶爾改用一個「合數」來問是/否，讓題目有鑑別度（否則答案恆為「是」）。
      var showN = item.key;
      if (Math.random() < 0.4) { showN = _randInt(2, 9) * _randInt(2, 9); } // 兩個 ≥2 的因數相乘，必為合數
      return { vein:'prime', key:item.key, type:'bool', q:VEIN_EMOJI.prime + ' ' + showN + ' 是質數嗎？', sub:'質數只能被 1 和自己整除', answer:_isPrime(showN), yes:'是質數', no:'不是質數' };
    }
    if (item.vein === 'div') {
      var by = item.key, num;
      if (Math.random() > 0.4) num = by * _randInt(6, 29);
      else num = by * _randInt(6, 29) + _randInt(1, by - 1);
      return { vein:'div', key:by, type:'bool', q:VEIN_EMOJI.div + ' ' + num + ' 能被 ' + by + ' 整除嗎？', sub:'想想 ' + by + ' 的整除口訣', answer:_isDivisible(num, by), num:num, yes:'能整除', no:'不能整除' };
    }
    // fact
    var n = item.key, factors = _primeFactorize(n), answer = factors.join(' × ');
    var choices = {}; choices[answer] = true;
    var guard = 0;
    while (Object.keys(choices).length < 4 && guard < 40) {
      guard++;
      var wf = factors.slice(), method = _randInt(0, 3);
      if (method === 0 && wf.length > 1) { var i = _randInt(0, wf.length - 2); wf[i] = wf[i] * wf[i + 1]; wf.splice(i + 1, 1); }
      else if (method === 1) { var j = _randInt(0, wf.length - 1); wf[j] = wf[j] + (Math.random() > 0.5 ? 1 : -1); if (wf[j] < 2) wf[j] = 2; }
      else if (method === 2) { wf.push(_randInt(2, 5)); }
      else { if (wf.length > 1) wf.splice(_randInt(0, wf.length - 1), 1); }
      var w = wf.sort(function (a, b) { return a - b; }).join(' × ');
      if (w !== answer) choices[w] = true;
    }
    return { vein:'fact', key:n, type:'choice', q:VEIN_EMOJI.fact + ' ' + n + ' 的質因數分解？', sub:'選出正確的質因數乘積', answer:answer, choices:_shuffle(Object.keys(choices)) };
  }

  function startReview() {
    if (!data) load();
    closeFocus();
    var q = buildQueue();
    if (!q.length) { showReviewEmpty(); return; }
    beginRun(q.map(makeQuestion));
  }
  function practiceOne(vein, key) {
    if (!data) load();
    closeFocus();
    beginRun([makeQuestion({ vein:vein, key:key })]);
  }
  function beginRun(questions) {
    review = { questions:questions, idx:0, correct:0, total:questions.length, answered:false };
    closeScreen();
    document.getElementById('gemReviewOverlay').hidden = false;
    renderReview();
  }
  function closeReview() { var o = document.getElementById('gemReviewOverlay'); if (o) o.hidden = true; review = null; }

  function showReviewEmpty() {
    var body = document.getElementById('gemReviewBody');
    body.innerHTML =
      '<div class="gm-rev-q">🌙 今天都採完了</div>' +
      '<div class="gm-focus-meta">寶石們正在礦坑裡好好休息，明天再來挖更多吧！</div>' +
      '<div class="gm-actions"><button class="gm-btn" onclick="GemMine.openScreen()">看看礦坑</button>' +
      '<button class="gm-btn secondary" onclick="GemMine.closeReview()">返回</button></div>';
    document.getElementById('gemReviewOverlay').hidden = false;
  }

  function renderReview() {
    var body = document.getElementById('gemReviewBody');
    if (!review) return;
    if (review.idx >= review.total) { renderReviewResult(); return; }
    var q = review.questions[review.idx];
    review.answered = false;
    var html = '<div class="gm-rev-progress">' + (review.idx + 1) + ' / ' + review.total + '</div>' +
      '<div class="gm-rev-q">' + q.q + '</div><div class="gm-rev-sub">' + q.sub + '</div>' +
      '<div class="gm-rev-answers" id="gemRevAnswers"></div>' +
      '<div class="gm-rev-fb" id="gemRevFb"></div>';
    body.innerHTML = html;
    var wrap = document.getElementById('gemRevAnswers');
    if (q.type === 'bool') {
      addAnsBtn(wrap, q.yes, function () { answerCurrent(true, this); });
      addAnsBtn(wrap, q.no, function () { answerCurrent(false, this); });
    } else {
      q.choices.forEach(function (c) { addAnsBtn(wrap, c, function () { answerChoice(c, this); }); });
    }
  }
  function addAnsBtn(wrap, text, handler) {
    var b = document.createElement('button');
    b.className = 'gm-ans-btn'; b.textContent = text;
    b.addEventListener('click', handler);
    wrap.appendChild(b);
  }
  function answerCurrent(userSaysYes, btn) {
    if (!review || review.answered) return;
    review.answered = true;
    var q = review.questions[review.idx];
    var correct = (userSaysYes === q.answer);
    finishQuestion(q, correct, btn, null);
  }
  function answerChoice(chosen, btn) {
    if (!review || review.answered) return;
    review.answered = true;
    var q = review.questions[review.idx];
    var correct = (chosen === q.answer);
    finishQuestion(q, correct, btn, chosen);
  }
  function finishQuestion(q, correct, btn, chosenText) {
    onAnswer(q.vein, q.key, correct);
    if (correct) review.correct++;
    var fb = document.getElementById('gemRevFb');
    var btns = document.querySelectorAll('#gemRevAnswers .gm-ans-btn');
    Array.prototype.forEach.call(btns, function (b) { b.disabled = true; });
    if (q.type === 'choice') {
      Array.prototype.forEach.call(btns, function (b) {
        if (b.textContent === q.answer) b.classList.add('correct-choice');
        else if (chosenText != null && b.textContent === chosenText && !correct) b.classList.add('wrong-choice');
      });
    } else if (btn) {
      btn.classList.add(correct ? 'correct-choice' : 'wrong-choice');
    }
    if (fb) {
      if (correct) { fb.textContent = '✅ 答對了！寶石更亮了一點 ✨'; fb.className = 'gm-rev-fb correct'; }
      else {
        var right = q.type === 'choice' ? ('正確答案：' + q.answer) : (q.answer ? '正確答案：' + q.yes : '正確答案：' + q.no);
        fb.textContent = '沒關係，等一下再遇到它就會更熟 ✨（' + right + '）';
        fb.className = 'gm-rev-fb wrong';
      }
    }
    review.idx++;
    setTimeout(function () { if (review) renderReview(); }, correct ? 1100 : 2400);
  }
  function renderReviewResult() {
    var body = document.getElementById('gemReviewBody');
    body.innerHTML =
      '<div class="gm-rev-q">🔭 今日複習完成！</div>' +
      '<div class="gm-focus-fact">' + review.correct + ' / ' + review.total + '</div>' +
      '<div class="gm-focus-meta">寶石又更亮了一點 ✨</div>' +
      '<div class="gm-actions"><button class="gm-btn" onclick="GemMine.openScreen()">回礦坑</button>' +
      '<button class="gm-btn secondary" onclick="GemMine.closeReview()">返回</button></div>';
    review = null;
    updateDueBadges();
  }

  // ---- 附加 DOM（皆 append 於 body 尾端，不動既有 section；浮層皆帶 [hidden]） ----
  function buildDom() {
    var host = document.createElement('div');
    host.innerHTML =
      '<button id="gemMineFab" type="button" aria-label="打開質數寶石礦坑" onclick="GemMine.openScreen()">' +
        '💎 礦坑 <span id="gemMineFabBadge" hidden></span></button>' +
      '<div id="gemMineOverlay" class="gm-overlay" hidden>' +
        '<div id="gemMineCard" class="gm-card" role="dialog" aria-modal="true" aria-label="質數寶石礦坑">' +
          '<div class="gm-head"><h1>💎 質數寶石礦坑</h1>' +
            '<button class="gm-back" onclick="GemMine.closeScreen()">← 返回</button></div>' +
          '<div id="gemMineSummary" class="gm-summary"></div>' +
          '<div class="gm-legend"><span>◇ 未開採</span><span>💎 開採中</span><span>🌟 已琢磨</span><span>🔵 今天待複習</span></div>' +
          '<div id="gemMineGrids"></div>' +
          '<div class="gm-actions"><button id="gemMineReviewBtn" class="gm-btn" onclick="GemMine.startReview()">🔭 開始今日複習（0）</button></div>' +
        '</div></div>' +
      '<div id="gemFocusOverlay" class="gm-overlay" hidden>' +
        '<div class="gm-card gm-narrow" role="dialog" aria-modal="true" aria-label="寶石細節">' +
          '<div class="gm-head"><h1 style="font-size:1.1rem;">寶石</h1>' +
            '<button class="gm-back" onclick="GemMine.closeFocus()">← 返回</button></div>' +
          '<div id="gemFocusBody"></div>' +
        '</div></div>' +
      '<div id="gemReviewOverlay" class="gm-overlay" hidden>' +
        '<div class="gm-card gm-narrow" role="dialog" aria-modal="true" aria-label="今日複習">' +
          '<div class="gm-head"><h1 style="font-size:1.1rem;">🔭 今日複習</h1>' +
            '<button class="gm-back" onclick="GemMine.closeReview()">← 返回</button></div>' +
          '<div id="gemReviewBody"></div>' +
        '</div></div>';
    while (host.firstChild) document.body.appendChild(host.firstChild);
  }

  window.GemMine = {
    onAnswer: onAnswer,
    onSieve: onSieve,
    openScreen: openScreen,
    closeScreen: closeScreen,
    openFocus: openFocus,
    closeFocus: closeFocus,
    startReview: startReview,
    practiceOne: practiceOne,
    closeReview: closeReview,
    dueCount: dueCount
  };

  // 初始化
  function boot() { buildDom(); load(); updateDueBadges(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

/* ---- (下一個原 inline <script> 區塊) ---- */

/* kbd-activate-delegation: role=button 的 div 可用 Enter/空白鍵觸發 */
document.addEventListener("keydown",function(e){if(e.key!=="Enter"&&e.key!==" ")return;var t=e.target;if(t&&t.getAttribute&&t.getAttribute("role")==="button"&&t.tagName!=="BUTTON"&&t.tagName!=="A"&&t.tagName!=="INPUT"&&t.tagName!=="TEXTAREA"&&!t.hasAttribute("onkeydown")){e.preventDefault();t.click();}});
