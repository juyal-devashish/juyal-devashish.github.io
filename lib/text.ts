// Plain-text views of the site: markdown copies of each page, llms.txt and the search index.
// Built from the same data as the pages, so they can't drift.
import { site, projects, work, experience, education, recognition, now, uses, nav, writingOn } from './site';
import { papers } from './papers';
import { photos } from './photos';
import { getPosts, formatDate } from './posts';
import { parseYear, yearStatic, currentYear } from './year';

const abs = (p: string) => (p.startsWith('http') || p.startsWith('mailto:') ? p : site.url + p);
const readPapers = () => papers.filter(p => p.read);
export const usesVisible = () => uses.length > 0;

export function pageList() {
  const posts = getPosts();
  return [
    { path: '/', md: '/index.md', title: 'Home', about: 'who I am and what I’m building' },
    { path: '/projects', md: '/projects.md', title: 'Projects', about: 'things I’ve built' },
    ...(writingOn ? [{ path: '/writing', md: '/writing.md', title: 'Writing', about: `${posts.length} posts` }] : []),
    { path: '/stack', md: '/stack.md', title: 'Stack', about: 'papers I’ve read, with notes' },
    { path: '/resume', md: '/resume.md', title: 'Résumé', about: 'work, education, recognition' },
    { path: '/photos', md: '/photos.md', title: 'Photos', about: 'photos I’ve taken' },
    { path: '/now', md: '/now.md', title: 'Now', about: 'what I’m focused on' },
    ...(usesVisible() ? [{ path: '/uses', md: '/uses.md', title: 'Uses', about: 'tools I use' }] : []),
    { path: `/${currentYear()}`, md: `/${currentYear()}.md`, title: `${currentYear()}, so far`, about: 'the year in data' },
  ];
}

function projectsMd(list = projects) {
  return list.map(p => `- **${p.name}** (${[p.year, p.status].filter(Boolean).join(', ')}): ${p.summary} ${p.links.map(l => `[${l.label}](${l.href})`).join(' · ')}`).join('\n');
}

