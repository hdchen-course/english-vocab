<!-- DICTATION_BUILD_SPEC.md — 聽寫練習系列 BUILD SPEC
     Status: DRAFT v0.2 (2026-10-25). NOT converged. NOT implemented.
     v0.2 + r17/r18 fixes (2026-10-25): per-series sidecars dict_items_{dk,cefr}.json (no clobber);
       slug-collision persistence via per-series src/dict_slug_overrides_{dk,cefr}.json; day5 excluded from sidecar & R12 id-set
       (engine-synthesized); bonus dailyNew/done/3-state-dot defined; audio/_unlock.mp3 = committed static
       asset (R4 exempt, in bundle, audio-gate + R12 allowlist). Clean-streak reset: needs 5 consecutive clean.
     v0.2 = 由 v0.1 + round-1/round-2 對抗稽核「就地重寫」而成:每個決策只在它該在的章節寫一次,
     不再用「§16 supersede」疊層(那造成 stale 原行與懸空引用)。與實作碼衝突時以本檔為準;
     要改規範改這裡,不得在實作碼偷偷放寬。
     SOP(使用者指定,嚴格,不可跳):(1) 極詳細 spec → (2) content_audit 到 5 consecutive clean
       → (3) 紅隊證明規範無法被繞過/丟棄 → (4) 才實作 → (5) 實作走 §10 DONE-GATE。 -->

# 聽寫練習系列 — BUILD SPEC（Dictation Series）v0.2

## 0. 使命與範圍

一個**共用引擎**、兩個**內容系列**,流程統一:**聽音 → canvas 手寫 → 看答案 → 三級自評 → SRS**。主要裝置 **iPad Air 13" (M5)**(Apple Pencil / 手指 / 滑鼠皆可寫);次要:手機/桌機(手寫可改鍵盤 fallback)。

- **系列 A — CEFR 聽寫(A1–C2 六級)**:每級兩軌=**單字聽寫**+**例句聽寫**。字表走開放授權清單,例句本專案自寫。沿用站內現有 `cefr_flashcard`(目前 A1–B1)當基礎、再補 B2–C2。
- **系列 B — DK《5 Words a Day》聽寫(優先交付)**:照原書 **52 週**結構做逐日聽寫。使用者擁有該書、僅取**單字文字**(事實);音檔本專案 edge-tts 自產;不重製 DK 例句/插圖/編排文字/音檔。

### 0.1 動機（Why — 產品決策以此為準）
DK 官方站無內建測驗、單字又印在頁面上(有答案),且要家長親自按語音——家長沒空就停測、一次測多週孩子不耐煩。孩子目前不到第 30 週、落後約 4 年。**核心價值:自動播音(免家長按)＋單字預設隱藏(真測驗)＋逐日小量(不厭煩)＋逐週進度可視(家長督促)＋手寫自評。**

### 0.2 核心誠實前提（寫死）
系統**無法自動判定手寫對錯**。聽寫一律「**顯示正解 + 學習者自評**」,**不**宣稱自動批改手寫(見 R3)。

---

## 1. 鐵律（Iron Rules R1–R12；每條可被紅隊逐條驗證，違反即 FAIL）

- **R1 正確性第一**:教給孩子的拼字/音標/例句/中文釋義/音檔內容必須正確。錯=BLOCKER。
- **R2 全繁體、零簡體、零 PRC 專有詞**(Stop hook `check-simplified-chinese.py` + `tools/scan_simplified.py` 把關)。
- **R3 自評、不假裝自動批改(任何輸入皆然)**:揭曉畫面必顯示**精確正解拼字**;**程式一律不判定答案對錯——不論手寫或鍵盤 fallback 都不做字串比對後的 ✓/✗ 或任何「對/錯」視覺回饋(即使不進 SRS 也不行)**。唯一 SRS 輸入是三級自評(不會/快會/會了);對錯一律由孩子看正解自判。
- **R4 音檔真實且內容正確**:每個被引用音檔(每腔調)必為 **edge-tts 實際產生、存在於 `audio/`、非空、可解碼、可在 iPad Safari 播放**。**唯一例外=`audio/_unlock.mp3`**(§2.5 的 iOS autoplay 解鎖靜音檔):它**不是題目音檔、不經 edge-tts、不入 manifest/sidecar**,而是**版控的靜態靜音資產**(見 §4.3 末);R4 的 TTS 真實性不適用於它,但它仍須「存在+可解碼」——由音檔 gate (a) 另行檢查其存在(§10.3)。**內容正確分兩層(誠實界線)**:(輸入)build 期 manifest `text_sha` 綁定「餵給 TTS 的 text」=資料檔當前 text——抓餵錯字/指錯檔;(輸出)音訊內容由**抽樣實聽**覆蓋(2070 檔無法逐一 ASR)。禁止幻影檔名、禁止餵錯字、禁止 slug 碰撞共用。
- **R5 系列 B 與書逐字一致**:凡**已出貨/部署可達的週**(進資料檔且能被點到,不論孩子是否已用到),其單字須與使用者 DK 書**100% 逐字對照**(不抽樣),附可追溯來源(週/天);**加碼集僅限封閉 allowlist**(CloudFront 週 53–55 = Numbers/Days/Months 三組,見 §4.1)可抽驗;**任何帶 w01–w52 週標籤者一律屬出貨週 → 100% 逐字**,不得用 `src/level` 標籤把真週降級成抽驗。不臆造/不補字。(與 §10.5「出貨週」同一口徑。)
- **R6 house 設計一致**:遵守 `DESIGN_SPEC.md`(v2)與共用層(`assets/app.css`、`game_core.js/css`、`assets/srs_engine.js`)。
- **R7 iPad-13 同屏可達**:iPad Air 13" 下,**手寫畫布 + 控制列(播放/清除/看答案/自評/下一題)同屏免捲動可操作**,書寫區不被工具列或虛擬鍵盤遮擋。由 render gate 驗(§10.4,含最壞態)。
- **R8 basic canvas 即可**:canvas 能寫(Pencil/手指/滑鼠)+ 清除重寫即足夠。**不依賴、不宣稱** Apple Pencil 專屬功能(壓感/傾角/懸停/觸覺/squeeze/double-tap 皆選用加分,缺不算缺陷)。手指/滑鼠書寫品質須與 Pencil 同等驗收。
- **R9 runtime 無外部網路資產**:頁面執行期不依賴任何外部 CDN/字體/音訊;音檔與資料皆本地。**R9 的保證範圍=本功能自身資產(修 r32-D1)**:共用 house 層(`game_core.js`,含其既有 Ko-fi 贊助 FAB 外部圖)為站級既有基礎設施、由站級政策治理,**不在本功能 R9 範圍內**(精確 scope 與 gate 見 §10.2)。(注:build 期產音檔需連網 edge-tts;R9 只管 runtime。)
- **R10 離線 + localStorage 隔離**:純前端無後端;SRS/進度存 localStorage,各 store key 獨立不跨頁污染。
- **R11 可回溯**:單字/例句/音檔對應存在版控資料檔(TS→build JS),一字一音可追溯、可重生。
- **R12 code-download**:站上提供**完整可執行+可驗證**原始碼 bundle,乾淨解壓依 README 可重建;**重建須等價於已部署站**(item id 清單 + 每個被引用音檔鍵一一對上,非只「能 build 出某頁」);README/requirements **釘死 `edge-tts==7.3.1`** 與兩 voice(AriaNeural/SoniaNeural)(重建音檔需連網)。

---

## 2. 互動模型

### 2.1 單字聽寫
1. **聽音**:進題時**自動播一次**(播放由使用者手勢下游觸發,見 §2.5;可重播、可切 us/gb)。**預設不顯示英文拼字**;中文釋義提示預設關、可開(§2.3)。
2. **手寫**:在 canvas 寫下聽到的字(§3)。
3. **看答案**:顯示 **精確拼字(US 書寫目標)** + 音節(如 ap·ple) + IPA(預設關) + 例句(系列 A)/僅字(系列 B)。**若有 `ukSpelling`(US/UK 不同),並列標注「US: color ・ UK: colour」,兩種皆算對(UI 明示)。**
4. **自評**:三級 不會/快會/會了 → SRS `again/good/easy`(§7)。
5. **下一題**:由 SRS 佇列決定。

