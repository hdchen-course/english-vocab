# 知識點母體嚴格審查報告

## 摘要答案

**結論：目前不可把這 3092 條知識點母體定案，也不可進入依 manifest 全量實作。** 形式層面大致完整：Markdown 與 JSON 都有 3092 個唯一 id，兩邊 id 集合完全一致；JSON 的 domain/tier 總數可重算吻合，3092 個 `src`/`line` 也全部能精確指回 `_kp_slices/*.md` 的原始條目。`status="todo"` 與 `unit_ids=[]` 是建置前預期狀態，本報告不把它們列為缺陷。

但 binding 前仍有下列不可接受問題：

1. **BLOCKER：64 個 `(待核)` 條目只有 27 個在 JSON 中可見，另 37 個因 parser 丟棄大括號後文字而從 manifest 消失。** coverage/audit 若只讀 JSON，會把尚未核定內容誤當已核定 minimum。
2. **BLOCKER：3092 條全部是 `beyond=false`，`t_enrich=0`；但清單中明確混入多個大學入門或顯著超出現行 K-12／考試深度的主題。** 這會讓 coverage gate 把超綱內容誤列成 100% 必做 minimum。
3. **BLOCKER：考試標籤有制度性錯置。** 英文有 26 條標成不存在的獨立「分科」英文；數學有 10 條標成「分科-數乙」，把舊制數乙名稱混入 108 課綱分科架構。數學學測內容又未區分數 A／數 B。
4. **BLOCKER：英文 inventory 未符合正式 spec 的優先順序。** 找不到 TOEIC／TOEFL／IELTS／GEPT、survival English、旅居、出國讀書聽課、口說或 conversation 類知識點；內容反而高度集中於文法與台灣考試。
5. **BLOCKER：至少數條知識本身錯誤或會教出危險行為，** 包含火場「濕毛巾／往下逃」、把 CRC 四大一般原則寫成四類權利、把滲透寫成由「高水位往低水位」、把陽光與空氣列成所有生物共同必需。
6. **MAJOR：計數摘要、語言 gate、check 工具、粒度與重複 ownership 尚未收斂。** `_kp_build.py --check` 現況固定 exit 1；數學 tier 小計錯誤；官方繁簡／PRC 詞掃描在兩份 binding 檔都 FAIL；歷史、公民、life 等域存在明顯粒度落差與語意重疊。

因此，本輪判定為 **CHANGES REQUIRED / 尚未 clean**。先修 blocker，再由教育部課綱與大考中心現行考試說明逐項核定 tier/exam；不能以本報告取代正式權威來源核對。

---

## 1. 審查範圍與方法

### 1.1 審查檔案

- `authoring/KNOWLEDGE_POINT_INVENTORY.md`
- `authoring/knowledge_points.json`
- 追溯來源：`authoring/_kp_slices/*.md`
- 生成器：`tools/_kp_build.py`
- binding 規則：`LEARNING_PATH_REBUILD_SPEC.md` §4、§4.1、R13

### 1.2 全量機器檢查結果

| 檢查 | 結果 |
|---|---|
| JSON 可解析 | PASS |
| JSON `meta.count` | 3092，與 items 長度一致 |
| 唯一 id | 3092/3092，無重複 id |
| Markdown 條目數／唯一 id | 3092/3092 |
| Markdown ↔ JSON id 集合 | 完全一致，缺漏 0、額外 0 |
| 10 個 slice 是否逐字嵌入合併 Markdown | 全部是 |
| domain 計數 | `chi 355 / eng 296 / math 263 / sci 986 / life 381 / soc-civ 322 / soc-geo 355 / soc-hist 134`，重算一致 |
| tier 計數 | `t_base 446 / t_mid 1200 / t_adv 952 / t_sub 494`，重算一致 |
| id/domain/tier/strand 規則 | 3092 條結構檢查皆通過；life 的 tier 正確讀欄位而非 id 第 2 段 |
| `beyond == (tier == t_enrich)` | 形式上 3092 條皆通過，但因 `t_enrich=0`，全部 `beyond=false`，語意分類不可信 |
| `src` 存在且 `line` 命中相同 id | 3092/3092 PASS |
| `status=todo`, `unit_ids=[]` | 3092/3092；依任務說明不列缺陷 |
| `_kp_build.py --check` | FAIL，exit 1；19 個摘要／備註 bullet 被誤判不合格式 |
| `scan_simplified.py` | FAIL；兩份 binding 檔各有 8 次禁用詞「網絡」 |

