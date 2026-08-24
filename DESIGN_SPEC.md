<!-- 統一版面設計規格 v1 — 由 66 頁實碼分析綜合(workflow we1puqwm7)；audit 標準 + 新教材範本 -->

# 公館國小遊戲化電子書 — 統一版面設計規格（Unified Layout Spec v1）

適用範圍：全 66 頁 HTML。本規格以現有共用資產為唯一事實來源：`assets/app.css`（token + 共用元件 `.shell`/`.app-bar`/`.u-*`/`.q-*`/`.fc-*`/`.stat-tile`/`.cn-nextup`）、`concept.css`（`.cn-*` 教學引擎樣式）、`concept_engine.js`（教→練引擎）、`game_core.js` + `game_core.css`（主題切換 + HUD）。**任何新頁只要照本規格組裝，即應與全書原生一致。**

設計鐵律（貫穿全文）：
- 只用 token，不散寫 px / hex：寬度走 `--content-max`；間距 `--s1…--s6`；圓角 `--r-sm/md/lg`（14/20/24）；字級 `--fs-h1/h2/body/small`；陰影 `--shadow-sm/lg`；顏色走 `--ink`/`--ink-soft`/`--card`/`--card-border` 與科目色 `-ink`/`-btn`/`-tint` 變體。
- 每頁只設一次「強調色三件組」，其餘自動配色 + 亮/暗雙主題：
  - 走 `.u-*`/`.q-*`/`.fc-*` 元件的頁 → `--accent` / `--accent-tint` / `--accent-ink`
  - 走 `.cn-*`（concept.css）的頁 → `--su` / `--su-tint`（`--su-d` 為可選深色標題色）
- 對錯不只靠顏色：一律「彩色左邊條 callout + ✅/❌ 標記 + 文字」，並套 `.is-correct`/`.is-wrong` 動效（`prefers-reduced-motion` 已在 app.css 尊重）。

---

## 1. 共用最外層框架 (Common Outer Framework)

**每一頁 100% 相同**，不得增刪、不得改名、不得換順序。

### 1.1 `<head>` 樣式與腳本載入順序（強制）

```html
<link rel="stylesheet" href="assets/app.css">   <!-- 1) token + 共用元件層（永遠第一） -->
<link rel="stylesheet" href="game_core.css">     <!-- 2) HUD / toast / 主題 chrome -->
<link rel="stylesheet" href="concept.css">       <!-- 3) 只有走 .cn-* 引擎的頁才載入 -->
<script src="game_core.js"></script>             <!-- 4) 於 <head> 同步載入：首繪前套 data-theme、消閃爍 -->
<!-- 5) 頁面專屬 accent <style>：只設三件組（+ 選用 dark 覆寫），禁止在此重寫版面 -->
```

- `concept_engine.js` 的頁：於 `</body>` 前載入 `<script src="concept_engine.js"></script>`（在 `window.CONCEPT` 定義之後）。
- 不得引入任何外部網路資產（字體 fallback 系統字型）。

### 1.2 app-bar（全站唯一頂部 chrome，`<body>` 第一個子元素）

```html
<header class="app-bar">
  <a class="app-bar__home" href="index.html">
    <span class="app-bar__home-icon" aria-hidden="true">🏠</span>
    <span class="app-bar__home-label">學習基地</span>
  </a>
  <span class="app-bar__title">頁面標題 <相關 emoji></span>
  <button class="app-bar__theme" data-theme-toggle aria-label="切換深淺色">
    <span class="app-bar__theme-icon" aria-hidden="true">🌙</span>
  </button>
</header>
```

- 只有 `index.html` 例外：家控件改成非連結品牌 `<span class="app-bar__home app-bar__brand" aria-current="page">`，且**不放** `.app-bar__title`。
- app-bar 為 `position:sticky; top:0; z-index:90`，高度 `--app-bar-h(56px)` + iOS 安全區；水平內距用 `max(--s3, (100%-content-max)/2)` 讓其內容與下方 `.shell` 對齊。
- 主題鈕**不寫任何頁面 JS**：`game_core.js` 自動接線所有 `[data-theme-toggle]`、同步 ☀️/🌙 與 `aria-pressed`。窄螢幕（≤400px）`.app-bar__title` 自動隱藏，兩側控制優先保留。

### 1.3 內容容器 `.shell` 與寬度行為

```html
<main class="shell"> … 所有頁面內容 … </main>
```

`--content-max` 斷點（app.css，唯一寬度真相）：
- 手機（預設）：`720px`
- ≥1024px（iPad 儀表板）：`1200px`
- ≥1280px（桌機/大螢幕）：`min(95vw, 1800px)`（近滿版，兩側留邊）

`.shell` = `width:100%; max-width:var(--content-max); margin-inline:auto; padding:var(--s4)`，底部含安全區。選單卡片 grid（`auto-fit`）在寬螢幕自動加欄填滿；閱讀/答題欄由 `.play-column` + em 上限維持窄欄護眼（見 §3f）。

