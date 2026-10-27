# 任務：第八批交叉查證（140 條殘差硬事實；soc-civ/sci/eng/chi/soc-hist/soc-geo）

同前規則：fail-closed gate 會**真抓每個 URL（urllib re-fetch）、逐字比對 quote（12–40 字）**；維基全家族算同一 publisher，故每 KP 需 **≥2 個不同 publisher**。查無可靠源留 `refs:[]`+concern，**不硬湊**。

## 鐵律（correctness-first）
1. 正確性第一（教小孩、教錯害人）。2. 全繁體中文 claim/concern、**零簡體、零 PRC 詞**（用「中國」非「大陸」）；URL 不得含簡體字。3. 每 KP ≥2 不同 publisher、verbatim quote 取靜態可抓頁面。4. 用**現行法/現行科學共識**，勿用過時數字或已廢模型。5. 若查到標題或教法有誤（過時、過度簡化、黨國史觀、台式英語迷思…），在 `concern` **直說**（gate 會據此排除不放行，記入 backlog 待修）。

## 各域權威來源與注意點
（見下方每域標頭）

## 輸出：寫到（覆蓋）這個檔
```
/Volumes/workplace/EnglishTraining/english-vocab-deploy/authoring/sol_review/batch8_result.json
```
JSON 格式：`{"checks":{"<kp_id>":{"claim":"…","refs":[{"url":"…","publisher":"…","quote":"…"}],"concern":""}}}`

## 清單（140 條；<kp_id> | <中文標題>）

## soc-civ（61 條）— 法律/制度類→全國法規資料庫 law.moj.gov.tw、司法院、中選會、教育部；務必用**現行法**（投票權20歲、國民法官2026上路、不信任案/倒閣、三代人權…），勿用過時數字。

soc-civ.t_adv.economy.movement-shift | 沿線移動與整條曲線移動的區別
soc-civ.t_adv.global.regional-integration | 區域組織與區域整合（如歐盟）的運作
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
soc-civ.t_adv.politics.accountability | 行政向立法負責的機制（質詢、不信任案／倒閣；信任投票為內閣制之對照）
soc-civ.t_adv.rights.intl-covenants | 兩公約（公民與政治權利、經濟社會文化權利）的內國法化
soc-civ.t_adv.rights.transitional-justice | 轉型正義的意義與面向
soc-civ.t_adv.self.looking-glass | 「鏡中自我」與「概括化他人」等自我形成理論
soc-civ.t_base.law.consumer-basic | 購物看清標示、保留發票、可退換貨初步
soc-civ.t_base.politics.local-service | 認識鄉鎮市區與社區公共服務（里長、公所）
soc-civ.t_base.rights.my-rights | 認識自己擁有被照顧、受教育、被保護的權利
soc-civ.t_mid.economy.market-role | 市場機制（價格機能）的協調功能
soc-civ.t_mid.economy.money-function | 貨幣的功能（交易媒介、價值衡量、價值儲存）
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
soc-civ.t_mid.politics.president-premier | 總統與行政院長產生方式與角色
soc-civ.t_mid.rights.crc | 兒童權利公約四類權利（生存、發展、受保護、參與）
soc-civ.t_mid.rights.crc-principles | 兒童權利公約四大一般原則（不歧視、兒童最佳利益、生存與發展權、尊重兒童意見）
soc-civ.t_mid.rights.rights-generations | 人權的世代演進（第一代公民與政治權、第二代經濟社會文化權、第三代集體權）
soc-civ.t_sub.economy.govt-failure | 政府失靈的概念與成因
soc-civ.t_sub.economy.monetary-policy | 公開市場操作、重貼現率、存款準備率的運作
soc-civ.t_sub.law.admin-discretion | 行政裁量與不確定法律概念
soc-civ.t_sub.law.citizen-judge | 國民法官制度的意義與運作
soc-civ.t_sub.law.civil-principles | 民法基本原則（私法自治、契約自由及其限制）
soc-civ.t_sub.law.justification | 阻卻違法事由（正當防衛、緊急避難）
soc-civ.t_sub.law.labor-dispute | 勞動爭議處理與不當勞動行為裁決
soc-civ.t_sub.law.proportionality | 比例原則三階段（適當、必要、衡平）的適用

## sci（31 條）— OpenStax、LibreTexts、NIST、NASA、NOAA、USGS、HyperPhysics、genome.gov、WHO；避免過時模型（道爾頓僅歷史、暗反應→碳反應、中心粒9三聯體非9+2）。

