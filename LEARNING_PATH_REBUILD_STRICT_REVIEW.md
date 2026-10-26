# 全站學習路徑重構規格——嚴格審查意見書

> 審查對象：`LEARNING_PATH_REBUILD_SPEC.md` 與其 binding 附件、相關規格及設計文件  
> 審查日期：2026-09-04  
> 審查性質：**規格審查，不把「尚未實作」當成缺陷**  
> 核心原則：教材會直接影響孩子；「看起來合理」「多個 agent 都同意」都不等於知識正確。

---

## 最新補充：第七輪 Freeze Acceptance 結果

> 這不是新的泛化審查，只驗證上一節指定的三個 freeze 修法。  
> **未開始 5-clean／正式紅隊是預期狀態，不列缺陷。** Phase 0/1 的真實資料與 gate 尚未完成也仍屬下一階段工作。

### 驗收結果

| 條件 | 結果 | 證據 |
|---|---|---|
| CF-01 Phase 0↔5-clean 循環 | **PARTIAL，只差一個粒度修正** | `--ready-for-5clean` 已建立並排除 finalization，但目前排除整個 `AC-SPEC`，連 concreteness component 一起跳過 |
| CF-02 release snapshot 綁定 | **PASS（契約前置）** | `_kp_build --root 不存在` exit 2；scanner missing file exit 1；非法 traversal release-id exit 2；metric 已接受驗 root |
| CF-03 一般 KP scope authority | **PASS** | blog＋`curriculum_scope` 被拒；official＋`curriculum_scope` 通過 |
| Critical component bootstrap | **PASS** | 刪 `AC-CORRECT.question` → bootstrap 報缺 component |
| Overlay 防偽 | **PASS** | AC-KP 先重跑 `promote_verified.py --check` |
| CLI／JSON | **PASS** | pure JSON、help 0、壞參數 2 |

### 唯一剩餘修正

`AC-SPEC` 目前整筆帶：

```json
"finalization_role": true
```

而 `--ready-for-5clean` 以 entry 為單位移除它，所以 ready check 沒有執行 `spec_concreteness_lint.py`。正確做法是把 finalization 標記放到第二個 component：

```text
AC-SPEC.concreteness                  → ready 前必跑
AC-SPEC.5clean+紅隊 ledger           → ready mode 暫時排除
```

固定紅隊應同時證明：

1. `--ready-for-5clean` 輸出有 `AC-SPEC.concreteness` 且 lint fail 時整體 FAIL；
2. 輸出沒有 `5clean+紅隊 ledger`；
3. 一般 `--phase=0` 仍要求兩個 component，未做 5-clean 時保持 PARTIAL。

### 最終裁決

**CONTRACT FREEZE 仍維持 CONDITIONAL，但只剩上述一個 component-level 修正。**

這不是要求先做 5-clean／紅隊；恰恰相反，是確保「可開始 5-clean」訊號先驗 concreteness、但不循環要求已完成 5-clean。修完並跑上述固定紅隊後，可直接標 `CONTRACT FREEZE: ACCEPTED`，不需要再送一輪泛化審查，隨即進 Phase 0 真實工作。

---

## 最終條件原始清單：CONTRACT FREEZE 驗收（非第七輪泛化審查）

> 本節只驗收第六輪宣告，不重新展開全站問題。  
> 結論：**六項主修正大致成立，但 freeze 尚有 3 個直接契約不一致；修完即可無需再審而進 Phase 0。**

### CF.1 已實錘通過

1. `--phase=X` 預設跑 evidence；`--qualify` 才跑 qualification。
2. AC-KP 會先執行 `promote_verified.py --check`；overlay 手改會被重算比對擋下。
3. Ledger 已拆 `scope_source_ids[]` 與 `fact_source_ids[]`，promotion 要求兩者皆非空。
4. High-risk pattern 已擴大，reviewer 字串會正規化去重；相同 reviewer 不算兩位。
5. `REQUIRED_COMPONENTS` 已生效；移除 `AC-CORRECT.question` 後 bootstrap 回報缺 component。
6. `--release` 無 ID exit 2；不存在 snapshot exit 1，不再退回 workspace mode。
7. `--json` stdout 可直接 JSON parse；`--help` exit 0；壞 CLI exit 2。
8. Phase 0/1/release 對未建真實 gate 均誠實 PARTIAL，沒有假綠。

實跑基準：`_kp_build --check` PASS；promotion overlay 與重算一致、verified=0；Phase -1 evidence COMPLETE；Phase 0 evidence PARTIAL 8；release 無 ID拒絕。

### CF.2 Freeze 前仍須修的 3 點

#### CF-01：Phase 0 與 spec 5-clean 形成循環

主規格宣告「Phase 0 全綠 → 重啟 5-clean」，但 Phase 0 registry 的 `AC-SPEC` evidence 已要求：

```text
spec_converge_gate.py --verify-ledger
```

亦即 Phase 0 要全綠，必須先有 5-clean ledger；但規格又說要 Phase 0 全綠後才開始 5-clean。這是不可達的時序循環。

**最小修法：**把 `AC-SPEC.5clean+紅隊 ledger` 移到獨立 `converge` phase 或 release phase；Phase 0 只驗 spec concreteness、Phase 0 真實來源與防漂移準備。流程固定為：

```text
Phase 0 evidence green → spec 5-clean → red-team → AC-SPEC green → 定案
```

#### CF-02：Release snapshot 仍混用 workspace，F6-05 尚未完全成立

Orchestrator 已把 GLOB 相對 `releases/<id>/` 展開，這部分正確；但不是所有 evidence 都真的使用該 root：

- `binding_unverified_live()` 固定讀 workspace 的 manifest／overlay，沒有接收 release root。
- `chk-manifest` 執行 workspace 的 `tools/_kp_build.py --check`。
- `_kp_build.py` 不解析 `--root`；實跑加上 `--root /definitely/not/the/release` 仍 exit 0，證明它忽略 root。
- `scan_simplified.py` 對不存在路徑只印 MISSING，仍可能 exit 0。
- `--release-id` 直接拼接 path，尚未驗 ID regex 與 resolve 後必須位於 `releases/` 之下；當 `releases/` 建立後，`..` 類 ID 可能逃逸 containment。

因此現在仍可能由 snapshot HTML、workspace manifest/overlay、workspace tools 各驗不同內容。

**最小修法：**

1. 先驗 `release-id` 僅允許安全 slug，`resolve()` 後必須是 releases root 子目錄。
2. 建 immutable release manifest，列出 source manifest／overlay／HTML/assets 的 full SHA-256。
3. 所有 evidence tool 接受並強制解析統一 `--root`；未知參數／missing input 必須 FAIL。
4. AC-KP metric 對 snapshot 內的 manifest＋overlay重算，不能固定讀 workspace。
5. 加一個「workspace A 與 snapshot B 故意不同」紅隊，證明只驗 B。

#### CF-03：一般 KP 的 scope authority policy 未被 promotion 強制

規格與 `promote_verified.py` docstring 說 scope evidence 應是官方課綱／考試說明（`official|standard`），但程式只在 high-risk 時呼叫：

```python
source_ok(..., need_official=True)
```

一般 KP 的 scope source 使用 `need_official=False`。本輪直接呼叫確認：`authority_class="blog"`＋任意非空 fingerprint 對一般 scope 會回 `(True, "")`。

這會讓非 high-risk 的數學、國文、英文、自然與社會 KP 用非權威來源證明課綱歸屬。Scope/fact 分離雖已完成，scope 的 authority gate 尚未完成。

**最小修法：**所有 `scope_source_ids` 一律要求 `authority_class in {official, standard}`；`fact_source_ids` 再依類型允許 official／standard／peer-reviewed／dictionary／textbook／independent-oracle。Promotion 與 ledger gate必須呼叫同一個 pure policy function。

### CF.3 收斂裁決

**目前 CONTRACT FREEZE：CONDITIONAL／尚未正式通過。**

這不是要求第七輪，也不是要求先完成 3079 筆資料。只需修 CF-01～03 並跑三個固定紅隊：

1. 沒有 5-clean ledger 時 Phase 0 可依正確前置定義完成，但 AC-SPEC 仍保持未完成；
2. workspace A／snapshot B 不同時，release 只驗 B，path traversal 與 missing input 被拒；
3. 一般 KP 使用 blog 作 scope evidence 必須被 promotion 拒絕。

三個 fixture 全過後，直接把 freeze 狀態改為 **ACCEPTED**，不需要再送 Kiro 做開放式審查；正式進 Phase 0。

Phase 0 的正確策略仍是：按 domain 批次建立 scope＋fact evidence，優先處理 20 pending／高風險項；不得用同一份課綱來源把 3079 筆一次 promote。DEPTH-STD 大包、兩個科學措辭、assessment versioning、ownership 與 Visual QA matrix 都留在已知 Phase 0/1 backlog，不再拿來阻擋 harness freeze。

**最終一句話：Claude 的「停止空轉、進 Phase 0」方向應採納；但先修以上三個可一次完成的 freeze acceptance defects，之後不要再審 harness。**

---

## 歷史：第六輪整體複審與收斂裁決

> 本節保留第六輪當時的判定與數據，僅供追蹤修正歷程；目前 freeze 驗收以最上方 CF 節為準。  
> 當時裁決為停止無限 harness 空轉，但仍要求先關閉五個有限契約洞再進 Phase 0。

### S6.1 結論與決策

**目前仍為 CHANGES REQUIRED／DRAFT，但下一步不是再做一輪大審查，也不是直接大量 promote 3079 筆。**

建議決策是：

1. 先做一次範圍極小的 **Phase 0 bootstrap 修補**，只關閉本節 S6-01～S6-05。
2. 修完以固定紅隊 fixtures 驗證，不再進行第七輪 open-ended harness review。
3. 隨即採 Claude 的選項 1，進入 Phase 0 真實工作：source registry、ledger validator、anti-drift、官方來源與逐 domain 核查。
4. 3079 筆不必全部人工逐筆抄來源；可用版本化 curriculum mapping／canonical fact source 繼承，但必須分開證明「屬於範圍」與「敘述本身正確」。

Claude 正確指出：source registry、各 gate 與 3079 筆 evidence 尚未建立，本身是 Phase 0/1 工作，不應被反覆包裝成新的 spec 缺陷。本輪只列出**即使那些工作做完，現有 contract 仍可能錯誤放行**的問題。

### S6.2 已確認關閉的第五輪問題

- 嚴格 CLI 已生效：`--release` 正確進 release；未知參數／phase exit 2。
- `--help` 已恢復 exit 0。
- `--json` stdout 已可由 JSON parser 直接解析；human log 在 stderr。
- Release 已 cumulative 跑 `-1→0→1→release`。
- Qualification 與 evidence command 已在 registry 分欄。
- `bootstrap_validate()` 已移出 registry，無條件執行；刪 required helper 會被抓。
- 現有 23 AC 各恰有一個 `ac_id` entry。
- `AC-CORRECT` 已列 claim/question/generator/visual/freshness/release-hash 六個 components。
- 具名 `tools/promote_verified.py` 與 `authoring/verified_overlay.json` 已存在；overlay 綁 manifest hash。
- `_kp_build.py --check`、canonical 3096、完整 JSON/Markdown equality 仍為 PASS。

目前實跑：

| 項目 | 結果 |
|---|---:|
| Phase -1 qualification | COMPLETE |
| Release evidence（無 release-id） | PARTIAL，26 項未過 |
| Pure JSON parse | PASS |
| Promotion overlay check | PASS；verified=0 |
| Binding minimum | 3079 |
| Release-grade verified | 0 |
| Pending | 20 |
| Provisional | 1 |
| Unverified | 3075 |

### S6.3 尚存的 5 個契約 BLOCKER

#### S6-01：Phase 0 執行 qualification，而不是 Phase 0 真實 evidence

Orchestrator 只有 `phase == release` 時才選 `evidence_command`；`--phase=0` 與 `--phase=1` 都一律選 qualification。

所以 Phase 0 即使未來變綠，實際代表的可能只是：

- ledger gate selftest 通過，而不是當前 ledger＋registry 通過；
- anti-drift synthetic selftest 通過，而不是四錨點在 repo 中真的 DENY/ALLOW；
- no-grade/no-backend selftest 通過，而不是目前 learner-visible site 無違規。

