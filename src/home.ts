/* =====================================================================
 * home.ts  →  (tsc, tsconfig.legacy.json) →  home.js
 * 原為 home.html 的 inline <script>；逐檔 TS 遷移抽出成 sibling .js。
 * 行為與原 inline 版等價（verbatim；載入位置不變＝執行時機/順序不變）。
 * 以 IIFE 包住讓頂層名稱為檔案區域（避免 tsc 共用全域型別檢查時與他檔同名衝突）。
 * ===================================================================== */
(function () {
location.replace('index.html');

})();
