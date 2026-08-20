# 公館國小電子書 — 遊戲化改版藍圖

> 本文件為總編輯統合全隊（內容體檢、遊戲設計、技術、UX、社會科、對抗式/兒童/QA 審查）後的**唯一可執行規格**。實作團隊以本文為準；凡與各子報告衝突之處，以本文的「裁決」為最終決定。

---

## 1. 願景與成功指標

### 願景
把散落的 14 個獨立 HTML 練習頁，整併成**一個有共同角色、共同世界地圖、共同每日任務**的台灣國小生電子書。核心讀者是公館國小小四生（9–10 歲）。目標是「沉迷式黏著但**健康**」——孩子**自己想**每天回來，而不是被父母逼。

### 「健康黏著」的定義（設計北極星）
- **一個成長中的自己**：任何科目答對，都餵養**同一個**角色（等級／金幣／連續天數／寵物），努力會累積成一個故事，而不是五個互不相通的小遊戲。
- **小而可完成**：每日任務 5–8 分鐘可清空，清空後 App 主動說「今天做完囉！」——教孩子健康地停下，而不是無限滑。
- **永遠在心流區**：預設難度鎖定小四，永遠不會被丟進沒學過的代數／負數／GRE 單字。
- **正向不恐嚇**：慶祝努力、歡迎回來；**絕不**用「你的火焰要斷了」這種失落厭惡（loss-aversion）逼小孩。

### 可衡量訊號（皆為 client-side，可從 localStorage 自我量測，無後端/無 PII）
| 指標 | 目標訊號 | 資料來源 |
|---|---|---|
| 每日回訪 | `streak.current` 中位數 ≥ 5 天；7 日連續徽章達成率 | `player_profile_v1.streak` |
| 每日任務完成 | 開啟 App 後完成當日任務比例 ≥ 60% | `daily.done` |
| 健康停損 | 完成任務後「主動離開」比例高（非被系統逼停） | `daily.earnedXp` 曲線 |
| 跨科擴散 | 一週內觸及 ≥ 2 個科目的比例 ≥ 40% | `subjects.*.lastPlayed` |
| 難度合身 | 每日任務**從不**出題超出學習者當前 level（回歸測試零違規） | 出題器單元測試 |
| 收藏黏著 | 至少擁有 1 件 cosmetics 的比例 | `ownedItems` |

**反指標（必須為 0）**：出現任何簡體字；每日任務出現超綱題；出現失落厭惡文案；出現外部網路依賴失效導致內容空白。

---

## 2. 現況體檢重點（依嚴重度排序）

### 🔴 P0 — 上線前阻斷（ship-blocker）

1. **英語內容修正到不了孩子（資料管線斷裂）**
   `vocabulary_app.html`（唯一真正遊戲化、孩子實際在用的英語引擎）從**遠端** `https://hdchen-course.github.io/` 載入 4 組單字資料（約 1063–1066 行）。而所有定義修正都改**本地** `vocab_data_*.js`——本地檔只被要被淘汰的 flashcard 頁讀取。**結論：最高優先的內容修正，改的是 App 根本沒載入的檔。** 兒童 App 也不該依賴個人 GitHub Pages（離線即壞、可在審查後被改）。

2. **災難性錯誤定義離首頁只有一鍵**
   `vocab_data_coca_L1.js` 最前面幾張卡教錯義：`the=「establishes a correlation with comparatives」`、`an=「So long as」`、`are=「a deprecated SI unit of area」`、`it=「a creature; a dehumanized being」`。在「看定義猜單字」的題型下，這些**無法猜、且教錯／不適齡的意思**。`index.html` 直接連到 `coca_flashcard`（全 10 級）與 `toeic`，完全無 gating。

3. **超綱內容被遊戲化獎勵包進孩子的獎勵迴圈**
   `math.html` 七個 level（小一～國一）全時解鎖，`每日挑戰`隨機從 level 0–6 抽題，會餵小四負數、`ax+b=c`、座標象限、`距離=√(x²+y²)`。`number_theory_advanced.html`（RSA／Euler／中國剩餘定理／二次剩餘／Pell）是高中～大學程度。整合計畫卻把 `Game.recordAnswer('math')` 接進去——**獎勵系統把孩子推向他學不會的內容**，與難度分級的修正互相打架。

### 🟠 P1 — 架構一致性（動工前必先定案）

4. **三套互斥的 profile 規格**
   同一個「統一角色」被寫成三種：`kg_player` + `kg.js` + `kg.award()`（gameDesign）／`player_profile_v1` + `window.Game` + `Game.recordAnswer()`（techPlan）／`player_profile` + `profile.js` + `Profile.addXP()`（uxSpec）。若不統一，各子團隊會寫出讀寫不同 key 的程式，**統一角色的整個目的會靜默失敗**。

5. **兩個 hub 並存**：`index.html` 與 `home.html` 都存在，入口與 profile home 會分裂。

6. **HUD 疊圖**：`math.html`／`multiply.html`／`chinese.html` 各自已有 exp bar + rank + streak。techPlan 的「每頁自動注入浮動 HUD」在這三個最常用頁會疊圖；而二元 opt-out（`data-game-hud=off`）又讓這三頁**看不到**統一等級——雙輸。

7. **遷移的「單調計數器」假設對英語不成立**：英語 XP 由 `vocab_stats.streak` 與 `history` 推導；streak 會正常下降、history 是每日值非累積。delta-sync 會把正常下降誤判為 reset。`multiply` 的 `resetProgress()` 歸零、`vocabulary_app` 的 `resetProgress()` 直接 `removeItem`（key 變 null），遷移需 null-guard。

### 🟡 P2 — 內容品質與分級

8. **英語定義品質**：即使是適齡集（YLE Movers/Flyers）也充滿成人辭典散文與殘渣（`DERIVATIVES`、`PHRASES`、`2 British English`、`(, quizzed`、拉丁字源當定義）。錯義：`scissors=「One blade on a pair of scissors」`（循環又錯）、`ruler` 給成統治者義但圖是尺、GEPT `credit/change` 義項對不上例句。英式用法（chemist/fridge/cinema）對學美語的台灣孩子造成混淆。
9. **數學分級**：`number_theory.html` 的 GCD/LCM/質因數分解是小五–小六（可作為有良好視覺鷹架的 stretch，加小徽章標示即可）；`number_theory_advanced.html` 全面超綱，應移出孩子主路徑。`÷6` 整除規則有教無測（quiz divisors 缺 6）。`practice.html` 其實是英語單字 App，誤列在數學。
10. **無持久化**：三個 flashcard 頁與 number_theory 頁**零** localStorage，每次重載歸零，缺乏回訪誘因。

---

## 3. 統一遊戲系統設計

### 3.1 核心迴圈（30 秒鉤子 → 每日習慣）
開 hub → 吉祥物「小夥伴」揮手 + 顯示**今天一個**建議任務（如「今天：數學小四關 1 個＋英語單字 5 張」，5–8 分鐘可完成）→ 點科目 → 在該頁既有引擎答題 → 每答對一次小 ding + XP/金幣跳動 → 收尾一張慶祝畫面（+XP、+金幣、任務進度、吉祥物歡呼）→ 回 hub，頂部共用列（Level／到下一級 XP／金幣／連續火焰）**當日首次**做任何任務就 +1。**任務清空後 App 說「今天做完囉！可以休息，也可以繼續玩」**。