這與 Phase 0 描述的「pre-content 真實工作完成，才可重啟 5-clean」不一致。

**修法：**不要以「只有 release 才是 evidence」二分。建議三種執行語意：

- `--qualify-through=<phase>`：只驗 gate fixtures／壞例；
- `--phase=<phase>` 或 `--verify-through=<phase>`：對該 phase 及前置 phase 的**真實資料**跑 evidence；
- `--release --release-id=...`：對 immutable snapshot 重跑全部 evidence＋release hash。

Phase 0 的通行證必須來自真實 source/ledger/hooks/site evidence，不是 selftest。

#### S6-02：AC-KP 直接信任可手改的 overlay，沒有重跑 promotion

`binding_unverified_live()` 只檢查：

1. overlay 的 `manifest_sha` 等於當前 manifest 的前 16 位 SHA；
2. `verified_ids[]` 是否包含 binding IDs。

它沒有執行 `promote_verified.py --check`，registry 也沒有 promotion helper。只要手動把 3079 個 binding IDs 填進 overlay 並保留當前 `manifest_sha`，metric 就會得到 0；本輪以同一演算法在記憶體模擬，確實得到 `unverified=0`。

**修法：**

- AC-KP 必須直接呼叫 shared `promote()` 對 live ledger＋registry 現算，或先強制 `promote_verified.py --check` deep-equal overlay。
- `chk-promotion` 應加入不可刪 required helpers。
- 使用完整 SHA-256，不只 16 hex。
- overlay 需綁 manifest、ledger、source registry 與 promotion-code hashes；任一變更即作廢。
- `verified_ids` 必須是 promotion output，不可作為自行宣告的 authority。

#### S6-03：promotion policy 沒有區分「課綱範圍正確」與「知識內容正確」

Claude 建議用官方課綱來源 promote 3079 筆，但這會混淆兩件不同的事：

1. **scope claim**：這個知識點是否屬於某 tier／會考／學測／分科；
2. **fact claim**：知識敘述、公式、語法規則或安全步驟本身是否正確。

官方課綱通常只能證明第一項，不能證明例如滲透方向、ATP 數值、英文語法例外、CPR／火場步驟本身正確。現在 `promote_verified.py` 只要求 `source_ids[]` 可解析，沒有 `evidence_role`／locator-to-claim，也沒有要求每個 KP 同時通過 scope 與 fact evidence。

現況量測也確認 manifest/ledger 沒有 `risk_class`、`curriculum_refs`、`assessment_refs`、`scope_refs` 或 `fact_refs`。

**必修 schema：**

```json
{
  "kp_id": "...",
  "scope_evidence": [{"source_id":"...","locator":"...","supports":"tier|assessment"}],
  "fact_evidence": [{"source_id":"...","locator":"...","supports":"definition|formula|procedure"}],
  "verification_method": "source|independent_oracle|domain_review",
  "risk_class": "normal|high",
  "reviewer_ids": ["..."],
  "verified_as_of": "YYYY-MM-DD"
}
```

Release-grade verified 至少要求 scope＋fact 兩軸通過；`exam=無` 的生活能力仍需 fact/procedure evidence。高風險程序另要求官方現行 procedure source＋兩位**不同身份** reviewer。

#### S6-04：promotion 的 high-risk／reviewer 規則與主規格不一致

`promote_verified.py` 目前用 prefix 判風險：

```python
HIGH_RISK_PREFIXES = ("life.safety.", "life.sel.")
```

但主規格定義的 high risk 還包括醫療、急救、消防、法律、兒少安全；法律可能位於 `soc-civ.*`，未必符合 prefix。反之不是所有 SEL 都必然等同醫療／法律風險。

此外目前只檢查 `len(verified_by) >= 2`，沒有去重或證明獨立；同一 reviewer 重複兩次也可能通過。一般 KP 甚至沒有在 `promote()` 中要求至少一位 reviewer，source fingerprint 也只驗非空，未驗內容是否真的吻合。

**修法：**風險必須是明確資料欄位而非 ID prefix；reviewer 以 registry ID 驗身份／角色／獨立性並去重。Promotion 必須呼叫與 `ledger_schema_gate` 相同的 pure validator，而不是各自實作部分規則。

#### S6-05：release-id 尚未真正把所有 evidence 綁到 immutable release

Release mode 會把 `--release-id` 盲目附到每個 evidence command，但 registry 的 GLOB 在 orchestrator 端先展開目前 workspace。例如 AC-LANG evidence 是 `GLOB:*.html`，實際掃的是工作目錄；`scan_simplified.py` 也不理解 `--release-id`，只會把它當成額外檔案路徑，而 missing path 不一定造成 FAIL。

因此「有傳 release-id」不等於所有 AC 都在驗該 release snapshot。不同 gate 仍可能驗工作目錄 A，最後 release hash 驗 artifact B。

**修法：**先由可信 resolver 將 immutable release-id 解析成 read-only `release_root`＋manifest hash；所有 evidence GLOB 必須相對 release_root 展開，工具使用統一 `--root/--manifest` contract，不可盲目附字串。每份 evidence 記錄相同 release ID、full hash 與受驗檔案集合。

### S6.4 Bootstrap／components 的剩餘強化

F5-02 已大致關閉：required helper 刪除會被 unconditional bootstrap 抓到。但 component 語意仍未鎖定。本輪在記憶體移除 `AC-CORRECT.question` component 後，`bootstrap_validate()` 回傳 **零錯誤**。

這不必再開一輪審查，但應併入 S6-01～05 的聚焦修補：bootstrap/schema 要求 critical component set，例如：

- `AC-CORRECT={claim,question,generator,visual,freshness,release-hash}`；
- `AC-SPEC={concreteness,5clean-redteam-ledger}`；
- `AC-ANTIDRIFT={hook,carrier,rule,memory,deny-allow-redteam}`；
- `AC-LANG={source-inventory,learner-visible-release,panel}`。

同時應決定真正 SSOT：目前 registry 自稱唯一 root，§11.A 也自稱唯一完整完工定義。建議 registry 為 machine SSOT、§11.A 由 registry 生成或由 gate 比對，避免再次雙寫漂移。

### S6.5 不是契約缺陷、應直接進 Phase 0 處理的工作

下列項目仍未完成，但同意 Claude：它們是下一哩路，不是繼續硬化空殼的理由。

1. 建 `source_registry.json`＋schema、ledger schema gate、anti-drift 四錨點與真實 evidence gates。
2. 以 domain 批次建立 3079 個 minimum 的 scope/fact mappings；不是每筆手抄同一 URL。
3. 優先關閉 20 pending，尤其 7 個消防／急救／瓦斯／家具安全項目。
4. 拆解 `fraction-arithmetic`、`unit-conversion`、`common-scams` 等 DEPTH-STD 大包。
5. 修正「無氧呼吸/發酵」與平面鏡「左右相反」的限定語。
6. 將 `探究` 從 exam 制度欄拆出，建立版本化 assessment refs。
7. 建跨 domain canonical ownership。
8. 補 Visual QA 手機、200% zoom、鍵盤、VoiceOver/reduced-motion matrix。
9. 把 `≤ ~15` 與 AC-PERF 換成可機械判定門檻。

### S6.6 對 Claude 兩條路的最終選擇

**選擇「1 的修正版」：進 Phase 0 真實工作，但先用一個小型 bootstrap patch 關閉 S6-01～S6-05。**

不建議直接開始「拿課綱把 3079 筆全部 promote」，因為課綱只能證明 scope，不足以證明 facts。正確順序：

1. 修真實 evidence mode、overlay trust、雙軸 evidence、risk/reviewer policy、release-root binding。
2. 以固定 red-team fixtures 驗證上述五點。
3. 宣告 contract freeze；之後只在實作發現新繞過時 targeted fix，不再做 open-ended 第七輪。
4. 進 Phase 0，按 domain 批次完成來源與核查。
5. Phase 0 真綠後才重啟 5-clean，仍不先寫 learner content。

**第六輪最終判定：Claude 對「停止空轉」的管理判斷正確，但對「契約已完整」的技術判斷早了一步。剩餘五點是有限、可一次修完的 contract blockers；修完後就應停止迭代審查、正式推進 Phase 0。**

---

## 歷史：第五輪確認

> 本節保留第五輪當時的判定與數據，僅供追蹤修正歷程；目前結論以最上方第六輪為準。  
> 當時同樣不把未建立的 Phase 0/1 工具本身視為缺陷，而檢查 orchestration contract 是否足以證明 release。

### F5.1 判定

**仍為 CHANGES REQUIRED／DRAFT；不得開始教材內容實作，也不得開始 spec 5-clean。**

第四輪六項問題已有大幅改善：

- `argparse` 現在拒絕未知 phase／未知參數，`--release` 已成為正式 release alias。
- release mode 已 cumulative 執行 `-1→0→1→release`。
- registry 現在有 23 個唯一 `ac_id`，當前集合與 §11.A 的 23 AC 相同。
- Phase 0 已列 source registry、ledger gate 與四個 anti-drift path。
- gate command 改用 `PY`→`sys.executable`；空 GLOB 可 fail closed。
- JSON／Markdown deep equality 與 provisional status 維持正確。

實跑也確實誠實：Phase -1 COMPLETE；Phase 0/1/release 都 PARTIAL；`--release` 不再降級。

但第五輪紅隊確認：**release 累積的多數 command 是 selftest，不是對實際教材資料的驗收；registry 的自我保護又由 registry 自己決定是否執行；release-grade verified promotion 仍只有 prose、沒有可達資料流。**

### F5.2 實跑摘要

| 檢查 | 結果 |
|---|---:|
| `_kp_build.py --check` | PASS |
| `--phase=-1` | COMPLETE，exit 0 |
| `--phase=0` | PARTIAL，6 項未過 |
| `--phase=1` | cumulative PARTIAL，23 項未過 |
| `--phase=release` | cumulative PARTIAL，24 項未過 |
| `--release` alias | 正確進 release、PARTIAL，exit 1 |
| `--gates-only`／bogus phase | 正確拒絕，exit 2 |
| Registry checks | 29 |
| Registry AC entries | 23／23，當前無重複 |
| `--selftest` commands | **15** |
| Phase 1 selftest | **12／17** |
| verification status | verified 0／provisional 1／pending 20／unverified 3075 |
| binding minimum 未 verified | **3079** |

### F5.3 仍需先修的 BLOCKER

#### F5-01：release 累積的是 gate selftest，不是實際教材驗收

Cumulative 執行已修好，但 registry 的 Phase 1／release commands 多數仍是：

```text
some_gate --selftest
```

29 個 checks 中有 15 個 selftest；Phase 1 有 12／17 個只跑 selftest。這只能證明 gate 的少量 fixture 會通過，不能證明本次 units/questions/assets/render/release 已通過。

最明顯例子：

- `AC-CORRECT` 只對映 `claim_evidence_gate.py --selftest`；
- 沒有執行 `question_correctness_gate`、`generator_property_gate`、`visual_content_fidelity_gate`、`source_freshness_gate` 的真實資料模式；
- `AC-SPEC` 只跑 chapter-level concreteness lint，沒有驗 content_audit 5-clean、紅隊及 convergence ledger；
- `AC-VIZ-1`、A11Y、PERF、REWARD、PATH、CODE-DL 也主要只跑 selftest；
- 最後雖跑真實 release hash gate，前面並沒有產生完整的真實 AC evidence。

因此未來所有 selftest 加 release hash 通過，仍可能讓錯誤題目、漏簽 visual 或未完成 5-clean 的內容出貨。

**必修：**每個 gate 分成兩個不同 contract：

1. `qualification_command`：正例 PASS＋壞例 FAIL，證明 gate 本身可用；
2. `evidence_command`：以 immutable release root/ID 執行真實資料，產出綁 release hash 的 evidence。

`--phase=1` 可跑 qualification；`--release` 必須跑所有 23 AC 的 evidence commands，selftest 不得計入 release PASS。

#### F5-02：registry 自我完整性檢查可由 registry 自己刪除

