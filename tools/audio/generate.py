#!/usr/bin/env python3
"""
Original audio for "بيتنا فين؟" — every sound here is synthesized from scratch by this script
(no samples, no recordings, no third-party material). Re-run to regenerate public/audio/*.mp3.

  python3 tools/audio/generate.py          # writes public/audio/ + src/audio/manifest.json

Music uses Egyptian maqam scales with real quarter tones (Bayati, Nahawand, Ajam) played by a
plucked-string model (Karplus–Strong) standing in for oud/qanun, plus a frame-drum (riq) model.
These are placeholders until a composer records final music.
"""
import json, os, subprocess, tempfile
import numpy as np
from scipy.signal import butter, lfilter, sosfilt

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'public', 'audio')
rng = np.random.default_rng(1973)

# ── building blocks ─────────────────────────────────────────
def t(sec): return np.arange(int(sec * SR)) / SR
def env_ad(n, a=0.005, d=0.3):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    e[na:] = np.exp(-np.arange(n - na) / (d * SR)); return e
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def lp(x, f, order=2): return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)
def noise(n): return rng.standard_normal(n)
def brown(n):
    b = np.cumsum(noise(n)); b -= lp(b, 2); return b / (np.max(np.abs(b)) + 1e-9)
def place(buf, x, at):
    i = int(at * SR); j = min(len(buf), i + len(x))
    if i < len(buf): buf[i:j] += x[: j - i]
def norm(x, peak=0.89):
    m = np.max(np.abs(x)); return x * (peak / m) if m > 0 else x
def rms_to(x, db):
    r = np.sqrt(np.mean(x ** 2)) + 1e-12; return x * (10 ** (db / 20) / r)

def reverb(x, wet=0.25, size=1.0):
    """Small Schroeder reverb: 4 combs + 2 allpasses (mono)."""
    out = np.zeros_like(x)
    for d, g in [(1557, .84), (1617, .83), (1491, .85), (1422, .86)]:
        d = int(d * size); b = np.zeros(d + 1); b[0] = 1; a = np.zeros(d + 1); a[0] = 1; a[d] = -g
        out += lfilter(b, a, x)
    for d, g in [(225, .5), (556, .5)]:
        b = np.zeros(d + 1); b[0] = -g; b[d] = 1; a = np.zeros(d + 1); a[0] = 1; a[d] = -g
        out = lfilter(b, a, out)
    out = lp(out, 5000)
    return (1 - wet) * x + wet * out / 4

def pluck(freq, dur, bright=0.5, damp=0.996):
    """Karplus–Strong string. bright: 0 dark (oud) … 1 bright (qanun)."""
    n = int(dur * SR); period = max(2, int(SR / freq))
    buf = lp(noise(period), 1500 + 6000 * bright, 1) if period > 20 else noise(period)
    out = np.zeros(n); idx = 0; prev = 0.0
    for i in range(n):
        v = buf[idx]; nv = damp * 0.5 * (v + prev); prev = v
        buf[idx] = nv; out[i] = v; idx = (idx + 1) % period
    body = bp(out, 90, 4000)            # wooden body
    return body * env_ad(n, 0.002, dur * 0.6)

def pluck_fast(freq, dur, bright=0.5):
    # vectorised approximation for speed: decaying harmonic series with KS-like spectrum
    tt = t(dur); x = np.zeros_like(tt)
    for k in range(1, 12):
        amp = (1 / k) * (bright ** (k / 6)) * (1 if k % 7 else 0.3)
        dec = dur * 0.45 / (1 + 0.35 * k)
        x += amp * np.sin(2 * np.pi * freq * k * tt * (1 + 0.0007 * k * k)) * np.exp(-tt / dec)
    att = np.minimum(1, tt / 0.003)
    x *= att
    x += 0.15 * hp(noise(len(tt)), 2500) * np.exp(-tt / 0.01)   # pick noise
    return x

def tremolo_note(freq, dur, rate=9.0, bright=0.4):
    """Oud-style rishe: repeated plucks on a long note."""
    x = np.zeros(int(dur * SR)); k = 0
    while k / rate < dur - 0.05:
        a = 0.55 + 0.45 * (1 - k / (dur * rate))
        place(x, a * pluck_fast(freq, min(0.6, dur - k / rate), bright), k / rate); k += 1
    return x

