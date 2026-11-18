process.env.SITE_WRITING_TEST = '1'; // writing is switched off on the site; still test the parser
import { test, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// lib/posts.ts freezes content/posts under process.cwd() at import time, so chdir into a
// temp dir before the first (dynamic) import. This file runs in its own process.
const origCwd = process.cwd();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'posts-test-'));
const dir = path.join(tmp, 'content/posts');
fs.mkdirSync(dir, { recursive: true });
process.chdir(tmp);
const { getPosts, getPost, renderMarkdown, formatDate } = await import('../lib/posts');
process.chdir(origCwd);

const origEnv = process.env.NODE_ENV;
const env = process.env as Record<string, string | undefined>;
const write = (name: string, text: string) => fs.writeFileSync(path.join(dir, name), text);

afterEach(() => {
  for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f));
  if (origEnv === undefined) delete env.NODE_ENV; else env.NODE_ENV = origEnv;
});
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

test('no posts directory content returns []', () => {
  assert.deepEqual(getPosts(), []);
});

test('parses front matter, strips quotes, ignores non-.md files', () => {
  write('hello.md', `---\ntitle: "Hello: world"\ndate: 2026-11-17\nsummary: 'One line.'\n---\nBody text here.\n`);
  write('notes.txt', 'ignored');
  const posts = getPosts();
  assert.equal(posts.length, 1);
  assert.deepEqual({ ...posts[0], body: posts[0].body.trim() }, {
    slug: 'hello', title: 'Hello: world', date: '2026-11-17', summary: 'One line.', draft: false, body: 'Body text here.', minutes: 1,
  });
  assert.equal(getPost('hello')?.title, 'Hello: world');
  assert.equal(getPost('missing'), undefined);
});

test('missing title or date throws a helpful message', () => {
  write('no-date.md', `---\ntitle: Only a title\n---\nBody\n`);
  assert.throws(() => getPosts(), /content\/posts\/no-date\.md needs a title and a date/);
  fs.rmSync(path.join(dir, 'no-date.md'));
  write('no-title.md', `---\ndate: 2026-01-01\n---\nBody\n`);
  assert.throws(() => getPosts(), /no-title\.md needs a title and a date/);
  fs.rmSync(path.join(dir, 'no-title.md'));
  write('no-front.md', `# Just markdown\n`);
  assert.throws(() => getPosts(), /no-front\.md needs a title and a date/);
});

test('drafts show in development and are hidden in production', () => {
  write('a.md', `---\ntitle: Published\ndate: 2026-01-01\n---\nx\n`);
  write('b.md', `---\ntitle: Draft\ndate: 2026-02-01\ndraft: true\n---\nx\n`);
  env.NODE_ENV = 'development';
  assert.deepEqual(getPosts().map(p => p.slug), ['b', 'a']);
  assert.equal(getPosts()[0].draft, true);
  env.NODE_ENV = 'production';
  assert.deepEqual(getPosts().map(p => p.slug), ['a']);
  assert.equal(getPost('b'), undefined);
});

test('sorts newest first', () => {
  write('old.md', `---\ntitle: Old\ndate: 2025-12-31\n---\nx\n`);
  write('new.md', `---\ntitle: New\ndate: 2026-11-17\n---\nx\n`);
  write('mid.md', `---\ntitle: Mid\ndate: 2026-03-09\n---\nx\n`);
  assert.deepEqual(getPosts().map(p => p.slug), ['new', 'mid', 'old']);
});

test('reading time is at least 1 minute and scales with words', () => {
  write('empty.md', `---\ntitle: Empty\ndate: 2026-01-01\n---\n`);
  write('long.md', `---\ntitle: Long\ndate: 2026-01-02\n---\n${'word '.repeat(230 * 5)}\n`);
  const bySlug = Object.fromEntries(getPosts().map(p => [p.slug, p]));
  assert.equal(bySlug.empty.minutes, 1);
  assert.equal(bySlug.long.minutes, 5);
});

test('renderMarkdown renders basic markdown (gfm)', () => {
  const html = renderMarkdown('# Title\n\nSome **bold** and a [link](https://example.com).\n\n- one\n- two\n\n| a | b |\n|---|---|\n| 1 | 2 |\n');
  assert.match(html, /<h1[^>]*>Title<\/h1>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<a href="https:\/\/example\.com">link<\/a>/);
  assert.match(html, /<li>one<\/li>/);
  assert.match(html, /<table>/);
  assert.equal(typeof html, 'string');
});

test('formatDate is timezone independent', () => {
  assert.equal(formatDate('2026-11-17'), 'Nov 17, 2026');
  assert.equal(formatDate('2026-01-01'), 'Jan 1, 2026');
});
