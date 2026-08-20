# 逐頁統一 + 遊戲化設計計畫（10 頁）

> 讀者：公館國小小四。第一優先＝內容**正確**；第二優先＝讓孩子**願意學**（省力、能自己持續玩下去）。以下每一項都需你核准後才動手。

---

## 1. 共通結構統一做法（一次講清楚）

所有頁目前都是 **shell:0**：外層寫死 `max-width:500~900px`，在 iPad 上變成中央一條窄長直條、兩側大片空白。統一改為 canon 版型：

- **外層 `.shell`**：移除各頁寫死的 max-width，改吃 `--content-max`（手機 720px／iPad 1200px）、`margin-inline:auto`。SPA 型頁面（math／multiply／chinese）保留 `min-height:100dvh` 讓畫面切換與底部按鍵維持全高。
- **選單／首頁 → `.u-grid` 儀表板**：把關卡格、模式格、分類格改成 `repeat(auto-fit,minmax(260px,1fr))` — 手機單欄好讀，iPad 自動攤成寬版多欄 dashboard。卡片改用共用 `.u-card`（2px 邊框、`--r-lg`、hover→accent）。
- **答題區 → `.play-column`**（≤680px 置中）：所有題目卡、選項、數字鍵盤、閃卡包進來，避免在 iPad 被拉到 1200px 造成拇指按不到、閱讀行過長。
- **iPad 寬版 `.dashboard`（1fr + 320px sticky aside）**：flashcard 類頁面主欄放活動、側欄放「圖鑑進度環／今日到期／連續天數」。
- **共用設計語言**：沿用 app.css 既有的卡片圓角/陰影/邊框、字級、間距、按鈕、區塊標題與**每科一個 accent 色**；各頁只保留自身特有樣式（3D 翻卡、monospace 步驟框、canvas 場景）。
- **共用 `.app-bar`／原生 HUD 保留**，show/hide 路由與 `data-game-wired` 綁定**一律不動**（防重複計分的關鍵）。

---

## 2. 統一遊戲系統回顧（game_core.js 已內建）

一位玩家、一份檔案：**XP、金幣、連續天數、等級、寵物/吉祥物、每日任務、徽章**。所有科目的答題都走同一條 `Game.recordAnswer(subject, correct)` → 自動累積 XP→金幣。

**健康黏性守則（本計畫每個機制都必須遵守）**：
- 無暗黑模式：**不用失落厭惡、不用連續天數羞辱**（已內建連續凍結）、**無寶箱/轉蛋/隨機獎勵**。
- **金幣只買 cosmetic**（造型、寵物皮膚），**永不買提示或跳關**。
- 難度封頂在小四 flow zone；**慶祝只在「進步時」**，不在花錢或懲罰時。
- Blueprint §3.5 要求「每科至少一個真正的遊戲機制（不只是 quiz+彩帶）」— 這正是本次要補的缺口。

---

## 3. 逐頁計畫表

### 數學運算 — `math.html`
| 面向 | 內容 |
|---|---|
| 結構 | `#app` 去掉 `max-width:500px` 改為 `.shell`（--content-max）；`#level-map`/`#stage-list` → `.u-grid`；`#screen-game`/`#screen-daily`/`#screen-result` 包 `.play-column`；stats+exp 做成 overview 列，iPad 可升級成 dashboard。 |
| 功能 | 保留 7 級×5 關算術、數字鍵盤回想（非選擇）、combo、3 星、60s 每日挑戰、錯題本、成就。**不改題目產生器**。 |
| 新增機制 | **BOSS 戰**：把既有第 5 關「BOSS混合」升級為有 HP 條的怪物戰，答對造成傷害、combo/速度加暴擊；**答錯不扣血只重新排入**（只能靠精熟取勝）；擊敗掉落**戰利品獎盃**收進圖鑑架。 |
| 記憶科學 | 交錯（4 子技能輪流）＋錯題本注入＋戰中錯題間隔重排；新增每技能 mastery 計數讓錯題本會「畢業/衰退」，變成真的間隔複習佇列。 |
| 動機健康 | 全關卡自由進入；HP 條給每題連續勝任回饋；Boss 無法殺死你＝努力必收斂到勝利；寵物慶祝、獎盃進共用圖鑑。無扣血/生命/loot box。 |
| 工時 | **L** |

