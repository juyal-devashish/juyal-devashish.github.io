// Records a short social-preview loop (og:video) of the home page hero.
//   node tools/og-video.mjs <base-url> [out=public/og/home.mp4]
// Writes <out> (1200x630 H.264 MP4, no audio, faststart) and a poster PNG next
// to it (<out minus .mp4>.png). Needs Playwright's Chromium and ffmpeg on PATH
// (or FFMPEG=/path/to/ffmpeg).
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const W = 1200, H = 630;
const HOLD_MS = 2000;      // still on the hero before moving
const DOWN_MS = 2600;      // scroll through the first two sections
const PAUSE_MS = 600;      // short rest at the bottom
const UP_MS = 2000;        // scroll back to the top
const TAIL_MS = 500;       // settle on the hero so the loop joins cleanly
const MAX_BYTES = 2 * 1024 * 1024;
const CRFS = [26, 30, 34, 38];

const [base, outArg = 'public/og/home.mp4'] = process.argv.slice(2);
if (!base) {
  console.error('usage: node tools/og-video.mjs <base-url> [out=public/og/home.mp4]');
  process.exit(2);
}

function findFfmpeg() {
  const candidates = [process.env.FFMPEG, 'ffmpeg', '/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg'].filter(Boolean);
  for (const bin of candidates) {
    const r = spawnSync(bin, ['-version'], { stdio: 'ignore' });
    if (!r.error && r.status === 0) return bin;
  }
  return null;
}

const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  console.error('og-video: ffmpeg not found. Install it (brew install ffmpeg / apt-get install ffmpeg) or set FFMPEG=/path/to/ffmpeg.');
  process.exit(1);
}

const out = path.resolve(outArg);
const poster = out.replace(/\.mp4$/i, '') + '.png';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'og-video-'));

function ff(args) {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0) throw new Error(`ffmpeg failed (exit ${r.status})`);
}

let browser;
try {
  browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    recordVideo: { dir: tmp, size: { width: W, height: H } },
  });
  const page = await context.newPage();
  const t0 = Date.now(); // the recording starts with the page

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300); // let first paint and any entrance settle

  fs.mkdirSync(path.dirname(out), { recursive: true });
  await page.screenshot({ path: poster });
  const start = (Date.now() - t0) / 1000;

  await page.waitForTimeout(HOLD_MS);

  // Bottom of the second top-level section (hero counts as the first if it is
  // a <header>/<section>), clamped to the page height.
  const target = await page.evaluate((vh) => {
    const blocks = [...document.querySelectorAll('main > section, main > header, body > header, section')]
      .filter((el, i, all) => !all.some((o) => o !== el && o.contains(el)))
      .filter((el) => el.getBoundingClientRect().height > 0);
    const max = document.documentElement.scrollHeight - vh;
    if (blocks.length < 2) return Math.min(max, vh * 2);
    const second = blocks[1].getBoundingClientRect();
    return Math.max(0, Math.min(max, second.bottom + window.scrollY - vh));
  }, H);

  const glide = (to, ms) => page.evaluate(([to, ms]) => new Promise((done) => {
    const from = window.scrollY, t = performance.now();
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const step = (now) => {
      const p = Math.min(1, (now - t) / ms);
      window.scrollTo({ top: from + (to - from) * ease(p), behavior: 'instant' });
      p < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  }), [to, ms]);

  await glide(target, DOWN_MS);
  await page.waitForTimeout(PAUSE_MS);
  await glide(0, UP_MS);
  await page.waitForTimeout(TAIL_MS);
  const end = (Date.now() - t0) / 1000;

  const video = page.video();
  await context.close(); // flushes the webm
  const webm = await video.path();

  // Trim the page load off the front, then encode; raise CRF until under 2 MB.
  let size = Infinity;
  for (const crf of CRFS) {
    ff([
      '-ss', start.toFixed(3), '-i', webm, '-t', (end - start).toFixed(3),
      '-an', '-vf', `scale=${W}:${H}:flags=lanczos,fps=30,format=yuv420p`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf),
      '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      out,
    ]);
    size = fs.statSync(out).size;
    if (size <= MAX_BYTES) break;
  }
  if (size > MAX_BYTES) console.warn(`og-video: ${out} is ${(size / 1048576).toFixed(2)} MB, over the 2 MB target`);
  console.log(`og-video: wrote ${path.relative(process.cwd(), out)} (${(size / 1024).toFixed(0)} KB, ${(end - start).toFixed(1)}s) and ${path.relative(process.cwd(), poster)}`);
} finally {
  await browser?.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}
