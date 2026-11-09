# 學習路徑重構 — 實作進度記錄（LIVE，跨 session resume）

> ★★ **先讀計畫再看流水帳**：導航總圖＝`authoring/LEARNING_PATH_BUILD_PLAN.md`（分階段計畫＋現狀＋完成定義），
> 即時進度＝`python -I tools/build_status.py`（自我稽核儀表板）。**每次 context compact 後，做任何學習路徑工作前先重讀 BUILD_PLAN＋spec**，否則會「忘了計畫就東做一個西做一個、甚至把英文當成做完」。本檔為其下的詳實流水帳。

> 本檔＝**實作進度的詳實流水帳**（HD 2026-11-01 要求：進度詳實記錄、跨 session 可續做）。
> **規範唯一來源仍是 `LEARNING_PATH_REBUILD_SPEC.md`**（本檔不具 normative 力，衝突以 spec 為準）。
> 每完成一個可 rollback 的步驟就 commit（pathspec）＋push，並在此追加一列。最新在最上。

## 2026-11-09 21:42 英語島收斂：eng-timeclause（時間子句 when/while/as/before/after/until）5/5 → 收斂 301/332（90.7%）
- **sha** `cc64e5618ccb1493`，DONE-GATE 七關全綠。t_mid 會考級時間子句（未來子句用現在式不用 will／while·as 同時／before·after·until 先後與終點）。content_audit 修 3（instructional-design 為主）：
  1. r1 minor：title_zh／situation_group 漏列 `as`→補齊（與 can_do/teach 一致）。
  2. r2 major：c-tc-order claim「before=earlier」未錨定參照→改「before X=動作比 X 早…」消歧義。
  3. r3+r5 major：`as` 只提及未示範→teach 補 as 例句（As I was walking home…）；`until` 誤置 while/as 同時段→另立 before/after/until 順序段＋until 例句（與 c-tc-order 分組一致）。修後重凍 sha，r1-r5 連 5 clean。

## 2026-11-09 20:31 英語島收斂：eng-thereis（說有什麼 There is/are・Is there…?）5/5 → 收斂 300/332（90.4%）
- **sha** `f37424d3612ef791`，DONE-GATE 七關全綠，content_audit **0 缺陷一次過**（5 連 clean、L3 皆 exit 0）。t_base communicative 單元：There is a+單數／There are+複數(字尾 s)／Is there a…?＋Yes, there is./No, there isn't.；學習者端零文法術語。
- round1 唯一 raw finding（P1 distractor「Is there a cat.」以句點結尾）經 panel **7/7 判 NOT A DEFECT**：P1 要求選『陳述句』，四選項一律句點結尾＝刻意 anti-cue，逼以字序而非標點判斷；加問號反而重新注入 cue。已寫入 knownFP 傳入 r2-r5，後續零 raw。**里程碑：eng 破 300。**

## 2026-11-09 20:16 英語島收斂：eng-themore（the+比較級…the+比較級）5/5 → 收斂 299/332（90.1%）
- **sha** `fa46e2bb0279baf4`，DONE-GATE 七關全綠。t_mid 會考級「the 比較級…, the 比較級…」雙子句結構（前後子句各一比較級、兩子句對應連動）。content_audit 修 1：
  1. round5 minor（answer_evidence cross-ref）：P3「The less you worry, the happier you feel.」句無 more+noun 結構，`answer_evidence` 由 `c-tm-more-noun` → `c-tm-two-clauses`。修後重凍 sha、streak 重跑 1→5 連 clean（L3 皆 exit 0）一次過。

## 2026-11-09 19:43 英語島收斂：eng-thatobject（that 名詞子句當受詞）5/5 → 收斂 298/332（89.8%）
- **sha** `0c07e728f02d1b96`，DONE-GATE 七關全綠。t_mid 會考級 that-object（that 引導名詞子句陳述事實/看法當 think/know/believe/say/hope 受詞、that 常可省略、子句是陳述句非問句、是非問句用 whether/if）。content_audit 修 2：
  1. round2 minor（english naturalness）：teach「say a yes/no question」→「ask」。
  2. round5 major（full-panel a-wrong）：P2「I think if he is right.」distractor 把 think+if 不合文法誤框為「意思變成不確定」（像合法變義）→ 改「句子不通；是否用 wonder/ask」與同題 what 誘答一致。
- P6 dictation「I think that she will win the game.」非 teach/shadowing 逐字＝真 transfer。

## 2026-11-09 19:06 英語島收斂：eng-tenseconsistency（時態一致）5/5 → 收斂 297/332（89.5%）
- **sha** `d4bd6e5e2f0bdf5f`，DONE-GATE 七關全綠，**content_audit 0 缺陷（5 輪一次過，無 fix）**。t_adv 學測級 tense-consistency（同一時間軸不無故跳時態、過去敘事保持過去、現在習慣保持現在、時間真的改變才換時態）。6 題含 identify-bad（TC3）、justified-shift（TC4）、rewrite（TC6）多題型，皆唯一正解＋rationale＋evidence 兌現 claim；純文字 shadowing（無音檔）、_note 無假宣稱。
- Phase-1 預檢全過＝一次過，延續「嚴謹預檢＋_note 無假宣稱」高效模式（對比上一檔 tenseagree 舊債重、改 4 處）。

## 2026-11-09 18:50 英語島收斂：eng-tenseagree（名詞子句時態呼應）5/5 → 收斂 296/332（89.2%）
- **sha** `b45e1c09ee202a23`，DONE-GATE 七關全綠（含重產 `audio/tsq_dict1.mp3`）。t_adv 學測級 sequence-of-tenses（主句過去→子句退一步、will→would/can→could、真理可留現在式、主句現在不退步）。content_audit 共修 4 panel-confirmed＋1 Phase-1：
  1. Phase-1：P6 dictation 原「He said that he would call me later.」與 teach ex2 逐字重疊（recall-not-transfer）→ 改「She told me that she would visit us soon.」＋重產 tsq_dict1.mp3。
  2. round1 blocker（full-panel a-wrong）：P4 單選把選擇性 backshift「went」判錯（teach line110 真理 backshift 可選）＝雙解 → distractor went 換 go（三單漏 -s，無疑義錯）。
  3. round1 minor（english naturalness）：teach「the clause tells a permanent fact」→「states」。
  4. round2 major（full-panel test-before-teach）：P5 考「主句現在式→不退步」(c-ts-present-main) 但 teach 未教 → 補 present-main 不退步 teach text block。
  5. round2 major（english decisive）：P1「will be」distractor 混「would be 或 was」（未來 vs 現在狀態退步）→ 只講 was。
- 效率註記：此檔舊債較重（逐輪各 1），另一輪因 L3 淺 anchor（reviewer 只驗到 50% 深度）判 INVALID 撤回重跑——L3 truth-check 正常發揮，非內容問題。

## 2026-11-09 16:18 英語島收斂：eng-svagreement（主詞動詞一致）5/5 → 收斂 295/332（88.9%）
- **sha** `ae6f173af8fdb41c`，DONE-GATE 七關全綠，**content_audit 0 缺陷（5 輪一次過，無 fix）**。t_adv 學測級 SVA：單/複數一致、第三人稱單數 -s、介系詞片語（of apples/in my class）不改變主詞數（The box of apples IS）、each/every＋單數視為單數（each of＋複數仍單數）。內容依 Swan/Cambridge/Oxford 正確；6 題皆唯一正解＋distractor_rationales＋answer_evidence 兌現 claim；SVA6 考 c-sva-article（A good dictionary helps）teach 例句有兌現。純文字 shadowing（無音檔）、_note 無假宣稱。
- Phase-1 預檢全過（scan_simplified/unit_schema/question_correctness/pedagogy 皆綠）＝一次過，延續「嚴謹預檢＋_note 無假宣稱」高效模式。

## 2026-11-09 16:03 英語島收斂：eng-superlative（最高級）5/5 → 收斂 294/332（88.6%）
- **sha** `c3b174a2c09bcc4b`，DONE-GATE 七關全綠（audio_exist 1544 refs 全存在；含重產 `audio/supl_dict1.mp3`）。content_audit 共修 3 個 panel-confirmed＋先前 Phase-1 補 CVC 雙寫教學：
  1. round2 zh/en parity（translator+PM DEFECT）：英文 teach 絕對句「Don't forget to put 'the' before a superlative.」↔zh_hint「通常」強度不一致、且絕對說法過度宣稱（possessive/adverb 例外）→ 英文軟化為「We usually put 'the' before a superlative.」、zh_hint 去「別忘了」。
  2. round3 shadowing note 引用不存在片語（full-panel，major）：note 說「the most interesting、the best 連著唸順」但兩句 shadowing 只有 the tallest / the best → 改「the tallest、the best」。
  3. 先前：P6 dictation 原「This is the best day of my life.」與 teach ex3 逐字重疊（recall-not-transfer）→ 改「She is the happiest person I know.」＋重產 supl_dict1.mp3；CVC 雙寫規則（big→the biggest）can_do/claim 有而 teach 無 → 補 -est 後雙寫 text block。
- 本檔 session 另落地 HD 要求的 **runtime 資料位置 gate**（見下方條目）。

## 2026-11-09 15:XX 基建：runtime 資料位置 fail-closed gate（HD「這應該可以 gate 防止」）
- 規則：runtime 檔（根 `*.html`＋`assets/*.{js,mjs}`）字串字面值（排除註解）不得 fetch/import/src `authoring/...` 資源——`authoring/` 是 workspace、loop 會清理、放 runtime 資料會線上 404（曾真的發生 speaking_nav_map.json）。
- `tools/runtime_data_location_gate.py`（commit a05ce435f）：`--verify`/`--selftest`（紅隊）/`<file>`；全站 verify CLEAN；紅隊 PASS（壞案例擋 3、好案例含註解放行 0）。
- push-guard hook `.claude/hooks/runtime-data-location-push-guard.sh` 掛 PreToolUse(Bash)：git push 時跑 gate、違規 deny；紅隊 4 案全過。`.claude/` 禁 commit 故 hook 留本地、gate 進 git。

## 2026-11-09 15:09 英語島收斂：eng-suggestshould（建議要求動詞後 that 子句 mandative subjunctive）5/5 → 收斂 293/332（88.3%）
- **sha** `8403146044c609ad`，DONE-GATE 七關全綠，**content_audit 0 缺陷（5 輪一次過，無 fix）**。t_sub 學測級 mandative subjunctive（suggest/recommend/insist/demand/require/propose + that 子句用原形），內容依 Swan/Cambridge 正確；例句皆「要求」義（非 insist「斷言」義），無過度宣稱。
- Phase-1 預檢全過：pedagogy 僅 2 parity-advisory（c-no-s-no-past 由過去式 distractor 實測、c-should-optional teach-only nuance，皆 panel 放行）；無音檔/dictation（text-only shadowing，_note 屬實、無 distractor-taxonomy 假宣稱）。
- 效率對照：Phase-1 嚴謹預檢＋_note 無假宣稱＝一次過，與前幾檔舊 _note 債累積型（連 3–4 輪各 1 修）對比明顯。

## 2026-11-09 14:52 英語島收斂：eng-subjectofinfinitive（不定詞意義主詞 for/of）5/5 → 收斂 292/332（88.0%）
- **sha** `752973c32508af97`，DONE-GATE 七關全綠。content_audit 共修 4 個 panel-confirmed（均舊檔 teaching 債）：
  1. claim 英文 `meaning subject`（意義主詞 calque）↔teach 標準 `logical subject` 不一致 → 統一 logical subject（中文術語「意義主詞」為正規配對、不動）。
  2. 測而未教：P3 考 verb-governed `wait for + object + to V`（claim c-si-waitfor）但 teach 只示範形容詞 for/of frame → teach 補 text block 示範該句型（內嵌例句，免新增音檔）。
  3. zh_hint「邏輯主詞」↔title/can_do/_note「意義主詞」中文兩名 → 統一「意義主詞」。
  4. word gap：P5 考 good of you、claim c-si-of 列 good，但 teach 形容詞清單漏 good（good of↔good for 最易混）→ teach body/zh_hint 補 good；另 _note 清單同步補 good（省 panel raise-dismiss 成本）。
- P6 dictation `It was very kind of you to help me.` 非 teach/shadowing 逐字（kind vs nice、help me vs invite me）＝真 transfer。

## 2026-11-09 13:55 英語島收斂：eng-stativeverb（狀態動詞）5/5 → 收斂 291/332（87.7%）
- **sha** `241c79153bd2a45f`，DONE-GATE 七關全綠。content_audit 共修 4 個 panel-confirmed 缺陷（均 full-panel、重度「舊檔 _note／教學設計債」累積型，一輪一個）：
  1. teach 英文 `'have' means 'own'`＋gloss `(owns)` 不精確（不 own 兄弟；stative have＝possession）＋與 claim 矛盾 → `'possess'`＋`(possession)`（domain a-wrong）。
  2. P1 distractor `be understanding` 理由誤標「be+原形」（understanding 實為 -ing 形）＋與 line144/P4 矛盾 → 正確描述（domain a-wrong）。
  3. P1/P2 裸 -ing distractor「缺助動詞」與 P3/P4/P5「缺 be 動詞」不一致（會考級助動詞=do/does）→ 統一「缺 be 動詞」（terminology）。
  4. _note distractor 分類「助動詞後接 has」實際無此誘答（P3 has 是主詞一致性 we+has）→「主詞與動詞不一致」（a-wrong）；另修 _note see=meet 例句 doctor→dentist（與 learner 內容一致，省 panel 每輪 raise-dismiss 成本）。
- **教訓（待 bank memory）**：冗長 _note 設計註解若對「自身 distractor 分類／例句」做事實宣稱，會成 content_audit finding sink——panel 把 _note 不實宣稱判 a-wrong（即使非 learner-facing）。日後 Phase-1 應把 _note 的 distractor-taxonomy／example 宣稱逐項對照實際題目預檢。
- P6 dictation `She loves music and knows many songs.` 非 teach/shadowing 逐字＝真 transfer，無需 freshen。

## 2026-11-09 12:52 英語島收斂：eng-sickadvice（生病時怎麼做）5/5 → 收斂 290/332（87.3%）
- **sha** `b31616b3f1811b1c`，DONE-GATE 七關全綠（scan_simplified／unit_schema／question_correctness／audio_exist 1544refs／per_page_5clean／pedagogy 0／source_tree 290）。commit `5e676bee4`（修正）＋本收斂 commit。
- **Phase-1 freshen**：P4 dictation 原 `Drink water.` 逐字等於 teach ex1/P1/P6/shadowing（recall-not-transfer）→跨兩組新組合 `Stay home. Get some rest.`＋重產 `sk_dict_01.mp3`（en-US-AnaNeural）。
- **round2 panel defect（translator 擁有的 zh/en parity criterion 決定票）**：glosses `多喝水`↔`Drink water.`、`多休息`↔`Get some rest.` 的中文「多」(quantity) 英文裸祈使句沒有；且 sibling `english_modalshould` 把 `多喝水` 對應 `drink more water`，跨檔不一致。English 專家認可裸祈使句自然→**中文側修正**：`多喝水→喝水`、`多休息→休息`（English 不動、無需 regen 既有音檔），class-wide 掃全檔 40 處。重凍 sha、reset streak 後 5 連 clean。
- **banked lesson 再驗**：pre-freeze 四 gate（simplified/unit_schema/question_correctness/pedagogy）事前全過，故 DONE-GATE 末段無 gate-only 爆雷；本檔卡點純在 content_audit panel 的 zh/en parity（translator-owned），非確定性 gate 可攔。

## 2026-11-06 21:20 英語島收斂：新增 pedagogy_gate（效率化，HD 指示「用最有效率的方式做」）

**背景**：HD 問「兩週 spec/知識驗證準備後，為何實作仍久、驗證不順？材料有用嗎？」診斷＝
準備期驗的是**事實正確性＋基建**（故 harvest 至今**零正確性缺陷**，教錯害人守住了），卡的是
**既有舊檔的教學設計債**（parity／長度 cue／chunking／shadowing note 矛盾）——這些舊檔早於 spec，
過去只能靠每檔 content_audit LLM panel 一輪輪被動發現（meaningchange 花 9 輪）。

**對策（已做）**：建 `tools/pedagogy_gate.py`（commit 02b475937）把反覆設計債缺陷類在 harvest 前
確定性攔下。三檢、紅隊 selftest 通過：
- **length-cue（fail-closed）**：MCQ **中文語意選項**正解離群長（>1.5×次長）或獨有括號補述。
  含 ASCII 字母的英文選項（must/to lock…）一律跳過，避免文法性長度差誤判。
- **shadow-note（fail-closed）**：shadowing note 全稱聲調（都/皆/兩句…＋下收或上揚）與某行
  per-line intonation 反向＝矛盾。
- **parity（ADVISORY，不計 exit）**：claim 未被 practice answer_evidence 引用。**不可 fail-closed**：
  支援性/刻意 teach-only claim（禮貌回應 Thank you、附帶 vocab、延伸說明）未練習為合理設計，
  交 content_audit expert panel 依 scope 判。真 gap（title/can_do 並列頭條卻零覆蓋，如 forget/try）仍由 panel 確認。

**全站掃描結果**：23 hard（length-cue，12 檔）＋59 advisory（parity）。
- **已收斂檔被抓到真 length-cue → 誠實 de-converge 重收**：`maymight`、`could`、`participleactive`
  （commit ee3879265，四選項重平衡等長無括號、保單一正解）。收斂數 **176→173**。
- 其餘 9 個**未收斂** length-cue 檔（modalperfect、phonics_kk_ipa、reading_functional_skim、
  reading_structure_cohesion〔5〕、reading_title_purpose、sentencekinds、sentencetypes、
  shallwouldlike、voiceditrans）→ 各檔輪到時由 gate 於 round 0 攔下、先修再 content_audit。
- 22 個 parity-only 已收斂檔（age/colors/days/months/canability/hungry/compliment… 的支援性 claim）
  **維持收斂**（panel 會判 NOT A DEFECT）。

**新 DONE-GATE 成員（每檔收斂前必跑）**：在既有 unit_schema/question_correctness/scan_simplified/
audio_exist/per_page_5clean 之外，**加 `pedagogy_gate.py --verify`（hard 須 0）**。

**re-open 佇列（待重收 5-clean）**：maymight(sha 9686d8136d56fd7e)、could(d8126ba02be75a1d)、
participleactive(0ae9cfb2d40f373e＋後續字串 Edit 已再動，須重算 sha)。另 modalmust 在 clean 2/5 續收。

## ⚠ 2026-11-01 19:40 診斷發現（更正舊「乾淨地基」敘述）— 下一 session 必讀
loop 深掘 `verify_learning_path.py --phase=1` 揭出真實地基狀態，**更正**下方 17:13 的樂觀敘述：
1. ✅ **已修（85db84e52）KP manifest provenance（T3-03 FAIL→PASS）**：根因＝committed
   `knowledge_points.json` 被手工注入 **7 筆** Phase-2 英語島 KP（`src=english_island_phase2`/`line:0`），
   `_kp_slices/` 無來源。修法＝在 `_kp_slices/eng.md` 補 7 筆真實 slice（2 vocab＋5 pattern，108 課綱英語
   領綱基礎功能/字彙）→重生 manifest＋inventory＋overlay（綁新 sha `f0808844e4a0a525`）。id-set 不變（3103，
   0 增 0 刪）→100 單元 KP-ref 完整（unit_schema_gate exit0）。結果：`chk-manifest` PASS、`AC-ANTIDRIFT` PASS、
   `AC-KP-VERIFY` binding_unverified **3079→7**（7 新 KP 誠實標 unverified，待 §6.8.1 真實來源驗證；不造假）。
   〔更正：`verified_overlay.json`＋`source_registry.json` **本就存在**（Oct30 建，非「未建」）；verified=3091 復原。〕
   **待辦（不弱化 floor）**：`eng.t_base.vocab.weather-nature`（颱風/地震＝安全相鄰）須補 2 個真實字典 cross_check 來源才 verified；補齊後 AC-KP-VERIFY→PASS（binding 全覆蓋＋4 HD 例外）。
2. **Phase 1 gate 戰隊大多未建（~12）**：registry（`authoring/acceptance_criteria.json`）指向尚未存在的
   node gate：`nav_gate.mjs`/`a11y_gate.mjs`/`perf_gate.mjs`/`figure_signoff_gate.mjs`/`reward_safety_gate.mjs`/
   `design_consistency_gate.js`/`per_page_5clean_gate.py`/`claim_evidence_gate.py`/`question_correctness_gate.py`/
   `generator_property_gate.py`/`visual_content_fidelity_gate.py`/`release_hash_gate.py`/`path_sim_gate.py`/
   `code_download_gate.mjs`。repo 現有 `.py` 版（nav/a11y/perf/figure_signoff）是**過渡**且與 spec 指名的
   node 檔名不符（spec §6.5/line920/924 指名 `nav_gate.mjs`/`design_consistency_gate.js`＝需真 render）；
   `a11y_gate.py` 只掃 1 檔（弱）。另有 arg 失配：registry 呼 `unit_schema_gate.py --verify` 但該 gate 無 `--verify` 旗標。
   **進展（20:24）**：`unit_schema_gate`/`unit_acceptance_lint` 補 `--verify` 別名（AC-SCHEMA/AC-UNIT-1 轉 PASS，紅隊不弱化）；**建成 `tools/a11y_gate.mjs`**（AC-A11Y-1 真 render gate）。`--phase=1` 未過 19→16（扣掉 a11y 這個「工具未建」轉「誠實 FAIL」不算淨減）。
   **新 backlog（a11y_gate 揪出，真實待修）**：共用聽寫引擎 `.gr-play` 按鈕高 30px(<44) 遍佈 100+ 英語頁（每頁 13 個）＋6 頁低對比（index_new `.lp-step` 1.51:1 等）＋footer 小連結——屬共用 CSS/設計層，rebuild 時統一修（勿逐頁 patch）。
   **nav_gate.mjs 真實狀態（更正）**：AC-NAV 的 `--phase=1` 顯示 `exit=2` 是**『存在但 mis-invoke』非『工具未建』**（我先前誤判為未建而派 builder 重寫，險些 merge 掉 R-OPEN／ND≤15 檢查——builder 誠實揪出、已還原）。真實 gap＝舊 gate 需外部 `NAV_TARGET` server 且無 `--verify` 入口（registry 呼 `--verify` 故 exit2）。**reconcile 待辦（紅隊）**：把 builder 新版的 `--verify`＋自管 server＋DATA↔DOM 併入既有 gate、**保留 R-OPEN／R14**、並將 ND `visible≤15` 與 HD 認可的 CATMAP 首屏自動展開**對帳**〔**經驗量測 20:49**：首屏＝8 島(.lp-navitem)＋1 島自動展開的 16 張分類卡(.lp-scard)；故 ND 應對**頂層島數**設上限(≤12，8✓)、**不**把那 1 島展開卡計入；ND 仍禁「≥2 島同時展開」與平面傾倒〕（展開那一島為認可例外、cap 套在收合島集；證壞案例擋、CATMAP 放行），不可直接刪也不可讓它誤擋。
   **教訓（banked）**：`verify_learning_path` 的 `exit=2`（存在但 arg/server mis-invoke）≠`工具未建：tools/xxx`（真缺檔）；派 builder 前先 `git ls-files` 確認檔是否已追蹤，別憑 orchestrator 摘要推斷。
