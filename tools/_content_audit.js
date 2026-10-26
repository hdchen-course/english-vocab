// content_audit.js — ONE round of the external/internal team audit for a static-doc corpus.
// Generic + args-driven (workflow sandbox has NO fs, so the caller passes the file list).
//
// Workflow({ scriptPath: ".../content_audit.js", args: {
//   dir:      "/abs/path/to/htmldir",         // required (used to build absolute file paths)
//   files:    ["a.html","b.html", ...],       // required — caller does `ls *.html` and passes it
//   context:  "one paragraph describing the doc + its IRON RULES/standard",  // optional override
//   knownFP:  "bullet list of verified do-NOT-flag false positives",         // optional
//   filterBlind: ["file-that-trips-content-filter.html"],                    // optional (excluded from LLM shards)
//   checklist: "custom dimension checklist",   // optional override
//   nshards:  18,                              // optional (default: ceil(files/6), min 6)
//   round:    1,                               // optional label
//   maxReviewAttempts: 2                       // optional (default 2) — judge-driven re-runs per shard
// }})
//
// Returns { round, confirmedCount, niceToHaveCount, rawCount, confirmed[], niceToHave[],
//           coverage[], coverageComplete }.
//   confirmed  = IN-SPEC must-fix (adversarially verified real=true) — the internal team must fix these.
//   notDefects = findings the EXPERT PANEL ruled NOT A DEFECT, with each panelist's reason. There is no
//   "cosmetic / nice-to-have" bucket: a finding is a defect (fix it) or it is not (HD 2026-09-26).
//   niceToHave is kept as an empty array for older callers.
//   coverage   = per-file coverage evidence the reviewers reported (claimed line count + verbatim
//                first/last non-blank line + anchor quotes at ~25/50/75% with their line numbers).
//   coverageComplete = false if ANY shard failed the report-quality JUDGE on its final attempt.
//
// ── WHY THE COVERAGE/JUDGE MACHINERY EXISTS (READ THIS) ────────────────────────────────────────
// Measured, repeatedly, with IDENTICAL sharding: the same book returned 1 must-fix one round and
// 61 the next; agent count is an EFFECT (each finding spawns a verifier), NOT the cause. The real
// variable is HOW THOROUGHLY EACH REVIEWER READ ITS FILE — some rounds skim, and a long-context
// reviewer degrades into skimming. Documentation ("read in full") does not fix a behavior, so this
// script ENFORCES it with three layers the lazy reviewer does not control:
//   L1 (here): every reviewer MUST emit falsifiable coverage evidence per file — claimed line
//              count + verbatim first & last non-blank line + 3 anchor quotes at ~25/50/75% WITH
//              their line numbers. A skimmer cannot produce the line at 75% of a 6,000-line file.
//   L2 (here): a JUDGE agent grades each shard report against a rubric (coverage present for every
//              assigned file? findings specific, not filler? empty-findings OK ONLY if coverage is
//              demonstrated). Fail -> the shard's review RE-RUNS (bounded). A short single-purpose
//              judge stays in the reliable small-context regime.
//   L3 (caller's session, has fs): AFTER this returns, run scripts/coverage_check.js <dir> against
//              the returned coverage[] — it truth-checks the claimed line counts and anchor quotes
//              against the REAL files (wc -l, exact line match). Any mismatch => round INVALID,
//              re-run. This is the ungameable layer: the truth-check runs OUTSIDE the agent.
// A round may count toward a clean streak ONLY when coverageComplete===true AND coverage_check.js
// passes. Record each clean round's coverage in the project round history.
export const meta = {
  name: 'content-audit-round',
  description: 'One content-audit round of a static-doc corpus: shard, find across dimensions with enforced+judged full-file coverage, then an EXPERT PANEL triages each finding as DEFECT or NOT A DEFECT (correct? understandable? in scope?)',
  phases: [{ title: 'Review' }, { title: 'Judge' }, { title: 'Verify' }],
};