`CANONICAL_AC` 的 hardcoded set 是正確方向，但三方 equality 只在 registry 中的 `chk-registry-self` 被選中時才執行。若有人從 `acceptance_criteria.json` 刪掉 `chk-registry-self`，orchestrator 就不會呼叫 `registry-coverage`，hardcoded 23-set 完全不會被使用。

同理，`chk-manifest`、`chk-source-registry`、`chk-ledger-gate`、`chk-release-artifact` 等沒有單一 `ac_id` 的 helper checks 可被刪除，而 23 AC entry set 仍可能保持完整。現在的自檢也只比 set，不驗「每個 AC 恰好一筆」、phase/kind/command policy、phase_order 或 spec 表格本身。

**必修：**在讀 registry 後、選 checks 前，orchestrator 必須**無條件**執行不可由 registry 關閉的 bootstrap validation：

- registry JSON Schema；
- 23 AC exact set＋每個恰好一次；
- required helper IDs exact set；
- canonical phase order；
- 每個 AC 的合法 phase/kind；
- spec §11.A AC set equality，或讓 §11.A 從 registry 生成。

`chk-registry-self` 不應是可刪除的普通 registry entry。

#### F5-03：release-grade `verified` promotion 仍沒有可達、可機器執行的資料流

規格新增了正確方向的 promotion prose：Phase 0 建 source registry／ledger gate，共用函式驗證後才衍生 `verified`。但目前 contract 仍自相矛盾：

- `_kp_build.py` 明文且實際「永不寫 verified」，有 ledger 只產 provisional；
- `AC-KP-VERIFY` 從 committed `knowledge_points.json.items[]` 計數；
- deep equality 又要求 committed JSON 必須等於 `_kp_build` 的輸出；
- `chk-ledger-gate` 只規劃跑 `--selftest`，沒有 promotion command；
- 未指定共用 promotion 函式的模組／輸入／輸出檔，也沒有 derived verified manifest。

因此就算未來補齊 3079 筆來源，現有資料流仍沒有合法方法讓 metric 看到 `verification_status="verified"`；若另一工具直接改 JSON，又會被 deep equality 擋下。

**必修（二選一）：**

1. `_kp_build` 在載入經完整 schema 驗證的 source registry＋ledger 後，透過共享 pure function 直接衍生 verified；或
2. 保持 canonical manifest 只含 provisional，另產 `verified_knowledge_points.json`／verification overlay，AC metric 從 overlay＋canonical hash 現算。

必須在 spec 指名模組、檔案、schema、hash binding、失效規則與 command；不能只說「generator 與 validator 共用函式」。

#### F5-04：23 AC 是名稱覆蓋，不是語意覆蓋

Registry 現在確實有 23 個 AC 名稱，這關閉了第四輪的 set 缺漏；但「一個 AC ID 對一條 command」不代表該 AC 的全部要求都被驗證。

例：

- `AC-CORRECT` 規格要求六個 correctness gate，registry 只有 claim evidence selftest；
- `AC-SPEC` 規格要求 5-clean＋紅隊，registry 只有 concreteness lint；
- `AC-ANTIDRIFT` 規格要求壞例 DENY／好例 ALLOW，registry 只有 artifact existence；
- `AC-UNIT-2` 規格要求每頁 5-clean，registry command 名稱卻是 `--mcq-cue`；
- `AC-LANG-1` 規格涵蓋 learner-visible 全站與 panel，registry 只掃 KP slices。

**必修：**registry entry 需支援 `components[]`，每個 AC 的所有 normative 子條件各有 command/evidence；再由 schema 檢查 required component set。不能只做 AC 名稱 set equality。

#### F5-05：Phase 0 anti-drift/source 條件雖列出，但驗法仍不足

`artifact-all` 已正確取代 `artifact-any`，是實質進步。但：

- 四錨點只驗「存在」，沒有執行 hook/carrier 紅隊；
- source registry 只驗檔案存在，沒有 schema/fingerprint/authority/freshness；
- ledger gate仍規劃 `--selftest`，不是對實際 ledger＋registry 執行；
- `AC-NOGRADE`／`AC-NOBACKEND` 在 Phase 0 也是 selftest，不掃現有 learner-visible site。

如果 Phase 0 的目的只是「工具已具備」，輸出應叫 qualification complete；如果它代表「可重啟 5-clean／內容安全」，就必須跑真實現況資料。

#### F5-06：CLI 已嚴格，但 machine-readable mode 還不是純 JSON

`--json --phase=-1` 可以執行並包含正確 mode，但 stdout 先印人類 log、再印 JSON、最後再印 RESULT。一般 JSON parser 無法直接讀整個 stdout。另 `--help` 因攔截所有 `SystemExit` 而回 exit 2，不符合 CLI 慣例。

這不是教材正確性核心 blocker，但在 CI 中容易造成誤解析。建議 `--json` 只輸出一個 JSON document，把 human log 放 stderr 或 JSON `checks[]`；`--help` 應 exit 0。

### F5.4 仍存在的內容／scope HIGH

1. `fraction-arithmetic`、`unit-conversion`、`common-scams` 仍違反 DEPTH-STD，不能宣稱 inventory 深掘已完成。
2. `無氧呼吸/發酵` 仍暗示兩者同義；平面鏡「左右相反」仍缺表觀／座標限制語。
3. exam schema 未版本化，`探究` 仍與正式考試名稱混在 enum。
4. 跨 domain canonical ownership 尚未定義。
5. 無 ID bullet 含 backtick 時仍可被 parser 當 prose 排除。
6. `≤ ~15` 與 AC-PERF 門檻仍不 deterministic。
7. Visual QA 子規格仍未真正納入手機、200% zoom、鍵盤、VoiceOver/reduced-motion matrix。

### F5.5 第四輪 blocker 處置狀態

| 第四輪項目 | 第五輪狀態 | 說明 |
|---|---|---|
| F4-01 CLI 靜默降級 | **CLOSED** | `--release` alias 正確；未知參數/phase exit 2 |
| F4-02 release 非 cumulative／只 selftest | **PARTIAL** | cumulative 已修；release 仍主要跑 selftest，不跑 23 AC 真實 evidence |
| F4-03 registry 非 23 AC root | **PARTIAL** | 當前 23 名稱一致；自檢可被刪、未驗 spec/語意 components |
| F4-04 Phase 0 少 source／四錨點 | **PARTIAL** | paths 已列完整；仍僅 existence/selftest，沒有真實紅隊與 schema evidence |
| F4-05 verified 無合法路徑 | **OPEN** | prose flow 已加，但沒有具名 promotion module/output，manifest dataflow 仍不可達 |
| F4-06 phases 非 cumulative | **CLOSED** | `--phase=X` 現在確實累積前置 phase |

### F5.6 建議最短修正順序

1. 先把 registry bootstrap validation 移出 registry，無條件執行 schema／23 AC／helper／phase policy。
2. 將每個 AC 拆成 qualification 與 real evidence commands；release 只採 real evidence。
3. 為 AC 定義 required semantic components，尤其 CORRECT、SPEC、ANTIDRIFT、UNIT-2、LANG。
4. 完整定義並實作可達的 verified overlay／promotion dataflow，再補 3079 筆證據。
5. Phase 0 對實際 source/ledger/hooks/site 執行，不只 existence/selftest。
6. 修純 JSON output 與 help exit code。
7. 最後關閉 DEPTH-STD、科學措辭、assessment、ownership、parser 與 Visual QA 的既有 HIGH。

**第五輪總結：第四輪的 release alias、累積 phase 與 AC 名稱集合已修好；現在剩下的是更深一層的「證明語意」問題。若 release 只累積 selftests、registry 可刪自己的自檢、AC 只有名稱沒有完整 components、verified 又沒有可達輸出，那仍不能證明最後交給孩子的教材正確。**

---

## 歷史：第四輪複審

> 本節保留第四輪當時的判定與數據，僅供追蹤修正歷程；目前結論以最上方第五輪為準。  
> 當時同樣不把未實作的 Phase 1 產物本身當缺陷，而聚焦規格矛盾、gate 繞過與 binding 正確性。

### F4.1 判定

**仍為 CHANGES REQUIRED／DRAFT；不得開始教材內容實作，也不得開始 spec 5-clean。**

第三輪六項修正已有顯著進展：

- `--phase=-1` 已解除對 Phase 1 資料的直接依賴，現在可正確 COMPLETE。
- gate 類型現在會真的執行 command，而非只看檔案存在。
- `binding_unverified` 改從 `items[]` 現算。
- `_kp_build --check` 已對完整 generated JSON／Markdown deep-equal，parse error 不再吞掉。
- 主規格統計與 schema 已更新到 3096。
- 弱 ledger 只授 `provisionally_verified`，日期改用嚴格 ISO parse。
- `acceptance_criteria.json` phase registry 已建立。

但新 registry 尚未真正代表 §11.A 的 23 AC，CLI 也能把 release 指令靜默降級成 Phase -1。這使「目前各未完成 phase 會 FAIL」只是現況，**還不是不可繞過的 release contract**。

### F4.2 第四輪實跑結果

| 命令／檢查 | 結果 |
|---|---:|
| `_kp_build.py --check` | PASS，exit 0 |
| `verify_learning_path.py --phase=-1` | COMPLETE，exit 0 |
| `verify_learning_path.py --phase=0` | PARTIAL，exit 1 |
| `verify_learning_path.py --phase=1` | PARTIAL，exit 1 |
| `verify_learning_path.py --phase=release` | PARTIAL，exit 1（release gate 尚未建） |
| `verify_learning_path.py --release` | **錯誤退回 Phase -1 COMPLETE，exit 0** |
| `verify_learning_path.py --gates-only` | **被忽略，退回 Phase -1 COMPLETE，exit 0** |
| canonical IDs | 3096 unique |
| verification status | verified 0／provisional 1／pending 20／unverified 3075 |
| binding minimum 未 release-grade verified | **3079** |
| §11.A AC | 23 |
| registry checks | 16（-1:5／0:2／1:8／release:1） |
| spec AC IDs 未直接出現在 registry | 22／23 |

### F4.3 新的／仍存在的 BLOCKER

#### F4-01：未知或舊 CLI 參數被靜默忽略，`--release` 取得 exit 0

`arg_phase()` 只尋找 `--phase=`；其他參數全部忽略。因此：

```text
verify_learning_path.py --release
→ 實際執行 --phase=-1
→ PHASE -1 COMPLETE
→ exit 0
```

這是 release automation 最危險的 fail-open：CI、文件或人只要使用舊拼法／打錯參數，就可能把「spec 衛生完成」誤當 release 通過。

**必修：**使用嚴格 `argparse`，未知參數直接 exit 2；若要支援 `--release`，它必須是 `--phase=release` 的正式 alias。輸出第一行與 machine-readable JSON 都要回報實際 mode。

#### F4-02：release phase 只跑一個 selftest，沒有驗完整 23 AC，也不累積前置 phase

registry 的 release phase 目前只有：

```json
{"id":"gate-release-hash", "command":["python3","tools/release_hash_gate.py","--selftest"]}
```

即使未來該 selftest 通過，orchestrator 也會宣告 `PHASE release COMPLETE`，但它沒有執行：

- Phase -1 canonical/spec checks；
- Phase 0 KP correctness/source/anti-drift；
- Phase 1 claim/question/schema/visual gates；
- §11.A 其餘 22 個 AC；
- 真實 release artifact 或 release ID。

`--selftest` 最多證明 gate 自己的 fixtures，不能證明本次教材 release 已通過。

**必修：**release mode 必須累積 `-1 → 0 → 1 → release` 的全部 required checks，並逐一執行 23 AC 的**實際資料模式**；selftest 是 gate qualification，不是 release evidence。release command 必須接收 immutable release path/ID/hash。

#### F4-03：`acceptance_criteria.json` 尚不是 §11.A 的機器 root of truth

registry 自稱同時驅動／交叉檢查 §11.A 23 AC，但實際只有 16 個 check，且 spec 的 23 個 AC ID 中只有 `AC-KP-VERIFY` 直接出現在 registry；其餘 22 個沒有明確 `ac_id` mapping。orchestrator 也沒有讀取 §11.A 或驗證「registry coverage＝23/23」。