### 乘法 — `multiply.html`
| 面向 | 內容 |
|---|---|
| 結構 | `.container`→`.shell`（加 is-app 修飾維持全高）；`.mode-grid`/`.stage-list` → `.u-grid`；遊戲/加強頁包 `.play-column`；**九九表/星圖頁刻意用滿版 `.shell`**（大格子受益於 iPad 寬度）。 |
| 功能 | 保留 4 模式（16 關/60s/乘法表/加強）、數字鍵盤、combo、錯題、答錯不罰。改：把 mastery 計數換成**每 fact 的 SRS 紀錄**；出題偏向到期+弱項；首頁加「今日複習 N 顆星」。 |
| 新增機制 | **九九星空圖鑑**：每個 fact（交換律去重）是一顆星，暗→藍→**金星**對應 SRS box；點亮整條星座/填滿核心星空 → 慶祝＋一次性金幣＋徽章，寵物夜空背景變豐富。 |
| 記憶科學 | Leitner SRS（10 分→1→3→7→16→30 天）；出題加權到期+錯題；交換律配對減半負擔；金星需 box≥4 且**跨 2 個不同日**成功回想。 |
| 動機健康 | 核心圖鑑**封頂 45 個九九 fact**＝有可達成的「完成」；大九九標為選配外星系；星星**永不衰退/死亡**、到期不羞辱；金幣 cosmetic-only。 |
| 工時 | **L**（可縮到 M：先 SRS+星圖+核心完成獎，寵物天空皮膚與大九九延後） |

### 數論基礎 — `number_theory.html`
| 面向 | 內容 |
|---|---|
| 結構 | `.page-container`→`.shell`；解說卡（奇偶/因倍/GCD/LCM）與 Sec4 的 7 張整除口訣卡包 `.u-grid`；12 個 `.game-area` 包 `.play-column`；保留 sticky `.top-nav` 並加 1 顆每日 Boss 按鈕。 |
| 功能 | 保留 12 個小活動（已驗證正確、已接 recordMath→recordAnswer）。改：加交錯＋間隔排程層；質因數分解對小四維持**選配 bonus**。 |
| 新增機制 | **今日神祕數字 — 質數寶石礦坑**：依日期決定性選一個 ≤50 的數，破解奇偶→質數→因數→整除口訣→(選配)質因數分解；完成捕獲一顆寶石（型別由數學性質決定，非隨機）進圖鑑，狐狸吉祥物「小數」慶祝。 |
| 記憶科學 | 對同一個數強制交錯全部概念；每題主動回想；日數字為 Leitner 排程（錯的概念/數字更早回來）；難度封頂在整除。 |
| 動機健康 | 一天一個數＝做完就「今日完成」，無無限刷；寶石型別決定性（非賭博）；金幣只買洞穴造型；回訪動力＝好奇心與收藏，非 FOMO。 |
| 工時 | **L** |

### 數論進階 — `number_theory_advanced.html`
| 面向 | 內容 |
|---|---|
| 結構 | `.page-container`→`.shell`；新增 8 張主題 `.u-card` 地圖選單（兼機制入口）；各節 `.visual-box` 包 `.u-grid`；8 個 `.game-area` 包 `.play-column`。 |
| 功能 | 保留 8 個進階小遊戲＋3 個示範。**本頁維持不上 XP/等級帳本**（誠實橫幅）— 不加 `award`/`recordAnswer`。 |
| 新增機制 | **數論探險地圖 — 8 枚探索印章**（集章冊）：完成一節的整套題目就點亮該印章，用 `Game.showToast` 慶祝（不加 XP）；集滿 8 枚 → 全圖彩帶＋一枚 cosmetic 徽章 `nt_explorer`（`awardBadge` 不動 XP/等級）。 |
| 記憶科學 | 主題交錯＋自由順序；每題主動回想＋錯誤即時解釋；示範先行（worked example）；集章帶動間隔回訪，可選「今天回訪一座島」重解。 |
| 動機健康 | 全頁明確定位「放輕鬆純挑戰／看不懂沒關係」；印章永久（無失落厭惡）；**不灌 XP** 保住誠實橫幅；框架是「探索/收集」非「必須集滿」。 |
| 工時 | **M** |

