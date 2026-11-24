// "2026, so far": the year in data, from real sources only.
// Each part is null when its source has nothing, and the page leaves that section out.
// Relative imports only: lib/text.ts imports this, and the node test resolver doesn't know `@/`.
import { getContributions, type ContribDay } from './github';
import { dayKey } from './store';
import { projects, type Project } from './site';
import { papers, type Paper } from './papers';
import { getPosts, type Post } from './posts';
import { viewsFor, type Views } from './views';
import { useFixtures } from './fixtures';

export const FIRST_YEAR = 2024;
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** The current year in New York. */
export const currentYear = () => +dayKey().slice(0, 4);

/** "2026" → 2026 when it is a 4-digit year from 2024 to now; otherwise null. */
export function parseYear(s: string | undefined): number | null {
  if (!s || !/^\d{4}$/.test(s)) return null;
  const y = +s;
  return y >= FIRST_YEAR && y <= lastYear() ? y : null;
}

// Year pages exist only for the years built at deploy time (dynamicParams = false), so links
// stop at the build's year (next.config.ts inlines it) until the next deploy.
const lastYear = () => Math.min(currentYear(), Number(process.env.SITE_BUILD_YEAR) || Infinity);
export const allYears = () => Array.from({ length: lastYear() - FIRST_YEAR + 1 }, (_, i) => FIRST_YEAR + i);

/** Every date of `year` up to `through` (inclusive), as YYYY-MM-DD. */
export function yearDates(year: number, through: string): string[] {
  const out: string[] = [];
  for (let t = Date.UTC(year, 0, 1); ; t += 86_400_000) {
    const d = new Date(t).toISOString().slice(0, 10);
    if (d > through || !d.startsWith(String(year))) break;
    out.push(d);
  }
  return out;
}