3. **已實作且真綠的部分（不受影響）**：100 英語島單元、learning_progress_v1 接線、§6.3 要求4 唯讀解除 UI、
   reward registry/provenance/catalog gate、unit_acceptance_lint/nav_gate.py/label_coverage/a11y_gate.py/
   prereq_dag/deviation_categories（--verify 皆綠）。
**結論**：Phase 1 的真實 runway 遠大於 17:13 敘述——先補 manifest provenance（#1），再建 node gate 戰隊（#2），
registry arg 對齊。這些是大工程，需組 team＋spec 逐節 grounding，非 loop 單 turn 可完。**未自行動 #1/#2（恐誤刪內容/需 HD 排序）。**

## 當前狀態（更新：2026-11-01 17:13 台北｜部分已被上方 19:40 發現更正）
- **Phase**：spec 文字已定案（`spec_converge_gate --verify-ledger` PASS、sha `eec6da8c434a4a26`、CONTRACT FREEZE ACCEPTED）→ **實作 Phase 0.5/1 進行中**。〔**更正**：「binding 3079 全覆蓋 verified」此刻**不成立**——manifest provenance 掛（見上 19:40 #1），`binding_unverified=3079`。spec『文字』收斂與 binding『資料』ship-gate 分屬兩軌，前者仍 PASS。〕
- **hub `index_new.html`**：CATMAP 八島＋編號＋練習帶＋島內分類＋接回舊版 HUD（Profile/等級/XP/連勝/金幣/徽章牆，唯讀 game_core、never-disappear 守住）＋sidebar 對齊。**HD 認可定版、已 commit＋push**。strangler-fig 新 hub，**尚未取代 live `index.html`**。
- **§6.7 獎勵 registry＋gate**：`reward_catalog.json`（items=34：22 badge＋6 skin＋6 border；types=3 帶三簽 sha）＋`reward_id_baseline.json`（genesis 34）＋`reward_catalog_gate.py`（三道 fail-closed）**已建、紅隊、自驗 exit0/注入壞案例 DENY、commit＋push（`758aad26e`）**。誠實發現：game_core 無 mascot/avatar/shop 可賺得 catalog，只註冊實際三型別。

## 跨 session / compact 的進度保證機制（2026-11-01 建＋紅隊；誠實分級）
**已機器強制（本機 `.claude/`，非散文承諾）：**
- `lp-reanchor-guard.py`（PreToolUse）：未重讀 spec 就宣告收斂/定案（改 spec 狀態行／寫 ledger `clean:true`）→ DENY。**2026-11-01 紅隊抓到並修掉一個真繞過**（ledger 偵測原比對 `json.dumps(tool_input)`，內層引號被跳脫使子字串永遠不中；改為對實際寫入文字 regex `"clean"\s*:\s*true`）。重紅隊：3 變體 DENY、狀態行 DENY、重讀後 ALLOW、一般編修不誤擋、壞 JSON fail-open。
- `lp-precompact-snapshot.sh`（**PreCompact**）：compact 前**自動**把 git HEAD＋最近 8 commit＋工作樹狀態寫進 `authoring/RESUME_SNAPSHOT.md` 並注入 additionalContext → 壓縮後摘要必含 resume 指標。不靠模型記得。紅隊：含 HEAD/PROGRESS、無亂碼、JSON 合法、fail-open。
- `lp-resume-reinject.sh`（**SessionStart＋PostCompact**）：新 session/壓縮後**自動**注入「先讀 PROGRESS.md＋spec＋最新 HEAD」。紅隊同上。
- **進度＝git commit**：每個 rollback step 都 commit＋push（HD 全面授權），git 歷史即詳實進度，不會遺失。

**誠實限制（不灌水、§0.2 具名揭露）：**
- 「每 15 分」**精確節奏非硬強制**——計時器無法強迫模型寫字；節奏由 /loop ScheduleWakeup＋HD HEARTBEAT 驅動（盡力）。但其要防的**資料遺失風險已由 PreCompact 快照＋committed git/PROGRESS 關閉**。
- 上述 hook 在 `.claude/`（依鐵律**不 commit**）→ **僅本機生效**；換機器只有 committed 產物（PROGRESS.md／RESUME_SNAPSHOT.md／git／memory）會過去，hook 需在新機重裝。
- `lp-reanchor-guard` 只守「宣告收斂/定案」那一刻，非每個 spec 偏差都擋。
- hook 設計 fail-open（避免 wedge）→ 壞掉會靜默不強制；以紅隊緩解。

## HD 關鍵決策（勿違反，跨 session 生效）
1. **hub 首屏＝CATMAP 自動展開第一島**（HD 刻意，**覆寫 spec §6.1 ND「禁首屏傾倒長清單」**）。未來勿改回九島總覽首屏（那是已否決的 a270 改寫）。
2. **hub 必須保留舊版獎勵/徽章/經驗值/左上進度條**（§7 R3 never-disappear）。目前是唯讀手工接線；正式 `safe_store`＋`reward_catalog`＋`learning_progress_v1` 接線為 Phase 0.5/1。
3. **視覺基準＝iPad Air 13" M5**；設計已調成 MacBook Pro 16" 等比例縮放。
4. **commit/push 已全面授權自主進行**（HD 2026-11-01）；每步當 rollback point、push、並在此詳記。不得 commit `.claude/`、`.sda/`、`training/`、`__pycache__`。

## Phase 0.5(b) 進度
- ✅ **mascot 殘留**＋✅ **ownedItems 守衛** 已修（commit `37e20d9ac`，隔離 worktree 開發＋審 diff＋main 重驗；provenance gate 3→0、catalog 0、瀏覽器 never-disappear RT、spendCoins 唯一呼叫者 wish_shop 不受影響）。
- ✅ **壞檔覆寫（§7.1）已修**（commit `b9f475664`）：readRawLS 區分 null vs 壞檔；壞檔→備份 `__corrupt_<ts>`（dedupe/cap3）＋readOnlyUntilResolved＋warn；saveNow（唯一寫入點）唯讀守衛；isReadOnly/resolveCorruptProfile API。main 重驗：壞檔磁碟未覆寫、正常 earned 保留、0 pageerror。殘餘：唯讀解除 UI 手勢串接待實作接線（非缺口）。
- **game_core 三個 never-disappear 真缺口全數修畢**（mascot 殘留／ownedItems 守衛／壞檔覆寫），`reward_provenance_gate` 全綠。
- 註：合成 v1 seed 缺 `migratedFlags.v1_seeded` 會觸發既有 legacy-seed 一次性重算 totalXp→0（HEAD 同樣、非 gcfix 造成、真實使用者 profile 帶 flag 不觸發）；此為既有行為，未列 must-fix（非真實資料遺失），但留意。

## HD 新需求（2026-11-01）：英語島「單字大師」改用 Anki 源 ＋ 教 collocation（spec-first，練習帶＝最後做，先記不實作）
- **資料源改採**（取代舊 `vocab_data_coca_*` 構想）：`/Volumes/workplace/EnglishTraining/Anki/data/cards.jsonl`（**10,000 筆、單一檔、`group` 1–10 各 1000**）＋ `/Volumes/workplace/EnglishTraining/Anki/audio/`（**29,921 個 mp3**，內容 hash 命名）。
- **已驗證事實（2026-11-01）**：每筆欄位＝`rank/level/band(如 "1k")/headword/pos/ipa_us/ipa_uk/sense_key/definition/collocations[]/audio_word/audio_examples[]/freq_order/group`；**100% 卡片含 `collocations`**（每項＝`{collocation 樣式, example 例句}`，如 "a lot of"→"We spent a lot of money..."）；audio 以卡片 `audio_word`/`audio_examples` 的檔名直接對應，前 500 筆引用 1500 個 mp3 **0 缺**。
- **需求**：英語島要**教 collocation**（一個字常和哪些字一起用）——此源直接支援（內建 collocation＋例句＋發音）。單字大師以 group 1–10 當分級、聽音優先、雙向、三級自評、SRS（沿用既有引擎），並呈現 collocation 樣式＋例句＋例句發音。
- **狀態**：屬 spec §「練習與應用」帶（最後做、spec-first）。**下一步非實作**：待骨幹齊備＋把本需求正式折進 spec 練習帶設計（content_audit＋紅隊）後才動工。部署時 Anki audio 需納入資產管線（R9 白名單）＋ code-download bundle 考量；授權/來源正當性比照 dictation 誠實記載（Anki 匯出為使用者自有）。
- 記憶指標：見 [[dictation-series-plan]]（原 CEFR 例句軌仍在；單字大師改採此 Anki 源為新決策）。

## 下一步佇列（spec 順序）
1. ✅ `reward_catalog` registry＋gate＋baseline（commit `758aad26e`）。
2. ✅ §6.7 provenance 掃描 gate（RT-14/15，commit `1963295b4`）——唯讀，揪出上方 2 類真缺口。
3. game_core.js 採用 `safe_store.js`（§10 Phase 0.5(b) never-disappear）＋順修上方兩個 provenance 缺口：**高風險（動 live 共用引擎）**，須每檔 5-clean＋RT（壞檔不 wipe）＋全站 render 驗證＋reward 兩 gate exit 0，謹慎做。
4. **部分完成**：獎勵兩 gate（catalog＋provenance）已做成 `reward-guard.sh` Stop hook wire 進 `.claude/settings.json`（fail-closed、紅隊：乾淨放行/破壞 block/venv 缺 fail-open），turn-end 自動把關 R3 never-disappear。**待續**：R-STYLE 內容結構 gate（design_consistency/content_card_width/nav/deviation/unit_acceptance/label_coverage）屬「宣告收斂前」檢查、非每 turn，需獨立設計一個 convergence-時機的整合 gate（避免每 turn 跑重的 render/掃描 wedge），另案謹慎做。（hook 在 `.claude/` 不 commit＝僅本機；誠實限制同前。）
5. ✅ Phase 2 §6.3 進度接線完成（cd784ffcc）：hub 顯示真實進度、單元記錄 learning_progress_v1。**progKey 遷移＝N/A**：rg 全站查無舊 per-頁進度鍵（concepts_v1/progKey/_progress_v1），英語島單元為新、只用 learning_progress_v1，故無遷移工作（不杜撰）。
   - ✅ **§6.3 要求4 壞檔唯讀解除 UI 完成（010fe76e3）**：learning_progress.js 暴露 isReadOnly()＋confirmReadOnlyResolved(evt)（唯一解除入口，兩層防線：evt.isTrusted===true 可強制手勢閘門＋閉包私有 store token）；game_core.js ensureCorruptBanner() 自我安裝統一 banner 偵測進度＋獎勵兩種唯讀，真實 click 才解除、稍後再說僅隱藏（never-disappear 預設）。隔離 worktree＋審 diff＋main 重驗（node --check×3 OK、3 gate exit0、RT 24/24 含無手勢解除被拒/磁碟零改寫、banner PNG 逐張看過）。純新增無刪改。
6. 部署側 TODO（§6.7，需 CI/host 基礎設施）：`release_snapshot_on_ship_gate`／deploy-side append-only release ledger／`reward_baseline_rewrite_gate`。
7. 續 Phase 1→2→3→4→5 至 §11.A 23 條 AC 全綠（DONE-GATE）。

## 變更流水帳（最新在上）
| 時間(台北) | commit | 內容 |
|---|---|---|
| 2026-11-01 22:05 | `29d391787` | Phase 0/1：AC-NOGRADE 接線修復＋擴 DEFAULT_TARGETS 涵蓋 100 學習單元（119 檔掃、年段洩漏0 PASS）；registry GLOB→--verify；誠實記 legacy 舊站 7 處年段洩漏為 standing-audit backlog |
| 2026-11-01 22:01 | `ccd775e23` | Phase 1：AC-VIZ-1 PASS——hub 重 render 10 狀態＋四角色逐張重簽綁新 sha（manifests regen）＋registry .mjs→.py；figure_signoff_gate.py --verify exit0 |
| 2026-11-01 21:47 | `e584eaa1a` | game_core 修 3 真 reward-loss gap（RT-10 reset 手勢閘門／RT-9 saveNow reconcile union＋onStorage merge／RT-12 export-import＋UI）；AC-REWARD-1 RED→gate exit3→0；worktree＋審 diff＋四角色簽核；順修 PRC「內存」 |
| 2026-11-01 21:01 | `c4b914712` | Phase 1：nav_gate.mjs reconcile（AC-NAV 接線，增補不刪）——加 --verify＋自管 server＋DATA↔DOM、**保留** R-OPEN/R14、ND 改對頂層島（CATMAP 一島展開放行）、R-OPEN 窄排除 #badge-wall；獨立紅隊 selftest/4 壞案例 DENY/GOOD 放行、實站 17 頁 0 違規 |
| 2026-11-01 20:43 | `2359a3416` | Phase 1：design_consistency_gate.js 補 `--verify` CLI 相容層（AC-STYLE-1/2 由 crash→乾淨 exit0，DUPLICATE=0 NEAR=17 advisory）；紅隊壞目錄→99 fail-closed 哨兵仍在 |
| 2026-11-01 20:37 | （無 commit，還原保護）| nav_gate.mjs builder 揪出我的錯誤前提：該檔**本就存在於 HEAD**（201 行、含 islands≤12／visible≤15 ND／R-OPEN 鎖定態／R14 zh-collapse 四檢查），builder 覆寫後掉了 R-OPEN 與 ND≤15→**我 git checkout 還原 HEAD，不 merge 掉檢查的 rewrite**。builder 新版存 /tmp/nav_gate_builder_new.mjs 待 reconcile |
| 2026-11-01 20:24 | `0793e23c5` | Phase 1：建 tools/a11y_gate.mjs（AC-A11Y-1 真 render gate，3 準則＋紅隊）；獨立驗證後 merge。實站掃 116 頁→1348 真 a11y 違規（誠實 FAIL，非抑制）→ rebuild backlog |
| 2026-11-01 19:54 | `b5512b340` | Phase 0：7 新英語 KP 經獨立雙鏡審查→6 verified（binding_unverified 7→1）；weather-nature 經 fail-closed high-risk floor 正確拒 expert_review（須 cross_check，不弱化）→誠實留 unverified |
| 2026-11-01 19:48 | `85db84e52` | Phase 0 地基修復：還原 KP manifest provenance（補 7 筆 eng.md slice→重生 manifest/overlay；T3-03 FAIL→PASS、binding_unverified 3079→7、id-set 不變、100 單元 KP-ref 完整） |
| 2026-11-01 19:35 | `010fe76e3` | §6.3 要求4：壞檔唯讀→使用者手勢確認解除 UI（learning_progress isReadOnly/confirmReadOnlyResolved 兩層手勢防線＋game_core 自安裝 banner；隔離 worktree＋RT 24/24＋banner PNG 看過） |
| 2026-11-01 19:05 | `cd784ffcc` | Phase 2 §6.3：英語島 100 單元接 learning_progress_v1（assets/learning_progress.js＋unit.js hook＋hub 真實進度＋100 html script）；never-disappear RT abcd＋hub/單元 render 全綠 |
| 2026-11-01 18:48 | `(unit_schema_gate)` | Phase 1 AC-SCHEMA unit gate（§6.2 schema＋unit_id 全域唯一＋KP 參照完整性第5斷言）；現況 100 單元/185 KP refs 全綠 |
| 2026-11-01 18:13 | `b9f475664` | Phase 0.5(b) 修 game_core §7.1 壞檔覆寫（readRawLS/backupCorrupt/saveNow 唯讀守衛/isReadOnly API）；三個 never-disappear 缺口全畢 |
| 2026-11-01 18:00 | `37e20d9ac` | Phase 0.5(b) 修 game_core 2 缺口（mascot 殘留清除＋schemaVersion→2 migrate；spendCoins ownedItems catalog 守衛）；provenance gate 3→0 |
| 2026-11-01 17:24 | `1963295b4` | §6.7 provenance 掃描 gate（RT-14/15）；對真實 game_core exit3 揪出 mascot 殘留＋ownedItems 無守衛 2 類真缺口（列 Phase 0.5(b) must-fix） |
| 2026-11-01 17:13 | `758aad26e` | §6.7 獎勵 reward_catalog registry＋fail-closed gate＋baseline（紅隊＋自驗 DENY） |
| 2026-11-01 17:04 | `d5c623ad4` | Phase 0.5/1 確定性工具組＋golden（safe_store/4 gate/lint/nav_gate/deviation_categories，皆紅隊） |
| 2026-11-01 17:03 | `c226ab18c` | 學習地圖 hub `index_new.html`：CATMAP 八島＋接回舊版 HUD（rollback point） |

## Phase 1 gate 戰隊狀態（2026-11-01 21:04 快照，跨 session resume）
registry＝`authoring/acceptance_criteria.json`；單一驗證入口＝`tools/verify_learning_path.py --phase=1`。
**已接線/通過（本 session）**：
- AC-SCHEMA（unit_schema_gate.py，補 --verify 別名）✅
- AC-UNIT-1（unit_acceptance_lint.py，補 --verify 別名）✅
- AC-STYLE-1/2（design_consistency_gate.js，補 --verify CLI 相容層；DUPLICATE=0，NEAR=17 advisory backlog）✅
- AC-NAV（nav_gate.mjs reconcile：本就存在於 HEAD，增補 --verify/自管 server/DATA↔DOM、保留 R-OPEN/R14、ND 對頂層島、R-OPEN 窄排除 badge-wall；實站 0 違規）✅
- AC-VIZ-1（figure_signoff_gate.py；hub 重 render 10 狀態＋四角色重簽綁 sha c9525d2b；registry .mjs→.py 校正）✅
- AC-A11Y-1（新建 a11y_gate.mjs 真 render gate）→ **誠實 FAIL**：1348 真違規（.gr-play 30px tap target 遍佈 100+ 頁＋6 頁低對比）＝rebuild backlog，非 gate bug。

**真 missing（工具未建），依難度/相依排序**：
- `reward_safety_gate.mjs`（AC-REWARD-1）＝**RT-1…RT-15 runtime never-disappear red-team harness**（headless 瀏覽器：種 localStorage→壞檔/升版/配額驅逐/retire/squash→斷言 earned 獎勵倖存）。§7.3 列舉 RT-1..15。靜態層已有 reward_catalog_gate.py＋reward_provenance_gate.py（data）＋Stop hook reward-guard.sh；缺的是 runtime RT 自動化。大 build，**下一個優先**，須先精讀 §7.3 逐條 RT。
- `figure_signoff_gate.mjs`（AC-VIZ-1）＝圖/動畫兩簽核流（art-director＋eye-comfort，綁 sha）。有 figure_signoff_gate.py 可參考。
- `perf_gate.mjs`（AC-PERF-1）＝初始 JS/資產預算——**預算數值 spec 未定（§6.5「Phase 1 定具體數值」）**，須先定 normative 門檻（量測各類頁基準）才建。
- `code_download_gate.mjs`（AC-CODE-DL）＝完整可執行源碼下載——**對非書的 learner 站適用性待確認**（books norm；英語島可能 N/A）。
- 6 內容 gate（AC-CORRECT 子：claim_evidence/question_correctness/generator_property/visual_content_fidelity/release_hash；AC-PATH path_sim；AC-UNIT-2 per_page_5clean）＝**依賴單元 claims[]/scene/question sidecar 資料與 5-clean 收斂 infra，目前 100 英語單元未 populate→建了也掃空，屬 premature**，待單元內容資料層就緒再建。
- AC-UNIT-3 golden-diff＝待建 `authoring/golden/<archetype>.html`（unit_acceptance_lint 已有 --verify-golden 的 SKIP-WITH-WARNING 誠實佔位）。

**其他 queue**：weather-nature KP cross_check（待 ≥2 獨立開放授權來源、quote 可線上驗；主流字典 403 反機器人不破解）；nav/a11y 的真實 findings（1348 a11y＋17 style NEAR）入 rebuild backlog。

## ✅ 已解（2026-11-01 21:47，commit e584eaa1a）— 原 🔴 高優先 reward-loss（AC-REWARD-1 由 RED→gate exit0）
> 下方 3 gap 已於隔離 worktree 修畢＋獨立審 diff＋main 重驗（reward_safety --verify exit3→0、RT-9/10/12 PASS、catalog/provenance/selftest 皆綠）＋匯出匯入 UI 四角色 iPad 簽核。backlog：備份 bottom-sheet 由 bottom-left 改置中（minor spatial polish）。
AC-REWARD-1 的 runtime harness（`tools/reward_safety_gate.mjs`，已 commit 06c3e09bc）對實站 exit3＝**3 個真 never-disappear gap，全在 `game_core.js` 的 `player_profile_v1`**（learning_progress_v1 經 safe_store 已保護、layer-B 全 PASS）。根因＝player_profile_v1 從未遷移到 safe_store 守衛。**這是 R1/R3 等級（核心承諾「獎勵永不消失」被打穿），下一迭代最高優先**：
1. **RT-10 reset 無手勢閘門（最嚴重，證實 game_core.js:989-1000）**：`Game.reset('all')` 任何程式/事件/他分頁路徑呼叫→`profile=freshProfile(); saveNow()` 即刻全清並持久化、所有 earned 毀。修＝reset('all') 須 `{userConfirmed:true, gestureToken}`（比照 §6.3 UI／safe_store mint，程式路徑一律拒）。
2. **RT-9 saveNow 無 earned-shrink rollback＋onStorage replace 非 union**：跨分頁/注入縮水 profile→memory 被 replace→後續 award 持久化縮水集→badges/ownedItems/totalXp 丟。修＝saveNow 前驗 earned 單調不減（縮小＝拒寫＋回滾，R8）＋onStorage 改 additive union（R7）。
3. **RT-12 無 export/import**：§7.1 localStorage 驅逐（iPad Safari ITP 7 天）緩解未實作。修＝一鍵匯出單一 JSON＋非破壞 additive 匯入（safe_store.mergeIncoming 已是正確 primitive，缺 user-facing 接線）。
**作法**：game_core 最高 blast-radius（204 頁共用引擎）→隔離 worktree＋審 diff＋main 重驗；**驗收＝`reward_safety_gate.mjs --verify` 由 exit3→exit0**（TDD，gate 已先行）＋既有 reward_catalog/provenance gate 仍綠＋全站 render 無回歸。嚴禁為過關弱化 gate。

## AC-VIZ-1 釐清（2026-11-01 21:51）＝hub 視覺簽核（非單元 viz）
英語島 100 單元**無 viz/scene SVG stepper**（units.json 零 `kind:viz`），故 AC-VIZ-1 非單元 viz 維度。`tools/figure_signoff_gate.py`（**存在且可用**，非 registry 誤指的 `.mjs`）守 visual-QA SOP：`index_new.html` 當前內容 sha 須有 `authoring/hub_render_manifest.json`（全狀態 render）＋`authoring/hub_signoff.json`（四角色逐狀態簽核）綁**同一 sha**。
**現況 FAIL（正確/誠實）**：manifests 為 Oct31（source_sha 0b51cbd/e82bc6a），但 index_new.html 本 session 經 CATMAP/HUD/sidebar/進度 編修→當前 sha `c9525d2b`，舊簽核依「sha變則作廢」失效。
**下一步（視覺 DONE-GATE）**：重 render index_new.html 的 10 個 required_states（CATMAP 各島展開/收合、練習帶、HUD、備份 sheet…portrait+landscape）→更新 hub_render_manifest.json（source_sha=c9525d2b＋逐 PNG）＋四角色逐狀態簽核更新 hub_signoff.json（states_reviewed ⊇ required_states）→figure_signoff_gate.py --verify exit0。另：registry AC-VIZ-1 由 `.mjs`（不存在）校正為 `PY tools/figure_signoff_gate.py --verify`（真實工具；gate 是 sha/manifest 檔檢查、非 renderer，.py 恰當，非弱化）。此為刻意的下一迭代（10 狀態 render＋4 角色判定＋manifest regen）。

