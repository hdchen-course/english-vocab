# 學習路徑重構 — 實作進度記錄（LIVE，跨 session resume）

> 本檔＝**實作進度的詳實流水帳**（HD 2026-11-01 要求：進度詳實記錄、跨 session 可續做）。
> **規範唯一來源仍是 `LEARNING_PATH_REBUILD_SPEC.md`**（本檔不具 normative 力，衝突以 spec 為準）。
> 每完成一個可 rollback 的步驟就 commit（pathspec）＋push，並在此追加一列。最新在最上。

## 當前狀態（更新：2026-11-01 17:13 台北）
- **Phase**：spec 已定案（`spec_converge_gate --verify-ledger` PASS、sha `eec6da8c434a4a26`、binding 3079 全覆蓋、CONTRACT FREEZE ACCEPTED）→ **實作 Phase 0.5/1 進行中**。
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
5. ✅ Phase 2 §6.3 進度接線完成（cd784ffcc）：hub 顯示真實進度、單元記錄 learning_progress_v1。剩：壞檔唯讀解除 UI 入口（§6.3 要求4）。**progKey 遷移＝N/A**：rg 全站查無舊 per-頁進度鍵（concepts_v1/progKey/_progress_v1），英語島單元為新、只用 learning_progress_v1，故無遷移工作（不杜撰）。
6. 部署側 TODO（§6.7，需 CI/host 基礎設施）：`release_snapshot_on_ship_gate`／deploy-side append-only release ledger／`reward_baseline_rewrite_gate`。
7. 續 Phase 1→2→3→4→5 至 §11.A 23 條 AC 全綠（DONE-GATE）。

## 變更流水帳（最新在上）
| 時間(台北) | commit | 內容 |
|---|---|---|
| 2026-11-01 19:05 | `cd784ffcc` | Phase 2 §6.3：英語島 100 單元接 learning_progress_v1（assets/learning_progress.js＋unit.js hook＋hub 真實進度＋100 html script）；never-disappear RT abcd＋hub/單元 render 全綠 |
| 2026-11-01 18:48 | `(unit_schema_gate)` | Phase 1 AC-SCHEMA unit gate（§6.2 schema＋unit_id 全域唯一＋KP 參照完整性第5斷言）；現況 100 單元/185 KP refs 全綠 |
| 2026-11-01 18:13 | `b9f475664` | Phase 0.5(b) 修 game_core §7.1 壞檔覆寫（readRawLS/backupCorrupt/saveNow 唯讀守衛/isReadOnly API）；三個 never-disappear 缺口全畢 |
| 2026-11-01 18:00 | `37e20d9ac` | Phase 0.5(b) 修 game_core 2 缺口（mascot 殘留清除＋schemaVersion→2 migrate；spendCoins ownedItems catalog 守衛）；provenance gate 3→0 |
| 2026-11-01 17:24 | `1963295b4` | §6.7 provenance 掃描 gate（RT-14/15）；對真實 game_core exit3 揪出 mascot 殘留＋ownedItems 無守衛 2 類真缺口（列 Phase 0.5(b) must-fix） |
| 2026-11-01 17:13 | `758aad26e` | §6.7 獎勵 reward_catalog registry＋fail-closed gate＋baseline（紅隊＋自驗 DENY） |
| 2026-11-01 17:04 | `d5c623ad4` | Phase 0.5/1 確定性工具組＋golden（safe_store/4 gate/lint/nav_gate/deviation_categories，皆紅隊） |
| 2026-11-01 17:03 | `c226ab18c` | 學習地圖 hub `index_new.html`：CATMAP 八島＋接回舊版 HUD（rollback point） |
