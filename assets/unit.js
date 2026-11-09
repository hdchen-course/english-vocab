/* unit.js — 英語島 communicative 單元頁共用渲染引擎。
   單元資料路徑讀 <body data-units="xxx.units.json">；所有 *.units 單元頁共用一份邏輯，避免各頁複製漂移。
   原則：語感優先、音檔真實播放、自評不自動判讀（翻答案自己判）、聽寫/跟讀為核心模態。 */
(function(){
  function play(f){ try{ new Audio('audio/'+f+'.mp3').play(); }catch(e){} }
  // 跟讀用：錄自己唸→聽自己（純前端 MediaRecorder，不上傳、不批改發音，只給自己聽、對照模型音）
  function mkRec(){
    const wrap=el('span'); wrap.style.cssText='display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap';
    let rec=null, chunks=[], url=null, stream=null;
    const recBtn=el('button','gr-play','🎙️ 錄我的');
    const playBtn=el('button','gr-play','▶ 聽我的'); playBtn.disabled=true; playBtn.style.opacity='.5';
    if(!(navigator.mediaDevices && window.MediaRecorder)){ recBtn.disabled=true; recBtn.textContent='🎙️（此裝置不支援錄音）'; recBtn.style.opacity='.5'; return wrap.appendChild(recBtn), wrap; }
    recBtn.onclick=async()=>{
      if(rec && rec.state==='recording'){ rec.stop(); return; }
      try{ stream=await navigator.mediaDevices.getUserMedia({audio:true}); }
      catch(e){ recBtn.textContent='🎙️ 請允許麥克風'; return; }
      chunks=[]; try{ rec=new MediaRecorder(stream); }catch(e){ recBtn.textContent='🎙️（此裝置不支援錄音）'; return; }
      rec.ondataavailable=e=>{ if(e.data && e.data.size) chunks.push(e.data); };
      rec.onstop=()=>{
        if(url) URL.revokeObjectURL(url);
        url=URL.createObjectURL(new Blob(chunks,{type:(chunks[0]&&chunks[0].type)||'audio/webm'}));
        playBtn.disabled=false; playBtn.style.opacity='1'; recBtn.textContent='🎙️ 再錄一次';
        try{ stream.getTracks().forEach(t=>t.stop()); }catch(_){}
      };
      rec.start(); recBtn.textContent='⏹ 停止';
    };
    playBtn.onclick=()=>{ if(url){ try{ new Audio(url).play(); }catch(e){} } };
    wrap.appendChild(recBtn); wrap.appendChild(playBtn); return wrap;
  }
  function el(tag, cls, html){ const e=document.createElement(tag); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; }
  function esc(s){ return String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  function rateRow(levels, onPick){
    const lv=(levels||["還不熟","快會了","會了"]);
    const wrap=el('div','gr-rate'); lv.forEach((l,idx)=>{
      const b=el('button',null, esc(l));
      b.onclick=()=>{ [...wrap.children].forEach(x=>x.classList.remove('sel')); b.classList.add('sel');
        // 進度模組未載入時 graceful no-op（§6.3）：僅在提供 onPick 的實例（④ 自評）才記錄。
        if(typeof onPick==='function'){ try{ onPick(l, idx, lv); }catch(e){} } };
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
      const dpr=window.devicePixelRatio||1; const nw=Math.round(r.width*dpr), nh=Math.round(r.height*dpr);
      // 尺寸沒變就「完全不動」backing store：指派 cv.width/height（即使同值）會清空畫布。
      // iPad Safari 捲動時工具列顯隱會觸發 window resize；若每次都重設就會把手寫擦掉（使用者 2026-11-09 回報）。
      if(sized && cv.width===nw && cv.height===nh) return;
      // 尺寸真的改變才重設：先保存既有筆跡、重設後貼回（裝置旋轉／字級變更等少數情況）。
      let snap=null;
      if(sized && cv.width>0 && cv.height>0){ try{ snap=document.createElement('canvas'); snap.width=cv.width; snap.height=cv.height; snap.getContext('2d').drawImage(cv,0,0); }catch(_){ snap=null; } }
      cv.width=nw; cv.height=nh;
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.lineWidth=2.6; ctx.lineCap='round'; ctx.lineJoin='round'; ctx.strokeStyle='#33312E';
      if(snap){ try{ ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.drawImage(snap,0,0); ctx.restore(); }catch(_){} }
      sized=true; }
    function pt(e){ const r=cv.getBoundingClientRect(); return [e.clientX-r.left, e.clientY-r.top]; }
    cv.addEventListener('pointerdown',e=>{ if(!sized)size(); drawing=true; last=pt(e);
      try{cv.setPointerCapture(e.pointerId);}catch(_){} e.preventDefault(); });
    cv.addEventListener('pointermove',e=>{ if(!drawing)return; const p=pt(e);
      ctx.beginPath(); ctx.moveTo(last[0],last[1]); ctx.lineTo(p[0],p[1]); ctx.stroke(); last=p; e.preventDefault(); });
    const stop=()=>{ drawing=false; }; ['pointerup','pointercancel','pointerleave'].forEach(ev=>cv.addEventListener(ev,stop));
    // iOS：觸控筆短暫接觸會被判成「選取」而跳出 Copy/Search/Translate 編輯選單。
    // pointer 事件的 preventDefault 擋不掉 iOS 合成的觸控選取，必須在 touch 事件（非 passive）＋contextmenu＋selectstart 上擋。
    ['touchstart','touchmove','touchend'].forEach(ev=>cv.addEventListener(ev,e=>e.preventDefault(),{passive:false}));
    cv.addEventListener('contextmenu',e=>e.preventDefault());
    cv.addEventListener('selectstart',e=>e.preventDefault());
    function clear(){ if(!sized)size(); if(sized) ctx.clearRect(0,0,cv.width,cv.height); }
    requestAnimationFrame(size); window.addEventListener('resize',()=>{ requestAnimationFrame(size); });
    return { box, clear };
  }

  const src=document.body.getAttribute('data-units');
  fetch(src,{cache:'no-store'}).then(r=>r.json()).then(data=>{
    const u=data.units[0], root=document.getElementById('root');
    root.innerHTML='';
    // 練習與應用脈絡（additive，§2.1）：?from=speaking&cat=<key> → 側欄改綁開口說情境；無參時下方邏輯完全等價（零回歸）。
    const PZQ=new URLSearchParams(location.search||'');
    const pzSpeakCat=(PZQ.get('from')==='speaking')?PZQ.get('cat'):null;

    // ── Cand 1 app-shell：頂部 pill-nav-row（<820px）＋ pshell-grid（psb 左側欄 + psb-main 內容）──
    // island fallback＝subject（目前僅 eng 單元，eng→eng；subject_labels 到才可能改寫）。
    let hashHref='index_new.html#'+u.subject+'/'+u.strand;

    // 窄埠頂部快速跳轉列（back / 上一個 / 下一個 / ①②③④）；prev/next 於 nav 資料到後 insert。
    const pnl=el('nav','pill-nav-row'); pnl.setAttribute('aria-label','單元內快速跳轉');
    pnl.appendChild(el('span','pnl','跳到'));
    const pBack=el('a','pill-nav','<span aria-hidden="true">←</span> 單元牆'); pBack.href=hashHref; pnl.appendChild(pBack);
    let firstStep=null;
    [['s1','① 先聽'],['s2','② 練'],['s3','③ 跟讀'],['s4','④ 自評']].forEach(([id,t],i)=>{
      const a=el('a','pill-nav',esc(t)); a.href='#'+id; pnl.appendChild(a); if(i===0) firstStep=a; });
    root.appendChild(pnl);

    // grid：左側欄 psb ＋ 右內容 psb-main（內容本體沿用，main 變數名不變以零改動內容渲染）
    const grid=el('div','pshell-grid'); const side=el('aside','psb'); const main=el('div','psb-main');
    side.setAttribute('aria-label','導覽側欄');
    grid.appendChild(side); grid.appendChild(main); root.appendChild(grid);

    // 側欄 group1「你在哪裡」：← 分區單元牆（back）。
    // 🏠 學習地圖 不在此重複——app-bar 左上已有 home（避免與頂列重複，系統性去重）。
    const g1=el('div','sb-group'); g1.appendChild(el('div','sb-title','你在哪裡'));
    const sBack=el('a','sb-back','<span aria-hidden="true">←</span> 單元牆'); sBack.href=hashHref; g1.appendChild(sBack);
    side.appendChild(g1);
    // 側欄 group2「同分區單元」：nav 資料到才填（graceful：fetch 失敗則整組隱藏，不白掉）
    const g2=el('div','sb-group'); g2.style.display='none'; side.appendChild(g2);
    // 側欄 group3「本單元流程」：①②③④（R11 不顯年段）
    const g3=el('div','sb-group'); g3.appendChild(el('div','sb-title','本單元流程'));
    [['s1','① 先聽、先感覺'],['s2','② 練一練'],['s3','③ 跟著讀'],['s4','④ 我到哪一步了']].forEach(([id,t])=>{
      const a=el('a',null,esc(t)); a.href='#'+id; g3.appendChild(a); });
    side.appendChild(g3);

    // nav 資料（同分區 siblings ＋ 中文標籤）：runtime fetch；每項 catch→null，整頁不因此白掉。
    Promise.all([
      fetch('data/units_index.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch('data/subject_labels.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch('data/strand_labels.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
      fetch('data/speaking_nav_map.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
    ]).then(([uidx,subjLab,strandLab,spmap])=>{
      const sj=subjLab&&subjLab[u.subject]; const sk=u.subject+'\u001f'+u.strand;
      const subjectZh=(sj&&sj.title_zh)||u.subject;
      const island=(sj&&sj.island)||u.subject;
      const strandZh=(strandLab&&strandLab[sk]&&strandLab[sk].title_zh)||u.strand;
      // 預設＝strand 脈絡（非-speaking 核心單元，零回歸）。
      let ctxZh=strandZh, ctxCrumb=subjectZh+' · '+strandZh;
      hashHref='index_new.html#'+island+'/'+u.strand;
      let sib=((uidx&&uidx.units)||[]).filter(x=>x.subject===u.subject && x.strand===u.strand);
      // 開口說情境 context：speaking-track 單元被排除在 strand 牆外、唯一 home 就是開口說，故**一律**用情境脈絡
      // （不只在帶 ?from=speaking&cat= 時）。cat 來源＝顯式 param 優先，否則由 speaking_nav_map 反查該單元所屬 cat。
      let spCatKey=pzSpeakCat;
      if((!spCatKey||!(spmap&&spmap.cats&&spmap.cats[spCatKey])) && spmap&&spmap.cats){
        for(const k in spmap.cats){ if((spmap.cats[k].units||[]).indexOf(u.unit_id)>=0){ spCatKey=k; break; } }
      }
      const spCat=spCatKey && spmap && spmap.cats && spmap.cats[spCatKey];
      if(spCat){
        ctxZh=spCat.label_zh||spCatKey; ctxCrumb=subjectZh+' · 開口說';
        hashHref='index_new.html#'+island+'/pz-speaking';
        const byId={}; ((uidx&&uidx.units)||[]).forEach(x=>{byId[x.unit_id]=x;});
        sib=(spCat.units||[]).map(id=>byId[id]).filter(Boolean);
      }
      pBack.href=hashHref; pBack.innerHTML='<span aria-hidden="true">←</span> '+esc(ctxZh)+' 單元牆';
      sBack.href=hashHref; sBack.innerHTML='<span aria-hidden="true">←</span> '+esc(ctxCrumb);
      if(sib.length){
        const ci=sib.findIndex(x=>x.unit_id===u.unit_id);
        const MAX=10; let shown;
        if(sib.length<=MAX){ shown=sib; }
        else { let start=0; if(ci>=MAX) start=ci-MAX+1; shown=sib.slice(start,start+MAX); }
        // 情境脈絡下 sibling/prev/next href 帶同一 ?from=speaking&cat= 以維持脈絡；無參時＝純 page（零回歸）。
        const pzHref=(pg)=> spCat ? pg+'?from=speaking&cat='+encodeURIComponent(spCatKey) : pg;
        g2.appendChild(el('div','sb-title','同分區單元（'+esc(ctxZh)+'）'));
        shown.forEach(s=>{ const a=el('a',null,esc(s.title_zh||s.unit_id)); a.href=pzHref(s.page);
          if(s.unit_id===u.unit_id){ a.className='current'; a.setAttribute('aria-current','page'); }
          g2.appendChild(a); });
        if(sib.length>shown.length){ const m=el('a','sb-more','… 共 '+sib.length+' 個單元 →'); m.href=hashHref; g2.appendChild(m); }
        g2.style.display='';
        // 窄埠 pill：相對當前 unit 的前／後一個同分區 sibling（首／尾則略該鈕）
        if(ci>0){ const p=sib[ci-1]; const a=el('a','pill-nav','<span aria-hidden="true">‹</span> 上一個：'+esc(p.title_zh||p.unit_id)); a.href=pzHref(p.page); pnl.insertBefore(a,firstStep); }
        if(ci>=0 && ci<sib.length-1){ const n=sib[ci+1]; const a=el('a','pill-nav','下一個：'+esc(n.title_zh||n.unit_id)+' <span aria-hidden="true">›</span>'); a.href=pzHref(n.page); pnl.insertBefore(a,firstStep); }
      }
    });

    // can-do 橫幅（放內容最上，取代舊左欄 can-do 卡）
    const cd=el('div','gr-cando gr-cando--banner'); cd.innerHTML=
      `<div class="lab">我學得會（can-do）· ${esc(u.situation_group)}</div><div class="txt">${esc(u.can_do)}</div>`;
    main.appendChild(cd);

    // 右欄：① 教
    main.appendChild(el('h2','gr-h','① 先聽、先感覺')).id='s1';
    u.teach.forEach(t=>{
      const c=el('div','gr-card');
      // 控制列：🔊 與「中文對照」toggle 同一列、置於卡片頂端，省掉多餘的行。
      // R14：英文為學習媒介；中文對照預設收合隱藏、鼓勵先試英文（§6.2.2 zh_hint、AC-NAV default-collapsed）。
      const row=el('div','gr-ctrls'); let tg=null;
      if(t.audio){ const b=el('button','gr-play','🔊 聽'); b.onclick=()=>play(t.audio); row.appendChild(b); }
      if(t.zh_hint){ tg=el('button','gr-zh-toggle','▸ 中文對照'); tg.setAttribute('aria-expanded','false'); row.appendChild(tg); }
      if(row.childNodes.length) c.appendChild(row);
      c.appendChild(el('div','gr-en', esc(t.body)));
      if(t.zh_hint){
        const zhDiv=el('div','zh-hint', esc(t.zh_hint)); zhDiv.hidden=true; c.appendChild(zhDiv);
        tg.onclick=()=>{ const show=zhDiv.hidden; zhDiv.hidden=!show;
          tg.setAttribute('aria-expanded',String(show)); tg.textContent=(show?'▾ ':'▸ ')+'中文對照'; };
      }
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
        // 洗牌顯示順序：資料裡正解常放第一個，若不打散，兒童「永遠點第一顆」就能全對而不讀題（位置偏誤）。
        // 答案以「值」比對（o===p.answer），故打散順序完全安全；每次載入重新洗牌。
        const shown=(p.options||[]).slice();
        for(let i=shown.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=shown[i]; shown[i]=shown[j]; shown[j]=t; }
        shown.forEach(o=>{
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
      c.appendChild(el('div','gr-note','🎙️ 按「錄我的」唸唸看，再按「聽我的」跟上面的 🔊 比比看（只給自己聽，不批改發音）。'));
      u.shadowing.lines.forEach(l=>{
        const row=el('div'); row.style.cssText='display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap';
        const b=el('button','gr-play','🔊'); b.onclick=()=>play(l.audio); row.appendChild(b);
        row.appendChild(el('span','gr-en', esc(l.text)));
        row.appendChild(el('span','gr-note','（'+esc(l.intonation)+'）'));
        row.appendChild(mkRec());
        c.appendChild(row);
      });
      c.appendChild(rateRow()); main.appendChild(c);
    }

    // ④ 自評 — 此處三級自評＝單元完成訊號，接 learning_progress.recordUnit（§6.3）。
    // additive：selfRatings push、mastered 單調為真（選最高級＝「會了」時）、lastSeen 更新。
    // 只寫 learning_progress_v1，絕不碰 player_profile_v1（§7.2 單一寫者）。
    main.appendChild(el('h2','gr-h','④ 我到哪一步了')).id='s4';
    const se=el('div','gr-card');
    se.appendChild(rateRow(u.selfeval, function(rating, idx, lv){
      const LP=window.LearningProgress;
      if(!LP || !u.unit_id) return;   // 未載入進度模組或無 unit_id → graceful no-op
      LP.recordUnit(u.unit_id, { selfRating: rating, mastered: (idx === lv.length - 1) });
    }));
    se.appendChild(el('div','gr-note', esc(u.selfeval_note||'')));
    main.appendChild(se);

    main.appendChild(el('footer','gr-foot',
      '資料來源：'+esc(src)+'（Phase 2 英語島單元）。音檔為 edge-tts 童聲真實語音。自評不自動判讀，翻答案自己判斷。'));
  }).catch(e=>{ document.getElementById('root').innerHTML='<p>載入失敗（請用 http 開啟，勿用 file://）：'+esc(e)+'</p>'; });
})();
