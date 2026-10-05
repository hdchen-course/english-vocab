/* =====================================================================
 * english_morphology.ts  →  (tsc, tsconfig.legacy.json) →  english_morphology.js
 * 「英文構詞・自己長單字」教學頁的資料與 SVG 概念圖（window.CONCEPT ＋ 檔案區域 helper）。
 * 以 IIFE 包住讓 helper 為檔案區域（避免與其他已遷移頁的同名頂層 helper 在 tsconfig.legacy
 *   共用全域型別檢查時 TS2393 衝突）。只用檔案內的靜態／分段 SVG（colored morpheme tiles），
 *   不依賴 window.Anim；structure 線用 currentColor、資訊文字一律 fill=currentColor（深色模式安全）。
 * 載入順序：game_core.js → english_morphology.js → concept_engine.js。
 * ===================================================================== */
(function () {
    // ---- 色票：字首(藍) / 字根(teal, 本頁主色) / 字尾(紫)；僅作裝飾性框線，文字一律 currentColor ----
    var AC = '#0d9488';
    var PFX = { s: '#0ea5e9', f: 'rgba(14,165,233,0.14)' }; // prefix
    var ROOT = { s: '#0d9488', f: 'rgba(13,148,136,0.14)' }; // root
    var SFX = { s: '#8b5cf6', f: 'rgba(139,92,246,0.14)' }; // suffix
    function arrowDown(cx, y1, y2) {
        var s = '<line x1="' + cx + '" y1="' + y1 + '" x2="' + cx + '" y2="' + y2 + '" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>';
        s += '<polygon points="' + cx + ',' + y2 + ' ' + (cx - 6) + ',' + (y2 - 10) + ' ' + (cx + 6) + ',' + (y2 - 10) + '" fill="currentColor"/>';
        return s;
    }
    function tileW(m) { return Math.max(52, m.length * 11 + 22); }
    function tile(x, y, w, m, g, col) {
        var cx = x + w / 2;
        var s = '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="46" rx="10" fill="' + col.f + '" stroke="' + col.s + '" stroke-width="2.2"/>';
        s += '<text x="' + cx + '" y="' + (y + 21) + '" text-anchor="middle" font-size="15" font-weight="800" fill="currentColor">' + m + '</text>';
        s += '<text x="' + cx + '" y="' + (y + 38) + '" text-anchor="middle" font-size="11" fill="currentColor">' + g + '</text>';
        return s;
    }
    // 把 parts（字首/字根/字尾磚）相黏，往下黏成一個長單字 ＋ 中文語意合併
    //   parts: [{ m:'un-', g:'不/相反', col:PFX }, ...]；word 組成後的單字；mean 合併後的中文意思
    function wordBuild(parts, word, mean) {
        var x = 10, y = 14, positions = [];
        for (var i = 0; i < parts.length; i++) {
            var w = tileW(parts[i].m);
            positions.push({ x: x, w: w });
            x += w;
            if (i < parts.length - 1)
                x += 26; // 中間留「＋」的空間
        }
        var rowW = x + 10;
        var W = Math.max(rowW, 196);
        var mid = W / 2;
        var aria = parts.map(function (p) { return p.m; }).join(' ＋ ') + ' ＝ ' + word + '（' + mean + '）';
        var s = '<svg viewBox="0 0 ' + W + ' 150" role="img" aria-label="' + aria + '">';
        for (var j = 0; j < parts.length; j++) {
            var p = positions[j];
            s += tile(p.x, y, p.w, parts[j].m, parts[j].g, parts[j].col);
            if (j < parts.length - 1) {
                var plusX = p.x + p.w + 13;
                s += '<text x="' + plusX + '" y="' + (y + 29) + '" text-anchor="middle" font-size="19" font-weight="800" fill="currentColor" opacity="0.75">＋</text>';
            }
        }
        s += arrowDown(mid, 66, 85);
        // 合成結果框
        s += '<rect x="10" y="90" width="' + (W - 20) + '" height="50" rx="12" fill="' + ROOT.f + '" stroke="' + AC + '" stroke-width="2.5"/>';
        s += '<text x="' + mid + '" y="' + 113 + '" text-anchor="middle" font-size="16" font-weight="800" fill="currentColor">' + word + '</text>';
        s += '<text x="' + mid + '" y="' + 132 + '" text-anchor="middle" font-size="12" fill="currentColor">' + mean + '</text>';
        return s + '</svg>';
    }
    // 同字根家族：一個字根 → 一整家單字
    function rootFamily(root, gloss, members) {
        var s = '<svg viewBox="0 0 330 122" role="img" aria-label="字根 ' + root + ' ＝ ' + gloss + '，一整家單字：' + members.map(function (m) { return m.w; }).join('、') + '">';
        s += '<text x="165" y="20" text-anchor="middle" font-size="14" font-weight="800" fill="currentColor">字根 ' + root + ' ＝ ' + gloss + '</text>';
        var xs = [8, 118, 228], w = 94;
        for (var i = 0; i < members.length; i++) {
            var x = xs[i], cx = x + w / 2;
            s += '<rect x="' + x + '" y="34" width="' + w + '" height="56" rx="11" fill="' + ROOT.f + '" stroke="' + AC + '" stroke-width="2"/>';
            s += '<text x="' + cx + '" y="60" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">' + members[i].w + '</text>';
            s += '<text x="' + cx + '" y="80" text-anchor="middle" font-size="11" fill="currentColor">' + members[i].g + '</text>';
        }
        return s + '</svg>';
    }
    window.CONCEPT = {
        progKey: 'english_morphology_v1', practiceHref: 'vocabulary_app.html',
        lessons: [
            { id: 'prefix', name: '字首 prefix（un- / re- / dis- / pre-）', emoji: '🧩', color: '#0ea5e9', sub: '加在單字前面，換掉意思', done: '記得：字首加在前面換意思——un- / dis- ＝ 相反、re- ＝ 再一次、pre- ＝ 之前。字根不變，只是前面多黏一塊。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '字首加在前面，換掉意思', svg: wordBuild([{ m: 'un-', g: '不／相反', col: PFX }, { m: 'happy', g: '開心', col: ROOT }], 'unhappy', '不開心'), text: '<b>字首（prefix）</b>是黏在單字<b>前面</b>的一小塊，會<b>換掉整個字的意思</b>，但後面的<b>字根不變</b>。最常見的是 <b>un-</b>：happy（開心）加上 un- 就變成 <b>unhappy</b>（不開心）。<b>dis-</b> 也是「相反」：like → <b>dislike</b>（不喜歡）。' },
                    { type: 'teach', kicker: '再多看兩個', title: 're- 再一次、pre- 之前', svg: wordBuild([{ m: 're-', g: '再一次', col: PFX }, { m: 'do', g: '做', col: ROOT }], 'redo', '再做一次'), text: '<b>re-</b> ＝ 再一次：do（做）→ <b>redo</b>（再做一次）、play → <b>replay</b>（重播）。<b>pre-</b> ＝ 之前：view（看）→ <b>preview</b>（事先看過、預習）。認得字首，看到長單字先把前面那塊切下來，意思就先猜到一半了。' },
                    { type: 'quiz', kicker: '換你試試', title: 'unhappy 的意思最接近？', options: ['不開心', '很開心', '又開心'], answer: 0, whyWrong: { 1: '那會是 very happy；un- 不是「很」。', 2: '「又」是 again，是 re- 的意思，不是 un-。' }, why: 'un- ＝ 相反，所以 unhappy ＝ 不 happy ＝ 不開心。' },
                    { type: 'quiz', kicker: '想一想', title: '「再做一次」要用哪個字首？do → ___', options: ['redo', 'undo', 'predo'], answer: 0, whyWrong: { 1: 'undo 是「取消剛剛做的」（相反），不是再做一次。', 2: 'predo 不是英文單字。' }, why: 're- ＝ 再一次，所以「再做一次」是 redo。' },
                    { type: 'quiz', kicker: '想一想', title: 'preview ＝「事先看過」，pre- 的意思是？', options: ['之前', '之後', '再一次'], answer: 0, whyWrong: { 1: '「之後」比較像 post-（如 postgame）。', 2: '「再一次」是 re-（如 review 複習）。' }, why: 'pre- ＝ 之前，所以 preview ＝ 事先（之前）看過。' }
                ] },
            { id: 'suffix', name: '字尾 suffix（-er / -ful / -less / -able）', emoji: '🏷️', color: '#8b5cf6', sub: '加在後面，換角色（人／形容詞…）', done: '記得：字尾換角色——-er ＝ 做…的人／物、-ful ＝ 充滿、-less ＝ 沒有、-able ＝ 可以被…。看字尾就能猜「這是人，還是形容詞」。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '-er ＝ 做這件事的人', svg: wordBuild([{ m: 'teach', g: '教', col: ROOT }, { m: '-er', g: '做…的人', col: SFX }], 'teacher', '老師（教的人）'), text: '<b>字尾（suffix）</b>黏在單字<b>後面</b>，常常<b>換掉詞性或角色</b>。<b>-er</b> ＝ 做這件事的人／物：teach（教）→ <b>teacher</b>（老師）、play → <b>player</b>（選手）、work → <b>worker</b>（工人）。' },
                    { type: 'teach', kicker: '三個好用的形容詞字尾', title: '-ful 充滿、-less 沒有、-able 可被…', svg: wordBuild([{ m: 'care', g: '小心', col: ROOT }, { m: '-ful', g: '充滿', col: SFX }], 'careful', '小心的'), text: '<b>-ful</b> ＝ 充滿：care（小心）→ <b>careful</b>（小心的）。<b>-less</b> ＝ 沒有：care → <b>careless</b>（粗心的，少了小心）。<b>-able</b> ＝ 可以被…：break（打破）→ <b>breakable</b>（易碎的、可被打破的）。這些字尾都讓單字變成<b>形容詞</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: 'a person who teaches is a ___', options: ['teacher', 'teachful', 'teachless'], answer: 0, whyWrong: { 1: '-ful 是「充滿」，不會用來指人，teachful 不是英文字。', 2: '-less 是「沒有」，teachless 不是英文字。' }, why: '-er ＝ 做這件事的人，teach → teacher（老師）。' },
                    { type: 'quiz', kicker: '想一想', title: 'careless 的意思是？', options: ['粗心、沒在小心', '很小心', '可以小心'], answer: 0, whyWrong: { 1: '「很小心」是 careful（-ful 充滿）。', 2: '-less 不是「可以」；「可以被…」是 -able。' }, why: '-less ＝ 沒有，care + less ＝ 少了小心 ＝ 粗心。' },
                    { type: 'quiz', kicker: '想一想', title: 'breakable 的 -able 是什麼意思？', options: ['可以被…（易碎的）', '沒有、少了…', '做…的人'], answer: 0, whyWrong: { 1: '「沒有」是 -less。', 2: '「做…的人」是 -er。' }, why: '-able ＝ 可以被…，break + able ＝ 可以被打破 ＝ 易碎的。' }
                ] },
            { id: 'root', name: '字根 root（port / spect / dict）', emoji: '🌳', color: '#0d9488', sub: '一個核心意思，串起一整家單字', done: '字首＋字根＋字尾一拆開，長單字也能自己猜意思——這就是「自己長單字」的能力！port ＝ 攜帶、spect ＝ 看、dict ＝ 說。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '字根是單字的「核心意思」', svg: wordBuild([{ m: 'trans-', g: '橫越', col: PFX }, { m: 'port', g: '攜帶', col: ROOT }], 'transport', '運輸'), text: '很多單字共用同一個<b>字根（root）</b>核心意思。<b>port</b> ＝ 攜帶／搬運：trans-（橫越）＋ port ＝ <b>transport</b>（把東西搬過去 ＝ 運輸）。認得一個字根，常常能一次看懂<b>一整家</b>單字。' },
                    { type: 'teach', kicker: '一個字根，一家人', title: 'port 這一家：import / export / transport', svg: rootFamily('port', '攜帶／搬運', [{ w: 'import', g: '進口' }, { w: 'export', g: '出口' }, { w: 'transport', g: '運輸' }]), text: '只要抓住 <b>port ＝ 攜帶</b>，這一家都看得懂：<b>import</b>（往內搬 ＝ 進口）、<b>export</b>（往外搬 ＝ 出口）、<b>transport</b>（搬過去 ＝ 運輸）。再看兩個常見字根：<b>spect</b> ＝ 看（inspect 檢查、respect 尊重），<b>dict</b> ＝ 說（dictionary 字典、predict 預測）。' },
                    { type: 'quiz', kicker: '換你試試', title: 'import / export / transport 共用的字根 port 意思是？', options: ['攜帶／搬運', '看', '說'], answer: 0, whyWrong: { 1: '「看」是字根 spect（inspect、respect）。', 2: '「說」是字根 dict（dictionary、predict）。' }, why: 'port ＝ carry（攜帶／搬運），所以這三個字都和「把東西搬來搬去」有關。' },
                    { type: 'quiz', kicker: '想一想', title: 'predict 裡的 dict 意思接近？（pre- ＝ 之前）', options: ['說（事先說 ＝ 預測）', '看', '寫'], answer: 0, whyWrong: { 1: '「看」是 spect，不是 dict。', 2: 'dict 是「說」不是「寫」；「寫」比較像 scrib/script。' }, why: 'dict ＝ 說，pre-（之前）＋ dict（說）＝ 事先說出來 ＝ 預測。' },
                    { type: 'quiz', kicker: '想一想', title: 'inspect 和 respect 共用的字根 spect ＝？', options: ['看', '聽', '跑'], answer: 0, whyWrong: { 1: '「聽」不是 spect；spect 和「眼睛／看」有關。', 2: '「跑」和 spect 無關。' }, why: 'spect ＝ 看：inspect（往裡看 ＝ 檢查）、respect（再看一眼、看重 ＝ 尊重）。' },
                    { type: 'quiz', kicker: '最後一題', title: 'dict ＝ 說，那 dictionary 最可能是什麼？', options: ['一本告訴你字詞「怎麼說、什麼意思」的書', '一台看東西的機器', '一個跑步的地方'], answer: 0, whyWrong: { 1: '「看」的字根是 spect，不是 dict。', 2: 'dictionary 和跑步無關。' }, why: 'dict ＝ 說，dictionary 就是收錄字詞「怎麼說、什麼意思」的書 ＝ 字典。' }
                ] }
        ]
    };
})();
