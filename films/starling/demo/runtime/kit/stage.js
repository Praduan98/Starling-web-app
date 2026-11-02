// Stage kit: a film page's scene registry, layout helpers and page interface. The page defines window.FILM, loads the
// runtime (engine, type, kinetic, then this file), and calls Stage.boot(build, options); build() lays the film out with
// layer() and at(). Brand-neutral: colours come from FILM.palette or the page, sizes from FILM.w / FILM.h.
//   Stage.boot(build, { glow: (t) => Glow state, fast: [[t0, t1, samples?] …], audio: <url> })
"use strict";

const STAGE = document.getElementById("stage");
if (!STAGE) throw new Error('the film page needs <div id="stage"></div> before the runtime scripts');
const SC = [];          // scenes: { a, b, root, update(t) }; root is shown only while a <= t < b
const EVERY = [];       // per-frame drawers that run before the scenes (backgrounds)
let CUR = null;         // the cursor's state this frame, set by the scene that has it ({x, y, o, press, click, light})
const CX = W / 2, CY = H / 2;

// base styles: the stage, layers, per-character text, the cursor and the ?play preview. Inserted first, so the page's
// own styles win.
(() => {
  const s = document.createElement("style");
  s.textContent = `html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#000}
#stage{position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden;transform-origin:0 0;-webkit-font-smoothing:antialiased}
.layer{position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden}
.abs{position:absolute;left:0;top:0;line-height:1.12;white-space:nowrap}
.abs>svg{display:block}
.wd,.ch,.sp{display:inline-block}
.w3{font-weight:300}.w4{font-weight:400}.w5{font-weight:500}.w6{font-weight:600}.w7{font-weight:700}.w8{font-weight:800}.w9{font-weight:900}.i{font-style:italic}
.cursor{position:absolute;left:0;top:0;width:46px;height:46px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.35))}
.ripple{position:absolute;left:-46px;top:-46px;width:92px;height:92px;border:3px solid;border-radius:50%;box-sizing:border-box}
body.play{width:100vw;height:100vh;cursor:pointer}
#mf-hint{position:fixed;left:16px;bottom:12px;font:14px/1.4 system-ui,sans-serif;color:rgba(255,255,255,.6);z-index:999}
#mf-cover{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:998;font:600 34px/1 system-ui,sans-serif;color:#fff;background:rgba(0,0,0,.5)}`;
  document.head.prepend(s);
})();

// ---------------------------------------------------------------- scenes and layers
function layer(z, cls) { const d = el("div", "layer" + (cls ? " " + cls : ""), STAGE); d.style.zIndex = z; return d; }
const at = (a, b, root, update) => SC.push({ a, b, root, update: update || (() => {}) });
const every = (fn) => EVERY.push(fn);
const px = (v) => v.toFixed(2) + "px";
// a smooth bump: 0 outside tc ± d, 1 at tc
const bump = (t, tc, d) => { const u = (t - tc) / d; return Math.abs(u) >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * u); };

// ---------------------------------------------------------------- text
// a centred line of per-character spans from parts [[class, text, size, style?]]; role tags it for design QA
function line(parent, parts, cx, cy, role, z = 2) {
  const L = textLine(parent, parts.map(([c, t, n, x]) => [c, t, `font-size:${n}px;${x || ""}`]), cx, cy, z);
  if (role) L.wrap.dataset.qaRole = role;
  L.words = wordsOf(L);
  return L;
}
// a single text block placed by its centre (or its left / right edge)
function label(parent, text, cls, size, x, cy, align = "center", role, style = "") {
  const e = el("div", "abs " + cls, parent, text);
  e.style.cssText += (size ? `font-size:${size}px;` : "") + style;
  if (role) e.dataset.qaRole = role;
  const w = e.offsetWidth, h = e.offsetHeight;
  const o = { e, x: align === "center" ? x - w / 2 : align === "right" ? x - w : x, y: cy - h / 2, w, h };
  tf(e, { x: o.x, y: o.y });
  return o;
}
// move a placed line or block relative to where it was laid out
const mv = (o, s = {}) => tf(o.wrap || o.e, Object.assign({}, s, { x: o.x + (s.x || 0), y: o.y + (s.y || 0) }));
// a word's (or a part's) box on the stage
const boxOf = (L, e) => ({ x: L.x + e.offsetLeft, y: L.y + e.offsetTop, w: e.offsetWidth, h: e.offsetHeight });

