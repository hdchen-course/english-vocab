# 學習路徑建置計畫（BUILD PLAN）— 單一事實進度圖＋自我稽核

> **這份檔的定位**：`LEARNING_PATH_REBUILD_SPEC.md` 是「規範契約」（規則、gate、AC），很長很硬。
> 本檔是從 spec 萃取出來、**人＋機都看得懂的「做什麼、什麼順序、現在在哪、怎麼算完成」計畫圖**。
> 規範衝突以 spec 為準；本檔只負責「導航」，不新增規範。
>
> **⚠ 每次 context compact / `/clear` 後，做任何學習路徑工作前，必須重讀：本檔 ＋ `LEARNING_PATH_REBUILD_SPEC.md`。**
> 這是防止「忘了計畫就東做一個西做一個」的錨點（配 `lp-reanchor-guard` hook／SessionStart 注入／MEMORY 指標）。
>
> **即時進度看這個指令（數字由實檔現算、無法手寫假裝）**：
> ```
> /Volumes/workplace/EnglishTraining/.venv/bin/python -I tools/build_status.py          # 全站矩陣
> /Volumes/workplace/EnglishTraining/.venv/bin/python -I tools/build_status.py --domain eng
> ```

---

## 1. 這個專案在做什麼（一句話）

把現有「一頁一頁、平面連結」的 K-12 站，重構成**有先備關係（DAG）、可追蹤進度、涵蓋國小→國中會考→高中學測/分科**
的學習路徑；教學內容對齊 108 課綱與考試範圍（課綱＝**最低覆蓋下限**，深度無上限）。

- **範圍＝全站 8 個 domain**：`chi`（國語文）`eng`（英語文）`math`（數學）`sci`（自然）`soc-civ`（公民）`soc-geo`（地理）`soc-hist`（歷史）`life`（跨課綱生活/核心能力）。
- **權威母體**＝`authoring/knowledge_points.json`（3103 條 KP，其中 **binding/minimum＝3086 條**，`beyond/t_enrich` 17 條不列覆蓋門檻）。這份清單就是「該存在什麼」的 single source of truth。
- **「完成」的唯一定義**＝spec §11.A 的 **23 條 AC 全綠**＋證據登 `acceptance_ledger.json`。不接受「大致上」。

---

## 2. 現在真的在哪（2026-11-02，由 `build_status.py` 現算）

| | binding KP | 已覆蓋 | 未覆蓋 | 單元 | 已收斂頁 |
|---|---|---|---|---|---|
| **全站** | **3086** | **185（5%）** | **2901** | **250** | **0** |
| eng 英語 | 300 | 185 | 115 | 250 | 0 |
| chi 國語 | 354 | 0 | 354 | 0 | 0 |
| math 數學 | 260 | 0 | 260 | 0 | 0 |
| sci 自然 | 977 | 0 | 977 | 0 | 0 |
| soc-civ 公民 | 323 | 0 | 323 | 0 | 0 |
| soc-geo 地理 | 354 | 0 | 354 | 0 | 0 |
| soc-hist 歷史 | 134 | 0 | 134 | 0 | 0 |
| life 生活/核心 | 384 | 0 | 384 | 0 | 0 |

**白話**：路徑模型的教學內容**才做了約 5%**，而且**只有英文有單元**（250 個，仍只覆蓋英文 300 個 KP 中的 185 個、且 22 分區有 4 個 0 單元、已建分區也沒做滿）。其他 7 科在新路徑模型裡**一個單元都還沒有**（舊站的 ~100 個 legacy 頁尚未 migrate 進來）。**沒有任何一頁跑過 5-clean 收斂。**

**「兩週準備」準備的是地基，不是內容**：KP 母體 3103 條、`source_registry.json`（來源登記）、`fact_check_ledger.json`＋`verified_overlay.json`（binding KP 的事實驗證）、`acceptance_criteria.json`（23 AC registry）、`units_index/strand_labels/subject_labels/nav_index`（衍生資料）、hub `index_new.html`＋八島 CATMAP、驗證 harness（`verify_learning_path.py` ＋各 gate）。這些讓「做」與「驗」有標準，但**教學單元本身大多還沒寫**。

---

## 3. Spec 的實作階段（§10）＝做什麼、什麼順序、怎麼算過、現在狀態

