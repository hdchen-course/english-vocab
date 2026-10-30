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
| 相關檔 | `DICTATION_BUILD_SPEC.md`（聽寫系列**自身** spec，現為 DRAFT 未收斂；本檔僅引為 SOP 流程範本，不在此斷言其上線狀態——見 §0.4 階 5）、`~/.claude/rules/visual-qa-ipad-signoff-do-not-delete.md`（視覺 QA 制度）、`../engineering/authoring/STANDING_AUDIT_SOP.md`（站級常規稽核契約，N=2；與本檔 5-clean 不同流程，見 §0.4 階 4） |
| ⚠ DRAFT 反轉 | 2026-10-26：外部嚴格審查 `LEARNING_PATH_REBUILD_STRICT_REVIEW.md` 查出會讓錯誤知識進產品的 blocker（見 §0.5）。**維持 DRAFT、停止 5-clean streak、不進教材實作**；先完成 §0.5 Phase -1 全綠才重啟收斂。 |

### 0.1 待回填區（偵察 agent 對應）— **三項偵察均已回填（2026-10-26）**
- **§5 現況盤點**（頁面/導覽/共用架構/覆蓋矩陣）← recon A（repo 結構，**已回填**）。
- **§4 知識點母體清單**（逐科逐 strand）← recon C（課綱）＋深掘 → **已回填（附錄 A，3096 條）**。
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
  `spec_concreteness_lint.py` exit 0（涵蓋 9 個規範章的子節：§6.6 品質恆定、§7.1/§7.2/§7.3 獎勵風險＋RT、§6.5 R-STYLE-3 自適應卡、§8.1 panel 細則、§9.5 受限模擬、§10.1 entry/exit；§4.1 DEPTH-STD 不由章級 lint 檢核，§4 為 EXEMPT 章，其具體化由附錄 A／`coverage_gate` 把關）。
  **已除的 blocker**：章級具體化（lint 綠）不再是 blocker。
  **⚠ 2026-10-26 DRAFT 反轉（修正過期宣稱）**：外部嚴格審查發現會讓錯誤知識進產品的新 blocker（B-01 待核遺失〔已修〕、B-03 全當 minimum、B-04 exam 誤置、B-05/B-06 內容錯誤與安全口訣、B-07/B-08 證據層不足、B-09 多 SSOT 衝突）。**先前「定案 blocker 僅剩 5-clean＋紅隊」宣稱作廢。** 正確定案序＝先完成 §0.5 Phase -1（修 spec＋工具，不碰教材）全綠，才可重啟 content_audit 5-clean＋紅隊。
  章內單一規則若仍嫌模糊屬**細粒度 vagueness**，交 content_audit 專家 panel 逐輪判（§0.3 (c)、§12），非擋定案的粗漏。

### 0.4 文件優先序（PRECEDENCE；B-09 — 解決多份文件互稱 SSOT 且規則衝突）
> 問題：`LEARNING_PATH_REBUILD_SPEC.md`／`BLUEPRINT.md`／`DESIGN_SPEC.md` 都曾自稱「唯一／最終」規格，且對 hard gate、年段顯示、進階 XP、卡片寬度、audit 次數給相反要求。以下優先序為唯一裁決：

| 階 | 文件 | 規範範圍（normative scope） | 衝突時 |
|---|---|---|---|
| 1 | **本檔 LEARNING_PATH_REBUILD_SPEC.md** | 學習路徑重構 ＋ 課綱/知識點 ＋ 導覽 ＋ 獎勵 ＋ 備考的**唯一 normative 來源** | 一律以本檔為準 |
| 2 | 附錄 A `KNOWLEDGE_POINT_INVENTORY.md` ＋ `knowledge_points.json` | 知識點母體；**僅在本檔明示納入時** binding | 以本檔引用為準 |
| 3 | `DESIGN_SPEC.md` ＋ 共用資產（`app.css` 等） | **設計系統/token 層的 SSOT**（§6.5 defer 給它）；**非**學習路徑政策來源 | 設計 token 以它為準；學習政策以本檔為準 |
| 3b | `VISUAL_QA_BUILD_SPEC.md`（草稿） | **視覺驗收**契約的 repo-local 具現（§AC-VIZ 細化：iPad 基準/四角色逐 frame 簽核/fail-closed）；從屬本檔 | 視覺驗收細節以它為準；與本檔衝突以本檔為準 |
| 4 | `../engineering/authoring/STANDING_AUDIT_SOP.md` | **站級常規稽核**流程（N=2 clean）；與本檔 5-clean 是**不同流程不同標的**，非衝突 | 常規稽核用 N=2；本 spec/新檔收斂用 5-clean |
| 5 | `DICTATION_BUILD_SPEC.md` | 僅治理**聽寫系列**；該系列實作狀態以它自身為準（現為 DRAFT 未收斂） | 聽寫事務以它為準；本檔僅引為流程範本 |
| 6 | `BLUEPRINT.md`／`STICKINESS_PROPOSAL.md`／`TS_MIGRATION_ROADMAP.md`／其餘舊檔 | **historical/background**；不具 normative 力 | 凡與本檔衝突（如 hard-gate、年段書架、「小四精通之路」牴觸 R-OPEN/R11）一律以本檔為準；引用須附「檔名＋章節＋sha」 |

- **細則**：舊檔頂端加 superseded/scope banner、移除「唯一／最終」字樣（本次已處理 `BLUEPRINT.md`、`DESIGN_SPEC.md`）。任何實作 PR 若引用階 6 文件的規則，須在 PR 說明標注該規則不與本檔衝突，否則 reviewer DENY。
- 範例：✅「依本檔 §6.3 safe_store 實作獎勵合併」；❌「依 BLUEPRINT §4.1 用 hard-gate 鎖國中內容」（牴觸 R-OPEN 不鎖定）；⚠「BLUEPRINT 的 `player_profile_v1` 單一 profile 概念與本檔不衝突 → 可沿用，但以本檔 §6.3 schema 為準」。

### 0.5 Phase -1：規格與工具修訂（spec-only，先於 5-clean；B-10 + 嚴格審查 §7）
> 外部嚴格審查 `LEARNING_PATH_REBUILD_STRICT_REVIEW.md` 要求：任何教材實作前，先完成下列「只修 spec＋工具、不碰教材內容」的前置，**全綠才可重啟 content_audit 5-clean**。狀態逐項更新：

| # | 項目 | 對應 blocker | 狀態 |
|---|---|---|---|
| ① | `_kp_build.py` 無損 parser ＋ `verification_status/authority_refs/verified_as_of/verified_by` 欄 ＋ round-trip 守衛 | B-01/H-04 | **✅ 完成（2026-10-26；pending 27→64 救回、`--check` exit 0）** |
| ② | §0.4 precedence table ＋ 舊檔 superseded banner | B-09 | **✅ 完成（本節）** |
| ③ | 修已確認錯誤知識＋安全口訣（high-risk 雙 reviewer） | B-05/B-06/P0/P1 | **✅ 完成（2026-10-26）**：4 域專家＋對抗式 reviewer 定稿 16 類修正——滲透(溶質濃度)、生物需求(去普世律)、ATP(30–32/發酵)、河流地形(沖積扇出山口)、水平衡(入滲不重複計)、平面鏡(保留會考「左右相反」微增)、probability-ladder(雙軸)、stative-verbs(動態例外)、a/an(起始發音)、辨辯**辮**瓣、CRC 四類權利vs四大一般原則(拆條)、辛普森(去倖存者重複)、Dunning-Kruger(去標籤+爭議)、損失趨避/沉沒成本(拆)；**REJECT 2**(發酵≠無氧呼吸超綱致混淆、平面鏡前後反轉對會考過深)。**安全 4 類**(火場/瓦斯/CPR/急救拆 bleeding+burn+choking)去危險化並**一律維持 `(待核)` pending**(官網 live 擷取失敗、authority_refs 待人工覆核)。另修 `網絡` gate 誤報(移出 PRC denylist=歧義詞,簡體仍擋,已紅隊)。manifest 3092→3096、pending 68、exit 0。 |
| ④ | 清 pending：5 域課綱 team＋對抗式 reviewer 逐條分類；`fact_check_ledger.json`（B-07）有登記官方源者→verified | B-02 | **🟡 大幅推進（2026-10-26）**：pending 68→**20**（解消 48）。ENRICH→t_enrich 退出 minimum；reviewer AGREE 的 in-scope/verified 去待核；**reviewer ESCALATE（無官方 PDF 無法定）＋KEEP-PENDING＋7 high-risk 一律保守留 pending（不假裝 verified）**。ledger 首筆 verified＝識字量（課綱 Ab-III 認讀2700/書寫2200）。剩 20 pending 待 ⑥ 官方 L3（使用者指示「照規劃、不無限上綱」，不逐一抓領綱）。**`AC-KP-VERIFY` 已入 §11.A（R2-03）**：binding minimum 必 `verified`（pending＋unverified 皆擋，不得以無待核字樣冒充）；`binding_unverified` 已輸出至 manifest meta（由 generator 現算、勿手寫；現以 overlay∩sha − HD 官方確認例外 live 計算）；此數歸 0 為 Phase 0 ship-gate。 |
| ⑤ | exam 改**受控 enum**（清掉分科英文與自由字串）＋重分 minimum vs enrichment（beyond 旗標） | B-03/B-04/H-03 | **✅ 完成（2026-10-26）**：`_kp_build.py` 加 `VALID_EXAMS` 受控詞彙 gate（擋自由字串/裸「分科」/「分科-英文」，exit≠0）＋`fact_check_ledger` 接線（B-07）。**26 筆分科英文全清零**（分科測驗無英文科）→學測/無；**t_enrich 0→17**（相對論/卡諾等選修在 minimum、克利金/分部積分/能斯特等逾綱→enrich），beyond 旗標恢復意義。manifest 3096、exit 0、round-trip 20=20、簡體/concreteness 全綠。決策與來源彙整於 `authoring/audit_scratch/kp_reclass_decisions.md`。 |
| ⑥ | KP/claim/question/visual 四層證據 schema ＋ gate（source 非獨立一層：claim 層以 `source_refs[]` 追源、ledger 條目以 `scope_source_ids[]`＋`fact_source_ids[]`（F6-03 拆 scope／fact 兩欄）引用 registry；見 §6.8.1）；可計算驗證用**獨立 oracle**（生成器與驗證器不共用公式） | B-07/B-08 | **✅ 設計完成（2026-10-26）**：§6.8.1 四層證據粒度（KP/claim/question/visual）＋獨立 oracle（B-08 堵自證）＋風險分級最低驗證＋`recheck_after`＋部署 hash 一致；對應 gate 清單列入 §6.8.1（Phase 1 建+各自紅隊）。schema 已與 §6.2.2 單元內容欄位對接。 |
| ⑦ | 單一 `verify:learning-path` orchestrator（固定順序跑全 gate） | H-10 | **✅ 完成（2026-10-26）**：`tools/verify_learning_path.py` 串 3 個現有確定性 gate（concreteness／簡體PRC／manifest B-01+B-04 round-trip），一條命令看全綠；Phase 1 待建 gate 以 roadmap 列出（不計成敗）。 |
| ⑧ | repo-local `VISUAL_QA_BUILD_SPEC.md` ＋ anti-drift 四錨點 | B-10 | **🟡 草稿（2026-10-26；相位已釐清，R2-08）**：**Phase -1 交付物＝repo-local `VISUAL_QA_BUILD_SPEC.md` 草稿存在（已達）**，使 fresh-clone 不依賴 user-home。**render harness／四角色 signoff gate／guard hook／手機(390/375px)＋200%zoom＋鍵盤＋VoiceOver/reduced-motion 可及性驗收矩陣＝Phase 1 deliverable（非 Phase -1 blocker）**；該 spec 自身的 5-clean＋紅隊亦在 Phase 1 子軌。anti-drift 四錨點（carrier echo／memory 指標／專案 hook／規則檔）＝spec **定案時**交付（§0.2），非 Phase -1。**不再兩種說法並存。** |

- **DONE-GATE（Phase -1，R2-02/03/08 釐清）**：Phase -1 完成＝(a) `verify_learning_path.py` 現有確定性 gate 全綠（`_kp_build.py --check` exit 0 含附錄同源/ledger 語意/round-trip；concreteness；簡體）＋(b) canonical inventory 單一來源一致（R2-01）＋(c) `AC-KP-VERIFY` 與四層 correctness AC **已定義入 §11.A**（R2-03/06）＋(d) `VISUAL_QA_BUILD_SPEC.md` 草稿入 repo（R2-08）＋(e) anti-drift 錨點於定案時交付。**注意（T3-01 後更新，取代舊「目前 PARTIAL」說法）：`verify_learning_path --phase=-1` 現回報 COMPLETE——T3-01 已將 Phase 1 gate 與 binding 驗證移出 `--phase=-1` 範疇（死結解除，見 §0.6 line 114／F4 line 137），Phase -1 交付物 (a)–(e) 已齊**。**「binding minimum 全部 verified」「四層/Visual QA gate 建成並紅隊」「5-clean」屬 Phase 0 定案 ship-gate，不是 Phase -1 門檻**——不得以 pending=0 代替 verified（R2-03：pending 與 unverified 皆須擋）。
- 範例：✅「pending 由領域專家查教育部課綱後標 verified＋`authority_refs`」；❌「把 64 pending 直接改 verified 讓 gate 綠」（假裝 verified，審查明禁）；⚠「大學內容如 CRISPR 移 `t_enrich/beyond=true` 暫不 gating，合法」。

### 0.6 第二輪複審（Kiro／另一模型）處置（2026-10-26）
> 使用者把本 spec 交 Kiro 做第二意見，Kiro 第二輪（見 `LEARNING_PATH_REBUILD_STRICT_REVIEW.md` §0）抓到數個**真**問題，多為本次新引入。逐項處置（可稽核）：

| Kiro R2 | 判定 | 處置 |
|---|---|---|
| R2-01 binding 母體分裂（附錄 MD 3092 vs JSON 3096、含舊危險文字/舊 first-aid/41 title 不符） | 實錘 | **已修**：`_kp_build.py` 改為**附錄 Markdown 從同一 rows 生成**（單一 canonical source＝slices）；`--check` 比對 committed 附錄/JSON 列數，分裂即 exit≠0。附錄重生＝3096、舊危險文字 0、新 id 入檔。 |
| R2-02 `verify_learning_path` 假綠（未達 DONE 仍印 ALL GREEN） | 實錘（本次引入） | **已修**：orchestrator 改 **fail-closed**，Phase -1 未完成一律 `PARTIAL ⛔`＋exit 1（列 10 待建 gate＋3078 未 verified）；`--gates-only` 才單看現有 gate。 |
| R2-03 `pending=0` 可被 unverified 繞過 | 實錘 | **已修**：新增 **`AC-KP-VERIFY`**（§11.A）＝binding minimum 必 `verified`，pending 與 unverified **皆擋**；manifest 輸出 `binding_unverified`。 |
| R2-04 ledger 可用任意非空物件取得 verified／未來日 | 部分實錘 | **已修（首版語意檢查）**：`_kp_build` 擋空 sources／空 verified_by／未來 `verified_as_of`／未知 id。**註：Kiro 稱「未來日」係其環境時鐘＝2026-09-04；本專案權威注入真實時間＝2026-10-26（今天），故 2026-10-26 非未來**。完整 `ledger_schema_gate`（含 high-risk≥2 獨立 reviewer）列 Phase 1。 |
| R2-05 40 個 id-tier mismatch／三契約矛盾 | 實錘 | **已修**：§4 **正式廢除「第 2 段＝tier」**，宣告 **id opaque**（不改 id、tier 只讀 manifest、禁由 id 推斷）；40 例 mismatch 合法非缺陷。 |
| R2-06 四層 correctness 僅 prose 未入 AC | 實錘 | **已修**：`AC-CORRECT` 強化綁入 §6.8.1 四層＋獨立 oracle＋六個 Phase 1 gate（claim/question/generator/visual/freshness/release-hash）。 |
| R2-07 無真正 source_registry | 實錘 | **已採納（排程 Phase 1）**：`source_registry.json`（source_id/publisher/url_or_isbn/edition_or_version/locator/accessed_at/authority_class/content_fingerprint/recheck_after；欄名以 §6.8.1「promotion flow 第1點（Phase 0 建 `source_registry.json`）」的 canonical 欄位定義與實際 `source_registry.schema.json` 為準）＋ ledger 只引 source id；本輪先立 ledger 首版。 |
| R2-08 Visual QA 相位矛盾＋手機/A11y 缺席 | 實錘（本次引入矛盾） | **已修**：§0.5 ⑧ 釐清——Phase -1 交付＝repo-local spec 草稿存在；harness/signoff-gate/hook＋**手機 390/375px＋200%zoom＋鍵盤＋VoiceOver/reduced-motion 驗收矩陣**＝Phase 1 deliverable；不再兩說並存。 |
| R2 HIGH：DEPTH-STD 大包 KP／跨域 ownership／exam 未版本化（含「探究」混制度能力）／format gate backtick 繞過／門檻`≤~15`／AC-PERF 基準／fermentation·平面鏡措辭 | 採納 | 排入 backlog（多屬 Phase 1 或內容強化）；fermentation/平面鏡措辭與 exam 版本化（`assessment_refs`）列 spec 待辦，`探究` 是否自 exam enum 拆出另記。 |

> **Kiro 第二輪總判定仍 CHANGES REQUIRED／DRAFT**：真 blocker＝「binding 資料分裂」＋「驗證器假綠」兩項已於本輪修復；其餘（binding minimum 逐條 verified、四層/Visual QA gate 建成並紅隊、source_registry、DEPTH-STD 拆包）為 Phase 0/1 工作。**維持 DRAFT、不重啟 5-clean、不進實作**，待再一輪複審確認 R2 處置無回歸。

#### 第三輪（Kiro T3）處置（2026-10-26）— 攻擊 R2 修法的殘留洞
> Kiro T3 確認 R2-01/02 目前資料已同步、不再假綠，但抓到 completion 判斷仍可繞過等殘留洞。逐項：

| Kiro T3 | 判定 | 處置 |
|---|---|---|
| T3-01 Phase -1 驗證器要求 Phase 1 產物（時序死結） | 實錘 | **已修**：建 `authoring/acceptance_criteria.json` phase registry；`verify_learning_path.py` 改**依 phase 只驗該階段產物**（`--phase=-1` 不再要求 Phase 1 gate/資料），死結解除；`--phase=-1` 現 COMPLETE。 |
| T3-02 orchestrator 只 `exists()`＋信任 cached meta | 實錘 | **已修**：registry gate **實際執行**並驗 exit；`binding_unverified` **從 live `items[]` 現算**（先經 `--check` 擋竄改），不信 cached `meta`。紅隊：meta 竄改為 0 → 仍 PARTIAL。 |
| T3-03 `--check` JSON 只比筆數＋`except:pass` 吞錯 | 實錘 | **已修**：`--check` 改**完整 generated JSON 逐字串 deep-equal**＋parse 失敗即 FAIL。紅隊：改一欄 title／meta 歸零 → 皆 FAIL，還原 → clean。 |
| T3-04 spec 仍寫 3092＋manifest schema 過期 | 實錘 | **已修**：全 spec 統計 3092→**3096**（by_domain 實算：學科 2712＋life 384）＋標「統計由 generator 產、勿手寫」；manifest schema 補 `verification_status/note/authority_refs/verified_as_of/verified_by`。 |
| T3-05 ledger 弱檢查即授 verified | 實錘 | **已修**：parser 只授 **`provisionally_verified`**（非 release-grade）；日期改嚴格 ISO parse（禁「0000」）；release-grade verified 待 Phase 1 `ledger_schema_gate`＋`source_registry`。AC-KP-VERIFY 要求 `provisionally_verified` 亦＝0。 |
| T3-06 orchestrator 未由 AC registry 驅動 | 實錘 | **已修**：`acceptance_criteria.json` 為單一來源，orchestrator 與（後續）§11.A 皆由它生成/交叉檢查；coverage_gate 等已歸正確 phase。 |
| T3-H（DEPTH-STD 大包／fermentation·平面鏡措辭／跨域 ownership／exam 版本化「探究」拆／backtick 繞過／`≤~15`／Visual QA 子規格手機 matrix／工具註解 opaque） | 採納 | 工具 docstring/ID_RE 已改 opaque（T3-H8）；其餘入 Phase 0/1 backlog（DEPTH-STD 拆包、`assessment_refs` 版本化、科學措辭微調、子規格補手機/A11y matrix）。 |

> **第三輪總判定仍 CHANGES REQUIRED／DRAFT**：verifier 執行語意、phase 時序、完整 JSON equality 已修並紅隊；真正 ship/定案仍待 Phase 0（binding minimum 全 release-grade verified＋anti-drift＋gate 建成紅隊）→ 才重啟 5-clean。**不進教材實作**。

#### 第四輪（Kiro F4）處置（2026-10-26）— release orchestration 可繞過
> F4 確認 T3-03/04 CLOSED，但最高風險轉移到 release orchestration（`--release` 降級、release 非累積、registry 未覆蓋 23 AC、Phase 0 不可達）。逐項：

| Kiro F4 | 判定 | 處置（皆紅隊） |
|---|---|---|
| F4-01 未知/舊 CLI 參數靜默忽略，`--release` 取得 exit 0 | 實錘 | **已修**：改嚴格 `argparse`，未知參數 exit 2；`--release`＝`--phase=release` 正式 alias；第一行/`--json` 回報實際 mode。紅隊：`--release`→跑 release cumulative PARTIAL；`--gates-only`→exit 2。 |
| F4-02 release 只跑一個 selftest、不累積、不驗 23 AC | 實錘 | **已修**：orchestrator **cumulative**（`--phase=release` 跑 -1→0→1→release 全部，本輪 24 項 FAIL→PARTIAL）；`release-artifact` check 需 `--release-id`（immutable）跑真實 hash，非 selftest。 |
| F4-03 registry 非 23 AC root，可自刪 check | 實錘 | **已修**：registry 列全 23 `ac_id`＋orchestrator 內建**獨立 canonical 23-set** 三方 set-equality（`chk-registry-self`）。紅隊：刪 AC-NAV entry→FAIL。registry schema（唯一 id/合法 phase/kind）＋red-team 可執行化排 Phase 1。 |
| F4-04 Phase 0 宣稱驗四錨點+source registry 實際只驗一 hook | 實錘 | **已修**：`AC-ANTIDRIFT` 改 `artifact-all` 列四錨點（hook/carrier/rule/memory 指標）＋新增 `chk-source-registry`＋`chk-ledger-gate`；全誠實 FAIL（未建）。存在性仍不足→hook/carrier 須壞例 DENY 好例 ALLOW（Phase 0 紅隊）。 |
| F4-05 release-grade verified 無合法產生路徑、Phase 0 不可達 | 實錘 | **已修**：§6.8.1 定義**唯一 promotion flow**，且把 `ledger_schema_gate`＋`source_registry` 歸 **Phase 0**（非 Phase 1），`AC-KP-VERIFY` 在 Phase 0 即可達；`_kp_build` 永不寫 `verified`。 |
| F4-06 phase 非 cumulative | 實錘 | **已修**：`--phase=X` 跑 phase_order ≤X 全部（見 F4-02）。 |
| F4-HIGH 8/9 gate 用環境 python3／空 glob 無錯 | 採納 | **已修**：gate 用 orchestrator `sys.executable`（`PY`）／`node`（`NODE`）；`GLOB:` 空展開且 `allow_empty:false`→FAIL。其餘（DEPTH-STD 大包拆、fermentation/平面鏡措辭、`探究` 自 exam enum 拆、ownership、backtick 繞過、`≤~15`、子規格手機/A11y matrix）入 Phase 0/1 backlog。 |

> **第四輪總判定仍 CHANGES REQUIRED／DRAFT**：release orchestration 的降級/非累積/registry 可刪/verified 不可達已修並紅隊；`--phase=-1` COMPLETE、`--phase=0/1/release` 誠實 PARTIAL。定案仍待 Phase 0 全綠（建 source_registry＋ledger_schema_gate＋四錨點 hook 並紅隊→promote 3079 筆→binding verified=0）→ 才重啟 5-clean。**不進教材實作**。

#### 第五輪（Kiro F5）處置（2026-10-26）— selftest≠真證據、契約自檢可被自刪、promotion 無模組
> F5 確認 F4 全改善，但紅隊指出 release 多跑 selftest（29 中 15）、`chk-registry-self` 可被 registry 自刪、promotion 只有 prose。逐項：

| Kiro F5 | 判定 | 處置（皆紅隊） |
|---|---|---|
| F5-01 release 跑 gate selftest 非真實教材驗收 | 實錘 | **已修**：每個 AC 分 **`qualification_command`（selftest／正例PASS壞例FAIL）** 與 **`evidence_command`（對 immutable `--release-id` 的真實資料）**；`--phase≤1` 跑 qualification、**`--release` 只跑 evidence，selftest 不計入 release PASS**。 |
| F5-02 registry 自檢可被自刪 | 實錘 | **已修**：orchestrator 讀 registry 後、選 checks 前**無條件**跑 hardcoded `bootstrap_validate()`（23 AC exact set＋每個恰一次、required helper ids、phase_order、合法 phase/kind）——**不是可刪的 registry entry**。紅隊：刪任一 AC 或 helper→exit 2。 |
| F5-03 verified promotion 無可達資料流 | 實錘 | **已修**：建具名模組 **`tools/promote_verified.py`**（pure）讀 ledger＋`source_registry.json`→產 **`authoring/verified_overlay.json`**（綁 manifest_sha）；`_kp_build` 永不寫 verified；`AC-KP-VERIFY` 從 overlay∩當前 sha 現算。目前可執行、0 verified（source_registry 未建，honest 可達）。 |
| F5-04 23 AC 只有名稱覆蓋非語意覆蓋 | 實錘 | **已修**：registry 支援 `components[]`——`AC-CORRECT` 拆 6 子 gate（claim/question/generator/visual/freshness/release-hash）、`AC-SPEC` 拆 concreteness＋5-clean 紅隊 ledger、`AC-UNIT-2` 改每頁 5-clean（非 `--mcq-cue`）、`AC-LANG-1` evidence 掃全站 html（非只 slices）、`AC-ANTIDRIFT` 改壞例DENY好例ALLOW gate。 |
| F5-05 Phase 0 驗法仍不足 | 採納（排 Phase 0 實作） | source_registry 需 schema/fingerprint/freshness（已入 §6.8.1 flow）；anti-drift 需真 DENY/ALLOW（evidence_command 待建）；no-grade/no-backend evidence 掃真實 html（registry 已設 `GLOB:*.html`＋`allow_empty:false`）。 |
| F5-06 `--json` 不純、`--help` exit 2 | 實錘 | **已修**：人類 log 全 stderr、**stdout 只純 JSON**；`--help` 由 argparse exit 0，僅解析錯誤 exit 2。 |

> **第五輪總判定仍 CHANGES REQUIRED／DRAFT**：orchestration 契約已達 architecturally complete（qualification/evidence 分離、無條件 bootstrap、具名 promotion、components 語意覆蓋、pure json）。**殘留 PARTIAL 已收斂為「Phase 0/1 真實資料與 gate 尚未建」**——依本報告原則「不把未實作當缺陷」，此為下一哩路（Phase 0：建 source_registry＋各 evidence gate＋anti-drift hook 並紅隊，promote binding minimum 至 verified），非契約缺陷。Phase 0 全綠才重啟 5-clean。**不進教材實作**。

#### 第六輪（Kiro F6）處置 ＋ **CONTRACT FREEZE**（2026-10-26）
> F6 裁決：「管理方向正確，技術結論早一步」——採納「停止空轉、修完最後有限契約洞即 freeze、進 Phase 0」。先關 5 個有限、可重現的契約洞並紅隊，然後 **contract freeze，不再做第七輪泛化審查**。

| Kiro F6 | 判定 | 處置（皆紅隊 fixture） |
|---|---|---|
| F6-01 Phase 0 跑 qualification 非 evidence | 實錘 | **已修**：`--phase=X`／`--release` 預設跑 **evidence_command**（真實資料）；另設 `--qualify` 單獨跑 gate 自測。紅隊：`--phase=0` 現跑 evidence。 |
| F6-02 verified_overlay 可手工偽造 | 實錘 | **已修**：AC-KP-VERIFY metric **先重跑 `promote_verified.py --check`**（重算比對），不一致即 refuse。紅隊：手填 3079 ids 偽造 overlay→AC-KP refuse。 |
| F6-03 scope/fact evidence 未分離 | 實錘 | **已修**：ledger 拆 `scope_source_ids[]`＋`fact_source_ids[]`；`promote_verified` 要求兩者皆通過才 verified（課綱不能代證事實）；§6.8.1 定為鐵律。 |
| F6-04 high-risk/reviewer 規則不全 | 實錘 | **已修**：`HIGH_RISK_PATTERNS` 補 `life.*.emergency`、`soc-civ.*`法律/權利、健康醫療；reviewer 正規化身分去重（相同字串＝一位），high-risk 需 ≥2 相異＋官方來源。 |
| F6-05 release-id 未決定 snapshot | 實錘 | **已修**：`--release` 須 `--release-id`→解析 `releases/<id>/` immutable snapshot；GLOB／工具 `--root` 對 snapshot 展開。紅隊：無 id→exit2、snapshot 不存在→exit1（不退回當前 workspace）。 |
| F6-補 bootstrap 未驗 critical component set | 實錘 | **已修**：`bootstrap_validate` 加 `REQUIRED_COMPONENTS`（AC-CORRECT 6 子、AC-SPEC 2 子）。紅隊：刪 AC-CORRECT.question→exit2。 |

> **CONTRACT FREEZE：ACCEPTED（2026-10-26）**——Kiro 第七輪複核確認 F6 六項主修正＋三契約不一致全成立，僅餘一個 component 級粒度修正（CF-01），已修並跑完其三個固定紅隊，依其裁決「修完即可直接標 ACCEPTED，不需再送泛化審查」。verification/orchestration 契約至此**定稿凍結**。
>
> | freeze 條件 | 修法 | 固定紅隊 |
> |---|---|---|
> | F6第1：Phase 0↔5-clean 循環（AC-SPEC evidence 要 5-clean，但 5-clean 在 Phase 0 後） | 新增 `--ready-for-5clean`＝phase 0 但排除 finalization-role → 此為「可開始 5-clean」訊號，循環斷開。正序：ready-for-5clean 綠→5-clean→紅隊→AC-SPEC 綠→定案 | 見 CF-01（下） |
> | **CF-01（第七輪唯一殘留）：`finalization_role` 原掛在整筆 AC-SPEC，`--ready-for-5clean` 以 entry 為單位移除 → 連 concreteness lint 也被跳過** | **把 `finalization_role` 從 AC-SPEC entry 下放到其 `5clean+紅隊 ledger` component；ready 過濾改 component 級**：ready 模式移除帶 finalization_role 的 component，但保留並必跑 `concreteness`（`spec_concreteness_lint.py`） | ①注入 concreteness 失敗→ready 模式 AC-SPEC FAIL、rc=1（還原後逐字相同、PASS）✅ ②ready 模式含 `concreteness`、**不含** `5clean+紅隊 ledger`（grep 命中 1/0）✅ ③一般 `--phase=0` 兩 component 皆要求→AC-SPEC FAIL/PARTIAL（ledger gate 尚未建）✅ |
> | F6第2：release snapshot 混用 workspace（`--root` 被忽略仍 exit 0） | `_kp_build.py` 吃 `--root`、缺路徑 exit 2；`scan_simplified.py` 忽略 `--root/--release-id`、明確缺檔 FAIL；orchestrator binding metric 一律讀**受驗 root** 的 manifest/overlay（release 時＝snapshot，且 snapshot overlay 無法就地重算 promote→保守 refuse）；release-id 限 `[A-Za-z0-9._-]`＋path containment | `--check --root 不存在`→exit2、`scan 缺檔`→exit1 ✅ |
> | F6第3：一般 KP scope 用 `need_official=False`（blog 可當 scope） | `scope_source_ok` 強制 `authority_class∈{official,standard}`（scope＝約定須課綱權威）；fact 仍走 evidence_method 不訴諸權威 | blog scope→拒、official→過 ✅ |
>
> 契約其餘已補且紅隊：qualification/evidence 雙軌、evidence-by-default、無條件 bootstrap（23 AC＋helper＋component set；刪 AC-CORRECT.question→exit2）、具名 promotion（scope/fact/risk＋偽造 overlay refuse）、pure json、`--help` exit0。**不再做泛化 harness 審查（無第八輪）**。
> **下一步＝正式進 Phase 0（真實工作，非再改 harness）**：按 domain 批次建 `source_registry.json`（＋schema）與每筆 KP 的 scope_evidence／fact_evidence，建各 evidence gate 與 anti-drift hook（壞例 DENY 紅隊），由 `promote_verified` 依 `release-grade verified ＝ scope✓ ＋ fact/procedure✓ ＋ 風險 reviewer✓` 逐 domain 批次升 verified——**不得用同一份課綱來源把 3079 筆一次標 verified**。Phase 0 `--phase=0` 真綠→重啟 5-clean→紅隊→定案→(使用者確認)→實作。**仍不進教材內容實作。**

