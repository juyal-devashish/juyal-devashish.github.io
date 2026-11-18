import type { Metadata } from 'next';
import { pageMeta } from '@/lib/meta';
import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import Terminal from '@/components/terminal/Terminal';
import type { Line, TermData } from '@/components/terminal/engine';
import s from '@/components/terminal/terminal.module.css';
import { site, projects, now, nav } from '@/lib/site';
import { papers } from '@/lib/papers';
import { pageList, slug } from '@/lib/text';

export const metadata: Metadata = pageMeta('/cmd', 'Terminal', 'The site as a small shell. Type help.', { md: false });

const t = (text: string, kind?: Line['kind']): Line => ({ kind, segs: [text] });
const pad = (rows: [string, string][]) => {
  const w = Math.max(...rows.map(r => r[0].length)) + 2;
  return rows.map(([a, b]): Line => ({ cols: w, segs: [a, b] }));
};

function termData(): TermData {
  const read = papers.filter(p => p.read);
  const pages = pageList().filter(p => p.path !== '/');
  const sections = [
    ...pages.map(p => ({ name: p.path.slice(1), href: p.path, about: p.about })),
    { name: 'cmd', href: '/cmd', about: 'this terminal' },
  ];
  const metaOf = (p: (typeof projects)[number]) => [p.year, p.status, p.area].filter(Boolean).join(' · ');

  const files: Record<string, Line[]> = {
    'about.txt': [
      t(site.name, 'hot'),
      t(`${site.role} · ${site.city}`, 'dim'),
      t(site.pitch),
      t(''),
      ...pad(site.glance.map(g => [g.label.toLowerCase(), g.value])),
    ],
    'now.txt': [
      t(`updated ${now.updated}`, 'dim'),
      t(now.focus),
      ...(now.building.length ? [t(''), ...pad(now.building.map(b => ['building', b] as [string, string]))] : []),
    ],
    'projects.txt': [
      ...pad(projects.map(p => [p.id, p.summary])),
      t(''),
      t('open <project> to jump to one', 'dim'),
    ],
    'papers.txt': [
      ...read.flatMap(p => [t(p.title, 'hot'), t(`  ${p.authors}`, 'dim')]),
      t(''),
      t(`${read.length} read · notes on /stack`, 'dim'),
    ],
    'contact.txt': [
      { row: true, cols: 10, segs: ['email', { text: site.email, href: `mailto:${site.email}` }] },
      { row: true, cols: 10, segs: ['github', { text: site.links.github.replace(/^https:\/\//, ''), href: site.links.github, ext: true }] },
      { row: true, cols: 10, segs: ['linkedin', { text: site.links.linkedin.replace(/^https:\/\/(www\.)?/, ''), href: site.links.linkedin, ext: true }] },
      { row: true, cols: 10, segs: ['résumé', { text: 'PDF', href: site.resume }] },
    ],
  };

  return {
    name: site.name,
    role: site.role,
    city: site.city,
    timeZone: site.timeZone,
    email: site.email,
    sections,
    files,
    projects: projects.map(p => ({ id: p.id, name: p.name, meta: metaOf(p), summary: p.summary, links: p.links })),
    papers: read.map(p => ({ slug: slug(p.title), title: p.title })),
  };
}

export default function CmdPage() {
  const data = termData();
  const read = data.papers.length;
  const banner = {
    mount: data.sections.filter(x => x.name !== 'cmd').map(x => x.name + '/').join(' '),
    load: `${data.projects.length} projects · ${read} papers · ${Object.keys(data.files).length} files`,
  };
  const no = nav.findIndex(n => n.href === '/cmd') + 1;
  return (
    <section className="sec first" id="terminal" aria-labelledby="terminal-h">
      <SectionHeader id="terminal" as="h1" no={no || undefined} label="Terminal" title="The site, as a" accent="shell" copy={false} />

      <div className="js-only">
        <Terminal data={data} banner={banner} />
      </div>

      <nav className={s.nojs} aria-label="Sections">
        <p className={s.nojsHead}><span>$</span> ls ~ <span className="vh">(the terminal needs JavaScript; here are the sections)</span></p>
        <ul>
          {[{ name: 'home', href: '/', about: 'who I am' }, ...data.sections.filter(x => x.name !== 'cmd')].map(x => (
            <li key={x.href}>
              <Link href={x.href}><span className={s.nm}>{x.name}/</span><span className={s.ab}>{x.about}</span></Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
