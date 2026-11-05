(function () {
  'use strict';
  var root = document.documentElement;
  var darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  var btn = document.getElementById('theme-toggle');

  function mode() { return root.getAttribute('data-theme') || (darkMq.matches ? 'dark' : 'light'); }
  function sync() {
    var m = mode();
    root.setAttribute('data-mode', m);
    if (btn) btn.setAttribute('aria-label', m === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  sync();
  if (darkMq.addEventListener) darkMq.addEventListener('change', sync);
  if (btn) btn.addEventListener('click', function () {
    var next = mode() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });
})();
