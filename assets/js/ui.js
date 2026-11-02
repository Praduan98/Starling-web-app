/* ==========================================================================
   Starling UI runtime — shared by every page
   Theme · persisted store · toasts · modal · drawer · menus · tooltips · format
   ========================================================================== */
window.SL = window.SL || {};
(function (SL) {
  'use strict';

  /* ---------- DOM helpers ---------- */
  SL.$ = function (sel, root) { return (root || document).querySelector(sel); };
  SL.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  SL.h = function (html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  SL.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  SL.uid = function (p) { return (p || 'id') + '-' + Math.random().toString(36).slice(2, 9); };

  /* ---------- Store (localStorage, always guarded) ---------- */
  const NS = 'starling:';
  SL.store = {
    get: function (k, fallback) {
      try { const v = localStorage.getItem(NS + k); return v == null ? fallback : JSON.parse(v); }
      catch (e) { return fallback; }
    },
    set: function (k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
    del: function (k) { try { localStorage.removeItem(NS + k); } catch (e) {} }
  };

  /* ---------- Theme ---------- */
  SL.theme = {
    get: function () {
      const saved = SL.store.get('theme', null);
      if (saved) return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },
    apply: function (t) {
      document.documentElement.setAttribute('data-theme', t);
      SL.$$('[data-theme-logo]').forEach(function (img) {
        img.src = img.getAttribute(t === 'dark' ? 'data-logo-dark' : 'data-logo-light');
      });
      SL.$$('[data-theme-toggle]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(t === 'dark'));
        b.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
        const ic = b.querySelector('.theme-ic');
        if (ic) ic.innerHTML = SL.icon(t === 'dark' ? 'sun' : 'moon', 18);
      });
      document.dispatchEvent(new CustomEvent('sl:theme', { detail: t }));
    },
    toggle: function () {
      const next = SL.theme.get() === 'dark' ? 'light' : 'dark';
      SL.store.set('theme', next);
      SL.theme.apply(next);
    }
  };

  /* ---------- Format ---------- */
  SL.fmt = {
    num: function (n) { return new Intl.NumberFormat('en-US').format(Math.round(n)); },
    compact: function (n) { return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n); },
    pct: function (n, d) { return (n).toFixed(d == null ? 1 : d) + '%'; },
    date: function (d, opts) { return new Date(d).toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric' }); },
    time: function (d) { return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }); },
    ago: function (d) {
      const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
      if (s < 60) return 'just now';
      const m = Math.round(s / 60); if (m < 60) return m + 'm';
      const h = Math.round(m / 60); if (h < 24) return h + 'h';
      const dd = Math.round(h / 24); if (dd < 7) return dd + 'd';
      return SL.fmt.date(d);
    }
  };

  /* ---------- Toasts ---------- */
  function toastHost() {
    let host = SL.$('.toasts');
    if (!host) {
      host = SL.h('<div class="toasts" role="status" aria-live="polite" aria-atomic="false"></div>');
      document.body.appendChild(host);
    }
    return host;
  }
  SL.toast = function (title, opts) {
    opts = opts || {};
    const type = opts.type || 'success';
    const ic = { success: 'circle-check', error: 'triangle-alert', info: 'sparkles' }[type] || 'info';
    const el = SL.h(
      '<div class="toast toast-' + type + '">' +
        '<span class="toast-icon">' + SL.icon(ic, 16) + '</span>' +
        '<div class="grow"><div class="toast-title">' + SL.esc(title) + '</div>' +
        (opts.message ? '<div class="toast-msg">' + SL.esc(opts.message) + '</div>' : '') + '</div>' +
        (opts.action ? '<button class="toast-action" type="button">' + SL.esc(opts.action.label) + '</button>' : '') +
        '<button class="icon-btn icon-btn-sm" type="button" aria-label="Dismiss notification">' + SL.icon('x', 16) + '</button>' +
      '</div>'
    );
    const close = function () {
      if (!el.isConnected) return;
      el.classList.add('is-closing');
      setTimeout(function () { el.remove(); }, 200);
    };
    el.querySelector('.icon-btn').addEventListener('click', close);
    if (opts.action) el.querySelector('.toast-action').addEventListener('click', function () { opts.action.onClick(); close(); });
    toastHost().appendChild(el);
    setTimeout(close, opts.duration || 4200);
    return close;
  };

  /* ---------- Focus trap ---------- */
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  function trap(container, e) {
    if (e.key !== 'Tab') return;
    const f = SL.$$(FOCUSABLE, container).filter(function (n) { return n.offsetParent !== null; });
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  }

  /* ---------- Layers (modal / drawer / custom sheet) ---------- */
  const layers = [];
  SL.openLayer = function (opts) {
    const returnFocus = document.activeElement;
    const overlay = SL.h('<div class="overlay"></div>');
    const panel = typeof opts.el === 'string' ? SL.h(opts.el) : opts.el;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    if (opts.label) panel.setAttribute('aria-label', opts.label);
    document.body.appendChild(overlay);
    document.body.appendChild(panel);
    document.body.style.overflow = 'hidden';

    const layer = { panel: panel, overlay: overlay, onClose: opts.onClose, guard: opts.guard };
    const onKey = function (e) {
      if (layers[layers.length - 1] !== layer) return;
      if (e.key === 'Escape') { e.preventDefault(); layer.close(); }
      trap(panel, e);
    };
    layer.close = function (force) {
      if (!force && layer.guard && !layer.guard()) return;
      const i = layers.indexOf(layer); if (i < 0) return;
      layers.splice(i, 1);
      document.removeEventListener('keydown', onKey);
      overlay.classList.add('is-closing');
      panel.classList.add('is-closing');
      setTimeout(function () {
        overlay.remove(); panel.remove();
        if (!layers.length) document.body.style.overflow = '';
      }, 190);
      if (returnFocus && returnFocus.focus) returnFocus.focus();
      if (layer.onClose) layer.onClose();
    };
    overlay.addEventListener('click', function () { if (opts.dismissible !== false) layer.close(); });
    SL.$$('[data-close]', panel).forEach(function (b) { b.addEventListener('click', function () { layer.close(); }); });
    document.addEventListener('keydown', onKey);
    layers.push(layer);
    requestAnimationFrame(function () {
      const target = SL.$('[autofocus]', panel) || SL.$$(FOCUSABLE, panel)[0];
      if (target) target.focus({ preventScroll: true });
    });
    return layer;
  };

  SL.modal = function (o) {
    const el = SL.h(
      '<div class="modal" style="' + (o.width ? 'width:min(' + o.width + 'px, calc(100vw - 32px))' : '') + '">' +
        '<div class="modal-head"><div class="grow"><h2>' + SL.esc(o.title) + '</h2>' +
        (o.subtitle ? '<p>' + SL.esc(o.subtitle) + '</p>' : '') + '</div>' +
        '<button class="icon-btn" type="button" data-close aria-label="Close dialog">' + SL.icon('x', 18) + '</button></div>' +
        '<div class="modal-body">' + (o.body || '') + '</div>' +
        (o.foot === false ? '' : '<div class="modal-foot">' + (o.foot || '<button class="btn btn-secondary" data-close type="button">Cancel</button>') + '</div>') +
      '</div>'
    );
    const layer = SL.openLayer({ el: el, label: o.title, onClose: o.onClose });
    if (o.onMount) o.onMount(el, layer);
    return layer;
  };

  SL.confirm = function (o) {
    return SL.modal({
      title: o.title, subtitle: o.message, width: 440, body: '',
      foot: '<button class="btn btn-secondary" data-close type="button">Cancel</button>' +
            '<button class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-ok type="button">' + SL.esc(o.confirm || 'Confirm') + '</button>',
      onMount: function (el, layer) {
        el.querySelector('.modal-body').remove();
        el.querySelector('[data-ok]').addEventListener('click', function () { layer.close(true); o.onConfirm && o.onConfirm(); });
      }
    });
  };

  SL.drawer = function (o) {
    const el = SL.h(
      '<aside class="drawer" style="' + (o.width ? 'width:min(' + o.width + 'px,100vw)' : '') + '">' +
        '<div class="drawer-head"><div class="grow"><div class="h5 fw-700">' + SL.esc(o.title) + '</div>' +
        (o.subtitle ? '<div class="text-sm text-muted">' + SL.esc(o.subtitle) + '</div>' : '') + '</div>' +
        (o.headActions || '') +
        '<button class="icon-btn" type="button" data-close aria-label="Close panel">' + SL.icon('x', 18) + '</button></div>' +
        '<div class="drawer-body">' + (o.body || '') + '</div>' +
        (o.foot ? '<div class="drawer-foot">' + o.foot + '</div>' : '') +
      '</aside>'
    );
    const layer = SL.openLayer({ el: el, label: o.title, onClose: o.onClose });
    if (o.onMount) o.onMount(el, layer);
    return layer;
  };

  /* ---------- Menus (anchored popovers) ---------- */
  let openMenu = null;
  SL.closeMenu = function () {
    if (!openMenu) return;
    openMenu.el.remove();
    if (openMenu.anchor) openMenu.anchor.setAttribute('aria-expanded', 'false');
    document.removeEventListener('mousedown', openMenu.outside, true);
    document.removeEventListener('keydown', openMenu.key, true);
    openMenu = null;
  };
  /* items: [{label, icon, kbd, danger, onClick} | 'sep' | {heading}] or html string */
  SL.menu = function (anchor, items, opts) {
    opts = opts || {};
    if (openMenu && openMenu.anchor === anchor) { SL.closeMenu(); return; }
    SL.closeMenu();
    const el = SL.h('<div class="popover" role="menu"></div>');
    if (opts.width) el.style.minWidth = opts.width + 'px';
    if (typeof items === 'string') el.innerHTML = items;
    else items.forEach(function (it) {
      if (it === 'sep') { el.appendChild(SL.h('<div class="menu-sep" role="separator"></div>')); return; }
      if (it.heading) { el.appendChild(SL.h('<div class="menu-label">' + SL.esc(it.heading) + '</div>')); return; }
      const b = SL.h('<button type="button" role="menuitem" class="menu-item' + (it.danger ? ' danger' : '') + '">' +
        (it.icon ? SL.icon(it.icon, 16) : '') + (it.html || '<span>' + SL.esc(it.label) + '</span>') +
        (it.kbd ? '<kbd>' + it.kbd + '</kbd>' : '') + (it.checked ? '<span class="ml-auto text-brand">' + SL.icon('check', 16) + '</span>' : '') + '</button>');
      b.addEventListener('click', function () { SL.closeMenu(); it.onClick && it.onClick(); });
      el.appendChild(b);
    });
    document.body.appendChild(el);
    const r = anchor.getBoundingClientRect();
    const w = el.offsetWidth, hgt = el.offsetHeight;
    let left = opts.align === 'right' ? r.right - w : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    let top = r.bottom + 6 + window.scrollY;
    if (r.bottom + hgt + 12 > window.innerHeight && r.top > hgt + 12) top = r.top - hgt - 6 + window.scrollY;
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    anchor.setAttribute('aria-expanded', 'true');
    const outside = function (e) { if (!el.contains(e.target) && !anchor.contains(e.target)) SL.closeMenu(); };
    const key = function (e) {
      const itemsEl = SL.$$('.menu-item', el);
      const idx = itemsEl.indexOf(document.activeElement);
      if (e.key === 'Escape') { SL.closeMenu(); anchor.focus(); e.preventDefault(); }
      else if (e.key === 'ArrowDown') { (itemsEl[idx + 1] || itemsEl[0]).focus(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { (itemsEl[idx - 1] || itemsEl[itemsEl.length - 1]).focus(); e.preventDefault(); }
    };
    document.addEventListener('mousedown', outside, true);
    document.addEventListener('keydown', key, true);
    openMenu = { el: el, anchor: anchor, outside: outside, key: key };
    if (opts.onMount) opts.onMount(el);
    const first = el.querySelector('.menu-item, input');
    if (first && opts.focus !== false) first.focus({ preventScroll: true });
    return el;
  };

  /* ---------- Tooltips: any [data-tip] element ---------- */
  let tipEl = null, tipTimer = null;
  function showTip(target) {
    const text = target.getAttribute('data-tip');
    if (!text) return;
    if (!tipEl) { tipEl = SL.h('<div class="tooltip" role="tooltip"></div>'); document.body.appendChild(tipEl); }
    tipEl.innerHTML = text;
    tipEl.classList.remove('is-visible');
    const r = target.getBoundingClientRect();
    const place = target.getAttribute('data-tip-pos') || 'top';
    requestAnimationFrame(function () {
      const w = tipEl.offsetWidth, hh = tipEl.offsetHeight;
      let x, y;
      if (place === 'right') { x = r.right + 10; y = r.top + r.height / 2 - hh / 2; }
      else if (place === 'bottom') { x = r.left + r.width / 2 - w / 2; y = r.bottom + 8; }
      else { x = r.left + r.width / 2 - w / 2; y = r.top - hh - 8; if (y < 8) y = r.bottom + 8; }
      tipEl.style.left = Math.max(8, Math.min(x, window.innerWidth - w - 8)) + 'px';
      tipEl.style.top = Math.max(8, y) + 'px';
      tipEl.classList.add('is-visible');
    });
  }
  function hideTip() { clearTimeout(tipTimer); if (tipEl) tipEl.classList.remove('is-visible'); }
  SL.showTipAt = function (html, x, y) {
    if (!tipEl) { tipEl = SL.h('<div class="tooltip" role="tooltip"></div>'); document.body.appendChild(tipEl); }
    tipEl.innerHTML = html;
    const w = tipEl.offsetWidth, hh = tipEl.offsetHeight;
    let left = x + 14, top = y - hh - 12;
    if (left + w > window.innerWidth - 8) left = x - w - 14;
    if (top < 8) top = y + 16;
    tipEl.style.left = left + 'px';
    tipEl.style.top = top + 'px';
    tipEl.classList.add('is-visible');
  };
  SL.hideTip = hideTip;
  document.addEventListener('mouseover', function (e) {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) return;
    clearTimeout(tipTimer);
    tipTimer = setTimeout(function () { showTip(t); }, 280);
  });
  document.addEventListener('mouseout', function (e) {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (t && !t.contains(e.relatedTarget)) hideTip();
  });
  document.addEventListener('focusin', function (e) {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (t && t.matches(':focus-visible')) showTip(t);
  });
  document.addEventListener('focusout', hideTip);
  window.addEventListener('scroll', hideTip, true);

  /* ---------- Debounce ---------- */
  SL.debounce = function (fn, ms) {
    let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); };
  };

  /* ---------- Boot shared bits ---------- */
  SL.theme.apply(SL.theme.get());
  document.addEventListener('click', function (e) {
    const t = e.target.closest && e.target.closest('[data-theme-toggle]');
    if (t) SL.theme.toggle();
  });
  document.addEventListener('DOMContentLoaded', function () {
    if (SL.hydrateIcons) SL.hydrateIcons();
    SL.theme.apply(SL.theme.get());
  });
})(window.SL);