const DIR = args.dir;
const ALL = args.files || [];
const ROUND = (args && args.round) || 0;
const MAX_REVIEW_ATTEMPTS = (args && args.maxReviewAttempts) || 2;
// The VERIFY stage fan-out is driven by FINDING COUNT, not nshards — a 60-finding shard used to open
// 60 verify agents at once (unbounded parallel), which blows the quota and gets shards killed with
// 429s (this was the real cause of dropped/"ERR" shards, NOT nshards). Run verify in fixed waves.
const VERIFY_CONCURRENCY = (args && args.verifyConcurrency) || 4;
// bounded parallel: run fn over items, at most `width` concurrent, preserving order.
async function boundedParallel(items, fn, width){
  const out = [];
  for (let i = 0; i < items.length; i += width) {
    const chunk = items.slice(i, i + width);
    const r = await parallel(chunk.map(it => () => fn(it)));
    for (const x of r) out.push(x);
  }
  return out;
}
// Coverage guard: an empty file list silently degrades to a few ad-hoc, unsharded agents that
// "explore" DIR on their own — NOT the full deterministic sweep this gate promises, so a clean
// result would be a false negative. Fail loudly. (The Workflow sandbox has no fs, so the CALLER
// must gather `ls DIR/*.<ext>` and pass args.files.) This bit once: a round ran 6 empty shards.
if (!DIR) throw new Error('content_audit: args.dir is required');
if (!ALL.length) throw new Error('content_audit: args.files is empty — the sandbox cannot readdir; pass the full file list so shards cover every file. Refusing to run a non-sweep.');
const FILTER_BLIND = (args && args.filterBlind) || [];
const REVIEWABLE = ALL.filter(f => !FILTER_BLIND.includes(f));
const NSHARDS = (args && args.nshards) || Math.max(6, Math.ceil(REVIEWABLE.length / 6));
// The anchor is added to EVERY shard so each reviewer can resolve cross-references against the
// corpus hub. Only a real hub qualifies. The old fallback was REVIEWABLE[0], which silently
// pinned an ordinary CHAPTER into all N shards whenever the corpus had no index: measured on
// craft round 4, craft_lsp.html was reviewed 9 times and the other 8 files once each, which
// burned ~9x the effort on one file and skewed the findings (20 of 37 confirmed were from it).
// No anchor is the correct fallback -- a shard that cannot see a hub simply reports what it
// cannot resolve.
const HUBS = ['index.html', 'toc.html', 'contents.html'];
const anchor = HUBS.find(h => REVIEWABLE.includes(h)) || '';

const CONTEXT = (args && args.context) || `You are auditing a set of generic, publicly-shareable static-HTML documents. Hold a HIGH bar: report ONLY genuinely real, still-open defects a skeptic would agree improve the material. Do NOT invent nitpicks or wish-list items; an EMPTY findings array is a perfectly good, expected result. Correctness (facts, code, complexity) is PARAMOUNT. No sensitive/confidential info (PII, secrets, non-public internal codenames); naming PUBLIC companies/products/brands with public facts is allowed.`;

