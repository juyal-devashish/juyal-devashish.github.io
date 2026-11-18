// Coding time, optional. Works with WakaTime or a WakaTime-compatible server (e.g. Wakapi).
// Env: WAKATIME_API_URL (default https://wakatime.com/api/v1) and WAKATIME_TOKEN.
//  - WakaTime: reads need an OAuth access token (sent as Bearer); the hourly split also needs read_heartbeats.
//  - Wakapi: the API key works (sent as Basic base64(key)); set WAKATIME_AUTH=basic.
// Pages read the API live (one summaries call, cached for an hour), so nothing depends on the store.
// The daily cron still saves coding:YYYY-MM-DD snapshots when the store is configured (the year page reads them).
//
// Day boundaries: summaries are asked for in New York time (timezone=America/New_York; Wakapi ignores the
// parameter and uses the profile timezone, so set that to America/New_York). Hourly bins use the same days:
// WakaTime's durations are asked for with the same timezone, Wakapi's heartbeats come per profile-timezone day,
// and both are checked to be New York before they are used.
import { setJSON, lastDays, storeConfigured } from './store';

export type CodingDay = {
  date: string;
  hours: number;
  languages: { name: string; hours: number }[];
  /** Seconds coded in each New York hour (0–23). Missing when the hourly data could not be read. */
  hourly?: number[];
};

/** hourlyDays: how many of the days carry hourly data (the pattern covers only those). */
export type CodingWeek = { days: CodingDay[]; hourly: number[] | null; hourlyDays: number };

export const codingConfigured = Boolean(process.env.WAKATIME_TOKEN);

const TZ = 'America/New_York';
const REVALIDATE = 3600;
/**
 * Heartbeats → time (this site's rule): the gap to the next heartbeat counts when it is at most this long,
 * otherwise it counts 0 (the session ended); the last heartbeat counts 0. Same idea as WakaTime's keystroke
 * timeout and Wakapi's per-user heartbeat timeout, whose values may differ from this one, so the hourly
 * pattern can differ slightly from the daily totals. It is not scaled to match.
 */
export const HEARTBEAT_TIMEOUT = 10 * 60;

const base = () => process.env.WAKATIME_API_URL ?? 'https://wakatime.com/api/v1';
/** Wakapi has no durations endpoint; it serves the WakaTime API under /compat/wakatime. */
const isWakapi = () => base().includes('/compat/wakatime');

function auth(): string {
  const t = process.env.WAKATIME_TOKEN!;
  return process.env.WAKATIME_AUTH === 'basic' ? `Basic ${Buffer.from(t).toString('base64')}` : `Bearer ${t}`;
}

/** Live reads are cached for an hour; the cron (fresh) bypasses the cache. */
function get(path: string, fresh: boolean): Promise<Response> {
  return fetch(`${base()}${path}`, {
    headers: { Authorization: auth() },
    ...(fresh ? { cache: 'no-store' as const } : { next: { revalidate: REVALIDATE } }),
  });
}

const nyParts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
function nyDateHour(sec: number): [string, number, number] {
  const p = Object.fromEntries(nyParts.formatToParts(new Date(sec * 1000)).map(x => [x.type, x.value]));
  return [`${p.year}-${p.month}-${p.day}`, Number(p.hour) % 24, Number(p.minute)];
}

/**
 * Bucket WakaTime durations ({ time: unix seconds, duration: seconds }) into 24 New York hours of `date`.
 * Items are split at hour boundaries (New York offsets are whole hours, so UTC hour edges are New York hour edges);
 * slices outside `date` are dropped.
 */
export function hourlyFromDurations(items: unknown, date: string): number[] | null {
  if (!Array.isArray(items)) return null;
  const out: number[] = Array(24).fill(0);
  for (const it of items as { time?: unknown; duration?: unknown }[]) {
    const time = Number(it?.time), dur = Number(it?.duration);
    if (!Number.isFinite(time) || !Number.isFinite(dur) || dur <= 0) continue;
    let t = time;
    const end = time + dur;
    while (t < end) {
      const edge = Math.min(end, Math.floor(t / 3600) * 3600 + 3600);
      const [d, h] = nyDateHour(t);
      if (d === date) out[h] += edge - t;
      t = edge;
    }
  }
  return out.map(Math.round);
}

/**
 * Turn heartbeats ({ time: unix seconds }) into durations: each heartbeat lasts until the next one when the gap is
 * at most HEARTBEAT_TIMEOUT, else 0. The last heartbeat lasts 0. Pass several days at once so gaps over midnight count.
 */
export function durationsFromHeartbeats(items: unknown): { time: number; duration: number }[] | null {
  if (!Array.isArray(items)) return null;
  const times = (items as { time?: unknown }[]).map(it => Number(it?.time)).filter(Number.isFinite).sort((a, b) => a - b);
  return times.map((time, i) => {
    const gap = i + 1 < times.length ? times[i + 1] - time : 0;
    return { time, duration: gap <= HEARTBEAT_TIMEOUT ? gap : 0 };
  });
}

const q = (o: Record<string, string>) => new URLSearchParams(o).toString();

