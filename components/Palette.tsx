'use client';
// The search palette: Ctrl K / ⌘K or the magnifier. Searches /search-index.json (built by
// lib/text.ts from the site's own data), loaded the first time it is needed.
// Arrow keys move, Enter opens, Ctrl/⌘ Enter opens a new tab, Esc closes.
// Without JS (or without <dialog>) the button never appears and nothing changes.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SearchEntry } from '@/lib/text';
import { toggleTheme, themeName } from '@/lib/theme';
import { play } from '@/lib/sound';
import { announce, copyText, isMac, PALETTE_OPEN, PALETTE_READY } from './util';

type Entry = SearchEntry & { _t: string; _m: number[]; _k: string; _x: string };
type Type = SearchEntry['type'];

const INDEX_URL = '/search-index.json';
const GROUPS: [Type, string][] = [['action', 'Actions'], ['page', 'Go to'], ['project', 'Projects'], ['role', 'Work and background'], ['post', 'Writing'], ['paper', 'Stack'], ['photo', 'Photos']];
const TYPE_BONUS: Record<Type, number> = { action: 4, page: 3, project: 2, role: 1, post: 1, paper: 0, photo: 0 };
const KIND: Record<Type, string> = { action: 'Action', page: 'Page', project: 'Project', role: 'Background', post: 'Post', paper: 'Paper', photo: 'Photo' };
const MAX = 12;

// Search ignores accents and case, remembering where each folded character came
// from so matches can be highlighted in the real title.
const fold = (s?: string) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
function foldMap(s: string) {
  let out = ''; const map: number[] = [];
  for (let i = 0; i < s.length; i++) { const f = fold(s.charAt(i)); for (let j = 0; j < f.length; j++) { out += f.charAt(j); map.push(i); } }
  return { out, map };
}
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tokens = (q: string) => fold(q).split(/\s+/).filter(Boolean);

function prepare(list: SearchEntry[]): Entry[] {
  return list.map(e => {
    const t = foldMap(e.title);
    return { ...e, _t: t.out, _m: t.map, _k: fold(e.kw) + ' ' + fold(e.meta), _x: fold(e.blurb) + ' ' + fold(e.text) };
  });
}

function scoreEntry(e: Entry, toks: string[], res: RegExp[], full: string) {
  let s = 0;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i], p = e._t.indexOf(t);
    let sc: number;
    if (p === 0) sc = 100;
    else if (p > 0 && res[i].test(e._t)) sc = 80;
    else if (p > 0) sc = 50;
    else if (e._k.includes(t)) sc = 30;
    else if (t.length > 2 && e._x.includes(t)) sc = 10;
    else return -1;
    s += sc;
  }
  if (e._t === full) s += 200;
  return s + (TYPE_BONUS[e.type] ?? 0);
}

function rank(entries: Entry[], q: string): Entry[] {
  const full = fold(q).trim(), toks = tokens(q);
  let out: Entry[];
  if (!toks.length) out = entries.filter(e => e.type === 'action' || e.type === 'page');
  else {
    const res = toks.map(t => new RegExp('(^|[^a-z0-9])' + escRe(t)));
    const scored: { e: Entry; s: number; i: number }[] = [];
    entries.forEach((e, i) => { const s = scoreEntry(e, toks, res, full); if (s >= 0) scored.push({ e, s, i }); });
    scored.sort((a, b) => b.s - a.s || a.i - b.i);
    out = scored.slice(0, MAX).map(r => r.e);
  }
  // Keyboard order follows screen order (grouped).
  return GROUPS.flatMap(([type]) => out.filter(e => e.type === type));
}

function Marked({ e, toks }: { e: Entry; toks: string[] }) {
  const r: [number, number][] = [];
  toks.forEach(t => {
    let i = e._t.indexOf(t);
    while (i > -1) { r.push([e._m[i], e._m[i + t.length - 1] + 1]); i = e._t.indexOf(t, i + t.length); }
  });
  if (!r.length) return <>{e.title}</>;
  r.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [r[0]];
  r.slice(1).forEach(x => { const l = merged[merged.length - 1]; if (x[0] <= l[1]) l[1] = Math.max(l[1], x[1]); else merged.push(x); });
  const parts: React.ReactNode[] = [];
  let at = 0;
  merged.forEach((m, k) => {
    if (m[0] > at) parts.push(e.title.slice(at, m[0]));
    parts.push(<mark key={k}>{e.title.slice(m[0], m[1])}</mark>);
    at = m[1];
  });
  if (at < e.title.length) parts.push(e.title.slice(at));
  return <>{parts}</>;
}

