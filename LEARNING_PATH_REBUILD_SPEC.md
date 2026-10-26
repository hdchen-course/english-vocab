# 全站學習路徑重構 ＋ 國小→國中→高中升學備考 建置規格（BUILD SPEC）

> 本檔為此工程的**唯一事實來源（single source of truth）**。任何規範要改，改這裡；
> 不得在實作碼裡偷偷放寬。跨 `/clear` 以本檔 + `memory/live-workstreams-2026-10-25.md` 為錨。
> 狀態：**草稿 v0.2（撰寫中，尚未定案）**。定案條件見 §12（content_audit 5 連續 clean ＋ 紅隊通過）。
> 定案前**不得進入實作**。

---

## 0. 文件控制

| 項目 | 值 |
|---|---|
| 檔名 | `LEARNING_PATH_REBUILD_SPEC.md` |
| repo | `/Volumes/workplace/EnglishTraining/english-vocab-deploy` |
| 建立 | 2026-10-26（台北） |
| 狀態 | 草稿 v0.2 — 全章節具體化中；三項偵察（§5 現況／§4 附錄 A 母體／§7.2 獎勵風險）**均已回填**；待辦＝content_audit 5 clean＋紅隊＋Phase 1 待建工具 |
| 收斂定義 | content_audit 連續 **5** round 零 panel-confirmed defect（同一未變更 sha）＋ 紅隊證明「規範無法被繞過/遺漏」 |
| 實作準則 | 一次一個檔案；每檔自身跑到 5 clean；全書 audit；知識受限角色模擬；loop 到零問題 |
| 相關檔 | `DICTATION_BUILD_SPEC.md`（聽寫系列，已上線，為流程範本）、`~/.claude/rules/visual-qa-ipad-signoff-do-not-delete.md`（視覺 QA 制度）、`../engineering/authoring/STANDING_AUDIT_SOP.md`（站級稽核契約；位於同層 engineering repo，非本 repo 的 authoring/） |

### 0.1 待回填區（偵察 agent 對應）— **三項偵察均已回填（2026-10-26）**
- **§5 現況盤點**（頁面/導覽/共用架構/覆蓋矩陣）← recon A（repo 結構，**已回填**）。
- **§4 知識點母體清單**（逐科逐 strand）← recon C（課綱）＋深掘 → **已回填（附錄 A，3092 條）**。
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

### 0.3 具體化規範（ANTI-VAGUENESS；每條規範都要「細則＋範例」，否則擋關）
> 使用者疑慮（2026-10-26）：spec 太原則化 → 同一／跨 session 都會自由心證、亂解讀。對策：**原則不算數，細則＋範例才算數**。
- 每一條規範性 §／R MUST 附：
  - **細則（operational detail）**：精確到可照做——具體欄位、門檻數值、檔名/格式、步驟、輸入→輸出；
    禁用無法量測的模糊詞（「適當」「盡量」「清楚」「友善」須改寫成可量測定義，如「≤40 字」「對比度 ≥4.5:1」「≤2 次點擊可達」）。
  - **範例 ≥3**：至少 1 個 **✅正例（compliant）**、1 個 **❌反例（violation＋為何違規）**、1 個 **⚠邊界/易混淆案例**。
- **anti-vagueness gate（fail-closed）**：(a) content_audit 對任何「只有原則、無細則、或範例 <3」的規範段判 defect；
  (b) 確定性 lint `tools/spec_concreteness_lint.py`（**已建＋已紅隊** 2026-10-26）：**章（##）級**聚合——每個規範章（**§2/§6/§7/§8/§9/§10/§11/§11.A/§12，共 9 章**）整段內（含子節，如 §8.1/§9.5/§10.1）
      必須同時含 `細則`＋`範例`＋至少一個 `❌`，否則 exit≠0；豁免章＝`EXEMPT_CHAPTERS={0,1,3,4,5,13,14}`（描述/索引/事實/已關閉；§4 明細在附錄 A）。紅隊：移除全部 ❌ 的副本 → 擋 **9 章**；真檔 → 放行。
      **細粒度 vagueness（單一子節/單一規則仍太模糊）交 content_audit 專家 panel 判**（§12），lint 擋「整章缺具體化」的粗漏。
- **章級具體化已完成（lint 綠）**：§2/§6/§7/§8/§9/§10/§11/§11.A/§12 九個規範章整段皆含 `細則`＋`範例`＋`❌`，
  `spec_concreteness_lint.py` exit 0（含 §6.6 品質恆定、§7.1/§7.2/§7.3 獎勵風險＋RT、§6.5 R-STYLE-3 自適應卡、§4.1 DEPTH-STD、§8.1 panel 細則、§9.5 受限模擬、§10.1 entry/exit）。
  **已除的 blocker**：附錄 A 全 slice 深掘＋審查（已完成，3092 條）、章級具體化（lint 綠）皆**不再是 blocker**。
  **定案 blocker 僅剩**：本 spec content_audit **連續 5 clean**＋**紅隊**（§12）兩項。
  章內單一規則若仍嫌模糊屬**細粒度 vagueness**，交 content_audit 專家 panel 逐輪判（§0.3 (c)、§12），非擋定案的粗漏。

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
- 知識點母體（§4）**每一條非-beyond（minimum）知識點**都對應到站上一個可學、可練、可自評的單元（**最終 DONE-GATE 要求 minimum 覆蓋矩陣 100%、未覆蓋 minimum id ＝ 0，無延後**；「延後項」僅為收斂過程中的 gap 清單，不是可接受的終態）；`beyond`/`t_enrich` 超綱條目不計入覆蓋門檻、可選（與 R13、AC-COV-1「未真覆蓋 minimum id＝0」及 Phase 3 exit 嚴格一致）。
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
- **R12 知識涵蓋全域（不限學科課綱）**：知識母體含「學科（課綱）」**＋**「跨課綱生活與核心能力」
  （兒少安全自保／社會情緒 SEL／學會如何學習／思考與推理／數位與媒體素養／資料素養／運算思維與科技／
  理財素養／永續與世界公民／創新）。完整清單見**附錄 A**（`authoring/KNOWLEDGE_POINT_INVENTORY.md`，本 spec 不可分割的一部分）。
- **R13 課綱＝下限，深度無上限（minimum, not ceiling）**：108 課綱／考試範圍是**必須全覆蓋的最低要求**，
  不是天花板。鼓勵收錄**超綱延伸**知識點（更深、更廣、跨學科、真正理解導向），標記 `tier:t_enrich`、`beyond:true`。
  **延伸上限 = 大學入門程度（university-intro）**：可延伸到大一普通程度（如微積分銜接、普通物理/化學/生物、線代/離散、經濟學原理…），
  以「打好銜接、滿足好奇」為度，不做研究所深度。
  **英文例外（使用者 2026-10-26）**：英文深度**完全無上限**（不受大學上限限制），**實用派為主**，優先序明確：
  **(1) 生活與實用（最優先）**——道地日常溝通、**旅居海外能生存**、**出國讀書聽得懂**（survival English／study-abroad listening）、
  慣用語/片語/口語/真實情境；**(2) 各類資格認證（次之）**——TOEIC／TOEFL／IELTS／GEPT 等；
  **(3) 台灣考試（最後）**——會考/學測英文；使用者判斷：前兩者做好，台灣考試通常自然涵蓋、出問題機率很低，故列最後。
  愈道地愈好，一切服務於「用得出來」。
  **關鍵（tier 與 exam 是兩條獨立軸，別把實用英文誤丟進 beyond）**：優先序 (1)(2) 的**生活實用／旅居生存／出國聽課／認證**英文屬**必備**，一律標在 **gated 的 minimum tier**（`t_base`…`t_sub`、`exam` 標「無」或「TOEIC/TOEFL/IELTS/GEPT」、`beyond=false`），**受 AC-COV-1 嚴格覆蓋強制**；只有「超出大學入門、純好奇延伸」的英文才歸 `t_enrich/beyond`（可選、不 gating）。如此 coverage gate 真正強制的正是使用者列為最優先的實用英文，而非只強制列為最後的台灣考試英文——不得倒置。
  **coverage gate 對「課綱 minimum」嚴格**（少一條即 FAIL）；**超綱延伸為加分、不設上限、可選、絕不 gating**，
  且同樣不曝露年段（R11）——以「想更深入？」之類中性邀請呈現，不標「超難／高年級」。

---

### 2.1 鐵律的細則與範例（§0.3 具體化；未列者之細則＋範例在各專節：R3→§7.1–§7.4、R-STYLE→§6.5/§6.6、R6→§8、R7→§12、R8→§10/§10.1（rollback）、R10→§11.A AC-VIZ-1、R11→§6.1/`no_grade_label_gate`、R12→§4.1/附錄 A、R13→§4.1）
- **R1 正確性**
  - 細則：每個題目正解 **play-through 代入題幹朗讀必須通順無誤**；事實類經領域 expert ＋ 對權威來源查核；數值/公式**可執行就跑 `.venv` 驗證**；不確定標 `(待核)` 不得當真。
  - 範例：✅「6 的因數：1,2,3,6」代入題幹朗讀正確。 ❌「水在標準大氣壓沸點 100°F」（應 100°C／212°F）。 ⚠「玉山 3952 m」——數字須對權威來源，核實前標 `(待核)`。
