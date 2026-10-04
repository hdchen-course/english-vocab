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

/** concept_engine.js 讀的頁面教學資料（各 *_concepts.html 定義 window.CONCEPT）。 */
interface ConceptLessonStep {
  type: 'teach' | 'quiz';
  kicker?: string;
  title?: string;
  svg?: string;
  text?: string;
  eq?: string;
  /** 動畫 teach 步驟：收 .cn-svg 容器、回傳清理函式（anim_core）。 */
  mount?: (host: HTMLElement) => { stop: () => void } | void | null;
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
  localDate: () => string;
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
