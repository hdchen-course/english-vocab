# 任務：獨立交叉查證台灣 K-12 知識點（cross-check researcher + 對抗式 reviewer）

你是**獨立事實查證研究員 + 對抗式審查者**。對象是一套台灣 K-12（國小→高中）學習教材的「知識點」清單。
我方（Claude 端的一個系統）會把你的輸出餵進一個 **fail-closed 驗證 gate：它會真的用程式去抓取你提供的每一個 URL，逐字比對你引用的 quote 是否確實出現在該網頁**。所以**嘴上說正確沒有用——你給的每條引文必須是該網址當前網頁上可被字串比對到的逐字片段（verbatim substring）**，否則該筆會被判 FAIL 丟掉。

## 當前真實時間（勿憑記憶推算）
台北 2026-10-27（Tuesday）。涉及時效性內容（法律名稱/行政制度/人口數據/組織成員數…）以此時間點的現行事實為準；若某敘述已過時，請在 concern 指出。

## 鐵律（務必遵守）
1. **正確性第一**：這是教小孩的教材，教錯會害人。寧可標「查無法確證」也不要瞎掰。
2. **全繁體中文、零簡體字、零 PRC（中國大陸）詞彙**：claim/concern 一律台灣繁體；指中國用「中國」**不要用「大陸／中國大陸」**（地理學術語「歐亞大陸/大陸性氣候/大陸棚」才保留）；用台灣用語（軟體/網路/資訊/影片…），不要用 PRC 說法。
3. **歷史類防黨國史觀**：不採單一 PRC 官方敘事，爭議事件持平、多方來源。
4. **來源品質**：每個 KP 至少 **2 個「不同出版者(publisher)」的獨立權威來源**（政府機關、大學/教科書、百科、標準組織、教育部辭典等公開可抓取的網頁）。**兩個不同語言版本的維基百科算同一個 publisher（維基），不構成 2 個獨立來源**——至少要有 1 個非維基來源。
5. **引文 verbatim**：quote 必須是該 URL 當前網頁上的**逐字原文片段**（10–40 字左右、含關鍵事實），會被程式重抓比對。勿改寫、勿翻譯後再引（要引原文語言的原字）。
6. **可抓取**：優先挑公開、無登入、無反爬蟲、純 HTML 的頁面（政府網/大學/OpenStax/教育部辭典/百科）。避免需 JS 才顯示內容的 SPA、PDF、或會擋機器人的站。

## 你要做的事
對下列**每一個** KP：
- 判斷其標題所述知識是否**正確、合乎台灣課綱、且適齡**。
- 找 **≥2 個不同 publisher** 的權威來源佐證，各附 **URL + publisher 名 + verbatim quote**。
- 若發現**任何正確性/時效/史觀/用語問題**，在 `concern` 用繁體一句話講清楚（沒有問題就留空字串 ""）。

## 輸出：寫成一個 JSON 檔
**請把結果寫到這個路徑（覆蓋）**：
```
/Volumes/workplace/EnglishTraining/english-vocab-deploy/authoring/sol_review/batch1_result.json
```
做完後把這個路徑回給 Claude 端即可（Claude 會讀此檔、跑 gate 真抓驗證）。

## JSON 格式（嚴格 JSON，整個檔案就是一個 JSON 物件，不要加註解或 markdown 圍欄）
```json
{
  "checks": {
    "<kp_id>": {
      "claim": "<用繁體中文一句，陳述你實際查證的事實主張>",
      "refs": [
        {"url": "https://…", "publisher": "<出版者名>", "quote": "<該網頁逐字原文片段>"},
        {"url": "https://…", "publisher": "<另一個不同出版者>", "quote": "<逐字原文片段>"}
      ],
      "concern": ""
    }
  }
}
```
- 每個 kp_id 一筆；`concern` 無問題填 ""，有問題填繁體一句。
- 若某 KP **找不到可抓取的權威來源**，仍列該 kp_id：`refs` 留空陣列 []、`claim` 寫你的理解、`concern` 寫「查無可確證之公開權威來源」——**不要硬湊假連結**（假連結會被 gate 抓到並整批扣信任）。
- publisher 用穩定可辨識名（例："教育部重編國語辭典"、"National Weather Service"、"OpenStax"、"Encyclopaedia Britannica"、"內政部"）。