### 0.6.1 Phase 0 進度（2026-10-26，使用者授權「照順序一路做到結束」後啟動）
> 本節為 Phase 0 的 live 進度；完工＝`verify_learning_path.py --phase=0` 真綠（evidence 模式）。
>
> **⚠ 2026-10-29 更新（取代本節下方較早的逐批數字）**：binding minimum（**3079 條**）**已全數覆蓋**＝**3075 筆** release-grade verified ＋ HD 授權 option(b) 官方確認例外 **4 筆**（3075＋4＝3079）（另 `verified_overlay.json` 的 `verified_ids` 總數為 3091＝3075 binding ＋ 16 筆 beyond/`t_enrich` verified，**beyond 不計入 binding 母體**，故勿把 3091 當作 binding 驗證數）〔**2026-10-30 high-risk floor 對帳註**：此 3075 release-grade verified 係由 **floor 前** 的 `promote_verified`（id 前綴式 `is_high_risk`）產出；2026-10-30 §6.8.1（「風險分級最低驗證要求」條＋promotion flow 第2點）新增的 high-risk **fail-closed floor**（`kind`/任命名空間安全語義強制 high、`risk_class` 只升不降、不確定即 high）其**程式強制延至 Phase 0/1 `promote_verified` 強化**（§13 2026-10-30(b) 列）。強化後**須以 kind/risk_class-aware `promote_verified` 重跑**、對跨命名空間安全宣稱（如 `sci.*` 實驗安全）以 ≥2-reviewer 重篩，binding 驗證**須重新確認、數可能變動**——此為 **Phase 0 ship-gate（實作教材前必過）** 的義務，**不影響本 spec §12 的 content_audit 5-clean（規範『文字』收斂，與 binding『資料』ship-gate 分屬兩軌），故 `--ready-for-5clean` 仍 COMPLETE**〕（`authoring/accepted_exceptions.json`，事實已以官方來源逐字確認，僅因「單一官方權威 vs ≥2 cross_check」或 high-risk 樣式誤判無法自動翻 verified，**不偽造 overlay**）。`AC-KP-VERIFY` 已接受此清冊（只扣真的 binding 且仍 unverified、且 HD 簽署附 source 者；**每筆另綁 `kp_fact_sha`＝sha256(canonical{id,title_zh,exam,beyond})[:16]：該例外 KP 的事實欄位一旦被改，stored sha≠當前 fact-sha→該例外即作廢、其 id 回計入 `binding_unverified`→AC-KP-VERIFY 轉紅，強制 HD 重新逐字確認**——與 overlay 綁 `manifest_sha`、AC-VIZ-1／`deviation_reason.signoff` 綁 sha 的「sha 變則作廢重簽」紀律一致，杜絕「只綁 id」的 waiver 在例外 KP 事實被改後靜默放行；紅隊：非 HD／杜撰 id／壞檔／**缺 `kp_fact_sha`／sha 不符（事實已漂移）**皆不扣、移除一筆即重計）。`AC-NOBACKEND` 依 spec §10.1（其為 Phase 4 exit 最終 gate）＋§0.4 precedence 自 orchestrator P0 改掛 `release`（legacy 外部依賴清理歸實作重構階段）。故 **`--ready-for-5clean` 現 COMPLETE ✅**，依 §12／CF-01 正序**進入本 spec 的 content_audit 5-clean**。下方較早（2026-10-27）的 1203／1876／2083 等數字**及其「進行中／仍待（Phase 0 內容驗證未完成）」狀態語氣**為過程快照，**皆已被本段取代**——當前狀態＝binding 已全數覆蓋、`--ready-for-5clean` COMPLETE；**line 188–196 僅存為歷程紀錄，不再表示 Phase 0 內容驗證尚未完成**（狀態一律以本段為準）。

- **基礎建設（結構件）＝已交付並各自紅隊**：
  1. `authoring/source_registry.schema.json`（draft-07；每 evidence_method 的必填欄：curriculum_scope→official/standard；derivation/program/truth_table/corpus→reproduction_ref；cross_check→≥2 independent_refs；consensus_current→recheck_after）。
  2. `authoring/source_registry.json`（seed；含真實擷取的官方 108 總綱 scope 來源，sha256-16＝`d9558786473e4cde`）。
  3. `tools/ledger_schema_gate.py`（結構/語意層，`--selftest` 證有牙／`--verify` 真驗；紅隊：fact 訴諸 curriculum_scope→擋、high-risk<2 reviewer→擋、缺 fingerprint→擋）。
  4. `tools/verify/`＝anti-fabrication 執行層：`math_checks.py`（sympy 符號/窮舉真驗）＋`run_check.py`＋`repro_gate.py`（以 `.venv` **重跑** reproduction_ref、比對指紋；紅隊：竄改指紋→擋、壞 ref→擋）。接入 registry 為 `chk-repro-gate`（Phase 0 gate）。**另（2026-10-27）建 `cross_check_gate.py`**＝cross_check 事實的 anti-fabrication 對應物：逐 independent_ref **真抓取**、確認登記 `quote` 出現在抓到內容＋≥2 相異 publisher，否則 FAIL（補上「cross_check 原本只結構檢查、可杜撰引文」的洞，見 `GATES_HOLES_LEDGER.md` H-2，`--selftest` 5 壞例全 DENY 紅隊過）；第一批 cross_check 產生時接成 `chk-cross-check-gate`＋promote 要求通過。
  5. **AC-ANTIDRIFT 四錨點全交付並紅隊**（`tools/anti_drift_gate.py` `--verify`／`--selftest` 綠）：(a) 專案 `.claude/hooks/lp-reanchor-guard.py` fail-closed hook＋`settings.json` 掛載（未重讀 spec 即宣告收斂/定案→**DENY**、一般編修不誤擋、壞輸入 fail-open）、(b) carrier `[learning-path-sop]` echo、(c) `~/.claude/rules/learning-path-sop-do-not-delete.md`、(d) MEMORY.md 指標。
- **內容驗證（逐 domain 升 verified）＝進行中（2026-10-27 01:15）**：**release-grade verified 1203 筆**。兩條合法證據路徑並行：
  - **(A) 可重跑自驗（derivation/program/truth_table）**：math 259 ＋ 物理 164 ＋ 化學 81 ＋ 生物/地科量化 64 ＋ 地理量化 28 ＋ 經濟 40 ＋ 生活邏輯/理財/統計 25。`repro_gate` 以 `.venv` 重跑比對指紋，造假/跑不過即 FAIL。
  - **(B) expert_review（技能/主題型 KP，無單一可重現硬事實）**：scope＝官方課綱 ＋ **雙 agent 獨立對抗式審查**（educator＋adversarial-reviewer，皆 PASS 且皆 is_hard_fact=False 才採）→ review 記錄檔綁 sha → promote。已驗 eng 技能/字彙主題 79（skills-01 的 43 ＋ grammar-01 的 36 技能型）、chi 技能 109。高風險（安全/法律/醫療）**不走此路**（promote 要求 consensus_current/cross_check＋≥2 相異 reviewer）。
  - `--phase=0` AC-KP-VERIFY 誠實顯示 **binding 3079−1203 ＝ 1876 待驗**（技能/探究/應用型兩批經雙審 expert_review 採計：`review-skill-inquiry-01` 113＋`review-skill-life-01` 97；夾帶事實主張者退回 cross_check）。**expert_review 技能脈已竭**——剩 1876 幾乎全為 descriptive/rule 硬事實（sci 619／soc-geo 295／chi 244／soc-civ 241／eng 215／life 154〔含 high-risk safety/sel 109 走 consensus〕／soc-hist 107），須真實來源 cross_check，最慢段。eng 文法 210 筆 is_hard_fact 規則型（雙審皆 PASS 但須走 cross_check 真實來源，非 expert_review）＋1 筆 FAIL（mis- 誤標否定字首，入 `content_defect_backlog.json`）＋3 筆 hf 歧見均已退回。**禁一次全標、禁 trivial assert 冒充**；循環/套套邏輯一律移除；reviewer 標 is_hard_fact=true 者退回走 cross_check。驗證模組 `tools/verify/*.py`、review 記錄 `authoring/reviews/*.json`。剩餘以硬事實 cross_check（需 ≥2 真實權威來源）與安全 consensus 為主，屬最慢段。
- **Phase 0 harness ＝已 100% 建成並紅隊（2026-10-27 00:35）**：
  - (ii) ✅ `tools/no_grade_label_gate.py`＋`tools/no_backend_gate.py` 建成並紅隊（`--selftest` 皆 PASS：壞例 DENY／好例 ALLOW／原則兜底抓清單未列向量）。`--qualify` 全綠。evidence：**AC-NOGRADE 連 legacy 都 PASS**（根目錄 learner 可見文字無年段標示，`年級` 命中皆 CSS 註解）；AC-NOBACKEND evidence 誠實 FAIL（legacy `cses_hints.html`＋`index.html` 共 406 外部向量＝字型 CDN／遠端資料，屬 rebuild 時清理）。已知漏洞記於 `authoring/GATES_HOLES_LEDGER.md`（H-1：JS 注入 learner 文字未掃，重構時補 render-after scan）。
  - (iii) ✅ AC-LANG-1 evidence 收斂＝PASS。做法：`scan_simplified.py` 加 `SCOPE_EXCLUDE_LANG`（僅豁免「必須 zh-TW」斷言，**簡體/PRC 掃描仍全域**；紅隊：簡體塞進豁免檔仍被抓 FAIL）；`cses_hints.html`＝正當英文（競程，排除於 K-12）、`googlea8c8d21b7f34ee51.html`＝Google 驗證 stub（53B 非頁面）。
  - (iv) ✅ `tools/spec_converge_gate.py` 建成並紅隊（`--selftest` 7 壞例全 DENY：不足5/連續被打斷/sha不一致/紅隊未過/綁舊sha/無紅隊/未來日；好例 ALLOW）。`--verify-ledger` 誠實 FAIL（spec 尚未開始 5-clean/紅隊，屬定案終點）。
- **仍待（Phase 0 完工的唯一實質內容條件）**：**(i) 其餘 2083 binding-minimum 逐 domain 真驗**——descriptive/rule 硬事實為主，須 cross_check ≥2 **真實註冊權威來源**（chi→教育部辭典、soc-hist→多方交叉防黨國史觀、安全/SEL→consensus_current＋≥2 reviewer…），**不得造假、最慢段**；eng 文法 210 筆規則型已雙審皆 PASS 但仍須走 cross_check 真實來源（agent 意見屬 expert_review，不足證硬事實）。這是唯一還需要大量真實查證的工作；harness 不再是瓶頸。AC-NOBACKEND 的 legacy 外部依賴清理歸入實作重構階段。
- **順序提醒**：Phase 0 全綠 → content_audit 5 連續 clean → 紅隊 → spec 定案 →（使用者確認）→ 實作。

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
  - **必含生活自保技能（使用者 2026-10-26；life 安全/SEL strand）**：**人際與情緒自我保護**——不隨意向不熟/不安全對象透露個人想法與立場；學會**辨識情緒不穩/可能失控的人**並保持界線；遇敏感話題可**選擇保留、得體迴避、轉移或淡化**（**明確區分：這是「隱藏/不表態」的自保，不是教說謊或欺騙**）。一律以 **R16 後果框架**教（「如果在不確定對方反應時就表態，可能遇到…；你可以選擇先觀察、或這樣得體帶過…」），非恐嚇、非「不要講話」命令；由 §8 #7 心理醫生把關分寸（既自保又不致過度封閉/多疑）。
- **R13 課綱＝下限，深度無上限（minimum, not ceiling）**：108 課綱／考試範圍是**必須全覆蓋的最低要求**，
  不是天花板。鼓勵收錄**超綱延伸**知識點（更深、更廣、跨學科、真正理解導向），標記 `tier:t_enrich`、`beyond:true`。
  **延伸上限 = 大學入門程度（university-intro）**：可延伸到大一普通程度（如微積分銜接、普通物理/化學/生物、線代/離散、經濟學原理…），
  以「打好銜接、滿足好奇」為度，不做研究所深度。
  **英文例外（使用者 2026-10-26）**：英文深度**完全無上限**（不受大學程度上限約束），**實用派為主**，優先序明確：
  **(1) 生活與實用（最優先）**——道地日常溝通、**旅居海外能生存**、**出國讀書聽得懂**（survival English／study-abroad listening）、
  慣用語/片語/口語/真實情境；**(2) 各類資格認證（次之）**——TOEIC／TOEFL／IELTS／GEPT 等；
  **(3) 台灣考試（最後）**——會考/學測英文；使用者判斷：前兩者做好，台灣考試通常自然涵蓋、出問題機率很低，故列最後。
  愈道地愈好，一切服務於「用得出來」。
  **關鍵（tier 與 exam 是兩條獨立軸，別把實用英文誤丟進 beyond）**：優先序 (1)(2) 的**生活實用／旅居生存／出國聽課／認證**英文屬**必備**，一律標在 **gated 的 minimum tier**（`t_base`…`t_sub`、`beyond=false`，**受 AC-COV-1 嚴格覆蓋強制**；`exam` 標「無」——`exam` 僅為**台灣升學考試階段軸**＝`_kp_build.py VALID_EXAMS`（無/會考/學測/學測-國綜/學測-國寫/分科-*/探究），**TOEIC/TOEFL/IELTS/GEPT 等國際認證不是 `exam` 受控值**，故實用/認證英文 `exam=無`，其「屬必備」由 `beyond=false` 的 tier 保證、非由 exam 值；認證對應若需記錄另立 tag/欄位，不塞 `exam`，以免觸 B-04 受控詞彙 gate）；只有「超出大學入門、純好奇延伸」的英文才歸 `t_enrich/beyond`（可選、不 gating）。如此 coverage gate 真正強制的正是使用者列為最優先的實用英文，而非只強制列為最後的台灣考試英文——不得倒置。
  **coverage gate 對「課綱 minimum」嚴格**（少一條即 FAIL）；**超綱延伸為加分、不設上限、可選、絕不 gating**，
  且同樣不曝露年段（R11）——以「想更深入？」之類中性邀請呈現，不標「超難／高年級」。
- **R14 英文科以英文學英文（沉浸式，使用者 2026-10-26）**：**英語科**單元的教／練／評一律**以英文為學習媒介**，不得用中文「翻譯教學」當學習路徑（不逐句中譯文法、不以中文解釋取代英文輸入）。**中文的唯一容許用途＝看答案/自評時的對照翻譯，且預設隱藏、鼓勵不看**——以收合元件呈現（如「看不懂？點開中文」），learner 真的不懂才一鍵點開；非教學媒介。本質原則始終是「用英文學英文」。初階可用圖像／情境／例句建立語感，**非靠中文**。此規則**僅限英語科**；其餘各科內文仍全繁體中文（R2）。
- **R15 術語附國際通用英語（銜接大學/國際）**：**所有科目**的專有名詞／學術術語，於**每單元首次出現**時，於中文術語後以括號附**國際通用英語術語**（必要時含常用縮寫），例：最大公因數（greatest common divisor, GCD）、光合作用（photosynthesis）、導數（derivative）。目的：學生既掌握台灣繁體中文術語，又知其國際英語對應，便於銜接大學原文與國際場域。附註英語**不違 R2**（R2 禁的是簡體/PRC 詞，非英語術語）。
- **R16 價值/情意/行為類用「後果框架」，不說教、不貼標籤（使用者 2026-10-26；怎麼教才聽得進去）**：凡公民素養、品格、情緒管理、安全、理財決策等**價值/行為導向**內容，**不用禁令/訓誡/恐嚇式**（「不可以…」「不要…」），改用**後果框架＋尊重自主選擇**（「如果…，可能的後果是…；你會怎麼選？」），呈現選項與後果讓學習者自己判斷。**價值層無絕對對錯**→多元觀點、持平，不灌輸單一立場；事實層（法條/數據/程序）仍走 §6.8 查證。語氣不評判、不貼標籤（呼應既有「零貼標籤」原則），避免心理反彈。由 §8 #7 心理醫生＋領域專家把關。

---

### 2.1 鐵律的細則與範例（§0.3 具體化；未列者之細則＋範例在各專節：R3→§7.1–§7.4、R-STYLE→§6.5/§6.6、R6→§8、R7→§12、R8→§10/§10.1（rollback）、R10→§11.A AC-VIZ-1、R11→§6.1/`no_grade_label_gate`、R12→§4.1/附錄 A、R13→§4.1）
- **R1 正確性**
  - 細則：每個題目正解 **play-through 代入題幹朗讀必須通順無誤**；事實類經領域 expert ＋ 對權威來源查核；數值/公式**可執行就跑 `.venv` 驗證**；不確定標 `(待核)` 不得當真。
  - 範例：✅「6 的因數：1,2,3,6」代入題幹朗讀正確。 ❌「水在標準大氣壓沸點 100°F」（應 100°C／212°F）。 ⚠「玉山 3952 m」——數字須對權威來源，核實前標 `(待核)`。
- **R2 全繁體、零簡體、零 PRC 詞**
  - 細則：每檔過 `scan_simplified.py`＝0 命中。**禁詞權威清單＝該檔的 `SIMPLIFIED`（簡體碼點表）＋ `PRC_TERMS`（PRC 繁體詞 substring 表）**——PRC 詞一律改台灣說法（影片／資訊／軟體／硬體／網路／滑鼠…）；指中國不用「大陸/中國大陸」。`PRC_TERMS` 刻意排除歧義詞（質量＝物理 mass、數據＝台灣亦用）以免誤報。「臺/台」「里（鄰里/公里）」為合法繁體。
  - 範例：✅「軟體」「網路」「影片」「這裡」。 ❌ PRC 說法須改（示例用**未列入 substring gate 的詞**，以免本檔自觸 gate）：「信息→資訊/訊息」「硬盤→硬碟」「中國大陸→中國」；已列入 `PRC_TERMS` 的詞（影片/軟體/網路/滑鼠… 的 PRC 說法）**本檔一律不字面嵌入**，權威清單見該檔。 ⚠「里」於「鄰里/公里」合法，但「裡面」須用「裡」。（本檔與全站禁任何簡體碼點，連反例也不得嵌簡體字形或已登記的 PRC 詞。）
- **R4 輕鬆學 ＋ 視覺化無所不在 ＋ 可玩**
  - 細則：每單元**至少 1 個視覺化或互動**（非純文字長段）；概念**先具體後抽象**；單屏資訊塊符合眼科可讀（§8-6）；「可玩」＝有即時互動回饋，非只讀。
  - 範例：✅分數用可拖曳披薩圖。 ❌整頁純文字定義、無圖無互動。 ⚠動畫過度花俏致分心/暈眩 → 違眼舒適，須可暫停＋尊重 `prefers-reduced-motion`。
- **R5 共用架構、可重抽**
  - 細則：UI 一律用共用層（`game_core`／`concept_engine`／`srs_engine`／`app.css`）；**資料與引擎分離**（sidecar JSON/TS data）；新頁不得複製共用元件 CSS 另立私有版（`design_consistency_gate` 擋）。
  - 範例：✅概念頁設 `window.CONCEPT` 餵共用 renderer。 ❌某頁自寫 `.xx-card` 複製共用卡片。 ⚠bespoke 遊戲可有自有畫面，但仍須用 `window.Game` 計分＋`app.css` token。
- **R9 效能**
  - 細則：單頁**初始 JS ≤ 同類頁基準**（Phase 1 定具體數值，AC-PERF-1）；資產按需載入；不得無限 inline 膨脹；大圖/音檔延遲載、不阻塞首屏。
  - 範例：✅flashcard 依 CEFR 級延遲載 `vocab_data_*`。 ❌把 371KB `anim_core` 無條件塞進純文字概念頁。 ⚠大型 bespoke 遊戲體積偏高 → 允許但須延遲載入＋不阻塞首屏。
- **R14 英文科以英文學英文**
  - 細則：英語科單元的教學輸入／練習題幹／回饋**以英文呈現**；中文**不作為英語科的教學媒介**（不逐句中譯文法規則、不用中文講解取代英文例句與情境）。**中文唯一容許處＝看答案/自評時的對照翻譯，且預設隱藏（收合，鼓勵不看，真的不懂才點開）**。可用圖像／情境／多例句建立語感。自評＝看英文答案後三級自評→SRS（與 R-自評「不假裝自動判讀」一致）。**僅限英語科**；他科內文全繁體（R2）。
  - 範例：✅`eng.t_mid.verb.present-perfect` 單元以英文情境＋時間軸動畫教「have/has + p.p.」，練習為英文填空、回饋為英文提示；例句「She has lived here for ten years.」下方附**收合**的「中文對照（點開）」，預設收合、learner 先試英文理解、不懂才展開。 ❌用中文長篇解釋「現在完成式的用法規則」再附幾個英文例句（中文當教學媒介）、或英文句旁**常駐/預設展開**中譯（違「鼓勵不看」）。 ⚠初學者 onboarding 可極少量中文操作說明（如「點 Next」），但**學習內容本身**仍英文。
- **R15 術語附國際通用英語**
  - 細則：各科術語於**每單元首次出現**時，中文後括號附國際通用英語（必要時含縮寫）：`中文術語（English term[, 縮寫]）`。同一單元內再次出現可只用中文。縮寫有國際慣例者附（GCD/LCM/DNA…），無則免。
  - 範例：✅「最大公因數（greatest common divisor, GCD）」「光合作用（photosynthesis）」「斜率（slope）」。 ❌整個數學單元只寫「最大公因數」從不附英語（違 R15，斷了大學/國際銜接）。 ⚠英語科本身術語即英文，不需再附（R15 針對非英語科的中文術語）。
- **R16 後果框架、不說教不貼標籤**
  - 細則：價值/情意/行為類內容用「情境→選項→各自可能後果→你會怎麼選」結構，取代「不可以/不要」禁令；價值層呈現多元觀點、不定唯一正解（事實層仍查證）；不評判人、不貼診斷/特教/道德標籤；由 §8 #7 心理醫生＋領域專家審「是否持平、是否後果框架、是否零標籤」。
  - 範例：✅「如果借錢不還，朋友可能不再信任你、下次需要幫忙時沒人伸手——你覺得值得嗎？」（後果＋自主）。 ❌「借錢不還是壞孩子，絕對不可以」（訓誡＋貼標籤，心理反彈，違 R16）。 ⚠安全類（如用火/網路安全）仍須明確風險，但以「這樣做→可能發生 X 危險→較安全的做法是 Y」陳述，而非單純恐嚇。

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
  - **學科域**（math／chi／eng／sci／soc-hist／soc-geo／soc-civ）：`<domain>.<tier-slug>.<strand>.<slug>`（例 `math.t_mid.equation.quadratic-formula`）。**⚠ id 為 opaque 穩定識別碼（R2-05 定案 2026-10-26）**：第 2 段僅為「建立時的 tier 命名痕跡」，**非權威、不保證等於現行 tier**；**tier 一律且只讀 manifest `tier` 欄**，任何程式/報表/coverage **禁止由 id 前綴推斷 tier**。重分類只改 manifest `tier`、**不改 id**（id 永久不變以保穩定引用），故 id 段與 tier 欄**容許不一致**（目前 40 例，皆合法，非缺陷）。「第 2 段＝tier」之舊契約**正式廢除**。
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
- **機器可讀 manifest（已產出；Phase 1 起正式納管/驗證）**：已由附錄 A 建置時 emit 於 `authoring/knowledge_points.json`（已存在、已驗證 count=3096（統計由 generator 輸出、勿手寫——T3-04）），一列一 id，欄含
  `{id, domain, tier, strand, title_zh, exam, beyond, verification_status, verification_note, authority_refs[], verified_as_of, verified_by[], src, line, status, unit_ids[]}`（verification 欄見 §6.8/§6.8.1/AC-KP-VERIFY；`verification_status∈{verified, provisionally_verified, pending, unverified}`，T3-05）（與 `tools/_kp_build.py` 實際輸出一致：`exam` 為單一字串如「無/會考/學測/分科-生物」；`beyond` 為布林，`beyond=true ⟺ tier==t_enrich`（超綱，R13）；`unit_ids[]` 由實作填）。此 manifest 是覆蓋追蹤與 §6.2 unit metadata 的連結鍵。
- **涵蓋全域（§2 R12）**：附錄 A 含 (甲) 學科課綱（國小/國中/高中內部 tier）＋ (乙) 跨課綱生活與核心能力
  （安全自保／SEL／學會學習／思考推理／數位媒體素養／資料素養／運算思維科技／理財／永續世界公民／創新）。
  目前量（見附錄 A／manifest，**統計由 generator 產出、勿手寫**，T3-04）：**總計 3096 條**＝學科 2712（chi 355／eng 296／math 263／sci 986／soc-civ 323／soc-geo 355／soc-hist 134）＋跨課綱 life 384。（步③ 全域新增，依域計入：first-aid 拆 bleeding/burn/choking ＋ life.sunk-cost → 計入 **life**；soc-civ.crc-principles → 計入 **soc-civ**，非 life。各項計入其 id 前綴所屬域，勿將 soc-civ 項誤算進 life 384。）
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
- **原 598 條粗胚已被取代（完成式）**：10 域 expert 平行深掘已完成，附錄 A 現為 **3096 條**（各 slice count 已重列，見附錄 A 檔首與 manifest）；598 僅為歷史起點，不再引用。
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
| 科技（運算思維） | ◐ | ◐ | ◐（hub `#path-tech` 有頁但薄；為 §4.1 section G 的 `compute` 能力類別（category，life id 第 2 段；見 §4 id 格式定義／§6.2 GR「段位抽取」＋「id→頁推導」），於此獨立列出避免被「核心能力」吞沒；精確 per-年段覆蓋待 Phase 1 manifest 對映時逐頁盤點精算） |

**結論：高中(G10–G12) 全面最弱**——三自然科 advanced 封頂於國中、數學止於 RSA 無微積分、國文僅 primer；
國小/國中大致齊全；社會歷地公被綑在共用 `social_advanced*`，未依 strand/年段分離。這決定 §4−§5 的 gap 主要落在**高中段**與**社會分流**。

---

## 6. 學習路徑重構設計（設計原則＋具體 backlog；輸入＝§4−§5.5 gap，已回填）

### 6.1 導覽與路徑結構
- 單一**中央 hub**：可見層次＝**curated 島 → subject → strand → tier（級別）頁 → unit**（頂層由島 rollup，見下方「節點↔單元↔頁銜接」導覽層級對映）；**stage（年段）僅內部排序/先備 metadata，絕不作顯示層或顯示字串（R11）**。顯示每單元狀態（建議先補先備/就緒/進行中/已精熟，**四態皆可隨時開啟**）。
- **先備關係（DAG）＝建議，不是門鎖**：每單元宣告 prerequisites；hub 以此**排序與建議**下一步、並在先備未達時給**非強制提示**（見下 R-OPEN），**不鎖定、不禁止打開任何節點**。
- **R-OPEN 不鎖定鐵律（learner 自由瀏覽）**：
  - **任何節點/頁隨時可開**：**嚴禁** disabled／灰掉不可點／隱藏於鎖頭／跳「尚未解鎖」擋下。先備未達**只**顯示**非強制**的黃色提示條「這課會用到 ○○、△△；還不熟的話建議先看 →（連結）」，但內容照常全開、可直接學。
  - **隨時可瀏覽全部內容並直達（但「瀏覽全部」＝分區逐層 drill-down，非一屏攤開全部）**：除漸進揭露的預設視圖外，**永遠提供**一個常駐入口能看到「到底有什麼」並點進任一頁——至少含 (a)「瀏覽全部／完整目錄」：一棵**可達全站**的樹，但**預設各層收合、一次只展開點到的那一區**（島→科目→strand→級別→單元逐層點開），**嚴禁**初次或任何單一動作把全科目×strand×級別×單元一次攤在同一畫面（會「一眼不想看」，與 ND 漸進揭露同一鐵律）；(b)**搜尋**（打關鍵字跳任一單元/頁）；(c) 地圖可自由縮放平移到任何區。設計意圖：**可達性 100%（任何內容都看得到、到得了），但呈現永遠分區逐層、每屏資訊量受控**。漸進揭露是**預設聚焦**，不得成為「看不到／到不了其他內容」的牢籠；「瀏覽全部」也不得反向變成「一屏傾倒全部」。
    - ❌例：點「瀏覽全部」即展開 9 島 × 所有 strand × 所有級別 × 所有單元節點（~600）於同一長頁（資訊轟炸，違 ND；樹葉＝單元節點，見 §6.1「節點＝unit」，非列舉 3096 知識點）。✅例：點「瀏覽全部」先只見 9 個島（收合）；點「數學」才列其 strand（仍收合）；點「數與量」才列初/中/高級；點某級別才列該頁單元——每一步只增一層、每屏皆可一眼掃完。
  - **起點自選、不強制由初級起**：learner 可**自選起點或直跳任一級別**（例：國中程度者直接進「中級」，不被逼先看「初級」——強逼回頭看簡單的只會讓人不想看）。系統**不預設把人丟到初級**；可選的「快速定位/小測」僅為**建議**用、可略過，絕不作為開啟門檻。
  - 動機哲學：引導而不設限——給方向與鷹架，但尊重自學者隨時跳看的自由（§8 #7 心理醫生、#4 學習科學、#10 PM）。
- **路徑而非平面清單**：提供「建議學習順序」的視覺化 roadmap（可玩、具成就感），但允許自由探索。
- **roadmap 視覺風格（O-2 定案 2026-10-26）＝科技樹（主幹）＋地圖式美術（外觀）**：以**節點＝單元、連線＝先備關係**直接把 §6.1 的 DAG 畫成科技樹；
  節點 4 狀態（建議先補先備／就緒／進行中／已精熟，**四態皆可點開**，無「鎖定」態），非只靠顏色區分（附圖示/形狀，眼科 §8-6）。**不顯年段字樣（R11）**、純 `app.css` token（R-STYLE）、
  過 viz-QA（iPad 逐 frame 簽核）。美術可走「地圖/島嶼」風格包裝，但底層資料是先備 DAG，不得為美觀假造不存在的關卡順序。
- **節點 ↔ 單元 ↔ 頁 的銜接（與 §6.2 GR 一致，杜絕「點了不知落哪」）**：roadmap **節點＝單元（unit）**；一個「科目×strand×tier 頁」是同主軸同級別**多個 sibling 單元的容器**，在地圖上呈現為**一叢相鄰節點**（或可收合的群組地標，群組標題＝該頁級別名如「數與量（中級）」）。點任一節點＝**深連到該單元所在頁 ＋ 頁內 anchor**（捲動/高亮該單元），不另開一檔。故「瀏覽單位＝單元、檔案單位＝strand×tier 頁」並存不衝突：導覽以單元為節點、落點以頁+anchor 實現。導覽層級對映（**僅列 learner 可見層；R11 不含年段**，由上而下）：**curated 島（頂層，9 個、≤12）→ subject（domain／life category）→ strand＝地圖分區 → strand×tier＝頁（節點叢）→ unit＝節點**；**stage（年段）僅內部排序/先備 metadata，不對映任何可見層、不作顯示字串（R11）**。
  - **curated 島 ↔ subject 對映（機械可推、全覆蓋 7 學科 domain＋10 life category；島＝策展視覺群組，subject＝GR id 推導鍵）**：單一 subject 的島點進去直接到其 strand；複合島先展開其成員 subject 再到 strand。
    | 島（頂層可見） | 成員 subject（domain／life category） |
    |---|---|
    | 安全 | `life.safety` |
    | 核心能力 | `life.sel`／`life.learn`／`life.think`／`life.data`／`life.sustain`／`life.innovate` |
    | 數學 | `math` |
    | 英文 | `eng` |
    | 國語 | `chi` |
    | 自然 | `sci`（phys／chem／bio／earth strands） |
    | 社會 | `soc-civ`／`soc-geo`／`soc-hist` |
    | 科技 | `life.compute`／`life.digital` |
    | 理財 | `life.finance` |
  - 故頂層 9 島 ≠ 17 個 GR subject：9 島是策展 rollup（單一或複合），subject 是島下一層；GR 的 id→頁推導（§6.2 GR「id→頁推導」）仍以 subject（domain/category）＋strand＋tier 為鍵，不受島分組影響。
