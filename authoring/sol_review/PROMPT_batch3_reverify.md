# 任務：第三批（重驗 35 條——原靠維基單源或引文沒比中者，改用真權威）

同前規則：fail-closed gate 會真抓你給的每個 URL、逐字比對 quote（且**維基百科/維基文庫/維基辭典全算同一家 publisher**，故不能用兩個維基當兩個來源）。這 35 條是：
- **29 條**先前只有「維基百科＋維基文庫」被撤回（違「≥2 真獨立來源、≥1 非維基」）；
- **6 條**先前引文重抓對不上（多半來源是 JS 動態頁）。

請改用**非維基的真權威**、且 quote 取自**靜態可抓**頁面：
- **chi 文學史/文體（lit.*）/文言虛字(xu-*)/使動意動/修辭(huwen 互文、imagining)**：教育部《重編國語辭典》 https://dict.revised.moe.edu.tw/ 、教育部《成語典》 https://dict.idioms.moe.edu.tw/ 、國家教育研究院《雙語詞彙》、台灣文學館、或**大學中文系公開課程/教科書 PDF**；文學史分期與代表作可用大學開放課程講義。**勿用維基**（算同一家、且可編輯）。
- **chi 標點(punc.comma/period/exclamation/quotation)**：教育部《重訂標點符號手冊》修訂版 https://language.moe.gov.tw/ （官方標點定義，靜態頁，逐字引）。
- **eng 文法(adjadv/advcl/morph/nonfinite/noun)**：Cambridge Dictionary/Grammar https://dictionary.cambridge.org/grammar/ 、Merriam-Webster、British Council LearnEnglish、Purdue OWL https://owl.purdue.edu/ （權威、靜態）；**兩個不同 publisher**。
- **eng.t_mid.vocab.health-illness（健康/疾病字彙）**：Cambridge/Merriam-Webster 詞條（逐字取釋義）。
- **life.safety.traffic.drunk-driving（酒駕/疲勞駕駛危害）**：WHO https://www.who.int/ 、NHTSA https://www.nhtsa.gov/ 、台灣交通部道安資訊；取靜態頁逐字句。

## 鐵律（同前）
1. 正確性第一（教小孩、教錯害人）。2. 全繁體、零簡體、零 PRC 詞；**URL 路徑亦不得含簡體字**。3. 每 KP ≥2 個**不同 publisher**（維基家族全算一家、不可當兩源）、quote 為該頁逐字原文 12–40 字。4. 查無源留 refs:[]+concern，**不硬湊假連結**。

## 輸出：寫到（覆蓋）
```
/Volumes/workplace/EnglishTraining/english-vocab-deploy/authoring/sol_review/batch3_result.json
```
JSON 格式同前：{"checks":{"<kp_id>":{"claim":"…","refs":[{"url","publisher","quote"},…],"concern":""}}}

## 清單（35 條；<kp_id> | <中文標題>）
eng.t_adv.adjadv.comparison-ellipsis | 比較句的省略與平行（than I do）
eng.t_adv.adjadv.confusable-pairs | 易混形副（hard/hardly、late/lately、near/nearly）
eng.t_adv.adjadv.multiple-comparison | 倍數比較（twice/three times as…as）
eng.t_adv.adjadv.the-more-the-more | the + 比較級, the + 比較級（越…越…）
eng.t_adv.advcl.purpose-result | 目的/結果副詞子句
eng.t_adv.morph.conversion | 轉品（water/to water 名動互轉）
eng.t_adv.morph.latin-greek-roots | 拉丁希臘字根（spect/port/dict/ject/vert/scrib/tele/bio/geo/graph）
eng.t_adv.nonfinite.subject-of-infinitive | 不定詞意義主詞（for sb to / of sb to）
eng.t_adv.noun.double-possessive | 雙重所有格（a friend of mine）
chi.t_adv.classical.xu-yan | 「焉」：兼詞（於之）／語氣／疑問代詞
chi.t_adv.classical.xu-yi2 | 「矣」：表完成／語氣
chi.t_adv.classical.xu-zai | 「哉」：感嘆／反問語氣
chi.t_adv.lit.ancient-modern-verse | 古體詩與近體詩之別
chi.t_adv.lit.ci-schools | 詞：婉約派與豪放派
chi.t_adv.lit.ci-tune | 詞：詞牌／詞調／長短句
chi.t_adv.lit.classic-source | 經典出處（四書五經／諸子）辨識
chi.t_adv.lit.hist-mingqing | 文學史：明清（章回小說／八股文）
chi.t_adv.lit.hist-preqin | 文學史：先秦（詩經／楚辭／諸子散文）
chi.t_adv.lit.hist-song | 文學史：宋（詞／古文／話本）
chi.t_adv.lit.hist-tang | 文學史：唐（詩／傳奇／古文運動）
chi.t_adv.lit.hist-weijin | 文學史：魏晉南北朝（建安／田園／山水／志怪）
chi.t_adv.lit.hist-yuan | 文學史：元（曲／雜劇）
chi.t_adv.lit.jinti-parallel | 近體詩格律：對仗（頷聯、頸聯）
chi.t_adv.lit.jinti-pingze | 近體詩格律：平仄
chi.t_adv.classical.causative | 詞類活用：使動用法
chi.t_adv.classical.putative | 詞類活用：意動用法
chi.t_adv.rhet.imagining | 示現（追述／預言／懸想）
chi.t_adv.lit.tang-song-eight | 唐宋古文八大家
chi.t_adv.rhet.huwen | 互文（文言互文見義）
chi.t_base.punc.comma | 逗號用法
chi.t_base.punc.exclamation | 驚嘆號
chi.t_base.punc.period | 句號用法
chi.t_base.punc.quotation | 引號（直接引語／強調／口語篇名）
eng.t_mid.vocab.health-illness | 健康與身體不適
life.safety.traffic.drunk-driving | 酒駕/疲勞駕駛危害的概念（勸阻家人）