總數與格式宣稱位於 `KNOWLEDGE_POINT_INVENTORY.md:4-9`；JSON meta 位於 `knowledge_points.json:2-31`。正式規則要求 minimum 100% 覆蓋、`t_enrich/beyond` 不 gating，見 `LEARNING_PATH_REBUILD_SPEC.md:85-87,118-128,195-206`。

### 1.3 跨 domain/tier 抽樣

除全量 schema／計數／trace 檢查外，本輪對每個實際存在的 domain×tier cell 取首、中、末三筆，共 **31 cells / 93 筆**人工判讀，不只數學。涵蓋：

- chi：t_base/t_mid/t_adv/t_sub（例如 `chi.t_base.phon.symbols-37`、`chi.t_mid.rhet.metonymy`、`chi.t_sub.gwrq.open-close`）
- eng：四 tier（例如 `eng.t_base.phonics.letter-recognition`、`eng.t_mid.adjadv.superlative`、`eng.t_sub.writing.argumentative`）
- math：四 tier（例如 `math.t_base.numquant.place-value-read-write`、`math.t_adv.trig.solve-triangle-apply`、`math.t_sub.finmath.marginal-elasticity`）
- sci：四 tier，且跨 bio/earth/phys/chem/inquiry（例如 `sci.t_base.bio-life-levels.living-vs-nonliving`、`sci.t_adv.earth-astronomy.distance-scale`、`sci.t_sub.inquiry.sci-writing`）
- soc-hist、soc-geo、soc-civ：各四 tier
- life：t_base/t_mid/t_adv（此域沒有 t_sub；抽樣跨 safety/sel/learn/think/digital/data/compute/finance/sustain/innovate）

此抽樣另搭配全文關鍵風險掃描（待核、考試標籤、危險安全敘述、常見科學迷思、重複與過大粒度）。它能找出明顯錯誤，但不等同逐條由各科權威 reviewer 對照官方課綱。

---

## 2. BLOCKER findings

### B-01 — 37 個待核狀態從 JSON 消失

**證據**

- 來源 Markdown 中有 **64** 個知識點 bullet 含 `(待核)`；JSON 只有 **27** 個 item 的 `title_zh` 或 `exam` 還看得到「待核」。
- 原因是 `tools/_kp_build.py:27-30` 的 regex 以 `}` 結束 title/meta 擷取，且 `tools/_kp_build.py:74-75` 只寫入 `m.group("title")` 與括號內 meta；寫在 `}` 後的 `(待核)` 被 `.*$` 吃掉但未存欄位。
- 代表例：來源 `eng.md:59` 的 `eng.t_mid.vocab.expand-2000`、`sci-bio.md:285` 的 `sci.t_sub.bio-genetics-classical.chi-square-genetics`、`section-G-cross-curricular.md:66` 的 `life.safety.emergency.cpr-aed` 都有 `(待核)`，生成 JSON 後沒有任何 pending 標記。
- 相反地，寫在 title 內或 exam 內的 27 筆仍可見，造成同一概念有兩套不一致表示。

**37 個被 JSON 隱藏的待核 id**