### 1.4 畫面切換（screen-switching）標準模型

兩個 `<section>`：`#screen-menu`（初始 `.active`）與 `#screen-play`，靠切換 `.active` 顯示。三種合法實作，**擇一**：
1. **走 `.cn-*`**：class `cn-screen cn-wrap`，由 `concept_engine.js` 的 `show()` 切換。
2. **走 `.u-*`**：class `u-screen`（app.css 已定義 `.u-screen{display:none}/.u-screen.active{display:block}` + `app-fade`）。
3. **自帶 IIFE**：可用自訂 `xx-screen` class，但**顯示/隱藏語意與淡入必須等同** `.u-screen`（`display:none`↔`block` + `app-fade`，尊重 reduce-motion），且 `window.scrollTo(0,0)`。

進入 play 一律附返回控制 `<button class="btn btn-icon" id="btn-back">←</button>`（放在該頁 topbar 內）。

### 1.5 主題機制

- 亮色為預設品牌；**不跟隨** `prefers-color-scheme`。
- 深色僅當 `<html data-theme="dark">` 時套用；由 game_core 寫入/讀取 localStorage、首繪前套用。
- 所有色彩皆有亮/暗兩套 token（app.css `:root` 與 `:root[data-theme="dark"]`），頁面**只需**覆寫自己的 accent 三件組，其餘自動翻主題。

### 1.6 遊戲 HUD（game_core 注入）— 由 `<body>` 屬性決定

| `<body>` 屬性 | 行為 |
|---|---|
| `data-game-hud="off"` | 不注入 HUD（純本地學習頁；仍可 `Game.pingActive()` 續 streak） |
| `data-game-hud="native"` | 頁面自建 HUD，不注入浮動 HUD |
| 無屬性（預設 `float`） | 注入 HUD；有 app-bar 時自動加 `.game-hud--docked` 停靠 app-bar 正下方（`top=--app-bar-h`），不重疊 |
| `data-game-wired="<subject>"` | 該頁 `Game.recordAnswer(subject,…)` 計真 XP（math/english/chinese/social/science/finance/mult） |
| `data-game-maturity="advanced"` | 國高中內容：保留計分，慶祝文案改中性版 |

---

## 2. 頁面類型分類 (Page-Type Taxonomy)

依「版面契約」分 9 型（括號註記所用 class family）。