- **R2 全繁體、零簡體、零 PRC 詞**
  - 細則：每檔過 `scan_simplified.py`＝0 命中；禁詞表含簡體字 ＋ PRC 用語（「大陸/中國大陸」指中國、視頻、信息、軟件、硬盤、鼠標、網絡…）；「臺/台」「里（鄰里/公里）」為合法繁體。
  - 範例：✅「軟體」「這裡」。 ❌「视频」「信息」「中國大陸」。 ⚠「里」於「鄰里/公里」合法，但「裡面」須用「裡」。
- **R4 輕鬆學 ＋ 視覺化無所不在 ＋ 可玩**
  - 細則：每單元**至少 1 個視覺化或互動**（非純文字長段）；概念**先具體後抽象**；單屏資訊塊符合眼科可讀（§8-6）；「可玩」＝有即時互動回饋，非只讀。
  - 範例：✅分數用可拖曳披薩圖。 ❌整頁純文字定義、無圖無互動。 ⚠動畫過度花俏致分心/暈眩 → 違眼舒適，須可暫停＋尊重 `prefers-reduced-motion`。
- **R5 共用架構、可重抽**
  - 細則：UI 一律用共用層（`game_core`／`concept_engine`／`srs_engine`／`app.css`）；**資料與引擎分離**（sidecar JSON/TS data）；新頁不得複製共用元件 CSS 另立私有版（`design_consistency_gate` 擋）。
  - 範例：✅概念頁設 `window.CONCEPT` 餵共用 renderer。 ❌某頁自寫 `.xx-card` 複製共用卡片。 ⚠bespoke 遊戲可有自有畫面，但仍須用 `window.Game` 計分＋`app.css` token。
- **R9 效能**
  - 細則：單頁**初始 JS ≤ 同類頁基準**（Phase 1 定具體數值，AC-PERF-1）；資產按需載入；不得無限 inline 膨脹；大圖/音檔延遲載、不阻塞首屏。
  - 範例：✅flashcard 依 CEFR 級延遲載 `vocab_data_*`。 ❌把 371KB `anim_core` 無條件塞進純文字概念頁。 ⚠大型 bespoke 遊戲體積偏高 → 允許但須延遲載入＋不阻塞首屏。

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
- **INV-1 無斷層**：一個單元的「練/評」用到的每個概念，都在其**先備單元鏈中教過，或在本單元自己的「教」段落中教過**；只有「既非先備、又非本單元所教，而是路徑更後面的單元才教（或全書沒教）」的概念才算斷層。（單元引入並測試自己的新概念＝正常，不是斷層。）
- **INV-2 可學會**：依路徑學習者，在不借助「尚未教的知識」下，能完成該單元的練與評。
- **INV-3 記得牢**：關鍵知識點有 retrieval practice ＋ 間隔複習（SRS）覆蓋。
- **INV-4 不倦怠**：單元長度／認知負荷受控；難度階梯平滑；有節奏的獎勵與成就回饋。

---

## 4. 知識點母體清單（RECON C 回填）

**附錄 A ＝ `authoring/KNOWLEDGE_POINT_INVENTORY.md`，是本 spec 不可分割、BINDING 的列舉清單**（不是「參考」）。
「涵蓋數學」這種空話**禁止**出現在 spec：涵蓋什麼，必須逐條列舉在附錄 A，且每條可被 coverage gate 機器追蹤。
> 教訓（Sidewalk documents）：一開始沒把 source-code list 逐項列舉並 gate 住，成果就淺薄。本 spec 以附錄 A 列舉 ＋
> §11 coverage gate 複製其「清單驅動完整度」的做法，杜絕「挑幾個做做、其餘略過」的淺薄實作。

- **binding 列舉 ＋ 穩定 id**：附錄 A 每一條知識點都配**穩定字串 id**，**依域分兩種格式**（別宣稱單一格式）：
  - **學科域**（math／chi／eng／sci／soc-hist／soc-geo／soc-civ）：`<domain>.<tier>.<strand>.<slug>`，第 2 段＝tier（例 `math.t_mid.equation.quadratic-formula`、`sci.t_adv.phys-kin.vector-kinematics`）。
  - **跨課綱 life 域**：`life.<category>.<strand>.<slug>`，第 2 段＝能力類別（safety／sel／learn／think／digital／data／compute／finance／sustain／innovate；例 `life.safety.online.grooming`）；**life 的 tier 不放 id、只存 manifest `tier` 欄**。
  兩域的 `tier`（t_base／t_mid／t_adv／t_sub／t_enrich）皆為**內部難度階**（非學制、learner 端不顯示，R11）；id 一經指派不得改語意（與 §7 獎勵 id 同哲學）。**解析 tier 一律讀 manifest `tier` 欄，不得純以 id 位置推斷。**

  **tier 語意對照表（唯一定義；與附錄 A 檔首、`tools/_kp_build.py` VALID_TIERS 一致）：**

  | tier | 內部對應範圍 | coverage 性質（R13） |
  |---|---|---|
  | `t_base` | 基礎層（約當國小基礎、入門打底） | minimum（嚴格全覆蓋） |
  | `t_mid` | 中階層（約當國中會考範圍） | minimum（嚴格全覆蓋） |
  | `t_adv` | 高階層（約當高中學測範圍） | minimum（嚴格全覆蓋） |
  | `t_sub` | 分科深階層（約當高中分科測驗／選修深水區） | minimum（嚴格全覆蓋） |
  | `t_enrich` | 超綱延伸層（跨學科、大學入門；英文無上限） | beyond（鼓勵但不列 coverage 門檻；`beyond=true ⟺ tier==t_enrich`） |

  > 「約當」僅為內部難度定位，**不是** learner 端顯示字串（R11）；coverage gate 只對 `beyond=false`（即 `t_base`／`t_mid`／`t_adv`／`t_sub`）的 id 嚴格要求（AC-COV-1）。
- **機器可讀 manifest（已產出；Phase 1 起正式納管/驗證）**：已由附錄 A 建置時 emit 於 `authoring/knowledge_points.json`（已存在、已驗證 count=3092），一列一 id，欄含
  `{id, domain, tier, strand, title_zh, exam, beyond, src, line, status, unit_ids[]}`（與 `tools/_kp_build.py` 實際輸出一致：`exam` 為單一字串如「無/會考/學測/分科-生物」；`beyond` 為布林，`beyond=true ⟺ tier==t_enrich`（超綱，R13）；`unit_ids[]` 由實作填）。此 manifest 是覆蓋追蹤與 §6.2 unit metadata 的連結鍵。
- **涵蓋全域（§2 R12）**：附錄 A 含 (甲) 學科課綱（國小/國中/高中內部 tier）＋ (乙) 跨課綱生活與核心能力
  （安全自保／SEL／學會學習／思考推理／數位媒體素養／資料素養／運算思維科技／理財／永續世界公民／創新）。
  目前量（見附錄 A／manifest，已完成）：**總計 3092 條**＝學科 2711（chi 355／eng 296／math 263／sci 986／soc-civ 322／soc-geo 355／soc-hist 134）＋跨課綱 life 381。
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
  各跨 `t_base` 基礎／`t_mid` 中階／`t_adv` 高階／`t_sub` 分科深階 四內部 tier（定義見 §4 tier 語意對照表），
  並視需要加收 `t_enrich` 超綱延伸（beyond）。**跨課綱域**：安全自保／SEL／學會學習／思考推理／數位媒體素養／資料素養／
  運算思維科技／理財／永續世界公民／創新（section G）。
- **原 598 條粗胚已被取代（完成式）**：10 域 expert 平行深掘已完成，附錄 A 現為 **3092 條**（各 slice count 已重列，見附錄 A 檔首與 manifest）；598 僅為歷史起點，不再引用。
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

> RECON A 已回填（見下 §5.1–§5.5）：5.1 全頁面清單（檔名→科目/年段/KB）；5.2 現行導覽與路徑機制（hub／roadmap／平面清單、有無先備關係）；
> 5.3 共用架構（game_core/srs_engine/app.css 提供什麼、哪些頁重用 vs bespoke）；5.4 典型單元資料/引擎模式；5.5 (科目×年段) 覆蓋矩陣（有內容 vs 缺/薄）。
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
| 設計 token/元件 CSS | `assets/app.css`（~56KB，token 單一來源＝§6.5 R-STYLE-1：色/間距 `--s*`/圓角/`--tap-min`/`--content-max`） | 每頁必 link；**style 單一來源**（§6.5） |
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
| 科技（運算思維） | ◐ | ◐ | ◐（hub `#path-tech` 有頁但薄；為 §4.1 section G `compute` strand，於此獨立列出避免被「核心能力」吞沒；精確 per-年段覆蓋待 Phase 1 manifest 對映時逐頁盤點精算） |

