# 任務：第九批交叉查證（79 條「上一輪查無第二靜態源」的核心課綱事實）

這 79 條在 round-8 你保守留空（找不到兩個可重抓 publisher），**但事實本身多半正確**（國小/國中核心課綱：過去式-ed、句號、罪刑法定、科舉、食物六大類…）。問題出在**驗證器（urllib）抓不到台灣 gov／字典站／Cambridge/Oxford 的第二個靜態頁**。本輪請**改用驗證器能靜態重抓的 publisher**（各域清單見下），盡量把它們補成 ≥2 源。

## 鐵律（不變）
1. 正確性第一。2. 全繁體、零簡體、零 PRC 詞（用「中國」非「大陸」）；URL 不含簡體。3. 每 KP **≥2 個不同 publisher**（維基全家族＝1家；同一機構多頁＝1家）、verbatim quote 12–40 字、**取靜態純 HTML 頁**（避開 JS/登入牆/會逾時的頁）。4. 真的補不到第二個可抓源就再留 `refs:[]`+concern（不硬湊、不造假）。5. 查到過度簡化/過時/錯誤→concern 直說。

## 輸出：寫到（覆蓋）
```
/Volumes/workplace/EnglishTraining/english-vocab-deploy/authoring/sol_review/batch9_result.json
```
格式：`{"checks":{"<kp_id>":{"claim":"…","refs":[{"url":"…","publisher":"…","quote":"…"}],"concern":""}}}`

## 清單（79 條；<kp_id> | <中文標題>，依域分組，各域附「驗證器可抓 publisher」指引）

## soc-civ（23 條）
**避開 law.moj.gov.tw 與司法院 JS/登入牆頁**（驗證器抓不到）。改用能靜態重抓的：法律百科 www.legis-pedia.com、全國法規資料庫的純 HTML 條文鏡像若可抓、大學法律系/教科書公開 PDF、維基文庫法典（算維基家族=1家，需再配一個非維基）。概念型（三階層/物權債權區別）用法學公開教材 PDF。每 KP ≥2 不同 publisher。

soc-civ.t_adv.law.admin-disposition | 行政處分的意義與合法性要件
soc-civ.t_adv.law.crime-elements | 構成要件該當、違法性、有責性三階層概念
soc-civ.t_adv.law.criminal-procedure | 刑事訴訟流程（偵查、起訴、審判、執行）概念
soc-civ.t_adv.law.dispute-resolution | 調解、仲裁、訴訟等紛爭解決途徑比較
soc-civ.t_adv.law.family-law | 婚姻、親子與繼承的基本規範
soc-civ.t_adv.law.intent-negligence | 故意與過失、既遂與未遂
soc-civ.t_adv.law.liability-types | 無過失責任與過失責任、連帶責任
soc-civ.t_adv.law.property-obligation | 物權與債權的區別
soc-civ.t_adv.law.substantive-procedural | 實體法與程序法的區別
soc-civ.t_mid.law.capacity | 權利能力與行為能力（完全、限制、無行為能力人）
soc-civ.t_mid.law.contract-basic | 契約的成立與誠信原則
soc-civ.t_mid.law.crime-basic | 犯罪的成立要件概念與刑罰種類
soc-civ.t_mid.law.juvenile | 少年事件處理的保護精神與處遇
soc-civ.t_mid.law.legality | 罪刑法定原則
soc-civ.t_mid.law.minor-contract | 未成年人法律行為的效力（需法定代理人同意）
soc-civ.t_mid.law.norm-types | 法律與其他社會規範（道德、習俗、宗教）的區別
soc-civ.t_mid.law.public-private | 公法與私法的區分
soc-civ.t_mid.law.tort-basic | 侵權行為與損害賠償責任的概念
soc-civ.t_mid.rights.rights-generations | 人權的世代演進（第一代公民與政治權、第二代經濟社會文化權、第三代集體權）
soc-civ.t_sub.law.admin-discretion | 行政裁量與不確定法律概念
soc-civ.t_sub.law.civil-principles | 民法基本原則（私法自治、契約自由及其限制）
soc-civ.t_sub.law.justification | 阻卻違法事由（正當防衛、緊急避難）
soc-civ.t_sub.law.proportionality | 比例原則三階段（適當、必要、衡平）的適用

## eng（30 條）
**只用驗證器能靜態重抓的英文文法站**（避開 Cambridge/Oxford/British Council——它們對自動抓取回登入牆/逾時）：perfect-english-grammar.com、grammar-monster.com、englishclub.com、grammarly.com/blog/、dictionary.com、Purdue OWL owl.purdue.edu（靜態頁）。每 KP ≥2 個不同網域。若某文法點本身是台式過度簡化，concern 直說。

