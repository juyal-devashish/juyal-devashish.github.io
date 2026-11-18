// Fallback view counter for posts, used only when Vercel Web Analytics' API isn't set up.
// Body: {"slug":"<post slug>"}. Reads no cookies and stores no IP or user agent: it only
// increments views:<year>:post:<slug> and views:<year>. Unknown slugs are ignored.
import { getPosts } from '@/lib/posts';
import { dayKey } from '@/lib/store';
import { countPostView, viewsBeaconOn } from '@/lib/views';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  if (!viewsBeaconOn) return new Response(null, { status: 204 });
  let slug: unknown;
  try {
    const text = await req.text();
    if (text.length > 200) return new Response(null, { status: 413 });
    slug = (JSON.parse(text) as { slug?: unknown }).slug;
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof slug !== 'string' || !getPosts().some(p => p.slug === slug && !p.draft)) return new Response(null, { status: 404 });
  await countPostView(slug, +dayKey().slice(0, 4));
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