def riq(kind):
    if kind == 'dum':
        tt = t(0.35); f = 85 * np.exp(-tt * 9) + 55
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.12)
    if kind == 'tak':
        tt = t(0.12); return bp(noise(len(tt)), 1800, 6000) * np.exp(-tt / 0.025) * 0.6
    # jingles
    tt = t(0.25); x = sum(np.sin(2 * np.pi * f * tt) for f in (5200, 6900, 8300)) * np.exp(-tt / 0.06)
    return 0.12 * x + 0.1 * hp(noise(len(tt)), 6000) * np.exp(-tt / 0.03)

def maqam(root_hz, steps_cents):
    """steps_cents: cumulative cents from root for each degree (quarter tones = 50-cent multiples)."""
    return [root_hz * 2 ** (c / 1200) for c in steps_cents]

BAYATI = [0, 150, 300, 500, 700, 800, 1000, 1200, 1350, 1500]     # D  E½b F G A Bb C D …
NAHAWAND = [0, 200, 300, 500, 700, 800, 1100, 1200, 1400, 1500]   # C  D Eb F G Ab B C …
AJAM = [0, 200, 400, 500, 700, 900, 1100, 1200, 1400, 1600]       # F  G A Bb C D E F …

def render_melody(scale, notes, bpm, bright=0.45, trem_over=1.5):
    beat = 60 / bpm; total = sum(d for _, d in notes) * beat + 3
    x = np.zeros(int(total * SR)); at = 0.0
    for deg, d in notes:
        if deg is not None:
            f = scale[deg]; dur = d * beat
            note = tremolo_note(f, dur + 0.2, bright=bright) if d >= trem_over else pluck_fast(f, dur + 0.8, bright)
            place(x, note, at)
        at += d * beat
    return x, sum(d for _, d in notes) * beat

def drone(freq, sec, level=0.18):
    tt = t(sec); lfo = 1 + 0.15 * np.sin(2 * np.pi * 0.07 * tt)
    x = (np.sin(2 * np.pi * freq * tt) + 0.4 * np.sin(2 * np.pi * freq * 2.002 * tt) + 0.2 * np.sin(2 * np.pi * freq * 3 * tt)) * lfo
    fade = np.minimum(1, np.minimum(tt / 2, (sec - tt) / 2)); return level * x * fade

def stereo(l, r): return np.stack([l, r], axis=1)
def pan(x, p):  # p: -1 left … +1 right
    a = (p + 1) * np.pi / 4; return stereo(x * np.cos(a), x * np.sin(a))

def loopify(x, xfade=1.5):
    """Make a buffer loop seamlessly by crossfading its tail into its head."""
    n = int(xfade * SR); head, tail = x[:n].copy(), x[-n:].copy()
    w = np.linspace(0, 1, n)[:, None] if x.ndim == 2 else np.linspace(0, 1, n)
    x = x[:-n].copy(); x[:n] = head * w + tail * (1 - w); return x

# ── music ───────────────────────────────────────────────────
def music_home():
    sc = maqam(146.83, BAYATI)  # D3
    A = [(0, 1), (1, .5), (2, .5), (3, 1), (2, .5), (1, .5), (0, 2)]
    B = [(2, .5), (3, .5), (4, 1), (5, .5), (4, .5), (3, 1), (2, .5), (1, .5), (2, 2)]
    C = [(4, 1), (5, .5), (6, .5), (7, 1.5), (6, .5), (5, 1), (4, 1), (3, 2)]
    D = [(3, .5), (2, .5), (1, 1), (2, .5), (1, .5), (0, 3), (None, 1)]
    mel, L = render_melody(sc, A + B + A + D + C + B + A + D, bpm=72, bright=0.35)
    n = len(mel); bass = np.zeros(n); beat = 60 / 72
    for k in range(int(L / beat / 4)):
        place(bass, 0.55 * pluck_fast(sc[0] / 2, 2.5, 0.25), k * 4 * beat)
        place(bass, 0.35 * pluck_fast(sc[4] / 2, 1.8, 0.25), (k * 4 + 2.5) * beat)
    dr = drone(sc[0] / 2, n / SR, 0.08)
    mix = reverb(mel * 0.8 + bass + dr, 0.28)
    out = stereo(mix * 0.95 + 0.05 * np.roll(mix, 300), mix * 0.95 + 0.05 * np.roll(mix, 450))
    return loopify(out[: int((L + 1.5) * SR)])

