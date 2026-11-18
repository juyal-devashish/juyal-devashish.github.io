// Tests for the search palette (Ctrl or ⌘ K), run in CI after tools/check.js:
//   node tools/check-palette.js http://127.0.0.1:3200
// Drives a real browser at a laptop and a phone size from two pages: opening, focus,
// keyboard, ranking, every kind of result, axe with the palette open; and checks that
// every link in /search-index.json lands on a 200 page whose server HTML has the #id.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE = (process.argv[2] || 'http://127.0.0.1:3200').replace(/\/$/, '');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'];
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
  if (via === 'click') await page.click('.nav-search.ready'); else await page.keyboard.press('ControlOrMeta+k');
  await page.waitForSelector('#palette[open] .pal-o');
}
const query = (page, q) => page.fill('.pal-input', q);

// ---------- the index itself (plain fetch: the anchors must exist without JS) ----------
async function checkIndex() {
  const where = 'index';
  const res = await fetch(BASE + '/search-index.json');
  eq(res.status, 200, 'search-index.json status');
  const entries = await res.json();
  const types = new Set(entries.map(e => e.type));
  for (const t of ['action', 'page', 'project', 'role', 'paper', 'photo']) if (!types.has(t)) fail(where, `no "${t}" results at all`);
  const html = new Map();
  const pageHtml = async p => {
    if (!html.has(p)) { const r = await fetch(BASE + p); html.set(p, { status: r.status, text: await r.text() }); }
    return html.get(p);
  };
  for (const e of entries) {
    if (!e.title) fail(where, `${e.id}: missing title`);
    if (!(e.href || e.ext || e.act)) fail(where, `${e.id}: nothing to open`);
    for (const u of [e.href, e.img]) {
      if (!u || !u.startsWith('/')) continue;
      const [p, id] = u.split('#');
      const { status, text } = await pageHtml(p);
      if (status !== 200) { fail(where, `${e.id}: ${p} returns ${status}`); continue; }
      if (id && !text.includes(`id="${id}"`)) fail(where, `${e.id}: ${u} has no element with that id in the server HTML`);
    }
    if (e.href && !/^(\/|mailto:)/.test(e.href)) fail(where, `${e.id}: href ${e.href} is not site-relative`);
  }
  ran++;
  return entries;
}

