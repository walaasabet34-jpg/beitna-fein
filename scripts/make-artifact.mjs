// Turns the single-file build into an Artifact page body (the host adds doctype/html/head/body).
import fs from 'node:fs';
const html = fs.readFileSync('dist-single/index.html', 'utf8');
const title = '<title>بيتنا فين؟</title>';
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
  .replace(/<meta charset[^>]*>/i, '').replace(/<meta name="viewport"[^>]*>/i, '').replace(/<title>[\s\S]*?<\/title>/i, '');
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const out = `${title}\n<style>html,body{height:100%}body{direction:rtl}</style>\n${head}\n${body}\n<script>document.documentElement.lang='ar';document.documentElement.dir='rtl';</script>\n`;
fs.mkdirSync('artifact', { recursive: true });
fs.writeFileSync('artifact/beitna-fein.html', out);
console.log('bytes', out.length);
