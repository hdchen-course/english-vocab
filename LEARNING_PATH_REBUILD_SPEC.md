# 全站學習路徑重構 ＋ 國小→國中→高中升學備考 建置規格（BUILD SPEC）

> 本檔為此工程的**唯一事實來源（single source of truth）**。任何規範要改，改這裡；
> 不得在實作碼裡偷偷放寬。跨 `/clear` 以本檔 + `memory/live-workstreams-2026-10-25.md` 為錨。
> 狀態：**草稿 v0.1（撰寫中，尚未定案）**。定案條件見 §12（content_audit 5 連續 clean ＋ 紅隊通過）。
> 定案前**不得進入實作**。

---

## 0. 文件控制

| 項目 | 值 |
|---|---|
| 檔名 | `LEARNING_PATH_REBUILD_SPEC.md` |
| repo | `/Volumes/workplace/EnglishTraining/english-vocab-deploy` |
| 建立 | 2026-10-26（台北） |
| 狀態 | 草稿 v0.1 — 骨架 ＋ 流程/閘門/角色/知識隔離已寫；現況盤點、知識點母體、獎勵風險點待偵察回填 |
| 收斂定義 | content_audit 連續 **5** round 零 panel-confirmed defect（同一未變更 sha）＋ 紅隊證明「規範無法被繞過/遺漏」 |
| 實作準則 | 一次一個檔案；每檔自身跑到 5 clean；全書 audit；知識受限角色模擬；loop 到零問題 |
| 相關檔 | `DICTATION_BUILD_SPEC.md`（聽寫系列，已上線，為流程範本）、`~/.claude/rules/visual-qa-ipad-signoff-do-not-delete.md`（視覺 QA 制度）、`authoring/STANDING_AUDIT_SOP.md`（站級稽核契約） |

### 0.1 待回填區（偵察 agent 對應）
- **§5 現況盤點**（頁面/導覽/共用架構/覆蓋矩陣）← recon A（repo 結構）。
- **§4 知識點母體清單**（國小→國中會考→高中學測/分科，逐科逐 strand）← recon C（課綱）。
- **§7 獎勵永不消失**的風險點逐條 ← recon B（獎勵持久化，**已回填**）。
- 其餘章節（§1–§3、§6 設計原則、§8–§14）為偵察無關，已於本稿撰寫。

### 0.2 跨-session 防漂移錨點（ANTI-DRIFT；回應使用者核心疑慮）
> 使用者最大的擔心：**「沒照 spec 做 / 跨 session 後自己亂搞 / 新發明 style 讓風格不一致（書內現已有不一致、難修）」**。
> 對策原則：**承諾無效，只有 fail-closed 機器強制有效**（已驗證教訓：規則只寫成文字會被繞過；
> 要寫成 PreToolUse hook 真的 DENY，並紅隊證明它擋壞案例、放好案例）。本 spec 定案時必須同時交付下列錨點，缺一不算定案：
> 1. **本檔為唯一事實來源**，且在 (a) 專案 `.claude/settings.json` 的 fail-closed hook、(b) `inject-sop-carriers.py` 的
>    `[learning-path-sop]` carrier echo、(c) `~/.claude/rules/` 規則檔、(d) `MEMORY.md` 指標 四處皆有錨，
>    新 session 不重讀本檔就**無法宣告任一檔收斂**（hook 擋）。
> 2. **設計一致性由機器強制**（§6.5）：單一設計 token 來源 ＋ `design_consistency_gate.js` fail-closed；
>    頁面自創 style／私有 class 重造共用元件＝DENY。
> 3. **「禁止新發明 style」規則**（§6.5 R-STYLE）：任何新視覺樣式必須先進共用設計系統並簽核，才能被頁面引用。
> 4. **既有不一致**先以 remediation phase（§10 Phase 0.5）盤點並收斂到 token，再開新內容。

---

## 1. 目的與範圍

### 1.1 一句話目的
把現有分散的 K-12 教材，重構成**一條清楚、無斷層、可記憶、不易倦怠的學習路徑**，並補齊
**國小 → 國中會考 → 高中學測／分科測驗**三階段升學所需的知識點與應考能力；同時**擴充獎勵系統
且保證已賺得的獎勵永不因 refresh／改版而消失**。

### 1.2 範圍內（In scope）
1. **學習路徑重構**：中央 hub／roadmap、單元順序與先備知識（prerequisite）關係、逐單元進度追蹤、
   跨科導覽；既有內容若不符需求**可重構或打掉重做**（有 git history，安全）。
2. **升學知識點補齊**：依 §4 母體清單，逐 stage×subject 補到「無斷層」；包含
   - 國小（G1–G6）打底 ＋ 國小→國中銜接；
   - 國中（G7–G9）**會考 5 科＋寫作測驗**；
   - 高中（G10–G12）**學測（高一二範圍）＋ 分科測驗（高三選修深水區）＋ 混合題型 ＋ 學習歷程檔案觀念**。
3. **應考策略層**：考古題模式、錯題本、嚴格計時、數學非選 0–3 級分完整推導步驟、長文本擷取、
   英聽轉折詞、自然實驗操縱/控制變因、社會跨科題組、四段論寫作等（§4 附應考能力清單）。
4. **獎勵系統擴充 ＋ 永不消失保證**（§7）。
5. **全角色觀點審查 ＋ 知識受限角色模擬**（§8、§9）。
6. **視覺 QA（iPad Air 13"）**納入 DONE-GATE（§11，依視覺 QA 規則檔）。

