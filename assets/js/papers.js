/* Reading notes: the entries are already in the HTML (built by
   tools/build-papers.js). This adds the topic filter, search and the
   Notes toggles. */
(function () {
  'use strict';
  var list = document.getElementById('papers');
  var bar = document.getElementById('tags');
  var search = document.getElementById('search');
  var empty = document.getElementById('no-results');
  if (!list) return;
  var items = [].slice.call(list.querySelectorAll('.paper'));
  var active = '';

  function apply() {
    var q = (search && search.value || '').trim().toLowerCase();
    var shown = 0;
    items.forEach(function (el) {
      var okTag = !active || (' ' + el.dataset.tags + ' ').indexOf(' ' + active + ' ') !== -1;
      var okText = !q || el.dataset.search.indexOf(q) !== -1;
      el.hidden = !(okTag && okText);
      if (!el.hidden) shown++;
    });
    if (empty) empty.hidden = shown !== 0;
  }

  if (bar) bar.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    active = b.getAttribute('data-tag') || '';
    [].forEach.call(bar.querySelectorAll('button'), function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    apply();
  });
  if (search) search.addEventListener('input', apply);

  list.addEventListener('click', function (e) {
    var t = e.target.closest('.p-toggle'); if (!t) return;
    var el = t.closest('.paper'), open = el.classList.toggle('open');
    t.setAttribute('aria-expanded', String(open));
    t.textContent = open ? 'Hide notes' : 'Notes';
  });

  // #paper-id opens that entry.
  var id = decodeURIComponent(location.hash.slice(1));
  var target = id && document.getElementById(id);
  if (target && target.classList.contains('paper')) target.querySelector('.p-toggle').click();
})();