此外，只要從 registry 刪掉一個 check，orchestrator 就會少跑一項，沒有 independent mandatory set 能發現；`redteam` 欄目前只是說明文字，並未執行。

**必修：**

1. 每個 §11.A AC 都必須有唯一 registry entry 或明確 `ac_ids[]` mapping。
2. 加 registry JSON Schema、唯一 ID、合法 phase/kind/command 驗證。
3. 驗證 spec AC set 與 registry AC set 完全相同；缺一項即 FAIL。
4. red-team command／fixture 必須可執行並產生 evidence，不可只放文字。
5. 若 registry 是唯一來源，§11.A 表格應由它生成；若 §11.A 是 normative root，則 verifier 必須有不可被 registry 自行刪除的 required AC set。

#### F4-04：Phase 0 宣稱驗 source registry 與四個 anti-drift 錨點，實際只驗一個 hook

registry 的 Phase 0 描述要求：

- binding minimum 全 verified；
- anti-drift 四錨點；
- KP/source registry 完成。

但 Phase 0 實際只有兩項：`AC-KP-VERIFY` metric 與 `.claude/hooks/learning-path-anti-drift.py` 存在性。沒有檢查 `source_registry.json`，也沒有 carrier、rule、memory 三個錨點。`kind=artifact-any` 的語意未來若加入四條 path，也只需任一條存在。

**必修：**改成 `artifact-all`；明列四錨點及 source registry／ledger schema。存在性仍不足，hook／carrier 必須跑壞例 DENY、好例 ALLOW。

#### F4-05：release-grade `verified` 沒有合法產生路徑，Phase 0 仍是不可達狀態

parser 的規則現在是：ledger 有資料 → `provisionally_verified`；它永遠不會輸出 `verified`。Phase 0 的 `AC-KP-VERIFY` 又要求所有 minimum 都必須是 `verified`，目前為 3079 個未通過。

規格說 release-grade verified 要等 Phase 1 的 `ledger_schema_gate + source_registry` 認定；但 Phase 0 必須先通過才能重啟 spec 5-clean／進後續階段。即使把 3079 筆證據全部補齊，現有 generator 仍只會產 provisional。

**必修：**定義唯一且可重跑的 promotion flow，例如：

1. Phase 0 先建立 source registry 與 ledger validator；
2. generator 呼叫同一 validator；
3. 僅當 source IDs、版本、reviewer、freshness、risk policy 全過時才衍生 `verified`；
4. evidence/hash 變動立即退回 provisional/unverified。

或者 Phase 0 gate直接從 ledger/live sources 計算 release-grade 狀態，不把 `verified` 寫回 canonical manifest；但不能依賴尚未允許執行的 Phase 1 gate。

#### F4-06：各 phase 不是 cumulative，可在前置 phase 失敗時單獨通過後段

`checks = [c for c in registry if c["phase"] == phase]` 只跑完全相等的 phase。理論上 `--phase=1` 可在 Phase 0 失敗時完成，release 也可在 Phase -1/0/1 失敗時完成。這與 phase 名稱代表的交付成熟度不符。

**必修：**定義 `requires` DAG 或 cumulative order。若 phase 只是「只檢查本階段開發中的 gate」，輸出不得叫整個 phase COMPLETE；另提供 `--through=<phase>` 作累積完成度判定。

### F4.4 仍需修正的 HIGH／MAJOR

以下不是「因為未來工具尚未建立」而列缺陷，而是 binding inventory／規格目前仍有的內容與契約問題：

1. `fraction-arithmetic`、`unit-conversion`、`common-scams` 仍違反 DEPTH-STD，卻仍宣稱 inventory 深掘已完成。
2. `無氧呼吸/發酵` 仍暗示兩者同義；平面鏡「左右相反」仍缺表觀／座標軸限制語。
3. exam 仍是未版本化字串，`探究` 混入正式考試 enum。
4. 跨 domain canonical ownership 尚未定義。
5. 無 ID bullet 只要含 backtick 仍可能被 parser 當 prose 排除。
6. `≤ ~15` 仍不是 deterministic threshold，AC-PERF 實際門檻仍延後決定。
7. Visual QA 子規格仍未納入主規格已承諾的手機、200% zoom、鍵盤與 VoiceOver/reduced-motion matrix。
8. registry gate command 使用環境的 `python3`，不是 orchestrator 的 `sys.executable`；CI／`.venv` 可能使用不同依賴與版本。
9. `GLOB:` 展開為空時沒有獨立錯誤；一般 gate 應宣告 `allow_empty=false`，否則可能改跑工具預設集合。

### F4.5 第三輪 blocker 處置狀態

| 第三輪項目 | 第四輪狀態 | 說明 |
|---|---|---|
| T3-01 Phase 時序死結 | **PARTIAL** | Phase -1 已拆開；但 release-grade verified 仍依賴 Phase 1，Phase 0 不可達 |
| T3-02 exists-only／cached meta | **PARTIAL** | gate 與 live metric 已修；Phase 0 anti-drift 仍只看一個 artifact，release 只跑 selftest |
| T3-03 JSON 只比筆數 | **CLOSED** | 現已完整 JSON/Markdown deep equality，parse error FAIL |
| T3-04 3092/schema 過期 | **CLOSED** | 已更新為 3096 並列 verification schema |
| T3-05 ledger 弱證據授 verified | **PARTIAL** | 已降級 provisional＋嚴格日期；完整 promotion/source/reviewer flow 未定 |
| T3-06 AC registry 缺失 | **PARTIAL** | registry 已建立，但尚未覆蓋／交叉驗證 23 AC，且 release 非 cumulative |

### F4.6 建議最短修正順序

1. 先以嚴格 CLI 阻擋 `--release`／未知參數降級。
2. 讓 release/through mode cumulative，並執行真實 23 AC，而非一個 selftest。
3. 補 registry schema 與 spec 23 AC set equality；把 red-team 變成可執行 command。
4. 修 Phase 0：source registry＋四錨點全部驗證，並建立 release-grade promotion flow。
5. 將 gate command 的 Python interpreter 與空 glob 行為釘死。
6. 完成上述後再處理 DEPTH-STD、科學措辭、assessment/ownership 與 3079 筆知識證據。
7. Phase 0 真正可達且全綠後，才開始 spec 5-clean；仍不可先寫教材內容。

**第四輪總結：第三輪指出的 deep equality、舊統計與明顯假綠已修好；目前最高風險已轉移到 release orchestration。只要 `--release` 能退回 Phase -1、release 不累積 23 AC、registry 可自行刪 check、verified 又不可合法產生，就還不能把這套流程稱為 fail-closed。**

---

## 歷史：第三輪複審

> 本節保留第三輪當時的判定與數據，僅供追蹤修正歷程；目前結論以最上方第四輪為準。  
> 當時同樣區分：未來 Phase 1 工具尚未實作本身不是缺陷；只有規格矛盾、驗證可繞過或 binding 知識錯誤才列 blocker。

### T3.1 判定

**仍為 CHANGES REQUIRED／DRAFT；尚不可開始教材內容實作，也不可重啟 5-clean。**

這輪有兩項重要進步已經實錘：

1. binding Markdown 已改由 slices 同源生成，目前 Markdown／JSON 都是 3096 個唯一 ID，逐筆 `id/title/tier/exam/verification_status` 比對為 **0 mismatch**；舊 `first-aid`、濕毛巾／往下逃、舊 CPR、舊滲透與舊 CRC 文字已從 binding inventory 消失。
2. `verify_learning_path.py --phase=-1` 不再假報 `ALL GREEN`；目前正確回報 `PARTIAL`、exit 1，列出 10 個未建 gate 與 3078 個未 verified minimum。

但「目前會誠實顯示 PARTIAL」不等於 verifier 已 fail-closed。其完成判斷仍存在可直接繞過的設計，且 Phase 定義彼此衝突。

### T3.2 機械驗證摘要

| 檢查 | 第三輪結果 |
|---|---:|
| slice 解析／唯一 ID | 3096／3096 |
| generated Markdown／JSON ID 集合 | 完全相同 |
| Markdown ↔ JSON `id/title/tier/exam/status` | mismatch 0 |
| 舊危險字串／舊 `first-aid` | 0 |
| `_kp_build.py --check` | exit 0 |
| `verify_learning_path.py --phase=-1` | `PARTIAL`, exit 1 |
| verified／pending／unverified | 1／20／3075 |
| binding minimum 未 verified | **3078** |
| enrichment | 17 |
| 分科英文 | 0 |
| §11.A AC 數 | 23；已含 `AC-KP-VERIFY` |
| source registry | 尚未建立（規格排 Phase 1） |
| correctness gate files | 尚未建立（規格排 Phase 1） |
| Visual QA 手機/A11y matrix | 主規格提到；子規格尚未寫入 |

### T3.3 仍需先修的 BLOCKER

#### T3-01：Phase -1 驗證器要求 Phase 1 產物，形成時序死結

主規格 §0.5 現在定義：

- Phase -1 只需 canonical inventory 一致、correctness AC 已定義、Visual QA 草稿入 repo；
- `claim/question/generator/visual/source/release` gates、render harness、source registry 與完整 KP 驗證屬 Phase 0／Phase 1；
- Phase -1 完成後才能重啟 spec 5-clean，R7 又要求 spec 定案後才進實作。

但 `verify_learning_path.py --phase=-1` 把 `coverage_gate.py`、`unit_schema_gate.py` 及八個 correctness/ledger gate 都列為 `REQUIRED_FILES`，並要求 3078 個 minimum 全部 verified 才會宣告 Phase -1 complete。部分 gate 又必須等 Phase 1 的 units/questions/assets 存在才能運作。

因此目前流程是：**要完成 Phase -1，先要完成 Phase 1 工具／資料；但要進 Phase 1，又必須先完成 spec 定案。**

**修法：**建立明確 mode registry：

- `--phase=-1`：只驗 canonical 產物、spec contract、Visual QA 草稿與本階段工具；
- `--phase=0` 或 `--pre-content`：驗 KP/source registry、pending/unverified、anti-drift；
- `--phase=1`：驗 schema 與 gate fixtures；
- `--release`：驗完整 23 AC、內容 SHA 與部署產物。

每個 mode 的 requirements 只能依賴該階段已允許產生的資料。

#### T3-02：總驗證器只檢查 gate「檔案存在」，完全沒有執行它們

`verify_learning_path.py` 對十個 required gate 使用 `p.exists()`；只要放十個空檔案，就會被視為「有」。它不檢查 executable、不執行、不驗 exit code，也不要求紅隊 fixture。

同時它直接相信 committed manifest 的 `meta.binding_unverified`。若該 cached 數字被改成 0，完成判斷不會從 `items[]` 重算。

這兩者組合後，未來可以用「十個空檔＋meta=0」得到 `PHASE -1 COMPLETE`，即使所有 item 仍是 unverified。

**修法：**required gate registry 必須記實際 command，逐一執行並驗證壞例 FAIL／好例 PASS；`binding_unverified` 必須從當次 parser 結果或 `items[]` 現算，不能信任 cached meta。

#### T3-03：JSON 的「同源」檢查只比較筆數，欄位被竄改仍可 PASS

`_kp_build.py --check` 對 Markdown 做完整字串比對，這部分已修好；但對 committed JSON 只做：

```python
if len(committed) != len(rows): ...
```

它沒有比較任何 row 欄位或 meta，JSON parse exception 還被空 `except: pass` 吞掉。因此只改某筆 `title_zh/tier/exam/verification_status/authority_refs`、或只竄改 `meta.binding_unverified`，只要陣列長度仍為 3096，`_kp_build --check` 就可能 exit 0。

**修法：**以 canonical serialization 或逐欄位 deep equality 比較完整 generated JSON；解析失敗必須 FAIL；meta 必須由 rows 重算並比較。加入「同筆數但改一欄」與「meta 歸零」紅隊 fixture。

#### T3-04：主規格仍宣稱 3092，且 manifest schema 已過期

目前真實 canonical 數量是 3096，但主規格仍多處寫：

- 附錄已完成 3092；
- 總計 3092、life 381、soc-civ 322；
- `knowledge_points.json count=3092`；
- manifest 欄位只列舊 schema，漏掉 `verification_status/verification_note/authority_refs/verified_as_of/verified_by` 與新 meta。

