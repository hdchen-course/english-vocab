# 5-KP release-grade verify 蒐證（真實來源，2026-11-02）— 待 plumb 進 registry/ledger/promote
# 嚴禁杜撰；Cambridge/Oxford/Merriam-Webster 自動抓取皆 403，誠實僅用可抓到的 Longman+Wiktionary（2 相異 publisher）。

## eng.t_base.vocab.weather-nature（HIGH-RISK：含 typhoon/earthquake 安全相鄰 → 另需 ≥2 相異 reviewer）
- typhoon: Longman "a very violent tropical storm"｜Wiktionary "A severe tropical cyclone; an intense, rotating storm."
- earthquake: Longman "a sudden shaking of the Earth's surface that often causes a lot of damage"｜Wiktionary "A shaking of the ground, caused by volcanic activity or movement around geologic faults."
- storm: Longman "a period of very bad weather ... rain or snow, strong winds, and often lightning"｜Wiktionary "Any disturbed state of the atmosphere causing destructive or unpleasant weather ..."
- rainbow: Longman "a large curve of different colours ... when there is both sun and rain"｜Wiktionary "A multicoloured arch in the sky, produced by prismatic refraction of light within droplets of rain ..."
- flood: Longman "a very large amount of water that covers an area that is usually dry"｜Wiktionary "An overflow of a large amount of water (usually disastrous) ..."
- 結論：5 字皆 ≥2 相異 publisher、定義一致。URLs: ldoceonline.com/dictionary/<w>, en.wiktionary.org/wiki/<w>

## eng.t_mid.vocab.health-illness（HIGH-RISK 健康相鄰 → 另需 ≥2 相異 reviewer）
- fever: Longman "an illness or medical condition in which you have a very high temperature"｜Wiktionary "A higher than normal body temperature ... usually caused by disease."
- cough: Longman v."to suddenly push air out of your throat with a short sound"｜Wiktionary v."to force (something) out of the lungs or throat ..."
- headache: Longman "pain in your head"｜Wiktionary "(medicine) A pain or ache in the head."
- stomachache: Longman "pain in your stomach or near your stomach"｜Wiktionary "A pain in the abdomen ..."（教材採 Longman 泛指層級，不帶腸道解剖細節）
- sneeze: Longman "air suddenly comes from your nose, making a noise, e.g. when you have a cold"｜(Wiktionary quote 待補全)
- 結論：核心字 ≥2 相異 publisher、定義一致。

## 待 plumb 步驟（deliberate，勿鬆綁 high-risk floor）
1. source_registry.json 加 cross_check source entries（publisher/locator/accessed_at/evidence_method=cross_check/authority_class=cross_check/content_fingerprint=實抓 sha256-16/independent_refs≥2）。
2. fact_check_ledger.json 加 2 KP：scope_source_ids[]（英語 108 領綱 vocab 主題，需在 registry 找到/建 official scope）＋fact_source_ids[]（上述 cross_check）＋verified_by。
3. cross_check_gate.py 真抓取比對 quote 出現（Longman 可能 gate 端 403→若失敗則該來源不算、誠實留 unverified）。
4. HIGH-RISK：另跑 ≥2 相異 reviewer 簽核內容（floor 要求），記 reviews/。
5. promote_verified.py 重算→verified_overlay（綁當前 manifest_sha）；AC-KP-VERIFY gap 重算。
## chi 3 筆（recognition-count/time-budget/envelope）：待 verify-chi 官方來源交回。

## chi 3 筆（verify-chi 真實官方來源，2026-11-02）
### chi.t_base.char.recognition-count（信心高）scope＋fact 同為官方領綱（convention/policy 事實）
- 教育部/NAER 國語文領綱 PDF（/tmp/guoyuwen.pdf，pdftotext 抽）：
  「4-Ⅲ-1 認識常用國字至少 2,700 字，使用 2,200 字。」＋「Ab-Ⅲ-1 2,700 個常用字的字形、字音和字義。」「Ab-Ⅲ-2 2,200 個常用字的使用。」＋實施要點「第一到第三學習階段宜掌握基本識字量 2,700 字」（文件內三處佐證）
  URL: naer.edu.tw/upload/1/16/doc/806/...(語文領域─國語文).pdf
### chi.t_sub.gwrk.time-budget（信心高，惟「知性/情意」命名未取得官方逐字）
- 大考中心 115 國寫試卷: 「考試時間：90分鐘。請妥善分配作答時間。」「非選擇題共二大題」「共二大題，占 50 分」逐題字數（80字/400字…）URL ceec.edu.tw/.../07-115學測國寫試卷.pdf
- 114 國寫試卷跨年佐證: 同「90分鐘」「二大題」「50分」。URL ceec.edu.tw/.../07-114學測國寫試題.pdf
- ⚠「第一＝知性統整判斷／第二＝情意感受抒發」命名未取得官方逐字（考試說明頁 302 重導）→ KP2 fact 僅就「時間/二大題/逐題字數」驗；知性/情意命名**不宣稱 verified**（或 KP title 收斂到已證部分）。
### chi.t_mid.prac.envelope（信心高）中華郵政官方
- 直式 post.gov.tw ID=21001:「收件人姓名書於中央」「地址書於右側」「郵遞區號...右上角紅框」「寄件人...左下側」「郵票貼於左上角」
- 橫式 post.gov.tw ID=21002:「收件人地址姓名書於中央偏右」「寄件人...左上角」「郵遞區號...地址上方第1行」「郵票貼於右上角」
