import Image from 'next/image';
import Link from 'next/link';
import { archive, site } from '@/lib/site';
import { activities, contact, education, jobs, resumeProjects, skills, type More } from '@/lib/resume';
import SectionHeader from '@/components/SectionHeader';
import Reveal from '@/components/Reveal';
import Lightbox from '@/components/Lightbox';
import PrintButton from '@/components/projects/PrintButton';
import { pageMeta } from '@/lib/meta';
import s from './resume.module.css';

export const metadata = pageMeta('/resume', 'Résumé', `${site.name}: education, skills, work, projects and activities. PDF included.`);

// Extra detail beyond the PDF, closed by default so the page reads like the PDF.
function MoreDetail({ more, name }: { more: More; name: string }) {
  return (
    <details className={s.more}>
      <summary>More<span className="vh"> on {name}</span></summary>
      {more.lead ? <p className={s.lead}>{more.lead}</p> : null}
      <ul className={s.bullets}>{more.points.map(t => <li key={t}>{t}</li>)}</ul>
    </details>
  );
}

export default function ResumePage() {
  return (
    <div className={s.page}>
      <section className="sec first" aria-labelledby="resume-h">
        <SectionHeader id="resume" no={5} label="Résumé" title="Work and" accent="study" as="h1" copy={false} dek={`${site.role} · ${site.city}`} />
        <div className={`hbtns ${s.actions}`}>
          <a className="hbtn primary" href={site.resume} download>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" /></svg>
            Download PDF
          </a>
          <PrintButton pdf={site.resume} />
        </div>
        <p className={s.contact}>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          <span aria-hidden="true">|</span>
          <a href={contact.linkedin.href} rel="noopener">{contact.linkedin.label}</a>
        </p>

        <Reveal as="section" className={s.blk} aria-labelledby="edu-h">
          <h2 id="edu-h" className={`label ${s.h}`}>Education</h2>
          <ul className={s.rows}>
            {education.map(e => (
              <li key={e.id} id={e.id} className={s.row}>
                <h3 className={s.org}>{e.org}</h3>
                <span className={s.place}>{e.place}</span>
                <p className={s.role}>{e.line}</p>
                <span className={s.dates}>{e.dates}</span>
                <p className={s.text}><b>Coursework:</b> {e.coursework}</p>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className={s.blk} aria-labelledby="skills-h">
          <h2 id="skills-h" className={`label ${s.h}`}>Skills</h2>
          <dl className={s.skills}>
            {skills.map(k => <div key={k.label}><dt>{k.label}:</dt><dd>{k.items}</dd></div>)}
          </dl>
        </Reveal>

        <Reveal as="section" className={s.blk} aria-labelledby="work-h">
          <h2 id="work-h" className={`label ${s.h}`}>Work Experience</h2>
          <ul className={s.rows}>
            {jobs.map(j => (
              <li key={j.id} id={j.id} className={s.row}>
                <h3 className={s.org}>{j.org}</h3>
                <span className={s.place}>{j.place}</span>
                <p className={s.role}>{j.role}</p>
                <span className={s.dates}>{j.dates}</span>
                <ul className={s.bullets}>{j.bullets.map(t => <li key={t}>{t}</li>)}</ul>
                {j.more ? <MoreDetail more={j.more} name={j.org} /> : null}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className={s.blk} aria-labelledby="proj-h">
          <h2 id="proj-h" className={`label ${s.h}`}>Project Experience</h2>
          <ul className={s.rows}>
            {resumeProjects.map(p => (
              <li key={p.id} id={p.id} className={s.row}>
                <h3 className={`${s.org} ${s.pname}`}>{p.name}</h3>
                <p className={s.links}>
                  {p.links.map(l => <a key={l.href} href={l.href} rel="noopener">{l.label}<span className="vh">: {p.name}</span></a>)}
                  {p.project ? <Link href={`/projects#${p.project}`}>On the projects page<span className="vh">: {p.name}</span></Link> : null}
                </p>
                <ul className={s.bullets}>{p.bullets.map(t => <li key={t}>{t}</li>)}</ul>
                {p.more ? <MoreDetail more={p.more} name={p.name} /> : null}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal as="section" className={s.blk} aria-labelledby="act-h">
          <h2 id="act-h" className={`label ${s.h}`}>Activities</h2>
          <p className={s.activities}>{activities}</p>
        </Reveal>

        {archive.length > 0 && (
          <Reveal as="section" className={`${s.blk} ${s.archiveBlk}`} aria-labelledby="arc-h">
            <h2 id="arc-h" className={`label ${s.h}`}>From the archive</h2>
            <ul className={s.archive}>
              {archive.map((a, i) => (
                <li key={a.full}>
                  <figure>
                    <a href={a.full} data-lightbox="archive" data-index={i} className={s.arcLink}>
                      <Image src={a.thumb} alt={a.alt} width={a.w} height={a.h} sizes="(min-width: 900px) 240px, 45vw" />
                    </a>
                    <figcaption>{a.caption}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </section>
      <Lightbox group="archive" label="Archive viewer" items={archive.map(a => ({ src: a.full, alt: a.alt, caption: a.caption }))} />
    </div>
  );
}
