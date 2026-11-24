// The résumé page's PDF layer must match the PDF word for word.
// tests/fixtures/resume-pdf.txt is the PDF's text (extracted with PDFKit, phone removed);
// refresh it whenever public/assets/devashish-juyal-resume.pdf changes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { education, skills, jobs, resumeProjects, activities, contact } = await import('../lib/resume');

// The PDF wraps lines and sets bullets as "•"; compare on single-spaced text.
const norm = (s: string) => s.replace(/•/g, ' ').replace(/\s+/g, ' ').trim();
const pdf = norm(readFileSync(new URL('./fixtures/resume-pdf.txt', import.meta.url), 'utf8'));
const has = (s: string) => assert.ok(pdf.includes(norm(s)), `not in the PDF: ${s.slice(0, 80)}`);

test('education, skills and activities are in the PDF verbatim', () => {
  for (const e of education) [e.org, e.place, e.line, e.dates, `Coursework: ${e.coursework}`].forEach(has);
  for (const k of skills) has(`${k.label}: ${k.items}`);
  has(activities);
});

test('jobs are in the PDF verbatim', () => {
  for (const j of jobs) [j.org, j.place, j.role, j.dates, ...j.bullets].forEach(has);
});

test('PDF projects are in the PDF verbatim, and nothing else claims to be', () => {
  const fromPdf = resumeProjects.filter(p => p.fromPdf);
  assert.equal(fromPdf.length, 3);
  for (const p of fromPdf) [p.name, ...p.bullets].forEach(has);
  for (const p of resumeProjects.filter(p => !p.fromPdf)) assert.ok(!pdf.includes(norm(p.bullets[0])));
});

test('no phone number on the page data', () => {
  const all = JSON.stringify({ education, skills, jobs, resumeProjects, activities, contact });
  assert.ok(!/\d{3}\)?[-. ]\d{3}[-. ]\d{4}/.test(all));
});
