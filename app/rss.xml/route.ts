import { getPosts } from '@/lib/posts';
import { site } from '@/lib/site';

export const dynamic = 'force-static';
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));

export function GET() {
  const items = getPosts().map(p => `    <item>
      <title>${esc(p.title)}</title>
      <link>${site.url}/writing/${p.slug}</link>
      <guid>${site.url}/writing/${p.slug}</guid>
      <pubDate>${new Date(p.date + 'T12:00:00Z').toUTCString()}</pubDate>
      <description>${esc(p.summary)}</description>
    </item>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)}</title>
    <link>${site.url}</link>
    <description>${esc(site.pitch)}</description>
    <language>en-us</language>
    <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
