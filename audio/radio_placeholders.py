#!/usr/bin/env python3
"""
Original placeholder radio audio (no recordings, no real voices). Writes public/radio/ph_*.mp3.
The "voices" are deliberately unintelligible formant-synthesis murmur, so nothing here can be
mistaken for a real announcer or a real historical broadcast. Words reach the player via subtitles.
"""
import os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from generate import SR, t, bp, lp, hp, noise, place, norm, write_mp3, OUT as AUDIO_OUT, music_home, music_play, reverb
import generate
OUT = os.path.join(os.path.dirname(AUDIO_OUT), 'radio')
generate.OUT = OUT
rng = np.random.default_rng(6101973)

VOWELS = [(730, 1090, 2440), (270, 2290, 3010), (300, 870, 2240), (530, 1840, 2480), (570, 840, 2410)]

def murmur(sec, f0=115, rate=4.2, jitter=0.03):
    """Speech-like but meaningless: glottal pulses through moving formants, with phrase pauses."""
    n = int(sec * SR); out = np.zeros(n); at = 0.3
    while at < sec - 0.5:
        phrase = rng.uniform(1.6, 3.2)
        k = 0
        while k / rate < phrase and at + k / rate < sec - 0.3:
            syl = (1 / rate) * rng.uniform(0.7, 1.2); tt = t(syl)
            f = f0 * (1 + 0.12 * np.sin(np.pi * (k / max(1, phrase * rate))) - 0.08 * (k / (phrase * rate))) * (1 + jitter * rng.standard_normal())
            src = np.sign(np.sin(2 * np.pi * np.cumsum(np.full(len(tt), f)) / SR)) + 0.15 * noise(len(tt))
            v = VOWELS[rng.integers(len(VOWELS))]
            s = sum(bp(src, fm * 0.85, fm * 1.15, 2) * g for fm, g in zip(v, (1, .6, .3)))
            env = np.sin(np.pi * np.linspace(0, 1, len(tt))) ** 0.6
            place(out, s * env, at + k / rate); k += 1
        at += phrase + rng.uniform(0.35, 0.8)
    return out

def radio_chain(x, sec):
    """AM-radio colour: band-limit, light saturation, hiss and crackle, slow fading."""
    n = len(x); tt = np.arange(n) / SR
    x = bp(x, 300, 3400, 3)
    x = np.tanh(2.2 * x / (np.max(np.abs(x)) + 1e-9))
    hiss = 0.05 * bp(noise(n), 1000, 6000)
    crackle = np.zeros(n)
    for _ in range(int(sec * 3)):
        place(crackle, 0.25 * hp(noise(80), 2000) * np.exp(-np.arange(80) / 15), rng.uniform(0, sec))
    fade = 1 - 0.12 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * tt))
    edges = np.minimum(1, np.minimum(tt / 0.4, (sec - tt) / 0.8))
    return (x * fade + hiss + crackle) * edges

def chime(sec=1.6):
    tt = t(sec)
    return sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.5) for f in (523, 659, 784)) * np.minimum(1, tt / 0.01)

def news(sec=26):
    x = np.zeros(int(sec * SR)); place(x, 0.5 * chime(), 0.2)
    place(x, murmur(sec - 2.4, f0=112), 2.0)
    return radio_chain(x, sec)

def kids(sec=24):
    x = np.zeros(int(sec * SR))
    m = music_play()[:, 0]; place(x, 0.35 * m[: int(4 * SR)] * np.minimum(1, (4 - t(4)) / 1.5), 0)
    place(x, murmur(sec - 4.5, f0=205, rate=3.6), 3.8)
    return radio_chain(reverb(x, 0.12), sec)

def song(sec=30):
    m = music_home()[:, 0]
    return radio_chain(m[: int(sec * SR)], sec)

if __name__ == '__main__':
    for name, fn in (('ph_news', news), ('ph_kids', kids), ('ph_song', song)):
        x = norm(hp(fn(), 40), 0.85)
        path, dur = write_mp3(name, x, False, 64)
        print(f'{name:9s} {dur:5.1f}s {os.path.getsize(path)/1024:6.1f} KB')
