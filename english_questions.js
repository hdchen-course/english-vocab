/* =====================================================================
 * english_questions.ts  →  (tsc, tsconfig.legacy.json) →  english_questions.js
 * 原為 english_questions.html 的 inline <script>（教學資料 window.CONCEPT）。
 * 逐檔 TS 遷移抽出成 sibling .js；以 IIFE 包住讓 helper 為檔案區域（避免與其他已遷移頁
 *   的同名頂層 helper 如 animCanvas 在 tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。
 * 動畫 teach 步驟用 step.mount 於執行期呼叫 window.Anim.enSentenceBuild（語序變化動畫）；
 *   enSentenceBuild 的 negative 模式是「主詞和動詞之間插 do/does/did+not」的 do-support，
 *   適用 don't/doesn't/didn't；be 動詞的否定（is not=isn't）語序不同（not 在 be 之後），
 *   不套用該動畫，改用靜態對照圖，確保畫面文法正確。
 * 載入順序與原頁一致（本檔取代原 inline 位置）。
 * ===================================================================== */
(function () {
    // ---- 檔案區域：動畫 teach 用的 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）----
    function animCanvas(w, h, label) {
        return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
            'style="width:' + w + 'px;height:' + h + 'px;max-width:100%" ' +
            'role="img" aria-label="' + label + '"></canvas>';
    }
    // ---- 英文專用 SVG 概念圖（資訊文字 fill=currentColor；結構線 currentColor + 透明度）----
    var AC = '#0d9488', FILL = 'rgba(13,148,136,0.12)';
    function arrow(x1, y1, x2, y2, color, w) {
        var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / len, uy = dy / len;
        var s = '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round"/>';
        s += '<polygon points="' + x2 + ',' + y2 + ' ' + (x2 - ux * 11 - uy * 6).toFixed(1) + ',' + (y2 - uy * 11 + ux * 6).toFixed(1) + ' ' + (x2 - ux * 11 + uy * 6).toFixed(1) + ',' + (y2 - uy * 11 - ux * 6).toFixed(1) + '" fill="' + color + '"/>';
        return s;
    }
    // be 動詞否定：be + not → 縮寫（is not=isn't、are not=aren't、I am not=I'm not）
    function beNegMap() {
        var rows = [['is not', "isn't"], ['are not', "aren't"], ['I am not', "I'm not"]];
        var s = '<svg viewBox="0 0 262 168" role="img" aria-label="be 動詞的否定：is not 等於 isn\'t、are not 等於 aren\'t、I am not 等於 I\'m not">';
        var y = 14;
        rows.forEach(function (r) {
            s += '<rect x="8" y="' + y + '" width="118" height="40" rx="10" fill="' + FILL + '" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.8"/>';
            s += '<text x="67" y="' + (y + 26) + '" text-anchor="middle" font-size="15" font-weight="800" fill="currentColor">' + r[0] + '</text>';
            s += arrow(128, y + 20, 160, y + 20, 'currentColor', 3);
            s += '<rect x="162" y="' + y + '" width="92" height="40" rx="10" fill="' + FILL + '" stroke="' + AC + '" stroke-width="2"/>';
            s += '<text x="208" y="' + (y + 26) + '" text-anchor="middle" font-size="16" font-weight="800" fill="currentColor">' + r[1] + '</text>';
            y += 52;
        });
        return s + '</svg>';
    }
    // 掛載 enSentenceBuild 的小工具：回傳清理函式（換頁前由 concept_engine 呼叫 h.stop()）。
    function mountSentence(cfg) {
        return function (host) {
            if (!window.Anim || typeof window.Anim.enSentenceBuild !== 'function')
                return;
            var h = window.Anim.enSentenceBuild(host, cfg);
            return function () { if (h && typeof h.stop === 'function')
                h.stop(); };
        };
    }
    window.CONCEPT = {
        progKey: 'english_questions_v1', practiceHref: 'english_speaking.html',
        lessons: [
            { id: 'be_q', name: 'be 動詞問句與否定', emoji: '🔁', color: '#0d9488', sub: '問句把 be 搬到最前面、否定在 be 後加 not', done: 'be 動詞句：問句把 be（am/is/are）搬到最前面（You are→Are you?）；否定在 be 後面加 not（is not=isn\'t）。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '問句：be 搬到最前面',
                        svg: animCanvas(360, 240, '把直述句 You are happy 改成問句：be 動詞 are 從句子中間滑到句首，變成 Are you happy，句末彈出問號。'),
                        mount: mountSentence({ mode: 'question', from: 'You are happy', tiles: ['Are', 'you', 'happy'] }),
                        text: '句子裡有 <b>be 動詞</b>（am／is／are）時，問問題很簡單：把 <b>be 動詞搬到最前面</b>就好。<b>You are happy.</b> → <b>Are you happy?</b> 不用借 do，句末記得加問號 <b>?</b>。' },
                    { type: 'teach', kicker: '說「不」', title: '否定：在 be 後面加 not',
                        svg: beNegMap(),
                        text: 'be 動詞的句子要說「不」，就在 <b>be 後面加 not</b>，再縮寫起來：<b>is not</b> → <b>isn\'t</b>、<b>are not</b> → <b>aren\'t</b>。只有 am not 不縮成 amn\'t，而是把主詞和 be 縮起來：<b>I am not</b> → <b>I\'m not</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '把這句變問句', eq: 'You are tired.', options: ['Are you tired?', 'You are tired?', 'Do you tired?'], answer: 0,
                        whyWrong: ['', '這還是直述句（句子的順序沒變）；問句要把 are 搬到最前面。', 'tired 配的是 be 動詞 are，不是一般動詞，所以不用借 do。'],
                        why: 'be 動詞句問問題，把 are 移到最前面 → Are you tired?，句末加問號。' },
                    { type: 'quiz', kicker: '想一想', title: '把這句變問句', eq: 'They are happy.', options: ['Are they happy?', 'They are happy?', 'Do they happy?'], answer: 0,
                        whyWrong: ['', '順序沒變就還是直述句；要把 are 搬到句首。', 'happy 配 be 動詞 are，不借 do。'],
                        why: '一樣把 be 動詞 are 搬到最前面 → Are they happy?。' },
                    { type: 'quiz', kicker: '想一想', title: 'She is not（縮寫）＝?', options: ["isn't", "amn't", "don't"], answer: 0,
                        whyWrong: ['', '英文沒有 amn\'t 這個字；am not 要縮成 I\'m not。', 'don\'t 是一般動詞的否定（do not）；be 動詞 is 的否定是 isn\'t。'],
                        why: 'is not 縮寫成 isn\'t（She isn\'t…）。' }
                ] },
            { id: 'do_q', name: '一般動詞問句：do / does', emoji: '🙋', color: '#0891b2', sub: '借 do/does 放句首，後面動詞回原形', done: '一般動詞問句：句首借小幫手 do/does，後面動詞回原形。he/she/it 用 does，其餘用 do（Does she like…? / Do you like…?）。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '借小幫手 do / does',
                        svg: animCanvas(360, 240, '把 She likes pizza 改成問句：Does 飛到句首，likes 的 s 掉落回原形 like，變成 Does she like pizza，句末彈出問號。'),
                        mount: mountSentence({ mode: 'question', helper: 'Does', from: 'She likes pizza' }),
                        text: '一般動詞（like、go、play…）的句子沒有 be 動詞可以搬，就要<b>借一個小幫手 do／does 放到句首</b>。重點：小幫手出場後，<b>動詞要回原形</b>：She <b>likes</b> → <b>Does</b> she <b>like</b>…?（likes 的 -s 掉回 like）。' },
                    { type: 'teach', kicker: '選 do 還是 does', title: '主詞決定：Do 還是 Does',
                        svg: animCanvas(360, 240, '把 They like music 改成問句：Do 飛到句首，變成 Do they like music，句末彈出問號；對照 he/she/it 用 Does。'),
                        mount: mountSentence({ mode: 'question', helper: 'Do', from: 'They like music' }),
                        text: '小幫手要選哪一個看主詞：<b>he／she／it</b>（單數的他／她／它）用 <b>Does</b>；<b>I／you／we／they</b> 用 <b>Do</b>。不管用哪一個，<b>後面的動詞都回原形</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '選出正確的', eq: '___ you like music?', options: ['Do', 'Does', 'Are'], answer: 0,
                        whyWrong: ['', 'Does 只用在 he／she／it；主詞是 you，要用 Do。', 'like 是一般動詞，問句要借 do，不是用 be 動詞 Are。'],
                        why: '主詞 you 配 Do；一般動詞問句借 do 放句首，後面動詞用原形。' },
                    { type: 'quiz', kicker: '想一想', title: '選出正確的（動詞要什麼形式？）', eq: 'Does he ___ to school by bus?', options: ['go', 'goes', 'going'], answer: 0,
                        whyWrong: ['', '句首已經有 Does 了，後面動詞要回原形 go，不能再加 -s。', 'going 要配 be 動詞（is going）；這裡有 Does，動詞回原形 go。'],
                        why: 'Does／Do 後面的動詞一律回原形 → Does he go…?。' },
                    { type: 'quiz', kicker: '想一想', title: '選出正確的', eq: '___ she play the piano?', options: ['Does', 'Do', 'Is'], answer: 0,
                        whyWrong: ['', '主詞是 she（她），要用 Does，不是 Do。', 'play 是一般動詞，問句借 do／does，不用 be 動詞 Is。'],
                        why: 'she 是 he／she／it 之一，用 Does；後面動詞回原形 play。' }
                ] },
            { id: 'dont', name: '一般動詞否定：don\'t / doesn\'t', emoji: '🚫', color: '#0e7490', sub: '借 do/does + not，動詞回原形', done: '一般動詞說「不」：借 don\'t／doesn\'t 放在動詞前面，動詞回原形。he/she/it 用 doesn\'t，其餘用 don\'t。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: 'doesn\'t 放進主詞和動詞之間',
                        svg: animCanvas(360, 240, '把 She likes meat 改成否定句：doesn\'t 插進主詞 She 和動詞之間，likes 的 s 掉落回原形 like，變成 She doesn\'t like meat。'),
                        mount: mountSentence({ mode: 'negative', helper: "doesn't", from: 'She likes meat' }),
                        text: '一般動詞要說「不」，一樣借小幫手：<b>don\'t／doesn\'t</b> 放進<b>主詞和動詞之間</b>。和問句一樣，<b>後面的動詞回原形</b>：She <b>likes</b> meat. → She <b>doesn\'t like</b> meat.（likes 的 -s 掉回 like）。' },
                    { type: 'teach', kicker: '選 don\'t 還是 doesn\'t', title: 'he / she / it 用 doesn\'t',
                        svg: animCanvas(360, 240, '把 They live here 改成否定句：don\'t 插進主詞 They 和動詞 live 之間，變成 They don\'t live here。'),
                        mount: mountSentence({ mode: 'negative', helper: "don't", from: 'They live here' }),
                        text: '一樣看主詞：<b>he／she／it</b> 用 <b>doesn\'t</b>；<b>I／you／we／they</b> 用 <b>don\'t</b>。例：They <b>don\'t live</b> here. 動詞 live 保持原形。' },
                    { type: 'quiz', kicker: '換你試試', title: '選出正確的', eq: 'She ___ eat meat.', options: ["doesn't", "don't", "isn't"], answer: 0,
                        whyWrong: ['', '主詞是 she（她），要用 doesn\'t，不是 don\'t。', 'eat 是一般動詞，否定借 does＋not → doesn\'t；isn\'t 是 be 動詞的否定。'],
                        why: 'she 用 doesn\'t，一般動詞否定借 does＋not，後面動詞回原形（eat）。' },
                    { type: 'quiz', kicker: '想一想', title: '選出正確的', eq: 'They ___ live here.', options: ["don't", "doesn't", "aren't"], answer: 0,
                        whyWrong: ['', 'doesn\'t 只用在 he／she／it；主詞 they 用 don\'t。', 'live 是一般動詞，否定用 don\'t；aren\'t 是 be 動詞的否定。'],
                        why: 'they 用 don\'t → They don\'t live here.，動詞保持原形。' },
                    { type: 'quiz', kicker: '想一想', title: '選出正確的', eq: 'I ___ like coffee.', options: ["don't", "doesn't", "am not"], answer: 0,
                        whyWrong: ['', 'doesn\'t 只用在 he／she／it；主詞 I 用 don\'t。', 'am not 是 be 動詞的否定（I\'m not…）；like 是一般動詞，用 don\'t。'],
                        why: 'I 用 don\'t；一般動詞 like 的否定借 do＋not。' }
                ] },
            { id: 'did', name: '過去式問句與否定：did / didn\'t', emoji: '⏪', color: '#0d9488', sub: '過去用 did/didn\'t，後面動詞回原形', done: '過去的一般動詞：問句用 Did 放句首、否定用 didn\'t；兩種情況後面動詞都回原形（Did you go? / I didn\'t go.）。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '過去問句：Did 放句首',
                        svg: animCanvas(360, 240, '把 You go home 改成過去問句：Did 飛到句首，動詞 go 保持原形，變成 Did you go home，句末彈出問號。'),
                        mount: mountSentence({ mode: 'question', helper: 'Did', from: 'You go home' }),
                        text: '要問<b>過去</b>發生的事（例如 yesterday），一般動詞句就借 <b>Did</b> 放到句首，後面<b>動詞回原形</b>：Did you <b>go</b> home?（不是 went、也不是 goes）。因為「過去」已經由 Did 表示了，動詞不用再變。' },
                    { type: 'teach', kicker: '說「不」', title: '過去否定：didn\'t + 原形',
                        svg: animCanvas(360, 240, '把 I go there 改成過去否定句：didn\'t 插進主詞 I 和動詞 go 之間，變成 I didn\'t go there。'),
                        mount: mountSentence({ mode: 'negative', helper: "didn't", from: 'I go there' }),
                        text: '過去要說「不」，用 <b>didn\'t（did not）</b>放在動詞前面，動詞一樣<b>回原形</b>：I <b>didn\'t go</b> there.（不是 didn\'t went）。不分主詞是誰，過去都用 did／didn\'t。' },
                    { type: 'quiz', kicker: '換你試試', title: '選出正確的', eq: '___ you see the movie yesterday?', options: ['Did', 'Do', 'Were'], answer: 0,
                        whyWrong: ['', 'yesterday 是過去，要用 Did，不是現在的 Do。', 'see 是一般動詞，過去問句借 Did；Were 是 be 動詞。'],
                        why: '過去的一般動詞問句用 Did＋原形動詞 → Did you see…?。' },
                    { type: 'quiz', kicker: '想一想', title: '選出正確的（過去否定）', eq: 'I ___ finish it.', options: ["didn't", "don't", "wasn't"], answer: 0,
                        whyWrong: ['', 'don\'t 是現在的否定；要講過去用 didn\'t。', 'finish 是一般動詞，過去否定用 didn\'t；wasn\'t 是 be 動詞。'],
                        why: '過去否定用 didn\'t＋原形動詞 → I didn\'t finish it.。' },
                    { type: 'quiz', kicker: '想一想', title: '選出正確的（動詞要什麼形式？）', eq: 'Did she ___ to the party?', options: ['go', 'went', 'goes'], answer: 0,
                        whyWrong: ['', '句首已經有 Did 表示過去了，後面動詞要回原形 go，不是 went。', 'Did 後面動詞回原形，不加 -s；goes 錯。'],
                        why: 'Did／didn\'t 後面動詞一律回原形 → Did she go…?。' }
                ] },
            { id: 'wh', name: 'Wh- 問句（What / Where / When…）', emoji: '🔍', color: '#0891b2', sub: '想問細節，用疑問詞開頭', done: '想問「細節」用 Wh- 疑問詞開頭，後面接問句語序：What（什麼）、Where（哪裡）、When（何時）、Who（誰）、Why（為什麼）、How（怎麼）。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: 'Wh- 疑問詞放最前面',
                        svg: animCanvas(360, 240, '在問句 do you live 的最前面加上疑問詞 Where，變成 Where do you live，句末有問號。'),
                        mount: mountSentence({ mode: 'question', whWord: 'Where', from: 'do you live' }),
                        text: 'Yes／No 問句只能答「是或不是」。想問<b>細節</b>（哪裡、何時、為什麼…），就在問句的<b>最前面加一個 Wh- 疑問詞</b>：Do you live here? → <b>Where</b> do you live? 疑問詞放最前面，後面接原本的問句語序。' },
                    { type: 'teach', kicker: '六個常用疑問詞', title: 'be 動詞句也一樣加前面',
                        svg: animCanvas(360, 240, '在問句 is your birthday 的最前面加上疑問詞 When，變成 When is your birthday，句末有問號。'),
                        mount: mountSentence({ mode: 'question', whWord: 'When', from: 'is your birthday' }),
                        text: '六個常用疑問詞：<b>What</b>（什麼）、<b>Where</b>（哪裡）、<b>When</b>（何時）、<b>Who</b>（誰）、<b>Why</b>（為什麼）、<b>How</b>（怎麼／用什麼方式）。be 動詞句也一樣：把疑問詞放最前面 → When <b>is</b> your birthday?。' },
                    { type: 'quiz', kicker: '換你試試', title: '選出正確的（問時間）', eq: '___ is your birthday?', options: ['When', 'Where', 'Who'], answer: 0,
                        whyWrong: ['', 'Where 是問「哪裡」，不是問時間。', 'Who 是問「誰」，不是問時間。'],
                        why: '問時間（什麼時候）用 When。' },
                    { type: 'quiz', kicker: '想一想', title: '選出正確的（問交通方式）', eq: '___ do you go to school?', options: ['How', 'What', 'Why'], answer: 0,
                        whyWrong: ['', 'What 是問「什麼東西」；問「用什麼方式／怎麼去」用 How。', 'Why 是問「為什麼」，不是問方式。'],
                        why: '問方法、交通方式（怎麼去）用 How → How do you go to school?（By bus.）。' },
                    { type: 'quiz', kicker: '想一想', title: '選出正確的（問地方）', eq: '___ is my bag?', options: ['Where', 'When', 'Who'], answer: 0,
                        whyWrong: ['', 'When 是問時間，不是問地方。', 'Who 是問人，不是問地方。'],
                        why: '問地點（在哪裡）用 Where → Where is my bag? (It\'s on the table.)。' },
                    { type: 'quiz', kicker: '想一想', title: '選出正確的（問原因）', eq: '___ are you sad?', options: ['Why', 'What', 'How'], answer: 0,
                        whyWrong: ['', 'What 是問「什麼」，不是問原因。', 'How 是問「怎麼／方式」，不是問原因。'],
                        why: '問原因（為什麼）用 Why → Why are you sad?（Because…）。' }
                ] }
        ]
    };
})();
