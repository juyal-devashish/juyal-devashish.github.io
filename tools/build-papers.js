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
const { papers } = ctx;
const Q = ['What it does', 'Why it matters', 'How it works', 'Key result'];

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const firstSentence = s => { const m = String(s).match(/^.*?[.!?](\s|$)/); return (m ? m[0] : String(s)).trim(); };
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// A plain list in reading order: title (linked), citation, one-line takeaway,
// and a Notes toggle only where there are longer notes.
const items = papers.map(p => {
  const id = slug(p.title);
  const href = p.link && p.link !== '#' ? p.link : '';
  const title = href ? `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(p.title)}</a>` : esc(p.title);
  const notes = p.qa && p.qa.length
    ? `<button class="p-toggle" type="button" aria-expanded="false" aria-controls="${id}-notes">Notes</button>
          <div class="paper-body" id="${id}-notes"><dl>${p.qa.map((q, j) => `<div><dt>${esc(Q[j] || q.q)}</dt><dd>${esc(q.a)}</dd></div>`).join('')}</dl></div>`
    : '';
  return `      <li class="paper" id="${id}">
          <h2>${title}</h2>
          <p class="sub">${esc(p.authors)}</p>
          <p class="take">${esc(firstSentence(p.excerpt))}</p>${notes ? '\n          ' + notes : ''}
        </li>`;
}).join('\n');

const file = path.join(root, 'papers.html');
let html = fs.readFileSync(file, 'utf8');
const swap = (name, body) => {
  const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!re.test(html)) throw new Error(`missing ${name} markers in papers.html`);
  html = html.replace(re, `$1\n        ${body}\n        $2`);
};
swap('papers', '<ol class="paper-list">\n' + items + '\n        </ol>');
fs.writeFileSync(file, html);
console.log(`papers.html: ${papers.length} entries`);
