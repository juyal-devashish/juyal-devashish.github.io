'use client';
// The /cmd terminal. A real <input> in a form, output in a polite log region.
// The boot sequence is CSS only (no state flash, nothing under reduced motion).
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { play, soundOn, setSoundOn, isTouchOnly } from '@/lib/sound';
import { setTheme, toggleTheme, themeName } from '@/lib/theme';
import { announce } from '@/components/util';
import { run, complete, searchLines, type Line, type Seg, type TermData, type IndexEntry } from './engine';
import s from './terminal.module.css';

type Entry = { id: number; cmd: string | null; lines: Line[]; busy?: boolean };

const PROMPT = 'devashish@nyc:~$';
const HIST_KEY = 'cmd-history';
const QUICK = ['help', 'ls', 'cat about.txt', 'open sama4', 'orbit'];

function loadHistory(): string[] {
  try { const v = JSON.parse(sessionStorage.getItem(HIST_KEY) ?? '[]'); return Array.isArray(v) ? v.filter(x => typeof x === 'string').slice(-50) : []; } catch { return []; }
}
function saveHistory(h: string[]) { try { sessionStorage.setItem(HIST_KEY, JSON.stringify(h.slice(-50))); } catch {} }

let indexPromise: Promise<IndexEntry[]> | null = null;
function getIndex() {
  indexPromise ??= fetch('/search-index.json').then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).catch(e => { indexPromise = null; throw e; });
  return indexPromise;
}

function SegView({ seg }: { seg: Seg }) {
  if (typeof seg === 'string') return <>{seg}</>;
  const cls = s.link;
  if (seg.ext || /^(https?:|mailto:)/.test(seg.href) || seg.href.endsWith('.pdf')) {
    const ext = /^https?:/.test(seg.href);
    return <a className={cls} href={seg.href} {...(ext ? { target: '_blank', rel: 'noopener' } : {})}>{seg.text}{ext ? <span className="vh"> (opens in a new tab)</span> : null}</a>;
  }
  return <Link className={cls} href={seg.href}>{seg.text}</Link>;
}

function LineView({ line }: { line: Line }) {
  const cls = [s.line, line.kind ? s[line.kind] : '', line.row ? s.row : ''].filter(Boolean).join(' ');
  if (line.kind === 'art') {
    return (
      <div className={cls}>
        <pre aria-hidden="true">{line.segs.map(x => (typeof x === 'string' ? x : x.text)).join('')}</pre>
        <span className="vh">{line.label}</span>
      </div>
    );
  }
  if (line.cols) {
    const [k, ...rest] = line.segs;
    return (
      <p className={`${cls} ${s.cols}`} style={{ '--k': `${line.cols}ch` } as CSSProperties}>
        <span><SegView seg={k} /></span>
        <span>{rest.map((seg, i) => <SegView key={i} seg={seg} />)}</span>
      </p>
    );
  }
  return <p className={cls}>{line.segs.map((seg, i) => <SegView key={i} seg={seg} />)}</p>;
}

