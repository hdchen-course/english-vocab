# 學習路徑重構 — 實作進度記錄（LIVE，跨 session resume）

> 本檔＝**實作進度的詳實流水帳**（HD 2026-11-01 要求：進度詳實記錄、跨 session 可續做）。
> **規範唯一來源仍是 `LEARNING_PATH_REBUILD_SPEC.md`**（本檔不具 normative 力，衝突以 spec 為準）。
> 每完成一個可 rollback 的步驟就 commit（pathspec）＋push，並在此追加一列。最新在最上。

## 當前狀態（更新：2026-11-01 17:13 台北）
- **Phase**：spec 已定案（`spec_converge_gate --verify-ledger` PASS、sha `eec6da8c434a4a26`、binding 3079 全覆蓋、CONTRACT FREEZE ACCEPTED）→ **實作 Phase 0.5/1 進行中**。
- **hub `index_new.html`**：CATMAP 八島＋編號＋練習帶＋島內分類＋接回舊版 HUD（Profile/等級/XP/連勝/金幣/徽章牆，唯讀 game_core、never-disappear 守住）＋sidebar 對齊。**HD 認可定版、已 commit＋push**。strangler-fig 新 hub，**尚未取代 live `index.html`**。
- **§6.7 獎勵 registry＋gate**：`reward_catalog.json`（items=34：22 badge＋6 skin＋6 border；types=3 帶三簽 sha）＋`reward_id_baseline.json`（genesis 34）＋`reward_catalog_gate.py`（三道 fail-closed）**已建、紅隊、自驗 exit0/注入壞案例 DENY、commit＋push（`758aad26e`）**。誠實發現：game_core 無 mascot/avatar/shop 可賺得 catalog，只註冊實際三型別。

## HD 關鍵決策（勿違反，跨 session 生效）
1. **hub 首屏＝CATMAP 自動展開第一島**（HD 刻意，**覆寫 spec §6.1 ND「禁首屏傾倒長清單」**）。未來勿改回九島總覽首屏（那是已否決的 a270 改寫）。
2. **hub 必須保留舊版獎勵/徽章/經驗值/左上進度條**（§7 R3 never-disappear）。目前是唯讀手工接線；正式 `safe_store`＋`reward_catalog`＋`learning_progress_v1` 接線為 Phase 0.5/1。
3. **視覺基準＝iPad Air 13" M5**；設計已調成 MacBook Pro 16" 等比例縮放。
4. **commit/push 已全面授權自主進行**（HD 2026-11-01）；每步當 rollback point、push、並在此詳記。不得 commit `.claude/`、`.sda/`、`training/`、`__pycache__`。

## ⚠ Phase 0.5(b) MUST-FIX（provenance gate `1963295b4` 揪出的 never-disappear 真缺口；動 live game_core.js 須謹慎，每檔 5-clean＋全站 render＋RT）
1. **mascot 殘留**：game_core.js `setProfileField` 有 `equippedMascot` 分支（:1446）＋schema 持久化 `equippedMascot` 欄（:309），但無 mascot 型別/物件＝equip-provenance＋反向參照雙懸空。修法擇一：(a) 移除殘留 equippedMascot 欄/setter＋§6.3 migrate 清 stored 值（傾向此，catalog `_scope_note` 已記）；(b) 正式補 mascot 型別入 types[]（需三簽＋equippable 決策＋type baseline）。
2. **ownedItems 無守衛**：`spendCoins(amount,itemId)`→`ownedItems.push(itemId)`（:1468），itemId 公開 API 參數、無 catalog 成員守衛。修法：spendCoins 對 itemId 做 reward_catalog 成員守衛（或頒獎改經具名 helper 取 catalog id）。
- 修完這兩項 → `reward_provenance_gate.py` 自然 exit 0。gate 預設嚴格 fail-closed（不掛 baseline），故任何 reward「完成」宣告前都被擋，符合 §0.2。

## 下一步佇列（spec 順序）
1. ✅ `reward_catalog` registry＋gate＋baseline（commit `758aad26e`）。
2. ✅ §6.7 provenance 掃描 gate（RT-14/15，commit `1963295b4`）——唯讀，揪出上方 2 類真缺口。
3. game_core.js 採用 `safe_store.js`（§10 Phase 0.5(b) never-disappear）＋順修上方兩個 provenance 缺口：**高風險（動 live 共用引擎）**，須每檔 5-clean＋RT（壞檔不 wipe）＋全站 render 驗證＋reward 兩 gate exit 0，謹慎做。
4. 把已紅隊的 `design_consistency_gate.js`＋`content_card_width_lint.js`＋`nav_gate.mjs`＋`deviation_categories_gate.py`＋`reward_catalog_gate.py` wire 進專案 `.claude/settings.json` PreToolUse/Stop（R-STYLE-4 機器強制）＋紅隊。
5. hub HUD 由唯讀手工接線 → 正式 `safe_store`＋`reward_catalog`＋`learning_progress_v1` 接線（§6.3/§6.7/§7）。
6. 部署側 TODO（§6.7，需 CI/host 基礎設施）：`release_snapshot_on_ship_gate`／deploy-side append-only release ledger／`reward_baseline_rewrite_gate`。
7. 續 Phase 1→2→3→4→5 至 §11.A 23 條 AC 全綠（DONE-GATE）。

## 變更流水帳（最新在上）
| 時間(台北) | commit | 內容 |
|---|---|---|
| 2026-11-01 17:24 | `1963295b4` | §6.7 provenance 掃描 gate（RT-14/15）；對真實 game_core exit3 揪出 mascot 殘留＋ownedItems 無守衛 2 類真缺口（列 Phase 0.5(b) must-fix） |
| 2026-11-01 17:13 | `758aad26e` | §6.7 獎勵 reward_catalog registry＋fail-closed gate＋baseline（紅隊＋自驗 DENY） |
| 2026-11-01 17:04 | `d5c623ad4` | Phase 0.5/1 確定性工具組＋golden（safe_store/4 gate/lint/nav_gate/deviation_categories，皆紅隊） |
| 2026-11-01 17:03 | `c226ab18c` | 學習地圖 hub `index_new.html`：CATMAP 八島＋接回舊版 HUD（rollback point） |
