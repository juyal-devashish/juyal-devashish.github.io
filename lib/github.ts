// GitHub contribution calendar.
// With GITHUB_TOKEN (fine-grained PAT, public read is enough): the GraphQL API, any date range.
// Without it: the public calendar page (github.com/users/<login>/contributions). A range inside one calendar
// year is fetched with ?from=YYYY-01-01&to=YYYY-12-31; any other range gets the rolling last ~12 months.
// A range the page does not fully cover returns null, so a partial year never shows as a whole one.
// Private-repo counts appear only if "Private contributions" is on in the GitHub profile settings.
export const GITHUB_LOGIN = 'juyal-devashish';
/** The site shows a rolling window: the last 6 months, ending today (New York), refreshed hourly. */
export const RECENT_MONTHS = 6;
export const RECENT_WEEKS = 28; // enough calendar columns to hold any 6-month window
export const RECENT_LABEL = 'last 6 months';

export type ContribDay = { date: string; count: number };
export type Calendar = { total: number; days: ContribDay[] };

export async function getContributions(from?: Date, to?: Date): Promise<Calendar | null> {
  return process.env.GITHUB_TOKEN ? fromApi(process.env.GITHUB_TOKEN, from, to) : fromPublicPage(from, to);
}

/** Contributions from the same day RECENT_MONTHS ago up to today (New York dates). */
export async function getRecentContributions(now: Date = new Date()): Promise<Calendar | null> {
  const [y, m, d] = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1 - RECENT_MONTHS, d));
  if (start.getUTCMonth() !== (((m - 1 - RECENT_MONTHS) % 12) + 12) % 12) start.setUTCDate(0); // e.g. Apr 31 → Apr 30
  const end = new Date(Date.UTC(y, m - 1, d, 23, 59, 59));
  return getContributions(start, end);
}

async function fromApi(token: string, from?: Date, to?: Date): Promise<Calendar | null> {
  const query = `query($login:String!,$from:DateTime,$to:DateTime){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{totalContributions weeks{contributionDays{date contributionCount}}}}}}`;
  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { login: GITHUB_LOGIN, from: from?.toISOString(), to: to?.toISOString() } }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const json = await res.json();
    const cal = json?.data?.user?.contributionsCollection?.contributionCalendar;
    if (!cal) throw new Error(`GitHub: ${JSON.stringify(json?.errors ?? json).slice(0, 200)}`);
    return {
      total: cal.totalContributions,
      days: cal.weeks.flatMap((w: { contributionDays: { date: string; contributionCount: number }[] }) =>
        w.contributionDays.map(d => ({ date: d.date, count: d.contributionCount }))),
    };
  } catch (e) {
    console.error(e);
    return null;
  }
}

/** Parse GitHub's public calendar HTML: each <td id=… data-date=…> has a <tool-tip for=id>"N contributions on …"</tool-tip>. */
export function parseCalendarHtml(html: string): ContribDay[] {
  const dateById = new Map<string, string>();
  for (const m of html.matchAll(/<td\b[^>]*>/g)) {
    const date = m[0].match(/data-date="(\d{4}-\d{2}-\d{2})"/)?.[1];
    const id = m[0].match(/\bid="([^"]+)"/)?.[1];
    if (date && id) dateById.set(id, date);
  }
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const date = dateById.get(m[1]);
    if (!date) continue;
    const n = m[2].match(/^([\d,]+) contributions?/);
    counts.set(date, n ? Number(n[1].replace(/,/g, '')) : 0);
  }
  return [...dateById.values()].sort().map(date => ({ date, count: counts.get(date) ?? 0 }));
}

async function fromPublicPage(from?: Date, to?: Date): Promise<Calendar | null> {
  try {
    const lo = from?.toISOString().slice(0, 10) ?? '', hi = to?.toISOString().slice(0, 10) ?? '9999';
    // The page only takes ranges within one calendar year; ask for the whole year and trim below.
    const y = lo.slice(0, 4);
    const range = lo && y === hi.slice(0, 4) ? `?from=${y}-01-01&to=${y}-12-31` : '';
    const res = await fetch(`https://github.com/users/${GITHUB_LOGIN}/contributions${range}`, {
      headers: { Accept: 'text/html' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`GitHub public calendar ${res.status}`);
    const all = parseCalendarHtml(await res.text());
    if (!all.length) throw new Error('GitHub public calendar: no days found (markup changed?)');
    if (lo && all[0].date > lo) return null; // the page does not reach back to `from`: no partial data
    const days = all.filter(d => d.date >= lo && d.date <= hi);
    if (!days.length) return null;
    return { total: days.reduce((t, d) => t + d.count, 0), days };
  } catch (e) {
    console.error(e);
    return null;
  }
}