const isExternalOnly = (e: SearchEntry) => !e.href && !!e.ext;
const isFile = (href: string) => /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('/assets/') || /\.(pdf|txt|xml|json|md)(#|$)/.test(href);

export default function Palette() {
  const router = useRouter();
  const dlg = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const loading = useRef<Promise<void> | null>(null);
  const statusTimer = useRef(0);
  const closeTimer = useRef(0);
  const scrollOnActive = useRef(false);

  const [supported, setSupported] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState('');
  const [flash, setFlash] = useState<{ id: string; text: string } | null>(null);
  const [mod, setMod] = useState('Ctrl');

  const load = useCallback(() => {
    if (loading.current) return loading.current;
    loading.current = fetch(INDEX_URL)
      .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<SearchEntry[]>; })
      .then(list => setEntries(prepare(list)))
      .catch(() => { setFailed(true); loading.current = null; });
    return loading.current;
  }, []);

  const say = useCallback((msg: string, now = false) => {
    window.clearTimeout(statusTimer.current);
    if (now) setStatus(msg);
    else statusTimer.current = window.setTimeout(() => setStatus(msg), 250);
  }, []);

  const results = useMemo(() => (entries ? rank(entries, q) : []), [entries, q]);
  const toks = useMemo(() => tokens(q), [q]);
  const current = results[active];

  // Announce result counts.
  useEffect(() => {
    if (!open) return;
    if (failed) say('Search is unavailable');
    else if (entries) say(results.length ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : 'No results');
  }, [open, failed, entries, results, say]);

  useEffect(() => { setActive(0); }, [q, entries]);

  useEffect(() => {
    if (!scrollOnActive.current) return;
    scrollOnActive.current = false;
    document.getElementById(`pal-o-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const doOpen = useCallback(() => {
    const d = dlg.current;
    if (!d || d.open) return;
    opener.current = document.activeElement;
    setQ(''); setFlash(null); setStatus('');
    d.showModal();
    setOpen(true);
    input.current?.focus();
    play('open');
    void load();
  }, [load]);

  const doClose = useCallback(() => { const d = dlg.current; if (d?.open) d.close(); }, []);

  // Feature check, keyboard shortcut, readiness signal.
  useEffect(() => {
    if (typeof HTMLDialogElement !== 'function' || !window.fetch) return;
    setSupported(true);
    setMod(isMac() ? '⌘' : 'Ctrl');
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (dlg.current?.open) doClose(); else doOpen();
      }
    };
    const warm = (e: Event) => { if ((e.target as Element | null)?.closest?.('.nav-search')) void load(); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerover', warm);
    document.addEventListener('focusin', warm);
    window.addEventListener(PALETTE_OPEN, doOpen);
    (window as unknown as { __paletteReady?: boolean }).__paletteReady = true;
    window.dispatchEvent(new Event(PALETTE_READY));
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerover', warm);
      document.removeEventListener('focusin', warm);
      window.removeEventListener(PALETTE_OPEN, doOpen);
      (window as unknown as { __paletteReady?: boolean }).__paletteReady = false;
    };
  }, [doOpen, doClose, load]);

  // Close: tidy up and give focus back.
  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    const onClose = () => {
      window.clearTimeout(closeTimer.current); window.clearTimeout(statusTimer.current);
      setOpen(false); setStatus('');
      play('close');
      const o = opener.current as HTMLElement | null;
      if (o && document.contains(o) && (document.activeElement === document.body || document.activeElement === null)) o.focus?.();
    };
    const onClick = (e: MouseEvent) => { if (e.target === d) d.close(); };
    d.addEventListener('close', onClose);
    d.addEventListener('click', onClick);
    return () => { d.removeEventListener('close', onClose); d.removeEventListener('click', onClick); };
  }, [supported]);

  function go(href: string) {
    if (isFile(href)) { window.location.href = href; return; }
    const u = new URL(href, window.location.href);
    if (u.pathname === window.location.pathname) {
      if (u.hash && u.hash !== window.location.hash) window.location.hash = u.hash;
      else if (u.hash) { window.dispatchEvent(new HashChangeEvent('hashchange')); document.getElementById(decodeURIComponent(u.hash.slice(1)))?.scrollIntoView(); }
      else window.scrollTo(0, 0);
    } else {
      router.push(u.pathname + u.search + u.hash);
    }
  }

  async function activate(e: Entry, newTab: boolean) {
    if (e.act === 'copy-email') {
      const ok = await copyText(e.value ?? '');
      play(ok ? 'copy' : 'error');
      setFlash({ id: e.id, text: ok ? 'Copied' : 'Couldn’t copy' });
      say(ok ? 'Email address copied' : 'Could not copy', true);
      window.clearTimeout(closeTimer.current);
      closeTimer.current = window.setTimeout(doClose, ok ? 700 : 1500);
      return;
    }
    if (e.act === 'theme') {
      doClose();
      const t = toggleTheme();
      play('toggle');
      announce(`${themeName(t) === 'night' ? 'Night' : 'Daybreak'} theme`);
      return;
    }
    if (isExternalOnly(e)) { window.open(e.ext, '_blank', 'noopener'); doClose(); return; }
    if (!e.href) return;
    if (newTab && !/^mailto:/.test(e.href)) { window.open(new URL(e.href, window.location.href).href, '_blank', 'noopener'); doClose(); return; }
    doClose();
    go(e.href);
  }

  function onKeyDown(ev: React.KeyboardEvent<HTMLInputElement>) {
    if (ev.nativeEvent.isComposing) return;
    const n = results.length;
    if (ev.key === 'ArrowDown' && n) { ev.preventDefault(); scrollOnActive.current = true; setActive(a => (a + 1) % n); play('type'); }
    else if (ev.key === 'ArrowUp' && n) { ev.preventDefault(); scrollOnActive.current = true; setActive(a => (a - 1 + n) % n); play('type'); }
    else if (ev.key === 'Home' && n && ev.ctrlKey) { ev.preventDefault(); scrollOnActive.current = true; setActive(0); }
    else if (ev.key === 'End' && n && ev.ctrlKey) { ev.preventDefault(); scrollOnActive.current = true; setActive(n - 1); }
    else if (ev.key === 'Enter') {
      ev.preventDefault();
      if (current) void activate(current, ev.metaKey || ev.ctrlKey);
      else play('error');
    }
  }

  function hint(e: Entry) {
    if (e.act === 'copy-email') return 'Enter copies it';
    if (e.act === 'theme') return 'Enter switches it';
    if (isExternalOnly(e)) return 'Enter opens it in a new tab ↗';
    if (e.href && /^mailto:/.test(e.href)) return 'Enter opens your mail app';
    return `Enter goes there · ${mod} Enter opens a new tab`;
  }

  if (!supported) return null;

  const hasList = !failed && !!entries && results.length > 0;
  let n = 0;

  return (
    <dialog ref={dlg} id="palette" className="palette" aria-label="Search the site">
      <div className="pal-head">
            <svg className="pal-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
            <input
              ref={input}
              className="pal-input"
              type="text"
              role="combobox"
              aria-label="Search projects, papers, photos and more"
              aria-expanded={hasList}
              aria-controls="pal-list"
              aria-autocomplete="list"
              aria-activedescendant={hasList && current ? `pal-o-${active}` : undefined}
              placeholder="Search projects, papers, photos…"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="go"
              value={q}
              onChange={ev => { setQ(ev.target.value); setFlash(null); play('type'); }}
              onKeyDown={onKeyDown}
            />
            <button type="button" className="pal-x" aria-label="Close search (Esc)" onClick={doClose}>Esc</button>
          </div>
          <div className="pal-body">
            <div className="pal-results" ref={listRef}>
              {failed ? (
                <p className="pal-empty">Search isn’t available right now. The menu still works.</p>
              ) : !entries ? (
                <p className="pal-empty">Loading…</p>
              ) : !results.length ? (
                <p className="pal-empty">Nothing matches “{q.trim()}”. Try a project, a paper, a place or a year.</p>
              ) : (
                <div id="pal-list" role="listbox" aria-label="Results">
                  {GROUPS.map(([type, label]) => {
                    const items = results.filter(e => e.type === type);
                    if (!items.length) return null;
                    return (
                      <div key={type} className="pal-g" role="group" aria-label={label}>
                        <div className="pal-gh" aria-hidden="true">{label}</div>
                        {items.map(e => {
                          const i = n++;
                          const meta = flash?.id === e.id ? flash.text : e.type === 'photo' ? e.blurb : isExternalOnly(e) ? `${e.meta} ↗` : e.meta;
                          return (
                            <div
                              key={e.id}
                              id={`pal-o-${i}`}
                              className="pal-o"
                              role="option"
                              aria-selected={i === active}
                              onPointerMove={() => { if (i !== active) setActive(i); }}
                              onClick={ev => void activate(e, ev.metaKey || ev.ctrlKey)}
                            >
                              <span className="pal-t"><Marked e={e} toks={toks} /></span>
                              <span className="pal-m">{meta}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <aside className="pal-preview" aria-hidden="true">
              {hasList && current && (
                <>
                  {current.img && <img className="pal-pimg" src={current.img} alt="" decoding="async" />}
                  <p className="pal-pk">{KIND[current.type]}</p>
                  <p className="pal-pt">{current.title}</p>
                  {current.meta && <p className="pal-pm">{current.meta}</p>}
                  {current.blurb && <p className="pal-pb">{current.blurb}</p>}
                  <p className="pal-ph">{hint(current)}</p>
                </>
              )}
            </aside>
          </div>
          <div className="pal-foot">
            <span>↑ ↓ to move</span><span>Enter to open</span><span>Esc to close</span>
          </div>
      <span className="vh" role="status">{status}</span>
    </dialog>
  );
}