export function markdownFor(path: string): string | null {
  const key = path.replace(/^\/+|\/+$/g, '') || 'index';
  const posts = getPosts();
  const out: string[] = [];
  const src = `\n---\n\nSource: ${site.url}${key === 'index' ? '' : '/' + key}\n`;

  if (key === 'index') {
    out.push(`# ${site.name}`, '', `> ${site.role}. ${site.pitch}`, '', ...site.glance.map(g => `- **${g.label}**: ${g.value}`), '',
      '## Projects', '', projectsMd(projects.filter(p => p.thumb)), '',
      ...(posts.length ? ['## Writing', '', ...posts.slice(0, 5).map(p => `- [${p.title}](${site.url}/writing/${p.slug}) · ${formatDate(p.date)}`), ''] : []),
      '## Contact', '', `- Email: ${site.email}`, `- GitHub: ${site.links.github}`, `- LinkedIn: ${site.links.linkedin}`, `- Résumé: ${abs(site.resume)}`);
  } else if (key === 'projects') {
    out.push('# Projects', '', projectsMd());
  } else if (key === 'writing' && writingOn) {
    out.push('# Writing', '', posts.length ? posts.map(p => `- [${p.title}](${site.url}/writing/${p.slug}.md) · ${formatDate(p.date)}${p.summary ? `: ${p.summary}` : ''}`).join('\n') : 'Nothing yet.');
  } else if (key.startsWith('writing/')) {
    const p = posts.find(x => x.slug === key.slice(8));
    if (!p) return null;
    out.push(`# ${p.title}`, '', `*${formatDate(p.date)} · ${p.minutes} min*`, '', p.body.trim());
  } else if (key === 'stack') {
    out.push('# Stack', '', 'Papers I’ve read.', '');
    readPapers().forEach(p => {
      out.push(`- ${p.link ? `[${p.title}](${p.link})` : p.title}, ${p.authors}: ${p.takeaway}`);
      ['What it does', 'Why it matters', 'How it works', 'Key result'].forEach((q, i) => p.notes[i] && out.push(`  - ${q}: ${p.notes[i]}`));
    });
  } else if (key === 'resume') {
    out.push(`# ${site.name}: Résumé`, '', `PDF: ${abs(site.resume)}`, '', '## Work', '', `- **${work.org}**, ${work.role} (${work.dates})`, ...work.items.map(i => `  - ${i.name}: ${i.text}`),
      ...experience.map(r => `- **${r.org}**, ${r.role} (${r.dates}): ${r.text}`), '', '## Education', '', ...education.map(r => `- **${r.org}**, ${r.role} (${r.dates})`),
      '', '## Recognition', '', ...recognition.map(r => `- **${r.org}**${r.role ? `: ${r.role}` : ''}${r.dates ? ` (${r.dates})` : ''}`));
  } else if (key === 'photos') {
    out.push('# Photos', '', ...photos.map(p => `- ${p.caption}: ${p.alt} (${site.url}/assets/img/photos/${p.file})`));
  } else if (key === 'now') {
    out.push('# Now', '', `*Updated ${now.updated}*`, '', now.focus, '', ...now.building.map(b => `- Building: ${b}`));
  } else if (parseYear(key)) {
    // Static parts only (markdownFor is synchronous); live numbers are on the page itself.
    const y = parseYear(key)!;
    const st = yearStatic(y);
    out.push(`# ${y}${y === currentYear() ? ', so far' : ''}`, '', `Live numbers (GitHub contributions, coding hours, page views) are on ${site.url}/${y}.`, '',
      `- Projects: ${st.projects.length}`, `- Posts: ${st.posts.length}`, ...(st.papers.length ? [`- Papers read: ${st.papers.length}`] : []), '',
      ...(st.projects.length ? ['## Projects', '', projectsMd(st.projects), ''] : []),
      ...(st.posts.length ? ['## Writing', '', ...st.posts.map(p => `- [${p.title}](${site.url}/writing/${p.slug}.md) · ${formatDate(p.date)}`), ''] : []),
      ...(st.papers.length ? ['## Papers read', '', ...st.papers.map(p => `- ${p.link ? `[${p.title}](${p.link})` : p.title}, ${p.authors}`), ''] : []));
  } else if (key === 'uses' && usesVisible()) {
    out.push('# Uses', '', ...uses.flatMap(g => [`## ${g.group}`, '', ...g.items.map(i => `- ${i.href ? `[${i.name}](${i.href})` : i.name}: ${i.note}`), '']));
  } else {
    return null;
  }
  return out.join('\n') + '\n' + src;
}

export function llmsTxt(): string {
  return [
    `# ${site.name}`, '', `> ${site.role} in ${site.city}. ${site.pitch}`, '',
    'Each page is also available as markdown at the URL below.', '',
    '## Pages', '', ...pageList().map(p => `- [${p.title}](${site.url}${p.md}): ${p.about}`), `- [Résumé (PDF)](${abs(site.resume)})`, '',
    '## Projects', '', ...projects.map(p => `- [${p.name}](${p.links[0]?.href ?? site.url + '/projects#' + p.id}): ${p.summary}`), '',
    '## Contact', '', `- Email: ${site.email}`, `- LinkedIn: ${site.links.linkedin}`, `- GitHub: ${site.links.github}`, '',
  ].join('\n');
}

// ---------- search index (⌘K) ----------
export type SearchEntry = { id: string; type: 'action' | 'page' | 'project' | 'role' | 'post' | 'paper' | 'photo'; title: string; meta: string; blurb: string; kw?: string; text?: string; href?: string; ext?: string; act?: string; value?: string; img?: string };