### 1.3 範圍外（Out of scope，明列以防 scope creep）
- 任何需要破解反機器人／抓取第三方受保護內容的資料來源（沿用聽寫系列鐵律）。
- 任何機敏／內部機密資訊（PII、密鑰、非公開內部系統）。
- 後端服務／帳號系統：本站為**靜態站**，一切進度與獎勵存在瀏覽器端（localStorage），不新增伺服器。
- 真人自動批改手寫：沿用「自評（翻答案對照→三級自評→SRS）」，**不假裝自動判讀手寫**。

### 1.4 成功準則（可驗收）
- 任一 stage×subject 的學習路徑，從入口到該階段目標，**無「用到尚未教的概念」的斷層**（§9 模擬證明）。
- 知識點母體（§4）每一條都對應到站上一個可學、可練、可自評的單元（覆蓋矩陣 100%，或明列延後項）。
- 獎勵：在「升級資料結構／改 catalog／refresh」三種情境下，已賺得獎勵**零遺失**（§7 紅隊全綠）。
- 全書通過 DONE-GATE（§11）。

---

## 2. 鐵律（IRON RULES，違反即 defect，不可為求快放寬）

- **R1 正確性第一**：教錯會害學生。任何知識點內容錯誤＝BLOCKER。
- **R2 全繁體、零簡體、零 PRC 詞**：每次產出前自檢（簡→繁常見陷阱字）；指中國不用「大陸／中國大陸」，
  一律「中國」；地理「亞洲大陸／continent」保留。
- **R3 獎勵 additive ＋ never-disappear**：穩定字串 id（非 index）、真實版本遷移、絕不以預設物件覆寫整個
  localStorage key；已賺得獎勵 refresh／改版都不得消失（§7）。
- **R4 輕鬆學 ＋ 視覺化無所不在 ＋ 可玩（playable）**：概念優先具體化、圖解／互動優先於純文字長篇。
- **R5 共用架構、可重抽**：共用 game_core／srs_engine／app.css，單元資料與引擎分離；
  不得每頁各自重造 UI 元件（設計一致性是鐵律）。
- **R6 team ＋ 獨立對抗式 reviewer**：撰寫與審查皆多-agent，必有獨立對抗式 reviewer；不 solo。
  必備角色見 §8（含語言/學習/眼科/心理醫生/美術/空間美感…）。
- **R7 spec-first、不可跳序**：spec 未達 5 clean 不進紅隊；紅隊未證明「規範無法被繞過」不進實作。
- **R8 重構自由但可回溯**：既有內容不符需求可打掉重做；每階段 commit 可 rollback（§10）。
- **R9 效能**：頁面不得無限 inline 膨脹；按需渲染／載資產；vanilla 優先。
- **R10 視覺 QA（iPad Air 13"）**：所有畫面/frame 以 iPad Air 13" 實 render、逐張看過、四角色簽核，
  未簽核不得宣告視覺工作完成（§11 ＋ 視覺 QA 規則檔）。
- **R11 不曝露年段（learner-facing 無「國小/國中/高中/年級/會考/學測/分科」字樣）**：學習者端一律**不顯示**任何
  年段或升學考試階段標籤；路徑呈現為「**能學就一路往上**」的連續進程（以技能/主題/難度階梯命名，不以學制命名）。
  年段/考試階段僅為**內部 metadata**（排序、先備、難度、覆蓋追蹤），不得作為顯示字串。
  動機：避免「這是高中＝太難」「這是國小＝太幼稚」的天花板與標籤感，支持連續成長（呼應心理醫生 §8-7 視角）。
- **R13 課綱＝下限，深度無上限（minimum, not ceiling）**：108 課綱／考試範圍是**必須全覆蓋的最低要求**，
  不是天花板。鼓勵收錄**超綱延伸**知識點（更深、更廣、跨學科、真正理解導向），標記 `tier:t_enrich`、`beyond:true`。
  **延伸上限 = 大學入門程度（university-intro）**：可延伸到大一普通程度（如微積分銜接、普通物理/化學/生物、線代/離散、經濟學原理…），
  以「打好銜接、滿足好奇」為度，不做研究所深度。
  **coverage gate 對「課綱 minimum」嚴格**（少一條即 FAIL）；**超綱延伸為加分、不設上限、可選、絕不 gating**，
  且同樣不曝露年段（R11）——以「想更深入？」之類中性邀請呈現，不標「超難／高年級」。
- **R12 知識涵蓋全域（不限學科課綱）**：知識母體含「學科（課綱）」**＋**「跨課綱生活與核心能力」
  （兒少安全自保／社會情緒 SEL／學會如何學習／思考與推理／數位與媒體素養／資料素養／運算思維與科技／
  理財素養／永續與世界公民／創新）。完整清單見**附錄 A**（`authoring/KNOWLEDGE_POINT_INVENTORY.md`，本 spec 不可分割的一部分）。

---

## 3. 讀者畫像與學習路徑總體模型

### 3.1 讀者畫像
- 主要讀者：台灣學生，從國小到高中，橫跨能力與動機差異大的族群。
- 使用裝置：以 **iPad Air 13"** 為設計與驗收基準（亦相容手機）；可能長時間使用→眼舒適與低倦怠重要。
- 動機脆弱：挫折、過載、無回饋都會導致放棄→路徑必須小步、常回饋、有成就感（獎勵）。

