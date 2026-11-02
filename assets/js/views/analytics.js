/* Analytics — performance across channels */
(function (SL) {
  'use strict';
  SL.views = SL.views || {};
  const st = { range: 30, net: 'all', view: 'chart', sort: 'impressions', dir: -1 };

  /* Colour follows the entity in every chart (validated categorical order) */
  const NETS = [
    { net: 'linkedin', color: 'var(--series-1)', base: 17000, seed: 101, trend: 0.005 },
    { net: 'x', color: 'var(--series-2)', base: 9500, seed: 102, trend: 0.001 },
    { net: 'instagram', color: 'var(--series-3)', base: 6800, seed: 103, trend: 0.004 },
    { net: 'tiktok', color: 'var(--series-4)', base: 4200, seed: 104, trend: 0.014 },
    { net: 'facebook', color: 'var(--series-5)', base: 1900, seed: 105, trend: 0.0 }
  ];

  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }

  function kpi(label, icon, value, delta, spark, color) {
    return '<div class="card kpi"><div class="kpi-top"><span class="kpi-ic">' + SL.icon(icon, 16) + '</span>' + label + '</div>' +
      '<div class="kpi-row"><span class="kpi-val">' + value + '</span>' + SL.chart.spark(spark, { w: 60, h: 26 }) + '</div><div class="text-xs text-muted"><span class="delta ' + (delta >= 0 ? 'up' : 'down') + '">' +
      SL.icon(delta >= 0 ? 'trending-up' : 'trending-down', 14) + Math.abs(delta).toFixed(1) + '%</span> vs prior ' + st.range + 'd</div></div>';
  }

  SL.views.analytics = {
    title: 'Analytics',
    sub: 'How your content performs, by channel and over time',
    render: function (el) {
      function draw() {
        const days = st.range;
        const labels = SL.dayLabels(days);
        const nets = NETS.filter(function (n) { return st.net === 'all' || n.net === st.net; });
        const series = nets.map(function (n) {
          return { name: SL.NETWORKS[n.net].name, color: n.color, values: SL.series(days, n.base, 0.32, n.trend, n.seed + days) };
        });
        const totalImp = sum(series.map(function (s) { return sum(s.values); }));
        const engagements = Math.round(totalImp * 0.047);
        const followers = SL.series(days, 60, 0.5, 0.004, 900 + days);
        const published = SL.data.posts.filter(function (p) {
          return p.metrics && p.metrics.reach && new Date(p.date) > new Date(Date.now() - days * SL.DAY) &&
            (st.net === 'all' || p.channels.some(function (c) { return SL.data.channel(c).net === st.net; }));
        });

        // Best time heatmap: 7 days × 12 two-hour blocks (deterministic pattern with lunchtime + evening peaks)
        const r = SL.rng(77);
        const rows = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const cols = ['12a', '2a', '4a', '6a', '8a', '10a', '12p', '2p', '4p', '6p', '8p', '10p'];
        const heat = rows.map(function (_, ri) {
          return cols.map(function (_, ci) {
            const peak = Math.exp(-Math.pow(ci - 4.4, 2) / 1.2) * 5.4 + Math.exp(-Math.pow(ci - 6.2, 2) / 1.4) * 3.6 + Math.exp(-Math.pow(ci - 8.6, 2) / 1.6) * 2.2;
            const wk = ri >= 5 ? 0.45 : (ri >= 1 && ri <= 3 ? 1.12 : 0.95);
            return Math.max(0.2, (0.4 + peak) * wk + r() * 0.6);
          });
        });

        const engByNet = NETS.map(function (n) {
          const imp = sum(SL.series(days, n.base, 0.32, n.trend, n.seed + days));
          const rate = { linkedin: 4.9, x: 1.6, instagram: 5.2, tiktok: 7.4, facebook: 1.9 }[n.net];
          return { label: SL.NETWORKS[n.net].name, value: Math.round(imp * rate / 100), lead: SL.netBadge(n.net, 20), color: n.color, extra: '' , rate: rate };
        }).filter(function (x) { return st.net === 'all' || x.label === SL.NETWORKS[st.net].name; });

        el.innerHTML =
          '<div class="an-bar">' +
            '<div class="segmented" role="group" aria-label="Date range">' + [7, 30, 90].map(function (d) {
              return '<button type="button" data-range="' + d + '" aria-pressed="' + (st.range === d) + '">' + d + ' days</button>';
            }).join('') + '</div>' +
            '<label class="sr-only" for="anNet">Channel</label><select class="select" id="anNet" style="width:auto;min-width:180px">' +
              '<option value="all">All channels</option>' + NETS.map(function (n) { return '<option value="' + n.net + '"' + (st.net === n.net ? ' selected' : '') + '>' + SL.NETWORKS[n.net].name + '</option>'; }).join('') + '</select>' +
            '<span class="text-sm text-muted">' + SL.fmt.date(labels[0], { month: 'short', day: 'numeric' }) + ' – ' + SL.fmt.date(labels[labels.length - 1], { month: 'short', day: 'numeric', year: 'numeric' }) + '</span>' +
            '<div class="page-actions"><button class="btn btn-secondary btn-sm" type="button" data-schedule-report>' + SL.icon('mail', 16) + 'Schedule report</button>' +
            '<button class="btn btn-primary btn-sm" type="button" data-export>' + SL.icon('download', 16) + 'Export CSV</button></div>' +
          '</div>' +

          '<section class="grid grid-kpi-5" aria-label="Key metrics">' +
            kpi('Followers gained', 'user-plus', '+' + SL.fmt.num(sum(followers)), 8.4, followers, 'var(--series-1)') +
            kpi('Impressions', 'eye', SL.fmt.compact(totalImp), 12.6, series[0].values, 'var(--series-2)') +
            kpi('Engagements', 'heart', SL.fmt.compact(engagements), 9.1, SL.series(20, 50, 0.3, 0.004, 41), 'var(--series-1)') +
            kpi('Engagement rate', 'percent' in SL.ICONS ? 'percent' : 'activity', '4.7%', 0.4, SL.series(20, 4.6, 0.15, 0.001, 42), 'var(--series-2)') +
            kpi('Link clicks', 'link', SL.fmt.compact(Math.round(totalImp * 0.0061)), -2.4, SL.series(20, 300, 0.3, -0.002, 43), 'var(--series-1)') +
          '</section>' +

          '<section class="card mt-5"><div class="card-head"><div><h3>Impressions by network</h3><div class="sub">Daily · click a legend item to hide a series · use arrow keys on the chart</div></div>' +
            '<div class="segmented ml-auto" role="group" aria-label="Display as"><button type="button" data-view="chart" aria-pressed="' + (st.view === 'chart') + '">' + SL.icon('chart-line', 14) + 'Chart</button><button type="button" data-view="table" aria-pressed="' + (st.view === 'table') + '">' + SL.icon('list', 14) + 'Table</button></div></div>' +
            '<div class="card-body"><div id="impChart"' + (st.view === 'table' ? ' hidden' : '') + '></div>' +
            (st.view === 'table' ? '<div class="chart-table"><table class="table"><thead><tr><th>Date</th>' + series.map(function (s) { return '<th class="num">' + s.name + '</th>'; }).join('') + '</tr></thead><tbody>' +
              labels.map(function (d, i) { return '<tr><td>' + SL.fmt.date(d, { weekday: 'short', month: 'short', day: 'numeric' }) + '</td>' + series.map(function (s) { return '<td class="num">' + SL.fmt.num(s.values[i]) + '</td>'; }).join('') + '</tr>'; }).reverse().join('') +
              '</tbody></table></div>' : '') +
            '</div></section>' +

          '<section class="grid grid-1-1 mt-5">' +
            '<div class="card card-fill"><div class="card-head"><div><h3>Engagements by network</h3><div class="sub">Likes, comments, shares and saves · engagement rate in grey</div></div></div><div class="card-body">' +
              SL.chart.hbars(engByNet.map(function (x) { x.extra = ' <span class="text-xs text-muted fw-500">' + x.rate + '%</span>'; return x; })) +
              (engByNet.length > 1 ? '<div class="card-note">' + SL.icon('lightbulb', 16) + '<span><b>TikTok</b> has your highest engagement rate (7.4%) on a fraction of the reach. Worth testing two more posts a week.</span></div>' : '') + '</div></div>' +
            '<div class="card"><div class="card-head"><div><h3>New followers</h3><div class="sub">All channels · per day</div></div><span class="badge badge-success ml-auto">' + SL.icon('trending-up', 12) + '+8.4%</span></div><div class="card-body"><div id="folChart"></div>' +
              '<div class="chart-callout"><span><span class="sw" style="background:var(--series-1)"></span>Peak: <b>' + SL.fmt.date(labels[followers.indexOf(Math.max.apply(null, followers))], { weekday: 'short', month: 'short', day: 'numeric' }) + '</b> · ' + Math.max.apply(null, followers) + ' new followers</span><span><span class="sw" style="background:var(--chart-bar)"></span>Other days</span></div></div></div>' +
          '</section>' +

          '<section class="grid grid-2-1 mt-5">' +
            '<div class="card"><div class="card-head"><div><h3>Best time to post</h3><div class="sub">Average engagement rate by day and time (IST)</div></div></div><div class="card-body">' +
              SL.chart.heatmap(rows, cols, heat, { label: 'Average engagement rate by weekday and two-hour block', colEvery: 2, format: function (v) { return v.toFixed(1) + '%'; } }) +
              '<div class="card-note">' + SL.icon('clock', 16) + '<span>Best slot: <b>Tuesday–Thursday, 8–10 AM</b>. Weekends average under half your weekday engagement.</span></div></div></div>' +
            '<div class="card ai-card"><div class="card-head"><span class="ai-head"><span class="ai-badge">' + SL.icon('sparkles', 16) + '</span><h3>What’s working</h3></span></div><div class="card-body">' +
              '<div class="insight"><span class="insight-ic">' + SL.icon('video', 16) + '</span><div><h4>Product demos win</h4><p>Demo clips under 30 seconds earn <b>2.6×</b> the engagement of static posts.</p></div></div>' +
              '<div class="insight"><span class="insight-ic">' + SL.icon('clock', 16) + '</span><div><h4>Weekday mornings</h4><p>8–10 AM, Tuesday to Thursday, is your strongest window on LinkedIn. 4 of your top 5 posts went out then.</p></div></div>' +
              '<div class="insight"><span class="insight-ic">' + SL.icon('hash', 16) + '</span><div><h4>#Flow3</h4><p>Posts in the Flow 3.0 launch campaign reach <b>38%</b> more non-followers.</p></div></div>' +
            '</div></div>' +
          '</section>' +

          '<section class="card mt-5"><div class="card-head"><div><h3>Post performance</h3><div class="sub">' + published.length + ' posts published in this period</div></div></div>' +
            '<div class="card-body" style="padding:12px 0 0"><div class="data-table-wrap"><table class="table" id="postTable"><thead><tr><th>Post</th><th>Channels</th>' +
            [['date', 'Published'], ['impressions', 'Impressions'], ['eng', 'Engagements'], ['rate', 'Eng. rate'], ['clicks', 'Clicks']].map(function (c) {
              const on = st.sort === c[0];
              return '<th class="num"' + (on ? ' aria-sort="' + (st.dir < 0 ? 'descending' : 'ascending') + '"' : '') + '><button type="button" data-sort="' + c[0] + '">' + c[1] + SL.icon(on ? (st.dir < 0 ? 'chevron-down' : 'chevron-up') : 'chevron-down', 14, on ? '' : 'text-muted') + '</button></th>';
            }).join('') + '</tr></thead><tbody>' + rowsHTML(published) + '</tbody></table></div></div></section>';

        if (st.view === 'chart') SL.chart.line(SL.$('#impChart', el), {
          labels: labels, series: series, height: 300, directLabels: series.length > 1 && window.innerWidth > 640, area: series.length === 1,
          summary: 'Daily impressions by network over the last ' + days + ' days. LinkedIn leads; TikTok is growing fastest.'
        });
        SL.chart.bars(SL.$('#folChart', el), {
          labels: labels.map(function (d) { return SL.fmt.date(d, { month: 'numeric', day: 'numeric' }); }), values: followers, name: 'New followers', height: 220,
          highlight: followers.indexOf(Math.max.apply(null, followers)), color: 'var(--chart-bar)', summary: 'New followers per day; the peak day is highlighted.'
        });

        SL.$('#anNet', el).addEventListener('change', function () { st.net = this.value; draw(); });
      }

      function rowsHTML(posts) {
        const val = function (p) {
          const m = p.metrics, eng = m.likes + m.comments + m.shares;
          return { date: new Date(p.date).getTime(), impressions: m.impressions, eng: eng, rate: eng / m.reach * 100, clicks: m.clicks };
        };
        return posts.slice().sort(function (a, b) { return (val(a)[st.sort] - val(b)[st.sort]) * st.dir; }).slice(0, 12).map(function (p) {
          const v = val(p);
          return '<tr data-post="' + p.id + '" style="cursor:pointer"><td><div class="post-cell">' + (p.media[0] ? '<img class="thumb" src="' + p.media[0] + '" alt="" loading="lazy">' : '') + '<p class="clamp-2">' + SL.esc(p.text) + '</p></div></td>' +
            '<td>' + SL.channelBadges(p.channels, 20) + '</td><td class="num">' + SL.fmt.date(p.date) + '</td><td class="num">' + SL.fmt.num(v.impressions) + '</td>' +
            '<td class="num">' + SL.fmt.num(v.eng) + '</td><td class="num">' + v.rate.toFixed(1) + '%</td><td class="num">' + SL.fmt.num(v.clicks) + '</td></tr>';
        }).join('') || '<tr><td colspan="7"><div class="empty"><h3>No published posts in this range</h3><p>Try a longer date range or another channel.</p></div></td></tr>';
      }

      el.addEventListener('click', function (e) {
        const t = e.target;
        const rg = t.closest('[data-range]'); if (rg) { st.range = +rg.getAttribute('data-range'); draw(); return; }
        const vw = t.closest('[data-view]'); if (vw) { st.view = vw.getAttribute('data-view'); draw(); return; }
        const so = t.closest('[data-sort]');
        if (so) { const k = so.getAttribute('data-sort'); if (st.sort === k) st.dir *= -1; else { st.sort = k; st.dir = -1; } draw(); const b = el.querySelector('[data-sort="' + k + '"]'); if (b) b.focus(); return; }
        const p = t.closest('[data-post]'); if (p) { SL.openPost(p.getAttribute('data-post')); return; }
        if (t.closest('[data-export]')) {
          const labels = SL.dayLabels(st.range);
          const series = NETS.map(function (n) { return { name: SL.NETWORKS[n.net].name, values: SL.series(st.range, n.base, 0.32, n.trend, n.seed + st.range) }; });
          const rows = [['Date'].concat(series.map(function (s) { return s.name + ' impressions'; }))].concat(labels.map(function (d, i) {
            return [d.toISOString().slice(0, 10)].concat(series.map(function (s) { return s.values[i]; }));
          }));
          SL.chart.downloadCSV('starling-impressions-' + st.range + 'd.csv', rows);
          SL.toast('Export ready', { message: 'starling-impressions-' + st.range + 'd.csv downloaded.' });
          return;
        }
        if (t.closest('[data-schedule-report]')) {
          SL.modal({
            title: 'Schedule a report', subtitle: 'Send a PDF summary to your team on a regular cadence.', width: 520,
            body: '<div class="stack-4"><div class="field"><label class="label" for="rpTo">Send to</label><input class="input" id="rpTo" type="email" multiple value="priya@nexora.io, marketing@nexora.io" autocomplete="email"><span class="hint">Separate addresses with commas.</span></div>' +
              '<div class="form-grid"><div class="field"><label class="label" for="rpFreq">Frequency</label><select class="select" id="rpFreq"><option>Every Monday</option><option>First of the month</option><option>Every day</option></select></div>' +
              '<div class="field"><label class="label" for="rpTime">Time</label><input class="input" id="rpTime" type="time" value="08:00"></div></div>' +
              '<label class="check"><input type="checkbox" checked> Include top posts and AI summary</label></div>',
            foot: '<button class="btn btn-secondary" data-close type="button">Cancel</button><button class="btn btn-primary" type="button" data-ok>Schedule report</button>',
            onMount: function (m, l) { m.querySelector('[data-ok]').addEventListener('click', function () { l.close(true); SL.toast('Report scheduled', { message: 'Every Monday at 8:00 AM to 2 recipients.' }); }); }
          });
        }
      });

      draw();
    }
  };
})(window.SL);
