// @ts-nocheck — 機械式 legacy JS→TS 遷移：verbatim 轉檔、行為等價；型別檢查延後
/* =====================================================================
 * _template_ref.ts  →  (tsc, tsconfig.legacy.json) →  _template_ref.js
 * 原為 _template_ref.html 的 inline <script>；逐檔 TS 遷移抽出成 sibling .js。
 * 行為與原 inline 版等價（verbatim；載入位置不變＝執行時機/順序不變）。
 * 以 IIFE 包住讓頂層名稱為檔案區域（避免 tsc 共用全域型別檢查時與他檔同名衝突）。
 * ===================================================================== */
(function () {
// ---- 範本引擎：示範 §3 型C（u-card 選單 → q-stage 測驗 → result-card）----
var LEVELS = [
  { id:'l1', emoji:'🌱', name:'觀察力', sub:'先看清楚再判斷', qs:[
      {p:'植物行光合作用主要吸收哪種氣體？', opts:['二氧化碳','氧氣'], a:0, why:'植物吸收二氧化碳、放出氧氣。'},
      {p:'種子發芽最需要下列哪一項？', opts:['適當的水分','完全的黑暗'], a:0, why:'水分讓種子甦醒、開始發芽。'},
  ]},
  { id:'l2', emoji:'🔎', name:'推理力', sub:'從線索推出答案', qs:[
      {p:'看到地上是濕的、天空有雲，最合理的推論是？', opts:['剛剛下過雨','有人在放風箏'], a:0, why:'濕地面＋雲，最合理是下過雨。'},
      {p:'哪一個是「原因」，哪一個是「結果」：太陽曬→水蒸發', opts:['太陽曬是原因','水蒸發是原因'], a:0, why:'先有太陽曬（原因），才有水蒸發（結果）。'},
  ]},
  { id:'l3', emoji:'🧩', name:'歸納力', sub:'把線索拼起來', qs:[
      {p:'貓、狗、鯨魚都會哺乳，牠們同屬？', opts:['哺乳類','爬蟲類'], a:0, why:'會哺乳、多為胎生，屬哺乳類。'},
      {p:'下列何者「不是」昆蟲？', opts:['蜘蛛','螞蟻'], a:0, why:'蜘蛛有八隻腳、非昆蟲；昆蟲是六隻腳。'},
  ]},
];
var done = {}, starTotal = 0;
function $(id){ return document.getElementById(id); }
function show(id){ ['screen-menu','screen-play'].forEach(function(s){ $(s).classList.toggle('active', s===id); }); window.scrollTo(0,0); if(window.Game&&Game.pingActive)Game.pingActive(); }

function renderMenu(){
  var html = LEVELS.map(function(lv,i){
    var d = done[lv.id];
    return '<button type="button" class="card u-card" data-i="'+i+'">'+
      '<div class="u-card__top"><span class="u-card__icon" style="background:var(--accent-tint)">'+lv.emoji+'</span>'+
        '<div><div class="u-card__num">關卡 '+(i+1)+'</div><div class="u-card__name">'+lv.name+'</div></div></div>'+
      '<div class="u-card__desc">'+lv.sub+'</div>'+
      '<div class="u-card__foot"><span class="u-card__status '+(d?'done':'todo')+'">'+(d?('✅ 已完成 ⭐'+d):('▶️ 開始挑戰（共 '+lv.qs.length+' 題）'))+'</span>'+
        '<span class="u-card__dots">'+lv.qs.map(function(){return '<i></i>';}).join('')+'</span></div>'+
      '</button>';
  }).join('');
  $('level-list').innerHTML = html;
  Array.prototype.forEach.call($('level-list').querySelectorAll('.u-card'), function(b){ b.addEventListener('click', function(){ startLevel(+b.getAttribute('data-i')); }); });
  $('ov-done').textContent = Object.keys(done).length + '/' + LEVELS.length;
  $('ov-star').textContent = starTotal;
}

var cur, idx, correct;
function startLevel(i){ cur = LEVELS[i]; idx = 0; correct = 0; $('play-title').textContent = '關卡 '+(i+1)+'・'+cur.name; show('screen-play'); renderQ(); }
function renderDots(){ $('step-dots').innerHTML = cur.qs.map(function(_,j){ return '<i class="'+(j<idx?'on':(j===idx?'cur':''))+'"></i>'; }).join(''); }
function renderQ(){
  renderDots();
  var q = cur.qs[idx];
  // §3 型C(c)：q-stage 置中 q-prompt(≤32ch) + q-options(.q-opt + __mark) + q-feedback 左彩條
  var opts = q.opts.map(function(o,oi){ return '<button type="button" class="q-opt" data-oi="'+oi+'"><span>'+o+'</span><span class="q-opt__mark" aria-hidden="true"></span></button>'; }).join('');
  $('stage').innerHTML =
    '<div class="q-stage">'+
      '<div class="q-visual" aria-hidden="true">'+cur.emoji+'</div>'+
      '<p class="q-prompt">'+q.p+'</p>'+
      '<div class="q-options">'+opts+'</div>'+
      '<div class="q-feedback" id="fb"></div>'+
    '</div>'+
    '<div class="q-actions" id="after" style="display:none"><button type="button" class="btn btn-primary btn-block" id="next">繼續 ➡️</button></div>';
  var btns = $('stage').querySelectorAll('.q-opt');
  Array.prototype.forEach.call(btns, function(b){ b.addEventListener('click', function(){ answer(+b.getAttribute('data-oi'), btns, q); }); });
  $('next').addEventListener('click', next);
}
function answer(oi, btns, q){
  Array.prototype.forEach.call(btns, function(b){ b.disabled = true; });
  var ok = oi === q.a;
  if(ok) correct++;
  btns[oi].classList.add(ok?'correct':'wrong');
  if(!ok) btns[q.a].classList.add('correct');
  var fb = $('fb');
  fb.className = 'q-feedback show ' + (ok?'is-ok':'is-no');
  fb.textContent = (ok?'✅ 答對了！':'💡 再看看～') + q.why;
  $('after').style.display = '';
}
function next(){ idx++; if(idx >= cur.qs.length) finish(); else renderQ(); }
function finish(){
  done[cur.id] = correct; starTotal = 0; for(var k in done) starTotal += done[k];
  // §3 型C(e)：result-card
  $('stage').innerHTML =
    '<div class="result-card">'+
      '<div class="result-card__emoji">'+(correct===cur.qs.length?'🎉':'🌱')+'</div>'+
      '<div class="result-card__stars">'+('⭐'.repeat(correct)||'—')+'</div>'+
      '<div class="result-card__title">'+correct+' / '+cur.qs.length+'</div>'+
      '<div class="result-card__sub">'+(correct===cur.qs.length?'全對！太棒了！':'不錯，再練會更好！')+'</div>'+
    '</div>'+
    '<div class="q-actions"><button type="button" class="btn btn-primary btn-block" id="toMenu">回到選單</button></div>';
  $('step-dots').innerHTML = '';
  $('toMenu').addEventListener('click', function(){ renderMenu(); show('screen-menu'); });
}

$('btn-back').addEventListener('click', function(){ renderMenu(); show('screen-menu'); });
renderMenu();

})();
