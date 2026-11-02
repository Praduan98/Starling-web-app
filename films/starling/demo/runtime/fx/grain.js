// Film grain: a canvas over the whole stage, blended as overlay. The grain pattern is chosen by frame number, so every
// motion-blur sub-frame of a frame carries the same grain and averaging does not wash it out; it changes every frame like
// real film. FILM.grain = { amount: 0–1 (opacity, ~0.1 for subtle), size: 1 (px per grain), tiles: 8 }.
"use strict";

const Grain = (() => {
  let ctx, pats = [], cfg;
  function init(canvas) {
    cfg = Object.assign({ amount: 0.1, size: 1, tiles: 8 }, FILM.grain || {});
    ctx = canvas.getContext("2d");
    canvas.style.mixBlendMode = "overlay";
    canvas.style.opacity = cfg.amount;
    const T = 256, R = rng(911);
    for (let k = 0; k < cfg.tiles; k++) {
      const c = document.createElement("canvas"); c.width = c.height = T;
      const x = c.getContext("2d"), img = x.createImageData(T, T);
      for (let i = 0; i < T * T; i++) {
        // roughly Gaussian luminance noise around mid-grey (overlay leaves mid-grey unchanged)
        const n = (R() + R() + R() + R() - 2) * 0.5;
        const v = Math.max(0, Math.min(255, 128 + n * 255));
        img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      pats.push(ctx.createPattern(c, "repeat"));
    }
  }
  // t: film time; uses the frame number (FT), so sub-frames of one frame match
  function draw(amount) {
    const f = Math.round(FT * FPS), k = f % pats.length;
    const ox = Math.floor(hash(f * 1.7) * 256), oy = Math.floor(hash(f * 3.1 + 5) * 256);
    ctx.save();
    ctx.setTransform(cfg.size, 0, 0, cfg.size, -ox, -oy);
    ctx.fillStyle = pats[k];
    ctx.fillRect(0, 0, W / cfg.size + 512, H / cfg.size + 512);
    ctx.restore();
    if (amount !== undefined) ctx.canvas.style.opacity = amount;
  }
  return { init, draw };
})();