### 2.2 例句聽寫（系列 A）
1. 自動播整句(可重播;慢速用 edge-tts 預生慢速 mp3,不靠瀏覽器變速)。
2. 手寫整句(多行畫布;標點/大小寫提示開關)。
3. 看答案:整句正解 + **逐詞斷詞列出**供自己核對(不自動判)。
4. 三級自評 → SRS。 5. 下一題。

### 2.3 分級鷹架（預設關、可開；不影響計分口徑 R3）
中文釋義提示(單字軌,需 `zh`,缺則自動隱藏)、首字母提示(由 `word[0]` 導出)、逐詞播放(**例句軌,系列 A 專屬;修 r47**)。**逐詞播放不另產逐詞音檔**——改由 build 期 edge-tts 的 **WordBoundary 時間戳**存入該例句 item 的 `wordTimings[]`(§4 schema optional 欄),runtime **在單一整句 mp3 上 seek** 各詞起點播放(避免未納入 `audioKeys[]` 的幽靈檔破 R4/gate(e))。此 toggle **僅系列 A 出現**(DK 單字軌無例句、不涉),隨系列 A 一併實作。狀態存 localStorage(`dict_{series}_scaffold_v1`,§7)。

### 2.4 全程不自動判手寫（R3）
引擎只:播音、呈現畫布、揭曉正解、收自評。對錯由孩子看正解自判。

### 2.5 自動播音策略（iOS Safari 現實）
- iOS 無 user gesture 不能 autoplay。**作法**:進入 play / 按「下一題」/ 按選單 item 本身即 user gesture;`renderItem()` 在該手勢的**同步呼叫鏈內** `play()`,故首題起每題都能自動響;首次進入(選單→play 的那次 tap)做一次 audio-unlock——**播放一段極短的本地靜音 mp3 `audio/_unlock.mp3`**(非題目音檔,避免未選腔調就播錯);**`_unlock.mp3` 的 `play()` 不得 await(修 r26-D2)**——以 fire-and-forget 呼叫後,於**同一同步 handler 內立即** `renderItem()`;第一題的 `play()` **絕不**掛在 unlock 的 `promise`/`onended` 回呼上(否則微任務已脫離 user gesture → 首題被 iOS 拒播,落入「🔊 點我播放」fallback,違反「首題起每題自動響」)。**預設 accent = `us`**(DK 與 CEFR 皆然;腔調 pill 可切,值存 localStorage per 系列);`playAudio` 讀此全域值,故不會有未定義 accent。
- **禁止失敗靜默**:`play()` 被拒/reject → 顯示明顯「🔊 點我播放」鈕(不可留無聲空畫面)。
- **靜音提醒**:iPad 實體/軟體靜音下 `play()` 不出聲也不報錯 → 首次進入顯示「聽不到?檢查靜音鍵/音量」提示一次;「已顯示過」旗標存 `dict_{series}_hints_v1`(§7,一次性 dismissals key)。

---

## 3. iPad-13 視窗 + 手寫畫布（basic canvas）

- **視窗**:iPad Air 13" 橫/直向皆須可用,以 Safari 實際可用高度為準;**畫布+控制列同屏免捲動**(R7)。直向為預設作答姿勢。
- **輸入**:`<canvas>` 用 Pointer Events,`pointerdown/move/up` 不分 pointerType 皆落筆(Pencil/手指/滑鼠);畫布區 `touch-action:none`(頁面其餘可捲)。選用加分:`pressure` 粗細、`getCoalescedEvents()` 順滑、`pointerType==='pen'` 手掌過濾——缺不算缺陷。用 `<canvas>`(非文字框)故 iPadOS Scribble 不自動轉字。
- **畫布必備**:(a) 流暢書寫;(b) **一鍵清除/擦掉重寫**;(c) Retina 清晰(backing store ×devicePixelRatio)。**選用**:單一基準線/淡色字格提示字數(可關)、undo、局部橡皮擦、多筆色。
- **工具列 `dct-toolbar` 必備只有「清除」**;undo 若實作才加入(非必備)。
- **fallback**:畫布旁提供鍵盤/文字框 fallback(手機/不想手寫者打字);控制列為真按鈕、焦點可達。

---

## 4. 內容資料模型

TS 源檔 → `build:legacy` 出 JS。

```ts
type Accent = 'us' | 'gb';
type Kind = 'word' | 'sent';
interface DictItem {
  id: string;            // = seriesKey::level::day::kind::slugOrHash（全域唯一；day='d1'..'d5'(DK 一般週)/'bonus'(加碼集)/'na'(CEFR)；day5 複習卡 day='d5'，字串即與 day1–4 來源卡區隔，不靠 store 救援）
  word: string;          // 正解拼字（US 書寫目標；精確含大小寫；專有名詞保留大寫）。sentence 軌放整句。
  ukSpelling?: string;   // 僅當 UK 拼法與 word 不同時填（reveal 並列 US/UK，兩種皆算對）
  syll?: string;         // 音節拆法（自寫；DK 書無此欄）
  ipa?: string;          // 音標（選用；自寫）
  zh?: string;           // 繁體中文釋義（自寫；中文提示用；選用——DK 初版可無，缺則中文提示鷹架自動隱藏，見 §4.2）
  pos?: string;
  sentence?: string;     // 系列 A 例句（自寫；系列 B 不附 DK 例句）
  wordTimings?: {w:string,t:number}[]; // 系列 A 例句軌「逐詞播放」用（§2.3）：build 期 edge-tts WordBoundary 時間戳（t=秒），runtime 在「單一整句 mp3」上 seek 各詞起點；不另產逐詞音檔（否則成幽靈檔破 R4/gate(e)）。系列 B 無。

  audioSlug: string;     // 音檔去重鍵。word 軌 = word 正規化 slug；sent 軌 = hash(整句 text)。同鍵跨週/跨卡共用同音檔（**同一 series 內**；完整去重鍵含 series/accent，見 §6）
  kind: Kind;            // 'word' | 'sent'（亦為 id 第4段；顯式欄位便於系列A混合資料檔按 mode 過濾）
  day: string;           // 'd1'..'d5'（系列B 一般週）| 'bonus'（加碼集）| 'na'（系列A）
  src: string;           // 來源：'cefrj'|'ngsl'|'awl'|'dk-w44d2'|'dk-bonus-numbers'|...（可追溯 R5/R11）
  level: string;         // 系列A='cefr-a1'…'cefr-c2'（修 cefr_spec_check DEFECT1：與 §12 OPEN-C 定案一致）；系列B 週='dk-w01'…'dk-w52'；加碼集='dk-bonus-numbers|days|months'
}
```

### 4.1 命名慣例（定死，build/引擎共用）
- `seriesKey` ∈ **`'dk'` | `'cefr'`**。
- **週碼零填兩位**:`w01`…`w52`(id `level` 與 §7 store key 皆用兩位,一致);day `d1`..`d5`(不填零)。
- **hash 演算法(word+sent 兩軌皆適用)**:**所有 `text_sha`(word 與 sent 兩軌)**與 sent 軌 `audioSlug` 一律 **SHA-1(utf-8 text) 取前 12 hex**(同演算法,免漂移;gate (b) 重算亦用此)。
- **加碼集(封閉 allowlist,僅此三組)**:`level ∈ {'dk-bonus-numbers','dk-bonus-days','dk-bonus-months'}`(對應 CloudFront 週 53/54/55)、`day='bonus'`、`src='dk-bonus-{set}'`;store key 見 §7。**只有這三個 level 可標 bonus/抽驗**;build 若見其他值標 bonus → 報錯。其餘一律 w01–w52 出貨週 100%(R5)。