**結論：高中(G10–G12) 全面最弱**——三自然科 advanced 封頂於國中、數學止於 RSA 無微積分、國文僅 primer；
國小/國中大致齊全；社會歷地公被綑在共用 `social_advanced*`，未依 strand/年段分離。這決定 §4−§5 的 gap 主要落在**高中段**與**社會分流**。

---

## 6. 學習路徑重構設計（設計原則＋具體 backlog；輸入＝§4−§5.5 gap，已回填）

### 6.1 導覽與路徑結構
- 單一**中央 hub**：以 stage → subject → strand → unit 的層次呈現；顯示每單元狀態（建議先修/就緒/進行中/已精熟，**四態皆可隨時開啟**）。
- **先備關係（DAG）＝建議，不是門鎖**：每單元宣告 prerequisites；hub 以此**排序與建議**下一步、並在先備未達時給**非強制提示**（見下 R-OPEN），**不鎖定、不禁止打開任何節點**。
- **R-OPEN 不鎖定鐵律（learner 自由瀏覽）**：
  - **任何節點/頁隨時可開**：**嚴禁** disabled／灰掉不可點／隱藏於鎖頭／跳「尚未解鎖」擋下。先備未達**只**顯示**非強制**的黃色提示條「這課會用到 ○○、△△；還不熟的話建議先看 →（連結）」，但內容照常全開、可直接學。
  - **隨時可瀏覽全部內容並直達（但「瀏覽全部」＝分區逐層 drill-down，非一屏攤開全部）**：除漸進揭露的預設視圖外，**永遠提供**一個常駐入口能看到「到底有什麼」並點進任一頁——至少含 (a)「瀏覽全部／完整目錄」：一棵**可達全站**的樹，但**預設各層收合、一次只展開點到的那一區**（科目→strand→級別→單元逐層點開），**嚴禁**初次或任何單一動作把全科目×strand×級別×單元一次攤在同一畫面（會「一眼不想看」，與 ND 漸進揭露同一鐵律）；(b)**搜尋**（打關鍵字跳任一單元/頁）；(c) 地圖可自由縮放平移到任何區。設計意圖：**可達性 100%（任何內容都看得到、到得了），但呈現永遠分區逐層、每屏資訊量受控**。漸進揭露是**預設聚焦**，不得成為「看不到／到不了其他內容」的牢籠；「瀏覽全部」也不得反向變成「一屏傾倒全部」。
    - ❌例：點「瀏覽全部」即展開 9 科 × 所有 strand × 所有級別 × ~3092 個知識點於同一長頁（資訊轟炸，違 ND）。✅例：點「瀏覽全部」先只見 9 個科目列（收合）；點「數學」才列其 strand（仍收合）；點「數與量」才列初/中/高級；點某級別才列該頁單元——每一步只增一層、每屏皆可一眼掃完。
  - **起點自選、不強制由初級起**：learner 可**自選起點或直跳任一級別**（例：國中程度者直接進「中級」，不被逼先看「初級」——強逼回頭看簡單的只會讓人不想看）。系統**不預設把人丟到初級**；可選的「快速定位/小測」僅為**建議**用、可略過，絕不作為開啟門檻。
  - 動機哲學：引導而不設限——給方向與鷹架，但尊重自學者隨時跳看的自由（§8 #7 心理醫生、#4 學習科學、#10 PM）。
- **路徑而非平面清單**：提供「建議學習順序」的視覺化 roadmap（可玩、具成就感），但允許自由探索。
- **roadmap 視覺風格（O-2 定案 2026-10-26）＝科技樹（主幹）＋地圖式美術（外觀）**：以**節點＝單元、連線＝先備關係**直接把 §6.1 的 DAG 畫成科技樹；
  節點 4 狀態（建議先修／就緒／進行中／已精熟，**四態皆可點開**，無「鎖定」態），非只靠顏色區分（附圖示/形狀，眼科 §8-6）。**不顯年段字樣（R11）**、純 `app.css` token（R-STYLE）、
  過 viz-QA（iPad 逐 frame 簽核）。美術可走「地圖/島嶼」風格包裝，但底層資料是先備 DAG，不得為美觀假造不存在的關卡順序。
- **節點 ↔ 單元 ↔ 頁 的銜接（與 §6.2 GR 一致，杜絕「點了不知落哪」）**：roadmap **節點＝單元（unit）**；一個「科目×strand×tier 頁」是同主軸同級別**多個 sibling 單元的容器**，在地圖上呈現為**一叢相鄰節點**（或可收合的群組地標，群組標題＝該頁級別名如「數與量（中級）」）。點任一節點＝**深連到該單元所在頁 ＋ 頁內 anchor**（捲動/高亮該單元），不另開一檔。故「瀏覽單位＝單元、檔案單位＝strand×tier 頁」並存不衝突：導覽以單元為節點、落點以頁+anchor 實現。導覽層級對映：stage/subject/strand＝**地圖分區**、strand×tier＝**頁（節點叢）**、unit＝**節點**。
- **ND 漸進揭露鐵律（anti-overwhelm；全站 ~600+ 頁，首屏絕不可把人「一眼擊垮」）**：
  - **禁止 first-paint 傾倒全圖/長清單**：任何畫面初次載入**不得**一次渲染全部節點或一條超長捲動清單。首頁只顯示三樣：(a) **單一最醒目的「接著學這個／今天建議」CTA**（1–3 個當前可學節點，回訪者一眼知道下一步）；(b) **少數頂層分區入口**（科目/大島，**≤ 12 個**）；(c) 精簡**總進度概覽**（非逐節點）。
  - **地圖預設縮放在「分區/島」層、逐層展開**：進科目先看 strand 島嶼（**收合態**）；點某島才展開其級別（tier）與單元節點——**一次只深入一區**，不同時攤開所有 strand×tier。
  - **聚焦前緣（視覺焦點，非門鎖）**：預設**高亮少數「就緒」節點**（建議前緣）；已精熟者淡化/收合，較遠節點以**輪廓/淡化**呈現（給方向感、降壓迫）。預設視野**可見節點數有上限**（建議 ≤ ~15，其餘摺疊）。**但此僅為預設聚焦**：任何淡化/摺疊節點都能一鍵展開並點進去（呼應 §6.1 R-OPEN「隨時瀏覽全部並直達」），**不得**用霧區當作「看不到/到不了」的變相鎖定。
  - **單一明確下一步**：回訪永遠有**一個**最明顯的「繼續」動作，不是 600 選 1。
  - **受把關角色**：§8 #4 學習科學（降認知負荷/chunking）、#7 心理醫生（不被擊垮、持續成就感）、#9 空間美感、#10 PM（讀者旅程）、#6 眼科；首屏與每層展開畫面納入 viz-QA 逐 frame 簽核（R10）。
  - ❌例：首頁一次 render 全部 ~600 節點、或一條把所有 strand 列完的長清單（違 ND，擋關）。✅例：首頁＝1 個「繼續：分數加減（中級）」大卡 ＋ 9 個科目島 ＋ 一條總進度；點「數學島」才展開其 strand，點「數與量島」才展開初/中/高級節點。

