# KP 重分類決策彙整（Phase -1 步④⑤；5 域課綱 team 2026-10-26）

## 官方課綱來源（使用者 2026-10-26 提供；⑥ 官方 L3／fact_check_ledger 的 canonical 參考）
- 國教院 108 總綱：https://www.naer.edu.tw/upload/1/16/doc/288/(111學年度實施)十二年國教課程綱要總綱.pdf
- 國教院 領綱列表頁：https://www.naer.edu.tw/PageSyllabus?fid=52 （領域課綱在「領域/科目課程綱要」分頁，需另取）
- **普高課程推動平臺（普高領綱＋課程手冊一手入口）**：https://shs.k12ea.gov.tw/public/12basic/108course/index.html
- 背景參考（二手整理，非一手）：https://school.taiwanbar.cc/posts/108-curriculum-guidelines
- 排除：技職/進修部課程實施規範（非本範圍）。
- 使用者指示：**「照目前規劃的對照就好」**——不逐一抓領綱 PDF 做窮盡 L3；上列為 ⑥ 與 ★ ESCALATE 項日後官方核對的來源，★項先保守留 pending/t_enrich 不逕標 verified。

---


> 來源：5 個領域課綱對映 agent。**狀態：待對抗式 review → 套用**。
> 套用原則（correctness-first，不假裝 verified）：
> - ENRICH-BEYOND → slice tier 改 `t_enrich`（beyond=true 自動）、exam=無 → 退出 minimum 覆蓋 gating。
> - IN-SCOPE-ADV → 修 exam 為受控 enum（eng 去「分科」）、tier 保留；verification_status 維持現狀（不逕標 verified）。
> - VERIFIED-MINIMUM → agent 已給來源，但多為 med 信心/無官方 PDF L3；**本輪僅高信心可引用事實寫入 fact_check_ledger**，其餘保留 pending/unverified 待 ⑥ 官方源 L3。
> - KEEP-PENDING → 維持 (待核)。
> - 低信心（low/med）項標 ★ 需 ⑥ 官方課綱/考試說明正文覆核。

## A. ENRICH-BEYOND（→ tier=t_enrich, exam=無；退出 minimum）
- math.t_sub.trig.inverse-function ★（反三角逾數甲，屬大學微積分）
- math.t_sub.space.sphere ★（球面方程式係 99 舊課綱，108 數甲未收）
- math.t_sub.calc.integration-by-parts ★（分部積分逾數甲，屬大學）
- sci.t_sub.phys-fluid.continuity ★（流體動力學量化逾 108 選物）
- sci.t_sub.phys-fluid.bernoulli ★（白努利量化逾 108 選物）
- sci.t_sub.phys-force.noninertial ★（非慣性系/假想力屬大學）
- sci.t_sub.chem-bond.mo-theory ★（分子軌域理論屬大學普化）
- sci.t_sub.chem-gas.real-gas ★（凡得瓦方程式屬大學）
- sci.t_sub.chem-redox.nernst ★（能斯特方程式屬大學）
- sci.t_sub.chem-organic.mechanism ★（反應機構 SN1/SN2 屬大學）
- sci.t_sub.bio-genetics-classical.chi-square-genetics ★（卡方屬大學/AP）
- sci.t_sub.bio-genetics-molecular.epigenetics ★（表觀遺傳屬大學；信心中，可能 KEEP-PENDING）
- sci.t_sub.bio-biotech.crispr（非 108 正式條目，屬時事/大學）
- eng.t_sub.vocab.expand-6000（6000字=第5-6級，逾學測；分科無英文）
- eng.t_sub.modal.need-dare ★（情態 need/dare 罕用）
- eng.t_sub.reading.academic-long（學術長文逾學測）
- eng.t_sub.writing.argumentative ★（完整議論文逾學測作文）
- soc-geo.t_sub.skill.spatial-interp（克利金屬大學 GIS）
- chi.t_adv.prac.official-doc ★（公文屬技高應用文，逾普高學測）

