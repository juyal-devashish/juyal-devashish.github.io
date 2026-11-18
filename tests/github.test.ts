import { test } from 'node:test';
import assert from 'node:assert/strict';

// lib/github.ts reads GITHUB_TOKEN at call time.
delete process.env.GITHUB_TOKEN;
const { getContributions, getRecentContributions, GITHUB_LOGIN } = await import('../lib/github');

const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });
const withToken = (t: import('node:test').TestContext) => {
  process.env.GITHUB_TOKEN = 'gh-token';
  t.after(() => { delete process.env.GITHUB_TOKEN; });
};

// Shape of a real GraphQL contributionsCollection response (trimmed to two weeks).
const calendar = {
  data: { user: { contributionsCollection: { contributionCalendar: {
    totalContributions: 9,
    weeks: [
      { contributionDays: [{ date: '2026-11-08', contributionCount: 0 }, { date: '2026-11-09', contributionCount: 3 }] },
      { contributionDays: [{ date: '2026-11-15', contributionCount: 2 }, { date: '2026-11-16', contributionCount: 4 }] },
    ],
  } } } },
};

const PUBLIC_HTML = `<table><tr>
<td tabindex="0" data-date="2026-11-15" id="contribution-day-component-0-0" data-level="1" class="ContributionCalendar-day"></td>
<td tabindex="0" data-date="2026-11-16" id="contribution-day-component-1-0" data-level="0" class="ContributionCalendar-day"></td>
<td tabindex="0" data-date="2026-11-17" id="contribution-day-component-2-0" data-level="4" class="ContributionCalendar-day"></td>
</tr></table>
<tool-tip for="contribution-day-component-0-0" class="sr-only">1 contribution on November 15th.</tool-tip>
<tool-tip for="contribution-day-component-1-0" class="sr-only">No contributions on November 16th.</tool-tip>
<tool-tip for="contribution-day-component-2-0" class="sr-only">1,204 contributions on November 17th.</tool-tip>`;

test('without GITHUB_TOKEN reads the public calendar page', async t => {
  const urls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => { urls.push(String(url)); return new Response(PUBLIC_HTML, { status: 200 }); });
  const cal = await getContributions();
  assert.deepEqual(urls, ['https://github.com/users/juyal-devashish/contributions']);
  assert.deepEqual(cal, { total: 1205, days: [{ date: '2026-11-15', count: 1 }, { date: '2026-11-16', count: 0 }, { date: '2026-11-17', count: 1204 }] });
});

test('without GITHUB_TOKEN filters the public calendar to from/to', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(PUBLIC_HTML, { status: 200 }));
  const cal = await getContributions(new Date('2026-11-16T00:00:00Z'), new Date('2026-11-16T23:00:00Z'));
  assert.deepEqual(cal, { total: 0, days: [{ date: '2026-11-16', count: 0 }] });
});

test('without GITHUB_TOKEN returns null when the public page fails or has no days', async t => {
  t.mock.method(console, 'error', () => {});
  const f = t.mock.method(globalThis, 'fetch', async () => new Response('nope', { status: 503 }));
  assert.equal(await getContributions(), null);
  f.mock.mockImplementation(async () => new Response('<html></html>', { status: 200 }));
  assert.equal(await getContributions(), null);
});

test('parses the contribution calendar and sends a well-formed GraphQL request', async t => {
  withToken(t);
  const calls: { url: string; init: RequestInit }[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => { calls.push({ url, init }); return json(calendar); });
  const from = new Date('2026-01-01T00:00:00Z');
  const to = new Date('2026-11-17T00:00:00Z');
  const cal = await getContributions(from, to);
  assert.deepEqual(cal, {
    total: 9,
    days: [
      { date: '2026-11-08', count: 0 }, { date: '2026-11-09', count: 3 },
      { date: '2026-11-15', count: 2 }, { date: '2026-11-16', count: 4 },
    ],
  });
  assert.equal(calls[0].url, 'https://api.github.com/graphql');
  assert.equal(calls[0].init.method, 'POST');
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer gh-token');
  const body = JSON.parse(String(calls[0].init.body));
  assert.match(body.query, /contributionCalendar/);
  assert.deepEqual(body.variables, { login: GITHUB_LOGIN, from: from.toISOString(), to: to.toISOString() });
});

test('returns null (and logs) on HTTP errors', async t => {
  withToken(t);
  const err = t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async () => json({ message: 'Bad credentials' }, 401));
  assert.equal(await getContributions(), null);
  assert.match(String(err.mock.calls[0].arguments[0]), /GitHub 401/);
});

test('returns null on GraphQL errors (200 with errors[])', async t => {
  withToken(t);
  const err = t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async () => json({ data: { user: null }, errors: [{ type: 'NOT_FOUND', message: 'Could not resolve to a User' }] }));
  assert.equal(await getContributions(), null);
  assert.match(String(err.mock.calls[0].arguments[0]), /NOT_FOUND/);
});

test('returns null on network failure', async t => {
  withToken(t);
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('fetch failed'); });
  assert.equal(await getContributions(), null);
});

test('getRecentContributions is a rolling 6-month window ending today (New York)', async t => {
  const html = (dates: string[]) => dates.map((d, i) => `<td data-date="${d}" id="c${i}"></td><tool-tip for="c${i}">${i + 1} contributions on x.</tool-tip>`).join('');
  t.mock.method(globalThis, 'fetch', async () => new Response(html(['2026-05-16', '2026-05-17', '2026-11-17', '2026-11-18']), { status: 200 }));
  const cal = await getRecentContributions(new Date('2026-11-17T20:00:00-05:00')); // 01:00 UTC on the 18th
  assert.deepEqual(cal?.days.map(d => d.date), ['2026-05-17', '2026-11-17']);
});

test('getRecentContributions clamps month ends (May 31 → Nov 30)', async t => {
  const urls: string[] = [];
  process.env.GITHUB_TOKEN = 'gh-token';
  t.after(() => { delete process.env.GITHUB_TOKEN; });
  t.mock.method(globalThis, 'fetch', async (url: string, init: RequestInit) => { urls.push(String(init.body)); return new Response(JSON.stringify({ data: { user: { contributionsCollection: { contributionCalendar: { totalContributions: 0, weeks: [] } } } } }), { status: 200 }); });
  await getRecentContributions(new Date('2027-05-31T12:00:00-04:00'));
  assert.match(urls[0], /"from":"2026-11-30T00:00:00.000Z"/);
});

test('without GITHUB_TOKEN asks the public page for the whole calendar year of a one-year range', async t => {
  const urls: string[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string) => { urls.push(String(url)); return new Response(PUBLIC_HTML, { status: 200 }); });
  await getContributions(new Date('2026-11-15T00:00:00Z'), new Date('2026-11-17T23:59:59Z'));
  await getContributions(new Date('2025-11-01T00:00:00Z'), new Date('2026-02-15T23:59:59Z')); // spans New Year: rolling page
  assert.deepEqual(urls, [
    'https://github.com/users/juyal-devashish/contributions?from=2026-01-01&to=2026-12-31',
    'https://github.com/users/juyal-devashish/contributions',
  ]);
});

test('without GITHUB_TOKEN returns null when the public page starts after `from` (no partial years)', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(PUBLIC_HTML, { status: 200 }));
  assert.equal(await getContributions(new Date('2026-01-01T00:00:00Z'), new Date('2026-12-31T23:59:59Z')), null);
});