### 6.2 單元設計規格（每個 Unit 的統一骨架）
- **粒度與檔案映射鐵律（R-GRAIN；杜絕「一知識點一檔」誤解與檔名爆炸/連鎖改名）**：
  - **知識點 ≠ 單元 ≠ 檔案**。知識點（附錄 A 3092 條）是**標籤**（micro-skill id），用於覆蓋追蹤（manifest `unit_ids[]`），並作為 §9 知識隔離／先備計算（K(U)=K_pre∪teach(U)）與 §6.6 rubric⑦「真教真考」綁定的**連結鍵**；但**不作為檔案/頁的切分依據**——**嚴禁「一個知識點生一個 HTML 檔」**。
  - **單元（unit）**是一個「教→練→評」小叢集，`knowledge_point_ids[]` 為**清單**——一個單元可掛**數個相關知識點**；單元大小以**認知負荷**（`est_minutes≤12`、不過載 INV-4）為界，**不以「每條知識點各一單元」為界**。
  - **一個 HTML 頁可容納多個單元**（unit＝頁內區塊/stepper，沿用現站「一頁多概念」模式）；**不得**為了對映知識點把站點炸成數百~上千個檔。
  - **既有檔名/路徑一律穩定**：reuse 的頁**原地包裝、保留原檔名與路徑**；rebuild 只改**內容**不改檔名；**禁止大規模改名/搬移**（否則書籤、跨頁連結、獎勵 `progKey`、git history 全斷，牴觸 never-disappear 精神）。確有必要改名＝例外，須附 redirect ＋ `progKey` 遷移對照並納入 §7.3 紅隊；預設**不改名**。新增頁才給新檔名。
  - **頁面分組規則（GR；可從知識點 id 機械推導，稽核一眼對得上）**：
    - **預設分組＝一個「科目 × strand（主軸）× tier（級別）」一頁**。**段位抽取（兩域不同，須分開）**：學科域 `<domain>.<tier>.<strand>.<slug>`→ tier＝第 2 段、strand＝第 3 段；life 域 `life.<category>.<strand>.<slug>`→ 第 2 段是 category（當 subject 分區用）、strand＝**第 3 段**、**tier 不在 id**。**tier 一律讀 manifest `tier` 欄，不得純以 id 位置推斷**（呼應 §4）：學科域 manifest tier 恰等於 id 第 2 段、life 域則只能自 manifest 取。該頁 host「此主軸、此級別」的所有單元（頁內節點依 `prerequisites` 由淺到深）。例：`math.t_base.numquant.*` → 頁「數與量（初級）」、`math.t_mid.numquant.*` → 頁「數與量（中級）」（strand `numquant`＝「數與量」，見附錄 A §一；勿誤名為「數論」number theory）——**不把一個主軸從國小到高中塞進單一巨頁、不混級**。
    - **級別頁名用中性難度詞、不曝露年段（R11 鐵律）**：tier→級別對照＝`t_base→初級`、`t_mid→中級`、`t_adv→高級`、`t_sub→進階`、`t_enrich→延伸挑戰`；頁名**只能**用這些中性詞，**嚴禁**「國小/國中/高中/年級/會考/學測/分科」等年段字樣（`no_grade_label_gate` 掃描）。
    - **防碎片併頁（唯一允許的偏離，機械可判）**：某 `(科目,strand,tier)` 的 minimum 知識點數 **≤3** 時，**併入同 strand 相鄰的較低級別頁**（無較低級則併較高級），避免只有 1–2 條的空頁；併入後該頁名仍取主級別、頁內分段標注。此門檻（≤3）寫死、非主觀。
    - **拆頁條件**：若某頁觸 **R9 效能預算**（初始 JS/體積超標或低階裝置卡頓），再依 slug 群組拆子頁（檔名加後綴），仍保留 id→頁可推導、既有檔名穩定。
    - **某知識點的 home 頁可機械推導**：學科域＝(domain, strand=第3段, tier=第2段)→頁；**life 域＝(category=第2段, strand=第3段, tier 取自 manifest `tier` 欄)→頁**（因 life id 不含 tier）；兩者皆再套上述併頁規則。故 `coverage_gate`／稽核可機械核對「每個 minimum id 落在其應屬的頁、且該頁有真教真考的單元」，無模糊空間。
    - **既有頁沿用此對映**：把每個既有檔標記其 (科目,strand,tier) 歸屬、**保留原檔名**；同一 (strand,tier) 現況散在多檔者以 roadmap 串起、**不強制合檔**（合檔＝改名風險，預設不做）。
    - ✅例：`數與量（初級）`＝`math.t_base.numquant.*`、`數與量（中級）`＝`math.t_mid.numquant.*` 各一頁（條數以 manifest 實際為準）。❌例：(a) 一頁「數與量」從國小塞到高中混級（違預設級別分頁）；(b) 頁名叫「數與量（國中）」（違 R11 年段）；(c) 為單一 slug `present-perfect` 另開一檔（違粒度：同 strand,tier 內各 slug 是頁內單元，不另立檔）。
- `教`：概念具體化／視覺化（圖解或互動 stepper），符合 §3.3 INV 與 R4；eye-comfort（§8-6）。
- `練`：可玩、即時、低門檻；題型契合該知識點（如數學非選要能寫步驟）。
- `自評`：翻答案→三級自評（還不熟/快會了/會了）→ 餵 SRS（srs_engine）；**不假裝自動判讀**。
- `metadata`：`unit_id`、`stage`、`subject`、`strand`、`knowledge_point_ids[]`、`prerequisites[]`、
  `est_minutes`（認知負荷/倦怠控制）、`deviation_reason`（**條件性/選填**：僅在偏離 §6.6 細則① golden 範本時必填，供 AC-UNIT-3 讀取；不偏離則省略）。
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

#### 6.2.1 單元骨架範例（§0.3）
- ✅**正例**：`eng.t_mid.verb.present-perfect` 單元＝教（時間軸動畫示現「已完成且與現在有關」，token 色）→ 練（看情境選 have/has＋填空，即時回饋）→ 評（翻答案→三級自評→SRS）；metadata 齊（`prerequisites:["eng.t_mid.verb.past-simple-irregular"]`、`est_minutes:8`）。
- ❌**反例**：一個單元塞「現在完成＋過去完成＋完成進行」三概念、`est_minutes:25`、只有教學文字無練無評 → 違 R4/§6.6①、INV-4（過載）、`est_minutes>12` → 擋關、須拆成 3 單元。
- ⚠**邊界**：純聆聽單元（無文字輸入）→ 仍須「教＋至少一個 retrieval（如聽後選圖/口說跟讀）＋自評」，不得只播音檔就算完成。

### 6.3 進度與精熟
- 逐單元進度存 localStorage；精熟由 SRS 狀態 ＋ 自評歷史決定。
- **逐單元進度的統一納管規則（兌現 §5.4 指派：progKey 與主 `player_profile_v1` 如何統一而不破壞 §7 永不消失）**：
  - **細則**：
    1. **獨立 key、不寫入 `player_profile_v1`**：進度存於獨立 key **`learning_progress_v1`**（與獎勵 key 分離——§7.2 已定 `player_profile_v1` 只由 `game_core.js` 寫入，進度模組不得改寫它，避免兩寫者互毀）。
    2. **穩定命名**：`learning_progress_v1.units[<unitId>]`，`unitId`＝單元穩定 id（源自 §4 知識點 id／§6.2 GR，隨檔名穩定而穩定）；值含 `{srsState, selfRatings[], lastSeen, mastered:bool}`。**嚴禁用陣列索引或頁順序當鍵**（改版會錯位，牴觸 never-disappear）。
    3. **與獎勵的對映（解耦但可連動）**：進度前進**事件**可呼叫 `window.Game` 發獎勵，寫入落在 `player_profile_v1`；進度本身留在 `learning_progress_v1`。兩 key 各自持久化，互不覆寫。
    4. **沿用 §7.1 的三道保護**：`learning_progress_v1` 一律套 §7.1（a）**壞檔不重設**（解析失敗→備份 `learning_progress_v1__corrupt_<ts>`、保留記憶體值、絕不空白覆寫）、（b）**additive 合併**（只補缺省不覆蓋既有）、（c）**真實 migrate()**（讀存檔 `version` 欄比對當前常數逐版遷移，不讀自我恆等值）。
  - **範例**：✅ 完成 `eng.t_mid.verb.present-perfect`→寫 `learning_progress_v1.units["eng.t_mid.verb.present-perfect"].mastered=true`，另呼叫 `Game` 加 XP（落 `player_profile_v1`）；重整後兩者皆在。
  - ❌**反例**：把逐單元進度塞進 `player_profile_v1`（與 game_core.js 搶寫、違 §7.2 單一寫者）、或用 `units[3]` 索引當鍵（改版錯位）、或進度壞檔時以空白物件覆寫（違 §7.1 壞檔不重設）。
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
- **R-STYLE-4 機器強制（fail-closed）**：`design_consistency_gate.js`（**待建**：接用 static-doc-audit skill 既有同名 gate，Phase 0.5 前接線+紅隊；`SDA_CSS=app.css,game_core.css`）偵測私有重造即 DENY；
  新增一道（待建）**content-card 寬度 lint**：偵測卡片類別用固定 `width:` 或 `width:100%` 而未用 `fit-content`+cap → DENY。
  兩者連同簡體掃描、視覺 QA 簽核，進專案 `.claude/settings.json` 的 PreToolUse/Stop hook。gate 誤擋先修 gate＋紅隊。
- **R-STYLE-5 既有不一致 remediation**：先盤點全站「卡片/按鈕/色碼硬編/私有重造」清單，統一到 token ＋ R-STYLE-3
  自適應卡，**再**開新內容（§10 Phase 0.5）。否則越補越亂。

