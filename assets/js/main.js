(function () {
  'use strict';
  var root = document.documentElement;
  var darkMq = window.matchMedia('(prefers-color-scheme: dark)');
  var btn = document.getElementById('theme-toggle');

  // Day / Night: the hero swaps to a night photo, and the page goes dark.
  function mode() { return root.getAttribute('data-theme') || (darkMq.matches ? 'dark' : 'light'); }
  function sync() {
    var m = mode();
    root.setAttribute('data-mode', m);
    if (btn) {
      btn.setAttribute('aria-pressed', m === 'dark' ? 'true' : 'false');
      btn.setAttribute('aria-label', m === 'dark' ? 'Night mode is on. Switch to day' : 'Day mode is on. Switch to night');
    }
  }
  sync();
  if (darkMq.addEventListener) darkMq.addEventListener('change', sync);
  if (btn) btn.addEventListener('click', function () {
    var next = mode() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });

  // The nav is light text while it sits on the photo, and a solid bar once past it.
  var nav = document.getElementById('nav');
  var hero = document.querySelector('.hero');
  if (nav && hero && 'IntersectionObserver' in window) {
    nav.classList.add('on-photo');
    new IntersectionObserver(function (es) {
      nav.classList.toggle('on-photo', es[0].isIntersecting);
    }, { rootMargin: '-60px 0px 0px 0px' }).observe(hero);
  }
})();
