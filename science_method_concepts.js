/* =====================================================================
 * science_method_concepts.ts  →  (tsc, tsconfig.legacy.json) → science_method_concepts.js
 * 「科學方法・公平測試・變因控制」觀念養成（自然科跨四科共用的底層能力，總論第 0 課）。
 *   國小高年級→國中。四課：
 *     1. 科學方法的步驟（問題→假設→實驗→資料→結論，不合就修正、不可竄改資料）
 *     2. 變因：操縱、控制、應變（操縱＝故意改的、控制＝保持相同、應變＝量到的結果）
 *     3. 公平測試：一次只改一個（＋對照組＋可重複）
 *     4. 測量與誤差（重複取平均、誠實記錄、觀察 vs 推論）
 *   資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）。
 *   動畫課重用 anim_core.js 的 window.Anim.fairTest（NEW 共用場景，fair／unfair 兩種模式，
 *   author-once、未來各科實驗課皆可引用）；其餘 teach step 用 stepped/static SVG。每個
 *   teach step 都有視覺、零純文字。純本地進度（progKey），不餵主 XP。
 *   以 IIFE 包住讓 animCanvas / SVG helper 為檔案區域（避免與其他遷移頁同名頂層 helper
 *   在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。
 *
 *   ★ 台灣課綱用語：變因／操縱變因／控制變因／應變變因（禁用「自變量／因變量」等中國用語）；
 *     禁簡體；中國 not 大陸。
 * ===================================================================== */
