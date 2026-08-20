export const meta = {
  name: 'gongguan-fix-defs',
  description: 'Coverage-safe max-rigor rewrite of one vocab set\'s definitions (kid-level, correct-sense) with independent adversarial verification; definitions only',
  phases: [ { title: 'Manifest + style guide' }, { title: 'Propose + verify (by word)' }, { title: 'Apply + gate' } ],
}

const REPO = '/Volumes/workplace/EnglishTraining/english-vocab-deploy'
// args = { file: 'vocab_data_yle_flyers.js', setKey: 'yle_flyers', label: 'YLE Flyers' }
const FILE = args.file, SETKEY = args.setKey, LABEL = args.label || args.setKey

const SHARED = `
Repo: ${REPO}. File: ${REPO}/${FILE} — JS assigning WORD_DATA["${SETKEY}"] = { name, color, words:[ {word, definition, chinese, sentence, tip, emoji, roots}, ... ] }. Reader: Taiwanese 公館國小 4th grader (小四, ~9-10 yrs), American English.
CORRECTNESS IS PARAMOUNT — a wrong definition harms a child; be rigorous, token cost is no object.
HARD CONSTRAINTS: change the "definition" field ONLY. NEVER change word/sentence/chinese/emoji/roots (audio is keyed to word+sentence). Definitions stay ENGLISH (English-to-English). Traditional Chinese only elsewhere; gate: \`python3 tools/scan_simplified.py ${FILE}\`.
`

const MANIFEST_SCHEMA = { type:'object', additionalProperties:false, properties:{
  words:{ type:'array', items:{ type:'object', additionalProperties:false, properties:{
    index:{type:'integer'}, word:{type:'string'}, currentDef:{type:'string'},
    sentence:{type:'string'}, emoji:{type:'string'} }, required:['index','word','currentDef'] } } }, required:['words'] }

const PROPOSAL_SCHEMA = { type:'object', additionalProperties:false, properties:{
  items:{ type:'array', items:{ type:'object', additionalProperties:false, properties:{
    index:{type:'integer'}, word:{type:'string'}, oldDef:{type:'string'}, newDef:{type:'string'},
    senseCheck:{type:'string'}, changed:{type:'boolean'} },
    required:['index','word','oldDef','newDef','senseCheck','changed'] } } }, required:['items'] }

const VERIFY_SCHEMA = { type:'object', additionalProperties:false, properties:{
  items:{ type:'array', items:{ type:'object', additionalProperties:false, properties:{
    index:{type:'integer'}, word:{type:'string'}, finalDef:{type:'string'},
    verdict:{type:'string', enum:['approved','corrected','low-confidence']},
    problem:{type:'string'}, confidence:{type:'string', enum:['high','medium','low']} },
    required:['index','word','finalDef','verdict','problem','confidence'] } } }, required:['items'] }

phase('Manifest + style guide')
const [manifest, guide] = await parallel([
  () => agent(`${SHARED}\n\nRead ${FILE} and return the EXACT ordered manifest of every entry in WORD_DATA["${SETKEY}"].words: for each, its 0-based index (array order), word, currentDef (the definition field verbatim), sentence, emoji. Do not skip, merge, or reorder any entry. Do not edit the file.`, { label:'manifest', phase:'Manifest + style guide', schema:MANIFEST_SCHEMA }),
  () => agent(`${SHARED}\n\nYou are a NATIVE English teacher + children's-readability specialist. Skim ${FILE}. Produce a concise definition style guide for rewriting the "definition" field for a 小四: (a) pick the word's MOST COMMON everyday sense matching its example sentence/emoji (not obscure/verb/first-dictionary senses — e.g. harbor=a place where boats stay safe, NOT "keep a feeling secretly"); (b) ~6-12 words, one clause; (c) A1 words INSIDE the definition (ban words harder than the headword, no Latin/chemistry/"(auxiliary)"); (d) no dictionary residue (DERIVATIVES/PHRASES/etymology/"British English"); (e) concrete & picture-able; (f) never circular. Give ~8 before→after examples drawn from THIS set. Return the guide text.`, { label:'guide', phase:'Manifest + style guide' }),
])