- **音檔檔名(去重,不含週/級)**:`word_dict_<series>_<audioSlug>_<accent>.mp3`、`sent_dict_<series>_<hash>_<accent>.mp3`(+ 選用 `_slow`)。**同一個字在不同週共用同一音檔**(故 DK 去重後 1035 唯一字 → 1035×2 腔 = 2070 mp3,非 1081×2)。**card id 含週**所以各週卡仍各自獨立計分;音檔是共享資源。
- **slug 正規化 + 1:1**:`audioSlug` = 小寫、空白→`-`、去非 `[a-z0-9-]`;build 期建 slug→word 反查,**兩個不同字映到同 slug = 失敗報錯**(加後綴人工解),不得靜默共用(R4)。
- **id 第5段 `slugOrHash` ≡ 該 item 最終 `audioSlug`**(word:解碰撞加後綴後的值;sent:hash)。故 id 與音檔鍵一一對應(R12 等價比對靠此);解碰撞加後綴時 id 與 audioSlug **同步更新**。
- **碰撞後綴的可重現持久化(修 r18-G1;keying 修 r20-F3/r21)**:slug 碰撞的解法(後綴)存在**版控、build 必讀**的 **per-series** `src/dict_slug_overrides_{dk,cefr}.json`(與 sidecar 同為逐 series,修 r44-D2:碰撞解法本就 per-series——檔名含 series,DK 的 March/march 與任何 CEFR 碰撞彼此獨立;單一共用檔會讓 DK 後綴誤改 CEFR slug、反之亦然),**各檔 keyed by 原始(保留大小寫/變音)`word`**(schema 的 `word` 欄,§4),值=該原始字於**該 series** 指定的 audioSlug。**不用正規化形式當鍵**——碰撞的定義(§4.1 上一條)是「兩個不同原始字正規化後撞同一 slug」,它們共用同一正規化形式;若以正規化形式當鍵,兩字會共用一把鍵、無法各存不同目標 slug,碰撞**永遠解不掉**(r21)。用原始 `word` 當鍵:同一原始字跨週 → 同一把鍵 → 同一 slug(避開 per-occurrence `authKey` 會讓一字裂成 >1 slug 的問題);兩個不同原始字(US/us、March/march、Polish/polish)各有獨立鍵、可各存不同目標 slug。build **先套此 override 再產 audioSlug/id**,故每次 rebuild 得到相同 slug(R11/R12 可重現)。build assert:(i) 套用後無殘餘碰撞(兩個不同原始字→同 slug 即報錯);(ii) **任一原始 `word` 最終只對應一個 `audioSlug`**(抓同字裂成 >1 slug);(iii) `build_dk_data.py` **計算並記錄預期音檔數**到該 series sidecar 的 `meta.expectedAudioCount`(§4.3;**不寫 manifest**——manifest 由稍後的 `gen_dict_audio.py` 產出,build 時尚不存在)(= 最終相異 audioSlug 數 × 腔數,例句軌另計 slow;DK 全集(含 bonus)去重 pre-collision 約 1035×2=2070,每解一個碰撞 +2,**不得寫死 2070**;修 r36-D2:此 1035=全集去重,與 §5.3/§4.1 音檔去重同義,非「一般字(非 bonus)」)。(i)/(ii) 任一不符即報錯(不得靠「人工當場加後綴但不落檔」)。**實際產出 mp3 數 vs 此預期數的比對不在本 build**(`build_dk_data.py` 跑在 `gen_dict_audio.py` 之前,此時 `audio/` 尚無檔,修 r22-F1)——移到音檔 gate (e)(§6/§10.3)執行。

### 4.2 生成 vs 自寫欄位（修 r13-D1/D2：build 不得覆寫自寫欄）
- `build_dk_data.py` **只生成 CloudFront 來源欄 + 來源側衍生**:`word, ukSpelling?, level, day, src, kind, audioSlug, id`(`ukSpelling` 由 build **查版控 authored 對照表 `src/dict_us_uk.json`**(§5.3/§9)填入;修 r29-B:UK 形是 **authored 知識**〔CloudFront 無 UK〕,非從 US 資料可衍生,但因對照表已 committed,build 讀它即可**重生**〔R12〕,不靠掃描產生;修 r19-D1——此列為權威輸出 schema,須與 §9、§4.3 sidecar 的 `ukSpelling?` 一致)。
- **自寫欄(`zh/syll/ipa`)另存獨立檔 `src/dict_authored_dk.json`(修 r20-F1:JSON,非 TS)**——因為合併自寫欄與算 `hasZh` 的是 **Python 的 `build_dk_data.py`**(§9),而 §4.3 鐵律是「Python 不解析 JS/TS」;故自寫資料必為 Python 可讀的 JSON,不得是 `.ts`。格式:`{ "<authKey>": {"zh"?:…,"syll"?:…,"ipa"?:…,"pos"?:…}, … }`(修 r20-minor:`pos` 的唯一歸屬=此自寫檔,非 Python 來源欄),**keyed by 穩定自然鍵 `authKey = level::day::kind::word`(原始 `word`,**保留大小寫/變音**——與 §4.1 override 鍵空間一致,避免 US/us、March/march 這類 case-variant 在同一 `level::day::kind` 併成一把鍵;刻意不含會因 slug 碰撞加後綴而變動的 `slugOrHash`)**;build 期以 `authKey` **merge `zh/syll/ipa/pos` 四欄**(修 r38:四欄一致,`pos` 亦 merge,保留備用,見 §4 schema `pos?`)進輸出資料檔 `src/dict_data_dk.ts`(→`window.DICT_DK`,供 reveal 顯示);**此檔為人工手寫、版控,重跑 build 只重生來源欄,絕不覆寫 `dict_authored_dk.json`**(修 D2 clobber)。(修 r14-D2:若改用 id 當 key,日後碰撞後綴會改 id → 自寫欄孤兒遺失;故用不隨碰撞變動的 authKey。build 另 assert:每筆 authored key 都能對到一個現存 item(否則報孤兒錯),且**無兩個相異 item 共用同一 `authKey`**(抓 case-variant 併鍵導致自寫欄交叉污染,修 r22-F2),否則報錯。)
- **DK 初版**:`zh/syll/ipa/pos` 可全缺(授權檔空)→ 缺 `zh` 的 item 其**中文提示鷹架自動隱藏**(§2.3);缺 `syll/ipa` 則 reveal 不顯該列;**缺 `sentence` 亦不顯例句列(修 r36-D1:系列 B word-only item 無 `sentence`,故無例句列,不得渲染空白/undefined 列)**;`pos` 目前 reveal 未用、保留備用。皆不報錯(欄位 optional)。日後補授權檔即增益,不需改引擎。

### 4.3 canonical JSON sidecar（修 r13-D3：Python 不解析 JS/TS；r17-D2：per-series 免互相覆寫）
- 每個 build **輸出自己的 per-series sidecar**:`build_dk_data.py`→`src/dict_items_dk.json`、CEFR build→`src/dict_items_cefr.json`(**各自檔名,互不覆寫**;修 r17-D2 的單一路徑 clobber)。
- **檔案頂層形狀(修 r23)**:`{ "meta": { "expectedAudioCount": { "word_us":N,"word_gb":N,"sent_us":N,"sent_gb":N,"sent_slow_us":N,"sent_slow_gb":N } }, "items": [ …每筆 item… ] }`。`meta.expectedAudioCount` 由該 series 的 build(`build_dk_data.py` / CEFR build)計算填入,供 §4.1 (iii)/§6 (e) 比對,是**唯一的檔案級欄位**(非 item)。**六個 key(`word_us`/`word_gb`/`sent_us`/`sent_gb`/`sent_slow_us`/`sent_slow_gb`)在每個 series 的 sidecar 皆必存在**;該 series 無該軌者填 `0`,**絕不缺鍵**(修 r24:讓 gate (e) 以固定 keyset 迭代,類別集不依賴 build 輸出)。
- 每筆 **item**:`{id, kind, day, level, src, word, ukSpelling?, audioSlug, audioKeys[]}`(audioKeys = 該 item 需要的所有音檔鍵,**每鍵內嵌 series+slug+accent(+例句 slow)**,對應 §4.1 檔名 `*_dict_<series>_<slug>_<accent>[_slow]`;§6 去重鍵即由此組成)。**不含 `hasZh`(修 r20-F1)**——中文提示鷹架於執行期由 `window.DICT_*` 的 `zh` 有無決定(§2.3),無任何 sidecar 消費者(gen_dict_audio/音檔 gate/R12)需要它,故 sidecar 不攜帶此自寫衍生欄。
- 消費者(`tools/gen_dict_audio.py`、**音檔 gate**、**R12 rebuild 等價比對**)一律**讀全部 `src/dict_items_*.json` 的 `.items` 聯集**(**不是檔案根**——根含 `meta`;迭代一律走 `.items`,避免把 `meta` 當成一筆 item;修 r23)。與瀏覽器用的 `window.DICT_*` 由同一 build 同源產出,保證一致。
- **day5 不入 sidecar(修 r18-G3)**:d5 複習卡由**引擎執行期**從該週 d1–d4 確定性合成(§7/§9),**不**由 build 寫入 sidecar;故 sidecar `.items` 的 `day` 僅 d1–d4 / bonus / na。**R12 的 id 等價集 = 全部 sidecar `.items` 的 id 聯集**(d1–d4+bonus+CEFR);d5 的等價性由「引擎對共享 d1–d4 集的確定性合成」保證,不另列入 diff。**`meta` 為確定性衍生,不列入 R12 id-diff**(其值正確性由音檔 gate (e) 驗,§6)。
- **`audio/_unlock.mp3` 的來源(修 r17-D1/r18-G4)**:極短靜音 mp3,為**版控的靜態資產**(一次產生即 commit 入 git、入 bundle、**clean rebuild 不重生**),**不經 build、不經 edge-tts、不入任何 sidecar/manifest**。因此它既是 R4 的唯一例外(§1 R4),也不在 R12 的「item id + 被引用音檔鍵」等價集內——改以 **R12 rebuild 等價允許清單**明列(§10.6):clean rebuild 後的樹**必含** `audio/_unlock.mp3`(由 bundle 帶入而非重生),缺檔即 R12 FAIL(堵住「乾淨重建樹無此檔但 gate 仍過」的漏洞)。

