// /2026: the year in data, from real sources only (lib/year). Any source with nothing to
// show is left out, along with its section. Only 4-digit years from 2024 to now exist.
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/meta';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { slug } from '@/lib/text';
import { formatDate } from '@/lib/posts';
import { getYear, parseYear, allYears, yearDates, MONTHS, fmtDay } from '@/lib/year';
import SectionHeader from '@/components/SectionHeader';
import Reveal from '@/components/Reveal';
import StatusBadge from '@/components/StatusBadge';
import CalendarGrid from '@/components/widgets/CalendarGrid';
import { buildWeeks } from '@/components/widgets/GitHubCalendar';
import AnnotatedYear, { type ChartMoment } from '@/components/year/AnnotatedYear';
import w from '@/components/widgets/widgets.module.css';
import s from '@/components/year/year.module.css';

export const revalidate = 3600;
// Only the years built at deploy time exist. Anything else (/nope, /2023) gets the real
// 404 page at routing time; a notFound() thrown mid-stream would need JS to show it.
// A new year appears with the next deploy, like the search index and sitemap.
export const dynamicParams = false;

type Params = { params: Promise<{ year: string }> };

export function generateStaticParams() {
  return allYears().map(y => ({ year: String(y) }));
}

const titleFor = (y: number, current: boolean) => (current ? `${y}, so far` : `${y} in data`);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const y = parseYear((await params).year);
  if (!y) notFound();
  const current = y === allYears().at(-1);
  const title = titleFor(y, current);
  const description = `${y} in numbers: contributions, projects, writing and papers read.`;
  return pageMeta(`/${y}`, title, description);
}

const fmt = (n: number) => n.toLocaleString('en-US');

