# GOLDEN UNIT — communicative 原型（teach→practice→selfeval ＋ shadowing）

> 本目錄凍結「好的樣子」的黃金範本單元，依 `LEARNING_PATH_REBUILD_SPEC.md` §6.6① 的
> **golden 自身 bootstrap（消循環，O-9）**：golden 是該原型的「第一個」單元，無前一個 golden 可比，
> 故其滿分 bar 由 **WRITERS ＋ §8 六審查鏡（#2 native-English／#3 溝通語言學家／#4 學習神經科學／
> #5 知識視覺化／#6 眼科／#10 PM）＋ panel 簽核**認定；對 golden 自身**豁免 AC-UNIT-3 結構 diff**。
> freeze 綁 sha，golden 內容一改即需重簽。

## 1. 來源與凍結產物

- **原型（archetype）**：`communicative`（英語島 Phase 2 開口說單元）＝
  `① 先聽先感覺（teach）→ ② 練一練（practice）→ ③ 跟著讀＋模仿語調（shadowing）→ ④ 我到哪一步了（selfeval）`。
  語感優先、音檔真實播放（edge-tts）、自評不自動判讀（翻答案自評→SRS）、聽寫＋跟讀為核心模態。
- **來源單元（REUSE-FIRST，R5／§5.4）**：`english_greetings.units.json`
  （`unit_id = eng.t_base.verb.greetings-intro`，情境＝初次見面打招呼與自我介紹）。
  此為 Phase 2 英語島**首個樣板單元**，其後 99 個 communicative 單元皆以其為模板產出；
  是 §6.2.2 schema 最完整、MCQ distractor 最乾淨、R3 零文法術語外洩的最強收斂範例。
- **凍結產物（本目錄，未動線上頁面）**：
  - `communicative_unit.units.json`　← `english_greetings.units.json` 的逐位元複製（凍結基準）
  - `communicative_unit.html`　← `english_greetings.html` 的 1KB 薄殼複製（僅宣告 `data-units` ＋ 掛共用引擎）
- **共用渲染引擎（NOT 複製，僅記錄 sha 以免漂移）**：
  `assets/unit.js`、`assets/unit.css` 為全 100 單元共用；golden 的「區塊骨架／共用 class／互動模式／a11y」
  由引擎定義，故引擎屬 golden 參照的一部分，但**不在本目錄複製**（複製會製造兩份來源漂移）。

## 2. 凍結 sha（freeze sha；golden 內容變＝重簽）

| 產物 | sha256 |
|---|---|
| `communicative_unit.units.json`（全檔） | `1fa1b7edd526d9b260eca8b5f2a9b217cdc986ca2c9d2076e520e2d7b596dca7` |
| 單元 `unit_content_sha[:16]`（§6.6① 定義：`sha256(canonical_json(unit, sort_keys))`，本單元無 signoff 子物件需排除） | `33fd7d1f637a3033` |
| `assets/unit.js`（共用引擎，參照） | `4940878ad6ff4831840760792081d2b3c9000ee7bd30925fdba4f252aa4e33a6` |
| `assets/unit.css`（共用版面，參照） | `87e89914acb3564e9eac45dc9c25bec90cbd91fda13a658d3bb95e1f267557fc` |
| `english_greetings.html`（薄殼，參照） | `afe9cfd47b0fa416eea12dc86fb6347228a30ba2088a22cca1912d3343766438` |

凍結時間：台北 2026-11-01。重算指令：`shasum -a 256 <file>`。

## 3. AC-UNIT-3 結構骨架（後續單元 diff 基準）

後續每個 communicative 單元 MUST 與本 golden 做結構 diff；偏離須在 unit metadata 寫合規
`deviation_reason`（§6.6① enum＋sha-bound 簽核），否則 `unit_acceptance_lint` 視為漂移 FAIL。
骨架＝以下 sidecar 欄位契約 ＋ 共用引擎渲染出的固定區塊：

