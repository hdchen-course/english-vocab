# LEARNING PATH REBUILD 規格契約嚴格審查

## 摘要結論（先回答）

**結論：目前不應將 `LEARNING_PATH_REBUILD_SPEC.md` 定案，也不應進入產品實作。** 這不是因為 Phase 1/2 的工具或教材尚未實作——那些本來就是未來工作；真正的阻斷點是：現有規格本身仍有互相矛盾、不可達的驗收條件、會遺失資訊的 manifest 管線，以及可在漏做需求時仍「全綠」的驗收缺口。

本次確認到 **7 個 BLOCKER、7 個 HIGH、3 個 MEDIUM**。最嚴重者如下：

1. 「唯一事實來源」實際上有多份文件同時宣稱自己是唯一/最終規格，而且對自由瀏覽、年段標籤、進階頁 XP、卡片寬度、audit clean 次數等給出相反要求。
2. 規格定案時是否必須已有 `design_consistency_gate.js`，§0.2 與 §12/Phase 0.5 互相矛盾；同時文件宣稱「只剩兩個 blocker」，但 §12 另列 `AC-ANTIDRIFT` 與動工前角色模擬。
3. 3092 個知識點的 ID 與計數本身一致，但正式 `_kp_build.py --check` **目前 exit 1**，且附件中的 30 個 `(待核)` 有 16 個會被 parser 靜默丟掉；manifest 因而不是附件的無損機器表示。
4. 「壞 JSON 後已賺獎勵零遺失」在只有一份已損壞 localStorage 的前提下不可達；「確認後 reset」又與 earned 欄位永不縮小互斥；`coins` 若採 `monotonic-max`，合法消費也無法持久化。
5. R13 明訂旅居生存、出國聽課與 TOEIC/TOEFL/IELTS/GEPT 必須是 gated minimum，但 manifest 找不到任何認證條目；§4.x 應考能力也沒有 ID、manifest 或 AC，因此即使 22 個 AC 全過，這些要求仍可完全漏做。
6. 單元 schema 缺少 `tier`、完成狀態、事實 claim/source 對映及多種題型的判別式結構；尤其 life 的 ID 不含 tier，現有 schema 無法可靠生成 `strand×tier` 頁面。
7. 知識點附件已有可明確指出的內容錯誤或高風險表述，故目前不能「保證知識點正確」；需要修正後重新做逐 slice 的權威來源審查。

因此，建議先進行一次 **spec-only 修訂 round**：先解決本報告全部 BLOCKER，再重跑附件 build/check、跨文件一致性檢查、動工前角色模擬，最後才開始計算 5-clean streak。

> 審查邊界：本報告沒有把「規格描述的未來工具/產物尚未建立」本身當成缺陷。只有當該產物被定案條件立即依賴、規格未定義其可執行契約、或文件錯誤宣稱它不再是 blocker 時，才列為 finding。也沒有把目前 3092 筆 `status:"todo"` / `unit_ids:[]` 當成未實作缺陷。

## 審查範圍與唯讀驗證

已讀：

- `/Volumes/workplace/EnglishTraining/english-vocab-deploy/LEARNING_PATH_REBUILD_SPEC.md`
- `/Volumes/workplace/EnglishTraining/english-vocab-deploy/authoring/KNOWLEDGE_POINT_INVENTORY.md`
- `/Volumes/workplace/EnglishTraining/english-vocab-deploy/authoring/knowledge_points.json`
- `/Volumes/workplace/EnglishTraining/english-vocab-deploy/DICTATION_BUILD_SPEC.md`
- `/Volumes/workplace/EnglishTraining/english-vocab-deploy/DESIGN_SPEC.md`
- `/Volumes/workplace/EnglishTraining/english-vocab-deploy/BLUEPRINT.md`
- `/Volumes/workplace/EnglishTraining/english-vocab-deploy/DESIGN_PLAN.md`
- `/Volumes/workplace/EnglishTraining/english-vocab-deploy/STICKINESS_PROPOSAL.md`
- `/Volumes/workplace/EnglishTraining/english-vocab-deploy/TS_MIGRATION_ROADMAP.md`
- `/Volumes/workplace/EnglishTraining/english-vocab-deploy/AUDIT_DIMENSIONS.md`
- `/Volumes/workplace/EnglishTraining/english-vocab-deploy/tools/_kp_build.py`
- `/Volumes/workplace/EnglishTraining/english-vocab-deploy/tools/spec_concreteness_lint.py`
- `/Volumes/workplace/EnglishTraining/english-vocab-deploy/.claude/settings.json`
- `/Users/hdchen/.claude/rules/visual-qa-ipad-signoff-do-not-delete.md`
- `/Volumes/workplace/EnglishTraining/engineering/authoring/STANDING_AUDIT_SOP.md`
- `package.json`、`tsconfig.json`、`tsconfig.legacy.json`