### 4.4 加碼集抽取（修 r13-D5）
- CloudFront 週 53/54/55 各為**單一 day**(無 d1–d5 結構),整組字即該 set:numbers/days/months 各取該週該 day 的 items,`day='bonus'`;counts 以實際資料為準(days=7、months=12、numbers 視資料)。
- set 內或跨 set 若有重複字 → slug 1:1 仍 dedup 共用音檔;card id 因 `level` 不同而各自獨立。

---

## 5. 內容來源與分級

### 5.1 CEFR 事實
CEFR(歐洲委員會)只定義能力描述、**不發佈官方單字表**;A1–C2 單字皆第三方對應。

### 5.2 系列 A 來源（開放授權；EVP/Oxford 只對照不複製）
骨架 = **CEFR-J Wordlist**(開放,A1–B2) + **NGSL/NAWL/AWL**(開放,延伸 B2–C2);例句**本專案自寫**(native+語言學+學習科學 lens 審),禁抄任何出版社例句。每級字量見 §12 OPEN-C。

### 5.3 系列 B 來源（DK）— 已驗證、已定案
- 書結構(使用者確認):**52 週**,每週 **day1–4 新字(每天 5=20/週)**,**day5=前四天複習**(非新字)。全書約 **1040 新字**(=52×20;跨週本就含重複字,故非全不同);CloudFront index 含文字筆 **1081**(1040 + 加碼集 Numbers/Days/Months 三組);**全集去重 1035**=唯一音檔字數(×2 腔 ≈ 2070 mp3,為 **pre-collision 預期值**;若集內有正規化碰撞,每解一個 +2,實際預期數由 build 計算,見 §4.1 assert (iii),不寫死 2070)。
- **取字 = 公開 CloudFront 靜態 JSON**(無驗證、無 bot 牆、可直接 curl):
  `https://d2hmvvndovjpc2.cloudfront.net/five-words/api/books/us/5-words-a-day/index.json`(528KB 全書)。結構 `data.ref.weeks[].days[].groups[].audio[]`,每 item `{text, number, file}`。**只取 `text`**,不取 DK 的 mp3/opus。URL `/{week}-{day}`(如 44-2)。
- **字源快照必須版控(修 r51:R12 可重現)**:抓下的 index **committed 成版控 `src/dk_index_us.json`**,`build_dk_data.py` 的 **rebuild 一律讀此快照、不抓 live**(id-set 由 text 衍生,讀 live 會讓 clean rebuild 非確定、R12 失真或遮蔽漂移);**重抓 CloudFront 只作為刻意的「refresh」動作**(人工執行、覆寫快照、重審對書),絕不在 R12 rebuild 路徑發生。此快照與其他三個 authored 輸入(authored/slug-overrides/us-uk)同受「committed → 可重生」紀律。
- **不破解反機器人**:dk5words.com **網站本體**在 Vercel「verify your browser」後——不碰、不破解。CloudFront CDN 是另一個公開主機,取它不算繞過封鎖。
- **已驗證對書**(3/3):wk1d1 one/two/three/four/five、wk28d3 weather/foggy/cloudy/sunny/windy、wk44d2 build/fix/mix/glue/paint;day5 `text:null`。
- **版本 = US(定案)**:`en-gb`/`gb` CloudFront 路徑 404,僅 US 可取。書寫目標 = US 拼法;US/UK 分歧字(color/colour、colors/colours、math/maths、gray/grey、airplane/aeroplane、favorite/favourite、mother·mom/mum、fall/autumn…)填 `ukSpelling`,reveal 並列、兩者皆算對(§2.1)。涵蓋 DK 集內分歧字的 US↔UK 對照表 = **版控 authored input `src/dict_us_uk.json`**(US `word`→`ukSpelling`;build 讀入填欄,§9)。
- **合法性**:見 §11(公開靜態事實性單字;使用者擁書、接受公開;不重製 DK 表達)。

### 5.4 音檔（兩系列共用）
edge-tts(venv 7.3.1)預生 mp3,**native 成人**:us=**en-US-AriaNeural**、gb=**en-GB-SoniaNeural**(可換)。
- **TTS 輸入文字(定死,修 r11-D1)**:word 軌**兩腔皆合成 `item.word`(US headword)**;**`ukSpelling` 只用於 reveal 顯示、絕不另外合成音檔**(gb 腔=以英式口音讀同一 US headword;故維持單一 `audioSlug` × 2 腔,無第三種檔)。sent 軌(例句聽寫)合成 **`item.word`**——整句即存於 `word` 欄(見 §4 schema;`sentence?` 欄是**另一回事**=word 軌 reveal 用的例句,不送 TTS)。
- **慢速(修 r11-D2)**:僅例句軌提供,`rate='-25%'`;單字軌不需慢速。
- **逐詞時間戳(系列 A;修 r47)**:系列 A 例句軌若要支援 §2.3「逐詞播放」,合成該句時一併擷取 edge-tts 的 **WordBoundary** 事件、寫入 item `wordTimings[]`(§4 schema);**不另產逐詞 mp3**(維持一句一檔,`audioKeys[]`/gate(e) 計數不變)。系列 B 不涉。**資料流/時序(系列 A 實作時定序)**:`wordTimings[]` 由 TTS 階段產生,故系列 A build 須在 TTS 之後**回填** `dict_data_cefr_*.ts`(或引擎讀取的 per-series 資料檔)——與 DK v1 不同(DK 無例句軌、無此回填);此為 §2.3 列為「系列 A 專屬、隨系列 A 一併實作」的一環,不擋 DK 日軌(§15 step 5「同流程」涵蓋)。

---

## 6. 音檔管線（`tools/gen_dict_audio.py`，擴充 gen_audio 慣例）

