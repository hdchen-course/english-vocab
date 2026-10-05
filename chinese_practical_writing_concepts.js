/* =====================================================================
 * chinese_practical_writing_concepts.ts  →  (tsc, tsconfig.legacy.json)
 *     →  chinese_practical_writing_concepts.js
 * 應用文寫作「先學觀念」頁：書信・日記・通知・讀書心得的文體格式鷹架。
 * window.CONCEPT ＋ concept_engine.js（教結構 → 填格子式輕量 quiz）。
 * 每個 teach 的 viz 都是 PLAYABLE：window.Anim.blockAssemble（具名方塊由上而下
 *   滑入、組成文件骨架；日記／讀書心得用 fix 示範把寫錯的方塊換成正確的）。
 * IIFE 包住讓 animCanvas() 為檔案區域（避免與其他已遷移頁同名頂層 helper 在
 *   tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。
 * 載入順序：本檔 → anim_core.js → concept_engine.js。
 * ===================================================================== */
(function () {
    // 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
    // blockAssemble 要容納最多 6 塊，故給 360×300 的邏輯尺寸。
    function animCanvas(w, h, label) {
        return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
            'style="max-width:' + w + 'px" ' +
            'role="img" aria-label="' + label + '"></canvas>';
    }
    window.CONCEPT = {
        progKey: 'chinese_practical_writing_v1', practiceHref: 'composition.html',
        lessons: [
            { id: 'letter', name: '一封信長什麼樣子', emoji: '✉️', color: '#b91c1c', sub: '書信六塊：稱呼→問候→正文→祝頌→署名→日期',
                done: '記得：書信＝稱呼→問候→正文→祝頌→署名→日期。稱呼要頂格寫，祝頌語另起一行，署名靠右邊。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '書信的六個區塊',
                        svg: animCanvas(360, 300, '一封信的六個區塊由上而下滑入組成：稱呼、問候、正文、祝頌語、署名、日期'),
                        mount: function (host) { return window.Anim && window.Anim.blockAssemble(host, { title: '一封信的樣子', caption: '稱呼→問候→正文→祝頌→署名→日期', label: '書信六個區塊由上而下滑入，組成一封完整的信：稱呼、問候、正文、祝頌語、署名、日期。', blocks: [{ label: '稱呼：親愛的奶奶：', color: '#b91c1c' }, { label: '問候：您好嗎？', color: '#dc2626' }, { label: '正文：要說的事', color: '#e11d48' }, { label: '祝頌語：祝 身體健康', color: '#be123c' }, { label: '署名：孫女 小芬', color: '#f97316' }, { label: '日期：十月五日', color: '#d97706' }] }); },
                        text: '一封信有<b>六個區塊</b>，從上到下是：①<b>稱呼</b>（親愛的奶奶：）②<b>問候</b>（您好嗎？）③<b>正文</b>（要說的事）④<b>祝頌語</b>（祝 身體健康）⑤<b>署名</b>（孫女 小芬）⑥<b>日期</b>。看它們一塊一塊組起來，就是一封完整的信。' },
                    { type: 'teach', kicker: '位置有規矩', title: '稱呼頂格、祝頌語另起、署名靠右',
                        svg: animCanvas(360, 300, '書信各區塊的位置規矩：稱呼頂格、祝頌語另起一行、署名靠右'),
                        mount: function (host) { return window.Anim && window.Anim.blockAssemble(host, { title: '位置有規矩', caption: '稱呼頂格、祝頌語另起、署名靠右', label: '書信區塊依序滑入，標出位置規矩：稱呼頂格、祝頌語另起一行、署名靠右邊。', blocks: [{ label: '稱呼（頂格寫）', color: '#b91c1c' }, { label: '問候', color: '#dc2626' }, { label: '正文', color: '#e11d48' }, { label: '祝頌語（另起一行）', color: '#be123c' }, { label: '署名（靠右邊）', color: '#f97316' }, { label: '日期', color: '#d97706' }] }); },
                        text: '書信的位置有規矩：<b>稱呼</b>要寫在最上面、<b>頂到最左邊（頂格）</b>；<b>祝頌語</b>（像「祝 身體健康」）要<b>另起一行</b>；<b>署名</b>和<b>日期</b>寫在信的<b>右下角、靠右邊</b>。位置對了，信才有禮貌、也好讀。' },
                    { type: 'quiz', kicker: '換你試試', title: '寫信給奶奶，開頭第一行最適合寫哪一句？',
                        options: ['今天天氣真好', '親愛的奶奶：', '祝 身體健康', '小芬 敬上'], answer: 1,
                        why: '書信開頭要先寫「稱呼」並加上冒號，像「親愛的奶奶：」。問候、祝頌語、署名都排在後面。' },
                    { type: 'quiz', kicker: '想一想', title: '信末「祝 身體健康」這一塊，叫做什麼？',
                        options: ['稱呼', '正文', '祝頌語', '署名'], answer: 2,
                        why: '信末表達祝福的話叫「祝頌語」，通常要另起一行寫，像「祝 身體健康」。' }
                ] },
            { id: 'diary', name: '日記：記下今天＋我的感覺', emoji: '📔', color: '#dc2626', sub: '日期天氣＋一件事＋我的心情（不要流水帳）',
                done: '記得：日記＝日期天氣＋一件事＋我的心情。挑一件最有感覺的事寫清楚，不要從早到晚流水帳。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '日記的三個區塊',
                        svg: animCanvas(360, 300, '日記三個區塊由上而下滑入組成：日期和天氣、發生的事、我的心情'),
                        mount: function (host) { return window.Anim && window.Anim.blockAssemble(host, { title: '日記的樣子', caption: '日期天氣→一件事→我的心情', label: '日記三個區塊由上而下滑入組成：日期和天氣、發生的事、我的心情。', blocks: [{ label: '日期＋天氣：十月五日 晴', color: '#b91c1c' }, { label: '事件：發生了什麼事', color: '#dc2626' }, { label: '心情：我的想法／感覺', color: '#e11d48' }] }); },
                        text: '日記最前面先寫<b>日期＋天氣</b>（像「十月五日 晴」）。接著記<b>發生什麼事</b>，最後寫<b>我的想法或心情</b>。有事、有感覺，才是一篇日記，不是只有流水帳。' },
                    { type: 'teach', kicker: '別寫成流水帳', title: '挑一件最有感覺的事',
                        svg: animCanvas(360, 300, '日記示範把從早到晚的流水帳換成挑一件最有感覺的事'),
                        mount: function (host) { return window.Anim && window.Anim.blockAssemble(host, { title: '不要流水帳', caption: '把流水帳換成「挑一件事」', label: '日記三塊滑入，再把中間的「從早到晚流水帳」換成「挑一件最有感覺的事」。', blocks: [{ label: '日期＋天氣', color: '#b91c1c' }, { label: '事件', color: '#dc2626' }, { label: '心情：為什麼有感覺', color: '#e11d48' }], fix: { atIndex: 1, wrong: '從早到晚流水帳', right: '挑一件最有感覺的事' } }); },
                        text: '好日記<b>不是流水帳</b>——不用把「起床、刷牙、上學、回家」全部記下來。<b>挑一件最有感覺的事</b>，把它寫清楚，再說說<b>為什麼有感覺</b>，日記就有重點、也更好看。' },
                    { type: 'quiz', kicker: '換你試試', title: '日記最前面通常先寫什麼？',
                        options: ['日期和天氣', '故事的結局', '好詞好句', '作者是誰'], answer: 0,
                        why: '日記的慣例是最前面先標「日期」和「天氣」，再寫事情和心情。' },
                    { type: 'quiz', kicker: '想一想', title: '怎樣的日記比較不像流水帳？',
                        options: ['把一整天從早到晚全部記下來', '挑一件最有感覺的事，寫清楚心情', '只抄課本上的句子', '只寫今天幾月幾號'], answer: 1,
                        why: '聚焦在一件最有感覺的事、並寫出自己的感受，比逐項流水記錄更有重點。' }
                ] },
            { id: 'notice', name: '通知／便條：把事情講清楚', emoji: '📢', color: '#e11d48', sub: '對象＋時間＋地點＋做什麼＋帶什麼',
                done: '記得：通知＝對象＋時間＋地點＋做什麼＋帶什麼，分點寫、簡短、資訊清楚，讓人一看就懂。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '通知要讓人一看就懂',
                        svg: animCanvas(360, 300, '一張通知的五個區塊由上而下滑入：對象、時間、地點、事項、攜帶物品'),
                        mount: function (host) { return window.Anim && window.Anim.blockAssemble(host, { title: '一張通知的樣子', caption: '對象→時間→地點→做什麼→帶什麼', label: '通知五個區塊由上而下滑入組成：對象、時間、地點、要做的事、要帶的東西。', blocks: [{ label: '對象：三年二班同學', color: '#b91c1c' }, { label: '時間：十月十日 上午九點', color: '#dc2626' }, { label: '地點：學校操場', color: '#e11d48' }, { label: '事項：班級遠足', color: '#be123c' }, { label: '攜帶：水壺、帽子', color: '#f97316' }] }); },
                        text: '通知要讓人<b>一看就懂</b>。寫清楚五件事：<b>對象</b>（給誰看）、<b>時間</b>、<b>地點</b>、<b>做什麼</b>、<b>要帶什麼</b>。少了時間或地點，別人就不知道什麼時候、去哪裡。' },
                    { type: 'teach', kicker: '寫得好的祕訣', title: '短、分點、不囉嗦',
                        svg: animCanvas(360, 300, '通知的五個區塊分點排列，示範短而清楚的寫法'),
                        mount: function (host) { return window.Anim && window.Anim.blockAssemble(host, { title: '分點寫最好讀', caption: '一點一行，簡短清楚', label: '通知五個區塊分點排好，示範短而清楚、一點一行的寫法。', blocks: [{ label: '• 對象', color: '#b91c1c' }, { label: '• 時間', color: '#dc2626' }, { label: '• 地點', color: '#e11d48' }, { label: '• 做什麼', color: '#be123c' }, { label: '• 帶什麼', color: '#f97316' }] }); },
                        text: '通知寫得好的祕訣是<b>短、分點、不囉嗦</b>。把每件事<b>一點一行</b>列出來，像「班遊通知」那樣，別人掃一眼就抓到重點，比寫成一大段文字好讀多了。' },
                    { type: 'quiz', kicker: '換你試試', title: '一張活動通知，最不能少的是哪一項？',
                        options: ['作者心情', '時間和地點', '好詞好句', '標點種類'], answer: 1,
                        why: '通知要讓人知道「什麼時候、去哪裡」參加，所以時間和地點是一定要有的。' },
                    { type: 'quiz', kicker: '想一想', title: '通知寫得好的祕訣是什麼？',
                        options: ['分點、簡短、資訊清楚', '寫得越長越好', '多用成語', '故意賣關子'], answer: 0,
                        why: '應用文重清楚實用，分點、簡短、把資訊講清楚，別人最好讀懂。' }
                ] },
            { id: 'bookreport', name: '讀書心得：這本書＋我學到什麼', emoji: '📚', color: '#be123c', sub: '簡介＋印象最深＋我的想法（想法最重要）',
                done: '記得：讀書心得＝簡介＋印象最深＋我的想法。重點是「你的想法」，不是把整本書重抄一遍。',
                steps: [
                    { type: 'teach', kicker: '先想一想', title: '讀書心得的三個區塊',
                        svg: animCanvas(360, 300, '讀書心得三個區塊由上而下滑入：簡介、印象最深的部分、我的收穫和想法'),
                        mount: function (host) { return window.Anim && window.Anim.blockAssemble(host, { title: '讀書心得的樣子', caption: '簡介→印象最深→我的想法', label: '讀書心得三個區塊由上而下滑入組成：簡介、印象最深的部分、我的收穫和想法。', blocks: [{ label: '簡介：書名作者、大概在講什麼', color: '#b91c1c' }, { label: '印象最深的部分', color: '#dc2626' }, { label: '我的收穫／想法', color: '#e11d48' }] }); },
                        text: '讀書心得有<b>三塊</b>：①<b>簡介</b>（書名、作者、大概在講什麼，<b>不要劇透結局</b>）②<b>印象最深的部分</b>③<b>我的收穫或想法</b>。先讓人知道這是什麼書，再說你最有感覺的地方。' },
                    { type: 'teach', kicker: '想法最重要', title: '重點是你的想法，不是整本重抄',
                        svg: animCanvas(360, 300, '讀書心得示範把照抄整本內容換成寫出我的收穫和想法'),
                        mount: function (host) { return window.Anim && window.Anim.blockAssemble(host, { title: '想法最重要', caption: '把「照抄整本」換成「我的想法」', label: '讀書心得三塊滑入，再把最後一塊的「整本內容照抄」換成「我的收穫和想法」。', blocks: [{ label: '簡介（不劇透）', color: '#b91c1c' }, { label: '印象最深的部分', color: '#dc2626' }, { label: '我的收穫和想法', color: '#e11d48' }], fix: { atIndex: 2, wrong: '整本內容照抄', right: '我的收穫和想法' } }); },
                        text: '讀書心得最重要的是<b>你的想法</b>——這本書讓你<b>學到什麼、有什麼感覺</b>，而不是把<b>整本內容照抄</b>一遍。簡介和劇情只要一點點，<b>你的收穫和想法</b>才該佔最多。' },
                    { type: 'quiz', kicker: '換你試試', title: '讀書心得最重要的部分是哪一塊？',
                        options: ['抄整本書的內容', '我的收穫和想法', '作者今年幾歲', '這本書有幾頁'], answer: 1,
                        why: '讀書心得重在個人的感受與啟發，也就是「我的收穫和想法」，不是複述全書。' },
                    { type: 'quiz', kicker: '想一想', title: '寫書的「簡介」時要注意什麼？',
                        options: ['把結局整個講出來', '說大概在講什麼、不劇透結局', '只寫書的價錢', '抄書背的介紹就好'], answer: 1,
                        why: '簡介是讓人知道這本書大概在講什麼，不應該把結局爆雷講出來。' }
                ] }
        ]
    };
})();