## B. IN-SCOPE-ADV（修 exam enum；tier 保留；不逕標 verified）
- math.t_sub.conic.reflection-apply → 分科-數甲（圓錐曲線光學性質）
- math.t_sub.finmath.marginal-elasticity → 分科-數乙（微積分商管應用）
- math.t_sub.determinant.cramer → 分科-數甲（B-03 疑慮不成立，保留）
- math.t_sub.calc.volume-revolution → 分科-數甲（旋轉體在數甲，保留）
- sci.t_sub.phys-heat.entropy/carnot/estatic.rc-circuit/em.em-wave-gen/modern.compton/modern.uncertainty/modern.relativity → 皆 分科-物理（已正確，保留；relativity B-03 不成立）
- sci.t_sub.chem-acidbase.lewis ★ → 分科-化學（slice 自列最需覆核）
- sci.t_sub.chem-applied.nanomaterials ★（質性 STS，信心低）→ 分科-化學
- sci.t_sub.bio-biodiversity.monophyletic/plant-physiology.secondary-growth/ecology.phosphorus-cycle/bio-conservation.carbon-neutral → 分科-生物（保留）
- sci.t_sub.bio-inquiry.statistics-basic → **exam 改 探究**（資料素養本質；「顯著性」子句宜刪/降階）
- eng（22 筆，exam 分科→學測、tier t_sub→t_adv）：verb.past-perfect-progressive, verb.future-perfect-progressive★, voice.nonfinite, voice.it-is-said, nonfinite.perfect-passive, relcl.compound-wh-ever, relcl.quantifier-of-which, nouncl.suggest-should, subj.future-unreal, subj.mixed, subj.inversion-omit-if, subj.would-rather, subj.if-only, subj.its-time, subj.mandative, subj.without-but-for, special.inversion-negative, special.inversion-only, special.inversion-so-such, special.what-cleft, special.perfect-participle, special.absolute-with
- soc-geo.t_adv.hum-transport.ict-space → 學測（保留）
- soc-geo.t_sub.spatial-decision.data-ethics ★ → 分科-地理（素養討論題，信心中）

## C. VERIFIED-MINIMUM（agent 給來源；本輪只有「可明確引用」者可進 ledger，餘留 pending 待 ⑥）
- sci.t_adv.earth-astronomy.kepler-laws → 學測（三定律概念為下限；第三定律量化屬進階）
- sci.t_adv.earth-astronomy.distance-scale ★ → 學測（AU/光年必修；秒差距/視差進階，宜拆）
- sci.t_adv.chem-bond.intermolecular → 學測（分子間力/沸點，B-03 不成立，高信心）
- soc-geo.t_mid.reg-cn.pop-line → 會考（東密西疏為下限；「胡煥庸線」專名降為補充；用「中國」）
- chi.t_base.phon.tone-sandhi-third → 無/t_base（涵於注音拼讀；內容正確高信心）
- chi.t_base.char.recognition-count → 無（**課綱 Ab-III：認讀 2,700／書寫 2,200**；改寫區分認讀/書寫）【可進 ledger：教育部國語文領綱 Ab-III-1/Ab-III-2】
- chi.t_adv.lit.taiwan-lit → 學測-國綜（以作品/脈絡非史實背誦）
- chi.t_sub.gwrk.time-budget → 學測-國寫（**國寫無統一字數上限**，全卷 80 分兩大題各約 40 分；逐題字數依題幹）【改寫：勿寫死字數上限】
- eng.t_mid.vocab.expand-2000 → 會考（官方會考字彙基準 1,200；2,000 為國中上緣）★用詞需拍板
- eng.t_adv.vocab.ceec-4500 → 學測（高中參考詞彙表第1-4級約4,500）【可進 ledger：大考中心英文考科測驗說明】
- eng.t_adv.listening.monologue → 學測（高中英聽獨立測驗等級制；採計依校系）

## D. KEEP-PENDING（維持待核）
- sci.t_adv.earth-climate.milankovitch ★（部分版本列延伸閱讀，待官方確認是否學測正式範圍；若僅延伸→轉 ENRICH）
- math.t_sub.finmath.geo-distance ★（球面三角 vs 弧長 s=rθ 歸屬不明，待確認單元意圖）

## E. life 跨課綱（全 exam=無；17 條 VERIFIED，其中 5 條「需改寫」；7 條 high-risk 不動維持 pending）
VERIFIED 可定稿：harassment, grief(避免把 Kübler-Ross 五階段當固定順序), abduction, creative-thinking, data-rights, data-ethics, algorithm.efficiency, hardware.compile-interpret(勿寫成絕對二分), algo-fairness, block-coding, gdp-cycle, media-manipulation(停在手法/辨識層,不點名特定行為者)
VERIFIED（需改寫，易變具體放 §6.7 可更新層並標日期）: ai-detection(不寫死視覺破綻), factcheck-platforms(不寫死平台名), first-job(不寫死金額), taiwan-issues(議題類型+可更新個案), everyday-inventions(破除單一發明者迷思,多源呈現)
simpson-paradox → 改 VERIFIED（移除「待核：高中適配」）
dunning-kruger → 已定稿不動
**7 條 high-risk 維持 pending（不動）**: fire-gas, fire-escape, bleeding, burn, choking, cpr-aed, furniture-anchor

## 待 main 拍板/⑥ 官方覆核
1. eng.expand-2000 exam 歸屬（會考 1200 vs 學測基礎）。
2. 所有 ★ med/low 信心項需 ⑥ 以官方課綱條號/考試說明 L3。
3. ledger 本輪僅收高信心可引用：chi.char.recognition-count、eng.vocab.ceec-4500（其餘 VERIFIED 暫不進 ledger，留待官方源）。
4. KP 數變動：life first-aid 已於步③拆 3；本步新增 soc-civ.crc-principles、life.sunk-cost（步③）；本步無新增/刪除 id（僅 tier/exam/status 改）。
