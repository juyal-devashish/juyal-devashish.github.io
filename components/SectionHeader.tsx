// Numbered mono kicker + serif heading with an italic accent word + drawn orbit arcs + Copy link.
//   <SectionHeader id="projects" no={2} label="Projects" title="Things I’ve" accent="made" />
// renders "02 — Projects" and <h2 id="projects-h">Things I’ve <em>made</em></h2>.
// Put id on the surrounding <section> yourself: <section id="projects" aria-labelledby="projects-h">.
import type { ReactNode } from 'react';
import CopyLink from './CopyLink';

type Props = {
  id?: string;            // section anchor; enables Copy link and gives the heading id `${id}-h`
  no?: number | string;   // 1 → "01"
  label: string;          // kicker text, also used in "Copy link to <label>"
  title: string;          // text before the accent word
  accent?: string;        // italic orange word(s)
  after?: string;         // text after the accent word
  as?: 'h1' | 'h2';       // h1 for the page title (one per page)
  dek?: ReactNode;        // optional one-line summary under the heading
  copy?: boolean;         // show Copy link (default: true when id is set)
  ornament?: boolean;     // drawn orbit arcs (default true)
};

// Elliptical arcs like the hero artwork; one of them glows orange.
function arcs(seed: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const rx = 120 + i * 46, ry = 40 + i * 22;
    return { d: `M ${400 - rx * 2 + 60} 200 A ${rx} ${ry} 0 0 1 460 ${200 - ry * 0.2}`, hot: i === (seed % 3) + 2, o: +(0.15 + i * 0.08).toFixed(2) };
  });
}

export default function SectionHeader({ id, no, label, title, accent, after, as: H = 'h2', dek, copy, ornament = true }: Props) {
  const num = no == null ? null : typeof no === 'number' ? String(no).padStart(2, '0') : no;
  const seed = typeof no === 'number' ? no : label.length;
  const showCopy = copy ?? !!id;
  return (
    <div className="sec-head">
      {ornament && (
        <svg className="orn" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {arcs(seed).map((a, i) => <path key={i} d={a.d} pathLength={1} className={a.hot ? 'hot' : undefined} style={{ opacity: a.hot ? 1 : a.o }} />)}
        </svg>
      )}
      <p className="sec-no">{num ? `${num} — ${label}` : label}</p>
      <H id={id ? `${id}-h` : undefined}>
        {title}{accent ? <>{title ? ' ' : ''}<em>{accent}</em></> : null}{after ? ` ${after}` : null}
      </H>
      {showCopy && id ? <CopyLink id={id} label={label} /> : null}
      {dek ? <p className="dek">{dek}</p> : null}
    </div>
  );
}