### 6.6 品質恆定（ANTI-QUALITY-DRIFT：凍結黃金範本 ＋ 單元驗收 rubric ＋ 逐單元同一 gate）
> 使用者疑慮（2026-10-26）：產出的東西**品質會飄**——不同 session／agent 做出來不一樣。對策：凍結「好的樣子」，每個單元用**同一把機器尺**量。
- **細則：**
  1. **黃金範本單元（golden unit，凍結）**：每種原型（概念頁／bespoke 遊戲／flashcard）先各做 1 個到滿分 bar，commit 凍結為
     `authoring/golden/<archetype>.html`（＋其資料）。之後每個新單元 MUST 與對應 golden 做結構 diff（相同的區塊骨架、共用 class、互動模式、a11y、viz 規格）；偏離須在 unit metadata 寫 `deviation_reason`，否則 gate 視為漂移。
  2. **單元驗收 rubric（逐條 pass/fail，全過才算完成）**：① 教→練→評三段齊備；② 僅用 `app.css` token、零硬編色碼／px 魔術數（design_consistency_gate）；
     ③ 內容卡自適應寬（R-STYLE-3）；④ **每個題目正解 play-through 代入朗讀語句通順無誤**（correctness；play-through-sim）；⑤ 自評三級＋寫入 SRS、不假裝自動批改；
     ⑥ 繁體零簡體零 PRC（scan_simplified）；⑦ `knowledge_point_ids[]` 全部對映到附錄 A 既有 id、`prerequisites[]` 已宣告且無循環，**且每一條宣告的 id 必須「真教＋真考」**——在「教」段落實際教授該微技能、且「練/評」至少有一題 retrieval 涵蓋它（**禁止宣告塞 id 卻不教不考**；declaration-stuffing＝fail，杜絕 §4 淺薄覆蓋，供 AC-COV-1 核對）；⑧ `est_minutes ≤ 12`（過長拆單元，INV-4）；
     ⑨ viz 逐 frame iPad Air 13 render＋四角色簽核（R10）；⑩ 含可執行碼則附 code-download bundle 並從乾淨解壓可執行。
  3. **同一 gate、逐檔（頁）、不可抽樣**：每個**檔案（頁）**跑 per-file content_audit 到 5 clean（頁內各單元的驗收走 AC-UNIT-1 的 per-unit rubric，粒度分開） ＋ `tools/unit_acceptance_lint.py`（待建，機械驗 ②③⑥⑦⑧⑩ ＋ **golden 結構 diff：與對應 `authoring/golden/<archetype>.html` 比對，偏離而 unit metadata 無 `deviation_reason` 即 FAIL**，對應 §11.A AC-UNIT-3）＋ 視覺 QA；
     全過才得併入學習路徑、才可宣告完成。rubric 任一項 fail＝擋關（fail-closed）。
- **範例：**
  - ✅**正例** `math.t_mid.equation.quadratic-formula`：教（配方法動畫，純 token 色）＋練（可玩、即時回饋）＋評（翻答案→三級自評→SRS）；
    卡自適應寬；`est_minutes:9`；正解代入朗讀通順；viz 逐 frame 簽核；`knowledge_point_ids:["math.t_mid.equation.quadratic-formula"]` 存在於附錄 A。rubric ⑩項全綠。
  - ❌**反例**：某單元用 `#3b82f6` 硬編藍（違②）、作答後只顯示「對/錯」無三級自評（違⑤）、填空正解代入後「他把把書放桌上」重字不通（違④）、
    `knowledge_point_ids:["math.quadratic"]` 在附錄 A 查無（違⑦）→ 四項 fail，擋關、不得併入。
  - ⚠**邊界**：純閱讀型概念（無選擇題）→ 仍須「教 ＋ 至少一個 retrieval 練習（如填空/自問自答）＋ 自評」，**不得只有教學文字就當完成**（否則記不牢，違 INV-3／rubric①）。

---

## 7. 獎勵系統擴充 ＋「永不消失」保證（RECON B 回填風險點；設計原則如下）

### 7.1 設計原則（偵察無關）
- **穩定字串 id**：所有可賺得物（skin/border/badge/shop item/成就/解鎖）以穩定字串 id 識別，
  **絕不用陣列 index**；catalog 擴充只新增 id，不重用/不改既有 id 語意。
- **additive 合併**：讀檔時只「補缺省、不覆蓋既有」；絕不以 freshProfile 整個覆寫 storage key。
- **真實遷移 migrate()**：讀取**存檔 profile 的 `version` 欄**（§7.2 R2 指出 game_core.js 目前 `version: CONFIG.schemaVersion` 有寫無人讀），與當前 `CONFIG.schemaVersion` 常數比對以驅動逐版 migrate；**切勿改讀自我恆等的 `CONFIG.schemaVersion`**（永遠等於當前版、偵測不到舊檔＝migrate 永不觸發，牴觸 never-disappear/RT-4）。新欄位用遷移補齊，舊的賺得資料保留。
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
- **RT-9（對應 R8 原子性）：人為把記憶體中某已賺得欄位清空（如 `owned=[]`）後觸發 save → 驗證「寫前快照／異常回滾」保全該欄位，壞寫入不落地**（證明單欄誤清不會整物件持久化覆寫）。
- **RT-10（對應 R3 reset 守門）：`reset('all')` 必須二次使用者確認且不可由非使用者路徑（程式自動/事件/他分頁）觸發全清**；植入一個非使用者路徑呼叫 reset → 須被擋、已賺得保留。
- **RT-11（對應 R4 已裝備物下架）：裝備某 skin/border → 下架或改名其 catalog id → reload → 該 owned+equipped 物件 graceful 存活**（保留為已擁有或占位、不報錯、不清除）；有別於 RT-2（只測 badge/R5 被動顯示），RT-11 專測 `wish_shop byId`／`isOwned`／equipped 渲染路徑。

---

### 7.4 獎勵內容方向（O-1 定案，2026-10-26）＋ 靜態站可行性鐵律
> 使用者授權由我決定方向，但下鐵律：**本站無 backend**——不是什麼都能做、也不是什麼都有意義。獎勵必須 (a) 純前端/localStorage 可實現、(b) 對學習真的有意義（綁真實里程碑，不是純點擊刷量的花招）。
- **細則（可做的獎勵種類，全部 additive＋穩定 id，依 §7.1–§7.3）：**
  1. **主題皮膚 skin**：切換 `app.css` token 調色盤（不改結構，純變數）；穩定 id `skin-*`。
  2. **邊框/頭像框 border、吉祥物 mascot、頭像 avatar**：SVG/CSS 繪製；id `border-*`/`mascot-*`。
  3. **成就徽章 badge**：**必須對映真實學習里程碑**——如「精熟某 strand 的全部 knowledge_point」「連續學習 N 天」「retrieval 正確 N 次」「完成一條路徑」；id `badge-*`，存 `profile.badges`。
  4. **收集冊 stickers / worddex 式卡冊**：本地相簿，蒐集已精熟的概念卡（站上已有 worddex 模式可延用）。
  5. **進度型外觀解鎖**：達里程碑解鎖上述外觀。
- **靜態站可行性鐵律（禁止，因無 backend 或無意義）：**
  - ❌ 與他人比較的**排行榜/真人對戰/好友系統/雲端同步/跨裝置**（需伺服器）。
  - ❌ 伺服器端**防作弊驗證**、真實金流、每日「雲端」任務。
  - ❌ 純花招徽章（「點 100 下」「停留 10 分鐘」這種與學習無關、刷量可得）。
- **範例：**
  - ✅**正例** `badge-math-alg-master`：精熟 `math.t_mid.alg.*` 全部 knowledge_point 後頒發，存 `profile.badges`，reload 不滅（§7）。有意義、純本地可驗。
  - ❌**反例** `badge-top3-this-week`（本週全站前三名）：需伺服器比較 → 違可行性鐵律，禁止。
  - ⚠**邊界** `badge-streak-7`（連續 7 天）：本地 `streak` 可算、合法，但**連續中斷的定義與時區**要寫清楚（以裝置本地日期計、提供 freeze），避免跨裝置誤判——屬可做但需明確規格。

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
| 12 | 動畫師（animator） | **每個 frame**：無重疊/裁切/溢出、箭頭指向正確、frame 間尺寸恆定、時間節奏順、無破圖 | 評動畫逐 frame（R10／§11 第3項（視覺 QA）／AC-VIZ-1 的「四角色」之一） |
| 13 | 翻譯者（translator，繁中⇄英） | 中譯英/英文作文/雙語對照的**譯文正確與忠實度**；**唯一可判「誤譯」者**（§8.1 規則③） | 可取得雙語對照與原文語意；僅評譯文忠實，不評學科正確性 |

- **viz-QA 四角色＝美術設計（#8）／空間美感（#9）／眼科（#6）／動畫師（#12）**，對應 R10／§11 第3項（視覺 QA）／AC-VIZ-1 的逐張簽核；此四角色為**必備**（與視覺 QA 規則檔一致）。
- 角色 1–10、12、13 為**審查透鏡**（找缺陷）。角色 11 為**路徑驗證器**（證明 INV-1..4）。
- 必要時可增角色（如各科教練、無障礙 QA），但**不得少於**上列 13 個（含 #12 動畫師、#13 翻譯者）。

### 8.1 專家 panel 運作細則與範例（§0.3 具體化）
- **細則**：每個單元/章 publish 前，由上表角色 panel 逐一裁決（沿用 static-doc-audit `content_audit` 的裁決規則）：
  ① 領域專家判「資訊錯誤」＝defect（最高）；② 否則 PM 的「out-of-scope」裁決優先；③ 否則該準則**擁有者**的 defect 票決定（只有翻譯者能判「誤譯」）；④ 否則多數決。
  角色 1（領域專家）可見全部正解；**角色 11（知識受限學習者）僅見 K(U)**（§9.2），兩者不可混用同一 agent。每個 defect 必附 file:line＋理由；修完該角色重判。