### 3.2 Meta-progression
- **統一 profile**：新 key `player_profile_v1`（唯一裁決，見 §4），所有頁透過 `window.Game` 讀寫，餵養**一個**等級／金幣／連續天數／寵物／徽章。
- **XP + 等級階梯**：孩子聽得懂的中文階名（探險新手 → 小小學者 → 知識小勇者 → 智慧達人…），前期升級快、之後緩升；升級只慶祝，永不當付費牆。
- **金幣**：只從真實學習行為賺得，**只能買 cosmetics**，永不買提示／跳關／難度略過。
- **電子寵物**：從**學習里程碑**成長；**不衰退、不會餓、不會傷心/死亡**（無罪惡感）。但**可互動**（見 §3.4 修正）。
- **世界地圖／獎盃架**：每科是一座島，顯示該科真實精熟星星（math per-stage stars、multiply bestSpeed、vocab mastery、chinese state），一開 App 就看到「我走了多遠」。
- **成就徽章**：里程碑式（學會 9×9、答對 100 題、集滿一套動物單字、連續 7 天），一次性解鎖，非磨等。

### 3.3 獎勵經濟
兩種貨幣皆只由學習賺得：
- **XP（經驗值）**：驅動等級，不可花用，純進度訊號。+5/答對、+30/過關、+50/每日任務達標；大量遊玩後溫和遞減，避免鼓勵馬拉松式刷題。
- **金幣**：可花用軟貨幣，**只在商店買 cosmetics**（寵物服裝、hub 主題、貼紙）。
守則：(1) 永無真錢/IAP/廣告；(2) 只買外觀，永不買提示/跳關/加命；(3) 固定明碼、**無隨機轉蛋/寶箱**（未成年零賭博暴露）；(4) 賺取慷慨可預期，正常一天很快就買得起——豐足而非人為稀缺；(5) 全存 `player_profile_v1`。

### 3.4 健康黏著機制（含審查修正）
| 機制 | 做法 | 修正裁決 |
|---|---|---|
| **每日任務（小、封頂、依程度）** | 每日 1–3 個小任務存 `daily`，**只**從學習者當前 level 及以下抽題，完成即宣告「今天完成了！」停止催促 | 【必做】level-cap 為**必要**編輯，非選配 |
| **友善連續紀錄（含 freeze、不懲罰）** | 一個共用火焰 `streak`，當日觸及任何科 +1；每月 2 個自動 streak freeze；斷了顯示「歡迎回來！」＋容易重入 | 【必做】**移除**「今天還沒學喔，保住你的火焰🔥」這種預先失落厭惡提示；只保留事後「歡迎回來」 |
| **慶祝時刻** | 沿用 math/multiply 既有 confetti/combo/BOSS，透過 shared helper 擴到 number_theory/vocab | 尊重既有 `math_sound`/靜音設定 |
| **精熟星星（非速度排行）** | 每關至多 3 星（依準確率/精熟），個人最佳只給自己看（打敗自己的紀錄） | 無公開/社交排行（也符合無後端/PII） |
| **收藏冊（純外觀）** | 金幣買服裝/主題/貼紙；部分貼紙由完成主題單字集或數學島掉落 | 無寶箱、無轉蛋、無真錢 |
| **引導路徑「小四精通之路」** | hub 主打小四路徑（math Level 4、YLE Movers/Flyers + CEFR A1）；小五~國一與 COCA/TOEIC/B1 標「進階／給大哥哥姊姊」，number_theory_advanced 移到獨立「挑戰書架」 | 【必做】超綱內容**硬 gate**，非只加標籤 |

### 3.5 遊戲性變化與冒險（回應「quiz+confetti 太單調」）
- **每科至少一個真正不同的機制**（非只是換皮測驗）：例如寵物對戰（答對＝出招）、跑酷/賽跑（速度＝準確率）、建造/裝飾模式、節奏點擊。BOSS+combo 作為各島共用的「大場面」節拍。
- **寵物可每日互動**（維持不衰退/不羞辱）：花賺得金幣餵食/換裝、玩快速寵物小遊戲、升級時表演小把戲。
- **自由玩仍有獎勵**：保留「今天做完囉」慶祝，但**繼續玩仍以溫和遞減率**給 XP/金幣（不歸零），並開放選配自由模式（寵物小遊戲、無盡練習場、裝飾世界）。
- **輕量冒險故事線**：把各科島包進一張台灣探險地圖，有可見終點與簡單重複故事（小夥伴探索台灣/尋寶），每過一關推進故事；每日任務框成「今天這一段冒險」。
- **消滅閱讀牆**：每屏一句短句 + 大視覺/動畫 + 選配 TTS 朗讀 + 點擊揭露事實（尤其社會科與任何 number-theory 文字）。

### 3.6 明令禁止的 Dark Patterns
無變動比率/拉霸/寶箱/轉蛋 · 無真錢/IAP/廣告/登入/PII · 無 streak 失落罪惡感或寵物疏忽懲罰 · 無無盡/「再一個就好」壓力 · 無 pay-to-win/買過學習 · 無社交比較/公開排行 · 無假急迫/倒數獎勵/「朋友超前你」通知 · 無恐懼/敵意框架（尤其社會科）· 無把超綱內容當預設。

---

## 4. 技術架構

### 4.1 裁決：唯一 profile / helper / API（解決 P1-#4）
> **採用 techPlan 版本（最完整）。刪除 `kg_player`/`kg.js`/`kg.award` 與 `player_profile`/`profile.js`/`Profile.addXP` 兩套規格。**

- **localStorage key**：`player_profile_v1`（版本化）
- **shared helper 檔**：`game_core.js`（+ `game_core.css`）
- **唯一全域**：`window.Game`

### 4.2 資產與載入
根目錄兩個共用檔，無 build step、無框架：`game_core.js`（單一 IIFE 曝露 `window.Game`）＋ `game_core.css`（HUD/toast/badge，CSS 變數主題化，尊重 `prefers-reduced-motion` 與 iOS safe-area）。每頁在 `<head>` **末端**加兩行（**同步** `<script src>`，**非** defer/module，確保 inline script 執行前 `window.Game` 已存在）：
```html
<link rel="stylesheet" href="game_core.css">
<script src="game_core.js"></script>
```
自動初始化：(1) 一次性 legacy 遷移；(2) 冪等 legacy delta-sync；(3) ping 每日 streak；(4) HUD 策略見 §4.5；(5) flush toast/level-up/badge 佇列。`storage` 事件監聽跨分頁刷新 HUD。頂部 `CONFIG` 區塊集中：baseXp、combo 曲線、level 曲線、RANKS、每日目標 XP、徽章定義。**所有字串繁體中文。**

