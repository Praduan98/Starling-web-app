/* ==========================================================================
   Starling charts — dependency-free SVG/HTML charts
   Mark specs: 2px lines, 4px rounded data-ends on the baseline, ≥8px markers,
   recessive grid, one y-axis, crosshair tooltip (mouse + keyboard), legends for
   ≥2 series (clickable), text in ink tokens — never in the series colour.
   ========================================================================== */
window.SL = window.SL || {};
(function (SL) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const C = {};

  function nice(max, ticks) {
    if (max <= 0) return { max: 1, step: 1 };
    const raw = max / ticks;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    return { max: Math.ceil(max / step) * step, step: step };
  }
  C.nice = nice;

  function observe(el, draw) {
    draw();
    if (!window.ResizeObserver) return;
    let w = el.clientWidth;
    const ro = new ResizeObserver(SL.debounce(function () {
      if (!el.isConnected) { ro.disconnect(); return; }
      if (Math.abs(el.clientWidth - w) > 4) { w = el.clientWidth; draw(); }
    }, 120));
    ro.observe(el);
  }

  /* Legend (HTML) — toggles series visibility, colour stays with the entity */
  function legend(series, hidden, onToggle) {
    const wrap = document.createElement('div');
    wrap.className = 'legend';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Chart series');
    series.forEach(function (s, i) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'legend-item';
      b.setAttribute('aria-pressed', String(!hidden[i]));
      b.innerHTML = '<span class="legend-swatch" style="background:' + s.color + '"></span>' + SL.esc(s.name);
      b.addEventListener('click', function () { onToggle(i); });
      wrap.appendChild(b);
    });
    return wrap;
  }

  /* ---------- Line / area chart ---------- */
  C.line = function (el, o) {
    const hidden = o.series.map(function () { return false; });
    const H = o.height || 260;
    const yf = o.yFormat || SL.fmt.compact;
    const xf = o.xFormat || function (d) { return SL.fmt.date(d); };
    el.classList.add('chart');

    function draw() {
      el.innerHTML = '';
      if (o.series.length > 1) el.appendChild(legend(o.series, hidden, function (i) {
        if (hidden.filter(function (x) { return !x; }).length === 1 && !hidden[i]) return; // keep ≥1 visible
        hidden[i] = !hidden[i]; draw();
      }));
      const W = Math.max(280, el.clientWidth);
      const padL = 44, padR = o.directLabels ? 92 : 12, padT = 12, padB = 28;
      const iw = W - padL - padR, ih = H - padT - padB;
      const vis = o.series.filter(function (_, i) { return !hidden[i]; });
      let max = 0;
      vis.forEach(function (s) { s.values.forEach(function (v) { if (v > max) max = v; }); });
      const sc = nice(max * 1.05, 4);
      const n = o.labels.length;
      const x = function (i) { return padL + (n === 1 ? iw / 2 : (i / (n - 1)) * iw); };
      const y = function (v) { return padT + ih - (v / sc.max) * ih; };

      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('width', W); svg.setAttribute('height', H);
      svg.setAttribute('class', 'chart-svg');
      svg.setAttribute('role', 'img');
      svg.setAttribute('tabindex', '0');
      svg.setAttribute('aria-label', o.summary || (o.title || 'Line chart'));

      let g = '';
      // grid + y ticks
      for (let v = 0; v <= sc.max + 1e-9; v += sc.step) {
        const yy = y(v);
        g += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + yy + '" y2="' + yy + '" class="grid' + (v === 0 ? ' base' : '') + '"/>';
        g += '<text x="' + (padL - 10) + '" y="' + (yy + 4) + '" class="tick" text-anchor="end">' + yf(v) + '</text>';
      }
      // x ticks
      const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 84))));
      for (let i = 0; i < n; i += every) {
        g += '<text x="' + x(i) + '" y="' + (H - 8) + '" class="tick" text-anchor="middle">' + xf(o.labels[i]) + '</text>';
      }
      // series
      const ends = [];
      o.series.forEach(function (s, si) {
        if (hidden[si]) return;
        const pts = s.values.map(function (v, i) { return [x(i), y(v)]; });
        const d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
        if (o.area && vis.length === 1) {
          const gid = SL.uid('ga');
          g += '<defs><linearGradient id="' + gid + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:' + s.color + ';stop-opacity:.22"/><stop offset="1" style="stop-color:' + s.color + ';stop-opacity:0"/></linearGradient></defs>';
          g += '<path d="' + d + 'L' + x(n - 1) + ' ' + y(0) + 'L' + x(0) + ' ' + y(0) + 'Z" fill="url(#' + gid + ')"/>';
        }
        g += '<path d="' + d + '" fill="none" style="stroke:' + s.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" class="series-line"/>';
        ends.push({ s: s, y: pts[n - 1][1], x: pts[n - 1][0] });
      });
      // direct labels at line ends (de-collided)
      if (o.directLabels) {
        ends.sort(function (a, b) { return a.y - b.y; });
        for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 15) ends[i].y = ends[i - 1].y + 15;
        ends.forEach(function (e) {
          g += '<circle cx="' + e.x + '" cy="' + y(e.s.values[n - 1]) + '" r="4" style="fill:' + e.s.color + '" class="end-dot"/>';
          g += '<text x="' + (e.x + 10) + '" y="' + (e.y + 4) + '" class="dlabel">' + SL.esc(e.s.name) + '</text>';
        });
      }
      // annotations
      (o.annotations || []).forEach(function (a) {
        const xx = x(a.index);
        g += '<line x1="' + xx + '" x2="' + xx + '" y1="' + padT + '" y2="' + (padT + ih) + '" class="annot-line"/>';
        g += '<text x="' + (xx + 6) + '" y="' + (padT + 12) + '" class="annot">' + SL.esc(a.label) + '</text>';
      });
      // hover layer
      g += '<line class="xhair" x1="0" x2="0" y1="' + padT + '" y2="' + (padT + ih) + '" style="opacity:0"/>';
      g += '<g class="hover-dots"></g>';
      g += '<rect class="hit" x="' + padL + '" y="' + padT + '" width="' + iw + '" height="' + ih + '" fill="transparent"/>';
      svg.innerHTML = g;
      el.appendChild(svg);

      const xh = svg.querySelector('.xhair');
      const dots = svg.querySelector('.hover-dots');
      let cur = -1;
      function show(i, cx, cy) {
        cur = i;
        xh.setAttribute('x1', x(i)); xh.setAttribute('x2', x(i)); xh.style.opacity = 1;
        dots.innerHTML = o.series.map(function (s, si) {
          return hidden[si] ? '' : '<circle cx="' + x(i) + '" cy="' + y(s.values[i]) + '" r="4.5" style="fill:' + s.color + '" class="hover-dot"/>';
        }).join('');
        const rows = o.series.map(function (s, si) {
          return hidden[si] ? '' : '<div class="tt-row"><span class="tt-sw" style="background:' + s.color + '"></span>' + SL.esc(s.name) + '<b>' + (o.tipFormat || SL.fmt.num)(s.values[i]) + '</b></div>';
        }).join('');
        SL.showTipAt('<div class="tt-title">' + SL.fmt.date(o.labels[i], { weekday: 'short', month: 'short', day: 'numeric' }) + '</div>' + rows, cx, cy);
      }
      function hide() { xh.style.opacity = 0; dots.innerHTML = ''; SL.hideTip(); cur = -1; }
      const hit = svg.querySelector('.hit');
      hit.addEventListener('mousemove', function (e) {
        const r = svg.getBoundingClientRect();
        const px = (e.clientX - r.left) * (W / r.width);
        const i = Math.max(0, Math.min(n - 1, Math.round(((px - padL) / iw) * (n - 1))));
        show(i, e.clientX, e.clientY);
      });
      hit.addEventListener('mouseleave', hide);
      svg.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const i = Math.max(0, Math.min(n - 1, (cur < 0 ? n - 1 : cur + (e.key === 'ArrowRight' ? 1 : -1))));
        const r = svg.getBoundingClientRect();
        show(i, r.left + x(i) * (r.width / W), r.top + padT + 20);
      });
      svg.addEventListener('blur', hide);
    }
    observe(el, draw);
  };

  /* ---------- Vertical bars (single series) ---------- */
  C.bars = function (el, o) {
    const H = o.height || 220;
    const yf = o.yFormat || SL.fmt.compact;
    el.classList.add('chart');
    function draw() {
      el.innerHTML = '';
      const W = Math.max(260, el.clientWidth);
      const padL = 40, padR = 8, padT = 10, padB = 28;
      const iw = W - padL - padR, ih = H - padT - padB;
      const n = o.values.length;
      const sc = nice(Math.max.apply(null, o.values) * 1.08, 4);
      const band = iw / n, bw = Math.max(4, Math.min(36, band - 2 - band * 0.28));
      const y = function (v) { return padT + ih - (v / sc.max) * ih; };
      let g = '';
      for (let v = 0; v <= sc.max + 1e-9; v += sc.step) {
        g += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + y(v) + '" y2="' + y(v) + '" class="grid' + (v === 0 ? ' base' : '') + '"/>';
        g += '<text x="' + (padL - 8) + '" y="' + (y(v) + 4) + '" class="tick" text-anchor="end">' + yf(v) + '</text>';
      }
      const every = Math.max(1, Math.ceil(n / Math.floor(iw / 44)));
      o.values.forEach(function (v, i) {
        const cx = padL + band * i + band / 2, top = y(v), base = y(0), hgt = Math.max(0, base - top), r = Math.min(4, bw / 2, hgt);
        const x0 = cx - bw / 2, x1 = cx + bw / 2;
        const d = 'M' + x0 + ' ' + base + 'V' + (top + r) + 'Q' + x0 + ' ' + top + ' ' + (x0 + r) + ' ' + top + 'H' + (x1 - r) + 'Q' + x1 + ' ' + top + ' ' + x1 + ' ' + (top + r) + 'V' + base + 'Z';
        g += '<path d="' + d + '" style="fill:' + (o.highlight === i ? 'var(--series-1)' : (o.color || 'var(--series-1)')) + '" class="bar' + (o.highlight != null && o.highlight !== i && !o.color ? ' bar-dim' : '') + '"/>';
        g += '<rect x="' + (cx - band / 2) + '" y="' + padT + '" width="' + band + '" height="' + ih + '" fill="transparent" class="bar-hit" data-i="' + i + '"/>';
        if (i % every === 0) g += '<text x="' + cx + '" y="' + (H - 8) + '" class="tick" text-anchor="middle">' + SL.esc(o.labels[i]) + '</text>';
      });
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('width', W); svg.setAttribute('height', H);
      svg.setAttribute('class', 'chart-svg');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', o.summary || 'Bar chart');
      svg.innerHTML = g;
      el.appendChild(svg);
      SL.$$('.bar-hit', svg).forEach(function (h) {
        h.addEventListener('mousemove', function (e) {
          const i = +h.getAttribute('data-i');
          SL.showTipAt('<div class="tt-title">' + SL.esc(o.labels[i]) + '</div><div class="tt-row">' + SL.esc(o.name || 'Value') + '<b>' + (o.tipFormat || SL.fmt.num)(o.values[i]) + '</b></div>', e.clientX, e.clientY);
        });
        h.addEventListener('mouseleave', SL.hideTip);
      });
    }
    observe(el, draw);
  };

  /* ---------- Horizontal bars (HTML, accessible, direct-labelled) ---------- */
  C.hbars = function (items, o) {
    o = o || {};
    const max = o.max || Math.max.apply(null, items.map(function (i) { return i.value; }));
    return '<ul class="hbars" role="list">' + items.map(function (it) {
      const w = Math.max(1.5, (it.value / max) * 100);
      return '<li class="hbar">' +
        '<div class="hbar-label">' + (it.lead || '') + '<span class="truncate">' + SL.esc(it.label) + '</span></div>' +
        '<div class="hbar-track"><span class="hbar-fill" style="width:' + w + '%;background:' + (it.color || 'var(--series-1)') + '"></span></div>' +
        '<div class="hbar-val tabular">' + (o.format || SL.fmt.compact)(it.value) + (it.extra || '') + '</div>' +
      '</li>';
    }).join('') + '</ul>';
  };

  /* ---------- Sparkline (string) ---------- */
  C.spark = function (values, o) {
    o = o || {};
    const W = o.w || 96, H = o.h || 32, pad = 2;
    const min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    const span = max - min || 1;
    const pts = values.map(function (v, i) { return [pad + (i / (values.length - 1)) * (W - pad * 2), pad + (H - pad * 2) - ((v - min) / span) * (H - pad * 2)]; });
    const d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
    const gid = SL.uid('sp');
    const col = o.color || 'var(--chart-axis)';
    const dot = o.dot || 'var(--brand)';
    return '<svg class="spark" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<defs><linearGradient id="' + gid + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" style="stop-color:' + col + ';stop-opacity:.14"/><stop offset="1" style="stop-color:' + col + ';stop-opacity:0"/></linearGradient></defs>' +
      '<path d="' + d + 'L' + (W - pad) + ' ' + H + 'L' + pad + ' ' + H + 'Z" fill="url(#' + gid + ')"/>' +
      '<path d="' + d + '" fill="none" style="stroke:' + col + '" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="' + pts[pts.length - 1][0] + '" cy="' + pts[pts.length - 1][1] + '" r="3" style="fill:' + dot + '"/></svg>';
  };

  /* ---------- Heatmap (HTML grid, sequential rose ramp) ---------- */
  C.heatmap = function (rows, cols, values, o) {
    o = o || {};
    let max = 0; values.forEach(function (r) { r.forEach(function (v) { if (v > max) max = v; }); });
    const step = function (v) { const t = v / max; return t < 0.12 ? 0 : t < 0.3 ? 1 : t < 0.48 ? 2 : t < 0.66 ? 3 : t < 0.84 ? 4 : 5; };
    let html = '<div class="heatmap" role="table" aria-label="' + SL.esc(o.label || 'Heatmap') + '" style="--cols:' + cols.length + '">';
    html += '<div role="row" class="hm-row hm-head"><span role="columnheader"></span>' + cols.map(function (c, i) { return '<span role="columnheader" class="hm-col">' + (i % (o.colEvery || 3) === 0 ? c : '') + '</span>'; }).join('') + '</div>';
    rows.forEach(function (r, ri) {
      html += '<div role="row" class="hm-row"><span role="rowheader" class="hm-rowlabel">' + r + '</span>';
      values[ri].forEach(function (v, ci) {
        const s = step(v);
        html += '<span role="cell" class="hm-cell" style="background:var(--seq-' + s + ')" data-tip="<b>' + r + ' ' + cols[ci] + '</b><br>' + (o.format || SL.fmt.pct)(v) + ' ' + (o.unit || 'engagement') + '" tabindex="-1"><span class="sr-only">' + r + ' ' + cols[ci] + ': ' + (o.format || SL.fmt.pct)(v) + '</span></span>';
      });
      html += '</div>';
    });
    html += '</div><div class="hm-legend"><span class="text-xs text-muted">Lower</span>' + [0, 1, 2, 3, 4, 5].map(function (i) { return '<span style="background:var(--seq-' + i + ')"></span>'; }).join('') + '<span class="text-xs text-muted">Higher</span></div>';
    return html;
  };

  /* ---------- 100% segmented bar (HTML) ---------- */
  C.segments = function (parts) {
    return '<div class="segbar" role="img" aria-label="' + parts.map(function (p) { return p.label + ' ' + p.value + '%'; }).join(', ') + '">' +
      parts.map(function (p) { return '<span style="flex:' + p.value + ';background:' + p.color + '"></span>'; }).join('') + '</div>' +
      '<ul class="seg-legend">' + parts.map(function (p) {
        return '<li>' + (p.icon ? SL.icon(p.icon, 16) : '<span class="legend-swatch" style="background:' + p.color + '"></span>') + '<span>' + SL.esc(p.label) + '</span><b class="tabular">' + p.value + '%</b></li>';
      }).join('') + '</ul>';
  };

  /* ---------- CSV export ---------- */
  C.downloadCSV = function (filename, rows) {
    const csv = rows.map(function (r) { return r.map(function (c) { const s = String(c == null ? '' : c); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(','); }).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  };

  SL.chart = C;
})(window.SL);
