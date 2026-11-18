'use client';
// The home hero's background: a still of the aurora, with the timelapse loop over it.
// The still is the loop's first frame, so it is what loads first, what shows without JS, and
// what stays under reduced motion, with Save-Data and for automated browsers.
// The loop plays muted, only while the hero is on screen, and Pause is always offered (WCAG 2.2.2);
// a pause is remembered in this browser.
import { useEffect, useRef, useState } from 'react';
import h from './home.module.css';

const STILL = { wide: '/assets/img/hero/aurora-wide.jpg', tall: '/assets/img/hero/aurora-tall.jpg' };
const LOOP = {
  wide: { webm: '/assets/video/hero-aurora-wide.webm', mp4: '/assets/video/hero-aurora-wide.mp4' },
  tall: { webm: '/assets/video/hero-aurora-tall.webm', mp4: '/assets/video/hero-aurora-tall.mp4' },
};
const NARROW = '(max-width: 700px)'; // matches the tall crop in app/page.module.css
const PAUSED_KEY = 'hero-video';

type Size = keyof typeof LOOP;

function storedPause(): boolean {
  try { return localStorage.getItem(PAUSED_KEY) === 'paused'; } catch { return false; }
}

function storePause(paused: boolean) {
  try {
    if (paused) localStorage.setItem(PAUSED_KEY, 'paused');
    else localStorage.removeItem(PAUSED_KEY);
  } catch {}
}

export default function HeroArt({ className }: { className: string }) {
  const v = useRef<HTMLVideoElement>(null);
  const [size, setSize] = useState<Size | null>(null); // null until mounted: no video on the server
  const [allowed, setAllowed] = useState(false);       // motion allowed, not Save-Data, not a bot
  const [paused, setPaused] = useState(false);
  const [seen, setSeen] = useState(true);
  const [shown, setShown] = useState(false);           // fades the video in once it is actually playing

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = window.matchMedia(NARROW);
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const sync = () => setAllowed(
      !motion.matches && !conn?.saveData && !navigator.webdriver,
    );
    setSize(narrow.matches ? 'tall' : 'wide');
    setPaused(storedPause());
    sync();
    motion.addEventListener('change', sync);
    return () => motion.removeEventListener('change', sync);
  }, []);

  // Only play while the hero is on screen.
  useEffect(() => {
    const el = v.current;
    if (!el || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => setSeen(es[es.length - 1].isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [allowed, size]);

  const playing = allowed && !paused && seen;
  useEffect(() => {
    const el = v.current;
    if (!el) return;
    if (playing) el.play()?.catch(() => setPaused(true)); // autoplay refused: show the still and offer Play
    else if (!el.paused) el.pause();
  }, [playing, allowed, size]);

  const toggle = () => {
    const next = !paused;
    setPaused(next);
    storePause(next);
  };

  return (
    <>
      <div className={className}>
        <picture>
          <source media={NARROW} srcSet={STILL.tall} width={720} height={960} />
          <img src={STILL.wide} alt="" width={1920} height={1080} fetchPriority="high" />
        </picture>
        {allowed && size && (
          <video
            key={size}
            ref={v}
            className={shown ? h.heroOn : h.heroOff}
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
            onPlaying={() => setShown(true)}
          >
            <source src={LOOP[size].webm} type="video/webm" />
            <source src={LOOP[size].mp4} type="video/mp4" />
          </video>
        )}
      </div>
      {allowed && size && (
        <button type="button" className={`${h.play} ${h.heroPlay}`} onClick={toggle}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{paused ? <path d="M7 4.5v15l12-7.5z" /> : <path d="M8 5v14M16 5v14" />}</svg>
          <span className="vh">{paused ? 'Play' : 'Pause'} the aurora video</span>
        </button>
      )}
    </>
  );
}