### 4.3 資料模型（`player_profile_v1`）
```jsonc
{
  "version": 1,
  "createdAt": "ISO", "updatedAt": "ISO",
  "displayName": "小小探險家", "avatar": "🦊",
  "totalXp": 0,           // 全域等級的來源
  "level": 1,             // 由 totalXp 經 CONFIG.levelCurve 推導（快取）
  "coins": 0,
  "subjects": {
    "math":    { "xp":0, "correct":0, "attempts":0, "bestCombo":0, "lastPlayed":null, "badges":[] },
    "english": { "xp":0, "correct":0, "attempts":0, "bestCombo":0, "lastPlayed":null, "badges":[] },
    "chinese": { "xp":0, "correct":0, "attempts":0, "bestCombo":0, "lastPlayed":null, "badges":[] },
    "social":  { "xp":0, "correct":0, "attempts":0, "bestCombo":0, "lastPlayed":null, "badges":[] }
  },
  "streak": { "current":0, "longest":0, "lastActiveDate":"YYYY-MM-DD", "freezes":0 },
  "daily":  { "date":"YYYY-MM-DD", "goalXp":50, "earnedXp":0, "done":false },
  "activity": { "YYYY-MM-DD": 0 },   // heatmap；寫入時裁剪為最近 365 天
  "badges": { "badgeId": { "earnedAt":"ISO" } },
  "ownedItems": [], "equippedMascot": null,
  "settings": { "sound":true, "reduceMotion":false },
  "legacyShadow": {                  // 支援冪等 delta-sync（僅真正單調計數器）
    "math_progress_exp":0, "mult_progress_exp":0, "chinese_exp":0,
    "english_total_reviews":0        // 見 §4.6：英語只用真正累積欄位
  },
  "migratedFlags": { "v1_seeded": false }
}
```

### 4.4 事件 API（皆同步；回傳 `{xpDelta, totalXp, level, leveledUp, newBadges}`）
- `Game.recordAnswer(subject, correct, meta?)`：`attempts++`；correct 則 `correct++` + in-session combo，`xp = CONFIG.baseXp * comboMultiplier(combo)`，轉呼 `award()`。
- `Game.award(subject, xp, meta?)`：`subjects[subject].xp += xp`；`totalXp += xp`；`daily.earnedXp += xp`；`activity[today] += xp`；重算 level（跨級發 `levelup`）；達每日目標且未 done → `done=true` + 金幣 bonus + 發 `daily-complete`；檢查徽章；persist（debounced、try/catch）。
- `Game.recordSession(subject, {correct,total,durationMs})`
- `Game.pingActive()`：同日 noop；昨日 `current++`（更新 longest）；缺口 >1 消耗 freeze 或 `current=1`。發 `streak`。
- `Game.awardBadge(id)` · `Game.getProfile()` · `Game.on/off(evt,cb)`（evt: `xp`/`levelup`/`badge`/`streak`/`daily-complete`）· `Game.showToast(msg)` · `Game.reset(scope)`
- **Subjects enum**：`'math' | 'english' | 'chinese' | 'social'`

**頁面→科目對應**：`math.html`+`multiply.html`+`number_theory.html` → `math`；`*_flashcard.html`+`vocabulary_app.html`+`practice.html` → `english`；`chinese.html` → `chinese`；`social_studies.html` → `social`。
**裁決**：`number_theory_advanced.html` 移到獨立「國高中挑戰」書架，**不呼叫 `Game.*`、不餵孩子主 profile**（解決 P0-#3）。

### 4.5 HUD 策略（解決 P1-#6）
- **有原生 HUD 的頁（math/multiply/chinese）**：**不**自動注入浮動 HUD；改由該頁在 load 時以 `Game.getProfile()` 更新自己**既有**的 exp bar/streak，答對時呼叫 `Game.recordAnswer/award` 並可觸發 toast。
- **無 HUD 的頁（flashcards/number_theory/practice/social）**：注入 `game_core` 的浮動 HUD（level chip + XP bar + streak flame + daily ring）至單一 `#game-hud-root`。
- 保留 `<body data-game-hud="off">` 作為極端衝突時的逃生口，但**不**作為 math/chinese 的常態方案。

### 4.6 既有狀態遷移（非破壞式；解決 P1-#7）
legacy key 永不刪除/覆寫；舊頁照常讀寫 `math_*`/`mult_progress`/`chinese_game_state`/`vocab_*`。
1. **一次性 seed**（由 `migratedFlags.v1_seeded` 守衛）：`subjects.math.xp = (math_progress.exp||0)+(mult_progress.exp||0)`；`chinese.xp = chinese_game_state.exp||0`；全域 `streak.current` 取各來源最大值。**`vocab_srs` 完全不動**（那是 SRS 排程，非遊戲化）。設定 `legacyShadow` 快照、`v1_seeded=true`。
2. **冪等 delta-sync**（每次 load，免改頁）：**僅對真正單調計數器**計算 `delta = current - shadow`，`delta>0` 才加入並前移 shadow。
3. **reset/null 防護**：`delta<0`（如 `multiply.resetProgress()` 歸零）→ 視為 legacy reset，**把 shadow 降到新值但不從 profile 扣**（孩子全域進度不因單科 reset 被毀）。讀取前**一律 null-guard**（`vocabulary_app.resetProgress()` 用 `removeItem`，key 變 `null`），全部包 try/catch，key 重建後回到正常流程。
4. **英語裁決**（解決 P1-#7）：英語 XP **不**由 `vocab_stats.streak`/`history`（非單調）推導。改為 **(a)** 直接在 SRS 評分/flashcard「認得」時呼叫 `Game.recordAnswer('english',...)`（新 XP 來源），或 **(b)** 從真正累積欄位（歷來總複習數 `english_total_reviews`）做 delta-sync。

### 4.7 風險與守則
- **origin**：`file://` 下 localStorage 可能不跨頁共享/被停用——**一律用本機 http server 測試**，勿雙擊開檔。
- **雙重計數**：`v1_seeded` 守衛 + delta-sync 前移 shadow。
- **配額（~5MB）**：`activity` 裁剪 365 天；每次寫入 try/catch，配額滿不可讓頁面自身存檔崩潰。
- **簡體洩漏**：見 §7 的確定性掃描 gate。
- **script 順序**：同步 `<script src>`；確認無頁面定義同名 `Game` 全域（現有頁用 local `state`，安全）。
- **streak 日界**：用**本地** `YYYY-MM-DD`（非 UTC），台灣傍晚讀書算對的一天。
- **無障礙**：尊重 `prefers-reduced-motion`；confetti/聲音選配（尊重既有 sound flag）。

---

## 5. 響應式 UX 規格（13" iPad + 手機）

### 5.1 策略
單一程式碼庫、mobile-first、min-width media query + CSS Grid `auto-fit`，無 JS 分支。**先做 tokens**：抽出共用 `/assets/app.css`（14 頁共用），所有寬度/間距/字級用 CSS 變數，不再各頁散寫 px（現況 max-width 從 180px 到 1100px 亂跳）。

### 5.2 Breakpoints（語意化）
| 區間 | 裝置 | 佈局 |
|---|---|---|
| 0–599px | 手機 | 單欄，一屏一任務（沿用現有 500–560px 感） |
| 600–1023px | 大手機橫向/小平板 | 2 欄 grid，內容 max 720px |
| ≥1024px | 13" iPad / 桌機 | **儀表板模式**，內容 ≤1200px，固定左欄 rail + 多欄 grid（iPad 直式 1024w 落此邊界，橫式 1366w 給 3 欄）|

機制：`--content-max` token（720/1200）套在 `.shell`，`margin-inline:auto`；卡片 grid 用 `repeat(auto-fit, minmax(240px,1fr))`（1/2/3–4 欄自動生成）；**執行中的練習**互動欄限 `min(680px,100%)` 即使在 iPad（避免追很長的行），空出的側邊放常駐 stats（`[main 1fr][aside 320px]`）；`clamp()` 流體字級/間距；`dvh/svh`（含 vh fallback）避免 iOS Safari 工具列裁切底部；一切以 width+grid 為主，旋轉只改欄數。

