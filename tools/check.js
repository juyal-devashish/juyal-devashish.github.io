// Site checks, run in CI on every push (and locally if you like):
//   node tools/check.js http://127.0.0.1:8000 [screenshot-dir]
// Fails on any axe violation or any control smaller than 44px outside running
// text, and writes full-page screenshots at 12 common screen sizes.
'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const BASE = (process.argv[2] || 'http://127.0.0.1:8000').replace(/\/$/, '') + '/';
const SHOTS = process.argv[3] || 'screenshots';
const PAGES = [['home', ''], ['papers', 'papers.html']];
const SIZES = [
  ['phone-360x800', 360, 800, true], ['phone-375x812', 375, 812, true], ['phone-390x844', 390, 844, true], ['phone-430x932', 430, 932, true],
  ['tablet-768x1024', 768, 1024, true], ['tablet-820x1180', 820, 1180, true],
  ['laptop-1280x800', 1280, 800, false], ['laptop-1366x768', 1366, 768, false], ['laptop-1440x900', 1440, 900, false], ['laptop-1536x864', 1536, 864, false],
  ['desktop-1920x1080', 1920, 1080, false], ['desktop-2560x1440', 2560, 1440, false],
];
const AUDITED = new Set(['phone-375x812', 'laptop-1366x768']);

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const problems = [];
  for (const [size, w, h, mobile] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: mobile && w < 700, hasTouch: mobile });
    const page = await ctx.newPage();
    page.on('pageerror', e => problems.push(`${size}: script error: ${e.message}`));
    for (const [name, url] of PAGES) {
      const res = await page.goto(BASE + url, { waitUntil: 'networkidle' });
      if (!res || res.status() !== 200) problems.push(`${name} ${size}: HTTP ${res && res.status()}`);
      await page.evaluate(() => document.fonts.ready);
      // Scroll through so lazy content (the photo strip) builds and loads.
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } scrollTo(0, 0); });
      await page.evaluate(() => Promise.all([...document.images].filter(i => i.offsetParent).map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));

      if (AUDITED.has(size)) {
        await page.addScriptTag({ content: axeSource });
        const violations = await page.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] })).violations
          .map(v => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(' | ')}`));
        violations.forEach(v => problems.push(`${name} ${size}: axe ${v}`));
        const small = await page.evaluate(() => [...document.querySelectorAll('a[href],button,input,[tabindex="0"]')]
          .filter(e => e.offsetParent && !e.closest('[aria-hidden="true"]') && !e.closest('p,li,dd,.colophon'))
          .map(e => { const b = e.getBoundingClientRect(); return { what: (e.textContent || e.className).trim().slice(0, 30), w: Math.round(b.width), h: Math.round(b.height) }; })
          .filter(x => x.h < 44 || x.w < 24));
        small.forEach(x => problems.push(`${name} ${size}: tap target ${x.w}x${x.h} "${x.what}"`));
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      if (overflow) problems.push(`${name} ${size}: page scrolls sideways`);
      await page.screenshot({ path: path.join(SHOTS, `${name}-${size}.jpg`), fullPage: true, type: 'jpeg', quality: 70 });
    }
    await ctx.close();
  }
  await browser.close();
  if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
  console.log(`All checks passed: ${PAGES.length} pages x ${SIZES.length} sizes, axe and tap targets at ${[...AUDITED].join(', ')}.`);
})().catch(e => { console.error(e); process.exit(1); });