- **範例**：
  - ✅**正例**：某數學單元——領域專家確認公式正確、學習科學家確認「先具體後抽象」、眼科確認 iPad 字級可讀、角色 11 模擬 `pass` → 全綠通過。
  - ❌**反例**：單元僅作者一人自審即宣告完成（違 R6：必多-agent＋獨立對抗式 reviewer）→ 不算通過。
  - ⚠**邊界**：native-English 與翻譯者對某英文例句中譯有歧見 → 依規則③「只有翻譯者能判誤譯」→ 由翻譯者裁決，不走多數決。

---

## 9. 知識受限學習者模擬協定（核心驗證）

### 9.1 目的
證明學習路徑滿足 §3.3 的 INV-1..4：無斷層、可學會、記得牢、不倦怠。

### 9.2 知識隔離（關鍵機制）
- 模擬一個學習者走到路徑上的單元 U 時，給該 agent 的**可取得知識 K(U) = (U 先備單元鏈所教知識點之聯集 `K_pre`) ∪ (U 自己「教」段落所授知識點 `teach(U)`)**；
  **不給** 路徑更後面單元才教的任何概念/詞彙/技巧（亦即不得偷看 U 之後的內容）。先讀先備、再讀 U 本身的「教」，然後才作 U 的「練/評」——這正模擬真實學習者：帶著先備知識、上完這一課、再做本課練習。
- 操作化：以 §6.2 的 `knowledge_point_ids` ＋ `prerequisites`，K_pre ＝ `prerequisites` 遞移閉包所涵蓋的 `knowledge_point_ids`；teach(U) ＝ U 自己宣告的 `knowledge_point_ids`；K(U) ＝ 兩者聯集；
  模擬 prompt 載入 K_pre 的教學摘要 ＋ U 本身的「教」內容，明令「只能用 K(U) 內的知識作答，遇到不在 K(U)（即路徑更後面才教）的概念要回報為斷層」。

### 9.3 判定
- **斷層（INV-1 違反）**：U 的練/評要求用到**既不在 K_pre、也不是 U 自己教的**概念（即落在 K(U) 之外、僅由路徑更後面單元所教或全書未教）→ defect（需調整先備鏈、補前置單元、或把該點設為 U 先備）。
- **學不會（INV-2）**：在 K(U) 下無法完成練/評 → defect。
- **記不牢（INV-3）**：關鍵知識點無 retrieval/spacing 覆蓋 → defect。
- **倦怠（INV-4）**：由心理醫生＋學習科學家依「單元過長/負荷過重/難度跳階/回饋稀疏」共判 `burnout_risk∈{low,med,high}`，門檻**三級**（與 AC-PATH-2 單一一致，可機械判定）：
  `high` → **defect**（擋關，必修：拆長/降載/補階/加回饋後重判）；`med` → **不擋關但須於模擬輸出附緩解說明**（mitigation 欄非空）；`low` → pass。
  即 AC-PATH-2 的 `burnout_risk≤med` PASS ⟺ 本處 `high` 才算 **INV-4 倦怠 defect**（注意：「斷層」為 INV-1 專用詞、受 AC-PATH-1 的零斷層 gate；倦怠 defect 不計入 INV-1 斷層）；`med` 以「附緩解說明」放行、不得無說明放行。

### 9.4 執行
- **「主要路徑」定義（gate 範疇，須可滿足）**：取 §6.1 先備 DAG 中每個學科/strand 的一組 root→leaf 路徑，**其聯集必須走過 DAG 的每一個單元**（即不存在「不落在任何被模擬路徑上」的單元；孤立節點也各自成一條單點路徑）。這保證每個非 `beyond` minimum KP 的 home 單元都至少被模擬一次，`taught_kps_exercised` 必產生 → AC-COV-1 可滿足。
- 全書實作完成後，對每條主要路徑跑知識受限模擬；發現斷層→修→重跑，loop 到零斷層。
- 模擬為**獨立 agent**，知識邊界由協定強制（prompt 僅注入 K(U)），不得讓它偷看後續內容。
- **覆蓋與模擬的分工（避免 gate 不可滿足）**：AC-COV-1 的「真教真考」綁定**主由每單元 `unit_acceptance_lint` rubric ⑦ 驗證**（對全部單元執行，與路徑選取無關）；§9 模擬的 `taught_kps_exercised` 為路徑端二次確認。因上一條已保證路徑聯集走過所有單元，兩者皆可滿足、不互相造成死結。

### 9.5 細則與範例（知識受限模擬；本節為 §0.3 具體化範本）
- **細則：**
  1. 輸入＝目標單元 U 的 `unit_id`。計算 **K_pre** ＝ U 的 `prerequisites` 遞移閉包所涵蓋的全部 `knowledge_point_ids` 聯集；**teach(U)** ＝ U 自己宣告的 `knowledge_point_ids`；**K(U) ＝ K_pre ∪ teach(U)**（即「先備所學」＋「本課所教」；只排除路徑更後面單元才教的點）。
  2. 模擬 agent 的 prompt **注入 K_pre 的教學摘要 ＋ U 本身「教」段落的內容**，並明令：「可用 K(U)（先備＋本課所教）內的知識作答；遇到不在 K(U)（即更後面才教）的概念即停、回報斷層並指出缺哪個先備」。嚴禁注入 U 之後才教的內容。
  3. 輸出格式固定：`{unit_id, result: pass|blocked, gaps:[{missing_concept, where_used}], learnable:bool, retention_ok:bool, burnout_risk:low|med|high, mitigation, taught_kps_exercised:[...], notes}`。
     其中 `mitigation` ＝ 當 `burnout_risk=med` 時必填的緩解說明（`high`/`low` 可空）；AC-PATH-2 的 med 放行判定讀此欄（欄名與 §9.3、§11.A 一致）。
     `taught_kps_exercised` ＝ 模擬實際在「練/評」用到的 `teach(U)` 知識點 id 清單，供 AC-COV-1 核對「宣告即真教真考」（見 §6.6 rubric ⑦、§11.A）。
  4. 門檻：一條路徑上每個 U 皆 `result=pass` 且 `gaps=[]`，該路徑才算無斷層（INV-1）；任一 `blocked` → 調整先備鏈或補前置單元 → 重跑，loop 到零斷層。
- **範例：**
  - ✅**正例**：U＝`math.t_mid.equation.quadratic-formula`（公式解即 teach(U)，由本課「教」段落教授），其 prerequisites 閉包 K_pre 已含「因式分解解一元二次、配方法、平方根運算、正負數」→ 學習者讀完先備＋本課即能推導並套用公式解，練/評所用皆在 K(U)=K_pre∪teach(U) 內 → `result:pass, gaps:[]`。（單元測自己剛教的公式＝正常，非斷層。）
  - ❌**反例**：U 的練習第 3 題用到「判別式 Δ＝b²−4ac」，但該知識點 `math.t_mid.equation.quadratic-discriminant` 排在 U 之後、不在 K(U) → `result:blocked, gaps:[{missing_concept:"math.t_mid.equation.quadratic-discriminant", where_used:"練習第3題"}]` → 須把 discriminant 設為 U 先備或移除該題。
  - ⚠**邊界**：某概念雖與 U 同一 tier，但其單元在路徑順序上排 U **之後** → 仍算斷層（K(U) 以 `prerequisites` 鏈計，**不以 tier/stage 計**）→ `blocked`，需修正先備宣告或單元排序。

---

## 10. 安全執行：phase 化與 rollback

- **Phase 0｜spec 定案**：本檔達 5 clean ＋ 紅隊通過（§12）。gate 之前不進 Phase 0.5／Phase 1（定案後的下一階段是 Phase 0.5，非直接 Phase 1）。
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

