# AUDIT_DIMENSIONS.md — Cumulative Risk Checklist for External Reviews

**Purpose:** A MINIMUM checklist of "must-not-miss" dimensions accumulated from every past review round. Every new external audit team receives this file so nothing previously-found-hard-to-catch slips through again.

> ⚠️ **THIS IS A FLOOR, NOT A CEILING.** The audit team is expected to look BEYOND this list. Bring fresh eyes, novel lenses, whatever risks your role notices — this document only guarantees the historically-slippery classes are re-scrutinised, it does NOT limit scope. If you see something not covered here, that's the point: report it, and it will be appended for the next round.

## 🧑‍🎓 MANDATORY ROSTER (user rule, 2026-08-17): every external audit team MUST include these FOUR core roles, regardless of what else is on the team

1. **小四→高一 成長模擬學生 (elementary-to-high-school-learner)** — role-play a real student in first person. START as a curious 小四, actually "work through" the beginner content year by year (小四→小五→小六→國一→國二→國三→高一), narrating in first person what you understand, what confuses you, what's fun, and exactly where you'd give up or feel outgrown. END with three sections: (A) year-by-year growth journey, (B) GAPS where the site fails to grow with you, (C) DELIGHTS that kept you coming back. This is the primary lens for whether ONE site can carry a child from grade 4 to grade 10 — do not omit.
2. **兒童教育專家 (child-education expert, PAIRED with the learner)** — walk alongside the learner as they grow, observing what a 小四→高一 actually needs at each rung: scaffolding order (concrete→abstract), teach-precedes-practice, misconception handling, cognitive-load, age-appropriateness of framing (must not baby-talk a 國中生 nor abstract-over-the-head-of a 小四), examples that fit each age. Flag any place where the child would get stuck, mis-scaffolded, or drop off.
3. **心理醫生 (child/adolescent psychologist, always present)** — motivation, emotional safety, growth-mindset, autonomy, healthy engagement across ages. Does the tone/feedback/reward stay supportive and non-anxious for a 小四 AND still respectful/non-babyish for a 國中/高一? No dark patterns, shame, pressure, materialism, streak-guilt, or age-mismatched framing. Does it foster intrinsic motivation as the learner matures?

4. **語言醫師 / 兒童溝通-表達專家 (child-communication / phrasing specialist, always present)** — judges HOW things are said, because wrong phrasing means the child tunes out ("講法不對就聽不進去"). Is every explanation, question, feedback line, and safety/values message phrased so a child of that age actually absorbs it — concrete, warm, plain, not preachy/scary/abstract/jargon-heavy? Flag wording that is too adult, too babyish, guilt-tripping, or that states a rule WITHOUT a child-graspable reason.

These FOUR form the STANDING CORE of every external review. Add any additional roles per round (visual publisher / native English / subject professor / usability / adversarial reviewer / proofreader / 安全專家 for safety rounds / etc.) as the round requires.

## 📣 CONTENT PRINCIPLE (user rule, 2026-08-17): always teach the WHY, in child-absorbable language
Every lesson / rule / safety message MUST explain **why** it matters and **what could happen if you don't** — framed for a child to understand and internalise, not just memorise. Never state a bare rule ("不要跟別人說家裡多有錢") without its reason + consequence ("因為讓不熟的人知道，可能會被盯上或被騙"). Pair with the 語言醫師 lens: right reason + right phrasing = the child actually takes it in. Applies to ALL content; HARD requirement for the safety / SEL / values rounds.

**Meta-rule (from user 2026-08-16):** the checklist gives *DIMENSIONS / classes of problem* found in past rounds, **never the specific instances or their answers/fixes**. Handing over specific findings anchors reviewers and destroys independent re-discovery. Every instance must be independently re-verified; treat nothing as pre-checked.

Update after every review round: append any NEW class of defect that was found (not a specific instance).

---

## Standing risk dimensions (all rounds must scrutinise)

### Content correctness
1. Every multiple-choice question has exactly ONE defensible answer (watch near-synonym distractors that are also valid; watch numerically-equal options like 3/6 vs 1/2).
2. Facts across every subject (definitions, word↔Chinese gloss match, science facts/formulas/units, mass vs weight & scalar vs vector, math worked answers, idiom meanings & 破音 readings, Taiwan/world geography, history dates, social neutrality/safety, finance concepts) — independently verify with authoritative sources; assume nothing is pre-checked.
3. Diagram vs text match: the picture must depict what the accompanying text/answer claims (arrow directions, coordinate plotting, particle states, force balance, food-chain energy flow, metamorphosis order, net-vs-cube validity, angle types, ratios, probabilities, budget bar proportions). A diagram that *implies* the opposite of the taught fact is a BLOCKER (e.g. an elongated orbit diagram used to teach "seasons are NOT caused by distance"; a fulcrum drawn as a downward-pointing arrow on a "balance" lesson).
4. Answer keys are not visible in the question SVG (no coordinate label on the answer-plotted point; no aria-label leak; no correct-option being systematically the longest sentence).
5. Explanation ("why") text is consistent with the marked answer.

### Language & i18n
6. Traditional Chinese only. Any Simplified char = defect. (U+53F0 台 = accepted info-only.)
7. English content in flashcards / english_sense / any English-in-STEM: correctness, naturalness, non-babyish, no dated/gendered terms, example sentence must match the stated meaning (not another sense of the same word).
8. No 錯別字 across all Traditional-Chinese content (審查 committee / 主動 etc.).

