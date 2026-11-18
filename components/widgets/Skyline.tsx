'use client';
// The 3D "skyline" of CalendarGrid: each day rises as a CSS 3D box (no WebGL). Decoration only:
// aria-hidden, nothing focusable; the flat grid's summary, table and keyboard readout stay the real thing.
// Camera turns with a drag (pointer events) or, from CalendarGrid, arrow keys via `cam`.
import { useEffect, useRef, type PointerEvent as RPointerEvent } from 'react';
import type { Week } from './CalendarGrid';
import k from './Skyline.module.css';

// Where the flat grid's squares sit (relative to the calendar wrapper), so the skyline starts exactly on top of them.
type Pt = [number, number, number, number];   // [week, day, centre x, centre y]
export type From = { a: Pt; b: Pt; c?: Pt; size: number };   // c: a cell on another row (row pitch can differ)
export type Cam = { current: ((dYaw: number, dTilt: number) => void) | null };

type Props = {
  weeks: Week[];
  old: number;                       // weeks hidden at ≤700px (like the flat grid's data-old)
  at: [number, number] | null;       // highlighted day (shared with the flat readout)
  leaving: boolean;                  // true: sink back down, then call onDone
  onDone: () => void;
  onPick: (w: number, d: number) => void;
  onFlat: () => void;                // a plain click off the towers flattens
  cam: Cam;
  from?: From | null;                // flat cells to land on, and the cell size
};