export function searchIndex(): SearchEntry[] {
  const e: SearchEntry[] = [];
  e.push({ id: 'email', type: 'action', title: 'Email me', meta: site.email, blurb: 'Opens your mail app.', kw: 'contact write hire', href: `mailto:${site.email}` });
  e.push({ id: 'copy-email', type: 'action', title: 'Copy email address', meta: site.email, blurb: 'Copies my address.', kw: 'contact clipboard', act: 'copy-email', value: site.email });
  e.push({ id: 'theme', type: 'action', title: 'Switch theme', meta: 'Alt+T', blurb: 'Light or dark.', kw: 'dark light mode appearance', act: 'theme' });
  e.push({ id: 'resume-pdf', type: 'action', title: 'Résumé (PDF)', meta: 'PDF', blurb: 'One page.', kw: 'cv download', href: site.resume });
  e.push({ id: 'github', type: 'action', title: 'GitHub', meta: 'New tab', blurb: 'My code.', kw: 'code repos', ext: site.links.github });
  e.push({ id: 'linkedin', type: 'action', title: 'LinkedIn', meta: 'New tab', blurb: 'My profile.', kw: 'social connect', ext: site.links.linkedin });
  nav.forEach((n, i) => e.push({ id: `go-${n.label.toLowerCase()}`, type: 'page', title: n.label, meta: `Alt+${i + 1}`, blurb: '', kw: 'go page', href: n.href }));
  e.push({ id: 'go-now', type: 'page', title: 'Now', meta: 'Page', blurb: 'What I’m focused on.', kw: 'current focus', href: '/now' });
  e.push({ id: 'go-year', type: 'page', title: `${currentYear()}, so far`, meta: 'Page', blurb: 'The year in data.', kw: 'stats data year activity github', href: `/${currentYear()}` });
  if (usesVisible()) e.push({ id: 'go-uses', type: 'page', title: 'Uses', meta: 'Page', blurb: 'Tools I use.', kw: 'tools gear setup', href: '/uses' });
  projects.forEach(p => e.push({ id: p.id, type: 'project', title: p.name, meta: [p.year, p.status].filter(Boolean).join(' · '), blurb: p.summary, kw: [p.area, ...(p.tags ?? [])].join(' '), text: p.notes ? Object.values(p.notes).join(' ') : '', href: `/projects#${p.id}`, img: p.thumb }));
  e.push({ id: work.id, type: 'role', title: work.org, meta: `${work.dates} · ${work.role}`, blurb: work.items.map(i => i.name).join(', '), kw: 'job work', href: `/resume#${work.id}` });
  [...experience, ...education, ...recognition].forEach(r => e.push({ id: r.id, type: 'role', title: r.org, meta: [r.role, r.dates].filter(Boolean).join(' · '), blurb: r.text ?? r.role ?? '', kw: 'background', href: `/resume#${r.id}` }));
  getPosts().forEach(p => e.push({ id: `post-${p.slug}`, type: 'post', title: p.title, meta: formatDate(p.date), blurb: p.summary, text: p.body.slice(0, 2000), href: `/writing/${p.slug}` }));
  readPapers().forEach(p => {
    const id = slug(p.title);
    e.push({ id: `paper-${id}`, type: 'paper', title: p.title, meta: p.authors, blurb: p.takeaway, kw: p.tags.join(' '), text: p.notes.join(' '), href: `/stack#${id}`, ext: p.link });
  });
  photos.forEach(p => e.push({ id: `photo-${p.file.replace(/\.jpg$/, '')}`, type: 'photo', title: p.caption, meta: 'Photo', blurb: p.alt, href: `/photos#${p.file.replace(/\.jpg$/, '')}`, img: `/assets/img/photos/${p.file}` }));
  const seen = new Set<string>();
  e.forEach(x => { if (seen.has(x.id)) throw new Error(`search index: duplicate id ${x.id}`); seen.add(x.id); });
  return e;
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60).replace(/^-|-$/g, '');