唯讀檢查結果：

- manifest：3092 items、3092 unique IDs、0 duplicate IDs；domain/tier/exam 的實算與 `meta` 一致。
- `beyond=false`：3092；`t_enrich`：0。這本身不是缺陷，因 enrich 可選。
- `status="todo"`：3092；非空 `unit_ids`：0。這符合「尚未實作」狀態，不列缺陷。
- `python3 tools/_kp_build.py --check`：**exit 1**，報 19 個疑似不符格式 bullet。
- `python3 tools/spec_concreteness_lint.py LEARNING_PATH_REBUILD_SPEC.md`：exit 0；但該 lint 只做章級關鍵字存在性檢查，不能證明每條規範具體。
- 附件可解析知識點也是 3092，與 manifest ID 集完全一致；但附件有 30 個 `(待核)`，manifest 只保留 14 個。
- manifest 的 title/exam 搜尋：TOEIC/TOEFL/IELTS/GEPT/多益/托福/雅思/全民英檢為 0；旅居/海外/留學/survival/study-abroad 類明示條目僅 1。
- 正式 repo 內沒有 `VISUAL_QA_BUILD_SPEC.md`、`memory/live-workstreams-2026-10-25.md`、`inject-sop-carriers.py`、`MEMORY.md`；外部使用者目錄的 visual-QA 規則檔存在。

## Findings

### BLOCKER-01 — 「單一事實來源」權威分裂，且現有規範有直接衝突

**證據**

- 主文件宣稱自己是唯一事實來源：`/Volumes/workplace/EnglishTraining/english-vocab-deploy/LEARNING_PATH_REBUILD_SPEC.md:3-6`。
- `BLUEPRINT.md` 也宣稱自己是「唯一可執行規格」且裁決衝突：`/Volumes/workplace/EnglishTraining/english-vocab-deploy/BLUEPRINT.md:3`。
- `DESIGN_SPEC.md` 宣稱現有共用資產是唯一事實來源：`/Volumes/workplace/EnglishTraining/english-vocab-deploy/DESIGN_SPEC.md:38`。
- 被主文件引用為站級契約的 `STANDING_AUDIT_SOP.md` 也稱自己是 canonical single source：`/Volumes/workplace/EnglishTraining/engineering/authoring/STANDING_AUDIT_SOP.md:1-8`。
- 主文件要求任何節點永遠可開、禁止 hard gate：`LEARNING_PATH_REBUILD_SPEC.md:306-312`；但 `BLUEPRINT.md:91` 要求超綱內容 hard gate，並在 learner hub 顯示「小四」「小五～國一」。這同時違反主文件 R-OPEN 與 R11（`LEARNING_PATH_REBUILD_SPEC.md:109-112`）。
- `AUDIT_DIMENSIONS.md:54` 把進階頁零 XP 視為 MAJOR；但 `DESIGN_PLAN.md:68-71` 與 `BLUEPRINT.md:160` 明訂 `number_theory_advanced` 不加 XP。
- 主文件要求答案/題幹/內容卡一律 `fit-content`、不得全寬：`LEARNING_PATH_REBUILD_SPEC.md:425-429`；`DESIGN_SPEC.md:15-18` 則要求 `.cn-card` / stage 填滿 content-max、內層才收斂。
- 主文件要求 5 clean：`LEARNING_PATH_REBUILD_SPEC.md:743-744`；被引用的站級 SOP 使用 N=2，且 visual viewport 也不是 iPad 規格：`STANDING_AUDIT_SOP.md:42-51`。
- 主文件稱聽寫系列「已上線」：`LEARNING_PATH_REBUILD_SPEC.md:18`；`DICTATION_BUILD_SPEC.md:2` 稱 `NOT converged. NOT implemented.`。
- `STICKINESS_PROPOSAL.md:124` 明訂不做新科目/新單元，與本次重建的核心 gap 補齊方向相反。

**影響**

不同實作者可各自引用一份「最終規格」並產出完全相反、卻都自稱合規的結果。這是典型 contract split-brain。

**建議修法**

在主文件 §0 新增不可含糊的 precedence table：

1. `LEARNING_PATH_REBUILD_SPEC.md` 為本工程唯一 normative source。
2. 附錄 A 與 manifest 僅是由主文件明確納入的 binding artifacts。
3. 其他文件一律標記 `historical/background`；若仍有拘束力，必須精確列出「檔名＋章節＋版本/sha＋採用條款」。
4. 對 R-OPEN、R11、進階 XP、卡片寬度、clean 次數逐項寫出裁決；不要只寫「對齊/合併」。
5. 移除或改寫其他文件的「唯一/最終」宣告，並加醒目 superseded banner。

