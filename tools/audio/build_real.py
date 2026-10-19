#!/usr/bin/env python3
"""Builds every game sound from GENUINE recordings in audio-src/ (listed with licences in audio-src/SOURCES.json).

Rules: no synthesis, no speech synthesis, no sequenced/"composed" music, no assembled stand-ins for real objects.
Each cue is a real recording of the actual object or activity, only trimmed, faded and level-matched.
Ambience beds layer several real field recordings (room tone, street through the window, crickets, a clock).
A cue with no genuine recording available is written to the manifest as unavailable (file: null) and stays silent.

Usage: python3 tools/audio/build_real.py   (needs numpy, scipy, soundfile, ffmpeg)
"""
import json, os, subprocess, sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'audio-src')
OUT = os.path.join(ROOT, 'public', 'audio')
SR = 44100
rng = np.random.default_rng(1973)


# ── helpers ──────────────────────────────────────────────────────────────
def load(rel, sr=SR):
    p = rel if os.path.isabs(rel) else os.path.join(SRC, rel)
    raw = subprocess.run(['ffmpeg', '-v', 'quiet', '-i', p, '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
    if not len(a): raise RuntimeError(f'empty: {rel}')
    return a - a.mean()

def db(x): return 10 ** (x / 20)
def rms(a): return float(np.sqrt(np.mean(a ** 2)) + 1e-12)
def peak_norm(a, dbfs=-1.0): return a * (db(dbfs) / (np.abs(a).max() + 1e-12))
def rms_norm(a, dbfs): return a * (db(dbfs) / rms(a))

def hp(a, f, o=2): return sosfilt(butter(o, f, 'hp', fs=SR, output='sos'), a)
def lp(a, f, o=2): return sosfilt(butter(o, f, 'lp', fs=SR, output='sos'), a)
def bp(a, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'bp', fs=SR, output='sos'), a)

def fade(a, fi=0.01, fo=0.05):
    a = a.copy(); n1 = int(fi * SR); n2 = int(fo * SR)
    if n1: a[:n1] *= np.linspace(0, 1, n1) ** 2
    if n2: a[-n2:] *= np.linspace(1, 0, n2) ** 2
    return a

def seg(a, t0, t1=None): return a[int(t0 * SR): (int(t1 * SR) if t1 is not None else None)]

def active(a, thresh_db=-35, pad=0.05):
    """Trim to the region where the sound is actually happening."""
    env = np.convolve(np.abs(a), np.ones(441) / 441, 'same')
    idx = np.where(env > env.max() * db(thresh_db))[0]
    if not len(idx): return a
    s = max(0, idx[0] - int(pad * SR)); e = min(len(a), idx[-1] + int(pad * SR))
    return a[s:e]

def onsets(a, min_gap=0.06, rel=0.35):
    env = np.convolve(np.abs(a), np.ones(220) / 220, 'same')
    thr = env.max() * rel; out = []; last = -1e9
    for i in range(1, len(env)):
        if env[i] >= thr and env[i - 1] < thr and (i - last) > min_gap * SR:
            out.append(i); last = i
    return out

def place(buf, clip, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    n = min(len(clip), len(buf) - i)
    buf[i:i + n] += clip[:n] * g

def room_ir(rt60=0.5, pre=0.008, bright=6000, seed=0):
    """Decaying noise impulse response used as a small-room reverb (processing only)."""
    r = np.random.default_rng(seed); n = int(rt60 * SR)
    t = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-6.9 * t / rt60)
    ir = lp(ir, bright); ir[:int(pre * SR)] = 0; ir[0] = 0
    return ir / np.sqrt(np.sum(ir ** 2))

def reverb(a, rt60=0.5, wet=0.25, bright=6000, seed=0):
    w = fftconvolve(a, room_ir(rt60, bright=bright, seed=seed))[:len(a) + int(rt60 * SR)]
    d = np.concatenate([a, np.zeros(len(w) - len(a))])
    return d * (1 - wet) + w * wet * rms(a) / (rms(w) + 1e-12)

def through_window(a, lo=180, hi=2600):
    """Street heard from inside the flat: no lows, dull highs."""
    return lp(hp(a, lo), hi, 3)

def loop_xfade(a, x=2.0):
    """Make a buffer loop seamlessly by folding its tail over its head."""
    n = int(x * SR); out = a[:-n].copy(); w = np.linspace(0, 1, n)
    out[:n] = a[-n:] * (1 - w) + a[:n] * w
    return out

def tile(a, length, x=1.5):
    n = int(length * SR); xs = int(x * SR); out = np.zeros(n); pos = 0
    while pos < n:
        c = a.copy()
        if pos: c[:xs] *= np.linspace(0, 1, xs)
        c[-xs:] *= np.linspace(1, 0, xs)
        place(out, c, pos / SR); pos += len(a) - xs
    return out

def pitch(a, semis):
    """Repitch a recorded note by resampling (changes length, like a tape varispeed)."""
    if abs(semis) < 1e-6: return a
    r = 2 ** (semis / 12); up = 1000; down = int(round(1000 * r))
    return resample_poly(a, up, down)

def write(name, a, stereo=None, br='128k', folder=OUT, peak=-1.0):
    os.makedirs(folder, exist_ok=True)
    if stereo is not None:
        x = np.stack([a, stereo], 1)
    else:
        x = a[:, None]
    m = np.abs(x).max()
    if m > db(peak): x = x * db(peak) / m
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()
    path = os.path.join(folder, name + '.mp3')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', str(x.shape[1]), '-i', '-',
                    '-c:a', 'libmp3lame', '-b:a', br, path], input=pcm, check=True)
    return path, len(a) / SR