### 3.2 學習路徑總體模型（三層）
1. **階段（Stage）**：國小 → 國中（會考）→ 高中（學測／分科）。
2. **科目（Subject）× 主軸（Strand）**：見 §4 母體。
3. **單元（Unit）**：最小學習單位，含「教（具體化/視覺化）→ 練（可玩/即時）→ 自評（SRS）」三段，
   並宣告其**先備單元（prerequisites）**與**知識點標籤（knowledge-point ids）**。

### 3.3 路徑不變量（invariants，§9 模擬據此驗證）
- **INV-1 無斷層**：一個單元用到的每個概念，都在其先備單元鏈中教過。
- **INV-2 可學會**：依路徑學習者，在不借助「尚未教的知識」下，能完成該單元的練與評。
- **INV-3 記得牢**：關鍵知識點有 retrieval practice ＋ 間隔複習（SRS）覆蓋。
- **INV-4 不倦怠**：單元長度／認知負荷受控；難度階梯平滑；有節奏的獎勵與成就回饋。

---

## 4. 知識點母體清單（RECON C 回填）

**附錄 A ＝ `authoring/KNOWLEDGE_POINT_INVENTORY.md`，是本 spec 不可分割、BINDING 的列舉清單**（不是「參考」）。
「涵蓋數學」這種空話**禁止**出現在 spec：涵蓋什麼，必須逐條列舉在附錄 A，且每條可被 coverage gate 機器追蹤。
> 教訓（Sidewalk documents）：一開始沒把 source-code list 逐項列舉並 gate 住，成果就淺薄。本 spec 以附錄 A 列舉 ＋
> §11 coverage gate 複製其「清單驅動完整度」的做法，杜絕「挑幾個做做、其餘略過」的淺薄實作。

- **binding 列舉 ＋ 穩定 id**：附錄 A 每一條知識點都配**穩定字串 id**，格式 `<domain>.<tier>.<strand>.<slug>`
  （例 `math.t_adv.alg.quadratic-formula`、`sci.t_hs.phys.kinematics`、`life.safety.online.grooming-signals`）。
  `tier` 為**內部難度階**（不是學制、learner 端不顯示，R11），id 一經指派不得改語意（與 §7 獎勵 id 同哲學）。
- **機器可讀 manifest（Phase 1 首要產物）**：由附錄 A 產生 `authoring/knowledge_points.json`，一列一 id，欄含
  `{id, domain, tier, strand, title_zh, exam_tags[], status, unit_ids[]}`。此 manifest 是覆蓋追蹤與 §6.2 unit metadata 的連結鍵。
- **涵蓋全域（§2 R12）**：附錄 A 含 (甲) 學科課綱（國小/國中/高中內部 tier）＋ (乙) 跨課綱生活與核心能力
  （安全自保／SEL／學會學習／思考推理／數位媒體素養／資料素養／運算思維科技／理財／永續世界公民／創新）。
  目前量：學科 598 條；跨課綱域（section G）彙整中，完成後併計並重列每域 count。
- **gap（附錄 A − §5.5 現況）**：主要落在**高階學科**（三自然科無高階層、數學無微積分/三角/向量/矩陣/複數/圓錐、
  國文高階僅 primer）與**社會分流**；國小/國中段以「接線＋補強」為主。gap 明細 = coverage gate 首次執行時所有 `status!=done` 的 id 清單。

### 4.1 附錄 A 的建置方法（list-first ＋ 深掘 fan-out ＋ binding；杜絕淺薄）
> 教訓：單一 context 自己寫整份清單 **一定淺**（context 受限），且清單不在 spec 裡就會在實作時漂走。
- **深度標準（DEPTH-STD）**：清單的每一條 = **一個具體、可測、可出題的微技能**（例：不是「二次方程式」，而是
  `一元二次方程式的公式解`、`判別式判根數`、`配方法`、`根與係數關係`、`含參數的二次方程式應用` 各自一條）。
  廣義標題（「涵蓋數學」「方程式」）**不可**作為一條知識點——會被 content_audit 判為淺薄 defect。
- **建置法 = 每領域一位 expert 平行 fan-out 深掘**：按下表 slice 矩陣，每個 slice 指派一位領域 expert agent，
  **只深挖自己那一小塊**到 DEPTH-STD，並各配獨立對抗式 reviewer 核對「對課綱/考試範圍是否窮盡、有無錯/年段錯置」。
  不得由單一 agent 一次寫完全部（那會淺）。各 slice 回來合併去重，配穩定 id，emit 成 `knowledge_points.json`。
- **slice 矩陣（學科）**：數學／國語文／英語／自然-理化／自然-生物／自然-地科／社會-歷史／社會-地理／社會-公民，
  各跨 基礎／中階／高階 三內部 tier。**跨課綱域**：安全自保／SEL／學會學習／思考推理／數位媒體素養／資料素養／
  運算思維科技／理財／永續世界公民／創新（section G）。
- **現有 598 條 = 粗胚（coarse first cut）**：僅供起步，**必被各 slice 深掘結果取代/擴充**；深掘後重列每 slice count。
- **spec 出場 gate（硬性）**：附錄 A 未完成「全 slice 深掘到 DEPTH-STD ＋ 每 slice 獨立審查 ＋ content_audit 5 clean ＋ 紅隊」，
  **spec 不算定案、不得進實作**（§12）。這確保「清單一開始就在 spec 裡、且夠深」。

