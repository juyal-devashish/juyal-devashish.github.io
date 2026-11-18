// Site checks, run in CI on every push (and locally against a production build):
//   npx next build && npx next start -p 3200
//   node tools/check.js http://127.0.0.1:3200 [screenshot-dir]
// Fails on: any axe violation (both themes, phone 375x812 and laptop 1366x768), a control
// under 44px tall or 24px wide outside running text, sideways scroll at any of 12 sizes,
// not exactly one h1, script errors, or a text route with the wrong status or content type.
// Writes full-page screenshots of every page at the 12 sizes.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE = (process.argv[2] || 'http://127.0.0.1:3200').replace(/\/$/, '');
const SHOTS = process.argv[3] || 'screenshots';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'];
const SIZES = [
  ['phone-360x800', 360, 800, true], ['phone-375x812', 375, 812, true], ['phone-390x844', 390, 844, true], ['phone-430x932', 430, 932, true],
  ['tablet-768x1024', 768, 1024, true], ['tablet-820x1180', 820, 1180, true],
  ['laptop-1280x800', 1280, 800, false], ['laptop-1366x768', 1366, 768, false], ['laptop-1440x900', 1440, 900, false], ['laptop-1536x864', 1536, 864, false],
  ['desktop-1920x1080', 1920, 1080, false], ['desktop-2560x1440', 2560, 1440, false],
];
const AUDITED = new Set(['phone-375x812', 'laptop-1366x768']);
const problems = [];
const fail = (where, msg) => { problems.push(`${where}: ${msg}`); };