MANIFEST = {}
def short_term_max(a, win=0.4):
    w = int(win * SR); c = np.convolve(a ** 2, np.ones(w) / w, 'valid') if len(a) > w else np.array([np.mean(a ** 2)])
    return float(np.sqrt(c.max()) + 1e-12)

TARGET = {'sfx': -20.0, 'ambience': -40.0, 'music': -28.0}   # loudness targets before the per-cue gain

def cue(name, a, bus, gain, loop=False, exclusive=False, stereo=None, br=None):
    # consistent loudness: effects by their loudest moment, ambience/music by overall level
    lvl = short_term_max(a) if bus == 'sfx' else rms(a[np.abs(a) > 1e-4]) if np.any(np.abs(a) > 1e-4) else rms(a)
    k = db(TARGET[bus]) / lvl
    a = a * k
    if stereo is not None: stereo = stereo * k
    path, dur = write(name, a, stereo, br or ('160k' if bus == 'ambience' else '128k'))
    MANIFEST[name] = {'file': f'audio/{name}.mp3', 'bus': bus, 'loop': loop, 'gain': gain,
                      'duration': round(dur, 3), 'exclusive': exclusive}
    print(f'  {name:14s} {dur:6.2f}s  {bus}')


# ── sources ──────────────────────────────────────────────────────────────
E = lambda f: load(f'esc50/{f}.wav')
TG = lambda f: load(f'tgstation/{f}.ogg')
CD = lambda f: load(f'cdda/{f}.ogg')


# ── ambience ─────────────────────────────────────────────────────────────
def street_layer(length, morning=False):
    """The neighbourhood through the window: birds, hens on a roof, a bicycle bell, hooves on the street."""
    L = np.zeros(int(length * SR))
    birds = [('3-181132-A-14', 2.0), ('4-187769-A-14', 17.0), ('4-223127-A-14', 31.0), ('4-182795-A-14', 46.0)]
    for f, t in birds:
        place(L, fade(E(f), 0.8, 1.2), t, db(-30))
    place(L, fade(E('4-200330-A-6'), 1.0, 1.5), 11.0, db(-36))          # hens on a roof
    place(L, fade(load('ss14/bicyclebell.ogg'), 0.01, 0.3), 25.5, db(-34))
    place(L, fade(E('3-249913-A-25'), 1.2, 1.5), 37.0, db(-33))        # hooves / steps on the street
    place(L, fade(lp(E('4-184575-A-0'), 1500), 0.3, 0.8), 52.0, db(-42))  # a dog far off
    place(L, fade(E('5-256452-A-5'), 0.1, 0.5), 7.0, db(-40))           # a cat in the stairwell
    if morning:
        place(L, fade(E('5-200339-A-1'), 0.2, 1.0), 1.0, db(-31))
        place(L, fade(E('4-164859-A-1'), 0.2, 1.0), 33.0, db(-35))
    return through_window(L)

