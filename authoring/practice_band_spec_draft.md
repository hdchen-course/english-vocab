<!-- practice_band_spec_draft.md — 英語島「練習與應用」帶 BUILD SPEC 草案（PROPOSAL）
     Status: DRAFT PROPOSAL v0.1（2026-11-01）。NOT normative、NOT converged、NOT implemented。
     本檔為設計草案，供 team-lead 審 → content_audit → 紅隊 → 才折進 LEARNING_PATH_REBUILD_SPEC.md（唯一 normative）→ 才實作。
     與 normative spec 衝突一律以 LEARNING_PATH_REBUILD_SPEC.md 為準；本檔不得被實作碼直接引用為規範。
     撰寫對齊既有 spec 慣例：R 編號引用 LEARNING_PATH_REBUILD_SPEC.md §2，AC 引用其 §11.A。 -->

# 英語島「練習與應用」帶 — BUILD SPEC 草案（PROPOSAL）v0.1

> 本草案聚焦 HD 2026-11-01 新需求：**「單字大師」改採 Anki 源（`cards.jsonl` 10,000 筆）＋教 collocation（搭配詞）**。
> 唯一 normative 來源仍是 `LEARNING_PATH_REBUILD_SPEC.md`（下稱「主 spec」）。本檔只提規範「候選文字」，待折進主 spec 練習帶節後才具約束力。

---

## 0. 本草案的定位與 SOP（spec-first，不可跳序）

- 本檔是主 spec §6「學習路徑重構設計」底下、英語島「練習與應用」帶的**細化設計提案**，非獨立 spec。
- 流程（對齊主 spec §12 + R7 spec-first）：**(1) 本草案 → (2) team-lead 審 → (3) content_audit 跑到主 spec §12 的 5 連續 clean → (4) 紅隊證明「規範無法被繞過」→ (5) 折進主 spec 練習帶節（sha 變→收斂 streak 重跑）→ (6) HD 確認 → (7) 才實作、每檔走 DONE-GATE（§11.A）**。
- 現況前提（來自 `authoring/LEARNING_PATH_PROGRESS.md`）：主 spec 已定案、實作 Phase 0.5/1 進行中；練習帶**排在骨幹齊備後做**，本草案是「先記、暫不實作」的設計沉澱。

---

## 1. 範圍（Scope）

### 1.1 練習帶三區與本草案聚焦
主 spec §6.1 導覽層級中，英語島（`eng`）底下除既有 communicative 單元（Phase 2 Layer A）外，規劃一條**「練習與應用」帶**，含三區：

| 區 | 內容 | 本草案狀態 |
|---|---|---|
| A. **單字大師**（Vocab Master） | 以 Anki `cards.jsonl` 10,000 筆為源的分級單字＋collocation 教學、聽音優先、雙向、三級自評、SRS | **本草案聚焦** |
| B. **聽與寫**（Dictation） | 既有聽寫系列（`DICTATION_BUILD_SPEC.md`，已上線）在英語島的導覽掛載 | 標後續（只需導覽接線，引擎已存在） |
| C. **慣用語 / 搭配**（Collocation / Idiom 深練） | 以 collocation 為核心的進階練習（可與 A 區共源） | 標後續（A 區先確立 collocation 資料管線，C 區複用） |

- 本草案只細化 **A 區（單字大師，Anki 源）＋ collocation 教學**；B/C 僅標關係、不展開。
- 「單字大師」屬 `eng` domain 的練習模態，**不是** §4 知識點母體新增條目的來源（Anki 字表是練習素材，不改寫 `knowledge_points.json` 的 binding minimum；對映見 §8 開放問題 Q1）。

### 1.2 與英語島鐵律一致
依記憶 `english-island-approach-2026-10-31`：**語感 > 文法、聽寫＋跟讀＋語調模仿為核心練習模態**。單字大師須服從同一島治理：
- 聽音優先（audio-first）、learner 端零文法術語（沿用既有 english island 單元慣例）。
- collocation 教「一個字常和哪些字一起用」＝**語感／搭配內化**，非背規則；符合 R4（視覺化／可玩）與語感優先。

---

## 2. 資料管線（Anki → 站內衍生檔）