export default async function YearPage({ params }: Params) {
  const y = parseYear((await params).year);
  if (!y) notFound();
  const d = await getYear(y);
  const { github: gh } = d;
  const dates = yearDates(y, `${y}-12-31`);
  const index = new Map(dates.map((x, i) => [x, i]));
  const through = index.get(d.through) ?? dates.length - 1;
  const upto = +d.through.slice(5, 7); // months reached so far

  let n = 0;
  const no = () => ++n;

  const stats: { k: string; v: string; sub?: string }[] = [];
  if (gh) stats.push({ k: 'Contributions', v: fmt(gh.total), sub: `${gh.activeDays} active days` });
  if (gh && gh.streak) stats.push({ k: 'Longest streak', v: `${gh.streak}`, sub: gh.streak === 1 ? 'day' : 'days' });
  if (gh?.busiestWeekday) stats.push({ k: 'Busiest weekday', v: gh.busiestWeekday.slice(0, 3) });
  if (d.views) stats.push({ k: d.views.source === 'vercel' ? 'Page views' : 'Post views', v: fmt(d.views.pageviews), sub: d.views.visitors ? `${fmt(d.views.visitors)} visitors` : undefined });
  stats.push({ k: 'Projects', v: String(d.projects.length) });
  stats.push({ k: 'Posts', v: String(d.posts.length) });
  // Read dates are known only for some papers, so a year with none shows no count rather than 0.
  if (d.papers.length) stats.push({ k: 'Papers read', v: String(d.papers.length) });

  // Contributions chart data
  const weeks: number[] = gh ? Array(Math.ceil(dates.length / 7)).fill(0) : [];
  if (gh) gh.days.forEach(x => { const i = index.get(x.date); if (i != null) weeks[Math.floor(i / 7)] += x.count; });
  const moments: ChartMoment[] = gh ? gh.moments.map(m => ({ kind: m.kind, title: m.title, caption: m.caption, from: index.get(m.from) ?? 0, to: index.get(m.to) ?? 0 })) : [];
  const monthsAxis = MONTHS.map((label, i) => ({ label, at: index.get(`${y}-${String(i + 1).padStart(2, '0')}-01`) ?? 0 }));
  const cal = gh ? buildWeeks({ total: gh.total, days: gh.days }, 54) : [];
  const phoneWeeks = cal.length > 26 ? 26 : null;
  const span = (k: number) => `${k} weeks`;

  const shipped = d.projects.length || d.posts.length || d.papers.length;

  return (
    <>
      <section className="sec first" id="year" aria-labelledby="year-h">
        <SectionHeader id="year" as="h1" label="The year in data" title={d.current ? `${y},` : String(y)} accent={d.current ? 'so far' : 'in data'}
          dek={d.current ? `Through ${fmtDay(d.through)}. Updated hourly.` : 'The full year.'} />
        <nav className={s.years} aria-label="Years">
          {allYears().map(yy => (
            <Link key={yy} href={`/${yy}`} aria-current={yy === y ? 'page' : undefined}>{yy}</Link>
          ))}
        </nav>
        {!gh && !d.views && !shipped ? <p className={s.empty}>Nothing on record for {y}.</p> : (
        <Reveal as="dl" className={s.stats}>
          {stats.map(x => (
            <div key={x.k}><dt>{x.k}</dt><dd><b>{x.v}</b>{x.sub ? <span>{x.sub}</span> : null}</dd></div>
          ))}
        </Reveal>
        )}
      </section>

      {gh ? (
        <section className="sec" id="contributions" aria-labelledby="contributions-h">
          <SectionHeader id="contributions" no={no()} label="Contributions" title="The year," accent="annotated" />
          {moments.length && gh.total ? (
            <Reveal className={`panel ${s.panel}`}>
              <p className="panel-src">GitHub · contributions per week</p>
              <h3>Moments</h3>
              <AnnotatedYear weeks={weeks} days={dates.length} through={through} months={monthsAxis} moments={moments}
                label={`${fmt(gh.total)} contributions in ${y}, by week, with ${moments.length} moments marked.`} />
            </Reveal>
          ) : null}
          {cal.length ? (
            <Reveal className={`panel ${s.panel}`}>
              <div className={w.gh}>
                <p className="panel-src">
                  GitHub ·{' '}
                  {phoneWeeks ? <><span className={w.wideOnly}>{span(cal.length)}</span><span className={w.narrowOnly}>last {span(phoneWeeks)}</span></> : span(cal.length)}
                </p>
                <h3>Every day</h3>
                <div className={s.calGap} />
                <CalendarGrid id="year-cal" weeks={cal} phoneWeeks={phoneWeeks}
                  summary={gh.total ? `${fmt(gh.total)} contributions on ${gh.activeDays} days` : 'No contributions yet.'}
                  label={`Contributions in ${y}, one dot per day. Arrow keys read one day at a time.`} />
              </div>
            </Reveal>
          ) : null}
          <Reveal className={s.tableWrap}>
            <table className={s.table}>
              <caption>{y} by month</caption>
              <thead>
                <tr><th scope="col">Month</th><th scope="col">Contributions</th></tr>
              </thead>
              <tbody>
                {MONTHS.slice(0, upto).map((m, i) => (
                  <tr key={m}><th scope="row">{m}</th><td>{fmt(gh.months[i])}</td></tr>
                ))}
              </tbody>
              <tfoot>
                <tr><th scope="row">Total</th><td>{fmt(gh.total)}</td></tr>
              </tfoot>
            </table>
          </Reveal>
        </section>
      ) : null}

      {shipped ? (
        <section className="sec" id="shipped" aria-labelledby="shipped-h">
          <SectionHeader id="shipped" no={no()} label="Shipped" title="What came" accent="out" />
          <div className={s.cols}>
            {d.projects.length ? (
              <Reveal className={s.col}>
                <h3 className="label">Projects · {d.projects.length}</h3>
                <ul className="rows">
                  {d.projects.map(p => (
                    <li key={p.id}><Link className={s.item} href={`/projects#${p.id}`}><span>{p.name}</span><StatusBadge status={p.status} /></Link></li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
            {d.posts.length ? (
              <Reveal className={s.col}>
                <h3 className="label">Writing · {d.posts.length}</h3>
                <ul className="rows">
                  {d.posts.map(p => (
                    <li key={p.slug}><Link className={s.item} href={`/writing/${p.slug}`}><span>{p.title}</span><time dateTime={p.date}>{formatDate(p.date)}</time></Link></li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
            {d.papers.length ? (
              <Reveal className={s.col}>
                <h3 className="label">Papers read · {d.papers.length}</h3>
                <ul className="rows">
                  {d.papers.map(p => (
                    <li key={p.title}><Link className={s.item} href={`/stack#${slug(p.title)}`}><span>{p.title}</span></Link></li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}
