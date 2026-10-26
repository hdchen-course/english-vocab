<!-- VISUAL_QA_BUILD_SPEC.md — 視覺 QA 驗收契約（repo-local，fresh-clone 可重建；B-10）
     Status: DRAFT v0.1 (2026-10-26). 本檔為 LEARNING_PATH_REBUILD_SPEC §AC-VIZ 的 repo-local 具現，
     使 fresh clone 不依賴 user-home 規則檔即可重建相同視覺驗收。本檔自身仍須走 spec-first 收斂
     （content_audit 5 clean＋紅隊）後才定案；在此之前為 LEARNING_PATH 主 spec 的從屬草稿。
     單一事實來源仍是 LEARNING_PATH_REBUILD_SPEC.md（§0.4 階 1）；本檔只細化視覺驗收，衝突以主 spec 為準。 -->

# 視覺 QA 驗收契約（iPad Air 13" 全畫面 render + 四角色逐張簽核）

## 0. 範圍與單一事實來源
- 適用：本 repo（K-12 靜態網站）所有畫面／互動子畫面／每個 stepper/動畫 frame。
- 從屬於 `LEARNING_PATH_REBUILD_SPEC.md`；用詞/優先序見其 §0.4。

## 1. 標準裝置（唯一基準）
- iPad Air 13"：landscape **1366×1024**、portrait **1024×1366**，deviceScaleFactor=2。
- 一律以 **http**（本機 server）render，不得 `file://`（外接卷 Chrome 讀不到）。
- 要 render 的不只初始畫面：選單 ＋ 進入後每個子畫面 ＋ 每個 stepper/動畫的**每一個 frame**（驅動 Next 走完）。

## 2. 四個強制檢驗角色（每張畫面/每 frame；可加不可少於四）
1. **art-director（美術設計）**：配色/對比/層次/一致設計語言/品牌調性/留白節奏。
2. **spatial-aesthetics（空間美感）**：空間充分利用、無置中窄島（phone-island）、控制列/卡片用好 iPad 寬度、對齊間距協調、資訊密度恰當。
3. **eye-comfort（視覺醫生/眼科）**：字級可讀（老花友善）、對比足、整塊（含控制列/按鈕）在視窗內免捲動可達、無刺眼/閃爍。
4. **animator（動畫師）**：**每 frame** 檢查——無重疊/裁切/溢出、箭頭指向正確、frame 間尺寸恆定（不忽大忽小）、節奏順、無破圖。

## 3. 內容正確性 ≠ 視覺簽核（與主 spec §6.8.1 第四層對接）
- 四角色簽核只管「好不好看/讀得到/不破圖」；**圖文事實一致**由 §6.8.1 第四層 visual reviewer（領域 reviewer）另簽，兩者皆過才算完。

## 4. 不可繞過的保證（fail-closed）
- **render 全覆蓋**：harness 列舉全部畫面/frame 逐一截圖，產 render manifest（每張 PNG 路徑＋來源畫面 id＋內容 sha）。
- **每張看過**：四角色逐 PNG 記錄「已開啟並判定」寫入 signoff manifest，**綁當前內容 sha**（sha 變→重 render＋重簽，舊簽作廢；仿 Sidewalk `.sha-manifest`）。
- **HOOK 擋關**：宣告視覺工作完成或 push 時，若當前 sha 無「render 全覆蓋＋四角色逐張簽核」則 **DENY**（專案 `.claude/settings.json` PreToolUse/Stop）。
- **gate 永遠不算完工**：維護 holes/hardening ledger；每發現一個繞過→加一道子 gate＋紅隊（證明壞案例被擋、好案例放行），記進 ledger。

## 5. 待建（本檔定案前）
- render harness（列舉全畫面/frame，1366×1024＋1024×1366，http）；四角色 signoff gate；guard hook；`.sha-manifest`；holes ledger（`GATES-MAINTENANCE.md`）。
- 本檔 content_audit 5 clean＋紅隊 → 定案。

## 6. 紅隊（每次改 gate 後必跑）
- 壞案例（未簽核/ sha 不符/缺某 frame）→ 必 DENY；好案例（全覆蓋＋四簽核＋ sha 吻合）→ 放行。
