// perf_gate.mjs — AC-PERF-1 的確定性「初始 JS 位元組預算」效能 gate（§6.5 line ~290／R9 line ~247）。
//
// spec 的規則是「相對」的：單頁**初始 JS ≤ 同類頁基準**（§6.5），不是一個絕對數字。
// 「具體數值」＝由實測算出的 per-class 基準（class median）。本 gate 靜態（不需瀏覽器）量測，
// 以確保確定性與速度——純粹解析 HTML ＋ 讀被引用的本地 .js 檔大小，不 render。
//
// 量測定義：
//   單頁「初始 JS 位元組」＝首屏載入／解析時會進來的 JS 總位元組：
//     (a) 非 defer／async／非 module 的 `<script src>` 所指「本地 .js 檔」之檔案大小（bytes），加上
//     (b) 內聯 `<script>…</script>` 的內容位元組數（UTF-8）。
//   依 R9「按需載入」原則，defer／async／type=module／動態 import()／延遲載入的資產**不計入初始**
//   （它們是 on-demand），但仍會**另外分開報告**（deferred/remote/dynamic）。
//   遠端 src（http(s):// 或 //）無法靜態量測檔案大小，一律不計入初始位元組，另列「remote」報告。
//
// 分類（by 檔名／角色）：
//   - hub：`index_new.html`
//   - unit：repo 根的 `english_*.html`（學習路徑學習單元）
//   - legacy：其餘根目錄頁（舊主題頁）——預設 --verify **不掃**，以免舊頁肥大擋住 Phase 1。
//
// 基準（per-class baseline）＝該 class 的「初始 JS 位元組」中位數（median，穩健集中趨勢）。
// 違規判定：某頁初始 JS ＞ 其 class 基準 × 容忍係數（預設 PERF_TOLERANCE=1.5）＝「超同類頁基準」。
//   （class 僅 1 頁時，median＝自身，永不超標——這是合理的：沒有同類可比。）
// 另外偵測 spec 明列的硬性反模式（能便宜偵測就報為 warning，不直接計violation，除非它同時超基準）：
//   某頁「無條件」（初始、非延遲）載入了很大的（＞PERF_BIG_BUNDLE，預設 200KB）動畫/引擎 bundle
//   （檔名含 anim/engine/_core/game_core…）→ 報 warning「大 bundle 未延遲載入」（§6.5 的 ❌ 371KB anim_core）。
//
// 介面（對齊姊妹 gate a11y_gate.mjs / nav_gate.mjs 慣例，供 verify_learning_path registry 呼叫）：
//   node tools/perf_gate.mjs --verify    掃 learner 頁（index_new.html + english_*.html）；人類報告印到
//                                         stderr（per-class 基準＋超標頁）；EXIT CODE = 超基準頁數
//                                         （0＝clean；夾在 1..255 以防 mod-256 歸零誤判成 PASS）。
//   node tools/perf_gate.mjs --selftest  離線 fixture：建一組同類 GOOD 頁（在/低於基準）必過、一個含
//                                         300KB 內聯巨腳本（遠高於基準）的 BAD 頁必被抓；期望全中才 exit 0，否則 exit 2。
//   無參數                                印用法並 exit 2（同姊妹 gate）。
//
// 可傳入明確頁清單／glob（覆寫預設掃描範圍），例：node tools/perf_gate.mjs --verify 'english_*.html'。
// 多餘參數（registry 會附加的 --release-id <id>／--root <path>）一律容忍、不致爆錯；--root 會覆寫站根。
// Fail-closed：讀不到被指定要掃的 HTML 檔＝記 1 違規（nonzero），絕不 silent pass。
//
// 環境變數（可選）：PERF_TOLERANCE（容忍係數，預設 1.5）、PERF_BIG_BUNDLE（大 bundle 門檻 bytes，預設 200000）、
//   PERF_PAGES（逗號分隔覆寫掃描清單）、PERF_SCOPE=all（連 legacy 根頁一起掃）、PERF_MAX_EXAMPLES（報告例數上限，預設 8）。
import { readdirSync, readFileSync, statSync, existsSync } from 'fs';
import { dirname, join, basename, resolve as presolve } from 'path';
import { fileURLToPath } from 'url';
import { tmpdir } from 'os';
import { mkdtempSync, writeFileSync } from 'fs';

const SELF_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = dirname(SELF_DIR);

const err = (...a) => process.stderr.write(a.join(' ') + '\n');

const TOLERANCE = parseFloat(process.env.PERF_TOLERANCE || '1.5');
const BIG_BUNDLE = parseInt(process.env.PERF_BIG_BUNDLE || '200000', 10);
const MAX_EXAMPLES = parseInt(process.env.PERF_MAX_EXAMPLES || '8', 10);
const BIG_NAME_RE = /(anim|engine|_core|game_core)/i; // 動畫/引擎 bundle 命名特徵