// ---------- the palette, per page and size ----------
async function run(browser, size, w, h, mobile, start) {
  const where = `${start} ${size}`;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, permissions: ['clipboard-read', 'clipboard-write'] });
  await ctx.route(/https:\/\/(www\.)?linkedin\.com\/.*/, r => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>LinkedIn</title>' }));
  const errors = [];
  const fresh = async (path = start) => {
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(e.message));
    p.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    await p.goto(BASE + path, { waitUntil: 'networkidle' });
    await p.waitForSelector('.nav-search.ready');
    return p;
  };

  await step(where, 'button is there, named and 44px', async () => {
    const p = await fresh();
    const b = await p.$eval('.nav-search', e => { const r = e.getBoundingClientRect(); return { w: r.width, h: r.height, name: e.getAttribute('aria-label'), pop: e.getAttribute('aria-haspopup'), shown: getComputedStyle(e).visibility !== 'hidden' }; });
    ok(b.shown, 'button not visible'); ok(b.w >= 44 && b.h >= 44, `button is ${b.w}x${b.h}`); ok(b.name, 'no accessible name'); eq(b.pop, 'dialog', 'aria-haspopup');
    await p.close();
  });

  await step(where, 'without JS the search button is not shown', async () => {
    const c = await browser.newContext({ javaScriptEnabled: false, viewport: { width: w, height: h } });
    const p = await c.newPage();
    await p.goto(BASE + start);
    const shown = await p.$eval('.nav-search', e => { const r = e.getBoundingClientRect(); return r.width > 0 && getComputedStyle(e).visibility !== 'hidden'; }).catch(() => false);
    ok(!shown, 'search button is visible but cannot work');
    await c.close();
  });

  await step(where, 'opens by button, focuses the input, Esc returns focus', async () => {
    const p = await fresh();
    await openPalette(p, 'click');
    eq(await p.evaluate(() => document.activeElement.className), 'pal-input', 'focused element');
    const a = await p.$eval('.pal-input', e => ({ role: e.getAttribute('role'), exp: e.getAttribute('aria-expanded'), ctl: e.getAttribute('aria-controls') }));
    eq(a.role, 'combobox', 'role'); eq(a.exp, 'true', 'aria-expanded'); eq(a.ctl, 'pal-list', 'aria-controls');
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
    for (const want of ['Email me', 'Copy email address', 'Résumé (PDF)', 'Home', 'Stack']) ok(t.includes(want), `empty state is missing "${want}"`);
    await p.close();
  });

  await step(where, 'axe finds nothing with the palette open (empty and with results), in both themes', async () => {
    for (const scheme of ['dark', 'light']) {
      const p = await fresh();
      await p.emulateMedia({ colorScheme: scheme });
      await openPalette(p, 'click');
      await p.addScriptTag({ content: axeSource });
      const check = () => p.evaluate(async tags => (await axe.run(document, { runOnly: { type: 'tag', values: tags } })).violations.map(v => `${v.id}: ${v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' | ')}`), TAGS);
      const a = await check();
      await query(p, 'sama'); await p.waitForSelector('.pal-o');
      const b = await check();
      const all = [...a, ...b.filter(x => !a.includes(x))];
      ok(!all.length, `axe (${scheme}): ` + all.join('; '));
      await p.close();
    }
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

  await step(where, 'a project result opens its card on /projects', async () => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, 'adjudication');
    await Promise.all([p.waitForURL(/\/projects#adjudication$/), p.keyboard.press('Enter')]);
    await p.waitForFunction(() => document.querySelector('#adjudication [aria-expanded="true"]'));
    ok(!(await p.$('#palette[open]')), 'palette still open');
    await p.close();
  });

  await step(where, 'a résumé result scrolls the row into view, clear of the controls', async () => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, 'micron');
    await Promise.all([p.waitForURL(/\/resume#micron$/), p.keyboard.press('Enter')]);
    await p.waitForFunction(() => { const r = document.getElementById('micron')?.getBoundingClientRect(); return r && r.top >= 0 && r.top < 400; }, null, { timeout: 4000 });
    await p.close();
  });

  await step(where, 'a paper result opens its notes on the stack', async () => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, 'attention');
    await Promise.all([p.waitForURL(/\/stack#attention-is-all-you-need$/), p.keyboard.press('Enter')]);
    await p.waitForSelector('dialog[open] #pd-title');
    eq(await p.$eval('dialog[open] #pd-title', e => e.textContent), 'Attention Is All You Need', 'paper dialog title');
    await p.close();
  });

  await step(where, 'a photo result opens the viewer with its caption', async () => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, 'hollywood');
    await Promise.all([p.waitForURL(/\/photos#img_0510$/), p.keyboard.press('Enter')]);
    await p.waitForSelector('#lightbox[open]');
    await p.waitForFunction(() => document.getElementById('lb-cap').textContent === 'Los Angeles · Mar 2024');
    ok(/img_0510/.test(await p.$eval('#lb-img', e => e.currentSrc || e.src)), 'viewer image');
    await p.keyboard.press('Escape');
    await p.close();
  });

  await step(where, 'Copy email puts the address on the clipboard, then closes', async () => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, 'copy email');
    const email = (await (await fetch(BASE + '/search-index.json')).json()).find(e => e.id === 'copy-email').value;
    eq((await titles(p))[0], 'Copy email address', 'first result');
    await p.keyboard.press('Enter');
    await p.waitForFunction(() => /copied/i.test(document.querySelector('#palette [role=status]').textContent));
    eq(await p.evaluate(() => navigator.clipboard.readText()), email, 'clipboard');
    await p.waitForSelector('#palette:not([open])', { state: 'attached', timeout: 4000 });
    await p.close();
  });

  await step(where, 'an outside link opens in a new tab and leaves this page alone', async () => {
    const p = await fresh(); await openPalette(p, 'key'); await query(p, 'linkedin');
    const [popup] = await Promise.all([ctx.waitForEvent('page'), p.keyboard.press('Enter')]);
    await popup.waitForLoadState();
    ok(/linkedin\.com/.test(popup.url()), `new tab went to ${popup.url()}`);
    eq(new URL(p.url()).pathname, start, 'this page navigated away');
    await popup.close(); await p.close();
  });

  await step(where, 'clicking a result works, and so does the backdrop', async () => {
    const p = await fresh(); await openPalette(p, 'click'); await query(p, 'release gate');
    await Promise.all([p.waitForURL(/\/projects#release-gate$/), p.click('.pal-o')]);
    await p.waitForSelector('.nav-search.ready');
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
      ok(await p.$eval('.pal-preview', e => !!e.offsetParent), 'preview is hidden');
      ok((await p.$eval('.pal-pt', e => e.textContent)).includes('Chicago'), 'preview title does not follow');
      await p.close();
    });
  } else {
    await step(where, 'phone layout: no preview, tall rows, 16px input, no sideways scroll', async () => {
      const p = await fresh(); await openPalette(p, 'click');
      const m = await p.evaluate(() => ({
        preview: !!document.querySelector('.pal-preview')?.offsetParent,
        row: Math.min(...[...document.querySelectorAll('.pal-o')].map(o => o.getBoundingClientRect().height)),
        font: parseFloat(getComputedStyle(document.querySelector('.pal-input')).fontSize),
        over: document.documentElement.scrollWidth > innerWidth,
        dlg: (() => { const r = document.getElementById('palette').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })(),
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
  await checkIndex();
  const browser = await chromium.launch();
  for (const [size, w, h, mobile] of [['laptop-1366x768', 1366, 768, false], ['phone-375x812', 375, 812, true]]) {
    for (const start of ['/', '/stack']) await run(browser, size, w, h, mobile, start);
  }
  await browser.close();
  if (problems.length) { console.error(problems.join('\n')); console.error(`\n${problems.length} problems.`); process.exit(1); }
  console.log(`Palette checks passed (${ran} checks; laptop and phone; from / and /stack; every search-index link resolves).`);
})().catch(e => { console.error(e); process.exit(1); });
