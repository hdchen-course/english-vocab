# 英語島 communicative 雙層設計提案（DRAFT，待 HD 審 → 定案後折入 spec → Phase 2 團隊 authored）

> 狀態：**草案**。依 HD 2026-10-31 四條治理鐵律（見 memory `english-island-approach-2026-10-31`）起草，供 HD 審／改。
> 非 normative；定案要走 roles-first 團隊 ＋ content_audit 5-clean ＋ HD 確認，再折入 `LEARNING_PATH_REBUILD_SPEC.md`。

## 0. 問題陳述
現行英語島 22 個分區是**文法分類學**（verb/modal/relcl…）＝為台灣考試學英文的骨架。應試 OK、課綱覆蓋正確、**考試需求要保留**，但那是「檢索結構」不是「使用結構」：實際生活旅行/工作要的是**能開口、聽得懂、用得出來**。

## 1. 四條治理鐵律（本設計的驗收準則）
1. **語感 > 文法**：歸納式（真實語境 notice pattern → 內化「順不順」），不 rule-first、不術語堆砌、不台式對比、不中式病句。
2. **聽寫（dictation）為核心練習模態**。
3. **跟讀（shadowing）＋語調模仿（intonation）為核心練習模態**：聽母語音檔→跟讀→**自評**（不假裝自動判發音）。
4. **真實生活溝通 > 應試文法**：溝通為預設臉，文法降為對照視圖。

## 2. 雙層結構
### Layer A（預設臉）＝ 溝通：以「情境/功能」組織（can-do 導向）
學習者進英語島**先看到能用的**。提議的頂層情境群（K-12 由生活→旅行→職場，螺旋加深；不綁年段 R11）：

| 情境群 | 範例 can-do（功能） |
|---|---|
| 生活自理 Daily life | 打招呼/自我介紹、說時間數字錢、點餐、購物、居家、身體不舒服就醫 |
| 在地與旅行 Travel | 問路/交通、機場/旅館、求助、描述地點 |
| 人際互動 Social | 交朋友、閒聊 small talk、邀約、表達感受/意見、禮貌同意/反對、道謝道歉 |
| 學校與資訊 School & info | 課堂用語、聽懂指令、讀標示/菜單/時刻表、簡單查資料 |
| 數位與媒體 Digital | 傳訊息、email 基礎、線上安全用語、看懂短影片 |
| 說明與敘事 Express | 說一件事、描述日常、給理由、談未來計畫 |
| 職場初階 Early work（高年級） | 專業自我介紹、簡單 email、會議基礎、電話/客服用語 |

每個情境群下是**微單元（unit）＝一個 can-do**；每單元用「聽/說/內化」為主、文法歸納式輔助。

### Layer B（次要對照視圖）＝ 考試/文法：22 文法分區保留
- 保留既有 22 分區，降為**「考試對應 / 文法檢索」視圖**（會考/學測對照）。
- 入口以 toggle/分頁切換：預設 Layer A，點「考試對應」看 Layer B。
- 課綱 100% 覆蓋由此保證：應試者查得到、練得到。

## 3. 兩層如何連回同一批知識點（覆蓋不漏）
- 每個 communicative 單元在 `units.json` 宣告它自然用到的 `knowledge_point_ids[]`（文法/字彙 KP）。
- 建一張 **communicative 對照層**：`authoring/english_functions.json`＝`{function_id, title_zh, can_do, situation_group, kp_ids[], reuse_pages[]}`。
- 由此可機器驗：**每個 minimum 英文 KP 至少被某 communicative 單元涵蓋**（擴充現有 `coverage_gate` 的 eng 切片）——確保「換成溝通入口」不犧牲課綱覆蓋。
- grammar 分區視圖＝把同批 KP 以 strand 重新分組呈現（同資料、兩個 facet）。

