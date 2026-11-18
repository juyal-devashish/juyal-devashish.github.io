// Tiny key-value store on Upstash Redis (REST API, no SDK).
// Env: KV_REST_API_URL + KV_REST_API_TOKEN (what the Vercel Marketplace injects)
//   or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
// Without them, reads return null and writes throw, so pages still build and render.

const URL_ = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const storeConfigured = Boolean(URL_ && TOKEN);

async function command<T>(args: (string | number)[], revalidate?: number): Promise<T | null> {
  if (!storeConfigured) return null;
  const res = await fetch(URL_!, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    ...(revalidate === undefined ? { cache: 'no-store' as const } : { next: { revalidate } }),
  });
  if (!res.ok) throw new Error(`store: ${args[0]} failed with ${res.status}`);
  const json = (await res.json()) as { result?: T; error?: string };
  if (json.error) throw new Error(`store: ${json.error}`);
  return json.result ?? null;
}

export async function getJSON<T>(key: string, revalidate = 3600): Promise<T | null> {
  try {
    const raw = await command<string>(['GET', key], revalidate);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export async function getMany<T>(keys: string[], revalidate = 3600): Promise<(T | null)[]> {
  if (!keys.length) return [];
  try {
    const raw = await command<(string | null)[]>(['MGET', ...keys], revalidate);
    return (raw ?? keys.map(() => null)).map(r => (r ? (JSON.parse(r) as T) : null));
  } catch (e) {
    console.error(e);
    return keys.map(() => null);
  }
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  if (!storeConfigured) throw new Error('store: KV_REST_API_URL / KV_REST_API_TOKEN are not set');
  await command(['SET', key, JSON.stringify(value)]);
}

export async function incr(key: string): Promise<number | null> {
  try { return await command<number>(['INCR', key]); } catch { return null; }
}

/** YYYY-MM-DD in New York time. */
export function dayKey(d: Date = new Date()): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
}

/** The last n days as YYYY-MM-DD, oldest first, ending today (New York). */
export function lastDays(n: number, end: Date = new Date()): string[] {
  // Count back by calendar day, not 24h blocks, so DST weeks don't repeat or skip a date.
  const [y, m, d] = dayKey(end).split('-').map(Number);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
  return out;
}