const CHECKLIST = (args && args.checklist) || `Apply ALL of these lenses THOROUGHLY to EACH file (read prose + relevant markup/code/SVG in full):
1. FACT-CHECK: every concrete claim, number, date, named spec/protocol value, cited result vs reality. Fabricated/wrong = top priority.
2. ALGORITHM/CODE CORRECTNESS: attack every snippet — edge cases (empty/1-element/overflow/duplicates/negative), off-by-one, wrong complexity, broken invariant, a comment that states something false, code that won't compile.
3. VALIDITY OF ADVICE: would following it hold up to an expert? Flag subtly-wrong guidance; flag UNVERIFIABLE ABSOLUTES ("X WILL happen") -> "may"; flag unsupported FREQUENCY/superlative statistics -> drop or reframe.
4. DOMAIN PRECISION: distributed-systems / ML / perf / security specifics; every latency/throughput/memory figure, unit, and back-of-envelope arithmetic.
5. SECURITY: any described design/threat-model insecure/outdated/exploitable if followed literally.
6. READABILITY: wording HARDER than necessary with a common synonym; give a simpler rewrite. Keep necessary technical terms; flag only avoidable difficulty.
7. NATIVE-SPEAKER NATURALNESS: unnatural/awkward/ungrammatical phrasing, or a simplification that became subtly WRONG in meaning.
8. INSTRUCTIONAL DESIGN: concept used before introduced; example that doesn't illustrate its point; missing "why it matters".
9. SENSITIVE-INFO: ONLY genuinely sensitive/confidential material (PII, secrets, non-public internal codenames). Public brand/product names are FINE.
10. NAV / CROSS-REF INTEGRITY: internal links/hrefs resolve; prev/next & breadcrumbs correct; TOC/counts mutually consistent; cross-refs name the correct destination; anchors valid.
11. TERMINOLOGY CONSISTENCY: a term/acronym defined consistently across files; flag contradictory definitions/expansions.
12. STRUCTURE/DESIGN CONSISTENCY: a block that breaks the doc's established layout pattern (e.g. missing the standard wrapper/card the rest of the doc uses).
SOURCE-FIDELITY LENSES (apply ONLY if this corpus is transcribed/summarized from authoritative sources — official sites, specs, references — and a source file is available to check against; skip if not):
13. OFFICIAL-SILENCE ≠ FACT: the doc states as fact something the source marks unknown/blocked/absent (e.g. "free", "24h", "no limit") when the source never says it. Reporting this is a defect; BUT a doc that instead DEFERS ("per the official site", "not stated — confirm on site") for that same gap is CORRECT — do not flag deferral as "missing info".
14. NO CROSS-TRANSPLANT of per-entity attributes: an attribute of entity A (price, age rule, hours, limit) must come from A's OWN source, never copied from a sibling B that merely looks parallel. Two look-alike entities with genuinely different values that the doc lists separately are CORRECT, not a contradiction.
15. BOTH-VERSIONS on genuine source contradiction: where the SOURCE itself gives two official values, the doc must present BOTH (not average, not pick one). A doc that shows both is CORRECT.
${(args && args.knownFP) ? '\nKNOWN FALSE POSITIVES — do NOT report these:\n' + args.knownFP : ''}`;

// L1 coverage evidence is part of the review output. anchors: 3 quotes at ~25/50/75% depth, each
// the VERBATIM text of a real line plus that line's 1-based number — falsifiable against the file.
const COVERAGE_ITEM = { type:'object', properties:{
  file:{type:'string'},
  claimedLines:{type:'integer'},                       // total line count the reviewer sees in the file
  firstNonBlank:{type:'string'}, lastNonBlank:{type:'string'},
  anchors:{ type:'array', items:{ type:'object', properties:{
    line:{type:'integer'}, text:{type:'string'} }, required:['line','text'] } },
}, required:['file','claimedLines','firstNonBlank','lastNonBlank','anchors'] };
const FINDINGS_SCHEMA = { type:'object', properties:{
  coverage:{ type:'array', items:COVERAGE_ITEM },
  findings:{ type:'array', items:{ type:'object', properties:{
    file:{type:'string'}, quote:{type:'string'}, line:{type:'integer'}, severity:{type:'string',enum:['blocker','major','minor']}, dimension:{type:'string'}, issue:{type:'string'}, fix:{type:'string'},
  }, required:['file','quote','severity','issue','fix'] } },
}, required:['coverage','findings'] };
// `evidence` is REQUIRED and load-bearing. Measured 2026-09-10: 39 of 54 verify agents in one round
// made NO file tool call at all -- they adjudicated real/not-real from the finder's quote alone --
// because the FILE: path handed to them did not exist (f.file was already absolute and DIR was
// prepended anyway). With "default real=false when uncertain" in the bar, a blind verifier
// SUPPRESSES real findings and nothing in the output reveals it. Forcing the verifier to paste the
// line it actually read makes a blind verification visible in the round's own JSON.
const VERDICT_SCHEMA = { type:'object', properties:{ real:{type:'boolean'}, severity:{type:'string',enum:['blocker','major','minor']}, classHint:{type:'string'}, note:{type:'string'}, evidence:{type:'string'} }, required:['real','severity','note','evidence'] };
const GRADE_SCHEMA = { type:'object', properties:{ pass:{type:'boolean'}, reason:{type:'string'}, missing:{type:'array', items:{type:'string'}} }, required:['pass','reason'] };

function shardFor(i){ const s=[]; for(let p=0;p<REVIEWABLE.length;p++) if(p%NSHARDS===i) s.push(REVIEWABLE[p]); return s; }
function shardFiles(i){ return [...new Set([anchor,...shardFor(i)].filter(Boolean))]; }