- **ND 漸進揭露鐵律（anti-overwhelm；全站 ~600+ 節點/單元，首屏絕不可把人「一眼擊垮」）**（註：~600+ 指節點/單元數，非頁數；頁數以 §5.1 的 ~100 現有頁＋gap 新增頁為準，節點≠頁，見 §6.1 節點↔單元↔頁銜接）：
  - **禁止 first-paint 傾倒全圖/長清單**：任何畫面初次載入**不得**一次渲染全部節點或一條超長捲動清單。首頁只顯示三樣：(a) **單一最醒目的「接著學這個／今天建議」CTA**（1–3 個當前可學節點，回訪者一眼知道下一步）；(b) **少數頂層島入口**（頂層島/大島，**≤ 12 個**；「島」是最上層策展群組，非 §6.1 的 17 項 subject；此處用「島」不用「分區」——「分區」已保留給 strand 層，見本節末與 §6.1）；(c) 精簡**總進度概覽**（非逐節點）。
  - **地圖預設縮放在「島/分區」層、逐層展開**：進某島先看其 strand 分區（**收合態**）；點某分區才展開其級別（tier）與單元節點——**一次只深入一區**，不同時攤開所有 strand×tier。（「島」＝頂層 9 策展群組；「分區」＝strand 層，見 §6.1 導覽層級對映；勿把 strand 分區也叫「島」。）
  - **聚焦前緣（視覺焦點，非門鎖）**：預設**高亮少數「就緒」節點**（建議前緣）；已精熟者淡化/收合，較遠節點以**輪廓/淡化**呈現（給方向感、降壓迫）。預設視野**可見節點數有上限**（確切門檻 **≤15**，其餘摺疊）。**但此僅為預設聚焦**：任何淡化/摺疊節點都能一鍵展開並點進去（呼應 §6.1 R-OPEN「隨時瀏覽全部並直達」），**不得**用霧區當作「看不到/到不了」的變相鎖定。
  - **單一明確下一步**：回訪永遠有**一個**最明顯的「繼續」動作，不是 600 選 1。
  - **受把關角色**：§8 #4 學習科學（降認知負荷/chunking）、#7 心理醫生（不被擊垮、持續成就感）、#9 空間美感、#10 PM（讀者旅程）、#6 眼科；首屏與每層展開畫面納入 viz-QA 逐 frame 簽核（R10）。
  - ❌例：首頁一次 render 全部 ~600 節點、或一條把所有 strand 列完的長清單（違 ND，擋關）。✅例：首頁＝1 個「繼續：分數加減（中級）」大卡 ＋ 9 個島 ＋ 一條總進度；點「數學島」才展開其 strand 分區，點「數與量分區」（數與量＝strand）才展開初/中/高級節點。

### 6.2 單元設計規格（每個 Unit 的統一骨架）
- **粒度與檔案映射鐵律（R-GRAIN；杜絕「一知識點一檔」誤解與檔名爆炸/連鎖改名）**：
  - **知識點 ≠ 單元 ≠ 檔案**。知識點（附錄 A 3096 條）是**標籤**（micro-skill id），用於覆蓋追蹤（manifest `unit_ids[]`），並作為 §9 知識隔離／先備計算（K(U)=K_pre∪teach(U)）與 §6.6 rubric⑦「真教真考」綁定的**連結鍵**；但**不作為檔案/頁的切分依據**——**嚴禁「一個知識點生一個 HTML 檔」**。
  - **單元（unit）**是一個「教→練→評」小叢集，`knowledge_point_ids[]` 為**清單**——一個單元可掛**數個相關知識點**；單元大小以**認知負荷**（`est_minutes≤12`、不過載 INV-4）為界，**不以「每條知識點各一單元」為界**。
  - **一個 HTML 頁可容納多個單元**（unit＝頁內區塊/stepper，沿用現站「一頁多概念」模式）；**不得**為了對映知識點把站點炸成數百~上千個檔。
  - **既有檔名/路徑一律穩定**：reuse 的頁**原地包裝、保留原檔名與路徑**；rebuild 只改**內容**不改檔名；**禁止大規模改名/搬移**（否則書籤、跨頁連結、獎勵 `progKey`、git history 全斷，牴觸 never-disappear 精神）。確有必要改名＝例外，須附 redirect ＋ `progKey` 遷移對照，並依 §6.3／§7.1（`learning_progress_v1` 的 additive-merge／壞檔不重設／migrate）保護逐單元進度不遺失（獎勵 `player_profile_v1` 以穩定 id 識別、不受檔名影響，故 §7.3 RT 不涵蓋改名→進度遷移）；預設**不改名**。新增頁才給新檔名。
  - **頁面分組規則（GR；可從知識點 id 機械推導，稽核一眼對得上）**：
    - **預設分組＝一個「科目 × strand（主軸）× tier（級別）」一頁**。**段位抽取（兩域不同，須分開）**：學科域 `<domain>.<tier>.<strand>.<slug>`→ tier＝第 2 段、strand＝第 3 段；life 域 `life.<category>.<strand>.<slug>`→ 第 2 段是 category（當 subject 分區用）、strand＝**第 3 段**、**tier 不在 id**。**tier 一律讀 manifest `tier` 欄（唯一權威），不得以 id 位置推斷**（呼應 §4「tier 一律讀 manifest tier 欄」）：學科域 id 第 2 段為 opaque 命名痕跡、**非權威**（R2-05：id 不可解析 tier，容許與 tier 欄不一致），一律以 manifest `tier` 欄為準；life 域 tier 不在 id，只能自 manifest 取。該頁 host「此主軸、此級別」的所有單元（頁內節點依 `prerequisites` 由淺到深）。例：`math.t_base.numquant.*` → 頁「數與量（初級）」、`math.t_mid.numquant.*` → 頁「數與量（中級）」（strand `numquant`＝「數與量」，見附錄 A §一；勿誤名為「數論」number theory）——**不把一個主軸從國小到高中塞進單一巨頁、不混級**。
    - **級別頁名用中性難度詞、不曝露年段（R11 鐵律）**：tier→級別對照＝`t_base→初級`、`t_mid→中級`、`t_adv→高級`、`t_sub→深階`（**用「深階」不用「進階」**：與 §4「分科深階層」自洽，且明確高於「高級」——「進階」在台灣慣例常與/低於「高級」，兩者難分高低，故不用）、`t_enrich→延伸挑戰`；級別高低序為 初級＜中級＜高級＜深階＜延伸挑戰；頁名**只能**用這些中性詞，**嚴禁**「國小/國中/高中/年級/會考/學測/分科」等年段字樣（`no_grade_label_gate` 掃描）。
    - **防碎片併頁（唯一允許的偏離，機械可判）**：某 `(科目,strand,tier)` 的 minimum 知識點數 **≤3** 時，**併入同 strand 相鄰的較低級別頁**（無較低級則併較高級），避免只有 1–2 條的空頁；併入後該頁名仍取主級別、頁內分段標注。此門檻（≤3）寫死、非主觀。
    - **拆頁條件**：若某頁觸 **R9 效能預算**（初始 JS/體積超標或低階裝置卡頓），再依 slug 群組拆子頁（檔名加後綴），仍保留 id→頁可推導、既有檔名穩定。
    - **某知識點的 home 頁可機械推導**：學科域＝(domain, strand=第3段, tier 取自 manifest `tier` 欄)→頁；**life 域＝(category=第2段, strand=第3段, tier 取自 manifest `tier` 欄)→頁**（因 life id 不含 tier）；**兩域 tier 一律以 manifest `tier` 欄為準**（學科域 id 第 2 段僅供人眼參考，非推導來源），再套上述併頁規則。故 `coverage_gate`／稽核可機械核對「每個 minimum id 落在其應屬的頁、且該頁有真教真考的單元」，無模糊空間。
    - **既有頁沿用此對映**：把每個既有檔標記其 (科目,strand,tier) 歸屬、**保留原檔名**；同一 (strand,tier) 現況散在多檔者以 roadmap 串起、**不強制合檔**（合檔＝改名風險，預設不做）。
    - ✅例：`數與量（初級）`＝`math.t_base.numquant.*`、`數與量（中級）`＝`math.t_mid.numquant.*` 各一頁（條數以 manifest 實際為準）。❌例：(a) 一頁「數與量」從國小塞到高中混級（違預設級別分頁）；(b) 頁名叫「數與量（國中）」（違 R11 年段）；(c) 為單一 slug `present-perfect` 另開一檔（違粒度：同 strand,tier 內各 slug 是頁內單元，不另立檔）。
- `教`：概念具體化／視覺化（圖解或互動 stepper），符合 §3.3 INV 與 R4；eye-comfort（§8-6）。
- `練`：可玩、即時、低門檻；題型契合該知識點（如數學非選要能寫步驟）。
- `自評`：翻答案→三級自評（還不熟/快會了/會了）→ 餵 SRS（srs_engine）；**不假裝自動判讀**。
- `metadata`：`unit_id`、`subject`、`strand`、`knowledge_point_ids[]`、`prerequisites[]`、
  `est_minutes`（認知負荷/倦怠控制）、`deviation_reason`（**條件性/選填**：僅在偏離 §6.6 細則① golden 範本時必填，供 AC-UNIT-3 讀取；不偏離則省略。**結構為 `{category(∈DEVIATION_CATEGORIES enum), note, signoff:{by[],sha}}`，非自由字串**——見 §6.6① 的放行條件）。
  - **`stage`（年段）＝選填內部 metadata，非必填、非顯示（R11）**：排序一律用 `tier`＋`prerequisites`，不用 stage（stage 與 tier 高度重疊）；若存在僅供內部課綱對照/報表，**絕不**進 learner-facing 輸出。schema 不要求 stage 必填。
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
- ✅**正例**：`eng.t_mid.verb.present-perfect` 單元＝教（時間軸動畫示現「已完成且與現在有關」，token 色）→ 練（看情境選 have/has＋填空，即時回饋）→ 評（翻答案→三級自評→SRS）；metadata 齊（`prerequisites:["eng.t_mid.verb.past-simple-irregular"]`、`est_minutes:4`（公式：1 teach×1.5 ＋ 1 practice×1 ＋ 1 互動viz＝3.5→4））。
- ❌**反例**：一個單元塞「現在完成＋過去完成＋完成進行」三概念、`est_minutes:25`、只有教學文字無練無評 → 違 R4/§6.6①、INV-4（過載）、`est_minutes>12` → 擋關、須拆成 3 單元。
- ⚠**邊界**：純聆聽單元（無文字輸入）→ 仍須「教＋至少一個 retrieval（如聽後選圖/口說跟讀）＋自評」，不得只播音檔就算完成。

#### 6.2.2 單元「內容」資料 schema（權威欄位表；R14/R15/rubric⑦⑤/§6.3/§7.4 皆依賴，動工前必須定案）
> 盲點修補（2026-10-26 角色模擬）：§6.2 原只定 **metadata**，未定「教→練→評」**內容本體**的欄位，導致 R14 收合中文、R15 術語、rubric⑦ 真教真考、rubric⑤ 自評+SRS、§6.3 進度、§7.4 徽章全部懸空。此節補上**唯一權威的單元內容資料契約**。
- **存放（單一來源，R5）**：單元 metadata＋內容走 **sidecar 資料**（`<page>.units.json`，一頁一檔，含該頁所有單元陣列）＋共用 renderer；頁內以 `data-unit-id="<unit_id>"` 標出單元 DOM 邊界（供 §9 模擬器/`unit_acceptance_lint` 定位）。中央 `authoring/units_index.json` 由建置工具彙總所有 `*.units.json`（見 §6.7）。
- **細則（每個 unit 物件的必填欄位；JSON Schema 由 `AC-SCHEMA` 機器驗）**：
  1. `unit_id`（§6.3 規則）、`knowledge_point_ids[]`（宣告所掛知識點，皆須存在於 manifest）、`prerequisites[]`、`est_minutes`、`subject`、`strand`（`stage` 見 §6.3 註：非必填）。
  2. `teach[]`：教學段陣列，每段 `{kind:"text|viz|example", body, kp_ids[]}`——**每段必標 `kp_ids[]`**（此段教哪些知識點）。
  3. `practice[]`：練習題陣列，每題 `{question_id, type, stem, options?, answer, feedback, kp_ids[], required_kp_ids[], answer_evidence[], distractor_rationales{}, validation_method}`——**每題必標 `question_id`（穩定題鍵，與 §6.8.1 第三層 question 的 `question_id`、§9.5 模擬輸出 `per_question_kp_attribution.question_id` 同值同命名空間，供歸因完整性 join）＋ `kp_ids[]`**（此題考哪些知識點）。**此 `practice[]` 物件即 §6.8.1「第三層 question」證據紀錄的實體載體**（`required_kp_ids[]`／`answer_evidence[→claim_id]`／`distractor_rationales{}`／`validation_method∈{exhaustive|oracle|source|expert}` 的**語意 home 定義見 §6.8.1**，欄位**物理上存於本 `<page>.units.json` sidecar**、由 `AC-SCHEMA`/`unit_schema_gate` 依本節 JSON Schema 機器驗）：`required_kp_ids` **必填非空且 `⊇ kp_ids`、每 id 存在於 manifest**（§9.5/§9.6 反偷看歸因 join 的運算元，存在性＋完整性鐵律見 §6.8.1）；MCQ 必填 `distractor_rationales`、事實型題必填 `answer_evidence`（指向本單元 `claims[]` 的 `claim_id`，見細則7），非事實型 drill 可省（schema 標 optional）。
  4. `selfeval`：固定三級自評（還不熟/快會了/會了）→ 餵 `srs_engine`（rubric⑤）；**不假裝自動判讀手寫/作答**。
  5. `zh_hint`（R14，僅英語科）：每個英文 teach 段/例句**可**附中文對照字串，renderer **預設 collapsed**（`AC-NAV` 掃「中文對照 default-collapsed」）。
  6. `term_refs[]`（R15）：本單元首次出現的術語 key 清單，英語對照一律查 `term_glossary.json`（§6.7），renderer 自動渲 `中文（English, ABBR）`——**作者不手打英語**，避免 slope/gradient 不一致。
  7. `claims[]`（§6.8.1 **第二層**）＋ 各 `teach[]` 中 `kind=="viz"` 段的 `scene`（§6.8.1 **第四層**）：**事實宣稱與圖/動畫 scene 的證據紀錄亦實體承載於本 `<page>.units.json` sidecar**（非只散文、非只在 ledger）——`claims[]` 每筆 `{claim_id, text, kind(definition|numeric|causal|historical|legal|health|language-usage), source_refs[], verification_ref, risk_class(normal|high), status}`（本單元所有事實宣稱；純技能型無事實宣稱單元可為空陣列）；viz 段 `scene` 每筆 `{scene_id, claim_ids[], 圖例語意, frames[], content_reviewer}`（語意 home 定義見 §6.8.1 第二/四層）。兩者皆由 `AC-SCHEMA`/`unit_schema_gate` 依本節 JSON Schema 機器驗。**`fact_check_ledger.json` 的 `entries[]` 不承載上述內容本體，僅以 `key`（`unit_id`，或 unit-qualified `<unit_id>#<claim_id|question_id|scene_id>`——子 id 僅單元內唯一故須 unit-qualify）引用這些紀錄做正確性簽核層**（§6.8「三層驗證」之簽核層／ledger 條目 schema）——故 §9.5/§9.6 與 §6.8.1 所依賴之 `required_kp_ids`／`claim`／`scene` 運算元**恆有已定義的載體檔＋schema 可驗**，不再只存在於散文（消 undefined-carrier）。**單元內 id 唯一性＋參照完整性（schema 鐵律，防 join／綁定 fail-open）**：`question_id`（細則3）／`claim_id`／`scene_id` 在本單元 sidecar 內**各須唯一**（重複＝`unit_schema_gate` FAIL，比照 AC-COV-2『manifest 重複 id＝0』，使 §9.5/§9.6 的 `question_id` join 為良好定義之鍵）；且 `answer_evidence` 的每個 `claim_id`、`scene.claim_ids[]` 的每元素**必解析到本單元 `claims[]` 既有 `claim_id`**（懸空參照＝FAIL，比照 kp『每 id 存在於 manifest』），否則『feedback 綁 claim』與四層 visual↔claim 綁定落空。
- **rubric⑦「真教真考」tag 綁定機器可驗（兌現 §11.A AC-COV-1）**：因每 `teach` 段與每 `practice` 題都帶 `kp_ids[]`，`unit_acceptance_lint` 機械檢查 **`knowledge_point_ids[] ⊆ (∪teach.kp_ids) ∩ (∪practice.kp_ids)`**（宣告集必須既被標在某 teach 段也被標在某 practice 題）。**誠實分級（§0.2，非 overclaim）**：此為 **tag-set 成員資格**的確定性檢查（宣告 id 必須同時現身於某 teach 段與某 practice 題的 `kp_ids`），堵「宣告卻零 tag」的 declaration-stuffing；但「該 teach 段是否*真的把該 kp 教會*、該題是否*真的考到它*」屬語意、非此 lint 所能判，由 §8 content_audit 專家 panel（領域/學習科學鏡）＋ §9 `taught_kps_exercised` 二次確認 backstop。故此處「機器可驗」指 **tag 綁定確定性**、不宣稱語意教學品質已機器化。
- **既有 `concept_engine` 升級契約（§5.4 指名重用，但現版不相容）**：現 `src/concept_engine.ts` 的 `lessons[].steps[]` 僅 teach+quiz（對錯選擇）、無自評三級、不接 `srs_engine`、進度存各頁 progKey、無 `kp_ids`/`zh_hint`/`term_refs`。**定案要求**：concept_engine 升級為新版，支援上列 schema（selfeval3 / SRS / `learning_progress_v1` / zh-collapse / per-segment kp_ids / term_refs），且 `lessons` 以 `unit_id` 命名；升級本身走 §6.4 重構（逐檔 5 clean）。
- **est_minutes 估算法（消 §0.3 模糊）**：`est_minutes ≈ teach段數×1.5 + practice題數×1 + （含互動viz 每個+1）`，四捨五入；作者宣告值與此公式差 >50% 須附理由。門檻仍 ≤12（INV-4）。
- **範例**：✅ 英文單元 `eng.t_mid.verb.present-perfect`：`teach:[{kind:"viz",body:時間軸動畫,kp_ids:["eng.t_mid.verb.present-perfect"]}]`、`practice:[{type:"cloze",stem:"She ___ here for ten years.",answer:"has lived",kp_ids:["eng.t_mid.verb.present-perfect"]}]`、每句 `zh_hint` 預設收合、`selfeval` 三級、`est_minutes:4`（公式：1 teach×1.5 ＋ 1 practice×1 ＋ 1 互動viz＝3.5→4）。 ❌ 一個 `teach` 段不標 `kp_ids`（rubric⑦ 無法驗）、或英語科作者手打「中文教學規則」當 teach body（違 R14）、或 practice 無 `kp_ids` 卻宣告該 KP（宣告集⊄考集，lint FAIL）。 ⚠ 多知識點單元：`knowledge_point_ids` 列全部，且**每條都要**在某 teach 段與某 practice 題的 `kp_ids` 出現，否則該條未真教真考。

### 6.3 進度與精熟
- 逐單元進度存 localStorage；精熟由 SRS 狀態 ＋ 自評歷史決定。
- **逐單元進度的統一納管規則（兌現 §5.4 指派：progKey 與主 `player_profile_v1` 如何統一而不破壞 §7 永不消失）**：
  - **細則**：
    1. **獨立 key、不寫入 `player_profile_v1`**：進度存於獨立 key **`learning_progress_v1`**（與獎勵 key 分離——§7.2 已定 `player_profile_v1` 只由 `game_core.js` 寫入，進度模組不得改寫它，避免兩寫者互毀）。
    2. **穩定命名**：`learning_progress_v1.units[<unitId>]`。此處 `<unitId>` 即 §6.2 metadata 的 **`unit_id`** 欄同一值（JS 存取子寫 camelCase、metadata 欄寫 snake_case，指同一識別子，非兩個鍵）。`unit_id`＝**單元自有的穩定 slug**，**依域兩種格式（比照 §4 id 格式定義／§6.2 GR「段位抽取」，別宣稱單一格式）**：學科域 `<domain>.<tier>.<strand>.<unit-slug>`、life 域 `life.<category>.<strand>.<unit-slug>`（tier 不在 id、讀 manifest）；與 §4 知識點 id **同命名空間、同格式族**但**獨立識別**：單一知識點的單元**可**沿用該知識點 slug 當 unit-slug；**掛多個知識點的單元**另取一個代表性 unit-slug，其 `knowledge_point_ids[]` 清單列全部所掛知識點——`unit_id` 與知識點 id 屬**獨立識別空間**：單一知識點單元的 `unit_id` 字串**可**與該知識點 id 相同（非要求字串相異），重點是 `unit_id` **在語意上不是「某一個知識點 id 的代稱」**（單元可掛多個知識點），呼應 §6.2 R-GRAIN「知識點≠單元、一單元可掛數個知識點」。**與檔名無關、改名不變**（GR 是「由 id 推導檔名」而非反向，故改名時鍵不動、進度不遺失；§6.2 R-GRAIN 改名例外條需遷移對照的只是舊式頁內 progKey，非此 unit_id）；值含 `{srsState, selfRatings[], lastSeen, mastered:bool}`。**嚴禁用陣列索引或頁順序當鍵**（改版會錯位，牴觸 never-disappear）。**`unit_id` 跨全站全域唯一**（作為本 progress key／§6.7 `units_index` 解析／§9.4 `sequence_id` 的跨檔主鍵，任兩 `*.units.json` 的 `unit_id` 撞號＝FAIL，由 units_index build／AC-SCHEMA 強制，見 §11.A AC-SCHEMA；否則進度合併/索引解析/DAG 節點會崩）。
    3. **與獎勵的對映（解耦但可連動）**：進度前進**事件**可呼叫 `window.Game` 發獎勵，寫入落在 `player_profile_v1`；進度本身留在 `learning_progress_v1`。兩 key 各自持久化，互不覆寫。
    4. **沿用 §7.1 的三道保護**：`learning_progress_v1` 一律套 §7.1（a）**壞檔不重設**（解析失敗→備份 `learning_progress_v1__corrupt_<ts>`、保留記憶體值、絕不空白覆寫）、（b）**additive 合併**（只補預設不覆蓋既有）、（c）**真實 migrate()**（讀存檔 `version` 欄比對當前常數逐版遷移，不讀自我恆等值）。
  - **範例**：✅ 完成 `eng.t_mid.verb.present-perfect`→寫 `learning_progress_v1.units["eng.t_mid.verb.present-perfect"].mastered=true`，另呼叫 `Game` 加 XP（落 `player_profile_v1`）；重整後兩者皆在。
  - ❌**反例**：把逐單元進度塞進 `player_profile_v1`（與 game_core.js 搶寫、違 §7.2 單一寫者）、或用 `units[3]` 索引當鍵（改版錯位）、或進度壞檔時以空白物件覆寫（違 §7.1 壞檔不重設）。
- 進度與**獎勵解耦**：進度前進可觸發獎勵，但獎勵一旦賺得即永久（§7）。
- **共用持久化模組 `safe_store.js`（單一來源，R5；§7.1 三道保護不得各寫各的）**：抽出共用 helper，`game_core.js`（`player_profile_v1`）與進度模組（`learning_progress_v1`）**都引用同一個**，含：
  1. **load 順序鐵律**：`raw ← readLS` → `migrate(raw)` → `normalize`；**`normalize` 不得注入 `version` 預設**（version 只能由 migrate 決定），否則舊檔被 normalize 補成當前版、migrate 永遠偵測不到（RT-4 失效）。
  2. **migrate() 契約**：`migrations = {2:fn,3:fn,…}` 有序表；每步 `migrateV_n(profile)→profile` 純函式；版本來源＝`profile.version`、目標＝該 key 的 `SCHEMA_VERSION` 常數；找不到步驟時保留原值並告警、不丟棄。**版本遞增判準**：欄位**改名/語意變/結構重組**走 migrate；**純新增欄位**走 additive-merge（不必 bump）。
  3. **additive per-field 合併策略表**（additive-merge 與跨分頁 `onStorage` 共用）：`union-set`（`ownedItems`/`badges` 鍵/已完成 unit 集）、`monotonic-max`（`totalXp`/`coins`/`longestStreak`/mastery 等級）、`last-write`（**每個可裝備外觀型別的 `equipped<Type>` 欄——`equippedSkin`/`equippedBorder`/`equippedMascot`/`equippedAvatar`，且對 `reward_catalog.json` 的 equippable 型別枚舉參數化（新增型別自動納入，不得漏列）**／`displayName`/`settings`）、`union-object`（`activity`/`subjects`）。**earned 類一律 union/max、永不縮小**；**合併策略表本身對 equippable 型別枚舉參數化**：枚舉中任一 equippable 型別無對應 `equipped<Type>` 合併策略 → `safe_store`/schema gate FAIL（杜絕「§7.4 定四型別可裝備、合併表只列 Skin/Border」的型別漂移使新型別 equipped 狀態被丟）。
  4. **壞檔不重設**：解析失敗→備份 `<key>__corrupt_<ts>`（**同內容只備份一次**、**最多留 3 份、超出時刪最舊**，防配額爆量）→ 保留記憶體值；**首次 load 即壞**→記憶體用 fresh 但設 `readOnlyUntilResolved` 旗標**禁止 save 覆寫磁碟**、觸發提示，待使用者確認才可寫。
  5. **reset 守門（RT-10）**：`reset()` 須帶 `{userConfirmed:true, gestureToken}`，token 僅由 UI 手勢產生；程式路徑呼叫一律拒絕（紅隊植入程式呼叫→斷言被拒）。
  6. **earned 單調不減不變量（RT-9）**：`save` 前驗 earned 集合（`ownedItems`/`badges`/`totalXp`）不得比上次持久值縮小，縮小＝視為誤清→拒寫＋回滾（非 exception 也要擋）。
- **既有 `concept_engine` progKey → `learning_progress_v1` 遷移通則（§5.4；Phase 2 接線時，非只改名例外）**：現站每頁自有 progKey（如 `concepts_v1`）。Phase 2 把既有頁接入路徑時，須以 **additive** 把舊 progKey 進度搬進 `learning_progress_v1.units[<unit_id>]`（對照表 `authoring/progkey_migration.json`：`{old_progKey, new_unit_id, note}`，由改名/接線 PR 維護），**舊 progKey 保留不刪**（雙保險、never-disappear），搬遷走 §7.1 壞檔保護。對應新增 RT。
- **localStorage 被清/驅逐的緩解（RT-12；iPad Safari ITP 7 天驅逐會打穿 never-disappear）**：見 §7.1 的匯出/匯入進度檔與邊界聲明——進度與獎勵的 never-disappear **僅保證「同瀏覽器、未被使用者/瀏覽器清除」**；跨裝置/被驅逐的正當解＝純前端匯出/匯入。

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
     `authoring/golden/<archetype>.html`（＋其資料）。之後每個新單元 MUST 與對應 golden 做結構 diff（相同的區塊骨架、共用 class、互動模式、a11y、viz 規格）；偏離須在 unit metadata 寫 `deviation_reason`，否則 gate 視為漂移。**`deviation_reason` 不是自由文字免死金牌（§0.2「承諾無效、只有 fail-closed 機器強制」）**：要讓 AC-UNIT-3 放行，該偏離 MUST (a) `category` 取自 **allowlisted 偏離類別 enum**（`authoring/deviation_categories.json`，如 `bespoke-game-screen`/`archetype-subtype`/`a11y-accommodation`…）＋ (b) 帶 **golden-owner／§8 panel 簽核綁定該單元的 `unit_content_sha`**（`signoff:{by[],sha}`；`unit_content_sha`＝`sha256(canonical_json(該單元的 §6.2 metadata〔含 `deviation_reason.category`／`deviation_reason.note`〕 ＋ §6.2.2 item 1–6 內容欄位, sort_keys=true))[:16]`，**唯一排除任何 `signoff` 子物件本身（`deviation_reason.signoff` 及其他 signoff 清單）**，與 `cat_fact_sha`／AC-VIZ-1 同一「不把 signoff 欄納入自己 pre-image」排除紀律，使 pre-image canonical、可重現、不自我指涉；**因 `deviation_reason.category`／`note` 已納入 pre-image，簽核後竄改偏離類別即 `unit_content_sha` 失配→簽核作廢重簽**（堵「偷改 category 不作廢」），任何單元內容或偏離理由一改皆重簽）——**`by[]` 必須綁簽核者身分，非僅憑存在**：每個元素 MUST ∈ **§8 簽核者角色 allowlist**（closed set，枚舉於 §8 表末「簽核者角色 allowlist」條目＝`{golden-owner}` ∪ §8 表「角色 id」欄 13 值），且 `by[]` MUST 含**必填子集＝`golden-owner` ＋ 該 category 的 `required_signer_roles[]`**（由 `authoring/deviation_categories.json` 該 enum 項逐項宣告的 §8 角色 id，即此 category→§8 審查鏡角色的**確定性對映**，非散文舉例）；含任何非 allowlist 身分（如 `"self"`／空字串／杜撰）或缺必填簽核者即**無效**（防「自簽架空 panel」）；僅有非空自由文字、或 `category` 不在 enum、或簽核 sha 不符、**或 `by[]` 身分不合/缺必填者**，`unit_acceptance_lint` 一律 **FAIL**（不得以任意藉口放行）。
       **（enum 本身不是散文鎖檔——§0.2「承諾無效、只有 fail-closed 機器強制」同樣適用於『新增類別需簽核』這道，否則漂移 session 可逕自把杜撰類別寫進 enum 檔並自簽單元，使 `category∈enum` 這道形同虛設）**：`authoring/deviation_categories.json` 的**每一個 enum 項**自身 MUST 帶 (i) **非空 `required_signer_roles[]`**（每元素 ∈ §8 角色 id allowlist，即此 category 要求哪些 §8 審查鏡角色簽核；它＝上文 `by[]` 必填子集的 category→角色對映載體，使 `unit_acceptance_lint` 有確定性可查的 referent，非散文舉例）＋ (ii) **美術（`art`）＋空間（`spatial`）雙簽核，`signoff.sha` 綁定該項的 `cat_fact_sha`**（＝`sha256(canonical_json({category, required_signer_roles}, sort_keys=true))[:16]`；**仿 `accepted_exceptions` 的 `kp_fact_sha`——只雜湊該項的 `category`＋`required_signer_roles` 子集、明確排除 `signoff` 欄本身**，以免「sha 欄寫在同一檔內→自我指涉、無法產出有效 pre-image」，並使 pre-image canonical、可重現、確定性比對）（`{category, required_signer_roles:[…§8 角色 id，非空], signoff:{by:[art,spatial], sha}}`；某項的 `category`／`required_signer_roles` 一改→該項 `cat_fact_sha` 失配→該項簽核作廢須重簽）。`unit_acceptance_lint`（或獨立 enum gate）在讀取 `deviation_reason.category` 前，先驗該 category 的 enum 項有**非空且 ⊆ allowlist 的 `required_signer_roles[]`** 且有**有效 sha-bound 雙簽（`signoff.sha`＝現算 `cat_fact_sha`）**；缺 `required_signer_roles`／其含非 allowlist id／缺簽／`signoff.sha` 不等於現算 `cat_fact_sha`／雙簽不齊者，該 category **視為無效**，引用它的單元偏離一律 **FAIL**。紅隊：無雙簽逕自新增一類別→DENY、`required_signer_roles` 空或含杜撰 id→DENY、合法（`required_signer_roles` ⊆ allowlist ＋ 美術＋空間雙簽綁該項現算 `cat_fact_sha`）→ALLOW、改動某項 `category`／`required_signer_roles` 後未重簽→該項 `cat_fact_sha` 失配使該類別失效、引用單元 FAIL。
     - **golden 自身的 bootstrap（消循環，O-9）**：golden 是「第一個」該原型單元，無前一個 golden 可比→**其滿分 bar 由 WRITERS ＋ §8 六審查鏡（native-English #2／溝通語言學家 #3／學習神經科學 #4／知識視覺化 #5／眼科 #6／PM #10）＋ §8 全 panel 逐項簽核**認定（而非 `AC-UNIT-3` 結構 diff，對 golden 自身**豁免** `AC-UNIT-3`）；簽核通過才 commit freeze、成為後續單元的 diff 基準。freeze 綁 sha，golden 內容變＝重簽。
     - **bespoke 多 golden 子類**：bespoke 遊戲差異極大（如 math_modeling vs safety）→允許**多個 golden 子類**（或改以「共用層使用清單」為 diff 基準），避免單一 golden 逼出大量 `deviation_reason` 而弱化 `AC-UNIT-3`。
  2. **單元驗收 rubric（逐條 pass/fail，全過才算完成）**：① 教→練→評三段齊備；② 僅用 `app.css` token、零硬編色碼／px 魔術數（design_consistency_gate）；
     ③ 內容卡自適應寬（R-STYLE-3）；④ **每個題目正解 play-through 代入朗讀語句通順無誤**（correctness；play-through-sim）；⑤ 自評三級＋寫入 SRS、不假裝自動批改；
     ⑥ 繁體零簡體零 PRC（scan_simplified）；⑦ `knowledge_point_ids[]` 全部對映到附錄 A 既有 id、`prerequisites[]` 已宣告、**每條 entry 必解析到 `units_index` 既有 `unit_id`（懸空＝FAIL，比照 kp『存在於 manifest』／`scene.claim_ids`；無環檢查不擋指向不存在節點的 edge，故存在性須另驗）**且無循環，**且每一條宣告的 id 必須「真教＋真考」**——在「教」段落實際教授該微技能、且「練/評」至少有一題 retrieval 涵蓋它（**禁止宣告塞 id 卻不教不考**；declaration-stuffing＝fail，杜絕 §4 淺薄覆蓋，供 AC-COV-1 核對）；⑧ `est_minutes ≤ 12`（過長拆單元，INV-4）；
     ⑨ viz 逐 frame iPad Air 13 render＋四角色簽核（R10）；⑩ 含可執行碼則附 code-download bundle 並從乾淨解壓可執行。
  3. **同一 gate、逐檔（頁）、不可抽樣**：每個**檔案（頁）**跑 per-file content_audit 到 5 clean（頁內各單元的驗收走 AC-UNIT-1 的 per-unit rubric，粒度分開） ＋ `tools/unit_acceptance_lint.py`（待建，機械驗 ②③**④(限符號數學型「正解代回原式驗算成立」之可機械部分；語言型「朗讀通順」為 AC-UNIT-1 的人工 play-through，不在此機械清單)**⑥⑦⑧⑩ ＋ **golden 結構 diff：與對應 `authoring/golden/<archetype>.html` 比對，偏離而 unit metadata 無 `deviation_reason` 即 FAIL**，對應 §11.A AC-UNIT-3）＋ 視覺 QA；
     全過才得併入學習路徑、才可宣告完成。rubric 任一項 fail＝擋關（fail-closed）。