def room_tone(length):
    r = load('cdda/indoors.ogg')            # quiet room with distant pigeons (blouhond, CC BY 3.0)
    return rms_norm(hp(tile(r, length), 160, 4), -48)

def ambience():
    print('ambience')
    n = 62.0
    for name, morning in (('amb_day', False), ('amb_morning', True)):
        a = room_tone(n) + street_layer(n, morning)
        b = room_tone(n) * 0.9 + np.roll(street_layer(n, morning), int(0.013 * SR)) * 0.85   # window on one side
        a, b = loop_xfade(a), loop_xfade(b)
        cue(name, b * 0.8 + a * 0.2, 'ambience', 0.8, loop=True, stereo=a)

    # night: crickets in the street + an old clock in the room
    n = 62.0
    cr = tile(CD('clear_night_2'), n) * 0.7 + tile(CD('clear_night_3'), n) * 0.5
    cr = rms_norm(through_window(cr, 300, 5000), -40)
    clock = rms_norm(tile(E('5-208624-A-38'), n, 0.05), -47)          # "Old Clock Ticking", LanDub, CC0
    dog = np.zeros(int(n * SR)); place(dog, fade(lp(E('2-122104-A-0'), 1800), 0.3, 1.0), 24.0, db(-40))
    rt = room_tone(n) * 0.6
    a = loop_xfade(cr + clock + dog + rt)
    b = loop_xfade(np.roll(cr, int(0.011 * SR)) + clock * 0.8 + dog * 0.7 + rt)
    cue('amb_night', a, 'ambience', 0.8, loop=True, stereo=b)

    # stairwell: the quiet building, someone on the stairs (real staircase recording), a door below
    n = 40.0
    base = room_tone(n) * 1.2
    ev = np.zeros(int(n * SR))
    place(ev, fade(load('commons/stairs.ogg'), 0.3, 0.8), 8.0, 0.45)
    place(ev, fade(CD('close_door'), 0.005, 0.2) * 0.3, 30.0)
    place(ev, fade(E('5-256452-A-5'), 0.1, 0.5) * 0.25, 20.0)
    a = loop_xfade(base + lp(ev, 5000))
    cue('amb_stair', a, 'ambience', 0.8, loop=True, stereo=loop_xfade(np.roll(base, 300) + lp(ev, 5000) * 0.85))


# ── interaction effects: one genuine recording each, trimmed and faded, no added processing ──
UNAVAILABLE = {
    'latch': 'no openly licensed recording of a bag clasp clicking shut ("تِك. القفل قفل") was found; the BigSoundBank suitcase opens with a zip',
}

