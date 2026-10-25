# 英文聽寫（Dictation）— 完整可執行＋可驗證原始碼

這是「英文聽寫」功能（DK《5 Words a Day》單字日軌）的完整原始碼，解壓後可重建整個頁面與音檔，並通過所有 gate。規範見 `DICTATION_BUILD_SPEC.md`。

## 內容
```
DICTATION_BUILD_SPEC.md          規範（單一事實來源）
english_dictation.html           頁面 hub
dictation.css                    頁面樣式（dct-*）
src/dictation.ts                 引擎（→ dictation.js）
src/dict_data_dk.ts              由 build 生成（→ window.DICT_DK；可重生）
src/dict_items_dk.json           sidecar（meta.expectedAudioCount + items；可重生）
src/dk_index_us.json             DK 字源「版控快照」（rebuild 讀此、不抓 live）
src/dict_authored_dk.json        自寫欄 zh/syll/ipa/pos（keyed by authKey）
src/dict_slug_overrides_dk.json  per-series slug 碰撞後綴（keyed by 原始 word）
src/dict_us_uk.json              US↔UK 對照（填 ukSpelling）
tools/build_dk_data.py           字源轉檔
tools/gen_dict_audio.py          edge-tts 音檔管線
tools/dict_audio_gate.py         音檔 gate (a)-(e)
tools/dict_render_gate.mjs       iPad-13 render gate（R7）
tools/dict_r3_gate.mjs           R3 不批改 行為 gate（8b）
assets/app.css game_core.css game_core.js assets/srs_engine.js   共用 house 層
audio/_unlock.mp3                iOS autoplay 解鎖用「靜態靜音資產」（不由 build 重生）
```

## 需求
- Node.js（TypeScript 5.x，用於 `tsc`）
- Python 3.10+ 的虛擬環境，安裝 **`edge-tts==7.3.1`**（重建音檔需連網）
  ```
  python3 -m venv .venv
  .venv/bin/python -m pip install "edge-tts==7.3.1"
  ```
- edge-tts voices：`en-US-AriaNeural`（美）、`en-GB-SoniaNeural`（英）

## 重建步驟
```bash
# 1a) DK 資料（讀版控快照 src/dk_index_us.json，不抓 live CloudFront → 確定性）
.venv/bin/python -I tools/build_dk_data.py
#    → src/dict_data_dk.ts + src/dict_items_dk.json（1081 item、1035 相異 audioSlug）

# 1b) 系列 A（CEFR）單字軌：讀版控 src/cefr_words_{a1,a2,b1}.json（站內字表的字，事實）
.venv/bin/python -I tools/build_cefr_data.py
#    → src/dict_data_cefr_{a1,a2,b1}.ts + src/dict_items_cefr.json（1399 item、1350 相異 audioSlug）
#    （例句軌 B 期延後：需 src/dict_authored_cefr.json 自寫例句 + 6-lens team 審）

# 2) 編譯 TS → JS（dictation.js / dict_data_dk.js / dict_data_cefr_*.js）
npm run build:legacy

# 3) 音檔（edge-tts；讀全部 dict_items_*.json 的 .items 聯集；冪等，已存且 .sha 相符則跳過）
.venv/bin/python -I tools/gen_dict_audio.py
#    → audio/word_dict_dk_*（2070）+ audio/word_dict_cefr_*（2700）+ audio_manifest.json + 共置 .sha
```

## 驗證（gate）
```bash
# 音檔 gate（存在/可解碼/text_sha/slug 1:1/抽樣實聽/逐 series 六鍵計數）
.venv/bin/python -I tools/dict_audio_gate.py          # exit 0 = PASS

# 本機 server + iPad-13 render gate（canvas+控制列同屏）＋ R3 不批改行為 gate
python3 -m http.server 8902 &
SDA_BASE=http://localhost:8902 node tools/dict_render_gate.mjs   # exit 0 = PASS
SDA_BASE=http://localhost:8902 node tools/dict_r3_gate.mjs       # exit 0 = PASS
```

## 鐵律（摘要；全文見 SPEC §1）
- **R3 不批改**：程式一律不判定答案對錯（手寫或鍵盤皆然）；翻答案自評 → SRS。引擎**從不**讀取輸入做對錯比較。
- **R4 音檔真實**：每檔為 edge-tts 實際產生；word 軌兩腔皆合成 US headword，`ukSpelling` 只 reveal 顯示。
- **R5 對書**：DK 出貨週單字 100% 對書逐字；只取單字文字（事實），不重製 DK 例句/插圖/音檔。
- **R9/R10**：runtime 無外部資產（house 層的 Ko-fi FAB 為全站既有例外）；store key 以 `dict_` 命名空間隔離。
- **R11/R12**：一切可由版控輸入重生；clean rebuild 的 item id 集 + 音檔鍵須與部署站等價。

## 合法性
見 SPEC §11：公開 CloudFront 靜態 JSON 只取單字文字（事實）；使用者擁書、為對照該書練習、接受公開部署；不重製 DK 的例句/插圖/編排說明文字/音檔。若 DK 要求下架，移除 `src/dict_data_dk.*` 即可。