### BLOCKER-02 — 定案條件自相矛盾，且「只剩兩個 blocker」不實

**證據**

- §0.2 說「本 spec 定案時」四錨點缺一不可，並把 `design_consistency_gate.js` 列為第 2 項：`LEARNING_PATH_REBUILD_SPEC.md:31-39`。
- §12 又說該 gate **不屬定案錨點**，延到定案後、Phase 0.5 前才交付：`LEARNING_PATH_REBUILD_SPEC.md:748`；Phase 0.5 本身明確在定案之後：`:656-660,750`。
- `LEARNING_PATH_REBUILD_SPEC.md:55` 宣稱定案 blocker 僅剩 5-clean＋紅隊；但 Phase 0 exit 另外要求 `AC-ANTIDRIFT`：`:670`，§12 還有動工前角色模擬：`:749`。
- 文件的跨-session anchor `memory/live-workstreams-2026-10-25.md`（`:4`）在 repo 中不存在；`inject-sop-carriers.py` 與 `MEMORY.md` 也不存在。現有 `.claude/settings.json:1-61` 沒有 learning-path 或 visual-signoff 的 fail-closed hook。

**影響**

Phase 0 無法判斷何時完成；依 §0.2，需先做 Phase 0.5 的 gate 才能定案，但 Phase 0.5 又不得在定案前開始，形成時序循環。文件狀態也可能讓 reviewer 錯誤開始累積 5-clean。

**建議修法**

新增明確的 **Phase -1 / Spec tooling**：只允許建立規格驗證與 anti-drift 工具，不算產品實作。把 `AC-ANTIDRIFT`、visual-QA 契約、spec lint、manifest check 放入 Phase -1；定義完成後才開始 5-clean。若不採 Phase -1，就從 §0.2 移除 design gate 的定案依賴並一致地延後。同步修正 `:55` 的 blocker 清單，列出每個必要條件與目前狀態。

### BLOCKER-03 — 附錄 A → manifest 不是無損管線，且正式 AC-COV-2 現在必然失敗

**證據**

- 主文件把附錄 A 定為 binding，且要求兩種 ID 格式：`LEARNING_PATH_REBUILD_SPEC.md:184-192`。
- 附錄檔首仍宣稱所有 ID 都是 `<domain>.<tier>.<strand>.<slug>`：`KNOWLEDGE_POINT_INVENTORY.md:5`；`_kp_build.py:9-13,34` 也只描述/驗證單一 generic 格式，沒有驗證 life category/tier 規則。
- `_kp_build.py:27-30` 的 regex 在 `}` 後使用 `.*$` 丟棄尾端內容。實算：附件 30 個 `(待核)`，其中 16 個在大括號後；manifest 只剩 14 個。例：附件 `KNOWLEDGE_POINT_INVENTORY.md:2077` 的 `chi-square-genetics` 有尾端 `(待核)`，但 `knowledge_points.json:14901-14911` 已無該標記，仍是 `beyond:false`。
- `_kp_build.py:83` 每次重建都硬寫 `status:"todo", unit_ids:[]`；但 Phase 1 又要求它們改成由 coverage gate 衍生、重跑不得覆寫：`LEARNING_PATH_REBUILD_SPEC.md:661`。同一檔案因此有兩個 producer，且現有 producer 會 clobber 衍生狀態。
- AC-COV-2 要求 `_kp_build.py` 的不符格式數為 0：`LEARNING_PATH_REBUILD_SPEC.md:712`。實際 `--check` exit 1，因 `_kp_build.py:92-95` 把 tier 摘要、待核清單等 19 個說明 bullet 誤判為知識點。

**影響**

待核狀態會靜默消失；重建會清掉 coverage；AC-COV-2 無法成為可執行 gate。更危險的是 3092 項全部 `beyond=false`，所以被丟掉的待核項仍會被當 mandatory minimum 強制建置。

**建議修法**

- 只保留一個 canonical source，最好是結構化 JSON/YAML；Markdown 附錄由它生成，不再反向解析自然語言。
- 新增明確欄位 `verification_status: verified|pending`、`verification_note`、`source_refs[]`，禁止在 `}` 後放機器語意。
- 把 immutable inventory 與 derived coverage 拆成兩檔，例如 `knowledge_points.json` + `knowledge_point_coverage.json`；`_kp_build.py` 永不寫 `status/unit_ids`。
- 調整 nonconforming detector，只掃明確的 inventory 區塊，或要求說明 bullet 使用不同標記；加入 trailing-text 必須為空的 fail-closed 檢查。
- 修正後要求 round-trip test：slice → manifest → generated appendix，再比對所有欄位與 3092 個 ID。

