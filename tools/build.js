// Writes the files that are generated from the site's own content:
//   papers.html  the reading shelf's list, from assets/js/papers-data.js
//   papers.md    the same papers as plain text
//   index.md     the home page as markdown, converted from index.html
//   llms.txt     a short index for AI tools
//   assets/search-index.json  everything the ⌘K search palette can find
// Run `node tools/build.js` after editing either source, then commit the results.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const SITE = 'https://juyal-devashish.github.io';
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(root, f), s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const text = s => String(s).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&').replace(/\s+/g, ' ').replace(/\s+([.,;:!?)])/g, '$1').replace(/\(\s+/g, '(').trim();
const firstSentence = s => { const m = String(s).match(/^.*?[.!?](\s|$)/); return (m ? m[0] : String(s)).trim(); };
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// ---------- papers ----------
const ctx = {};
vm.runInNewContext(read('assets/js/papers-data.js') + ';this.papers = papers;', ctx);
const papers = ctx.papers;
const Q = ['What it does', 'Why it matters', 'How it works', 'Key result'];

const items = papers.map(p => {
  const id = slug(p.title);
  const href = p.link && p.link !== '#' ? p.link : '';
  const title = href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(p.title)}</a>` : esc(p.title);
  const notes = p.qa && p.qa.length
    ? `\n          <details class="notes"><summary>Notes</summary><dl>${p.qa.map((q, j) => `<div><dt>${esc(Q[j] || q.q)}</dt><dd>${esc(q.a)}</dd></div>`).join('')}</dl></details>`
    : '';
  return `      <li class="paper" id="${id}"${p.pinned ? ' data-pinned' : ''}>
          <h2>${title}</h2>
          <p class="sub">${esc(p.authors)}</p>
          <p class="take">${esc(firstSentence(p.excerpt))}</p>${notes}
        </li>`;
}).join('\n');

let papersHtml = read('papers.html');
const re = /(<!-- papers:start -->)[\s\S]*?(<!-- papers:end -->)/;
if (!re.test(papersHtml)) throw new Error('missing papers markers in papers.html');
papersHtml = papersHtml.replace(re, `$1\n        <ol class="paper-list">\n${items}\n        </ol>\n        $2`);
write('papers.html', papersHtml);

const papersMd = ['# Reading shelf', '', 'Papers I’ve read, in the order I added them. Each has a one-line takeaway; some have longer notes.', ''];
papers.forEach(p => {
  const href = p.link && p.link !== '#' ? p.link : '';
  papersMd.push(`- ${href ? `[${p.title}](${href})` : p.title}, ${p.authors}: ${firstSentence(p.excerpt)}`);
  (p.qa || []).forEach((q, j) => papersMd.push(`  - ${Q[j] || q.q}: ${q.a}`));
});
write('papers.md', papersMd.join('\n') + '\n');

// ---------- home page as markdown ----------
function toMarkdown(html) {
  let s = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|svg|picture|video|dialog|noscript|button|header)\b[\s\S]*?<\/\1>/gi, '')
    .replace(/<span class="local-time"[\s\S]*?<\/span>/i, '')
    .replace(/<div class="reel"[\s\S]*?(?=<div class="wrap foot">)/i, '')
    .replace(/<a class="skip"[^>]*>[\s\S]*?<\/a>/i, '')
    .replace(/<img\b[^>]*>/gi, '');
  s = s.replace(/<a\b[^>]*?href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (m, href, inner) => {
    const t = text(inner);
    if (!t) return '';
    if (href.startsWith('#')) return t;
    const url = /^(https?:|mailto:)/.test(href) ? href : `${SITE}/${href.replace(/^\//, '')}`;
    return `[${t}](${url})`;
  });
  s = s.replace(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi, (m, a, b) => `\n- **${text(a)}**: ${text(b)}\n`);
  for (const n of [1, 2, 3, 4]) s = s.replace(new RegExp(`<h${n}\\b[^>]*>([\\s\\S]*?)</h${n}>`, 'gi'), (m, t) => `\n\n${'#'.repeat(n)} ${text(t)}\n\n`);
  s = s.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (m, t) => `\n- ${text(t)}\n`);
  s = s.replace(/<\/(p|div|section|article|main|footer|ul|ol|dl|figure|figcaption)>/gi, '\n\n').replace(/<br\s*\/?>/gi, '\n');
  s = text(s.replace(/\n/g, '\u0001')).replace(/\u0001/g, '\n');
  s = s.replace(/\)\[/g, ') · [');
  const out = []; let para = [];
  const flush = () => { if (para.length) { out.push(para.join(' ')); para = []; } };
  s.split('\n').map(l => l.trim()).forEach(l => {
    if (!l) { flush(); return; }
    if (l.startsWith('#') || l.startsWith('- ')) { flush(); out.push(l); } else para.push(l);
  });
  flush();
  // Blank line between blocks, but list items stay together.
  return out.map((l, i) => (i && !(l.startsWith('- ') && out[i - 1].startsWith('- ')) ? '\n' : '') + l).join('\n') + '\n';
}
const home = read('index.html');
const main = home.slice(home.indexOf('<section class="hero"'), home.indexOf('<dialog class="lightbox"'));
write('index.md', toMarkdown(main));

