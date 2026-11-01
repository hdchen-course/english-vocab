# 學習路徑重構 — 實作進度記錄（LIVE，跨 session resume）

> 本檔＝**實作進度的詳實流水帳**（HD 2026-11-01 要求：進度詳實記錄、跨 session 可續做）。
> **規範唯一來源仍是 `LEARNING_PATH_REBUILD_SPEC.md`**（本檔不具 normative 力，衝突以 spec 為準）。
> 每完成一個可 rollback 的步驟就 commit（pathspec）＋push，並在此追加一列。最新在最上。

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
