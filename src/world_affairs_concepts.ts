/* =====================================================================
 * world_affairs_concepts.ts  →  (tsc, tsconfig.legacy.json) → world_affairs_concepts.js
 *
 * 「世界時事認知・跟世界接軌」觀念養成（社會世界時事軸）。國小高年級→國中／高中。
 *   單一正式頁 world_affairs.html；本檔貢獻 8 課：WORLD-NEWS 5 課（id 前綴 news_）＋全球議題 3 課（id 前綴 glob_：難民／貧富差距／NGO）。
 *   資料 = window.CONCEPT，餵給共用 concept_engine.js（teach/quiz 引擎）。
 *     1. 一則新聞怎麼讀：5W1H 與標題不等於全部 (news_read)   — stepped/static SVG
 *     2. 消息從哪來：分辨來源與查證            (news_source) — static SVG（來源鏈／可信度階梯／可信度錶）
 *     3. 事實、意見與宣傳                      (news_fact)   — static SVG（判斷閘／帶風向天平／套用範例）
 *     4. 看世界地圖，懂時事發生在哪            (news_map)    — playable Anim.worldLocator（news_map 與 glob_refugee 共兩處 mount）
 *     5. 跟世界接軌：尊重多元、破除刻板印象    (news_respect)— static SVG
 *   動畫課重用 anim_core.js 的 window.Anim.worldLocator（NEW 共用場景，author-once，
 *   世界地理 world_geography 日後共用；全球議題已於本檔 glob_ 課使用）；其餘 teach step 用
 *   stepped/static SVG。每個 teach step 都有視覺、零純文字。純本地進度
 *   （progKey world_affairs_concepts_v1），不餵主 XP、無對應練習關卡（practiceHref 空）。
 *
 *   ★ EVERGREEN 鐵則：教「怎麼讀、怎麼判斷、怎麼定位」的能力，所有例子一律「假想／通用」
 *     （某國、某地、某城市），不綁任何會過時的特定即時事件、人名、年份。
 *   ★ 政治中立：教「如何判斷」而非「該相信什麼」；不點名現任政治人物褒貶、不綁特定政黨
 *     或國際爭議的單方論述；尊重多元、零標籤、非恐嚇。
 *   ★ 台灣用詞與觀點：一律用台灣慣用語（資訊非信息、影片非視頻、網路非網絡、資料非數據）；
 *     地理指中國時一律用「中國」，不用「大陸」；不採任何黨國語彙或中國官方表述。
 *   ★ 地圖中立性：worldLocator 只畫七大洲色塊＋海洋，不畫國界、不標任何有主權爭議的疆界或名稱。
 *   以 IIFE 包住讓 SVG helper 為檔案區域（避免與其他遷移頁同名頂層 helper 衝突）。
 * ===================================================================== */
