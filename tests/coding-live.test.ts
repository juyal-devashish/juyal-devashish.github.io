// Wakapi (Basic auth, /compat/wakatime base, heartbeats instead of durations) without the store.
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';

// Pin "today" (New York) to Tue 2026-11-17 so lastDays() never spans a DST change.
mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 10, 17, 17) });

const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });

/** Unix seconds of New York midnight starting `date` (EST or EDT). */
function nyMidnight(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  for (const off of [4, 5]) {
    const t = Date.UTC(y, m - 1, d, off);
    const hour = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', hourCycle: 'h23' }).format(new Date(t));
    if (Number(hour) === 0) return t / 1000;
  }
  throw new Error('no midnight');
}

/** All dates from start to end inclusive. */
function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(start + 'T12:00:00Z'); t <= Date.parse(end + 'T12:00:00Z'); t += 86_400_000) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

const iso = (sec: number) => new Date(sec * 1000).toISOString().replace('.000', '');

/** A summaries day. style 'wakatime': range.date is the day, start in UTC. 'wakapi': range.date is "now", start with -05:00 style offset. */
function summaryDay(date: string, seconds: number, langs: [string, number][], style: 'wakatime' | 'wakapi') {
  const s = nyMidnight(date);
  const off = (Date.parse(date + 'T00:00:00Z') / 1000 - s) / 3600; // -5 or -4
  const range = style === 'wakatime'
    ? { date, start: iso(s), end: iso(s + 86399), text: date, timezone: 'America/New_York' }
    : { date: '2026-11-18T03:47:31+01:00', start: `${date}T00:00:00-0${-off}:00`, end: `${date}T23:59:59-0${-off}:00`, text: '', timezone: 'CET' };
  return {
    grand_total: { total_seconds: seconds, digital: '0:0', text: '' },
    range,
    languages: langs.map(([name, total_seconds]) => ({ name, total_seconds, percent: 0 })),
    projects: [],
  };
}


process.env.WAKATIME_TOKEN = 'wakapi-key';
process.env.WAKATIME_AUTH = 'basic';
process.env.WAKATIME_API_URL = 'https://wakapi.example.test/api/compat/wakatime/v1';
for (const k of ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) delete process.env[k];
const { getCodingDays, getCodingWeek, fetchCodingDay, saveCodingDay, durationsFromHeartbeats, HEARTBEAT_TIMEOUT } = await import('../lib/coding');
const { lastDays } = await import('../lib/store');

const BASIC = `Basic ${Buffer.from('wakapi-key').toString('base64')}`;

/** A Wakapi server: summaries per NY day (range.date = server's "now"), heartbeats per NY day from `beats`. */
function wakapi(t: { mock: { method: Function } }, hrs: Record<string, number>, beats: number[], opts: { heartbeats?: (date: string) => Response } = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const u = new URL(url);
    if (u.pathname.endsWith('/summaries')) {
      const dates = datesBetween(u.searchParams.get('start')!, u.searchParams.get('end')!);
      return json({ data: dates.map(d => summaryDay(d, (hrs[d] ?? 0) * 3600, hrs[d] ? [['TypeScript', hrs[d] * 3600]] : [], 'wakapi')) });
    }
    if (u.pathname.endsWith('/heartbeats')) {
      const d = u.searchParams.get('date')!;
      if (opts.heartbeats) return opts.heartbeats(d);
      const s = nyMidnight(d);
      // Wakapi returns them newest first sometimes; order must not matter.
      const data = beats.filter(b => b >= s && b < s + 86400).reverse().map((time, i) => ({ id: String(i), time, entity: 'x.ts', type: 'file', language: 'TypeScript', project: 'site' }));
      return json({ data, start: new Date(s * 1000).toISOString(), end: new Date((s + 86399) * 1000).toISOString(), timezone: 'America/New_York' });
    }
    throw new Error(`unexpected fetch ${url}`);
  });
  return calls;
}

test('durationsFromHeartbeats counts gaps up to the timeout and 0 past it', () => {
  const d = durationsFromHeartbeats([{ time: 1000 }, { time: 100 }, { time: 220 }, { time: 400 }, { time: 1000 + HEARTBEAT_TIMEOUT + 1 }, { time: 'x' }]);
  assert.deepEqual(d, [
    { time: 100, duration: 120 },
    { time: 220, duration: 180 },
    { time: 400, duration: 600 }, // exactly the timeout still counts
    { time: 1000, duration: 0 }, // gap over the timeout: session ended
    { time: 1000 + HEARTBEAT_TIMEOUT + 1, duration: 0 }, // last heartbeat
  ]);
  assert.equal(durationsFromHeartbeats(undefined), null);
});

