'use client';
// Counts one view per post per tab session (POST /api/views). No cookies, no identifiers:
// sessionStorage only remembers which slugs this tab already counted. Honours Do Not Track.
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ViewBeacon() {
  const path = usePathname();
  useEffect(() => {
    const m = path?.match(/^\/writing\/([^/]+)$/);
    if (!m || navigator.doNotTrack === '1' || navigator.webdriver) return;
    const key = `viewed:${m[1]}`;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch { /* storage blocked: count anyway */ }
    const body = JSON.stringify({ slug: m[1] });
    if (!navigator.sendBeacon?.('/api/views', new Blob([body], { type: 'application/json' }))) {
      fetch('/api/views', { method: 'POST', body, keepalive: true, credentials: 'omit', headers: { 'Content-Type': 'application/json' } }).catch(() => {});
    }
  }, [path]);
  return null;
}
