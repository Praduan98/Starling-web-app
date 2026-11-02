"""Starling Demo score v2, "Murmuration": an original, fully arranged product-launch track cut to the 60 s film.

    python score_v2.py <cues.json> <out.wav> --dur=60

120 BPM (a bar is 2 s, so every scene cut is a bar line), A minor / C major. The arrangement follows the picture:
  0–6    the noise      dark drone, ticking hats, heartbeat kick, b9 tension shimmer, vacuum before the drop
  6–10   logo           DROP 1: impact, sub drop and the sonic logo (C F G C) over a wide F → G
  10–14  sign in        filtered four-on-the-floor opening up, offbeat bass, plucks, snare roll
  14–20  home           full groove on the vi–IV–I–V loop
  20–26  composer + AI  the hook enters (soft lead); AI bell arpeggios from the "Rewrite with AI" click
  26–30  planner        tom fill on the whip pan, shaker, syncopated chord stabs
  30–36  inbox          the hook's answer, then a tape stop into the breakdown
  36–40  breakdown      half-time, electric keys play the hook, pitch riser, accelerating snare roll, vacuum
  40–50  analytics …    DROP 2: everything (supersaw stabs, rolling bass, full hook doubled by bells)
  50–52  montage        build: roll to 32nds, filter sweep, vacuum
  52–60  end card       final hit: the sonic logo resolves on Cmaj9, a groove tail to 56, ring-out to 60
Synthesis primitives, the film's sound design (its cue sheet) and loudness/limiting come from the skill's score.py.
"""
import importlib.util
import os
import json
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.signal import lfilter

# the motion-film-pro plugin's score (override with MF_SCORE=<path to score.py>)
BASE = Path(os.environ.get("MF_SCORE") or Path.home() / ".claude/plugins/cache/motion-film-pro/motion-film-pro/2.0.0-beta.3/skills/motion-film/scripts/audio/score.py")
spec = importlib.util.spec_from_file_location("mf_score", BASE)
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
for _k in dir(base):
    if not _k.startswith("__") and _k not in ("main", "music", "chord_at", "groove_on"):
        globals()[_k] = getattr(base, _k)

R = np.random.default_rng(20261102)

# ---------------------------------------------------------------- harmony and form
CH = {
    "Am": (33, [57, 60, 64, 67, 71]),
    "F": (29, [53, 57, 60, 64, 67]),
    "C": (36, [52, 55, 60, 62, 67]),
    "G": (31, [55, 59, 62, 64, 69]),
    "Gs": (31, [55, 60, 62, 67, 72]),
    "Cmaj9": (36, [55, 59, 60, 62, 64, 71]),
}
BARS = (["Am"] * 3 + ["F", "G"] + ["Am", "F"] + ["C", "G", "Am"] + ["F", "C", "G"] + ["Am", "F"] + ["C", "G", "Am"]
        + ["F", "Gs"] + ["F", "G", "Am", "C", "F"] + ["Gs"] + ["Cmaj9"] * 4)
assert len(BARS) == 30
SECTIONS = [("intro", 0, 6), ("logo", 6, 10), ("signin", 10, 14), ("home", 14, 20), ("comp", 20, 26), ("plan", 26, 30),
            ("inbox", 30, 36), ("brk", 36, 40), ("drop", 40, 50), ("build", 50, 52), ("final", 52, 60)]
GROOVE = ("home", "comp", "plan", "inbox")


