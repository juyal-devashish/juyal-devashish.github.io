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

  // Archive photos open in the same larger view as the photo strip.
  var box = document.getElementById('lightbox');
  [].forEach.call(document.querySelectorAll('.archive button[data-full]'), function (b) {
    b.addEventListener('click', function () {
      if (!box || !box.showModal) return;
      var img = b.querySelector('img'), cap = b.parentNode.querySelector('figcaption');
      document.getElementById('lb-img').src = b.getAttribute('data-full');
      document.getElementById('lb-img').alt = img.alt;
      document.getElementById('lb-cap').textContent = cap ? cap.textContent : '';
      box.showModal();
    });
  });
})();
