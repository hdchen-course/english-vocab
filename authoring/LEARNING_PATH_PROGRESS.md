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

## 下一步佇列（spec 順序）
1. ✅ `reward_catalog` registry＋gate＋baseline（commit `758aad26e`）。
2. ⏳ §6.7 後續 gate：反向 `equipped<Type>`→types 參照完整性＋award/grant/equip-provenance 靜態掃描（RT-14/RT-15；**唯讀**掃 game_core.js，不改它）＋紅隊。
3. game_core.js 採用 `safe_store.js`（§10 Phase 0.5(b) never-disappear）：**高風險（動 live 共用引擎）**，須每檔 5-clean＋RT＋全站 render 驗證，謹慎做。
4. 把已紅隊的 `design_consistency_gate.js`＋`content_card_width_lint.js`＋`nav_gate.mjs`＋`deviation_categories_gate.py`＋`reward_catalog_gate.py` wire 進專案 `.claude/settings.json` PreToolUse/Stop（R-STYLE-4 機器強制）＋紅隊。
5. hub HUD 由唯讀手工接線 → 正式 `safe_store`＋`reward_catalog`＋`learning_progress_v1` 接線（§6.3/§6.7/§7）。
6. 部署側 TODO（§6.7，需 CI/host 基礎設施）：`release_snapshot_on_ship_gate`／deploy-side append-only release ledger／`reward_baseline_rewrite_gate`。
7. 續 Phase 1→2→3→4→5 至 §11.A 23 條 AC 全綠（DONE-GATE）。

## 變更流水帳（最新在上）
| 時間(台北) | commit | 內容 |
|---|---|---|
| 2026-11-01 17:13 | `758aad26e` | §6.7 獎勵 reward_catalog registry＋fail-closed gate＋baseline（紅隊＋自驗 DENY） |
| 2026-11-01 17:04 | `d5c623ad4` | Phase 0.5/1 確定性工具組＋golden（safe_store/4 gate/lint/nav_gate/deviation_categories，皆紅隊） |
| 2026-11-01 17:03 | `c226ab18c` | 學習地圖 hub `index_new.html`：CATMAP 八島＋接回舊版 HUD（rollback point） |
