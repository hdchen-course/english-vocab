# R14 teach 拆兩塊——`text` 說明段遷移契約（唯一標準，所有 agent 逐字遵守）

目標：把每個英語島單元 `teach` 陣列中 **`kind:"text"`** 段（目前是「中文講解＋內嵌英文」）
改成 **英文當教學媒介**：`body`＝清楚、簡單的英文說明；新增 `zh_hint`＝中文對照（預設收合、鼓勵先試英文）。
`kind:"example"` 段已由機械流程拆好（勿再動）。只處理尚無 `zh_hint` 的 `text` 段。

## 鐵律
1. **正確性第一**：英文 `body` 必須與原中文說明**教的文法事實完全一致**，不得新增/竄改規則、不得產生任何英文文法或拼寫錯誤。拿不準就保守、貼原意。
2. **`body` 一律英文**：**零 CJK**（不得有中文字、全形標點、全形空格）。用半形標點。術語用英文（relative pronoun / subject / object / base form / plural…）。
3. **難度分層（重要）**：
   - **core 文法單元（會考/學測級，unit_id 含 t_mid/t_adv 的文法 strand）**：`body` 可用簡單英文後設語言解釋規則（像 Swan/Cambridge learner 版的淺白句），句子短、單字淺（TOEIC 600–750 可讀）。
   - **國小口說/情境單元（greetings、food、animals… speaking 類）**：**不要堆英文文法術語**。`body` 用**情境說明＋例子**帶語感（例：`We say "Good morning" before noon, and "Good afternoon" after it.`）。寧可短、具體、用例句，不要抽象規則。
4. **`zh_hint` 用繁體中文**：把原本的中文說明放進來（可精簡、去重複），**零簡體、零 PRC 詞（中國，不用大陸）**。可保留內嵌英文片語。這是「看不懂才點開」的對照，不是主要教材。
5. **不得改動**：`kind`、`kp_ids`、`audio`、段落順序、practice／claims／selfeval／shadowing／任何 metadata。只改 `text` 段的 `body` 並**新增** `zh_hint`。
6. **JSON 合法**：字串用雙引號、必要時轉義；改完該檔必須能被 `json.load` 解析。

## 做法（逐檔逐 text 段）
原：`{"kind": "text", "kp_ids": [...], "body": "<中文講解…內嵌英文…>"}`
改：`{"kind": "text", "kp_ids": [...], "body": "<English teaching sentence(s)>", "zh_hint": "<繁體中文對照>"}`
用 Edit 對每個 `text` 段的那一行做字串替換（`kp_ids` 等保持原樣、順序不變）。

## 範例（已上線的 relwhat 作標準）
原 text body：`關係代名詞 what 的意思是『the thing(s) that…』。它本身已把先行詞包進去…：I believe what you said.（…）`
改：
- `body`: `'what' as a relative pronoun means 'the thing(s) that'. It already includes the noun, so no noun comes before it: I believe what you said. (= the thing that you said.)`
- `zh_hint`: `關係代名詞 what 的意思是『the thing(s) that（……的那個東西／那些事）』，本身已把先行詞包進去，所以前面不會再有一個名詞：I believe what you said.（我相信你說的話。）`

## 自我檢查（交回前）
- [ ] 每個 `text` 段都有 `zh_hint`，且 `body` 無任何中文字/全形字元。
- [ ] 英文文法/拼寫正確、與原教學事實一致、難度合該單元年段。
- [ ] 檔案 JSON 合法；example 段未被更動。
- 交回格式：逐檔一行 `<檔名>: done N text 段` 或 `<檔名>: 問題說明`。