const kb = (n) => (n / 1024).toFixed(1) + 'KB';

// ── 解析單一 <script> 的屬性 ──
function parseAttrs(attrStr) {
  const a = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(attrStr)) !== null) {
    const name = m[1].toLowerCase();
    const val = m[3] !== undefined ? m[3] : m[4] !== undefined ? m[4] : m[5] !== undefined ? m[5] : '';
    a[name] = val;
  }
  return a;
}

function isRemote(src) {
  return /^https?:\/\//i.test(src) || /^\/\//.test(src);
}

// 解析被引用本地 js 的絕對路徑：相對 src → 相對該 HTML 所在目錄；以 / 開頭 → 相對站根。
function resolveLocal(src, htmlDir, root) {
  let s = src.split('#')[0].split('?')[0].trim();
  if (!s) return null;
  if (s.startsWith('/')) return join(root, s.replace(/^\/+/, ''));
  return join(htmlDir, s);
}

// ── 核心：靜態分析一個 HTML 檔，回傳初始/延遲/遠端/大bundle/缺檔明細 ──
// baseDirOverride：解析相對 src 用的目錄（預設＝該 HTML 的 dirname）；root：站根（供 / 開頭 src）。
function analyzePage(htmlPath, root, baseDirOverride) {
  const html = readFileSync(htmlPath, 'utf8'); // 讀不到 → 丟出，由呼叫端 fail-closed 處理
  const htmlDir = baseDirOverride || dirname(htmlPath);
  let initialBytes = 0;
  let deferredBytes = 0;
  const remote = [];      // 遠端 src（無法量測）
  const deferred = [];    // defer/async/module（非初始）
  const missing = [];     // 被初始引用但本地找不到的檔
  const bigBundles = [];  // 初始載入且 > BIG_BUNDLE 的檔
  let inlineBytes = 0;

  const reScript = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = reScript.exec(html)) !== null) {
    const attrs = parseAttrs(m[1] || '');
    const inner = m[2] || '';
    const type = (attrs.type || '').toLowerCase();
    // 非 JS type（如 application/json、text/template）不計為可執行 JS
    const isJsType = type === '' || type === 'text/javascript' || type === 'module' ||
      type === 'application/javascript' || type === 'text/ecmascript';
    if ('src' in attrs && attrs.src) {
      const src = attrs.src;
      if (isRemote(src)) { remote.push(src); continue; }
      if (!isJsType) continue; // 非 JS 的外部資源（極少），不計
      const isDeferred = ('defer' in attrs) || ('async' in attrs) || type === 'module';
      const p = resolveLocal(src, htmlDir, root);
      if (!p || !existsSync(p)) { missing.push(src); continue; }
      let size = 0;
      try { size = statSync(p).size; } catch { missing.push(src); continue; }
      if (isDeferred) { deferredBytes += size; deferred.push({ src, bytes: size }); }
      else {
        initialBytes += size;
        if (size > BIG_BUNDLE && BIG_NAME_RE.test(basename(p))) bigBundles.push({ src, bytes: size });
      }
    } else {
      // 內聯 script：type=module 的內聯視為 deferred；JSON/template 等非 JS type 不計
      if ('src' in attrs) continue; // src 空字串，略過
      if (!isJsType) continue;
      const b = Buffer.byteLength(inner, 'utf8');
      if (type === 'module') { deferredBytes += b; deferred.push({ src: '(inline module)', bytes: b }); }
      else { inlineBytes += b; initialBytes += b; }
    }
  }
  return { htmlPath, initialBytes, inlineBytes, deferredBytes, remote, deferred, missing, bigBundles };
}

function classify(fname) {
  const b = basename(fname);
  if (b === 'index_new.html') return 'hub';
  if (/^english_.*\.html$/.test(b)) return 'unit';
  return 'legacy';
}

function median(nums) {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// 解析 argv：抽離已知帶值旗標（--root/--release-id）、bare 頁清單/glob；回傳 {root, pagesArg}
function parseArgv(argv) {
  let root = DEFAULT_ROOT;
  const bare = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') { if (argv[i + 1]) { root = presolve(argv[i + 1]); i++; } continue; }
    if (a === '--release-id') { if (argv[i + 1]) i++; continue; }
    if (a === '--verify' || a === '--selftest') continue;
    if (a.startsWith('-')) continue; // 其他未知旗標一律容忍略過
    bare.push(a);
  }
  return { root, pagesArg: bare };
}