(function () {

// 動畫 teach 步驟用：產生一個 <canvas> 佔位（實際繪製由 anim_core.js 的 window.Anim 接手）。
function animCanvas(w: number, h: number, label: string): string {
  return '<canvas class="cn-anim-canvas" width="' + w + '" height="' + h + '" ' +
    'style="max-width:' + w + 'px" role="img" aria-label="' + label + '"></canvas>';
}

var SU = '#b45309';                     // 社會科赭色（與 social_concepts 一致）
var GREEN = '#16a34a', WARN = '#e11d48', MUT = '#64748b', AMBER = '#d97706', SKY = '#0ea5e9', PURP = '#7c3aed';

// ---- stepped / static SVG helpers（每個非動畫 teach step 都要有視覺）------------

// L1 teach1：把一則「假想」新聞句子，依顏色對應到 5W1H 六個問題（抽取的動作，不是表格）。
function fiveW1H(): string {
  var s = '<svg viewBox="0 0 300 206" role="img" aria-label="把一則假想新聞拆成五個 W 和一個 H。例句：昨天下午，某國東部因為強烈地震，當地政府用廣播通知、緊急疏散居民。昨天下午回答何時 When，某國東部回答哪裡 Where，因為強烈地震回答為什麼 Why，當地政府回答誰 Who，緊急疏散居民回答發生什麼事 What，用廣播通知回答怎麼做 How。讀新聞時練習把這六個問題找出來，就讀懂了事件的全貌">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">一則新聞，回答六個問題（5W1H）</text>';
  // 例句框（兩行），各段用顏色標示。
  s += '<rect x="12" y="26" width="276" height="52" rx="10" fill="' + MUT + '" opacity="0.1"/>';
  s += '<rect x="12" y="26" width="276" height="52" rx="10" fill="none" stroke="' + MUT + '" stroke-width="1.2"/>';
  s += '<text x="20" y="46" font-size="10.5" font-weight="700">';
  s += '<tspan fill="' + SKY + '">昨天下午</tspan><tspan fill="currentColor">，</tspan>';
  s += '<tspan fill="' + GREEN + '">某國東部</tspan><tspan fill="currentColor">因為</tspan>';
  s += '<tspan fill="' + AMBER + '">強烈地震</tspan><tspan fill="currentColor">，</tspan></text>';
  s += '<text x="20" y="66" font-size="10.5" font-weight="700">';
  s += '<tspan fill="' + PURP + '">當地政府</tspan><tspan fill="currentColor">用</tspan>';
  s += '<tspan fill="' + WARN + '">廣播通知</tspan><tspan fill="currentColor">、</tspan>';
  s += '<tspan fill="' + SU + '">緊急疏散居民</tspan><tspan fill="currentColor">。</tspan></text>';
  // 六個問題標籤（顏色對應上面的句段）。
  var qs: [string, string, string][] = [
    ['誰 Who', '當地政府', PURP], ['發生什麼 What', '疏散居民', SU], ['何時 When', '昨天下午', SKY],
    ['哪裡 Where', '某國東部', GREEN], ['為什麼 Why', '強烈地震', AMBER], ['怎麼做 How', '用廣播通知', WARN]
  ];
  for (var i = 0; i < 6; i++) {
    var col = i % 3, row = Math.floor(i / 3);
    var x = 14 + col * 93, y = 90 + row * 54;
    s += '<rect x="' + x + '" y="' + y + '" width="86" height="46" rx="9" fill="' + qs[i][2] + '" opacity="0.12"/>';
    s += '<rect x="' + x + '" y="' + y + '" width="86" height="46" rx="9" fill="none" stroke="' + qs[i][2] + '" stroke-width="1.3"/>';
    s += '<text x="' + (x + 43) + '" y="' + (y + 18) + '" text-anchor="middle" font-size="10" font-weight="800" fill="' + qs[i][2] + '">' + qs[i][0] + '</text>';
    s += '<text x="' + (x + 43) + '" y="' + (y + 35) + '" text-anchor="middle" font-size="9.5" fill="currentColor">' + qs[i][1] + '</text>';
  }
  s += '<text x="150" y="202" text-anchor="middle" font-size="9.5" fill="' + MUT + '">把六個問題都找出來，就讀懂了事件的全貌。</text>';
  return s + '</svg>';
}

// L1 teach2：同一事件，兩種標題（誇大 vs 完整內文）並排對照——顯示判讀的動作。
function headlineCompare(): string {
  var s = '<svg viewBox="0 0 300 200" role="img" aria-label="同一件事可以用兩種方式說。假想事件是某國沿海發生規模不大的地震。誇大標題寫驚天動地、恐全面停擺，問號加驚嘆號想嚇你點進去。但完整內文說，地震規模較小、沒有人受傷，交通短暫受影響後很快恢復。只看標題會以為很嚴重，讀完整內文才知道真實情況。所以標題不等於全部，要讀內文看完整脈絡">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">同一事件，兩種標題</text>';
  s += '<text x="150" y="32" text-anchor="middle" font-size="9.5" fill="' + MUT + '">假想事件：某國沿海發生規模不大的地震</text>';
  // 誇大標題
  s += '<rect x="12" y="40" width="276" height="40" rx="10" fill="' + WARN + '" opacity="0.1"/>';
  s += '<rect x="12" y="40" width="276" height="40" rx="10" fill="none" stroke="' + WARN + '" stroke-width="1.5"/>';
  s += '<text x="22" y="56" font-size="9.5" font-weight="800" fill="' + WARN + '">誇大標題（想吸引你點進去）</text>';
  s += '<text x="22" y="72" font-size="10.5" font-weight="700" fill="currentColor">「驚天動地！恐全面停擺？！」</text>';
  s += '<path d="M150 82 L150 96" stroke="' + MUT + '" stroke-width="1.6" marker-end="url(#hcr)"/>';
  s += '<text x="186" y="92" font-size="8.5" fill="' + MUT + '">讀內文查證</text>';
  // 完整內文
  s += '<rect x="12" y="100" width="276" height="58" rx="10" fill="' + GREEN + '" opacity="0.1"/>';
  s += '<rect x="12" y="100" width="276" height="58" rx="10" fill="none" stroke="' + GREEN + '" stroke-width="1.5"/>';
  s += '<text x="22" y="116" font-size="9.5" font-weight="800" fill="' + GREEN + '">完整內文（真實情況）</text>';
  s += '<text x="22" y="132" font-size="9.5" fill="currentColor">規模較小、沒有人受傷，</text>';
  s += '<text x="22" y="148" font-size="9.5" fill="currentColor">交通短暫受影響後很快恢復。</text>';
  s += '<text x="150" y="176" text-anchor="middle" font-size="10" fill="currentColor">只看標題會嚇一跳；讀內文才知道事情沒那麼嚴重。</text>';
  s += '<text x="150" y="193" text-anchor="middle" font-size="9.5" fill="' + MUT + '">標題不等於全部，要看完整脈絡。</text>';
  s += '<defs><marker id="hcr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + MUT + '"/></marker></defs>';
  return s + '</svg>';
}

// L1 teach3：同一篇報導裡，分出「發生的事」與「別人的評論」。
function eventVsComment(): string {
  var s = '<svg viewBox="0 0 300 192" role="img" aria-label="讀新聞要分清兩種句子。發生的事是客觀描述、可以查證，例如某地今天發生地震、規模五級。評論是個人看法、沒有絕對對錯，例如我覺得政府反應太慢了。同一篇報導裡常常兩種都有，要分開看，才不會把別人的意見當成事實">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">分清「發生的事」與「評論」</text>';
  s += '<text x="150" y="31" text-anchor="middle" font-size="9" fill="' + MUT + '">同一篇報導裡，常常兩種句子都有</text>';
  // 發生的事
  s += '<rect x="12" y="40" width="276" height="52" rx="10" fill="' + GREEN + '" opacity="0.1"/>';
  s += '<rect x="12" y="40" width="276" height="52" rx="10" fill="none" stroke="' + GREEN + '" stroke-width="1.5"/>';
  s += '<text x="22" y="58" font-size="10" font-weight="800" fill="' + GREEN + '">✅ 發生的事（可查證、有對錯）</text>';
  s += '<text x="22" y="78" font-size="10.5" fill="currentColor">「某地今天發生地震，規模五級。」</text>';
  // 評論
  s += '<rect x="12" y="100" width="276" height="52" rx="10" fill="' + AMBER + '" opacity="0.12"/>';
  s += '<rect x="12" y="100" width="276" height="52" rx="10" fill="none" stroke="' + AMBER + '" stroke-width="1.5"/>';
  s += '<text x="22" y="118" font-size="10" font-weight="800" fill="' + AMBER + '">💭 評論（個人看法、沒絕對對錯）</text>';
  s += '<text x="22" y="138" font-size="10.5" fill="currentColor">「我覺得政府反應太慢了。」</text>';
  s += '<text x="150" y="172" text-anchor="middle" font-size="10" fill="currentColor">把兩種分開，就不會把別人的意見當成事實。</text>';
  s += '<text x="150" y="187" text-anchor="middle" font-size="9.5" fill="' + MUT + '">先問：這句話查得到、有對錯嗎？</text>';
  return s + '</svg>';
}

// L2 teach1：一手來源 vs 二手／轉述——用「離事件的距離」呈現。
function sourceChain(): string {
  var s = '<svg viewBox="0 0 300 200" role="img" aria-label="消息分兩種來源。一手來源是當事人、現場或官方原始資料，直接接觸事件，像一條實線直接連到你，比較可靠。二手或轉述是別人整理、再轉傳，中間經過好幾手，像一條虛線繞一大圈，每轉一次都可能走樣、加油添醋。離事件越近、經手越少，通常越可靠">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">消息從哪來：一手 vs 二手</text>';
  // 事件
  s += '<circle cx="150" cy="54" r="20" fill="' + SU + '" opacity="0.14"/>';
  s += '<circle cx="150" cy="54" r="20" fill="none" stroke="' + SU + '" stroke-width="1.5"/>';
  s += '<text x="150" y="50" text-anchor="middle" font-size="16">⚡</text>';
  s += '<text x="150" y="66" text-anchor="middle" font-size="8.5" fill="currentColor">事件現場</text>';
  // 一手（左，實線）
  s += '<text x="58" y="100" text-anchor="middle" font-size="10" font-weight="800" fill="' + GREEN + '">一手來源</text>';
  s += '<text x="58" y="115" text-anchor="middle" font-size="8.5" fill="currentColor">當事人／現場</text>';
  s += '<text x="58" y="127" text-anchor="middle" font-size="8.5" fill="currentColor">官方原始資料</text>';
  s += '<path d="M133 66 L72 96" stroke="' + GREEN + '" stroke-width="2.4" marker-end="url(#scg)"/>';
  s += '<path d="M58 132 L58 164" stroke="' + GREEN + '" stroke-width="2.4" marker-end="url(#scg)"/>';
  s += '<text x="92" y="150" text-anchor="middle" font-size="8" fill="' + GREEN + '">直接、少走樣</text>';
  // 二手（右，虛線繞一圈）
  s += '<text x="242" y="100" text-anchor="middle" font-size="10" font-weight="800" fill="' + WARN + '">二手／轉述</text>';
  s += '<text x="242" y="115" text-anchor="middle" font-size="8.5" fill="currentColor">別人整理</text>';
  s += '<text x="242" y="127" text-anchor="middle" font-size="8.5" fill="currentColor">再轉傳、又轉傳</text>';
  s += '<path d="M167 66 Q240 70 242 96" stroke="' + WARN + '" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#scw)"/>';
  s += '<path d="M242 132 L242 164" stroke="' + WARN + '" stroke-width="2" stroke-dasharray="4 3" marker-end="url(#scw)"/>';
  s += '<text x="208" y="150" text-anchor="middle" font-size="8" fill="' + WARN + '">每轉一次可能走樣</text>';
  // 你
  s += '<text x="58" y="178" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor">你看到</text>';
  s += '<text x="242" y="178" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor">你看到</text>';
  s += '<text x="150" y="194" text-anchor="middle" font-size="9.5" fill="' + MUT + '">離事件越近、經手越少，通常越可靠。</text>';
  s += '<defs>' +
    '<marker id="scg" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + GREEN + '"/></marker>' +
    '<marker id="scw" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + WARN + '"/></marker>' +
    '</defs>';
  return s + '</svg>';
}

// L2 teach2：可信度階梯——由低到高，越往上越可信（上升的樓梯＝可信度上升）。
function credLadder(): string {
  var s = '<svg viewBox="0 0 300 200" role="img" aria-label="判斷消息可信度，像爬一座樓梯，越往上越可信。最低一階是匿名群組轉傳，沒人負責；往上是只有一個沒聽過的單一網站；再往上是具名、要負責的媒體；最高一階是多家獨立媒體都報導、而且找得到官方原始出處。越往上，可信度越高">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">可信度階梯：越往上越可信</text>';
  var steps: [string, string][] = [
    ['匿名群組轉傳（沒人負責）', WARN],
    ['單一、沒聽過的網站', AMBER],
    ['具名、要負責的媒體', SKY],
    ['多家獨立媒體＋官方原始出處', GREEN]
  ];
  var baseY = 176, stepH = 30, stepW = 150;
  for (var i = 0; i < 4; i++) {
    var y = baseY - i * stepH;
    var x = 20 + i * 28;
    s += '<rect x="' + x + '" y="' + (y - stepH + 4) + '" width="' + stepW + '" height="' + (stepH - 6) + '" rx="6" fill="' + steps[i][1] + '" opacity="0.16"/>';
    s += '<rect x="' + x + '" y="' + (y - stepH + 4) + '" width="' + stepW + '" height="' + (stepH - 6) + '" rx="6" fill="none" stroke="' + steps[i][1] + '" stroke-width="1.4"/>';
    s += '<text x="' + (x + 8) + '" y="' + (y - stepH / 2 + 2) + '" font-size="9" font-weight="700" fill="currentColor">' + steps[i][0] + '</text>';
  }
  // 可信度箭頭（右側，向上）
  s += '<path d="M284 176 L284 44" stroke="' + GREEN + '" stroke-width="2" marker-end="url(#clu)"/>';
  s += '<text x="276" y="36" text-anchor="middle" font-size="9" font-weight="800" fill="' + GREEN + '">可信度↑</text>';
  s += '<text x="150" y="196" text-anchor="middle" font-size="9.5" fill="' + MUT + '">能被多方獨立查證、找得到原始出處的，最可信。</text>';
  s += '<defs><marker id="clu" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + GREEN + '"/></marker></defs>';
  return s + '</svg>';
}

// L2 teach3：查證三步推動「可信度錶」——顯示查證這個動作如何讓可信度升高（推理動作）。
function credMeter(): string {
  var s = '<svg viewBox="0 0 300 202" role="img" aria-label="在社群看到一則很震驚的消息，先別急著相信或轉傳，做三個查證動作，可信度錶的指針就會往上升。第一問找得到原始出處嗎，第二問有沒有多家獨立媒體都報導，第三問日期和前後脈絡對不對。三個都通過，可信度才升到高；交叉比對兩三個獨立可靠來源再決定要不要相信或轉傳">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">查證三步，推動「可信度錶」</text>';
  // 震驚消息
  s += '<rect x="90" y="24" width="120" height="24" rx="8" fill="' + WARN + '" opacity="0.12"/>';
  s += '<text x="150" y="40" text-anchor="middle" font-size="9.5" font-weight="700" fill="' + WARN + '">😱 一則很震驚的消息</text>';
  // 半圓錶
  var cx = 150, cy = 128, r = 56;
  s += '<path d="M' + (cx - r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + cy + '" fill="none" stroke="' + MUT + '" stroke-width="7" opacity="0.25"/>';
  // 三段色（低/中/高）
  s += '<path d="M' + (cx - r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx - r * 0.5) + ' ' + (cy - r * 0.866) + '" fill="none" stroke="' + WARN + '" stroke-width="7"/>';
  s += '<path d="M' + (cx - r * 0.5) + ' ' + (cy - r * 0.866) + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r * 0.5) + ' ' + (cy - r * 0.866) + '" fill="none" stroke="' + AMBER + '" stroke-width="7"/>';
  s += '<path d="M' + (cx + r * 0.5) + ' ' + (cy - r * 0.866) + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r) + ' ' + cy + '" fill="none" stroke="' + GREEN + '" stroke-width="7"/>';
  s += '<text x="' + (cx - r) + '" y="' + (cy + 12) + '" text-anchor="middle" font-size="8" fill="' + WARN + '">低</text>';
  s += '<text x="' + (cx + r) + '" y="' + (cy + 12) + '" text-anchor="middle" font-size="8" fill="' + GREEN + '">高</text>';
  // 指針指向偏高（查證後）
  var ang = Math.PI - (Math.PI * 0.82);
  var nx = cx + Math.cos(ang) * (r - 8), ny = cy - Math.sin(ang) * (r - 8);
  s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + nx.toFixed(1) + '" y2="' + ny.toFixed(1) + '" stroke="currentColor" stroke-width="2.4"/>';
  s += '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="currentColor"/>';
  s += '<text x="150" y="150" text-anchor="middle" font-size="9" font-weight="800" fill="' + GREEN + '">三步都通過 → 可信度升高</text>';
  // 三個查證步
  var checks = ['① 找得到原始出處？', '② 多家獨立媒體都報導？', '③ 日期與脈絡對不對？'];
  for (var i = 0; i < 3; i++) {
    s += '<text x="18" y="' + (168 + i * 12) + '" font-size="8.8" fill="currentColor">' + checks[i] + '</text>';
  }
  s += '<text x="282" y="196" text-anchor="end" font-size="8.5" fill="' + MUT + '">不確定就先不轉傳</text>';
  return s + '</svg>';
}

// L3 teach1：事實 vs 意見——用「可以查證、有對錯嗎？」這道判斷閘把句子分流。
function factOpinionGate(): string {
  var s = '<svg viewBox="0 0 300 196" role="img" aria-label="判斷一句話是事實還是意見，先過一道問題閘，問這句話可以查證、有對錯嗎。如果可以查證、有對錯，就是事實，例如這個城市昨天最高氣溫是三十五度。如果不行、只是個人看法沒有絕對對錯，就是意見，例如這個城市是最棒的地方。用這道問題去分流，就能分清事實和意見">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">一道問題，分清事實與意見</text>';
  // 菱形判斷閘
  s += '<polygon points="150,30 236,64 150,98 64,64" fill="' + SKY + '" opacity="0.12"/>';
  s += '<polygon points="150,30 236,64 150,98 64,64" fill="none" stroke="' + SKY + '" stroke-width="1.6"/>';
  s += '<text x="150" y="60" text-anchor="middle" font-size="9.5" font-weight="800" fill="' + SKY + '">可以查證、</text>';
  s += '<text x="150" y="74" text-anchor="middle" font-size="9.5" font-weight="800" fill="' + SKY + '">有對錯嗎？</text>';
  // 是 → 事實
  s += '<path d="M64 64 L30 64 L30 112" stroke="' + GREEN + '" stroke-width="1.8" fill="none" marker-end="url(#fog)"/>';
  s += '<text x="46" y="60" text-anchor="middle" font-size="9" font-weight="800" fill="' + GREEN + '">是</text>';
  s += '<rect x="12" y="116" width="128" height="60" rx="10" fill="' + GREEN + '" opacity="0.1"/>';
  s += '<rect x="12" y="116" width="128" height="60" rx="10" fill="none" stroke="' + GREEN + '" stroke-width="1.5"/>';
  s += '<text x="76" y="134" text-anchor="middle" font-size="10" font-weight="800" fill="' + GREEN + '">✅ 事實</text>';
  s += '<text x="76" y="152" text-anchor="middle" font-size="8.8" fill="currentColor">「昨天最高氣溫</text>';
  s += '<text x="76" y="166" text-anchor="middle" font-size="8.8" fill="currentColor">是 35 度」</text>';
  // 否 → 意見
  s += '<path d="M236 64 L270 64 L270 112" stroke="' + AMBER + '" stroke-width="1.8" fill="none" marker-end="url(#foa)"/>';
  s += '<text x="254" y="60" text-anchor="middle" font-size="9" font-weight="800" fill="' + AMBER + '">否</text>';
  s += '<rect x="160" y="116" width="128" height="60" rx="10" fill="' + AMBER + '" opacity="0.12"/>';
  s += '<rect x="160" y="116" width="128" height="60" rx="10" fill="none" stroke="' + AMBER + '" stroke-width="1.5"/>';
  s += '<text x="224" y="134" text-anchor="middle" font-size="10" font-weight="800" fill="' + AMBER + '">💭 意見</text>';
  s += '<text x="224" y="152" text-anchor="middle" font-size="8.8" fill="currentColor">「這裡是最棒</text>';
  s += '<text x="224" y="166" text-anchor="middle" font-size="8.8" fill="currentColor">的地方」</text>';
  s += '<text x="150" y="190" text-anchor="middle" font-size="9.5" fill="' + MUT + '">事實查得到、有對錯；意見是個人看法。</text>';
  s += '<defs>' +
    '<marker id="fog" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + GREEN + '"/></marker>' +
    '<marker id="foa" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + AMBER + '"/></marker>' +
    '</defs>';
  return s + '</svg>';
}

// L3 teach2：宣傳／帶風向——情緒字眼＋只給一面之詞，像在天平上加重量，把你推向某一邊。
function propagandaSeesaw(): string {
  var s = '<svg viewBox="0 0 300 194" role="img" aria-label="宣傳或帶風向，是刻意用很多情緒字眼、而且只講一面之詞，想讓你站到某一邊。就像一座天平，一邊堆滿了情緒化的字和只給一面的說法，天平就被壓得往那一邊倒，想推著你的想法跟著倒過去。看到這種只給一面、情緒很強的內容，要特別小心">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">宣傳／帶風向：想把你推向某一邊</text>';
  // 支點
  s += '<path d="M150 150 L134 174 L166 174 Z" fill="' + MUT + '"/>';
  // 傾斜的橫桿（往左倒）
  s += '<line x1="42" y1="150" x2="258" y2="110" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>';
  // 左盤（重，情緒＋一面）
  s += '<rect x="30" y="150" width="92" height="30" rx="8" fill="' + WARN + '" opacity="0.14"/>';
  s += '<rect x="30" y="150" width="92" height="30" rx="8" fill="none" stroke="' + WARN + '" stroke-width="1.4"/>';
  s += '<text x="76" y="164" text-anchor="middle" font-size="8.5" font-weight="800" fill="' + WARN + '">情緒字眼</text>';
  s += '<text x="76" y="176" text-anchor="middle" font-size="8" fill="currentColor">「最爛！太誇張！」</text>';
  // 右盤（輕，另一面被忽略）
  s += '<rect x="186" y="80" width="92" height="30" rx="8" fill="' + MUT + '" opacity="0.1"/>';
  s += '<rect x="186" y="80" width="92" height="30" rx="8" fill="none" stroke="' + MUT + '" stroke-width="1.2" stroke-dasharray="3 2"/>';
  s += '<text x="232" y="94" text-anchor="middle" font-size="8.5" font-weight="700" fill="' + MUT + '">另一面</text>';
  s += '<text x="232" y="106" text-anchor="middle" font-size="8" fill="' + MUT + '">被忽略、不講</text>';
  s += '<text x="150" y="34" text-anchor="middle" font-size="9" fill="currentColor">只給一面之詞 → 把你的想法壓向那一邊</text>';
  s += '<text x="150" y="192" text-anchor="middle" font-size="9.5" fill="' + MUT + '">看到情緒很強、只講一面的內容，要特別小心。</text>';
  return s + '</svg>';
}

// L3 teach3：把一段「假想」報導的句子，實際套用判斷，標成事實／意見／宣傳（套用的動作）。
function classifyApply(): string {
  var s = '<svg viewBox="0 0 300 198" role="img" aria-label="練習把一段假想報導的句子分類。第一句某地昨天下午發生規模五級地震，可以查證，是事實。第二句我個人認為救災還可以更快，是沒有絕對對錯的個人看法，是意見。第三句那些人全都冷血無能、根本不配管事，用了強烈情緒字眼又只罵一邊，是宣傳帶風向。練習時一邊讀一邊留意情緒性字眼">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">套用看看：這三句各是哪一種？</text>';
  var rows: [string, string, string, string][] = [
    ['某地昨天下午發生規模五級地震。', '✅ 事實', '查得到、有對錯', GREEN],
    ['我個人認為救災還可以更快。', '💭 意見', '個人看法，沒絕對對錯', AMBER],
    ['那些人全都冷血無能、不配管事！', '📣 宣傳', '強烈情緒＋只罵一邊', WARN]
  ];
  for (var i = 0; i < 3; i++) {
    var y = 28 + i * 50;
    s += '<rect x="12" y="' + y + '" width="276" height="44" rx="10" fill="' + rows[i][3] + '" opacity="0.1"/>';
    s += '<rect x="12" y="' + y + '" width="276" height="44" rx="10" fill="none" stroke="' + rows[i][3] + '" stroke-width="1.4"/>';
    s += '<text x="20" y="' + (y + 18) + '" font-size="9.5" fill="currentColor">' + rows[i][0] + '</text>';
    s += '<text x="20" y="' + (y + 35) + '" font-size="9" font-weight="800" fill="' + rows[i][3] + '">' + rows[i][1] + '</text>';
    s += '<text x="118" y="' + (y + 35) + '" font-size="8.5" fill="' + MUT + '">（' + rows[i][2] + '）</text>';
  }
  s += '<text x="150" y="192" text-anchor="middle" font-size="9.5" fill="' + MUT + '">一邊讀一邊問：查得到嗎？是看法嗎？在帶我情緒嗎？</text>';
  return s + '</svg>';
}

// L4 teach2：用洲別／半球／鄰近海洋快速定位（參考線地圖；★只畫色塊，不畫國界）。
function locateRefs(): string {
  var s = '<svg viewBox="0 0 300 196" role="img" aria-label="要描述一個地方在哪裡，可以用三個線索：在哪一洲、在赤道以北還是以南的哪個半球、鄰近哪個大洋。這是一張只畫洲別色塊、不畫國界的簡化世界圖，中間一條虛線是赤道，分出北半球和南半球。台灣用一個點標在亞洲的東緣、面向太平洋，位在北半球。學會用洲別、半球、鄰海來定位，聽到新聞說某地就能很快找到它">';
  s += '<text x="150" y="15" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">用洲別・半球・鄰海，快速定位</text>';
  // 地圖框（海洋底）
  s += '<rect x="12" y="24" width="276" height="130" rx="10" fill="' + SKY + '" opacity="0.08"/>';
  s += '<rect x="12" y="24" width="276" height="130" rx="10" fill="none" stroke="' + MUT + '" stroke-width="1" opacity="0.4"/>';
  // 洲別色塊（風格化，無國界）
  var blobs: [number, number, number, number, string][] = [
    [60, 58, 34, 20, '北美洲'], [92, 120, 20, 16, '南美洲'], [158, 56, 20, 14, '歐洲'],
    [168, 110, 24, 22, '非洲'], [224, 64, 40, 22, '亞洲'], [258, 128, 16, 12, '大洋洲']
  ];
  for (var i = 0; i < blobs.length; i++) {
    s += '<ellipse cx="' + blobs[i][0] + '" cy="' + blobs[i][1] + '" rx="' + blobs[i][2] + '" ry="' + blobs[i][3] + '" fill="' + SU + '" opacity="0.3"/>';
    s += '<text x="' + blobs[i][0] + '" y="' + (blobs[i][1] + 3) + '" text-anchor="middle" font-size="8" fill="' + SU + '">' + blobs[i][4] + '</text>';
  }
  // 赤道
  s += '<line x1="12" y1="100" x2="288" y2="100" stroke="' + WARN + '" stroke-width="1.4" stroke-dasharray="5 3"/>';
  s += '<text x="20" y="96" font-size="8" fill="' + WARN + '">赤道</text>';
  s += '<text x="276" y="40" text-anchor="end" font-size="8" fill="' + MUT + '">北半球</text>';
  s += '<text x="276" y="150" text-anchor="end" font-size="8" fill="' + MUT + '">南半球</text>';
  // 台灣點（亞洲東緣）
  s += '<circle cx="250" cy="78" r="3.4" fill="' + WARN + '"/>';
  s += '<text x="250" y="92" text-anchor="middle" font-size="8.5" font-weight="800" fill="' + WARN + '">台灣</text>';
  s += '<text x="266" y="104" text-anchor="middle" font-size="7.5" fill="' + SKY + '">太平洋</text>';
  s += '<text x="150" y="170" text-anchor="middle" font-size="9.5" fill="currentColor">台灣：在亞洲東緣、北半球、面向太平洋。</text>';
  s += '<text x="150" y="187" text-anchor="middle" font-size="9" fill="' + MUT + '">三個線索：哪一洲 ・ 哪個半球 ・ 鄰近哪個大洋。</text>';
  return s + '</svg>';
}

// L4 teach3：知道位置 → 理解影響（鄰近地區的事件，可能影響台灣的貿易／班機／天氣）。
function proximityImpact(): string {
  var s = '<svg viewBox="0 0 300 190" role="img" aria-label="知道事件在哪裡，可以幫你理解它和台灣的關聯。假想鄰近地區發生一件事，像是一條條漣漪傳過來，可能影響台灣的貿易、來往的班機、甚至天氣。離得越近、關聯通常越明顯。所以在地圖上定位，不只是知道在哪，更能幫你判斷這件事和我們有沒有關係">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">知道位置，就能想到「影響」</text>';
  // 鄰近地區（假想、不具名）
  s += '<circle cx="78" cy="96" r="30" fill="' + MUT + '" opacity="0.12"/>';
  s += '<circle cx="78" cy="96" r="30" fill="none" stroke="' + MUT + '" stroke-width="1.4" stroke-dasharray="4 3"/>';
  s += '<text x="78" y="90" text-anchor="middle" font-size="15">⚡</text>';
  s += '<text x="78" y="106" text-anchor="middle" font-size="8.5" fill="currentColor">鄰近地區</text>';
  s += '<text x="78" y="118" text-anchor="middle" font-size="8" fill="' + MUT + '">發生某事（假想）</text>';
  // 漣漪 → 台灣
  s += '<path d="M110 88 Q160 72 206 86" stroke="' + AMBER + '" stroke-width="2" fill="none" marker-end="url(#pia)"/>';
  s += '<path d="M110 98 Q160 100 204 98" stroke="' + SKY + '" stroke-width="2" fill="none" marker-end="url(#pis)"/>';
  s += '<path d="M110 108 Q160 128 206 112" stroke="' + GREEN + '" stroke-width="2" fill="none" marker-end="url(#pig)"/>';
  s += '<text x="150" y="70" text-anchor="middle" font-size="8.5" fill="' + AMBER + '">貿易</text>';
  s += '<text x="150" y="96" text-anchor="middle" font-size="8.5" fill="' + SKY + '">班機</text>';
  s += '<text x="150" y="128" text-anchor="middle" font-size="8.5" fill="' + GREEN + '">天氣</text>';
  // 台灣
  s += '<circle cx="226" cy="98" r="22" fill="' + WARN + '" opacity="0.12"/>';
  s += '<circle cx="226" cy="98" r="22" fill="none" stroke="' + WARN + '" stroke-width="1.6"/>';
  s += '<text x="226" y="102" text-anchor="middle" font-size="10" font-weight="800" fill="' + WARN + '">台灣</text>';
  s += '<text x="150" y="162" text-anchor="middle" font-size="10" fill="currentColor">離得越近，關聯通常越明顯。</text>';
  s += '<text x="150" y="180" text-anchor="middle" font-size="9.5" fill="' + MUT + '">定位不只知道在哪，更幫你判斷「和我們有沒有關係」。</text>';
  s += '<defs>' +
    '<marker id="pia" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + AMBER + '"/></marker>' +
    '<marker id="pis" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + SKY + '"/></marker>' +
    '<marker id="pig" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + GREEN + '"/></marker>' +
    '</defs>';
  return s + '</svg>';
}

// L5 teach1：世界很多元——地球＋多種語言的問候泡泡，彼此平等，沒有誰比較高級。
function diverseGlobe(): string {
  var s = '<svg viewBox="0 0 300 190" role="img" aria-label="世界上有很多國家、語言、宗教和文化，用地球周圍一圈大小一樣的問候泡泡來表示，有你好、Hello、こんにちは、안녕、Hola、Bonjour、Olá。它們一樣大、擺在一起，代表彼此平等，沒有哪一種語言或文化比較高級。多元是世界本來的樣子">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">世界很多元，彼此平等</text>';
  // 地球
  s += '<circle cx="150" cy="104" r="30" fill="' + SKY + '" opacity="0.18"/>';
  s += '<circle cx="150" cy="104" r="30" fill="none" stroke="' + SKY + '" stroke-width="1.6"/>';
  s += '<text x="150" y="112" text-anchor="middle" font-size="26">🌍</text>';
  // 問候泡泡（一圈，等大）
  var greet: [string, number, number][] = [
    ['你好', 150, 44], ['Hello', 232, 64], ['こんにちは', 258, 112],
    ['안녕', 214, 158], ['Hola', 92, 158], ['Bonjour', 42, 112], ['Olá', 70, 62]
  ];
  for (var i = 0; i < greet.length; i++) {
    var gx = greet[i][1], gy = greet[i][2];
    s += '<rect x="' + (gx - 30) + '" y="' + (gy - 11) + '" width="60" height="22" rx="11" fill="' + SU + '" opacity="0.12"/>';
    s += '<rect x="' + (gx - 30) + '" y="' + (gy - 11) + '" width="60" height="22" rx="11" fill="none" stroke="' + SU + '" stroke-width="1.2"/>';
    s += '<text x="' + gx + '" y="' + (gy + 3) + '" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor">' + greet[i][0] + '</text>';
  }
  s += '<text x="150" y="182" text-anchor="middle" font-size="9.5" fill="' + MUT + '">沒有哪一種語言或文化「比較高級」。</text>';
  return s + '</svg>';
}

// L5 teach2：刻板印象——放大鏡把「某群人都○○」拆解成「其實每個人都不一樣」的多元群像。
function stereotypeLens(): string {
  var s = '<svg viewBox="0 0 300 190" role="img" aria-label="刻板印象是用一句話套住一整群人，像左邊貼了一張標籤寫某群人都怎樣怎樣，底下的人被畫成一模一樣的灰色小人。但用放大鏡仔細看，右邊會發現其實每個人都不一樣，有不同的樣子、喜好和故事。用一句話套住一整群人，常常不準又傷人">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">刻板印象：一句話套住一整群人</text>';
  // 左：刻板標籤＋灰色一樣的人
  s += '<rect x="14" y="30" width="120" height="22" rx="8" fill="' + WARN + '" opacity="0.14"/>';
  s += '<rect x="14" y="30" width="120" height="22" rx="8" fill="none" stroke="' + WARN + '" stroke-width="1.4"/>';
  s += '<text x="74" y="45" text-anchor="middle" font-size="9" font-weight="800" fill="' + WARN + '">「某群人都○○」</text>';
  for (var i = 0; i < 4; i++) {
    var x = 30 + i * 26;
    s += '<circle cx="' + x + '" cy="78" r="7" fill="' + MUT + '" opacity="0.6"/>';
    s += '<rect x="' + (x - 6) + '" y="86" width="12" height="18" rx="4" fill="' + MUT + '" opacity="0.6"/>';
  }
  s += '<text x="74" y="120" text-anchor="middle" font-size="8.5" fill="' + MUT + '">被看成一模一樣</text>';
  // 放大鏡
  s += '<circle cx="158" cy="80" r="18" fill="none" stroke="' + SU + '" stroke-width="2.4"/>';
  s += '<line x1="171" y1="93" x2="184" y2="106" stroke="' + SU + '" stroke-width="3" stroke-linecap="round"/>';
  // 右：多元個體
  s += '<rect x="186" y="30" width="104" height="22" rx="8" fill="' + GREEN + '" opacity="0.12"/>';
  s += '<text x="238" y="45" text-anchor="middle" font-size="9" font-weight="800" fill="' + GREEN + '">其實每個人都不一樣</text>';
  var cols = [GREEN, SKY, AMBER, PURP];
  var faces = ['😀', '🧑‍🎨', '⚽', '📚'];
  for (var j = 0; j < 4; j++) {
    var rx = 202 + j * 24;
    s += '<circle cx="' + rx + '" cy="78" r="8" fill="' + cols[j] + '" opacity="0.3"/>';
    s += '<text x="' + rx + '" y="82" text-anchor="middle" font-size="11">' + faces[j] + '</text>';
  }
  s += '<text x="238" y="120" text-anchor="middle" font-size="8.5" fill="' + MUT + '">不同樣子、喜好、故事</text>';
  s += '<text x="150" y="150" text-anchor="middle" font-size="10" fill="currentColor">用一句話套住一整群人，常常不準又傷人。</text>';
  s += '<text x="150" y="172" text-anchor="middle" font-size="9.5" fill="' + MUT + '">先看見「每個人」，而不是只看見「標籤」。</text>';
  return s + '</svg>';
}

// L5 teach3：遇到不同的好路徑（好奇→理解脈絡→用事實與尊重判斷）vs 偏見捷徑。
function respectPath(): string {
  var s = '<svg viewBox="0 0 300 190" role="img" aria-label="遇到和自己不一樣的人事物，有兩條路。好的路徑是先保持好奇、問問看，再理解背後的脈絡，最後用事實和尊重來判斷，結果是彼此理解、更靠近。偏見的捷徑是直接用成見套上去、馬上下定論，結果常常誤會又傷人。選好奇和理解那條路，才是真的跟世界接軌">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">遇到不同：走哪一條路？</text>';
  // 好路徑
  s += '<text x="18" y="40" font-size="10" font-weight="800" fill="' + GREEN + '">好的路：先好奇，再判斷</text>';
  var good: [string, string][] = [['😮', '保持好奇、問問看'], ['🧩', '理解背後脈絡'], ['⚖️', '用事實與尊重判斷']];
  for (var i = 0; i < 3; i++) {
    var x = 14 + i * 94;
    s += '<rect x="' + x + '" y="48" width="84" height="46" rx="10" fill="' + GREEN + '" opacity="0.1"/>';
    s += '<rect x="' + x + '" y="48" width="84" height="46" rx="10" fill="none" stroke="' + GREEN + '" stroke-width="1.4"/>';
    s += '<text x="' + (x + 42) + '" y="70" text-anchor="middle" font-size="16">' + good[i][0] + '</text>';
    s += '<text x="' + (x + 42) + '" y="88" text-anchor="middle" font-size="8.5" fill="currentColor">' + good[i][1] + '</text>';
    if (i < 2) s += '<path d="M' + (x + 84) + ' 71 L' + (x + 94) + ' 71" stroke="' + GREEN + '" stroke-width="2" marker-end="url(#rpg)"/>';
  }
  s += '<text x="150" y="108" text-anchor="middle" font-size="9" fill="' + GREEN + '">→ 彼此理解、更靠近 🤝</text>';
  // 偏見捷徑
  s += '<rect x="14" y="118" width="272" height="40" rx="10" fill="' + WARN + '" opacity="0.1"/>';
  s += '<rect x="14" y="118" width="272" height="40" rx="10" fill="none" stroke="' + WARN + '" stroke-width="1.4" stroke-dasharray="4 3"/>';
  s += '<text x="26" y="135" font-size="10" font-weight="800" fill="' + WARN + '">偏見捷徑：直接用成見套上去</text>';
  s += '<text x="26" y="151" font-size="9" fill="currentColor">馬上下定論 → 常常誤會又傷人 ✗</text>';
  s += '<text x="150" y="178" text-anchor="middle" font-size="9.5" fill="' + MUT + '">選好奇與理解那條路，才是真的跟世界接軌。</text>';
  s += '<defs><marker id="rpg" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + GREEN + '"/></marker></defs>';
  return s + '</svg>';
}

// ===== lesson 群組 2：全球議題縱深（id 前綴 glob_）static SVG helpers =====================
//   難民 / 貧富差距 / NGO。難民第 1 課重用 playable Anim.worldLocator（示意跨國移動），
//   其餘 teach step 皆 static SVG（每步都有推理視覺、零純文字）。中性、同理、非恐嚇。

// G1 teach2：難民到了新地方面臨的四種挑戰（安置／語言／工作／身心照顧）——同理框架。
function refugeeChallenges(): string {
  var s = '<svg viewBox="0 0 300 200" role="img" aria-label="難民被迫離開家園、來到新地方後，重新生活並不容易，常會面臨四種挑戰。第一是安置，要找到安全的住處。第二是語言，當地語言的聽說讀寫都要重新適應。第三是工作，要重新找到工作與收入。第四是身心照顧，經歷過戰亂或災難的辛苦，需要時間和關心慢慢復原。這些都需要時間，也需要社會的理解與支持">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">難民常面臨的挑戰</text>';
  s += '<text x="150" y="32" text-anchor="middle" font-size="9" fill="' + MUT + '">被迫離開家園、重新生活並不容易</text>';
  var cards: [string, string, string, string][] = [
    ['🏠', '安置', '找到安全的住處', SKY],
    ['💬', '語言', '聽說讀寫要重新適應', PURP],
    ['💼', '工作', '重新找工作與收入', AMBER],
    ['🫂', '身心照顧', '受過的辛苦需要被關心', GREEN]
  ];
  for (var i = 0; i < 4; i++) {
    var col = i % 2, row = Math.floor(i / 2);
    var x = 14 + col * 140, y = 42 + row * 62;
    s += '<rect x="' + x + '" y="' + y + '" width="132" height="56" rx="10" fill="' + cards[i][3] + '" opacity="0.1"/>';
    s += '<rect x="' + x + '" y="' + y + '" width="132" height="56" rx="10" fill="none" stroke="' + cards[i][3] + '" stroke-width="1.3"/>';
    s += '<text x="' + (x + 22) + '" y="' + (y + 32) + '" text-anchor="middle" font-size="17">' + cards[i][0] + '</text>';
    s += '<text x="' + (x + 42) + '" y="' + (y + 22) + '" font-size="10" font-weight="800" fill="' + cards[i][3] + '">' + cards[i][1] + '</text>';
    s += '<text x="' + (x + 42) + '" y="' + (y + 40) + '" font-size="8.5" fill="currentColor">' + cards[i][2] + '</text>';
  }
  s += '<text x="150" y="192" text-anchor="middle" font-size="9.5" fill="' + MUT + '">這些都需要時間，也需要社會的理解與支持。</text>';
  return s + '</svg>';
}

// G1 teach3：國際上有組織與公約一起保護難民（保護傘）——理解勝過指責。
function refugeeProtection(): string {
  var s = '<svg viewBox="0 0 300 196" role="img" aria-label="國際上有組織和公約一起保護難民，像一把大傘撐在幾個人的上方，傘上寫著國際組織和人道公約。傘下的人代表受到保護的難民。這些保護做兩件事：幫忙安置與照顧基本生活所需、以及保障他們的安全與人權。面對難民議題，比較合適的態度是理解，而不是指責，因為他們和我們一樣，都只是想要安全的生活">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">國際上有人一起保護難民</text>';
  // 保護傘（半圓罩）
  s += '<path d="M50 118 A100 100 0 0 1 250 118" fill="' + GREEN + '" opacity="0.1"/>';
  s += '<path d="M50 118 A100 100 0 0 1 250 118" fill="none" stroke="' + GREEN + '" stroke-width="1.6"/>';
  s += '<text x="150" y="64" text-anchor="middle" font-size="10" font-weight="800" fill="' + GREEN + '">國際組織・人道公約</text>';
  s += '<text x="150" y="80" text-anchor="middle" font-size="8.5" fill="' + MUT + '">（像一把保護傘）</text>';
  // 傘下的人
  for (var i = 0; i < 3; i++) {
    var x = 116 + i * 34;
    s += '<circle cx="' + x + '" cy="98" r="7" fill="' + SU + '" opacity="0.5"/>';
    s += '<rect x="' + (x - 6) + '" y="106" width="12" height="12" rx="4" fill="' + SU + '" opacity="0.5"/>';
  }
  s += '<text x="150" y="134" text-anchor="middle" font-size="8.5" fill="currentColor">受到保護的人</text>';
  s += '<text x="150" y="152" text-anchor="middle" font-size="9" fill="currentColor">幫忙安置與基本需要 ・ 保障安全與人權</text>';
  s += '<text x="150" y="172" text-anchor="middle" font-size="10" font-weight="800" fill="' + SU + '">面對難民，理解勝過指責。</text>';
  s += '<text x="150" y="188" text-anchor="middle" font-size="9" fill="' + MUT + '">他們和我們一樣，都想要安全的生活。</text>';
  return s + '</svg>';
}

// G2 teach1：財富與機會分配不均——兩個「爬墊腳石」的人，高度落差＝貧富差距。
function wealthLadder(): string {
  var s = '<svg viewBox="0 0 300 200" role="img" aria-label="財富與機會的分配並不平均，畫面用兩個往上爬的人來比喻。左邊的人有比較多墊腳石，由下往上分別是教育、健康、工作機會、地區發展，所以站得比較高，代表機會較多、比較容易往上。右邊的人只有教育和健康兩塊墊腳石，上面工作機會和地區發展的位置是空的虛線，所以站得比較低，代表機會較少。兩個人高度的落差就是貧富差距。這些墊腳石不是人人都一樣多">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">財富與機會，分配並不平均</text>';
  s += '<text x="150" y="31" text-anchor="middle" font-size="9" fill="' + MUT + '">往上的「墊腳石」，不是人人都一樣多</text>';
  var labelsL = ['教育', '健康', '工作機會', '地區發展'];
  var ys = [152, 130, 108, 86];
  for (var i = 0; i < 4; i++) {
    s += '<rect x="40" y="' + ys[i] + '" width="72" height="16" rx="5" fill="' + SU + '" opacity="0.28"/>';
    s += '<rect x="40" y="' + ys[i] + '" width="72" height="16" rx="5" fill="none" stroke="' + SU + '" stroke-width="1"/>';
    s += '<text x="76" y="' + (ys[i] + 11) + '" text-anchor="middle" font-size="8.5" fill="currentColor">' + labelsL[i] + '</text>';
  }
  s += '<circle cx="76" cy="70" r="7" fill="' + GREEN + '" opacity="0.6"/>';
  s += '<rect x="70" y="78" width="12" height="14" rx="4" fill="' + GREEN + '" opacity="0.6"/>';
  s += '<text x="76" y="60" text-anchor="middle" font-size="8.5" font-weight="800" fill="' + GREEN + '">機會較多</text>';
  for (var j = 0; j < 4; j++) {
    if (j < 2) {
      s += '<rect x="188" y="' + ys[j] + '" width="72" height="16" rx="5" fill="' + SU + '" opacity="0.28"/>';
      s += '<rect x="188" y="' + ys[j] + '" width="72" height="16" rx="5" fill="none" stroke="' + SU + '" stroke-width="1"/>';
      s += '<text x="224" y="' + (ys[j] + 11) + '" text-anchor="middle" font-size="8.5" fill="currentColor">' + labelsL[j] + '</text>';
    } else {
      s += '<rect x="188" y="' + ys[j] + '" width="72" height="16" rx="5" fill="none" stroke="' + MUT + '" stroke-width="1" stroke-dasharray="4 3" opacity="0.6"/>';
    }
  }
  s += '<circle cx="224" cy="114" r="7" fill="' + AMBER + '" opacity="0.6"/>';
  s += '<rect x="218" y="122" width="12" height="14" rx="4" fill="' + AMBER + '" opacity="0.6"/>';
  s += '<text x="224" y="104" text-anchor="middle" font-size="8.5" font-weight="800" fill="' + AMBER + '">機會較少</text>';
  s += '<line x1="150" y1="70" x2="150" y2="114" stroke="' + WARN + '" stroke-width="1.6" stroke-dasharray="4 3" marker-start="url(#wlu)" marker-end="url(#wld)"/>';
  s += '<text x="158" y="94" font-size="9" font-weight="800" fill="' + WARN + '">差距</text>';
  s += '<text x="150" y="192" text-anchor="middle" font-size="9" fill="' + MUT + '">兩人高度的落差，就是貧富差距。</text>';
  s += '<defs>' +
    '<marker id="wlu" markerWidth="7" markerHeight="7" refX="3" refY="5" orient="auto"><path d="M3 0 L6 6 L0 6 z" fill="' + WARN + '"/></marker>' +
    '<marker id="wld" markerWidth="7" markerHeight="7" refX="3" refY="2" orient="auto"><path d="M0 0 L6 0 L3 6 z" fill="' + WARN + '"/></marker>' +
    '</defs>';
  return s + '</svg>';
}

// G2 teach2：成因複雜——多種因素交織，匯流到「貧富差距」結果框（單一箭頭，止於框緣）。
function inequalityCauses(): string {
  var s = '<svg viewBox="0 0 300 192" role="img" aria-label="貧富差距的成因很複雜，是許多因素交織在一起造成的，包括教育機會、工作機會、健康、地區發展和歷史因素，這五個因素彼此交織影響，一起造成貧富差距，而不是單一原因。所以不能簡化成單一原因，也不應該歸咎於個人">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">成因複雜：多種因素交織</text>';
  var chips: [string, number, number, string][] = [
    ['教育機會', 16, 30, SKY], ['工作機會', 108, 30, PURP], ['健康', 200, 30, GREEN],
    ['地區發展', 62, 60, AMBER], ['歷史因素', 154, 60, MUT]
  ];
  for (var i = 0; i < chips.length; i++) {
    var x = chips[i][1], y = chips[i][2], c = chips[i][3];
    s += '<rect x="' + x + '" y="' + y + '" width="84" height="24" rx="12" fill="' + c + '" opacity="0.14"/>';
    s += '<rect x="' + x + '" y="' + y + '" width="84" height="24" rx="12" fill="none" stroke="' + c + '" stroke-width="1.2"/>';
    s += '<text x="' + (x + 42) + '" y="' + (y + 16) + '" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor">' + chips[i][0] + '</text>';
  }
  s += '<text x="150" y="100" text-anchor="middle" font-size="9" fill="' + MUT + '">彼此交織影響</text>';
  s += '<path d="M150 104 L150 118" stroke="' + MUT + '" stroke-width="1.8" marker-end="url(#icd)"/>';
  s += '<rect x="54" y="122" width="192" height="40" rx="12" fill="' + SU + '" opacity="0.12"/>';
  s += '<rect x="54" y="122" width="192" height="40" rx="12" fill="none" stroke="' + SU + '" stroke-width="1.5"/>';
  s += '<text x="150" y="140" text-anchor="middle" font-size="10.5" font-weight="800" fill="' + SU + '">造成貧富差距</text>';
  s += '<text x="150" y="156" text-anchor="middle" font-size="8.8" fill="currentColor">多重因素交織的結構性問題</text>';
  s += '<text x="150" y="182" text-anchor="middle" font-size="9" fill="' + MUT + '">不能簡化成單一原因，也不該歸咎個人。</text>';
  s += '<defs><marker id="icd" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + MUT + '"/></marker></defs>';
  return s + '</svg>';
}

// G2 teach3：改善方向——教育機會／社會安全網／公平制度 → 縮小差距。
function inequalitySolutions(): string {
  var s = '<svg viewBox="0 0 300 192" role="img" aria-label="改善貧富差距有幾個常見的努力方向。第一是擴大教育與學習的機會，第二是建立社會安全網照顧需要幫助的人，第三是建立公平的制度。這三個方向一起努力，就能幫助更多人有機會，讓差距慢慢縮小。沒有單一答案，但每個人都可以關心這個議題">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">可以努力的方向</text>';
  var cards: [string, string, string, string][] = [
    ['📚', '擴大教育', '與學習機會', SKY],
    ['🛟', '社會安全網', '照顧需要的人', GREEN],
    ['⚖️', '公平制度', '機會更公平', PURP]
  ];
  for (var i = 0; i < 3; i++) {
    var x = 14 + i * 94;
    s += '<rect x="' + x + '" y="34" width="84" height="58" rx="10" fill="' + cards[i][3] + '" opacity="0.1"/>';
    s += '<rect x="' + x + '" y="34" width="84" height="58" rx="10" fill="none" stroke="' + cards[i][3] + '" stroke-width="1.3"/>';
    s += '<text x="' + (x + 42) + '" y="58" text-anchor="middle" font-size="18">' + cards[i][0] + '</text>';
    s += '<text x="' + (x + 42) + '" y="76" text-anchor="middle" font-size="9.5" font-weight="800" fill="' + cards[i][3] + '">' + cards[i][1] + '</text>';
    s += '<text x="' + (x + 42) + '" y="89" text-anchor="middle" font-size="8" fill="currentColor">' + cards[i][2] + '</text>';
  }
  s += '<path d="M150 96 L150 110" stroke="' + GREEN + '" stroke-width="1.8" marker-end="url(#isd)"/>';
  s += '<rect x="40" y="114" width="220" height="34" rx="10" fill="' + GREEN + '" opacity="0.12"/>';
  s += '<rect x="40" y="114" width="220" height="34" rx="10" fill="none" stroke="' + GREEN + '" stroke-width="1.4"/>';
  s += '<text x="150" y="135" text-anchor="middle" font-size="9.5" font-weight="700" fill="currentColor">讓更多人有機會，差距就能慢慢縮小</text>';
  s += '<text x="150" y="170" text-anchor="middle" font-size="9.5" fill="currentColor">沒有單一答案，但每個人都可以關心。</text>';
  s += '<defs><marker id="isd" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + GREEN + '"/></marker></defs>';
  return s + '</svg>';
}

// G3 teach1：NGO＝民間自發、非營利、為公益；投入人道／環境／醫療／教育等領域。
function ngoDomains(): string {
  var s = '<svg viewBox="0 0 300 196" role="img" aria-label="NGO 是非政府組織，由民間自發成立、不以營利為主要目的，為了公益而行動。它們投入很多不同領域，常見的有四種：人道救援、環境保護、醫療，以及教育。這些都是民間為了讓世界更好而投入的公益行動">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">NGO：民間自發、為公益</text>';
  s += '<rect x="16" y="26" width="268" height="40" rx="10" fill="' + SU + '" opacity="0.1"/>';
  s += '<rect x="16" y="26" width="268" height="40" rx="10" fill="none" stroke="' + SU + '" stroke-width="1.3"/>';
  s += '<text x="150" y="44" text-anchor="middle" font-size="9.5" font-weight="800" fill="' + SU + '">NGO（非政府組織）</text>';
  s += '<text x="150" y="59" text-anchor="middle" font-size="8.8" fill="currentColor">民間自發成立、不以營利為主，為公益行動</text>';
  var doms: [string, string, string][] = [
    ['🆘', '人道救援', WARN], ['🌱', '環境', GREEN], ['➕', '醫療', SKY], ['📖', '教育', AMBER]
  ];
  for (var i = 0; i < 4; i++) {
    var x = 12 + i * 70;
    s += '<rect x="' + x + '" y="88" width="66" height="72" rx="10" fill="' + doms[i][2] + '" opacity="0.1"/>';
    s += '<rect x="' + x + '" y="88" width="66" height="72" rx="10" fill="none" stroke="' + doms[i][2] + '" stroke-width="1.3"/>';
    s += '<text x="' + (x + 33) + '" y="122" text-anchor="middle" font-size="22">' + doms[i][0] + '</text>';
    s += '<text x="' + (x + 33) + '" y="146" text-anchor="middle" font-size="10" font-weight="800" fill="' + doms[i][2] + '">' + doms[i][1] + '</text>';
  }
  s += '<text x="150" y="182" text-anchor="middle" font-size="9" fill="' + MUT + '">投入人道、環境、醫療、教育等不同領域。</text>';
  return s + '</svg>';
}

// G3 teach2：國際合作——各國政府／聯合國體系／國際 NGO／在地組織連到地球，一起面對共同問題。
function globalCooperation(): string {
  var s = '<svg viewBox="0 0 300 196" role="img" aria-label="國際合作是指各國政府、聯合國體系、國際的 NGO 和在地組織，跨越國界一起合作。畫面中間是一顆地球，四個角落各有一個合作的夥伴，用線連到地球，代表大家一起透過全球合作，共同面對難民、災難、疾病和氣候這些需要跨國一起處理的問題">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">國際合作：跨國一起面對</text>';
  var gx = 150, gy = 96, gr = 28;
  var nodes: [string, number, number][] = [
    ['各國政府', 66, 52], ['聯合國體系', 234, 52], ['國際 NGO', 66, 140], ['在地組織', 234, 140]
  ];
  for (var i = 0; i < 4; i++) {
    var nx = nodes[i][1], ny = nodes[i][2];
    var dx = gx - nx, dy = gy - ny, d = Math.sqrt(dx * dx + dy * dy);
    var ux = dx / d, uy = dy / d;
    var x1 = (nx + ux * 7).toFixed(1), y1 = (ny + uy * 7).toFixed(1);
    var x2 = (gx - ux * gr).toFixed(1), y2 = (gy - uy * gr).toFixed(1);
    s += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + MUT + '" stroke-width="1.4" stroke-dasharray="4 3" opacity="0.7"/>';
  }
  s += '<circle cx="' + gx + '" cy="' + gy + '" r="' + gr + '" fill="' + SKY + '" opacity="0.16"/>';
  s += '<circle cx="' + gx + '" cy="' + gy + '" r="' + gr + '" fill="none" stroke="' + SKY + '" stroke-width="1.6"/>';
  s += '<text x="' + gx + '" y="' + (gy + 8) + '" text-anchor="middle" font-size="22">🌍</text>';
  for (var j = 0; j < 4; j++) {
    var px = nodes[j][1], py = nodes[j][2];
    s += '<circle cx="' + px + '" cy="' + py + '" r="7" fill="' + SU + '" opacity="0.5"/>';
    var al = px < gx ? 'end' : 'start';
    var tx = px < gx ? px - 10 : px + 10;
    s += '<text x="' + tx + '" y="' + (py + 3) + '" text-anchor="' + al + '" font-size="9" font-weight="700" fill="currentColor">' + nodes[j][0] + '</text>';
  }
  s += '<text x="150" y="180" text-anchor="middle" font-size="9" fill="currentColor">一起面對：難民 ・ 災難 ・ 疾病 ・ 氣候</text>';
  s += '<text x="150" y="193" text-anchor="middle" font-size="8.5" fill="' + MUT + '">跨越國界，各國與組織合作處理共同問題。</text>';
  return s + '</svg>';
}

// G3 teach3：學生參與全球議題的三步——了解議題→理性討論→適度參與（箭頭止於框緣）。
function studentAction(): string {
  var s = '<svg viewBox="0 0 300 182" role="img" aria-label="身為學生，想參與全球議題可以這樣開始。第一步先了解議題，去讀可信的資訊。第二步理性討論，聽聽不同的意見。第三步適度參與，像是參加校內的公益活動或當志工。這三步做下來，世界就會因此多一點好">';
  s += '<text x="150" y="16" text-anchor="middle" font-size="12" font-weight="800" fill="' + SU + '">小公民可以這樣開始</text>';
  var steps: [string, string, string][] = [
    ['📖', '了解議題', '讀可信的資訊'], ['💬', '理性討論', '聽不同意見'], ['🙌', '適度參與', '校內公益・志工']
  ];
  for (var i = 0; i < 3; i++) {
    var x = 14 + i * 94;
    s += '<rect x="' + x + '" y="40" width="84" height="56" rx="10" fill="' + GREEN + '" opacity="0.1"/>';
    s += '<rect x="' + x + '" y="40" width="84" height="56" rx="10" fill="none" stroke="' + GREEN + '" stroke-width="1.3"/>';
    s += '<text x="' + (x + 42) + '" y="64" text-anchor="middle" font-size="18">' + steps[i][0] + '</text>';
    s += '<text x="' + (x + 42) + '" y="80" text-anchor="middle" font-size="9.5" font-weight="800" fill="' + GREEN + '">' + steps[i][1] + '</text>';
    s += '<text x="' + (x + 42) + '" y="92" text-anchor="middle" font-size="7.8" fill="currentColor">' + steps[i][2] + '</text>';
    if (i < 2) s += '<path d="M' + (x + 84) + ' 68 L' + (x + 94) + ' 68" stroke="' + GREEN + '" stroke-width="2" marker-end="url(#sad)"/>';
  }
  s += '<text x="150" y="124" text-anchor="middle" font-size="10" font-weight="700" fill="' + SU + '">→ 世界因此多一點好 🌍</text>';
  s += '<text x="150" y="150" text-anchor="middle" font-size="9" fill="' + MUT + '">從力所能及的事開始，就是最好的參與。</text>';
  s += '<defs><marker id="sad" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + GREEN + '"/></marker></defs>';
  return s + '</svg>';
}

window.CONCEPT = {
  progKey: 'world_affairs_concepts_v1', practiceHref: '',
  lessons: [
    {
      id: 'news_read', name: '一則新聞怎麼讀', emoji: '📰', color: SU,
      sub: '先問 5W1H；標題不等於全部；分清事件與評論',
      done: '記住：一則新聞要回答六個問題——誰（Who）、發生什麼（What）、何時（When）、哪裡（Where）、為什麼（Why）、怎麼發生（How）。標題常為了吸引點閱而誇大或只講一半，一定要讀內文看完整脈絡；還要分清「發生的事」和「別人的評論」，別把意見當成事實。先問 5W1H，別被標題牽著走。',
      steps: [
        {
          type: 'teach', kicker: '六個問題', title: '一則新聞，回答 5W1H',
          svg: fiveW1H(),
          text: '讀一則新聞，先找出它回答了哪六個問題：<b>誰（Who）</b>、<b>發生什麼事（What）</b>、<b>何時（When）</b>、<b>在哪裡（Where）</b>、<b>為什麼（Why）</b>、<b>怎麼發生／怎麼做（How）</b>，合稱 <b>5W1H</b>。看例句：把「昨天下午」對到<b>何時</b>、「某國東部」對到<b>哪裡</b>、「強烈地震」對到<b>為什麼</b>、「當地政府」對到<b>誰</b>、「緊急疏散居民」對到<b>發生什麼</b>、「用廣播通知」對到<b>怎麼做</b>。六個都找出來，你就讀懂了事件的<b>全貌</b>。'
        },
        {
          type: 'teach', kicker: '標題會騙人', title: '標題不等於全部',
          svg: headlineCompare(),
          text: '同一件事，可以用很不一樣的方式說。很多<b>標題</b>為了吸引你<b>點進去</b>，會<b>誇大</b>或<b>只講一半</b>——像把「規模不大的地震」寫成「驚天動地、恐全面停擺？！」。但<b>讀完整內文</b>才發現：規模較小、沒有人受傷、交通很快恢復。所以<b>標題不等於全部</b>，看到聳動標題別急著下結論，要<b>讀內文、看完整脈絡</b>。'
        },
        {
          type: 'teach', kicker: '事件 vs 評論', title: '分清「發生的事」與「評論」',
          svg: eventVsComment(),
          text: '同一篇報導裡，常常<b>兩種句子</b>都有。一種是<b>發生的事</b>（客觀描述、<b>可以查證</b>）：「某地今天發生地震，規模五級。」另一種是<b>評論</b>（記者或他人的<b>個人看法</b>、沒有絕對對錯）：「我覺得政府反應太慢了。」讀的時候把兩種<b>分開</b>，就不會把<b>別人的意見</b>當成<b>事實</b>。先問自己：這句話<b>查得到、有對錯嗎</b>？'
        },
        {
          type: 'quiz', kicker: '換你試試', title: '讀新聞時，只看標題就下結論，可能會？',
          options: ['被誇大或片面的標題誤導', '最準確', '最省時又最正確', '完全沒問題'],
          answer: 0,
          why: '標題常為了吸睛而誇大或只講一半，要讀內文、看完整脈絡，才不會被誤導。',
          whyWrong: { 1: '只看標題反而最不準，因為標題常誇大或只講一半，不是「最準確」。', 2: '省時卻可能被誤導，不算正確；要讀內文才看得到完整事實。', 3: '只看標題很可能被帶偏，不是「完全沒問題」。' }
        },
        {
          type: 'quiz', kicker: '想一想', title: '下列哪一個「不是」新聞 5W1H 要回答的問題？',
          options: ['這則新聞有幾個字', '發生什麼事（What）', '在哪裡發生（Where）', '為什麼發生（Why）'],
          answer: 0,
          why: '5W1H 是誰、什麼、何時、何地、為何、如何；一則新聞有幾個字和理解事件無關。',
          whyWrong: { 1: '「發生什麼事（What）」正是 5W1H 之一，所以不是要挑的那一個。', 2: '「在哪裡（Where）」正是 5W1H 之一，不是要挑的那一個。', 3: '「為什麼（Why）」正是 5W1H 之一，不是要挑的那一個。' }
        }
      ]
    },
    {
      id: 'news_source', name: '消息從哪來', emoji: '🔍', color: SU,
      sub: '一手 vs 二手；看出處、看多方；先查證再轉傳',
      done: '記住：一手來源（當事人、現場、官方原始資料）比二手、轉述可靠；判斷可信度要看有沒有具名負責的媒體或機構、找不找得到原始出處、是否多方求證。社群上越震驚的消息越要先「交叉比對」兩三個獨立可靠來源，不確定就先不轉傳。先找出處、交叉比對，再決定信不信。',
      steps: [
        {
          type: 'teach', kicker: '來源的距離', title: '一手來源 vs 二手／轉述',
          svg: sourceChain(),
          text: '消息有兩種來源。<b>一手來源</b>＝<b>當事人、現場、官方原始資料</b>，直接接觸事件，像一條<b>實線</b>直接連到你，比較可靠。<b>二手／轉述</b>＝<b>別人整理、再轉傳</b>，中間經過好幾手，像一條<b>虛線繞一大圈</b>，每<b>轉一次</b>都可能<b>走樣、加油添醋</b>。原則很簡單：<b>離事件越近、經手越少</b>，通常越可靠。'
        },
        {
          type: 'teach', kicker: '可信度階梯', title: '可信度看什麼：越往上越可信',
          svg: credLadder(),
          text: '怎麼看一則消息可不可信？想像一座<b>階梯</b>，越往上越可信：最低一階是<b>匿名群組轉傳</b>（沒人負責）；往上是<b>單一、沒聽過的網站</b>；再往上是<b>具名、要負責的媒體</b>；最高一階是<b>多家獨立媒體都報導、而且找得到官方原始出處</b>。判斷時就問三件事：<b>有沒有具名負責的媒體或機構</b>、<b>找不找得到原始出處</b>、<b>是否多方求證</b>。'
        },
        {
          type: 'teach', kicker: '查證三步', title: '先查證、交叉比對，再轉傳',
          svg: credMeter(),
          text: '在社群看到一則<b>很震驚</b>的消息，先<b>別急著相信或轉傳</b>。做三個查證動作，<b>「可信度錶」</b>的指針就會往上升：①<b>找得到原始出處嗎</b>？②<b>有沒有多家獨立媒體都報導</b>？③<b>日期和前後脈絡對不對</b>？越聳動越要先查。把兩三個<b>獨立、可靠</b>的來源<b>交叉比對</b>再決定——<b>不確定就先不轉傳</b>，才不會幫忙散播假訊息。'
        },
        {
          type: 'quiz', kicker: '換你試試', title: '下列哪一種消息，通常比較可信？',
          options: ['多家獨立媒體都報導、且找得到原始出處', '匿名群組轉傳的一句話', '沒有來源的截圖', '只有一個沒聽過的網站說'],
          answer: 0,
          why: '能被多方獨立查證、找得到原始出處的訊息較可信；匿名、單一、無出處的訊息風險高。',
          whyWrong: { 1: '匿名群組轉傳沒人負責、也查不到出處，風險高，不算比較可信。', 2: '沒有來源的截圖查不到出處、容易被改圖，不可靠。', 3: '只有一個沒聽過的網站說，沒有多方佐證，可信度低。' }
        },
        {
          type: 'quiz', kicker: '想一想', title: '在社群看到一則很震驚的消息，最好的做法是？',
          options: ['先查證、交叉比對再決定要不要相信或轉傳', '立刻轉給所有人', '覺得很誇張就是真的', '標題聳動就先相信'],
          answer: 0,
          why: '越聳動越要先查證；交叉比對兩三個獨立可靠來源，不確定就不轉傳，避免散播假訊息。',
          whyWrong: { 1: '沒查證就立刻轉給所有人，可能幫忙散播假訊息，很危險。', 2: '「覺得很誇張」是感覺不是證據，誇張不代表是真的。', 3: '標題越聳動越可能是為了吸睛而誇大，不能因此就先相信。' }
        }
      ]
    },
    {
      id: 'news_fact', name: '事實、意見與宣傳', emoji: '⚖️', color: SU,
      sub: '事實可查證；意見是看法；宣傳用情緒帶風向',
      done: '記住：事實＝可查證、有對錯（「某地今天發生地震」）；意見＝個人看法、沒有絕對對錯（「我覺得政府反應太慢」）。宣傳／帶風向＝刻意用情緒字眼、只給一面之詞，想讓你站某一邊。讀的時候練習把句子分成「事實」或「意見」，並留意情緒性字眼。分清事實與意見，就能看穿帶風向。',
      steps: [
        {
          type: 'teach', kicker: '一道問題', title: '事實 vs 意見：可以查證嗎？',
          svg: factOpinionGate(),
          text: '要分清一句話是<b>事實</b>還是<b>意見</b>，先過一道問題：<b>「可以查證、有對錯嗎？」</b>如果<b>可以查證、有對錯</b>，就是<b>事實</b>（例：「這個城市昨天的最高氣溫是 35 度」——去查資料就知道對不對）。如果<b>不行</b>、只是<b>個人看法</b>、沒有絕對對錯，就是<b>意見</b>（例：「這個城市是最棒的地方」）。用這道問題去<b>分流</b>，事實和意見就分清楚了。'
        },
        {
          type: 'teach', kicker: '小心帶風向', title: '宣傳／帶風向：想推你一把',
          svg: propagandaSeesaw(),
          text: '<b>宣傳／帶風向</b>＝刻意用很多<b>情緒字眼</b>（「最爛！太誇張！」），而且<b>只講一面之詞</b>，想讓你<b>站到某一邊</b>。就像一座<b>天平</b>：一邊堆滿情緒化的字和單方面的說法，天平就被壓得往那邊<b>倒</b>，想推著你的想法跟著倒。看到<b>只給一面、情緒很強</b>的內容，要特別<b>小心</b>——先問：另一面的說法呢？'
        },
        {
          type: 'teach', kicker: '套用看看', title: '練習分成事實／意見／宣傳',
          svg: classifyApply(),
          text: '把前面兩個方法<b>實際套用</b>到一段假想報導的句子上：「某地昨天下午發生規模五級地震。」——查得到、有對錯，是<b>事實✅</b>。「我個人認為救災還可以更快。」——是<b>個人看法</b>、沒有絕對對錯，是<b>意見💭</b>。「那些人全都冷血無能、不配管事！」——用了<b>強烈情緒字眼</b>又<b>只罵一邊</b>，是<b>宣傳📣</b>。練習時一邊讀一邊問：<b>查得到嗎？是看法嗎？在帶我情緒嗎？</b>'
        },
        {
          type: 'quiz', kicker: '換你試試', title: '下列哪一句是「事實」（可查證）？',
          options: ['這個城市昨天的最高氣溫是 35 度', '這個城市是全世界最棒的地方', '大家都應該搬到這裡住', '住這裡的人最聰明'],
          answer: 0,
          why: '氣溫數字可以查證、有對錯，是事實；其餘都是個人看法或主張（意見）。',
          whyWrong: { 1: '「最棒的地方」是個人看法、沒有絕對對錯，屬於意見。', 2: '「大家都應該…」是主張、呼籲，不是可查證的事實。', 3: '「最聰明」沒有客觀標準可查證，是個人看法。' }
        },
        {
          type: 'quiz', kicker: '想一想', title: '一篇報導用很多情緒字眼、只講一邊的好、要你討厭另一邊，這比較像？',
          options: ['宣傳／帶風向', '中立的事實報導', '氣象預報', '數學公式'],
          answer: 0,
          why: '刻意用情緒字眼、只給單方面資訊想影響你的立場，是宣傳的特徵，要特別小心。',
          whyWrong: { 1: '中立的事實報導會盡量平衡、不帶強烈情緒，和這種只講一邊的不一樣。', 2: '氣象預報是在陳述可查證的天氣資訊，不是在帶你討厭誰。', 3: '數學公式和立場、情緒無關，不是這種帶風向的內容。' }
        }
      ]
    },
    {
      id: 'news_map', name: '看世界地圖懂時事', emoji: '🗺️', color: SU,
      sub: '新聞說某國某洲，先在地圖上定位；位置幫你懂影響',
      done: '記住：新聞常說「某國」「某洲」，先在世界地圖上找到它，才知道離台灣多遠、是鄰居還是遠方。用洲別、半球、鄰近海洋可以快速定位；台灣在亞洲東緣、面向太平洋。知道位置還能幫你理解影響——鄰近地區的事件可能牽動台灣的貿易、班機、天氣。先在地圖上定位，時事就有了方向感。',
      steps: [
        {
          type: 'teach', kicker: '先看地圖', title: '新聞說某地，先在地圖上找到它',
          svg: animCanvas(300, 196, '世界地圖定位動畫：一張只畫七大洲色塊與海洋、完全不含國界的風格化世界地圖。動畫會依序在地圖上掉下定位針並脈動光環，先標出台灣（在亞洲東緣、面向太平洋），再輪流定位亞洲、歐洲、非洲、北美洲，幫你建立台灣和各洲的相對位置感。'),
          mount: function (host: HTMLElement) {
            var h = window.Anim!.worldLocator(host, {
              cycle: true,
              pins: [
                { region: 'tw', xFrac: 0.80, yFrac: 0.44, label: '台灣' },
                { region: 'asia', xFrac: 0.70, yFrac: 0.30, label: '亞洲' },
                { region: 'europe', xFrac: 0.50, yFrac: 0.25, label: '歐洲' },
                { region: 'africa', xFrac: 0.545, yFrac: 0.57, label: '非洲' },
                { region: 'namerica', xFrac: 0.17, yFrac: 0.30, label: '北美洲' }
              ]
            });
            return function () { h.stop(); };
          },
          text: '新聞常說「<b>某國</b>發生地震」「<b>某洲</b>舉行會議」。聽到地名，先在<b>世界地圖</b>上<b>找到它</b>，你才知道它<b>離台灣多遠</b>、是<b>鄰居</b>還是<b>遠方</b>。看動畫：地圖上先掉下一支針標出<b>台灣</b>（在<b>亞洲東緣、面向太平洋</b>），再輪流定位<b>亞洲、歐洲、非洲、北美洲</b>——這樣就能建立台灣和各大洲的<b>相對位置感</b>。（這張地圖只畫洲別和海洋，幫助定位用。）'
        },
        {
          type: 'teach', kicker: '三個線索', title: '用洲別・半球・鄰海定位',
          svg: locateRefs(),
          text: '要說清楚一個地方在哪，用<b>三個線索</b>最快：在<b>哪一洲</b>、在赤道以北還是以南的<b>哪個半球</b>、<b>鄰近哪個大洋</b>。看圖：中間的虛線是<b>赤道</b>，把世界分成<b>北半球</b>和<b>南半球</b>。<b>台灣</b>的位置就可以這樣描述——<b>在亞洲東緣、北半球、面向太平洋</b>。學會這三個線索，聽到新聞說某地，你就能<b>很快找到它</b>。'
        },
        {
          type: 'teach', kicker: '位置→影響', title: '知道位置，就能想到影響',
          svg: proximityImpact(),
          text: '定位不只是「知道在哪」，更能幫你判斷<b>這件事和我們有沒有關係</b>。假想<b>鄰近地區</b>發生一件事，影響可能像<b>漣漪</b>一樣傳過來，牽動台灣的<b>貿易</b>、來往的<b>班機</b>、甚至<b>天氣</b>。通常<b>離得越近，關聯越明顯</b>。所以在地圖上定位之後，可以多想一步：<b>這會不會影響到我們的生活？</b>'
        },
        {
          type: 'quiz', kicker: '換你試試', title: '新聞報導「東亞某國發生強震」，先在地圖上找到它的好處是？',
          options: ['知道它離台灣多近、可能有什麼影響', '沒有任何用處', '可以不用讀內文', '地震就不會發生'],
          answer: 0,
          why: '定位能幫你判斷事件與台灣的距離和關聯（貿易、交通、安全、天氣等）。',
          whyWrong: { 1: '定位很有用，能幫你判斷遠近和關聯，不是「沒有用處」。', 2: '定位和讀內文都重要，知道在哪不代表就能不讀內文。', 3: '在地圖上找位置是為了理解事件，並不會改變地震會不會發生。' }
        },
        {
          type: 'quiz', kicker: '想一想', title: '台灣位於哪一洲、面向哪一個大洋？',
          options: ['亞洲東緣、面向太平洋', '非洲、面向大西洋', '歐洲、面向印度洋', '南美洲、面向北冰洋'],
          answer: 0,
          why: '台灣在亞洲東側、太平洋西側，和東亞鄰近地區關係密切。',
          whyWrong: { 1: '台灣不在非洲，面向的也不是大西洋。', 2: '台灣不在歐洲，面向的也不是印度洋。', 3: '台灣不在南美洲，面向的也不是北冰洋。' }
        }
      ]
    },
    {
      id: 'news_respect', name: '尊重多元、破除刻板印象', emoji: '🤝', color: SU,
      sub: '沒有誰比較高級；別用一句話套住一群人；先好奇再判斷',
      done: '記住：世界上有很多國家、語言、宗教與文化，沒有哪一種「比較高級」。刻板印象＝用一句話套住一整群人（「某國人都…」），常常不準又傷人。遇到不同，先好奇、理解脈絡，再用事實與尊重去判斷，不用偏見。對世界保持好奇與尊重，才是真的跟世界接軌。',
      steps: [
        {
          type: 'teach', kicker: '世界很多元', title: '沒有哪一種文化比較高級',
          svg: diverseGlobe(),
          text: '世界上有<b>很多國家、語言、宗教與文化</b>。看圖：地球周圍一圈<b>大小一樣</b>的問候語泡泡——「你好、Hello、こんにちは、안녕、Hola、Bonjour、Olá」。它們<b>一樣大、擺在一起</b>，代表<b>彼此平等</b>：<b>沒有哪一種語言或文化「比較高級」</b>。多元，就是世界本來的樣子。'
        },
        {
          type: 'teach', kicker: '一句話的陷阱', title: '刻板印象：套住一整群人',
          svg: stereotypeLens(),
          text: '<b>刻板印象</b>＝用<b>一句話套住一整群人</b>（「某群人都○○」），把大家都想成<b>一模一樣</b>。但用<b>放大鏡</b>仔細看就會發現：<b>其實每個人都不一樣</b>，有不同的樣子、喜好和故事。把一整群人<b>簡化成一句話</b>，常常<b>不準</b>又<b>傷人</b>。練習：先看見「<b>每一個人</b>」，而不是只看見「<b>標籤</b>」。'
        },
        {
          type: 'teach', kicker: '遇到不同', title: '先好奇、理解脈絡，再判斷',
          svg: respectPath(),
          text: '遇到和自己<b>不一樣</b>的人事物，有兩條路。<b>好的路徑</b>：先<b>保持好奇、問問看</b> → <b>理解背後的脈絡</b> → 用<b>事實與尊重</b>來判斷，結果是<b>彼此理解、更靠近</b>。<b>偏見捷徑</b>：直接用<b>成見</b>套上去、馬上下定論，結果常常<b>誤會又傷人</b>。選<b>好奇與理解</b>那條路——對人用<b>事實與尊重</b>，不用偏見，才是真的<b>跟世界接軌</b>。'
        },
        {
          type: 'quiz', kicker: '換你試試', title: '「某國的人都很懶惰」這種說法有什麼問題？',
          options: ['這是刻板印象，用一句話套住一整群人，常不準又傷人', '完全正確', '是科學事實', '可以拿來判斷每個人'],
          answer: 0,
          why: '把一整群人簡化成一句話是刻板印象，忽略了每個人的差異，容易造成偏見與傷害。',
          whyWrong: { 1: '把一整群人說成都一樣並不正確，忽略了每個人的差異。', 2: '這種以偏概全的說法沒有證據，不是科學事實。', 3: '每個人都不一樣，不能用一句刻板印象去判斷每一個人。' }
        },
        {
          type: 'quiz', kicker: '想一想', title: '跟世界接軌、面對不同文化，比較合適的態度是？',
          options: ['保持好奇、理解脈絡，彼此尊重', '覺得自己的文化最好、別人都是錯的', '嘲笑和自己不一樣的人', '完全不想了解'],
          answer: 0,
          why: '多元世界強調互相尊重與理解差異，先好奇、理解脈絡，才能真正和世界接軌。',
          whyWrong: { 1: '覺得只有自己的文化對、別人都錯，是偏見，無法真正理解世界。', 2: '嘲笑和自己不一樣的人會傷害別人，也看不見對方真實的樣子。', 3: '完全不想了解，就會一直停在誤會裡，無法跟世界接軌。' }
        }
      ]
    },
    // ===== lesson 群組 2：全球議題縱深（glob_）— 難民／貧富差距／NGO =====================
    {
      id: 'glob_refugee', name: '難民與移動', emoji: '🧳', color: SU,
      sub: '難民是被迫離家、尋求安全的人；理解而非指責',
      done: '記住：難民是因為戰爭、迫害或災難，被迫離開家園、尋求安全的人，和「自由選擇」移動的一般移民不同。他們常要面對安置、語言、工作與身心照顧的挑戰；國際上也有組織與公約一起保護難民。面對難民議題，用理解與尊重人權的態度，勝過指責。難民是被迫離家的人，理解勝過指責。',
      steps: [
        {
          type: 'teach', kicker: '什麼是難民', title: '難民：被迫離開家園的人',
          svg: animCanvas(300, 196, '世界地圖定位動畫：一張只畫七大洲色塊與海洋、完全不含國界的風格化世界地圖。動畫會依序掉下定位針並脈動光環，示意難民因戰爭、迫害或災難，被迫從原本的家園跨越邊界、移動到鄰近的安全地（皆為假想地點），幫你理解難民是被迫移動、尋求安全的人。'),
          mount: function (host: HTMLElement) {
            var h = window.Anim!.worldLocator(host, {
              cycle: true,
              caption: '難民被迫離開家園，跨越邊界到鄰近安全地（假想情境）',
              pins: [
                { xFrac: 0.30, yFrac: 0.40, label: '原本的家園' },
                { xFrac: 0.60, yFrac: 0.40, label: '鄰近安全地' }
              ]
            });
            return function () { h.stop(); };
          },
          text: '<b>難民</b>和一般<b>移民</b>不一樣。一般移民是為了讀書、工作等原因<b>自由選擇</b>搬到別的地方；<b>難民</b>則是因為<b>戰爭、迫害或災難</b>，<b>被迫</b>離開自己的家園，到別的地方<b>尋求安全</b>。看動畫：他們常常要<b>跨越邊界</b>，從原本的家園移動到<b>鄰近的安全地</b>（這裡用<b>假想</b>的地點示意）。記得：他們不是去旅遊或留學，而是為了<b>活下去、求安全</b>。'
        },
        {
          type: 'teach', kicker: '不容易的開始', title: '到了新地方，面臨許多挑戰',
          svg: refugeeChallenges(),
          text: '被迫離開家園、來到陌生的地方，重新生活並<b>不容易</b>。難民常會遇到四種挑戰：要找到安全的<b>住處（安置）</b>、<b>語言</b>要重新適應、重新<b>找工作</b>與收入、還有經歷過辛苦後的<b>身心照顧</b>。這些都需要<b>時間</b>，也需要周圍的人與社會給予<b>理解與支持</b>。'
        },
        {
          type: 'teach', kicker: '不是孤單的', title: '國際上有人一起保護難民',
          svg: refugeeProtection(),
          text: '難民並<b>不是孤單</b>面對這一切。國際上有許多<b>組織</b>，也有大家共同約定的<b>公約</b>，像一把<b>保護傘</b>，一起幫忙<b>安置與照顧</b>難民、<b>保障</b>他們的<b>安全與人權</b>。面對難民議題，比較合適的態度是<b>理解</b>他們的處境、<b>尊重</b>人權，而不是<b>指責</b>他們為什麼要離開——因為他們和我們一樣，都只是想要<b>安全的生活</b>。'
        },
        {
          type: 'quiz', kicker: '換你試試', title: '「難民」和一般「移民」最主要的差別是？',
          options: ['難民是被迫離開家園尋求安全，不是自由選擇', '完全一樣', '難民是去旅遊', '難民是去留學'],
          answer: 0,
          why: '難民因戰爭、迫害或災難被迫離開，處境特殊，需要保護與協助；一般移民多是自由選擇移動。',
          whyWrong: { 1: '難民和一般移民並不「完全一樣」——難民是被迫離開，移民多是自由選擇。', 2: '難民不是去旅遊，而是為了逃離危險、尋求安全。', 3: '難民不是去留學，而是因戰爭、迫害或災難被迫離開家園。' }
        },
        {
          type: 'quiz', kicker: '想一想', title: '面對難民議題，比較合適的態度是？',
          options: ['理解他們的處境、尊重其人權', '指責他們為什麼要離開', '覺得與自己無關', '嘲笑他們'],
          answer: 0,
          why: '以理解他們的處境、尊重人權的態度看待難民，是面對難民議題合適的方式。',
          whyWrong: { 1: '指責他們為什麼要離開，忽略了他們是「被迫」離開、處境艱難。', 2: '難民議題關係到許多人的安全與人權，不該覺得與自己完全無關。', 3: '嘲笑別人的苦難並不恰當，也看不見他們真實的處境。' }
        }
      ]
    },
    {
      id: 'glob_inequality', name: '貧富差距', emoji: '📊', color: SU,
      sub: '財富與機會分配不均；成因複雜，教育與機會是關鍵',
      done: '記住：世界與各國內部都存在貧富差距，也就是財富與機會分配不平均。它的成因很複雜——教育、工作機會、健康、地區發展、歷史因素等交織在一起，不能簡化成單一原因，也不該歸咎個人。改善的方向包括擴大教育與機會、建立社會安全網與公平制度；沒有單一答案，但人人都可以關心。差距成因複雜，機會與教育是關鍵。',
      steps: [
        {
          type: 'teach', kicker: '不平均的分配', title: '財富與機會，分配並不平均',
          svg: wealthLadder(),
          text: '不管是整個<b>世界</b>，還是一個<b>國家裡面</b>，<b>財富</b>和<b>機會</b>的分配都<b>不平均</b>——這就是<b>貧富差距</b>。看圖的比喻：往上爬需要一些<b>「墊腳石」</b>，像<b>教育、健康、工作機會、地區發展</b>。有的人<b>墊腳石比較多</b>，比較容易往上；有的人<b>比較少</b>，就比較難。兩個人高度的<b>落差</b>，就是差距的樣子。'
        },
        {
          type: 'teach', kicker: '為什麼會這樣', title: '成因複雜：多種因素交織',
          svg: inequalityCauses(),
          text: '貧富差距<b>為什麼</b>會發生？原因<b>很複雜</b>，是許多因素<b>交織</b>在一起造成的：<b>教育機會、工作機會、健康、地區發展、歷史因素</b>……彼此影響。所以它是一個<b>結構性</b>的問題，<b>不能</b>簡化成「某個人懶惰」這種<b>單一原因</b>，也<b>不該歸咎個人</b>。看清成因複雜，才能理性討論。'
        },
        {
          type: 'teach', kicker: '可以怎麼改善', title: '努力的方向：機會與公平',
          svg: inequalitySolutions(),
          text: '雖然沒有<b>單一答案</b>，但有一些常見的<b>努力方向</b>：<b>擴大教育與學習的機會</b>、建立照顧需要幫助的人的<b>社會安全網</b>、以及讓機會更公平的<b>公平制度</b>。這些方向都指向同一件事——<b>讓更多人有機會</b>，差距就能<b>慢慢縮小</b>。這件事<b>人人都可以關心</b>，從理解與討論開始。'
        },
        {
          type: 'quiz', kicker: '換你試試', title: '關於貧富差距的成因，下列何者較正確？',
          options: ['成因複雜，教育、工作、健康、地區發展等交織', '純粹因為窮人懶惰', '只跟運氣有關', '跟教育完全無關'],
          answer: 0,
          why: '貧富差距是教育、工作、健康、地區發展等多重因素交織的結構性議題，不能簡化成單一原因或歸咎個人。',
          whyWrong: { 1: '把貧窮簡化成「窮人懶惰」，忽略了教育、機會、地區等結構性因素，並不正確。', 2: '差距不是「只跟運氣有關」，而是多種社會因素長期交織的結果。', 3: '教育機會其實和貧富差距關係密切，說「跟教育完全無關」並不對。' }
        },
        {
          type: 'quiz', kicker: '想一想', title: '下列哪一項較可能幫助縮小貧富差距？',
          options: ['讓更多人獲得教育與公平的機會', '讓機會更集中在少數人', '取消所有學校', '什麼都不做'],
          answer: 0,
          why: '擴大教育與機會、建立社會安全網與公平制度，是改善貧富差距的常見方向。',
          whyWrong: { 1: '讓機會更集中在少數人，只會讓差距更大，不是縮小。', 2: '取消所有學校會讓更多人失去教育機會，反而擴大差距。', 3: '什麼都不做，差距不會自己縮小，問題可能持續。' }
        }
      ]
    },
    {
      id: 'glob_ngo', name: 'NGO 與國際合作', emoji: '🤝', color: SU,
      sub: '民間自發為公益；國際合作；學生也能參與',
      done: '記住：NGO（非政府組織）由民間自發成立、不以營利為主，投入人道、環境、教育、醫療等公益；各國與組織還會透過國際合作，一起面對難民、災難、疾病、氣候等跨國問題。身為學生，可以從了解議題、理性討論、參與校內公益或志工開始。了解、討論、參與——世界因此多一點好。',
      steps: [
        {
          type: 'teach', kicker: '什麼是 NGO', title: 'NGO：民間自發、為公益',
          svg: ngoDomains(),
          text: '<b>NGO</b> 是<b>非政府組織</b>（Non-Governmental Organization）的縮寫。它<b>不是</b>政府的部門，也<b>不是</b>以賺錢為主的公司，而是由<b>民間自發</b>成立、<b>不以營利為主</b>、為了<b>公益</b>而行動的組織。NGO 投入很多<b>不同領域</b>：<b>人道救援、環境保護、醫療、教育</b>……都是為了讓世界<b>更好</b>一點。'
        },
        {
          type: 'teach', kicker: '一起面對', title: '國際合作：跨國一起處理',
          svg: globalCooperation(),
          text: '有些問題<b>一個國家</b>很難獨自解決——像<b>難民、災難、疾病、氣候</b>。這時就需要<b>國際合作</b>：<b>各國政府</b>、<b>聯合國體系</b>、<b>國際的 NGO</b> 和<b>在地組織</b>，<b>跨越國界</b>一起合作、分工幫忙。看圖：大家都連到中間的<b>地球</b>，代表<b>一起</b>面對共同的問題。世界是<b>連在一起</b>的，合作才走得遠。'
        },
        {
          type: 'teach', kicker: '我也能參與', title: '小公民可以這樣開始',
          svg: studentAction(),
          text: '關心全球議題，<b>不用等長大</b>，<b>學生</b>現在就能開始。三個簡單的步驟：先<b>了解議題</b>（去讀<b>可信的資訊</b>）→ <b>理性討論</b>（聽聽<b>不同的意見</b>）→ <b>適度參與</b>（像參加<b>校內公益</b>活動或當<b>志工</b>）。從<b>力所能及</b>的小事開始，世界就會因此<b>多一點好</b>。'
        },
        {
          type: 'quiz', kicker: '換你試試', title: 'NGO（非政府組織）主要是？',
          options: ['民間自發、為公益行動的組織', '政府的一個部門', '營利為主的公司', '一種遊戲'],
          answer: 0,
          why: 'NGO 由民間自發成立，投入人道、環境、教育、醫療等公益，不以營利為主要目的，也不是政府部門。',
          whyWrong: { 1: 'NGO 是「非政府」組織，不是政府的部門。', 2: 'NGO 不以營利為主要目的，和以賺錢為主的公司不同。', 3: 'NGO 是真實投入公益的組織，不是一種遊戲。' }
        },
        {
          type: 'quiz', kicker: '想一想', title: '身為學生，想參與全球議題可以怎麼開始？',
          options: ['了解議題、理性討論、參與校內公益或志工', '等長大再說', '覺得與自己無關', '只在網路上罵人'],
          answer: 0,
          why: '從了解議題、理性討論開始，再參與力所能及的校內公益或志工，是學生關心全球議題的合適起點。',
          whyWrong: { 1: '「等長大再說」會錯過現在就能做的事，了解與參與不用等長大。', 2: '全球議題和每個人都有關，不該覺得與自己無關。', 3: '只在網路上罵人無助於解決問題，理性討論才有幫助。' }
        }
      ]
    }
  ]
};

})();
