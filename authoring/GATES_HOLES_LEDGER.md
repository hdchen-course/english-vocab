# Learning-path 驗證 gate — 已知漏洞 / 強化 ledger

仿 Sidewalk `GATES-MAINTENANCE.md`：任何 gate 都不算最終完工。每發現一個繞過（自己或紅隊），
立即記這裡並補一道子 gate＋紅隊（證明壞案例被擋），不要默默帶過。fail-closed 永遠優先。

## 開放中（open）

- **H-1 `no_grade_label_gate.py`：JS 注入的 learner 可見文字未掃。**
  - 類型：false-negative（漏報）。與 viz `textContent` 盲點同類。
  - 細節：gate 只掃「靜態 HTML learner 可見文字 + 可見屬性」，剝除 `<script>`。若年段字（如「三年級」）
    是由 JS 從資料陣列以 `textContent/innerHTML` 注入徽章/標籤，static scan 看不到。
  - 現況影響：legacy `index.html` 徽章牆（`#badge-grid`）為 JS 填充；目前資料用能力級（「第 1 級」）非年段，
    static 層乾淨。但 gate 不保證 JS 注入層。
  - 待補：實作重構時，(a) learner 可見年段一律不得存在於任何層；(b) 擴充 gate 解析頁面 JS 的
    字串字面量資料（或改以 headless render 後取 DOM 文字再掃），紅隊：JS 注入「六年級」徽章→必 DENY。
  - 狀態：OPEN（content 尚未重構；重構時一併補 render-after scan）。

## 已關閉（closed，附紅隊證據）

- **H-2 cross_check 無 re-fetch 驗證（可杜撰引文）→ 已關閉（2026-10-27）。**
  - 問題：`evidence_method=cross_check` 原本只有結構檢查（ledger_schema/promote 驗 ≥2 independent_refs），
    **沒人真的去確認來源支持該事實**——agent 若杜撰合理 URL＋引文，結構檢查照過（derivation 有 repro_gate 重跑，cross_check 當時沒有對應物）。
  - 修補：新增 `tools/verify/cross_check_gate.py`——逐 ref **真抓取**、確認登記的 `quote`（事實逐字依據）
    出現在抓到內容、且 ≥2 個**相異 publisher**；抓不到/quote 不符/來源不夠獨立＝FAIL。`--selftest` 離線 fixture 紅隊。
  - 紅隊（2026-10-27，`--selftest` PASS）：好例(2 獨立來源 quote 皆命中)→ALLOW；壞例 5 種全 DENY——只有 1 ref／quote 不在內容／死連結抓取失敗／publisher 同一家不夠獨立／缺 quote。
  - 待接線：第一個 cross_check 批產生時，把本 gate 接成 orchestrator `chk-cross-check-gate`（Phase 0，仿 chk-repro-gate）＋promote 要求通過。目前 0 筆 cross_check 來源，gate 空集 PASS。

## 原則
- gate 誤擋 → 修 gate 並紅隊（壞案例 DENY、好案例 ALLOW），不繞過。
- 每個 gate 必備 `--selftest`（qualification，證有牙）＋真 evidence 模式。
- 新發現繞過 → 當天記此檔 + 補子 gate + 紅隊，再繼續。

## 2026-10-27 H-3：wikisource/wiktionary 未塌成 wikimedia → 維基百科+維基文庫冒充 2 獨立來源
- 發現者：HD（質疑「wikimedia 可能錯」）。
- 洞：`cross_check_gate.host_publisher` 只塌 wikipedia/wikimedia/wikidata，未含 wikisource/wiktionary/wikibooks… → 維基百科＋維基文庫被算 2 個獨立 publisher，29 筆（13 chi.lit＋9 eng.t_adv＋7 chi 虛字/修辭）靠此過 host<2。
- 修補：host_publisher 把全部 Wikimedia 家族網域塌成單一 "wikimedia"。
- 紅隊：維基雙語/百科+文庫/辭典+教科書→1；維基+OpenStax、教育部+法規→2（PASS）。
- 處置：29 筆撤回 verified（2567→2538），改排 re-verify 用真權威（教育部辭典/成語典/台灣文學館/教科書、grammar 權威）。

## 2026-10-28 H-4：cross_check_gate 的 urllib 抓不到 JS-render／gov.tw 憑證鏈不全頁 → 正確事實無法驗證（HD 選項 A）
- 發現者：HD（「政府公開頁一定打得開，403 很可疑；可能 header 少/抓太頻/要 headless render」）。
- 診斷（實測，非臆測）：law.moj.gov.tw 刑法/民法條文 urllib **HTTP 200 可抓**（Sol 誤以為被擋、回 refs:[]）；司法院 cons.judicial 200；國健署 hpa.gov.tw ＝ **SSL CERTIFICATE_VERIFY_FAILED（憑證鏈不全，非 403）**；教育部辭典舊 URL 404（非封鎖）；Cambridge 403 ＝ 真反機器人（Cloudflare 安全驗證，headless 也不過）。→ 結論：soc-civ 法律卡住主因是 **Sol 沒引用其實可抓的 law.moj**，次因是少數 gov.tw 憑證鏈／JS-render 頁 urllib 抓不到。
- 修補：新增 `tools/verify/js_fetch.mjs`（持久化 headless-Chrome，`--ignore-certificate-errors` 僅為讀 gov.tw 不全鏈**公開**頁、只回文字從不送資料）＋ `cross_check_gate` 加 `_JsFetcher`：**僅在 urllib 對某 ref 例外/SSL 失敗/quote 未命中時才 fallback headless**，再比對 quote。**≥2 相異 publisher＋逐字 quote 邏輯完全不變**（不弱化）；Cambridge 類反機器人頁 headless 取得的是安全驗證頁、不含 quote → 照樣 DENY（§1.3 不破反機器人）。
- 紅隊：(a) `--selftest` 原 6 例全綠 ＋ 新 2 例：headless 救回真 quote（urllib 死連結）→ALLOW、headless 抓到頁但無該 quote（反機器人/杜撰）→仍 DENY。(b) **live 紅隊**（真實頁）：law.moj(urllib)＋國健署(urllib SSL 失敗→headless 救回真 quote「營養及健康飲食」) 好例→ALLOW；國健署 quote 改杜撰→DENY。另驗證 gate 正確拒絕**動態文字**（訪客計數/更新日期）當 quote（兩次抓取值不同→不match），逼 quote 取穩定本文。
- 餘留：Cambridge 等商業反機器人站不採（用替代可抓源）；quote 必取**穩定頁面文字**（法條本文/定義/標題），非動態計數。
