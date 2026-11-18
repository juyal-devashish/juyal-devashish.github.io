// og:video for the home page, made by tools/og-video.mjs. Only advertised when
// the file was generated before the build, so a missing video never 404s.
import fs from 'node:fs';
import path from 'node:path';
import { site } from './site';

const FILE = 'og/home.mp4';

export function ogVideos() {
  if (!fs.existsSync(path.join(process.cwd(), 'public', FILE))) return undefined;
  const url = new URL(`/${FILE}`, site.url).toString();
  return [{ url, secureUrl: url, type: 'video/mp4', width: 1200, height: 630 }];
}
