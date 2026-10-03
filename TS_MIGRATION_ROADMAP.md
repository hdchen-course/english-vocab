# 全站 TypeScript 遷移 Roadmap

> 使用者 2026-10-03 定案：**整站 JS 改成 TypeScript，含每頁 inline `<script>`**；做法＝**先分析→有計劃→逐檔案 serial 進行**，每檔「連 5 輪 audit 乾淨」就 commit（都在 git，每個 commit 是安全 rollback 點）。範圍＝`english-vocab-deploy` repo root；**`training/` 是另一個專案，完全排除**。

## 0. 原則（鐵律）

1. **零瀏覽器建置、純靜態**：TS 原始碼 → `tsc` 編譯 → commit 出來的 `.js`；頁面照載純 `.js`，執行期與現在**完全相同**。瀏覽器端不新增任何 runtime/建置。
2. **一次只動一個檔、SERIAL**：不並行改會重疊的檔；一檔 5-clean→commit→才下一檔。
3. **行為位元組等價**：遷移是「型別剝離 + 最小註記」，不是重寫邏輯；輸出 `.js` 的行為必須與原檔一致（render 驗證 + 0 console/pageerror + 設計不變）。
4. **設計一致性不退**：遷移不得改動任何視覺/版面（全站「同一出版社」已收斂，見 DESIGN_SPEC.md）。
5. **commit 只含該檔相關**（src `.ts` + 產出 `.js` + 若 inline 抽出則含該 `.html`）；`git diff --cached` grep `^training/` 必為 0；author hdchen-course；**push 由使用者自理**（repo-root secret-scan hook 把關）。

## 1. 技術基礎

- **輸出佈局**：TS 原始碼放 `src/`（**扁平**，不開子目錄，避免輸出落到子目錄）；`tsc` 以 `rootDir:"src", outDir:"."` 把 `src/<name>.ts` 編成與對應 HTML/既有引擎**同層同名** `./<name>.js`。
  - engines：`src/game_core.ts`→`game_core.js`（頁面 `<script src>` 路徑不變）。
  - inline 抽出：`<page>.html` 的 inline `<script>` → `src/<page>.ts` → `<page>.js`，頁面在**原本 inline 的同一位置**改成 `<script src="<page>.js"></script>`（無 async/defer，保留執行順序）。
- **兩個 tsconfig**：
  - `tsconfig.json`（strict，給乾淨新碼：`anim_core`、`wish_shop`）＝維持現有嚴格保證。
  - `tsconfig.legacy.json`（寬鬆：`strict:false, noImplicitAny:false, skipLibCheck:true, types:[]`）＝給機械式遷移的 legacy 檔，避免被數千個 implicit-any 卡住；之後可逐檔漸進收緊。
  - `npm run build` 依序跑兩個 project。每檔遷移時把該 `.ts` 加進對應 project 的 `files`/`include`。
- **共用 ambient 型別**：`src/types/globals.d.ts` 宣告 `window.Game`、`window.CONCEPT`、`window.Anim`、`Word`（vocab 資料形狀）等，讓各遷移檔共用、少寫 `as any`。
- **逐檔 audit harness**：`/tmp/anim/render_earth.mjs` 模式（puppeteer-core + Chrome）通用化成 `render_page.mjs <page> <width> <theme>`：載入頁面、驅動關鍵互動、截圖、回報 console/pageerror、量版面。每檔遷移後跑此 harness＝一輪 audit。

## 2. 每一檔的標準流程（The Loop）

```
(1) 建 src/<name>.ts：複製原 JS，型別剝離 + 最小註記（legacy 寬鬆）。
(2) 加入 tsconfig(.legacy).json 的 files；npm run build → 產出 <name>.js。
(3) diff 檢查：產出 .js 與原檔邏輯等價（空白/註解可不同；邏輯不可變）。
(4) inline 檔：把 <page>.html 的 inline <script> 換成 <script src="<page>.js">（同位置、同順序）。
(5) AUDIT 一輪 = tsc 乾淨 + 逐寬度(390/834/1718)×亮暗 render + 驅動互動
    + 0 console/pageerror + 畫面與遷移前基線一致 + Gate1(scan_simplified/punct) + guards HARD=0。
(6) 連續 5 輪 clean（可重跑 render＝重算一輪；任何修改歸零重數）→ commit 該檔。
(7) 下一檔。
```

每檔用 team：遷移 writer（含該檔領域 lens）+ 對抗式 reviewer + verifier（render 實測）。

## 3. 遷移順序（低風險先、建立管線；高風險最後）

