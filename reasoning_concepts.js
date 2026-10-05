/* =====================================================================
 * reasoning_concepts.ts  →  (tsc, tsconfig.legacy.json) →  reasoning_concepts.js
 * 「兩種推理・演繹 vs 歸納」觀念養成（論證與推理共用容器頁）。
 *   國小高年級→國中。這是「思辨／邏輯」底層觀念：先弄懂兩種推理怎麼走——
 *   演繹（由通則推個例，前提真＋形式有效 → 結論「一定」為真）、
 *   歸納（由個例推通則，結論「很可能」但不保證、可被反例推翻）。
 *   學會後接 informal_fallacy_concepts（以偏概全＝壞歸納）與 data_literacy_concepts
 *   （樣本／相關），再到 logic_reasoning 做情境應用。
 *   資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）。
 *   動畫課重用 anim_core.js 的 window.Anim.argFlow（論證流，參數化、多頁共用）；
 *   其餘以 stepped/static SVG。每個 teach step 都有視覺，零純文字。純本地進度（progKey）。
 *
 *   ★ lesson-id 命名規則（本頁三 spec 共用、同一 window.CONCEPT.lessons）：
 *     L1–L3（本 spec，演繹 vs 歸納）＝ rc_deduction / rc_induction / rc_compare。
 *     之後 core-argument-structure 追加 L4–L5 用 rc_argstruct_* 前綴（rc_argstruct_premise / rc_argstruct_hidden）；
 *     core-fact-vs-opinion 追加 L6–L7 用 rc_factopinion_* 前綴。
 *     後續 spec 只 APPEND 到同一 lessons 陣列尾端、沿用 rc_ 前綴，不改既有課。
 *
 *   以 IIFE 包住讓 animCanvas / SVG helper 為檔案區域（避免與其他遷移頁同名頂層
 *   helper 在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。
 * ===================================================================== */
