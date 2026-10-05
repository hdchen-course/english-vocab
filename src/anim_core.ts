/* =====================================================================
 * anim_core.ts  →  (tsc) →  anim_core.js
 *
 * 共用「程式碼生成動畫」引擎。設計與 game_core.js / concept_engine.js 一致：
 *   - 零 runtime 相依、純 <canvas> + requestAnimationFrame。
 *   - 掛在 window.Anim；各 *_concepts.html 的 teach 步驟用 mount(host) 呼叫。
 *   - 尊重 prefers-reduced-motion：比較型場景畫「四格並排靜態」保留跨狀態對比，
 *     其餘畫單一代表性靜態幀、不跑迴圈。
 *   - 分頁切背景（document.hidden）自動暫停，省電。
 *   - 播放節制：播 N 輪自動停在最後一幀，角落一顆「🔁 重播」鈕（絕對定位、不改版面高度）。
 *   - 關鍵狀態停留（dwell）：比較型場景在 4 個具名狀態各停 ~1.3s，讓孩子看清楚。
 *   - 色彩：UI/座標軸/標籤讀所在頁的 --su 主題色（各科識別色一致）；
 *     但天體本身（太陽黃、地球藍綠、月球灰）用自然色＝科學正確性優先。
 *
 * 契約：每個 scene factory 收 host 元素（concept_engine 的 .cn-svg 容器），
 *       回傳 { stop() }，concept_engine 換頁前會呼叫 stop()。
 * =================================================================== */
(function () {
  'use strict';

  // ---- 共用小工具 -----------------------------------------------------
  function reducedMotion(): boolean {
    try {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  }

  /** 讀 :root 的 CSS 自訂屬性，trim 後回傳；空值用 fallback。 */
  function cssVar(name: string, fallback: string): string {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name);
      v = (v || '').trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  /** 當前頁主題色（各科 --su）；地科等未設 --su 的頁給一個中性藍。 */
  function themeColor(): string { return cssVar('--su', cssVar('--c-science', '#2d7dd2')); }
  function inkColor(): string { return cssVar('--ink', '#2b2b36'); }

  function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // 天體自然色（固定，不隨主題；科學正確性）。
  var SUN = '#f6b73c', SUN_GLOW = 'rgba(246,183,60,0.35)';
  var EARTH_SEA = '#3a7bd5', EARTH_LAND = '#4caf72';
  var MOON_LIT = '#f3f1e9', MOON_DARK = '#6b6f7a';
  var AXIS = '#e74c3c';   // 地軸＝紅線（與原靜態 SVG 一致）

  // ---- 共用執行器：生命週期、DPR、重播鈕、dwell、reduced-motion -----------
  interface SceneCfg {
    /** 連續型場景：一輪時長（毫秒）。有 keyStates 時改用 segMs/dwellMs。 */
    durationMs: number;
    /** 自動播幾輪後停在最後一幀。 */
    loops: number;
    /** 每幀繪製；phase 為 0..1（本輪進度），loopsDone 為已完成輪數。 */
    draw: (g: CanvasRenderingContext2D, phase: number, w: number, h: number) => void;
    /** reduced-motion 時畫的代表性靜態 phase（0..1）。 */
    staticPhase: number;
    /** 無障礙描述（更新 canvas aria-label）。 */
    label: string;
    /** 重播鈕文案（預設「🔁 重播」）。 */
    replayText?: string;
    /** 比較型場景的 4 個具名狀態 phase（如 [0,.25,.5,.75]）；給了就會在每個點停留。 */
    keyStates?: number[];
    /** 相鄰具名狀態之間的移動時間（毫秒）。 */
    segMs?: number;
    /** 每個具名狀態停留時間（毫秒）。 */
    dwellMs?: number;
    /** reduced-motion 覆寫：畫「四格並排靜態」以保留跨狀態對比（比較型場景用）。 */
    drawStatic?: (g: CanvasRenderingContext2D, w: number, h: number) => void;
    /** 可互動場景：游標顯示為 pointer、canvas 收 click（點擊即停住自動播放，交給場景狀態）。 */
    interactive?: boolean;
    /** 點擊 canvas 的回呼：收邏輯座標 (x,y) 與 redraw()（重畫目前靜止幀，供場景改狀態後刷新）。 */
    onClick?: (x: number, y: number, redraw: () => void) => void;
    /** 每次播放（含重播）開始前重置場景狀態的回呼。 */
    onReplay?: () => void;
  }

  function runScene(host: HTMLElement, cfg: SceneCfg): { stop: () => void } {
    var canvas = host.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return { stop: function () {} };
    var ctx = canvas.getContext('2d');
    if (!ctx) return { stop: function () {} };
    var g = ctx;

    // 邏輯尺寸取自 canvas 的 CSS 盒；backing store 乘上 DPR 以求清晰（手機放寬到 3x）。
    var cssW = canvas.clientWidth || canvas.width || 300;
    var cssH = canvas.clientHeight || canvas.height || 170;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (cfg.label) canvas.setAttribute('aria-label', cfg.label);

    // 一輪總時長：有具名狀態時 = 段數 ×（移動 + 停留）。
    var keys = cfg.keyStates || null;
    var segMs = cfg.segMs || 1200;
    var dwellMs = cfg.dwellMs || 1300;
    var loopMs = keys ? keys.length * (segMs + dwellMs) : cfg.durationMs;
    var finalPhase = keys ? keys[0] : 1;

    /** 把一輪內的時間 t（0..loopMs）換成 phase（0..1），含每個具名狀態停留。 */
    function phaseAt(t: number): number {
      if (!keys) {
        var tl = t / cfg.durationMs;
        return tl - Math.floor(tl);
      }
      var unit = segMs + dwellMs;
      var i = Math.floor(t / unit) % keys.length;
      var tt = t - Math.floor(t / unit) * unit;
      var startP = keys[i];
      var endP = (i + 1 < keys.length) ? keys[i + 1] : (1 + keys[0]);
      var p: number;
      if (tt < dwellMs) {
        p = startP;                                   // 停在這個具名狀態
      } else {
        var pr = easeInOut((tt - dwellMs) / segMs);   // 緩動移到下一個狀態
        p = startP + (endP - startP) * pr;
      }
      return p % 1;
    }

    var raf = 0;
    var start = 0;
    var stopped = false;
    var finished = false;   // 已播完 N 輪、停在最後一幀

    function frame(now: number) {
      if (stopped) return;
      if (!start) start = now;
      var elapsed = now - start;
      var totalLoops = elapsed / loopMs;
      if (totalLoops >= cfg.loops) {
        // 停在最後一幀。
        g.clearRect(0, 0, cssW, cssH);
        cfg.draw(g, finalPhase, cssW, cssH);
        finished = true;
        showReplay();
        return;
      }
      var tInLoop = elapsed - Math.floor(totalLoops) * loopMs;
      var phase = phaseAt(tInLoop);
      g.clearRect(0, 0, cssW, cssH);
      cfg.draw(g, phase, cssW, cssH);
      raf = requestAnimationFrame(frame);
    }

    function play() {
      finished = false;
      start = 0;
      if (cfg.onReplay) cfg.onReplay();
      hideReplay();
      if (reducedMotion()) {
        // 不跑迴圈：比較型場景畫四格並排靜態，其餘畫一張代表性靜態幀。
        g.clearRect(0, 0, cssW, cssH);
        if (cfg.drawStatic) cfg.drawStatic(g, cssW, cssH);
        else cfg.draw(g, cfg.staticPhase, cssW, cssH);
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    // 分頁切背景自動暫停；回前景續播（除非已播完）。
    function onVisibility() {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
      } else if (!stopped && !finished && !reducedMotion()) {
        start = 0;
        raf = requestAnimationFrame(frame);
      }
    }
    document.addEventListener('visibilitychange', onVisibility);

    // 重播鈕（絕對定位於 host 角落，顯示/隱藏都不改版面高度）。reduced-motion 不顯示。
    var replayBtn: HTMLButtonElement | null = null;
    function ensureReplay() {
      if (replayBtn || reducedMotion()) return;
      replayBtn = document.createElement('button');
      replayBtn.type = 'button';
      replayBtn.className = 'cn-anim-replay';
      replayBtn.textContent = cfg.replayText || '🔁 重播';
      replayBtn.addEventListener('click', function () { play(); });
      host.appendChild(replayBtn);
    }
    function showReplay() { ensureReplay(); if (replayBtn) replayBtn.style.display = ''; }
    function hideReplay() { if (replayBtn) replayBtn.style.display = 'none'; }

    // 互動：點擊停住自動播放（凍結在最後一幀 / reduced-motion 靜態幀），交由場景狀態繪製；
    // redraw() 讓場景改完狀態後重畫目前幀（短效果如喇叭聲波可自跑一小段 requestAnimationFrame 呼叫它）。
    function redraw() {
      if (stopped) return;
      var ph = reducedMotion() ? cfg.staticPhase : finalPhase;
      g.clearRect(0, 0, cssW, cssH);
      if (reducedMotion() && cfg.drawStatic) cfg.drawStatic(g, cssW, cssH);
      else cfg.draw(g, ph, cssW, cssH);
    }
    var onClickH: ((e: MouseEvent) => void) | null = null;
    if (cfg.onClick) {
      onClickH = function (e: MouseEvent) {
        if (stopped) return;
        if (!finished && !reducedMotion()) {          // 第一次點擊：凍結自動播放，交給場景狀態
          if (raf) cancelAnimationFrame(raf);
          raf = 0; finished = true; showReplay();
        }
        var rect = canvas!.getBoundingClientRect();
        var sx = cssW / (rect.width || cssW), sy = cssH / (rect.height || cssH);
        var cx = (e.clientX - rect.left) * sx, cy = (e.clientY - rect.top) * sy;
        cfg.onClick!(cx, cy, redraw);
      };
      canvas.addEventListener('click', onClickH);
      if (cfg.interactive) canvas.style.cursor = 'pointer';
    }

    play();

    return {
      stop: function () {
        stopped = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        document.removeEventListener('visibilitychange', onVisibility);
        if (onClickH) { canvas!.removeEventListener('click', onClickH); canvas!.style.cursor = ''; }
        if (replayBtn && replayBtn.parentNode) replayBtn.parentNode.removeChild(replayBtn);
        replayBtn = null;
      }
    };
  }

  // ---- 繪圖小工具 -----------------------------------------------------
  function disc(g: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill();
  }
  function label(g: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size: number, align: CanvasTextAlign) {
    g.fillStyle = color;
    g.font = '600 ' + size + 'px system-ui, -apple-system, "Segoe UI", sans-serif';
    g.textAlign = align || 'center';
    g.textBaseline = 'middle';
    g.fillText(text, x, y);
  }
  /** 畫一個太陽圓盤（含光暈）＝取代 emoji，讓三個場景的太陽視覺一致。 */
  function sunDisc(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
    disc(g, x, y, r * 1.6, SUN_GLOW); disc(g, x, y, r, SUN);
  }

  /** 底部說明：短字置中；過長則自動縮字並靠左，永遠為右下角「重播」鈕保留空位，避免被蓋住。 */
  function bottomCap(g: CanvasRenderingContext2D, w: number, h: number, text: string, col: string, size?: number) {
    var s = size || 11.5;
    var fam = 'px system-ui, -apple-system, "Segoe UI", sans-serif';
    g.font = '600 ' + s + fam;
    var tw = g.measureText(text).width;
    if (tw <= w - 150) { label(g, text, w / 2, h - 11, col, s, 'center'); return; }
    var maxL = w - 94;
    while (tw > maxL && s > 8.5) { s -= 0.5; g.font = '600 ' + s + fam; tw = g.measureText(text).width; }
    label(g, text, 10, h - 11, col, s, 'left');
  }

  /** 入射角示意面板：固定寬度的平行陽光打在水平地面，太陽越高→光越集中（亮、熱）；
   *  越低→同樣的光攤在越大的地面（分散、涼）。這就是四季冷熱的「角度」成因。 */
  function incidencePanel(g: CanvasRenderingContext2D, cx: number, top: number, w: number, h: number, altDeg: number, ink: string, capOverride?: string) {
    var pad = 6;
    var groundY = top + h - 22;
    var gx0 = cx - w / 2 + pad, gx1 = cx + w / 2 - pad;
    var alt = altDeg * Math.PI / 180, s = Math.max(0.2, Math.sin(alt));
    var beamW = (w - 2 * pad) * 0.38;                      // 進來的光束寬度（固定＝同樣多的陽光）
    var foot = Math.min((w - 2 * pad) * 0.96, beamW / s);  // 落在地面的範圍＝光束寬 / sin(高度角)
    var fx0 = cx - foot / 2, fx1 = cx + foot / 2;
    var dx = Math.cos(alt), dy = Math.sin(alt);            // 由左上往右下
    // 光線長度：夾住上限，讓太陽與光線永遠留在面板框內（不會延伸壓到左邊的公轉圖）。
    var L = Math.min(h - 34, (w / 2 - pad) / Math.max(0.25, dx));

    // 把所有繪製夾在面板範圍內（低仰角時光線很斜，避免溢出）。
    g.save();
    g.beginPath(); g.rect(cx - w / 2, top, w, h); g.clip();

    // 地面。
    g.save(); g.strokeStyle = EARTH_LAND; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(gx0, groundY); g.lineTo(gx1, groundY); g.stroke(); g.restore();

    // 平行陽光（幾條）。
    g.save(); g.strokeStyle = SUN; g.lineWidth = 1.8; g.globalAlpha = 0.4 + 0.5 * s;
    var n = 4;
    for (var i = 0; i < n; i++) {
      var gxp = fx0 + foot * (n === 1 ? 0.5 : i / (n - 1));
      g.beginPath(); g.moveTo(gxp - dx * L, groundY - dy * L); g.lineTo(gxp, groundY); g.stroke();
    }
    g.restore();

    // 被照亮的地面範圍（亮帶）：越直射越窄越亮。
    g.save(); g.strokeStyle = SUN; g.lineWidth = 5; g.lineCap = 'round'; g.globalAlpha = 0.45 + 0.55 * s;
    g.beginPath(); g.moveTo(fx0, groundY); g.lineTo(fx1, groundY); g.stroke(); g.restore();

    // 太陽（光線的來源方向）。
    var sunx = cx - dx * L, suny = groundY - dy * L;
    sunDisc(g, sunx, suny, 5);

    // 說明文字靠左對齊（避開右下角的「重播」鈕，不被蓋住）。
    // 說明文字：優先用呼叫端給的（與季節標籤同一個離散來源，避免過場時字面互相矛盾）；
    // 沒給才由角度門檻推。
    var cap = capOverride || (altDeg > 65 ? '直射・集中' : (altDeg < 42 ? '斜射・分散' : '中等'));
    label(g, cap, gx0, groundY + 13, ink, 11, 'left');
    g.restore();
  }

  // ---- 國語（Chinese）cluster 共用小工具 --------------------------------
  /** 圓角矩形路徑（只建路徑；呼叫端自行 fill/stroke）。 */
  function rrectPath(g: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, r: number) {
    var rr = Math.max(0, Math.min(r, bw / 2, bh / 2));
    g.beginPath();
    g.moveTo(x + rr, y);
    g.arcTo(x + bw, y, x + bw, y + bh, rr);
    g.arcTo(x + bw, y + bh, x, y + bh, rr);
    g.arcTo(x, y + bh, x, y, rr);
    g.arcTo(x, y, x + bw, y, rr);
    g.closePath();
  }
  /** 設 label() 同款字體字串以便 measureText 量寬（量完由 label 自己重設）。 */
  function labelFont(g: CanvasRenderingContext2D, size: number) {
    g.font = '600 ' + size + 'px system-ui, -apple-system, "Segoe UI", sans-serif';
  }
  /** 圓角 chip：底＝col 半透明 tint（卡底仍透出→亮暗雙主題都安全，defect #28）、框＝col、內文＝textCol。 */
  function chipBox(g: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number,
    col: string, txt: string, textCol: string, fontSize: number, alpha: number) {
    g.save();
    g.globalAlpha = alpha * 0.14; g.fillStyle = col; rrectPath(g, x, y, bw, bh, 8); g.fill();
    g.globalAlpha = alpha; g.lineWidth = 1.6; g.strokeStyle = col; rrectPath(g, x, y, bw, bh, 8); g.stroke();
    g.restore();
    if (txt) { g.save(); g.globalAlpha = alpha; label(g, txt, x + bw / 2, y + bh / 2, textCol, fontSize, 'center'); g.restore(); }
  }
  /** 解析顏色：'--xxx' 當 CSS 變數讀（支援主題色），否則原樣回傳；空則用 fallback。 */
  function resolveCol(c: string | undefined, fallback: string): string {
    if (!c) return fallback;
    if (c.charAt(0) === '-' && c.charAt(1) === '-') return cssVar(c, fallback);
    return c;
  }

  // ====================================================================
  // 場景 1：公轉——地球沿近圓軌道繞太陽，顯示「第 N 天 / 第 N 月」讀數。
  // ====================================================================
  function earthRevolution(host: HTMLElement) {
    return runScene(host, {
      durationMs: 9000, loops: 2, staticPhase: 0.28,
      label: '公轉動畫：地球繞著太陽轉一大圈，繞一圈大約一年。',
      draw: function (g, phase, w, h) {
        var cx = w / 2, cy = h / 2;
        var rx = Math.min(w, h) * 0.36, ry = rx * 0.78;
        var theme = themeColor(), ink = inkColor();
        // 軌道（虛線、主題色）。
        g.save();
        g.setLineDash([4, 5]); g.lineWidth = 1.5; g.strokeStyle = theme;
        g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.stroke();
        g.restore();
        // 太陽（含光暈）。
        sunDisc(g, cx, cy, 13);
        label(g, '太陽', cx, cy + 30, ink, 12, 'center');
        // 地球沿軌道（phase=0 從右側起，逆時針）。
        var a = -phase * Math.PI * 2;
        var ex = cx + Math.cos(a) * rx, ey = cy + Math.sin(a) * ry;
        disc(g, ex, ey, 8, EARTH_SEA);
        g.save(); g.beginPath(); g.arc(ex, ey, 8, Math.PI * 0.2, Math.PI * 1.1); g.fillStyle = EARTH_LAND; g.fill(); g.restore();
        // 讀數：公轉一圈＝365 天。
        var day = Math.round(phase * 365) || (phase >= 1 ? 365 : 1);
        var month = Math.min(12, Math.floor(phase * 12) + 1);
        label(g, '第 ' + day + ' 天 ・ 第 ' + month + ' 個月', cx, 16, theme, 13, 'center');
        label(g, '公轉一圈 = 一年', cx, h - 12, ink, 12, 'center');
      }
    });
  }

  // ====================================================================
  // 場景 2（最關鍵）：四季——左：地球繞太陽、地軸「方向固定」、四個位置離太陽
  //   一樣遠；右：入射角示意面板，直接畫出「夏直射集中熱、冬斜射分散涼」。
  //   在 4 個具名狀態（夏/秋/冬/春）各停留，讓孩子看清楚。
  // ====================================================================
  function earthSeasons(host: HTMLElement) {
    var SEASONS = ['夏（北半球朝太陽・直射）', '秋（陽光中等）', '冬（北半球斜離太陽・斜射）', '春（陽光中等）'];
    // 北半球中緯度正午太陽高度角 ≈ 55 + 23.5·cos(2π·phase)：夏(78.5°)高、冬(31.5°)低、春秋(55°)。
    function altAt(phase: number): number { return 55 + 23.5 * Math.cos(phase * Math.PI * 2); }

    return runScene(host, {
      durationMs: 12000, loops: 2, staticPhase: 0.0,
      keyStates: [0, 0.25, 0.5, 0.75], segMs: 1200, dwellMs: 1400,
      label: '四季動畫：地球繞太陽時地軸方向固定，北半球有時朝向太陽、陽光直射（夏），半年後斜離太陽、陽光斜射（冬）。右邊示意同樣多的陽光，直射時集中變熱、斜射時攤開變涼。四個位置離太陽一樣遠——四季是角度不是距離。',
      drawStatic: function (g, w, h) {
        // reduced-motion：四格並排，保留「跨季節」對比（這才是重點）。
        var ink = inkColor(), theme = themeColor();
        var cells: [string, number][] = [['夏', 78.5], ['秋', 55], ['冬', 31.5], ['春', 55]];
        var pw = w / 2, ph = h / 2;
        label(g, '同樣多的陽光，角度不同 → 冷熱不同', w / 2, 10, theme, 11.5, 'center');
        cells.forEach(function (c, i) {
          var cx = (i % 2) * pw + pw / 2;
          var top = (i < 2 ? 0 : ph) + 16;
          label(g, c[0], cx, top + 4, theme, 12, 'center');
          incidencePanel(g, cx, top + 10, pw, ph - 26, c[1], ink);
        });
      },
      draw: function (g, phase, w, h) {
        var theme = themeColor(), ink = inkColor();
        // ---- 左：公轉俯視（地軸方向固定、等距離）----
        var ocx = w * 0.30, ocy = h * 0.55;
        var r = Math.min(w * 0.25, h * 0.32);
        // 近圓軌道（等距離）。
        g.save(); g.setLineDash([4, 5]); g.lineWidth = 1.5; g.strokeStyle = theme;
        g.beginPath(); g.arc(ocx, ocy, r, 0, Math.PI * 2); g.stroke(); g.restore();
        // 太陽。
        sunDisc(g, ocx, ocy, 11);
        // 四個季節定位點 + 淡「幽靈地球」：全在同一半徑＝離太陽一樣遠。
        var qi;
        for (qi = 0; qi < 4; qi++) {
          var qa = -qi * Math.PI / 2;
          var qx = ocx + Math.cos(qa) * r, qy = ocy + Math.sin(qa) * r;
          g.save(); g.globalAlpha = 0.3; disc(g, qx, qy, 6, EARTH_SEA); g.restore();
          g.save(); g.globalAlpha = 0.5; disc(g, qx, qy, 2.5, theme); g.restore();
        }
        // 地球目前位置（phase=0 在右側＝北半球夏）。
        var a = -phase * Math.PI * 2;
        var ex = ocx + Math.cos(a) * r, ey = ocy + Math.sin(a) * r;
        var R = 13;
        disc(g, ex, ey, R, EARTH_SEA);
        g.save(); g.beginPath(); g.arc(ex, ey, R, Math.PI * 0.15, Math.PI * 1.05); g.fillStyle = EARTH_LAND; g.fill(); g.restore();
        // 地軸：方向【固定】＝永遠指向螢幕右上同一方向（四季成因的關鍵）。
        var tilt = -23.5 * Math.PI / 180;
        var ax = Math.sin(tilt), ay = -Math.cos(tilt);   // 單位向量（固定，不隨 a 改變）。
        g.save(); g.strokeStyle = AXIS; g.lineWidth = 2.5; g.beginPath();
        g.moveTo(ex - ax * (R + 6), ey - ay * (R + 6));
        g.lineTo(ex + ax * (R + 6), ey + ay * (R + 6));
        g.stroke();
        disc(g, ex + ax * (R + 6), ey + ay * (R + 6), 2.5, AXIS);   // 北極端點
        g.restore();
        // 季節索引用【就近取整】：過場時標籤與右側說明一起跳到較近的季節，兩者永不互相矛盾
        // （geometry 仍用連續的 altAt 平滑變化）。
        var si = Math.round((((phase % 1) + 1) % 1) * 4) % 4;
        var SEASON_CAP = ['直射・集中', '中等', '斜射・分散', '中等'];
        // 標籤。
        label(g, SEASONS[si], ocx, 13, theme, 12, 'center');
        label(g, '四個位置離太陽一樣遠', ocx, h - 10, ink, 10.5, 'center');

        // ---- 右：入射角示意（跟著季節連續變化；說明文字與季節標籤同步）----
        var icx = w * 0.78, iw = w * 0.42;
        label(g, '陽光照得直不直', icx, 13, theme, 12, 'center');
        incidencePanel(g, icx, 18, iw, h - 30, altAt(phase), ink, SEASON_CAP[si]);
      }
    });
  }

  // ====================================================================
  // 場景 3：月相——月球繞地球，太陽方向固定；左＝俯視光照，右＝地球所見形狀。
  //   在新月/上弦/滿月/下弦四個具名狀態各停留。
  // ====================================================================
  function moonPhases(host: HTMLElement) {
    // 細緻月相名（對齊 phase*8 的八分點；停留點恰為新月/上弦/滿月/下弦）。
    var EIGHT = ['新月', '眉月', '上弦月', '盈凸月', '滿月', '虧凸月', '下弦月', '殘月'];
    return runScene(host, {
      durationMs: 11000, loops: 2, staticPhase: 0.5,
      keyStates: [0, 0.25, 0.5, 0.75], segMs: 1150, dwellMs: 1300,
      label: '月相動畫：月球繞地球，太陽從右側照來。左圖俯視太陽照亮月球哪一半，右圖是地球上看到的形狀——月相是光照角度，不是地球影子。',
      drawStatic: function (g, w, h) {
        // reduced-motion：四格並排四個主要月相，保留跨相對比。
        var ink = inkColor(), theme = themeColor();
        var names = ['新月', '上弦月', '滿月', '下弦月'];
        var ph = [0, 0.25, 0.5, 0.75];
        var cw = w / 4, vr = Math.min(cw * 0.3, h * 0.26), vy = h * 0.46;
        label(g, '月相是光照角度，不是地球影子', w / 2, 12, theme, 11.5, 'center');
        for (var i = 0; i < 4; i++) {
          var vx = cw * i + cw / 2;
          drawMoonDisc(g, vx, vy, vr, ph[i]);
          label(g, names[i], vx, vy + vr + 16, ink, 12, 'center');
        }
      },
      draw: function (g, phase, w, h) {
        var theme = themeColor(), ink = inkColor();
        var half = w / 2;
        // ---- 左：俯視圖 ----
        var cx = half * 0.5, cy = h / 2;
        var orbit = Math.min(half, h) * 0.3;
        label(g, '俯視圖', cx, 14, ink, 12, 'center');
        // 太陽（固定在右側）＝畫出的琥珀圓盤 + 幾條平行光（與公轉/四季同一視覺語言）。
        var sunx = half - 10, suny = cy;
        sunDisc(g, sunx, suny, 6);
        label(g, '太陽', sunx - 16, cy - 24, SUN, 11, 'center');   // 左移，避免壓到中間分隔線
        g.save(); g.strokeStyle = SUN; g.lineWidth = 1.3; g.globalAlpha = 0.75;
        for (var k = -1; k <= 1; k++) {
          g.beginPath(); g.moveTo(sunx - 4, cy + k * 16); g.lineTo(cx + orbit + 10, cy + k * 16); g.stroke();
        }
        g.restore();
        // 地球（中心）。
        disc(g, cx, cy, 9, EARTH_SEA);
        // 軌道。
        g.save(); g.setLineDash([3, 4]); g.lineWidth = 1; g.strokeStyle = theme;
        g.beginPath(); g.arc(cx, cy, orbit, 0, Math.PI * 2); g.stroke(); g.restore();
        // 月球位置（phase=0 在太陽側＝新月；逆時針）。
        var a = -phase * Math.PI * 2;
        var mx = cx + Math.cos(a) * orbit, my = cy + Math.sin(a) * orbit;
        // 月球：永遠右半（朝太陽）被照亮。
        var mr = 7;
        disc(g, mx, my, mr, MOON_DARK);
        g.save(); g.beginPath(); g.arc(mx, my, mr, -Math.PI / 2, Math.PI / 2); g.fillStyle = MOON_LIT; g.fill(); g.restore();
        g.save(); g.strokeStyle = ink; g.globalAlpha = 0.4; g.lineWidth = 0.8; g.beginPath(); g.arc(mx, my, mr, 0, Math.PI * 2); g.stroke(); g.restore();

        // 分隔線。
        g.save(); g.strokeStyle = theme; g.globalAlpha = 0.25; g.lineWidth = 1; g.beginPath(); g.moveTo(half, 22); g.lineTo(half, h - 22); g.stroke(); g.restore();

        // ---- 右：地球上看到的形狀 ----
        var vx = half + half * 0.5, vy = h / 2, vr = Math.min(half, h) * 0.22;
        label(g, '地球看到的', vx, 14, ink, 12, 'center');
        drawMoonDisc(g, vx, vy, vr, phase);
        // 月相名：對齊八分點，不再把 85% 盈凸誤標成滿月。
        var name = EIGHT[Math.round(phase * 8) % 8];
        label(g, name, vx, vy + vr + 16, theme, 13, 'center');
        label(g, '月相是光照角度，不是地球影子', w / 2, h - 10, ink, 11, 'center');
      }
    });
  }

  var NIGHT_SKY = '#28344a';   // 夜空底盤色（深藍）：淺色月面在亮色卡底也看得見。

  /** 畫「地球所見」月面：phase 0..1 → 新月/上弦/滿月/下弦。 */
  function drawMoonDisc(g: CanvasRenderingContext2D, x: number, y: number, r: number, phase: number) {
    // 夜空底盤：MOON_LIT 很淺，直接畫在奶油卡底上對比不足（亮色主題幾乎看不見）；
    // 墊一塊深藍夜空，讓被照亮的月面在亮/暗主題都清楚浮現。
    disc(g, x, y, r + 4, NIGHT_SKY);
    // 底：暗面整圓。
    disc(g, x, y, r, MOON_DARK);
    // 亮面用「終止線」橢圓法：k = -cos(相位角)，phase0 新月 k=-1、phase0.5 滿月 k=+1。
    var ang = phase * Math.PI * 2;
    var k = -Math.cos(ang);
    g.save();
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
    g.fillStyle = MOON_LIT;
    // 右半或左半被照：waxing(0..0.5) 右亮；waning(0.5..1) 左亮。
    var waxing = phase <= 0.5;
    if (Math.abs(k) < 0.02) {
      // 半月：畫半邊。
      g.beginPath();
      if (waxing) g.arc(x, y, r, -Math.PI / 2, Math.PI / 2);
      else g.arc(x, y, r, Math.PI / 2, Math.PI * 1.5);
      g.closePath(); g.fill();
    } else {
      // 亮面外緣 + 終止線（半徑 r*|k| 的橢圓）。
      g.beginPath();
      if (waxing) g.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false);
      else g.arc(x, y, r, Math.PI / 2, Math.PI * 1.5, false);
      g.ellipse(x, y, r * Math.abs(k), r, 0, waxing ? Math.PI / 2 : Math.PI * 1.5, waxing ? -Math.PI / 2 : Math.PI / 2, k > 0 ? false : true);
      g.closePath();
      g.fill();
    }
    g.restore();
    // 月緣：亮色實線描邊，墊在深藍夜空上，即使新月（整個暗）也看得出圓盤輪廓與位置。
    g.save(); g.strokeStyle = '#dfe3ec'; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); g.restore();
  }


  // ===== physics scenes (merged from domain builder) =====
  /** 連續時間來源（毫秒）：讓電流點等「與 phase 無關」的動態在 dwell 停留期間仍持續流動。 */
  function nowMs(): number {
    try { return (window.performance && performance.now) ? performance.now() : Date.now(); }
    catch (e) { return Date.now(); }
  }

  // 電路器材色（自然/器材色；電流點用主題色＝UI 高亮）。
  var COPPER = '#c9873a';
  var BULB_ON = '#ffd21e', BULB_OFF = '#c7ccd4', BULB_RING_ON = '#e0a800';
  // 浮沉：水藍（器材色）；兩個力用綠(浮)/紅(重)——方向＋顏色各異、線寬相同（與物理頁既有圖一致）。
  var WATER_LINE = '#0ea5e9', WATER_FILL = 'rgba(14,165,233,0.16)';
  var F_BUOY = '#16a34a', F_GRAV = '#e11d48';
  // ====================================================================
  // 場景 4：電路——通路 vs 斷路。電流＝一圈流動的點（主題色），通路時燈泡亮；
  //   打開開關＝斷路，有缺口電流就不流、燈泡熄。教學點：電流是「繞一圈流動」的，
  //   斷了就不流。電流點用連續時間驅動，所以在「通路」停留期間仍持續流動。
  // ====================================================================
  /** 畫一個完整電路單元（電池＋燈泡＋開關＋電流點）於中心 (cx,cy)、尺寸 W×H。
   *  isClosed：電流是否流動（燈亮）；openAmt：開關桿張開程度 0..1；
   *  flow：電流點相位（圈數，連續時間驅動）；showLabels：是否畫器材中文標籤。 */
  function drawCircuitUnit(g: CanvasRenderingContext2D, cx: number, cy: number, W: number, H: number,
                           isClosed: boolean, openAmt: number, flow: number, showLabels: boolean,
                           theme: string, ink: string) {
    var LX = cx - W / 2, RX = cx + W / 2, TY = cy - H / 2, BY = cy + H / 2;
    var bulbR = Math.max(9, Math.min(W, H) * 0.13);
    var batHalf = W * 0.12;
    var swGap = bulbR * 0.95;            // 開關兩接點的半間距
    var swY = cy;

    // 線路周長參數（整個矩形）：電流點沿周長等距分布、隨 flow 移動。
    var segs = [[LX, BY, LX, TY], [LX, TY, RX, TY], [RX, TY, RX, BY], [RX, BY, LX, BY]];
    var lens: number[] = [], P = 0, si;
    for (si = 0; si < segs.length; si++) {
      var sl = Math.hypot(segs[si][2] - segs[si][0], segs[si][3] - segs[si][1]);
      lens.push(sl); P += sl;
    }
    function pointAt(s: number): [number, number] {
      var d = (((s % 1) + 1) % 1) * P, k;
      for (k = 0; k < segs.length; k++) {
        if (d <= lens[k]) {
          var t = lens[k] ? d / lens[k] : 0;
          return [segs[k][0] + (segs[k][2] - segs[k][0]) * t, segs[k][1] + (segs[k][3] - segs[k][1]) * t];
        }
        d -= lens[k];
      }
      return [LX, BY];
    }

    // 導線（銅色）：左 / 上(燈泡缺口) / 右(開關缺口) / 下(電池缺口)。
    g.save();
    g.strokeStyle = COPPER; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(LX, BY); g.lineTo(LX, TY);
    g.moveTo(LX, TY); g.lineTo(cx - bulbR, TY);
    g.moveTo(cx + bulbR, TY); g.lineTo(RX, TY);
    g.moveTo(RX, TY); g.lineTo(RX, swY - swGap);
    g.moveTo(RX, swY + swGap); g.lineTo(RX, BY);
    g.moveTo(RX, BY); g.lineTo(cx + batHalf, BY);
    g.moveTo(cx - batHalf, BY); g.lineTo(LX, BY);
    g.stroke();
    g.restore();

    // 電流點（主題色）——只有通路才流動；斷路時整圈都不畫（＝電流不流）。
    if (isClosed) {
      var N = Math.max(12, Math.round(P / 20)), j;
      g.save(); g.fillStyle = theme;
      for (j = 0; j < N; j++) {
        var pt = pointAt(j / N + flow);
        g.beginPath(); g.arc(pt[0], pt[1], 2.5, 0, Math.PI * 2); g.fill();
      }
      g.restore();
      // 方向標示（左側導線向上流）。
      g.save(); g.strokeStyle = theme; g.lineWidth = 2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(LX - 5, cy + 4); g.lineTo(LX, cy - 3); g.lineTo(LX + 5, cy + 4); g.stroke();
      g.restore();
      if (showLabels) label(g, '電流', LX + 15, cy, theme, 10.5, 'left');
    }

    // 電池（下方中央：長板＝＋、短粗板＝－）。
    g.save(); g.strokeStyle = ink; g.lineCap = 'round';
    g.lineWidth = 2.4; g.beginPath(); g.moveTo(cx - 4, BY - 9); g.lineTo(cx - 4, BY + 9); g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(cx + 4, BY - 5); g.lineTo(cx + 4, BY + 5); g.stroke();
    g.restore();
    label(g, '＋', cx - 12, BY - 7, ink, 9.5, 'center');
    if (showLabels) label(g, '電池', cx, BY + 15, ink, 10.5, 'center');

    // 燈泡（上方中央）。
    if (isClosed) {
      disc(g, cx, TY, bulbR * 2.0, 'rgba(255,210,30,0.15)');
      disc(g, cx, TY, bulbR * 1.38, 'rgba(255,210,30,0.5)');
    }
    disc(g, cx, TY, bulbR, isClosed ? BULB_ON : 'rgba(199,204,212,0.3)');
    g.save(); g.strokeStyle = isClosed ? BULB_RING_ON : BULB_OFF; g.lineWidth = 2;
    g.beginPath(); g.arc(cx, TY, bulbR, 0, Math.PI * 2); g.stroke(); g.restore();
    // 燈絲（倒 V）。
    g.save(); g.strokeStyle = isClosed ? '#a85c00' : BULB_OFF; g.lineWidth = 1.6; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(cx - bulbR * 0.5, TY + bulbR * 0.18);
    g.lineTo(cx - bulbR * 0.17, TY - bulbR * 0.34);
    g.lineTo(cx + bulbR * 0.17, TY - bulbR * 0.34);
    g.lineTo(cx + bulbR * 0.5, TY + bulbR * 0.18);
    g.stroke(); g.restore();
    if (showLabels) label(g, '燈泡', cx, TY - bulbR - 8, ink, 10.5, 'center');

    // 開關（右方中央）：桿由下接點鉸接，openAmt 控制張角（關＝垂直搭上接點；開＝往外張）。
    var hingeX = RX, hingeY = swY + swGap;
    var leverLen = swGap * 2;
    var ang = -Math.PI / 2 + openAmt * (Math.PI * 0.33);
    disc(g, hingeX, hingeY, 2.6, ink);
    disc(g, RX, swY - swGap, 2.6, ink);
    g.save(); g.strokeStyle = COPPER; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(hingeX, hingeY);
    g.lineTo(hingeX + Math.cos(ang) * leverLen, hingeY + Math.sin(ang) * leverLen); g.stroke();
    g.restore();
    if (showLabels) label(g, '開關', RX - 8, swY, ink, 10.5, 'right');
  }

  function circuitFlow(host: HTMLElement) {
    return runScene(host, {
      durationMs: 8000, loops: 2, staticPhase: 0,
      keyStates: [0, 0.5], segMs: 1100, dwellMs: 1500,
      label: '電路動畫：通路時電流像一圈小點繞著電路流動、燈泡亮；打開開關變成斷路，有缺口電流就不流、燈泡不亮。',
      drawStatic: function (g, w, h) {
        var theme = themeColor(), ink = inkColor();
        label(g, '通路 vs 斷路：電流繞一圈才會流動', w / 2, 12, theme, 11.5, 'center');
        var pw = w / 2;
        drawCircuitUnit(g, pw * 0.5, h * 0.54, pw * 0.5, h * 0.44, true, 0, 0, false, theme, ink);
        label(g, '通路：燈亮', pw * 0.5, h - 12, ink, 11.5, 'center');
        drawCircuitUnit(g, pw * 1.5, h * 0.54, pw * 0.5, h * 0.44, false, 1, 0, false, theme, ink);
        label(g, '斷路：燈不亮', pw * 1.5, h - 12, ink, 11.5, 'center');
      },
      draw: function (g, phase, w, h) {
        var theme = themeColor(), ink = inkColor();
        var op = (phase <= 0.5) ? easeInOut(phase / 0.5) : easeInOut((1 - phase) / 0.5);
        var isClosed = op < 0.12;
        var flow = nowMs() / 1000 * 0.33;
        label(g, isClosed ? '通路：電流繞一圈流動，燈泡亮' : '斷路：有缺口，電流不流，燈泡不亮',
              w / 2, 13, theme, 12.5, 'center');
        drawCircuitUnit(g, w / 2, h * 0.55, w * 0.46, h * 0.5, isClosed, op, flow, true, theme, ink);
        label(g, '電流要繞完整一圈才會流動；斷了就停', w / 2, h - 9, ink, 10.5, 'center');
      }
    });
  }

  // ====================================================================
  // 場景 5：浮力——浮或沉是「兩個力比大小」的過程。把兩個同大小、不同重的物體放入水中：
  //   木塊（輕）浮力＞重力→浮起停在水面；鐵塊（重）重力＞浮力→沉到底。
  //   兩支箭頭線寬相同，用顏色(綠浮/紅重)＋方向＋標籤區分。
  //   教學點：浮或沉看兩個力誰大，不是「重的一定沉」。
  // ====================================================================
  /** 一支力箭頭（固定線寬 4）；dir：-1 向上、+1 向下。標籤畫在箭身中段側邊（不超出箭頭）。 */
  function forceArrow(g: CanvasRenderingContext2D, x: number, y0: number, len: number, dir: number,
                      color: string, name: string, ink: string, labelSide: number) {
    if (len < 3) return;
    var y1 = y0 + dir * len;
    g.save();
    g.strokeStyle = color; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke();
    g.fillStyle = color; g.beginPath();
    g.moveTo(x, y1); g.lineTo(x - 5, y1 - dir * 9); g.lineTo(x + 5, y1 - dir * 9); g.closePath(); g.fill();
    g.restore();
    label(g, name, x + labelSide * 12, (y0 + y1) / 2, ink, 10.5, labelSide < 0 ? 'right' : 'left');
  }

  /** 畫整個浮沉場景（水箱＋木塊/鐵塊＋兩力箭頭）。sp：過程進度 0(入水前)..1(靜止)。 */
  function buoyScene(g: CanvasRenderingContext2D, w: number, h: number, sp: number, bob: number, ink: string) {
    var waterTop = h * 0.42, tankBottom = h * 0.80, tankL = w * 0.06, tankR = w * 0.94;
    // 水箱。
    g.save();
    g.fillStyle = WATER_FILL;
    g.fillRect(tankL, waterTop, tankR - tankL, tankBottom - waterTop);
    g.strokeStyle = WATER_LINE; g.lineWidth = 2;
    g.beginPath(); g.moveTo(tankL, waterTop); g.lineTo(tankR, waterTop); g.stroke();
    g.globalAlpha = 0.5;
    g.beginPath();
    g.moveTo(tankL, waterTop); g.lineTo(tankL, tankBottom);
    g.lineTo(tankR, tankBottom); g.lineTo(tankR, waterTop); g.stroke();
    g.restore();
    label(g, '水', tankR - 12, waterTop + 13, WATER_LINE, 11, 'center');

    var objH = Math.min(w, h) * 0.13, objW = objH;
    var B_full = objH * 1.0;        // 完全沒入時的浮力（兩物體體積相同＝相同）
    var startCenter = waterTop - objH * 0.95;
    var lanes = [
      { cx: w * 0.30, grav: objH * 0.6, name: '木', good: true,  verdict: '浮力＝重力 → 浮在水面' },
      { cx: w * 0.70, grav: objH * 1.5, name: '鐵', good: false, verdict: '重力＞浮力 → 沉到底' }
    ];
    label(g, '木塊（輕）', lanes[0].cx, 27, ink, 10.5, 'center');
    label(g, '鐵塊（重）', lanes[1].cx, 27, ink, 10.5, 'center');

    var li;
    for (li = 0; li < lanes.length; li++) {
      var ln = lanes[li];
      var settledCenter;
      if (ln.good) {
        var subFrac = ln.grav / B_full;                 // 平衡沒入比例
        settledCenter = waterTop + subFrac * objH - objH / 2;
      } else {
        settledCenter = tankBottom - objH / 2 - 2;
      }
      var cy;
      if (ln.good) {
        var over = settledCenter + objH * 0.55;          // 先略沉…
        if (sp < 0.65) cy = startCenter + (over - startCenter) * easeInOut(sp / 0.65);
        else cy = over + (settledCenter - over) * easeInOut((sp - 0.65) / 0.35);  // …再浮起停在水面
        if (sp >= 0.999) cy = settledCenter + bob;
      } else {
        cy = startCenter + (settledCenter - startCenter) * easeInOut(sp);
      }
      var top = cy - objH / 2, bottom = cy + objH / 2;
      // 物體。
      g.save();
      g.fillStyle = 'rgba(120,120,120,0.25)'; g.fillRect(ln.cx - objW / 2, top, objW, objH);
      g.strokeStyle = ink; g.lineWidth = 2; g.strokeRect(ln.cx - objW / 2, top, objW, objH);
      g.restore();
      label(g, ln.name, ln.cx, cy, ink, 13, 'center');
      // 浮力（上，依沒入比例）＋重力（下，固定）——兩力從物體中心出發。
      var subF = Math.max(0, Math.min(1, (bottom - waterTop) / objH));
      var buoyLen = subF * B_full, gravLen = ln.grav;
      if (!ln.good) {                                   // 沉底塊：把向下箭頭夾在水箱內（頭不穿出底線），
        var room = tankBottom - cy - 6;                 // 浮力箭頭同比例縮短，仍維持「重力＞浮力」的長短關係。
        if (gravLen > room && room > 0) { var kk = room / gravLen; gravLen = room; buoyLen *= kk; }
      }
      forceArrow(g, ln.cx - 9, cy, buoyLen, -1, F_BUOY, '浮力', ink, -1);
      forceArrow(g, ln.cx + 9, cy, gravLen, +1, F_GRAV, '重力', ink, +1);
    }
    // 兩句判詞：靠左堆疊在水箱下方，避開右下角「重播」鈕（比照 fractionEquiv 的做法）。
    if (sp > 0.85) {
      label(g, lanes[0].name + '塊：' + lanes[0].verdict, tankL, tankBottom + 15, F_BUOY, 10, 'left');
      label(g, lanes[1].name + '塊：' + lanes[1].verdict, tankL, tankBottom + 31, F_GRAV, 10, 'left');
    }
  }

  function buoyancyFloat(host: HTMLElement) {
    return runScene(host, {
      durationMs: 7000, loops: 2, staticPhase: 1,
      label: '浮力動畫：把一樣大、不同重的木塊和鐵塊放入水中；木塊浮力大於重力會浮起停在水面，鐵塊重力大於浮力會沉到底。浮或沉看兩個力誰大，不是重的一定沉。',
      drawStatic: function (g, w, h) {
        var theme = themeColor(), ink = inkColor();
        label(g, '浮沉比一比：看浮力和重力誰大', w / 2, 12, theme, 11.5, 'center');
        buoyScene(g, w, h, 1, 0, ink);
      },
      draw: function (g, phase, w, h) {
        var theme = themeColor(), ink = inkColor();
        var sp = (phase < 0.14) ? 0 : (phase < 0.74 ? (phase - 0.14) / 0.60 : 1);
        var bob = Math.sin(nowMs() / 450) * 1.6;
        label(g, '浮或沉？比浮力和重力誰大', w / 2, 13, theme, 12.5, 'center');
        buoyScene(g, w, h, sp, bob, ink);
      }
    });
  }


  // ===== chem scenes (merged from domain builder) =====
  // ====================================================================
  // 場景 4：化學反應——原子只是「重新排列組合」，總數不變（質量守恆）。
  //   反應式 2H₂ + O₂ → 2H₂O：左邊兩個 H–H 與一個 O=O，斷鍵後原子四散、
  //   再重新組合成兩個 H₂O。全程頂端固定顯示原子總數（H:4、O:2）＝不增不減。
  //   三個具名狀態：反應前 → 斷鍵・重組中 → 反應後，各停留讓孩子看清楚。
  // ====================================================================
  // 元素自然色（固定、不隨主題，科學慣例）：氫＝白/淺灰、氧＝紅、碳＝黑/深灰。
  var ELEM_H = '#edeff3', ELEM_H_STROKE = '#9aa3af', ELEM_H_INK = '#2b2b36', ELEM_O = '#e11d48';
  var BOND = '#8a8a8a';

  function reactionRebond(host: HTMLElement) {
    // 基準座標系（340 × 210）；實際繪製依 canvas 的 CSS 寬度等比縮放（s = w/340）。
    var KEYS = ['o0', 'o1', 'h0', 'h1', 'h2', 'h3'];
    var ELEM: { [k: string]: string } = { o0: 'O', o1: 'O', h0: 'H', h1: 'H', h2: 'H', h3: 'H' };
    // 反應前位置：兩個 H–H（上、下）＋ 一個 O=O（中）。
    var RP: { [k: string]: [number, number] } = {
      h0: [54, 78], h1: [84, 78],      // H–H（分子 A）
      o0: [58, 116], o1: [94, 116],    // O=O
      h2: [54, 156], h3: [84, 156]     // H–H（分子 B）
    };
    // 反應後位置：兩個 H₂O（彎曲形）。o0 配 h0,h1；o1 配 h2,h3——同一批原子重排。
    var PP: { [k: string]: [number, number] } = {
      o0: [250, 96], h0: [228, 112], h1: [272, 112],   // 水分子 1
      o1: [250, 150], h2: [228, 166], h3: [272, 166]   // 水分子 2
    };
    // 中途「原子四散」路點：pr=0.5 時六顆原子鬆散排成 3×2，彼此不重疊＝鍵已全斷、原子自由。
    var MID: { [k: string]: [number, number] } = {
      h0: [128, 96], o0: [170, 96], h1: [212, 96],
      h2: [128, 150], o1: [170, 150], h3: [212, 150]
    };
    // 兩段內插：反應物 →（斷鍵、原子分開到四散路點）→ 生成物（重新組合成水）。
    function baseAnim(key: string, pr: number): [number, number] {
      var a: [number, number], b: [number, number], t: number;
      if (pr <= 0.5) { a = RP[key]; b = MID[key]; t = pr / 0.5; }
      else { a = MID[key]; b = PP[key]; t = (pr - 0.5) / 0.5; }
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
    // 反應進度 pr（0..1）＝幾何上「反應物→生成物」；用分段 ease 做出三段停留。
    function reactProgress(p: number): number {
      if (p < 0.16) return 0;                                      // 停：反應前
      if (p < 0.44) return easeInOut((p - 0.16) / 0.28) * 0.5;     // 斷鍵、原子分開
      if (p < 0.56) return 0.5;                                    // 停：原子四散（鍵全斷）
      if (p < 0.84) return 0.5 + easeInOut((p - 0.56) / 0.28) * 0.5; // 重新組合成水
      return 1;                                                    // 停：反應後
    }
    function tp(xy: [number, number], tf: { ox: number; oy: number; sc: number }): [number, number] {
      return [tf.ox + xy[0] * tf.sc, tf.oy + xy[1] * tf.sc];
    }
    function drawAtom(g: CanvasRenderingContext2D, x: number, y: number, r: number, el: string) {
      if (el === 'O') {
        disc(g, x, y, r, ELEM_O);
        if (r >= 8) label(g, 'O', x, y, '#fff', Math.round(r * 0.95), 'center');
      } else {
        disc(g, x, y, r, ELEM_H);
        g.save(); g.strokeStyle = ELEM_H_STROKE; g.lineWidth = Math.max(1, r * 0.14);
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); g.restore();
        if (r >= 8) label(g, 'H', x, y, ELEM_H_INK, Math.round(r * 0.95), 'center');
      }
    }
    function drawBond(g: CanvasRenderingContext2D, s1: [number, number], s2: [number, number], alpha: number, dbl: boolean, lw: number) {
      if (alpha <= 0.02) return;
      g.save(); g.globalAlpha = alpha; g.strokeStyle = BOND; g.lineWidth = lw; g.lineCap = 'round';
      if (dbl) {
        var dx = s2[0] - s1[0], dy = s2[1] - s1[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
        var ox = -dy / len * (lw * 0.9), oy = dx / len * (lw * 0.9);
        g.beginPath(); g.moveTo(s1[0] + ox, s1[1] + oy); g.lineTo(s2[0] + ox, s2[1] + oy); g.stroke();
        g.beginPath(); g.moveTo(s1[0] - ox, s1[1] - oy); g.lineTo(s2[0] - ox, s2[1] - oy); g.stroke();
      } else {
        g.beginPath(); g.moveTo(s1[0], s1[1]); g.lineTo(s2[0], s2[1]); g.stroke();
      }
      g.restore();
    }
    // 畫整組分子：reactant 鍵（H–H、O=O）用 rAlpha；product 鍵（O–H）用 pAlpha；原子最後畫在上層。
    function renderMolecules(g: CanvasRenderingContext2D, getPos: (k: string) => [number, number], tf: { ox: number; oy: number; sc: number }, rAlpha: number, pAlpha: number) {
      var lw = 4 * tf.sc;
      function sp(k: string): [number, number] { return tp(getPos(k), tf); }
      drawBond(g, sp('h0'), sp('h1'), rAlpha, false, lw);   // H–H
      drawBond(g, sp('h2'), sp('h3'), rAlpha, false, lw);   // H–H
      drawBond(g, sp('o0'), sp('o1'), rAlpha, true, lw);    // O=O（雙鍵）
      drawBond(g, sp('o0'), sp('h0'), pAlpha, false, lw);   // 水1 O–H
      drawBond(g, sp('o0'), sp('h1'), pAlpha, false, lw);
      drawBond(g, sp('o1'), sp('h2'), pAlpha, false, lw);   // 水2 O–H
      drawBond(g, sp('o1'), sp('h3'), pAlpha, false, lw);
      KEYS.forEach(function (k) { var p = sp(k); drawAtom(g, p[0], p[1], (ELEM[k] === 'O' ? 13 : 10) * tf.sc, ELEM[k]); });
    }
    // 頂端固定「原子總數」讀數＝同時也是色彩圖例（白點＝氫 H、紅點＝氧 O）。反應前後都一樣。
    function drawCount(g: CanvasRenderingContext2D, w: number, s: number) {
      var fs = 12 * s, dotR = 5 * s, dotPad = 7 * s, gap = 20 * s, y = 38 * s, ink = inkColor();
      g.font = '700 ' + fs + 'px system-ui, -apple-system, "Segoe UI", sans-serif';
      g.textBaseline = 'middle'; g.textAlign = 'left';
      var t1 = '氫 H：4', t2 = '氧 O：2';
      var w1 = dotR * 2 + dotPad + g.measureText(t1).width;
      var w2 = dotR * 2 + dotPad + g.measureText(t2).width;
      var x = w / 2 - (w1 + gap + w2) / 2;
      drawAtom(g, x + dotR, y, dotR, 'H'); g.fillStyle = ink; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(t1, x + dotR * 2 + dotPad, y);
      x += w1 + gap;
      drawAtom(g, x + dotR, y, dotR, 'O'); g.fillStyle = ink; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(t2, x + dotR * 2 + dotPad, y);
    }
    function drawArrow(g: CanvasRenderingContext2D, s: number, color: string, alpha: number) {
      g.save(); g.globalAlpha = alpha; g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 2.4 * s; g.lineCap = 'round';
      var y = 116 * s, x0 = 118 * s, x1 = 204 * s;
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
      g.beginPath(); g.moveTo(x1, y); g.lineTo(x1 - 8 * s, y - 5 * s); g.lineTo(x1 - 8 * s, y + 5 * s); g.closePath(); g.fill();
      g.restore();
    }

    return runScene(host, {
      durationMs: 9000, loops: 2, staticPhase: 1,
      label: '化學反應動畫：左邊兩個氫分子（H–H）和一個氧分子（O=O），鍵斷開後原子分散、再重新組合成兩個水分子（H₂O）。頂端一直顯示原子總數：氫 H 共 4 個、氧 O 共 2 個——反應前後都一樣，原子沒有消失也沒有新生，只是重新排列組合，所以總數（質量）不變。',
      drawStatic: function (g, w, h) {
        // reduced-motion：左右兩格（反應前／反應後），同一批原子重排、兩邊數目一樣。
        var s = w / 340, ink = inkColor(), theme = themeColor();
        label(g, '原子重新排列，總數不變（質量守恆）', w / 2, 14 * s, theme, 12.5 * s, 'center');
        var cy = h * 0.46, scP = s * 0.72;
        var lcx = w * 0.26, rcx = w * 0.74;
        var lt = { sc: scP, ox: lcx - 69 * scP, oy: cy - 117 * scP };   // 反應物叢集中心 (69,117)
        var rt = { sc: scP, ox: rcx - 250 * scP, oy: cy - 131 * scP };  // 生成物叢集中心 (250,131)
        renderMolecules(g, function (k) { return RP[k]; }, lt, 1, 0);
        renderMolecules(g, function (k) { return PP[k]; }, rt, 0, 1);
        label(g, '→', w / 2, cy, ink, 20 * s, 'center');
        label(g, '氫 H：4　氧 O：2', w / 2, cy - 56 * s, theme, 11 * s, 'center');
        label(g, '（兩邊一樣多）', w / 2, cy + 56 * s, ink, 10 * s, 'center');
        label(g, '反應前', lcx, h - 30 * s, ink, 12 * s, 'center');
        label(g, '2H₂ + O₂', lcx, h - 14 * s, theme, 11 * s, 'center');
        label(g, '反應後', rcx, h - 30 * s, ink, 12 * s, 'center');
        label(g, '2H₂O', rcx, h - 14 * s, theme, 11 * s, 'center');
      },
      draw: function (g, phase, w) {
        var s = w / 340, ink = inkColor(), theme = themeColor();
        var pr = reactProgress(phase);
        var stageLabel = pr < 0.04 ? '反應前' : (pr > 0.96 ? '反應後' : '斷鍵・重組中');
        label(g, stageLabel, w / 2, 15 * s, theme, 13.5 * s, 'center');
        drawCount(g, w, s);
        drawArrow(g, s, theme, (pr < 0.05 || pr > 0.95) ? 0.4 : 0.14);
        var rAlpha = Math.max(0, Math.min(1, 1 - pr / 0.5));   // 反應物鍵：g 0→0.5 淡出（斷鍵）
        var pAlpha = Math.max(0, Math.min(1, (pr - 0.5) / 0.5)); // 生成物鍵：g 0.5→1 淡入（成鍵）
        renderMolecules(g, function (k) { return baseAnim(k, pr); }, { ox: 0, oy: 0, sc: s }, rAlpha, pAlpha);
        label(g, '2H₂ + O₂ → 2H₂O', w / 2, 190 * s, ink, 13 * s, 'center');
        label(g, '原子沒有消失也沒新生，只是重新排列 → 總數（質量）不變', 8 * s, 204 * s, theme, 9.5 * s, 'left');  // 靠左，避開右下角「重播」鈕
      }
    });
  }


  // ===== math scenes (merged from domain builder) =====
  // ====================================================================
  // 場景 4：向量相加（tip-to-tail／頭接尾）。數字對齊同頁靜態圖：
  //   a=(2,1)、b=(1,3)、合向量 a+b=(3,4)。
  //   先從原點畫 a → 把 b 平移到 a 的箭頭尖端（頭接尾）→ 從起點畫到終點＝a+b；
  //   最後淡淡畫出「先 b 再 a」的平行四邊形，示意交換律（同一個終點）。
  //   reduced-motion：一張靜態圖同時標出 a、b（頭接尾）與 a+b。
  // ====================================================================
  function vectorAdd(host: HTMLElement) {
    var A = [2, 1], B = [1, 3];                       // a、b（格座標）；合向量 = (3,4)
    var VB = '#0891b2', VR = '#e11d48';               // b＝青、a+b＝紅（固定；亮暗卡皆清楚）
    var C = 34, OX = 22;                              // 格寬、左邊距（canvas 邏輯座標固定）
    function gx(x: number): number { return OX + x * C; }

    // 一致粗細的箭頭（含箭頭三角）；dash＝交換律虛線。
    function arrow(g: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, alpha: number, dash: boolean) {
      var ang = Math.atan2(y2 - y1, x2 - x1), hl = 11, hw = 0.46;
      g.save();
      g.globalAlpha = alpha; g.strokeStyle = color; g.fillStyle = color;
      g.lineWidth = 3.5; g.lineCap = 'round'; g.lineJoin = 'round';
      if (dash) g.setLineDash([5, 4]);
      var bx = x2 - Math.cos(ang) * hl * 0.6, by = y2 - Math.sin(ang) * hl * 0.6;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(bx, by); g.stroke();
      g.setLineDash([]);
      g.beginPath(); g.moveTo(x2, y2);
      g.lineTo(x2 - hl * Math.cos(ang - hw), y2 - hl * Math.sin(ang - hw));
      g.lineTo(x2 - hl * Math.cos(ang + hw), y2 - hl * Math.sin(ang + hw));
      g.closePath(); g.fill();
      g.restore();
    }

    function grid(g: CanvasRenderingContext2D, OY: number, ink: string) {
      g.save(); g.strokeStyle = ink;
      for (var i = 0; i <= 4; i++) {
        g.globalAlpha = 0.14; g.lineWidth = 1;
        g.beginPath(); g.moveTo(OX + i * C, OY); g.lineTo(OX + i * C, OY - 4 * C); g.stroke();
        g.beginPath(); g.moveTo(OX, OY - i * C); g.lineTo(OX + 4 * C, OY - i * C); g.stroke();
      }
      g.globalAlpha = 0.4; g.lineWidth = 1.5;                       // 兩軸深一點
      g.beginPath(); g.moveTo(OX, OY); g.lineTo(OX + 4 * C, OY); g.stroke();
      g.beginPath(); g.moveTo(OX, OY); g.lineTo(OX, OY - 4 * C); g.stroke();
      g.restore();
      disc(g, OX, OY, 2.5, ink);
      label(g, 'O', OX - 8, OY + 8, ink, 10, 'center');
    }

    function legend(g: CanvasRenderingContext2D, w: number, theme: string) {
      var items: [string, string][] = [[theme, 'a'], [VB, 'b'], [VR, 'a + b']];
      var xs = [w * 0.5 - 92, w * 0.5 - 20, w * 0.5 + 58];
      for (var i = 0; i < 3; i++) {
        var x = xs[i], y = 12;
        g.save(); g.strokeStyle = items[i][0]; g.lineWidth = 3.5; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20, y); g.stroke(); g.restore();
        label(g, items[i][1], x + 26, y, items[i][0], 12, 'left');
      }
    }

    // 右側空白區的數字讀數：a / b /（分隔線）a+b，隨動畫逐步出現。
    function readout(g: CanvasRenderingContext2D, w: number, h: number, theme: string, ink: string, showB: boolean, showR: boolean) {
      var cx = (OX + 4 * C + w) / 2;
      label(g, 'a = (2, 1)', cx, h * 0.34, theme, 13, 'center');
      if (showB) label(g, 'b = (1, 3)', cx, h * 0.48, VB, 13, 'center');
      if (showR) {
        g.save(); g.strokeStyle = ink; g.globalAlpha = 0.4; g.lineWidth = 1;
        g.beginPath(); g.moveTo(cx - 42, h * 0.57); g.lineTo(cx + 42, h * 0.57); g.stroke(); g.restore();
        label(g, 'a + b = (3, 4)', cx, h * 0.66, VR, 13.5, 'center');
      }
    }

    // 完整結果圖（最後停留幀 + reduced-motion 共用）。ghost＝畫出交換律的淡平行四邊形。
    function complete(g: CanvasRenderingContext2D, w: number, h: number, OY: number, ghost: boolean) {
      var theme = themeColor(), ink = inkColor();
      if (ghost) {
        arrow(g, OX, OY, gx(B[0]), OY - B[1] * C, VB, 0.28, true);
        arrow(g, gx(B[0]), OY - B[1] * C, gx(3), OY - 4 * C, theme, 0.28, true);
      }
      arrow(g, OX, OY, gx(A[0]), OY - A[1] * C, theme, 1, false);              // a
      arrow(g, gx(A[0]), OY - A[1] * C, gx(3), OY - 4 * C, VB, 1, false);      // b（頭接尾）
      arrow(g, OX, OY, gx(3), OY - 4 * C, VR, 1, false);                       // a+b
      disc(g, gx(3), OY - 4 * C, 3, VR);
      readout(g, w, h, theme, ink, true, true);
    }

    return runScene(host, {
      durationMs: 12000, loops: 2, staticPhase: 1,
      label: '向量相加動畫：在格子上從原點畫出向量 a=(2,1)，再把向量 b=(1,3) 平移到 a 的箭頭尖端（頭接尾），然後從起點連到終點，就是合向量 a+b=(3,4)。先 a 再 b、或先 b 再 a 都到同一個終點（交換律）。',
      drawStatic: function (g, w, h) {
        var ink = inkColor(), theme = themeColor();
        var OY = h - 18;
        grid(g, OY, ink);
        legend(g, w, theme);
        complete(g, w, h, OY, true);
        label(g, '頭接尾：從起點到終點就是 a + b', w / 2, h - 5, theme, 11, 'center');
      },
      draw: function (g, p, w, h) {
        var theme = themeColor(), ink = inkColor();
        var OY = h - 18;
        grid(g, OY, ink);
        legend(g, w, theme);
        var atx = gx(A[0]), ay = OY - A[1] * C;
        var cap = '';
        if (p < 0.12) {
          var t = p / 0.12;
          arrow(g, OX, OY, gx(A[0] * t), OY - A[1] * C * t, theme, 1, false);
          readout(g, w, h, theme, ink, false, false);
          cap = '① 從起點 O 畫出向量 a';
        } else if (p < 0.22) {
          var t2 = (p - 0.12) / 0.1;
          arrow(g, OX, OY, atx, ay, theme, 1, false);
          arrow(g, OX, OY, gx(B[0] * t2), OY - B[1] * C * t2, VB, 1, false);
          readout(g, w, h, theme, ink, true, false);
          cap = '② 也從 O 畫出向量 b';
        } else if (p < 0.3) {
          arrow(g, OX, OY, atx, ay, theme, 1, false);
          arrow(g, OX, OY, gx(B[0]), OY - B[1] * C, VB, 1, false);
          readout(g, w, h, theme, ink, true, false);
          cap = '② 這是向量 a 和向量 b';
        } else if (p < 0.5) {
          var t3 = easeInOut((p - 0.3) / 0.2);
          arrow(g, OX, OY, atx, ay, theme, 1, false);
          var tailx = OX + (atx - OX) * t3, taily = OY + (ay - OY) * t3;
          arrow(g, tailx, taily, tailx + B[0] * C, taily - B[1] * C, VB, 1, false);
          readout(g, w, h, theme, ink, true, false);
          cap = '③ 把 b 平移，尾巴接到 a 的箭頭';
        } else if (p < 0.6) {
          arrow(g, OX, OY, atx, ay, theme, 1, false);
          arrow(g, atx, ay, gx(3), OY - 4 * C, VB, 1, false);
          readout(g, w, h, theme, ink, true, false);
          cap = '③ 頭接尾！b 接在 a 後面';
        } else if (p < 0.74) {
          var t4 = (p - 0.6) / 0.14;
          arrow(g, OX, OY, atx, ay, theme, 1, false);
          arrow(g, atx, ay, gx(3), OY - 4 * C, VB, 1, false);
          arrow(g, OX, OY, gx(3 * t4), OY - 4 * C * t4, VR, 1, false);
          readout(g, w, h, theme, ink, true, false);
          cap = '④ 從起點 O 連到終點';
        } else {
          complete(g, w, h, OY, true);
          cap = '④ 起點→終點 = a + b（先 b 再 a 也一樣）';
        }
        label(g, cap, w / 2, h - 5, theme, 11, 'center');
      }
    });
  }

  // ====================================================================
  // 場景 5：等值分數——一條長條塗左邊一半（1/2）。把每一塊切更細，塗色面積不變、
  //   分子分母同時放大：1/2 = 2/4 = 3/6（這就是約分／通分在做的事）。
  //   reduced-motion：三格並排 1/2 ｜ 2/4 ｜ 3/6，塗色面積一樣大。
  // ====================================================================
  function fractionEquiv(host: HTMLElement) {
    // 長條外框：左半塗色（面積固定）＋中線（1/2 的界永遠在）＋外框。
    function barFrame(g: CanvasRenderingContext2D, bx: number, by: number, bw: number, bh: number, theme: string, ink: string) {
      g.save(); g.fillStyle = theme; g.globalAlpha = 0.82; g.fillRect(bx, by, bw / 2, bh); g.restore();
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.9; g.lineWidth = 2;
      g.beginPath(); g.moveTo(bx + bw / 2, by); g.lineTo(bx + bw / 2, by + bh); g.stroke(); g.restore();
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.7; g.lineWidth = 2; g.strokeRect(bx, by, bw, bh); g.restore();
    }
    // 細分線（中線以外）：scale 控制高度，做「切開／收合」的過場。
    function subs(g: CanvasRenderingContext2D, bx: number, by: number, bw: number, bh: number, fracs: number[], scale: number, ink: string) {
      if (scale <= 0) return;
      var sc = Math.min(1, scale);
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.4 * sc; g.lineWidth = 1;
      var cy = by + bh / 2, hh = (bh / 2) * sc;
      for (var i = 0; i < fracs.length; i++) {
        var x = bx + fracs[i] * bw;
        g.beginPath(); g.moveTo(x, cy - hh); g.lineTo(x, cy + hh); g.stroke();
      }
      g.restore();
    }
    function fullBar(g: CanvasRenderingContext2D, bx: number, by: number, bw: number, bh: number, den: number, theme: string, ink: string) {
      barFrame(g, bx, by, bw, bh, theme, ink);
      var all: number[] = [];
      for (var i = 1; i < den; i++) if (i !== den / 2) all.push(i / den);
      subs(g, bx, by, bw, bh, all, 1, ink);
    }

    var Q4: number[] = [0.25, 0.75];
    var Q6: number[] = [1 / 6, 2 / 6, 4 / 6, 5 / 6];

    return runScene(host, {
      durationMs: 11000, loops: 2, staticPhase: 1,
      label: '等值分數動畫：一條長條塗了左邊一半，是 1/2。把每一塊切得更細，塗色的面積都沒變，分子和分母同時變大：1/2 = 2/4 = 3/6。這就是約分和通分在做的事。',
      drawStatic: function (g, w) {
        var ink = inkColor(), theme = themeColor();
        label(g, '塗色面積一樣大 → 等值分數', w / 2, 13, theme, 12, 'center');
        var dens = [2, 4, 6], names = ['1/2', '2/4', '3/6'];
        var bx = 24, bw = w - 108, bh = 30, ys = [30, 86, 142];
        for (var i = 0; i < 3; i++) {
          fullBar(g, bx, ys[i], bw, bh, dens[i], theme, ink);
          label(g, names[i], bx + bw + 30, ys[i] + bh / 2, i === 0 ? theme : ink, 16, 'center');
        }
      },
      draw: function (g, p, w) {
        var ink = inkColor(), theme = themeColor();
        label(g, '把每一塊切更細，塗色面積一樣大', w / 2, 15, theme, 12, 'center');
        var bx = 22, bw = w - 44, bh = 48, by = 44;
        barFrame(g, bx, by, bw, bh, theme, ink);
        var eq = '1/2', pieces = '切成 2 份，塗 1 份';
        if (p < 0.16) {
          // 只有中線（1/2）
        } else if (p < 0.3) {
          var t = (p - 0.16) / 0.14; subs(g, bx, by, bw, bh, Q4, t, ink);
          if (t >= 0.5) { eq = '1/2 = 2/4'; pieces = '切成 4 份，塗 2 份'; }
        } else if (p < 0.5) {
          subs(g, bx, by, bw, bh, Q4, 1, ink); eq = '1/2 = 2/4'; pieces = '切成 4 份，塗 2 份';
        } else if (p < 0.64) {
          var t2 = (p - 0.5) / 0.14;
          if (t2 < 0.5) { subs(g, bx, by, bw, bh, Q4, 1 - t2 * 2, ink); eq = '1/2 = 2/4'; pieces = '切成 4 份，塗 2 份'; }
          else { subs(g, bx, by, bw, bh, Q6, (t2 - 0.5) * 2, ink); eq = '1/2 = 2/4 = 3/6'; pieces = '切成 6 份，塗 3 份'; }
        } else {
          subs(g, bx, by, bw, bh, Q6, 1, ink); eq = '1/2 = 2/4 = 3/6'; pieces = '切成 6 份，塗 3 份';
        }
        label(g, eq, w / 2, by + bh + 30, theme, 22, 'center');
        label(g, pieces, w / 2, by + bh + 56, ink, 12, 'center');
        label(g, '面積沒變 → 都是等值分數', bx, by + bh + 80, ink, 11, 'left');  // 靠左，避開右下角重播鈕
      }
    });
  }



  // ===== sci scenes (merged) =====
  // ====================================================================
  // 場景 6：物質三態（粒子運動）——同一批粒子，加熱後動得越快、排列越鬆。
  //   固態＝整齊又緊密、只在原地振動；液態＝鬆散、互相滑動（會流動、隨容器變形）；
  //   氣態＝彼此分很開、到處快飛、充滿整個容器。在 固→液→氣 三個具名狀態各停留。
  //   三態粒子總數都一樣（16 顆）＝「粒子本身沒變，變的是排列和運動」。
  //   粒子運動由連續時間（nowMs）驅動，所以在每個狀態停留時仍持續動。
  //   reduced-motion：三格並排 固/液/氣，呈現各自的排列。
  // ====================================================================
  function statesOfMatter(host: HTMLElement) {
    var N = 16;                                   // 4×4 顆同樣的粒子（三態都一樣多）
    var NAMES = ['固態', '液態', '氣態'];
    var VERB = ['排列整齊又緊密，只在原地振動', '互相靠近但能滑動，會流動、隨容器變形', '彼此分很開、到處快飛，充滿整個容器'];
    var AMP = [0.014, 0.05, 0.12];                // 運動幅度（容器比例）：固小、液中、氣大
    var SPD = [7.5, 2.4, 4.4];                    // 運動速度：固原地快抖、液慢滑、氣快飛
    var PH: number[] = [], PH2: number[] = [], ii;
    for (ii = 0; ii < N; ii++) {
      PH.push((ii * 2.3999) % (Math.PI * 2));     // 固定相位偏移＝各顆獨立、不同步擺動
      PH2.push((ii * 1.618 * Math.PI) % (Math.PI * 2));
    }
    // 三態中每顆粒子的「家」位置（容器內正規化 0..1；y 下為大）。
    function home(state: number, i: number): [number, number] {
      var gi = i % 4, gj = Math.floor(i / 4);
      if (state === 0) return [0.29 + gi * 0.14, 0.52 + gj * 0.14];   // 固：緊密方陣沉在底部
      if (state === 1) return [0.13 + gi * 0.25, 0.50 + gj * 0.135];  // 液：鬆散填下半（有自由液面）
      return [0.14 + gi * 0.24, 0.12 + gj * 0.24];                    // 氣：散佈整個容器
    }
    function drawBox(g: CanvasRenderingContext2D, x: number, y: number, s: number, ink: string) {
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.45; g.lineWidth = 2;
      var r = 7;
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + s, y, x + s, y + s, r);
      g.arcTo(x + s, y + s, x, y + s, r);
      g.arcTo(x, y + s, x, y, r);
      g.arcTo(x, y, x + s, y, r);
      g.closePath(); g.stroke(); g.restore();
    }
    return runScene(host, {
      durationMs: 10000, loops: 2, staticPhase: 0,
      keyStates: [0, 1 / 3, 2 / 3], segMs: 1150, dwellMs: 1500,
      label: '物質三態動畫：同一批粒子在容器裡，固態排列整齊只在原地振動、液態鬆散會互相滑動、氣態分很開到處快飛充滿整個容器。加熱後粒子動得越快、排列越鬆（固→液→氣）；粒子本身沒變，變的是排列和運動。',
      drawStatic: function (g, w, h) {
        var ink = inkColor(), theme = themeColor();
        label(g, '同樣的粒子，排列和運動不同（固 / 液 / 氣）', w / 2, 13, theme, 11.5, 'center');
        var pw = w / 3, i, s;
        for (s = 0; s < 3; s++) {
          var cx = pw * s + pw / 2;
          var pb = Math.min(pw * 0.66, h * 0.52);
          var pbx = cx - pb / 2, pby = h * 0.30;
          drawBox(g, pbx, pby, pb, ink);
          for (i = 0; i < N; i++) {
            var hh = home(s, i);
            disc(g, pbx + hh[0] * pb, pby + hh[1] * pb, pb * 0.05, theme);
          }
          label(g, NAMES[s], cx, pby + pb + 15, ink, 12, 'center');
        }
      },
      draw: function (g, phase, w, h) {
        var theme = themeColor(), ink = inkColor();
        var boxS = Math.min(w * 0.5, h * 0.6);
        var bx = w / 2 - boxS / 2, by = h * 0.24;
        var b = (((phase % 1) + 1) % 1) * 3;
        var seg = Math.floor(b) % 3, frac = b - Math.floor(b);
        var sA = seg, sB = (seg + 1) % 3, e = easeInOut(frac);
        var amp = AMP[sA] + (AMP[sB] - AMP[sA]) * e;
        var spd = SPD[sA] + (SPD[sB] - SPD[sA]) * e;
        var near = Math.round(b) % 3;
        label(g, NAMES[near], w / 2, 15, theme, 15, 'center');
        label(g, VERB[near], w / 2, 33, ink, 11, 'center');
        drawBox(g, bx, by, boxS, ink);
        var t = nowMs() / 1000, r = boxS * 0.045, i;
        g.save(); g.beginPath(); g.rect(bx, by, boxS, boxS); g.clip();
        for (i = 0; i < N; i++) {
          var hA = home(sA, i), hB = home(sB, i);
          var hx = hA[0] + (hB[0] - hA[0]) * e, hy = hA[1] + (hB[1] - hA[1]) * e;
          var px = bx + (hx + amp * Math.sin(t * spd + PH[i])) * boxS;
          var py = by + (hy + amp * Math.sin(t * spd * 1.27 + PH2[i])) * boxS;
          disc(g, px, py, r, theme);
        }
        g.restore();
        label(g, '同樣的粒子，加熱後動得越快、排列越鬆', 8, by + boxS + 18, ink, 10.5, 'left');
      }
    });
  }

  // ====================================================================
  // 場景 7：水循環——太陽曬海→水蒸氣上升（蒸發）→高空變冷凝結成雲（凝結）→
  //   降水（雨）→雨水流進河、流回海洋→不斷重複。在 蒸發 / 凝結成雲 / 降水 /
  //   流回海洋 四個具名狀態各停留，當前過程變亮、其餘變淡（但一直在動＝水不停循環）。
  //   教學點：水一直在天地間循環、用不完。
  //   reduced-motion：一張清楚的循環圖，箭頭繞一圈標出四個過程。
  // ====================================================================
  function waterCycle(host: HTMLElement) {
    var SEA = '#0369a1', SEA_T = 'rgba(3,105,161,0.16)';
    var VAPOR = '#38bdf8', CLOUD = '#cbd5e1', CLOUD_HI = '#eef2f7';
    var RAIN = '#2563eb', RIVER = '#0891b2';
    var NAMES = ['蒸發：海水曬熱變水蒸氣上升', '凝結成雲：高空變冷，水氣聚成雲', '降水：水滴變大，落下成雨', '流回海洋：雨水流進河、回到海'];

    function geom(w: number, h: number) {
      return {
        seaY: h * 0.70, sunX: w * 0.86, sunY: h * 0.16,
        cx: w * 0.42, cy: h * 0.22, cs: Math.min(w, h) * 0.12,
        peakX: w * 0.17, peakY: h * 0.34, baseR: w * 0.42
      };
    }
    function cloud(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, alpha: number) {
      g.save(); g.globalAlpha = alpha;
      disc(g, cx - s * 0.95, cy + s * 0.18, s * 0.6, CLOUD);
      disc(g, cx - s * 0.3, cy - s * 0.12, s * 0.82, CLOUD);
      disc(g, cx + s * 0.45, cy - s * 0.02, s * 0.72, CLOUD);
      disc(g, cx + s * 1.0, cy + s * 0.2, s * 0.52, CLOUD);
      g.fillStyle = CLOUD; g.fillRect(cx - s * 0.95, cy + s * 0.02, s * 1.95, s * 0.52);
      disc(g, cx - s * 0.25, cy - s * 0.2, s * 0.4, CLOUD_HI);   // 柔和高光
      g.restore();
    }
    function mountain(g: CanvasRenderingContext2D, G: ReturnType<typeof geom>) {
      g.save(); g.fillStyle = EARTH_LAND; g.globalAlpha = 0.85;
      g.beginPath(); g.moveTo(0, G.seaY); g.lineTo(G.peakX, G.peakY); g.lineTo(G.baseR, G.seaY); g.closePath(); g.fill();
      g.restore();
    }
    function sea(g: CanvasRenderingContext2D, w: number, h: number, G: ReturnType<typeof geom>) {
      g.save();
      g.fillStyle = SEA_T; g.fillRect(0, G.seaY, w, h - G.seaY);
      g.strokeStyle = SEA; g.globalAlpha = 0.6; g.lineWidth = 2;
      g.beginPath(); g.moveTo(0, G.seaY); g.lineTo(w, G.seaY); g.stroke();
      g.restore();
    }
    function arrow(g: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, alpha: number) {
      g.save(); g.globalAlpha = alpha; g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 2.6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      var a = Math.atan2(y2 - y1, x2 - x1);
      g.beginPath(); g.moveTo(x2, y2);
      g.lineTo(x2 - 9 * Math.cos(a - 0.42), y2 - 9 * Math.sin(a - 0.42));
      g.lineTo(x2 - 9 * Math.cos(a + 0.42), y2 - 9 * Math.sin(a + 0.42));
      g.closePath(); g.fill(); g.restore();
    }

    return runScene(host, {
      durationMs: 12000, loops: 2, staticPhase: 0,
      keyStates: [0, 0.25, 0.5, 0.75], segMs: 1150, dwellMs: 1400,
      label: '水循環動畫：太陽曬熱海水，水變成水蒸氣往上升（蒸發）；升到高空變冷，凝結成小水滴聚成雲（凝結成雲）；水滴變大掉下來成雨（降水）；雨水流進河川、流回海洋，然後又被曬蒸發……一直循環，所以地球的水用不完。',
      drawStatic: function (g, w, h) {
        var ink = inkColor(), theme = themeColor();
        var G = geom(w, h);
        G.cy = h * 0.33;   // 靜態圖把雲降低一點，讓標題與「凝結成雲」標籤不重疊
        sea(g, w, h, G); mountain(g, G);
        sunDisc(g, G.sunX, G.sunY, 9);
        cloud(g, G.cx, G.cy, G.cs, 1);
        label(g, '水一直在天地間循環、用不完', w / 2, 12, theme, 12, 'center');
        arrow(g, w * 0.72, G.seaY - 6, G.cx + G.cs * 0.7, G.cy + G.cs * 0.5, VAPOR, 1);   // 蒸發 ↑
        arrow(g, G.cx - G.cs * 0.2, G.cy + G.cs * 0.6, w * 0.26, G.seaY - 6, RAIN, 1);    // 降水 ↓
        arrow(g, w * 0.24, G.seaY + 12, w * 0.44, G.seaY + 12, RIVER, 1);                 // 流回海洋 →
        label(g, '蒸發', w * 0.64, (G.seaY + G.cy) / 2, VAPOR, 11, 'center');
        label(g, '凝結成雲', G.cx, G.cy - G.cs - 5, ink, 11, 'center');
        label(g, '降水', w * 0.19, (G.seaY + G.cy) / 2 + 8, RAIN, 11, 'center');
        label(g, '流回海洋', w * 0.34, G.seaY + 24, RIVER, 11, 'center');
        label(g, '海洋', w * 0.72, G.seaY + 20, SEA, 10.5, 'center');
      },
      draw: function (g, phase, w, h) {
        var ink = inkColor(), theme = themeColor();
        var G = geom(w, h);
        var t = nowMs() / 1000;
        var stg = Math.round((((phase % 1) + 1) % 1) * 4) % 4;
        function em(k: number): number { return stg === k ? 1 : 0.4; }
        var aEvap = em(0), aCloud = em(1), aRain = em(2), aFlow = em(3);
        sea(g, w, h, G); mountain(g, G);
        sunDisc(g, G.sunX, G.sunY, 9);
        // 蒸發：水蒸氣從海面（右、太陽下）升起、飄向雲。
        var nv = 7, v;
        for (v = 0; v < nv; v++) {
          var u = ((t * 0.22 + v / nv) % 1);
          var sx = w * (0.55 + 0.33 * (v / (nv - 1)));
          var vx = sx + (G.cx + G.cs * 0.4 - sx) * easeInOut(u);
          var vy = G.seaY - (G.seaY - (G.cy + G.cs * 0.4)) * u;
          g.save(); g.globalAlpha = aEvap * Math.sin(Math.PI * u) * 0.9;
          disc(g, vx, vy, 2.8 * (1 - 0.4 * u), VAPOR); g.restore();
        }
        // 雲（凝結時變亮、略大，含柔和脈動）。
        var grow = 1 + 0.06 * Math.sin(t * 1.6) + (stg === 1 ? 0.08 : 0);
        cloud(g, G.cx, G.cy, G.cs * grow, 0.55 + 0.45 * aCloud);
        // 降水：雨滴從雲底落向地面／海面。
        var nr = 8, d, cloudBot = G.cy + G.cs * 0.55, targetY = G.seaY - 2;
        g.save(); g.globalAlpha = aRain; g.strokeStyle = RAIN; g.lineWidth = 1.8; g.lineCap = 'round';
        for (d = 0; d < nr; d++) {
          var rr = ((t * 0.7 + d / nr) % 1);
          var rx = G.cx - G.cs * 0.9 + (G.cs * 1.8) * (d / (nr - 1));
          var ry = cloudBot + rr * (targetY - cloudBot);
          g.beginPath(); g.moveTo(rx, ry); g.lineTo(rx, ry + 6); g.stroke();
        }
        g.restore();
        // 流回海洋：河水沿山的右坡往下流進海。
        var r0x = G.peakX + w * 0.02, r0y = G.peakY + h * 0.05, r1x = w * 0.36, r1y = G.seaY;
        g.save(); g.globalAlpha = 0.35 * aFlow + 0.12; g.strokeStyle = RIVER; g.lineWidth = 3.2; g.lineCap = 'round';
        g.beginPath(); g.moveTo(r0x, r0y); g.lineTo(r1x, r1y); g.stroke(); g.restore();
        var nf = 6, f;
        for (f = 0; f < nf; f++) {
          var fsg = ((t * 0.55 + f / nf) % 1);
          var fx = r0x + (r1x - r0x) * fsg, fy = r0y + (r1y - r0y) * fsg;
          g.save(); g.globalAlpha = aFlow; disc(g, fx, fy, 2.4, RIVER); g.restore();
        }
        // 標題（當前過程）、海洋標籤、教學句（靠左，避開右下角重播鈕）。
        label(g, NAMES[stg], w / 2, 14, theme, 12.5, 'center');
        label(g, '海洋', w * 0.72, G.seaY + 18, SEA, 10, 'center');
        label(g, '水一直在天地間循環、用不完', 8, h - 8, ink, 10.5, 'left');
      }
    });
  }

  // ===== bio scenes (merged) =====
  // ===== biology scene (merged from domain builder) =====
  // 光合作用自然色：葉綠、養分（葡萄糖）琥珀棕；二氧化碳灰、水藍、氧氣青——各流一色＝圖例。
  var LEAF_FILL = 'rgba(76,175,114,0.92)', LEAF_EDGE = '#2f8f5b', LEAF_VEIN = 'rgba(47,143,91,0.75)';
  var CO2_COL = '#8b94a6', WATER_COL = '#2b74e0', O2_COL = '#14a3b8', SUGAR_COL = '#d98324';

  // ====================================================================
  // 場景 6：光合作用——葉子在中間。原料流進來：陽光（上）、二氧化碳（空氣）、水（根→上）；
  //   葉子做出養分（葡萄糖，儲存在葉內）並放出氧氣。分三個停留階段：
  //   ① 吸收陽光 → ② 吸入 CO₂＋吸水 → ③ 做出養分、放出氧氣。
  //   每條流用不同顏色＋就近標字（＝色彩圖例）；底部一句總結（靠左，避開右下角重播鈕）。
  //   科學正確：原料是光＋CO₂＋水，產物是養分（葡萄糖）＋氧氣，植物不是「吃土」。
  // ====================================================================
  function photosynthesis(host: HTMLElement) {
    function clamp01(x: number): number { return x < 0 ? 0 : (x > 1 ? 1 : x); }
    // 透明度版文字（label 本身不吃 alpha；分階段淡入時用這個）。
    function tlabel(g: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size: number, align: CanvasTextAlign, alpha: number) {
      if (alpha <= 0.02) return;
      g.save(); g.globalAlpha = alpha; label(g, text, x, y, color, size, align); g.restore();
    }
    // 一片葉子（lens 形）：心 (cx,cy)、半寬 rx、半長 ry、傾角 rot；glow>0 時加暖色光暈（做養分時發亮）。
    function leaf(g: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, rot: number, s: number, glow: number) {
      if (glow > 0) { g.save(); g.globalAlpha = 0.3 * glow; disc(g, cx, cy, Math.max(rx, ry) * 1.5, SUN_GLOW); g.restore(); }
      g.save(); g.translate(cx, cy); g.rotate(rot);
      g.beginPath();
      g.moveTo(0, -ry);
      g.quadraticCurveTo(rx, -ry * 0.1, 0, ry);
      g.quadraticCurveTo(-rx, -ry * 0.1, 0, -ry);
      g.closePath();
      g.fillStyle = LEAF_FILL; g.fill();
      g.strokeStyle = LEAF_EDGE; g.lineWidth = 2 * s; g.lineJoin = 'round'; g.stroke();
      g.strokeStyle = LEAF_VEIN; g.lineWidth = 1.4 * s; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, -ry * 0.86); g.lineTo(0, ry * 0.86); g.stroke();   // 主脈
      var vi;
      for (vi = -2; vi <= 2; vi++) {
        if (vi === 0) continue;
        var vy = ry * 0.3 * vi;
        g.beginPath(); g.moveTo(0, vy); g.lineTo((vi < 0 ? -1 : 1) * rx * 0.6, vy + ry * 0.16); g.stroke();
      }
      g.restore();
    }
    // 一條「流動的點」：沿 (ax,ay)→(bx,by)，phase 連續時間推進；端點淡出；終點畫箭頭。act＝活化程度。
    function flow(g: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, color: string, phase: number, n: number, r: number, act: number) {
      if (act <= 0.02) return;
      var i;
      g.save();
      for (i = 0; i < n; i++) {
        var f = (i / n + phase) % 1;
        var x = ax + (bx - ax) * f, y = ay + (by - ay) * f;
        g.globalAlpha = act * (0.35 + 0.6 * Math.sin(f * Math.PI));
        disc(g, x, y, r, color);
      }
      var ang = Math.atan2(by - ay, bx - ax);
      g.globalAlpha = act; g.fillStyle = color;
      g.beginPath();
      g.moveTo(bx, by);
      g.lineTo(bx - r * 3 * Math.cos(ang - 0.5), by - r * 3 * Math.sin(ang - 0.5));
      g.lineTo(bx - r * 3 * Math.cos(ang + 0.5), by - r * 3 * Math.sin(ang + 0.5));
      g.closePath(); g.fill();
      g.restore();
    }
    // 葡萄糖顆粒（六邊形）＝養分，儲存在葉子裡；sc 控制出現比例。
    function sugar(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, sc: number) {
      if (sc <= 0.02) return;
      var rr = r * sc, k;
      g.save(); g.globalAlpha = sc; g.fillStyle = SUGAR_COL; g.strokeStyle = '#9a5b12'; g.lineWidth = 1.2;
      g.beginPath();
      for (k = 0; k < 6; k++) {
        var a = -Math.PI / 2 + k * Math.PI / 3;
        var x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a);
        if (k === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.closePath(); g.fill(); g.stroke();
      g.restore();
    }
    // 靜態圖箭頭（reduced-motion）。
    function sarrow(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string, s: number) {
      g.save(); g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 2.5 * s; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
      var ang = Math.atan2(y1 - y0, x1 - x0);
      g.beginPath(); g.moveTo(x1, y1);
      g.lineTo(x1 - 8 * s * Math.cos(ang - 0.4), y1 - 8 * s * Math.sin(ang - 0.4));
      g.lineTo(x1 - 8 * s * Math.cos(ang + 0.4), y1 - 8 * s * Math.sin(ang + 0.4));
      g.closePath(); g.fill(); g.restore();
    }

    // 動態主圖：植株（土壤/莖/根）＋太陽＋葉＋四條流（陽光/CO₂/水/氧氣）＋養分顆粒。
    function scene(g: CanvasRenderingContext2D, w: number, h: number, p: number) {
      var s = w / 330;
      var lx = w * 0.46, ly = h * 0.52, rx = w * 0.1, ry = h * 0.27, rot = -0.28;
      var sx = w * 0.15, sy = h * 0.15, soilY = h * 0.87;
      var tm = nowMs() / 1000;
      var actSun = clamp01((p - 0.02) / 0.12);
      var actIn = clamp01((p - 0.30) / 0.12);
      var actOut = clamp01((p - 0.63) / 0.12);

      // 土壤（虛線）＋莖＋根。
      g.save(); g.strokeStyle = 'rgba(140,94,55,0.35)'; g.lineWidth = 2.5 * s; g.setLineDash([3 * s, 4 * s]);
      g.beginPath(); g.moveTo(w * 0.16, soilY); g.lineTo(w * 0.72, soilY); g.stroke(); g.restore();
      g.save(); g.strokeStyle = '#9c6b3f'; g.lineWidth = 3 * s; g.lineCap = 'round';
      g.beginPath(); g.moveTo(lx, ly + ry * 0.55); g.lineTo(lx, soilY); g.stroke();   // 莖
      g.lineWidth = 2 * s; g.strokeStyle = 'rgba(140,94,55,0.9)';
      g.beginPath();
      g.moveTo(lx, soilY); g.lineTo(lx - 10 * s, soilY + 10 * s);
      g.moveTo(lx, soilY); g.lineTo(lx + 10 * s, soilY + 10 * s);
      g.moveTo(lx, soilY); g.lineTo(lx, soilY + 12 * s);
      g.stroke(); g.restore();

      sunDisc(g, sx, sy, 10 * s);
      label(g, '陽光', sx, sy + 20 * s, SUN, 11 * s, 'center');

      leaf(g, lx, ly, rx, ry, rot, s, actOut);

      // 原料：陽光（3 條平行、太陽→葉）。
      var tx = lx - rx * 0.4, ty = ly - ry * 0.45, ki;
      for (ki = -1; ki <= 1; ki++) {
        flow(g, sx + ki * 9 * s, sy + 10 * s + ki * 2 * s, tx + ki * 11 * s, ty, SUN, (tm * 0.5 + ki * 0.12) % 1, 3, 2.4 * s, actSun);
      }
      // 原料：二氧化碳（空氣→葉，右下方經氣孔進入）。
      flow(g, w * 0.92, h * 0.60, lx + rx * 0.9, ly + ry * 0.12, CO2_COL, (tm * 0.33) % 1, 5, 2.6 * s, actIn);
      tlabel(g, '二氧化碳 CO₂', w * 0.97, h * 0.52, CO2_COL, 10.5 * s, 'right', actIn);
      // 原料：水（根→葉，由下往上）。
      flow(g, lx, soilY - 2 * s, lx, ly + ry * 0.35, WATER_COL, (tm * 0.4) % 1, 5, 2.6 * s, actIn);
      tlabel(g, '水 H₂O', lx + 12 * s, h * 0.78, WATER_COL, 10.5 * s, 'left', actIn);

      // 產物：氧氣（葉→空氣，往右上冒出；標籤壓在上方標題之下，不互相重疊）。
      flow(g, lx + rx * 0.3, ly - ry * 0.35, w * 0.74, h * 0.16, O2_COL, (tm * 0.4) % 1, 5, 2.6 * s, actOut);
      tlabel(g, '氧氣 O₂', w * 0.80, h * 0.23, O2_COL, 10.5 * s, 'center', actOut);
      // 產物：養分（葡萄糖，儲存在葉內）＋引線到左側標籤。
      var gx = lx - rx * 0.15, gy = ly + ry * 0.18;
      sugar(g, gx, gy, 7 * s, actOut);
      var la = clamp01((actOut - 0.3) / 0.4);
      if (la > 0.02) {
        g.save(); g.globalAlpha = la; g.strokeStyle = SUGAR_COL; g.lineWidth = 1 * s;
        g.beginPath(); g.moveTo(gx - 8 * s, gy); g.lineTo(lx - rx - 6 * s, ly + ry * 0.35); g.stroke(); g.restore();
        tlabel(g, '養分（葡萄糖）', lx - rx - 8 * s, ly + ry * 0.35, SUGAR_COL, 10.5 * s, 'right', la);
      }
    }

    return runScene(host, {
      durationMs: 9000, loops: 2, staticPhase: 1,
      label: '光合作用動畫：葉子吸收陽光的能量，吸入空氣中的二氧化碳、根部吸水，然後做出養分（葡萄糖）儲存起來，同時放出氧氣。陽光是能量，二氧化碳和水是原料，養分和氧氣是產物。',
      drawStatic: function (g, w, h) {
        // reduced-motion：清楚的「原料 → 葉子 → 產物」標字圖（箭頭、色彩圖例）。
        var s = w / 330, ink = inkColor(), theme = themeColor();
        label(g, '光合作用：陽光＋二氧化碳＋水 → 養分＋氧氣', w / 2, 14 * s, theme, 11.5 * s, 'center');
        var lx = w * 0.5, ly = h * 0.54, rx = w * 0.08, ry = h * 0.2;
        leaf(g, lx, ly, rx, ry, 0, s, 1);
        sugar(g, lx, ly + ry * 0.15, 7 * s, 1);
        label(g, '葉子', lx, ly + ry + 14 * s, ink, 10.5 * s, 'center');
        var ins: [string, string, number][] = [['陽光', SUN, h * 0.34], ['二氧化碳 CO₂', CO2_COL, h * 0.54], ['水 H₂O', WATER_COL, h * 0.74]];
        ins.forEach(function (it) {
          label(g, it[0], 6 * s, it[2] - 10 * s, it[1], 10.5 * s, 'left');
          sarrow(g, w * 0.2, it[2], lx - rx - 2 * s, it[2], it[1], s);
        });
        var outs: [string, string, number][] = [['養分（葡萄糖）', SUGAR_COL, h * 0.44], ['氧氣 O₂', O2_COL, h * 0.66]];
        outs.forEach(function (it) {
          label(g, it[0], w - 6 * s, it[2] - 10 * s, it[1], 10.5 * s, 'right');
          sarrow(g, lx + rx + 2 * s, it[2], w * 0.82, it[2], it[1], s);
        });
        label(g, '陽光是能量，二氧化碳和水是原料，養分和氧氣是產物', 8 * s, h - 7 * s, theme, 9.5 * s, 'left');
      },
      draw: function (g, phase, w, h) {
        var theme = themeColor(), s = w / 330;
        scene(g, w, h, phase);
        var cap = phase < 0.30 ? '① 葉子吸收陽光的能量'
          : (phase < 0.63 ? '② 吸入二氧化碳，根部吸水' : '③ 做出養分（葡萄糖），放出氧氣');
        label(g, cap, w / 2, 15 * s, theme, 12.5 * s, 'center');
        label(g, '陽光＋二氧化碳＋水 → 養分（葡萄糖）＋氧氣', 8 * s, h - 7 * s, theme, 9.5 * s, 'left');
      }
    });
  }

  // ====================================================================
  // 場景：funcPlot — 直角坐標系上「動畫描點→連線」畫出函數（線性＋二次共用一座標引擎）。
  //   cfg = { kind:'linear'|'quadratic', m,b | a,b,c, highlight:'slope'|'intercept'|'vertex', label? }
  //   線性 'slope'：描點→連線→畫「右1上m」直角三角形（斜率＝上升÷水平）。
  //   線性 'intercept'：動畫把 b 從 0→2（線上移）、再把 m 從 1→2（線變陡），標 y 截距 (0, b)。
  //   二次 'vertex'：描出拋物線→落下對稱軸 x=−b/(2a)→標頂點。
  //   reduced-motion：畫最終曲線＋全部標註（staticPhase=1）。本場景參數化，兩課共用、不重造輪子。
  // ====================================================================
  function funcPlot(host: HTMLElement, cfg: any) {
    cfg = cfg || { kind: 'linear' };
    var kind = cfg.kind || 'linear';
    var hl = cfg.highlight || (kind === 'quadratic' ? 'vertex' : 'slope');
    var m = (typeof cfg.m === 'number') ? cfg.m : 2;
    var b = (typeof cfg.b === 'number') ? cfg.b : 1;
    var qa = (typeof cfg.a === 'number') ? cfg.a : 1;
    var qb = (typeof cfg.b === 'number') ? cfg.b : -4;
    var qc = (typeof cfg.c === 'number') ? cfg.c : 3;
    // 世界座標視窗（quadratic 對稱於頂點 x）。
    var wx0: number, wx1: number, wy0: number, wy1: number;
    if (kind === 'quadratic') { wx0 = -1; wx1 = 5; wy0 = -3; wy1 = 9; }
    else { wx0 = -5; wx1 = 5; wy0 = -5; wy1 = 5; }
    var padL = 24, padR = 16, padT = 30, padB = 22;
    var HLC = '#e11d48', HLC2 = '#0891b2';

    function mapX(x: number, w: number) { return padL + (x - wx0) / (wx1 - wx0) * (w - padL - padR); }
    function mapY(y: number, h: number) { return padT + (wy1 - y) / (wy1 - wy0) * (h - padT - padB); }

    function axes(g: CanvasRenderingContext2D, w: number, h: number, ink: string) {
      g.save();
      g.strokeStyle = ink;
      var ix: number, iy: number;
      g.lineWidth = 1; g.globalAlpha = 0.12;
      for (ix = Math.ceil(wx0); ix <= Math.floor(wx1); ix++) {
        g.beginPath(); g.moveTo(mapX(ix, w), mapY(wy1, h)); g.lineTo(mapX(ix, w), mapY(wy0, h)); g.stroke();
      }
      for (iy = Math.ceil(wy0); iy <= Math.floor(wy1); iy++) {
        g.beginPath(); g.moveTo(mapX(wx0, w), mapY(iy, h)); g.lineTo(mapX(wx1, w), mapY(iy, h)); g.stroke();
      }
      // 兩軸（深一點）。
      g.globalAlpha = 0.5; g.lineWidth = 1.6;
      var y0 = mapY(0, h), x0 = mapX(0, w);
      g.beginPath(); g.moveTo(mapX(wx0, w), y0); g.lineTo(mapX(wx1, w), y0); g.stroke();
      g.beginPath(); g.moveTo(x0, mapY(wy0, h)); g.lineTo(x0, mapY(wy1, h)); g.stroke();
      // 軸箭頭。
      g.fillStyle = ink; g.globalAlpha = 0.5;
      var ax = mapX(wx1, w), ay = mapY(wy1, h);
      g.beginPath(); g.moveTo(ax, y0); g.lineTo(ax - 7, y0 - 4); g.lineTo(ax - 7, y0 + 4); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(x0, ay); g.lineTo(x0 - 4, ay + 7); g.lineTo(x0 + 4, ay + 7); g.closePath(); g.fill();
      g.restore();
      label(g, 'x', ax - 4, y0 + 11, ink, 11, 'center');
      label(g, 'y', x0 - 10, ay + 4, ink, 11, 'center');
      label(g, 'O', x0 - 9, y0 + 10, ink, 10, 'center');
    }

    function lineAt(g: CanvasRenderingContext2D, w: number, h: number, mm: number, bb: number, color: string, prog: number) {
      // 由左向右畫線到 prog（0..1）。clip 到繪圖區避免溢出壓到軸標。
      g.save();
      g.beginPath(); g.rect(padL, padT, w - padL - padR, h - padT - padB); g.clip();
      var xr = wx0 + (wx1 - wx0) * Math.max(0, Math.min(1, prog));
      g.strokeStyle = color; g.lineWidth = 3; g.lineCap = 'round';
      g.beginPath(); g.moveTo(mapX(wx0, w), mapY(mm * wx0 + bb, h)); g.lineTo(mapX(xr, w), mapY(mm * xr + bb, h));
      g.stroke();
      g.restore();
    }

    function parabolaAt(g: CanvasRenderingContext2D, w: number, h: number, prog: number, color: string) {
      g.save();
      g.beginPath(); g.rect(padL, padT, w - padL - padR, h - padT - padB); g.clip();
      g.strokeStyle = color; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
      var xr = wx0 + (wx1 - wx0) * Math.max(0, Math.min(1, prog));
      g.beginPath();
      var started = false;
      for (var x = wx0; x <= xr + 1e-6; x += (wx1 - wx0) / 120) {
        var y = qa * x * x + qb * x + qc;
        var px = mapX(x, w), py = mapY(y, h);
        if (!started) { g.moveTo(px, py); started = true; } else { g.lineTo(px, py); }
      }
      g.stroke();
      g.restore();
    }

    function dot(g: CanvasRenderingContext2D, w: number, h: number, x: number, y: number, color: string) {
      disc(g, mapX(x, w), mapY(y, h), 4.5, color);
    }

    // ---- 線性：斜率 -------------------------------------------------
    function drawSlope(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      axes(g, w, h, ink);
      // 圖例。
      label(g, '直線 y = ' + m + 'x + ' + b, w / 2, 12, theme, 12.5, 'center');
      // 階段：描點(0..0.4) → 連線(0.4..0.7) → 直角三角形(0.7..1)。
      var nDots = 0;
      var xsInRange: number[] = [];
      for (var xi = Math.ceil(wx0); xi <= Math.floor(wx1); xi++) {
        var yi = m * xi + b;
        if (yi >= wy0 && yi <= wy1) xsInRange.push(xi);
      }
      if (p < 0.4) {
        nDots = Math.round(xsInRange.length * (p / 0.4));
        for (var k = 0; k < nDots; k++) dot(g, w, h, xsInRange[k], m * xsInRange[k] + b, theme);
        label(g, '① 先在格子上描出一個個點', w / 2, h - 7, ink, 11, 'center');
      } else {
        for (var k2 = 0; k2 < xsInRange.length; k2++) dot(g, w, h, xsInRange[k2], m * xsInRange[k2] + b, theme);
        var lp = p < 0.7 ? easeInOut((p - 0.4) / 0.3) : 1;
        lineAt(g, w, h, m, b, theme, lp);
        if (p < 0.7) {
          label(g, '② 把點連成一條直線', w / 2, h - 7, ink, 11, 'center');
        } else {
          // 直角三角形：從 (0,b) 右 1 到 (1,b)，再上 m 到 (1,b+m)。
          var x1 = 0, y1 = b, x2 = 1, y2 = b + m;
          g.save(); g.strokeStyle = HLC; g.lineWidth = 2.5; g.lineCap = 'round';
          g.beginPath(); g.moveTo(mapX(x1, w), mapY(y1, h)); g.lineTo(mapX(x2, w), mapY(y1, h)); g.stroke();
          g.beginPath(); g.moveTo(mapX(x2, w), mapY(y1, h)); g.lineTo(mapX(x2, w), mapY(y2, h)); g.stroke();
          g.restore();
          dot(g, w, h, x1, y1, HLC);
          label(g, '右 1', (mapX(x1, w) + mapX(x2, w)) / 2, mapY(y1, h) + 12, HLC, 11, 'center');
          label(g, '上 ' + m, mapX(x2, w) + 16, (mapY(y1, h) + mapY(y2, h)) / 2, HLC, 11, 'left');
          label(g, '斜率 = 上升 ÷ 水平 = ' + m + ' ÷ 1 = ' + m, w / 2, h - 7, HLC, 11.5, 'center');
        }
      }
    }

    // ---- 線性：截距（b 0→2，再 m 1→2）-----------------------------
    function drawIntercept(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      axes(g, w, h, ink);
      var mm: number, bb: number, cap: string;
      if (p < 0.5) {
        bb = 0 + 2 * easeInOut(p / 0.5); mm = 1;
        cap = 'b 從 0 升到 ' + bb.toFixed(1) + '：整條線往上平移';
      } else {
        bb = 2; mm = 1 + 1 * easeInOut((p - 0.5) / 0.5);
        cap = 'm 從 1 變 ' + mm.toFixed(1) + '：線繞截距變陡';
      }
      label(g, '直線 y = ' + mm.toFixed(1) + 'x + ' + bb.toFixed(1), w / 2, 12, theme, 12.5, 'center');
      lineAt(g, w, h, mm, bb, theme, 1);
      // y 截距點。
      dot(g, w, h, 0, bb, HLC);
      label(g, '截距 (0, ' + bb.toFixed(1) + ')', mapX(0, w) + 8, mapY(bb, h) - 10, HLC, 11, 'left');
      label(g, cap, w / 2, h - 7, ink, 11, 'center');
    }

    // ---- 二次：頂點 -------------------------------------------------
    function drawVertex(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      axes(g, w, h, ink);
      var vx = -qb / (2 * qa), vy = qa * vx * vx + qb * vx + qc;
      label(g, '拋物線 y = x² − 4x + 3', w / 2, 12, theme, 12.5, 'center');
      var pprog = p < 0.55 ? (p / 0.55) : 1;
      parabolaAt(g, w, h, pprog, theme);
      if (p >= 0.55) {
        // 對稱軸由上往下落。
        var axP = p < 0.78 ? easeInOut((p - 0.55) / 0.23) : 1;
        g.save(); g.strokeStyle = HLC2; g.lineWidth = 2; g.setLineDash([5, 4]);
        var topY = mapY(wy1, h), botY = mapY(wy1 - (wy1 - wy0) * axP, h);
        g.beginPath(); g.moveTo(mapX(vx, w), topY); g.lineTo(mapX(vx, w), botY); g.stroke();
        g.restore();
      }
      if (p >= 0.78) {
        label(g, '對稱軸 x = 2', mapX(vx, w) + 6, mapY(wy1 - 0.6, h), HLC2, 10.5, 'left');
        dot(g, w, h, vx, vy, HLC);
        label(g, '頂點 (' + vx + ', ' + vy + ')', mapX(vx, w) + 8, mapY(vy, h) + 13, HLC, 11.5, 'left');
        label(g, '頂點 x = −b ÷ (2a) = 4 ÷ 2 = 2', w / 2, h - 7, HLC, 11, 'center');
      } else {
        label(g, '描出開口向上的拋物線', w / 2, h - 7, ink, 11, 'center');
      }
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      if (kind === 'quadratic') drawVertex(g, p, w, h);
      else if (hl === 'intercept') drawIntercept(g, p, w, h);
      else drawSlope(g, p, w, h);
    }

    return runScene(host, {
      durationMs: kind === 'quadratic' ? 7000 : 6500, loops: 2, staticPhase: 1,
      label: cfg.label || (kind === 'quadratic'
        ? '二次函數動畫：描出拋物線 y=x²−4x+3，落下對稱軸 x=2，標出頂點 (2, −1)（最低點）。'
        : (hl === 'intercept'
          ? '線性函數動畫：先把截距 b 從 0 升到 2 讓直線往上平移，再把斜率 m 從 1 變 2 讓線變陡。'
          : '斜率動畫：先在格子上描點、連成直線 y=2x+1，再用「右 1、上 2」的直角三角形示意斜率＝上升÷水平＝2。')),
      draw: draw
    });
  }

  // ====================================================================
  // 場景：trigTriangle — 直角三角形，動畫讓角 θ 從小長到目標角，標對/鄰/斜與 sin/cos/tan。
  //   cfg = { show:'all'|'sin'|'cos'|'tan', label? }（三角形固定為 3-4-5，θ≈37°；不吃 angleDeg）
  //   以 3-4-5 直角三角形示意（鄰邊 4、對邊 3、斜邊 5、θ≈37°）；對邊由 0 長到 3。
  //   reduced-motion：直接畫目標角＋全部標註（staticPhase=1）。未來高中弧度/單位圓可延伸同一場景。
  // ====================================================================
  function trigTriangle(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var show = cfg.show || 'all';
    var ADJ = 4, OPP = 3;                    // 3-4-5（斜邊 5）；θ=atan(3/4)≈36.87°≈37°
    var OPPC = '#e11d48', ADJC = '#0891b2';  // 對邊＝紅、鄰邊＝青、斜邊＝主題色

    function draw(g: CanvasRenderingContext2D, p: number, _w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      var u = 30;                             // 每單位像素（三角形留在左半，右半放比值面板）
      var ax = 14, ay = h - 30;               // 左下角頂點 A（θ 在這裡）
      var bx = ax + ADJ * u, by = ay;         // 右下角 B（直角）；bx=134
      // 對邊依動畫進度長高。
      var grow = Math.max(0, Math.min(1, p / 0.6));
      var opp = OPP * grow;
      var cy = by - opp * u;                  // 頂點 C 高度
      // 三角形三邊。
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 3;
      g.strokeStyle = ADJC;                    // 鄰邊（底）
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
      g.strokeStyle = OPPC;                    // 對邊（右）
      g.beginPath(); g.moveTo(bx, by); g.lineTo(bx, cy); g.stroke();
      g.strokeStyle = theme;                   // 斜邊
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, cy); g.stroke();
      g.restore();
      // 直角標記（在 B）。
      if (opp > 0.2) {
        g.save(); g.strokeStyle = ink; g.globalAlpha = 0.6; g.lineWidth = 1.4;
        g.strokeRect(bx - 9, by - 9, 9, 9); g.restore();
      }
      // θ 角弧（在 A）。
      var ang = Math.atan2(opp * u, ADJ * u);
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.75; g.lineWidth = 1.6;
      g.beginPath(); g.arc(ax, ay, 22, -ang, 0); g.stroke(); g.restore();
      label(g, 'θ', ax + 30, ay - 8, ink, 12, 'left');
      // 邊標。
      label(g, '鄰邊 4', (ax + bx) / 2, by + 14, ADJC, 11.5, 'center');
      if (opp > 1) label(g, '對邊 3', bx + 6, (by + cy) / 2, OPPC, 11.5, 'left');
      if (grow >= 1) label(g, '斜邊 5', (ax + bx) / 2 - 20, (ay + cy) / 2 - 6, theme, 11.5, 'center');
      // 比值面板（右側，整塊在 x≥170，留在 300 寬畫布內）。show 控制顯示哪幾個。
      var rx = 170;
      if (grow >= 1) {
        label(g, 'SOH-CAH-TOA', rx, 26, ink, 12, 'left');
        var lines: [string, string][] = [];
        if (show === 'all' || show === 'sin') lines.push(['sin θ = 對/斜 = 3/5', OPPC]);
        if (show === 'all' || show === 'cos') lines.push(['cos θ = 鄰/斜 = 4/5', ADJC]);
        if (show === 'all' || show === 'tan') lines.push(['tan θ = 對/鄰 = 3/4', theme]);
        for (var i = 0; i < lines.length; i++) label(g, lines[i][0], rx, 50 + i * 22, lines[i][1], 11.5, 'left');
      } else {
        label(g, '角 θ 慢慢長大…', rx, 26, ink, 11.5, 'left');
      }
    }

    return runScene(host, {
      durationMs: 5200, loops: 2, staticPhase: 1,
      label: cfg.label || '三角比動畫：直角三角形的角 θ 從小長大到約 37°（3-4-5 直角三角形），同步標出對邊 3、鄰邊 4、斜邊 5 與 sin=對/斜=3/5、cos=鄰/斜=4/5、tan=對/鄰=3/4。',
      draw: draw
    });
  }

  // ====================================================================
  // 場景：barGrow — 一組長條／直方圖動畫長高（參數化，多課＋ data-literacy 共用）。
  //   cfg = { values:number[], labels:string[], mode:'histogram'|'bar',
  //           misleadAxis:boolean, yStart:number, toggle:boolean,
  //           callouts:string[], unit:string, label?:string }
  //   mode 'histogram'：長條相鄰相連（連續資料分組）；'bar'：長條分開（不同類別）。
  //   misleadAxis：y 軸先從 yStart 起跳（放大假差距），再動畫把軸拉回 0 還原真相。
  //   toggle：供 data-literacy 做零基準↔截斷切換（沿用同一套還原動畫、重複播放）。
  //   畫框尺寸固定、只有長條高度與軸刻度在變（截斷軸示範全程不改畫布大小）。
  //   reduced-motion：staticPhase=1 → 畫軸從 0 的最終長條＋刻度（真相版）。
  // ====================================================================
  function barGrow(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var values: number[] = cfg.values || [3, 5, 9, 7, 4];
    var labels: string[] = cfg.labels || [];
    var mode: string = cfg.mode || 'histogram';
    var animateAxis: boolean = !!cfg.misleadAxis || !!cfg.toggle;
    var yStart0: number = (typeof cfg.yStart === 'number') ? cfg.yStart : 0;
    var callouts: string[] = cfg.callouts || [];
    var unit: string = cfg.unit || '';
    var n = values.length;
    var maxV = values.reduce(function (a, b) { return Math.max(a, b); }, -Infinity);
    var yTop = animateAxis ? maxV + (maxV - yStart0) * 0.18 : Math.ceil(maxV * 1.14);
    if (!isFinite(yTop) || yTop <= yStart0) yTop = yStart0 + 1;
    var WARN = '#e11d48';

    function fmt(x: number): string { return (Math.round(x) === x) ? ('' + x) : x.toFixed(1); }

    function axisStartAt(p: number): number {
      if (!animateAxis) return 0;
      var hold = 0.4;
      if (p < hold) return yStart0;
      return yStart0 * (1 - easeInOut((p - hold) / (1 - hold)));
    }

    function drawBars(g: CanvasRenderingContext2D, rx0: number, ry0: number, rx1: number, ry1: number,
      axisStart: number, growFn: ((i: number) => number) | null) {
      var ink = inkColor(), theme = themeColor();
      var plotH = ry1 - ry0, slotW = (rx1 - rx0) / n;
      var warnOn = animateAxis && axisStart > yStart0 * 0.5 + 0.0001 && axisStart > 0.0001;
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.55; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(rx0, ry0); g.lineTo(rx0, ry1); g.lineTo(rx1, ry1); g.stroke(); g.restore();
      label(g, fmt(axisStart), rx0 - 4, ry1, warnOn ? WARN : ink, 10, 'right');
      label(g, fmt(yTop), rx0 - 4, ry0 + 4, ink, 10, 'right');
      for (var i = 0; i < n; i++) {
        var frac = (values[i] - axisStart) / (yTop - axisStart);
        frac = Math.max(0, Math.min(1, frac));
        var gf = growFn ? growFn(i) : 1;
        var barH = plotH * frac * gf;
        var bw = (mode === 'bar') ? slotW * 0.56 : slotW * 0.98;
        var bx = rx0 + i * slotW + (slotW - bw) / 2;
        var by = ry1 - barH;
        var col = warnOn ? WARN : theme;
        g.save();
        g.fillStyle = col; g.globalAlpha = 0.82; g.fillRect(bx, by, bw, barH);
        g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 1; g.strokeRect(bx, by, bw, barH);
        g.restore();
        if (gf > 0.98 && barH > 6) label(g, fmt(values[i]) + unit, bx + bw / 2, by - 7, ink, 10, 'center');
        if (labels[i]) label(g, labels[i], bx + bw / 2, ry1 + 12, ink, 9.5, 'center');
        if (callouts[i]) label(g, callouts[i], bx + bw / 2, ry0 - 2, theme, 9.5, 'center');
      }
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      var px0 = 36, py0 = 26, px1 = w - 14, py1 = h - 30;
      var title = animateAxis ? '看圖先看 y 軸的起點！'
        : (mode === 'histogram' ? '直方圖：連續資料分組' : '長條圖：不同類別比較');
      label(g, title, w / 2, 13, theme, 12.5, 'center');
      var ax0 = axisStartAt(p);
      var growFn: ((i: number) => number) | null = null;
      if (!animateAxis) {
        growFn = function (i) {
          var stagger = 0.5 / Math.max(1, n);
          return easeInOut(Math.max(0, Math.min(1, (p - i * stagger) / 0.45)));
        };
      }
      drawBars(g, px0, py0, px1, py1, ax0, growFn);
      var cap: string, capCol: string;
      if (animateAxis) {
        if (ax0 > yStart0 * 0.5 + 0.0001) { cap = 'y 軸從 ' + fmt(ax0) + ' 起跳——差距看起來超大！'; capCol = WARN; }
        else if (ax0 > 0.5) { cap = '正在把軸拉回 0……'; capCol = theme; }
        else { cap = '軸從 0 看：其實差不多高！'; capCol = theme; }
      } else {
        cap = (mode === 'histogram') ? '長條相鄰相連＝連續資料分組看形狀' : '長條分開＝各自獨立的類別';
        capCol = ink;
      }
      label(g, cap, w / 2, h - 8, capCol, 11, 'center');
    }

    return runScene(host, {
      durationMs: animateAxis ? 5200 : 4200, loops: 2, staticPhase: 1,
      label: cfg.label || (animateAxis
        ? '誤導圖表動畫：y 軸先從 ' + fmt(yStart0) + ' 起跳，長條差距看起來很大；再把軸拉回 0，長條其實差不多高——截斷 y 軸會放大差異。'
        : (mode === 'histogram'
          ? '直方圖動畫：各組長條依次長高、長條相鄰相連，呈現連續資料分組後的分布形狀。'
          : '長條圖動畫：各類別的長條分開、依次長高，用來比較不同類別的數量。')),
      draw: draw
    });
  }

  // ====================================================================
  // 場景：boxplotBuild — 數線上資料點排序→框出五數→畫盒鬚圖（本 spec 專用）。
  //   cfg = { data:number[] | number[][], showIQR:boolean, label?:string }
  //   單組：動畫描點→排序→框五數（最小・Q1・中位數・Q3・最大）→畫盒鬚。
  //   showIQR + 兩組資料（data 傳巢狀陣列）：並列兩個盒鬚，對比 IQR（Q3−Q1）與全距（max−min）長度。
  //   五數法＝中位數分兩半、下半中位數為 Q1、上半中位數為 Q3（奇數排除正中；Tukey 法）。
  //   reduced-motion：staticPhase=1 → 畫完整五數盒鬚。
  // ====================================================================
  function boxplotBuild(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var raw: any = cfg.data || [2, 4, 5, 6, 8, 9, 11];
    var datasets: number[][] = (raw.length && Array.isArray(raw[0])) ? raw : [raw];
    var IQRC = '#0891b2', RANGEC = '#d97706', MEDC = '#e11d48';

    function fmt(x: number): string { return (Math.round(x) === x) ? ('' + x) : x.toFixed(1); }
    function med(a: number[]): number { var m = Math.floor(a.length / 2); return (a.length % 2) ? a[m] : (a[m - 1] + a[m]) / 2; }
    function five(a: number[]) {
      var s = a.slice().sort(function (x, y) { return x - y; });
      var nn = s.length, m = Math.floor(nn / 2);
      var lo = s.slice(0, m), hi = (nn % 2) ? s.slice(m + 1) : s.slice(m);
      return { min: s[0], q1: med(lo), med: med(s), q3: med(hi), max: s[nn - 1], sorted: s };
    }

    var allMin = Infinity, allMax = -Infinity;
    for (var d = 0; d < datasets.length; d++) {
      for (var k = 0; k < datasets[d].length; k++) { allMin = Math.min(allMin, datasets[d][k]); allMax = Math.max(allMax, datasets[d][k]); }
    }
    var sp = (allMax - allMin) || 1;
    var xMin = allMin - sp * 0.12, xMax = allMax + sp * 0.12;
    function mapX(v: number, px0: number, px1: number): number { return px0 + (v - xMin) / (xMax - xMin) * (px1 - px0); }

    function drawAxis(g: CanvasRenderingContext2D, px0: number, px1: number, ay: number, ink: string) {
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.5; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(px0, ay); g.lineTo(px1, ay); g.stroke(); g.restore();
    }

    function drawBox(g: CanvasRenderingContext2D, f: any, cy: number, px0: number, px1: number, prog: number, labelFive: boolean, tag: string) {
      var ink = inkColor(), theme = themeColor();
      var bh = 20;
      var xMinP = mapX(f.min, px0, px1), xMaxP = mapX(f.max, px0, px1);
      var xq1 = mapX(f.q1, px0, px1), xq3 = mapX(f.q3, px0, px1), xmed = mapX(f.med, px0, px1);
      var drawW = Math.max(0, Math.min(1, prog / 0.6));
      var curMax = xMinP + (xMaxP - xMinP) * drawW;
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.8; g.lineWidth = 1.6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(xMinP, cy); g.lineTo(curMax, cy); g.stroke();
      if (drawW > 0.02) { g.beginPath(); g.moveTo(xMinP, cy - 7); g.lineTo(xMinP, cy + 7); g.stroke(); }
      if (drawW >= 1) { g.beginPath(); g.moveTo(xMaxP, cy - 7); g.lineTo(xMaxP, cy + 7); g.stroke(); }
      g.restore();
      if (prog >= 0.4) {
        var ba = Math.max(0, Math.min(1, (prog - 0.4) / 0.3));
        g.save();
        g.fillStyle = theme; g.globalAlpha = 0.18 * ba; g.fillRect(xq1, cy - bh / 2, xq3 - xq1, bh);
        g.globalAlpha = 0.9; g.strokeStyle = theme; g.lineWidth = 1.8; g.strokeRect(xq1, cy - bh / 2, xq3 - xq1, bh);
        g.strokeStyle = MEDC; g.lineWidth = 2.2; g.beginPath(); g.moveTo(xmed, cy - bh / 2); g.lineTo(xmed, cy + bh / 2); g.stroke();
        g.restore();
      }
      if (tag) label(g, tag, px0 - 18, cy, ink, 11, 'center');
      if (labelFive && prog >= 0.6) {
        label(g, '最小 ' + fmt(f.min), xMinP, cy + bh / 2 + 14, ink, 9.5, 'center');
        label(g, 'Q1 ' + fmt(f.q1), xq1, cy - bh / 2 - 8, theme, 9.5, 'center');
        label(g, '中位數 ' + fmt(f.med), xmed, cy + bh / 2 + 14, MEDC, 9.5, 'center');
        label(g, 'Q3 ' + fmt(f.q3), xq3, cy - bh / 2 - 8, theme, 9.5, 'center');
        label(g, '最大 ' + fmt(f.max), xMaxP, cy + bh / 2 + 14, ink, 9.5, 'center');
      }
    }

    function drawBrackets(g: CanvasRenderingContext2D, f: any, cy: number, px0: number, px1: number, prog: number) {
      var xq1 = mapX(f.q1, px0, px1), xq3 = mapX(f.q3, px0, px1);
      var xmn = mapX(f.min, px0, px1), xmx = mapX(f.max, px0, px1);
      var ba = Math.max(0, Math.min(1, (prog - 0.5) / 0.5));
      if (ba <= 0) return;
      g.save(); g.globalAlpha = ba;
      var yI = cy - 18;
      g.strokeStyle = IQRC; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(xq1, yI + 4); g.lineTo(xq1, yI); g.lineTo(xq3, yI); g.lineTo(xq3, yI + 4); g.stroke();
      label(g, 'IQR=' + fmt(f.q3 - f.q1), (xq1 + xq3) / 2, yI - 7, IQRC, 9.5, 'center');
      var yR = cy + 20;
      g.strokeStyle = RANGEC; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(xmn, yR - 4); g.lineTo(xmn, yR); g.lineTo(xmx, yR); g.lineTo(xmx, yR - 4); g.stroke();
      label(g, '全距=' + fmt(f.max - f.min), (xmn + xmx) / 2, yR + 9, RANGEC, 9.5, 'center');
      g.restore();
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      var px0 = 46, px1 = w - 20;
      if (datasets.length === 1) {
        label(g, '盒狀圖：最小・Q1・中位數・Q3・最大', w / 2, 13, theme, 12, 'center');
        var f = five(datasets[0]);
        var cy = h * 0.5;
        drawAxis(g, px0, px1, cy, ink);
        var ptA = Math.max(0, Math.min(1, p / 0.3));
        var s = f.sorted;
        for (var i = 0; i < s.length; i++) {
          if (p < 0.3 && i / s.length > ptA) continue;
          disc(g, mapX(s[i], px0, px1), cy - 44, 3.2, (p < 0.4 ? theme : 'rgba(99,102,241,0.4)'));
        }
        label(g, (p < 0.4) ? '① 資料由小到大排好' : '② 框出五個數，盒子裝中間一半的資料', w / 2, h - 8, ink, 11, 'center');
        drawBox(g, f, cy, px0, px1, p, true, '');
      } else {
        label(g, '同樣多筆資料，比較「分散程度」', w / 2, 13, theme, 12, 'center');
        var tags = ['A', 'B', 'C', 'D'];
        var rows = datasets.length;
        for (var d2 = 0; d2 < rows; d2++) {
          var fy = five(datasets[d2]);
          var cy2 = 46 + d2 * ((h - 70) / rows) + ((h - 70) / rows) / 2;
          drawAxis(g, px0, px1, cy2, ink);
          drawBox(g, fy, cy2, px0, px1, Math.min(1, p * 1.1), false, tags[d2]);
          drawBrackets(g, fy, cy2, px0, px1, p);
        }
        label(g, 'IQR＝Q3−Q1（中間一半）｜全距＝最大−最小', w / 2, h - 8, ink, 10.5, 'center');
      }
    }

    return runScene(host, {
      durationMs: datasets.length > 1 ? 5200 : 6000, loops: 2, staticPhase: 1,
      label: cfg.label || (datasets.length > 1
        ? '盒狀圖比較動畫：並排兩組資料的盒鬚圖，對比四分位距 IQR（Q3−Q1，盒子寬度）與全距（最大−最小，兩鬚全長）的長度。'
        : '盒狀圖動畫：資料點由小到大排好，再框出最小、Q1、中位數、Q3、最大五個數，畫成盒鬚圖；盒子裝中間一半的資料。'),
      draw: draw
    });
  }

  // ====================================================================
  // 場景：scatterTrend — 散布圖的點逐一出現，再浮現趨勢（相關）方向（math-stats + data-literacy 共用）。
  //   cfg = { points:[[x,y]...](0..1 常態座標), r:'pos'|'neg'|'none'（或 mode 同義）,
  //           showLine:boolean, confound:{label,on}, xLabel, yLabel, label? }
  //   r 'pos' 右上正相關、'neg' 右下負相關、'none' 散成一團幾乎無相關。
  //   confound.on：浮現「共同原因」方框＋箭頭（相關≠因果；data-literacy 共用）。
  //   reduced-motion：staticPhase=1 → 畫全部點＋趨勢線（＋confound）。
  // ====================================================================
  function scatterTrend(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var r: string = cfg.r || cfg.mode || 'pos';
    var showLine: boolean = (cfg.showLine !== false);
    var confound: any = cfg.confound || null;
    var xLabel: string = cfg.xLabel || 'x';
    var yLabel: string = cfg.yLabel || 'y';
    var DOT = '#0891b2', WARN = '#e11d48';
    var defaults: { [k: string]: number[][] } = {
      pos: [[0.12, 0.18], [0.22, 0.3], [0.33, 0.27], [0.42, 0.46], [0.52, 0.5], [0.6, 0.62], [0.7, 0.58], [0.8, 0.78], [0.9, 0.83]],
      neg: [[0.12, 0.82], [0.22, 0.66], [0.33, 0.72], [0.42, 0.54], [0.52, 0.5], [0.6, 0.4], [0.7, 0.44], [0.8, 0.26], [0.9, 0.2]],
      none: [[0.15, 0.4], [0.25, 0.76], [0.35, 0.3], [0.46, 0.6], [0.5, 0.46], [0.6, 0.82], [0.68, 0.24], [0.78, 0.56], [0.88, 0.42]]
    };
    var pts: number[][] = cfg.points || defaults[r] || defaults.pos;
    var N = pts.length;

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      var px0 = 40, py0 = 24, px1 = w - 14, py1 = h - 40;
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.5; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(px0, py0); g.lineTo(px0, py1); g.lineTo(px1, py1); g.stroke(); g.restore();
      label(g, xLabel + ' →', (px0 + px1) / 2, py1 + 14, ink, 10.5, 'center');
      label(g, '↑ ' + yLabel, px0 + 2, py0 - 12, ink, 10.5, 'left');
      function mx(nx: number) { return px0 + nx * (px1 - px0); }
      function my(ny: number) { return py1 - ny * (py1 - py0); }
      var shown = Math.round(N * Math.max(0, Math.min(1, p / 0.55)));
      for (var i = 0; i < shown; i++) disc(g, mx(pts[i][0]), my(pts[i][1]), 4, DOT);
      var lineP = Math.max(0, Math.min(1, (p - 0.55) / 0.25));
      if (p >= 0.55 && showLine && r !== 'none') {
        var x1 = 0.1, y1 = (r === 'neg') ? 0.82 : 0.16, x2 = 0.9, y2 = (r === 'neg') ? 0.18 : 0.84;
        var ex = x1 + (x2 - x1) * lineP, ey = y1 + (y2 - y1) * lineP;
        g.save(); g.strokeStyle = theme; g.lineWidth = 2.4; g.setLineDash([6, 4]); g.lineCap = 'round';
        g.beginPath(); g.moveTo(mx(x1), my(y1)); g.lineTo(mx(ex), my(ey)); g.stroke(); g.restore();
      }
      var dir = (r === 'neg') ? '點大致往右下 → 負相關'
        : (r === 'none') ? '點散成一團 → 幾乎沒有相關' : '點大致往右上 → 正相關';
      var dcol = (r === 'none') ? ink : theme;
      var confP = Math.max(0, Math.min(1, (p - 0.8) / 0.2));
      if (confound && confound.on && p >= 0.8) {
        var bx = (px0 + px1) / 2, byv = py0 + 8;
        g.save();
        g.fillStyle = WARN; g.globalAlpha = 0.14 * confP; g.fillRect(bx - 72, byv - 11, 144, 22);
        g.globalAlpha = confP; g.strokeStyle = WARN; g.lineWidth = 1.4; g.strokeRect(bx - 72, byv - 11, 144, 22);
        label(g, '共同原因：' + (confound.label || '第三因素'), bx, byv, WARN, 10, 'center');
        g.strokeStyle = WARN; g.lineWidth = 1.3; g.setLineDash([3, 3]);
        g.beginPath(); g.moveTo(bx - 44, byv + 11); g.lineTo(px0 + 20, py1 - 6); g.stroke();
        g.beginPath(); g.moveTo(bx + 44, byv + 11); g.lineTo(px1 - 12, py0 + 34); g.stroke();
        g.restore();
      }
      var showCause = !!(confound && confound.on && p >= 0.9);
      label(g, showCause ? '相關 ≠ 因果：背後是第三因素' : dir, w / 2, h - 8, showCause ? WARN : dcol, 11, 'center');
    }

    return runScene(host, {
      durationMs: (confound && confound.on) ? 6400 : 5200, loops: 2, staticPhase: 1,
      label: cfg.label || ('散布圖動畫：'
        + (r === 'neg' ? ('點大致往右下，' + xLabel + '越大、' + yLabel + '越小，是負相關。')
          : r === 'none' ? ('點散成一團看不出方向，' + xLabel + '和' + yLabel + '幾乎沒有相關。')
            : ('點大致往右上，' + xLabel + '越大、' + yLabel + '也越大，是正相關。'))
        + ((confound && confound.on) ? ('但這只是相關：共同原因是「' + (confound.label || '第三因素') + '」，相關不等於因果。') : '')),
      draw: draw
    });
  }

  // ====================================================================
  // 場景：fallacySpotlight — 參數化「論證聚光燈」。把一段論證拆成兩個框，
  //   在中間標出紅色的「斷裂處」（論證毛病）。本頁（非形式謬誤）主用；
  //   core-argument-structure／core-fact-vs-opinion 之後可複用同場景顯示論證結構。
  //   cfg = {
  //     type:'strawman'|'adhominem'|'appeal'|'generic',
  //     left:{label,text},          // 左框（原本的主張／論點）
  //     right:{label,text},         // 右框（被扭曲的版本／被攻擊的對象）
  //     breakLabel,                 // 中間標紅的「斷裂處」說明
  //     panels:[{label,text}],      // 僅 appeal 用：三格並呈（名人／群眾／情緒）
  //     title, label                // 標題與無障礙描述
  //   }
  //   動畫：左框淡入 → 紅箭頭延伸 → 右框淡入＋紅色斷裂標記閃現（appeal 則三格依序淡入）。
  //   reduced-motion：staticPhase=1 → 一次畫完整單幀（框＋標紅斷裂處），不跑動畫。
  // ====================================================================
  function fallacySpotlight(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var WARN = '#e11d48';
    var type: string = cfg.type || 'generic';
    var leftC = cfg.left || { label: '原本的主張', text: '' };
    var rightC = cfg.right || { label: '被換掉的版本', text: '' };
    var breakLabel: string = cfg.breakLabel || '斷裂處：這裡偷換了';

    function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

    // 圓角矩形路徑。
    function roundRect(g: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, r: number) {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + bw, y, x + bw, y + bh, r);
      g.arcTo(x + bw, y + bh, x, y + bh, r);
      g.arcTo(x, y + bh, x, y, r);
      g.arcTo(x, y, x + bw, y, r);
      g.closePath();
    }

    // CJK 以字數斷行（框內文字很短，1–2 行）。
    function wrapCJK(text: string, maxChars: number): string[] {
      var lines: string[] = [], curln = '';
      for (var i = 0; i < text.length; i++) {
        curln += text.charAt(i);
        if (curln.length >= maxChars) { lines.push(curln); curln = ''; }
      }
      if (curln) lines.push(curln);
      return lines;
    }

    // 畫一個具名框（上緣標籤 chip ＋ 內文），alpha 控制淡入。
    function drawBox(g: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number,
      col: string, lbl: string, txt: string, alpha: number) {
      var ink = inkColor();
      g.save();
      g.globalAlpha = alpha * 0.12; g.fillStyle = col; roundRect(g, x, y, bw, bh, 11); g.fill();
      g.globalAlpha = alpha; g.lineWidth = 1.7; g.strokeStyle = col; roundRect(g, x, y, bw, bh, 11); g.stroke();
      g.restore();
      g.save(); g.globalAlpha = alpha;
      label(g, lbl, x + bw / 2, y + 15, col, 11, 'center');
      var lines = wrapCJK(txt, 7);
      var startY = y + bh / 2 - (lines.length - 1) * 8 + 7;
      for (var k = 0; k < lines.length; k++) label(g, lines[k], x + bw / 2, startY + k * 16, ink, 11.5, 'center');
      g.restore();
    }

    // 簡易「人」字形（訴諸人身：箭頭射向這個人而非論點）。
    function drawPerson(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, col: string, alpha: number) {
      g.save(); g.globalAlpha = alpha; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2;
      disc(g, cx, cy - s * 0.7, s * 0.42, col);
      g.beginPath(); g.moveTo(cx, cy - s * 0.3); g.lineTo(cx, cy + s * 0.4); g.stroke();
      g.beginPath(); g.moveTo(cx - s * 0.5, cy + s * 0.9); g.lineTo(cx, cy + s * 0.4); g.lineTo(cx + s * 0.5, cy + s * 0.9); g.stroke();
      g.beginPath(); g.moveTo(cx - s * 0.5, cy - s * 0.05); g.lineTo(cx + s * 0.5, cy - s * 0.05); g.stroke();
      g.restore();
    }

    // 紅色箭頭（代表「出毛病的那一步」），len 0..1 控制延伸長度。
    function drawRedArrow(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, len: number, alpha: number) {
      var ex = x0 + (x1 - x0) * len, ey = y0 + (y1 - y0) * len;
      g.save(); g.globalAlpha = alpha; g.strokeStyle = WARN; g.fillStyle = WARN; g.lineWidth = 2.6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(ex, ey); g.stroke();
      if (len > 0.92) {
        var ang = Math.atan2(y1 - y0, x1 - x0);
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x1 - 9 * Math.cos(ang - 0.4), y1 - 9 * Math.sin(ang - 0.4));
        g.lineTo(x1 - 9 * Math.cos(ang + 0.4), y1 - 9 * Math.sin(ang + 0.4));
        g.closePath(); g.fill();
      }
      g.restore();
    }

    // 紅色斷裂 chip（置底，標出論證毛病）。
    function drawBreakChip(g: CanvasRenderingContext2D, cx: number, cy: number, text: string, alpha: number) {
      var lines = wrapCJK(text, 15);
      var chW = 0; g.font = '700 10.5px system-ui, sans-serif';
      for (var i = 0; i < lines.length; i++) chW = Math.max(chW, g.measureText(lines[i]).width);
      chW += 26; var chH = lines.length * 15 + 10;
      g.save();
      g.globalAlpha = alpha * 0.14; g.fillStyle = WARN; roundRect(g, cx - chW / 2, cy - chH / 2, chW, chH, 8); g.fill();
      g.globalAlpha = alpha; g.lineWidth = 1.5; g.strokeStyle = WARN; roundRect(g, cx - chW / 2, cy - chH / 2, chW, chH, 8); g.stroke();
      var ty = cy - (lines.length - 1) * 7.5;
      for (var j = 0; j < lines.length; j++) label(g, lines[j], cx, ty + j * 15, WARN, 10.5, 'center');
      g.restore();
    }

    // --- 兩框流（strawman / adhominem / generic）---
    function drawTwoBox(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor();
      var leftA = easeInOut(clamp01(p / 0.33));
      var arrowA = clamp01((p - 0.33) / 0.33);
      var rightA = easeInOut(clamp01((p - 0.66) / 0.34));
      var breakA = easeInOut(clamp01((p - 0.72) / 0.28));
      var bw = w * 0.33, bh = h * 0.40;
      var boxY = h * 0.20;
      var leftX = w * 0.045, rightX = w - bw - w * 0.045;
      var rowY = boxY + bh / 2;
      // 左框：原本的主張／論點（主題色＝合理的那一邊）。
      drawBox(g, leftX, boxY, bw, bh, theme, leftC.label, leftC.text || '', leftA);
      // 紅箭頭：左框右緣 → 右框左緣。
      if (arrowA > 0.01) drawRedArrow(g, leftX + bw + 3, rowY, rightX - 5, rowY, arrowA, Math.min(1, arrowA + 0.2));
      // 右框：被扭曲的版本／被攻擊的人（紅色＝出毛病的落點）。
      if (type === 'adhominem') {
        if (rightA > 0.01) {
          g.save();
          g.globalAlpha = rightA * 0.1; g.fillStyle = WARN; roundRect(g, rightX, boxY, bw, bh, 11); g.fill();
          g.globalAlpha = rightA; g.lineWidth = 1.7; g.strokeStyle = WARN; roundRect(g, rightX, boxY, bw, bh, 11); g.stroke();
          g.restore();
          label(g, rightC.label || '這個人', rightX + bw / 2, boxY + 15, WARN, 11, 'center');
          drawPerson(g, rightX + bw / 2, rowY + 8, bh * 0.32, WARN, rightA);
        }
      } else {
        drawBox(g, rightX, boxY, bw, bh, WARN, rightC.label, rightC.text || '', rightA);
      }
      // 斷裂 chip（置底）。
      if (breakA > 0.01) drawBreakChip(g, w / 2, h - 20, breakLabel, breakA);
    }

    // --- 三格並呈（appeal：名人／群眾／情緒）---
    var panels: any[] = cfg.panels || [
      { label: '🌟 名人掛保證', text: '但他不是這領域的專家' },
      { label: '👥 大家都這樣', text: '人多就一定對？' },
      { label: '😱 恐嚇或感動', text: '用情緒代替理由' }
    ];
    function drawAppeal(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor();
      var n = panels.length, gap = w * 0.025;
      var pw = (w - gap * (n + 1)) / n;
      var py = h * 0.17, ph = h * 0.52;
      for (var i = 0; i < n; i++) {
        var a = easeInOut(clamp01((p - i * 0.30) / 0.3));
        if (a <= 0.01) continue;
        var px = gap + i * (pw + gap);
        g.save();
        g.globalAlpha = a * 0.1; g.fillStyle = WARN; roundRect(g, px, py, pw, ph, 10); g.fill();
        g.globalAlpha = a; g.lineWidth = 1.6; g.strokeStyle = WARN; roundRect(g, px, py, pw, ph, 10); g.stroke();
        g.restore();
        g.save(); g.globalAlpha = a;
        var lblLines = wrapCJK(panels[i].label, 6);
        for (var li = 0; li < lblLines.length; li++) label(g, lblLines[li], px + pw / 2, py + 15 + li * 15, ink, 10.5, 'center');
        var txtLines = wrapCJK(panels[i].text, 6);
        var ty0 = py + ph / 2 - (txtLines.length - 1) * 7 + 10;
        for (var ti = 0; ti < txtLines.length; ti++) label(g, txtLines[ti], px + pw / 2, ty0 + ti * 15, ink, 10, 'center');
        // 紅色 ✗ 徽章（右上角）。
        g.fillStyle = WARN; disc(g, px + pw - 11, py + 11, 9, WARN);
        g.globalAlpha = a; label(g, '✗', px + pw - 11, py + 11, '#ffffff', 11, 'center');
        g.restore();
      }
      var capA = easeInOut(clamp01((p - 0.72) / 0.28));
      if (capA > 0.01) drawBreakChip(g, w / 2, h - 18, breakLabel || '都用人氣／情緒／不相關名氣，代替理由與證據', capA);
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor();
      var title: string = cfg.title || (type === 'strawman' ? '稻草人：扭曲後再攻擊'
        : type === 'adhominem' ? '訴諸人身：攻擊人，不談論點'
          : type === 'appeal' ? '訴諸權威／群眾／情緒' : '找出論證的斷裂處');
      label(g, title, w / 2, 14, theme, 12.5, 'center');
      if (type === 'appeal') drawAppeal(g, p, w, h);
      else drawTwoBox(g, p, w, h);
    }

    return runScene(host, {
      durationMs: 5200, loops: 2, staticPhase: 1,
      label: cfg.label || (type === 'strawman'
        ? '稻草人謬誤聚光燈：左框是原本溫和的主張，紅箭頭把它偷換成右框誇張、好反駁的版本，中間標紅斷裂處。'
        : type === 'adhominem'
          ? '訴諸人身聚光燈：左框是對方的論點，紅箭頭卻射向右邊「這個人」而非論點，中間標紅「攻擊人，不談理由」。'
          : type === 'appeal'
            ? '訴諸權威／群眾／情緒聚光燈：三格並呈名人掛保證、大家都這樣、用情緒代替理由，各標紅✗，底部點出都用人氣與情緒代替理由證據。'
            : '論證聚光燈：左框前提、紅箭頭延伸到右框結論，中間標紅斷裂處指出論證的毛病。'),
      draw: draw
    });
  }

  // ====================================================================
  // 場景：argFlow — 參數化「論證流」。把一段論證畫成「前提卡 → 結論卡」的流動：
  //   演繹(deduction)：前提用「實線鎖鏈箭頭」流入結論（鎖鏈＝鎖住＝必然，
  //                   前提若為真，結論就一定為真）；
  //   歸納(induction)：觀察卡用「虛線箭頭」流入通則卡（很可能、不保證），
  //                   counter.on 時浮現反例（黑天鵝）／隱藏假設卡，用紅✗把結論打叉。
  //   highlightIndicators:true 時在前提卡標「因為」、結論卡標「所以」指示詞
  //                   （供 core-argument-structure L4「找前提與結論」直接複用，不必改場景）。
  //   本 spec（演繹 vs 歸納）建立；core-argument-structure／core-fact-vs-opinion
  //   只餵 DATA 複用，不得另建場景。
  //   cfg = {
  //     premises:[{text}],          // 前提／觀察卡（左欄，由上而下）
  //     conclusion:{text},          // 結論／通則卡（右側）
  //     mode:'deduction'|'induction',
  //     counter:{text,on},          // induction 專用：反例／隱藏假設卡（on 時打叉結論）
  //     highlightIndicators:false,  // true＝標出「因為／所以」指示詞（argument-structure 用）
  //     label                       // 無障礙描述
  //   }
  //   reduced-motion：staticPhase=1 → 一次畫完整單幀（前提卡＋箭頭＋結論卡，
  //                   induction+counter 另含反例卡與紅✗），不跑動畫。
  // ====================================================================
  function argFlow(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var WARN = '#e11d48';
    var AMBER = '#d97706';                       // 歸納「很可能」的暖色（相對演繹的必然）
    var mode: string = cfg.mode === 'induction' ? 'induction' : 'deduction';
    var isDed: boolean = mode === 'deduction';
    var premises: any[] = cfg.premises || [];
    var conclusion: any = cfg.conclusion || { text: '' };
    var counter: any = cfg.counter || null;
    var counterOn: boolean = !!(counter && counter.on) && !isDed;
    var hiInd: boolean = !!cfg.highlightIndicators;

    function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

    function roundRect(g: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, r: number) {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + bw, y, x + bw, y + bh, r);
      g.arcTo(x + bw, y + bh, x, y + bh, r);
      g.arcTo(x, y + bh, x, y, r);
      g.arcTo(x, y, x + bw, y, r);
      g.closePath();
    }

    function wrapCJK(text: string, maxChars: number): string[] {
      var lines: string[] = [], curln = '';
      for (var i = 0; i < text.length; i++) {
        curln += text.charAt(i);
        if (curln.length >= maxChars) { lines.push(curln); curln = ''; }
      }
      if (curln) lines.push(curln);
      return lines;
    }

    // 指示詞 chip（「因為」「所以」）；只有 highlightIndicators 開啟才畫。
    function indChip(g: CanvasRenderingContext2D, x: number, y: number, txt: string, col: string, alpha: number) {
      g.save();
      g.font = '700 9.5px system-ui, sans-serif';
      var cw = g.measureText(txt).width + 10;
      g.globalAlpha = alpha; g.fillStyle = col; roundRect(g, x, y, cw, 15, 7); g.fill();
      label(g, txt, x + cw / 2, y + 7.5, '#ffffff', 9.5, 'center');
      g.restore();
    }

    function drawCard(g: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number,
      col: string, txt: string, alpha: number, dashed: boolean, indicator: string) {
      var ink = inkColor();
      g.save();
      g.globalAlpha = alpha * 0.12; g.fillStyle = col; roundRect(g, x, y, bw, bh, 10); g.fill();
      g.globalAlpha = alpha; g.lineWidth = 1.7; g.strokeStyle = col;
      if (dashed) g.setLineDash([5, 4]); else g.setLineDash([]);
      roundRect(g, x, y, bw, bh, 10); g.stroke(); g.setLineDash([]);
      g.restore();
      g.save(); g.globalAlpha = alpha;
      var lines = wrapCJK(txt, 7);
      var startY = y + bh / 2 - (lines.length - 1) * 8 + 0.5;
      for (var k = 0; k < lines.length; k++) label(g, lines[k], x + bw / 2, startY + k * 16, ink, 11.5, 'center');
      g.restore();
      if (hiInd && indicator) indChip(g, x + 5, y + 5, indicator, col, alpha);
    }

    // 流動箭頭：演繹＝實線＋沿線小鏈環（鎖鏈＝必然）；歸納＝虛線（很可能）。
    function drawFlowArrow(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number,
      len: number, alpha: number, col: string) {
      var ex = x0 + (x1 - x0) * len, ey = y0 + (y1 - y0) * len;
      g.save(); g.globalAlpha = alpha; g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2.3; g.lineCap = 'round';
      if (!isDed) g.setLineDash([5, 4]);
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(ex, ey); g.stroke();
      g.setLineDash([]);
      if (isDed) {
        var ang = Math.atan2(y1 - y0, x1 - x0);
        for (var i = 1; i <= 3; i++) {
          var t = i / 4; var lx = x0 + (ex - x0) * t, ly = y0 + (ey - y0) * t;
          g.beginPath(); g.lineWidth = 1.5;
          g.ellipse(lx, ly, 4.4, 2.6, ang, 0, Math.PI * 2); g.stroke();
        }
      }
      if (len > 0.88) {
        var a2 = Math.atan2(y1 - y0, x1 - x0);
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x1 - 8 * Math.cos(a2 - 0.42), y1 - 8 * Math.sin(a2 - 0.42));
        g.lineTo(x1 - 8 * Math.cos(a2 + 0.42), y1 - 8 * Math.sin(a2 + 0.42));
        g.closePath(); g.fill();
      }
      g.restore();
    }

    // 線型圖例：實線＝一定（演繹）／虛線＝很可能（歸納）。
    function drawLegend(g: CanvasRenderingContext2D, w: number, col: string) {
      var lx = w / 2 - 54, ly = 29;
      g.save(); g.strokeStyle = col; g.lineWidth = 2.3; g.lineCap = 'round';
      if (!isDed) g.setLineDash([5, 4]);
      g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 24, ly); g.stroke();
      g.restore();
      label(g, isDed ? '實線＝一定（演繹）' : '虛線＝很可能（歸納）', lx + 30, ly, col, 10, 'left');
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor();
      var cCol = isDed ? theme : AMBER;              // 結論／箭頭／圖例色（每幀讀，支援深色）
      label(g, isDed ? '演繹：前提保證結論' : '歸納：從例子推通則', w / 2, 14, theme, 12.5, 'center');
      drawLegend(g, w, cCol);
      var N = Math.max(1, premises.length);
      var bandTop = h * 0.21, bandBot = h * 0.72;
      var pbw = w * 0.40, pbx = w * 0.03;
      var gap = 9;
      var pbh = Math.min(46, (bandBot - bandTop - gap * (N - 1)) / N);
      var cbw = w * 0.40, cbx = w - cbw - w * 0.03;
      var cbh = h * 0.26, cby = (bandTop + bandBot) / 2 - cbh / 2;
      var ccy = cby + cbh / 2;
      var i: number, py: number;
      // 前提／觀察卡（staggered 淡入）
      for (i = 0; i < N; i++) {
        var pa = easeInOut(clamp01((p - i * 0.08) / 0.28));
        py = bandTop + i * (pbh + gap);
        drawCard(g, pbx, py, pbw, pbh, theme, (premises[i] && premises[i].text) || '', pa, false, '因為');
      }
      // 箭頭延伸（每個前提 → 結論左緣中心）
      var arrowA = clamp01((p - 0.30) / 0.26);
      if (arrowA > 0.01) {
        for (i = 0; i < N; i++) {
          py = bandTop + i * (pbh + gap);
          drawFlowArrow(g, pbx + pbw + 2, py + pbh / 2, cbx - 3, ccy, arrowA, Math.min(1, arrowA + 0.15), cCol);
        }
      }
      // 結論／通則卡
      var concA = easeInOut(clamp01((p - 0.56) / 0.24));
      if (concA > 0.01) drawCard(g, cbx, cby, cbw, cbh, cCol, conclusion.text || '', concA, !isDed, '所以');
      // 反例（黑天鵝）打叉（僅 induction + counter.on）
      if (counterOn) {
        var cp = easeInOut(clamp01((p - 0.80) / 0.2));
        if (cp > 0.01) {
          var tag = (counter.emoji !== undefined ? (counter.emoji ? counter.emoji + ' ' : '') : '🦢 ') + (counter.text || '出現一隻黑天鵝');
          g.save(); g.font = '700 10px system-ui, sans-serif';
          var tw = g.measureText(tag).width + 12;
          var tx = cbx + cbw / 2 - tw / 2;
          g.globalAlpha = cp * 0.14; g.fillStyle = WARN; roundRect(g, tx, cby - 20, tw, 16, 7); g.fill();
          g.globalAlpha = cp; g.strokeStyle = WARN; g.lineWidth = 1.3; roundRect(g, tx, cby - 20, tw, 16, 7); g.stroke();
          label(g, tag, cbx + cbw / 2, cby - 12, WARN, 10, 'center');
          g.strokeStyle = WARN; g.lineWidth = 3; g.lineCap = 'round';
          g.beginPath(); g.moveTo(cbx + 8, cby + 8); g.lineTo(cbx + cbw - 8, cby + cbh - 8); g.stroke();
          g.beginPath(); g.moveTo(cbx + cbw - 8, cby + 8); g.lineTo(cbx + 8, cby + cbh - 8); g.stroke();
          g.restore();
        }
      }
      // 底部訊息
      var msg = isDed ? '前提若為真，結論就一定為真'
        : (counterOn && p >= 0.85) ? '很可能，但不保證：一個反例就推翻'
          : '很可能，但不保證';
      var msgCol = isDed ? theme : ((counterOn && p >= 0.85) ? WARN : AMBER);
      label(g, msg, w / 2, h - 12, msgCol, 11, 'center');
    }

    return runScene(host, {
      durationMs: counterOn ? 6200 : 5200, loops: 2, staticPhase: 1,
      label: cfg.label || (isDed
        ? '演繹論證流：左欄前提卡用實線鎖鏈箭頭流入右側結論卡，標示「前提若為真，結論就一定為真」。'
        : ('歸納論證流：左欄觀察卡用虛線箭頭流入右側通則卡，標示「很可能但不保證」'
          + (counterOn ? '，最後浮現一隻黑天鵝反例把結論用紅✗打叉。' : '。'))),
      draw: draw
    });
  }

  // ====================================================================
  // 場景：fairTest — 「找兇手・排除嫌疑」公平測試推理（PLAYABLE 可點擊）。
  //   把每個實驗條件當成一個「嫌疑犯」：兩盆植物 A/B 長得不一樣（結果），
  //   要找出是哪個條件造成的。
  //     - 條件在兩盆「一樣」→ 有不在場證明（alibi）→ 劃掉、排除（灰）。
  //     - 條件在兩盆「不一樣」→ 還在嫌疑中（主題色高亮）。
  //   判決隨「還在嫌疑中的條件數」即時更新：
  //     剩 1 個 → 破案！就是它（綠，箭頭指向結果）＝這就是操縱變因。
  //     剩 2+ 個 → 兩個以上嫌疑犯、無法定罪（紅 ❓）→ 要把其他條件控制成一樣。
  //     剩 0 個 → 沒有不同的條件，兩盆本來就該一樣（邊界情形）。
  //   這把「操縱變因＝我們改的嫌疑犯／控制變因＝其他保持相同（排除嫌疑）／
  //   應變變因＝量到的結果」與「一次只改一個才公平」的推理，變成一條可見的辦案線。
  //   PLAYABLE：自動把有不在場證明的嫌疑犯逐一排除、出判決後，進入可點擊狀態——
  //   點任一列可切換該條件「一樣／不一樣」，判決會即時改變（孩子自己做推理）。
  //   角落「🔁 重播」會重置回初始狀態再播一次。
  //   契約：收 host（.cn-svg 容器）、回傳 { stop }（concept_engine 換頁前呼叫）。
  //   reduced-motion：直接畫最終狀態（排除線＋判決），保留跨狀態對比、不跑迴圈、不顯示重播鈕。
  //   mode:'fair'→初始剩 1 個嫌疑；'unfair'→初始剩 2 個嫌疑。author-once，各科實驗課共用。
  //   cfg = {
  //     mode:'fair'|'unfair',
  //     suspects:[ {name:'光照', a:'強光', b:'弱光', diff:true},   // diff 省略時以 a!==b 判定
  //                {name:'水量', a:'一樣', b:'一樣'}, ... ],
  //     measure:'長高', values:[12,6], groups:['A 盆','B 盆'], title?, label?
  //   }
  //   （向下相容舊 cfg：changed:['光照:強光|弱光']、controlled:['水:相同',...] 會轉成 suspects。）
  // ====================================================================
  function fairTest(host: HTMLElement, cfg: any): { stop: () => void } {
    cfg = cfg || {};
    var WARN = '#e11d48', OK = '#16a34a', MUT = '#6b7280';
    var mode: string = cfg.mode === 'unfair' ? 'unfair' : 'fair';
    var groups: string[] = cfg.groups || ['A 盆', 'B 盆'];
    var measure: string = cfg.measure || '長高';
    function clamp01(x: number): number { return x < 0 ? 0 : (x > 1 ? 1 : x); }

    interface Suspect { name: string; a: string; b: string; diff: boolean; }

    // 建立嫌疑犯（條件）清單。優先用 cfg.suspects；否則由舊的 changed/controlled 轉。
    var suspects: Suspect[] = [];
    if (cfg.suspects && cfg.suspects.length) {
      cfg.suspects.forEach(function (s: any) {
        var a = (s.a != null) ? String(s.a) : '一樣';
        var b = (s.b != null) ? String(s.b) : a;
        var diff = (typeof s.diff === 'boolean') ? s.diff : (a !== b);
        suspects.push({ name: String(s.name), a: a, b: b, diff: diff });
      });
    } else {
      (cfg.changed || ['光照:強光|弱光']).forEach(function (str: string) {
        var i = str.indexOf(':'), name = i < 0 ? str : str.slice(0, i), rest = i < 0 ? '' : str.slice(i + 1), j = rest.indexOf('|');
        var a = j < 0 ? (rest || '不一樣') : rest.slice(0, j), b = j < 0 ? (rest || '不一樣') : rest.slice(j + 1);
        suspects.push({ name: name, a: a, b: b, diff: true });
      });
      (cfg.controlled || ['水:一樣', '土:一樣', '品種:一樣']).forEach(function (str: string) {
        var i = str.indexOf(':'), name = i < 0 ? str : str.slice(0, i), val = i < 0 ? '一樣' : str.slice(i + 1);
        suspects.push({ name: name, a: val, b: val, diff: false });
      });
    }
    var initDiff: boolean[] = suspects.map(function (s) { return s.diff; });
    var firstDiffName = '';
    for (var fi = 0; fi < suspects.length; fi++) { if (initDiff[fi]) { firstDiffName = suspects[fi].name; break; } }
    // 結果（應變變因）：兩盆量到的高度 A/B。
    var values: number[] = cfg.values || (mode === 'unfair' ? [13, 7] : [12, 6]);

    var canvas = host.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return { stop: function () {} };
    var ctx = canvas.getContext('2d');
    if (!ctx) return { stop: function () {} };
    var g = ctx;
    var cssW = canvas.clientWidth || canvas.width || 300;
    var cssH = canvas.clientHeight || canvas.height || 240;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var W = cssW, H = cssH;

    var reduced = reducedMotion();
    var aria = cfg.label || ('找兇手推理動畫：把每個實驗條件當成嫌疑犯——兩盆植物 ' + groups[0] + '、' + groups[1]
      + ' 長得不一樣。條件在兩盆一樣的，有不在場證明、被劃掉排除；不一樣的還在嫌疑中。'
      + (mode === 'fair'
        ? ('這裡只有「' + firstDiffName + '」一個條件不一樣，所以可以破案，確定差異是它造成的，這就是操縱變因。')
        : ('這裡同時有兩個條件不一樣，有兩個嫌疑犯、無法定罪；要把其他條件都控制成一樣，剩下一個嫌疑犯才能破案。'))
      + '可以點任一列切換一樣或不一樣，看判決怎麼改變。');
    canvas.setAttribute('aria-label', aria);

    function diffCount(): number { var n = 0; for (var i = 0; i < suspects.length; i++) { if (suspects[i].diff) n++; } return n; }

    function roundRect(x: number, y: number, bw: number, bh: number, r: number) {
      g.beginPath();
      g.moveTo(x + r, y); g.lineTo(x + bw - r, y); g.arcTo(x + bw, y, x + bw, y + r, r);
      g.lineTo(x + bw, y + bh - r); g.arcTo(x + bw, y + bh, x + bw - r, y + bh, r);
      g.lineTo(x + r, y + bh); g.arcTo(x, y + bh, x, y + bh - r, r);
      g.lineTo(x, y + r); g.arcTo(x, y, x + r, y, r); g.closePath();
    }

    // ---- 版面 ----（以 300×240 為基準，隨 canvas 等比放大）。
    var bandTop = 18, bandH = 72;                   // 結果（兩盆）帶
    var headY = bandTop + bandH + 6;                // 嫌疑犯清單標頭/操作提示
    var listTop = headY + 8;
    var verdH = 38, verdTop = H - verdH - 2;         // 判決框
    var listBottom = verdTop - 4;
    var nR = suspects.length;
    var rowH = Math.min(26, (listBottom - listTop) / Math.max(nR, 1));

    var potAx = W * 0.42, potBx = W * 0.58;
    var potBaseY = bandTop + bandH - 20;

    var rowRects: { x: number; y: number; w: number; h: number; idx: number }[] = [];

    // 畫兩盆植物（結果＝應變變因）。revealP 控制生長高度浮現。
    function drawPots(revealP: number) {
      var theme = themeColor(), ink = inkColor();
      var maxV = Math.max(values[0], values[1], 1);
      var plantMax = potBaseY - (bandTop + 18);
      label(g, '結果：兩盆的「' + measure + '」不一樣 → 是誰造成的？', W / 2, bandTop + 6, theme, 10.5, 'center');
      var pots = [[potAx, values[0], groups[0]], [potBx, values[1], groups[1]]];
      for (var i = 0; i < pots.length; i++) {
        var px = pots[i][0] as number, v = pots[i][1] as number, nm = pots[i][2] as string;
        var stemH = plantMax * (v / maxV) * clamp01(revealP);
        var stemTop = potBaseY - stemH;
        // 莖＋葉。
        g.save(); g.strokeStyle = OK; g.lineWidth = 3; g.lineCap = 'round';
        g.beginPath(); g.moveTo(px, potBaseY); g.lineTo(px, stemTop); g.stroke(); g.restore();
        disc(g, px, stemTop, 6, OK);
        // 盆（梯形）。
        g.save(); g.fillStyle = MUT; g.globalAlpha = 0.5;
        g.beginPath(); g.moveTo(px - 12, potBaseY); g.lineTo(px + 12, potBaseY);
        g.lineTo(px + 8, potBaseY + 9); g.lineTo(px - 8, potBaseY + 9); g.closePath(); g.fill(); g.restore();
        // 盆名＋量到的高度（放在盆下方，不壓到植物與標題）。
        if (revealP > 0.4) label(g, nm + '·' + v, px, potBaseY + 18, ink, 9.5, 'center');
      }
    }

    // 畫一列嫌疑犯。appear 0..1 控制逐一浮現。
    function drawRow(idx: number, appear: number) {
      var theme = themeColor(), ink = inkColor();
      var s = suspects[idx];
      var ry = listTop + idx * rowH;
      rowRects[idx] = { x: 3, y: ry + 1, w: W - 6, h: rowH - 2, idx: idx };
      if (appear <= 0) return;
      var isDiff = s.diff;
      g.save();
      if (isDiff) {
        g.globalAlpha = appear * 0.15; g.fillStyle = theme; roundRect(3, ry + 1, W - 6, rowH - 2, 6); g.fill();
        g.globalAlpha = appear; g.strokeStyle = theme; g.lineWidth = 1.5; roundRect(3, ry + 1, W - 6, rowH - 2, 6); g.stroke();
      } else {
        g.globalAlpha = appear * 0.06; g.fillStyle = ink; roundRect(3, ry + 1, W - 6, rowH - 2, 6); g.fill();
      }
      g.restore();
      var cy = ry + rowH / 2;
      // 排除者整體變淡（＝劃掉）。
      g.save(); g.globalAlpha = appear * (isDiff ? 1 : 0.6);
      var nameCol = isDiff ? theme : MUT;
      var mark = isDiff ? '🔍 ' : '✗ ';
      label(g, mark + s.name, 9, cy, nameCol, 11, 'left');
      // 值欄依「是否不一樣」顯示：不一樣且有具體設定→顯示設定；否則顯示「不一樣／一樣」。
      var valTxt = isDiff ? ((s.a !== s.b) ? (s.a + '｜' + s.b) : '不一樣') : '一樣';
      label(g, valTxt, W * 0.52, cy, isDiff ? ink : MUT, 9.5, 'center');
      label(g, isDiff ? '嫌疑中' : '排除', W - 8, cy, isDiff ? theme : MUT, 9, 'right');
      g.restore();
    }

    // 畫判決框（＋破案時的箭頭）。vAppear 0..1 控制浮現。
    function drawVerdict(vAppear: number) {
      var ink = inkColor();
      var dc = diffCount();
      var col = dc === 1 ? OK : (dc >= 2 ? WARN : MUT);
      // 動畫/互動時右下角有「重播」鈕 → 判決框留一個缺口給它，文字也靠此置中、不被蓋住。
      var boxRight = reduced ? (W - 4) : (W - 74);
      var cxV = (4 + boxRight) / 2;
      var boxW = boxRight - 4;
      g.save();
      g.globalAlpha = vAppear * 0.12; g.fillStyle = col; roundRect(4, verdTop, boxW, verdH, 8); g.fill();
      g.globalAlpha = vAppear; g.strokeStyle = col; g.lineWidth = 1.5; roundRect(4, verdTop, boxW, verdH, 8); g.stroke();
      g.restore();
      g.save(); g.globalAlpha = vAppear;
      if (dc === 1) {
        var cname = '', ci = -1;
        for (var i = 0; i < suspects.length; i++) { if (suspects[i].diff) { cname = suspects[i].name; ci = i; break; } }
        label(g, '🔍 破案！兇手就是「' + cname + '」', cxV, verdTop + 13, OK, 11, 'center');
        label(g, '只有它不一樣 → 它就是操縱變因', cxV, verdTop + 29, ink, 9, 'center');
        // 箭頭：被定罪的那列 → 結果（沿左緣往上指向兩盆之間）。
        if (ci >= 0) {
          var cRy = listTop + ci * rowH + rowH / 2;
          g.strokeStyle = OK; g.lineWidth = 2; g.lineCap = 'round'; g.globalAlpha = vAppear * 0.9;
          g.beginPath(); g.moveTo(7, cRy); g.lineTo(7, potBaseY + 4); g.lineTo(W * 0.5 - 2, potBaseY + 4); g.stroke();
          var hx = W * 0.5 - 2, hy = potBaseY + 4;
          g.fillStyle = OK; g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx - 6, hy - 3.5); g.lineTo(hx - 6, hy + 3.5); g.closePath(); g.fill();
        }
      } else if (dc >= 2) {
        label(g, '❓ ' + dc + ' 個嫌疑犯 → 無法定罪！', cxV, verdTop + 13, WARN, 10.5, 'center');
        label(g, '把其他條件控制成一樣，剩一個才破得了案', cxV, verdTop + 29, ink, 9, 'center');
      } else {
        label(g, '沒有不一樣的條件', cxV, verdTop + 13, MUT, 10.5, 'center');
        label(g, '兩盆本來就該一樣，沒有兇手可抓', cxV, verdTop + 29, MUT, 9, 'center');
      }
      g.restore();
    }

    // 整體繪製。revealP 0..1 控制動畫浮現；final 時 revealP=1。
    function renderAll(revealP: number) {
      g.clearRect(0, 0, W, H);
      var theme = themeColor();
      label(g, cfg.title || '🕵️ 把每個實驗條件當成「嫌疑犯」', W / 2, 12, theme, 11, 'center');
      drawPots(revealP);
      // 標頭＋操作提示（reduced-motion 不提示點擊）。
      label(g, reduced ? '嫌疑犯（實驗條件）' : '嫌疑犯（實驗條件）· 👆 點一列切換 一樣／不一樣',
        W / 2, headY, MUT, 9, 'center');
      // 嫌疑犯逐一浮現（0..0.72），接著判決（0.78..1）。
      var shown = nR * clamp01(revealP / 0.72);
      for (var i = 0; i < nR; i++) { drawRow(i, clamp01(shown - i)); }
      var vAppear = clamp01((revealP - 0.78) / 0.22);
      drawVerdict(vAppear);
    }

    // ---- 生命週期 ----
    var raf = 0, startT = 0, stopped = false, done = false;
    var REVEAL_MS = 2200;

    function frame(now: number) {
      if (stopped) return;
      if (!startT) startT = now;
      var p = (now - startT) / REVEAL_MS;
      if (p >= 1) { renderAll(1); done = true; showReplay(); return; }
      renderAll(p);
      raf = requestAnimationFrame(frame);
    }

    function play() {
      done = false; startT = 0;
      for (var i = 0; i < suspects.length; i++) suspects[i].diff = initDiff[i];
      hideReplay();
      if (reduced) { renderAll(1); done = true; return; }
      raf = requestAnimationFrame(frame);
    }

    // 分頁切背景暫停；回前景續播（除非已播完）。
    function onVisibility() {
      if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; }
      else if (!stopped && !done && !reduced) { startT = 0; raf = requestAnimationFrame(frame); }
    }
    document.addEventListener('visibilitychange', onVisibility);

    // 點擊切換某列的「一樣／不一樣」，判決即時更新。
    function onClick(e: MouseEvent) {
      if (stopped) return;
      if (!done) { done = true; if (raf) cancelAnimationFrame(raf); raf = 0; }
      var rect = canvas!.getBoundingClientRect();
      var sx = W / (rect.width || W), sy = H / (rect.height || H);
      var x = (e.clientX - rect.left) * sx, y = (e.clientY - rect.top) * sy;
      for (var i = 0; i < rowRects.length; i++) {
        var r = rowRects[i];
        if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) { suspects[r.idx].diff = !suspects[r.idx].diff; break; }
      }
      renderAll(1);
      showReplay();
    }
    canvas.addEventListener('click', onClick);
    canvas.style.cursor = reduced ? '' : 'pointer';

    // 重播鈕（沿用 .cn-anim-replay，絕對定位、不改版面高度）。reduced-motion 不顯示。
    var replayBtn: HTMLButtonElement | null = null;
    function ensureReplay() {
      if (replayBtn || reduced) return;
      replayBtn = document.createElement('button');
      replayBtn.type = 'button';
      replayBtn.className = 'cn-anim-replay';
      replayBtn.textContent = '🔁 重播';
      replayBtn.addEventListener('click', function () { play(); });
      host.appendChild(replayBtn);
    }
    function showReplay() { ensureReplay(); if (replayBtn) replayBtn.style.display = ''; }
    function hideReplay() { if (replayBtn) replayBtn.style.display = 'none'; }

    play();

    return {
      stop: function () {
        stopped = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        document.removeEventListener('visibilitychange', onVisibility);
        if (canvas) { canvas.removeEventListener('click', onClick); canvas.style.cursor = ''; }
        if (replayBtn && replayBtn.parentNode) replayBtn.parentNode.removeChild(replayBtn);
        replayBtn = null;
      }
    };
  }

  // ====================================================================
  // 場景：greenhouseEffect — 溫室效應（永續頁第1課；author-once，未來任何氣候課可引用）。
  //   科學鐵則：溫室氣體吸收的是「地面放出的長波紅外線」，不是「擋住進來的陽光」；
  //   與臭氧層破洞無關。流程：太陽短波穿過大氣照到地面（不被擋）→ 地面升溫 →
  //   放出長波紅外線 → 部分被溫室氣體吸收後再放回地面（熱被留住）；溫室氣體越多 →
  //   留住越多熱 → 溫度計越高（全球暖化）。
  //   cfg = { gas:'low'|'high', caption?, label? }
  //   reduced-motion：drawStatic 畫「少氣體（宜居）vs 多氣體（較暖）」並排對比幀。
  // ====================================================================
  function greenhouseEffect(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var gasHigh = cfg.gas === 'high';
    var IR = '#e8663c';          // 長波紅外線（暖橘紅）
    var GHG = CO2_COL;           // 溫室氣體分子（中性灰）
    function clamp01(x: number): number { return x < 0 ? 0 : (x > 1 ? 1 : x); }

    // 溫度計：垂直管＋底部球，fill 0..1。
    function thermo(g: CanvasRenderingContext2D, x: number, top: number, len: number, frac: number, ink: string) {
      var bulbR = 6, tubeW = 6;
      var tubeBot = top + len;
      g.save();
      g.strokeStyle = ink; g.globalAlpha = 0.5; g.lineWidth = 1.2;
      g.strokeRect(x - tubeW / 2, top, tubeW, len);
      g.globalAlpha = 1;
      disc(g, x, tubeBot + bulbR, bulbR, IR);
      var fillH = len * clamp01(frac);
      g.fillStyle = IR; g.fillRect(x - tubeW / 2 + 1.5, tubeBot - fillH, tubeW - 3, fillH);
      g.restore();
    }

    // 一格完整的溫室場景（draw 用整張畫布一格；drawStatic 用左右兩格做對比）。
    function ghScene(g: CanvasRenderingContext2D, x0: number, y0: number, pw: number, ph: number, high: boolean, phase: number, theme: string, ink: string, compact: boolean) {
      var sx = x0 + pw * 0.16, sy = y0 + ph * 0.16;
      var groundY = y0 + ph * 0.80;
      var bandTop = y0 + ph * 0.34, bandBot = y0 + ph * 0.52;
      var tm = nowMs() / 1000;
      var actSun = clamp01(phase / 0.22);
      var actWarm = clamp01((phase - 0.25) / 0.15);
      var actIR = clamp01((phase - 0.5) / 0.2);

      // 地面。
      g.save(); g.fillStyle = EARTH_LAND; g.globalAlpha = 0.85;
      g.fillRect(x0, groundY, pw, (y0 + ph) - groundY); g.restore();
      // 地面升溫暖光。
      if (actWarm > 0.02) { g.save(); g.globalAlpha = 0.26 * actWarm; disc(g, x0 + pw * 0.5, groundY, pw * 0.4, 'rgba(232,102,60,0.9)'); g.restore(); }

      // 溫室氣體層（分子點，多/少）。
      var nG = high ? 12 : 4;
      g.save();
      for (var i = 0; i < nG; i++) {
        var gx = x0 + pw * (0.12 + 0.76 * ((i * 0.618) % 1));
        var gy = bandTop + (bandBot - bandTop) * ((i * 0.37) % 1);
        g.globalAlpha = 0.8; disc(g, gx, gy, 3.2, GHG);
      }
      g.restore();

      // 太陽。
      sunDisc(g, sx, sy, compact ? 6 : 8);

      // 短波陽光：太陽→地面（穿過大氣，不被擋）。
      var tgx = x0 + pw * 0.5, tgy = groundY - 2, nS = 3;
      g.save();
      for (var s = 0; s < nS; s++) {
        var u = ((tm * 0.6 + s / nS) % 1);
        var ox = (s - 1) * (compact ? 6 : 10);
        var ax = sx + ox, ay = sy + (compact ? 10 : 14);
        var bx = tgx + ox, by = tgy;
        var pxp = ax + (bx - ax) * u, pyp = ay + (by - ay) * u;
        g.globalAlpha = actSun * (0.4 + 0.5 * Math.sin(Math.PI * u));
        disc(g, pxp, pyp, 2.6, SUN);
      }
      g.restore();

      // 長波紅外線：地面→上；部分被溫室氣體攔截後放回地面（high 攔截較多）。
      if (actIR > 0.02) {
        var nIR = 6, trapN = Math.round(nIR * (high ? 0.7 : 0.25));
        g.save();
        for (var k = 0; k < nIR; k++) {
          var trapped = k < trapN;
          var gxk = x0 + pw * (0.3 + 0.5 * (k / (nIR - 1)));
          var u2 = ((tm * 0.5 + k / nIR) % 1);
          var yy: number;
          if (trapped) {
            if (u2 < 0.5) { yy = groundY + (bandBot - groundY) * (u2 / 0.5); }
            else { yy = bandBot + (groundY - bandBot) * ((u2 - 0.5) / 0.5); }
          } else {
            yy = groundY + (y0 - groundY) * u2;   // 一路升到頂端逸出太空
          }
          g.globalAlpha = actIR * 0.85;
          disc(g, gxk, yy, 2.6, IR);
        }
        g.restore();
      }

      // 溫度計（右側）。
      var tx = x0 + pw * 0.9;
      thermo(g, tx, y0 + ph * 0.30, ph * 0.3, actIR * (high ? 0.82 : 0.42), ink);

      // 標籤。
      label(g, high ? '多溫室氣體' : '少溫室氣體', x0 + pw * 0.42, bandTop - 6, high ? IR : theme, compact ? 9.5 : 11, 'center');
      if (compact) {
        label(g, high ? '較暖' : '宜居', tx, y0 + ph * 0.74, high ? IR : theme, 8.5, 'center');
      } else {
        label(g, '地面', x0 + pw * 0.5, groundY + 14, ink, 10, 'center');
        label(g, high ? '留住較多熱' : '留住剛好的熱', tx, y0 + ph * 0.76, high ? IR : theme, 9, 'center');
      }
    }

    return runScene(host, {
      durationMs: 10000, loops: 2, staticPhase: 0.85,
      label: cfg.label || ('溫室效應動畫：太陽的短波陽光穿過大氣照到地面（不會被擋住），地面升溫後放出長波紅外線；'
        + (gasHigh ? '當溫室氣體很多時，較多紅外線被吸收後放回地面，熱被留住得多，溫度計升高，代表全球暖化。' : '當溫室氣體較少時，較多紅外線直接逸出太空，留住的熱剛剛好，地球宜居。')
        + '重點：溫室氣體攔截的是地面放出的紅外線，不是擋住進來的陽光。'),
      drawStatic: function (g, w, h) {
        var ink = inkColor(), theme = themeColor();
        label(g, '溫室氣體像被子：越厚，留住的熱越多', w / 2, 11, theme, 11, 'center');
        ghScene(g, 0, 20, w / 2, h - 24, false, 0.85, theme, ink, true);
        ghScene(g, w / 2, 20, w / 2, h - 24, true, 0.85, theme, ink, true);
        g.save(); g.globalAlpha = 0.25; g.strokeStyle = ink; g.beginPath(); g.moveTo(w / 2, 22); g.lineTo(w / 2, h - 6); g.stroke(); g.restore();
      },
      draw: function (g, phase, w, h) {
        var ink = inkColor(), theme = themeColor();
        var cap = phase < 0.25 ? '① 陽光短波穿過大氣，照到地面'
          : (phase < 0.5 ? '② 地面升溫，放出長波紅外線'
            : (phase < 0.78 ? '③ 紅外線往上，部分被溫室氣體攔截' : '④ 熱被放回地面而留住'));
        label(g, cap, w / 2, 13, theme, 12, 'center');
        ghScene(g, 0, 22, w, h - 30, gasHigh, phase, theme, ink, false);
        label(g, gasHigh ? '氣體越多 → 留住越多熱 → 升溫' : '適量溫室氣體 → 留住剛好的熱 → 宜居', 8, h - 8, ink, 10, 'left');
      }
    });
  }

  // ====================================================================
  // 場景：carbonCycle — 碳循環（永續頁第2課；author-once，tier0 生物「呼吸與碳循環」
  //   日後改用＝change-one-place）。光合吸碳 ↔ 呼吸/分解放碳 ↔ 海洋吸收/釋放，自然
  //   收支大致平衡；emphasis:'human' 另加「燃燒化石燃料」把地底封存的碳大量放回大氣，
  //   CO₂ 在大氣累積、打破平衡（人類額外的那一股以紅色高亮）。
  //   cfg = { emphasis:'natural'|'human', caption?, label? }
  //   reduced-motion：drawStatic 畫完整最後一幀（所有碳流標字；human 另標 CO₂ 累積）。
  // ====================================================================
  function carbonCycle(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var human = cfg.emphasis === 'human';
    var CO2 = CO2_COL, PLANT = EARTH_LAND, OCEAN = '#0369a1', HUMAN = '#e11d48';
    function clamp01(x: number): number { return x < 0 ? 0 : (x > 1 ? 1 : x); }

    // 一條流動的碳（點沿 a→b 推進，終點畫箭頭）；act 控制濃淡。
    function stream(g: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, color: string, n: number, r: number, phaseOff: number, act: number) {
      if (act <= 0.02) return;
      var tm = nowMs() / 1000;
      g.save();
      for (var i = 0; i < n; i++) {
        var f = (((tm * 0.4 + i / n + phaseOff) % 1) + 1) % 1;
        var x = ax + (bx - ax) * f, y = ay + (by - ay) * f;
        g.globalAlpha = act * (0.3 + 0.6 * Math.sin(f * Math.PI));
        disc(g, x, y, r, color);
      }
      var ang = Math.atan2(by - ay, bx - ax);
      g.globalAlpha = act; g.fillStyle = color;
      g.beginPath(); g.moveTo(bx, by);
      g.lineTo(bx - r * 3 * Math.cos(ang - 0.5), by - r * 3 * Math.sin(ang - 0.5));
      g.lineTo(bx - r * 3 * Math.cos(ang + 0.5), by - r * 3 * Math.sin(ang + 0.5));
      g.closePath(); g.fill();
      g.restore();
    }

    function ccScene(g: CanvasRenderingContext2D, w: number, h: number, phase: number) {
      var ink = inkColor();
      var atmY0 = 28, atmY1 = 60;
      // 大氣帶。
      g.save(); g.globalAlpha = 0.1; g.fillStyle = CO2; g.fillRect(10, atmY0, w - 20, atmY1 - atmY0); g.restore();
      g.save(); g.globalAlpha = 0.5; g.strokeStyle = CO2; g.lineWidth = 1; g.strokeRect(10, atmY0, w - 20, atmY1 - atmY0); g.restore();
      var nd = human ? 10 : 6;
      for (var d = 0; d < nd; d++) { disc(g, 20 + (w - 40) * ((d * 0.618) % 1), atmY0 + 9 + 13 * ((d * 0.37) % 1), 2.6, CO2); }
      label(g, '大氣中的二氧化碳 CO₂', w / 2, atmY0 - 1, ink, 10, 'center');

      var groundY = h - 20;
      // 植物／森林（左）。
      var px = w * 0.2, pcy = h * 0.62;
      g.save(); g.strokeStyle = '#9c6b3f'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(px, pcy); g.lineTo(px, groundY); g.stroke(); g.restore();
      disc(g, px, pcy - 10, 15, PLANT);
      label(g, '植物／森林', px, groundY + 10, PLANT, 9.5, 'center');
      // 海洋（右下）。
      g.save(); g.globalAlpha = 0.2; g.fillStyle = OCEAN; g.fillRect(w * 0.6, groundY - 18, w * 0.38, 22); g.restore();
      label(g, '海洋', w * 0.79, groundY + 10, OCEAN, 9.5, 'center');

      var actCycle = clamp01(phase / 0.3);
      // 光合：大氣→植物（吸碳）。
      stream(g, px - 8, atmY1 + 4, px - 2, pcy - 18, PLANT, 4, 2.6, 0, actCycle);
      label(g, '光合吸碳', px - 34, (atmY1 + pcy) / 2 + 4, PLANT, 8.5, 'center');
      // 呼吸／分解：植物／土→大氣（放碳）。
      stream(g, px + 12, pcy - 16, px + 20, atmY1 + 4, CO2, 4, 2.6, 0.5, actCycle);
      label(g, '呼吸・分解放碳', px + 46, (atmY1 + pcy) / 2 + 4, CO2, 8.5, 'center');
      // 海洋 ↔ 大氣（雙向）。
      stream(g, w * 0.76, groundY - 20, w * 0.76, atmY1 + 4, OCEAN, 3, 2.4, 0, actCycle);
      stream(g, w * 0.84, atmY1 + 4, w * 0.84, groundY - 20, OCEAN, 3, 2.4, 0.5, actCycle);
      label(g, '海洋吸收／釋放', w * 0.8, (atmY1 + groundY) / 2 + 6, OCEAN, 8.5, 'center');

      if (human) {
        // 工廠／交通（中），地底化石→大氣 高亮。
        var fx = w * 0.47;
        g.save(); g.fillStyle = '#64748b';
        g.fillRect(fx - 12, groundY - 24, 24, 24);
        g.fillRect(fx + 2, groundY - 34, 7, 12); g.restore();
        label(g, '工廠／交通', fx, groundY + 10, HUMAN, 9, 'center');
        var actHuman = clamp01((phase - 0.3) / 0.3);
        stream(g, fx + 6, groundY - 32, fx + 9, atmY1 + 4, HUMAN, 6, 3, 0, actHuman);
        label(g, '燃燒化石燃料（人類額外排放）', fx + 4, atmY1 + 20, HUMAN, 8.5, 'center');
        // CO₂ 累積 bar（右上）。
        var accP = clamp01((phase - 0.3) / 0.6);
        var barX = w - 24, barTop = atmY0 - 4, barMax = 36;
        g.save(); g.strokeStyle = HUMAN; g.lineWidth = 1; g.globalAlpha = 0.6; g.strokeRect(barX, barTop, 9, barMax); g.restore();
        g.save(); g.fillStyle = HUMAN; g.globalAlpha = 0.8; g.fillRect(barX, barTop + barMax * (1 - accP), 9, barMax * accP); g.restore();
        label(g, 'CO₂ 累積↑', barX + 4, barTop + barMax + 8, HUMAN, 8, 'center');
      }
    }

    return runScene(host, {
      durationMs: 11000, loops: 2, staticPhase: 1,
      label: cfg.label || ('碳循環動畫：碳在大氣、植物、海洋間流動——植物行光合作用吸收二氧化碳，動物呼吸與分解又放出，海洋也會吸收與釋放，自然收支大致平衡。'
        + (human ? '但人類大量燃燒化石燃料，把地底封存很久的碳快速放回大氣，二氧化碳在大氣中累積、打破平衡。' : '')),
      drawStatic: function (g, w, h) { ccScene(g, w, h, 1); },
      draw: function (g, phase, w, h) {
        var theme = themeColor();
        var cap: string;
        if (!human) { cap = '大自然的碳循環：吸碳 ↔ 放碳，進出大致平衡'; }
        else { cap = phase < 0.3 ? '① 大自然本來的碳循環' : (phase < 0.62 ? '② 人類燃燒化石燃料' : '③ CO₂ 在大氣累積、打破平衡'); }
        label(g, cap, w / 2, 13, human ? HUMAN : theme, 11.5, 'center');
        ccScene(g, w, h, phase);
      }
    });
  }

  // ====================================================================
  // 場景：compoundGrowth — 複利/定期定額成長（grow）與卡債滾大（debt）共用。
  //   理財真實世界頁（信用卡循環利息、保險與投資工具、匯率數位支付）共用的
  //   author-once 場景。以 principal 為起點，逐「月」(period) 依年利率複利；
  //   另可每月定額投入（contribute，供「定期定額」）。長條由左到右依序升起，
  //   播 2 輪後停在最後一幀（完整成長）。
  //   cfg = {
  //     principal:Number,     // 起始金額（本金 / 起始欠款），預設 100
  //     ratePct:Number,       // 年利率（%），預設 15；內部換成月利率 ratePct/100/12 逐月複利
  //     periods:Number,       // 顯示幾個月（長條數＝periods+1，含第 0 月），預設 12
  //     contribute:Number,    // 每月定額投入（定期定額用），預設 0
  //     mode:'grow'|'debt',   // grow＝用該頁 --su 色向上成長；debt＝用 --c-wrong 紅色表欠款滾大
  //     unitLabel:String?,    // 金額單位，預設 '元'
  //     title:String?,        // 圖頂標題
  //     caption:String?,      // 圖底固定說明（未設時顯示「第 N 個月 ≈ XXX 元」動態說明）
  //     label:String?         // 無障礙 aria-label
  //   }
  //   數學：vals[0]=principal；vals[i]=vals[i-1]×(1+月利率)+contribute。
  //   reduced-motion：畫 4 個具名月份並排靜態（起點→1/3→2/3→終點），保留跨期對比。
  //   契約：收 host、回傳 { stop }。
  // ====================================================================
  function compoundGrowth(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var principal: number = (typeof cfg.principal === 'number') ? cfg.principal : 100;
    var ratePct: number = (typeof cfg.ratePct === 'number') ? cfg.ratePct : 15;
    var periods: number = (typeof cfg.periods === 'number' && cfg.periods > 0) ? Math.round(cfg.periods) : 12;
    var contribute: number = (typeof cfg.contribute === 'number') ? cfg.contribute : 0;
    var mode: string = (cfg.mode === 'debt') ? 'debt' : 'grow';
    var unit: string = (typeof cfg.unitLabel === 'string') ? cfg.unitLabel : '元';
    var mRate = ratePct / 100 / 12;

    // 逐月複利序列（含每月定額投入）。
    var vals: number[] = [principal];
    for (var k = 1; k <= periods; k++) { vals[k] = vals[k - 1] * (1 + mRate) + contribute; }
    var maxV = vals[periods];
    var yTop = maxV * 1.14;
    if (!isFinite(yTop) || yTop <= 0) yTop = 1;
    var nBars = periods + 1;

    function fmt(x: number): string {
      var r = Math.round(x);
      return '' + r;
    }
    function barColor(): string {
      return (mode === 'debt') ? cssVar('--c-wrong', '#e11d48') : themeColor();
    }

    // 畫一根長條（含選用的數值標籤）。
    function oneBar(g: CanvasRenderingContext2D, bx: number, by: number, bw: number, bh: number, col: string) {
      g.save();
      g.fillStyle = col; g.globalAlpha = 0.82; g.fillRect(bx, by, bw, bh);
      g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 1; g.strokeRect(bx, by, bw, bh);
      g.restore();
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), col = barColor();
      var px0 = 40, py0 = 30, px1 = w - 14, py1 = h - 34;
      var plotH = py1 - py0, slotW = (px1 - px0) / nBars;
      var title = cfg.title || (mode === 'debt' ? '欠款逐月滾大（年利率 ' + fmt(ratePct) + '%）' : '複利逐月成長（年利率 ' + fmt(ratePct) + '%）');
      label(g, title, w / 2, 14, col, 12, 'center');

      // 座標軸
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.5; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(px0, py0); g.lineTo(px0, py1); g.lineTo(px1, py1); g.stroke(); g.restore();
      label(g, '0', px0 - 5, py1, ink, 9.5, 'right');

      var frontier = p * periods;             // 0..periods：已顯示到第幾個月
      var floorF = Math.floor(frontier + 1e-6);
      var curIdx = Math.min(periods, floorF); // 目前動態顯示到的月份
      for (var i = 0; i <= periods; i++) {
        var reveal: number;
        if (i <= floorF) reveal = 1;
        else if (i === floorF + 1) reveal = Math.max(0, Math.min(1, frontier - floorF));
        else reveal = 0;
        if (reveal <= 0.001) continue;
        var bw = slotW * 0.74;
        var bx = px0 + i * slotW + (slotW - bw) / 2;
        var fullH = plotH * (vals[i] / yTop);
        var bh = fullH * reveal;
        var by = py1 - bh;
        oneBar(g, bx, by, bw, bh, col);
        // x 軸月份：每隔幾根標一次（含頭尾）
        var tickEvery = periods > 14 ? 3 : 2;
        if (i === 0 || i === periods || i % tickEvery === 0) label(g, '' + i, bx + bw / 2, py1 + 11, ink, 8.5, 'center');
      }
      // 本金基準參考線（起始金額）
      var baseY = py1 - plotH * (vals[0] / yTop);
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.28; g.setLineDash([4, 4]); g.lineWidth = 1;
      g.beginPath(); g.moveTo(px0, baseY); g.lineTo(px1, baseY); g.stroke(); g.restore();

      // 動態說明：目前月份與金額
      var cap: string;
      if (cfg.caption) {
        cap = cfg.caption;
      } else {
        var monthWord = (curIdx === 0) ? '一開始' : ('第 ' + curIdx + ' 個月');
        var what = (mode === 'debt') ? '欠款' : '本利和';
        cap = monthWord + '：' + what + ' ≈ ' + fmt(vals[curIdx]) + ' ' + unit;
      }
      label(g, cap, w / 2, h - 9, col, 11, 'center');
    }

    // reduced-motion：4 個具名月份並排靜態（保留跨期對比）。
    function drawStatic(g: CanvasRenderingContext2D, w: number, h: number) {
      var ink = inkColor(), col = barColor();
      var px0 = 40, py0 = 30, px1 = w - 14, py1 = h - 34;
      var plotH = py1 - py0;
      var title = cfg.title || (mode === 'debt' ? '欠款逐月滾大（年利率 ' + fmt(ratePct) + '%）' : '複利逐月成長（年利率 ' + fmt(ratePct) + '%）');
      label(g, title, w / 2, 14, col, 12, 'center');
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.5; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(px0, py0); g.lineTo(px0, py1); g.lineTo(px1, py1); g.stroke(); g.restore();
      label(g, '0', px0 - 5, py1, ink, 9.5, 'right');
      var idxs = [0, Math.round(periods / 3), Math.round(periods * 2 / 3), periods];
      var slotW = (px1 - px0) / 4;
      for (var j = 0; j < 4; j++) {
        var idx = idxs[j];
        var bw = slotW * 0.5;
        var bx = px0 + j * slotW + (slotW - bw) / 2;
        var bh = plotH * (vals[idx] / yTop);
        var by = py1 - bh;
        oneBar(g, bx, by, bw, bh, col);
        label(g, fmt(vals[idx]), bx + bw / 2, by - 7, ink, 9.5, 'center');
        label(g, (idx === 0 ? '一開始' : ('第' + idx + '月')), bx + bw / 2, py1 + 12, ink, 9, 'center');
      }
      var what2 = (mode === 'debt') ? '欠款' : '本利和';
      label(g, cfg.caption || ('每個月' + what2 + '都比上個月多一點'), w / 2, h - 9, col, 11, 'center');
    }

    return runScene(host, {
      durationMs: 4600, loops: 2, staticPhase: 1,
      label: cfg.label || (mode === 'debt'
        ? '卡債滾大動畫：欠款從 ' + fmt(principal) + unit + ' 起，依年利率 ' + fmt(ratePct) + '% 逐月複利，長條一個月比一個月高，欠越久滾越大。'
        : '複利成長動畫：從 ' + fmt(principal) + unit + ' 起' + (contribute > 0 ? '、每月再投入 ' + fmt(contribute) + unit : '') + '，依年利率 ' + fmt(ratePct) + '% 逐月複利，長條逐月升高，時間越長成長越明顯（會上下波動、不保證）。'),
      drawStatic: drawStatic,
      draw: draw
    });
  }

  // ====================================================================
  // 場景：worldLocator — 看世界地圖、定位時事發生在哪（世界時事頁第4課；author-once，
  //   世界地理 world_geography／全球議題 global_issues 日後共用＝change-one-place）。
  //   畫一張「風格化扁平世界」：七大洲以 --su tint 色塊、海洋淺底；依序在 pins 指定
  //   位置「掉下定位針」並脈動光環，建立相對位置感（例：台灣在亞洲東緣、面向太平洋）。
  //   ★ 地圖中立性（HARD）：只畫七大洲色塊＋海洋，不畫國界、不標任何有主權爭議的疆界
  //     或名稱；定位針只落在洲別／假想區域層級；台灣以一個定位點呈現，不涉任何疆界主張。
  //   cfg = {
  //     pins:[{region?:String, xFrac:Number, yFrac:Number, label:String}],
  //        // xFrac/yFrac＝相對「地圖繪製區」的 0–1 座標（簡單投影、不需真實投影）
  //     caption?:String,   // 圖底固定說明（未給則顯示目前定位點的 label）
  //     cycle?:Boolean,    // true＝多播幾輪、輪流重新定位（建立相對位置感）
  //     label?:String      // 無障礙 aria-label
  //   }
  //   行為：pins 依序出現（掉針→脈動→留在原地），目前針脈動光環；phase=1 停在「全部定位」。
  //   reduced-motion：drawStatic 一次畫出全部定位針＋標籤（靜態定位幀）。
  //   契約：收 host、回傳 { stop }。
  // ====================================================================
  function worldLocator(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var pins: any[] = (cfg.pins && cfg.pins.length) ? cfg.pins : [{ xFrac: 0.80, yFrac: 0.44, label: '台灣' }];
    var N = pins.length;
    var PIN = '#e11d48';                 // 定位針（地圖標記色，中性）
    function clamp01(x: number): number { return x < 0 ? 0 : (x > 1 ? 1 : x); }

    // 七大洲（風格化色塊；僅「洲別」層級，無國界、無爭議疆界/名稱）。
    // 每個洲用數個橢圓 [cxFrac, cyFrac, rxFrac, ryFrac] 疊出大致輪廓；座標為地圖繪製區 0–1。
    var CONTINENTS: Array<{ name: string; lx: number; ly: number; blobs: number[][] }> = [
      { name: '北美洲', lx: 0.16, ly: 0.24, blobs: [[0.17, 0.27, 0.12, 0.10], [0.12, 0.40, 0.06, 0.07], [0.23, 0.41, 0.05, 0.055]] },
      { name: '南美洲', lx: 0.28, ly: 0.64, blobs: [[0.29, 0.66, 0.065, 0.095], [0.255, 0.80, 0.035, 0.065]] },
      { name: '歐洲', lx: 0.50, ly: 0.09, blobs: [[0.50, 0.25, 0.065, 0.065]] },
      { name: '非洲', lx: 0.55, ly: 0.64, blobs: [[0.545, 0.57, 0.085, 0.12]] },
      { name: '亞洲', lx: 0.69, ly: 0.20, blobs: [[0.70, 0.30, 0.145, 0.115], [0.805, 0.45, 0.055, 0.055]] },
      { name: '大洋洲', lx: 0.86, ly: 0.70, blobs: [[0.85, 0.75, 0.07, 0.06]] },
      { name: '南極洲', lx: 0.50, ly: 0.9, blobs: [[0.5, 0.985, 0.44, 0.055]] }
    ];
    var OCEANS: Array<[string, number, number]> = [['太平洋', 0.92, 0.52], ['大西洋', 0.40, 0.50], ['印度洋', 0.68, 0.70]];
    // 洲別名稱集合：若定位針的 label 已是某洲名（地圖上已標過），就不再重複畫針的文字標籤，
    // 只留針＋脈動＋動態 caption（例「定位：亞洲」），避免與洲別標籤疊字；台灣等非洲別點照常標。
    var CONT_NAMES = CONTINENTS.map(function (c) { return c.name; });
    function pinNeedsLabel(p: any): boolean { return CONT_NAMES.indexOf(p.label) === -1; }

    function ellipse(g: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
      g.beginPath();
      g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      g.fill();
    }
    function roundRectPath(g: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, r: number) {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + bw, y, x + bw, y + bh, r);
      g.arcTo(x + bw, y + bh, x, y + bh, r);
      g.arcTo(x, y + bh, x, y, r);
      g.arcTo(x, y, x + bw, y, r);
      g.closePath();
    }

    // 畫一支定位針（倒水滴＋圓孔），尖端落在 (x,y)。
    function drawPin(g: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) {
      g.save();
      g.globalAlpha = alpha;
      g.fillStyle = PIN;
      g.beginPath();
      g.moveTo(x, y);
      g.bezierCurveTo(x - size * 0.62, y - size * 0.9, x - size * 0.52, y - size * 1.9, x, y - size * 1.9);
      g.bezierCurveTo(x + size * 0.52, y - size * 1.9, x + size * 0.62, y - size * 0.9, x, y);
      g.fill();
      g.fillStyle = '#fff';
      disc(g, x, y - size * 1.35, size * 0.3, '#fff');
      g.restore();
    }

    function drawMap(g: CanvasRenderingContext2D, w: number, h: number) {
      var ink = inkColor(), su = themeColor();
      var mx0 = 10, my0 = 26, mx1 = w - 10, my1 = h - 24;
      var MW = mx1 - mx0, MH = my1 - my0;
      // 海洋淺底（圓角框）。
      g.save();
      g.fillStyle = 'rgba(90,160,210,0.12)';
      roundRectPath(g, mx0, my0, MW, MH, 12);
      g.fill();
      g.strokeStyle = ink; g.globalAlpha = 0.18; g.lineWidth = 1; g.stroke();
      g.restore();
      // 海洋名稱（淡）。
      for (var o = 0; o < OCEANS.length; o++) {
        var ox = mx0 + OCEANS[o][1] * MW, oy = my0 + OCEANS[o][2] * MH;
        g.save(); g.globalAlpha = 0.5; label(g, OCEANS[o][0], ox, oy, '#3a7bd5', 8.5, 'center'); g.restore();
      }
      // 七大洲色塊（--su tint）。
      g.save();
      g.beginPath();
      roundRectPath(g, mx0, my0, MW, MH, 12);
      g.clip();
      for (var c = 0; c < CONTINENTS.length; c++) {
        var ct = CONTINENTS[c];
        g.save(); g.fillStyle = su; g.globalAlpha = 0.3;
        for (var bI = 0; bI < ct.blobs.length; bI++) {
          var bl = ct.blobs[bI];
          ellipse(g, mx0 + bl[0] * MW, my0 + bl[1] * MH, bl[2] * MW, bl[3] * MH);
        }
        g.restore();
      }
      g.restore();
      // 洲別標籤。
      for (var c2 = 0; c2 < CONTINENTS.length; c2++) {
        var ct2 = CONTINENTS[c2];
        label(g, ct2.name, mx0 + ct2.lx * MW, my0 + ct2.ly * MH, su, 9, 'center');
      }
      return { mx0: mx0, my0: my0, MW: MW, MH: MH };
    }

    function pinXY(rect: any, p: any) {
      return { x: rect.mx0 + p.xFrac * rect.MW, y: rect.my0 + p.yFrac * rect.MH };
    }

    function draw(g: CanvasRenderingContext2D, phase: number, w: number, h: number) {
      var su = themeColor();
      label(g, '新聞說到哪裡，先在地圖上找到它', w / 2, 13, su, 11.5, 'center');
      var rect = drawMap(g, w, h);
      // 目前定位到第幾針。
      var cur = 0;
      for (var k = 0; k < N; k++) { if (phase >= k / N - 1e-6) cur = k; }
      var seg = 1 / N;
      for (var i = 0; i <= cur; i++) {
        var pos = pinXY(rect, pins[i]);
        var ws = i * seg;
        var drop = clamp01((phase - ws) / (seg * 0.4));
        var isCur = (i === cur);
        if (isCur && drop < 1) {
          // 掉針動畫：由上方落下。
          var fallY = pos.y - (1 - easeInOut(drop)) * 26;
          drawPin(g, pos.x, fallY, 7, 1);
        } else {
          // 已定位：脈動光環（目前針）＋固定針＋標籤。
          if (isCur) {
            var t = (nowMs() / 700) % 1;
            g.save();
            g.strokeStyle = PIN; g.globalAlpha = 0.5 * (1 - t); g.lineWidth = 2;
            g.beginPath(); g.arc(pos.x, pos.y, 4 + t * 14, 0, Math.PI * 2); g.stroke();
            g.restore();
          }
          drawPin(g, pos.x, pos.y, 7, 1);
          disc(g, pos.x, pos.y, 1.6, PIN);
          // 標籤（非洲別點才畫，例台灣）：靠近邊緣時改對齊方向，避免出框。
          if (pinNeedsLabel(pins[i])) {
            var al: CanvasTextAlign = pos.x > rect.mx0 + rect.MW * 0.7 ? 'right' : (pos.x < rect.mx0 + rect.MW * 0.3 ? 'left' : 'center');
            var lx = al === 'right' ? pos.x + 6 : (al === 'left' ? pos.x - 6 : pos.x);
            var ly = pos.y + 11 > rect.my0 + rect.MH - 6 ? pos.y - 18 : pos.y + 11;
            g.save();
            g.fillStyle = inkColor();
            g.font = '700 9px system-ui, -apple-system, "Segoe UI", sans-serif';
            g.textAlign = al; g.textBaseline = 'middle';
            g.fillText(pins[i].label, lx, ly);
            g.restore();
          }
        }
      }
      // 圖底說明。
      var cap = cfg.caption || ('定位：' + pins[cur].label);
      label(g, cap, w / 2, h - 9, su, 10, 'center');
    }

    // reduced-motion：一次畫出全部定位針＋標籤（靜態定位幀）。
    function drawStatic(g: CanvasRenderingContext2D, w: number, h: number) {
      var su = themeColor();
      label(g, '世界地圖：找出新聞發生在哪一洲', w / 2, 13, su, 11.5, 'center');
      var rect = drawMap(g, w, h);
      for (var i = 0; i < N; i++) {
        var pos = pinXY(rect, pins[i]);
        drawPin(g, pos.x, pos.y, 7, 1);
        disc(g, pos.x, pos.y, 1.6, PIN);
        if (pinNeedsLabel(pins[i])) {
          var al: CanvasTextAlign = pos.x > rect.mx0 + rect.MW * 0.7 ? 'right' : (pos.x < rect.mx0 + rect.MW * 0.3 ? 'left' : 'center');
          var lx = al === 'right' ? pos.x + 6 : (al === 'left' ? pos.x - 6 : pos.x);
          var ly = pos.y + 11 > rect.my0 + rect.MH - 6 ? pos.y - 18 : pos.y + 11;
          g.save();
          g.fillStyle = inkColor();
          g.font = '700 9px system-ui, -apple-system, "Segoe UI", sans-serif';
          g.textAlign = al; g.textBaseline = 'middle';
          g.fillText(pins[i].label, lx, ly);
          g.restore();
        }
      }
      label(g, cfg.caption || '先在地圖上定位，時事就有了方向感', w / 2, h - 9, su, 10, 'center');
    }

    var pinNames = pins.map(function (p: any) { return p.label; }).join('、');
    return runScene(host, {
      durationMs: N * 2200, loops: cfg.cycle ? 3 : 1, staticPhase: 1,
      label: cfg.label || ('世界地圖定位動畫：一張只畫七大洲色塊與海洋、不含國界的風格化世界地圖，依序在地圖上掉下定位針並脈動光環，標出 ' + pinNames + ' 的大致位置，幫你建立相對位置感。'),
      drawStatic: drawStatic,
      draw: draw
    });
  }

  // ====================================================================
  // 場景：placeValue — 位值與「四位一節」（個級／萬級／億級）＋國字讀法。
  //   cfg = { number:(Number|String), label? }
  //   把一個大整數的每個數字對齊到位值欄（個/十/百/千/萬/十萬/百萬/千萬/億…），
  //   動畫從右每 4 位落下一道「節」分隔，標出 個級／萬級／億級／兆級，並寫出讀法。
  //   台灣以「四位一節」分級（萬／億／兆）；教學點＝四位一節的中文分級與讀法
  //   （西式逗號每 3 位是另一回事，這裡刻意用 4 位一節）。
  //   reduced-motion：直接畫最終幀（含分節、級標籤與讀法）。
  // ====================================================================
  function placeValue(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var raw = (cfg.number === undefined || cfg.number === null) ? '12345678' : ('' + cfg.number);
    var digits = raw.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
    if (digits === '') digits = '0';
    if (digits.length > 16) digits = digits.substring(digits.length - 16);  // 上限兆級（16 位）
    var n = digits.length;

    var NUM = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    var SMALL = ['', '十', '百', '千'];
    var BIG = ['', '萬', '億', '兆'];
    var SEPC = '#e11d48';   // 節分隔＝固定紅（亮暗雙主題皆可讀，與頁主題色區隔）

    function placeName(pr: number): string {
      if (pr === 0) return '個';
      return SMALL[pr % 4] + BIG[Math.floor(pr / 4)];
    }
    function groupLabel(gi: number): string { return (gi === 0 ? '個' : BIG[gi]) + '級'; }

    // 讀法：四位一節，節內標準讀法＋節間補零。
    function readGroup4(g4: string): string {
      var out = '', zeroPending = false;
      for (var i = 0; i < 4; i++) {
        var d = g4.charCodeAt(i) - 48;
        var unit = SMALL[3 - i];
        if (d === 0) { zeroPending = (out !== ''); }
        else { if (zeroPending) { out += '零'; zeroPending = false; } out += NUM[d] + unit; }
      }
      return out;
    }
    function readChinese(s: string): string {
      if (s === '0') return '零';
      var groups: string[] = [];
      for (var i = s.length; i > 0; i -= 4) groups.unshift(('0000' + s.substring(Math.max(0, i - 4), i)).slice(-4));
      var gc = groups.length, res = '';
      for (var gi = 0; gi < gc; gi++) {
        var gr = readGroup4(groups[gi]);
        var bigUnit = BIG[gc - 1 - gi] || '';
        if (gr === '') {
          var later = false;
          for (var k = gi + 1; k < gc; k++) if (parseInt(groups[k], 10) !== 0) later = true;
          if (res !== '' && later && res.charAt(res.length - 1) !== '零') res += '零';
          continue;
        }
        if (res !== '' && groups[gi].charAt(0) === '0' && res.charAt(res.length - 1) !== '零') res += '零';
        res += gr + bigUnit;
      }
      if (res.indexOf('一十') === 0) res = res.substring(1);
      return res;
    }
    var reading = readChinese(digits);
    var numGroups = Math.ceil(n / 4);
    var sep = numGroups - 1;

    function frame(g: CanvasRenderingContext2D, w: number, h: number, gapT: number, grpA: number, readLen: number) {
      var ink = inkColor(), theme = themeColor();
      var padX = 16;
      var gapMax = 16;
      var cellW = Math.min(40, (w - 2 * padX - sep * gapMax) / n);
      if (cellW < 15) cellW = 15;
      var gap = gapMax * gapT;
      var totalW = n * cellW + sep * gap;
      var xLeft = (w - totalW) / 2;
      var digitTop = h * 0.30, digitH = Math.min(32, h * 0.17);
      var digitMid = digitTop + digitH / 2;

      label(g, '位值・四位一節（每 4 位一節：個級・萬級・億級）', w / 2, 14, theme, 11.5, 'center');

      function cx(i: number): number {
        var pr = n - 1 - i;
        var sepLeft = sep - Math.floor(pr / 4);
        return xLeft + i * cellW + sepLeft * gap + cellW / 2;
      }

      // 數字格 + 位值名（直向堆疊，最多 2 字）
      for (var i = 0; i < n; i++) {
        var x = cx(i), pr = n - 1 - i;
        g.save(); g.strokeStyle = ink; g.globalAlpha = 0.3; g.lineWidth = 1.2;
        g.strokeRect(x - cellW * 0.42, digitTop, cellW * 0.84, digitH); g.restore();
        label(g, digits.charAt(i), x, digitMid, theme, Math.min(22, cellW * 0.7), 'center');
        var pn = placeName(pr);
        for (var c = 0; c < pn.length; c++) label(g, pn.charAt(c), x, digitTop + digitH + 10 + c * 11, ink, 9.5, 'center');
      }

      // 級的括弧與標籤
      g.save(); g.globalAlpha = grpA;
      for (var gidx = 0; gidx < numGroups; gidx++) {
        var prLo = gidx * 4, prHi = gidx * 4 + 3;
        var iHi = n - 1 - prLo, iLo = Math.max(0, n - 1 - prHi);
        var xa = cx(iLo), xb = cx(iHi);
        var bx0 = xa - cellW * 0.42, bx1 = xb + cellW * 0.42, by = h * 0.22;
        g.strokeStyle = theme; g.lineWidth = 1.4;
        g.beginPath(); g.moveTo(bx0, by + 5); g.lineTo(bx0, by); g.lineTo(bx1, by); g.lineTo(bx1, by + 5); g.stroke();
        label(g, groupLabel(gidx), (bx0 + bx1) / 2, by - 7, theme, 10.5, 'center');
      }
      g.restore();

      // 節分隔虛線（紅）在每個 gap 中
      if (gap > 1) {
        g.save(); g.strokeStyle = SEPC; g.globalAlpha = 0.85 * gapT; g.lineWidth = 1.5; g.setLineDash([4, 3]);
        for (var s = 1; s <= sep; s++) {
          var iR = n - 1 - (4 * s - 1);
          var xg = cx(iR) - cellW * 0.42 - gap / 2;
          g.beginPath(); g.moveTo(xg, digitTop - 4); g.lineTo(xg, digitTop + digitH + 4); g.stroke();
        }
        g.restore();
      }

      // 讀法（底部），逐字顯示
      if (readLen > 0) {
        var shown = '讀作：' + reading.substring(0, Math.min(reading.length, readLen));
        bottomCap(g, w, h, shown, ink, 14);
      }
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var gapT = Math.max(0, Math.min(1, (p - 0.28) / 0.3));
      var grpA = Math.max(0, Math.min(1, (p - 0.34) / 0.3));
      var readLen = p > 0.62 ? Math.ceil((p - 0.62) / 0.38 * reading.length) : 0;
      frame(g, w, h, gapT, grpA, readLen);
    }

    return runScene(host, {
      durationMs: 7200, loops: 2, staticPhase: 1,
      label: cfg.label || ('位值動畫：把 ' + digits + ' 的每個數字對齊到位值欄（個・十・百・千・萬…），每 4 位一節落下分隔（個級、萬級、億級…依數字長度而定），讀作「' + reading + '」。'),
      drawStatic: function (g, w, h) { frame(g, w, h, 1, 1, reading.length); },
      draw: draw
    });
  }

  // ====================================================================
  // 場景：numberLine — 參數化數線（plain／round／negative）。
  //   cfg = { min, max, ticks, marks, highlight, mode, label, value, roundTo, flip }
  //     ticks＝刻度間距（每隔多少標一格；預設 (max-min)/10）
  //     marks＝[Number | {value, label?, color?}]，plain 模式逐一標點
  //     highlight＝要脈動強調的值
  //     mode:'plain'  — 一般標刻度＋標點。
  //     mode:'round'  — 一個值滾向較近的整十／整百（四捨五入）；標中點、顯示落在哪一邊。
  //                     extra: value（要四捨五入的值）、roundTo（10 或 100，預設 10）。
  //     mode:'negative' — 以 0 為界顯示正負方向；給 flip:{from,to,label?} 時演示
  //                     「乘以負數→方向相反」（箭頭反向）。此模式供他頁重用，cfg 保持乾淨通用。
  //   reduced-motion：畫最終幀（staticPhase=1）。
  // ====================================================================
  function numberLine(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var mode = cfg.mode || 'plain';
    var HL = '#e11d48';   // 固定紅（目標／反向），與頁主題色區隔；雙主題皆可讀

    // round 模式先求區間，供 min/max 預設使用。
    var rValue = (typeof cfg.value === 'number') ? cfg.value : 27;
    var roundTo = (typeof cfg.roundTo === 'number' && cfg.roundTo > 0) ? cfg.roundTo : 10;
    var rLower = Math.floor(rValue / roundTo) * roundTo, rUpper = rLower + roundTo, rMid = rLower + roundTo / 2;
    var rTarget = (rValue >= rMid) ? rUpper : rLower;

    var min = (typeof cfg.min === 'number') ? cfg.min : (mode === 'negative' ? -5 : (mode === 'round' ? rLower : 0));
    var max = (typeof cfg.max === 'number') ? cfg.max : (mode === 'negative' ? 5 : (mode === 'round' ? rUpper : 10));
    if (max <= min) max = min + 1;
    var step = (typeof cfg.ticks === 'number' && cfg.ticks > 0) ? cfg.ticks : (max - min) / 10;
    var marks = Array.isArray(cfg.marks) ? cfg.marks : [];
    var highlight = (typeof cfg.highlight === 'number') ? cfg.highlight : null;

    function fmt(v: number): string { return '' + (Math.round(v * 100) / 100); }
    function geo(h: number) { return { padL: 28, padR: 22, axY: Math.round(h * 0.56) }; }
    function X(v: number, w: number, h: number): number { var L = geo(h); return L.padL + (v - min) / (max - min) * (w - L.padL - L.padR); }

    function arrow(g: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, col: string) {
      g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2.6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
      var a = Math.atan2(y2 - y1, x2 - x1);
      g.beginPath(); g.moveTo(x2, y2);
      g.lineTo(x2 - 10 * Math.cos(a - 0.42), y2 - 10 * Math.sin(a - 0.42));
      g.lineTo(x2 - 10 * Math.cos(a + 0.42), y2 - 10 * Math.sin(a + 0.42));
      g.closePath(); g.fill(); g.restore();
    }

    function axis(g: CanvasRenderingContext2D, w: number, h: number, ink: string) {
      var L = geo(h), y = L.axY, x0 = L.padL, x1 = w - L.padR;
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.6; g.lineWidth = 2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0 - 6, y); g.lineTo(x1 + 6, y); g.stroke();
      g.fillStyle = ink;
      g.beginPath(); g.moveTo(x1 + 10, y); g.lineTo(x1 + 2, y - 4); g.lineTo(x1 + 2, y + 4); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(x0 - 10, y); g.lineTo(x0 - 2, y - 4); g.lineTo(x0 - 2, y + 4); g.closePath(); g.fill();
      g.restore();
      var nT = Math.round((max - min) / step);
      for (var i = 0; i <= nT; i++) {
        var v = min + i * step, x = X(v, w, h);
        var isZero = Math.abs(v) < 1e-9;
        g.save(); g.strokeStyle = ink; g.globalAlpha = isZero ? 0.9 : 0.5; g.lineWidth = isZero ? 2.2 : 1.4;
        g.beginPath(); g.moveTo(x, y - (isZero ? 8 : 5)); g.lineTo(x, y + (isZero ? 8 : 5)); g.stroke(); g.restore();
        label(g, fmt(v), x, y + 17, ink, isZero ? 11 : 10, 'center');
      }
    }

    function drawPlain(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor(), L = geo(h), y = L.axY;
      axis(g, w, h, ink);
      label(g, cfg.title || '數線：每一點都有自己的位置', w / 2, 14, theme, 12, 'center');
      var showN = Math.ceil(marks.length * Math.max(0, Math.min(1, p / 0.85)));
      for (var i = 0; i < showN && i < marks.length; i++) {
        var m = marks[i];
        var v = (typeof m === 'number') ? m : m.value;
        var col = (m && m.color) ? m.color : theme;
        var x = X(v, w, h);
        disc(g, x, y, 4.5, col);
        var lab = (m && m.label) ? m.label : fmt(v);
        label(g, lab, x, y - 12, col, 11, 'center');
      }
      if (highlight !== null) {
        var hx = X(highlight, w, h);
        var r = 6 + 2 * Math.sin(nowMs() / 300);
        g.save(); g.strokeStyle = theme; g.lineWidth = 2.4; g.beginPath(); g.arc(hx, y, r, 0, Math.PI * 2); g.stroke(); g.restore();
        label(g, fmt(highlight), hx, y - 14, theme, 11.5, 'center');
      }
    }

    function drawRound(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor(), L = geo(h), y = L.axY;
      label(g, '四捨五入到最近的 ' + roundTo, w / 2, 14, theme, 12, 'center');
      // 兩半底色：靠近 lower 的一半＝捨、靠近 upper 的一半＝入
      var xL = X(rLower, w, h), xM = X(rMid, w, h), xU = X(rUpper, w, h);
      g.save(); g.globalAlpha = 0.1;
      g.fillStyle = ink; g.fillRect(xL, y - 10, xM - xL, 20);
      g.fillStyle = HL; g.fillRect(xM, y - 10, xU - xM, 20);
      g.restore();
      axis(g, w, h, ink);
      // 中點虛線
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.6; g.lineWidth = 1.4; g.setLineDash([5, 4]);
      g.beginPath(); g.moveTo(xM, y - 26); g.lineTo(xM, y + 10); g.stroke(); g.restore();
      label(g, '中點 ' + fmt(rMid), xM, y - 32, ink, 10.5, 'center');
      // 目標刻度（紅）
      var xt = X(rTarget, w, h);
      g.save(); g.strokeStyle = HL; g.lineWidth = 2.4; g.beginPath(); g.moveTo(xt, y - 9); g.lineTo(xt, y + 9); g.stroke(); g.restore();
      // 滾動的球：從 value 滑到 target
      var bx = X(rValue, w, h) + (xt - X(rValue, w, h)) * easeInOut(Math.max(0, Math.min(1, p)));
      disc(g, bx, y - 15, 6.5, theme);
      label(g, fmt(rValue), X(rValue, w, h), y + 30, theme, 11, 'center');
      var side = (rValue >= rMid) ? (fmt(rValue) + ' ≥ 中點 → 進位到 ' + fmt(rTarget)) : (fmt(rValue) + ' ＜ 中點 → 捨去到 ' + fmt(rTarget));
      bottomCap(g, w, h, side, (rValue >= rMid) ? HL : ink, 11.5);
    }

    function drawNegative(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor(), L = geo(h), y = L.axY;
      axis(g, w, h, ink);
      var x0 = X(0, w, h);
      label(g, cfg.title || '正負數：0 的兩邊是相反方向', w / 2, 14, theme, 12, 'center');
      label(g, '− 負向', (X(min, w, h) + x0) / 2, y + 32, ink, 10.5, 'center');
      label(g, '＋ 正向', (x0 + X(max, w, h)) / 2, y + 32, ink, 10.5, 'center');
      var flip = cfg.flip;
      if (flip && typeof flip.from === 'number' && typeof flip.to === 'number') {
        var ay = y - 22;
        var xf = X(flip.from, w, h), xt2 = X(flip.to, w, h);
        if (p < 0.5) {
          var g1 = easeInOut(p / 0.5);
          arrow(g, x0, ay, x0 + (xf - x0) * g1, ay, theme);
          if (p > 0.35) label(g, fmt(flip.from), xf, ay - 10, theme, 11, 'center');
        } else {
          g.save(); g.globalAlpha = 0.35; arrow(g, x0, ay, xf, ay, theme); g.restore();
          var g2 = easeInOut((p - 0.5) / 0.5);
          arrow(g, x0, ay, x0 + (xt2 - x0) * g2, ay, HL);
          if (p > 0.7) label(g, fmt(flip.to), xt2, ay - 10, HL, 11, 'center');
        }
        bottomCap(g, w, h, flip.label || ('× 負數：方向相反（' + fmt(flip.from) + ' → ' + fmt(flip.to) + '）'), (p >= 0.5 ? HL : ink), 11.5);
      } else if (highlight !== null) {
        var hx2 = X(highlight, w, h);
        arrow(g, x0, y - 22, hx2, y - 22, highlight >= 0 ? theme : HL);
        label(g, fmt(highlight), hx2, y - 32, highlight >= 0 ? theme : HL, 11.5, 'center');
      }
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      if (mode === 'round') drawRound(g, p, w, h);
      else if (mode === 'negative') drawNegative(g, p, w, h);
      else drawPlain(g, p, w, h);
    }

    return runScene(host, {
      durationMs: mode === 'plain' ? 5200 : 5600, loops: 2, staticPhase: 1,
      label: cfg.label || (mode === 'round'
        ? ('四捨五入動畫：' + fmt(rValue) + ' 在 ' + fmt(rLower) + ' 和 ' + fmt(rUpper) + ' 之間，中點是 ' + fmt(rMid) + '；' + fmt(rValue) + (rValue >= rMid ? ' 到中點以上，進位到 ' : ' 到中點以下，捨去到 ') + fmt(rTarget) + '。')
        : (mode === 'negative'
          ? '正負數線動畫：以 0 為界，右邊是正向、左邊是負向；乘以負數時，箭頭會指向相反方向。'
          : '數線動畫：在數線上依序標出各點的位置。')),
      draw: draw
    });
  }

  // ====================================================================
  // 場景：partWhole100 — 同一個量的四種面貌（分數／小數／百分比／比）。
  //   cfg = { num, den, label }
  //   一個 10×10 百格，填滿 num/den；同時在四個讀出框顯示 分數 n/d、小數、百分比 %、比 a:b。
  //   例：num:3, den:4 → 填 75 格 → 3/4 ＝ 0.75 ＝ 75% ＝ 3:4。
  //   reduced-motion：畫最終幀（填滿＋四框）。
  // ====================================================================
  function partWhole100(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var num = (typeof cfg.num === 'number') ? cfg.num : 3;
    var den = (typeof cfg.den === 'number' && cfg.den > 0) ? cfg.den : 4;
    var value = num / den;
    var targetCells = Math.max(0, Math.min(100, value * 100));

    function gcd(a: number, b: number): number { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
    var gg = gcd(Math.round(num), Math.round(den));
    var rn = Math.round(num) / gg, rd = Math.round(den) / gg;
    function dec(x: number): string { return '' + (Math.round(x * 1000) / 1000); }
    function pct(x: number): string { return '' + (Math.round(x * 1000) / 10) + '%'; }

    function box(g: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number, head: string, val: string, ink: string, theme: string, hot: boolean) {
      g.save();
      g.strokeStyle = hot ? theme : ink; g.globalAlpha = hot ? 0.9 : 0.4; g.lineWidth = hot ? 2 : 1.3;
      g.beginPath(); g.rect(x, y, bw, bh); g.stroke(); g.restore();
      label(g, head, x + bw / 2, y + 13, theme, 10.5, 'center');
      label(g, val, x + bw / 2, y + bh - 13, ink, Math.min(16, bw * 0.28), 'center');
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      label(g, '同一個量的四種說法', w / 2, 14, theme, 12, 'center');
      var S = Math.min(w * 0.5, h * 0.5);
      var gx = (w - S) / 2, gy = h * 0.11;
      var cur = targetCells * easeInOut(Math.max(0, Math.min(1, p)));
      var full = Math.floor(cur + 1e-6), frac = cur - full;
      // 填色（左到右、上到下）
      for (var k = 0; k < 100; k++) {
        var col = k % 10, row = Math.floor(k / 10);
        var cxp = gx + col * (S / 10), cyp = gy + row * (S / 10), cs = S / 10;
        var fillW = (k < full) ? cs : (k === full ? cs * frac : 0);
        if (fillW > 0.3) { g.save(); g.fillStyle = theme; g.globalAlpha = 0.8; g.fillRect(cxp, cyp, fillW, cs); g.restore(); }
      }
      // 格線
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.3; g.lineWidth = 1;
      for (var i = 0; i <= 10; i++) {
        g.beginPath(); g.moveTo(gx + i * (S / 10), gy); g.lineTo(gx + i * (S / 10), gy + S); g.stroke();
        g.beginPath(); g.moveTo(gx, gy + i * (S / 10)); g.lineTo(gx + S, gy + i * (S / 10)); g.stroke();
      }
      g.restore();
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.6; g.lineWidth = 1.6; g.strokeRect(gx, gy, S, S); g.restore();

      // 四個讀出框
      var by = gy + S + 12, bh = Math.min(44, h - by - 24);
      var pad = 10, gapb = 7;
      var bw = (w - 2 * pad - 3 * gapb) / 4;
      var fin = p >= 0.985;
      box(g, pad + 0 * (bw + gapb), by, bw, bh, '分數', rn + '/' + rd, ink, theme, fin);
      box(g, pad + 1 * (bw + gapb), by, bw, bh, '小數', dec(cur / 100), ink, theme, true);
      box(g, pad + 2 * (bw + gapb), by, bw, bh, '百分比', pct(cur / 100), ink, theme, true);
      box(g, pad + 3 * (bw + gapb), by, bw, bh, '比（填:總）', rn + ':' + rd, ink, theme, fin);

      var chain = rn + '/' + rd + ' ＝ ' + dec(value) + ' ＝ ' + pct(value) + ' ＝ ' + rn + ':' + rd;
      bottomCap(g, w, h, fin ? ('都是同一個量：' + chain) : ('已填 ' + (Math.round(cur * 10) / 10) + ' 格 ／ 100 格'), fin ? theme : ink, 11);
    }

    return runScene(host, {
      durationMs: 4200, loops: 2, staticPhase: 1,
      label: cfg.label || ('百格動畫：在 10×10 的百格裡填滿 ' + rn + '/' + rd + '，同時看到它的四種說法：分數 ' + rn + '/' + rd + '、小數 ' + dec(value) + '、百分比 ' + pct(value) + '、比 ' + rn + ':' + rd + '，其實都是同一個量。'),
      draw: draw
    });
  }

  // ====================================================================
  // 場景：solid3D — 立體圖形的體積與表面積（參數化）。
  //   cfg = { shape:'prism'|'cylinder'|'cone'|'sphere', mode:'fill'|'unfold', label }
  //   mode:'fill'   — 底面一層層疊上去 → 柱體體積＝底面積×高；錐體用「倒水 3 次才裝滿柱」
  //                   示意 錐＝柱的 1/3；球用疊圓盤堆出體積（V＝4/3·π·r³）。
  //   mode:'unfold' — 攤平成展開圖 → 表面積＝各面面積和；柱／角柱：兩個底＋一片側面長方形
  //                   （長＝底周長）；錐：底圓＋側面扇形；球：攤成 4 個大圓（4·π·r²）。
  //   reduced-motion：畫最終幀（staticPhase=1）。
  // ====================================================================
  function solid3D(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var shape = cfg.shape || 'prism';
    var mode = cfg.mode || 'fill';
    var WATER = '#38bdf8', WATER_F = 'rgba(56,189,248,0.32)';
    var PI = Math.PI;

    function ell(g: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
      g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, PI * 2);
    }
    function cap(g: CanvasRenderingContext2D, w: number, h: number, text: string, col: string) {
      bottomCap(g, w, h, text, col, 11.5);
    }

    // ---- 長方體（柱）---------------------------------------------------
    function prismFill(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      var bw = Math.min(w * 0.30, 108), ht = Math.min(h * 0.42, 128);
      var dxp = bw * 0.42, dyp = -bw * 0.24;
      var x0 = w * 0.32 - bw / 2, yB = h * 0.74;
      // 隱藏（後）邊：淡
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.22; g.lineWidth = 1; g.setLineDash([3, 3]);
      g.beginPath(); g.moveTo(x0 + dxp, yB + dyp); g.lineTo(x0 + bw + dxp, yB + dyp); g.lineTo(x0 + bw + dxp, yB - ht + dyp); g.stroke();
      g.beginPath(); g.moveTo(x0 + dxp, yB + dyp); g.lineTo(x0, yB); g.stroke();
      g.restore();
      // 填到目前高度
      var fh = ht * easeInOut(Math.max(0, Math.min(1, p / 0.88)));
      g.save(); g.fillStyle = theme; g.globalAlpha = 0.75; g.fillRect(x0, yB - fh, bw, fh); g.restore();
      g.save(); g.fillStyle = theme; g.globalAlpha = 0.5;
      g.beginPath(); g.moveTo(x0, yB - fh); g.lineTo(x0 + bw, yB - fh); g.lineTo(x0 + bw + dxp, yB - fh + dyp); g.lineTo(x0 + dxp, yB - fh + dyp); g.closePath(); g.fill(); g.restore();
      // 層線
      var nL = 5;
      g.save(); g.strokeStyle = '#ffffff'; g.globalAlpha = 0.5; g.lineWidth = 1;
      for (var kk = 1; kk < nL; kk++) { var ly = yB - ht * kk / nL; if (ly > yB - fh) { g.beginPath(); g.moveTo(x0, ly); g.lineTo(x0 + bw, ly); g.stroke(); } }
      g.restore();
      // 線框（前面、頂面、右面）
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.8; g.lineWidth = 1.8;
      g.strokeRect(x0, yB - ht, bw, ht);
      g.beginPath(); g.moveTo(x0, yB - ht); g.lineTo(x0 + dxp, yB - ht + dyp); g.lineTo(x0 + bw + dxp, yB - ht + dyp); g.lineTo(x0 + bw, yB - ht); g.stroke();
      g.beginPath(); g.moveTo(x0 + bw, yB - ht); g.lineTo(x0 + bw + dxp, yB - ht + dyp); g.lineTo(x0 + bw + dxp, yB + dyp); g.lineTo(x0 + bw, yB); g.stroke();
      g.restore();
      // 標註
      label(g, '底面積', x0 + bw / 2, yB - 11, ink, 10.5, 'center');
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.7; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(x0 - 10, yB); g.lineTo(x0 - 10, yB - ht); g.stroke(); g.restore();
      label(g, '高', x0 - 20, yB - ht / 2, ink, 10.5, 'center');
      label(g, '一層層疊上去', w * 0.78, h * 0.4, theme, 11, 'center');
      label(g, '每層都是一個底面', w * 0.78, h * 0.4 + 16, ink, 10, 'center');
      cap(g, w, h, '柱體體積 ＝ 底面積 × 高', theme);
    }

    function prismUnfold(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      // 底面寬 a、深 b、高 c。周長＝2(a+b)。側面攤平成長＝周長、高＝c 的長方形。
      var a = Math.min(w * 0.14, 46), b = a * 0.6, c = Math.min(h * 0.26, 64);
      var perim = 2 * (a + b);
      var midY = h * 0.5;
      var sx = (w - perim) / 2; if (sx < 10) { var sc = (w - 20) / perim; perim *= sc; a *= sc; b *= sc; sx = 10; }
      var sy = midY - c / 2;
      var grow = easeInOut(Math.max(0, Math.min(1, (p - 0.15) / 0.55)));
      label(g, '把立體攤平成展開圖', w / 2, 14, theme, 12, 'center');
      // 側面長方形（長＝周長，動畫展開）
      var curW = perim * grow;
      g.save(); g.fillStyle = theme; g.globalAlpha = 0.16; g.fillRect(sx, sy, curW, c); g.restore();
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.75; g.lineWidth = 1.6; g.strokeRect(sx, sy, curW, c); g.restore();
      // 面摺線（a,b,a,b）
      var segs = [a, b, a, b], acc = 0;
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.4; g.lineWidth = 1; g.setLineDash([4, 3]);
      for (var i = 0; i < 3; i++) { acc += segs[i]; if (acc < curW) { g.beginPath(); g.moveTo(sx + acc, sy); g.lineTo(sx + acc, sy + c); g.stroke(); } }
      g.restore();
      if (grow > 0.98) label(g, '長 ＝ 底周長', sx + perim / 2, sy + c + 14, ink, 10.5, 'center');
      // 兩個底（上、下方），後段出現
      var baseA = Math.max(0, Math.min(1, (p - 0.72) / 0.28));
      if (baseA > 0.02) {
        g.save(); g.globalAlpha = baseA;
        g.fillStyle = theme; g.globalAlpha = baseA * 0.16; g.fillRect(sx, sy - b - 6, a, b); g.fillRect(sx, sy + c + 6, a, b);
        g.globalAlpha = baseA; g.strokeStyle = ink; g.lineWidth = 1.4;
        g.strokeRect(sx, sy - b - 6, a, b); g.strokeRect(sx, sy + c + 6, a, b);
        label(g, '底', sx + a / 2, sy - b - 6 + b / 2, ink, 10, 'center');
        label(g, '底', sx + a / 2, sy + c + 6 + b / 2, ink, 10, 'center');
        g.restore();
      }
      cap(g, w, h, '表面積 ＝ 2 × 底面積 ＋ 周長 × 高', theme);
    }

    // ---- 圓柱 ----------------------------------------------------------
    function cylFill(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      var r = Math.min(w * 0.16, 60), ry = r * 0.32, ht = Math.min(h * 0.42, 124);
      var cx = w * 0.32, topY = h * 0.26, botY = topY + ht;
      var fh = ht * easeInOut(Math.max(0, Math.min(1, p / 0.88)));
      var wy = botY - fh;
      // 側壁（後方虛線）
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.22; g.lineWidth = 1; g.setLineDash([3, 3]);
      ell(g, cx, botY, r, ry); g.stroke(); g.restore();
      // 水
      g.save(); g.beginPath(); g.rect(cx - r, wy, 2 * r, fh); g.clip();
      g.fillStyle = theme; g.globalAlpha = 0.72; g.fillRect(cx - r, wy, 2 * r, fh);
      g.restore();
      g.save(); g.fillStyle = theme; g.globalAlpha = 0.72; ell(g, cx, botY, r, ry); g.fill(); g.restore();
      if (fh > 2) { g.save(); g.fillStyle = theme; g.globalAlpha = 0.5; ell(g, cx, wy, r, ry); g.fill(); g.restore(); }
      // 疊盤線
      g.save(); g.strokeStyle = '#ffffff'; g.globalAlpha = 0.45; g.lineWidth = 1;
      for (var kk = 1; kk < 5; kk++) { var ly = botY - ht * kk / 5; if (ly > wy) { g.beginPath(); g.moveTo(cx - r, ly); g.lineTo(cx + r, ly); g.stroke(); } }
      g.restore();
      // 線框
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.8; g.lineWidth = 1.8;
      g.beginPath(); g.moveTo(cx - r, topY); g.lineTo(cx - r, botY); g.stroke();
      g.beginPath(); g.moveTo(cx + r, topY); g.lineTo(cx + r, botY); g.stroke();
      ell(g, cx, topY, r, ry); g.stroke();
      g.save(); g.globalAlpha = 0.4; g.beginPath(); g.ellipse(cx, botY, r, ry, 0, 0, PI); g.stroke(); g.restore();
      g.restore();
      label(g, '底面積 ＝ π × 半徑²', cx, botY + ry + 14, ink, 10, 'center');
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.7; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx + r + 12, topY); g.lineTo(cx + r + 12, botY); g.stroke(); g.restore();
      label(g, '高', cx + r + 22, (topY + botY) / 2, ink, 10.5, 'center');
      cap(g, w, h, '圓柱體積 ＝ 底面積 × 高', theme);
    }

    function cylUnfold(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      var r = Math.min(w * 0.1, 30), ht = Math.min(h * 0.26, 60);
      var circ = 2 * PI * r;
      var rectW = Math.min(circ, w - 40);
      var scale = rectW / circ;
      var midY = h * 0.52, sx = (w - rectW) / 2, sy = midY - ht / 2;
      var grow = easeInOut(Math.max(0, Math.min(1, (p - 0.15) / 0.55)));
      label(g, '把圓柱側面攤平', w / 2, 14, theme, 12, 'center');
      var curW = rectW * grow;
      g.save(); g.fillStyle = theme; g.globalAlpha = 0.16; g.fillRect(sx, sy, curW, ht); g.restore();
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.75; g.lineWidth = 1.6; g.strokeRect(sx, sy, curW, ht); g.restore();
      if (grow > 0.98) label(g, '長 ＝ 圓周長 ＝ 2 × π × 半徑', sx + rectW / 2, sy + ht + 14, ink, 10.5, 'center');
      // 兩個底圓
      var baseA = Math.max(0, Math.min(1, (p - 0.72) / 0.28));
      if (baseA > 0.02) {
        g.save(); g.globalAlpha = baseA;
        var rr = r * scale;
        var topcx = sx + rr, topcy = sy - rr - 8, botcx = sx + rr, botcy = sy + ht + rr + 8;
        g.fillStyle = theme; g.globalAlpha = baseA * 0.16; ell(g, topcx, topcy, rr, rr); g.fill(); ell(g, botcx, botcy, rr, rr); g.fill();
        g.globalAlpha = baseA; g.strokeStyle = ink; g.lineWidth = 1.4; ell(g, topcx, topcy, rr, rr); g.stroke(); ell(g, botcx, botcy, rr, rr); g.stroke();
        label(g, '底圓', topcx, topcy, ink, 9.5, 'center'); label(g, '底圓', botcx, botcy, ink, 9.5, 'center');
        g.restore();
      }
      cap(g, w, h, '表面積 ＝ 2 × 底圓(π·半徑²) ＋ 側面(周長 × 高)', theme);
    }

    // ---- 圓錐 ----------------------------------------------------------
    function coneFill(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      var r = Math.min(w * 0.12, 44), ry = r * 0.3, ht = Math.min(h * 0.4, 118);
      var topY = h * 0.26, botY = topY + ht;
      var cCx = w * 0.3;    // 左：錐
      var yCx = w * 0.68;   // 右：柱
      // 右：柱（含 3 等分帶）
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.8; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(yCx - r, topY); g.lineTo(yCx - r, botY); g.stroke();
      g.beginPath(); g.moveTo(yCx + r, topY); g.lineTo(yCx + r, botY); g.stroke();
      ell(g, yCx, topY, r, ry); g.stroke(); ell(g, yCx, botY, r, ry); g.stroke(); g.restore();
      var fill = easeInOut(Math.max(0, Math.min(1, p)));
      var wy = botY - ht * fill;
      g.save(); g.beginPath(); g.rect(yCx - r, wy, 2 * r, botY - wy); g.clip();
      g.fillStyle = WATER_F; g.fillRect(yCx - r, wy, 2 * r, botY - wy); g.restore();
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.35; g.lineWidth = 1; g.setLineDash([4, 3]);
      for (var t = 1; t < 3; t++) { var ly = botY - ht * t / 3; g.beginPath(); g.moveTo(yCx - r, ly); g.lineTo(yCx + r, ly); g.stroke(); }
      g.restore();
      // 左：錐（倒水循環）
      var cyc = p * 3, idx = Math.floor(cyc), fr = cyc - idx;
      var coneLvl = (fr < 0.6) ? fr / 0.6 : 1 - (fr - 0.6) / 0.4;
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.8; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(cCx, topY); g.lineTo(cCx - r, botY); g.stroke();
      g.beginPath(); g.moveTo(cCx, topY); g.lineTo(cCx + r, botY); g.stroke();
      ell(g, cCx, botY, r, ry); g.stroke(); g.restore();
      // 錐內水（下方三角）
      var wTop = botY - (botY - topY) * coneLvl * 0.86;
      var halfAtW = r * (botY - wTop) / ht;
      g.save(); g.beginPath();
      g.moveTo(cCx - halfAtW, wTop); g.lineTo(cCx + halfAtW, wTop); g.lineTo(cCx + r, botY); g.lineTo(cCx - r, botY); g.closePath();
      g.fillStyle = WATER_F; g.fill(); g.restore();
      // 倒水箭頭
      if (fr >= 0.6 && idx < 3) {
        g.save(); g.strokeStyle = WATER; g.fillStyle = WATER; g.lineWidth = 2; g.lineCap = 'round';
        var ax1 = cCx + r, ay1 = topY + 6, ax2 = yCx - r - 4, ay2 = topY + 2;
        g.beginPath(); g.moveTo(ax1, ay1); g.quadraticCurveTo((ax1 + ax2) / 2, topY - 12, ax2, ay2); g.stroke();
        var aa = Math.atan2(ay2 - (topY - 12), ax2 - (ax1 + ax2) / 2);
        g.beginPath(); g.moveTo(ax2, ay2); g.lineTo(ax2 - 9 * Math.cos(aa - 0.5), ay2 - 9 * Math.sin(aa - 0.5)); g.lineTo(ax2 - 9 * Math.cos(aa + 0.5), ay2 - 9 * Math.sin(aa + 0.5)); g.closePath(); g.fill();
        g.restore();
      }
      label(g, '錐', cCx, botY + ry + 12, ink, 10.5, 'center');
      label(g, '柱', yCx, botY + ry + 12, ink, 10.5, 'center');
      var pourNo = Math.min(3, idx + 1);
      cap(g, w, h, p >= 0.985 ? '3 錐剛好裝滿 1 柱 → 錐體積 ＝ 柱的 1/3' : ('倒第 ' + pourNo + ' 杯（1 錐 ＝ 1/3 柱）'), theme);
    }

    function coneUnfold(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      var r = Math.min(w * 0.1, 30);
      var slant = Math.min(h * 0.3, 80);
      var arc = 2 * PI * r;                 // 側面扇形弧長 ＝ 底周長
      var theta = arc / slant;              // 扇形角（弧度）
      var apex = { x: w * 0.42, y: h * 0.26 };
      var grow = easeInOut(Math.max(0, Math.min(1, (p - 0.15) / 0.6)));
      label(g, '把圓錐攤平', w / 2, 14, theme, 12, 'center');
      // 扇形（側面），由 0 掃到 theta
      var a0 = PI / 2 - theta / 2, a1 = a0 + theta * grow;
      g.save();
      g.beginPath(); g.moveTo(apex.x, apex.y); g.arc(apex.x, apex.y, slant, a0, a1); g.closePath();
      g.fillStyle = theme; g.globalAlpha = 0.16; g.fill();
      g.globalAlpha = 0.8; g.strokeStyle = ink; g.lineWidth = 1.6; g.stroke();
      g.restore();
      if (grow > 0.97) {
        var midA = (a0 + a1) / 2;
        label(g, '弧長 ＝ 底周長', apex.x + Math.cos(midA) * (slant + 16), apex.y + Math.sin(midA) * (slant + 16), ink, 10, 'center');
        label(g, '側面扇形', apex.x + Math.cos(midA) * slant * 0.55, apex.y + Math.sin(midA) * slant * 0.55, theme, 10, 'center');
      }
      // 底圓
      var baseA = Math.max(0, Math.min(1, (p - 0.76) / 0.24));
      if (baseA > 0.02) {
        var bcx = apex.x, bcy = apex.y + slant + r + 10;
        g.save(); g.globalAlpha = baseA; g.fillStyle = theme; g.globalAlpha = baseA * 0.16; ell(g, bcx, bcy, r, r); g.fill();
        g.globalAlpha = baseA; g.strokeStyle = ink; g.lineWidth = 1.4; ell(g, bcx, bcy, r, r); g.stroke();
        label(g, '底圓', bcx, bcy, ink, 10, 'center'); g.restore();
      }
      cap(g, w, h, '表面積 ＝ 底圓(π·半徑²) ＋ 側面扇形', theme);
    }

    // ---- 球 ------------------------------------------------------------
    function sphereFill(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      var R = Math.min(w * 0.18, h * 0.26, 86);
      var cx = w * 0.36, cy = h * 0.44;
      var lvl = easeInOut(Math.max(0, Math.min(1, p)));
      // 疊圓盤（由下往上到 lvl）
      var steps = 11;
      g.save();
      for (var i = 0; i < steps; i++) {
        var yy = cy + R - (i + 0.5) * (2 * R / steps);
        if (yy < cy + R - 2 * R * lvl) continue;
        var dy = yy - cy; var rr = Math.sqrt(Math.max(0, R * R - dy * dy));
        g.fillStyle = theme; g.globalAlpha = 0.5; ell(g, cx, yy, rr, rr * 0.3); g.fill();
      }
      g.restore();
      // 球外框 + 赤道
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.8; g.lineWidth = 1.8; ell(g, cx, cy, R, R); g.stroke();
      g.globalAlpha = 0.3; g.setLineDash([4, 3]); ell(g, cx, cy, R, R * 0.3); g.stroke(); g.restore();
      // 半徑
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.7; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R, cy); g.stroke(); g.restore();
      label(g, '半徑', cx + R * 0.5, cy - 9, ink, 10, 'center');
      label(g, '一片片圓盤', w * 0.8, h * 0.4, theme, 10.5, 'center');
      label(g, '疊出體積', w * 0.8, h * 0.4 + 15, ink, 10, 'center');
      cap(g, w, h, '球體積 ＝ 4/3 × π × 半徑³', theme);
    }

    function sphereUnfold(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var ink = inkColor(), theme = themeColor();
      var R = Math.min(w * 0.11, 34);
      var cx = w * 0.26, cy = h * 0.32;
      label(g, '球面攤成 4 個大圓', w / 2, 14, theme, 12, 'center');
      // 球
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.8; g.lineWidth = 1.8; ell(g, cx, cy, R, R); g.stroke();
      g.globalAlpha = 0.3; g.setLineDash([4, 3]); ell(g, cx, cy, R, R * 0.3); g.stroke(); g.restore();
      // 4 個大圓（2×2），逐一出現
      var gx = w * 0.56, gy = h * 0.3, gap = R * 2.3;
      var pos = [[gx, gy], [gx + gap, gy], [gx, gy + gap], [gx + gap, gy + gap]];
      var shown = Math.max(0, Math.min(4, Math.floor(p * 4 + 0.001) + (p >= 1 ? 0 : 1)));
      if (p >= 0.999) shown = 4;
      for (var i = 0; i < shown && i < 4; i++) {
        var cxx = pos[i][0], cyy = pos[i][1];
        g.save(); g.fillStyle = theme; g.globalAlpha = 0.16; ell(g, cxx, cyy, R, R); g.fill();
        g.globalAlpha = 0.8; g.strokeStyle = ink; g.lineWidth = 1.4; ell(g, cxx, cyy, R, R); g.stroke();
        label(g, 'π·半徑²', cxx, cyy, ink, 9, 'center'); g.restore();
      }
      cap(g, w, h, '球表面積 ＝ 4 × 大圓 ＝ 4 × π × 半徑²', theme);
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      if (shape === 'cylinder') { if (mode === 'unfold') cylUnfold(g, p, w, h); else cylFill(g, p, w, h); }
      else if (shape === 'cone') { if (mode === 'unfold') coneUnfold(g, p, w, h); else coneFill(g, p, w, h); }
      else if (shape === 'sphere') { if (mode === 'unfold') sphereUnfold(g, p, w, h); else sphereFill(g, p, w, h); }
      else { if (mode === 'unfold') prismUnfold(g, p, w, h); else prismFill(g, p, w, h); }
    }

    var SHN: any = { prism: '長方體', cylinder: '圓柱', cone: '圓錐', sphere: '球' };
    return runScene(host, {
      durationMs: (shape === 'cone' && mode === 'fill') ? 7800 : 6200, loops: 2, staticPhase: 1,
      label: cfg.label || (SHN[shape] + (mode === 'unfold'
        ? '展開圖動畫：把立體攤平成展開圖，看出表面積就是各個面的面積加起來。'
        : '體積動畫：' + (shape === 'cone' ? '用錐倒水 3 次剛好裝滿同底同高的柱，所以錐體積是柱的三分之一。' : (shape === 'sphere' ? '用一片片圓盤疊出球的體積。' : '底面一層層往上疊，體積就是底面積乘以高。')))),
      draw: draw
    });
  }

  // ====================================================================
  // 場景：zhuyinBlend — 注音拼讀。聲母方塊滑向韻母方塊、合成一個字音，
  //   再輪流套上四聲調號、顯示對應的字（每個字停留）。支援可選介音（ㄧ/ㄨ/ㄩ）。
  //   台灣注音鐵則：一聲（調號為空字串）不標調號——mark==='' 時完全不畫符號。
  //   reduced-motion：四欄並排四聲靜態，保留「同音不同調＝不同字」的對比。
  //   cfg = {initial:'ㄇ', medial:'', final:'ㄚ',
  //          tones:[{char:'媽',mark:''},{char:'麻',mark:'ˊ'},{char:'馬',mark:'ˇ'},{char:'罵',mark:'ˋ'}]}
  // ====================================================================
  function zhuyinBlend(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var initial: string = (cfg.initial != null) ? String(cfg.initial) : 'ㄇ';
    var medial: string = (cfg.medial != null) ? String(cfg.medial) : '';
    var fin: string = (cfg.final != null) ? String(cfg.final) : 'ㄚ';
    var tones: any[] = (cfg.tones && cfg.tones.length)
      ? cfg.tones
      : [{ char: '媽', mark: '' }, { char: '麻', mark: 'ˊ' }, { char: '馬', mark: 'ˇ' }, { char: '罵', mark: 'ˋ' }];
    var nT = tones.length;
    // 組字順序：聲母 → （介音）→ 韻母。
    var glyphs: string[] = [initial]; if (medial) glyphs.push(medial); glyphs.push(fin);
    var AS = 0.22;                                   // 前段「滑入合成」佔比

    /** 量出合成後各注音符號的 x（置中排一列），回傳 {xs, gsz, startX, totalW}。 */
    function layout(g: CanvasRenderingContext2D, w: number, h: number) {
      var gsz = Math.min(42, Math.max(26, w * 0.12));
      labelFont(g, gsz);
      var gap = gsz * 0.14;
      var widths: number[] = [], total = 0;
      for (var i = 0; i < glyphs.length; i++) { var ww = g.measureText(glyphs[i]).width; widths.push(ww); total += ww; }
      total += gap * (glyphs.length - 1);
      var startX = w / 2 - total / 2;
      var xs: number[] = [], cur = startX;
      for (var j = 0; j < glyphs.length; j++) { xs.push(cur + widths[j] / 2); cur += widths[j] + gap; }
      return { xs: xs, widths: widths, gsz: gsz, cy: h * 0.42, rightEdge: cur - gap };
    }

    /** 畫調號在字音右上角（一聲 mark==='' → 不畫；輕聲 ˙ 畫在左上）。 */
    function drawToneMark(g: CanvasRenderingContext2D, mark: string, lo: any, theme: string, alpha: number) {
      if (!mark) return;
      g.save(); g.globalAlpha = alpha;
      var msz = lo.gsz * 0.72;
      if (mark === '˙') label(g, '˙', lo.xs[0], lo.cy - lo.gsz * 0.62, theme, msz, 'center');
      else label(g, mark, lo.rightEdge + msz * 0.42, lo.cy - lo.gsz * 0.30, theme, msz, 'center');
      g.restore();
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor(), ink = inkColor();
      label(g, '聲母 ＋ 韻母 → 拼成一個字音', w / 2, 14, theme, 12, 'center');
      var lo = layout(g, w, h);
      var assembling = p < AS;
      var prog = assembling ? easeInOut(Math.min(1, p / AS)) : 1;
      // 聲母（第 0 個）滑入：合成前從左方較遠處滑到定位；韻母（含介音）固定不動。
      var slide = lo.gsz * 2.2;
      for (var i = 0; i < glyphs.length; i++) {
        var gx = lo.xs[i];
        if (i === 0 && assembling) gx = lo.xs[i] - (1 - prog) * slide;
        var ga = (i === 0 && assembling) ? (0.35 + 0.65 * prog) : 1;
        g.save(); g.globalAlpha = ga; label(g, glyphs[i], gx, lo.cy, ink, lo.gsz, 'center'); g.restore();
      }
      // 聲母/韻母 分組小標（只在合成階段提示）。
      if (assembling) {
        g.save(); g.globalAlpha = 0.75;
        label(g, '聲母', lo.xs[0] - (1 - prog) * slide, lo.cy + lo.gsz * 0.78, theme, 10.5, 'center');
        label(g, medial ? '介音＋韻母' : '韻母', (lo.xs[glyphs.length - 1] + lo.xs[medial ? 1 : glyphs.length - 1]) / 2, lo.cy + lo.gsz * 0.78, theme, 10.5, 'center');
        g.restore();
      }
      if (!assembling) {
        // 四聲循環：等分窗格，套上調號 + 顯示對應的字（停留）。
        var tt = (p - AS) / (1 - AS);
        var idx = Math.min(nT - 1, Math.floor(tt * nT));
        var local = tt * nT - idx;                      // 本格進度 0..1
        var pop = easeInOut(Math.min(1, local / 0.3));
        var tone = tones[idx] || { char: '', mark: '' };
        drawToneMark(g, tone.mark, lo, theme, pop);
        // 對應的字（大、ink）。
        var cz = lo.gsz * 1.25;
        g.save(); g.globalAlpha = 0.4 + 0.6 * pop;
        label(g, '讀作', w / 2, lo.cy + lo.gsz * 1.0, ink, 11, 'center');
        label(g, tone.char || '', w / 2, lo.cy + lo.gsz * 1.0 + cz * 0.75, ink, cz, 'center');
        g.restore();
        // 聲調點名（含「一聲不標」提示）。
        var TN = ['一聲', '二聲', '三聲', '四聲', '輕聲'];
        var NAMEBYMARK: any = { '': '一聲', 'ˊ': '二聲', 'ˇ': '三聲', 'ˋ': '四聲', '˙': '輕聲' };
        // 以實際調號取名，不用陣列位置（否則單一/重排/輕聲的 tones 會被標錯，例：ˊ 應為二聲、˙ 應為輕聲而非「第 5 聲」）
        var markName = tone.mark === '' ? (TN[0] + '（不標調號）') : ((NAMEBYMARK[tone.mark] || TN[Math.min(idx, 4)]) + ' ' + tone.mark);
        label(g, markName, w / 2, 30, tone.mark === '' ? inkColor() : theme, 11, 'center');
      }
      bottomCap(g, w, h, assembling ? '聲母滑向韻母，合成一個字音' : '同一個字音，配不同聲調就是不同的字', ink);
    }

    return runScene(host, {
      durationMs: 9000, loops: 2, staticPhase: 0.6,
      label: cfg.label || ('注音拼讀動畫：聲母「' + initial + '」滑向韻母「' + (medial + fin) + '」合成字音，再輪流套上二、三、四聲調號並顯示對應的字；一聲不標調號。'),
      drawStatic: function (g, w, h) {
        var ink = inkColor(), theme = themeColor();
        label(g, '同音不同調 → 不同的字', w / 2, 13, theme, 11.5, 'center');
        var colW = w / nT;
        labelFont(g, 1);
        for (var i = 0; i < nT; i++) {
          var cx = colW * i + colW / 2;
          var tone = tones[i] || { char: '', mark: '' };
          var gsz = Math.min(26, colW * 0.5);
          // 字音（含介音）直接整串顯示。
          label(g, glyphs.join(''), cx, h * 0.34, ink, gsz, 'center');
          if (tone.mark) label(g, tone.mark, cx + gsz * 0.9, h * 0.34 - gsz * 0.35, theme, gsz * 0.7, 'center');
          label(g, tone.char || '', cx, h * 0.58, ink, gsz * 1.2, 'center');
          var TN = ['一聲', '二聲', '三聲', '四聲', '輕聲'];
          var NAMEBYMARK: any = { '': '一聲', 'ˊ': '二聲', 'ˇ': '三聲', 'ˋ': '四聲', '˙': '輕聲' };
          // 以實際調號取名，不用陣列位置（支援單一/重排/輕聲的 tones）
          label(g, tone.mark === '' ? (TN[0] + '·不標') : (NAMEBYMARK[tone.mark] || TN[Math.min(i, 4)]), cx, h * 0.82, tone.mark === '' ? ink : theme, 10.5, 'center');
        }
      },
      draw: draw
    });
  }

  // ====================================================================
  // 場景：toneContour — 四聲＋輕聲的音高曲線（點沿每條曲線移動）。
  //   台灣注音鐵則（正確性第一）：一聲（陰平）＝高平，且【不標調號】——
  //   絕不畫 ˉ（那是漢語拼音／中國的標法）；二聲 ˊ 中升、三聲 ˇ 先降後升、
  //   四聲 ˋ 高降、輕聲 ˙ 短而輕。每條曲線標上台灣調號（一聲不標）。
  //   reduced-motion：staticPhase=1 → 畫完整五條曲線（點停在終點）。
  // ====================================================================
  function toneContour(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    // Chao 五度制高低（1 低…5 高）折線；一聲 55、二聲 35、三聲 214、四聲 51。
    var CONTOURS: Array<{ name: string; mark: string; pts: number[][]; light?: boolean }> = [
      { name: '一聲', mark: '', pts: [[0, 5], [1, 5]] },           // 高平・不標
      { name: '二聲', mark: 'ˊ', pts: [[0, 3], [1, 5]] },           // 中升
      { name: '三聲', mark: 'ˇ', pts: [[0, 2], [0.42, 1], [1, 4]] }, // 降後升
      { name: '四聲', mark: 'ˋ', pts: [[0, 5], [1, 1]] },           // 高降
      { name: '輕聲', mark: '˙', pts: [[0, 2], [0.5, 1.6]], light: true } // 短而輕
    ];
    var n = CONTOURS.length;

    /** 折線在 t(0..1) 的 (fx,level)；level 1..5。 */
    function at(pts: number[][], t: number): number {
      if (t <= pts[0][0]) return pts[0][1];
      var last = pts[pts.length - 1];
      if (t >= last[0]) return last[1];
      for (var i = 1; i < pts.length; i++) {
        if (t <= pts[i][0]) {
          var a = pts[i - 1], b = pts[i];
          var r = (t - a[0]) / (b[0] - a[0]);
          return a[1] + (b[1] - a[1]) * r;
        }
      }
      return last[1];
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor(), ink = inkColor();
      label(g, '聲調：聲音高低怎麼變化', w / 2, 14, theme, 12, 'center');
      var padX = 10, top = 48, bot = h - 40;
      var colW = (w - 2 * padX) / n;
      var boxH = bot - top;
      function levelY(L: number): number { return bot - (L - 1) / 4 * boxH; }
      // 左側「高/低」提示（只標一次）。
      g.save(); g.globalAlpha = 0.7;
      label(g, '高', padX + 6, top + 2, ink, 9, 'left');
      label(g, '低', padX + 6, bot - 2, ink, 9, 'left');
      g.restore();
      for (var i = 0; i < n; i++) {
        var c = CONTOURS[i];
        var x0 = padX + colW * i + colW * 0.16;
        var x1 = padX + colW * i + colW * (c.light ? 0.56 : 0.84);
        // 面板基準格線（上下兩條淡線）。
        g.save(); g.strokeStyle = ink; g.globalAlpha = 0.12; g.lineWidth = 1;
        g.beginPath(); g.moveTo(x0, top); g.lineTo(x0, bot); g.stroke();
        g.restore();
        // 曲線。
        g.save();
        g.strokeStyle = theme; g.lineWidth = c.light ? 2 : 2.6; g.lineCap = 'round'; g.lineJoin = 'round';
        if (c.light) g.globalAlpha = 0.72;
        g.beginPath();
        var steps = 40;
        for (var s = 0; s <= steps; s++) {
          var t = s / steps;
          var lv = at(c.pts, t);
          var xx = x0 + (x1 - x0) * t, yy = levelY(lv);
          if (s === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy);
        }
        g.stroke();
        g.restore();
        // 移動的點（沿本曲線）。
        var dotT = c.light ? Math.min(1, p * 1.0) : p;
        var dlv = at(c.pts, dotT);
        var dx = x0 + (x1 - x0) * dotT, dy = levelY(dlv);
        disc(g, dx, dy, c.light ? 3 : 3.6, theme);
        // 調號（一聲：不畫符號，改標「不標」）。畫在標題與面板之間的獨立帶狀，避免壓到標題。
        var cx = (x0 + x1) / 2;
        if (c.mark) label(g, c.mark, cx, 32, theme, 15, 'center');
        else label(g, '（不標）', cx, 32, ink, 9, 'center');
        // 聲調名。
        label(g, c.name, cx, bot + 13, ink, 11, 'center');
      }
      bottomCap(g, w, h, '一聲平、二聲揚、三聲轉彎、四聲降、輕聲短（台灣一聲不標調號）', ink);
    }

    return runScene(host, {
      durationMs: 4800, loops: 3, staticPhase: 1,
      label: cfg.label || '聲調曲線動畫：一聲高平（台灣不標調號）、二聲中升、三聲先降後升、四聲高降、輕聲短而輕；小點沿每條曲線移動呈現音高變化。',
      draw: draw
    });
  }

  // ====================================================================
  // 場景：textHighlight — 把句子拆成語塊，hl 的語塊「依序」亮起並掛小標籤旗，
  //   其餘變淡。標點／說明文／文言／審題共用。
  //   cfg = {tokens:[{t:'片段', hl?:true, label?:'冒號：引出說的話', color?:'--su'}],
  //          loops?, dwellMs?, title?, caption?}
  //   reduced-motion：全部 hl 亮起 + 底部條列各標籤。
  // ====================================================================
  function textHighlight(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var tokens: any[] = cfg.tokens || [{ t: '文字' }];
    var hlIdx: number[] = [];
    for (var ti = 0; ti < tokens.length; ti++) if (tokens[ti] && tokens[ti].hl) hlIdx.push(ti);
    var k = Math.max(1, hlIdx.length);
    var FS = 15;
    var FLAGH = 16, FLAG_GAP = 6;                      // 標籤旗高度／旗底到 token 的間距
    // 行距含「上方標籤帶」：確保某行 token 的旗子落在它自己這行上方的空白帶，絕不壓到上一行文字。
    // 需 LINEH ≥ FS*0.75 + FLAG_GAP + FLAGH + 上一行文字下緣(FS/2) ≈ 40.75。
    var LINEH = FS + 28;

    /** 流式排版：回傳每個 token 的 {x,y,w}（y=中線）與總行數。 */
    function layout(g: CanvasRenderingContext2D, w: number, topY: number) {
      labelFont(g, FS);
      var padX = 14, maxW = w - 2 * padX, chipPadX = 5;
      var boxes: Array<{ x: number; y: number; w: number }> = [];
      var cx = padX, cy = topY, lines = 1, i;
      for (i = 0; i < tokens.length; i++) {
        var tw = g.measureText(tokens[i].t || '').width + chipPadX * 2;
        if (cx + tw > padX + maxW && cx > padX) { cx = padX; cy += LINEH; lines++; }
        boxes.push({ x: cx, y: cy, w: tw });
        cx += tw + 2;
      }
      return { boxes: boxes, lines: lines };
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor(), ink = inkColor();
      label(g, cfg.title || '找出關鍵語塊', w / 2, 14, theme, 12, 'center');
      // 先量行數，據此把整塊句子（含每行上方的標籤帶）垂直置中，標籤帶即使多行也不互疊。
      var top = 26, bot = h - 20;
      var above1 = FS * 0.75 + FLAG_GAP + FLAGH + 3;   // 第一行基線上方要留給它的旗子
      var nLines = layout(g, w, 0).lines;
      var blockH = above1 + (nLines - 1) * LINEH + FS / 2;
      var topY = top + Math.max(0, (bot - top - blockH) / 2) + above1;
      var lay = layout(g, w, topY);
      var activeHl = Math.min(k - 1, Math.floor(p * k + 1e-6));   // 第幾個 hl 正在亮
      for (var i = 0; i < tokens.length; i++) {
        var tk = tokens[i], b = lay.boxes[i];
        var hlRank = hlIdx.indexOf(i);
        var isHl = hlRank >= 0;
        var lit = isHl && hlRank <= activeHl;
        var col = resolveCol(tk.color, theme);
        if (lit) {
          chipBox(g, b.x, b.y - FS * 0.75, b.w, FS * 1.5, col, tk.t || '', ink, FS, 1);
        } else {
          g.save(); g.globalAlpha = isHl ? 0.5 : 0.42;
          label(g, tk.t || '', b.x + b.w / 2, b.y, ink, FS, 'center');
          g.restore();
        }
        // 正在亮的 hl：旗子一律掛在該 token 所屬行的「上方預留帶」內 → 多行時永不壓到上一行文字。
        if (lit && hlRank === activeHl && tk.label) {
          labelFont(g, 10);
          var fw = g.measureText(tk.label).width + 12;
          var fy = b.y - FS * 0.75 - FLAG_GAP - FLAGH;
          var fx = Math.max(4, Math.min(w - fw - 4, b.x + b.w / 2 - fw / 2));
          g.save(); g.strokeStyle = col; g.lineWidth = 1.3; g.globalAlpha = 0.8;
          g.beginPath(); g.moveTo(b.x + b.w / 2, b.y - FS * 0.75); g.lineTo(b.x + b.w / 2, fy + FLAGH); g.stroke(); g.restore();
          chipBox(g, fx, fy, fw, FLAGH, col, tk.label, ink, 10, 1);
        }
      }
      bottomCap(g, w, h, cfg.caption || '關鍵語塊會依序亮起，看它們怎麼幫句子表達意思', ink);
    }

    return runScene(host, {
      durationMs: 1,
      loops: cfg.loops || 2,
      staticPhase: 1,
      keyStates: (function () { var a: number[] = []; for (var i = 0; i < k; i++) a.push(i / k); return a; })(),
      segMs: 450, dwellMs: cfg.dwellMs || 1200,
      label: cfg.label || '語塊高亮動畫：句子拆成語塊，關鍵語塊依序亮起並標上說明，其餘變淡，呈現它們在句子裡的作用。',
      drawStatic: function (g, w, h) {
        var theme = themeColor(), ink = inkColor();
        label(g, cfg.title || '找出關鍵語塊', w / 2, 14, theme, 12, 'center');
        var lay = layout(g, w, h * 0.24);
        var lastY = h * 0.24;
        for (var i = 0; i < tokens.length; i++) {
          var tk = tokens[i], b = lay.boxes[i];
          if (b.y > lastY) lastY = b.y;
          var col = resolveCol(tk.color, theme);
          if (tk.hl) chipBox(g, b.x, b.y - FS * 0.75, b.w, FS * 1.5, col, tk.t || '', ink, FS, 1);
          else { g.save(); g.globalAlpha = 0.45; label(g, tk.t || '', b.x + b.w / 2, b.y, ink, FS, 'center'); g.restore(); }
        }
        var ly = lastY + FS + 12;                        // 條列說明放在句子最後一行之下，避免重疊
        for (var j = 0; j < hlIdx.length; j++) {
          var t2 = tokens[hlIdx[j]];
          if (t2.label) { label(g, '• ' + t2.label, 14, ly, resolveCol(t2.color, theme), 10.5, 'left'); ly += 15; }
        }
      },
      draw: draw
    });
  }

  // ====================================================================
  // 場景：blockAssemble — 具名方塊由上而下滑入、組成一份文件／句子骨架；
  //   可選 fix 示範把放錯／寫錯的方塊換成正確的。
  //   書信結構／主謂賓／病句修正／大綱共用。
  //   cfg = {blocks:[{label:'稱呼', color?}], order?:[...], fix?:{atIndex, wrong, right}, title?, caption?}
  //   reduced-motion：staticPhase=1 → 畫最終（含已修正）骨架。
  // ====================================================================
  function blockAssemble(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var blocks: any[] = cfg.blocks || [{ label: '區塊' }];
    var nB = blocks.length;
    var order: number[] = (cfg.order && cfg.order.length === nB) ? cfg.order : (function () { var a: number[] = []; for (var i = 0; i < nB; i++) a.push(i); return a; })();
    var fix: any = cfg.fix || null;
    var GOOD = '#16a34a', WARN = '#e11d48';
    var A = fix ? 0.62 : 0.92;                       // 組裝階段佔比

    function slotRect(w: number, h: number) {
      var top = 34, bot = h - 28, padX = Math.max(18, w * 0.12);
      var slotH = (bot - top) / nB;
      var bh = Math.min(slotH - 7, 46);
      return { top: top, padX: padX, slotH: slotH, bh: bh, bw: w - 2 * padX };
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor(), ink = inkColor();
      label(g, cfg.title || '把區塊組起來', w / 2, 14, theme, 12, 'center');
      var r = slotRect(w, h);
      // 每個 slot i（由上而下）對應 blocks[i]；進場時間依 order 排名。
      var rankOf: number[] = []; for (var oi = 0; oi < nB; oi++) rankOf[order[oi]] = oi;
      for (var i = 0; i < nB; i++) {
        var rank = rankOf[i];
        var tIn = rank * (A / nB);
        var prog = easeInOut(Math.max(0, Math.min(1, (p - tIn) / Math.max(0.001, (A / nB) * 1.25))));
        if (prog <= 0.01) continue;
        var by = r.top + i * r.slotH + (r.slotH - r.bh) / 2;
        var fromLeft = (i % 2 === 0);
        var bx = r.padX + (1 - prog) * (fromLeft ? -r.bw * 0.7 : r.bw * 0.7);
        var col = resolveCol(blocks[i].color, theme);
        var lblTxt = blocks[i].label || '';
        var isFixSlot = fix && fix.atIndex === i;
        var fixP = fix ? easeInOut(Math.max(0, Math.min(1, (p - A) / Math.max(0.001, 1 - A)))) : 0;
        if (isFixSlot) {
          // 修正格：組裝階段先放「錯的」（紅）；修正階段 前半刪除線＋✗、後半換成「對的」（綠✓）。
          if (fixP < 0.5) {
            var strike = fixP > 0.01;                   // 進入修正才畫刪除線
            chipBox(g, bx, by, r.bw, r.bh, WARN, '', ink, 13, prog);
            g.save(); g.globalAlpha = prog;
            label(g, (fix.wrong || lblTxt), bx + r.bw / 2, by + r.bh / 2, WARN, 13, 'center');
            if (strike) {
              g.strokeStyle = WARN; g.lineWidth = 2; labelFont(g, 13);
              var ww = g.measureText(fix.wrong || lblTxt).width;
              g.beginPath(); g.moveTo(bx + r.bw / 2 - ww / 2, by + r.bh / 2); g.lineTo(bx + r.bw / 2 + ww / 2, by + r.bh / 2); g.stroke();
              label(g, '✗', bx + r.bw - 16, by + r.bh / 2, WARN, 14, 'center');
            }
            g.restore();
          } else {
            var pr2 = (fixP - 0.5) / 0.5;
            chipBox(g, bx, by, r.bw, r.bh, GOOD, (fix.right || lblTxt), ink, 13, 1);
            g.save(); g.globalAlpha = pr2; label(g, '✓', bx + r.bw - 16, by + r.bh / 2, GOOD, 14, 'center'); g.restore();
          }
        } else {
          chipBox(g, bx, by, r.bw, r.bh, col, lblTxt, ink, 13, prog);
        }
      }
      bottomCap(g, w, h, cfg.caption || (fix ? '放錯的區塊換成正確的，骨架就完整了' : '一塊一塊組起來，就是完整的骨架'), ink);
    }

    return runScene(host, {
      durationMs: fix ? 7200 : 5200, loops: 2, staticPhase: 1,
      label: cfg.label || ('區塊組裝動畫：' + nB + ' 個具名區塊由上而下滑入、組成完整骨架' + (fix ? '，最後把放錯的區塊換成正確的。' : '。')),
      draw: draw
    });
  }

  // ====================================================================
  // 場景：barChartCallout — 長條依序長高，再依序拉出重點說明旗；
  //   misleadFlag 時明確點出「Y 軸沒從 0 開始→看起來差很多」（畫斷軸鋸齒＋紅字）。
  //   跨科共用（數學統計／核心素養／社會讀圖都會重用）——cfg 保持通用。
  //   cfg = {bars:[{label,value}], unit?, callouts:[{barIndex, note}], misleadFlag?, title?}
  //   reduced-motion：staticPhase=1 → 長條滿格＋全部說明旗。
  // ====================================================================
  function barChartCallout(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var bars: any[] = cfg.bars || [{ label: 'A', value: 3 }];
    var unit: string = cfg.unit || '';
    var callouts: any[] = cfg.callouts || [];
    var mislead: boolean = !!cfg.misleadFlag;
    var nB = bars.length;
    var WARN = '#e11d48';
    var vals: number[] = bars.map(function (b) { return +b.value || 0; });
    var maxV = vals.reduce(function (a, b) { return Math.max(a, b); }, -Infinity);
    var minV = vals.reduce(function (a, b) { return Math.min(a, b); }, Infinity);
    if (!isFinite(maxV)) maxV = 1;
    if (!isFinite(minV)) minV = 0;
    // 誤導：Y 軸從接近最小值處起跳（放大差異）；否則從 0。
    var base = mislead ? Math.max(0, minV - (maxV - minV) * 0.25) : 0;
    if (mislead && base >= maxV) base = 0;
    var yTop = maxV + (maxV - base) * 0.16;
    if (yTop <= base) yTop = base + 1;

    function fmt(x: number): string { return (Math.round(x) === x) ? ('' + x) : x.toFixed(1); }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor(), ink = inkColor();
      label(g, cfg.title || '看圖找重點', w / 2, 14, mislead ? WARN : theme, 12, 'center');
      // 底部預留兩列空間：類別標籤列（py1+12）＋最下方的說明／警語列（h-10），兩者不互疊。
      var px0 = 34, py0 = 30, px1 = w - 14, py1 = h - 44;
      var plotH = py1 - py0, slotW = (px1 - px0) / nB;
      // 軸。
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.55; g.lineWidth = 1.4;
      g.beginPath(); g.moveTo(px0, py0); g.lineTo(px0, py1); g.lineTo(px1, py1); g.stroke(); g.restore();
      label(g, fmt(base), px0 - 4, py1, mislead ? WARN : ink, 10, 'right');
      label(g, fmt(Math.round(yTop)), px0 - 4, py0 + 4, ink, 10, 'right');
      // 斷軸鋸齒（誤導時：標示 Y 軸沒從 0 起）。
      if (mislead && base > 0) {
        g.save(); g.strokeStyle = WARN; g.lineWidth = 1.8; g.lineCap = 'round';
        var zy = py1 - 6;
        g.beginPath(); g.moveTo(px0 - 5, zy); g.lineTo(px0 - 1, zy - 4); g.lineTo(px0 + 3, zy); g.lineTo(px0 + 7, zy - 4); g.stroke();
        g.restore();
      }
      // 哪些長條有說明旗（那條就不畫頂端數值，改由旗子說明，避免重疊）。
      var hasCallout: boolean[] = [];
      for (var ci = 0; ci < callouts.length; ci++) { var b2 = Math.max(0, Math.min(nB - 1, callouts[ci].barIndex | 0)); hasCallout[b2] = true; }
      // 長條（依序長高，p 0..0.5）。
      var growEnd = 0.5;
      for (var i = 0; i < nB; i++) {
        var stagger = growEnd / Math.max(1, nB);
        var gf = easeInOut(Math.max(0, Math.min(1, (p - i * stagger) / Math.max(0.001, growEnd - stagger + 0.0001))));
        var frac = (vals[i] - base) / (yTop - base);
        frac = Math.max(0, Math.min(1, frac));
        var barH = plotH * frac * gf;
        var bw = slotW * 0.58;
        var bx = px0 + i * slotW + (slotW - bw) / 2;
        var by = py1 - barH;
        var col = mislead ? WARN : theme;
        g.save(); g.fillStyle = col; g.globalAlpha = 0.82; g.fillRect(bx, by, bw, barH);
        g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 1; g.strokeRect(bx, by, bw, barH); g.restore();
        if (gf > 0.96 && barH > 4 && !hasCallout[i]) label(g, fmt(vals[i]) + unit, bx + bw / 2, by - 7, ink, 10, 'center');
        if (bars[i].label) label(g, bars[i].label, bx + bw / 2, py1 + 12, ink, 9.5, 'center');
      }
      // 說明旗（依序拉出，p 0.5..1），指向對應長條頂端。
      var co = callouts.length;
      for (var c = 0; c < co; c++) {
        var ca = callouts[c];
        var bi = Math.max(0, Math.min(nB - 1, ca.barIndex | 0));
        var ap = easeInOut(Math.max(0, Math.min(1, (p - (0.52 + c * (0.46 / Math.max(1, co)))) / 0.22)));
        if (ap <= 0.01) continue;
        var fracC = (vals[bi] - base) / (yTop - base); fracC = Math.max(0, Math.min(1, fracC));
        var tipX = px0 + bi * slotW + slotW / 2, tipY = py1 - plotH * fracC;
        labelFont(g, 9.5);
        var note = ca.note || '';
        var fw = Math.min(w * 0.5, g.measureText(note).width + 12), fh = 16;
        var fx = Math.max(4, Math.min(w - fw - 4, tipX - fw / 2));
        var fy = Math.max(py0 + 1, tipY - 6 - fh);           // 旗子緊貼長條頂端上方（數值已不畫→不重疊）
        g.save(); g.globalAlpha = ap; g.strokeStyle = theme; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(tipX, tipY); g.lineTo(tipX, fy + fh); g.stroke(); g.restore();
        chipBox(g, fx, fy, fw, fh, theme, note, ink, 9.5, ap);
      }
      // 誤導警語。
      if (mislead) {
        var mp = easeInOut(Math.max(0, Math.min(1, (p - 0.55) / 0.25)));
        if (mp > 0.01) { g.save(); g.globalAlpha = mp; label(g, 'Y 軸沒從 0 開始 → 看起來差很多！', w / 2, h - 10, WARN, 11, 'center'); g.restore(); }
      } else {
        bottomCap(g, w, h, '長條長高、再拉出重點：先看軸、再比長短', ink);
      }
    }

    return runScene(host, {
      durationMs: mislead ? 6000 : 5200, loops: 2, staticPhase: 1,
      label: cfg.label || (mislead
        ? '誤導長條圖動畫：Y 軸沒從 0 開始，長條差距看起來很大；畫面點出「Y 軸沒從 0 開始→看起來差很多」。'
        : '長條圖重點動畫：長條依序長高，再依序拉出重點說明旗指向對應長條。'),
      draw: draw
    });
  }


  // ===== English (英文) cluster scenes =================================
  // 共用：乾淨無襯線英文字（label 用 system-ui，不會出現豆腐框）；角色色（主詞藍／動詞綠／
  // 受詞橘／疑問詞紫／否定紅）都是「卡底上可讀的飽和墨色」＝亮暗雙主題都安全（defect #28：
  // 文字一律用 inkColor() 主題墨色或這些飽和色，絕不壓在硬寫死的淺色方塊上）。
  // 喇叭 🔊 不自己播音——點擊時呼叫 cfg.onPlay(text)（有才呼叫，沒有也不報錯），由頁面接真實音訊。
  var EN_SUBJ = '#2563eb', EN_VERB = '#16a34a', EN_OBJ = '#ea7317';
  var EN_WH = '#7c3aed', EN_NEG = '#e11d48', EN_PEN = '#e11d48', EN_OK = '#16a34a';

  interface Box { x: number; y: number; w: number; h: number; }
  function inBox(b: Box | null, x: number, y: number): boolean {
    return !!b && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
  }
  /** 畫一顆可點的「🔊 喇叭」晶片（半透明 tint 卡底 → 亮暗皆安全），waveActive 時由 nowMs 連續放送聲波弧；回傳可點框。 */
  function speakerChip(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, col: string, waveActive: boolean): Box {
    var box: Box = { x: cx - 1.75 * s, y: cy - 1.35 * s, w: 3.5 * s, h: 2.7 * s };
    chipBox(g, box.x, box.y, box.w, box.h, col, '', col, 10, 1);
    g.save(); g.fillStyle = col;
    g.beginPath();
    g.moveTo(cx - 1.05 * s, cy - 0.42 * s);
    g.lineTo(cx - 0.5 * s, cy - 0.42 * s);
    g.lineTo(cx + 0.05 * s, cy - 0.9 * s);
    g.lineTo(cx + 0.05 * s, cy + 0.9 * s);
    g.lineTo(cx - 0.5 * s, cy + 0.42 * s);
    g.lineTo(cx - 1.05 * s, cy + 0.42 * s);
    g.closePath(); g.fill();
    g.restore();
    if (waveActive) {
      var ph = (nowMs() / 650) % 1;
      g.save(); g.strokeStyle = col; g.lineCap = 'round';
      for (var i = 0; i < 3; i++) {
        var fp = ph - i * 0.28; if (fp < 0) fp += 1;
        var rr = s * (0.45 + fp * 1.1);
        g.globalAlpha = Math.max(0, 1 - fp) * 0.9; g.lineWidth = 1.8;
        g.beginPath(); g.arc(cx + 0.1 * s, cy, rr, -0.62, 0.62); g.stroke();
      }
      g.restore();
    }
    return box;
  }
  /** 大號英文字（粗體無襯線）；回傳量到的寬度，方便置中排版。 */
  function enText(g: CanvasRenderingContext2D, text: string, x: number, y: number, col: string, size: number, align: CanvasTextAlign): number {
    g.save();
    g.font = '700 ' + size + 'px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillStyle = col; g.fillText(text, x, y);
    var ww = g.measureText(text).width;
    g.restore();
    return ww;
  }
  function enMeasure(g: CanvasRenderingContext2D, text: string, size: number): number {
    g.save(); g.font = '700 ' + size + 'px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
    var ww = g.measureText(text).width; g.restore(); return ww;
  }

  // ====================================================================
  // 場景 E1：enLetter — 字母／字形入門（trace 描字順｜sound 字母音｜flash 常見字閃卡）。
  //   cfg = {letter?, grapheme?, word?, mode:'trace'|'sound'|'flash', onPlay?, label?}
  //   trace：大寫＋小寫並排，筆尖由上往下把字「描」出來（近似筆順，重清楚不重書法）。
  //   sound：大字形＋會張合的嘴＋🔊，點 🔊 放送聲波並呼叫 onPlay（字母音）。
  //   flash：常見字卡翻入，🔊 讀整個字。reduced-motion：直接畫靜態終態（仍可點 🔊）。
  // ====================================================================
  function enLetter(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var mode: string = (cfg.mode === 'sound' || cfg.mode === 'flash') ? cfg.mode : 'trace';
    var grapheme: string = (cfg.grapheme != null) ? String(cfg.grapheme) : (cfg.letter != null ? String(cfg.letter) : 'a');
    var letter: string = (cfg.letter != null) ? String(cfg.letter) : grapheme.charAt(0);
    var word: string = (cfg.word != null) ? String(cfg.word) : 'the';
    var UP = letter.toUpperCase(), LO = letter.toLowerCase();

    var spkBox: Box | null = null;
    var speakingUntil = 0;
    function speak(text: string, redraw: () => void) {
      if (typeof cfg.onPlay === 'function') { try { cfg.onPlay(text); } catch (e) {} }
      if (reducedMotion()) { redraw(); return; }
      speakingUntil = nowMs() + 1100;
      (function loop() { if (nowMs() < speakingUntil) { redraw(); requestAnimationFrame(loop); } else { redraw(); } })();
    }

    // 描一格字：淡導引字 + 由上往下的揭示（clip 長高）+ 筆尖小點（左右微晃＝正在寫）。
    function traceCell(g: CanvasRenderingContext2D, cx: number, cy: number, ch: string, size: number, prog: number, showPen: boolean, ink: string, theme: string) {
      g.save();
      g.font = '700 ' + size + 'px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.save(); g.globalAlpha = 0.16; g.fillStyle = ink; g.fillText(ch, cx, cy); g.restore();
      var gh = size * 1.08, top = cy - gh / 2;
      g.save();
      g.beginPath(); g.rect(cx - size, top, size * 2, gh * Math.max(0, Math.min(1, prog))); g.clip();
      g.fillStyle = theme; g.fillText(ch, cx, cy);
      g.restore();
      g.restore();
      if (showPen && prog > 0.02 && prog < 0.99) {
        var py = top + gh * prog;
        var px = cx + Math.sin(prog * 9) * size * 0.26;
        disc(g, px, py, 4.5, EN_PEN);
        g.save(); g.strokeStyle = EN_PEN; g.lineWidth = 1.4; g.globalAlpha = 0.6;
        g.beginPath(); g.moveTo(px, py); g.lineTo(px + 7, py - 11); g.stroke(); g.restore();
      }
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor(), ink = inkColor();
      if (mode === 'trace') {
        label(g, '照著描：大寫和小寫', w / 2, 15, theme, 12, 'center');
        var sz = Math.min(w * 0.3, h * 0.52);
        var lp = Math.min(1, p / 0.5), rp = Math.max(0, Math.min(1, (p - 0.5) / 0.5));
        traceCell(g, w * 0.3, h * 0.52, UP, sz, lp, p < 0.5, ink, theme);
        traceCell(g, w * 0.7, h * 0.52, LO, sz, rp, p >= 0.5, ink, theme);
        label(g, '大寫 ' + UP, w * 0.3, h * 0.52 + sz * 0.62, ink, 11, 'center');
        label(g, '小寫 ' + LO, w * 0.7, h * 0.52 + sz * 0.62, ink, 11, 'center');
        bottomCap(g, w, h, '筆尖從上往下，把字一筆一筆描出來', ink);
      } else if (mode === 'sound') {
        label(g, '這個字母的聲音', w / 2, 15, theme, 12, 'center');
        var speaking = nowMs() < speakingUntil;
        // 大字形（左）。
        enText(g, grapheme, w * 0.30, h * 0.5, ink, Math.min(w * 0.26, h * 0.5), 'center');
        // 嘴（右上）：說話時張開。
        var mx = w * 0.62, my = h * 0.4, mw = Math.min(w, h) * 0.11;
        var open = speaking ? (0.5 + 0.5 * Math.abs(Math.sin(nowMs() / 160))) : 0.28;
        g.save(); g.strokeStyle = ink; g.lineWidth = 2.4; g.fillStyle = EN_NEG;
        g.globalAlpha = 0.18; g.beginPath(); g.ellipse(mx, my, mw, mw * open, 0, 0, Math.PI * 2); g.fill();
        g.globalAlpha = 1; g.beginPath(); g.ellipse(mx, my, mw, mw * open, 0, 0, Math.PI * 2); g.stroke();
        g.restore();
        label(g, '嘴型', mx, my + mw + 10, ink, 10, 'center');
        // 喇叭（右下）＋聲波。
        spkBox = speakerChip(g, w * 0.82, h * 0.5, Math.min(w, h) * 0.058, theme, speaking);
        bottomCap(g, w, h, '點 🔊 聽這個字母的聲音', ink);
      } else {
        // flash：常見字卡翻入（scaleX 0→1）。
        label(g, '常見字閃卡', w / 2, 15, theme, 12, 'center');
        var flip = Math.min(1, p / 0.45);
        var cw = Math.min(w * 0.6, 220), ch2 = Math.min(h * 0.42, 96);
        var cx = w / 2, cy = h * 0.46;
        g.save();
        g.translate(cx, cy); g.scale(Math.max(0.02, flip), 1); g.translate(-cx, -cy);
        chipBox(g, cx - cw / 2, cy - ch2 / 2, cw, ch2, theme, '', theme, 10, 1);
        g.restore();
        if (flip > 0.9) enText(g, word, cx, cy, ink, Math.min(cw * 0.42, ch2 * 0.6), 'center');
        var speaking2 = nowMs() < speakingUntil;
        spkBox = speakerChip(g, cx, cy + ch2 / 2 + Math.min(w, h) * 0.1, Math.min(w, h) * 0.055, theme, speaking2);
        bottomCap(g, w, h, '一眼認出整個字，再點 🔊 聽怎麼唸', ink);
      }
    }

    return runScene(host, {
      durationMs: mode === 'trace' ? 4200 : 2600, loops: mode === 'trace' ? 3 : 1, staticPhase: 1,
      interactive: mode !== 'trace',
      label: cfg.label || (mode === 'trace'
        ? ('字母描寫動畫：把字母「' + letter + '」的大寫 ' + UP + ' 和小寫 ' + LO + ' 由上往下一筆一筆描出來。')
        : (mode === 'sound'
          ? ('字母發音動畫：顯示字形「' + grapheme + '」，點喇叭會放送聲波，由頁面讀出它的聲音。')
          : ('常見字閃卡動畫：卡片翻入後顯示「' + word + '」，點喇叭由頁面讀出整個字。'))),
      onClick: (mode === 'trace') ? undefined : function (x, y, redraw) {
        if (inBox(spkBox, x, y)) speak(mode === 'sound' ? grapheme : word, redraw);
      },
      onReplay: function () { speakingUntil = 0; },
      draw: draw
    });
  }

  // ====================================================================
  // 場景 E2：enBlend — 字母拼讀。字母磚分開 → 滑在一起 → 融成一個字；下方聲波合流，
  //   整個字彈出並附 🔊 讀出拼好的字。digraph（如 'sh'）當作「一塊磚」。
  //   cfg = {parts:['c','a','t'], mode:'phoneme', onPlay?, label?}
  //   reduced-motion：融好的字 + 下方把每塊當 phoneme chip 排一列。
  // ====================================================================
  function enBlend(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var parts: string[] = (cfg.parts && cfg.parts.length) ? cfg.parts.map(function (x: any) { return String(x); }) : ['c', 'a', 't'];
    var word = parts.join('');
    var spkBox: Box | null = null;
    var speakingUntil = 0;
    function speak(redraw: () => void) {
      if (typeof cfg.onPlay === 'function') { try { cfg.onPlay(word); } catch (e) {} }
      if (reducedMotion()) { redraw(); return; }
      speakingUntil = nowMs() + 1100;
      (function loop() { if (nowMs() < speakingUntil) { redraw(); requestAnimationFrame(loop); } else { redraw(); } })();
    }

    /** 量每塊磚寬（digraph 較寬），回傳 {ws,total,tile}。 */
    function measure(g: CanvasRenderingContext2D, tile: number): { ws: number[]; total: number } {
      var ws: number[] = [], total = 0;
      for (var i = 0; i < parts.length; i++) {
        var tw = Math.max(tile, enMeasure(g, parts[i], tile * 0.62) + tile * 0.5);
        ws.push(tw); total += tw;
      }
      return { ws: ws, total: total };
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor(), ink = inkColor();
      label(g, '把字母的音拼在一起', w / 2, 15, theme, 12, 'center');
      var tile = Math.min(w * 0.17, h * 0.3, 58);
      var m = measure(g, tile);
      var cy = h * 0.46;
      var apart = p < 0.55;                       // 前段：分開 → 靠攏
      var join = apart ? easeInOut(p / 0.55) : 1;  // 0 全分開、1 全靠攏
      var gapExtra = (1 - join) * tile * 0.9;      // 分開時每塊之間多出的空隙
      var totalW = m.total + gapExtra * (parts.length - 1);
      var x = w / 2 - totalW / 2;
      var fuse = p >= 0.7 ? Math.min(1, (p - 0.7) / 0.2) : 0;   // 融成整字
      var pa = 1 - fuse;                                        // 磚與其字母一起淡出，交棒給融好的整字
      for (var i = 0; i < parts.length; i++) {
        var bw = m.ws[i];
        chipBox(g, x, cy - tile / 2, bw, tile, theme, '', theme, 10, pa);
        g.save(); g.globalAlpha = pa;
        enText(g, parts[i], x + bw / 2, cy, ink, tile * 0.56, 'center');
        if (apart && parts[i].length > 1) label(g, '一個音', x + bw / 2, cy + tile * 0.62, theme, 9, 'center');
        g.restore();
        x += bw + gapExtra;
      }
      // 聲波合流線（下方）：隨靠攏從多段併成一條。
      var lineY = cy + tile * 0.95;
      g.save(); g.strokeStyle = theme; g.lineWidth = 2; g.lineCap = 'round'; g.globalAlpha = 0.5 + 0.5 * join;
      g.beginPath();
      var lx0 = w / 2 - totalW / 2, lx1 = w / 2 + totalW / 2, steps = 48;
      for (var s2 = 0; s2 <= steps; s2++) {
        var t = s2 / steps, xx = lx0 + (lx1 - lx0) * t;
        var amp = tile * 0.12 * (1 - join * 0.6);
        var yy = lineY + Math.sin(t * Math.PI * parts.length * 2) * amp;
        if (s2 === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy);
      }
      g.stroke(); g.restore();
      // 融好的整字（淡入＋彈出）＋喇叭。
      if (fuse > 0) {
        var pop = 0.9 + 0.1 * fuse;
        g.save(); g.globalAlpha = fuse; enText(g, word, w / 2, cy, ink, tile * 0.62 * pop, 'center'); g.restore();
      }
      var speaking = nowMs() < speakingUntil;
      spkBox = speakerChip(g, w / 2 + totalW / 2 + tile * 0.9, cy, tile * 0.42, theme, speaking);
      bottomCap(g, w, h, parts.join(' - ') + ' → ' + word + '（點 🔊 聽拼好的字）', ink);
    }

    return runScene(host, {
      durationMs: 5200, loops: 2, staticPhase: 1, interactive: true,
      label: cfg.label || ('字母拼讀動畫：把 ' + parts.join('、') + ' 的音一塊一塊滑在一起，拼成「' + word + '」；點喇叭由頁面讀出整個字。'),
      drawStatic: function (g, w, h) {
        var theme = themeColor(), ink = inkColor();
        label(g, parts.join(' - ') + ' → ' + word, w / 2, 15, theme, 12, 'center');
        var tile = Math.min(w * 0.17, h * 0.3, 58);
        enText(g, word, w / 2, h * 0.4, ink, Math.min(w * 0.2, h * 0.42), 'center');
        var m = measure(g, tile * 0.72), x = w / 2 - m.total / 2, cy = h * 0.74;
        for (var i = 0; i < parts.length; i++) {
          var bw = m.ws[i];
          chipBox(g, x, cy - tile * 0.3, bw, tile * 0.6, theme, parts[i], ink, tile * 0.4, 1);
          x += bw;
        }
        label(g, '每一塊是一個音', w / 2, h - 12, ink, 10.5, 'center');
      },
      onClick: function (x, y, redraw) { if (inBox(spkBox, x, y)) speak(redraw); },
      onReplay: function () { speakingUntil = 0; },
      draw: draw
    });
  }

  // ====================================================================
  // 場景 E3：enTimeline — 動詞時態的時間軸。軸標 過去 past｜現在 now｜未來 future。
  //   simple＝某時點一個點（過去＝已完成打勾）；progressive＝該時點一條「進行中」色帶；
  //   perfect＝從過去「連到現在」的箭頭、現在端打勾（對比 simple past 的單一點）。
  //   cfg = {when:'past'|'now'|'future', aspect:'simple'|'progressive'|'perfect', marker:'played',
  //          span?, label?, markers?:[{when,aspect,marker,highlight?}]}
  //   markers 多筆時各佔一條 lane 同時呈現、highlight 一筆為主色其餘變淡。
  // ====================================================================
  function enTimeline(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    function norm(m: any) {
      return {
        when: (m && (m.when === 'now' || m.when === 'future')) ? m.when : 'past',
        aspect: (m && (m.aspect === 'progressive' || m.aspect === 'perfect')) ? m.aspect : 'simple',
        marker: (m && m.marker != null) ? String(m.marker) : 'played',
        span: (m && typeof m.span === 'number') ? m.span : 0.14,
        hi: !!(m && m.highlight)
      };
    }
    var markers = (cfg.markers && cfg.markers.length) ? cfg.markers.map(norm) : [norm(cfg)];
    if (cfg.markers && cfg.markers.length && !markers.some(function (m: any) { return m.hi; })) markers[0].hi = true;
    var single = markers.length === 1;
    var ASP_C: { [k: string]: string } = { simple: EN_SUBJ, progressive: EN_OBJ, perfect: EN_VERB };

    function whenX(when: string, w: number): number {
      return when === 'past' ? w * 0.24 : (when === 'now' ? w * 0.5 : w * 0.76);
    }

    function drawMarker(g: CanvasRenderingContext2D, m: any, w: number, axisY: number, laneY: number, prog: number, ink: string) {
      var col = m.hi ? ASP_C[m.aspect] : '#9aa3af';
      var alpha = m.hi ? 1 : 0.55;
      var x = whenX(m.when, w);
      g.save(); g.globalAlpha = alpha;
      // leader：lane → 軸。
      g.strokeStyle = col; g.lineWidth = 1.2; g.globalAlpha = alpha * 0.6;
      g.beginPath(); g.moveTo(x, laneY + 10); g.lineTo(x, axisY - 3); g.stroke();
      g.globalAlpha = alpha;
      if (m.aspect === 'simple') {
        var done = m.when === 'past';
        disc(g, x, axisY, 6, col);
        if (done) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 3, axisY); g.lineTo(x - 0.5, axisY + 2.5); g.lineTo(x + 3.5, axisY - 3); g.stroke(); }
        chipBox(g, x - enMeasure(g, m.marker, 12) / 2 - 7, laneY - 11, enMeasure(g, m.marker, 12) + 14, 22, col, '', col, 10, prog);
        enText(g, m.marker, x, laneY, ink, 12, 'center');
        if (m.hi) label(g, done ? '一個時點・已完成 ✓' : '一個時點', x, laneY - 18, col, 9.5, 'center');
      } else if (m.aspect === 'progressive') {
        var bw = w * m.span * prog;
        g.save(); g.globalAlpha = alpha * 0.3; g.fillStyle = col; g.fillRect(x - bw / 2, axisY - 7, bw, 14); g.restore();
        g.strokeStyle = col; g.lineWidth = 1.6; g.strokeRect(x - w * m.span / 2, axisY - 7, w * m.span, 14);
        chipBox(g, x - enMeasure(g, m.marker, 12) / 2 - 7, laneY - 11, enMeasure(g, m.marker, 12) + 14, 22, col, '', col, 10, prog);
        enText(g, m.marker, x, laneY, ink, 12, 'center');
        if (m.hi) label(g, '進行中・一段時間', x, laneY - 18, col, 9.5, 'center');
      } else {
        // perfect：從 past 連到 now 的箭頭（lane 上），now 端打勾。
        var x0 = whenX('past', w), x1 = whenX('now', w);
        var xe = x0 + (x1 - x0) * prog;
        g.strokeStyle = col; g.lineWidth = 2.4; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x0, laneY); g.lineTo(xe, laneY); g.stroke();
        g.fillStyle = col; g.beginPath(); g.moveTo(xe, laneY); g.lineTo(xe - 8, laneY - 5); g.lineTo(xe - 8, laneY + 5); g.closePath(); g.fill();
        if (prog > 0.98) { disc(g, x1, axisY, 6, col); g.strokeStyle = '#fff'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1 - 3, axisY); g.lineTo(x1 - 0.5, axisY + 2.5); g.lineTo(x1 + 3.5, axisY - 3); g.stroke(); }
        chipBox(g, x1 - enMeasure(g, m.marker, 12) / 2 - 7, laneY - 24, enMeasure(g, m.marker, 12) + 14, 22, col, '', col, 10, prog);
        enText(g, m.marker, x1, laneY - 13, ink, 12, 'center');
        // 說明靠左貼在箭頭尾端（past 側），遠離 now 端的 pill → 不被遮住；過寬時縮字塞進尾端到 pill 之間的空檔。
        if (m.hi) {
          var hint = '從過去連到現在';
          var pillLeft = x1 - (enMeasure(g, m.marker, 12) / 2 + 7);
          var avail = pillLeft - x0 - 8;
          var hf = 9.5; while (hf > 7 && enMeasure(g, hint, hf) > avail) hf -= 0.5;
          if (enMeasure(g, hint, hf) > avail) hint = '過去→現在';   // 真的太窄：用更短、仍正確的說法
          label(g, hint, x0, laneY - 11, col, hf, 'left');
        }
      }
      g.restore();
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor(), ink = inkColor();
      label(g, '時態＝事情發生在時間軸的哪裡', w / 2, 15, theme, 12, 'center');
      var axisY = h * 0.72;
      // 軸線＋三區。
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.5; g.lineWidth = 2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(w * 0.08, axisY); g.lineTo(w * 0.92, axisY); g.stroke();
      g.fillStyle = ink; g.beginPath(); g.moveTo(w * 0.92, axisY); g.lineTo(w * 0.92 - 9, axisY - 5); g.lineTo(w * 0.92 - 9, axisY + 5); g.closePath(); g.fill();
      g.globalAlpha = 0.3; g.setLineDash([3, 4]);
      g.beginPath(); g.moveTo(w * 0.5, axisY - 14); g.lineTo(w * 0.5, axisY + 8); g.stroke();
      g.restore();
      label(g, '過去 past', w * 0.24, axisY + 16, ink, 10.5, 'center');
      label(g, '現在 now', w * 0.5, axisY + 16, theme, 10.5, 'center');
      label(g, '未來 future', w * 0.76, axisY + 16, ink, 10.5, 'center');
      // lanes（由上往下）。
      var topLane = 42, laneGap = Math.min(34, (axisY - 34 - topLane) / Math.max(1, markers.length));
      var prog = easeInOut(Math.min(1, p / 0.75));
      for (var i = 0; i < markers.length; i++) {
        var laneY = single ? (axisY - 46) : (topLane + i * laneGap + laneGap / 2);
        drawMarker(g, markers[i], w, axisY, laneY, prog, ink);
      }
      bottomCap(g, w, h, single
        ? (markers[0].aspect === 'perfect' ? '完成式：從過去一直連到現在' : (markers[0].aspect === 'progressive' ? '進行式：某個時間「正在」發生' : '簡單式：某個時間點發生'))
        : '同一個時間軸，看每種時態標在哪裡', ink);
    }

    return runScene(host, {
      durationMs: 4200, loops: 2, staticPhase: 1,
      label: cfg.label || '時態時間軸動畫：在過去／現在／未來的時間軸上標出動詞時態——簡單式是一個時點、進行式是一段進行中的時間、完成式是從過去連到現在。',
      draw: draw
    });
  }

  // ====================================================================
  // 場景 E4（最重要）：enSentenceBuild — 把句子像積木一樣組起來。保持通用：
  //   statement＝彩色詞性欄（主詞藍／動詞綠／受詞橘…），詞磚依序飛入、句末彈出句點、
  //     句首大寫提示；可點（點詞盤的磚放進欄位）＋自動播放備援。
  //   question＝把 from 直述句改成問句（be 動詞移到句首／插入 helper 並去動詞 -s／加 whWord），句末彈出問號。
  //   negative＝在主詞和動詞之間插入 helper（don't/doesn't/didn't）並去動詞 -s。
  //   paragraph＝句子橫條由上往下堆（主題句 highlight、細節句、可選結尾句）；checklist 時右側逐項打勾。
  //   cfg = {slots,tiles,mode,highlight?,helper?,whWord?,from?,checklist?,closing?,label?}
  // ====================================================================
  function enSentenceBuild(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var mode: string = ['question', 'negative', 'paragraph'].indexOf(cfg.mode) >= 0 ? cfg.mode : 'statement';
    var slots: string[] = (cfg.slots && cfg.slots.length) ? cfg.slots.map(String) : ['Subject', 'Verb', 'Object'];
    var tiles: string[] = (cfg.tiles && cfg.tiles.length) ? cfg.tiles.map(String) : ['The dog', 'runs', 'fast'];

    function slotColor(name: string): string {
      var n = (name || '').toLowerCase();
      if (/subject|主/.test(n)) return EN_SUBJ;
      if (/verb|動/.test(n)) return EN_VERB;
      if (/object|受/.test(n)) return EN_OBJ;
      if (/wh|疑問|問/.test(n)) return EN_WH;
      return EN_OBJ;
    }
    function dropS(v: string): string {
      if (v === 'has') return 'have';
      // 先處理 -ies→y、再處理噝音/-o 的 -es（goes→go, watches→watch, does→do, boxes→box, passes→pass），最後才去掉單純的 -s（likes→like）
      return v.replace(/ies$/, 'y').replace(/(ss|x|z|ch|sh|o)es$/, '$1').replace(/([^s])s$/, '$1');
    }

    // ---- statement 狀態（可點放置）----
    var placed: boolean[] = []; for (var pi = 0; pi < tiles.length; pi++) placed.push(false);
    var manual = false;
    var trayBoxes: Box[] = [];

    function drawStatement(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor(), ink = inkColor();
      label(g, '照順序把句子組起來', w / 2, 15, theme, 12, 'center');
      var nS = slots.length;
      var colW = (w - 24) / nS, colY = h * 0.28, colH = Math.min(h * 0.26, 60);
      trayBoxes = [];
      // 詞性欄（空槽）。
      for (var s = 0; s < nS; s++) {
        var cxs = 12 + s * colW + colW / 2;
        var col = slotColor(slots[s]);
        g.save(); g.setLineDash([5, 4]); g.strokeStyle = col; g.globalAlpha = 0.7; g.lineWidth = 1.6;
        rrectPath(g, 12 + s * colW + 6, colY, colW - 12, colH, 8); g.stroke(); g.restore();
        label(g, slots[s], cxs, colY - 10, col, 10, 'center');
      }
      // 每塊詞磚：auto 模式用 phase 飛入；manual 用 placed[]。
      var seg = 0.8 / Math.max(1, tiles.length);
      var trayY = h * 0.74;
      var trayX = 14;
      for (var i = 0; i < tiles.length; i++) {
        var slotIdx = Math.min(i, nS - 1);
        var dstX = 12 + slotIdx * colW + colW / 2, dstY = colY + colH / 2;
        var tcol = slotColor(slots[slotIdx]);
        var bw = Math.max(colW - 16, enMeasure(g, tiles[i], 13) + 18);
        var isPlaced: boolean, fly = 0;
        if (manual) { isPlaced = placed[i]; }
        else { var local = (p - i * seg) / seg; isPlaced = local >= 1; fly = Math.max(0, Math.min(1, local)); }
        if (isPlaced || (!manual && fly > 0)) {
          var fromX = trayX + bw / 2, fromY = trayY;
          var e = isPlaced ? 1 : easeInOut(fly);
          var cx = fromX + (dstX - fromX) * e, cy = fromY + (dstY - fromY) * e;
          chipBox(g, cx - bw / 2, cy - 17, bw, 34, tcol, '', tcol, 10, 1);
          enText(g, tiles[i], cx, cy, ink, 13, 'center');
          if (i === 0) { // 句首大寫提示
            var fx = cx - bw / 2 + 3;
            g.save(); g.strokeStyle = EN_NEG; g.lineWidth = 1.6; g.globalAlpha = 0.9;
            g.beginPath(); g.moveTo(fx, cy + 10); g.lineTo(fx + enMeasure(g, tiles[i].charAt(0), 13), cy + 10); g.stroke(); g.restore();
          }
        } else {
          // 在詞盤待命（可點）。
          var tb: Box = { x: trayX, y: trayY - 17, w: bw, h: 34 };
          trayBoxes[i] = tb;
          chipBox(g, tb.x, tb.y, tb.w, tb.h, tcol, '', tcol, 10, 1);
          enText(g, tiles[i], tb.x + bw / 2, trayY, ink, 13, 'center');
          trayX += bw + 8;
        }
        if (!(isPlaced || (!manual && fly > 0))) continue;
      }
      // 句點（全放好才彈出）。
      var allPlaced = manual ? placed.every(function (b) { return b; }) : (p >= 0.86);
      if (allPlaced) {
        var lastSlot = Math.min(tiles.length - 1, nS - 1);
        var endX = 12 + lastSlot * colW + colW - 6;
        enText(g, '.', endX, colY + colH / 2 + 6, EN_NEG, 22, 'center');
        label(g, '句首大寫、句末句點', w / 2, colY + colH + 20, EN_OK, 10, 'center');
      }
      bottomCap(g, w, h, manual || !reducedMotion() ? '點詞盤的詞，放進對應的欄位（或等它自己飛入）' : '主詞 → 動詞 → 受詞，照順序組成一句', ink);
    }

    // ---- 一列詞磚流式排版（question / negative 共用）----
    function flowRow(g: CanvasRenderingContext2D, items: Array<{ t: string; col: string; strike?: boolean; alpha?: number }>, w: number, cy: number, fontSz: number): { left: number; right: number } {
      var pad = 6, gap = 7, total = 0, ws: number[] = [];
      for (var i = 0; i < items.length; i++) { var tw = enMeasure(g, items[i].t, fontSz) + pad * 2; ws.push(tw); total += tw; }
      total += gap * (items.length - 1);
      var startX = Math.max(10, w / 2 - total / 2);
      var x = startX;
      var ink = inkColor();
      for (var j = 0; j < items.length; j++) {
        var it = items[j], bw = ws[j], a = it.alpha == null ? 1 : it.alpha;
        g.save(); g.globalAlpha = a;
        chipBox(g, x, cy - 17, bw, 34, it.col, '', it.col, 10, 1);
        enText(g, it.t, x + bw / 2, cy, it.strike ? EN_NEG : ink, fontSz, 'center');
        if (it.strike) { g.strokeStyle = EN_NEG; g.lineWidth = 2; g.beginPath(); g.moveTo(x + bw / 2 - enMeasure(g, it.t, fontSz) / 2, cy); g.lineTo(x + bw / 2 + enMeasure(g, it.t, fontSz) / 2, cy); g.stroke(); }
        g.restore();
        x += bw + gap;
      }
      return { left: startX, right: items.length ? x - gap : startX };   // right＝最後一塊磚的右緣
    }

    function baseWords(): string[] {
      if (cfg.from) return String(cfg.from).split(/\s+/).filter(function (x: string) { return !!x; });
      return tiles.slice();
    }

    function drawQuestion(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor(), ink = inkColor();
      var isWh = !!cfg.whWord;   // Wh- 步驟的 from 是「原問句」(yes/no 問句身)，不是直述句——標題與上排改標避免概念矛盾
      label(g, isWh ? '加上疑問詞（Wh-）' : '把直述句改成問句', w / 2, 15, theme, 12, 'center');
      var words = baseWords();
      var beIdx = -1; for (var i = 0; i < words.length; i++) if (/^(is|are|am|was|were)$/i.test(words[i])) { beIdx = i; break; }
      var step = easeInOut(Math.min(1, p / 0.7));
      // 原直述句（上排，淡）。
      var topItems = words.map(function (wd: string) { return { t: wd, col: EN_SUBJ, alpha: 1 - step * 0.75 }; });
      flowRow(g, topItems, w, h * 0.36, 13);
      label(g, isWh ? '原問句' : '直述句', w / 2, h * 0.36 - 26, ink, 9.5, 'center');
      // 結果問句（下排）。
      var out: Array<{ t: string; col: string; strike?: boolean }> = [];
      var kind = '';
      if (cfg.whWord) {
        out.push({ t: cfg.whWord, col: EN_WH });
        words.forEach(function (wd: string) { out.push({ t: wd, col: EN_SUBJ }); });
        kind = '加上疑問詞 ' + cfg.whWord + '，再加問號';
      } else if (cfg.helper) {
        out.push({ t: cfg.helper, col: EN_WH });
        for (var k = 0; k < words.length; k++) {
          var isVerb = k === 1;
          out.push({ t: (isVerb && /s$/i.test(words[k]) && !/^is|was$/i.test(words[k])) ? dropS(words[k]) : (k === 0 ? words[k].charAt(0).toLowerCase() + words[k].slice(1) : words[k]), col: isVerb ? EN_VERB : EN_SUBJ, strike: false });
        }
        kind = '句首加 ' + cfg.helper + '，動詞去掉 -s';
      } else if (beIdx >= 0) {
        var be = words[beIdx];
        out.push({ t: be.charAt(0).toUpperCase() + be.slice(1), col: EN_VERB });
        for (var m2 = 0; m2 < words.length; m2++) { if (m2 === beIdx) continue; out.push({ t: m2 === 0 ? words[m2].charAt(0).toLowerCase() + words[m2].slice(1) : words[m2], col: EN_SUBJ }); }
        kind = 'be 動詞「' + be + '」移到句首';
      } else {
        words.forEach(function (wd: string) { out.push({ t: wd, col: EN_SUBJ }); });
        kind = '加問號';
      }
      if (step > 0.5) {
        var qrow = flowRow(g, out, w, h * 0.62, 13);
        if (step > 0.9) enText(g, '?', Math.min(w - 12, qrow.right + 14), h * 0.62, EN_NEG, 22, 'left');
        label(g, '問句', w / 2, h * 0.62 - 26, EN_WH, 9.5, 'center');
      }
      bottomCap(g, w, h, kind + '，句末用問號 ?', ink);
    }

    function drawNegative(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor(), ink = inkColor();
      label(g, '把句子改成否定句', w / 2, 15, theme, 12, 'center');
      var words = baseWords();
      var helper = cfg.helper || "doesn't";
      var step = easeInOut(Math.min(1, p / 0.7));
      var topItems = words.map(function (wd: string, idx: number) { return { t: wd, col: idx === 1 ? EN_VERB : EN_SUBJ, alpha: 1 - step * 0.7 }; });
      flowRow(g, topItems, w, h * 0.36, 13);
      label(g, '原句', w / 2, h * 0.36 - 26, ink, 9.5, 'center');
      var out: Array<{ t: string; col: string; strike?: boolean }> = [];
      for (var k = 0; k < words.length; k++) {
        if (k === 1) out.push({ t: helper, col: EN_NEG });
        var isVerb = k === 1;
        out.push({ t: (isVerb && /s$/i.test(words[k]) && !/^is|was$/i.test(words[k])) ? dropS(words[k]) : words[k], col: isVerb ? EN_VERB : EN_SUBJ, strike: isVerb && /s$/i.test(words[k]) && step < 0.6 });
      }
      if (step > 0.4) {
        flowRow(g, out, w, h * 0.62, 13);
        label(g, '否定句', w / 2, h * 0.62 - 26, EN_NEG, 9.5, 'center');
      }
      bottomCap(g, w, h, '主詞和動詞之間插入 ' + helper + '，動詞去掉 -s', ink);
    }

    function drawParagraph(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor(), ink = inkColor();
      label(g, '段落＝主題句＋細節句', w / 2, 15, theme, 12, 'center');
      var lines = tiles.slice();
      var hasClosing = !!cfg.closing && lines.length >= 2;
      var checklist = !!cfg.checklist;
      var areaR = checklist ? w * 0.62 : w - 24;
      var barX = 14, barW = areaR - 14, top = 36, barH = Math.min(34, (h * 0.52) / Math.max(1, lines.length));
      var gapY = barH + 8;
      for (var i = 0; i < lines.length; i++) {
        var prog = easeInOut(Math.max(0, Math.min(1, (p - i * (0.7 / lines.length)) / Math.max(0.001, (0.7 / lines.length) * 1.3))));
        if (prog <= 0.01) continue;
        var role = i === 0 ? 'Topic' : (hasClosing && i === lines.length - 1 ? 'Closing' : 'Detail');
        var col = role === 'Topic' ? EN_SUBJ : (role === 'Closing' ? EN_WH : EN_VERB);
        var by = top + i * gapY;
        var bx = barX + (1 - prog) * (i % 2 === 0 ? -barW * 0.6 : barW * 0.6);
        chipBox(g, bx, by, barW, barH, col, '', col, 10, prog);
        var rtxt = role === 'Topic' ? '主題句' : (role === 'Closing' ? '結尾句' : '細節句');
        g.save(); g.globalAlpha = prog;
        label(g, rtxt, bx + 8, by + barH / 2, col, 9.5, 'left');
        var tx = bx + 66, avail = barW - 66 - 10;
        var fs = 11.5; while (fs > 8 && enMeasure(g, lines[i], fs) > avail) fs -= 0.5;
        enText(g, lines[i], tx, by + barH / 2, ink, fs, 'left');
        g.restore();
      }
      if (checklist) {
        var cx = areaR + 6, cw = w - areaR - 12;
        var items = ['每句有主詞＋動詞', '時態一致', '大寫開頭、標點結尾'];
        label(g, '檢查表', cx + cw / 2, top - 2, theme, 10, 'center');
        for (var c = 0; c < items.length; c++) {
          var cyy = top + 16 + c * 30;
          var on = p > (0.3 + c * 0.22);
          g.save(); g.strokeStyle = on ? EN_OK : ink; g.globalAlpha = on ? 1 : 0.5; g.lineWidth = 1.8;
          rrectPath(g, cx, cyy - 8, 16, 16, 4); g.stroke();
          if (on) { g.strokeStyle = EN_OK; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx + 3, cyy); g.lineTo(cx + 6.5, cyy + 4); g.lineTo(cx + 13, cyy - 4); g.stroke(); }
          g.restore();
          label(g, items[c], cx + 22, cyy, on ? ink : '#9aa3af', 9.5, 'left');
        }
      }
      bottomCap(g, w, h, '主題句放最前面，細節句支持它' + (hasClosing ? '，最後用結尾句收' : ''), ink);
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      if (mode === 'question') drawQuestion(g, p, w, h);
      else if (mode === 'negative') drawNegative(g, p, w, h);
      else if (mode === 'paragraph') drawParagraph(g, p, w, h);
      else drawStatement(g, p, w, h);
    }

    return runScene(host, {
      durationMs: mode === 'paragraph' ? 6000 : 5200, loops: 2, staticPhase: 1,
      interactive: mode === 'statement',
      label: cfg.label || (mode === 'question' ? '問句生成動畫：把直述句改寫成問句（be 動詞移到句首、或加助動詞並去掉動詞 -s、或加疑問詞），句末加問號。'
        : mode === 'negative' ? '否定句生成動畫：在主詞和動詞之間插入否定助動詞並去掉動詞 -s。'
        : mode === 'paragraph' ? '段落結構動畫：主題句、細節句、結尾句的句子橫條由上往下堆成一段。'
        : '造句動畫：主詞、動詞、受詞的詞磚依序飛進對應欄位，句首大寫、句末加句點。'),
      onClick: (mode === 'statement') ? function (x, y, redraw) {
        for (var i = 0; i < trayBoxes.length; i++) {
          if (trayBoxes[i] && inBox(trayBoxes[i], x, y)) { manual = true; placed[i] = true; redraw(); return; }
        }
        // 點空白：補放下一塊。
        manual = true;
        for (var j = 0; j < placed.length; j++) { if (!placed[j]) { placed[j] = true; break; } }
        redraw();
      } : undefined,
      onReplay: function () { manual = false; for (var i = 0; i < placed.length; i++) placed[i] = false; },
      draw: draw
    });
  }

  // ====================================================================
  // 場景 E5：enMeter — 語氣／強度量表（情態助動詞）。水平量表、標上各停點，
  //   指針落在 pointer 停點；下方顯示 example 例句。
  //   cfg = {axisLabel:'建議強度', stops:['could','should','must'], pointer:'should', example?, label?}
  //   用於：能力 can/could、許可 may、建議 should、義務 must、可能 might/may/must 等強弱。
  // ====================================================================
  function enMeter(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var axisLabel: string = cfg.axisLabel || '強度';
    var stops: string[] = (cfg.stops && cfg.stops.length) ? cfg.stops.map(String) : ['could', 'should', 'must'];
    var pointer: string = cfg.pointer != null ? String(cfg.pointer) : stops[stops.length - 1];
    var example: string = cfg.example || '';
    var tgt = stops.indexOf(pointer); if (tgt < 0) tgt = stops.length - 1;

    function stopX(i: number, w: number): number {
      var x0 = w * 0.14, x1 = w * 0.86;
      return stops.length === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * (i / (stops.length - 1));
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number) {
      var theme = themeColor(), ink = inkColor();
      label(g, axisLabel + '：越往右越強', w / 2, 15, theme, 12, 'center');
      var trackY = h * 0.56, x0 = w * 0.12, x1 = w * 0.88;
      // 漸強軌（左淡右濃）。
      var grad = g.createLinearGradient(x0, 0, x1, 0);
      grad.addColorStop(0, 'rgba(37,99,235,0.25)'); grad.addColorStop(1, 'rgba(225,29,72,0.8)');
      g.save(); g.strokeStyle = grad as any; g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x0, trackY); g.lineTo(x1, trackY); g.stroke(); g.restore();
      label(g, '弱', x0 - 2, trackY + 20, ink, 10, 'center');
      label(g, '強', x1 + 2, trackY + 20, ink, 10, 'center');
      // 停點。
      for (var i = 0; i < stops.length; i++) {
        var sx = stopX(i, w);
        var on = i === tgt;
        g.save(); g.globalAlpha = on ? 1 : 0.55;
        disc(g, sx, trackY, on ? 5.5 : 4, on ? EN_NEG : ink);
        g.restore();
        enText(g, stops[i], sx, trackY - 20, on ? EN_NEG : ink, on ? 13.5 : 12, 'center');
      }
      // 指針：從最左滑到目標停點。
      var prog = easeInOut(Math.min(1, p / 0.75));
      var curX = stopX(0, w) + (stopX(tgt, w) - stopX(0, w)) * prog;
      g.save(); g.fillStyle = EN_NEG; g.strokeStyle = EN_NEG;
      g.beginPath(); g.moveTo(curX, trackY + 12); g.lineTo(curX - 7, trackY + 26); g.lineTo(curX + 7, trackY + 26); g.closePath(); g.fill();
      g.restore();
      // 例句。
      if (example) {
        label(g, '例句', w / 2, h * 0.74, theme, 9.5, 'center');
        var efs = 14; while (efs > 9 && enMeasure(g, example, efs) > w - 28) efs -= 0.5;
        enText(g, example, w / 2, h * 0.84, ink, efs, 'center');
      }
      bottomCap(g, w, h, '同樣是「可以／應該／必須」，語氣強弱不一樣', ink);
    }

    return runScene(host, {
      durationMs: 3800, loops: 2, staticPhase: 1,
      label: cfg.label || ('語氣強度量表動畫：在 ' + stops.join('、') + ' 的強弱量表上，指針落在「' + pointer + '」，呈現情態助動詞的語氣強弱。'),
      draw: draw
    });
  }

  // ===== 自然科學 + 社會（science + social）cluster scenes =============
  // 設計鐵則（defect #28）：所有彩色方塊一律用 chipBox 的半透明 tint 卡底（卡底透出→亮暗雙主題皆安全），
  //   文字一律 inkColor()／飽和主題色，絕不壓在硬寫死的淺色填滿上；也不在深色卡底上放固定深墨。
  //   每格框尺寸固定（跨步驟不改畫布大小）；箭頭都貼住端點並指對方向；每個著色元素都有圖例或標籤。

  // ====================================================================
  // 場景 S1：reactionRate — 用「碰撞模型」把反應速率為什麼變快畫出來。
  //   cfg = { factor:'temp'|'conc'|'surface'|'catalyst', label? }
  //   temp／conc：左(基準) vs 右(改變後) 兩盒等大，粒子在盒中運動、相撞瞬間閃一下並累加
  //     「碰撞次數」；右盒撞得更頻繁＝反應更快（把「為什麼快」畫出來，不是只貼標籤）。
  //       temp：右盒粒子更快(速度箭頭更長)、撞得更頻繁又更用力；conc：右盒等體積塞更多粒子→更常相撞。
  //   surface：整塊(9 格) vs 切成 9 小塊——體積一樣，但露出的「可反應表面」從 12 段變 36 段→碰撞點更多。
  //   catalyst：活化能位能圖——紅色高山(無催化劑) vs 綠色矮山(催化劑開的另一條路)；山越矮→越多粒子
  //     翻得過去(成功碰撞變多)→反應更快，而催化劑自己反應前後數量一樣(不被消耗)。
  //   reduced-motion：粒子盒預跑數十步畫代表性靜態幀＋代表數字；catalyst 直接畫完整位能圖。
  // ====================================================================
  function reactionRate(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var factor: string = (['temp', 'conc', 'surface', 'catalyst'].indexOf(cfg.factor) >= 0) ? cfg.factor : 'temp';
    var WARN = '#e11d48', OK = '#16a34a', HOT = '#e8603c', COLD = '#2b8ad6';
    var R = 0.058;                                  // 粒子半徑（unit 盒座標）

    interface Part { x: number; y: number; vx: number; vy: number; flash: number; }
    interface SimBox { ps: Part[]; count: number; touch: Record<string, boolean>; }
    function lcg(seed: number): () => number {
      var s = seed >>> 0;
      return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    }
    function makeBox(n: number, speed: number, seed: number): SimBox {
      var rnd = lcg(seed); var ps: Part[] = [];
      for (var i = 0; i < n; i++) {
        var a = rnd() * Math.PI * 2;
        ps.push({ x: R + rnd() * (1 - 2 * R), y: R + rnd() * (1 - 2 * R), vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, flash: 0 });
      }
      return { ps: ps, count: 0, touch: {} };
    }
    function stepBox(box: SimBox): void {
      var ps = box.ps, n = ps.length, i: number;
      for (i = 0; i < n; i++) {
        var p = ps[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < R) { p.x = R; p.vx = -p.vx; } else if (p.x > 1 - R) { p.x = 1 - R; p.vx = -p.vx; }
        if (p.y < R) { p.y = R; p.vy = -p.vy; } else if (p.y > 1 - R) { p.y = 1 - R; p.vy = -p.vy; }
        if (p.flash > 0) p.flash -= 1;
      }
      for (var a = 0; a < n; a++) for (var b = a + 1; b < n; b++) {
        var key = a + '_' + b;
        var dx = ps[a].x - ps[b].x, dy = ps[a].y - ps[b].y;
        var touching = (dx * dx + dy * dy) < (2 * R) * (2 * R);
        if (touching && !box.touch[key]) { box.count++; ps[a].flash = 7; ps[b].flash = 7; }
        box.touch[key] = touching;
      }
    }

    // 持久的兩盒（conc/temp 用）；replay 時重置。
    var left: SimBox | null = null, right: SimBox | null = null;
    function ensureSims(): void {
      if (left && right) return;
      if (factor === 'temp') { left = makeBox(5, 0.0065, 7); right = makeBox(5, 0.0145, 23); }
      else { left = makeBox(4, 0.0105, 11); right = makeBox(9, 0.0105, 29); }   // conc
    }

    function panelRects(w: number, h: number) {
      var pad = 10, gap = 12, topY = 44, botY = h - 46;
      var bw = (w - 2 * pad - gap) / 2, bh = botY - topY;
      return { lx: pad, rx: pad + bw + gap, top: topY, bw: bw, bh: bh, bot: botY };
    }
    // 兩個數據置中成一行（左 ink／右 rCol），總寬置中於 w/2 → 永遠在右下角重播鈕左側，不相撞。
    function twoStat(g: CanvasRenderingContext2D, w: number, y: number, lt: string, rt: string, rCol: string): void {
      var ink = inkColor(), sep = '　｜　';
      labelFont(g, 10);
      var lw = g.measureText(lt).width, sw = g.measureText(sep).width, rw = g.measureText(rt).width;
      var x0 = w / 2 - (lw + sw + rw) / 2;
      label(g, lt, x0, y, ink, 10, 'left');
      g.save(); g.globalAlpha = 0.5; label(g, sep, x0 + lw, y, ink, 10, 'left'); g.restore();
      label(g, rt, x0 + lw + sw, y, rCol, 10, 'left');
    }

    // 畫一盒（含框、粒子、碰撞閃光、速度箭頭）。
    function drawSimBox(g: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number,
      box: SimBox, col: string, showVel: boolean): void {
      var ink = inkColor();
      g.save();
      g.globalAlpha = 0.07; g.fillStyle = col; rrectPath(g, x, y, bw, bh, 8); g.fill();
      g.globalAlpha = 0.55; g.lineWidth = 1.4; g.strokeStyle = ink; rrectPath(g, x, y, bw, bh, 8); g.stroke();
      g.restore();
      var pr = Math.min(bw, bh) * R;                 // 粒子像素半徑
      for (var i = 0; i < box.ps.length; i++) {
        var p = box.ps[i];
        var px = x + p.x * bw, py = y + p.y * bh;
        if (showVel) {
          g.save(); g.strokeStyle = col; g.globalAlpha = 0.7; g.lineWidth = 1.6; g.lineCap = 'round';
          var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          var ux = p.vx / (sp || 1), uy = p.vy / (sp || 1), al = sp * Math.min(bw, bh) * 3.1;
          g.beginPath(); g.moveTo(px, py); g.lineTo(px + ux * al, py + uy * al); g.stroke(); g.restore();
        }
        disc(g, px, py, pr, col);
        if (p.flash > 0) {
          g.save(); g.globalAlpha = p.flash / 7; g.strokeStyle = WARN; g.lineWidth = 2;
          g.beginPath(); g.arc(px, py, pr + 4 + (7 - p.flash), 0, Math.PI * 2); g.stroke(); g.restore();
        }
      }
    }

    // ---- surface：整塊 vs 切成小塊（露出表面比較）------------------------
    // 3×3 格；左＝相連成一塊(外圍 12 段可反應)，右＝散開成 9 小塊(每塊 4 段＝36 段)。
    function drawSurfacePanel(g: CanvasRenderingContext2D, x: number, y: number, bw: number, bh: number,
      split: boolean, col: string): number {
      var ink = inkColor();
      g.save();
      g.globalAlpha = 0.55; g.lineWidth = 1.4; g.strokeStyle = ink; rrectPath(g, x, y, bw, bh, 8); g.stroke();
      g.restore();
      var cell = Math.min(bw, bh) * 0.2;
      var gapS = split ? cell * 0.42 : 0;
      var gridW = 3 * cell + 2 * gapS, gridH = gridW;
      var ox = x + (bw - gridW) / 2, oy = y + (bh - gridH) / 2 + 2;
      var exposed = 0;
      for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
        var cx = ox + c * (cell + gapS), cy = oy + r * (cell + gapS);
        g.save();
        g.globalAlpha = 0.2; g.fillStyle = col; g.fillRect(cx, cy, cell, cell);
        g.globalAlpha = 0.9; g.lineWidth = 1; g.strokeStyle = col; g.strokeRect(cx, cy, cell, cell);
        g.restore();
        // 露出的外緣（可反應表面）畫粗脈動線。
        if (split) {
          exposed += 4;
          var pulse = 0.5 + 0.5 * Math.sin(nowMs() / 500 + (r * 3 + c));
          g.save(); g.strokeStyle = WARN; g.globalAlpha = 0.4 + 0.5 * pulse; g.lineWidth = 2.2; g.lineCap = 'round';
          g.strokeRect(cx + 0.5, cy + 0.5, cell - 1, cell - 1); g.restore();
        } else {
          // 相連：只有最外圍邊露出。
          var seg: number[][] = [];
          if (r === 0) seg.push([0, 0, 1, 0]);
          if (r === 2) seg.push([0, 1, 1, 1]);
          if (c === 0) seg.push([0, 0, 0, 1]);
          if (c === 2) seg.push([1, 0, 1, 1]);
          exposed += seg.length;
          var pulse2 = 0.5 + 0.5 * Math.sin(nowMs() / 500);
          g.save(); g.strokeStyle = WARN; g.globalAlpha = 0.4 + 0.5 * pulse2; g.lineWidth = 2.4; g.lineCap = 'round';
          for (var s = 0; s < seg.length; s++) {
            g.beginPath(); g.moveTo(cx + seg[s][0] * cell, cy + seg[s][1] * cell); g.lineTo(cx + seg[s][2] * cell, cy + seg[s][3] * cell); g.stroke();
          }
          g.restore();
        }
      }
      return exposed;
    }

    // ---- catalyst：活化能位能圖 ------------------------------------------
    function energyAt(t: number, peak: number, ER: number, EP: number): number {
      if (t < 0.18) return ER;
      if (t > 0.82) return EP;
      if (t < 0.5) { var u = easeInOut((t - 0.18) / 0.32); return ER + (peak - ER) * u; }
      var v = easeInOut((t - 0.5) / 0.32); return peak + (EP - peak) * v;
    }
    function drawEnergyCurve(g: CanvasRenderingContext2D, px0: number, px1: number, py0: number, py1: number,
      peak: number, ER: number, EP: number, col: string, dashed: boolean, prog: number): void {
      g.save(); g.strokeStyle = col; g.lineWidth = 2.6; g.lineCap = 'round'; g.lineJoin = 'round';
      if (dashed) g.setLineDash([6, 4]);
      g.beginPath();
      var tEnd = Math.max(0, Math.min(1, prog)), started = false;
      for (var t = 0; t <= tEnd + 1e-6; t += 0.01) {
        var e = energyAt(t, peak, ER, EP);
        var xx = px0 + (px1 - px0) * t, yy = py1 - e * (py1 - py0);
        if (!started) { g.moveTo(xx, yy); started = true; } else { g.lineTo(xx, yy); }
      }
      g.stroke(); g.setLineDash([]); g.restore();
    }
    function drawCatalyst(g: CanvasRenderingContext2D, p: number, w: number, h: number): void {
      var ink = inkColor(), theme = themeColor();
      label(g, '活化能：要翻過的「山」有多高', w / 2, 14, theme, 12, 'center');
      var px0 = 20, px1 = w - 16, py0 = 34, py1 = h - 44;
      var ER = 0.42, EP = 0.26, PEAK_R = 0.92, PEAK_G = 0.64;
      // 軸。
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.5; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(px0, py0); g.lineTo(px0, py1); g.lineTo(px1, py1); g.stroke(); g.restore();
      label(g, '能量', px0, py0 - 2, ink, 9.5, 'left');
      label(g, '反應進程 →', px1, py1 + 13, ink, 9.5, 'right');
      // 紅山（無催化劑，先畫）。
      var pr1 = Math.min(1, p / 0.42);
      drawEnergyCurve(g, px0, px1, py0, py1, PEAK_R, ER, EP, WARN, false, pr1);
      // 綠山（催化劑的另一條路，後畫，虛線）。
      var pr2 = Math.max(0, Math.min(1, (p - 0.42) / 0.42));
      if (pr2 > 0.01) drawEnergyCurve(g, px0, px1, py0, py1, PEAK_G, ER, EP, OK, true, pr2);
      // 反應物／生成物平台標籤。
      label(g, '反應物', px0 + (px1 - px0) * 0.08, py1 - ER * (py1 - py0) - 11, ink, 9.5, 'left');
      label(g, '生成物', px0 + (px1 - px0) * 0.92, py1 - EP * (py1 - py0) - 11, ink, 9.5, 'right');
      // 活化能雙箭頭（紅、綠），畫在山的左側上坡 x≈0.4。
      if (p >= 0.3) {
        var xa = px0 + (px1 - px0) * 0.40;
        var yER = py1 - ER * (py1 - py0);
        var yPR = py1 - PEAK_R * (py1 - py0);
        drawEaArrow(g, xa, yER, yPR, WARN, '活化能 大');
      }
      if (pr2 > 0.9) {
        var xg = px0 + (px1 - px0) * 0.47;
        var yER2 = py1 - ER * (py1 - py0);
        var yPG = py1 - PEAK_G * (py1 - py0);
        drawEaArrow(g, xg, yER2, yPG, OK, '活化能 小');
        label(g, '催化劑：開一條矮山的路，自己不被用掉', w / 2, h - 25, OK, 10, 'center');
      }
      bottomCap(g, w, h, '山越矮 → 更多粒子翻得過去（成功碰撞變多）→ 反應更快', ink);
    }
    function drawEaArrow(g: CanvasRenderingContext2D, x: number, yLow: number, yHigh: number, col: string, txt: string): void {
      g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1.6; g.setLineDash([4, 3]);
      g.beginPath(); g.moveTo(x, yLow); g.lineTo(x, yHigh); g.stroke(); g.setLineDash([]);
      // 兩端箭頭。
      g.beginPath(); g.moveTo(x, yHigh); g.lineTo(x - 3.5, yHigh + 6); g.lineTo(x + 3.5, yHigh + 6); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(x, yLow); g.lineTo(x - 3.5, yLow - 6); g.lineTo(x + 3.5, yLow - 6); g.closePath(); g.fill();
      g.restore();
      label(g, txt, x + 6, (yLow + yHigh) / 2, col, 9.5, 'left');
    }

    // ---- 粒子盒型（temp/conc）主繪 --------------------------------------
    function drawParticles(g: CanvasRenderingContext2D, w: number, h: number, prestep: boolean): void {
      var ink = inkColor();
      ensureSims();
      if (prestep) { left = null; right = null; ensureSims(); for (var k = 0; k < 140; k++) { stepBox(left!); stepBox(right!); } }
      else { stepBox(left!); stepBox(right!); }
      var isTemp = factor === 'temp';
      label(g, isTemp ? '溫度：粒子跑多快？' : '濃度：粒子有多擠？', w / 2, 14, themeColor(), 12, 'center');
      var r = panelRects(w, h);
      var lCol = isTemp ? COLD : themeColor(), rCol = isTemp ? HOT : themeColor();
      // 盒上小標。
      label(g, isTemp ? '低溫（慢）' : '低濃度（少）', r.lx + r.bw / 2, r.top - 8, lCol, 10.5, 'center');
      label(g, isTemp ? '高溫（快）' : '高濃度（多）', r.rx + r.bw / 2, r.top - 8, rCol, 10.5, 'center');
      drawSimBox(g, r.lx, r.top, r.bw, r.bh, left!, lCol, isTemp);
      drawSimBox(g, r.rx, r.top, r.bw, r.bh, right!, rCol, isTemp);
      // 碰撞次數（左低→右高）；置中一行避開右下角重播鈕。
      twoStat(g, w, r.bot + 13, '碰撞次數　' + left!.count, '' + right!.count, rCol);
      bottomCap(g, w, h, isTemp
        ? '溫度高→粒子更快→撞得更頻繁又更用力→反應更快'
        : '濃度高→同樣空間粒子更多→更常相撞→反應更快', ink);
    }

    // ---- surface 主繪 ---------------------------------------------------
    function drawSurface(g: CanvasRenderingContext2D, w: number, h: number): void {
      var ink = inkColor(), theme = themeColor();
      label(g, '表面積：露出多少「可反應的面」？', w / 2, 14, theme, 12, 'center');
      var r = panelRects(w, h);
      label(g, '整塊', r.lx + r.bw / 2, r.top - 8, theme, 10.5, 'center');
      label(g, '切成小塊', r.rx + r.bw / 2, r.top - 8, theme, 10.5, 'center');
      var e1 = drawSurfacePanel(g, r.lx, r.top, r.bw, r.bh, false, theme);
      var e2 = drawSurfacePanel(g, r.rx, r.top, r.bw, r.bh, true, theme);
      twoStat(g, w, r.bot + 13, '可反應表面　' + e1 + ' 段', e2 + ' 段', WARN);
      bottomCap(g, w, h, '體積一樣，切小塊露出更多表面→碰撞點更多→反應更快', ink);
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number): void {
      if (factor === 'catalyst') { drawCatalyst(g, p, w, h); return; }
      if (factor === 'surface') { drawSurface(g, w, h); return; }
      drawParticles(g, w, h, false);
    }

    var labelMap: Record<string, string> = {
      temp: '反應速率碰撞模型（溫度）：左盒低溫粒子跑得慢、右盒高溫粒子跑得快；兩盒粒子相撞時閃光並累加碰撞次數，右盒撞得更頻繁，說明溫度越高反應越快。',
      conc: '反應速率碰撞模型（濃度）：左盒粒子少、右盒同樣大小塞進更多粒子；相撞時閃光並累加碰撞次數，右盒更常相撞，說明濃度越高反應越快。',
      surface: '反應速率表面積比較：左邊是一整塊、右邊把同樣體積切成小塊；小塊露出更多可反應的表面段，碰撞點更多，說明表面積越大反應越快。',
      catalyst: '反應速率活化能位能圖：紅色高山是沒有催化劑時要翻過的活化能，綠色矮山是催化劑開的另一條路；山越矮越多粒子翻得過去、成功碰撞變多，反應更快，而催化劑自己不被消耗。'
    };
    return runScene(host, {
      durationMs: factor === 'catalyst' ? 5600 : 6000, loops: 2, staticPhase: 1,
      label: cfg.label || labelMap[factor],
      drawStatic: function (g, w, h) {
        if (factor === 'catalyst') { drawCatalyst(g, 1, w, h); return; }
        if (factor === 'surface') { drawSurface(g, w, h); return; }
        drawParticles(g, w, h, true);
      },
      onReplay: function () { left = null; right = null; },
      draw: draw
    });
  }

  // ====================================================================
  // 場景 S2：lensImaging — 透鏡成像的「正確光線作圖」。
  //   cfg = { lens:'convex'|'concave', object:'inside-focus'|'outside-focus', label? }
  //   光軸 + 透鏡 + 兩側焦點 F + 直立物體箭頭 + 兩條主要光線定出像：
  //     ① 平行光線 → 折射後過(凸)/看似來自(凹)焦點；② 過透鏡中心的光線直走不偏。
  //   凸透鏡・物在焦點外 → 倒立實像(在另一側，照相機/眼睛)；
  //   凸透鏡・物在焦點內 → 正立放大虛像(同側，放大鏡；虛線延伸)；
  //   凹透鏡 → 正立縮小虛像(同側)。像的位置＝兩條折射光線(或其延伸線)的交點，由幾何追跡算出→保證正確。
  //   reduced-motion：staticPhase=1 直接畫完整光線圖。
  // ====================================================================
  function lensImaging(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var lens: string = (cfg.lens === 'concave') ? 'concave' : 'convex';
    var inside: boolean = (cfg.object === 'inside-focus');
    var RAYA = '#0891b2', RAYB = '#d97706', IMG = '#16a34a';
    var fAbs = 1, ho = 0.62;
    var dow: number = (lens === 'convex') ? (inside ? 0.6 : 2.5) : 1.5;   // 物距(>0，在左側)
    // 兩條光線（世界座標，透鏡中心在 x=0，光軸 y=0）。
    var mB = -ho / dow;                                    // 過中心光線 y = mB·x
    var mA: number, cA = ho;                               // 折射光線 y = mA·x + cA（過 (0,ho)）
    if (lens === 'convex') mA = -ho / fAbs;                // 平行光 → 過遠焦點 (f,0)
    else mA = ho / fAbs;                                   // 凹：折射後看似來自前焦點 (−f,0)
    var xi = cA / (mB - mA), yi = mB * xi;                 // 像尖＝兩線交點
    var real = xi > 0;                                     // 凸・焦點外＝實像(x>0)；其餘＝虛像(x<0)

    // 世界範圍 → 螢幕映射。
    var feats = [-dow, 0, fAbs, -fAbs, xi];
    var minX = Math.min.apply(null, feats) - 0.5, maxX = Math.max.apply(null, feats) + 0.5;
    var yMax = Math.max(ho, Math.abs(yi)) * 1.35;

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number): void {
      var ink = inkColor(), theme = themeColor();
      var px0 = 14, px1 = w - 14, py0 = 30, py1 = h - 40;
      var sx = (px1 - px0) / (maxX - minX);
      var axisY = (py0 + py1) / 2;
      var sy = Math.min(sx, ((py1 - py0) / 2) / yMax);     // 等比上限，避免高度溢出
      function X(wx: number): number { return px0 + (wx - minX) * sx; }
      function Y(wy: number): number { return axisY - wy * sy; }

      label(g, lens === 'convex' ? '凸透鏡成像' : '凹透鏡成像', w / 2, 13, theme, 12, 'center');
      // 光軸。
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.4; g.lineWidth = 1; g.setLineDash([3, 3]);
      g.beginPath(); g.moveTo(px0, axisY); g.lineTo(px1, axisY); g.stroke(); g.setLineDash([]); g.restore();
      // 透鏡（凸＝向外鼓的雙弧；凹＝向內凹）。
      var lx = X(0), lensTop = Y(yMax * 0.92), lensBot = Y(-yMax * 0.92);
      g.save(); g.strokeStyle = theme; g.lineWidth = 2.4; g.lineCap = 'round'; g.globalAlpha = 0.85;
      var bulge = (lens === 'convex') ? (px1 - px0) * 0.03 : -(px1 - px0) * 0.03;
      g.beginPath(); g.moveTo(lx, lensTop); g.quadraticCurveTo(lx + bulge, axisY, lx, lensBot); g.stroke();
      g.beginPath(); g.moveTo(lx, lensTop); g.quadraticCurveTo(lx - bulge, axisY, lx, lensBot); g.stroke();
      g.restore();
      // 焦點 F。
      g.save();
      disc(g, X(fAbs), axisY, 2.8, ink); disc(g, X(-fAbs), axisY, 2.8, ink);
      label(g, 'F', X(fAbs), axisY + 12, ink, 10, 'center');
      label(g, 'F', X(-fAbs), axisY + 12, ink, 10, 'center');
      g.restore();
      // 物體箭頭（直立，向上）。
      var objA = Math.min(1, p / 0.22);
      if (objA > 0.01) drawArrow(g, X(-dow), axisY, X(-dow), Y(ho * objA), theme, false, '物體', 'up');

      // 光線階段：A(0.24..0.54)、B(0.54..0.8)、像(0.8..1)。
      var aP = Math.max(0, Math.min(1, (p - 0.24) / 0.3));
      var bP = Math.max(0, Math.min(1, (p - 0.54) / 0.26));
      var iP = Math.max(0, Math.min(1, (p - 0.8) / 0.2));

      // Ray A：平行段 (物尖→透鏡)，再折射段。
      if (aP > 0.01) {
        var ax0 = X(-dow), ay0 = Y(ho), axL = lx, ayL = Y(ho);
        // 平行入射（前半）。
        var segA = Math.min(1, aP / 0.4);
        g.save(); g.strokeStyle = RAYA; g.lineWidth = 1.8; g.lineCap = 'round';
        g.beginPath(); g.moveTo(ax0, ay0); g.lineTo(ax0 + (axL - ax0) * segA, ayL); g.stroke(); g.restore();
        if (aP > 0.4) {
          var fp = (aP - 0.4) / 0.6;
          // 折射後：沿 y=mA x+cA。實像畫到交點外；虛像前段實線(往右發散)、延伸虛線到像。
          var xEndW = real ? Math.max(xi + 0.5, 1.2) : maxX;        // 世界 x 終點
          var xDrawW = 0 + (xEndW - 0) * fp;
          g.save(); g.strokeStyle = RAYA; g.lineWidth = 1.8; g.lineCap = 'round';
          g.beginPath(); g.moveTo(lx, Y(mA * 0 + cA)); g.lineTo(X(xDrawW), Y(mA * xDrawW + cA)); g.stroke(); g.restore();
          if (!real && fp > 0.9) {   // 虛像延伸線（往左、虛線到像）
            g.save(); g.strokeStyle = RAYA; g.globalAlpha = 0.75; g.lineWidth = 1.4; g.setLineDash([5, 4]);
            g.beginPath(); g.moveTo(lx, Y(cA)); g.lineTo(X(xi), Y(yi)); g.stroke(); g.setLineDash([]); g.restore();
          }
        }
      }
      // Ray B：過中心直走（物尖→中心→另一側）。
      if (bP > 0.01) {
        var xEndB = real ? Math.max(xi + 0.5, 1.2) : maxX;
        var xStart = -dow, xNow = xStart + (xEndB - xStart) * bP;
        g.save(); g.strokeStyle = RAYB; g.lineWidth = 1.8; g.lineCap = 'round';
        g.beginPath(); g.moveTo(X(xStart), Y(mB * xStart)); g.lineTo(X(xNow), Y(mB * xNow)); g.stroke(); g.restore();
        if (!real && bP > 0.9) {    // 虛像：往左延伸虛線到像
          g.save(); g.strokeStyle = RAYB; g.globalAlpha = 0.75; g.lineWidth = 1.4; g.setLineDash([5, 4]);
          g.beginPath(); g.moveTo(X(xStart), Y(mB * xStart)); g.lineTo(X(xi), Y(yi)); g.stroke(); g.setLineDash([]); g.restore();
        }
      }
      // 像箭頭。
      if (iP > 0.01) {
        drawArrow(g, X(xi), axisY, X(xi), Y(yi * iP), IMG, !real, '像', yi >= 0 ? 'up' : 'down');
      }
      // 圖例（兩條光線）。
      g.save();
      g.strokeStyle = RAYA; g.lineWidth = 2; g.beginPath(); g.moveTo(px0, py0 - 3); g.lineTo(px0 + 16, py0 - 3); g.stroke();
      label(g, '平行光線', px0 + 20, py0 - 3, RAYA, 9, 'left');
      g.strokeStyle = RAYB; g.lineWidth = 2; g.beginPath(); g.moveTo(w / 2, py0 - 3); g.lineTo(w / 2 + 16, py0 - 3); g.stroke();
      label(g, '過中心', w / 2 + 20, py0 - 3, RAYB, 9, 'left');
      g.restore();
      // 結論。
      var cap = (lens === 'convex')
        ? (inside ? '焦點內：正立、放大的虛像（放大鏡）' : '焦點外：倒立、縮小的實像（照相機／眼睛）')
        : '凹透鏡：永遠是正立、縮小的虛像';
      bottomCap(g, w, h, cap, ink);
    }

    // 直立/倒立箭頭（dashed＝虛像）。
    function drawArrow(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number,
      col: string, dashed: boolean, txt: string, dir: string): void {
      g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2.2; g.lineCap = 'round';
      if (dashed) g.setLineDash([5, 4]);
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.setLineDash([]);
      var hy = (dir === 'up') ? 7 : -7;
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - 4, y1 + hy); g.lineTo(x1 + 4, y1 + hy); g.closePath(); g.fill();
      g.restore();
      label(g, txt, x1 + (dir === 'up' ? -2 : -2), y1 + (dir === 'up' ? -8 : 10), col, 9.5, 'center');
    }

    return runScene(host, {
      durationMs: 6400, loops: 2, staticPhase: 1,
      label: cfg.label || (lens === 'convex'
        ? (inside
          ? '凸透鏡光線作圖：物體放在焦點內，平行光線折射後過遠焦點、過中心光線直走，兩條折射光線往右發散，往回延伸的虛線交在同側，得到正立放大的虛像（放大鏡）。'
          : '凸透鏡光線作圖：物體放在焦點外，平行光線折射後過遠焦點、過中心光線直走，兩條光線交在透鏡另一側，得到倒立縮小的實像（照相機／眼睛）。')
        : '凹透鏡光線作圖：平行光線折射後看似來自前焦點、過中心光線直走，往回延伸的虛線交在同側，得到正立縮小的虛像。'),
      draw: draw
    });
  }

  // ====================================================================
  // 場景 S3：motionGraph — 運動中的物體與它的「時間圖形」同步畫出來。
  //   cfg = { type:'vt'|'xt', scenario?, label? }
  //   上方軌道一台車跟著動；下方同步描出圖形（橫軸＝時間）、描點沿曲線移動：
  //     xt：縱軸＝位置。斜率＝速度（越陡越快、平＝停、往下＝返回）。
  //     vt：縱軸＝速度。線高＝速度、平線＝等速、往上＝加速、往下＝減速；車速＝當下的 v。
  //   說明會隨當前路段切換（往前／停住／返回；加速／等速／減速）。
  //   reduced-motion：staticPhase=1 畫完整曲線＋車停在終點。
  // ====================================================================
  function motionGraph(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var type: string = (cfg.type === 'vt') ? 'vt' : 'xt';
    var scenario: string = cfg.scenario || (type === 'vt' ? 'accel' : 'trip');
    // 控制點：ts 時間(0..1)、qs 量值(0..1)。
    var ts: number[], qs: number[];
    if (type === 'xt') {
      if (scenario === 'outback') { ts = [0, 0.5, 1]; qs = [0.12, 0.92, 0.12]; }
      else { ts = [0, 0.34, 0.6, 1]; qs = [0.12, 0.92, 0.92, 0.24]; }       // trip：往前→停→返回
    } else {
      if (scenario === 'stopgo') { ts = [0, 0.3, 0.5, 0.8, 1]; qs = [0.2, 0.2, 0.85, 0.85, 0.2]; }
      else { ts = [0, 0.38, 0.72, 1]; qs = [0.05, 0.9, 0.9, 0.3]; }         // accel：加速→等速→減速
    }
    var QC = '#0891b2';   // 圖形曲線色（資料色，亮暗皆讀得清）

    function qAt(t: number): number {
      t = Math.max(0, Math.min(1, t));
      for (var i = 1; i < ts.length; i++) {
        if (t <= ts[i]) { var u = (t - ts[i - 1]) / (ts[i] - ts[i - 1] || 1); return qs[i - 1] + (qs[i] - qs[i - 1]) * u; }
      }
      return qs[qs.length - 1];
    }
    // vt：車位置＝速度積分（梯形），正規化到 0..1。
    var N = 60, cumul: number[] = [0];
    for (var ii = 1; ii <= N; ii++) {
      var a = qAt((ii - 1) / N), b = qAt(ii / N);
      cumul.push(cumul[ii - 1] + (a + b) / 2 / N);
    }
    var cumMax = cumul[N] || 1;
    function posAt(t: number): number {
      if (type === 'xt') return qAt(t);
      var f = Math.max(0, Math.min(1, t)) * N, lo = Math.floor(f), hi = Math.min(N, lo + 1);
      var c = cumul[lo] + (cumul[hi] - cumul[lo]) * (f - lo);
      return 0.08 + 0.84 * (c / cumMax);
    }
    function segInfo(t: number): [string, string] {
      // 回傳 [說明, 色]；依當前斜率(xt)或量值變化(vt)。
      var dt = 0.02, q0 = qAt(t - dt), q1 = qAt(t + dt), slope = q1 - q0;
      if (type === 'xt') {
        if (Math.abs(slope) < 0.004) return ['平：停住（位置不變）', MUT_C];
        if (slope > 0) return ['往上：往前（位置增加）', QC];
        return ['往下：返回（位置減少）', '#d97706'];
      } else {
        if (Math.abs(slope) < 0.004) return ['平線：等速（速度不變）', QC];
        if (slope > 0) return ['往上：加速（越來越快）', '#16a34a'];
        return ['往下：減速（越來越慢）', '#d97706'];
      }
    }
    var MUT_C = '#64748b';

    function drawCar(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, col: string): void {
      g.save();
      g.globalAlpha = 0.2; g.fillStyle = col; rrectPath(g, cx - s, cy - s * 0.5, 2 * s, s, s * 0.3); g.fill();
      g.globalAlpha = 1; g.strokeStyle = col; g.lineWidth = 1.6; rrectPath(g, cx - s, cy - s * 0.5, 2 * s, s, s * 0.3); g.stroke();
      // 車頂。
      rrectPath(g, cx - s * 0.45, cy - s * 0.9, s * 0.9, s * 0.45, s * 0.2); g.stroke();
      g.restore();
      disc(g, cx - s * 0.5, cy + s * 0.5, s * 0.26, col);
      disc(g, cx + s * 0.5, cy + s * 0.5, s * 0.26, col);
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number): void {
      var ink = inkColor(), theme = themeColor();
      label(g, type === 'xt' ? '位置－時間圖（x–t）：斜率＝速度' : '速度－時間圖（v–t）：線高＝速度', w / 2, 13, theme, 11.5, 'center');
      // 軌道（上方）。
      var trkY = h * 0.2, tx0 = w * 0.1, tx1 = w * 0.9;
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.3; g.lineWidth = 2; g.lineCap = 'round';
      g.beginPath(); g.moveTo(tx0, trkY + 10); g.lineTo(tx1, trkY + 10); g.stroke(); g.restore();
      var carX = tx0 + (tx1 - tx0) * posAt(p);
      drawCar(g, carX, trkY, Math.min(w, h) * 0.05, theme);
      label(g, type === 'xt' ? '起點' : '起步', tx0, trkY - 11, ink, 9, 'center');
      // 圖形區。
      var gx0 = 30, gx1 = w - 14, gy0 = h * 0.4, gy1 = h - 42;
      // 軸。
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.5; g.lineWidth = 1.3;
      g.beginPath(); g.moveTo(gx0, gy0); g.lineTo(gx0, gy1); g.lineTo(gx1, gy1); g.stroke(); g.restore();
      label(g, type === 'xt' ? '位置' : '速度', gx0 - 2, gy0 - 2, ink, 9, 'left');
      label(g, '時間 →', gx1, gy1 + 12, ink, 9, 'right');
      function GX(t: number): number { return gx0 + (gx1 - gx0) * t; }
      function GY(q: number): number { return gy1 - (gy1 - gy0) * q; }
      // 淡的完整曲線（預告）。
      g.save(); g.strokeStyle = QC; g.globalAlpha = 0.2; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath();
      for (var t2 = 0; t2 <= 1.0001; t2 += 0.02) { var xx = GX(t2), yy = GY(qAt(t2)); if (t2 === 0) g.moveTo(xx, yy); else g.lineTo(xx, yy); }
      g.stroke(); g.restore();
      // 已描出的曲線（粗，到 p）。
      g.save(); g.strokeStyle = QC; g.lineWidth = 2.8; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath();
      var started = false;
      for (var t3 = 0; t3 <= p + 1e-6; t3 += 0.01) { var x3 = GX(t3), y3 = GY(qAt(t3)); if (!started) { g.moveTo(x3, y3); started = true; } else g.lineTo(x3, y3); }
      g.stroke(); g.restore();
      // now 垂直線 + 描點。
      var nowX = GX(p), nowY = GY(qAt(p));
      g.save(); g.strokeStyle = ink; g.globalAlpha = 0.25; g.lineWidth = 1; g.setLineDash([3, 3]);
      g.beginPath(); g.moveTo(nowX, gy0); g.lineTo(nowX, gy1); g.stroke(); g.setLineDash([]); g.restore();
      disc(g, nowX, nowY, 4.5, '#e11d48');
      // 當前路段說明。
      var si = segInfo(p);
      label(g, si[0], w / 2, gy0 - 2, si[1], 10.5, 'center');
      bottomCap(g, w, h, type === 'xt' ? '車怎麼走，線就怎麼畫：陡＝快、平＝停、下＝回' : '車怎麼走，線就怎麼畫：高＝快、平＝等速、上＝加速', ink);
    }

    return runScene(host, {
      durationMs: 7000, loops: 2, staticPhase: 1,
      label: cfg.label || (type === 'xt'
        ? '位置－時間圖動畫：上方一台車跟著移動，下方同步描出位置對時間的圖形；線往上代表往前、水平代表停住、往下代表返回，斜率就是速度。'
        : '速度－時間圖動畫：上方一台車跟著移動，下方同步描出速度對時間的圖形；線往上代表加速、水平代表等速、往下代表減速，線的高度就是速度。'),
      draw: draw
    });
  }

  // ====================================================================
  // 場景 S4：causalChain — 一條「因果鏈／流程」逐格揭示（PLAYABLE，可重播）。
  //   cfg = { nodes:[{label, note?}], mode?:'cause'|'flow', title?, label? }
  //   方塊由上而下逐一出現、以向下箭頭相連（箭頭意思＝「導致／接著」）；每格可讀、箭頭貼住兩端。
  //   同一場景兼用：歷史因果鏈（如 1945→二二八→戒嚴→政府遷台→解嚴→直選）與流程（法案如何通過）。
  //   4–7 個節點、每格可多字(自動折 2 行)、note 當小字補充。reduced-motion：一次畫出全部節點與箭頭。
  // ====================================================================
  function causalChain(host: HTMLElement, cfg: any) {
    cfg = cfg || {};
    var nodes: any[] = (cfg.nodes && cfg.nodes.length) ? cfg.nodes : [{ label: '節點' }];
    var mode: string = (cfg.mode === 'flow') ? 'flow' : 'cause';
    var nN = nodes.length;

    function wrapCJK(text: string, maxChars: number): string[] {
      var lines: string[] = [], cur = '';
      for (var i = 0; i < text.length; i++) { cur += text.charAt(i); if (cur.length >= maxChars) { lines.push(cur); cur = ''; } }
      if (cur) lines.push(cur);
      return lines;
    }

    function draw(g: CanvasRenderingContext2D, p: number, w: number, h: number): void {
      var ink = inkColor(), theme = themeColor();
      label(g, cfg.title || (mode === 'flow' ? '流程：一關一關走' : '因果鏈：一步一步看為什麼'), w / 2, 14, theme, 12, 'center');
      var pad = 14, top = 32, bot = h - 12;
      var slotH = (bot - top) / nN;
      var boxH = Math.min(slotH - 12, 48), boxW = w - 2 * pad;
      var arrowGap = slotH - boxH;
      for (var i = 0; i < nN; i++) {
        var tIn = (nN > 1) ? (i * (0.82 / nN)) : 0;
        var prog = easeInOut(Math.max(0, Math.min(1, (p - tIn) / Math.max(0.001, (0.82 / nN) * 1.3))));
        if (prog <= 0.01) continue;
        var by = top + i * slotH + (slotH - boxH) / 2;
        var bx = pad + (1 - prog) * (-boxW * 0.5);           // 由左滑入
        var col = resolveCol(nodes[i].color, theme);
        var nd = nodes[i];
        var lbl = nd.label || '';
        var note = nd.note || '';
        chipBox(g, bx, by, boxW, boxH, col, '', ink, 12, prog);
        g.save(); g.globalAlpha = prog;
        // 序號圓點。
        disc(g, bx + 14, by + boxH / 2, 9, col);
        g.globalAlpha = prog; label(g, '' + (i + 1), bx + 14, by + boxH / 2, '#ffffff', 10, 'center');
        // 標籤（＋note 小字）。
        var lblLines = wrapCJK(lbl, 11);
        var hasNote = !!note && boxH >= 38;
        var cx = bx + 30 + (boxW - 40) / 2;
        if (hasNote) {
          for (var k = 0; k < lblLines.length; k++) label(g, lblLines[k], cx, by + boxH / 2 - 9 + k * 15, ink, 12, 'center');
          label(g, note, cx, by + boxH - 11, MUT_S, 9, 'center');
        } else {
          var startY = by + boxH / 2 - (lblLines.length - 1) * 8;
          for (var k2 = 0; k2 < lblLines.length; k2++) label(g, lblLines[k2], cx, startY + k2 * 16, ink, 12, 'center');
        }
        g.restore();
        // 進入下一格的向下箭頭。
        if (i < nN - 1) {
          var arrA = easeInOut(Math.max(0, Math.min(1, (p - (tIn + (0.82 / nN) * 0.7)) / Math.max(0.001, (0.82 / nN) * 0.8))));
          if (arrA > 0.01) {
            var ax = bx + boxW / 2, ay0 = by + boxH + 1, ay1 = by + boxH + arrowGap - 1;
            var ayNow = ay0 + (ay1 - ay0) * arrA;
            g.save(); g.strokeStyle = theme; g.lineWidth = 2; g.lineCap = 'round'; g.globalAlpha = 0.9;
            g.beginPath(); g.moveTo(ax, ay0); g.lineTo(ax, ayNow); g.stroke();
            if (arrA > 0.85) { g.fillStyle = theme; g.beginPath(); g.moveTo(ax, ay1 + 2); g.lineTo(ax - 4.5, ay1 - 4); g.lineTo(ax + 4.5, ay1 - 4); g.closePath(); g.fill(); }
            g.restore();
          }
        }
      }
    }
    var MUT_S = '#64748b';

    return runScene(host, {
      durationMs: Math.max(4200, nN * 1100), loops: 2, staticPhase: 1,
      label: cfg.label || ((mode === 'flow' ? '流程圖動畫：' : '因果鏈動畫：') + nN + ' 個步驟由上而下逐一出現、用向下箭頭相連，' +
        '依序呈現「' + nodes.map(function (n: any) { return n.label; }).join('→') + '」。'),
      draw: draw
    });
  }

  // ---- 導出 -----------------------------------------------------------
  var Anim = {
    reducedMotion: reducedMotion,
    earthRevolution: earthRevolution,
    earthSeasons: earthSeasons,
    moonPhases: moonPhases,
    circuitFlow: circuitFlow,
    buoyancyFloat: buoyancyFloat,
    reactionRebond: reactionRebond,
    vectorAdd: vectorAdd,
    fractionEquiv: fractionEquiv,
    statesOfMatter: statesOfMatter,
    waterCycle: waterCycle,
    photosynthesis: photosynthesis,
    funcPlot: funcPlot,
    trigTriangle: trigTriangle,
    barGrow: barGrow,
    boxplotBuild: boxplotBuild,
    scatterTrend: scatterTrend,
    fallacySpotlight: fallacySpotlight,
    argFlow: argFlow,
    fairTest: fairTest,
    greenhouseEffect: greenhouseEffect,
    carbonCycle: carbonCycle,
    compoundGrowth: compoundGrowth,
    worldLocator: worldLocator,
    placeValue: placeValue,
    numberLine: numberLine,
    partWhole100: partWhole100,
    solid3D: solid3D,
    zhuyinBlend: zhuyinBlend,
    toneContour: toneContour,
    textHighlight: textHighlight,
    blockAssemble: blockAssemble,
    barChartCallout: barChartCallout,
    enLetter: enLetter,
    enBlend: enBlend,
    enTimeline: enTimeline,
    enSentenceBuild: enSentenceBuild,
    enMeter: enMeter,
    reactionRate: reactionRate,
    lensImaging: lensImaging,
    motionGraph: motionGraph,
    causalChain: causalChain,
  };
  (window as any).Anim = Anim;
})();
