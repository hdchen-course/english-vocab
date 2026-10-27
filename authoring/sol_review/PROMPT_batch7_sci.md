# 任務：第七批交叉查證（自然科學 172 條：物理/化學/生物/地球科學）

同前規則：fail-closed gate 真抓每個 URL、逐字比對 quote；維基全家族算同一 publisher。這些經雙人分流確認標題正確（多筆已修正迷思）；多為科學硬事實，須以權威來源查證。權威：
- OpenStax https://openstax.org/ 、LibreTexts https://chem.libretexts.org/ (bio/phys/geo 亦有)
- NASA/NOAA/USGS、NIST、IUPAC、Royal Society of Chemistry、HyperPhysics、genome.gov、MedlinePlus
每 KP ≥2 個**不同 publisher**、quote 逐字 12–40 字、取靜態可抓頁面。

## 鐵律
1. 正確性第一（教錯害人）；破除迷思（中心粒非9+2/暗反應改碳反應/岩漿噴出地表後稱熔岩/北斗為星群屬大熊座/抗藥性非拉馬克式/電子親和力Cl>F…）。2. 全繁體 claim/concern、零簡體、零 PRC 詞；URL 不得含簡體。3. ≥2 不同 publisher、verbatim quote。4. 查無源留 refs:[]+concern，不硬湊。
5. 若發現標題或教法仍有過時/迷思/單位或因果誤述，在 concern 直說。

## 輸出：寫到（覆蓋）
```
/Volumes/workplace/EnglishTraining/english-vocab-deploy/authoring/sol_review/batch7_result.json
```
JSON 格式同前。