(function () {
    // 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
    function animCanvas(w, h, label) {
        return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
            'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
    }
    var SU = '#4f46e5', WARN = '#e11d48', OK = '#16a34a', MUT = '#64748b', AMBER = '#d97706';
    // ---- static / stepped SVG helpers（每個非動畫 teach step 都要有視覺，零純文字）---------
    // L1 teach2：演繹的方向＝由「通則」推到「個例」（上寬下窄的漏斗，必然箭頭）。
    function genToSpecific() {
        return '<svg viewBox="0 0 300 180" role="img" aria-label="演繹的方向：從上面的通則「所有金屬都導電」，往下推到個例「銅會導電」；前提若為真，結論就一定為真">' +
            '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">演繹：由通則 → 推到個例</text>' +
            '<rect x="40" y="30" width="220" height="40" rx="10" fill="' + SU + '" opacity="0.12"/>' +
            '<rect x="40" y="30" width="220" height="40" rx="10" fill="none" stroke="' + SU + '" stroke-width="1.6"/>' +
            '<text x="150" y="47" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + SU + '">通則（前提）</text>' +
            '<text x="150" y="63" text-anchor="middle" font-size="11" fill="currentColor">所有金屬都導電</text>' +
            '<path d="M150 72 L150 108" stroke="' + SU + '" stroke-width="2.4" marker-end="url(#rd1)"/>' +
            '<text x="196" y="94" text-anchor="middle" font-size="10" fill="' + MUT + '">套用到銅</text>' +
            '<rect x="92" y="112" width="116" height="40" rx="10" fill="' + OK + '" opacity="0.12"/>' +
            '<rect x="92" y="112" width="116" height="40" rx="10" fill="none" stroke="' + OK + '" stroke-width="1.6"/>' +
            '<text x="150" y="129" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + OK + '">個例（結論）</text>' +
            '<text x="150" y="145" text-anchor="middle" font-size="11" fill="currentColor">銅會導電</text>' +
            '<text x="150" y="170" text-anchor="middle" font-size="10.5" fill="' + MUT + '">前提若為真，結論就「一定」為真。</text>' +
            '<defs><marker id="rd1" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + SU + '"/></marker></defs>' +
            '</svg>';
    }
    // L1 teach3：有效（valid，形式對）vs 健全（sound，有效＋前提都真）。
    function validSound() {
        return '<svg viewBox="0 0 300 196" role="img" aria-label="有效和健全不一樣：有效是形式正確，但前提可能是假的；健全是形式有效加上前提都真，結論才真正被保證。例子：所有魚都會飛、鯊魚是魚、所以鯊魚會飛，形式有效但前提假，所以結論不被保證">' +
            '<text x="150" y="15" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">有效 ≠ 正確（健全）</text>' +
            '<rect x="14" y="26" width="272" height="66" rx="10" fill="' + AMBER + '" opacity="0.1"/>' +
            '<rect x="14" y="26" width="272" height="66" rx="10" fill="none" stroke="' + AMBER + '" stroke-width="1.6"/>' +
            '<text x="150" y="43" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + AMBER + '">有效（valid）：形式對</text>' +
            '<text x="150" y="60" text-anchor="middle" font-size="10" fill="currentColor">所有魚都會飛；鯊魚是魚；所以鯊魚會飛。</text>' +
            '<text x="150" y="77" text-anchor="middle" font-size="10" fill="' + WARN + '">推論形式沒錯，但前提是假的 → 結論不被保證</text>' +
            '<rect x="14" y="102" width="272" height="66" rx="10" fill="' + OK + '" opacity="0.1"/>' +
            '<rect x="14" y="102" width="272" height="66" rx="10" fill="none" stroke="' + OK + '" stroke-width="1.6"/>' +
            '<text x="150" y="119" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + OK + '">健全（sound）：有效 ＋ 前提都真</text>' +
            '<text x="150" y="136" text-anchor="middle" font-size="10" fill="currentColor">所有金屬都導電；銅是金屬；所以銅導電。</text>' +
            '<text x="150" y="153" text-anchor="middle" font-size="10" fill="' + OK + '">形式有效，前提也都真 → 結論一定為真</text>' +
            '<text x="150" y="186" text-anchor="middle" font-size="10.5" fill="' + MUT + '">要「結論一定對」：前提全真＋形式有效，兩個都要。</text>' +
            '</svg>';
    }
    // L2 teach2：歸納的方向＝由多個「個例」推到「通則」（虛線＝很可能，不保證）。
    function specToGen() {
        var s = '<svg viewBox="0 0 300 184" role="img" aria-label="歸納的方向：從下面好幾個看到的個例（白天鵝、白天鵝、白天鵝），用虛線往上推到通則「所有天鵝都是白的」；結論只是很可能，不保證沒有例外">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + AMBER + '">歸納：由個例 → 推到通則</text>';
        var xs = [40, 125, 210];
        for (var i = 0; i < 3; i++) {
            s += '<rect x="' + xs[i] + '" y="118" width="56" height="38" rx="8" fill="' + SU + '" opacity="0.12"/>';
            s += '<rect x="' + xs[i] + '" y="118" width="56" height="38" rx="8" fill="none" stroke="' + SU + '" stroke-width="1.4"/>';
            s += '<text x="' + (xs[i] + 28) + '" y="134" text-anchor="middle" font-size="10" fill="currentColor">看到的</text>';
            s += '<text x="' + (xs[i] + 28) + '" y="148" text-anchor="middle" font-size="10" fill="currentColor">是白的</text>';
            s += '<path d="M' + (xs[i] + 28) + ' 116 L150 78" stroke="' + AMBER + '" stroke-width="1.8" stroke-dasharray="5 4" marker-end="url(#ri1)"/>';
        }
        s += '<rect x="78" y="36" width="144" height="40" rx="10" fill="' + AMBER + '" opacity="0.12"/>';
        s += '<rect x="78" y="36" width="144" height="40" rx="10" fill="none" stroke="' + AMBER + '" stroke-width="1.6"/>';
        s += '<text x="150" y="53" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + AMBER + '">通則（結論）</text>';
        s += '<text x="150" y="69" text-anchor="middle" font-size="11" fill="currentColor">所有天鵝都是白的</text>';
        s += '<text x="150" y="176" text-anchor="middle" font-size="10.5" fill="' + MUT + '">虛線＝很可能，不保證：看再多也可能有例外。</text>';
        s += '<defs><marker id="ri1" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + AMBER + '"/></marker></defs>';
        return s + '</svg>';
    }
    // L2 teach3：歸納的強弱看樣本——越多、越有代表性越強（但仍非必然）。
    function sampleStrength() {
        return '<svg viewBox="0 0 300 180" role="img" aria-label="歸納的強弱看樣本：只看一兩個、又挑過的樣本，歸納很弱；觀察更多、而且更有代表性的樣本，歸納更強，但仍然只是很可能，不是一定">' +
            '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + AMBER + '">歸納的強弱，看樣本</text>' +
            '<rect x="14" y="30" width="130" height="104" rx="10" fill="' + WARN + '" opacity="0.08"/>' +
            '<rect x="14" y="30" width="130" height="104" rx="10" fill="none" stroke="' + WARN + '" stroke-width="1.4"/>' +
            '<text x="79" y="48" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + WARN + '">弱歸納</text>' +
            '<circle cx="54" cy="74" r="7" fill="' + SU + '" opacity="0.5"/><circle cx="80" cy="74" r="7" fill="' + SU + '" opacity="0.5"/>' +
            '<text x="79" y="104" text-anchor="middle" font-size="10" fill="currentColor">只看一兩個、</text>' +
            '<text x="79" y="119" text-anchor="middle" font-size="10" fill="currentColor">又挑過的樣本</text>' +
            '<rect x="156" y="30" width="130" height="104" rx="10" fill="' + OK + '" opacity="0.08"/>' +
            '<rect x="156" y="30" width="130" height="104" rx="10" fill="none" stroke="' + OK + '" stroke-width="1.4"/>' +
            '<text x="221" y="48" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + OK + '">強歸納</text>' +
            '<circle cx="178" cy="68" r="5" fill="' + SU + '"/><circle cx="196" cy="68" r="5" fill="' + SU + '"/><circle cx="214" cy="68" r="5" fill="' + SU + '"/>' +
            '<circle cx="232" cy="68" r="5" fill="' + SU + '"/><circle cx="250" cy="68" r="5" fill="' + SU + '"/>' +
            '<circle cx="187" cy="84" r="5" fill="' + SU + '"/><circle cx="205" cy="84" r="5" fill="' + SU + '"/><circle cx="223" cy="84" r="5" fill="' + SU + '"/>' +
            '<circle cx="241" cy="84" r="5" fill="' + SU + '"/>' +
            '<text x="221" y="104" text-anchor="middle" font-size="10" fill="currentColor">觀察更多、更</text>' +
            '<text x="221" y="119" text-anchor="middle" font-size="10" fill="currentColor">有代表性的樣本</text>' +
            '<text x="150" y="156" text-anchor="middle" font-size="10.5" fill="' + MUT + '">樣本越多、越有代表性，歸納越強——</text>' +
            '<text x="150" y="172" text-anchor="middle" font-size="10.5" fill="' + AMBER + '">但再強，仍然是「很可能」，不是「一定」。</text>' +
            '</svg>';
    }
    // L3 teach1：演繹 vs 歸納 兩欄對照表。
    function compareTable() {
        var s = '<svg viewBox="0 0 300 196" role="img" aria-label="演繹和歸納對照表：演繹是由通則推個例、結論必然、對錯看前提加形式；歸納是由個例推通則、結論很可能、強弱看樣本數與代表性">';
        s += '<text x="150" y="15" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">演繹 vs 歸納</text>';
        // 兩欄表頭
        s += '<rect x="14" y="24" width="135" height="26" rx="7" fill="' + SU + '" opacity="0.16"/>';
        s += '<text x="81" y="41" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + SU + '">演繹</text>';
        s += '<rect x="151" y="24" width="135" height="26" rx="7" fill="' + AMBER + '" opacity="0.16"/>';
        s += '<text x="218" y="41" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + AMBER + '">歸納</text>';
        var rows = [
            ['方向', '通則 → 個例', '個例 → 通則'],
            ['結論', '一定（必然）', '很可能（不保證）'],
            ['看什麼', '前提真 ＋ 形式有效', '樣本數 ＋ 代表性'],
            ['會不會錯', '形式有效＋前提全真就不會', '可能有例外，可被反例推翻']
        ];
        var y0 = 58, rh = 32;
        for (var i = 0; i < rows.length; i++) {
            var ry = y0 + i * rh;
            if (i % 2 === 0) {
                s += '<rect x="14" y="' + (ry - 14) + '" width="272" height="' + rh + '" fill="' + MUT + '" opacity="0.06"/>';
            }
            s += '<text x="81" y="' + ry + '" text-anchor="middle" font-size="9.5" fill="' + MUT + '">' + rows[i][0] + '</text>';
            s += '<text x="81" y="' + (ry + 13) + '" text-anchor="middle" font-size="10" fill="currentColor">' + rows[i][1] + '</text>';
            s += '<text x="218" y="' + ry + '" text-anchor="middle" font-size="9.5" fill="' + MUT + '">' + rows[i][0] + '</text>';
            s += '<text x="218" y="' + (ry + 13) + '" text-anchor="middle" font-size="10" fill="currentColor">' + rows[i][2] + '</text>';
        }
        s += '<line x1="150" y1="52" x2="150" y2="190" stroke="' + MUT + '" stroke-width="1" opacity="0.4"/>';
        return s + '</svg>';
    }
    // L3 teach2：科學定律由歸納得來 → 遇到可靠反例就要修正；以偏概全＝太草率的壞歸納。
    function lawRevise() {
        return '<svg viewBox="0 0 300 184" role="img" aria-label="科學定律多由大量觀察歸納得來，所以遇到可靠的新反例或新證據就要修正；以偏概全是用太少又偏的例子硬推全體，是太草率的壞歸納">' +
            '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + AMBER + '">歸納也會修正：這是科學的常態</text>' +
            '<rect x="20" y="34" width="76" height="42" rx="9" fill="' + SU + '" opacity="0.12"/>' +
            '<rect x="20" y="34" width="76" height="42" rx="9" fill="none" stroke="' + SU + '" stroke-width="1.5"/>' +
            '<text x="58" y="52" text-anchor="middle" font-size="10" fill="currentColor">大量觀察</text>' +
            '<text x="58" y="67" text-anchor="middle" font-size="10" fill="currentColor">歸納出定律</text>' +
            '<path d="M98 55 L124 55" stroke="' + WARN + '" stroke-width="2" marker-end="url(#rl1)"/>' +
            '<rect x="126" y="30" width="70" height="50" rx="9" fill="' + WARN + '" opacity="0.12"/>' +
            '<rect x="126" y="30" width="70" height="50" rx="9" fill="none" stroke="' + WARN + '" stroke-width="1.5"/>' +
            '<text x="161" y="49" text-anchor="middle" font-size="10" fill="' + WARN + '">出現可靠</text>' +
            '<text x="161" y="63" text-anchor="middle" font-size="10" fill="' + WARN + '">反例／新證據</text>' +
            '<path d="M198 55 L224 55" stroke="' + OK + '" stroke-width="2" marker-end="url(#rl2)"/>' +
            '<rect x="226" y="34" width="60" height="42" rx="9" fill="' + OK + '" opacity="0.12"/>' +
            '<rect x="226" y="34" width="60" height="42" rx="9" fill="none" stroke="' + OK + '" stroke-width="1.5"/>' +
            '<text x="256" y="52" text-anchor="middle" font-size="10" fill="' + OK + '">修正</text>' +
            '<text x="256" y="67" text-anchor="middle" font-size="10" fill="' + OK + '">定律</text>' +
            '<text x="150" y="104" text-anchor="middle" font-size="10.5" fill="currentColor">定律能被新證據修正，不是缺點，正是科學進步的方式。</text>' +
            '<line x1="24" y1="118" x2="276" y2="118" stroke="' + MUT + '" stroke-width="1" opacity="0.35"/>' +
            '<text x="150" y="138" text-anchor="middle" font-size="11" font-weight="700" fill="' + WARN + '">小心「以偏概全」＝太草率的壞歸納</text>' +
            '<text x="150" y="156" text-anchor="middle" font-size="10" fill="currentColor">用太少、又偏的例子硬推全體（如：三個人遲到→全班都不守時）。</text>' +
            '<text x="150" y="174" text-anchor="middle" font-size="10" fill="' + MUT + '">日常裡演繹和歸納常常合用：先歸納出規律，再演繹去應用。</text>' +
            '<defs>' +
            '<marker id="rl1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + WARN + '"/></marker>' +
            '<marker id="rl2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + OK + '"/></marker>' +
            '</defs></svg>';
    }
    // ---- core-argument-structure（L4–L5）／core-fact-vs-opinion（L6–L7）新增的檔案區域 SVG helper ----
    // 動畫課複用 window.Anim.argFlow（L4 highlightIndicators、L5 counter）與 fallacySpotlight（L7），不改場景；
    // 其餘 teach step 以下列 static SVG（每步都有視覺、連接線止於框緣、<text> 不含內嵌 <b>/<i>、以 currentColor 支援深色）。
    // L4 teach2：論證＝用前提（理由）支持結論；先找結論（主張）、再找前提。
    function premiseConcl() {
        return '<svg viewBox="0 0 300 186" role="img" aria-label="論證就是用前提支持結論：上面是結論（主張）我要帶傘，下面是前提（理由）今天會下雨，前提用箭頭往上支持結論；讀的時候先找結論，再找支持它的前提">' +
            '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">論證＝用前提（理由）支持結論</text>' +
            '<rect x="68" y="30" width="164" height="44" rx="10" fill="' + SU + '" opacity="0.12"/>' +
            '<rect x="68" y="30" width="164" height="44" rx="10" fill="none" stroke="' + SU + '" stroke-width="1.6"/>' +
            '<text x="150" y="48" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + SU + '">結論（主張）</text>' +
            '<text x="150" y="65" text-anchor="middle" font-size="11.5" fill="currentColor">我要帶傘</text>' +
            '<path d="M150 120 L150 76" stroke="' + OK + '" stroke-width="2.4" marker-end="url(#rpc)"/>' +
            '<text x="186" y="100" text-anchor="middle" font-size="10" fill="' + MUT + '">支持</text>' +
            '<rect x="68" y="120" width="164" height="44" rx="10" fill="' + OK + '" opacity="0.12"/>' +
            '<rect x="68" y="120" width="164" height="44" rx="10" fill="none" stroke="' + OK + '" stroke-width="1.6"/>' +
            '<text x="150" y="138" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + OK + '">前提（理由）</text>' +
            '<text x="150" y="155" text-anchor="middle" font-size="11.5" fill="currentColor">今天會下雨</text>' +
            '<text x="150" y="180" text-anchor="middle" font-size="10.5" fill="' + MUT + '">先找「結論」（主張），再找支持它的「前提」。</text>' +
            '<defs><marker id="rpc" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + OK + '"/></marker></defs>' +
            '</svg>';
    }
    // L5 teach2：隱藏假設＝前提與結論之間沒說出口、卻被偷偷當理由的那一步。
    function hiddenPremise() {
        return '<svg viewBox="0 0 300 192" role="img" aria-label="有些前提沒說出口（隱藏假設）：論證他是運動員所以他身體健康，中間藏著一個沒說出口的假設運動員都健康，用虛線框標出；把它找出來就看見漏洞">' +
            '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + AMBER + '">隱藏假設：沒說出口的前提</text>' +
            '<rect x="8" y="52" width="84" height="52" rx="9" fill="' + SU + '" opacity="0.12"/>' +
            '<rect x="8" y="52" width="84" height="52" rx="9" fill="none" stroke="' + SU + '" stroke-width="1.5"/>' +
            '<text x="50" y="70" text-anchor="middle" font-size="9.5" font-weight="700" fill="' + SU + '">前提（說出口）</text>' +
            '<text x="50" y="88" text-anchor="middle" font-size="11" fill="currentColor">他是運動員</text>' +
            '<rect x="108" y="46" width="84" height="64" rx="9" fill="' + AMBER + '" opacity="0.12" stroke="' + AMBER + '" stroke-width="1.5" stroke-dasharray="5 4"/>' +
            '<text x="150" y="64" text-anchor="middle" font-size="9.5" font-weight="700" fill="' + AMBER + '">隱藏假設</text>' +
            '<text x="150" y="82" text-anchor="middle" font-size="10.5" fill="currentColor">運動員</text>' +
            '<text x="150" y="97" text-anchor="middle" font-size="10.5" fill="currentColor">都健康？</text>' +
            '<rect x="208" y="52" width="84" height="52" rx="9" fill="' + OK + '" opacity="0.12"/>' +
            '<rect x="208" y="52" width="84" height="52" rx="9" fill="none" stroke="' + OK + '" stroke-width="1.5"/>' +
            '<text x="250" y="70" text-anchor="middle" font-size="9.5" font-weight="700" fill="' + OK + '">結論</text>' +
            '<text x="250" y="88" text-anchor="middle" font-size="11" fill="currentColor">他身體健康</text>' +
            '<path d="M92 78 L108 78" stroke="' + MUT + '" stroke-width="2" marker-end="url(#rhp)"/>' +
            '<path d="M192 78 L208 78" stroke="' + MUT + '" stroke-width="2" marker-end="url(#rhp)"/>' +
            '<text x="150" y="134" text-anchor="middle" font-size="10.5" fill="' + WARN + '">運動員不一定都健康 → 這個假設一戳就破。</text>' +
            '<text x="150" y="156" text-anchor="middle" font-size="10.5" fill="currentColor">把沒說出口的前提攤開，常常就看見論證的漏洞。</text>' +
            '<text x="150" y="178" text-anchor="middle" font-size="10" fill="' + MUT + '">隱藏假設，常是一個論證最弱的一環。</text>' +
            '<defs><marker id="rhp" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + MUT + '"/></marker></defs>' +
            '</svg>';
    }
    // L6 teach1：分類器——句子落入「事實（可查證真假）」與「意見（個人判斷或喜好）」兩個桶。
    function factOpinionSort() {
        var s = '<svg viewBox="0 0 300 206" role="img" aria-label="把句子分到兩個桶：事實桶（可以查證真假）放水在100度沸騰、台北是台灣的城市；意見桶（個人判斷或喜好）放這首歌最好聽、夏天比冬天好">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">兩個桶：事實 vs 意見</text>';
        s += '<rect x="10" y="26" width="136" height="156" rx="10" fill="' + OK + '" opacity="0.07"/>';
        s += '<rect x="10" y="26" width="136" height="156" rx="10" fill="none" stroke="' + OK + '" stroke-width="1.5"/>';
        s += '<text x="78" y="44" text-anchor="middle" font-size="11" font-weight="800" fill="' + OK + '">事實</text>';
        s += '<text x="78" y="59" text-anchor="middle" font-size="9" fill="' + MUT + '">可以查證真假</text>';
        var fcards = ['水在 100°C 沸騰', '台北是台灣的城市'];
        for (var i = 0; i < 2; i++) {
            var fy = 70 + i * 54;
            s += '<rect x="20" y="' + fy + '" width="116" height="46" rx="8" fill="' + OK + '" opacity="0.12"/>';
            s += '<rect x="20" y="' + fy + '" width="116" height="46" rx="8" fill="none" stroke="' + OK + '" stroke-width="1.2"/>';
            s += '<text x="78" y="' + (fy + 28) + '" text-anchor="middle" font-size="10" fill="currentColor">' + fcards[i] + '</text>';
        }
        s += '<rect x="154" y="26" width="136" height="156" rx="10" fill="' + AMBER + '" opacity="0.07"/>';
        s += '<rect x="154" y="26" width="136" height="156" rx="10" fill="none" stroke="' + AMBER + '" stroke-width="1.5"/>';
        s += '<text x="222" y="44" text-anchor="middle" font-size="11" font-weight="800" fill="' + AMBER + '">意見</text>';
        s += '<text x="222" y="59" text-anchor="middle" font-size="9" fill="' + MUT + '">個人判斷或喜好</text>';
        var ocards = ['這首歌最好聽', '夏天比冬天好'];
        for (var j = 0; j < 2; j++) {
            var oy = 70 + j * 54;
            s += '<rect x="164" y="' + oy + '" width="116" height="46" rx="8" fill="' + AMBER + '" opacity="0.12"/>';
            s += '<rect x="164" y="' + oy + '" width="116" height="46" rx="8" fill="none" stroke="' + AMBER + '" stroke-width="1.2"/>';
            s += '<text x="222" y="' + (oy + 28) + '" text-anchor="middle" font-size="10" fill="currentColor">' + ocards[j] + '</text>';
        }
        s += '<text x="150" y="200" text-anchor="middle" font-size="10" fill="' + MUT + '">事實＝查得到真假；意見＝個人判斷，無所謂真假。</text>';
        return s + '</svg>';
    }
    // L6 teach2：事實『類』 ≠ 正確——能查證真假者皆為事實類（含為假的）；意見無真假、但有沒有道理之分。
    function factTypeNotCorrect() {
        return '<svg viewBox="0 0 300 192" role="img" aria-label="事實類不等於正確：地球是平的可以查證真假（結果是假），所以它是事實類陳述只是不正確；意見像這首歌最好聽無所謂真假，但可以有沒有道理之分">' +
            '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + WARN + '">事實『類』 ≠ 正確</text>' +
            '<rect x="14" y="28" width="150" height="46" rx="9" fill="' + SU + '" opacity="0.1"/>' +
            '<rect x="14" y="28" width="150" height="46" rx="9" fill="none" stroke="' + SU + '" stroke-width="1.5"/>' +
            '<text x="89" y="45" text-anchor="middle" font-size="9" fill="' + MUT + '">事實類（可查證）</text>' +
            '<text x="89" y="63" text-anchor="middle" font-size="11" fill="currentColor">地球是平的</text>' +
            '<path d="M164 51 L196 51" stroke="' + WARN + '" stroke-width="2" marker-end="url(#rft)"/>' +
            '<rect x="198" y="30" width="88" height="42" rx="9" fill="' + WARN + '" opacity="0.1"/>' +
            '<rect x="198" y="30" width="88" height="42" rx="9" fill="none" stroke="' + WARN + '" stroke-width="1.5"/>' +
            '<text x="242" y="48" text-anchor="middle" font-size="10" fill="' + WARN + '">查證結果</text>' +
            '<text x="242" y="64" text-anchor="middle" font-size="11" font-weight="700" fill="' + WARN + '">假 ✗</text>' +
            '<text x="150" y="92" text-anchor="middle" font-size="10" fill="currentColor">能被查證真假（結果為假）→ 仍是「事實類」，只是不正確。</text>' +
            '<line x1="20" y1="106" x2="280" y2="106" stroke="' + MUT + '" stroke-width="1" opacity="0.35"/>' +
            '<rect x="14" y="118" width="150" height="46" rx="9" fill="' + AMBER + '" opacity="0.1"/>' +
            '<rect x="14" y="118" width="150" height="46" rx="9" fill="none" stroke="' + AMBER + '" stroke-width="1.5"/>' +
            '<text x="89" y="135" text-anchor="middle" font-size="9" fill="' + MUT + '">意見</text>' +
            '<text x="89" y="153" text-anchor="middle" font-size="11" fill="currentColor">這首歌最好聽</text>' +
            '<text x="222" y="135" text-anchor="middle" font-size="10" fill="' + AMBER + '">無所謂真假</text>' +
            '<text x="222" y="153" text-anchor="middle" font-size="10" fill="' + MUT + '">但有沒有道理之分</text>' +
            '<text x="150" y="182" text-anchor="middle" font-size="10.5" fill="' + MUT + '">事實句不等於「正確的句子」；意見無真假，但有沒有道理。</text>' +
            '<defs><marker id="rft" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + WARN + '"/></marker></defs>' +
            '</svg>';
    }
    // L6 teach3：有人不同意 ≠ 它就是意見——能用證據定真假的仍是事實類。
    function disagreeNotOpinion() {
        return '<svg viewBox="0 0 300 178" role="img" aria-label="有人不同意不等於它就是意見：像地球繞著太陽轉，就算有人反對，它仍然能用證據判定真假，所以還是事實類；判斷是不是意見要看能不能用證據定真假，不是看有沒有人反對">' +
            '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">「有人不同意」≠ 就是意見</text>' +
            '<rect x="80" y="28" width="140" height="42" rx="10" fill="' + SU + '" opacity="0.12"/>' +
            '<rect x="80" y="28" width="140" height="42" rx="10" fill="none" stroke="' + SU + '" stroke-width="1.6"/>' +
            '<text x="150" y="54" text-anchor="middle" font-size="11" fill="currentColor">地球繞著太陽轉</text>' +
            '<text x="56" y="92" text-anchor="middle" font-size="10" fill="' + WARN + '">有人說：才不是！</text>' +
            '<text x="244" y="92" text-anchor="middle" font-size="10" fill="' + WARN + '">有人反對</text>' +
            '<rect x="60" y="104" width="180" height="30" rx="8" fill="' + OK + '" opacity="0.12"/>' +
            '<rect x="60" y="104" width="180" height="30" rx="8" fill="none" stroke="' + OK + '" stroke-width="1.4"/>' +
            '<text x="150" y="123" text-anchor="middle" font-size="10" font-weight="700" fill="' + OK + '">能用證據判定真假 → 仍是「事實類」</text>' +
            '<text x="150" y="156" text-anchor="middle" font-size="10.5" fill="' + MUT + '">看「能不能用證據定真假」，不是看「有沒有人反對」。</text>' +
            '<text x="150" y="172" text-anchor="middle" font-size="10" fill="' + MUT + '">有爭議的事實，還是事實。</text>' +
            '</svg>';
    }
    // L7 teach2：意見也分高下——加上理由＋證據，純偏好才升級為「有根據的意見」；看理由，不看聲音大小或人氣。
    function opinionLadder() {
        return '<svg viewBox="0 0 300 192" role="img" aria-label="意見也分高下：下層是純偏好我就是喜歡沒為什麼，較難參考；上層是有根據的意見這樣比較好因為有理由加事實，較值得參考；中間箭頭是加上理由與證據；評估意見看背後的理由，不是看聲音大小或人氣">' +
            '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">意見也分高下</text>' +
            '<rect x="40" y="26" width="220" height="48" rx="10" fill="' + OK + '" opacity="0.12"/>' +
            '<rect x="40" y="26" width="220" height="48" rx="10" fill="none" stroke="' + OK + '" stroke-width="1.6"/>' +
            '<text x="150" y="43" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + OK + '">有根據的意見（較值得參考）</text>' +
            '<text x="150" y="62" text-anchor="middle" font-size="10.5" fill="currentColor">「這樣比較好，因為…（理由＋事實）」</text>' +
            '<path d="M150 120 L150 78" stroke="' + SU + '" stroke-width="2.4" marker-end="url(#rol)"/>' +
            '<text x="200" y="100" text-anchor="middle" font-size="9.5" fill="' + MUT + '">加上理由＋證據</text>' +
            '<rect x="40" y="120" width="220" height="48" rx="10" fill="' + MUT + '" opacity="0.1"/>' +
            '<rect x="40" y="120" width="220" height="48" rx="10" fill="none" stroke="' + MUT + '" stroke-width="1.6"/>' +
            '<text x="150" y="137" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + MUT + '">純偏好（較難參考）</text>' +
            '<text x="150" y="156" text-anchor="middle" font-size="10.5" fill="currentColor">「我就是喜歡，沒為什麼」</text>' +
            '<text x="150" y="186" text-anchor="middle" font-size="10.5" fill="' + MUT + '">評估意見看「背後的理由」，不看聲音大小或人氣。</text>' +
            '<defs><marker id="rol" markerWidth="8" markerHeight="8" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + SU + '"/></marker></defs>' +
            '</svg>';
    }
    window.CONCEPT = { progKey: 'reasoning_concepts_v1', practiceHref: 'logic_reasoning.html', lessons: [
            {
                id: 'rc_deduction',
                name: '演繹推理',
                emoji: '🔒',
                color: SU,
                sub: '由通則推到個例，前提保證結論',
                done: '記住這句：演繹是「由通則推到個例」；只要前提全部為真、而且推論形式有效（這叫健全／sound），結論就「一定」為真。有效（形式對）和健全（還要前提都真）不一樣。',
                steps: [
                    {
                        type: 'teach', kicker: '先看動畫', title: '前提像鎖鏈，把結論鎖住',
                        svg: animCanvas(300, 216, '演繹論證流：左欄兩張前提卡「所有鳥都有羽毛」「企鵝是鳥」，用實線鎖鏈箭頭流入右側結論卡「企鵝有羽毛」，標示「前提若為真，結論就一定為真」。'),
                        mount: function (host) { var h = window.Anim.argFlow(host, { mode: 'deduction', premises: [{ text: '所有鳥都有羽毛' }, { text: '企鵝是鳥' }], conclusion: { text: '企鵝有羽毛' } }); return function () { h.stop(); }; },
                        text: '看動畫：「<b>所有鳥都有羽毛</b>」加上「<b>企鵝是鳥</b>」，兩張前提像<b>實線鎖鏈</b>一樣，把結論「<b>企鵝有羽毛</b>」牢牢鎖住。這就是<b>演繹</b>——只要前提<b>為真</b>，結論就<b>一定</b>為真，沒有「可能有例外」的空間。鎖鏈（實線）代表的就是這種「必然」。'
                    },
                    {
                        type: 'teach', kicker: '這是什麼推理', title: '演繹：由通則 → 推到個例',
                        svg: genToSpecific(),
                        text: '<b>演繹推理</b>＝從一條<b>通則</b>（適用於一整類的規則），往下套到<b>某個個例</b>。像「所有金屬都導電」是通則，套到「銅」這個個例，就推出「銅會導電」。它的特色是：前提若為真，結論就被<b>保證</b>為真——不是「大概」，而是「<b>一定</b>」。數學證明、邏輯推論，走的多半是演繹。'
                    },
                    {
                        type: 'teach', kicker: '進階但重要', title: '有效 ≠ 正確（健全）',
                        svg: validSound(),
                        text: '這裡有個常被搞混的重點：<b>有效（valid）</b>只是說「推論的<b>形式</b>沒錯」，不保證前提是真的。例如「所有魚都會飛；鯊魚是魚；所以鯊魚會飛」——形式<b>有效</b>，但前提<b>假</b>，結論自然錯。要讓結論「<b>一定對</b>」，需要<b>健全（sound）</b>＝形式有效<b>加上</b>前提都真。所以「有效」不等於「正確」，兩個條件要一起成立。'
                    },
                    {
                        type: 'quiz', kicker: '換你試試',
                        title: '「所有金屬都導電；銅是金屬；所以銅導電。」這種「前提真就一定對」的推理叫？',
                        options: ['演繹：由通則必然推出個例', '歸納：從例子推測通則', '猜測：沒有根據的直覺', '比喻：用相似的東西說明'],
                        answer: 0,
                        why: '由「所有金屬都導電」這條通則，套到「銅」這個個例，前提若為真，結論就一定為真——這正是演繹。',
                        whyWrong: { 1: '歸納是「從看過的例子」推測通則、結論只是很可能；這題是由通則推到個例、結論是必然，所以是演繹。', 2: '這裡每一步都有明確的前提與推理，不是沒根據的直覺猜測。', 3: '比喻是用相似的事物幫助理解；這題是嚴謹地由前提推結論，不是打比方。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試',
                        title: '演繹推理若「推論形式有效，但有一個前提是假的」，結論會？',
                        options: ['不保證為真（可能錯）', '一定為真', '一定為假', '無法用演繹判斷'],
                        answer: 0,
                        why: '要「結論一定為真」，需要兩個條件都成立：前提全部為真，而且形式有效（這叫健全／sound）。只要有一個前提是假的，就算形式有效，結論也不被保證——可能剛好對、也可能錯。',
                        whyWrong: { 1: '「一定為真」要前提全真＋形式有效兩者都成立；這裡有一個前提是假的，就不被保證了。', 2: '前提假、形式有效時，結論可能剛好對、也可能錯，不是「一定為假」。', 3: '形式有不有效是可以判斷的；問題只在前提假讓結論不被保證，不是無法判斷。' }
                    }
                ]
            },
            {
                id: 'rc_induction',
                name: '歸納推理',
                emoji: '🦢',
                color: SU,
                sub: '由個例推通則，很可能但不保證',
                done: '記住這句：歸納是「由多個個例推通則」，結論只是「很可能」而非「必然」，看再多白天鵝也可能冒出一隻黑天鵝。歸納的強弱看樣本——越多、越有代表性越強，但再強也不是「一定」。',
                steps: [
                    {
                        type: 'teach', kicker: '先看動畫', title: '看到的都白……就一定都白嗎？',
                        svg: animCanvas(300, 216, '歸納論證流：左欄三張觀察卡（這隻、那隻、再看都是白的）用虛線箭頭流入右側通則卡「所有天鵝都是白的」，標示「很可能但不保證」，最後浮現一隻黑天鵝反例把結論用紅✗打叉。'),
                        mount: function (host) { var h = window.Anim.argFlow(host, { mode: 'induction', premises: [{ text: '這隻天鵝是白的' }, { text: '那隻也是白的' }, { text: '再看還是白的' }], conclusion: { text: '所有天鵝都白' }, counter: { text: '出現一隻黑天鵝', on: true } }); return function () { h.stop(); }; },
                        text: '看動畫：看到的天鵝一隻隻都是白的，於是推出「<b>所有天鵝都是白的</b>」。但箭頭是<b>虛線</b>——代表「<b>很可能</b>，但<b>不保證</b>」。果然，最後冒出一隻<b>黑天鵝</b>，一個<b>反例</b>就把結論<b>打叉</b>了。這就是<b>歸納</b>：由看到的個例推通則，看再多也可能有例外。'
                    },
                    {
                        type: 'teach', kicker: '這是什麼推理', title: '歸納：由個例 → 推到通則',
                        svg: specToGen(),
                        text: '<b>歸納推理</b>＝從<b>多個個例</b>（看到的、量到的、統計到的）往上推出一條<b>通則</b>。它和演繹<b>方向相反</b>：演繹由通則推個例、結論必然；歸納由個例推通則、結論是「<b>很可能</b>」而非「必然」。所以歸納的結論永遠<b>可能被新的反例推翻</b>——這不代表歸納沒用，只是要記得：它給的是「很有把握的猜測」，不是「鐵定」。'
                    },
                    {
                        type: 'teach', kicker: '怎樣算好的歸納', title: '強弱看樣本：多 ＋ 有代表性',
                        svg: sampleStrength(),
                        text: '既然歸納不保證，那怎麼讓它<b>更可信</b>？看<b>樣本</b>：樣本數<b>越多</b>、而且<b>越有代表性</b>（不是只挑支持自己的、也不是只看特別的那幾個），歸納就<b>越強</b>。相反地，只看一兩個、又挑過的例子，很容易<b>以偏概全</b>。但要記得：就算樣本再好，歸納仍然是「很可能」，<b>不是「一定」</b>。（這一點之後在「資料偵探」會再深入。）'
                    },
                    {
                        type: 'quiz', kicker: '換你試試',
                        title: '「我看過的烏鴉都是黑的，所以所有烏鴉都是黑的。」這是？',
                        options: ['歸納：結論只是很可能、可能有例外', '演繹：結論一定正確', '假兩難', '稻草人'],
                        answer: 0,
                        why: '由「我看過的」這些個例，推到「所有烏鴉」這個通則，是歸納；看再多黑烏鴉也不能保證沒有例外，結論只是很可能。',
                        whyWrong: { 1: '演繹的結論才是「一定」；這裡是從看過的例子推到全體、不保證無例外，是歸納不是演繹。', 2: '假兩難是把選項硬塞成「只有兩種」；這題沒有限縮選項。', 3: '稻草人是扭曲別人的主張再攻擊；這題沒有扭曲誰的話。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試',
                        title: '哪種做法會讓歸納的結論「更可信」？',
                        options: ['觀察更多、而且更有代表性的樣本', '只挑支持自己想法的例子', '只看一兩個例子就下結論', '改用感動人的情緒來說服'],
                        answer: 0,
                        why: '歸納的強弱看樣本——樣本數越多、越有代表性，結論越可信（但仍然是「很可能」，不是「一定」）。',
                        whyWrong: { 1: '只挑支持自己的例子（選擇性取樣）會讓歸納偏掉，不會更可信。', 2: '只看一兩個例子樣本太小，很容易以偏概全。', 3: '情緒不是證據，用情緒說服不會讓歸納的結論更可信。' }
                    }
                ]
            },
            {
                id: 'rc_compare',
                name: '兩者比一比',
                emoji: '⚖️',
                color: SU,
                sub: '演繹 vs 歸納，加上常見陷阱',
                done: '記住這句：演繹（通則→個例、必然、看前提＋形式）和歸納（個例→通則、很可能、看樣本）方向相反；科學定律多由歸納得來，所以會被新證據修正；用太少又偏的例子硬推全體＝以偏概全的壞歸納。',
                steps: [
                    {
                        type: 'teach', kicker: '一張表看懂', title: '演繹 vs 歸納對照表',
                        svg: compareTable(),
                        text: '把兩種推理並排比較最清楚：<b>演繹</b>是「<b>通則 → 個例</b>」，結論<b>一定（必然）</b>，對錯看「前提真不真 ＋ 形式有不有效」；<b>歸納</b>是「<b>個例 → 通則</b>」，結論<b>很可能（不保證）</b>，強弱看「<b>樣本數 ＋ 代表性</b>」。一句話記：想要「鐵定」用演繹（但要前提真）；想從經驗找規律用歸納（但要留意例外）。'
                    },
                    {
                        type: 'teach', kicker: '常見陷阱', title: '定律會修正；小心以偏概全',
                        svg: lawRevise(),
                        text: '因為科學上的「<b>定律</b>」多半是由<b>大量觀察歸納</b>出來的，所以一旦出現<b>可靠的反例或新證據</b>，就該<b>修正</b>——這不是定律很爛，而正是科學<b>進步</b>的方式。另一個陷阱是<b>以偏概全</b>：用<b>太少、又偏</b>的例子硬推全體（像「三個同學遲到→全班都不守時」），這是太草率的<b>壞歸納</b>。日常裡兩種推理常<b>合用</b>：先歸納出規律，再演繹去應用。'
                    },
                    {
                        type: 'quiz', kicker: '換你試試',
                        title: '科學家觀察很多次後提出一條「定律」，比較像哪種推理？會不會被新證據推翻？',
                        options: ['歸納；會，發現反例就要修正', '演繹；永遠不會改變', '兩者都不是', '無法判斷'],
                        answer: 0,
                        why: '由大量觀察歸納出通則（定律），結論是「很可能」而非「必然」，所以一旦出現可靠的反例或新證據，定律就要修正——科學就是這樣進步的。',
                        whyWrong: { 1: '定律是從觀察歸納來的、不是從更高的通則演繹來的；它會隨新證據修正，不是永遠不變。', 2: '它屬於歸納（由觀察推通則），不是「兩者都不是」。', 3: '從「由大量觀察推出通則」就能判斷這是歸納，不是無法判斷。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試',
                        title: '「班上三個同學遲到，所以這班學生都不守時。」錯在？',
                        options: ['用太少又偏的例子硬推全體（壞歸納、以偏概全）', '這是正確的演繹', '訴諸權威', '假兩難'],
                        answer: 0,
                        why: '只用三個同學（樣本太小、又不具代表性）就推論「全班都不守時」，是歸納得太草率——這就是以偏概全的壞歸納。',
                        whyWrong: { 1: '演繹要有能保證結論的通則前提；這裡只有幾個例子硬推全體，是歸納、而且推得太草率，不是正確的演繹。', 2: '訴諸權威是搬出名人或專家當理由；這句話沒有引用任何權威。', 3: '假兩難是把選項硬塞成二選一；這題沒有限縮選項。' }
                    }
                ]
            },
            {
                id: 'rc_argstruct_premise',
                name: '拆解論證',
                emoji: '🧩',
                color: SU,
                sub: '找出前提與結論（因為…所以…）',
                done: '記住這句：論證＝用前提（理由）支持一個結論。先找「結論」（主張），再找支持它的「前提」；「因為／由於／既然」後面通常是前提，「所以／因此／可見」後面通常是結論。拆出結構，才能進一步問前提真不真、能不能真正支持結論。',
                steps: [
                    {
                        type: 'teach', kicker: '先看動畫', title: '把一句話拆成前提與結論',
                        svg: animCanvas(300, 216, '論證流（標指示詞）：左欄前提卡「今天會下雨」標著「因為」，用實線箭頭流入右側結論卡「我要帶傘」、標著「所以」，示範怎麼用指示詞拆出前提與結論。'),
                        mount: function (host) { var h = window.Anim.argFlow(host, { mode: 'deduction', highlightIndicators: true, premises: [{ text: '今天會下雨' }], conclusion: { text: '我要帶傘' } }); return function () { h.stop(); }; },
                        text: '看動畫：「<b>因為</b>今天會下雨，<b>所以</b>我要帶傘。」一個<b>論證</b>就是用<b>前提</b>（理由）去支持一個<b>結論</b>（主張）。前提卡上標了「<b>因為</b>」、結論卡上標了「<b>所以</b>」——這些就是<b>指示詞</b>：「因為／由於／既然」常引出<b>前提</b>，「所以／因此／可見」常引出<b>結論</b>。看到指示詞，就能快速把一句話拆成前提和結論。'
                    },
                    {
                        type: 'teach', kicker: '怎麼拆', title: '先找結論，再找前提',
                        svg: premiseConcl(),
                        text: '拆論證有個順序：<b>先找結論</b>（整段話想說服你接受的那個<b>主張</b>），<b>再找前提</b>（用來支持結論的<b>理由</b>）。像上圖，「我要帶傘」是結論，「今天會下雨」是支持它的前提。把結構拆出來以後，才有辦法進一步問：這些前提<b>是真的嗎</b>？它們<b>真的能支持</b>這個結論嗎？這一步，正是判斷一個論證好不好的開始。'
                    },
                    {
                        type: 'quiz', kicker: '換你試試',
                        title: '「因為今天會下雨，所以我要帶傘。」這段話的結論是哪一句？',
                        options: ['我要帶傘', '今天會下雨', '兩句都是前提', '這段話沒有結論'],
                        answer: 0,
                        why: '「所以」後面的「我要帶傘」是結論（想說服你接受的主張）；「因為」後面的「今天會下雨」是支持它的前提。',
                        whyWrong: { 1: '「今天會下雨」前面有指示詞「因為」，是支持結論的前提，不是結論。', 2: '這段話明明有一個主張（我要帶傘）當結論，不是兩句都是前提。', 3: '「所以」帶出的「我要帶傘」就是結論，怎麼會沒有結論。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試',
                        title: '要判斷一個論證好不好，正確的順序是？',
                        options: ['先找出結論與前提，再看前提是否為真、是否真能支持結論', '先看這段話是誰說的', '先看字數多不多', '先看有沒有名人背書'],
                        answer: 0,
                        why: '要先把結構拆出來——哪句是結論、哪些是前提——接著才談前提是不是真的、能不能真正支持結論。先拆結構，再論真假與支持力。',
                        whyWrong: { 1: '看「是誰說的」容易變成訴諸權威或人身；論證好不好要看前提與推理，不是看說話的人。', 2: '字數多少跟論證有沒有道理無關；長篇大論也可能站不住腳。', 3: '有沒有名人背書是訴諸權威，不是判斷論證的根據。' }
                    }
                ]
            },
            {
                id: 'rc_argstruct_hidden',
                name: '隱藏假設',
                emoji: '🔍',
                color: SU,
                sub: '找出沒說出口的前提',
                done: '記住這句：有些前提沒說出口（隱藏假設）。看看前提到結論之間是不是偷偷多跳了一步，把那個沒說出口的前提攤開來檢查，常常就看見論證的漏洞——隱藏假設往往是一個論證最弱的一環。',
                steps: [
                    {
                        type: 'teach', kicker: '先看動畫', title: '沒說出口的那一步',
                        svg: animCanvas(300, 216, '論證流（隱藏假設）：前提卡「他是運動員」流向結論卡「他身體一定健康」，結論上方浮現一張標著隱藏假設的卡，並用紅✗把結論打叉，表示這個沒說出口的假設不一定成立。'),
                        mount: function (host) { var h = window.Anim.argFlow(host, { mode: 'induction', premises: [{ text: '他是運動員' }], conclusion: { text: '他身體一定健康' }, counter: { text: '隱藏假設', on: true, emoji: '❓' } }); return function () { h.stop(); }; },
                        text: '看動畫：「他是運動員，所以他身體<b>一定</b>健康。」這段話中間其實藏著一個<b>沒說出口的前提</b>——「<b>所有運動員都健康</b>」。這種沒講明、卻被偷偷當成理由的前提，叫做<b>隱藏假設</b>。動畫把它當成一張浮出的卡片標出來：一旦攤開來看，就會發現它<b>不一定成立</b>（真的每個運動員都健康嗎？），結論也就被打了個叉——不再被保證。'
                    },
                    {
                        type: 'teach', kicker: '怎麼找', title: '看看中間偷偷多跳了哪一步',
                        svg: hiddenPremise(),
                        text: '找隱藏假設的方法：看看<b>前提</b>和<b>結論</b>之間，是不是<b>偷偷多跳了一步</b>。像「他是運動員」要跳到「他身體健康」，中間一定假設了「<b>運動員都健康</b>」——但這個假設<b>一戳就破</b>（有的運動員也會生病、受傷）。把這個沒說出口的前提找出來、檢查它成不成立，常常就看見整個論證<b>最弱的地方</b>。'
                    },
                    {
                        type: 'quiz', kicker: '換你試試',
                        title: '「這本書很多人買，所以一定很好看。」這段話藏著哪個沒說出口的假設？',
                        options: ['「賣得好＝好看」這個假設（不一定成立）', '這本書很厚', '作者很有名', '這段話沒有任何假設'],
                        answer: 0,
                        why: '從「很多人買」要跳到「一定很好看」，中間偷偷假設了「暢銷＝品質好」。把這個隱藏前提攤開，就看出漏洞——賣得好不一定好看（這也連回「訴諸群眾」）。',
                        whyWrong: { 1: '書厚不厚這段話根本沒提，也不是它用來支持結論的隱藏前提。', 2: '作者有不有名這段話沒講，也不是這個論證偷偷假設的那一步。', 3: '正因為它偷偷假設了「暢銷＝好看」，才會從「很多人買」跳到「一定好看」，怎麼會沒有假設。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試',
                        title: '把一個論證的「隱藏假設」找出來，最大的好處是？',
                        options: ['能檢查那個沒說的前提到底成不成立，避免被唬過去', '能讓論證看起來更長', '可以從此不用證據', '跟邏輯一點關係都沒有'],
                        answer: 0,
                        why: '隱藏假設常是論證最弱的一環。把它攤開來，就能檢查它成不成立；一旦它站不住，整個論證也跟著垮——這樣就不會被含糊帶過、唬過去。',
                        whyWrong: { 1: '找隱藏假設是為了看穿漏洞，不是為了把論證拉長；長度跟對錯無關。', 2: '剛好相反——找出隱藏假設正是要用證據去檢查它成不成立。', 3: '隱藏假設就是沒說出口的前提，正是邏輯與論證的核心，關係很大。' }
                    }
                ]
            },
            {
                id: 'rc_factopinion_classify',
                name: '事實 vs 意見',
                emoji: '🪣',
                color: SU,
                sub: '可查證的是事實，個人判斷的是意見',
                done: '記住這句：事實＝可以查證真假（含被證明為假的，如「地球是平的」仍屬事實類）；意見＝個人判斷或喜好，無所謂真假。重點在「能不能查證真假」，不是「它對不對」；「有人不同意」也不等於它就是意見。',
                steps: [
                    {
                        type: 'teach', kicker: '分兩個桶', title: '事實＝可查證；意見＝個人判斷',
                        svg: factOpinionSort(),
                        text: '先學會分兩種句子。<b>事實</b>＝<b>可以查證真假</b>的句子，像「水在 100°C 沸騰」「台北是台灣的城市」，我們能拿證據去確認它對不對。<b>意見</b>＝<b>個人判斷或喜好</b>，像「這首歌最好聽」「夏天比冬天好」，不同人感受不同，<b>沒辦法</b>用證據判定誰對誰錯。分清楚這兩種，別人想把「意見」當「事實」塞給你時，你就看得出來。'
                    },
                    {
                        type: 'teach', kicker: '最容易搞錯', title: '事實『類』≠正確',
                        svg: factTypeNotCorrect(),
                        text: '這裡有個很重要、也很容易搞錯的點：<b>事實句不等於「正確的句子」</b>。像「地球是平的」——它<b>可以被查證真假</b>（查下去結果是<b>假</b>），所以它仍然是一句<b>事實類</b>的陳述，只是這句事實類陳述<b>剛好是錯的</b>。重點在<b>「能不能查證真假」</b>，而不是「它對不對」。相對地，<b>意見</b>（像「這首歌最好聽」）<b>無所謂真假</b>，但可以有「<b>有沒有道理</b>」之分。'
                    },
                    {
                        type: 'teach', kicker: '另一個誤會', title: '有人不同意，不代表那是意見',
                        svg: disagreeNotOpinion(),
                        text: '還有一個常見的誤會：以為「<b>有人不同意</b>」就代表那是<b>意見</b>。其實不然。像「地球繞著太陽轉」，就算歷史上<b>有人大力反對</b>，它仍然<b>能用證據判定真假</b>——所以它是<b>事實類</b>，不是意見。判斷一句話是不是意見，要看它<b>能不能用證據定真假</b>，<b>不是</b>看有沒有人反對。有爭議的事實，還是事實。'
                    },
                    {
                        type: 'quiz', kicker: '換你試試',
                        title: '下列哪一句是「意見」？',
                        options: ['「我覺得這部電影最好看」', '「這部電影片長 2 小時」', '「水結冰會變成固體」', '「台灣在亞洲」'],
                        answer: 0,
                        why: '「最好看」是個人判斷、每個人感受不同，沒辦法用證據判定誰對誰錯，所以是意見；其餘三句都能查證真假，屬於事實類。',
                        whyWrong: { 1: '片長 2 小時可以實際量、去查證真假，是事實類，不是意見。', 2: '水結冰變固體能用實驗查證真假，是事實類。', 3: '台灣在不在亞洲可以查地圖證實，是事實類，不是個人判斷。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試',
                        title: '「月球是用起司做的」這句話屬於？',
                        options: ['事實類陳述（可查證，而且是假的）', '意見', '既不是事實也不是意見', '無法分類'],
                        answer: 0,
                        why: '它可以用證據去判定真假（查下去是假的），所以是「事實類」陳述——只是不正確。再次提醒：事實類≠正確，能查證真假的就算事實類，哪怕它是錯的。',
                        whyWrong: { 1: '它不是個人喜好或判斷，而是一個能被證據判定真假的說法，所以不是意見。', 2: '凡能用證據判定真假的句子都能歸類（這裡歸「事實類、為假」），不是「既不是也不是」。', 3: '正因為它能被查證真假，所以分得出來——屬於事實類（為假），不是無法分類。' }
                    }
                ]
            },
            {
                id: 'rc_factopinion_grounded',
                name: '意見也分高下',
                emoji: '🗣️',
                color: SU,
                sub: '有根據的意見 vs 純偏好',
                done: '記住這句：意見也分高下——拿得出事實與理由支持的「有根據的意見」，比「我就是喜歡」的純偏好更值得參考。評估一個意見，看它背後的理由與證據，不看聲音大小或人氣。',
                steps: [
                    {
                        type: 'teach', kicker: '先看動畫', title: '有根據的意見 vs 純偏好',
                        svg: animCanvas(300, 216, '論證聚光燈（對比兩種意見）：左框是有根據的意見「這方案較好，因為…有理由加事實」，右框用紅色標出純偏好「我就是不喜歡，沒為什麼」，底部點出純偏好拿不出理由、較難參考。'),
                        mount: function (host) { var h = window.Anim.fallacySpotlight(host, { type: 'generic', title: '兩種意見：有根據 vs 純偏好', left: { label: '有根據的意見', text: '這方案較好，因為…（理由＋事實）' }, right: { label: '純偏好', text: '我就是不喜歡，沒為什麼' }, breakLabel: '純偏好：拿不出理由，只說「我就喜歡」', label: '對比兩種意見：左框有根據的意見拿得出理由與事實，右框純偏好只有好惡、說不出理由，底部點出純偏好較難拿來說服別人。' }); return function () { h.stop(); }; },
                        text: '意見和意見之間，<b>也有高下之分</b>。看動畫：左邊是<b>有根據的意見</b>——「這方案比較好，<b>因為…</b>」後面拿得出<b>理由和事實</b>；右邊用紅色標出<b>純偏好</b>——「我就是喜歡／不喜歡，<b>沒為什麼</b>」，講不出任何理由。拿得出理由與證據的意見，<b>比較值得參考</b>；只有好惡、說不出理由的純偏好，就比較難拿來說服別人。'
                    },
                    {
                        type: 'teach', kicker: '怎麼評估', title: '看理由，不看人氣與音量',
                        svg: opinionLadder(),
                        text: '所以，評估一個意見<b>值不值得聽</b>，重點不是「說的人是誰」或「多少人同意」，而是看它<b>背後有沒有理由和證據</b>撐著。純偏好（我就是喜歡）沒有對錯，但也<b>很難拿來說服別人</b>；加上<b>理由＋事實</b>，它才升級成「有根據的意見」，<b>比較值得參考</b>。記住：看<b>理由</b>，不看<b>聲音大小</b>或<b>人氣</b>。'
                    },
                    {
                        type: 'quiz', kicker: '換你試試',
                        title: '兩個人都說「應該多運動」，哪一個是「有根據的意見」？',
                        options: ['「因為研究顯示運動能增強體力、改善心情，所以應該多運動」', '「反正多運動就對了，別問那麼多」', '「大家都說要運動，你就運動」', '「我爸叫我運動的」'],
                        answer: 0,
                        why: '它拿得出事實與理由（研究顯示運動能增強體力、改善心情）來支持主張，是有根據的意見；評估意見，就看背後有沒有理由與證據。',
                        whyWrong: { 1: '「別問那麼多」正好是拒絕給理由，是純偏好或蠻幹，不是有根據的意見。', 2: '「大家都說」是訴諸群眾——人多不等於有理由，不算有根據。', 3: '「我爸叫我」是訴諸權威或聽命，不是提出理由與證據。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試',
                        title: '要判斷一個意見值不值得聽，應該看？',
                        options: ['它有沒有事實與合理理由支持', '講的人聲音大不大', '有多少人按讚', '講的人有不有名'],
                        answer: 0,
                        why: '意見的分量看它背後的理由與證據，不看人氣或音量——聲音大、人多、名氣響，都不等於有道理（這也連回訴諸群眾／權威）。',
                        whyWrong: { 1: '聲音大只是比較吵，跟意見有沒有道理無關。', 2: '按讚數是人氣，人多不代表對，這是訴諸群眾。', 3: '有不有名是名氣，拿名氣當理由是訴諸權威，不是看論點本身。' }
                    }
                ]
            }
        ] };
})();
