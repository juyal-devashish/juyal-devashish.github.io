// GitHub contributions as a field of stars: one dot per day, brightest days glow orange.
// Server component: pass real data from lib/github (render nothing yourself when it is null).
//   <GitHubCalendar data={cal} />                     last 52 weeks, 26 on phones
//   <GitHubCalendar data={cal} weeks={53} phoneWeeks={null} title="2026" />
// Screen readers get a summary, a monthly table and a keyboard day-by-day readout.
// With JS, a "Skyline" button (or a click on the dots) raises the days into a CSS 3D city (Skyline.tsx).
import type { Calendar } from '@/lib/github';
import CalendarGrid, { type Cell, type Week } from './CalendarGrid';
import s from './widgets.module.css';

type Props = {
  data: Calendar;
  weeks?: number;               // columns on wide screens
  phoneWeeks?: number | null;   // columns at ≤700px; null keeps them all
  title?: string;
  source?: string;              // small mono line above the title
  id?: string;
  span?: string;                // replaces "last N weeks" in the source line
  totalOnly?: boolean;          // big number: total only (no streak, no busiest weekday)
  range?: boolean;              // show the first – last date of the dots shown
};

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const utc = (iso: string) => new Date(iso + 'T12:00:00Z');
const fmt = (n: number) => n.toLocaleString('en-US');

// Quartiles of the non-zero days, like GitHub's own legend.
function levels(counts: number[]) {
  const nz = counts.filter(n => n > 0).sort((a, b) => a - b);
  if (!nz.length) return () => 0;
  const q = (p: number) => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))];
  const [a, b, c] = [q(0.25), q(0.5), q(0.75)];
  return (n: number) => (n <= 0 ? 0 : n <= a ? 1 : n <= b ? 2 : n <= c ? 3 : 4);
}

function stats(cells: Cell[]) {
  let total = 0, run = 0, streak = 0, best: Cell | null = null;
  const wd = [0, 0, 0, 0, 0, 0, 0];
  for (const c of cells) {
    total += c.n; wd[utc(c.d).getUTCDay()] += c.n;
    run = c.n ? run + 1 : 0; streak = Math.max(streak, run);
    if (!best || c.n > best.n) best = c;
  }
  const busiest = total ? DAYS[wd.indexOf(Math.max(...wd))] : null;
  return { total, streak, busiest, best };
}

export function buildWeeks(data: Calendar, weeks: number): Week[] {
  const days = [...data.days].sort((a, b) => a.date.localeCompare(b.date));
  if (!days.length) return [];
  const lvl = levels(days.map(d => d.count));
  const cols: (Cell | null)[][] = [];
  let col: (Cell | null)[] = Array(utc(days[0].date).getUTCDay()).fill(null);
  for (const d of days) {
    col.push({ d: d.date, n: d.count, l: lvl(d.count) });
    if (col.length === 7) { cols.push(col); col = []; }
  }
  if (col.length) cols.push([...col, ...Array(7 - col.length).fill(null)]);
  const shown = cols.slice(-weeks);
  // A month label sits over the first week that starts in that month, at least 3 weeks apart.
  let last = -9;
  return shown.map((cells, w) => {
    const first = cells.find(Boolean)!;
    const dt = utc(first.d);
    let month: string | undefined;
    if (dt.getUTCDate() <= 7 && w - last >= 3 && w < shown.length - 1) { month = MON[dt.getUTCMonth()]; last = w; }
    return { cells, month };
  });
}

function monthly(cells: Cell[]) {
  const m = new Map<string, number>();
  for (const c of cells) { const k = c.d.slice(0, 7); m.set(k, (m.get(k) ?? 0) + c.n); }
  return [...m].map(([k, n]) => ({ label: `${MON[+k.slice(5) - 1]} ${k.slice(0, 4)}`, n }));
}

function Big({ st, className, totalOnly }: { st: ReturnType<typeof stats>; className?: string; totalOnly?: boolean }) {
  return (
    <div className={`${s.big} ${className ?? ''}`}>
      <div><b>{fmt(st.total)}</b><span>contributions</span></div>
      {totalOnly ? null : <div><b>{st.streak}</b><span>day longest streak</span></div>}
      {!totalOnly && st.busiest ? <div><b>{st.busiest.slice(0, 3)}</b><span>busiest weekday</span></div> : null}
    </div>
  );
}

const short = (iso: string) => utc(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
function Range({ cells, className }: { cells: Cell[]; className?: string }) {
  if (!cells.length) return null;
  const a = cells[0].d, b = cells[cells.length - 1].d;
  return <p className={`${s.range} ${className ?? ''}`}><time dateTime={a}>{short(a)}</time> – <time dateTime={b}>{short(b)}</time></p>;
}

export default function GitHubCalendar({ data, weeks = 52, phoneWeeks = 26, title = 'Contributions', source = 'GitHub', id = 'gh', span: spanText, totalOnly, range }: Props) {
  const wk = buildWeeks(data, weeks);
  if (!wk.length) return null;
  const phone = phoneWeeks && phoneWeeks < wk.length ? phoneWeeks : null;
  const all = wk.flatMap(w => w.cells.filter((c): c is Cell => !!c));
  const recent = phone ? wk.slice(-phone).flatMap(w => w.cells.filter((c): c is Cell => !!c)) : all;
  const st = stats(all), stNarrow = stats(recent);
  const span = (n: number) => spanText ?? `last ${n} weeks`;
  const best = st.best && st.best.n ? `Busiest day: ${utc(st.best.d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} · ${fmt(st.best.n)}` : 'No contributions yet.';
  return (
    <div className={s.gh}>
      <div className={s.top}>
        <div>
          <p className="panel-src">
            {source} ·{' '}
            {phone ? <><span className={s.wideOnly}>{span(wk.length)}</span><span className={s.narrowOnly}>{span(phone)}</span></> : span(wk.length)}
          </p>
          <h3>{title}</h3>
        </div>
      </div>
      <Big st={st} className={phone ? s.wideOnly : undefined} totalOnly={totalOnly} />
      {phone ? <Big st={stNarrow} className={s.narrowOnly} totalOnly={totalOnly} /> : null}
      <CalendarGrid id={id} weeks={wk} phoneWeeks={phone} summary={best}
        label={`${title}: ${fmt(st.total)} over the ${span(wk.length)}. Arrow keys read one day at a time.`} />
      {range ? <><Range cells={all} className={phone ? s.wideOnly : undefined} />{phone ? <Range cells={recent} className={s.narrowOnly} /> : null}</> : null}
      <table className="vh">
        <caption>{title}, by month</caption>
        <thead><tr><th scope="col">Month</th><th scope="col">Contributions</th></tr></thead>
        <tbody>{monthly(all).map(m => <tr key={m.label}><th scope="row">{m.label}</th><td>{fmt(m.n)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