def music_night():
    sc = maqam(130.81, NAHAWAND)  # C3
    notes = [(4, 2), (3, 1), (2, 1), (1, 3), (None, 1), (2, 1.5), (3, .5), (4, 2), (5, 1), (4, 3), (None, 1),
             (7, 2), (6, 1), (5, 1), (4, 2), (3, 2), (2, 1), (1, 1), (0, 4), (None, 2)]
    mel, L = render_melody(sc, notes, bpm=54, bright=0.25, trem_over=9)
    n = len(mel)
    pad = sum(drone(f, n / SR, 0.05) for f in (sc[0] / 2, sc[4] / 2, sc[0]))
    mix = reverb(mel * 0.7 + pad, 0.4, 1.2)
    out = stereo(mix, np.roll(mix, 600))
    return loopify(out[: int((L + 1.5) * SR)], 2.5)

def music_play():
    sc = maqam(174.61, AJAM)  # F3
    A = [(0, .5), (2, .5), (4, .5), (2, .5), (3, .5), (4, .5), (5, 1), (4, .5), (3, .5), (2, .5), (1, .5), (0, 2)]
    B = [(4, .5), (5, .5), (6, .5), (7, .5), (6, .5), (5, .5), (4, 1), (2, .5), (3, .5), (4, .5), (2, .5), (0, 2)]
    mel, L = render_melody(sc, A + B + A + B, bpm=100, bright=0.6, trem_over=9)
    n = len(mel); perc = np.zeros(n); beat = 60 / 100
    pat = [('dum', 0), ('tak', 1), ('tak', 1.5), ('dum', 2), ('tak', 3), ('jingle', 3.5)]
    for bar in range(int(L / beat / 4)):
        for k, o in pat: place(perc, riq(k) * (0.5 if k == 'dum' else 0.35), (bar * 4 + o) * beat)
    mix = reverb(mel * 0.7 + perc * 0.6, 0.18)
    out = stereo(mix, np.roll(mix, 250))
    return loopify(out[: int((L + 1) * SR)], 1.0)

# ── ambience ────────────────────────────────────────────────
def hooves(n_steps=10, rate=3.6):
    x = np.zeros(int(n_steps / rate * SR + SR))
    for k in range(n_steps):
        tt = t(0.06); c = bp(noise(len(tt)), 700 + 300 * rng.random(), 2600) * np.exp(-tt / 0.012)
        place(x, c * (0.6 + 0.4 * rng.random()), k / rate + (0.08 if k % 2 else 0))
    return x

def sparrow():
    x = np.zeros(int(0.9 * SR)); at = 0
    for _ in range(rng.integers(3, 7)):
        d = 0.04 + 0.04 * rng.random(); tt = t(d)
        f0 = 3800 + 1500 * rng.random(); f = f0 + 1200 * np.sin(np.pi * tt / d)
        chirp = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d)
        place(x, chirp, at); at += d + 0.03 + 0.05 * rng.random()
    return x

def bike_bell():
    tt = t(1.2)
    return sum(a * np.sin(2 * np.pi * f * tt) for f, a in ((2350, 1), (3950, .5), (5600, .25))) * np.exp(-tt / 0.35)

def amb_day(sec=48):
    n = int(sec * SR)
    room = 0.05 * lp(brown(n), 250)
    street = 0.03 * bp(noise(n), 250, 1800) * (1 + 0.3 * np.sin(2 * np.pi * 0.05 * t(sec)))
    ev = np.zeros(n)
    for s in (4, 21, 37): place(ev, 0.06 * lp(hooves(rng.integers(8, 14)), 3000), s)
    for s in (2, 9, 15, 26, 31, 44): place(ev, 0.03 * sparrow(), s + rng.random())
    for s in (12, 33): place(ev, 0.02 * bike_bell(), s)
    mix = room + street + reverb(ev, 0.35)
    return loopify(stereo(mix + 0.004 * noise(n), mix * 0.96 + 0.004 * noise(n)), 2)

def cricket(sec, rate, f):
    n = int(sec * SR); x = np.zeros(n); k = 0.0
    while k < sec - 0.2:
        for p in range(3):
            tt = t(0.018); place(x, np.sin(2 * np.pi * f * tt) * np.sin(np.pi * tt / 0.018), k + p * 0.028)
        k += 1 / rate * (0.9 + 0.2 * rng.random())
    return x