### BLOCKER-04 — reward「永不消失」含不可達案例，且 reset/coins/跨分頁語意互斥

**證據**

- 壞 JSON 的處置只是把同一壞字串備份並拒寫：`LEARNING_PATH_REBUILD_SPEC.md:509-511`；但 RT-6 要求壞一個 byte 後 reload 仍「已賺獎勵零遺失」：`:543`。如果唯一持久副本已損壞，系統沒有資訊可重建原 XP/badges。
- RT-7 要求 quota 超出時「告警並保全」新獎勵：`:544`；沒有第二持久介質時，新值只在記憶體中，refresh 後仍會消失。
- safe-store 要把 `coins` 與 `totalXp` 都作 `monotonic-max`：`:408`；但相關規格把 coins 定為可消費貨幣（例如 `BLUEPRINT.md:90`）。合法購買會被 merge 恢復成較高舊餘額。
- `reset()` 允許使用者確認後全清：`LEARNING_PATH_REBUILD_SPEC.md:410,547`；但 earned 縮小一律拒寫與回滾：`:411,546`。依現契約，合法 reset 永遠無法成功。
- RT-8 要 A 分頁 reset 不影響已開啟的 B 分頁：`:545`。若 B 之後做 union/max save，會把 A 的 reset 復活；若不復活，又違 RT-8。規格沒有 reset epoch/tombstone 或跨分頁仲裁。
- §7.1 宣稱驅逐緩解有 RT-12，§14 也引用 RT-12：`:512-515,779`；但 §7.3 只定義 RT-1…RT-11，AC-REWARD-1 也只要求 RT-1…11：`:537-548,721`。

**影響**

AC-REWARD-1 目前不是可滿足的驗收契約；不同工程師會用不同方式解讀 reset、消費與跨分頁，甚至可能讓購買無限次或讓 reset 失效。

**建議修法**

- 將承諾改為兩層：`no-destructive-overwrite` 與 `recoverable-from-last-good-snapshot`。若真的要求壞一 byte 零遺失，必須至少有雙槽 snapshot + checksum + sequence，或 event journal；壞檔時從上一個 valid snapshot 回復。
- quota 寫入失敗時不得先宣告 reward earned；提供 forced export/下載 recovery，或使用第二本機儲存層並明訂失敗語意。
- 將 coins 改為不可變 ledger：`coinsEarned` 與 `spends[{id,amount,txId}]`，balance 由兩者計算；不要對 balance 做 max。
- 定義 `resetEpoch/resetId` 與 user-confirmed tombstone；明確裁決「intentional reset 是否為 never-disappear 例外」。所有分頁依 epoch 仲裁。
- 補正式 RT-12，並納入 AC-REWARD-1。

### BLOCKER-05 — 必備英文與應考能力沒有可追蹤條目，22 AC 可在漏做時全綠

**證據**

- R13 把生活實用、旅居生存、出國聽課與 TOEIC/TOEFL/IELTS/GEPT 定為 **gated minimum**：`LEARNING_PATH_REBUILD_SPEC.md:121-127`。
- manifest `knowledge_points.json:20-36` 的 exam 統計只有台灣考試、分科與「無」，沒有任何上述認證。對 3092 筆 title 的唯讀搜尋也得到認證命中 0、明示旅居/海外/留學類命中 1。
- §4.x 說應考能力要「與知識點並列追蹤」，但只有 prose list：`LEARNING_PATH_REBUILD_SPEC.md:229-237`。AC-COV-1 只計 knowledge-point IDs：`:711`；計時模式甚至被寫成可選：`:360-362`。

**影響**

coverage gate 無法證明使用者列為最優先的英文目標，也無法保證考古題模式、錯題本、畫卡節奏、非選推導 rubric、混合題型、學習歷程等被實作。這是 false-green 路徑。

**建議修法**

- 在 inventory 增加明確的 practical/certification strands 與 minimum IDs；`exam` 改受控 enum/array，實際出現 TOEIC/TOEFL/IELTS/GEPT。
- 把 §4.x 轉成第二個 machine-readable registry，例如 `authoring/exam_capabilities.json`，每項有穩定 ID、適用 subject/tier、required artifacts、unit_ids。
- 新增 `AC-CAP-1`，要求所有 mandatory capability 都有已完成且通過對應題型/模式 gate 的單元。

