#!/usr/bin/env python3
"""Radio: genuine archival recordings only. No speech synthesis, no recreated bulletins.

- radio_song      ← Munira al-Mahdiyya, Baidaphon 78rpm record no. 23045 (c. 1914), public domain (Wikimedia Commons).
                    Converted to MP3 at 256 kbps for browser support; nothing else changed.
- shortwave_radio_cairo_1973 ← Radio Cairo, North American service (English), Oct 1973, off-air shortwave recording
                    by Dan Robinson, CC BY-NC 3.0 (Internet Archive). Original MP3 copied byte-for-byte.
- news_1973_10_27, news_1973_11_03, kids_programme: no genuine recording obtainable → no playable source (silent).
Usage: python3 tools/audio/build_radio.py
"""
import json, os, shutil, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'audio-src'); OUT = os.path.join(ROOT, 'public', 'radio')
os.makedirs(OUT, exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(SRC, 'commons', 'munira_1914.ogg'), '-c:a', 'libmp3lame', '-b:a', '256k',
                os.path.join(OUT, 'arch_munira_c1914.mp3')], check=True)
shutil.copyfile(os.path.join(SRC, 'archive_org', 'radio_cairo_1973.mp3'), os.path.join(OUT, 'arch_radio_cairo_1973_sw.mp3'))

def lic(status, label, holder, terms, by):
    return {'status': status, 'label': label, 'holder': holder, 'terms': terms, 'verifiedBy': by, 'verifiedOn': '2026-10-18'}

MUNIRA = {
    'id': 'arch_munira_c1914', 'type': 'archival', 'title': 'تسجيل أصلي: منيرة المهدية — «Aldahre Kata Awsali»، أسطوانة بيضافون رقم ٢٣٠٤٥ (حوالي ١٩١٤)',
    'sourceUrl': 'https://commons.wikimedia.org/wiki/File:Aldahre_Kata_Awsali_(c._1914).ogg', 'historicalDate': 'c. 1914',
    'authenticity': 'authentic-archival',
    'license': lic('cleared', 'Public domain (Wikimedia Commons)', 'Public domain', 'Public domain; recording c. 1914', 'Wikimedia Commons file page; content checked with an AudioSet classifier (female singing, Middle Eastern music)'),
    'attribution': 'Munira al-Mahdiyya, Baidaphon record no. 23045 (c. 1914). Via Wikimedia Commons (public domain).',
    'file': 'radio/arch_munira_c1914.mp3',
    'transcript': [{'t': 0.0, 'text': '♪ منيرة المهدية ♪'}]}
CAIRO = {
    'id': 'arch_radio_cairo_1973_sw', 'type': 'archival', 'title': 'تسجيل أصلي: إذاعة القاهرة الموجّهة لأمريكا الشمالية (بالإنجليزي)، أكتوبر ١٩٧٣',
    'sourceUrl': 'https://archive.org/details/RadioCairoDuring73War', 'historicalDate': '1973-10 (exact day unknown; the talk refers to the start of the war and the Security Council debate)',
    'authenticity': 'authentic-archival',
    'license': lic('cleared', 'CC BY-NC 3.0 (recording); broadcast rights expired under Egyptian Law 82/2002 Art. 168', 'Dan Robinson (off-air recording)', 'Non-commercial use with attribution', 'Internet Archive item metadata; content checked by speech recognition (Radio Cairo station ID and programme "Spotlights on the Middle East" heard)'),
    'attribution': 'Off-air shortwave recording of Radio Cairo by Dan Robinson, Shortwave Radio Audio Archive / Internet Archive, CC BY-NC 3.0.',
    'file': 'radio/arch_radio_cairo_1973_sw.mp3',
    'transcript': [{'t': 0.0, 'text': '[تسجيل أصلي — إذاعة القاهرة، الخدمة الموجّهة بالإنجليزي، أكتوبر ١٩٧٣، اليوم بالظبط مش معروف]'},
                   {'t': 2.0, 'text': '(تعليق بالإنجليزي عن بداية الحرب وحق مصر في تحرير أرضها)'},
                   {'t': 200.0, 'text': '(نهاية برنامج «أضواء على الشرق الأوسط» — إعلان المحطة)'},
                   {'t': 225.0, 'text': '(بداية برنامج عن السياحة في مصر)'}]}