export default function Terminal({ data, banner }: { data: TermData; banner: { mount: string; load: string } }) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [value, setValue] = useState('');
  const [ready, setReady] = useState(false);
  const history = useRef<string[]>([]);
  const hIdx = useRef(-1);           // -1 = editing a fresh line
  const draft = useRef('');
  const nextId = useRef(1);
  const input = useRef<HTMLInputElement>(null);
  const shell = useRef<HTMLDivElement>(null);

  useEffect(() => {
    history.current = loadHistory();
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const id = window.setTimeout(() => setReady(true), still ? 0 : 1400);
    if (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) input.current?.focus({ preventScroll: true });
    return () => window.clearTimeout(id);
  }, []);

  // Keep the prompt in view as output grows.
  useEffect(() => {
    if (!entries.length) return;
    input.current?.parentElement?.scrollIntoView({ block: 'nearest' });
  }, [entries]);

  const push = (cmd: string | null, lines: Line[], busy = false) => {
    const id = nextId.current++;
    setEntries(e => [...e.slice(-80), { id, cmd, lines, busy }]);
    return id;
  };
  const replace = (id: number, lines: Line[]) => setEntries(e => e.map(x => (x.id === id ? { ...x, lines, busy: false } : x)));
  const clear = () => { setEntries([]); announce('Cleared'); };

  function exec(raw: string) {
    const cmd = raw.trim();
    if (cmd) {
      const h = history.current;
      if (h[h.length - 1] !== cmd) { h.push(cmd); saveHistory(h); }
    }
    hIdx.current = -1; draft.current = '';
    setValue('');
    if (!cmd) { push('', []); return; }

    const res = run(cmd, data);
    play(res.error ? 'error' : 'nav');
    const ef = res.effect;
    if (!ef) { push(cmd, res.lines); return; }
    switch (ef.type) {
      case 'clear': clear(); return;
      case 'nav':
        push(cmd, res.lines);
        router.push(ef.href);
        return;
      case 'theme': {
        const tme = ef.value ? (setTheme(ef.value), ef.value) : toggleTheme();
        push(cmd, [{ segs: [`theme: ${themeName(tme)}`] }]);
        return;
      }
      case 'sound': {
        if (ef.value !== undefined) setSoundOn(ef.value);
        const on = ef.value ?? soundOn();
        const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const lines: Line[] = [{ segs: [`sound: ${on ? 'on' : 'off'}`] }];
        if (on && (still || isTouchOnly())) lines.push({ kind: 'dim', segs: [isTouchOnly() ? 'touch screens get a short buzz instead' : 'silent while reduced motion is on'] });
        else if (ef.value === undefined) lines.push({ kind: 'dim', segs: [`sound ${on ? 'off' : 'on'} to switch`] });
        push(cmd, lines);
        return;
      }
      case 'history': {
        const h = history.current;
        push(cmd, h.map((c, i) => ({ segs: [`${String(i + 1).padStart(3)}  ${c}`] })));
        return;
      }
      case 'date': {
        const d = new Date();
        const fmt = new Intl.DateTimeFormat('en-US', { timeZone: data.timeZone, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d);
        push(cmd, [{ segs: [fmt] }, { kind: 'dim', segs: [`${data.city} time`] }]);
        return;
      }
      case 'search': {
        const id = push(cmd, [{ kind: 'dim', segs: ['searching…'] }], true);
        getIndex()
          .then(idx => { const lines = searchLines(ef.q, idx); replace(id, lines); if (lines[0]?.kind === 'err') play('error'); })
          .catch(() => { replace(id, [{ kind: 'err', segs: ['search is offline right now'] }]); play('error'); });
        return;
      }
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    exec(value);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    const h = history.current;
    if (e.key === 'ArrowUp') {
      if (!h.length) return;
      e.preventDefault();
      if (hIdx.current === -1) { draft.current = value; hIdx.current = h.length - 1; }
      else hIdx.current = Math.max(0, hIdx.current - 1);
      setValue(h[hIdx.current]);
      return;
    }
    if (e.key === 'ArrowDown') {
      if (hIdx.current === -1) return;
      e.preventDefault();
      hIdx.current += 1;
      if (hIdx.current >= h.length) { hIdx.current = -1; setValue(draft.current); }
      else setValue(h[hIdx.current]);
      return;
    }
    if (e.key === 'Tab' && !e.shiftKey && !e.altKey && !e.ctrlKey && !e.metaKey) {
      // Only take Tab when there is something to complete; otherwise it moves focus as usual.
      if (!value.trim()) return;
      const c = complete(value, data);
      if (!c) return;
      e.preventDefault();
      play('type');
      setValue(c.value);
      if (c.options.length > 1) push(value, [{ kind: 'ring', segs: [c.options.join('  ')] }]);
      return;
    }
    if (e.ctrlKey && !e.altKey && !e.metaKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      clear();
      return;
    }
    if (e.ctrlKey && !e.altKey && !e.metaKey && (e.key === 'c' || e.key === 'C')) {
      const el = e.currentTarget;
      if (el.selectionStart !== el.selectionEnd) return; // let copy work
      e.preventDefault();
      push(value + '^C', []);
      setValue(''); hIdx.current = -1;
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      if (value) { setValue(''); hIdx.current = -1; return; }
      shell.current?.focus();
      return;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) play('type');
  }

  // Clicking the screen (not a link, not a selection) puts you back at the prompt.
  function onShellClick(e: MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('a, button, input')) return;
    if (window.getSelection()?.toString()) return;
    input.current?.focus({ preventScroll: true });
  }

  function quick(cmd: string) {
    exec(cmd);
    if (!isTouchOnly()) input.current?.focus({ preventScroll: true });
  }

  return (
    <div className={s.wrap}>
      <div className={s.term} ref={shell} tabIndex={-1} onClick={onShellClick} data-ready={ready ? 'true' : 'false'} aria-label="Terminal" role="group">
        <p className={s.bar} aria-hidden="true"><i /><i /><i /><span>devashish@nyc: ~</span></p>

        <div className={s.boot} aria-hidden="true">
          <svg className={s.loader} viewBox="0 0 48 20" width="48" height="20" focusable="false">
            <ellipse cx="24" cy="10" rx="20" ry="7" />
            <circle className={s.sun} cx="24" cy="10" r="2.4" />
            <circle className={s.planet} r="2.6" cx="0" cy="0">
              <animateMotion dur="1.1s" repeatCount="indefinite" path="M4,10 A20,7 0 1,1 44,10 A20,7 0 1,1 4,10" />
            </circle>
          </svg>
          <span>aligning rings</span>
        </div>

        <div className={s.banner}>
          <pre className={s.art} aria-hidden="true">{`   *     .     .      +
     .-~~~~~~~~~~~-.
  .'    .-~~~~~-.   `}<b>o</b>{`'.
 (    (     O     )    )
  '.    '-~~~~~-'    .'
     '-~~~~~~~~~~~-'`}</pre>
          <div className={s.who}>
            <p className={s.name}>{data.name.toLowerCase()}</p>
            <p className={s.dim}>{data.role.toLowerCase()} · {data.city.toLowerCase()}</p>
          </div>
        </div>
        <div className={s.bootlines}>
          <p><span className={s.ok}>mount</span> {banner.mount}</p>
          <p><span className={s.ok}>load </span> {banner.load}</p>
          <p><span className={s.ok}>ready</span> type <b>help</b>, or tap a command below</p>
        </div>

        <div className={s.log} role="log" aria-live="polite" aria-label="Terminal output">
          {entries.map(en => (
            <div key={en.id} className={s.entry} aria-busy={en.busy || undefined}>
              {en.cmd !== null ? (
                <p className={s.echo}><span className={s.prompt} aria-hidden="true">{PROMPT}</span> <span className="vh">Command: </span>{en.cmd}</p>
              ) : null}
              {en.lines.map((l, i) => <LineView key={i} line={l} />)}
            </div>
          ))}
        </div>

        <form className={s.form} onSubmit={onSubmit}>
          <label htmlFor="cmd-input" className={s.prompt}><span aria-hidden="true">{PROMPT}</span><span className="vh">Command</span></label>
          <input
            id="cmd-input"
            ref={input}
            className={s.input}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            aria-describedby="cmd-hint"
          />
        </form>
      </div>

      <p id="cmd-hint" className={s.hint}>Type <kbd>help</kbd>. Tab completes, ↑ ↓ for history, Esc leaves the prompt.</p>
      <div className={s.quick} role="group" aria-label="Quick commands">
        {QUICK.map(q => <button key={q} type="button" className={s.qbtn} onClick={() => quick(q)}>{q}</button>)}
      </div>
    </div>
  );
}

