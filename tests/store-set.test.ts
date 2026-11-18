import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.KV_REST_API_URL = 'https://kv.example.test';
process.env.KV_REST_API_TOKEN = 'secret-token';
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;
const { storeConfigured, getJSON, getMany, setJSON, incr } = await import('../lib/store');

type Call = { url: string; init: RequestInit & { next?: { revalidate: number } } };
function mockFetch(t: import('node:test').TestContext, reply: (body: unknown[]) => Response) {
  const calls: Call[] = [];
  t.mock.method(globalThis, 'fetch', async (url: string, init: Call['init']) => {
    calls.push({ url, init });
    return reply(JSON.parse(String(init.body)));
  });
  return calls;
}
const json = (v: unknown, status = 200) => new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });
const quiet = (t: import('node:test').TestContext) => t.mock.method(console, 'error', () => {});

test('configured from KV_* env', () => assert.equal(storeConfigured, true));

test('getJSON sends POST ["GET", key] with bearer auth and parses the value', async t => {
  const calls = mockFetch(t, () => json({ result: JSON.stringify({ a: 1 }) }));
  assert.deepEqual(await getJSON('views:/'), { a: 1 });
  assert.equal(calls.length, 1);
  const { url, init } = calls[0];
  assert.equal(url, 'https://kv.example.test');
  assert.equal(init.method, 'POST');
  assert.deepEqual(JSON.parse(String(init.body)), ['GET', 'views:/']);
  const h = init.headers as Record<string, string>;
  assert.equal(h.Authorization, 'Bearer secret-token');
  assert.equal(h['Content-Type'], 'application/json');
  assert.deepEqual(init.next, { revalidate: 3600 });
});

test('getJSON returns null for a missing key', async t => {
  mockFetch(t, () => json({ result: null }));
  assert.equal(await getJSON('missing'), null);
});

test('getJSON returns null (and logs) on HTTP error, store error or bad JSON', async t => {
  const err = quiet(t);
  mockFetch(t, () => json({ error: 'nope' }, 500));
  assert.equal(await getJSON('k'), null);
  t.mock.restoreAll(); quiet(t);
  mockFetch(t, () => json({ error: 'WRONGTYPE' }));
  assert.equal(await getJSON('k'), null);
  t.mock.restoreAll(); quiet(t);
  mockFetch(t, () => json({ result: '{not json' }));
  assert.equal(await getJSON('k'), null);
  t.mock.restoreAll(); const err2 = quiet(t);
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('network down'); });
  assert.equal(await getJSON('k'), null);
  assert.equal(err.mock.callCount() + err2.mock.callCount() >= 2, true);
});

test('getMany sends MGET and maps nulls', async t => {
  const calls = mockFetch(t, () => json({ result: [JSON.stringify(1), null, JSON.stringify({ x: 'y' })] }));
  assert.deepEqual(await getMany(['a', 'b', 'c'], 60), [1, null, { x: 'y' }]);
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), ['MGET', 'a', 'b', 'c']);
  assert.deepEqual(calls[0].init.next, { revalidate: 60 });
});

test('getMany returns all nulls on error', async t => {
  quiet(t);
  mockFetch(t, () => new Response('boom', { status: 502 }));
  assert.deepEqual(await getMany(['a', 'b']), [null, null]);
});

test('setJSON sends SET with a JSON string and no cache; throws on HTTP error', async t => {
  const calls = mockFetch(t, () => json({ result: 'OK' }));
  await setJSON('k', { n: 2 });
  assert.deepEqual(JSON.parse(String(calls[0].init.body)), ['SET', 'k', '{"n":2}']);
  assert.equal(calls[0].init.cache, 'no-store');
  t.mock.restoreAll();
  mockFetch(t, () => json({}, 401));
  await assert.rejects(setJSON('k', 1), /store: SET failed with 401/);
});

test('incr returns the number, or null on error', async t => {
  mockFetch(t, () => json({ result: 7 }));
  assert.equal(await incr('hits'), 7);
  t.mock.restoreAll();
  mockFetch(t, () => json({}, 500));
  assert.equal(await incr('hits'), null);
});
