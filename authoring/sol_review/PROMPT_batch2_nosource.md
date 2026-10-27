# 任務：第二批交叉查證（第一批查無源的 90 條，附可達權威提示）

延續第一批規則（fail-closed gate 會真抓你給的每個 URL 逐字比對 quote；嘴上說不算）。這批是你第一輪回報「查無可確證之公開權威來源」的 90 條——多屬台灣課綱特定術語/制度，請改用下列**台灣本地權威**（公開、可抓取、繁體）再試：

## 各科建議權威來源（優先、可抓取）
- **國語文（chi，36 條：字音/字形/部首/成語/文言虛字…）**：
  - 教育部《重編國語辭典修訂本》 https://dict.revised.moe.edu.tw/ （查字詞定義/字音/字義）
  - 教育部《成語典》 https://dict.idioms.moe.edu.tw/ （成語典故出處）
  - 教育部《國字標準字體》/《異體字字典》 https://dict.variants.moe.edu.tw/ （部首/筆畫/標準字形）
- **公民（soc-civ，30 條：法律/權利/制度）**：
  - 全國法規資料庫 https://law.moj.gov.tw/ （憲法/法律條文原文——引條文逐字）
  - 司法院 https://www.judicial.gov.tw/ 、憲法法庭 https://cons.judicial.gov.tw/
  - 兒童權利公約資訊網 https://crc.sfaa.gov.tw/ （CRC 四大一般原則/條文）
- **歷史（soc-hist，6 條）**：多方非 PRC 控制來源交叉（台灣教科書/國際學術/worldhistory.org/history.state.gov），防黨國史觀。
- **地理（soc-geo，9 條）**：內政部國土測繪中心/中央氣象署 https://www.cwa.gov.tw/ /主計總處統計、或 NWS/USGS/NASA 英文權威。
- **自然（sci，5 條）**：OpenStax https://openstax.org/ 、LibreTexts、NIST/IUPAC。
- **生活（life，3 條）**：WHO/紅十字會/衛福部等現行官方指引（標 recheck）。

## 鐵律（同第一批，務必遵守）
1. 正確性第一（教小孩、教錯害人）。2. 全繁體、零簡體、零 PRC 詞；**連 URL 路徑也不要含簡體字**（用英數條目名或 percent-encode）。3. 每 KP ≥2 個不同 publisher、≥1 非維基、quote 為該頁逐字原文（會被程式重抓比對）。4. 查無源就留 refs:[] + concern 說明，**不要硬湊假連結**。

## 輸出：寫到這個路徑（覆蓋）
```
/Volumes/workplace/EnglishTraining/english-vocab-deploy/authoring/sol_review/batch2_result.json
```
JSON 格式與第一批完全相同：{"checks":{"<kp_id>":{"claim":"…","refs":[{"url","publisher","quote"},…],"concern":""}}}

