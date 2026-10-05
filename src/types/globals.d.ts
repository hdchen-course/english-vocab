/* 全站共用 ambient 型別 — 給逐檔 TS 遷移的 legacy 檔共用，少寫 `as any`。
 * 這些是「全站契約」的最小型別化；介面簽名以現有 .js 的實際行為為準，不得擅改。
 * 遷移過程會逐步補強欄位（寬鬆 legacy config 下，缺的欄位先用寬型別）。 */

/** vocab_data_*.js 的單字資料形狀（cefr/coca/yle/toeic/gept/competition 共用）。 */
interface Word {
  word: string;
  chinese?: string;
  definition?: string;
  sentence?: string;
  [k: string]: unknown;
}

/** 一個單字牌組（vocab_data_*.js 內 `WORD_DATA["key"] = {...}` 的值）。 */
interface WordDeck {
  name: string;
  color: string;
  /** 填空（cloze）型牌組：題目把句子的目標字挖空。 */
  isCloze?: boolean;
  words: Word[];
  [k: string]: unknown;
}

/**
 * 全部 vocab_data_*.js（cefr a1/a2/b1、coca L1–L10、yle movers/flyers、toeic、
 * gept_elementary、competition mid/upper）共用的頁面全域字典，鍵＝牌組 id。
 * 由各 flashcard 頁的 inline `<script>var WORD_DATA = {}</script>` 宣告，資料檔只做
 * `WORD_DATA["key"] = {...}` 填值。屬「自動產生的純資料檔」——source-of-truth 是其
 * 產生器、會送到使用者（效能），依資料檔政策不經 tsc 轉檔，只在此宣告型別。
 */
declare var WORD_DATA: Record<string, WordDeck>;

/** concept_engine.js 讀的頁面教學資料（各 *_concepts.html 定義 window.CONCEPT）。 */
interface ConceptLessonStep {
  type: 'teach' | 'quiz';
  kicker?: string;
  title?: string;
  svg?: string;
  text?: string;
  eq?: string;
  /** 動畫 teach 步驟：收 .cn-svg 容器，回傳清理「函式」或 window.Anim 場景的 { stop } 物件
   *  （concept_engine.runCleanup 兩種都接受；turnkey 寫法回傳 function(){h.stop();}）。 */
  mount?: (host: HTMLElement) => (() => void) | { stop: () => void } | void | null;
  options?: string[];
  answer?: number;
  why?: string;
  whyWrong?: Record<number, string>;
}
interface ConceptLesson {
  id: string; name: string; emoji?: string; color?: string; sub?: string; done?: string;
  steps: ConceptLessonStep[];
}
interface ConceptConfig {
  progKey: string;
  practiceHref?: string;
  lessons: ConceptLesson[];
}