### 5.3 index.html 首頁改造「學習冒險基地」（唯一 hub — 解決 P1-#5）
> **裁決：`index.html` 為唯一 canonical hub。`home.html` 併入或重導到 `index.html`，不維護兩份分歧頁。**

**iPad（≥1024px）**：
- **左 rail（260–300px，sticky 全高）**：Player Profile 卡——avatar、暱稱、Level + XP bar、連續火焰、金幣/星星總數、垂直科目導覽（數學/英文/國語/社會）。
- **主區（流體 ≤1200px）**：頂部橫幅「今日任務」，下方科目 3 欄卡片 grid（`auto-fit minmax(240px,1fr)`），每卡有 mini 進度環 + 上次遊玩 chip；右下常駐「繼續上次」磚。

**手機（0–599px）**：
- 頂部緊湊 Profile header（avatar+暱稱一行；Level/XP + 火焰 + 金幣一行 chips）→「今日任務」卡 → 科目垂直卡片列（大 icon + 標題 + 進度環 + 「繼續」）→ **固定底部 tab bar**（5 項：首頁/數學/英文/國語/社會），safe-area 內距。

**Profile 元素**：可編輯 avatar（emoji/動物，無照片無 PII）、一次性輸入暱稱、大 Level、動畫 XP bar、火焰、金幣、成就 chips 橫向捲動、「繼續上次」深連結（存 lastRoute）。**移除「保住火焰」預警**；斷線只在回來時暖心「歡迎回來！」。

### 5.4 科目頁（iPad）
兩區 grid：主玩欄 ≤680px + 320px sticky aside（即時 stats：得分/combo/streak/進度點/錯題數，手機時原本擠在 header）。選單/選關用 2–3 欄 auto-fit grid。Flashcard 放大置中，牌組控制（選級/洗牌/聲音）放 aside。

### 5.5 觸控目標（為 9–10 歲手指放大）
- `--tap-min: 48px` 為任何互動元素下限。
- 主要答題/動作鈕 56–64px 高，`font-size: clamp(17px,4.5vw,20px)`，手機全寬（16px 側邊留白），`border-radius:16–20px`。
- Icon-only 控制（返回/設定/聲音）湊到 48px 命中區（`padding:12px; margin:-12px` 技巧）。
- 相鄰目標間距 ≥12px（答題選項 ≥16px）。
- 保留 `:active{transform:scale(0.95–0.97)}` 按壓回饋；加 `-webkit-tap-highlight-color:transparent`。
- 無 hover-only；拖曳/滑動（翻卡）**必附**點擊 fallback 鈕。
- 底部 tab ≥56px + safe-area 內距，icon ≥28px 帶文字。

### 5.6 視覺 tokens（`/assets/app.css`）
- **背景**：`--bg: linear-gradient(180deg,#e8f4fd,#f0f9ff,#fef9e7)`（沿用品牌）；`--card:#fff`；`--card-border:#e8f0fe`。
- **品牌**：`--c-primary:#0984e3`；`--c-primary-soft:#74b9ff`。
- **科目色**：數學 `#6c5ce7/#a29bfe`（紫）、英文 `#00b894`（綠）、國語 `#fdcb6e`（琥珀）、社會 `#e17055`（台灣土色赭紅）。
- **語意**：`--c-correct:#00b894`、`--c-wrong:#ff7675`、`--c-warn:#fdcb6e`、`--ink:#2d3436`、`--ink-soft:#636e72`。
- **遊戲化**：`--c-xp:#0984e3`、`--c-streak:#ff7675`、`--c-coin/star:#fdcb6e`。每個 accent 附 10% tint chip 底色。
- **字體**：`--font:'Nunito',-apple-system,…`；`--fs-h1:clamp(24px,5vw,40px)`、`--fs-h2:clamp(18px,3.5vw,24px)`、`--fs-body:clamp(15px,2.5vw,17px)`（body 永不低於 15px）；標題 700/800、body 600。
- **間距/圓角/陰影**：`--s1..s6`(4/8/12/16/24/32)、`--r-sm/md/lg`(14/20/24)、`--shadow-sm/lg`。
- **共用元件 class**：`.card`、`.btn/.btn-primary`、`.chip`、`.progress-ring`、`.xp-bar`、`.stat-tile`、`.badge`、`.bottom-nav`、`.sheet`（bottom-sheet modal）、`.profile-card`。

### 5.7 無障礙（必做）
- **移除 viewport 鎖定**：從 `index.html` 拿掉 `maximum-scale=1.0, user-scalable=no`，只留 `width=device-width, initial-scale=1.0`；其他頁也不得加（低視力孩子/家長需 pinch-zoom）。
- WCAG AA 對比（body 4.5:1、大字 3:1）；對錯狀態**不只用顏色**（配 ✓/✗ icon + shake/pop）；真 `<button>/<a>` + `:focus-visible` 環 + 邏輯 tab 序；`lang="zh-TW"`（**13 頁全數驗證**）；icon 鈕加 `aria-label`、分數/回饋用 `aria-live="polite"`；尊重 `prefers-reduced-motion` 與 `prefers-color-scheme`；`env(safe-area-inset-*)`；聲音為 enhancement，靜音鈕明顯；用 bottom-sheet 收回取代小 X。

---

## 6. 新增「社會」科 — `social_studies.html`

**科名**：社會 — 我們的台灣（台灣中心社會科）。Greenfield，**從第一天就直接用 `Game` API**（`Game.recordAnswer('social',...)`、`award`、badges），無需遷移，並示範最佳實踐。**每屏一句短句 + 大視覺 + 選配 TTS + 點擊揭露**，杜絕閱讀牆。

### 七關單元
| 關 | 標題 | 學習目標（摘） | 遊戲形式 |
|---|---|---|---|
| 1 | 台灣在哪裡？認識我們的島 | 在世界/亞洲地圖找到台灣；本島+澎湖/金門/馬祖/蘭嶼/綠島；海洋是鄰居；方位與圖例 | 「地圖尋寶」拖曳：標籤拖到正確位置，集星解鎖島嶼圖鑑 |
| 2 | 高山、河流與海岸：地形與天氣 | 高山/丘陵/平原/盆地/海岸；玉山、中央山脈、西部平原；河流、颱風/梅雨的好處與風險、防颱 | 「登山闖關」進度條：答對往玉山前進，收集山/河/平原徽章 |
| 3 | 我的家鄉與社區 | 自己縣市與六都主要縣市相對位置；公共設施與服務人們的工作；我是社區一份子 | 「家鄉名片」連連看 + 創作填空小卡（存 localStorage，可回來補） |
| 4 | 最早的主人：原住民族 | 原住民族是最早居住者，多族（阿美/泰雅/排灣/布農/達悟…）各有語言服飾歌舞；尊重欣賞差異、不比較高低 | 「族群文化圖鑑」收集：答對解鎖圖鑑卡，集滿得「文化小尊重家」；無「哪族較好」比較題 |
| 5 | 台灣的故事：時光走廊（歷史） | 時間軸：原住民族→荷西→鄭清→日治→中華民國走向民主；多元人群共同形成今日；按時序排序、尊重不同祖先故事 | 「時光走廊」排序：事件卡拖到時間軸，解鎖台灣小故事，完成點亮「台灣說書人」；中立事實、不醜化任何族群 |
| 6 | 自由的台灣：民主、投票與法治 | 人民投票選出代表、大家一起決定；立法/行政/司法大致分工；法治=人人守公平規則、保障自由安全；用班級生活理解 | 「班級小小選舉」情境模擬 + 「這樣公平嗎？」是非題，得「民主小公民」 |
| 7 | 我是好公民：權利、責任與多元共好 | 基本權利（受教育/被保護/表達）與責任（守規則/愛護環境/尊重他人）；和平講理解決衝突；欣賞本地人/原住民族/新住民多元社會 | 「好公民任務卡」每日挑戰：抽生活情境卡選最友善負責做法集點，累積連續天數，兌換「多元共好小英雄」 |

