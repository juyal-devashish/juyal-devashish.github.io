// Re-records the Sama4 demo loop (assets/video/sama4-loop.*) from the live reader:
//   npm install --no-save --no-package-lock playwright && node tools/record-sama4.js
// Needs ffmpeg. It opens one story, selects one highlighted name, lets the
// explanation panel slide in, closes it and returns to the first frame, so the
// 10-second clip loops without a jump. No cursor is drawn and there is no sound.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const STORY = 'https://www.sama4.online/article/b750f67b-ed5a-4616-be6a-c19ca519269b'; // Pistons, Nov 13 2026
const TERM = 'Cade Cunningham';
const LENGTH = 10; // seconds
const ROOT = path.join(__dirname, '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sama4-clip-'));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'light' });
  // Skip the intro and the in-app tips.
  await ctx.addInitScript(() => localStorage.setItem('sama4_onboarding', JSON.stringify({ version: 1, introDone: true, hintsSeen: ['select-term', 'ask-follow-up', 'save-story'], dismissals: {}, storiesOpened: [] })));
  const page = await ctx.newPage();
  const term = () => page.locator('p .term', { hasText: TERM }).first();
  const close = () => page.locator('button[title="Close (Esc)"]').click();
  const rest = async () => { await page.mouse.move(1275, 795); await page.evaluate(() => document.activeElement && document.activeElement.blur()); };
  const open = async () => { await page.goto(STORY, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready); };

  // Warm-up, so the take uses the cached explanation and its timing is repeatable.
  await open(); await term().click(); await sleep(6000); await close(); await sleep(800);

  await open();
  await term().evaluate(el => el.scrollIntoView({ block: 'center' }));
  await rest(); await sleep(1500);
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', f => {
    const file = path.join(tmp, `f${String(frames.length).padStart(5, '0')}.png`);
    fs.writeFileSync(file, Buffer.from(f.data, 'base64'));
    frames.push({ t: f.metadata.timestamp, file });
    cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'png' });
  await sleep(300);
  const t0 = Date.now() / 1000;
  await sleep(1000); await term().click();
  await sleep(6800); await close(); await rest();
  await sleep(2500);
  await cdp.send('Page.stopScreencast'); await sleep(300);
  await browser.close();

  // Screencast frames arrive only when the screen changes: hold each until the next.
  const lines = [];
  for (let i = 0; i < frames.length; i++) {
    const s = Math.max(frames[i].t - t0, 0), e = Math.min(i + 1 < frames.length ? frames[i + 1].t - t0 : LENGTH, LENGTH);
    if (e > s) lines.push(`file '${frames[i].file}'`, `duration ${(e - s).toFixed(4)}`);
    if (e >= LENGTH) break;
  }
  lines.push(lines[lines.length - 2]);
  fs.writeFileSync(path.join(tmp, 'list.txt'), lines.join('\n') + '\n');

  const out = path.join(ROOT, 'assets/video');
  fs.mkdirSync(out, { recursive: true });
  const input = ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-vf', 'fps=30,format=yuv420p', '-t', String(LENGTH), '-an'];
  execFileSync('ffmpeg', [...input, '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-tune', 'stillimage', '-movflags', '+faststart', path.join(out, 'sama4-loop.mp4')]);
  execFileSync('ffmpeg', [...input, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-row-mt', '1', path.join(out, 'sama4-loop.webm')]);
  // Poster: the panel fully open, which is all reduced-motion and no-JS visitors see.
  const poster = frames.filter(f => f.t - t0 < 7.5).pop().file;
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', poster, '-q:v', '5', path.join(ROOT, 'assets/img/work/sama4-loop-poster.jpg')]);
  console.log(`Wrote the ${LENGTH}s loop from ${frames.length} frames. Check that the first and last frames match.`);
})().catch(e => { console.error(e); process.exit(1); });