### 3.1 sidecar（`*.units.json`）欄位骨架
```
{ page, units:[ {
  unit_id, title_zh, can_do, situation_group, subject, strand, est_minutes(≤12),
  knowledge_point_ids[]  (皆存在於 authoring/knowledge_points.json),
  prerequisites[],
  claims[]      { claim_id, text, kind, source_refs[], verification_ref, risk_class, status },
  teach[]       { kind:"text|example|viz", body, kp_ids[](非空), audio? },
  practice[]    { question_id(單元內唯一), type:"mcq|dictation", stem, answer,
                  kp_ids[](非空), required_kp_ids[](⊇kp_ids),
                  options?(mcq), distractor_rationales{}(mcq 必填), answer_evidence[→claim_id](事實型),
                  validation_method:"exhaustive|oracle|source|expert", feedback },
  selfeval[]    (固定三級：還不熟/快會了/會了),
  selfeval_note,
  shadowing     { note, lines[]{ text, audio, intonation } }
} ] }
```

### 3.2 共用引擎渲染出的固定區塊（`unit.js`）＋共用 class（`unit.css`）
- 版面：`.gr-layout`（左 `.gr-side` sticky 導覽＋can-do ／右 `.gr-main` 滿寬內容；≤900px 單欄）。
- 四固定章節（`h2.gr-h` ＋ anchor `#s1..#s4`）：① 先聽先感覺 ② 練一練 ③ 跟著讀＋模仿語調 ④ 我到哪一步了。
- 卡片／互動：`.gr-card`、`.gr-en`、`.gr-play`（🔊 音檔）、`.gr-opts/.gr-opt`（MCQ，顯示順序**洗牌**、以值比對、
  `.correct/.wrong`、答錯浮出 distractor_rationale）、`.gr-fb`、聽寫 `.gr-canvas`（手寫，不批改）＋鍵盤切換、
  跟讀 `mkRec()`（錄自己→聽自己，不上傳不批改）、三級自評 `.gr-rate`。
- a11y：canvas `role="img"`＋`aria-label`；nav `aria-label`；`:focus-visible` outline（`--c-focus`）；
  MCQ 洗牌避免「永遠點第一顆」位置偏誤。

## 4. §6.6 單元驗收 rubric — 10 項逐項對映（golden 兌現狀態）

| # | rubric 項 | golden 兌現 |
|---|---|---|
| ① | 教→練→評三段齊備 | ✅ teach[5]＋practice[7]＋shadowing＋selfeval 三級，四章節俱全 |
| ② | 僅用 app.css token、零硬編色碼／px 魔術數（design_consistency_gate） | ✅（委派）單元 sidecar 無 CSS；版面吃共用 `unit.css`，色彩取 `--card/--ink/--c-english…` token。*caveat：共用引擎 CSS 有少數狀態色字面值（correct/wrong tint `#e7f6ef`/`#fde8e8`），屬共用引擎範疇、非 golden 單元資料* |
| ③ | 內容卡自適應寬（R-STYLE-3） | ✅ 卡片走共用 `.gr-card`；選項 `grid auto-fit minmax(260px,1fr)` 吃滿寬不留置中孤島 |
| ④ | 每題正解 play-through 代入朗讀通順無誤 | ✅ 7 題正解皆在 options 內、代入語句自然（"Hi, I'm Ming." / "What is your name?" / "Where are you from?"）；聽寫答案 "Hello, my name is Ming." 道地 |
| ⑤ | 自評三級＋寫入 SRS、不假裝自動批改 | ✅ `selfeval:["還不熟","快會了","會了"]`＋`selfeval_note` 明示翻答案自評→SRS |
| ⑥ | 繁體零簡體零 PRC（scan_simplified） | ✅ `scan_simplified.py` PASS（僅 info：U+53F0 台→臺 建議，非失敗） |
| ⑦ | kp 全對映附錄 A、prerequisites 已宣告、每條真教真考（無 declaration-stuffing） | ✅ `unit_acceptance_lint` 7:binding＋7:manifest 皆過（4 個 kp 皆現身於某 teach 段與某 practice 題、皆存在於 manifest） |
| ⑧ | est_minutes ≤ 12（INV-4） | ✅ `est_minutes=9` |
| ⑨ | viz 逐 frame iPad Air 13 render＋四角色簽核（R10） | ✅ 已隨 100 單元上線時通過 iPad render gate；本單元 teach 無自訂動畫 viz（text/example＋音檔），四章節畫面已簽核。*內容一改需重跑 viz-QA* |
| ⑩ | 含可執行碼則附 code-download bundle | N/A（communicative 單元不含可執行碼） |

