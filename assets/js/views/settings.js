/* Settings */
(function (SL) {
  'use strict';
  SL.views = SL.views || {};
  const SECTIONS = [
    ['profile', 'user', 'Profile'], ['workspace', 'building-2', 'Workspace'], ['channels', 'link', 'Channels'], ['team', 'users', 'Team & roles'],
    ['notifications', 'bell', 'Notifications'], ['billing', 'credit-card', 'Plan & billing'], ['appearance', 'palette', 'Appearance']
  ];

  function section(title, desc, body, foot) {
    return '<section class="card"><div class="card-head"><div><h3>' + title + '</h3>' + (desc ? '<div class="sub">' + desc + '</div>' : '') + '</div></div>' +
      '<div class="card-body">' + body + '</div>' + (foot ? '<div class="card-foot row" style="justify-content:flex-end">' + foot + '</div>' : '') + '</section>';
  }

  const panes = {
    profile: function () {
      const u = SL.data.user;
      return section('Profile', 'How you appear to your team and in approval requests',
        '<div class="photo-row"><span class="avatar avatar-xl"><img src="' + u.avatar + '" alt=""></span><div class="col"><button class="btn btn-secondary btn-sm" type="button" data-fake="Photo updated">Change photo</button><span class="hint">JPG or PNG, at least 256 × 256 px.</span></div></div>' +
        '<form class="form-grid" id="profileForm" novalidate>' +
          '<div class="field"><label class="label" for="pfName">Full name</label><input class="input" id="pfName" value="' + u.name + '" autocomplete="name"></div>' +
          '<div class="field"><label class="label" for="pfRole">Job title</label><input class="input" id="pfRole" value="' + u.role + '" autocomplete="organization-title"></div>' +
          '<div class="field"><label class="label" for="pfEmail">Email</label><input class="input" id="pfEmail" type="email" value="' + u.email + '" autocomplete="email" aria-describedby="pfEmailErr"><span class="field-error" id="pfEmailErr" hidden></span></div>' +
          '<div class="field"><label class="label" for="pfTz">Time zone</label><select class="select" id="pfTz"><option>India Standard Time (IST)</option><option>Gulf Standard Time (GST)</option><option>London (GMT)</option><option>Pacific Time (US & Canada)</option></select></div>' +
        '</form>',
        '<button class="btn btn-ghost" type="button" data-reset-form>Cancel</button><button class="btn btn-primary" type="button" data-save-profile>Save changes</button>');
    },
    workspace: function () {
      return section('Workspace', 'Shared settings for everyone in Nexora',
        '<div class="form-grid">' +
          '<div class="field"><label class="label" for="wsName">Workspace name</label><input class="input" id="wsName" value="Nexora"></div>' +
          '<div class="field"><label class="label" for="wsUrl">Website</label><input class="input" id="wsUrl" type="url" value="https://nexora.io"></div>' +
          '<div class="field"><label class="label" for="wsInd">Industry</label><select class="select" id="wsInd"><option>Software &amp; SaaS</option><option>Financial services</option><option>Healthcare</option></select></div>' +
          '<div class="field"><label class="label" for="wsWeek">Week starts on</label><select class="select" id="wsWeek"><option>Monday</option><option>Sunday</option></select></div>' +
        '</div>' +
        '<div class="field" style="margin-top:16px"><label class="label" for="wsVoice">Brand voice for Starling AI</label><textarea class="textarea" id="wsVoice">Clear, confident and human. We explain complex AI simply, celebrate our customers and our people, avoid hype words like “revolutionary”, and use at most two hashtags on LinkedIn.</textarea><span class="hint">Starling AI uses this to keep drafts on-brand.</span></div>',
        '<button class="btn btn-primary" type="button" data-fake="Workspace saved">Save changes</button>');
    },
    channels: function () {
      return section('Connected channels', 'Manage the social profiles Starling can publish to and listen on',
        '<ul class="channel-list">' + SL.data.channels.map(function (c) {
          return '<li style="padding:14px 0">' + SL.netBadge(c.net, 40) + '<span class="grow"><b style="display:block">' + SL.esc(c.name) + '</b><span class="text-sm text-muted">' + SL.NETWORKS[c.net].name + ' · ' + SL.esc(c.handle) + ' · ' + SL.fmt.compact(c.followers) + ' followers</span></span>' +
            (c.connected ? '<span class="badge badge-success">' + SL.icon('circle-check', 12) + 'Connected</span><button class="btn btn-ghost btn-sm" type="button" data-disconnect="' + c.id + '">Disconnect</button>'
              : '<span class="badge badge-warning">' + SL.icon('triangle-alert', 12) + 'Needs reconnect</span><button class="btn btn-primary btn-sm" type="button" data-connect="' + c.id + '">Reconnect</button>') + '</li>';
        }).join('') + '</ul>',
        '<span class="text-sm text-muted grow">Growth plan includes up to 10 channels.</span><button class="btn btn-secondary" type="button" data-addch>' + SL.icon('plus', 16) + 'Add channel</button>');
    },
    team: function () {
      return section('Team & roles', 'Who can draft, schedule and approve',
        '<div class="data-table-wrap"><table class="table"><thead><tr><th>Member</th><th>Role</th><th>Access</th><th><span class="sr-only">Actions</span></th></tr></thead><tbody>' + SL.data.team.map(function (m) {
          return '<tr><td><span class="row"><span class="avatar avatar-sm"><img src="' + m.avatar + '" alt=""></span><span><b class="text-sm" style="display:block">' + SL.esc(m.name) + '</b><span class="text-xs text-muted">' + m.email + '</span></span></span></td>' +
            '<td class="text-sm">' + m.role + '</td><td><label class="sr-only" for="acc-' + m.id + '">Access for ' + SL.esc(m.name) + '</label><select class="select" id="acc-' + m.id + '" style="min-height:34px;width:auto"' + (m.id === 'u1' ? ' disabled' : '') + '>' + ['Admin', 'Approver', 'Editor', 'Contributor'].map(function (a) { return '<option' + (a === m.access ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></td>' +
            '<td class="num">' + (m.id === 'u1' ? '<span class="text-xs text-muted">You</span>' : '<button class="btn btn-danger-ghost btn-sm" type="button" data-remove="' + m.id + '">Remove</button>') + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<div class="set-row" style="margin-top:8px"><div class="grow"><b class="text-sm">Require approval for new contributors</b><p>Posts from Contributors must be approved by an Approver or Admin.</p></div><label class="switch"><input type="checkbox" checked aria-label="Require approval for contributors"></label></div>' +
        '<div class="set-row"><div class="grow"><b class="text-sm">Require approval for campaign posts</b><p>Any post tagged with a campaign goes to Brand review.</p></div><label class="switch"><input type="checkbox" checked aria-label="Require approval for campaign posts"></label></div>');
    },
    notifications: function () {
      const rows = [
        ['Mentions and DMs', 'When someone mentions or messages Nexora', true],
        ['Approval requests', 'When a teammate sends you a post to review', true],
        ['Publishing failures', 'When a post fails to publish (recommended)', true],
        ['Weekly performance digest', 'Every Monday at 8:00 AM', true],
        ['Listening spikes', 'When mentions rise 2× above normal', false],
        ['Product updates', 'New features and tips from Starling', false]
      ];
      return section('Notifications', 'Choose what reaches you, and where',
        rows.map(function (r, i) {
          return '<div class="set-row"><div class="grow"><b class="text-sm">' + r[0] + '</b><p>' + r[1] + '</p></div>' +
            '<label class="check text-sm"><input type="checkbox" checked> Email</label>' +
            '<label class="switch"><input type="checkbox"' + (r[2] ? ' checked' : '') + ' aria-label="' + r[0] + ' push notifications" data-notif="' + i + '"><span class="text-sm text-2">Push</span></label></div>';
        }).join(''));
    },
    billing: function () {
      return '<div class="stack-4"><div class="plan-card"><div class="row wrap" style="position:relative;z-index:1;gap:16px"><div class="grow"><span class="badge badge-brand" style="background:rgba(255,255,255,.12);color:#fff">Current plan</span><h3 style="margin-top:10px">Growth</h3><p>$99 per month, billed annually · renews Jan 14, 2027</p></div>' +
        '<button class="btn btn-gradient btn-pill" type="button" data-fake="Our team will reach out about Enterprise">Upgrade to Enterprise</button></div></div>' +
        section('Usage this month', '',
          [['Channels', 7, 10], ['Team seats', 5, 10], ['Scheduled posts', 186, 'Unlimited'], ['Starling AI credits', 640, 1000]].map(function (u) {
            const pct = typeof u[2] === 'number' ? u[1] / u[2] * 100 : 18;
            return '<div style="margin-bottom:16px"><div class="row between text-sm" style="margin-bottom:6px"><b>' + u[0] + '</b><span class="tabular text-muted">' + SL.fmt.num(u[1]) + ' / ' + (typeof u[2] === 'number' ? SL.fmt.num(u[2]) : u[2]) + '</span></div>' +
              '<div class="progress" role="progressbar" aria-label="' + u[0] + '" aria-valuenow="' + Math.round(pct) + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + pct + '%"></span></div></div>';
          }).join('')) +
        section('Invoices', '', '<table class="table"><tbody>' + ['Oct 14, 2026', 'Sep 14, 2026', 'Aug 14, 2026'].map(function (d) {
          return '<tr><td>' + d + '</td><td class="text-sm text-muted">Growth · monthly</td><td class="num">$99.00</td><td><span class="badge badge-success">' + SL.icon('circle-check', 12) + 'Paid</span></td><td class="num"><button class="btn btn-ghost btn-sm" type="button" data-fake="Invoice downloaded">' + SL.icon('download', 14) + 'PDF</button></td></tr>';
        }).join('') + '</tbody></table>') + '</div>';
    },
    appearance: function () {
      const saved = SL.store.get('theme', null);
      const cur = saved || 'system';
      const opt = function (v, label, bg, side, ink) {
        return '<button type="button" class="theme-opt" role="radio" aria-checked="' + (cur === v) + '" data-themeopt="' + v + '">' +
          '<span class="theme-swatch" style="background:' + bg + '"><i style="width:28%;background:' + side + '"></i><i style="flex:1;padding:10px"><i style="display:block;height:8px;width:60%;border-radius:4px;background:' + ink + '"></i><i style="display:block;height:8px;width:40%;border-radius:4px;background:#E11D48;margin-top:6px"></i></i></span>' +
          '<b class="text-sm">' + label + '</b></button>';
      };
      return section('Appearance', 'Starling adapts to light and dark environments',
        '<div class="theme-opts" role="radiogroup" aria-label="Theme">' +
          opt('light', 'Light', '#F6F7F9', '#FFFFFF', '#0F172B') + opt('dark', 'Dark', '#08090B', '#0F1013', '#F8F8F8') +
          opt('system', 'Match system', 'linear-gradient(90deg,#F6F7F9 50%,#08090B 50%)', 'linear-gradient(90deg,#fff 50%,#0F1013 50%)', '#62748E') +
        '</div>' +
        '<div class="set-row" style="margin-top:12px"><div class="grow"><b class="text-sm">Reduce motion</b><p>Starling also follows your operating system setting.</p></div><label class="switch"><input type="checkbox" aria-label="Reduce motion" data-reduce></label></div>' +
        '<div class="set-row"><div class="grow"><b class="text-sm">Compact sidebar</b><p>Show icons only. Press [ to toggle anywhere.</p></div><label class="switch"><input type="checkbox" aria-label="Compact sidebar" data-compact' + (document.documentElement.classList.contains('sb-collapsed') ? ' checked' : '') + '></label></div>' +
        '<div class="set-row"><div class="grow"><b class="text-sm">Reset demo data</b><p>Restore posts, conversations and library to the original prototype state.</p></div><button class="btn btn-danger-ghost btn-sm" type="button" data-resetdemo>Reset</button></div>');
    }
  };

  SL.views.settings = {
    title: 'Settings',
    sub: 'Workspace, channels, team and preferences',
    render: function (el, params) {
      const cur = panes[params[0]] ? params[0] : 'profile';
      el.innerHTML = '<div class="settings">' +
        '<nav class="settings-nav" aria-label="Settings sections">' + SECTIONS.map(function (s) {
          return '<a href="#/settings/' + s[0] + '"' + (s[0] === cur ? ' aria-current="page"' : '') + '>' + SL.icon(s[1], 18) + s[2] + '</a>';
        }).join('') + '</nav>' +
        '<div class="stack-4">' + panes[cur]() + '</div></div>';

      el.addEventListener('click', function (e) {
        const t = e.target;
        const fk = t.closest('[data-fake]'); if (fk) { SL.toast(fk.getAttribute('data-fake')); return; }
        if (t.closest('[data-save-profile]')) {
          const em = SL.$('#pfEmail', el), er = SL.$('#pfEmailErr', el);
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value)) { er.innerHTML = SL.icon('triangle-alert', 14) + 'Enter a valid email, like name@company.com.'; er.hidden = false; em.setAttribute('aria-invalid', 'true'); em.focus(); return; }
          er.hidden = true; em.removeAttribute('aria-invalid');
          const b = t.closest('[data-save-profile]'); b.classList.add('is-loading');
          setTimeout(function () { b.classList.remove('is-loading'); SL.toast('Profile saved'); }, 600);
          return;
        }
        if (t.closest('[data-reset-form]')) { SL.refresh(); return; }
        const dc = t.closest('[data-disconnect]');
        if (dc) {
          const c = SL.data.channel(dc.getAttribute('data-disconnect'));
          SL.confirm({ title: 'Disconnect ' + SL.NETWORKS[c.net].name + '?', message: 'Scheduled posts for ' + c.handle + ' will be paused until you reconnect. Analytics history is kept.', confirm: 'Disconnect', danger: true,
            onConfirm: function () { c.connected = false; SL.refresh(); SL.toast(SL.NETWORKS[c.net].name + ' disconnected', { action: { label: 'Undo', onClick: function () { c.connected = true; SL.refresh(); } } }); } });
          return;
        }
        const cn = t.closest('[data-connect]');
        if (cn) {
          const c = SL.data.channel(cn.getAttribute('data-connect'));
          cn.classList.add('is-loading');
          setTimeout(function () { c.connected = true; SL.refresh(); SL.toast(SL.NETWORKS[c.net].name + ' connected', { message: c.handle + ' is ready to publish.' }); }, 900);
          return;
        }
        if (t.closest('[data-addch]')) {
          SL.modal({
            title: 'Add a channel', subtitle: 'You will be redirected to the network to authorise Starling.', width: 560,
            body: '<div class="grid grid-1-1" style="gap:10px">' + Object.keys(SL.NETWORKS).map(function (n) {
              return '<button type="button" class="sched-opt" data-n="' + n + '">' + SL.netBadge(n, 32) + '<span><b>' + SL.NETWORKS[n].name + '</b><span>Profile, page or business account</span></span></button>';
            }).join('') + '</div>',
            foot: '<button class="btn btn-secondary" data-close type="button">Cancel</button>',
            onMount: function (m, l) { SL.$$('[data-n]', m).forEach(function (b) { b.addEventListener('click', function () { l.close(true); SL.toast('Connecting to ' + SL.NETWORKS[b.getAttribute('data-n')].name + '…', { type: 'info', message: 'In the live product this opens the network’s sign-in.' }); }); }); }
          });
          return;
        }
        const rm = t.closest('[data-remove]');
        if (rm) {
          const m = SL.data.member(rm.getAttribute('data-remove'));
          SL.confirm({ title: 'Remove ' + m.name + '?', message: 'They lose access immediately. Their posts stay in the planner.', confirm: 'Remove', danger: true, onConfirm: function () { SL.toast(m.name + ' removed', { type: 'info' }); } });
          return;
        }
        const to = t.closest('[data-themeopt]');
        if (to) {
          const v = to.getAttribute('data-themeopt');
          if (v === 'system') { SL.store.del('theme'); } else SL.store.set('theme', v);
          SL.theme.apply(SL.theme.get());
          SL.$$('[data-themeopt]', el).forEach(function (b) { b.setAttribute('aria-checked', String(b === to)); });
          return;
        }
        if (t.closest('[data-resetdemo]')) { SL.confirm({ title: 'Reset demo data?', message: 'All changes you made in this prototype will be lost.', confirm: 'Reset', danger: true, onConfirm: SL.data.reset }); }
      });
      el.addEventListener('change', function (e) {
        if (e.target.matches('[data-compact]')) { SL.$('#sbCollapse').click(); }
        else if (e.target.matches('[data-reduce]')) { document.documentElement.style.setProperty('--dur', e.target.checked ? '0ms' : ''); document.documentElement.style.setProperty('--dur-slow', e.target.checked ? '0ms' : ''); SL.toast(e.target.checked ? 'Motion reduced' : 'Motion restored', { type: 'info', duration: 2000 }); }
        else if (e.target.matches('[id^="acc-"]')) { SL.toast('Access updated', { duration: 2000 }); }
      });
    }
  };
})(window.SL);