## 待查證清單（90 條；格式：<kp_id> | <中文標題>）
chi.t_adv.classical.fixed-patterns | 固定句式（無乃…乎／何…之有／不亦…乎／得無…乎／孰與）
chi.t_adv.classical.honorific | 謙稱／敬稱等稱謂詞判讀
chi.t_adv.classical.pianyi | 偏義複詞
chi.t_adv.classical.shici-multi | 實詞一詞多義
chi.t_adv.classical.xu-compare | 同一虛字不同用法的比較辨析
chi.t_adv.lit.author-works | 重要作家與代表作配對
chi.t_adv.lit.schools | 文學流派與主張
chi.t_adv.word.idiom-origin | 成語典故出處
chi.t_base.char.components | 偏旁部件組字
chi.t_base.char.dict-radical | 查字典：部首檢字法（部首外筆畫數）
chi.t_base.char.dict-stroke | 查字典：筆畫檢字法
chi.t_base.char.dict-zhuyin | 查字典：注音檢字法
chi.t_base.char.hard-pen-form | 硬筆正確字形與工整書寫
chi.t_base.char.homophone-chars | 同音字辨析（的得地／在再／作做…）
chi.t_base.char.radical-id | 部首辨識
chi.t_base.char.radical-meaning | 部首表義（以部首推字義類別）
chi.t_base.char.recognition-count | 常用字認讀與書寫累積量（國小畢業：認讀 2,700 字、其中 2,200 字能寫；課綱 Ab-III）
chi.t_base.char.stroke-count | 計算字的筆畫數
chi.t_base.char.stroke-names | 基本筆畫名稱（橫豎撇捺點提鉤折）辨識
chi.t_base.char.structure-frame | 字的間架結構（左右／上下／包圍／獨體）辨識與書寫
chi.t_base.phon.blend-finals | 結合韻母（ㄧㄚ／ㄨㄛ／ㄩㄝ…）拼讀
chi.t_base.phon.tone-mark-position | 直書拼音時聲調號標示位置
chi.t_mid.char.variant-standard | 異體字與標準字形辨識
chi.t_mid.char.wrong-char-correct | 錯別字辨正
chi.t_mid.classical.ancient-modern | 古今異義詞
chi.t_mid.classical.judgment-sentence | 判斷句（…者…也）
chi.t_mid.classical.passive-sentence | 被動句（為…所／見／於）
chi.t_mid.prac.envelope | 書信信封的直／橫式格式
chi.t_mid.prac.inscription | 題辭（婚喪喜慶用語）
chi.t_mid.punc.misuse | 標點誤用辨析（逗號句號混用、問號濫用）
chi.t_mid.rhet.symbol-vs-simile | 象徵與譬喻之辨析
chi.t_mid.word.idiom-meaning | 成語意義理解
chi.t_mid.word.multi-sound | 字音：多音字辨讀
chi.t_mid.word.saying-proverb | 熟語／諺語／歇後語／格言理解
chi.t_mid.word.wrong-char-adv | 字形：進階錯別字辨正（同音誤代）
chi.t_sub.gwrk.time-budget | 字數與時間分配：國寫無統一字數上限，逐題依題幹字數規定，於全卷時間內分配知性題與情意題兩大題
eng.t_sub.vocab.expand-6000 | 進階擴充至約 6,000 字（參考詞彙表第 5–6 級，逾學測；英文無上限、以生活實用為主）
life.finance.extra.fraud-recovery | 詐騙受害後的求助與止付流程（165、銀行）
life.innovate.inventions.tech-milestones | 重大科技里程碑的脈絡與影響
life.safety.scam.hotline-165 | 165 反詐騙諮詢專線；臨櫃提款行員關懷提問
sci.t_adv.earth-weather.adiabatic-lapse | 乾、濕絕熱遞減率與大氣穩定度判斷
sci.t_mid.earth-climate.taiwan-climate | 臺灣氣候特徵：季風、南北與高低海拔氣候差異
sci.t_mid.earth-hydrology.taiwan-water-issue | 臺灣水資源問題：降雨時空分布不均、河短流急、留蓄不易
sci.t_mid.earth-quake-volcano.taiwan-volcano | 臺灣火山分布（大屯火山群、龜山島等）與板塊關係
sci.t_sub.bio-genetics-classical.chi-square-genetics | 以卡方檢定判斷遺傳實驗觀察值與期望值的符合度
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
soc-civ.t_mid.politics.democracy-principles | 民主政治的基本原則（主權在民、多數決、尊重少數、法治）
soc-civ.t_mid.rights.crc | 兒童權利公約四類權利（生存、發展、受保護、參與）
soc-civ.t_mid.rights.crc-principles | 兒童權利公約四大一般原則（不歧視、兒童最佳利益、生存與發展權、尊重兒童意見）
soc-civ.t_sub.economy.ad-as | 總合需求與總合供給模型初步
soc-civ.t_sub.economy.asymmetric-info | 資訊不對稱（逆選擇、道德危險）的實例與對策
soc-civ.t_sub.economy.exchange-regime | 固定匯率與浮動匯率制度的比較
soc-civ.t_sub.economy.trade-org | 區域經濟整合與國際經貿組織（WTO 等）的角色
soc-civ.t_sub.law.civil-principles | 民法基本原則（私法自治、契約自由及其限制）
soc-civ.t_sub.law.justification | 阻卻違法事由（正當防衛、緊急避難）
soc-civ.t_sub.law.labor-dispute | 勞動爭議處理與不當勞動行為裁決
soc-civ.t_sub.law.proportionality | 比例原則三階段（適當、必要、衡平）的適用
soc-geo.t_mid.nat-climate.tw-features | 說明台灣季風、梅雨、颱風的氣候特徵
soc-geo.t_mid.nat-landform.endo-exo | 區辨內營力與外營力對地形的作用
soc-geo.t_mid.reg-tw.transport | 說明台灣交通與區域連結
soc-geo.t_sub.nat-landform.tw-geo-history | 整合台灣地形分區與地質演化史
soc-geo.t_sub.nat-soilbio.island-biogeo | 說明島嶼生物地理學（面積、隔離與物種數）
soc-geo.t_sub.reg-tw.tectonic-system | 整合台灣地體構造與自然環境系統
soc-geo.t_sub.spatial-decision.national-plan | 說明國土計畫與空間治理體系
soc-geo.t_sub.spatial-decision.ppgis | 說明參與式 GIS 與公眾參與規劃
soc-geo.t_sub.spatial-decision.urban-regional-plan | 說明都市及區域計畫體系
soc-hist.t_mid.skill.calendar-convert | 西元／民國紀年互換，世紀與年代的換算與定位
soc-hist.t_mid.taiwan.qing-land-feud | 清領前期的土地制度（大小租／一田多主）與分類械鬥
soc-hist.t_mid.taiwan.qing-trade | 清領前期的郊商與區域貿易網絡
soc-hist.t_mid.taiwan.social-change | 戰後社會變遷（人口成長、都市化、社會運動）
soc-hist.t_sub.eastasia.examination-gentry | 科舉與士紳社會的專題探究
soc-hist.t_sub.taiwan.coldwar-taiwan | 冷戰結構下的台灣專題（美援、地緣政治）