這會讓未來實作者依 normative spec 得到與 canonical artifact 不同的分母與 schema；目前的章級 concreteness lint 仍會 PASS，證明它不能抓事實陳舊。

**修法：**spec 統計不得手寫；由 generator 注入或 gate 比對。更新為 3096，並將 manifest 正式 schema 與實際輸出同步。

#### T3-05：ledger 首版檢查仍不足以授予 `verified`

本輪 `_kp_build.py` 已新增空 sources、空 reviewer、未知 ID、未來日檢查，是正面進步；而本次 machine clock 實際為 `2026-10-26 CST`，所以 ledger 的 `2026-10-26` 在該執行環境下**不是未來日期**，第二輪此部分應修正為已釐清。

但目前任何符合以下最低外形的任意字串仍能取得 verified：

- `sources:["x"]`
- `verified_by:["x"]`
- `verified_as_of:"0000"`

日期只做字串大小比較，沒有 ISO date parse；也沒有 source ID 存在性、authority class、內容 fingerprint、reviewer 身份／獨立性或 high-risk 兩人要求。完整 schema 雖排到 Phase 1，但 **`_kp_build` 現在已會根據這個弱檢查授予 verified**。

**修法：**在正式 source registry／ledger gate 完成前，parser 不應授予 release-grade `verified`；可用 `provisionally_verified`，或讓 AC gate 重新驗證完整證據後才視為 verified。驗證時鐘也應明確注入／記錄，避免 IDE 日期與 machine clock 不一致造成不可重現結果。

#### T3-06：AC 已補進矩陣，但 completeness orchestrator 尚未由 AC registry 驅動

`AC-KP-VERIFY` 與強化版 `AC-CORRECT` 已正式進入 §11.A，這關閉了第二輪「只存在 prose」的主要問題。

然而 `verify_learning_path.py` 仍自行維護十個檔名，沒有從 23 AC 的機器可讀 registry 取得 command、phase、inputs、evidence schema 與 completion rule。結果已出現 `coverage_gate` 被錯放 Phase -1 的漂移。

**修法：**建立單一 `acceptance_criteria.json`（或等價 registry），每項至少有 `ac_id/phase/command/required_inputs/evidence_path/red_team_command`；spec 表格與 orchestrator 都由它生成或交叉檢查。

### T3.4 仍為 HIGH／MAJOR，但不是「缺未來程式」

1. **DEPTH-STD 尚未達成：**`fraction-arithmetic`、`unit-conversion`、`common-scams` 仍將多個可獨立教考的技能放在單一 ID；附錄不能同時宣稱已完成深掘。
2. **科學文字仍需修正：**`無氧呼吸/發酵` 仍暗示兩者同義；平面鏡「左右相反」仍缺「表觀左右互換／鏡面實際反轉前後方向」的限制語。
3. **跨 domain ownership 未定義：**仍無 `canonical_kp_id/related_kp_ids/ownership`。
4. **assessment schema 未版本化：**`探究` 仍與正式考試名稱混在 `exam` enum。
5. **無 ID bullet gate 仍可被 backtick 繞過：**任何含 inline code 的 bullet 都被當 prose 排除。
6. **`≤ ~15` 仍不是 deterministic 門檻；AC-PERF 的實際基準仍待 Phase 1 才決定。**
7. **Visual QA 子規格仍只有 iPad：**主規格已承諾 Phase 1 補 390/375px、200% zoom、鍵盤、VoiceOver/reduced-motion，但 `VISUAL_QA_BUILD_SPEC.md` 尚未反映；實作前必須同步，避免只讀子規格的人漏做。
8. **opaque ID 決策可接受但需一致化：**主規格已明確廢除「第二段＝現行 tier」，因此 40 個 mismatch 不再是資料錯誤；但 `_kp_build.py` docstring／`ID_RE` 註解仍稱 `<domain>.<tier>...`，需改成 historical tier slug，且未來程式不得解析 ID 判 tier。

### T3.5 第二輪 blocker 處置狀態

| 第二輪項目 | 第三輪狀態 | 說明 |
|---|---|---|
| R2-01 binding 分裂 | **PARTIAL／目前資料已同步** | 當前 MD/JSON 0 mismatch；JSON check 只比筆數，回歸仍可漏放 |
| R2-02 假報 ALL GREEN | **PARTIAL／目前輸出已修** | 現在 PARTIAL exit 1；但空 gate＋cached meta 仍可繞過 |
| R2-03 unverified 繞過 | **PARTIAL** | `AC-KP-VERIFY` 已加入；實際 gate 未建，現有 3078 未驗證 |
| R2-04 ledger 弱驗證 | **PARTIAL** | 首版檢查已加；完整來源、日期與 reviewer schema 仍缺；未來日期疑慮依 machine clock 已釐清 |
| R2-05 ID-tier 契約 | **CLOSED（採 opaque ID 決策）** | 主規格已明確 tier 只讀 manifest；需更新工具註解並防實作誤解析 |
| R2-06 四層 correctness 未入 AC | **CLOSED（規格層）** | 已強化 `AC-CORRECT` 並列六個 gate；實作與紅隊屬後續工作 |
| R2-07 Source Registry | **ACCEPTED／待 Phase 1** | 缺檔本身不列 spec 缺陷；正式 schema 仍應在動工前固定 |
| R2-08 Visual/anti-drift 相位 | **PARTIAL** | 主規格有排程，但 `--phase=-1` requirements 仍與排程衝突，子規格也未同步 matrix |

### T3.6 建議最短修正順序

1. 先修 Phase/mode 定義，解除 Phase -1 ↔ Phase 1 死結。
2. 將 verifier 從 `exists()` 改成真正執行 gate，並從 live rows 重算 verification 狀態。
3. 讓 `_kp_build --check` deep-compare 完整 JSON，加入同筆數竄改紅隊。
4. 更新主規格的 3092 舊統計與 manifest schema。
5. 在 parser 授予 verified 前，完成可機械驗的 ledger/source schema；或先使用 provisional 狀態。
6. 以機器可讀 AC registry 統一 §11.A、phase 與 orchestrator。
7. 拆解 DEPTH-STD 大包、修正兩個科學措辭，再處理 20 pending／3058 unverified。
8. 上述規格 blocker 關閉後，才重啟 spec 5-clean；教材內容仍不得先行。

**第三輪總結：前輪最危險的舊教材內容已從 binding inventory 移除，且工具現在會誠實說「尚未完成」；但 completion 判斷仍不是不可繞過。下一步不是開始教材，而是先修 verifier 的執行語意、Phase 時序與完整 JSON equality。**

---

## 歷史：第二輪複審（2026-09-04）

> 本節保留第二輪當時的判定與數據，僅供追蹤修正歷程；目前結論以最上方第三輪為準。  
> 當時複審範圍：主規格、binding inventory、manifest、slice、fact-check ledger、Visual QA 規格及 validator。

### 0.1 判定

**仍為 CHANGES REQUIRED／DRAFT。不可開始教材實作，也不可重啟 5-clean。**

第二輪確認已有明顯進步：pending parser 不再直接吞掉尾端標記、分科英文已清零、加入 17 個 enrichment、SSOT 優先序已補、主要錯誤在 slice／JSON 中多數已改寫，也新增 Visual QA 草稿、四層證據概念與單一驗證入口。

但目前最危險的問題變成：**機器會顯示 `ALL GREEN`，同時 binding 教材母體仍互相矛盾且絕大多數未驗證。** 這是 fail-open，不可把目前綠燈解讀為「知識已正確」。

### 0.2 第二輪機械結果

| 檢查 | 目前結果 | 判定 |
|---|---:|---|
| slice／JSON 唯一 ID | 3096／3096 | PASS |
| JSON `src+line` 精確指回 slice ID | 3096／3096 | PASS |
| `_kp_build.py --check` | exit 0 | **只代表有限格式檢查通過** |
| `verify_learning_path.py --phase=-1` | `ALL GREEN`, exit 0 | **假綠；見 R2-02** |
| verification status | verified 1／pending 20／unverified 3075 | BLOCKER |
| binding minimum 尚未 verified | **3078**（20 pending＋3058 unverified） | BLOCKER |
| `t_enrich`／`beyond=true` | 17／17 | 有改善，但分類證據未完成 |
| 分科英文／裸「分科」 | 0／0 | PASS |
| 學科 ID 內 tier 與 manifest tier 不一致 | **40** | BLOCKER |
| binding Markdown inventory | 3092 IDs | 與 JSON 3096 不一致 |
| Markdown 缺少／多出 ID | 缺 5、新增前舊 ID 多 1 | BLOCKER |
| Markdown 與 JSON 同 ID 但 title 不同 | **41** | BLOCKER |
| anti-drift 四錨點 | 仍缺 carrier、memory 與 learning-path hook | OPEN |
| Visual QA | DRAFT；harness/signoff gate/hook 未建 | OPEN |

### 0.3 第二輪 BLOCKER

#### R2-01：兩份 binding 知識母體分裂，Markdown 仍含舊錯誤與危險口訣

主規格 §0.4／§4 同時把 `authoring/KNOWLEDGE_POINT_INVENTORY.md` 與 `authoring/knowledge_points.json` 納入 binding，但兩者目前不是同一內容：

- Markdown 仍是 **3092** 條，JSON／slice 已是 **3096** 條。
- Markdown 缺少 5 個新 ID：`bleeding`、`burn`、`choking`、`sunk-cost`、`crc-principles`。
- Markdown 仍保留已被拆除的 `life.safety.emergency.first-aid`。
- 共有 **41 個同 ID title 不一致**。
- 最嚴重的是 Markdown 仍保留第一輪已判定不可直接教的舊文字：
  - fire escape 仍寫「濕毛巾、往下逃」；
  - gas 仍讓孩子「開窗、關閥」；
  - CPR/AED 仍簡化為「撥119→壓胸→取AED」；
  - osmosis 仍寫「高水位往低水位」；
  - CRC 仍把四類權利叫四大原則；
  - probability ladder 仍把 `can't` 放在正向機率序列末端。

因此 B-05／B-06 **不能標為完成**：修正只進了 slice／JSON，卻沒有進入主規格明示 binding 的 Markdown。

**必修：**只保留一個 canonical authoring source，其餘全部機器生成；新增逐 ID 比對 gate，至少比較 `id/title/tier/exam/beyond/verification_status`，不一致即 exit non-zero。`--check` 必須同時驗證 committed JSON 與 generated Markdown，不得只解析 slice。

#### R2-02：`verify_learning_path --phase=-1` 在未達 Phase -1 DONE 時回報 ALL GREEN

實跑結果為 exit 0／`ALL GREEN`，但同一快照有：

- 20 個 binding minimum pending；
- 3058 個 binding minimum unverified；
- Phase -1 表格第 ④、⑧ 仍是黃色；
- `kp_pending_gate`、四層 correctness gates、Visual QA gate、anti-drift 錨點均未完成；
- 主規格自己又規定 Phase -1 DONE 必須 `binding pending=0` 且 ①–⑧ 全綠。

`verify_learning_path.py` 把上述 gate 放進 `PLANNED`，明文「不計入成敗」，最後仍印 `ALL GREEN`。這與 fail-closed 原則相反，會讓實作者誤以為已可重啟 5-clean。

**必修：**

1. `--phase=-1` 必須實際解析 phase，要求 Phase -1 的每一項；必要 gate 缺檔就 FAIL。
2. 有未執行／待建項時只能回報 `PARTIAL`，禁止字樣 `ALL GREEN`。
3. `--release` 才跑完整 §11.A，任一必要 AC 無 gate、無證據或 SHA 過期皆 FAIL。
4. validator 的通過集合必須由一份機器可讀 registry 定義，不能在 Python、spec 表格與 prose 各維護一份。

#### R2-03：`pending=0` 仍可讓 3058 個 `unverified` minimum 直接通過

新 parser 將無 `(待核)` 標記的項目設為 `unverified`，這是誠實的；但主規格與 planned gate 只要求 `pending=0`。因此只要拿掉 `(待核)`，項目就從 pending 變 unverified，仍能繞過 gate。§11.A 也沒有 `AC-KP-VERIFY`；§0.5 自己寫著「待入 §11.A」。

