'use client';
// A short silent demo loop. Plays only while on screen and never by itself under reduced motion
// (the poster shows and Play is offered). Without JS the poster stands in for it.
import { useEffect, useRef, useState } from 'react';
import s from './home.module.css';

// `card` fills a project card's thumbnail (icon-only button above the card's stretched link); `name` names the project.
type Props = { mp4: string; webm: string; poster: string; label: string; width: number; height: number; className?: string; name?: string; card?: boolean };

export default function DemoClip({ mp4, webm, poster, label, width, height, className, name, card }: Props) {
  const v = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [chosen, setChosen] = useState<boolean | null>(null); // the visitor's own Play/Pause; null follows the motion setting
  const [still, setStill] = useState(true);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => { setStill(mq.matches); setChosen(null); };
    setStill(mq.matches);
    mq.addEventListener('change', sync);
    let io: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window && v.current) {
      io = new IntersectionObserver(es => setSeen(es[es.length - 1].isIntersecting), { rootMargin: '200px 0px' });
      io.observe(v.current);
    } else setSeen(true);
    setReady(true);
    return () => { mq.removeEventListener('change', sync); io?.disconnect(); };
  }, []);

  const wanted = chosen ?? !still;
  useEffect(() => {
    const el = v.current;
    if (!el || !ready) return;
    if (wanted && seen) {
      el.play()?.catch(e => { if (e?.name === 'NotAllowedError') setChosen(false); });
    } else if (!el.paused) el.pause();
  }, [wanted, seen, ready]);

  return (
    <div className={`${card ? s.cardClip : s.clip} ${className ?? ''}`}>
      <video ref={v} muted loop playsInline preload="none" width={width} height={height} poster={poster} aria-label={label}>
        <source src={mp4} type="video/mp4" />
        <source src={webm} type="video/webm" />
      </video>
      <button type="button" className={s.play} hidden={!ready} onClick={() => setChosen(!wanted)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{wanted ? <path d="M8 5v14M16 5v14" /> : <path d="M7 4.5v15l12-7.5z" />}</svg>
        <span className={card ? 'vh' : s.playLbl}>{wanted ? 'Pause' : 'Play'} the {name ? `${name} ` : ''}demo</span>
      </button>
    </div>
  );
}