> 對齊主 spec §6.7「衍生資料產物與產生管線」＝每項定「檔 / schema / 產生者 / 何時 / 誰驗」；對齊 §6.7 鐵律「learner 前端不得直讀巨檔，一律讀預生成輕量衍生檔」。

### 2.1 來源（只讀，不改原始資料）
- `/Volumes/workplace/EnglishTraining/Anki/data/cards.jsonl`：**10,000 筆、單一檔、`group` 1–10 各 1,000**。每筆欄位（已驗證 2026-11-01）：
  `rank / level / band（如 "1k"）/ headword / pos / ipa_us / ipa_uk / sense_key / definition / collocations[] / audio_word / audio_examples[] / freq_order / group`；
  `collocations[]` 每項＝`{collocation（樣式字串，如 "a lot of"）, example（例句，如 "We spent a lot of money on repairs."）}`；**100% 卡片含 collocations**。
- `/Volumes/workplace/EnglishTraining/Anki/audio/`：**29,921 個 mp3**，內容 hash 命名；卡片以 `audio_word` / `audio_examples[]` 的檔名直接對應（已驗證前 500 筆引用 1,500 個 mp3，0 缺）。

### 2.2 衍生工具契約（提案；折進主 spec §6.7 產物清單）

| 檔 | 內容 / schema | 產生者 | 何時 | 驗證（提案 gate） |
|---|---|---|---|---|
| `src/vocab_anki_index.json`（**源快照，版控**） | `cards.jsonl` 的 committed 快照（比照 dictation `src/dk_index_us.json`：rebuild 讀快照、不抓 live，確保 R12 可重現） | 一次性複製、鎖檔 | 建置前一次 | 內容 sha 比對原檔（refresh 為刻意人工動作） |
| `src/vocab_cards_g{1..10}.json`（**分級 sidecar，一級一檔**） | 該 group 的卡片陣列，每筆 `{card_id, headword, pos, ipa_us, ipa_uk, sense_key, definition, collocations[], audio_word_key, audio_example_keys[], band, group, freq_order}`（**只取事實文字＋音檔鍵**；不含 Anki 內部 rank） | `tools/build_vocab_data.py`（提案） | 建置時 | `vocab_schema_gate`（提案；JSON Schema＋`card_id` 全域唯一＋音檔鍵存在性） |
| `vocab_nav_index.json`（**輕量導覽**） | 10 級的計數 / 進度概覽（不含 10,000 逐條），供 hub 首屏（§6.7 nav_index 慣例、R9/ND） | build 工具 | 建置時 | `AC-NAV`（首屏島≤12 / 可見節點≤15） |
| `audio/anki/<hash>.mp3`（**音檔資產**） | 自 Anki `audio/` 複製進站內資產目錄的被引用 mp3（去重，只複製 sidecar 實際引用者） | build 工具（複製，不經 TTS） | 建置時 | `vocab_audio_gate`（提案；每引用鍵存在、size>0、可解碼） |

**id 格式（對齊主 spec §4 opaque 穩定 id）**：`card_id` 提案格式 `eng.vocabmaster.g<N>.<headword-slug>[.<sense-suffix>]`（opaque 穩定字串、非 index；同 headword 多 sense 以 `sense_key` 衍生後綴區隔）。此為**練習素材 id**，與 §4 知識點 id 屬獨立識別空間。

### 2.3 音檔納入資產管線（R9 ＋ code-download）
- 被引用的 Anki mp3 **複製**進站內 `audio/anki/`（內容 hash 命名維持，天然去重）；**只複製 sidecar 實際引用者**（非全 29,921 個），控體積。
- **R9 白名單**：`audio/anki/*.mp3` 納入頁面可載入資產白名單（比照 dictation §10.2 的 `audio/*.mp3`）；按需延遲載入（分級 / 分頁，見 §6），不阻塞首屏。
- **code-download bundle（AC-CODE-DL）**：bundle 含源快照 `src/vocab_anki_index.json`＋build 工具＋sidecar＋README；因音檔是**複製**而非 TTS 重生，README 須說明音檔來源為 Anki 匯出資產（比照 dictation 的誠實記載）。
- **授權 / 來源正當性（誠實立場，比照 dictation §11）**：Anki 匯出為**使用者自有**；站內**只取單字事實文字＋使用者自有的音檔資產**。此立場須在折進主 spec 時由 HD 確認（見 §8 Q5），不得由實作自行放寬。

