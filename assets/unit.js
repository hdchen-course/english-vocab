/* unit.js — 英語島 communicative 單元頁共用渲染引擎。
   單元資料路徑讀 <body data-units="xxx.units.json">；所有 *.units 單元頁共用一份邏輯，避免各頁複製漂移。
   原則：語感優先、音檔真實播放、自評不自動判讀（翻答案自己判）、聽寫/跟讀為核心模態。 */
(function(){
  function play(f){ try{ new Audio('audio/'+f+'.mp3').play(); }catch(e){} }
  function el(tag, cls, html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
  function esc(s){ return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  function rateRow(levels){
    const wrap=el('div','gr-rate'); (levels||["還不熟","快會了","會了"]).forEach(l=>{
      const b=el('button',null, esc(l));
      b.onclick=()=>{ [...wrap.children].forEach(x=>x.classList.remove('sel')); b.classList.add('sel'); };
      wrap.appendChild(b);
    }); return wrap;
  }
  // 手寫作答 canvas：手指/觸控筆書寫；不自動判讀（寫完翻答案自評）。basic canvas，無 Pencil 專屬 API。
  function makeCanvas(){
    const box=el('div','gr-canvas-box');
    const cv=document.createElement('canvas'); cv.className='gr-canvas';
    cv.setAttribute('role','img'); cv.setAttribute('aria-label','手寫作答區，用手指或觸控筆寫下聽到的句子');
    box.appendChild(cv);
    const ctx=cv.getContext('2d'); let drawing=false, last=null, sized=false;
    function size(){ const r=cv.getBoundingClientRect(); if(!r.width||!r.height) return;
      const dpr=window.devicePixelRatio||1; cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.lineWidth=2.6; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#33312E'; sized=true; }
    function pt(e){ const r=cv.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; }
    cv.addEventListener('pointerdown',e=>{ if(!sized)size(); drawing=true; last=pt(e);
      try{cv.setPointerCapture(e.pointerId);}catch(_){} e.preventDefault(); });
    cv.addEventListener('pointermove',e=>{ if(!drawing)return; const p=pt(e);
      ctx.beginPath(); ctx.moveTo(last[0],last[1]); ctx.lineTo(p[0],p[1]); ctx.stroke(); last=p; e.preventDefault(); });
    const stop=()=>{ drawing=false; }; ['pointerup','pointercancel','pointerleave'].forEach(ev=>cv.addEventListener(ev,stop));
    function clear(){ if(!sized)size(); if(sized) ctx.clearRect(0,0,cv.width,cv.height); }
    requestAnimationFrame(size); window.addEventListener('resize',()=>{sized=false; requestAnimationFrame(size);});
    return { box, clear };
  }

  const src=document.body.getAttribute('data-units');
  fetch(src,{cache:'no-store'}).then(r=>r.json()).then(data=>{
    const u=data.units[0], root=document.getElementById('root');
    root.innerHTML='';
    const layout=el('div','gr-layout'); const side=el('aside','gr-side'); const main=el('div','gr-main');
    layout.appendChild(side); layout.appendChild(main); root.appendChild(layout);

    // 左欄：can-do + 章節跳轉
    const cd=el('div','gr-cando'); cd.innerHTML=
      `<div class="lab">我學得會（can-do）· ${esc(u.situation_group)}</div><div class="txt">${esc(u.can_do)}</div>`;
    side.appendChild(cd);
    const nav=el('nav','gr-nav'); nav.setAttribute('aria-label','單元章節');
    [['s1','① 先聽、先感覺'],['s2','② 練一練'],['s3','③ 跟著讀 ＋ 模仿語調'],['s4','④ 我到哪一步了']].forEach(([id,t])=>{
      const a=el('a',null,esc(t)); a.href='#'+id; nav.appendChild(a);
    });
    side.appendChild(nav);

    // 右欄：① 教
    main.appendChild(el('h2','gr-h','① 先聽、先感覺')).id='s1';
    u.teach.forEach(t=>{
      const c=el('div','gr-card');
      if(t.audio){ const b=el('button','gr-play','🔊 聽'); b.onclick=()=>play(t.audio); c.appendChild(b); }
      c.appendChild(el('span','gr-en', esc(t.body)));
      main.appendChild(c);
    });

    // ② 練
    main.appendChild(el('h2','gr-h','② 練一練')).id='s2';
    u.practice.forEach(p=>{
      const c=el('div','gr-card');
      c.appendChild(el('div','gr-en', esc(p.stem)));
      if(p.type==='dictation'){
        const pad=makeCanvas(); c.appendChild(pad.box);
        // 鍵盤輸入框：與 canvas 同一位置切換（擇一顯示）；系統不批改，翻答案自評。
        const ta=el('textarea','gr-ta'); ta.rows=3; ta.hidden=true;
        ta.setAttribute('aria-label','鍵盤輸入（可選）');
        ta.placeholder='想打字的話在這裡寫（系統不會批改，翻答案自己對）';
        c.appendChild(ta);
        const hint=el('div','gr-hint','用手指或觸控筆在上面寫（寫在淡線上）；可重複按🔊聽。寫完按「看答案對照」自己核對。');
        c.appendChild(hint);
        const tools=el('div','gr-tools');
        const b=el('button','gr-play','🔊 聽（可重複）'); b.onclick=()=>play(p.audio); tools.appendChild(b);
        const clr=el('button','gr-play','🧽 清除'); tools.appendChild(clr);
        const kbtn=el('button','gr-play','⌨️ 改用鍵盤'); tools.appendChild(kbtn);
        const rev=el('button','gr-play','看答案對照'); tools.appendChild(rev);
        c.appendChild(tools);
        let kb=false;
        kbtn.onclick=()=>{ kb=!kb; pad.box.hidden=kb; ta.hidden=!kb;
          kbtn.textContent = kb ? '✏️ 改用手寫' : '⌨️ 改用鍵盤';
          hint.textContent = kb ? '用鍵盤打字（系統不批改）；可重複按🔊聽。寫完按「看答案對照」自己核對。'
                                : '用手指或觸控筆在上面寫（寫在淡線上）；可重複按🔊聽。寫完按「看答案對照」自己核對。';
          if(kb) setTimeout(()=>ta.focus(),0); };   // focus → iPad 底下跳出鍵盤
        clr.onclick=()=>{ if(kb){ ta.value=''; ta.focus(); } else pad.clear(); };
        const ans=el('div','gr-fb', '正解：<b>'+esc(p.answer)+'</b><br>'+esc(p.feedback));
        rev.onclick=()=>ans.classList.add('show'); c.appendChild(ans);
        c.appendChild(rateRow());
      } else {
        const opts=el('div','gr-opts');
        (p.options||[]).forEach(o=>{
          const b=el('button','gr-opt', esc(o));
          b.onclick=()=>{
            if(o===p.answer){ b.classList.add('correct'); }
            else { b.classList.add('wrong');
              const dr=(p.distractor_rationales||{})[o]; if(dr) b.innerHTML=esc(o)+' <span style="font-size:12px;color:var(--ink-soft)">— '+esc(dr)+'</span>'; }
            fb.classList.add('show');
          };
          opts.appendChild(b);
        });
        c.appendChild(opts);
        const fb=el('div','gr-fb', '✓ '+esc(p.feedback)); c.appendChild(fb);
      }
      main.appendChild(c);
    });

    // ③ 跟著讀
    if(u.shadowing){
      main.appendChild(el('h2','gr-h','③ 跟著讀 ＋ 模仿語調')).id='s3';
      const c=el('div','gr-card');
      c.appendChild(el('div','gr-note', esc(u.shadowing.note)));
      u.shadowing.lines.forEach(l=>{
        const row=el('div'); row.style.cssText='display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap';
        const b=el('button','gr-play','🔊'); b.onclick=()=>play(l.audio); row.appendChild(b);
        row.appendChild(el('span','gr-en', esc(l.text)));
        row.appendChild(el('span','gr-note','（'+esc(l.intonation)+'）'));
        c.appendChild(row);
      });
      c.appendChild(rateRow()); main.appendChild(c);
    }

    // ④ 自評
    main.appendChild(el('h2','gr-h','④ 我到哪一步了')).id='s4';
    const se=el('div','gr-card');
    se.appendChild(rateRow(u.selfeval));
    se.appendChild(el('div','gr-note', esc(u.selfeval_note||'')));
    main.appendChild(se);

    main.appendChild(el('footer','gr-foot',
      '資料來源：'+esc(src)+'（Phase 2 英語島單元）。音檔為 edge-tts 童聲真實語音。自評不自動判讀，翻答案自己判斷。'));
  }).catch(e=>{ document.getElementById('root').innerHTML='<p>載入失敗（請用 http 開啟，勿用 file://）：'+esc(e)+'</p>'; });
})();
