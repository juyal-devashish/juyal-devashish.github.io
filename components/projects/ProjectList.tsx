'use client';
// The project cards on /projects, with Details panels and Expand all.
// Without JS every panel is open (the CSS only collapses them under html.js)
// and the toggle buttons are hidden. #id links open the matching project.
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import type { Project } from '@/lib/site';
import Lightbox, { type LightboxItem } from '@/components/Lightbox';
import Clip from './Clip';
import { play } from '@/lib/sound';
import s from './projects.module.css';
import { Links, Meta, Notes } from './parts';

const hasDetails = (p: Project) => !!(p.notes || p.shot);
// Rendered widths (measured): a closed card's thumbnail is at most ~370px wide (one column up to 700px);
// an open card's screenshot at most ~650px. Retina screens get 2x from these.
const CARD = '(min-width: 1100px) 380px, (min-width: 700px) 50vw, 100vw';
const SHOT = '(min-width: 1100px) 660px, (min-width: 900px) 58vw, 100vw';

export default function ProjectList({ list }: { list: Project[] }) {
  const toggleable = list.filter(hasDetails).map(p => p.id);
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const allOpen = toggleable.length > 0 && toggleable.every(id => open.has(id));

  const shots: (LightboxItem & { pid: string })[] = list.filter(p => p.shot).map(p => ({ pid: p.id, src: p.shot!.src, alt: p.shot!.alt, caption: p.name, width: p.shot!.width, height: p.shot!.height }));

  const set = useCallback((id: string, on: boolean) => {
    setOpen(prev => {
      if (prev.has(id) === on) return prev;
      const n = new Set(prev);
      if (on) n.add(id); else n.delete(id);
      return n;
    });
  }, []);

  // #id deep links: on load, on hashchange (the palette fires it for same-page jumps).
  useEffect(() => {
    const ids = new Set(toggleable);
    const check = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id || !ids.has(id)) return;
      set(id, true);
      // the card grows to full width when open; bring it back into view once laid out
      requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' })));
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleable.join(' '), set]);

  // Print with everything open.
  useEffect(() => {
    const before = () => setOpen(new Set(toggleable));
    window.addEventListener('beforeprint', before);
    return () => window.removeEventListener('beforeprint', before);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleable.join(' ')]);

  return (
    <>
      <div className={`js-only ${s.tools}`}>
        <button
          type="button"
          className="ibtn"
          onClick={() => { setOpen(allOpen ? new Set() : new Set(toggleable)); play('toggle'); }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">{allOpen ? <path d="M7 14l5-5 5 5" /> : <path d="M7 10l5 5 5-5" />}</svg>
          <span className="ibtn-lbl">{allOpen ? 'Collapse all' : 'Expand all'}</span>
        </button>
      </div>

      <div className={s.grid}>
        {list.map(p => {
          const isOpen = open.has(p.id);
          const details = hasDetails(p);
          const landscape = p.shot && p.shot.width > p.shot.height;
          const cover = landscape ? p.shot!.src : p.thumb;
          const si = shots.findIndex(x => x.pid === p.id);
          return (
            <article key={p.id} id={p.id} className={[s.card, isOpen && s.open, p.shot && s.hasShot].filter(Boolean).join(' ')} aria-labelledby={`${p.id}-name`}>
              {p.video ? (
                <div className={s.thumb}><Clip {...p.video} name={p.name} card /></div>
              ) : cover ? (
                <div className={s.thumb}>
                  <Image src={cover} alt="" width={landscape ? p.shot!.width : 1280} height={landscape ? p.shot!.height : 800} quality={90} sizes={CARD} />
                </div>
              ) : null}
              <div className={s.body}>
                <Meta p={p} />
                <h2 id={`${p.id}-name`} className={s.name}>{p.name}</h2>
                <p className={s.sum}>{p.summary}</p>
                {p.role ? <p className={s.role}>{p.role}</p> : null}
                <Links p={p} />
                {details && (
                  <button
                    type="button"
                    className={`js-only ibtn ${s.toggle}`}
                    aria-expanded={isOpen}
                    aria-controls={`${p.id}-more`}
                    onClick={() => { set(p.id, !isOpen); play(isOpen ? 'close' : 'open'); }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">{isOpen ? <path d="M6 12h12" /> : <path d="M6 12h12M12 6v12" />}</svg>
                    <span>{isOpen ? 'Hide details' : 'Details'}</span><span className="vh">: {p.name}</span>
                  </button>
                )}
              </div>
              {details && (
                <div id={`${p.id}-more`} className={p.shot && p.shot.height > p.shot.width ? `${s.more} ${s.tall}` : s.more}>
                  {p.shot && (
                    <a className={s.shot} href={p.shot.src} data-lightbox="shots" data-index={si}>
                      <Image src={p.shot.src} alt={p.shot.alt} width={p.shot.width} height={p.shot.height} quality={90} sizes={SHOT} />
                      <span className="vh"> (opens larger)</span>
                    </a>
                  )}
                  <Notes p={p} />
                </div>
              )}
            </article>
          );
        })}
      </div>
      <Lightbox group="shots" items={shots.map(({ pid: _pid, ...it }) => it)} label="Screenshot viewer" />
    </>
  );
}