- 讀 **全部 `src/dict_items_*.json` 的 `.items` 聯集**(§4.3 per-series sidecar;Python 不解析 JS/TS)→ 迭代每個 item 的 `audioKeys[]`(已內嵌 series+slug+accent(+例句 slow),見 §4.3)、**以 `(series, audioSlug|hash, accent[, slow])` 為去重鍵**呼叫 edge-tts(voice 依 §5.4)→ 寫 `audio/word_dict_<series>_* / sent_dict_<series>_*`。**去重鍵必含 `series`(修 r44-D1)**:不得跨 series 以 `(audioSlug, accent)` 併——否則 DK 與 CEFR 同字(如 apple)會併成一次合成只產一檔,另一 series 引用的檔從未寫出 → gate (a)/(e) FAIL。(`audio/_unlock.mp3` 不由本工具產生,見 §4.3。)
- **manifest 於 TTS 呼叫點捕捉(修 L2 循環綁定)**:`audio_manifest.json` 每筆 `{audioKey, text, accent, file, text_sha}` 的 `text`/`text_sha` 必為**實際傳給 edge-tts 的字串字面**(在 synth 呼叫處記錄),**不是**事後再從資料檔重讀——否則 gate 只證明 manifest==資料檔、證不到 audio==text。**manifest 持久且增量更新(修 r20-F2)**:每次 run 只覆寫「本次實際重合成」的 audioKey 條目;**跳過(冪等)的檔其條目原封保留**(= 其 synth-time 的 `text`/`text_sha`);**絕不**整檔由當前資料重寫。故每個 audioKey 恆有一筆 **synth-time** 條目供 gate(b) 比對。
- **冪等見證=目標 mp3 檔名 + 共置 `.sha`(修 L3 + r9-D1 + r19-D2 + r20-F2)**:以**目標 mp3 檔名**(已內含 accent 與 `_slow`,見 §4.1)為鍵;每個 mp3 於合成時**原子寫出共置的 `audio/<name>.sha`** = 該次 synth 的 `text_sha`。**skip 判定**:目標 mp3 存在 AND 其共置 `.sha` == **當前資料文字**的 sha 才跳過,否則重合成覆蓋並更新 `.sha`。`.sha` 是**與產物共置的 synth-time 見證**,為 skip 判定的權威來源(即使 manifest 遺失/損毀亦不影響 skip 正確性)。(不可只用 `text_sha` 當全域鍵——同 text 的 us/gb/slow 檔 text_sha 相同,會互相誤跳而永遠產不出 gb/slow。)
- **音檔 gate(R4,§10.3)**:(a) 每個資料檔引用的音檔鍵 → 檔案存在、size>0、ffprobe/afplay 可解碼(另含 `audio/_unlock.mp3` 存在+可解碼,見 §10.3);(b) 對每個 audioKey **兩道檢查(manifest=synth-time,見上)**:**(b1)** 重算 `SHA-1(資料檔當前 text)` 前 12 hex,assert == manifest 該筆 `text_sha`——資料改過但檔沒重生時 manifest 仍是舊 synth sha ≠ 當前 → FAIL(**stale 偵測主力**);**(b2)** 該目標檔共置 `.sha` == manifest `text_sha`——synth-time 見證與 manifest 一致,抓 desync/半寫;任一不符 → fail;(c) slug 1:1 無碰撞;(d) 每個 voice/題型**抽樣實聽**數檔確認輸出內容+腔調(輸出層唯一的內容驗證,見 R4 誠實界線);**(e) 檔數一致(修 r22-F1;home 修 r23;keyset 修 r24)**:**逐 series** 計數,gate **迭代固定六鍵集**(`word_us`/`word_gb`/`sent_us`/`sent_gb`/`sent_slow_us`/`sent_slow_gb`,**不以 meta 實際出現的鍵為準**——否則 build 漏鍵會讓 gate 連帶漏數=循環失效)。對每一鍵:計 `audio/` 下**檔名含 `_<series>_`**(dk/cefr)、符合該類命名樣式(`word_dict_*`/`sent_dict_*`、對應腔調、`sent_slow` 為尾段)的 mp3 數,**排除 `audio/_unlock.mp3`**,assert == 該 series `src/dict_items_<series>.json` 的 `meta.expectedAudioCount[<鍵>]`;**meta 缺該鍵即 FAIL(不視為 0)**;任一不符 → FAIL(抓少產 gb/slow、孤兒檔、人工加後綴卻沒合成)。
- 量級:DK 2070 mp3;CEFR 視字量。分批跑、尊重資源(venv python)。

---

## 7. SRS 與自評（複用 `assets/srs_engine.js`，不另造排程）

- 自評映射:不會→`again`、快會→`good`、會了→`easy`(引擎三級 `rate()`)。
- **store key(每系列/級/天/mode 獨立,R10)**:
  - 系列 A:`dict_cefr_{LV}_{kind}_v1`(kind=word|sent;word/sent 各自 store)。**`{LV}` = `level` 去掉 `cefr-` 前綴**(level=`cefr-a1` → `{LV}`=`a1` → key=`dict_cefr_a1_word_v1`;修 cefr_spec_check DEFECT1,三處〔§4 level / 此 key / §12〕一致)。
  - 系列 B 一般週:`dict_dk_w{NN}d{D}_{kind}_v1`(**NN 零填兩位** w01..w52;kind 預設 word,保留維度供日後句軌;day5 用 `dict_dk_w{NN}d5_word_v1`)。
  - 系列 B 加碼集:`dict_dk_bonus_{numbers|days|months}_word_v1`。
  - **非 SRS 狀態 key(定名,修 r29-A/r34-B;series∈dk|cefr)**:腔調 `dict_{series}_accent_v1`(§2.5,per 系列,值 `us|gb`);鷹架 `dict_{series}_scaffold_v1`(§2.3,per 系列,存各提示開關);**一次性提示 dismissals** `dict_{series}_hints_v1`(§2.5 靜音提醒等「顯示一次」旗標;與 scaffold 分開——scaffold 是使用者可切的提示開關,hints 是一次性關閉記錄,修 r34-B);完成追蹤 **per-series** `dict_{series}_done_v1`(每 series 一把聚合:DK=`dict_dk_done_v1`、CEFR=`dict_cefr_done_v1`;cardId→最後 grade / 單元→完成旗標,見下)。這些狀態 key **不**具 per-level/day/mode 維度,屬合法例外(§10.2 的 key 集據此判定,不套「per series/level/day/mode 唯一」)。
- `buildSession(items,{dailyNew})`:到期優先+每日新字上限+交錯。**`dailyNew` = 該 session 字數**(日軌=5)。
- **day5 複習**:該週 20 字(= day1–4 的 20 字,**共用其音檔**;card id 用 `day='d5'` 與來源卡區隔,存於 day5 store)為一次**複習 drill**:整輪跑完 20 字(`dailyNew`=20 → 全數 admit),語意是複習不是學新(機制上對該 store 為 new,靠 dailyNew=20 全收)。
  - **intra-week 唯一性 assert(修 r51)**:d5 id = `…::d5::word::<slug>`(不含來源 day),故若某週 d1–d4 有 **intra-week 重複字**,其 d5 id 會塌成 <20 張,牴觸「20 張」與完成度計數。spec 的 1040→1035 去重僅 **cross-week**,未保證 intra-week 唯一。故 `build_dk_data.py` 須 assert **每週 d1–d4 產出 20 個相異 `audioSlug`**(等價於 20 個相異 d5 id);trip 即 fail-closed 報錯(signal「20 張」不變式需正視)——把這個未驗證的潛在假設轉成 fail-closed 檢查,而非默默塌卡。
- **完成準則(家長督促用)**:一個 **day「完成」= 該 day 每張卡至少自評一次且最後一次 ≥「快會」**;day5 同(20 張);**週「完成」= day1–5 全完成**。選單完成度點依此。依賴「可查每卡最後評級」;`srs_engine.js` 的 card 物件已存 `timesSeen`,但**最後 grade 非其既有欄位**——故本頁在 store 外另存一個 **per-series** `dict_{series}_done_v1`(DK=`dict_dk_done_v1`、CEFR=`dict_cefr_done_v1`;每 `cardId`→最後 grade / 每單元→完成旗標)到自己的 localStorage key,不污染 SRS store。
- **加碼集(bonus)的 session/完成準則(修 r18-G2)**:加碼集無 day 結構,整組即一次 drill(比照 day5 的全組複習)。`buildSession` 的 **`dailyNew` = 該 set 實際字數**(numbers/days/months 各依 §4.4 實際 count,全數 admit 一次跑完);**「完成」= 該 set 每張卡至少自評一次且最後一次 ≥「快會」**;**完成度點三態**與下列同一基準(none/partial/done)。bonus 完成旗標亦存 `dict_dk_done_v1`。
- **完成度點三態(修 r13-D6)**:每個 day/週格/加碼集格的點有三狀態——**未開始(none)**:該單元無任何 cardId 記錄;**進行中(partial)**:有記錄但未達「完成」(含「有卡最後 grade=**不會(again)**——唯一低於『快會』的等級;`快會`/`會了` 皆屬完成側」或未全部作答);**完成(done)**:達上述完成準則。三態視覺須可區分(非只靠顏色,比照 house callout 原則)。
- HUD:**預設只走 SRS、不呼叫 `Game.recordAnswer`**(其需 boolean correct,與 R3 衝突);若要 HUD XP 用 `Game.award`(無對錯語意)。排程本身不發 XP。

---

## 8. 版面與設計系統（遵 DESIGN_SPEC v2，型 G flashcard 家族近親）

- 外層:`app.css`→`game_core.css`(不需 concept.css);`game_core.js` 於 `<head>`;app-bar 三件(🏠學習基地/標題/🌙);主題鈕不寫頁面 JS;亮/暗雙主題;只設 accent 三件組。
- 選單:`.fc-source`/`.fc-source--grid` pill(選系列/週或級/題型/腔調/鷹架)。
- 新元件(restyle-not-rename,前綴 `dct-`):`dct-canvas`、`dct-toolbar`(清除[、undo 若做])、`dct-controls`(播放/看答案/自評/下一題)、`dct-reveal`(左彩條正解:拼字+US/UK+音節+IPA+例句)、`dct-rate`(三級,對齊 `.fc-rate`)。重用 `.fc-rate/.btn/.cn-nextup/.result-card/app-bar`。
- 護眼:畫布+控制列同屏;字級走 token;正解放大清楚。寬螢幕依 `--content-max`;控制行 ≤540 置中。