### Framing / 安全確認（含審查修正）
- **全程台灣為主體**：地理、地形、原住民族文化、歷史時光軸、民主/自由/法治、公民權責、多元共好——是獨立主題，非任何國家附屬。
- **正向、事實、適齡**：短句、具體例子、生活連結、班級體驗；全程繁體中文；不含仇恨/宣傳/貶低任何國家或族群；強調欣賞差異、和平解決衝突、尊重每個人。
- **兩岸議題**（第 5、6 關）：以事實、中立、非情緒化帶過（如「台灣海峽對面是中國大陸，兩邊由不同政府分開治理，彼此的不同應該用和平方式面對」），重點在珍惜與守護台灣自身的自由民主，**不教敵視**。
- **【審查修正 — 主權措辭】** 第 5、6 關**避免把有政治爭議的主權結論當既成事實斷言**。改以**可觀察的公民事實**陳述：有選舉、人民投票、規則對每個人一體適用、尊重差異、言論自由受保障——用孩子能驗證的事實，避免被部分家庭視為政治灌輸。措辭在上線前須通過**人工編輯簽核**（§7）。

---

## 7. 對抗式審查與兒童安全結論（must-fix 逐項處置）

| # | Must-fix（來自三份審查） | 裁決/處置 | 驗收 |
|---|---|---|---|
| 1 | vocab_data 修正到不了孩子 | **【ship-block】** 把 `vocabulary_app.html` **repoint 到本地相對** `vocab_data_*.js`（4 組 vendored 入 repo），成為唯一本地審查來源；game_core 也一律本地 | 部署後實際載入頁，抽查 5 個修正詞顯示新義 |
| 2 | 三套 profile 規格衝突 | **【定案】** `player_profile_v1` + `game_core.js` + `window.Game`（§4.1），刪另兩套 | 每頁讀寫路徑斷言 key 字串一致 |
| 3 | COCA L1 錯義 + 硬集離首頁一鍵 | **【ship-block】** `index.html` **移除** COCA L1–L10 / TOEIC / CEFR-B1 直連並 gate 為「給大人/中學生」；改寫可達的功能詞/kid-set 定義為短句美語 A1 一行，功能詞以中文+emoji+例句為主、捨英文 gloss | index.html 無硬集直連；L1 前 15 詞人工複核 |
| 4 | HUD 疊圖 | math/multiply/chinese 餵原生 bar（`Game.getProfile()`），只在無 HUD 頁注入（§4.5） | 三頁無疊圖、仍顯示統一 level |
| 5 | 每日挑戰超綱 + advanced 餵 XP | **【必做】** 每日挑戰 level-cap（當前及以下）為必要編輯；`number_theory_advanced` 移「國高中挑戰」書架且**不餵**主 profile | 回歸測試：每日任務**永不**抽超綱題 |
| 6 | 英語 delta-sync 非單調 | 英語 XP 改為直接 `Game.recordAnswer` 或真正累積欄位（§4.6-4） | 遷移測試：streak 下降不誤判 reset |
| 7 | 「保住火焰」失落厭惡文案 | **【移除】** 只留事後「歡迎回來！」 | hub 文案審查無預警式提示 |
| 8 | 兩個 hub | **【定案】** `index.html` 為唯一 hub；`home.html` 重導/併入 | 單一入口 |
| 9 | 社會第 5/6 關主權措辭 | 軟化為可觀察公民事實（§6）；人工編輯簽核 | 上線前簽核紀錄 |
| 10 | 遷移正確性（reset/null/配額/冪等） | null-guard + try/catch + `v1_seeded` 守衛 + shadow 前移 + `delta<0` 不扣 | **遷移測試套件**全綠 |
| 11 | 繁體字保證 | **確定性掃描 gate** | 見下 |

**確定性簡體掃描 gate（必做、零命中才可上線）**：一支 script 掃描 Simplified-only 碼位集 + 精選變體/同形陷阱清單（説→說、裏→裡、麽→麼、爲/為、羣/群、鍾/鐘、简→簡、体→體、关→關、单→單、后→後 等），範圍涵蓋**所有** `.html` + `vocab_data_*.js` + `game_core.js` + `social_studies.html`，並掃**遠端** `hdchen-course.github.io` 副本；同時驗證 13 頁全帶 `lang="zh-TW"`。列為 ship checklist 必要 gate，非人工「self-check」。

**裝置/斷點/origin 測試矩陣（真實 http server，非 file://）**：13" iPad 直式 1024w + 橫式 1366w、iPhone SE/小手機 375w、Android 360–412w、斷點邊界 599/600/1023/1024。每台驗證：HUD 不疊 math/chinese 原生 bar、底部 nav 讓開 iOS home indicator、移除 viewport 鎖後 pinch-zoom 生效、跨分頁 `storage` 事件刷新 HUD。

**遷移測試套件（必寫必過）**：全新安裝；由每個 legacy key 播種的回訪者（math_progress/math_stats/math_daily/math_wrong/mult_progress/chinese_game_state/vocab_stats/vocab_srs）；重載冪等（無 XP 膨脹、shadow 前移）；單科 resetProgress→負 delta 但全域 XP 保留；removeItem 刪 key→null shadow 有 guard；key 刪後重建；配額滿寫入包 try/catch 不崩潰。

**已確認良好、保持原樣**：無 IAP/廣告/寶箱/轉蛋/PII/登入/公開排行；cosmetic-only 賺得金幣經濟；社會科無仇恨/宣傳、明確教和平與尊重差異、兩岸處理刻意非情緒化。

---

## 8. 分階段實作路線圖

> 順序原則：**先立地基（引擎+資料源+安全 gate），再立入口（hub），最後逐科接線**。delta-sync 讓未改的頁也能先自動累積 XP，因此「接線」多為漸進強化，非阻斷。effort：S/M/L。

### Phase 0 — 阻斷項與地基先清（必先，約 1 週）
1. **【S】定案 profile 規格**（§4.1）——所有後續依此。
2. **【M/ship-block】repoint `vocabulary_app.html` 到本地 `vocab_data_*.js`**，4 組 vendored 入 repo（P0-#1）。
3. **【M/ship-block】`index.html` 移除硬集直連並 gate**（COCA/TOEIC/B1）（P0-#3）。
4. **【S】確定性簡體掃描 script + lang 驗證**，接入 ship checklist（§7）。
5. **【S】抽出 `/assets/app.css` tokens**；移除 `index.html` viewport 鎖。

