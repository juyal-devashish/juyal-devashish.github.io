// Makes the home page hero loop from a source clip (the aurora timelapse, GX010776.mov).
//   node tools/hero-video.mjs <source.mov> [outDir=public/assets]
// Writes video/hero-aurora-{wide,tall}.{webm,mp4} and img/hero/aurora-{wide,tall}.jpg.
// Needs ffmpeg with libx264 and libvpx-vp9 on PATH (or FFMPEG=/path/to/ffmpeg).
//
// The loop: play [START, END] of the source at 1/SLOW speed, starting at SHIFT; the end blends
// back into the start over FADE seconds. The aurora peaks at PEAK (measured: most red and green
// light against blue), and SHIFT puts that peak ~2.5 s into the loop, so visitors see it build.
// The crop drops the porch roof in the top-left corner. Audio and all metadata are removed.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const START = 9, PEAK = 11.4, END = 26;   // seconds in the source
const LEAD = 2.5;                         // seconds of playback before the peak
const FADE = 1;                          // seconds of source blended across the seam
const SLOW = 1.5;                        // playback is this many times slower than the timelapse
const SHIFT = +(PEAK - LEAD / SLOW).toFixed(2); // where the loop starts in the source (9.73)
const CROP = { w: 2918, h: 1641, x: 922, y: 230 }; // in the 3840x2160 source
const TALL_W = Math.round(CROP.h * 3 / 4);         // 3:4, like the old rings-tall.jpg
const OUTS = [
  { name: 'wide', crop: CROP, w: 1920, h: 1080, maxBytes: 4.5e6 },
  { name: 'tall', crop: { w: TALL_W, h: CROP.h, x: CROP.x + Math.round((CROP.w - TALL_W) * 0.55), y: CROP.y }, w: 720, h: 960, maxBytes: 2.5e6 },
];
const CRFS = { mp4: [26, 29, 32, 35], webm: [38, 42, 46, 50] };

const [src, outDir = 'public/assets'] = process.argv.slice(2);
if (!src) {
  console.error('usage: node tools/hero-video.mjs <source.mov> [outDir=public/assets]');
  process.exit(2);
}
const ffmpeg = process.env.FFMPEG || 'ffmpeg';

function run(args) {
  const r = spawnSync(ffmpeg, ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.error || r.status !== 0) {
    console.error(`hero-video: ffmpeg failed (${r.error?.message ?? `exit ${r.status}`})`);
    process.exit(1);
  }
}

// Two trims of the source joined by a crossfade: [SHIFT, END] then [START, SHIFT].
// The second piece starts with the fade, so its last frame runs straight into the first one.
function graph({ crop, w, h }) {
  const prep = `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y},scale=${w}:${h}:flags=lanczos:in_range=full:out_range=tv,hqdn3d=1.5:1.5:3:3,format=yuv420p`;
  const a = `[0:v]trim=${SHIFT}:${END},setpts=PTS-STARTPTS,${prep}[a]`;
  const b = `[0:v]trim=${START - FADE}:${SHIFT},setpts=PTS-STARTPTS,${prep}[b]`;
  const join = `[a][b]xfade=transition=fade:duration=${FADE}:offset=${END - SHIFT - FADE}[j]`;
  const slow = `[j]setpts=${SLOW}*PTS,minterpolate=fps=30:mi_mode=blend,format=yuv420p[v]`;
  return [a, b, join, slow].join(';');
}

const common = ['-pix_fmt', 'yuv420p', '-an','-map_metadata', '-1', '-map_chapters', '-1', '-dn', '-sn'];
const codec = {
  mp4: crf => ['-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-profile:v', 'high', '-movflags', '+faststart'],
  webm: crf => ['-c:v', 'libvpx-vp9', '-crf', String(crf), '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2'],
};

fs.mkdirSync(path.join(outDir, 'video'), { recursive: true });
fs.mkdirSync(path.join(outDir, 'img/hero'), { recursive: true });

for (const o of OUTS) {
  // Render the filtered loop once, losslessly enough, then encode each format from it.
  const master = path.join(outDir, 'video', `.hero-${o.name}-master.mkv`);
  run(['-i', src, '-filter_complex', graph(o), '-map', '[v]', ...common, '-c:v', 'libx264', '-crf', '12', '-preset', 'fast', master]);

  for (const ext of ['webm', 'mp4']) {
    const out = path.join(outDir, 'video', `hero-aurora-${o.name}.${ext}`);
    let size = 0;
    for (const crf of CRFS[ext]) {
      run(['-i', master, ...common, ...codec[ext](crf), out]);
      size = fs.statSync(out).size;
      if (size <= o.maxBytes) break;
    }
    console.log(`${out}  ${(size / 1e6).toFixed(2)} MB`);
  }

  // The poster is the loop's first frame, so nothing jumps when the video starts.
  const poster = path.join(outDir, 'img/hero', `aurora-${o.name}.jpg`);
  run(['-i', master, '-frames:v', '1', '-map_metadata', '-1', '-q:v', '4', poster]);
  console.log(`${poster}  ${(fs.statSync(poster).size / 1e3).toFixed(0)} kB`);
  fs.rmSync(master);
}
