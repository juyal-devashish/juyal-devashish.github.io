/* The search palette. Press Ctrl K (⌘K on a Mac) or use the magnifier in the nav.
   It searches everything on the site from one list, assets/search-index.json,
   which tools/build.js builds from the pages themselves. Arrow keys move, Enter
   opens, Ctrl or ⌘ Enter opens in a new tab, Esc closes. Without script the
   button never appears and the site works exactly as before. */
(function () {
  'use strict';
  var btn = document.querySelector('.nav-search');
  if (!btn) return;
  if (typeof HTMLDialogElement !== 'function' || !window.fetch) { btn.style.display = 'none'; return; }

  var INDEX_URL = 'assets/search-index.json';
  var GROUPS = [['action', 'Actions'], ['page', 'Go to'], ['project', 'Projects'], ['role', 'Work and background'], ['paper', 'Reading shelf'], ['photo', 'Photos']];
  var TYPE_BONUS = { action: 4, page: 3, project: 2, role: 1, paper: 0, photo: 0 };
  var MAX = 12;
  var KEY = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '') ? '⌘K' : 'Ctrl K';
  btn.title = 'Search (' + KEY + ')';

  var dlg, input, list, preview, status, closeBtn;
  var entries = null, loading = null, failed = false;
  var results = [], active = -1, opener = null, built = false, statusTimer = 0, copyTimer = 0;

  function el(tag, cls, txt) { var n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; }
  function attrs(n, o) { Object.keys(o).forEach(function (k) { n.setAttribute(k, o[k]); }); return n; }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  // Search works on text with accents and case removed, remembering where each
  // folded character came from so matches can be highlighted in the real title.
  function fold(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function foldMap(s) {
    var out = '', map = [];
    for (var i = 0; i < s.length; i++) { var f = fold(s.charAt(i)); for (var j = 0; j < f.length; j++) { out += f.charAt(j); map.push(i); } }
    return { out: out, map: map };
  }

  function load() {
    if (loading) return loading;
    loading = fetch(INDEX_URL).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (list) {
      list.forEach(function (e) {
        var t = foldMap(e.title);
        e._t = t.out; e._m = t.map;
        e._k = fold(e.kw) + ' ' + fold(e.meta);
        e._x = fold(e.blurb) + ' ' + fold(e.text);
      });
      entries = list;
    }).catch(function () { failed = true; });
    return loading;
  }

  // ---------- ranking ----------
  function scoreEntry(e, toks, res, full) {
    var s = 0;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], p = e._t.indexOf(t), sc;
      if (p === 0) sc = 100;
      else if (p > 0 && res[i].test(e._t)) sc = 80;
      else if (p > 0) sc = 50;
      else if (e._k.indexOf(t) > -1) sc = 30;
      else if (t.length > 2 && e._x.indexOf(t) > -1) sc = 10;
      else return -1;
      s += sc;
    }
    if (e._t === full) s += 200;
    return s + TYPE_BONUS[e.type];
  }
  function rank(q) {
    var full = fold(q).trim(), toks = full.split(/\s+/).filter(Boolean);
    if (!toks.length) return entries.filter(function (e) { return e.type === 'action' || e.type === 'page'; });
    var res = toks.map(function (t) { return new RegExp('(^|[^a-z0-9])' + escRe(t)); });
    var out = [];
    entries.forEach(function (e, i) { var s = scoreEntry(e, toks, res, full); if (s >= 0) out.push({ e: e, s: s, i: i }); });
    out.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
    return out.slice(0, MAX).map(function (r) { return r.e; });
  }

  // ---------- drawing ----------
  function marked(node, e, toks) {
    var r = [];
    toks.forEach(function (t) {
      var i = e._t.indexOf(t);
      while (i > -1) { r.push([e._m[i], e._m[i + t.length - 1] + 1]); i = e._t.indexOf(t, i + t.length); }
    });
    if (!r.length) { node.textContent = e.title; return; }
    r.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [r[0]];
    r.slice(1).forEach(function (x) { var l = merged[merged.length - 1]; if (x[0] <= l[1]) l[1] = Math.max(l[1], x[1]); else merged.push(x); });
    var at = 0;
    merged.forEach(function (m) {
      if (m[0] > at) node.appendChild(document.createTextNode(e.title.slice(at, m[0])));
      node.appendChild(el('mark', '', e.title.slice(m[0], m[1]))); at = m[1];
    });
    if (at < e.title.length) node.appendChild(document.createTextNode(e.title.slice(at)));
  }

  function render() {
    var q = input.value.trim(), toks = fold(q).split(/\s+/).filter(Boolean);
    list.textContent = ''; active = -1;
    if (failed) { list.appendChild(el('p', 'pal-empty', 'Search isn’t available right now. The menu at the top still works.')); results = []; setPreview(null); say('Search is unavailable'); return; }
    if (!entries) { list.appendChild(el('p', 'pal-empty', 'Loading…')); results = []; setPreview(null); return; }
    results = rank(q);
    if (!results.length) {
      list.appendChild(el('p', 'pal-empty', 'Nothing matches “' + q + '”. Try a project, a paper, a place or a year.'));
      say('No results'); setPreview(null); return;
    }
    var n = 0;
    GROUPS.forEach(function (g) {
      var items = results.filter(function (e) { return e.type === g[0]; });
      if (!items.length) return;
      var grp = attrs(el('div', 'pal-g'), { role: 'group', 'aria-label': g[1] });
      grp.appendChild(attrs(el('div', 'pal-gh', g[1]), { 'aria-hidden': 'true' }));
      items.forEach(function (e) {
        var o = attrs(el('div', 'pal-o'), { role: 'option', id: 'pal-o-' + n, 'aria-selected': 'false' });
        o.setAttribute('data-n', String(n)); e._n = n; n++;
        var t = el('span', 'pal-t'); marked(t, e, toks); o.appendChild(t);
        // Photos share captions, so their row shows what's in the picture instead.
        var m = el('span', 'pal-m', e.type === 'photo' ? e.blurb : (!e.href && e.ext ? e.meta + ' ↗' : e.meta)); o.appendChild(m);
        grp.appendChild(o);
      });
      list.appendChild(grp);
    });
    // Results come back in score order; keep keyboard order the same as the screen order.
    results = GROUPS.reduce(function (a, g) { return a.concat(results.filter(function (e) { return e.type === g[0]; })); }, []);
    setActive(0, false);
    say(results.length + (results.length === 1 ? ' result' : ' results'));
  }

  function setActive(i, scroll) {
    var opts = list.querySelectorAll('.pal-o');
    if (!opts.length) { active = -1; input.removeAttribute('aria-activedescendant'); return; }
    active = (i + opts.length) % opts.length;
    [].forEach.call(opts, function (o, k) { o.setAttribute('aria-selected', k === active ? 'true' : 'false'); });
    var cur = opts[active];
    input.setAttribute('aria-activedescendant', cur.id);
    if (scroll !== false) cur.scrollIntoView({ block: 'nearest' });
    setPreview(results[active]);
  }

  function hint(e) {
    if (e.act === 'copy-email') return 'Enter copies it';
    if (e.full) return 'Enter shows it larger';
    if (!e.href && e.ext) return 'Enter opens it in a new tab ↗';
    return 'Enter goes there · ' + (/Mac/.test(navigator.platform || '') ? '⌘' : 'Ctrl') + ' Enter opens a new tab';
  }
  function setPreview(e) {
    preview.textContent = '';
    if (!e) return;
    if (e.img) { var im = attrs(el('img', 'pal-pimg'), { alt: '', src: e.img, decoding: 'async' }); preview.appendChild(im); }
    preview.appendChild(el('p', 'pal-pt', e.title));
    preview.appendChild(el('p', 'pal-pm', e.meta));
    preview.appendChild(el('p', 'pal-pb', e.blurb));
    var links = e.links || (e.href && e.ext ? [{ label: 'Read the paper', href: e.ext }] : []);
    if (links.length) {
      var l = el('p', 'pal-pl');
      links.forEach(function (x) { l.appendChild(attrs(el('a', '', x.label + ' ↗'), { href: x.href, target: '_blank', rel: 'noopener', tabindex: '-1' })); });
      preview.appendChild(l);
    }
    preview.appendChild(el('p', 'pal-ph', hint(e)));
  }
  function say(msg) { clearTimeout(statusTimer); statusTimer = setTimeout(function () { status.textContent = msg; }, 250); }

  // ---------- doing things ----------
  function same(path) { return path.replace(/index\.html$/, ''); }
  function go(href) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(href)) { location.href = href; return; }
    var u = new URL(href, location.href);
    if (same(u.pathname) === same(location.pathname)) {
      if (u.hash && u.hash !== location.hash) location.hash = u.hash;
      else if (u.hash) { window.dispatchEvent(new Event('hashchange')); var t = document.getElementById(u.hash.slice(1)); if (t) t.scrollIntoView(); }
      else window.scrollTo(0, 0);
    } else location.href = u.href;
  }
  function lightbox() {
    var box = document.getElementById('lightbox');
    if (box) return box;
    box = attrs(el('dialog', 'lightbox'), { id: 'lightbox', 'aria-label': 'Photo' });
    var fig = el('figure'); fig.appendChild(attrs(el('img'), { id: 'lb-img', alt: '' })); fig.appendChild(attrs(el('figcaption'), { id: 'lb-cap' }));
    var form = attrs(el('form'), { method: 'dialog' }); form.appendChild(attrs(el('button', 'lb-close', 'Close'), { type: 'submit' }));
    box.appendChild(fig); box.appendChild(form);
    box.addEventListener('click', function (ev) { if (ev.target === box) box.close(); });
    document.body.appendChild(box);
    return box;
  }
  function showPhoto(e) {
    var box = lightbox();
    var img = document.getElementById('lb-img'); img.src = e.full; img.alt = e.blurb;
    document.getElementById('lb-cap').textContent = e.title;
    box.addEventListener('close', function () { if (document.activeElement === document.body) btn.focus(); }, { once: true });
    box.showModal();
  }
  function activate(e, newTab) {
    if (e.act === 'copy-email') {
      Site.copy(e.value, function (ok) {
        var m = list.querySelector('.pal-o[aria-selected="true"] .pal-m');
        if (m) m.textContent = ok ? 'Copied' : 'Couldn’t copy';
        clearTimeout(statusTimer); status.textContent = ok ? 'Email address copied' : 'Could not copy';
        clearTimeout(copyTimer); copyTimer = setTimeout(function () { dlg.close(); }, ok ? 700 : 1500);
      });
      return;
    }
    if (e.full) { dlg.close(); showPhoto(e); return; }
    if (!e.href && e.ext) { window.open(e.ext, '_blank', 'noopener'); dlg.close(); return; }
    if (newTab && !/^mailto:/.test(e.href)) { window.open(new URL(e.href, location.href).href, '_blank', 'noopener'); dlg.close(); return; }
    dlg.close(); go(e.href);
  }

  // ---------- the dialog ----------
  function build() {
    if (built) return; built = true;
    dlg = attrs(el('dialog', 'palette'), { id: 'palette', 'aria-label': 'Search the site' });
    var head = el('div', 'pal-head');
    head.innerHTML = '<svg class="pal-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
    input = attrs(el('input', 'pal-input'), {
      type: 'text', role: 'combobox', 'aria-label': 'Search projects, papers, photos and more', 'aria-expanded': 'true', 'aria-controls': 'pal-list',
      'aria-autocomplete': 'list', placeholder: 'Search projects, papers, photos…', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'go'
    });
    closeBtn = attrs(el('button', 'pal-x', 'Esc'), { type: 'button', 'aria-label': 'Close search' });
    head.appendChild(input); head.appendChild(closeBtn);
    var body = el('div', 'pal-body');
    list = attrs(el('div', 'pal-results'), { id: 'pal-list', role: 'listbox', 'aria-label': 'Results' });
    preview = attrs(el('aside', 'pal-preview'), { 'aria-hidden': 'true' });
    body.appendChild(list); body.appendChild(preview);
    var foot = el('div', 'pal-foot');
    foot.appendChild(el('span', '', '↑ ↓ to move'));
    foot.appendChild(el('span', '', 'Enter to open'));
    foot.appendChild(el('span', '', 'Esc to close'));
    status = attrs(el('span', 'visually-hidden'), { role: 'status' });
    foot.appendChild(status);
    dlg.appendChild(head); dlg.appendChild(body); dlg.appendChild(foot);
    document.body.appendChild(dlg);

    input.addEventListener('input', render);
    input.addEventListener('keydown', function (ev) {
      if (ev.isComposing) return;
      if (ev.key === 'ArrowDown') { ev.preventDefault(); setActive(active + 1); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); setActive(active - 1); }
      else if (ev.key === 'Enter') { ev.preventDefault(); if (results[active]) activate(results[active], ev.metaKey || ev.ctrlKey); }
    });
    list.addEventListener('pointermove', function (ev) {
      var o = ev.target.closest && ev.target.closest('.pal-o');
      if (o && +o.getAttribute('data-n') !== active) setActive(+o.getAttribute('data-n'), false);
    });
    list.addEventListener('click', function (ev) {
      var o = ev.target.closest && ev.target.closest('.pal-o');
      if (o && results[+o.getAttribute('data-n')]) activate(results[+o.getAttribute('data-n')], ev.metaKey || ev.ctrlKey);
    });
    closeBtn.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (ev) { if (ev.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () {
      clearTimeout(copyTimer); clearTimeout(statusTimer); status.textContent = '';
      if (opener && document.contains(opener) && (document.activeElement === document.body || document.activeElement === null)) opener.focus();
    });
  }

  function open() {
    if (dlg && dlg.open) return;
    build();
    opener = document.activeElement;
    input.value = ''; render();
    dlg.showModal(); input.focus();
    load().then(render);
  }

  btn.addEventListener('click', open);
  btn.addEventListener('pointerenter', load);
  btn.addEventListener('focus', load);
  document.addEventListener('keydown', function (ev) {
    if ((ev.metaKey || ev.ctrlKey) && !ev.altKey && !ev.shiftKey && (ev.key === 'k' || ev.key === 'K')) {
      ev.preventDefault();
      if (dlg && dlg.open) dlg.close(); else open();
    }
  });
})();
