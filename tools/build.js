// Writes the files that are generated from the site's own content:
//   papers.html  the reading shelf's list, from assets/js/papers-data.js
//   papers.md    the same papers as plain text
//   index.md     the home page as markdown, converted from index.html
//   llms.txt     a short index for AI tools
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

console.log(`Built papers.html and papers.md (${papers.length} papers), index.md and llms.txt (${projects.length} projects).`);
