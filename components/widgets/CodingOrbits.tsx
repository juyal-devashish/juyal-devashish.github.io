'use client';
// Coding hours as concentric orbits: one ring per day, oldest outside, the last day orange inside.
// Pass real data from lib/coding (render nothing yourself when it is null).
//   <CodingOrbits days={days} />  — days oldest first
// The day list beside the rings is the text version; hovering a row or ring highlights its pair.
import { useState } from 'react';
import type { CodingDay } from '@/lib/coding';
import s from './widgets.module.css';

type Props = { days: CodingDay[]; title?: string; source?: string; lastLabel?: string };

const h1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);

export default function CodingOrbits({ days, title = 'Coding hours', source, lastLabel = 'today' }: Props) {
  const [on, setOn] = useState(-1);
  if (!days.length) return null;
  const n = days.length;
  const total = days.reduce((a, d) => a + d.hours, 0);
  const max = Math.max(...days.map(d => d.hours));
  const full = Math.max(8, Math.ceil(max));
  const step = Math.min(10, 64 / Math.max(1, n - 1));
  const sw = Math.max(2, Math.min(7, step * 0.7));
  const langs = new Map<string, number>();
  days.forEach(d => d.languages.forEach(l => langs.set(l.name, (langs.get(l.name) ?? 0) + l.hours)));
  const top = [...langs].sort((a, b) => b[1] - a[1]).slice(0, 5).filter(([, v]) => v > 0);
  const topMax = top[0]?.[1] ?? 1;
  const name = (iso: string, i: number) => {
    const w = new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    return i === n - 1 ? `${w} (${lastLabel})` : w;
  };
  const hl = (i: number) => ({ onMouseEnter: () => setOn(i), onMouseLeave: () => setOn(-1) });

  return (
    <div className={s.cd}>
      <div className={s.top}>
        <div>
          <p className="panel-src">{source ?? `Editor · last ${n} days`}</p>
          <h3>{title}</h3>
        </div>
      </div>
      <div className={`${s.orbit} ${on > -1 ? s.hl : ''}`}>
        <svg viewBox="0 0 240 240" aria-hidden="true" focusable="false">
          {days.map((d, i) => {
            const r = 112 - i * step, c = 2 * Math.PI * r, f = Math.min(1, d.hours / full);
            return (
              <g key={d.date} {...hl(i)}>
                <circle className={s.track} cx="120" cy="120" r={r} strokeWidth={sw} />
                <circle
                  className={`${s.arc} ${i === on ? s.arcOn : ''}`}
                  cx="120" cy="120" r={r} strokeWidth={sw}
                  stroke={i === n - 1 ? 'var(--accent)' : 'var(--c2)'}
                  strokeDasharray={c}
                  style={{ ['--c' as string]: c, ['--o' as string]: c * (1 - f), strokeDashoffset: c * (1 - f), transitionDelay: `${i * 90}ms` }}
                />
              </g>
            );
          })}
          <text x="120" y="123" textAnchor="middle" className={s.tot}>{Math.round(total)}h</text>
          <text x="120" y="139" textAnchor="middle" className={s.totLbl}>{n} DAYS</text>
        </svg>
        <div className={s.daysCol}>
          <p className="vh">{`${h1(total)} hours over the last ${n} days.`}</p>
          <div
            className={s.daysGroup}
            role="group"
            tabIndex={0}
            aria-label="Hours per day. Up and down arrows highlight a day’s ring."
            onKeyDown={e => {
              const k = e.key;
              if (k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); setOn(o => (o < 0 ? (k === 'ArrowDown' ? 0 : n - 1) : (o + (k === 'ArrowDown' ? 1 : -1) + n) % n)); }
              else if (k === 'Home') { e.preventDefault(); setOn(0); }
              else if (k === 'End') { e.preventDefault(); setOn(n - 1); }
              else if (k === 'Escape') setOn(-1);
            }}
            onBlur={() => setOn(-1)}
          >
          <ol className={s.days}>
            {days.map((d, i) => (
              <li key={d.date} className={`${i === n - 1 ? s.today : ''} ${i === on ? s.dayOn : ''}`} {...hl(i)} onClick={() => setOn(o => (o === i ? -1 : i))}>
                <i aria-hidden="true" /><span>{name(d.date, i)}</span><b>{h1(d.hours)} h</b>
              </li>
            ))}
          </ol>
          </div>
          <p className="vh" aria-live="polite">{on > -1 ? `${name(days[on].date, on)}: ${h1(days[on].hours)} hours` : ''}</p>
        </div>
        {top.length ? (
          <div className={s.langs}>
            <p className="label">Languages</p>
            <ul>
              {top.map(([k, v]) => (
                <li key={k}>
                  <span>{k}</span><b>{h1(v)} h</b>
                  <i aria-hidden="true" style={{ width: `${(v / topMax) * 100}%` }} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className={s.note}>One ring per day, outermost first; the orange ring is {lastLabel}. A full ring is {full} hours.</p>
      </div>
    </div>
  );
}