### 10.1 各 Phase 的進入/退出準則與 rollback（§0.3 具體化）
- **細則**：每個 Phase 都有明確 **exit gate**，未過不得進下一 Phase；Phase 內每檔完成即 commit（訊息標 Phase），rollback＝`git revert`/`git checkout` 回該 commit。
  - **Phase 0 exit**：spec 過 §12（content_audit 5 clean ＋ 紅隊零繞過 ＋ `spec_concreteness_lint` exit 0）＋ **`AC-ANTIDRIFT` 綠**（§0.2 四錨點已交付、hook 對壞案例 DENY／好案例 ALLOW 經紅隊）。
  - **Phase 0.5 exit**：`design_consistency_gate` exit 0（既有不一致歸零到 token）＋ §7.2 之 R1 壞檔不重設/R2 真 migrate 修妥 ＋ `RT-6` 綠。
  - **Phase 1 exit**：`knowledge_points.json`＋id registry＋unit schema＋hub/roadmap 骨架＋`migrate()`＋additive-merge 就緒；`AC-COV-2`、`AC-REWARD-1` 綠。
  - **Phase 2 exit**：既有單元全數接線（宣告 `prerequisites`/`knowledge_point_ids`），每檔 5 clean。
  - **Phase 3 exit**：`AC-COV-1`（**Phase 3 變體**：`unit_ids[]` ∩ rubric⑦ 通過集，不含 §9 項）＝ 0 個未覆蓋 minimum id（gap 全補）。§9 `taught_kps_exercised` 的二次確認留到 Phase 5 done-gate。
  - **Phase 4 exit**：獎勵擴充**只新增 id**、RT-1..11 全綠 ＋ **`AC-NOBACKEND` 綠**（獎勵/排行/社交類零對外請求，no_backend_gate exit 0）。
  - **Phase 5 exit**：§11.A 全 **19 條 AC**（含 AC-SPEC）綠且 `acceptance_ledger.json` 全登錄。
- **範例**：
  - ✅**正例**：Phase 3 結束時 `coverage_gate` 報「未覆蓋 minimum id ＝ 0」→ 得進 Phase 4。
  - ❌**反例**：宣稱「Phase 3 大致完成」但 coverage 顯示 37 個 minimum id 無對映單元 → **不得**進 Phase 4，須列 37 id 補完。
  - ⚠**邊界**：Phase 2 某檔已 4 clean 後又被改動 → streak **歸零**、重跑 5 clean（不接受「只差一輪」通融）。

---

## 11. DONE-GATE（全書完成的定義）

一個檔案／全書「完成」須全部通過（**下列 8 項為必要條件摘要、非窮舉；唯一且完整的完工定義見 §11.A 的 AC 矩陣**，含 no-grade/coverage/rubric/no-backend/anti-drift 等本摘要未逐列者）：
1. **逐檔 content_audit 5 連續 clean**（同一 sha），L3 coverage_check exit 0（不可用抽樣/粗分片假 clean）。
2. **簡體/PRC 詞掃描**零命中（R2）。
3. **視覺 QA（iPad Air 13"）**：全畫面/frame render（1366×1024 ＋ 1024×1366，http）、逐張 PNG 看過、
   四角色（美術/空間美感/眼科/動畫師）逐張簽核綁 sha；未簽核不得宣告完成（視覺 QA 規則檔＋ fail-closed hook）。
4. **知識受限角色模擬**（§9）：每條主要路徑零斷層、可學會、記得牢、不倦怠。
5. **獎勵紅隊**（§7.3）全綠。
6. **設計一致性**：共用元件，無私有前綴重造（design_consistency）。
7. **code-download bundle**（若該單元/模組含可執行程式，依 house 規範提供完整可執行+可驗證下載）。
8. **house 視覺/結構一致**；效能（R9）未退化。

- **細則**：上列 8 項為「完成」的硬性必要條件**摘要（非窮舉）**；其**逐條可機械驗且窮舉的版本＝§11.A 驗收準則矩陣（19 條 AC，各附驗證方法/門檻/證據）**，§11.A 為唯一完工判準。
  完成 ⟺ §11.A 全 AC PASS 且證據登 `authoring/acceptance_ledger.json`（綁 sha）。任一項未過即未完成，**不接受「大致上」**。逐檔與全書都適用（per-file 先、whole-book 後）。
- **範例**：✅ 某檔案（頁）：5 clean＋簡體 0＋四角色簽核（sha 相符）＋頁內各單元 rubric 10/10＋覆蓋 id 存在 → 該檔完成。 ❌ 只跑到 3 clean 就宣告完成（違第 1 項）→ 擋。 ⚠ 第 3 項四角色已簽核，但事後又改版面（sha 變）→ 舊簽核作廢，須重 render＋重簽（§11.A AC-VIZ-1 ⚠）。

---

## 11.A 驗收準則矩陣（ACCEPTANCE CRITERIA；spec ＝ 最終核對清單）

> 使用者要求：spec 要詳細到**最後能用它逐條核對是否都完成**。下表是**唯一的完工判準**：
> **「完成」⟺ 下列每一條 AC 都 PASS，且證據登錄於 `authoring/acceptance_ledger.json`（含 AC-id、通過時間、對應 sha、證據路徑）。**
> 任一條 fail＝未完成；**禁止以「大致上/應該可以」宣告**。每條 AC 皆可驗（確定性腳本或綁 sha 的簽核 manifest），不接受口頭判斷。

| AC-id | 準則（具體） | 驗證方法 | 通過門檻 | 證據產物 |
|---|---|---|---|---|
| AC-COV-1 | 課綱 minimum 知識點**真覆蓋**：每個非 `beyond` 的 id 至少對映 1 個已完成單元，**且該單元對此 id 通過 §6.6 rubric ⑦「真教＋真考」綁定**（不接受只宣告於 `knowledge_point_ids[]` 卻未教未考） | `tools/coverage_gate.py`（待建）**分階段驗**：**Phase 3 exit** 僅查 `unit_ids[]` ∩ `unit_acceptance_lint` 的 ⑦ 通過集（path-independent、逐檔即有，不依賴 §9）；**Phase 5 done-gate** 再加 ∩ §9 模擬 `taught_kps_exercised`（二次確認，呼應 §9.4） | 未真覆蓋 minimum id 數 ＝ **0**（exit 0） | coverage 報告 JSON |
| AC-COV-2 | 知識母體本身完整且無重複 id、無不符格式 bullet | `tools/_kp_build.py` | 重複 id＝0、不符格式（扣 section 說明行）＝0 | build 報告 |
| AC-UNIT-1 | **每個**單元通過 §6.6 的 10 項 rubric | `tools/unit_acceptance_lint.py`（待建）＋ 人工 play-through | 每單元 10/10；0 單元缺項 | 逐單元 rubric 結果 |
| AC-UNIT-2 | 每個**檔案（頁）** content_audit 連續 **5 clean**（同 sha、L3 exit 0；content_audit 粒度＝檔案，單元層面走 AC-UNIT-1） | `/static-doc-audit` per-file + `coverage_check.js` | 每檔 5 clean、L3 exit 0 | convergence ledger |
| AC-UNIT-3 | 每個新單元與對應 golden 範本做**結構 diff**（§6.6 細則① 凍結黃金範本防品質漂移）；偏離而 unit metadata 無 `deviation_reason` 即 FAIL | `tools/unit_acceptance_lint.py`（讀 unit metadata `deviation_reason` ＋ 與 `authoring/golden/<archetype>.html` 結構比對） | 未解釋的偏離數＝**0**（exit 0） | golden-diff 報告 |
| AC-PATH-1 | 每條主要學習路徑**無斷層**（INV-1） | §9 知識受限模擬 | 每路徑每 U `result=pass`、`gaps=[]` | 模擬輸出 JSON |
| AC-PATH-2 | 可學會/記得牢/不倦怠（INV-2/3/4） | §9 模擬（§9.3 三級門檻） | `learnable=true`、`retention_ok=true`、`burnout_risk≤med`（且 `med` 須 `mitigation` 欄非空）全數 | 模擬輸出 JSON |
| AC-REWARD-1 | 已賺得獎勵**永不消失**（含壞檔/升版/catalog改/配額/跨分頁/原子性/reset守門/已裝備物下架） | §7.3 紅隊 RT-1…RT-11（每條 R1–R8 風險皆有對應 RT：R1→RT-6、R2→RT-4、R3→RT-10、**R4→RT-11**（已裝備 skin/border 下架）、**R5→RT-2**（badge 下架）、R6→RT-7、R7→RT-8、R8→RT-9） | RT-1…11 **全綠** | 紅隊測試輸出 |
| AC-STYLE-1 | 設計一致：無私有 class 重造共用元件、內容卡自適應寬 | `design_consistency_gate.js`（**待建**：接用 static-doc-audit skill 既有同名 gate，Phase 0.5 前接線成專案 gate 並**紅隊**，`SDA_CSS=app.css,game_core.css`）＋content-card lint（待建） | 重造＝0、違規卡＝0（exit 0） | gate 報告 |
| AC-STYLE-2 | 零硬編色碼/px 魔術數，全走 `app.css` token | lint（待建，掃非 token 色值/魔術數） | 命中＝0 | lint 報告 |
| AC-NOGRADE | learner-facing **不出現**「國小/國中/高中/年級/會考/學測/分科」等年段字樣（R11） | `tools/no_grade_label_gate.py`（待建，掃 render 後可見文字） | 命中＝0 | gate 報告 |
| AC-VIZ-1 | 所有畫面/每個 frame 以 iPad Air 13 render、逐張看過、四角色簽核綁 sha（R10） | 視覺 QA harness + signoff manifest | 全畫面覆蓋、四角色逐張簽核、sha 相符 | render + signoff manifest |
| AC-LANG-1 | 全繁體、零簡體、零 PRC 詞 | `scan_simplified.py`（全站 + 資料） | 簡體/PRC 命中＝0 | 掃描報告 |
| AC-PERF-1 | 效能不退化：單頁初始 JS ≤ 既有基準、無無限 inline 膨脹、資產按需載入（R9） | 體積量測腳本（待建，定基準數值） | 每頁 ≤ 基準；0 超標 | 體積報告 |
| AC-A11Y-1 | 對比度 ≥4.5:1、點擊目標 ≥44px、尊重 `prefers-reduced-motion` | 既有 contrast gate + 量測 | 違規＝0 | a11y 報告 |
| AC-CODE-DL | 含可執行碼的模組提供完整下載且**乾淨解壓可跑** | 解壓到 temp＋跑 README 指令 | build/test 綠 | 執行 log |
| AC-NOBACKEND | 無 backend 鐵律（§1.3/§7.4）機器堵死：learner 端與獎勵模組**零對外網路請求**（排行榜/對戰/好友/雲端同步/金流一律禁） | `tools/no_backend_gate.py`（待建，**同源白名單式**判定：預設僅允許同源相對 URL 的靜態資產；對**任何指向外部 origin 的資源請求**一律 fail，掃描向量須涵蓋 `fetch`/`XMLHttpRequest`/`WebSocket`/`EventSource`/`navigator.sendBeacon`、`Image().src`/`new Image`/`<img src>`、動態或外部 `<script src>`/`<link href>`、`<form action>` 外部 POST、`<a ping>`、WebRTC（`RTCPeerConnection`/DataChannel）、以及無法靜態證明同源的動態 URL）＋紅隊（**上述每一種向量各植入一個外部呼叫須被擋、純 localStorage/同源靜態放行**，記 §13 ledger） | 對外 origin 請求命中＝**0**（exit 0） | gate 報告 |
| AC-ANTIDRIFT | §0.2 四防漂移錨點**已交付且 fail-closed**：(a) 專案 `.claude/settings.json` hook、(b) `inject-sop-carriers.py` `[learning-path-sop]` echo、(c) `~/.claude/rules/` 規則檔、(d) `MEMORY.md` 指標（`design_consistency_gate.js` 不在此列，由 AC-STYLE-1 於 Phase 0.5 獨立驗） | 錨點存在性檢查 ＋ 紅隊（「未重讀本檔即宣告任一檔收斂」的壞案例須被 hook **DENY**、好案例 ALLOW） | 四錨點齊備、hook 壞案例 DENY/好案例 ALLOW | 錨點清單 ＋ 紅隊 log |
| AC-SPEC | 本 spec 自身：§0.3 anti-vagueness 全節通過 ＋ content_audit 5 clean ＋ 紅隊零繞過 | spec_concreteness_lint＋content_audit＋紅隊 | 全綠 | spec convergence ledger |

