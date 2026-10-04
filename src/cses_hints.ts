// @ts-nocheck — 機械式 legacy JS→TS 遷移：verbatim 轉檔、行為等價；型別檢查延後
/* =====================================================================
 * cses_hints.ts  →  (tsc, tsconfig.legacy.json) →  cses_hints.js
 * 原為 cses_hints.html 的 inline <script>；逐檔 TS 遷移抽出成 sibling .js。
 * 行為與原 inline 版等價（verbatim；載入位置不變＝執行時機/順序不變）。
 * 原碼本身即單一頂層 IIFE，已自我隔離（tsc 全域型別檢查無名稱外洩）；verbatim 保留。
 * ===================================================================== */
function showSection(id){document.querySelectorAll(".section").forEach(s=>s.classList.remove("active"));document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));document.getElementById(id).classList.add("active");event.target.classList.add("active");filterProblems()}const search=document.getElementById("search"),diffFilter=document.getElementById("diff-filter"),stats=document.getElementById("stats");function filterProblems(){const q=search.value.toLowerCase(),diff=diffFilter.value,active=document.querySelector(".section.active");if(!active)return;const cards=active.querySelectorAll(".problem-card");let shown=0;cards.forEach(c=>{const text=c.textContent.toLowerCase(),matchText=!q||text.includes(q),matchDiff=!diff||c.dataset.diff===diff,visible=matchText&&matchDiff;c.style.display=visible?"":"none";if(visible)shown++});stats.textContent=shown+"/"+cards.length}search.addEventListener("input",filterProblems);diffFilter.addEventListener("change",filterProblems);filterProblems()
