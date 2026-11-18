// Page views. Two sources, no cookies and no IP addresses either way:
//  1. Vercel Web Analytics (preferred): GET /v1/query/web-analytics/visits/count
//     Env: VERCEL_ANALYTICS_TOKEN, VERCEL_PROJECT_ID, optional VERCEL_TEAM_ID.
//     Production page views only, counted since Web Analytics was enabled.
//  2. Fallback when that API isn't set up: an Upstash counter per post and year,
//     bumped by a tiny beacon on /writing/<slug> pages (POST /api/views).
import { incr, getMany, storeConfigured } from './store';

export type Views = { pageviews: number; visitors?: number; source: 'vercel' | 'posts' };

const TOKEN = process.env.VERCEL_ANALYTICS_TOKEN;
const PROJECT = process.env.VERCEL_PROJECT_ID;
const TEAM = process.env.VERCEL_TEAM_ID;

export const analyticsApiConfigured = Boolean(TOKEN && PROJECT);
/** The beacon runs only when the API can't answer and the store can count. */
export const viewsBeaconOn = !analyticsApiConfigured && storeConfigured;

const yearKey = (year: number) => `views:${year}`;
const postKey = (year: number, slug: string) => `views:${year}:post:${slug}`;

/** Site-wide page views for one calendar year (UTC bounds) from Vercel Web Analytics. */
export async function siteViews(year: number): Promise<Views | null> {
  if (!analyticsApiConfigured) return null;
  const q = new URLSearchParams({ projectId: PROJECT!, since: `${year}-01-01T00:00:00.000Z`, until: `${year}-12-31T23:59:59.999Z` });
  if (TEAM) q.set('teamId', TEAM);
  try {
    const res = await fetch(`https://api.vercel.com/v1/query/web-analytics/visits/count?${q}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Vercel analytics ${res.status}`);
    const json = (await res.json()) as { data?: { pageviews?: unknown; visitors?: unknown } };
    const pv = json.data?.pageviews;
    if (typeof pv !== 'number') return null;
    return { pageviews: pv, visitors: typeof json.data?.visitors === 'number' ? (json.data.visitors as number) : undefined, source: 'vercel' };
  } catch (e) {
    console.error(e);
    return null;
  }
}

/** Fallback total: post views counted by the beacon in that year. */
export async function postViews(year: number): Promise<Views | null> {
  if (analyticsApiConfigured || !storeConfigured) return null;
  const [n] = await getMany<number>([yearKey(year)]);
  return typeof n === 'number' && n > 0 ? { pageviews: n, source: 'posts' } : null;
}

/** Best available view count for a year, or null. */
export async function viewsFor(year: number): Promise<Views | null> {
  return (await siteViews(year)) ?? (await postViews(year));
}

/** Count one view of a post (called by POST /api/views). */
export async function countPostView(slug: string, year: number): Promise<boolean> {
  if (!viewsBeaconOn) return false;
  const [a, b] = await Promise.all([incr(postKey(year, slug)), incr(yearKey(year))]);
  return a !== null && b !== null;
}
