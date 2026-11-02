// Background: glow gradients. Large soft orbs of light over a dark base gradient, their edges warped by slow noise so
// they read as light, not circles; a gentle bloom, a vignette and a flash. Pure function of the uniforms.
// Colours: FILM.palette.glow = { base: [bottom, top], colors: [c0 … c4] }. Each frame the film passes orbs in stage px.
"use strict";

const Glow = (() => {
  const N = 5;
  const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uT, uEnergy, uFlash, uDark, uWarp;
uniform vec4 uO[${N}];          // orb: x, y (shader space), radius, intensity
uniform vec3 uC[${N}];          // orb colours
uniform vec3 uBase0, uBase1, uFlashC;
uniform vec4 uRay;              // light rays from a point: x, y (shader space), intensity, ray count
uniform float uRayRot;
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3. - 2.*f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), u.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), u.x), u.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 4; i++) { v += a*noise(p); p = p*2.07 + 3.1; a *= .5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy/uRes;
  vec2 p = (gl_FragCoord.xy - .5*uRes)/uRes.y;
  vec2 q = p + uWarp*vec2(fbm(p*1.8 + vec2(0., uT*.05)) - .5, fbm(p*1.8 + vec2(4.7, -uT*.04)) - .5);
  vec3 col = mix(uBase0, uBase1, smoothstep(0., 1., uv.y));
  vec3 light = vec3(0.);
  for (int i = 0; i < ${N}; i++) {
    vec2 d = q - uO[i].xy;
    float r = max(uO[i].z, 1e-3);
    float k = uO[i].w*exp(-dot(d, d)/(r*r));
    light += uC[i]*k;
  }
  light *= uEnergy;
  if (uRay.z > 0.) {                                    // god rays: soft spokes of light turning around a point
    vec2 dr = p - uRay.xy; float ang = atan(dr.y, dr.x), rad = length(dr);
    float spokes = pow(.5 + .5*sin(ang*uRay.w + uRayRot + 1.6*noise(vec2(ang*2.5, uT*.15))), 6.);
    light += uFlashC*uRay.z*spokes*exp(-rad*2.1)*smoothstep(0., .06, rad);
  }
  col += light + .18*light*light;                       // a little bloom: bright cores lean toward white
  col += uFlashC*uFlash*smoothstep(1.1, 0., length(p));
  col = 1. - exp(-col*1.1);                             // filmic roll-off: highlights compress instead of clipping
  float vig = smoothstep(1.2, .2, length((uv - .5)*vec2(1., .82)));
  col *= mix(.4, 1., vig);
  col *= 1. - uDark;
  col += (hash(gl_FragCoord.xy + uT) - .5)/255.;        // dither: no banding in the dark gradients
  gl_FragColor = vec4(col, 1.);
}`;
  let gl, U = {};
  const C = PAL.glow;

  function init(canvas) {
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true, antialias: false });
    if (!gl) throw new Error("WebGL is not available (the glow background needs it; run doctor)");
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, "attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }"));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog); gl.useProgram(prog);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, "a"); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    for (const n of ["uRes", "uT", "uEnergy", "uFlash", "uDark", "uWarp", "uO", "uC", "uBase0", "uBase1", "uFlashC", "uRay", "uRayRot"]) U[n] = gl.getUniformLocation(prog, n);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform3fv(U.uBase0, vec3(C.base[0])); gl.uniform3fv(U.uBase1, vec3(C.base[1]));
    gl.uniform3fv(U.uFlashC, vec3(C.flash || C.colors[0]));
  }

  // stage px → shader space (centre origin, height = 1)
  const X = (x) => (x - W / 2) / H, Y = (y) => (H / 2 - y) / H;

  // s: { orbs: [[x, y, r, k, colourIndex] …] (stage px, up to 5), energy, flash, dark, warp,
  //      rays: [x, y, intensity, count] (stage px; optional), rayRot (radians) }
  function draw(t, s) {
    const ry = s.rays || [0, 0, 0, 0];
    gl.uniform4f(U.uRay, X(ry[0]), Y(ry[1]), ry[2], ry[3]); gl.uniform1f(U.uRayRot, s.rayRot || 0);
    gl.uniform1f(U.uT, t); gl.uniform1f(U.uEnergy, s.energy === undefined ? 1 : s.energy);
    gl.uniform1f(U.uFlash, s.flash || 0); gl.uniform1f(U.uDark, s.dark || 0); gl.uniform1f(U.uWarp, s.warp === undefined ? 0.12 : s.warp);
    const o = new Float32Array(N * 4), c = new Float32Array(N * 3);
    s.orbs.slice(0, N).forEach(([x, y, r, k, ci], i) => { o.set([X(x), Y(y), r / H, k], i * 4); c.set(vec3(C.colors[ci === undefined ? i % C.colors.length : ci]), i * 3); });
    gl.uniform4fv(U.uO, o); gl.uniform3fv(U.uC, c);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  return { init, draw };
})();
