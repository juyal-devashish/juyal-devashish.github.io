import type { CSSProperties } from 'react';
import Image from 'next/image';
import { projects, site } from '@/lib/site';
import SectionHeader from '@/components/SectionHeader';
import Reveal from '@/components/Reveal';
import StatusBadge from '@/components/StatusBadge';
import ProjectList from '@/components/projects/ProjectList';
import Clip from '@/components/projects/Clip';
import { Links, Meta, Notes } from '@/components/projects/parts';
import GitHubCalendar from '@/components/widgets/GitHubCalendar';
import { getContributions } from '@/lib/github';
import { fixtureContributions } from '@/lib/fixtures';
import { dayKey } from '@/lib/store';
import { pageMeta } from '@/lib/meta';
import s from '@/components/projects/projects.module.css';

export const metadata = pageMeta('/projects', 'Projects', 'Things I’ve built: AI products, demos and research.');

export const revalidate = 3600;

/** Sunday that starts the week 25 weeks before this one (New York), so the calendar shows 26 whole columns. */
function activityStart(): Date {
  const [y, m, d] = dayKey().split('-').map(Number);
  const today = new Date(Date.UTC(y, m - 1, d));
  return new Date(Date.UTC(y, m - 1, d - today.getUTCDay() - 25 * 7));
}
/** End of today in New York terms (GitHub's own calendar can already be on tomorrow). */
function activityEnd(): Date {
  const [y, m, d] = dayKey().split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59));
}

export default async function ProjectsPage() {
  const gh = (await getContributions(activityStart(), activityEnd())) ?? fixtureContributions();

  const featured = projects.find(p => p.featured);
  const cards = projects.filter(p => p !== featured && p.thumb && p.status !== 'Archived');
  const smaller = projects.filter(p => p !== featured && !cards.includes(p));

  return (
    <>
    <section className="sec first" aria-labelledby="projects-h">
      <SectionHeader id="projects" no={2} label="Projects" title="Things I’ve" accent="made" as="h1" copy={false} />

      {featured && (
        <Reveal as="article" id={featured.id} className={s.feat} aria-labelledby={`${featured.id}-name`}>
          <div className={s.featVis}>
            {featured.video ? (
              <Clip {...featured.video} name={featured.name} />
            ) : featured.thumb ? (
              <Image className={s.featShot} src={featured.thumb} alt="" width={1280} height={800} quality={90} sizes="(min-width: 900px) 640px, 100vw" priority />
            ) : null}
            {featured.sketch && (
              <figure className={s.sketch}>
                <Image src={featured.sketch.src} alt={featured.sketch.alt} width={featured.sketch.width} height={featured.sketch.height} quality={90} sizes="200px" />
                <figcaption>{featured.sketch.caption}</figcaption>
              </figure>
            )}
          </div>
          <div className={s.featBody}>
            <Meta p={featured} />
            <h2 id={`${featured.id}-name`} className={s.featName}>{featured.name}</h2>
            <p className={s.featSum}>{featured.summary}</p>
            {featured.role ? <p className={s.role}>{featured.role}</p> : null}
            <Notes p={featured} />
            <Links p={featured} />
          </div>
        </Reveal>
      )}

      <ProjectList list={cards} />

      {smaller.length > 0 && (
        <Reveal className={s.smaller}>
          <h2 className={`label ${s.smallerH}`}>Smaller things</h2>
          <ul>
            {smaller.map(p => (
              <li key={p.id} id={p.id}>
                <a href={p.links[0]?.href ?? `#${p.id}`} rel="noopener">{p.name}</a>
                <span className={s.smallerMeta}>{p.year ? <span className="mono">{p.year}</span> : null}<StatusBadge status={p.status} /></span>
                <p>{p.summary}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      )}
      <p className={s.gh}><a className="qlink" href={site.links.github} rel="noopener">Everything else is on GitHub</a></p>
    </section>

    {gh ? (
      <section className="sec" id="activity" aria-labelledby="activity-h">
        <SectionHeader id="activity" no="02.1" label="Activity" title="Lately, at the" accent="keyboard" />
        <Reveal className="panel" style={{ '--cal-max': '760px' } as CSSProperties}>
          <GitHubCalendar data={gh} weeks={26} phoneWeeks={26} source="GitHub activity" span="past 6 months" title="Contributions" id="activity-gh" totalOnly range />
        </Reveal>
      </section>
    ) : null}
    </>
  );
}
