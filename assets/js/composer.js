/* ==========================================================================
   Starling composer + post detail drawer
   ========================================================================== */
(function (SL) {
  'use strict';
  const $ = SL.$, $$ = SL.$$;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toDateInput(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function toTimeInput(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function longWhen(d) { return SL.fmt.date(d, { weekday: 'short', month: 'short', day: 'numeric' }) + ' at ' + SL.fmt.time(d); }
  SL.longWhen = longWhen;

  function richText(t) {
    return SL.esc(t).replace(/(^|\s)([#@][\w.]+)/g, '$1<span class="tag">$2</span>');
  }

  /* Best-time recommendations (relative to now) */
  function bestTimes() {
    const now = new Date();
    const mk = function (dayOff, h, m, lvl) {
      const d = new Date(SL.today.getTime() + dayOff * SL.DAY); d.setHours(h, m, 0, 0);
      return { d: d, lvl: lvl };
    };
    const c = [mk(0, 12, 30, 3), mk(0, 17, 30, 2), mk(1, 8, 15, 3), mk(1, 12, 0, 2), mk(2, 17, 30, 3)];
    return c.filter(function (x) { return x.d > now; }).slice(0, 3);
  }

  /* Canned AI rewrites — the prototype simulates Starling AI */
  const AI = {
    idea: function (idea) {
      const i = idea.trim().replace(/\.$/, '');
      return 'Big news from Nexora: ' + i.charAt(0).toLowerCase() + i.slice(1) + '.\n\nBuilt with our customers, tested by our own teams every day, and rolling out to every workspace from Monday.\n\nWhat would you automate first? #Flow3 #FutureOfWork';
    },
    shorter: function (t) {
      const first = t.split(/(?<=[.!?])\s/)[0] || t;
      return first.length > 20 ? first + ' #Flow3' : t;
    },
    playful: function (t) { return 'Okay, ops people. ' + t.replace(/\.$/, '') + '. Your move. #LifeAtNexora'; },
    professional: function (t) { return t.replace(/!+/g, '.').replace(/Okay, ops people\. /, '').replace(/ Your move\./, '') + '\n\nLearn more at nexora.io'; },
    hashtags: function (t) { return t.replace(/\s+$/, '') + (/#\w/.test(t) ? ' #AIAgents #FutureOfWork' : '\n\n#Nexora #AIAgents #FutureOfWork'); },
    polish: function (t) { return t.replace(/\s{2,}/g, ' ').replace(/\bi\b/g, 'I').replace(/^\w/, function (c) { return c.toUpperCase(); }); }
  };

  /* ======================================================================
     Composer
     ====================================================================== */
  SL.compose = function (opts) {
    opts = opts || {};
    if ($('.composer')) return;
    const editing = opts.post || null;
    const conn = SL.data.channels.filter(function (c) { return c.connected; });
    const defaultDate = opts.date ? new Date(opts.date) : (function () { const d = new Date(SL.today.getTime() + SL.DAY); d.setHours(9, 0, 0, 0); return d; })();
    if (opts.date) { defaultDate.setHours(9, 0, 0, 0); if (defaultDate < new Date()) { const n = new Date(); n.setMinutes(0, 0, 0); n.setHours(n.getHours() + 2); defaultDate.setTime(Math.max(defaultDate.getTime(), n.getTime())); } }
    const state = {
      channels: editing ? editing.channels.slice() : (opts.channels || ['li', 'x', 'ig']),
      text: editing ? editing.text : (opts.text || ''),
      media: editing ? editing.media.slice() : (opts.media || []),
      mode: 'schedule',
      when: editing ? new Date(editing.date) : defaultDate,
      campaign: editing ? editing.campaign : '',
      firstComment: '',
      preview: null,
      dirty: false
    };

    const el = SL.h(
      '<section class="composer" aria-labelledby="cmpTitle">' +
        '<header class="cmp-head">' +
          '<span class="ai-badge" style="width:32px;height:32px">' + SL.icon('square-pen', 16) + '</span>' +
          '<div class="grow"><h2 id="cmpTitle">' + (editing ? 'Edit post' : 'Create post') + '</h2></div>' +
          '<span class="text-sm text-muted" id="cmpSaved" aria-live="polite"></span>' +
          '<button class="icon-btn" type="button" data-x aria-label="Close composer">' + SL.icon('x', 20) + '</button>' +
        '</header>' +
        '<div class="cmp-grid">' +
          '<div class="cmp-main">' +
            '<section aria-labelledby="chLbl">' +
              '<div class="cmp-section-title" id="chLbl">Publish to<span class="hint" id="chHint"></span></div>' +
              '<div class="ch-picker" id="chPicker" role="group" aria-labelledby="chLbl"></div>' +
              '<div class="field-error" id="chErr" role="alert" hidden style="margin-top:8px"></div>' +
            '</section>' +
            '<section aria-labelledby="ctLbl">' +
              '<div class="cmp-section-title"><label id="ctLbl" for="cmpText">Content</label><span class="hint">Shared across channels · customise per network in preview</span></div>' +
              '<div class="editor" id="editor">' +
                '<textarea id="cmpText" placeholder="What would you like to share? Try “/” for templates, or ask Starling AI." aria-describedby="cmpCounters"></textarea>' +
                '<div class="editor-media" id="cmpMedia"></div>' +
                '<div class="editor-bar">' +
                  '<button class="icon-btn icon-btn-sm" type="button" data-act="media" aria-label="Add media from library" data-tip="Add media">' + SL.icon('image', 18) + '</button>' +
                  '<button class="icon-btn icon-btn-sm" type="button" data-act="hashtags" aria-label="Insert hashtag set" data-tip="Hashtag sets">' + SL.icon('hash', 18) + '</button>' +
                  '<button class="icon-btn icon-btn-sm" type="button" data-act="mention" aria-label="Mention an account" data-tip="Mention">' + SL.icon('at-sign', 18) + '</button>' +
                  '<button class="icon-btn icon-btn-sm" type="button" data-act="template" aria-label="Insert template" data-tip="Templates">' + SL.icon('file-text', 18) + '</button>' +
                  '<button class="icon-btn icon-btn-sm" type="button" data-act="link" aria-label="Add tracked link" data-tip="Tracked link">' + SL.icon('link', 18) + '</button>' +
                  '<button class="btn btn-sm ai-btn" type="button" data-act="ai" aria-haspopup="menu">' + SL.icon('sparkles', 16) + 'Starling AI</button>' +
                  '<div class="counters" id="cmpCounters" aria-live="polite"></div>' +
                '</div>' +
              '</div>' +
              '<div class="field-error" id="txtErr" role="alert" hidden style="margin-top:8px"></div>' +
            '</section>' +
            '<section id="fcWrap" hidden>' +
              '<div class="field"><label class="label" for="cmpFirst">First comment <span class="text-muted fw-500">(Instagram)</span></label>' +
              '<input class="input" id="cmpFirst" placeholder="Add hashtags or a link here to keep your caption clean"></div>' +
            '</section>' +
            '<section aria-labelledby="whenLbl">' +
              '<div class="cmp-section-title" id="whenLbl">When to publish</div>' +
              '<div class="sched-opts" role="radiogroup" aria-labelledby="whenLbl">' +
                '<label class="sched-opt is-selected"><input type="radio" name="mode" value="schedule" checked>' + SL.icon('calendar-clock', 18) + '<span><b>Schedule</b><span>Pick a date and time</span></span></label>' +
                '<label class="sched-opt"><input type="radio" name="mode" value="auto">' + SL.icon('wand-sparkles', 18) + '<span><b>Best time</b><span>Starling picks peak engagement</span></span></label>' +
                '<label class="sched-opt"><input type="radio" name="mode" value="now">' + SL.icon('send', 18) + '<span><b>Post now</b><span>Publish immediately</span></span></label>' +
              '</div>' +
              '<div id="whenFields" class="form-grid" style="margin-top:14px">' +
                '<div class="field"><label class="label" for="cmpDate">Date</label><input class="input" type="date" id="cmpDate"></div>' +
                '<div class="field"><label class="label" for="cmpTime">Time <span class="text-muted fw-500">(IST)</span></label><input class="input" type="time" id="cmpTime" step="300"></div>' +
              '</div>' +
              '<div id="bestWrap"><div class="text-xs text-muted" style="margin-top:12px">Recommended for your audience</div><div class="best-times" id="bestTimes"></div></div>' +
            '</section>' +
            '<section class="form-grid">' +
              '<div class="field"><label class="label" for="cmpCampaign">Campaign</label><select class="select" id="cmpCampaign"><option value="">No campaign</option>' +
                SL.data.campaigns.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></div>' +
              '<div class="field"><label class="label" for="cmpApprover">Approval</label><select class="select" id="cmpApprover"><option value="">Not required</option><option value="u4">Priya Nair · Brand Director</option></select></div>' +
            '</section>' +
          '</div>' +
          '<aside class="cmp-side" aria-label="Preview">' +
            '<div class="cmp-section-title">' + SL.icon('eye', 16) + 'Preview</div>' +
            '<div class="segmented pv-tabs" id="pvTabs" role="tablist" aria-label="Preview network"></div>' +
            '<div class="pv-wrap" id="pvWrap"></div>' +
            '<div class="pv-note">' + SL.icon('lightbulb', 16) + '<span id="pvTip">Posts with an image get <b>2.3×</b> more engagement on Instagram for Nexora.</span></div>' +
          '</aside>' +
        '</div>' +
        '<footer class="cmp-foot">' +
          '<span class="status-text" id="cmpStatus">' + SL.icon('clock', 14) + '<span></span></span>' +
          '<span class="grow"></span>' +
          '<button class="btn btn-ghost" type="button" data-submit="draft">Save draft</button>' +
          '<button class="btn btn-secondary" type="button" data-submit="approval">' + SL.icon('badge-check', 16) + 'Send for approval</button>' +
          '<button class="btn btn-gradient" type="button" data-submit="primary" id="cmpPrimary">' + SL.icon('calendar-clock', 16) + '<span>Schedule</span></button>' +
        '</footer>' +
      '</section>'
    );

    const layer = SL.openLayer({
      el: el, label: editing ? 'Edit post' : 'Create post',
      guard: function () {
        if (!state.dirty) return true;
        SL.confirm({ title: 'Discard this post?', message: 'You have unsaved changes. Save it as a draft from the composer, or discard it.', confirm: 'Discard', danger: true, onConfirm: function () { state.dirty = false; layer.close(true); } });
        return false;
      }
    });
    el.querySelector('[data-x]').addEventListener('click', function () { layer.close(); });

    const ta = $('#cmpText', el);
    ta.value = state.text;
    $('#cmpDate', el).value = toDateInput(state.when);
    $('#cmpTime', el).value = toTimeInput(state.when);
    $('#cmpCampaign', el).value = state.campaign || '';

    function markDirty() { state.dirty = true; $('#cmpSaved', el).textContent = 'Unsaved changes'; }

    /* Channels */
    function drawChannels() {
      $('#chPicker', el).innerHTML = SL.data.channels.map(function (c) {
        const on = state.channels.indexOf(c.id) > -1;
        return '<button type="button" class="ch-pick" data-ch="' + c.id + '" aria-pressed="' + on + '"' + (c.connected ? '' : ' disabled data-tip="Reconnect Threads in Settings to publish here"') + '>' +
          '<span class="avatar avatar-sm" style="--av:28px">' + SL.netBadge(c.net, 28) + '</span>' +
          '<span class="ch-meta"><span>' + SL.NETWORKS[c.net].name + '</span><small' + (c.connected ? '' : ' class="warn"') + '>' + (c.connected ? SL.esc(c.handle) : 'Reconnect needed') + '</small></span>' +
          '<span class="ch-check">' + SL.icon('check', 12) + '</span></button>';
      }).join('');
      $('#chHint', el).textContent = state.channels.length + ' of ' + conn.length + ' selected';
    }
    $('#chPicker', el).addEventListener('click', function (e) {
      const b = e.target.closest('.ch-pick'); if (!b || b.disabled) return;
      const id = b.getAttribute('data-ch'); const i = state.channels.indexOf(id);
      if (i > -1) state.channels.splice(i, 1); else state.channels.push(id);
      $('#chErr', el).hidden = true;
      markDirty(); drawChannels(); update();
    });

    /* Media */
    function drawMedia() {
      $('#cmpMedia', el).innerHTML = state.media.map(function (m, i) {
        return '<div class="editor-thumb"><img src="' + m + '" alt="Attached media ' + (i + 1) + '"><button type="button" data-rm="' + i + '" aria-label="Remove media ' + (i + 1) + '">' + SL.icon('x', 12) + '</button></div>';
      }).join('');
    }
    $('#cmpMedia', el).addEventListener('click', function (e) {
      const b = e.target.closest('[data-rm]'); if (!b) return;
      state.media.splice(+b.getAttribute('data-rm'), 1); markDirty(); drawMedia(); update();
    });

    /* Counters + preview */
    function counters() {
      const len = ta.value.length;
      const nets = []; state.channels.forEach(function (id) { const n = SL.data.channel(id).net; if (nets.indexOf(n) < 0) nets.push(n); });
      $('#cmpCounters', el).innerHTML = nets.map(function (n) {
        const lim = SL.data.limits[n]; const left = lim - len;
        const cls = left < 0 ? 'is-over' : (len > lim * 0.9 ? 'is-warn' : '');
        return '<span class="counter ' + cls + '" title="' + SL.NETWORKS[n].name + ' limit ' + SL.fmt.num(lim) + '">' + SL.netBadge(n, 16) +
          (left < 0 ? SL.icon('triangle-alert', 12) : '') + (lim > 9999 ? SL.fmt.num(len) : SL.fmt.num(left)) + '</span>';
      }).join('');
    }
    function previewNets() {
      const nets = []; state.channels.forEach(function (id) { const n = SL.data.channel(id).net; if (nets.indexOf(n) < 0) nets.push(n); });
      return nets;
    }
    function drawPreviewTabs() {
      const nets = previewNets();
      if (nets.indexOf(state.preview) < 0) state.preview = nets[0] || null;
      $('#pvTabs', el).innerHTML = nets.map(function (n) {
        return '<button type="button" role="tab" aria-selected="' + (n === state.preview) + '" data-pv="' + n + '" aria-label="' + SL.NETWORKS[n].name + ' preview"' + (n === state.preview ? '' : ' data-tip="' + SL.NETWORKS[n].name + '"') + '>' + SL.net(n, 14) + '<span>' + SL.NETWORKS[n].name + '</span></button>';
      }).join('');
      $('#pvTabs', el).hidden = !nets.length;
    }
    $('#pvTabs', el).addEventListener('click', function (e) {
      const b = e.target.closest('[data-pv]'); if (!b) return;
      state.preview = b.getAttribute('data-pv'); drawPreviewTabs(); drawPreview();
    });
    function drawPreview() {
      const n = state.preview, t = ta.value, img = state.media[0];
      const ch = SL.data.channels.find(function (c) { return c.net === n; }) || SL.data.channels[0];
      const body = t ? richText(t) : '<span class="text-muted">Your caption will appear here.</span>';
      const imgTag = function (cls) { return img ? '<img class="pv-img ' + (cls || '') + '" src="' + img + '" alt="">' : ''; };
      const brand = SL.brandMark(34);
      const B = SL.data.brand;
      let html = '';
      if (!n) html = '<div class="empty"><div class="empty-icon">' + SL.icon('eye', 22) + '</div><h3>No channels selected</h3><p>Pick at least one channel to see a live preview.</p></div>';
      else if (n === 'instagram') html = '<article class="pv"><div class="pv-head">' + brand + '<div class="grow"><div class="pv-name">' + B.slug + '</div><div class="pv-sub">' + B.location + '</div></div>' + SL.icon('ellipsis', 18) + '</div>' +
        (img ? imgTag('ratio-45') : '<div class="pv-placeholder">' + SL.icon('image', 24) + '<span>Instagram needs a photo or video</span></div>') +
        '<div class="pv-actions">' + SL.icon('heart', 22) + SL.icon('message-circle', 22) + SL.icon('send', 22) + '<span class="ml-auto">' + SL.icon('bookmark', 22) + '</span></div>' +
        '<div class="pv-body"><b>' + B.slug + '</b> ' + body + '</div></article>';
      else if (n === 'x' || n === 'threads') html = '<article class="pv"><div class="pv-x">' + brand + '<div class="grow"><div><b>' + B.name + '</b> <span class="pv-sub">' + B.handle + ' · now</span></div>' +
        '<div class="pv-body">' + body + '</div>' + imgTag() +
        '<div class="pv-x-actions"><span>' + SL.icon('message-circle', 16) + '0</span><span>' + SL.icon('repeat-2', 16) + '0</span><span>' + SL.icon('heart', 16) + '0</span><span>' + SL.icon('chart-column', 16) + '0</span></div></div></div></article>';
      else if (n === 'linkedin') html = '<article class="pv"><div class="pv-head">' + brand + '<div class="grow"><div class="pv-name">' + B.name + '</div><div class="pv-sub">' + SL.fmt.num(SL.data.channel('li').followers) + ' followers · now · ' + SL.icon('globe', 11) + '</div></div></div>' +
        '<div class="pv-body">' + body + '</div>' + imgTag('ratio-169') +
        '<div class="pv-li-actions"><span>' + SL.icon('thumbs-up', 16) + 'Like</span><span>' + SL.icon('message-square', 16) + 'Comment</span><span>' + SL.icon('repeat-2', 16) + 'Repost</span><span>' + SL.icon('send', 16) + 'Send</span></div></article>';
      else if (n === 'tiktok') html = '<article class="pv pv-tiktok"><div class="pv-tt">' + (img ? '<img src="' + img + '" alt="">' : '') +
        '<div class="pv-tt-rail"><span>' + SL.icon('heart', 26) + '0</span><span>' + SL.icon('message-circle', 26) + '0</span><span>' + SL.icon('bookmark', 26) + '0</span><span>' + SL.icon('share-2', 26) + 'Share</span></div>' +
        '<div class="pv-tt-overlay"><b>' + B.handle + '</b><div class="clamp-3" style="margin-top:4px">' + (t ? SL.esc(t) : 'Your caption will appear here.') + '</div></div></div></article>';
      else if (n === 'youtube') html = '<article class="pv">' + (img ? imgTag('ratio-169') : '<div class="pv-placeholder" style="aspect-ratio:16/9">' + SL.icon('video', 24) + '<span>Add a video</span></div>') +
        '<div class="pv-head" style="align-items:flex-start">' + brand + '<div class="grow"><div class="pv-name clamp-2">' + (t ? SL.esc(t.split('\n')[0]) : 'Video title') + '</div><div class="pv-sub">' + B.name + ' · Scheduled</div></div></div></article>';
      else if (n === 'pinterest') html = '<article class="pv" style="max-width:260px">' + (img ? '<img class="pv-img" style="aspect-ratio:2/3" src="' + img + '" alt="">' : '<div class="pv-placeholder" style="aspect-ratio:2/3">' + SL.icon('image', 24) + '</div>') +
        '<div class="pv-body" style="padding-top:12px"><b class="clamp-2">' + (t ? SL.esc(t.split(/[.!?]/)[0]) : 'Pin title') + '</b><div class="pv-sub" style="margin-top:6px">' + B.name + '</div></div></article>';
      else html = '<article class="pv"><div class="pv-head">' + brand + '<div class="grow"><div class="pv-name">' + B.name + '</div><div class="pv-sub">Just now · ' + SL.icon('globe', 11) + '</div></div>' + SL.icon('ellipsis', 18) + '</div>' +
        '<div class="pv-body">' + body + '</div>' + imgTag('ratio-169') +
        '<div class="pv-li-actions"><span>' + SL.icon('thumbs-up', 16) + 'Like</span><span>' + SL.icon('message-circle', 16) + 'Comment</span><span>' + SL.icon('share-2', 16) + 'Share</span></div></article>';
      $('#pvWrap', el).innerHTML = html;
      const tips = {
        instagram: 'Posts with an image get <b>2.3×</b> more engagement on Instagram for Nexora.',
        x: 'Keep it under <b>120 characters</b>: your shortest posts on X earn the most replies.',
        linkedin: 'LinkedIn posts that open with a number get <b>41%</b> more clicks for your page.',
        tiktok: 'Behind-the-scenes clips under <b>30 seconds</b> are your best performers on TikTok.',
        facebook: 'Facebook links with a custom image get <b>1.8×</b> more clicks.',
        youtube: 'Titles under <b>60 characters</b> are fully visible in search.',
        pinterest: 'Vertical 2:3 images get the most saves on Pinterest.',
        threads: 'Conversational questions drive the most replies on Threads.'
      };
      $('#pvTip', el).innerHTML = tips[n] || tips.instagram;
      $('#fcWrap', el).hidden = state.channels.indexOf('ig') < 0;
    }

    function statusLine() {
      const mode = state.mode;
      const s = $('#cmpStatus span', el);
      const nCh = state.channels.length;
      const prim = $('#cmpPrimary span', el);
      if (mode === 'now') { s.textContent = 'Publishes immediately to ' + nCh + ' channel' + (nCh === 1 ? '' : 's'); prim.textContent = 'Post now'; }
      else { s.textContent = (mode === 'auto' ? 'Best time · ' : '') + longWhen(state.when) + ' · ' + nCh + ' channel' + (nCh === 1 ? '' : 's'); prim.textContent = editing ? 'Update' : 'Schedule'; }
    }

    function update() { counters(); drawPreviewTabs(); drawPreview(); statusLine(); }

    ta.addEventListener('input', function () { $('#txtErr', el).hidden = true; $('#editor', el).classList.remove('is-invalid'); markDirty(); counters(); drawPreview(); });

    /* Schedule mode */
    function drawBest() {
      $('#bestTimes', el).innerHTML = bestTimes().map(function (b, i) {
        const on = Math.abs(b.d - state.when) < 60000;
        return '<button type="button" class="best-time" data-bt="' + b.d.toISOString() + '" aria-pressed="' + on + '">' +
          '<span class="lvl" aria-hidden="true"><i class="' + (b.lvl >= 1 ? 'on' : '') + '"></i><i class="' + (b.lvl >= 2 ? 'on' : '') + '"></i><i class="' + (b.lvl >= 3 ? 'on' : '') + '"></i></span>' +
          longWhen(b.d) + '<span class="sr-only">, ' + (b.lvl === 3 ? 'high' : 'good') + ' engagement</span></button>';
      }).join('');
    }
    $('#bestTimes', el).addEventListener('click', function (e) {
      const b = e.target.closest('[data-bt]'); if (!b) return;
      state.when = new Date(b.getAttribute('data-bt'));
      $('#cmpDate', el).value = toDateInput(state.when); $('#cmpTime', el).value = toTimeInput(state.when);
      markDirty(); drawBest(); statusLine();
    });
    function readWhen() {
      const d = $('#cmpDate', el).value, t = $('#cmpTime', el).value;
      if (d && t) state.when = new Date(d + 'T' + t);
      drawBest(); statusLine();
    }
    $('#cmpDate', el).addEventListener('change', function () { markDirty(); readWhen(); });
    $('#cmpTime', el).addEventListener('change', function () { markDirty(); readWhen(); });
    $$('.sched-opt input', el).forEach(function (r) {
      r.addEventListener('change', function () {
        state.mode = r.value;
        $$('.sched-opt', el).forEach(function (o) { o.classList.toggle('is-selected', o.contains(r)); });
        $('#whenFields', el).hidden = state.mode !== 'schedule';
        $('#bestWrap', el).hidden = state.mode === 'now';
        if (state.mode === 'auto') { state.when = bestTimes()[0].d; $('#cmpDate', el).value = toDateInput(state.when); $('#cmpTime', el).value = toTimeInput(state.when); drawBest(); }
        statusLine();
      });
    });

    /* Toolbar actions */
    function insertAtCursor(txt) {
      const s = ta.selectionStart, e = ta.selectionEnd, v = ta.value;
      ta.value = v.slice(0, s) + txt + v.slice(e);
      ta.selectionStart = ta.selectionEnd = s + txt.length;
      ta.focus(); ta.dispatchEvent(new Event('input'));
    }
    function typeInto(text) {
      const ed = $('#editor', el);
      if (reduce) { ta.value = text; ta.dispatchEvent(new Event('input')); return; }
      ed.classList.add('is-ai'); ta.value = '';
      let i = 0;
      const step = Math.max(2, Math.round(text.length / 60));
      (function tick() {
        i += step; ta.value = text.slice(0, i); counters(); drawPreview();
        if (i < text.length) setTimeout(tick, 16);
        else { ed.classList.remove('is-ai'); ta.dispatchEvent(new Event('input')); ta.focus(); }
      })();
    }
    function ideaPrompt() {
      SL.modal({
        title: 'Write with Starling AI', subtitle: 'Describe your idea. Starling drafts it in the Nexora brand voice.', width: 520,
        body: '<div class="field"><label class="label" for="aiIdea">What is the post about?</label>' +
          '<textarea class="textarea" id="aiIdea" style="min-height:96px" autofocus placeholder="e.g. AI agents for Nexora Flow launch on Monday"></textarea>' +
          '<div class="row wrap" style="margin-top:6px">' + ['Flow 3.0 webinar next Thursday', 'Our new Bengaluru office', 'Meet the 2026 intern cohort'].map(function (s) { return '<button class="chip" type="button" data-sugg>' + s + '</button>'; }).join('') + '</div></div>' +
          '<div class="field" style="margin-top:16px"><span class="label">Tone</span><div class="segmented" role="radiogroup" aria-label="Tone"><button type="button" aria-pressed="true">Confident</button><button type="button" aria-pressed="false">Playful</button><button type="button" aria-pressed="false">Professional</button></div></div>',
        foot: '<button class="btn btn-secondary" data-close type="button">Cancel</button><button class="btn btn-gradient" type="button" data-gen>' + SL.icon('sparkles', 16) + 'Generate</button>',
        onMount: function (m, l) {
          $$('[data-sugg]', m).forEach(function (b) { b.addEventListener('click', function () { $('#aiIdea', m).value = b.textContent; }); });
          $$('.segmented button', m).forEach(function (b) { b.addEventListener('click', function () { $$('.segmented button', m).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
          $('[data-gen]', m).addEventListener('click', function () {
            const idea = $('#aiIdea', m).value.trim() || 'AI agents for Nexora Flow launch on Monday';
            const btn = this; btn.classList.add('is-loading');
            setTimeout(function () { l.close(true); markDirty(); typeInto(AI.idea(idea)); if (!state.media.length) { state.media = ['assets/media/t7.webp']; drawMedia(); } }, 650);
          });
        }
      });
    }
    function aiMenu(anchor) {
      const run = function (fn, label) {
        return function () {
          if (!ta.value.trim()) { ideaPrompt(); return; }
          markDirty(); typeInto(AI[fn](ta.value));
          SL.toast('Starling AI: ' + label, { type: 'info', message: 'Not quite right? Press Ctrl+Z to undo.', duration: 3000 });
        };
      };
      SL.menu(anchor, [
        { heading: 'Starling AI' },
        { label: 'Write from an idea…', icon: 'wand-sparkles', onClick: ideaPrompt },
        { label: 'Make it shorter', icon: 'minimize-2', onClick: run('shorter', 'shortened') },
        { label: 'More playful', icon: 'smile', onClick: run('playful', 'more playful') },
        { label: 'More professional', icon: 'building-2', onClick: run('professional', 'more professional') },
        { label: 'Suggest hashtags', icon: 'hash', onClick: run('hashtags', 'hashtags added') },
        { label: 'Fix grammar and tone', icon: 'check-check', onClick: run('polish', 'polished') }
      ], { width: 240 });
    }
    function mediaPicker() {
      const sel = state.media.slice();
      SL.modal({
        title: 'Add media', subtitle: 'Choose from your library. Up to 10 items.', width: 760,
        body: '<div class="lib-grid" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px">' + SL.data.assets.map(function (a) {
          const on = sel.indexOf(a.src) > -1;
          return '<button type="button" class="card asset" data-src="' + a.src + '" aria-pressed="' + on + '">' +
            '<div class="asset-media"><img src="' + a.src + '" alt="" loading="lazy">' + (a.type === 'Video' ? '<span class="asset-type">' + SL.icon('play', 10) + a.duration + '</span>' : '') + '</div>' +
            '<div class="asset-body" style="padding:8px 10px"><span class="asset-name truncate" style="font-size:12px">' + SL.esc(a.name) + '</span></div></button>';
        }).join('') + '</div>',
        foot: '<span class="text-sm text-muted grow" id="mpCount"></span><button class="btn btn-secondary" data-close type="button">Cancel</button><button class="btn btn-primary" type="button" data-ok>Add to post</button>',
        onMount: function (m, l) {
          const cnt = function () { $('#mpCount', m).textContent = sel.length + ' selected'; };
          cnt();
          $$('.asset', m).forEach(function (b) {
            b.addEventListener('click', function () {
              const s = b.getAttribute('data-src'); const i = sel.indexOf(s);
              if (i > -1) sel.splice(i, 1); else if (sel.length < 10) sel.push(s);
              const on = sel.indexOf(s) > -1;
              b.setAttribute('aria-pressed', String(on));
              cnt();
            });
          });
          $('[data-ok]', m).addEventListener('click', function () { state.media = sel; markDirty(); drawMedia(); update(); l.close(true); });
        }
      });
    }
    el.querySelector('.editor-bar').addEventListener('click', function (e) {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'ai') aiMenu(b);
      else if (act === 'media') mediaPicker();
      else if (act === 'hashtags') SL.menu(b, [{ heading: 'Hashtag sets' }].concat(SL.data.hashtagSets.map(function (h) {
        return { label: h.name, icon: 'hash', html: '<span class="col"><b class="text-sm">' + h.name + '</b><span class="text-xs text-muted truncate" style="max-width:220px">' + h.tags.join(' ') + '</span></span>', onClick: function () { insertAtCursor((ta.value && !/\s$/.test(ta.value) ? ' ' : '') + h.tags.join(' ')); } };
      })), { width: 280 });
      else if (act === 'template') SL.menu(b, [{ heading: 'Templates' }].concat(SL.data.templates.map(function (t) {
        return { label: t.name, icon: 'file-text', onClick: function () { ta.value = t.text; ta.focus(); ta.dispatchEvent(new Event('input')); } };
      })), { width: 260 });
      else if (act === 'mention') insertAtCursor('@');
      else if (act === 'link') insertAtCursor((ta.value && !/\s$/.test(ta.value) ? ' ' : '') + 'nexora.io/flow?utm_source=starling');
    });
    ta.addEventListener('keydown', function (e) {
      if (e.key === '/' && (ta.selectionStart === 0 || /\s/.test(ta.value[ta.selectionStart - 1]))) {
        e.preventDefault(); el.querySelector('[data-act="template"]').click();
      }
    });

    /* Submit */
    function validate(kind) {
      let ok = true;
      if (!state.channels.length) { const er = $('#chErr', el); er.innerHTML = SL.icon('triangle-alert', 14) + 'Choose at least one channel to publish to.'; er.hidden = false; ok = false; }
      const t = ta.value.trim();
      if (kind !== 'draft') {
        const over = state.channels.map(function (id) { return SL.data.channel(id).net; }).filter(function (n) { return t.length > SL.data.limits[n]; });
        const needsMedia = state.channels.some(function (id) { return ['ig', 'tt', 'yt', 'pin'].indexOf(id) > -1; }) && !state.media.length;
        const er = $('#txtErr', el);
        if (!t && !state.media.length) { er.innerHTML = SL.icon('triangle-alert', 14) + 'Write a caption or add media before publishing.'; er.hidden = false; ok = false; }
        else if (over.length) { er.innerHTML = SL.icon('triangle-alert', 14) + 'Too long for ' + over.map(function (n) { return SL.NETWORKS[n].name; }).join(', ') + '. Shorten it, or ask Starling AI to make it shorter.'; er.hidden = false; ok = false; }
        else if (needsMedia) { er.innerHTML = SL.icon('triangle-alert', 14) + 'Instagram, TikTok, YouTube and Pinterest need at least one image or video. Add media from the library.'; er.hidden = false; ok = false; }
        if (kind !== 'now' && state.mode !== 'now' && state.when < new Date()) { SL.toast('Pick a time in the future', { type: 'error', message: 'That time has already passed. Choose a later slot or use Post now.' }); ok = false; }
      }
      $('#editor', el).classList.toggle('is-invalid', !$('#txtErr', el).hidden);
      if (!ok) { const first = el.querySelector('.field-error:not([hidden])'); if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (!$('#txtErr', el).hidden) ta.focus(); }
      return ok;
    }
    $$('[data-submit]', el).forEach(function (b) {
      b.addEventListener('click', function () {
        let kind = b.getAttribute('data-submit');
        if (kind === 'primary') kind = state.mode === 'now' ? 'now' : 'schedule';
        if ($('#cmpApprover', el).value && kind === 'schedule') kind = 'approval';
        if (!validate(kind)) return;
        b.classList.add('is-loading');
        setTimeout(function () {
          const post = editing || { id: 'p' + Date.now(), author: 'u1', metrics: null };
          post.channels = state.channels.slice();
          post.text = ta.value.trim();
          post.media = state.media.slice();
          post.campaign = $('#cmpCampaign', el).value;
          post.date = (kind === 'now' ? new Date() : state.when).toISOString();
          post.status = kind === 'now' ? 'published' : kind === 'draft' ? 'draft' : kind === 'approval' ? 'approval' : 'scheduled';
          if (kind === 'now') post.metrics = { reach: 0, impressions: 0, likes: 0, comments: 0, shares: 0, clicks: 0 };
          if (!editing) SL.data.posts.push(post);
          SL.data.save('posts');
          state.dirty = false;
          layer.close(true);
          const n = post.channels.length + ' channel' + (post.channels.length === 1 ? '' : 's');
          const msg = {
            now: ['Published', 'Live now on ' + n + '.'],
            draft: ['Draft saved', 'Find it in the Planner whenever you are ready.'],
            approval: ['Sent for approval', 'Priya Nair will review it. You will be notified when it is approved.'],
            schedule: [editing ? 'Post updated' : 'Post scheduled', longWhen(post.date) + ' · ' + n]
          }[kind];
          SL.toast(msg[0], { message: msg[1], action: { label: 'View', onClick: function () { SL.openPost(post.id); } } });
          SL.updateCounts();
          SL.refresh();
        }, 700);
      });
    });

    /* AI auto-open */
    drawChannels(); drawMedia(); drawBest(); update();
    if (opts.ai) setTimeout(ideaPrompt, 220);
    else setTimeout(function () { ta.focus(); }, 60);
  };

  /* ======================================================================
     Post detail drawer
     ====================================================================== */
  SL.openPost = function (id) {
    const p = SL.data.posts.find(function (x) { return x.id === id; });
    if (!p) return;
    const author = SL.data.member(p.author);
    const m = p.metrics;
    const canEdit = p.status !== 'published';
    const body =
      '<div class="stack-4">' +
        '<div class="row between">' + SL.statusLabel(p.status) + SL.channelBadges(p.channels, 24) + '</div>' +
        (p.media.length ? (p.media.length === 1 ? '<img class="pv-media" src="' + p.media[0] + '" alt="">' : '<div class="pv-media-row">' + p.media.map(function (x) { return '<img src="' + x + '" alt="">'; }).join('') + '</div>') : '') +
        '<p style="white-space:pre-wrap;line-height:1.6">' + richText(p.text) + '</p>' +
        (p.note ? '<div class="appr-note">' + SL.icon('message-square', 16) + '<span>' + SL.esc(p.note) + '</span></div>' : '') +
        (m && m.reach ? '<div><div class="cmp-section-title">' + SL.icon('chart-column', 16) + 'Performance</div><div class="metric-grid">' +
          [['Reach', m.reach], ['Impressions', m.impressions], ['Likes', m.likes], ['Comments', m.comments], ['Shares', m.shares], ['Link clicks', m.clicks]].map(function (k) {
            return '<div class="metric"><b>' + SL.fmt.compact(k[1]) + '</b><span>' + k[0] + '</span></div>';
          }).join('') + '</div></div>' : '') +
        '<hr><dl class="kv">' +
          '<dt>' + (p.status === 'published' ? 'Published' : 'Scheduled for') + '</dt><dd>' + longWhen(p.date) + '</dd>' +
          '<dt>Channels</dt><dd>' + p.channels.map(function (c) { const ch = SL.data.channel(c); return SL.netBadge(ch.net, 18) + '<span class="text-sm">' + SL.esc(ch.handle) + '</span>'; }).join('') + '</dd>' +
          '<dt>Created by</dt><dd><span class="avatar avatar-xs"><img src="' + author.avatar + '" alt=""></span>' + SL.esc(author.name) + '</dd>' +
          '<dt>Campaign</dt><dd>' + (p.campaign ? '<span class="badge badge-brand">' + SL.esc(p.campaign) + '</span>' : '<span class="text-muted">None</span>') + '</dd>' +
        '</dl>' +
      '</div>';
    SL.drawer({
      title: p.status === 'published' ? 'Published post' : 'Post details',
      subtitle: SL.fmt.date(p.date, { weekday: 'long', month: 'long', day: 'numeric' }),
      body: body, width: 460,
      foot: (p.status === 'approval' ? '<button class="btn btn-primary" type="button" data-approve>' + SL.icon('check', 16) + 'Approve</button>' : '') +
        (canEdit ? '<button class="btn btn-' + (p.status === 'approval' ? 'secondary' : 'primary') + '" type="button" data-edit>' + SL.icon('pencil', 16) + 'Edit</button>' : '<button class="btn btn-primary" type="button" data-boost>' + SL.icon('rocket', 16) + 'Boost post</button>') +
        '<button class="btn btn-secondary" type="button" data-dup>' + SL.icon('copy', 16) + 'Duplicate</button>' +
        '<span class="grow"></span><button class="icon-btn" type="button" data-del aria-label="Delete post" data-tip="Delete">' + SL.icon('trash-2', 18) + '</button>',
      onMount: function (el, layer) {
        const ed = el.querySelector('[data-edit]');
        if (ed) ed.addEventListener('click', function () { layer.close(true); setTimeout(function () { SL.compose({ post: p }); }, 120); });
        const ap = el.querySelector('[data-approve]');
        if (ap) ap.addEventListener('click', function () { p.status = 'scheduled'; SL.data.save('posts'); layer.close(true); SL.toast('Approved and scheduled', { message: longWhen(p.date) }); SL.updateCounts(); SL.refresh(); });
        const bo = el.querySelector('[data-boost]');
        if (bo) bo.addEventListener('click', function () { SL.toast('Boost set up', { type: 'info', message: '$50 over 5 days to lookalike audiences. Review in Ads Manager.' }); });
        el.querySelector('[data-dup]').addEventListener('click', function () {
          layer.close(true);
          setTimeout(function () { SL.compose({ text: p.text, media: p.media.slice(), channels: p.channels.slice() }); }, 120);
        });
        el.querySelector('[data-del]').addEventListener('click', function () {
          SL.confirm({
            title: 'Delete this post?', message: 'It will be removed from the planner' + (p.status === 'published' ? ' (it stays live on the networks).' : ' and will not be published.'), confirm: 'Delete post', danger: true,
            onConfirm: function () {
              const i = SL.data.posts.indexOf(p);
              SL.data.posts.splice(i, 1); SL.data.save('posts'); layer.close(true); SL.updateCounts(); SL.refresh();
              SL.toast('Post deleted', { action: { label: 'Undo', onClick: function () { SL.data.posts.splice(i, 0, p); SL.data.save('posts'); SL.updateCounts(); SL.refresh(); } } });
            }
          });
        });
      }
    });
  };
})(window.SL);
