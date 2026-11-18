'use client';
// Local time where I am. Renders nothing on the server or without JS.
import { useEffect, useState } from 'react';
import { site } from '@/lib/site';

export default function Clock({ prefix = '' }: { prefix?: string }) {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: site.timeZone, hour: 'numeric', minute: '2-digit' });
    const tick = () => setT(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);
  if (!t) return null;
  return <span className="clock mono">{prefix}{t} in {site.city}</span>;
}