### 國語 — `chinese.html`
| 面向 | 內容 |
|---|---|
| 結構 | 去 `#app{max-width:500px}` 改 `.shell`；`.category-grid`→`.u-grid`（6 分類＋收藏/複習卡）；stats 改 canon overview；題目頁包 `.play-column`（閱讀行長很重要）；新增第 5 個 `#collection-screen` 圖鑑頁。 |
| 功能 | 保留 6 大分類×4 級×10 題 MCQ、即時回饋、combo、星等、已接 recordAnswer('chinese')。改：加 SRS 層（今天答錯的成語/在再永遠不會再出現＝要補的缺口）。 |
| 新增機制 | **字詞收藏冊＋記憶小精靈的今日複習**：每個成語/錯別字對/造句詞/常識詞有穩定 id 與 Leitner 紀錄，答對收進冊並升 **銅→銀→金印**；首頁「今日複習」拉跨分類的到期+錯題做**交錯複習**；閱讀理解排除（practice-only）。 |
| 記憶科學 | Leitner（1/3/7 天）；每次曝光皆主動回想；今日複習跨分類交錯；金印可額外藏兩個選項（回想傾向）；錯題最優先隔天回來。 |
| 動機健康 | 到期清空就說「明天見」＝有限、不製造工作；印章階梯給可見精熟；小精靈對應共用寵物；無失落厭惡/紅點催逼；金幣 cosmetic-only。 |
| 工時 | **L**（相簿 UI＋印章美術＋複習 session＋里程碑徽章為主要成本） |

### 英文 SRS 主應用 — `vocabulary_app.html`
| 面向 | 內容 |
|---|---|
| 結構 | `.main-content`→`.shell`；deck 選擇在 ≥768px 改 `.u-grid` 卡片（顯示精熟/總數）；`#learningArea`+模式列包 `.play-column`；≥1024px 用 `.dashboard`（主活動＋sticky 側欄放 Word-Dex 摘要）。 |
| 功能 | 保留 SRSEngine 排程與單一 review() 匯流、5 模式、TTS、每日新字上限、已接 recordAnswer('english')。改：在 shell 露出統一 profile；佇列真的清空時標記「每日複習遠征」完成餵每日任務環（不再靜默循環）。 |
| 新增機制 | **單字圖鑑（Word-Dex）**：每字進化階段是 SRS 卡狀態的純函數（🥚→🐣→🐥→🦉→🌟）；跨門檻放一次性慶祝＋小額 `Game.award`（受 monotonic bestStage 守衛，不可刷）；deck 100% 觸發里程碑。 |
| 記憶科學 | 進化階梯＝把既有擴張間隔（1d→7d→30d）視覺化；達 🦉/🌟 必須跨多日成功回想，當天狂刷無法快轉；佇列本身即交錯。 |
| 動機健康 | 進化決定性（非 loot box）；**bestStage 單調＝收藏只增不減**，休息一天不掉；金幣 cosmetic-only；每日遠征「可以休息」封頂努力；尊重 reduce-motion。 |
| 工時 | **M** |