## ✅ 本輪（2026-11-01 22:28:34）—「真 missing 工具未建」清單清零：8 個 AC gate 全建好＋驗證＋接線
> 上面「真 missing（工具未建）」區塊已**過期**：該批 gate 本輪由 4 個平行 builder 全數建成，逐一獨立 selftest＋實站 verify＋紅隊，已 commit（55714091e／perf 75ebd0227）。不再 premature——改以**實站誠實 FAIL 當下一步內容工作**。
- **AC-PERF-1**（`tools/perf_gate.mjs`，§6.5 R9 相對基準＝同類頁 median×1.5）：selftest 綠。實站初版 FAIL 8 → **修 anim_core.js(371KB) 改 concept_engine 按需 lazy-inject**（移除 6 概念頁同步 `<script>`；mount 前注入、host 脫 DOM 則略過）→ headless 實測：初始 window.Anim=false、進動畫步自動注入＋canvas 繪製成功＋零 JS error → **FAIL 8→2**。残 2＝english_dictation.html(2057KB，急載 12 個 dict_data≈1.95MB)＋english_sense.html(278KB，單檔 english_sense.js 173KB)。
- **AC-CORRECT 5 子 gate**（claim_evidence／question_correctness／generator_property／visual_content_fidelity／release_hash）：selftest 全綠。實站：question_correctness 609 題全綠、generator honest N/A(0 generator)、visual_fidelity honest N/A(英語島 0 scene)、release_hash 綁 manifest_sha 綠；claim_evidence 揪 **1 真缺口**＝english_greetings P1-natural-greeting(mcq) 缺 answer_evidence → **已修**：加 `answer_evidence:["c-be-am"]`（I→am 正是正解依據）→ claim_evidence 實站 **0 violation**、question_correctness/unit_schema 回歸綠。
- **AC-PATH-1/2**（`tools/path_sim_gate.py` --verify / --verify-inv4，INV-1 先備 DAG 無斷層＋INV-4 est≤12）：selftest 綠、實站 PASS（prerequisites 全空＝Phase 2 路徑接線後才長牙；結構正確）。
- **AC-UNIT-2**（`tools/per_page_5clean_gate.py`，§11.A 每頁 content_audit 連續 5-clean 同 sha＋L3 exit0）：selftest 綠（12 壞例全 DENY）。實站 **FAIL 100**＝`authoring/page_converge_ledger.json` 尚未建、100 單元頁全無 5-clean 紀錄 → **下一步最核心內容工作**（逐頁跑 content_audit 收斂）。
- 全部已接進 `authoring/acceptance_criteria.json`（evidence/qualification 用 --verify 系列），wiring 已驗。

### 下一步佇列（實站 FAIL＝spec 定義的內容工作，非 blocked）
1. **AC-PERF-1 残 2**：dictation 12 個 dict_data 改按 CEFR 等級/系列按需載入（同步 init→async；受 DICTATION_BUILD_SPEC 管，交 worktree builder 專做，純載入優化不動內容）；sense 173KB 引擎評估拆分。
2. **AC-UNIT-2 每頁 5-clean**：建 page_converge_ledger 收斂 infra，逐頁 /static-doc-audit 跑到 5 連續 clean（workflow-size hook 上限 3 併發，分批）。
3. **AC-A11Y-1 1348 真違規**（.gr-play 30px tap target 遍佈＋6 頁低對比）＝rebuild backlog。
4. **AC-UNIT-3** golden/ dir 建置；**AC-COV** 覆蓋內容；weather-nature KP cross_check。
當前 HEAD=55714091e。commit/push 已獲 HD 全面授權、每步當 rollback point。

## ✅ 本輪續（2026-11-01 22:43:00）— AC-A11Y-1 共用修復 ＋ a11y_gate 兩個 gate-correctness 修（皆紅隊）
- tap target ≥44px（WCAG 2.5.5）：違規主體＝共用 assets/unit.css 四控制件（.gr-play 30px／.gr-nav a 40px 步驟 tab／.gr-opt 39px 選項／.gr-rate button 36px 自評鈕），由 assets/unit.js 在全 100 單元頁生成 → 單一共用修（各加 min-height:44px＋flex 置中）覆蓋全站；另 game_core.js ko-fi FAB 40px→flex 置中 min 44×44。單頁（greetings）實測 13→0。
- gate 修 1（inline 例外）：footer「© 2026 HD Chen · …」句中署名連結(15px) 屬 WCAG 2.5.5/2.5.8 inline-in-sentence 例外，a11y_gate 原未建模→over-flag。加例外：display:inline 的 a 且緊鄰前/後 text node 有非空文字（真句中）才豁免；inline-block/非句中不豁免。紅隊 fixture：句中署名豁免＋獨立 inline-block 30px 連結仍抓＝恰 1 違規，selftest PASS。
- gate 修 2（CSS 快取 bug，重要）：a11y_gate 用持久 --user-data-dir → linked assets/unit.css 跨輪磁碟快取（HTML 有 ?v= bust、CSS 無）→ 改了 CSS 仍量到舊版＝假 pass/假 fail（本輪一度誤報 13→11）。修＝每頁 page.setCacheEnabled(false)。紅隊：填快取(0)→改矮不清快取(8，證立即反映)→還原不清快取(0)。
- commit bef34fe02。全站 116 頁 a11y 驗證跑中：已發現 unit.css 以外殘留＝button#englishAdvBadgeFab(28px tap)＋span.ea-level-emoji 對比 2.41:1(需3:1)，待全站跑完一併修到 0。

## ✅ 本輪總結（2026-11-01 22:53:27）— AC-PERF-1 8→1、AC-A11Y-1 1348→1(僅 hub)、AC-CORRECT 0、8 gate 全建
本輪 commit 流水：55714091e(8 gate+greetings) → 75ebd0227(anim_core lazy 6頁) → bcf5add3d/36e114ed7(進度) → bef34fe02(a11y unit.css+FAB+gate inline/cache修) → 60ef6a30d(gate aria-hidden豁免) → e0605f1c6(senseFAB+sp-cat-count) → 8c80fdaf0(dictation lazy)。

### AC 現況（實站 verify）
- AC-PERF-1：8→1。anim_core.js(371KB) 6 概念頁 lazy-inject＋english_dictation 12 dict_data(1.95MB) 按 DK/CEFR 按需。**僅餘 english_sense.html 278KB**（單檔 english_sense.js 173KB bespoke 引擎，非急載資料；拆分需較大重構，列追蹤）。
- AC-A11Y-1：1348→1。共用 assets/unit.css 四控制件(.gr-play/.gr-nav a/.gr-opt/.gr-rate)≥44px 覆蓋全 100 頁；ko-fi FAB／englishAdvBadgeFab／senseAdvBadgeFab tap≥44px；sp-cat-count 白字底改 --c-english-ink(5.52:1)；9 個裝飾 emoji 經 gate aria-hidden 豁免。**僅餘 index_new.html 的 .lp-step**（白字 on 島 accent --a，淺島 1.51:1）。
- AC-CORRECT 5 子 gate：全綠（claim_evidence 揪 greetings 缺 answer_evidence 已修 c-be-am）。
- AC-PATH-1/2、AC-UNIT-2、AC-SCHEMA、AC-UNIT-1、AC-STYLE、AC-NAV、AC-VIZ-1、AC-NOGRADE、AC-REWARD-1：gate 皆建成+接線（見前文）。

### a11y_gate 本輪 3 個 gate-correctness 修（皆紅隊 selftest 9/9）
1. 句中 inline 連結例外（WCAG 2.5.5/2.5.8）；2. 持久 profile CSS 快取 bug（setCacheEnabled false，紅隊填快取→改矮→立即反映）；3. aria-hidden 裝飾內容豁免對比（WCAG 1.4.3 incidental，同 axe-core）。

### 下一步佇列（實站 FAIL＝spec 定義工作，非 blocked）
1. **hub .lp-step 對比**（唯一剩餘 a11y）：index_new.html 白字 step 號 on 淺島 accent → 需改 .lp-step 為固定深底(var(--ink))或深化。⚠ 動 index_new.html 會使 AC-VIZ-1 四角色簽核(綁 sha c9525d2b)失效 → 須 10 狀態重 render+四角色重簽。**建議與既有 pending 的 hub 重簽併做一次**。
2. **AC-PERF-1 残 english_sense**：173KB bespoke 引擎拆分評估。
3. **AC-UNIT-2 每頁 5-clean 馬拉松**：100 單元頁逐頁 content_audit 連續 5-clean，記 authoring/page_converge_ledger.json（仿 spec_converge_gate 誠實 bank：實跑 content_audit nshards:1→confirmed:0+coverageComplete→L3 exit0）。per_page_5clean_gate 已就緒、實站 FAIL 100（ledger 未建）。**最大宗、跨 session**。
4. **AC-UNIT-3** golden/ dir；**AC-COV** 覆蓋；weather-nature cross_check。
5. **dictation UX delta 視覺簽核**：CEFR 單一載入入口（受 DICTATION_BUILD_SPEC 管）需 iPad render+四角色。

