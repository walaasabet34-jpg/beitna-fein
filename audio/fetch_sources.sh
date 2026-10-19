#!/usr/bin/env bash
# Downloads the large inputs that are not stored in the repo:
#  - VSCO-2 Community Edition string samples (CC0) used by build_real.py music()
#  - Arabic voice models + Whisper-small used by radio_voices.py
set -euo pipefail
cd "$(dirname "$0")/../.."
V=audio-src/vsco2
if [ ! -d "$V/violin" ]; then
  tmp=$(mktemp -d)
  GIT_LFS_SKIP_SMUDGE=1 git clone -q --depth 1 --filter=blob:none --sparse https://github.com/sgossner/VSCO-2-CE "$tmp/vsco"
  (cd "$tmp/vsco" && git sparse-checkout set "Strings/Solo Violin/Arco Vib" "Strings/Cello Section/susvib" "Strings/Harp" "Strings/Violin Section/susVib" "Strings/Cello Section/pizzT")
  S="$tmp/vsco/Strings"; mkdir -p $V/{violin,cello,harp,violin_section,cello_pizz}
  cp "$S/Solo Violin/Arco Vib/"*_p.wav $V/violin/; cp "$S/Cello Section/susvib/"*_v1_1.wav $V/cello/
  cp "$S/Harp/"*.wav $V/harp/; cp "$S/Violin Section/susVib/"*_v1.wav $V/violin_section/; cp "$S/Cello Section/pizzT/"*.wav $V/cello_pizz/
  cp "$tmp/vsco/LICENSE" $V/LICENSE-CC0.txt; rm -rf "$tmp"
fi
M=tools/audio/_models; mkdir -p $M
B=https://github.com/k2-fsa/sherpa-onnx/releases/download
for n in tts-models/vits-piper-ar_JO-kareem-medium tts-models/vits-piper-ar_JO-SA_dii-high asr-models/sherpa-onnx-whisper-small; do
  d=$M/$(basename $n); [ -d "$d" ] || curl -sL "$B/$n.tar.bz2" | tar xj -C $M
done
echo "sources ready"