## 4. 核心練習模態（每個 communicative 單元內建）
- **語感辨識**：四選一「哪個最自然」（沿用既有 english_sense 原則：誘答=文法對但較不自然，不中式病句）。
- **聽寫 dictation**：聽 edge-tts 音檔→寫下→翻答案自評→SRS（對接 `DICTATION_BUILD_SPEC.md`）。
- **跟讀 shadowing ＋ 語調模仿**：播母語音檔→跟讀→自評（升降調/重音/節奏；不假裝自動判發音）。
- **用出來**：情境迷你對話/造句（開口或打字），即時無標準答案時走自評。
- 音檔一律 **edge-tts 真實 mp3**（見 memory `english-audio-pipeline`）；自評三級→SRS（主路徑）。

## 5. 既有頁 reuse（never-disappear，原地包裝）
`english_sense.html`（語感）、`english_dictation.html`（聽寫）、`english_listening/speaking.html`、`cefr_flashcard/coca_flashcard/toeic_gept_flashcard.html`、`vocabulary_app.html`、`english_reading/writing/tenses/modals/phonics/idioms.html` → 以 unit 身分接入對應情境/功能或文法視圖，progKey 走 §6.3 additive 遷移。

## 6. 入口版面（提議；須 render + 四角色簽核）
- 英語島首屏：頂部「今天想用英文做什麼？」→ 情境群卡（Layer A）；角落「考試對應（文法）」toggle→Layer B。
- 語感/聽寫/跟讀作為**一級練習入口**，不藏在文法分區底下。

## 7. 待 HD 決定（open questions）
1. 情境群分類（§2 表）是否認同？要加/併哪些？
2. 職場初階要到多深（K-12 範圍）？
3. Layer A/B 切換用 toggle 還是兩個並列入口？
4. 先做哪個情境群當 Phase 2 第一個 5-clean 示範單元？

## 7b. 建議預設（設計職權先定，HD 可直接否決/調整）
為讓你醒來只需 yes/no，而非從零思考，先給我的建議值；你不回＝視為採用，回「改 X」即調整：

1. **情境群（§2）建議採用，微調**：7 群保留；把「學校與資訊」與「數位與媒體」的**資訊判讀**部分交給生活島的媒體識讀/查證分區（避免與 life 島重疊），英語島這兩群**只留語言功能面**（聽懂指令、讀標示/menu、傳訊息用語）。→ 淨 7 群不變、邊界更清。
2. **職場初階深度＝輕量、置於高年級選修**：只做「能用得上的高頻場景」——專業自我介紹、3–5 句客服/電話常用語、一封簡短 email 的開頭/結尾框架。**不**教商用寫作/談判（超出 K-12、屬成人 ESP）。
3. **Layer A/B＝同頁 toggle，預設 A（溝通）**：一個明顯的「溝通／考試對應」切換鈕，不做兩個並列入口（避免首屏分裂、符合「溝通為預設臉」）。考試對應視圖是同資料的第二 facet。
4. **第一個示範單元＝生活自理 › 打招呼與自我介紹**：最高頻、最低門檻、最快讓學習者「開口成功一次」；可完整示範五模態（語感辨識／聽寫／跟讀＋語調／用出來），且既有 `english_sense`/`cefr_flashcard` 有可 reuse 素材。作為 Phase 2 第一個走完 5-clean＋edge-tts＋gate 的樣板單元。

> 以上為**設計預設**，非內容定案；真正動工仍走 roles-first 團隊＋content_audit 5-clean＋（你確認後）折入 spec。你醒來若全部 OK，我就直接以「打招呼與自我介紹」開 Phase 2 第一個樣板單元。

## 8. 下一步（spec-first）
本草案 → HD 審/改 → roles-first 團隊（英語母語 ESL／溝通語言師／學習腦科學／領域 expert／PM／眼科）精修 → content_audit 5-clean → 折入 `LEARNING_PATH_REBUILD_SPEC.md` 的英語島節 → Phase 2 逐單元 authored（每單元 5-clean，配 edge-tts 音檔，過 coverage/nav/a11y/perf/figure-signoff gate）。