目前 3096 條只有 **1 條 verified**，並非「其餘 3075 條都已正確」。

**必修：**所有 non-beyond／binding minimum 在定案或發布前必須 `verification_status=verified`；`pending` 與 `unverified` 都要擋。若不打算逐 KP 做同等深度查核，可讓多個 KP 繼承經版本化的 curriculum/source mapping，但不能以「沒有待核字樣」代替驗證。

#### R2-04：fact-check ledger 可用任意非空物件取得 verified，且唯一紀錄是未來日期

`_kp_build.py` 現在採 `if led: vstatus="verified"`。它沒有驗證：

- `sources` 是否存在、非空、可取回；
- reviewer 數量、身份或獨立性；
- `verified_as_of` 格式、是否晚於今天；
- high-risk 是否為官方現行來源＋兩位獨立 reviewer；
- ledger key 是否真的存在於 manifest；
- ledger 缺檔時是否應 fail（目前缺檔會當空 ledger 繼續）。

唯一 verified 項目的日期是 **2026-10-26**，但本次環境日期是 **2026-09-04**；主規格另有 37 處同一未來日期。未來日期不能構成已完成證據。

**必修：**為 ledger 建 JSON Schema 與 semantic gate；未來日期、空來源、空 reviewer、未知 ID、過期來源或 high-risk reviewer 不足均 FAIL。日期使用實際產生時間，不得預填。

#### R2-05：學科穩定 ID 與重新分類後 tier 自相矛盾

主規格 §4 規定學科 ID 第二段就是 tier，例如 `eng.t_sub...`；但重新分類只改 manifest `tier`，沒有處理 ID。現在有 **40 個學科 ID-tier mismatch**，包括 17 個 enrichment 及 23 個英文 `t_sub`→`t_adv` 項目。

這會使 prefix 查詢、報表、coverage 與人工閱讀得到不同答案。主規格同時說「第 2 段＝tier」「ID 不改」「tier 不得從 ID 推斷」，三者不能同時成立。

**必修（二選一）：**

1. tier 是 ID 語意的一部分：更名並提供 alias/migration table；或
2. ID 永久 opaque：正式廢除「第二段＝tier」契約，禁止任何程式依 prefix 解讀 tier。

在選定前，B-03/H-03 只能算部分修正。

#### R2-06：四層 correctness 目前只是 prose，沒有進入唯一 DONE-GATE

§6.8.1 已加入 claim／question／visual／source 與獨立 oracle，方向正確；但 §11.A 宣稱是「唯一且完整的完工定義」，其 `AC-CORRECT` 仍是舊三部 unit-level 驗證，沒有強制：

- KP 必須 verified；
- 每個 claim 的 source mapping；
- 每題唯一正解與 distractor rationale；
- visual claim fidelity；
- source freshness；
- release hash＝reviewed hash。

`claim_evidence_gate`、`question_correctness_gate`、`generator_property_gate`、`visual_content_fidelity_gate`、`source_freshness_gate`、`release_hash_gate` 只出現在 prose／roadmap，沒有對應 AC，也全部尚不存在。因此照目前 §11.A 全過，仍可能「審 A、部署 B」或題目 feedback 與答案不一致。

**必修：**把這些條件直接併入 `AC-CORRECT` 的門檻與證據產物，或各自新增 AC；在 Phase 1 動工前先提交正式 JSON Schema、source registry schema 與壞例 fixture，避免工程師自行解讀 prose。

#### R2-07：沒有真正的 Source Registry

目前 ledger 的 `sources` 只是自然語言字串。沒有 `source_id/publisher/url-or-ISBN/edition/version/locator/accessed_at/authority_class/content_fingerprint/recheck_after`，也無法驗證「同上」指向何處。重分類報告多數只列入口頁或 agent 判斷，未形成逐 KP 可重現證據。

**必修：**建立獨立 `source_registry.json`；ledger 僅引用 source IDs。課綱／考試對映至少記正式文件版本與章節／頁碼；安全、醫療、法律資料另設 freshness deadline。

#### R2-08：Visual QA 與 anti-drift 仍未完成，且手機驗收缺席

`VISUAL_QA_BUILD_SPEC.md` 已建立，但仍是 DRAFT，且只把 iPad 1366×1024／1024×1366 稱為「唯一基準」。主規格宣稱手機相容，卻沒有 390px/375px viewport、200% zoom、鍵盤、VoiceOver／screen-reader semantics 的硬性 Visual/A11y 驗收。render harness、signoff gate、guard hook、holes ledger 仍待建；目前 `.claude/settings.json` 也沒有 learning-path anti-drift hook，carrier 與 memory 錨點仍缺。

§0.5 一面說 ①–⑧ 全綠才完成 Phase -1，一面又說 Visual QA 待建項「不卡本主 spec 交付」，兩者矛盾。

**必修：**明確決定 Visual QA 是 Phase -1 blocker 還是 Phase 1 deliverable；不可兩種說法並存。把手機與可及性 viewport／互動矩陣加入 repo-local 契約。

### 0.4 仍存在的 HIGH／MAJOR

1. **DEPTH-STD 仍違反：**`fraction-arithmetic`、`unit-conversion`、`common-scams` 等仍是一個 ID 包多項可獨立出題的技能。
2. **跨 domain ownership 未落地：**manifest/spec 仍沒有 `canonical_kp_id/related_kp_ids/ownership`。
3. **exam 只完成字串 allowlist：**分科英文已清掉是正面成果，但 schema 仍未版本化；`探究` 被放在 exam enum，混合「考試制度」與「能力類型」。
4. **format gate 可繞過：**`_kp_build.py` 對任何含 backtick 的無 ID bullet 一律當 prose 排除；真正的知識 bullet 只要含 inline code 即可能漏檢。
5. **導航門檻仍模糊：**`≤ ~15` 仍不是 deterministic threshold。
6. **效能門檻仍延後：**`AC-PERF-1` 的實際基準值要到 Phase 1 才填，但 §14 又宣稱所有問題已關閉。
7. **科學表述仍需修：**`sci.t_adv.bio-respiration.fermentation` 仍以「無氧呼吸/發酵」並列，會暗示兩者同義；平面鏡「左右相反」也應至少限定為觀察者感受到的左右互換，而非鏡面真的反轉左右軸。

### 0.5 原 blocker 複審狀態

| 第一輪 blocker | 第二輪狀態 | 說明 |
|---|---|---|
| B-01 pending 被吞 | **PARTIAL** | parser 已抓 trailing pending；但不比較 committed JSON／binding Markdown，不能稱完整 round-trip |
| B-02 母體未核定 | **OPEN** | 20 pending＋3058 unverified minimum；無 `AC-KP-VERIFY` |
| B-03 全部 minimum | **PARTIAL** | 已有 17 enrich；分類證據與 40 個 ID-tier mismatch 未解 |
| B-04 exam 錯置 | **PARTIAL** | 分科英文／裸分科已清零；仍是未版本化字串且含 `探究` |
| B-05 明確錯誤 | **OPEN** | slice/JSON 多數已修；binding Markdown 仍保留 41 個舊 title |
| B-06 安全內容 | **OPEN** | 新稿保守 pending 是對的；binding Markdown 仍是舊危險口訣，官方複核未完成 |
| B-07 unit 級證據不足 | **OPEN** | 四層模型僅 prose；ledger/schema/AC 未落地 |
| B-08 錯公式自證 | **PARTIAL** | 獨立 oracle 已寫入規格；gate、fixture 與 DONE 綁定仍缺 |
| B-09 多 SSOT 衝突 | **CLOSED（文件層）** | precedence 與 banner 已加入；需維持由 gate 防回歸 |
| B-10 Visual/anti-drift | **OPEN** | repo-local 草稿存在，但關鍵 gate、hook、錨點與手機矩陣未完成 |

### 0.6 建議的最短修正順序

1. 先確立 canonical inventory，重新生成 Markdown＋JSON，讓 41 個舊錯誤文字消失。
2. 讓 `verify_learning_path --phase=-1` 對缺 gate／pending／unverified／binding divergence fail closed。
3. 補 `AC-KP-VERIFY`，定義 `verified` 的不可繞過 schema；修正未來日期。
4. 解決 40 個 ID-tier mismatch，加入 domain/category/tier 一致性 gate。
5. 建 source registry，將課綱與高風險內容證據定位到版本＋章節／頁碼。
6. 把四層 correctness gates 正式綁進 §11.A，而不是只列 roadmap。
7. 由台灣現行官方來源＋兩位獨立 reviewer 關閉 7 個安全／急救 pending；未完成前不得發布相關內容。
8. 補 Visual QA／anti-drift／手機與可及性契約，再開始 spec 5-clean。

**第二輪最終判定：修正方向正確，但目前不只「還有 20 pending」；真正 blocker 是 binding 資料分裂與驗證器假綠。這兩項若不先修，即使後續顯示 0 pending 或 5-clean，也不能證明教材正確。**

---

## 1. 第一輪結論（修正前歷史基線）

**目前判定：CHANGES REQUIRED。`LEARNING_PATH_REBUILD_SPEC.md` 應維持 DRAFT，不應開始教材內容實作，也不應開始計算 5-clean streak。**

整體方向很好：知識點清單驅動、先備 DAG、真教真考、證據綁定內容雜湊、R-OPEN 不鎖內容、視覺 QA、獎勵資料不破壞，以及分階段交付，都是值得保留的設計。

但目前仍有會讓錯誤知識進入產品的阻斷問題：

1. 64 個待核知識點中，**37 個待核狀態被 manifest 生成器靜默丟失**。
2. 3092 個知識點全部是 `beyond=false`；多個疑似大學入門或非現行考綱內容也被強制當 minimum。
3. 考試標籤有制度性錯置，包括 26 個不存在的「分科英文」標籤。
4. binding 知識點中已發現明確錯字、科學迷思、過度簡化，以及可能造成危險行為的消防／急救內容。
5. §6.8 的正確性 ledger 只綁到 unit，沒有綁到每一個事實 claim、每一道題、每個正解、每張圖。
6. 「程式跑出同一答案」只能證明程式自洽，不能證明公式、前提或題目本身正確。
7. 多份文件同時宣稱自己是唯一／最終規格，且對 hard gate、年段顯示、進階 XP、卡片寬度與 audit 次數給出相反要求。
8. 正式 Visual QA 規格、anti-drift 錨點及多個 gate 尚不存在；這些尚未實作本身不是缺陷，但主規格錯誤宣稱定案 blocker 只剩兩項。

**不能用一次審閱「絕對保證」3092 條與未來所有教材永遠無錯；可做到的最強保證，是建立一個 fail-closed、逐 claim 可追溯、來源版本化、可重跑、部署產物與簽核內容一致的流程。** 本報告第 6 節給出可直接納入 spec 的制度。

---

## 2. 已機械驗證的結果

### 2.1 正面結果

| 檢查 | 結果 |
|---|---:|
| JSON item 數 | 3092 |
| `meta.count` | 3092 |
| 唯一 ID | 3092／3092，無重複 |
| Markdown 附錄 ID | 3092／3092，無重複 |
| Markdown ↔ JSON ID 集合 | 完全相同，缺漏 0 |
| `src` 檔存在 | 3092／3092 |
| `src` + `line` 精確指回相同 ID | 3092／3092 |
| `beyond == (tier == t_enrich)` | 形式上全部一致 |
| binding JSON 與臨時重新生成結果 | byte-equivalent |
| `spec_concreteness_lint.py` | exit 0 |
| `status="todo"`／`unit_ids=[]` | 3092／3092；符合「尚未實作」，不列缺陷 |

### 2.2 紅燈結果

| 檢查 | 結果 |
|---|---:|
| slice 中含 `(待核)` 的 KP | **64** |
| manifest 中仍看得到 `(待核)` | **27** |
| 被 parser 靜默遺失的待核狀態 | **37** |
| `t_enrich`／`beyond=true` | **0** |
| `_kp_build.py --check` | **exit 1**；19 個說明 bullet 被誤判 |
| 正式 `VISUAL_QA_BUILD_SPEC.md` | 不存在 |
| `fact_check_ledger.json` | 不存在（未來產物） |
| `acceptance_ledger.json` | 不存在（未來產物） |
| `coverage_gate.py`、`unit_schema_gate.py`、`unit_acceptance_lint.py`、`nav_gate.mjs` | 不存在（未來產物） |
| anti-drift carrier／memory 錨點 | repo 內不存在 |
| `npm test` | 目前固定失敗，沒有總驗證入口 |

