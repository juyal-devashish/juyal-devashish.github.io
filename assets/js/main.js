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

  // The local time in New York, in the footer.
  var stamp = document.querySelector('.local-time');
  if (stamp && window.Intl && Intl.DateTimeFormat) {
    var fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
    var clock = stamp.querySelector('time');
    var tick = function () { clock.textContent = fmt.format(new Date()); };
    tick(); stamp.hidden = false; setInterval(tick, 30000);
  }

  // Copying to the clipboard, shared by the footer button and the search palette.
  var Site = window.Site = window.Site || {};
  Site.copy = function (value, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () { done(true); }, function () { done(false); });
      return;
    }
    try {
      var ta = document.createElement('textarea');
      ta.value = value; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select();
      var ok = document.execCommand('copy'); document.body.removeChild(ta); done(ok);
    } catch (e) { done(false); }
  };

  // Copy my email address.
  var copy = document.querySelector('.copy');
  if (copy) {
    var status = document.getElementById('copy-status');
    copy.hidden = false;
    copy.addEventListener('click', function () {
      Site.copy(copy.getAttribute('data-copy'), function (ok) {
        copy.textContent = ok ? 'Copied' : 'Couldn’t copy';
        if (status) status.textContent = ok ? 'Email address copied' : 'Could not copy. The address is on the button beside it.';
        setTimeout(function () { copy.textContent = 'Copy email'; if (status) status.textContent = ''; }, 2000);
      });
    });
  }

  // Alt+1 to 4 jump between sections (Alt, so it never fires while typing a letter or number).
  var go = { Digit1: '#work', Digit2: '#projects', Digit3: '#fun', Digit4: 'papers.html' };
  document.addEventListener('keydown', function (e) {
    if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !go[e.code]) return;
    var t = e.target;
    if (t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable)) return;
    e.preventDefault();
    var dest = go[e.code];
    if (dest.charAt(0) === '#') { if (hero) location.hash = dest; else location.href = 'index.html' + dest; }
    else if (!/papers\.html$/.test(location.pathname)) location.href = dest;
  });
})();
