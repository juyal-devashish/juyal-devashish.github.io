// Coding hours by month as concentric orbits (the home widget's look, one ring per month,
// January outside; the latest month is orange). Server component: the month list beside
// the rings is the text version, and the page's table has every number.
import w from '@/components/widgets/widgets.module.css';
import s from './year.module.css';
import { MONTHS } from '@/lib/year';
import type { CodingYear } from '@/lib/year';

const h1 = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function MonthOrbits({ data, upto }: { data: CodingYear; upto: number /* months shown, 1–12 */ }) {
  const months = data.months.slice(0, upto);
  const n = months.length;
  const max = Math.max(1, ...months);
  const step = Math.min(10, 58 / Math.max(1, n - 1)); // innermost ring stays clear of the total
  const sw = Math.max(2, Math.min(7, step * 0.6));
  const top = data.languages;
  const topMax = top[0]?.hours ?? 1;
  return (
    <div className={w.cd}>
      <div className={w.top}>
        <div>
          <p className="panel-src">Editor · {data.days} day{data.days === 1 ? '' : 's'} logged</p>
          <h3>Hours by month</h3>
        </div>
      </div>
      <div className={w.orbit}>
        <svg viewBox="0 0 240 240" aria-hidden="true" focusable="false">
          {months.map((hrs, i) => {
            const r = 112 - i * step, c = 2 * Math.PI * r, f = Math.min(1, hrs / max);
            return (
              <g key={i}>
                <circle className={w.track} cx="120" cy="120" r={r} strokeWidth={sw} />
                <circle className={w.arc} cx="120" cy="120" r={r} strokeWidth={sw}
                  stroke={i === n - 1 ? 'var(--accent)' : 'var(--c2)'} strokeDasharray={c}
                  style={{ ['--c' as string]: c, ['--o' as string]: c * (1 - f), strokeDashoffset: c * (1 - f), transitionDelay: `${i * 70}ms` }} />
              </g>
            );
          })}
          <text x="120" y="123" textAnchor="middle" className={w.tot}>{Math.round(data.hours).toLocaleString('en-US')}h</text>
          <text x="120" y="139" textAnchor="middle" className={w.totLbl}>{n} MONTHS</text>
        </svg>
        <ol className={`${w.days} ${s.monthList}`}>
          {months.map((hrs, i) => (
            <li key={i} className={i === n - 1 ? w.today : undefined}>
              <i aria-hidden="true" /><span>{MONTHS[i]}</span><b>{h1(hrs)} h</b>
            </li>
          ))}
        </ol>
        {top.length ? (
          <div className={w.langs}>
            <p className="label">Languages</p>
            <ul>
              {top.map(l => (
                <li key={l.name}>
                  <span>{l.name}</span><b>{h1(l.hours)} h</b>
                  <i aria-hidden="true" style={{ width: `${(l.hours / topMax) * 100}%` }} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className={w.note}>One ring per month, January outermost. A full ring is the busiest month.</p>
      </div>
    </div>
  );
}
