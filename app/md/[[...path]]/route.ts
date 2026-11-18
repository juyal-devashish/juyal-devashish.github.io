// Markdown copy of any page. /foo.md is rewritten here (next.config.ts).
import { markdownFor, pageList } from '@/lib/text';
import { getPosts } from '@/lib/posts';
import { allYears } from '@/lib/year';

export const dynamic = 'force-static';

export function generateStaticParams() {
  const paths = pageList().map(p => p.md.replace(/^\/|\.md$/g, ''));
  return [...new Set([...paths, ...allYears().map(String)]), ...getPosts().map(p => `writing/${p.slug}`)].map(p => ({ path: p.split('/') }));
}

export async function GET(_: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = ['index'] } = await params;
  const md = markdownFor(path.join('/'));
  if (!md) return new Response('Not found\n', { status: 404 });
  return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
