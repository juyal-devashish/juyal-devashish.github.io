// Social card for a post: title over the ring artwork.
import { ImageResponse } from 'next/og';
import { formatDate, getPost, getPosts } from '@/lib/posts';
import { site } from '@/lib/site';
import { Frame, og, ogAssets } from '@/app/_og/card';

export const alt = `A post by ${site.name}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return getPosts().map(p => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  const { rings, fonts } = await ogAssets();
  const title = post?.title ?? site.name;
  const fontSize = title.length > 70 ? 64 : title.length > 40 ? 80 : 96;
  return new ImageResponse(
    (
      <Frame
        rings={rings}
        kicker={post ? `Writing · ${formatDate(post.date)} · ${post.minutes} min` : 'Writing'}
        left={site.name} right={`${new URL(site.url).host}/writing`}
      >
        <div style={{ display: 'flex', maxWidth: 860, fontFamily: 'Newsreader', fontSize, lineHeight: 1.02, letterSpacing: -2, color: og.ink }}>
          {title}
        </div>
        {post?.summary ? (
          <div style={{ display: 'flex', marginTop: 28, maxWidth: 760, fontFamily: 'Newsreader', fontStyle: 'italic', fontSize: 34, lineHeight: 1.25, color: og.accent }}>
            {post.summary}
          </div>
        ) : null}
      </Frame>
    ),
    { ...size, fonts },
  );
}