## 待查證的 KP 清單（共 137 條；格式：<kp_id> | <中文標題>）
chi.t_adv.classical.culture-common | 古代文化常識（紀年／官職／地理／禮俗）
chi.t_adv.classical.fixed-patterns | 固定句式（無乃…乎／何…之有／不亦…乎／得無…乎／孰與）
chi.t_adv.classical.honorific | 謙稱／敬稱等稱謂詞判讀
chi.t_adv.classical.pianyi | 偏義複詞
chi.t_adv.classical.shici-multi | 實詞一詞多義
chi.t_adv.classical.xu-compare | 同一虛字不同用法的比較辨析
chi.t_adv.lit.author-works | 重要作家與代表作配對
chi.t_adv.lit.schools | 文學流派與主張
chi.t_adv.rhet.apostrophe | 呼告
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
chi.t_base.punc.comma | 逗號用法
chi.t_base.punc.exclamation | 驚嘆號
chi.t_base.punc.period | 句號用法
chi.t_base.punc.quotation | 引號（直接引語／強調／口語篇名）
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
eng.t_adv.nouncl.whether-or-not | whether…or not
eng.t_base.noun.regular-plural | 可數名詞規則複數（-s/-es 拼寫）
eng.t_mid.special.exclamatory | 感嘆句 What… / How…
eng.t_mid.vocab.health-illness | 健康與身體不適
eng.t_sub.subj.its-time | It's (high) time + 過去式
eng.t_sub.vocab.expand-6000 | 進階擴充至約 6,000 字（參考詞彙表第 5–6 級，逾學測；英文無上限、以生活實用為主）
life.finance.extra.fraud-recovery | 詐騙受害後的求助與止付流程（165、銀行）
life.innovate.inventions.tech-milestones | 重大科技里程碑的脈絡與影響
life.learn.memory.spaced-repetition | 間隔複習（spaced repetition）與遺忘曲線
life.safety.emergency.hotlines | 110（警察）、119（火警/救護）、112、防災與消防
life.safety.extra.outdoor-safety | 戲水/山林/野外活動安全（防溺五不、結伴、告知行程）
life.safety.scam.hotline-165 | 165 反詐騙諮詢專線；臨櫃提款行員關懷提問
life.safety.substance.addiction | 成癮的機制：短期快感 vs 長期傷害、戒斷
life.safety.substance.medicine-use | 藥物正確使用：遵醫囑、不共用處方藥、不自行加量
life.safety.substance.substance-law | 成癮物質與法律責任、求助管道
life.safety.traffic.blind-spot | 機車/腳踏車路權、內輪差與大型車死角
life.safety.traffic.drunk-driving | 酒駕/疲勞駕駛危害的概念（勸阻家人）
math.t_sub.calc.integration-by-parts | 積分技巧：分部積分
sci.t_adv.chem-organic.functional-groups | 官能基的辨識（羥基/羰基/羧基/胺基）
sci.t_adv.earth-weather.adiabatic-lapse | 乾、濕絕熱遞減率與大氣穩定度判斷
sci.t_mid.chem-gas.prepare-test | 常見氣體的製備與檢驗（氧/氫/二氧化碳）
sci.t_mid.earth-climate.taiwan-climate | 臺灣氣候特徵：季風、南北與高低海拔氣候差異
sci.t_mid.earth-hydrology.taiwan-water-issue | 臺灣水資源問題：降雨時空分布不均、河短流急、留蓄不易
sci.t_mid.earth-quake-volcano.earthquake-safety | 地震避難三要領（趴下、掩護、穩住）與防災準備
sci.t_mid.earth-quake-volcano.taiwan-volcano | 臺灣火山分布（大屯火山群、龜山島等）與板塊關係
sci.t_sub.bio-genetics-classical.chi-square-genetics | 以卡方檢定判斷遺傳實驗觀察值與期望值的符合度
sci.t_sub.phys-fluid.bernoulli | 白努利原理與應用
soc-civ.t_adv.group.gini | 以吉尼係數、所得五等分位倍數判讀分配不均
soc-civ.t_adv.group.inter-intra | 代間流動與代內流動的區別與判讀
soc-civ.t_adv.law.admin-disposition | 行政處分的意義與合法性要件
soc-civ.t_adv.law.crime-elements | 構成要件該當、違法性、有責性三階層概念
soc-civ.t_adv.law.criminal-procedure | 刑事訴訟流程（偵查、起訴、審判、執行）概念
soc-civ.t_adv.law.dispute-resolution | 調解、仲裁、訴訟等紛爭解決途徑比較
soc-civ.t_adv.law.domestic-violence | 家庭暴力防治與保護令制度
soc-civ.t_adv.law.presumption-innocence | 無罪推定與證據裁判原則
soc-civ.t_adv.law.rights-limit | 基本權利的限制與憲法第23條（比例原則、法律保留）
soc-civ.t_adv.law.rule-of-law | 法治國原則（依法行政、法律保留、法律優位）
soc-civ.t_adv.law.state-compensation | 國家賠償與損失補償的區別
soc-civ.t_adv.rights.intl-covenants | 兩公約（公民與政治權利、經濟社會文化權利）的內國法化
soc-civ.t_adv.self.identity-erikson | 自我認同與認同危機（認同形成的發展觀點）
soc-civ.t_adv.self.me-and-i | 自我的主我（I）與客我（Me）之分
soc-civ.t_adv.self.resocialization | 再社會化與全控機構（如軍隊、監獄）的概念
soc-civ.t_base.rights.rights-duty | 權利與義務相伴（享權利也要盡責任）
soc-civ.t_mid.group.formal-org | 正式組織與科層制（官僚制）的特徵
soc-civ.t_mid.group.in-out-group | 內團體與外團體（我群／他群）概念
soc-civ.t_mid.group.reference-group | 參照團體對態度與行為的影響
soc-civ.t_mid.group.vertical-horizontal | 垂直流動與水平流動的區別
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
soc-civ.t_mid.politics.participation-ways | 公民參與的方式（投票、連署、陳情、集會遊行、擔任志工）
soc-civ.t_mid.rights.child-protection | 兒少保護法制與通報機制概念
soc-civ.t_mid.rights.crc | 兒童權利公約四類權利（生存、發展、受保護、參與）
soc-civ.t_mid.rights.crc-principles | 兒童權利公約四大一般原則（不歧視、兒童最佳利益、生存與發展權、尊重兒童意見）
soc-civ.t_mid.rights.human-rights-meaning | 人權的意義與特性（普遍、固有、不可剝奪）
soc-civ.t_mid.rights.udhr | 世界人權宣言的精神與地位
soc-civ.t_mid.self.lifelong | 社會化是終身歷程（再社會化、預期社會化）
soc-civ.t_mid.self.role-set | 角色組（一人同時扮演多重角色）與角色期望
soc-civ.t_sub.economy.ad-as | 總合需求與總合供給模型初步
soc-civ.t_sub.economy.asymmetric-info | 資訊不對稱（逆選擇、道德危險）的實例與對策
soc-civ.t_sub.economy.exchange-regime | 固定匯率與浮動匯率制度的比較
soc-civ.t_sub.economy.trade-org | 區域經濟整合與國際經貿組織（WTO 等）的角色
soc-civ.t_sub.law.anti-discrimination | 就業歧視禁止與合理調整義務
soc-civ.t_sub.law.civil-principles | 民法基本原則（私法自治、契約自由及其限制）
soc-civ.t_sub.law.justification | 阻卻違法事由（正當防衛、緊急避難）
soc-civ.t_sub.law.labor-dispute | 勞動爭議處理與不當勞動行為裁決
soc-civ.t_sub.law.legal-interpretation | 法律解釋方法與法律漏洞補充
soc-civ.t_sub.law.proportionality | 比例原則三階段（適當、必要、衡平）的適用
soc-geo.t_mid.nat-climate.tw-features | 說明台灣季風、梅雨、颱風的氣候特徵
soc-geo.t_mid.nat-landform.endo-exo | 區辨內營力與外營力對地形的作用
soc-geo.t_mid.reg-tw.transport | 說明台灣交通與區域連結
soc-geo.t_sub.nat-landform.tw-geo-history | 整合台灣地形分區與地質演化史
soc-geo.t_sub.nat-soilbio.biome-carbon | 分析生物群系的碳吸存與氣候回饋
soc-geo.t_sub.nat-soilbio.island-biogeo | 說明島嶼生物地理學（面積、隔離與物種數）
soc-geo.t_sub.reg-tw.tectonic-system | 整合台灣地體構造與自然環境系統
soc-geo.t_sub.spatial-decision.national-plan | 說明國土計畫與空間治理體系
soc-geo.t_sub.spatial-decision.ppgis | 說明參與式 GIS 與公眾參與規劃
soc-geo.t_sub.spatial-decision.service-area | 以環域／服務範圍分析支援規劃
soc-geo.t_sub.spatial-decision.site-selection | 以適宜性分析做設施區位選擇
soc-geo.t_sub.spatial-decision.urban-regional-plan | 說明都市及區域計畫體系
soc-hist.t_mid.skill.calendar-convert | 西元／民國紀年互換，世紀與年代的換算與定位
soc-hist.t_mid.taiwan.qing-land-feud | 清領前期的土地制度（大小租／一田多主）與分類械鬥
soc-hist.t_mid.taiwan.qing-trade | 清領前期的郊商與區域貿易網絡
soc-hist.t_mid.taiwan.social-change | 戰後社會變遷（人口成長、都市化、社會運動）
soc-hist.t_sub.eastasia.examination-gentry | 科舉與士紳社會的專題探究
soc-hist.t_sub.taiwan.coldwar-taiwan | 冷戰結構下的台灣專題（美援、地緣政治）