### BLOCKER-06 — 單元 schema 無法支撐自己宣稱的機械生成與驗收

**證據**

- 頁面分組依 `(subject,strand,tier)`：`LEARNING_PATH_REBUILD_SPEC.md:346-351`；life ID 不含 tier：`:189-192,347`。
- 但 unit 必填欄位沒有 `tier`：`:382-388`。多知識點單元也沒有規定所有 KP 必須同 subject/strand/tier。
- AC-COV-1 要求「已完成單元」：`:711`，但 unit schema 沒有 status，規格也沒有定義完成狀態的唯一來源或 enum。
- §6.8 要每個 fact 帶 `sources[]`：`:477`，但 unit/teach/practice schema 完全沒有 sources/claims 欄位：`:383-388`。
- `zh_hint` 被描述成「每個英文 teach 段/例句可附」，但欄位列在 unit 層，teach item shape 又沒有 `zh_hint`：`:384,387`。
- `selfeval` 只寫「固定三級」，沒有 JSON shape、grade enum、SRS mapping 或歷史事件 schema：`:386`。
- 所有 practice 共用 `{type,stem,options?,answer,feedback,kp_ids[]}`，沒有依 `type` 定義 discriminated union；作文、口說、手寫推導、多選、排序、canvas 操作如何表示與驗證留給實作者自由心證。

**影響**

life 頁面無法可靠按 tier 建圖；AC-CORRECT 沒資料可讀；completion/coverage 可能各自發明；schema gate 即使存在也不知道該驗什麼。

**建議修法**

在定案前寫出正式 JSON Schema，至少新增：

- `tier`（必填）、`archetype`、`home_page` 或 deterministic assignment key、`status`/completion evidence reference。
- enforce 同一 unit 的 KP 必須同 subject/strand/tier；跨組需明確 exception 與 reason。
- teach item 內的 `zh_hint?`、`claim_ids[]`；claim registry 內的 `source_refs[]/verification_ref`。
- `selfeval:{scale:[again,good,easy], srs_store, mapping}`。
- 依 practice `type` 的判別式 schema，為 MCQ/multi-select/cloze/open-response/essay/order/canvas/listening 各自定 required fields 與 acceptance。

### BLOCKER-07 — 目前已有知識錯誤/高風險條目，不能宣稱正確性獲保證

以下不是「待實作」，而是 binding 附件本身的內容問題：

1. **中心粒與纖毛結構混為 9+2**：`KNOWLEDGE_POINT_INVENTORY.md:1839`。纖毛/鞭毛典型軸絲是 9+2；中心粒是 9 組三聯微管、無中央一對。應拆成兩條或改成精確對照。
2. **滲透定義錯用「高水位→低水位」**：`:1848`。應使用水勢/自由水分子濃度與半透膜兩側溶質濃度的精確表述；「水位」會教出錯誤模型。
3. **a/an 規則寫成依母音開頭**：`:921`。應是依下一個詞開頭的**讀音是否為母音音素**，否則 `an hour`、`a university` 會反例。
4. **情態推測階梯錯誤**：`:993` 的 `must > may > might > can't` 把 `can't` 當最低確定度；`can't` 是高確定度的否定推測，不能放在同一正向概率序列尾端。
5. **形近字清單有重複字**：`:424` 的「辨辯辯瓣」很可能應為「辨辯辮瓣」。
6. **天擇寫成「適者生存、不適者淘汰」**：`:2120` 過度目的論且容易形成貼標籤；應改為族群中可遺傳差異造成 differential survival/reproduction，並避免把「適應度」套到人的價值。
7. **有氧呼吸 ATP 寫 30–38**：`:1902` 沒有交代原核/真核、穿梭系統與教材口徑；應改成現代教材可辯護範圍並附 source，或標待核。

此外，附件有 30 個 `(待核)`，且全部目前都會落在 `beyond=false` mandatory 集。規格只禁止 shipped unit 帶待核（`LEARNING_PATH_REBUILD_SPEC.md:478`），卻沒有要求 Phase 0 先決定這些 inventory 項應為 minimum、enrich 或移除。

**建議修法**

- 對上述條目立即修正或標 structured pending。
- 每個 slice 由領域專家依權威來源逐條重審；pending 未清前不得開始 spec 5-clean。
- Phase 0 新增 inventory exit：`verification_status=pending` 數必須為 0，或 pending 全部明確排除於 minimum 並記理由。

### HIGH-01 — 四態導航與精熟沒有 deterministic state machine

**證據**