| 型別 | 頁面 |
|---|---|
| **A. 靜態首頁 / Hub** | `index` |
| **B. 觀念教學頁 concept-lesson**（`.cn-*` + concept_engine.js） | `biology_concepts`, `body_safety`, `chemistry_concepts`, `chinese_concepts`, `digital_citizenship`, `earth_science_concepts`, `economics_concepts`, `english_concepts`, `emotion_skills`, `english_reading`, `everyday_science_concepts`, `finance_mindset_concepts`, `geometry_concepts`, `math_concepts`, `math2_concepts`, `linear_algebra_concepts`, `media_ai_literacy`, `number_theory_concepts`, `physics_concepts`, `self_protection`, `social_concepts`, `thinking_traps_concepts` |
| **C. 科目 / 挑戰測驗 subject-quiz**（menu grid + q/opt 測驗） | `biology`(bio-), `chemistry`(chem-), `computer_science`(ma-), `earth_science`(ma-), `economics_advanced`(ma- + HUD), `english_sense`(ma- + badge), `geometry`(u-/q- + HUD), `math_drill`(md-), `safety`(sf- 分區), `thinking_traps_practice`(tp-), `emotion_practice`(pr- 情境選擇) |
| **D. 思考引擎 thinking-engine**（ma- + 故事框/漸進提示/看穿） | `chinese_advanced`, `detective`, `logic_reasoning`, `math_advanced`(+HUD), `math_modeling`, `social_advanced`(+HUD), `innovators`, `learn_how_to_learn` |
| **E. 數字練習實驗室 numpad-lab**（cn 選單 + 數字輸入生成題） | `area_lab`, `fraction_lab`, `math_solving`, `mental_math`, `percent_lab`, `time_lab`, `unit_lab` |
| **F. RPG 冒險 RPG-adventure**（關卡/單元 + 多樣 mini-game + 真 XP/HUD） | `finance`(fi-), `physics`(ph-), `social_studies`(su-), `math`(#app native), `multiply`(container native) |
| **G. 閃卡 flashcard**（`.fc-*` + SRS） | `cefr_flashcard`, `coca_flashcard`, `toeic_gept_flashcard`, `vocabulary_app`, `practice`, `english_idioms`(id-), `idiom_stories`(id- 注音) |
| **H. 長捲軸教學 long-scroll-lesson**（sticky top-nav + 就地遊戲） | `number_theory`, `number_theory_advanced` |
| **I. 客製 SPA bespoke-SPA**（多於兩畫面/自成一格） | `composition`(u-/cp-), `english_advanced`(ea-), `chinese`(legacy 5-screen) |

型 C/D/F 大量共用 app.css 的 grouped selector（`.ma-options`/`.su-options`/`.ph-options`/`.fi-options`/`.q-options`… 全部吃同一組選項樣式與 ≥1024 兩欄規則），因此**外觀本已統一**；差異僅在 class 前綴與內容。目標即：新頁優先直接用 `.u-*`/`.q-*`，避免再造前綴。

---

## 3. 每一類型的版面規格 (Per-Type Layout Spec)

> 通則（適用所有型別的 play 畫面）：
> **(f) play 寬度規則「進入後滿版」**：play 卡片/舞台填滿 `--content-max`（`.play-column{width:100%;margin-inline:auto}`），**不縮成中央窄島**；但內部長文字/重點列以 em 收斂護眼：`.play-column .ma-keyfacts{max-width:min(100%,56em)}`、`.play-column .ma-question{max-width:min(100%,40em)}`、`.cn-text{max-width:min(100%,40em)}`、`.cn-block{max-width:min(100%,42em)}`、`.q-prompt{max-width:32ch}`。
> **選項寬螢幕規則（≥1024，app.css 已定義，勿覆寫）**：短選項容器（`.q-options/.cn-options/.ma-options/.su-options/.ph-options/.fi-options/.chem-options/.bio-options/.ea-options/.quiz-options/.options/.choices`）→ `grid 1fr 1fr; max-width:900px; margin-inline:auto`；整條長選項（`.id-opt/.md-opt/.sf-opt/.tp-opt`）→ `max-width:720px` 置中；主要行動列（`.*-actions`）→ `max-width:540px` 置中。
> **(g) JS render 契約**：以下列出的 class/id 是 JS 綁定點——**只可換膚（restyle），不可改名（rename）**。

### 型 A — 靜態首頁 / Hub（`index`）

- **容器例外**：用 `<div class="hub">` CSS grid（手機 1 欄；≥1024 `280px 1fr` sticky 左 rail），非 `.shell`。**單一長捲軸**，靠錨點 + IntersectionObserver scroll-spy，無 screen 切換。`data-game-hud="native"`（自帶 profile-card，不注入浮動 HUD）。
- **選單卡**：橫向列 `a.card.row-card` = 左側 tinted emoji tile `.icon`（48px、科目 `t-xxx` tint）→ `.info`(h3 標題 + p 副標 + inline chips) → 右側 `.arrow →`。另有大漸層 CTA `a.card.hero-start`。分區用 `.section-box` + `.path-head`；徽章牆 `.badge-grid`/`.badge-item`。
- **仍須共用**：app-bar（brand 變體）、token、主題鈕、`.card`/`.chip`/`.badge`/`.stat-tile`/`.bottom-nav`（app.css）。row-card grid 用 `.grid-auto`（強制單欄 1fr）。

### 型 B — 觀念教學頁 concept-lesson（canonical `.cn-*`）

**參考實作**：`media_ai_literacy` / `economics_concepts`（最純）。頁面本體極薄：只宣告 `window.CONCEPT` + accent。

**(a) 畫面**：`#screen-menu` / `#screen-play`（皆 `cn-screen cn-wrap`）。

**(b) 選單卡（由 concept_engine 產生，勿改名）**：
```html
<button class="cn-lesson" aria-label="觀念：…">
  <div class="cn-lesson-top">
    <span class="cn-lesson-emoji" style="background:{color}22;color:{color}">🔤</span>
    <div><div class="cn-lesson-name">標題</div><div class="cn-lesson-sub">副標</div></div>
  </div>
  <div class="cn-lesson-foot todo">▶️ 開始學</div>   <!-- done → ✅ 學過了（隨時可複習） -->
</button>
```
CSS 契約（concept.css）：欄式、左對齊；`.cn-lessons` = `grid auto-fit minmax(260px,1fr) gap:--s4`；emoji tile 52×52 `radius:14px`；`.cn-lesson` 2px 邊 + `--r-lg` + `--shadow-sm`，hover 邊轉 `--su`、active `scale(.98)`；foot.done 用 `--c-correct-ink`、todo 用 `--ink-soft`。**無 eyebrow、無星、無進度點。**

**(d) 教學卡 teach**：`.cn-card`（置中、`max-width:--content-max`）內 `.cn-teach-emoji`(48px 置中) → `h2.cn-h`(主題色置中) → 選用 `.cn-svg`(≤340px) → `.cn-block`(左彩條 callout：`border-left:4px solid --su` + `--su-tint` 底) 內 `.cn-block-label` + `p.cn-text`；底 `.cn-actions > .btn.btn-primary.btn-block#next 繼續 ➡️`。

**(c) 測驗卡 quiz**：`.cn-card` 內 `span.cn-kicker.quiz` + `h2.cn-h` + 選用 `.cn-svg`/`.cn-eq` + `.cn-options`（grid）內多個 `.cn-opt`（56px 高、2px 邊、左對齊、字重 800）→ 作答後加 `.correct`/`.wrong` + `✅/❌`，`.cn-reveal#rev.show` 顯示 why（左對齊）、`.cn-actions#after` 顯示續鈕。

**(e) 結算卡 result**：`.cn-card` 置中 🎉 + `h2.cn-h`「你學會「X」了！」+ `.cn-text`；`.cn-actions` = `回到觀念選單` + 選用 `practiceHref` 的 `.btn.btn-primary 去多練幾題 ➡️`。

**進度**：`.cn-progress#prog`（段狀膠囊 `i.done/.cur`）。

**(g) render 契約（concept_engine.js 硬性 DOM）**：必備 id `#screen-menu #screen-play #lesson-list #stage #prog #play-title #btn-back #hello`；資料 `window.CONCEPT = {progKey, practiceHref?, lessons:[{id,name,emoji,color,sub,steps:[{type:'teach',kicker,title,svg,text}|{type:'quiz',kicker,title,svg?,eq?,options,answer,why,whyWrong?}]}]}`。`data-game-hud="off"`，純本地 `progKey`，不計 XP。SVG 圖由頁面自備 helper 產生為 HTML 字串塞入 `step.svg`。

### 型 C — 科目 / 挑戰測驗 subject-quiz

**優先用 `.u-*`（選單）+ `.q-*`（play）**；既有 bio-/chem-/ma-/sf-/tp-/pr- 前綴皆已透過 app.css grouped selector 得到相同外觀，維護時逐步向 `.u-*`/`.q-*` 收斂。

**(a) 畫面**：menu / play（+ `safety` 另有 review 畫面；`emotion_practice` play 無進度點）。

**(b) 選單卡（canonical `.u-card`，app.css）**：
```html
<button class="card u-card">   <!-- 或直接 .u-card；主打卡加 .is-flagship -->
  <div class="u-card__top">
    <span class="u-card__icon">🧪</span>
    <div>
      <div class="u-card__num">等級 3</div>        <!-- eyebrow，選用 -->
      <div class="u-card__name">標題</div>
    </div>
  </div>
  <div class="u-card__desc">副標/概念一句</div>       <!-- 選用 -->
  <div class="u-card__foot">
    <span class="u-card__status todo">▶️ 開始挑戰（共 N 題）</span> <!-- done → ✅ 已完成 -->
    <span class="u-card__dots"><i></i><i class="on"></i>…</span>    <!-- 每題一點，選用 -->
  </div>
</button>
```
CSS：`u-grid` = `auto-fit minmax(260px,1fr) gap:--s4`；icon tile 56×56 `--r-sm` `--accent-tint`；eyebrow 用 `--accent-ink`；status.done 用 `--c-correct-ink`；dots `on` 染 `--accent`；flagship = accent 漸層邊。**分區型（safety）**：外層 `.sf-area`(標題 + N/總) 包多個 `.sf-grid(minmax 240px)`；卡為左對齊橫向列（emoji tile + title + 右側 state chip），此為合法子變體。

**(d) teach/簡介**：`.q-stage`（或 ma-brief）置中 `.q-visual`(大 emoji) + `h2` + `.ma-keyfacts`(左彩條重點列，`border-left:4px solid --su`) + `.q-toolrow`(看更多/讀給我聽)；`.q-actions > .btn.btn-primary 開始挑戰`。

**(c) quiz**：`.q-stage` 置中 `.q-visual` + `.q-prompt`(≤32ch 置中、字重 800) + 選用 `.q-sub` + `.q-progress#step-dots` + `.q-options`（含 `.q-opt`，56px、左對齊；`.q-opt__mark` 靠右放 ✅/❌）+ `.q-feedback.show.is-ok/.is-no`（左彩條回饋）。play 包在 `.play-column`。

**(e) result**：`.result-card`（app.css）：`.result-card__emoji` + `.result-card__stars`(⭐) + `.result-card__title` + `.result-card__sub`；行動列 `.q-actions`（回選單/下一關/看徽章）。

**徽章冊（選用，型 C/D/F 通用）**：固定右下 FAB + `[hidden]` 對話框；FAB 用 token 圓角/陰影，overlay 走 `.sheet` 風或自定，但**必須** `[hidden]` 真隱藏（app.css `[hidden]{display:none!important}`）。

**(g) render 契約**：綁定 `#level-list`/`#unit-list`、`#stage`、`#step-dots`、`#play-title`、`#btn-back`。HUD 視需求（`geometry`/`economics_advanced` 計 XP；其餘 `data-game-hud="off"`）。

### 型 D — 思考引擎 thinking-engine（`.ma-*` + `.mm-*`）

在型 C 的 ma-menu/ma-quiz 之上，加「故事框 + 漸進提示 + 心法 recap + 回合制/續玩」。

**(b) 選單卡** `.ma-level`：`.ma-level-top`(emoji tile 56×56 + `.ma-level-num` eyebrow「關卡/等級 N」+ `.ma-level-name`) + `.ma-level-concepts`(概念列，`・` 連接) + 選用 `.ma-level-pips`(= `.u-card__dots`，每題進度點) + `.ma-level-foot`(`.ma-level-status` + `.ma-level-stars ★`)。**最豐富卡**：eyebrow + 概念 + (pips) + 星。

**(c) play**：`.play-column > #stage` 內 `.ma-brief`(看穿心法 keyfacts，僅回合首) → 每題 `.mm-story`(故事框 + `.mm-story-label`) + 選用 `.ma-recap`(可摺心法) + `.mm-hint-area`(`.mm-hint-btn` 虛線鈕 + 漸進 `.mm-hint` 列) + `.ma-question` + `.ma-options>.ma-opt` + `.ma-reveal`(多列 `.mm-rev-*`：背後模型/怎麼看穿/怎麼解，app.css 定義 `.ma-reveal` 用 `--su-tint`)。`.ma-steps#step-dots` 追蹤回合。

**看穿 / 獨立想通指標**：`.ma-overview` 可放第 3 個 `.stat-tile`（看穿/沒看提示）；無提示答對 = 加成。

**(e) result**：`.ma-done`（emoji/stars/title/sub/prog）→ 繼續下一回合 / 完成。

**HUD**：`math_advanced`/`social_advanced` 計真 XP（`data-game-wired`）；`detective`/`logic_reasoning`/`math_modeling` 等 `data-game-hud="off"` 純本地 + streak。

**overview 對齊**：`.ma-overview` 用 `.u-overview` 樣式（flex + `.stat-tile flex:1 min-width:96px`）。

### 型 E — 數字練習實驗室 numpad-lab

**選單完全共用 concept 外觀**：`#xx-menu.cn-lessons` 內 `.cn-lesson` 卡（emoji tile 用 `--su-tint`）+ `.cn-nextup` + note。這確保 lab 選單與型 B 一致。

**(d) teach primer**：`.xx-card`（`max-width:--content-max` 置中）內 `.cn-teach-emoji` + `.cn-h` + `.cn-block`/`.xx-teach` + `.xx-actions > .btn.btn-primary 開始練習`。

**(c) 練習題（無限生成、自適應難度 Lv.1–5，連對 5 升/連錯 3 降）**：`.xx-card` 內 `.xx-scorebar`(含 `.xx-lv` 等級膠囊) + `.xx-tag`(類別) + `.xx-problem`(大題幹；分數用直接渲染) + `.xx-answer`（**數字 `<input>`**：單格 `~150px` + `.xx-unit`，或分數雙格 numerator/denominator，或多步解 numpad `.xx-pad` 3 欄）+ 送出鈕 + `.xx-reveal.ok/.no`（左彩條逐步解說）+ 下一題。

**(f) 寬度**：`.xx-card` 一律 `max-width:var(--content-max); margin-inline:auto`。**例外註記**：`mental_math` 的 `mm-wrap` 用 `width:100%`（寬度控制下放到 `mm-card`）——**新頁不採此法**，一律用 `xx-wrap{max-width:var(--content-max)}`。

**(g) render 契約**：menu id `#screen-menu #screen-play #stage #btn-back #play-title`；自帶 IIFE 生成器（correct-by-construction，gcd/整數比）；`data-game-hud="off"`，本地 `xxx_lab_v1`。

### 型 F — RPG 冒險 RPG-adventure

在型 C 之上：**真 XP/HUD**（`data-game-wired` 或 `native`）、關卡/單元選擇、多樣 mini-game、星星 + 徽章 + Leitner/SRS。

- **選單卡**：`.fi-unit`/`.ph-level`/`.su-unit`（皆等同 `.u-card` 家族）：emoji tile + `.xx-num` eyebrow(第 N 關/單元) + name + foot(status + 進度點 dots)；主打卡 `.is-flagship` 漸層邊。**優先改用 `.u-card` + `.u-card__dots`。**
- **play**：`.play-column > #stage` 內每步用共用 `.q-stage`/`.q-opt`/`.q-feedback` 語彙 + 頁面專屬互動（`geo-figure` SVG、`fi` 預算/定價、numpad…）；`.q-progress#step-dots`。
- **result**：`.result-card`（或 `.fi-done`/`.ph-done`，同構）。
- **容器例外**（僅 legacy `math`/`multiply`）：用 `#app`/`.container` 且多於兩畫面、含 `.bottom-nav`、numpad、native in-page HUD。**新頁不得再造此形態**；若重寫應收斂為 `.shell` + 兩畫面 + 共用卡類。

### 型 G — 閃卡 flashcard（`.fc-*`，app.css 第 4 層）

- **無 menu/play 兩段**：單捲軸控制面板 + `#learningArea` 就地重繪；子視圖用 `.hidden`/`[hidden]` 切換（圖鑑 `.fc-dex`、focus overlay）。
- **選單 = pill 列**：等級/模式用 `.fc-source`(flex) 或 `.fc-source--grid`(`auto-fit minmax(200px,1fr)`) 的 `.fc-source__btn`；選中態 `.active`/`[aria-pressed=true]` = 實心英文綠 `--c-english-btn` + `--on-accent`。**非** emoji-tile 卡。
- **翻卡** `.fc-card`（≤460px 置中，audio-first）：`.fc-card__inner.flipped` 3D 翻面；正面 `.fc-card__emoji` + `.fc-audio--lg` 🔊 + `.fc-card__word` + `.fc-card__tap`；背面 `.fc-card__cn`/`__hint`/`__sent`。
- **三級自評** `.fc-rate`（again/good/easy，對齊 SM-2）；**發音** `.fc-audio`(`--lg`/`--sm`)；**揭示** `.fc-reveal.is-ok/.is-no`(左彩條) + `.fc-reveal__next`；**拼字** `.fc-spell`(`__slots`/`__bank`/`__tile`/`__slot`，觸控字母磚 + 鍵盤切換)；**圖鑑** `.fc-dex`(`__nav`/`__grid`/`__card`)。
- **HUD**：多為預設 float / native（計 english XP）；載 `assets/srs_engine.js`。
- **子變體 id-*（`english_idioms`/`idiom_stories`）**：選單用 `.cn-lessons`+`.cn-lesson`（或注音密集 tile grid），play 用 bespoke `.id-card`（≤760px）翻卡→小測驗。合法，但**閃卡新頁優先用 `.fc-*`**。**唯一頁**允許 `<ruby>` 注音：`idiom_stories`。
- **例外 iPad**：`.dashboard`/`.vocab-layout` 在 ≥1024 可收斂為單欄 `max-width:720/760px`（app.css `.dashboard` grid `1fr 320px` + sticky aside）。

### 型 H — 長捲軸教學 long-scroll-lesson（`number_theory[_advanced]`）

- **容器例外**：`.page-container`(`max-width:--content-max`)，非 `.shell`；**無 screen 切換**，全部一次渲染。
- 於 app-bar 下再加一層 sticky `<nav class="top-nav">` pill `.nav-btn` 跳錨（scroll-spy 高亮）；**注入 HUD 且計 XP**（`data-game-wired="math"`）。
- 內容：`.section`(`.section-title` + emoji + 難度 chip) + `.u-grid` 內 `.visual-box` 教學卡 + 就地 `.play-column > .game-area`(題目 + `.feedback.correct/.wrong` + 繼續 + `.score-card`)。
- 頁面專屬 FAB overlay（GemMine/StampBook）須 `[hidden]` 真隱藏。
- **仍須共用**：app-bar、token、主題、`.play-column`、`.cn-nextup`、`.stat-tile`、回饋/卡片語言。

### 型 I — 客製 SPA bespoke-SPA

- `composition`：two-screen 但自帶 IIFE；選單卡建於 `.card` + `.u-card`（唯一在 `.card` 上疊 `u-card` 的頁，合法示範），多步 play（fact/fill/choose/order/collect/freewrite）。**貼近 §3 契約**。
- `english_advanced`：ea- 平行系統 + HUD + 徽章；**未載 concept.css 卻用 `.cn-nextup`**（樣式缺失）→ **待修**：或載 concept.css，或改用 app.css 版 `.cn-nextup`（已在 app.css，故其實可直接用；確保 `.cn-nextup` 在 app.css，見 §5）。
- `chinese`：legacy 5-screen `#app` + native `.stats-bar` HUD + 自造 `.category-card`/`.level-card`/`.ch-qcard`/`.result-*`。**技術債**：新頁不得複製；重寫應收斂為 `.shell` + 兩畫面 + `.u-card`/`.q-*`/`.result-card`。

---

## 4. 刻意例外 (Intentional Exceptions)

以下差異為**合法**，但**必須**仍共用 §1 外層框架（app-bar 三件、token、主題機制、`[hidden]` 防護、`.cn-nextup` 銜接、回饋左彩條語言、字體/顏色 token）。

| 範式 | 可以不同的地方 | 仍必須共用 |
|---|---|---|
| **閃卡（型 G）** | 無 menu/play 兩段；翻卡置中 ≤460px；pill 選單非 emoji-tile 卡；`.hidden` 切換；SRS/圖鑑；native/float HUD | app-bar、token、主題、`.fc-*` 元件、`.fc-reveal` 左彩條回饋、`.play-column` 收斂閱讀欄 |
| **numpad-lab（型 E）** | 全寬 numpad/數字輸入取代 MCQ；自適應難度 scorebar；無限題無 result | app-bar、`.cn-lessons` 選單卡、`.cn-teach-*` 教學卡、`.xx-card` 置中 `--content-max`、reveal 左彩條、`.cn-nextup` |
| **RPG（型 F）** | 停靠/native HUD + 真 XP；關卡/單元 + 多樣 mini-game；星/徽章/SRS；`math`/`multiply` 用 `#app`/`.container` + bottom-nav | app-bar、token、主題、`.u-card` 家族選單卡、`.q-*` 題卡語彙、`.result-card`、`.play-column` |
| **長捲軸（型 H）** | `.page-container` 非 `.shell`；第二層 sticky top-nav；一頁到底無 screen 切換 | app-bar、token、主題、`.play-column`、`.visual-box`/`.feedback`/`.score-card` 卡片語言、`.cn-nextup` |
| **Hub（型 A）** | `.hub` grid + rail + bottom-nav；row-card 橫列；scroll-spy 無 screen；native profile HUD；app-bar brand 變體 | token、主題鈕、`.card`/`.chip`/`.badge`/`.stat-tile`/`.bottom-nav`、`--content-max` 上限 |
| **進階頁 HUD**（型 C/D/F 之進階） | 顯示停靠 HUD + `data-game-maturity="advanced"` 中性文案 | 其餘全部同型別契約 |

**不合法（技術債，須收斂）**：`chinese` legacy 5-screen 雙 HUD、`english_advanced` 用 `.cn-nextup` 卻不載其樣式來源、`mental_math` 的 `mm-wrap{width:100%}` 破壞寬度上限、copy-paste 攣生頁（bio/chem、cs/earth/econ）各自複製 ~250 行 inline CSS（應抽共用）。

---

## 5. 一致性核對清單 (Compliance Checklist)

逐頁逐維度打勾；任一 FAIL 即不合規。

**D1 外層框架**
- [ ] `<head>` 載入序：app.css → game_core.css →（cn 頁才）concept.css；game_core.js 於 `<head>`。
- [ ] `<body>` 第一元素為 `.app-bar`，含 `.app-bar__home`(🏠+學習基地→index.html) + `.app-bar__title`(置中，index 除外) + `.app-bar__theme[data-theme-toggle]`(🌙)。
- [ ] 主題鈕無頁面 JS（靠 game_core 接線）；`<html data-theme>` 為唯一深色開關；不跟隨系統。
- [ ] 內容容器為 `.shell`（型 A/H/legacy 例外者已在 §3/§4 列名）。
- [ ] 兩畫面 `#screen-menu`/`#screen-play` 切 `.active`（型 A/G/H 例外）；play 有 `#btn-back`。
- [ ] HUD 屬性正確：純學習頁 `data-game-hud="off"`；計分頁 `data-game-wired`；自建 HUD `native`。

**D2 選單卡片解剖**
- [ ] emoji tile 尺寸正確（cn 52、u/ma/ph/su 56、optionrow 44）+ tinted 底（`{color}22` 或 `--su-tint`/`--accent-tint`）。
- [ ] 左對齊欄式；標題 `--fs-body` 800、副標 `--fs-small` `--ink-soft`。
- [ ] eyebrow 只在有分級語意時出現（`--num` 用 `-ink`）；進度點用 `.u-card__dots`/`.ma-level-pips`（每題一點、`on` 染 accent）。
- [ ] foot：todo `▶️ …` `--ink-soft`／done `✅ …` `--c-correct-ink`。
- [ ] grid 為 `auto-fit minmax(260px,1fr)`（safety 分區 240px 例外）。
- [ ] 未新造平行前綴（新頁用 `.u-card`/`.cn-lesson`，不再發明 xx-level）。

**D3 測驗版面**
- [ ] 題幹置中、`.q-prompt` ≤32ch、字重 800。
- [ ] 選項容器在 ≥1024 依 app.css 規則自動兩欄 ≤900px 置中（長選項 ≤720、行動列 ≤540）——**頁面未覆寫**這些。
- [ ] 選項鈕 56px 高、2px 邊、左對齊、字重 700–800；作答加 `.correct`/`.wrong` + ✅/❌。
- [ ] 回饋為左彩條 callout（`.q-feedback.is-ok/.is-no` 或 `.cn-reveal`/`.fc-reveal.is-ok/.is-no`），文字 `--ink`，非僅顏色。

**D4 教學畫面**
- [ ] emoji 置中 → `--su`/主題色置中標題 → 左彩條說明框（`border-left:4px solid` + tint 底），順序一致。
- [ ] SVG 圖 `.cn-svg`/`.visual-box` ≤340px 置中；重點列 `.ma-keyfacts li` 左彩條。

**D5 結算畫面**
- [ ] 用 `.result-card`（或同構 `.xx-done`）：emoji + stars + title + sub + 行動列（回選單 / 下一 / 練習）。

**D6 play 寬度**
- [ ] play 卡片/舞台滿版填 `--content-max`（無中央窄島）。
- [ ] 內部長文字以 em 收斂（keyfacts ≤56em、question ≤40em、text ≤40em、block ≤42em）。
- [ ] 無 `width:100%` 破壞上限的 wrap（`mm-wrap` 為待修）。

**D7 callout / 元件語言**
- [ ] 所有說明/回饋/銜接用左彩條 + token；跨頁銜接一律 `.cn-nextup`（前進亮底）/`.cn-nextup--back`（回頭低調），多連結用 `.cn-nextup-group`。
- [ ] 覆蓋層/FAB 對話框以 `[hidden]` 真隱藏（不留可聚焦死連結）。

**D8 字體**
- [ ] 全站 `--font`(Nunito → PingFang TC/JhengHei/Noto Sans TC fallback)；字級只用 `--fs-*`；行距 body 1.6。
- [ ] 標題 800、內文 700、次要 600 + `--ink-soft`。

**D9 顏色 / 主題**
- [ ] 只用 token（`--ink`/`--card`/科目 `-ink`/`-btn`/`-tint`）；無散寫 hex（頁面 accent `<style>` 除外，且只設三件組 `--accent/--accent-tint/--accent-ink` 或 `--su/--su-tint`）。
- [ ] 文字色達 WCAG AA：亮 accent 當文字時用 `-ink` 變體；實心鈕白字用 `-btn` 填色。
- [ ] 亮/暗雙主題皆正常（頁面未硬碼會被 dark 覆寫的顏色）。
- [ ] 對錯/狀態除顏色外另有形狀/圖示/動效（`.is-correct`/`.is-wrong`）。

**D10 觸控 / 無障礙**
- [ ] 互動元素 ≥`--tap-min`(48px)；焦點環 `:focus-visible`(3px `--c-focus`)未被覆蓋層裁切。
- [ ] `prefers-reduced-motion` 尊重（沿用 app.css，未另加不受管動畫）。

**D11 資產 / 效能**
- [ ] 無外部網路依賴；inline `<style>` 僅限 accent 三件組 +（例外型別）必要 bespoke，未重寫已在共用層的版面。
- [ ] concept 頁本體薄（只 `window.CONCEPT` + accent）；lab/quiz 生成器 correct-by-construction。

---

### 附：關鍵共用 class 對照（restyle-not-rename 綁定點）

- 外層：`.app-bar` / `.app-bar__home|__title|__theme` / `.shell` / `.play-column` / `.cn-nextup(-group|--back)` / `.stat-tile` / `.result-card` / `.section-title` / `.btn(.btn-primary|.btn-block|.btn-icon)` / `.chip(-math…)` / `.sheet(-overlay)` / `.bottom-nav`。
- concept：`#screen-menu #screen-play #lesson-list #stage #prog #play-title #btn-back #hello`；`.cn-screen.cn-wrap` / `.cn-hello(.cn-mascot/.cn-htext/.cn-hsub)` / `.cn-lesson(-top/-emoji/-name/-sub/-foot)` / `.cn-optionrow(-emoji/-title/-sub)` / `.cn-progress i.done/.cur` / `.cn-card` / `.cn-teach-emoji` / `.cn-h` / `.cn-block(-label)` / `.cn-text` / `.cn-svg` / `.cn-eq` / `.cn-kicker.quiz` / `.cn-options` / `.cn-opt.correct/.wrong` / `.cn-reveal.show`。
- u/q（型 C/F 首選）：`.u-grid` / `.u-card(__top/__icon/__num/__name/__desc/__foot/__status/__dots)` / `.u-hello` / `.u-overview` / `.q-stage` / `.q-visual` / `.q-prompt` / `.q-sub` / `.q-toolrow` / `.q-progress i.on/.cur` / `.q-options` / `.q-opt(.correct/.wrong)__mark` / `.q-feedback.show.is-ok/.is-no` / `.q-actions`。
- flashcard：`.fc-source(__btn)` / `.fc-card(__inner.flipped/__face/__front/__back/__word/__cn/__hint/__emoji/__tap)` / `.fc-rate(__btn.again/.good/.easy)` / `.fc-audio(--lg/--sm)` / `.fc-reveal.is-ok/.is-no(__next)` / `.fc-dex(__nav/__grid/__card)` / `.fc-spell(__slots/__bank/__tile/__slot)`。

（本規格可據以審計全 66 頁；型別歸屬見 §2，例外白名單見 §4，逐維度判準見 §5。）