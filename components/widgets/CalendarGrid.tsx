'use client';
// The dots of GitHubCalendar. Renders on the server; with JS, arrow keys (or hover) read out one day,
// and a click (or the Skyline button) raises the days into a 3D skyline (./Skyline, decoration only).
import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import Skyline, { type Cam, type From } from './Skyline';
import s from './widgets.module.css';

export type Cell = { d: string; n: number; l: number };
export type Week = { cells: (Cell | null)[]; month?: string };

type Props = { id: string; weeks: Week[]; phoneWeeks: number | null; label: string; summary: string };

const LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const say = (c: Cell) => {
  const day = new Date(c.d + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  return `${day}: ${c.n === 0 ? 'no' : c.n.toLocaleString('en-US')} contribution${c.n === 1 ? '' : 's'}`;
};

export default function CalendarGrid({ id, weeks, phoneWeeks, label, summary }: Props) {
  const [at, setAt] = useState<[number, number] | null>(null);
  const [sky, setSky] = useState<'off' | 'on' | 'leaving'>('off');
  const cam: Cam = useRef(null);
  const wrap = useRef<HTMLDivElement>(null);
  const from = useRef<From | null>(null);
  // Note where the flat squares are (first and last visible) so the skyline grows out of them.
  const raise = () => {
    const cs = [...(wrap.current?.querySelectorAll<HTMLElement>(`.${s.cal} [data-w]`) ?? [])].filter(e => e.offsetParent);
    const box = wrap.current?.getBoundingClientRect();
    const pt = (e: HTMLElement): [number, number, number, number] => {
      const r = e.getBoundingClientRect();
      return [+e.dataset.w!, +e.dataset.d!, r.left + r.width / 2 - box!.left, r.top + r.height / 2 - box!.top];
    };
    const c = cs.find(e => e.dataset.d !== cs[0].dataset.d);
    from.current = cs.length > 1 && box ? { a: pt(cs[0]), b: pt(cs[cs.length - 1]), c: c ? pt(c) : undefined, size: cs[0].offsetWidth } : null;
    setSky('on');
  };
  const flatten = () => setSky(v => (v === 'on' ? 'leaving' : v));
  const landed = useCallback(() => setSky('off'), []);
  const old = phoneWeeks ? weeks.length - phoneWeeks : 0;
  const cell = (w: number, d: number) => weeks[w]?.cells[d] ?? null;

  const firstWeek = useCallback(() => (old && window.matchMedia('(max-width: 700px)').matches ? old : 0), [old]);
  const lastCell = (): [number, number] => {
    for (let w = weeks.length - 1; w >= 0; w--) for (let d = 6; d >= 0; d--) if (cell(w, d)) return [w, d];
    return [0, 0];
  };

  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const lo = firstWeek();
    let next: [number, number] | null = null;
    if (e.key in moves) {
      const [w, d] = at ?? lastCell();
      const [dw, dd] = moves[e.key];
      const t: [number, number] = [w + dw, d + dd];
      next = t[0] >= lo && t[0] < weeks.length && t[1] >= 0 && t[1] < 7 && cell(...t) ? t : [w, d];
    } else if (e.key === 'Home') {
      for (let d = 0; d < 7 && !next; d++) if (cell(lo, d)) next = [lo, d];
    } else if (e.key === 'End') {
      next = lastCell();
    } else if (e.key === 'Escape') {
      if (sky === 'on') flatten(); else setAt(null);
      return;
    } else return;
    e.preventDefault();
    if (next) setAt(next);
  }

  // On the Skyline button, while raised: arrow keys turn the camera, Esc flattens.
  function onSkyKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (sky !== 'on') return;
    const turns: Record<string, [number, number]> = { ArrowLeft: [8, 0], ArrowRight: [-8, 0], ArrowUp: [0, 6], ArrowDown: [0, -6] };
    if (e.key === 'Escape') flatten();
    else if (e.key in turns) cam.current?.(...turns[e.key]);
    else return;
    e.preventDefault();
  }

  const active = at ? cell(...at) : null;
  return (
    <>
      <div
        ref={wrap}
        className={s.calWrap}
        role="group"
        tabIndex={0}
        aria-label={label}
        onKeyDown={onKey}
        onFocus={() => { if (!at) setAt(lastCell()); }}
        onMouseLeave={() => setAt(null)}
        onMouseOver={e => {
          const t = ((e.target as HTMLElement).closest('[data-w]') as HTMLElement | null)?.dataset;
          if (t?.w) setAt([+t.w, +t.d!]);
        }}
        onClick={() => { if (sky === 'off') raise(); }}
      >
        {sky !== 'off' ? (
          <Skyline weeks={weeks} old={old} at={at} leaving={sky === 'leaving'} onDone={landed} cam={cam}
            onPick={(w, d) => setAt([w, d])} onFlat={flatten} from={from.current} />
        ) : null}
        <div
          hidden={sky !== 'off'}
          className={s.cal}
          aria-hidden="true"
          style={{ ['--weeks' as string]: weeks.length, ['--weeks-phone' as string]: phoneWeeks ?? weeks.length }}
        >
          <span className={s.mo} />
          {LABELS.map((l, i) => <span key={i} className={s.dy}>{l}</span>)}
          {weeks.map((wk, w) => {
            const o = w < old ? { 'data-old': '' } : {};
            return [
              <span key={`m${w}`} className={s.mo} {...o}>{wk.month ?? ''}</span>,
              ...wk.cells.map((c, d) => c
                ? <span key={`${w}-${d}`} className={`${s.c} ${at && at[0] === w && at[1] === d ? s.on : ''}`} data-l={c.l} data-w={w} data-d={d} title={say(c)} {...o} />
                : <span key={`${w}-${d}`} className={`${s.c} ${s.none}`} {...o} />),
            ];
          })}
        </div>
      </div>
      <div className={s.calFoot}>
        <p className={s.legend} aria-hidden="true">
          Less {[0, 1, 2, 3, 4].map(l => <span key={l} className={s.c} data-l={l} />)} More
        </p>
        <p id={`${id}-read`} className={s.read} aria-live="polite">{active ? say(active) : summary}</p>
        <button type="button" className={`ibtn js-only ${s.skyBtn}`} aria-pressed={sky !== 'off'} aria-describedby={`${id}-sky`}
          onClick={() => (sky === 'off' ? raise() : flatten())} onKeyDown={onSkyKey}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20h18M5 20V11h4v9M10 20V5h4v15M15 20v-7h4v7" /></svg>
          <span>Skyline</span>
        </button>
        <span id={`${id}-sky`} hidden>3D view. Drag or use arrow keys here to turn it; Escape flattens.</span>
      </div>
    </>
  );
}