- hub 要顯示「建議先修/就緒/進行中/已精熟」：`LEARNING_PATH_REBUILD_SPEC.md:306,315-316`。
- §6.3 只說精熟由 SRS＋自評歷史決定，並存 `{srsState,selfRatings[],lastSeen,mastered}`：`:394-411`；沒有門檻、降級規則、prerequisite readiness 演算法、同時符合多狀態時的優先序。
- AC-NAV 只查可見數量與鎖定態：`:718`，不驗狀態計算正確性。

**影響**

不同實作者會對「就緒/先修/精熟」產生不同結果；建議路徑與 badge 條件也會漂移。

**建議修法**

定義純函式 `deriveUnitState(unit, progress, now)` 的完整 truth table：新單元、部分自評、SRS 到期、已精熟但先備狀態變更、直接跳學等案例；再新增狀態轉移單元測試與 AC-NAV-STATE。

### HIGH-02 — §9 的 LLM 模擬不能證明知識隔離，且 truncation 會破壞結論

**證據**

- 規格承認 LLM 無法真的忘記，只要求自行列出用了哪些 KP：`LEARNING_PATH_REBUILD_SPEC.md:647`。模型可先用隱含知識再錯誤歸因，這不是強制隔離。
- 深層 prerequisite 超限時會截斷 K_pre：`:648`，但 AC-PATH 仍要求 pass/gaps=[]：`:719-720`。被截掉的合法先備會造成假 blocker；模型內建知識又可能造成假 pass。
- burnout proxy 使用未定義的 `N`：`:646`；`med` 只需任意非空 mitigation 文字即可放行：`:620-622,634-635`，沒有驗證緩解是否真的落實。

**建議修法**

把 INV-1 主 gate 改為 deterministic static dependency check：每題明列 `required_kp_ids[]`，驗證其皆位於 prerequisite closure ∪ 本課 teach 集。LLM 只做「是否漏標 required KP」的對抗式審查，不能當證明。K_pre 不可截斷；需分批載入並合併結果。把 `N` 定成固定值，mitigation 必須有可查的 unit/sequence change reference，重跑後才可 pass。

### HIGH-03 — 「tuple 可推導單一 home page」與既有多頁保留規則衝突

**證據**

- 預設 `(subject,strand,tier)` 一頁且聲稱 home page 可機械推導、無模糊：`LEARNING_PATH_REBUILD_SPEC.md:346-351`。
- 下一條又允許同一 `(strand,tier)` 保留散在多個既有檔，不強制合檔：`:352`。
- 後面改由 `units_index.json.{file,anchor}` 作實際落點：`:462,470`，但沒有定義同 tuple 多頁時哪個 unit 分到哪一頁。

**建議修法**

裁決一個唯一模型：建議讓 source unit 明列 `home_page`（受 allowlist 與 group validator 約束），build 只彙總，不靠 tuple 猜實際檔名。tuple 僅驗證頁面分類；既有多頁時用明確 assignment registry，不允許 build 任意選第一個。

### HIGH-04 — 多個 acceptance threshold 仍模糊或互相矛盾

**證據**

- 可見節點上限寫 `≤ ~15`：`LEARNING_PATH_REBUILD_SPEC.md:335,466,718`；`~` 與 `≤` 不能同時形成確定門檻。
- 效能門檻要到 Phase 1 才量測並寫回：`:149,727,780`，但 §14 又稱所有問題已關閉、可開始收斂：`:783`。
- AC-A11Y 接受 tap target ≥44px：`:728`；`DESIGN_SPEC.md:354` 要 `--tap-min=48px`。
- R-STYLE 禁止 px 魔術數：`LEARNING_PATH_REBUILD_SPEC.md:420-422`，但 R-STYLE-3 直接要求/允許 680px 並可依卡型微調：`:425-429`。
- R9 還要求「低階裝置不卡」，卻沒有指定裝置、CPU throttle、FPS/long-task/LCP 門檻；AC-PERF 只量 JS 體積。

**建議修法**

所有門檻在 Phase 0 固定成 named constants：例如 visible nodes `<=15`；tap target 統一 48px；`--content-card-max` token；為每 archetype 定 gzip/parsed JS、LCP、long task、動畫 FPS 與測試裝置。若數值真的要在 Phase 1 才決定，就不能宣稱 spec 已無開放問題，也不能先累積定案 clean streak。

### HIGH-05 — Visual QA 仍依賴 repo 外未定案規則，AC-VIZ-1 缺可執行 schema

**證據**

