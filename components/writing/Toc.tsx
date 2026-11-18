'use client';
// "On this page" for long posts. Plain links without JS; with JS it marks the heading you're reading.
import { useEffect, useState } from 'react';
import type { TocItem } from './article';
import s from './writing.module.css';

export default function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = items.map(i => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    if (!els.length) return;
    const pick = () => {
      const line = window.innerHeight * 0.3;
      let cur: string | null = null;
      for (const el of els) if (el.getBoundingClientRect().top <= line) cur = el.id;
      setActive(cur);
    };
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(pick); };
    pick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, [items]);

  return (
    <nav className={s.toc} id="toc" aria-labelledby="toc-h">
      <p className="label" id="toc-h">On this page</p>
      <ol>
        {items.map(i => (
          <li key={i.id} className={i.level === 3 ? s.sub : undefined}>
            <a href={`#${i.id}`} aria-current={active === i.id ? 'location' : undefined}>{i.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