**Phase 0 — 基礎（本 session 內先備好）**：`anim_core.ts` 已證可行；補 `tsconfig.legacy.json` + `src/types/globals.d.ts` + 通用 render harness + dual build script。

**Phase 1 — 共用引擎（最高價值）**：依賴序＝先被最多頁載入的。
1. `speaking_data.js`（2 行，trivial，當第一個「資料檔」管線 proof）
2. `concept_engine.js`（116 行；被 22 概念頁載入，API 不可變）
3. `wish_shop.js`（新；待 build-shop 整合後）
4. `game_core.js`（1360 行；幾乎全站載入 window.Game；最謹慎，大量 render 回歸）

**Phase 2 — 資料檔（機械式、低風險，20 檔）**：`vocab_data_*.js`（cefr/coca/yle/toeic/gept/competition 共 20 檔，共 ~7000 行，純 `window.VOCAB_x=[...]` 字面值，用 `Word[]` 定型）。逐檔，但每檔很快。

**Phase 3 — 概念頁 inline 抽出（22+ 頁，統一樣式，低風險；建立 inline 抽出管線）**：pattern＝svg helper + `window.CONCEPT={...}`。
geometry_concepts(48) → math_concepts(61) → number_theory_concepts(65) → physics_concepts(73) → chemistry_concepts(91) → earth_science_concepts(95，**注意：動畫試點頁，待三軌 commit 後再遷**) → math2_concepts(98) → economics_concepts(99) → chinese_concepts(121) → social_concepts(121) → biology_concepts(132) → english_concepts(145) → linear_algebra_concepts(170) → thinking_traps_concepts → finance_mindset_concepts(337) → everyday_science_concepts(337)。
＋ 5 安全子頁（3 行）：body_safety / digital_citizenship / emotion_skills / media_ai_literacy / self_protection。
＋ home.html(1) / cses_hints.html(1) / googlea8…html(0，無需動)。

**Phase 4 — 中小型頁（實驗室/英文/慣用語/閃卡等）**：各 labs(area/percent/time/unit/fraction 150-220) → math_drill(145) → idiom_stories(112) → english_idioms(129) → thinking_traps_practice(128) → math_solving(162) → mental_math(200) → innovators(400) → english_speaking(364) → english_reading(415) → safety(388) → detective(442) → social_advanced(545) → chinese_advanced(584) → english_advanced(614) → composition(827) → toeic_gept_flashcard(835) → coca_flashcard(857) → cefr_flashcard(996) → physics(845) → biology(946) → geometry(952)。

**Phase 5 — 重量級單頁 app（最高風險，最後，逐一窮盡 render+互動驗）**：
finance(1236) → multiply(1240) → computer_science(1293) → economics_advanced(1300) → number_theory_advanced(1336) → number_theory(1459) → vocabulary_app(1464) → earth_science(1485) → chemistry(1712) → social_studies(1974) → chinese(2054) → learn_how_to_learn(2120) → practice(2415) → english_sense(2988) → math(3254) → logic_reasoning(3390) → math_advanced(4847) → **math_modeling(8097，最大，留到最後，可能需拆模組)**。
＋ index.html(419，含 Track C 今日任務，待整合後遷)。

## 4. 風險與注意

- **多 inline 區塊共享 scope**：某些頁有多個 inline `<script>`，靠全域/函式共享變數。抽出時合併為單一模組或維持 window 全域，確保共享不斷。
- **載入順序**：概念頁 `window.CONCEPT` 必在 `concept_engine.js` 前；外部 script（無 defer）在原位置照序執行＝等價。
- **`document.currentScript` / DOMContentLoaded 時機**：外部同步 script 在原位置執行，時機等價；逐頁 render 驗。
- **engines 的全域 API 不可變**：`window.Game`/`CONCEPT`/`Anim` 的公開介面是全站契約，遷移只能型別化、不可改簽名。
- **產出 `.js` 覆蓋原手寫 `.js`**：遷移後 source of truth＝`src/*.ts`；git 同時追蹤 `.ts` 與產出 `.js`（延續 anim_core 慣例）。
- **規模現實**：~68K 行、91 個單位（23 .js + ~68 有 inline 的頁），serial + 每檔 5-clean＝**多 session 長工程**；math_modeling/math_advanced/logic_reasoning 等巨頁各自是硬骨頭。

## 5. 進度追蹤

每檔完成於 `memory/stickiness-animation-live.md`（或獨立 ts-migration-progress memory）記：已 commit 的檔、下一檔、已達幾輪 clean。目前狀態：**Phase 0 進行中；三軌動畫/黏著性工作先行（5 agents 進行中），其檔案 stabilize+commit 後才對它們做 TS 遷移。**