---

## 3. 定案前 BLOCKER

### B-01：37 個待核狀態被 manifest 生成器靜默丟失

`tools/_kp_build.py` 的 parser 只保存 `{tier, exam}` 之前的 title 與大括號內 metadata；寫在 `}` 後面的 `(待核)` 被 `.*$` 吃掉。

實際結果：來源 slice 有 64 個待核 KP，JSON 只剩 27 個；另 37 個變成看似已確定的 `beyond=false` minimum。被遺失的例子包括：

- `life.safety.emergency.cpr-aed`
- `life.safety.extra.harassment`
- `life.think.bias.dunning-kruger`
- `life.digital.ai-algo.ai-detection`
- `life.data.judgment.data-ethics`
- `sci.t_sub.bio-biotech.crispr`
- `sci.t_sub.bio-genetics-molecular.epigenetics`
- `eng.t_adv.vocab.ceec-4500`
- `soc-geo.t_sub.skill.spatial-interp`

**修法：** 不得再把 workflow 狀態塞在自然語言 title 或大括號後。每筆 KP 必須有獨立欄位：

```json
{
  "verification_status": "pending | verified | rejected",
  "verification_note": "",
  "authority_refs": [],
  "verified_as_of": "YYYY-MM-DD",
  "verified_by": []
}
```

generator 必須拒絕任何未解析的 trailing text。新增 round-trip 測試，確保 slice → manifest → generated appendix 不遺失任何欄位。

### B-02：知識點母體尚未核定，卻宣稱已不再是 blocker

主規格 §0.3 宣稱附錄 A 已深掘審查完成，定案 blocker 只剩 5-clean 與紅隊；但目前仍有 64 個待核 KP，且 `AC-COV-2` 不檢查 pending 數量。

**修法：** spec 定案前新增 `AC-KP-VERIFY`：

- binding minimum 的 `verification_status=pending` 數必須為 0。
- pending 可改成 `t_enrich/beyond=true` 暫不 gating，或先移出 binding；不可假裝 verified。
- 每個 minimum KP 必須有 curriculum／authority evidence。
- 知識點母體一旦修改，spec clean streak 歸零。

### B-03：3092 條全部被當 minimum，enrichment 邊界失真

`t_enrich=0`、`beyond=true=0`。但清單包含大量需重新證明屬於現行 K-12／考試下限的內容，例如分部積分、旋轉體、克拉瑪公式、非慣性座標、狹義相對論、分子軌域、能斯特方程式、CRISPR、RAAS、克利金內插等。

這些內容可以教，但不能因「有教育價值」就標成現行考綱 minimum。

**修法：** 建立「官方課綱／考試說明 → KP ID」對映表；沒有明確官方對應者，預設 `t_enrich,beyond=true,exam=無`，除非領域 reviewer 提供可追溯依據。

### B-04：考試標籤錯置且不是受控 schema

- 26 個 `eng.t_sub.*` 標成 `exam="分科"`；現行分科測驗沒有獨立英文考科。
- manifest 同時使用 `分科`、`分科-物理`、`分科-物理 (待核)`、`探究` 等混合粒度自由字串。
- 英文實用／旅居／留學／TOEIC／TOEFL／IELTS／GEPT 被 R13 定為 mandatory minimum，但 manifest 幾乎沒有可追蹤條目。

**修法：** `exam` 不得是自由字串；改為版本化結構：

```json
{
  "assessment_refs": [
    {"system":"GSAT", "subject":"English", "version":"2026", "scope_ref":"..."}
  ]
}
```

另建立 `exam_capabilities.json`，把考古題模式、非選推導、計時、混合題、英聽策略等轉成穩定 ID；新增 `AC-CAPABILITY`，避免 §4.x 只是 prose、漏做仍全綠。

### B-05：binding 清單已有明確錯誤或高風險表述

必須先修正，不能等內容實作才處理：

1. `chi.t_base.char.near-form`：例子「辨辯辯瓣」重複「辯」，疑似漏「辦」或「辮」。
2. `life.data.misleading.simpson-paradox`：把「倖存者偏誤」與「辛普森悖論」合成一條，兩者不是同一概念；前者已有獨立 KP。
3. `life.think.bias.dunning-kruger`：「越不懂越自信」把複雜研究結果變成貼標籤口號。應改成「自我評估可能因缺少判準而失準」，並介紹研究限制。
4. `eng.t_adv.modal.probability-ladder`：`must > may > might > can't` 把 `can't` 當低機率；`can't` 是高確定度的否定推測，不應放在同一條正向概率序列末端。
5. `eng.t_mid.verb.stative-verbs`：若寫成「狀態動詞不用進行式」會過度絕對；動態義可用進行式。
6. `sci.t_mid.bio-membrane-transport.osmosis`：以「高水位→低水位」解釋滲透會建立錯誤模型；應使用水勢／溶質濃度與選擇性通透膜。
7. `sci.t_base.bio-life-levels.life-needs`：若把陽光、一般空氣列成所有生物共同需求，事實不正確。
8. `soc-civ.t_mid.rights.crc`：把「生存、發展、保護、參與」稱為 CRC 四大一般原則；這是常見的四類權利，不是四項一般原則。
9. `sci.t_adv.bio-respiration.atp-yield`：固定寫 30–38 ATP 會混合舊式理論值與現代估值，需區分物種、穿梭系統與教材模型。
10. `sci.t_mid.earth-geomorph.river-landforms`：不能把沖積扇簡化成河川「下游」地形；典型位置是河流出山口、坡度驟降處。

### B-06：消防、瓦斯、急救內容必須走更高級別驗證

`life.safety.emergency.fire-escape` 現在把「濕毛巾」「往下逃」列成通則。這類口訣可能延誤逃生或讓孩子進入有煙樓梯；逃生方向必須依火煙與安全出口判斷。

`life.safety.home.fire-gas` 要兒童「關閥」，可能讓孩子停留在危險區域。`life.safety.emergency.cpr-aed` 的「撥119→壓胸→取AED」也過度簡化，且原始 slice 已標待核，但 manifest 丟掉了這個狀態。

**修法：** 健康／消防／急救／法律／兒少安全全部列為 `risk_class=high`：

- 只能使用台灣現行官方機構或公認醫療組織來源。
- 必須有來源版本／存取日期／適用年齡。
- 需要第二位獨立 reviewer。
- 不能使用「常識免來源」。
- 內容修改後所有相關題目與圖示簽核一起失效。

### B-07：§6.8 只做 unit 級簽核，無法證明每一句、每題、每張圖正確

現行 ledger schema：

```json
{ "unit_id", "reviewer_role", "verdict", "sources", "sha" }
```

一個 unit 可能有十幾個事實、題目、選項、圖示；unit-level PASS 無法指出哪個來源支援哪一句，也抓不到「正解對、feedback 錯」「文字對、圖畫反」「選項有兩個都對」。

**修法：** 採用第 6 節的 claim／question／visual 三級證據模型。

### B-08：執行驗證可能只是「用同一個錯誤公式證明自己」

目前規格把「用 `.venv` 跑出答案」視為強驗證，但如果題目生成器與驗證器共用同一個公式／同一段程式，錯誤會完全一致而得到假 PASS。

主規格自己的正例「水沸點 100°C（可計算／常識免 source）」就是警訊：沸點不是僅靠一般算式可證明，且必須限定純水與壓力條件。正確寫法應是「純水在 1 atm 附近沸點約為 100°C」，並附權威來源。

**修法：** 可計算驗證必須有獨立 oracle：

- 生成器與 oracle 不共用實作。
- 公式先由權威來源或推導證明，再用程式檢查代數／數值。
- 重要題型採兩種獨立方法交叉驗證。
- 邊界、零值、負值、極端值與單位都要測。
- 隨機題生成器必須使用固定 seed + property tests + 小範圍窮舉。

### B-09：多份文件同時自稱 SSOT，且規則衝突

- `LEARNING_PATH_REBUILD_SPEC.md` 自稱唯一事實來源。
- `BLUEPRINT.md` 也自稱唯一可執行規格。
- `DESIGN_SPEC.md` 又稱共用資產是唯一真相。
- `STANDING_AUDIT_SOP.md` 的 clean 定義是 N=2；主規格是 5 clean。
- 主規格 R-OPEN 禁 hard gate、R11 禁 learner 顯示年段；`BLUEPRINT.md` 卻要求「小四精通之路」、超綱 hard gate 與國高中挑戰書架。
- 主規格允許自由探索；舊文件將某些進階頁移出獎勵路徑。
- 主規格稱聽寫已上線；`DICTATION_BUILD_SPEC.md` header 仍寫 `NOT implemented`。

**修法：** §0 加正式 precedence table：

1. 主規格唯一 normative。
2. 附錄 A／manifest 只因主規格明示納入才 binding。
3. 其他文件一律 `historical/background`；若仍採用，只引用「檔名＋章節＋sha」。
4. 在其他舊文件加 superseded banner，移除「唯一／最終」宣告。

### B-10：Visual QA 與 anti-drift 定案條件目前不自包含

正式 `VISUAL_QA_BUILD_SPEC.md` 不存在；主規格依賴 user-home 的規則檔。fresh clone 無法重建相同驗收。`inject-sop-carriers.py`、memory 錨點與 learning-path hook 也不存在，但 §0.3 又宣稱只剩兩個 blocker。

**修法：** 建立 Phase -1「spec tooling only」：允許在產品實作前建立正式 visual QA spec、anti-drift hooks、manifest checker、spec lint 與 red-team fixtures；完成後才開始 spec 5-clean。

---

## 4. HIGH／MAJOR 意見

### H-01：知識點粒度違反自己的 DEPTH-STD

規格要求每條是一個可單獨出題的微技能，但實際有很多大包：

- `math.t_base.numquant.unit-conversion` 同時包含長度、重量、容量、時間、角度、面積、體積。
- `math.t_base.numquant.fraction-arithmetic` 合併分數加減乘除。
- `life.safety.emergency.first-aid` 合併止血、燙傷、哽塞。
- `life.safety.scam.common-scams` 合併大量不同詐騙。
- 多個歷史項目把整個時代、革命或戰爭原因／過程／影響塞在一個 ID。

這會讓 coverage 顯示一個 unit 已「覆蓋」整大包，但學生可能只學到其中一小部分。

**建議：** 大包 KP 拆成原子 KP；unit 可以掛多個 KP，但每個 KP 都要獨立真教真考。

### H-02：跨 domain 重複沒有 canonical ownership

霸凌、身體自主、金融詐騙、水循環、季風、自然災害等同時出現在 life／公民／自然／地理。若沒有 ownership，會重複造課並產生不同口徑。

**建議欄位：**

```json
{
  "canonical_kp_id": "...",
  "related_kp_ids": ["..."],
  "ownership": "primary | contextual"
}
```

允許同一 unit 覆蓋多域 KP，但每一域的學習角度與評量要求要分別列出。

### H-03：exam／domain／tier 枚舉未正式鎖定

`_kp_build.py` 只檢查粗略 ID regex，未驗 allowed domain、exam enum、academic ID 的 tier 與欄位一致、life category allowlist，也允許三段 ID。

**建議：** 建正式 JSON Schema；generator 與 CI 只接受 schema 中的 enum，任何括號備註或未知值直接失敗。

### H-04：`_kp_build.py --check` 現在固定失敗

目前 exit 1，因 19 個摘要／備註 bullet 被當成未編號知識點。這使 AC-COV-2 不可用。

**建議：** 只掃明確標記的 inventory 區段；摘要使用不同標記。新增 fixture：真檔 PASS、故意漏 ID 的壞檔 FAIL。

### H-05：anti-vagueness lint 不是逐規則 lint

目前 lint 只檢查整個 `##` 章中是否至少出現一次「細則」「範例」「❌」。一章內可以有十條模糊規範，只要其中一處有三個關鍵字就全章 PASS。

