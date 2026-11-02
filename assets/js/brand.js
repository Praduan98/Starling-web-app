/* ==========================================================================
   Starling — Design System page logic
   Renders data-driven sections (color, type, foundations, icons, dataviz)
   and wires the live component demos.
   ========================================================================== */
(function (SL) {
  'use strict';
  const $ = SL.$, $$ = SL.$$, esc = SL.esc;

  /* ---------- ?theme=dark|light (screenshot QA) ---------- */
  const qp = new URLSearchParams(location.search).get('theme');
  if (qp === 'dark' || qp === 'light') { SL.store.set('theme', qp); SL.theme.apply(qp); }
  /* ?section=id isolates one section (review / screenshot previews) */
  const only = new URLSearchParams(location.search).get('section');
  if (only) document.addEventListener('DOMContentLoaded', function () {
    $$('[data-section], .ds-story').forEach(function (s) { if (s.id !== only) s.classList.add('hidden'); });
    const t = document.getElementById(only); if (t) t.style.paddingTop = 'var(--sp-8)';
  });

  /* ---------- Data (mirrors tokens.css) ---------- */
  const PRIMITIVES = [
    { name: 'Rose', note: 'Brand · AllAI rose', items: [['rose-50', '#FFF1F2'], ['rose-100', '#FFE4E6'], ['rose-200', '#FFCCD3'], ['rose-300', '#FFA2AE'], ['rose-400', '#FF667F'], ['rose-500', '#FF2357'], ['rose-600', '#E11D48'], ['rose-700', '#C20039'], ['rose-900', '#8B0836']] },
    { name: 'Orange', note: 'Gradient horizon', items: [['orange-50', '#FFF7ED'], ['orange-100', '#FFEDD5'], ['orange-500', '#FE6E00'], ['orange-600', '#F05100']] },
    { name: 'Slate', note: 'Ink & neutrals', items: [['slate-50', '#F8FAFC'], ['slate-100', '#F1F5F9'], ['slate-200', '#E2E8F0'], ['slate-300', '#CAD5E2'], ['slate-400', '#90A1B9'], ['slate-500', '#62748E'], ['slate-600', '#45556C'], ['slate-700', '#314158'], ['slate-800', '#1D293D'], ['slate-900', '#0F172B'], ['slate-950', '#020618']] },
    { name: 'Support', note: 'Status & accents', items: [['emerald-50', '#ECFDF5'], ['emerald-600', '#00A544'], ['emerald-700', '#007956'], ['amber-50', '#FFFBEB'], ['amber-500', '#F99C00'], ['amber-700', '#B75000'], ['sky-50', '#F0F9FF'], ['sky-600', '#0084CC'], ['violet-50', '#F5F3FF'], ['violet-600', '#7F22FE']] }
  ];
  const INK = '#0F172B';

  /* role, use, light, dark, kind: 'surface' (fg on it) | 'ink' (it on surface) */
  const ROLES = [
    ['--bg', 'Page background', '#FCFCFC', '#050506', 'surface'],
    ['--bg-app', 'App canvas', '#F6F7F9', '#08090B', 'surface'],
    ['--surface', 'Cards, menus', '#FFFFFF', '#0F1013', 'surface'],
    ['--surface-2', 'Muted fills', '#F0F2F5', '#17181C', 'surface'],
    ['--border', 'Hairlines', '#E4E4E4', '#24262B', 'line'],
    ['--fg', 'Headings, primary text', '#0F172B', '#F8F8F8', 'ink'],
    ['--fg-2', 'Body text', '#45556C', '#BEC3CC', 'ink'],
    ['--fg-3', 'Meta, placeholders', '#62748E', '#959AA3', 'ink'],
    ['--brand', 'Primary actions', '#E11D48', '#F93C59', 'ink'],
    ['--brand-ink', 'Brand-colored text', '#BE123C', '#FF7A8F', 'ink'],
    ['--success', 'Published, positive', '#007956', '#3DD49A', 'ink'],
    ['--warning', 'Needs approval', '#B75000', '#FDBA4D', 'ink'],
    ['--danger', 'Errors, destructive', '#D40924', '#FF6B7A', 'ink'],
    ['--info', 'Scheduled, info', '#0068B8', '#5AB4FF', 'ink']
  ];
  const MODE = {
    light: { surface: '#FFFFFF', fg: '#0F172B', fg2: '#45556C', fg3: '#62748E', line: '#EEEFF2', bg: '#FCFCFC', border: '#E4E4E4' },
    dark: { surface: '#0F1013', fg: '#F8F8F8', fg2: '#BEC3CC', fg3: '#959AA3', line: '#1C1E22', bg: '#050506', border: '#24262B' }
  };

  const TYPE = [
    ['--fs-8xl', 72, 1.04, 700, '-0.035em', 'Display · marketing hero', 'Every channel'],
    ['--fs-7xl', 60, 1.05, 700, '-0.035em', 'Display · section hero', 'Moving as one'],
    ['--fs-6xl', 48, 1.1, 700, '-0.03em', 'Marketing H1', 'Schedule smarter'],
    ['--fs-5xl', 36, 1.15, 700, '-0.035em', 'Page title (docs)', 'Plan the whole week'],
    ['--fs-4xl', 30, 1.15, 700, '-0.025em', 'KPI value · H1 app', '1.24M impressions'],
    ['--fs-3xl', 24, 1.2, 700, '-0.025em', 'App page title', 'Good morning, Arjun'],
    ['--fs-2xl', 20, 1.3, 700, '-0.02em', 'Modal title · H2', 'Create a new post'],
    ['--fs-xl', 18, 1.4, 600, '-0.01em', 'Card title · lead', 'Top performing posts this month'],
    ['--fs-lg', 16, 1.5, 400, '0', 'Long-form body · mobile input', 'Flow 3.0 is here: AI agents that plan, run and report.'],
    ['--fs-md', 15, 1.55, 500, '0', 'Marketing nav & body', 'Publish, engage and measure from one place.'],
    ['--fs-base', 14, 1.5, 400, '0', 'App UI default', 'Scheduled for Tue, 9:30 AM on 3 channels.'],
    ['--fs-sm', 13, 1.45, 500, '0', 'Secondary UI · captions', 'Last edited by Meera · 2h ago'],
    ['--fs-xs', 12, 1.4, 600, '0.05em', 'Eyebrows · meta (uppercase)', 'ENGAGEMENT RATE']
  ];
  const SPACING = [['--sp-1', 4], ['--sp-2', 8], ['--sp-3', 12], ['--sp-4', 16], ['--sp-5', 20], ['--sp-6', 24], ['--sp-8', 32], ['--sp-10', 40], ['--sp-12', 48], ['--sp-16', 64], ['--sp-20', 80], ['--sp-24', 96]];
  const RADII = [['--r-xs', '4px', 'Tags'], ['--r-sm', '6px', 'Small buttons'], ['--r-md', '8px', 'Buttons, inputs'], ['--r-lg', '12px', 'Menus, tiles'], ['--r-xl', '16px', 'Cards'], ['--r-2xl', '24px', 'Modals'], ['--r-full', '999px', 'Pills, avatars']];
  const SHADOWS = [['--shadow-xs', 'Inputs, buttons'], ['--shadow-sm', 'Cards at rest'], ['--shadow-md', 'Raised chips'], ['--shadow-lg', 'Hovered tiles'], ['--shadow-xl', 'Menus, hovered cards'], ['--shadow-2xl', 'Modals, drawers']];
  const EASES = [['--ease', 'cubic-bezier(.4,0,.2,1)', 'Standard'], ['--ease-out', 'cubic-bezier(0,0,.2,1)', 'Enter'], ['--ease-in', 'cubic-bezier(.4,0,1,1)', 'Exit'], ['--ease-spring', 'cubic-bezier(.34,1.36,.64,1)', 'Confirm']];
  const SLOTS = [['Crimson', 'Brand', '#E11D48', '#F93C59'], ['Blue', '', '#2A78D6', '#3987E5'], ['Aqua', '', '#1BAF7A', '#199E70'], ['Amber', '', '#EDA100', '#C98500'], ['Violet', '', '#6250D6', '#9085E9']];
  const SEQ = { light: ['#FFF1F2', '#FFCCD3', '#FFA2AE', '#FF667F', '#E11D48', '#A10E35'], dark: ['#1A1013', '#4A1422', '#7A1832', '#B61E45', '#F93C59', '#FF8FA1'] };

  /* ---------- WCAG contrast ---------- */
  function lum(hex) {
    const c = hex.replace('#', '');
    const rgb = [0, 2, 4].map(function (i) {
      const v = parseInt(c.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  function contrast(a, b) {
    const l1 = lum(a), l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function rating(r) {
    if (r >= 7) return ['AAA', 'badge-success'];
    if (r >= 4.5) return ['AA', 'badge-success'];
    if (r >= 3) return ['AA Large', 'badge-warning'];
    return ['Fail', 'badge-danger'];
  }
  function crRow(label, r) {
    const rt = rating(r);
    return '<div class="ds-cr"><span>' + label + ' ' + r.toFixed(2) + '</span><span class="badge ' + rt[1] + '">' + rt[0] + '</span></div>';
  }

  function copy(text, what) {
    const done = function () { SL.toast('Copied ' + (what || text), { type: 'info', duration: 2200 }); };
    try {
      if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(done, done); return; }
    } catch (e) { /* fall through */ }
    const ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove(); done();
  }

  /* ---------- Render: primitives ---------- */
  function renderPrimitives() {
    const host = $('#primitives'); if (!host) return;
    host.innerHTML = PRIMITIVES.map(function (g) {
      return '<div class="ds-ramp"><div class="ds-ramp-label"><h4>' + g.name + '</h4><span>' + g.note + '</span></div>' +
        '<div class="ds-ramp-scroll"><div class="ds-ramp-strip" style="--n:' + g.items.length + '">' + g.items.map(function (it) {
          const w = contrast(it[1], '#FFFFFF'), k = contrast(it[1], INK);
          const best = Math.max(w, k), onChip = w >= k ? '#FFFFFF' : INK, rt = rating(best);
          return '<button type="button" class="ds-step" data-copy="' + it[1] + '" aria-label="' + it[0] + ' ' + it[1] + ', ' + (w >= k ? 'white' : 'ink') + ' text ' + best.toFixed(2) + ' to 1, ' + rt[0] + '. Copy hex">' +
            '<span class="ds-step-chip" style="background:' + it[1] + ';color:' + onChip + '">Aa</span>' +
            '<span class="ds-step-name">' + it[0].replace(/^[a-z]+-/, '') + '</span>' +
            '<span class="ds-step-hex">' + it[1] + '</span>' +
            '<span class="ds-step-cr"><i style="background:' + onChip + '"></i>' + best.toFixed(1) + ' <b class="' + rt[1].replace('badge-', 'cr-') + '">' + rt[0] + '</b></span>' +
            '</button>';
        }).join('') + '</div></div></div>';
    }).join('') + '<p class="ds-ramp-note"><i class="ds-ramp-dot" style="background:#FFFFFF"></i>White or <i class="ds-ramp-dot" style="background:' + INK + '"></i>ink text, whichever reads best, with its WCAG ratio. Click a step to copy its hex.</p>';
  }

  /* ---------- Render: semantic modes (raw values, so both show at once) ---------- */
  function renderModes() {
    const host = $('#modes'); if (!host) return;
    host.innerHTML = ['light', 'dark'].map(function (mode) {
      const m = MODE[mode];
      const rows = ROLES.map(function (r) {
        const val = mode === 'light' ? r[2] : r[3];
        let ratio, lbl;
        if (r[4] === 'surface') { ratio = contrast(m.fg, val); lbl = 'fg on it'; }
        else if (r[4] === 'line') { ratio = contrast(val, m.surface); lbl = 'vs surface'; }
        else { ratio = contrast(val, m.surface); lbl = 'vs surface'; }
        const rt = r[4] === 'line' ? ['Decorative', ''] : rating(ratio);
        const badgeColor = rt[1] === 'badge-success' ? (mode === 'light' ? '#007956' : '#3DD49A') : rt[1] === 'badge-warning' ? (mode === 'light' ? '#B75000' : '#FDBA4D') : rt[1] === 'badge-danger' ? (mode === 'light' ? '#D40924' : '#FF6B7A') : m.fg3;
        return '<div class="ds-role" style="border-color:' + m.line + '">' +
          '<span class="ds-role-chip" style="background:' + val + ';border-color:' + m.border + '"></span>' +
          '<span style="min-width:0"><span class="ds-role-name" style="color:' + m.fg + '">' + r[0] + '</span><br><span class="ds-role-use" style="color:' + m.fg3 + '">' + r[1] + ' · ' + val + '</span></span>' +
          '<span class="ds-role-cr" style="color:' + badgeColor + '">' + (r[4] === 'line' ? rt[0] : ratio.toFixed(2) + ' ' + rt[0]) + '<br><span style="color:' + m.fg3 + ';font-weight:500">' + (r[4] === 'line' ? '' : lbl) + '</span></span>' +
          '</div>';
      }).join('');
      return '<div class="ds-mode" style="background:' + m.surface + ';border-color:' + m.border + '">' +
        '<div class="ds-mode-head" style="color:' + m.fg + '">' + SL.icon(mode === 'light' ? 'sun' : 'moon', 18) + (mode === 'light' ? 'Light' : 'Dark') + ' mode</div>' + rows + '</div>';
    }).join('');
  }

  /* ---------- Render: type scale ---------- */
  function renderType() {
    const host = $('#typescale'); if (!host) return;
    host.innerHTML = TYPE.map(function (t) {
      const upper = t[0] === '--fs-xs';
      return '<div class="ds-scale-row">' +
        '<div class="ds-scale-meta"><span class="tok">' + t[0] + '</span><span class="use">' + t[5] + '</span>' +
        '<span class="spec">' + t[1] + 'px / ' + t[2] + ' · ' + t[3] + ' · ' + (t[4] === '0' ? '0' : t[4]) + '</span></div>' +
        '<div class="ds-scale-sample" style="font-size:' + t[1] + 'px;line-height:' + t[2] + ';font-weight:' + t[3] + ';letter-spacing:' + t[4] + (upper ? ';text-transform:uppercase;color:var(--fg-3)' : '') + '">' + esc(t[6]) + '</div></div>';
    }).join('');
  }

  /* ---------- Render: foundations ---------- */
  function renderFoundations() {
    const sp = $('#spacing');
    if (sp) sp.innerHTML = SPACING.map(function (s) {
      return '<figure class="ds-space-item"><span class="sq" style="width:var(' + s[0] + ');height:var(' + s[0] + ')"></span><figcaption><b>' + s[1] + '</b>' + s[0].replace('--', '') + '</figcaption></figure>';
    }).join('');
    const rd = $('#radius');
    if (rd) rd.innerHTML = RADII.map(function (r) {
      return '<figure><div class="tile" style="border-radius:var(' + r[0] + ')"></div><figcaption><b>' + r[0] + '</b>' + r[1] + ' · ' + r[2] + '</figcaption></figure>';
    }).join('');
    const sh = $('#shadows');
    if (sh) sh.innerHTML = SHADOWS.map(function (s) {
      return '<div class="ds-shadow-card" style="box-shadow:var(' + s[0] + ')"><b>' + s[0] + '</b><span>' + s[1] + '</span></div>';
    }).join('');
    const mo = $('#motion-rows');
    if (mo) mo.innerHTML = EASES.map(function (e) {
      return '<div class="ds-motion-row"><div><div class="tok">' + e[0] + ' · ' + e[2] + '</div><div class="val">' + e[1] + '</div></div>' +
        '<div class="ds-track"><span class="ds-dot" style="transition-timing-function:var(' + e[0] + ')"></span></div></div>';
    }).join('');
  }

  /* ---------- Render: icons ---------- */
  function renderIcons() {
    const grid = $('#icon-grid'); if (!grid) return;
    const names = Object.keys(SL.ICONS).sort();
    grid.innerHTML = names.map(function (n) {
      return '<button type="button" class="ds-icon" data-icon-name="' + n + '" aria-label="Copy icon name ' + n + '">' + SL.icon(n, 24) + '<span>' + n + '</span></button>';
    }).join('') + '<div class="empty ds-icon-empty hidden"><div class="empty-icon">' + SL.icon('search', 24) + '</div><h3>No icons match</h3><p>Try a broader word, such as "arrow", "chart" or "user".</p></div>';
    const count = $('#icon-count');
    const more = $('#icon-more');
    const LIMIT = 48;
    let expanded = false;
    const update = function () {
      const q = ($('#icon-filter').value || '').trim().toLowerCase();
      let shown = 0, matched = 0;
      $$('.ds-icon', grid).forEach(function (b) {
        const hit = !q || b.getAttribute('data-icon-name').indexOf(q) > -1;
        if (hit) matched++;
        const vis = hit && (q || expanded || matched <= LIMIT);
        b.classList.toggle('hidden', !vis); if (vis) shown++;
      });
      $('.ds-icon-empty', grid).classList.toggle('hidden', matched > 0);
      count.textContent = (q ? matched + ' match' + (matched === 1 ? '' : 'es') : names.length + ' icons');
      more.hidden = !!q;
      more.setAttribute('aria-expanded', String(expanded));
      more.innerHTML = SL.icon(expanded ? 'chevron-up' : 'chevron-down', 16) + (expanded ? 'Show fewer' : 'Show all ' + names.length + ' icons');
    };
    more.addEventListener('click', function () {
      expanded = !expanded; update();
      if (!expanded) grid.scrollIntoView({ block: 'nearest' });
    });
    $('#icon-filter').addEventListener('input', SL.debounce(update, 80));
    update();
    grid.addEventListener('click', function (e) {
      const b = e.target.closest('.ds-icon'); if (b) copy(b.getAttribute('data-icon-name'), 'icon "' + b.getAttribute('data-icon-name') + '"');
    });
    const nets = $('#nets');
    if (nets) nets.innerHTML = Object.keys(SL.NETWORKS).map(function (k) {
      return '<span class="ds-net">' + SL.netBadge(k, 32) + SL.NETWORKS[k].name + '</span>';
    }).join('');
  }

  /* ---------- Render: data viz ---------- */
  function renderDataviz() {
    const slots = $('#slots');
    if (slots) slots.innerHTML = SLOTS.map(function (s, i) {
      const ink = function (c) { return contrast(c, '#FFFFFF') >= contrast(c, INK) ? '#FFFFFF' : INK; };
      return '<div class="ds-slot"><div class="ds-slot-chips"><span style="background:' + s[2] + ';color:' + ink(s[2]) + '">Light</span><span style="background:' + s[3] + ';color:' + ink(s[3]) + '">Dark</span></div>' +
        '<div class="ds-slot-meta"><b>' + (i + 1) + ' · ' + s[0] + (s[1] ? ' <span class="badge badge-brand ds-slot-tag">' + s[1] + '</span>' : '') + '</b><code>--series-' + (i + 1) + '</code><br><code>' + s[2] + ' / ' + s[3] + '</code></div></div>';
    }).join('');
    const seq = $('#seq');
    if (seq) seq.innerHTML = ['light', 'dark'].map(function (mode) {
      return '<div><div class="text-xs fw-600 text-muted" style="margin-bottom:6px">' + (mode === 'light' ? 'Light' : 'Dark') + ' · --seq-0 → --seq-5</div><div class="ds-seq">' +
        SEQ[mode].map(function (c, i) {
          const fg = contrast(c, '#FFFFFF') > contrast(c, INK) ? '#FFFFFF' : INK;
          return '<span style="background:' + c + ';color:' + fg + '">' + i + ' · ' + c + '</span>';
        }).join('') + '</div></div>';
    }).join('');
    renderChart();
    renderChartTable();
    let lastW = 0;
    window.addEventListener('resize', SL.debounce(function () {
      const w = ($('#chart') || {}).clientWidth || 0;
      if (Math.abs(w - lastW) > 8) { lastW = w; renderChart(); }
    }, 120));
  }

  /* Example line chart: 2 series, one axis, crosshair tooltip, direct labels, table view */
  function renderChart() {
    const host = $('#chart'); if (!host) return;
    const weeks = ['Aug 11', 'Aug 18', 'Aug 25', 'Sep 1', 'Sep 8', 'Sep 15', 'Sep 22', 'Sep 29', 'Oct 6', 'Oct 13', 'Oct 20', 'Oct 27'];
    const ig = [12.4, 13.1, 12.8, 14.6, 15.2, 14.9, 16.8, 18.1, 17.6, 19.4, 21.2, 22.6];
    const li = [6.2, 6.8, 7.4, 7.1, 8.3, 8.9, 9.4, 9.1, 10.6, 11.2, 11.8, 12.9];
    const W = Math.max(300, Math.round(host.clientWidth || 600)), H = W < 480 ? 220 : 260, pl = 40, pr = 76, pt = 12, pb = 30;
    const max = 25, ticks = [0, 5, 10, 15, 20, 25];
    const x = function (i) { return pl + (i * (W - pl - pr)) / (weeks.length - 1); };
    const y = function (v) { return pt + (1 - v / max) * (H - pt - pb); };
    const path = function (arr) { return arr.map(function (v, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' '); };
    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Line chart: weekly engagements over 12 weeks. Instagram rose from 12.4K to 22.6K; LinkedIn rose from 6.2K to 12.9K.">';
    svg += '<g class="grid">' + ticks.map(function (t) { return '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y(t) + '" y2="' + y(t) + '"/>'; }).join('') + '</g>';
    svg += '<g class="axis">' + ticks.map(function (t) { return '<text x="' + (pl - 8) + '" y="' + (y(t) + 4) + '" text-anchor="end">' + t + 'K</text>'; }).join('') +
      (W < 480 ? [0, 6, 11] : [0, 3, 6, 9, 11]).map(function (i) { return '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + weeks[i] + '</text>'; }).join('') + '</g>';
    svg += '<path d="' + path(li) + '" fill="none" class="s2" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    svg += '<path d="' + path(ig) + '" fill="none" class="s1" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    const last = weeks.length - 1;
    svg += '<circle cx="' + x(last) + '" cy="' + y(ig[last]) + '" r="4" class="f1 pt"/><circle cx="' + x(last) + '" cy="' + y(li[last]) + '" r="4" class="f2 pt"/>';
    svg += '<text class="end-label" x="' + (x(last) + 10) + '" y="' + (y(ig[last]) + 4) + '">Instagram</text>';
    svg += '<text class="end-label" x="' + (x(last) + 10) + '" y="' + (y(li[last]) + 4) + '">LinkedIn</text>';
    svg += '<g class="hover" style="display:none"><line class="xhair" y1="' + pt + '" y2="' + (H - pb) + '"/><circle r="5" class="f1 pt h1"/><circle r="5" class="f2 pt h2"/></g>';
    svg += '<rect class="hit" x="' + pl + '" y="' + pt + '" width="' + (W - pl - pr) + '" height="' + (H - pt - pb) + '" fill="transparent" tabindex="0" aria-label="Chart data. Use left and right arrow keys to move between weeks."/>';
    svg += '</svg>';
    host.innerHTML = svg;

    const el = host.querySelector('svg'), hov = el.querySelector('.hover'), hit = el.querySelector('.hit');
    let idx = last;
    const show = function (i, cx, cy) {
      idx = i;
      hov.style.display = '';
      hov.querySelector('.xhair').setAttribute('x1', x(i)); hov.querySelector('.xhair').setAttribute('x2', x(i));
      hov.querySelector('.h1').setAttribute('cx', x(i)); hov.querySelector('.h1').setAttribute('cy', y(ig[i]));
      hov.querySelector('.h2').setAttribute('cx', x(i)); hov.querySelector('.h2').setAttribute('cy', y(li[i]));
      const html = '<div style="font-weight:700;margin-bottom:4px">Week of ' + weeks[i] + '</div>' +
        '<div style="display:flex;align-items:center;gap:6px"><i style="width:8px;height:8px;border-radius:50%;background:var(--series-1);display:inline-block"></i>Instagram <b style="margin-left:auto;padding-left:12px">' + ig[i].toFixed(1) + 'K</b></div>' +
        '<div style="display:flex;align-items:center;gap:6px"><i style="width:8px;height:8px;border-radius:50%;background:var(--series-2);display:inline-block"></i>LinkedIn <b style="margin-left:auto;padding-left:12px">' + li[i].toFixed(1) + 'K</b></div>';
      if (cx == null) {
        const r = el.getBoundingClientRect(), sc = r.width / W;
        cx = r.left + x(i) * sc; cy = r.top + y(ig[i]) * sc;
      }
      SL.showTipAt(html, cx, cy);
    };
    const hide = function () { hov.style.display = 'none'; SL.hideTip(); };
    hit.addEventListener('mousemove', function (e) {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) * (W / r.width);
      const i = Math.max(0, Math.min(last, Math.round(((px - pl) / (W - pl - pr)) * last)));
      show(i, e.clientX, e.clientY);
    });
    hit.addEventListener('mouseleave', hide);
    hit.addEventListener('focus', function () { show(idx); });
    hit.addEventListener('blur', hide);
    hit.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { show(Math.min(last, idx + 1)); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { show(Math.max(0, idx - 1)); e.preventDefault(); }
    });

  }



  function renderChartTable() {
    const weeks = ['Aug 11', 'Aug 18', 'Aug 25', 'Sep 1', 'Sep 8', 'Sep 15', 'Sep 22', 'Sep 29', 'Oct 6', 'Oct 13', 'Oct 20', 'Oct 27'];
    const ig = [12.4, 13.1, 12.8, 14.6, 15.2, 14.9, 16.8, 18.1, 17.6, 19.4, 21.2, 22.6];
    const li = [6.2, 6.8, 7.4, 7.1, 8.3, 8.9, 9.4, 9.1, 10.6, 11.2, 11.8, 12.9];
    const table = $('#chart-table');
    table.innerHTML = '<table class="table"><caption class="sr-only">Weekly engagements, thousands</caption><thead><tr><th scope="col">Week</th><th scope="col" class="num">Instagram</th><th scope="col" class="num">LinkedIn</th></tr></thead><tbody>' +
      weeks.map(function (w, i) { return '<tr><td>' + w + '</td><td class="num">' + ig[i].toFixed(1) + 'K</td><td class="num">' + li[i].toFixed(1) + 'K</td></tr>'; }).join('') + '</tbody></table>';
    $('#chart-table-toggle').addEventListener('click', function () {
      const open = table.classList.toggle('hidden') === false;
      this.setAttribute('aria-expanded', String(open));
      this.innerHTML = SL.icon(open ? 'chart-line' : 'list', 14) + (open ? 'Chart only' : 'Table view');
    });
  }
  /* ---------- Interactions ---------- */
  function wireSwatchCopy() {
    document.addEventListener('click', function (e) {
      const s = e.target.closest('[data-copy]'); if (s) copy(s.getAttribute('data-copy'));
    });
  }

  function wireMotion() {
    const btn = $('#play-motion'); if (!btn) return;
    let out = false;
    btn.addEventListener('click', function () {
      out = !out;
      $$('.ds-track').forEach(function (t) {
        const dot = t.querySelector('.ds-dot');
        const travel = t.clientWidth - dot.offsetWidth - 8;
        dot.style.transform = out ? 'translateX(' + travel + 'px)' : 'translateX(0)';
      });
      btn.innerHTML = SL.icon(out ? 'rotate-ccw' : 'play', 16) + (out ? 'Play back' : 'Play curves');
    });
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const note = $('#rm-note');
    const sync = function () { note.classList.toggle('is-on', mq.matches); };
    sync();
    if (mq.addEventListener) mq.addEventListener('change', sync);
  }

  function tidyCaptions() {
    $$('.ds-demo-cap').forEach(function (cap) {
      cap.innerHTML = cap.innerHTML.replace(/(^|\s)([.\[\-][^\s·/<]*)/g, function (m, sp, tok) {
        return sp + '<span class="nb">' + tok + '</span>';
      });
    });
  }

  function wireComponents() {
    const load = $('#demo-loading');
    if (load) load.addEventListener('click', function () {
      load.classList.add('is-loading'); load.setAttribute('aria-busy', 'true');
      setTimeout(function () {
        load.classList.remove('is-loading'); load.removeAttribute('aria-busy');
        SL.toast('Published to 3 channels', { message: 'Instagram, LinkedIn and X · just now' });
      }, 1600);
    });

    $$('#demo-chips .chip').forEach(function (c) {
      c.addEventListener('click', function () { c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true')); });
    });

    const tabs = $$('#demo-tabs .tab');
    const selectTab = function (t) {
      tabs.forEach(function (o) { o.setAttribute('aria-selected', String(o === t)); o.tabIndex = o === t ? 0 : -1; });
      $('#demo-tabpanel').textContent = t.getAttribute('data-panel');
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectTab(t); });
      t.addEventListener('keydown', function (e) {
        let n = null;
        if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { n.focus(); selectTab(n); e.preventDefault(); }
      });
    });

    $$('#demo-seg button').forEach(function (b, _, all) {
      b.addEventListener('click', function () { all.forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); }); });
    });

    document.addEventListener('click', function (e) {
      const t = e.target.closest('[data-demo]'); if (!t) return;
      const k = t.getAttribute('data-demo');
      if (k === 'toast-success') SL.toast('Scheduled for Tue, 9:30 AM', { message: 'Going out on Instagram, LinkedIn and X.', action: { label: 'Undo', onClick: function () { SL.toast('Schedule undone', { type: 'info' }); } } });
      if (k === 'toast-error') SL.toast("Instagram didn't accept this video", { type: 'error', message: "It's longer than 90 seconds. Trim it or post it as a Reel." });
      if (k === 'toast-info') SL.toast('Best time suggestion ready', { type: 'info', message: 'Your audience is most active Tue 9–10 AM.' });
      if (k === 'modal') SL.confirm({
        title: 'Delete this scheduled post?',
        message: "It won't be published to LinkedIn or X. You can't undo this.",
        confirm: 'Delete post', danger: true,
        onConfirm: function () { SL.toast('Post deleted', { message: 'Removed from the planner.' }); }
      });
      if (k === 'drawer') SL.drawer({
        title: 'Flow 3.0 launch keynote',
        subtitle: 'Scheduled · Tue 9:30 AM',
        body: '<img src="assets/media/t9.webp" alt="A presenter walking the team through a product demo in a meeting room" style="border-radius:var(--r-lg);aspect-ratio:4/3;object-fit:cover;width:100%">' +
          '<p class="text-2" style="margin-top:16px">Flow 3.0 is here. AI agents that plan, run and report on your workflows, so your team can focus on the work only people can do. #Flow3</p>' +
          '<div class="row wrap" style="margin-top:16px">' + SL.netBadge('linkedin', 24) + SL.netBadge('x', 24) + SL.netBadge('youtube', 24) + '<span class="text-sm text-muted">3 channels</span></div>',
        foot: '<button class="btn btn-secondary" type="button" data-close>Close</button><button class="btn btn-primary ml-auto" type="button" data-close>Edit post</button>'
      });
      if (k === 'menu') SL.menu(t, [
        { heading: 'Post' },
        { label: 'Edit', icon: 'pencil', kbd: 'E' },
        { label: 'Duplicate', icon: 'copy', kbd: 'D' },
        { label: 'Reschedule', icon: 'calendar-clock' },
        'sep',
        { label: 'Delete', icon: 'trash-2', danger: true, onClick: function () { SL.toast('Post deleted', { type: 'info' }); } }
      ]);
    });
  }

  function wireToc() {
    const links = $$('.ds-toc a');
    const toc = $('.ds-toc');
    const byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    const setActive = function (id) {
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      const a = byId[id]; if (!a) return;
      a.setAttribute('aria-current', 'true');
      if (toc.scrollWidth > toc.clientWidth + 4) {
        const left = a.offsetLeft - toc.clientWidth / 2 + a.offsetWidth / 2;
        toc.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
      }
    };
    if (!('IntersectionObserver' in window)) return;
    const seen = {};
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { seen[en.target.id] = en.isIntersecting ? en.boundingClientRect.top : null; });
      let best = null, bestTop = Infinity;
      Object.keys(seen).forEach(function (id) {
        const t = seen[id];
        if (t != null && Math.abs(t) < bestTop) { bestTop = Math.abs(t); best = id; }
      });
      if (best) setActive(best);
    }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
    $$('[data-section]').forEach(function (s) { io.observe(s); });
    setActive('cover');
  }

  function init() {
    renderPrimitives();
    renderModes();
    renderType();
    renderFoundations();
    renderIcons();
    renderDataviz();
    wireSwatchCopy();
    wireMotion();
    wireComponents();
    tidyCaptions();
    wireToc();
    /* Content above anchors renders late; land deep links (brand.html#components) correctly */
    if (location.hash.length > 1) {
      const target = document.getElementById(location.hash.slice(1));
      if (target) setTimeout(function () { window.scrollTo(0, target.getBoundingClientRect().top + window.scrollY - (parseFloat(getComputedStyle(target).scrollMarginTop) || 64)); }, 0);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.SL);