test('getCodingDays keys Wakapi rows by range.start, not its range.date', async t => {
  const keys = lastDays(7);
  const calls = wakapi(t, { [keys[0]]: 1, [keys[6]]: 2.25 }, []);
  const days = await getCodingDays(7);
  assert.deepEqual(days?.map(d => d.date), keys);
  assert.deepEqual(days?.map(d => d.hours), [1, 0, 0, 0, 0, 0, 2.3]);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.startsWith('https://wakapi.example.test/api/compat/wakatime/v1/users/current/summaries?'));
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, BASIC);
});

test('getCodingWeek returns zero days and a zero pattern when nothing is tracked yet', async t => {
  const calls = wakapi(t, {}, []);
  const week = await getCodingWeek();
  assert.equal(week?.days.length, 7);
  assert.ok(week!.days.every(d => d.hours === 0 && d.languages.length === 0));
  assert.deepEqual(week?.hourly, Array(24).fill(0));
  assert.equal(week?.hourlyDays, 7);
  assert.equal(calls.filter(c => c.url.includes('/heartbeats?')).length, 7);
  assert.ok(!calls.some(c => c.url.includes('/durations')));
  assert.ok(calls.every(c => c.init.next?.revalidate === 3600));
});

test('getCodingWeek splits heartbeat gaps across hours and New York midnight', async t => {
  const keys = lastDays(7);
  const m5 = nyMidnight(keys[5]), m6 = nyMidnight(keys[6]);
  const beats = [
    m5 + 9 * 3600 + 3540, m5 + 9 * 3600 + 3660,            // 9:59 → 10:01: 60 s in 9, 60 s in 10
    m6 - 120, m6 + 60,                                     // 11:58 PM → 12:01 AM next day: 120 s in 23, 60 s in 0
    m6 + 14 * 3600, m6 + 14 * 3600 + HEARTBEAT_TIMEOUT + 5, // gap over the timeout: nothing
  ];
  wakapi(t, { [keys[5]]: 0.1, [keys[6]]: 0.1 }, beats);
  const week = await getCodingWeek();
  const d5 = week!.days[5].hourly!, d6 = week!.days[6].hourly!;
  assert.equal(d5[9], 60); assert.equal(d5[10], 60); assert.equal(d5[23], 120);
  assert.equal(d6[0], 60); assert.equal(d6[14], 0);
  assert.equal(d5.reduce((a, b) => a + b, 0), 240);
  assert.equal(d6.reduce((a, b) => a + b, 0), 60);
  const want = Array(24).fill(0); want[0] = 60; want[9] = 60; want[10] = 60; want[23] = 120;
  assert.deepEqual(week?.hourly, want);
});

test('getCodingWeek leaves out hourly for days whose heartbeats fail or use another timezone', async t => {
  t.mock.method(console, 'error', () => {});
  const keys = lastDays(7);
  wakapi(t, { [keys[6]]: 1 }, [], {
    heartbeats: d => d === keys[3] ? json({}, 500) : d === keys[4] ? json({ data: [], timezone: 'CET' }) : json({ data: [], timezone: 'America/New_York' }),
  });
  const week = await getCodingWeek();
  assert.equal(week?.hourlyDays, 5);
  assert.equal('hourly' in week!.days[3], false);
  assert.equal('hourly' in week!.days[4], false);
  assert.equal(week?.days[6].hours, 1);
});

test('getCodingWeek and getCodingDays return null when summaries fail', async t => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async () => json({ error: 'Unauthorized' }, 401));
  assert.equal(await getCodingDays(7), null);
  assert.equal(await getCodingWeek(), null);
});

test('fetchCodingDay uses heartbeats uncached; saveCodingDay is a no-op without the store', async t => {
  const keys = lastDays(1);
  const m = nyMidnight(keys[0]);
  const calls = wakapi(t, { [keys[0]]: 0.5 }, [m + 3600, m + 3700]);
  const day = await fetchCodingDay(keys[0]);
  assert.equal(day?.hours, 0.5);
  assert.equal(day?.hourly?.[1], 100);
  assert.ok(calls.every(c => c.init.cache === 'no-store'));
  const n = calls.length;
  assert.equal(await saveCodingDay(keys[0]), null);
  assert.equal(calls.length, n);
});