// ---------- llms.txt ----------
const pitch = text((home.match(/<p class="hero-pitch">([\s\S]*?)<\/p>/) || [])[1] || '');
const email = (home.match(/href="mailto:([^"]+)"/) || [])[1];
const linkedin = (home.match(/href="(https:\/\/www\.linkedin\.com\/[^"]+)"/) || [])[1];
const github = (home.match(/href="(https:\/\/github\.com\/juyal-devashish)"/) || [])[1];
const projects = [...home.matchAll(/<article class="project[^"]*" id="[^"]+">([\s\S]*?)<\/article>/g)].map(m => {
  const name = text((m[1].match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '');
  const sum = text((m[1].match(/<p class="p-sum">([\s\S]*?)<\/p>/) || [])[1] || '');
  const url = (m[1].match(/<p class="p-links">[\s\S]*?href="([^"]+)"/) || [])[1];
  return `- [${name}](${url}): ${sum}`;
});
write('llms.txt', [
  '# Devashish Juyal', '',
  `> AI engineer in New York. ${pitch}`, '',
  'Personal site and portfolio. Each page below is also available as markdown.', '',
  '## Pages', '',
  `- [Home](${SITE}/index.md): who I am, what I’ve built and where I’ve worked`,
  `- [Reading shelf](${SITE}/papers.md): papers I’ve read, with a takeaway for each`,
  `- [Résumé (PDF)](${SITE}/assets/devashish-juyal-resume.pdf): work, education and projects`, '',
  '## Projects', '', ...projects, '',
  '## Contact', '',
  `- Email: ${email}`, `- LinkedIn: ${linkedin}`, `- GitHub: ${github}`, ''
].join('\n'));

// ---------- search index (for the ⌘K palette) ----------
// One flat list built from the same sources as the pages, so search can't drift
// from the content. Types: action, page, project, role, paper, photo. A result
// has `href` (open in this tab), `ext` (open in a new tab), `act` (run something)
// or `full` (open the photo viewer). `text` is matched but never shown.
const must = (v, what) => { if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) throw new Error(`search index: could not find ${what} in the page markup`); return v; };
const entries = [];
const add = e => entries.push(e);

add({ id: 'email', type: 'action', title: 'Email me', meta: must(email, 'the mailto link'), blurb: 'Opens your mail app with my address filled in.', kw: 'contact write message hire talk', href: `mailto:${email}` });
add({ id: 'copy-email', type: 'action', title: 'Copy email address', meta: email, blurb: 'Puts my address on your clipboard.', kw: 'contact copy clipboard', act: 'copy-email', value: email });
add({ id: 'resume', type: 'action', title: 'Résumé (PDF)', meta: 'PDF', blurb: 'Work, education and projects on one page.', kw: 'cv resume curriculum vitae download', href: must((home.match(/href="(assets\/devashish-juyal-resume\.pdf)"/) || [])[1], 'the résumé link') });
add({ id: 'linkedin', type: 'action', title: 'LinkedIn', meta: 'Opens in a new tab', blurb: 'My profile on LinkedIn.', kw: 'social profile connect', ext: must(linkedin, 'the LinkedIn link') });
add({ id: 'github', type: 'action', title: 'GitHub', meta: 'Opens in a new tab', blurb: 'My code, including every project here.', kw: 'code repositories social source', ext: must(github, 'the GitHub link') });