function reviewPrompt(i, retryNote){
  const files=shardFiles(i);
  return `You are a meticulous senior reviewer auditing a fixed set of files. Shard ${i+1}/${NSHARDS}.
${retryNote ? '\n⚠ RE-RUN: your previous attempt was REJECTED by the report judge for: '+retryNote+'\nThis time you MUST read every assigned file end-to-end and produce complete, falsifiable coverage evidence.\n' : ''}
${CONTEXT}

${CHECKLIST}

Audit EVERY ONE of these CURRENT files across ALL lenses above:
${files.map(f=>'  '+DIR+'/'+f).join('\n')}

MANDATORY COVERAGE PROTOCOL (this is enforced — a downstream judge and a deterministic file-check
will reject a report that skimmed):
• READ EACH assigned file IN FULL. If a file is large, read it in successive offset/limit chunks
  (e.g. 1-400, 401-800, …) until you reach the LAST line — do NOT stop after the first screenful.
• For EACH assigned file, return a coverage entry with: claimedLines = the file's true total line
  count; firstNonBlank / lastNonBlank = the VERBATIM text of the first and last non-blank lines;
  and anchors = exactly 3 items quoting the VERBATIM text of a line at ~25%, ~50%, ~75% of the
  file, each with its correct 1-based line number. These are checked against the real file; guessed
  or approximate anchors FAIL the round. You cannot fill these in without actually reading to the end.
  PICK SHORT, FULLY-QUOTABLE ANCHOR LINES (≤~90 chars) near each depth — a plain prose/heading/short
  markup line, NOT a long syntax-highlighted <pre>/<span> code row: long lines get entity-re-escaped
  and hard-truncated in transport, which breaks the exact-match check even when you DID read the file.
  A short exact line keeps the check honest. (The checker also tolerates a truncated long line via a
  40+ char prefix, but a short clean line is best.)

Then report EVERY genuinely real, still-open defect with: file, exact quote, line (1-based line
number of the quote), dimension, one-sentence issue, concrete fix. Be EXHAUSTIVE within your shard —
find-everything-at-once, not a sample. No subjective taste; convince a skeptic. An EMPTY findings
array is fine ONLY if you still return full coverage evidence proving you read every file.
Severity: blocker=wrong or misleading, or leaks disallowed info; major=clearly hinders understanding; minor=small but real. Report wording a reader could misread (two plausible readings) as a defect. Do NOT report requests for content outside the corpus's scope.`;
}

function judgePrompt(i, review){
  const files=shardFiles(i);
  const cov=(review&&review.coverage)||[];
  const finds=(review&&review.findings)||[];
  return `You are a strict QUALITY-CONTROL judge for one reviewer's audit report. Your job is NOT to
re-audit the files; it is to decide whether the reviewer ACTUALLY DID THE WORK to the standard, or
skimmed. Grade against this rubric and return pass/fail.

The reviewer was assigned these ${files.length} files (shard ${i+1}/${NSHARDS}):
${files.map(f=>'  '+f).join('\n')}

Its report contained coverage for: ${cov.map(c=>c.file+'('+c.claimedLines+'L, '+((c.anchors||[]).length)+' anchors)').join(', ')||'(none)'}
and ${finds.length} finding(s)${finds.length?': '+finds.slice(0,12).map(f=>f.file+(f.line?('#'+f.line):'')+' — '+(f.dimension||'?')).join('; '):''}.

FAIL the report (pass=false) if ANY of these hold, and list them in the "missing" array:
1. COVERAGE GAP: a coverage entry is absent for any assigned file, OR an entry lacks 3 anchors, OR
   firstNonBlank/lastNonBlank/anchors are empty, placeholder, obviously generic, or clearly not real
   lines of a document (e.g. "line 1", "...", repeated identical text). Real anchors read like actual
   content from that file.
2. IMPLAUSIBLE SIZE: claimedLines is missing/zero, or the three anchor line numbers are not roughly
   ascending toward claimedLines (a genuine 25/50/75% spread), i.e. the reviewer did not reach the end.
3. FILLER FINDINGS: findings are vague/generic (no concrete quote, no line number, hand-wavy fix), or
   read like invented nitpicks rather than specific located defects.
4. TOKEN EFFORT MISMATCH: the report looks like a first-screenful skim of a long file (e.g. all
   anchors clustered near the top, or claimedLines tiny for a file the shard clearly contains).

PASS (pass=true) only if coverage is complete and credible for EVERY assigned file. NOTE: an empty
findings list is a legitimate PASS when coverage is complete and credible — do not fail a report just
for finding nothing. Judge WORK DONE, not defect count. Return pass, a one-line reason, and missing[].`;
}

