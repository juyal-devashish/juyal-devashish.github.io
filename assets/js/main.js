(function () {
  'use strict';
  // The nav is light text while it sits on the hero image, and a solid bar once past it.
  var nav = document.getElementById('nav');
  var hero = document.querySelector('.hero');
  if (nav && hero && 'IntersectionObserver' in window) {
    nav.classList.add('on-photo');
    new IntersectionObserver(function (es) {
      nav.classList.toggle('on-photo', es[0].isIntersecting);
    }, { rootMargin: '-60px 0px 0px 0px' }).observe(hero);
  }
})();
