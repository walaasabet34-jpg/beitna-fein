"""Objective checks on the generated audio (decoded back from the MP3s)."""
import json, subprocess, numpy as np, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
man = json.load(open(os.path.join(ROOT, 'src/audio/manifest.json')))
bad = 0
print(f"{'cue':12s} {'peak dBFS':>9s} {'RMS dBFS':>9s} {'DC':>7s} {'clip%':>6s} {'loop seam':>10s}")
for k, m in man.items():
    raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', os.path.join(ROOT, 'public', m['file']), '-f', 's16le', '-ac', '1', '-ar', '44100', '-'], capture_output=True).stdout
    x = np.frombuffer(raw, '<i2').astype(float) / 32768
    peak = 20 * np.log10(np.max(np.abs(x)) + 1e-9); rms = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
    dc = np.mean(x); clip = np.mean(np.abs(x) > 0.999) * 100
    seam = ''
    if m['loop']:
        # compare short-window RMS just before the end vs right after the start (abrupt level change = audible seam)
        w = 2205; a = np.sqrt(np.mean(x[-w - 2000:-2000] ** 2)); b = np.sqrt(np.mean(x[1200:1200 + w] ** 2))
        seam = f"{20*np.log10((a+1e-9)/(b+1e-9)):+.1f} dB"
        if abs(20*np.log10((a+1e-9)/(b+1e-9))) > 6: bad += 1; seam += ' !'
    flag = ' !' if peak > -0.1 or clip > 0.01 or abs(dc) > 0.01 else ''
    if flag: bad += 1
    print(f"{k:12s} {peak:9.1f} {rms:9.1f} {dc:7.4f} {clip:6.3f} {seam:>10s}{flag}")
print('issues:', bad); sys.exit(1 if bad else 0)
