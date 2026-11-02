/* ==========================================================================
   Starling app shell — router, sidebar, menus, notifications, command palette
   ========================================================================== */
(function (SL) {
  'use strict';
  const $ = SL.$, $$ = SL.$$;
  let main = $('#main');
  const root = document.documentElement;
  let current = { name: null, params: [] };

  /* ---------- Router ---------- */
  function parse() {
    const h = (location.hash || '#/home').replace(/^#\/?/, '');
    const parts = h.split('/').filter(Boolean);
    return { name: parts[0] || 'home', params: parts.slice(1) };
  }
  function render(focus, force) {
    const r = parse();
    const view = SL.views[r.name] || SL.views.home;
    const name = SL.views[r.name] ? r.name : 'home';
    const sameView = current.name === name;
    // Same screen, new detail (e.g. another conversation): the view updates in place instead of re-rendering
    if (sameView && !force && view.update && view.update(r.params) === true) { current.params = r.params; closeSidebar(); return; }
    current = { name: name, params: r.params };
    SL.closeMenu();
    SL.hideTip();
    $$('.sb-link').forEach(function (a) {
      if (a.getAttribute('data-route') === name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    $('#pageTitle').textContent = view.title;
    $('#pageSub').textContent = typeof view.sub === 'function' ? view.sub() : (view.sub || '');
    document.title = view.title + ' · Starling';
    // Fresh node per render so view-level listeners never stack up
    const fresh = main.cloneNode(false);
    // The entrance animation plays only when moving to a different screen, never on in-place updates
    fresh.className = 'view' + (view.cls ? ' ' + view.cls : '') + (sameView ? '' : ' is-entering');
    main.replaceWith(fresh);
    main = fresh;
    view.render(main, r.params);
    if (!sameView) setTimeout(function () { fresh.classList.remove('is-entering'); }, 700);
    if (!sameView) window.scrollTo(0, 0);
    if (focus !== false && !sameView) main.focus({ preventScroll: true });
    closeSidebar();
  }
  SL.refresh = function () { render(false, true); };
  SL.go = function (hash) { if (location.hash === hash) render(); else location.hash = hash; };
  SL.currentView = function () { return current; };
  window.addEventListener('hashchange', function () { render(); });

  /* ---------- Counters in the sidebar ---------- */
  SL.updateCounts = function () {
    const open = SL.data.conversations.filter(function (c) { return c.status === 'open'; }).length;
    const unread = SL.data.conversations.filter(function (c) { return c.unread && c.status === 'open'; }).length;
    const appr = SL.data.posts.filter(function (p) { return p.status === 'approval'; }).length;
    const ic = $('#inboxCount'), ac = $('#approvalCount');
    ic.textContent = open; ic.hidden = !open;
    ic.setAttribute('aria-label', open + ' open conversations, ' + unread + ' unread');
    ac.textContent = appr; ac.hidden = !appr;
  };

  /* ---------- Sidebar ---------- */
  if (SL.store.get('sbCollapsed', false)) root.classList.add('sb-collapsed');
  $('#sbCollapse').addEventListener('click', function () {
    const c = root.classList.toggle('sb-collapsed');
    SL.store.set('sbCollapsed', c);
    this.setAttribute('aria-label', c ? 'Expand sidebar' : 'Collapse sidebar');
    this.setAttribute('data-tip', c ? 'Expand sidebar' : 'Collapse sidebar');
  });
  function openSidebar() {
    root.classList.add('sb-open'); $('#sbScrim').hidden = false;
    $('#openSidebar').setAttribute('aria-expanded', 'true');
    const first = $('.sb-link'); if (first) first.focus();
  }
  function closeSidebar() {
    if (!root.classList.contains('sb-open')) return;
    root.classList.remove('sb-open'); $('#sbScrim').hidden = true;
    $('#openSidebar').setAttribute('aria-expanded', 'false');
  }
  $('#openSidebar').addEventListener('click', openSidebar);
  $('#sbScrim').addEventListener('click', closeSidebar);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSidebar(); });

  /* ---------- Workspace + user menus ---------- */
  $('#wsSwitch').addEventListener('click', function () {
    SL.menu(this, [
      { heading: 'Workspaces' },
      { html: '<span class="ws-avatar" style="width:24px;height:24px;font-size:10px;border-radius:7px">NX</span><span class="grow">Nexora</span>', checked: true },
      { html: '<span class="ws-avatar" style="width:24px;height:24px;font-size:10px;border-radius:7px;background:linear-gradient(135deg,#14532D,#3F7D4E);color:#E6F4EA">NO</span><span class="grow">Northwind Outdoors</span>', onClick: function () { SL.toast('Demo workspace', { type: 'info', message: 'Northwind Outdoors is read-only in this prototype.' }); } },
      { html: '<img src="assets/brand/app-icon.svg" width="24" height="24" alt="" style="border-radius:7px"><span class="grow">AllAI Suite</span>', onClick: function () { SL.toast('Demo workspace', { type: 'info', message: 'AllAI Suite is read-only in this prototype.' }); } },
      'sep',
      { label: 'Workspace settings', icon: 'settings', onClick: function () { SL.go('#/settings/workspace'); } },
      { label: 'Create workspace', icon: 'plus', onClick: function () { location.href = 'onboarding.html'; } }
    ], { width: 248 });
  });
  $('#userMenu').addEventListener('click', function () {
    SL.menu(this, [
      { html: '<span class="avatar avatar-sm"><img src="' + SL.data.user.avatar + '" alt=""></span><span class="col" style="line-height:1.3"><b class="text-sm">' + SL.esc(SL.data.user.name) + '</b><span class="text-xs text-muted">' + SL.data.user.email + '</span></span>' },
      'sep',
      { label: 'Profile', icon: 'user', onClick: function () { SL.go('#/settings/profile'); } },
      { label: 'Keyboard shortcuts', icon: 'keyboard', kbd: '?', onClick: shortcuts },
      { label: 'Design system', icon: 'palette', onClick: function () { location.href = 'brand.html'; } },
      { label: 'Reset demo data', icon: 'rotate-ccw', onClick: function () { SL.confirm({ title: 'Reset demo data?', message: 'Posts, conversations and library changes you made in this prototype will be restored to the original demo state.', confirm: 'Reset', danger: true, onConfirm: SL.data.reset }); } },
      'sep',
      { label: 'Sign out', icon: 'log-out', danger: true, onClick: function () { location.href = 'index.html'; } }
    ], { width: 260 });
  });

  /* ---------- Help ---------- */
  $('#openHelp').addEventListener('click', function () {
    SL.menu(this, [
      { heading: 'Help & resources' },
      { label: 'Keyboard shortcuts', icon: 'keyboard', kbd: '?', onClick: shortcuts },
      { label: 'Design system', icon: 'palette', onClick: function () { location.href = 'brand.html'; } },
      { label: 'Product tour', icon: 'rocket', onClick: function () { SL.toast('Product tour', { type: 'info', message: 'Start with Create post, then drag it around the Planner.' }); } },
      { label: 'Contact support', icon: 'message-square', onClick: function () { SL.toast('Support chat opened', { type: 'info', message: 'Median reply time is 4 minutes.' }); } }
    ], { align: 'right', width: 250 });
  });

  function shortcuts() {
    const rows = [
      ['Ctrl / ⌘ + K', 'Search and commands'], ['C', 'Create a post'], ['G then H', 'Go to Home'], ['G then P', 'Go to Planner'],
      ['G then S', 'Go to Streams'], ['G then I', 'Go to Inbox'], ['G then A', 'Go to Analytics'], ['[', 'Collapse sidebar'], ['?', 'Show shortcuts'], ['Esc', 'Close dialogs']
    ];
    SL.modal({
      title: 'Keyboard shortcuts', width: 480,
      body: '<table class="table"><tbody>' + rows.map(function (r) {
        return '<tr><td>' + r[1] + '</td><td class="num">' + r[0].split(' ').map(function (k) { return k === '+' || k === 'then' || k === '/' ? '<span class="text-muted text-xs" style="margin:0 4px">' + k + '</span>' : '<kbd>' + k + '</kbd>'; }).join('') + '</td></tr>';
      }).join('') + '</tbody></table>',
      foot: '<button class="btn btn-primary" data-close type="button">Got it</button>'
    });
  }

  /* ---------- Notifications ---------- */
  function renderNotifs() {
    const unread = SL.data.notifications.filter(function (n) { return n.unread; }).length;
    $('#notifDot').hidden = !unread;
    $('#openNotifs').setAttribute('aria-label', 'Notifications' + (unread ? ', ' + unread + ' unread' : ''));
  }
  $('#openNotifs').addEventListener('click', function () {
    SL.drawer({
      title: 'Notifications', subtitle: 'Approvals, mentions and alerts', width: 420,
      headActions: '<button class="btn btn-ghost btn-sm" type="button" data-markall>Mark all read</button>',
      body: '<div class="segmented" role="tablist" style="margin-bottom:12px"><button aria-selected="true" role="tab" type="button">All</button><button role="tab" type="button" aria-selected="false">Mentions</button><button role="tab" type="button" aria-selected="false">Approvals</button></div>' +
        '<ul>' + SL.data.notifications.map(function (n) {
          return '<li><a class="notif' + (n.unread ? ' is-unread' : '') + '" href="' + (n.href || '#/home') + '" data-close>' +
            '<span class="notif-ic">' + SL.icon(n.icon, 18) + '</span>' +
            '<span class="grow"><p>' + n.text + '</p><span class="text-xs text-muted">' + SL.fmt.ago(n.time) + ' ago</span></span>' +
            (n.unread ? '<span class="unread-dot" aria-label="Unread"></span>' : '') + '</a></li>';
        }).join('') + '</ul>',
      onMount: function (el, layer) {
        el.querySelector('[data-markall]').addEventListener('click', function () {
          SL.data.notifications.forEach(function (n) { n.unread = false; });
          $$('.notif', el).forEach(function (n) { n.classList.remove('is-unread'); });
          $$('.unread-dot', el).forEach(function (d) { d.remove(); });
          renderNotifs();
        });
        $$('.segmented button', el).forEach(function (b) {
          b.addEventListener('click', function () { $$('.segmented button', el).forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); }); });
        });
        $$('.notif', el).forEach(function (a) { a.addEventListener('click', function () { layer.close(true); }); });
      }
    });
  });

  /* ---------- Command palette ---------- */
  function commands() {
    const nav = [
      ['Home', 'house', '#/home'], ['Planner', 'calendar-days', '#/planner'], ['Streams', 'columns-3', '#/streams'], ['Inbox', 'inbox', '#/inbox'],
      ['Analytics', 'chart-column', '#/analytics'], ['Listening', 'radio-tower', '#/listening'], ['Library', 'images', '#/library'],
      ['Approvals', 'badge-check', '#/approvals'], ['Settings', 'settings', '#/settings']
    ].map(function (n) { return { group: 'Go to', label: n[0], icon: n[1], run: function () { SL.go(n[2]); } }; });
    const actions = [
      { group: 'Actions', label: 'Create a post', icon: 'square-pen', kbd: 'C', run: function () { SL.compose(); } },
      { group: 'Actions', label: 'Write a post with Starling AI', icon: 'sparkles', run: function () { SL.compose({ ai: true }); } },
      { group: 'Actions', label: 'Toggle dark mode', icon: 'moon', run: SL.theme.toggle },
      { group: 'Actions', label: 'Connect a channel', icon: 'link', run: function () { SL.go('#/settings/channels'); } },
      { group: 'Actions', label: 'Export analytics (CSV)', icon: 'download', run: function () { SL.go('#/analytics'); setTimeout(function () { const b = $('[data-export]'); if (b) b.click(); }, 200); } },
      { group: 'Actions', label: 'Open design system', icon: 'palette', run: function () { location.href = 'brand.html'; } }
    ];
    const seen = {};
    const posts = SL.data.posts.filter(function (p) { return p.status !== 'published' && new Date(p.date) > new Date(); })
      .sort(function (a, b) { return new Date(a.date) - new Date(b.date); })
      .filter(function (p) { if (seen[p.text]) return false; seen[p.text] = 1; return true; }).map(function (p) {
      return { group: 'Posts', label: p.text, sub: SL.fmt.date(p.date, { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + SL.fmt.time(p.date), icon: 'file-text', run: function () { SL.openPost(p.id); } };
    });
    const people = SL.data.conversations.map(function (c) {
      return { group: 'People', label: c.name, sub: c.handle + ' · ' + c.type, img: c.avatar, run: function () { SL.go('#/inbox/' + c.id); } };
    });
    return nav.concat(actions, people, posts);
  }
  function openPalette() {
    if ($('.cmdk')) return;
    const el = SL.h(
      '<div class="cmdk">' +
        '<div class="cmdk-input">' + SL.icon('search', 20) +
        '<input type="text" placeholder="Search posts, people and commands" aria-label="Search posts, people and commands" role="combobox" aria-expanded="true" aria-controls="cmdkList" autocomplete="off" autofocus>' +
        '<kbd>Esc</kbd></div>' +
        '<div class="cmdk-list" id="cmdkList" role="listbox" aria-label="Results"></div>' +
        '<div class="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>Enter</kbd> Open</span><span class="ml-auto">' + SL.icon('sparkles', 14) + ' Tip: type “create” to start a post</span></div>' +
      '</div>');
    const layer = SL.openLayer({ el: el, label: 'Command palette' });
    const input = el.querySelector('input');
    const list = el.querySelector('.cmdk-list');
    const all = commands();
    let shown = [], sel = 0;
    function draw() {
      const q = input.value.trim().toLowerCase();
      shown = (q ? all.filter(function (c) { return (c.label + ' ' + (c.sub || '') + ' ' + c.group).toLowerCase().indexOf(q) > -1; }) : all.filter(function (c) { return c.group !== 'Posts'; })).slice(0, 40);
      sel = Math.min(sel, Math.max(0, shown.length - 1));
      let html = '', g = null;
      shown.forEach(function (c, i) {
        if (c.group !== g) { g = c.group; html += '<div class="cmdk-group" role="presentation">' + g + '</div>'; }
        html += '<button type="button" class="cmdk-item" role="option" id="cmdk-' + i + '" data-i="' + i + '" aria-selected="' + (i === sel) + '">' +
          (c.img ? '<span class="avatar avatar-xs"><img src="' + c.img + '" alt=""></span>' : SL.icon(c.icon, 18)) +
          '<span class="grow"><span class="truncate" style="display:block">' + SL.esc(c.label) + '</span>' + (c.sub ? '<span class="sub">' + SL.esc(c.sub) + '</span>' : '') + '</span>' +
          (c.kbd ? '<kbd>' + c.kbd + '</kbd>' : '<span class="go">' + (c.group === 'Go to' ? 'Jump' : 'Open') + '</span>') + '</button>';
      });
      list.innerHTML = html || '<div class="empty"><div class="empty-icon">' + SL.icon('search', 22) + '</div><h3>No results for “' + SL.esc(input.value) + '”</h3><p>Try a post caption, a person’s name, or a page like “Analytics”.</p></div>';
      input.setAttribute('aria-activedescendant', shown.length ? 'cmdk-' + sel : '');
    }
    function run(i) { const c = shown[i]; if (!c) return; layer.close(true); setTimeout(c.run, 60); }
    input.addEventListener('input', function () { sel = 0; draw(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { sel = Math.min(shown.length - 1, sel + 1); draw(); scrollSel(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); scrollSel(); e.preventDefault(); }
      else if (e.key === 'Enter') { run(sel); e.preventDefault(); }
    });
    function scrollSel() { const it = list.querySelector('[aria-selected="true"]'); if (it) it.scrollIntoView({ block: 'nearest' }); }
    list.addEventListener('click', function (e) { const b = e.target.closest('.cmdk-item'); if (b) run(+b.getAttribute('data-i')); });
    list.addEventListener('mousemove', function (e) {
      const b = e.target.closest('.cmdk-item'); if (!b) return;
      const i = +b.getAttribute('data-i'); if (i === sel) return;
      sel = i; $$('.cmdk-item', list).forEach(function (x) { x.setAttribute('aria-selected', String(+x.getAttribute('data-i') === sel)); });
    });
    draw();
  }
  SL.openPalette = openPalette;
  $('#openSearch').addEventListener('click', openPalette);
  $$('[data-open-search]').forEach(function (b) { b.addEventListener('click', openPalette); });

  /* ---------- Global keyboard ---------- */
  let gPending = false, gTimer;
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
    const t = e.target instanceof Element ? e.target : document.body;
    if (t.closest('input, textarea, select, [contenteditable="true"]') || e.ctrlKey || e.metaKey || e.altKey) return;
    if ($('.overlay')) return;
    const k = e.key.toLowerCase();
    if (gPending) {
      gPending = false; clearTimeout(gTimer);
      const map = { h: 'home', p: 'planner', s: 'streams', i: 'inbox', a: 'analytics', l: 'listening' };
      if (map[k]) { SL.go('#/' + map[k]); e.preventDefault(); }
      return;
    }
    if (k === 'g') { gPending = true; gTimer = setTimeout(function () { gPending = false; }, 900); }
    else if (k === 'c') { e.preventDefault(); SL.compose(); }
    else if (k === '?') { shortcuts(); }
    else if (k === '[') { $('#sbCollapse').click(); }
  });

  /* ---------- Compose triggers ---------- */
  document.addEventListener('click', function (e) {
    const b = e.target.closest('[data-compose]');
    if (!b) return;
    e.preventDefault();
    const mode = b.getAttribute('data-compose');
    const date = b.getAttribute('data-date');
    SL.compose({ ai: mode === 'ai', date: date || null });
  });

  /* ---------- Boot ---------- */
  SL.hydrateIcons();
  SL.theme.apply(SL.theme.get());
  SL.updateCounts();
  renderNotifs();
  if (!location.hash) history.replaceState(null, '', '#/home');
  render(false);
  // Deep links: app.html?compose=1 (or =ai) opens the composer; ?palette=1 opens search
  const qp = new URLSearchParams(location.search);
  if (qp.get('compose')) setTimeout(function () { SL.compose({ ai: qp.get('compose') === 'ai' }); }, 150);
  if (qp.get('palette')) setTimeout(openPalette, 150);
})(window.SL);