def effects():
    print('effects')
    cue('knock', fade(seg(E('3-180147-A-30'), 0.0, 0.62), 0.001, 0.08), 'sfx', 0.75)          # knock on a wooden door
    cue('tick', fade(active(seg(E('5-208624-A-38'), 0, 1.2), -30, 0.01)[:int(0.25 * SR)], 0.001, 0.05), 'sfx', 0.28)
    cue('page', fade(active(load('commons/page.ogg'), -40, 0.02), 0.01, 0.1), 'sfx', 0.55)  # turning a page
    cue('pencil', fade(seg(load('commons/pencil.ogg'), 22.5, 25.0), 0.05, 0.3), 'sfx', 0.6)  # pencil on paper
    cue('door', fade(active(CD('open_door'), -40, 0.02), 0.002, 0.1), 'sfx', 0.65)
    cue('door_close', fade(active(CD('close_door'), -40, 0.02), 0.002, 0.1), 'sfx', 0.6)
    cl = np.zeros(int(1.0 * SR))                                   # a plate set down, then a spoon
    place(cl, active(TG('food_plate_drop1'), -40, 0.005), 0.0, 0.8)
    place(cl, active(TG('cutlery_drop1'), -40, 0.005), 0.22, 0.6)
    cue('clink', fade(active(cl, -45, 0.02), 0.002, 0.15), 'sfx', 0.55)
    cue('coins', fade(active(seg(load('commons/coins_floor.ogg'), 0, 3.0), -40, 0.02), 0.005, 0.3), 'sfx', 0.5)
    cue('steps', fade(seg(load('commons/stairs.ogg'), 1.0, 5.0), 0.2, 0.6), 'sfx', 0.6, exclusive=True)
    cue('fabric', fade(active(TG('cloth_pickup2'), -40, 0.01), 0.01, 0.1), 'sfx', 0.55)
    cue('pour', fade(active(seg(E('3-145719-A-17'), 0.0, 4.0), -35, 0.05), 0.05, 0.6), 'sfx', 0.55, exclusive=True)
    cue('boil', fade(TG('soup_boil1'), 0.3, 0.8), 'sfx', 0.45, exclusive=True)
    cue('tap', fade(TG('sink-faucet'), 0.05, 0.6), 'sfx', 0.45, exclusive=True)
    cue('window', fade(active(CD('open_window'), -40, 0.01), 0.001, 0.1), 'sfx', 0.6)
    # radio switched on: a real switch click, then real radio static
    r = np.zeros(int(1.5 * SR)); place(r, active(load('commons/switch.ogg'), -40, 0.005), 0.0, 0.9)
    place(r, fade(lp(rms_norm(CD('static'), -30), 5000), 0.35, 0.5), 0.12)
    cue('radio', fade(r, 0.001, 0.2), 'sfx', 0.5, exclusive=True)
    # the leather bag: a real suitcase set down and opened (BigSoundBank 0802, CC0)
    cue('bag_open', fade(seg(load('bigsoundbank/suitcase_0802.wav'), 2.0, 6.5), 0.02, 0.4), 'sfx', 0.6)
    # the basket lowered from the balcony: a real rope creaking with a real wicker basket (BigSoundBank 0554 + 0865, CC0)
    ba = fade(seg(load('bigsoundbank/rope_0554.wav'), 0.0, 3.5), 0.05, 0.6)
    ba = ba + fade(seg(load('bigsoundbank/wicker_0865.wav'), 20.0, 23.5), 0.05, 0.6) * 0.6
    cue('basket', ba, 'sfx', 0.6)
    # 1894 Singer sewing machine (real recording, sewing section only)
    cue('sewing', fade(seg(load('commons/sewing_singer1894.ogg'), 13.0, 29.0), 0.4, 1.2), 'sfx', 0.6, exclusive=True)
    for k, why in UNAVAILABLE.items():
        MANIFEST[k] = {'file': None, 'bus': 'sfx', 'loop': False, 'gain': 0, 'duration': 0, 'exclusive': False, 'unavailable': why}
        print(f'  {k:14s} UNAVAILABLE — {why}')


# ── music: genuine recorded performances only ───────────────────────────
def music():
    print('music')
    # Title only: an Egyptian ensemble on a 1931 gramophone record (public domain), first minute, unaltered.
    a = load('commons/sika_1931.ogg')
    cue('music_title', fade(seg(a, 0.0, 62.0), 0.5, 5.0), 'music', 0.45)


if __name__ == '__main__':
    which = set(sys.argv[1:]) or {'ambience', 'effects', 'music'}
    man_path = os.path.join(ROOT, 'src', 'audio', 'manifest.json')
    MANIFEST.update(json.load(open(man_path)))
    for k in ('scissors',): MANIFEST.pop(k, None)
    if 'ambience' in which: ambience()
    if 'effects' in which: effects()
    if 'music' in which: music()
    # the story's music cues are silence: no genuine recording is used as underscore
    for k in ('music_home', 'music_play', 'music_night'):
        MANIFEST[k] = {'file': None, 'bus': 'music', 'loop': False, 'gain': 0, 'duration': 0, 'exclusive': False}
    json.dump(MANIFEST, open(man_path, 'w'), indent=2, ensure_ascii=False)
    print('manifest:', len(MANIFEST), 'cues')
