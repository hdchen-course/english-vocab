/* =====================================================================
 * wish_shop.js — 心願小舖（Track B）
 * ---------------------------------------------------------------------
 * 把既有的 Game.spendCoins(amount, itemId) 接上一個 hub 內的 bottom-sheet。
 * 商品只有兩類「純外觀、換得回來」的造型：
 *   1) 主題色皮膚：只換 --accent / --c-primary 這組顏色 token（版面完全不動），
 *      對應各科既有調色盤（math/english/chinese/social/finance），自動隨日夜主題切換。
 *   2) 頭像小貼紙：在 #avatar-btn 右下角疊一個 emoji。
 *
 * 設計約束（刻意遵守）：
 *   - 不新造 sheet 骨架：沿用 index.html 既有 .sheet / .sheet-overlay / .sheet-handle
 *     與其 a11y 動線（這裡以等價的小函式複刻 focus trap / Esc / 背景 inert / 還原焦點，
 *     因為原動線的 helper 是 index.html IIFE 的私有函式，外部檔案取用不到）。
 *   - 固定明碼、無隨機 / 轉蛋 / 寶箱 / 限時（BLUEPRINT §3.3 / §3.6）。
 *   - localStorage 隨時可能消失，所以價格便宜、換得回來、絕不用「失去」框架。
 *   - 預設造型（price 0）永遠可用，金幣為 0 也能正常使用與瀏覽。
 * ===================================================================== */