### 4.x 應考能力清單（策略層，與知識點並列追蹤）
- 考古題近 5–10 年模式辨識；錯題本；嚴格計時與畫卡節奏。
- 數學非選：0–3 級分「完整推導步驟」示範與自評 rubric。
- 國文：長文本擷取關鍵字（轉折/因果）、文言虛字一字多義、雙文本比較閱讀（高中）。
- 英文：字彙階梯（國中 1200→2000；高中 4500–6000）、英聽轉折詞、中譯英、英文作文。
- 自然：探究與實作——操縱/控制變因、圖表判讀、陌生情境推論。
- 社會：跨科題組整合、絕對/相對位置、統計地圖判讀。
- 寫作：引導式四段論、理性思辨＋感性抒情（高中國寫）、個人觀點＋具體實例。
- 高中：混合題型（選擇＋多選＋簡答/填表/繪圖、精確文字陳述理由、嚴謹算式）；學習歷程（過程反思）。

---

## 5. 現況盤點（RECON A 回填）

> 待 recon A（repo 結構 agent）回報後填入：
> 5.1 全頁面清單（檔名→科目/年段/KB）；5.2 現行導覽與路徑機制（hub？roadmap？平面清單？有無先備關係）；
> 5.3 共用架構（game_core/srs_engine/app.css 提供什麼、哪些頁重用 vs bespoke）；
> 5.4 典型單元資料/引擎模式；5.5 (科目×年段) 覆蓋矩陣（有內容 vs 缺/薄）。
>
> §4（母體）與 §5.5（現況覆蓋）相減＝**gap 清單**，為 §6 實作 backlog 的輸入。

### 5.1 頁面規模
- repo root 約 **100 個 learner-facing `.html`**（各有編譯 sibling `.js`，源自 `src/*.ts`）。
- 全部可從 `index.html` 連到；唯一未連入 hub 的是 `_template_ref.html`、`cses_hints.html`（屬成人 CS，449KB）、
  `googlea8c8*.html`（GSC 驗證）、`home.html`（redirect stub）。
- `training/`（~105 HTML）是**獨立的成人軟體工程面試書**，**不屬 K-12**，本工程範圍外（勿掃入）。

### 5.2 中央 hub 與導覽機制
- **單一 hub = `index.html`（`src/index.ts`）**：單頁、錨點式 dashboard，`<div class="paths">` 內 9 個
  `<section class="path" id="path-*">`，**全部常展開**；順序：安全→核心能力→數學→英文→國語→自然→社會→科技→理財。
- 每課為手寫 `<a class="card row-card" href="xxx.html#anchor">`（約 100 條靜態連結）。
- 兩種導覽皆**純錨點捲動**：iPad(≥1024px) 左側 `rail-nav`、手機底部 tab + 「更多」bottom-sheet；
  `index.ts` 以 IntersectionObserver scroll-spy 高亮當前 section。
- **沒有順序性/先備/解鎖/roadmap**：唯一順序訊號是每區一行**裝飾性** `path-hint`（如「觀念→練習→進階」），
  純文字建議，非強制。另有「從這裡開始」CTA ＋「今天的小任務」軟推薦（明確 **non-gating**，可自由點）。
- → **這正是 §6.1 要補的核心：把平面清單升級成有先備關係(DAG)、可追蹤進度的學習路徑。**

