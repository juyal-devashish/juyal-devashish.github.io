// Site-wide social card: name, role, pitch over the ring artwork.
import { ImageResponse } from 'next/og';
import { site } from '@/lib/site';
import { Frame, og, ogAssets } from './_og/card';

export const alt = `${site.name}, ${site.role} in ${site.city}: ${site.pitch}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const { rings, fonts } = await ogAssets();
  const [first, ...rest] = site.name.split(' ');
  return new ImageResponse(
    (
      <Frame rings={rings} kicker={`${site.role} · ${site.city}`} left={new URL(site.url).host} right={site.email}>
        <div style={{ display: 'flex', flexDirection: 'column', fontFamily: 'Newsreader', lineHeight: 0.9, letterSpacing: -5 }}>
          <span style={{ fontSize: 150 }}>{first}</span>
          <span style={{ fontSize: 150, fontStyle: 'italic', color: og.accent, marginLeft: 70 }}>{rest.join(' ')}</span>
        </div>
        <div style={{ display: 'flex', marginTop: 30, maxWidth: 620, fontFamily: 'Newsreader', fontStyle: 'italic', fontSize: 36, lineHeight: 1.2, color: og.ink2 }}>
          {site.pitch}
        </div>
      </Frame>
    ),
    { ...size, fonts },
  );
}