### CEFR 閃卡 — `cefr_flashcard.html`
| 面向 | 內容 |
|---|---|
| 結構 | `.container`（560px）→`.shell`；≥1024px `.dashboard`（主 `.play-column` 閃卡/測驗＋sticky 側欄圖鑑環）；等級選擇升級為 `.u-card` 顯示收集進度；新增全寬 `.u-grid` 相簿。 |
| 功能 | 保留翻卡/測驗雙模式、音訊、彩帶、即時 recordAnswer。**修正 bug**：測驗模式目前完全沒接 Game（零 XP）→ 補上；每次重洗全牌 → 改到期優先排程；固定 20 字干擾項 → 改同級同層抽。**不設 `data-game-wired="english"`**（會壓掉主 app 的 SRS delta）。 |
| 新增機制 | **單字圖鑑・成長冊**：每字 tier 0–5（🥚→🌱→🌿→🌳→⭐→👑）存本地新 key；答對升階、答錯降一階但**有地板不歸零**；填滿一級 → 慶祝＋cosmetic 貼紙。 |
| 記憶科學 | Leitner box 驅動到期日（今天→1/2/4/7/14 天）；測驗＝主動回想（比翻卡辨識強）；跨級可選混合複習交錯；定義→單字為期望難度。 |
| 動機健康 | tier 有地板＝無懲罰重置/無失落厭惡；新字/場次封頂避免淹沒；金幣 cosmetic-only；決定性獎勵。 |
| 工時 | **L**（先遷結構再疊機制） |

### COCA 閃卡 — `coca_flashcard.html`
| 面向 | 內容 |
|---|---|
| 結構 | 去 body `max-width:560px`；全部包 `.shell`；≥1024px `.dashboard`（主 `.play-column`＋sticky 側欄收藏牆）；10 級維持膠囊 chip 列；收藏牆用 emoji 磚牆 `repeat(auto-fill,minmax(64px,1fr))`。 |
| 功能 | 保留翻卡/測驗、雙 TTS、`isUsableDefinition` 壞定義過濾、recordAnswer 接線。改：把只在 session 內的假 SRS 換成**持久化 Leitner**；**中文提示＋emoji 升為主線索**、英文定義降為輔助；L1–L3 標建議、L4–L10 標進階；score-bar 改「本級已收服 X/總數」。 |
| 新增機制 | **單字寶石圖鑑**：收服需**間隔開的 3 次答對**（box0→已精熟）；收藏牆灰階解鎖＋每 10 顆 sub-goal 慶祝；整級收滿 → 完成印章＋一次性徽章。 |
| 記憶科學 | Leitner 持久化間隔重複＋到期優先＋交錯＋3 次門檻確保真記得；排程保證同字不連續出現。 |
| 動機健康 | 收服後永不掉寶；無 loot box；金幣只買寶石皮膚；不重複灌 XP；主線索改中文+emoji 避免超綱英文定義挫敗。 |
| 工時 | **L** |

### TOEIC/GEPT 閃卡 — `toeic_gept_flashcard.html`
| 面向 | 內容 |
|---|---|
| 結構 | 去 body `max-width:560px`；插入 `.shell`；`#learningArea` 包 `.play-column`；`.dashboard`（主活動＋sticky 側欄圖鑑環/今日到期/星數）；圖鑑相簿 `.u-grid`。 |
| 功能 | 保留 TOEIC 300／GEPT 203 雙牌、翻卡/測驗、`isPoorDefinition`/`getDefinitionText` 守衛、已接 recordAnswer。改：加持久化每字 mastery（跨 reload/換級不重置）、到期優先排序、進度變可見收藏。頁面**未 wired**，加本地 key 安全。 |
| 新增機制 | **單字圖鑑：升星收藏冊**：每字 0→5 星存 `flashcard_srs_v1`；答對升星並拉長間隔、答錯降至 ★1 且近期重排；★5 變金卡飛進圖鑑；里程碑（10/25/50/100）一次性 toast＋小 `Game.award`。 |
| 記憶科學 | Leitner（1/2/4/7 天，用 `Game.localDate` 對齊連續日界）；翻卡/測驗＝主動回想；答錯降階＝期望難度；到期優先跨牌交錯。 |
| 動機健康 | 金卡永不失去（降階封頂 ★4）＝只增不減、無失落厭惡；無計時/無連續羞辱；決定性、無 loot box；金幣 cosmetic；到期優先自然封頂每日量。 |
| 工時 | **M** |