eng.t_adv.adjadv.comparison-ellipsis | 比較句的省略與平行（than I do）
eng.t_adv.adjadv.multiple-comparison | 倍數比較（twice/three times as…as）
eng.t_adv.adjadv.the-more-the-more | the + 比較級, the + 比較級（越…越…）
eng.t_adv.noun.double-possessive | 雙重所有格（a friend of mine）
eng.t_adv.pattern.sv-agreement | 主詞動詞一致（單複數/就近/集合名詞）
eng.t_adv.prep.others | 其他介系詞語意（about/of/for/against/despite）
eng.t_adv.pron.quantifier-agreement | 數量代名詞與動詞一致（both/either/neither/all/none/each）
eng.t_adv.pron.reciprocal | 相互代名詞（each other / one another）
eng.t_adv.special.apposition | 同位語
eng.t_adv.special.participial-active | 分詞構句（現在分詞表主動/同時）
eng.t_adv.subj.as-if | as if / as though 的假設語氣（與事實相反；亦有對比可能為真的直陳用法）
eng.t_adv.verb.used-to-family | used to / be used to / get used to 辨析
eng.t_base.phonics.hard-soft-cg | 硬軟 c/g（cat/city、go/giant）
eng.t_base.pron.possessive | 所有格形容詞 vs 所有格代名詞（my/mine）
eng.t_base.pron.subject-object | 人稱代名詞主格/受格
eng.t_base.verb.past-simple-regular | 過去簡單式（規則動詞 -ed）
eng.t_mid.adjadv.adjective-position | 形容詞位置（限定/敘述、前位/後位）
eng.t_mid.article.idiom | 冠詞慣用語（play the piano、go to school）
eng.t_mid.morph.prefix-negative | 否定/反義字首（un-/in-/im-/il-/ir-/dis-/non-）
eng.t_mid.noun.collective | 集合名詞
eng.t_mid.noun.noun-as-modifier | 名詞當形容詞修飾名詞
eng.t_mid.noun.same-form-plural | 單複同形（sheep/deer/fish）
eng.t_mid.noun.uncountable | 不可數名詞概念
eng.t_mid.phonics.kk-ipa | KK 音標／IPA 符號認讀與對應
eng.t_mid.pron.indefinite | 不定代名詞（some/any/no/every 複合字 someone/anything…）
eng.t_mid.pron.reflexive | 反身代名詞與強調用法（myself…）
eng.t_mid.relcl.who-whom | 關係代名詞 who/whom
eng.t_mid.special.tag-question | 附加問句（tag question）
eng.t_mid.vocab.health-illness | 健康與身體不適
eng.t_sub.special.perfect-participle | 完成式分詞構句（Having done…）

## sci（12 條）
**用 batch7 已證可抓的科學權威**：OpenStax openstax.org、LibreTexts、NASA、NOAA、USGS、genome.gov、HyperPhysics、Khan Academy。臺灣特定（我的餐盤/臺灣造山/食物六大類）：先用國際對等權威（USDA MyPlate、USGS 造山）＋在 concern 註明臺灣在地版本差異。每 KP ≥2 不同 publisher。

sci.t_adv.bio-ecology.limiting-factor | 說明限制因子與耐受範圍對族群分布的影響
sci.t_adv.earth-geomorph.sorting-rounding | 沉積物的淘選度反映搬運能量；圓磨度反映磨蝕程度/搬運歷史（非單純等同搬運距離）
sci.t_adv.earth-geomorph.terrace-uplift | 河階、海階地形記錄地殼抬升與海水面升降
sci.t_adv.earth-geotime.earth-history-events | 地球歷史重大事件序（生命起源→大氣大量含氧→恐龍興衰）排序
sci.t_adv.earth-tectonics.taiwan-orogeny | 臺灣造山運動：弧陸碰撞使地層褶皺、抬升形成中央山脈
sci.t_base.bio-biodiversity.sort-animals | 依特徵將動物簡單分類（有無脊椎、棲地、食性）
sci.t_base.bio-biodiversity.sort-plants | 觀察植物的多樣性並簡單分類
sci.t_base.bio-digestion.balanced-diet | 認識均衡飲食與食物六大類（我的餐盤）
sci.t_base.bio-life-levels.life-needs | 說出生物生存的基本需求（水、養分、適當的溫度與生活空間）；多數生物還需要空氣，綠色植物另需陽光來製造養分
sci.t_base.bio-plant-physiology.plant-parts | 辨識植物六大器官（根莖葉花果實種子）與功能
sci.t_mid.bio-digestion.food-tests | 以本氏液、碘液、蛋白質試劑、脂肪（紙上透光）檢測營養素
sci.t_mid.bio-ecology.succession | 說明生態演替（初級/次級）與顛峰群集

## chi（12 條）
**避開教育部舊版頁（字元宣告錯誤）與 Oxford**。改用能靜態重抓的：萌典 moedict（static JSON/HTML）、國家教育研究院 terms.naer.edu.tw、教育百科 pedia.cloud.edu.tw、中華郵政（信封格式）＋第二個獨立站。每 KP ≥2 不同 publisher（教育部系列算同家，需再配非教育部一個）。

chi.t_adv.classical.pianyi | 偏義複詞
chi.t_adv.lit.schools | 文學流派與主張
chi.t_adv.word.idiom-origin | 成語典故出處
chi.t_base.char.recognition-count | 常用字認讀與書寫累積量（國小畢業：認讀 2,700 字、其中 2,200 字能寫；課綱 Ab-III）
chi.t_base.punc.exclamation | 驚嘆號
chi.t_base.punc.period | 句號用法
chi.t_mid.classical.ancient-modern | 古今異義詞
chi.t_mid.classical.judgment-sentence | 判斷句（…者…也）
chi.t_mid.classical.passive-sentence | 被動句（為…所／見／於）
chi.t_mid.prac.envelope | 書信信封的直／橫式格式
chi.t_mid.prac.inscription | 題辭（婚喪喜慶用語）
chi.t_sub.gwrk.time-budget | 字數與時間分配：國寫無統一字數上限，逐題依題幹字數規定，於全卷時間內分配知性題與情意題兩大題

## soc-geo（1 條）
用 UNESCO/USGS/大學生態地理公開教材靜態頁；島嶼生物地理學用 OpenStax/LibreTexts Biology。≥2 不同 publisher。

soc-geo.t_sub.nat-soilbio.island-biogeo | 說明島嶼生物地理學（面積、隔離與物種數）

## soc-hist（1 條）
科舉/士紳：用學術公開 PDF、博物館教育頁、Britannica（若可抓）＋維基配一非維基；**防黨國史觀中性用詞**。≥2 不同 publisher。

soc-hist.t_sub.eastasia.examination-gentry | 科舉與士紳社會的專題探究
