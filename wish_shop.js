/* =====================================================================
 * wish_shop.ts  →  (tsc, tsconfig.legacy.json) →  wish_shop.js
 * 心願小舖（Track B）。把 Game.spendCoins 接上 hub 內的 bottom-sheet。
 *   商品：純外觀、換得回來 ——(1) 主題色皮膚(只換 --accent/--c-primary 色 token)
 *   (2) 頭像小貼紙(在 #avatar-btn 右下角疊 emoji)。固定明碼、無隨機/轉蛋(BLUEPRINT §3.3/§3.6)。
 * 遷移說明：型別剝離，邊界(G/$/事件)用寬型別；行為與原 wish_shop.js 等價。
 * ===================================================================== */
(function (window, document) {
    'use strict';
    var G = window.Game;
    // ---- 商品目錄（固定、明碼） --------------------------------------------
    var SKINS = [
        { id: 'skin-blue', name: '晴空藍', price: 0, subj: null, dot: 'var(--c-xp)' },
        { id: 'skin-purple', name: '魔法紫', price: 30, subj: 'math', dot: 'var(--c-math)' },
        { id: 'skin-green', name: '森林綠', price: 30, subj: 'english', dot: 'var(--c-english)' },
        { id: 'skin-gold', name: '陽光金', price: 30, subj: 'chinese', dot: 'var(--c-chinese)' },
        { id: 'skin-coral', name: '珊瑚橘', price: 30, subj: 'social', dot: 'var(--c-social)' },
        { id: 'skin-teal', name: '海洋青', price: 30, subj: 'finance', dot: 'var(--c-finance)' }
    ];
    var BORDERS = [
        { id: 'border-none', name: '不加貼紙', price: 0, emoji: '' },
        { id: 'border-star', name: '小星星', price: 20, emoji: '⭐' },
        { id: 'border-crown', name: '小皇冠', price: 20, emoji: '👑' },
        { id: 'border-heart', name: '愛心', price: 20, emoji: '💖' },
        { id: 'border-rocket', name: '小火箭', price: 20, emoji: '🚀' },
        { id: 'border-rainbow', name: '彩虹', price: 20, emoji: '🌈' }
    ];
    var DEFAULT_SKIN = 'skin-blue';
    var DEFAULT_BORDER = 'border-none';
    function byId(list, id) {
        for (var i = 0; i < list.length; i++)
            if (list[i].id === id)
                return list[i];
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
        if (!skin || !skin.subj) {
            for (var i = 0; i < SKIN_PROPS.length; i++)
                root.style.removeProperty(SKIN_PROPS[i]);
            return;
        }
        var s = skin.subj;
        root.style.setProperty('--c-primary', 'var(--c-' + s + ')');
        root.style.setProperty('--c-primary-soft', 'var(--c-' + s + '-soft, var(--c-' + s + '))');
        root.style.setProperty('--c-primary-ink', 'var(--c-' + s + '-ink)');
        root.style.setProperty('--c-primary-btn', 'var(--c-' + s + '-ink)');
        root.style.setProperty('--c-primary-btn2', 'var(--c-' + s + '-ink)');
        root.style.setProperty('--tint-primary', 'var(--tint-' + s + ')');
        root.style.setProperty('--accent', 'var(--c-' + s + ')');
        root.style.setProperty('--accent-ink', 'var(--c-' + s + '-ink)');
        root.style.setProperty('--accent-tint', 'var(--tint-' + s + ')');
    }
    // ---- 頭像貼紙套用：疊在 #avatar-btn 右下角 ------------------------------
    var avatarBtn = null;
    var badgeEl = null;
    var currentBorderEmoji = '';
    function ensureBadge() {
        if (!currentBorderEmoji || !avatarBtn)
            return;
        if (!badgeEl) {
            badgeEl = document.createElement('span');
            badgeEl.className = 'shop-ava-badge';
            badgeEl.setAttribute('aria-hidden', 'true');
        }
        if (badgeEl.textContent !== currentBorderEmoji)
            badgeEl.textContent = currentBorderEmoji;
        if (badgeEl.parentNode !== avatarBtn)
            avatarBtn.appendChild(badgeEl);
    }
    function applyBorder(id) {
        var b = byId(BORDERS, id);
        currentBorderEmoji = (b && b.emoji) ? b.emoji : '';
        if (!avatarBtn)
            return;
        if (!currentBorderEmoji) {
            if (badgeEl && badgeEl.parentNode)
                badgeEl.parentNode.removeChild(badgeEl);
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
        if (!container)
            return;
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
            }
            else {
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
            if (equipped) {
                tag.textContent = '使用中 ✓';
                label = item.name + '，使用中';
            }
            else if (owned) {
                tag.textContent = '點一下換上';
                label = '換上 ' + item.name;
            }
            else {
                tag.textContent = '🪙 ' + item.price;
                label = '買下 ' + item.name + '，' + item.price + ' 枚金幣';
            }
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
        if (coinsNum)
            coinsNum.textContent = state.coins;
        renderList($('shop-skins'), SKINS, 'skin', state);
        renderList($('shop-borders'), BORDERS, 'border', state);
    }
    // ---- 購買 / 換上 -------------------------------------------------------
    function handleItemClick(kind, id) {
        var list = (kind === 'skin') ? SKINS : BORDERS;
        var item = byId(list, id);
        if (!item || !G)
            return;
        var state = profileState();
        if (isOwned(item, state.owned)) {
            equip(kind, id);
            G.showToast && G.showToast('換好囉！' + item.name + ' 👍');
            renderShop();
            return;
        }
        var ok = G.spendCoins ? G.spendCoins(item.price, item.id) : false;
        if (!ok) {
            G.showToast && G.showToast('金幣還差一點，再去玩幾關就能換囉！🪙');
            renderShop();
            return;
        }
        equip(kind, id);
        G.showToast && G.showToast('買好也換上囉！' + item.name + ' 🎉');
        renderShop();
    }
    function equip(kind, id) {
        if (!G || !G.setProfileField)
            return;
        if (kind === 'skin') {
            G.setProfileField('equippedSkin', id);
            applySkin(id);
        }
        else {
            G.setProfileField('equippedBorder', id);
            applyBorder(id);
        }
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
        if (f.length) {
            f[0].focus();
        }
        else if (container && container.focus) {
            container.focus();
        }
    }
    function trapTab(container, e) {
        if (e.key !== 'Tab' || !container || container.hidden)
            return;
        var f = getFocusable(container);
        if (!f.length) {
            e.preventDefault();
            return;
        }
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey) {
            if (document.activeElement === first || !container.contains(document.activeElement)) {
                e.preventDefault();
                last.focus();
            }
        }
        else {
            if (document.activeElement === last || !container.contains(document.activeElement)) {
                e.preventDefault();
                first.focus();
            }
        }
    }
    function setBgInert(on) {
        ['.app-bar', '.hub', '.bottom-nav'].forEach(function (sel) {
            var el = document.querySelector(sel);
            if (!el)
                return;
            if (on) {
                el.setAttribute('inert', '');
                el.setAttribute('aria-hidden', 'true');
            }
            else {
                el.removeAttribute('inert');
                el.removeAttribute('aria-hidden');
            }
        });
    }
    var overlay = null;
    var shopBtn = null;
    var shopLastFocus = null;
    function openShop() {
        if (!overlay)
            return;
        shopLastFocus = document.activeElement;
        renderShop();
        overlay.hidden = false;
        setBgInert(true);
        if (shopBtn)
            shopBtn.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(function () {
            overlay.classList.add('open');
            focusFirstIn(overlay);
        });
    }
    function closeShop() {
        if (!overlay)
            return;
        overlay.classList.remove('open');
        setBgInert(false);
        if (shopBtn)
            shopBtn.setAttribute('aria-expanded', 'false');
        setTimeout(function () { overlay.hidden = true; }, 300);
        if (shopLastFocus && shopLastFocus.focus) {
            try {
                shopLastFocus.focus();
            }
            catch (err) { }
        }
        shopLastFocus = null;
    }
    // ---- 初始化 ------------------------------------------------------------
    function init() {
        avatarBtn = $('avatar-btn');
        overlay = $('shop-overlay');
        shopBtn = $('shop-btn');
        var closeBtn = $('shop-close');
        var state = profileState();
        applySkin(state.skin);
        applyBorder(state.border);
        if (window.MutationObserver && avatarBtn) {
            new MutationObserver(function () { if (currentBorderEmoji)
                ensureBadge(); })
                .observe(avatarBtn, { childList: true });
        }
        if (shopBtn)
            shopBtn.addEventListener('click', openShop);
        if (closeBtn)
            closeBtn.addEventListener('click', closeShop);
        if (overlay)
            overlay.addEventListener('click', function (e) { if (e.target === overlay)
                closeShop(); });
        [$('shop-skins'), $('shop-borders')].forEach(function (grid) {
            if (!grid)
                return;
            grid.addEventListener('click', function (e) {
                var el = e.target.closest ? e.target.closest('.shop-item') : null;
                if (!el || !grid.contains(el))
                    return;
                handleItemClick(el.getAttribute('data-kind'), el.getAttribute('data-id'));
            });
        });
        document.addEventListener('keydown', function (e) {
            if (!overlay || overlay.hidden)
                return;
            if (e.key === 'Escape') {
                closeShop();
                return;
            }
            if (e.key === 'Tab') {
                trapTab(overlay, e);
            }
        });
        if (G && G.on) {
            G.on('xp', function () { if (overlay && !overlay.hidden)
                renderShop(); });
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    }
    else {
        init();
    }
})(window, document);
