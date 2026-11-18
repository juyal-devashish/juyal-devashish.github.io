// WakaTime proper (Bearer token, durations endpoint) with the store configured.
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


process.env.WAKATIME_TOKEN = 'waka-token';
delete process.env.WAKATIME_AUTH;
delete process.env.WAKATIME_API_URL;
process.env.KV_REST_API_URL = 'https://kv.example.test';
process.env.KV_REST_API_TOKEN = 'kv-token';
const { codingConfigured, fetchCodingDay, saveCodingDay, getCodingDays, getCodingWeek, hourlyFromDurations, sumHourly } = await import('../lib/coding');
const { lastDays } = await import('../lib/store');

// Trimmed from a real GET /users/current/summaries response.
const summaries = {
  data: [{
    grand_total: { digital: '3:25', hours: 3, minutes: 25, text: '3 hrs 25 mins', total_seconds: 12345.67 },
    range: { date: '2026-11-16', start: '2026-11-16T05:00:00Z', end: '2026-11-17T04:59:59Z', text: 'Mon Nov 16th 2026', timezone: 'America/New_York' },
    languages: [
      { name: 'TypeScript', total_seconds: 7200, percent: 58.3, digital: '2:00', text: '2 hrs', hours: 2, minutes: 0 },
      { name: 'Python', total_seconds: 2700, percent: 21.9 },
      { name: 'Markdown', total_seconds: 900 },
      { name: 'JSON', total_seconds: 600 },
      { name: 'Bash', total_seconds: 300 },
      { name: 'CSS', total_seconds: 200 },
      { name: 'YAML', total_seconds: 100 },
    ],
    projects: [{ name: 'site', total_seconds: 12345.67 }],
  }],
  cumulative_total: { seconds: 12345.67, text: '3 hrs 25 mins' },
  start: '2026-11-16T05:00:00Z',
  end: '2026-11-17T04:59:59Z',
};

// Trimmed from the documented GET /users/current/durations response (time: unix seconds, duration: seconds).
// 2026-11-16 is EST (UTC-5): 14:00Z = 9 AM New York.
const T9 = Date.UTC(2026, 10, 16, 14) / 1000;
const durations = {
  data: [
    { project: 'site', time: T9 + 600, duration: 1200, ai_additions: 0 },        // 9:10–9:30 → 1200 s in 9 AM
    { project: 'site', time: T9 + 3000, duration: 1800 },                        // 9:50–10:20 → 600 s in 9 AM, 1200 s in 10 AM
    { project: 'site', time: T9 + 5 * 3600, duration: 3600 * 2 + 30 },           // 2 PM–4:00:30 → 3600, 3600, 30
    { project: 'bad', time: 'x', duration: 99 },
  ],
  start: '2026-11-16T05:00:00Z', end: '2026-11-17T04:59:59Z', timezone: 'America/New_York',
};
const hourlyExpected = Array(24).fill(0);
hourlyExpected[9] = 1800; hourlyExpected[10] = 1200; hourlyExpected[14] = 3600; hourlyExpected[15] = 3600; hourlyExpected[16] = 30;

/** Route mocked requests: durations, summaries, else the KV store. */
function route(t: { mock: { method: Function } }, opts: { durations?: () => Response; kv?: (init: RequestInit) => Response } = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    if (url.includes('/durations?')) return opts.durations ? opts.durations() : json(durations);
    if (url.includes('/summaries?')) return json(summaries);
    return opts.kv ? opts.kv(init) : json({ result: 'OK' });
  });
  return calls;
}

test('configured with WAKATIME_TOKEN', () => assert.equal(codingConfigured, true));

