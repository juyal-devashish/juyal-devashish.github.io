import Link from 'next/link';
import { now, projects } from '@/lib/site';
import SectionHeader from '@/components/SectionHeader';
import Reveal from '@/components/Reveal';
import StatusBadge from '@/components/StatusBadge';
import { pageMeta } from '@/lib/meta';
import s from './now.module.css';

export const metadata = pageMeta('/now', 'Now', 'What I’m focused on right now.');

// `updated` is a calendar date; format it in UTC so it never shifts a day.
const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' });

export default function NowPage() {
  const building = now.building.map(name => projects.find(p => p.name === name) ?? { name, id: '', summary: '', status: undefined });
  return (
    <section className="sec first" aria-labelledby="now-h">
      <SectionHeader id="now" label="Now" title="What I’m" accent="doing" after="now" as="h1" copy={false}
        dek={<>Updated <time dateTime={now.updated}>{fmt(now.updated)}</time></>} />

      <div className={s.grid}>
        <Reveal as="section" className={s.focus} aria-labelledby="focus-h">
          <h2 id="focus-h" className="label">Focus</h2>
          <p className={s.focusText}>{now.focus}</p>
          <svg className={s.mini} viewBox="0 0 200 200" aria-hidden="true" focusable="false"><circle cx="100" cy="100" r="40" /><circle cx="100" cy="100" r="60" /><circle cx="100" cy="100" r="80" /><circle cx="100" cy="100" r="98" /></svg>
        </Reveal>

        {building.length > 0 && (
          <Reveal as="section" className={s.building} aria-labelledby="building-h" delay={80}>
            <h2 id="building-h" className="label">Building</h2>
            <ul className={s.list}>
              {building.map(p => (
                <li key={p.name}>
                  {p.id ? <Link className={s.name} href={`/projects#${p.id}`}>{p.name}</Link> : <span className={s.name}>{p.name}</span>}
                  {p.status ? <StatusBadge status={p.status} /> : null}
                  {p.summary ? <p>{p.summary}</p> : null}
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </section>
  );
}
