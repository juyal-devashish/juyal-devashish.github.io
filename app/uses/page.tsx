import { notFound } from 'next/navigation';
import { uses } from '@/lib/site';
import SectionHeader from '@/components/SectionHeader';
import Reveal from '@/components/Reveal';
import { pageMeta } from '@/lib/meta';
import s from './uses.module.css';

// 404s until lib/site `uses` is filled in (next.config.ts routes /uses to the 404 page while empty).
export function generateMetadata() {
  if (!uses.length) notFound();
  return pageMeta('/uses', 'Uses', 'Tools I use.');
}

export default function UsesPage() {
  if (!uses.length) notFound();
  return (
    <section className="sec first" aria-labelledby="uses-h">
      <SectionHeader id="uses" label="Uses" title="Tools I" accent="use" as="h1" copy={false} />
      {uses.map((g, gi) => (
        <Reveal as="section" key={g.group} className={s.blk} aria-labelledby={`uses-g${gi}`}>
          <h2 id={`uses-g${gi}`} className={`label ${s.h}`}>{g.group}</h2>
          <ul className={s.rows}>
            {g.items.map(it => (
              <li key={it.name}>
                {it.href ? <a className={s.name} href={it.href} rel="noopener">{it.name}</a> : <span className={s.name}>{it.name}</span>}
                <p>{it.note}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </section>
  );
}