- eng（4）：`eng.t_mid.vocab.expand-2000` (`eng.md:59`)、`eng.t_adv.vocab.ceec-4500` (`:60`)、`eng.t_sub.vocab.expand-6000` (`:65`)、`eng.t_adv.listening.monologue` (`:347`)
- sci-bio（8）：`sci.t_sub.bio-genetics-classical.chi-square-genetics` (`sci-bio.md:285`)、`...genetics-molecular.epigenetics` (`:305`)、`...biotech.crispr` (`:321`)、`...biodiversity.monophyletic` (`:358`)、`...plant-physiology.secondary-growth` (`:380`)、`...ecology.phosphorus-cycle` (`:405`)、`...conservation.carbon-neutral` (`:420`)、`...inquiry.statistics-basic` (`:438`)
- soc-geo（4）：`soc-geo.t_sub.skill.spatial-interp` (`soc-geo.md:62`)、`soc-geo.t_adv.hum-transport.ict-space` (`:300`)、`soc-geo.t_mid.reg-cn.pop-line` (`:337`)、`soc-geo.t_sub.spatial-decision.data-ethics` (`:409`)
- life（21）：`life.safety.home.furniture-anchor` (`section-G-cross-curricular.md:42`)、`life.safety.emergency.cpr-aed` (`:66`)、`life.safety.extra.harassment` (`:85`)、`life.sel.extra.grief` (`:157`)、`life.think.deduction-induction.abduction` (`:241`)、`life.think.bias.dunning-kruger` (`:261`)、`life.think.critical-creative.creative-thinking` (`:283`)、`life.digital.privacy.data-rights` (`:310`)、`life.digital.ai-algo.ai-detection` (`:331`)、`life.digital.factcheck.factcheck-platforms` (`:339`)、`life.data.misleading.simpson-paradox` (`:371`)、`life.data.judgment.data-ethics` (`:379`)、`life.compute.algorithm.efficiency` (`:406`)、`life.compute.hardware.compile-interpret` (`:413`)、`life.compute.tech-society.algo-fairness` (`:433`)、`life.compute.extra.block-coding` (`:439`)、`life.finance.market.gdp-cycle` (`:480`)、`life.finance.extra.first-job` (`:499`)、`life.sustain.civic-action.taiwan-issues` (`:527`)、`life.sustain.news.media-manipulation` (`:543`)、`life.innovate.inventions.everyday-inventions` (`:565`)

**建議修法**

新增獨立、必填且機器可查的欄位，例如 `review_status: "verified"|"pending"`、`review_note`、`authority_refs[]`、`verified_as_of`。parser 必須同時解析 title 前／後的舊標記並拒絕遺失；禁止把 `(待核)` 塞進 `exam` 字串。新增回歸測試：64 筆全部在 JSON 可見，直到人工核定後才逐筆轉 verified。

### B-02 — 全部條目誤成 minimum；超綱內容未進 t_enrich/beyond

**證據**

`knowledge_points.json` 實算為 `t_enrich=0`、`beyond=true=0`，所以 3092 條全部會被 minimum coverage gate 強制實作。但清單明確包含許多通常屬大學入門或至少需逐項證明屬現行分科範圍的內容，例如：

- 數學：部分分式 `math.t_sub.algexpr.partial-fraction` (`math.md:74`)、外積 `...vector.cross-product` (`:188`)、克拉瑪公式 `...determinant.cramer` (`:209`)、相關變率 `...calc.related-rates` (`:305`)、旋轉體體積／代換積分／分部積分／指對數與三角函數微積分 (`:310-314`)。
- 物理／化學：非慣性座標 `sci.t_sub.phys-force.noninertial` (`sci-physchem.md:64`)、質心與變力積分 (`:88-89`)、氣體莫耳比熱與自由度 (`:139`)、惠斯登電橋／RC 電路 (`:210-211`)、狹義相對論 (`:248`)、分子軌域／凡得瓦方程式／能斯特方程式 (`:307,339,420`)。
- 生物：cyclin/CDK (`sci-bio.md:129`)、氧合血紅素解離曲線 (`:168`)、RAAS (`:195`)、second messenger (`:216`)、表觀遺傳／CRISPR／單系群 (`:305,321,358`)。
- 地理：克利金內插 `soc-geo.t_sub.skill.spatial-interp` (`soc-geo.md:62`)、戴維斯地形輪迴 (`:92`)、最近鄰分析 (`:253`)、運輸網路圖論指標 (`:301`)。

上述不代表內容不能收錄；問題是它們目前全部被宣告為「考綱 minimum」。這直接違反 `LEARNING_PATH_REBUILD_SPEC.md:118-128,195-205` 的 minimum/enrichment 分界。

**建議修法**

先建立「官方課綱條目／考試說明 → KP id」證據表。無明確官方對應者預設改 `t_enrich,beyond=true,exam=無`，除非領域 reviewer 提供可追溯官方依據。不要因為內容有教育價值就把它標成分科必備。

### B-03 — exam 標籤混用不存在或過時的考科名稱

**證據**

