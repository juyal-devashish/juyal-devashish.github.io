/* Reading notes: a plain list, already in the HTML (built by
   tools/build-papers.js). This only adds the Notes toggles. */
(function () {
  'use strict';
  var list = document.getElementById('papers');
  if (!list) return;
  list.addEventListener('click', function (e) {
    var t = e.target.closest('.p-toggle'); if (!t) return;
    var el = t.closest('.paper'), open = el.classList.toggle('open');
    t.setAttribute('aria-expanded', String(open));
    t.textContent = open ? 'Hide notes' : 'Notes';
  });
  // #paper-id opens that entry's notes, if it has any.
  var id = decodeURIComponent(location.hash.slice(1));
  var target = id && document.getElementById(id);
  var btn = target && target.classList.contains('paper') && target.querySelector('.p-toggle');
  if (btn) btn.click();
})();