### Phase 1 — 共用引擎 + Hub（核心黏著槓桿，約 1.5–2 週）
6. **【L】`game_core.js`**：CONFIG、profile load/save（debounced/try-catch/storage-event/365 天裁剪）、一次性 seed + 冪等 delta-sync + reset/null 防護、streak/daily 引擎、event bus、HUD/toast/level-up/badge DOM 注入（依 §4.5 策略）。**全繁體。**
7. **【S】`game_core.css`**：HUD/toast/level-up/badge，CSS 變數主題化、phone+iPad、`prefers-reduced-motion`、safe-area。
8. **【M】`index.html` 改造為 hub**：Profile 卡（iPad 左 rail / 手機頂部）、今日任務、科目 grid+進度環、繼續上次、成就 chips、底部 tab（手機）。移除「保住火焰」文案，改暖心歸來。**`home.html` 重導入 `index.html`。**
9. **【M】遷移測試套件**（§7）撰寫並通過。
10. **【S】裝置/斷點矩陣**首輪（真實 http server）。

### Phase 2 — 數學科整合（既有 HUD 頁，約 1 週）
11. **【M】`math.html`**：加 includes（delta-sync 立即生效）；用 `Game.getProfile()` 更新**既有** exp bar，答對呼叫 `Game.recordAnswer('math')`；**【必做】每日挑戰 level-cap（當前及以下），預設首頁對焦小四，小五~國一標「進階」**（P0-#3）。
12. **【S】`multiply.html`**：includes + `scoreQuestion` 接 `Game.recordAnswer/award`（映射 `math`）。
13. **【M】`number_theory.html`**：includes + 注入 HUD（無原生）+ 答對接線；補 quiz divisors 加 `6`（÷6 有教必測）；GCD/LCM/因數分解加「小五–小六」小徽章。
14. **【S】`number_theory_advanced.html`**：移到獨立「國高中挑戰」書架，**不接 `Game.*`、不餵主 profile**（P0-#3）。

### Phase 3 — 英語科整合 + 內容修正（約 1.5 週）
15. **【M/ship-block 內容】改寫英語定義**（在**本地已 repoint** 的 `vocab_data_*.js`）：短句、正確義、美語、A1 讀級；strip `DERIVATIVES/PHRASES/2 British English/`拉丁字源；修 `scissors`/`ruler`/`credit`/`change`；功能詞以中文+emoji+例句為主。（P0-#1/#2、P2-#8）
16. **【M】`vocabulary_app.html`**：本地 includes；英語 XP 由 **SRS 評分直接 `Game.recordAnswer('english')`** 或累積 total-reviews（**不**用 streak/history）（P1-#7）；`vocab_srs` 不動。
17. **【M×3】`cefr/coca/toeic_gept_flashcard.html`**：加 includes + 注入 HUD + 首次持久化；接 known/again → `Game.recordAnswer('english')`；補 localStorage/streak；缺失 mp3 改 live Web Speech TTS。
18. **【M】`practice.html`**：重新歸類為英語；includes + quiz 答對接 `Game.recordAnswer('english')`。
19. **【M】Chinese-first / picture-first 易模式**：flashcard 加「先認得再回想」易模式（emoji/中文優先），杜絕 definition-first 不可能線索。

### Phase 4 — 國語 + 社會 + 遊戲性深化（約 2 週）
20. **【S】`chinese.html`**：includes + delta-sync（`chinese_game_state.exp` 映射 `chinese`）+ 既有 bar 餵 `Game.getProfile()`。
21. **【M】`social_studies.html`（新）**：七關（§6），從第一天用 `Game` API；每屏一句 + 大視覺 + TTS + 點擊揭露；第 5/6 關措辭軟化 + **人工編輯簽核**；接入 hub 科目 grid 與底部 tab。
22. **【M–L】遊戲性變化與冒險**（§3.5）：每科至少一個非測驗機制、可互動寵物、繼續玩溫和遞減獎勵 + 自由模式、輕量台灣探險故事地圖。（可切成獨立迭代，非阻斷上線）

### Phase 5 — 收尾與上線 gate（約 0.5–1 週）
23. **【S】完整裝置/斷點/origin 矩陣**回歸；HUD 非疊圖驗證。
24. **【S】簡體掃描零命中 gate**（本地 + 遠端副本）+ 13 頁 `lang` 驗證。
25. **【S】回歸測試**：每日任務永不超綱；部署站抽查 5 個修正詞顯示新義。
26. **【S】社會第 5/6 關 + 兩岸措辭最終編輯簽核**。

**關鍵路徑**：Phase 0 → Phase 1 為硬前置（規格 + 資料源 + 引擎 + hub）。Phase 2/3/4 可在 Phase 1 完成後**部分並行**（不同科目子團隊），但每科上線前都必須過 Phase 5 的三道 gate（簡體零命中、超綱回歸、部署站內容抽查）。

---

## 6.5 新增「理財與經濟」科 — `finance.html`（整合說明）

本科由並行的理財小組（設計 + 對抗式/兒童安全審查 + 總編輯）產出，作為電子書的**第 6 個科目**，與「社會」科互補（公民 + 經濟）。整合到統一系統的裁決：

- **Profile 科目 enum 新增 `finance`**：`subjects.finance = {xp,correct,attempts,bestCombo,lastPlayed,badges}`（§4.3）；`Subjects enum` 擴為 `'math' | 'english' | 'chinese' | 'social' | 'finance'`。
- **新頁 `finance.html`**：greenfield，從第一天直接用 `Game` API，無遷移；接入 hub 科目 grid 與底部 tab（tab 增為 6 項或改為「更多」收納）。
- **旗艦遊戲「我的小攤子」**沿用統一金幣＝XP 規則；畫面明示「這是學習點數，不是真的錢」。
- **兒童安全裁決（已由審查修正、與主藍圖 §3.6 一致）**：章節式推進取代每日時間軸、移除會歸零的連勝與限時急迫、隨機事件事前明示且結算區分「決定 vs 運氣」、分享捐款脫離獎勵僅給情感回饋、利息去除「錢會自己長大」暗示、虧本為不懲罰的學習事件。
- **實作排程**：併入 Phase 4（與社會科同批），列為獨立 greenfield 迭代。

以下為理財小組的完整科目設計（總編輯定稿）：

## 新增「理財與經濟」科

### 學習目標與年段

**年段定位：** 國小四年級（約 9–10 歲）為主，內容與遊戲難度可向下相容三年級、向上延伸五年級。

**核心學習目標：** 讓孩子建立健康、能賦能自己的金錢觀——錢來自工作與創造價值、先存再花、分辨需要與想要、會編簡單預算、懂得取捨、認識銀行與利息、理解價格背後的供需、誠實做小生意、當聰明又善良的消費者，並願意分享與關心公平。