- 英文共有 **26** 條 `exam="分科"`，從 `eng.t_sub.vocab.expand-6000` (`eng.md:65`; `knowledge_points.json:5307`) 到 `eng.t_sub.writing.argumentative` (`eng.md:367`)。108 課綱現行分科測驗沒有獨立英文考科；這些能力可屬高階英語、認證或實用英語，但不可假裝成「分科英文」。
- 數學共有 **10** 條 `exam="分科-數乙"`：`math.t_sub.prob.sampling-confidence` (`math.md:269`)、`...stats.sampling-survey` (`:289`)、`...stats.risk-decision` (`:290`)、`...finmath.annuity` (`:319`)、`...loan-installment` (`:320`)、`...growth-decay-model` (`:321`)、`...geo-distance` (`:322`)、`...linprog.feasible-region` (`:323`)、`...linprog.objective-optimize` (`:324`)、`...marginal-elasticity` (`:325`)。這把舊制「數乙」名稱混入分科測驗。
- 全部 75 個 math t_adv 又只標泛稱「學測」，沒有數 A／數 B 的必要區分。

**建議修法**

建立封閉 enum 與年度版本，例如 `assessment={system,subject,version}`；台灣考試標籤須逐筆對照當年度簡章。英文 26 筆依實際目的改為 `無`、TOEIC／TOEFL／IELTS／GEPT 或 t_enrich；數乙 10 筆重新映射至學測數 B／數 A、分科數甲、無或 enrichment，不能批次只改字串。

### B-04 — 英文清單與 binding spec 的「實用優先」相反

**證據**

`LEARNING_PATH_REBUILD_SPEC.md:121-128` 明定順序是：生活／旅居／出國讀書 → 認證 → 台灣考試，且前兩者必須放 minimum。對 `eng.md` 全文搜尋，TOEIC、TOEFL、IELTS、GEPT、survival、airport、doctor、lecture、presentation、conversation、speaking 全部零命中。現有 296 條主要是 phonics、文法、閱讀、英聽與寫作；英聽只有 10 條 (`eng.md:338-349`)，沒有口說 strand，卻有 26 條虛構「分科」標籤。

**建議修法**

在保持既有文法微技能的前提下，新增並優先核定 minimum strands：日常互動、旅行／住宿／交通／醫療求助、課堂聽講與筆記、口頭報告與討論、語用／禮貌／澄清策略、自然連音與真實語速、各認證對應能力。exam 欄用正式認證名或「無」，不可再以台灣考試作唯一骨架。

### B-05 — 危險的火場與瓦斯安全知識

1. `life.safety.emergency.fire-escape` — `section-G-cross-curricular.md:63`; `knowledge_points.json:25223`
   - 問題：把「濕毛巾」與「往下逃」列成通則。濕毛巾無法防有毒煙氣，尋找／弄濕毛巾可能延誤逃生；逃生方向應依安全出口與煙火狀況，不是永遠往下。樓梯已充煙時，強行進入更危險。
   - 修法：改成「先判斷煙火與出口；可安全離開就沿無煙出口迅速離開、隨手關門、不搭電梯；出口不安全則留在相對安全空間關門阻煙、打 119 並明確示警位置」。刪除濕毛巾神話，內容須由台灣消防權威覆核。
2. `life.safety.home.fire-gas` — `section-G-cross-curricular.md:37`; `knowledge_points.json:24963`
   - 問題：要求兒童「關閥」可能讓孩子停留於危險區域或操作不熟設備。
   - 修法：兒童版以「不開關電器／不點火；能安全開門窗才通風；立即離開，到戶外通知大人並求助」為主。關閥只可列為受訓成人且安全可及時的條件式措施。

### B-06 — CRC 四大原則寫錯

- id：`soc-civ.t_mid.rights.crc`
- 位置：`soc-civ.md:135`; `knowledge_points.json:30865`
- 現文：「兒童權利公約四大原則（生存、發展、受保護、參與）」
- 問題：括號列的是常見的四類權利，不是 CRC 四項一般原則。一般原則是：禁止歧視、兒童最佳利益、生存及發展權、尊重兒童意見。
- 修法：拆成兩個 KP：「CRC 四大一般原則」與「生存／發展／保護／參與四類權利」，避免教材把兩套架構混為一談。

### B-07 — 生物基礎概念有直接錯誤

1. `sci.t_mid.bio-membrane-transport.osmosis` — `sci-bio.md:56`; `knowledge_points.json:12431`
   - 現文：「水分子透過半透膜由高水位往低水位移動」。
   - 問題：「水位」是液面高度，不是滲透的驅動描述，會造成錯誤模型。
   - 修法：改為「水經選擇性通透膜，由較高水勢（較低溶質濃度）處淨移向較低水勢（較高溶質濃度）處」，並在 t_mid 用等張／高張／低張情境具體化。
