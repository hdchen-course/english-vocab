# 任務：第十一批交叉查證（41 條殘差；gate 已有 headless，law.moj/gov.tw/辭典可抓）

延續 round-10：驗證器有 headless fallback，law.moj.gov.tw/司法院/國健署/萌典皆可抓。**Cambridge/Oxford/British Council 仍不可用**（反機器人）。

## 鐵律
1. 正確性第一、用現行法/現行共識（成年18歲、投票20歲、國民法官2023施行、最低工資法2024）。2. 全繁體零簡體零 PRC 詞（「中國」非「大陸」）、URL 不含簡體。3. 每 KP **≥2 個不同 publisher**（維基全家族=1家、同機構多頁=1家；law.moj.gov.tw/judicial.gov.tw/legis-pedia.com 算 3 家）。
4. **quote 鐵律**：取**頁面穩定文字**（法條本文/辭典釋義/定義）12–40 字逐字；**嚴禁**訪客計數/更新日期/導覽列等動態或版面文字（驗證器重抓會不一致）。
5. 過度簡化/過時/錯誤→concern 直說；補不到 ≥2 可抓源→留 refs:[]+concern，不造假。

## 輸出：覆蓋寫到
```
/Volumes/workplace/EnglishTraining/english-vocab-deploy/authoring/sol_review/batch11_result.json
```
格式：`{"checks":{"<kp_id>":{"claim":"…","refs":[{"url":"…","publisher":"…","quote":"…"}],"concern":""}}}`

## 清單（41 條；<kp_id> | <中文標題>）

## soc-civ（9 條）
**這 9 條已經兩位獨立法律 reviewer 查現行法確認正確**，只差 cross_check 的 2 個可抓源＋逐字 quote。請用 law.moj.gov.tw 條文本文（例 民法/刑法/行政程序法相關條）＋ 司法院 cons.judicial.gov.tw 或 法律百科 legis-pedia.com（≥2 相異 host）。quote 取法條本文穩定句，勿取訪客計數/日期。

soc-civ.t_adv.law.admin-disposition | 行政處分的意義與合法性要件
soc-civ.t_adv.law.criminal-procedure | 刑事訴訟流程（偵查、起訴、審判、執行）概念
soc-civ.t_adv.law.substantive-procedural | 實體法與程序法的區別
soc-civ.t_mid.law.minor-contract | 未成年人法律行為的效力（限制行為能力人原則上須法定代理人同意，但純獲法律上利益或日常生活所必需者除外；無行為能力人之行為無效）
soc-civ.t_mid.rights.rights-generations | 人權的世代演進（第一代公民與政治權、第二代經濟社會文化權、第三代集體權）
soc-civ.t_sub.law.admin-discretion | 行政裁量與不確定法律概念
soc-civ.t_sub.law.civil-principles | 民法基本原則（私法自治、契約自由及其限制）
soc-civ.t_sub.law.justification | 阻卻違法事由（正當防衛、緊急避難）
soc-civ.t_sub.law.proportionality | 比例原則三階段（適當、必要、衡平）的適用

## eng（16 條）
**避 Cambridge/Oxford/British Council（反機器人）**；用 perfect-english-grammar.com／grammar-monster.com／englishclub.com／Purdue OWL owl.purdue.edu（靜態可抓）。≥2 相異 host、quote 取文法說明穩定句。

eng.t_adv.adjadv.comparison-ellipsis | 比較句的省略與平行（than I do）
eng.t_adv.adjadv.multiple-comparison | 倍數比較（twice/three times as…as）
eng.t_adv.adjadv.the-more-the-more | the + 比較級, the + 比較級（越…越…）
eng.t_adv.noun.double-possessive | 雙重所有格（a friend of mine）
eng.t_adv.pattern.sv-agreement | 主詞動詞一致（單複數/就近/集合名詞）
eng.t_adv.pron.quantifier-agreement | 數量代名詞與動詞一致（both/either/neither/all/none/each）
eng.t_adv.pron.reciprocal | 相互代名詞（each other / one another）
eng.t_adv.special.participial-active | 分詞構句（現在分詞表主動/同時）
eng.t_base.phonics.hard-soft-cg | 硬軟 c/g（cat/city、go/giant）
eng.t_base.verb.past-simple-regular | 過去簡單式（規則動詞 -ed）
eng.t_mid.article.idiom | 冠詞慣用語（play the piano、go to school）
eng.t_mid.noun.collective | 集合名詞
eng.t_mid.noun.same-form-plural | 單複同形（sheep/deer/fish）
eng.t_mid.phonics.kk-ipa | KK 音標／IPA 符號認讀與對應
eng.t_mid.vocab.health-illness | 健康與身體不適
eng.t_sub.special.perfect-participle | 完成式分詞構句（Having done…）

## sci（6 條）
OpenStax/LibreTexts/USGS/NOAA/NASA/genome.gov；臺灣特定用 國健署 hpa.gov.tw（headless 可抓）。quote 取定義穩定句。

sci.t_adv.bio-photosynthesis.calvin-cycle | 說明碳反應（卡爾文循環，舊稱暗反應）於基質固定 CO₂合成醣類
sci.t_adv.chem-bond.intermolecular | 分子間作用力（凡得瓦力/偶極/氫鍵）與沸點
sci.t_adv.earth-geomorph.sorting-rounding | 沉積物的淘選度反映搬運能量；圓磨度反映磨蝕程度/搬運歷史（非單純等同搬運距離）
sci.t_adv.earth-geotime.earth-history-events | 地球歷史重大事件序（生命起源→大氣大量含氧→恐龍興衰）排序
sci.t_adv.earth-tectonics.taiwan-orogeny | 臺灣造山運動：弧陸碰撞使地層褶皺、抬升形成中央山脈
sci.t_mid.chem-organic.carbon-idea | 有機化合物的概念與碳的特性

## chi（8 條）
萌典 moedict.tw ＋ 教育部辭典 dict.revised.moe.edu.tw ＋ 國教院 terms.naer.edu.tw / 教育百科（≥2 相異 host）。quote 取釋義穩定句。

chi.t_adv.classical.pianyi | 偏義複詞
chi.t_base.char.recognition-count | 常用字認讀與書寫累積量（國小畢業：認讀 2,700 字、其中 2,200 字能寫；課綱 Ab-III）
chi.t_mid.classical.ancient-modern | 古今異義詞
chi.t_mid.classical.judgment-sentence | 判斷句（…者…也）
chi.t_mid.classical.passive-sentence | 被動句（為…所／見／於）
chi.t_mid.prac.envelope | 書信信封的直／橫式格式
chi.t_mid.prac.inscription | 題辭（婚喪喜慶用語）
chi.t_sub.gwrk.time-budget | 字數與時間分配：國寫無統一字數上限，逐題依題幹字數規定，於全卷時間內分配知性題與情意題兩大題

## soc-hist（2 條）
學術公開 PDF／博物館教育頁／Britannica＋防黨國史觀；≥2 相異 host。

soc-hist.t_mid.taiwan.qing-land-feud | 清領前期的土地制度（大小租／一田多主）與分類械鬥
soc-hist.t_mid.taiwan.qing-trade | 清領前期的郊商與區域貿易網絡
