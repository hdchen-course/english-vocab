/* =====================================================================
 * statistics_concepts.ts  →  (tsc, tsconfig.legacy.json) →  statistics_concepts.js
 * 「統計與資料素養」觀念養成（直方圖／盒狀圖與四分位／離散度／散布圖與相關／
 *   看穿誤導圖表／相關不等於因果）。國小高年級→國中、teach-first 動畫觀念頁。
 *   資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）。
 *   動畫課重用 anim_core.js 的 window.Anim.barGrow / boxplotBuild / scatterTrend
 *   （參數化、多課共用、barGrow/scatterTrend 另與 core data-literacy 共用，不重造輪子）。
 *   以 IIFE 包住讓 animCanvas helper 為檔案區域（避免與其他遷移頁同名頂層 helper 在
 *   tsconfig.legacy 共用全域型別檢查時 TS2393 衝突）。純本地進度（progKey），不餵主 XP。
 * ===================================================================== */
(function () {
    // 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
    function animCanvas(w, h, label) {
        return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
            'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
    }
    window.CONCEPT = {
        progKey: 'statistics_concepts_v1', practiceHref: 'math.html',
        lessons: [
            { id: 'histogram', name: '直方圖：把資料分組看形狀', emoji: '📊', color: '#6366f1', sub: '連續資料分組、長條相鄰看形狀',
                done: '記得：直方圖＝把連續資料分組、長條相鄰看形狀；長條圖＝比不同類別、長條分開。',
                steps: [
                    { type: 'teach', kicker: '先看動畫', title: '把連續資料切成一段段「組距」', svg: animCanvas(300, 210, '一張考試分數的直方圖，各組長條依次長高，長條相鄰相連，呈現分組後的分布形狀'), mount: function (host) { var h = window.Anim.barGrow(host, { mode: 'histogram', values: [2, 5, 9, 7, 3], labels: ['<60', '60s', '70s', '80s', '90s'], unit: '人' }); return function () { h.stop(); }; }, text: '像身高、分數這種<b>連續</b>的資料，先切成一段段「<b>組距</b>」（例如 60–69、70–79…），再數每一組有<b>幾個</b>，長條就長多高。長條排在一起，就看出<b>分布的形狀</b>——哪一段人最多、資料往哪邊集中。' },
                    { type: 'teach', kicker: '比一比', title: '直方圖 vs 長條圖：相鄰還是分開？', svg: animCanvas(300, 210, '一張最喜歡運動的長條圖，各類別的長條分開、依次長高，用來比較不同類別的數量'), mount: function (host) { var h = window.Anim.barGrow(host, { mode: 'bar', values: [8, 5, 6, 3], labels: ['籃球', '足球', '游泳', '桌球'], unit: '人' }); return function () { h.stop(); }; }, text: '這是<b>長條圖</b>：比的是<b>不同類別</b>（籃球、足球…），每根長條<b>分開站</b>。差別就在這：<b>直方圖</b>長條<b>相鄰相連</b>（因為是連續資料的分組），<b>長條圖</b>長條<b>分開</b>（因為是各自獨立的類別）。' },
                    { type: 'quiz', kicker: '換你試試', title: '直方圖和長條圖最大的差別是？', options: ['直方圖長條相鄰相連（連續資料分組）；長條圖長條分開（不同類別）', '直方圖長條分開、長條圖長條相鄰', '兩種圖完全一樣，只是名字不同', '直方圖只能畫圓形、長條圖只能畫方形'], answer: 0, why: '直方圖畫的是連續資料分組後的次數，長條相鄰相連；長條圖比不同類別，長條分開。', whyWrong: { 1: '剛好說反了：相鄰相連的是直方圖、分開的是長條圖。', 2: '兩者不同：一個是連續資料分組、一個是類別比較。', 3: '長條形狀不是重點，重點在「相鄰」還是「分開」。' } },
                    { type: 'quiz', kicker: '想一想', title: '要看「班上考試分數的分布形狀」最適合用哪種圖？', options: ['直方圖（分數是連續的，分組後看形狀）', '長條圖（每個人一根長條）', '圓餅圖（看每個人佔的比例）', '折線圖（看時間變化）'], answer: 0, why: '分數是連續資料，要看「分組後的分布形狀」，直方圖最合適。', whyWrong: { 1: '長條圖適合比不同類別，不是看連續分數的分布形狀。', 2: '圓餅圖看的是「佔整體的比例」，不是分布形狀。', 3: '折線圖適合看隨時間的變化，分數分布不是時間資料。' } }
                ] },
            { id: 'boxplot', name: '盒狀圖與四分位數', emoji: '📦', color: '#6366f1', sub: '五數摘要：最小・Q1・中位數・Q3・最大',
                done: '記得：盒狀圖用「最小・Q1・中位數・Q3・最大」五個數，盒子裝中間一半的資料。',
                steps: [
                    { type: 'teach', kicker: '先看動畫', title: '排好資料，分成四等份的三個切點', svg: animCanvas(300, 210, '資料點由小到大排好，再框出最小、Q1、中位數、Q3、最大五個數，畫成盒鬚圖'), mount: function (host) { var h = window.Anim.boxplotBuild(host, { data: [2, 4, 5, 6, 8, 9, 11] }); return function () { h.stop(); }; }, text: '把資料<b>由小到大</b>排好，用三個切點把它切成<b>四等份</b>：<b>Q1</b>（前 1/4 的位置）、<b>中位數</b>（正中間）、<b>Q3</b>（後 1/4 的位置）。加上頭尾的<b>最小</b>和<b>最大</b>，就是<b>五數摘要</b>。' },
                    { type: 'teach', kicker: '再看一組', title: '盒狀圖＝一個盒子＋一條線＋兩條鬚', svg: animCanvas(300, 210, '另一組資料的盒鬚圖，盒子從Q1到Q3、中間一條線是中位數、兩條鬚延伸到最小與最大值'), mount: function (host) { var h = window.Anim.boxplotBuild(host, { data: [1, 3, 5, 7, 9] }); return function () { h.stop(); }; }, text: '盒狀圖長這樣：<b>盒子</b>從 <b>Q1 到 Q3</b>、中間一條<b>線</b>是<b>中位數</b>、兩條<b>鬚</b>延伸到<b>最小</b>和<b>最大</b>值。一眼就看出資料集中在哪、散得多開——盒子裝的是<b>中間約一半</b>的資料。' },
                    { type: 'quiz', kicker: '換你試試', title: '盒狀圖中間那條線代表什麼？', options: ['中位數', '平均數', '最大值', '全部資料的總和'], answer: 0, why: '盒子中間那條線就是中位數——把資料分成前後各一半的那個數。', whyWrong: { 1: '那是中位數，不是平均數；平均數不一定畫在盒狀圖上。', 2: '最大值在右邊鬚的末端，不是中間的線。', 3: '盒狀圖不畫總和。' } },
                    { type: 'quiz', kicker: '想一想', title: '盒子（從 Q1 到 Q3）大約裝了多少比例的資料？', options: ['中間約一半（50%）', '全部（100%）', '約四分之一（25%）', '完全不固定，看情況'], answer: 0, why: 'Q1 到 Q3 之間剛好是中間 50% 的資料（上下各去掉 25%），所以盒子裝的是中間約一半。', whyWrong: { 1: '100% 是從最小到最大（兩條鬚的全長），不是盒子。', 2: '25% 是 Q1 以下或 Q3 以上「一邊」的量；盒子是中間兩段合起來約 50%。', 3: '其實是固定的：Q1 到 Q3 永遠約是中間一半。' } }
                ] },
            { id: 'spread', name: '資料的分散程度', emoji: '↔️', color: '#6366f1', sub: '全距、四分位距 IQR、標準差直覺',
                done: '記得：平均講「中心」、離散度（全距／IQR／標準差）講「分散」；兩者要一起看。',
                steps: [
                    { type: 'teach', kicker: '先看動畫', title: '同樣的平均，可能很集中也可能很分散', svg: animCanvas(300, 220, '兩組平均都是7的資料並排盒鬚圖：A組擠在一起（IQR與全距都短）、B組高低差很大（IQR與全距都長）'), mount: function (host) { var h = window.Anim.boxplotBuild(host, { showIQR: true, data: [[5, 6, 7, 7, 7, 8, 9], [1, 3, 5, 7, 9, 11, 13]] }); return function () { h.stop(); }; }, text: '這兩組的<b>平均都是 7</b>，但 <b>A 組</b>分數<b>擠在一起</b>、<b>B 組</b>高低<b>差很大</b>。只看平均<b>不夠</b>！還要看資料<b>散得多開</b>——這就是「<b>離散度</b>」。<b>標準差</b>就是「資料平均離中心多遠」的量，<b>越分散、標準差越大</b>（B 組比較大）。' },
                    { type: 'teach', kicker: '全距 vs IQR', title: '一個極端值，就能把「全距」拉很長', svg: animCanvas(300, 220, '兩組資料盒鬚圖：第二組只有最大值變成30，全距暴增但IQR（盒子寬度）幾乎不變'), mount: function (host) { var h = window.Anim.boxplotBuild(host, { showIQR: true, data: [[4, 5, 6, 6, 7, 8, 8, 9, 10], [4, 5, 6, 6, 7, 8, 8, 9, 30]] }); return function () { h.stop(); }; }, text: '<b>全距＝最大 − 最小</b>，很直覺，但只要出現一個<b>極端值</b>（下面那組把 10 換成 30），全距就被拉得<b>超長</b>。<b>四分位距 IQR＝Q3 − Q1</b>，只看<b>中間一半</b>，比較<b>穩</b>、不太受極端值影響（兩組的盒子寬度幾乎一樣）。' },
                    { type: 'quiz', kicker: '換你試試', title: '兩班平均分一樣，A 班分數擠在一起、B 班高低差很大，誰的標準差大？', options: ['B 班（越分散，標準差越大）', 'A 班（越集中，標準差越大）', '一樣大（因為平均一樣）', '無法比較'], answer: 0, why: '標準差衡量「資料平均離中心多遠」。B 班比較分散，所以標準差較大。', whyWrong: { 1: '說反了：集中代表離中心近，標準差反而「小」。', 2: '平均一樣不代表分散程度一樣；標準差看的是分散，不是平均。', 3: '可以比較：看誰比較分散就好，B 班比較分散。' } },
                    { type: 'quiz', kicker: '想一想', title: '四分位距 IQR 怎麼算？', options: ['Q3 − Q1', '最大值 − 最小值', 'Q1 + Q3', '中位數 ÷ 2'], answer: 0, why: 'IQR＝Q3 − Q1，衡量「中間一半」資料的分散程度。', whyWrong: { 1: '那是全距（最大 − 最小），不是四分位距。', 2: 'IQR 是相減不是相加；是 Q3 − Q1。', 3: 'IQR 和中位數除以 2 無關。' } }
                ] },
            { id: 'scatter', name: '散布圖與相關', emoji: '🔵', color: '#6366f1', sub: '右上正相關、右下負相關、亂成團沒相關',
                done: '記得：散布圖看「兩個量一起變」的方向——右上正相關、右下負相關、亂成一團沒相關。',
                steps: [
                    { type: 'teach', kicker: '先看動畫', title: '兩個量一起記成一個點 (x, y)', svg: animCanvas(300, 220, '讀書時間對考試分數的散布圖，點大致往右上，讀書時間越長分數也越高，是正相關'), mount: function (host) { var h = window.Anim.scatterTrend(host, { r: 'pos', xLabel: '讀書時間', yLabel: '分數' }); return function () { h.stop(); }; }, text: '把<b>兩個量</b>一起記成一個<b>點 (x, y)</b>（例如一個人的「讀書時間」配上他的「分數」），一堆點畫在一起就是<b>散布圖</b>。這張圖的點大致<b>往右上</b>：讀書時間越長、分數也越高——這叫<b>正相關</b>（一個變大，另一個也變大）。' },
                    { type: 'teach', kicker: '另一個方向', title: '往右下＝負相關', svg: animCanvas(300, 220, '氣溫對熱可可銷量的散布圖，點大致往右下，氣溫越高銷量越低，是負相關'), mount: function (host) { var h = window.Anim.scatterTrend(host, { r: 'neg', xLabel: '氣溫', yLabel: '熱可可銷量' }); return function () { h.stop(); }; }, text: '這張點大致<b>往右下</b>：氣溫越高、熱可可賣得越少——一個變大、另一個<b>變小</b>，叫<b>負相關</b>。看散布圖就是看點「<b>往哪斜</b>」：右上正、右下負。' },
                    { type: 'teach', kicker: '看不出方向', title: '散成一團＝幾乎沒相關', svg: animCanvas(300, 220, '鞋子尺寸對考試分數的散布圖，點散成一團看不出方向，兩者幾乎沒有相關'), mount: function (host) { var h = window.Anim.scatterTrend(host, { r: 'none', xLabel: '鞋子尺寸', yLabel: '分數' }); return function () { h.stop(); }; }, text: '這張點<b>散成一團</b>，看不出往上還往下斜：鞋子尺寸和考試分數<b>幾乎沒有關係</b>。這就是<b>幾乎沒有相關</b>——兩個量不會一起變。' },
                    { type: 'quiz', kicker: '換你試試', title: '讀書時間越長、考試分數越高，散布圖的點大致往哪？', options: ['右上（正相關）', '右下（負相關）', '左下（一個變大一個變小）', '散成一團，沒方向'], answer: 0, why: '一個量變大、另一個量也變大，點會往右上集中，是正相關。', whyWrong: { 1: '右下是「一個變大、另一個變小」的負相關，和題目相反。', 2: '一起變大是往右上；左下不是這題的方向。', 3: '題目說兩者一起變大，看得出方向，不是沒相關。' } },
                    { type: 'quiz', kicker: '想一想', title: '散布圖的點散成一團、看不出往哪斜，代表？', options: ['兩個量幾乎沒有相關', '一定是正相關', '一定是負相關', '資料一定記錯了'], answer: 0, why: '點沒有明顯往上或往下的方向，表示兩個量之間幾乎沒有相關。', whyWrong: { 1: '正相關的點會往右上集中，不會散成一團。', 2: '負相關的點會往右下集中，不會散成一團。', 3: '散成一團是正常現象，代表沒相關，不是記錯。' } }
                ] },
            { id: 'misleading', name: '看穿誤導的圖表', emoji: '🕵️', color: '#6366f1', sub: '看圖先看座標軸的起點與刻度',
                done: '記得：看圖先看軸！軸不從 0 開始、刻度不均、挑區間，都可能讓圖騙人。',
                steps: [
                    { type: 'teach', kicker: '先看動畫', title: 'y 軸不從 0 開始，小差距被放大', svg: animCanvas(300, 210, '三根長條的誤導圖，y軸先從90起跳差距看起來很大，再把軸拉回0，長條其實差不多高'), mount: function (host) { var h = window.Anim.barGrow(host, { misleadAxis: true, yStart: 90, values: [92, 95, 97], labels: ['甲', '乙', '丙'], unit: '分' }); return function () { h.stop(); }; }, text: '這張圖三根長條<b>看起來差很多</b>——但偷看一下：<b>y 軸從 90 才開始</b>！動畫把軸<b>拉回 0</b> 以後，三根長條<b>其實差不多高</b>。<b>截斷 y 軸</b>（不從 0 開始）會把一點點差距<b>畫得像天差地遠</b>。' },
                    { type: 'teach', kicker: '還有這些招', title: '截斷軸、挑區間、3D 立體都會騙人', svg: animCanvas(300, 210, '兩根業績長條的誤導圖，y軸從50起跳看似成長很多，拉回0後其實差距很小'), mount: function (host) { var h = window.Anim.barGrow(host, { misleadAxis: true, yStart: 50, values: [52, 54], labels: ['去年', '今年'], unit: '萬' }); return function () { h.stop(); }; }, text: '同一招又來了：業績從 52 到 54 萬，<b>y 軸從 50 起跳</b>看起來<b>成長超多</b>，拉回 0 其實<b>只多一點點</b>。其他常見花招還有：<b>刻度不等間距</b>、<b>只挑有利的區間</b>、<b>3D 立體誇大</b>。所以——<b>看圖先看座標軸的刻度！</b>' },
                    { type: 'quiz', kicker: '換你試試', title: '一張長條圖兩根看起來差超多，但 y 軸從 95 才開始，真相可能是？', options: ['其實差距很小（y 軸沒從 0 開始，放大了差異）', '差距真的很大，圖沒問題', 'y 軸起點不影響長條比較', '一定是資料造假了'], answer: 0, why: 'y 軸不從 0 開始，會把一點點差距畫得像天差地遠；把軸拉回 0，長條其實差不多高。', whyWrong: { 1: '軸從 95 起跳時，看起來的大差距可能只是放大效果，不能直接下這個結論。', 2: 'y 軸起點影響很大：起點越高，小差距看起來越誇張。', 3: '截斷軸會「誤導」，但不一定是「造假」；要先看軸再判斷。' } },
                    { type: 'quiz', kicker: '想一想', title: '看圖表時最該先檢查什麼？', options: ['座標軸的起點與刻度（還有單位）', '圖表的顏色好不好看', '圖表畫得大不大', '有沒有用 3D 立體'], answer: 0, why: '先看軸！軸的起點、刻度是否均勻、單位是什麼，決定了這張圖有沒有誤導。', whyWrong: { 1: '顏色是美觀，不影響資料是否被誤導。', 2: '圖的大小不是重點，刻度與起點才會改變解讀。', 3: '3D 立體有時反而誇大，但第一步仍是先看軸的刻度與起點。' } }
                ] },
            { id: 'causation', name: '相關不等於因果', emoji: '⚖️', color: '#6366f1', sub: '一起變≠互相造成；想想第三個共同原因',
                done: '記得：一起變≠互相造成；先想有沒有第三個共同原因或巧合，因果要靠公平實驗。',
                steps: [
                    { type: 'teach', kicker: '先看動畫', title: '冰淇淋賣越多、溺水也越多？', svg: animCanvas(300, 220, '冰淇淋銷量對溺水人數的散布圖，正相關；浮現共同原因「夏天」方框，提示相關不等於因果'), mount: function (host) { var h = window.Anim.scatterTrend(host, { r: 'pos', xLabel: '冰淇淋銷量', yLabel: '溺水人數', confound: { label: '夏天', on: true } }); return function () { h.stop(); }; }, text: '冰淇淋賣越多的月份，溺水人數也越多——點<b>正相關</b>。但吃冰淇淋會<b>害人溺水</b>嗎？當然不是！背後有一個<b>共同原因：夏天</b>。天氣熱，<b>吃冰的人多</b>、<b>去玩水的人也多</b>。兩件事<b>一起變</b>只是<b>相關</b>，不代表一個<b>造成</b>另一個。' },
                    { type: 'teach', kicker: '再想一個', title: '鞋子越大、認識的字越多？', svg: animCanvas(300, 220, '鞋子大小對認識的字數的散布圖，正相關；浮現共同原因「長大（年齡）」方框'), mount: function (host) { var h = window.Anim.scatterTrend(host, { r: 'pos', xLabel: '鞋子大小', yLabel: '認識的字', confound: { label: '長大（年齡）', on: true } }); return function () { h.stop(); }; }, text: '統計小朋友「鞋子大小」和「認識多少字」，居然也<b>正相關</b>！難道<b>腳變大</b>會讓人<b>變聰明</b>？不是——共同原因是<b>長大（年齡）</b>：年紀越大，腳越大、認識的字也越多。要真的確認「A 造成 B」，得做<b>控制變因的公平實驗</b>，不能只看相關。有時甚至只是<b>巧合</b>。' },
                    { type: 'quiz', kicker: '換你試試', title: '冰淇淋賣越多、溺水人數也越多，所以吃冰淇淋害人溺水？', options: ['不對，背後的共同原因是夏天（天熱→吃冰多、玩水也多）', '對，資料顯示冰淇淋造成溺水', '對，因為兩件事一起變多', '無法判斷，資料太少'], answer: 0, why: '兩件事一起變多只是相關；真正的共同原因是夏天，天熱讓吃冰和玩水都變多。相關不等於因果。', whyWrong: { 1: '一起變多只是相關，不代表誰造成誰；共同原因是夏天。', 2: '「一起變」正是相關，但相關不等於因果，不能這樣推論。', 3: '就算資料很多，光靠相關也不能證明因果；要想有沒有第三因素。' } },
                    { type: 'quiz', kicker: '想一想', title: '要確認 A 真的造成 B，最該做什麼？', options: ['做有控制變因的公平實驗（不能只看相關）', '找更多「A 和 B 一起出現」的例子', '只要相關很強就能確定因果', '問大家覺得是不是因果'], answer: 0, why: '要證明因果，得做公平實驗、控制其他變因，看改變 A 會不會真的改變 B；光看相關不夠。', whyWrong: { 1: '再多「一起出現」的例子仍只是相關，不能證明因果。', 2: '相關再強也可能是第三因素造成，不等於因果。', 3: '大家的感覺不是證據；因果要靠控制變因的實驗。' } }
                ] }
        ]
    };
})();
