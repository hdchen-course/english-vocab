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

    play();

    return {
      stop: function () {
        stopped = true;
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        document.removeEventListener('visibilitychange', onVisibility);
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
  };
  (window as any).Anim = Anim;
})();