/** Raw items for one New York day: WakaTime durations, or Wakapi heartbeats. Null on any failure. */
async function fetchHourlyItems(date: string, fresh: boolean): Promise<{ kind: 'durations' | 'heartbeats'; data: unknown[] } | null> {
  const kind = isWakapi() ? 'heartbeats' : 'durations';
  try {
    const res = await get(`/users/current/${kind}?${q({ date, timezone: TZ })}`, fresh);
    if (!res.ok) throw new Error(`coding ${kind} ${res.status}`);
    const json = await res.json();
    // Wakapi uses the profile timezone; bins on another day boundary would not match the daily totals.
    if (json?.timezone && json.timezone !== TZ) throw new Error(`coding ${kind}: timezone is ${json.timezone}, not ${TZ}`);
    if (!Array.isArray(json?.data)) throw new Error(`coding ${kind}: no data`);
    return { kind, data: json.data };
  } catch (e) {
    console.error(e);
    return null;
  }
}

/** Hourly seconds for each date (null where it could not be read). Heartbeats are pooled across the dates. */
async function fetchHourly(dates: string[], fresh: boolean): Promise<(number[] | null)[]> {
  const raw = await Promise.all(dates.map(d => fetchHourlyItems(d, fresh)));
  if (raw.some(r => r?.kind === 'heartbeats')) {
    const pooled = durationsFromHeartbeats(raw.flatMap(r => r?.data ?? []))!;
    return dates.map((d, i) => (raw[i] ? hourlyFromDurations(pooled, d) : null));
  }
  return dates.map((d, i) => (raw[i] ? hourlyFromDurations(raw[i]!.data, d) : null));
}

type Totals = Omit<CodingDay, 'hourly'>;
const h1 = (s: number) => Math.round((s / 3600) * 10) / 10;

/**
 * Daily totals for start..end (New York), keyed by date. Rows are keyed by the New York date of range.start
 * (Wakapi's range.date is the server's current time, not the day). Throws on HTTP errors or a non–New York day.
 */
async function fetchSummaries(start: string, end: string, fresh: boolean): Promise<Map<string, Totals>> {
  const res = await get(`/users/current/summaries?${q({ start, end, timezone: TZ })}`, fresh);
  if (!res.ok) throw new Error(`coding summaries ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json?.data)) throw new Error('coding summaries: no data');
  const out = new Map<string, Totals>();
  for (const d of json.data as { range?: { start?: string }; grand_total?: { total_seconds?: number }; languages?: { name: string; total_seconds: number }[] }[]) {
    const t = Date.parse(d?.range?.start ?? '');
    if (!Number.isFinite(t)) continue;
    const [date, hour, minute] = nyDateHour(t / 1000);
    if (hour !== 0 || minute !== 0) throw new Error(`coding summaries: days start at ${d.range!.start}, not New York midnight (set the Wakapi profile timezone to ${TZ})`);
    out.set(date, {
      date,
      hours: h1(d.grand_total?.total_seconds ?? 0),
      languages: (d.languages ?? []).slice(0, 6).map(l => ({ name: l.name, hours: h1(l.total_seconds) })),
    });
  }
  return out;
}

const zero = (date: string): Totals => ({ date, hours: 0, languages: [] });

/** One day, fresh from the API (for the cron). Throws on summaries errors; hourly is omitted when it fails. */
export async function fetchCodingDay(date: string): Promise<CodingDay | null> {
  if (!codingConfigured) return null;
  const [sums, [hourly]] = await Promise.all([fetchSummaries(date, date, true), fetchHourly([date], true)]);
  const day: CodingDay = { ...(sums.get(date) ?? zero(date)) };
  if (hourly) day.hourly = hourly;
  return day;
}

/** Save a snapshot for the year page. Null when coding or the store is not configured. */
export async function saveCodingDay(date: string): Promise<CodingDay | null> {
  if (!storeConfigured) return null;
  const day = await fetchCodingDay(date);
  if (day) await setJSON(`coding:${date}`, day);
  return day;
}

/** The last n days (oldest first, ending today in New York), read live and cached for an hour. Null when not configured or the API fails. */
export async function getCodingDays(n = 7): Promise<CodingDay[] | null> {
  if (!codingConfigured) return null;
  const keys = lastDays(n);
  try {
    const sums = await fetchSummaries(keys[0], keys[keys.length - 1], false);
    return keys.map(d => sums.get(d) ?? zero(d));
  } catch (e) {
    console.error(e);
    return null;
  }
}

/** Sum the hourly seconds of the days that have them; null when none do. */
const hasHourly = (d: CodingDay) => Array.isArray(d.hourly) && d.hourly.length === 24;
export function sumHourly(days: CodingDay[]): number[] | null {
  const withHours = days.filter(hasHourly);
  if (!withHours.length) return null;
  return Array.from({ length: 24 }, (_, h) => withHours.reduce((a, d) => a + (Number(d.hourly![h]) || 0), 0));
}

/** The last 7 days (oldest first) plus their summed hourly pattern, or null when coding is not configured or the API fails. */
export async function getCodingWeek(): Promise<CodingWeek | null> {
  if (!codingConfigured) return null;
  const keys = lastDays(7);
  const [days, hourly] = await Promise.all([getCodingDays(7), fetchHourly(keys, false)]);
  if (!days) return null;
  const withHourly = days.map((d, i) => (hourly[i] ? { ...d, hourly: hourly[i]! } : d));
  return { days: withHourly, hourly: sumHourly(withHourly), hourlyDays: withHourly.filter(hasHourly).length };
}
