import type { Metadata } from 'next';
import { pageMeta } from '@/lib/meta';
import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import Reveal from '@/components/Reveal';
import { formatDate, getPosts } from '@/lib/posts';
import { site, writingOn } from '@/lib/site';
import { notFound } from 'next/navigation';
import s from '@/components/writing/writing.module.css';

export const metadata: Metadata = pageMeta('/writing', 'Writing', `Writing by ${site.name}.`);

export default function Writing() {
  if (!writingOn) notFound();
  const posts = getPosts();
  return (
    <section className="sec first" id="writing" aria-labelledby="writing-h">
      <SectionHeader id="writing" as="h1" no={3} label="Writing" title="Latest" accent="writing" copy={false} />
      <div className={s.tools}>
        {posts.length > 0 && <p className={s.count}>{posts.length} {posts.length === 1 ? 'post' : 'posts'}</p>}
      </div>
      {posts.length === 0 ? (
        <p className={s.empty}>Nothing published yet.</p>
      ) : (
        <ul className={s.posts}>
          {posts.map((p, i) => (
            <Reveal as="li" key={p.slug} delay={Math.min(i, 4) * 60}>
              <Link href={`/writing/${p.slug}`}>
                <div className={s.when}>
                  <time dateTime={p.date}>{formatDate(p.date)}</time>
                  <span>{p.minutes} min read</span>
                </div>
                <div>
                  <h2>{p.title}</h2>
                  {p.summary && <p>{p.summary}</p>}
                </div>
                <span className={s.arr} aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </section>
  );
}
