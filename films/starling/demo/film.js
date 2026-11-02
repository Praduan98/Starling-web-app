// Starling Demo: a 60 s product film (16:9, dark), built on the motion-film runtime. Storyboard approved 2026-11-02:
// the noise → the flock becomes the mark → sign in → home → composer + AI → planner → inbox → streams + listening →
// analytics → library + approvals → montage → end card. Cuts sit on the 2 s bar grid; every visual is a pure function of t.
"use strict";

const BRAND = FILM.palette.brand;
// Starling's dark-theme roles (assets/css/tokens.css)
const C = {
  ink: "#050506", s1: "#0F1013", s2: "#17181C", s3: "#1F2126", bd: "#24262B", bd2: "#33363D",
  fg: "#F8F8F8", fg2: "#BEC3CC", fg3: "#959AA3", brand: "#F93C59", brandInk: "#FF7A8F", g0: "#FF4D73", g1: "#FF8A2B",
  rose: "#FF2357", orange: "#FE6E00", ok: "#3DD49A", warn: "#FDBA4D", info: "#5AB4FF", bad: "#FF6B7A", blue: "#3987E5",
};

// ================================================================ small helpers
const IMG = (n) => `media/${n}.webp`;
const ICO = (n, s, col) => `<span class="ico" style="width:${s}px;height:${s}px${col ? ";color:" + col : ""}">${SL.icon(n, s)}</span>`;
const NET = (k, s, sq) => `<span class="nb nb-${k}${sq ? " sq" : ""}" style="width:${s}px;height:${s}px">${SL.net(k, Math.round(s * 0.56))}</span>`;
const AV = (n, s, k, ns) => `<span class="avw" style="width:${s}px;height:${s}px"><img class="av" decoding="sync" src="${IMG(n)}" style="width:${s}px;height:${s}px">${k ? NET(k, ns || Math.round(s * 0.42)) : ""}</span>`;
const THUMB = (n, w, h, r, x = "") => `<img class="thumb" decoding="sync" src="${IMG(n)}" style="${x}width:${w}px;height:${h}px;border-radius:${r}px">`;
const NX = (s) => `<span class="nx" style="width:${s}px;height:${s}px;font-size:${Math.round(s * 0.4)}px;border-radius:${Math.round(s * 0.28)}px">NX</span>`;
const GOOGLE = `<svg width="30" height="30" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;
const MSFT = `<svg width="28" height="28" viewBox="0 0 21 21"><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>`;

const $ = (r, s) => r.querySelector(s), $$ = (r, s) => [...r.querySelectorAll(s)];
function div(parent, cls, html, style) { const e = el("div", cls, parent, html || ""); if (style) e.style.cssText += style; return e; }
function place(e, x, y, w, h) { e.style.left = x + "px"; e.style.top = y + "px"; if (w !== undefined) e.style.width = w + "px"; if (h !== undefined) e.style.height = h + "px"; return e; }
function card(parent, x, y, w, h, html, cls) { const e = div(parent, "card " + (cls || ""), html); place(e, x, y, w, h); e.dataset.qaRole = "ui"; return e; }
// an element's box on the stage, whatever transforms sit above it (the preview scales the stage, so divide that out)
function sbox(e) { const r = e.getBoundingClientRect(), s = STAGE.getBoundingClientRect(), k = s.width / W; return { x: (r.left - s.left) / k, y: (r.top - s.top) / k, w: r.width / k, h: r.height / k }; }
const mid = (b, fx = 0.5, fy = 0.5) => [b.x + b.w * fx, b.y + b.h * fy];
const pop = (t, t0, r = 0.45, d = 0.62) => (t < t0 ? 0 : S(t, t0, r, d));
const fin = (t, t0, d = 0.6, ez = E.outExpo) => ez(clamp((t - t0) / d));
const fout = (t, t0, d = 0.35) => E.inCubic(clamp((t - t0) / d));
const fmt = (n) => Math.round(n).toLocaleString("en-US");

// the signature gradient across one part of a line, laid per character so it survives per-character motion
function gradPart(L, i) {
  const part = L.wrap.children[i], pr = part.getBoundingClientRect();
  for (const c of part.querySelectorAll(".ch")) {
    const r = c.getBoundingClientRect();
    css(c, { backgroundImage: `linear-gradient(90deg, ${C.g0}, ${C.g1})`, backgroundSize: `${pr.width.toFixed(1)}px 100%`, backgroundRepeat: "no-repeat",
      backgroundPosition: `${(pr.left - r.left).toFixed(1)}px 0`, webkitBackgroundClip: "text", backgroundClip: "text", color: C.g0, webkitTextFillColor: "transparent" });
  }
}
// a headline: parts [[text, accent?, weight class?]], set left from x or centred on x
function head(root, parts, x, cy, size, o = {}) {
  const L = line(root, parts.map(([s, , w]) => [w || "w7", s, size, "letter-spacing:-0.035em"]), o.center ? x : 0, cy, o.role || "headline");
  if (!o.center) { L.x = x; tf(L.wrap, { x: L.x, y: L.y }); }
  parts.forEach(([, acc], i) => { if (acc) gradPart(L, i); });
  if (o.color) L.wrap.style.color = o.color;
  return L;
}
// characters rise out of a soft blur, staggered; optional exit at `out`
function reveal(L, t, t0, out, step = 0.016) {
  const em = L.h;
  L.chars.forEach((c, i) => {
    const d = t - t0 - i * step, p = E.outExpo(clamp(d / 0.75));
    const x = out === undefined ? 0 : E.inCubic(clamp((t - out - i * 0.005) / 0.3));
    tf(c, { y: (1 - p) * 0.5 * em - x * 0.22 * em, o: clamp(d / 0.2) * (1 - x), b: (1 - p) * 7 + x * 7 });
  });
}
// cursor along keyframes [[t, [x, y]] …], clicks at the listed times
function cursorAt(t, keys, clicks, o) {
  const [x, y] = K(t, keys);
  const past = clicks.filter((c) => t >= c), last = past.length ? past[past.length - 1] : undefined;
  CUR = { x, y, o, press: clicks.reduce((m, c) => Math.max(m, bump(t, c + 0.04, 0.1)), 0), click: last === undefined ? undefined : t - last, light: 0 };
}

// ================================================================ the logo lockup (white, for ink): mark and wordmark revealed separately
const LK = { w: 860 };
LK.h = LK.w * 1000 / 4042; LK.left = CX - LK.w / 2; LK.top = 430 - LK.h / 2; LK.k = LK.w / 4042;
LK.mw = 716.66 * LK.k; LK.mh = 910 * LK.k; LK.mtop = LK.top + 10 * LK.k;
LK.word0 = LK.left + 0.23 * LK.w; LK.word1 = LK.left + 0.985 * LK.w;
function lockup(parent) {
  const w = div(parent, "logo-wrap"); w.dataset.qa = "logo"; place(w, LK.left, LK.top, LK.w, LK.h);
  const mark = el("img", "", w); mark.src = "brand/logo-white.svg"; mark.decoding = "sync"; mark.style.clipPath = "inset(-4% 80% -4% 0)";
  const word = el("img", "", w); word.src = "brand/logo-white.svg"; word.decoding = "sync";
  return {
    w,
    set(pm, pw) {
      mark.style.opacity = pm.toFixed(4); mark.style.visibility = pm > 0.001 ? "visible" : "hidden";
      word.style.clipPath = `inset(-4% ${((1 - pw) * 78).toFixed(3)}% -4% 21.5%)`; word.style.visibility = pw > 0.001 ? "visible" : "hidden";
    },
  };
}
const revealEdge = (pw) => lerp(LK.word0, LK.word1 + 30, pw);

// ================================================================ the murmuration: thousands of birds moving as one
const Flock = (() => {
  const N = 1300, R = rng(20261102);
  const B = Array.from({ length: N }, () => {
    const a = R() * 6.2832, rr = Math.sqrt(-2 * Math.log(1 - R() * 0.995)) * 0.4;
    return { u: Math.cos(a) * rr, v: Math.sin(a) * rr * 0.62, ph: R() * 6.2832, d: R(), k: R(), s: 0.7 + R() * 0.8, ang: R() * 6.2832, rad: R(), e: R() };
  });
  const COLS = ["#FF2357", "#FF3A4E", "#FF5141", "#FF6A2C", "#FE6E00", "#FF7A8F", "#FF4D73", "#FF8A2B"];
  const DUST = Array.from({ length: 150 }, () => ({ x: R(), y: R(), z: 0.3 + R() * 0.7, ph: R() * 6.2832 }));
  const EV = [];
  const TX = new Float32Array(N), TY = new Float32Array(N);
  let bctx, fctx, dustAmt = () => 1;
  function init(markImg) {
    const mk = (z) => { const c = el("canvas", "layer", STAGE); c.width = W; c.height = H; c.style.zIndex = z; c.dataset.qa = "decor"; const x = c.getContext("2d"); x.lineCap = "round"; return x; };
    bctx = mk(5); fctx = mk(42);
    // targets: the mark's filled pixels at its place in the lockup
    const cw = Math.round(LK.mw * 2), ch = Math.round(LK.mh * 2), cv = document.createElement("canvas"); cv.width = cw; cv.height = ch;
    const x = cv.getContext("2d"); x.drawImage(markImg, 0, 0, cw, ch);
    const px = x.getImageData(0, 0, cw, ch).data, pts = [];
    for (let j = 0; j < cw * ch; j += 2) if (px[j * 4 + 3] > 140) pts.push(j);
    const P = rng(77);
    for (let i = 0; i < N; i++) { const j = pts[Math.floor(P() * pts.length)] || 0; TX[i] = LK.left + (j % cw) / 2; TY[i] = LK.mtop + Math.floor(j / cw) / 2; }
  }
  // the flock's body: a soft blob that folds and pulses like a murmuration
  function shape(b, t, sx, sy, rot) {
    let u = b.u + 0.17 * Math.cos(b.v * 4.2 - t * 1.3 + b.u * 0.7) + 0.04 * Math.sin(t * 3 + b.ph);
    let v = b.v + 0.12 * Math.sin(b.u * 3.1 + t * 1.7 + b.v * 1.3) + 0.03 * Math.cos(t * 2.6 + b.ph);
    v *= 1 + 0.38 * Math.sin(b.u * 2.3 - t * 2.4);
    const c = Math.cos(rot), s = Math.sin(rot);
    return [(u * c - v * s) * sx, (u * s + v * c) * sy];
  }
  const add = (a, b, layer, fn) => EV.push({ a, b, layer, fn });
  function draw(t) {
    bctx.clearRect(0, 0, W, H); fctx.clearRect(0, 0, W, H);
    // dust: faint specks drifting up through the dark
    const da = dustAmt(t);
    if (da > 0.01) {
      bctx.globalCompositeOperation = "lighter";
      for (const d of DUST) {
        const y = ((d.y - t * 0.006 * d.z) % 1 + 1) % 1, x = d.x + 0.01 * Math.sin(t * 0.3 + d.ph);
        bctx.globalAlpha = da * (0.1 + 0.22 * d.z) * (0.6 + 0.4 * Math.sin(t * 1.7 + d.ph));
        bctx.fillStyle = d.z > 0.8 ? "#FF7A8F" : "#BEC3CC";
        bctx.beginPath(); bctx.arc(x * W, y * H, 1 + 1.6 * d.z, 0, 6.2832); bctx.fill();
      }
    }
    for (const ev of EV) {
      if (t < ev.a || t >= ev.b) continue;
      const ctx = ev.layer === "front" ? fctx : bctx;
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < N; i++) {
        const b = B[i], p = ev.fn(b, i, t);
        if (!p || p[2] <= 0.004) continue;
        const q = ev.fn(b, i, t - 0.012) || p;
        let dx = p[0] - q[0], dy = p[1] - q[1]; const len = Math.hypot(dx, dy);
        if (len < 0.01) { dx = Math.cos(b.ang); dy = Math.sin(b.ang); } else { dx /= len; dy /= len; }
        const sz = p[3] || 2, Lh = sz * 2.4;
        ctx.globalAlpha = Math.min(1, p[2]); ctx.strokeStyle = COLS[i % COLS.length]; ctx.lineWidth = sz;
        ctx.beginPath(); ctx.moveTo(p[0] - dx * Lh, p[1] - dy * Lh); ctx.lineTo(p[0] + dx * Lh * 0.35, p[1] + dy * Lh * 0.35); ctx.stroke();
      }
    }
    bctx.globalAlpha = fctx.globalAlpha = 1;
  }
  return { init, add, draw, shape, TX, TY, setDust: (f) => (dustAmt = f) };
})();

// one bird from a scattered start (sx, sy) into the mark, then out along the wordmark as it is revealed
function intoMark(b, i, t, start, tForm, tLeave, tReveal) {
  const t0 = tForm + 0.22 * b.d, q = E.inOutCubic(clamp((t - t0) / 0.62));
  const sw = Math.sin(q * Math.PI) * 150 * (b.k - 0.5);
  let x = lerp(start[0], Flock.TX[i], q) + sw, y = lerp(start[1], Flock.TY[i], q) - sw * 0.6;
  const tl = tLeave + 0.26 * b.d, l = E.inOutCubic(clamp((t - tl) / 0.42));
  const pw = E.inOutCubic(clamp((t - tReveal) / 0.55));
  const ex = revealEdge(pw) + 70 * (b.k - 0.35) + Math.max(0, t - tReveal - 0.55) * 1600 * b.s;
  const ey = LK.top + LK.h * (0.18 + 0.66 * b.e) + 18 * Math.sin(t * 9 + b.ph);
  x = lerp(x, ex, l); y = lerp(y, ey, l) - Math.sin(l * Math.PI) * 60 * (b.d - 0.4);
  const a = 1 - E.inQuad(clamp((t - tReveal - 0.25 - 0.3 * b.d) / 0.35));
  return [x, y, a, 1.7 + 1.1 * b.s * (1 - 0.45 * q)];
}

// ================================================================ the film
function build() {
  // ---------------------------------------------------------------- furniture: the faint grid and the flock canvases
  {
    const bg = layer(1), grid = div(bg, "gridbg");
    grid.dataset.qa = "decor";
    every((t) => {
      grid.style.opacity = K(t, [[0, 0.55], [4.9, 0.55], [5.6, 0], [6.6, 0], [7.6, 0.5], [10, 0.32], [49.5, 0.32], [50.1, 0], [52.4, 0], [53.6, 0.42], [59.4, 0.42], [60, 0]]).toFixed(3);
      grid.style.backgroundPosition = `${(t * 7).toFixed(2)}px ${(t * 4).toFixed(2)}px`;
    });
    Flock.init(PRELOADED["brand/logo-mark.svg"]);
    Flock.setDust((t) => K(t, [[0, 0.5], [5, 0.6], [5.6, 0], [6.2, 0], [7, 1], [49.5, 1], [50, 0.3], [52.2, 0.3], [53.5, 1], [59.4, 1], [60, 0]]));
    every((t) => Flock.draw(t));
  }

  // ---------------------------------------------------------------- 1 · the noise (0 – 6): six networks, endless alerts
  {
    const root = layer(12), cam = div(root, "fill");
    cam.dataset.qaRole = "ui";
    const lines = [
      head(root, [["Six networks."]], 150, 400, 92, { color: C.fg3 }),
      head(root, [["Endless tabs."]], 150, 520, 92, { color: C.fg3 }),
      head(root, [["One tired team."]], 150, 640, 92),
    ];
    const tiles = [["instagram", 1215, 255, 1.0, "12", 1.2], ["linkedin", 1625, 330, 0.86, "99+", 1.6], ["x", 1420, 575, 1.08, "8", 2.2],
      ["youtube", 1690, 700, 0.8, "27", 2.6], ["facebook", 1150, 790, 0.9, "5", 3.0], ["tiktok", 1580, 885, 0.94, "41", 3.3]]
      .map(([k, x, y, s, n, tn], i) => {
        const e = div(cam, "ntile nb-" + k, SL.net(k, 66)); place(e, x - 68, y - 68, 136, 136);
        const c = div(e, "count", n, "position:absolute;right:-18px;top:-18px");
        return { e, c, x, y, s, i, tn, t0: 0.15 + i * 0.16 };
      });
    const alerts = [["inbox", C.info, "14 unread DMs", 1010, 200, 0.55], ["triangle-alert", C.bad, "Post failed on Instagram", 1290, 430, 1.0],
      ["message-circle", C.fg2, "Who approved this?", 1000, 615, 1.4], ["clock", C.warn, "Campaign due at 5 PM", 1370, 765, 1.75],
      ["at-sign", C.info, "38 new mentions", 1470, 160, 2.05], ["file-text", C.fg2, "caption_FINAL_v7", 1000, 905, 2.3],
      ["calendar", C.warn, "3 posts clash on Tuesday", 1250, 968, 2.55], ["hash", C.fg2, "Which hashtags?", 1440, 525, 2.75],
      ["bell", C.bad, "Reply time missed", 1120, 330, 2.95]]
      .map(([ic, col, txt, x, y, t0], i) => {
        const e = div(cam, "alert", `<span class="ib">${ICO(ic, 26, col)}</span>${txt}`);
        place(e, x, y - 35);
        return { e, x: x + e.offsetWidth / 2, y, t0, i };
      });
    const pull = (t, x, y, d) => { const k = E.inExpo(clamp((t - 5.0 - d) / 0.62)); return [(CX - x) * k, (CY - y) * k, k]; };
    at(0, 6.0, root, (t) => {
      const ramp = inv(3.2, 5.0, t);
      tf(cam, { x: noise1(t * 9) * 5 * ramp, y: noise1(t * 9 + 40) * 4 * ramp, s: 1 + 0.035 * t / 5 });
      lines.forEach((L, i) => reveal(L, t, 0.25 + i * 0.95, 4.85));
      for (const T of tiles) {
        const s = pop(t, T.t0, 0.5, 0.6), [dx, dy, k] = pull(t, T.x, T.y, 0.04 * T.i);
        tf(T.e, { x: dx, y: Math.sin(t * 1.3 + T.i * 1.7) * 14 * (1 - k) + dy, s: T.s * lerp(0.5, 1, s) * (1 - 0.93 * k), r: Math.sin(t * 0.9 + T.i) * 4 + 50 * k,
          o: clamp((t - T.t0) / 0.15) * (1 - E.inQuad(clamp((t - 5.35) / 0.3))), b: 10 * k });
        const cs = pop(t, T.tn, 0.38, 0.5);
        tf(T.c, { s: cs, o: clamp((t - T.tn) / 0.08) });
      }
      for (const A of alerts) {
        const s = pop(t, A.t0, 0.42, 0.58), [dx, dy, k] = pull(t, A.x, A.y, 0.08 + 0.025 * A.i);
        const wob = ramp * 6 * noise1(t * 7 + A.i * 13);
        tf(A.e, { x: dx + wob, y: dy + (1 - s) * 26 + Math.sin(t * 1.1 + A.i) * 6 * (1 - k), s: lerp(0.7, 1, s) * (1 - 0.92 * k), r: (1 - s) * -4 + 25 * k * (A.i % 2 ? 1 : -1),
          o: clamp((t - A.t0) / 0.1) * (1 - E.inQuad(clamp((t - 5.32) / 0.3))), b: 12 * k });
      }
    });
    alerts.forEach((A) => cue(A.t0, "notify", { v: 0.26, pan: (A.x - CX) / CX * 0.7 }));
    tiles.forEach((T) => cue(T.tn, "tick", { v: 0.18 }));
    cue(0.2, "whoosh", { v: 0.3 });
    cue(4.0, "riser", { v: 0.7, d: 2.0 });
    cue(5.0, "suck", { v: 0.75 });

    // the point everything collapses into, which bursts on the drop
    const pr = layer(13), dot = div(pr, "point");
    dot.dataset.qa = "decor";
    at(5.4, 6.3, pr, (t) => {
      const s = K(t, [[5.4, 0], [5.75, 0.22, E.outBack], [5.97, 0.34, E.inQuad], [6.03, 1.5, E.outCubic], [6.3, 2.2]]);
      tf(dot, { s, o: K(t, [[5.4, 0], [5.55, 1], [6.03, 1], [6.3, 0]]) });
    });
  }

  // ---------------------------------------------------------------- 2 · the flock becomes the mark (6 – 10)
  {
    const root = layer(14), L = lockup(root);
    const tag = head(root, [["Every channel, ", false, "w5"], ["moving as one.", true]], CX, 650, 60, { center: true, role: "copy", color: C.fg2 });
    at(5.95, 10.1, root, (t) => {
      const xo = fout(t, 9.75, 0.3);
      L.set(E.outCubic(clamp((t - 6.85) / 0.3)), E.inOutCubic(clamp((t - 7.0) / 0.55)));
      tf(L.w, { o: 1 - xo, s: 1 + 0.012 * clamp((t - 7) / 3), y: -14 * xo });
      reveal(tag, t, 7.22, 9.78, 0.014);
    });
    // burst from the point, gather into the mark, fly out along the wordmark
    Flock.add(6.0, 8.2, "front", (b, i, t) => {
      const pb = E.outExpo(clamp((t - 6.0) / 0.55)), ang = b.ang + 0.9 * (1 - pb), rad = (160 + 640 * b.rad) * pb;
      const start = [CX + Math.cos(ang) * rad * 1.3, CY + Math.sin(ang) * rad * 0.8];
      const p = intoMark(b, i, t, start, 6.28, 6.95, 7.0);
      p[2] *= clamp((t - 6.0) / 0.06);
      return p;
    });
    cue(6.0, "boom", { v: 1 });
    cue(6.0, "impact", { v: 0.7 });
    cue(6.3, "shimmer", { v: 0.45 });
    cue(6.88, "glass", { v: 0.45 });
    cue(7.0, "whoosh", { v: 0.45, pan: 0.4 });
  }

  // ---------------------------------------------------------------- 3 · sign in (10 – 14): one login, then through the button
  {
    const root = layer(16), cam = div(root, "fill");
    const h1 = head(root, [["One login."]], 150, 470, 96), h2 = head(root, [["Every channel.", true]], 150, 585, 96);
    const cd = card(cam, 1030, 168, 680, 744, `<div class="abs0" style="left:56px;top:52px;width:568px">
      <div class="w7" style="font-size:44px;letter-spacing:-0.03em">Welcome back</div>
      <div class="f3" style="font-size:24px;margin-top:10px">Sign in to keep every channel moving.</div>
      <div class="row" style="gap:16px;margin-top:34px">
        <div class="btn" style="flex:1;height:72px;border-radius:16px;font-size:26px">${GOOGLE} Google</div>
        <div class="btn" style="flex:1;height:72px;border-radius:16px;font-size:26px">${MSFT} Microsoft</div></div>
      <div class="row f3" style="gap:16px;margin-top:28px;font-size:22px"><span class="grow" style="height:1.5px;background:#24262B"></span>or continue with email<span class="grow" style="height:1.5px;background:#24262B"></span></div>
      <div class="lbl" style="margin-top:26px">Work email</div>
      <div class="input well s3-email" style="margin-top:10px"><span class="s3-typed"></span><span class="caret s3-caret"></span></div>
      <div class="lbl" style="margin-top:22px">Password</div>
      <div class="input well s3-pw" style="margin-top:10px;gap:10px"><span class="caret s3-caret2"></span></div>
      <div class="btn cta s3-go" style="width:100%;height:82px;margin-top:34px;font-size:30px"><span class="s3-label">Sign in</span><span class="ico s3-ar">${SL.icon("arrow-right", 30)}</span><span class="spin s3-spin"></span></div>
    </div>`);
    const typed = $(cd, ".s3-typed"), caret = $(cd, ".s3-caret"), caret2 = $(cd, ".s3-caret2"), email = $(cd, ".s3-email"), pw = $(cd, ".s3-pw");
    const dots = Array.from({ length: 12 }, () => { const d = el("span", "dot", pw); css(d, { width: "13px", height: "13px", background: C.fg }); return d; });
    pw.appendChild(caret2);
    const go = $(cd, ".s3-go"), ar = $(cd, ".s3-ar"), spin = $(cd, ".s3-spin");
    const goC = mid(sbox(go));
    cam.style.transformOrigin = `${goC[0]}px ${goC[1]}px`;
    const EMAIL = "arjun@nexora.io";
    at(9.9, 13.95, root, (t) => {
      const pin = fin(t, 9.95, 0.75), z = E.inExpo(clamp((t - 12.75) / 0.85));
      tf(cam, { s: 1 + 7 * z, o: 1 - clamp((t - 13.2) / 0.45), b: 9 * z });
      tf(cd, { y: (1 - pin) * 70, s: lerp(0.95, 1, pin), o: clamp((t - 9.95) / 0.3), b: (1 - pin) * 12 });
      reveal(h1, t, 10.15, 12.7); reveal(h2, t, 10.42, 12.74);
      const n = Math.floor(clamp((FT - 10.62) / 0.72) * EMAIL.length + 1e-6);
      typed.textContent = EMAIL.slice(0, n);
      const blink = Math.floor(FT * 2.4) % 2 === 0;
      email.classList.toggle("focus", t >= 10.5 && t < 11.42);
      pw.classList.toggle("focus", t >= 11.42 && t < 12.0);
      caret.style.opacity = t >= 10.5 && t < 11.42 && (n < EMAIL.length || blink) ? 1 : 0;
      const m = Math.floor(clamp((FT - 11.48) / 0.4) * 12 + 1e-6);
      dots.forEach((d, i) => (d.style.display = i < m ? "" : "none"));
      caret2.style.opacity = t >= 11.42 && t < 12.0 && (m < 12 || blink) ? 1 : 0;
      const loading = t >= 12.1;
      ar.style.display = loading ? "none" : ""; spin.style.display = loading ? "" : "none";
      tf(spin, { r: (t - 12.1) * 540 });
      tf(go, { s: 1 - 0.035 * bump(t, 12.06, 0.12) });
      if (t >= 11.2 && t < 12.85) {
        const g = mid(sbox(go));
        cursorAt(t, [[11.2, [1580, 1020]], [11.95, g]], [12.02], clamp((t - 11.2) / 0.15) * (1 - clamp((t - 12.55) / 0.25)));
      }
    });
    cue(9.95, "whoosh", { v: 0.4, pan: 0.3 });
    for (let i = 0; i < EMAIL.length; i += 2) cue(10.62 + (i / EMAIL.length) * 0.72, "tick", { v: 0.12, pan: 0.3 });
    cue(11.48, "tick", { v: 0.12 }); cue(11.68, "tick", { v: 0.12 });
    cue(12.02, "click", { v: 0.7, pan: 0.3 });
    cue(12.75, "riser", { v: 0.5, d: 0.85 });
    cue(13.6, "whoosh", { v: 0.6 });
  }

  // ---------------------------------------------------------------- 4 · home (14 – 20): everything, at a glance
  {
    const root = layer(18), cam = div(root, "fill");
    const hh = head(root, [["Everything, "], ["at a glance.", true]], CX, 150, 80, { center: true });
    const NAV = ["house", "calendar-days", "columns-3", "inbox", "chart-column", "radio-tower", "images", "badge-check", "settings"];
    const kpis = [["eye", "Impressions", "12.4%"], ["heart", "Engagement rate", "0.6 pts"], ["user-plus", "New followers", "8.1%"], ["calendar-clock", "Scheduled", null]];
    const ups = [["t9", "Nexora Summit 2026", "Today · 2:30 PM", "linkedin"], ["t16", "Goa offsite recap", "Tue · 9:15 AM", "instagram"], ["t13", "Hiring in Hyderabad", "Thu · 11:00 AM", "x"]];
    // 30 days of engagement: a seeded, rising walk
    const R = rng(14), pts = [];
    for (let i = 0; i < 30; i++) pts.push(i === 29 ? 4.82 : 2.5 + 2.1 * Math.pow(i / 29, 1.4) + 0.34 * Math.sin(i * 1.7) + (R() - 0.5) * 0.3);
    const cw = 764, chh = 176, X = (i) => (i / 29) * (cw - 20), Y = (val) => chh - ((val - 1.5) / 4) * chh;
    let d = `M${X(0)} ${Y(pts[0])}`;
    for (let i = 1; i < 30; i++) { const xm = (X(i - 1) + X(i)) / 2; d += ` C${xm} ${Y(pts[i - 1])} ${xm} ${Y(pts[i])} ${X(i)} ${Y(pts[i])}`; }
    const win = card(cam, 200, 250, 1520, 760, `
      <div class="abs0" style="width:104px;height:760px;border-right:1.5px solid #24262B;background:rgba(255,255,255,.012)">
        <img src="brand/logo-mark.svg" decoding="sync" style="position:absolute;left:34px;top:28px;height:46px">
        ${NAV.map((n, i) => `<div class="ico" style="position:absolute;left:24px;top:${118 + i * 66}px;width:56px;height:56px;border-radius:16px;${i ? "color:#959AA3" : "color:#FF7A8F;background:rgba(249,60,89,.14)"}">${SL.icon(n, 28)}</div>`).join("")}
        <div class="selbar" style="top:126px;bottom:auto;height:40px"></div>
      </div>
      <div class="abs0 row" style="left:104px;width:1416px;height:96px;border-bottom:1.5px solid #24262B;padding:0 32px 0 40px;box-sizing:border-box;gap:28px">
        <div class="w7" style="font-size:32px;letter-spacing:-0.02em">Home</div>
        <div class="row well" style="width:440px;height:58px;padding:0 20px;gap:12px;border-radius:999px;background:#0B0C0F">${ICO("search", 24, C.fg3)}<span class="f3" style="font-size:22px">Search posts, people and tags</span></div>
        <div class="grow"></div>
        <div class="btn sq">${SL.icon("bell", 26)}</div>${AV("a4", 52)}
        <div class="btn cta" style="height:58px">${SL.icon("plus", 24)} Create post</div>
      </div>
      <div class="abs0" style="left:144px;top:128px">
        <div class="w7 s4-greet" style="font-size:40px;letter-spacing:-0.03em">Good morning, Arjun</div>
        <div class="f3" style="font-size:24px;margin-top:6px">Here's how Nexora is doing this week.</div>
      </div>
      ${kpis.map(([ic, lab, dl], i) => `<div class="abs0 s4-kpi" style="left:${144 + i * 340}px;top:244px;width:316px;height:160px;border-radius:20px;background:#15161A;border:1.5px solid #24262B;box-sizing:border-box;padding:24px 24px">
        <div class="row f3" style="gap:10px;font-size:22px;font-weight:500">${SL.icon(ic, 22)}${lab}</div>
        <div class="row" style="margin-top:20px;justify-content:space-between"><span class="kpi-v tnum s4-v"></span>${dl ? `<span class="badge ok" style="height:38px;font-size:20px">${SL.icon("trending-up", 18)}${dl}</span>` : `<span class="badge mute" style="height:38px;font-size:20px">This week</span>`}</div>
      </div>`).join("")}
      <div class="abs0 s4-chart" style="left:144px;top:428px;width:820px;height:296px;border-radius:20px;background:#15161A;border:1.5px solid #24262B;box-sizing:border-box">
        <div class="row" style="position:absolute;left:28px;top:24px;gap:14px"><span class="w7" style="font-size:26px">Engagement</span><span class="f3" style="font-size:22px">Last 30 days</span></div>
        <span class="badge ok" style="position:absolute;right:24px;top:20px;height:38px;font-size:20px">${SL.icon("trending-up", 18)}0.6 pts</span>
        <svg style="position:absolute;left:28px;top:92px" width="${cw}" height="${chh + 8}" viewBox="0 -4 ${cw} ${chh + 8}">
          <defs><linearGradient id="s4a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F93C59" stop-opacity=".32"/><stop offset="1" stop-color="#F93C59" stop-opacity="0"/></linearGradient>
          <clipPath id="s4c"><rect class="s4-clip" x="0" y="-10" width="0" height="${chh + 20}"/></clipPath></defs>
          ${[0, 1, 2, 3].map((k) => `<line x1="0" x2="${cw - 20}" y1="${(k * chh) / 3}" y2="${(k * chh) / 3}" stroke="#1E2025" stroke-width="1.5"/>`).join("")}
          <path d="${d} L${X(29)} ${chh} L0 ${chh} Z" fill="url(#s4a)" clip-path="url(#s4c)"/>
          <path class="s4-line" d="${d}" fill="none" stroke="#F93C59" stroke-width="3.5" stroke-linecap="round"/>
          <circle class="s4-dot" cx="${X(29)}" cy="${Y(4.82)}" r="8" fill="#F93C59" stroke="#0F1013" stroke-width="4"/>
        </svg>
      </div>
      <div class="abs0" style="left:988px;top:428px;width:492px;height:296px;border-radius:20px;background:#15161A;border:1.5px solid #24262B;box-sizing:border-box">
        <div class="row" style="position:absolute;left:28px;top:24px;gap:14px"><span class="w7" style="font-size:26px">Up next</span><span class="f3" style="font-size:22px">3 scheduled</span></div>
        ${ups.map(([im, ti, me, nk], i) => `<div class="row s4-up" style="position:absolute;left:24px;right:24px;top:${84 + i * 70}px;height:60px;gap:16px">
          ${THUMB(im, 58, 58, 12)}<div class="col grow"><span class="w6 nowrap" style="font-size:23px">${ti}</span><span class="f3" style="font-size:20px;margin-top:2px">${me}</span></div>${NET(nk, 34)}</div>`).join("")}
      </div>
      <div class="sheen s4-sheen"></div>`);
    const kc = $$(win, ".s4-kpi"), kv = $$(win, ".s4-v"), ln = $(win, ".s4-line"), clip = $(win, ".s4-clip"), dot = $(win, ".s4-dot"), rows = $$(win, ".s4-up"), sheen = $(win, ".s4-sheen");
    const len = ln.getTotalLength();
    ln.style.strokeDasharray = `${len} ${len}`;
    const KV = [(p) => `${(1.2 * p).toFixed(1)}M`, (p) => `${(4.82 * p).toFixed(2)}%`, (p) => `+${fmt(3284 * p)}`, (p) => `${fmt(128 * p)}`];
    at(13.3, 20.0, root, (t) => {
      const pin = fin(t, 13.4, 0.95), xo = fout(t, 19.45, 0.4);
      tf(win, { p: 2400, rx: (1 - pin) * 18, y: (1 - pin) * 90 - 60 * xo, s: lerp(0.9, 1, pin) * (1 + 0.025 * clamp((t - 14) / 5.5)), o: clamp((t - 13.4) / 0.35) * (1 - xo), b: (1 - pin) * 14 + 12 * xo });
      reveal(hh, t, 14.12, 19.4, 0.014);
      kc.forEach((k, i) => { const s = pop(t, 14.35 + i * 0.1, 0.42, 0.62); tf(k, { y: (1 - s) * 30, s: lerp(0.92, 1, s), o: clamp((t - 14.35 - i * 0.1) / 0.12) }); });
      kv.forEach((e, i) => (e.textContent = KV[i](E.outCubic(clamp((FT - 14.45 - i * 0.1) / 1.3)))));
      const dp = E.inOutCubic(clamp((t - 14.9) / 1.5));
      ln.style.strokeDashoffset = (len * (1 - dp)).toFixed(1); clip.setAttribute("width", (dp * cw).toFixed(1));
      const ds = pop(t, 16.35, 0.35, 0.5); dot.setAttribute("r", (8 * ds).toFixed(2));
      rows.forEach((r, i) => { const p = fin(t, 15.05 + i * 0.12, 0.6); tf(r, { x: (1 - p) * 30, o: clamp((t - 15.05 - i * 0.12) / 0.2) }); });
      tf(sheen, { x: K(t, [[16.4, -1600], [17.5, 1600]]) });
    });
    cue(14.0, "hit", { v: 0.7 });
    kc.forEach((k, i) => cue(14.35 + i * 0.1, "pop", { v: 0.3, pan: -0.5 + i * 0.33 }));
    cue(14.45, "count", { v: 0.22, d: 1.3 });
    cue(14.9, "draw", { v: 0.3, d: 1.5 });
    rows.forEach((r, i) => cue(15.05 + i * 0.12, "tick", { v: 0.18, pan: 0.5 }));
    cue(16.4, "shimmer", { v: 0.22 });
  }

  // the flock sweeps through, carrying one scene into the next
  const sweep = (a, from, to, rot) => Flock.add(a, a + 1.3, "front", (b, i, t) => {
    const u = clamp((t - a) / 1.3), e = E.inOutSine(u);
    const cx = lerp(from[0], to[0], e), cy = lerp(from[1], to[1], e) - Math.sin(e * Math.PI) * 70;
    const [dx, dy] = Flock.shape(b, t, 1050, 540, rot + 0.3 * Math.sin(t * 1.3));
    return [cx + dx, cy + dy, 0.9 * Math.pow(Math.sin(u * Math.PI), 0.6), 2.3 * b.s];
  });
  sweep(19.45, [-700, H * 0.86], [W + 700, H * 0.18], -0.35);
  sweep(29.45, [W + 700, H * 0.2], [-700, H * 0.8], 0.35);
  sweep(45.45, [-700, H * 0.2], [W + 700, H * 0.85], 0.4);
  [19.45, 29.45, 45.45].forEach((a, i) => { cue(a, "whoosh", { v: 0.75, pan: i === 1 ? 0.6 : -0.6 }); cue(a + 0.3, "wipe", { v: 0.4 }); });

  // ---------------------------------------------------------------- 5 · composer + AI (20 – 26): write once, post everywhere
  {
    const root = layer(20), cam = div(root, "fill");
    const hA = head(root, [["Write once."]], 150, 430, 84), hB = head(root, [["Post everywhere.", true]], 150, 535, 84);
    const OLD = "Registration for Nexora Summit is open.";
    const NEW = "Nexora Summit 2026 is open in Bengaluru. Two days, 40 sessions and one big keynote. Save your seat. #NexoraSummit";
    const chips = [["linkedin", "Nexora"], ["instagram", "nexora.io"], ["x", "@nexora"]];
    const comp = card(cam, 980, 150, 800, 780, `
      <div class="row" style="position:absolute;left:40px;right:40px;top:30px;gap:16px"><span class="w7" style="font-size:32px;letter-spacing:-0.02em">Create post</span><span class="badge mute" style="height:38px;font-size:20px">Draft · saved</span><span class="grow"></span><span class="f3">${SL.icon("x", 28)}</span></div>
      <div class="f3" style="position:absolute;left:40px;top:102px;font-size:22px">Publish to</div>
      <div class="row" style="position:absolute;left:40px;top:140px;gap:12px">${chips.map(([k, n]) => `<div class="chip s5-chip">${NET(k, 34)}${n}<span class="tick s5-tick">${SL.icon("check", 18)}</span><span class="ring s5-ring"></span></div>`).join("")}</div>
      <div class="well" style="position:absolute;left:40px;top:222px;width:720px;height:236px;overflow:hidden">
        <div class="s5-old" style="position:absolute;left:26px;top:22px;right:26px;font-size:28px;line-height:1.45">${OLD}</div>
        <div class="s5-new" style="position:absolute;left:26px;top:22px;right:26px;font-size:28px;line-height:1.45">${NEW.split(" ").map((w) => `<span class="s5-w" style="display:inline-block${w.startsWith("#") ? ";color:#FF7A8F" : ""}">${w}</span>`).join(" ")}</div>
        <div class="shimmer s5-sh"></div>
      </div>
      <div class="row" style="position:absolute;left:40px;right:40px;top:476px;gap:12px"><div class="btn sq">${SL.icon("image", 26)}</div><div class="btn sq">${SL.icon("smile", 26)}</div><div class="btn sq">${SL.icon("hash", 26)}</div>
        <div class="btn soft s5-ai">${SL.icon("sparkles", 24)} Rewrite with AI</div><span class="grow"></span><span class="f3 tnum s5-cnt" style="font-size:20px"></span></div>
      <div class="row" style="position:absolute;left:40px;top:560px;gap:14px">${THUMB("t9", 168, 112, 16)}${THUMB("t7", 168, 112, 16)}<div class="ico" style="width:112px;height:112px;border-radius:16px;border:2px dashed #33363D;color:#959AA3;box-sizing:border-box">${SL.icon("plus", 30)}</div></div>
      <div class="row" style="position:absolute;left:40px;right:40px;top:696px;gap:12px"><span class="badge brand" style="height:52px;font-size:22px;padding:0 18px">${SL.icon("clock", 22)}Best time · Tue 9:15 AM</span><span class="grow"></span><div class="btn cta s5-go" style="height:60px">${SL.icon("send", 22)} Schedule</div></div>`, "lift");
    const PV = [["linkedin", "t9", "LinkedIn · Tue 9:15 AM"], ["instagram", "t7", "Instagram · Tue 9:15 AM"], ["x", "t5", "X · Tue 9:15 AM"]];
    const pvs = PV.map(([k, im, meta], i) => card(cam, 0, 0, 330, 470, `
      <div class="row" style="position:absolute;left:20px;right:20px;top:20px;gap:12px">${NX(46)}<div class="col grow"><span class="w6" style="font-size:22px">Nexora</span><span class="f3 nowrap" style="font-size:18px">${meta}</span></div>${NET(k, 30)}</div>
      ${THUMB(im, 290, 196, 14, "position:absolute;left:20px;top:86px;")}
      <div class="f2" style="position:absolute;left:20px;right:20px;top:298px;font-size:20px;line-height:1.4">Nexora Summit 2026 is open in Bengaluru. Two days, 40 sessions and one big keynote.</div>
      <div class="row f3" style="position:absolute;left:20px;right:20px;bottom:18px;gap:22px;font-size:20px">${SL.icon("heart", 24)}1.2K ${SL.icon("message-circle", 24)}186 ${SL.icon("repeat-2", 24)}92</div>`, "lift"));
    const PX = [1095, 1355, 1615], PR = [-7, 0, 7], POY = [40, 0, 40];
    pvs.forEach((p, i) => place(p, PX[i] - 165, 330 + POY[i]));
    const tipC = card(cam, 905, 846, 520, 132, `<div class="row" style="position:absolute;left:24px;top:24px;gap:18px"><span class="tile-ic">${SL.icon("sparkles", 28)}</span>
      <div class="col"><span class="w7" style="font-size:26px">Best time found</span><span class="f2" style="font-size:22px;margin-top:4px">Tue 9:15 AM reaches 2.3x more people.</span></div></div>`, "lift");
    const old = $(comp, ".s5-old"), words = $$(comp, ".s5-w"), sh = $(comp, ".s5-sh"), ai = $(comp, ".s5-ai"), go = $(comp, ".s5-go"), cnt = $(comp, ".s5-cnt");
    const ticks = $$(comp, ".s5-tick"), rings = $$(comp, ".s5-ring");
    at(19.9, 26.35, root, (t) => {
      const pin = fin(t, 20.0, 0.85), rec = E.outCubic(clamp((t - 23.35) / 0.6)), wx = E.inCubic(clamp((t - 25.55) / 0.45));
      tf(cam, { x: -950 * wx, b: 22 * wx, o: 1 - clamp((t - 25.75) / 0.25) });
      tf(comp, { x: (1 - pin) * 170, s: lerp(0.97, 1, pin) * (1 - 0.1 * rec), o: clamp((t - 20.0) / 0.3) * (1 - 0.62 * rec), b: (1 - pin) * 12 + 5 * rec });
      reveal(hA, t, 20.22, 25.5); reveal(hB, t, 23.18, 25.52);
      tf(old, { o: 1 - clamp((t - 21.2) / 0.2) });
      words.forEach((w, i) => { const t0 = 21.45 + i * 0.062, p = E.outCubic(clamp((t - t0) / 0.25)); tf(w, { y: (1 - p) * 10, o: p }); });
      tf(sh, { x: K(t, [[21.15, -400], [21.85, 900]]), o: env(t, 21.15, 21.85, 0.1, 0.2) });
      const nch = Math.round(OLD.length + (NEW.length - OLD.length) * clamp((FT - 21.45) / 1.24));
      cnt.textContent = `${nch} / 3,000`;
      tf(ai, { s: 1 - 0.05 * bump(t, 21.14, 0.12) });
      ticks.forEach((k, i) => { const s = pop(t, 22.75 + i * 0.15, 0.36, 0.5); tf(k, { s, o: clamp((t - 22.75 - i * 0.15) / 0.06) }); });
      rings.forEach((r, i) => tf(r, { o: clamp((t - 22.75 - i * 0.15) / 0.12) }));
      tf(go, { s: 1 - 0.05 * bump(t, 23.24, 0.12) });
      pvs.forEach((p, i) => {
        const t0 = 23.5 + i * 0.13, s = pop(t, t0, 0.5, 0.64);
        tf(p, { x: (1355 - PX[i]) * (1 - s), y: (1 - s) * 120, r: PR[i] * s, s: lerp(0.8, 1, s), o: clamp((t - t0) / 0.12) });
      });
      const ts = pop(t, 24.3, 0.45, 0.6);
      tf(tipC, { y: (1 - ts) * 40, s: lerp(0.9, 1, ts), o: clamp((t - 24.3) / 0.12) });
      if (t >= 20.5 && t < 23.65) {
        const a = mid(sbox(ai)), g = mid(sbox(go));
        cursorAt(t, [[20.5, [1700, 1010]], [21.05, a], [22.45, a], [23.15, g]], [21.1, 23.2], clamp((t - 20.5) / 0.15) * (1 - clamp((t - 23.4) / 0.25)));
      }
    });
    cue(21.1, "click", { v: 0.65, pan: 0.2 });
    cue(21.18, "shimmer", { v: 0.5 });
    cue(21.45, "draw", { v: 0.22, d: 1.2 });
    [0, 1, 2].forEach((i) => cue(22.75 + i * 0.15, "pop", { v: 0.32, pan: 0.1 + i * 0.15 }));
    cue(23.2, "click", { v: 0.65, pan: 0.4 });
    cue(23.45, "glassSlide", { v: 0.4 });
    [0, 1, 2].forEach((i) => cue(23.5 + i * 0.13, "pop", { v: 0.3, pan: -0.3 + i * 0.3 }));
    cue(24.3, "ping", { v: 0.38 });
    cue(25.55, "whoosh", { v: 0.65, pan: -0.5 });
  }

  // ---------------------------------------------------------------- 6 · planner (26 – 30): plan the whole month
  {
    const root = layer(22), cam = div(root, "fill");
    const hA = head(root, [["Plan the"]], 150, 460, 96), hB = head(root, [["whole month.", true]], 150, 575, 96);
    const GX = 24, GY = 148, GW = 892, GH = 628, cw = GW / 7, chh = GH / 5;
    const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const POSTS = [[0, 1, "t9", "linkedin"], [0, 3, "t16", "instagram"], [1, 0, "t18", "instagram"], [1, 1, "t7", "x"], [1, 4, "t17", "facebook"], [2, 2, "t13", "linkedin"],
      [2, 5, "t19", "instagram"], [3, 1, "t22", "instagram"], [3, 3, "t5", "linkedin"], [4, 0, "t23", "facebook"], [4, 4, "t21", "x"]];
    let cells = "";
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
      const day = 2 + r * 7 + c, n = day > 30 ? day - 30 : day, today = day === 2;
      cells += `<div style="position:absolute;left:${GX + c * cw}px;top:${GY + r * chh}px;width:${cw}px;height:${chh}px;box-sizing:border-box;border-right:1.5px solid #1C1E22;border-bottom:1.5px solid #1C1E22${c === 0 ? ";border-left:1.5px solid #1C1E22" : ""}${r === 0 ? ";border-top:1.5px solid #1C1E22" : ""}">
        <span class="${today ? "" : "f3"} w6" style="position:absolute;left:10px;top:8px;font-size:20px;${today ? "display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#E11D48;color:#FFFFFF;left:6px;top:4px" : ""}">${n}</span></div>`;
    }
    const cal = card(cam, 860, 140, 940, 800, `
      <div class="row" style="position:absolute;left:36px;right:28px;top:28px;gap:14px"><span class="w7" style="font-size:32px;letter-spacing:-0.02em">November 2026</span>
        <div class="btn sq" style="width:52px;height:52px">${SL.icon("chevron-left", 24)}</div><div class="btn sq" style="width:52px;height:52px">${SL.icon("chevron-right", 24)}</div><span class="grow"></span>
        <div class="row" style="height:52px;padding:4px;border-radius:999px;background:#17181C;border:1.5px solid #24262B;box-sizing:border-box;font-size:22px;font-weight:600"><span class="f3" style="padding:0 20px">Week</span><span style="padding:0 20px;height:42px;display:inline-flex;align-items:center;border-radius:999px;background:#1F2126">Month</span></div></div>
      ${DAYS.map((dd, i) => `<span class="f3 w6" style="position:absolute;top:108px;left:${GX + i * cw}px;width:${cw}px;text-align:center;font-size:20px">${dd}</span>`).join("")}
      ${cells}
      ${POSTS.map(([r, c, im, k], i) => `<div class="s6-post" data-i="${i}" style="position:absolute;left:${GX + c * cw + 8}px;top:${GY + r * chh + 44}px;width:${cw - 16}px;height:${chh - 54}px;border-radius:12px;box-shadow:0 10px 24px -10px rgba(0,0,0,.8)">
        ${THUMB(im, cw - 16, chh - 54, 12)}<span style="position:absolute;right:-6px;bottom:-6px">${NET(k, 28)}</span></div>`).join("")}`);
    const posts = $$(cal, ".s6-post"), drag = posts[3];
    const toast = card(cam, 0, 0, 10, 10, `<div class="row" style="height:100%;padding:0 26px 0 18px;gap:12px;font-size:24px;font-weight:600">${ICO("circle-check", 28, C.ok)}<span>Moved to Thu, Nov 12 · 9:15 AM</span></div>`, "lift");
    css(toast, { width: "auto", height: "64px", borderRadius: "999px", whiteSpace: "nowrap" });
    place(toast, 1330 - toast.offsetWidth / 2, 958);
    at(25.5, 30.05, root, (t) => {
      const pin = fin(t, 25.7, 0.8), xo = fout(t, 29.45, 0.4);
      tf(cam, { x: (1 - pin) * 950, b: (1 - pin) * 18 + 12 * xo, o: clamp((t - 25.7) / 0.2) * (1 - xo), s: 1 + 0.02 * clamp((t - 26) / 3.5) });
      reveal(hA, t, 26.0, 29.4); reveal(hB, t, 26.28, 29.44);
      posts.forEach((p, i) => {
        const t0 = 26.35 + i * 0.09, s = pop(t, t0, 0.45, 0.6);
        if (p === drag && t >= 28.0) {
          const dx = K(t, [[28.08, 0], [28.75, 2 * cw]]), lift = env(t, 28.0, 29.0, 0.12, 0.18);
          tf(p, { x: dx, y: -10 * lift, s: 1 + 0.08 * lift, r: 3 * lift, o: 1 });
        } else tf(p, { y: (1 - s) * -40, s: lerp(1.25, 1, s), o: clamp((t - t0) / 0.1) });
        p.style.zIndex = p === drag && t >= 28.0 ? 5 : "";
      });
      const ts = pop(t, 28.95, 0.45, 0.62);
      tf(toast, { y: (1 - ts) * 30, s: lerp(0.9, 1, ts), o: clamp((t - 28.95) / 0.12) });
      if (t >= 27.55 && t < 29.4) {
        const b = sbox(drag);
        cursorAt(t, [[27.55, [1720, 1010]], [28.0, [b.x + b.w * 0.55, b.y + b.h * 0.55]], [28.08, [b.x + b.w * 0.55, b.y + b.h * 0.55]], [28.75, [b.x + b.w * 0.55, b.y + b.h * 0.55]]],
          [28.05], clamp((t - 27.55) / 0.15) * (1 - clamp((t - 29.1) / 0.25)));
        if (t >= 28.05 && t < 28.85) CUR.press = 1;
      }
    });
    posts.forEach((p, i) => cue(26.35 + i * 0.09, "tick", { v: 0.2, pan: 0.2 + (i % 3) * 0.2 }));
    cue(28.05, "click", { v: 0.6, pan: 0.2 });
    cue(28.1, "glassSlide", { v: 0.35, pan: 0.3 });
    cue(28.85, "pop", { v: 0.45, pan: 0.4 });
    cue(28.95, "ping", { v: 0.32 });
  }

  // ---------------------------------------------------------------- 7 · inbox (30 – 36): every DM, one inbox
  {
    const root = layer(24), cam = div(root, "fill");
    const hh = head(root, [["Every DM. "], ["One inbox.", true]], CX, 150, 80, { center: true });
    const ROWS = [["a7", "x", "Vikram Singh", "Our API calls are failing with 503s", "2m", true], ["a3", "instagram", "Neha Sharma", "Loved the Diwali reel! Who edited it?", "8m"],
      ["a5", "linkedin", "Kavya Reddy", "Can we feature our team at Summit?", "21m"], ["a6", "facebook", "Aditya Kumar", "Is the keynote being livestreamed?", "1h"],
      ["a8", "instagram", "Pooja Menon", "Thanks for the quick reply!", "2h"]];
    const REPLY = "Hi Vikram, sorry about that. The 503 errors from 9:02 to 9:24 AM IST are fixed now.";
    const win = card(cam, 200, 250, 1520, 760, `
      <div class="abs0" style="width:560px;height:760px;border-right:1.5px solid #24262B">
        <div class="row" style="position:absolute;left:32px;top:28px;gap:14px"><span class="w7" style="font-size:32px;letter-spacing:-0.02em">Inbox</span><span class="badge brand" style="height:38px;font-size:20px">24 new</span></div>
        <div class="row f3" style="position:absolute;left:32px;top:96px;gap:30px;font-size:22px;font-weight:600"><span class="f1" style="position:relative">All<span style="position:absolute;left:0;right:0;bottom:-16px;height:3.5px;border-radius:3px;background:linear-gradient(90deg,#FF2357,#FE6E00)"></span></span><span>DMs</span><span>Mentions</span><span>Comments</span></div>
        <div style="position:absolute;left:0;right:0;top:146px;height:1.5px;background:#24262B"></div>
        ${ROWS.map(([a, k, n, s, tm, urg], i) => `<div class="s7-row" style="position:absolute;left:0;right:0;top:${150 + i * 112}px;height:112px">
          ${i === 0 ? `<div class="sel s7-sel"></div><div class="selbar s7-bar"></div>` : ""}
          <div class="row" style="position:absolute;left:28px;right:28px;top:22px;gap:18px">${AV(a, 64, k, 28)}
          <div class="col grow"><div class="row" style="gap:10px"><span class="w6 nowrap" style="font-size:26px">${n}</span>${urg ? `<span class="badge bad" style="height:32px;font-size:18px;padding:0 10px 0 8px">${SL.icon("triangle-alert", 16)}Urgent</span>` : ""}<span class="grow"></span><span class="f3" style="font-size:20px">${tm}</span></div>
          <div class="row" style="gap:10px;margin-top:4px"><span class="f3 nowrap" style="font-size:22px;overflow:hidden;text-overflow:ellipsis;max-width:340px">${s}</span><span class="grow"></span>${i < 3 ? `<span class="dot s7-unread" style="width:12px;height:12px;background:#F93C59"></span>` : ""}</div></div></div></div>`).join("")}
      </div>
      <div class="abs0 s7-thread" style="left:560px;width:960px;height:760px">
        <div class="row" style="position:absolute;left:36px;right:32px;top:22px;height:60px;gap:18px">${AV("a7", 60)}<div class="col"><span class="w7" style="font-size:28px">Vikram Singh</span><span class="f3" style="font-size:22px">Gurugram · via X</span></div><span class="grow"></span>
          <span style="position:relative;width:170px;height:42px"><span class="badge info s7-open" style="position:absolute;right:0;top:0">${SL.icon("circle-dot", 20)}Open</span><span class="badge ok s7-done" style="position:absolute;right:0;top:0">${SL.icon("circle-check", 20)}Resolved</span></span>
          ${AV("a2", 46)}<span class="f3">${SL.icon("ellipsis", 28)}</span></div>
        <div style="position:absolute;left:0;right:0;top:104px;height:1.5px;background:#24262B"></div>
        <div class="s7-in" style="position:absolute;left:36px;top:140px;width:620px"><div class="bubble in">Our API calls are failing with 503s since 9 AM. Any update?</div><div class="f3" style="font-size:20px;margin-top:10px">9:26 AM</div></div>
        <div class="aibox s7-ai" style="left:36px;top:330px;width:888px;height:206px;overflow:hidden">
          <div class="row" style="position:absolute;left:24px;right:24px;top:20px;gap:12px"><span class="tile-ic" style="width:40px;height:40px;border-radius:12px">${SL.icon("sparkles", 22)}</span><span class="w7 fb" style="font-size:22px">Suggested reply</span><span class="grow"></span><span class="badge mute" style="height:36px;font-size:20px">Tone: calm</span></div>
          <div style="position:absolute;left:24px;right:24px;top:84px;font-size:26px;line-height:1.45">${REPLY.split(" ").map((w) => `<span class="s7-w" style="display:inline-block">${w}</span>`).join(" ")}</div>
          <div class="shimmer s7-sh"></div></div>
        <div class="s7-out" style="position:absolute;right:36px;top:330px;width:640px"><div class="bubble out">${REPLY}</div><div class="row f3" style="font-size:20px;margin-top:10px;justify-content:flex-end;gap:8px">${SL.icon("check-check", 20)}Sent · 9:27 AM</div></div>
        <div class="row well" style="position:absolute;left:36px;right:36px;bottom:28px;height:80px;padding:0 12px 0 24px;gap:12px;border-radius:20px"><span class="f3 grow" style="font-size:24px">Reply to Vikram</span><span class="f3">${SL.icon("paperclip", 26)}</span><div class="btn cta s7-send" style="height:58px">Send ${SL.icon("send-horizontal", 22)}</div></div>
      </div>`);
    const rows = $$(win, ".s7-row"), sel = $(win, ".s7-sel"), bar = $(win, ".s7-bar"), unread = $$(win, ".s7-unread");
    const thread = $(win, ".s7-thread"), inc = $(win, ".s7-in"), aib = $(win, ".s7-ai"), ws = $$(win, ".s7-w"), shm = $(win, ".s7-sh"), out = $(win, ".s7-out");
    const open = $(win, ".s7-open"), done = $(win, ".s7-done"), send = $(win, ".s7-send");
    at(29.9, 36.05, root, (t) => {
      const pin = fin(t, 30.05, 0.85), xo = fout(t, 35.55, 0.4);
      tf(win, { y: (1 - pin) * 60, s: lerp(0.93, 1, pin) * (1 + 0.02 * xo), o: clamp((t - 30.05) / 0.3) * (1 - xo), b: (1 - pin) * 14 + 16 * xo });
      reveal(hh, t, 30.25, 35.5, 0.014);
      rows.forEach((r, i) => { const p = fin(t, 30.3 + i * 0.08, 0.6); tf(r, { x: (1 - p) * -24, o: clamp((t - 30.3 - i * 0.08) / 0.2) }); });
      const sp = E.outCubic(clamp((t - 30.95) / 0.25));
      tf(sel, { o: sp }); tf(bar, { sy: sp, o: sp });
      tf(thread, { o: clamp((t - 31.0) / 0.3) });
      const ib = pop(t, 31.3, 0.45, 0.62); tf(inc, { y: (1 - ib) * 24, s: lerp(0.94, 1, ib), o: clamp((t - 31.3) / 0.12) });
      const ap = fin(t, 31.9, 0.6), ax = E.inCubic(clamp((t - 34.0) / 0.25));
      tf(aib, { y: (1 - ap) * 30, o: clamp((t - 31.9) / 0.2) * (1 - ax), s: 1 - 0.04 * ax });
      tf(shm, { x: K(t, [[31.95, -500], [32.7, 1100]]), o: env(t, 31.95, 32.7, 0.1, 0.2) });
      ws.forEach((w, i) => { const t0 = 32.15 + i * 0.075, p = E.outCubic(clamp((t - t0) / 0.22)); tf(w, { y: (1 - p) * 8, o: p }); });
      const os = pop(t, 34.12, 0.45, 0.64); tf(out, { y: (1 - os) * 30, s: lerp(0.94, 1, os), o: clamp((t - 34.12) / 0.12) });
      tf(open, { o: 1 - clamp((t - 34.55) / 0.1) });
      const ds = pop(t, 34.55, 0.38, 0.5); tf(done, { s: lerp(0.6, 1, ds), o: clamp((t - 34.55) / 0.08) });
      tf(unread[0], { o: 1 - clamp((t - 34.55) / 0.2) });
      tf(send, { s: 1 - 0.05 * bump(t, 34.04, 0.12) });
      if (t >= 30.55 && t < 34.6) {
        const r0 = sbox(rows[0]), s = mid(sbox(send));
        cursorAt(t, [[30.55, [980, 1010]], [30.9, [r0.x + 300, r0.y + 60]], [33.5, [r0.x + 300, r0.y + 60]], [33.95, s]], [30.95, 34.0], clamp((t - 30.55) / 0.15) * (1 - clamp((t - 34.35) / 0.25)));
      }
    });
    cue(30.05, "hit", { v: 0.5 });
    rows.forEach((r, i) => cue(30.3 + i * 0.08, "tick", { v: 0.16, pan: -0.5 }));
    cue(30.95, "click", { v: 0.6, pan: -0.3 });
    cue(31.3, "notify", { v: 0.42, pan: 0.1 });
    cue(31.92, "shimmer", { v: 0.42 });
    cue(32.15, "draw", { v: 0.2, d: 1.3 });
    cue(34.0, "click", { v: 0.6, pan: 0.5 });
    cue(34.12, "pop", { v: 0.4, pan: 0.4 });
    cue(34.55, "chime", { v: 0.5 });
    cue(35.55, "reverse", { v: 0.5 });
  }

  // ---------------------------------------------------------------- 8 · streams + listening (36 – 40): the breakdown
  {
    const root = layer(26), cam = div(root, "fill");
    const hA = head(root, [["Hear every"]], 150, 470, 96), hB = head(root, [["mention.", true]], 150, 585, 96);
    const deck = div(cam, "abs0"); place(deck, 820, 110, 1000, 880);
    deck.dataset.qaRole = "ui";
    const FEED = [["a12", "Ishita Banerjee", "@ishitab", "The Nexora keynote line-up looks strong this year.", "t9"], ["a14", "Sneha Pillai", "@snehapillai", "Huge respect to the @nexora team for the Diwali drive.", null],
      ["a7", "Vikram Singh", "@vikramsingh", "API is back and stable. Thanks for the fast fix, @nexora.", null], ["a15", "Imran Qureshi", "@imranq", "Booked my seat for #NexoraSummit. See you in Bengaluru!", "t20"],
      ["a6", "Aditya Kumar", "@adityabuilds", "Nexora's hiring post just landed in our team chat.", null], ["a11", "Karan Malhotra", "@karanm", "That Goa offsite reel from @nexora is pure joy.", "t16"],
      ["a13", "Rahul Verma", "@rahulv", "Comparing tools for our social team. Nexora uses Starling?", null], ["a5", "Kavya Reddy", "@kavyareddy", "Our team is speaking at #NexoraSummit this year.", "t11"]];
    const COLS = [["at-sign", "Mentions"], ["hash", "#NexoraSummit"], ["search", "Keyword: Nexora"]];
    const feeds = COLS.map(([ic, ti], c) => {
      const col = div(deck, "card", `<div class="row" style="position:absolute;left:18px;right:18px;top:18px;height:44px;gap:10px"><span class="tile-ic" style="width:40px;height:40px;border-radius:12px">${SL.icon(ic, 20)}</span><span class="w7 nowrap" style="font-size:22px">${ti}</span><span class="grow"></span><span class="dot" style="width:10px;height:10px;background:#3DD49A"></span></div>
        <div style="position:absolute;left:0;right:0;top:78px;height:1.5px;background:#24262B"></div><div class="s8-feed" style="position:absolute;left:16px;right:16px;top:94px"></div>`);
      place(col, c * 334, 0, 310, 880);
      const feed = $(col, ".s8-feed");
      for (let k = 0; k < 7; k++) {
        const [a, n, hd, tx, im] = FEED[(k * 3 + c * 2) % FEED.length];
        div(feed, "", `<div style="background:#15161A;border:1.5px solid #24262B;border-radius:18px;padding:16px;margin-bottom:14px">
          <div class="row" style="gap:12px">${AV(a, 44)}<div class="col"><span class="w6 nowrap" style="font-size:20px">${n}</span><span class="f3" style="font-size:18px">${hd}</span></div></div>
          <div class="f2" style="font-size:20px;line-height:1.4;margin-top:10px">${tx}</div>${im ? THUMB(im, 244, 120, 12, "margin-top:12px;") : ""}</div>`);
      }
      return { col, feed, c };
    });
    const lis = card(cam, 1010, 610, 720, 360, `
      <div class="row" style="position:absolute;left:28px;right:28px;top:24px;gap:12px"><span class="w7" style="font-size:26px">Sentiment</span><span class="f3" style="font-size:22px">@nexora · last 7 days</span></div>
      <svg style="position:absolute;left:36px;top:96px" width="300" height="170" viewBox="0 0 300 170"><path d="M24 150 A126 126 0 0 1 276 150" fill="none" stroke="#1F2126" stroke-width="26" stroke-linecap="round"/>
        <path class="s8-arc" d="M24 150 A126 126 0 0 1 276 150" fill="none" stroke="#3DD49A" stroke-width="26" stroke-linecap="round"/></svg>
      <div class="col" style="position:absolute;left:36px;top:178px;width:300px;align-items:center"><span class="gauge-num tnum s8-pct" style="font-size:64px;line-height:1"></span><span class="fok w6" style="font-size:22px;margin-top:6px">${SL.icon("smile", 20).replace("<svg", '<svg style="display:inline-block;vertical-align:-3px;margin-right:6px"')}positive</span></div>
      <div style="position:absolute;left:378px;top:96px;width:1.5px;height:230px;background:#24262B"></div>
      <div class="col" style="position:absolute;left:410px;top:96px"><span class="f3" style="font-size:22px">Mentions</span><span class="kpi-v tnum s8-men" style="margin-top:10px"></span>
        <span class="badge ok" style="margin-top:14px;height:38px;font-size:20px;align-self:flex-start">${SL.icon("trending-up", 18)}24% this week</span></div>
      <svg style="position:absolute;left:410px;top:262px" width="280" height="70" viewBox="0 0 280 70"><path class="s8-spark" d="M0 58 C30 54 40 40 70 44 S120 30 140 34 S190 14 210 20 S250 6 280 4" fill="none" stroke="#F93C59" stroke-width="3.5" stroke-linecap="round"/></svg>`, "lift");
    const arc = $(lis, ".s8-arc"), pct = $(lis, ".s8-pct"), men = $(lis, ".s8-men"), spk = $(lis, ".s8-spark");
    const al = arc.getTotalLength(), sl = spk.getTotalLength();
    arc.style.strokeDasharray = `${al} ${al}`; spk.style.strokeDasharray = `${sl} ${sl}`;
    at(35.5, 40.1, root, (t) => {
      const pin = E.inOutSine(clamp((t - 35.6) / 0.9)), up = E.inExpo(clamp((t - 39.3) / 0.7)), xo = clamp((t - 39.85) / 0.2);
      tf(cam, { s: lerp(1.06, 1, pin) * (1 + 0.05 * up), o: pin * (1 - xo), b: (1 - pin) * 20 + 10 * up });
      tf(deck, { p: 2200, ry: -14, rx: 5, x: (1 - pin) * 80 });
      feeds.forEach((F) => tf(F.feed, { y: -(t - 35.5) * 78 - F.c * 120 }));
      reveal(hA, t, 36.2, 39.45, 0.022); reveal(hB, t, 36.5, 39.5, 0.022);
      const lp = fin(t, 36.9, 0.8); tf(lis, { y: (1 - lp) * 80, o: clamp((t - 36.9) / 0.25) });
      const g = E.outCubic(clamp((t - 37.2) / 1.4));
      arc.style.strokeDashoffset = (al * (1 - 0.78 * g)).toFixed(1);
      pct.textContent = `${Math.round(78 * E.outCubic(clamp((FT - 37.2) / 1.4)))}%`;
      men.textContent = fmt(2481 * E.outCubic(clamp((FT - 37.2) / 1.2)));
      spk.style.strokeDashoffset = (sl * (1 - E.inOutCubic(clamp((t - 37.4) / 1.2)))).toFixed(1);
    });
    // a distant flock drifts over the breakdown
    Flock.add(35.7, 40.0, "back", (b, i, t) => {
      const [dx, dy] = Flock.shape(b, t, 420, 150, 0.15 * Math.sin(t * 0.7));
      return [470 + 260 * Math.sin(0.55 * (t - 36)) + dx, 235 + 30 * Math.sin(0.9 * t) + dy, 0.5 * env(t, 35.7, 40.0, 0.9, 0.3), 1.3 * b.s];
    });
    cue(36.0, "swell", { v: 0.45, d: 3 });
    cue(36.9, "glassSlide", { v: 0.3 });
    cue(37.2, "draw", { v: 0.3, d: 1.4 });
    cue(37.2, "count", { v: 0.18, d: 1.2 });
    cue(38.0, "riser", { v: 0.75, d: 2.0 });
  }

  // ---------------------------------------------------------------- 9 · analytics (40 – 46): the drop
  {
    const root = layer(28), cam = div(root, "fill");
    const hh = head(root, [["Know "], ["what works.", true]], CX, 140, 88, { center: true });
    const IG = [2.1, 2.4, 2.3, 2.9, 3.1, 3.0, 3.6, 3.9, 4.2, 4.6, 5.1, 5.8], LI = [1.6, 1.8, 2.0, 2.1, 2.4, 2.6, 2.5, 2.9, 3.2, 3.4, 3.8, 4.1];
    const PW = 700, PH = 300, px0 = 92, X = (i) => px0 + (i / 11) * PW, Y = (v) => 108 + PH - (v / 6) * PH;
    const curve = (a) => { let d = `M${X(0)} ${Y(a[0])}`; for (let i = 1; i < a.length; i++) { const xm = (X(i - 1) + X(i)) / 2; d += ` C${xm} ${Y(a[i - 1])} ${xm} ${Y(a[i])} ${X(i)} ${Y(a[i])}`; } return d; };
    const cA = card(cam, 160, 240, 980, 480, `
      <div class="row" style="position:absolute;left:32px;right:32px;top:28px;gap:14px"><span class="w7" style="font-size:28px">Engagement</span><span class="f3" style="font-size:22px">Last 12 weeks</span><span class="grow"></span>
        <span class="row f2" style="gap:10px;font-size:22px"><span class="dot" style="width:14px;height:14px;background:#F93C59"></span>Instagram</span><span class="row f2" style="gap:10px;font-size:22px;margin-left:18px"><span class="dot" style="width:14px;height:14px;background:#3987E5"></span>LinkedIn</span></div>
      ${[0, 2, 4, 6].map((v) => `<span class="f3 tnum" style="position:absolute;left:32px;top:${Y(v) - 13}px;font-size:20px">${v ? v + "K" : "0"}</span>`).join("")}
      <svg class="abs0" width="980" height="480">${[0, 2, 4, 6].map((v) => `<line x1="${px0}" x2="${px0 + PW}" y1="${Y(v)}" y2="${Y(v)}" stroke="#1E2025" stroke-width="1.5"/>`).join("")}
        <path class="s9-l" d="${curve(LI)}" fill="none" stroke="#3987E5" stroke-width="4" stroke-linecap="round"/>
        <path class="s9-l" d="${curve(IG)}" fill="none" stroke="#F93C59" stroke-width="4" stroke-linecap="round"/>
        <circle class="s9-d" cx="${X(11)}" cy="${Y(4.1)}" r="9" fill="#3987E5" stroke="#0F1013" stroke-width="4"/><circle class="s9-d" cx="${X(11)}" cy="${Y(5.8)}" r="9" fill="#F93C59" stroke="#0F1013" stroke-width="4"/></svg>
      <span class="w7 tnum s9-lab" style="position:absolute;left:${X(11) + 22}px;top:${Y(5.8) - 16}px;font-size:24px">5.8K</span>
      <span class="w7 tnum s9-lab" style="position:absolute;left:${X(11) + 22}px;top:${Y(4.1) - 16}px;font-size:24px">4.1K</span>`);
    const cB = card(cam, 1180, 240, 580, 330, `
      <div class="row f3" style="position:absolute;left:30px;top:28px;gap:10px;font-size:24px;font-weight:500">${SL.icon("heart", 24)}Engagement rate</div>
      <div class="tnum s9-big" style="position:absolute;left:28px;top:78px;font-size:104px;font-weight:700;letter-spacing:-0.04em;line-height:1"></div>
      <div class="row" style="position:absolute;left:30px;top:198px;gap:12px"><span class="badge ok" style="height:40px;font-size:21px">${SL.icon("trending-up", 20)}0.6 pts</span><span class="f3" style="font-size:22px">vs last month</span></div>
      <div class="f3" style="position:absolute;left:30px;top:256px;font-size:22px">72% of quarterly goal</div>
      <div style="position:absolute;left:30px;right:30px;top:294px;height:12px;border-radius:6px;background:#1F2126;overflow:hidden"><div class="s9-prog" style="width:72%;height:100%;border-radius:6px;background:linear-gradient(90deg,#FF2357,#FE6E00);transform-origin:0 50%"></div></div>`);
    const SEQ = ["#1A1013", "#4A1422", "#7A1832", "#B61E45", "#F93C59", "#FF8FA1"];
    const HOURS = ["6a", "9a", "12p", "3p", "6p", "9p"], WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const heat = (r, c) => clamp(Math.round(2.2 + 1.6 * Math.sin(c * 1.1 + 0.4) * Math.cos(r * 0.7) - (r > 4 ? 0.9 : 0) + hash(r * 7 + c) * 1.2), 0, 4);
    let cellsH = "";
    for (let r = 0; r < 7; r++) for (let c = 0; c < 6; c++) {
      const best = r === 1 && c === 1, v = best ? 5 : heat(r, c);
      cellsH += `<div class="s9-cell" data-r="${r}" data-c="${c}" style="position:absolute;left:${102 + c * 76}px;top:${142 + r * 39}px;width:70px;height:34px;border-radius:7px;background:${SEQ[v]}${best ? ";box-shadow:0 0 0 3px #F8F8F8" : ""}"></div>`;
    }
    const cC = card(cam, 1180, 600, 580, 410, `
      <div class="row" style="position:absolute;left:30px;right:30px;top:26px;gap:12px"><span class="w7" style="font-size:26px">Best time to post</span><span class="grow"></span><span class="badge mute" style="height:36px;font-size:20px">IST</span></div>
      ${HOURS.map((h, c) => `<span class="f3" style="position:absolute;top:96px;left:${102 + c * 76}px;width:70px;text-align:center;font-size:20px">${h}</span>`).join("")}
      ${WD.map((d, r) => `<span class="f3" style="position:absolute;left:30px;top:${142 + r * 39 + 4}px;font-size:20px">${d}</span>`).join("")}
      ${cellsH}
      <span class="badge mute s9-best" style="position:absolute;left:${102 + 76 + 35}px;top:${142 + 39 - 52}px;height:40px;font-size:21px;background:#0F1013;border:1.5px solid #33363D;color:#F8F8F8;transform-origin:0 100%">${SL.icon("sparkles", 18)}Tue 9 AM · 2.3x</span>`);
    const TOP = [["t16", "Goa team offsite", "8.4%"], ["t17", "Diwali at Nexora", "7.9%"], ["t1", "Build Week hackathon", "6.1%"]];
    const cD = card(cam, 160, 750, 980, 260, `
      <div class="row" style="position:absolute;left:32px;top:26px;gap:14px"><span class="w7" style="font-size:26px">Top posts this week</span></div>
      ${TOP.map(([im, ti, v], i) => `<div class="row s9-top" style="position:absolute;left:${32 + i * 310}px;top:88px;width:296px;gap:16px">${THUMB(im, 104, 136, 14)}
        <div class="col grow"><span class="w6" style="font-size:22px;line-height:1.25">${ti}</span><span class="w7 tnum" style="font-size:30px;margin-top:10px">${v}</span><span class="f3" style="font-size:20px">engagement</span></div></div>`).join("")}`);
    const cards = [cA, cB, cD, cC];
    const lines9 = $$(cA, ".s9-l"), dots9 = $$(cA, ".s9-d"), labs = $$(cA, ".s9-lab"), big = $(cB, ".s9-big"), prog = $(cB, ".s9-prog");
    const cellsE = $$(cC, ".s9-cell"), best = $(cC, ".s9-best"), tops = $$(cD, ".s9-top");
    const LL = lines9.map((l) => { const n = l.getTotalLength(); l.style.strokeDasharray = `${n} ${n}`; return n; });
    at(39.85, 46.0, root, (t) => {
      const xo = fout(t, 45.45, 0.4), [sx, sy] = shake(t, 40.0, 10);
      tf(cam, { x: sx, y: sy, o: 1 - xo, b: 12 * xo, s: 1 - 0.03 * xo });
      slamWords(hh.words, t, 40.05, 0.09, 45.4);
      cards.forEach((c, i) => { const t0 = 40.0 + i * 0.07, p = E.outExpo(clamp((t - t0) / 0.6)); tf(c, { s: lerp(1.12, 1, p), y: (1 - p) * -24, o: clamp((t - t0) / 0.14), b: (1 - p) * 14 }); });
      lines9.forEach((l, i) => (l.style.strokeDashoffset = (LL[i] * (1 - E.inOutCubic(clamp((t - 40.35 - i * 0.1) / 1.5)))).toFixed(1)));
      dots9.forEach((d, i) => d.setAttribute("r", (9 * pop(t, 41.85 + i * 0.08, 0.35, 0.5)).toFixed(2)));
      labs.forEach((l, i) => tf(l, { o: clamp((t - 41.9 - i * 0.08) / 0.2), x: (1 - fin(t, 41.9 + i * 0.08, 0.4)) * -10 }));
      big.textContent = `${(4.82 * E.outCubic(clamp((FT - 40.4) / 1.2))).toFixed(2)}%`;
      tf(prog, { sx: E.outCubic(clamp((t - 40.6) / 1.0)) });
      cellsE.forEach((e) => { const r = +e.dataset.r, c = +e.dataset.c, t0 = 40.9 + Math.hypot(r - 1, c - 1) * 0.07, s = pop(t, t0, 0.4, 0.6); tf(e, { s: lerp(0.5, 1, s), o: clamp((t - t0) / 0.1) }); });
      const bs = pop(t, 41.9, 0.4, 0.55); tf(best, { s: lerp(0.6, 1, bs), o: clamp((t - 41.9) / 0.08) });
      tops.forEach((e, i) => { const p = fin(t, 41.1 + i * 0.1, 0.6); tf(e, { x: (1 - p) * 30, o: clamp((t - 41.1 - i * 0.1) / 0.2) }); });
    });
    cue(40.0, "boom", { v: 1 });
    cue(40.0, "impact", { v: 0.8 });
    cue(40.35, "draw", { v: 0.32, d: 1.5 });
    cue(40.4, "count", { v: 0.22, d: 1.2 });
    cue(40.9, "shimmer", { v: 0.3 });
    [0, 1, 2].forEach((i) => cue(41.1 + i * 0.1, "tick", { v: 0.18, pan: -0.4 }));
    cue(41.9, "ping", { v: 0.42, pan: 0.4 });
  }

  // ---------------------------------------------------------------- 10 · library + approvals (46 – 50): approved in one click
  {
    const root = layer(30), cam = div(root, "fill");
    const hA = head(root, [["Approved in"]], 150, 450, 96), hB = head(root, [["one click.", true]], 150, 565, 96);
    const LIB = ["t16", "t17", "t1", "t18", "t19", "t22", "t21", "t23", "t10"];
    const lib = card(cam, 860, 120, 940, 840, `
      <div class="row" style="position:absolute;left:32px;right:30px;top:30px;gap:14px"><span class="w7" style="font-size:32px;letter-spacing:-0.02em">Library</span><span class="f3" style="font-size:22px">23 assets</span><span class="grow"></span>
        ${["All", "Images", "Video"].map((c, i) => `<span class="row" style="height:46px;padding:0 20px;border-radius:999px;font-size:22px;font-weight:600;${i ? "color:#959AA3;border:1.5px solid #24262B" : "background:#1F2126"}">${c}</span>`).join("")}</div>
      ${LIB.map((im, i) => `<div class="s10-t" data-i="${i}" style="position:absolute;left:${30 + (i % 3) * 300}px;top:${110 + Math.floor(i / 3) * 240}px;width:280px;height:220px">${THUMB(im, 280, 220, 18)}
        <span class="ico" style="position:absolute;left:12px;top:12px;width:40px;height:40px;border-radius:12px;background:rgba(5,5,6,.6);color:#F8F8F8">${SL.icon(i === 4 ? "video" : "image", 22)}</span></div>`).join("")}
      <div class="fill s10-scrim" style="background:#050506"></div>`);
    const apr = card(cam, 1010, 330, 660, 570, `
      <div class="row" style="position:absolute;left:26px;right:26px;top:24px;gap:14px">${NX(52)}<div class="col"><span class="w6" style="font-size:24px">Nexora</span><span class="f3" style="font-size:20px">LinkedIn · Thu 10:00 AM</span></div><span class="grow"></span>
        <span style="position:relative;width:230px;height:42px"><span class="badge warn s10-need" style="position:absolute;right:0;top:0">${SL.icon("hourglass", 20)}Needs approval</span><span class="badge ok s10-ok" style="position:absolute;right:0;top:0">${SL.icon("circle-check", 20)}Approved</span></span></div>
      ${THUMB("t15", 608, 230, 16, "position:absolute;left:26px;top:100px;")}
      <div style="position:absolute;left:26px;right:26px;top:348px;font-size:24px;line-height:1.4">SOC 2 Type II, done. Thank you, Lakshmi Iyer and the security team.</div>
      <div class="row" style="position:absolute;left:26px;top:432px;gap:12px">${AV("a1", 40)}<span class="f3 s10-who" style="font-size:20px">Meera Kapoor · Approver</span><span class="f3 s10-who2" style="font-size:20px;position:absolute;left:52px;white-space:nowrap">Approved by Meera Kapoor · just now</span></div>
      <div class="row" style="position:absolute;left:26px;right:26px;top:486px;gap:12px"><span class="grow"></span><div class="btn" style="font-size:22px">Request changes</div>
        <div class="btn cta s10-go" style="font-size:22px;min-width:190px">${SL.icon("check", 22)}<span style="position:relative;display:inline-block;width:110px;height:30px"><span class="s10-a" style="position:absolute;left:0;top:0">Approve</span><span class="s10-b" style="position:absolute;left:0;top:0">Approved</span></span></div></div>`, "lift");
    const tiles = $$(lib, ".s10-t"), scrim = $(lib, ".s10-scrim"), need = $(apr, ".s10-need"), okb = $(apr, ".s10-ok"), go = $(apr, ".s10-go");
    const who = $(apr, ".s10-who"), who2 = $(apr, ".s10-who2"), la = $(apr, ".s10-a"), lb = $(apr, ".s10-b");
    at(45.4, 50.3, root, (t) => {
      const pin = fin(t, 45.9, 0.85), z = E.inOutCubic(clamp((t - 49.55) / 0.55));
      tf(cam, { s: lerp(1, 0.62, z), o: 1 - clamp((t - 49.75) / 0.35), b: 6 * z });
      tf(lib, { y: (1 - pin) * 50, s: lerp(0.94, 1, pin), o: clamp((t - 45.9) / 0.3), b: (1 - pin) * 14 });
      reveal(hA, t, 46.15, 49.45); reveal(hB, t, 46.45, 49.5);
      tiles.forEach((e) => { const i = +e.dataset.i, t0 = 46.1 + ((i % 3) + Math.floor(i / 3)) * 0.06, s = pop(t, t0, 0.45, 0.62); tf(e, { s: lerp(0.85, 1, s), o: clamp((t - t0) / 0.12) }); });
      tf(scrim, { o: 0.5 * E.outCubic(clamp((t - 46.9) / 0.5)) });
      const ap = fin(t, 46.9, 0.75); tf(apr, { y: (1 - ap) * 150, o: clamp((t - 46.9) / 0.2), s: lerp(0.96, 1, ap) });
      const done = t >= 48.1;
      tf(need, { o: done ? 0 : 1 }); const ds = pop(t, 48.1, 0.38, 0.5); tf(okb, { s: lerp(0.6, 1, ds), o: clamp((t - 48.1) / 0.08) });
      tf(who, { o: 1 - clamp((t - 48.2) / 0.12) }); tf(who2, { o: clamp((t - 48.25) / 0.2) });
      tf(la, { o: done ? 0 : 1 }); tf(lb, { o: done ? 1 : 0 });
      tf(go, { s: 1 - 0.05 * bump(t, 48.04, 0.12) });
      if (t >= 47.2 && t < 48.8) {
        const g = mid(sbox(go));
        cursorAt(t, [[47.2, [1720, 1012]], [47.95, g]], [48.0], clamp((t - 47.2) / 0.15) * (1 - clamp((t - 48.5) / 0.25)));
      }
    });
    cue(46.0, "hit", { v: 0.45 });
    tiles.forEach((e, i) => cue(46.1 + ((i % 3) + Math.floor(i / 3)) * 0.06, "tick", { v: 0.12, pan: 0.4 }));
    cue(46.9, "glassSlide", { v: 0.4 });
    cue(48.0, "click", { v: 0.65, pan: 0.4 });
    cue(48.1, "chime", { v: 0.55 });
    cue(49.55, "whoosh", { v: 0.5 });
    cue(50.0, "riser", { v: 0.8, d: 2.0 });
  }

  // ---------------------------------------------------------------- 11 · montage (50 – 52): every module, one plane
  {
    const root = layer(32), plane = div(root, "abs0");
    plane.dataset.qaRole = "ui";
    place(plane, CX - 1300, CY - 760, 2600, 1520);
    css(plane, { backgroundImage: "linear-gradient(rgba(255,255,255,.05) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.05) 2px, transparent 2px)", backgroundSize: "120px 120px" });
    const M = [
      `<div class="f3" style="font-size:30px">Engagement rate</div><div class="kpi-v" style="font-size:96px;margin-top:20px">4.82%</div><span class="badge ok" style="margin-top:24px;height:50px;font-size:28px">${SL.icon("trending-up", 26)}0.6 pts</span>`,
      `<div class="w7" style="font-size:34px">Engagement</div><svg width="480" height="200" style="margin-top:30px"><path d="M0 170 C80 160 120 120 180 130 S280 70 330 80 S420 20 480 10" fill="none" stroke="#F93C59" stroke-width="7" stroke-linecap="round"/><path d="M0 185 C90 180 140 160 200 160 S300 120 360 118 S440 90 480 80" fill="none" stroke="#3987E5" stroke-width="7" stroke-linecap="round"/></svg>`,
      `PHOTO:t7:linkedin`,
      `<div class="w7" style="font-size:34px">November</div><div style="display:grid;grid-template-columns:repeat(7,56px);gap:8px;margin-top:26px">${Array.from({ length: 21 }, (_, i) => `<div style="height:56px;border-radius:10px;background:${[3, 8, 12, 16].includes(i) ? "#F93C59" : "#1F2126"}"></div>`).join("")}</div>`,
      `<div class="w7" style="font-size:34px">Inbox</div>${[["a7", "Vikram Singh"], ["a3", "Neha Sharma"], ["a5", "Kavya Reddy"]].map(([a, n]) => `<div class="row" style="gap:18px;margin-top:22px">${AV(a, 60)}<span class="w6" style="font-size:30px">${n}</span></div>`).join("")}`,
      `<div class="w7" style="font-size:34px">Sentiment</div><div class="gauge-num" style="font-size:110px;margin-top:20px">78%</div><div class="fok w6" style="font-size:30px">positive</div>`,
      `PHOTO:t16:instagram`,
      `<div class="btn soft" style="font-size:30px;height:72px">${SL.icon("sparkles", 30)} Rewrite with AI</div>${[420, 460, 300].map((w) => `<div style="width:${w}px;height:20px;border-radius:10px;background:#1F2126;margin-top:26px"></div>`).join("")}`,
      `<span class="badge ok" style="height:56px;font-size:30px">${SL.icon("circle-check", 28)}Approved</span><div style="margin-top:28px">${THUMB("t15", 480, 170, 18)}</div>`,
      `<div class="w7" style="font-size:34px">Best time</div><div style="display:grid;grid-template-columns:repeat(6,68px);gap:8px;margin-top:26px">${Array.from({ length: 18 }, (_, i) => `<div style="height:40px;border-radius:8px;background:${SEQ9[(i * 7 + 3) % 5]}"></div>`).join("")}</div>`,
      `PHOTO:t19:x`,
      `<div class="row" style="gap:20px"><span class="tile-ic" style="width:72px;height:72px;border-radius:20px">${SL.icon("sparkles", 38)}</span><span class="w7" style="font-size:36px">Best time found</span></div><div class="f2" style="font-size:30px;margin-top:24px;line-height:1.4">Tue 9:15 AM reaches<br>2.3x more people.</div>`,
    ];
    const minis = M.map((h, i) => {
      const x = 90 + (i % 4) * 620, y = 120 + Math.floor(i / 4) * 440;
      const isP = h.startsWith("PHOTO:"), [, im, k] = isP ? h.split(":") : [];
      const c = card(plane, x, y, 560, 380, isP ? `${THUMB(im, 560, 380, 0)}<span style="position:absolute;left:24px;top:24px">${NET(k, 56)}</span>` : `<div style="position:absolute;left:40px;top:36px;right:40px">${h}</div>`, "lift");
      return { c, i, d: Math.hypot((i % 4) - 1.5, Math.floor(i / 4) - 1) };
    });
    at(49.6, 52.25, root, (t) => {
      const e = E.inOutSine(clamp((t - 49.6) / 2.2));
      plane.style.transform = `perspective(2600px) rotateX(${lerp(40, 52, e).toFixed(3)}deg) rotateZ(${lerp(-16, -24, e).toFixed(3)}deg) translate3d(${lerp(260, -260, e).toFixed(2)}px, ${lerp(220, -160, e).toFixed(2)}px, 0) scale(${lerp(0.82, 1.05, e).toFixed(4)})`;
      plane.style.opacity = (clamp((t - 49.75) / 0.35) * (1 - clamp((t - 51.65) / 0.4))).toFixed(3);
      minis.forEach((m) => { const t0 = 49.8 + m.d * 0.08, p = fin(t, t0, 0.6), xo = E.inQuad(clamp((t - 51.2 - m.d * 0.1) / 0.4)); tf(m.c, { s: lerp(0.85, 1, p) * (1 - 0.3 * xo), o: clamp((t - t0) / 0.2) * (1 - xo), b: 8 * xo }); });
    });
    cue(49.8, "whoosh", { v: 0.4, pan: -0.3 });
    cue(51.2, "suck", { v: 0.6 });
  }

  // ---------------------------------------------------------------- 12 · end card (52 – 60): the flock lands as the mark
  {
    const root = layer(34), L = lockup(root);
    const tag = head(root, [["Every channel, ", false, "w5"], ["moving as one.", true]], CX, 650, 58, { center: true, role: "copy", color: C.fg2 });
    const cta = div(root, "btn cta", `<span>Book a demo</span>${SL.icon("arrow-right", 32)}`, "position:absolute;left:0;top:0;height:88px;padding:0 46px;font-size:36px;gap:14px");
    cta.dataset.qaRole = "copy";
    const foot = label(root, "Part of AllAI Suite", "w5", 34, CX, 975, "center", "caption", `color:${C.fg3}`);
    at(51.9, 60.01, root, (t) => {
      const end = clamp((t - 59.35) / 0.6);
      L.set(E.outCubic(clamp((t - 52.12) / 0.3)), E.inOutCubic(clamp((t - 52.25) / 0.55)));
      tf(L.w, { o: 1 - end, s: 1 + 0.01 * clamp((t - 52.2) / 7) });
      reveal(tag, t, 52.75, undefined, 0.014);
      tag.wrap.style.opacity = (1 - end).toFixed(3);
      const cs = pop(t, 53.25, 0.48, 0.62);
      tf(cta, { x: CX - cta.offsetWidth / 2, y: 748 + (1 - cs) * 24, s: lerp(0.85, 1, cs), o: clamp((t - 53.25) / 0.15) * (1 - end) });
      mv(foot, { y: (1 - fin(t, 53.6, 0.6)) * 14, o: clamp((t - 53.6) / 0.3) * (1 - end) });
    });
    // the flock rises from the montage, lands as the mark, then flies out along the wordmark
    Flock.add(50.9, 53.4, "front", (b, i, t) => {
      const start = [W * (0.06 + 0.88 * b.k) - 140 * (t - 50.9), H * (0.1 + 0.8 * b.d) - 90 * (t - 50.9)];
      const p = intoMark(b, i, t, start, 51.3, 52.2, 52.25);
      p[2] *= clamp((t - 50.95 - 0.35 * b.e) / 0.3);
      return p;
    });
    // and a few birds keep circling high above it
    Flock.add(53.2, 60.0, "back", (b, i, t) => {
      if (i % 3) return null;
      const [dx, dy] = Flock.shape(b, t, 380, 90, 0.1 * Math.sin(t * 0.5));
      return [CX + 560 * Math.sin(0.28 * (t - 53.2) - 1.2) + dx, 150 + 20 * Math.sin(0.8 * t) + dy, 0.42 * env(t, 53.2, 60.0, 1.2, 0.8), 1.3 * b.s];
    });
    cue(52.0, "boom", { v: 1 });
    cue(52.0, "impact", { v: 0.75 });
    cue(52.15, "glass", { v: 0.4 });
    cue(52.25, "whoosh", { v: 0.4, pan: 0.4 });
    cue(53.25, "pop", { v: 0.4 });
    cue(53.6, "shimmer", { v: 0.25 });
  }
}
const SEQ9 = ["#4A1422", "#7A1832", "#B61E45", "#F93C59", "#1A1013"];

// the light behind the dark scenes: crimson and orange kept to the corners, a bloom on each drop
function glowAt(t) {
  const a = 0.12 * t, fl = (t0, k) => (t >= t0 ? k * Math.exp(-(t - t0) * 4.5) : 0);
  const en = K(t, [[0, 0.55], [5.0, 0.7], [5.55, 0.15], [6.0, 1.3, E.outCubic], [7.6, 0.9], [35.6, 0.9], [36.4, 0.55], [39.5, 0.65], [40.0, 1.2, E.outCubic],
    [41.6, 0.9], [51.2, 0.8], [51.85, 0.2], [52.0, 1.2, E.outCubic], [54.0, 0.95], [60, 0.95]]);
  return {
    orbs: [
      [W * (0.9 + 0.03 * Math.sin(a)), H * (0.02 + 0.04 * Math.cos(a * 0.8)), H * 0.44, 0.5, 0],
      [W * (0.06 + 0.04 * Math.cos(a * 0.7)), H * (1.06 + 0.03 * Math.sin(a)), H * 0.42, 0.34, 1],
      [W * (0.6 + 0.06 * Math.sin(a * 0.5 + 2)), H * 1.18, H * 0.4, 0.26, 2],
      [W * 0.02, H * 0.0, H * 0.36, 0.3, 3],
      [CX, CY, H * 0.3, fl(6, 0.42) + fl(40, 0.3) + fl(52, 0.3), 2],
    ],
    energy: en, flash: fl(6, 0.3) + fl(40, 0.2) + fl(52, 0.2), warp: 0.18, dark: clamp((t - 59.35) / 0.6) * 0.92,
  };
}

// every image is decoded before the first frame, so no frame ever samples a half-loaded picture
const PRELOADED = {};
(async () => {
  const srcs = ["brand/logo-white.svg", "brand/logo-mark.svg"];
  for (let i = 1; i <= 23; i++) srcs.push(IMG("t" + i));
  for (let i = 1; i <= 15; i++) srcs.push(IMG("a" + i));
  await Promise.all(srcs.map((s) => { const im = new Image(); im.src = s; PRELOADED[s] = im; return im.decode().catch(() => {}); }));
  Stage.boot(build, { glow: glowAt, fast: [[4.95, 6.6], [12.7, 14.0], [19.4, 20.8], [25.5, 26.5], [29.4, 30.8], [39.8, 40.5], [45.4, 46.8], [49.5, 52.6]] });
})();