const SHARD_OUTPUTS = {}; // i -> { review, grade, attempt } (final attempt), for the coverage manifest
async function reviewShard(i){
  let retryNote='';
  let last=null;
  for(let attempt=1; attempt<=MAX_REVIEW_ATTEMPTS; attempt++){
    const review = await agent(reviewPrompt(i, retryNote), { label:`rev:s${i+1}${attempt>1?('.'+attempt):''}`, phase:'Review', schema:FINDINGS_SCHEMA });
    const grade = await agent(judgePrompt(i, review), { label:`judge:s${i+1}${attempt>1?('.'+attempt):''}`, phase:'Judge', schema:GRADE_SCHEMA });
    last = { review, grade, attempt };
    SHARD_OUTPUTS[i] = last;
    if (grade && grade.pass) return last;
    retryNote = (grade && (grade.missing&&grade.missing.length ? grade.missing.join('; ') : grade.reason)) || 'insufficient coverage';
    log(`shard ${i+1} review attempt ${attempt} REJECTED by judge: ${retryNote}`);
  }
  log(`shard ${i+1} FAILED judge after ${MAX_REVIEW_ATTEMPTS} attempts — round is INCOMPLETE (coverageComplete=false)`);
  return last;
}


// EXPERT-PANEL TRIAGE (HD 2026-09-26): every finding is judged by a TEAM, not one verifier, on HD's
// three criteria: (a) is the information CORRECT, (b) is it described so the reader can understand and
// absorb it, (c) is it within the book's SCOPE (the book cannot teach everything). Outcomes are only
// DEFECT or NOT A DEFECT with a reason; there is NO "cosmetic / not worth fixing" bucket.
const PANEL_CORE = [
  { key:'domain', role:((args && args.domainRole) || 'the DOMAIN EXPERT for this corpus\'s subject') + ' (check facts, numbers, code and APIs against the file and, where you can, by running or recomputing)', owns:'(a) correctness', crit:'a-wrong' },
  { key:'learning', role:'a LEARNING-NEUROSCIENCE expert (chunking, worked examples, a term taught before it is used, sequencing that aids comprehension and memory)', owns:'(b) whether the reader can understand and absorb it: order, term used before taught, missing example, overload', crit:'b-hard-to-understand' },
  { key:'english', role:'a professional native-English language expert and communication linguist writing for a TOEIC 600-750 reader', owns:'(b) for the ENGLISH text: misreadable, two readings, wrong or unidiomatic wording that changes or blurs meaning, grammar errors', crit:'b-hard-to-understand' },
  { key:'zh', role:'a professional Taiwan Traditional-Chinese translator (Taiwan usage only, never mainland word choice, 祕 not 秘; zh must say the same thing as en)', owns:'(b) for the CHINESE text and zh/en parity: mistranslation, mainland usage, misreadable zh, zh and en disagreeing', crit:'b-hard-to-understand' },
  { key:'pm', role:'the PRODUCT MANAGER for this corpus, who owns its scope and the reader\'s journey' + ((args && args.scope) ? ('. SCOPE: ' + args.scope) : ''), owns:'(c) scope: is the requested content part of what THIS corpus teaches, or out of scope (e.g. generic programming-language or shell syntax in a topic book, which a separate language handbook covers)', crit:'c-out-of-scope' },
];
const PANEL_VIZ = [
  { key:'viz', role:'a KNOWLEDGE-VISUALIZATION expert (diagrams and steppers: every element meaningful and labelled, arrows attach correctly, no overlap or clipping, frames consistent)', owns:'(b) for diagrams and animations', crit:'b-hard-to-understand' },
  { key:'eye', role:'an OPHTHALMOLOGIST / eye-comfort reviewer for a presbyopic reader on a 16-inch laptop (~890px usable height): the whole viz block fits without scrolling and text is comfortably readable', owns:'(b) for legibility and fit', crit:'b-hard-to-understand' },
];
function panelFor(f){ return /viz|svg|stepper|diagram|figure|frame|layout|render|visual/i.test((f.dimension||'')+' '+(f.issue||'')) ? PANEL_CORE.concat(PANEL_VIZ) : PANEL_CORE; }
const PANEL_SCHEMA = { type:'object', properties:{ defect:{type:'boolean'}, criterion:{type:'string',enum:['a-wrong','b-hard-to-understand','c-out-of-scope','not-a-defect']}, severity:{type:'string',enum:['blocker','major','minor']}, reason:{type:'string'}, evidence:{type:'string'}, classHint:{type:'string'} }, required:['defect','criterion','severity','reason','evidence'] };
function panelPrompt(m, f){
  return `You are ${m.role}, on an expert triage panel judging ONE audit finding. The panel decides only DEFECT or NOT A DEFECT, never "not worth fixing".
HD's criteria (binding):
(a) the information is WRONG → DEFECT;
(b) the way it is written makes it hard for the reader to understand and absorb (misreadable, two plausible readings, unclear, a term used before it is taught, badly ordered) → DEFECT;
(c) the finding asks for content outside the book's scope → NOT A DEFECT. The book cannot teach everything. Out-of-scope content that is ALREADY on the page and gets in the reader's way is itself a DEFECT under (b) or (c): report it as defect=true, criterion c-out-of-scope, with the fix "remove".
A claim that is already correct and clear is NOT A DEFECT. Your special responsibility is ${m.owns}, but judge the whole finding.
BOOK CONTEXT:
${CONTEXT}
${(args && args.knownFP) ? 'KNOWN NOT-DEFECTS:\n'+args.knownFP+'\n' : ''}
FILE: ${String(f.file||'').startsWith('/') ? f.file : DIR + '/' + f.file}
QUOTE: ${f.quote}
LINE: ${f.line||''}
DIMENSION: ${f.dimension||''}
ISSUE: ${f.issue}
PROPOSED FIX (unverified): ${f.fix}
MANDATORY: open the FILE and read the quote in context before deciding. In evidence, paste the line you actually read, with its line number, or CANNOT_READ_FILE <path>. Return defect, criterion, severity (blocker = misleads or is wrong; major = clearly hinders understanding; minor = small but real), a one-sentence reason, evidence, and classHint (a searchable recurrence pattern, or "single").`;
}
async function panelVerify(f, i){
  const P = panelFor(f);
  const raw = await Promise.all(P.map(m =>
    agent(panelPrompt(m, f), { label:`panel:${m.key}:s${i+1}:${String(f.file).split('/').pop()}#${f.line||''}`, phase:'Verify', schema:PANEL_SCHEMA }).catch(()=>null)));
  const votes = raw.map((v,k)=>v ? {...v, who:P[k].key, owns:P[k].crit} : null).filter(Boolean);
  const blind = votes.length < P.length || votes.some(v => !String(v.evidence||'').trim() || /CANNOT_READ_FILE/i.test(v.evidence));
  const by = k => votes.find(v=>v.who===k);
  const dom = by('domain'), pm = by('pm');
  // Decision rule: wrong information is always a defect (domain expert). Out of scope is the PM's call
  // (unless the information is wrong). Otherwise an expert's DEFECT vote inside the criterion it owns
  // is decisive (e.g. only the zh translator may see a zh mistranslation); failing that, a majority.
  let real, basis;
  if (dom && dom.defect && dom.criterion==='a-wrong') { real = true; basis = 'domain: information wrong'; }
  else if (pm && pm.criterion==='c-out-of-scope' && !pm.defect) { real = false; basis = 'pm: out of scope'; }
  else {
    const owner = votes.find(v => v.defect && v.criterion===v.owns && v.who!=='pm');
    const yes = votes.filter(v=>v.defect).length;
    if (owner) { real = true; basis = `${owner.who}: owned criterion ${owner.criterion}`; }
    else if (pm && pm.defect && pm.criterion==='c-out-of-scope') { real = true; basis = 'pm: out-of-scope content on the page (remove)'; }
    else { real = yes*2 > votes.length; basis = `majority ${yes}/${votes.length}`; }
  }
  const rank = { blocker:0, major:1, minor:2 };
  const pool = votes.filter(v=>v.defect===real);
  const sev = (pool.length?pool:votes).map(v=>v.severity).sort((x,y)=>rank[x]-rank[y])[0] || 'minor';
  const note = `[${basis}] ` + votes.map(v=>`${v.who}:${v.defect?'DEFECT':'NOT'}(${v.criterion}) ${v.reason}`).join(' | ');
  const evidence = blind ? '' : votes.map(v=>v.evidence).join(' || ');
  const classHint = (votes.find(v=>v.defect && v.classHint && v.classHint!=='single')||{}).classHint || 'single';
  return { ...f, shard:i, verdict:{ real, severity:sev, note, evidence, classHint } };
}