const TILT = [46, 68] as const;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function Skyline({ weeks, old, at, leaving, onDone, onPick, onFlat, cam, from }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLDivElement>(null);
  // A long strip (year view) can only swing a little before it leaves the panel.
  const shown = typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches ? weeks.length - old : weeks.length;
  const YAW = shown > 20 ? clamp(400 / shown, 7, 18) : 40;
  const pose = useRef({ yaw: shown > 20 ? -YAW / 2 : -28, tilt: 56 });
  const frame = useRef(0);
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean; tower: [number, number] | null } | null>(null);

  // Heights are literal: one floor per contribution (floor height comes from CSS, per calendar).
  // The tallest tower (and, when the phone hides older weeks, the tallest one it still shows) wears its count.
  const top = (w0: number) => {
    let n = 0, at: [number, number] | null = null;
    weeks.forEach((wk, w) => { if (w >= w0) wk.cells.forEach((c, d) => { if (c && c.n > n) { n = c.n; at = [w, d]; } }); });
    return { n, at: at as [number, number] | null };
  };
  const all = top(0), phone = old ? top(old) : all;
  const max = all.n;
  const tag = (w: number, d: number) => {
    const a = all.at && all.at[0] === w && all.at[1] === d, p = phone.at && phone.at[0] === w && phone.at[1] === d;
    return a && p ? 'both' : a ? 'wide' : p ? 'phone' : null;
  };
  const last = Math.max(1, weeks.length - 1);

  // Write the camera straight to CSS variables (no React render for ~370 towers).
  const paint = () => {
    frame.current = 0;
    const el = plate.current;
    if (!el) return;
    const { yaw, tilt } = pose.current;
    el.style.setProperty('--yaw', `${yaw.toFixed(2)}deg`);
    el.style.setProperty('--tilt', `${tilt.toFixed(2)}deg`);
    el.dataset.side = yaw < 0 ? 'w' : 'e';
  };
  const turn = (dYaw: number, dTilt: number) => {
    const p = pose.current;
    p.yaw = clamp(p.yaw + dYaw, -YAW, YAW);
    p.tilt = clamp(p.tilt + dTilt, TILT[0], TILT[1]);
    if (!frame.current) frame.current = requestAnimationFrame(paint);
  };

  useEffect(() => {
    cam.current = turn;
    return () => { cam.current = null; };
  });
  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current); frame.current = 0; }, []);

  // FLIP: inset, scale and shift the face-on plate so its squares land on the flat grid's squares.
  const match = (el: HTMLDivElement, f: From) => {
    const pl = plate.current!, box = el.parentElement!.getBoundingClientRect();
    const at = ([w, d]: Pt) => {
      const r = pl.querySelector(`[data-w="${w}"][data-d="${d}"]`)?.getBoundingClientRect();
      return r ? [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top] : null;
    };
    const ca = at(f.a), cb = at(f.b);
    if (!ca || !cb || f.b[0] === f.a[0]) return;
    const pitch = (f.b[2] - f.a[2]) / (f.b[0] - f.a[0]);
    pl.style.setProperty('--inset', `${Math.max(0, (1 - f.size / pitch) / 2 * 100).toFixed(2)}%`);
    const sa = at(f.a)!, sb = at(f.b)!;       // re-measured with the new inset (forces layout once)
    const sc = f.c ? at(f.c) : null;
    const sx = (f.b[2] - f.a[2]) / (sb[0] - sa[0]);
    const sy = f.c && sc && sc[1] !== sa[1] ? (f.c[3] - f.a[3]) / (sc[1] - sa[1]) : sx;
    const r = pl.getBoundingClientRect(), o = [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
    pl.style.setProperty('--fs', sx.toFixed(4));
    pl.style.setProperty('--fsy', sy.toFixed(4));
    pl.style.setProperty('--fx', `${(f.a[2] - o[0] - sx * (sa[0] - o[0])).toFixed(1)}px`);
    pl.style.setProperty('--fy', `${(f.a[3] - o[1] - sy * (sa[1] - o[1])).toFixed(1)}px`);
    void pl.offsetWidth;
  };

  // Rise on mount: start flat, then drop the .flat class two frames later so the transition runs.
  useEffect(() => {
    const el = stage.current!;
    paint();
    if (reduced()) { el.classList.remove(k.flat); return; }
    if (from) match(el, from);
    el.classList.add(k.anim);
    let r2 = 0;
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => el.classList.remove(k.flat)); });
    const t = window.setTimeout(() => el.classList.remove(k.anim), 1150);
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); clearTimeout(t); };
  }, []);

  // Sink, then hand back to the flat grid.
  useEffect(() => {
    if (!leaving) return;
    const el = stage.current!;
    if (reduced()) { onDone(); return; }
    el.classList.add(k.anim, k.out, k.flat);
    const t = window.setTimeout(onDone, 720);
    return () => clearTimeout(t);
  }, [leaving, onDone]);

  const towerAt = (t: EventTarget | null): [number, number] | null => {
    const el = (t as HTMLElement | null)?.closest?.('[data-w]') as HTMLElement | null;
    return el ? [+el.dataset.w!, +el.dataset.d!] : null;
  };
  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || drag.current) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, tower: towerAt(e.target) };
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.moved) {
      if (Math.hypot(dx, dy) < 6) return;
      g.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      stage.current?.classList.add(k.grab);
    }
    g.x = e.clientX; g.y = e.clientY;
    turn(-dx * 0.35, -dy * 0.3);
  };
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g || g.id !== e.pointerId) return;
    drag.current = null;
    stage.current?.classList.remove(k.grab);
    if (e.type !== 'pointerup' || g.moved) return;
    if (g.tower) onPick(...g.tower); else onFlat();
  };

  return (
    <div ref={stage} className={`${k.stage} ${k.flat}`} aria-hidden="true"
      style={{ ['--weeks' as string]: weeks.length, ['--weeks-phone' as string]: weeks.length - old,
        ['--max' as string]: max || 1, ['--max-phone' as string]: phone.n || 1 }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <div className={k.scene}>
        <div ref={plate} className={k.plate}>
          {weeks.map((wk, w) => {
            const o = w < old ? { 'data-old': '' } : {};
            const rise = Math.round((w / last) * 300);
            const sink = Math.round(((last - w) / last) * 220);
            return [
              ...wk.cells.map((c, d) => {
                if (!c) return <i key={`${w}-${d}`} className={k.gap} {...o} />;
                const on = at && at[0] === w && at[1] === d;
                const t = c.n ? tag(w, d) : null;
                return (
                  <i key={`${w}-${d}`} className={`${c.n ? k.tw : k.tile}${on ? ' ' + k.on : ''}`} data-l={c.l} data-w={w} data-d={d} {...o}
                    style={c.n ? { ['--n' as string]: c.n, ['--r' as string]: (c.n / max).toFixed(3), ['--a' as string]: `${rise + d * 12}ms`, ['--b' as string]: `${sink + (6 - d) * 8}ms` } : undefined}>
                    {c.n ? <b /> : null}
                    {t ? <span className={k.max} data-for={t}>{c.n.toLocaleString('en-US')}</span> : null}
                  </i>
                );
              }),
              <span key={`m${w}`} className={k.mo} {...o}>{wk.month ?? ''}</span>,
            ];
          })}
        </div>
      </div>
    </div>
  );
}
