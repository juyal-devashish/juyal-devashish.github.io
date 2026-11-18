'use client';
// Top-right cluster: search (shown once the palette works), theme, interface sounds.
// Without JS the whole cluster is hidden (none of it would work).
import { useEffect, useRef, useState } from 'react';
import { currentTheme, onThemeChange, toggleTheme, themeName, type Theme } from '@/lib/theme';
import { onSoundChange, play, setSoundOn, soundOn } from '@/lib/sound';
import { announce, isMac, openPalette, paletteReady, PALETTE_READY } from './util';

export default function Controls() {
  const [ready, setReady] = useState(false);
  const [theme, setThemeState] = useState<Theme | null>(null);
  const [sound, setSound] = useState(false);
  const [key, setKey] = useState('Ctrl K');
  const [away, setAway] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    setKey(isMac() ? '⌘K' : 'Ctrl K');
    setThemeState(currentTheme());
    setSound(soundOn());
    if (paletteReady()) setReady(true);
    const onReady = () => setReady(true);
    window.addEventListener(PALETTE_READY, onReady);
    const offT = onThemeChange(setThemeState);
    const offS = onSoundChange(setSound);
    return () => { window.removeEventListener(PALETTE_READY, onReady); offT(); offS(); };
  }, []);

  // Phones: slide away while scrolling down, come back on scroll up or focus.
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const narrow = window.innerWidth <= 600;
      if (!narrow || y < 120 || y < lastY - 4 || ref.current?.contains(document.activeElement)) setAway(false);
      else if (y > lastY + 4) setAway(true);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const next = theme ? (theme === 'light' ? 'night' : 'daybreak') : null;

  return (
    <aside ref={ref} className={`util${away ? ' away' : ''}`} aria-label="Site controls" onFocus={() => setAway(false)}>
      <button
        type="button"
        className={`nav-search${ready ? ' ready' : ''}`}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        aria-label="Search the site"
        title={`Search (${key})`}
        onClick={() => { if (ready) openPalette(); }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
        <span className="s-lbl" aria-hidden="true">Search</span>
        <kbd className="k" aria-hidden="true">{key}</kbd>
      </button>
      <button
        type="button"
        className="theme-btn"
        aria-label={next ? `Switch to ${next} theme` : 'Switch theme'}
        aria-keyshortcuts="Alt+T"
        title="Theme (Alt T)"
        onClick={() => { const t = toggleTheme(); play('toggle'); announce(`${themeName(t) === 'night' ? 'Night' : 'Daybreak'} theme`); }}
      >
        <span className="theme-ico" aria-hidden="true">
          <svg className="sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
          <svg className="moon" viewBox="0.32 -0.32 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>
        </span>
      </button>
      <button
        type="button"
        className="snd"
        aria-pressed={sound}
        aria-label="Interface sounds"
        title="Interface sounds"
        onClick={() => { const on = !sound; setSoundOn(on); setSound(on); if (on) play('toggle'); }}
      >
        <svg className="snd-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" /></svg>
        <svg className="snd-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="m17 9 5 6M22 9l-5 6" /></svg>
      </button>
    </aside>
  );
}