- 主文件依賴 visual-QA 規則與 hook：`LEARNING_PATH_REBUILD_SPEC.md:108,725,731`。
- 外部規則檔 `/Users/hdchen/.claude/rules/visual-qa-ipad-signoff-do-not-delete.md:38` 明說完整 `VISUAL_QA_BUILD_SPEC.md` **待建**；repo 內確實不存在該檔。
- 外部規則要求 carrier/MEMORY/project hook：同檔 `:20-30`；這三者目前在 repo 找不到或未接線。
- AC-VIZ-1 只寫「harness + signoff manifest」，沒有檔名、JSON schema、畫面/frame 列舉演算法、互動狀態 coverage 算法或實際 command：`LEARNING_PATH_REBUILD_SPEC.md:725`。

**影響**

fresh clone 或不同帳號無法重現；「所有 frame」可能由每個實作者自行定義，造成假全覆蓋。

**建議修法**

在 repo 建立正式、版本化的 visual QA spec，定義 render manifest/signoff schema、viewport、deviceScaleFactor、狀態列舉來源、動畫取樣策略、命令與 exit code。外部 user-home rule 只能作提醒，不得是產品 AC 的唯一契約。

### HIGH-06 — AC-CORRECT 的 claim/source 模型不可機械驗證

**證據**

- 規格要求每個事實有 `sources[]`：`LEARNING_PATH_REBUILD_SPEC.md:475-478`，但又讓「常識/定義型」可省略：`:495`；何謂常識沒有 enum 或裁決規則。
- AC-CORRECT 要掃出「具體數值/因果宣稱」並判斷是否有來源：`:716`。自然語言掃描無法可靠識別所有 claim，也無法知道 unit-level source 支援哪一句。
- ledger schema只有 `{unit_id,reviewer_role,verdict,sources[],sha}`：`:477`，沒有 claim ID、source locator、版本/存取日期、驗證方法、reviewer identity 或獨立性證據。

**建議修法**

將可查證敘述結構化為 `claims[]`：`{claim_id,text,kind,source_refs[],verification_ref?,status}`；source 為 `{id,title,publisher,url_or_isbn,edition,locator,accessed_at}`；每個 claim 必須 verified，不使用「常識免驗」逃生口。純數學推導則以 executable verification artifact 取代來源。

### HIGH-07 — 歷史與兒少安全措辭違反規格自己的中立/零標籤原則

**證據**

- 歷史查證規則先要求多方、持平，卻同一句斷言「中國慣於竄改歷史為其政權牟利」並按來源所屬地整體排除：`LEARNING_PATH_REBUILD_SPEC.md:489`。這是未附證據的概括性政治判斷，也與 R16「多元觀點、持平、不貼標籤」：`:131` 衝突。
- 生活自保要求學生「辨識情緒不穩/可能失控的人」：`:116`，容易把心理狀態當作可由兒童診斷的危險標籤；這也與同段要求不封閉/多疑及 R16 零標籤衝突。
- R16 原則上不用明確禁令：`:131`，但火災、性剝削、個資、藥物等立即安全情境有時需要直接、清楚的保護指令；目前沒有 safety exception。

**建議修法**

- 歷史來源按可稽核品質（第一手/同儕審查/透明方法/可交叉驗證/利益衝突）評估，不按國籍一刀切；爭議敘事並列來源與證據差異。
- 把「辨識情緒不穩的人」改成辨識**可觀察行為**（威脅、逼迫、界線侵犯、突然升高衝突），避免診斷個人；加入尋求可信任成人協助。
- R16 加入 immediate-safety exception：可直接說「先離開/不要提供資訊/打 110 或 113」，但必須同時解釋原因與替代行動。

### MEDIUM-01 — 分島提前發布沒有獨立 release gate

**證據**

- Phase 3 允許一個島/一科 minimum 完整就先上線：`LEARNING_PATH_REBUILD_SPEC.md:663`。
- §11.A 的 22 AC 是全站 done gate，沒有 island-release AC，也沒定義未完成 subject 在 nav/search/roadmap 的呈現方式。

**建議修法**

新增 `AC-ISLAND-RELEASE`：該島的 KP/capability 100%、路徑模擬、visual/a11y/perf/reward regression 全過；未完成島明確標示 unavailable 但不得形成 R-OPEN 的假鎖定，或根本不發布其路由。定義 release manifest 與 rollback 範圍。

### MEDIUM-02 — 沒有單一可重現的總驗證命令與工具版本契約

**證據**

- `package.json:6-10` 只有 build；`npm test` 固定 exit 1。
- 22 個 AC 分散於 Python/Node/外部 skill/人工 signoff，未定義執行順序、統一入口、依賴版本、失敗後 ledger 是否可寫。
- `package.json:15-20` 使用開放 range（`^21.11.0`、`^5.9.3`），而規格要求可重現 build/驗收。

**建議修法**