const words = (manifest && manifest.words) || []
const BATCH = 40
const batches = []
for (let i = 0; i < words.length; i += BATCH) batches.push(words.slice(i, i + BATCH))
log(`${LABEL}: ${words.length} words in ${batches.length} batches of ≤${BATCH}`)

phase('Propose + verify (by word)')
const verified = await pipeline(batches,
  (batch, _b, i) => agent(`${SHARED}\n\nStyle guide (follow EXACTLY):\n${guide}\n\nRewrite the "definition" for EXACTLY these ${batch.length} entries (do every one; keep index+word as given). Entries (index, word, currentDef, sentence, emoji):\n${JSON.stringify(batch)}\n\nFor each return index, word, oldDef(=currentDef), your newDef, senseCheck (the common kid sense + why it fits the sentence), changed(true if newDef differs). Do NOT edit the file.`, { label:`propose:b${i}`, phase:'Propose + verify (by word)', schema:PROPOSAL_SCHEMA }),
  (prop, batch, i) => agent(`${SHARED}\n\nADVERSARIAL fact-checker (independent). Verify these proposed definitions for ${LABEL} — treat each as suspect: correct COMMON kid sense? consistent with the entry's sentence? A1-simple? American English? no residue? not circular? no Simplified Chinese? If unsure of a word's correct sense, consult authoritative sources (you MAY load WebSearch/WebFetch via ToolSearch to check a dictionary). Fix weak/wrong ones yourself in finalDef (verdict='corrected'); solid ones 'approved'; if you truly cannot determine the sense, 'low-confidence' with best finalDef. Cover EVERY item you were given.\nProposals: ${JSON.stringify((prop && prop.items) || [])}`, { label:`verify:b${i}`, phase:'Propose + verify (by word)', schema:VERIFY_SCHEMA })
)

const items = verified.filter(Boolean).flatMap(v => v.items || [])
const coveredWords = new Set(items.map(x => x.word))
const missing = words.filter(w => !coveredWords.has(w.word)).map(w => ({ index:w.index, word:w.word }))
const lowConf = items.filter(x => x.confidence === 'low' || x.verdict === 'low-confidence')
log(`${LABEL}: verified ${items.length}/${words.length}; missing ${missing.length}; low-confidence ${lowConf.length}`)

phase('Apply + gate')
const applied = await agent(`${SHARED}\n\nYou are the applier + QA. Apply these verified final definitions to ${REPO}/${FILE}. Match each by WORD (if a word appears more than once, disambiguate by index). Update ONLY the "definition" field; preserve all other fields + JS structure exactly. IMPORTANT: if a matched entry has NO existing "definition" field at all (some entries jump straight from word: to chinese:), INSERT definition:"<finalDef>" immediately AFTER its word: field (this field insertion is the ONLY allowed structural addition) — do not skip it. Use a Python/node script (proper escaping), not fragile hand-edits.\nVerified items: ${JSON.stringify(items)}\n\nThen VERIFY and report: (1) \`node --check ${FILE}\` parses; (2) \`git diff ${FILE}\` touches ONLY definition: fields — confirm word/sentence/chinese/emoji/roots are byte-identical (report count of non-definition changes, must be 0); (3) count of definitions changed; (4) \`python3 tools/scan_simplified.py ${FILE}\` → PASS; (5) echo back any words in this MISSING list that therefore still have unreviewed definitions: ${JSON.stringify(missing)}. Do NOT invent definitions for missing words — just report them.`, { label:'apply+gate', phase:'Apply + gate' })

return { set: LABEL, total: words.length, verified: items.length, missing, lowConfidence: lowConf, applied }
