/* Inbox — unified conversations across every network */
(function (SL) {
  'use strict';
  SL.views = SL.views || {};
  const st = { tab: 'open', type: '', q: '' };

  function sentBadge(s) {
    if (s === 'positive') return '<span class="badge badge-success">' + SL.icon('thumbs-up', 12) + 'Positive</span>';
    if (s === 'negative') return '<span class="badge badge-danger">' + SL.icon('thumbs-down', 12) + 'Negative</span>';
    return '<span class="badge">' + SL.icon('circle-dot', 12) + 'Neutral</span>';
  }
  const savedReplies = [
    { name: 'Thanks for the love', text: 'Thank you! This made the whole team’s day. We would love to hear what you build next.' },
    { name: 'Incident: we’re on it', text: 'We are sorry about this. Our engineers are on it right now; live updates are at status.nexora.io and we will follow up here.' },
    { name: 'Enterprise enquiry', text: 'Thanks for reaching out! Our enterprise team will email you within one business day to set up a call and a pilot workspace.' },
    { name: 'SSO support', text: 'Yes! Flow supports SAML SSO with Okta, Azure AD and Google Workspace on Business and Enterprise plans.' }
  ];
  const aiReplies = {
    c1: 'Yes, it does! Flow 3.0 supports SAML SSO with Okta, Azure AD and Google Workspace on Business and Enterprise plans. Setup takes about ten minutes: nexora.io/docs/sso',
    c2: 'Hi Vikram, we are sorry. The API returned elevated 503 errors between 9:02 and 9:24 AM IST; it is resolved and your nightly sync will retry automatically. The incident report is at status.nexora.io. DM us if anything still looks off.',
    c3: 'Hi Neha, thank you for thinking of us! Our partnerships lead, Priya Nair, would love to chat. Could you share a good time this week? We can also bring a tasting kit to your office.'
  };

  function filtered() {
    return SL.data.conversations.filter(function (c) {
      if (st.tab === 'open' && c.status !== 'open') return false;
      if (st.tab === 'mine' && (c.assignee !== 'u1' || c.status !== 'open')) return false;
      if (st.tab === 'unassigned' && (c.assignee || c.status !== 'open')) return false;
      if (st.tab === 'resolved' && c.status !== 'resolved') return false;
      if (st.type && c.type !== st.type) return false;
      if (st.q) { const q = st.q.toLowerCase(); if ((c.name + ' ' + c.handle + ' ' + c.messages.map(function (m) { return m.text; }).join(' ')).toLowerCase().indexOf(q) < 0) return false; }
      return true;
    }).sort(function (a, b) { return (b.priority - a.priority) || (new Date(b.time) - new Date(a.time)); });
  }

  SL.views.inbox = {
    title: 'Inbox',
    sub: 'Every comment, mention and message in one queue',
    cls: 'view-inbox',
    render: function (el, params) {
      let activeId = params[0] || null;

      function listHTML() {
        const items = filtered();
        if (!items.length) return '<div class="empty"><div class="empty-icon">' + SL.icon('check-check', 22) + '</div><h3>' + (st.q ? 'No matches' : 'Inbox zero') + '</h3><p>' + (st.q ? 'Try another name or keyword.' : 'Every conversation in this view has been handled. Nice work.') + '</p></div>';
        return items.map(function (c) {
          const last = c.messages[c.messages.length - 1];
          const who = c.assignee ? SL.data.member(c.assignee) : null;
          return '<button type="button" class="ib-item' + (c.unread ? ' is-unread' : '') + '" data-c="' + c.id + '" aria-current="' + (c.id === activeId) + '">' +
            '<span class="avatar">' + '<img src="' + c.avatar + '" alt="">' + SL.netBadge(c.net, 16) + '</span>' +
            '<span class="ib-item-main"><span class="ib-item-top">' + (c.unread ? '<span class="unread-dot" aria-label="Unread"></span>' : '') + '<span class="ib-name truncate">' + SL.esc(c.name) + '</span>' +
            (c.priority ? '<span class="text-danger" title="Priority">' + SL.icon('flag', 12) + '</span>' : '') + '<span class="ib-time">' + SL.fmt.ago(c.time) + '</span></span>' +
            '<span class="ib-preview clamp-2">' + (last.from === 'us' ? 'You: ' : '') + SL.esc(last.text) + '</span>' +
            '<span class="ib-tags"><span class="badge badge-outline">' + c.type + '</span>' + sentBadge(c.sentiment) +
            (who ? '<span class="badge badge-outline"><span class="avatar" style="--av:14px"><img src="' + who.avatar + '" alt=""></span>' + SL.esc(who.name.split(' ')[0]) + '</span>' : '') + '</span></span></button>';
        }).join('');
      }

      function threadHTML(c) {
        if (!c) return '<div class="ib-empty"><div class="empty"><div class="empty-icon">' + SL.icon('message-square', 22) + '</div><h3>Pick a conversation</h3><p>Select a message on the left to read it, reply, assign it, or close it out.</p></div></div>';
        const who = c.assignee ? SL.data.member(c.assignee) : null;
        let msgs = '';
        if (c.context) msgs += '<div class="ib-context"><img src="' + c.context.media + '" alt=""><span>Comment on your post: <b>' + SL.esc(c.context.text) + '</b></span></div>';
        let lastDay = '';
        c.messages.forEach(function (m) {
          const day = SL.fmt.date(m.time, { weekday: 'long', month: 'short', day: 'numeric' });
          if (day !== lastDay) { msgs += '<div class="day-sep">' + day + '</div>'; lastDay = day; }
          const by = m.by ? SL.data.member(m.by) : null;
          msgs += '<div class="msg ' + m.from + '">' +
            (m.from === 'them' ? '<span class="avatar avatar-sm"><img src="' + c.avatar + '" alt=""></span>' : '<span class="avatar avatar-sm"><img src="' + (by || SL.data.user).avatar + '" alt=""></span>') +
            '<div><div class="msg-bubble">' + SL.esc(m.text) + '</div><div class="msg-meta">' + (m.from === 'us' ? SL.esc((by || SL.data.user).name) + ' · ' : '') + SL.fmt.time(m.time) + '</div></div></div>';
        });
        return '<div class="ib-thread-head">' +
            '<button class="icon-btn ib-back" type="button" data-back aria-label="Back to conversations">' + SL.icon('arrow-left', 20) + '</button>' +
            '<span class="avatar avatar-md"><img src="' + c.avatar + '" alt="">' + SL.netBadge(c.net, 16) + '</span>' +
            '<div class="grow" style="min-width:0"><div class="fw-700 truncate">' + SL.esc(c.name) + '</div><div class="text-xs text-muted truncate">' + SL.esc(c.handle) + ' · ' + c.type + ' on ' + SL.NETWORKS[c.net].name + '</div></div>' +
            '<button class="btn btn-secondary btn-sm" type="button" data-assign aria-haspopup="menu" aria-label="' + (who ? 'Assigned to ' + SL.esc(who.name) + '. Change assignee' : 'Assign conversation') + '">' + (who ? '<span class="avatar avatar-xs" style="--av:20px"><img src="' + who.avatar + '" alt=""></span><span class="btn-label">' + SL.esc(who.name.split(' ')[0]) + '</span>' : SL.icon('user-plus', 16) + '<span class="btn-label">Assign</span>') + '</button>' +
            (c.status === 'open' ? '<button class="btn btn-primary btn-sm" type="button" data-resolve aria-label="Resolve conversation">' + SL.icon('check', 16) + '<span class="btn-label">Resolve</span></button>' : '<button class="btn btn-secondary btn-sm" type="button" data-reopen aria-label="Reopen conversation">' + SL.icon('rotate-ccw', 16) + '<span class="btn-label">Reopen</span></button>') +
            '<button class="icon-btn" type="button" data-tmenu aria-label="More conversation actions">' + SL.icon('ellipsis', 18) + '</button>' +
          '</div>' +
          '<div class="ib-messages" id="ibMsgs" aria-live="polite">' + msgs + '</div>' +
          '<form class="ib-composer" id="ibForm">' +
            '<label class="sr-only" for="ibReply">Reply to ' + SL.esc(c.name) + '</label>' +
            '<textarea id="ibReply" placeholder="Reply to ' + SL.esc(c.name.split(' ')[0]) + ' on ' + SL.NETWORKS[c.net].name + '…"></textarea>' +
            '<div class="ib-composer-bar">' +
              '<button class="btn btn-soft btn-sm" type="button" data-aireply>' + SL.icon('sparkles', 14) + 'Suggest reply</button>' +
              '<button class="btn btn-ghost btn-sm" type="button" data-saved aria-haspopup="menu" aria-label="Saved replies">' + SL.icon('bookmark', 14) + '<span class="btn-label">Saved replies</span></button>' +
              '<button class="icon-btn icon-btn-sm" type="button" aria-label="Attach image" data-tip="Attach">' + SL.icon('paperclip', 16) + '</button>' +
              '<span class="grow"></span>' +
              '<span class="text-xs text-muted kbd-hint">Enter to send · Shift+Enter for new line</span>' +
              '<button class="btn btn-primary btn-sm" type="submit">' + SL.icon('send', 14) + 'Send</button>' +
            '</div>' +
          '</form>';
      }

      function profileHTML(c) {
        if (!c) return '';
        const p = c.profile;
        return '<span class="avatar"><img src="' + c.avatar + '" alt=""></span>' +
          '<div class="ib-profile-name"><div class="h5">' + SL.esc(c.name) + '</div><div class="text-sm text-muted">' + SL.esc(c.handle) + '</div></div>' +
          '<div class="ib-profile-stats"><div><b>' + SL.fmt.compact(p.followers) + '</b><span>Followers</span></div><div><b>' + (p.seats ? SL.fmt.num(p.seats) : '—') + '</b><span>Seats</span></div></div>' +
          '<div class="ib-section"><h4>Details</h4><dl class="kv" style="grid-template-columns:80px 1fr">' +
            '<dt>Location</dt><dd>' + SL.esc(p.location) + '</dd><dt>Status</dt><dd>' + SL.esc(p.since) + '</dd><dt>Sentiment</dt><dd>' + sentBadge(c.sentiment) + '</dd></dl></div>' +
          '<div class="ib-section"><h4>Tags</h4><div class="tagset">' + c.tags.map(function (t) { return '<span class="badge badge-brand">' + SL.esc(t) + '</span>'; }).join('') + '<button class="badge badge-outline" type="button" data-addtag>' + SL.icon('plus', 12) + 'Add</button></div></div>' +
          '<div class="ib-section"><h4>Internal note</h4><label class="sr-only" for="ibNote">Internal note</label><textarea class="textarea" id="ibNote" style="min-height:84px;font-size:13px" placeholder="Only your team can see this">' + SL.esc(p.notes) + '</textarea></div>' +
          '<div class="ib-section"><h4>Recent activity</h4><ul class="stack-3 text-sm">' +
            '<li class="row">' + SL.icon('heart', 14) + '<span class="text-2">Liked 6 of your posts this month</span></li>' +
            '<li class="row">' + SL.icon('message-circle', 14) + '<span class="text-2">' + (c.messages.length + 2) + ' past conversations</span></li>' +
          '</ul></div>';
      }

      const drafts = {};   // unsent replies, kept per conversation while you switch between them
      const saveSoon = SL.debounce(function () { SL.data.save('conversations'); }, 400);
      function current() { return SL.data.conversations.find(function (x) { return x.id === activeId; }) || null; }
      function count(t) {
        return SL.data.conversations.filter(function (c2) {
          return t === 'open' ? c2.status === 'open' : t === 'mine' ? c2.assignee === 'u1' && c2.status === 'open' : t === 'unassigned' ? !c2.assignee && c2.status === 'open' : c2.status === 'resolved';
        }).length;
      }
      function tabsHTML() {
        return [['open', 'Open'], ['mine', 'Mine'], ['unassigned', 'Unassigned'], ['resolved', 'Resolved']].map(function (t) {
          return '<button class="tab" role="tab" type="button" data-tab="' + t[0] + '" aria-selected="' + (st.tab === t[0]) + '">' + t[1] + '<span class="count count-muted">' + count(t[0]) + '</span></button>';
        }).join('');
      }

      /* The layout is built once. After that only the part that changed is redrawn, so the list keeps
         its scroll position and switching conversations never rebuilds or re-animates the whole screen. */
      el.innerHTML = '<div class="inbox" id="ibRoot">' +
        '<section class="ib-list" aria-label="Conversations">' +
          '<div class="ib-list-head">' +
            '<div class="ib-filter-row"><div class="input-group">' + SL.icon('search', 16) + '<label class="sr-only" for="ibSearch">Search conversations</label><input class="input" id="ibSearch" placeholder="Search inbox" value="' + SL.esc(st.q) + '"></div>' +
            '<label class="sr-only" for="ibType">Filter by type</label><select class="select" id="ibType">' + [['', 'All types'], ['Comment', 'Comments'], ['Mention', 'Mentions'], ['DM', 'DMs'], ['Message', 'Messages'], ['Review', 'Reviews']].map(function (t) {
              return '<option value="' + t[0] + '"' + (st.type === t[0] ? ' selected' : '') + '>' + t[1] + '</option>';
            }).join('') + '</select></div>' +
            '<div class="tabs" role="tablist" aria-label="Queues" id="ibTabs">' + tabsHTML() + '</div>' +
          '</div>' +
          '<div class="ib-items" id="ibItems"></div>' +
        '</section>' +
        '<section class="ib-thread" id="ibThread" aria-label="Conversation"></section>' +
        '<aside class="ib-profile" id="ibProfile"></aside>' +
      '</div>';
      const root = SL.$('#ibRoot', el), itemsEl = SL.$('#ibItems', el), threadEl = SL.$('#ibThread', el), profileEl = SL.$('#ibProfile', el);

      function renderTabs() { SL.$('#ibTabs', el).innerHTML = tabsHTML(); }
      function renderList(resetScroll) {
        const top = itemsEl.scrollTop;
        itemsEl.innerHTML = listHTML();
        itemsEl.scrollTop = resetScroll ? 0 : top;
      }
      function markActive() {
        SL.$$('.ib-item', itemsEl).forEach(function (b) {
          const on = b.getAttribute('data-c') === activeId;
          b.setAttribute('aria-current', String(on));
          if (on) { b.classList.remove('is-unread'); const d = b.querySelector('.unread-dot'); if (d) d.remove(); }
        });
      }
      function revealActive() {
        const a = itemsEl.querySelector('[aria-current="true"]');
        if (a) a.scrollIntoView({ block: 'nearest' });
      }
      function crossfade(node) {
        node.classList.remove('is-switching'); void node.offsetWidth; node.classList.add('is-switching');
        setTimeout(function () { node.classList.remove('is-switching'); }, 260);
      }
      function renderThread() {
        const c = current();
        root.classList.toggle('has-active', !!c);
        root.classList.toggle('no-active', !c);
        threadEl.innerHTML = threadHTML(c);
        const msgs = SL.$('#ibMsgs', threadEl); if (msgs) msgs.scrollTop = msgs.scrollHeight;
        bindThread(c);
      }
      function renderProfile() {
        const c = current();
        profileEl.innerHTML = profileHTML(c);
        if (c) { profileEl.setAttribute('aria-label', 'Customer profile'); profileEl.removeAttribute('aria-hidden'); }
        else { profileEl.removeAttribute('aria-label'); profileEl.setAttribute('aria-hidden', 'true'); }
        const note = SL.$('#ibNote', profileEl);
        if (note) note.addEventListener('input', function () { c.profile.notes = note.value; saveSoon(); });
      }
      function select(id, opts) {
        opts = opts || {};
        activeId = id || null;
        history.replaceState(null, '', '#/inbox' + (activeId ? '/' + activeId : ''));
        const c = current();
        if (c && c.unread) { c.unread = false; SL.data.save('conversations'); SL.updateCounts(); }
        markActive();
        renderThread();
        renderProfile();
        if (opts.fade) { crossfade(threadEl); crossfade(profileEl); }
        const r = SL.$('#ibReply', threadEl);
        if (r && opts.focus && window.innerWidth > 767) r.focus({ preventScroll: true });
      }

      function bindThread(c) {
        if (!c) return;
        const form = SL.$('#ibForm', threadEl), ta = SL.$('#ibReply', threadEl);
        ta.value = drafts[c.id] || '';
        ta.addEventListener('input', function () { drafts[c.id] = ta.value; });
        ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          const v = ta.value.trim();
          if (!v) { ta.focus(); SL.toast('Write a reply first', { type: 'error', duration: 2400 }); return; }
          c.messages.push({ from: 'us', text: v, time: new Date().toISOString(), by: 'u1' });
          c.time = new Date().toISOString();
          if (!c.assignee) c.assignee = 'u1';
          delete drafts[c.id];
          SL.data.save('conversations');
          renderTabs(); renderList(); renderThread(); renderProfile();
          SL.toast('Reply sent', { message: 'Posted on ' + SL.NETWORKS[c.net].name + ' as ' + SL.data.brand.name + '.', action: { label: 'Resolve', onClick: function () { resolve(c); } } });
        });
      }

      function resolve(c) {
        c.status = 'resolved'; c.unread = false; SL.data.save('conversations'); SL.updateCounts();
        renderTabs(); renderList();
        const next = filtered()[0];
        select(next ? next.id : null, { fade: true });
        SL.toast('Conversation resolved', { action: { label: 'Undo', onClick: function () {
          c.status = 'open'; SL.data.save('conversations'); SL.updateCounts(); renderTabs(); renderList(); select(c.id, { fade: true });
        } } });
      }

      el.addEventListener('click', function (e) {
        const t = e.target;
        const it = t.closest('[data-c]');
        if (it) { const id = it.getAttribute('data-c'); if (id !== activeId) select(id, { fade: true, focus: true }); return; }
        const tab = t.closest('[data-tab]');
        if (tab) { st.tab = tab.getAttribute('data-tab'); renderTabs(); renderList(true); return; }
        if (t.closest('[data-back]')) { select(null); return; }
        const c = current();
        if (!c) return;
        if (t.closest('[data-resolve]')) resolve(c);
        else if (t.closest('[data-reopen]')) { c.status = 'open'; SL.data.save('conversations'); SL.updateCounts(); renderTabs(); renderList(); renderThread(); SL.toast('Conversation reopened', { type: 'info' }); }
        else if (t.closest('[data-assign]')) {
          const assign = function (id, name) {
            c.assignee = id; SL.data.save('conversations'); renderTabs(); renderList(); renderThread();
            if (name) SL.toast('Assigned to ' + name, { type: 'info', duration: 2400 });
          };
          SL.menu(t.closest('[data-assign]'), [{ heading: 'Assign to' }].concat(SL.data.team.map(function (m) {
            return { html: '<span class="avatar avatar-xs"><img src="' + m.avatar + '" alt=""></span><span class="col" style="line-height:1.2"><span>' + SL.esc(m.name) + '</span><span class="text-xs text-muted">' + m.role + '</span></span>', checked: c.assignee === m.id, onClick: function () { assign(m.id, m.name); } };
          })).concat(['sep', { label: 'Unassign', icon: 'x', onClick: function () { assign(null); } }]), { align: 'right', width: 250 });
        }
        else if (t.closest('[data-tmenu]')) {
          SL.menu(t.closest('[data-tmenu]'), [
            { label: c.priority ? 'Remove priority' : 'Mark as priority', icon: 'flag', onClick: function () { c.priority = !c.priority; SL.data.save('conversations'); renderList(); } },
            { label: 'Mark as unread', icon: 'mail', onClick: function () { c.unread = true; SL.data.save('conversations'); SL.updateCounts(); activeId = null; renderList(); select(null); } },
            { label: 'View on ' + SL.NETWORKS[c.net].name, icon: 'external-link', onClick: function () { SL.toast('Opens the original ' + c.type.toLowerCase() + ' on ' + SL.NETWORKS[c.net].name, { type: 'info' }); } },
            'sep',
            { label: 'Block ' + c.name.split(' ')[0], icon: 'circle-x', danger: true, onClick: function () { SL.confirm({ title: 'Block ' + c.name + '?', message: 'They will not be able to message or tag ' + SL.data.brand.name + ' on ' + SL.NETWORKS[c.net].name + '.', confirm: 'Block', danger: true, onConfirm: function () { SL.toast(c.name + ' blocked', { type: 'info' }); } }); } }
          ], { align: 'right' });
        }
        else if (t.closest('[data-saved]')) {
          SL.menu(t.closest('[data-saved]'), [{ heading: 'Saved replies' }].concat(savedReplies.map(function (r) {
            return { label: r.name, icon: 'text-quote', onClick: function () { const ta = SL.$('#ibReply', threadEl); ta.value = r.text; drafts[c.id] = r.text; ta.focus(); } };
          })), { width: 260 });
        }
        else if (t.closest('[data-aireply]')) {
          const ta = SL.$('#ibReply', threadEl), b = t.closest('[data-aireply]');
          b.disabled = true; ta.value = ''; ta.placeholder = '';
          const typing = SL.h('<span class="typing" aria-label="Starling AI is writing" style="position:absolute;margin:18px 16px"><span></span><span></span><span></span></span>');
          ta.parentNode.insertBefore(typing, ta);
          const text = aiReplies[c.id] || savedReplies[0].text;
          setTimeout(function () {
            typing.remove();
            let i = 0;
            (function tick() { i += 3; ta.value = text.slice(0, i); if (i < text.length) setTimeout(tick, 14); else { b.disabled = false; drafts[c.id] = ta.value; if (ta.isConnected) ta.focus(); } })();
          }, 700);
        }
        else if (t.closest('[data-addtag]')) {
          SL.menu(t.closest('[data-addtag]'), ['VIP', 'Follow up', 'Creator', 'Enterprise', 'Bug'].map(function (tg) {
            return { label: tg, icon: 'tag', onClick: function () { if (c.tags.indexOf(tg) < 0) c.tags.push(tg); SL.data.save('conversations'); renderProfile(); } };
          }));
        }
      });

      SL.$('#ibType', el).addEventListener('change', function () { st.type = this.value; renderList(true); });
      const search = SL.$('#ibSearch', el);
      search.addEventListener('input', SL.debounce(function () { st.q = search.value; renderList(true); }, 150));

      renderList(true);
      select(activeId);
      revealActive();
      // A link to another conversation while the Inbox is open swaps only the conversation
      SL.views.inbox.update = function (p) {
        const id = p[0] || null;
        if (id !== activeId) { select(id, { fade: true }); revealActive(); }
        return true;
      };
    }
  };
})(window.SL);
