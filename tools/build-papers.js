// Writes the reading notes into papers.html as plain HTML, so they show up
// without JavaScript (search engines, link previews). The data stays in
// assets/js/papers-data.js; run `node tools/build-papers.js` after editing it.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/papers-data.js'), 'utf8') +
  ';this.papers = papers; this.TAG_LABELS = TAG_LABELS;', ctx);
const { papers, TAG_LABELS } = ctx;
const Q = ['What it does', 'Why it matters', 'How it works', 'Key result'];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const firstSentence = s => { const m = String(s).match(/^.*?[.!?](\s|$)/); return (m ? m[0] : String(s)).trim(); };
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const counts = {};
papers.forEach(p => p.tags.forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
const tags = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
const chips = [`<button type="button" aria-pressed="true" data-tag="">All<span class="n">${papers.length}</span></button>`]
  .concat(tags.map(t => `<button type="button" aria-pressed="false" data-tag="${esc(t)}">${esc(TAG_LABELS[t] || t)}<span class="n">${counts[t]}</span></button>`))
  .join('\n        ');

const ordered = papers.slice().sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
const items = ordered.map(p => {
  const id = slug(p.title);
  const notes = p.qa && p.qa.length
    ? `<dl>${p.qa.map((q, j) => `<div><dt>${esc(Q[j] || q.q)}</dt><dd>${esc(q.a)}</dd></div>`).join('')}</dl>`
    : `<p>${esc(p.excerpt)}</p>`;
  const link = p.link && p.link !== '#' ? `<a class="read" href="${esc(p.link)}" target="_blank" rel="noopener">Read the paper</a>` : '';
  const search = [p.title, p.authors, p.excerpt, p.tags.join(' ')].join(' ').toLowerCase();
  return `      <article class="paper${p.pinned ? ' pinned' : ''}" id="${id}" data-tags="${esc(p.tags.join(' '))}" data-search="${esc(search)}">
        <div class="paper-head">
          <h2>${esc(p.title)}</h2>
          <p class="sub">${p.pinned ? 'Pinned · ' : ''}${esc(p.authors)}</p>
          <p class="take">${esc(firstSentence(p.excerpt))}</p>
          <button class="p-toggle" type="button" aria-expanded="false" aria-controls="${id}-notes">Notes</button>
        </div>
        <div class="paper-body" id="${id}-notes">${notes}${link}</div>
      </article>`;
}).join('\n');

const file = path.join(root, 'papers.html');
let html = fs.readFileSync(file, 'utf8');
const swap = (name, body) => {
  const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!re.test(html)) throw new Error(`missing ${name} markers in papers.html`);
  html = html.replace(re, `$1\n        ${body}\n        $2`);
};
swap('chips', chips);
swap('papers', '\n' + items + '\n');
fs.writeFileSync(file, html);
console.log(`papers.html: ${papers.length} entries, ${tags.length} topics`);
