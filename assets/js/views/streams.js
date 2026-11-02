/* Streams — multi-column monitoring board */
(function (SL) {
  'use strict';
  SL.views = SL.views || {};
  let boardIdx = 0;
  let liveTimer = null;

  function highlight(t) {
    return SL.esc(t).replace(/(^|\s)([#@][\w.]+)/g, '$1<span class="hl">$2</span>');
  }
  function itemHTML(it, isNew) {
    return '<article class="sitem' + (isNew ? ' is-new' : '') + '" data-item="' + it.id + '">' +
      '<div class="sitem-head">' +
        (it.avatar ? '<span class="avatar avatar-md"><img src="' + it.avatar + '" alt="" loading="lazy"></span>' : '<span class="avatar avatar-md avatar-org">' + SL.esc(it.initials || it.name.slice(0, 2)) + '</span>') +
        '<div class="grow"><div class="sitem-name truncate">' + SL.esc(it.name) + '</div><div class="sitem-handle truncate">' + SL.esc(it.handle) + ' · ' + SL.fmt.ago(it.time) + '</div></div>' +
        '<button class="icon-btn icon-btn-sm" type="button" data-more aria-label="More actions">' + SL.icon('ellipsis', 16) + '</button>' +
      '</div>' +
      '<p class="sitem-text">' + highlight(it.text) + '</p>' +
      (it.media ? '<img class="sitem-img" src="' + it.media + '" alt="" loading="lazy">' : '') +
      '<div class="sitem-actions">' +
        '<button class="icon-btn" type="button" data-reply aria-label="Reply to ' + SL.esc(it.name) + '">' + SL.icon('reply', 16) + '</button><span class="act-count">' + it.replies + '</span>' +
        '<button class="icon-btn" type="button" data-repost aria-label="Repost">' + SL.icon('repeat-2', 16) + '</button>' +
        '<button class="icon-btn' + (it.liked ? ' liked' : '') + '" type="button" data-like aria-pressed="' + !!it.liked + '" aria-label="Like">' + SL.icon('heart', 16) + '</button><span class="act-count" data-likes>' + it.likes + '</span>' +
        '<button class="icon-btn ml-auto" type="button" data-assign aria-label="Assign to a teammate" data-tip="Assign">' + SL.icon('user-plus', 16) + '</button>' +
      '</div>' +
    '</article>';
  }
  function scheduledItems() {
    return SL.data.posts.filter(function (p) { return p.status === 'scheduled' && new Date(p.date) > new Date(); })
      .sort(function (a, b) { return new Date(a.date) - new Date(b.date); }).slice(0, 8);
  }
  function streamHTML(s) {
    const icon = s.net ? SL.netBadge(s.net, 28) : '<span class="kpi-ic" style="width:28px;height:28px;background:var(--brand-soft);color:var(--brand-ink)">' + SL.icon('calendar-clock', 16) + '</span>';
    let body;
    if (s.kind === 'scheduled') {
      body = scheduledItems().map(function (p) {
        return '<article class="sitem" data-post="' + p.id + '" style="cursor:pointer"><div class="row" style="margin-bottom:8px"><b class="text-sm tabular">' + SL.fmt.date(p.date, { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + SL.fmt.time(p.date) + '</b><span class="ml-auto">' + SL.channelBadges(p.channels, 18) + '</span></div>' +
          '<div class="row-3" style="align-items:flex-start">' + (p.media[0] ? '<img class="thumb" src="' + p.media[0] + '" alt="">' : '') + '<p class="text-sm clamp-3" style="color:var(--fg-2)">' + SL.esc(p.text) + '</p></div></article>';
      }).join('');
    } else body = s.items.map(function (it) { return itemHTML(it); }).join('');
    return '<section class="stream" data-stream="' + s.id + '" aria-label="' + SL.esc(s.title + ' stream') + '">' +
      '<header class="stream-head">' + icon +
        '<div class="grow" style="min-width:0"><div class="stream-title truncate">' + SL.esc(s.title) + '</div><div class="stream-sub truncate">' + SL.esc(s.handle) + '</div></div>' +
        '<button class="icon-btn icon-btn-sm" type="button" data-refresh aria-label="Refresh ' + SL.esc(s.title) + '" data-tip="Refresh">' + SL.icon('refresh-cw', 16) + '</button>' +
        '<button class="icon-btn icon-btn-sm" type="button" data-smenu aria-label="Stream options">' + SL.icon('ellipsis', 16) + '</button>' +
      '</header>' +
      '<div class="stream-body">' + body + '</div>' +
    '</section>';
  }

  SL.views.streams = {
    title: 'Streams',
    sub: 'Monitor mentions, comments, keywords and competitors in real time',
    cls: 'view-streams',
    render: function (el) {
      const boards = SL.data.boards;
      clearInterval(liveTimer);

      function draw() {
        const b = boards[boardIdx];
        el.innerHTML =
          '<div class="streams-bar">' +
            '<div class="tabs" role="tablist" aria-label="Boards" style="border-bottom:0">' + boards.map(function (bd, i) {
              return '<button class="tab" role="tab" type="button" data-board="' + i + '" aria-selected="' + (i === boardIdx) + '">' + SL.esc(bd.name) + '<span class="count count-muted">' + bd.streams.length + '</span></button>';
            }).join('') + '<button class="tab" type="button" data-newboard>' + SL.icon('plus', 16) + 'New board</button></div>' +
            '<div class="page-actions">' +
              '<span class="badge badge-success badge-dot" aria-live="polite">Live</span>' +
              '<label class="sr-only" for="streamPick">Jump to stream</label>' +
              '<select class="select stream-mobile-select" id="streamPick" style="width:auto">' + b.streams.map(function (s) { return '<option value="' + s.id + '">' + SL.esc(s.title + ' · ' + (s.net ? SL.NETWORKS[s.net].name : 'All')) + '</option>'; }).join('') + '</select>' +
              '<button class="btn btn-secondary btn-sm" type="button" data-addstream>' + SL.icon('plus', 16) + 'Add stream</button>' +
            '</div>' +
          '</div>' +
          '<div class="board" id="board">' + b.streams.map(streamHTML).join('') +
            '<button type="button" class="stream-add" data-addstream>' + SL.icon('plus', 24) + '<b>Add a stream</b><span class="text-sm">Mentions, keywords, hashtags or lists</span></button>' +
          '</div>';
        const board = SL.$('#board', el);
        const edge = function () { board.classList.toggle('at-end', board.scrollLeft + board.clientWidth >= board.scrollWidth - 8); };
        board.addEventListener('scroll', edge, { passive: true }); edge();
        const pick = SL.$('#streamPick', el);
        pick.addEventListener('change', function () {
          const s = el.querySelector('[data-stream="' + pick.value + '"]'); if (s) s.scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'smooth' });
        });
      }
      draw();

      /* Simulated live activity */
      const incoming = [
        { name: 'Sneha Pillai', handle: '@snehapillai', avatar: 'assets/media/a14.webp', text: 'Just set up my first Flow 3.0 agent with @nexorahq. It already saved me an hour today.' },
        { name: 'Imran Qureshi', handle: '@imranq', avatar: 'assets/media/a15.webp', text: '@nexorahq will the Summit keynote be livestreamed for remote teams?' }
      ];
      let k = 0;
      liveTimer = setInterval(function () {
        if (!el.isConnected) { clearInterval(liveTimer); return; }
        if (boardIdx !== 0 || k >= incoming.length) return;
        const s = boards[0].streams[0];
        const it = Object.assign({ id: 'live' + k, net: 'x', time: new Date().toISOString(), media: null, likes: 0, replies: 0 }, incoming[k++]);
        s.items.unshift(it);
        const body = el.querySelector('[data-stream="s1"] .stream-body');
        if (body) body.insertAdjacentHTML('afterbegin', itemHTML(it, true));
      }, 9000);

      function findItem(node) {
        const sEl = node.closest('[data-stream]'); const iEl = node.closest('[data-item]');
        if (!sEl || !iEl) return {};
        const s = boards[boardIdx].streams.find(function (x) { return x.id === sEl.getAttribute('data-stream'); });
        return { s: s, it: s.items.find(function (x) { return x.id === iEl.getAttribute('data-item'); }), iEl: iEl };
      }

      el.addEventListener('click', function (e) {
        const t = e.target;
        const bd = t.closest('[data-board]');
        if (bd) { boardIdx = +bd.getAttribute('data-board'); draw(); return; }
        if (t.closest('[data-newboard]')) { SL.toast('Board created', { type: 'info', message: 'Name it and add streams to start monitoring.' }); return; }
        if (t.closest('[data-addstream]')) { addStream(); return; }
        const post = t.closest('[data-post]');
        if (post) { SL.openPost(post.getAttribute('data-post')); return; }
        const rf = t.closest('[data-refresh]');
        if (rf) {
          rf.querySelector('svg').style.transition = 'transform .6s var(--ease)';
          rf.querySelector('svg').style.transform = 'rotate(360deg)';
          setTimeout(function () { SL.toast('Stream is up to date', { type: 'info', duration: 2200 }); rf.querySelector('svg').style.transform = ''; rf.querySelector('svg').style.transition = ''; }, 600);
          return;
        }
        const sm = t.closest('[data-smenu]');
        if (sm) {
          SL.menu(sm, [
            { label: 'Edit stream', icon: 'sliders-horizontal', onClick: function () { SL.toast('Stream settings', { type: 'info', message: 'Filters, keywords and refresh rate.' }); } },
            { label: 'Move left', icon: 'arrow-left', onClick: function () { move(sm, -1); } },
            { label: 'Move right', icon: 'arrow-right', onClick: function () { move(sm, 1); } },
            'sep',
            { label: 'Remove stream', icon: 'trash-2', danger: true, onClick: function () { removeStream(sm); } }
          ], { align: 'right' });
          return;
        }
        const f = findItem(t);
        if (!f.it) return;
        if (t.closest('[data-like]')) {
          const b = t.closest('[data-like]');
          f.it.liked = !f.it.liked; f.it.likes += f.it.liked ? 1 : -1;
          b.classList.toggle('liked', f.it.liked); b.setAttribute('aria-pressed', String(f.it.liked));
          f.iEl.querySelector('[data-likes]').textContent = f.it.likes;
        } else if (t.closest('[data-repost]')) {
          SL.toast('Reposted to ' + SL.NETWORKS[f.it.net].name, { action: { label: 'Undo', onClick: function () {} } });
        } else if (t.closest('[data-reply]')) {
          let box = f.iEl.querySelector('.reply-box');
          if (box) { box.remove(); return; }
          box = SL.h('<form class="reply-box"><label class="sr-only" for="r-' + f.it.id + '">Reply to ' + SL.esc(f.it.name) + '</label><textarea class="textarea" id="r-' + f.it.id + '">' + SL.esc(f.it.handle.indexOf('@') === 0 ? f.it.handle + ' ' : '') + '</textarea>' +
            '<div class="row"><button class="btn btn-soft btn-sm" type="button" data-aisug>' + SL.icon('sparkles', 14) + 'Suggest</button><span class="grow"></span><button class="btn btn-ghost btn-sm" type="button" data-cancel>Cancel</button><button class="btn btn-primary btn-sm" type="submit">' + SL.icon('send', 14) + 'Reply</button></div></form>');
          f.iEl.appendChild(box);
          const ta = box.querySelector('textarea'); ta.focus(); ta.selectionStart = ta.value.length;
          box.querySelector('[data-cancel]').addEventListener('click', function () { box.remove(); });
          box.querySelector('[data-aisug]').addEventListener('click', function () { ta.value = (f.it.handle.indexOf('@') === 0 ? f.it.handle + ' ' : '') + 'Thank you so much! This made our whole team smile. See you at the bar soon.'; ta.focus(); });
          box.addEventListener('submit', function (ev) {
            ev.preventDefault();
            if (!ta.value.trim()) { ta.setAttribute('aria-invalid', 'true'); ta.focus(); return; }
            f.it.replies++; box.remove();
            f.iEl.querySelectorAll('.act-count')[0].textContent = f.it.replies;
            SL.toast('Reply sent', { message: 'Posted on ' + SL.NETWORKS[f.it.net].name + ' as ' + SL.data.brand.name + '.' });
          });
        } else if (t.closest('[data-assign]')) {
          const b = t.closest('[data-assign]');
          SL.menu(b, [{ heading: 'Assign to' }].concat(SL.data.team.map(function (m) {
            return { html: '<span class="avatar avatar-xs"><img src="' + m.avatar + '" alt=""></span><span class="grow">' + SL.esc(m.name) + '</span>', onClick: function () { SL.toast('Assigned to ' + m.name, { message: 'It is now in their Inbox queue.' }); } };
          })), { align: 'right', width: 220 });
        } else if (t.closest('[data-more]')) {
          SL.menu(t.closest('[data-more]'), [
            { label: 'Open in Inbox', icon: 'inbox', onClick: function () { SL.go('#/inbox'); } },
            { label: 'Save to library', icon: 'bookmark', onClick: function () { SL.toast('Saved to library', { message: 'Find it under Saved posts.' }); } },
            { label: 'Copy link', icon: 'link', onClick: function () { SL.toast('Link copied', { type: 'info', duration: 2000 }); } },
            { label: 'Hide from stream', icon: 'eye', onClick: function () { f.iEl.remove(); f.s.items.splice(f.s.items.indexOf(f.it), 1); } }
          ], { align: 'right' });
        }
      });

      function streamOf(node) { const id = node.closest('[data-stream]').getAttribute('data-stream'); const arr = boards[boardIdx].streams; return { arr: arr, i: arr.findIndex(function (s) { return s.id === id; }) }; }
      function move(node, dir) {
        const r = streamOf(node); const j = r.i + dir; if (j < 0 || j >= r.arr.length) return;
        const tmp = r.arr[r.i]; r.arr[r.i] = r.arr[j]; r.arr[j] = tmp; draw();
      }
      function removeStream(node) {
        const r = streamOf(node); const s = r.arr[r.i];
        r.arr.splice(r.i, 1); draw();
        SL.toast('Stream removed', { action: { label: 'Undo', onClick: function () { r.arr.splice(r.i, 0, s); draw(); } } });
      }
      function addStream() {
        const types = [['mentions', 'at-sign', 'Mentions', 'Every time someone tags you'], ['hashtag', 'hash', 'Hashtag or keyword', 'Track conversations by topic'], ['comments', 'message-circle', 'Comments', 'Replies on your posts'], ['competitor', 'target', 'Competitor', 'Follow another brand’s posts']];
        let net = 'instagram', type = 'hashtag';
        SL.modal({
          title: 'Add a stream', subtitle: 'Streams update in real time. You can rearrange them any time.', width: 560,
          body: '<fieldset><legend class="label" style="margin-bottom:8px">Network</legend><div class="row wrap" id="asNet">' + ['instagram', 'x', 'linkedin', 'facebook', 'tiktok'].map(function (n, i) {
              return '<button type="button" class="chip" data-n="' + n + '" aria-pressed="' + (i === 0) + '">' + SL.netBadge(n, 16) + SL.NETWORKS[n].name + '</button>';
            }).join('') + '</div></fieldset>' +
            '<fieldset style="margin-top:18px"><legend class="label" style="margin-bottom:8px">Stream type</legend><div class="grid grid-1-1" id="asType" style="gap:10px">' + types.map(function (t, i) {
              return '<button type="button" class="sched-opt' + (t[0] === type ? ' is-selected' : '') + '" data-t="' + t[0] + '" aria-pressed="' + (t[0] === type) + '">' + SL.icon(t[1], 18) + '<span><b>' + t[2] + '</b><span>' + t[3] + '</span></span></button>';
            }).join('') + '</div></fieldset>' +
            '<div class="field" style="margin-top:18px"><label class="label" for="asQuery">Keyword or hashtag <span class="req" aria-hidden="true">*</span></label><input class="input" id="asQuery" placeholder="#AIAgents" value="#AIAgents" aria-required="true"><span class="hint">Separate multiple terms with commas.</span></div>',
          foot: '<button class="btn btn-secondary" data-close type="button">Cancel</button><button class="btn btn-primary" type="button" data-ok>Add stream</button>',
          onMount: function (m, l) {
            m.querySelector('#asNet').addEventListener('click', function (e) { const b = e.target.closest('[data-n]'); if (!b) return; net = b.getAttribute('data-n'); SL.$$('[data-n]', m).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); });
            m.querySelector('#asType').addEventListener('click', function (e) { const b = e.target.closest('[data-t]'); if (!b) return; type = b.getAttribute('data-t'); SL.$$('[data-t]', m).forEach(function (x) { x.classList.toggle('is-selected', x === b); x.setAttribute('aria-pressed', String(x === b)); }); });
            m.querySelector('[data-ok]').addEventListener('click', function () {
              const q = m.querySelector('#asQuery');
              if (!q.value.trim()) { q.setAttribute('aria-invalid', 'true'); q.focus(); return; }
              const id = 's' + Date.now();
              boards[boardIdx].streams.push({ id: id, title: q.value.trim(), net: net, handle: types.find(function (t) { return t[0] === type; })[2], kind: type, items: (boards[0].streams[2].items).map(function (x) { return Object.assign({}, x, { id: x.id + id, net: net }); }) });
              l.close(true); draw();
              const s = el.querySelector('[data-stream="' + id + '"]'); if (s) s.scrollIntoView({ inline: 'end', behavior: 'smooth', block: 'nearest' });
              SL.toast('Stream added', { message: q.value.trim() + ' on ' + SL.NETWORKS[net].name });
            });
          }
        });
      }
    }
  };
})(window.SL);