## 清單（172 條；<kp_id> | <中文標題>）
sci.t_adv.bio-cell-division.cytokinesis | 比較動植物細胞質分裂（收縮環 vs. 細胞板）
sci.t_adv.bio-cell-structure.centriole-cilia | 區分中心粒／基體（9三聯體）與纖毛/鞭毛軸絲（9+2）的微管結構與運動功能
sci.t_adv.bio-cell-structure.cytoskeleton | 說明細胞骨架（微管/微絲/中間絲）支持、運輸與運動功能
sci.t_adv.bio-circulation.blood-pressure | 說明血壓（收縮壓/舒張壓）與其調節
sci.t_adv.bio-circulation.tissue-fluid | 說明微血管端的血漿滲出形成組織液與物質交換
sci.t_adv.bio-conservation.ecosystem-services | 說明生態系服務（供給/調節/文化/支持）的價值
sci.t_adv.bio-coordination.negative-feedback-hormone | 以甲狀腺素/下視丘—腦垂腺軸說明激素的負回饋調節
sci.t_adv.bio-ecology.limiting-factor | 說明限制因子與耐受範圍對族群分布的影響
sci.t_adv.bio-enzyme-energy.cofactor-coenzyme | 區分輔因子（金屬離子）與輔酶（維生素衍生物如 NAD⁺/FAD）
sci.t_adv.bio-evolution.antibiotic-resistance | 以抗生素抗藥性/農藥抗性說明天擇的實例
sci.t_adv.bio-evolution.darwin-postulates | 分述天擇四要點（過度繁殖、變異、競爭、差別繁殖）
sci.t_adv.bio-gas-exchange.breathing-control | 說明腦（延腦）依血中 CO₂/pH 調節呼吸速率
sci.t_adv.bio-genetics-molecular.central-dogma | 敘述中心法則（DNA→RNA→蛋白質）
sci.t_adv.bio-immunity.innate-adaptive | 區分非專一性（先天）與專一性（後天）免疫
sci.t_adv.bio-photosynthesis.calvin-cycle | 說明碳反應（卡爾文循環，舊稱暗反應）於基質固定 CO₂合成醣類
sci.t_adv.bio-photosynthesis.chloroplast-structure | 指出葉綠體的類囊膜（葉綠餅）與基質分別對應光反應與碳反應（舊稱暗反應）
sci.t_adv.bio-respiration.electron-transport | 說明電子傳遞鏈於內膜、O₂為最終電子受體、產大量 ATP
sci.t_adv.chem-applied.greenhouse | 溫室效應與碳排放的化學
sci.t_adv.chem-atom.electronegativity-trend | 電子親和力與電負度的週期趨勢
sci.t_adv.chem-atom.metal-nonmetal | 金屬/非金屬/類金屬的分區與性質
sci.t_adv.chem-atom.valence-octet | 價電子與八隅體規則
sci.t_adv.chem-bond.covalent-lewis | 共價鍵（單/雙/參鍵）與路易斯結構
sci.t_adv.chem-bond.intermolecular | 分子間作用力（凡得瓦力/偶極/氫鍵）與沸點
sci.t_adv.chem-bond.ionic-property | 離子鍵的形成與離子化合物性質（熔點/導電）
sci.t_adv.chem-bond.metallic | 金屬鍵與金屬性質（導電/延展）
sci.t_adv.chem-eq.kc-meaning | 平衡常數 Kc 的意義與表示
sci.t_adv.chem-rate.temp-effect | 溫度對速率的影響（定性）
sci.t_adv.chem-redox.galvanic | 原電池（伏打電池）的構造與原理
sci.t_adv.chem-thermo.energy-diagram | 反應位能圖與活化能
sci.t_adv.chem-thermo.heat-types | 生成熱、燃燒熱與中和熱
sci.t_adv.earth-astronomy.celestial-sphere | 天球概念與天體周日運動、天球坐標（赤緯、時角概念）
sci.t_adv.earth-astronomy.galaxy-milkyway | 銀河系的結構與太陽系在其中的位置
sci.t_adv.earth-astronomy.hr-diagram | 赫羅圖（H-R 圖）與恆星的光度、表面溫度分類
sci.t_adv.earth-atmosphere.greenhouse-mechanism | 溫室氣體吸收地表長波輻射再放射，維持地表適居溫度的機制
sci.t_adv.earth-atmosphere.ionosphere | 增溫層/電離層對無線電波的反射；極光發生於增溫層高度，與電離層區域重疊（非因果關係）
sci.t_adv.earth-climate.enso | 聖嬰—南方振盪（ENSO）對全球與臺灣天氣的影響
sci.t_adv.earth-climate.global-circulation | 三胞環流（哈德里、佛雷爾、極地胞）與氣壓帶、風帶分布
sci.t_adv.earth-earth-system.core-composition | 地核主要由鐵、鎳組成；地球磁場源自外核流體運動（概念）
sci.t_adv.earth-earth-system.differentiation | 地球早期熔融、重的物質下沉形成地核、輕者上浮成地殼的分化過程
sci.t_adv.earth-earth-system.earth-origin | 地球與太陽系由原始星雲收縮、吸積形成（約 46 億年前）
sci.t_adv.earth-earth-system.energy-sources | 地球系統三大能量來源：太陽輻射、地球內部熱能、重力（潮汐）
sci.t_adv.earth-earth-system.moho-gutenberg | 莫氏不連續面（地殼—地函界）與古氏不連續面（地函—地核界）的定義
sci.t_adv.earth-earth-system.s-wave-no-liquid | S 波無法通過外核→推論外核為液態（內核為固態另由 P 波波速等證據推得）
sci.t_adv.earth-earth-system.system-feedback | 地球系統各圈層以能量與物質流動相互耦合、回饋（如碳循環跨圈層）
sci.t_adv.earth-environment.disaster-mitigation | 防災工程與非工程措施（預警、疏散、土地利用規劃）
sci.t_adv.earth-environment.hazard-vs-risk | 區分「天然災害潛勢」與「風險」（潛勢×曝露×脆弱度）概念
sci.t_adv.earth-environment.marine-pollution | 海洋污染（塑膠微粒、優養化、油污）與海洋保育
sci.t_adv.earth-environment.sustainable-development | 永續發展與地球資源承載力、世代公平概念
sci.t_adv.earth-geomorph.grain-size-velocity | 以流速—顆粒關係（侵蝕/搬運/堆積臨界流速）分析沉積作用
sci.t_adv.earth-geomorph.mass-wasting | 塊體崩壞（山崩、土石流）的誘發因子（降雨、地震）與控制因子（坡度、地質）
sci.t_adv.earth-geomorph.sorting-rounding | 沉積物的淘選度反映搬運能量；圓磨度反映磨蝕程度/搬運歷史（非單純等同搬運距離）
sci.t_adv.earth-geomorph.terrace-uplift | 河階、海階地形記錄地殼抬升與海水面升降
sci.t_adv.earth-geotime.earth-history-events | 地球歷史重大事件序（生命起源→大氣大量含氧→恐龍興衰）排序
sci.t_adv.earth-geotime.mass-extinction | 地質史上重大生物大滅絕事件與環境劇變的關聯
sci.t_adv.earth-geotime.original-horizontality | 原始水平定律與地層後期變形（褶皺、傾斜）的解讀
sci.t_adv.earth-hydrology.land-subsidence | 超抽地下水導致地層下陷與海水入侵
sci.t_adv.earth-hydrology.water-balance | 集水區水平衡（降水 P＝蒸發散 ET＋逕流 Q±儲量變化 ΔS；入滲為系統內部分配，不另列為獨立輸出項）
sci.t_adv.earth-ocean.gyre-coriolis | 科氏力與風共同造成大洋環流（渦旋 gyre）及西方強化
sci.t_adv.earth-ocean.thermocline-pycnocline | 海水垂直結構：混合層、斜溫層、深層與密度分層
sci.t_adv.earth-ocean.wave-motion | 深水波中水質點作圓周運動、波形傳遞能量而水不隨波前進
sci.t_adv.earth-quake-volcano.magma-composition-eruption | 岩漿黏滯度（二氧化矽含量）與揮發分氣體共同決定噴發型態：高黏滯使氣體難逸出而積壓、爆發性強
sci.t_adv.earth-rock-mineral.clastic-vs-chemical | 沉積岩分碎屑岩與化學/生物沉積岩（如石灰岩、燧石）
sci.t_adv.earth-rock-mineral.metamorphic-grade | 變質程度隨溫壓升高；葉理源自定向應力下片狀礦物的優選排列（板岩→片岩→片麻岩）
sci.t_adv.earth-tectonics.mantle-convection | 板塊運動的驅動力：地函對流、隱沒板塊的拉力（slab pull）、中洋脊推力
sci.t_adv.earth-tectonics.taiwan-orogeny | 臺灣造山運動：弧陸碰撞使地層褶皺、抬升形成中央山脈
sci.t_adv.earth-weather.coriolis-wind | 科氏力使風偏轉，形成地轉風與高低壓環流方向（北半球）
sci.t_adv.earth-weather.satellite-radar | 衛星雲圖與雷達回波在天氣分析的應用
sci.t_adv.earth-weather.typhoon-energy | 颱風以海面水氣潛熱為能量來源，登陸後減弱的原因
sci.t_adv.phys-wave.wave-behavior | 波的反射/折射/繞射/干涉
sci.t_base.bio-biodiversity.sort-animals | 依特徵將動物簡單分類（有無脊椎、棲地、食性）
sci.t_base.bio-biodiversity.sort-plants | 觀察植物的多樣性並簡單分類
sci.t_base.bio-coordination.five-senses | 認識五種感官（視/聽/嗅/味/觸）與刺激反應
sci.t_base.bio-digestion.balanced-diet | 認識均衡飲食與食物六大類（我的餐盤）
sci.t_base.bio-digestion.teeth-stomach | 初步認識牙齒咀嚼與胃腸消化食物
sci.t_base.bio-ecology.food-chain-intro | 認識食物鏈（誰吃誰）與生物間的取食關係
sci.t_base.bio-life-levels.life-needs | 說出生物生存的基本需求（水、養分、適當的溫度與生活空間）；多數生物還需要空氣，綠色植物另需陽光來製造養分
sci.t_base.bio-plant-physiology.plant-parts | 辨識植物六大器官（根莖葉花果實種子）與功能
sci.t_base.bio-reproduction.animal-babies | 知道動物會繁殖後代，有些動物的親代會照顧幼體
sci.t_base.chem-matter.filter-evap | 以過濾、蒸發分離混合物
sci.t_base.chem-matter.properties | 物質性質（軟硬/浮沉/磁性/導電）
sci.t_base.earth-astronomy.stars-constellations-base | 認識夜空中的亮星與常見星座（如獵戶座）及星群（如北斗七星，屬大熊座）
sci.t_base.earth-atmosphere.air-exists | 空氣確實存在且佔有空間、有重量（觀察實驗）
sci.t_base.earth-earth-system.earth-shape | 地球是圓球形（由船隻、月食影子、太空照片等證據推論）
sci.t_base.earth-environment.natural-resources | 認識自然資源（水、土壤、礦產、能源）並區分可再生與不可再生、其可用量有限
sci.t_base.earth-quake-volcano.volcano-basic | 火山噴發會噴出熔岩（岩漿噴出地表後稱熔岩）、火山灰與氣體
sci.t_mid.bio-cell-structure.organelle-cytoplasm | 說明細胞質為代謝反應發生場所
sci.t_mid.bio-circulation.blood-type-abo | 說明 ABO 血型與輸血相容性（初步）
sci.t_mid.bio-circulation.oxygenated-blood | 追蹤含氧血/缺氧血在心臟與循環中的流向
sci.t_mid.bio-circulation.vessels-three | 比較動脈、靜脈、微血管的構造與功能（含靜脈瓣）
sci.t_mid.bio-conservation.global-warming | 說明溫室效應與全球暖化對生態的衝擊
sci.t_mid.bio-coordination.brain-parts | 說明大腦、小腦、腦幹（尤其延腦）的主要功能
sci.t_mid.bio-coordination.nerve-vs-hormone | 比較神經（快/短暫）與激素（慢/持久）協調的差異
sci.t_mid.bio-digestion.bile-emulsify | 說明膽汁（不含酵素）乳化脂肪的作用
sci.t_mid.bio-digestion.food-tests | 以本氏液、碘液、蛋白質試劑、脂肪（紙上透光）檢測營養素
sci.t_mid.bio-ecology.biomes | 認識主要陸域生物群系（熱帶雨林/沙漠/草原/苔原等）與氣候
sci.t_mid.bio-ecology.succession | 說明生態演替（初級/次級）與顛峰群集
sci.t_mid.bio-enzyme-energy.enzyme-temp-ph | 描述溫度與 pH 對酵素活性的影響（最適值、過高變性）
sci.t_mid.bio-evolution.natural-selection-intro | 以達爾文天擇說明適者生存、不適者淘汰
sci.t_mid.bio-evolution.variation-source | 說明變異為演化的原料（來自突變與有性生殖重組）
sci.t_mid.bio-gas-exchange.respiratory-tract | 依序列出呼吸道（鼻→咽→喉→氣管→支氣管→肺泡）
sci.t_mid.bio-genetics-molecular.dna-is-genetic | 知道 DNA 為遺傳物質、位於細胞核
sci.t_mid.bio-life-levels.characteristics-list | 列舉生物的共同特徵：生長發育、新陳代謝、感應、生殖、遺傳、演化、恆定
sci.t_mid.bio-membrane-transport.tonicity-cell | 預測細胞在高張/低張/等張溶液中的脹縮（溶血、膨壓）
sci.t_mid.bio-musculoskeletal.antagonistic-muscles | 說明拮抗肌（如肱二頭肌/肱三頭肌）成對作用、一條收縮時另一條放鬆以帶動骨骼
sci.t_mid.bio-musculoskeletal.joint-types | 認識關節（可動/不可動）與韌帶、軟骨
sci.t_mid.bio-respiration.cellular-resp-def | 說明細胞呼吸：分解養分釋放能量供生命活動
sci.t_mid.bio-respiration.resp-vs-photo | 比較呼吸作用與光合作用（原料/產物/能量/場所）之互補
sci.t_mid.chem-acidbase.indicator-ph | 指示劑/廣用試紙與 pH 值初步
sci.t_mid.chem-acidbase.properties | 酸與鹼的通性（指示劑變色/導電性/腐蝕性；實驗室一律禁止以嚐味道檢驗）
sci.t_mid.chem-acidbase.salts | 鹽類的性質與應用
sci.t_mid.chem-atom.dalton | 原子的概念與道耳頓原子說
sci.t_mid.chem-atom.periodic-basic | 週期表排列（原子序/週期/族）初步
sci.t_mid.chem-matter.particle-view | 以粒子觀點解釋三態與狀態變化
sci.t_mid.chem-matter.phys-vs-chem-change | 物理變化與化學變化的判別
sci.t_mid.chem-matter.pure-vs-mixture | 純物質與混合物的區別
sci.t_mid.chem-organic.carbon-idea | 有機化合物的概念與碳的特性
sci.t_mid.chem-redox.oxid-reduc-idea | 氧化與還原的概念（得氧失氧/燃燒）
sci.t_mid.chem-soln.solubility-factor | 影響溶解度的因素（溫度/壓力）
sci.t_mid.earth-astronomy.moon-phase-cause | 月相成因：日、地、月相對位置使月球被照亮面可見比例改變
sci.t_mid.earth-astronomy.seasons-cause | 四季成因：地軸傾斜使各地太陽直射角與日照時數隨公轉改變
sci.t_mid.earth-atmosphere.air-composition | 大氣主要成分：氮約 78%、氧約 21%，其餘為氬、二氧化碳、水氣等
sci.t_mid.earth-earth-system.crust-ocean-vs-continent | 區分海洋地殼（較薄、密度大、玄武岩質）與大陸地殼（較厚、密度小、花崗岩質）
sci.t_mid.earth-geomorph.river-landforms | 河流地形：上游 V 型谷、中下游曲流、出山口（坡度驟減處）沖積扇、河口三角洲
sci.t_mid.earth-geomorph.weathering-physical-chemical | 風化分物理風化（破碎）與化學風化（成分改變），及影響因素
sci.t_mid.earth-geotime.geologic-time-scale | 地質年代大分：古生代、中生代、新生代與代表生物
sci.t_mid.earth-geotime.index-fossil | 標準（指準）化石用於對比地層與判斷年代（分布廣、存在時間短）
sci.t_mid.earth-geotime.relative-age | 相對地質年代的概念與地層對比
sci.t_mid.earth-hydrology.water-cycle-energy | 水循環由太陽能與重力共同驅動，水在三態間轉換
sci.t_mid.earth-quake-volcano.earthquake-hazards | 地震災害：建物倒塌、山崩、土壤液化、海嘯、火災
sci.t_mid.earth-rock-mineral.igneous-rock | 火成岩由岩漿冷卻凝固而成（火山岩 vs 深成岩，如玄武岩、花崗岩）
sci.t_mid.earth-rock-mineral.mineral-definition | 礦物為天然、無機、具一定範圍化學組成與結晶構造的固體
sci.t_mid.earth-tectonics.major-plates | 全球主要板塊名稱與相對位置（如太平洋、歐亞、非洲、北美等；菲律賓海板塊為與臺灣相關的次要板塊）
sci.t_mid.earth-tectonics.plate-tectonics-theory | 板塊構造學說：岩石圈分裂成數個板塊、在軟流圈上移動
sci.t_mid.earth-tectonics.taiwan-plate-setting | 臺灣位於歐亞板塊與菲律賓海板塊聚合帶，造成造山與多地震
sci.t_mid.earth-tectonics.transform-boundary | 錯動（平移）型板塊邊界：轉形斷層（如聖安地列斯斷層）
sci.t_mid.earth-weather.precipitation-types | 降水型態：雨、雪、冰雹的形成條件差異
sci.t_mid.phys-em.geomagnetism | 地磁與指南針指向
sci.t_mid.phys-em.induction-basic | 電磁感應與發電機原理初步
sci.t_mid.phys-estatic.home-safety | 家庭用電安全（保險絲/斷路器/接地）
sci.t_mid.phys-heat.celsius | 攝氏溫標與溫度計原理
sci.t_mid.phys-heat.heat-transfer | 熱的三種傳播（傳導/對流/輻射）
sci.t_mid.phys-optics.dispersion-color | 光的色散、可見光光譜與物體顏色
sci.t_mid.phys-wave.wave-type | 波的分類（橫波/縱波）
sci.t_sub.bio-biodiversity.molecular-taxonomy | 說明以分子（rRNA/DNA）資料建立親緣分類
sci.t_sub.bio-biotech.cloning | 區分生殖性與治療性複製、以複製羊為例
sci.t_sub.bio-biotech.genome-project | 認識人類基因體計畫的意義與應用
sci.t_sub.bio-cell-division.cell-cycle-checkpoint | 說明細胞週期檢查點與 cyclin/CDK 調控
sci.t_sub.bio-circulation.open-closed-circ | 比較開放式與閉鎖式循環系統（跨動物門）
sci.t_sub.bio-coordination.resting-potential | 說明靜止膜電位的鈉鉀分布與離子基礎
sci.t_sub.bio-ecology.phosphorus-cycle | 說明磷循環（缺乏像碳、氮那樣的顯著氣態階段，主要經岩石風化與沉積）
sci.t_sub.bio-evolution.phylogenetic-tree | 判讀親緣（演化）樹與共同祖先關係
sci.t_sub.bio-evolution.species-concept | 以生物種概念定義物種
sci.t_sub.bio-excretion.countercurrent | 以逆流機制說明亨利氏環濃縮尿液
sci.t_sub.bio-gas-exchange.bird-lung | 說明鳥類氣囊與單向氣流的高效氣體交換
sci.t_sub.bio-gas-exchange.gill-tracheal | 比較鰓、氣管（昆蟲）、肺等不同呼吸構造的氣體交換
sci.t_sub.bio-genetics-molecular.operon | 以乳糖操縱組說明原核基因表現調控
sci.t_sub.bio-membrane-transport.water-potential | 以水勢（溶質勢＋壓力勢）解釋植物細胞的水分移動
sci.t_sub.bio-photosynthesis.absorption-spectrum | 判讀光合色素的吸收光譜與作用光譜（紅/藍光最佳）
sci.t_sub.bio-photosynthesis.photosystem | 說明光系統 I、II 與電子傳遞鏈、光磷酸化
sci.t_sub.bio-plant-physiology.photoperiodism | 說明光週期與開花（長日/短日植物、植物光敏素）
sci.t_sub.bio-reproduction.plant-alternation | 說明植物世代交替（孢子體/配子體）
sci.t_sub.chem-applied.alt-energy | 替代能源與燃料電池的化學
sci.t_sub.chem-bond.crystal-types | 晶體分類（離子/共價網狀/分子/金屬）與性質
sci.t_sub.chem-matter.purity-test | 以熔點/沸點檢定純度並選擇分離技術
sci.t_sub.chem-organic.aromatic | 芳香烴（苯）與其結構
sci.t_sub.chem-redox.batteries | 常見電池（乾電池/鉛蓄電池/燃料電池）
sci.t_sub.chem-redox.corrosion | 金屬腐蝕與防蝕（犧牲陽極/鍍層）
sci.t_sub.chem-redox.nernst | 能斯特方程式
sci.t_sub.phys-fluid.continuity | 流體連續方程式（A₁v₁=A₂v₂）
sci.t_sub.phys-force.noninertial | 非慣性座標系與假想力（慣性力/離心力）
sci.t_sub.phys-modern.uncertainty | 不確定性原理與量子概念初步
sci.t_sub.phys-optics.em-spectrum | 電磁波譜與光的電磁波本質
