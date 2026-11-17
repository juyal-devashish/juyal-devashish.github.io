// Tests for the search palette, run in CI after the site checks:
//   node tools/check-palette.js http://127.0.0.1:8000
// Drives a real browser at a laptop and a phone size on both pages: opening,
// focus, keyboard, ranking, every kind of result, axe with the palette open,
// and that every link in assets/search-index.json lands on something real.
'use strict';
const fs = require('fs');
const { chromium } = require('playwright');
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const BASE = (process.argv[2] || 'http://127.0.0.1:8000').replace(/\/$/, '') + '/';
const EMAIL = 'djuyal23@gmail.com';
const problems = [];
let ran = 0;
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

async function step(where, name, fn) {
  ran++;
  try { await fn(); } catch (e) { fail(where, `${name}: ${String(e.message).split('\n')[0]}`); }
}
const eq = (a, b, what) => { if (a !== b) throw new Error(`${what}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
const ok = (c, what) => { if (!c) throw new Error(what); };

const titles = page => page.$$eval('.pal-o .pal-t', n => n.map(x => x.textContent));
async function openPalette(page, via) {
  if (via === 'click') await page.click('.nav-search'); else await page.keyboard.press('ControlOrMeta+k');
  await page.waitForSelector('#palette[open] .pal-o');
}
async function query(page, q) { await page.fill('.pal-input', q); }

// ---------- the index itself ----------
async function checkIndex() {
  const where = 'index';
  const res = await fetch(BASE + 'assets/search-index.json');
  eq(res.status, 200, 'search-index.json status');
  const entries = await res.json();
  const html = { 'index.html': await (await fetch(BASE + 'index.html')).text(), 'papers.html': await (await fetch(BASE + 'papers.html')).text() };
  const exists = async u => (await fetch(new URL(u, BASE), { method: 'HEAD' })).status === 200;
  const types = new Set(entries.map(e => e.type));
  for (const t of ['action', 'page', 'project', 'role', 'paper', 'photo']) if (!types.has(t)) fail(where, `no "${t}" results at all`);
  for (const e of entries) {
    if (!e.title || !e.blurb) fail(where, `${e.id}: missing title or blurb`);
    if (!(e.href || e.ext || e.act || e.full)) fail(where, `${e.id}: nothing to open`);
    if (e.href && /^(index|papers)\.html#/.test(e.href)) {
      const [pageName, id] = e.href.split('#');
      if (!html[pageName].includes(`id="${id}"`)) fail(where, `${e.id}: ${e.href} has no element with that id`);
    }
    for (const u of [e.img, e.full, e.href && !/^(mailto:|index\.html$|papers\.html$|index\.html#|papers\.html#)/.test(e.href) ? e.href : null]) {
      if (u && !(await exists(u))) fail(where, `${e.id}: ${u} does not load`);
    }
  }
  ran++;
}

// ---------- the palette, per page and size ----------
async function run(browser, size, w, h, mobile, pageName) {
  const where = `${pageName} ${size}`;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.route(/https:\/\/(www\.)?linkedin\.com\/.*/, r => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>LinkedIn</title>' }));
  const errors = [];
  const fresh = async (path = pageName === 'home' ? '' : 'papers.html') => {
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await p.goto(BASE + path, { waitUntil: 'networkidle' });
    return p;
  };
  const start = pageName === 'home' ? '' : 'papers.html';

  await step(where, 'button is there, named and 44px', async () => {
    const p = await fresh();
    const b = await p.$eval('.nav-search', e => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, name: e.getAttribute('aria-label'), pop: e.getAttribute('aria-haspopup'), shown: !!e.offsetParent }; });
    ok(b.shown, 'button not visible'); ok(b.w >= 44 && b.h >= 44, `button is ${b.w}x${b.h}`); ok(b.name, 'no accessible name'); eq(b.pop, 'dialog', 'aria-haspopup');
    await p.close();
  });

  await step(where, 'on a slow connection the search button stays hidden until it works', async () => {
    const slow = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
    await slow.route(/palette\.js/, async r => { await new Promise(x => setTimeout(x, 1500)); await r.continue(); });
    const p = await slow.newPage();
    await p.goto(BASE + start, { waitUntil: 'commit' });
    await p.waitForSelector('.nav-search', { state: 'attached' });
    eq(await p.$eval('.nav-search', e => getComputedStyle(e).visibility), 'hidden', 'button visibility before palette.js has run');
    const box = await p.$eval('.nav-search', e => { const r = e.getBoundingClientRect(); return [r.width, r.height]; });
    ok(box[0] >= 44 && box[1] >= 44, `hidden button gave up its space (${box})`);
    await p.click('.nav-search');                       // waits until it is visible, i.e. until it works
    await p.waitForSelector('#palette[open] .pal-o');
    await slow.close();
  });

  await step(where, 'opens by button, focuses the input, Esc returns focus', async () => {
    const p = await fresh();
    await openPalette(p, 'click');
    eq(await p.evaluate(() => document.activeElement.className), 'pal-input', 'focused element');
    const attrs = await p.$eval('.pal-input', e => ({ role: e.getAttribute('role'), exp: e.getAttribute('aria-expanded'), ctl: e.getAttribute('aria-controls') }));
    eq(attrs.role, 'combobox', 'role'); eq(attrs.exp, 'true', 'aria-expanded'); eq(attrs.ctl, 'pal-list', 'aria-controls');
    await p.keyboard.press('Escape');
    await p.waitForSelector('#palette:not([open])', { state: 'attached' });
    ok(await p.evaluate(() => document.activeElement.classList.contains('nav-search')), 'focus should go back to the search button after Esc');
    await p.close();
  });

  await step(where, 'Ctrl or ⌘ K opens and closes it', async () => {
    const p = await fresh();
    await openPalette(p, 'key');
    await p.keyboard.press('ControlOrMeta+k');
    await p.waitForSelector('#palette:not([open])', { state: 'attached' });
    await p.close();
  });

  await step(where, 'empty state lists actions and places to go', async () => {
    const p = await fresh();
    await openPalette(p, 'key');
    const t = await titles(p);
    for (const want of ['Email me', 'Copy email address', 'Résumé (PDF)', 'Home', 'Reading shelf']) ok(t.includes(want), `empty state is missing "${want}"`);
    await p.close();
  });

  await step(where, 'axe finds nothing with the palette open (empty and with results)', async () => {
    const p = await fresh();
    await openPalette(p, 'click');
    await p.addScriptTag({ content: axeSource });
    const run = () => p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] })).violations.map(v => `${v.id}: ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')}`));
    const a = await run();
    await query(p, 'sama'); await p.waitForSelector('.pal-o');
    const b = await run();
    const all = [...a, ...b.filter(x => !a.includes(x))];
    ok(!all.length, 'axe: ' + all.join('; '));
    await p.close();
  });

  await step(where, 'arrow keys move one selection, wrap, and update the combobox', async () => {
    const p = await fresh();
    await openPalette(p, 'key');
    const state = () => p.evaluate(() => ({ sel: document.querySelectorAll('.pal-o[aria-selected="true"]').length, id: document.querySelector('.pal-input').getAttribute('aria-activedescendant'), selId: (document.querySelector('.pal-o[aria-selected="true"]') || {}).id }));
    let s = await state(); eq(s.sel, 1, 'selected options at start'); eq(s.id, s.selId, 'activedescendant matches');
    const first = s.id;
    await p.keyboard.press('ArrowDown'); s = await state(); ok(s.id !== first, 'ArrowDown did not move'); eq(s.sel, 1, 'selected options after ArrowDown');
    await p.keyboard.press('ArrowUp'); await p.keyboard.press('ArrowUp'); s = await state();
    const last = await p.$$eval('.pal-o', n => n[n.length - 1].id); eq(s.id, last, 'ArrowUp from the first option should wrap to the last');
    await p.close();
  });

  await step(where, 'no results says so', async () => {
    const p = await fresh();
    await openPalette(p, 'key'); await query(p, 'zzzq');
    await p.waitForFunction(() => /No results/.test(document.querySelector('#palette [role=status]').textContent));
    eq((await titles(p)).length, 0, 'options for a nonsense query');
    ok(await p.$('.pal-empty'), 'no empty-state message');
    await p.close();
  });

  const ranksFirst = async (q, want) => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, q);
    const t = await titles(p); await p.close();
    ok(t.length && t[0].toLowerCase().includes(want.toLowerCase()), `"${q}": first result is ${JSON.stringify(t[0])}, wanted ${want}`);
  };
  await step(where, 'ranking: names, accents and keywords', async () => {
    await ranksFirst('sama', 'Sama4');
    await ranksFirst('resume', 'Résumé');
    await ranksFirst('git', 'GitHub');
    await ranksFirst('micron', 'Micron');
    await ranksFirst('attention', 'Attention Is All You Need');
    await ranksFirst('release gate', 'release gate');
  });

  await step(where, 'a project result opens its row', async () => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, 'sama');
    await Promise.all([p.waitForFunction(() => /#sama4$/.test(location.hash)), p.keyboard.press('Enter')]);
    await p.waitForFunction(() => document.getElementById('sama4').classList.contains('open'));
    ok(!(await p.$('#palette[open]')), 'palette still open');
    await p.close();
  });

  await step(where, 'a background result scrolls the row into view, clear of the nav', async () => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, 'micron');
    await Promise.all([p.waitForFunction(() => location.hash === '#micron'), p.keyboard.press('Enter')]);
    await p.waitForTimeout(500);
    const top = await p.evaluate(() => document.getElementById('micron').getBoundingClientRect().top);
    ok(top >= 55 && top < 400, `row top is at ${Math.round(top)}px`);
    await p.close();
  });

  await step(where, 'a paper result opens its note on the shelf', async () => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, 'attention');
    await Promise.all([p.waitForURL(/papers\.html#attention-is-all-you-need/), p.keyboard.press('Enter')]);
    await p.waitForSelector('#paper-dialog[open]');
    eq(await p.$eval('#pd-title', e => e.textContent), 'Attention Is All You Need', 'paper dialog title');
    await p.close();
  });

  await step(where, 'a photo result opens the viewer with its caption', async () => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, 'hollywood');
    await p.keyboard.press('Enter');
    await p.waitForSelector('#lightbox[open]');
    eq(await p.$eval('#lb-cap', e => e.textContent), 'Los Angeles · Mar 2024', 'viewer caption');
    ok(/img_0510/.test(await p.$eval('#lb-img', e => e.src)), 'viewer image');
    await p.keyboard.press('Escape');
    await p.close();
  });

  await step(where, 'an archive photo opens the full-size file', async () => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, 'diploma');
    await p.keyboard.press('Enter'); await p.waitForSelector('#lightbox[open]');
    ok(/ms-diploma\.jpg/.test(await p.$eval('#lb-img', e => e.src)), 'viewer image');
    await p.close();
  });

  await step(where, 'Copy email puts the address on the clipboard, then closes', async () => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, 'copy email');
    eq((await titles(p))[0], 'Copy email address', 'first result');
    await p.keyboard.press('Enter');
    await p.waitForFunction(() => /copied/i.test(document.querySelector('#palette [role=status]').textContent));
    eq(await p.evaluate(() => navigator.clipboard.readText()), EMAIL, 'clipboard');
    await p.waitForSelector('#palette:not([open])', { state: 'attached', timeout: 4000 });
    await p.close();
  });

  await step(where, 'an outside link opens in a new tab and leaves this page alone', async () => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, 'linkedin');
    const [popup] = await Promise.all([ctx.waitForEvent('page'), p.keyboard.press('Enter')]);
    await popup.waitForLoadState();
    ok(/linkedin\.com/.test(popup.url()), `new tab went to ${popup.url()}`);
    ok(new URL(p.url()).origin === new URL(BASE).origin, 'this page navigated away');
    await popup.close(); await p.close();
  });

  await step(where, 'a section result jumps there', async () => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, 'fun stuff');
    eq((await titles(p))[0], 'Fun stuff', 'first result');
    await Promise.all([p.waitForFunction(() => /#fun$/.test(location.hash)), p.keyboard.press('Enter')]);
    await p.close();
  });

  await step(where, 'clicking a result works, and so does the backdrop', async () => {
    const p = await fresh(); await openPalette(p, 'click'); await query(p, 'inline');
    await p.click('.pal-o');
    await Promise.all([p.waitForFunction(() => /#inline$/.test(location.hash))]);
    await openPalette(p, 'click');
    await p.mouse.click(w - 4, h - 4);
    await p.waitForSelector('#palette:not([open])', { state: 'attached' });
    await p.close();
  });

  if (!mobile) {
    await step(where, 'the preview follows the selection', async () => {
      const p = await fresh(); await openPalette(p, 'key'); await query(p, 'sama');
      eq(await p.$eval('.pal-pt', e => e.textContent), 'Sama4', 'preview title');
      await query(p, 'chicago'); await p.waitForSelector('.pal-pimg');
      const first = await p.$eval('.pal-pt', e => e.textContent);
      await p.keyboard.press('ArrowDown');
      ok(await p.$eval('.pal-preview', e => !!e.offsetParent), 'preview is hidden');
      ok(first.includes('Chicago'), `preview title is ${first}`);
      await p.close();
    });
  } else {
    await step(where, 'phone layout: no preview, tall rows, 16px input, no sideways scroll', async () => {
      const p = await fresh(); await openPalette(p, 'click');
      const m = await p.evaluate(() => ({
        preview: !!document.querySelector('.pal-preview').offsetParent,
        row: Math.min(...[...document.querySelectorAll('.pal-o')].map(o => o.getBoundingClientRect().height)),
        font: parseFloat(getComputedStyle(document.querySelector('.pal-input')).fontSize),
        over: document.documentElement.scrollWidth > innerWidth,
        dlg: (() => { const r = document.getElementById('palette').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })()
      }));
      ok(!m.preview, 'preview pane should be hidden on phones'); ok(m.row >= 44, `rows are ${m.row}px`); ok(m.font >= 16, `input is ${m.font}px (iOS zooms below 16)`);
      ok(!m.over, 'page scrolls sideways'); ok(m.dlg, 'palette is wider than the screen');
      await p.close();
    });
  }

  await step(where, 'no script or console errors', async () => { ok(!errors.length, errors.slice(0, 3).join(' | ')); });
  await ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  await checkIndex();
  for (const [size, w, h, mobile] of [['laptop-1366x768', 1366, 768, false], ['phone-375x812', 375, 812, true]]) {
    for (const pageName of ['home', 'papers']) await run(browser, size, w, h, mobile, pageName);
  }
  await browser.close();
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  console.log(`Palette checks passed (${ran} checks, laptop and phone, home and papers).`);
})().catch(e => { console.error(e); process.exit(1); });
