# 任務：第十批交叉查證（92 條；gate 已升級，law.moj/gov.tw/辭典站現在抓得到）

**重大更新**：本輪前我們幫驗證器加了 **headless-Chrome fallback**。經實測：
- **law.moj.gov.tw（全國法規資料庫）條文、司法院 cons.judicial.gov.tw ＝ 可抓（HTTP 200）**——上一輪你以為被擋而留空的法律條文，其實都能驗證，**這次請大膽引用 law.moj 條文**。
- 國健署 hpa.gov.tw 等 gov.tw 憑證鏈不全頁 ＝ 驗證器現以 headless 可抓。
- 萌典 moedict.tw、教育部辭典 ＝ 可抓。
- **仍抓不到**：Cambridge/Oxford/British Council（真反機器人，headless 也不過）——這類**別用**，改用其他可抓的英文文法站。

## 鐵律
1. 正確性第一；用**現行法/現行共識**（成年18歲、投票20歲、國民法官2026上路…）。2. 全繁體、零簡體、零 PRC 詞（「中國」非「大陸」）、URL 不含簡體。3. 每 KP **≥2 個不同 publisher**（維基全家族＝1家、同機構多頁＝1家、但 law.moj.gov.tw 與 judicial.gov.tw 與 legis-pedia.com 算 3 家）。
4. **quote 鐵律（本輪新增、很重要）**：quote 必須是**頁面穩定文字**（法條本文、辭典釋義、定義說明），**12–40 字逐字**；**嚴禁**取「瀏覽人次/更新日期/麵包屑/導覽列」等**動態或版面文字**——驗證器會重新抓取比對，動態文字兩次不一致會判不命中。
5. 查到過度簡化/過時/錯誤→concern 直說。真的補不到 ≥2 可抓源→留 refs:[]+concern，不硬湊不造假。

## 輸出：覆蓋寫到
```
/Volumes/workplace/EnglishTraining/english-vocab-deploy/authoring/sol_review/batch10_result.json
```
格式：`{"checks":{"<kp_id>":{"claim":"…","refs":[{"url":"…","publisher":"…","quote":"…"}],"concern":""}}}`

## 清單（92 條；<kp_id> | <中文標題>，依域附可抓來源指引）

## soc-civ（51 條）
**gate 現在抓得到 law.moj！** 用 全國法規資料庫 law.moj.gov.tw（LawSingle.aspx 條文本文）＋ 司法院 cons.judicial.gov.tw ＋ 法律百科 legis-pedia.com（三者 host 相異＝可湊 ≥2）。quote **取法條本文或定義的穩定句**（例：罪刑法定「以行為時之法律有明文規定者」），**禁取訪客計數/更新日期/麵包屑等動態或版面文字**（gate 重抓會不一致）。現行法：成年18歲、投票20歲、國民法官2026。

