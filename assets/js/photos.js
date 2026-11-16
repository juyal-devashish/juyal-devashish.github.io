/* Fun stuff: a strip of photos that drifts sideways on its own.
   To add a photo, put a JPEG 600px tall, with metadata stripped, in
   assets/img/photos/ and add a line here with its width. */
(function () {
  'use strict';
  var DIR = 'assets/img/photos/';
  var PHOTOS = [
    { f: 'dsc_0295.jpg', w: 903,  alt: 'Clouds settling into a valley between green hills.' },
    { f: 'img_0510.jpg', w: 900,  alt: 'The Hollywood sign on a dry hillside under a clear blue sky.' },
    { f: 'img_1128.jpg', w: 800,  alt: 'Someone on a porch watching the northern lights over a dark treeline.' },
    { f: 'img_1364.jpg', w: 450,  alt: 'A city skyline at dusk under a pale violet sky.' },
    { f: 'img_1914.jpg', w: 450,  alt: 'A visitor looking at a painting of classical ruins in a museum.' },
    { f: 'img_3440.jpg', w: 452,  alt: 'A wet two-lane road with yellow lines running to the horizon.' },
    { f: 'img_3677.jpg', w: 450,  alt: 'A city skyline lit up at night across dark water.' },
    { f: 'img_3684.jpg', w: 800,  alt: 'A suspension bridge lit at night, with city towers behind it.' },
    { f: 'img_4316.jpg', w: 800,  alt: 'Red and green autumn trees on a lawn at sunset.' },
    { f: 'img_4466.jpg', w: 450,  alt: 'A packed basketball arena in maize and blue, seen from the upper seats.' },
    { f: 'img_4849.jpg', w: 450,  alt: 'An airplane wing over a blue sea and scattered clouds.' },
    { f: 'img_4967.jpg', w: 450,  alt: 'City lights at night, seen from an observatory terrace.' },
    { f: 'img_5342.jpg', w: 450,  alt: 'A starry night sky over a mountain ridge.' },
    { f: 'img_5651.jpg', w: 450,  alt: 'A gravel road crossing open, dry hills under a hazy sky.' },
    { f: 'img_6437.jpg', w: 1067, alt: 'A Gothic building with tall lit windows at night, seen across a lawn.' },
    { f: 'img_6438.jpg', w: 1067, alt: 'Rows of tall arched windows glowing at night.' },
    { f: 'img_7344.jpg', w: 450,  alt: 'A fiery orange sunset over rooftops and trees in silhouette.' },
    { f: 'img_7521.jpg', w: 450,  alt: 'A baseball game seen from the stands of a ballpark.' },
    { f: 'img_7526.jpg', w: 450,  alt: 'Skyscrapers lit at night from high above, with a dark lake beyond.' },
    { f: 'img_7535.jpg', w: 450,  alt: 'Big white clouds over a green valley, seen from a hilltop.' },
    { f: 'img_7541.jpg', w: 450,  alt: 'A city skyline across a lake under a rippled, cloudy sky.' },
    { f: 'img_7742.jpg', w: 450,  alt: 'A city street with a tall glass tower rising behind older buildings.' },
    { f: 'img_8025.jpg', w: 800,  alt: 'A plane passing a gold hotel tower under a blue sky.' },
    { f: 'img_8046.jpg', w: 450,  alt: 'Sunrise over a sea of clouds, from a plane window.' },
    { f: 'img_8405.jpg', w: 450,  alt: 'A forested valley under puffy clouds, framed by trees.' }
  ];

  var track = document.getElementById('reel-track');
  var toggle = document.getElementById('reel-toggle');
  if (!track) return;

  // A fresh order on every visit.
  var list = PHOTOS.slice();
  for (var i = list.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1)), t = list[i]; list[i] = list[j]; list[j] = t;
  }

  // The set is drawn twice so the strip can loop; the copy is hidden from screen readers.
  function set(copy) {
    var ul = document.createElement('ul');
    ul.className = 'reel-set';
    if (copy) ul.setAttribute('aria-hidden', 'true');
    list.forEach(function (p) {
      var li = document.createElement('li');
      var img = document.createElement('img');
      img.src = DIR + p.f; img.width = p.w; img.height = 600;
      img.alt = copy ? '' : p.alt; img.decoding = 'async';
      li.appendChild(img); ul.appendChild(li);
    });
    return ul;
  }
  // Build the strip only when it is about to scroll into view, so the photos
  // don't compete with the hero. (Native lazy loading misses images that slide
  // in sideways, which would show as blank frames.)
  function build() {
    if (track.childElementCount) return;
    track.appendChild(set(false));
    track.appendChild(set(true));
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { build(); io.disconnect(); }
    }, { rootMargin: '800px 0px' });
    io.observe(track);
  } else {
    build();
  }

  // Moving content needs a way to stop it (WCAG 2.2.2).
  if (toggle) toggle.addEventListener('click', function () {
    var paused = track.classList.toggle('is-paused');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.querySelector('span').textContent = paused ? 'Play' : 'Pause';
  });
})();
