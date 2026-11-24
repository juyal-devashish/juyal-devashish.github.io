import { test } from 'node:test';
import assert from 'node:assert/strict';

const { pickMoments, summarizeGitHub, parseYear, yearDates, byMonth, currentYear } = await import('../lib/year');
const { markdownFor } = await import('../lib/text');

const days = (counts: number[], start = '2026-01-01') => yearDates(2026, '2026-12-31').slice(yearDates(2026, '2026-12-31').indexOf(start)).slice(0, counts.length).map((date, i) => ({ date, count: counts[i] }));

test('parseYear accepts 2024..now only', () => {
  assert.equal(parseYear('2024'), 2024);
  assert.equal(parseYear(String(currentYear())), currentYear());
  for (const s of ['2023', String(currentYear() + 1), '24', '02024', 'abcd', '2024.md', undefined]) assert.equal(parseYear(s), null, String(s));
});

test('yearDates stops at through and at the year end', () => {
  assert.equal(yearDates(2026, '2026-01-03').length, 3);
  assert.equal(yearDates(2024, '2024-12-31').length, 366);
  assert.equal(yearDates(2025, '2026-05-01').at(-1), '2025-12-31');
});

test('an all-zero year has no moments', () => {
  assert.deepEqual(pickMoments(days(Array(40).fill(0))), []);
  assert.deepEqual(pickMoments([]), []);
  assert.equal(summarizeGitHub(days(Array(10).fill(0)))!.busiestWeekday, null);
});

test('moments: streak, busiest month and day, quiet stretch, in date order', () => {
  // Jan: 3-day streak then 10 quiet days; Feb has the busiest single day.
  const c = [1, 2, 3, ...Array(10).fill(0), 1, ...Array(17).fill(0), 1, 9, 0];
  const m = pickMoments(days(c));
  const kinds = m.map(x => x.kind);
  assert.deepEqual([...kinds].sort(), ['day', 'month', 'quiet', 'streak']);
  assert.ok(m.length >= 2 && m.length <= 4);
  for (let i = 1; i < m.length; i++) assert.ok(m[i - 1].from <= m[i].from, 'sorted');
  const streak = m.find(x => x.kind === 'streak')!;
  assert.equal(streak.value, 3);
  assert.equal(streak.from, '2026-01-01');
  assert.equal(m.find(x => x.kind === 'day')!.from, '2026-02-02');
  assert.equal(m.find(x => x.kind === 'quiet')!.value, 17);
  assert.equal(m.find(x => x.kind === 'month')!.caption, 'Feb: 10 contributions');
});

test('ties go to the earliest', () => {
  const m = pickMoments(days([5, 0, 5, 0, 1, 1, 0, 1, 1]));
  assert.equal(m.find(x => x.kind === 'day')!.from, '2026-01-01');
  assert.equal(m.find(x => x.kind === 'streak')!.from, '2026-01-05');
});

test('a quiet stretch that runs up to today is marked ongoing', () => {
  const d = days([3, 1, ...Array(9).fill(0)]);
  const m = pickMoments(d, d.at(-1)!.date);
  const q = m.find(x => x.kind === 'quiet')!;
  assert.equal(q.title, 'Quiet lately');
  assert.match(q.caption, /since Jan 3/);
  assert.equal(pickMoments(d).find(x => x.kind === 'quiet')!.title, 'Quiet stretch');
});

test('short quiet gaps and single active days are not moments', () => {
  const m = pickMoments(days([2, 0, 0, 3, 0, 1]));
  assert.ok(!m.some(x => x.kind === 'quiet'));
  assert.ok(!m.some(x => x.kind === 'streak'));
  assert.equal(m.length, 2);
});

test('byMonth and summarizeGitHub', () => {
  const d = days([1, 2, 3], '2026-03-30');
  assert.equal(byMonth(d)[2], 3);
  assert.equal(byMonth(d)[3], 3);
  const s = summarizeGitHub(d)!;
  assert.equal(s.total, 6);
  assert.equal(s.streak, 3);
  assert.equal(s.activeDays, 3);
});

test('markdownFor(<year>) returns the year, null outside the range', () => {
  const y = String(currentYear());
  assert.match(markdownFor(y)!, new RegExp(`^# ${y}, so far`));
  assert.match(markdownFor('2024')!, /^# 2024\n/);
  assert.match(markdownFor(`/${y}`)!, new RegExp(`Source: https?://.+/${y}\\n`));
  assert.equal(markdownFor('2023'), null);
  assert.equal(markdownFor(String(currentYear() + 1)), null);
});
