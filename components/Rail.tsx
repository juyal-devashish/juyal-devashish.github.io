'use client';
// The orbit rail: a vertical nav on desktop, a bottom bar on phones.
// Alt+1..7 jump between pages (e.code, so Option works on macOS).
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { nav } from '@/lib/site';
import { play } from '@/lib/sound';
import { isTyping } from './util';

export function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function Rail() {
  const pathname = usePathname() ?? '/';
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.isComposing || isTyping(e)) return;
      const m = /^Digit([1-9])$/.exec(e.code);
      if (m) {
        const item = nav[+m[1] - 1];
        if (!item) return;
        e.preventDefault();
        play('nav');
        router.push(item.href);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [router]);

  return (
    <nav className="rail" aria-label="Main">
      <ol>
        {nav.map((n, i) => {
          const current = isActive(pathname, n.href);
          return (
            <li key={n.href} className={n.href === '/resume' ? 'opt' : undefined}>
              <Link
                href={n.href}
                aria-current={current ? 'page' : undefined}
                aria-keyshortcuts={`Alt+${i + 1}`}
                onClick={() => { if (!current) play('nav'); }}
              >
                <span className="node" aria-hidden="true" />
                <span className="lbl">{n.label} <kbd aria-hidden="true">⌥{i + 1}</kbd></span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