---

## 3. 學習模態（教 → 練 → 評，對齊英語島鐵律）

> 對齊主 spec §6.2 單元三段骨架、§6.2.2 單元內容 schema；對齊 R14（英文學英文、中文對照預設隱藏）、R3 自評不假裝自動判讀。

### 3.1 聽音優先（audio-first）
- 進卡**自動播** `audio_word`（沿用 dictation §2.5 的 iOS autoplay 解鎖策略：手勢鏈內同步 `play()`＋`_unlock.mp3`）；可重播、可切 us/uk（`ipa_us`/`ipa_uk` 與 `audio_word` 對應）。
- 預設**不顯示拼字**（真測驗）；中文…本島英文學英文（R14），故預設顯示英文 `definition`，中文對照為 optional、預設收合（若未來補中文釋義）。

### 3.2 雙向（英→義 / 義→英）
- 方向 A（recognition）：聽/看 headword → 回想意義／用法。
- 方向 B（production）：看 `definition`／情境 → 回想 headword 拼字（canvas 手寫或鍵盤 fallback，沿用既有 english island `unit.js` 的 canvas＋keyboard fallback）。
- 兩方向共用同一 SRS 卡但可各自計一次 retrieval（細節見 §8 Q3）。

### 3.3 三級自評、不自動判對錯（R3 精神）
- 揭曉畫面顯示**精確拼字＋音節／IPA（預設關）＋definition＋collocation 樣式與例句**；三級自評（還不熟／快會了／會了）→ 餵 `srs_engine`（`again/good/easy`）。
- **程式一律不對手寫／鍵盤輸入做對錯比對**（沿用 dictation R3＋主 spec §6.2「不假裝自動判讀」）；對錯由學習者看正解自判。

### 3.4 SRS（重用既有引擎，不另造）
- 重用 `assets/srs_engine.js`（`window.SRS`：`createStore(key)` / `buildSession(cards,{dailyNew})` / `rate(id,grade)`）。
- store key 提案（比照 dictation §7 的 per-系列/級/mode 唯一）：`vocab_g{N}_{dir}_v1`（`dir`∈`recog|prod`）。
- 進度與精熟接 `learning_progress_v1`（見 §4）。

### 3.5 collocation 教學（本需求核心）
- **呈現樣式**：每個 headword 的揭曉區列出其 `collocations[]`——「一個字常和哪些字一起用」的**搭配樣式**（如 `a lot of`）＋**例句**（如 "We spent a lot of money on repairs."）＋**例句發音**（`audio_examples[]` 對應的 mp3）。
- **教法（語感優先，非背規則）**：以「這個字常常跟這些字一起出現」的語感框架呈現，learner 端零文法術語；可用 collocation 克漏字練習（看例句挖空搭配詞→聽例句→三級自評），強化「不只背單字、而是學搭配」。
- **retrieval 設計**：至少一種練習讓 collocation 成為被回想的目標（符合 INV-3 記得牢、rubric⑦「真教真考」——若單元宣告教 collocation，就要有練習考它）。

---

## 4. 進度 / 獎勵（接既有 key，不自己發明）

> 對齊主 spec §6.3（`learning_progress_v1`）、§7（獎勵 never-disappear）。

- **進度**：接 `assets/learning_progress.js`（`window.LearningProgress`：`recordUnit(unitId,...)` / `islandCounts()`）；**不新增進度 key**、不寫入 `player_profile_v1`。單字大師的「單元」粒度見 §8 Q2（每級一單元？每級多單元？）。
- **獎勵**：里程碑（如「精熟 group N 全部卡片」「collocation 練習正確 N 次」）可透過 `window.Game` 發既有獎勵，落 `player_profile_v1`；**不自己發明 reward id**，一律走 §6.7 `reward_catalog.json` registry（新 badge 須先入 catalog＋baseline，否則 §6.7 grant-provenance gate FAIL）。
- **never-disappear**：進度與獎勵一律沿用 §7.1 三道保護（壞檔不重設／additive 合併／真實 migrate）＋ `safe_store.js`；匯出／匯入（RT-12）涵蓋單字大師進度。

---