const utc = (iso: string) => new Date(iso + 'T12:00:00Z');
export const fmtDay = (iso: string) => utc(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
export const fmtRange = (a: string, b: string) => (a === b ? fmtDay(a) : `${fmtDay(a)} – ${fmtDay(b)}`);

// ---------- moments (pure, tested in tests/year.test.ts) ----------
export type Moment = { kind: 'streak' | 'month' | 'day' | 'quiet'; from: string; to: string; title: string; caption: string; value: number };

type Run = { from: string; to: string; len: number };
function longestRun(days: ContribDay[], match: (d: ContribDay) => boolean): Run | null {
  let best: Run | null = null, start = -1;
  days.forEach((d, i) => {
    if (match(d)) {
      if (start < 0) start = i;
      const len = i - start + 1;
      if (!best || len > best.len) best = { from: days[start].date, to: d.date, len };
    } else start = -1;
  });
  return best;
}

/** Monthly contribution totals (12 entries; months not reached yet are 0). */
export function byMonth(days: ContribDay[]): number[] {
  const m = Array(12).fill(0);
  for (const d of days) m[+d.date.slice(5, 7) - 1] += d.count;
  return m;
}

/**
 * Pick 2–4 notable moments from a year of daily counts (sorted, no future days).
 * Longest streak (≥2 days), busiest month, busiest day, longest quiet stretch (≥7 days, only
 * when there was activity). Ties go to the earliest. Returns [] when there is nothing to say.
 * `through` marks an ongoing quiet stretch that runs up to today.
 */
export function pickMoments(days: ContribDay[], through?: string): Moment[] {
  const total = days.reduce((s, d) => s + d.count, 0);
  if (!days.length || !total) return [];
  const out: Moment[] = [];
  const n = (x: number) => x.toLocaleString('en-US');

  const streak = longestRun(days, d => d.count > 0);
  if (streak && streak.len >= 2) {
    out.push({ kind: 'streak', from: streak.from, to: streak.to, value: streak.len, title: 'Longest streak', caption: `${streak.len} days in a row, ${fmtRange(streak.from, streak.to)}` });
  }

  const months = byMonth(days);
  const mi = months.indexOf(Math.max(...months));
  const y = days[0].date.slice(0, 4);
  const mFrom = `${y}-${String(mi + 1).padStart(2, '0')}-01`;
  const inMonth = days.filter(d => d.date.startsWith(mFrom.slice(0, 7)));
  out.push({ kind: 'month', from: inMonth[0].date, to: inMonth[inMonth.length - 1].date, value: months[mi], title: 'Busiest month', caption: `${MONTHS[mi]}: ${n(months[mi])} contributions` });

  let best = days[0];
  for (const d of days) if (d.count > best.count) best = d;
  out.push({ kind: 'day', from: best.date, to: best.date, value: best.count, title: 'Busiest day', caption: `${fmtDay(best.date)}: ${n(best.count)} contributions` });

  const quiet = longestRun(days, d => d.count === 0);
  if (quiet && quiet.len >= 7) {
    const ongoing = through != null && quiet.to === through;
    out.push({ kind: 'quiet', from: quiet.from, to: quiet.to, value: quiet.len, title: ongoing ? 'Quiet lately' : 'Quiet stretch', caption: ongoing ? `${quiet.len} days with none, since ${fmtDay(quiet.from)}` : `${quiet.len} days with none, ${fmtRange(quiet.from, quiet.to)}` });
  }

  return out.sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
}

// ---------- the year ----------
export type GitHubYear = {
  days: ContribDay[]; total: number; streak: number; busiestWeekday: string | null; activeDays: number;
  months: number[]; moments: Moment[];
};
export type YearData = {
  year: number; current: boolean; through: string;
  github: GitHubYear | null;
  posts: Post[]; projects: Project[]; papers: Paper[]; views: Views | null;
};

export function summarizeGitHub(days: ContribDay[], through?: string): GitHubYear | null {
  if (!days.length) return null;
  const total = days.reduce((s, d) => s + d.count, 0);
  const wd = Array(7).fill(0);
  days.forEach(d => { wd[utc(d.date).getUTCDay()] += d.count; });
  return {
    days, total,
    streak: longestRun(days, d => d.count > 0)?.len ?? 0,
    busiestWeekday: total ? WEEKDAYS[wd.indexOf(Math.max(...wd))] : null,
    activeDays: days.filter(d => d.count > 0).length,
    months: byMonth(days),
    moments: pickMoments(days, through),
  };
}

/** Static parts of the year (no network): posts, projects and papers read that year. */
export function yearStatic(year: number) {
  const y = String(year);
  return {
    posts: getPosts().filter(p => p.date.startsWith(y)),
    projects: projects.filter(p => p.year === y),
    // Only papers with a known read date (`readOn`); `date` is often the publication date.
    papers: papers.filter(p => p.read && !!p.readOn && new RegExp(`\\b${y}\\b`).test(p.readOn)),
  };
}

export async function getYear(year: number): Promise<YearData> {
  const today = dayKey();
  const current = year === +today.slice(0, 4);
  const through = current ? today : `${year}-12-31`;
  const dates = yearDates(year, through);

  // Fixed bounds (end of today, or end of year) keep GitHub's request stable for the cache.
  const [cal, views] = await Promise.all([
    getContributions(new Date(`${year}-01-01T00:00:00Z`), new Date(`${through}T23:59:59Z`)),
    viewsFor(year),
  ]);

  const ghDays = (cal?.days ?? fixtureDays(dates)).filter(d => d.date >= dates[0] && d.date <= through).sort((a, b) => a.date.localeCompare(b.date));

  return {
    year, current, through,
    github: cal || useFixtures ? summarizeGitHub(ghDays, current ? through : undefined) : null,
    views: views ?? (useFixtures ? { pageviews: 18_420, visitors: 6_105, source: 'vercel' } : null),
    ...yearStatic(year),
  };
}

// ---------- local-only sample data (DEV_FIXTURES=1, never in production) ----------
function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}
function fixtureDays(dates: string[]): ContribDay[] {
  if (!useFixtures) return [];
  const r = rng(11);
  return dates.map((date, i) => {
    const dow = utc(date).getUTCDay();
    const quiet = i > 150 && i < 172; // a quiet stretch to annotate
    const x = quiet ? 0 : r() * (dow === 0 || dow === 6 ? 0.6 : 1) + i / 900;
    return { date, count: x < 0.4 ? 0 : Math.round(x * x * 12) };
  });
}