- **範例：**
  - ✅**正例** `math.t_mid.equation.quadratic-formula`：教（配方法動畫，純 token 色）＋練（可玩、即時回饋）＋評（翻答案→三級自評→SRS）；
    卡自適應寬；`est_minutes:9`；正解代入朗讀通順；viz 逐 frame 簽核；`knowledge_point_ids:["math.t_mid.equation.quadratic-formula"]` 存在於附錄 A。rubric 10/10 全綠（全 10 項皆通過，對齊 §11.A AC-UNIT-1「每單元 10/10」）。
  - ❌**反例**：某單元用 `#3b82f6` 硬編藍（違②）、作答後只顯示「對/錯」無三級自評（違⑤）、填空正解代入後「他把把書放桌上」重字不通（違④）、
    `knowledge_point_ids:["math.quadratic"]` 在附錄 A 查無（違⑦）→ 四項 fail，擋關、不得併入。
  - ⚠**邊界**：純閱讀型概念（無選擇題）→ 仍須「教 ＋ 至少一個 retrieval 練習（如填空/自問自答）＋ 自評」，**不得只有教學文字就當完成**（否則記不牢，違 INV-3／rubric①）。

### 6.7 衍生資料產物與產生管線（build artifacts；每項定「檔/schema/產生者/何時產/誰驗」，消除 session 自由心證）
> 盲點修補（2026-10-26 角色模擬）：導覽/單元/獎勵所需的「顯示層與解析層資料」大多不在 manifest 裡，散在 markdown 或未定義。此節把每個中間產物釘成**機器可讀檔＋產生管線**，避免實作時各自發明。
- **鐵律**：learner 前端**不得**直讀 3096 列 `knowledge_points.json`（違 R9/ND）；一律讀下列**預生成**的輕量衍生檔。所有衍生檔由建置工具（Phase 1）從 manifest＋`*.units.json` 產生、進 git、並各有驗證 gate；**衍生檔不得手改**（手改來源再 regen）。
- **產物清單（細則）**：
  | 檔 | 內容/schema | 產生者 | 何時 | 驗證 |
  |---|---|---|---|---|
  | `<page>.units.json`（一頁一檔，**§6.2.2 權威單元內容契約的實體檔**） | 該頁所有單元的 metadata＋§6.2.2 內容本體（teach/practice/selfeval/zh_hint/term_refs）＋**§6.8.1 證據紀錄**（`claims[]`〔第二層〕／`practice[]` 物件的 question 證據欄〔第三層〕／`teach[].viz` 段 `scene`〔第四層〕） | 作者＋審查 team 人工撰寫、鎖檔 | Phase 1 起 | `AC-SCHEMA`/`unit_schema_gate`（依 §6.2.2 JSON Schema） |
  | `authoring/units_index.json` | 彙總全部 `*.units.json`：每 unit 的 metadata＋`home_page`＋`{file,anchor}` | build 工具掃 `*.units.json` | Phase 1 起、每次建置 | `AC-SCHEMA`＋**`unit_id` 跨全部 `*.units.json` 全域唯一（重複＝FAIL，比照 AC-COV-2『manifest 重複 id＝0』；此為跨 sidecar 主 join 鍵，撞號毀進度/索引/DAG）** |
  | `authoring/strand_labels.json` | **鍵＝`(domain, strand)` 配對**（共 **211** 配對；**非裸 slug**——裸 slug 僅 208 且 `stats`(math/life)、`inquiry`(sci/soc-civ)、`skill`(soc-geo/soc-hist) 三個跨域共用、各域中文名不同，裸 slug 會覆蓋成錯名）→`{title_zh}`；含 sci 子領域前綴 `bio-/chem-/earth-/phys-`→子領域中文名＋排序 | 自 inventory 標題半自動＋人工補、鎖檔 | Phase 1 | `no_grade_label_gate` 掃（中性、無年段）＋**鍵集合等式（非只比筆數）**：鍵集合 MUST 精確等於 manifest（及任何單元宣告）實際出現的所有 `(domain,strand)` 配對集合——每配對恰一 label 條目、零多餘/過時鍵（目前＝211，但驗的是**集合相等**不是「數＝211」；否則一個過時/typo 鍵換掉一個真配對仍過 211 筆、卻使該真配對落回 raw slug 顯示，＝T3-03『只比筆數』fail-open 類）＋各跨域 slug 分域有別名 |
  | `authoring/subject_labels.json` | `domain/life-category→{title_zh, island, order}`（含複合島成員顯示名與島內序） | 人工定、鎖檔 | Phase 1 | 與 §6.1 島↔subject 表一致性檢查＋**鍵集合覆蓋（非只比筆數）**：鍵集合 MUST 涵蓋 manifest（及任何單元）實際出現的所有 `domain`／`life-category`，每個恰一條目、零多餘/過時鍵（過時鍵換真鍵仍同筆數卻落回 raw 顯示＝fail-open） |
  | `authoring/term_glossary.json` | `term_zh→{en, abbr?, is_term:true}`（R15 唯一英語來源） | 人工＋審查，持續增補 | Phase 1 起 | `term_annotation_gate`（查表；**每個單元 `term_refs[]` 條目必解析到既有 `term_glossary.json` 鍵，懸空＝FAIL**，比照 AC-SCHEMA 對 kp/claim/scene/prerequisites 的懸空存在性檢查——否則懸空 term_ref 會靜默丟失 R15 術語英語註解） |
  | `nav_index.json` | 輕量導覽樹：島→subject→strand→tier→unit 的**計數/狀態**（不含 3096 逐條） | build 工具自 units_index＋manifest | Phase 1 | `AC-NAV`（首屏島≤12/可見≤15） |
  | `roadmap_layout.json` | roadmap 節點座標/連線(先備 DAG 邊)/收合群組邊界 | 預生成佈局工具（從 units_index 的 prerequisites） | Phase 2（有 unit/DAG 後） | viz-QA + 連線端點檢查 |
  | `authoring/progkey_migration.json` | `{old_progKey,new_unit_id,note}`（§6.3 進度遷移對照） | 接線/改名 PR 維護 | Phase 2 | 遷移 RT |
  | 獎勵 id registry（`authoring/reward_catalog.json`） | **兩個區塊**：(1) `items[]`＝每筆 `{id, type, retired?}`（skin/border/mascot/avatar/badge/shop；§7.2 R4/R5 只增不刪、下架改 `retired`）；(2) `types[]`＝**型別註冊區**，每筆 schema＝`{type, equippable:bool, signoff:{by:[art,spatial,pm], sha}}`（此即下文 sha-bound 簽核 gate 的確定性運算元載體，比照 `deviation_categories.json` 的 per-entry schema）。可裝備外觀＝`equippable:true` 之型別（目前 skin/border/mascot/avatar，見 §7.4 細則2）。**`types[].type` 為封閉枚舉，比照 `deviation_categories`（§6.6① 細則1）加 sha-bound 簽核 gate**：`types[]` 中**每筆** MUST 帶美術(`art`)＋空間(`spatial`)＋PM(`pm`)三簽核綁該型別的 `reward_type_sha`＝`sha256(canonical_json({type, equippable}, sort_keys=true))[:16]`（排除 `signoff` 欄、消自我指涉，仿 `cat_fact_sha`）；drift session 逕自新增/改 `types[]` 筆而無有效 sha-bound 三簽 → 該 type 無效、`items[]` 中引用它的獎勵一律 FAIL（杜絕「新型別無簽核無紅隊照 ship」）。**（B-2 修）`types[]` 同受 retire-not-delete＋no-shrink＋tombstone（比照 `items[]` frozen-id baseline，同錨 immutable release snapshot）**：type 一旦註冊只可改 `retired:true` tombstone、**嚴禁整筆刪除或改名**；維護 type 維度 baseline（可併入 `reward_id_baseline.json` 的 `types` 區，同三道 no-shrink/coverage/entry）。**＋`items[].type → types[]` 參照完整性**：每個 `items[]` 筆的 `type` MUST 解析到 `types[]` 既有條目（live 或 tombstone），懸空＝FAIL。**＋反向 `equipped<Type>` → `types[]` 參照完整性**：任何持久化的 `equipped<Type>` 其 `Type` MUST 仍在 `types[]`（live 或 tombstone）——移除某 type 致 stored `equipped<Type>` 懸空＝FAIL（補 §6.3 合併策略表單向 enum→strategy 檢查的反向，堵『整類下架靜默丟 equip-state＋型別可用性』）。 | 人工定、鎖檔；新增型別須三簽、type 只退不刪 | Phase 0.5/1 | `reward_catalog_gate`（待建）：**`items[]` 每筆 `id` 兩兩相異、且不重用任何已 `retired` 的 id（重複或重用＝FAIL，比照 AC-COV-2『重複 id＝0』／AC-SCHEMA 單元內 id 唯一；因 `id` 是 §7.1 `byId`/`isOwned`/`equipped` 的 never-disappear 唯一解析鍵，撞號會使 owned/已裝備解析歧義——§0.2 只認 fail-closed 機器強制、不認「鎖檔＋不重用」承諾）＋**frozen-id baseline（retire-not-delete 機器強制，堵 CLASS-B『刪/改名/漏記 earned id 致顯示孤兒』）**：維護 `authoring/reward_id_baseline.json`（曾經 ship 過的所有 reward id 全集）；**earnability 綁定（B-1 修，消 genesis／未-snapshot 空 floor 洞）＝一個 reward id 只有在它隨某次部署發行後才『可賺得（earnable）』**：每次會使 reward id 變 earnable 的部署／ship，MUST **先**寫出 immutable `releases/<id>/reward_id_baseline.json`（其 id 集合 ⊇ 當時 live `items[]`）——此為 `release_snapshot_on_ship_gate`（§10.2 收尾／部署 SOP 強制）；**首次發行前（genesis）無 snapshot ⟹ floor 空，但此時亦無任何 earnable id ⟹ 無孤兒風險（空 floor 正確、非漏洞）**。**最穩健做法＝baseline 由建置工具確定性衍生＝『所有 release snapshot 的 baseline FILE 聯集 ∪ 當前工作樹 `items[]`（含 tombstone）』（自動納入、不靠人工維護，使下列 (1)(3) 自然成立）**，手工維護的檔為備援、仍須全數通過下列 gate；gate 做**三道** fail-closed 斷言——**(1) baseline 自身 no-shrink／append-only（§0.2 機器強制、非散文；錨定 immutable 非-git 源，B-1 修）**：當前 baseline 的 id 集合 MUST **⊇ 所有 release snapshot baseline FILE（`releases/<id>/reward_id_baseline.json`）的 id 聯集**——這些是**工作樹中的 FILE（非 git 歷史中的 commit）**，F6-05 immutable、且 **full-history squash 只摧毀歷史、保留當前工作樹的檔**，故此 floor squash／force-push 皆摧毀不了；因 **earnable⟹已發行⟹必在某 snapshot FILE**，掉任一 earnable id（**不論普通 commit 或 squash 後**）＝ no-shrink FAIL（**此修回了先前把 git-HEAD floor 整個移除所丟失的『普通 commit delete-both』保護**）。**release snapshot 本身 immutable ＋ 存在性錨定 deploy-side 不可變紀錄（B-1″ 修，消『FILE 自身可被 `git rm` 刪、floor 塌成 ∅ 與 genesis 空 floor 無法區分』）**：WHICH releases 曾存在的權威來源＝**append-only、deploy-side release ledger**（部署時由 CI／host 寫入 repo 工作樹與 git 歷史**之外**的不可變／內容定址儲存，如 hosting／CDN 的部署紀錄或 immutable storage 的 append-only manifest；repo 任何編輯——含 `git rm -r releases/`、history squash——皆改不了它）。`reward_catalog_gate` 讀此 ledger（其每筆記錄 **`{id, snapshot_content_sha}`**——release id **與**該 snapshot FILE 的 **content fingerprint**（sha256），皆 append-only、存於 repo 之外的不可變儲存），對每個 ledger 記錄的 release 斷言兩事：**(a) 其 `releases/<id>/reward_id_baseline.json` FILE 存在於工作樹**（缺＝FAIL，可與 genesis 區分：genesis＝ledger 空、刪除＝ledger 非空但 FILE 缺）＋**(b) 該 FILE 的 content sha256 ＝ ledger 記錄的 `snapshot_content_sha`**（不符即 FAIL）。故**既存 snapshot FILE 內容被改（如編輯 `releases/v2/…` 刪掉某 earned id）＝sha 不符＝FAIL**——**content（非只 existence）亦由外部 ledger 錨定**，堵『改 snapshot FILE 內容＋同步 drop items 使 auto-derived floor 一起縮』的 repo-level 繞過。no-shrink floor ∴ ＝ **∪(ledger-recorded 且 content-verified 的 snapshot id-set)**，工作樹 FILE 僅為 cache、以 ledger fingerprint 驗真。**誠實殘餘（§0.2 分級、仿 §9.5）**：此錨把『repo 編輯清不掉 floor』關死；唯一殘餘＝『竄改 deploy-side append-only ledger 本身』，屬**部署／基礎設施信任邊界（production 不可變部署紀錄）、非 repo-level 威脅模型內**，於此具名揭露、不宣稱 repo 層能擋（將無限回歸終止於真實外部信任根，而非再一個可變 repo 檔）。並記 `baseline_sha`＝`sha256(canonical_json(sorted(baseline.ids), ensure_ascii=false))[:16]`（「sha-bound」具體 pre-image，比照 `kp_fact_sha`／`cat_fact_sha`／`reward_type_sha`／`unit_content_sha`；僅 pre-image／損毀偵測、非獨立防竄改）；**另（歷史改寫 defense-in-depth，fail-closed）**：任何 git 歷史改寫（squash／force-push）前，`reward_baseline_rewrite_gate`（§10.2 歷史改寫 SOP 強制）MUST (i) 要求 `backup-premigrate` ref **存在且 pin 在真正的 pre-rewrite HEAD——ref 缺失／非 pre-rewrite 狀態一律 DENY（fail-closed，非只在 baseline 不足時才擋）**，(ii) 斷言『改寫後 baseline ⊇ 改寫前（backup ref）baseline』否則 DENY；此為 release-snapshot FILE floor **之外加一層**、非唯一防線；**(2) coverage（baseline ⊆ items∪tombstone）**：`items[]`（含 `retired:true` tombstone 筆）的 id 集合 MUST **⊇ baseline**——任一曾入 baseline 的 id 自 `items[]` 整筆消失（全刪，或改名＝刪舊＋增新）而**無 `retired:true` tombstone** ＝ FAIL；**(3) entry/completeness（items∪tombstone ⊆ baseline）**：每個現存 `items[]`（含 tombstone）id MUST **已在 baseline 內**——**任一 id 不得「上架（ship 進 items[]）卻未入 baseline」**（未入即 FAIL），杜絕『ship-but-never-baselined 的 id 事後被無 tombstone 刪除而 (1)(2) 都偵測不到』。(2)+(3) 合為 **`items[]∪tombstone` 的 id 集合 ＝ baseline（集合相等）**，再加 (1) no-shrink ⟹ baseline 永遠等於『catalog 曾出現過的所有 id』且只增不減。**三道合擊**：孤兒化 earned id 的每條路徑皆 FAIL——(a) 刪 items 不留 tombstone 觸 (2)；(b) 連 baseline 一併刪觸 (1) no-shrink（對照 release snapshot FILE floor——該 earnable id 必在某 snapshot FILE、FILE 在工作樹 squash 摧毀不了，故普通 commit 與 squash 後皆擋）；(c) 一開始就 ship 而不入 baseline 觸 (3) entry（且該 id 須先經 `release_snapshot_on_ship_gate` 入 snapshot 才 earnable）；(d) 想藉 full-history squash／force-push 洗掉——因 floor 是工作樹中的 snapshot FILE（非被摧毀的歷史 commit）故 (1) no-shrink 直接擋，另 `reward_baseline_rewrite_gate`（fail-closed：backup ref 缺失或非 pre-rewrite 狀態即 DENY）再加一層；(e) 想藉 `git rm -r releases/<id>/`＋drop-both 把 FILE floor 清成 ∅——由 deploy-side release ledger 斷言『已記錄 release 的 snapshot FILE 必存在』FAIL（與 genesis 空 floor 可區分）；(f) 想藉**編輯既存 snapshot FILE 內容**刪 earned id＋同步 drop items——由 ledger 的 `snapshot_content_sha` 比對（FILE content sha≠ledger 記錄值）FAIL（content 亦外部錨定）；(g) 想在程式頒一個**從未入 `items[]` 的 id**（最寫實的 dev 疏漏，earned 卻顯示孤兒）——由上段 **award/grant-provenance 靜態掃描** catch-all 擋（所頒 id ∉ live `items[]`＝FAIL）。**唯一殘餘＝竄改 deploy-side ledger 本身（含其記錄的 id＋content_sha），屬外部部署信任邊界、非 repo 威脅模型內（具名揭露、不 overclaim repo 能擋；故本『每條路徑皆 FAIL』限定於 repo-level 威脅模型內）**（§0.2：§7.1『只增不刪／下架改 retired』不得只是散文承諾，須 fail-closed 機器強制；**涵蓋 badge／shop 等非可裝備 owned 型別**，補 RT-2 只測欄位移除、RT-11 只測可裝備型別的盲區）＋**每 `types[]` 筆帶有效 sha-bound 三簽（`signoff.sha`＝現算 `reward_type_sha`）否則該 type 無效＋`types[]` 同受 retire-not-delete＋no-shrink（type 只可 tombstone、不得刪/改名；type baseline 同錨 immutable release snapshot）＋`items[].type→types[]` 參照完整性（懸空＝FAIL）＋反向 stored `equipped<Type>`→`types[]` 參照完整性（移除 type 致懸空 equip-state＝FAIL；**＋F1 修〔紅隊第3圈〕：鍵於『type 仍在 `types[]` 且 `equippable:true`』——某 type 被 re-signed 降級 `equippable:true→false` 卻仍有持久化 `equipped<Type>` 且**無隨之而來的 §6.3 `migrate()` 降級清除步驟**（§6.3 line 549 migrate() 契約：型別 `equippable` 語意變屬「語意變」須走 migrate 並 bump 版本；該步驟清除／重導被降級型別的 stored `equipped<Type>`，比照 line 550 `equipped<Type>` last-write 合併策略表對 equippable 型別枚舉參數化）＝FAIL，堵『重簽降級靜默丟 equipped 合併策略＋型別可用性』**）＋**RT-11 對 `types[]` 的 `equippable:true` 枚舉參數化**（見 §7.3：每個 equippable 型別各自動要求一條 RT-11 case，缺任一 → FAIL）＋**`equippable` 旗標真實性交叉驗（紅隊第3/4圈 hardening；比照 §13 ledger 2026-10-26『枚舉式 gate 必帶原則凌駕列舉＋不確定即 fail』教訓）**：因 RT-11 與 §6.3 `equipped<Type>` 合併策略皆以 `equippable` 為 ground-truth 運算元，故 (a) **裝備/卸除一律經單一具名 helper**（`equipItem(type, id)`／`unequipItem(type, id)`，型別為其第一參數），使「某程式路徑作用於 type T」＝靜態可枚舉為該 helper 以 T 為型別參數之呼叫（對 `items[].type`／`types[].type` 比對）；(b) gate 靜態檢查：凡經此 helper（或任何 equip-like 行為：寫 `equipped<Type>`／wish_shop equip 渲染）作用於某 type 者，該 `types[].equippable` MUST＝`true`，否則 FAIL；(c) **原則凌駕列舉（catch-all，不確定即 fail／fail-closed on uncertainty）：任何無法靜態證明「不作用於任何 type」的 equip-like 路徑（繞過具名 helper、間接派發表、動態屬性存取、改名 helper…）一律 FAIL，不得以「不在上列舉例」放行**。**誠實分級（非 overclaim）**：此交叉驗對「經具名 helper 的裝備」為確定性機器判定、對「刻意繞過具名 helper 的間接形式」以 catch-all **fail-closed 擋下（寧誤擋）**；它是三簽人工把關**之外加一道 fail-closed 機器 backstop**（**非取代**三簽、**非**宣稱已完全機器化任意 JS 形式的靜態解析）。紅隊（equip 路徑作用於 equippable:false → DENY、繞過/改名具名 helper 之 equip-like 路徑 → DENY〔catch-all〕、經具名 helper 且 equippable:true 一致 → ALLOW）＋**award/grant-provenance 靜態掃描交叉驗（紅隊第3圈 B hardening；補與上述 equip-provenance 對稱之缺口，消『頒獎 call-site 頒一個未入 `items[]` 的 id → earned 寫入 never-disappear 集合、卻因顯示解析 catalog-keyed（§7.2 R4/R5 `getBadgeWall`／`wish_shop byId`）而永成孤兒』——最寫實 dev 疏漏如 `awardBadge('badge-c-new')` 卻漏把 badge-c 入 catalog）**：因 earned 物件的所有 metadata（名稱／圖示／型別）皆自 `reward_catalog.json items[]` 以 id 解析，頒獎／解鎖 call-site 必須只頒 catalog 既有（非 retired）id。(a) **頒獎／解鎖一律經單一具名 helper**（如 `grantReward(id)`／`awardBadge(id)`／`unlockItem(id)`，被頒 id 為其參數），使『某路徑頒某 id』靜態可枚舉（比對 live `items[]`）；(b) gate 靜態斷言：凡經此 helper（或任何 grant-like 行為：寫 `profile.badges`／`ownedItems`／earned 集合）所頒的 id MUST 靜態解析到 `items[]` 既有（非 retired）條目，否則 FAIL；(c) **原則凌駕列舉（catch-all，不確定即 fail／fail-closed on uncertainty）：任何無法靜態證明『所頒 id ∈ live items[]』的 grant-like 路徑（繞過具名 helper、動態 id、間接派發、改名 helper…）一律 FAIL**。**誠實分級（同 equip 交叉驗、非 overclaim）**：對經具名 helper 的頒獎為確定性機器判定、對間接形式以 catch-all fail-closed 擋下（寧誤擋）；為 §8 人工把關**之外加一道 fail-closed 機器 backstop**（非取代 §8、非宣稱已完全機器化任意 JS 靜態解析）。紅隊（RT-15：頒一個未入 items[] 的 id → DENY、繞過／改名具名 helper 之 grant-like 路徑 → DENY〔catch-all〕、頒 catalog 既有 id → ALLOW）；由 `AC-REWARD-1` 納入 §11.A 完工矩陣 | 
  | 偏離類別 enum（`authoring/deviation_categories.json`） | AC-UNIT-3 的 `DEVIATION_CATEGORIES` allowlist；**每項帶非空 `required_signer_roles[]`（⊆§8 角色 id allowlist，為 category→簽核角色對映）＋美術(`art`)＋空間(`spatial`)雙簽核綁該項 `cat_fact_sha`（=sha256(canonical{category,required_signer_roles})[:16]，排除 signoff 欄、消自我指涉）** `{category, required_signer_roles:[…], signoff:{by:[art,spatial],sha}}`（§6.6①） | 人工定、鎖檔；新增類別須雙簽 | Phase 1 | `unit_acceptance_lint`/enum gate：每項有非空⊆allowlist 的 `required_signer_roles` 且 `signoff.sha`＝現算 `cat_fact_sha` 否則該 category 無效（引用單元 FAIL）＋紅隊（無簽新增→DENY、`required_signer_roles` 空/含杜撰 id→DENY、改該項後未重簽→失效） |
- **單元落點解析**：點擊節點→`units_index.json` 的 `{file,anchor}`（不靠公式猜檔名）；`home_page` 已套 §6.2 GR 併頁規則後的**實際頁**（消 GR 公式推導 vs 併頁實際頁的歧義）。
- **範例**：✅ 前端首屏 `fetch('nav_index.json')` 只拿到 9 島＋各島計數/進度，點「數學島」才展開其 strand（資料已在 nav_index）。 ❌ 首屏直接 `fetch('authoring/knowledge_points.json')` 渲染 3096 列（違 R9/ND、`AC-NAV` FAIL）。 ⚠ 新增一個 strand 卻忘了在 `strand_labels.json` 補中文名→build 工具報缺、擋關（不得以 slug 當顯示名）。

### 6.8 事實正確性驗證協定（CORRECTNESS-VERIFY；R1「教錯害人」的落地驗證，非只口號）
> 使用者 2026-10-26 點出：R1 強調「正確性第一」，但**怎麼驗**散在原則裡、未升成有證據的完工 gate。此節把「正確性已驗證」變成**逐單元、可核對、留證**的協定，並由 `AC-CORRECT` 綁入 DONE-GATE。
- **三層驗證（每個單元 ship 前全過）**：
  1. **可計算事實＝強制執行驗證（確定性）**：凡數值/公式/單位換算/程式輸出等**可執行驗證**者，一律用 `.venv`／可執行環境**實跑比對**（禁「看起來對」）。例：沸點、質數判定、公式解、統計數字。可計算卻未附驗證紀錄＝FAIL。
  2. **非計算事實＝權威來源 ＋ 領域專家簽核**：每個事實宣稱在 unit 內容帶 **`source_refs[]`**（§6.2.2 `claims[]`／§6.8.1 第二層 claim 的欄位名；權威來源：教科書/課綱/官方機構/學術；非個人部落格/內容農場）；並由 §8 #1 **領域專家**逐單元判定正確、**簽核記 `authoring/fact_check_ledger.json`**（`{key（`unit_id` 或 unit-qualified `<unit_id>#<claim_id|question_id|scene_id>`；細則7 子 id 僅單元內唯一，故更細級鍵一律 unit-qualify 以全域唯一）, reviewer_role, verdict, scope_source_ids[], fact_source_ids[], sha}`〔來源欄 F6-03 後拆 `scope_source_ids[]`＋`fact_source_ids[]`、皆以 registry source id 引用，取代舊自由字串 `sources[]`；見 §6.8.1「promotion flow 第1點」（`source_registry` 欄位＋條目改 `scope_source_ids[]`/`fact_source_ids[]`）與其下「scope evidence／fact evidence 分流」段〕；`sha`＝該條目所轄內容的**明文 canonical pre-image** sha256[:16]：unit 級＝`unit_content_sha`（見 §6.6①(b)）、claim/question/scene 級＝`sha256(canonical_json(該 claim/question/scene 的內容欄位, sort_keys=true))[:16]`（同比照**排除自身 signoff 欄**以免自我指涉）；內容一改→sha 失配→作廢重簽，仿 AC-VIZ-1；與 `unit_content_sha`／`cat_fact_sha`／`kp_fact_sha` 同一「明文 pre-image＋排除 signoff」紀律，不留無定義 pre-image 的簽核 sha）。
  3. **不確定一律 `(待核)` 且禁 ship**：未查證者標 `(待核)`；**shipped 單元零 `(待核)`**（確定性掃描）。