add({ id: 'home', type: 'page', title: 'Home', meta: 'Page', blurb: 'The top of the home page.', kw: 'top start index', href: 'index.html' });
add({ id: 'shelf', type: 'page', title: 'Reading shelf', meta: `Page · ${papers.length} papers`, blurb: 'Papers I’ve read, on a shelf of book spines.', kw: 'papers reading research books notes', href: 'papers.html' });
// Sections: the blurb is what the preview shows. A missing section fails the build.
const SECTIONS = {
  work: ['Work', 'Tech Observer, and what I do there.', 'tech observer job employer data scientist'],
  projects: ['Projects', 'What I’ve built, with live demos where there are any.', 'portfolio built demos'],
  background: ['Background', 'Earlier roles, education, recognition and photos from the archive.', 'experience education degree school recognition fellowship archive'],
  fun: ['Fun stuff', 'Photography, trails and where I’ve lived.', 'hobbies photography life'],
  contact: ['Contact', 'Email, résumé and links.', 'reach hire talk email']
};
const sectionHtml = id => id === 'contact'
  ? (home.match(/<div class="wrap closing" id="contact">([\s\S]*?)<\/div>/) || [])[1]
  : (home.match(new RegExp(`<section id="${id}"[^>]*>([\\s\\S]*?)</section>`)) || [])[1];
Object.entries(SECTIONS).forEach(([id, [title, blurb, kw]]) => {
  const html = must(sectionHtml(id), `the "${id}" section`);
  add({ id: `go-${id}`, type: 'page', title, meta: 'Section', blurb, kw, text: id === 'fun' ? text(html) : '', href: `index.html#${id}` });
});

