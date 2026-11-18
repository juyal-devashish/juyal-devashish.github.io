// Shared 1200×630 social card in the night style (used by app/opengraph-image and writing posts).
// Fonts are static TTFs bundled in ./fonts (Satori can't read woff2 or variable fonts).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { ReactNode } from 'react';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const C = { bg: '#0A1330', deep: '#060C22', ink: '#FFF8EE', ink2: '#CBCAD8', ink3: '#A6AAC0', accent: '#F59A5C', ring: '#8FB0EE' };

export async function ogAssets() {
  const f = (n: string) => readFile(join(process.cwd(), 'app/_og/fonts', n));
  const [serif, serifItalic, sans, mono, rings] = await Promise.all([
    f('Newsreader-Regular.ttf'), f('Newsreader-Italic.ttf'), f('Inter-Regular.ttf'), f('JetBrainsMono-Medium.ttf'),
    readFile(join(process.cwd(), 'public/assets/img/hero/rings-wide.jpg')),
  ]);
  return {
    rings: `data:image/jpeg;base64,${rings.toString('base64')}`,
    fonts: [
      { name: 'Newsreader', data: serif, weight: 400 as const, style: 'normal' as const },
      { name: 'Newsreader', data: serifItalic, weight: 400 as const, style: 'italic' as const },
      { name: 'Inter', data: sans, weight: 400 as const, style: 'normal' as const },
      { name: 'JetBrains Mono', data: mono, weight: 500 as const, style: 'normal' as const },
    ],
  };
}

// Ring artwork on the right, a scrim on the left, a mono kicker, then whatever the card says.
export function Frame({ rings, kicker, left, right, children }: { rings: string; kicker: string; left: string; right: string; children: ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: C.bg, color: C.ink, fontFamily: 'Inter' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={rings} width={1200} height={779} alt="" style={{ position: 'absolute', top: -110, left: 140, width: 1200, height: 779 }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex', backgroundImage: `linear-gradient(90deg, ${C.deep} 0%, ${C.deep} 16%, rgba(6,12,34,.9) 40%, rgba(6,12,34,.45) 66%, rgba(6,12,34,0) 88%)` }} />
      <div style={{ position: 'absolute', left: 0, top: 490, width: 1200, height: 140, display: 'flex', backgroundImage: `linear-gradient(0deg, ${C.deep}, rgba(6,12,34,0))` }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', padding: '60px 72px 52px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'JetBrains Mono', fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', color: C.ink2 }}>
          <div style={{ width: 44, height: 2, background: C.accent }} />
          {kicker}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'JetBrains Mono', fontSize: 20, color: C.ink3, letterSpacing: 1 }}>
          <div style={{ display: 'flex' }}>{left}</div>
          <div style={{ display: 'flex', color: C.accent }}>{right}</div>
        </div>
      </div>
    </div>
  );
}

export const og = C;
