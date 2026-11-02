/* ==========================================================================
   Starling — marketing, auth & onboarding behaviour
   Depends on icons.js + ui.js (window.SL)
   ========================================================================== */
(function (SL) {
  'use strict';
  const $ = SL.$, $$ = SL.$$;

  /* ?theme=dark|light, handy for screenshots and demos */
  try {
    const qp = new URLSearchParams(location.search).get('theme');
    if (qp === 'dark' || qp === 'light') { SL.store.set('theme', qp); SL.theme.apply(qp); }
  } catch (e) {}

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------- Shared: field validation helpers ---------- */
  function setError(input, msg) {
    const field = input.closest('.field');
    let err = field && field.querySelector('.field-error');
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      if (!err && field) {
        err = SL.h('<div class="field-error" role="alert" id="' + input.id + '-err"></div>');
        field.appendChild(err);
      }
      if (err) { err.innerHTML = SL.icon('triangle-alert', 14) + '<span>' + SL.esc(msg) + '</span>'; }
      input.setAttribute('aria-describedby', input.id + '-err');
    } else {
      input.removeAttribute('aria-invalid');
      if (err) err.remove();
      const hint = field && field.querySelector('.hint');
      if (hint && hint.id) input.setAttribute('aria-describedby', hint.id); else input.removeAttribute('aria-describedby');
    }
    return !msg;
  }
  function validate(input) {
    const v = input.value.trim();
    const label = input.getAttribute('data-name') || 'This field';
    if (input.required && !v) return setError(input, label + ' is required.');
    if (input.type === 'email' && v && !EMAIL_RE.test(v)) return setError(input, 'Enter a valid email, like name@company.com.');
    const min = +input.getAttribute('data-min');
    if (min && v.length < min) return setError(input, label + ' needs at least ' + min + ' characters.');
    return setError(input, null);
  }
  function wireValidation(form) {
    $$('input[required], input[data-min]', form).forEach(function (inp) {
      inp.addEventListener('blur', function () { if (inp.value || inp.hasAttribute('aria-invalid')) validate(inp); });
      inp.addEventListener('input', function () { if (inp.hasAttribute('aria-invalid')) validate(inp); });
    });
  }
  function validateForm(form) {
    let firstBad = null;
    $$('input[required], input[data-min]', form).forEach(function (inp) {
      if (!validate(inp) && !firstBad) firstBad = inp;
    });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }
  function withLoading(btn, ms, done) {
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    btn.disabled = true;
    setTimeout(function () {
      btn.classList.remove('is-loading');
      btn.removeAttribute('aria-busy');
      btn.disabled = false;
      done();
    }, ms);
  }

  /* ---------- Demo request modal (landing) ---------- */
  function openDemo() {
    SL.modal({
      title: 'Book a live demo',
      subtitle: 'A product specialist will tailor a 30-minute walkthrough to your team.',
      width: 520,
      body:
        '<form id="demo-form" class="stack-4" novalidate>' +
          '<div class="field"><label class="label" for="d-name">Full name<span class="req" aria-hidden="true">*</span></label><input class="input" id="d-name" data-name="Full name" required autocomplete="name" autofocus></div>' +
          '<div class="field"><label class="label" for="d-email">Work email<span class="req" aria-hidden="true">*</span></label><input class="input" id="d-email" type="email" data-name="Work email" required autocomplete="email" placeholder="name@company.com"></div>' +
          '<div class="field"><label class="label" for="d-size">Team size</label><select class="select" id="d-size"><option>1 to 5</option><option selected>6 to 25</option><option>26 to 100</option><option>100+</option></select></div>' +
        '</form>',
      foot: '<button class="btn btn-secondary" type="button" data-close>Cancel</button><button class="btn btn-primary" type="submit" form="demo-form">Request demo</button>',
      onMount: function (el, layer) {
        const form = $('#demo-form', el);
        wireValidation(form);
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!validateForm(form)) return;
          withLoading($('[type="submit"]', el), 900, function () {
            layer.close(true);
            SL.toast('Demo requested', { message: 'We will email you within one business day to pick a time.' });
          });
        });
      }
    });
  }

  /* ==========================================================================
     Landing page
     ========================================================================== */
  function initLanding() {
    const nav = $('.mk-nav');
    const menuBtn = $('.mk-menu-btn');

    const onScroll = function () { nav.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    function setMenu(open) {
      nav.classList.toggle('is-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menuBtn.innerHTML = SL.icon(open ? 'x' : 'menu', 22);
    }
    menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
    $$('#mk-mobile a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
    });
    window.addEventListener('resize', SL.debounce(function () { if (window.innerWidth > 1024) setMenu(false); }, 150));

    /* Billing toggle */
    function setBilling(mode) {
      $$('[data-billing]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-billing') === mode)); });
      $$('[data-price]').forEach(function (p) {
        const v = +p.getAttribute('data-' + mode);
        p.textContent = '$' + v;
        const billed = p.closest('.plan').querySelector('[data-billed]');
        if (billed) billed.textContent = mode === 'annual' ? 'Billed $' + SL.fmt.num(v * 12) + ' yearly' : 'Billed monthly, cancel anytime';
      });
      const save = $('.billing .save');
      if (save) save.style.visibility = mode === 'annual' ? 'visible' : 'hidden';
    }
    $$('[data-billing]').forEach(function (b) { b.addEventListener('click', function () { setBilling(b.getAttribute('data-billing')); }); });

    /* FAQ accordion */
    $$('.faq-q').forEach(function (q) {
      q.addEventListener('click', function () {
        q.setAttribute('aria-expanded', String(q.getAttribute('aria-expanded') !== 'true'));
      });
    });

    $$('[data-demo]').forEach(function (b) { b.addEventListener('click', openDemo); });

    /* Scroll reveal */
    const items = $$('.reveal');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('is-in'); }); return; }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el, i) {
      const sib = el.parentElement ? $$(':scope > .reveal', el.parentElement).indexOf(el) : 0;
      el.style.transitionDelay = Math.min(sib, 4) * 60 + 'ms';
      io.observe(el);
    });
    /* Anything already in view on load shows immediately */
    requestAnimationFrame(function () {
      items.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in'); });
    });
  }

  /* ==========================================================================
     Login / sign up
     ========================================================================== */
  function initAuth() {
    const tabs = $$('.auth [role="tab"]');
    const title = $('#auth-title'), sub = $('#auth-sub');
    const COPY = {
      signin: ['Welcome back', 'Sign in to keep every channel moving.'],
      signup: ['Create your account', 'Start your 14-day free trial. No card required.']
    };
    function show(mode, focus) {
      tabs.forEach(function (t) {
        const on = t.getAttribute('data-mode') === mode;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).hidden = !on;
        if (on && focus) t.focus();
      });
      title.textContent = COPY[mode][0];
      sub.textContent = COPY[mode][1];
      document.title = (mode === 'signup' ? 'Create account' : 'Sign in') + ' · Starling';
      if (location.hash !== '#' + mode) history.replaceState(null, '', '#' + mode);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t.getAttribute('data-mode')); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
          show(n.getAttribute('data-mode'), true);
          e.preventDefault();
        }
      });
    });
    $$('[data-switch]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); show(a.getAttribute('data-switch'), true); });
    });
    window.addEventListener('hashchange', function () { show(location.hash === '#signup' ? 'signup' : 'signin'); });
    show(location.hash === '#signup' ? 'signup' : 'signin');

    /* Show / hide password */
    $$('.pw-toggle').forEach(function (b) {
      b.addEventListener('click', function () {
        const inp = $('#' + b.getAttribute('aria-controls'));
        const showing = inp.type === 'text';
        inp.type = showing ? 'password' : 'text';
        b.textContent = showing ? 'Show' : 'Hide';
        b.setAttribute('aria-pressed', String(!showing));
        b.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      });
    });

    /* Forms */
    const signin = $('#form-signin'), signup = $('#form-signup');
    [signin, signup].forEach(wireValidation);
    signin.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateForm(signin)) return;
      withLoading($('[type="submit"]', signin), 1000, function () {
        SL.store.set('user', { email: $('#si-email').value.trim() });
        location.href = 'app.html#/home';
      });
    });
    signup.addEventListener('submit', function (e) {
      e.preventDefault();
      const terms = $('#su-terms');
      if (!validateForm(signup)) return;
      if (!terms.checked) {
        $('#su-terms-err').hidden = false;
        terms.focus();
        return;
      }
      withLoading($('[type="submit"]', signup), 1100, function () {
        SL.store.set('user', { name: $('#su-name').value.trim(), email: $('#su-email').value.trim() });
        location.href = 'onboarding.html';
      });
    });
    $('#su-terms').addEventListener('change', function () { if (this.checked) $('#su-terms-err').hidden = true; });

    /* SSO buttons */
    $$('[data-sso]').forEach(function (b) {
      b.addEventListener('click', function () {
        withLoading(b, 900, function () { location.href = 'app.html#/home'; });
      });
    });

    /* Forgot password */
    $('#forgot').addEventListener('click', function (e) {
      e.preventDefault();
      SL.modal({
        title: 'Reset your password',
        subtitle: 'We will email you a secure link to choose a new one.',
        width: 460,
        body: '<form id="reset-form" novalidate><div class="field"><label class="label" for="r-email">Email</label><input class="input" id="r-email" type="email" data-name="Email" required autocomplete="email" value="' + SL.esc($('#si-email').value) + '" autofocus></div></form>',
        foot: '<button class="btn btn-secondary" type="button" data-close>Cancel</button><button class="btn btn-primary" type="submit" form="reset-form">Send reset link</button>',
        onMount: function (el, layer) {
          const f = $('#reset-form', el);
          wireValidation(f);
          f.addEventListener('submit', function (ev) {
            ev.preventDefault();
            if (!validateForm(f)) return;
            withLoading($('[type="submit"]', el), 800, function () {
              layer.close(true);
              SL.toast('Check your inbox', { message: 'A reset link is on its way to ' + $('#r-email', el).value.trim() + '.' });
            });
          });
        }
      });
    });
  }

  /* ==========================================================================
     Onboarding
     ========================================================================== */
  function initOnboarding() {
    const NET_KIND = {
      instagram: 'Business account', facebook: 'Page', linkedin: 'Company page',
      x: 'Profile', tiktok: 'Business account', youtube: 'Channel', pinterest: 'Business account', threads: 'Profile'
    };
    const GOALS = [
      { id: 'grow', icon: 'users', t: 'Grow audience', d: 'Reach new followers on the networks that matter.' },
      { id: 'traffic', icon: 'link', t: 'Drive traffic', d: 'Turn posts into site visits and sales.' },
      { id: 'care', icon: 'message-circle', t: 'Customer care', d: 'Answer every comment and DM quickly.' },
      { id: 'awareness', icon: 'megaphone', t: 'Brand awareness', d: 'Stay top of mind with consistent posting.' },
      { id: 'commerce', icon: 'tag', t: 'Social commerce', d: 'Sell products directly in feeds and stories.' },
      { id: 'listening', icon: 'radio-tower', t: 'Listening', d: 'Track sentiment and what people say about you.' }
    ];
    const defaults = { workspace: 'Nexora', industry: 'Technology & SaaS', team: '6-25', connected: [], goals: ['awareness', 'grow'], invites: ['meera@nexora.io'], role: 'Editor' };
    /* v2 key: state saved before the demo brand changed must not leak back in */
    const state = Object.assign({}, defaults, SL.store.get('onboarding:v2', {}));
    const save = function () { SL.store.set('onboarding:v2', state); };
    const live = SL.h('<div class="sr-only" role="status" aria-live="polite"></div>');
    document.body.appendChild(live);
    const announce = function (msg) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 50); };
    let step = 1;
    const TOTAL = 4;

    /* Step 1 */
    const ws = $('#ob-ws'), ind = $('#ob-industry');
    ws.value = state.workspace;
    ind.value = state.industry;
    wireValidation($('#ob-panel-1'));
    $$('#ob-team button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === state.team));
      b.addEventListener('click', function () {
        state.team = b.getAttribute('data-v');
        $$('#ob-team button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });

    /* Step 2: networks */
    const grid = $('#ob-nets');
    Object.keys(SL.NETWORKS).forEach(function (k) {
      const n = SL.NETWORKS[k];
      const row = SL.h(
        '<div class="net-item" data-k="' + k + '">' + SL.netBadge(k, 36) +
          '<div class="grow"><div class="name">' + n.name + '</div><div class="kind">' + NET_KIND[k] + '</div></div>' +
          '<button class="btn btn-secondary btn-sm" type="button" aria-label="Connect ' + n.name + '">Connect</button>' +
        '</div>'
      );
      const btn = $('button', row);
      const paint = function () {
        const on = state.connected.indexOf(k) > -1;
        row.classList.toggle('is-connected', on);
        btn.innerHTML = on ? SL.icon('check', 16) + ' Connected' : 'Connect';
        btn.setAttribute('aria-label', (on ? 'Disconnect ' : 'Connect ') + n.name);
        btn.setAttribute('aria-pressed', String(on));
      };
      btn.addEventListener('click', function () {
        const on = state.connected.indexOf(k) > -1;
        if (on) { state.connected = state.connected.filter(function (x) { return x !== k; }); paint(); updateBar(); announce(n.name + ' disconnected.'); return; }
        withLoading(btn, 700, function () {
          state.connected.push(k);
          paint(); updateBar();
          /* The row itself shows the result; a toast per network would pile up over the action bar */
          announce(n.name + ' connected. Starling can now publish and pull analytics.');
        });
      });
      paint();
      grid.appendChild(row);
    });

    /* Step 3: goals */
    const goalGrid = $('#ob-goals');
    GOALS.forEach(function (g) {
      const b = SL.h(
        '<button type="button" class="goal" aria-pressed="' + (state.goals.indexOf(g.id) > -1) + '">' +
          '<span class="g-ic">' + SL.icon(SL.ICONS[g.icon] ? g.icon : 'target', 20) + '</span>' +
          '<span class="g-txt"><b>' + g.t + '</b><span class="g-desc">' + g.d + '</span></span>' +
          '<span class="tick" aria-hidden="true">' + SL.icon('check', 14) + '</span>' +
        '</button>'
      );
      b.addEventListener('click', function () {
        const i = state.goals.indexOf(g.id);
        if (i > -1) state.goals.splice(i, 1); else state.goals.push(g.id);
        b.setAttribute('aria-pressed', String(i < 0));
        updateBar();
      });
      goalGrid.appendChild(b);
    });

    /* Step 4: invites */
    const box = $('#ob-invite-box'), inv = $('#ob-invite');
    const role = $('#ob-role'), roleHint = $('#ob-role-hint');
    const ROLE_HINT = {
      Admin: 'Admins manage channels, billing and team settings.',
      Editor: 'Editors create, schedule and publish posts.',
      Contributor: 'Contributors draft posts that need approval before publishing.',
      Viewer: 'Viewers see the planner and analytics but cannot post.'
    };
    role.value = state.role;
    const paintRole = function () { roleHint.textContent = ROLE_HINT[role.value] || ''; };
    role.addEventListener('change', paintRole);
    paintRole();
    function renderChips() {
      $$('.email-chip', box).forEach(function (c) { c.remove(); });
      state.invites.forEach(function (em) {
        const c = SL.h('<span class="email-chip">' + SL.esc(em) + '<button type="button" aria-label="Remove ' + SL.esc(em) + '">' + SL.icon('x', 14) + '</button></span>');
        $('button', c).addEventListener('click', function () {
          state.invites = state.invites.filter(function (x) { return x !== em; });
          renderChips(); inv.focus();
        });
        box.insertBefore(c, inv);
      });
      if (typeof updateBar === 'function' && step === TOTAL) updateBar();
      $('#ob-invite-count').textContent = state.invites.length ? state.invites.length + ' invite' + (state.invites.length > 1 ? 's' : '') + ' ready' : 'No invites yet';
    }
    function addEmail() {
      const v = inv.value.trim().replace(/,$/, '');
      if (!v) return true;
      if (!EMAIL_RE.test(v)) { setError(inv, 'That does not look like an email address.'); return false; }
      setError(inv, null);
      if (state.invites.indexOf(v) < 0) state.invites.push(v);
      inv.value = '';
      renderChips();
      return true;
    }
    inv.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEmail(); }
      else if (e.key === 'Backspace' && !inv.value && state.invites.length) { state.invites.pop(); renderChips(); }
    });
    inv.addEventListener('blur', function () { if (inv.value.trim()) addEmail(); });
    box.addEventListener('click', function (e) { if (e.target === box) inv.focus(); });
    $('#ob-invite-add').addEventListener('click', function () { addEmail(); inv.focus(); });
    renderChips();

    /* Navigation */
    const back = $('#ob-back'), next = $('#ob-next');
    function updateBar() {
      $('#ob-meta').textContent = 'Step ' + Math.min(step, TOTAL) + ' of ' + TOTAL;
      $('#ob-progress').style.width = (Math.min(step, TOTAL) / TOTAL * 100) + '%';
      back.style.visibility = step > 1 ? 'visible' : 'hidden';
      $('.ob-bar').classList.toggle('is-first', step === 1);
      let label = 'Continue';
      if (step === 2 && !state.connected.length) label = 'Skip for now';
      if (step === 3 && !state.goals.length) label = 'Skip for now';
      if (step === TOTAL) label = state.invites.length ? 'Send invites & finish' : 'Finish setup';
      next.innerHTML = '<span>' + label + '</span>' + SL.icon('arrow-right', 18);
      $$('.step').forEach(function (s, i) {
        const n = i + 1;
        s.classList.toggle('is-current', n === step);
        s.classList.toggle('is-done', n < step);
        if (n === step) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current');
        $('.n', s).innerHTML = n < step ? SL.icon('check', 14) : String(n);
      });
      $$('.step-line').forEach(function (l, i) { l.classList.toggle('is-done', i + 1 < step); });
    }
    function go(n) {
      step = n;
      $$('.ob-panel').forEach(function (p) { p.hidden = +p.getAttribute('data-step') !== step; });
      $('.ob-bar').hidden = step > TOTAL;
      $('.steps').style.visibility = step > TOTAL ? 'hidden' : 'visible';
      $('.ob-skip').style.visibility = step > TOTAL ? 'hidden' : 'visible';
      updateBar();
      const h = $('.ob-panel:not([hidden]) h1');
      if (h) h.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (step > TOTAL) renderSummary();
    }
    function renderSummary() {
      const nets = state.connected.map(function (k) { return SL.NETWORKS[k].name; });
      const goals = state.goals.map(function (id) { return GOALS.filter(function (g) { return g.id === id; })[0].t; });
      $('#ob-done-ws').textContent = state.workspace;
      $('#ob-summary').innerHTML =
        '<li>' + SL.icon('circle-check', 18) + '<span><b>' + SL.esc(state.workspace) + '</b> workspace created</span></li>' +
        '<li>' + SL.icon('circle-check', 18) + '<span>' + (nets.length ? nets.length + ' channel' + (nets.length > 1 ? 's' : '') + ' connected: ' + SL.esc(nets.join(', ')) : 'Channels can be connected later in Settings') + '</span></li>' +
        '<li>' + SL.icon('circle-check', 18) + '<span>' + (goals.length ? 'Goals: ' + SL.esc(goals.join(', ')) : 'Goals can be set any time') + '</span></li>' +
        '<li>' + SL.icon('circle-check', 18) + '<span>' + (state.invites.length ? state.invites.length + ' teammate' + (state.invites.length > 1 ? 's' : '') + ' invited as ' + SL.esc(state.role) : 'Invite teammates whenever you are ready') + '</span></li>';
    }
    back.addEventListener('click', function () { if (step > 1) go(step - 1); });
    next.addEventListener('click', function () {
      if (step === 1) {
        if (!validate(ws)) { ws.focus(); return; }
        state.workspace = ws.value.trim();
        state.industry = ind.value;
      }
      if (step === TOTAL) {
        if (!addEmail()) { inv.focus(); return; }
        state.role = role.value;
        save();
        withLoading(next, 900, function () { go(TOTAL + 1); });
        return;
      }
      save();
      go(step + 1);
    });
    let start = 1;
    try { start = Math.min(TOTAL + 1, Math.max(1, parseInt(new URLSearchParams(location.search).get('step'), 10) || 1)); } catch (e) {}
    go(start);
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    const page = document.body.getAttribute('data-page');
    if (page === 'landing') initLanding();
    if (page === 'auth') initAuth();
    if (page === 'onboarding') initOnboarding();
  });
})(window.SL);