**建議：** 每條 normative rule 都有穩定 `rule_id`，並要求：

```json
{
  "rule_id": "R-...",
  "inputs": [],
  "outputs": [],
  "threshold": "",
  "positive_case": "",
  "negative_case": "",
  "boundary_case": "",
  "gate": ""
}
```

panel 只能補語意判斷，不能代替缺失的機械契約。

### H-06：知識受限 LLM 模擬不能「證明」孩子學得會

LLM 無法真的忘記既有知識；即使要求它列出 KP 歸因，也可能先用隱含知識再錯誤歸因。K_pre 超限截斷又會造成假 blocker 或假 pass。

**建議：**

- INV-1 主 gate 改成 deterministic：每題宣告 `required_kp_ids[]`，檢查是否包含於 prerequisite closure ∪ 本課 teach KP。
- LLM 只用來挑戰「是否漏標 required KP」，不得當作正確證明。
- K_pre 不可靜默截斷；應分批檢查並合併。
- 加入少量真實兒童／家長觀察 pilot，無需收集 PII；這是學得會與不倦怠的唯一真人證據。

### H-07：導航四態沒有 deterministic state machine

「建議先修／就緒／進行中／已精熟」沒有完整轉移表；SRS 到期、直接跳學、部分自評、先備未完成時如何決定狀態尚未固定。

**建議：** 定義純函式 `deriveUnitState()` truth table 與測試；新增 `AC-NAV-STATE`。

### H-08：部分門檻仍模糊或互相矛盾

- `≤ ~15` 不是確定門檻，應改 `≤15`。
- tap target 主規格 44px、Design Spec 48px；應統一 48px。
- AC-PERF 只看 JS 體積，不能代表不卡；需加 LCP、long task、FPS、峰值記憶體與具體裝置。
- 「零 px 魔術數」與允許 680px 等固定上限矛盾；應改成「只能透過 named token 使用」。

### H-09：手機相容但 Visual QA 只硬性測 iPad

主規格說亦相容手機，AC-VIZ 卻只有 1366×1024／1024×1366。應加入至少 390px 手機 viewport、200% zoom、鍵盤操作、VoiceOver／螢幕閱讀語意與 reduced-motion。

### H-10：沒有單一、可重現的總驗證入口

`npm test` 固定失敗，22 個 AC 分散在 Python／Node／人工簽核／外部規則。

**建議：** 規格要求：

```bash
npm run verify:learning-path -- --phase=0
npm run verify:learning-path -- --release=<release-id>
```

由 orchestrator 依固定順序跑 gate，只有全部通過才原子寫入 acceptance ledger；所有工具版本釘死於 lockfile。

---

## 5. 知識內容優先修正清單

### P0：可能傷害安全或健康

1. 火場逃生：「濕毛巾」「往下逃」不可當通則。
2. 瓦斯味：兒童不可被要求停留操作不熟的閥件。
3. CPR/AED：需以現行台灣官方／醫療指引重寫，區分無反應、呼吸狀態、呼救與 AED 取得。
4. 燙傷、哽塞、止血應拆成不同 KP，分別查核。
5. 酸鹼性質不可暗示用味覺／觸覺辨識未知物。
6. 法律、兒童權利、消費者解除權必須附版本日期與適用條件。

### P1：明確概念錯誤／迷思

1. 滲透：不可使用「高水位到低水位」。
2. 所有生物需求：不可把陽光／氧氣當所有生物共同必需。
3. CRC 四大一般原則與四類權利要拆開。
4. 平面鏡不宜簡化成物理上的「左右相反」。
5. 發酵與厭氧呼吸不可完全當同義詞。
6. 河川地形需區分沖積扇與三角洲的位置與成因。
7. 水收支應先定系統邊界，避免把入滲與儲量重複計算。
8. 英文 `can't` 是高確定度否定推測，不是低概率尾端。
9. `a/an` 依下一詞的起始音素，不依字母。

### P2：內容品質／粒度

1. 修正「辨辯辯瓣」。
2. 拆開倖存者偏誤與辛普森悖論。
3. 拆開損失趨避與沉沒成本。
4. 避免「越不懂越自信」式貼標籤。
5. 英文補齊生活溝通、旅行／住宿／交通／醫療求助、出國上課聽講與口頭報告、自然語速、澄清策略與正式認證能力。
6. 歷史大包條目拆成因果、制度、交流、影響、史料判讀等可測微技能。

---

## 6. 建議納入 spec 的「知識正確性保證 v2」

### 6.1 四層證據模型

#### 第一層：Knowledge Point 本身是否正確、是否屬於該範圍

每個 KP 必須有：

```json
{
  "id": "...",
  "title_zh": "...",
  "tier": "...",
  "assessment_refs": [],
  "curriculum_refs": [],
  "verification_status": "verified",
  "verified_as_of": "YYYY-MM-DD",
  "reviewers": ["domain-role-a", "independent-role-b"]
}
```

此層驗證兩件不同的事：

1. **事實／技能描述是否正確。**
2. **它是否真屬於這個 tier／考試 minimum。**

不能用同一個「領域專家 PASS」模糊帶過。

#### 第二層：每一個教材 claim 是否有證據

```json
{
  "claim_id": "unit-x.claim-03",
  "text": "...",
  "kind": "definition|numeric|causal|historical|legal|health|language-usage",
  "source_refs": ["src-001"],
  "verification_ref": "verify/unit-x/claim-03.json",
  "risk_class": "normal|high",
  "status": "verified"
}
```

**取消「常識／定義型可免來源」的寬鬆例外。** 可改成「可繼承 canonical source」，但每個 claim 仍要能追到來源。H₂O 等簡單事實也可指向一個共用基礎來源，不必每頁重複抄 URL。

#### 第三層：每一道題目、正解與干擾項是否正確

```json
{
  "question_id": "unit-x.q-04",
  "kp_ids": ["..."],
  "required_kp_ids": ["..."],
  "type": "mcq",
  "answer": 2,
  "rationale": "...",
  "answer_evidence": ["claim-03"],
  "distractor_rationales": {
    "0": "為何錯",
    "1": "為何錯",
    "3": "為何錯"
  },
  "validation_method": "exhaustive|oracle|source|expert"
}
```

MCQ 必須證明只有一個 defensible answer；多選題必須定義全部合法集合；開放題要有 rubric 與可接受答案邊界。feedback 也要綁 claim，避免答案改了而解釋沒改。

#### 第四層：圖示與動畫是否忠實

每張圖／動畫 scene 必須列 `claim_ids[]`、圖例語意、frame 清單與 `content_reviewer`。Visual QA 的美術／裁切簽核不能代替內容正確性簽核。

例如四季動畫不只要「不重疊」，還要由地科 reviewer 確認地軸方向、日照角度與文字敘述一致。

### 6.2 Source Registry

來源不得只是一串 URL。建立：

```json
{
  "source_id": "src-001",
  "title": "...",
  "publisher": "...",
  "url_or_isbn": "...",
  "edition_or_version": "...",
  "locator": "章／節／頁／條號",
  "accessed_at": "YYYY-MM-DD",
  "authority_class": "official|standard|peer-reviewed|dictionary|textbook",
  "content_fingerprint": "sha256-or-version"
}
```

法律、考試、人口、地理數據、急救、AI 平台等時效性內容另有 `recheck_after`；過期自動擋 release。

### 6.3 風險分級

| 類別 | 最低驗證要求 |
|---|---|
| 一般數學／語言 | 來源或獨立 executable oracle + 1 位 reviewer |
| 歷史／公民／考試範圍 | 2 個獨立來源 + 1 位領域 reviewer |
| 醫療／急救／消防／法律／兒少安全 | 官方現行來源 + 2 位獨立 reviewer；AI 多數決不算 |
| 價值／情意 | 不設唯一「正解」；心理安全與多元觀點審查 |

**AI agent 可以找錯、比對、重算、挑戰；不能把自己稱作 domain expert 後就成為權威來源。** 最終依據必須是可追溯來源、可重跑證據，或真正具資格的人員簽核。

### 6.4 生成題與隨機題

每個 generator 必須：

1. 宣告輸入 domain 與不變量。
2. 使用獨立 oracle 產生／驗證答案。
3. 對小 domain 做窮舉。
4. 對大 domain 做固定 seed property tests。
5. 測零、負值、極端值、邊界、單位、四捨五入。
6. 確認題幹、答案、feedback、圖示使用同一組實際參數。
7. 不得讓生成器和 oracle 共用同一個待驗公式函式。

### 6.5 Release 證據與部署一致性

定義 canonical `unit_content_hash`，至少涵蓋：

- unit JSON
- question bank
- referenced assets
- glossary/version
- renderer version
- claim／source evidence

只有與簽核 hash 相同的產物可部署。部署後再抓回 learner-visible 檔案計算 hash，確認不是「審 A、部署 B」。

### 6.6 正確性 gate 建議

新增／強化：

- `kp_pending_gate.py`：binding minimum pending=0。
- `kp_roundtrip_gate.py`：source → manifest → appendix 全欄位無損。
- `curriculum_mapping_gate.py`：每個 minimum KP 有版本化課綱／考試依據。
- `claim_evidence_gate.py`：每個 factual claim 有 source 或 executable evidence。
- `question_correctness_gate.py`：每題有正解證據、rationale、干擾項說明。
- `generator_property_gate.py`：隨機題生成器的 property／exhaustive tests。
- `visual_content_fidelity_gate.py`：圖文 claim 對應及內容 reviewer 簽核。
- `source_freshness_gate.py`：時效資料過期即 FAIL。
- `release_hash_gate.py`：簽核內容與部署內容一致。

---

## 7. 規格與實作準備度建議

### Phase -1：先修規格與驗證工具

在任何產品實作前，只做：

1. 文件 precedence／superseded banner。
2. 修 manifest 無損管線。
3. 清理 64 個 pending。
4. 修正本報告列出的錯誤知識。
5. 定義 claim／question／visual／source schema。
6. 建 repo-local `VISUAL_QA_BUILD_SPEC.md`。
7. 建 anti-drift hooks 與 spec red-team fixtures。
8. 建單一 `verify:learning-path` orchestrator。

Phase -1 完成後，才開始 spec 5-clean。

### Phase 0：規格定案

- 所有 blocker 關閉。
- `_kp_build.py --check` exit 0。
- binding minimum pending=0。
- anti-vagueness 改成 per-rule 驗證。
- anti-drift 四錨點已存在且紅隊通過。
- Visual QA contract 在 repo 內可重建。
- 5 clean + 紅隊零繞過。

### 後續實作

維持原本的 Phase 0.5–5，但每個 island 可獨立 release 時，需新增 `AC-ISLAND-RELEASE`，不能只依全站最終 AC。未完成的島不得顯示成 learner 可點卻無內容的空路徑。

---

## 8. 建議修正順序

1. **先修 37 個 pending 遺失與 64 個待核管理。**
2. **立即修消防／急救／CRC／滲透等安全或明確錯誤。**
3. **重做 exam mapping，清除分科英文與自由字串。**
4. **重分 minimum vs enrichment。**
5. **拆解違反 DEPTH-STD 的大包 KP。**
6. **建立跨 domain canonical ownership。**
7. **補實用英文與認證能力 registry。**
8. **升級正確性制度到 claim／question／visual 層。**
9. **解決 SSOT／Phase／Visual QA／anti-drift 衝突。**
10. **建立單一驗證命令，再開始 5-clean。**

---

## 9. 最終評語

這份規格的優點不是少，而是**企圖把教材品質變成可驗證契約，而不只是作者承諾**。這個方向非常正確；3092 個穩定 ID、來源行追溯、真教真考、先備 DAG、證據綁 sha 都是好地基。

目前最大的風險不是內容不夠，而是「母體看起來很完整，所以太早相信它」。已發現的 pending 遺失、考試制度錯標、消防口訣、CRC、滲透、英語情態與大包 KP，證明這個母體仍需要逐 domain 的權威複核。

**建議狀態：維持 DRAFT。先完成 Phase -1 的 spec-only 修訂；在 binding inventory 沒有 pending、claim-level correctness gate 未定義、正式 Visual QA 契約未入 repo 之前，不進教材實作。**