(function (window, document) {
  'use strict';

  var G = window.Game;

  // ---- 商品目錄（固定、明碼） --------------------------------------------
  // 皮膚：subj 對應 assets/app.css 既有的 --c-<subj> / --c-<subj>-ink / --tint-<subj>
  //       （皆已定義亮/暗兩套，故用 var() 參照即可自動隨主題切換）。
  var SKINS = [
    // 預設藍的色樣用 --c-xp（亮/暗皆為品牌藍、且不被皮膚覆寫），避免換上他色皮膚後藍色樣跟著變色。
    { id: 'skin-blue',   name: '晴空藍', price: 0,  subj: null,      dot: 'var(--c-xp)' },
    { id: 'skin-purple', name: '魔法紫', price: 30, subj: 'math',    dot: 'var(--c-math)' },
    { id: 'skin-green',  name: '森林綠', price: 30, subj: 'english', dot: 'var(--c-english)' },
    { id: 'skin-gold',   name: '陽光金', price: 30, subj: 'chinese', dot: 'var(--c-chinese)' },
    { id: 'skin-coral',  name: '珊瑚橘', price: 30, subj: 'social',  dot: 'var(--c-social)' },
    { id: 'skin-teal',   name: '海洋青', price: 30, subj: 'finance', dot: 'var(--c-finance)' }
  ];
  var BORDERS = [
    { id: 'border-none',    name: '不加貼紙', price: 0,  emoji: '' },
    { id: 'border-star',    name: '小星星',   price: 20, emoji: '⭐' },
    { id: 'border-crown',   name: '小皇冠',   price: 20, emoji: '👑' },
    { id: 'border-heart',   name: '愛心',     price: 20, emoji: '💖' },
    { id: 'border-rocket',  name: '小火箭',   price: 20, emoji: '🚀' },
    { id: 'border-rainbow', name: '彩虹',     price: 20, emoji: '🌈' }
  ];
  var DEFAULT_SKIN = 'skin-blue';
  var DEFAULT_BORDER = 'border-none';

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function $(id) { return document.getElementById(id); }

  // ---- 皮膚套用：覆寫 :root 上的顏色 token（只換色、不換版面） --------------
  var SKIN_PROPS = ['--c-primary', '--c-primary-soft', '--c-primary-ink',
    '--c-primary-btn', '--c-primary-btn2', '--tint-primary',
    '--accent', '--accent-ink', '--accent-tint'];

  function applySkin(id) {
    var root = document.documentElement;
    var skin = byId(SKINS, id) || byId(SKINS, DEFAULT_SKIN);
    // 預設藍：清掉所有覆寫，退回 assets/app.css 的品牌藍。
    if (!skin || !skin.subj) {
      for (var i = 0; i < SKIN_PROPS.length; i++) root.style.removeProperty(SKIN_PROPS[i]);
      return;
    }
    var s = skin.subj;
    root.style.setProperty('--c-primary', 'var(--c-' + s + ')');
    root.style.setProperty('--c-primary-soft', 'var(--c-' + s + '-soft, var(--c-' + s + '))');
    root.style.setProperty('--c-primary-ink', 'var(--c-' + s + '-ink)');
    // 實心鈕填色走 -ink（較深）配既有 --on-accent，維持白字/深墨字對比（與各科實心鈕同模式）。
    root.style.setProperty('--c-primary-btn', 'var(--c-' + s + '-ink)');
    root.style.setProperty('--c-primary-btn2', 'var(--c-' + s + '-ink)');
    root.style.setProperty('--tint-primary', 'var(--tint-' + s + ')');
    root.style.setProperty('--accent', 'var(--c-' + s + ')');
    root.style.setProperty('--accent-ink', 'var(--c-' + s + '-ink)');
    root.style.setProperty('--accent-tint', 'var(--tint-' + s + ')');
  }

  // ---- 頭像貼紙套用：疊在 #avatar-btn 右下角 ------------------------------
  // render() 會以 textContent 重設頭像（抹掉子節點），故用 MutationObserver 補回貼紙。
  var avatarBtn = null;
  var badgeEl = null;
  var currentBorderEmoji = '';

  function ensureBadge() {
    if (!currentBorderEmoji || !avatarBtn) return;
    if (!badgeEl) {
      badgeEl = document.createElement('span');
      badgeEl.className = 'shop-ava-badge';
      badgeEl.setAttribute('aria-hidden', 'true');
    }
    if (badgeEl.textContent !== currentBorderEmoji) badgeEl.textContent = currentBorderEmoji;
    if (badgeEl.parentNode !== avatarBtn) avatarBtn.appendChild(badgeEl);
  }
  function applyBorder(id) {
    var b = byId(BORDERS, id);
    currentBorderEmoji = (b && b.emoji) ? b.emoji : '';
    if (!avatarBtn) return;
    if (!currentBorderEmoji) {
      if (badgeEl && badgeEl.parentNode) badgeEl.parentNode.removeChild(badgeEl);
      return;
    }
    ensureBadge();
  }

  // ---- profile 讀取輔助 --------------------------------------------------
  function profileState() {
    var p = (G && G.getProfile) ? (G.getProfile() || {}) : {};
    return {
      coins: p.coins || 0,
      owned: Array.isArray(p.ownedItems) ? p.ownedItems : [],
      skin: p.equippedSkin || DEFAULT_SKIN,
      border: p.equippedBorder || DEFAULT_BORDER
    };
  }
  function isOwned(item, owned) {
    return item.price === 0 || owned.indexOf(item.id) !== -1;
  }

  // ---- 商品清單渲染 ------------------------------------------------------
  function renderList(container, list, kind, state) {
    if (!container) return;
    container.innerHTML = '';
    var equippedId = (kind === 'skin') ? state.skin : state.border;
    list.forEach(function (item) {
      var owned = isOwned(item, state.owned);
      var equipped = (item.id === equippedId);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'shop-item' + (equipped ? ' is-equipped' : (owned ? ' is-owned' : ''));
      btn.setAttribute('data-kind', kind);
      btn.setAttribute('data-id', item.id);
      btn.setAttribute('aria-pressed', equipped ? 'true' : 'false');

      var swatch = document.createElement('span');
      swatch.className = 'shop-item__swatch';
      if (kind === 'skin') {
        swatch.className += ' is-dot';
        swatch.style.background = item.dot;
      } else {
        swatch.textContent = item.emoji || '🚫';
      }

      var body = document.createElement('span');
      body.className = 'shop-item__body';
      var name = document.createElement('span');
      name.className = 'shop-item__name';
      name.textContent = item.name;
      var tag = document.createElement('span');
      tag.className = 'shop-item__tag';

      var label;
      if (equipped) { tag.textContent = '使用中 ✓'; label = item.name + '，使用中'; }
      else if (owned) { tag.textContent = '點一下換上'; label = '換上 ' + item.name; }
      else { tag.textContent = '🪙 ' + item.price; label = '買下 ' + item.name + '，' + item.price + ' 枚金幣'; }
      btn.setAttribute('aria-label', label);

      body.appendChild(name);
      body.appendChild(tag);
      btn.appendChild(swatch);
      btn.appendChild(body);
      container.appendChild(btn);
    });
  }

  function renderShop() {
    var state = profileState();
    var coinsNum = $('shop-coins-num');
    if (coinsNum) coinsNum.textContent = state.coins;
    renderList($('shop-skins'), SKINS, 'skin', state);
    renderList($('shop-borders'), BORDERS, 'border', state);
  }

  // ---- 購買 / 換上 -------------------------------------------------------
  function handleItemClick(kind, id) {
    var list = (kind === 'skin') ? SKINS : BORDERS;
    var item = byId(list, id);
    if (!item || !G) return;
    var state = profileState();

    // 已擁有（或免費）→ 直接換上。
    if (isOwned(item, state.owned)) {
      equip(kind, id);
      G.showToast && G.showToast('換好囉！' + item.name + ' 👍');
      renderShop();
      return;
    }
    // 尚未擁有 → 嘗試用金幣買下。
    var ok = G.spendCoins ? G.spendCoins(item.price, item.id) : false;
    if (!ok) {
      G.showToast && G.showToast('金幣還差一點，再去玩幾關就能換囉！🪙');
      renderShop();   // 刷新餘額顯示（亦即金幣不足時的優雅降級）
      return;
    }
    // 買下後立即換上，給孩子即時回饋。
    equip(kind, id);
    G.showToast && G.showToast('買好也換上囉！' + item.name + ' 🎉');
    renderShop();
  }

  function equip(kind, id) {
    if (!G || !G.setProfileField) return;
    if (kind === 'skin') { G.setProfileField('equippedSkin', id); applySkin(id); }
    else { G.setProfileField('equippedBorder', id); applyBorder(id); }
  }

  // ---- bottom-sheet a11y（複刻 index.html 既有動線） ----------------------
  var FOCUSABLE_SEL = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function getFocusable(container) {
    return Array.prototype.slice.call(container.querySelectorAll(FOCUSABLE_SEL))
      .filter(function (el) {
        return el === document.activeElement ||
          (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0);
      });
  }
  function focusFirstIn(container) {
    var f = getFocusable(container);
    if (f.length) { f[0].focus(); }
    else if (container && container.focus) { container.focus(); }
  }
  function trapTab(container, e) {
    if (e.key !== 'Tab' || !container || container.hidden) return;
    var f = getFocusable(container);
    if (!f.length) { e.preventDefault(); return; }
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first || !container.contains(document.activeElement)) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last || !container.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    }
  }
  function setBgInert(on) {
    ['.app-bar', '.hub', '.bottom-nav'].forEach(function (sel) {
      var el = document.querySelector(sel); if (!el) return;
      if (on) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); }
      else { el.removeAttribute('inert'); el.removeAttribute('aria-hidden'); }
    });
  }

  var overlay = null;
  var shopBtn = null;
  var shopLastFocus = null;

  function openShop() {
    if (!overlay) return;
    shopLastFocus = document.activeElement;
    renderShop();
    overlay.hidden = false;
    setBgInert(true);
    if (shopBtn) shopBtn.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () {
      overlay.classList.add('open');
      focusFirstIn(overlay);
    });
  }
  function closeShop() {
    if (!overlay) return;
    overlay.classList.remove('open');
    setBgInert(false);
    if (shopBtn) shopBtn.setAttribute('aria-expanded', 'false');
    setTimeout(function () { overlay.hidden = true; }, 300);
    if (shopLastFocus && shopLastFocus.focus) { try { shopLastFocus.focus(); } catch (err) {} }
    shopLastFocus = null;
  }

  // ---- 初始化 ------------------------------------------------------------
  function init() {
    avatarBtn = $('avatar-btn');
    overlay = $('shop-overlay');
    shopBtn = $('shop-btn');
    var closeBtn = $('shop-close');

    // 一載入就套用已存的造型（避免看起來沒生效）。
    var state = profileState();
    applySkin(state.skin);
    applyBorder(state.border);

    // render() 以 textContent 重設頭像會抹掉貼紙 → 監看並補回。
    if (window.MutationObserver && avatarBtn) {
      new MutationObserver(function () { if (currentBorderEmoji) ensureBadge(); })
        .observe(avatarBtn, { childList: true });
    }

    if (shopBtn) shopBtn.addEventListener('click', openShop);
    if (closeBtn) closeBtn.addEventListener('click', closeShop);
    if (overlay) overlay.addEventListener('click', function (e) { if (e.target === overlay) closeShop(); });

    // 事件委派：品項點擊。
    [$('shop-skins'), $('shop-borders')].forEach(function (grid) {
      if (!grid) return;
      grid.addEventListener('click', function (e) {
        var el = e.target.closest ? e.target.closest('.shop-item') : null;
        if (!el || !grid.contains(el)) return;
        handleItemClick(el.getAttribute('data-kind'), el.getAttribute('data-id'));
      });
    });

    // Esc 關閉 + Tab 焦點陷阱（僅在小舖開啟時作用，與其他 sheet 的監聽互不干擾）。
    document.addEventListener('keydown', function (e) {
      if (!overlay || overlay.hidden) return;
      if (e.key === 'Escape') { closeShop(); return; }
      if (e.key === 'Tab') { trapTab(overlay, e); }
    });

    // 金幣/造型可能被其他動作改動（含跨分頁 storage）→ 開啟時即時刷新餘額。
    if (G && G.on) {
      G.on('xp', function () { if (overlay && !overlay.hidden) renderShop(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