### 綜合練習 — `practice.html`
| 面向 | 內容 |
|---|---|
| 結構 | `.container`（900px）→`.shell`；`#category-selector`（14–16 主題）→`.u-grid` album shelf；`#card-area` 包 `.play-column`（**canvas 需在 reflow 後重量測 offsetWidth**）；stats 改成圖鑑完成度；新增第 5 個 Album 模式全寬 `.u-grid`。 |
| 功能 | 保留 4 模式（Learn canvas 場景/Quiz/Spell/Match）、同分類干擾項、TTS、已接 recordAnswer。改：加 `practice_album` 本地層存每字 {tier,lastSeen,lastCorrect}（目前 reload 全清空）；加 Album 模式與跨分類「複習挑戰」。**不改任何 vocab 資料**。 |
| 新增機制 | **單字圖鑑（Word Explorer Album）**：用既有 canvas 畫作當卡面；tier 未發現→已發現→🥉收藏→🥇精通（**需在較後日期、且用較難的 Quiz/Spell 再答對一次**，Match 單獨無法上金）；整本完成→彩帶＋徽章＋一次性金幣。 |
| 記憶科學 | 金卡門檻＝跨不同日的間隔第二次曝光（對齊遺忘曲線）；收藏≥3 天未複習翻「需複習」軟提醒（永不降級）；複習挑戰跨分類交錯；Quiz/Spell 為主動回想＝期望難度。 |
| 動機健康 | tier 永不掉、金幣不被收回；「due」只是軟圓點非懲罰；無計時、無 loot box、決定性；隔日上金框架為「明天再來收金卡」＝正向回訪；銅卡本身就完整慶祝，金卡是 bonus 非牆。 |
| 工時 | **L** |

---

## 4. 記憶科學總策略（間隔重複如何延伸到各科）

一條共同脊椎：**主動回想（retrieval）＋間隔重複（Leitner box）＋交錯（interleaving）＋期望難度（capped）**，用各科天生適合的載體呈現：

- **背誦型（英文四頁、國語）＝ 純 Leitner SRS**：每個項目一個 box 與到期日，答對升 box/拉長間隔、答錯降 box/近期回來；到期優先出題；「圖鑑進化/升印/升星」就是把擴張間隔視覺化。跨日界一律用 `Game.localDate` 對齊連續天數。
- **技能型（數學、乘法、數論）＝ SRS 精神 + 交錯**：math BOSS 輪流 4 子技能並重排戰中錯題；multiply 對每個 fact 做 SRS 並偏向到期出題；number_theory 每日對「同一個數」交錯全部概念。
- **共同守則**：金/精熟階級一律要求**跨多日**成功回想（防當天狂刷偽精熟）；錯題最優先回來；難度封頂在小四 flow zone；進度**只增不減**（收藏永不衰退＝避免失落厭惡）。
- **每日回訪引擎**：各頁的「今日複習/今日神祕數字/每日遠征」都是有限、會說「明天見」的到期佇列 → 餵統一每日任務與連續天數，形成健康習慣而非無限刷。

---

## 5. 建議實作順序

**Phase 0 — 共通結構（先做，低風險、立即改善 iPad 體驗）**
1. 全 10 頁 `.shell` + `--content-max` + `.u-grid` 選單 + `.play-column` 答題區遷移。
2. 高風險逐頁驗證：math 底部 nav 在 iPad ≥1024px 仍能顯示/置中（daily/wrong/stats 只能從這裡進）；multiply/practice 的數字鍵盤與 canvas 在 play-column 內重量測；閃卡 3D flip 與浮動 HUD docking 不回歸。

