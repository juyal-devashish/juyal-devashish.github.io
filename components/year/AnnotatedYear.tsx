'use client';
// The year as weekly bars, with 2–4 notable moments marked on it (lib/year pickMoments).
// The moment list renders on the server, so captions read without JS; with JS, picking a
// moment (click, or arrow keys / Home / End inside the list) highlights its weeks.
import { useRef, useState, type KeyboardEvent } from 'react';
import s from './year.module.css';

export type ChartMoment = { kind: string; title: string; caption: string; from: number; to: number }; // day indexes
type Props = { weeks: number[]; days: number; through: number; months: { label: string; at: number }[]; moments: ChartMoment[]; label: string };

const W = 1000, H = 180;

export default function AnnotatedYear({ weeks, days, through, months, moments, label }: Props) {
  const [on, setOn] = useState(0);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const max = Math.max(1, ...weeks);
  const bw = (7 / days) * W;
  const x = (day: number) => (day / days) * 100;
  const sel = moments[on];
  // Pins sit on two rows; a pin drops to the second row only when it would crowd its left neighbour.
  const centre = moments.map(m => Math.min(97, Math.max(3, x((m.from + m.to + 1) / 2)))); // kept off the clipped edges
  const rows: number[] = Array(moments.length).fill(0);
  const last = [-99, -99];
  centre.map((c, i) => [c, i]).sort((a, b) => a[0] - b[0]).forEach(([c, i]) => {
    const r = c - last[0] >= 9 ? 0 : c - last[1] >= 9 ? 1 : last[0] <= last[1] ? 0 : 1;
    rows[i] = r; last[r] = c;
  });
  const inSel = (w: number) => !!sel && w * 7 <= sel.to && w * 7 + 6 >= sel.from;

  function go(i: number) {
    const n = (i + moments.length) % moments.length;
    setOn(n);
    btns.current[n]?.focus();
  }
  function onKey(e: KeyboardEvent<HTMLOListElement>) {
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') go(on + 1);
    else if (k === 'ArrowLeft' || k === 'ArrowUp') go(on - 1);
    else if (k === 'Home') go(0);
    else if (k === 'End') go(moments.length - 1);
    else return;
    e.preventDefault();
  }

  return (
    <div className={s.ann}>
      <div className={s.plot} aria-hidden="true">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" focusable="false">
          {sel ? <rect className={s.band} x={(sel.from / days) * W} y={0} width={Math.max(bw * 0.6, ((sel.to - sel.from + 1) / days) * W)} height={H} /> : null}
          <line className={s.base} x1={0} x2={W} y1={H - 0.5} y2={H - 0.5} />
          {weeks.map((n, w) => {
            const h = n ? Math.max(4, (n / max) * (H - 30)) : 0;
            const future = w * 7 > through;
            return future ? null : <rect key={w} className={inSel(w) ? s.barOn : s.bar} x={w * bw + bw * 0.18} width={bw * 0.64} y={H - h} height={h} />;
          })}
          {through < days - 1 ? <line className={s.future} x1={((through + 1) / days) * W} x2={W} y1={H - 0.5} y2={H - 0.5} /> : null}
        </svg>
        {moments.map((m, i) => (
          <span key={i} className={`${s.pin} ${i === on ? s.pinOn : ''}`} style={{ left: `${centre[i]}%`, ['--row' as string]: rows[i] }}>
            {i + 1}
          </span>
        ))}
        <div className={s.axis}>
          {months.map(m => <span key={m.label} style={{ left: `${x(m.at)}%` }}>{m.label}</span>)}
        </div>
      </div>
      <p className="vh" id="moments-hint">{label} Arrow keys move between moments.</p>
      <ol className={s.moments} onKeyDown={onKey} aria-describedby="moments-hint">
        {moments.map((m, i) => (
          <li key={i}>
            <button
              type="button"
              ref={el => { btns.current[i] = el; }}
              aria-pressed={i === on}
              tabIndex={i === on ? 0 : -1}
              onClick={() => setOn(i)}
              className={s.moment}
            >
              <span className={s.mNo} aria-hidden="true">{i + 1}</span>
              <span className={s.mText}><b>{m.title}</b><span>{m.caption}</span></span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