phase('Review');
if (FILTER_BLIND.length) log(`Filter-blind (excluded from LLM shards; cover with deterministic guards + manual pass): ${FILTER_BLIND.join(', ')}`);
const shards = Array.from({length:NSHARDS}, (_,i)=>i);
const results = await pipeline(
  shards,
  (i) => reviewShard(i),
  (rj, i) => {
    const review = (rj && rj.review) || {};
    const finds = review.findings || [];
    if (!finds.length) return [];
    return boundedParallel(finds, (f) => panelVerify(f, i), VERIFY_CONCURRENCY);
  }
);

const flat = results.flat().filter(Boolean);
// UNVERIFIED = the verifier could not open the file, or returned no evidence of reading one. Those
// verdicts are NOT adjudications whichever way they landed, and a round carrying any of them must
// not count toward a clean streak.
const blindVerdicts = flat.filter(f => {
  const e = (f.verdict && f.verdict.evidence) || '';
  return !e.trim() || /CANNOT_READ_FILE/i.test(e);
});
const confirmed = flat.filter(f => f.verdict && f.verdict.real);
const niceToHave = []; // HD: no "not worth fixing" bucket
const notDefects = flat.filter(f => f.verdict && !f.verdict.real);
const rank = { blocker:0, major:1, minor:2 };
confirmed.sort((a,b)=>rank[a.verdict.severity]-rank[b.verdict.severity]);

