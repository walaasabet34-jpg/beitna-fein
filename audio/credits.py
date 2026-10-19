#!/usr/bin/env python3
"""Writes public/audio-credits.html (attribution for CC BY / CC BY-SA / CC BY-NC) from audio-src/SOURCES.json."""
import html, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = json.load(open(os.path.join(ROOT, 'audio-src', 'SOURCES.json')))
M = json.load(open(os.path.join(ROOT, 'src', 'audio', 'manifest.json')))
rows = ''.join(f'<tr><td>{html.escape(v["title"])}</td><td>{html.escape(v["author"])}</td><td>{html.escape(v["license"])}</td>'
               f'<td><a href="{html.escape(v["url"])}">{html.escape(v["url"])}</a></td></tr>' for v in S['sources'].values())
missing = ''.join(f'<li><b>{k}</b>: {html.escape(v["unavailable"])}</li>' for k, v in M.items() if v.get('unavailable'))
page = f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Audio credits — بيتنا فين؟</title>
<style>body{{font:15px/1.5 system-ui,sans-serif;margin:16px;background:#f3e7d1;color:#2b2118}}table{{border-collapse:collapse;width:100%}}td,th{{border-bottom:1px solid #0002;padding:6px;text-align:left;vertical-align:top;word-break:break-word}}a{{color:#9c4a33}}</style>
<h1>Audio credits</h1>
<p>Every sound in the game is a genuine recording. Edited versions of CC BY-SA recordings are shared under the same licence. No synthetic voices or synthesized music are used.</p>
<table><tr><th>Recording</th><th>Author / performer</th><th>Licence</th><th>Source</th></tr>{rows}</table>
<h2>Silent because no genuine recording was available</h2><ul>{missing}<li><b>Radio news (27 Oct, 3 Nov 1973) and the children's programme</b>: no reusable archival recording found.</li></ul>
</html>'''
open(os.path.join(ROOT, 'public', 'audio-credits.html'), 'w').write(page)
print('wrote public/audio-credits.html')