test('fetchCodingDay parses summaries and buckets durations into New York hours, uncached', async t => {
  const calls = route(t);
  const day = await fetchCodingDay('2026-11-16');
  assert.deepEqual(day, {
    date: '2026-11-16',
    hours: 3.4,
    languages: [
      { name: 'TypeScript', hours: 2 }, { name: 'Python', hours: 0.8 }, { name: 'Markdown', hours: 0.3 },
      { name: 'JSON', hours: 0.2 }, { name: 'Bash', hours: 0.1 }, { name: 'CSS', hours: 0.1 },
    ],
    hourly: hourlyExpected,
  });
  const sum = calls.find(c => c.url.includes('/summaries?'))!;
  const dur = calls.find(c => c.url.includes('/durations?'))!;
  assert.equal(sum.url, 'https://wakatime.com/api/v1/users/current/summaries?start=2026-11-16&end=2026-11-16&timezone=America%2FNew_York');
  assert.equal(dur.url, 'https://wakatime.com/api/v1/users/current/durations?date=2026-11-16&timezone=America%2FNew_York');
  for (const c of [sum, dur]) {
    assert.equal((c.init.headers as Record<string, string>).Authorization, 'Bearer waka-token');
    assert.equal(c.init.cache, 'no-store');
  }
});

test('hourlyFromDurations drops the part of an item past New York midnight', () => {
  const late = Date.UTC(2026, 10, 17, 4, 30) / 1000; // 11:30 PM Nov 16 in New York
  const h = hourlyFromDurations([{ time: late, duration: 3600 }], '2026-11-16')!;
  assert.equal(h[23], 1800);
  assert.equal(h.reduce((a, b) => a + b, 0), 1800);
  const early = Date.UTC(2026, 10, 16, 4, 45) / 1000; // 11:45 PM Nov 15 in New York
  assert.equal(hourlyFromDurations([{ time: early, duration: 1800 }], '2026-11-16')![0], 900);
});

test('hourlyFromDurations uses New York daylight time in summer', () => {
  const t9 = Date.UTC(2026, 6, 1, 13) / 1000; // 13:00Z = 9 AM EDT
  assert.equal(hourlyFromDurations([{ time: t9, duration: 60 }], '2026-07-01')![9], 60);
});

test('hourlyFromDurations returns null for a malformed response', () => {
  assert.equal(hourlyFromDurations(undefined, '2026-11-16'), null);
  assert.equal(hourlyFromDurations({ data: [] }, '2026-11-16'), null);
});

test('fetchCodingDay keeps the day without hourly when durations fails', async t => {
  t.mock.method(console, 'error', () => {});
  route(t, { durations: () => json({ error: 'Forbidden' }, 403) });
  const day = await fetchCodingDay('2026-11-16');
  assert.equal(day?.hours, 3.4);
  assert.equal('hourly' in day!, false);
});

test('fetchCodingDay drops hourly when durations come back in another timezone', async t => {
  t.mock.method(console, 'error', () => {});
  route(t, { durations: () => json({ ...durations, timezone: 'Europe/Berlin' }) });
  assert.equal('hourly' in (await fetchCodingDay('2026-11-16'))!, false);
});

test('fetchCodingDay returns a zero day when data is empty', async t => {
  t.mock.method(globalThis, 'fetch', async () => json({ data: [] }));
  assert.deepEqual(await fetchCodingDay('2026-11-16'), { date: '2026-11-16', hours: 0, languages: [], hourly: Array(24).fill(0) });
});

test('fetchCodingDay throws on HTTP errors', async t => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async () => json({ error: 'Unauthorized' }, 401));
  await assert.rejects(fetchCodingDay('2026-11-16'), /coding summaries 401/);
});

test('fetchCodingDay rejects days that do not start at New York midnight', async t => {
  t.mock.method(console, 'error', () => {});
  const utc = { data: [{ ...summaries.data[0], range: { ...summaries.data[0].range, start: '2026-11-16T00:00:00Z' } }] };
  t.mock.method(globalThis, 'fetch', async (url: string) => json(url.includes('/summaries?') ? utc : durations));
  await assert.rejects(fetchCodingDay('2026-11-16'), /not New York midnight/);
});