def bar_chord(t):
    return CH[BARS[min(int(t // BAR), 29)]]


def section(t):
    return next((s for s, a, b in SECTIONS if a <= t < b), "final")


# the sfx in base read the harmony through chord_at
base.chord_at = bar_chord

# the hook, per chord: (beat, midi, length in beats)
MEL = {
    "F": [(0, 81, 1), (1, 79, .5), (1.5, 81, .5), (2, 84, 1), (3, 81, 1)],
    "G": [(0, 83, 1.5), (1.5, 79, .5), (2, 74, 2)],
    "Gs": [(0, 84, 1.5), (1.5, 79, .5), (2, 74, 1), (3, 79, 1)],
    "Am": [(0, 84, 1), (1, 83, .5), (1.5, 81, .5), (2, 76, 1), (3, 79, 1)],
    "C": [(0, 79, 2.5), (2.5, 76, .5), (3, 79, .5), (3.5, 81, .5)],
    "Fend": [(0, 81, .5), (.5, 84, .5), (1, 86, 1), (2, 84, 2)],
}
LOGO_IN = [(6.0, 72, .25), (6.25, 77, .25), (6.5, 79, .5), (7.0, 84, .9), (8.0, 83, .5), (8.5, 79, .5), (9.0, 86, .9)]
LOGO_OUT = [(52.0, 72, .25), (52.25, 76, .25), (52.5, 79, .5), (53.0, 84, 2.6)]


# ---------------------------------------------------------------- instruments
def kick2(v=1.0, click=1.0, decay=6.5):
    n = int(0.55 * SR)
    t = tt(n)
    f = 46 + 140 * np.exp(-t * 28) + 60 * np.exp(-t * 160)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * decay)
    clk = (filt(noise(n), "hp", 3200) * np.exp(-t * 450) * 0.5 + np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 380) * 0.25) * click
    return np.tanh((body * 1.2 + clk) * 1.8) * v


def snare2(v=1.0):
    n = int(0.42 * SR)
    t = tt(n)
    body = (np.sin(2 * np.pi * np.cumsum(180 + 60 * np.exp(-t * 40)) / SR) * 0.7 + np.sin(2 * np.pi * 330 * t) * 0.25) * np.exp(-t * 22)
    return np.tanh((body + filt(noise(n), "bp", (1200, 9000)) * np.exp(-t * 15) * 0.8) * 1.4) * v


def rim(v=1.0):
    n = int(0.06 * SR)
    t = tt(n)
    return (np.sin(2 * np.pi * 1650 * t) * 0.6 + filt(noise(n), "bp", (2000, 6000)) * 0.5) * np.exp(-t * 90) * v


def hat808(v=1.0, open_=False):
    n = int((0.42 if open_ else 0.08) * SR)
    t = tt(n)
    x = sum(np.sign(np.sin(2 * np.pi * f * 1.9 * t + k)) for k, f in enumerate([205.3, 304.4, 369.6, 522.7, 540.0, 800.0])) / 6
    x = filt(x, "hp", 7500, 4) + filt(noise(n), "hp", 9000) * 0.35
    return x * np.exp(-t * (9 if open_ else 55)) * v


def shaker(v=1.0):
    n = int(0.09 * SR)
    t = tt(n)
    return filt(noise(n), "bp", (5500, 12000)) * np.minimum(1, t / 0.006) * np.exp(-t * 45) * v


def ride(v=1.0):
    n = int(1.2 * SR)
    t = tt(n)
    x = sum(np.sin(2 * np.pi * f * 2.3 * t + k * 1.3 + 3 * np.sin(2 * np.pi * f * 1.1 * t)) for k, f in enumerate([310, 456, 589, 783, 1020, 1270])) / 6
    return filt(x, "hp", 3500, 2) * np.exp(-t * 3.5) * v * 0.6


def tom(f0, v=1.0):
    n = int(0.5 * SR)
    t = tt(n)
    body = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.6 * np.exp(-t * 25))) / SR) * np.exp(-t * 8)
    return np.tanh(body * 1.5 + filt(noise(n), "bp", (300, 3000)) * np.exp(-t * 40) * 0.3) * v


def reverse_cym(d):
    y = crash(1.0, d + 0.05)[:, ::-1]
    return y * np.linspace(0, 1, y.shape[1]) ** 2.2


def subdrop(d=1.6):
    n = int(d * SR)
    t = tt(n)
    return np.tanh(np.sin(2 * np.pi * np.cumsum(30 + 50 * np.exp(-t * 2.2)) / SR) * np.exp(-t * 1.6) * np.minimum(1, t / 0.005) * 1.6)


def bassnote(m, dur, drive=1.0, bright=850, a=0.004, rel=0.03):
    f, n = mtof(m), int(dur * SR)
    t = tt(n)
    x = np.sin(2 * np.pi * f * t) + filt(saw(f * 2, n), "lp", bright) * 0.55 * drive
    return np.tanh(x * 1.25) * adsr(n, a, 0.14, 0.82, rel)