## 5. §8 六審查鏡 signoff（golden bootstrap；§6.6①）

> 以下為 WRITERS ＋ 六審查鏡的分析簽核。標註「需獨立對抗 agent」者＝正式定案前
> 應由獨立 reviewer（native-English／溝通語言學家）再對抗式複核，以滿足 §8 panel 完整性。

| 鏡 | 判定 | 一行理由 |
|---|---|---|
| #2 native-English speaker | PASS（建議獨立對抗 agent 複核） | 全部 learner-facing 英文道地自然：greetings/自我介紹/Wh- 問法皆母語者實際用語；distractor 為真實易混錯句。*caveat：`claims[].status="provisional"`、`verification_ref` 標「待英語母語 reviewer 複核」——學習者看不到 claims（引擎不渲染），但正式 panel 定案前宜由 native reviewer 把 claims 轉 verified* |
| #3 溝通語言學家（白話用字） | PASS | 教學說明全用白話（「問的那個詞放最前面，is／are 往前靠」），零文法術語外洩（R3）；用字淺白、TOEIC 入門可讀 |
| #4 學習神經科學 | PASS | 先聽後讀（降規則負荷）、teach→retrieval（MCQ/聽寫）→自評→SRS 間隔複習；單元 est 9 分不過載（INV-4）；題目逐知識點 chunk |
| #5 知識視覺化 | PASS | 左 sticky can-do＋四章節 anchor 導覽、卡片分段、音檔按鈕可視；聽寫 canvas 筆記本橫線輔助排列 |
| #6 眼科 / eye-comfort | PASS | 字級 15–17px、`line-height` 1.5+、`:focus-visible` 清楚、滿寬不擠；≤900px 轉單欄。*整塊畫面於 iPad Air 13 免捲動可達已隨上線 render gate 簽核* |
| #10 PM（讀者旅程／scope） | PASS | 單一清晰情境（初次見面）、can-do 明確、四步旅程完整、起點友善（t_base 初級、prerequisites 空） |

**R3 文法術語外洩掃描**：learner-facing 欄位（can_do/teach.body/stem/options/feedback/distractor_rationales/
shadowing/selfeval）零「問句／主詞／受詞／be動詞／所有格…」等術語；「文法」一詞僅出現於 `_note`
（作者註）與 `claims[].verification_ref`（證據層 metadata），兩者引擎皆不渲染，不觸及學習者。

## 6. 驗收指令（可重現）

```
# 全檔逐位元 sha
shasum -a 256 authoring/golden/communicative_unit.units.json
# rubric 確定性子集 lint（應 PASS 1/1）
.venv/bin/python tools/unit_acceptance_lint.py --file authoring/golden/communicative_unit.units.json --no-delegate
# 簡體/PRC 掃描（應 PASS）
.venv/bin/python -I tools/scan_simplified.py authoring/golden/communicative_unit.units.json
```

## 7. caveat（誠實標記，§0.2）

1. **claims 層仍 provisional**：learner 內容已 golden-grade，但 `claims[]` 的 `status="provisional"`／
   `verification_ref` 標「待英語母語 reviewer 複核」。正式 panel 定案前，宜由獨立 native-English reviewer
   把本單元 claims 推到 verified（不影響 learner-facing 品質，屬 §6.8.1 證據層後續工作）。
2. **共用引擎狀態色字面值**：`unit.css` 的 correct/wrong tint（`#e7f6ef`/`#fde8e8`/`#fff`）與 `unit.js`
   筆跡色（`#33312E`）為字面值，屬**共用引擎**範疇（已隨 100 單元通過 design gate），非本 golden 單元
   sidecar 的問題；若 R-STYLE-2 要求收斂，應在引擎層另開工單，不改 golden 基準。
3. **AC-UNIT-3 對 golden 自身豁免**：本 golden 依 §6.6① 不自我 diff；其滿分 bar 由上表簽核認定。
   後續單元才以本骨架為 diff 基準。
4. **native-English／溝通語言學家宜獨立對抗 agent**：上表為分析式簽核；正式定案建議由獨立 reviewer
   agent 再跑一次對抗式複核以滿足 §8 panel 完整性（本輪為 bootstrap 認定）。
