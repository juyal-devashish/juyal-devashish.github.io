'use client';
// A short silent demo loop. Plays only while on screen, never on its own under
// reduced motion (Play still works), and the button pauses it for everyone.
// Without JS the poster stands in for it.
import { useEffect, useRef, useState } from 'react';
import s from './projects.module.css';

// `card` fills a project card's 16:10 thumbnail: no tilt, a round icon-only button.
type Props = { mp4: string; webm: string; poster: string; label: string; width: number; height: number; name: string; card?: boolean };

export default function Clip({ mp4, webm, poster, label, width, height, name, card }: Props) {
  const v = useRef<HTMLVideoElement>(null);
  const [chosen, setChosen] = useState<boolean | null>(null); // visitor's own choice; null follows the motion setting
  const [still, setStill] = useState(true);
  const [seen, setSeen] = useState(false);
  const playing = chosen ?? !still;

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => { setStill(mq.matches); setChosen(null); };
    setStill(mq.matches);
    mq.addEventListener('change', sync);
    const el = v.current;
    if (!el) return () => mq.removeEventListener('change', sync);
    if (!('IntersectionObserver' in window)) { setSeen(true); return () => mq.removeEventListener('change', sync); }
    const io = new IntersectionObserver(es => setSeen(es[es.length - 1].isIntersecting), { rootMargin: '200px 0px' });
    io.observe(el);
    return () => { io.disconnect(); mq.removeEventListener('change', sync); };
  }, []);

  useEffect(() => {
    const el = v.current;
    if (!el) return;
    if (playing && seen) {
      el.play().catch(e => { if (e?.name === 'NotAllowedError') setChosen(false); });
    } else if (!el.paused) el.pause();
  }, [playing, seen]);

  return (
    <div className={card ? s.cardClip : s.clip}>
      <video ref={v} muted loop playsInline preload="none" width={width} height={height} poster={poster} aria-label={label}>
        <source src={mp4} type="video/mp4" />
        <source src={webm} type="video/webm" />
      </video>
      <button type="button" className={`js-only ${s.play}`} onClick={() => setChosen(!playing)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{playing ? <path d="M9 6v12M15 6v12" /> : <path d="M8 5.5v13l11-6.5z" />}</svg>
        <span className={card ? 'vh' : undefined}>{playing ? 'Pause' : 'Play'}</span><span className="vh"> the {name} demo</span>
      </button>
    </div>
  );
}
