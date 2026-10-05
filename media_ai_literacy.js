/* =====================================================================
 * media_ai_literacy.ts  →  (tsc, tsconfig.legacy.json) →  media_ai_literacy.js
 * 原為 media_ai_literacy.html 的 inline <script>；逐檔 TS 遷移抽出成 sibling .js。
 * 行為與原 inline 版等價（verbatim；載入位置不變＝執行時機/順序不變）。
 * 以 IIFE 包住讓頂層名稱為檔案區域（避免 tsc 共用全域型別檢查時與他檔同名衝突）。
 * ===================================================================== */
(function () {
    /* ---- media_ai_literacy 專用：檔案區域 static SVG helper（文字用 currentColor，亮暗皆清楚；
     *       流程箭頭止於方框邊緣＝node-link #29；本頁用 static/stepped SVG，不載入 anim_core.js、無 window.Anim）---- */
    var MA_PURPLE = '#9333ea';
    function maTone(t) { return t === 'ok' ? '#16a34a' : t === 'warn' ? '#d97706' : t === 'bad' ? '#dc2626' : MA_PURPLE; }
    // 編號流程圖（左→右；箭頭由方框右緣連到下一框左緣，不穿入框內）
    function maFlow(title, items) {
        var n = items.length, W = 300, pad = 10, g = 16, H = 150, top = 46, bh = 84;
        var bw = (W - 2 * pad - (n - 1) * g) / n, midY = top + bh / 2;
        var names = items.map(function (it) { return it.label; }).join('、');
        var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + title + '：' + names + '">';
        s += '<text x="150" y="20" text-anchor="middle" font-size="12.5" font-weight="800" fill="' + MA_PURPLE + '">' + title + '</text>';
        for (var i = 0; i < n; i++) {
            var bx = pad + i * (bw + g), cx = bx + bw / 2;
            s += '<rect x="' + bx.toFixed(1) + '" y="' + top + '" width="' + bw.toFixed(1) + '" height="' + bh + '" rx="10" fill="none" stroke="' + MA_PURPLE + '" stroke-width="2"/>';
            s += '<circle cx="' + (bx + 13).toFixed(1) + '" cy="' + (top + 13) + '" r="9" fill="' + MA_PURPLE + '"/>';
            s += '<text x="' + (bx + 13).toFixed(1) + '" y="' + (top + 17) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">' + (i + 1) + '</text>';
            var lf = n >= 4 ? 13 : 14;
            s += '<text x="' + cx.toFixed(1) + '" y="' + (top + 48) + '" text-anchor="middle" font-size="' + lf + '" font-weight="800" fill="currentColor">' + items[i].label + '</text>';
            if (items[i].sub)
                s += '<text x="' + cx.toFixed(1) + '" y="' + (top + 68) + '" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.72">' + items[i].sub + '</text>';
            if (i < n - 1) {
                var x1 = bx + bw, x2 = bx + bw + g;
                s += '<line x1="' + x1.toFixed(1) + '" y1="' + midY + '" x2="' + (x2 - 5).toFixed(1) + '" y2="' + midY + '" stroke="' + MA_PURPLE + '" stroke-width="2"/>';
                s += '<polygon points="' + x2.toFixed(1) + ',' + midY + ' ' + (x2 - 6).toFixed(1) + ',' + (midY - 4) + ' ' + (x2 - 6).toFixed(1) + ',' + (midY + 4) + '" fill="' + MA_PURPLE + '"/>';
            }
        }
        return s + '</svg>';
    }
    // 一排概念卡（emoji ＋ 短標題，邊框顏色依語氣）
    function maCards(title, items) {
        var n = items.length, W = 300, pad = 10, g = 12, H = 152, top = 42, ch = 96;
        var cw = (W - 2 * pad - (n - 1) * g) / n;
        var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + title + '：' + items.map(function (it) { return it.label; }).join('、') + '">';
        s += '<text x="150" y="20" text-anchor="middle" font-size="12.5" font-weight="800" fill="' + MA_PURPLE + '">' + title + '</text>';
        for (var i = 0; i < n; i++) {
            var x0 = pad + i * (cw + g), cx = x0 + cw / 2, col = maTone(items[i].tone);
            s += '<rect x="' + x0.toFixed(1) + '" y="' + top + '" width="' + cw.toFixed(1) + '" height="' + ch + '" rx="12" fill="none" stroke="' + col + '" stroke-width="2"/>';
            s += '<text x="' + cx.toFixed(1) + '" y="' + (top + 42) + '" text-anchor="middle" font-size="24">' + items[i].emoji + '</text>';
            var lf = n >= 4 ? 12 : 13;
            s += '<text x="' + cx.toFixed(1) + '" y="' + (top + 74) + '" text-anchor="middle" font-size="' + lf + '" font-weight="700" fill="currentColor">' + items[i].label + '</text>';
        }
        return s + '</svg>';
    }
    // 兩欄對照（左 vs 右）
    function maVs(title, l, r) {
        var W = 300, H = 152, top = 40, ph = 98, pw = 128, lx = 10, rx = W - 10 - pw;
        function panel(x, o) {
            var cx = x + pw / 2, col = maTone(o.tone);
            var t = '<rect x="' + x + '" y="' + top + '" width="' + pw + '" height="' + ph + '" rx="12" fill="none" stroke="' + col + '" stroke-width="2"/>';
            t += '<text x="' + cx + '" y="' + (top + 40) + '" text-anchor="middle" font-size="26">' + o.emoji + '</text>';
            t += '<text x="' + cx + '" y="' + (top + 68) + '" text-anchor="middle" font-size="13" font-weight="800" fill="currentColor">' + o.label + '</text>';
            if (o.sub)
                t += '<text x="' + cx + '" y="' + (top + 88) + '" text-anchor="middle" font-size="10" fill="currentColor" opacity="0.72">' + o.sub + '</text>';
            return t;
        }
        var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + title + '：' + l.label + ' 相對 ' + r.label + '">';
        s += '<text x="150" y="20" text-anchor="middle" font-size="12.5" font-weight="800" fill="' + MA_PURPLE + '">' + title + '</text>';
        s += panel(lx, l) + panel(rx, r);
        s += '<text x="150" y="' + (top + ph / 2 + 5) + '" text-anchor="middle" font-size="13" font-weight="800" fill="' + MA_PURPLE + '">？</text>';
        return s + '</svg>';
    }
    // 「同一張圖被挪用」示意：反向圖片搜尋＋核對日期
    function maImageReuse() {
        var W = 300, H = 160;
        var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="同一張圖最早出現在很久以前，卻被挪用當成剛發生的新事件；用反向圖片搜尋查最早出處、核對日期">';
        s += '<text x="150" y="18" text-anchor="middle" font-size="12" font-weight="800" fill="' + MA_PURPLE + '">反向圖片搜尋：查這張圖最早出現在哪</text>';
        function photo(x) {
            var t = '<rect x="' + x + '" y="34" width="96" height="60" rx="6" fill="none" stroke="#94a3b8" stroke-width="2"/>';
            t += '<circle cx="' + (x + 24) + '" cy="54" r="9" fill="none" stroke="#d97706" stroke-width="2.5"/>';
            t += '<polygon points="' + (x + 40) + ',86 ' + (x + 66) + ',52 ' + (x + 92) + ',86" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linejoin="round"/>';
            return t;
        }
        s += photo(16) + photo(188);
        s += '<text x="150" y="56" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">同一張圖</text>';
        s += '<text x="150" y="80" text-anchor="middle" font-size="16">🔍</text>';
        s += '<text x="64" y="112" text-anchor="middle" font-size="10.5" font-weight="700" fill="#16a34a">最早：很久以前</text>';
        s += '<text x="64" y="128" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.75">真正的出處</text>';
        s += '<text x="236" y="112" text-anchor="middle" font-size="10.5" font-weight="700" fill="#dc2626">被說成：剛發生 ✗</text>';
        s += '<text x="236" y="128" text-anchor="middle" font-size="9.5" fill="currentColor" opacity="0.75">舊圖被挪用</text>';
        s += '<text x="150" y="150" text-anchor="middle" font-size="10.5" font-weight="700" fill="currentColor">查它最早出現在哪、對一下日期</text>';
        return s + '</svg>';
    }
    var C = { "progKey": "media_ai_concepts_v1", "practiceHref": "digital_citizenship.html", "lessons": [{ "id": "ml_ads", "name": "廣告與業配", "emoji": "📣", "sub": "看穿「想賣你東西」的訊息", "done": "記住這句：有人想賣你東西時，話要打點折扣聽。", "steps": [{ "type": "teach", "kicker": "這個本領", "title": "有些訊息其實是想賣東西", "text": "我們每天看到的內容，不是每一則都在單純告訴你事實。<b>廣告、置入、業配（有人收錢幫忙推薦）</b>的目的是<b>希望你去買、去下載、去點</b>。它們常把「我覺得很好」的<b>意見</b>，說得像「它真的最好」的<b>事實</b>。學會分辨，你才不會被牽著走。" }, { "type": "teach", "kicker": "怎麼做", "title": "先問「誰付錢、想要我做什麼」", "text": "看到超好康的推薦，先想兩件事：<b>「這是不是有人收錢在推薦？」「它希望我掏錢或點擊嗎？」</b>影片或貼文出現<b>「合作」「贊助」「業配」「廣告」</b>這類標示，就是提醒你這是商業訊息。你可以照樣參考，但要<b>把它當一種說法，再多找幾個沒收錢的意見比較</b>。" }, { "type": "quiz", "kicker": "換你試試", "title": "一支影片一直說某款筆記本「全世界最好用、學生都該買」，畫面角落標著「贊助」", "options": ["標著贊助，代表有人付錢推薦，先當一種說法，再找沒收錢的評價比較", "很多人拍它，一定最好用，馬上叫爸媽買", "它說學生都該買，那我不買就落伍了"], "answer": 0, "why": "標示「贊助」代表這是收錢的商業推薦，內容會偏向促成購買；把「最好用」當成意見而非事實，再參考沒收錢的評價，判斷才會比較準。" }], "color": "#9333ea" }, { "id": "ml_clickbait", "name": "標題殺人", "emoji": "🎣", "sub": "聳動標題常誇大或斷章取義", "done": "記住這句：看完內容再決定信不信、要不要分享。", "steps": [{ "type": "teach", "kicker": "這個本領", "title": "聳動的標題是「魚餌」", "text": "有些標題會<b>故意誇大、賣關子、嚇你一跳</b>，像「太可怕了！」「看到最後我哭了」「99%的人都不知道」。這叫<b>標題殺人（clickbait）</b>，目的是騙你點進去。點進去後常會發現<b>內容和標題差很多，甚至只是把一句話斷章取義</b>。" }, { "type": "teach", "kicker": "怎麼做", "title": "先看完內容，再回頭對照標題", "text": "別只看標題就相信或轉發。<b>先把內容看完</b>，再問自己：<b>「內容真的有支持這個標題嗎？」「是不是只挑了一句話來放大？」</b>如果標題很嚇人、內容卻很空，或找不到清楚的出處，這則消息就要<b>先打個問號</b>，不急著相信。" }, { "type": "quiz", "kicker": "換你試試", "title": "一則標題寫「震驚！這種水果千萬別吃」，你有點被嚇到", "options": ["標題太可怕了，先轉給家人叫大家別吃", "先看完內容，看它有沒有可靠證據支持標題，再決定信不信", "光看標題就夠嚇人，直接相信不用點進去"], "answer": 1, "why": "聳動標題常為了吸引點擊而誇大，內容不一定支持它；看完內容並檢查有沒有可靠證據，才能判斷這則消息是否可信。" }], "color": "#9333ea" }, { "id": "ml_source", "name": "一手消息與二手消息", "emoji": "🧭", "sub": "找出最先說這件事的人", "done": "記住這句：「朋友傳的」不是來源，找到最先說的人才算。", "steps": [{ "type": "teach", "kicker": "這個本領", "title": "消息也分「第一手」和「轉來轉去」", "text": "<b>一手消息</b>是<b>最先、直接知道這件事的來源</b>，例如當事人、官方網站、原始的研究或新聞。<b>二手消息</b>是<b>別人轉述、再轉傳的版本</b>。消息每被轉一次，就可能<b>被改一點、漏一點或誤會一點</b>。「朋友傳的」「群組說的」「網路上看到的」都<b>不算來源</b>。" }, { "type": "teach", "kicker": "怎麼做", "title": "往回找源頭，再多方對照", "text": "看到一則消息，試著<b>往回找：是誰最先說的？在哪裡發布的？是什麼時候的事？</b>再<b>換別的可靠地方查查看，是不是也這樣說</b>。找得到清楚的原始來源、日期又對得上、多個地方說法一致，這則消息才比較可信。" }, { "type": "quiz", "kicker": "換你試試", "title": "群組轉來一張圖說「明天全國停課」，沒有寫是誰發布、也沒有日期", "options": ["群組都在傳，先跟著轉出去提醒大家", "去官方或可靠新聞查原始來源和日期，確認後再說", "反正是朋友傳的，朋友不會騙我，直接相信"], "answer": 1, "why": "「群組傳的、朋友傳的」都是轉述，不算來源；停課這類重要消息應回到官方等原始來源，並核對日期，確認後再相信或轉發。" }], "color": "#9333ea" }, { "id": "ml_ai_wrong", "name": "AI 也會一本正經說錯", "emoji": "🤖", "sub": "AI 是幫手，不是真理", "done": "記住這句：AI 說得很有把握，也要自己再查證。", "steps": [{ "type": "teach", "kicker": "這個本領", "title": "AI 很厲害，但不是每次都對", "text": "AI 聊天機器人可以幫你想點子、解釋東西、練習寫作，是很好用的幫手。但它有一個特點：<b>它可能講得很有自信，內容卻是錯的，甚至會「編造」出看起來很真的答案</b>（大人叫它 hallucination，胡亂生成）。<b>說得很肯定，不代表就是對的。</b>" }, { "type": "teach", "kicker": "怎麼做", "title": "把 AI 當幫手，重要的事自己再確認", "text": "用 AI 查資料時，記得：<b>把它的回答當成「參考」，不是「標準答案」</b>。遇到<b>重要或會影響決定的事</b>（功課要交的事實、健康、安全、數字），要<b>自己再查可靠來源，或問大人、問老師</b>。發現它說錯也很正常，你可以<b>請它舉出來源，再自己核對</b>。" }, { "type": "quiz", "kicker": "換你試試", "title": "你問 AI 一個歷史日期，它答得很肯定，但你要拿去交報告", "options": ["AI 講得很有把握，直接抄進報告就好", "再查可靠來源或問老師核對，確認正確再寫進報告", "AI 一定比課本新，課本就不用看了"], "answer": 1, "why": "AI 可能自信地給出編造或錯誤的答案，語氣肯定不代表正確；重要的事再用可靠來源或老師核對，才能避免把錯誤資訊當成事實。" }], "color": "#9333ea" }, { "id": "ml_deepfake", "name": "AI 生成的圖片與影片", "emoji": "🎭", "sub": "看起來很真，不等於是真的", "done": "記住這句：一張圖、一段影片，別急著全信或轉發。", "steps": [{ "type": "teach", "kicker": "這個本領", "title": "AI 能做出很逼真的假畫面", "text": "現在用 AI 可以做出<b>很像真的假圖片、假影片，甚至模仿某個人的聲音</b>，這種假東西常被叫做<b>deepfake（深偽）</b>。它可能讓某個人「說了他根本沒說的話」，或做出沒發生過的事。以前我們覺得「有圖有真相」，<b>現在光憑一張圖或一段影片，已經不能證明事情是真的</b>。" }, { "type": "teach", "kicker": "怎麼做", "title": "多看幾個可靠來源再判斷", "text": "看到很誇張、很爆炸性的圖片或影片，先<b>別因為「看起來很真」就完全相信、也先別急著轉</b>。可以<b>查查看可靠的新聞或官方，有沒有同一件事的報導</b>；留意畫面有沒有<b>怪怪的地方（手指、文字、光影怪異）</b>。真的重要就<b>問大人一起判斷</b>。這不是要你什麼都不信，而是<b>多看幾個來源再下結論</b>。" }, { "type": "quiz", "kicker": "換你試試", "title": "你看到一段影片，某位名人說了很誇張的話，畫面看起來很真", "options": ["畫面很清楚，一定是真的，趕快轉給朋友看", "AI 可能做出逼真的假影片，先查可靠新聞求證再說", "反正很好笑，是真是假不重要，先轉再說"], "answer": 1, "why": "AI 能生成看起來很真的假影片與假聲音，「畫面逼真」無法證明內容為真；先到可靠新聞或官方求證，才不會被深偽影片誤導或幫忙散播。" }], "color": "#9333ea" }, { "id": "ml_algorithm", "name": "演算法與同溫層", "emoji": "🫧", "sub": "你看到的只是被挑過的一小部分", "done": "記住這句：主動去看不同說法，才看得到全貌。", "steps": [{ "type": "teach", "kicker": "這個本領", "title": "App 會一直餵你「愛看的」", "text": "影音和社群平台背後有<b>演算法</b>，它會記住你點過、看久的東西，然後<b>一直推更多類似的給你</b>。這樣很方便，但也會讓你<b>一直待在只有相同想法的圈子裡</b>，這叫<b>同溫層</b>。看久了容易以為<b>「大家都這樣想」</b>，其實那只是<b>被挑給你看的一小部分</b>。" }, { "type": "teach", "kicker": "怎麼做", "title": "主動去看看不一樣的說法", "text": "提醒自己：<b>你看到的內容是被挑過的，不是世界的全部</b>。遇到一件事，可以<b>主動找找不同立場、不同來源怎麼說</b>，也可以想想<b>「有沒有人會有別的看法？」</b>。這樣不是要你放棄自己的想法，而是<b>多聽幾種聲音，判斷才會更完整、更公平</b>。" }, { "type": "quiz", "kicker": "換你試試", "title": "你的影音首頁全是「同一種觀點」的影片，讓你覺得大家都這麼想", "options": ["首頁都這樣演，代表全世界都同意，不用再想", "知道這是演算法挑給我的，主動找找不同說法再判斷", "別人的看法不重要，我只看我喜歡的就好"], "answer": 1, "why": "演算法會不斷推播你愛看的內容，形成同溫層，讓人誤以為那是所有人的想法；主動接觸不同來源與立場，才能看到較完整的全貌。" }], "color": "#9333ea" }, { "id": "ml_share", "name": "分享前先想一想", "emoji": "🔁", "sub": "假消息靠轉發擴散", "done": "記住這句：不確定就先不轉，查證後再說。", "steps": [{ "type": "teach", "kicker": "這個本領", "title": "轉發一下，也可能幫了假消息", "text": "假消息會傳開，很多時候是因為<b>大家好心「順手轉一下」</b>。你按下分享的那一刻，等於<b>幫它多送到很多人面前</b>。就算你是出於好意想提醒別人，<b>轉到錯的消息，還是可能害別人白擔心、被騙，或做出錯誤決定</b>。" }, { "type": "teach", "kicker": "怎麼做", "title": "養成「先停一下」的習慣", "text": "看到想轉的消息，先做三步：<b>一、停一下，別馬上轉；二、想想「這是誰說的、查得到原始來源嗎」；三、不確定就先不轉，去查證或問信任的大人</b>。<b>寧可慢一點、少轉一則，也不要幫忙散播假消息。</b>真的想提醒別人，也可以先幫忙查清楚再說。" }, { "type": "quiz", "kicker": "換你試試", "title": "你收到一則「很緊急」的警告消息，想趕快轉發提醒大家，但來源不清楚", "options": ["很緊急，先轉了再說，晚了就來不及", "先停下來查證來源，不確定就先不轉、問信任的大人", "反正是提醒大家，就算假的也沒差"], "answer": 1, "why": "假消息常靠「緊急」催人快轉來擴散，來源不清就轉發可能害別人白擔心或受騙；先停下來查證、不確定不轉，才是負責任的做法。" }], "color": "#9333ea" }] };
    // ---- 既有 7 課的 14 個 teach step 補 static SVG（viz-everywhere：teach step 不留 svg:""）----
    var _byId = {};
    C.lessons.forEach(function (x) { _byId[x.id] = x; });
    _byId.ml_ads.steps[0].svg = maCards('這些訊息想賣你東西', [{ emoji: '📣', label: '廣告', tone: 'warn' }, { emoji: '🤝', label: '業配', tone: 'warn' }, { emoji: '🛒', label: '要你買', tone: 'bad' }]);
    _byId.ml_ads.steps[1].svg = maCards('看到這些標示要留意', [{ emoji: '🏷️', label: '合作', tone: 'warn' }, { emoji: '🏷️', label: '贊助', tone: 'warn' }, { emoji: '🏷️', label: '業配', tone: 'warn' }, { emoji: '🏷️', label: '廣告', tone: 'warn' }]);
    _byId.ml_clickbait.steps[0].svg = maCards('標題殺人的魚餌手法', [{ emoji: '😱', label: '誇大嚇你', tone: 'bad' }, { emoji: '🤐', label: '賣關子', tone: 'bad' }, { emoji: '🪝', label: '99%不知道', tone: 'bad' }]);
    _byId.ml_clickbait.steps[1].svg = maFlow('先看內容再決定', [{ label: '看完內容', sub: '別只看標題' }, { label: '對照標題', sub: '有證據嗎' }, { label: '空洞就打問號', sub: '先不信' }]);
    _byId.ml_source.steps[0].svg = maVs('消息分兩種', { emoji: '🧭', label: '一手消息', sub: '最先直接知道', tone: 'ok' }, { emoji: '🔁', label: '二手消息', sub: '轉述再轉傳', tone: 'warn' });
    _byId.ml_source.steps[1].svg = maFlow('往回找源頭', [{ label: '誰最先說', sub: '當事人' }, { label: '在哪發布', sub: '官方？' }, { label: '什麼時候', sub: '對日期' }, { label: '多方對照', sub: '換處查' }]);
    _byId.ml_ai_wrong.steps[0].svg = maCards('AI 的特點', [{ emoji: '🤖', label: '很有自信', tone: 'neutral' }, { emoji: '❓', label: '可能編造', tone: 'warn' }, { emoji: '⚠️', label: '不一定對', tone: 'bad' }]);
    _byId.ml_ai_wrong.steps[1].svg = maFlow('把 AI 當幫手', [{ label: 'AI 的回答', sub: '當參考' }, { label: '重要就再查', sub: '可靠來源' }, { label: '問大人老師', sub: '一起確認' }]);
    _byId.ml_deepfake.steps[0].svg = maCards('AI 能做出假的', [{ emoji: '🖼️', label: '假圖片', tone: 'bad' }, { emoji: '🎬', label: '假影片', tone: 'bad' }, { emoji: '🔊', label: '假聲音', tone: 'bad' }]);
    _byId.ml_deepfake.steps[1].svg = maFlow('多看幾個來源', [{ label: '先別急著信', sub: '畫面會騙人' }, { label: '查可靠來源', sub: '有無報導' }, { label: '怪處＋問大人', sub: '手指光影' }]);
    _byId.ml_algorithm.steps[0].svg = maFlow('同溫層怎麼形成', [{ label: '愛看什麼', sub: '平台記住' }, { label: '一直推類似', sub: '越看越多' }, { label: '只剩一種聲音', sub: '以為大家都這樣' }]);
    _byId.ml_algorithm.steps[1].svg = maFlow('主動看看不同', [{ label: '這是被挑過的', sub: '不是全部' }, { label: '找不同說法', sub: '別的來源' }, { label: '多聽幾種', sub: '更完整' }]);
    _byId.ml_share.steps[0].svg = maCards('順手轉的風險', [{ emoji: '🔁', label: '順手轉', tone: 'warn' }, { emoji: '📨', label: '送到很多人', tone: 'warn' }, { emoji: '⚠️', label: '可能是假的', tone: 'bad' }]);
    _byId.ml_share.steps[1].svg = maFlow('分享前先停一下', [{ label: '停一下', sub: '別馬上轉' }, { label: '想來源', sub: '查得到嗎' }, { label: '不確定不轉', sub: '先查或問' }]);
    // ---- 新增：查證方法論（HOW 總流程），插在 ml_share 之前 ----
    var L_new1 = {
        id: 'ml_verify_steps', name: '查證四步', emoji: '🔎', color: '#9333ea',
        sub: '不管哪種消息，都能用這四步「先查再信」',
        done: '記住這句：先停、找來源、追原始、多方比對——先查再信，不急著轉。',
        steps: [
            { type: 'teach', kicker: '這個本領', title: '任何消息，都能用「查證四步」檢查',
                text: '每天都有各種消息湧進來，不可能每則都全信或全不信。可以養成一套固定的檢查流程：<b>① 停一下</b>（先別急著相信、也先別轉）→ <b>② 找來源</b>（這是誰說的？是不是官方或專業的？）→ <b>③ 追到原始</b>（往回找最先、直接發布這件事的那一手）→ <b>④ 多方比對</b>（換兩個可靠的地方看，說法是不是一致）。<b>先查，再決定信不信。</b>',
                svg: maFlow('查證四步', [{ label: '停一下', sub: '別急著信' }, { label: '找來源', sub: '誰說的' }, { label: '追原始', sub: '找第一手' }, { label: '多方比對', sub: '換處對照' }]) },
            { type: 'teach', kicker: '怎麼做', title: '四步適用任何消息（也別忘了對日期）',
                text: '不管是<b>新聞、群組訊息、影片還是廣告</b>，都能套用這四步快速檢查，愈重要的消息愈值得多花一點時間。還有一個常被忽略的小提醒：<b>要對一下日期</b>——有些<b>很舊的事情，會被重新拿出來當成剛發生的新聞</b>，核對發布時間就能拆穿。查清楚了再相信、再分享，才不會被牽著走。',
                svg: maCards('不管哪種消息都先走四步', [{ emoji: '📰', label: '新聞', tone: 'neutral' }, { emoji: '💬', label: '群組訊息', tone: 'neutral' }, { emoji: '🎬', label: '影片', tone: 'neutral' }, { emoji: '📣', label: '廣告', tone: 'neutral' }]) },
            { type: 'quiz', kicker: '換你試試', title: '收到一則驚人消息，查證四步的「第一步」是？',
                options: ['先停一下，別急著相信或轉發', '馬上轉給大家', '先罵發文的人', '先截圖收藏'],
                answer: 0,
                whyWrong: ['', '先轉再說，會把還沒查證的消息擴散出去，可能幫了假消息。', '發文的人對不對都還不知道，罵人沒辦法幫你判斷消息真假。', '收藏不等於查證，重點是先停下來、再動手去查。'],
                why: '先「停」一下，才有空間冷靜判斷，避免被驚訝或情緒帶著就相信、就轉發。' },
            { type: 'quiz', kicker: '換你試試', title: '「追到原始」指的是？',
                options: ['往回找最先、直接發布這件事的那一手來源', '找最多人轉的版本', '找最聳動的標題', '找朋友問一問'],
                answer: 0,
                whyWrong: ['', '轉得最多的通常是二手、三手版本，每轉一次都可能被改掉或漏掉一點。', '聳動的標題是為了吸引點擊，不代表接近原始的事實。', '朋友多半也是聽來的，問到的常常還是轉述，不是最原始的來源。'],
                why: '一手來源（最先、直接發布的人或官方）最可靠；轉述每多一手，就可能失真一點。' }
        ]
    };
    var L_new2 = {
        id: 'ml_image_date', name: '查圖片與日期', emoji: '🖼️', color: '#9333ea',
        sub: '舊照片被配上新事件？查最早出處、對一下日期',
        done: '記住這句：圖會被挪用，查它最早出現在哪、再對一下日期。',
        steps: [
            { type: 'teach', kicker: '這個本領', title: '同一張圖，可能被配上不是它的事件',
                text: '一張看起來很震撼的照片瘋傳，不代表它就是這次事件的照片。<b>同一張舊照片，常被挪用來配上一個新事件</b>，讓人誤會。有個好用的概念叫<b>反向圖片搜尋</b>：把這張圖拿去搜，看它<b>最早出現在哪、是什麼時候、原本是什麼事</b>。配合<b>看發布日期</b>，就能初步判斷它是不是被挪用的舊圖。',
                svg: maImageReuse() },
            { type: 'teach', kicker: '怎麼做', title: '查最早出處、核對日期',
                text: '看到瘋傳的照片，可以先<b>用反向圖片搜尋查它最早出現在哪</b>，再<b>對一下日期</b>。如果這張圖<b>很早以前就出現過、原本是別的事件</b>，那它多半是<b>舊圖被拿來配新事件</b>。<b>查到真正的日期與出處，就能拆穿「舊事新傳」</b>，不會跟著誤會或幫忙散播。',
                svg: maVs('日期為什麼重要', { emoji: '📅', label: '查到真正日期', sub: '其實是以前的事', tone: 'ok' }, { emoji: '🆕', label: '被當成剛發生', sub: '舊事新傳 ✗', tone: 'bad' }) },
            { type: 'quiz', kicker: '換你試試', title: '一張「災難現場」照片瘋傳，怎麼初步檢查它是不是舊圖挪用？',
                options: ['用反向圖片搜尋，看它最早出現在哪、什麼時候', '看它清不清楚', '看有多少人轉', '看它可不可怕'],
                answer: 0,
                whyWrong: ['', '清不清楚看不出它是不是舊圖；模糊或清楚的照片都可能被挪用。', '轉的人多只代表傳得廣，不代表它就是這次事件的真照片。', '可不可怕是感覺，沒辦法證明這張照片的來源和時間。'],
                why: '反向圖片搜尋可以找到這張圖最早出現在哪、對應的原始事件與日期，判斷它是不是被挪用。' },
            { type: 'quiz', kicker: '換你試試', title: '同一則消息該不該信，日期為什麼重要？',
                options: ['舊聞可能被當成剛發生的事重傳，日期能揭穿', '日期不重要', '日期越舊越可信', '只看標題就好'],
                answer: 0,
                whyWrong: ['', '日期能看出是不是舊事被當成剛發生，其實很重要。', '日期越舊不代表越可信，反而要小心是舊聞被重傳。', '只看標題最容易被誤導，日期和內容都要一起看。'],
                why: '核對日期可以拆穿「舊事新傳」——舊的事情被重新包裝成剛發生的新聞來騙人。' }
        ]
    };
    var _shareIdx = C.lessons.indexOf(_byId.ml_share);
    C.lessons.splice(_shareIdx, 0, L_new1, L_new2);
    window.CONCEPT = C;
})();
