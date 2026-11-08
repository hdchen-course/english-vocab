# 單字大師（分級字庫）閃卡 BUILD SPEC（DRAFT v0.1 — 待 HD 審）

> 狀態：**DRAFT（spec-first）**。未達 content_audit 連續 5 clean ＋ 紅隊 ＋ HD 確認前不進實作。
> 單一事實來源：本檔。歸屬：`LEARNING_PATH_REBUILD_SPEC.md` 範疇內英語島「練習與應用」區的 **單字大師（分級字庫）** 入口（§0.4 階1 以該檔上位；本檔細化此入口）。
> 英文科鐵律沿用：R14 英文學英文（卡面英文、無中文教學）、自評不假裝自動批改、靜態站無後端（localStorage）、iPad Air 13 免捲動、R-STYLE 共用設計、edge-tts 音檔須真實存在可播、UI 中文一律繁體零簡體。
> 作者：english-vocab-deploy-65；引擎/IA 與 f1 對齊。

## 0. 目標
把既有 **COCA 10K Anki 牌組**（HD 自建，`/Volumes/workplace/EnglishTraining/Anki`）搬成站上「單字大師（分級字庫）」web 閃卡：**audio-first、雙向、三級自評、SRS**，並可依**分級面向篩選**出題（學 TOEIC 就只出 TOEIC 字…）。

## 1. 內容來源（直接重用，不重新產製內容；R3 可重現）
- **字卡事實**＝`Anki/data/cards.jsonl`（9,730 張 sense-aligned 卡）。每卡欄位：`rank, level(1–10), band(1k–10k), headword, pos, ipa_us, ipa_uk, sense_key, definition, collocations[{collocation, example}], audio_word, audio_examples[]`。
- **音檔**＝`Anki/audio/*.mp3`（edge-tts，內容定址檔名；word＋每例句各一檔）。web 端沿用同檔（複製進站上 asset 或共用路徑，部署時一併帶）。
- **定義與例句＝我們自撰**（Anki Pass-2 writer 產出、sense-aligned、對抗 review 過），非抄字典、無授權問題（HD 2026-11-08 定）。
- **搬運鐵律**：web 端只**轉格式**（jsonl→站上輕量 JSON／分級 shard），**不改事實**；改事實要回 Anki 來源改再 regen（防兩份漂移）。

## 2. 分級標籤（本案唯一「新增」工作：membership 比對層）
cards.jsonl 目前**只有 COCA 頻率 band，無** YLE/TOEIC/全民英檢/CEFR 標籤 → 新建一層 `tags`，逐 headword 比對權威字表產生，可重跑、禁造假。
- **標籤模型**：
  - `cefr`：**每字單一級** `A1|A2|B1|B2|C1|C2`（若某字多義分級不同，取該卡 `sense_key` 對應的級；無對應則標 `unclassified`、不假裝）。
  - `yle` / `toeic` / `gept`：**boolean membership**（一字可同時多標）；`gept` 另可細記 `gept_level`（初級/中級/中高級…）。
- **權威字表來源（候選；Phase 0 先驗證可取得＋授權＋可重現，不能取的誠實標 unmapped）**：
  | 面向 | 來源（候選） | 性質 |
  |---|---|---|
  | CEFR A1–C2 | English Vocabulary Profile（EVP）/ Oxford 3000-5000 CEFR / Cambridge | 逐字 CEFR 級 |
  | 全民英檢 GEPT | LTTC 官方參考字表（初級/中級…） | 官方 |
  | YLE | Cambridge Young Learners 官方字表（Pre-A1 Starters／A1 Movers／A2 Flyers，三級考試官方 PDF 字表）| 官方（HD 確認可取得）|
  | TOEIC | **ETS 無官方公開字表**（HD 確認）→ **決定用 TOEIC Service List（TSL, Browne & Culligan，學術開放）代用**，spec 明標為代用；未來若有官方來源可替換 | ⚠ 代用、已定 |
- **比對法（可重現、禁造假）**：headword lemma 正規化後對各清單做成員比對；產出 `tags` 寫回每卡；比對腳本進 bundle，`repro_gate` 重跑比對指紋一致才算數（仿學習路徑 §6.8.1 repro）。無法對應的字誠實留空、不亂塞。
- **決策已定（HD 2026-11-08）**：TOEIC → TSL 代用（明標）；YLE → 劍橋 Starters/Movers/Flyers 官方 PDF；CEFR/GEPT 照上表。