soc-civ.t_adv.law.admin-disposition | 行政處分的意義與合法性要件
soc-civ.t_adv.law.appeal-litigation | 訴願與行政訴訟的程序與層級
soc-civ.t_adv.law.constitutional-complaint | 憲法訴訟與人民聲請釋憲／裁判憲法審查
soc-civ.t_adv.law.crime-elements | 構成要件該當、違法性、有責性三階層概念
soc-civ.t_adv.law.criminal-procedure | 刑事訴訟流程（偵查、起訴、審判、執行）概念
soc-civ.t_adv.law.dispute-resolution | 調解、仲裁、訴訟等紛爭解決途徑比較
soc-civ.t_adv.law.domestic-violence | 家庭暴力防治與保護令制度
soc-civ.t_adv.law.due-process | 正當法律程序與人身自由保障（提審、羈押）
soc-civ.t_adv.law.family-law | 婚姻、親子與繼承的基本規範
soc-civ.t_adv.law.gender-equality-law | 性別平等工作法與性別平等教育法的保障
soc-civ.t_adv.law.intent-negligence | 故意與過失、既遂與未遂
soc-civ.t_adv.law.labor-relations | 勞資關係與勞動三權（團結、協商、爭議）
soc-civ.t_adv.law.liability-types | 無過失責任與過失責任、連帶責任
soc-civ.t_adv.law.property-obligation | 物權與債權的區別
soc-civ.t_adv.law.sexual-harassment-law | 性騷擾防治三法的分工與適用（職場／校園／一般）
soc-civ.t_adv.law.substantive-procedural | 實體法與程序法的區別
soc-civ.t_adv.rights.intl-covenants | 兩公約（公民與政治權利、經濟社會文化權利）的內國法化
soc-civ.t_adv.rights.transitional-justice | 轉型正義的意義與面向
soc-civ.t_base.law.consumer-basic | 購物看清標示、保留發票、可退換貨初步
soc-civ.t_base.rights.my-rights | 認識自己擁有被照顧、受教育、被保護的權利
soc-civ.t_mid.law.admin-basic | 行政機關、行政行為與依法行政初步
soc-civ.t_mid.law.basic-duty | 人民基本義務（納稅、服兵役、受國民教育）
soc-civ.t_mid.law.basic-rights | 憲法保障的基本人權（自由權、平等權、受益權、參政權）
soc-civ.t_mid.law.capacity | 權利能力與行為能力（完全、限制、無行為能力人）
soc-civ.t_mid.law.constitution-status | 憲法作為國家根本大法的地位
soc-civ.t_mid.law.consumer-protection | 消費者保護法：定型化契約、猶豫期（鑑賞期）、商品責任
soc-civ.t_mid.law.consumer-remedy | 消費爭議的申訴與調解管道
soc-civ.t_mid.law.contract-basic | 契約的成立與誠信原則
soc-civ.t_mid.law.crime-basic | 犯罪的成立要件概念與刑罰種類
soc-civ.t_mid.law.equality-right | 平等權與禁止不合理差別待遇
soc-civ.t_mid.law.freedom-rights | 人身自由、言論、集會結社、宗教信仰等自由權
soc-civ.t_mid.law.juvenile | 少年事件處理的保護精神與處遇
soc-civ.t_mid.law.labor-basic | 勞動基準法基本保障（工時、基本工資、休假）
soc-civ.t_mid.law.law-hierarchy | 法律位階（憲法 > 法律 > 命令）與中央法規
soc-civ.t_mid.law.law-meaning | 法律的意義與功能（維持秩序、保障權利、解決紛爭）
soc-civ.t_mid.law.legality | 罪刑法定原則
soc-civ.t_mid.law.minor-contract | 未成年人法律行為的效力（需法定代理人同意）
soc-civ.t_mid.law.norm-types | 法律與其他社會規範（道德、習俗、宗教）的區別
soc-civ.t_mid.law.part-time-rights | 青少年打工的權益與勞動契約注意事項
soc-civ.t_mid.law.public-private | 公法與私法的區分
soc-civ.t_mid.law.remedy-ways | 權利受侵害時的救濟管道概念
soc-civ.t_mid.law.tort-basic | 侵權行為與損害賠償責任的概念
soc-civ.t_mid.rights.crc | 兒童權利公約四類權利（生存、發展、受保護、參與）
soc-civ.t_mid.rights.crc-principles | 兒童權利公約四大一般原則（不歧視、兒童最佳利益、生存與發展權、尊重兒童意見）
soc-civ.t_mid.rights.rights-generations | 人權的世代演進（第一代公民與政治權、第二代經濟社會文化權、第三代集體權）
soc-civ.t_sub.law.admin-discretion | 行政裁量與不確定法律概念
soc-civ.t_sub.law.citizen-judge | 國民法官制度的意義與運作
soc-civ.t_sub.law.civil-principles | 民法基本原則（私法自治、契約自由及其限制）
soc-civ.t_sub.law.justification | 阻卻違法事由（正當防衛、緊急避難）
soc-civ.t_sub.law.labor-dispute | 勞動爭議處理與不當勞動行為裁決
soc-civ.t_sub.law.proportionality | 比例原則三階段（適當、必要、衡平）的適用

