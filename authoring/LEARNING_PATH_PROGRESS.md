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
   **nav_gate.mjs 真實狀態（更正）**：AC-NAV 的 `--phase=1` 顯示 `exit=2` 是**『存在但 mis-invoke』非『工具未建』**（我先前誤判為未建而派 builder 重寫，險些 merge 掉 R-OPEN／ND≤15 檢查——builder 誠實揪出、已還原）。真實 gap＝舊 gate 需外部 `NAV_TARGET` server 且無 `--verify` 入口（registry 呼 `--verify` 故 exit2）。**reconcile 待辦（紅隊）**：把 builder 新版的 `--verify`＋自管 server＋DATA↔DOM 併入既有 gate、**保留 R-OPEN／R14**、並將 ND `visible≤15` 與 HD 認可的 CATMAP 首屏自動展開**對帳**（展開那一島為認可例外、cap 套在收合島集；證壞案例擋、CATMAP 放行），不可直接刪也不可讓它誤擋。
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