> spec 有「兩套 Phase 編號」（實作里程碑 phase -1..5 vs 驗證 orchestrator phase -1/0/1/release）。
> 下表是**實作里程碑 phase**（§10），每個都有明確 **exit gate**，未過不得進下一階段。

| Phase | 做什麼 | Exit gate（過關條件） | 現在狀態 |
|---|---|---|---|
| **-1 規格/工具修訂** | 修 spec＋建驗證 harness（不碰教材） | `verify_learning_path --phase=-1` COMPLETE | ✅ 完成 |
| **0 spec 定案** | spec 跑 content_audit 連續 5-clean＋紅隊零繞過＋四防漂移錨點交付 | §12 收斂＋`AC-ANTIDRIFT` 綠 | ✅ 完成（2026-11-01 spec_converge_gate PASS、sha eec6da8c） |
| **0.5 既有不一致 remediation＋獎勵安全地基** | 全站卡片/色碼硬編統一到 token、自適應卡；獎勵壞檔不重設＋真 migrate | `design_consistency_gate` exit 0 ＋ 獎勵 RT-6 綠 | 🟡 進行中（design_consistency_gate＋style_token_lint 已建+紅隊、hub/unit/4頁已 token 化；獎勵 R1/R2/RT-6 待查） |
| **1 基盤** | KP registry＋**unit schema＋unit_schema_gate**＋凍結既有頁歸屬＋§6.7 衍生資料管線＋safe_store/migrate＋roadmap 骨架（到 tier 頁層） | `AC-SCHEMA`/`AC-NAV`/`AC-NOGRADE`/`AC-VIZ-1`(島/strand/tier)/`AC-COV-2`/`AC-REWARD-1` 綠＋衍生檔全產出 | 🟡 大致就緒（schema/衍生檔/safe_store/hub 八島都在、相關 gate 綠）；roadmap_layout 待 Phase 2 回填 |
| **2 路徑接線** | 既有單元宣告 `prerequisites`/`knowledge_point_ids`、產 `roadmap_layout.json`＋`progkey_migration.json`、舊進度 additive 搬入、逐檔 5-clean | 既有單元全接線、每檔 5-clean | 🔴 **未做**（250 英語單元 **0/250 宣告 prerequisites**、roadmap_layout/progkey_migration 不存在） |
| **3 gap 補齊** | 依 §4−§5 gap 逐 subject×strand 補單元，一次一檔、每檔 5-clean。**可發布子集**：一個島/一科 minimum 全覆蓋即可上線該島 | `AC-COV-1`（Phase 3 變體）＝未覆蓋 minimum id＝0 | 🔴 **才 5%**（2901 KP 未覆蓋；見 §2） |
| **4 獎勵擴充** | 只新增獎勵 id、不動既有 | RT-1..15 全綠＋`AC-NOBACKEND` 綠 | 🔴 未做 |
| **5 全書 audit＋知識受限模擬＋視覺 QA** | loop 到零問題 | §11.A 全 23 AC 綠＋`acceptance_ledger` 全登錄 | 🔴 未做 |

**關鍵誠實**：英語 250 單元是**較早的「英語島 communicative 單元」平行建置**，它們存在、過了部分確定性 gate，但**既沒走 Phase 2 接線（0 prerequisites）、也沒到 Phase 3 全覆蓋、更沒 5-clean 收斂**。所以即使只看英文，也遠未完成。

---

## 4. 遷移策略（strangler-fig，§10）

- 新 hub ＝ `index_new.html`（八島 CATMAP），**側建**，與 legacy `index.html` 並存。
- 待新路徑模型全綠（§11.A）後，才**改名互換**（`index_new.html`→`index.html`），不是逐頁就地改。
- 收尾含 full-history squash＋force-push，前置受 `reward_baseline_rewrite_gate` 等 fail-closed gate 保護（§10.2）。
- 目前：`index.html`（legacy）與 `index_new.html`（新）**並存、尚未互換**。

---

## 5. 「完成」怎麼算＋怎麼防「假完成」

- **唯一判準＝spec §11.A 的 23 條 AC 全 PASS**，證據綁 sha 登 `authoring/acceptance_ledger.json`。任一條 fail＝未完成。
- **防假完成的關鍵三道**（互相獨立，缺一不可，杜絕「audit 乾淨就當完成」）：
  1. **AC-COV-1 覆蓋矩陣＝100%**（未覆蓋 minimum id＝0）——內容**沒建齊**就一定紅。這道擋住「英文只做 62% 卻當完成」。
  2. **AC-UNIT-2 每頁 content_audit 連續 5-clean**——建了但**沒收斂驗證**就一定紅。
  3. **AC-UNIT-1/CORRECT/SCHEMA…** 等——每個單元品質/正確性/schema 到位。
