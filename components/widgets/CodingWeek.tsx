// Coding hours for the last days as a row of rising stars: one column per day, today in orange.
// Server component. Pass real data from lib/coding (render nothing yourself when it is null).
//   <CodingWeek days={week.days} />  — days oldest first
// The columns are an ordered list whose visible text (weekday, hours) is the accessible version.
import type { CodingDay } from '@/lib/coding';
import a from './activity.module.css';
import s from './widgets.module.css';

type Props = { days: CodingDay[]; title?: string; source?: string };

const h1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
const utc = (iso: string) => new Date(iso + 'T12:00:00Z');
const wd = (iso: string, weekday: 'short' | 'long') => utc(iso).toLocaleDateString('en-US', { weekday, timeZone: 'UTC' });
const long = (iso: string) => utc(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

export default function CodingWeek({ days, title = 'Coding', source }: Props) {
  if (!days.length) return null;
  const n = days.length;
  const total = days.reduce((t, d) => t + d.hours, 0);
  const top = Math.max(1, ...days.map(d => d.hours));
  return (
    <div className={a.week}>
      <div className={s.top}>
        <div>
          <p className="panel-src">{source ?? `Coding activity · past ${n} days`}</p>
          <h3>{title}</h3>
        </div>
      </div>
      <div className={s.big}><div><b>{h1(total)}</b><span>hours</span></div></div>
      <ol className={a.cols} style={{ ['--n' as string]: n }} aria-label={`Hours per day, ${wd(days[0].date, 'long')} to today`}>
        {days.map((d, i) => {
          const today = i === n - 1;
          return (
            <li key={d.date} className={`${a.col} ${today ? a.today : ''} ${d.hours ? '' : a.zero}`}>
              <span className={a.track} aria-hidden="true">
                <span className={a.bar} style={{ ['--f' as string]: d.hours / top }} />
              </span>
              <span className={a.wd}><span aria-hidden="true">{wd(d.date, 'short')}</span><span className="vh">{long(d.date)}{today ? ' (today)' : ''}:</span></span>
              <b className={a.hrs}>{h1(d.hours)}<span aria-hidden="true">h</span><span className="vh"> hours</span></b>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