def amb_night(sec=40):
    n = int(sec * SR)
    room = 0.035 * lp(brown(n), 160)
    c1 = cricket(sec, 1.3, 4400); c2 = cricket(sec, 0.9, 4900)
    l = room + 0.012 * c1 + 0.006 * c2; r = room + 0.006 * c1 + 0.012 * c2
    return loopify(stereo(l, r), 2)

def amb_stair(sec=30):
    n = int(sec * SR)
    hollow = 0.05 * bp(brown(n), 60, 400)
    ev = np.zeros(n)
    for s in (6, 19): place(ev, 0.05 * lp(noise(int(0.3 * SR)) * np.exp(-t(0.3) / 0.05), 800), s)  # distant door
    mix = reverb(hollow + ev, 0.5, 1.4)
    return loopify(stereo(mix, np.roll(mix, 900)), 2)

# ── sound effects ───────────────────────────────────────────
def wood_hit(level=1.0, f=150):
    tt = t(0.35)
    body = sum(a * np.sin(2 * np.pi * ff * tt) * np.exp(-tt / d) for ff, a, d in ((f, 1, .09), (f * 2.3, .5, .05), (f * 4.1, .25, .03)))
    click = bp(noise(len(tt)), 400, 3000) * np.exp(-tt / 0.008)
    return level * (body + 0.7 * click)

def sfx_knock():
    x = np.zeros(int(1.4 * SR))
    for at, lv in ((0, .7), (0.22, .7), (0.62, 1.0)): place(x, wood_hit(lv), at)
    return reverb(x, 0.2)

def sfx_tick(): return wood_hit(0.4, 900)[: int(0.08 * SR)] * np.exp(-t(0.08) / 0.02)

def sfx_latch():
    x = np.zeros(int(0.4 * SR))
    for at, f in ((0, 3200), (0.07, 2100)):
        tt = t(0.05); place(x, (bp(noise(len(tt)), f * .7, f * 1.4) + 0.5 * np.sin(2 * np.pi * f * tt)) * np.exp(-tt / 0.01), at)
    return x

def sfx_page():
    n = int(0.7 * SR); e = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return hp(noise(n), 1500) * e * (1 + 0.5 * np.sin(2 * np.pi * 23 * t(0.7))) * 0.5

def sfx_radio():
    sec = 2.2; n = int(sec * SR); tt = t(sec)
    static = bp(noise(n), 400, 5000) * 0.35
    sweep = 0.15 * np.sin(2 * np.pi * np.cumsum(900 + 1400 * np.sin(np.pi * tt / sec)) / SR) * np.exp(-tt / 0.8)
    e = np.minimum(1, tt / 0.2) * np.minimum(1, (sec - tt) / 0.6)
    return (static + sweep) * e

def sfx_sewing():
    sec = 2.4; x = np.zeros(int(sec * SR)); k = 0
    while k * 0.11 < sec - 0.2:
        place(x, 0.5 * wood_hit(0.6, 90)[: int(0.12 * SR)], k * 0.11)                  # treadle
        tt = t(0.03); place(x, 0.4 * bp(noise(len(tt)), 2500, 7000) * np.exp(-tt / 0.006), k * 0.11 + 0.055)  # needle
        k += 1
    tt = t(sec); return x * np.minimum(1, np.minimum(tt / 0.15, (sec - tt) / 0.3))

def sfx_basket():
    sec = 1.6; n = int(sec * SR); tt = t(sec)
    creak = np.sin(2 * np.pi * np.cumsum(180 + 60 * np.sin(2 * np.pi * 1.3 * tt)) / SR)
    creak = bp(np.sign(creak) * 0.3 + creak, 300, 2500) * (0.5 + 0.5 * np.sin(2 * np.pi * 2.1 * tt) ** 2)
    x = 0.3 * creak
    for k in range(6): place(x, 0.4 * wood_hit(0.3, 600)[: int(0.06 * SR)], 0.2 + k * 0.22)
    return x * np.minimum(1, np.minimum(tt / 0.1, (sec - tt) / 0.3))

def sfx_coins():
    x = np.zeros(int(1.0 * SR))
    for k in range(4):
        tt = t(0.4); f = 3100 + 900 * rng.random()
        c = sum(a * np.sin(2 * np.pi * f * m * tt) for m, a in ((1, 1), (2.76, .5), (5.4, .25))) * np.exp(-tt / 0.08)
        place(x, c * (0.8 - 0.15 * k), 0.06 * k + 0.02 * rng.random())
    return x

