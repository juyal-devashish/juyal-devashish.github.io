// When in the day the coding happened: 24 bins (New York time), tallest bin glows orange.
// Server component.  <HourlyPattern hourly={week.hourly} />  — 24 numbers of seconds, hour 0 first.
// Screen readers get the peak in text and a table of the hours with any coding.
import a from './activity.module.css';

type Props = { hourly: number[]; label?: string; tz?: string };

const clock = (h: number) => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
const TICKS: [number, string][] = [[0, '12a'], [6, '6a'], [12, '12p'], [18, '6p']];

export default function HourlyPattern({ hourly, label = 'Hourly pattern · past 7 days', tz = 'New York time' }: Props) {
  if (hourly.length !== 24) return null;
  const max = Math.max(...hourly);
  if (max <= 0) return null;
  const peak = hourly.indexOf(max);
  const lvl = (v: number) => (v <= 0 ? 0 : Math.max(1, Math.ceil((v / max) * 4)));
  const mins = (v: number) => Math.round(v / 60);
  return (
    <div className={a.hourly}>
      <p className="label">{label}</p>
      <div className={a.bins} aria-hidden="true">
        {hourly.map((v, h) => (
          <span key={h} className={a.bin} data-l={lvl(v)} data-peak={h === peak ? '' : undefined} style={{ ['--f' as string]: v / max }} />
        ))}
        {TICKS.map(([h, t]) => <span key={t} className={a.tick} style={{ gridColumn: `${h + 1} / span 6` }}>{t}</span>)}
      </div>
      <p className={a.peak}>Peak <b>{clock(peak)}–{clock((peak + 1) % 24)}</b> · {tz}</p>
      <table className="vh">
        <caption>{label}: minutes coded by hour of day, {tz}</caption>
        <thead><tr><th scope="col">Hour</th><th scope="col">Minutes</th></tr></thead>
        <tbody>
          {hourly.map((v, h) => (mins(v) > 0 ? <tr key={h}><th scope="row">{clock(h)}</th><td>{mins(v)}</td></tr> : null))}
        </tbody>
      </table>
    </div>
  );
}
