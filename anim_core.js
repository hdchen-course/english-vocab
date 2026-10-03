"use strict";
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
    function reducedMotion() {
        try {
            return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
        catch (e) {
            return false;
        }
    }
    /** 讀 :root 的 CSS 自訂屬性，trim 後回傳；空值用 fallback。 */
    function cssVar(name, fallback) {
        try {
            var v = getComputedStyle(document.documentElement).getPropertyValue(name);
            v = (v || '').trim();
            return v || fallback;
        }
        catch (e) {
            return fallback;
        }
    }
    /** 當前頁主題色（各科 --su）；地科等未設 --su 的頁給一個中性藍。 */
    function themeColor() { return cssVar('--su', cssVar('--c-science', '#2d7dd2')); }
    function inkColor() { return cssVar('--ink', '#2b2b36'); }
    function easeInOut(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }
    // 天體自然色（固定，不隨主題；科學正確性）。
    var SUN = '#f6b73c', SUN_GLOW = 'rgba(246,183,60,0.35)';
    var EARTH_SEA = '#3a7bd5', EARTH_LAND = '#4caf72';
    var MOON_LIT = '#f3f1e9', MOON_DARK = '#6b6f7a';
    var AXIS = '#e74c3c'; // 地軸＝紅線（與原靜態 SVG 一致）
    function runScene(host, cfg) {
        var canvas = host.querySelector('canvas');
        if (!canvas)
            return { stop: function () { } };
        var ctx = canvas.getContext('2d');
        if (!ctx)
            return { stop: function () { } };
        var g = ctx;
        // 邏輯尺寸取自 canvas 的 CSS 盒；backing store 乘上 DPR 以求清晰（手機放寬到 3x）。
        var cssW = canvas.clientWidth || canvas.width || 300;
        var cssH = canvas.clientHeight || canvas.height || 170;
        var dpr = Math.min(window.devicePixelRatio || 1, 3);
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (cfg.label)
            canvas.setAttribute('aria-label', cfg.label);
        // 一輪總時長：有具名狀態時 = 段數 ×（移動 + 停留）。
        var keys = cfg.keyStates || null;
        var segMs = cfg.segMs || 1200;
        var dwellMs = cfg.dwellMs || 1300;
        var loopMs = keys ? keys.length * (segMs + dwellMs) : cfg.durationMs;
        var finalPhase = keys ? keys[0] : 1;
        /** 把一輪內的時間 t（0..loopMs）換成 phase（0..1），含每個具名狀態停留。 */
        function phaseAt(t) {
            if (!keys) {
                var tl = t / cfg.durationMs;
                return tl - Math.floor(tl);
            }
            var unit = segMs + dwellMs;
            var i = Math.floor(t / unit) % keys.length;
            var tt = t - Math.floor(t / unit) * unit;
            var startP = keys[i];
            var endP = (i + 1 < keys.length) ? keys[i + 1] : (1 + keys[0]);
            var p;
            if (tt < dwellMs) {
                p = startP; // 停在這個具名狀態
            }
            else {
                var pr = easeInOut((tt - dwellMs) / segMs); // 緩動移到下一個狀態
                p = startP + (endP - startP) * pr;
            }
            return p % 1;
        }
        var raf = 0;
        var start = 0;
        var stopped = false;
        var finished = false; // 已播完 N 輪、停在最後一幀
        function frame(now) {
            if (stopped)
                return;
            if (!start)
                start = now;
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
                if (cfg.drawStatic)
                    cfg.drawStatic(g, cssW, cssH);
                else
                    cfg.draw(g, cfg.staticPhase, cssW, cssH);
                return;
            }
            raf = requestAnimationFrame(frame);
        }
        // 分頁切背景自動暫停；回前景續播（除非已播完）。
        function onVisibility() {
            if (document.hidden) {
                if (raf)
                    cancelAnimationFrame(raf);
                raf = 0;
            }
            else if (!stopped && !finished && !reducedMotion()) {
                start = 0;
                raf = requestAnimationFrame(frame);
            }
        }
        document.addEventListener('visibilitychange', onVisibility);
        // 重播鈕（絕對定位於 host 角落，顯示/隱藏都不改版面高度）。reduced-motion 不顯示。
        var replayBtn = null;
        function ensureReplay() {
            if (replayBtn || reducedMotion())
                return;
            replayBtn = document.createElement('button');
            replayBtn.type = 'button';
            replayBtn.className = 'cn-anim-replay';
            replayBtn.textContent = cfg.replayText || '🔁 重播';
            replayBtn.addEventListener('click', function () { play(); });
            host.appendChild(replayBtn);
        }
        function showReplay() { ensureReplay(); if (replayBtn)
            replayBtn.style.display = ''; }
        function hideReplay() { if (replayBtn)
            replayBtn.style.display = 'none'; }
        play();
        return {
            stop: function () {
                stopped = true;
                if (raf)
                    cancelAnimationFrame(raf);
                raf = 0;
                document.removeEventListener('visibilitychange', onVisibility);
                if (replayBtn && replayBtn.parentNode)
                    replayBtn.parentNode.removeChild(replayBtn);
                replayBtn = null;
            }
        };
    }
    // ---- 繪圖小工具 -----------------------------------------------------
    function disc(g, x, y, r, fill) {
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fillStyle = fill;
        g.fill();
    }
    function label(g, text, x, y, color, size, align) {
        g.fillStyle = color;
        g.font = '600 ' + size + 'px system-ui, -apple-system, "Segoe UI", sans-serif';
        g.textAlign = align || 'center';
        g.textBaseline = 'middle';
        g.fillText(text, x, y);
    }
    /** 畫一個太陽圓盤（含光暈）＝取代 emoji，讓三個場景的太陽視覺一致。 */
    function sunDisc(g, x, y, r) {
        disc(g, x, y, r * 1.6, SUN_GLOW);
        disc(g, x, y, r, SUN);
    }
    /** 入射角示意面板：固定寬度的平行陽光打在水平地面，太陽越高→光越集中（亮、熱）；
     *  越低→同樣的光攤在越大的地面（分散、涼）。這就是四季冷熱的「角度」成因。 */
    function incidencePanel(g, cx, top, w, h, altDeg, ink, capOverride) {
        var pad = 6;
        var groundY = top + h - 22;
        var gx0 = cx - w / 2 + pad, gx1 = cx + w / 2 - pad;
        var alt = altDeg * Math.PI / 180, s = Math.max(0.2, Math.sin(alt));
        var beamW = (w - 2 * pad) * 0.38; // 進來的光束寬度（固定＝同樣多的陽光）
        var foot = Math.min((w - 2 * pad) * 0.96, beamW / s); // 落在地面的範圍＝光束寬 / sin(高度角)
        var fx0 = cx - foot / 2, fx1 = cx + foot / 2;
        var dx = Math.cos(alt), dy = Math.sin(alt); // 由左上往右下
        // 光線長度：夾住上限，讓太陽與光線永遠留在面板框內（不會延伸壓到左邊的公轉圖）。
        var L = Math.min(h - 34, (w / 2 - pad) / Math.max(0.25, dx));
        // 把所有繪製夾在面板範圍內（低仰角時光線很斜，避免溢出）。
        g.save();
        g.beginPath();
        g.rect(cx - w / 2, top, w, h);
        g.clip();
        // 地面。
        g.save();
        g.strokeStyle = EARTH_LAND;
        g.lineWidth = 3;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(gx0, groundY);
        g.lineTo(gx1, groundY);
        g.stroke();
        g.restore();
        // 平行陽光（幾條）。
        g.save();
        g.strokeStyle = SUN;
        g.lineWidth = 1.8;
        g.globalAlpha = 0.4 + 0.5 * s;
        var n = 4;
        for (var i = 0; i < n; i++) {
            var gxp = fx0 + foot * (n === 1 ? 0.5 : i / (n - 1));
            g.beginPath();
            g.moveTo(gxp - dx * L, groundY - dy * L);
            g.lineTo(gxp, groundY);
            g.stroke();
        }
        g.restore();
        // 被照亮的地面範圍（亮帶）：越直射越窄越亮。
        g.save();
        g.strokeStyle = SUN;
        g.lineWidth = 5;
        g.lineCap = 'round';
        g.globalAlpha = 0.45 + 0.55 * s;
        g.beginPath();
        g.moveTo(fx0, groundY);
        g.lineTo(fx1, groundY);
        g.stroke();
        g.restore();
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
    function earthRevolution(host) {
        return runScene(host, {
            durationMs: 9000, loops: 2, staticPhase: 0.28,
            label: '公轉動畫：地球繞著太陽轉一大圈，繞一圈大約一年。',
            draw: function (g, phase, w, h) {
                var cx = w / 2, cy = h / 2;
                var rx = Math.min(w, h) * 0.36, ry = rx * 0.78;
                var theme = themeColor(), ink = inkColor();
                // 軌道（虛線、主題色）。
                g.save();
                g.setLineDash([4, 5]);
                g.lineWidth = 1.5;
                g.strokeStyle = theme;
                g.beginPath();
                g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                g.stroke();
                g.restore();
                // 太陽（含光暈）。
                sunDisc(g, cx, cy, 13);
                label(g, '太陽', cx, cy + 30, ink, 12, 'center');
                // 地球沿軌道（phase=0 從右側起，逆時針）。
                var a = -phase * Math.PI * 2;
                var ex = cx + Math.cos(a) * rx, ey = cy + Math.sin(a) * ry;
                disc(g, ex, ey, 8, EARTH_SEA);
                g.save();
                g.beginPath();
                g.arc(ex, ey, 8, Math.PI * 0.2, Math.PI * 1.1);
                g.fillStyle = EARTH_LAND;
                g.fill();
                g.restore();
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
    function earthSeasons(host) {
        var SEASONS = ['夏（北半球朝太陽・直射）', '秋（陽光中等）', '冬（北半球斜離太陽・斜射）', '春（陽光中等）'];
        // 北半球中緯度正午太陽高度角 ≈ 55 + 23.5·cos(2π·phase)：夏(78.5°)高、冬(31.5°)低、春秋(55°)。
        function altAt(phase) { return 55 + 23.5 * Math.cos(phase * Math.PI * 2); }
        return runScene(host, {
            durationMs: 12000, loops: 2, staticPhase: 0.0,
            keyStates: [0, 0.25, 0.5, 0.75], segMs: 1200, dwellMs: 1400,
            label: '四季動畫：地球繞太陽時地軸方向固定，北半球有時朝向太陽、陽光直射（夏），半年後斜離太陽、陽光斜射（冬）。右邊示意同樣多的陽光，直射時集中變熱、斜射時攤開變涼。四個位置離太陽一樣遠——四季是角度不是距離。',
            drawStatic: function (g, w, h) {
                // reduced-motion：四格並排，保留「跨季節」對比（這才是重點）。
                var ink = inkColor(), theme = themeColor();
                var cells = [['夏', 78.5], ['秋', 55], ['冬', 31.5], ['春', 55]];
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
                g.save();
                g.setLineDash([4, 5]);
                g.lineWidth = 1.5;
                g.strokeStyle = theme;
                g.beginPath();
                g.arc(ocx, ocy, r, 0, Math.PI * 2);
                g.stroke();
                g.restore();
                // 太陽。
                sunDisc(g, ocx, ocy, 11);
                // 四個季節定位點 + 淡「幽靈地球」：全在同一半徑＝離太陽一樣遠。
                var qi;
                for (qi = 0; qi < 4; qi++) {
                    var qa = -qi * Math.PI / 2;
                    var qx = ocx + Math.cos(qa) * r, qy = ocy + Math.sin(qa) * r;
                    g.save();
                    g.globalAlpha = 0.3;
                    disc(g, qx, qy, 6, EARTH_SEA);
                    g.restore();
                    g.save();
                    g.globalAlpha = 0.5;
                    disc(g, qx, qy, 2.5, theme);
                    g.restore();
                }
                // 地球目前位置（phase=0 在右側＝北半球夏）。
                var a = -phase * Math.PI * 2;
                var ex = ocx + Math.cos(a) * r, ey = ocy + Math.sin(a) * r;
                var R = 13;
                disc(g, ex, ey, R, EARTH_SEA);
                g.save();
                g.beginPath();
                g.arc(ex, ey, R, Math.PI * 0.15, Math.PI * 1.05);
                g.fillStyle = EARTH_LAND;
                g.fill();
                g.restore();
                // 地軸：方向【固定】＝永遠指向螢幕右上同一方向（四季成因的關鍵）。
                var tilt = -23.5 * Math.PI / 180;
                var ax = Math.sin(tilt), ay = -Math.cos(tilt); // 單位向量（固定，不隨 a 改變）。
                g.save();
                g.strokeStyle = AXIS;
                g.lineWidth = 2.5;
                g.beginPath();
                g.moveTo(ex - ax * (R + 6), ey - ay * (R + 6));
                g.lineTo(ex + ax * (R + 6), ey + ay * (R + 6));
                g.stroke();
                disc(g, ex + ax * (R + 6), ey + ay * (R + 6), 2.5, AXIS); // 北極端點
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
    function moonPhases(host) {
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
                label(g, '太陽', sunx - 16, cy - 24, SUN, 11, 'center'); // 左移，避免壓到中間分隔線
                g.save();
                g.strokeStyle = SUN;
                g.lineWidth = 1.3;
                g.globalAlpha = 0.75;
                for (var k = -1; k <= 1; k++) {
                    g.beginPath();
                    g.moveTo(sunx - 4, cy + k * 16);
                    g.lineTo(cx + orbit + 10, cy + k * 16);
                    g.stroke();
                }
                g.restore();
                // 地球（中心）。
                disc(g, cx, cy, 9, EARTH_SEA);
                // 軌道。
                g.save();
                g.setLineDash([3, 4]);
                g.lineWidth = 1;
                g.strokeStyle = theme;
                g.beginPath();
                g.arc(cx, cy, orbit, 0, Math.PI * 2);
                g.stroke();
                g.restore();
                // 月球位置（phase=0 在太陽側＝新月；逆時針）。
                var a = -phase * Math.PI * 2;
                var mx = cx + Math.cos(a) * orbit, my = cy + Math.sin(a) * orbit;
                // 月球：永遠右半（朝太陽）被照亮。
                var mr = 7;
                disc(g, mx, my, mr, MOON_DARK);
                g.save();
                g.beginPath();
                g.arc(mx, my, mr, -Math.PI / 2, Math.PI / 2);
                g.fillStyle = MOON_LIT;
                g.fill();
                g.restore();
                g.save();
                g.strokeStyle = ink;
                g.globalAlpha = 0.4;
                g.lineWidth = 0.8;
                g.beginPath();
                g.arc(mx, my, mr, 0, Math.PI * 2);
                g.stroke();
                g.restore();
                // 分隔線。
                g.save();
                g.strokeStyle = theme;
                g.globalAlpha = 0.25;
                g.lineWidth = 1;
                g.beginPath();
                g.moveTo(half, 22);
                g.lineTo(half, h - 22);
                g.stroke();
                g.restore();
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
    var NIGHT_SKY = '#28344a'; // 夜空底盤色（深藍）：淺色月面在亮色卡底也看得見。
    /** 畫「地球所見」月面：phase 0..1 → 新月/上弦/滿月/下弦。 */
    function drawMoonDisc(g, x, y, r, phase) {
        // 夜空底盤：MOON_LIT 很淺，直接畫在奶油卡底上對比不足（亮色主題幾乎看不見）；
        // 墊一塊深藍夜空，讓被照亮的月面在亮/暗主題都清楚浮現。
        disc(g, x, y, r + 4, NIGHT_SKY);
        // 底：暗面整圓。
        disc(g, x, y, r, MOON_DARK);
        // 亮面用「終止線」橢圓法：k = -cos(相位角)，phase0 新月 k=-1、phase0.5 滿月 k=+1。
        var ang = phase * Math.PI * 2;
        var k = -Math.cos(ang);
        g.save();
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.clip();
        g.fillStyle = MOON_LIT;
        // 右半或左半被照：waxing(0..0.5) 右亮；waning(0.5..1) 左亮。
        var waxing = phase <= 0.5;
        if (Math.abs(k) < 0.02) {
            // 半月：畫半邊。
            g.beginPath();
            if (waxing)
                g.arc(x, y, r, -Math.PI / 2, Math.PI / 2);
            else
                g.arc(x, y, r, Math.PI / 2, Math.PI * 1.5);
            g.closePath();
            g.fill();
        }
        else {
            // 亮面外緣 + 終止線（半徑 r*|k| 的橢圓）。
            g.beginPath();
            if (waxing)
                g.arc(x, y, r, -Math.PI / 2, Math.PI / 2, false);
            else
                g.arc(x, y, r, Math.PI / 2, Math.PI * 1.5, false);
            g.ellipse(x, y, r * Math.abs(k), r, 0, waxing ? Math.PI / 2 : Math.PI * 1.5, waxing ? -Math.PI / 2 : Math.PI / 2, k > 0 ? false : true);
            g.closePath();
            g.fill();
        }
        g.restore();
        // 月緣：亮色實線描邊，墊在深藍夜空上，即使新月（整個暗）也看得出圓盤輪廓與位置。
        g.save();
        g.strokeStyle = '#dfe3ec';
        g.lineWidth = 1.2;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.stroke();
        g.restore();
    }
    // ---- 導出 -----------------------------------------------------------
    var Anim = {
        reducedMotion: reducedMotion,
        earthRevolution: earthRevolution,
        earthSeasons: earthSeasons,
        moonPhases: moonPhases
    };
    window.Anim = Anim;
})();