**Phase 1 — SRS/持久化資料層（機制的地基）**
3. 為需要的頁面建立**各自 namespaced localStorage key**（`chinese_collection`、`cefr_dex_v1`、`coca_dex_v1`、`flashcard_srs_v1`、`practice_album`、multiply SRS、number_theory gem/scheduler）。**絕不碰** `vocab_srs`/`vocab_stats`/`player_profile_v1`。
4. 修 cefr 測驗模式沒接 Game 的 bug；補各頁到期優先排程與同級干擾項。

**Phase 2 — 逐頁遊戲機制（每頁一個，收藏/圖鑑類可共用一套渲染範式）**
5. 先出 **L 級低風險頁**：math BOSS、multiply 星圖、number_theory 寶石、chinese 收藏冊、cefr、coca、practice。
6. 再出 **M 級**：vocabulary_app Word-Dex、toeic_gept 升星冊、number_theory_advanced 集章（含 game_core 加 1 個 `nt_explorer` 徽章，屬全站共用檔，需先過 reviewer）。

**每頁完成準則**：內容零改動且正確、XP 不重複計、無暗黑模式、手機+iPad 皆測過。

---

## ⚠️ 對抗式審查旗標（實作前必須釘住）

1. **重複計分（最高頻風險，橫跨 math/multiply/chinese/vocabulary_app）**：這些頁已 `data-game-wired`，XP **只能**走既有 `recordAnswer` 一次。所有新機制的里程碑獎勵**只能在「跨門檻/整區完成」時**呼叫一次 `Game.award`，**絕不可每題/每按鍵發**，否則 XP 灌水。vocabulary_app／cefr 進化 bonus 必須用 **monotonic bestStage 守衛**，否則重複按「記住了」＝金幣農場。

2. **`data-game-wired` 陷阱（cefr / coca / toeic_gept / practice）**：這些頁即時 `recordAnswer` 但**未 wired**。**絕不可**新增 `data-game-wired="english"` — 會 sticky 壓掉 vocabulary_app 主 SRS 的 delta XP。新資料只寫自己的 key。

3. **暗黑模式回歸（multiply / chinese / 所有收藏類）**：任何「星星褪色/到期不做就掉/還差 X 枚」文案＝失落厭惡，**禁止**。收藏必須只增不減、到期只做正向邀請（「來複習讓星星更亮」「明天見」）。

4. **超綱與 over-scope**：
   - number_theory 每日 Boss 池**必須 ≤50 且質因數分解維持選配**（sec5–7 本來就是小五–小六）。
   - number_theory_advanced 內容遠超小四 → 機制**只能 badge+toast+本地存**，**不上 XP/等級**（保住誠實橫幅）；框架為「探索/收集」非「必須集滿」。
   - coca/cefr L4–L10 有詞源殘渣壞定義 → 主線索改中文+emoji、標進階級。
   - **最大 scope 驅動＝相簿 UI+SRS+結構遷移三合一**。建議：multiply 可縮到 M（先 SRS+核心星圖，寵物天空皮膚與大九九延後）；各頁「先遷結構（低風險）再疊機制」，避免一次改壞既有引擎。

5. **內容正確（優先#1）**：math/number_theory 的題目產生器有精心防護（單一正解、精確小數、整數解、餘數<除數）— 新機制**逐字重用、不得重寫**。閃卡的 `isPoorDefinition`/`isUsableDefinition`/`getDefinitionText` 守衛全部保留。**cefr/coca 定義品質是本計畫最大的正確性風險**（定義→猜字，錯定義＝直接教錯），需安排一次 A1/A2/B1、L4–L10 的定義稽核（雖非本頁 JS 範圍，但阻擋真正價值）。

6. **資料遷移（multiply）**：既有 `mult_progress.mastery` 計數必須映射進新 SRS box（count≥3→box4、≥1→box2、mistakes→低 box），**壞的遷移會靜默清掉回訪孩子的星星**。

7. **時間基準**：所有間隔用 `Game.localDate()`（非 UTC），對齊連續天數日界；純本機、換裝置不同步 — UI 不承諾雲端即可。