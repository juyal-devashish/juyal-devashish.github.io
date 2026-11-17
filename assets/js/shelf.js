/* The reading shelf: each paper in the list becomes a book spine. Select one
   to open its note; arrow keys move along the shelf and Enter opens. The plain
   list stays in the page for search engines and for visitors without script. */
(function () {
  'use strict';
  var list = document.querySelector('.paper-list');
  var host = document.getElementById('shelf');
  var dlg = document.getElementById('paper-dialog');
  if (!list || !host || !dlg || !dlg.showModal) return;

  // Spine colours with their text colour, each pair 4.5:1 or better.
  var PAL = [['#E9DFCB', '#161D36'], ['#4F6FB0', '#FFF8EE'], ['#A8453B', '#FFF8EE'], ['#E0914F', '#161D36'],
             ['#5B6279', '#FFF8EE'], ['#2F6F73', '#FFF8EE'], ['#C9B88F', '#161D36'], ['#8B5D7A', '#FFF8EE']];
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shorten(t) {
    t = t.replace(/\s*\([^)]*\)\s*$/, '');
    if (t.length > 55 && /[:—]/.test(t)) t = t.split(/[:—]/)[0].trim();
    return t;
  }

  var papers = [].slice.call(list.querySelectorAll('.paper')).map(function (li) {
    var a = li.querySelector('h2 a'), h2 = li.querySelector('h2');
    var notes = li.querySelector('.notes dl');
    return {
      id: li.id, title: h2.textContent.trim(), href: a ? a.getAttribute('href') : '',
      sub: li.querySelector('.sub').textContent.trim(), take: li.querySelector('.take').textContent.trim(),
      notes: notes ? notes.outerHTML : '', pinned: li.hasAttribute('data-pinned')
    };
  });

  var spines = papers.map(function (p, i) {
    var short = shorten(p.title), h = hash(p.title), pal = PAL[h % PAL.length];
    var height = Math.round(Math.min(330, Math.max(190, 120 + short.length * 4.2)) + (h % 4) * 8);
    var lines = Math.ceil(short.length * 7.6 / (height - 28));
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'spine' + (p.pinned ? ' pinned' : '');
    b.setAttribute('aria-label', p.title + '. ' + p.sub);
    b.style.cssText = '--w:' + Math.max(36, 18 + lines * 17) + 'px;--h:' + height + 'px;--c:' + pal[0] + ';--t:' + pal[1];
    b.tabIndex = i === 0 ? 0 : -1;
    var s = document.createElement('span'); s.textContent = short; b.appendChild(s);
    b.addEventListener('click', function () { openPaper(i, true); });
    return b;
  });

  // Fill rows left to right, then start a new shelf.
  function pack() {
    var width = host.clientWidth - 16, rows = [], used = 0, row;
    host.textContent = '';
    spines.forEach(function (b) {
      var w = parseFloat(b.style.getPropertyValue('--w')) + 6;
      if (!row || used + w > width) { row = document.createElement('div'); row.className = 'shelf-row'; host.appendChild(row); rows.push(row); used = 0; }
      row.appendChild(b); used += w;
    });
  }
  var packedAt = 0;
  function repack() { var w = host.clientWidth; if (Math.abs(w - packedAt) > 4) { packedAt = w; pack(); } }
  host.hidden = false; repack();
  if ('ResizeObserver' in window) new ResizeObserver(repack).observe(host); else window.addEventListener('resize', repack);
  document.documentElement.classList.add('shelf-on');

  // One tab stop for the whole shelf; arrow keys move between spines.
  function focusSpine(i) {
    i = Math.max(0, Math.min(spines.length - 1, i));
    spines.forEach(function (b, j) { b.tabIndex = j === i ? 0 : -1; });
    spines[i].focus();
  }
  host.addEventListener('keydown', function (e) {
    var i = spines.indexOf(document.activeElement);
    if (i < 0) return;
    var k = e.key;
    if (k === 'ArrowRight') i++; else if (k === 'ArrowLeft') i--;
    else if (k === 'Home') i = 0; else if (k === 'End') i = spines.length - 1;
    else if (k === 'ArrowDown' || k === 'ArrowUp') {
      var rows = [].slice.call(host.children), cur = spines[i].parentNode, r = rows.indexOf(cur) + (k === 'ArrowDown' ? 1 : -1);
      if (r < 0 || r >= rows.length) return;
      var x = spines[i].offsetLeft + spines[i].offsetWidth / 2, best = null, d = 1e9;
      [].forEach.call(rows[r].children, function (b) { var dx = Math.abs(b.offsetLeft + b.offsetWidth / 2 - x); if (dx < d) { d = dx; best = b; } });
      i = spines.indexOf(best);
    } else return;
    e.preventDefault(); focusSpine(i);
  });

  // The note.
  var at = -1;
  function fill(i) {
    var p = papers[i]; at = i;
    document.getElementById('pd-title').textContent = p.title;
    document.getElementById('pd-sub').textContent = p.sub;
    document.getElementById('pd-take').textContent = p.take;
    document.getElementById('pd-notes').innerHTML = p.notes;
    var link = document.getElementById('pd-read');
    link.hidden = !p.href; if (p.href) link.href = p.href;
    document.getElementById('pd-prev').disabled = i === 0;
    document.getElementById('pd-next').disabled = i === papers.length - 1;
    dlg.querySelector('.pd-body').scrollTop = 0;
    if (history.replaceState) history.replaceState(null, '', '#' + p.id);
  }
  function openPaper(i) { fill(i); if (!dlg.open) dlg.showModal(); }
  document.getElementById('pd-prev').addEventListener('click', function () { if (at > 0) fill(at - 1); });
  document.getElementById('pd-next').addEventListener('click', function () { if (at < papers.length - 1) fill(at + 1); });
  document.getElementById('pd-close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function () {
    if (history.replaceState) history.replaceState(null, '', location.pathname);
    if (at >= 0) focusSpine(at);
  });

  function fromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    for (var i = 0; i < papers.length; i++) if (papers[i].id === id) { openPaper(i); break; }
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