// ---------------------------------------------------------------- glitch
// horizontal slice copies of a full-frame group, jittered per frame. The copies are decoration (data-qa="decor"); design
// QA reads the text on the original. Hide the original while the slices show.
function slicer(src, n, y0, y1) {
  return Array.from({ length: n }, (_, i) => {
    const c = src.cloneNode(true); c.dataset.qa = "decor";
    const a = y0 + ((y1 - y0) * i) / n, b = y0 + ((y1 - y0) * (i + 1)) / n;
    c.style.clipPath = `inset(${px(a)} 0 ${px(H - b)} 0)`;
    c.style.visibility = "hidden";
    src.parentNode.appendChild(c);
    return c;
  });
}
function glitch(sl, amp, seed = 0) {
  const f = Math.round(FT * FPS);
  sl.forEach((c, i) => {
    c.style.visibility = amp > 0.01 ? "visible" : "hidden";
    if (amp <= 0.01) return;
    const jx = (hash(i * 7.31 + f * 1.93 + seed) - 0.5) * 2, keep = hash(i * 3.7 + f * 0.71 + seed) > 0.3 ? 1 : 0.15;
    c.style.transform = `translateX(${px(jx * 0.1 * W * amp * keep)})`;
    c.style.opacity = hash(i * 5.1 + f + seed) > 0.25 * amp ? "1" : "0.35";
  });
}

