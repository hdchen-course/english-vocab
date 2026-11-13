import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE='http://127.0.0.1:8096';
const OUT='/tmp/wm_render'; mkdirSync(OUT,{recursive:true});
const VPS=[['ipad_land',1366,1024],['ipad_port',1024,1366]];
const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--user-data-dir=/tmp/wm_render_chrome']});
async function shot(page,name){ await page.screenshot({path:`${OUT}/${name}.png`}); console.log('wrote',name); }
for(const [vn,w,h] of VPS){
  // --- word_master: flip + rate easy x3 on first card, capture back mastery ---
  const p=await b.newPage(); await p.setViewport({width:w,height:h,deviceScaleFactor:2});
  const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text());}); p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto(`${BASE}/word_master.html`,{waitUntil:'networkidle0',timeout:60000});
  await new Promise(r=>setTimeout(r,1800));
  // flip to back
  await p.evaluate(()=>{ const fb=document.getElementById('flipBtn'); if(fb) fb.click(); });
  await new Promise(r=>setTimeout(r,900));
  await shot(p,`word_master_back_${vn}`);
  // press 會了 (easy) 3 times across cards, capturing mastery climb on first
  for(let i=0;i<3;i++){
    const had=await p.evaluate(()=>{ const btns=document.querySelectorAll('.fc-rate__btn'); if(btns.length){ btns[btns.length-1].click(); return true;} return false; });
    await new Promise(r=>setTimeout(r,760));
    // re-flip next card
    await p.evaluate(()=>{ const fb=document.getElementById('flipBtn'); if(fb&&fb.style.display!=='none') fb.click(); });
    await new Promise(r=>setTimeout(r,700));
  }
  await shot(p,`word_master_after3_${vn}`);
  console.log(vn,'word_master errs:',errs.slice(0,5));
  await p.close();
  // --- word_stats: load, screenshot note + donut ---
  const q=await b.newPage(); await q.setViewport({width:w,height:h,deviceScaleFactor:2});
  const e2=[]; q.on('pageerror',e=>e2.push('PAGEERR '+e.message));
  await q.goto(`${BASE}/word_stats.html`,{waitUntil:'networkidle0',timeout:60000});
  await new Promise(r=>setTimeout(r,2000));
  await shot(q,`word_stats_${vn}`);
  // scroll to note
  await q.evaluate(()=>{ const n=document.getElementById('note'); if(n) n.scrollIntoView(); });
  await new Promise(r=>setTimeout(r,500));
  await shot(q,`word_stats_note_${vn}`);
  console.log(vn,'word_stats errs:',e2.slice(0,5));
  await q.close();
}
await b.close();
console.log('done');