// 依掃描範圍列出要掃的頁（相對檔名）
function listPages(root, pagesArg) {
  if (process.env.PERF_PAGES) {
    return process.env.PERF_PAGES.split(',').map((s) => s.trim()).filter(Boolean);
  }
  const all = readdirSync(root).filter((f) => f.endsWith('.html'));
  if (pagesArg.length) {
    const out = [];
    for (const pat of pagesArg) {
      if (pat.includes('*')) {
        const re = new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
        for (const f of all) if (re.test(f)) out.push(f);
      } else {
        out.push(pat);
      }
    }
    return [...new Set(out)];
  }
  // 預設：learner surface（hub + units）；PERF_SCOPE=all 時連 legacy 一起
  const pages = [];
  if (existsSync(join(root, 'index_new.html'))) pages.push('index_new.html');
  for (const f of all) if (/^english_.*\.html$/.test(f)) pages.push(f);
  if (process.env.PERF_SCOPE === 'all') {
    for (const f of all) if (classify(f) === 'legacy') pages.push(f);
  }
  return pages;
}

// ── 計算 per-class 基準 ＋ 判超標，回傳 {classes, results, offenders} ──
function evaluate(pages, root) {
  const results = [];   // 每頁 analyze 結果 + class + loadFail
  for (const pg of pages) {
    const abs = join(root, pg);
    try {
      const r = analyzePage(abs, root);
      results.push({ page: pg, cls: classify(pg), loadFail: false, ...r });
    } catch (e) {
      // fail-closed：讀不到要掃的頁 → 記 1 違規
      results.push({ page: pg, cls: classify(pg), loadFail: true, errMsg: e.message, initialBytes: 0 });
    }
  }
  // per-class median（只用成功載入的頁）
  const byClass = {};
  for (const r of results) {
    if (r.loadFail) continue;
    (byClass[r.cls] = byClass[r.cls] || []).push(r.initialBytes);
  }
  const baseline = {};
  for (const c of Object.keys(byClass)) baseline[c] = median(byClass[c]);

  const offenders = [];
  for (const r of results) {
    if (r.loadFail) { offenders.push({ ...r, reason: 'loadFail' }); continue; }
    const base = baseline[r.cls] || 0;
    const limit = base * TOLERANCE;
    if (base > 0 && r.initialBytes > limit + 1e-6) {
      offenders.push({ ...r, reason: 'overBaseline', base, limit });
    }
  }
  return { results, baseline, byClass, offenders };
}

// ── --verify ──
function verify(argv) {
  const { root, pagesArg } = parseArgv(argv);
  const pages = listPages(root, pagesArg);
  err('=== perf_gate --verify ===');
  err(`站根：${root}`);
  err(`容忍係數 PERF_TOLERANCE＝${TOLERANCE}×（超過同類頁中位數此倍數即違規）；大 bundle 門檻＝${kb(BIG_BUNDLE)}`);
  err(`掃描頁數：${pages.length}（預設範圍＝hub index_new.html ＋ english_*.html；PERF_SCOPE=all 可含 legacy）`);

  if (pages.length === 0) { err('FAIL：沒有可掃描的頁（fail-closed）'); process.exit(90); }

  const { results, baseline, byClass, offenders } = evaluate(pages, root);

  // per-class 基準報告
  err('\n--- per-class 初始 JS 基準（class median）---');
  for (const c of Object.keys(byClass).sort()) {
    const arr = byClass[c];
    err(`  [${c}] 頁數 ${arr.length}｜中位數 ${kb(baseline[c])}（${baseline[c]} bytes）｜容忍上限 ${kb(baseline[c] * TOLERANCE)}`);
  }

  // 大 bundle warnings（資訊性，不計 exit）
  const bigWarn = results.filter((r) => !r.loadFail && r.bigBundles && r.bigBundles.length);
  if (bigWarn.length) {
    err('\n--- ⚠ 大 bundle 無條件載入（§6.5 反模式；warning，不計入 exit）---');
    for (const r of bigWarn.slice(0, MAX_EXAMPLES)) {
      err(`  ${r.page}：${r.bigBundles.map((b) => `${b.src}=${kb(b.bytes)}`).join(', ')}`);
    }
    if (bigWarn.length > MAX_EXAMPLES) err(`  …另 ${bigWarn.length - MAX_EXAMPLES} 頁（同類）`);
  }

  // 超標頁
  const loadFails = offenders.filter((o) => o.reason === 'loadFail');
  const overs = offenders.filter((o) => o.reason === 'overBaseline');
  if (loadFails.length) {
    err('\n--- 載入失敗（fail-closed，各記 1 違規）---');
    for (const o of loadFails) err(`  [載入失敗] ${o.page} —— ${o.errMsg}`);
  }
  if (overs.length) {
    err('\n--- 超同類頁基準 ---');
    overs.sort((a, b) => b.initialBytes - a.initialBytes);
    for (const o of overs.slice(0, MAX_EXAMPLES)) {
      err(`  [超標] ${o.page}（${o.cls}）初始 JS ${kb(o.initialBytes)}（${o.initialBytes} bytes）＞ 上限 ${kb(o.limit)}（基準 ${kb(o.base)}×${TOLERANCE}）`);
    }
    if (overs.length > MAX_EXAMPLES) err(`  …另 ${overs.length - MAX_EXAMPLES} 頁超標`);
  }

  const total = offenders.length;
  err('\n========== AC-PERF-1 判定 ==========');
  err(`掃描 ${pages.length} 頁；超基準/載入失敗共 ${total} 頁（其中超基準 ${overs.length}、載入失敗 ${loadFails.length}）`);
  err(total === 0 ? '結果：PASS（0 頁超基準）' : '結果：FAIL');
  process.exit(total === 0 ? 0 : Math.min(total, 255));
}

