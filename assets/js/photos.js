/* Photography: one photo at a time, shuffled on each visit.
   To add a photo, drop a JPEG (long edge 1400px, metadata stripped) into
   assets/img/photos/ and add a line here. */
(function () {
  'use strict';
  var DIR = 'assets/img/photos/';
  var PHOTOS = [
    { f: 'dsc_0295.jpg', alt: 'Clouds settling into a valley between green hills.' },
    { f: 'img_0510.jpg', alt: 'The Hollywood sign on a dry hillside under a clear blue sky.' },
    { f: 'img_1128.jpg', alt: 'Someone on a porch watching the northern lights over a dark treeline.' },
    { f: 'img_1364.jpg', alt: 'A city skyline at dusk under a pale violet sky.' },
    { f: 'img_1914.jpg', alt: 'A visitor looking at a painting of classical ruins in a museum.' },
    { f: 'img_3440.jpg', alt: 'A wet two-lane road with yellow lines running to the horizon.' },
    { f: 'img_3677.jpg', alt: 'A city skyline lit up at night across dark water.' },
    { f: 'img_3684.jpg', alt: 'A suspension bridge lit at night, with city towers behind it.' },
    { f: 'img_4316.jpg', alt: 'Red and green autumn trees on a lawn at sunset.' },
    { f: 'img_4466.jpg', alt: 'A packed basketball arena in maize and blue, seen from the upper seats.' },
    { f: 'img_4849.jpg', alt: 'An airplane wing over a blue sea and scattered clouds.' },
    { f: 'img_4967.jpg', alt: 'City lights at night, seen from an observatory terrace.' },
    { f: 'img_5342.jpg', alt: 'A starry night sky over a mountain ridge.' },
    { f: 'img_5651.jpg', alt: 'A gravel road crossing open, dry hills under a hazy sky.' },
    { f: 'img_6437.jpg', alt: 'A Gothic building with tall lit windows at night, seen across a lawn.' },
    { f: 'img_6438.jpg', alt: 'Rows of tall arched windows glowing at night.' },
    { f: 'img_7344.jpg', alt: 'A fiery orange sunset over rooftops and trees in silhouette.' },
    { f: 'img_7521.jpg', alt: 'A baseball game seen from the stands of a ballpark.' },
    { f: 'img_7526.jpg', alt: 'Skyscrapers lit at night from high above, with a dark lake beyond.' },
    { f: 'img_7535.jpg', alt: 'Big white clouds over a green valley, seen from a hilltop.' },
    { f: 'img_7541.jpg', alt: 'A city skyline across a lake under a rippled, cloudy sky.' },
    { f: 'img_7742.jpg', alt: 'A city street with a tall glass tower rising behind older buildings.' },
    { f: 'img_8025.jpg', alt: 'A plane passing a gold hotel tower under a blue sky.' },
    { f: 'img_8046.jpg', alt: 'Sunrise over a sea of clouds, from a plane window.' },
    { f: 'img_8405.jpg', alt: 'A forested valley under puffy clouds, framed by trees.' }
  ];

  var img = document.getElementById('photo-img');
  var frame = document.getElementById('photo-frame');
  var blur = document.getElementById('photo-blur');
  var btn = document.getElementById('photo-btn');
  var count = document.getElementById('photo-count');
  if (!img || !btn) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var order = PHOTOS.map(function (_, i) { return i; });
  for (var j = order.length - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var t = order[j]; order[j] = order[k]; order[k] = t;
  }
  var at = 0, token = 0, misses = 0;

  function preload(n) { new Image().src = DIR + PHOTOS[order[n % order.length]].f; }

  function show(n) {
    var p = PHOTOS[order[n]], mine = ++token;
    var next = new Image();
    next.onload = function () {
      if (mine !== token) return;            // a later click won
      misses = 0;
      img.classList.add('is-fading');
      if (blur) blur.classList.add('is-fading');
      setTimeout(function () {
        img.src = next.src; img.alt = p.alt;
        if (blur) blur.style.backgroundImage = 'url(' + next.src + ')';
        img.classList.remove('is-fading');
        if (blur) blur.classList.remove('is-fading');
      }, reduce ? 0 : 180);
    };
    next.onerror = function () {              // skip a missing file, but don't loop forever offline
      if (mine === token && ++misses < order.length) advance();
    };
    next.src = DIR + p.f;
    count.textContent = (n + 1) + ' / ' + order.length;
    preload(n + 1);
  }

  function advance() { at = (at + 1) % order.length; show(at); }

  btn.addEventListener('click', advance);
  if (frame) frame.addEventListener('click', advance);
  show(0);
})();