2. `sci.t_base.bio-life-levels.life-needs` — `sci-bio.md:12`; `knowledge_points.json:11937`
   - 現文把空氣與陽光列為生物共同基本需求。
   - 問題：並非所有生物都需要陽光，也不是所有生物都需要氧氣／一般空氣。
   - 修法：改為「生物需能量來源、物質／養分、水與適合其生存的環境條件；不同生物取得能量與氣體需求不同」。植物需求可另立具體 KP。

---

## 3. MAJOR findings

### M-01 — 數學 tier 計數表錯誤，其他摘要也與精確值偏離

- `math.md:351-353` 與合併檔 `KNOWLEDGE_POINT_INVENTORY.md:366-368` 宣稱 math 為 `47/67/92/57`；JSON 實算是 **`47/67/75/74`**。總數 263 因兩欄一增一減而碰巧不變，容易躲過只驗總數的 gate。
- `chi.md:439-442` 宣稱約 `56/140/134/27`，實算 `61/149/118/27`。
- `soc-geo.md:435-438` 宣稱約 `32/115/125/83`，實算 `38/112/111/94`。

**修法：** 所有 count table 必須由 generator 產出，不得手寫；CI 同時比對總數、domain、tier、exam、strand×tier，不只比總數。

### M-02 — `_kp_build.py --check` 不是可用的 clean gate

`tools/_kp_build.py:32,92-95,128-131` 把一般中文摘要 bullet 當成未格式化 KP；現檔報 19 筆並 exit 1，包括 chi tier 摘要、待核彙整、life 盤點備註、soc-geo tier 摘要。這些不是遺失的知識點。

**修法：** 只在明確 KP section 或有特定 marker 的區段檢查未編號 bullet；摘要／備註區要明確排除。修完後真檔應 exit 0，再加一個真的缺 `[id]` 的 fixture 證明會 exit 1。

### M-03 — 官方語言 gate 在兩份 binding 檔都 FAIL

`scan_simplified.py` 報告禁用詞「網絡」各 8 次。涉及：

- `soc-hist.t_mid.taiwan.qing-trade` (`soc-hist.md:67`)
- `soc-hist.t_adv.taiwan.early-global-trade` (`:83`)
- `soc-hist.t_sub.eastasia.chinese-diaspora` (`:134`)
- `soc-hist.t_adv.world.cross-civilization` (`:162`)
- `soc-geo.t_sub.hum-pop.migrant-network` (`soc-geo.md:228`)
- `soc-geo.t_sub.hum-transport.network-graph` (`:301`)
- `soc-geo.t_sub.hum-transport.hub-spoke` (`:303`)
- `soc-civ.t_sub.group.social-network` (`soc-civ.md:60`)

**修法：** 依專案自己的 R2 gate 統一改為「網路」或更自然的「網絡關係／網狀關係」前，先決定學術語境是否真的要把「網絡」列為禁詞；不能一面把它列為 hard fail，一面讓 binding inventory 保留。此 finding 是規則自洽問題，不主張「網絡」在所有台灣學術文本都必然錯。

### M-04 — 多個科學敘述會形成迷思或使用過時數值

1. `sci.t_mid.phys-optics.plane-mirror` (`sci-physchem.md:169`; JSON `:21063`)：「左右相反」是常見但不精確的模型；平面鏡幾何上反轉鏡面法向（前後），左右感來自人與影像朝向。建議改成「像與物關於鏡面對稱、等距、正立虛像」，另以活動解釋左右感。
2. `sci.t_adv.bio-respiration.atp-yield` (`sci-bio.md:110`; JSON `:13016`)：「30–38 ATP」把舊式理論上限與現代估值混在一起。建議不把單一範圍當固定答案；區分真核常見估算、原核／穿梭系統差異與教科書模型。
3. `sci.t_adv.bio-respiration.fermentation` (`sci-bio.md:109`; JSON `:13003`)：以「無氧呼吸/發酵」視為同義，會遮蔽發酵與使用外源終端電子受體的厭氧呼吸之差異。K-12 可先教「缺氧時的發酵」，但 title 不應宣告兩者完全相同。
4. `sci.t_mid.earth-geomorph.river-landforms` (`sci-earth.md:90`; JSON `:17462`) 把沖積扇列在「下游」；沖積扇典型形成於河流出山口、坡度驟降處，不等於河川下游三角洲。`soc-geo.t_mid.nat-landform.river-forms` (`soc-geo.md:74`) 雖未明說下游，仍把五種地形塞成一筆，應拆開位置與成因。
5. `sci.t_adv.earth-hydrology.water-balance` (`sci-earth.md:196`; JSON `:18606`) 寫成「降水＝蒸發＋逕流＋入滲±儲量」，把入滲這個集水區內部轉移與儲量並列，可能重複計算。應按系統邊界定義為 `P = ET + Q ± ΔS`，若要列地下水流出／流入則明確擴充邊界。`soc-geo.t_adv.nat-hydro.water-balance` (`soc-geo.md:153`) 的版本較接近正確式。
6. `sci.t_mid.chem-acidbase.properties` (`sci-physchem.md:386`; JSON `:23520`) 把「味道」放進酸鹼通性，對兒童教材有誘導品嚐未知物的安全風險。改以指示劑、pH 與已知生活材料描述，明列不可用觸摸／品嚐辨識未知物。

