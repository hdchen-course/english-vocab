/* =====================================================================
 * sustainability_concepts.ts  →  (tsc, tsconfig.legacy.json) → sustainability_concepts.js
 *
 * 「永續與環境公民」觀念養成（社會永續軸 × 自然跨科的真實世界專題）。國小高年級→國中。
 *   單一正式頁（social + 自然 兩個入口共指此檔＝change-one-place）。五課＝兩 spec 主題的聯集：
 *     1. 溫室效應與氣候變遷   (sus_climate)  — playable Anim.greenhouseEffect
 *     2. 碳循環與人類活動     (sus_carbon)   — playable Anim.carbonCycle
 *     3. 再生能源 vs 化石燃料 (sus_energy)   — stepped/static SVG
 *     4. 循環經濟與 3R        (sus_circular) — stepped SVG
 *     5. 氣候行動與永續目標 SDGs (sus_action) — static SVG（行動取向、非末日恐嚇）
 *   資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）。
 *   動畫課重用 anim_core.js 的 window.Anim.greenhouseEffect / carbonCycle（NEW 共用場景，
 *   author-once、與自然科/生物共用）；其餘 teach step 用 stepped/static SVG。每個 teach step
 *   都有視覺、零純文字。純本地進度（progKey sustainability_v1），不餵主 XP、無對應練習關卡
 *   （practiceHref 空，done 頁不出練習 CTA）。
 *
 *   ★ 科學鐵則：溫室效應＝吸收地面放出的「紅外線（長波）」，不是擋住進來的陽光；不與臭氧洞混淆。
 *     溫室氣體＝CO₂／甲烷 CH₄／水氣。再生能源＝太陽能／風力／水力／地熱／生質；核能＝低碳
 *     但「非再生」（鈾會用完），化石燃料＝煤／石油／天然氣。3R 優先序 減量 Reduce ＞ 重複使用
 *     Reuse ＞ 回收 Recycle，再加「設計耐用」。
 *   ★ 框架：氣候議題採行動取向、非末日恐嚇、保有能動感（過 心理 lens）；政治中立（能源陳述
 *     原理與取捨，不替特定能源政策或政黨背書）；SDGs 中性教育語氣。
 *   ★ 台灣用詞：一律用台灣慣用語（資料／資訊／品質／腳踏車／公車／大眾運輸…）；
 *     禁用中國用語與簡體字；地理指中國時一律用「中國」。
 *   以 IIFE 包住讓 SVG helper 為檔案區域（避免與其他遷移頁同名頂層 helper 在 tsconfig.legacy
 *   共用全域型別檢查時衝突）。
 * ===================================================================== */