// ---------------------------------------------------------------- liquid wipes
// a fill whose edge is a moving wave, rising from the bottom or falling from the top, optionally led by a drip.
//   wipe({ a, b, from: "top" | "bottom", fill: colour | [[offset, colour] …] (top to bottom), amp (px), drip (px), z })
const WIPES = [];
function wipe(o) {
  const svg = svgEl("svg", { class: "layer", width: W, height: H, viewBox: `0 0 ${W} ${H}` }, STAGE);
  svg.style.zIndex = o.z || 45;
  svg.style.visibility = "hidden";
  svg.style.filter = "drop-shadow(0 12px 24px rgba(0,0,0,.25))";
  let fill = o.fill;
  if (Array.isArray(o.fill)) {
    const id = "mf-wipe" + WIPES.length, g = svgEl("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 }, svgEl("defs", {}, svg));
    for (const [off, col] of o.fill) svgEl("stop", { offset: off, "stop-color": col }, g);
    fill = `url(#${id})`;
  }
  WIPES.push(Object.assign({ from: "bottom", amp: 30, drip: 0, ease: E.inOutCubic }, o, { svg, path: svgEl("path", { fill }, svg) }));
}
function drawWipes(t) {
  for (const q of WIPES) {
    const on = t >= q.a && t < q.b;
    q.svg.style.visibility = on ? "visible" : "hidden";
    if (!on) continue;
    const u = clamp((t - q.a) / (q.b - q.a)), top = q.from === "top";
    const dr = q.drip * E.outCubic(clamp(u / 0.5)), h = q.ease(q.drip ? clamp((u - 0.3) / 0.7) : u) * (H + 140) - 40;
    let d = top ? `M0 -20 L${W} -20` : `M0 ${H + 20} L${W} ${H + 20}`;
    for (let x = W; x >= 0; x -= 24) {
      const e = h + dr * Math.exp(-(((x - CX) / 70) ** 2)) + q.amp * Math.sin(x / 160 + t * 9) * clamp(h / 200 + 0.2);
      d += ` L${x} ${(top ? e : H - e).toFixed(1)}`;
    }
    q.path.setAttribute("d", d + " Z");
  }
}

// ---------------------------------------------------------------- the page interface (render.mjs, design_qa.mjs) and boot
const Stage = (() => {
  let grain = false, fast = [];
  function seek(t) {
    FT = Math.round(t * FPS) / FPS;
    CUR = null;
    for (const fn of EVERY) fn(t);
    for (const s of SC) {
      const on = t >= s.a && t < s.b;
      s.root.style.display = on ? "" : "none";
      if (on) s.update(t);
    }
    drawWipes(t);
    if (typeof Cursor !== "undefined") Cursor.update(CUR);
    if (grain) Grain.draw();
  }

  async function boot(build, o = {}) {
    try {
      await Promise.all((FILM.fontLoad || []).map((f) => document.fonts.load(f)));
      if (o.glow) {
        const c = el("canvas", "layer", STAGE); c.width = W; c.height = H; c.style.zIndex = 0;
        Glow.init(c);
        every((t) => Glow.draw(t, o.glow(t)));
      }
      build();
      if (typeof Cursor !== "undefined") Cursor.build(STAGE);
      if (FILM.grain && typeof Grain !== "undefined") {
        const g = el("canvas", "layer", STAGE); g.width = W; g.height = H; g.style.zIndex = 90; g.style.pointerEvents = "none";
        Grain.init(g);
        grain = true;
      }
      fast = o.fast || [];
      window.__seek = seek;
      window.__info = () => ({ w: W, h: H, fps: FPS, dur: DUR, bpm: BPM });
      window.__cues = () => CUES;
      window.__fast = () => fast;
      const q = new URLSearchParams(location.search), t0 = +(q.get("t") || 0);
      seek(t0);
      if (q.has("play")) preview(t0, q.get("audio") || o.audio);
      window.__ready = true;
    } catch (e) { window.__error = "ERR " + (e.stack || e); throw e; }
  }

  // ?play: real time, scaled to the window, against the score when there is one (so picture and sound stay locked),
  // else the wall clock. Click or space: play / pause; arrows: 2 s.
  function preview(t0, audio) {
    document.body.classList.add("play");
    const fit = () => { const k = Math.min(innerWidth / W, innerHeight / H); STAGE.style.transform = `translate(${(innerWidth - W * k) / 2}px, ${(innerHeight - H * k) / 2}px) scale(${k})`; };
    fit(); addEventListener("resize", fit);
    const au = audio ? new Audio(audio) : null;
    let base = t0, since = null;
    if (au) au.addEventListener("loadedmetadata", () => (au.currentTime = t0), { once: true });
    const now = () => (au ? au.currentTime : since === null ? base : base + (performance.now() - since) / 1000);
    const setT = (t) => { t = clamp(t, 0, DUR - 0.01); if (au) au.currentTime = t; else { base = t; if (since !== null) since = performance.now(); } };
    const hint = el("div", "", document.body, "click or space: play / pause · ← →: 2 s" + (au ? "" : " · no sound (preview --score adds the score)"));
    hint.id = "mf-hint";
    const cover = el("div", "", document.body, "▶&nbsp; Click to play"); cover.id = "mf-cover";   // frame 0 may be empty: say it is waiting
    const toggle = () => {
      cover.style.display = "none";
      if (au) return au.paused ? au.play() : au.pause();
      if (since === null) since = performance.now(); else { base = now(); since = null; }
    };
    addEventListener("click", toggle);
    addEventListener("keydown", (e) => {
      if (e.key === " ") { e.preventDefault(); toggle(); }
      if (e.key === "ArrowRight") setT(now() + 2);
      if (e.key === "ArrowLeft") setT(now() - 2);
    });
    const loop = () => {
      if (!au && now() >= DUR) setT(0);
      seek(Math.min(DUR - 1e-3, now()));
      requestAnimationFrame(loop);
    };
    loop();
    window.__preview = au;
  }

  return { boot, seek };
})();