---

## 9. 檔案與架構

- **頁面**:單一 hub `english_dictation.html`(§12 已定單 hub)。畫面 `#screen-menu`/`#screen-play`/`#screen-done`。`index.html` 英文區加 row-card「英文聽寫」入口。
- **引擎**:`src/dictation.ts` → `dictation.js`(播音/畫布/揭曉/自評/SRS;吃資料檔;`@ts-nocheck` house 風格)。
- **功能 CSS(修 r32-D2)**:`dictation.css`(承載所有 `dct-*` 規則,§8;本地、無外部 `@import`/`url()`)。**`dct-*` 規則不得寫入共用 `game_core.css` 或 `app.css`**(修 r34-A)——否則會落在 §10.2 R9 掃描範圍外,外部引用躲過 gate。頁面以本地 `<link>` 載入它(與 app.css/game_core.css 同為本地)。
- **資料**:`src/dict_data_dk.ts`(→`window.DICT_DK`)、`src/dict_data_cefr_a1.ts`…`c2.ts`。
- **資料/對照輸入(版控,build 讀入,修 r29-B/r51)**:**字源快照 `src/dk_index_us.json`(版控,rebuild 讀此、不抓 live,§5.3)**、`src/dict_authored_dk.json`(zh/syll/ipa/pos,§4.2)、`src/dict_slug_overrides_{dk,cefr}.json`(per-series slug 碰撞後綴,§4.1)、`src/dict_us_uk.json`(**US↔UK 對照表**,keyed by US `word` → `ukSpelling`,§5.3;**authored 知識**——CloudFront 僅 US、無 UK 形,不可由資料衍生;build 讀此 committed 檔填 `ukSpelling`,故可重生 R12)。
- **轉檔**:`tools/build_dk_data.py`(讀**版控快照 `src/dk_index_us.json`**(§5.3;**rebuild 不抓 live**,只讀此 committed 快照——R12 確定性)+ **讀 `src/dict_authored_dk.json`(JSON,合法)以 `authKey` merge `zh/syll/ipa/pos`** → 出 `src/dict_data_dk.ts`(含自寫欄供 reveal)+ `src/dict_items_dk.json` sidecar;只取 CloudFront 的 text;套 US↔UK 對照表填 `ukSpelling`;day5 由引擎生、不入 sidecar)。
- **音檔**:`tools/gen_dict_audio.py` → `audio/`(§6)。
- **bundle(R12)**:`downloads/dictation-src.zip`(src/〔含版控字源快照 `src/dk_index_us.json`,修 r51〕 + 資料檔 + 兩個 tools + html + README〔build:legacy、重建音檔需連網 edge-tts、本地 server 驗證、**rebuild 讀 `src/dk_index_us.json` 快照不抓 live**〕+ **靜態資產 `audio/_unlock.mp3`**〔不重生,隨 bundle 帶入,見 §4.3〕);.zip 與解壓樹入 git;乾淨解壓驗證可重建。
- TS 走 `tsconfig.legacy.json`。

### 9.1 引擎函式骨架
`renderMenu()`(DK 52 週格〔第 N 週·20 字 + 完成度點〕+ 加碼集;CEFR 級→題型) → `startSet(series,key,mode)`(`SRS.createStore(key)`+`buildSession`) → `renderItem()`(手勢鏈內 `playAudio()`;渲染題號/重播/腔調切換/鷹架/`dct-canvas`/`dct-toolbar`/`dct-controls`;不顯示答案) → `reveal()`(`dct-reveal`:US〔+UK〕+音節+IPA+例句〔**系列 A only;系列 B(DK)省略例句列**,見 §2.1〕;出 `dct-rate`;**音節/IPA/例句列各自缺欄則該列不渲染(§4.2);`ukSpelling` 缺時 US 列仍渲染、僅省略並列的 UK 部分——絕不隱藏必填的 US 拼字(R3)**) → `rate(grade)`(`store.rate(id,grade)`;`next()`) → `renderDone()`(`.result-card`)。`initCanvas()`/`clearCanvas()`。`playAudio(item,kind,slow)`:**無 `file` 欄**——依 §4 檔名公式,由 `item.audioSlug` + **當前 accent(全域 state us/gb)** (+ `_slow`) 現算檔名(一 item 對 us/gb 兩檔,故必現算)→ `new Audio('audio/'+name).play()`;**reject → 顯示播放鈕,不靜默**(§2.5)。

---

## 10. DONE-GATE（全過才算完成）

> 註:全檔 `§10.N` 一律指「本節第 N 項」(扁平 1–8 清單),非子章節。