### 5.3 共用架構（重構必須沿用，不得另造）
| 層 | 檔 | 提供 |
|---|---|---|
| 設計 token/元件 CSS | `assets/app.css`（~56KB，§5.1 token 層：色/間距 `--s*`/圓角/`--tap-min`/`--content-max`） | 每頁必 link；**style 單一來源**（§6.5） |
| 遊戲化引擎 | `game_core.js`（`src/game_core.ts`）→ `window.Game` | XP/coins/level/6 計分科目/combo/每日目標/badge/mastery/streak/事件/toast/**單一 localStorage key `player_profile_v1`** |
| 遊戲化 CSS | `game_core.css` | 與 game_core 配套 |
| 概念課引擎 | `concept_engine.js`（`src/concept_engine.ts`） | 「教一點→即測」渲染；頁面設 `window.CONCEPT={progKey,lessons[...]}`；進度存**頁面各自 progKey（不餵主 XP）** |
| 動畫庫 | `anim_core.js`（~371KB）→ `window.Anim` | teach-step 的 SVG/canvas 場景 |
| SRS 引擎 | `assets/srs_engine.js` | 間隔複習；用於 cefr/coca/toeic flashcard + vocabulary_app + english_dictation + practice |
| 既有設計/計畫文件 | `BLUEPRINT.md`、`DESIGN_SPEC.md`、`DESIGN_PLAN.md`、`STICKINESS_PROPOSAL.md`、`TS_MIGRATION_ROADMAP.md`、`AUDIT_DIMENSIONS.md` | 內含頁面引用的 §-編號設計約束（§6.5 的 style 單一來源要與這些對齊/合併） |

### 5.4 三種單元原型（重構接線以此分類）
- **(A) 概念頁**：共用 `concept_engine.js` + inline data（`window.CONCEPT`）；progKey 為頁面本地、**不餵主 XP**。多數小頁屬此。
- **(B) bespoke 遊戲頁**：大型自帶 `*.js`，自有畫面/機制，透過 `window.Game.award(...)` 餵主 XP（math/number_theory/safety/chinese/math_modeling…）。
- **(C) flashcard/SRS 頁**：共用 `srs_engine.js` + sidecar data（如 cefr_flashcard + `vocab_data_cefr_*`）。
- **進度未統一**：(A) 的 progKey 與主 `player_profile_v1` 分離 → §6.3 需定義「逐單元進度」如何統一納管（且不破壞 §7 永不消失）。

### 5.5 覆蓋矩陣（●實質／◐薄／○近無）
| 科目 | 國小 | 國中 | 高中 |
|---|---|---|---|
| 數學 | ● | ● | ◐（advanced/RSA/linear_algebra/modeling；**無高中微積分/三角函數深化**） |
| 英文 | ● | ● | ◐（偏考試向，高中學術較薄） |
| 國語 | ● | ● | ◐（classical/literature_map 僅 primer；**無深高中國文**） |
| 理化 | ● | ●（advanced 標國中） | ○（**無高中物化**） |
| 地科 | ● | ●（標國中） | ○ |
| 生物 | ● | ●（標國中） | ○ |
| 歷史 | ◐ | ● | ◐（與國中共用，無高中專屬） |
| 地理 | ● | ● | ◐（同上） |
| 公民 | ◐ | ● | ◐（同上） |
| 理財 | ● | ◐ | ◐（2 薄頁） |
| 安全 | ● | ●（物質/青少年標國中・高中） | ◐ |
| 核心能力 | ● | ● | ◐（跨年段共用，無高中專屬層） |

**結論：高中(G10–G12) 全面最弱**——三自然科 advanced 封頂於國中、數學止於 RSA 無微積分、國文僅 primer；
國小/國中大致齊全；社會歷地公被綑在共用 `social_advanced*`，未依 strand/年段分離。這決定 §4−§5 的 gap 主要落在**高中段**與**社會分流**。

---

## 6. 學習路徑重構設計（偵察無關的設計原則；具體 backlog 待 §4/§5 回填）

### 6.1 導覽與路徑結構
- 單一**中央 hub**：以 stage → subject → strand → unit 的層次呈現；顯示每單元狀態（未解鎖/可學/進行中/已精熟）。
- **先備關係（DAG）**：每單元宣告 prerequisites；hub 以此決定解鎖與建議下一步；避免「跳著學卻缺基礎」。
- **路徑而非平面清單**：提供「建議學習順序」的視覺化 roadmap（可玩、具成就感），但允許自由探索。

### 6.2 單元設計規格（每個 Unit 的統一骨架）
- `教`：概念具體化／視覺化（圖解或互動 stepper），符合 §3.3 INV 與 R4；eye-comfort（§8-6）。
- `練`：可玩、即時、低門檻；題型契合該知識點（如數學非選要能寫步驟）。
- `自評`：翻答案→三級自評（還不熟/快會了/會了）→ 餵 SRS（srs_engine）；**不假裝自動判讀**。
- `metadata`：`unit_id`、`stage`、`subject`、`strand`、`knowledge_point_ids[]`、`prerequisites[]`、
  `est_minutes`（認知負荷/倦怠控制）。
- **計時模式（可選功能；使用者 2026-10-26 認可）**：練習/測驗可開啟**計時器**——倒數計時、配速提示（每題建議秒數）、交卷提醒鈴，
  用於會考/學測的「嚴格計時、畫卡節奏、時間分配」應考能力（§4.x）。**心理/SEL 鐵律**：計時是工具不是壓力——
  **預設可關、隨時可暫停/關閉**、正向框架（顯示「配速練習」而非「倒數催促」），不得製造焦慮或以紅色警示轟炸（呼應 §8-7 心理醫生、INV-4 不倦怠）。
- 資料與引擎分離（R5）：單元資料走 sidecar（JSON/TS data），共用 renderer。
- **動畫/視覺技術不限 JavaScript stepper**（使用者定 2026-10-26）：自然科（理化/地科/生物）等概念，動畫可用最能把概念講清楚的技術——
  CSS/SVG/SMIL 動畫、`<canvas>`、**WebGL**（如 3D 分子/場、軌道、波）、Lottie、或預渲染影片皆可，不侷限 `anim_core` 的 JS stepper。
  **但仍受全部既有約束**：viz-QA（iPad Air 13 逐 frame render＋四角色簽核，R10/視覺 QA 規則檔）、R-STYLE 設計一致（§6.5，共用調色盤）、
  效能（R9，按需載入、體積控管、低階裝置可降級）、眼舒適（不刺眼/不暈/可暫停，尊重 `prefers-reduced-motion`）。
  **參考語料／能力實證（同作者先前作品，證明高互動 WebGL/canvas 模擬可做到；僅取手法，勿複製內容或混品牌/混 repo）**：
  `../engineering/topics/physics`（c1–c34＋`sim.html`）、`../engineering/topics/chemistry`（`chem-viz.js`、`molecule-webgl.js` WebGL 3D 分子）、
  `../engineering/topics/calculus/index.html`、`../engineering/numla/index.html`（數值/線代視覺化）、
  `../engineering/languages/typescript/ts_capstone_satellite_map.html`、`..._solar_system.html`、`../engineering/languages/python/python_capstone_nbody.html`
  （衛星地圖／太陽系／N 體重力模擬）。**實作鐵律**：既然這些等級的互動模擬做得出來，自然科動畫**不得退回淺薄靜圖**；但一律仍過 viz-QA＋R-STYLE＋效能＋眼舒適。

### 6.3 進度與精熟
- 逐單元進度存 localStorage（§7 持久化規範）；精熟由 SRS 狀態 ＋ 自評歷史決定。
- 進度與**獎勵解耦**：進度前進可觸發獎勵，但獎勵一旦賺得即永久（§7）。

### 6.4 重構策略
- 既有頁若符合 §6.2 骨架→包裝接入路徑；不符→重構或重做（R8）。逐檔進行，每檔自身 5 clean（§11）。

### 6.5 設計一致性：單一設計來源 ＋ 防漂移機器強制（回應使用者核心疑慮）
> 治「新發明 style／跨 session 亂搞／書內已不一致」的根因：把一致性從「承諾」變「fail-closed 機器強制」。
- **R-STYLE-1 單一設計來源**：所有顏色/間距/圓角/字級/陰影/點擊目標，只能用 `assets/app.css` 的 token
  （`--accent`/`--ink`/`--s*`/`--r-lg`/`--tap-min`/`--content-max`…）＋ `game_core.css` 共用元件 class。
  頁面 CSS **不得硬編色碼或 px 魔術數字**；token 不存在就先加 token（並登記於 `DESIGN_SPEC.md`）再用。
- **R-STYLE-2 禁止新發明 style**：任何新視覺樣式/元件必須**先**加進共用設計系統並經美術(§8-8)＋空間美感(§8-9)簽核，
  才能被頁面引用。頁面**不得用私有 class 前綴重造**共用元件（卡片/按鈕/pill/stage/揭曉）。
- **R-STYLE-3 內容卡自適應寬（house pattern，解長短問題）**：凡「答案/揭曉/題目/內容」卡，一律
  **shrink-to-fit ＋ 置中 ＋ 舒適上限**（`width: fit-content; max-width: min(680px, 100%); margin-inline: auto;`，
  上限值依卡型微調）——短內容小卡剛好包住、長內容到上限才換行。**不得固定寬、不得全寬**（短內容會靠左或空曠）、
  **不得無上限**（長內容整行過長難讀）。文字另設閱讀 measure 上限（如 `max-width: 40ch`）。
  *已落實範本：`english_dictation.html` 揭曉卡（`.dct-play > .dct-reveal`，dictation.css）——短句 244px 小卡、長句到 680px 換行、恆置中。*
- **R-STYLE-4 機器強制（fail-closed）**：`design_consistency_gate.js`（`SDA_CSS=app.css,game_core.css`）偵測私有重造即 DENY；
  新增一道（待建）**content-card 寬度 lint**：偵測卡片類別用固定 `width:` 或 `width:100%` 而未用 `fit-content`+cap → DENY。
  兩者連同簡體掃描、視覺 QA 簽核，進專案 `.claude/settings.json` 的 PreToolUse/Stop hook。gate 誤擋先修 gate＋紅隊。
- **R-STYLE-5 既有不一致 remediation**：先盤點全站「卡片/按鈕/色碼硬編/私有重造」清單，統一到 token ＋ R-STYLE-3
  自適應卡，**再**開新內容（§10 Phase 0.5）。否則越補越亂。

---

## 7. 獎勵系統擴充 ＋「永不消失」保證（RECON B 回填風險點；設計原則如下）

### 7.1 設計原則（偵察無關）
- **穩定字串 id**：所有可賺得物（skin/border/badge/shop item/成就/解鎖）以穩定字串 id 識別，
  **絕不用陣列 index**；catalog 擴充只新增 id，不重用/不改既有 id 語意。
- **additive 合併**：讀檔時只「補缺省、不覆蓋既有」；絕不以 freshProfile 整個覆寫 storage key。
- **真實遷移 migrate()**：`schemaVersion` 必須被讀取並驅動逐版 migrate；新欄位用遷移補齊，舊的賺得資料保留。
- **catalog 變更安全**：id 若下架，owned 參照需 graceful fallback（顯示占位或保留為已擁有），不得清除。
- **寫前先讀**：任何 save 前先 load＋merge，杜絕「先寫預設再讀」把已賺得清掉。
- **壞檔不重設（最高優先）**：若存檔 JSON 解析失敗，**絕不**以空白 freshProfile 覆寫 key；必須
  (a) 把原始壞字串備份到另一 key（如 `player_profile_v1__corrupt_<ts>`）、(b) 保留記憶體內既有 profile、
  (c) 明確提示，交由使用者/後續修復；寧可拒寫也不毀資料。（對應 §7.2 R1 當前最危險路徑。）

### 7.2 風險點逐條（RECON B 回填）
現況（recon B，2026-10-26；全站獎勵狀態集中於單一 key `player_profile_v1`，只有 `game_core.js` 寫入）：
`normalizeProfile` 是非破壞性「補缺省」合併、catalog 用穩定字串 id（皆為**好消息**）。但有下列風險路徑：

| 風險 | 位置（game_core.js） | 失效情境 | 嚴重度 |
|---|---|---|---|
| **R1 壞檔全毀** | `readLS` 吞 JSON.parse 例外回 null（~216–223）→ `normalizeProfile(null)` 回空白 fresh（~329–330）→ 下次 save 覆寫 | 存檔只要壞一個 byte，XP/coins/badges/owned/equipped 靜默歸零 | **BLOCKER** |
| **R2 無真正 migrate** | `version` 有寫無人讀（~295）；無 `migrate()` | 未來改欄位語意無遷移鉤子，可能孤兒化/誤解已賺得狀態 | 高 |
| R3 reset('all') 整檔重設 | `reset('all')`→`freshProfile()`+save（~849–855） | 任何呼叫端一觸即全清（設計如此，但需保護/確認） | 高 |
| R4 catalog 下架孤兒化 | `wish_shop.js byId` 查無回 null；`isOwned` indexOf miss | 下架/改名 skin/border id，owned/equipped 變不可見（資料留存但孤兒） | 中 |
| R5 badge 下架隱形 | `getBadgeWall` 只走現行 catalog keys（~834） | 從 BADGES 移除某 id → 已賺得 badge 不再顯示（資料留存） | 中 |
| R6 配額爆失新狀態 | `saveNow` setItem 失敗 trim 重試一次仍失敗則靜默放棄（~405–411） | 當回合新賺 XP/coins/badge 未落地，refresh 後遺失 | 中 |
| R7 跨分頁覆寫 | `onStorage` 以他分頁寫入 normalize 取代記憶體（~1289–1291） | 兩分頁分歧 last-writer-wins；一分頁 reset 會傳染其他分頁 | 中 |
| R8 無原子性 | 整個 profile 單一 JSON blob 每次整寫（~403） | 任一記憶體欄位被誤清，save 立即把全物件持久化 | 中 |

修補對應：R1→§7.1「壞檔不重設」；R2→§7.1「真實 migrate()」；R3→reset 需二次確認且不可由非使用者路徑觸發；
R4/R5→catalog 採「只增不刪/下架改標記 retired、保留 owned 顯示」策略，必要時提供 id remap 遷移；
R6→配額處理需告警而非靜默，並優先保全已賺得欄位；R7→跨分頁合併改「聯集而非取代」、reset 不跨分頁傳染；
R8→關鍵賺得欄位的寫入加防護（寫前快照、異常回滾）。每條在 Phase 1 落實並由 §7.3 紅隊驗證。

### 7.3 獎勵紅隊案例（必須全綠才算 §7 完成）
- RT-1：賺得 skin A → 升 schemaVersion → reload → A 仍在、仍可裝備。
- RT-2：賺得 badge B → catalog 下架 B 的某欄位 → reload → B 不消失（graceful）。
- RT-3：賺得物 + refresh（無版本變）→ 零遺失。
- RT-4：舊 profile（缺新欄位）→ migrate → 新欄位補齊且舊賺得保留。
- RT-5：index-based 參照（若存在）→ 證明已改為 id-based，重排 catalog 不錯位。
- **RT-6（最關鍵）：存檔塞入壞 JSON（壞一個 byte）→ reload → 已賺得獎勵零遺失**（壞檔被備份、不被空白覆寫）。
- RT-7：localStorage 配額逼近/超出 → 新賺得 badge/XP 的寫入失敗時「告警並保全」，不靜默吞掉。
- RT-8：A 分頁 reset('all')，B 分頁已開 → B 分頁的已賺得不被 A 的重設傳染（跨分頁用聯集/防護）。

---

## 8. 全角色觀點 ＋ 每角色的「可取得知識限制」（knowledge-isolation）

> 使用者要求：角色模擬時**限制角色能取得的知識**，才能正確模擬「依路徑學習、無障礙、學得會、記得牢、不倦怠」。
> 下表每個角色標明：審查什麼、以及它**能看到/不能看到**什麼（knowledge boundary）。

| # | 角色 | 審查透鏡 | 知識邊界（可取得 / 不可取得） |
|---|---|---|---|
| 1 | 領域專家（各科） | 正確性（R1） | 可取得全部正解與課綱；用於查錯，不用於模擬學習者 |
| 2 | native-English 語言專家 | 英文道地、可讀（TOEIC 600–750 舒適） | 可取得英文母語語感；僅評語言面 |
| 3 | 溝通語言學家（linguist） | 用詞淺白、歧義 | 同上，評中文/英文表達清晰 |
| 4 | 學習神經科學家 | 順序/chunking/retrieval/worked-example/spacing | 可取得學習科學；評路徑是否助記憶 |
| 5 | 知識視覺化專家 | 圖解/動畫把概念說清楚 | 評視覺化品質 |
| 6 | 眼科/眼舒適（ophthalmologist） | 字級/對比/整塊免捲動可達/不刺眼（iPad 基準） | 評生理可讀性 |
| 7 | 心理醫生 | 動機/挫折/倦怠/標籤風險/情緒安全 | 評情緒與動機安全（禁貼標籤） |
| 8 | 美術設計（art-director） | 配色/層次/一致設計語言/留白節奏 | 評視覺設計 |
| 9 | 空間美感設計（spatial-aesthetics） | 空間充分利用、無置中窄島、對齊間距 | 評版面空間 |
| 10 | 產品經理（PM） | 讀者旅程/範疇/路徑取捨 | 評 scope 與旅程 |
| 11 | **知識受限學習者（模擬學生）** | 走一次路徑，只用「已學到的知識」 | **核心限制角色**：見 §9 |

- 角色 1–10 為**審查透鏡**（找缺陷）。角色 11 為**路徑驗證器**（證明 INV-1..4）。
- 必要時可增角色（如各科教練、無障礙 QA），但**不得少於**上列。

---

## 9. 知識受限學習者模擬協定（核心驗證）

### 9.1 目的
證明學習路徑滿足 §3.3 的 INV-1..4：無斷層、可學會、記得牢、不倦怠。

### 9.2 知識隔離（關鍵機制）
- 模擬一個學習者走到路徑上的單元 U 時，給該 agent 的**可取得知識 = U 的先備單元鏈所教過的知識點之聯集**，
  **不給** U 尚未教、或路徑更後面才教的任何概念/詞彙/技巧。
- 操作化：以 §6.2 的 `knowledge_point_ids` ＋ `prerequisites` 計算「到 U 為止的已授知識集 K(U)」；
  模擬 prompt 只載入 K(U) 對應的教學內容，明令「只能用 K(U) 內的知識作答，遇到未教概念要回報為斷層」。

### 9.3 判定
- **斷層（INV-1 違反）**：U 要求用到不在 K(U) 的概念 → defect（需調整先備鏈或補前置單元）。
- **學不會（INV-2）**：在 K(U) 下無法完成練/評 → defect。
- **記不牢（INV-3）**：關鍵知識點無 retrieval/spacing 覆蓋 → defect。
- **倦怠（INV-4）**：單元過長/負荷過重/難度跳階/回饋稀疏 → defect（心理醫生＋學習科學家共判）。

### 9.4 執行
- 全書實作完成後，對每條主要路徑跑知識受限模擬；發現斷層→修→重跑，loop 到零斷層。
- 模擬為**獨立 agent**，知識邊界由協定強制（prompt 僅注入 K(U)），不得讓它偷看後續內容。

---

## 10. 安全執行：phase 化與 rollback

- **Phase 0｜spec 定案**：本檔達 5 clean ＋ 紅隊通過（§12）。gate 之前不進 Phase 1。
- **Phase 0.5｜既有不一致 remediation ＋ 獎勵安全地基（先做，before 任何新內容）**：
  (a) 盤點全站卡片/按鈕/色碼硬編/私有重造清單，統一到 token ＋ §6.5 R-STYLE-3 自適應卡（修現有不一致）；
  (b) 修 §7.2 的 R1 壞檔全毀（壞檔不重設）＋ R2 真實 migrate()，並以 §7.3 RT-6 紅隊證明——**獎勵永不消失地基先穩**。
  完成後才進 Phase 1。此 Phase 直接回應使用者「書內已有不一致、難修」＋「獎勵別 refresh 消失」兩大顧慮。
- **Phase 1｜基盤**：知識點 id registry、unit metadata schema、hub/roadmap 骨架、獎勵 id registry ＋ migrate() ＋
  additive-merge（延續 Phase 0.5 的地基，§7.3 全綠）。
- **Phase 2｜路徑接線**：既有單元接入路徑（宣告 prerequisites/knowledge-point ids），逐檔 5 clean。
- **Phase 3｜gap 補齊**：依 §4−§5 gap，逐 stage×subject 補單元；一次一檔、每檔 5 clean。
- **Phase 4｜獎勵擴充**：在已驗證的持久化地基上新增獎勵內容（只新增 id，不動既有）。
- **Phase 5｜全書 audit ＋ 知識受限角色模擬 ＋ 視覺 QA**：loop 到零問題。
- 每個 Phase（且其中每一檔）結束即 commit，可 rollback（R8）；push 僅在使用者明說。

---

## 11. DONE-GATE（全書完成的定義）

一個檔案／全書「完成」須全部通過：
1. **逐檔 content_audit 5 連續 clean**（同一 sha），L3 coverage_check exit 0（不可用抽樣/粗分片假 clean）。
2. **簡體/PRC 詞掃描**零命中（R2）。
3. **視覺 QA（iPad Air 13"）**：全畫面/frame render（1366×1024 ＋ 1024×1366，http）、逐張 PNG 看過、
   四角色（美術/空間美感/眼科/動畫師）逐張簽核綁 sha；未簽核不得宣告完成（視覺 QA 規則檔＋ fail-closed hook）。
4. **知識受限角色模擬**（§9）：每條主要路徑零斷層、可學會、記得牢、不倦怠。
5. **獎勵紅隊**（§7.3）全綠。
6. **設計一致性**：共用元件，無私有前綴重造（design_consistency）。
7. **code-download bundle**（若該單元/模組含可執行程式，依 house 規範提供完整可執行+可驗證下載）。
8. **house 視覺/結構一致**；效能（R9）未退化。

---

## 12. 本 spec 自身的收斂協定（meta-process）

0. **附錄 A 深掘完成（前提）**：依 §4.1 各 slice 深掘到 DEPTH-STD＋各自獨立審查＋合併配 id＋emit `knowledge_points.json`。附錄 A 未深掘完成，spec 不得宣告定案。
1. 本檔先補齊 §4/§5/§7.2 回填 → 全文完整。
2. 以 `/static-doc-audit` 的 content_audit 對本 spec 跑 round，panel 判定 defect，修到
   **連續 5 round 零 panel-confirmed defect（同一未變更 sha）**。
3. **紅隊**：獨立 agent 嘗試證明「規範可被繞過/遺漏」——例如：能否跳過先備宣告而仍過 gate？
   能否新增獎勵卻讓舊獎勵孤兒化而不被 §7.3 抓到？能否讓模擬角色偷看後續知識？每找到一個繞過＝
   補一道子 gate ＋ 紅隊證明（§13 ledger）。紅隊零繞過才算定案。
4. 定案後才進 Phase 1（§10）。

---

## 13. 漏洞 / 強化 ledger（持續強化原則）

> 仿 Sidewalk `GATES-MAINTENANCE.md`：任何 gate 都不視為最終。每發現一個繞過（自己或紅隊）→
> 立即新增子 gate ＋ 紅隊（證明壞案例被擋、好案例放行），記於此表。

| 日期 | 發現的繞過 | 修補（新 gate/規則） | 紅隊結果 |
|---|---|---|---|
| （建置中累積） | | | |

---

## 14. 開放問題（待使用者拍板）

- O-1 獎勵擴充的「內容方向」（新 skin/badge 主題？成就種類？）——待 §7 地基穩後提案。
- O-2 roadmap 的視覺呈現風格（地圖式/關卡式/科技樹）——§6.1 提案時附 iPad render 比較。
- O-3 國小各科深度下限（哪些 G1–G3 內容納入 vs 以銜接為主）。
- O-4 既有哪些頁「打掉重做」vs「包裝接入」——待 §5 覆蓋矩陣出來後逐頁標記。