// assemble coverage manifest + completeness (a shard is complete only if its final judge passed).
// pipeline() returns the stage-2 (verify) outputs, so the stage-1 review/grade per shard is read
// from SHARD_OUTPUTS, which reviewShard populated as a side effect.
const coverageAll = [];
let coverageComplete = true;
for (const i of shards){
  const rj = SHARD_OUTPUTS[i];
  if (!rj || !rj.grade || !rj.grade.pass) coverageComplete = false;
  const cov = (rj && rj.review && rj.review.coverage) || [];
  for (const c of cov) coverageAll.push({ shard:i, ...c });
}

if (blindVerdicts.length) {
  coverageComplete = false;
  log(`⚠ ${blindVerdicts.length}/${flat.length} verdicts came back WITHOUT evidence of reading the file (blind verification). Those are not adjudications. coverageComplete=false — re-verify them.`);
}
log(`content audit round ${ROUND}: ${confirmed.length} in-spec must-fix, ${niceToHave.length} nice-to-have, of ${flat.length} raw (${NSHARDS} shards over ${REVIEWABLE.length} files); coverageComplete=${coverageComplete}`);
if (!coverageComplete) log('⚠ coverageComplete=false — at least one shard failed the report judge. This round MUST NOT count toward a clean streak; re-run it.');
return {
  round: ROUND, confirmedCount: confirmed.length, niceToHaveCount: niceToHave.length, rawCount: flat.length,
  coverageComplete,
  coverage: coverageAll,
  confirmed: confirmed.map(f=>({file:f.file,line:f.line,dimension:f.dimension,severity:f.verdict.severity,quote:f.quote,issue:f.issue,fix:f.fix,classHint:f.verdict.classHint,note:f.verdict.note})),
  niceToHave: [],
  notDefects: notDefects.map(f=>({file:f.file,line:f.line,dimension:f.dimension,quote:f.quote,issue:f.issue,note:f.verdict.note})),
};