def stab(voicing, dur=0.3, seed=0, bright=3400, lift=12):
    n = int((dur + 0.06) * SR)
    t = tt(n)
    x = np.zeros((2, n))
    for k, m in enumerate(voicing):
        x += supersaw(mtof(m + lift), n, 5, 0.14, seed * 7 + k)
    cut = 600 + bright * np.exp(-t * 9)
    x = np.vstack([sweep(x[0], cut, "lp", 1.0), sweep(x[1], cut, "lp", 1.0)])
    return x * adsr(n, 0.003, 0.12, 0.35, 0.06, hold=dur) * (2.2 / len(voicing))


def lead(m, dur, bright=1.0):
    f, n = mtof(m), int((dur + 0.35) * SR)
    t = tt(n)
    vib = 1 + 0.0055 * np.sin(2 * np.pi * 5.4 * t) * np.clip((t - 0.22) / 0.3, 0, 1)
    ph = np.cumsum(f * vib) / SR
    x = 0.5 * saw_phase(ph % 1.0, f * vib / SR) + 0.5 * saw_phase((ph * 1.007 + 0.31) % 1.0, f * 1.007 * vib / SR) + 0.22 * np.sin(np.pi * 2 * ph * 0.5)
    y = sweep(x, 700 + 4200 * bright * np.exp(-t * 4.5), "lp", 1.2) * adsr(n, 0.012, 0.3, 0.72, 0.28, hold=dur)
    d = int(0.011 * SR)                      # a touch of Haas width
    return np.vstack([y, np.concatenate([np.zeros(d), y[:-d]])])


def keys(m, dur):
    f, n = mtof(m), int((dur + 0.9) * SR)
    t = tt(n)
    y = np.sin(2 * np.pi * f * t + 1.6 * np.exp(-t * 3) * np.sin(2 * np.pi * f * t)) * np.exp(-t * 1.5)
    y += 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 9)
    return y * (1 - np.clip((t - dur) / 0.6, 0, 1)) * np.minimum(1, t / 0.002) * 0.6


def pingpong(x, d=0.75 * BEAT, fb=0.42, taps=5):
    out, dd = np.zeros_like(x), int(d * SR)
    for k in range(1, taps + 1):
        for ch in (0, 1):
            out[ch, dd * k:] += (x[1 - ch] if k % 2 else x[ch])[: N - dd * k] * fb ** k
    return out


def roll(bus, send, a, b, v, hits, curve=1.6):
    for j in range(hits):
        fr = j / hits
        t = a + (b - a) * (1 - (1 - fr) ** curve)
        place(bus, snare2(0.45 + 0.55 * fr), t, v * (0.3 + 0.7 * fr), 0.1 * (1 if j % 2 else -1))
        place(send, snare2(0.6), t, 0.12 * v * fr)


def tapestop(x, t0, t1, until):
    i0, i1 = int(t0 * SR), int(t1 * SR)
    pos = i0 + np.cumsum((1 - np.linspace(0, 1, i1 - i0)) ** 1.4)
    for ch in (0, 1):
        x[ch, i0:i1] = np.interp(pos, np.arange(N), x[ch]) * np.linspace(1, 0, i1 - i0) ** 0.6
    x[:, i1:int(until * SR)] = 0


def gate(x, windows, ramp=0.008):
    g = np.ones(N)
    tsec = tt(N)
    for a, b in windows:
        g = np.minimum(g, np.clip(np.maximum((a - tsec) / ramp, (tsec - b) / ramp), 0, 1))
    return x * g


