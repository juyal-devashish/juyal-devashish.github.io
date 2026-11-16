/* The Sama4 demo clip: a 10-second silent loop. It plays only while it is on
   screen, never for people who have asked their system to reduce motion (they
   see the poster and can press Play), and the button pauses it for everyone.
   Without JS the poster stands in for it. */
(function () {
  'use strict';
  var v = document.getElementById('sama4-clip');
  var btn = v && v.parentNode.querySelector('.p-play');
  if (!v || !btn || !v.play) return;
  var label = btn.querySelector('span');
  var still = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var chosen = null; // the visitor's own Play/Pause choice; null follows the motion setting
  var seen = !('IntersectionObserver' in window);

  function wanted() { return chosen !== null ? chosen : !still.matches; }
  function sync() {
    var on = wanted();
    btn.classList.toggle('is-playing', on);
    label.textContent = on ? 'Pause the demo' : 'Play the demo';
    if (on && seen) {
      var p = v.play();
      // Autoplay can be refused (battery saver, data saver): show Play instead of failing.
      if (p && p.catch) p.catch(function (e) { if (e && e.name === 'NotAllowedError') { chosen = false; sync(); } });
    } else if (!v.paused) {
      v.pause();
    }
  }

  btn.hidden = false;
  btn.addEventListener('click', function (e) { e.stopPropagation(); chosen = !wanted(); sync(); });
  var onChange = function () { chosen = null; sync(); };
  if (still.addEventListener) still.addEventListener('change', onChange); else if (still.addListener) still.addListener(onChange);
  if (!seen) {
    new IntersectionObserver(function (es) { seen = es[es.length - 1].isIntersecting; sync(); }, { rootMargin: '200px 0px' }).observe(v);
  }
  sync();
})();
