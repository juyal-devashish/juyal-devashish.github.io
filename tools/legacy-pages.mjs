// Writes legacy-pages/: what GitHub Pages serves once the site lives on Vercel.
//   node tools/legacy-pages.mjs http://127.0.0.1:3200
// Reads the markdown copies, llms.txt and the search index from a running build (built
// with the production NEXT_PUBLIC_SITE_URL), and writes redirect stubs for the old URLs.
// Old deep links (index.html#sama4, papers.html#<slug>) land on the matching new anchor.
import fs from 'node:fs';
import path from 'node:path';

const BASE = (process.argv[2] || 'http://127.0.0.1:3200').replace(/\/$/, '');
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://juyal-devashish.vercel.app').replace(/\/$/, '');
const OUT = 'legacy-pages';

const get = async p => {
  const r = await fetch(BASE + p);
  if (r.status !== 200) throw new Error(`${p}: HTTP ${r.status}`);
  return r.text();
};

const index = JSON.parse(await get('/search-index.json'));
// Old one-page anchors → new pages. Project and résumé ids are unchanged, so they are read
// from the index; the old section ids are listed by hand.
const map = { work: '/resume#tech-observer', projects: '/projects', background: '/resume', fun: '/photos', contact: '/#contact', top: '/' };
for (const e of index) {
  const m = /^\/(projects|resume)#(.+)$/.exec(e.href || '');
  if (m) { map[m[2]] = e.href; map[`${m[2]}-more`] = e.href; }
}

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function stub(target, title, hashMap) {
  const url = SITE + target;
  const js = hashMap
    ? `var m=${JSON.stringify(hashMap)},h=decodeURIComponent(location.hash.slice(1));location.replace(m[h]?${JSON.stringify(SITE)}+m[h]:${JSON.stringify(url)}+location.hash);`
    : `location.replace(${JSON.stringify(url)}+location.hash);`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · Devashish Juyal</title>
<link rel="canonical" href="${esc(url)}">
<meta name="robots" content="noindex">
<script>${js}</script>
<meta http-equiv="refresh" content="0; url=${esc(url)}">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0A1330;color:#F3EEE6;font:18px/1.5 system-ui,sans-serif}a{color:#F59A5C;display:inline-block;padding:12px 4px}</style>
</head>
<body>
<p>This page moved to <a href="${esc(url)}">${esc(url.replace(/^https?:\/\//, ''))}</a>.</p>
</body>
</html>
`;
}

fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
const write = (f, s) => { fs.writeFileSync(path.join(OUT, f), s); console.log('wrote', path.join(OUT, f)); };
write('index.html', stub('/', 'Moved', map));
write('papers.html', stub('/stack', 'Moved'));
write('404.html', stub('/', 'Moved'));
write('.nojekyll', '');
const fix = s => { if (!s.includes(SITE)) console.warn(`warning: content does not mention ${SITE}; build with NEXT_PUBLIC_SITE_URL=${SITE}`); return s; };
write('index.md', fix(await get('/index.md')));
write('papers.md', fix(await get('/stack.md')));
write('llms.txt', fix(await get('/llms.txt')));
// The résumé keeps its old address: a real copy, since a PDF can't redirect.
fs.copyFileSync('public/assets/devashish-juyal-resume.pdf', path.join(OUT, 'assets/devashish-juyal-resume.pdf'));
console.log('wrote', path.join(OUT, 'assets/devashish-juyal-resume.pdf'));