# ---------------------------------------------------------------- the arrangement
def music():
    D, Bs, P, St, Ar, Ld, Bl, Sd = (np.zeros((2, N)) for _ in range(8))
    kicks = []
    step = BEAT / 4

    # ---- drums, 16th by 16th
    for i in range(int(DUR / step)):
        t, q, b = i * step, i % 16, i // 16
        s = section(t)
        hv = 0.78 + 0.22 * R.random()
        kv, click = 0.0, 1.0
        if s == "intro" and t >= 1.0 and q in (0, 3) and t < 5.8:
            kv, click = (0.18 + 0.3 * t / 6) * (1 if q == 0 else 0.6), 0.2
        elif s == "logo" and q == 0 and b == 4:
            kv = 0.7
        elif s == "signin" and q % 4 == 0:
            kv, click = 0.78, 0.4
        elif s in GROOVE and q % 4 == 0:
            kv = 0.84
        elif s == "brk" and t >= 38 and q in (0, 8) and t < 39.85:
            kv, click = 0.6, 0.5
        elif s == "drop":
            kv = 1.0 if q % 4 == 0 else (0.45 if q == 14 and b % 2 else 0)
        elif s == "build" and q % 4 == 0 and t < 51.75:
            kv = 0.85
        elif s == "final" and t < 56 and q % 4 == 0 and t > 52.1:
            kv = 0.8 * (1 - (t - 52) / 5)
        if kv:
            place(D, kick2(kv, click), t, 1.0)
            kicks.append((t, min(1.0, kv)))
        if q in (4, 12):
            if s == "signin":
                place(D, rim(1.0), t, 0.22, 0.15)
            elif s in GROOVE or s == "drop" or (s == "final" and 52.1 < t < 56):
                k = 1.25 if s == "drop" else (0.75 if s == "final" else 1.0)
                place(D, clap(1.0), t, 0.52 * k)
                place(D, snare2(0.7), t, 0.26 * k)
                place(Sd, clap(1.0), t, 0.18 * k)
        if q % 4 == 2 and (s == "signin" or s in GROOVE or s == "drop" or (s == "final" and t < 56)):
            open_ = q == 14 and s != "signin"
            place(D, hat808(1.0, open_), t, (0.22 if open_ else 0.19) * hv * (0.8 if s == "signin" else 1), 0.3)
        if q % 2 == 1 and (s in GROOVE or s == "drop"):
            place(D, hat808(0.6), t, (0.12 if s == "drop" else 0.085) * hv, -0.35)
        if s in ("plan", "inbox", "drop"):
            place(D, shaker(1.0), t, (0.09 if q % 4 == 2 else 0.05) * hv, 0.5)
        if s == "drop" and q % 4 == 0:
            place(D, ride(1.0), t, 0.09, -0.4)
        if 0.5 <= t < 5.8:                              # the intro's clock: ticks tightening toward the drop
            dens = 1 if t > 3.8 else (2 if t > 1.5 else 4)
            if q % dens == 0:
                place(D, hat808(1.0), t, 0.035 + 0.06 * (t / 6), 0.4 if q % 2 else -0.4)
    for t, v in ((6, 1.0), (14, 0.8), (20, 0.7), (26, 0.55), (30, 0.75), (40, 1.0), (46, 0.7), (52, 1.0)):
        place(D, crash(1.0, 3.0), t, 0.3 * v)
    for t, d in ((14, 1.5), (26, 1.0), (40, 2.0), (52, 2.0)):
        place(D, reverse_cym(d), t - d, 0.26)
    roll(D, Sd, 13.0, 14.0, 0.28, 16)
    roll(D, Sd, 29.0, 30.0, 0.36, 16)
    roll(D, Sd, 38.0, 39.85, 0.5, 34, 2.2)
    roll(D, Sd, 50.0, 51.85, 0.55, 40, 2.4)
    for k, (t, f0) in enumerate(((25.5, 190), (25.625, 160), (25.75, 130), (25.875, 105))):
        place(D, tom(f0, 0.9), t, 0.42, -0.4 + k * 0.27)
    for t in (6.0, 40.0, 52.0):
        place(D, subdrop(), t, 0.5)

    # ---- bass
    for i in range(int(DUR / step)):
        t, q = i * step, i % 16
        s, root = section(t), bar_chord(t)[0]
        if s in ("signin",) + GROOVE and q % 4 == 2:
            place(Bs, bassnote(root, BEAT / 2 * 0.9), t, 0.5 if s == "signin" else 0.56)
        elif s == "drop" and q % 4 != 0:
            place(Bs, bassnote(root + (12 if q % 4 == 2 else 0), BEAT / 4 * 0.85, 1.3, 1100), t, 0.5)
        elif s == "final" and 52.1 < t < 56 and q % 4 == 2:
            place(Bs, bassnote(root, BEAT / 2 * 0.9), t, 0.45)
    n = int(5.8 * SR)
    place(Bs, np.sin(2 * np.pi * mtof(33) * tt(n)) * np.minimum(1, tt(n) / 2.5) * np.minimum(1, (5.8 - tt(n)) / 0.08), 0.0, 0.3)
    for i in range(12):                                # intro pulse under the alerts, swelling
        t = 3.0 + i * BEAT / 2
        place(Bs, bassnote(33, 0.2, 0.6, 500), t, 0.08 + 0.2 * i / 11)
    place(Bs, bassnote(29, 1.95, 0.9, 600, 0.02, 0.2), 6.0, 0.5)
    place(Bs, bassnote(31, 1.95, 0.9, 600, 0.02, 0.2), 8.0, 0.5)
    place(Bs, bassnote(29, 1.95, 0.5, 400, 0.15, 0.3), 36.0, 0.32)
    place(Bs, bassnote(31, 1.85, 0.5, 400, 0.15, 0.3), 38.0, 0.32)
    for i in range(7):
        place(Bs, bassnote(31, BEAT / 2 * 0.9, 1.0, 800), 50.0 + i * BEAT / 2, 0.38 + 0.03 * i)
    place(Bs, bassnote(36, 4.0, 0.8, 600, 0.005, 1.5), 52.0, 0.4)

    # ---- pad: one chord a bar, its level and filter riding the form
    PADG = {"intro": 0.15, "logo": 0.24, "signin": 0.17, "home": 0.23, "comp": 0.22, "plan": 0.23, "inbox": 0.22, "brk": 0.2, "drop": 0.25, "build": 0.22}
    for b in range(30):
        t0 = b * BAR
        s = section(t0 + 0.01)
        root, voicing = CH[BARS[b]]
        final = s == "final"
        if final and t0 > 52:
            break
        dur = (DUR - t0) if final else BAR + 0.6
        n = int(dur * SR)
        env = np.minimum(1, tt(n) / 0.02) * np.exp(-tt(n) * 0.17) if final else adsr(n, 0.35, 1.0, 0.85, 0.6, hold=dur - 0.6)
        x = np.zeros((2, n))
        for k, m in enumerate(voicing):
            x += supersaw(mtof(m), n, 5, 0.12, phase_seed=b * 10 + k) * (0.8 if k else 1.0)
        place(P, x * env, t0, 0.26 if final else PADG[s])
    cut = np.interp(tt(N), [0, 5.7, 5.9, 6.0, 9.9, 10.0, 13.9, 14.0, 35.4, 36.0, 39.8, 40.0, 49.8, 50.0, 51.85, 52.0, 60.0],
                    [350, 1400, 300, 4200, 3000, 1300, 2600, 3800, 3800, 700, 2400, 5200, 4200, 900, 4800, 5600, 2600])
    P = np.vstack([sweep(P[0], cut, "lp", 0.9), sweep(P[1], cut, "lp", 0.9)])
    pm, ps = (P[0] + P[1]) / 2, (P[0] - P[1]) / 2 * 1.8      # widen the pad
    P = np.vstack([pm + ps, pm - ps])
    n = int(5.8 * SR)                                   # the noise's b9 shimmer: a tense cluster with tremolo
    tsh = tt(n)
    sh = sum(np.sin(2 * np.pi * mtof(m) * tsh + k) for k, m in enumerate((81, 82, 88))) / 3
    sh *= (0.55 + 0.45 * np.sin(2 * np.pi * (4 + 6 * tsh / 5.8) * tsh)) * (tsh / 5.8) ** 1.6 * np.minimum(1, (5.8 - tsh) / 0.05)
    place(Bl, sh, 0.0, 0.07, 0.2)

    # ---- chord stabs: big hits on the drops, syncopation in the planner, offbeats in the drop
    for t, name, dur, g in ((6.0, "F", 1.6, 0.32), (40.0, "F", 0.9, 0.3), (52.0, "Cmaj9", 3.5, 0.34)):
        place(St, stab(CH[name][1], dur, int(t), 2600), t, g)
    for i in range(int(DUR / step)):
        t, q = i * step, i % 16
        s, voicing = section(t), bar_chord(t)[1]
        if s == "plan" and q in (3, 6, 10, 14):
            place(St, stab(voicing, 0.16, i, 2400), t, 0.17)
        if s == "drop" and q % 4 == 2:
            place(St, stab(voicing, 0.2, i, 3600), t, 0.26)
        if s == "build" and q % 2 == 0 and t < 51.8:
            place(St, stab(voicing, 0.1, i, 1200 + 2800 * (t - 50) / 1.8), t, 0.1 + 0.08 * (t - 50) / 1.8)

    # ---- arp: 16th plucks over the chord, a different figure per scene
    PAT = {"A": [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 4, 2, 3, 1, 4, 2], "B": [0, 2, 4, 2, 1, 3, 4, 3, 0, 2, 4, 5, 4, 2, 3, 1], "C": [4, 3, 2, 0, 4, 3, 1, 0, 4, 2, 3, 1, 2, 0, 1, 3]}
    ARP = {"signin": ("A", 0.18, 0.55), "home": ("A", 0.23, 1.35), "comp": ("B", 0.2, 1.2), "plan": ("C", 0.22, 1.35), "inbox": ("A", 0.21, 1.25), "drop": ("B", 0.22, 1.3)}
    for i in range(int(DUR / step)):
        t, q = i * step, i % 16
        s, voicing = section(t), bar_chord(t)[1]
        if s in ARP:
            pat, g, br = ARP[s]
            if s == "signin":
                br = 0.45 + 0.6 * (t - 10) / 4
        elif s == "final" and 52.25 <= t < 59.5:
            pat, g, br = "A", 0.22 * (1 - (t - 52) / 7.6) ** 1.3, 1.1
        else:
            continue
        m = voicing[PAT[pat][q] % len(voicing)] + 12
        place(Ar, pluck(mtof(m), 0.3, br), t, g, (-0.55, 0.55)[i % 2])

    # ---- the hook: soft in the composer and inbox, full in the drop, the sonic logo at both ends
    def phrase(t0, name, octave, g, bright, bells=0.0, thick=0.0):
        for bt, m, ln in MEL[name]:
            t, d = t0 + bt * BEAT, ln * BEAT * 0.95
            place(Ld, lead(m + octave, d, bright), t, g)
            if thick:
                place(Ld, lead(m + octave - 12, d, bright * 0.7), t, thick)
            if bells:
                place(Bl, fm_bell(mtof(m + octave + 12), d + 0.8, 3.0, 2.0, 2.4), t, bells, 0.3)
    for b, name in zip(range(10, 13), ("F", "C", "G")):
        phrase(b * BAR, name, -12, 0.26, 0.6)
    for b, name in zip(range(15, 18), ("C", "G", "Am")):
        phrase(b * BAR, name, -12, 0.27, 0.7)
    for b, name in zip(range(20, 25), ("F", "G", "Am", "C", "Fend")):
        phrase(b * BAR, name, 0, 0.3, 1.0, 0.07, 0.14)
    for t, m, d in LOGO_IN + LOGO_OUT:
        place(Ld, lead(m, d, 1.1), t, 0.3)
        place(Bl, fm_bell(mtof(m + 12), d + 1.2, 3.0, 2.2, 2.0), t, 0.1, 0.25)

    # ---- AI sparkle: high bell runs from the "Rewrite with AI" click, and over the second half of the drop
    HI = [84, 86, 88, 91, 93, 96]
    FIG = [0, 2, 4, 1, 3, 5, 2, 4, 0, 3, 5, 2, 4, 1, 3, 5]
    for i in range(int(DUR / step)):
        t, q = i * step, i % 16
        if 21.0 <= t < 25.75 or 44.0 <= t < 49.75:
            place(Bl, fm_bell(mtof(HI[FIG[q]]), 0.35, 3.5, 1.6, 9), t, 0.045, (-0.6, 0.6)[i % 2])

    # ---- breakdown keys: the hook, slowed and softened
    for b, name in ((18, "F"), (19, "Gs")):
        root, voicing = CH[name]
        for m in voicing[:4]:
            place(Bl, keys(m, BAR * 0.95), b * BAR, 0.1, 0.0)
        for bt, m, ln in MEL[name]:
            place(Bl, keys(m - 12, ln * BEAT), b * BAR + bt * BEAT, 0.16, 0.1)

    # ---- pitch risers into the two big drops
    for a, b in ((38.0, 39.85), (50.0, 51.85)):
        n = int((b - a) * SR)
        x = tt(n) / (b - a)
        f = mtof(55) * 2 ** (2 * x ** 1.5)
        y = sum(saw_phase(((np.cumsum(f * (1 + dv)) / SR) + k * 0.3) % 1.0, f * (1 + dv) / SR) for k, dv in enumerate((-0.01, 0, 0.012))) / 3
        y = sweep(y, 400 + 6000 * x ** 2, "lp", 1.4) * x ** 1.8
        place(Bl, y, a, 0.12, 0.0)

    return D, Bs, P, St, Ar, Ld, Bl, Sd, kicks


