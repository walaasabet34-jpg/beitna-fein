#!/usr/bin/env python3
"""Renders every spoken line in radio_scripts.py to audio-src/radio_voice/<broadcast>_<nn>.wav
and checks each one with a speech recogniser (Whisper-small) so unclear lines are caught.

Needs: pip install sherpa-onnx soundfile scipy
Models (GitHub releases of k2-fsa/sherpa-onnx), unpacked into $TTS_MODELS (default tools/audio/_models):
  tts-models/vits-piper-ar_JO-kareem-medium.tar.bz2      (male announcer)
  tts-models/vits-piper-ar_JO-SA_dii-high.tar.bz2        (female presenter)
  asr-models/sherpa-onnx-whisper-small.tar.bz2           (check only)
"""
import glob, os, re, sys
import numpy as np, soundfile as sf, sherpa_onnx
from scipy.signal import resample_poly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from radio_scripts import BROADCASTS

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.environ.get('TTS_MODELS', os.path.join(HERE, '_models'))
OUT = os.path.join(os.path.dirname(os.path.dirname(HERE)), 'audio-src', 'radio_voice')
VOICES = {'m': ('vits-piper-ar_JO-kareem-medium', 0.95), 'f': ('vits-piper-ar_JO-SA_dii-high', 0.85)}

def tts(d):
    d = os.path.join(MODELS, d); onnx = glob.glob(d + '/*.onnx')[0]
    cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
        vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=onnx, tokens=d + '/tokens.txt', data_dir=d + '/espeak-ng-data'), num_threads=4))
    return sherpa_onnx.OfflineTts(cfg)

def recogniser():
    w = os.path.join(MODELS, 'sherpa-onnx-whisper-small') + '/'
    return sherpa_onnx.OfflineRecognizer.from_whisper(encoder=w + 'small-encoder.int8.onnx', decoder=w + 'small-decoder.int8.onnx',
                                                      tokens=w + 'small-tokens.txt', language='ar', task='transcribe', num_threads=4)

def norm(t):
    t = re.sub(r'[ً-ْٰـ]', '', t); t = re.sub('[أإآ]', 'ا', t); t = t.replace('ة', 'ه').replace('ى', 'ي')
    return ' '.join(re.sub(r'[^ء-ي ]', ' ', t).split())

def cer(ref, hyp):
    a, b = norm(ref), norm(hyp); d = np.arange(len(b) + 1)
    for i, ca in enumerate(a, 1):
        p = d.copy(); d[0] = i
        for j, cb in enumerate(b, 1): d[j] = min(p[j] + 1, d[j - 1] + 1, p[j - 1] + (ca != cb))
    return d[-1] / max(1, len(a))

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    engines = {k: tts(v[0]) for k, v in VOICES.items()}
    asr = recogniser(); worst = 0; report = []
    for bid, segs in BROADCASTS.items():
        for i, sgm in enumerate(segs):
            if sgm[0] == 'music': continue
            v, text, sub, _ = sgm
            g = engines[v].generate(text, sid=0, speed=VOICES[v][1])
            a = np.asarray(g.samples, dtype=np.float32)
            path = os.path.join(OUT, f'{bid}_{i:02d}.wav'); sf.write(path, a, g.sample_rate)
            s = asr.create_stream(); s.accept_waveform(16000, resample_poly(a, 16000, g.sample_rate).astype(np.float32))
            asr.decode_stream(s); heard = s.result.text
            e = cer(sub, heard); worst = max(worst, e)
            report.append(f'{bid}#{i:02d} [{v}] CER {e:.2f} | heard: {heard}')
    open(os.path.join(OUT, 'INTELLIGIBILITY.txt'), 'w').write('\n'.join(report) + '\n')
    print('\n'.join(report)); print(f'worst character error rate: {worst:.2f}')