## 5. 內容正確性（Anki definition / collocation 的查核）

> 對齊主 spec §6.8 / §6.8.1 四層證據＋各科驗證法；英文科驗證法＝字典＋語料庫＋母語者（§6.8 表）。

- **事實層**：Anki 卡片的 `headword / pos / ipa / definition / collocation / example` 屬英文語言事實；驗證法＝
  - 拼寫／詞性／詞義／IPA：查字典（Wiktionary dump／字典 API）；
  - collocation 道地性＋頻率：查語料（COCA 詞頻，repo 既有 `vocab_data_coca_*` 可對照）；
  - 例句自然度 / collocation 用法道地性：§8 #2 native-speaker 判（屬語言正確，走同一 `fact_check_ledger`）。
- **查核策略（10,000 字量；對齊 §6.8.1 存在性＋完整性，不可只抽樣假 clean）**：
  1. **全量機器查核**：所有 `headword` 拼寫、`pos` 合法值、`ipa` 非空、`definition` 非空、`collocations[]` 非空＋每項有 example＝確定性 gate（命中缺漏＝FAIL）。
  2. **語料交叉**：collocation 樣式對 COCA 做頻率存在性交叉（低頻 / 查無者 flag 待 native 判）。
  3. **分層抽樣 native 審**：按 `band`（1k/2k/…）分層抽樣送 §8 #2 native-speaker 判道地性；**high-risk 類（若 definition 涉安全／醫療語義）比照 §6.8.1 走 ≥2 reviewer**（一般單字非 high-risk）。
  4. 自寫欄（若補中文釋義／音節）另經語言 team 審（比照 dictation §10.5：書/源上沒有的欄位不能只對源）。
- **誠實分級（§0.2）**：Anki `definition` 的正確性無法對任意自由定義由機器完全判定（本質是字典比對＋native 誠實度）；此殘餘以「全量機器查核＋語料交叉＋分層 native 抽樣」最小化，不宣稱 10,000 條逐一 native 全審（除非 HD 要求全審，見 §8 Q6）。

---

## 6. UI / 裝置 / 效能

> 對齊主 spec §6.1 ND 漸進揭露、§10 四角色 viz QA、R9 效能、R-OPEN 不鎖定。

- **裝置基準**：iPad Air 13"（主 spec §3.1 + 視覺 QA 規則檔）；landscape 1366×1024 + portrait 1024×1366，http render。
- **四角色 viz QA（AC-VIZ-1）**：單字大師的選單 + 每個子畫面（聽音卡 / 揭曉卡 / collocation 展開 / 自評）逐張 render、四角色（美術 / 空間美感 / 眼科 / 動畫師）逐張簽核綁 sha。
- **無障礙（AC-A11Y-1）**：對比 ≥4.5:1、點擊目標 ≥44px、尊重 `prefers-reduced-motion`。
- **效能（R9 / AC-PERF-1）＝10,000 卡不可一次載入**：
  - learner 前端讀 `vocab_nav_index.json`（輕量）；進某級才按需 `fetch('src/vocab_cards_g<N>.json')`（分級分檔，一次一級 1,000 筆）。
  - 音檔延遲載（進卡才載該卡 mp3），不阻塞首屏。
  - 初始 JS ≤ 同類頁基準（AC-PERF-1 門檻）。
- **設計一致（AC-STYLE-1/2）**：只用 `app.css` token＋共用元件；collocation 展開、分級格等新視覺須先入共用設計系統並經美術＋空間美感簽核（R-STYLE-2），不得私有重造。

---

## 7. DONE-GATE（對映 §11.A AC）

單字大師單元 / 頁完成 ⟺ 下列 AC 全 PASS（登 `acceptance_ledger.json` 綁 sha）：