/** anim_core.js 導出的動畫場景（window.Anim）。 */
interface AnimApi {
  reducedMotion: () => boolean;
  earthRevolution: (host: HTMLElement) => { stop: () => void };
  earthSeasons: (host: HTMLElement) => { stop: () => void };
  moonPhases: (host: HTMLElement) => { stop: () => void };
  circuitFlow: (host: HTMLElement) => { stop: () => void };
  buoyancyFloat: (host: HTMLElement) => { stop: () => void };
  reactionRebond: (host: HTMLElement) => { stop: () => void };
  vectorAdd: (host: HTMLElement) => { stop: () => void };
  fractionEquiv: (host: HTMLElement) => { stop: () => void };
  statesOfMatter: (host: HTMLElement) => { stop: () => void };
  waterCycle: (host: HTMLElement) => { stop: () => void };
  photosynthesis: (host: HTMLElement) => { stop: () => void };
  /** 函數描點／連線（線性＋二次共用一座標引擎）。cfg = {kind,m,b|a,b,c,highlight,label}。 */
  funcPlot: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 直角三角形三角比（SOH-CAH-TOA）。cfg = {angleDeg,show,label}。 */
  trigTriangle: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 長條／直方圖動畫長高（math-stats + core data-literacy 共用）。
   *  cfg = {values[],labels[],mode:'histogram'|'bar',misleadAxis,yStart,toggle,callouts[],unit,label}。 */
  barGrow: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 盒鬚圖：排序→框五數→畫盒鬚（本頁專用）。cfg = {data:number[]|number[][],showIQR,label}。 */
  boxplotBuild: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 散布圖與相關趨勢（math-stats + core data-literacy 共用）。
   *  cfg = {points[],r:'pos'|'neg'|'none',showLine,confound:{label,on},xLabel,yLabel,label}。 */
  scatterTrend: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 論證聚光燈：把論證拆成兩框，中間標紅「斷裂處」（非形式謬誤／論證結構共用）。
   *  cfg = {type:'strawman'|'adhominem'|'appeal'|'generic',left:{label,text},right:{label,text},breakLabel,panels[],title,label}。 */
  fallacySpotlight: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 論證流：前提卡 → 結論卡。演繹用實線鎖鏈箭頭（必然）、歸納用虛線箭頭（很可能）
   *  並可 counter.on 浮現反例（黑天鵝）把結論打叉；highlightIndicators 標「因為/所以」
   *  指示詞（演繹 vs 歸納／論證結構／事實 vs 意見三 spec 共用；author-once）。
   *  cfg = {premises:[{text}],conclusion:{text},mode:'deduction'|'induction',
   *         counter:{text,on},highlightIndicators,label}。 */
  argFlow: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 公平測試・變因控制對照實驗：左右兩組並排，高亮操縱變因、灰標控制變因、底部長條顯示應變變因；
   *  mode:'fair'（只改一個→可歸因）vs 'unfair'（同時改多個→分不清）。科學方法頁與未來各科實驗課共用。
   *  cfg = {mode:'fair'|'unfair',changed:['名稱:A|B'],controlled:['名稱:值'],measure,values:[a,b],groups,title,label}。 */
  fairTest: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 溫室效應：短波陽光穿過大氣→地面升溫→放出長波紅外線→部分被溫室氣體攔截放回地面；
   *  溫室氣體越多留住越多熱（溫度計上升）。cfg = {gas:'low'|'high',caption?,label?}。
   *  科學鐵則：吸收地面放出的紅外線，不是擋住進來的陽光；與臭氧洞無關。永續＋氣候課共用。 */
  greenhouseEffect: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 碳循環：光合吸碳 ↔ 呼吸/分解放碳 ↔ 海洋吸收/釋放（自然大致平衡）；
   *  emphasis:'human' 另加燃燒化石燃料把地底碳放回大氣、CO₂ 累積打破平衡。
   *  cfg = {emphasis:'natural'|'human',caption?,label?}。永續頁＋tier0 生物碳循環共用。 */
  carbonCycle: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 複利/定期定額成長（grow）與卡債滾大（debt）共用場景（理財真實世界頁 author-once）。
   *  以 principal 起、依年利率 ratePct 逐月複利（可每月 contribute 定額投入），長條逐月升高；
   *  mode:'grow' 用 --su 色、mode:'debt' 用 --c-wrong 紅色。reduced-motion 畫 4 具名月份靜態。
   *  cfg = {principal,ratePct,periods,contribute,mode:'grow'|'debt',unitLabel,title,caption,label}。 */
  compoundGrowth: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 世界地圖定位：風格化扁平世界（七大洲 --su tint 色塊＋海洋淺底，★無國界/無爭議疆界名稱），
   *  依序在 pins 位置掉下定位針並脈動光環，建立相對位置感；cycle 時輪流重新定位；
   *  reduced-motion 一次畫全部定位針靜態幀。世界時事／世界地理／全球議題三頁共用（author-once）。
   *  cfg = {pins:[{region?,xFrac,yFrac,label}],caption?,cycle?,label?}（xFrac/yFrac＝地圖繪製區 0–1）。 */
  worldLocator: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 位值與大數讀寫：每位數字對齊位值欄（個/十/百/千/萬…），四位一節點逗號分 個級/萬級/億級 並示範國字讀法。
   *  cfg = {number:(number|string, 最多 16 位), label?}。數學觀念頁（位值/大數）用。 */
  placeValue: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 參數化數線：mode:'plain' 一般標刻；'round' 一個數滾向較近整十/整百示意四捨五入；'negative' 正負方向＋乘負數翻向。
   *  cfg = {min,max,ticks(刻度間距),marks,highlight,mode,label,value,roundTo,flip:{from,to,label?}}。位值/概數＋負負得正共用。 */
  numberLine: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 一個數的四種臉：10×10 百格塗滿 num/den，同步在四個讀數框顯示 分數 n/d＝小數＝百分比＝比 a:b（比/分數顯簡化式）。
   *  cfg = {num,den,label}。數學國小觀念頁（百分比/比）用。 */
  partWhole100: (host: HTMLElement, cfg?: any) => { stop: () => void };
  /** 參數化立體：mode:'fill' 底面疊層＝底面積×高（錐倒水示意＝柱的 1/3）；mode:'unfold' 攤平成展開圖＝各面面積和（柱側面長＝底周長；球攤成 4 大圓）。
   *  cfg = {shape:'prism'|'cylinder'|'cone'|'sphere', mode:'fill'|'unfold', label}。幾何體積/表面積頁用。 */
  solid3D: (host: HTMLElement, cfg?: any) => { stop: () => void };
}

/** game_core.js 導出的遊戲核心 API（window.Game）。遷移 game_core 時逐步精確化。 */
interface GameApi {
  recordAnswer: (...a: unknown[]) => unknown;
  award: (...a: unknown[]) => unknown;
  recordSession: (...a: unknown[]) => unknown;
  pingActive: () => void;
  awardBadge: (...a: unknown[]) => unknown;
  getProfile: () => any;
  getBadgeWall: () => any[];
  on: (evt: string, fn: (...a: unknown[]) => void) => void;
  off: (evt: string, fn: (...a: unknown[]) => void) => void;
  showToast: (msg: string, kind?: string) => boolean;
  reset: (scope?: string) => void;
  setTheme: (t: string) => void;
  toggleTheme: () => void;
  getTheme: () => string;
  updateHud: () => void;
  setProfileField: (key: string, value: unknown) => void;
  spendCoins: (amount: number, itemId?: string) => boolean;
  CONFIG: Record<string, unknown>;
  SUBJECTS: string[];
  EVENTS: string[];
  levelForXp: (xp: number) => number;
  levelInfo: (xp: number) => any;
  rankForLevel: (lv: number) => any;
  localDate: (d?: any) => string;
}

/** speaking_data.js（自動產生的分級口說跟讀資料；source-of-truth 是其產生器，不經 tsc 轉檔）。 */
interface SpeakingData {
  voice: string;
  units: Array<{
    key: string; label: string; emoji?: string; type?: string; sub?: string;
    levels: Array<{ name: string; sub?: string; items: any[] }>;
  }>;
}

interface Window {
  Game?: GameApi;
  CONCEPT?: ConceptConfig;
  Anim?: AnimApi;
  SPEAKING_DATA?: SpeakingData;
}