// ---------- text routes ----------
async function checkRoutes() {
  const index = await (await fetch(BASE + '/search-index.json')).json();
  const yearHref = index.find(e => e.id === 'go-year')?.href;
  if (!yearHref) fail('search-index', 'no go-year entry');
  const llms = await (await fetch(BASE + '/llms.txt')).text();
  // Every markdown copy llms.txt lists, mapped from the site URL onto this server.
  const mds = [...llms.matchAll(/\]\((https?:\/\/[^)]+?\.md)\)/g)].map(m => new URL(m[1]).pathname);
  if (mds.length < 7) fail('llms.txt', `lists only ${mds.length} markdown copies`);
  const routes = [
    ...mds.map(p => [p, 'text/markdown', /^# /]),
    ['/llms.txt', 'text/plain', /^# /],
    ['/rss.xml', 'application/rss+xml', /<rss[\s>]/],
    ['/sitemap.xml', 'application/xml', /<urlset/],
    ['/robots.txt', 'text/plain', /Sitemap:/i],
    ['/search-index.json', 'application/json', /^\[/],
    ['/manifest-check-not-a-route.md', null, null],
    // /uses exists only while lib/site.ts lists something under uses (then llms.txt links /uses.md).
    ...(mds.includes('/uses.md') ? [['/uses', 'text/html', /<h1/]] : [['/uses', null, null], ['/uses.md', null, null]]),
  ];
  for (const [p, type, body] of routes) {
    const res = await fetch(BASE + p);
    const text = await res.text();
    if (type === null) { if (res.status !== 404) fail(p, `expected 404, got ${res.status}`); continue; }
    if (res.status !== 200) { fail(p, `HTTP ${res.status}`); continue; }
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith(type)) fail(p, `content type ${ct}, wanted ${type}`);
    if (!body.test(text)) fail(p, `unexpected body: ${JSON.stringify(text.slice(0, 60))}`);
  }
  // Old GitHub Pages URLs redirect.
  for (const [from, to] of [['/index.html', '/'], ['/papers.html', '/stack'], ['/papers.md', '/stack.md'], ['/shelf', '/stack']]) {
    const res = await fetch(BASE + from, { redirect: 'manual' });
    const loc = res.headers.get('location') || '';
    if (![301, 308].includes(res.status) || new URL(loc, BASE).pathname !== to) fail(from, `redirect ${res.status} → ${loc}, wanted ${to}`);
  }
  return { yearHref, usesListed: mds.includes('/uses.md') };
}

// ---------- pages ----------
async function audit(page, where) {
  await page.addScriptTag({ content: axeSource });
  const violations = await page.evaluate(async tags => (await axe.run(document, { runOnly: { type: 'tag', values: tags } })).violations
    .map(v => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`), TAGS);
  violations.forEach(v => fail(where, `axe ${v}`));
  // Controls outside running text: plain links inside paragraphs, list items and post bodies are exempt.
  const small = await page.evaluate(() => [...document.querySelectorAll('a[href], button, input, select, textarea, summary, [role=button], [role=option], [tabindex="0"]')]
    .filter(e => {
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height || getComputedStyle(e).visibility === 'hidden' || e.closest('[aria-hidden="true"], [inert]')) return false;
      if (e.tagName === 'A' && !e.className && e.closest('p, li, dd, td, .prose')) return false;
      return r.height < 44 || r.width < 24;
    })
    .map(e => { const r = e.getBoundingClientRect(); return `${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`; }));
  small.forEach(x => fail(where, `tap target ${x}`));
}

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  // Scroll through so lazy images load, then back to the top.
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); } scrollTo(0, 0); });
  await page.evaluate(() => Promise.all([...document.images].filter(i => i.offsetParent && i.loading !== 'lazy').map(i => (i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })))));
}

async function run() {
  const { yearHref, usesListed } = await checkRoutes();
  const PAGES = [['home', '/'], ['projects', '/projects'], ['stack', '/stack'], ['resume', '/resume'], ['photos', '/photos'], ['now', '/now'], ['cmd', '/cmd'], ['year', yearHref || '/2026'], ['not-found', '/this-page-does-not-exist', 404], ['post-not-found', '/writing/does-not-exist', 404], ...(usesListed ? [['uses', '/uses']] : [['uses-empty', '/uses', 404]])];
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const bg = {};
  for (const scheme of ['dark', 'light']) {
    for (const [size, w, h, mobile] of SIZES) {
      // Every size in dark; light only at the two audited sizes (axe + targets + overflow).
      if (scheme === 'light' && !AUDITED.has(size)) continue;
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile && w < 700, hasTouch: mobile, colorScheme: scheme });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error' && !/status of 404/.test(m.text())) errors.push(m.text()); });
      for (const [name, url, status = 200] of PAGES) {
        const where = `${name} ${scheme} ${size}`;
        errors.length = 0;
        const res = await page.goto(BASE + url, { waitUntil: 'load' });
        // Next's router can leave a background prefetch open on a 404 page, so idle is best effort.
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
        if (!res || res.status() !== status) fail(where, `HTTP ${res && res.status()}, wanted ${status}`);
        await settle(page);
        const h1 = await page.locator('h1').count();
        if (h1 !== 1) fail(where, `${h1} h1 elements`);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (over > 0) fail(where, `page scrolls sideways by ${over}px`);
        if (AUDITED.has(size)) {
          await audit(page, where);
          (bg[`${name} ${size}`] ??= {})[scheme] = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
        }
        if (scheme === 'dark' || AUDITED.has(size)) {
          await page.screenshot({ path: path.join(SHOTS, `${name}-${scheme === 'dark' ? '' : 'light-'}${size}.jpg`), fullPage: true, type: 'jpeg', quality: 70 });
        }
        errors.forEach(e => fail(where, `script error: ${e}`));
      }
      await ctx.close();
    }
  }
  // /projects with every card expanded (Expand all).
  for (const scheme of ['dark', 'light']) {
    for (const [size, w, h, mobile] of SIZES.filter(s => AUDITED.has(s[0]))) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile && w < 700, hasTouch: mobile, colorScheme: scheme });
      const page = await ctx.newPage();
      const where = `projects expanded ${scheme} ${size}`;
      await page.goto(BASE + '/projects', { waitUntil: 'networkidle' });
      const btn = page.getByRole('button', { name: 'Expand all' });
      if (!(await btn.count())) { fail(where, 'no Expand all button'); await ctx.close(); continue; }
      await btn.click();
      await page.waitForFunction(() => ![...document.querySelectorAll('article [aria-expanded]')].some(b => b.getAttribute('aria-expanded') !== 'true'));
      await settle(page);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > 0) fail(where, `page scrolls sideways by ${over}px`);
      await audit(page, where);
      await ctx.close();
    }
  }

  // Proof that the light pass really rendered daybreak.
  for (const [k, v] of Object.entries(bg)) if (v.dark === v.light) fail(k, `body background is ${v.dark} in both themes`);

  // Without JavaScript, content and links still render.
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const p = await nojs.newPage();
  for (const [name, url, status = 200] of PAGES) {
    const res = await p.goto(BASE + url);
    if (res.status() !== status) fail(`${name} no-JS`, `HTTP ${res.status()}`);
    if ((await p.locator('h1').count()) !== 1) fail(`${name} no-JS`, 'no single h1');
    if ((await p.locator('nav a[href="/projects"]').count()) < 1) fail(`${name} no-JS`, 'no nav links');
  }
  await nojs.close();
  await browser.close();
  return PAGES.length;
}

run().then(n => {
  if (problems.length) { console.error(problems.join('\n')); console.error(`\n${problems.length} problems.`); process.exit(1); }
  console.log(`All checks passed: ${n} pages x ${SIZES.length} sizes (dark), axe + tap targets in dark and light at ${[...AUDITED].join(', ')}, text routes, no-JS.`);
}).catch(e => { console.error(e); process.exit(1); });
