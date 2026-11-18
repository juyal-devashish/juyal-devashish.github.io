// Turns read papers into sheet data. Pure and deterministic, so the server and
// the client render identical markup (no hydration drift).
import type { Paper } from '@/lib/papers';
import { slug } from '@/lib/text';

export type Sheet = {
  id: string;          // slug(title): the index item's id and the #hash deep link
  title: string;
  authors: string;     // as written in lib/papers: "Vaswani et al., NeurIPS 2017"
  byline: string;      // the names part: "Vaswani et al."
  venue: string;       // the venue part: "NeurIPS 2017"
  where: string;       // the venue without its year, shortened for the sheet header: "NeurIPS"
  year: string;        // "2017" (kept whole on the sheet; only `where` may be cut)
  long: boolean;       // a long title, set a size smaller so it fits the page
  date: string;
  tags: string[];
  link?: string;
  takeaway: string;
  notes: string[];
  hasNotes: boolean;
  pinned: boolean;
  tilt: string;        // "-1.2deg": a fixed string, so SSR and hydration agree
  lines: number;       // how many abstract lines to draw (3..5), for variety
};

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// "Vaswani et al., NeurIPS 2017" → ["Vaswani et al.", "NeurIPS 2017"]; "Hazan et al., 2023" → venue "2023".
function split(authors: string) {
  const i = authors.lastIndexOf(',');
  return i < 0 ? [authors, ''] : [authors.slice(0, i).trim(), authors.slice(i + 1).trim()];
}

// Short forms for the sheet header, which is only a few words wide.
const SHORT: Record<string, string> = { 'Hugging Face': 'HF' };

function venueParts(venue: string) {
  const m = /^(.*?)\s*(\d{4})$/.exec(venue);
  const where = m ? m[1] : venue;
  return { where: SHORT[where] ?? where, year: m ? m[2] : '' };
}

export function toSheets(papers: Paper[]): Sheet[] {
  return papers.map(p => {
    const h = hash(p.title);
    const [byline, venue] = split(p.authors);
    return {
      id: slug(p.title), title: p.title, authors: p.authors, byline, venue, ...venueParts(venue), long: p.title.length > 76, date: p.date, tags: p.tags,
      link: p.link, takeaway: p.takeaway, notes: p.notes, hasNotes: p.notes.some(Boolean), pinned: p.pinned,
      tilt: `${(((h % 33) - 16) / 10).toFixed(1)}deg`,   // -1.6 … 1.6
      lines: 3 + ((h >>> 8) % 3),
    };
  });
}
