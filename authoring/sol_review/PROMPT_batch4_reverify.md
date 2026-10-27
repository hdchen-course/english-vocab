# 任務：第四批交叉查證（66 條尚未確證、不在缺陷清單者）

同前規則：fail-closed gate 會真抓每個 URL、逐字比對 quote；**維基全家族(百科/文庫/辭典/教科書)算同一 publisher**，不能當兩源。這 66 條是先前各輪未送到你、或無來源的殘留，多為 chi(21)/soc-civ(28)/eng(5)/其他。請用非維基真權威：
- **chi**：教育部《重編國語辭典》 https://dict.revised.moe.edu.tw/ 、《成語典》 https://dict.idioms.moe.edu.tw/ 、《異體字字典》、《重訂標點符號手冊》 https://language.moe.gov.tw/ 。
- **soc-civ（法律/權利/制度）**：全國法規資料庫 https://law.moj.gov.tw/ 、司法院/憲法法庭、衛福部/勞動部等主管機關。
- **eng**：Cambridge/Merriam-Webster/Purdue OWL/British Council。
- **其他**：OpenStax/政府機關/標準組織。

## 鐵律（同前）
1. 正確性第一（教小孩、教錯害人）。2. 全繁體、零簡體、零 PRC 詞；URL 路徑不得含簡體。3. 每 KP ≥2 不同 publisher（維基家族算一家）、quote 逐字 12–40 字。4. 查無源留 refs:[]+concern，不硬湊假連結。

## 輸出：寫到（覆蓋）
```
/Volumes/workplace/EnglishTraining/english-vocab-deploy/authoring/sol_review/batch4_result.json
```
JSON 格式同前。