| AC | 本帶如何滿足 |
|---|---|
| AC-UNIT-1 / AC-UNIT-2 / AC-UNIT-3 | 每單元 10/10 rubric；每頁 content_audit 5 連續 clean；與英語島 golden 範本結構 diff（偏離須 `deviation_reason` enum＋簽核） |
| AC-SCHEMA | sidecar / 單元 JSON 合 §6.2.2 schema；`card_id`／`unit_id` 唯一、音檔鍵＋collocation 參照存在性 |
| AC-CORRECT | §5 查核：全量機器＋語料交叉＋native 抽樣；`(待核)`＝0 |
| AC-NAV | 首屏島≤12 / 可見≤15；無鎖定態；中文對照（若有）default-collapsed（R14） |
| AC-REWARD-1 | 里程碑 badge 走 `reward_catalog` registry；grant-provenance / never-disappear 全綠 |
| AC-VIZ-1 / AC-A11Y-1 / AC-PERF-1 / AC-STYLE-1/2 | §6 的 viz QA / 無障礙 / 按需載入 / 設計一致 |
| AC-LANG-1 | 全繁體零簡體零 PRC（頁面中文介面文字）；R14 英文為學習媒介；R15 若有中文術語附英語 |
| AC-NOBACKEND | learner 端＋獎勵模組零對外網路請求（音檔為同源 `audio/anki/` 靜態資產） |
| AC-CODE-DL | bundle 乾淨解壓可重建（音檔為複製資產，README 說明來源） |

**提案新增 gate（折進主 spec §6.7／§11.A 時建並紅隊）**：
- `vocab_schema_gate`：sidecar / card schema＋`card_id` 全域唯一＋音檔鍵與 collocation example 參照存在性。
- `vocab_audio_gate`：每引用音檔鍵存在、size>0、可解碼（比照 dictation 音檔 gate(a)）。
- `vocab_rebuild_equiv`（併入 AC-CODE-DL）：rebuild 讀源快照、不抓 live，輸出 `card_id` 集合＋音檔鍵與部署站等價。

---

## 8. 開放問題（待 HD 拍板）

> 這些是折進主 spec 前需 HD 定的設計分叉；在定案前以「待 HD」標記，不自行選定。

- **Q1 單字大師與既有 CEFR / dictation 字軌的關係**：Anki 10k 字軌與 `DICTATION_BUILD_SPEC.md` 系列 A（CEFR 字表）、既有 `vocab_data_cefr_*` 是**並行三軌**、還是**單字大師取代 CEFR 字軌**？（影響導覽是否出現重複字軌、以及 §1.1 B/C 區定位。）
- **Q2 單字大師的「單元」粒度**：以 `group`（1–10）為單元（10 個大單元，各 1,000 字）？還是每級再切子單元（如每 band 或每 50 字一單元）？影響 `learning_progress_v1` 的 `unit_id` 粒度與 hub 進度點密度（§6.3 / §6.2 R-GRAIN est_minutes≤12 的認知負荷界）。
- **Q3 雙向是否各自計一次 retrieval**：英→義與義→英是否各算一次 SRS review（兩個 store），還是同一卡雙面？影響 SRS 排程與「精熟」定義。
- **Q4 collocation 教學深度**：每個 headword 的 collocations 全部教（Anki 每筆數量不一），還是取前 N 個高頻？collocation 是否需要**獨立練習題型**（克漏字）還是只在揭曉區呈現？（影響 §1.1 C 區是否獨立成帶。）
- **Q5 Anki 音檔授權 / 來源正當性的誠實記載措辭**：比照 dictation §11 的誠實立場，HD 須確認「Anki 匯出為使用者自有、站內只取單字事實文字＋使用者自有音檔資產」的立場與公開部署範圍。
- **Q6 10,000 字是否全上、或分期**：一次全上 10 級，還是先上 group 1–3（高頻先）、其餘分期？以及 native 審是**全量**還是**分層抽樣**（§5 查核策略的強度，涉成本）。
- **Q7 中文釋義**：英語島 R14 英文學英文、中文對照預設隱藏；Anki 卡片目前**只有英文 definition**。是否需要補繁體中文對照（authored，另審），還是純英文 definition 即可？

---

## 9. 不在本草案內（明列防 scope creep）

- 不改 `LEARNING_PATH_REBUILD_SPEC.md`（normative）、不寫任何實作碼、不碰 Anki 原始資料、不 commit/push。
- 聽寫系列（B 區）引擎本身已上線，本草案不重設計其引擎，只標導覽掛載關係。
- 跨裝置自動同步（無後端，out of scope；匯出／匯入為唯一正當解，沿用 §7.1 / RT-12）。
- 後端 / 排行榜 / 雲端（§7.4 靜態站鐵律禁止）。