### M-05 — 英文有過度絕對或錯誤排列

1. `eng.t_adv.modal.probability-ladder` (`eng.md:167`; JSON `:6399`)：「must > may > might > can't」錯把 `can't` 放在同一條由高到低的正向機率軸；`can't` 是高度確信「不可能／不是」。應拆成肯定與否定推測並以語境校準。
2. `eng.t_mid.verb.stative-verbs` (`eng.md:131`; JSON `:6009`)：「狀態動詞不用進行式」過度絕對；think/have/see/taste 等改成動態義時可用進行式。應改「典型狀態義通常不用；動態義例外」。
3. `eng.t_mid.noun.same-form-plural` (`eng.md:89`; JSON `:5541`) 把 fish 單列單複同形但未交代 `fishes` 可指多種魚類；教材若做唯一答案題會出錯。
4. `eng.t_mid.advcl.first-conditional` (`eng.md:258`; JSON `:7309`) 把第一條件句固定為 `if + present, will`，漏掉主句可用情態、祈使等形式。應標「典型型式」而非唯一公式。

### M-06 — 法律／權利內容過度簡化，可能教錯

1. `soc-civ.t_base.rights.rights-duty` (`soc-civ.md:124`; JSON `:30748`)：「享權利也要盡責任」容易讓兒童理解成權利以履行義務為交換。基本人權／兒童權利不是表現良好才取得。建議拆成「權利不因未盡責而任意消失」與「在共同生活中也有相應責任」。
2. `soc-civ.t_mid.law.minor-contract` (`soc-civ.md:245`; JSON `:31931`)：「未成年人法律行為需法定代理人同意」漏掉純獲法律上利益、依年齡及身分日常生活所必需等例外。應用情境題必須呈現例外。
3. `soc-civ.t_base.law.consumer-basic` (`soc-civ.md:274`; JSON `:32230`)：「可退換貨初步」容易教成所有實體店購物都可無條件退換。
4. `soc-civ.t_mid.law.consumer-protection` (`soc-civ.md:275`; JSON `:32243`) 需明確限定遠距／訪問交易的法定解除權與合理例外，避免把「鑑賞期」教成試用期或普遍實體店權利。

法律條目應附 `verified_as_of` 與法規版本，避免日後年齡、程序或法名變動後仍當永久事實。

### M-07 — 中文有明顯錯字與重複粒度

- `chi.t_base.char.near-form` (`chi.md:50`; `knowledge_points.json:497`) 的例子「辨辯辯瓣」重複「辯」，疑似漏掉「辦」。
- `chi.t_mid.phon.polyphone-by-sense` (`chi.md:26`)、`chi.t_mid.word.polyphone-sense` (`:57`)、`chi.t_mid.word.multi-sound` (`:58`) 高度重疊；若三者都做 minimum，coverage 很可能重複造課。
- `chi.t_mid.char.wrong-char-correct` (`:52`) 與 `chi.t_mid.word.wrong-char-adv` (`:59`) 的分界也只靠「進階」一詞，缺少可機械判別的技能差異。

**修法：** 合併同義 KP，或在 title/acceptance 定義各自可測差異；禁止只用「進階」建立不同 id。

### M-08 — 歷史粒度遠粗於 DEPTH-STD，且部分表述形成單線史觀

