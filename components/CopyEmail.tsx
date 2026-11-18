'use client';
// "Copy email" button (hidden without JS; the mailto link next to it always works).
import { useRef, useState } from 'react';
import { site } from '@/lib/site';
import { play } from '@/lib/sound';
import { announce, copyText } from './util';

export default function CopyEmail({ className = 'hbtn' }: { className?: string }) {
  const [label, setLabel] = useState('Copy email');
  const t = useRef(0);
  return (
    <button
      type="button"
      className={`${className} js-only`}
      onClick={async () => {
        const ok = await copyText(site.email);
        play(ok ? 'copy' : 'error');
        announce(ok ? 'Email address copied' : 'Could not copy');
        setLabel(ok ? 'Copied' : 'Couldn’t copy');
        window.clearTimeout(t.current);
        t.current = window.setTimeout(() => setLabel('Copy email'), 1800);
      }}
    >
      {label}
    </button>
  );
}