規格新增 `npm run verify:learning-path -- --phase=<n>|--release=<id>` 的預期 pipeline；列出每個 gate 的 command、input、output、exit code、tool version，最後由 orchestrator 原子產生 acceptance ledger。固定 lockfile 與驗證工具版本。

### MEDIUM-03 — anti-vagueness lint 的通過不能支持「每條規範皆具體」宣告

**證據**

- `spec_concreteness_lint.py:44-61` 只在整個 `##` 章內找一次「細則」「範例」「❌」；章內任何一個子節滿足即可讓其他規則通過。
- 實際 lint exit 0，但本報告仍找到 `≤~15`、未定義 N、Phase 1 才決定效能值、未定義 selfeval/source schema 等。
- 主文件自己也承認細粒度 vagueness 交給 panel，而非 lint：`LEARNING_PATH_REBUILD_SPEC.md:42-55`。

**建議修法**

不要把章級 lint 描述成 anti-vagueness 的充分條件。替每條 normative rule 指派穩定 rule ID，要求 `{inputs,outputs,threshold,positive_case,negative_case,boundary_case,gate}` 完整；lint 逐 rule ID 驗證，panel 只補語意審查。

## 已確認的正面結果

以下部分目前自洽，應保留：

1. `knowledge_points.json` 的 3092 筆 ID 唯一，domain/tier/exam 聚合與 meta 一致。
2. 主文件正確區分學科 ID 與 life ID，並明訂 tier 以 manifest 欄位為準：`LEARNING_PATH_REBUILD_SPEC.md:189-204`。
3. 「宣告 KP 必須同時真教＋真考」的集合條件是好的 deterministic 基礎：`:383-389`。
4. R-OPEN 把 prerequisites 定位為建議而非門鎖，且兼顧完整目錄與漸進揭露：`:307-335`，方向清楚。
5. 對 localStorage 驅逐與跨裝置限制有誠實邊界聲明：`:512-515`；問題在於 RT-12 未正式定義/納入 AC，而不是方向錯誤。
6. Visual QA 指定雙方向 iPad viewport、http、逐 frame、四角色與 sha 綁定，概念上完整；需要的是 repo 內可執行契約。
7. TypeScript 開發、編譯後提交 JavaScript、瀏覽器零 runtime dependency 的方向與現有 `package.json`/tsconfig 一致；`TS_MIGRATION_ROADMAP.md:74` 的進度描述只是過時，不能再當現況來源。

## 建議修訂順序

1. **先修權威與 phase**：建立 precedence table；解掉 design gate 的 Phase 0/0.5 循環；更新完整 blocker 狀態。
2. **再修 inventory 管線**：structured canonical source、pending 欄位、round-trip、拆分 derived coverage；讓 `_kp_build.py --check` 真正 exit 0。
3. **修正內容 blocker 並重做 slice review**：先修本報告列出的明確錯誤，再把所有 30 個待核清零或改成明確 enrich。
4. **補齊需求 registries**：practical/cert English IDs、exam capabilities manifest 與相應 AC。
5. **定案 unit schema 與 state machine**：tier/home/status/claims/practice unions/selfeval，以及四態與 mastery 演算法。
6. **重寫 reward persistence contract**：snapshot/journal、coin ledger、reset epoch、quota 語意、正式 RT-12。
7. **把 correctness/path gates deterministic 化**：per-claim evidence、per-question required KP closure；LLM panel只當第二層，不當證明。
8. **固定所有 thresholds 與 repo-local visual QA spec**；統一 48px、visible-node 整數上限與效能 budget。
9. **建立單一 verify orchestrator**，用固定版本工具原子產 acceptance evidence。
10. 上述完成後，重新跑動工前角色模擬；任何修訂改變 sha 後，再從 round 1 開始計算 5-clean。

## 最終判定

- **是否自洽：否。** 權威、phase、reward、manifest、style/audit 門檻仍有實質矛盾。
- **是否可直接照規格實作：否。** unit schema、state machine、page assignment、claim evidence 與部分 AC 尚會迫使實作者自行決定。
- **是否能可靠驗收：否。** 現有 AC 有不可達案例，也有 mandatory scope 可漏做仍全綠的路徑。
- **是否能保證 3092 知識點正確：否。** 已抽查出明確錯誤，另有 30 個待核且 manifest 遺失其中 16 個標記。
- **目前可肯定的部分：** ID 唯一性與聚合計數正確，整體架構方向（DAG、R-OPEN、真教真考、證據綁 sha）值得保留。

**建議狀態：維持 DRAFT；阻擋 spec 5-clean 計數與產品實作，先完成上述 spec-only 修訂。**
