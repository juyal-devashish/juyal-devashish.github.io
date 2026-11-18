// Stack: only papers he has read, as a stack of first pages (JS) over a plain
// reference list that is always in the HTML (ids = slug(title), so /stack#slug
// works everywhere).
import type { Metadata } from 'next';
import { pageMeta } from '@/lib/meta';
import { papers } from '@/lib/papers';
import SectionHeader from '@/components/SectionHeader';
import Shelf from '@/components/shelf/Shelf';
import { toSheets } from '@/components/shelf/sheets';
import { NOTE_LABELS } from '@/components/shelf/labels';
import s from '@/components/shelf/shelf.module.css';

const description = 'Research papers Devashish Juyal has read, with a takeaway for each and notes on some.';

export const metadata: Metadata = pageMeta('/stack', 'Stack', description);

const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

export default function StackPage() {
  const sheets = toSheets(papers.filter(p => p.read));
  const n = sheets.length;
  const count = words[n] ?? String(n);
  const withNotes = sheets.filter(p => p.hasNotes).length;
  const dek = `${count[0].toUpperCase()}${count.slice(1)} paper${n === 1 ? '' : 's'}${withNotes === n ? ', each with notes' : withNotes ? `, ${words[withNotes] ?? withNotes} with notes` : ''}.`;

  return (
    <section className="sec first" id="stack" aria-labelledby="stack-h">
      <div className={s.intro}>
        <SectionHeader id="stack" as="h1" label="Stack" title="Papers I’ve" accent="read" dek={dek} />
        <figure className={s.photo}>
          <img src="/assets/img/archive/annotated-paper.jpg" width={440} height={782} loading="lazy"
            alt="A printed IEEE journal paper on metamaterial-lined circular waveguides, its abstract and opening paragraphs marked with yellow highlighter and handwritten notes, beside a pen on a wooden desk." />
          <figcaption>Highlighter in hand.</figcaption>
        </figure>
      </div>

      {n ? <Shelf sheets={sheets} /> : null}

      <h2 className={`kicker ${s.listHead}`} id="list-h">References</h2>
      <ol className={s.list} aria-labelledby="list-h">
        {sheets.map((p, i) => (
          <li key={p.id} id={p.id} className={s.item}>
            <p className={s.side}>
              <span className={s.no}>[{String(i + 1).padStart(2, '0')}]</span>
              <span>{p.date}</span>
              <span>{p.tags.join(' · ')}</span>
              {p.pinned ? <span>Pinned</span> : null}
            </p>
            <h3 className={s.ptitle}>{p.title}</h3>
            <p className={s.pauth}>{p.authors}</p>
            <p className={s.ptake}>{p.takeaway}</p>
            {p.hasNotes ? (
              <details className={s.more}>
                <summary>Notes<span className="vh"> on {p.title}</span></summary>
                <dl className={s.notes}>
                  {NOTE_LABELS.map((q, k) => p.notes[k] ? <div key={q}><dt>{q}</dt><dd>{p.notes[k]}</dd></div> : null)}
                </dl>
              </details>
            ) : null}
            {p.link ? (
              <p><a className="qlink" href={p.link} rel="noopener">Read the paper<span className="vh">: {p.title}</span> <span aria-hidden="true">↗</span></a></p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