(function () {
    // 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
    function animCanvas(w, h, label) {
        return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
            'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
    }
    var SU = '#b45309'; // 社會科赭色（與 social_concepts 一致）
    var GREEN = '#16a34a', WARN = '#e11d48', MUT = '#64748b', AMBER = '#d97706';
    var SKY = '#0ea5e9', IR = '#e8663c', GREY = '#8b94a6';
    // ---- stepped / static SVG helpers（每個非動畫 teach step 都要有視覺）------------
    // L1 teach3：主要溫室氣體（CO₂／甲烷／水氣）＋人為來源（燃燒化石燃料：發電／交通／工廠）。
    function ghgSources() {
        var s = '<svg viewBox="0 0 300 200" role="img" aria-label="主要的溫室氣體有二氧化碳、甲烷和水氣。人類大量燃燒煤、石油、天然氣等化石燃料來發電、交通和工廠運作，排放出很多二氧化碳，是最主要的人為來源。溫室氣體攔截的是地面放出的紅外線，不是擋住陽光，也和臭氧層破洞無關">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">溫室氣體有哪些？從哪裡來？</text>';
        // 上排：三種溫室氣體
        var gases = [['二氧化碳 CO₂', '最主要'], ['甲烷 CH₄', ''], ['水氣 H₂O', '']];
        for (var i = 0; i < 3; i++) {
            var x = 14 + i * 95;
            s += '<rect x="' + x + '" y="26" width="86" height="42" rx="10" fill="' + GREY + '" opacity="0.14"/>';
            s += '<rect x="' + x + '" y="26" width="86" height="42" rx="10" fill="none" stroke="' + GREY + '" stroke-width="1.4"/>';
            s += '<text x="' + (x + 43) + '" y="46" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor">' + gases[i][0] + '</text>';
            if (gases[i][1])
                s += '<text x="' + (x + 43) + '" y="61" text-anchor="middle" font-size="9" fill="' + WARN + '">' + gases[i][1] + '</text>';
        }
        // 下排：人為來源（燃燒化石燃料）
        s += '<text x="150" y="88" text-anchor="middle" font-size="10.5" fill="currentColor">人類燃燒化石燃料（煤、石油、天然氣），排出大量 CO₂：</text>';
        var srcs = [['🏭', '工廠'], ['🚗', '交通'], ['🔌', '發電']];
        for (var j = 0; j < 3; j++) {
            var sx = 30 + j * 85;
            s += '<text x="' + (sx + 20) + '" y="120" text-anchor="middle" font-size="22">' + srcs[j][0] + '</text>';
            s += '<text x="' + (sx + 20) + '" y="138" text-anchor="middle" font-size="10" fill="currentColor">' + srcs[j][1] + '</text>';
            s += '<path d="M' + (sx + 20) + ' 142 L' + (sx + 20) + ' 158" stroke="' + GREY + '" stroke-width="2" marker-end="url(#ghr)"/>';
        }
        s += '<rect x="60" y="160" width="180" height="22" rx="8" fill="' + GREY + '" opacity="0.16"/>';
        s += '<text x="150" y="175" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">大氣中的二氧化碳變多</text>';
        s += '<text x="150" y="195" text-anchor="middle" font-size="9.5" fill="' + MUT + '">溫室氣體吸收的是地面放出的紅外線，不是擋陽光；與臭氧洞無關。</text>';
        s += '<defs><marker id="ghr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + GREY + '"/></marker></defs>';
        return s + '</svg>';
    }
    // L1 teach4：暖化的後果（中性陳述）＋「我們做得到」的希望橋接（非恐嚇）。
    function climateConsequences() {
        var s = '<svg viewBox="0 0 300 196" role="img" aria-label="全球暖化可能帶來的現象，用冷靜中性的語氣陳述：極端天氣變多、海平面上升、生態受到影響。但這不是世界末日，我們每個人、社區和國家都能行動，減少排放、好好調適，一起把影響降到最低">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">暖化的影響（冷靜看，不恐慌）</text>';
        var items = [['🌀', '極端天氣變多'], ['🌊', '海平面上升'], ['🐢', '生態受影響']];
        for (var i = 0; i < 3; i++) {
            var x = 14 + i * 95;
            s += '<rect x="' + x + '" y="26" width="86" height="56" rx="11" fill="' + AMBER + '" opacity="0.1"/>';
            s += '<rect x="' + x + '" y="26" width="86" height="56" rx="11" fill="none" stroke="' + AMBER + '" stroke-width="1.4"/>';
            s += '<text x="' + (x + 43) + '" y="52" text-anchor="middle" font-size="20">' + items[i][0] + '</text>';
            s += '<text x="' + (x + 43) + '" y="73" text-anchor="middle" font-size="10" fill="currentColor">' + items[i][1] + '</text>';
        }
        s += '<path d="M150 86 L150 104" stroke="' + GREEN + '" stroke-width="2" marker-end="url(#ccr)"/>';
        s += '<rect x="30" y="108" width="240" height="46" rx="12" fill="' + GREEN + '" opacity="0.1"/>';
        s += '<rect x="30" y="108" width="240" height="46" rx="12" fill="none" stroke="' + GREEN + '" stroke-width="1.6"/>';
        s += '<text x="150" y="128" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + GREEN + '">好消息：我們做得到！</text>';
        s += '<text x="150" y="146" text-anchor="middle" font-size="10" fill="currentColor">減少排放 ＋ 好好調適，就能把影響降低。</text>';
        s += '<text x="150" y="174" text-anchor="middle" font-size="10" fill="currentColor">這不是世界末日，而是一件「現在就能一起動手做」的事。</text>';
        s += '<text x="150" y="190" text-anchor="middle" font-size="9.5" fill="' + MUT + '">每個人、社區、國家都能出一份力。</text>';
        s += '<defs><marker id="ccr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + GREEN + '"/></marker></defs>';
        return s + '</svg>';
    }
    // L2 teach3：森林砍伐→碳匯減少（對比：有森林持續吸碳 vs 砍伐後吸碳變少，失衡加劇）。
    function deforestation() {
        var s = '<svg viewBox="0 0 300 192" role="img" aria-label="森林就像地球的吸碳幫手，透過光合作用把二氧化碳吸收並固定起來。左邊有茂密森林，持續吸收二氧化碳；右邊森林被大量砍除，能吸收的二氧化碳變少，使大氣中的二氧化碳更容易累積，讓失衡更嚴重">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">森林是吸碳幫手；砍掉就少了幫手</text>';
        // 左：有森林
        s += '<rect x="16" y="28" width="128" height="128" rx="12" fill="' + GREEN + '" opacity="0.08"/>';
        s += '<rect x="16" y="28" width="128" height="128" rx="12" fill="none" stroke="' + GREEN + '" stroke-width="1.5"/>';
        s += '<text x="80" y="46" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + GREEN + '">有森林</text>';
        var tx = [44, 68, 92, 116];
        for (var i = 0; i < 4; i++) {
            s += '<rect x="' + (tx[i] - 2) + '" y="120" width="4" height="18" fill="#9c6b3f"/>';
            s += '<circle cx="' + tx[i] + '" cy="112" r="12" fill="' + GREEN + '" opacity="0.85"/>';
        }
        s += '<path d="M80 70 L80 100" stroke="' + GREEN + '" stroke-width="2" marker-end="url(#dfr)"/>';
        s += '<text x="80" y="64" text-anchor="middle" font-size="9.5" fill="' + GREEN + '">持續吸收 CO₂</text>';
        s += '<text x="80" y="150" text-anchor="middle" font-size="9" fill="' + MUT + '">碳收支較平衡</text>';
        // 右：砍伐後
        s += '<rect x="156" y="28" width="128" height="128" rx="12" fill="' + WARN + '" opacity="0.08"/>';
        s += '<rect x="156" y="28" width="128" height="128" rx="12" fill="none" stroke="' + WARN + '" stroke-width="1.5"/>';
        s += '<text x="220" y="46" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + WARN + '">大量砍伐後</text>';
        // 樹樁
        var sx = [196, 244];
        for (var j = 0; j < 2; j++) {
            s += '<rect x="' + (sx[j] - 4) + '" y="128" width="8" height="10" fill="#9c6b3f"/>';
            s += '<circle cx="' + sx[j] + '" cy="124" r="4" fill="#9c6b3f"/>';
        }
        s += '<text x="220" y="64" text-anchor="middle" font-size="9.5" fill="' + WARN + '">吸碳能力變少</text>';
        s += '<path d="M220 100 L220 72" stroke="' + WARN + '" stroke-width="2" marker-end="url(#dfrw)"/>';
        s += '<text x="220" y="112" text-anchor="middle" font-size="9.5" fill="currentColor">CO₂ 更易累積</text>';
        s += '<text x="220" y="150" text-anchor="middle" font-size="9" fill="' + MUT + '">失衡加劇</text>';
        s += '<text x="150" y="182" text-anchor="middle" font-size="10" fill="currentColor">保護森林、種樹，就是替地球留住更多吸碳的幫手。</text>';
        s += '<defs>' +
            '<marker id="dfr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + GREEN + '"/></marker>' +
            '<marker id="dfrw" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + WARN + '"/></marker>' +
            '</defs>';
        return s + '</svg>';
    }
    // L3 teach1：能源家族對照——再生（太陽能/風力/水力/地熱/生質）vs 不可再生（化石：煤/石油/天然氣；核能＝低碳但非再生）。
    function energyFamily() {
        var s = '<svg viewBox="0 0 300 208" role="img" aria-label="能源家族分兩大類。再生能源用之不竭、發電幾乎不排碳，包括太陽能、風力、水力、地熱和生質。化石燃料會用完又排碳，包括煤、石油、天然氣。核能是低碳的，但鈾會用完，所以不是再生能源，要分開說，不能把核能列為再生能源">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">能源家族：哪些是「再生」？</text>';
        // 再生能源
        s += '<rect x="12" y="24" width="276" height="66" rx="11" fill="' + GREEN + '" opacity="0.1"/>';
        s += '<rect x="12" y="24" width="276" height="66" rx="11" fill="none" stroke="' + GREEN + '" stroke-width="1.6"/>';
        s += '<text x="22" y="40" font-size="11" font-weight="800" fill="' + GREEN + '">再生能源（用之不竭、幾乎不排碳）</text>';
        var ren = [['☀️', '太陽能'], ['🌬️', '風力'], ['💧', '水力'], ['♨️', '地熱'], ['🌾', '生質']];
        for (var i = 0; i < 5; i++) {
            var x = 30 + i * 52;
            s += '<text x="' + x + '" y="64" text-anchor="middle" font-size="18">' + ren[i][0] + '</text>';
            s += '<text x="' + x + '" y="82" text-anchor="middle" font-size="9.5" fill="currentColor">' + ren[i][1] + '</text>';
        }
        // 化石燃料
        s += '<rect x="12" y="98" width="276" height="58" rx="11" fill="' + WARN + '" opacity="0.09"/>';
        s += '<rect x="12" y="98" width="276" height="58" rx="11" fill="none" stroke="' + WARN + '" stroke-width="1.6"/>';
        s += '<text x="22" y="114" font-size="11" font-weight="800" fill="' + WARN + '">化石燃料（會用完、燃燒排碳）</text>';
        var fos = [['🪨', '煤'], ['🛢️', '石油'], ['🔥', '天然氣']];
        for (var j = 0; j < 3; j++) {
            var fx = 56 + j * 90;
            s += '<text x="' + fx + '" y="138" text-anchor="middle" font-size="18">' + fos[j][0] + '</text>';
            s += '<text x="' + fx + '" y="152" text-anchor="middle" font-size="9.5" fill="currentColor">' + fos[j][1] + '</text>';
        }
        // 核能註記
        s += '<rect x="12" y="164" width="276" height="22" rx="8" fill="' + AMBER + '" opacity="0.14"/>';
        s += '<text x="150" y="179" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">⚠️ 核能：低碳，但鈾會用完 → 不是再生能源（要分開說）</text>';
        s += '<text x="150" y="202" text-anchor="middle" font-size="9.5" fill="' + MUT + '">「低碳」和「再生」是兩回事：核能低碳但非再生。</text>';
        return s + '</svg>';
    }
    // L3 teach2：排碳對比條（化石高、再生低）＋發電示意（太陽能板/風車）。
    function carbonCompare() {
        var s = '<svg viewBox="0 0 300 192" role="img" aria-label="比較不同發電方式的碳排放。燃煤和天然氣等化石燃料發電時排放很多二氧化碳，長條很高；太陽能、風力、水力等再生能源發電時幾乎不排碳，長條很低。所以多用再生能源可以有效減碳">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">發電排碳量：化石高、再生低</text>';
        var bars = [['燃煤', 100, WARN], ['天然氣', 55, AMBER], ['太陽能', 10, GREEN], ['風力', 6, GREEN], ['水力', 5, GREEN]];
        var baseY = 150, maxH = 96;
        for (var i = 0; i < 5; i++) {
            var x = 26 + i * 54;
            var h = maxH * (bars[i][1] / 100);
            s += '<rect x="' + x + '" y="' + (baseY - h) + '" width="34" height="' + h + '" rx="4" fill="' + bars[i][2] + '" opacity="0.85"/>';
            s += '<text x="' + (x + 17) + '" y="' + (baseY - h - 5) + '" text-anchor="middle" font-size="9" fill="currentColor">' + bars[i][1] + '</text>';
            s += '<text x="' + (x + 17) + '" y="164" text-anchor="middle" font-size="9.5" fill="currentColor">' + bars[i][0] + '</text>';
        }
        s += '<line x1="20" y1="150" x2="286" y2="150" stroke="' + MUT + '" stroke-width="1"/>';
        s += '<text x="150" y="184" text-anchor="middle" font-size="9.5" fill="' + MUT + '">示意比較（相對高低），再生能源發電幾乎不排碳。</text>';
        return s + '</svg>';
    }
    // L3 teach3：挑戰——看天氣、要搭配儲能與節能（最乾淨的能源是省下來的）。
    function energyChallenge() {
        var s = '<svg viewBox="0 0 300 190" role="img" aria-label="再生能源也有挑戰。太陽能和風力會受天氣影響，有時多有時少，所以需要搭配儲能，像大電池把電先存起來。而最乾淨的能源其實是省下來的，節約用電就不用發那麼多電，是最直接的減碳方法">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">再生能源的挑戰與解法</text>';
        var cards = [
            ['🌤️', '看天氣', '太陽能、風力\n有時多有時少'],
            ['🔋', '要儲能', '用大電池\n把電先存起來'],
            ['💡', '要節能', '省下來的電\n最乾淨']
        ];
        for (var i = 0; i < 3; i++) {
            var x = 14 + i * 95;
            var col = i === 0 ? AMBER : (i === 1 ? SKY : GREEN);
            s += '<rect x="' + x + '" y="28" width="86" height="110" rx="12" fill="' + col + '" opacity="0.1"/>';
            s += '<rect x="' + x + '" y="28" width="86" height="110" rx="12" fill="none" stroke="' + col + '" stroke-width="1.5"/>';
            s += '<text x="' + (x + 43) + '" y="58" text-anchor="middle" font-size="24">' + cards[i][0] + '</text>';
            s += '<text x="' + (x + 43) + '" y="82" text-anchor="middle" font-size="11" font-weight="800" fill="' + col + '">' + cards[i][1] + '</text>';
            var lines = cards[i][2].split('\n');
            for (var k = 0; k < lines.length; k++) {
                s += '<text x="' + (x + 43) + '" y="' + (102 + k * 15) + '" text-anchor="middle" font-size="9.5" fill="currentColor">' + lines[k] + '</text>';
            }
        }
        s += '<text x="150" y="162" text-anchor="middle" font-size="11" font-weight="700" fill="' + GREEN + '">最乾淨的能源，是「省下來的」那一度電。</text>';
        s += '<text x="150" y="182" text-anchor="middle" font-size="9.5" fill="' + MUT + '">再生能源＋儲能＋節能，一起搭配才穩當。</text>';
        return s + '</svg>';
    }
    // L4 teach1：直線經濟（拿→做→用→丟→垃圾）vs 循環經濟（資源繞回圈）。
    function linearVsCircular() {
        var s = '<svg viewBox="0 0 300 196" role="img" aria-label="直線經濟是拿材料、製造、使用、然後丟掉，變成大量垃圾，是一條直線走到垃圾桶。循環經濟則讓資源繞成一圈，用完後重新回到製造，盡量不變成垃圾，資源一直被重複利用">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">直線經濟 vs 循環經濟</text>';
        // 直線經濟
        s += '<text x="20" y="42" font-size="10.5" font-weight="800" fill="' + WARN + '">直線經濟（用完就丟）</text>';
        var steps = ['拿', '做', '用', '丟'];
        for (var i = 0; i < 4; i++) {
            var x = 16 + i * 56;
            s += '<circle cx="' + (x + 20) + '" cy="66" r="16" fill="' + WARN + '" opacity="0.12"/>';
            s += '<circle cx="' + (x + 20) + '" cy="66" r="16" fill="none" stroke="' + WARN + '" stroke-width="1.4"/>';
            s += '<text x="' + (x + 20) + '" y="70" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor">' + steps[i] + '</text>';
            if (i < 3)
                s += '<path d="M' + (x + 38) + ' 66 L' + (x + 52) + ' 66" stroke="' + WARN + '" stroke-width="2" marker-end="url(#lcr)"/>';
        }
        s += '<text x="248" y="70" font-size="18">🗑️</text>';
        s += '<path d="M234 66 L244 66" stroke="' + WARN + '" stroke-width="2" marker-end="url(#lcr)"/>';
        // 循環經濟（圈）
        s += '<text x="20" y="104" font-size="10.5" font-weight="800" fill="' + GREEN + '">循環經濟（資源繞回圈）</text>';
        s += '<circle cx="150" cy="152" r="30" fill="none" stroke="' + GREEN + '" stroke-width="2.4" stroke-dasharray="4 3"/>';
        s += '<path d="M180 152 A30 30 0 0 1 150 182" fill="none" stroke="' + GREEN + '" stroke-width="2.6" marker-end="url(#lcg)"/>';
        s += '<text x="150" y="150" text-anchor="middle" font-size="10" fill="' + GREEN + '" font-weight="700">資源</text>';
        s += '<text x="150" y="164" text-anchor="middle" font-size="10" fill="' + GREEN + '" font-weight="700">繞回來</text>';
        s += '<text x="92" y="140" text-anchor="middle" font-size="9.5" fill="currentColor">做</text>';
        s += '<text x="208" y="140" text-anchor="middle" font-size="9.5" fill="currentColor">用</text>';
        s += '<text x="150" y="128" text-anchor="middle" font-size="9.5" fill="currentColor">回收再製</text>';
        s += '<text x="150" y="192" text-anchor="middle" font-size="9.5" fill="' + MUT + '">循環經濟讓資源一直被重複利用，盡量不變成垃圾。</text>';
        s += '<defs>' +
            '<marker id="lcr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + WARN + '"/></marker>' +
            '<marker id="lcg" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + GREEN + '"/></marker>' +
            '</defs>';
        return s + '</svg>';
    }
    // L4 teach2：3R 階梯優先序——減量 Reduce ＞ 重複使用 Reuse ＞ 回收 Recycle（＋設計耐用）。
    function threeRLadder() {
        var s = '<svg viewBox="0 0 300 196" role="img" aria-label="3R 的優先順序，從最優先到最後：第一是減量 Reduce，一開始就少用、少產生垃圾，效果最好；第二是重複使用 Reuse，同一樣東西多用幾次；第三是回收 Recycle，把廢棄物回收再製，這是最後一步。另外設計耐用的東西也能讓資源用更久">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">3R 優先序：減量最優先</text>';
        var rs = [
            ['①', '減量 Reduce', '一開始就少用、少產生垃圾', GREEN],
            ['②', '重複使用 Reuse', '同一樣東西多用幾次', AMBER],
            ['③', '回收 Recycle', '回收再製（最後一步）', SKY]
        ];
        for (var i = 0; i < 3; i++) {
            var y = 30 + i * 44;
            var w = 240 - i * 50;
            var x = 30;
            s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="36" rx="9" fill="' + rs[i][3] + '" opacity="0.14"/>';
            s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="36" rx="9" fill="none" stroke="' + rs[i][3] + '" stroke-width="1.6"/>';
            s += '<text x="' + (x + 16) + '" y="' + (y + 23) + '" text-anchor="middle" font-size="15" font-weight="800" fill="' + rs[i][3] + '">' + rs[i][0] + '</text>';
            s += '<text x="' + (x + 34) + '" y="' + (y + 15) + '" font-size="11" font-weight="800" fill="currentColor">' + rs[i][1] + '</text>';
            s += '<text x="' + (x + 34) + '" y="' + (y + 29) + '" font-size="9.5" fill="' + MUT + '">' + rs[i][2] + '</text>';
        }
        s += '<text x="150" y="178" text-anchor="middle" font-size="10.5" fill="currentColor">越上面越優先：先想「能不能不用／少用」，回收是最後一步。</text>';
        s += '<text x="150" y="192" text-anchor="middle" font-size="9.5" fill="' + MUT + '">再加「設計耐用」，東西能用更久，更不容易變垃圾。</text>';
        return s + '</svg>';
    }
    // L4 teach3：生活實例（自備餐具水壺／修理延用／正確分類）。
    function circularExamples() {
        var s = '<svg viewBox="0 0 300 180" role="img" aria-label="循環經濟在生活中的例子：自備環保餐具和水壺，減少一次性垃圾，這是減量；東西壞了先修理、延長使用，這是重複使用；把回收物正確分類，才能真的被回收再製，這是回收">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">生活中就能做的循環行動</text>';
        var ex = [
            ['🥤', '自備水壺餐具', '減少一次性垃圾', GREEN],
            ['🔧', '壞了先修理', '延長使用壽命', AMBER],
            ['♻️', '正確分類回收', '才能被回收再製', SKY]
        ];
        for (var i = 0; i < 3; i++) {
            var x = 14 + i * 95;
            s += '<rect x="' + x + '" y="30" width="86" height="104" rx="12" fill="' + ex[i][3] + '" opacity="0.1"/>';
            s += '<rect x="' + x + '" y="30" width="86" height="104" rx="12" fill="none" stroke="' + ex[i][3] + '" stroke-width="1.5"/>';
            s += '<text x="' + (x + 43) + '" y="62" text-anchor="middle" font-size="26">' + ex[i][0] + '</text>';
            s += '<text x="' + (x + 43) + '" y="92" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + ex[i][3] + '">' + ex[i][1] + '</text>';
            s += '<text x="' + (x + 43) + '" y="112" text-anchor="middle" font-size="9" fill="currentColor">' + ex[i][2] + '</text>';
        }
        s += '<text x="150" y="156" text-anchor="middle" font-size="10.5" fill="currentColor">每一個小動作，都是讓資源「轉圈圈」的一環。</text>';
        s += '<text x="150" y="172" text-anchor="middle" font-size="9.5" fill="' + MUT + '">不必一次做到滿分，從一兩件開始、慢慢養成就好。</text>';
        return s + '</svg>';
    }
    // L5 teach1：SDGs——聯合國 17 項永續發展目標（2030），挑 4–5 個貼近生活放大。
    function sdgsGrid() {
        var s = '<svg viewBox="0 0 300 196" role="img" aria-label="聯合國提出 17 項永續發展目標，簡稱 SDGs，是全世界到 2030 年想一起達成的目標。這裡用 17 個彩色方塊示意，不用一個個背；挑幾個貼近生活的放大說明：消除貧窮、乾淨飲水、優質教育、氣候行動、負責任的消費與生產">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">SDGs：全世界的 17 個永續目標</text>';
        // 17 格色塊示意（不逐一背）
        var cols = ['#e5243b', '#dda63a', '#4c9f38', '#c5192d', '#ff3a21', '#26bde2', '#fcc30b', '#a21942', '#fd6925', '#dd1367', '#fd9d24', '#bf8b2e', '#3f7e44', '#0a97d9', '#56c02b', '#00689d', '#19486a'];
        for (var i = 0; i < 17; i++) {
            var cx = 20 + (i % 9) * 30;
            var cy = 28 + Math.floor(i / 9) * 26;
            s += '<rect x="' + cx + '" y="' + cy + '" width="24" height="22" rx="4" fill="' + cols[i] + '" opacity="0.85"/>';
            s += '<text x="' + (cx + 12) + '" y="' + (cy + 15) + '" text-anchor="middle" font-size="9" font-weight="700" fill="#fff">' + (i + 1) + '</text>';
        }
        s += '<text x="150" y="94" text-anchor="middle" font-size="9.5" fill="' + MUT + '">17 項目標（不用背）；挑幾個貼近生活的看看：</text>';
        var pick = [['🍚', '消除貧窮'], ['💧', '乾淨飲水'], ['📚', '優質教育'], ['🌍', '氣候行動'], ['♻️', '負責任消費']];
        for (var j = 0; j < 5; j++) {
            var px = 20 + j * 54;
            s += '<rect x="' + px + '" y="104" width="48" height="52" rx="10" fill="' + SU + '" opacity="0.1"/>';
            s += '<rect x="' + px + '" y="104" width="48" height="52" rx="10" fill="none" stroke="' + SU + '" stroke-width="1.3"/>';
            s += '<text x="' + (px + 24) + '" y="128" text-anchor="middle" font-size="18">' + pick[j][0] + '</text>';
            s += '<text x="' + (px + 24) + '" y="148" text-anchor="middle" font-size="8.5" fill="currentColor">' + pick[j][1] + '</text>';
        }
        s += '<text x="150" y="176" text-anchor="middle" font-size="10" fill="currentColor">SDGs 不只環保，還涵蓋貧窮、教育、健康、公平等面向。</text>';
        s += '<text x="150" y="191" text-anchor="middle" font-size="9.5" fill="' + MUT + '">目標：到 2030 年，讓世界更永續、更公平。</text>';
        return s + '</svg>';
    }
    // L5 teach2：永續＝環境／社會／經濟三圓交集（兼顧現在與未來的人）。
    function threePillars() {
        var s = '<svg viewBox="0 0 300 188" role="img" aria-label="永續要同時兼顧三件事：環境、社會和經濟，就像三個圓圈的交集。只有三者一起顧好，才能讓現在的人過得好，也不犧牲未來的人。中間重疊的地方就是永續">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">永續＝環境 ＋ 社會 ＋ 經濟</text>';
        s += '<circle cx="120" cy="78" r="46" fill="' + GREEN + '" opacity="0.22"/>';
        s += '<circle cx="180" cy="78" r="46" fill="' + SKY + '" opacity="0.22"/>';
        s += '<circle cx="150" cy="122" r="46" fill="' + AMBER + '" opacity="0.22"/>';
        s += '<text x="98" y="66" text-anchor="middle" font-size="11" font-weight="800" fill="' + GREEN + '">環境</text>';
        s += '<text x="202" y="66" text-anchor="middle" font-size="11" font-weight="800" fill="' + SKY + '">社會</text>';
        s += '<text x="150" y="140" text-anchor="middle" font-size="11" font-weight="800" fill="' + AMBER + '">經濟</text>';
        s += '<text x="150" y="94" text-anchor="middle" font-size="10" font-weight="800" fill="currentColor">永續</text>';
        s += '<text x="150" y="170" text-anchor="middle" font-size="10" fill="currentColor">讓現在的人過得好，也不犧牲未來的人。</text>';
        s += '<text x="150" y="185" text-anchor="middle" font-size="9.5" fill="' + MUT + '">三者一起顧，才站得久。</text>';
        return s + '</svg>';
    }
    // L5 teach3：減緩（減碳）＋ 調適（適應）兩路並行，冷靜中性。
    function mitigateAdapt() {
        var s = '<svg viewBox="0 0 300 184" role="img" aria-label="面對氣候變遷有兩條路要一起走。減緩是減少碳排放，從源頭讓暖化不要那麼嚴重，例如節能、用再生能源。調適是提前做好準備去適應已經在發生的改變，例如防洪、耐熱的作物。兩條路一起走，才能把影響降到最低">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">兩條路一起走：減緩 ＋ 調適</text>';
        // 減緩
        s += '<rect x="16" y="30" width="128" height="110" rx="12" fill="' + GREEN + '" opacity="0.1"/>';
        s += '<rect x="16" y="30" width="128" height="110" rx="12" fill="none" stroke="' + GREEN + '" stroke-width="1.6"/>';
        s += '<text x="80" y="54" text-anchor="middle" font-size="22">📉</text>';
        s += '<text x="80" y="78" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + GREEN + '">減緩（減碳）</text>';
        s += '<text x="80" y="98" text-anchor="middle" font-size="9.5" fill="currentColor">從源頭減少排放</text>';
        s += '<text x="80" y="114" text-anchor="middle" font-size="9.5" fill="currentColor">節能、用再生能源</text>';
        s += '<text x="80" y="130" text-anchor="middle" font-size="9" fill="' + MUT + '">讓暖化不要太嚴重</text>';
        // 調適
        s += '<rect x="156" y="30" width="128" height="110" rx="12" fill="' + SKY + '" opacity="0.1"/>';
        s += '<rect x="156" y="30" width="128" height="110" rx="12" fill="none" stroke="' + SKY + '" stroke-width="1.6"/>';
        s += '<text x="220" y="54" text-anchor="middle" font-size="22">🛡️</text>';
        s += '<text x="220" y="78" text-anchor="middle" font-size="11.5" font-weight="800" fill="' + SKY + '">調適（適應）</text>';
        s += '<text x="220" y="98" text-anchor="middle" font-size="9.5" fill="currentColor">提前做好準備</text>';
        s += '<text x="220" y="114" text-anchor="middle" font-size="9.5" fill="currentColor">防洪、耐熱作物</text>';
        s += '<text x="220" y="130" text-anchor="middle" font-size="9" fill="' + MUT + '">適應已發生的改變</text>';
        s += '<text x="150" y="164" text-anchor="middle" font-size="10.5" fill="currentColor">認清事實、聚焦能做的事——兩條路一起走最有效。</text>';
        s += '<text x="150" y="179" text-anchor="middle" font-size="9.5" fill="' + MUT + '">冷靜看、動手做，我們做得到。</text>';
        return s + '</svg>';
    }
    // L5 teach4：行動清單三層（個人／社區／政策）＋個人可做的事，強調能動感。
    function actionLayers() {
        var s = '<svg viewBox="0 0 300 196" role="img" aria-label="減碳行動分三層一起來。個人可以隨手關燈、自備水壺、惜食不浪費、多走路或搭大眾運輸。社區可以一起做資源回收、種樹、節能。國家與政策可以發展再生能源、訂定減碳目標。每一層都重要，而小學生從個人的小行動就能開始，很有力量">';
        s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">一起行動：個人 · 社區 · 政策</text>';
        var layers = [
            ['🙋', '個人（你就能做）', '關燈節電、自備水壺、惜食、走路或搭公車', GREEN],
            ['🏘️', '社區', '一起回收、種樹、節能', SKY],
            ['🏛️', '國家 · 政策', '發展再生能源、訂減碳目標', AMBER]
        ];
        for (var i = 0; i < 3; i++) {
            var y = 28 + i * 46;
            s += '<rect x="16" y="' + y + '" width="268" height="40" rx="10" fill="' + layers[i][3] + '" opacity="0.1"/>';
            s += '<rect x="16" y="' + y + '" width="268" height="40" rx="10" fill="none" stroke="' + layers[i][3] + '" stroke-width="1.5"/>';
            s += '<text x="38" y="' + (y + 26) + '" text-anchor="middle" font-size="20">' + layers[i][0] + '</text>';
            s += '<text x="62" y="' + (y + 17) + '" font-size="11" font-weight="800" fill="' + layers[i][3] + '">' + layers[i][1] + '</text>';
            s += '<text x="62" y="' + (y + 32) + '" font-size="9.5" fill="currentColor">' + layers[i][2] + '</text>';
        }
        s += '<text x="150" y="182" text-anchor="middle" font-size="10.5" font-weight="700" fill="' + GREEN + '">別小看自己——小公民的小行動，也是改變的一部分。</text>';
        return s + '</svg>';
    }
    window.CONCEPT = {
        progKey: 'sustainability_v1', practiceHref: '',
        lessons: [
            {
                id: 'sus_climate', name: '溫室效應與氣候變遷', emoji: '🌡️', color: SU,
                sub: '溫室氣體留住地面放出的紅外線；變多就升溫',
                done: '記住：太陽短波陽光穿過大氣照到地面，地面放出長波紅外線，溫室氣體（CO₂、甲烷、水氣）把部分紅外線留住，讓地球溫暖宜居。人類燃燒化石燃料讓溫室氣體變多、被子變厚、留住更多熱，就造成全球暖化。這不是末日——減少排放，我們做得到。',
                steps: [
                    {
                        type: 'teach', kicker: '先看動畫', title: '適量的溫室氣體：像剛好的被子',
                        svg: animCanvas(300, 250, '溫室效應動畫（少氣體）：太陽的短波陽光穿過大氣照到地面，地面升溫後放出長波紅外線。溫室氣體較少時，大部分紅外線直接逸出太空，只留住剛剛好的熱，溫度計停在舒適的位置，地球溫暖宜居。重點是溫室氣體攔截的是地面放出的紅外線，不是擋住進來的陽光'),
                        mount: function (host) { var h = window.Anim.greenhouseEffect(host, { gas: 'low' }); return function () { h.stop(); }; },
                        text: '太陽的<b>短波</b>陽光會<b>穿過大氣</b>照到地面（不會被擋住）；地面變暖後，會把熱以<b>長波紅外線</b>的形式往外放。大氣中的<b>溫室氣體</b>（像二氧化碳）會<b>吸收這些紅外線、再放回地面</b>，把一部分熱留住——就像蓋了一條<b>剛剛好</b>的被子，讓地球<b>溫暖宜居</b>。看動畫：溫室氣體較少時，大部分紅外線直接逸出太空，留住的熱剛好，溫度計停在舒適的位置。'
                    },
                    {
                        type: 'teach', kicker: '被子變太厚', title: '溫室氣體變多：留住更多熱',
                        svg: animCanvas(300, 250, '溫室效應動畫（多氣體）：同樣是太陽短波陽光穿過大氣照到地面、地面放出長波紅外線，但這次大氣中的溫室氣體很多，較多紅外線被吸收後又放回地面，熱被留住得更多，溫度計明顯升高，代表全球暖化。對照前一張少氣體的情況，可以看出氣體越多、留住的熱越多'),
                        mount: function (host) { var h = window.Anim.greenhouseEffect(host, { gas: 'high' }); return function () { h.stop(); }; },
                        text: '人類大量<b>燃燒煤、石油</b>（發電、交通、工廠），排出很多<b>二氧化碳</b>，讓大氣中的溫室氣體<b>變多</b>——像被子<b>變太厚</b>。看動畫：這次較多紅外線被<b>攔截後放回地面</b>，熱被留住得更多，<b>溫度計明顯升高</b>。全球平均氣溫上升，就是<b>全球暖化</b>。對照上一步「少氣體」的樣子，就能看出：<b>氣體越多、留住的熱越多</b>。'
                    },
                    {
                        type: 'teach', kicker: '氣體從哪來', title: '溫室氣體有哪些、人為來源',
                        svg: ghgSources(),
                        text: '主要的溫室氣體有<b>二氧化碳（CO₂）</b>、<b>甲烷（CH₄）</b>和<b>水氣</b>，其中<b>二氧化碳</b>是最主要的人為來源。人類<b>燃燒化石燃料</b>（煤、石油、天然氣）來<b>發電、交通、工廠</b>運作，就排出大量二氧化碳，讓大氣中的 CO₂ 變多。再提醒一次鐵則：溫室氣體攔截的是<b>地面放出的紅外線</b>，<b>不是擋住進來的陽光</b>；這和「臭氧層破洞」是<b>兩回事</b>，別搞混。'
                    },
                    {
                        type: 'teach', kicker: '冷靜看影響', title: '暖化的影響，與我們做得到的事',
                        svg: climateConsequences(),
                        text: '全球暖化可能帶來一些現象：<b>極端天氣變多</b>、<b>海平面上升</b>、<b>生態受影響</b>——這些用冷靜、中性的方式了解就好，<b>不必嚇自己</b>。重要的是：這<b>不是世界末日</b>，而是一件「<b>現在就能一起動手做</b>」的事。只要<b>減少排放</b>、好好<b>調適</b>，每個人、社區、國家都出一份力，就能把影響降低。記住這份<b>「我們做得到」</b>的心情，再往下學怎麼做。'
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '溫室氣體主要是「留住」了什麼，才使地表變暖？',
                        options: ['地面放出的紅外線（長波熱輻射）', '進來的太陽光被擋在大氣外面', '天空的月光', '風'],
                        answer: 0,
                        why: '陽光（短波）照進來使地面變暖，地面放出的紅外線（長波）被溫室氣體吸收後再放回，熱因此被留住。',
                        whyWrong: { 1: '陽光（短波）其實是穿過大氣照到地面的，沒有被擋在外面；被攔住的是地面放出的紅外線。', 2: '月光不是暖化的原因；關鍵是地面放出的紅外線被溫室氣體留住。', 3: '風不是溫室氣體留住的對象；溫室效應留住的是紅外線這種熱輻射。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '全球暖化最主要的人為原因是？',
                        options: ['大量燃燒煤和石油，排放很多二氧化碳', '太陽突然變大', '大家開太多電風扇', '月亮離地球變近'],
                        answer: 0,
                        why: '燃燒化石燃料排放的二氧化碳是最主要的人為溫室氣體來源，讓「被子」變厚、地球升溫。',
                        whyWrong: { 1: '太陽並沒有突然變大；觀測到的暖化主要來自人類排放的溫室氣體。', 2: '電風扇本身不是暖化主因；問題在發電與燃燒化石燃料排出的二氧化碳。', 3: '月亮的距離變化不會造成全球暖化；主因是大氣中二氧化碳變多。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '如果大氣中的溫室氣體「增加」，最可能發生什麼？',
                        options: ['留住更多熱，地表均溫上升', '地球變冷', '完全沒有差別', '太陽熄滅'],
                        answer: 0,
                        why: '更多溫室氣體會吸收更多紅外線，熱累積起來，全球平均氣溫就上升。',
                        whyWrong: { 1: '溫室氣體增加會留住更多熱，使地球變暖而不是變冷。', 2: '溫室氣體是影響地表溫度的關鍵，增加了不會「完全沒差」。', 3: '太陽會不會發光和大氣中的溫室氣體多寡無關。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '關於溫室效應，下列何者正確？',
                        options: ['本來是好事（保暖），但溫室氣體太多會讓地球過熱', '溫室效應完全是壞事，應該消滅', '跟人類活動完全無關', '只影響北極，不影響台灣'],
                        answer: 0,
                        why: '適量的溫室效應維持地球宜居的溫度；是「過量」才造成暖化，而且台灣也會受極端天氣影響。',
                        whyWrong: { 1: '沒有溫室效應地球會非常冷；問題是「太多」而不是溫室效應本身，不該消滅它。', 2: '目前觀測到的快速升溫，主要和人類燃燒化石燃料有關，並非無關。', 3: '暖化是全球性的，台灣也會遇到極端天氣、海平面等影響，不是只影響北極。' }
                    },
                    {
                        type: 'quiz', kicker: '別搞混', title: '下列哪一句關於溫室效應的說法是「錯的」（要挑出錯的）？',
                        options: ['溫室效應就是臭氧層破洞造成的', '溫室氣體會吸收地面放出的紅外線', '二氧化碳是重要的溫室氣體', '適量溫室效應讓地球溫暖宜居'],
                        answer: 0,
                        why: '溫室效應和臭氧層破洞是兩回事：溫室效應是溫室氣體留住地面的紅外線；臭氧洞是另一種大氣問題，別混為一談。',
                        whyWrong: { 1: '這句是對的：溫室氣體正是吸收地面放出的紅外線，所以不該被選為「錯的」。', 2: '這句是對的：二氧化碳確實是重要的溫室氣體，不該被選。', 3: '這句是對的：適量溫室效應讓地球宜居，不該被選。' }
                    },
                    {
                        type: 'quiz', kicker: '保持希望', title: '面對暖化，比較健康的心態是？',
                        options: ['冷靜了解事實，聚焦自己能做的減碳行動', '覺得反正沒救了，什麼都不用做', '假裝沒這回事', '覺得全都是別人的錯，與我無關'],
                        answer: 0,
                        why: '科學的行動取向：認清事實、把注意力放在自己能做的事情上，保有「我們做得到」的能動感。',
                        whyWrong: { 1: '「沒救了」是一種無助的誇大；其實減碳與調適都能有效降低影響。', 2: '假裝沒發生不會讓問題消失，認清事實才能行動。', 3: '暖化是大家共同的事，每個人的小行動都算數，不是只怪別人。' }
                    }
                ]
            },
            {
                id: 'sus_carbon', name: '碳循環與人類活動', emoji: '♻️', color: SU,
                sub: '碳本來循環平衡；燃燒化石燃料打破平衡',
                done: '記住：碳在大氣、植物、海洋間循環——植物光合作用吸碳，動物呼吸與分解放碳，海洋也會吸收與釋放，本來收支大致平衡。人類大量燃燒化石燃料，把地底封存很久的碳快速放回大氣，加上森林被砍、吸碳變少，就打破了平衡，二氧化碳在大氣累積。',
                steps: [
                    {
                        type: 'teach', kicker: '先看動畫', title: '大自然的碳循環：本來大致平衡',
                        svg: animCanvas(300, 250, '碳循環動畫（自然）：碳在大氣、植物、海洋之間流動。植物行光合作用把空氣中的二氧化碳吸收起來，動物呼吸與生物分解又把碳放回空氣，海洋也會吸收和釋放二氧化碳。這些進出本來大致平衡，所以大氣中的二氧化碳維持穩定'),
                        mount: function (host) { var h = window.Anim.carbonCycle(host, { emphasis: 'natural' }); return function () { h.stop(); }; },
                        text: '碳會在<b>大氣、植物、海洋</b>之間不斷<b>循環</b>：<b>植物</b>行<b>光合作用</b>把空氣中的二氧化碳<b>吸收</b>起來；<b>動物呼吸</b>和<b>生物分解</b>又把碳<b>放回</b>空氣；<b>海洋</b>也會吸收與釋放二氧化碳。看動畫：這些「吸碳」和「放碳」的量<b>本來大致平衡</b>，所以大氣中的二氧化碳大致<b>穩定</b>。'
                    },
                    {
                        type: 'teach', kicker: '平衡被打破', title: '人類燃燒化石燃料：CO₂ 累積',
                        svg: animCanvas(300, 250, '碳循環動畫（人類活動）：在原本平衡的碳循環之外，人類大量燃燒煤、石油、天然氣等化石燃料，把地底封存很久的碳快速放回大氣。這一股人類額外的排放用紅色標出，使大氣中的二氧化碳不斷累積、打破原本的平衡，右上角的累積長條越來越高'),
                        mount: function (host) { var h = window.Anim.carbonCycle(host, { emphasis: 'human' }); return function () { h.stop(); }; },
                        text: '麻煩出在<b>人類</b>把<b>地底封存了幾億年</b>的碳（煤、石油、天然氣）<b>大量燒出來</b>。看動畫：在原本的循環之外，多了<b>紅色</b>那一股「<b>人類額外排放</b>」，速度遠超過自然循環能吸收的量，於是大氣中的二氧化碳<b>不斷累積</b>（右上角的長條越來越高），原本的<b>平衡被打破</b>。'
                    },
                    {
                        type: 'teach', kicker: '少了吸碳幫手', title: '森林被砍：吸碳能力變少',
                        svg: deforestation(),
                        text: '森林就像地球的<b>吸碳幫手</b>：樹木透過<b>光合作用</b>把二氧化碳吸收並<b>固定</b>起來。當森林被<b>大量砍除</b>，能吸碳的樹變少，大氣中的二氧化碳就<b>更容易累積</b>，讓失衡<b>更嚴重</b>。反過來說，<b>保護森林、種樹</b>，就是替地球留住更多吸碳的幫手——這也是我們能幫上忙的地方。'
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '大自然中，哪個過程會把空氣中的二氧化碳「吸收」起來？',
                        options: ['植物的光合作用', '汽車排氣', '燃燒木柴', '動物呼吸'],
                        answer: 0,
                        why: '植物光合作用吸收二氧化碳、放出氧氣，是碳循環中重要的「吸碳」環節。',
                        whyWrong: { 1: '汽車排氣是「放碳」，會把二氧化碳排到空氣中，不是吸收。', 2: '燃燒木柴也是放碳，會釋放二氧化碳，不是吸收。', 3: '動物呼吸會放出二氧化碳，屬於「放碳」而不是吸碳。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '為什麼人類活動會讓大氣中的二氧化碳明顯增加？',
                        options: ['把地底封存已久的煤和石油大量燒掉', '因為樹木會呼吸', '因為海洋會蒸發', '因為火山每天爆發'],
                        answer: 0,
                        why: '燃燒化石燃料把長期封存的碳快速釋放，超過自然循環能吸收的量，打破了平衡。',
                        whyWrong: { 1: '樹木呼吸是自然碳循環的一部分，本來就大致平衡，不是人為增加的主因。', 2: '海洋蒸發屬於水循環，不是大氣二氧化碳明顯增加的原因。', 3: '火山並非「每天爆發」，人為排放量遠大於火山的平均貢獻。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '「化石燃料」指的是下列哪一組？',
                        options: ['煤、石油、天然氣', '太陽能、風力、水力', '木柴、落葉、廚餘', '陽光、雨水、空氣'],
                        answer: 0,
                        why: '煤、石油、天然氣是地底封存很久的碳，燃燒它們會把碳快速放回大氣，是化石燃料。',
                        whyWrong: { 1: '太陽能、風力、水力是再生能源，不是化石燃料。', 2: '木柴、落葉、廚餘屬於目前的生物碳，不是地底封存很久的化石燃料。', 3: '陽光、雨水、空氣不是燃料，不會燃燒放碳。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '森林大量被砍除，對碳平衡的影響是？',
                        options: ['減少吸收 CO₂ 的能力，使 CO₂ 更容易累積', '讓 CO₂ 直接消失', '完全沒有影響', '會把氧氣永久儲存起來'],
                        answer: 0,
                        why: '樹木透過光合作用吸收並固定碳，砍伐減少了這個「碳匯」，使大氣中的二氧化碳更容易上升。',
                        whyWrong: { 1: '砍樹不會讓二氧化碳消失，反而少了吸收它的樹。', 2: '森林是重要的吸碳幫手，砍掉當然有影響，不是「沒影響」。', 3: '光合作用是持續進行的過程，不是把氧氣「永久儲存」起來。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '為什麼大自然原本的碳循環「大致平衡」，人類燒化石燃料卻會失衡？',
                        options: ['化石燃料把地底封存很久的碳「額外、快速」放回大氣，超過自然能吸收的量', '因為人類呼吸的二氧化碳特別多', '因為自然界本來就不會吸碳', '因為植物會故意少吸一點碳'],
                        answer: 0,
                        why: '自然的吸碳與放碳本來相抵；燒化石燃料多出一股又快又大的額外排放，自然循環來不及吸收，就累積了。',
                        whyWrong: { 1: '人類呼吸的碳來自食物（目前的碳循環），大致平衡，不是失衡主因。', 2: '自然界透過植物與海洋一直都在吸碳，不是「本來就不會吸碳」。', 3: '植物不會「故意」少吸碳；問題是額外排放太多、太快。' }
                    },
                    {
                        type: 'quiz', kicker: '我能幫忙', title: '下列哪一件事，對維持碳平衡「有幫助」？',
                        options: ['保護森林、多種樹', '大量砍伐森林', '盡量多燒煤和石油', '把樹都換成水泥地'],
                        answer: 0,
                        why: '保護森林、多種樹能增加吸碳的「幫手」，幫助把大氣中的二氧化碳固定下來。',
                        whyWrong: { 1: '大量砍伐森林會減少吸碳能力，讓二氧化碳更容易累積。', 2: '多燒煤和石油會排放更多二氧化碳，使失衡更嚴重。', 3: '把樹換成水泥地等於少了吸碳的樹，對碳平衡沒有幫助。' }
                    }
                ]
            },
            {
                id: 'sus_energy', name: '再生能源 vs 化石燃料', emoji: '🔋', color: SU,
                sub: '再生＝太陽/風/水/地熱/生質；核能低碳但非再生；節能最直接',
                done: '記住：再生能源（太陽能、風力、水力、地熱、生質）用之不竭、發電幾乎不排碳；化石燃料（煤、石油、天然氣）會用完又排碳。核能是低碳，但鈾會用完，所以「不是」再生能源。再生能源會受天氣影響，要搭配儲能；而最乾淨的能源，其實是「省下來的」那一度電。',
                steps: [
                    {
                        type: 'teach', kicker: '分清兩大類', title: '能源家族：哪些是「再生」？',
                        svg: energyFamily(),
                        text: '能源分兩大類。<b>再生能源</b>用之不竭、發電時<b>幾乎不排碳</b>：<b>太陽能、風力、水力、地熱、生質</b>。<b>化石燃料</b>會<b>用完</b>又<b>燃燒排碳</b>：<b>煤、石油、天然氣</b>。要特別注意：<b>核能</b>發電時<b>低碳</b>，但它用的<b>鈾會用完</b>，所以<b>「不是」再生能源</b>——「低碳」和「再生」是<b>兩回事</b>，別把核能列成再生能源。'
                    },
                    {
                        type: 'teach', kicker: '看排碳', title: '發電排碳量：化石高、再生低',
                        svg: carbonCompare(),
                        text: '把不同發電方式的<b>排碳量</b>排一排就很清楚：<b>燃煤</b>、<b>天然氣</b>這類化石燃料發電時排放<b>很多</b>二氧化碳，長條很<b>高</b>；<b>太陽能、風力、水力</b>等再生能源發電時<b>幾乎不排碳</b>，長條很<b>低</b>。所以<b>多用再生能源取代化石燃料</b>，是減碳很重要的一步。'
                    },
                    {
                        type: 'teach', kicker: '也有挑戰', title: '挑戰：看天氣、要儲能、更要節能',
                        svg: energyChallenge(),
                        text: '再生能源不是「裝了就萬事 OK」。<b>太陽能、風力會受天氣影響</b>，有時多、有時少，所以要<b>搭配儲能</b>（像用大電池把電先存起來），需要時再用。而最重要、最直接的其實是<b>節能</b>——<b>最乾淨的能源，就是「省下來」的那一度電</b>。<b>再生能源 ＋ 儲能 ＋ 節能</b>一起搭配，才又穩又乾淨。'
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '下列哪一「組」全部都是再生能源？',
                        options: ['太陽能、風力、水力', '煤、石油、天然氣', '石油、風力、天然氣', '煤、太陽能、石油'],
                        answer: 0,
                        why: '太陽能、風力、水力（還有地熱、生質）都是再生能源，用之不竭、發電幾乎不排碳。',
                        whyWrong: { 1: '煤、石油、天然氣全是化石燃料，不是再生能源。', 2: '這組裡的石油和天然氣是化石燃料，所以不是「全部」都是再生能源。', 3: '這組裡的煤和石油是化石燃料，所以不是「全部」都是再生能源。' }
                    },
                    {
                        type: 'quiz', kicker: '別搞混', title: '關於「核能」，下列哪一句最正確？',
                        options: ['核能發電低碳，但鈾會用完，所以不是再生能源', '核能是再生能源', '核能發電會排放大量二氧化碳', '核能和太陽能完全一樣'],
                        answer: 0,
                        why: '核能發電過程低碳，但燃料（鈾）會用完，不符合「用之不竭」的再生條件，所以不是再生能源。',
                        whyWrong: { 1: '核能的鈾會用完，不符合再生的定義，不能算再生能源。', 2: '核能發電本身屬於低碳，並不會排放「大量」二氧化碳。', 3: '核能和太陽能並不一樣：太陽能是再生能源，核能是低碳但非再生。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '再生能源的一個主要挑戰是？',
                        options: ['發電量會受天氣影響，需要搭配儲能與節電', '完全沒有任何缺點', '一定比較貴所以不要用', '會排放大量二氧化碳'],
                        answer: 0,
                        why: '太陽能、風力受天候影響不穩定，需要儲能與節約用電配合，但它們發電幾乎不排碳。',
                        whyWrong: { 1: '任何能源都有取捨，再生能源也有「看天氣」的挑戰，不是完全沒缺點。', 2: '要不要用是整體取捨，不能只看價格就說「不要用」；而且成本一直在下降。', 3: '再生能源發電幾乎不排碳，這正是它的優點，不是缺點。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '俗話說「最乾淨的能源是省下來的」，這句話的意思是？',
                        options: ['節約用電就不用發那麼多電，是最直接的減碳', '要把電器全部丟掉', '多用電才環保', '省電沒有任何用處'],
                        answer: 0,
                        why: '節能直接減少發電需求，也就減少排碳，是最直接、人人可做的減碳方法。',
                        whyWrong: { 1: '節能不是要你把電器丟掉，而是「需要時才用、不浪費」。', 2: '多用電會增加發電與排碳，不會比較環保。', 3: '省電能減少發電需求與排碳，非常有用，不是沒用。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '為了減碳，下列哪一個做法方向正確？',
                        options: ['多用再生能源取代化石燃料，並節約用電', '盡量多燒煤發電', '把冷氣開整天也沒關係', '電器都不要關，待機就好'],
                        answer: 0,
                        why: '用再生能源取代化石燃料能減少發電排碳，再加上節約用電，是正確的減碳方向。',
                        whyWrong: { 1: '多燒煤會排放更多二氧化碳，與減碳方向相反。', 2: '冷氣開整天會用掉很多電，增加排碳，不是沒關係。', 3: '電器待機仍會耗電，隨手關掉才省電減碳。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '下列關於「化石燃料」的敘述，哪一個正確？',
                        options: ['會用完，而且燃燒時排放二氧化碳', '用之不竭，永遠不會用完', '發電時完全不排碳', '和太陽能一樣屬於再生能源'],
                        answer: 0,
                        why: '煤、石油、天然氣是化石燃料，數量有限會用完，燃燒時還會排放二氧化碳。',
                        whyWrong: { 1: '化石燃料數量有限、會用完，不是用之不竭。', 2: '化石燃料燃燒時會排放大量二氧化碳，不是完全不排碳。', 3: '化石燃料會用完又排碳，和用之不竭、低碳的太陽能不同，不是再生能源。' }
                    }
                ]
            },
            {
                id: 'sus_circular', name: '循環經濟與 3R', emoji: '🔁', color: SU,
                sub: '直線→循環；減量 Reduce ＞ 重複 Reuse ＞ 回收 Recycle',
                done: '記住：直線經濟是「拿→做→用→丟」，製造大量垃圾；循環經濟讓資源繞回圈、一直被重複利用。行動優先序是減量（Reduce）＞ 重複使用（Reuse）＞ 回收（Recycle）——減量最優先，回收是最後一步，再加上「設計耐用」。從自備水壺、修理延用、正確分類開始，人人都做得到。',
                steps: [
                    {
                        type: 'teach', kicker: '兩種經濟', title: '直線經濟 vs 循環經濟',
                        svg: linearVsCircular(),
                        text: '<b>直線經濟</b>＝<b>拿</b>材料 → <b>做</b>成產品 → <b>用</b> → <b>丟</b>掉，一路走到<b>垃圾桶</b>，製造大量垃圾。<b>循環經濟</b>則讓資源<b>繞成一圈</b>：用完後盡量<b>回收再製</b>、重新回到製造，<b>一直被重複利用</b>，<b>盡量不變成垃圾</b>。差別就在：東西是「用一次就丟」，還是「讓資源轉圈圈」。'
                    },
                    {
                        type: 'teach', kicker: '記住優先序', title: '3R 階梯：減量最優先',
                        svg: threeRLadder(),
                        text: '3R 有<b>優先順序</b>，別記反了：①<b>減量 Reduce</b>（一開始就<b>少用、少產生垃圾</b>）效果最好，<b>最優先</b>；②<b>重複使用 Reuse</b>（同一樣東西<b>多用幾次</b>）；③<b>回收 Recycle</b>（把廢棄物<b>回收再製</b>）是<b>最後一步</b>。先想「能不能<b>不用／少用</b>」，再想重複用，最後才是回收。另外<b>設計耐用</b>的東西，也能讓資源用得更久。'
                    },
                    {
                        type: 'teach', kicker: '生活實作', title: '生活中就能做的循環行動',
                        svg: circularExamples(),
                        text: '循環經濟不是大人的事，<b>生活裡就能做</b>：<b>自備水壺、餐具</b>（減少一次性垃圾，這是<b>減量</b>）；東西壞了<b>先修理、延長使用</b>（這是<b>重複使用</b>）；把回收物<b>正確分類</b>（才能真的被<b>回收再製</b>）。不用一次做到滿分，<b>從一兩件開始</b>、慢慢養成就好——每個小動作，都是讓資源「轉圈圈」的一環。'
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '3R 中，應該「最優先」做的是哪一個？',
                        options: ['減量（Reduce，少用、少產生垃圾）', '回收（Recycle）', '掩埋', '焚化'],
                        answer: 0,
                        why: '減量從源頭減少資源消耗與垃圾，效果最好；回收是處理已產生廢棄物的最後一步。',
                        whyWrong: { 1: '回收是 3R 的最後一步，優先序低於減量與重複使用。', 2: '掩埋不屬於 3R，而且會占用土地、不是優先選項。', 3: '焚化不屬於 3R 的優先行動；源頭減量才是最優先。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '循環經濟和傳統「直線經濟」最大的不同是？',
                        options: ['讓資源重複利用、盡量不變成垃圾', '製造更多一次性產品', '東西用一次就丟', '完全不生產任何東西'],
                        answer: 0,
                        why: '循環經濟把「用完就丟」改成「資源不斷循環」，減少浪費與污染。',
                        whyWrong: { 1: '製造更多一次性產品正是直線經濟的毛病，不是循環經濟。', 2: '用一次就丟是直線經濟的做法，循環經濟剛好相反。', 3: '循環經濟不是「不生產」，而是讓生產出的資源能一直被重複利用。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '下列哪一個行為屬於「重複使用（Reuse）」？',
                        options: ['把還能用的玻璃罐洗乾淨，拿來裝東西', '把紙類送到回收場打成紙漿再製', '少買用不到的東西', '把垃圾拿去焚化'],
                        answer: 0,
                        why: '把還能用的東西洗乾淨、再拿來用，就是重複使用（Reuse），不必變成垃圾也不必先回收再製。',
                        whyWrong: { 1: '打成紙漿「再製」屬於回收（Recycle），不是重複使用。', 2: '少買用不到的東西是「減量（Reduce）」，不是重複使用。', 3: '焚化是處理垃圾的方式，不屬於 3R 中的重複使用。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '想減少垃圾，下列哪個做法「從源頭」最有效？',
                        options: ['買之前先想清楚需不需要，少買用不到的', '多買一些備用，壞了再丟', '買很多一次性餐具比較方便', '東西用一次就換新的'],
                        answer: 0,
                        why: '源頭減量（Reduce）＝一開始就少用、少買用不到的，從源頭就不產生垃圾，效果最好。',
                        whyWrong: { 1: '多買備用容易用不到而變成垃圾，不是從源頭減量。', 2: '一次性餐具用完就丟，反而製造更多垃圾。', 3: '用一次就換新會製造大量垃圾，和減量相反。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '關於「正確分類回收」，下列哪一句對？',
                        options: ['分類正確，回收物才容易真正被回收再製', '隨便丟在一起也一樣會被回收', '回收做了就能完全取代減量', '只要有回收，就可以盡量多製造垃圾'],
                        answer: 0,
                        why: '分類正確能讓回收物真正被回收再製；但回收是最後一步，仍要以減量、重複使用為優先。',
                        whyWrong: { 1: '混在一起會污染回收物、增加處理難度，不是「一樣會被回收」。', 2: '回收是最後一步，無法取代效果更好的減量，兩者不是互相取代。', 3: '有回收不代表可以多製造垃圾；減量永遠優先。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '買一個耐用、可以用很久的水壺，取代一直買拋棄式瓶裝水，主要體現了循環經濟的什麼精神？',
                        options: ['減量與耐用設計，讓資源用更久', '盡量多製造垃圾', '東西用一次就丟', '乾脆都不要喝水'],
                        answer: 0,
                        why: '選耐用、可長期使用的東西，從源頭減少一次性垃圾，正是減量（Reduce）加上「設計耐用」的精神。',
                        whyWrong: { 1: '耐用水壺是為了「少製造垃圾」，和多製造垃圾正好相反。', 2: '用一次就丟是直線經濟的做法，耐用重複使用才是循環經濟。', 3: '重點是用耐用容器取代拋棄式，不是不喝水。' }
                    }
                ]
            },
            {
                id: 'sus_action', name: '氣候行動與永續目標 SDGs', emoji: '🌍', color: SU,
                sub: 'SDGs 17 項目標；減緩＋調適；個人也做得到',
                done: '記住：聯合國提出 17 項永續發展目標（SDGs），是全世界到 2030 年想一起達成的目標，不只環保，還涵蓋貧窮、教育、健康與公平。永續要兼顧環境、社會、經濟。面對氣候變遷，減緩（減碳）和調適（適應）兩條路一起走；而小公民從隨手關燈、自備水壺、惜食、綠色運輸就能開始——我們做得到。',
                steps: [
                    {
                        type: 'teach', kicker: '全世界的目標', title: 'SDGs：17 項永續發展目標',
                        svg: sdgsGrid(),
                        text: '聯合國提出 <b>17 項永續發展目標（SDGs）</b>，是全世界到 <b>2030 年</b>想<b>一起達成</b>的目標。你不用把 17 項都背下來——重點是知道它<b>不只環保</b>，還包含<b>消除貧窮、乾淨飲水、優質教育、氣候行動、負責任的消費與生產</b>等等，涵蓋<b>環境、社會、經濟</b>各面向。簡單說：SDGs 就是全世界替未來訂的「<b>一起變得更永續、更公平</b>」的待辦清單。'
                    },
                    {
                        type: 'teach', kicker: '永續是什麼', title: '永續＝環境 ＋ 社會 ＋ 經濟',
                        svg: threePillars(),
                        text: '「<b>永續</b>」不是只有環保。它要<b>同時兼顧</b>三件事：<b>環境</b>（自然與資源）、<b>社會</b>（公平與福祉）、<b>經濟</b>（能持續運作的生計），就像<b>三個圓圈的交集</b>。只有三者一起顧好，才能<b>讓現在的人過得好，也不犧牲未來的人</b>。這就是永續的核心精神——想得長遠一點。'
                    },
                    {
                        type: 'teach', kicker: '兩條路並行', title: '面對氣候變遷：減緩 ＋ 調適',
                        svg: mitigateAdapt(),
                        text: '面對氣候變遷，有<b>兩條路</b>要一起走。<b>減緩</b>＝從<b>源頭減少碳排放</b>，讓暖化不要那麼嚴重（例如節能、用再生能源）。<b>調適</b>＝<b>提前做好準備</b>去適應<b>已經在發生</b>的改變（例如防洪、種耐熱的作物）。語氣<b>冷靜</b>就好：認清事實、<b>聚焦能做的事</b>，兩條路一起走，就能把影響降到最低。'
                    },
                    {
                        type: 'teach', kicker: '一起動手', title: '一起行動：個人 · 社區 · 政策',
                        svg: actionLayers(),
                        text: '減碳是<b>三層一起來</b>的事：<b>國家與政策</b>可以發展再生能源、訂減碳目標；<b>社區</b>可以一起回收、種樹、節能；而<b>你這個小公民</b>也很有力量——<b>隨手關燈節電、自備水壺、惜食不浪費、多走路或搭公車等大眾運輸</b>（綠色運輸），還可以<b>關心並參與</b>環境議題。別小看自己：<b>每天的小選擇，就是改變的一部分。我們做得到！</b>'
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '聯合國的 SDGs（永續發展目標）主要是為了？',
                        options: ['讓全世界一起朝更永續、更公平的未來努力', '規定每個國家說同一種語言', '比賽哪個國家最有錢', '只處理垃圾分類'],
                        answer: 0,
                        why: 'SDGs 是 17 項全球共同目標，涵蓋環境、社會、經濟等面向，不只環保。',
                        whyWrong: { 1: 'SDGs 尊重各國文化差異，不是要大家說同一種語言。', 2: 'SDGs 關心的是永續與公平，不是比誰有錢。', 3: 'SDGs 範圍遠大於垃圾分類，還包含貧窮、教育、健康等 17 項目標。' }
                    },
                    {
                        type: 'quiz', kicker: '換你試試', title: '下列哪一個是小學生就能為永續做的事？',
                        options: ['隨手關燈、自備水壺、不浪費食物', '等長大再說，現在做不了', '多買一次性用品', '把垃圾丟到河裡'],
                        answer: 0,
                        why: '永續從日常小行動開始，人人都能參與，不必等長大。',
                        whyWrong: { 1: '很多永續行動現在就能做，不需要等長大，小行動也算數。', 2: '多買一次性用品會製造更多垃圾，和永續相反。', 3: '把垃圾丟到河裡會污染環境，是絕對不該做的事。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '「永續」要同時兼顧哪三件事？',
                        options: ['環境、社會、經濟', '只有環境', '只有賺錢', '遊戲、零食、玩具'],
                        answer: 0,
                        why: '永續是環境、社會、經濟三者一起兼顧，讓現在的人過得好，也不犧牲未來的人。',
                        whyWrong: { 1: '只顧環境而忽略社會與經濟，不是完整的永續。', 2: '只顧賺錢而犧牲環境與公平，無法長久，不是永續。', 3: '這些和永續的三個面向無關。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '面對氣候變遷，「減緩」和「調適」分別是指？',
                        options: ['減緩＝減少碳排放；調適＝提前準備去適應改變', '減緩＝多排一點碳；調適＝假裝沒事', '兩個都是指多發電', '兩個都是指什麼都不做'],
                        answer: 0,
                        why: '減緩是從源頭減少排放讓暖化別太嚴重；調適是為已發生的改變提前準備，兩條路一起走。',
                        whyWrong: { 1: '減緩是「減少」碳排放，不是多排；調適也不是假裝沒事。', 2: '減緩與調適不是「多發電」，減緩反而要減少發電排碳。', 3: '減緩和調適都是積極行動，不是什麼都不做。' }
                    },
                    {
                        type: 'quiz', kicker: '保持希望', title: '下列哪一項是個人就能做到、又能減碳的「綠色運輸」？',
                        options: ['多走路、騎腳踏車，或搭公車等大眾運輸', '每段路都要求家人開車接送', '自己發明一顆新的太陽', '覺得太麻煩就什麼都不改'],
                        answer: 0,
                        why: '走路、騎腳踏車、搭大眾運輸都是個人可行又有效的綠色運輸，能減少交通的碳排放。',
                        whyWrong: { 1: '每段路都開車接送會增加碳排放，不是綠色運輸。', 2: '「發明新的太陽」不是個人能做的實際行動；綠色運輸才是。', 3: '覺得麻煩就不改，會錯過許多你本來就做得到的小行動。' }
                    },
                    {
                        type: 'quiz', kicker: '想一想', title: '永續發展強調「讓現在的人過得好，也不犧牲未來的人」，這代表我們做決定時要？',
                        options: ['同時想到現在和未來、環境和人', '只顧眼前，把問題留給未來的人', '只想到自己，不管別人', '把資源一次用光最痛快'],
                        answer: 0,
                        why: '永續就是兼顧現在與未來、環境與社會經濟，做決定時把長遠影響一起考慮進去。',
                        whyWrong: { 1: '把問題留給未來的人，正是不永續的做法。', 2: '永續也重視社會的公平，不是只想自己。', 3: '把資源一次用光會犧牲未來的人，與永續精神相反。' }
                    }
                ]
            }
        ]
    };
})();
