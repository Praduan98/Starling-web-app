/* Planner — week / month / list with drag-to-reschedule */
(function (SL) {
  'use strict';
  SL.views = SL.views || {};
  const DAY = SL.DAY;
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const st = {
    mode: SL.store.get('planner:mode', 'week'),
    anchor: null,
    nets: [],          // empty = all
    statuses: []
  };
  function mondayOf(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); const dow = (x.getDay() + 6) % 7; return new Date(x.getTime() - dow * DAY); }
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

  function visible(p) {
    if (st.nets.length && !p.channels.some(function (c) { return st.nets.indexOf(SL.data.channel(c).net) > -1; })) return false;
    if (st.statuses.length && st.statuses.indexOf(p.status) < 0) return false;
    return true;
  }

  function card(p) {
    const drag = p.status !== 'published';
    return '<button type="button" class="pcard" data-post="' + p.id + '" data-status="' + p.status + '"' + (drag ? ' draggable="true"' : '') +
      ' aria-label="' + SL.esc(SL.statusMeta[p.status].label + ', ' + SL.fmt.time(p.date) + ': ' + p.text.slice(0, 60)) + '">' +
      '<span class="pcard-top"><span class="pcard-time">' + SL.fmt.time(p.date) + '</span><span class="ml-auto">' + SL.channelBadges(p.channels, 18) + '</span></span>' +
      (p.media[0] ? '<img class="pcard-img" src="' + p.media[0] + '" alt="" loading="lazy" draggable="false">' : '') +
      '<span class="pcard-text clamp-2">' + SL.esc(p.text) + '</span>' +
      SL.statusLabel(p.status) +
    '</button>';
  }

  function rangeLabel() {
    if (st.mode === 'month') return st.anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const end = new Date(st.anchor.getTime() + 6 * DAY);
    const sameM = st.anchor.getMonth() === end.getMonth();
    return SL.fmt.date(st.anchor, { month: 'long', day: 'numeric' }) + ' – ' + (sameM ? end.getDate() : SL.fmt.date(end, { month: 'long', day: 'numeric' })) + ', ' + end.getFullYear();
  }

  function weekHTML() {
    const now = new Date();
    let html = '<div class="week" role="list" aria-label="Week of ' + SL.esc(rangeLabel()) + '">';
    for (let i = 0; i < 7; i++) {
      const d = new Date(st.anchor.getTime() + i * DAY);
      const posts = SL.data.postsOn(d).filter(visible);
      const past = d < SL.today, today = sameDay(d, now);
      html += '<div class="day-col' + (past ? ' is-past' : '') + (today ? ' is-today' : '') + '" role="listitem" data-day="' + d.toISOString() + '">' +
        '<div class="day-head"><span class="day-name">' + DOW[i] + '</span><span class="day-num">' + d.getDate() + '</span><span class="day-count">' + (posts.length ? posts.length + ' post' + (posts.length > 1 ? 's' : '') : '') + '</span></div>' +
        '<div class="day-body">' + posts.map(card).join('') +
        (!past ? '<button type="button" class="day-add" data-compose data-date="' + d.toISOString() + '" aria-label="Create post on ' + SL.fmt.date(d, { weekday: 'long', month: 'long', day: 'numeric' }) + '">' + SL.icon('plus', 14) + 'Add post</button>' : '') +
        '</div></div>';
    }
    return html + '</div>';
  }

  function monthHTML() {
    const first = new Date(st.anchor.getFullYear(), st.anchor.getMonth(), 1);
    const start = mondayOf(first);
    const now = new Date();
    let html = '<div class="month" role="grid" aria-label="' + SL.esc(rangeLabel()) + '"><div role="row" style="display:contents">' + DOW.map(function (d) { return '<div class="month-dow" role="columnheader">' + d + '</div>'; }).join('') + '</div>';
    for (let w = 0; w < 6; w++) {
      html += '<div role="row" style="display:contents">';
      for (let i = 0; i < 7; i++) {
        const d = new Date(start.getTime() + (w * 7 + i) * DAY);
        const posts = SL.data.postsOn(d).filter(visible);
        const out = d.getMonth() !== first.getMonth();
        html += '<div role="gridcell" class="month-cell' + (out ? ' is-out' : '') + (sameDay(d, now) ? ' is-today' : '') + '" data-day="' + d.toISOString() + '">' +
          '<span class="mc-num">' + d.getDate() + '</span>' +
          posts.slice(0, 3).map(function (p) {
            const ch = SL.data.channel(p.channels[0]);
            return '<button type="button" class="mpill" data-post="' + p.id + '"' + (p.status !== 'published' ? ' draggable="true"' : '') + ' aria-label="' + SL.esc(SL.fmt.time(p.date) + ' ' + p.text.slice(0, 40)) + '">' + SL.netBadge(ch.net, 14) +
              '<span class="t">' + SL.fmt.time(p.date).replace(':00', '').replace(' ', '').toLowerCase() + '</span><span class="txt truncate">' + SL.esc(p.text) + '</span></button>';
          }).join('') +
          (posts.length > 3 ? '<button type="button" class="mmore" data-week="' + d.toISOString() + '">+' + (posts.length - 3) + ' more</button>' : '') +
        '</div>';
      }
      html += '</div>';
    }
    return html + '</div>';
  }

  function listHTML() {
    let rows = '';
    for (let i = 0; i < 14; i++) {
      const d = new Date(st.anchor.getTime() + i * DAY);
      const posts = SL.data.postsOn(d).filter(visible);
      if (!posts.length) continue;
      rows += '<tr class="group-row"><th colspan="5" scope="colgroup">' + SL.fmt.date(d, { weekday: 'long', month: 'long', day: 'numeric' }) + ' · ' + posts.length + ' post' + (posts.length > 1 ? 's' : '') + '</th></tr>';
      rows += posts.map(function (p) {
        const a = SL.data.member(p.author);
        return '<tr data-post="' + p.id + '" style="cursor:pointer" tabindex="0"><td class="tabular fw-600" style="white-space:nowrap">' + SL.fmt.time(p.date) + '</td>' +
          '<td><div class="post-cell">' + (p.media[0] ? '<img class="thumb" src="' + p.media[0] + '" alt="">' : '') + '<div class="grow"><p class="clamp-2">' + SL.esc(p.text) + '</p><span class="list-meta">' + SL.channelBadges(p.channels, 18) + SL.statusLabel(p.status) + '</span></div></div></td>' +
          '<td>' + SL.channelBadges(p.channels, 20) + '</td><td>' + SL.statusLabel(p.status) + '</td>' +
          '<td><span class="row"><span class="avatar avatar-xs"><img src="' + a.avatar + '" alt=""></span><span class="text-sm">' + SL.esc(a.name) + '</span></span></td></tr>';
      }).join('');
    }
    if (!rows) return '<div class="card empty"><div class="empty-icon">' + SL.icon('calendar-days', 22) + '</div><h3>No posts in this range</h3><p>Clear filters or create a post for these two weeks.</p><button class="btn btn-primary" type="button" data-compose>Create post</button></div>';
    return '<div class="card data-table-wrap"><table class="table list-table"><thead><tr><th scope="col">Time</th><th scope="col">Post</th><th scope="col">Channels</th><th scope="col">Status</th><th scope="col">Owner</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function chLabel() {
    if (!st.nets.length) return SL.icon('sliders-horizontal', 14) + 'All channels' + SL.icon('chevron-down', 14);
    return SL.icon('sliders-horizontal', 14) + '<span class="net-row">' + st.nets.map(function (n) { return SL.netBadge(n, 18); }).join('') + '</span>' +
      st.nets.length + ' channel' + (st.nets.length > 1 ? 's' : '') + SL.icon('chevron-down', 14);
  }

  SL.views.planner = {
    title: 'Planner',
    sub: 'Plan, schedule and reschedule across every channel',
    render: function (el) {
      if (!st.anchor) st.anchor = mondayOf(new Date());
      const nets = []; SL.data.channels.forEach(function (c) { if (nets.indexOf(c.net) < 0) nets.push(c.net); });
      const counts = {}; SL.data.posts.forEach(function (p) { counts[p.status] = (counts[p.status] || 0) + 1; });

      function draw() {
        el.innerHTML =
          '<div class="planner-bar">' +
            '<div class="row"><button class="btn btn-secondary btn-sm" type="button" data-nav="today">Today</button>' +
            '<button class="icon-btn" type="button" data-nav="-1" aria-label="Previous ' + st.mode + '">' + SL.icon('chevron-left', 20) + '</button>' +
            '<button class="icon-btn" type="button" data-nav="1" aria-label="Next ' + st.mode + '">' + SL.icon('chevron-right', 20) + '</button></div>' +
            '<h2 class="planner-range" aria-live="polite">' + rangeLabel() + '</h2>' +
            '<div class="page-actions">' +
              '<div class="segmented" role="group" aria-label="Planner view">' +
                [['week', 'columns-3', 'Week'], ['month', 'calendar', 'Month'], ['list', 'list', 'List']].map(function (m) {
                  return '<button type="button" data-mode="' + m[0] + '" aria-pressed="' + (st.mode === m[0]) + '">' + SL.icon(m[1], 14) + m[2] + '</button>';
                }).join('') + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="filter-bar" role="group" aria-label="Filter by channel and status">' +
            '<button type="button" class="chip ch-filter-btn" data-chfilter aria-haspopup="menu" aria-expanded="false" aria-pressed="' + (st.nets.length > 0) + '">' + chLabel() + '</button>' +
            '<span class="divider-v" aria-hidden="true"></span>' +
            ['scheduled', 'approval', 'draft', 'published'].map(function (s) {
              return '<button type="button" class="chip" data-st="' + s + '" aria-pressed="' + (st.statuses.indexOf(s) > -1) + '">' + SL.icon(SL.statusMeta[s].icon, 14) + SL.statusMeta[s].label + '<span class="count count-muted">' + (counts[s] || 0) + '</span></button>';
            }).join('') +
            (st.nets.length || st.statuses.length ? '<button type="button" class="btn btn-ghost btn-sm" data-clear>' + SL.icon('x', 14) + 'Clear filters</button>' : '') +
          '</div>' +
          '<div id="plannerBody">' + (st.mode === 'week' ? weekHTML() : st.mode === 'month' ? monthHTML() : listHTML()) + '</div>' +
          (st.mode !== 'list' ? '<p class="text-xs text-muted" style="margin-top:12px;display:flex;align-items:center;gap:6px">' + SL.icon('move', 14) + 'Drag a post to another day to reschedule. Open a post and choose Edit to move it with the keyboard.</p>' : '');
      }
      draw();

      el.addEventListener('click', function (e) {
        const t = e.target;
        const nav = t.closest('[data-nav]');
        if (nav) {
          const v = nav.getAttribute('data-nav');
          if (v === 'today') st.anchor = st.mode === 'month' ? new Date(new Date().getFullYear(), new Date().getMonth(), 1) : mondayOf(new Date());
          else if (st.mode === 'month') st.anchor = new Date(st.anchor.getFullYear(), st.anchor.getMonth() + (+v), 1);
          else st.anchor = new Date(st.anchor.getTime() + (+v) * (st.mode === 'list' ? 14 : 7) * DAY);
          draw(); return;
        }
        const mode = t.closest('[data-mode]');
        if (mode) {
          st.mode = mode.getAttribute('data-mode'); SL.store.set('planner:mode', st.mode);
          st.anchor = st.mode === 'month' ? new Date(st.anchor.getFullYear(), st.anchor.getMonth(), 1) : mondayOf(st.mode === 'week' || st.mode === 'list' ? (sameMonthAsToday(st.anchor) ? new Date() : st.anchor) : st.anchor);
          draw(); return;
        }
        if (t.closest('[data-clear]')) { st.nets = []; st.statuses = []; draw(); return; }
        const chb = t.closest('[data-chfilter]');
        if (chb) {
          const menuHTML = '<div class="menu-label">Channels</div>' + nets.map(function (n) {
            const on = st.nets.indexOf(n) > -1;
            return '<button type="button" role="menuitemcheckbox" class="menu-item" data-n="' + n + '" aria-checked="' + on + '">' + SL.netBadge(n, 20) + '<span>' + SL.NETWORKS[n].name + '</span><span class="check-box">' + (on ? SL.icon('check', 12) : '') + '</span></button>';
          }).join('') + '<div class="menu-sep"></div><button type="button" class="menu-item" data-n="">' + SL.icon('rotate-ccw', 16) + '<span>Show all channels</span></button>';
          SL.menu(chb, menuHTML, { width: 240, onMount: function (m) {
            m.classList.add('ch-filter-menu');
            m.addEventListener('click', function (e) {
              const it = e.target.closest('[data-n]'); if (!it) return;
              const n = it.getAttribute('data-n');
              if (!n) { st.nets = []; SL.closeMenu(); draw(); return; }
              const i = st.nets.indexOf(n); if (i > -1) st.nets.splice(i, 1); else st.nets.push(n);
              const on = st.nets.indexOf(n) > -1;
              it.setAttribute('aria-checked', String(on)); it.querySelector('.check-box').innerHTML = on ? SL.icon('check', 12) : '';
              chb.innerHTML = chLabel(); chb.setAttribute('aria-pressed', String(st.nets.length > 0));
              SL.$('#plannerBody', el).innerHTML = st.mode === 'week' ? weekHTML() : st.mode === 'month' ? monthHTML() : listHTML();
            });
          } });
          return;
        }
        const s = t.closest('[data-st]');
        if (s) { const v2 = s.getAttribute('data-st'); const i2 = st.statuses.indexOf(v2); if (i2 > -1) st.statuses.splice(i2, 1); else st.statuses.push(v2); draw(); return; }
        const more = t.closest('[data-week]');
        if (more) { st.mode = 'week'; st.anchor = mondayOf(new Date(more.getAttribute('data-week'))); draw(); return; }
        const p = t.closest('[data-post]');
        if (p) SL.openPost(p.getAttribute('data-post'));
      });
      function sameMonthAsToday(d) { const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }

      el.addEventListener('keydown', function (e) {
        const row = e.target.closest('tr[data-post]');
        if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); SL.openPost(row.getAttribute('data-post')); }
      });

      /* Drag and drop */
      let dragId = null;
      el.addEventListener('dragstart', function (e) {
        const p = e.target.closest('[data-post][draggable="true"]'); if (!p) return;
        dragId = p.getAttribute('data-post');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragId);
        requestAnimationFrame(function () { p.classList.add('is-dragging'); });
      });
      el.addEventListener('dragend', function () { SL.$$('.is-dragging, .is-over', el).forEach(function (n) { n.classList.remove('is-dragging', 'is-over'); }); dragId = null; });
      el.addEventListener('dragover', function (e) {
        const col = e.target.closest('[data-day]'); if (!col || !dragId) return;
        e.preventDefault();
        SL.$$('.is-over', el).forEach(function (n) { if (n !== col) n.classList.remove('is-over'); });
        col.classList.add('is-over');
      });
      el.addEventListener('dragleave', function (e) {
        const col = e.target.closest('[data-day]'); if (col && !col.contains(e.relatedTarget)) col.classList.remove('is-over');
      });
      el.addEventListener('drop', function (e) {
        const col = e.target.closest('[data-day]'); if (!col || !dragId) return;
        e.preventDefault();
        const p = SL.data.posts.find(function (x) { return x.id === dragId; });
        const day = new Date(col.getAttribute('data-day'));
        const old = new Date(p.date);
        const next = new Date(day); next.setHours(old.getHours(), old.getMinutes(), 0, 0);
        if (sameDay(next, old)) { draw(); return; }
        if (next < new Date()) { SL.toast('Can’t schedule in the past', { type: 'error', message: 'Drop the post on today or a later day.' }); draw(); return; }
        const prevDate = p.date;
        p.date = next.toISOString(); SL.data.save('posts'); draw();
        SL.toast('Rescheduled', { message: SL.longWhen(next), action: { label: 'Undo', onClick: function () { p.date = prevDate; SL.data.save('posts'); draw(); } } });
      });
    }
  };
})(window.SL);