## 清單（66 條；<kp_id> | <中文標題>）
chi.t_adv.classical.honorific | 謙稱／敬稱等稱謂詞判讀
chi.t_adv.classical.pianyi | 偏義複詞
chi.t_adv.classical.shici-multi | 實詞一詞多義
chi.t_adv.lit.schools | 文學流派與主張
chi.t_adv.word.idiom-origin | 成語典故出處
chi.t_base.char.dict-zhuyin | 查字典：注音檢字法
chi.t_base.char.homophone-chars | 同音字辨析（的得地／在再／作做…）
chi.t_base.char.recognition-count | 常用字認讀與書寫累積量（國小畢業：認讀 2,700 字、其中 2,200 字能寫；課綱 Ab-III）
chi.t_base.phon.blend-finals | 結合韻母（ㄧㄚ／ㄨㄛ／ㄩㄝ…）拼讀
chi.t_base.phon.tone-mark-position | 直書拼音時聲調號標示位置
chi.t_base.punc.comma | 逗號用法
chi.t_base.punc.exclamation | 驚嘆號
chi.t_base.punc.period | 句號用法
chi.t_base.punc.quotation | 引號（直接引語／強調／口語篇名）
chi.t_mid.char.variant-standard | 異體字與標準字形辨識
chi.t_mid.classical.ancient-modern | 古今異義詞
chi.t_mid.classical.judgment-sentence | 判斷句（…者…也）
chi.t_mid.classical.passive-sentence | 被動句（為…所／見／於）
chi.t_mid.prac.envelope | 書信信封的直／橫式格式
chi.t_mid.prac.inscription | 題辭（婚喪喜慶用語）
chi.t_sub.gwrk.time-budget | 字數與時間分配：國寫無統一字數上限，逐題依題幹字數規定，於全卷時間內分配知性題與情意題兩大題
eng.t_adv.adjadv.comparison-ellipsis | 比較句的省略與平行（than I do）
eng.t_adv.adjadv.multiple-comparison | 倍數比較（twice/three times as…as）
eng.t_adv.adjadv.the-more-the-more | the + 比較級, the + 比較級（越…越…）
eng.t_adv.noun.double-possessive | 雙重所有格（a friend of mine）
eng.t_mid.vocab.health-illness | 健康與身體不適
life.finance.extra.fraud-recovery | 詐騙受害後的求助與止付流程（165、銀行）
life.safety.scam.hotline-165 | 165 反詐騙諮詢專線；臨櫃提款行員關懷提問
life.safety.traffic.drunk-driving | 酒駕/疲勞駕駛危害的概念（勸阻家人）
sci.t_mid.earth-climate.taiwan-climate | 臺灣氣候特徵：季風、南北與高低海拔氣候差異
sci.t_mid.earth-hydrology.taiwan-water-issue | 臺灣水資源問題：降雨時空分布不均、河短流急、留蓄不易
sci.t_mid.earth-quake-volcano.taiwan-volcano | 臺灣火山分布（大屯火山群、龜山島等）與板塊關係
soc-civ.t_adv.group.gini | 以吉尼係數、所得五等分位倍數判讀分配不均
soc-civ.t_adv.law.admin-disposition | 行政處分的意義與合法性要件
soc-civ.t_adv.law.crime-elements | 構成要件該當、違法性、有責性三階層概念
soc-civ.t_adv.law.criminal-procedure | 刑事訴訟流程（偵查、起訴、審判、執行）概念
soc-civ.t_adv.law.dispute-resolution | 調解、仲裁、訴訟等紛爭解決途徑比較
soc-civ.t_adv.law.domestic-violence | 家庭暴力防治與保護令制度
soc-civ.t_adv.rights.intl-covenants | 兩公約（公民與政治權利、經濟社會文化權利）的內國法化
soc-civ.t_adv.self.me-and-i | 自我的主我（I）與客我（Me）之分
soc-civ.t_mid.law.admin-basic | 行政機關、行政行為與依法行政初步
soc-civ.t_mid.law.constitution-status | 憲法作為國家根本大法的地位
soc-civ.t_mid.law.consumer-remedy | 消費爭議的申訴與調解管道
soc-civ.t_mid.law.contract-basic | 契約的成立與誠信原則
soc-civ.t_mid.law.equality-right | 平等權與禁止不合理差別待遇
soc-civ.t_mid.law.freedom-rights | 人身自由、言論、集會結社、宗教信仰等自由權
soc-civ.t_mid.law.law-hierarchy | 法律位階（憲法 > 法律 > 命令）與中央法規
soc-civ.t_mid.law.law-meaning | 法律的意義與功能（維持秩序、保障權利、解決紛爭）
soc-civ.t_mid.law.norm-types | 法律與其他社會規範（道德、習俗、宗教）的區別
soc-civ.t_mid.law.remedy-ways | 權利受侵害時的救濟管道概念
soc-civ.t_mid.law.tort-basic | 侵權行為與損害賠償責任的概念
soc-civ.t_mid.rights.crc | 兒童權利公約四類權利（生存、發展、受保護、參與）
soc-civ.t_mid.rights.crc-principles | 兒童權利公約四大一般原則（不歧視、兒童最佳利益、生存與發展權、尊重兒童意見）
soc-civ.t_sub.economy.ad-as | 總合需求與總合供給模型初步
soc-civ.t_sub.economy.asymmetric-info | 資訊不對稱（逆選擇、道德危險）的實例與對策
soc-civ.t_sub.economy.trade-org | 區域經濟整合與國際經貿組織（WTO 等）的角色
soc-civ.t_sub.law.civil-principles | 民法基本原則（私法自治、契約自由及其限制）
soc-civ.t_sub.law.justification | 阻卻違法事由（正當防衛、緊急避難）
soc-civ.t_sub.law.labor-dispute | 勞動爭議處理與不當勞動行為裁決
soc-civ.t_sub.law.proportionality | 比例原則三階段（適當、必要、衡平）的適用
soc-geo.t_mid.nat-climate.tw-features | 說明台灣季風、梅雨、颱風的氣候特徵
soc-geo.t_sub.nat-soilbio.island-biogeo | 說明島嶼生物地理學（面積、隔離與物種數）
soc-hist.t_mid.skill.calendar-convert | 西元／民國紀年互換，世紀與年代的換算與定位
soc-hist.t_mid.taiwan.qing-land-feud | 清領前期的土地制度（大小租／一田多主）與分類械鬥
soc-hist.t_mid.taiwan.qing-trade | 清領前期的郊商與區域貿易網絡
soc-hist.t_sub.eastasia.examination-gentry | 科舉與士紳社會的專題探究
