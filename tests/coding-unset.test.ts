import { test } from 'node:test';
import assert from 'node:assert/strict';

// lib/coding.ts (and lib/store.ts, which it imports) read env at import time.
for (const k of ['WAKATIME_TOKEN', 'WAKATIME_AUTH', 'WAKATIME_API_URL', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']) delete process.env[k];
const { codingConfigured, fetchCodingDay, saveCodingDay, getCodingDays, getCodingWeek } = await import('../lib/coding');

test('without WAKATIME_TOKEN everything returns null and nothing is fetched', async t => {
  const f = t.mock.method(globalThis, 'fetch', async () => { throw new Error('should not fetch'); });
  assert.equal(codingConfigured, false);
  assert.equal(await fetchCodingDay('2026-11-16'), null);
  assert.equal(await saveCodingDay('2026-11-16'), null);
  assert.equal(await getCodingDays(), null);
  assert.equal(await getCodingWeek(), null);
  assert.equal(f.mock.callCount(), 0);
});
