import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'fs';
const CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE='http://127.0.0.1:8901/word_master.html';
const OUT='/tmp/wm_shots'; mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const views={land:{width:1366,height:1024,deviceScaleFactor:2}, port:{width:1024,height:1366,deviceScaleFactor:2}};
const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--user-data-dir=/tmp/wmchrome']});
for(const [vn,vp] of Object.entries(views)){
  const p=await b.newPage(); await p.setViewport(vp);
  const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text());}); p.on('pageerror',e=>errs.push(String(e)));
  await p.goto(BASE,{waitUntil:'networkidle0'}); await sleep(900);
  // 1 初始（CEFR A1 預設載入）
  await p.screenshot({path:`${OUT}/${vn}_1_cefr_a1.png`});
  const tabs=await p.$$eval('#schemeTabs button',bs=>bs.map(x=>x.textContent.trim()));
  const lvls=await p.$$eval('#levelList button',bs=>bs.map(x=>x.textContent.trim()));
  const face=await p.$eval('#face',e=>e.innerText.slice(0,60)).catch(()=>'(empty)');
  // 2 翻面
  await p.$eval('#flipBtn',b=>b.click()).catch(()=>{}); await sleep(500);
  await p.screenshot({path:`${OUT}/${vn}_2_flip.png`});
  const backWord=await p.$eval('.wm-word',e=>e.textContent).catch(()=>'(none)');
  // 3 切到 GEPT scheme
  await p.$$eval('#schemeTabs button',bs=>{const g=bs.find(x=>x.textContent.includes('全民英檢'));if(g)g.click();}); await sleep(700);
  await p.screenshot({path:`${OUT}/${vn}_3_gept.png`});
  const geptLvls=await p.$$eval('#levelList button',bs=>bs.map(x=>x.textContent.trim()));
  // 4 未分級（切回 CEFR → 末級）
  await p.$$eval('#schemeTabs button',bs=>{const c=bs.find(x=>x.textContent.includes('CEFR'));if(c)c.click();}); await sleep(400);
  await p.$$eval('#levelList button',bs=>{const u=bs.find(x=>x.textContent.includes('未分級'));if(u)u.click();}); await sleep(600);
  await p.screenshot({path:`${OUT}/${vn}_4_unclassified.png`});
  const blockH=await p.$eval('.wm-shell',e=>Math.round(e.getBoundingClientRect().height)).catch(()=>-1);
  console.log(`[${vn}] tabs=${JSON.stringify(tabs)}`);
  console.log(`   cefr-levels=${JSON.stringify(lvls)}`);
  console.log(`   gept-levels=${JSON.stringify(geptLvls)}`);
  console.log(`   front-face="${face.replace(/\n/g,' ')}" backWord="${backWord}" shellH=${blockH} errors=${errs.length?JSON.stringify(errs.slice(0,3)):'none'}`);
  await p.close();
}
await b.close(); console.log('shots in',OUT);