- **各科驗證法（method 依科目不同；使用者 2026-10-26：「數理化能寫程式驗、英文查字典跟語料」）**：
  | 科目 | 主驗證法（優先用可機器/可查證者） | 工具/來源 |
  |---|---|---|
  | 數學 | **寫程式實跑**：公式解/因式/機率/統計數字用 `.venv`（sympy 符號、numpy 數值）算出比對；幾何可座標驗算 | `.venv`（sympy/numpy） |
  | 物理 | **程式驗**：單位換算、運動學/能量守恆、電路歐姆定律等代數值比對；常數查權威 | `.venv`＋CODATA/課本常數 |
  | 化學 | **程式驗**：化學式配平、莫耳/濃度/pH 計算；元素性質/週期表查權威 | `.venv`＋IUPAC/課本 |
  | 英文 | **字典＋語料庫＋母語者**：拼寫/詞性/詞義查字典；用法道地性/搭配/頻率查語料（repo 既有 `vocab_data_coca_*`＝COCA 詞頻）；例句自然度由 §8 #2 native-speaker 判 | 字典（Wiktionary dump/字典 API）＋COCA 詞頻＋§8#2 |
  | 國語文 | 字音/字形/字義查**教育部國語辭典/成語典**；語法修辭由領域專家 | 教育部辭典＋§8#1 |
  | 邏輯推理 | **可程式驗**：命題邏輯用**真值表**窮舉驗等值/有效論證；集合/條件機率可算；謬誤類型比對定義 | `.venv`（真值表/SAT）＋§8#1 |
  | 地理 | **可驗**：絕對位置/經緯度/面積/人口/統計/地圖投影可程式/查表驗；地名以官方為準 | `.venv`＋官方地理/統計資料 |
  | 歷史 | **來源＋多方交叉查證，且防史觀偏誤（鐵律）**：年代/事件/人物走權威來源；**嚴禁中國黨國（PRC）史觀**——中國慣於竄改歷史為其政權牟利，故**不採單一 PRC 官方敘事**，須以台灣/國際/多方非 PRC 控制的權威來源交叉查證；爭議事件**呈現多方觀點、持平**，不灌輸單一政治化史觀；用詞守「中國非大陸」（黨國語彙禁用）。由領域專家＋（必要時）媒體識讀視角審 | 多方國際/台灣學術史料＋§8#1 |
  | 生物/地科/生活 | 多非計算型→**權威來源引用＋領域專家簽核**（數據型仍可程式/查表驗，如天文週期、統計、分類） | 課綱/官方機構/學術＋§8#1 |
  | 公民/價值觀/情意(SEL) | **分兩層**：**事實層**（法條/制度/程序/數據＝有相對正確）走 source＋領域專家查證；**價值層**（孰優孰劣/立場）**無絕對對錯**→呈現多元觀點、持平中立，**不宣稱唯一正解**，由領域專家＋心理醫生(§8#7)判「是否持平、是否符 R16 框架」 | 官方法規/多元立場文獻＋§8#1,#7 |
  - **原則**：能用程式或查表**客觀驗**的（數理化、邏輯真值表、數據、字典事實、法條），**一律優先用**、留驗證紀錄；真正無客觀解的（價值判斷/詮釋/道地語感/史觀持平）才交領域專家＋心理醫生＋來源，且遵 **R16 後果框架**（不說教）。使用者不需自己會驗——spec 定方法、建置流程執行。
- **play-through 代入**：題目正解代入題幹（語言型朗讀通順、符號數學型代回原式驗算成立），納 `unit_acceptance_lint`。
- **對抗式複核**：content_audit 的領域專家 lens 對每單元獨立再查一次（找 ship 前漏網的事實錯），與上述簽核互為雙保險。
- **細則**：`source_refs[]` 對「常識/定義型」可省（如「水的化學式 H₂O」），但**具體數值/時間/比較級/因果宣稱**一律需 source 或執行驗證。英文例句的用法道地性由 §8 #2 native-speaker 判（屬語言正確，走同 ledger）。
- **範例**：✅「玉山海拔 3952 公尺（source: 內政部）」、「純水在 1 atm 附近沸點約 100°C（附權威來源；非僅靠算式）」、二次公式解跑 `.venv` 驗證代回原式成立並記錄。 ❌ 單元宣稱「某河全長 6300 公里」無 `source_refs[]` 也無執行驗證就 ship（AC-CORRECT FAIL）。 ⚠ 數字拿不準→標 `(待核)`，但**不得**帶 `(待核)` 上線（掃描擋關）。

#### 6.8.1 四層證據粒度 ＋ 獨立 oracle（B-07/B-08；嚴格審查 2026-10-26 升級）
> 原協定的簽核綁在 **unit** 級，無法指出「哪個來源支援哪一句」，也抓不到「正解對、feedback 錯」「文字對、圖畫反」「兩個選項都對」。升級為逐 **claim／question／visual** 證據，並堵住「用同一個錯公式自我驗證」。四層與 `fact_check_ledger.json` 的 `entries[]` 對應（鍵為 `unit_id`〔unit 級〕或 **unit-qualified 複合鍵** `<unit_id>#<claim_id>`／`<unit_id>#<question_id>`／`<unit_id>#<scene_id>`〔更細級〕——因 `claim_id`/`question_id`/`scene_id` 僅**單元內**唯一〔細則7〕，裸用會跨單元撞號、使 ledger→內容 join 歧義，故更細級鍵一律 unit-qualify；gate 驗 `<unit_id>` 段存在且 `#` 後 id 存在於該單元對應集合）。**四層的『內容紀錄』實體載體（已登記、有 JSON Schema，非只散文）**：KP 層＝`knowledge_points.json`；claim 層＝§6.2.2 單元 sidecar 的 `claims[]`（細則7）；question 層＝§6.2.2 `practice[]` 物件本身承載的證據欄（細則3）；visual 層＝§6.2.2 `teach[].viz` 段的 `scene`（細則7）。其 schema 屬 §6.2.2 權威單元內容契約、登記於 §6.7（`<page>.units.json` 列）、由 `AC-SCHEMA`/`unit_schema_gate` 機器驗。`fact_check_ledger.json` 的 `entries[]` 為**簽核層**，以上述鍵**引用**內容紀錄做正確性簽核，**不承載內容本體**（故下文「對應 §6.8.1 question 紀錄」皆指 §6.2.2 `practice[]` 物件之證據欄，運算元有確定載體）。
- **第一層 KP**：知識點本身正確 ＆ 屬該 tier（`knowledge_points.json` 的 `verification_status`／`authority_refs`；本 Phase -1 已導入）。
- **第二層 claim**：每個教材事實宣稱 `{claim_id, text, kind(definition|numeric|causal|historical|legal|health|language-usage), source_refs[], verification_ref, risk_class(normal|high), status}`。可繼承共用 canonical 來源（H₂O 等基礎事實指向一個共用 source，不必每頁重抄），但**每個 claim 都要能追到來源**。
- **第三層 question**：每題 `{question_id, kp_ids[], required_kp_ids[], type, answer, answer_evidence[→claim], distractor_rationales{}, validation_method(exhaustive|oracle|source|expert)}`。**欄位語意（此處為 home 定義）**：`kp_ids[]`＝**此題考核**的知識點（與 §6.2.2 practice[] 同義）；`required_kp_ids[]`＝**此題作答實際依賴、但未必是考點**的知識點（含先備），供 §9.5/§9.6 反偷看歸因完整性 join（兩者皆純 id 字串陣列；`required_kp_ids ⊇ kp_ids`）。**存在性＋完整性鐵律（防 §9.5 join fail-open）**：第三層 question 證據紀錄**即 §6.2.2 `practice[]` 物件本身所承載的證據欄**（§6.2.2 細則3；同一 `<page>.units.json` sidecar、同一 `question_id`，非另一未定義的分離檔）——每個 `practice[]` 題 MUST 帶非空、`⊇ kp_ids`、每個 id 存在於 manifest 的 `required_kp_ids`；由 `AC-SCHEMA`/`unit_schema_gate` **依 §6.2.2 JSON Schema** 機器強制（`required_kp_ids` 空／缺／含 manifest 外 id ⟹ FAIL），故 §9.5/§9.6 的 ∪ `required_kp_ids` 項恆有良好定義的載體與 schema、不會因缺載體或缺紀錄靜默變空。**完整性邊界（誠實分級，§0.2；紅隊 2026-10-30 Class 1/3）**：`required_kp_ids ⊇ kp_ids` 是機器可驗的**下限**；其**上限**（真的涵蓋此題正解的全部隱含依賴）**無法對任意自由題由機器獨立推導**，本質是作者宣告＋LLM 推理誠實度。作者可「低度宣告」蓄意漏列某越界 kp，單靠重算抓不到（重算只重分類被列出的 kp）。此殘餘由兩道 backstop 最小化：(i) §9.5 `per_question_solution_chain` 推導鏈閉合檢查（每 pass 題逐步舉證、每步 `kp_cited∈K(U)`，越界依賴一現身即被抓）＋(ii) §9.6 對抗式隱含依賴二審（反面獵捕被省略的隱含依賴）。**此為 spec 唯一明記的非完全機器化殘餘**，不藏、不宣稱 §9 反偷看完全 fail-closed。MCQ 須證明**唯一可辯護正解**；多選定義完整合法集合；開放題有 rubric＋可接受邊界；feedback 綁 claim（答案改了解釋不會留舊）。
- **第四層 visual**：每圖/動畫 scene 列 `{claim_ids[], 圖例語意, frames[], content_reviewer}`；Visual QA 的美術/裁切簽核（§AC-VIZ）**不**取代內容正確性簽核（例：四季動畫需地科 reviewer 確認地軸方向/日照角度與文字一致）。
- **獨立 oracle（B-08，堵「自證」）**：可計算驗證的**生成器與 oracle 不得共用同一段待驗公式實作**；公式先由權威來源/推導證明，再用程式查代數/數值；重要題型兩種獨立方法交叉驗；隨機題生成器須固定 seed＋property tests＋小域窮舉，並測零/負/極端/邊界/單位/四捨五入。
- **風險分級最低驗證要求**：一般數理語言＝來源或獨立 oracle＋1 reviewer；歷史/公民/考試範圍＝2 獨立來源＋1 領域 reviewer；**醫療/急救/消防/法律/兒少安全（risk_class=high）＝官方現行來源＋2 位獨立 reviewer，AI 多數決不算**；價值/情意＝不設唯一正解、心理安全＋多元觀點審（R16）。**〔high-risk 判定為 fail-closed FLOOR、非封閉枚舉（§0.2／§13 ledger 2026-10-26『判定原則凌駕列舉』列「枚舉式 gate 必帶原則凌駕列舉＋不確定即 fail」；此為全 spec 最高風險運算元 R1 教錯害人）〕**：(i)**機器粗篩**（`HIGH_RISK_PATTERNS` id 前綴＋`.health|.medical|.cpr|.firstaid` 等 substring）只能**加入** high-risk、**永不排除**；(ii)claim `kind∈{health,legal}` 或任何**安全/醫療/急救/消防/法律/兒少安全語義**者，**不論 id 命名空間**一律 high-risk（如 `sci.*` 濃酸/電路/實驗安全、跨科用藥/逃生）；(iii)`risk_class` **作者/機器路徑單調只升不降（預設不可自降）**——作者自報 `normal` **不生效**；**唯一**降級路徑＝§8 領域 reviewer **具名記錄「非安全」＋理由**方可自 high 降（即「不可降」之主體為作者/機器自動路徑、不含此 reviewer-clearance 例外）；(iv)**不確定即 high-risk**：reviewer 未肯定判為非安全、或存疑者，一律套 high-risk bar（官方現行來源＋≥2 獨立 reviewer）。即以**人工 reviewer 主動清除**為閘、機器粗篩為下限，杜絕「跨命名空間安全宣稱自報 `normal` 以 1 reviewer 蒙混」。time-sensitive 內容（法律/考試/人口/地理數據/AI 平台）帶 `recheck_after`，過期擋 release。
- **gate（Phase 1 建+各自紅隊，以真實資料跑；selftest 僅 gate 自身資格非 release 證據）**：`claim_evidence_gate`／`question_correctness_gate`／`generator_property_gate`／`visual_content_fidelity_gate`／`source_freshness_gate`／`release_hash_gate`（部署產物 hash＝簽核 hash，防「審 A 部署 B」）。Phase -1 已先立 `fact_check_ledger.json` 與 `verify_learning_path.py` orchestrator（registry 驅動、cumulative、嚴格 CLI）。
- **release-grade verified 的唯一合法 promotion flow（F4-05/F5-03；具名、可達、可執行）**：採「overlay 不回寫 canonical」方案——
  1. **Phase 0**（非 Phase 1）建 `authoring/source_registry.json`＋其 `source_registry.schema.json`（欄位：`source_id/publisher/url_or_isbn/edition_or_version/locator/accessed_at/authority_class/content_fingerprint/recheck_after`；schema 於此處與 §0.6.1 line 183／R2-07 定義，**非** §6.2——§6.2 為單元內容 schema 章）＋`tools/ledger_schema_gate.py`；`fact_check_ledger.json` 的條目改以 **`scope_source_ids[]`＋`fact_source_ids[]`（F6-03 拆 scope／fact 兩欄）引用 registry**（非自由字串，取代舊 `sources[]`）。
  2. **具名模組 `tools/promote_verified.py`**（pure function）讀 ledger＋registry，僅當某 KP 的每個 source 在 registry 可解、freshness/authority/fingerprint、high-risk（**判定規則見 §6.8.1 line 650 四條 fail-closed floor**：`HIGH_RISK_PATTERNS` id 前綴＋`.health|.medical|.cpr` 等 substring 僅為**機器粗篩 floor、只增不減**；最終 high-risk 以「`kind∈{health,legal}`／任命名空間安全語義／`risk_class` 只升不降／不確定即 high／reviewer 未主動清除即 high」決定——`promote_verified` MUST 消費 claim `kind` 與 reviewer 具名清除記錄，**不得僅憑 id 前綴命中與否、或作者自報 `risk_class` 將安全宣稱降為 1-reviewer 一般路徑**。`life.safety.*` 及 `life.sel.*` 的**安全/情緒危機/求助**型＝high-risk；`life.sel.*` 的**純價值/情意**型非 high-risk，改走 §6.8.1／R16「不設唯一正解＋多元觀點審」，由 reviewer 以 kind 具名排除、非作者自報）全過 → 列入 **輸出檔 `authoring/verified_overlay.json`** 的 `verified_ids[]`（**綁 `manifest_sha`**）；否則入 `rejected[]`。
  3. `_kp_build.py` 的 canonical manifest **只存 `provisionally_verified`、永不寫 `verified`**；release-grade `verified` **只存在於 overlay**。`AC-KP-VERIFY` 由 orchestrator 從 `verified_overlay ∩ 當前 manifest_sha` 現算（overlay 的 sha≠當前→全作廢，防過時）。
  4. 任何 manifest/ledger/source fingerprint 變動 → overlay 自動失效需重跑 `promote_verified.py`（綁 sha，仿 AC-VIZ）。
  **故 ledger_schema_gate＋source_registry＋promote_verified 歸 Phase 0**，`AC-KP-VERIFY` 在 Phase 0 可達且無 Phase 1 依賴。
- **scope evidence ＋ fact evidence 必須分開，且「權威≠正確」（F6-03 ＋ 使用者 2026-10-26 修正；鐵律）**：release-grade verified ＝ **scope_evidence ＋ fact/procedure_evidence ＋ 風險 reviewer policy** 三者皆過。
  - **scope_evidence**（`ledger.scope_source_ids[]`）＝**約定/成員資格**宣稱：課綱「定義」台灣在哪個年段教什麼——採它當參照**不是因為它無誤**，而是 scope 本質由課綱約定。課綱本身的錯仍可被 flag（不盲信）。
  - **fact_evidence**（`ledger.fact_source_ids[]`）＝**正確性**宣稱，**不得訴諸權威**（政府課綱也外包、會錯；「官方說的」不等於真）。依宣稱型別取**可重現/可推導/可交叉**的證據方法 `evidence_method`，推導/重跑優先：
    | 型別 | evidence_method（authority-independent 優先） |
    |---|---|
    | 數學/邏輯/物理/化學 | `derivation`／`program`／`truth_table`：**自己推導、跑 `.venv`、真值表窮舉**——零權威、可重跑（最強） |
    | 語言用法 | `corpus`：語料庫頻率＋母語者共識（descriptive；repo 既有 COCA） |
    | 經驗事實（地理/年代/數據） | `cross_check`：**≥2 個獨立來源匯聚**（非單一權威） |
    | 醫療/消防/急救（無法自推導） | `consensus_current`：**當前**專家共識指引，標「現行、會演進」＋ `recheck_after`＋保守預設；僅此類才容許（且仍非「無誤」，是「違反現行醫療共識才是危險預設」） |
  - 範例：✅ 二次公式 KP 的 fact＝`program`（`.venv` 代回原式驗）＋scope＝數學領綱成員；完全不需官方 PDF。 ✅ 滲透 fact＝`cross_check`（多本大學生物學匯聚水勢定義）。 ❌ 只因「課綱這樣寫」就標 fact 正確（訴諸權威，promote 拒）。 ⚠ CPR＝high-risk 且無法自推導→`consensus_current`（現行急救指引）＋`recheck_after`＋`verified_by` ≥2 位身分相異（F6-04）。
  - **實務**：3079 筆多為數理化/邏輯/英文用法→可**自我重算驗證、不需外部官方來源**；只有安全急救＋少數經驗值需 consensus/cross_check。
- **high-risk 判定（F6-04）**：不只 `life.safety.*`/`life.sel.*`；含 `life.*.emergency.*`、`soc-civ.*` 法律/權利/消費者保護、健康醫療急救等（`promote_verified.HIGH_RISK_PATTERNS`，可擴充）。reviewer 以正規化身分去重，兩個相同字串＝一位。
- **release 受驗 snapshot（F6-05）**：`--release` 須 `--release-id`，由它解析 immutable snapshot `releases/<id>/`；evidence 的 GLOB／工具 `--root` 對該 snapshot 展開（非當前 workspace），避免「驗 workspace A、hash artifact B」。snapshot 不存在即 FAIL。
- **範例**：✅ 一題 MCQ 的 `answer_evidence` 指向 claim-03、三個干擾項各有 `distractor_rationale`、`validation_method=exhaustive` 且生成器與 oracle 分離。 ❌ 題目生成器與驗證器共用同一個 `solve()`→錯誤一致得假 PASS（B-08 違反）。 ⚠ 圖「對」但與文字敘述相反→第四層 visual reviewer 須擋（美術簽核放行不算數）。

---

## 7. 獎勵系統擴充 ＋「永不消失」保證（RECON B 回填風險點；設計原則如下）

### 7.1 設計原則（偵察無關）
- **穩定字串 id**：所有可賺得物（skin/border/mascot/avatar/badge/shop item/成就/解鎖**等**；可裝備外觀型別以 `reward_catalog.json` 枚舉為權威來源，見 §6.7 的 `reward_catalog.json`（獎勵 id registry）列／§7.4 細則2）以穩定字串 id 識別，
  **絕不用陣列 index**；catalog 擴充只新增 id，不重用/不改既有 id 語意。
- **additive 合併**：讀檔時只「補預設、不覆蓋既有」；絕不以 freshProfile 整個覆寫 storage key。
- **真實遷移 migrate()**：讀取**存檔 profile 的 `version` 欄**（§7.2 R2 指出 game_core.js 目前 `version: CONFIG.schemaVersion` 有寫無人讀），與當前 `CONFIG.schemaVersion` 常數比對以驅動逐版 migrate；**切勿改讀自我恆等的 `CONFIG.schemaVersion`**（永遠等於當前版、偵測不到舊檔＝migrate 永不觸發，牴觸 never-disappear/RT-4）。新欄位用遷移補齊，舊的賺得資料保留。
- **catalog 變更安全（retire-not-delete，fail-closed 非散文承諾）**：catalog id **只准下架改 `retired:true` tombstone、嚴禁整筆刪除或改名**（改名＝刪舊＋增新，亦禁）；owned 參照對 retired id 仍 graceful fallback（顯示占位或保留為已擁有），不得清除。此鐵律由 §6.7 `reward_catalog_gate` 的 **frozen-id baseline（`authoring/reward_id_baseline.json`；append-only＋no-shrink 錨定 release snapshot FILE（工作樹中、squash 摧毀不了，非 git HEAD／歷史，B-1）＋earnability 綁 `release_snapshot_on_ship_gate`（部署使 id earnable 前先寫 snapshot⊇live items，§10.2）＋`baseline_sha` 綁定，三道斷言見 §6.7；最穩健＝baseline 由『release snapshot FILE 聯集 ∪ 當前工作樹 items』自動衍生）** 機器強制：baseline 只增不減（earnable⟹已發行⟹必在某 snapshot FILE，掉曾發行 id＝FAIL，普通 commit 與 squash 後皆擋；genesis 無 earnable id→floor 空屬正確）＋`items[]∪tombstone` 的 id 集合 ＝ baseline（coverage＋entry 雙向：任一曾入 baseline 的 id 自 items 消失而無 `retired:true` tombstone＝FAIL；任一 id 上架卻未入 baseline＝FAIL）＋歷史改寫前 `reward_baseline_rewrite_gate`（fail-closed：`backup-premigrate` ref 缺失／非 pre-rewrite 狀態即 DENY、改寫後 ⊇ 改寫前備份 ref，§10.2 SOP 強制，B-1）（§0.2 不認散文承諾），**涵蓋 badge／shop 等非可裝備 owned 型別；`types[]` 型別註冊區同受 retire-not-delete＋no-shrink＋雙向參照完整性（B-2）**（見 §7.3 RT-13／RT-14）。
- **寫前先讀**：任何 save 前先 load＋merge，杜絕「先寫預設再讀」把已賺得清掉。
- **壞檔不重設（最高優先）**：若存檔 JSON 解析失敗，**絕不**以空白 freshProfile 覆寫 key；必須
  (a) 把原始壞字串備份到另一 key（如 `player_profile_v1__corrupt_<ts>`）、(b) 保留記憶體內既有 profile、
  (c) 明確提示，交由使用者/後續修復；寧可拒寫也不毀資料。（對應 §7.2 R1 當前最危險路徑。）
- **never-disappear 的邊界聲明 ＋ localStorage 驅逐緩解（2026-10-26 角色模擬補；最常見裝置 iPad）**：
  - **誠實邊界**：「永不消失」**僅保證「同一瀏覽器、且使用者/瀏覽器未清除 localStorage」**。iPad Safari ITP 對 7 天無互動站台會**驅逐 localStorage**；無後端（鐵律）下無法阻止瀏覽器清除——故不得宣稱「絕對永不消失」。
  - **緩解（純前端、無後端）＝匯出/匯入進度檔**：提供一鍵**匯出**（進度＋獎勵合併成單一 JSON 檔下載）與**匯入**（上傳合併，走 §6.3 additive per-field 策略、不覆蓋較高值）。並以**非侵入提示**鼓勵定期匯出（如里程碑後「要不要存一份備份？」）。匯入一律 additive（earned union/max），不得倒退。
  - 跨裝置（iPad＋手機）同步＝out-of-scope（無後端），匯出/匯入即其**唯一正當解**；spec 明載，不假裝自動同步。

### 7.2 風險點逐條（RECON B 回填）
現況（recon B，2026-10-26；全站獎勵狀態集中於單一 key `player_profile_v1`，只有 `game_core.js` 寫入）：
`normalizeProfile` 是非破壞性「補預設」合併、catalog 用穩定字串 id（皆為**好消息**）。但有下列風險路徑：

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
R4/R5→catalog 採「只增不刪/下架改標記 retired、保留 owned 顯示」策略，必要時提供 id remap 遷移（**此策略由 §6.7 `reward_catalog_gate` 的 frozen-id baseline fail-closed 機器強制、非僅散文**——見 §7.1「catalog 變更安全」＋ §7.3 RT-13）；
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
- **RT-11（對應 R4 已裝備物下架）：裝備某可裝備外觀 → 下架或改名其 catalog id → reload → 該 owned+equipped 物件 graceful 存活**（保留為已擁有或占位、不報錯、不清除）；有別於 RT-2（只測 badge/R5 被動顯示），RT-11 專測 `wish_shop byId`／`isOwned`／equipped 渲染路徑。**RT-11 對 `reward_catalog.json` 的 `type` 枚舉參數化（非列舉固定型別）**：對枚舉中**每個 `equippable:true` 型別**各自動產生一條 RT-11 case（含未來新增型別如 `nameplate`/`pet` 等），且每型別須走其**實際渲染/裝備程式路徑**驗（不得只測 skin 一路而假定其餘型別轉移覆蓋）；枚舉中任一 equippable 型別缺對應 RT-11 case → `reward_catalog_gate` FAIL。（目前 equippable＝skin/border/mascot/avatar 四型別，但 case 由枚舉驅動、非寫死四個。）
- **RT-12（對應 §7.1／§6.3 localStorage 驅逐緩解；iPad Safari ITP 7 天驅逐）：匯出進度＋獎勵為單一 JSON 檔 → 模擬 localStorage 被清除/驅逐（清空 `player_profile_v1`＋`learning_progress_v1`）→ 匯入該檔 → 已賺得獎勵與進度 additive 還原（earned 類 union/max、絕不縮小、不倒退）**；證明匯出/匯入是跨驅逐的正當解，且匯入走 §6.3 additive per-field 策略（不以較低值覆蓋較高值）。
- **RT-13（對應 §7.1 retire-not-delete／CLASS-B；補 RT-2 只測欄位移除、RT-11 只測可裝備型別的盲區）：賺得一個非可裝備 owned 獎勵（badge **與** shop-type 收集品各一）→ (i) 將其 catalog id 整筆刪除、(ii) 將其 catalog id 改名（＝刪舊＋增新）→ reload → 四情境皆須被 §6.7 `reward_catalog_gate` **FAIL 擋下**：(i) 刪除、(ii) 改名（＝刪舊＋增新）由 **(2) coverage（items∪tombstone⊇baseline）** 斷言抓（曾入 baseline id 無 `retired:true` tombstone 即消失）；**(iii) 同時刪 `items[]` 與 baseline 內該 id（企圖維持 coverage 繞過）→ 由 (1) no-shrink 斷言（當前 baseline 對照 immutable release snapshot floor 不得掉曾發行 id；git-rooted floor 失效見 §6.7 B-1）FAIL 擋下**；**(iv) 上架一個 id 進 `items[]` 卻未同步寫入 baseline（ship-but-never-baselined）→ 由 (3) entry/completeness 斷言（items∪tombstone ⊆ baseline）FAIL 擋下**；而若為正當下架（改 `retired:true` tombstone）則該 earned 物件 graceful 存活（顯示占位／保留已擁有、不清除、不報錯）。**對 `reward_catalog.json` 的所有 owned 獎勵型別枚舉參數化**（badge/shop/skin/border/mascot/avatar…每型別各一 case，非只測 badge），缺任一型別 case → `reward_catalog_gate` FAIL。有別於 RT-2（只移除某欄位、物件仍在）與 RT-11（只測可裝備型別的裝備渲染路徑）。
- **RT-14（對應 §6.7 B-1 git-rooted floor＋B-2 type 註冊區盲區）**：(A) **earned(=已發行) id drop（普通 commit 與 squash 皆擋）**：賺得 reward id（已隨某 release 發行、必在某 `releases/<id>/reward_id_baseline.json` FILE）→ 自 `items[]` 刪該 id（無 tombstone）→ (a) **普通 commit**：no-shrink 對照 snapshot FILE floor 即 FAIL（修回舊 git-HEAD 移除後丟失的普通-commit 保護）；(b) **full-history squash＋force-push**：snapshot FILE 在工作樹不被歷史改寫摧毀→no-shrink 仍 FAIL，另 `reward_baseline_rewrite_gate` **fail-closed**（`backup-premigrate` ref 缺失／非 pre-rewrite 狀態一律 DENY，不只 baseline 不足才擋）再擋一層。另測 **(a′) genesis**（首次發行前）：無 earnable id→刪未發行 id 無孤兒、floor 空屬正確；**(a″) release-snapshot-on-ship**：部署使某 id earnable 卻未先寫 snapshot⊇live items→`release_snapshot_on_ship_gate` DENY 部署；**(a‴) `git rm -r releases/<id>/`＋drop-both（清 FILE floor 成 ∅）→ deploy-side release ledger 斷言該已記錄 release 的 snapshot FILE 缺→FAIL（與 genesis 空 floor 可區分：genesis＝ledger 空、刪除＝ledger 非空但 FILE 缺）**；**(a⁗) 編輯既存 `releases/<id>/reward_id_baseline.json` 內容刪掉 earned id X＋drop X from items[]（auto-derived floor 一起縮）→ FILE content sha ≠ ledger 記錄的 `snapshot_content_sha`→FAIL（content 由外部 ledger 錨定，非只 existence）**。(B) **type retire 孤兒**：賺得並裝備某可裝備型別（如 mascot）→ 移除 `types[]` 的該 type 條目（非 tombstone）＋移除其 equip 程式路徑 → 須被 `types[]` no-shrink／`items[].type→types[]`／反向 `equipped<Type>`→`types[]` 任一參照完整性 **FAIL 擋下**；正當下架（type 改 `retired:true` tombstone）則 owned 與 equip-state graceful 存活。此二者皆為 RT-1..13 未涵蓋的盲區（RT-13 只到 id 維度、未及 git-rooted floor 與 type 維度）。
- **RT-15（對應 §6.7 award/grant-provenance 盲區，紅隊第3圈）**：模擬最寫實 dev 疏漏——頒獎／解鎖 call-site 頒一個**從未入 `reward_catalog.json items[]` 的 id**（如 `awardBadge('badge-c-newmilestone')` 卻漏把 badge-c 加進 catalog）：earned 實例雖寫入 `profile.badges`/earned union-set（never-disappear 保 id-ownership），但顯示解析 catalog-keyed（`getBadgeWall`/`wish_shop byId`）→ 永遠孤兒、無 metadata。(a) 頒未入 items[] 的 id → `reward_catalog_gate` 的 **award/grant-provenance 靜態掃描** 斷言『所頒 id ∈ live items[]』FAIL；(b) **繞過/改名具名頒獎 helper 之 grant-like 路徑（動態 id／間接派發／直接寫 earned 集合）→ catch-all（不確定即 fail）DENY**；(c) 頒 catalog 既有（非 retired）id → ALLOW；(d) 頒一個已 `retired:true` 的 id → DENY（retired 不可再頒）。此為 RT-1..14 未涵蓋的盲區（既有 gate 只驗 catalog 自身一致性＋equip-provenance，從未綁頒獎端的 id provenance，與 equip-provenance 不對稱）。**另併驗 F1（型別降級）**：某 `types[]` 型別 re-signed 降級 `equippable:true→false` 卻仍有持久化 `equipped<Type>` 且**無隨之而來的 §6.3 `migrate()` 降級清除步驟**（依 §6.3 line 549 migrate() 契約，`equippable` 語意變須走 migrate＋版本 bump，清除／重導該型別 stored `equipped<Type>`） → 反向參照完整性（鍵於『仍 equippable』）FAIL；正當降級＋`migrate()` 清除步驟 → ALLOW。

---

### 7.4 獎勵內容方向（O-1 定案，2026-10-26）＋ 靜態站可行性鐵律
> 使用者授權由我決定方向，但下鐵律：**本站無 backend**——不是什麼都能做、也不是什麼都有意義。獎勵必須 (a) 純前端/localStorage 可實現、(b) 對學習真的有意義（綁真實里程碑，不是純點擊刷量的花招）。
- **細則（可做的獎勵種類，全部 additive＋穩定 id，依 §7.1–§7.3）：**
  1. **主題皮膚 skin**：切換 `app.css` token 調色盤（不改結構，純變數）；穩定 id `skin-*`。
  2. **邊框/頭像框 border、吉祥物 mascot、頭像 avatar**：SVG/CSS 繪製；穩定 id `border-*`／`mascot-*`／`avatar-*`（三者皆為可裝備外觀，各有獨立穩定 id 前綴並納入 `reward_catalog.json` 型別枚舉，受 §7.1/R3 never-disappear 與 RT-11 保護）。
  3. **成就徽章 badge**：**必須對映真實學習里程碑**——如「精熟某 strand 的全部 knowledge_point」「連續學習 N 天」「retrieval 正確 N 次」「完成一條路徑」；id `badge-*`，存 `profile.badges`。
  4. **收集冊 stickers / worddex 式卡冊**：本地相簿，蒐集已精熟的概念卡（站上已有 worddex 模式可延用）。**（非 `reward_catalog` 的可裝備外觀——stickers 由「已精熟概念」自動衍生、無下架/retire 語意，故不入型別枚舉；其永不消失由 §6.3／§7.1 `learning_progress_v1` 的 additive-merge／壞檔不重設／migrate 保護，不走 RT-2/RT-11。）**
  5. **進度型外觀解鎖**：達里程碑解鎖上述外觀。
- **靜態站可行性鐵律（禁止，因無 backend 或無意義）：**
  - ❌ 與他人比較的**排行榜/真人對戰/好友系統/雲端同步/跨裝置**（需伺服器）。
  - ❌ 伺服器端**防作弊驗證**、真實金流、每日「雲端」任務。
  - ❌ 純花招徽章（「點 100 下」「停留 10 分鐘」這種與學習無關、刷量可得）。
- **範例：**
  - ✅**正例** `badge-math-algexpr-master`：精熟 `math.t_mid.algexpr.*`（manifest 代數主軸 strand＝`algexpr`，非 `alg`）全部 knowledge_point 後頒發，存 `profile.badges`，reload 不滅（§7）。有意義、純本地可驗。
  - ❌**反例** `badge-top3-this-week`（本週全站前三名）：需伺服器比較 → 違可行性鐵律，禁止。
  - ⚠**邊界** `badge-streak-7`（連續 7 天）：本地 `streak` 可算、合法，但**連續中斷的定義與時區**要寫清楚（以裝置本地日期計、提供 freeze），避免跨裝置誤判——屬可做但需明確規格。

## 8. 全角色觀點 ＋ 每角色的「可取得知識限制」（knowledge-isolation）

> 使用者要求：角色模擬時**限制角色能取得的知識**，才能正確模擬「依路徑學習、無障礙、學得會、記得牢、不倦怠」。
> 下表每個角色標明：審查什麼、以及它**能看到/不能看到**什麼（knowledge boundary）。

| # | 角色 | 角色 id | 審查透鏡 | 知識邊界（可取得 / 不可取得） |
|---|---|---|---|---|
| 1 | 領域專家（各科） | `domain` | 正確性（R1） | 可取得全部正解與課綱；用於查錯，不用於模擬學習者 |
| 2 | native-English 語言專家 | `native-en` | 英文道地、可讀（TOEIC 600–750 舒適） | 可取得英文母語者的語感；僅評語言面 |
| 3 | 溝通語言學家（linguist） | `linguist` | 用詞淺白、歧義 | 同上，評中文/英文表達清晰 |
| 4 | 學習神經科學家 | `learning-sci` | 順序/chunking/retrieval/worked-example/spacing | 可取得學習科學；評路徑是否助記憶 |
| 5 | 知識視覺化專家 | `knowledge-viz` | 圖解/動畫把概念說清楚 | 評視覺化品質 |
| 6 | 眼科/眼舒適（ophthalmologist） | `eye-comfort` | 字級/對比/整塊免捲動可達/不刺眼（iPad 基準） | 評生理可讀性 |
| 7 | 心理醫生 | `psych` | 動機/挫折/倦怠/標籤風險/情緒安全 | 評情緒與動機安全（禁貼標籤） |
| 8 | 美術設計（art-director） | `art` | 配色/層次/一致設計語言/留白節奏 | 評視覺設計 |
| 9 | 空間美感設計（spatial-aesthetics） | `spatial` | 空間充分利用、無置中窄島、對齊間距 | 評版面空間 |
| 10 | 產品經理（PM） | `pm` | 讀者旅程/範疇/路徑取捨 | 評 scope 與旅程 |
| 11 | **知識受限學習者（模擬學生）** | `sim-learner` | 走一次路徑，只用「已學到的知識」 | **核心限制角色**：見 §9 |
| 12 | 動畫師（animator） | `animator` | **每個 frame**：無重疊/裁切/溢出、箭頭指向正確、frame 間尺寸恆定、時間節奏順、無破圖 | 評動畫逐 frame（R10／§11 第3項（視覺 QA）／AC-VIZ-1 的「四角色」之一） |
| 13 | 翻譯者（translator，繁中⇄英） | `translator` | 中譯英/英文作文/雙語對照的**譯文正確與忠實度**；**唯一可判「誤譯」者**（§8.1 規則③） | 可取得雙語對照與原文語意；僅評譯文忠實，不評學科正確性 |

- **viz-QA 四角色＝美術設計（#8）／空間美感（#9）／眼科（#6）／動畫師（#12）**，對應 R10／§11 第3項（視覺 QA）／AC-VIZ-1 的逐張簽核；此四角色為**必備**（與視覺 QA 規則檔一致）。
- 角色 1–10、12、13 為**審查透鏡**（找缺陷）。角色 11 為**路徑驗證器**（證明 INV-1..4）。
- 必要時可增角色（如各科教練、無障礙 QA），但**不得少於**上列 13 個（含 #12 動畫師、#13 翻譯者）。
- **§8 角色 id（closed set）＝上表「角色 id」欄的 13 個值**：`domain`／`native-en`／`linguist`／`learning-sci`／`knowledge-viz`／`eye-comfort`／`psych`／`art`／`spatial`／`pm`／`sim-learner`／`animator`／`translator`。新增角色時其 id 一併加入本欄，始得被簽核 allowlist 引用。
- **簽核者角色 allowlist（§6.6①(b)／AC-UNIT-3 之 `signoff.by[]` 及 golden bootstrap 用，closed set）＝`{golden-owner}` ∪ 上列 13 個 §8 角色 id**。其中 `golden-owner`＝凍結該 archetype golden 範本的擁有者（是**簽核身分**、非審查透鏡），其餘 13 個即各審查鏡/路徑驗證角色。`signoff.by[]` 的每個元素 MUST ∈ 此 allowlist；不在此清單的身分（如 `"self"`／空字串／杜撰）一律無效。此清單即「§8 簽核者角色 allowlist」的唯一確定性 referent，散文中不得再以「如……」舉例取代。

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
- 操作化：以 §6.2 的 `knowledge_point_ids` ＋ `prerequisites`，K_pre ＝ `prerequisites` 遞移閉包所涵蓋的 `knowledge_point_ids`；**teach(U) ＝ U 自己宣告的 `knowledge_point_ids`（即上段概念定義「U 自己『教』段落所授知識點」的操作化；§6.6 rubric⑦ 保證 `knowledge_point_ids ⊆ ∪teach[].kp_ids`，故宣告集必為實際所教之子集，取宣告集為準是 fail-closed 較嚴選擇——gate 以此重算 bucket，寧可對「教了但未宣告」的點誤判斷層而要求作者補宣告，不會放行越界）**；K(U) ＝ 兩者聯集；
  模擬 prompt 載入 K_pre 的教學摘要 ＋ U 本身的「教」內容，明令「只能用 K(U) 內的知識作答，遇到不在 K(U)（即路徑更後面才教）的概念要回報為斷層」。

### 9.3 判定
- **斷層（INV-1 違反）**：U 的練/評要求用到**既不在 K_pre、也不是 U 自己教的**概念（即落在 K(U) 之外、僅由路徑更後面單元所教或全書未教）→ defect（需調整先備鏈、補前置單元、或把該點設為 U 先備）。
- **學不會（INV-2）**：在 K(U) 下無法完成練/評 → defect。
- **記不牢（INV-3）**：關鍵知識點無 retrieval/spacing 覆蓋 → defect。
- **倦怠（INV-4）**：由心理醫生＋學習科學家依「單元過長/負荷過重/難度跳階/回饋稀疏」共判 `burnout_risk∈{low,med,high}`，門檻**三級**（與 AC-PATH-2 採同一套門檻定義、彼此一致，可機械判定）：
  `high` → **defect**（擋關，必修：拆長/降載/補階/加回饋後重判）；`med` → **不擋關但須於模擬輸出附緩解說明**（mitigation 欄非空）；`low` → pass。
  即 AC-PATH-2 的 `burnout_risk≤med` PASS ⟺ 本處 `high` 才算 **INV-4 倦怠 defect**（注意：「斷層」為 INV-1 專用詞、受 AC-PATH-1 的零斷層 gate；倦怠 defect 不計入 INV-1 斷層）；`med` 以「附緩解說明」放行、不得無說明放行。

### 9.4 執行
- **「主要路徑」＝ canonical 被模擬序列集 S（gate 範疇，須可滿足；單一確定性定義，供 §9.5/§9.6 共用）**：`path_coverage_gate` 以**固定確定性演算法**自 §6.1 先備 DAG emit 一份**唯一且可持久化**的被模擬序列集 **S**——演算法須 (i) **覆蓋每一條 DAG edge**（不只每個 node；確保每個分支/扇出轉折都落在某序列上，杜絕「挑一組繞過高倦怠分支的覆蓋子集」）＋ (ii) 孤立節點各自成一條單點序列 ＋ (iii) 每條序列給**穩定且具注入性的 `sequence_id`**（＝該序列**有序**節點 id 清單以**保留分隔符 `U+001F`（ASCII Unit Separator，證明不在 unit_id/node_id 字元集 `[a-z0-9._-]`〔含底線——學科 id 的 tier 段 `t_base`/`t_mid`/`t_adv`/`t_sub`/`t_enrich` 皆含 `_`，見 §4／`tools/_kp_build.py` ID_RE〕內，故串接對相異序列為單射、無「`.`/`-`/`_` 造成兩序列同前像」歧義）**連接後之 sha256[:16]，重跑不變；**且 `path_coverage_gate` MUST 斷言 S 內所有 `sequence_id` 兩兩相異（碰撞即 FAIL）**，使注入性為機器強制、非實作任選——否則兩相異序列撞同一 id 會使 §9.6 `burnout_by_sequence` 的 set-equality 完整性檢查塌縮、遮蔽高倦怠序列、fail-open 繞過 AC-PATH-2 INV-4）＋ (iv) 路徑數上限 O(edges)（分支 DAG 不指數爆炸；演算法＝對每條未覆蓋 edge e=(u→v)，向後自 u 延展到某 root、向前自 v 延展到某 leaf，拼成一條含 e 的 root→leaf 序列）＋ (v) **確定性 tie-break（使 emit 的 S 集合唯一、跨 re-emit 可重現，非實作任選）**：延展遇分支時一律取 **`node_id` 字典序最小**的前驅（向後）／後繼（向前）；edge 處理順序亦按 `(u_id, v_id)` 字典序；故 S 的序列成員集合與各 `sequence_id` 皆由 DAG 唯一決定。**§9.4 模擬、§9.5 `burnout_by_sequence`、§9.6 序列完整性檢查三者皆引用同一份已 emit 的 S，不各自『重建』**。S 的 edge-cover(i) ∪ 孤立節點單點序列(ii) ⟹ 覆蓋每個 node（edge-cover 本身不涵蓋孤立節點，須靠 (ii) 補足）⟹ 每個非 `beyond` minimum KP 的 home 單元都至少被模擬一次，`taught_kps_exercised` 必產生 → AC-COV-1 可滿足。
- 全書實作完成後，對每條主要路徑跑知識受限模擬；發現斷層→修→重跑，loop 到零斷層。
- 模擬為**獨立 agent**，知識邊界由協定強制（prompt 僅注入 K(U)），不得讓它偷看後續內容。
- **覆蓋與模擬的分工（避免 gate 不可滿足）**：AC-COV-1 的「真教真考」綁定**主由每單元 `unit_acceptance_lint` rubric ⑦ 驗證**（對全部單元執行，與路徑選取無關）；§9 模擬的 `taught_kps_exercised` 為路徑端二次確認。因上一條已保證路徑聯集走過所有單元，兩者皆可滿足、不互相造成死結。

### 9.5 細則與範例（知識受限模擬；本節為 §0.3 具體化範本）
- **細則：**
  1. 輸入＝目標單元 U 的 `unit_id`。計算 **K_pre** ＝ U 的 `prerequisites` 遞移閉包所涵蓋的全部 `knowledge_point_ids` 聯集；**teach(U)** ＝ U 自己宣告的 `knowledge_point_ids`；**K(U) ＝ K_pre ∪ teach(U)**（即「先備所學」＋「本課所教」；只排除路徑更後面單元才教的點）。
  2. 模擬 agent 的 prompt **注入 K_pre 的教學摘要 ＋ U 本身「教」段落的內容**，並明令：「可用 K(U)（先備＋本課所教）內的知識作答；遇到不在 K(U)（即更後面才教）的概念即停、回報斷層並指出缺哪個先備」。嚴禁注入 U 之後才教的內容。
  3. 輸出格式固定：`{unit_id, result: pass|blocked, gaps:[{missing_concept, where_used}], learnable:bool, retention_ok:bool, burnout_risk:low|med|high, mitigation, burnout_by_sequence:[{sequence_id, burnout_risk:low|med|high, mitigation}], taught_kps_exercised:[...], per_question_kp_attribution:[{question_id, kp_buckets:[{id, bucket}]}], per_question_solution_chain:[{question_id, steps:[{infer, kp_cited}]}], notes}`（**注意：此處用 `kp_buckets`＝物件陣列 `[{id,bucket}]`，與 §6.2.2 teach[]/practice[]、§6.8.1 question 的 `kp_ids`＝純 id 字串陣列 刻意不同名，避免同名兩形混淆**。**`per_question_solution_chain`（新增，反「低度宣告」）**＝模擬 agent 對**`result==pass` 單元的每一 practice/eval 題**（`result` 為單元層欄、題層無此欄）列出**逐步求解推導鏈**：每步 `{infer:「這一步的推理」, kp_cited:「此步所依賴、且必須在 K(U) 內的 kp_id」}`；用意＝把「我用 K(U) 解得出」從**宣稱**變成**逐步舉證**——見 §9.5 細則3a 的推導鏈閉合檢查）。
     其中 **`burnout_by_sequence`** ＝ §9.6 INV-4 per-sequence 評估的**逐序列原始值載體**（panel 對該單元所屬「每一條」被模擬 root→leaf 序列各評一個 `burnout_risk`）；per-unit 頂層 `burnout_risk` 欄即其 MAX（見 §9.6 交會單元聚合鐵律）。此欄為必填（單元至少屬一條序列），供 gate 確定性比對聚合，不是給 agent 自行收斂後只報一個值。
     其中 **`per_question_kp_attribution`** ＝ §9.6「強制顯式 kp 歸因」的機器可消費載體：模擬 agent 對**每一題**列出用到的 `kp_id` 及各自 `bucket∈{K_pre, teach, other}`（對映 §9.6：`K_pre`＝先備閉包、`teach`＝本課所教、`other`＝不在 K(U)＝越界/偷看證據）。此欄為必填、不得省略或空陣列（有練/評題者）。
     其中 `mitigation` ＝ 當 `burnout_risk=med` 時必填的緩解說明（`high`/`low` 可空）；AC-PATH-2 的 med 放行判定讀此欄（欄名與 §9.3、§11.A 一致）。
  3a. **模擬輸出的確定性 schema/enum 閘（fail-closed，防 AC-PATH 以空值/enum 外值 fail-open 放行）**：AC-PATH-1/2 消費本輸出物件**之前**，MUST 先過一道確定性 schema/enum 驗證 `tools/sim_output_schema_gate.py`（待建；比照單元內容的 `AC-SCHEMA`／`unit_schema_gate`）——強制 `result∈{pass,blocked}`、`burnout_risk∈{low,med,high}`、`learnable` 與 `retention_ok` 為 `bool`、`gaps` 為陣列、`taught_kps_exercised` 為陣列、且 `burnout_risk=="med"` ⟹ `mitigation` 非空。**另強制 `burnout_by_sequence` 聚合（§9.6 交會單元反遮蔽）**：`burnout_by_sequence` 為必填陣列、每筆 `burnout_risk∈{low,med,high}`，其 `sequence_id` 集合 ⟺ canonical 被模擬序列集 S（§9.4）中通過該單元的序列集（少一條 FAIL），且 per-unit 頂層 `burnout_risk` ⟺ `burnout_by_sequence` 各值之 MAX（不等 FAIL）。**另強制逐題 kp 歸因（§9.6 反偷看）確定性可驗，且不信任 agent 自報 bucket**：`per_question_kp_attribution` 為必填陣列、每題每 `kp_id` 的 `bucket∈{K_pre,teach,other}`。**gate 以 §9.2 的 `prerequisites` 遞移閉包（K_pre）＋ U 宣告的 `knowledge_point_ids`（teach(U)）確定性重算每個 `kp_id` 的『真實 bucket』，並與 agent 自報比對**：凡自報 `K_pre`/`teach` 但該 id 實不在 K(U)＝K_pre∪teach(U) 者，一律**改判為 `other`**（防「把越界 kp 標成 K_pre/teach」規避）。**另驗歸因完整性**：以 `question_id` 把每筆 `per_question_kp_attribution` join 回 unit metadata 的對應 `practice[]` 題（§6.2.2 每題帶 `question_id`）；該題 attribution 的 `kp_buckets[].id` 集合必須 ⊇ 該題的 `practice[].kp_ids`（此題考的）∪ §6.8.1 第三層 question 的 `required_kp_ids`（此題實際依賴的）——缺列任一即 FAIL（防「省略越界 kp」規避）；且每個 `practice[]` 題必有對應 attribution 筆（`question_id` 對不上或缺筆亦 FAIL）。**反 fail-open 鐵律**：此 ∪ 的 `required_kp_ids` 項依賴每個 `practice[]` 題都有**對應 §6.8.1 question 紀錄（同 `question_id`）且 `required_kp_ids` 已填（⊇ `kp_ids`）**，此存在性＋完整性由 `AC-SCHEMA`/`unit_schema_gate` 先行強制（見 §6.8.1、§11.A AC-SCHEMA）；**若某題無對應 §6.8.1 紀錄、或其 `required_kp_ids` 空／缺，gate 一律 FAIL，嚴禁把 ∪ 項當空集而讓檢查退化成只 ⊇ `practice.kp_ids`**（否則重開「省略越界 kp」縫，違 §0.2 fail-closed）。**最終：任一（自報或重算後的）`bucket=="other"`、或任一練/評題缺歸因/歸因不完整 ⟹ FAIL**（＝INV-1 斷層/偷看 K(U) 之後知識的證據）。**另（反「低度宣告 under-declaration」——紅隊 2026-10-30 Class 1/3 找到的殘縫：required_kp_ids 只有下限 ⊇kp_ids、作者可蓄意不列某越界 kp，重算只能重分類『被列出』的 kp、對『從不列出』零防禦）加一道逐題求解推導鏈閉合檢查**：**對 `result==pass` 的單元**（`result` 為單元層 enum，題層無此欄），其**每一** practice/eval 題 MUST 有對應 `per_question_solution_chain`（`result==blocked` 單元依其 `gaps` 處理、不另要求推導鏈），gate 以 §9.2 的 K(U)（K_pre 閉包＋teach(U)）確定性驗**每一步 `kp_cited` ∈ K(U)**——任一步引用 K(U) 外 kp ⟹ 該題 `blocked`（把越界依賴從「可沉默省略」逼成「必須現身於某步 kp_cited，一現身即被重算抓為越界」）；缺 chain／某步無可引用的 in-bounds kp（推理跳步）⟹ 交 §9.6 對抗式隱含依賴二審，未能補足 in-bounds 推理 ⟹ `blocked`。**誠實分級（§0.2；修正舊版「純機器判定」overclaim）**：bucket 重算（謊報→改判 other）、推導鏈每步 `kp_cited∈K(U)`、歸因完整性 join 三者對「被列出或被引用的 kp」是 **fail-closed 機器判定**；但「自由題正解的真實依賴集」無法對任意題型由機器獨立推導（`required_kp_ids` 完整性上限本質＝作者宣告＋LLM 推理誠實度），故此殘餘以 (i) 本推導鏈閉合檢查（逼每步舉證 in-bounds）＋(ii) §9.6 對抗式隱含依賴二審**最小化但未完全機器化**——**spec 不宣稱 §9 反偷看為完全 fail-closed**，此為全 spec 唯一明記的「非完全機器化」殘餘（不藏、不 overclaim；屬 §0.2 例外，須在實作期以上兩道 backstop 持續紅隊）。**任何缺欄／空值／enum 外值（如 `""`／`"medium"`／`bucket` 非三值）一律 FAIL，不得當作「非 `high`／非 `blocked`／非 `other`」而視為 `≤med`／`pass` 放行**（§0.2 fail-closed；修正 §9.3「只有 `high` 才算 defect」這種否定式判定在壞值上 fail-open 的縫）。schema 違規數＝0 才可進 AC-PATH-1/2。紅隊：`burnout_risk=""`/`"medium"`、`result=""`、`learnable` 非 bool、`med` 無 `mitigation`、任一 `bucket="other"`、題目缺 attribution、**把越界 kp（實不在 K(U)）自報成 `K_pre`/`teach`（重算後改判 other）、題目 attribution 省略其 `practice[].kp_ids` 中某 kp、**`burnout_by_sequence` 漏報某所屬序列（藏高倦怠序列）、per-unit `burnout_risk` 報成低於各序列 MAX** 皆須 DENY；合法（自報 bucket 與重算一致、歸因完整、`burnout_by_sequence` 序列齊全且頂層＝MAX）ALLOW。
     `taught_kps_exercised` ＝ 模擬實際在「練/評」用到的 `teach(U)` 知識點 id 清單，供 AC-COV-1 核對「宣告即真教真考」（見 §6.6 rubric ⑦、§11.A）。
  4. 門檻：一條路徑上每個 U 皆 `result=pass` 且 `gaps=[]`，該路徑才算無斷層（INV-1）；任一 `blocked` → 調整先備鏈或補前置單元 → 重跑，loop 到零斷層。
- **範例：**
  - ✅**正例**：U＝`math.t_mid.equation.quadratic-formula`（公式解即 teach(U)，由本課「教」段落教授），其 prerequisites 閉包 K_pre 已含「因式分解法解一元二次、配方法、平方根運算、正負數」→ 學習者讀完先備＋本課即能推導並套用公式解，練/評所用皆在 K(U)=K_pre∪teach(U) 內 → `result:pass, gaps:[]`。（單元測自己剛教的公式＝正常，非斷層。）
  - ❌**反例**：U 的練習第 3 題用到「判別式 Δ＝b²−4ac」，但該知識點 `math.t_mid.equation.quadratic-discriminant` 排在 U 之後、不在 K(U) → `result:blocked, gaps:[{missing_concept:"math.t_mid.equation.quadratic-discriminant", where_used:"練習第3題"}]` → 須把 discriminant 設為 U 先備或移除該題。
  - ⚠**邊界**：某概念雖與 U 同一 tier，但其單元在路徑順序上排 U **之後** → 仍算斷層（K(U) 以 `prerequisites` 鏈計，**不以 tier/stage 計**）→ `blocked`，需修正先備宣告或單元排序。

### 9.6 模擬器確定性化補強（2026-10-26 角色模擬補；消「無法寫出可證明被擋的測試」）
- **路徑覆蓋 gate（防 AC-PATH 假綠）**：§9.4 的 canonical 被模擬序列集 **S** 由 `path_coverage_gate` 以固定演算法 emit 並持久化；gate 確定性檢查 **(a) S 覆蓋每一條 DAG edge ＋ (b) 每個孤立節點（無任何 incident edge 的 unit）各自成一條單點序列（§9.4(i)(ii)）**——(a)∪(b) 方涵蓋每個 unit（edge-cover 本身碰不到孤立節點，故孤立節點子檢查不可省）；任一 edge 未覆蓋、或任一孤立 unit 未成單點序列，即 FAIL（因 S 由固定演算法產生、非實作任選，杜絕「挑一組漏單元或繞過某分支的路徑卻宣稱無斷層」）。
- **INV-1/2/3（per-unit）與 INV-4（per-sequence）分離**：INV-1/2/3 以**每單元**各模擬一次（K(U) 閉包、與路徑位置無關）判定；**INV-4 倦怠的評估依據是「一條路徑的連續單元序列」**（跨單元的難度跳階/配速/回饋密度），不以「單一孤立單元」判倦怠；但評估所得 `burnout_risk`/`mitigation` 仍**寫入 §9.5 per-unit 輸出物件的對應欄位**（值代表該單元所屬序列的評估結果），供 AC-PATH-2 逐單元讀取。**多序列交會單元的聚合鐵律（DAG 分支必然產生，§9.4 的 root→leaf 路徑聯集會讓交會/扇出單元同時落在多條序列）**：同一單元若落在多條被模擬序列、各序列評得不同 `burnout_risk`，則該單元 per-unit 欄位 MUST 取**所有所屬序列的最壞值**（序 `low<med<high` 的 MAX；`mitigation` 取該最壞序列的說明），**嚴禁記成任一較低旁路序列的值**（否則某序列的 `high` 會被遮蔽、AC-PATH-2 的 INV-4 擋關失效）。此聚合由 §9.5 輸出的 **`burnout_by_sequence:[{sequence_id, burnout_risk, mitigation}]`** 載體承載各序列原始值（panel 對每條所屬序列各評一個），`sim_output_schema_gate`／`path_coverage_gate` 據此做**兩道確定性檢查**（gate 只驗聚合完整性與一致性，不重判 panel 的質性值）：(1) **序列完整性**——`burnout_by_sequence` 的 `sequence_id` 集合 MUST 等於 **canonical 被模擬序列集 S 中通過該單元的序列集合**（S 由 §9.4 `path_coverage_gate` 以固定演算法 emit、穩定 `sequence_id`，三節共用同一份），少一條（想藏起某高倦怠序列）即 FAIL；(2) **MAX 一致性**——per-unit 頂層 `burnout_risk` MUST 等於 `burnout_by_sequence` 各值之 MAX（序 `low<med<high`），不相等（例如報成某低值旁路序列）即 FAIL。故資料結構為 per-unit 欄位、評估語意為 per-sequence（原始值留存於 `burnout_by_sequence`）、交會點取最壞值且 gate 可確定性驗證，三者一致不衝突。
- **burnout 可量測代理（補 §9.3 的質性判斷，使部分可機械預篩）**：量測代理觸發（命中則標記交 panel 複判，非自動 defect）：相鄰單元 `est_minutes` 跳升 >2×、相鄰單元新增 `kp` 數跳升 >2×、連續 ≥3 個單元無 retrieval 練習。最終 `high/med/low` 仍由 §8 #7 心理醫生＋#4 學習科學家判（panel 主、代理輔）。
- **知識隔離改「強制顯式 kp 歸因」（LLM 無法真的忘記→改成可稽核）**：模擬 agent 對**每一題**須明列「我用到哪些 `kp_id`、各自屬 `K_pre`／`teach(U)`／`其他`」，**寫入 §9.5 輸出 schema 的必填欄位 `per_question_kp_attribution`（`bucket∈{K_pre,teach,other}`）**；凡出現 `bucket="other"`（或練/評題缺歸因/歸因不完整）＝越界/斷層證據，由 §9.5 細則 3a 的 `sim_output_schema_gate`（AC-PATH-1/2 前置）**確定性機器抓到並 FAIL**。**關鍵：gate 不信任 agent 自報的 bucket——以 §9.2 的 `prerequisites` 閉包＋teach(U) 重算每個 kp 的真實 bucket（自報 K_pre/teach 但實不在 K(U)→改判 other），並以 `question_id` join 驗每題歸因 ⊇ 該題 `practice[].kp_ids` ∪ §6.8.1 question `required_kp_ids`（杜絕「標錯 bucket」與「省略越界 kp」兩種規避）**（兌現 §0.2「只有 fail-closed 機器強制有效」，不再只靠「嚴禁偷看」的 prompt 指令）。
- **對抗式「隱含依賴」二審（反 required_kp_ids 低度宣告；紅隊 2026-10-30 Class 1/3 backstop）**：除模擬 agent（角色 11，僅見 K(U)）外，另設**獨立對抗式 reviewer**（可見該題正解＋完整 K(U)＋全書已教序列），專職找「此題正解**隱含依賴**某 kp，但該 kp 既不在 `practice[].kp_ids`、也不在 §6.8.1 `required_kp_ids`、也未現身於 `per_question_solution_chain` 任一步 `kp_cited`」；命中即 FAIL（要求作者把該 kp 補進 `required_kp_ids`／設為先備／移題）。此二審與 §9.5 推導鏈閉合檢查互補：推導鏈逼 agent 正面舉證每步 in-bounds，二審從反面獵捕被省略的隱含依賴。二者皆無法把「自由題真實依賴集」完全機器化（見 §9.5 細則3a 誠實分級），但顯著縮小殘縫；此 reviewer 為 §8 panel 外加對抗角色、與角色 11 不可同一 agent。
- **注入體 vs K(U) 白名單掃描（反「prompt 注入後續內容」；紅隊 Class 3 向量3）**：建置 harness 注入模擬 prompt 後，一道**確定性掃描**驗**被注入內容明確標記引用的 `kp_id` 皆 ∈ §9.2 K(U) 的 kp 集**（`kp_id` 對 kp 集的成員檢查＝確定性）；出現 K(U) 外 `kp_id` 即 FAIL——把「僅注入 K(U)」從建置承諾升為機器強制。**範疇限定（誠實分級）**：本 gate 僅對**可確定性判定的 `kp_id` 引用**強制；自由文本「術語」無 `term→kp` 確定性對映（`term_glossary.json` 僅 `term_zh→en`），故術語層級的越界偵測**僅作非綁定的 panel 啟發式提示、不列入本 gate 的確定性保證**——它**不宣稱機器化**（故非第二個「非完全機器化殘餘」；§9.5 細則3a 的自由題真實依賴集殘餘仍為全 spec 唯一明記的非完全機器化例外）。
- **K_pre 注入預算**：深 tier leaf 的先備閉包可能數百 kp→注入採**結構化摘要**（每先備單元「教」段落的要點），設 token/深度上限；超限則按 `prerequisites` 距離由近到遠截斷並標註（忠實度優先近層）。
- **用到母體外概念 → inventory-gap 分支**：若某題用到的概念**不在 3096 母體**（無 id 可填 `missing_concept`）→ 回報 `inventory-gap`（建議補母體），與「排序斷層」區分處理。
- **rubric⑦ vs §9 仲裁**：二者皆須通過；任一不符 → 標 `review`、不得逕自放行（§9.4 已定 rubric⑦ 為主、§9 二次確認，此處補明衝突時的處置）。

---

## 10. 安全執行：phase 化與 rollback

> **兩套 phase 命名空間對照（消 §10 vs §0.5/§0.6 的「Phase 0／Phase 1」標籤重疊；唯一裁決）：**
> 本 spec 存在**兩套**各自正確、但共用「Phase N」字樣的編號，讀者須依出處區分：
> - **(甲) 實作里程碑 phase**（本 §10／§6／§11 用）：`Phase -1 / 0 / 0.5 / 1 / 2 / 3 / 4 / 5`——整個工程的實作階段。其中 **實作 `Phase 0` ＝ spec 定案**，其 exit ＝ §12（content_audit 5-clean ＋ 紅隊）。
> - **(乙) 驗證 orchestrator phase**（§0.5／§0.6／§0.6.1／`verify_learning_path.py --phase=`／`acceptance_criteria.json` 用）：`-1 / 0 / 1 / release`——驗證 harness 的**累積驗證階段**，粒度較粗，只管「哪條 AC/gate 在哪階段以 evidence 驗」。
> - **兩者關係（故不矛盾）**：實作 `Phase 0`（spec 定案）**之內**的工作順序＝先讓 orchestrator `--phase=0`（含 `--ready-for-5clean`）真綠（binding verified 等資料工作）→ **再**跑 content_audit 5-clean → 紅隊 → 才算實作 `Phase 0` 完成。所以「5-clean 在 Phase 0 之內」（甲，實作里程碑）與「5-clean 在 `--phase=0` 綠之後」（乙，驗證階段）說的是**同一件事**：orchestrator `--phase=0` 綠是實作 `Phase 0` 內部的前置關卡，5-clean 緊接其後、仍在實作 `Phase 0` 之內。
> - **`Phase 1` 同理**：實作 `Phase 1` ＝ schema／safe_store／衍生資料基盤（見 §10 Phase 1 條目）；§6.8.1／§11.A／registry 提到的 claim/question/visual evidence gate 亦於實作 `Phase 1` 建。**例外**：`ledger_schema_gate`＋`source_registry` 兩個 gate 由 F4-05 自 `Phase 1` 移至 **`Phase 0`**，使 `AC-KP-VERIFY` 在 `Phase 0` 即可達（`AC-KP-VERIFY` 本身並非被移動的 Phase 1 交付物，而是因這兩個 gate 前移而於 Phase 0 可滿足；見 §0.6 line 133／§6.8.1／§11.A 細則例外(c)），兩 gate 現已建成並紅隊（§0.6.1）。

- **Phase 0｜spec 定案**：本檔達 5 clean ＋ 紅隊通過（§12）。gate 之前不進 Phase 0.5／Phase 1（定案後的下一階段是 Phase 0.5，非直接 Phase 1）。
- **Phase 0.5｜既有不一致 remediation ＋ 獎勵安全地基（先做，before 任何新內容）**：
  (a) 盤點全站卡片/按鈕/色碼硬編/私有重造清單，統一到 token ＋ §6.5 R-STYLE-3 自適應卡（修現有不一致）；
  (b) 修 §7.2 的 R1 壞檔全毀（壞檔不重設）＋ R2 真實 migrate()，並以 §7.3 RT-6 紅隊證明——**獎勵永不消失地基先穩**。
  完成後才進 Phase 1。此 Phase 直接回應使用者「書內已有不一致、難修」＋「獎勵別 refresh 消失」兩大顧慮。
- **Phase 1｜基盤**：知識點 id registry（＝`knowledge_points.json`，非另一物）、**unit 內容+metadata schema（§6.2.2）＋ `unit_schema_gate`**、**凍結既有頁→(subject,strand,tier) 歸屬＋`unit_id` registry（Phase 2「全數接線」的分母）**、**§6.7 衍生資料產物管線**（`units_index`/`strand_labels`/`subject_labels`/`term_glossary`/`nav_index` 產生＋各 gate）、`safe_store.js`＋migrate()＋additive-merge（延續 Phase 0.5 地基，§7.3 全綠）、獎勵 id registry。**roadmap 骨架時序**：Phase 1 只渲染到 **島→subject→strand→tier 頁** 層（由 nav_index 推導）、**unit 節點層留佔位**；節點↔先備 DAG 連線（`roadmap_layout.json`）待 Phase 2 有 unit/prerequisites 後回填（消雞生蛋）。**`_kp_build.py` 的 `unit_ids[]`/`status` 改衍生唯讀**（由 `coverage_gate` 掃 unit metadata 反向生成、不手填、重跑不覆寫）。
- **Phase 2｜路徑接線**：既有單元接入路徑（宣告 prerequisites/knowledge-point ids）、產 `roadmap_layout.json`＋`progkey_migration.json` 並把舊 progKey 進度 additive 搬入 `learning_progress_v1`，逐檔 5 clean。
- **Phase 3｜gap 補齊**：依 §4−§5 gap，逐 subject×strand 補單元；一次一檔、每檔 5 clean。**可發布子集（拆 all-or-nothing 風險）**：**一個「島」或一科的 minimum 全覆蓋即可上線該島**作為里程碑（AC-COV-1 的 minimum 100% 仍為**全站 DONE-GATE** 終態，但發布不必等全站——先交付有價值的完整島）。優先序：先補使用者最在意/最弱者（如高中銜接、實用英文）。
- **Phase 4｜獎勵擴充**：在已驗證的持久化地基上新增獎勵內容（只新增 id，不動既有）。
- **Phase 5｜全書 audit ＋ 知識受限角色模擬 ＋ 視覺 QA**：loop 到零問題。
- 每個 Phase（且其中每一檔）結束即 commit，可 rollback（R8）；push 僅在使用者明說。

### 10.1 各 Phase 的進入/退出準則與 rollback（§0.3 具體化）
- **細則**：每個 Phase 都有明確 **exit gate**，未過不得進下一 Phase；Phase 內每檔完成即 commit（訊息標 Phase），rollback＝`git revert`/`git checkout` 回該 commit。
  - **Phase 0 exit**：spec 過 §12（content_audit 5 clean ＋ 紅隊零繞過 ＋ `spec_concreteness_lint` exit 0）＋ **`AC-ANTIDRIFT` 綠**（§0.2 四錨點已交付、hook 對壞案例 DENY／好案例 ALLOW 經紅隊）。
  - **Phase 0.5 exit**：`design_consistency_gate` exit 0（既有不一致歸零到 token）＋ §7.2 之 R1 壞檔不重設/R2 真 migrate 修妥 ＋ `RT-6` 綠。
  - **Phase 1 exit**：`knowledge_points.json`＋unit schema（`AC-SCHEMA` 綠）＋凍結 unit registry/歸屬表＋§6.7 衍生檔全產出且各 gate 綠（含 `strand_labels`/`subject_labels`/`term_glossary`/`nav_index`）＋hub/roadmap 骨架（至 tier 頁層、過 `AC-NAV`＋AC-NOGRADE＋AC-VIZ-1 島/strand/tier 三層簽核）＋`safe_store.js`/`migrate()`/additive-merge 就緒；`AC-COV-2`、`AC-REWARD-1` 綠。
  - **Phase 2 exit**：既有單元全數接線（宣告 `prerequisites`/`knowledge_point_ids`），每檔 5 clean。
  - **Phase 3 exit**：`AC-COV-1`（**Phase 3 變體**：`unit_ids[]` ∩ rubric⑦ 通過集，不含 §9 項）＝ 0 個未覆蓋 minimum id（gap 全補）。§9 `taught_kps_exercised` 的二次確認留到 Phase 5 done-gate。
  - **Phase 4 exit**：獎勵擴充**只新增 id**、RT-1..15 全綠 ＋ **`AC-NOBACKEND` 綠**（獎勵/排行/社交類零對外請求，no_backend_gate exit 0）。
  - **Phase 5 exit**：§11.A 全 **23 條 AC**（含 AC-SPEC；含 AC-CORRECT/AC-SCHEMA/AC-NAV）綠且 `acceptance_ledger.json` 全登錄。
- **範例**：
  - ✅**正例**：Phase 3 結束時 `coverage_gate` 報「未覆蓋 minimum id ＝ 0」→ 得進 Phase 4。
  - ❌**反例**：宣稱「Phase 3 大致完成」但 coverage 顯示 37 個 minimum id 無對映單元 → **不得**進 Phase 4，須列 37 id 補完。
  - ⚠**邊界**：Phase 2 某檔已 4 clean 後又被改動 → streak **歸零**、重跑 5 clean（不接受「只差一輪」通融）。

### 10.2 部署／ship ＋ git 歷史改寫（squash／force-push）收尾 SOP（normative；§6.7 reward-baseline B-1 的前置來源）
> 本節為 §6.7 `release_snapshot_on_ship_gate` 與 `reward_baseline_rewrite_gate` 所依賴之規範來源（補 line 613／682／§13(f) 原誤指「§10 收尾 SOP」無實體的懸空 cross-ref）。本 repo 標準收尾含 **full-history squash＋force-push**（memory `history-squash-purge-training`），下列為其 fail-closed 前置：
- **細則：**
  1. **release-snapshot-on-ship（earnability 綁定）**：任何會使 reward id 變 earnable 的部署／發行，MUST **先**寫出 immutable `releases/<id>/reward_id_baseline.json`（id 集合 ⊇ 當時 live `items[]`），由 `release_snapshot_on_ship_gate` 強制；未寫或未 ⊇ live items ＝ **DENY 部署**。snapshot 一經寫出即 **immutable（F6-05）**，既存 `releases/<id>/` 不得刪改（違反＝FAIL）。**＋部署同時將 `{id, snapshot_content_sha}`（release id ＋該 snapshot FILE 的 content sha256）append 進 deploy-side release ledger**（repo 工作樹與 git 歷史**之外**的不可變／內容定址紀錄，如 host／CDN 部署紀錄）——此 ledger 為『WHICH releases 曾存在＋其 reward-id-set 內容指紋』的權威來源；`reward_catalog_gate` 據它斷言每個已記錄 release 的 snapshot FILE 仍存在工作樹（缺＝FAIL，堵 `git rm -r releases/`）**且其 content sha ＝ ledger 記錄值（不符＝FAIL，堵編輯既存 snapshot FILE 內容刪 earned id）**。竄改 ledger 本身（含 id＋content_sha）＝外部部署信任邊界、非 repo 威脅模型內（§6.7 誠實殘餘、仿 §9.5）。
  2. **歷史改寫前置（fail-closed）**：任何 squash／force-push／rebase 等歷史改寫**前**，MUST (a) 先建並保留 `backup-premigrate` ref **pin 在真正的 pre-rewrite HEAD**；(b) 跑 `reward_baseline_rewrite_gate`——**`backup-premigrate` 缺失、或非 pre-rewrite 狀態、或改寫後 baseline ⊉ backup ref baseline ⟹ 一律 DENY 該次改寫**（fail-closed，非只 baseline 不足才擋）。
  3. **reward-floor 主防線不靠歷史**：reward baseline 的 no-shrink floor＝release snapshot **FILE**（工作樹中，squash 只摧毀歷史、保留當前檔），故 squash 本身摧毀不了 floor；本節 (2) 的 rewrite_gate 為 defense-in-depth 第二層。
- **範例**：✅ 發行 v3 前先寫 `releases/v3/reward_id_baseline.json ⊇ 現行 items[]`，再部署；之後任何 commit／squash 刪掉某已發行 id → no-shrink 對照 snapshot FILE FAIL。 ❌ 直接 squash+force-push 而未建 `backup-premigrate` → `reward_baseline_rewrite_gate` fail-closed DENY。 ⚠ genesis（尚無任何 release）→ 無 earnable id、floor 空，屬正確狀態（非漏洞）。

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

- **細則**：上列 8 項為「完成」的硬性必要條件**摘要（非窮舉）**；其**逐條可機械驗且窮舉的版本＝§11.A 驗收準則矩陣（23 條 AC，各附驗證方法/門檻/證據）**，§11.A 為唯一完工判準。
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
| AC-UNIT-3 | 每個新單元與對應 golden 範本做**結構 diff**（§6.6 細則① 凍結黃金範本防品質漂移）；偏離而 unit metadata 無**有效** `deviation_reason` 即 FAIL（**有效**＝`category`∈`deviation_categories.json` enum ＋ **該 enum 項自身帶有效美術/空間雙簽綁該項 `cat_fact_sha`（=sha256(canonical{category,required_signer_roles})[:16]）** ＋ 單元 `signoff.sha` 綁該單元 `unit_content_sha`（=sha256(canonical §6.2 metadata〔含 `deviation_reason.category`／`note`〕＋§6.2.2 內容欄位)[:16]，唯一排除任何 `signoff` 子物件，見 §6.6①(b)）＋ **`signoff.by[]` 身分合規（每元素 ∈ §8 簽核者角色 allowlist〔closed set，§8 表末枚舉：`{golden-owner}`∪§8「角色 id」欄〕、且含必填子集＝`golden-owner`＋該 category 的 `required_signer_roles[]`〔該 enum 項宣告的 §8 角色 id〕）**；僅自由文字/非 enum/enum 項未雙簽或缺 `required_signer_roles`/任一 sha 不符/**`by[]` 含非 allowlist 身分（如 `"self"`）或缺必填簽核者**＝無效，不得放行——§6.6①、§0.2） | `tools/unit_acceptance_lint.py`（讀 unit metadata `deviation_reason`、**驗 `category` 在 enum、該 enum 項帶非空⊆allowlist 的 `required_signer_roles[]` 與有效美術＋空間雙簽（enum 項 `signoff.sha`＝現算 `cat_fact_sha`）、單元 `signoff.sha`＝現算 `unit_content_sha`（§6.2 metadata〔含 `deviation_reason.category`／`note`〕＋§6.2.2 內容欄位，唯一排除任何 `signoff` 子物件）、且 `signoff.by[]` 每元素 ∈ §8 簽核者角色 allowlist（`{golden-owner}`∪13 角色 id，§8 表末 closed set）並含必填 golden-owner＋該 category `required_signer_roles[]`** ＋ 與 `authoring/golden/<archetype>.html` 結構比對）＋紅隊（**任意自由文字理由須 DENY、無雙簽逕自新增 enum 類別須 DENY、`signoff.sha` 正確但 `by[]=["self"]`／缺 category `required_signer_roles` 中任一必填簽核者須 DENY、合法 enum（項已雙簽＋`required_signer_roles`⊆allowlist）＋sha-bound 且 `by[]` 含必填 §8 簽核者之單元簽核須 ALLOW**） | 未解釋**或無效解釋**的偏離數＝**0**（exit 0） | golden-diff 報告＋紅隊 log |
| AC-CORRECT | **事實正確性已驗證**（R1；§6.8＋§6.8.1 四層協定）：shipped 單元零 `(待核)`；可計算事實經**獨立 oracle**實跑（B-08，生成器與驗證器不共用公式）；非計算事實帶 `source_refs[]`（§6.2.2/§6.8.1 canonical 欄名）；逐 **claim/question/visual** 證據（非只 unit 級）；feedback 綁 claim；部署產物 hash＝簽核 hash | **多部（R2-06 綁入）**：(1) `(待核)`＝0 掃描；(2) 可計算事實獨立 oracle 比對（§6.8 各科法表）；(3) `claim_evidence_gate`／`question_correctness_gate`（唯一正解＋干擾項說明）／`generator_property_gate`（固定seed+窮舉/property）／`visual_content_fidelity_gate`（圖文 claim 對應＋內容 reviewer，非美術簽核代替）／`source_freshness_gate`（`recheck_after` 過期 FAIL）／`release_hash_gate`（審 A 部署 B＝FAIL）——**皆待 Phase 1 建並各自紅隊**（§6.8.1） | 各 gate exit 0；無來源/無驗證事實＝0 | fact_check_ledger＋source_registry＋oracle/release-hash log |
| **AC-KP-VERIFY** | **binding minimum 母體已驗證**（R2-03；B-02）：每個**非 `beyond`（minimum）**知識點 `verification_status` **必為 `verified`**——`pending` 與 `unverified` **兩者皆擋**（不得以「無 `(待核)` 字樣」＝unverified 冒充已驗證）；**唯一容許的未-`verified` binding＝HD 簽署、附官方 source 的官方確認例外清冊 `accepted_exceptions.json`（option(b) 授權，事實已逐字確認、僅因「單一官方權威 vs ≥2 cross_check」或 high-risk 樣式誤判無法自動翻 verified，不偽造 overlay；見 §0.6.1 line 180）**；每筆 verified 必有對應 `fact_check_ledger` 條目（**ledger 欄**：`scope_source_ids[]` 與 `fact_source_ids[]` 皆非空〔F6-03 後條目以 registry source id 引用、拆 scope／fact 兩欄，非舊自由字串 `sources[]`；見 §6.8.1「promotion flow 第1點」（`source_registry` 欄位＋條目改 `scope_source_ids[]`/`fact_source_ids[]`）與其下「scope evidence／fact evidence 分流」段〕、`key` 存在於 manifest）＋ 其 manifest 列通過語意驗證（**manifest 欄（§4 line 347）**：`verified_by[]` 非空且 high-risk≥2 獨立、`verified_as_of` 不晚於產生日）——`verified_by[]`／`verified_as_of` 屬 manifest、非 ledger 條目欄（ledger 以 `reviewer_role` 記簽核者，見 §6.8「三層驗證」之簽核層／ledger 條目 schema），此處為跨檔語意驗證；可多 id 繼承**版本化 curriculum/source mapping**，但不得無證據。**T3-05：`_kp_build` 只授予 `provisionally_verified`（非 release-grade）；release-grade `verified` 須經 Phase 0 `ledger_schema_gate`＋`source_registry`（ISO 日期、source id 存在性、authority_class、fingerprint、high-risk≥2 獨立 reviewer）認定（F4-05 已把這兩個 gate 自 Phase 1 移至 Phase 0，見 §0.6 line 133／§6.8.1；二者現已建成並紅隊，見 §0.6.1）**——`provisionally_verified` 不算通過本 AC | `tools/kp_pending_gate.py`（待建）＝`binding_unverified==0`，**由 orchestrator 從 live `items[]` 現算、不信任 cached `meta`（T3-02）**＋`tools/ledger_schema_gate.py`（Phase 0 已建+紅隊，見 §0.6.1；`_kp_build` 另內建首版語意檢查：空來源/空reviewer/非ISO或未來日/未知id→FAIL） | binding minimum 非 `verified` 數量＝**0**（`pending`＝0 AND `unverified`＝0 AND `provisionally_verified`＝0；**扣除 HD 簽署的官方確認例外清冊 `accepted_exceptions.json` 後**——metric＝binding-unverified − HD 官方確認例外＝0，見 §0.6.1 line 180；**例外每筆綁 `kp_fact_sha`（id/title_zh/exam/beyond 的 canonical sha），該 KP 事實一改→sha 不符→例外作廢→id 回計→metric 重升>0→AC-KP-VERIFY 轉紅（與 overlay/AC-VIZ-1/deviation_reason 同一 sha 重綁紀律）**；紅隊：非 HD／杜撰 id／非 binding／壞檔／**缺 `kp_fact_sha`／sha 不符**皆不扣、移除一筆即重計、**改一筆例外 KP 事實內容則該例外失效且 metric 重升>0**） | live items[] 現算（已含例外扣除）＋ledger＋`accepted_exceptions.json` |
| AC-SCHEMA | 每個單元的 metadata＋內容（§6.2.2）符合 JSON Schema：欄位齊備/型別/enum 正確、每 teach 段帶 `kp_ids[]`、每 practice 題帶 `kp_ids[]`＋`question_id`（`question_id` 僅 practice 題有、teach 段無，與 §6.2.2 一致）、`knowledge_point_ids` 皆存在於 manifest；**且每個 `practice[]` 物件承載 §6.8.1 第三層 question 證據欄（§6.2.2 細則3，同一 sidecar、非分離檔）：`required_kp_ids` 非空且 `⊇ kp_ids`、每 id 存在於 manifest、`validation_method`∈enum、`answer_evidence`/`distractor_rationales` 合 schema；本單元 `claims[]`（第二層）與 viz `scene`（第四層）亦合 §6.2.2 schema**（兌現 §9.5/§9.6 join 的存在性＋完整性鐵律，缺 required_kp_ids/空/含 manifest 外 id＝違規）；**＋單元內 id 唯一性＋參照存在性（防 join／綁定 fail-open）**：`question_id`／`claim_id`／`scene_id` 各在本單元 sidecar 內 MUST 唯一（重複＝FAIL，比照 AC-COV-2『manifest 重複 id＝0』；使 §9.5/§9.6 的 `question_id` join 為良好定義之鍵，杜絕兩題共用 `question_id` 致歸因 join 歧義、一題越界 kp 藏於另一題完整性檢查的 fail-open），且每個 `answer_evidence[→claim_id]` 與每個 `scene.claim_ids[]` 元素 MUST 解析到本單元 `claims[]` 既有 `claim_id`（懸空參照＝FAIL，比照 kp『每 id 存在於 manifest』；兌現『feedback 綁 claim』與四層 visual↔claim 綁定、非只 prose）；**＋`unit_id` 跨 sidecar 全域唯一（外層運算元，within-unit 唯一性所預設）**：`unit_id` 是 §6.3 `learning_progress_v1.units[]`／§6.7 `units_index` 節點解析／§9.4 `sequence_id` 的**跨檔主 join 鍵**，故 units_index build 彙總時任一 `unit_id` 於全部 `*.units.json` 重複＝FAIL（比照 AC-COV-2『manifest 重複 id＝0』；撞號會毀進度/索引/DAG 節點）；**＋`prerequisites[]`→`unit_id` 參照存在性**：每條 `prerequisites[]` entry MUST 解析到 `units_index` 既有 `unit_id`（懸空＝FAIL，比照 kp『存在於 manifest』／`scene.claim_ids`；rubric⑦ 的無環檢查不擋指向不存在節點的 edge，故存在性須由本 gate 另驗，否則懸空 prerequisite 會靜默毀 §9.2 K_pre 閉包/§6.1 DAG）；**＋`term_refs[]`→`term_glossary` 參照存在性**：每條 `term_refs[]` entry MUST 解析到既有 `term_glossary.json` 鍵（懸空＝FAIL，比照上列懸空存在性；否則 R15 術語英語註解靜默丟失）；**＋單元顯示標籤參照存在性**：單元的 `strand`（連同 `domain`）MUST 解析到既有 `strand_labels.json` 的 `(domain,strand)` 鍵、單元的 `domain`／`life-category` MUST 解析到既有 `subject_labels.json` 鍵（懸空＝FAIL，比照上列；否則落回 raw slug 顯示，兌現 §6.7 line 616『報缺、擋關』） | `tools/unit_schema_gate.py`（待建，JSON-Schema validator：依 §6.2.2 schema 驗 `practice[]` 承載的 §6.8.1 證據欄＋`claims[]`/`scene`＋`required_kp_ids`⊇`kp_ids`＋**`question_id`/`claim_id`/`scene_id` 單元內唯一＋`unit_id` 跨 `*.units.json` 全域唯一（units_index build 驗）＋`answer_evidence`/`scene.claim_ids` 的 `claim_id` 參照存在於本單元 `claims[]`＋`prerequisites[]` 每條解析到 units_index 既有 `unit_id`＋`term_refs[]` 每條解析到 term_glossary 既有鍵＋`(domain,strand)` 解析到 strand_labels、`domain`／`life-category` 解析到 subject_labels**）＋ rubric⑦ 子集檢查（宣告集⊆教集∩考集）＋紅隊（**兩 `practice[]` 共用一 `question_id`→DENY、兩 sidecar 共用一 `unit_id`→DENY、`answer_evidence` 指向不存在 claim_id→DENY、`scene.claim_ids[]` 指向不存在 claim_id→DENY、懸空 `prerequisites`（指向不存在 unit_id）→DENY、懸空 `term_refs`（term_glossary 無此鍵）→DENY、單元 `(domain,strand)` 無 strand_labels 條目→DENY、單元 `domain`／`life-category` 無 subject_labels 條目→DENY、重複 `claim_id`/`scene_id`→DENY、合法唯一＋參照皆解析→ALLOW**） | schema 違規＝0、⑦ 綁定違規＝0、question 紀錄缺漏＝0、**重複 id（含跨 sidecar `unit_id`）＝0、懸空參照（`claim_id`/`scene.claim_ids`/`prerequisites`/`term_refs`/`strand`→strand_labels/`domain·category`→subject_labels）＝0**（exit 0） | schema 驗證報告＋紅隊 log |
| AC-NAV | 導覽符合 ND/R-OPEN：首屏頂層島 ≤12、預設可見節點 ≤15、英文科中文對照 default-collapsed（R14）；且**無**任何 disabled/灰掉/鎖頭/「尚未解鎖」鎖定態（R-OPEN）（「島」＝頂層策展群組；「分區」保留給 strand 層，見 §6.1，勿混用） | `tools/nav_gate.mjs`（待建，render 後量測頂層島/可見節點計數＋掃鎖定態/鎖 icon/「解鎖」字樣＋中文對照收合態）＋紅隊（鎖定態壞案例須擋） | 首屏頂層島 ≤12、可見節點 ≤15、鎖定態命中＝0、未收合中文＝0 | nav gate 報告 |
| AC-PATH-1 | 每條主要學習路徑**無斷層**（INV-1） | §9 知識受限模擬，**兩道前置**：(1) `tools/path_coverage_gate.py`（§9.6「路徑覆蓋 gate」：確定性驗 **(a) canonical 被模擬序列集 S 覆蓋每一條 DAG edge ＋ (b) 每個孤立節點各自成單點序列（§9.4(i)(ii)）；(a)∪(b) 方涵蓋每個 unit——edge-cover 本身碰不到孤立節點，故孤立節點子檢查不可省**，任一未達即 FAIL，杜絕「選一組漏單元或繞過高倦怠分支的覆蓋子集卻宣稱無斷層」）；(2) `tools/sim_output_schema_gate.py`（§9.5 細則 3a：驗輸出物件 schema/enum＋逐題 kp 歸因，壞值/`bucket=other` FAIL 不得 fail-open） | path_coverage_gate exit 0 ＋ schema gate exit 0 ＋ 每路徑每 U `result=pass`、`gaps=[]` | 模擬輸出 JSON＋覆蓋 gate 報告＋schema gate 報告 |
| AC-PATH-2 | 可學會/記得牢/不倦怠（INV-2/3/4） | §9 模擬（§9.3 三級門檻），**前置** `sim_output_schema_gate.py`（§9.5 細則 3a） | schema gate exit 0 ＋ `learnable=true`、`retention_ok=true`、`burnout_risk≤med`（且 `med` 須 `mitigation` 欄非空）全數；**`burnout_risk`／`result` 為空或 enum 外值＝FAIL，非放行** | 模擬輸出 JSON＋schema gate 報告 |
| AC-REWARD-1 | 已賺得獎勵**永不消失**（含壞檔/升版/catalog改/配額/跨分頁/原子性/reset守門/已裝備物下架/**earned id 刪除或改名**/**型別下架(type retire)**/**git 歷史改寫(squash)洗白**/**頒未入 catalog 的 id（孤兒頒獎/grant-provenance）**/localStorage 驅逐） | §7.3 紅隊 RT-1…RT-15（每條 R1–R8 風險皆有對應 RT：R1→RT-6、R2→RT-4、R3→RT-10、**R4→RT-11**（已裝備可裝備外觀 skin/border/mascot/avatar 下架）、**R5→RT-2**（badge 欄位下架）、R6→RT-7、R7→RT-8、R8→RT-9；＋§7.1/§6.3 驅逐緩解→**RT-12**（匯出/匯入）；＋§7.1 retire-not-delete→**RT-13**（刪除/改名 earned 非可裝備 id，對所有 owned 型別枚舉參數化）；＋§6.7 B-1/B-2→**RT-14**（pre-squash id drop→rewrite-gate DENY／type retire 孤兒→type 參照完整性 FAIL）；＋§6.7 award/grant-provenance→**RT-15**（頒一個未入 `items[]` 的 id／繞過具名頒獎 helper 之 grant-like 路徑→award-provenance 靜態掃描 catch-all FAIL；併驗 F1 型別降級仍有 `equipped<Type>` 懸空 FAIL））＋ **`reward_catalog_gate`（§6.7）：`items[]` 每筆 `id` 兩兩相異且不重用已 retired id（撞號/重用＝FAIL，比照 AC-COV-2，因 id 是 never-disappear byId/isOwned/equipped 解析鍵）、**frozen-id baseline（`reward_id_baseline.json`；最穩健＝由 release snapshot FILE 聯集 ∪ 當前工作樹 items 自動衍生，非 git 歷史）三道 fail-closed：(1) 自身 no-shrink（當前 id 集合 ⊇ 所有 release snapshot baseline FILE〔工作樹中、squash 摧毀不了，非 git HEAD，B-1〕的 id 聯集、`baseline_sha`＝sha256(canonical_json(sorted(ids)))[:16] 重算相符，移除 id/竄改＝FAIL；earnable⟹已發行⟹必在某 FILE，故普通 commit 與 squash 後皆擋）＋(2) coverage：`items[]`∪tombstone ⊇ baseline（曾入 baseline id 無 `retired:true` tombstone 而消失＝FAIL）＋(3) entry：`items[]`∪tombstone ⊆ baseline（id 上架未入 baseline＝FAIL）；(2)+(3)＝集合相等，三道合擊堵『刪 items／同時刪 baseline／ship 不入 baseline』三路 CLASS-B（涵蓋 badge/shop 等非可裝備型別）＋`release_snapshot_on_ship_gate`（部署使 id earnable 前先寫 snapshot⊇live items＋append `<id>` 進 deploy-side release ledger，否則 DENY 部署；genesis 無 earnable id floor 空正確，§10.2）＋**deploy-side release ledger（記 `{id, snapshot_content_sha}`）斷言：(a) 每已記錄 release 的 snapshot FILE 存在工作樹（缺＝FAIL，堵 `git rm -r releases/`）＋(b) 其 content sha ＝ ledger 記錄值（不符＝FAIL，堵編輯既存 snapshot FILE 內容刪 earned id）；ledger（含 content 指紋）在 repo 工作樹＋git 歷史之外，竄改它＝外部部署信任邊界、非 repo 威脅模型，§6.7 誠實殘餘**＋歷史改寫前 `reward_baseline_rewrite_gate`（fail-closed：`backup-premigrate` ref 缺失／非 pre-rewrite 即 DENY、改寫後 ⊇ 改寫前備份 ref，§10.2，B-1）**、`types[]` 每筆帶有效 sha-bound 三簽（`signoff.sha`＝現算 `reward_type_sha`）否則該 type 無效＋**`types[]` retire-not-delete＋no-shrink＋`items[].type→types[]`＋反向 `equipped<Type>`→`types[]` 參照完整性（移除 type 致懸空＝FAIL，B-2）**、`items[]` 引用它的獎勵 FAIL；且 RT-11 對 `equippable:true` 枚舉參數化、RT-13 對所有 owned 型別枚舉參數化（缺任一型別 case→FAIL）**（比照 AC-UNIT-3 納入 deviation enum gate，消「型別三簽治理未掛 AC 矩陣」不對稱） | RT-1…15 **全綠** ＋ `reward_catalog_gate` exit 0（`items[].id` 兩兩相異＋frozen-id baseline 三道皆綠（no-shrink vs immutable release snapshot＋`items[]∪tombstone`＝baseline 集合相等〔coverage＋entry〕）＋歷史改寫 rewrite-gate 綠＋`types[]` retire-not-delete/no-shrink/雙向參照完整性綠＋每型別三簽齊＋RT-11/RT-13 枚舉全覆蓋＋`equippable` 旗標真實性交叉驗：equip 路徑⟹equippable:true＋**award/grant-provenance 靜態掃描：所頒 id⟹∈ live items[]（繞過具名頒獎 helper 之 grant-like 路徑 catch-all FAIL）**＋反向 `equipped<Type>` 鍵於『type 仍 equippable』F1） | 紅隊測試輸出＋reward_catalog_gate 報告＋reward_id_baseline.json |
| AC-STYLE-1 | 設計一致：無私有 class 重造共用元件、內容卡自適應寬 | `design_consistency_gate.js`（**待建**：接用 static-doc-audit skill 既有同名 gate，Phase 0.5 前接線成專案 gate 並**紅隊**，`SDA_CSS=app.css,game_core.css`）＋content-card lint（待建） | 重造＝0、違規卡＝0（exit 0） | gate 報告 |
| AC-STYLE-2 | 零硬編色碼/px 魔術數，全走 `app.css` token | lint（待建，掃非 token 色值/魔術數） | 命中＝0 | lint 報告 |
| AC-NOGRADE | learner-facing **不出現任何**年段/升學考試階段標籤（R11） | `tools/no_grade_label_gate.py`（**已於 Phase 0 建成並紅隊，見 §0.6.1 line 192-193；`--selftest` PASS／`--qualify` 全綠**；掃 render 後**可被使用者感知的文字**（**掃描面亦原則凌駕列舉、非封閉清單**，比照 AC-NOBACKEND「掃所有具 URL 者」：**任何 learner 可感知的文字載體一律納掃**，下列僅示例非窮舉——可見文字 ＋ `aria-label`/`alt`/`title`/screen-reader-only accessible-name ＋ `placeholder`/`aria-description`/`aria-roledescription`/CSS `::before`|`::after` content/文件 `<title>` 等；因 §0.5⑧／R2-08 將 VoiceOver 列入驗收，年段標籤只放 aria-label 或任一上述載體仍會被朗讀/呈現給 learner）。**判定原則凌駕列舉清單（比照 AC-NOBACKEND；詞彙面＋掃描面皆原則式）**：凡**年段或升學階段語義**的可感知標籤、置於**任何可感知載體**，一律 fail；詞彙列舉僅示例、非窮舉：國小/國中/高中/小學/中學/高職/年級/N 年級/會考/學測/分科/指考/統測/學科能力測驗/指定科目考試… ＋紅隊（**清單列舉詞各一例須擋 ＋「清單未列的同義詞」一例（如『基測』『國三』『高二』——皆未列於上且**不含任何列舉詞 substring**，故純列舉式 gate 擋不住、只有語義判定能擋；**不可用『高職二年級』當此例——它含列舉詞『高職』『年級』、substring gate 即命中，以它測 catch-all 會落入「範例其實已被列舉」自相矛盾**）須擋 ＋「年段字樣只放在 aria-label」一例須擋 ＋「年段字樣置於**清單未列的可感知載體**（如 `placeholder` 或 CSS `::before` content）」一例須擋（證掃描面亦原則凌駕列舉、非只掃已列舉載體）、中性難度詞（初級/中級/高級/深階/延伸挑戰）放行**） | 年段/升學階段可感知標籤命中＝0 | gate 報告＋紅隊 log |
| AC-VIZ-1 | 所有畫面/每個 frame 以 iPad Air 13 render、逐張看過、四角色簽核綁 sha（R10） | 視覺 QA harness + signoff manifest | 全畫面覆蓋、四角色逐張簽核、sha 相符 | render + signoff manifest |
| AC-LANG-1 | 全繁體、零簡體、零 PRC 詞（＋R14 英文科英文媒介、R15 術語附英語） | **兩層**：(1) `scan_simplified.py` 機器掃 `SIMPLIFIED` 簡體碼點 ＋ `PRC_TERMS` 已登記 PRC 繁體詞（確定性，命中＝0）；(2) **未登記於 `PRC_TERMS` 的繁體形 PRC 詞**（碼點掃描抓不到者）由 content_audit／語言審查 panel 判（§8 #3 溝通語言學家＋#13 翻譯者；PRC 繁體詞屬中文用語問題，#3 判中文表達、#13 判台灣用語（never mainland），非 #1 領域專家）——**scan_simplified 只保證「簡體碼點＋已登記 PRC 詞」＝0，不宣稱涵蓋全部 PRC 詞**；R14/R15 由 panel＋（Phase 1 待建）`term_annotation_gate` 查 | 簡體碼點＋登記 PRC 詞命中＝0；panel 無未判 PRC 詞 | 掃描報告＋panel 裁定 |
| AC-PERF-1 | 效能不退化：單頁初始 JS ≤ 既有基準、不得無限 inline 膨脹、資產按需載入（R9） | 體積量測腳本（待建，定基準數值） | 每頁 ≤ 基準；0 超標 | 體積報告 |
| AC-A11Y-1 | 對比度 ≥4.5:1、點擊目標 ≥44px、尊重 `prefers-reduced-motion` | 既有 contrast gate + 量測 | 違規＝0 | a11y 報告 |
| AC-CODE-DL | 含可執行碼的模組提供完整下載且**乾淨解壓可跑** | 解壓到 temp＋跑 README 指令 | build/test 綠 | 執行 log |
| AC-NOBACKEND | 無 backend 鐵律（§1.3/§7.4）機器堵死：learner 端與獎勵模組**零對外網路請求**（排行榜/對戰/好友/雲端同步/金流一律禁） | `tools/no_backend_gate.py`（**gate 本身已於 Phase 0 建成並紅隊，見 §0.6.1 line 192-193；`--selftest` PASS；對 legacy evidence 誠實 FAIL＝406 外部向量屬 rebuild 清理、非 gate 未建**）。**判定原則凌駕任何列舉清單（防「列舉漏一個就漏掃」）**：掃描**所有具 URL 的節點與屬性**（任一 `src`/`href`/`srcset`/`action`/`ping`/`data`/`poster`/`formaction`/`xlink:href` 等）＋**所有 CSS URL 參照**（`url()`／`@import`／`@font-face` web font／SVG `<image href>`）＋**所有會發請求的 JS API**，凡**無法靜態證明為同源相對靜態資產**者一律 fail（同源白名單）。掃描向量**（示例，非窮舉；原則＝上述「所有具 URL 者」）**：`fetch`/`XMLHttpRequest`/`WebSocket`/`EventSource`/`navigator.sendBeacon`、`Image().src`/`new Image`/`<img src>`、`<iframe src>`、`<audio>/<video>/<source>/<track>`、`<object>/<embed>`、動態或外部 `<script src>`/`<link href>`、CSS `url()`/`@import`/`@font-face`、SVG `<image href>`、worker `importScripts()`、動態 `import()`、`<form action>` 外部 POST、`<a ping>`、WebRTC（`RTCPeerConnection`/DataChannel）、以及無法靜態證明同源的動態 URL ＋紅隊（**上述每一種向量各植入一個外部呼叫須被擋、純 localStorage/同源靜態放行；另加「清單**未列**之 URL 載體」一例（刻意取**不落在任何已列舉類別**者——`<meta http-equiv="refresh" content="0;url=外部">`〔URL 藏 `content` 屬性，既非列舉的 URL 屬性、也不在『所有 CSS URL 參照』內〕；**不可用 `cursor:url(外部)` 當此例——它屬已列舉的『所有 CSS URL 參照（url()…）』、非真未列，以它測 catch-all 會落入「範例其實已被列舉」自相矛盾**）驗證原則式掃描對**真未列 vector** 仍 fail（證原則凌駕列舉、非只測已列舉者）**，記 §13 ledger） | 對外 origin 請求命中＝**0**（exit 0） | gate 報告 |
| AC-ANTIDRIFT | §0.2 四防漂移錨點**已交付且 fail-closed**：(a) 專案 `.claude/settings.json` hook、(b) `inject-sop-carriers.py` `[learning-path-sop]` echo、(c) `~/.claude/rules/` 規則檔、(d) `MEMORY.md` 指標（`design_consistency_gate.js` 不在此列，由 AC-STYLE-1 於 Phase 0.5 獨立驗） | 錨點存在性檢查 ＋ 紅隊（「未重讀本檔即宣告任一檔收斂」的壞案例須被 hook **DENY**、好案例 ALLOW） | 四錨點齊備、hook 壞案例 DENY/好案例 ALLOW | 錨點清單 ＋ 紅隊 log |
| AC-SPEC | 本 spec 自身：§0.3 anti-vagueness 全節通過 ＋ content_audit 5 clean ＋ 紅隊零繞過 | spec_concreteness_lint＋content_audit＋紅隊 | 全綠 | spec convergence ledger |

- **細則**：每條 AC 必對應一個**確定性腳本或綁 sha 的簽核**（上表「驗證方法」欄）；標「待建」者於 Phase 1 建並**紅隊**（證明壞案例被擋、好案例放行）才可啟用——**例外（各自更早，不得延到 Phase 1）**：
  (a) **`AC-ANTIDRIFT` 的四防漂移錨點 hook**：因 **Phase 0 exit／§12 定案即需消費**（§10.1 Phase 0 exit 要 `AC-ANTIDRIFT` 綠、§12 step 3.5 要錨點已交付+紅隊才算定案），須在 **Phase 0 內（定案前）**建好並紅隊；
  (b) **`design_consistency_gate.js`（及其 content-card lint）**：因 **Phase 0.5 exit 即需消費**（§6.5 R-STYLE-4／AC-STYLE-1 明訂「Phase 0.5 前接線+紅隊」），須在 **Phase 0.5 前**建好並紅隊；
  (c) **`AC-KP-VERIFY` 的驗證機制**：因 **binding verified 為 Phase 0 ship-gate（§0.5／§0.6.1／line 89）、且 F4-05 已把 `ledger_schema_gate`＋`source_registry` 自 Phase 1 移至 Phase 0**，故其檢核屬 **Phase 0 交付物**——`binding_unverified==0` 由 orchestrator 從 live `items[]` **現算**（已建、見 §0.6.1），`ledger_schema_gate`＋`source_registry` 亦已於 Phase 0 建成並紅隊；表中 `kp_pending_gate.py`「待建」僅指「尚未抽成獨立檔」，其功能已由 orchestrator live metric 等效履行，**不延到 Phase 1**。
  (d) **`AC-NOGRADE`／`AC-NOBACKEND` 的 gate**（`no_grade_label_gate.py`／`no_backend_gate.py`）：**已於 Phase 0 建成並紅隊**（見 §0.6.1 line 192-193，`--selftest` PASS／`--qualify` 全綠），上表「驗證方法」不再標「待建」；`AC-NOBACKEND` evidence 對 legacy 之 FAIL 屬 rebuild 清理，非 gate 未建。
  `acceptance_ledger.json` 一列一次通過紀錄，sha 一變該 AC 作廢須重驗。
- **範例**：✅ 全 **23 條 AC**（AC-COV-1…AC-ANTIDRIFT 共 22 條產品 AC ＋ AC-SPEC meta；含 AC-CORRECT／AC-SCHEMA／AC-NAV）於**同一凍結 release 快照**皆有 PASS 列＋證據，且每條綁定其**對應產物的當前 content sha**（各 AC 的產物不同——AC-SPEC 綁 spec 檔、AC-VIZ-1 綁 render/簽核 manifest、AC-NOBACKEND 綁掃描報告…——故 sha 本就各異；關鍵是**無任一 AC 綁到過時 sha**，依本節細則「sha 一變該 AC 作廢須重驗」）→ 可宣告完成並（經使用者）push。 ❌ AC-COV-1 顯示 37 個 minimum id 無單元 → 未完成，列出 37 個待補 id。 ⚠ AC-VIZ-1 四角色已簽核但 sha 已變（之後又改了版面）→ 舊簽核作廢，須重 render+重簽才算數。

## 12. 本 spec 自身的收斂協定（meta-process）

0. **附錄 A 深掘完成（前提）**：依 §4.1 各 slice 深掘到 DEPTH-STD＋各自獨立審查＋合併配 id＋emit `knowledge_points.json`。附錄 A 未深掘完成，spec 不得宣告定案。
1. 本檔先補齊 §4/§5/§7.2 回填 → 全文完整。
2. 以 `/static-doc-audit` 的 content_audit 對本 spec 跑 round，panel 判定 defect，修到
   **連續 5 round 零 panel-confirmed defect（同一未變更 sha）**。
3. **紅隊**：獨立 agent 嘗試證明「規範可被繞過/遺漏」——例如：能否跳過先備宣告而仍過 gate？
   能否新增獎勵卻讓舊獎勵孤兒化而不被 §7.3 抓到？能否讓模擬角色偷看後續知識？每找到一個繞過＝
   補一道子 gate ＋ 紅隊證明（§13 ledger）。紅隊零繞過才算定案。
3.5. **交付 §0.2 四防漂移錨點並紅隊（`AC-ANTIDRIFT`）**：fail-closed hook／carrier echo／rule 檔／MEMORY 指標 四者皆就位，證明「未重讀本檔即宣告收斂」壞案例被 DENY。錨點未交付＝不算定案（呼應 §0.2「承諾無效、只有 fail-closed 機器強制有效」）。（`design_consistency_gate.js` 不屬此四錨點，由 AC-STYLE-1 於 Phase 0.5 前獨立交付+紅隊，見 §11.A 細則例外(b)。）
3.6. **動工前角色模擬就緒 gate（使用者 2026-10-26；「做之前先模擬，看是否足夠完美可動工」）**：定案前，以**多個角色「假裝照 spec 動工」**獨立模擬執行，找「盲點／不知怎麼做／覺得缺什麼」——必含角色：**Phase-1 實作工程師、單元作者（數理+英文各一）、導覽前端工程師、獎勵/持久化工程師、§9 知識受限模擬器實作者、PM 就緒評估**。每角色輸出 ①盲點/未定義 ②不確定怎麼做 ③應有而缺。**所有 blocker 級盲點補進 spec（補完 sha 變→§12 收斂 streak 重跑）才算就緒**；此 gate 與 content_audit（找內部矛盾）互補——它找的是「可實作性」缺口。（首次執行：2026-10-26，依上列必含角色模擬，挖出「單元內容 schema 缺／衍生資料管線缺／localStorage 驅逐打穿 never-disappear／§9 確定性／正確性驗證未 gate 化」等，已折進 §6.2.2/§6.7/§6.8/§6.3/§9.6/§11.A，見 §13 ledger。定案前須確認上列**全部 6 類必含角色**皆已覆蓋模擬，缺類須補跑。）
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
| 2026-10-26 | scan_simplified 只掃簡體碼點，繁體形 PRC 詞（登記於 `PRC_TERMS` 者）漏放卻宣稱「PRC 命中＝0」 | 加 `PRC_TERMS` substring denylist（排除歧義質量/數據）＋ AC-LANG-1 改兩層 | 壞案例 FAIL／台灣詞+物理質量 PASS ✅ |
| 2026-10-26 | AC-NOBACKEND/AC-NOGRADE 列舉式可被未列向量/同義詞繞過 | 加「判定原則凌駕列舉」＋非窮舉＋同義詞紅隊 | ✅ 已於 Phase 0 建成並紅隊（2026-10-27，見 §0.6.1 line 192-193；`no_grade_label_gate.py`／`no_backend_gate.py` `--selftest` 壞例 DENY／好例 ALLOW、原則兜底抓清單未列向量） |
| 2026-10-26 | 動工前角色模擬（§12 step 3.6）揭「單元內容 schema 缺／衍生資料管線缺／localStorage 驅逐打穿 never-disappear／§9 確定性／正確性未 gate 化」 | 補 §6.2.2/§6.7/§6.8/§6.3 safe_store/§9.6/AC-CORRECT·SCHEMA·NAV/RT-12 | 補後重跑 content_audit 5 clean＋Phase 1 建 gate 時逐一紅隊 |
| 2026-10-29 | spec §12 多角度 content_audit 掃出一批跨章交叉引用/gate 繞過/術語一致性殘洞（AC-KP-VERIFY phase、§8 角色編號、RT 指錯、島/科目/分區三層、裸 N 門檻、AC-NOGRADE 掃描面漏 aria-label、promote high-risk id 前綴、R13 exam 認證值、`deviation_reason` 自由文字免死金牌打穿 AC-UNIT-3…） | 逐一 fix-all→重掃；AC-UNIT-3 的 `deviation_reason` 收斂為 `category∈enum＋sha-bound signoff`（§6.6①） | AC-UNIT-3 紅隊：自由文字 DENY／合法 enum+sha 簽核 ALLOW（Phase 1 建 lint 時執行）；spec 收斂輪見 `spec_converge_ledger.json` |
| 2026-10-30 (a) | §12 收斂紅隊鏈揪出：(a)自由題「低度宣告 under-declaration」——`required_kp_ids` 只有下限、作者可蓄意漏列越界 kp，重算只重分類「被列出」的 kp，對「從不列出」零防禦（Class 1/3）；(b)四層證據紀錄無載體檔+schema（undefined-carrier）；(c)內層 id 存在/唯一與外層 `unit_id` 全域唯一、`sequence_id` 雜湊前像注入性、`prerequisites`/`term_refs`/`claim_id`/reward `items[].id` 等 join/參照未 gate；(d)`strand_labels` 只比筆數（count-only fail-open） | (a)§9.5 加 `per_question_solution_chain` 逐步舉證（每步 `kp_cited∈K(U)`）＋§9.6 對抗式隱含依賴二審（誠實標：自由題真實依賴集為 spec 唯一明記非完全機器化殘餘、以兩道 backstop 最小化、不宣稱完全 fail-closed）；(b)四層內容紀錄實體載體釘到 §6.2.2 sidecar＋§6.7 登記＋`AC-SCHEMA` 驗；(c)補 `unit_id` 跨 sidecar 全域唯一、`sequence_id` 以 `U+001F` 分隔符單射＋`path_coverage_gate` 斷言兩兩相異、`prerequisites`/`term_refs`/reward `items[].id` 存在性/唯一性 gate；(d)`strand_labels`/`subject_labels` 改鍵集合等式/涵蓋 | 各類 fix-all→重跑三角度 content_audit；紅隊案例（越界 kp 自報 teach→重算改判 other DENY、懸空/重複各 id→DENY、count-preserving swap→DENY、合法→ALLOW）；spec 收斂輪見 `spec_converge_ledger.json` |
| 2026-10-30 (b) | §12 收斂續揪：high-risk 分級運算元（gate 最高風險、R1 教錯害人）是封閉 id 前綴枚舉（`promote_verified.is_high_risk` 純 regex over `kid`，忽略 `kind`/`risk_class`），且 §6.8.1 line 654 散文 overclaim「依 claim kind 判、非純 id 前綴」與實際不符——跨命名空間安全宣稱（如 `sci.*` 濃酸操作，作者標 `kind=causal`/`risk_class=normal`、id 無 health/cpr）被降為 1-reviewer 一般路徑；且無「不確定即 fail-closed」catch-all（§13 ledger 2026-10-26『判定原則凌駕列舉』原則未套到此最高風險運算元） | §6.8.1 line 650 加 high-risk **fail-closed floor** 四條（機器粗篩只增不減／`kind∈{health,legal}`＋任命名空間安全語義強制 high／`risk_class` 單調只升不降、作者自報 normal 不生效／不確定即 high、reviewer 須主動具名清除）＋line 654 去 overclaim、要求 `promote_verified` 消費 `kind`＋reviewer 清除記錄 | 紅隊：`sci.*` 濃酸操作 `kind=causal`/`risk_class=normal`＋1 reviewer→**DENY**（kind/語義強制 high、須官方源＋≥2 reviewer）、真一般宣稱（一元一次方程式）＋1 reviewer→ALLOW、作者把 high 自報成 normal 無 reviewer 清除→仍 high；spec 收斂輪見 `spec_converge_ledger.json`（Phase 0/1 `promote_verified` 強化時執行） |
| 2026-10-30 (c) | 定案前獨立對抗紅隊（3 類 bypass）揪出 **CLASS-B 真繞過**：earned 的**非可裝備** reward id（badge 或 shop-type owned 物）被**整筆刪除或改名**時，earned 實例雖留在 `ownedItems`/`badges` union-set，但顯示解析孤兒化、且無任何 RT 或 gate 擋——`reward_catalog_gate` 原僅驗 id 兩兩相異＋不重用 retired id（**無 frozen 全集 baseline、無 retire-not-delete 機器強制**），RT-2 只測欄位移除、RT-11 只涵蓋可裝備型別；§7.1「只增不刪/下架改 retired」僅散文（§0.2 不認）→ 打穿 R3/§1.4/§7 永不消失。CLASS-A／CLASS-C 全 BLOCKED（列舉機器向量皆 fail-closed，唯一殘餘＝§9.5 細則3a 自由題依賴集，誠實標＋雙 backstop）。另 free-sweep F2：§6.6 rubric⑦「機器可驗…不再退回主觀」是 tag-set 成員資格、非語意教學品質，措辭過度宣稱。 | §6.7 `reward_catalog_gate` 加 **frozen-id baseline（`reward_id_baseline.json`，append-only＋git no-shrink＋`baseline_sha`，見 (d) 強化）**：曾 ship 的 id 自 `items[]` 消失而無 `retired:true` tombstone ＝ FAIL；§7.1「catalog 變更安全」改 retire-not-delete fail-closed（禁刪/改名）；新增 §7.3 **RT-13**（刪除/改名 earned 非可裝備 id，對所有 owned 型別枚舉參數化）＋掛 AC-REWARD-1；F2＝§6.6 rubric⑦ 加誠實分級（tag 綁定確定性可驗、語意教學品質由 §8 panel＋§9 backstop、不宣稱機器化）。 | 紅隊：曾 ship id 無 tombstone 消失→DENY、正當 retire tombstone→ALLOW、改名（刪舊增新）→DENY；每 owned 型別各一 RT-13 case（Phase 0.5/1 建 gate 時執行）；spec 收斂輪見 `spec_converge_ledger.json` |
| 2026-10-30 (d) | (c) 修補自身次層缺陷，§12 收斂 B/A 同輪揪出：**(1 blocker)** frozen-id baseline 宣稱 append-only/sha-bound 但**未定義其自身完整性**——gate 只驗 items⊇baseline，baseline 檔本身可被竄改；同時刪 `items[]` 與 baseline 內該 id（＝改名）維持 items⊇baseline 仍過關→重開 CLASS-B 孤兒（違 §0.2『只認 fail-closed』）；且「sha-bound」無 pre-image 定義（異於 kp_fact_sha/cat_fact_sha/reward_type_sha/unit_content_sha）。**(2 blocker)** §10.1 Phase 4 exit 仍寫 `RT-1..12 全綠`，未隨 RT-13 新增同步→reward-expansion 階段可不驗 RT-13 過關、重開 CLASS-B。 | (1) §6.7／§7.1／AC-REWARD-1 的 baseline 改**兩道 fail-closed**：自身 no-shrink（當前 id 集合 ⊇ git HEAD 已提交版本，移除即 FAIL）＋`baseline_sha`＝sha256(canonical_json(sorted(ids)))[:16] 具體 pre-image（重算比對、竄改 FAIL）＋原 items⊇baseline；兩道合擊堵「同時刪 items 與 baseline」；§7.3 RT-13 加 case (iii)（同時刪 items＋baseline→no-shrink FAIL）。(2) §10.1 Phase 4 exit `RT-1..12`→`RT-1..13`。 | 紅隊：刪 earned id 於 items→(2 items⊇baseline)FAIL、同時刪 items＋baseline→(1 no-shrink vs git HEAD)FAIL、竄改 baseline_sha→FAIL、正當 retire tombstone→ALLOW（Phase 0.5/1 建 gate 時執行）；spec 收斂輪見 `spec_converge_ledger.json` |
| 2026-10-30 (e) | (d) 修補自身次層缺陷，§12 收斂 B 角度揪出：frozen-id baseline 只強制 (1) no-shrink（baseline⊇git HEAD）＋(2) coverage（items∪tombstone⊇baseline），**缺 (3) entry/completeness（items∪tombstone ⊆ baseline）**——沒機制強制「上架的 id 必入 baseline」，故 **ship-but-never-baselined** 的 id 事後無 tombstone 刪除時 (1)(2) 皆偵測不到 → 重開 CLASS-B 孤兒（baseline 的 floor 完整性本身是未強制的承諾，違 §0.2）。（另 raw「baseline_sha 為裝飾性防竄改」panel 0/5 NOT：git HEAD no-shrink 才是真防線、baseline_sha 僅 pre-image，不採。） | §6.7／§7.1／§7.3 RT-13／AC-REWARD-1 的 baseline 由兩道升**三道**：加 (3) entry `items[]∪tombstone ⊆ baseline`（id 上架未入 baseline＝FAIL）；(2)+(3)＝**集合相等**，再加 (1) no-shrink ⟹ baseline 恆等於 catalog 曾出現的所有 id 且只增不減；**並建議 baseline 由『git 歷史所有曾提交 items id 之單調聯集』確定性自動衍生**（消人工維護缺口、使 (1)(3) 自然成立）；§7.3 RT-13 加 case (iv)（ship 不入 baseline→entry FAIL）。 | 紅隊：刪 items 無 tombstone→(2)FAIL、同時刪 items＋baseline→(1)no-shrink FAIL、ship 不入 baseline→(3)entry FAIL、正當 retire tombstone→ALLOW（Phase 0.5/1 建 gate 時執行）；spec 收斂輪見 `spec_converge_ledger.json` |
| 2026-10-30 (f) | 定案前第二輪獨立對抗紅隊（對 sha 2c34ed6c）揪 **CLASS-B B-1（高、已實證）**：frozen-id baseline 的「真防線」完全根植 git（no-shrink vs **git HEAD**＋auto-derive＝**git 歷史** items 單調聯集），但本 repo 標準收尾含 **full-history squash＋force-push**（memory `history-squash-purge-training`，已實際執行且為 recurring 指令）→ squash 後歷史消失、HEAD==工作樹，pre-squash 自 `items[]` 刪一個 earned reward id（無 tombstone）→ 三道全過、earned 孤兒化、完全偵測不到；git-rooted 錨被自己的收尾摧毀（§0.2 的 fail-closed 形同虛設）。 | baseline no-shrink 錨**改綁 immutable 非-git 源**＝所有 `releases/<id>/reward_id_baseline.json`（F6-05 內容定址、squash 不可摧毀）的 baseline 聯集（§6.7／§7.1／AC-REWARD-1 同步，移除 git HEAD／git 歷史聯集）；auto-derive 改『release snapshots 聯集 ∪ 當前工作樹 items』；**新增 `reward_baseline_rewrite_gate`**：任何 git 歷史改寫前斷言『改寫後 baseline ⊇ 改寫前備份 ref（`backup-premigrate`）baseline』否則 DENY；§7.3 RT-14(A)。 | 紅隊：pre-squash id drop→rewrite-gate DENY＋no-shrink 對照 release snapshot 仍抓到、正當發行→ALLOW（Phase 0.5/1 建 gate 時執行）；spec 收斂輪見 `spec_converge_ledger.json` |
| 2026-10-30 (g) | 同輪揪 **CLASS-B B-2（低、新）**：`types[]` 型別註冊區只有 per-entry sha-bound 三簽（驗現存條目、不防刪），**無 no-shrink/tombstone**，且**無 `items[].type→types[]` 參照完整性**、**無反向「stored `equipped<Type>` 的 type 被移除」檢查**（§6.3 合併策略表只單向 enum→strategy）→ 整類下架（刪 `types[]` mascot 條目＋移除 equip 路徑、mascot-* id 留 tombstone）→ owned id 仍在但 `equippedMascot` 靜默丟、型別可用性孤兒，RT-1..13 未涵蓋（RT-11 只在 type 內枚舉 id、RT-13 只到 id 刪改）。誠實分級：id-ownership（union-set）仍保，孤兒者為 equip-state＋型別可用性。 | `types[]` 加 **retire-not-delete＋no-shrink＋tombstone（比照 items[]，同錨 immutable release snapshot）＋`items[].type→types[]` 參照完整性＋反向 `equipped<Type>`→`types[]` 參照完整性**（§6.7／AC-REWARD-1 同步）；§7.3 RT-14(B)。 | 紅隊：刪 type 條目致 stored `equipped<Type>` 懸空→FAIL、type 正當 tombstone→owned/equip graceful ALLOW（Phase 0.5/1 建 gate 時執行）；spec 收斂輪見 `spec_converge_ledger.json` |
| 2026-10-30 (h) | (f)/(g) 修補自身次層缺陷，§12 收斂 B/A 同輪揪 2 blocker：**(B-1′)** (f) 把 no-shrink floor 整個移到『∪release snapshots』但**從未綁定 ship/earnability↔snapshot**→genesis 或 shipped-but-unsnapshotted id 的 floor 空；更糟：(f) 把舊 git-HEAD no-shrink 整個移除，連**普通 commit** 的 delete-both 保護都丟了→不需 squash 即可孤兒化未-snapshot 的 earned id。**(前置)** `reward_baseline_rewrite_gate` 非 fail-closed（只 baseline 不足才 DENY、backup ref 缺失/事後建立不擋）且 cross-ref「§10 收尾 SOP」在 §10 無實體（懸空）。另 §10.1 Phase 4 exit 仍 stale `RT-1..13`。 | (B-1′) 加 **earnability 綁定＝`release_snapshot_on_ship_gate`**＋no-shrink floor 錨 **release snapshot FILE**（工作樹中、squash 只摧毀歷史保留當前檔→摧毀不了；earnable⟹必在某 FILE→普通 commit 與 squash 後皆擋，修回丟失的普通-commit 保護）＋genesis 空 floor 誠實標正確；(前置) rewrite_gate 改 **fail-closed**＋**新增 §10.2 部署／歷史改寫收尾 SOP**（使懸空 cross-ref 有實體、前置機器強制）；Phase 4 exit RT-1..14。 | 紅隊：普通 commit 刪已發行 id→no-shrink(snapshot FILE)FAIL、squash→FAIL＋rewrite-gate fail-closed DENY、ship 未寫 snapshot→ship-gate DENY、genesis→無 earnable 無孤兒 ALLOW（Phase 0.5/1 建 gate 時執行）；spec 收斂輪見 `spec_converge_ledger.json` |
| 2026-10-30 (i) | (h) 修補自身次層缺陷，§12 收斂 B 角度揪 blocker：(h) 把 floor 錨到 release snapshot **FILE**，但 snapshot-immutability(F6-05) 只被 cite、**無獨立存在性紀錄**——普通 commit `git rm -r releases/<id>/`＋drop-both 可把 FILE floor 清成 ∅（與 genesis 空 floor 無法區分），earned id 孤兒化、『每條路徑皆 FAIL／普通 commit 與 squash 皆擋』為 overclaim（floor 錨自身可被同一不受信任的 repo 編輯刪除）。 | 錨定 **deploy-side append-only release ledger**（部署時 CI／host 寫入 repo 工作樹＋git 歷史**之外**的不可變／內容定址紀錄，為『WHICH releases 曾存在』權威來源）；`reward_catalog_gate` 斷言**每已記錄 release 的 snapshot FILE 必存在工作樹（缺＝FAIL，堵 `git rm -r releases/`；與 genesis 區分）**；§10.2 ship-gate 同時 append `<id>` 進 ledger；§6.7／§7.3 RT-14(a‴)／AC-REWARD-1 同步。**誠實殘餘（仿 §9.5 終止無限回歸）**：竄改 deploy-side ledger 本身＝外部部署／基礎設施信任邊界、非 repo-level 威脅模型內，具名揭露、不宣稱 repo 層能擋。另修 R162 minor：§13 (h) 列原誤置於 (f)(g) 前（forward-ref）→移至 (g) 後、序復單調。 | 紅隊：`git rm -r releases/`＋drop-both→ledger 存在性斷言 FAIL、genesis(ledger 空)→ALLOW、竄改外部 ledger→標為外部信任邊界殘餘（Phase 0.5/1 建 gate 時執行）；spec 收斂輪見 `spec_converge_ledger.json` |
| 2026-10-30 (j) | (i) 修補自身次層缺陷，§12 收斂 B 角度揪 blocker：(i) 的 deploy-side ledger 只錨 release-id **存在性**、未錨 snapshot **內容**→『既存 snapshot FILE 內容不得改＝FAIL』無 squash-surviving referent；編輯既存 `releases/<id>/reward_id_baseline.json` 刪 earned id X＋drop X from items[]（auto-derived floor 一起縮）→三道全過、X 孤兒、未碰外部 ledger→『每條 repo-level 路徑皆 FAIL／唯一殘餘＝ledger 竄改』仍 overclaim（content-edit 是未錨定的 repo-level 路徑）。 | deploy-side ledger 每筆改記 **`{id, snapshot_content_sha}`**（存在性＋**內容指紋**皆外部錨定）；`reward_catalog_gate` 對每已記錄 release 斷言 (a) FILE 存在＋(b) FILE content sha ＝ ledger 記錄值（不符＝FAIL）；no-shrink floor ＝ ∪(ledger-recorded 且 content-verified 的 snapshot id-set)、工作樹 FILE 僅 cache；§10.2 ship-gate append `{id, snapshot_content_sha}`；§6.7／§7.3 RT-14(a⁗)／AC-REWARD-1 同步。殘餘收斂為『竄改外部 ledger（含 id＋content_sha）』單一外部信任邊界。 | 紅隊：編輯 snapshot FILE 刪 id＋drop items→content sha≠ledger→FAIL、`git rm` FILE→存在性 FAIL、genesis(ledger 空)→ALLOW、竄改外部 ledger→外部信任邊界殘餘（Phase 0.5/1 建 gate 時執行）；spec 收斂輪見 `spec_converge_ledger.json` |
| 2026-10-30 (k) | 達 5-clean（sha `201205f2`）後**第三輪獨立對抗紅隊**揪 **CLASS-B 真繞過（repo-level、不依賴外部 ledger）**：`reward_catalog_gate` 一路只驗 catalog **自身**一致性（baseline/no-shrink/型別三簽/`items[].type→types[]`/equip-provenance），卻**從未綁頒獎端的 id provenance**——頒獎／解鎖 call-site 頒一個**未入 `items[]` 的 id**（最寫實 dev 疏漏，如 `awardBadge('badge-c-new')` 漏把 badge-c 入 catalog）→ earned 寫入 `profile.badges` union-set（id-ownership 保）卻因顯示解析 catalog-keyed（`getBadgeWall`/`wish_shop byId`）永成孤兒，RT-1..14/baseline 全無擋。**不對稱 tell**：§6.7 已有 equip-provenance 靜態掃描 gate，卻無對稱的 grant-provenance gate（§0.2 禁的「散文承諾 awards 只用 catalog id」）。另 F1（低，sibling）：反向 `equipped<Type>`→`types[]` 參照完整性只鍵於「type 存在」而非「存在**且仍 equippable**」，type re-signed 降級 `equippable:true→false` 卻留 stored `equipped<Type>` 無遷移→靜默丟合併策略。CLASS-A／CLASS-C 全 BLOCKED（唯一殘餘仍＝§9.5 細則3a 自由題依賴集，誠實標＋雙 backstop）。 | §6.7 `reward_catalog_gate` 加**對稱 award/grant-provenance 靜態掃描交叉驗**：頒獎／解鎖經單一具名 helper（`grantReward`/`awardBadge`/`unlockItem`，id 為參數），gate 斷言凡 grant-like 行為所頒 id⟹∈ live（非 retired）`items[]`，**catch-all：任何無法靜態證明『所頒 id∈items[]』的 grant-like 路徑（繞過/改名 helper、動態 id、間接派發）一律 FAIL**；誠實分級（具名 helper 確定性判、間接 fail-closed、為 §8 外加 backstop 非取代）。§7.3 新增 **RT-15**＋掛 AC-REWARD-1（RT-1..15）＋§10.1 Phase 4 exit RT-1..14→RT-1..15＋§6.7 三道合擊補路徑 (g)。F1：反向參照完整性改鍵於『type 仍在 `types[]` 且 `equippable:true`』，降級留懸空 `equipped<Type>` 無遷移＝FAIL（RT-15 併驗）。 | 紅隊：頒未入 items[] 的 id→award-provenance FAIL、繞過/改名頒獎 helper 之 grant-like→catch-all DENY、頒 retired id→DENY、頒 catalog 既有 id→ALLOW、型別降級留懸空 equipped 無遷移→F1 FAIL、正當降級＋遷移→ALLOW（Phase 0.5/1 建 gate 時執行）；spec 收斂輪見 `spec_converge_ledger.json` |

---

## 14. 開放問題（待使用者拍板）

- ~~O-1 獎勵內容方向~~ → **已定案 §7.4**（skin/border/mascot/badge（綁真實里程碑）/收集冊；靜態站可行性鐵律：無排行榜/對戰/雲端/金流/刷量花招）。
- ~~O-2 roadmap 視覺風格~~ → **已定案 §6.1**（科技樹主幹＝先備 DAG ＋ 地圖式美術；4 節點狀態；不顯年段；過 viz-QA）。
- ~~O-3 國小各科深度下限~~ → **已由 R13 涵蓋**（課綱＝下限、不分年段的連續路徑、深度只有上限（學科至大學入門、英文無上限）無下限之爭；國小段以「課綱 minimum＋銜接」為基、可向上延伸）。
- ~~O-4 打掉重做 vs 包裝接入~~ → **已定案（使用者 2026-10-26：依 spec 規則自動判定，不逐頁問）**：判定規則＝既有頁**符合 §6.2 單元骨架＋§6.5 R-STYLE＋§6.6 rubric** 就「包裝接入」；任一不符就「打掉重做」。Phase 1 用覆蓋矩陣對每頁機械標記 `reuse|rebuild`，不需使用者逐頁裁示。
- ~~O-5 首次 onboarding/空白首屏~~ → **已定案（2026-10-26 角色模擬補）**：新使用者（零進度）首屏＝**頂層島 ＋ 中性邀請**（「想從哪裡開始？」），**不強制 placement 小測**（小測僅為可選建議）；回訪者才顯示「繼續」CTA。納 `AC-NAV`。
- ~~O-6 搜尋無結果 ＋ R11 過濾~~ → **已定案**：搜尋常駐；**無結果**給中性提示＋建議相近主題；**搜尋輸出一律經 R11 過濾**（不得因 metadata 洩年段字樣）。
- ~~O-7 跨裝置/離線/localStorage 驅逐邊界~~ → **已定案 §7.1**：never-disappear 僅限「同瀏覽器未被清」；跨裝置/被驅逐＝純前端**匯出/匯入進度檔**（RT-12）；離線（service worker/資產快取）**暫列 out-of-scope**（未來可加，不影響核心）。
- ~~O-8 AC-PERF-1 閾值~~ → **已定案方法**：基準＝**同類頁現況初始 JS 中位數**，Phase 1 量測既有頁定出具體數值寫入 `AC-PERF-1`（不留「自由心證」）。
- ~~O-9 golden 自身滿分 bar（bootstrap 循環）~~ → **已定案 §6.6**：每 archetype 的**第一個單元**由 WRITERS＋§8 六審查鏡（#2/#3/#4/#5/#6/#10）＋§8 全 panel 簽核為 golden、凍結（freeze 前 `AC-UNIT-3` 對它豁免、改以「六鏡＋panel 全簽」為通過條件）；bespoke 允許**多 golden 子類**避免單一 golden 逼出大量 deviation。

**→ §14 開放問題 O-1…O-9 全數關閉；spec 無待使用者拍板項，可逕行走 §12 收斂。**
