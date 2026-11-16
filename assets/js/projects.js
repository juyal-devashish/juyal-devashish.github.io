/* Project rows: a labelled Details button with aria-expanded, the whole row
   clickable, #project-id links that open the row, and Expand all.
   Without JS every row is simply open. */
(function () {
  'use strict';
  var rows = [].slice.call(document.querySelectorAll('.project'));
  if (!rows.length) return;
  var all = document.getElementById('expand-all');

  function set(row, open) {
    row.classList.toggle('open', open);
    var b = row.querySelector('.p-toggle');
    if (b) {
      b.setAttribute('aria-expanded', String(open));
      b.textContent = open ? 'Hide details' : 'Details';
    }
  }
  function syncAll() {
    var every = rows.every(function (r) { return r.classList.contains('open'); });
    if (all) { all.setAttribute('aria-pressed', String(every)); all.textContent = every ? 'Collapse all' : 'Expand all'; }
  }

  rows.forEach(function (row) {
    row.addEventListener('click', function (e) {
      // Links, and anything inside the opened notes, keep their own behaviour.
      if (e.target.closest('a') || (e.target.closest('.p-more') && !e.target.closest('.p-toggle'))) return;
      if (window.getSelection && String(window.getSelection())) return; // let people select text
      set(row, !row.classList.contains('open'));
      syncAll();
    });
  });

  if (all) all.addEventListener('click', function () {
    var open = all.getAttribute('aria-pressed') !== 'true';
    rows.forEach(function (r) { set(r, open); });
    syncAll();
  });

  function fromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    var row = id && document.getElementById(id);
    if (row && row.classList.contains('project')) { set(row, true); syncAll(); }
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();

  // Print with everything open.
  window.addEventListener('beforeprint', function () { rows.forEach(function (r) { set(r, true); }); });
})();
