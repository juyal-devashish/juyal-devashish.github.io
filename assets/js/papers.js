(function () {
  'use strict';
  if (typeof papers === 'undefined') return;
  var active = null;
  var Q = ['What it does', 'Why it matters', 'How it works', 'Key result'];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function label(t) { return (typeof TAG_LABELS !== 'undefined' && TAG_LABELS[t]) || t; }

  var counts = {};
  papers.forEach(function (p) { p.tags.forEach(function (t) { counts[t] = (counts[t] || 0) + 1; }); });
  var tags = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });

  var bar = document.getElementById('tags');
  var list = document.getElementById('papers');

  function renderTags() {
    bar.innerHTML = '<button aria-pressed="' + (active === null) + '" data-tag="">All ' + papers.length + '</button>' +
      tags.map(function (t) { return '<button aria-pressed="' + (active === t) + '" data-tag="' + esc(t) + '">' + esc(label(t)) + '</button>'; }).join('');
  }
  function renderList() {
    var items = papers.filter(function (p) { return !active || p.tags.indexOf(active) !== -1; })
      .sort(function (a, b) { return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0); });
    list.innerHTML = items.map(function (p, i) {
      var id = 'p' + i;
      var notes = p.qa && p.qa.length
        ? '<dl>' + p.qa.map(function (q, j) { return '<div><dt>' + esc(Q[j] || q.q) + '</dt><dd>' + esc(q.a) + '</dd></div>'; }).join('') + '</dl>'
        : '<p class="excerpt">' + esc(p.excerpt) + '</p>';
      return '<article class="paper">' +
        '<button class="paper-head" aria-expanded="false" aria-controls="' + id + '">' +
          '<h3>' + esc(p.title) + '</h3><span class="plus" aria-hidden="true"><svg class="icon"><use href="#i-plus"/></svg></span>' +
          '<span class="sub">' + (p.pinned ? 'Pinned · ' : '') + esc(p.authors) + '</span>' +
        '</button>' +
        '<div class="paper-body" id="' + id + '">' + notes +
          (p.link ? '<a class="read" href="' + esc(p.link) + '" target="_blank" rel="noopener">Read the paper <svg class="icon"><use href="#i-arrow"/></svg></a>' : '') +
        '</div></article>';
    }).join('');
  }

  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    active = b.getAttribute('data-tag') || null;
    renderTags(); renderList();
  });
  list.addEventListener('click', function (e) {
    var h = e.target.closest('.paper-head'); if (!h) return;
    var open = h.parentElement.classList.toggle('open');
    h.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  renderTags(); renderList();
})();
