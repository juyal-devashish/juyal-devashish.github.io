import { test } from 'node:test';
import assert from 'node:assert/strict';

// lib/store.ts reads env at import time: clear it before the dynamic import (own process per file).
for (const k of ['KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) delete process.env[k];
const { storeConfigured, getJSON, getMany, setJSON, incr, dayKey, lastDays } = await import('../lib/store');

test('without env: reads return null, writes throw, fetch is never called', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => { throw new Error('should not fetch'); });
  assert.equal(storeConfigured, false);
  assert.equal(await getJSON('k'), null);
  assert.deepEqual(await getMany(['a', 'b']), [null, null]);
  assert.deepEqual(await getMany([]), []);
  assert.equal(await incr('k'), null);
  await assert.rejects(setJSON('k', 1), /KV_REST_API_URL/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('dayKey uses New York time', () => {
  assert.equal(dayKey(new Date('2026-11-17T04:59:00Z')), '2026-11-16'); // 23:59 EST
  assert.equal(dayKey(new Date('2026-11-17T05:00:00Z')), '2026-11-17'); // 00:00 EST
  assert.equal(dayKey(new Date('2026-07-01T03:59:00Z')), '2026-06-30'); // 23:59 EDT
  assert.equal(dayKey(new Date('2026-07-01T04:00:00Z')), '2026-07-01'); // 00:00 EDT
  assert.match(dayKey(), /^\d{4}-\d{2}-\d{2}$/);
});

test('lastDays: length n, oldest first, ends today', () => {
  const end = new Date('2026-11-17T17:00:00Z');
  assert.deepEqual(lastDays(3, end), ['2026-11-15', '2026-11-16', '2026-11-17']);
  assert.deepEqual(lastDays(1, end), ['2026-11-17']);
  assert.deepEqual(lastDays(0, end), []);
  const days = lastDays(30, end);
  assert.equal(days.length, 30);
  assert.equal(days.at(-1), dayKey(end));
  assert.deepEqual([...days].sort(), days);
});

test('lastDays across DST at midday is fine', () => {
  // Noon NY spans both transitions without landing near midnight.
  assert.deepEqual(lastDays(3, new Date('2026-03-09T16:00:00Z')), ['2026-03-07', '2026-03-08', '2026-03-09']);
  assert.deepEqual(lastDays(3, new Date('2026-11-02T17:00:00Z')), ['2026-10-31', '2026-11-01', '2026-11-02']);
});

// lastDays steps back in fixed 24h chunks. Around DST that can land on the wrong calendar day
// when `end` is within an hour of midnight New York time.
const DST_TODO = 'lib/store.ts lastDays(): subtracts i*86_400_000 ms, so near midnight on DST weeks it repeats or skips a New York date';

test('lastDays has no duplicate after fall-back (25h day)', () => {
  // 2026-11-01 is 25h long in New York. end = 2026-11-01 23:30 EST.
  const days = lastDays(2, new Date('2026-11-02T04:30:00Z'));
  assert.deepEqual(days, ['2026-10-31', '2026-11-01']);
});

test('lastDays does not skip a day after spring-forward (23h day)', () => {
  // 2026-03-08 is 23h long in New York. end = 2026-03-09 00:30 EDT.
  const days = lastDays(2, new Date('2026-03-09T04:30:00Z'));
  assert.deepEqual(days, ['2026-03-08', '2026-03-09']);
});