## chi（13 條）
用 萌典 moedict.tw（釋義）＋ 教育部《重編國語辭典修訂本》dict.revised.moe.edu.tw（正確 dictView 連結）＋ 國教院 terms.naer.edu.tw / 教育百科 pedia.cloud.edu.tw（≥2 相異 host）。quote 取**釋義本文**穩定句。

chi.t_adv.classical.pianyi | 偏義複詞
chi.t_adv.lit.schools | 文學流派與主張
chi.t_adv.word.idiom-origin | 成語典故出處
chi.t_base.char.recognition-count | 常用字認讀與書寫累積量（國小畢業：認讀 2,700 字、其中 2,200 字能寫；課綱 Ab-III）
chi.t_base.punc.comma | 逗號用法
chi.t_base.punc.exclamation | 驚嘆號
chi.t_base.punc.period | 句號用法
chi.t_mid.classical.ancient-modern | 古今異義詞
chi.t_mid.classical.judgment-sentence | 判斷句（…者…也）
chi.t_mid.classical.passive-sentence | 被動句（為…所／見／於）
chi.t_mid.prac.envelope | 書信信封的直／橫式格式
chi.t_mid.prac.inscription | 題辭（婚喪喜慶用語）
chi.t_sub.gwrk.time-budget | 字數與時間分配：國寫無統一字數上限，逐題依題幹字數規定，於全卷時間內分配知性題與情意題兩大題

## sci（9 條）
用 OpenStax/LibreTexts/USGS/NOAA/NASA/genome.gov ＋ 臺灣特定（我的餐盤/六大類）用 國健署 hpa.gov.tw（gate 現以 headless 可抓其 SSL 頁）。quote 取定義/說明穩定句。

sci.t_adv.bio-photosynthesis.calvin-cycle | 說明碳反應（卡爾文循環，舊稱暗反應）於基質固定 CO₂合成醣類
sci.t_adv.chem-bond.intermolecular | 分子間作用力（凡得瓦力/偶極/氫鍵）與沸點
sci.t_adv.earth-geomorph.sorting-rounding | 沉積物的淘選度反映搬運能量；圓磨度反映磨蝕程度/搬運歷史（非單純等同搬運距離）
sci.t_adv.earth-geotime.earth-history-events | 地球歷史重大事件序（生命起源→大氣大量含氧→恐龍興衰）排序
sci.t_adv.earth-tectonics.taiwan-orogeny | 臺灣造山運動：弧陸碰撞使地層褶皺、抬升形成中央山脈
sci.t_base.bio-digestion.balanced-diet | 認識均衡飲食與食物六大類（我的餐盤）
sci.t_mid.bio-digestion.food-tests | 以本氏液、碘液、蛋白質試劑、脂肪（紙上透光）檢測營養素
sci.t_mid.chem-organic.carbon-idea | 有機化合物的概念與碳的特性
sci.t_sub.bio-photosynthesis.absorption-spectrum | 判讀光合色素的吸收光譜與作用光譜（紅/藍光最佳）

## eng（16 條）
**避開 Cambridge/Oxford/British Council（真反機器人，headless 也不過）**；用 perfect-english-grammar.com／grammar-monster.com／englishclub.com／Purdue OWL owl.purdue.edu（靜態可抓）。≥2 相異 host、quote 取文法說明穩定句；台式過度簡化在 concern 直說。

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

## soc-hist（3 條）
學術公開 PDF／博物館教育頁／Britannica（若可抓）＋防黨國史觀中性用詞；≥2 相異 host。

soc-hist.t_mid.taiwan.qing-land-feud | 清領前期的土地制度（大小租／一田多主）與分類械鬥
soc-hist.t_mid.taiwan.qing-trade | 清領前期的郊商與區域貿易網絡
soc-hist.t_sub.eastasia.examination-gentry | 科舉與士紳社會的專題探究
