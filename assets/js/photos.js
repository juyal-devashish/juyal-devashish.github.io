/* The photo strip: dawn to night, captioned with place and month.
   It drifts on its own; drag, swipe, scroll or use the arrow keys to move it,
   select a photo to see it larger. With reduced motion it starts still.
   To add a photo: a JPEG 600px tall with metadata stripped in assets/img/photos/,
   then a line below, in time-of-day order. Places are only named when the photo
   was taken within about 10 km of that city. */
(function () {
  'use strict';
  var DIR = 'assets/img/photos/';
  var PHOTOS = [
    { f: 'img_8046.jpg', w: 450,  cap: 'Above the clouds · Jun 2025', alt: 'The horizon glowing over a sea of clouds, from a plane window.' },
    { f: 'img_0510.jpg', w: 900,  cap: 'Los Angeles · Mar 2024',      alt: 'The Hollywood sign on a dry hillside under a clear blue sky.' },
    { f: 'dsc_0295.jpg', w: 903,  cap: 'Valley fog · Jun 2024',       alt: 'Clouds settling into a valley between green hills.' },
    { f: 'img_7541.jpg', w: 450,  cap: 'Chicago · May 2026',          alt: 'A city skyline across a lake under a rippled, cloudy sky.' },
    { f: 'img_4849.jpg', w: 450,  cap: 'In flight · Dec 2024',        alt: 'An airplane wing over a blue sea and scattered clouds.' },
    { f: 'img_5651.jpg', w: 450,  cap: 'Desert road · Mar 2026',      alt: 'A gravel road crossing open, dry hills under a hazy sky.' },
    { f: 'img_1914.jpg', w: 450,  cap: 'Chicago · Nov 2025',          alt: 'A visitor looking at a painting of classical ruins in a museum.' },
    { f: 'img_8405.jpg', w: 450,  cap: 'Forest valley · Jul 2025',    alt: 'A forested valley under puffy clouds, framed by trees.' },
    { f: 'img_7521.jpg', w: 450,  cap: 'Chicago · May 2026',          alt: 'A baseball game seen from the stands of a ballpark.' },
    { f: 'img_3440.jpg', w: 452,  cap: 'Open road',                   alt: 'A wet two-lane road with yellow lines running to the horizon.' },
    { f: 'img_7535.jpg', w: 450,  cap: 'Hilltop · May 2025',          alt: 'Big white clouds over a green valley, seen from a hilltop.' },
    { f: 'img_4466.jpg', w: 450,  cap: 'Ann Arbor · Feb 2026',        alt: 'A packed basketball arena in maize and blue, seen from the upper seats.' },
    { f: 'img_7742.jpg', w: 450,  cap: 'New York City · May 2025',    alt: 'A city street with a tall glass tower rising behind older buildings.' },
    { f: 'img_8025.jpg', w: 800,  cap: 'Las Vegas · Jun 2025',        alt: 'A plane passing a gold hotel tower under a blue sky.' },
    { f: 'img_4316.jpg', w: 800,  cap: 'Ann Arbor · Oct 2024',        alt: 'Red and green autumn trees on a lawn at sunset.' },
    { f: 'img_4967.jpg', w: 450,  cap: 'Los Angeles · Mar 2026',      alt: 'City lights at night, seen from an observatory terrace.' },
    { f: 'img_5342.jpg', w: 450,  cap: 'Desert night sky · Mar 2026', alt: 'A starry night sky over a mountain ridge.' },
    { f: 'img_7344.jpg', w: 450,  cap: 'Sunset · May 2025',           alt: 'A fiery orange sunset over rooftops and trees in silhouette.' },
    { f: 'img_7526.jpg', w: 450,  cap: 'Chicago · May 2026',          alt: 'Skyscrapers lit at night from high above, with a dark lake beyond.' },
    { f: 'img_1364.jpg', w: 450,  cap: 'Detroit · Jul 2026',          alt: 'A city skyline at dusk under a pale violet sky.' },
    { f: 'img_6437.jpg', w: 1067, cap: 'Ann Arbor · Apr 2026',        alt: 'A Gothic building with tall lit windows at night, seen across a lawn.' },
    { f: 'img_6438.jpg', w: 1067, cap: 'Ann Arbor · Apr 2026',        alt: 'Rows of tall arched windows glowing at night.' },
    { f: 'img_3677.jpg', w: 450,  cap: 'New York City · Dec 2025',    alt: 'A city skyline lit up at night across dark water.' },
    { f: 'img_3684.jpg', w: 800,  cap: 'New York City · Dec 2025',    alt: 'A suspension bridge lit at night, with city towers behind it.' },
    { f: 'img_1128.jpg', w: 800,  cap: 'Ann Arbor · Nov 2025',        alt: 'Someone on a porch watching the northern lights over a dark treeline.' }
  ];

  var track = document.getElementById('reel-track');
  var toggle = document.getElementById('reel-toggle');
  var box = document.getElementById('lightbox');
  if (!track) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Two copies so the strip can loop; the copy is hidden from assistive tech and the tab order.
  function set(copy) {
    var ul = document.createElement('ul');
    ul.className = 'reel-set';
    if (copy) ul.setAttribute('aria-hidden', 'true');
    PHOTOS.forEach(function (p, i) {
      var li = document.createElement('li'), fig = document.createElement('figure');
      var b = document.createElement('button'), img = document.createElement('img'), cap = document.createElement('figcaption');
      b.type = 'button'; b.dataset.i = i;
      if (copy) b.tabIndex = -1; else b.setAttribute('aria-label', 'Larger: ' + p.alt);
      img.src = DIR + p.f; img.width = p.w; img.height = 600; img.alt = copy ? '' : p.alt; img.decoding = 'async'; img.draggable = false;
      cap.textContent = p.cap;
      b.appendChild(img); fig.appendChild(b); fig.appendChild(cap); li.appendChild(fig); ul.appendChild(li);
    });
    return ul;
  }

  var built = false, half = 0;
  function build() {
    if (built) return; built = true;
    track.appendChild(set(false)); track.appendChild(set(true));
    requestAnimationFrame(function () { half = track.scrollWidth / 2; });
    if (!still) requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es.some(function (e) { return e.isIntersecting; })) { build(); io.disconnect(); }
    }, { rootMargin: '800px 0px' });
    io.observe(track);
  } else build();

  // Drift: a slow continuous scroll that yields to the visitor.
  var stopped = still, hold = 0, last = 0, pos = 0;
  function wrap() {
    if (!half) half = track.scrollWidth / 2;
    if (track.scrollLeft >= half) track.scrollLeft -= half;
    else if (track.scrollLeft <= 0 && half) track.scrollLeft += half;
  }
  function tick(t) {
    var dt = last ? Math.min(t - last, 64) : 16; last = t;
    if (!stopped && Date.now() > hold && !track.matches(':hover') && !track.contains(document.activeElement)) {
      pos = (pos || track.scrollLeft) + dt * 0.03; track.scrollLeft = pos; wrap(); pos = track.scrollLeft;
    } else pos = track.scrollLeft;
    requestAnimationFrame(tick);
  }
  function pause(ms) { hold = Date.now() + ms; }
  track.addEventListener('scroll', function () { if (Date.now() < hold) wrap(); }, { passive: true });
  track.addEventListener('wheel', function () { pause(2500); }, { passive: true });
  track.addEventListener('touchstart', function () { pause(3000); }, { passive: true });

  // Drag with a mouse (touch already scrolls natively).
  var down = null, moved = false;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse') return;
    down = { x: e.clientX, left: track.scrollLeft }; moved = false; pause(4000);
  });
  window.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - down.x;
    if (Math.abs(dx) > 4) { moved = true; track.classList.add('dragging'); }
    track.scrollLeft = down.left - dx; wrap(); pause(4000);
  });
  window.addEventListener('pointerup', function () { down = null; track.classList.remove('dragging'); });

  // Arrow keys.
  track.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault(); pause(5000);
    track.scrollBy({ left: e.key === 'ArrowRight' ? 320 : -320, behavior: still ? 'auto' : 'smooth' });
  });

  // Larger view.
  track.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-i]');
    if (!b || moved || !box || !box.showModal) { moved = false; return; }
    var p = PHOTOS[+b.dataset.i];
    document.getElementById('lb-img').src = DIR + p.f;
    document.getElementById('lb-img').alt = p.alt;
    document.getElementById('lb-cap').textContent = p.cap;
    box.showModal();
  });
  if (box) box.addEventListener('click', function (e) { if (e.target === box) box.close(); });

  if (toggle) {
    function label() {
      toggle.setAttribute('aria-pressed', String(stopped));
      toggle.textContent = stopped ? 'Let it drift' : 'Stop the strip';
    }
    label();
    toggle.addEventListener('click', function () { stopped = !stopped; label(); });
  }
})();