sci.t_adv.bio-cell-structure.centriole-cilia | 區分中心粒／基體（9三聯體）與纖毛/鞭毛軸絲（9+2）的微管結構與運動功能
sci.t_adv.bio-ecology.limiting-factor | 說明限制因子與耐受範圍對族群分布的影響
sci.t_adv.bio-photosynthesis.calvin-cycle | 說明碳反應（卡爾文循環，舊稱暗反應）於基質固定 CO₂合成醣類
sci.t_adv.chem-bond.intermolecular | 分子間作用力（凡得瓦力/偶極/氫鍵）與沸點
sci.t_adv.earth-geomorph.grain-size-velocity | 以流速—顆粒關係（侵蝕/搬運/堆積臨界流速）分析沉積作用
sci.t_adv.earth-geomorph.sorting-rounding | 沉積物的淘選度反映搬運能量；圓磨度反映磨蝕程度/搬運歷史（非單純等同搬運距離）
sci.t_adv.earth-geomorph.terrace-uplift | 河階、海階地形記錄地殼抬升與海水面升降
sci.t_adv.earth-geotime.earth-history-events | 地球歷史重大事件序（生命起源→大氣大量含氧→恐龍興衰）排序
sci.t_adv.earth-geotime.original-horizontality | 原始水平定律與地層後期變形（褶皺、傾斜）的解讀
sci.t_adv.earth-hydrology.land-subsidence | 超抽地下水導致地層下陷與海水入侵
sci.t_adv.earth-ocean.gyre-coriolis | 科氏力與風共同造成大洋環流（渦旋 gyre）及西方強化
sci.t_adv.earth-ocean.thermocline-pycnocline | 海水垂直結構：混合層、斜溫層、深層與密度分層
sci.t_adv.earth-ocean.wave-motion | 深水波中水質點作圓周運動、波形傳遞能量而水不隨波前進
sci.t_adv.earth-tectonics.taiwan-orogeny | 臺灣造山運動：弧陸碰撞使地層褶皺、抬升形成中央山脈
sci.t_base.bio-biodiversity.sort-animals | 依特徵將動物簡單分類（有無脊椎、棲地、食性）
sci.t_base.bio-biodiversity.sort-plants | 觀察植物的多樣性並簡單分類
sci.t_base.bio-digestion.balanced-diet | 認識均衡飲食與食物六大類（我的餐盤）
sci.t_base.bio-life-levels.life-needs | 說出生物生存的基本需求（水、養分、適當的溫度與生活空間）；多數生物還需要空氣，綠色植物另需陽光來製造養分
sci.t_base.bio-plant-physiology.plant-parts | 辨識植物六大器官（根莖葉花果實種子）與功能
sci.t_base.bio-reproduction.animal-babies | 知道動物會繁殖後代，有些動物的親代會照顧幼體
sci.t_base.earth-quake-volcano.volcano-basic | 火山噴發會噴出熔岩（岩漿噴出地表後稱熔岩）、火山灰與氣體
sci.t_mid.bio-digestion.food-tests | 以本氏液、碘液、蛋白質試劑、脂肪（紙上透光）檢測營養素
sci.t_mid.bio-ecology.biomes | 認識主要陸域生物群系（熱帶雨林/沙漠/草原/苔原等）與氣候
sci.t_mid.bio-ecology.succession | 說明生態演替（初級/次級）與顛峰群集
sci.t_mid.bio-life-levels.characteristics-list | 列舉生物的共同特徵：生長發育、新陳代謝、感應、生殖、遺傳、演化、恆定
sci.t_mid.bio-respiration.resp-vs-photo | 比較呼吸作用與光合作用（原料/產物/能量/場所）之互補
sci.t_mid.chem-organic.carbon-idea | 有機化合物的概念與碳的特性
sci.t_mid.chem-redox.oxid-reduc-idea | 氧化與還原的概念（得氧失氧/燃燒）
sci.t_sub.bio-evolution.phylogenetic-tree | 判讀親緣（演化）樹與共同祖先關係
sci.t_sub.bio-photosynthesis.absorption-spectrum | 判讀光合色素的吸收光譜與作用光譜（紅/藍光最佳）
sci.t_sub.phys-optics.em-spectrum | 電磁波譜與光的電磁波本質

## eng（30 條）— Cambridge Dictionary+Grammar、Merriam-Webster、British Council、Purdue OWL；破除台式英語迷思（between/among 非數量二分、which 可限定、KK≠IPA、some/any 非肯否二分）。

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

## chi（14 條）— 教育部《重編國語辭典修訂本》dict.revised.moe.edu.tw、《成語典》、教育部《國語一字多音審訂表》；樂府秦設漢盛、聲母非聲符、連詞=連接詞、倒反=倒辭/反語。

chi.t_adv.classical.pianyi | 偏義複詞
chi.t_adv.lit.schools | 文學流派與主張
chi.t_adv.word.idiom-origin | 成語典故出處
chi.t_base.char.recognition-count | 常用字認讀與書寫累積量（國小畢業：認讀 2,700 字、其中 2,200 字能寫；課綱 Ab-III）
chi.t_base.punc.comma | 逗號用法
chi.t_base.punc.exclamation | 驚嘆號
chi.t_base.punc.period | 句號用法
chi.t_base.punc.quotation | 引號（直接引語／強調／口語篇名）
chi.t_mid.classical.ancient-modern | 古今異義詞
chi.t_mid.classical.judgment-sentence | 判斷句（…者…也）
chi.t_mid.classical.passive-sentence | 被動句（為…所／見／於）
chi.t_mid.prac.envelope | 書信信封的直／橫式格式
chi.t_mid.prac.inscription | 題辭（婚喪喜慶用語）
chi.t_sub.gwrk.time-budget | 字數與時間分配：國寫無統一字數上限，逐題依題幹字數規定，於全卷時間內分配知性題與情意題兩大題

## soc-hist（3 條）— 多方交叉**防黨國史觀**（勿用『光復』『淪陷』等價值詞）；用學術/官方中性史料。

soc-hist.t_mid.taiwan.qing-land-feud | 清領前期的土地制度（大小租／一田多主）與分類械鬥
soc-hist.t_mid.taiwan.qing-trade | 清領前期的郊商與區域貿易網絡
soc-hist.t_sub.eastasia.examination-gentry | 科舉與士紳社會的專題探究

## soc-geo（1 條）— 地理用 UNESCO/USGS/中央氣象署客觀資料；柯本氣候 ABCDE 五大類；『中國』非『大陸』。

soc-geo.t_sub.nat-soilbio.island-biogeo | 說明島嶼生物地理學（面積、隔離與物種數）