**呈現原則（採納兩份審查的共同要求）：**
- **少字、用演的：** 每關文字精簡到幾句話，改以配音＋卡通動畫＋邊玩邊學呈現，孩子靠拖、滑、選來理解道理，不必讀整牆文字。
- **白話取代術語：** 抽象大人詞（機會成本、供給與需求、利息）一律換成孩子聽得懂的說法並用動畫演出，專有名詞最多作為附帶說明。
- **章節式推進，不綁每日：** 以「關卡／章節」推進取代「每日」時間軸；不設每日登入獎勵、不設會過期的每日任務，孩子可依自己步調中斷與回來，降低螢幕黏著與焦慮。
- **失敗要溫柔、進步要慶祝：** 全科取消會「歸零／斷掉」的跨日連勝計數，改用只增不減的累積型進度；答題不設倒數與限時加倍等急迫機制，孩子可以慢慢想。
- **學習金幣＝經驗值：** 全程明確標示「這是學習點數，不是真的錢」，無抽卡、轉盤、下注、戰利品箱或真錢購買。

### 單元清單

**第 1 關：錢從哪裡來？工作與價值**
- **概念：** 錢是大家同意用來交換的工具；錢多半來自工作，而工作是替別人解決問題、創造價值。
- **學習目標：** 想像「如果沒有錢會怎樣」以說出錢的用處；舉出三種工作各幫別人解決什麼問題；理解賺錢＝提供別人需要的東西或服務，不是憑空出現。
- **範例：** 用「假如今天世界上都沒有錢，你想拿高麗菜換一條魚，但賣魚的人不缺高麗菜，怎麼辦？」的思想實驗帶出錢的方便；不斷言「以前真的都用以物易物」。想一想：便利商店店員、獸醫、公車司機各幫別人解決了什麼問題。
- **遊戲形式：** 「工作配對」動畫小遊戲——把職業卡拖到它幫忙解決的問題上，配對正確得學習金幣與經驗值（永久累積、不會歸零），全部答對解鎖『價值偵探』徽章並開通旗艦遊戲的第一批可販售商品。

**第 2 關：需要 vs 想要**
- **概念：** 需要是生活不能少的（食物、乾淨的水、衣服、住的地方）；想要是有了更開心但沒有也能活。錢有限，先顧需要。
- **學習目標：** 把日常物品正確分成需要與想要；理解同一樣東西在不同情況可能是需要也可能是想要；花錢前先問自己「這是需要還是想要？」。
- **範例：** 小華只剩 50 元，動畫演出便當、貼紙、雨天的雨衣、扭蛋掉下來，讓孩子分辨（便當和雨衣是需要，貼紙和扭蛋是想要）。
- **遊戲形式：** 「兩個籃子」分類遊戲——物品掉下來，孩子滑進『需要』或『想要』籃。分對得經驗值，分錯只溫柔提示原因、不扣分、不限時。這個判斷會影響孩子在旗艦遊戲進貨時的花錢建議。

**第 3 關：存錢高手——設定目標**
- **概念：** 存錢就是先不花、把錢留到以後用；看得到的目標讓存錢更有動力。三罐法：存起來、花用、分享。
- **學習目標：** 設定一個存錢目標並算出要存多久；理解「延遲享受」；養成拿到錢先分三罐的習慣。
- **範例：** 小傑想買 300 元的樂高，每週存 30 元要幾週（10 週）；畫「存錢溫度計」，每存一筆就塗滿一格。
- **遊戲形式：** 「撲滿溫度計」目標追蹤——旗艦遊戲賺到的學習金幣可投入撲滿，一格格填滿。達標播放慶祝動畫、頒『延遲享受』徽章並給經驗值大獎。存錢的主要動機來自「達成目標」的成就感，而非增值。

**第 4 關：做預算——聰明花錢**
- **概念：** 預算就是先計畫錢怎麼分配再花；把收入分給需要／想要／存錢／分享，才不會提早花光。
- **學習目標：** 替一筆固定的錢做簡單分配表；理解「量入為出」；看懂收入減支出等於剩多少。
- **範例：** 同樂會有 200 元，想買的東西加起來 230 元超過了，請孩子刪掉或換便宜的，並想想哪項是大家一起吃的需要、哪項是可先砍的想要。
- **遊戲形式：** 「同樂會採購」預算拼圖——勾選商品時即時顯示剩餘金額，超支變紅無法過關。控制在預算內過關得經驗值，剩下的學習金幣自動存進撲滿。

**第 5 關：選一個就少一個（取捨）**
- **概念：** 資源有限，選了 A 就得放掉 B；被放掉的那個選擇就是代價。時間也是一種資源。（「機會成本」一詞只作為附帶小字，主打白話。）
- **學習目標：** 說出選一個要放掉什麼；理解每個決定都有代價，沒有「全部都要」；學會比較兩個選項再決定。
- **範例：** 週六只有 2 小時，打球或看兩集卡通只能選一個；把 100 元拿去買漫畫，撲滿就少一格。
- **遊戲形式：** 「岔路二選一」情境遊戲——選一張卡，動畫立刻演出「你拿到什麼／你放掉什麼」（例如拿到漫畫，撲滿溫度計就少一格），讓孩子用眼睛看到失去。此機制也用在旗艦遊戲：錢進了檸檬就不能同時進紅茶。

**第 6 關：銀行與利息——錢放對地方更安全**
- **概念：** 銀行是幫大家保管錢的地方；把錢存進去，銀行會付「一點點謝禮」當作保管的小好處，不是變有錢的方法。跟銀行借錢要多還一些，所以借錢是要負責任、要還的事。
- **學習目標：** 知道銀行的基本功能（保管、存款有小回饋、借款要還更多）；用「存 10 個多給 1 個」這種數東西的方式感受，不講百分比；理解錢放銀行主要是安全，東西的價格以後也可能變貴（購買力的簡單概念），所以存錢的重點是為目標而存。
- **範例：** 小安把金幣存進去，過一個章節領到一點點小回饋；另一則故事：借 3 個要還 4 個，所以借之前先問「我還得起嗎？非借不可嗎？」。避免「錢會自己長大、越滾越大」的暗示。
- **遊戲形式：** 「小小銀行家」存摺模擬——存進金幣後**即時**冒出小金幣「多一點點」的動畫（不必等待一個週期）。借錢做成**可選支線**、非必修，用數東西方式呈現，還清後頒『負責任』徽章，凸顯責任而非鼓勵欠債。

**第 7 關：價格的祕密——想買的人多、東西少就會貴**
- **概念：** 越多人想買、貨越少，價格通常越高；反過來則越便宜。（供需以白話呈現，術語作附帶。）
- **學習目標：** 用生活例子解釋東西為什麼變貴或變便宜；理解想買的人數與貨量如何影響價格；連結到自己攤子怎麼訂價。
- **範例：** 夏天大家搶冰紅茶、只有一攤，賣 25 元也有人買；冬天沒人喝，降到 15 元還送餅乾。
- **遊戲形式：** 「訂價滑桿」遊戲——**先明示**今天的天氣與想買的客人數，孩子拉價格滑桿，即時算出賣掉幾杯、賺多少金幣（無倒數、無限時）。找到剛好的「甜蜜價格」得高分與經驗值，直接餵給旗艦遊戲的營運。

