import Image from 'next/image';
import { archive, education, experience, recognition, site, work, type Row } from '@/lib/site';
import SectionHeader from '@/components/SectionHeader';
import Reveal from '@/components/Reveal';
import Lightbox from '@/components/Lightbox';
import PrintButton from '@/components/projects/PrintButton';
import { pageMeta } from '@/lib/meta';
import s from './resume.module.css';

export const metadata = pageMeta('/resume', 'Résumé', `${site.name}: work, education and recognition. PDF included.`);

function Rows({ rows }: { rows: Row[] }) {
  return (
    <ul className={s.rows}>
      {rows.map(r => (
        <li key={r.id} id={r.id} className={s.row}>
          <h3 className={s.org}>{r.org}</h3>
          {r.dates ? <span className={s.dates}>{r.dates}</span> : null}
          {r.role ? <p className={s.role}>{r.role}</p> : null}
          {r.text ? <p className={s.text}>{r.text}</p> : null}
        </li>
      ))}
    </ul>
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
          <PrintButton />
        </div>

        <Reveal as="section" className={s.blk} aria-labelledby="work-h">
          <h2 id="work-h" className={`label ${s.h}`}>Work</h2>
          <div>
            <div id={work.id} className={`${s.row} ${s.job}`}>
              <h3 className={s.org}>{work.org}</h3>
              <span className={s.dates}>{work.dates}</span>
              <p className={s.role}>{work.role}</p>
              <ol className={s.items}>
                {work.items.map((it, i) => (
                  <li key={it.name}><span className={s.ix} aria-hidden="true">{['i', 'ii', 'iii', 'iv', 'v', 'vi'][i] ?? i + 1}</span><b>{it.name}</b><span>{it.text}</span></li>
                ))}
              </ol>
            </div>
            <Rows rows={experience} />
          </div>
        </Reveal>

        <Reveal as="section" className={s.blk} aria-labelledby="edu-h">
          <h2 id="edu-h" className={`label ${s.h}`}>Education</h2>
          <Rows rows={education} />
        </Reveal>

        <Reveal as="section" className={s.blk} aria-labelledby="rec-h">
          <h2 id="rec-h" className={`label ${s.h}`}>Recognition</h2>
          <Rows rows={recognition} />
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
