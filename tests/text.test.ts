import { test } from 'node:test';
import assert from 'node:assert/strict';

const { markdownFor, llmsTxt, searchIndex, slug, pageList } = await import('../lib/text');
const { papers } = await import('../lib/papers');
const { projects, uses } = await import('../lib/site');
const { jobs, education } = await import('../lib/resume');

const read = papers.filter(p => p.read);
const unread = papers.filter(p => !p.read);

test('markdownFor returns markdown for every public page', () => {
  for (const key of ['/', 'index', 'projects', 'stack', 'resume', 'photos', 'now', '/projects/']) {
    const md = markdownFor(key);
    assert.equal(typeof md, 'string', key);
    assert.match(md!, /^# /, `${key} starts with an h1`);
    assert.match(md!, /\nSource: https?:\/\//, `${key} ends with a source line`);
  }
});

test('markdownFor returns null for unknown paths', () => {
  for (const key of ['nope', 'writing/does-not-exist', 'stack/extra', 'cmd']) assert.equal(markdownFor(key), null, key);
});

test('markdownFor("uses") is null while uses is empty, markdown once filled', () => {
  if (uses.length === 0) assert.equal(markdownFor('uses'), null);
  else assert.match(markdownFor('uses')!, /^# Uses/);
});

test('stack lists only read papers', () => {
  const md = markdownFor('stack')!;
  assert.ok(read.length > 0, 'precondition: at least one read paper');
  for (const p of read) assert.ok(md.includes(p.title), `read paper missing: ${p.title}`);
  // Only check the title position of each list item, so a note mentioning an unread title can't false-positive.
  const listed = md.split('\n').filter(l => l.startsWith('- ')).map(l => l.slice(2));
  assert.equal(listed.length, read.length);
  for (const p of unread) {
    assert.ok(!listed.some(l => l.startsWith(p.title + ',') || l.startsWith(`[${p.title}](`)), `unread paper listed: ${p.title}`);
  }
});

test('llmsTxt links every page, including the markdown copy', () => {
  const txt = llmsTxt();
  const pages = pageList();
  assert.ok(pages.length >= 7);
  for (const p of pages) assert.ok(txt.includes(`${p.md})`), `llms.txt missing ${p.md}`);
  for (const p of projects) assert.ok(txt.includes(`[${p.name}](`), `llms.txt missing project ${p.name}`);
  assert.equal(txt.includes('/uses.md'), uses.length > 0, 'uses listed only when non-empty');
});

test('every page in pageList has a markdown copy', () => {
  for (const p of pageList()) assert.notEqual(markdownFor(p.path), null, p.path);
});

test('searchIndex ids are unique', () => {
  const ids = searchIndex().map(e => e.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('searchIndex paper entries are read papers only', () => {
  const readTitles = new Set(read.map(p => p.title));
  const paperEntries = searchIndex().filter(e => e.type === 'paper');
  assert.equal(paperEntries.length, read.length);
  for (const e of paperEntries) assert.ok(readTitles.has(e.title), `unread paper indexed: ${e.title}`);
});

test('searchIndex hrefs are site-relative or mailto', () => {
  for (const e of searchIndex()) {
    if (e.href === undefined) continue;
    assert.ok(e.href.startsWith('/') || e.href.startsWith('mailto:'), `${e.id}: ${e.href}`);
  }
});

test('searchIndex project and role anchors point at real ids', () => {
  const projectIds = new Set(projects.map(p => p.id));
  const roleIds = new Set([...jobs, ...education].map(r => r.id));
  for (const e of searchIndex()) {
    if (e.type === 'project') {
      const [path, anchor] = e.href!.split('#');
      assert.equal(path, '/projects');
      assert.ok(projectIds.has(anchor), `${e.id} -> #${anchor}`);
    }
    if (e.type === 'role') {
      const [path, anchor] = e.href!.split('#');
      assert.equal(path, '/resume');
      assert.ok(roleIds.has(anchor), `${e.id} -> #${anchor}`);
    }
  }
});

test('slug is stable', () => {
  assert.equal(slug('Attention Is All You Need'), 'attention-is-all-you-need');
  assert.equal(slug('  BERT: Pre-training of Deep  Bidirectional Transformers!  '), 'bert-pre-training-of-deep-bidirectional-transformers');
  assert.equal(slug('Ünïcode & symbols'), 'n-code-symbols');
  for (const p of papers) {
    const s = slug(p.title);
    assert.equal(slug(p.title), s, 'deterministic');
    assert.ok(s.length > 0 && s.length <= 60, `length: ${s}`);
    assert.match(s, /^[a-z0-9][a-z0-9-]*$/, `charset: ${s}`);
  }
});

// lib/text.ts slug() trims leading/trailing '-' before .slice(0, 60), so a cut that lands
// right after a separator leaves a trailing '-' (e.g. "...-pretraining-and-").
test('slug never ends in a hyphen and is idempotent', () => {
  for (const p of papers) {
    const s = slug(p.title);
    assert.equal(slug(s), s, `idempotent: ${p.title}`);
    assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/, `well-formed: ${s}`);
  }
});

test('read paper slugs are unique (stack anchors)', () => {
  const s = read.map(p => slug(p.title));
  assert.equal(new Set(s).size, s.length);
});
