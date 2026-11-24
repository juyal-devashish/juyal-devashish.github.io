// Local-only sample data for checking the live widgets visually without tokens.
// Used only when DEV_FIXTURES=1 *and* not a production build, so sample numbers never ship.
import type { Calendar } from './github';
import { lastDays } from './store';

export const useFixtures = process.env.DEV_FIXTURES === '1' && process.env.NODE_ENV !== 'production';

function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

export function fixtureContributions(): Calendar | null {
  if (!useFixtures) return null;
  const r = rng(7);
  const days = lastDays(365).map((date, i) => {
    const dow = new Date(date + 'T12:00:00Z').getUTCDay();
    const x = r() * (dow === 0 || dow === 6 ? 0.6 : 1) + i / 1100;
    return { date, count: x < 0.42 ? 0 : Math.round(x * x * 11) };
  });
  return { total: days.reduce((s, d) => s + d.count, 0), days };
}
