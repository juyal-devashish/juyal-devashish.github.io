// Blog posts: one markdown file per post in content/posts/<slug>.md, with front matter:
// ---
// title: My post
// date: 2026-11-17
// summary: One line.
// draft: true        (optional; drafts are hidden in production)
// ---
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { writingOn } from './site';

const DIR = path.join(process.cwd(), 'content/posts');

export type Post = { slug: string; title: string; date: string; summary: string; draft: boolean; body: string; minutes: number };

function parse(slug: string, raw: string): Post {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  if (m) for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
  const body = m ? m[2] : raw;
  if (!meta.title || !meta.date) throw new Error(`content/posts/${slug}.md needs a title and a date in its front matter`);
  const words = body.split(/\s+/).filter(Boolean).length;
  return { slug, title: meta.title, date: meta.date, summary: meta.summary ?? '', draft: meta.draft === 'true', body, minutes: Math.max(1, Math.round(words / 230)) };
}

export function getPosts(): Post[] {
  // Writing is off (lib/site.ts writingOn); tests set SITE_WRITING_TEST to exercise the parser anyway.
  if (!writingOn && !process.env.SITE_WRITING_TEST) return [];
  if (!fs.existsSync(DIR)) return [];
  return fs.readdirSync(DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => parse(f.replace(/\.md$/, ''), fs.readFileSync(path.join(DIR, f), 'utf8')))
    .filter(p => !p.draft || process.env.NODE_ENV !== 'production')
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find(p => p.slug === slug);
}

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false, gfm: true }) as string;
}

export function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}