1. **content_audit 收斂**:本 spec 先 5 consecutive clean(coverage-validated + L3);實作後每個新頁/資料檔再跑到 house N-clean。
2. **free gates**:`tools/scan_simplified.py` PASS(**R2 的簡體字形部分**);**PRC 專有詞 denylist 掃描(修 red-team G1)**——`scan_simplified.py` 只抓簡體字形,抓不到「繁體字形但屬 PRC 用語」者;故 fail-closed 掃一份 denylist(種子自 memory `terminology-china-not-mainland`,語言 team 維護):`大陸`/`中國大陸`(指中國;`大陸` 的地理例外由下方「比對規則」**統一定義**,此處不另列舉以免雙重定義分歧,修 red-team r58)、`視頻`、`軟件`、`信息`(台用`訊息`)、`屏幕`(台用`螢幕`)、`默認`(台用`預設`)、`網絡`(台用`網路`)、`智能`(台用`智慧`)…命中即 FAIL。**`大陸` 的唯一 operative 比對規則(修 red-team r57/r58:單一定義、可實作)**:採「前綴相鄰」(非 proximity)——`大陸` 命中,**除非其緊接在 landmass 白名單前綴之後**(語言 team 維護的清單:`亞洲/歐亞/非洲/美洲/北美/南美/歐洲/大洋/南極/澳`…,開放可增補)才放行;`中國大陸` 無條件 FAIL(`中國` 非 landmass 前綴)。此為**唯一**定義,上方 denylist 列舉不另立封閉例外集。**紅隊案例**:deny 於 bare `大陸`、deny 於 `中國大陸`、**allow 於 `亞洲大陸`/`歐亞大陸`/`北美大陸`**、deny 於簡體或其他 PRC 詞、allow 於乾淨文本;`guards.js`/design-consistency 無回歸(無 MCQ,mcq gate N/A);**R9 無外部資產(修 r28;patterns 修 r29-C;scope 修 r31;白名單+閉包 修 red-team G3)**:掃**本功能自身資產**——`english_dictation.html` 自身 markup + inline `<style>` + 本 build 產出的 `dictation.js`/`dict_data_*.js` + 功能 CSS `dictation.css`(承載 `dct-*`,§9)——是否引用外部來源資產:比對 `<link href>`/`<script src>`/`@import`/CSS `url()`/JS `fetch(`/`new URL(`/`import(` 的 URL,凡 host 為外部(`https?://<host>`,或 protocol-relative `//<任意 host>`——**不只 `//cdn`**)即 FAIL;**另外兩道(修 red-team G3)**:(a') **頁面可載入資產白名單**——`english_dictation.html` 的 `<script src>`/`<link href>`/`@import` 目標只能屬 {`assets/app.css`, `game_core.css`, `game_core.js`, `assets/srs_engine.js`, `dictation.css`, `dictation.js`, `dict_data_*.js`} + `audio/*.mp3`,出現任何其他檔(含新增的本地 `<script src="dict_helper.js">`)即 FAIL;(b') **掃描範圍=頁面實際載入之本功能本地檔的遞移閉包**(非固定清單)——防「新增本地檔、裡面 `fetch('https://…')` 躲過固定清單掃描」;**允許** `data:` URI 與 SVG/XML 命名空間字面(`http://www.w3.org/...` 的 `xmlns`/`xlink`,非網路資產,**不得誤擋**);確定性、fail-closed。**共用 house 層 `game_core.js`/`game_core.css` 不在本 gate 的外部資產掃描範圍**(全站既有基礎設施、由站級政策治理,非本功能 build 產物)——**但排除 `game_core.css` 以「它不含任何 `dct-` 選擇器」為條件,且此條件由本 gate 強制(修 r33)**:assert `game_core.css` **與 `assets/app.css`** 內**各零個 `\.dct-` 前綴選擇器**(修 r34-A:兩個頁面載入的 house CSS 都要守,否則 app.css 成為同類躲藏點),任一命中即 FAIL(確定性、fail-closed;紅隊:注入 `.dct-x{background:url(https://…)}` 到任一檔須 deny、現況兩檔皆 0 命中須 allow),如此「排除」才不會淪為外部引用的躲藏處。**已知站級例外**:`game_core.js` 的 Ko-fi 贊助 FAB 載入外部圖 `storage.ko-fi.com/...`,屬全站既有、不因本功能新增;故 R9 對本功能的保證 = 「**聽寫功能自身不新增任何外部執行期依賴**」,house 層既有外部元素不在此 gate 否決之列;**R10 store-key 隔離(修 r28;集合判定修 r29-A;house 豁免修 r30)**:`dict_` 前綴 + 不相撞 assert **僅適用於聽寫引擎 `dictation.js` 自身寫入的 key**——assert 這些皆 `dict_` 前綴且屬 §7 列舉的合法集(SRS store 文法 ∪ `dict_{series}_accent_v1` ∪ `dict_{series}_scaffold_v1` ∪ `dict_{series}_hints_v1` ∪ `dict_{series}_done_v1`);**SRS store key 另需** per series/level/day/mode 唯一(聚合/狀態 key 不套此維度),且不與他頁(如 `cefr_flashcard`)相撞。**共用 `game_core.js` 寫入的 house key(`ui_theme`、`player_profile_v1`、暫態 `_game_test`)刻意跨頁共享、豁免此規則**(§8/R6 必載的 🌙 主題與 HUD XP 本就寫它們;`player_profile_v1` 為全站 XP profile,共享非相撞)。
3. **音檔 gate(R4)**:§6 的 (a)–(e)——存在/可解碼/text_sha 綁定(b1 stale+b2 見證)/slug 1:1/抽樣實聽/**檔數==build 記錄的預期數(e)**;**另檢** `audio/_unlock.mp3` 存在且可解碼(它免 edge-tts/manifest,見 §1 R4 例外 + §4.3)。
4. **render gate(R7)+canvas 功能(R8,iPad-13)**:portrait+landscape **外加三最壞態**:例句多行畫布、鷹架全開(中文+首字母)、文字 fallback 且虛擬鍵盤開啟(佔~45% 高仍可達控制列);截圖開 PNG 目視。**R8 功能驗(修 r28)**:以 `pointerType=touch`(手指)與 `mouse` 實際落筆,確認筆跡渲染;按「清除」確認畫布清空;各截圖佐證(非只看版面,須證手指/滑鼠與 Pencil 同等可寫+清除)。
5. **內容正確性(R1/R5)**:系列 B **出貨週 100% 對書**逐字(加碼集抽驗);系列 A 例句經 native+語言學+學習科學 lens 審;**自寫欄(syll/ipa/zh + `ukSpelling`)經語言 team 審**(書上沒有,不能只對書)——**`ukSpelling` 尤其關鍵(修 r49)**:它是 authored、書中無 UK 形可對,卻以「兩種皆算對」呈現給孩子(§2.1),屬 R1 拼字正確性 BLOCKER,必須納入此複審(「100% 對書」抓不到、OPEN-D 的對書複核也抓不到書裡沒有的 UK 拼法);`pos` 目前 reveal 未用,待啟用再納審。**CEFR A 期單字(word-only,無書可對,修 cefr_spec_check MINOR2)**:字源為 committed 站內字表 `src/cefr_words_{LV}.json`(provenance 可追溯)+ 語言 team 拼字 sanity pass;「對書」N/A(CEFR 無單一書)。**CEFR 例句(B 期)** 同系列 A 例句:經 native+語言學+學習科學 lens 審 + 繁中 translator 審 zh。
6. **code-download(R12)**:乾淨解壓依 README 可 build;**rebuild 等價性**——diff 重建輸出 vs 已部署站的 **item id 等價集(= 全部 `src/dict_items_*.json` 的 id 聯集;d5 複習卡為引擎執行期合成、不列入,見 §4.3)** + 每個被引用音檔鍵,須一致(非只「能 build」);**rebuild 一律讀版控快照 `src/dk_index_us.json`,不抓 live CloudFront(修 r51)**——否則 id-set 由 live text 衍生會非確定、等價比對失真;**rebuild 允許清單**:clean rebuild 樹必含版控靜態資產 `audio/_unlock.mp3`(由 bundle 帶入、不重生),缺即 FAIL——此檔不列入 edge-tts 等價比對但列入存在性檢查;README/requirements 釘死 `edge-tts==7.3.1` + 兩 voice。
7. **house consistency(R6)**:視覺/結構與全站一致。
8. **R3 不批改驗證(修 r27→移進週期性 gate;correct+wrong 修 red-team G2;靜態掃描+全模態 修 red-team G2-residual)**——兩道:
   - **(8a) 語意碼掃描(主防線,fail-closed;exhaustiveness 修 red-team G2-residual)**:掃**本功能所有頁面可達的 JS**(`dictation.js` + §10.2 (b') 遞移閉包,**非只 dictation.js**),**不得存在任何「以使用者輸入是否正確為條件」的分支**。**這是語意規則,下列僅非窮舉 pattern 例**:`=== answer`/`== answer`/`.localeCompare(answer)`/`typed===`/`input==`、`.includes(answer)`/`.indexOf(answer)>=0`、編輯距離(`lev(typed,answer)<k`)、hash 比對(`sha(typed)===sha(answer)`——不含字面 `answer` token)、長度比對、canvas 像素 / ML 辨識比對(可能完全無 `answer` token)…**凡讀使用者輸入並據以判對錯的分支皆 FAIL**。理由:§0.2/§1 R3 規定程式**一律不判定答案對錯(任何輸入皆然)**,故根本不該有此類碼;語意規則擋住它,**不受「單次行為測試是否剛好觸發」或「pattern 是否字面命中」影響**——連帶堵 cumulative/連擊/音效/觸覺型回饋(皆必讀對錯狀態)。紅隊:注入 `if(typed===answer)` 或 `if(lev(typed,answer)<2)` 須 deny、現況無任何對錯條件碼須 allow。(house 檔 `game_core.js`/`srs_engine.js` 站級、不在本掃描;其若夾帶對錯回饋,由 8b 的使用者可感結果兜底。)
   - **(8b) 行為驗證(backstop)**:於**手寫**與**鍵盤 fallback** 各輸入「完全正確」與「錯字」兩種(共 4 種情況),確認四種揭曉後**都只出現正解 + 三級自評**,**無任何對錯回饋於任一模態**——視覺(✓/✗、對/錯字樣、紅綠對錯色、字串比對後的視覺)、**音效**(「答對」鈴聲)、**觸覺**(haptic)、以及**累計/連擊**型肯定皆不得出現(即使不進 SRS 也不行,§0.2/§1 R3)。四種情況各截圖(音效/觸覺另記)佐證。**8b 為 8a 無法靜態捕捉者的使用者可感兜底**(像素/ML 比對、house 檔夾帶):任一模態出現對錯回饋即 FAIL。
   每個聽寫頁每輪必跑——否則 R3 這條核心誠實鐵律無 gate 守,日後迴歸加對錯回饋會躲過全部其他 gate。

---

## 11. 合法性（立場）

- **系列 A**:開放授權字表 + 自寫例句 + 自產音檔 → 零版權風險;EVP/Oxford 僅線上對照不匯入。
- **系列 B（使用者 2026-10-25 定案接受公開；誠實記載風險）**:
  - 個別單字是事實、不受著作權保護(Feist)。
  - **但本系列刻意鏡射 DK 的「52 週 × day1–4」選字與編排**(這是產品核心——家長要照書逐週督促孩子),而**原創的選材/協調/編排**在 Feist 下可與個別事實分開受「彙編(compilation)著作權」保護。故「單字是事實」**不足以**涵蓋「鏡射其週結構」;這是真實但使用者已評估接受的風險。
  - **使用者立場(定案)**:擁有該書、為自己孩子對照該書練習、明確接受公開;**不因此改成重新排序**(重排會破壞對照book的用途)。
  - 故 DK 衍生資料(`dict_data_dk.ts` + 自產音檔)比照全站**公開部署 + 入 git + 進 bundle**。維持:**只取單字文字**,**不重製** DK 的例句/插圖/編排說明文字/插圖/音檔(那些是另一層創作表達);若 DK 日後要求下架,移除 `dict_data_dk.*` 即可(引擎與系列 A 不受影響)。
- **取字管道**:只取**公開靜態 CloudFront CDN**;**不破解** dk5words.com 的反機器人(不同主機)。

---

## 12. 決策狀態

### 已鎖定（LOCKED 2026-10-25）
- 手寫=basic canvas(§3,R8);範圍=兩系列,**DK 優先**;系列 A 基礎=CEFR-J+NGSL/AWL+沿用站內 A1–B1,例句自寫。
- 音檔=edge-tts native 成人,us=AriaNeural/gb=SoniaNeural,兩腔(§5.4)。
- **練習單元=「天」(5 字)為預設 session**;週格展開 day1–5,day5=該週 20 字複習(§7)。
- 取字=公開 CloudFront US 版;**書寫目標 US + 分歧字 reveal 並列 US/UK、皆算對**(§2.1/§4/§5.3)。
- DK 資料**接受公開**部署+bundle(§11)。
- 頁面形態=**單一 `english_dictation.html` hub**。慢速音檔=例句軌提供、單字軌免;IPA 預設關可開。

### 系列 A 分期（OPEN-C 定案 2026-10-25：分兩期，不擋 DK）
- **OPEN-C 定案**:系列 A 分兩期做——
  - **A 期(單字軌,先做)**:**A1–B1 沿用站內現有 CEFR 字表(`vocab_data_cefr_{a1,a2,b1}.js` 的 `word` 欄,只取字=事實,不取其 definition/sentence——memory 記其定義品質不佳)**;B2–C2 待 NGSL/AWL sourcing（延後）。此期**無例句**,機制與 DK 單字軌相同(reuse 引擎/pipeline/gate)。
  - **B 期(例句軌,後做)**:每級自寫例句(spec-default 每級 ~150),經 §10.5 的 6-lens team(native/語言學/學習科學/…)審;逐詞播放 wordTimings(§2.3/§5.4)。此期才涉大型 authoring,屬延後、需使用者對 scope 拍板。
- **CEFR build(修 OPEN-C)**:`tools/build_cefr_data.py`(平行 build_dk_data)——讀**版控 `src/cefr_words_{LV}.json`**(words only,從站內字表抽出、committed→R12 可重生)+(B 期)`src/dict_authored_cefr.json`(sentence/zh/syll/ipa/pos,keyed by `authKey`)→ 出 `src/dict_data_cefr_{LV}.ts`(→`window.DICT_CEFR`)+ 合併進**單一 per-series sidecar `src/dict_items_cefr.json`**(含全 6-key `meta.expectedAudioCount`:word_us/gb=相異 word slug 數;sent_*=B 期才>0)。word 軌 level=`cefr-{lv}`、day=`na`;audioSlug=word 正規化;檔名 `word_dict_cefr_<slug>_<accent>.mp3`。slug 碰撞覆寫走 per-series `src/dict_slug_overrides_cefr.json`(§4.1)。**build assert(修 cefr_spec_check MINOR3)**:day='na' 均一,故 id 唯一性靠「**每級內無重複字**」——build 以 authKey(`level::na::word::<word>`)唯一 + slug 1:1 + 反向唯一斷言之(同級重複字 → authKey 碰撞 → fail-closed,比照 DK 的 intra-week/authKey assert)。例句軌 sent item:word=整句、audioSlug=hash(句)、kind='sent'、4 音檔鍵(us/gb×正常/slow);wordTimings 由 `gen_dict_audio` 的 edge-tts **WordBoundary**(需 `boundary="WordBoundary"`)擷取、回填 `src/cefr_wordtimings.json`,build 併入 dict_data。音檔/gate 一律複用既有 `gen_dict_audio.py`/`dict_audio_gate.py`(讀 `.items` 聯集,逐 series 計數)。
- (原 OPEN-C 預設〔每級 ~150 + 等量例句〕降為 B 期的參考上限。)
- **OPEN-D(資訊,非 blocker)**:`src/dict_us_uk.json` 的**存在/位置/格式已定**(§9,版控 authored input);**開放的僅是其字集涵蓋範圍**——build 期掃描 DK 資料列出所有分歧字候選後,請使用者對書複核/增補該 committed 檔一次(非其是否存在)。

---

## 13. 下一步（SOP）
1. 本 spec content_audit 到 **5 consecutive clean**(coverage-validated + L3)。
2. **紅隊**:對 R1–R12 + §10 DONE-GATE,每條設計壞案例(須被擋)+ 好案例(須過),尤其 R3/R4/R5/R7/R8。
3. 紅隊過 → 依 §9 實作(先 DK 單字日軌),逐頁走 §10 DONE-GATE;每階段 commit 可 rollback;push 達零問題才做(K-12 ship-gate)。

---

## 14. 跨-session SOP 強制機制（已建置並紅隊 PASS，勿刪）

三環節(與站內 audit-sop/book-authoring-sop 同機制,每 session 必達):
1. **always-load 規則檔** `~/.claude/rules/dictation-sop-do-not-delete.md`(此資料夾每 session 自動載入系統提示;證據=同資料夾他檔出現在本 session 提示)。
2. **每回合 carrier echo** `~/.claude/hooks/inject-sop-carriers.py` 的 `[dictation-sop]` 行(UserPromptSubmit;fail-open exit 0)。
3. **MEMORY 指標** `memory/MEMORY.md` → `dictation-series-plan.md`。

**紅隊(2026-10-25)**:(a) carrier 印出 `[dictation-sop]`、exit 0;垃圾 stdin 仍 exit 0。(b) 規則檔在 `~/.claude/rules/`(與每-session-必載檔同環節)。(c) spec 單一事實來源存在,carrier/規則檔同指該路徑。(d) **全新 agent(prompt 不提 SOP)自行複述出 SOP + R1–R12**。**勿刪/勿弱化**這三環節。

---

## 15. 實作順序（紅隊通過後）
1. **抓 CloudFront index 一次、commit 成版控快照 `src/dk_index_us.json`(修 r51)**;`tools/build_dk_data.py` 讀**該快照**(非 live)→ `src/dict_data_dk.ts` + `src/dict_items_dk.json` sidecar(52 週 day1–4 + 加碼;US + `ukSpelling`)。日後要更新 DK 資料 = 刻意重抓覆寫快照並重審對書,不在 rebuild 路徑。
2. `src/dictation.ts` 引擎 + `english_dictation.html` hub(先 DK 單字日軌)→ build → iPad render gate(含最壞態)+ 自測。
3. `tools/gen_dict_audio.py` 產 DK 音檔(us+gb)+ manifest → 音檔 gate。
4. **每輪跑完整 §10 DONE-GATE**(非只下列子集;修 r40):content_audit(DK 資料+頁面)到 house N-clean;**item 2 free gates(簡體掃描 + R9 外部資產 + R10 store-key)**;**item 3 音檔 gate (a)–(e)**;**item 4 render+R8 canvas 功能**;**item 8 R3 不批改驗證(8a 靜態碼掃描 + 8b 行為,每輪必跑,見 §10 item 8——不得留到 step 6,否則對錯回饋迴歸會躲過整個收斂過程)**;出貨週 100% 對書(item 5)。
5. 系列 A:CEFR 字表 + 自寫例句(team)→ 同流程。
6. downloads bundle + index 入口 + 全站 house 一致 → 整體 DONE-GATE。

> 稽核起點(r19+):v0.2 + r17/r18 fixes 已套用。請以 implementer dry-run 心態驗:(i) per-series sidecar 聯集在 §4.3/§6/§10.3/§10.6 是否處處一致、無殘留單一 `dict_items.json` 字樣;(ii) per-series `src/dict_slug_overrides_{dk,cefr}.json`(§4.1)的套用時機/assert 是否可重現且與 `authKey`(§4.2)不互相矛盾;(iii) day5 既「不入 sidecar」又「有 id、存 day5 store、算完成度」是否全章自洽(§4.3/§7/§9.1);(iv) `audio/_unlock.mp3` 在 R4 例外/§2.5/§4.3/§9 bundle/§10.3 gate/§10.6 R12 allowlist 六處是否一致、無漏洞(尤其「clean rebuild 無此檔卻 gate 過」是否確實被堵);(v) bonus dailyNew/done/dot(§7)與 day5 drill 的機制差異是否清楚;(vi) 任何規範可被實作悄悄繞過之處。
