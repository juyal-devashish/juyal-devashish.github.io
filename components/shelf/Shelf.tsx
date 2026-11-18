'use client';
// The paper stack: each read paper as a small first page. Arrow keys move
// between sheets (one tab stop), Enter or a click opens the paper in a dialog,
// #slug deep links open that paper, and the filter row narrows the stack.
// Hidden without JS; the index list on the page carries the same content for
// no-JS visitors and search engines.
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { play } from '@/lib/sound';
import type { Sheet } from './sheets';
import { NOTE_LABELS } from './labels';
import s from './shelf.module.css';

type Filter = 'all' | 'notes' | `tag:${string}`;

const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const papersWord = (n: number) => `${words[n] ?? n} paper${n === 1 ? '' : 's'}`;
const no = (i: number) => String(i + 1).padStart(2, '0');

export default function Shelf({ sheets }: { sheets: Sheet[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [focus, setFocus] = useState(0);          // roving tab stop (index into sheets)
  const [at, setAt] = useState(-1);               // paper in the dialog
  const atRef = useRef(-1);
  const dlg = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);

  // Tags, most used first; ties alphabetical.
  const tags = useMemo(() => {
    const n = new Map<string, number>();
    sheets.forEach(p => p.tags.forEach(t => n.set(t, (n.get(t) ?? 0) + 1)));
    return [...n].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [sheets]);

  const matches = useCallback((p: Sheet, f: Filter) =>
    f === 'all' || (f === 'notes' ? p.hasNotes : p.tags.includes(f.slice(4))), []);

  const vis = useMemo(() => sheets.flatMap((p, i) => (matches(p, filter) ? [i] : [])), [sheets, filter, matches]);
  const visRef = useRef(vis);
  visRef.current = vis;

  // Keep the tab stop on a visible sheet when the filter changes.
  useEffect(() => {
    if (vis.length && !vis.includes(focus)) setFocus(vis[0]);
  }, [vis, focus]);

  const focusSheet = useCallback((i: number) => {
    setFocus(i);
    btns.current[i]?.focus();
  }, []);

  // After the dialog: focus the sheet and bring it into view at once, rather
  // than a long smooth scroll from wherever the page was.
  const returnTo = useCallback((i: number) => {
    const b = btns.current[i];
    if (!b) return;
    setFocus(i);
    b.focus({ preventScroll: true });
    const r = b.getBoundingClientRect();
    if (r.top < 0 || r.bottom > innerHeight) b.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, []);

  const open = useCallback((i: number) => {
    const d = dlg.current;
    if (!d || i < 0 || i >= sheets.length) return;
    setAt(i); atRef.current = i; setFocus(i);
    try { history.replaceState(history.state, '', `${location.pathname}${location.search}#${sheets[i].id}`); } catch {}
    if (!d.open) { d.showModal(); play('open'); } else play('nav');
    body.current?.scrollTo?.({ top: 0 });
    body.current?.focus({ preventScroll: true });
  }, [sheets]);

  // Deep links: on load and when the hash changes (the palette sets it on this page).
  // A paper hidden by the filter brings every paper back first.
  useEffect(() => {
    const check = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      const i = sheets.findIndex(p => p.id === id);
      if (i < 0) return;
      if (!visRef.current.includes(i)) setFilter('all');
      else {
        // The browser jumps to the reference entry with this id; put the page
        // behind the dialog at the paper's sheet instead (again after load,
        // in case the browser's own jump lands later).
        const align = () => { if (atRef.current === i) btns.current[i]?.scrollIntoView({ block: 'center', behavior: 'instant' }); };
        requestAnimationFrame(align);
        if (document.readyState !== 'complete') window.addEventListener('load', () => requestAnimationFrame(align), { once: true });
      }
      open(i);
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, [open, sheets]);

  // Closing (Esc, the button, or the backdrop) clears the hash and returns focus to the sheet.
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    const onClose = () => {
      play('close');
      try { history.replaceState(history.state, '', `${location.pathname}${location.search}`); } catch {}
      const cur = atRef.current;
      if (cur >= 0) requestAnimationFrame(() => returnTo(cur));
    };
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, [returnTo]);

  function onDeskKey(e: KeyboardEvent<HTMLOListElement>) {
    const i = btns.current.findIndex(b => b === document.activeElement);
    const pos = vis.indexOf(i);
    if (pos < 0 || e.altKey || e.ctrlKey || e.metaKey) return;
    // Columns come from the CSS grid; the slots are not rotated, so this is exact.
    const cols = list.current ? getComputedStyle(list.current).gridTemplateColumns.split(' ').filter(Boolean).length || 1 : 1;
    let j = pos;
    if (e.key === 'ArrowRight') j = pos + 1;
    else if (e.key === 'ArrowLeft') j = pos - 1;
    else if (e.key === 'ArrowDown') j = pos + cols;
    else if (e.key === 'ArrowUp') j = pos - cols;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = vis.length - 1;
    else return;
    e.preventDefault();
    if (j < 0 || j >= vis.length) return;
    if (j !== pos) play('nav');
    focusSheet(vis[j]);
  }

  const pos = vis.indexOf(at);
  const prev = pos > 0 ? vis[pos - 1] : -1;
  const next = pos >= 0 && pos < vis.length - 1 ? vis[pos + 1] : -1;

  function onDialogKey(e: KeyboardEvent<HTMLDialogElement>) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target as HTMLElement;
    if (t.tagName === 'A' || t.tagName === 'SUMMARY') return;
    if (e.key === 'ArrowRight' && next >= 0) { e.preventDefault(); open(next); }
    else if (e.key === 'ArrowLeft' && prev >= 0) { e.preventDefault(); open(prev); }
  }

  function pick(f: Filter) {
    if (f === filter) return;
    play('toggle');
    setFilter(f);
  }

  const cap = (x: string) => x[0].toUpperCase() + x.slice(1);
  const status = filter === 'all' ? `All ${papersWord(vis.length)}`
    : filter === 'notes' ? `${cap(papersWord(vis.length))} with notes`
    : `${cap(papersWord(vis.length))} tagged ${filter.slice(4)}`;

  const p = at >= 0 ? sheets[at] : null;
  const options: [Filter, string, number][] = [
    ['all', 'All', sheets.length],
    ['notes', 'With notes', sheets.filter(x => x.hasNotes).length],
    ...tags.map(([t, n]) => [`tag:${t}`, t, n] as [Filter, string, number]),
  ];

  return (
    <div className={`${s.wrap} js-only`}>
      <div className={s.tools}>
        <div className={s.filters} role="group" aria-label="Filter papers">
          {options.map(([f, label, n]) => (
            <button key={f} type="button" className={`${s.filter} ${f.startsWith('tag:') ? s.tagf : ''}`}
              aria-pressed={filter === f} onClick={() => pick(f)}>
              {label}<span className={s.fn}>{n}</span>
            </button>
          ))}
        </div>
        <p className={s.status} role="status">{status}</p>
      </div>

      <ol ref={list} className={s.desk} aria-label="Papers" aria-describedby="shelf-hint" onKeyDown={onDeskKey}>
        {sheets.map((b, i) => (
          <li key={b.id} className={s.slot} hidden={!vis.includes(i)} style={{ '--tilt': b.tilt, '--lines': b.lines } as CSSProperties}>
            <button
              ref={el => { btns.current[i] = el; }}
              type="button"
              className={`${s.sheet} ${b.hasNotes ? s.noted : ''}`}
              tabIndex={i === focus ? 0 : -1}
              aria-haspopup="dialog"
              aria-labelledby={`sh-${b.id}-t sh-${b.id}-d`}
              aria-current={at === i ? 'true' : undefined}
              onClick={() => open(i)}
              onFocus={() => setFocus(i)}
            >
              {b.pinned ? <span className={s.clip} aria-hidden="true" /> : null}
              {b.hasNotes ? <span className={s.tab} aria-hidden="true">Notes</span> : null}
              <span className={s.head} aria-hidden="true">
                <span className={s.where}>{b.where}</span>{b.year ? <span className={s.year}>{b.year}</span> : null}
                <span className={s.num}>{b.where.length > 10 ? null : <span className={s.nol}>No. </span>}{no(i)}</span>
              </span>
              <span className={`${s.title} ${b.long ? s.long : ''}`} id={`sh-${b.id}-t`}><span className={s.hl}>{b.title}</span></span>
              <span className={s.by} aria-hidden="true">{b.byline}</span>
              <span className={s.abs} aria-hidden="true"><span className={s.absl}>Abstract</span><span className={s.rule} /></span>
              <span className={s.cols} aria-hidden="true"><span /><span /></span>
              <span className={s.tags} aria-hidden="true">{b.tags.map(t => <span key={t}>{t}</span>)}</span>
              <span className="vh" id={`sh-${b.id}-d`}>by {b.authors}{b.hasNotes ? '. With notes' : ''}{b.pinned ? '. Pinned' : ''}</span>
            </button>
          </li>
        ))}
      </ol>
      <p id="shelf-hint" className={s.hint}>Pick a paper · <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> to move · <kbd>Enter</kbd> opens</p>

      <dialog ref={dlg} className={s.dialog} aria-labelledby="pd-title" onKeyDown={onDialogKey}
        onClick={e => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
        <div className={s.box}>
          <div ref={body} className={s.body} tabIndex={0} role="region" aria-labelledby="pd-title">
            {p ? (
              <>
                <p className={s.dmeta}>
                  <span>{no(pos)} / {String(vis.length).padStart(2, '0')}</span>
                  <span>{p.venue || p.date}</span>
                  {p.tags.map(t => <span key={t} className={s.dtag}>{t}</span>)}
                  {p.pinned ? <span className={s.dpin}>Pinned</span> : null}
                </p>
                <h2 id="pd-title" className={s.dtitle}>
                  {p.link
                    ? <a href={p.link} rel="noopener" target="_blank" aria-describedby="pd-newtab"><span className={p.hasNotes ? s.dhl : undefined}>{p.title}</span></a>
                    : <span className={p.hasNotes ? s.dhl : undefined}>{p.title}</span>}
                </h2>
                <span id="pd-newtab" className="vh">Opens in a new tab</span>
                <p className={s.dauth}>{p.authors}</p>
                <p className={s.dtake}>{p.takeaway}</p>
                {p.hasNotes ? (
                  <dl className={s.notes}>
                    {NOTE_LABELS.map((q, k) => p.notes[k] ? (
                      <div key={q}><dt>{q}</dt><dd>{p.notes[k]}</dd></div>
                    ) : null)}
                  </dl>
                ) : null}
                {p.link ? <a className="qlink" href={p.link} rel="noopener" target="_blank">Read the paper<span className="vh"> (opens in a new tab)</span> <span aria-hidden="true">↗</span></a> : null}
              </>
            ) : <h2 id="pd-title" className="vh">Paper</h2>}
          </div>
          <div className={s.bar}>
            <button type="button" className="ibtn" aria-disabled={prev < 0 ? 'true' : undefined}
              onClick={() => { if (prev >= 0) open(prev); }}><span aria-hidden="true">←</span> Previous</button>
            <button type="button" className="ibtn" aria-disabled={next < 0 ? 'true' : undefined}
              onClick={() => { if (next >= 0) open(next); }}>Next <span aria-hidden="true">→</span></button>
            <button type="button" className={`ibtn ${s.close}`} onClick={() => dlg.current?.close()}>Close <kbd aria-hidden="true">Esc</kbd></button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