**第 8 關：小小創業家——開一間店**
- **概念：** 創業就是發現別人的需要、提供並賺取利潤。利潤＝收入減成本；做生意會有賣不掉的風險，虧損是正常的學習過程，誠實對客人好生意才做得久。
- **學習目標：** 算簡單利潤（收入減成本）；理解成本包含材料和時間；體會賣不掉的風險，並知道虧一次不是失敗、是學到一課。
- **範例：** 小豪做書籤，一張成本 3 元、賣 10 元、賺 7 元；某次多做 20 張只賣掉 12 張，剩下的成本虧了——所以下次先想清楚做多少。禮貌與品質會帶來回頭客。
- **遊戲形式：** 旗艦遊戲的核心經營迴圈：進貨→訂價→服務顧客（供需上場）→結算利潤→三罐分配。誠實標示份量、不欺騙客人會累積『好口碑』星級，帶來更多回頭客與經驗值加成。**虧本被設計成低風險學習事件**——角色鼓勵「沒關係，明天再試」、給「學到一課」的改進提示、附『再挑戰』按鈕，不歸零任何進度、不與獎勵掛鉤、無懲罰音效。

**第 9 關：聰明消費者——看穿廣告、比價、不衝動**
- **概念：** 廣告的目的是讓你想買，不代表你需要；聰明的消費者會比價、想一想再決定，不被「限時」「大家都有」牽著走。
- **學習目標：** 指出廣告常用的說服手法；學會買前「停一下、比一比、問需要嗎」；理解「限時／限量」常是催你快花錢的話術。
- **範例：** 卡通假廣告喊「最後一天！錯過超可惜！」，小婷深呼吸問三個問題後發現家裡已有一大盒貼紙，把錢存起來；比價：同款水壺 A 店 120 元、B 店買一送一實際 65 元。
- **遊戲形式：** 「廣告偵探」找碴遊戲——點出假廣告裡的催買話術（限時、跟風、誇大）。**「限時」等急迫手法只作為此關的反面教材，絕不用在任何真實獎勵迴圈。**「買前三問」做成過關前必按的暫停按鈕，養成不衝動的習慣。

**第 10 關：分享、幫助與公平的社會**
- **概念：** 市場社會讓人靠努力和好點子換到報酬（有動力、有選擇），但每個人起點不一樣、有人比較辛苦（要注意公平）。除了自己過得好，也可以分享與幫助別人。以溫柔、正向、「一起幫忙」的角度呈現，不強調「有人很慘」。
- **學習目標：** 用中性、輕鬆的方式感受市場的好處與要留意的地方；體會同理心與公平；養成願意分享的心。
- **範例：** 麵包做得好的阿明客人多、收入好（努力有回報）；腳受傷的阿婆工作不便，村民輪流幫忙、阿明每賣一些就捐一個到食物銀行。以互動故事選擇呈現，不用沉重的討論卡。
- **遊戲形式：** 旗艦遊戲的『分享罐』與社區關卡——孩子可把一部分利潤投進分享罐去「幫助」動物收容所或食物銀行。**分享完全自願、不給經驗值也不給徽章、不影響分數或解鎖**；回饋純為情感式：收容所變漂亮、動物變多、村民向你揮手、小動物開心的動畫與一句謝謝，把「善良」與「得分」徹底脫鉤。

### 旗艦模擬遊戲：「我的小攤子」經營模擬

孩子用共用的學習金幣向遊戲裡的批發商進貨（檸檬、糖、紙杯等），自己決定賣什麼、訂多少價格，再服務一位位卡通顧客。核心經營迴圈：**進貨（花成本）→ 訂價 → 服務顧客（供需上場）→ 結算利潤 → 三罐分配（存／花／分享）**。

依審查修正後的關鍵設計：
- **隨機事件事前明示、可預測：** 天氣、節慶、隔壁競爭等會在**結算前就明白顯示**（例如「明天下雨，冰飲需求會低」），讓結果主要由孩子可解釋的決策決定，避免把運氣包裝成技巧。
- **結算把「決定」與「運氣」分開：** 打烊結算時明確區分「你的決定帶來的部分」與「天氣運氣的部分」，並明說運氣不可控——防止控制錯覺與把運氣當實力的歸因。
- **章節式而非每日：** 以關卡／章節推進取代「每天打烊、每日營運」的每日時間軸，無每日登入獎勵、無會過期的任務。
- **累積型進度、無斷連勝：** 移除所有會歸零的跨日連勝與「連續不虧本」獎勵；改用只增不減的成就與「這章學到的概念」無壓力回顧。虧本＝溫柔的學習事件，附『再挑戰』按鈕。
- **達標解鎖：** 存到目標（如二手腳踏車）解鎖新商品與『小小店長』徽章。
- **金錢安全：** 全程使用學習金幣＝經驗值，畫面標示「這是學習點數，不是真的錢」，無抽卡、轉盤、下注、戰利品箱或真錢購買。

### 健康理財把關結論

**通過（含修正）。** 本科只教健康、能賦能孩子的觀念：靠工作與創造價值賺錢、先存再花、分辨需要與想要、編預算、取捨、銀行與負責任的借還、供需、誠實做小生意、當聰明又善良的消費者、分享與公平；完全沒有賭博、抽卡／轉蛋、下注、投機、快速致富或鼓勵欠債的內容，借錢明確定位為「要負責任、要還」。資本主義以中性、兩面並陳、且對 9–10 歲溫柔的方式呈現。

兩份審查提出的兒童安全與心理隱憂已全數納入設計並修正：**移除遍布全科的連勝／損失趨避機制、移除限時與急迫加倍（「限時」僅留作第 9 關反面教材）、把旗艦遊戲的隨機事件改為事前明示並在結算區分決定與運氣、分享徹底脫離獎勵僅給情感回饋、重寫第 6 關利息去除「錢會自己長大」暗示、把虧本改為不懲罰的正向學習事件、以「沒有錢會怎樣」的思想實驗取代不精確的以物易物史實、以章節式推進取代每日黏著迴圈。** 學習金幣自始至終與真實金錢分開，機制不含任何類賭博或戰利品箱設計。存錢與需要 vs 想要在多個單元反覆強化。

### 待修正項

以下為需在製作階段落實或持續驗證的項目：

1. **文字量與媒體形式：** 目前各關 sampleContent 仍偏長，須在實作時全面轉為配音＋動畫＋互動，文字壓到幾句話；需產出動畫腳本與配音稿，並做低齡可讀性測試。
2. **術語白話化驗收：** 機會成本／供給需求／利息的白話版與動畫演出需經真實 9–10 歲孩子測試，確認「用眼睛看得懂」而非背名詞。
3. **利息與購買力的分寸：** 第 6 關須確保「保管的小好處」與「東西以後可能變貴」兩個訊息不互相混淆、不製造焦慮，文案需再打磨並做兒童理解測試。
4. **借錢支線的情緒安全：** 借錢即使做成可選支線，仍需驗證不會讓敏感孩子對「欠債」產生擔心；用數東西（借 3 還 4）而非百分比。
5. **第 10 關公平與貧富差距的語氣：** 需確保呈現輕鬆溫馨、聚焦「一起幫忙」，避免「有人很慘」造成沉重感；互動故事選擇需經敏感度審閱。
6. **分享的動機純度：** 需在實測中確認分享脫離獎勵後，孩子仍願意分享（靠社區成長的情感回饋驅動），並持續監看是否出現「那我幹嘛分享」的落差。
7. **隨機事件透明度的落地：** 需驗證「事前明示天氣／競爭」與「結算分開決定與運氣」在實際 UI 上真的讓孩子理解運氣不可控，而非流於文字。
8. **黏著度與螢幕時間監測：** 改為章節式後，仍需追蹤是否出現非預期的黏著或回訪壓力訊號，必要時再調整節奏與獎勵。