- **細則**：每條 AC 必對應一個**確定性腳本或綁 sha 的簽核**（上表「驗證方法」欄）；標「待建」者於 Phase 1 建並**紅隊**（證明壞案例被擋、好案例放行）才可啟用——**兩類例外（各自更早，不得延到 Phase 1）**：
  (a) **`AC-ANTIDRIFT` 的四防漂移錨點 hook**：因 **Phase 0 exit／§12 定案即需消費**（§10.1 Phase 0 exit 要 `AC-ANTIDRIFT` 綠、§12 step 3.5 要錨點已交付+紅隊才算定案），須在 **Phase 0 內（定案前）**建好並紅隊；
  (b) **`design_consistency_gate.js`（及其 content-card lint）**：因 **Phase 0.5 exit 即需消費**（§6.5 R-STYLE-4／AC-STYLE-1 明訂「Phase 0.5 前接線+紅隊」），須在 **Phase 0.5 前**建好並紅隊。`acceptance_ledger.json` 一列一次通過紀錄，sha 一變該 AC 作廢須重驗。
- **範例**：✅ 全 **19 條 AC**（AC-COV-1…AC-ANTIDRIFT 共 18 條產品 AC ＋ AC-SPEC meta）在同一 sha 皆有 PASS 列＋證據 → 可宣告完成並（經使用者）push。 ❌ AC-COV-1 顯示 37 個 minimum id 無單元 → 未完成，列出 37 個待補 id。 ⚠ AC-VIZ-1 四角色已簽核但 sha 已變（之後又改了版面）→ 舊簽核作廢，須重 render+重簽才算數。

## 12. 本 spec 自身的收斂協定（meta-process）

0. **附錄 A 深掘完成（前提）**：依 §4.1 各 slice 深掘到 DEPTH-STD＋各自獨立審查＋合併配 id＋emit `knowledge_points.json`。附錄 A 未深掘完成，spec 不得宣告定案。
1. 本檔先補齊 §4/§5/§7.2 回填 → 全文完整。
2. 以 `/static-doc-audit` 的 content_audit 對本 spec 跑 round，panel 判定 defect，修到
   **連續 5 round 零 panel-confirmed defect（同一未變更 sha）**。
3. **紅隊**：獨立 agent 嘗試證明「規範可被繞過/遺漏」——例如：能否跳過先備宣告而仍過 gate？
   能否新增獎勵卻讓舊獎勵孤兒化而不被 §7.3 抓到？能否讓模擬角色偷看後續知識？每找到一個繞過＝
   補一道子 gate ＋ 紅隊證明（§13 ledger）。紅隊零繞過才算定案。
3.5. **交付 §0.2 四防漂移錨點並紅隊（`AC-ANTIDRIFT`）**：fail-closed hook／carrier echo／rule 檔／MEMORY 指標 四者皆就位，證明「未重讀本檔即宣告收斂」壞案例被 DENY。錨點未交付＝不算定案（呼應 §0.2「承諾無效、只有 fail-closed 機器強制有效」）。（`design_consistency_gate.js` 不屬此四錨點，由 AC-STYLE-1 於 Phase 0.5 前獨立交付+紅隊，見 §11.A 細則例外(b)。）
4. 定案後才進入實作，**下一階段為 §10 Phase 0.5（既有不一致 remediation ＋ 獎勵安全地基，先做、before 任何新內容），非直接 Phase 1**。

- **細則**：每 round 以**不同 partition framing** 跑（避免抽樣假 clean）；「5 連續 clean」＝**同一未變更 sha** 連 5 round 零 panel-confirmed defect，
  **sha 一變 streak 歸零**；每 round 結果 commit；紅隊至少涵蓋三類繞過——(a) 跳過先備宣告仍過 gate、(b) 新增獎勵致舊獎勵孤兒化而 §7.3 未抓、(c) 模擬角色偷看 K(U) 之後的知識；每找到一個繞過＝補子 gate＋紅隊並記 §13。
- **範例**：✅ 同一 sha 連 5 round 零 defect＋紅隊零繞過 → spec 定案。 ❌ round 3 clean 後改了一行又自稱「第 4 round」→ streak 須歸零重數（不接受「只差一輪」）。 ⚠ 紅隊發現「可略過 R11 年段檢查仍過關」→ 不算定案，須先補 `no_grade_label_gate`＋紅隊，再重跑收斂。

---

## 13. 漏洞 / 強化 ledger（持續強化原則）

> 仿 Sidewalk `GATES-MAINTENANCE.md`：任何 gate 都不視為最終。每發現一個繞過（自己或紅隊）→
> 立即新增子 gate ＋ 紅隊（證明壞案例被擋、好案例放行），記於此表。

| 日期 | 發現的繞過 | 修補（新 gate/規則） | 紅隊結果 |
|---|---|---|---|
| （建置中累積） | | | |

---

## 14. 開放問題（待使用者拍板）

- ~~O-1 獎勵內容方向~~ → **已定案 §7.4**（skin/border/mascot/badge（綁真實里程碑）/收集冊；靜態站可行性鐵律：無排行榜/對戰/雲端/金流/刷量花招）。
- ~~O-2 roadmap 視覺風格~~ → **已定案 §6.1**（科技樹主幹＝先備 DAG ＋ 地圖式美術；4 節點狀態；不顯年段；過 viz-QA）。
- ~~O-3 國小各科深度下限~~ → **已由 R13 涵蓋**（課綱＝下限、不分年段的連續路徑、深度只有上限（學科至大學入門、英文無上限）無下限之爭；國小段以「課綱 minimum＋銜接」為基、可向上延伸）。
- ~~O-4 打掉重做 vs 包裝接入~~ → **已定案（使用者 2026-10-26：依 spec 規則自動判定，不逐頁問）**：判定規則＝既有頁**符合 §6.2 單元骨架＋§6.5 R-STYLE＋§6.6 rubric** 就「包裝接入」；任一不符就「打掉重做」。Phase 1 用覆蓋矩陣對每頁機械標記 `reuse|rebuild`，不需使用者逐頁裁示。

**→ §14 四個開放問題（O-1…O-4）全數關閉；spec 無待使用者拍板項，可逕行走 §12 收斂。**