正式規則要求每條是一個具體、可測、可出題微技能 (`LEARNING_PATH_REBUILD_SPEC.md:214-228`)。但歷史只有 134 條，遠少於地理 355、公民 322；多筆實際涵蓋整個時代：

- `soc-hist.t_mid.eastasia.republic-war` (`soc-hist.md:117`; JSON `:39497`) 一筆同時塞民初軍閥、對日抗戰、國共關係。
- `soc-hist.t_mid.world.renaissance-reformation` (`soc-hist.md:148`) 合併兩個大主題。
- `soc-hist.t_mid.world.american-french-rev` (`:151`) 合併兩場革命。
- `soc-hist.t_mid.world.wwi` (`:154`) 一筆包含起因、過程、戰後秩序。
- `soc-hist.t_base.taiwan.period-overview` (`:56`; JSON `:38886`) 用「原住民→荷西→鄭氏→清領→日治→戰後」箭頭，對低年段方便，但易暗示各群體／政權彼此完全取代，忽略史前文化、多政權並存與族群延續。

**修法：** 依可命題成果拆成因果、制度、交流、影響、史料判讀等微技能；基礎總覽改用重疊時間帶而非單線替代箭頭。

### M-09 — 跨 domain 重複沒有 ownership／共享單元規則

重複主題本身可合理跨科，但 binding coverage 若沒有「主責 KP + 可共享 unit」規則，會造成重複實作與口徑分裂。例如：

- 霸凌：`soc-civ.t_mid.self.bullying` (`soc-civ.md:45`)、`life.safety.extra.bully-bystander` (`section-G...:85`)、`life.digital.cyberbully.*` (`:313-317`)
- 身體自主：`soc-civ.t_base.culture.body-autonomy-basic` (`soc-civ.md:107`) 與 `life.safety.body-boundary.*` (`section-G...:16-25`)
- 金融詐騙：`soc-civ.t_adv.issues.financial-fraud` (`soc-civ.md:422`) 與 `life.finance.credit-risk.financial-fraud` (`section-G...:489`)，另有 life safety scam strand
- 水循環／季風／自然災害同時存在 sci、soc-geo 與 life

**修法：** manifest 加 `canonical_kp_id`／`related_kp_ids[]`／`ownership`，允許同一經審核 unit 同時覆蓋多個不同域 KP，但每個域的評量角度要明列，避免單純重複。

### M-10 — life 域有粒度混合與不夠精確的心理／學習敘述

- `life.think.bias.loss-aversion` (`section-G...:259`; JSON `:26991`) 一筆合併損失趨避與沉沒成本，兩者不是同一偏誤。
- `life.data.misleading.simpson-paradox` (`:371`; JSON `:27953`) 一筆合併倖存者偏誤與辛普森悖論，且前者已另有 `life.think.bias.survivorship`。
- `life.think.bias.dunning-kruger` (`:261`) 用「越不懂越自信」把複雜研究結果寫成口號，容易貼標籤；應改成「自我評估可能因缺少判準而失準」，並標示研究限制。
- `life.learn.study-skills.pomodoro` (`:183`) 把 25/5 固定配方放 t_base minimum；應作可調整策略，不應暗示每個孩子都適用。
- `life.learn.memory.active-recall` (`:174`) 與 interleaving (`:176`) 的「勝過」需加條件：平均而言、在適當先備與學習階段下；初次理解不能被提取練習取代。

### M-11 — top-level id 說明與 life 規則互相矛盾

`KNOWLEDGE_POINT_INVENTORY.md:5` 宣稱所有 id 都是 `<domain>.<tier>.<strand>.<slug>`，但 life 實際是 `life.<category>.<strand>.<slug>`，tier 只在 manifest。正式 spec 已在 `LEARNING_PATH_REBUILD_SPEC.md:191-205` 正確區分兩種格式。

**修法：** inventory 檔首同步正式 spec，明列 academic 與 life 兩種格式；generator docstring／註解也需同步，避免後續工具誤把 `safety` 當 tier。

---

## 4. 待核項管理結論

來源檔共有 **64** 個帶 `(待核)` 的 KP，分布如下：