- **自我稽核儀表板＝`tools/build_status.py`**：任何時候跑它，看「缺」與「已收斂頁<頁」是否非零；非零＝未完成。它數字由實檔現算，**無法手寫假裝**。（它是人可讀前置視圖；真正擋關仍是 `coverage_gate`／`per_page_5clean_gate`／`verify_learning_path`。）

---

## 6. 每個單元的建置 SOP（照 spec §6.2 骨架／§6.6 rubric／§6.7 註冊）

1. **動工前**（本 session）重讀本檔＋spec §6.2.2（單元內容 schema）、§6.6（10 項 rubric）、§6.7（units_index 註冊）＋該 domain 治理鐵律（英語島：語感>文法、聽寫+跟讀+語調模仿為核心、英文學英文 R14、術語附英語 R15、不教台式對比、國小情境化、共用引擎 `assets/unit.{css,js}`）。
2. **組 team（roles-first）**：writers＋6 審查鏡（native-en/linguist/learning-sci/knowledge-viz/pm/eye-comfort）＋獨立對抗 reviewer。不 solo。
3. **產出**：`<domain>_<strand/topic>.units.json`（§6.2.2 欄位齊）＋必要頁、edge-tts 真實音檔、每 KP 綁 teach+practice（rubric⑦ 真教真考）、註冊進 `units_index.json`/hub。
4. **過全確定性 gate**：`unit_schema_gate` `claim_evidence_gate` `question_correctness_gate` `scan_simplified` `r14_body_gate` `audio_exist_gate` `ia_consistency_gate` `nav_gate` `a11y_gate` `style_token_lint` `design_consistency_gate` `unit_acceptance_lint --verify` `--verify-golden` `no_grade_label_gate` `no_backend_gate`。
5. **收斂**：該頁跑 content_audit **一次一 round**（MacBook 資源有限，**絕不並發整波**）到連續 5-clean、L3 exit 0，經 `record_audit_round.sh` 誠實記 `page_converge_ledger.json`。
6. **視覺**：iPad Air 13 render＋四角色簽核綁 sha（AC-VIZ-1）。
7. 每檔完成即 commit（可 rollback）。

---

## 7. 現在該做什麼（依 spec 順序，HD 2026-11-02「先補齊」）

> 原則：先把**已開工的英語島**做完整（Phase 2 接線 + Phase 3 補齊 + 收斂），作為「一個完整島」的里程碑（spec §10 Phase 3「可發布子集」），再推其他 7 科。不要跨科亂跳。

**英語島待辦（依缺口排序；數字見 `build_status.py --domain eng`）：**
- **補 4 個 0-單元分區（63 KP）**：phonics 自然發音(20)、reading 閱讀理解(18)、writing 英文寫作(15)、listening 聽力(10)。
- **補已建但未滿分區（52 KP）**：special(缺8)、subj(缺8)、morph(缺7)、vocab(缺5)、noun(缺4)、pattern(缺4)、relcl/voice/nouncl/adjadv/modal/pron/nonfinite/prep（各缺1–2）。
- **Phase 2 接線**：250 單元補宣告 `prerequisites`/`knowledge_point_ids`、產 `roadmap_layout.json`。
- **全島覆蓋到齊＋接線後** → 一次一檔驅動 5-clean 收斂（AC-UNIT-2）。
- **英語島完整後** → 走該島 DONE-GATE（§11.A 對 eng 子集）→ 里程碑上線。

**其他 7 科（chi/math/sci/soc-*/life，2771 KP 未覆蓋）**：待英語島里程碑後，依 spec §10 Phase 2（legacy 頁接線）→ Phase 3（補 gap）逐科推進。每科動工前先讀該科治理與 KP 清單。

---

## 8. 本計畫的維護

- 進度數字**不手寫**在本檔正文的 §2 表以外；要看即時數字跑 `build_status.py`。§2 表為某日快照，過期以工具為準。
- 每完成一個分區/一科的里程碑，更新本檔 §3 狀態欄與 §7 待辦，commit。
- 本檔與 spec 衝突以 spec 為準；本檔只導航、不新增規範。