## ✅ 本輪（2026-11-01 22:58:59）AC-VIZ-1 重簽完成
- hub .lp-step 對比修後 sha c9525d2b→a562ed0e；重 render 10 狀態+四角色簽核綁新 sha，figure_signoff_gate --verify PASS。開 4 代表張(eng綠/sci藍/iPad直2欄/16"5欄)實檢：step 徽章 color-mix 隨島色淺底深字、三視埠無版面回歸。commit 6cd6004f2 已 push。
- **AC-A11Y-1(1348→0)＋AC-VIZ-1(綠) 本輪完成。**

## ✅ 本輪（2026-11-01 23:13:39）AC-PERF-1 全綠（8→0）
- english_sense LEVELS 內容(102KB)抽至 english_sense_data.js 按需載入(js 173→31KB)；perf_gate --verify **exit=0**(116頁0超標)。合併 builder 6 檔(含 src TS 鏡射+tsconfig)；render 雙埠驗證選單先渲染、進 level 才載資料、0 error；sense a11y 仍 0(senseAdvBadgeFab 修保留)、簡體 PASS。**AC-PERF-1 本輪由 8→1→0 完成。**
- 殘留：dictation+sense 的 CEFR/level 按需載入屬純載入優化、CSS 版面未動；若要正式收尾可選擇性走 figure_signoff（非阻塞，低優先）。

## 📌 AC-COV 現況釐清（2026-11-01 23:15）
- coverage_gate.py --verify 報「未覆蓋 3086／3086」。**診斷**：gate 讀 `units_index.json`（gen_derived.py 產）算覆蓋，但該索引只帶輕量 metadata、**不帶 teach/practice/kp_ids** → 看不到綁定 → 誤報 0 覆蓋。實際 100 單元 teach∩practice 已真教真考綁定 **35 個 eng minimum KP**（手算確認）。→ **gate 少算 bug，已委派 worktree builder 修**（選 A：gen_derived 於 index additive 加 covered_kp_ids；或 B：gate 直讀 *.units.json）＋紅隊＋確認其他 index 讀取 gate 無回歸。
- **即使修好＝35／3086**。AC-COV 真正缺口＝**全 8 科＋多數英語 minimum KP 尚未建單元**（chi/math/sci/soc×3/life 皆 0 單元；eng 僅 35/300）。這是整個學習路徑的**核心內容建置大工程**（~3051 個 KP 待建單元），需完整 authoring team、跨多 session。AC-COV FAIL 正確反映此 runway，非 gate 問題。
- **剩餘大工程佇列（皆多-session）**：(1) AC-COV 內容建置（8 科單元，最大宗）；(2) AC-UNIT-2 每頁 5-clean 馬拉松（100 頁現有 + 新建頁）；(3) AC-UNIT-3 golden/ dir（§6.6/O-9：3 archetype 各 1 golden + §8 六鏡 panel 全簽 + deviation_categories enum）。

## 🚧 內容建置程式開跑（2026-11-01 23:32:19）— 首批 6 個主題字彙 eng 單元
- 全站 gate/infra/正確性 AC 已綠後，進入核心內容建置：為未覆蓋 265 個 eng minimum KP 建單元（先 vocab 主題字彙低風險批）。
- 首批目標 KP：emotion-personality／hobby-leisure／travel-geography／health-illness／shopping-money／festivals-culture（皆 t_mid vocab）。派英語內容 team（worktree）：撰寫＋對抗式英語母語/語言學審查＋PM，沿用 §6.2.2 schema＋共用 unit.js/unit.css 引擎，過 unit_schema/claim_evidence/question_correctness/unit_acceptance/scan_simplified/no_grade/coverage gate＋iPad render＋a11y。正確性第一、source_refs 據實不杜撰。
- 驗收＝coverage 覆蓋數由 35 增加。完成後我 review+gate 複驗+render 複核才合併，接著續建下一批（其餘 eng 分區→7 科）。

## ✅ 內容建置首批完成（2026-11-01 23:56:05，commit 543ed3083）
- 6 個 t_mid vocab 主題字彙單元上線：情緒個性/興趣休閒/旅遊地理/健康不適/購物金錢/節慶文化。全確定性 gate 綠、coverage **35→41(+6)**、37 真 edge-tts mp3、對抗式英語審查揪修 1 真實用法錯(pay in cash)、iPad 四角色簽核、nav_index 不變。
- **待查**：6 新頁是否已從 hub/nav 可達（nav_index 未變＝可能需把新 vocab 單元接進英語島 curated nav 或確認 units_index 動態路由）。列為下一步檢查項。
- 續：派第 2 批內容 team（下一組未覆蓋 eng KP）。覆蓋 runway：eng 41/300→目標 300，再推 7 科。

## ✅ 內容第2批完成（2026-11-02 00:23:26，commit b3cd0e833）coverage 41→47
- 6 單元：科技媒體/環境自然/單位詞/比較級/最高級/as-as。全 gate 綠、36 mp3、對抗式審查 0 錯+2 潤飾(cause pollution/a huge network)、iPad 四角色、nav 不變。
- 並行啟動：(A) hub strand→unit 導覽連結（讓 12 新+既有 vocab 單元從 hub 可達；動 index_new.html 需 AC-VIZ-1 重簽）；(B) 第 3 批內容。

## 2026-11-02 01:02 — hub 導覽重做合併上線 + batch 4 啟動
- **hub 導覽重做合併**（commit 7bc625f4f → main）：分區卡→右側滿版單元牆（master-detail，app-shell，不開新頁、不 reload；左 sidebar 全程保留）。依級別分段（初階→中階→高階→延伸，空段不顯）、每卡級別徽章（R11 不顯年段）、返回鈕 ≥44px。取代舊 <details> 就地展開窄欄疊長條。
  - AC-VIZ-1：index_new sha 09d076f9→fb4e8d70，13 狀態四角色重簽（figure_signoff --verify PASS）。親開三視埠詳情態 PNG（橫1366三欄/iPad直1024兩欄/16"1718五欄）確認左 sidebar 保留、右側滿版、分段＋徽章＋返回鈕。nav_gate 0 / a11y(index_new) 0 / scan PASS。units_index 不動（118 單元）。
- **batch 4 啟動**（背景 worktree agent）：6 單元，刻意混中/高階（HD：別全初階）。
  - 中階 t_mid：futurewill(未來式will)、futuregoingto(be going to)、participleadj(boring/bored)、reflexive(反身代名詞)。
  - 高階 t_adv：musthaveto(must vs have to)、passivetenses(各時態被動)。
  - 目標 coverage eng 53→59。完工交回後由主 session 合併＋regen units_index＋全 gate＋iPad 四角色。
- eng 現況：300 min、53 covered、247 未覆蓋（t_base 26 / t_mid 100 / t_adv 121 / t_enrich 0）。

## 2026-11-02 01:06 — HD 導覽 UX 設計方向（睡前加碼）
- HD 要「組 team 認真想整站從首頁往下的導覽 usability」，不只是麵包屑。
- HD 具體候選：單元頁側欄改「固定頂部多列」——第1列情境/定位、第2列 jump label（快速跳轉：回分區單元牆/上下單元）、第3區下方整寬內容本體。
- 進行中：unitnav builder 已轉為「設計探索先行」——team(PM/UX/learning/eye-comfort/對抗式)評比 3 候選並出 iPad render mockup：A=固定頂部三列(HD首選)、B=多層麵包屑、C=左側欄app-shell。選最佳→實作(共用引擎一次套118頁+hub hash深連結+修home→index_new bug)→全gate+iPad四角色。
- 設計權屬我(design-authority)，HD丟friction訊號當驗收點。此方向待 builder 交回設計決策摘要後我審。

## 2026-11-02 01:10 — 導覽設計收斂：mirror travel site-shell（HD 指定靈感來源）
- HD 靈感來源＝本站 travel repo `/Volumes/workplace/EnglishTraining/travel/`（common.css + japan/chubu.html + site.js/common.js）。
- 模式：responsive site-shell——≥1080px CSS grid「236px sticky 側欄 + 內容」，側欄多組 sb-group（站/首頁、同層清單 current 高亮、本頁章節 anchor）；<1080px 側欄隱藏改頂部 pill-nav 橫向跳轉。
- 單元頁落地調整（專注互動非長捲動）：側欄(1)🏠學習地圖+←回分區單元牆(hash #eng/vocab) (2)同分區其他單元 siblings(current 高亮，最大 usability 收穫：練習中可跳別單元) (3)長 section 才加本頁章節。narrow→頂部 pill-nav=回分區+上/下 sibling。
- 實作：共用引擎 assets/unit.js(插 shell+側欄+pill，siblings 來自 units_index subject+strand)+unit.css(移植 travel grid/sticky/pill 但用本站 app.css token)；一次套 118 頁；hub 加 #subject/strand 路由；修 home→index_new bug。
- unitnav builder 已收到收斂指示（不再三案評比，照此 pattern 實作+render+四角色）。

## 2026-11-02 01:22 — batch4 內容合併上線 + unitnav 導覽設計研究包交回（待 HD 拍板）
- **batch4 合併**（commit d2d2cd134 → main）：6 單元（中階 futurewill/futuregoingto/participleadj/reflexive、高階 musthaveto/passivetenses）＋36 edge-tts mp3。全 gate 綠、coverage eng 53→59（uncovered 3033→3027）、units_index 118→124、nav_index 不變。對抗式審查修 futurewill P1（dark-clouds→forecast）。iPad 兩新頁 render 親看四角色 pass。
- **unitnav 導覽設計研究包**（worktree-agent-ac2c13199f3ee950c，純研究未實作、production 乾淨、未 commit）：
  - 3 候選＋iPad mockup（prototypes/ + /tmp/nav_proto/ 12 PNG）：候選1=travel式左側欄site-shell；候選2=HD頂部固定多列；候選3=精簡麵包屑＋同分區siblings跳轉條。
  - **builder 推薦＝候選3**：最準命中 HD 三friction（麵包屑三層「我在哪」＋←單元牆回上層＋siblings chips跳同分區單元），滿版專注、最少chrome；關鍵：siblings直跳「橫向與直向都在」，候選1直式退化成只剩上下一個（最大收穫消失）、候選2要挑特定單元得退回單元牆。次佳=候選1（偏好與hub同構側欄、主要橫向大屏時）。
  - 落地規格草案已備（DOM/hash #subject/strand/siblings來源units_index/共用引擎改點/hub路由/app-bar home bug）。**app-bar home bug 範圍提醒：全站 219 html 有 href=index.html，含他島頁＋15手刻english頁，屬其他 lane，待協調決定是否一併修。**
  - **狀態：等 HD 拍板採哪案（HD 保留的設計決策），核准後才施工＋全gate＋四角色重簽。主session不自動實作。**
- **下一步**：續 batch5 內容（再6單元混中/高階）。

## 2026-11-02 01:39 — batch5 內容合併上線
- commit 80dc5ba1d → main：6 單元（中階 presentvsprog/pastirregular/indefinitepron/freqadverb、高階 reladverb/wouldmodal）＋36 edge-tts mp3。全 gate 綠、coverage eng 59→65、units_index 124→130、nav_index 不變。對抗式修 7 處歧義（避免第二正解）。iPad 兩高階頁 render 四角色 pass。
- eng 進度：65/300 covered。續 batch6。

## 2026-11-02 01:58 — batch6 內容合併上線
- commit (見下) → main：6 單元（中階 presentperfect/pastprog/infpurpose/prepdirection、高階 subjpresent/relcomma）＋36 edge-tts mp3。全 gate 綠、coverage eng 65→71、units_index 130→136、nav_index 不變。對抗式 0 blocker。iPad 兩高階頁 render 四角色 pass。
- eng 進度：71/300 covered。續 batch7。unitnav 導覽改版仍等 HD 拍板（候選3）。

## 2026-11-02 02:17 — batch7 內容合併上線
- 6 單元（中階 willvsgoingto/gerundroles/presprogfuture/prepduration、高階 subjpast/voicemodal）＋36 mp3。全 gate 綠、coverage eng 71→77、units_index 136→142、nav_index 不變。對抗式 0 blocker。iPad 兩高階頁四角色 pass。
- eng 進度：77/300 covered（連四批 batch4-7 共 +24，皆含高階）。unitnav 導覽改版仍等 HD 拍板（候選3）。續 batch8。

## 2026-11-02 02:35 — batch8 內容合併上線
- 6 單元（中階 suffixnoun/prefixneg/verbinf/tooenough、高階 wishsubj/cleftit）＋36 mp3。全 gate 綠、coverage eng 77→83、units_index 142→148、nav_index 不變。對抗式修 2 minor。iPad 兩高階頁四角色 pass。
- eng 進度：83/300 covered（連五批 batch4-8 共 +30，皆含高階）。unitnav 導覽改版仍等 HD 拍板（候選3）。續 batch9。

## 2026-11-02 02:53 — batch9 內容合併上線
- 6 單元（中階 perfectvspast/suffixadj/adverbtypes/infnoun、高階 nounclsubj/advclpurpose）＋36 mp3。全 gate 綠、coverage eng 83→89、units_index 148→154、nav_index 不變。對抗式修 1 blocker(advclpurpose so→so that 第二正解)。iPad 兩高階頁四角色 pass。
- eng 進度：89/300 covered（連六批 batch4-9 共 +36，皆含高階）。unitnav 導覽改版仍等 HD 拍板（候選3）。續 batch10。

## 2026-11-02 03:13 — batch10 內容合併上線
- 6 單元（中階 pastwhenwhile/suffixverb/whinf/adjposition、高階 participleactive/whetherclause）＋36 mp3。全 gate 綠、coverage eng 89→95、units_index 154→160、nav_index 不變。對抗式修 1 blocker(pastwhenwhile)。iPad 兩高階頁四角色 pass。
- eng 進度：95/300 covered（連七批 batch4-10 共 +42，皆含高階）。unitnav 導覽改版仍等 HD 拍板（候選3）。續 batch11。

## 2026-11-02 03:28 — batch11 內容合併上線
- 6 單元（中階 uncountable/maymight/relwhowhom/concession、高階 doemphasis/relwhat）＋36 mp3。全 gate 綠、coverage eng 95→101、units_index 160→166、nav_index 不變。對抗式 0 blocker（設計期鎖死第二正解）。iPad 兩高階頁四角色 pass。
- eng 進度：101/300 covered（破 1/3；連八批 batch4-11 共 +48，皆含高階）。unitnav 導覽改版仍等 HD 拍板（候選3）。續 batch12。

## 2026-11-02 03:47 — batch12 內容合併上線
- 6 單元（中階 voicebasic/relwhose/thatobject/firstcond、高階 participlepassive/voiceditrans）＋36 mp3。全 gate 綠、coverage eng 101→107、units_index 166→172、nav_index 不變。對抗式 0 blocker。iPad 兩高階頁四角色 pass。
- eng 進度：107/300 covered（連九批 batch4-12 共 +54，皆含高階）。unitnav 導覽改版仍等 HD 拍板（候選3）。續 batch13。

## 2026-11-02 04:04 — batch13 內容合併上線
- 6 單元（中階 pattern5/reasonclause/tagquestion/definiteart、高階 formalobjit/preprel）＋36 mp3。全 gate 綠、coverage eng 107→113、units_index 172→178、nav_index 不變。對抗式修 1 blocker(pattern5)。iPad 兩高階頁四角色 pass。
- eng 進度：113/300 covered（連十批 batch4-13 共 +60，皆含高階）。unitnav 導覽改版仍等 HD 拍板（候選3）。續 batch14。

## batch14 合併（2026-11-02 04:25，HEAD e99e3c9f0）
- eng 113→119（+6），units 178→184。nav_index byte-unchanged。
- 中階：nounmod（名詞當修飾語）、timeclause（when/while/as 時間子句）、soneither（So do I/Neither do I 附和倒裝）、pattern2（S+V+C 連綴動詞）。
- 高階：nomatter（no matter how/what/where 讓步＝however/whatever/wherever）、reduceclause（關代＋be 化簡為分詞：主動-ing／被動 p.p.）。
- 4 道確定性 gate 全綠（unit_schema/claim_evidence/question_correctness --verify＋scan_simplified 12 檔 PASS）。
- iPad 三視埠 render：nomatter 橫＋reduceclause 直逐張開圖，四角色簽核通過（右緣 97%、2–4 欄 responsive、無窄島、無重疊、老花可讀、≥44px tap）。
- builder 對抗式 review 修掉 soneither 自我附和病句（son_ex2/ex3 重生 mp3）、pattern2 P2 well 理由精確化。

## batch15 合併（2026-11-02 04:44，HEAD 待填）
- eng 119→125（+6），units 184→190。nav_index byte-unchanged。
- 中階：ditransitive（授與動詞雙受詞 give sb sth / to·for sb）、haveto（have to 外在義務，don't have to≠禁止）、exclamatory（感嘆句 What a…/How…）、formalsubjit（虛主詞 it）。
- 高階：meaningchange（remember/stop/forget/try 後接 to-V vs V-ing 意義不同）、causativepassive（使役/感官被動 be made/seen TO do）。
- 4 道確定性 gate 全綠（unit_schema/claim_evidence/question_correctness --verify＋scan_simplified 12 檔 PASS，190 units）。
- iPad 三視埠 render：meaningchange 橫＋causativepassive 直逐張開圖，四角色簽核通過（右緣 97%、2–4 欄、無窄島、無重疊、老花可讀）。
- builder 對抗式 review：NO BLOCKER；設計上已避開 causativepassive 感官被動 -ing 誘答陷阱、meaningchange 保留中文 gloss 以收斂。

## batch16 合併（2026-11-02 05:05）
- eng 125→131（+6），units 190→196。nav_index byte-unchanged。
- 中階：twoobjects（句型四 S+V+O+O 授與雙受詞）、sameplural（單複同形 sheep/deer/fish）、ifunless（條件連接詞 if/unless/as long as）、pieceof（不可數量化 a piece/cup/slice of）。
- 高階：asif（方式副詞子句 as if/as though，可能為真→現在式／與事實相反→過去式 were）、tenseagree（名詞子句時態呼應 backshift，普遍真理例外）。
- 4 道確定性 gate 全綠（196 units），scan_simplified 12 檔 PASS。
- iPad 三視埠 render：asif 橫＋tenseagree 直逐張開圖，四角色簽核通過（右緣 97%、2–4 欄、無窄島、無重疊、老花可讀）。
- builder 對抗式 review：無 blocker；修掉 asif/tenseagree/pieceof 三處 overstated 理由（as if 口語可現在式、永遠真理 backshift 選用、cup/glass 慣例非硬規則），未動選項/正解/音檔。
- strand 註：adjadv t_mid 已 0 未覆蓋→改 noun 補 1；relcl 未覆蓋皆 t_sub→高階取 nouncl+advcl。

## batch17 合併（2026-11-02 05:27）
- eng 131→137（+6），units 196→202。nav_index byte-unchanged。
- 中階：could（過去能力/委婉請求/可能）、prepcolloc（介系詞慣用搭配 depend on/be good at）、oneones（代用詞 one/ones）、vgerund（接動名詞的動詞 enjoy/finish/mind/avoid/keep）。
- 高階：themore（the+比較級 the+比較級 越…越…）、correlative（相關連接詞與主詞動詞一致 both→複數／either·neither·not only 就近原則）。
- 4 道確定性 gate 全綠（202 units），scan_simplified 12 檔 PASS。
- iPad 三視埠 render：themore 橫＋correlative 直逐張開圖，四角色簽核通過（右緣 97%、2–4 欄、無窄島、無重疊、老花可讀）。
- builder 對抗式 review：無 critical；修掉 prepcolloc P2「good in」overstate（美式口語偶有→改框為正式/會考用 good at），未動選項/正解/音檔。

## batch18 合併（2026-11-02 05:53）
- eng 137→143（+6），units 202→208。nav_index byte-unchanged。
- 中階：hadbetter（had better 強烈建議/警告）、indirectwh（間接問句 wh- 直述語序不用助動詞）、prepgerund（介系詞+動名詞 good at/before -ing）、articleidiom（冠詞慣用語 a/an=per、go to school）。
- 高階：pastperfect（過去完成式 had+p.p. 過去的過去）、convsprep（連接詞 vs 介系詞 because/although+子句 vs because of/despite+名詞，無 despite of）。
- 4 道確定性 gate 全綠（208 units），scan_simplified 12 檔 PASS。
- iPad 三視埠 render：pastperfect 橫＋convsprep 直逐張開圖，四角色簽核通過（右緣 97%、2–4 欄、無窄島、無重疊、老花可讀）。
- builder 對抗式 review 抓到並修掉 2 blocker：articleidiom 原教 play the piano/guitar（美式可省冠詞=方言分歧→第二正解），整點改教 AmE/BrE 一致的 a/an=per 慣用語，重寫題目＋重生 aidm_ex1/sh1 mp3；另修 3 minor overstate 理由（convsprep reduced concessive、indirectwh emphatic did、pastperfect sh1 更自然化）。

## batch19 合併（2026-11-02 06:14）
- eng 143→149（+6），units 208→214。nav_index byte-unchanged。
- 中階：relthat（關代 that 指人或物限定）、shallwouldlike（Shall I/we…? 與 would like）、prepmeans（介系詞方式/工具 by/with/in）、wordfamily（派生詞類轉換 beauty/beautiful/beautifully）。
- 高階：futureperfect（未來完成式 will have+p.p.，by the time 子句用現在式）、whilewhereas（while/whereas 對比，whereas 不表時間）。
- 4 道確定性 gate 全綠（214 units），scan_simplified 12 檔 PASS（relthat 僅 info：台 U+53F0 量詞「一台」TW 可接受）。
- iPad 三視埠 render：futureperfect 橫＋whilewhereas 直逐張開圖，四角色簽核通過（右緣 97%、2–4 欄、無窄島、無重疊、老花可讀）。
- builder 對抗式 review：NO BLOCKER；2 minor（futureperfect P1 will start、wordfamily P4 quick）判定理由未 overstate、正解唯一，照原樣出貨。

## batch20 合併（2026-11-02 06:34）
- eng 149→155（+6），units 214→220。nav_index byte-unchanged。
- 中階：zeroarticle（零冠詞 泛指複數/不可數/專有名詞）、relwhich（關代 which 指物/限定·非限定/回指整句）、stativeverb（狀態動詞多不用進行式）、itusage（it 虛主詞 天氣/時間/距離/代不定詞）。
- 高階：conjadverb（連接副詞與標點 however/therefore/moreover，需分號）、modalperfect（情態+完成式 must/should/might/can't have+p.p.）。
- 4 道確定性 gate 全綠（220 units），scan_simplified 12 檔 PASS。
- iPad 三視埠 render：conjadverb 直＋modalperfect 橫逐張開圖，四角色簽核通過（右緣 97%、2–4 欄、無窄島、無重疊、老花可讀）。
- builder 對抗式 review：0 blocker/0 minor/2 nit；修掉 relwhich P2 bike runs→goes；狀態動詞進行式、連接副詞逗號皆已適度 hedge 未 overstate。

## batch21 合併（2026-11-02 06:55）
- eng 155→161（+6），units 220→226。nav_index byte-unchanged。
- 中階：interrogativepron（疑問代名詞 who/whose/what/which）、activepassive（主動↔被動轉換）、concessionclause（讓步子句 although/though/even though）、indirectyesno（間接問句 if/whether 是非）。
- 高階：bareinfinitive（原形不定詞 make/let/have/see/hear+原形）、moreandmore（比較級+and+比較級 越來越）。
- 4 道確定性 gate 全綠（226 units），scan_simplified 12 檔 PASS。
- iPad 三視埠 render：bareinfinitive 橫＋moreandmore 直逐張開圖，四角色簽核通過（右緣 97%、2–4 欄、無窄島、無重疊、老花可讀）。
- builder 覆蓋分析回報：t_mid 未覆蓋做完此批剩 ~10（接近用罄，剩 vocab/noun/verb/voice/nonfinite/relcl/advcl/pattern 各 1–2）；t_adv 遠未用罄。
- 對抗式 review：0 blocker；builder 預修 interrogativepron P1 歧義（ate my sandwich→wants to go first）。

## batch22 合併（2026-11-02 07:17）
- eng 161→167（+6），units 226→232。nav_index byte-unchanged。
- 中階：futuretimeclause（時間副詞子句表未來用現在式）、infadjadv（不定詞當形容詞/副詞）、relomit（受格關代省略）、irregularverb3（不規則動詞三態）。
- 高階：multiplecomp（倍數比較 twice/three times/half as…as）、phrasalprep（片語介系詞 because of/in spite of/instead of，despite 後不加 of）。
- 4 道確定性 gate 全綠（232 units），scan_simplified 12 檔 PASS。
- iPad 三視埠 render：multiplecomp 橫＋phrasalprep 直逐張開圖，四角色簽核通過（右緣 97%、2–4 欄、無窄島、無重疊、老花可讀）。
- builder 覆蓋分析：t_mid 未覆蓋剩 6（noun.collective 刻意避開＝美式英式分歧地雷、pattern.sv/svo、voice.by-agent、vocab.core-1200/expand-2000）；t_adv 剩 59，充裕。
- 對抗式 review 修掉 3 處：irregularverb3 P4 garden-path 題幹改寫、relomit P4 理由去 overstate、multiplecomp P1 誘答改純結構錯誤消第二解。

## batch23 合併（2026-11-02 07:40）
- eng 167→173（+6），units 232→238。nav_index byte-unchanged。
- 中階（5）：patternsv（句型一 S+V 不及物）、patternsvo（句型三 S+V+O 及物）、voicebyagent（被動 by 片語與施事者省略）、corevocab（核心高頻字 thirsty/borrow/lend/repair/leave）、expandvocab（擴充字 protect/pollution/recycle/reduce/improve）。
- 高階（1）：compmodifier（比較級修飾語 much/far/a little + 比較級；不用 very、不雙重比較）。
- **t_mid 未覆蓋已用罄**（僅刻意跳過 noun.collective＝美式英式單複數分歧地雷）；之後批次改以 t_adv（剩 ~58）為主，另有 t_base ~5、t_sub 大量。
- 4 道確定性 gate 全綠（238 units），scan_simplified 12 檔 PASS（compmodifier 台北101 僅 info）。
- iPad render：compmodifier 橫＋expandvocab 直逐張開圖，四角色簽核通過。
- 對抗式 review 修掉：voicebyagent P3 史觀爭議句（Columbus→Mona Lisa/Leonardo）、P1/P4 施事者去「（人）」窄化、expandvocab P3 第二正解（加 into new ones + distractor pollute）、patternsv P5 雙 the→arrive to。

## batch24 合併（2026-11-02 10:07）＋ unitnav 定案
- eng 173→179（+6），units 238→244。nav_index byte-unchanged。全 6 個 **t_adv 高階**（t_mid 已用罄）。
- 高階：compoundadj（合成形容詞 well-known/ten-year-old）、presperfcont（現在完成進行式 have/has been+V-ing，狀態動詞例外）、confusableadv（易混形副 hard/hardly…）、gerundidiom（慣用動名詞 feel like/worth/no use+V-ing）、reciprocalpron（相互代名詞 each other/one another）、purposeresult（目的/結果 so that／so…that／such…that）。
- 注：前一次 batch24 於 Unit 5 遇暫時性 AWS 認證錯誤中斷、丟棄重啟，本批為重啟成果。
- 4 gate 全綠（244 units），scan_simplified 12 檔 PASS（compoundadj 台→臺僅 info）。
- iPad render：presperfcont 直＋purposeresult 橫四角色簽核通過。
- 對抗式 review 修掉 1 blocker：purposeresult P1 誘答 "so"（合法第二正解）→ 換 "because"（原因≠目的），理由去 overstate。
- 剩餘乾淨 t_adv 未覆蓋 ~29（vocab/verb/morph/adjadv/special/pattern…；分歧地雷如集合名詞一致、none 單複數刻意不取）。
- **unitnav 導覽改版：HD 2026-11-02 拍板 Cand 1（左側欄 app-shell）**。計畫：產品化 pshell/psb 進共用 assets/unit.{css,js}（一次套 244 頁）＋同分區單元由 units_index 動態帶＋①②③④錨點；hub index_new 加 #島/strand deep-link＋修 app-bar__home；全 gate＋iPad 四角色＋AC-VIZ-1 重簽。實作期間暫緩新內容批次避免 assets/unit.* churn。研究包存 repo nav_review/。

## unitnav Cand 1 導覽改版上線（2026-11-02 10:39，HD 拍板案）
- **HD 2026-11-02 拍板 Cand 1（左側欄 app-shell）已實作上線**。worktree builder 產品化、主 session 審 diff＋四角色 render＋merge。
- **assets/unit.css**：移植 Cand 1 pshell/psb/pill-nav-row（proto.css→正式，token-only）；**斷點由 1080px 下修 820px**（iPad Air 13" 直式 1024px 也顯示左側欄，對齊 hub＋空間利用），<820px 真手機用頂部 pill-nav-row。移除舊 gr-layout/gr-side/gr-nav（grep 確認無參照）。
- **assets/unit.js**：#root 內建 app-shell——側欄三組（你在哪裡 🏠學習地圖＋←subject·strand；同分區單元 runtime fetch units_index 篩 subject+strand、當前高亮、視窗化 10＋「共 N 個 →」；本單元流程 ①②③④）＋窄埠 pill-nav（←單元牆／上一個/下一個 sibling／①②③④）。右側 teach/practice(dictation canvas)/shadowing(錄音)/selfeval(recordUnit) 渲染零改動。siblings 不加 tier 徽章（R11＋避免依 id 推 tier）。
- **index_new.html**：最小侵入 hash deep-link #<island>/<strand>→選島＋click 既有 strand 卡（重用 renderStrandDetail）；空/不合法維持預設首屏。
- **244 單元頁 app-bar home**：index.html→index_new.html、「學習基地」→「學習地圖」一致化（同 lane，不動其他島/15 手刻頁）。
- **gate 全綠**：scan_simplified PASS、design_consistency DUPLICATE=0、a11y_gate PASS 0（iPad 橫基準）、unit_schema/claim_evidence/question_correctness CLEAN（244 units）、nav_gate PASS 0（島 8／鎖定 0／zh 0）。
- **AC-VIZ-1 重簽**：index_new.html sha fb4e8d70→**d9fa7e59**；hub_render.mjs 綁新 sha 重 render 13 狀態、hub_signoff 四角色重簽、figure_signoff --verify PASS。
- **四角色 render（逐張開 PNG）**：單元頁 addition 橫/直/手機＋presperfcont 直＋hub eng總覽/vocab單元牆——側欄三組齊全/當前高亮/siblings 篩對 strand、窄埠 collapse 生效、右側滿版右緣97%、無窄島/重疊/溢出、≥44px、無年段。
- 既有觀察（非本次引入、列 backlog）：ko-fi「Buy me a coffee」FAB 窄埠會蓋住部分內容（全站既有元件）。
- 研究包 nav_review/ 仍為 repo 未追蹤 scratch，待後續正式化或刪。

## batch25 合併（2026-11-02 11:08）＋ 開口說入口卡一致化（HD friction）
- **batch25**（commit 650928a0f）：6 單元全 t_adv 高階＋36 edge-tts mp3。eng 179→185，units 244→250，nav_index byte 不變。
  - 單元：future-progressive（未來進行式 will be+V-ing）、used-to-family（used to／be used to／get used to 辨析，刻意全肯定句避 didn't use(d) to 分歧）、inversion-omit-if（省略 if 倒裝 Were/Had/Should）、its-time（It's time+過去式）、inversion-negative（否定副詞句首倒裝 Never/Seldom/Hardly/Not only…）、subject-of-infinitive（for sb to／of sb to 意義主詞）。
  - 4 gate 全綠（250 units）、scan_simplified PASS。對抗式 review 修 3 minor（fpg P2 are→were watching、fpg P5 時間片語、全站 AmE apologize 一致化），無 blocker、無第二正解。
  - iPad render：futureprogressive 橫/直/手機＋inversionnegative 四角色 pass（側欄三組/當前高亮/siblings 篩對 verb·special、窄埠 pill collapse、右側滿版 97%）。前綴 fpg/uto/ioi/ith/ivn/soi 各 6 mp3、0 碰撞。
- **開口說入口卡一致化**（commit a75331cac，HD friction 訊號）：hub 英語文總覽「開口說（情境溝通）」卡原用綠 lp-tchip area 膠囊＋長 lp-sdesc，與相鄰 strandCard（step badge＋名稱＋中性 chips＋藍色 N 個單元 →）不一致且破壞 grid。改成鏡射 strandCard：step №2＋名稱＋中性「聽·說·寫」chip＋藍色「N 個單元 →」uhint（us.length 動態＝250）。
  - index_new.html sha d9fa7e59→3077661b；hub 13 狀態重 render＋四角色重簽（開 island:eng 總覽 PNG 複判開口說卡與鄰卡同設計語言、grid 對齊），figure_signoff PASS、a11y 0（含 index_new）、nav_gate 0。
- 註：單元頁 Cand 1 左側欄導覽在**單元頁**可見；index_new.html 本身只多隱形 hash deep-link #<island>/<strand>（開 index_new.html#eng/vocab 會跳主題字彙單元牆）。

## 設計一致化 + cache-bust（2026-11-02 11:14，HD friction 連環訊號）
- **根因釐清**：HD 看單元頁「沒側欄、步驟變裸藍字、app-bar 還是『學習基地』」＝**瀏覽器吃到舊快取**（單元頁 unit.css/unit.js 連結無版本號）。server 實檔已驗證正確（app-bar『學習地圖』、grid 248px+1fr、psb display:block、pshell CSS 載入）。
- **cache-bust**（commit 見上）：250 單元頁的 `assets/unit.css`/`assets/unit.js` 連結加 `?v=20261102c`，回訪者自動取新檔、不需手動硬重整。日後改這兩個共用檔要 bump 版本字串。
- **開口說情境卡一致化**（commit 見上，HD「開口說的也要改吧」）：english_speaking.html 的 `.sp-unit` 原為 teal 細框小 chip（hover 填 teal 反白），與全站房屋卡不一致。改成對齊 index_new 的 `.lp-unitcard`：var(--card)＋1px card-border＋teal 4px 左條＋radius 12＋淡陰影、hover 抬陰影；內容 emoji＋標題（粗）＋can-do 2 行截斷＋⏱分鐘 meta。iPad 橫 render 四角色 pass（250 卡、5 欄滿版、整齊、無窄島）；scan PASS、a11y 0。

## ⛔ 2026-11-02 11:35 HALT — IA 重大缺陷 + 驗證盲點（HD 抓到，已停所有自動內容）
**HD 連環指出且經 gate 量化證實的問題（不辯解，全記）：**
1. **IA 重複（headline）**：100 個「情境溝通」單元每個都**同時出現在開口說情境 ＋ 其文法 strand 牆**（greetings→verb、howareyou→pattern…），違反 spec §6.1「單一 home」。`tools/ia_consistency_gate.py --verify` 實站 FAIL：dual_presented=100、non_member_eng=150。
2. **開口說「其他」洩漏**：english_speaking.html 把不在 CATS 白名單的 150 個文法單元全倒進「其他」區（本該只有 10 情境×10）。
3. **「開口說/情境」軸非 spec**：來自已刪的 english_island_blueprint.md（§0.4 non-normative）；spec 只有 strand 單一軸。這條遺留軸疊在同一批單元上＝重複來源。
4. **呈現層灌水**：250 單元為真實檔案（真音檔/題目/過機械 gate），但雙重呈現使 hub 數字（開口說「250」、主題字彙 63 其中 52 是情境）看起來遠多於實際獨立內容。
5. **驗證盲點（根因）**：原 33 gate 無任何一個檢查 IA 一致性（跨區重複/成員定義/單一 home），故「gate 全綠」與「IA 錯」並存。且 Phase 0 地基未真打完（見 19:40 診斷）即開 batch 灌內容＝跳過 spec 順序。

**本 session 已做：** 停 batch26（worktree 丟棄未合併）＋停自動 loop；建 `tools/ia_consistency_gate.py`（紅隊 PASS、實站 FAIL=1，量化上述）＋`authoring/speaking_cats.json`（開口說成員 SSOT，暫存）。

**待 HD 定方向（未動）：** (A) 移除開口說情境軸、回 strand 單一 home〔我的建議〕；(B) 保留情境為 cross-cut 軸但正式納 spec＋設 speaking_cats allow_cross_cut＋重分類；(C) 先全審 250 單元內容正確性；是否 revert 近期批次待定。**在 HD 指示前不改架構、不 revert、不續灌內容。**

## 2026-11-02 英語島內容正確性＋spec 吻合全審：完成（250/250）
- 150 core（wave1–6）+ 100 speaking（wave7–10）全審畢。全程 0 blocker / 0 major，累計修 18 minor。
- 方法：每波 2–3 個獨立對抗式 reviewer 併跑，逐檔逐項核 6 維（事實/唯一解/誘答不過度宣稱/R14/情境吻合/零簡體）。
- 完整逐 wave findings 與 minor 修正清單見 authoring/english_content_audit_findings.md。
- 系統性 backlog（另案）：R14 teach-body zh/en 混排字串需引擎層拆 en + 可收合 zh（影響全 corpus）。
- 最新 commit 已 push origin/main。

## 2026-11-02 R14 teach 拆兩塊：完成
- 引擎 unit.js 渲染英文 body + 預設收合 zh_hint 中文對照（🔊＋toggle 併列、2 行精簡版面）；CSS pill 44px。
- 250 檔、1329 teach 段全遷移（686 example 機械拆、643 text 團隊改寫英文媒介），body 零 CJK、每段有 zh_hint。
- 新 fail-closed gate：tools/r14_body_gate.py（紅隊過）。英文品質 5 波獨立對抗 review 全 249 單元：0 blocker/0 major、修 21 minor。
- 全 gate 綠（r14_body/schema/claim/question/簡體/nav AC-NAV 收合）；iPad render 跨 tier 抽查通過。全部 commit＋push。
- 待辦（另案）：can_do 橫幅英化；音檔存在/可播 gate；iPad 四角色完整簽核。

## 2026-11-02 15:1x Phase-0 gap 精確定位（R14 收尾後續推進 spec）
- 誤解澄清：manifest meta `binding_unverified=3086` 是 **raw 前-overlay 統計**（_kp_build 從不寫 verified），**非 AC-KP-VERIFY 判決**。
- 實算 AC-KP gap＝binding(3086) 不在 verified_overlay(3097 ids) 者＝**只 5 筆**：
  1. chi.t_base.char.recognition-count（識字量 2700/2200；108 國語文領綱 4-Ⅲ-1）
  2. chi.t_sub.gwrk.time-budget（學測國寫字數/時間分配；大考中心）
  3. chi.t_mid.prac.envelope（書信信封直/橫式；郵局/課綱）
  4. eng.t_base.vocab.weather-nature（颱風/地震 vocab；**high-risk 安全相鄰**→≥2 reviewer＋cross_check）
  5. eng.t_mid.vocab.health-illness（健康/身體不適 vocab；會考；cross_check ≥2 字典）
- 這 5 筆皆 Phase-2 手工注入殘留、`unit_ids:[]`、無 fact_check_ledger 條目；要 release-grade verified 需**真實外部權威來源**（scope 課綱官方 ＋ fact cross_check/consensus），**嚴禁造假 reproduction_ref/quote**（repro_gate/cross_check_gate 會真抓取比對）。
- 其餘全部現況：fast 確定性 gate 全綠（unit_schema/ia_consistency/r14_body/audio/claim/question/簡體）；a11y 學習路徑頁 0 違規；nav AC-NAV 0 違規；promote_verified --check 一致 verified=3097。
- 下一步：以驗證 team（domain expert＋對抗式 reviewer；2 筆 high-risk 需 ≥2 相異 reviewer）逐筆蒐證→registry/ledger→cross_check_gate 真抓取→promote_verified，gap 5→0；屬 Phase-0 ship-gate，非 content_audit 5-clean（兩軌）。

## 2026-11-02 15:4x Phase-0 AC-KP gap 5→1（4 筆真實升 verified，1 筆誠實 deferred）
- 做法全程零造假、gate 當護欄：
  - chi.recognition-count（識字量）＋chi.envelope（信封格式）：國語文領綱(sha210b2bea)/總綱 scope＋中華郵政官方＋**雙人對抗式審查真跑**（kprev-educator/adversary PASS、is_hard_fact=false）→ expert_review fact → promote。
  - eng.weather-nature＋eng.health-illness：Longman＋Wiktionary（2 相異出版者）**cross_check_gate 真抓取 PASS**（re-fetch 比對 quote、≥2 host）→ promote。純字義非安全/醫療建議（雙鏡確認）。
  - 全程 ledger_schema_gate／cross_check_gate／promote_verified --check 皆綠；verified 3097→3101；commit＋push。
- **唯一剩餘（誠實 deferred，非失敗）＝chi.t_sub.gwrk.time-budget**：試卷(114/115)證實「90分鐘/二大題/逐題字數」，但 KP 題敘倚賴「知性題/情意題」命名；該命名出自大考中心**國寫考試說明**，本 session 多途徑抓取皆 302/無法取得逐字（試卷 PDF 僅見「第一/二大題」無「知性/情意」）。雙鏡均以「命名未官方佐證」保留 FAIL。
  → harness 正確拒絕 over-claim；**不偽造**。解法二選一（待 HD/下次）：(a) 取得國寫考試說明逐字官方源後 verify；(b) 將 KP 題敘收斂為已證之「時間/二大題/逐題字數」（去命名）再 verify＝需改 _kp_slices 母體＋round-trip。
- AC-KP-VERIFY 因此仍差 1（誠實 RED）；其餘 fast gate 全綠、a11y/nav 0、R14 全 corpus 收斂、音檔 gate CLEAN。

## 2026-11-02 15:4x Phase-0 AC-KP gap → 0（全 5 筆真實 verify，含國寫命名）
- chi.t_sub.gwrk.time-budget 最終解除：verify-gw-naming 取得大考中心 107+111「國文考科考試說明定稿」官方 PDF，逐字『知性的統整判斷能力』『情意的感受抒發能力』兩大題（本機自抓 sha16 111=c351a40c2dc0120d/107=50bbb592，pdftotext 確認出現 5×/3×）→ 雙鏡保留點解除、改 PASS（is_hard_fact=false 考試規格約定）→ expert_review fact＋考試說明 scope → promote。
- **AC-KP-VERIFY gap = 0**（binding minimum 全 release-grade verified；verified_overlay=3102、promote --check 一致、ledger_schema_gate 綠）。全程零造假、gate 當護欄（cross_check_gate 真抓取、promote --check 重算、sha 綁定）。
- 本 session Phase-0 淨結果：binding 驗證從（誤讀 3086、實 5）→ 0；R14 teach 拆兩塊全 corpus 收斂；音檔 fail-closed gate；a11y/nav/fast gate 全綠。

## 2026-11-02 16:0x–18:3x Phase-1 AC 全掃 + AC-STYLE gate 開建
- **AC-NOGRADE gate 修 false-positive**（commit 2f6120332）：index_new.html 兩處「年段」是 JS 整行註解（learner 不可見）。no_grade_label_gate.py 掃描前剝除 HTML 註解＋整行 // 註解（行尾註解/字串字面值仍 fail-closed）；紅隊 12 例全過；269 檔 AC-NOGRADE 全綠。
- **Phase-1 既有 AC 全掃皆綠**：AC-KP-VERIFY(gap0)、AC-NAV(render 17 頁 0)、AC-A11Y-1、AC-PERF-1、AC-VIZ-1(figure_signoff sha 58dabbf…、13 狀態四角色 0 違規)、AC-CORRECT visual、AC-SCHEMA/UNIT(251/251)、AC-LANG、AC-NOBACKEND、AC-ANTIDRIFT、AC-REWARD、prereq/ia/source_freshness。AC-COV-1＝Phase 3（覆蓋矩陣，需建教材）。
- **AC-STYLE-1**：skill design_consistency_gate scoped 實跑（canon 69、DUPLICATE=0 達「重造=0」）；2 NEAR（.ea-level/.ma-level ~~ .u-card 0.93）經查為 tokenized 刻意變體、非 drift。正式專案 gate 接線＋content-card lint 仍待建（Phase 0.5）。
- **AC-STYLE-2 lint 已建+紅隊**（commit fa519e532）：tools/style_token_lint.py（--verify/--selftest；掃學習路徑 inline <style>＋assets/unit.css 硬編色；:root/--token 定義豁免；white-space FP 防護；跨行 background 值仍掃）。
  - unit.css 9 處硬編色→app.css 新 --u-* token（--u-on-english-solid/-tint-correct/-tint-wrong/-canvas-paper/-canvas-rule/-card-shadow；值=原字面值、主題中性、**零視覺變更**，250 單元頁渲染不變、無需重簽）。unit.css 現 lint CLEAN。
- **待續（R-STYLE-5 remediation，需視覺簽核流程）**：hub index_new.html(9) + english_advanced(1)/idioms(3)/sense(1)/speaking(4) 共 **18 處 inline 硬編色**。figure_signoff 綁 index_new.html 原始碼 sha，故 hub 任何改動（即使零視覺變更）會使 AC-VIZ-1 四角色簽核作廢→必須重 render(iPad Air 13 十三狀態)+四角色重簽+更新 manifest/signoff sha。此 18 處屬下一項 tracked 任務，不可靜默 solo 編輯。
  - 剩餘多為 box-shadow 的 rgba(51,49,46,.XX) 品牌墨陰影（.05/.09/.1/.12 多階）＋color-mix 的 #fff＋idioms 的 #2e7d32/#c62828。remediation 時決定：零視覺變更（定 --u-* 等值 token）或 house 統一（--shadow-sm/-lg，屬視覺變更）——二者皆須走 figure_signoff 重簽。

## 2026-11-02 18:3x–18:5x AC-STYLE gate-bootstrap 完成（Phase 0.5 交付）
- **AC-STYLE-2 全交付**：tools/style_token_lint.py（紅隊：:root/--token 豁免、white-space FP、值位 white 仍擋、跨行值掃）。
  - unit.css 9 處＋hub index_new.html 9 處＋4 bespoke 頁（advanced/sense/idioms/speaking）9 處＝全部硬編色→app.css 新 --u-* token（--u-on-english-solid/-tint-correct/-tint-wrong/-canvas-paper/-canvas-rule/-card-shadow/-shadow-nav-hover/-shadow-card-hover/-mix-lighten/-opt-wrong-tint，值=原字面值、主題中性、零視覺變更）。idioms 另移除已定義 token 的冗餘 var() fallback 字面值。
  - **全站 267 檔 AC-STYLE-2 命中=0 全綠**。commit fa519e532/4c65196e3/d8c52221f。
  - hub 改動→index_new.html sha 58dabbf3→ec2bffb5：**AC-VIZ-1 重 render 13 狀態＋四角色重簽**（實開 eng 主圖/eng#vocab-detail 單元牆+返回鈕/math 紫島色 PNG 逐張複判＝零回歸），figure_signoff PASS 綁新 sha。
- **AC-STYLE-1 專案 gate 交付**：tools/design_consistency_gate.mjs——(A) 接線 skill design_consistency（scoped 學習路徑頁、SDA_CSS=app.css,unit.css,game_core.css、canon 69、DUPLICATE=0）+(B) content-card 自適應寬 lint（R-STYLE-3，卡類固定窄寬<520px=置中窄島→DENY）；--selftest 紅隊 4/4；live 重造0違規卡0 PASS。commit fbbd77c9f。2 NEAR（.ea-level/.ma-level ~~ .u-card 0.93）前已查為 tokenized 刻意變體。
- **本 session Phase-1 淨結果**：既有可跑 AC 全綠（KP-VERIFY/NOGRADE(修gate)/NAV/A11Y/PERF/VIZ-1(重簽)/SCHEMA/UNIT/LANG/NOBACKEND/ANTIDRIFT/REWARD）＋ **AC-STYLE-1/2 兩個「待建」gate 已建成+紅隊+全綠**（Phase 0.5 gate-bootstrap）。
- **待續**：(1) 把 style_token_lint / design_consistency_gate 併入專案 .claude/settings.json 的 fail-closed PreToolUse hook（目前為可跑 --verify gate，尚未掛 hook 擋關）；(2) site-wide correct/wrong tint 不一致統一（unit.css #fde8e8 vs bespoke rgba(255,118,117,.12)）＝R-STYLE-5，走視覺檢查；(3) AC-COV-1 覆蓋矩陣＝Phase 3（需建教材）。

## 2026-11-02 19:0x 權威 verify_learning_path --phase=1 結果（重要狀態修正）
背景跑 `tools/verify_learning_path.py --phase=1 --json`（task b47df71da, exit0, ~16min, http:8096）。**19 PASS / 6 FAIL**（report＝/tmp/vlp_phase1.report.txt）：
- ✅ 新交付的 **AC-STYLE-1、AC-STYLE-2 orchestrator 認可 PASS**（本 session gate 生效）；另 SPEC/LANG/ANTIDRIFT/NOGRADE/COV-2/SCHEMA/UNIT-1/CORRECT(6子全綠)/NAV/VIZ-1/REWARD/PATH-1/PATH-2/PERF/A11Y＋helpers(visualqa-draft/source-registry/ledger-gate/repro-gate) 全 PASS。
- ❌ **6 FAIL 真因**：
  1. **chk-manifest(@P-1 exit1)→連帶 AC-KP-VERIFY refuse**：`tools/_kp_build.py --check` T3-03＝committed KP manifest JSON／附錄 markdown 與重新生成**逐欄不符**（drift；by vstatus 全 provisionally_verified、raw binding_unverified=3086 是 pre-overlay 統計）。**須診斷 regen 來源，不可盲改**（T3-03 是竄改偵測器）。注意：先前 session 的「AC-KP gap=0」是 verified_overlay/promote --check 層，與此 _kp_build regen 層不同；orchestrator 把 AC-KP-VERIFY 關在 chk-manifest 後。
  2. **AC-UNIT-2(exit=250)＝0/250 頁達 content_audit 連續 5-clean**：`per_page_5clean_gate.py`。**這是 Phase-1 實作主體工程**（每檔 /static-doc-audit 跑到 5 clean），目前一頁未跑。屬大規模多-workflow fan-out，需明確規模授權（Workflow opt-in）後逐檔推進。
  3. **AC-UNIT-3(exit=2)＝argparse 錯非真偏離**：acceptance_criteria.json 呼叫 `unit_acceptance_lint.py --verify-golden/--selftest-golden`，但工具未實作該 golden-diff 模式（golden 範本 `authoring/golden/communicative_unit.html` 已存在→可建）。**待建 gate 模式**。
  4. **AC-CODE-DL＝`tools/code_download_gate.mjs` 未建**：學習路徑有 `downloads/dictation-src.zip`+README（聽寫系列可下載碼），非 N/A，須建 gate 驗「解壓到 temp＋跑 README＝build/test 綠」。**待建 gate**。
  5. **AC-COV-1(exit1)＝Phase-3 覆蓋矩陣**（minimum 3086 未全有單元；需建教材＋HD 確認，非 Phase-1 blocker）。
- **下一步佇列（tractable 先）**：(a) 建 `code_download_gate.mjs`+紅隊（驗 dictation bundle 乾淨解壓可跑）；(b) `unit_acceptance_lint.py` 加 `--verify-golden/--selftest-golden` golden 結構 diff＋deviation_reason 驗（§6.6①）+紅隊；(c) 診斷 chk-manifest T3-03 drift 根因（找出 committed JSON vs regen 哪欄不符、是否合法）；(d) AC-UNIT-2 250×5-clean＝主體收斂，需規模授權後開跑；(e) AC-COV-1 Phase 3。

## 2026-11-02 19:2x HD 決策：英語島「先補齊」再收斂（重要方向）
HD 指出英語島**內容未完成**（非僅未收斂）：300 eng binding KP 只覆蓋 185（62%），**缺 115 KP 無單元**；22 分區有 4 個 0 單元；已建分區內部也沒做滿（noun 6/10、special 10/18、subj 5/13、morph 6/13…）。HD 指令＝**先補齊**（補到 300 KP 全覆蓋），補完再 5-clean 收斂。
### 英語島補齊 backlog（缺口，依優先）
- **0-單元分區（最急，63 KP）**：phonics 自然發音(20)、reading 閱讀理解(18)、writing 英文寫作(15)、listening 聽力(10)。
- **已建未滿（52 KP）**：special(缺8)、subj(缺8)、morph(缺7)、vocab(缺5)、noun(缺4)、pattern(缺4)、relcl/voice/nouncl/adjadv/modal/pron/nonfinite/prep（各缺1–2）。
- 覆蓋計算法：eng.<...> binding KP（非 beyond）被某單元 teach 或 practice 的 kp_ids 命中＝已覆蓋；指令：見本檔上方 per-strand 統計腳本。
### 建置 SOP（每分區）
1. 動工前本 session 完整讀 LEARNING_PATH_REBUILD_SPEC.md（§6.2 骨架／§6.6 rubric／§6.7 units_index 註冊）＋英語島治理鐵律（memory: english-island-approach-2026-10-31 / english-island-phase2-units-live：語感>文法、聽寫+跟讀+語調模仿核心、英文學英文 R14、術語附英語 R15、不教台式對比、國小情境化、共用引擎 assets/unit.{css,js}）。
2. 組 team（writers＋native-en/linguist/learning-sci/knowledge-viz/pm/eye-comfort 六鏡＋對抗 reviewer），不 solo。
3. 產 english_<strand>.units.json（＋必要時頁）、edge-tts 真實音檔、註冊 units_index/hub。
4. 過全確定性 gate：unit_schema/claim_evidence/question_correctness/scan_simplified/r14_body/audio_exist/ia_consistency/nav/a11y/style_token/design_consistency/unit_acceptance(--verify+--verify-golden)/no_grade/no_backend。
5. **一次只跑 1 個 content_audit workflow**（MacBook 資源；絕不並發整波）。
6. 全島 300 KP 覆蓋到齊 → 才一次性驅動 per-page 5-clean 收斂（AC-UNIT-2）。
### 本 session 已完成的驗證骨架（讓「補齊/收斂」有可驗標準）
- AC-STYLE-2 lint（style_token_lint，commit fa51/4c65/d8c5）、AC-STYLE-1 專案 gate（design_consistency_gate.mjs, fbbd）、AC-CODE-DL gate（code_download_gate.mjs, 8d4c）、AC-UNIT-3 golden 模式（unit_acceptance_lint --verify-golden, 2d9c）、AC-NOGRADE FP 修（2f61）、hub AC-VIZ-1 重簽（4c65）。
- 剩 --phase=1 未過：chk-manifest(KP manifest regen drift，待診斷)、AC-UNIT-2(補齊後才收斂)、AC-COV-1(全科覆蓋矩陣=Phase3)。

## 2026-11-02 19:4x 英語島補齊開工（HD「照計畫做完不要停」）— phonics 分區
- 開工 Phase 3 補齊，第一分區＝phonics 自然發音（20 KP，0 單元）。檔＝english_phonics.html／english_phonics.units.json（GR：eng×phonics×t_base「自然發音（初級）」；單一 t_mid kk-ipa 依 ≤3 併頁）。
- **單元拆解（20 KP→11 單元，教學序）**：U1 字母認讀書寫(letter-recognition/letter-writing/alphabet-order/name-vs-sound)｜U2 單子音+短母音CVC(single-consonants/short-vowels/decoding)｜U3 聽音拼字encoding｜U4 silent-e｜U5 vowel-teams｜U6 blends+digraphs(consonant-blends/consonant-digraphs)｜U7 r-controlled｜U8 hard-soft-cg+final-le｜U9 schwa+syllable-stress｜U10 ed-sound+plural-s-sound｜U11 kk-ipa。
- 每單元走建置 SOP（§6.2.2 schema＋§6.6 rubric＋英語島治理：語感/聽寫/跟讀、R14 英文媒介中文收合、R15 術語附英語、國小情境、共用引擎 unit.{css,js}）→ 全確定性 gate → edge-tts 真音檔 → content_audit 一次一 round 到 5-clean → 視覺簽核。
- 流程：委派 English-phonics 作者 agent 起草 units.json、我把關 gate（資源限制：一次一 agent/一 round，不並發）。

---

## 2026-11-02 20:01 英語島補齊 — phonics U1+U2 建成（Phase 3「先補齊」）
- **english_phonics.units.json**：U1 `eng.t_base.phonics.letters-basics`（4 KP：letter-recognition/-writing/name-vs-sound/alphabet-order）＋U2 `eng.t_base.phonics.cvc-blending`（3 KP：single-consonants/short-vowels/decoding，prereq＝U1）。phonics 覆蓋 0→7/20 KP、0→2 單元。
- **內容驗證（我親自複核，非信 subagent）**：短母音 /ɑ/ hot（美式/KK，claim 已透明標 US /ɑ/・UK /ɒ/）、mop /ɑ/、字母名 m=/ɛm/・a=/eɪ/・b=/biː/ 皆正確；筆順「usually top to bottom」保守 hedge、status=provisional 待母語 reviewer。rubric⑦ 真教真考 U1 4/4、U2 3/3 齊。
- **音檔**：edge-tts（en-US-AnaNeural）實際生成 10 mp3（ph_letters_*×5、ph_cvc_*×5）。因 edge-tts 無法乾淨唸孤立音素，3 條 IPA-first audio 行（U1 ex2/sh2、U2 ex1）改為「字母名＋錨定整字」使音檔與顯示一致、誠實（IPA 保留在相鄰非音檔 teach 區塊）。audio_exist_gate CLEAN（1446 refs 全存在可播）。
- **確定性 gate（親跑）**：unit_schema / r14_body / scan_simplified / claim_evidence / question_correctness / audio_exist / no_grade_label / ia_consistency / unit_acceptance_lint --verify 全 9 綠。
- **gate 修補 H-6**：unit_acceptance_lint 把 prerequisites（unit_id）誤當 KP id 比對 manifest（潛伏 bug，U2 首個宣告 prereq 觸發）→修 `_collect_kp`+加 `prereq:unknown` 獨立檢查+紅隊 3 例。見 GATES_HOLES_LEDGER H-6。
- **尚未**：content_audit 5-clean（依計畫 §7 待全島覆蓋+接線後才一次一檔收斂）；視覺 iPad 簽核；U3–U11 phonics 其餘 13 KP。
- **下一步**：續建 phonics U3–U11（consonant-blends/-digraphs/silent-e/vowel-teams/r-controlled/schwa/syllable-stress/encoding/… 等 13 KP），再 reading/writing/listening（0 單元分區）。

## 2026-11-02 20:12 英語島 phonics U3–U5 建成
- U3 encoding（聽音拼字）／U4 silent-e（魔法 e）／U5 vowel-teams（母音組合），各掛 1 KP、prereq=[cvc-blending]。phonics 覆蓋 7→10/20 KP、2→5 單元。
- **內容親驗（team lead 複核非信 subagent）**：cape/kite/hope/cube 長母音正確；silent-e 例外 have/give/come/love 誠實標 sight words；ea（bread/head /ɛ/、great/break /eɪ/）、oo（book/good /ʊ/）多讀音、u_e /juː/（用 cube/cute 避 tube/rude）皆誠實標；encoding 刻意避 /k/ 拼法歧義。小註：dog /ɑ/ 於非合併 GA 實為 /ɔ/（方言差；拼字 d-o-g 無歧義，provisional，留母語 reviewer）。
- 音檔：edge-tts 生成 15 mp3（ph_enc_/ph_sile_/ph_vt_ ×5），音↔顯一致。audio_exist_gate CLEAN（1461 refs）。
- 9 道確定性 gate 全綠（含修好的 unit_acceptance_lint prereq 檢查）。所有 claim status=provisional 待母語 reviewer。
- 下一步：phonics U6（blends+digraphs）→ U7 r-controlled → U8 hard-soft-cg+final-le → U9 schwa+syllable-stress → U10 ed-sound+plural-s → U11 kk-ipa。

## 2026-11-02 20:25 英語島 phonics U6–U8 建成
- U6 blends-digraphs（consonant-blends＋consonant-digraphs 2 KP）／U7 r-controlled（1 KP）／U8 hard-soft-and-le（hard-soft-cg＋final-le 2 KP）。phonics 覆蓋 10→15/20 KP、5→8 單元。
- **內容親驗**：blends 各子音保留音；digraphs th 清/濁兩讀（thin /θ/・this /ð/）、ck/ng、ch 例外（school/chef）僅註 verification_ref 不入 learner teach；r-controlled ar /ɑr/・or /ɔr/・er/ir/ur 重讀合流 /ɜr/＋弱讀 /ər/ 誠實標；hard-soft c/g（軟音在 e/i/y 前）＋例外 get/give /ɡ/ 標出；final-le /əl/（schwa，e 不單獨發音）皆正確。
- 音檔：edge-tts 16 mp3（ph_bld_×6／ph_rc_×5／ph_cg_×5），音↔顯一致。audio_exist_gate CLEAN（1477 refs）。
- 9 道確定性 gate 全綠；claim 全 provisional 待母語 reviewer（符號選擇 /ɜr/ vs /ɝ/、final-le schwa vs syllabic l 等點留 reviewer）。
- 下一步：U9 schwa+syllable-stress → U10 ed-sound+plural-s → U11 kk-ipa（剩 5 KP），phonics 即滿。

## 2026-11-02 20:36 英語島 phonics U9–U11 建成 → phonics strand 20/20 KP 滿覆蓋 ✅
- U9 schwa-and-stress（schwa＋syllable-stress）／U10 ed-and-plural-s（ed-sound＋plural-s-sound）／U11 kk-ipa（t_mid，kk-ipa 1 KP）。phonics 覆蓋 15→**20/20 KP**、8→11 單元。**phonics 為全站第一個 100% 覆蓋的 strand。**
- **內容親驗**：schwa（任何母音弱讀可成 /ə/，由重音非拼字決定）、ed 三音 /t//d//ɪd/＋-s 三音 /s//z//ɪz/（判準＝前一個音清濁/嘶擦）、REcord/reCORD 名動重音皆正確。
- **親驗抓到並修正 1 處正確性瑕疵（U11）**：原稿把「name /eɪ/、go /oʊ/」的 KK/IPA 差異誤歸因於長音記號 ː（但 name/go 本就無 ː）；改正為 KK 用單母音符號 /nem/·/ɡo/ vs IPA 滑音 /neɪm/·/ɡoʊ/，ː 差異另以 see /siː/(IPA) vs /si/(KK) 舉例。teach＋claim 同步修正。
- 音檔：edge-tts 14 mp3（ph_sch_×5／ph_ed_×5／ph_kk_×4），音↔顯一致。audio_exist_gate CLEAN（1491 refs）。
- 9 道確定性 gate 全綠；claim 全 provisional 待母語 reviewer（ed/plural soft-ge /ɪz/ 細節、KK 重音標記精確呈現留 reviewer）。
- 下一步：英語島 0 單元分區 reading／writing／listening（43 KP）→ 已建未滿分區（~52 KP）→ Phase 2 接線（prerequisites 已逐單元宣告，待產 roadmap_layout.json）→ 全島補齊後一次一檔 5-clean 收斂。

## 2026-11-02 20:50 英語島 listening strand 建成 → 10/10 KP 滿覆蓋 ✅
- 新檔 english_listening.units.json：L1 picture-id（t_base）／L2 sounds-stress（phonology+stress-intonation）／L3 qa-dialogue（response+short-dialogue）／L4 cue-numbers（transition-cue+numbers）／L5 dictation／L6 monologue-implication（t_adv）。listening 0→10/10 KP、6 單元，DAG prereq 由淺到深。
- **內容親驗**：最小對立對 sheep/ship·bad/bat（真詞 TTS 可靠）、wh/yes-no 問答、轉折詞 but/because、報時報價、聽寫、獨白主旨、言外之意皆正確；答案皆可由聽到的字句/語法/情境推得。
- **收斂前待辦（已記）**：L2 P3 句重音題（答 red）依賴 TTS 對比重音、L2 P4 問句語調題依賴 TTS 升調——收斂階段須對真實 mp3 複核語調是否明顯（答案本身 pedagogically 正確、且 P4 可由語法判定）；L3/L6 對話為單聲道單嗓；L1 選項為中文圖說（無真圖）。皆 provisional 待母語 reviewer＋真音複核。
- 音檔：edge-tts 45 mp3（lis_* 前綴，audio_script 完整英文句/對話），音↔腳本一致。audio_exist_gate CLEAN（1536 refs）。
- 9 道確定性 gate 全綠。eng 覆蓋 205→215/300。
- 下一步：reading（18 KP）→ writing（15 KP，自評）→ 已建未滿分區（~52 KP）→ Phase 2 接線 → 全島 5-clean 收斂。

## 2026-11-02 20:59 英語島 reading t_mid R1–R3 建成（6/18 KP）
- 新檔 english_reading.units.json：R1 main-detail（main-idea+detail）／R2 word-reference（guess-word+reference）／R3 functional-skim（functional-text+skim-scan）。reading 0→6/18 KP、3 單元。
- **內容親驗**：三篇短文（Maya 花園／Tom 的狗 Rocky／圖書館告示）各題正解在文中皆有明確依據、單一可辯護答案；sunflower 題「比她高」vs 顏色誘答、he=Rocky/they=visitors 指涉、告示掃讀時間/罰款皆正確。
- reading 純文字（無音檔）；shadowing 為純文字朗讀練習。9 道確定性 gate 全綠。eng 覆蓋 215→221/300。
- 下一步：reading t_adv R4–R9（12 KP：best-title/purpose/attitude-tone/inference/text-structure/cohesion/fact-vs-opinion/graph-integration/multi-text/cloze/gap-filling/discourse-ordering）→ writing（15 KP）→ 已建未滿分區 → Phase 2 接線 → 全島 5-clean 收斂。

## 2026-11-02 21:11 英語島 reading t_adv R4–R9 建成 → reading strand 18/18 KP 滿覆蓋 ✅
- append R4 title-purpose／R5 tone-inference／R6 structure-cohesion／R7 factopinion-graph／R8 multitext-ordering／R9 cloze-gap（各 2 KP）。reading 6→18/18 KP、3→9 單元。**第三個 100% strand（phonics/listening/reading）。**
- **內容親驗**：R4 說服目的（should/please 訊號）、R5 態度/推論（did not want to leave 線索）、R6 比較對照＋however/therefore、R7 事實vs意見＋數據（C=15、A+B=20）、R8 跨文本金額（70/剩10）＋泡茶排序唯一（First/Then/After/Finally）、R9 克漏字（needs/helps 主謂+時態一致、語境唯一）皆正確、單一可辯護答案。
- 灰帶題（purpose/structure/cloze-2）皆判定為語境中單一最佳答案；R7「27本」誘答解釋略含糊（非正確性錯，收斂階段潤飾）。純文字無音檔。8 道確定性 gate 全綠。eng 覆蓋 221→233/300。
- 下一步：writing（15 KP，自評不自動批改）→ 已建未滿分區（noun/vocab/pattern/special/subj/morph…~52 KP）→ Phase 2 接線 → 全島 5-clean 收斂。

## 2026-11-02 21:26 英語島 writing W1–W3 建成（5/15 KP）＋自評產出題歸屬決策
- 新檔 english_writing.units.json：W1 copy-imitate（t_base）／W2 sentence-punctuation（sentence-making+punctuation-caps）／W3 picture-letter（picture-basic+letter-email）。writing 0→5/15 KP、3 單元。
- **設計決策（重要，非改 spec/gate）**：寫作自由產出題無唯一可驗證答案，spec §6.8.1 的 `practice[].validation_method` enum＝{exhaustive|oracle|source|expert}（無 self），question_correctness_gate 正確擋下 `validation_method:"self"`。依 spec 自評模型（rubric⑤＝單元層 selfeval 三級→SRS），把 6 個自由產出題**移出 practice[]、改成 teach 的「換你做＋範例」example 段**（R14 body 英文、zh_hint 繁中含自評指引）；客觀子技能 MCQ 留 practice[] 承載 rubric⑦。**未改 gate、未把 self 蒙混成 expert、未弱化任何規則**——gate 擋得對，調整的是內容歸屬。authoring subagent 正確拒絕作弊並如實回報，我據 spec 裁定。
- **內容親驗**：抄寫/仿寫、完整句（主詞+動詞）、大小寫標點、條列逗號、看圖寫句、email 三段格式（問候/本文/署名）皆正確；MCQ 單一正解、distractor 文本內可判定。
- 8 道確定性 gate 全綠（question_correctness 重構後 CLEAN）。eng 覆蓋 233→238/300。
- 下一步：writing t_adv W4–W8（10 KP：paragraph-structure/cohesive-devices/topic-essay/consistency/narrative/picture-narrative/expository/sentence-combining/c2e-translation/avoid-chinglish）→ 已建未滿分區 → Phase 2 接線 → 全島 5-clean 收斂。

## 2026-11-02 21:39 英語島 writing t_adv W4–W8 建成 → writing strand 15/15 KP 滿覆蓋 ✅（第四個 100% strand）
- append W4 paragraph-cohesion／W5 essay-consistency／W6 narrative-picture／W7 expository-combining／W8 c2e-naturalness（各 2 KP）。writing 5→15/15 KP、3→8 單元。
- **內容親驗**：W7 泡茶步驟順序合理、and/who 合併（which-for-person/主謂/who+she 冗餘誘答皆對）；W8 中譯英自然語序、turn on the light（正面框架道地說法非貼標籤）、Although 單連接詞；W5 時態/主謂/人稱一致；W6 敘事開頭+Finally+種子→澆水→發芽→開花順序皆正確。自由產出題在 teach「換你做」、MCQ 承載 rubric⑦（question_correctness CLEAN 無 self）。
- 8 道確定性 gate 全綠。eng 覆蓋 238→248/300。**四大技能 strand（phonics/listening/reading/writing）全 100%。**
- 下一步：已建未滿分區補滿（52 KP：noun/vocab/pattern/special/subj/morph/relcl/voice/nouncl/adjadv/modal/pron/nonfinite/prep 等）→ Phase 2 接線（roadmap_layout.json）→ 全島 5-clean 收斂 → 島 DONE-GATE。

## 2026-11-02 21:53 英語島 subj 虛擬語氣 strand 補滿 13/13 KP ✅
- 8 個新 sidecar 檔（一檔一 KP）：subjasif/subjindic/subjfuture/subjmixed/subjwouldrather/subjifonly/subjmandative/subjwithout。subj 5→13/13 KP。
- **內容親驗（虛擬語氣極易錯，逐題查）**：mandative（suggest/insist/demand that + 主詞 + 原形：attend/be/choose、否定 not be fired、arrive 不加 s）、mixed conditional（過去條件→現在結果 had+pp→would+原形；現在條件→過去結果 were→would have+pp；could get now）、would rather（他人現在→過去式 didn't talk/drove、過去遺憾 had told、同主詞原形 stay）皆文法正確。
- 7 道確定性 gate 全綠。eng 覆蓋 248→256/300。方言差異（got/gotten、were/was）一致處理、provisional 待母語 reviewer。
- 下一步：special 8／morph 7／vocab 5／noun 4／pattern 4／verb 3／voice·modal·adjadv·relcl·nouncl 各 2／pron·prep·nonfinite 各 1（共 44）→ Phase 2 接線 → 全島 5-clean 收斂。

## （補記）special strand 18/18（commit c489ec376）＋ morph strand 13/13
- special：apposition/inversion-place/ellipsis/inversion-only/inversion-so-such/what-cleft/perfect-participle/absolute-with（8 新檔）。親驗倒裝/分裂/完成分詞文法全對。
- morph：suffix-adverb-ly/compound-noun/prefix-degree/prefix-relation/latin-greek-roots/conversion/guess-by-morphology（7 新檔）。親驗字根義（port=carry/tele=far/bio=life/dict=say/graph=write）、詞類轉換、構詞猜義全對。-ly 拼寫 happy→happily/true→truly。
- 已滿 strand：phonics/listening/reading/writing/subj/special/morph。

## 英語島 vocab 32/32＋noun 10/10 補滿（9 新 sidecar）
- vocab：ceec-4500/abstract-affective/academic-topics/synonym-nuance/register（詞彙能力/策略，英文學英文）。noun：proper-capitalization/possessive/collective/double-possessive。
- 親驗：synonym 強度（enormous/delighted/tiny/big）、集合名詞 AmE 單數 is/has（英式差異 teach 誠實標）、double-possessive（a friend of mine 非 of me、of my mother's）皆正確。
- 收斂前待辦：這 9 檔省略 shadowing（依無音檔指示），--verify-golden 會判缺 shadowing，收斂階段補「無 audio 版 shadowing（text+intonation）」或走 deviation 簽核。
- 已滿 strand：phonics/listening/reading/writing/subj/special/morph/vocab/noun（9 個）。eng 271→280/300。

## 英語島 pattern 16/16＋verb 26/26 補滿（7 新 sidecar，含 text-only shadowing）
- pattern：sentence-kinds/sv-agreement/sentence-types/run-on-comma-splice。verb：past-perfect-progressive/future-perfect-progressive/tense-consistency。
- 親驗：主謂一致(walks/is/has)、run-on/comma-splice 辨識+四修法、時態一致判斷、had been/will have been+V-ing 形式皆正確。
- 已滿 strand：phonics/listening/reading/writing/subj/special/morph/vocab/noun/pattern/verb（11 個）。eng 280→287/300。剩 13（voice/modal/adjadv/relcl/nouncl 各2＋pron/prep/nonfinite 各1）。

## 2026-11-02 23:15 ★里程碑：英語島 eng 300/300 binding KP 全覆蓋達成（「先補齊」完成）
- 最後 13 KP（13 新 sidecar）：voice(nonfinite/it-is-said)、modal(probability-ladder/need-dare)、adjadv(adjective-order/comparison-ellipsis)、relcl(compound-wh-ever/quantifier-of-which)、nouncl(complement-apposition/suggest-should)、pron(quantifier-agreement)、prep(others)、nonfinite(perfect-passive)。
- 親驗：OSASCOMP 形容詞序(big red/lovely small/old blue)、it-is-said(to sing 同時/to have been stolen 完成被動)、推測階梯(must/can't/might)、need-dare(needn't+原形) 皆正確。
- **eng 全 22 strand 0 缺、300/300 binding KP 覆蓋**（build_status --domain eng 小計 300/300）。單元數 336、頁 306。
- 全程 15 個 authoring agent 分 strand 建置，我逐批親驗內容正確性＋跑確定性 gate；全部 claim provisional 待英語母語 reviewer 複核。
- **下一階段（非本「先補齊」範圍，QUEUE）**：Phase 2 接線（既有 250 communicative 單元補宣告 prerequisites／產 roadmap_layout.json）→ 全島一次一檔 content_audit 5-clean 收斂（AC-UNIT-2）→ 島 DONE-GATE（§11.A eng 子集）→ 視覺 iPad 簽核 → 里程碑上線。收斂前待辦：listening L2 prosody 真音複核、vocab/noun 9 檔補 shadowing、各 provisional claim 母語 reviewer。

## 2026-11-02 23:20 Phase 2 接線 — 分析與起步
- **結構前置已滿足**：全 336 單元都已宣告 `prerequisites[]`＋`knowledge_point_ids[]`（0 缺欄位）。其中 285 宣告 `[]`(root)、51 有實質邊（phonics/listening/reading/writing/subj/special/pattern/verb 的部分）。
- **units_index.json 不帶 prerequisites 欄**（schema：unit_id/page/title_zh/subject/strand/track/can_do/situation_group/est_minutes/teach_kp_ids/practice_kp_ids/covered_kp_ids）；AC-SCHEMA 的 prereq→unit_id 存在性＋無環由讀 sidecar 的 gate 驗。roadmap_layout 需要 prerequisites → 要麼擴 units_index、要麼 roadmap 產生器直讀 sidecar。
- **eng tier/strand**：t_base 119 / t_mid 108 / t_adv 89 / t_sub 20；22 strand（vocab 68、verb 38、pattern 29、modal 19、special 18、adjadv 15、subj/morph 13、nonfinite/relcl 12、phonics 11、conj/noun/pron 10、prep/voice 9、nouncl 8、reading/writing 9/8、advcl/listening 6、article 3）。
- **真正 Phase 2 內容工作**＝為 285 個 root 中「學習上應有前置」者補**有意義的 prerequisite 邊**（預設：同 strand 內 tier 序 t_base→t_mid→t_adv→t_sub 鏈；跨 strand 僅必要處；真入口保持 []），讓 roadmap DAG 有學習順序（否則 285 孤兒 root＝§6.1 DAG/§9.2 K_pre 閉包空洞）。prerequisites＝建議非門鎖（R-OPEN）。
- **產物**：`authoring/roadmap_layout.json`（node 座標／DAG edges／collapse-group；由 units_index＋prerequisites 預生成）＋`authoring/progkey_migration.json`（{old_progKey,new_unit_id,note} additive 遷移，舊 progKey 保留＝never-disappear）。兩檔各自 5-clean。
- **Phase 2 exit**（spec §10 line 43）：既有單元全數接線＋每檔 5 clean。
- **起步（安全、不動已 commit 檔）**：先產**唯讀 prerequisite-DAG proposal**（authoring agent 設計、tier 序鏈、無環、引真 unit_id），我 review 後逐 strand apply＋跑 unit_schema_gate（驗 prereq→unit_id 存在＋無環）＋gen_derived，分批 commit（rollback-safe）。依 SOP：authoring 用 team-of-one agent＋我獨立 review，非 solo。

## 2026-11-02 23:35 Phase 2 — roadmap_layout.json 產生器＋輸出（commit 點）
- 新 `tools/gen_roadmap_layout.py`（確定性）：從 units_index＋各 sidecar 的 prerequisites 生成 roadmap 佈局。座標模型：x 由 strand 欄位(strand.order)、y 由 tier 層(t_base→t_mid→t_adv→t_sub)，同桶單元沿 x 微展；收合群組＝每 strand 一組含 bbox。
- 輸出 `authoring/roadmap_layout.json`：eng 島 336 節點、184 先備 DAG 邊、22 收合群組。
- 內建 `--verify`（＝spec 的「連線端點檢查」gate）：endpoint 全解析、無 self-loop、Kahn 無環、群組 node_ids 皆真節點 → CLEAN。
- 仍待：viz-QA（roadmap UI 實際 render 時）＋ progkey_migration.json（需調查舊站各頁 progKey）＋ roadmap_layout/其餘各檔 5-clean。

## 2026-11-02 23:36 Phase 2 — progkey_migration.json 調查（下一步，未捏造）
- 掃描：176 個舊 .html 頁使用 **22 個頁級 progKey**（english_concepts_v1 / english_reading_v1 / biology_concepts_v1 / chinese_concepts_v1 / math(2)_concepts_v1 / geometry / linear_algebra / number_theory / physics / chemistry / earth_science / everyday_science / social / economics / finance_mindset / digital_citizen / media_ai / body_safety / self_protection / emotion_skills / thinking_traps）。
- **問題**：progKey 是**整頁共用**（concept_engine 每頁一鍵、含多 lesson），新制 learning_progress_v1 是**逐 unit_id**。`{old_progKey,new_unit_id,note}` 需「舊頁 lesson → 新 unit_id」對照才誠實，不能一鍵對一單元硬塞。
- **下一步（慎重、不捏造）**：逐一讀舊 concept 頁的 `window.CONCEPT.lessons[]` id 結構，對映到新 *.units.json 的 unit_id，產出逐 lesson 的 {old_progKey, lesson_id?, new_unit_id, note}。英語島先做（english_concepts_v1 / english_reading_v1 → eng 單元）。舊 progKey additive 保留、永不刪（§6.3/§7.1），故風險受控但映射須正確。
- **Phase 2 進度**：DAG 接線✅(c2b70082f)、roadmap_layout.json✅(4bb1b6fe2)、progkey_migration ☐(調查中)、各檔 5-clean ☐。

## 2026-11-02 23:39 progkey_migration — 補充發現＋下一 tick 精確調查步驟
- 更正：earlier 的「176 頁/22 progKey」**全在非正式目錄**（.claude/worktrees 過期副本、training/）。正式 root 頁 0 命中那 22 個 `*_concepts_v1` 字串。
- 正式站真相：55 頁 `<script src="concept_engine.js">`（舊引擎），其中 english_ 僅 10 頁；english_asas.js/english_body.js 內**無** progKey/CONCEPT 字樣 → progKey 設定位置待查（可能在 concept_engine.js 由檔名/其他推導，或新頁改用 assets/unit.js 完全不同機制）。
- **兩代引擎並存**：舊 concept_engine.js vs 新 communicative 單元 assets/unit.{css,js}（見 memory english-island-phase2-units-live）。progkey_migration 只需處理「舊 concept_engine 頁」→ 新 unit_id。
- **下一 tick 調查步驟（不捏造）**：(1) 讀 concept_engine.js 看 progKey 如何決定（參數？檔名？）；(2) 列 55 個舊 concept 頁各自 progKey 值＋其 lesson id 清單；(3) 對映到對應新 *.units.json 的 unit_id（檔名對應 english_asas.html↔english_asas.units.json 為線索但須逐一確認）；(4) 產 authoring/progkey_migration.json {old_progKey, (lesson_id), new_unit_id, note}；(5) 寫 migrate 邏輯 additive 搬入 learning_progress_v1、舊 progKey 保留（§6.3/§7.1）＋對應 RT。可委派給聚焦 agent 產提案、我驗證（比照 prerequisite DAG 流程）。
- **本 session Phase 2 已交付並 push**：prerequisite DAG 接線(c2b70082f)、roadmap_layout 產生器+輸出(4bb1b6fe2)、調查記錄(5cd942518)。剩 progkey_migration + 逐檔 5-clean 收斂。

## 2026-11-02 23:58 Phase 2 — progkey_migration.json 提案（reviewed，commit 點）
- 聚焦 agent 考古 55 個正式站 concept_engine 頁（排除 .claude/worktrees 等非正式目錄），抽各頁 window.CONCEPT.progKey/lessons→新 unit_id。我獨立複驗：46/46 new_unit_id 存在、0 缺欄位。
- **team-lead review**：3 條 topically 錯的 low-confidence stand-in（english_concepts_v1/prep→duration、questions/be_q→sentence-kinds、questions/wh→interrogative）**降級 unmapped**（additive 遷移下漏接比錯接安全）。最終 **43 entries（27 high + 16 可接受 low：代表性/合併錨點，honestly 標註）、59 unmapped**。
- **59 unmapped**：45 個非英文科 progKey（biology/chemistry/chinese×10/math×6/physics/social/finance/safety/skills…）——該科新制 units 尚未建置，待各科實作再精修；+ 11 英文 lesson（beverb/do-support 問句/時態複習/listening 具體短文等）新制無對應語法單元。
- **重要架構發現（遷移實作時必讀）**：
  1. **english_phonics/reading/writing/listening.html 磁碟上仍是舊 concept 引擎**，但 units_index 已對同 URL 指派新技能單元（phonics 11/reading 9/writing 8/listening 6）。新 units 是「技能/主題重新設計」非舊 lesson 換 id → 遷移時這 4 頁＝整頁內容被新技能單元取代（UI strangler-fig 換頁）。
  2. tenses/modals/concepts/questions/morphology/grammar_plus 6 頁在自身檔名下 0 unit，主題打散到細顆粒新頁 → 採逐 lesson 跨頁對映。
- **Phase 2 剩餘**：migrate() 邏輯（additive 把舊 progKey 進度搬進 learning_progress_v1.units[unit_id]、舊 progKey 永久保留，§6.3/§7.1）＋對應 RT；全島逐檔 content_audit 5-clean（AC-UNIT-2，一次 1 round）。
- **Phase 2 進度**：DAG✅(c2b70082f)、roadmap_layout✅(4bb1b6fe2)、progkey_migration 資料✅(本 commit)、migrate 邏輯+RT ☐、逐檔 5-clean ☐。

## 2026-11-03 00:03 Phase 2 — progkey additive 遷移實作＋紅隊（commit 點）
- 確認舊格式：`localStorage[progKey] = { lesson_id: truthy代表完成 }`（讀 concept_engine.js load/save）。
- `assets/learning_progress.js` 新增 `migrateFromProgKeys(mapping, storageObj)`：舊 lesson 完成→新 unit `recordUnit(id,{mastered:true})`（additive、mastered 單調不回退＝天然 idempotent）；**絕不刪改任何 old_progKey**（never-disappear 雙保險）；SafeStore 缺→graceful no-op；未完成/無 key/未知→跳過。頁載入時 autoMigrate 讀 window.PROGKEY_MIGRATION 自動跑一次。
- 新 `tools/gen_progkey_runtime.py`：從 authoring/progkey_migration.json 單一來源生成 `assets/progkey_migration.data.js`（window.PROGKEY_MIGRATION，43 entries）＋--verify 一致性 gate。
- 新 `tools/rt_progkey_migration.mjs` 紅隊（node＋mock localStorage＋真實 safe_store/learning_progress）：**ALL PASS** — ①完成 lesson 遷移②舊 key 原封未改③idempotent(重跑 migrated=0/alreadyDone=1、不退化)④未完成/無 key/未知不遷移⑤SafeStore 缺 no-op⑥data.js 與來源一致＋所有 new_unit_id 存在。
- class-wide 接線：**251 個正式頁**在 learning_progress.js 前插入 data.js（順序 safe_store→progkey_migration.data→learning_progress→unit.js）。排除 .claude/worktrees、training、nav_review 等非正式目錄。
- **Phase 2 進度**：DAG✅、roadmap_layout✅、progkey_migration 資料✅、migrate 邏輯+RT✅、**逐檔 content_audit 5-clean ☐（最後一大塊，一次 1 round）**。

## 2026-11-03 00:17 收斂前置 — 補建 52 個缺失單元頁（commit 點）
- **發現**：per_page_5clean_gate --verify 揭露 units_index 的 page 欄參照 52 個磁碟上不存在的頁——先補齊階段建了 KP 內容 sidecar，但對應渲染頁（HTML 殼）未建 → 單元不可達/不可 audit。52 頁＝subj 8/special 8/morph 7/vocab 5/pattern 4/noun 4/verb 3/voice·modal·nouncl·adjadv·relcl 各 2/nonfinite·prep·pron 各 1。
- 新 `tools/gen_unit_pages.py`：確定性模板實例化（內容在已 gate 的 sidecar，由 unit.js 讀 data-units 注入，非新撰內容）。範本比照 english_asas.html（含 progkey_migration.data.js 接線、asset 版本一致）；<title>/app-bar 取 sidecar title_zh 去尾括號＋strand emoji；idempotent 不覆蓋既有。
- 建 52 頁 → units_index 全 306 頁皆存在（gen_unit_pages --verify CLEAN）。per_page gate 違規從「頁不存在」轉為「無收斂 ledger」（收斂未開始的正常狀態）。
- **smoke render（iPad 1366×1024、http、puppeteer+chrome-headless-shell）**：抽 5 新頁（absolutewith/subjifonly/ceec4500/runoncomma/adjorder）全部 root 有內容、脫離「載入中」、零 JS/console error → KP sidecar 經 unit.js 正常渲染。unit_schema_gate 仍 CLEAN（頁非單元、無副作用）。
- **現況**：英語島 336 單元內容＋頁全部到位且可渲染。下一步＝逐檔 content_audit 5-clean 收斂（AC-UNIT-2，306 頁、一次 1 round，/static-doc-audit per-file＋記入 page_converge_ledger.json，由 per_page_5clean_gate 驗）＋每頁視覺 iPad 四角色簽核。

## 2026-11-03 00:26 收斂前置 — 修 per_page_5clean_gate fail-open（H-7，commit 點）
- 修 `tools/per_page_5clean_gate.py` content_sha：改綁 **HTML + data-units sidecar 聯集 sha**（原僅綁 HTML＝改 JSON 內容不重置 5-clean streak 的 fail-open）。sidecar 由頁 data-units 屬性解析；缺則退回僅綁 HTML 不崩。
- 紅隊（--selftest）：原 12 壞例全 DENY＋好例 ALLOW 不變；新增 content_sha 三紅隊（改 sidecar→指紋變、改 HTML→變、sidecar 缺→不崩）全過。記入 GATES_HOLES_LEDGER H-7。
- 修 gate 非繞過；AC-UNIT-2 收斂 ledger 現在會因內容（JSON）變動正確作廢 streak。
- **下一步**：啟動 AC-UNIT-2 逐頁 content_audit 5-clean（審對應 sidecar、一次 1 round、記 page_converge_ledger、per_page_5clean_gate 驗）＋iPad 四角色簽核。

## 2026-11-03 00:34 AC-UNIT-2 收斂 marathon 啟動＋管線證成（commit 點）
- content_audit round 1 審 english_absolutewith.units.json：confirmed=0、coverageComplete=true；L3 coverage_check PASS（116 行+anchors 核對、0 failed）→ 合法 clean round。
- 記入 `authoring/page_converge_ledger.json`：english_absolutewith.html round 1/5（content_sha=HTML+sidecar 聯集 a4d0ce44，per_page_5clean_gate 同步）。**收斂管線端到端證成**（launch→confirmed→L3→ledger，honest 記入）。
- **marathon 策略**：306 頁、一次 1 round（資源受限）。效率改**批次**：每 round 一 shard 審 ≤5 檔（合 skill shard≤5 上限），per-file streak 逐頁記、同 sha 連續 5 clean＝該頁收斂；per_page_5clean_gate 驗；內容改→sidecar sha 變→streak 作廢（H-7 已修）。consecutive rounds 變換 partition/dispute 框架。
- 進度：1/306 頁有 round 1（streak 1/5）。長尾多-session，續跑。

## 2026-11-03 00:50 ★首個完整收斂頁：english_absolutewith 5/5 clean
- content_audit rounds 1-5 全 clean（confirmed=0、coverageComplete=true、各輪 L3 coverage_check exit 0、同 sha a4d0ce44 全程未改）。每輪換 reviewer lens（correctness→對抗式→繁體/rubric⑦→MCQ整合性→逐行校對）避免橡皮圖章。
- per_page_5clean_gate evaluate_page(該頁)=PASS「連續 5 clean」。**完整 per-file 5-clean 收斂管線證成**（launch→L3→記 ledger→gate PASS）。
- 進度：1/306 頁完整收斂（AC-UNIT-2）。注意：頁 DONE-GATE 另需 iPad 四角色視覺簽核（全島後期步驟）。
- 節流：burst-cap ≤3 round/480s + 一檔一 round hook → ~1 檔/15min（5 rounds），多-session。下一檔 special/apposition。

## 2026-11-03 00:58 收斂修正 — apposition「Everest tallest→highest」
- apposition round 1 confirmed=0 但 rawCount=1：panel 4:1 裁 NOT A DEFECT 的「Mount Everest, the tallest mountain in the world」。
- **team-lead 覆寫此 close call（correctness #1）**：Everest 正確最高級＝highest（海拔最高）；tallest 口語可接受但技術上不精確（base-to-summit 冠軍為 Mauna Kea）。K-12 教材正確性至上、highest 為標準教育用語、修正零風險且不引入 scope 外內容（同一同位語、僅更精確）。
- 修 10 處一致（stem/answer/4 選項/3 distractor keys/feedback）tallest→highest；JSON 合法、MCQ answer∈options、distractor keys⊆options、unit_schema/question_correctness/簡體 gate 全綠。僅此檔含該句。
- apposition 收斂從新 sha 重跑 round 1（原未記 ledger，無 streak 損失）。

---
## RESUME（2026-11-03 10:38 台北，重開機前快照）
**現行工作：english_soneither.units.json（第 18 個收斂頁）AC-UNIT-2 5-clean 進行中。**

- HEAD=`083971f4f`。soneither 內容檔已 commit，目前 sha=`3e997d8d38d5ba2e`（teach line42＋claim c-sn-aux-match 已補「do/does/did 配附和新主詞 So do I／So does he」）。
- ledger `authoring/page_converge_ledger.json` 有**未 commit** 的 round1/round2 entry（sha 3e997d8d38d5ba2e，均 clean）。**但 round3 又抓到 2 個 confirmed，下面的修正會改檔→sha 變→streak 必須重置，故那兩筆會作廢**（重開機後先把 soneither rounds 清空重記）。

**待修（round3 learning-sequence＋parity confirmed，尚未修）：**
1. **line 8 `can_do`（major, instructional-design, owning learning 全同意）**：仍寫「助動詞要和前句動詞一致」，與修正後 teach text3/claim 矛盾；照字面套本單元例「She works hard」會推出錯形「So does I」。
   修法：改為「助動詞要和前句動詞的**種類**一致（be配be、一般動詞配do/does/did、can配can），其中 do／does／did 配附和的**新主詞**（So do I／So does he）、極性要一致、而且語序要倒裝（So do I 不是 So I do）」。
2. **line 34 首個 teach 例（minor, owning learning 判 defect；domain/english/zh 判 NOT，但引擎 confirmed）**：首例 "She works hard, and so do I." 把 works→do 的人稱對比前置於規則（teach text3）之前。
   修法：首例改用兩邊皆 do 的 "They work hard, and so do I."（line34 body＋zh_hint），並把 line36 音檔例 son_ex1 一併改成 "They work hard, and so do I." → **需用 edge-tts 重生 son_ex1.mp3**（`/Volumes/workplace/EnglishTraining/.venv/bin/python tools/gen_audio.py <manifest> --force`，voice en-US-AnaNeural）。works→does/do 對比保留在 teach text3（line42）。

**修完流程：** 5 道 pre-commit gate（json / scan_simplified / r14_body_gate / unit_schema_gate --verify / question_correctness_gate --verify）＋ audio_exist_gate → 算新 sha → ledger soneither rounds 清空＋寫 `_sha_reset_note3` → commit（含內容檔＋音檔＋ledger）→ 重跑 5-clean marathon（r1 domain→r2 MCQ→r3 learn+parity→r4 native→r5 終校），每輪 L3 exit 0、burst-cap ≤3/480s、每 tick HEARTBEAT。5/5 後 `tools/per_page_5clean_gate.py --verify`＋收斂 commit（第 18 頁）。
**之後：** special strand 餘下 sidecar（tagquestion、whatcleft、perfectpassiveinf、perfectvspast）→ 其他 strand →全島 cross-file→DONE-GATE→iPad 視覺四角色簽核→go-live→其他 7 科。約剩 288 頁 / 306。

## 2026-11-03 11:27 ★第 18 個完整收斂頁：english_soneither 5/5 clean（commit 8ce00c00e）
- 重開機後接續，soneither 共修 1 major＋5 minor 後達 5/5（sha 02b298917163a5f6）：
  - major（instructional-design）：teach/claim/can_do 補「do/does/did 配附和的新主詞（So do I／So does he）」，去規則與自例矛盾。
  - minor：P1/P2 distractor 改合填空槽的人稱誤答；首例改 "They work hard, and so do I."（兩邊皆 do、去人稱對比前置）＋重生 son_ex1.mp3；teach "agree with So/Neither + 公式"→"reply with" 去 garden-path。
- rounds 1-5 全 clean（confirmed=0、coverageComplete=true、各輪 L3 exit 0、同 sha 全程未改）；per_page_5clean_gate 通過 18/306。
- 下一檔：english_tagquestion（已啟動 round 1，task w6a7kgvdd，sha d2d5fce05f5c6cba，6 音檔齊）。special strand 餘：whatcleft、perfectpassiveinf、perfectvspast。

## 2026-11-03 13:21 台北 — special strand 收斂完成，轉入 vocab strand
- ★第 19 收斂頁：english_tagquestion 5/5（commit ae167bed2；修 round4 2 major：to check right? 非道地定義＋do/does/did 的 did 缺 worked 例）
- ★第 20 收斂頁：english_whatcleft 5/5（commit 71f3482fc；修 2：補複數 worked 例 What I need are new shoes＋claim c-wc-agree 冒號例重排貼子句）
- **special strand 18/18 全收斂**。per_page gate：通過 20/306。
- 轉入最大未收斂 strand = **vocab（68 頁，0 收斂）**。首檔 english_abstractaffective round1 進行中（sha 173702d6727afed4）。
- 整體進度：全站 KP 覆蓋 300/3086（9.7%）｜全站收斂頁 20/306（6.5%）。
- 下一 strand 佇列（未收斂頁數）：vocab 68 → verb 38 → pattern 29 → modal 19 → adjadv 14 → …（見 build_status.py）

## 2026-11-03 13:45 台北 — 新 hub 連舊頁問題 → 多單元舊頁遷移（HD 政策）
- HD 發現新 hub 點 listening 會到舊版 UI。根因：新引擎 unit.js 只渲染 units[0]，吃不下多單元 sidecar；listening/phonics/reading/writing 這 4 張是多單元舊頁。
- HD 政策：(1)舊 hub＋舊頁＋舊連結不動；(2)新 hub 只連新版頁＋新版資料；(3)新版可重用舊 material。
- 計數誠實性已驗證：20 收斂頁全新引擎、4 舊頁 0。另補 per_page_5clean_gate 守門：HTML 未載 assets/unit.js 不得算收斂（已紅隊，commit）。
- 遷移做法：每個多單元 sidecar 拆成單一單元 sidecar＋新引擎頁（重用內容），gen_derived 重彙總 units_index→hub 自動連新頁。splitter＝/tmp/split_tools/split_strand.py。
- ★listening 已遷移（6 新頁，commit）；待 HD 眼睛確認引擎合身後複製到 phonics(11)/reading(9)/writing(8)。
- 這 34 新頁之後各自走 per-file 5-clean 收斂。

## 2026-11-03 — vocab strand 首檔收斂
- `english_abstractaffective.html` 達 5/5 連續 clean（sha ab6582e67f3986ba、L3 exit 0），commit e0059885e。per_page gate 21/311。
- vocab strand：68 頁，67 未收斂、全為新引擎（無需遷移）。
- 開始下一檔 `english_academictopics.html`（sha bbb2e19eedb18aa1）round 1（領域正確性）。
- 全站：binding KP 覆蓋 300/3086（9%）；收斂頁 21/311。

## 2026-11-03 — vocab 第 2 檔收斂
- `english_academictopics.html` 達 5/5（round2 修 P1 冠詞洩答 an→the＋game→ceremony；新 sha bb85193007f5db70 從 r1 重跑；L3 exit 0）。commit e0059885e 之後數筆。per_page gate 22/311。
- 開始 vocab 第 3 檔 `english_addition.html`（base 數字加法，含 5 音檔＋dictation＋shadowing；音檔已驗存在/可解碼；sha 695b34cc0fc6f4d1）round 1。

## 2026-11-03 — 多單元舊頁→新引擎遷移完成（HD 發現新 hub 還連舊頁/無圖）
- 根因：listening/phonics/reading/writing 原為「一頁多單元」舊引擎頁，新 hub 仍連舊頁；且 listening picture_id「看圖辨義」KP 需要真的圖，新引擎只渲染文字＝名實不符。
- 處理：
  - phonics 11 → 新引擎單一單元頁（音檔 55/55 已驗）；舊 english_phonics.html 不動。
  - reading 9 → 8 新頁（factopinion-graph 需圖表，held）。
  - writing 8 → 6 新頁（picture-letter、narrative-picture 需看圖，held）。
  - listening picture_id（看圖辨義）→ held（需真的圖）。
  - 共 **4 個「看圖/圖表」單元抽到 *.heldimg.json**，不進新 hub，待建圖片/表格渲染能力。
- 驗證：新 hub units_index 332 單元，**0 舊引擎頁、0 斷連**（全 assets/unit.js 新引擎）。
- **BLOCKER（新任務）**：新引擎需新增「圖片選項／看圖寫作／資料圖表」渲染能力＋兒童安全 SVG 場景，走 authoring team＋iPad 視覺QA 四角色簽核；完成後把 4 個 held 單元遷回並 5-clean。涉及 KP：eng.t_base.listening.picture-id、eng.t_adv.reading.factopinion-graph、eng.t_mid.writing.picture-letter、eng.t_adv.writing.narrative-picture。
- 每個新遷移頁仍須各自走 5-clean 才算 converged（內容沿用舊 material，等同起點）。

## 2026-11-03 — vocab 第 3 檔收斂
- `english_addition.html` 達 5/5（round2 修長度 cue one→four、round1 修 P5 feedback 幻影 one→補 four；sha 75b34477a295070b；5 音檔已驗）。per_page gate 23/332。
- 開始 vocab 第 4 檔 `english_age.html`（說幾歲，3 KP：question-order/verb.be/numbers，6 音檔已驗；sha fdf961e465f75ee7）round 1。

## 2026-11-03 — vocab 第 4 檔收斂
- `english_age.html` 達 5/5（round4 修 reuse_pages 補 greetings；sha 51dbb8a70f3f19e2；6 音檔已驗）。per_page gate 24/332。

## 2026-11-03 — vocab 第 5 檔收斂
- `english_atplace.html` 達 5/5（I'm at the + place；sha c5f712ab37117fb9；5 音檔已驗；無修正，一次過）。per_page gate 25/332。

## 2026-11-09 03:17 — reading_title_purpose 5/5 收斂（第 277 收斂頁）
- english_reading_title_purpose.html 達 5/5 連續 clean（sha a99cdbede9d51525、各輪 L3 exit 0）。
- Phase-1 修 stale _note；round1 harvest 修 example 誤把離題標題標成 too-narrow；rounds2+3 unanimous panel 再抓 teach/claim cue 'you should' 不在短文（短文用 'We should all try'）→ 對齊 cue 為 'we should'/'you should'/'please'；並清 pedagogy length-cue（R4-purpose-action 正解 17→8 字平行誘答）。
- round4 'too wide' vs 'too broad' 風格建議經 panel 0/5 判 NOT-A-DEFECT（wide↔narrow 正當反義對），未改。
- DONE-GATE：scan_simplified/unit_schema/question_correctness/audio_exist/per_page_5clean(target absent)/pedagogy(0 hits) 全綠；source_tree 收斂 276→277/332（83.4%）、未收斂 55。

## 2026-11-09 03:31 — reading_tone_inference 5/5 收斂（第 278 收斂頁）
- english_reading_tone_inference.html 達 5/5 連續 clean（sha 3b3e33c9c136f1c5、各輪 L3 exit 0）。
- Phase-1 僅修 stale _note（原描述一頁多單元 3×t_mid main-idea/guess-word/functional）→ 改為實際單一 t_adv 單元 tone-inference ＋ 2 KP（attitude-tone＋inference）；內容（公園短文、態度題、證據題、推論題）親驗正確、單一可辯護答案、pedagogy 無 length-cue。
- rounds 1–5 全程 0 confirmed（round4 raw=0）；DONE-GATE scan/unit_schema/question_correctness/audio_exist/per_page(absent)/pedagogy(0) 全綠；source_tree 收斂 277→278/332（83.7%）、未收斂 54。

## 2026-11-09 03:57 — reading_word_reference 5/5 收斂（第 279 收斂頁）★reading strand 9/9 全收斂
- english_reading_word_reference.html 達 5/5 連續 clean（sha d467f23b48370144、各輪 L3 exit 0）。
- Phase-1 修 stale _note（原描述一頁多單元 3×t_mid）→ 實際單一 t_mid 單元 word-reference ＋ 2 KP（guess-word＋reference）。
- round3 抓 1 unanimous readability 缺陷：R2-ref-he 'Tom' 誘答理由 '後面才出現' 兩讀其一為假（Tom 於短文首句即出現）→ 改 '（第一句就提到）…他後來安撫 Rocky，躲起來的不是他'；sha 1c04…→d467…、streak 重置重跑 5 clean。
- DONE-GATE scan/unit_schema/question_correctness/audio_exist/per_page(absent)/pedagogy(0) 全綠；source_tree 收斂 278→279/332（84.0%）、未收斂 53。
- **reading strand 全 9 檔收斂**（main-detail/word-reference/functional-skim/cloze-gap/main-detail…/title-purpose/tone-inference/structure-cohesion/multitext-ordering）。

## 2026-11-09 04:44 — reciprocalpron 5/5 收斂（第 280 收斂頁）
- english_reciprocalpron.html 達 5/5 連續 clean（sha c695bc8f294d9e95、各輪 L3 exit 0）。
- Phase-1 無修（內容正確）；惟 content_audit 兩輪分別以 owning learning-neuroscience lens 判出同一 recall-vs-transfer 設計債：P2（重用 teach 例 friends/borrowed/books）→改 students/corrected/essays；P3（重用 teach ex1 傳球情境）→改 neighbors/wave；並主動修 P1（原逐字＝claim c-rc-mutual 例 Tom/Amy/love）→Ben/Mia/trust。三處練習改 fresh context 測遷移非記憶。
- DONE-GATE scan/unit_schema/question_correctness/audio_exist/per_page(absent)/pedagogy(0) 全綠；source_tree 收斂 279→280/332（84.3%）、未收斂 52。
- 經驗（banked）：batch 建的文法 pron 檔常把 practice 情境直接沿用 teach 例句（recall-not-transfer），content_audit owning-lens 會判缺陷；下一檔 Phase-1 應主動掃 practice↔teach/claim 例句重疊。

## 2026-11-09 05:03 — reflexive 5/5 收斂（第 281 收斂頁）
- english_reflexive.html 達 5/5 連續 clean（sha 740f617c05770ee0、各輪 L3 exit 0）。
- Phase-1 主動修 3 處 practice recall→transfer（P2 She looked at herself→She introduced herself；P3 brother tie shoes by himself→Danny fixed his bike by himself；P4 enjoy oneself→behave themselves）。
- round1 抓 1 unanimous 缺陷：P6 聽寫答案用未教的強調反身 "made one herself"（與教過的 by+reflexive=alone 歧義、feedback 又當同句型）→改 "made one by herself"（教過句型）＋重生 rf_dict1.mp3；sha 4568…→740f…、streak 重置重跑 5 clean。
- DONE-GATE scan/unit_schema/question_correctness/audio_exist/per_page(absent)/pedagogy(0) 全綠；source_tree 收斂 280→281/332（84.6%）、未收斂 51。

## eng-regularplural（規則複數）5/5 收斂 — 2026-11-09
- 單元 eng.t_base.noun.regular-plural（規則複數：+s / -es(s/ss/sh/ch/x) / 子音+y→-ies / 母音+y→+s / -f·fe→-ves）。
- frozen_sha 7bcc3ea5b7aa60cd；rounds 2–6 連 5 clean（L3 exit 0）。
- Phase-1 修 2 defect：claim c-rpl-es「-ch /k/」措辭 grammaticality（sounded→pronounced with a /k/ sound）；去 imprecise jargon「齒擦音」→plain「s、ss、sh、ch、x 結尾」（verification_ref＋P1/P5 distractors）。
- DONE-GATE：scan_simplified PASS／unit_schema CLEAN／question_correctness CLEAN／audio_exist CLEAN／per_page_5clean 本頁 absent from violations／pedagogy 0 hits／build_source_tree 收斂 282/332。
- eng 281→282。下一檔：english_runoncomma。

## eng-runoncomma（連寫句與逗號接合）5/5 收斂 — 2026-11-09
- 單元 eng.t_adv.pattern.run-on-comma-splice（辨識連寫句/逗號接合＋四種修法：句號/分號/逗號+FANBOYS/從屬連接詞）。
- frozen_sha 687759b1bbc8042a；rounds 1–5 連 5 clean（L3 exit 0）。
- Phase-1：內容文法經對抗式複核正確；RO2/RO3 freshen 成 teach 外新語境（The movie ended…／She was hungry…）避免 recall-not-transfer（學習神經科學鏡）。RO1/RO4/RO5/RO6 本已用新句、不動。
- DONE-GATE：scan_simplified PASS／unit_schema CLEAN／question_correctness CLEAN／audio_exist CLEAN／per_page 本頁 absent／pedagogy 0 hits／build_source_tree 收斂 283/332。
- eng 282→283。下一檔：english_sameplural。

## eng-sameplural（單複同形 sheep/deer/fish）5/5 收斂 — 2026-11-09
- 單元 eng.t_mid.noun.same-form-plural（sheep/deer/fish 單複同形不加 -s；動詞隨語意單複數）。
- frozen_sha e85c82fce5ae6fc0；rounds 1–5 連 5 clean（L3 exit 0）。
- 本檔 5 次重置、6 個 panel-confirmed defect（皆真缺陷，逐一修）：P6 dictation 與 teach 逐字重複（recall）→改 Three fish are swimming near the rocks.+regen sfp_dict1.mp3；teach「three most common」無據最高級→Three common examples；P5「ten deer」逐字＋P3「in the bowl」context recall＋主動修 P2「eating grass」→P2 drinking at the pond／P3 hiding under the plant／P5 six deer；P5「a deer」distractor 殘留十隻（改 six 時漏改）→六隻；teach「some」誤歸 large number/很多→脫鉤數量、改 more than one/不只一個。
- DONE-GATE：scan_simplified PASS／unit_schema CLEAN／question_correctness CLEAN／audio_exist CLEAN／per_page 本頁 absent／pedagogy 0 hits／build_source_tree 收斂 284/332。
- eng 283→284。下一檔：english_seeyou。
- 教訓：grammar drill Phase-1 必逐題比對 teach collocation（數字+名詞、名詞+情境）；改數字須連 distractor 一起改；聽寫答案也要 teach 外新句；查無據最高級／量詞語義。

## eng-seeyou（說再見·約下次見）5/5 收斂 — 2026-11-09
- 單元 eng.t_base.pattern.goodbye（Goodbye/Bye 一般道別；See you + 時間：tomorrow/later/on Monday/next week）。
- frozen_sha 831d193155af51a9；rounds 1–5 連 5 clean（L3 exit 0）。
- Phase-1：內容正確（See you+時間 四框架以情境錨定唯一正解、避第二正解，為正當設計）；P4 dictation「See you tomorrow.」與 teach ex1＋shadowing sh1 逐字→改 teach 外新組合「Bye. See you next week.」+regen bye_dict_01.mp3。MCQ 四時間 taxonomy 選項不動。
- DONE-GATE：scan_simplified PASS／unit_schema CLEAN／question_correctness CLEAN／audio_exist CLEAN／per_page 本頁 absent／pedagogy 0 hits／build_source_tree 收斂 285/332。
- eng 284→285。

## eng-sentencekinds（句子的四種種類）5/5 收斂 — 2026-11-09
- sha e5c2052abd6585fe，L3 exit 0，DONE-GATE 七關全綠（simplified/unit_schema/question_correctness/audio_exist/per_page_5clean/pedagogy/build_source_tree）
- 收斂 285→286/332（86.1%）
- 修正軌跡（同一缺陷類「祈使句/感嘆句規則絕對化 vs teach『可省/可前置』」，分批被不同分片 panel 抓出，共 5 處）：
  (1) SK6 distractor+feedback「Please pass 以動詞原形開頭」→核心動詞原形 pass(please 可前置)
  (2) SK4「What a」distractor 形容詞必需→名詞片語(形容詞可省,如 What a surprise!)
  (3) can_do/_note/祈使句 verification_ref「動詞原形開頭」→核心動詞原形(可加 please)
  (4) SK2 stem 一般定義「以動詞原形開頭」→核心動詞原形(可加 please)
- 教訓（已內化）：祈使句的「一般定義」(can_do/claim/teach/stem 括號) 必須與「可加 please」一致；只有描述具體正解句的 feedback 可說「X 開頭」。先前誤判 SK2 stem 可保留，被 panel 推翻。
- commits: 6d7c3ea7f / 362875c54 / d93f534ec / 93175229b

## eng-sentencetypes（句型辨識 簡單句/合句/複句/複合句）5/5 收斂 — 2026-11-09
- sha d9ebebfcc0634604，L3 exit 0，DONE-GATE 七關全綠（含 pedagogy 0 hits）
- 收斂 286→287/332（86.4%）
- 修正軌跡：
  (1) Phase-1 freshen recall-not-transfer：ST2 正解原與 teach 合句例句逐字相同、ST1 近 teach 簡單句例句→改 teach 外情境（文法不變、minimal-pair 保留）
  (2) round5 content panel（minor）：c-st-compound 例句接在「or with a semicolon:」後卻示範逗號+but→重寫為兩法各附例句（逗號+but／分號）
  (3) DONE-GATE pedagogy_gate（content panel 漏抓）：ST3 正解「複句（含一個從屬子句）」帶括號補述屬 length/detail-cue→四選項平行去括號
- 教訓（已內化）：content_audit 5-clean ≠ 完工；DONE-GATE deterministic pedagogy_gate 仍會抓 content panel 漏的 length-cue，收斂後必跑全 gate 再 commit。
- commits: e3d01c9e8 / b8d78bfb6 / 9fc9db545

## eng-shallwouldlike（Shall I/we…? 與 would like）5/5 收斂 — 2026-11-09
- sha 7f71c4c7fd7d097b，L3 exit 0，DONE-GATE 七關全綠（含 pedagogy 0 hits）
- 收斂 287→288/332（86.7%）
- 修正軌跡：
  (1) Phase-1 freshen：P6 dictation「Shall we start the game now?」近乎重複 teach「Shall we start now?」→「Shall we visit the museum this weekend?」＋重產 swl_dict1.mp3
  (2) DONE-GATE pedagogy_gate：P3-meaning 正解「我想要一杯水（客氣的說法）」括號補述屬 length/detail-cue→去括號（客氣 nuance 留 feedback）
- commits: 74a320390 / a110833a4

## eng-shopping（買東西 this/that・Do you have・try on）5/5 收斂 — 2026-11-09
- sha db273974d7e3ab52，L3 exit 0，DONE-GATE 七關全綠
- 收斂 288→289/332（87.0%）
- 修正軌跡：
  (1) Phase-1 freshen：P5 dictation「Can I try this on?」逐字等於 teach ex3/P4/shadowing→「How much are those?」＋重產 shop_dict_01.mp3
  (2) round1 content panel（major）：shop_ex1 zh_hint 孤立全形括號「我喜歡那一個）」+ 首句 How much is this? 中譯缺漏→（多少錢？／我喜歡那一個）括號平衡雙句翻譯
  (3) DONE-GATE question_correctness（我 Phase-1 自引入）：P5 kp_ids 含 question-order 但 required_kp_ids 只 demonstrative→required 補 question-order
- 教訓→寫入記憶 phase1-prefreeze-gates：Phase-1 凍 sha 前跑 deterministic gate 預檢（simplified+unit_schema+question_correctness+pedagogy），避免 DONE-GATE 末段才爆白跑 5 輪
- commits: 5bcb77f38 / b25c8b611 / 19b2ced0a

## eng-timegreet（依時段打招呼 Good morning/afternoon/evening/night）5/5 收斂 — 2026-11-09
- 單元 eng.t_base.pattern.time-greetings（依時段問候：早上 Good morning／下午 Good afternoon／傍晚見面 Good evening／睡覺前 Good night）。
- frozen_sha 3e03f56fcfe98252；rounds 1–5 連 5 clean（L3 exit 0），各輪不同對抗 framing（r1 全面／r2 嘗試構造第二正解／r3 中文對照審查／r4 教學+道地性／r5 最終全維度複核）。
- 修 1 defect（r1 minor，panel 全票）：claim c-greet-words 含 PRC 詞「早上好」（台灣用「早安」，違 R2）→刪「早上好/」只留「早安」；scan_simplified 複檢清零。
- 設計要點（經對抗複核站得住）：Good evening 與 Good night 中文都是「晚安」＝第二正解風險，單元以『情境錨定』每題鎖唯一正解（早上到校／下午遇鄰居／睡覺前／傍晚到朋友家見爸媽／早上起床）；P1 與 P6 皆 Good morning. 但情境不同（到校 vs 起床），非重複。
- DONE-GATE 七關：scan_simplified PASS／unit_schema CLEAN／question_correctness CLEAN／audio_exist CLEAN（含 tg_ 音檔）／per_page_5clean 本頁 absent from violations／pedagogy 0 hits／build_source_tree 收斂 302/332（91.0%）。
- eng 301→302。下一檔：english_tooenough。

## eng-tooenough（too…to／enough to／so…that／such…that）5/5 收斂 — 2026-11-09
- 單元 eng.t_mid.adjadv.too-enough-so-such（程度與結果四結構＋so/such、so/too 辨析）。
- frozen_sha 32b7e0da5857078c；rounds 1–5 連 5 clean（L3 exit 0）。
- 修 3 個 recall-not-transfer（分兩批被不同 framing 抓出，最後完整 harvest 四題）：
  - P4（major）整句複製 teach「It was such a good film that we watched it twice」→改「such an exciting game that the whole town came to watch」新情境
  - P3（minor，learning 鏡 owns b）近乎複製 teach ex2「He ran so fast that no one could catch him」→改「She spoke so quietly that we could not hear her」
  - P1（major）整句複製 teach-text「The coffee is too hot to drink」→改「The box was too heavy to lift by myself」；併同 harvest P2「tall enough to reach」（複製 teach-text）→改「The water in the pool was warm enough to swim in」
  - 兩次晚修皆設 harvest_override 留漂移痕跡、sha 兩度重置（9dabe05e→a615ec4e→32b7e0da）、streak 重跑；五題全對 teach 例句脫鉤。
- DONE-GATE 七關：scan_simplified PASS／unit_schema CLEAN／question_correctness CLEAN／audio_exist CLEAN（toe_）／per_page 本頁 absent／pedagogy 0 hits／build_source_tree 收斂 303/332（91.3%）。
- eng 302→303。下一檔：english_twoobjects。
- 教訓（已內化）：grammar 單元 harvest 階段必須一次把**全部** practice 題對**所有** teach 例句/片語（含 teach-text 內嵌短語如 tall enough to reach）掃完；find-one-fix-one 會多次 reset 浪費輪次。

## eng-twoobjects（句型四 S+V+O+O 授與雙受詞）5/5 收斂 — 2026-11-09
- 單元 eng.t_mid.pattern.svoo（間接受詞人在前、直接受詞物在後；改寫 to-動詞 give/send/show/lend/tell/teach vs for-動詞 buy/make/get/cook）。
- frozen_sha aa2b9791de780f7d；rounds 1–5 連 5 clean（L3 exit 0）。
- 修 2 defect：
  - harvest（凍結前自掃）P4「He sent me a postcard」近乎複製 teach ex2「He sent his friend a postcard」→改「She lent me her umbrella.」（lend 在授與動詞表但 teach 無例句、全新情境）
  - r3（clean 輪，設 override 留痕）teach「How do you choose to or for?」garden-path（未加引號的 to 先讀成不定詞 choose to…）→改「When do you use to, and when do you use for?」；sha 6173420105→aa2b9791、streak 重跑
- DONE-GATE 七關全綠（scan_simplified／unit_schema／question_correctness／audio_exist two_／per_page absent／pedagogy 0／build_source_tree 304/332=91.6%）。
- eng 303→304。下一檔：english_uncountable。
- 教訓：mentioned 功能詞（to/for）在選擇問句要加引號或「between X and Y」避免 garden-path；harvest 也要掃 teach 內嵌的「選擇式提問」句型。

## eng-uncountable（不可數名詞 water／information／advice）5/5 收斂 — 2026-11-09
- 單元 eng.t_mid.noun.uncountable（不可數名詞無 -s、不配 a/an、配 much/some/a little/a lot of 不配 many/a few、動詞單數、計量用單位詞 a piece/glass/slice/sheet of）。
- frozen_sha 8dc39d5baee8a390；rounds 1–5 連 5 clean（L3 exit 0）。
- 修 1 defect：harvest（凍結前自掃）P1「I need some information about the schedule」近乎複製 teach ex1「I need some information about the trip.」→改「The guide has some information about the museum.」（全新主詞/情境）。P4 單位詞題、P6 dictation 重用為合理（非 recall）。
- DONE-GATE 七關全綠（scan_simplified／unit_schema／question_correctness／audio_exist unc_／per_page absent／pedagogy 0／build_source_tree 305/332=91.9%）。
- eng 304→305。下一檔：english_usedtofamily。

## eng-usedtofamily（used to／be used to／get used to 辨析）5/5 收斂 — 2026-11-10
- 單元 eng.t_adv.verb.used-to-family（used to+原形＝過去習慣；be/get used to+名詞/V-ing＝已/逐漸習慣，to 為介系詞）。
- frozen_sha 6c716418e83bd8cf；rounds 1–5 連 5 clean（L3 exit 0）。
- 修 1 defect：harvest（凍結前自掃）P6 dictation「It took me a while to get used to driving on the left.」＝teach ex3 逐字完全相同→改「We soon got used to living in a smaller house.」＋用 gen_audio.py 重產 uto_dict1.mp3（童聲 en-US-AnaNeural，24KB 合法 mp3）。
- DONE-GATE 七關全綠（scan_simplified／unit_schema／question_correctness／audio_exist uto_／per_page absent／pedagogy 0／build_source_tree 306/332=92.2%）。
- eng 305→306。下一檔：english_verbinf。
- 教訓：dictation 答案若與 teach 例句「逐字完全相同」即使是聽寫也屬 recall 風險，harvest 階段應改句並重產音檔（gen_audio.py 單檔 manifest + --force）。

## eng-verbinf（接不定詞的動詞 verb + to-infinitive）5/5 收斂 — 2026-11-10
- 單元 eng.t_mid.nonfinite.verb-plus-infinitive（want/hope/decide/promise/plan/agree/refuse/need 後接 to+原形；不接 -ing；否定 not to V）。
- frozen_sha 3489717dcf1534c3；rounds 1–5 連 5 clean（L3 exit 0）。
- 修 1 defect：harvest（凍結前自掃）P4「promised to finish his homework」與 teach ex2「promised to do her homework」主題重疊（promise+homework）→改「promised to water the plants while his neighbor was on vacation」（全新情境）。P6 dictation 重用 ex1 的 want-to/hope-to 複合框架但內容全異（piano/song），屬可接受 dictation 框架重用。
- DONE-GATE 七關全綠（scan_simplified／unit_schema／question_correctness／audio_exist vbi_／per_page absent／pedagogy 0／build_source_tree 307/332=92.5%）。
- eng 306→307。下一檔：english_vgerund。

## eng-vgerund（接動名詞的動詞 enjoy/finish/mind/avoid/keep）5/5 收斂 — 2026-11-10
- frozen_sha: 6f0a9a9bcbe0f0b9；rounds 1–5 全 clean（confirmed 0、coverageComplete true、L3 rc=0）。
- lenses: native-ESL-grammar / skeptical-native-examiner / translator-learnneuro / fresh-adversarial-rationales / final-pass-child-ed。
- 修正：P1 自行 harvest — 「I enjoy reading comic books on weekends」→「I enjoy taking photos whenever I travel」（脫離 teach text 逐字片語 "I enjoy reading"，避 recall-not-transfer）。
- knownFP 記錄：P3/P4 答案句與 claim metadata (c-vg-mind/c-vg-avoid) 逐字相同，但 learner-facing teach 用不同動詞（opening the window / avoid eating sugar）→ transfer 非 recall；P6 dictation「Would you mind closing the window?」為 P3 動詞+teach 名詞新組合 → 非逐字 recall。
- DONE-GATE 七關全綠：scan_simplified PASS / unit_schema CLEAN / question_correctness CLEAN / audio_exist CLEAN(1544) / per_page_5clean vgerund ABSENT / pedagogy vgerund ABSENT / build_source_tree 收斂 308/332（92.8%）。
- 下一檔（字母序）：english_voicebasic。

## eng-voicebasic（被動語態構成 be + 過去分詞）5/5 收斂 — 2026-11-10
- frozen_sha: e65dfd38a05f988a；rounds 1–5 全 clean（confirmed 0、coverageComplete true、L3 rc=0）。round 1 初版（sha b0ed7aab5c0d31a8）found 1 minor metadata DEFECT → 修 _note 後重凍 sha。
- lenses: native-ESL-passive / skeptical-native-examiner / translator-learnneuro / fresh-adversarial-rationales / final-pass-child-ed。
- 修正：
  - P1 harvest：letter+written（近似 teach text「The letter was written yesterday」）→「The picture was drawn by a famous artist long ago」（drawn，脫離 teach）。
  - P2 harvest：答案句「English is spoken in many countries.」＝ ex2 **逐字** recall → 「Many new houses are built near the river every year」（are built，兼考複數 are agreement）。
  - P6 dictation harvest：「The cake was made by my mother yesterday」≈ ex1/teach 逐字 → 「Breakfast was cooked by my father this morning」＋重產 vbs_dict1.mp3（22KB 合法）。
  - _note：移除不存在的誘答分類「過去分詞拼錯」（round-1 metadata-accuracy DEFECT）→「過去分詞用錯形式（過去式／原形／進行式）」。
- 審閱備註（非 blocker）：pedagogy_gate 對 c-vb-by（by+動作者可選）出 parity-advisory（不計 exit）；by-optionality 已在 teach（P3 區塊＋ex3）充分教、by+doer 已在 P1/P4/P6 答案句產出、P3 答案省略 by，練習已涵蓋，5 輪 panel 全程未判缺陷 → 非真 gap。
- DONE-GATE 七關：scan PASS / schema CLEAN / qc CLEAN / audio CLEAN(1544) / per_page voicebasic ABSENT / pedagogy voicebasic 僅 non-hard advisory / build_source_tree 收斂 309/332（93.1%）。
- 下一檔（字母序）：english_voicebyagent。

## eng-voicebyagent（被動語態 by 片語與施事者省略）5/5 收斂 — 2026-11-10
- frozen_sha: d8b5ba10012d5162；rounds 1–5 全 clean（confirmed 0、coverageComplete true、L3 rc=0）。
- 收斂前共修三輪 defect（每次改內容→sha 重凍→streak 歸零重跑）：
  1. harvest P6 dictation「homework was checked by the teacher this morning」＝teach text 逐字 → 「The new library was opened by the mayor last week」＋重產 vba_dict1.mp3。
  2. round1 major（instructional-design）：P4 考 by-vs-with（工具用 with）但 teach 未教 → 補 with-vs-by teach 行（scissors 例）＋新增 claim c-vba-with＋P4 answer_evidence 補 c-vba-with。
  3. **contested-attribution 當事實（blocker/minor，連兩處）**：claim c-vba-form「America was discovered by Columbus」（歐洲中心）→「Hamlet was written by Shakespeare」；ex3 learner-facing＋claim c-vba-keep「The telephone was invented by Alexander Graham Bell」（Meucci/Gray 爭議，US House Res.269/2002）→「The Starry Night was painted by Vincent van Gogh」＋重產 vba_ex3.mp3。
- **缺陷類（banked，後續檔預防）：example 句用「發現/發明」歸於單一人並當事實＝contested-attribution 違 R1。改用無爭議的「著作/畫作＋作者」（Hamlet/Shakespeare、Mona Lisa/da Vinci、Starry Night/van Gogh）。**
- DONE-GATE 七關：scan PASS / schema CLEAN / qc CLEAN / audio CLEAN(1544) / per_page voicebyagent ABSENT / pedagogy voicebyagent ABSENT / build_source_tree 收斂 310/332（93.4%）。
- 下一檔（字母序）：english_voiceditrans。

## eng-voiceditrans（授與動詞雙受詞的被動 I was given a book）5/5 收斂 — 2026-11-10
- frozen_sha: 1f44e3bff13f0bc3；rounds 1–5 全 clean（confirmed 0、coverageComplete true、L3 rc=0）。
- 收斂前共修三輪（每次改→sha 重凍→streak 歸零重跑）：
  1. harvest：P3「A book was given to me」＝ex2/teach text 逐字 → 「A postcard was sent to my grandmother」；P6 dictation「I was given a book by my teacher」＝ex1 逐字 → 「My sister was given a bike for her birthday」＋重產 vdt_dict1.mp3。
  2. round3 兩處 zh naturalness DEFECT：非道地「被…給」翻譯腔 gloss（ex1 line86「我被老師給了一本書」、teach line94／ex2 line103「一本書被給了我」）→ 道地繁中（老師給了我一本書／有人給了我一本書）。
  3. **DONE-GATE pedagogy hard length-cue**：P5-meaning 正解最長且唯一帶括號補述（詳細度 cue）→ 正解去括號、四選項等長。**教訓：凍 sha 前必跑 pedagogy_gate＋mcq_length_cue（deterministic，content_audit panel 不查），否則拖到 DONE-GATE 才爆、白跑 5 輪。見 [[phase1-prefreeze-gates]]。**
- DONE-GATE 七關：scan PASS / schema CLEAN / qc CLEAN / audio CLEAN / per_page voiceditrans ABSENT / pedagogy voiceditrans 無 hard hit（僅 c-vd-two-obj foundational parity-advisory，非 hard）/ build_source_tree 收斂 311/332（93.7%）。
- 下一檔（字母序）：english_voicemodal。

## eng-voicemodal（情態助動詞被動 modal + be + 過去分詞）5/5 收斂 — 2026-11-10
- frozen_sha: e3dcaf975488b90c；rounds 1–5 全 clean（confirmed 0、coverageComplete true、L3 rc=0）。零 defect 迴圈（pre-freeze 已先清）。
- 修正：harvest P3「Plastic bottles should be recycled, not thrown away」≈ teach ex3「Glass bottles should be recycled...must not be thrown」近複（只換 Glass→Plastic）→「The classroom door should be locked after school, not left open」。
- **本檔起採強化 pre-freeze：併跑 pedagogy_gate＋mcq_length_cue（deterministic），凍前即確認無 hard hit → 收斂迴圈零 defect、不再拖到 DONE-GATE 才爆。見 [[phase1-prefreeze-gates]]。**
- knownFP：P2「thousands of stars can be seen」與 claim c-vm-can-could metadata 逐字同，但 learner-facing ex2 用 city/mountains → transfer；主動型誘答（must finish/can see/should lock）是「主詞為承受者」故意錯項、非缺陷。
- DONE-GATE 七關：scan PASS / schema CLEAN / qc CLEAN / audio CLEAN / per_page voicemodal ABSENT / pedagogy voicemodal 無 hard hit / build_source_tree 收斂 312/332（94.0%）。
- 下一檔（字母序）：english_voicenonfinite。

## eng-voicenonfinite（非限定被動：被動不定詞/need+V-ing/使役 have sth done/被動動名詞）5/5 收斂 — 2026-11-10 03:59
- sha a9615f934fb441a0；DONE-GATE 七關全綠（scan_simplified / unit_schema / question_correctness / audio_exist / per_page_5clean[voicenonfinite ABSENT] / pedagogy[no hard] / build_source_tree）。
- 收斂過程修正（多輪對抗式 panel）：P1-P4 harvest 脫 teach；P5 bare-noun repair 兩解歧義＋P2 虛構語意 rationale；P3 recall-not-transfer（Nobody likes being→She can't stand）；P3 to-blame rationale「喜歡」與 can't stand 矛盾；被+結果/趨向補語翻譯腔 sweep（修好/洗好/填好/交出去/需要被洗-修-修理）；使役「在」語序（請人在粉刷→正在請人粉刷）；'want' 跨卡 verb-list 不一致→移除；'seem' 未舉例 loose end→移除；R14 teach-parity：補被動動名詞英文規則 text 項。
- 收斂 313/332（94.3%）。