(function () {
    // 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
    function animCanvas(w, h, label) {
        return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
            'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
    }
    var SU = '#0d9488', WARN = '#e11d48', OK = '#16a34a', MUT = '#64748b', AMBER = '#d97706';
    // ---- stepped / static SVG helpers（每個非動畫 teach step 都要有視覺）------------
    // L1 teach1：科學方法的流程——問題→假設→實驗→資料→結論，再由「不符就修正」回到假設。
    function flowRing() {
        var labels = ['問題', '假設', '實驗', '資料', '結論'];
        var s = '<svg viewBox="0 0 300 200" role="img" aria-label="科學方法的流程：先提出可檢驗的問題，再對答案提出假設，接著設計實驗，收集資料看結果，最後下結論；如果結果和假設不合，就回頭修正假設再試一次，這就是科學會自我修正">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">科學方法：五個步驟，會自我修正</text>';
        var n = labels.length, bw = 50, gap = (300 - 20 - n * bw) / (n - 1), x0 = 10, y = 78;
        for (var i = 0; i < n; i++) {
            var x = x0 + i * (bw + gap);
            s += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="40" rx="9" fill="' + SU + '" opacity="0.12"/>';
            s += '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="40" rx="9" fill="none" stroke="' + SU + '" stroke-width="1.5"/>';
            s += '<text x="' + (x + bw / 2) + '" y="' + (y + 18) + '" text-anchor="middle" font-size="9" fill="' + MUT + '">步驟' + (i + 1) + '</text>';
            s += '<text x="' + (x + bw / 2) + '" y="' + (y + 32) + '" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">' + labels[i] + '</text>';
            if (i < n - 1) {
                var ax = x + bw, ax2 = ax + gap;
                s += '<path d="M' + (ax + 2) + ' ' + (y + 20) + ' L' + (ax2 - 2) + ' ' + (y + 20) + '" stroke="' + SU + '" stroke-width="2" marker-end="url(#smr)"/>';
            }
        }
        // 「不符就修正」：由結論回到假設的弧線。
        var concX = x0 + 4 * (bw + gap) + bw / 2, hypoX = x0 + 1 * (bw + gap) + bw / 2;
        s += '<path d="M' + concX + ' ' + (y - 2) + ' C ' + concX + ' 40, ' + hypoX + ' 40, ' + hypoX + ' ' + (y - 2) + '" fill="none" stroke="' + WARN + '" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#smrw)"/>';
        s += '<text x="150" y="48" text-anchor="middle" font-size="10" fill="' + WARN + '">結果不符 → 回頭修正假設，再試一次</text>';
        s += '<text x="150" y="140" text-anchor="middle" font-size="10.5" fill="currentColor">好奇 → 提出可檢驗的問題 → 猜答案（假設）→ 做實驗。</text>';
        s += '<text x="150" y="158" text-anchor="middle" font-size="10.5" fill="currentColor">看資料結果 → 下結論；不合就修正假設，不是改資料。</text>';
        s += '<text x="150" y="178" text-anchor="middle" font-size="10" fill="' + MUT + '">能依證據修正，正是科學進步的方式。</text>';
        s += '<defs>' +
            '<marker id="smr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + SU + '"/></marker>' +
            '<marker id="smrw" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + WARN + '"/></marker>' +
            '</defs>';
        return s + '</svg>';
    }
    // L1 teach2：假設＝可被檢驗、可能被推翻的猜測；實驗結果符合→暫時支持、不符→修正。
    function hypoTest() {
        return '<svg viewBox="0 0 300 196" role="img" aria-label="假設是對問題答案的猜測，而且必須可以被實驗檢驗、可能被推翻。做實驗後：結果符合就暫時支持這個假設，結果不符就要修正假設，不能假裝沒看到，也不能竄改資料">' +
            '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">假設：可被檢驗、可能被推翻的猜測</text>' +
            '<rect x="60" y="26" width="180" height="38" rx="10" fill="' + SU + '" opacity="0.12"/>' +
            '<rect x="60" y="26" width="180" height="38" rx="10" fill="none" stroke="' + SU + '" stroke-width="1.5"/>' +
            '<text x="150" y="42" text-anchor="middle" font-size="10" fill="' + MUT + '">假設（例）</text>' +
            '<text x="150" y="57" text-anchor="middle" font-size="11" fill="currentColor">多曬太陽，植物會長得比較高</text>' +
            '<path d="M150 66 L150 86" stroke="' + SU + '" stroke-width="2" marker-end="url(#htr)"/>' +
            '<text x="150" y="80" text-anchor="middle" font-size="9.5" fill="' + MUT + '">用實驗檢驗</text>' +
            '<rect x="22" y="92" width="120" height="58" rx="10" fill="' + OK + '" opacity="0.1"/>' +
            '<rect x="22" y="92" width="120" height="58" rx="10" fill="none" stroke="' + OK + '" stroke-width="1.5"/>' +
            '<text x="82" y="110" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + OK + '">結果符合</text>' +
            '<text x="82" y="128" text-anchor="middle" font-size="10" fill="currentColor">暫時支持假設</text>' +
            '<text x="82" y="143" text-anchor="middle" font-size="9.5" fill="' + MUT + '">（仍可能被新證據推翻）</text>' +
            '<rect x="158" y="92" width="120" height="58" rx="10" fill="' + WARN + '" opacity="0.1"/>' +
            '<rect x="158" y="92" width="120" height="58" rx="10" fill="none" stroke="' + WARN + '" stroke-width="1.5"/>' +
            '<text x="218" y="110" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + WARN + '">結果不符</text>' +
            '<text x="218" y="128" text-anchor="middle" font-size="10" fill="currentColor">修正假設、再試</text>' +
            '<text x="218" y="143" text-anchor="middle" font-size="9.5" fill="' + MUT + '">（不是改資料）</text>' +
            '<text x="150" y="172" text-anchor="middle" font-size="10.5" fill="currentColor">不能被檢驗的猜測（例如「因為運氣」）就不是科學假設。</text>' +
            '<text x="150" y="189" text-anchor="middle" font-size="10" fill="' + MUT + '">好的假設要能被實驗驗證，也要容許「可能是錯的」。</text>' +
            '<defs><marker id="htr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + SU + '"/></marker></defs>' +
            '</svg>';
    }
    // L1 teach3：誠實的科學 vs 竄改資料。不符就修正假設（誠實）；改資料／挑好看的（不誠實，禁）。
    function selfCorrect() {
        return '<svg viewBox="0 0 300 190" role="img" aria-label="當實驗結果和假設不合時：誠實的做法是修正假設、再做一次實驗，這是科學自我修正的精神；不誠實的做法是竄改資料或只挑好看的數字，這會讓結論變假，是絕對不可以的">' +
            '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">結果不符時，誠實面對</text>' +
            '<rect x="18" y="28" width="128" height="104" rx="11" fill="' + OK + '" opacity="0.09"/>' +
            '<rect x="18" y="28" width="128" height="104" rx="11" fill="none" stroke="' + OK + '" stroke-width="1.5"/>' +
            '<text x="82" y="47" text-anchor="middle" font-size="20">✅</text>' +
            '<text x="82" y="70" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + OK + '">誠實：修正假設</text>' +
            '<text x="82" y="90" text-anchor="middle" font-size="10" fill="currentColor">依證據改想法，</text>' +
            '<text x="82" y="105" text-anchor="middle" font-size="10" fill="currentColor">再做一次實驗</text>' +
            '<text x="82" y="123" text-anchor="middle" font-size="9.5" fill="' + MUT + '">＝科學進步的方式</text>' +
            '<rect x="154" y="28" width="128" height="104" rx="11" fill="' + WARN + '" opacity="0.09"/>' +
            '<rect x="154" y="28" width="128" height="104" rx="11" fill="none" stroke="' + WARN + '" stroke-width="1.5"/>' +
            '<text x="218" y="47" text-anchor="middle" font-size="20">🚫</text>' +
            '<text x="218" y="70" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + WARN + '">竄改資料</text>' +
            '<text x="218" y="90" text-anchor="middle" font-size="10" fill="currentColor">改數字、只挑</text>' +
            '<text x="218" y="105" text-anchor="middle" font-size="10" fill="currentColor">好看的那幾筆</text>' +
            '<text x="218" y="123" text-anchor="middle" font-size="9.5" fill="' + WARN + '">＝絕對不可以</text>' +
            '<text x="150" y="156" text-anchor="middle" font-size="10.5" fill="currentColor">資料是誠實記錄下來的事實，不能為了「好看」去改它。</text>' +
            '<text x="150" y="178" text-anchor="middle" font-size="10" fill="' + MUT + '">假設可以修正，資料不能造假——這是科學的誠信。</text>' +
            '</svg>';
    }
    // L2 teach2：三種變因的定義（操縱＝故意改、控制＝保持相同、應變＝量到的結果）＋口訣。
    function varDefs() {
        return '<svg viewBox="0 0 300 200" role="img" aria-label="實驗裡有三種變因：操縱變因是我們故意改變的那一個條件；控制變因是其他要保持相同的條件；應變變因是我們量測、受影響的結果。口訣是只改一個、其他不變、看結果">' +
            '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">三種變因，別搞混</text>' +
            '<rect x="14" y="26" width="272" height="40" rx="10" fill="' + SU + '" opacity="0.14"/>' +
            '<rect x="14" y="26" width="272" height="40" rx="10" fill="none" stroke="' + SU + '" stroke-width="1.6"/>' +
            '<text x="26" y="43" font-size="11.5" font-weight="800" fill="' + SU + '">操縱變因</text>' +
            '<text x="26" y="59" font-size="10.5" fill="currentColor">＝我們<tspan font-weight="700">故意改變</tspan>的那<tspan font-weight="700">一個</tspan>條件（例：光照）</text>' +
            '<rect x="14" y="72" width="272" height="40" rx="10" fill="' + MUT + '" opacity="0.12"/>' +
            '<rect x="14" y="72" width="272" height="40" rx="10" fill="none" stroke="' + MUT + '" stroke-width="1.6"/>' +
            '<text x="26" y="89" font-size="11.5" font-weight="800" fill="' + MUT + '">控制變因</text>' +
            '<text x="26" y="105" font-size="10.5" fill="currentColor">＝其他要<tspan font-weight="700">保持相同</tspan>的條件（例：水、土、品種）</text>' +
            '<rect x="14" y="118" width="272" height="40" rx="10" fill="' + AMBER + '" opacity="0.14"/>' +
            '<rect x="14" y="118" width="272" height="40" rx="10" fill="none" stroke="' + AMBER + '" stroke-width="1.6"/>' +
            '<text x="26" y="135" font-size="11.5" font-weight="800" fill="' + AMBER + '">應變變因</text>' +
            '<text x="26" y="151" font-size="10.5" fill="currentColor">＝我們<tspan font-weight="700">量測、受影響</tspan>的<tspan font-weight="700">結果</tspan>（例：長高幾公分）</text>' +
            '<text x="150" y="178" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + SU + '">口訣：只改一個 · 其他不變 · 看結果</text>' +
            '<text x="150" y="194" text-anchor="middle" font-size="10" fill="' + MUT + '">「操縱」是我們改的，「控制」是保持相同的，別弄反。</text>' +
            '</svg>';
    }
    // L3 teach3：對照組（什麼都不改的基準）＋ 樣本要夠多、可重複才可信。
    function controlGroup() {
        var s = '<svg viewBox="0 0 300 192" role="img" aria-label="公平測試還要加對照組，就是什麼都不改的那一組，當作比較的基準。而且樣本要夠多、實驗能重複做出同樣結果，結論才可信，不能只做一次就下定論">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">再加兩個保險：對照組 ＋ 可重複</text>';
        // 對照組 vs 實驗組
        s += '<rect x="18" y="28" width="120" height="60" rx="10" fill="' + MUT + '" opacity="0.1"/>';
        s += '<rect x="18" y="28" width="120" height="60" rx="10" fill="none" stroke="' + MUT + '" stroke-width="1.5"/>';
        s += '<text x="78" y="46" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + MUT + '">對照組</text>';
        s += '<text x="78" y="64" text-anchor="middle" font-size="10" fill="currentColor">什麼都不改</text>';
        s += '<text x="78" y="79" text-anchor="middle" font-size="9.5" fill="' + MUT + '">當比較的基準</text>';
        s += '<rect x="162" y="28" width="120" height="60" rx="10" fill="' + SU + '" opacity="0.12"/>';
        s += '<rect x="162" y="28" width="120" height="60" rx="10" fill="none" stroke="' + SU + '" stroke-width="1.5"/>';
        s += '<text x="222" y="46" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + SU + '">實驗組</text>';
        s += '<text x="222" y="64" text-anchor="middle" font-size="10" fill="currentColor">只改一個變因</text>';
        s += '<text x="222" y="79" text-anchor="middle" font-size="9.5" fill="' + SU + '">和對照組比差異</text>';
        // 可重複：三次都一樣
        s += '<text x="150" y="110" text-anchor="middle" font-size="10.5" fill="currentColor">樣本要夠多、而且能重複做出同樣結果，才可信：</text>';
        var xs = [70, 150, 230];
        for (var i = 0; i < 3; i++) {
            s += '<circle cx="' + xs[i] + '" cy="134" r="12" fill="' + OK + '" opacity="0.14"/>';
            s += '<circle cx="' + xs[i] + '" cy="134" r="12" fill="none" stroke="' + OK + '" stroke-width="1.4"/>';
            s += '<text x="' + xs[i] + '" y="138" text-anchor="middle" font-size="12">✓</text>';
            s += '<text x="' + xs[i] + '" y="158" text-anchor="middle" font-size="9" fill="' + MUT + '">第' + (i + 1) + '次</text>';
        }
        s += '<text x="150" y="180" text-anchor="middle" font-size="10" fill="' + MUT + '">只做一次就下定論，可能只是剛好、不夠可信。</text>';
        return s + '</svg>';
    }
    // L4 teach1：同一長度量三次略有差異 → 取平均較可靠（誤差）。
    function repeatAvg() {
        var s = '<svg viewBox="0 0 300 190" role="img" aria-label="量同一段長度三次，可能得到20.1、19.9、20.0公分，略有不同，這叫測量誤差。把三次取平均得到20.0公分，比只量一次更可靠，因為可以減少隨機誤差的影響">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">量測有誤差：多量幾次取平均</text>';
        s += '<text x="150" y="36" text-anchor="middle" font-size="10.5" fill="currentColor">同一段長度量三次，結果會略有不同：</text>';
        var vals = ['20.1', '19.9', '20.0'];
        for (var i = 0; i < 3; i++) {
            var x = 30 + i * 85;
            s += '<rect x="' + x + '" y="48" width="68" height="40" rx="9" fill="' + SU + '" opacity="0.1"/>';
            s += '<rect x="' + x + '" y="48" width="68" height="40" rx="9" fill="none" stroke="' + SU + '" stroke-width="1.4"/>';
            s += '<text x="' + (x + 34) + '" y="64" text-anchor="middle" font-size="9" fill="' + MUT + '">第' + (i + 1) + '次</text>';
            s += '<text x="' + (x + 34) + '" y="80" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">' + vals[i] + '</text>';
        }
        s += '<path d="M150 90 L150 110" stroke="' + AMBER + '" stroke-width="2" marker-end="url(#rar)"/>';
        s += '<text x="196" y="104" text-anchor="middle" font-size="9.5" fill="' + MUT + '">取平均</text>';
        s += '<rect x="96" y="114" width="108" height="40" rx="10" fill="' + AMBER + '" opacity="0.14"/>';
        s += '<rect x="96" y="114" width="108" height="40" rx="10" fill="none" stroke="' + AMBER + '" stroke-width="1.6"/>';
        s += '<text x="150" y="131" text-anchor="middle" font-size="9.5" fill="' + MUT + '">平均值（較可靠）</text>';
        s += '<text x="150" y="147" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">20.0 公分</text>';
        s += '<text x="150" y="174" text-anchor="middle" font-size="10" fill="' + MUT + '">重複取平均能減少隨機誤差；單位（公分）要寫清楚。</text>';
        s += '<defs><marker id="rar" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + AMBER + '"/></marker></defs>';
        return s + '</svg>';
    }
    // L4 teach2：觀察（看到的事實）vs 推論（我的解釋）雙欄對照。
    function obsVsInfer() {
        return '<svg viewBox="0 0 300 190" role="img" aria-label="觀察是我們直接看到、量到的事實，例如葉子是綠色的、地上是濕的；推論是我們加上去的解釋或原因，例如葉子綠是因為有葉綠素、地上濕是因為剛下過雨。做科學要分清楚哪些是觀察、哪些是推論">' +
            '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">分清楚：觀察 vs 推論</text>' +
            '<rect x="14" y="26" width="134" height="130" rx="11" fill="' + SU + '" opacity="0.09"/>' +
            '<rect x="14" y="26" width="134" height="130" rx="11" fill="none" stroke="' + SU + '" stroke-width="1.5"/>' +
            '<text x="81" y="44" text-anchor="middle" font-size="11" font-weight="800" fill="' + SU + '">觀察（事實）</text>' +
            '<text x="81" y="60" text-anchor="middle" font-size="9" fill="' + MUT + '">直接看到、量到的</text>' +
            '<text x="81" y="84" text-anchor="middle" font-size="10" fill="currentColor">葉子是綠色的</text>' +
            '<text x="81" y="104" text-anchor="middle" font-size="10" fill="currentColor">地上是濕的</text>' +
            '<text x="81" y="124" text-anchor="middle" font-size="10" fill="currentColor">量到 20 公分</text>' +
            '<text x="81" y="146" text-anchor="middle" font-size="9" fill="' + SU + '">大家量都一樣</text>' +
            '<rect x="152" y="26" width="134" height="130" rx="11" fill="' + AMBER + '" opacity="0.1"/>' +
            '<rect x="152" y="26" width="134" height="130" rx="11" fill="none" stroke="' + AMBER + '" stroke-width="1.5"/>' +
            '<text x="219" y="44" text-anchor="middle" font-size="11" font-weight="800" fill="' + AMBER + '">推論（解釋）</text>' +
            '<text x="219" y="60" text-anchor="middle" font-size="9" fill="' + MUT + '">加上原因的想法</text>' +
            '<text x="219" y="80" text-anchor="middle" font-size="9.5" fill="currentColor">綠是因為有葉綠素</text>' +
            '<text x="219" y="100" text-anchor="middle" font-size="9.5" fill="currentColor">濕是因為剛下雨</text>' +
            '<text x="219" y="120" text-anchor="middle" font-size="9.5" fill="currentColor">它應該長得很快</text>' +
            '<text x="219" y="146" text-anchor="middle" font-size="9" fill="' + AMBER + '">可能對、也可能錯</text>' +
            '<text x="150" y="178" text-anchor="middle" font-size="10" fill="' + MUT + '">推論要靠觀察支持；別把「我的解釋」當成「看到的事實」。</text>' +
            '</svg>';
    }
    // L2 teach3：把「植物曬光」實驗對號入座——指出哪個是操縱、控制、應變變因。
    function plantVarMap() {
        var s = '<svg viewBox="0 0 300 200" role="img" aria-label="把植物曬光實驗對號入座：操縱變因是光照，也就是我們只改的那一個；控制變因是水、土、品種，兩盆都保持相同；應變變因是量到的長高幾公分，也就是受影響的結果">';
        s += '<text x="150" y="15" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">對號入座：植物曬光實驗</text>';
        // A 盆（強光、長得高） vs B 盆（弱光、長得矮）
        function pot(x, stemH, strong, name) {
            var r = '';
            // 太陽（強＝大亮、弱＝小暗）
            r += '<circle cx="' + (x) + '" cy="34" r="' + (strong ? 8 : 5) + '" fill="' + AMBER + '" opacity="' + (strong ? 0.95 : 0.4) + '"/>';
            // 莖
            r += '<rect x="' + (x - 2) + '" y="' + (92 - stemH) + '" width="4" height="' + stemH + '" fill="' + OK + '"/>';
            r += '<circle cx="' + x + '" cy="' + (92 - stemH) + '" r="6" fill="' + OK + '" opacity="0.8"/>';
            // 盆
            r += '<path d="M' + (x - 14) + ' 92 L' + (x + 14) + ' 92 L' + (x + 10) + ' 108 L' + (x - 10) + ' 108 Z" fill="' + MUT + '" opacity="0.5"/>';
            r += '<text x="' + x + '" y="122" text-anchor="middle" font-size="10" fill="currentColor">' + name + '</text>';
            return r;
        }
        s += pot(108, 42, true, 'A：強光');
        s += pot(192, 22, false, 'B：弱光');
        // 三個對號標籤
        s += '<rect x="14" y="130" width="272" height="20" rx="6" fill="' + SU + '" opacity="0.14"/>';
        s += '<text x="22" y="144" font-size="10.5" fill="' + SU + '" font-weight="700">操縱變因：</text><text x="104" y="144" font-size="10.5" fill="currentColor">光照（只改這一個）</text>';
        s += '<rect x="14" y="152" width="272" height="20" rx="6" fill="' + MUT + '" opacity="0.14"/>';
        s += '<text x="22" y="166" font-size="10.5" fill="' + MUT + '" font-weight="700">控制變因：</text><text x="104" y="166" font-size="10.5" fill="currentColor">水、土、品種（都一樣）</text>';
        s += '<rect x="14" y="174" width="272" height="20" rx="6" fill="' + AMBER + '" opacity="0.14"/>';
        s += '<text x="22" y="188" font-size="10.5" fill="' + AMBER + '" font-weight="700">應變變因：</text><text x="104" y="188" font-size="10.5" fill="currentColor">長高幾公分（量到的結果）</text>';
        return s + '</svg>';
    }
    // L4 teach3：誠實記錄——全部記下（含怪怪的那筆）vs 只挑好看的（竄改／選擇性記錄）。
    function honestRecord() {
        var s = '<svg viewBox="0 0 300 190" role="img" aria-label="誠實記錄資料：正確的做法是把每一筆都記下來，包括看起來怪怪的那一筆，因為它可能是新發現的線索；錯誤的做法是只挑好看的、把不合的那筆刪掉，這是選擇性記錄，會讓結論失真">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">誠實記錄：不能只挑好看的</text>';
        // 左：全部記下
        s += '<rect x="18" y="28" width="128" height="104" rx="11" fill="' + OK + '" opacity="0.09"/>';
        s += '<rect x="18" y="28" width="128" height="104" rx="11" fill="none" stroke="' + OK + '" stroke-width="1.5"/>';
        s += '<text x="82" y="46" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + OK + '">✅ 全部記下</text>';
        var dys = [66, 66, 66, 66, 98];
        var dxs = [40, 60, 80, 100, 120];
        for (var i = 0; i < 5; i++) {
            s += '<circle cx="' + dxs[i] + '" cy="' + dys[i] + '" r="5" fill="' + OK + '"/>';
        }
        s += '<text x="82" y="118" text-anchor="middle" font-size="9" fill="' + MUT + '">連怪怪的那筆也留</text>';
        // 右：只挑好看
        s += '<rect x="154" y="28" width="128" height="104" rx="11" fill="' + WARN + '" opacity="0.09"/>';
        s += '<rect x="154" y="28" width="128" height="104" rx="11" fill="none" stroke="' + WARN + '" stroke-width="1.5"/>';
        s += '<text x="218" y="46" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + WARN + '">🚫 只挑好看</text>';
        var rdxs = [176, 196, 216, 236];
        for (var j = 0; j < 4; j++) {
            s += '<circle cx="' + rdxs[j] + '" cy="66" r="5" fill="' + OK + '"/>';
        }
        // 被刪掉的那筆（叉叉）
        s += '<circle cx="256" cy="98" r="5" fill="none" stroke="' + WARN + '" stroke-width="1.3"/>';
        s += '<path d="M252 94 L260 102 M260 94 L252 102" stroke="' + WARN + '" stroke-width="1.4"/>';
        s += '<text x="218" y="118" text-anchor="middle" font-size="9" fill="' + WARN + '">偷偷刪掉不合的</text>';
        s += '<text x="150" y="152" text-anchor="middle" font-size="10.5" fill="currentColor">怪怪的資料常常是新發現的線索，不能偷偷刪掉。</text>';
        s += '<text x="150" y="172" text-anchor="middle" font-size="10" fill="' + MUT + '">只挑好看的＝選擇性記錄，會讓結論失真，不誠實。</text>';
        return s + '</svg>';
    }
    window.CONCEPT = {
        progKey: 'science_method_concepts_v1', practiceHref: 'detective.html',
        lessons: [
            {
                id: 'sm_steps', name: '科學方法的步驟', emoji: '🔎', color: SU,
                sub: '問題→假設→實驗→資料→結論，不合就修正',
                done: '記住：好奇→提出可檢驗的「問題」→猜答案（假設）→設計「實驗」→收集「資料」→下「結論」；結果不合就修正假設、再試一次。假設可以修正，資料不能造假。',
                steps: [
                    {
                        type: 'teach', kicker: '先看圖', title: '科學方法：五個步驟會自我修正',
                        svg: flowRing(),
                        text: '科學家解開問題，大致走這五步：①好奇後，提出一個<b>可以檢驗的「問題」</b>；②對答案的猜測＝<b>「假設」</b>；③設計<b>「實驗」</b>來驗證；④收集<b>「資料」</b>、看結果；⑤下<b>「結論」</b>。重點在最後：如果結果和假設<b>不合</b>，就<b>回頭修正假設</b>、再試一次——這就是<b>科學會自我修正</b>的精神。'
                    },
                    {
                        type: 'teach', kicker: '什麼是假設', title: '假設＝可被檢驗、可能被推翻的猜測',
                        svg: hypoTest(),
                        text: '<b>假設</b>不是「隨便亂猜」，而是對問題答案的猜測，而且必須<b>能被實驗檢驗</b>、也<b>可能被推翻</b>。例如「多曬太陽，植物會長得比較高」就能用實驗檢驗。做完實驗：結果<b>符合</b>就<b>暫時支持</b>這個假設（仍可能被新證據推翻）；結果<b>不符</b>就<b>修正假設</b>——而不是改資料。像「因為運氣好」這種無法檢驗的說法，就不是科學假設。'
                    },
                    {
                        type: 'teach', kicker: '科學的誠信', title: '結果不符時，誠實面對',
                        svg: selfCorrect(),
                        text: '當結果和假設不合，<b>誠實</b>的做法是<b>修正假設、再做一次</b>——這正是科學進步的方式。<b>絕對不可以</b>的是<b>竄改資料</b>：改數字、或只挑「好看」的那幾筆。資料是誠實記錄下來的<b>事實</b>，不能為了讓結論漂亮去動它。一句話記住：<b>假設可以修正，資料不能造假。</b>'
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '科學上「假設」指的是？',
                        options: ['對問題答案的、可被實驗檢驗的猜測', '一定正確的事實', '隨便亂猜、不用驗證', '老師說的話'],
                        answer: 0,
                        why: '假設是可檢驗、可能被推翻的暫時解釋，要靠實驗驗證。',
                        whyWrong: { 1: '假設還沒被驗證，不是「一定正確的事實」；它可能被實驗推翻。', 2: '假設雖是猜測，但必須能被實驗檢驗，不是隨便亂猜、不用驗證。', 3: '科學看證據，不是看誰說的；老師的話一樣要用實驗檢驗。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '如果實驗結果和假設不合，科學家會？',
                        options: ['修正假設、再試', '把資料改掉', '假裝沒看到', '放棄科學'],
                        answer: 0,
                        why: '科學會依證據修正假設，這正是科學自我修正的精神（不能竄改資料）。',
                        whyWrong: { 1: '資料是誠實記錄的事實，竄改資料是造假，絕對不可以。', 2: '假裝沒看到不符的結果，等於忽略證據，不是科學的做法。', 3: '結果不符不是失敗，而是修正假設、繼續探究的機會，不必放棄。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '科學方法通常從哪一步開始？',
                        options: ['好奇，然後提出一個可檢驗的問題', '先寫好結論', '先把資料準備好', '先決定要得到什麼答案'],
                        answer: 0,
                        why: '科學方法從好奇、提出一個「可以用實驗檢驗」的問題開始，再往下猜假設、做實驗。',
                        whyWrong: { 1: '結論是最後依資料下的，不能一開始就先寫好、再去湊。', 2: '資料是做實驗後收集來的，不是一開始就先準備好。', 3: '先決定「想要的答案」會讓人只找支持的證據，這正是要避免的。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '下面哪一個是「可以被檢驗」的科學問題？',
                        options: ['多澆水會不會讓這種豆苗長得比較高？', '世界上最棒的顏色是哪一個？', '這幅畫美不美？', '哪一首歌最好聽？'],
                        answer: 0,
                        why: '「多澆水會不會讓豆苗長比較高」可以設計實驗、量結果來檢驗，是科學問題；美醜、好不好聽是個人喜好，無法用實驗判定對錯。',
                        whyWrong: { 1: '「最棒的顏色」是個人喜好，沒有能用實驗驗證的客觀答案。', 2: '美不美是主觀感受，不同人答案不同，無法用實驗檢驗。', 3: '好不好聽因人而異，是喜好不是可檢驗的事實。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '已經下了結論之後，又出現可靠的新證據和它不合，該怎麼辦？',
                        options: ['依新證據修正想法，這很正常', '堅持原結論、不理新證據', '把新證據藏起來', '因為被推翻就說科學沒用'],
                        answer: 0,
                        why: '科學結論會隨可靠的新證據修正，這不是缺點，正是科學不斷進步的方式。',
                        whyWrong: { 1: '無視可靠的新證據、硬守舊結論，不是科學態度。', 2: '藏起不利的證據是不誠實，科學要面對所有證據。', 3: '能被新證據修正正是科學的優點，不代表科學沒用。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '科學方法裡做「實驗」這一步，主要是為了？',
                        options: ['檢驗假設對不對，取得證據', '證明自己一開始就一定對', '讓報告看起來比較厲害', '走個形式，其實跳過也沒差'],
                        answer: 0,
                        why: '實驗是用來檢驗假設是否成立的——結果可能支持假設，也可能推翻它，重點是取得證據。',
                        whyWrong: { 1: '實驗不是為了「證明自己對」，而是誠實檢驗，結果可能推翻原本的假設。', 2: '實驗是為了取得證據，不是為了讓報告好看。', 3: '沒有實驗就沒有證據，結論會變成空口說，不能跳過。' }
                    }
                ]
            },
            {
                id: 'sm_variables', name: '變因：操縱、控制、應變', emoji: '🎛️', color: SU,
                sub: '操縱＝故意改的、控制＝保持相同、應變＝量到的結果',
                done: '記住：操縱變因＝我們故意改的那一個；控制變因＝其他要保持相同的；應變變因＝量到的結果。口訣：只改一個、其他不變、看結果。',
                steps: [
                    {
                        type: 'teach', kicker: '先來辦案', title: '找兇手：只有「光照」還在嫌疑中',
                        svg: animCanvas(300, 240, '找兇手推理動畫：A 盆和 B 盆兩盆植物長得不一樣。把每個條件當成嫌疑犯——水量、土壤、品種兩盆都一樣，有不在場證明，被劃掉排除；只剩光照一個條件不一樣（強光對弱光），還在嫌疑中。因為只剩這一個嫌疑犯，就能破案，確定兩盆長高的差異是光照造成的。這個我們故意改的條件就是操縱變因。可以點任一列切換一樣或不一樣，看判決怎麼變'),
                        mount: function (host) { var h = window.Anim.fairTest(host, { mode: 'fair', suspects: [{ name: '光照', a: '強光', b: '弱光', diff: true }, { name: '水量', a: '一樣', b: '一樣' }, { name: '土壤', a: '一樣', b: '一樣' }, { name: '品種', a: '一樣', b: '一樣' }], measure: '長高', values: [12, 6], groups: ['A 盆', 'B 盆'] }); return function () { h.stop(); }; },
                        text: '把實驗當成<b>辦案</b>：兩盆植物 A、B 長得不一樣，誰是「兇手」？每個<b>條件</b>都是一個<b>嫌疑犯</b>。<b>水量、土壤、品種</b>兩盆<b>都一樣</b>——有「不在場證明」，<b>劃掉排除</b>。最後只剩<b>光照</b>一個條件<b>不一樣</b>，還在嫌疑中——<b>破案</b>！兩盆的差異一定是光照造成的。這個我們<b>故意改的嫌疑犯</b>就是<b>操縱變因</b>；<b>保持相同、被排除</b>的那些是<b>控制變因</b>；量到的<b>長高</b>就是<b>應變變因</b>。（可以點各列切換「一樣／不一樣」，看判決怎麼變。）'
                    },
                    {
                        type: 'teach', kicker: '三種變因', title: '操縱、控制、應變，別搞混',
                        svg: varDefs(),
                        text: '<b>操縱變因</b>＝我們<b>故意改變</b>的那<b>一個</b>條件（上例是光照）。<b>控制變因</b>＝其他要<b>保持相同</b>的條件（水、土、品種）。<b>應變變因</b>＝我們<b>量測、受影響</b>的<b>結果</b>（長高幾公分）。最容易弄反的是前兩個：<b>「操縱」是我們改的、「控制」是保持相同的</b>。記住口訣：<b>只改一個 · 其他不變 · 看結果</b>。'
                    },
                    {
                        type: 'teach', kicker: '對號入座', title: '把植物實驗的三種變因找出來',
                        svg: plantVarMap(),
                        text: '回到植物曬光的實驗，把三種變因<b>對號入座</b>：我們<b>只改「光照」</b>（A 盆強光、B 盆弱光），它就是<b>操縱變因</b>；<b>水、土、品種</b>兩盆<b>都一樣</b>，是<b>控制變因</b>；最後量到的<b>長高幾公分</b>，是我們受影響、要量的<b>應變變因</b>。練習把任何一個實驗這樣拆開，就不會把三種變因搞混了。'
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '實驗中「操縱變因」是指？',
                        options: ['我們故意改變的那一個條件', '保持不變的條件', '最後量到的結果', '不重要的東西'],
                        answer: 0,
                        why: '操縱變因是研究者刻意改變、想探討影響的那一個因素。',
                        whyWrong: { 1: '保持不變的是「控制變因」，不是操縱變因，別弄反。', 2: '最後量到的結果是「應變變因」，不是操縱變因。', 3: '每個變因都有意義；操縱變因正是實驗想探討的重點，不是不重要。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '測量到的「結果」（例如植物長高幾公分）叫做？',
                        options: ['應變變因', '操縱變因', '控制變因', '無關變因'],
                        answer: 0,
                        why: '應變變因是隨操縱變因改變而被量測的結果。',
                        whyWrong: { 1: '操縱變因是我們「故意改」的那一個，不是量到的結果。', 2: '控制變因是「保持相同」的條件，不是量到的結果。', 3: '長高是這個實驗要量的核心結果，不是無關的東西。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '植物實驗裡「水、土、品種都保持一樣」，這些是哪種變因？',
                        options: ['控制變因', '操縱變因', '應變變因', '它們沒有名字'],
                        answer: 0,
                        why: '要保持相同的其他條件就是控制變因，這樣差異才能歸因於唯一被改變的操縱變因。',
                        whyWrong: { 1: '操縱變因是「故意改」的那一個（這裡是光照），不是保持相同的這些。', 2: '應變變因是量到的結果（長高），不是保持相同的條件。', 3: '它們有名字，就叫控制變因，是公平測試的關鍵。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '想研究「水溫高低會不會影響糖溶解的快慢」，操縱變因應該是？',
                        options: ['水溫（我們故意調高或調低的那一個）', '糖溶解的快慢', '水的多少（要保持相同）', '攪拌的次數（要保持相同）'],
                        answer: 0,
                        why: '問題想探討「水溫」的影響，所以水溫是我們故意改變的操縱變因。',
                        whyWrong: { 1: '糖溶解的快慢是量到的結果，屬於應變變因，不是操縱變因。', 2: '水的多少要保持相同，是控制變因，不是我們故意改的那一個。', 3: '攪拌次數要保持相同，是控制變因，不是操縱變因。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '同一個實驗裡，「操縱變因」通常有幾個？',
                        options: ['一個（一次只改一個才公平）', '越多越好', '至少三個', '零個，什麼都不改'],
                        answer: 0,
                        why: '一次只改一個操縱變因，其他保持相同，才能確定差異是這個變因造成的——這就是公平測試。',
                        whyWrong: { 1: '同時改很多個，就分不清差異是誰造成的，反而不公平。', 2: '不是改越多越好；改太多個就無法歸因。', 3: '什麼都不改就沒有在測試任何因素了；要剛好改一個。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '做公平測試時，「控制變因」（例如水、土）應該怎麼處理？',
                        options: ['兩組都保持完全相同', '每組給不一樣的量', '故意讓它們差很多', '不用管，隨便就好'],
                        answer: 0,
                        why: '控制變因就是要在各組之間保持完全相同，這樣差異才能歸因於唯一被改變的操縱變因。',
                        whyWrong: { 1: '控制變因若各組不同，就等於多改了變因，結果無法歸因，不公平。', 2: '故意讓控制變因差很多，會干擾結果，分不清是誰造成的。', 3: '控制變因很關鍵，不能隨便；沒控制好整個實驗就不公平。' }
                    }
                ]
            },
            {
                id: 'sm_fairtest', name: '公平測試：一次只改一個', emoji: '⚖️', color: SU,
                sub: '只改一個變因＋對照組＋可重複，才公平可信',
                done: '記住：公平測試＝一次只改一個變因、其他全部相同；同時改兩個就分不清是誰造成的。再加對照組當基準、樣本夠多可重複，結論才可信。',
                steps: [
                    {
                        type: 'teach', kicker: '先來辦案', title: '公平：只剩「肥料」一個嫌疑犯 → 破案',
                        svg: animCanvas(300, 240, '找兇手推理動畫（公平版）：A 盆和 B 盆兩盆植物長得不一樣。把每個條件當成嫌疑犯——陽光、水量、品種兩盆都一樣，有不在場證明被劃掉排除；只剩肥料一個條件不一樣（甲肥料對乙肥料），還在嫌疑中。只剩一個嫌疑犯就能破案，確定兩盆長高的差異是肥料造成的，這就是公平測試。可以點任一列切換一樣或不一樣，看判決怎麼變'),
                        mount: function (host) { var h = window.Anim.fairTest(host, { mode: 'fair', suspects: [{ name: '肥料', a: '甲肥料', b: '乙肥料', diff: true }, { name: '陽光', a: '一樣', b: '一樣' }, { name: '水量', a: '一樣', b: '一樣' }, { name: '品種', a: '一樣', b: '一樣' }], measure: '長高', values: [11, 7], groups: ['A 盆', 'B 盆'] }); return function () { h.stop(); }; },
                        text: '要比較兩種<b>肥料</b>的效果，一樣用辦案的方式想：<b>陽光、水量、品種</b>兩盆都<b>一樣</b>——有不在場證明，<b>排除</b>。只剩<b>肥料</b>一個條件<b>不一樣</b>，是唯一的嫌疑犯——<b>破案</b>！兩盆的<b>長高</b>差異就能<b>確定是肥料</b>造成的。因為最後只留下<b>一個嫌疑犯</b>，這就是<b>公平測試：一次只改一個變因</b>。（可以點各列切換試試。）'
                    },
                    {
                        type: 'teach', kicker: '辦案出狀況', title: '不公平：兩個嫌疑犯，無法定罪',
                        svg: animCanvas(300, 240, '找兇手推理動畫（不公平版）：A 盆和 B 盆兩盆植物長得不一樣。這次同時有兩個條件不一樣——肥料（甲對乙）和澆水量（多對少），兩個都還在嫌疑中；陽光、品種則一樣被排除。因為剩下兩個嫌疑犯，無法判定是哪一個造成差異，所以無法定罪，這不是公平測試。要把其他條件都控制成一樣，剩一個嫌疑犯才能破案。可以點任一列切換一樣或不一樣，看判決怎麼變'),
                        mount: function (host) { var h = window.Anim.fairTest(host, { mode: 'unfair', suspects: [{ name: '肥料', a: '甲肥料', b: '乙肥料', diff: true }, { name: '澆水量', a: '多', b: '少', diff: true }, { name: '陽光', a: '一樣', b: '一樣' }, { name: '品種', a: '一樣', b: '一樣' }], measure: '長高', values: [13, 7], groups: ['A 盆', 'B 盆'] }); return function () { h.stop(); }; },
                        text: '這次不小心<b>同時改了兩個</b>條件：肥料<b>和</b>澆水量，兩個都還在<b>嫌疑中</b>。雖然兩盆長高不同，但我們<b>分不清</b>是肥料的功勞還是澆水量的功勞——<b>兩個嫌疑犯，無法定罪</b>！這就是為什麼要<b>控制變因</b>：把其他條件都改成<b>一樣</b>（排除它們），讓嫌疑犯<b>剩下一個</b>，才破得了案。你可以點「澆水量」那一列把它改回「一樣」，看判決怎麼從紅色變成破案。'
                    },
                    {
                        type: 'teach', kicker: '再加兩個保險', title: '對照組 ＋ 樣本夠多、可重複',
                        svg: controlGroup(),
                        text: '公平測試還能更可信：加一個<b>對照組</b>（什麼都不改的那一組）當<b>比較的基準</b>，再和只改一個變因的<b>實驗組</b>比。另外，<b>樣本要夠多</b>、而且實驗能<b>重複</b>做出同樣結果——只做一次就下定論，可能只是<b>剛好</b>，不夠可信。<b>一次只改一個＋對照組＋可重複</b>，結論才站得住腳。'
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '比較兩種肥料效果，為了公平，兩盆植物應該？',
                        options: ['除了肥料不同，陽光、水、土都一樣', '連肥料也一樣', '一盆放室內一盆放室外', '隨便就好'],
                        answer: 0,
                        why: '只改肥料這一個操縱變因、其餘控制變因相同，才能確定差異來自肥料。',
                        whyWrong: { 1: '連肥料也一樣，就沒有在比較兩種肥料了，實驗沒有意義。', 2: '一盆室內一盆室外，等於又多改了陽光等變因，無法歸因給肥料。', 3: '「隨便」會讓很多變因一起改，結果無法判斷是誰造成的。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '如果同時改了「肥料」又改了「澆水量」，結果不同時我們會？',
                        options: ['無法判斷是哪個造成的', '一定是肥料', '一定是水', '兩個都沒影響'],
                        answer: 0,
                        why: '兩個變因同時改，差異無法歸因於其中任何一個，不是公平測試。',
                        whyWrong: { 1: '兩個一起改時，不能直接說「一定是肥料」，澆水量也可能有影響。', 2: '同理也不能直接說「一定是水」，肥料也可能有影響。', 3: '結果有差異，表示至少一個有影響，不能說兩個都沒影響。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '實驗裡的「對照組」是指？',
                        options: ['什麼都不改、當作比較基準的那一組', '改最多變因的那一組', '結果最漂亮的那一組', '隨便挑一組來比'],
                        answer: 0,
                        why: '對照組什麼都不改，當作基準；拿只改一個變因的實驗組和它比，才看得出改變帶來的差異。',
                        whyWrong: { 1: '對照組正好相反，是「什麼都不改」，不是改最多的那一組。', 2: '不能挑「結果好看」的當對照，那會造成偏誤。', 3: '對照組有明確定義（不改任何變因），不是隨便挑的。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '為什麼實驗最好多做幾次、樣本也要夠多？',
                        options: ['一次的結果可能只是剛好，重複做才可信', '只是為了讓報告看起來更長', '這樣就能隨便下任何結論', '多做幾次能讓結果一定變成我想要的'],
                        answer: 0,
                        why: '只做一次可能剛好遇到巧合或誤差，樣本夠多、能重複得到同樣結果，結論才可靠。',
                        whyWrong: { 1: '重複做是為了可信度，不是為了把報告寫長。', 2: '重複實驗是為了更嚴謹，不是讓人可以隨便亂下結論。', 3: '重複做不是為了「湊出想要的答案」，那又變成不誠實了。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '想測試「哪一種紙飛機飛得遠」，下面哪個設計最公平？',
                        options: ['兩種只有摺法不同，用同樣的紙、同樣的力氣、同一個地點丟', '一種用厚紙、一種用薄紙，摺法也不一樣', '一種在室內丟、一種在室外有風時丟', '每次用不同的力氣亂丟就好'],
                        answer: 0,
                        why: '只改「摺法」這一個操縱變因，紙張、力氣、地點等控制變因都保持相同，才公平、才能確定差異來自摺法。',
                        whyWrong: { 1: '同時改了紙的厚薄又改摺法，兩個變因一起變，無法歸因。', 2: '室內和室外（有風）等於又改了環境變因，不公平。', 3: '力氣每次都不同會干擾結果，控制變因沒控制好就不公平。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '只用一株植物、只做一次就說「這種肥料最好」，問題在哪？',
                        options: ['樣本太少、沒重複，可能只是剛好', '完全沒問題，一次就夠', '植物太多才有問題', '只要結果好看就可以了'],
                        answer: 0,
                        why: '一株、一次的結果可能只是巧合或誤差；要多幾株、能重複得到同樣結果，結論才可信。',
                        whyWrong: { 1: '一次的結果可能是巧合，樣本太少不能就下定論。', 2: '植物多（樣本大）反而更可信，不是問題。', 3: '「結果好看」不是標準；重點是樣本夠多、可重複。' }
                    }
                ]
            },
            {
                id: 'sm_measure', name: '測量與誤差', emoji: '📏', color: SU,
                sub: '選對工具、重複取平均、誠實記錄、分清觀察與推論',
                done: '記住：工具選對、單位寫清楚；量測有誤差，多量幾次取平均較可靠；記錄要誠實；還要分清「觀察（看到的事實）」和「推論（我的解釋）」。',
                steps: [
                    {
                        type: 'teach', kicker: '先看圖', title: '量測有誤差：多量幾次取平均',
                        svg: repeatAvg(),
                        text: '量東西時，就算同一段長度，量三次也可能得到 <b>20.1、19.9、20.0</b> 公分——略有不同，這叫<b>測量誤差</b>。所以我們<b>多量幾次、取平均</b>（這裡是 20.0 公分），比只量一次<b>更可靠</b>，因為能<b>減少隨機誤差</b>的影響。還要記得：先<b>選對工具</b>（量長度用尺、量質量用秤），<b>單位</b>（公分、公克…）一定要<b>寫清楚</b>。'
                    },
                    {
                        type: 'teach', kicker: '記錄要誠實', title: '誠實記錄：不能只挑好看的',
                        svg: honestRecord(),
                        text: '記錄資料時，要<b>誠實記下每一筆</b>，包括看起來<b>怪怪的</b>那一筆——它可能剛好是<b>新發現的線索</b>，或提醒你實驗哪裡要再檢查。<b>不可以</b>的是<b>只挑好看的</b>、偷偷把不合的那筆<b>刪掉</b>（這叫<b>選擇性記錄</b>），那會讓結論<b>失真</b>。真的覺得某筆是量錯的，也要<b>註明原因</b>、而不是悄悄抹掉。'
                    },
                    {
                        type: 'teach', kicker: '分清兩件事', title: '觀察（事實）vs 推論（解釋）',
                        svg: obsVsInfer(),
                        text: '<b>觀察</b>是我們<b>直接看到、量到</b>的<b>事實</b>，像「葉子是綠色的」「地上是濕的」「量到 20 公分」——大家去看、去量都會得到一樣的結果。<b>推論</b>是我們<b>加上去的解釋或原因</b>，像「葉子綠是因為有<b>葉綠素</b>」「地上濕是因為<b>剛下過雨</b>」——這些可能對、也可能錯。做科學要<b>分清楚</b>：哪些是觀察、哪些是推論，別把「我的解釋」當成「看到的事實」。'
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '為了讓測量更可靠，通常會？',
                        options: ['多量幾次取平均', '只量一次就好', '挑最大的那次', '用猜的'],
                        answer: 0,
                        why: '重複測量取平均可減少隨機誤差的影響。',
                        whyWrong: { 1: '只量一次容易受誤差影響，不夠可靠。', 2: '挑最大的那次是選擇性取樣，會讓結果偏掉，不誠實也不準。', 3: '用猜的不是測量，得不到可靠的資料。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '「葉子是綠色的」和「葉子綠色是因為有葉綠素」，後者屬於？',
                        options: ['推論（解釋）', '觀察（事實）', '假設的工具', '控制變因'],
                        answer: 0,
                        why: '直接看到的是觀察；加上原因解釋就是推論。',
                        whyWrong: { 1: '觀察是直接看到的事實（葉子是綠的）；「因為有葉綠素」是加上去的原因，屬於推論。', 2: '這和工具無關，是在區分觀察與推論。', 3: '控制變因是實驗裡保持相同的條件，和這題的觀察／推論無關。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '下面哪一句是「觀察」（直接看到、量到的事實）？',
                        options: ['溫度計顯示 25 度', '它今天看起來心情不好', '明天應該會更熱', '這杯水大概壞掉了'],
                        answer: 0,
                        why: '「溫度計顯示 25 度」是直接量到的事實，大家來量都一樣，屬於觀察；其他都是加了猜測或解釋的推論。',
                        whyWrong: { 1: '「心情不好」是對表情的解釋、還是對物品的擬人想像，屬於推論不是觀察。', 2: '「明天會更熱」是對未來的預測，不是現在直接看到的事實。', 3: '「大概壞掉了」是推測，要有觀察或檢驗才能確定，屬於推論。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '記錄實驗資料時，正確的態度是？',
                        options: ['誠實記下每一筆，包括和預期不合的', '只記下符合預期的那幾筆', '把奇怪的數字偷偷改掉', '覺得哪個好看就寫哪個'],
                        answer: 0,
                        why: '資料要誠實完整地記錄，包括和預期不合的；這些「不合」的資料常常才是修正假設、發現新東西的線索。',
                        whyWrong: { 1: '只記符合預期的（選擇性記錄）會讓結論偏掉，是不誠實的做法。', 2: '偷偷改數字就是竄改資料，絕對不可以。', 3: '挑「好看的」來寫，等於造假，不是科學態度。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '要量一枝鉛筆有多長，最適合用的工具和單位是？',
                        options: ['直尺，單位用公分', '體重計，單位用公斤', '溫度計，單位用度', '量杯，單位用毫升'],
                        answer: 0,
                        why: '量「長度」要用直尺，單位用公分；選對工具、寫清楚單位，測量才有意義。',
                        whyWrong: { 1: '體重計量的是質量（公斤），不是長度。', 2: '溫度計量的是溫度（度），不能拿來量長度。', 3: '量杯量的是液體體積（毫升），不是鉛筆的長度。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '下面哪一句比較接近「觀察」（而不是推論）？',
                        options: ['這杯水量到 50 毫升', '這杯水大概不夠喝', '這杯水應該是昨天裝的', '這杯水看起來不太新鮮'],
                        answer: 0,
                        why: '「量到 50 毫升」是直接量到的事實，大家來量都一樣，屬於觀察；其他都加了猜測或評價，屬於推論。',
                        whyWrong: { 1: '「不夠喝」是帶有判斷的猜測，不是直接量到的事實。', 2: '「昨天裝的」是對來源的推測，不是現在觀察到的。', 3: '「不太新鮮」是主觀評價與推論，不是客觀觀察。' }
                    }
                ]
            }
        ]
    };
})();
