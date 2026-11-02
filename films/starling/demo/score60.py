"""Starling Demo score: the motion-film score (scripts/audio/score.py) re-arranged for this 60 s film.

    python score60.py <cues.json> <out.wav> --dur=60

Same synthesis, mix and mastering as the skill's score; only the arrangement moves to the film's timeline:
tension intro (0–6) → drop (6) → groove (6–36) → filtered breakdown (36–40) → drop (40) → groove (40–50)
→ build (50–52) → final hit (52) → groove tail (52–56) → ring-out (56–60). Snare rolls into 14, 30, 40 and 52.
"""
import importlib.util
import os
import sys
from pathlib import Path

import numpy as np

# the motion-film-pro plugin's score (override with MF_SCORE=<path to score.py>)
BASE = Path(os.environ.get("MF_SCORE") or Path.home() / ".claude/plugins/cache/motion-film-pro/motion-film-pro/2.0.0-beta.3/skills/motion-film/scripts/audio/score.py")
spec = importlib.util.spec_from_file_location("mf_score", BASE)
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)          # reads --dur from argv, like the original
for k in dir(base):
    if not k.startswith("__") and k not in ("main", "music", "chord_at", "groove_on"):
        globals()[k] = getattr(base, k)

FINAL = 52.0


def chord_at(t):
    return CHORDS["Cmaj9"] if t >= FINAL else CHORDS[PROG[int(t // BAR) % 4]]


def groove_on(t):
    return (6.0 <= t < 36.0) or (40.0 <= t < 50.0) or (FINAL <= t < 56.0)


def music():
    drums, bass, pad, arp = (np.zeros((2, N)) for _ in range(4))
    kicks = []

    # ---- drums
    for i in range(int(DUR / (BEAT / 4))):
        t = i * BEAT / 4
        q = i % 16
        if groove_on(t):
            if q % 4 == 0:
                place(drums, kick(1.0), t, 0.95)
                kicks.append(t)
            if q in (4, 12):
                place(drums, clap(1.0), t, 0.42, 0.0)
            if q % 4 == 2:
                place(drums, hat(1.0, open_=(q == 14)), t, 0.16 if q == 14 else 0.13, 0.25)
            elif q % 2 == 1 and t >= 14:
                place(drums, hat(0.6), t, 0.06, -0.3)
        if 0.5 <= t < 6.0:                      # intro: tightening 16th ticks
            dens = 1 if t > 3.8 else (2 if t > 1.5 else 4)
            if q % dens == 0:
                place(drums, hat(1.0), t, 0.04 + 0.06 * (t / 6), 0.35 if q % 2 else -0.35)
        if 50.0 <= t < FINAL and q in (0, 8):   # build: half-time kicks
            place(drums, kick(0.9), t, 0.8)
            kicks.append(t)
        if 56.0 <= t < 57.0 and q == 0:         # tail: one last soft kick
            place(drums, kick(0.7), t, 0.5)
    for start, end, v in ((13.0, 14.0, 0.35), (29.0, 30.0, 0.45), (39.0, 40.0, 0.5), (51.0, 52.0, 0.55)):
        for j in range(16):
            frac = j / 16
            place(drums, snare(0.5 + 0.5 * frac), start + (end - start) * (1 - (1 - frac) ** 1.6), v * (0.35 + 0.65 * frac), 0.1)
    for t in (6.0, 14.0, 30.0, 40.0, FINAL):
        place(drums, crash(1.0), t, 0.35)

    # ---- bass
    for i in range(int(DUR / (BEAT / 2))):
        t = i * BEAT / 2
        if not (groove_on(t) or (50.0 <= t < FINAL and i % 2 == 0)):
            continue
        f = mtof(chord_at(t)[0] + 12)
        n = int(BEAT / 2 * SR)
        place(bass, np.sin(2 * np.pi * f * tt(n)) * adsr(n, 0.004, 0.18, 0.8, 0.03), t, 0.5)
        if i % 2 == 1:
            place(bass, filt(saw(f * 2, n), "lp", 700) * adsr(n, 0.003, 0.08, 0.3, 0.02), t, 0.16, 0.0)
    for (a, b, rt) in ((0.0, 6.0, 33), (36.0, 40.0, 29)):   # intro and breakdown sub drones
        n = int((b - a) * SR)
        t = tt(n)
        place(bass, np.sin(2 * np.pi * mtof(rt + 12) * t) * np.minimum(1, t / 1.5) * np.minimum(1, (b - a - t) / 0.2), a, 0.22)

    # ---- pad: a chord per bar, then one long Cmaj9 that rings out from the final hit
    for b in range(int(np.ceil(DUR / BAR))):
        t0 = b * BAR
        if t0 > FINAL:
            break
        root, voicing = chord_at(t0 + 0.01)
        dur = BAR + 0.6 if t0 < FINAL else DUR - t0
        n = int(dur * SR)
        env = adsr(n, 0.35, 1.0, 0.85, 0.6, hold=dur - 0.6) if t0 < FINAL else np.minimum(1, tt(n) / 0.02) * np.exp(-tt(n) * 0.16)
        x = np.zeros((2, n))
        for k, m in enumerate(voicing):
            x += supersaw(mtof(m), n, 5, 0.12, phase_seed=b * 10 + k) * (0.8 if k else 1.0)
        place(pad, x * env, t0, 0.19 if t0 < FINAL else 0.24)
    cut = np.interp(tt(N), [0, 5.8, 6.0, 35.8, 36.2, 39.2, 40.0, 49.6, 50.0, 51.9, 52.0, 60.0],
                    [400, 1800, 3200, 3200, 700, 900, 3600, 3600, 1200, 3000, 5200, 2600])
    pad = np.vstack([sweep(pad[0], cut, "lp", 0.9), sweep(pad[1], cut, "lp", 0.9)])

    # ---- arp: 16th plucks with a dotted-eighth ping-pong delay
    pattern = [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 2, 3, 1, 4, 2]
    for i in range(int(DUR / (BEAT / 4))):
        t = i * BEAT / 4
        if not ((6.0 <= t < 50.0) or (FINAL <= t < 59.5)):
            continue
        _, voicing = chord_at(t)
        m = voicing[pattern[i % 16] % len(voicing)] + 12
        lvl = 0.24 if t < 14 else 0.3
        if 36.0 <= t < 40.0:
            lvl = 0.17
        if t >= FINAL:
            lvl = 0.28 * max(0.0, 1 - (t - FINAL) / 7.8) ** 1.3
        place(arp, pluck(mtof(m), 0.3, 1.2 if t >= 30 else 1.0), t, lvl, (-0.35, 0.35)[i % 2])
    delayed = np.zeros_like(arp)
    d = int(0.75 * BEAT * SR)
    for k in range(1, 6):
        g = 0.42 ** k
        for ch in (0, 1):
            delayed[ch, d * k:] += (arp[1 - ch] if k % 2 else arp[ch])[: N - d * k] * g
    arp = filt(arp + delayed * 0.8, "hp", 180)

    # ---- sidechain under every kick
    sc = np.ones(N)
    for k in kicks:
        i0, n = int(k * SR), int(0.32 * SR)
        seg = 1 - 0.75 * np.exp(-tt(n) / 0.075)
        sc[i0:i0 + n] = np.minimum(sc[i0:i0 + n], seg[: max(0, min(n, N - i0))])
    bass *= sc
    pad *= 0.35 + 0.65 * sc
    arp *= 0.55 + 0.45 * sc
    return drums, bass, pad, arp


base.chord_at, base.groove_on, base.music = chord_at, groove_on, music

if __name__ == "__main__":
    base.main()