def sfx_pencil():
    sec = 1.3; n = int(sec * SR); tt = t(sec)
    strokes = (np.sin(2 * np.pi * 4.5 * tt) > 0.1).astype(float)
    strokes = lp(strokes, 30)
    return hp(noise(n), 2500) * strokes * 0.35 * np.minimum(1, (sec - tt) / 0.2)

def sfx_door():
    x = np.zeros(int(1.2 * SR)); tt = t(0.5)
    creak = bp(np.sin(2 * np.pi * np.cumsum(220 + 120 * tt) / SR) * (1 + noise(len(tt)) * .3), 200, 2000) * 0.25
    place(x, creak, 0); place(x, wood_hit(1.0, 70) * 1.2, 0.45)
    return reverb(x, 0.25)

def sfx_clink():
    tt = t(0.6)
    return sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) for f, a, d in ((2750, 1, .15), (6100, .5, .08), (8200, .3, .05)))

def sfx_steps():
    x = np.zeros(int(2.4 * SR))
    for k in range(6): place(x, wood_hit(0.5 - 0.06 * k, 110)[: int(0.15 * SR)], k * 0.38)
    return reverb(lp(x, 2500), 0.35, 1.2)

# ── export ──────────────────────────────────────────────────
def write_mp3(name, x, stereo_out, kbps):
    os.makedirs(OUT, exist_ok=True)
    x = np.clip(x, -1, 1)
    data = (x * 32767).astype('<i2')
    ch = 2 if x.ndim == 2 else 1
    with tempfile.NamedTemporaryFile(suffix='.raw', delete=False) as f:
        f.write(data.tobytes()); raw = f.name
    path = os.path.join(OUT, name + '.mp3')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', str(ch), '-i', raw,
                    '-codec:a', 'libmp3lame', '-b:a', f'{kbps}k', path], check=True)
    os.unlink(raw)
    return path, len(x) / SR

def main():
    manifest = {}
    items = [
        # name, fn, bus, loop, gain (0..1 mix level), kbps
        ('music_home', music_home, 'music', True, 0.55, 128),
        ('music_night', music_night, 'music', True, 0.5, 128),
        ('music_play', music_play, 'music', True, 0.45, 128),
        ('amb_day', amb_day, 'ambience', True, 0.6, 96),
        ('amb_night', amb_night, 'ambience', True, 0.6, 96),
        ('amb_stair', amb_stair, 'ambience', True, 0.6, 96),
        ('knock', sfx_knock, 'sfx', False, 0.8, 96),
        ('tick', sfx_tick, 'sfx', False, 0.35, 64),
        ('latch', sfx_latch, 'sfx', False, 0.7, 64),
        ('page', sfx_page, 'sfx', False, 0.5, 64),
        ('radio', sfx_radio, 'sfx', False, 0.5, 96),
        ('sewing', sfx_sewing, 'sfx', False, 0.6, 96),
        ('basket', sfx_basket, 'sfx', False, 0.6, 64),
        ('coins', sfx_coins, 'sfx', False, 0.5, 64),
        ('pencil', sfx_pencil, 'sfx', False, 0.6, 64),
        ('door', sfx_door, 'sfx', False, 0.7, 64),
        ('clink', sfx_clink, 'sfx', False, 0.45, 64),
        ('steps', sfx_steps, 'sfx', False, 0.6, 64),
    ]
    for name, fn, bus, loop, gain, kbps in items:
        x = fn()
        x = hp(x, 25, 2) if x.ndim == 1 else np.stack([hp(x[:, 0], 25, 2), hp(x[:, 1], 25, 2)], axis=1)  # remove DC / rumble
        x = norm(x, 0.89)
        path, dur = write_mp3(name, x, x.ndim == 2, kbps)
        manifest[name] = {'file': f'audio/{name}.mp3', 'bus': bus, 'loop': loop, 'gain': gain, 'duration': round(dur, 3),
                          'exclusive': name in ('radio', 'sewing', 'steps', 'basket')}
        print(f'{name:12s} {bus:9s} {dur:6.2f}s  {os.path.getsize(path) / 1024:6.1f} KB')
    with open(os.path.join(ROOT, 'src', 'audio', 'manifest.json'), 'w') as f:
        json.dump(manifest, f, indent=2)

if __name__ == '__main__':
    main()
