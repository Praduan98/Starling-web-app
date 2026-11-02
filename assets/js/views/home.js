/* Home — today at a glance */
(function (SL) {
  'use strict';
  SL.views = SL.views || {};

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  function kpi(label, icon, value, delta, spark, color, foot) {
    return '<div class="card kpi">' +
      '<div class="kpi-top"><span class="kpi-ic">' + SL.icon(icon, 16) + '</span>' + label + '</div>' +
      '<div class="kpi-row"><span class="kpi-val">' + value + '</span>' + SL.chart.spark(spark, { w: 88, h: 30 }) + '</div>' +
      '<div class="text-xs text-muted"><span class="delta ' + (delta >= 0 ? 'up' : 'down') + '">' + SL.icon(delta >= 0 ? 'trending-up' : 'trending-down', 14) + Math.abs(delta).toFixed(1) + '%</span> ' + (foot || 'vs prior 30 days') + '</div></div>';
  }

  SL.views.home = {
    title: 'Home',
    sub: function () { return SL.fmt.date(new Date(), { weekday: 'long', month: 'long', day: 'numeric' }); },
    render: function (el) {
      const D = SL.data;
      const todayPosts = D.postsOn(SL.today);
      const upcoming = todayPosts.filter(function (p) { return new Date(p.date) > new Date(); }).length;
      const openConvos = D.conversations.filter(function (c) { return c.status === 'open'; });
      const unread = openConvos.filter(function (c) { return c.unread; }).length;
      const approvals = D.posts.filter(function (p) { return p.status === 'approval'; }).length;
      const followers = D.channels.reduce(function (a, c) { return a + c.followers; }, 0);

      const impressions = SL.series(30, 38000, 0.35, 0.006, 7);
      const labels = SL.dayLabels(30);

      /* --- Greeting --- */
      let html =
        '<section class="hero-greet" aria-labelledby="greetH">' +
          '<div class="row wrap between" style="align-items:flex-start;gap:16px">' +
            '<div><h2 id="greetH">' + greeting() + ', ' + D.user.first + '</h2>' +
            '<p class="lead">' + (upcoming ? '<b>' + upcoming + ' more post' + (upcoming === 1 ? '' : 's') + '</b> going out today' : 'Everything for today has gone out') + ', and <b>' + unread + ' new conversation' + (unread === 1 ? '' : 's') + '</b> ' + (unread === 1 ? 'is' : 'are') + ' waiting in your Inbox.</p></div>' +
            '<div class="row wrap"><a class="btn btn-secondary btn-pill" href="#/planner">' + SL.icon('calendar-days', 16) + 'Open planner</a>' +
            '<button class="btn btn-soft btn-pill" type="button" data-compose="ai">' + SL.icon('sparkles', 16) + 'Draft with Starling AI</button></div>' +
          '</div>' +
          '<div class="hero-stats">' +
            '<a class="hero-stat" href="#/inbox">' + SL.icon('inbox', 16) + '<b>' + openConvos.length + '</b> open in Inbox</a>' +
            '<a class="hero-stat" href="#/approvals">' + SL.icon('hourglass', 16) + '<b>' + approvals + '</b> awaiting approval</a>' +
            '<a class="hero-stat" href="#/analytics">' + SL.icon('trending-up', 16) + 'LinkedIn reach <b>+4.1×</b> this week</a>' +
            '<a class="hero-stat" href="#/settings/channels">' + SL.icon('triangle-alert', 16) + 'Threads needs reconnecting</a>' +
          '</div>' +
        '</section>';

      /* --- KPIs --- */
      html += '<section class="grid grid-kpi" aria-label="Key metrics">' +
        kpi('Audience', 'users', SL.fmt.compact(followers), 3.1, SL.series(20, 120, 0.05, 0.004, 3), 'var(--series-1)') +
        kpi('Impressions', 'eye', SL.fmt.compact(impressions.reduce(function (a, b) { return a + b; }, 0)), 12.6, impressions.slice(-20), 'var(--series-2)') +
        kpi('Engagement rate', 'heart', '4.8%', 0.6, SL.series(20, 4.5, 0.2, 0.002, 5), 'var(--series-1)') +
        kpi('Link clicks', 'mouse-pointer-click' in SL.ICONS ? 'mouse-pointer-click' : 'link', '9,412', -2.4, SL.series(20, 300, 0.3, -0.002, 9), 'var(--series-2)') +
      '</section>';

      /* --- Schedule + AI --- */
      const now = new Date();
      let sched = '', placedNow = false;
      todayPosts.forEach(function (p) {
        const t = new Date(p.date);
        if (!placedNow && t > now) { sched += '<div class="now-line" aria-label="Current time"><span class="pulse"></span>Now · ' + SL.fmt.time(now) + '</div>'; placedNow = true; }
        sched += '<div class="sched-item" role="button" tabindex="0" data-post="' + p.id + '" aria-label="' + SL.esc(SL.statusMeta[p.status].label + ' post at ' + SL.fmt.time(p.date)) + '">' +
          '<div class="sched-time">' + SL.fmt.time(p.date).replace(/\s?(AM|PM)/, '') + '<small>' + (t.getHours() < 12 ? 'AM' : 'PM') + '</small></div>' +
          (p.media[0] ? '<img class="thumb" src="' + p.media[0] + '" alt="">' : '<span class="thumb" style="display:grid;place-items:center;color:var(--fg-3)">' + SL.icon('type', 18) + '</span>') +
          '<div class="grow"><div class="sched-text clamp-2">' + SL.esc(p.text) + '</div><div class="sched-meta">' + SL.channelBadges(p.channels, 18) + SL.statusLabel(p.status) + '</div></div>' +
          '<span class="icon-btn icon-btn-sm" aria-hidden="true">' + SL.icon('chevron-right', 16) + '</span>' +
        '</div>';
      });
      if (!placedNow && todayPosts.length) sched += '<div class="now-line"><span class="pulse"></span>Now · ' + SL.fmt.time(now) + '</div>';
      if (!todayPosts.length) sched = '<div class="empty"><div class="empty-icon">' + SL.icon('calendar-days', 22) + '</div><h3>Nothing scheduled today</h3><p>Plan something now, or let Starling AI suggest a post.</p><button class="btn btn-primary" data-compose type="button">Create post</button></div>';

      html += '<section class="grid grid-2-1 mt-5">' +
        '<div class="card"><div class="card-head"><h3>Today’s schedule</h3><span class="badge">' + todayPosts.length + ' posts</span><a class="btn btn-ghost btn-sm ml-auto" href="#/planner">View week' + SL.icon('arrow-right', 14) + '</a></div>' +
        '<div class="card-body"><div class="schedule">' + sched + '</div></div></div>' +

        '<div class="card ai-card"><div class="card-head"><span class="ai-head"><span class="ai-badge">' + SL.icon('sparkles', 16) + '</span><h3>Starling AI insights</h3></span></div>' +
        '<div class="card-body">' +
          '<div class="insight"><span class="insight-ic">' + SL.icon('clock', 16) + '</span><div><h4>Best time to post tomorrow</h4><p>Your LinkedIn audience peaks <b>8–10 AM</b> on weekdays. Tomorrow at <b>8:15 AM</b> is still open.</p>' +
            '<button class="btn btn-soft btn-sm" type="button" data-compose data-date="' + new Date(SL.today.getTime() + SL.DAY).toISOString() + '">Plan for 8:15 AM</button></div></div>' +
          '<div class="insight"><span class="insight-ic">' + SL.icon('trending-up', 16) + '</span><div><h4>“AI agents” is trending</h4><p>Mentions of Flow 3.0 are up <b>212%</b> this week, mostly positive. Ride the wave with a 30-second demo clip.</p>' +
            '<button class="btn btn-soft btn-sm" type="button" data-ai-draft>' + SL.icon('wand-sparkles', 14) + 'Draft it for me</button></div></div>' +
          '<div class="insight"><span class="insight-ic">' + SL.icon('message-circle', 16) + '</span><div><h4>2 priority conversations</h4><p>An API incident mention on X has waited <b>' + SL.fmt.ago(D.conversations[1].time) + '</b>. Reply before it escalates.</p>' +
            '<a class="btn btn-soft btn-sm" href="#/inbox/c2">Open in Inbox</a></div></div>' +
        '</div></div>' +
      '</section>';

      /* --- Performance + inbox --- */
      html += '<section class="grid grid-2-1 mt-5">' +
        '<div class="card"><div class="card-head"><div><h3>Impressions</h3><div class="sub">All channels · last 30 days</div></div><a class="btn btn-ghost btn-sm ml-auto" href="#/analytics">Full report' + SL.icon('arrow-right', 14) + '</a></div>' +
        '<div class="card-body"><div id="homeChart"></div></div></div>' +
        '<div class="card"><div class="card-head"><h3>Inbox</h3><span class="count">' + unread + '</span><a class="btn btn-ghost btn-sm ml-auto" href="#/inbox">Open' + SL.icon('arrow-right', 14) + '</a></div>' +
        '<div class="card-body" style="padding-top:8px">' + openConvos.slice(0, 4).map(function (c) {
          return '<a class="mini-convo" href="#/inbox/' + c.id + '"><span class="avatar">' + '<img src="' + c.avatar + '" alt="">' + SL.netBadge(c.net, 16) + '</span>' +
            '<span class="grow"><span class="row"><b class="text-sm">' + SL.esc(c.name) + '</b>' + (c.priority ? '<span class="badge badge-danger">' + SL.icon('flag', 12) + 'Priority</span>' : '') + '<span class="text-xs text-muted ml-auto">' + SL.fmt.ago(c.time) + '</span></span>' +
            '<p class="clamp-2">' + SL.esc(c.messages[c.messages.length - 1].text) + '</p></span></a>';
        }).join('') + '</div></div>' +
      '</section>';

      /* --- Top posts + channels --- */
      const top = D.posts.filter(function (p) { return p.metrics && p.metrics.reach && p.media.length; })
        .sort(function (a, b) { return (b.metrics.likes + b.metrics.comments * 3) - (a.metrics.likes + a.metrics.comments * 3); }).slice(0, 3);
      html += '<section class="grid grid-2-1 mt-5">' +
        '<div class="card"><div class="card-head"><h3>Top posts this month</h3><a class="btn btn-ghost btn-sm ml-auto" href="#/analytics">See all' + SL.icon('arrow-right', 14) + '</a></div>' +
        '<div class="card-body"><div class="grid grid-3" style="gap:16px">' + top.map(function (p, i) {
          const er = ((p.metrics.likes + p.metrics.comments + p.metrics.shares) / p.metrics.reach * 100);
          return '<article class="card card-hover top-post" style="position:relative;cursor:pointer" data-post="' + p.id + '" tabindex="0" role="button" aria-label="Open top post ' + (i + 1) + '">' +
            '<img src="' + p.media[0] + '" alt="" loading="lazy"><span class="tp-rank">#' + (i + 1) + '</span>' +
            '<div class="tp-body"><div class="row">' + SL.channelBadges(p.channels, 18) + '<span class="text-xs text-muted ml-auto">' + SL.fmt.date(p.date) + '</span></div>' +
            '<p class="text-sm clamp-2">' + SL.esc(p.text) + '</p>' +
            '<div class="tp-stats"><div><b>' + SL.fmt.compact(p.metrics.reach) + '</b><span>Reach</span></div><div><b>' + SL.fmt.compact(p.metrics.likes) + '</b><span>Likes</span></div><div><b>' + er.toFixed(1) + '%</b><span>Eng. rate</span></div></div></div></article>';
        }).join('') + '</div></div></div>' +
        '<div class="card"><div class="card-head"><h3>Channels</h3><a class="btn btn-ghost btn-sm ml-auto" href="#/settings/channels">Manage</a></div>' +
        '<div class="card-body" style="padding-top:8px"><ul class="channel-list">' + D.channels.slice(0, 6).map(function (c) {
          return '<li>' + SL.netBadge(c.net, 32) + '<span class="grow"><b class="text-sm" style="display:block">' + SL.NETWORKS[c.net].name + '</b><span class="text-xs text-muted">' + SL.esc(c.handle) + '</span></span>' +
            '<span style="text-align:right"><b class="text-sm tabular" style="display:block">' + SL.fmt.compact(c.followers) + '</b><span class="delta ' + (c.delta >= 0 ? 'up' : 'down') + '">' + SL.icon(c.delta >= 0 ? 'arrow-up-right' : 'arrow-down-right', 12) + Math.abs(c.delta) + '%</span></span></li>';
        }).join('') + '</ul></div></div>' +
      '</section>';

      el.innerHTML = html;

      SL.chart.line(SL.$('#homeChart', el), {
        labels: labels, series: [{ name: 'Impressions', color: 'var(--series-1)', values: impressions }],
        area: true, height: 292, summary: 'Impressions over the last 30 days, trending up 12.6 percent'
      });

      el.addEventListener('click', function (e) {
        const p = e.target.closest('[data-post]');
        if (p) { SL.openPost(p.getAttribute('data-post')); return; }
        if (e.target.closest('[data-ai-draft]')) SL.compose({ text: 'Flow 3.0 in 30 seconds: watch an AI agent turn a messy spreadsheet into a weekly ops report, then send it for review. #Flow3 #AIAgents', media: ['assets/media/t7.webp', 'assets/media/t8.webp'], channels: ['li', 'x'] });
      });
      el.addEventListener('keydown', function (e) {
        const p = e.target.closest('[data-post]');
        if (p && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); SL.openPost(p.getAttribute('data-post')); }
      });
    }
  };
})(window.SL);
