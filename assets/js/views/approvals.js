/* Approvals — review queue and team workflow */
(function (SL) {
  'use strict';
  SL.views = SL.views || {};

  SL.views.approvals = {
    title: 'Approvals',
    sub: 'Review content before it goes live',
    render: function (el) {
      function draw() {
        const queue = SL.data.posts.filter(function (p) { return p.status === 'approval'; }).sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
        const recent = SL.data.posts.filter(function (p) { return p.status === 'scheduled' && new Date(p.date) > new Date(); }).slice(0, 3);

        el.innerHTML =
          '<div class="page-head"><div><h2>Waiting for review</h2><p>' + (queue.length ? queue.length + ' post' + (queue.length > 1 ? 's need' : ' needs') + ' a decision. The first is due to go out ' + SL.longWhen(queue[0].date) + '.' : 'You are all caught up.') + '</p></div>' +
          '<div class="page-actions"><button class="btn btn-secondary btn-sm" type="button" data-approve-all' + (queue.length ? '' : ' disabled') + '>' + SL.icon('check-check', 16) + 'Approve all</button></div></div>' +
          '<div class="grid grid-2-1">' +
            '<section class="stack-4" aria-label="Approval queue">' + (queue.length ? queue.map(function (p) {
              const a = SL.data.member(p.author);
              return '<article class="card appr" data-id="' + p.id + '">' +
                (p.media[0] ? '<img class="appr-media" src="' + p.media[0] + '" alt="">' : '<div class="appr-media" style="background:var(--surface-2)"></div>') +
                '<div class="appr-body">' +
                  '<div class="row wrap"><span class="avatar avatar-xs"><img src="' + a.avatar + '" alt=""></span><span class="text-sm"><b>' + SL.esc(a.name) + '</b> <span class="text-muted">requested review</span></span>' +
                    '<span class="ml-auto">' + SL.channelBadges(p.channels, 20) + '</span></div>' +
                  '<p class="clamp-3" style="line-height:1.55">' + SL.esc(p.text) + '</p>' +
                  (p.note ? '<div class="appr-note">' + SL.icon('message-square', 16) + '<span>' + SL.esc(p.note) + '</span></div>' : '') +
                  '<div class="row wrap text-sm text-muted">' + SL.icon('calendar-clock', 14) + SL.longWhen(p.date) + (p.campaign ? '<span class="badge badge-brand">' + SL.esc(p.campaign) + '</span>' : '') + '</div>' +
                  '<div class="appr-actions">' +
                    '<button class="btn btn-primary btn-sm" type="button" data-approve>' + SL.icon('check', 16) + 'Approve</button>' +
                    '<button class="btn btn-secondary btn-sm" type="button" data-changes>' + SL.icon('pencil', 16) + 'Request changes</button>' +
                    '<button class="btn btn-ghost btn-sm" type="button" data-preview>' + SL.icon('eye', 16) + 'Preview</button>' +
                  '</div>' +
                '</div></article>';
            }).join('') : '<div class="card empty"><div class="empty-icon">' + SL.icon('badge-check', 22) + '</div><h3>Nothing to review</h3><p>When teammates send posts for approval they will show up here, and you will get a notification.</p><a class="btn btn-secondary" href="#/planner">Open planner</a></div>') + '</section>' +

            '<aside class="stack-4">' +
              '<div class="card"><div class="card-head"><h3>Approval workflow</h3><button class="btn btn-ghost btn-sm ml-auto" type="button" data-editflow>Edit</button></div><div class="card-body"><div class="flow">' +
                [['square-pen', 'Draft', 'Contributors and editors create posts'], ['badge-check', 'Brand review', 'Priya Nair approves campaign posts'], ['calendar-clock', 'Scheduled', 'Publishes at the chosen time'], ['chart-column', 'Report', 'Results land in Analytics']].map(function (s) {
                  return '<div class="flow-step"><span class="flow-dot">' + SL.icon(s[0], 16) + '</span><div><b class="text-sm">' + s[1] + '</b><p class="text-sm text-muted">' + s[2] + '</p></div></div>';
                }).join('') + '</div></div></div>' +
              '<div class="card"><div class="card-head"><h3>Team</h3><button class="btn btn-soft btn-sm ml-auto" type="button" data-invite>' + SL.icon('user-plus', 14) + 'Invite</button></div><div class="card-body" style="padding-top:8px"><ul class="channel-list">' +
                SL.data.team.map(function (m) {
                  return '<li><span class="avatar' + (m.id === 'u1' || m.id === 'u4' ? ' presence' : '') + '"><img src="' + m.avatar + '" alt=""></span><span class="grow"><b class="text-sm" style="display:block">' + SL.esc(m.name) + '</b><span class="text-xs text-muted">' + m.role + '</span></span><span class="badge' + (m.access === 'Approver' ? ' badge-warning' : m.access === 'Admin' ? ' badge-brand' : '') + '">' + m.access + '</span></li>';
                }).join('') + '</ul></div></div>' +
              (recent.length ? '<div class="card"><div class="card-head"><h3>Recently approved</h3></div><div class="card-body" style="padding-top:8px">' + recent.map(function (p) {
                return '<div class="mini-convo" role="button" tabindex="0" data-open="' + p.id + '" style="cursor:pointer">' + (p.media[0] ? '<img class="thumb" src="' + p.media[0] + '" alt="">' : '') + '<span class="grow"><p class="clamp-2">' + SL.esc(p.text) + '</p><span class="text-xs text-muted">' + SL.longWhen(p.date) + '</span></span></div>';
              }).join('') + '</div></div>' : '') +
            '</aside>' +
          '</div>';
      }

      function post(node) { const c = node.closest('[data-id]'); return c && SL.data.posts.find(function (p) { return p.id === c.getAttribute('data-id'); }); }
      function approve(p) {
        p.status = 'scheduled'; delete p.note; SL.data.save('posts'); SL.updateCounts(); draw();
        SL.toast('Approved', { message: 'Scheduled for ' + SL.longWhen(p.date) + '.', action: { label: 'Undo', onClick: function () { p.status = 'approval'; SL.data.save('posts'); SL.updateCounts(); draw(); } } });
      }

      el.addEventListener('click', function (e) {
        const t = e.target;
        const op = t.closest('[data-open]'); if (op) { SL.openPost(op.getAttribute('data-open')); return; }
        if (t.closest('[data-approve-all]')) {
          const q = SL.data.posts.filter(function (p) { return p.status === 'approval'; });
          SL.confirm({ title: 'Approve all ' + q.length + ' posts?', message: 'They will be scheduled at their planned times.', confirm: 'Approve all', onConfirm: function () { q.forEach(function (p) { p.status = 'scheduled'; }); SL.data.save('posts'); SL.updateCounts(); draw(); SL.toast(q.length + ' posts approved'); } });
          return;
        }
        if (t.closest('[data-invite]')) {
          SL.modal({
            title: 'Invite teammates', subtitle: 'They will get an email invitation to the Nexora workspace.', width: 520,
            body: '<div class="stack-4"><div class="field"><label class="label" for="invE">Email addresses <span class="req" aria-hidden="true">*</span></label><input class="input" id="invE" type="email" multiple autocomplete="off" placeholder="name@nexora.io" autofocus aria-required="true" aria-describedby="invErr"><span class="field-error" id="invErr" hidden></span></div>' +
              '<div class="field"><label class="label" for="invR">Role</label><select class="select" id="invR"><option>Contributor: can draft posts</option><option>Editor: can schedule posts</option><option>Approver: can approve posts</option><option>Admin: full access</option></select></div></div>',
            foot: '<button class="btn btn-secondary" data-close type="button">Cancel</button><button class="btn btn-primary" type="button" data-ok>Send invites</button>',
            onMount: function (m, l) {
              const i = m.querySelector('#invE'), er = m.querySelector('#invErr');
              m.querySelector('[data-ok]').addEventListener('click', function () {
                const v = i.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
                const bad = v.filter(function (s) { return !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s); });
                if (!v.length || bad.length) { er.innerHTML = SL.icon('triangle-alert', 14) + (v.length ? 'Check ' + SL.esc(bad[0]) + ': it does not look like an email address.' : 'Enter at least one email address.'); er.hidden = false; i.setAttribute('aria-invalid', 'true'); i.focus(); return; }
                l.close(true); SL.toast(v.length + ' invite' + (v.length > 1 ? 's' : '') + ' sent', { message: 'Invites expire in 7 days.' });
              });
            }
          });
          return;
        }
        if (t.closest('[data-editflow]')) { SL.go('#/settings/team'); return; }
        const p = post(t); if (!p) return;
        if (t.closest('[data-approve]')) approve(p);
        else if (t.closest('[data-preview]')) SL.openPost(p.id);
        else if (t.closest('[data-changes]')) {
          const author = SL.data.member(p.author);
          SL.modal({
            title: 'Request changes', subtitle: SL.esc(author.name) + ' will be notified and the post returns to drafts.', width: 520,
            body: '<div class="field"><label class="label" for="rcNote">What should change? <span class="req" aria-hidden="true">*</span></label><textarea class="textarea" id="rcNote" autofocus aria-required="true" placeholder="e.g. Please add the registration link and swap the photo for the keynote one."></textarea><span class="field-error" id="rcErr" hidden></span></div>',
            foot: '<button class="btn btn-secondary" data-close type="button">Cancel</button><button class="btn btn-primary" type="button" data-ok>Send feedback</button>',
            onMount: function (m, l) {
              m.querySelector('[data-ok]').addEventListener('click', function () {
                const n = m.querySelector('#rcNote');
                if (!n.value.trim()) { const er = m.querySelector('#rcErr'); er.innerHTML = SL.icon('triangle-alert', 14) + 'Add a short note so ' + SL.esc(author.name.split(' ')[0]) + ' knows what to fix.'; er.hidden = false; n.setAttribute('aria-invalid', 'true'); n.focus(); return; }
                p.status = 'draft'; p.note = n.value.trim(); SL.data.save('posts'); SL.updateCounts(); l.close(true); draw();
                SL.toast('Feedback sent to ' + author.name, { message: 'The post moved back to drafts.' });
              });
            }
          });
        }
      });
      el.addEventListener('keydown', function (e) { const op = e.target.closest('[data-open]'); if (op && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); SL.openPost(op.getAttribute('data-open')); } });

      draw();
    }
  };
})(window.SL);