test('saveCodingDay stores the day under coding:YYYY-MM-DD', async t => {
  const bodies: unknown[] = [];
  route(t, { kv: init => { bodies.push(JSON.parse(String(init.body))); return json({ result: 'OK' }); } });
  const day = await saveCodingDay('2026-11-16');
  assert.equal(day?.hours, 3.4);
  assert.deepEqual(day?.hourly, hourlyExpected);
  assert.equal(bodies.length, 1);
  const [cmd, key, value] = bodies[0] as string[];
  assert.equal(cmd, 'SET');
  assert.equal(key, 'coding:2026-11-16');
  assert.deepEqual(JSON.parse(value), day);
});

/** A live WakaTime API for any range: hours per date from `hrs`, durations at 9 AM New York. */
function liveApi(t: { mock: { method: Function } }, hrs: Record<string, number>) {
  const calls: { url: string; init: RequestInit }[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const u = new URL(url);
    if (u.pathname.endsWith('/summaries')) {
      const dates = datesBetween(u.searchParams.get('start')!, u.searchParams.get('end')!);
      return json({ data: dates.map(d => summaryDay(d, (hrs[d] ?? 0) * 3600, hrs[d] ? [['Go', hrs[d] * 3600]] : [], 'wakatime')) });
    }
    if (u.pathname.endsWith('/durations')) {
      const d = u.searchParams.get('date')!;
      const nine = Date.parse(d + 'T14:00:00Z') / 1000; // 9 AM EST or 10 AM EDT; only totals are checked
      return json({ data: hrs[d] ? [{ time: nine, duration: hrs[d] * 3600 }] : [], timezone: 'America/New_York' });
    }
    throw new Error(`unexpected fetch ${url}`);
  });
  return calls;
}

test('getCodingDays reads n days live in one cached summaries call, without the store', async t => {
  const keys = lastDays(3);
  const calls = liveApi(t, { [keys[1]]: 2.5 });
  const days = await getCodingDays(3);
  assert.deepEqual(days, [
    { date: keys[0], hours: 0, languages: [] },
    { date: keys[1], hours: 2.5, languages: [{ name: 'Go', hours: 2.5 }] },
    { date: keys[2], hours: 0, languages: [] },
  ]);
  assert.equal(calls.length, 1);
  const u = new URL(calls[0].url);
  assert.equal(u.searchParams.get('start'), keys[0]);
  assert.equal(u.searchParams.get('end'), keys[2]);
  assert.equal(u.searchParams.get('timezone'), 'America/New_York');
  assert.deepEqual(calls[0].init.next, { revalidate: 3600 });
  assert.equal(calls[0].init.cache, undefined);
});

test('getCodingDays returns null (panel hidden) when the API fails', async t => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async () => json({}, 500));
  assert.equal(await getCodingDays(2), null);
});

test('getCodingWeek sums hourly from durations over the same New York days', async t => {
  const keys = lastDays(7);
  const calls = liveApi(t, { [keys[2]]: 0.5, [keys[5]]: 1 });
  const week = await getCodingWeek();
  assert.deepEqual(week?.days.map(d => d.hours), [0, 0, 0.5, 0, 0, 1, 0]);
  assert.equal(week?.hourlyDays, 7);
  assert.equal(week!.hourly!.reduce((a, b) => a + b, 0), 1.5 * 3600);
  assert.deepEqual(calls.filter(c => c.url.includes('/durations?')).map(c => new URL(c.url).searchParams.get('date')), keys);
  assert.ok(calls.every(c => c.init.next?.revalidate === 3600));
  assert.ok(!calls.some(c => c.url.includes('kv.example.test')));
});

test('getCodingWeek has hourly null when no day has it', async t => {
  t.mock.method(console, 'error', () => {});
  const keys = lastDays(7);
  t.mock.method(globalThis, 'fetch', async (url: string) =>
    url.includes('/summaries?') ? json({ data: [summaryDay(keys[6], 7200, [], 'wakatime')] }) : json({}, 403));
  const week = await getCodingWeek();
  assert.deepEqual(week?.days.map(d => d.hours), [0, 0, 0, 0, 0, 0, 2]);
  assert.equal(week?.hourly, null);
  assert.equal(week?.hourlyDays, 0);
  assert.equal(sumHourly([]), null);
});