# ---------------------------------------------------------------- mix and master
def glue(x, thr_db=-14.0, ratio=1.8, tc=0.06, gtc=0.12):
    p = np.mean(x ** 2, axis=0)
    a = np.exp(-1 / (tc * SR))
    env = np.sqrt(np.maximum(lfilter([1 - a], [1, -a], p), 1e-12))
    thr = 10 ** (thr_db / 20)
    g = np.where(env > thr, (env / thr) ** (1 / ratio - 1), 1.0)
    a2 = np.exp(-1 / (gtc * SR))
    g = lfilter([1 - a2], [1, -a2], g)
    return x * g


def main():
    pos = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(pos) < 2:
        sys.exit(__doc__)
    cues = json.loads(Path(pos[0]).read_text())
    D, Bs, P, St, Ar, Ld, Bl, Sd, kicks = music()

    sc = np.ones(N)                                    # sidechain under every kick
    for k, v in kicks:
        i0, n = int(k * SR), int(0.34 * SR)
        seg = 1 - 0.8 * v * np.exp(-tt(n) / 0.09)
        sc[i0:i0 + n] = np.minimum(sc[i0:i0 + n], seg[: max(0, min(n, N - i0))])
    duck = lambda depth: 1 - depth * (1 - sc)
    Bs, P, St, Ar, Ld = Bs * duck(0.85), P * duck(0.65), St * duck(0.7), Ar * duck(0.45), Ld * duck(0.22)

    dcut = np.interp(tt(N), [0, 9.99, 10.0, 13.95, 14.0, 60], [20000, 20000, 900, 7000, 20000, 20000])
    D = np.vstack([sweep(D[0], dcut, "lp", 0.8), sweep(D[1], dcut, "lp", 0.8)])

    dl = pingpong(Ld * 0.5 + Ar * 0.35 + Bl * 0.5)
    mus = D + Bs * 0.7 + P * 1.35 + St * 1.35 + Ar * 1.6 + Ld * 1.5 + Bl * 1.3 + dl * 0.6
    tapestop(mus, 35.45, 35.95, 36.0)
    mus = gate(mus, [(5.82, 6.0), (39.85, 40.0), (51.85, 52.0)])

    fx, send = sfx(cues)
    ir = make_ir(2.8, 0.025, 6000)
    wetsrc = P * 0.35 + Ar * 0.35 + Ld * 0.3 + Bl * 0.6 + St * 0.2 + Sd + send + fx * 0.1
    tapestop(wetsrc, 35.45, 35.95, 35.95)
    wet = reverb(wetsrc, ir)
    mix = mus + fx * 0.85 + wet * 0.3
    mix = filt(mix, "hp", 30)
    mix = glue(mix)
    mix = np.tanh(mix * 1.15) / 1.15
    mix = limiter(mix * 10 ** ((-14.0 - lufs(mix)) / 20), ceiling=10 ** (-1.2 / 20))
    fade = np.ones(N)
    fade[-int(0.5 * SR):] = np.linspace(1, 0, int(0.5 * SR)) ** 1.5
    mix *= fade
    print(f"loudness {lufs(mix):.1f} LUFS, peak {20 * np.log10(np.abs(mix).max()):.1f} dBFS")
    pcm = (np.clip(mix.T, -1, 1) * 32767).astype("<i2")
    with wave.open(str(pos[1]), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", pos[1])


if __name__ == "__main__":
    main()
