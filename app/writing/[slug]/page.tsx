import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SectionHeader from '@/components/SectionHeader';
import Toc from '@/components/writing/Toc';
import { renderArticle } from '@/components/writing/article';
import { formatDate, getPost, getPosts } from '@/lib/posts';
import { site } from '@/lib/site';
import s from '@/components/writing/writing.module.css';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const description = post.summary || `${post.title}, by ${site.name}.`;
  return {
    title: post.title,
    description,
    authors: [{ name: site.name, url: site.url }],
    alternates: {
      canonical: `/writing/${post.slug}`,
      types: {
        'application/rss+xml': [{ url: '/rss.xml', title: `${site.name}: writing` }],
        'text/markdown': [{ url: `/writing/${post.slug}.md`, title: 'Markdown' }],
      },
    },
    openGraph: { type: 'article', title: post.title, description, url: `/writing/${post.slug}`, publishedTime: post.date, authors: [site.name], siteName: site.name },
    twitter: { card: 'summary_large_image', title: post.title, description },
  };
}

// Long enough to need a contents list.
const MIN_TOC = 3;

export default async function Post({ params }: Props) {
  const { slug } = await params;
  const posts = getPosts();
  const i = posts.findIndex(p => p.slug === slug);
  if (i < 0) notFound();
  const post = posts[i];
  const newer = posts[i - 1];
  const older = posts[i + 1];
  const { html, toc } = renderArticle(post.body);
  const showToc = toc.length >= MIN_TOC;

  return (
    <article className="sec first" aria-labelledby="post-h">
      <header className={s.head}>
        <SectionHeader id="post" as="h1" no={3} label="Writing" title={post.title} dek={post.summary || undefined} copy={false} />
        <div className={s.facts}>
          <p className="meta">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span>{post.minutes} min read</span>
          </p>
          <p className="qlinks">
            <Link className="qlink" href="/writing">All writing</Link>
          </p>
        </div>
      </header>

      <div className={s.body}>
        {showToc && <Toc items={toc} />}
        <div className={`prose ${s.article}`} dangerouslySetInnerHTML={{ __html: html }} />
      </div>

      {(newer || older) && (
        <nav className={s.pn} aria-label="More writing">
          {older && (
            <Link href={`/writing/${older.slug}`} rel="prev">
              <span className={s.dir}><span aria-hidden="true">← </span>Older</span>
              <span className={s.t}>{older.title}</span>
            </Link>
          )}
          {newer && (
            <Link href={`/writing/${newer.slug}`} rel="next" className={s.next}>
              <span className={s.dir}>Newer<span aria-hidden="true"> →</span></span>
              <span className={s.t}>{newer.title}</span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