// ── --selftest（離線 fixture）──
function selftest() {
  err('=== perf_gate --selftest ===');
  const dir = mkdtempSync(join(tmpdir(), 'perf_gate_self_'));
  // 建一組同類 GOOD unit 頁（小內聯腳本，彼此接近）＋ 一個 BAD 頁（300KB 內聯巨腳本，遠高於基準）
  const smallInline = `<script>window.__u=1;var a=${'0,'.repeat(200)}0;</script>`; // ~數百 bytes
  const good = (n) => `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"></head><body><p>單元 ${n}</p>${smallInline}</body></html>`;
  const hugeInline = 'x'.repeat(300 * 1024); // 300KB
  const bad = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"></head><body><p>肥大單元</p><script>/*${hugeInline}*/</script></body></html>`;

  const goodNames = [];
  for (let i = 1; i <= 6; i++) {
    const nm = `english_good${i}.html`;
    writeFileSync(join(dir, nm), good(i));
    goodNames.push(nm);
  }
  const badName = 'english_bad.html';
  writeFileSync(join(dir, badName), bad);

  // 另驗「無條件大 bundle」warning：建一個 unit 引用本地大 _core 檔
  const bigCore = 'y'.repeat(BIG_BUNDLE + 50 * 1024);
  writeFileSync(join(dir, 'anim_core.js'), bigCore);
  const bundleName = 'english_bundle.html';
  writeFileSync(join(dir, bundleName), `<!doctype html><html><head></head><body><script src="anim_core.js"></script>${smallInline}</body></html>`);

  const pages = [...goodNames, badName, bundleName];
  const { results, baseline, offenders } = evaluate(pages, dir);
  const over = offenders.filter((o) => o.reason === 'overBaseline').map((o) => o.page);
  const badRes = results.find((r) => r.page === badName);
  const goodRes = results.find((r) => r.page === goodNames[0]);
  const bundleRes = results.find((r) => r.page === bundleName);

  const checks = [
    ['BAD：300KB 內聯巨腳本遠超基準 → 被抓', over.includes(badName)],
    ['GOOD：小內聯腳本在/低於基準 → 不被抓', !over.includes(goodNames[0])],
    ['BAD 初始位元組 ＞ GOOD 初始位元組', (badRes?.initialBytes || 0) > (goodRes?.initialBytes || 0)],
    ['unit class 基準為正值（有同類可比）', (baseline.unit || 0) > 0],
    ['大 bundle 頁被標記 bigBundle warning', (bundleRes?.bigBundles || []).length > 0],
  ];
  let allok = true;
  for (const [msg, ok] of checks) { err(`  [${ok ? 'OK' : 'BAD'}] ${msg}`); allok = allok && ok; }
  err(`  明細：unit 基準＝${baseline.unit} bytes；BAD 初始＝${badRes?.initialBytes} bytes；GOOD 初始＝${goodRes?.initialBytes} bytes；超標頁＝[${over.join(', ')}]`);
  err(`RESULT：${allok ? 'PASS' : 'FAIL'}`);
  process.exit(allok ? 0 : 2);
}

// ── 入口 ──
const argv = process.argv.slice(2);
if (argv.includes('--selftest')) selftest();
else if (argv.includes('--verify')) verify(argv);
else {
  err('用法：node tools/perf_gate.mjs --verify | --selftest');
  err('  --verify   靜態量測 learner 頁初始 JS 位元組，超同類頁基準×容忍係數即違規；EXIT＝超標頁數（0＝clean）');
  err('  --selftest 離線 fixture 自測（GOOD 低於基準過、BAD 300KB 內聯超標被抓；PASS=exit 0，否則 exit 2）');
  err('  可加明確頁清單/glob（如 \'english_*.html\'）；--root/--release-id 容忍；env：PERF_TOLERANCE/PERF_BIG_BUNDLE/PERF_PAGES/PERF_SCOPE');
  process.exit(2);
}