## 3. 卡片設計（鏡射 Anki `card_front.html`/`card_back.html`，HD 2026-11-08 定）
- **正面（front）**：**definition ＋ 例句（克漏字，單字挖空 `____`）**＝先看義、再回想字（符合「audio-first／回想產出」）。可 1–2 句 collocation 例句。
- **首字母提示（HD 2026-11-08 定）**：正面放一顆**可選**「💡 提示（首字母）」鈕——預設不洩漏（冷回想，desirable difficulty），卡住才點，點後顯示首字母＋字母數遮罩（如 `n _ _ _ _ _ _ _ _`）。**僅在 headword 長度 ＞2 時出現該鈕**（≤2 字母不給，提示無意義）。提示屬 per-card 暫態、不影響 SRS 評等。
- **翻面（back）**：**headword ＋ 音標（IPA us＋uk）＋ 完整例句（填回單字、可高亮）＋ 🔊 音檔**（word＋每例句，audio-first 可自動或點播）。
- **三級自評**（還不熟／快會了／會了）→ `srs_engine`（Leitner/SRS 主路徑）；**不自動批改**。
- 設計走 R-STYLE 房屋 token、iPad Air 13 免捲動、深色模式、WCAG AA；與站上其他頁一致（非自造 style）。

## 4. 練習流程（學習者旅程）
- **導覽模型（HD 2026-11-08 定）**：單字大師是**單層葉工具**，從英語島「練習與應用」區點入口**一層就到工具本身**，**不**做上面 22 教學分區那種多層 in-page drill-down（分區→單元清單→單元頁）。整頁含房屋 pshell 側欄（`你在哪裡`：🏠學習地圖＋←英語文 一層回上；`選分級`；`本回合`）；分級篩選在側欄，主欄只放卡片。
1. 入口「單字大師（分級字庫）」→ 選**要練的面向**：全部／CEFR 某級／YLE／TOEIC／全民英檢（可組合，如「TOEIC ∩ B1」）。
2. 系統從 COCA 10K master 篩出該子集 → 依 SRS 排程出卡（新字＋到期複習）。
3. 每卡：看正面（def＋克漏字）→ 自己回想 → 翻面對照（字/IPA/完整例句/發音）→ 三級自評 → SRS 更新。
4. 進度／SRS 狀態存 localStorage（never-disappear：穩定 id、additive、壞檔不重設——比照學習路徑 §7.1）。

## 5. 鐵律落地
- R14 英文學英文：卡面全英文、無中文教學；（如需任何中文僅限 UI chrome，繁體零簡體）。
- 自評不假裝自動批改發音/作答。
- 靜態站：無後端、無排行榜/雲端；全部 localStorage。
- 音檔：沿用 Anki edge-tts mp3，**每段文字對應音檔存在且可播**（verify gate：文字 hash↔音檔，孤兒/缺檔 FAIL）。
- 效能 R9：9,730 卡**不可**一次塞首屏——按面向/級別 shard 延遲載入（比照學習路徑 R9/ND）。

## 6. 團隊（roles-first，不 solo）
WRITERS（搬運＋標籤腳本＋web 引擎）＋ REVIEW：native-English、繁中校對（UI）、learning-neuroscience（SRS/排序/audio-first）、PM（旅程）、眼科/空間美感（卡面 iPad 免捲動）＋ 獨立對抗式 reviewer。

## 7. DONE-GATE（全過才算完成）
1. content_audit 連續 5 clean（本 spec 先；實作各檔再 clean）。
2. 標籤 membership **可重現**（repro_gate 重跑比對指紋一致）＋無造假（unmapped 誠實標）。
3. 音檔存在/可播 gate 綠（防漂移）。
4. 卡面正確性：definition↔例句↔headword sense 對齊（沿用 Anki R6 sense-alignment，抽樣 play-through）。
5. 簡體/PRC 詞掃描零命中（UI 中文）。
6. 視覺 QA iPad Air 13（front/back×日夜 render、四角色簽核綁 sha）。
7. SRS never-disappear 紅隊（壞檔/升版/清除匯入）。
8. code-download bundle（搬運＋標籤比對＋build 腳本＋README，乾淨解壓可重跑）。

## 8. 流程（spec-first，不可跳）
(1) 本 spec → (2) content_audit 5 clean → (3) 紅隊（標籤不可造假、篩選不可漏/混級、SRS 不可遺失）→ (4) HD 確認 → (5) 實作（一檔一檔、各自 clean）→ (6) DONE-GATE。

## 9. 待 HD 拍板
- [x] TOEIC 用 TSL 代用 → **是**（HD 2026-11-08，明標代用）。
- [x] CEFR 來源 → 我選可重現且授權乾淨者（HD 授權自決）。
- [x] YLE → 劍橋 Starters/Movers/Flyers 官方 PDF；GEPT → LTTC 官方（HD 確認）。
- [x] 首字母提示 → 可選鈕、僅 headword 長度 ＞2 時出現（HD 2026-11-08）。
- [x] 版面＋單層葉工具導覽 → HD 2026-11-08 看 demo 通過。
