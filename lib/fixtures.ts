// Local-only sample data for checking the live widgets visually without tokens.
// Used only when DEV_FIXTURES=1 *and* not a production build, so sample numbers never ship.
import type { Calendar } from './github';
import { sumHourly, type CodingDay, type CodingWeek } from './coding';
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

// A day's hours spread over a morning block and an evening block (New York time); sums to hours * 3600.
const SHAPE = [0, 0, 0, 0, 0, 0, 0, 0, 0, .2, .7, 1, .8, .3, .6, 1, .9, .5, .2, .1, .4, .8, .6, .2];
function spread(hours: number, shift: number): number[] {
  const w = SHAPE.map((_, h) => SHAPE[(h - shift + 24) % 24]);
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map(x => Math.round((x / sum) * hours * 3600));
}

export function fixtureCoding(): CodingDay[] | null {
  if (!useFixtures) return null;
  const hrs = [3.2, 5.8, 4.1, 6.6, 2.4, 1.1, 4.9];
  const langs = ['TypeScript', 'Python', 'CSS', 'Markdown'];
  return lastDays(7).map((date, i) => ({
    date,
    hours: hrs[i],
    languages: langs.map((name, j) => ({ name, hours: Math.round(hrs[i] * [0.5, 0.3, 0.12, 0.08][j] * 10) / 10 })),
    hourly: spread(hrs[i], [0, 1, -1, 0, 2, 1, 0][i]),
  }));
}

export function fixtureCodingWeek(): CodingWeek | null {
  const days = fixtureCoding();
  return days ? { days, hourly: sumHourly(days), hourlyDays: days.length } : null;
}
