/* Listening — what people say about you, your category and competitors */
(function (SL) {
  'use strict';
  SL.views = SL.views || {};
  let topic = 0;

  const mentions = [
    { name: 'Ishita Banerjee', handle: '@ishitab', avatar: 'assets/media/a12.webp', net: 'instagram', s: 'positive', text: 'Flow 3.0 agents now run our entire month-end close checklist. Genuinely impressed, @nexorahq.', reach: 6730, time: -3 },
    { name: 'The Ops Brief', handle: '@theopsbrief', avatar: null, initials: 'OB', net: 'x', s: 'positive', text: 'Nexora’s Flow 3.0 is the most practical AI agent launch this year. Real workflows, human review built in, no hype.', reach: 24100, time: -9 },
    { name: 'Vikram Singh', handle: '@vikramsingh', avatar: 'assets/media/a7.webp', net: 'x', s: 'negative', text: 'Nexora API was down for 20 minutes this morning and our sync failed. Anyone else seeing 503s?', reach: 1210, time: -14 },
    { name: 'Aditya Kumar', handle: '@adityabuilds', avatar: 'assets/media/a6.webp', net: 'tiktok', s: 'neutral', text: 'Comparing Nexora Flow and Vantage Agents on the same three workflows. Results in the video.', reach: 18200, time: -20 },
    { name: 'Sneha Pillai', handle: '@snehapillai', avatar: 'assets/media/a14.webp', net: 'instagram', s: 'positive', text: 'Nexora publishing their SOC 2 report openly made our security review take a day. Small thing, big difference.', reach: 3120, time: -27 }
  ];

  function sentIcon(s) {
    return s === 'positive' ? '<span class="badge badge-success">' + SL.icon('thumbs-up', 12) + 'Positive</span>'
      : s === 'negative' ? '<span class="badge badge-danger">' + SL.icon('thumbs-down', 12) + 'Negative</span>'
      : '<span class="badge">' + SL.icon('circle-dot', 12) + 'Neutral</span>';
  }

  SL.views.listening = {
    title: 'Listening',
    sub: 'Track conversations about your brand, category and competitors',
    render: function (el) {
      const L = SL.data.listening;
      function draw() {
        const t = L.topics[topic];
        const days = 30, labels = SL.dayLabels(days);
        const vol = SL.series(days, [420, 2600, 900][topic] || 380, 0.3, 0.004, 300 + topic);
        // a launch spike the annotation explains
        const spike = days - 9;
        if (topic === 0) { vol[spike] = Math.round(vol[spike] * 2.6); vol[spike + 1] = Math.round(vol[spike + 1] * 1.8); vol[spike + 2] = Math.round(vol[spike + 2] * 1.3); }
        const total = vol.reduce(function (a, b) { return a + b; }, 0);
        const sent = topic === 2 ? { positive: 51, neutral: 34, negative: 15 } : L.sentiment;
        const maxTerm = L.terms[0].count;

        el.innerHTML =
          '<div class="page-head" style="margin-bottom:16px"><div class="tabs" role="tablist" aria-label="Topics" style="border-bottom:0">' +
            L.topics.map(function (tp, i) { return '<button class="tab" role="tab" type="button" data-topic="' + i + '" aria-selected="' + (i === topic) + '">' + SL.icon(i === 0 ? 'star' : i === 1 ? 'hash' : 'target', 16) + SL.esc(tp.name) + '</button>'; }).join('') +
            '<button class="tab" type="button" data-newtopic>' + SL.icon('plus', 16) + 'New topic</button></div>' +
            '<div class="page-actions"><button class="btn btn-secondary btn-sm" type="button" data-alert>' + SL.icon('bell-ring', 16) + 'Spike alerts</button></div></div>' +
          '<div class="query-box" style="margin-bottom:20px">' + SL.icon('scan-search', 16) + '<span>' + SL.esc(t.query) + '</span><button class="btn btn-ghost btn-sm ml-auto" type="button" data-editq style="font-family:var(--font-sans)">Edit query</button></div>' +

          '<section class="grid grid-kpi" aria-label="Listening summary">' +
            [['Mentions', 'message-circle', SL.fmt.compact(total), 18.2], ['Potential reach', 'users', SL.fmt.compact(total * 640), 22.5], ['Net sentiment', 'smile', '+' + (sent.positive - sent.negative), 4.0], ['Share of voice', 'chart-pie', (topic === 2 ? '29' : L.sov[0].value) + '%', 3.1]].map(function (k) {
              return '<div class="card kpi"><div class="kpi-top"><span class="kpi-ic">' + SL.icon(k[1], 16) + '</span>' + k[0] + '</div><div class="kpi-row"><span class="kpi-val">' + k[2] + '</span>' + SL.chart.spark(SL.series(20, 50, 0.25, 0.006, 600 + k[0].length + topic), { w: 72, h: 28 }) + '</div>' +
                '<div class="text-xs text-muted"><span class="delta up">' + SL.icon('trending-up', 14) + k[3] + '%</span> vs prior 30d</div></div>';
            }).join('') +
          '</section>' +

          '<section class="grid grid-2-1 mt-5">' +
            '<div class="card"><div class="card-head"><div><h3>Mention volume</h3><div class="sub">Daily mentions · last 30 days</div></div></div><div class="card-body"><div id="volChart"></div></div></div>' +
            '<div class="card"><div class="card-head"><div><h3>Sentiment</h3><div class="sub">' + SL.fmt.num(total) + ' mentions analysed</div></div></div><div class="card-body">' +
              SL.chart.segments([
                { label: 'Positive', value: sent.positive, color: 'var(--success)', icon: 'thumbs-up' },
                { label: 'Neutral', value: sent.neutral, color: 'var(--border-strong)', icon: 'circle-dot' },
                { label: 'Negative', value: sent.negative, color: 'var(--danger)', icon: 'thumbs-down' }
              ]) +
              '<div class="insight" style="margin-top:18px"><span class="insight-ic">' + SL.icon('sparkles', 16) + '</span><div><h4>Why it moved</h4><p>Positive mentions jumped after the Flow 3.0 launch. Most negative mentions are about this morning’s API incident.</p></div></div>' +
            '</div></div>' +
          '</section>' +

          '<section class="grid grid-1-1 mt-5">' +
            '<div class="card"><div class="card-head"><div><h3>Trending terms</h3><div class="sub">Phrases appearing alongside your topic</div></div></div><div class="card-body" style="padding-top:8px">' +
              L.terms.map(function (tm, i) {
                return '<div class="term-row"><span class="term-rank">' + (i + 1) + '</span><div><div class="term-name">' + SL.esc(tm.term) + '</div><div class="term-bar"><span style="width:' + (tm.count / maxTerm * 100) + '%"></span></div></div>' +
                  '<span class="tabular text-sm fw-600" style="text-align:right">' + SL.fmt.num(tm.count) + '</span>' +
                  '<span class="delta ' + (tm.growth >= 0 ? 'up' : 'down') + '" style="justify-content:flex-end">' + SL.icon(tm.growth >= 0 ? 'arrow-up-right' : 'arrow-down-right', 12) + Math.abs(tm.growth) + '%</span></div>';
              }).join('') + '</div></div>' +
            '<div class="card"><div class="card-head"><div><h3>Share of voice</h3><div class="sub">Mentions vs. competitors · AI workflow automation</div></div></div><div class="card-body">' +
              SL.chart.hbars(L.sov.map(function (s, i) { return { label: s.name, value: s.value, color: 'var(--series-' + (i + 1) + ')', lead: '<span class="legend-swatch" style="background:var(--series-' + (i + 1) + ')"></span>' }; }), { max: 50, format: function (v) { return v + '%'; } }) +
              '<table class="table" style="margin-top:20px"><thead><tr><th>Brand</th><th class="num">Mentions</th><th class="num">Positive</th><th class="num">Change</th></tr></thead><tbody>' +
                [['Nexora', 13644, 64, 3.1], ['Vantage AI', 10412, 58, -1.4], ['Corelink', 7539, 61, -0.9], ['Stackwise', 4308, 49, -0.8]].map(function (r, i) {
                  return '<tr><td><span class="row"><span class="legend-swatch" style="background:var(--series-' + (i + 1) + ')"></span>' + r[0] + '</span></td><td class="num">' + SL.fmt.num(r[1]) + '</td><td class="num">' + r[2] + '%</td><td class="num"><span class="delta ' + (r[3] >= 0 ? 'up' : 'down') + '">' + (r[3] >= 0 ? '+' : '') + r[3] + ' pts</span></td></tr>';
                }).join('') + '</tbody></table>' +
              '<div class="card-note">' + SL.icon('trending-up', 16) + '<span>Nexora leads the category for the third month running, gaining <b>3.1 points</b> on Vantage AI.</span></div>' +
            '</div></div>' +
          '</section>' +

          '<section class="card mt-5"><div class="card-head"><div><h3>Top mentions</h3><div class="sub">Sorted by potential reach</div></div>' +
            '<div class="segmented ml-auto" role="group" aria-label="Filter mentions"><button type="button" aria-pressed="true" data-mf="">All</button><button type="button" aria-pressed="false" data-mf="positive">Positive</button><button type="button" aria-pressed="false" data-mf="negative">Negative</button></div></div>' +
            '<div class="card-body" id="mentionList" style="padding-top:8px">' + mentionList('') + '</div></section>';

        SL.chart.line(SL.$('#volChart', el), {
          labels: labels, series: [{ name: 'Mentions', color: 'var(--series-1)', values: vol }], area: true, height: 260,
          annotations: topic === 0 ? [{ index: spike, label: 'Flow 3.0 launch' }] : [],
          summary: 'Daily mentions over 30 days' + (topic === 0 ? ', spiking at the Flow 3.0 launch' : '')
        });
      }

      function mentionList(f) {
        return mentions.filter(function (m) { return !f || m.s === f; }).sort(function (a, b) { return b.reach - a.reach; }).map(function (m) {
          return '<article class="mention"><span class="avatar avatar-md' + (m.avatar ? '' : ' avatar-org') + '">' + (m.avatar ? '<img src="' + m.avatar + '" alt="">' : m.initials) + SL.netBadge(m.net, 16) + '</span>' +
            '<div class="grow"><div class="row wrap"><b class="text-sm">' + SL.esc(m.name) + '</b><span class="text-xs text-muted">' + SL.esc(m.handle) + ' · ' + Math.abs(m.time) + 'h</span>' + sentIcon(m.s) +
            '<span class="text-xs text-muted ml-auto">' + SL.icon('users', 12) + ' ' + SL.fmt.compact(m.reach) + ' reach</span></div><p>' + SL.esc(m.text) + '</p>' +
            '<div class="row" style="margin-top:8px"><button class="btn btn-ghost btn-sm" type="button" data-engage>' + SL.icon('reply', 14) + 'Reply</button><button class="btn btn-ghost btn-sm" type="button" data-toinbox>' + SL.icon('inbox', 14) + 'Send to Inbox</button></div></div></article>';
        }).join('');
      }

      el.addEventListener('click', function (e) {
        const t = e.target;
        const tp = t.closest('[data-topic]'); if (tp) { topic = +tp.getAttribute('data-topic'); draw(); return; }
        const mf = t.closest('[data-mf]');
        if (mf) { SL.$$('[data-mf]', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b === mf)); }); SL.$('#mentionList', el).innerHTML = mentionList(mf.getAttribute('data-mf')); return; }
        if (t.closest('[data-engage]')) { SL.go('#/inbox'); return; }
        if (t.closest('[data-toinbox]')) { SL.toast('Sent to Inbox', { message: 'Added to the Unassigned queue.' }); return; }
        if (t.closest('[data-alert]')) { SL.toast('Spike alerts on', { type: 'info', message: 'We will notify you when mentions jump 2× above normal.' }); return; }
        if (t.closest('[data-newtopic]') || t.closest('[data-editq]')) {
          const editing = !!t.closest('[data-editq]');
          SL.modal({
            title: editing ? 'Edit topic' : 'New listening topic', subtitle: 'Use keywords, hashtags, handles and boolean operators (AND, OR, NOT).', width: 560,
            body: '<div class="stack-4"><div class="field"><label class="label" for="tpName">Topic name</label><input class="input" id="tpName" value="' + (editing ? SL.esc(L.topics[topic].name) : '') + '" placeholder="e.g. Nexora Summit 2026"></div>' +
              '<div class="field"><label class="label" for="tpQ">Query</label><textarea class="textarea" id="tpQ" style="font-family:var(--font-mono);font-size:13px;min-height:96px">' + (editing ? SL.esc(L.topics[topic].query) : '"nexora summit" OR #NexoraSummit NOT giveaway') + '</textarea><span class="hint">Matches public posts on X, Instagram, TikTok, Reddit, news and blogs.</span></div>' +
              '<label class="check"><input type="checkbox" checked> Exclude posts from Nexora’s own accounts</label></div>',
            foot: '<button class="btn btn-secondary" data-close type="button">Cancel</button><button class="btn btn-primary" type="button" data-ok>' + (editing ? 'Save changes' : 'Start listening') + '</button>',
            onMount: function (m, l) {
              m.querySelector('[data-ok]').addEventListener('click', function () {
                const n = m.querySelector('#tpName');
                if (!n.value.trim()) { n.setAttribute('aria-invalid', 'true'); n.focus(); return; }
                if (editing) { L.topics[topic].name = n.value.trim(); L.topics[topic].query = m.querySelector('#tpQ').value; }
                else { L.topics.push({ id: 't' + Date.now(), name: n.value.trim(), query: m.querySelector('#tpQ').value }); topic = L.topics.length - 1; }
                l.close(true); draw();
                SL.toast(editing ? 'Topic updated' : 'Listening started', { message: editing ? '' : 'Backfilling 30 days of mentions.' });
              });
            }
          });
        }
      });

      draw();
    }
  };
})(window.SL);
