// Pieces shared by the project cards (client) and the featured project (server).
import type { Project } from '@/lib/site';
import StatusBadge from '@/components/StatusBadge';
import s from './projects.module.css';

export function Meta({ p }: { p: Project }) {
  return (
    <p className={`meta ${s.meta}`}>
      {p.year ? <><span>{p.year}</span><span aria-hidden="true">·</span></> : null}
      <span>{p.area}</span>
      <StatusBadge status={p.status} />
      {p.tags?.map(t => <span key={t} className="badge note">{t}</span>)}
    </p>
  );
}

export function Links({ p }: { p: Project }) {
  return (
    <ul className={`qlinks ${s.links}`} aria-label={`${p.name} links`}>
      {p.links.map(l => (
        <li key={l.href}><a className="qlink" href={l.href} rel="noopener">{l.label}<span className="vh">: {p.name}</span></a></li>
      ))}
    </ul>
  );
}

export function Notes({ p }: { p: Project }) {
  if (!p.notes) return null;
  return (
    <dl className={s.notes}>
      <div><dt>Problem</dt><dd>{p.notes.problem}</dd></div>
      <div><dt>Built</dt><dd>{p.notes.built}</dd></div>
      <div><dt>Result</dt><dd>{p.notes.result}</dd></div>
    </dl>
  );
}
