# 已取得的真實權威來源快取（provenance；供 cross_check / 實作期逐字驗證）

> 這些是**真實下載**的權威資料，記錄 URL＋sha 供日後 cross_check 引用時綁定 fingerprint。
> 大檔不入 git（見 `.gitignore`）；保留壓縮檔與本記錄即可重現。

## 教育部《重編國語辭典修訂本》open data
- 檔案：`dict-revised.json.xz`（14,739,512 bytes）→ 解壓 `dict-revised.json`（80,300,977 bytes）
- 來源：g0v `moedict-data`（官方教育部辭典內容之 CC 散佈）
  `https://raw.githubusercontent.com/g0v/moedict-data/master/dict-revised.json.xz`
- 取得日：2026-10-27
- sha256(.xz) 前16碼：`5cc4ec0efd7e5496`
- 權威源頭：教育部國語推行委員會《重編國語辭典修訂本》
- 結構：JSON list，161,194 entries；每筆 `{title, radical(部首), stroke_count(筆畫),
  non_radical_stroke_count, heteronyms:[{bopomofo(注音), definitions:[{def,…}]}]}`。
- **用途**：實作期逐字事實驗證（某教學內容寫的 字→注音/部首/筆畫/釋義 是否與官方辭典一致）。
  **注意**：須掃 `heteronyms` 全部讀音，非只 `[0]`（例「日」`[0]`＝磾音 ㄇㄧˋ，常用 ㄖˋ 在其他 heteronym）。
- **非用途**：現階段 KP 為 inventory（概念 slug，無成句內容），多為概念/規則事實（詞性/修辭/句讀/文體），
  非單字查典即可定；那些走 cross_check(領綱+教科書/權威文法) 或實作後逐句驗。此資料集主要在實作期發揮。