// Projects
const projectRe = /<article class="project[^"]*" id="([^"]+)">([\s\S]*?)<\/article>/g;
let nProjects = 0;
for (const m of home.matchAll(projectRe)) {
  const [, id, a] = m;
  const meta = (a.match(/<p class="p-meta">([\s\S]*?)<\/p>/) || [])[1] || '';
  const year = (meta.match(/<span class="date">([^<]*)<\/span>/) || [])[1] || '';
  const badges = [...meta.matchAll(/<span class="badge([^"]*)">([^<]*)<\/span>/g)].map(b => ({ status: /status/.test(b[1]), label: text(b[2]) }));
  const domain = text(meta.replace(/<span[^>]*>[^<]*<\/span>/g, '')).replace(/^[·\s]+/, '');
  const links = [...((a.match(/<p class="p-links">([\s\S]*?)<\/p>/) || [])[1] || '').matchAll(/<a href="([^"]+)"[^>]*>([^<]*)<\/a>/g)].map(l => ({ label: text(l[2]), href: l[1] }));
  const role = text((a.match(/<p class="p-role">([\s\S]*?)<\/p>/) || [])[1] || '');
  add({
    id, type: 'project', title: text(must((a.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1], `the title of project ${id}`)),
    meta: [year, (badges.find(b => b.status) || {}).label].filter(Boolean).join(' · '),
    blurb: text(must((a.match(/<p class="p-sum">([\s\S]*?)<\/p>/) || [])[1], `the summary of project ${id}`)) + (role ? ` ${role}` : ''),
    kw: [domain, ...badges.filter(b => !b.status).map(b => b.label)].join(' '),
    text: text((a.match(/<div class="p-notes">([\s\S]*?)<\/div>/) || [])[1] || ''),
    href: `index.html#${id}`, img: (a.match(/<img class="p-thumb" src="([^"]+)"/) || a.match(/poster="([^"]+)"/) || [])[1], links
  });
  nProjects++;
}
must(nProjects, 'any project articles');
// Smaller things link straight to their code.
for (const m of must((home.match(/<ul class="smaller">([\s\S]*?)<\/ul>/) || [])[1], 'the smaller-things list').matchAll(/<li><a href="([^"]+)"[^>]*>([^<]+)<\/a><span>([^<]*)<\/span><span class="date">([^<]*)<\/span><\/li>/g)) {
  add({ id: slug(m[2]), type: 'project', title: text(m[2]), meta: `${m[4]} · Code`, blurb: text(m[3]), kw: 'github small experiment', ext: m[1] });
}

// Work and background rows: each has an id in index.html, so a result lands on the row.
const tech = must((home.match(/<div class="job" id="tech-observer">([\s\S]*?)<\/dl>/) || [])[1], 'the Tech Observer block');
add({ id: 'tech-observer', type: 'role', title: 'Tech Observer', meta: `${text((tech.match(/<span class="date">([^<]*)</) || [])[1] || '')} · ${text((tech.match(/<p class="job-role">([\s\S]*?)<\/p>/) || [])[1] || '')}`, blurb: `${[...tech.matchAll(/<dt>([\s\S]*?)<\/dt>/g)].map(r => text(r[1])).join(', ')}.`, kw: 'job employer work', href: 'index.html#tech-observer' });
for (const m of tech.matchAll(/<dt>([\s\S]*?)<\/dt><dd>([\s\S]*?)<\/dd>/g)) add({ id: `to-${slug(m[1])}`, type: 'role', title: text(m[1]), meta: 'At Tech Observer', blurb: text(m[2]), kw: 'work', href: 'index.html#tech-observer' });
let nRows = 0;
for (const m of home.matchAll(/<div class="b-row[^"]*" id="([^"]+)">([\s\S]*?)<\/div>/g)) {
  const org = text((m[2].match(/<span class="b-org">([\s\S]*?)<\/span>/) || [])[1] || '');
  const r = text((m[2].match(/<span class="b-role">([\s\S]*?)<\/span>/) || [])[1] || '');
  const d = text((m[2].match(/<span class="date">([\s\S]*?)<\/span>/) || [])[1] || '');
  const p = text((m[2].match(/<p>([\s\S]*?)<\/p>/) || [])[1] || '');
  add({ id: m[1], type: 'role', title: org, meta: [r, d].filter(Boolean).join(' · ') || 'Background', blurb: p || r || org, kw: 'background', href: `index.html#${m[1]}` });
  nRows++;
}
must(nRows, 'any background rows (they need ids)');

// Papers
papers.forEach(p => {
  const id = slug(p.title);
  add({ id: `paper-${id}`, type: 'paper', title: p.title, meta: p.authors, blurb: firstSentence(p.excerpt), kw: (p.tags || []).join(' '), text: (p.qa || []).map(q => q.a).join(' '), href: `papers.html#${id}`, ext: p.link && p.link !== '#' ? p.link : undefined });
});

// Photos: the strip (captions live in photos.js) and the archive
const photosJs = read('assets/js/photos.js');
const stripSrc = must((photosJs.match(/var PHOTOS = (\[[\s\S]*?\n  \]);/) || [])[1], 'the PHOTOS list in photos.js');
const photoDir = must((photosJs.match(/var DIR = '([^']+)'/) || [])[1], 'DIR in photos.js');
vm.runInNewContext(`this.list = ${stripSrc}`, ctx);
ctx.list.forEach(p => add({ id: `photo-${p.f.replace(/\.jpg$/, '')}`, type: 'photo', title: p.cap, meta: 'Photo', blurb: p.alt, kw: '', img: photoDir + p.f, full: photoDir + p.f }));
for (const m of home.matchAll(/<figure><button type="button" data-full="([^"]+)"><img src="([^"]+)"[^>]*alt="([^"]*)"[^>]*><\/button><figcaption>([^<]*)<\/figcaption><\/figure>/g)) {
  add({ id: `archive-${slug(m[4])}`, type: 'photo', title: text(m[4]), meta: 'Archive', blurb: text(m[3]), kw: 'archive certificate degree', img: m[2], full: m[1] });
}

const seen = new Set();
entries.forEach(e => { if (seen.has(e.id)) throw new Error(`search index: duplicate id ${e.id}`); seen.add(e.id); });
const counts = {}; entries.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });
write('assets/search-index.json', '[\n' + entries.map(e => JSON.stringify(e)).join(',\n') + '\n]\n');

console.log(`Built papers.html and papers.md (${papers.length} papers), index.md and llms.txt (${projects.length} projects), and a search index of ${entries.length} results (${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')}).`);
