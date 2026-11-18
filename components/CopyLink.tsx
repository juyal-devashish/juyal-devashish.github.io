'use client';
// "Copy link" for a section: copies this page's URL + #id and announces it.
import { useRef, useState } from 'react';
import { play } from '@/lib/sound';
import { announce, copyText } from './util';

export default function CopyLink({ id, label }: { id: string; label: string }) {
  const [done, setDone] = useState<null | boolean>(null);
  const t = useRef(0);
  return (
    <button
      type="button"
      className="ibtn compact copy-link js-only"
      aria-label={`Copy link to ${label}`}
      onClick={async () => {
        const url = `${location.origin}${location.pathname}#${id}`;
        const ok = await copyText(url);
        play(ok ? 'copy' : 'error');
        announce(ok ? 'Link copied' : 'Could not copy the link');
        setDone(ok);
        window.clearTimeout(t.current);
        t.current = window.setTimeout(() => setDone(null), 1800);
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {done ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></>}
      </svg>
      <span className="ibtn-lbl" aria-hidden="true">{done === null ? 'Copy link' : done ? 'Copied' : 'Couldn’t copy'}</span>
    </button>
  );
}