| slice | 待核數 | JSON 可見 | JSON 遺失 |
|---|---:|---:|---:|
| chi | 5 | 5 | 0 |
| math | 5 | 5 | 0 |
| sci-earth | 3 | 3 | 0 |
| sci-physchem | 14 | 14（塞在 exam 字串） | 0 |
| eng | 4 | 0 | 4 |
| sci-bio | 8 | 0 | 8 |
| soc-geo | 4 | 0 | 4 |
| life | 21 | 0 | 21 |
| **合計** | **64** | **27** | **37** |

目前可見的 27 筆也不應視為合格資料模型：14 筆 phys/chem 把 `(待核)` 混進 `exam`（如 `分科-物理 (待核)`），其餘把 note 放在 `title_zh`。應全部遷移到獨立 review 欄位。

此外，`soc-hist.md:104,214-218` 還有 section 級待核事項，不一定綁到每一條 bullet，現行 JSON 完全無法表示這種範圍性風險；也需以 `review_note` 或 slice-level metadata 納管。

---

## 5. 可保留的正面結果

1. 3092 個 id 全部唯一；Markdown/JSON id 集合一致。
2. domain、tier 與總計在 JSON meta 層可重算一致。
3. 3092 個 `src`/`line` 全部有效，且每一行確實含相同 id；目前 traceability 基礎是好的。
4. academic id 的第 2 段與 manifest tier、第三段與 strand 一致；life id 的 category/strand 也符合十個允許 category。
5. 多數抽樣知識點的方向合理，尤其數學基礎分解、自然常見概念、歷史技能、資料判讀與 life 安全／SEL 的涵蓋面相當廣。問題主要不是「沒有內容」，而是 binding 前尚未把正確性、exam 證據、粒度與 enrichment 邊界收斂。

---

## 6. 修正順序與驗收建議

### P0 — 立即阻止錯誤進入 coverage gate

1. 修正 generator，新增結構化 `review_status/review_note/authority_refs/verified_as_of`；先讓 64 個待核全部在 JSON 可見。
2. 立即修 B-05/B-06/B-07 的危險或直接錯誤知識點；這些不應等待一般 editorial round。
3. 凍結 `exam` enum，清除「分科英文」「分科-數乙」，按現行考試制度逐筆重映射。
4. 對目前 t_sub 與所有疑似大學內容逐項做官方對照；無證據者改 t_enrich/beyond，而不是保留 minimum。

### P1 — 恢復清單與工具可信度

5. 從 JSON 自動生成所有 Markdown count tables；修正 math/chi/soc-geo tier 摘要。
6. 修 `_kp_build.py --check` 的 19 個誤報，建立正例／反例 fixture。
7. 讓官方 `scan_simplified.py` 對兩份 binding 檔 PASS，或先修訂不合理的禁詞政策後再一致執行；不可忽略紅燈。
8. inventory 檔首與 generator 文件同步 academic/life 兩種 id 格式。

### P2 — 內容品質收斂

9. 補齊實用英語、海外生活／留學聽說與認證 minimum strands，再把台灣考試降為第三優先。
10. 對 history、life 與部分 science/social 大型條目做 DEPTH-STD 拆分；合併中文同義重複項。
11. 建立跨域 canonical ownership 與 shared-unit 規則，避免相同水循環、霸凌、詐騙等內容被重複建置且互相矛盾。
12. 法律、考試制度、急救／防災、AI 平台等時效性內容必須有 authority URL、版本日期與重新核查週期。

### 建議新增的 fail-closed 驗收

- `count/items/id set/domain/tier/exam/strand×tier` 全欄位重算一致。
- `review_status=pending` 不得進入 binding minimum；每筆 pending 必有 note。
- `exam` 必須是版本化 enum，禁止自由字串與括號備註。
- 每個 `t_base/t_mid/t_adv/t_sub` 必須有至少一個官方對應證據；否則自動降為 t_enrich/beyond 或 FAIL。
- `src`/`line` 不只命中 id，也要比對 title/tier/exam/review 狀態。
- Markdown 必須由 manifest 生成或雙向 canonical 化，避免手寫摘要漂移。
- 兩份 binding 檔必須通過語言 gate 與 `_kp_build.py --check`。

## 最終判定

**NOT APPROVED。** 現有資料的機械骨架可保留，但有 6 類 blocker：待核遺失、minimum/beyond 錯分、考試制度錯標、英文 scope 倒置、安全錯誤、基礎知識錯誤。完成 P0、P1 並重新跑跨科專家審查前，不應宣告附錄 A clean，也不應讓 3092 條全部進入 100% coverage 實作。
