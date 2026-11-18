'use client';
// Top-right cluster: search (shown once the palette works) and interface sounds.
// Without JS the whole cluster is hidden (none of it would work).
import { useEffect, useRef, useState } from 'react';
import { onSoundChange, play, setSoundOn, soundOn } from '@/lib/sound';
import { isMac, openPalette, paletteReady, PALETTE_READY } from './util';

export default function Controls() {
  const [ready, setReady] = useState(false);
  const [sound, setSound] = useState(false);
  const [key, setKey] = useState('Ctrl K');
  const [away, setAway] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    setKey(isMac() ? '⌘K' : 'Ctrl K');
    setSound(soundOn());
    if (paletteReady()) setReady(true);
    const onReady = () => setReady(true);
    window.addEventListener(PALETTE_READY, onReady);
    const offS = onSoundChange(setSound);
    return () => { window.removeEventListener(PALETTE_READY, onReady); offS(); };
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