### Accessibility
9. Informational SVG `<text>` and answered-option feedback text: contrast >= 4.5:1 in BOTH light AND dark themes (composite over the actual card background). Structural graphic strokes >= 3:1 in both. Emoji + fixed-color decorative marks with redundant text captions >= 3:1 accepted; solo informational glyphs must clear 4.5:1.
10. No meaning-by-colour-alone (must also carry a shape/label).
11. Tap targets >= 44px. Font >= 11 for informational SVG labels.
12. No horizontal overflow at 390px; no page-load `[hidden]` display bugs; overlays never cover the page on load.

### Isolation & engine health
13. Concept pages (先學觀念) local-only: write ONLY their own *_concepts_v1 key (game_core session writes to player_profile_v1 like lastRoute/streak/theme are EXPECTED framework behaviour, NOT a defect). ZERO XP/coins/badges awarded by concept pages.
14. Advanced pages (數學進階/國文進階/etc.) — see the growth-ladder dimension below.
15. Non-English content pages: ZERO read-aloud audio (no `<audio>`, no `Audio()`, no `speechSynthesis`). English pages MAY use local child-voice mp3.
16. Zero console errors on load and through the full flow.

### Cross-page / structural (added 2026-08-17)
17. **Growth ladder**: does the site chain concept → practice → advanced within each subject? Every practice page should link FORWARD to its advanced counterpart when one exists (mirrors the backward "還沒學過嗎？先到概念養成" banner); concept-finish CTA should deep-link to the matching practice level, not the subject home.
18. **Reward continuity across ages**: gamification (XP/level/streak/coins/progress-ring) must continue to reward a learner as they age up through advanced pages. If advanced pages award zero XP, motivation collapses in 國中/高一 — that's a MAJOR by itself.
19. **Route-name / continue-tile completeness**: every real learning page must be in ROUTE_NAMES so the hub's "繼續上次" tile renders after any subject.
20. **Persistent nav completeness**: phone bottom-tab and tablet rail-nav either fit the full subject list or provide a scroll affordance / overflow indicator. No silently-truncated tabs.
21. **Daily-task adaptivity**: hard-coded "5 English flashcards" style suggestions age out fast. Should adapt to the learner's current level per subject.
22. **Concept-layer coverage**: teach-before-practice scaffold should exist for ALL subjects a learner may struggle with (國語/英文/社會 need it as much as math/science do).
23. **Nav consistency**: exactly one 🏠 home affordance per page; in-page "back" uses a consistent ← icon, never a 2nd 🏠. `[hidden]` overlays have a display:none guard.

### Tone / age fit
24. Growth-mindset framing, non-punitive wrong-answer feedback (never shame/pressure/loss aversion).
25. No dark patterns (leaderboards, loss-of-progress threats, gacha/loot-box, real money, artificial scarcity, streak-guilt copy).
26. Framing scales with age: advanced pages (國中→高一 tier) must not address readers as 小朋友 / use childish distractors (糖果/寶石)/close with 小達人. Basic pages must not use grown-up abstractions that lose a 小四.
27. Anti-materialism on finance/economics content (frame saving as goal/security, not "buy pricier things").

### Regression hotspots (from past rounds — always re-check these classes)
28. **Balance/fulcrum SVG**: any balance-scale diagram must have its fulcrum as an UPWARD triangle whose apex meets the beam (not a long vertical pole ending in a downward-pointing triangle — that reads as an arrow piercing the beam).
29. **Answer-leak via aria-label**: nested SVG helpers whose aria-label spells out the numeric answer to screen readers. Wrap QUIZ SVGs so the inner aria is stripped; TEACH SVGs may retain descriptive aria.
30. **Currency-of-answer leak in the DIAGRAM**: teach-diagrams that render the answer as visible text on the same question's diagram (e.g. coord label on the point the student must identify).
31. **Seasons/moon-phase misconceptions**: 四季 must be axial tilt (NOT distance) — and the *diagram* must not visually imply distance. 月相 is illumination view (NOT Earth's shadow / 月食).
32. **Multi-answer conjunction/adverb questions in chinese.html**: 「選最恰當」-style items often have 2+ defensible options; distractors must be clearly-wrong.
33. **Do/作 disputes**: 做/作 items must follow Taiwan MOE convention and each item single-answer.
34. **File-open Simplified regressions**: whenever a review adds/edits content, re-run `python3 tools/scan_simplified.py` on the changed files.

---

## Instructions for the audit-team prompt

1. Load this file into the audit prompt as: "Historical risk dimensions — scrutinise these classes across the site independently; **this is a floor, not a ceiling — look beyond it too**. Do not assume any is pre-checked. DO NOT reveal any specific finding/fix from past rounds — treat every instance as unaudited."
2. Assign each dimension cluster to the role that best matches its lens (content→subject-professor; a11y→ophthalmologist; growth-ladder→learner + usability; tone→psychologist; etc.).
3. Require role-independent verification — no role rubber-stamps another; every issue must be independently re-derived.
4. After each round, append any NEW dimension class (not instance) that emerged, so the next audit catches it too.

**Never in the audit prompt:** specific pages/lines/answers found in past rounds. Those are internal tracking only, in memory + git history.
