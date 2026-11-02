#!/usr/bin/env node
/*
 * code_download_gate.mjs — AC-CODE-DL 的 fail-closed gate（house norm：含可執行碼的模組必須
 * 提供「完整、可乾淨解壓、可跑」的原始碼下載，且被 site 連結到，讀者拿得到）。
 *
 * 契約（LEARNING_PATH_REBUILD_SPEC §11.A AC-CODE-DL ＋ 全站 code-download house norm）：
 *   每個「含可執行碼的模組」在 downloads/ 下有 <name>.zip（source-only），其
 *   (1) .zip 存在且 git-tracked；
 *   (2) 乾淨解壓到 temp 成功（非毀損、非空）；
 *   (3) 內含 README（zip 內 README.md 或 downloads/<name>-README.md），且 README 有「建置/重建/執行」指令；
 *   (4) 被 site 至少一頁以 <a ... href="...<name>.zip" download> 連結（否則讀者拿不到＝孤兒 bundle）。
 *   指標＝違規＝0（exit 0）。「實際乾淨解壓後跑 README build/test 綠」為更深一層（需 Node/venv/edge-tts
 *   工具鏈與連網，非確定性）——本 gate 保證 (1)-(4) 結構與可達性，深層 build-run 由 CI/人工層跑並記 log。
 *
 * 用法：node tools/code_download_gate.mjs [--verify|--selftest]
 * EXIT：0=clean、1..=違規數、2=selftest 失敗、99=fail-closed（掃不到 repo 根或 git 不可用）。
 */
import { execFileSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, mkdtempSync, rmSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DL = join(ROOT, 'downloads');
const BUILD_HINT = /(重建|建置|執行|build|run|npm |node |python|tsc|verify|重生|步驟)/i;

function gitTracked(rel) {
  try { execFileSync('git', ['ls-files', '--error-unmatch', rel], { cwd: ROOT, stdio: 'pipe' }); return true; }
  catch { return false; }
}
function htmlFiles() {
  return readdirSync(ROOT).filter(f => f.endsWith('.html'));
}
function linkedSomewhere(zipName) {
  const re = new RegExp(`href=["'][^"']*${zipName.replace('.', '\\.')}["']`, 'i');
  for (const f of htmlFiles()) {
    const h = readFileSync(join(ROOT, f), 'utf8');
    if (re.test(h) && /download/i.test(h.slice(Math.max(0, h.search(re) - 200), h.search(re) + 200))) return f;
  }
  return null;
}

function checkZip(zipPath) {
  const probs = [];
  const zipName = basename(zipPath);
  const rel = `downloads/${zipName}`;
  if (!gitTracked(rel)) probs.push(`${zipName}：.zip 未 git-tracked`);
  // 乾淨解壓到 temp
  const tmp = mkdtempSync(join(tmpdir(), 'cdl_'));
  let names = [];
  try {
    execFileSync('unzip', ['-qq', '-o', zipPath, '-d', tmp], { stdio: 'pipe' });
    names = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' }).split('\n').filter(Boolean);
    if (names.length < 2) probs.push(`${zipName}：解壓內容過少（${names.length} 項，疑空/毀損）`);
  } catch (e) {
    probs.push(`${zipName}：解壓失敗（毀損？）${e.message || ''}`);
    rmSync(tmp, { recursive: true, force: true });
    return probs;
  }
  // README（zip 內或 downloads/<name>-README.md）
  const base = zipName.replace(/\.zip$/, '');
  const sideReadme = join(DL, `${base.replace(/-src$/, '')}-README.md`);
  let readmeText = '';
  const innerReadme = names.find(n => /(^|\/)README\.md$/i.test(n));
  if (innerReadme) { try { readmeText = readFileSync(join(tmp, innerReadme), 'utf8'); } catch {} }
  if (!readmeText && existsSync(sideReadme)) readmeText = readFileSync(sideReadme, 'utf8');
  if (!readmeText) probs.push(`${zipName}：找不到 README（zip 內 README.md 或 ${basename(sideReadme)}）`);
  else if (!BUILD_HINT.test(readmeText)) probs.push(`${zipName}：README 無建置/執行指令`);
  // site 連結
  if (!linkedSomewhere(zipName)) probs.push(`${zipName}：site 無任何頁以 <a download href> 連結（孤兒 bundle，讀者拿不到）`);
  rmSync(tmp, { recursive: true, force: true });
  return probs;
}

function selftest() {
  // 離線紅隊：BUILD_HINT 與 linkedSomewhere 的正則行為
  let ok = true;
  const t = (name, cond) => { console.log(`  [${cond ? 'OK' : 'BAD'}] ${name}`); ok = ok && cond; };
  t('README 有「重建步驟」→ 視為有建置指令', BUILD_HINT.test('## 重建步驟\n.venv/bin/python ...'));
  t('README 無指令（純描述）→ 不符', !BUILD_HINT.test('這是一份介紹文字，沒有任何操作。'));
  t('href 帶 download 的 zip 連結正則命中',
    /href=["'][^"']*foo\.zip["']/i.test('<a download href="downloads/foo.zip">下載</a>'));
  t('無 .zip 連結→不命中', !/href=["'][^"']*foo\.zip["']/i.test('<a href="other.html">x</a>'));
  console.log('RESULT:', ok ? 'PASS ✅' : 'FAIL ❌');
  return ok;
}

const arg = process.argv[2] || '--verify';
if (arg === '--selftest') { console.log('=== code_download_gate --selftest ==='); process.exit(selftest() ? 0 : 2); }
// --verify
if (!existsSync(ROOT) || !existsSync(join(ROOT, '.git'))) { console.error('fail-closed：repo 根/git 不可用'); process.exit(99); }
console.log('=== AC-CODE-DL code_download_gate --verify ===');
if (!existsSync(DL)) { console.log('無 downloads/ 目錄——無可下載碼模組，vacuous PASS'); process.exit(0); }
const zips = readdirSync(DL).filter(f => f.endsWith('.zip'));
if (!zips.length) { console.log('downloads/ 無 .zip——vacuous PASS'); process.exit(0); }
let all = [];
for (const z of zips) { const p = checkZip(join(DL, z)); for (const x of p) all.push(x); console.log(`  ${z}: ${p.length ? p.length + ' 違規' : 'OK'}`); }
for (const x of all) console.log(`    ✗ ${x}`);
console.log(`\nRESULT(AC-CODE-DL): ${all.length ? 'FAIL ❌' : 'PASS ✅'}（${zips.length} bundle、違規 ${all.length}）`);
process.exit(Math.min(all.length, 98));