def egyradio(id_, video, title, url_title):
    """An episode on the official channel of Egyptian Radio (الإذاعة المصرية, @EgyRadio), played only in YouTube's
    own embedded player (visible, not extracted). Embedding is enabled by the channel (playableInEmbed: true)."""
    return {'id': id_, 'type': 'archival', 'title': title, 'sourceUrl': f'https://www.youtube.com/watch?v={video}',
            'historicalDate': 'Undated episode (programme on air since 1959); not presented as a 1973 broadcast',
            'authenticity': 'authentic-archival',
            'license': lic('cleared', 'Official embed: Egyptian Radio channel on YouTube, embedding enabled by the channel', 'Egyptian Radio (National Media Authority)',
                           "Played in YouTube's embedded player under YouTube's Terms of Service; no copy is stored or distributed",
                           'YouTube player response: author «الإذاعة المصرية», playableInEmbed true (checked 2026-10-19)'),
            'attribution': f'Fadila Tawfik (Abla Fadila), «غنوة وحدوتة»: {url_title}. Egyptian Radio, official YouTube channel @EgyRadio.',
            'file': None, 'transcript': [], 'embed': {'provider': 'youtube', 'videoId': video, 'channel': '@EgyRadio'}}
HOBB = egyradio('egyradio_hobb_el_watan', 'x0fnDixn_-w', 'أبلة فضيلة — «غنوة وحدوتة»: حُب الوطن', '«حُب الوطن»')
TAGER = egyradio('egyradio_tager_wel_shahat', 'a_uNSnFAFCQ', 'أبلة فضيلة — «غنوة وحدوتة»: التاجر والشحات', '«التاجر والشحات»')

for path in [os.path.join(OUT, 'registry.json'), os.path.join(ROOT, 'src', 'radio', 'registry.default.json')]:
    reg = json.load(open(path))
    for b in reg['broadcasts'].values():
        b['sources'] = [s for s in b['sources'] if s['type'] == 'archival']        # drop every recreation / placeholder
    reg['broadcasts']['radio_song']['title'] = 'أغنية قديمة على الراديو'
    reg['broadcasts']['radio_song']['sources'] = [MUNIRA] + [x for x in reg['broadcasts']['radio_song']['sources'] if x['id'] != MUNIRA['id']]
    # programmes the creative director supplied as recordings: rights not cleared → listed as pending here (public build
    # stays silent); the actual files live only in the git-ignored local archive (public/local-archive/registry.local.json)
    def pending(id_, title, url):
        return {'id': id_, 'type': 'archival', 'title': title, 'sourceUrl': url, 'historicalDate': None, 'authenticity': 'unverified-archival',
                'license': lic('pending', 'Pending rights clearance', None, None, None), 'attribution': None, 'file': None, 'transcript': []}
    reg['broadcasts']['kids_fadila_episode'] = {'title': 'أبلة فضيلة — غنوة وحدوتة', 'kind': 'kids', 'airDate': '1959-01-01', 'window': 'any-after',
        'sources': [pending('arch_fadila_episode', 'أبلة فضيلة، حلقة من «غنوة وحدوتة» (تاريخ الحلقة مش معروف)', 'National Media Authority (Maspero) radio archive')]}
    reg['broadcasts'].pop('ala_el_nasya', None)
    reg['broadcasts']['kids_programme']['title'] = 'أبلة فضيلة — غنوة وحدوتة'
    reg['broadcasts']['kids_programme']['sources'] = [HOBB] + [x for x in reg['broadcasts']['kids_programme']['sources'] if x['id'] != HOBB['id'] and not x.get('embed')]
    reg['broadcasts']['kids_fadila_episode']['sources'] = [TAGER] + [x for x in reg['broadcasts']['kids_fadila_episode']['sources'] if x['id'] != TAGER['id'] and not x.get('embed')]
    # Chapter 2's song slot (3 Nov). Public: the same old record. Local build: «عاش اللي قال» goes in front
    # (Egyptian radio first broadcast it on 18 Oct 1973, per wazizamusic.com).
    reg['broadcasts']['radio_song_c2'] = {'title': 'أغاني على الراديو', 'kind': 'music', 'airDate': '1973-10-18', 'window': 'any-after', 'sources': [MUNIRA]}
    reg['broadcasts']['shortwave_radio_cairo_1973']['sources'] = [CAIRO] + [s for s in reg['broadcasts']['shortwave_radio_cairo_1973']['sources'] if s['id'] != CAIRO['id'] and s['id'] != 'arch_sraa_radio_cairo_1973']
    reg['_readme'] = [l for l in reg.get('_readme', []) if 'placeholder' not in l] + [
        'Only genuine recordings are played. A broadcast with no cleared genuine recording stays silent and the player says so.']
    json.dump(reg, open(path, 'w'), ensure_ascii=False, indent=1)
print('radio ready:', sorted(os.listdir(OUT)))
