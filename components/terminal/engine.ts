// The terminal's brain: pure functions, no DOM, no React. Data comes in from the server page.
// run() turns one command line into output lines plus an optional effect the UI carries out.

export type Seg = string | { text: string; href: string; ext?: boolean };
// cols: a key column `cols` characters wide, then the rest of segs (wraps inside its own column).
export type Line = { kind?: 'dim' | 'hot' | 'err' | 'ring' | 'art'; segs: Seg[]; label?: string; row?: boolean; cols?: number };

export type TermProject = { id: string; name: string; meta: string; summary: string; links: { label: string; href: string }[] };
export type TermData = {
  name: string;
  role: string;
  city: string;
  timeZone: string;
  email: string;
  sections: { name: string; href: string; about: string }[];
  files: Record<string, Line[]>;
  projects: TermProject[];
  papers: { slug: string; title: string }[];
};

export type Effect =
  | { type: 'nav'; href: string }
  | { type: 'clear' }
  | { type: 'sound'; value?: boolean }
  | { type: 'search'; q: string }
  | { type: 'history' }
  | { type: 'date' };

export type Result = { lines: Line[]; effect?: Effect; error?: boolean };

export const COMMANDS: { name: string; args?: string; about: string }[] = [
  { name: 'help', about: 'this list' },
  { name: 'ls', args: '[section]', about: 'list sections and files' },
  { name: 'cd', args: '<section>', about: 'go to a page' },
  { name: 'cat', args: '<file>', about: 'print a file' },
  { name: 'open', args: '<project>', about: 'jump to a project' },
  { name: 'search', args: '<words>', about: 'search the site' },
  { name: 'whoami', about: 'who’s here' },
  { name: 'date', about: 'time in New York City' },
  { name: 'sound', args: '[on|off]', about: 'interface clicks' },
  { name: 'history', about: 'past commands' },
  { name: 'echo', args: '<text>', about: 'say it back' },
  { name: 'clear', about: 'wipe the screen (Ctrl+L)' },
  { name: 'exit', about: 'back to home' },
  { name: 'orbit', about: 'a clock made of rings' },
  { name: 'stars', about: 'look up' },
  { name: 'sudo', about: 'ask nicely' },
];
const NAMES = COMMANDS.map(c => c.name);
const ALIASES: Record<string, string> = { '?': 'help', man: 'help', dir: 'ls', ll: 'ls', type: 'cat', less: 'cat', more: 'cat', find: 'search', grep: 'search', cls: 'clear', quit: 'exit', logout: 'exit', pwd: 'pwd' };
const HOME = ['~', '/', '..', 'home', '~/'];
const SECTION_ALIASES: Record<string, string> = { papers: 'stack', shelf: 'stack', 'résumé': 'resume', cv: 'resume', blog: 'writing', posts: 'writing', work: 'projects', terminal: 'cmd' };

const t = (s: string, kind?: Line['kind']): Line => ({ kind, segs: [s] });
const blank: Line = { segs: [''] };

/** Edit distance (Levenshtein, plus adjacent swaps such as "teh" → "the" costing one). */
export function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > 3) return 99;
  let pp: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], pp[j - 2] + 1);
    }
    pp = prev; prev = cur;
  }
  return prev[b.length];
}

/** Closest candidate within a typo budget, or null. */
export function closest(word: string, pool: string[]): string | null {
  const w = word.toLowerCase();
  const budget = w.length <= 3 ? 1 : 2;
  let best: string | null = null, bestD = budget + 1;
  for (const p of pool) {
    const d = distance(w, p.toLowerCase());
    if (d < bestD) { best = p; bestD = d; }
  }
  return best;
}

/** Splits a command line into words; quotes group words. */
export function parse(input: string): string[] {
  const out: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) out.push(m[1] ?? m[2] ?? m[3]);
  return out;
}

const sectionNames = (d: TermData) => d.sections.map(s => s.name);
const fileNames = (d: TermData) => Object.keys(d.files);
const projectIds = (d: TermData) => d.projects.map(p => p.id);

function findSection(d: TermData, raw: string) {
  const name = raw.toLowerCase().replace(/^~?\/+|\/+$/g, '');
  const key = SECTION_ALIASES[name] ?? name;
  return d.sections.find(s => s.name === key) ?? unique(d.sections, s => s.name, key);
}
function findProject(d: TermData, raw: string) {
  const q = raw.toLowerCase();
  return d.projects.find(p => p.id === q || p.name.toLowerCase() === q) ?? unique(d.projects, p => p.id, q);
}
/** The one item whose key starts with q (at least 2 letters), or undefined when none or several do. */
function unique<T>(list: T[], key: (x: T) => string, q: string): T | undefined {
  if (q.length < 2) return undefined;
  const hits = list.filter(x => key(x).toLowerCase().startsWith(q));
  return hits.length === 1 ? hits[0] : undefined;
}

function suggest(word: string, pool: string[], what: string): Result {
  const near = closest(word, pool);
  return {
    error: true,
    lines: [
      t(`${what}: ${word}`, 'err'),
      near ? { kind: 'dim', segs: [`did you mean `, near, `?`] } : t('try help', 'dim'),
    ],
  };
}

function help(): Line[] {
  const sig = (c: (typeof COMMANDS)[number]) => c.name + (c.args ? ' ' + c.args : '');
  const w = Math.max(...COMMANDS.map(c => sig(c).length)) + 2;
  return [
    ...COMMANDS.map(c => ({ cols: w, segs: [sig(c), c.about] })),
    blank,
    t('Tab completes · ↑ ↓ history · Esc leaves the prompt', 'dim'),
  ];
}

function ls(d: TermData, arg?: string): Result {
  if (!arg || HOME.includes(arg)) {
    return {
      lines: [
        { kind: 'ring', segs: [d.sections.filter(s => s.href !== '/').map(s => s.name + '/').join('  ')] },
        { segs: [fileNames(d).join('  ')] },
      ],
    };
  }
  const sec = findSection(d, arg);
  if (sec?.name === 'projects') return { lines: d.projects.map(p => ({ segs: [p.id] })) };
  if (sec?.name === 'stack') return { lines: d.papers.map(p => ({ segs: [p.slug] })) };
  if (sec) return { lines: [{ segs: [{ text: `${sec.name}/`, href: sec.href }, `  ${sec.about}`], row: true }] };
  if (d.files[arg]) return { lines: [t(arg)] };
  return suggest(arg, [...sectionNames(d), ...fileNames(d)], 'no such file or section');
}

function orbit(d: TermData, now: Date): Line[] {
  // A ring with one planet: its place on the ring is the hour in New York.
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: d.timeZone, hour: 'numeric', minute: '2-digit', hour12: false }).formatToParts(now);
  const h = +(parts.find(p => p.type === 'hour')?.value ?? 0) % 24;
  const m = +(parts.find(p => p.type === 'minute')?.value ?? 0);
  const W = 29, H = 11, cx = 14, cy = 5, rx = 13, ry = 5;
  const grid = Array.from({ length: H }, () => Array(W).fill(' '));
  for (let a = 0; a < 360; a += 3) {
    const r = (a * Math.PI) / 180;
    const x = Math.round(cx + rx * Math.cos(r)), y = Math.round(cy + ry * Math.sin(r));
    if (grid[y]?.[x] === ' ') grid[y][x] = '·';
  }
  grid[cy][cx] = '*';
  const ang = ((h % 12) + m / 60) / 12 * 2 * Math.PI - Math.PI / 2; // 12 at the top, like a clock
  const px = Math.round(cx + rx * Math.cos(ang)), py = Math.round(cy + ry * Math.sin(ang));
  grid[py][px] = 'o';
  const hh = String(h).padStart(2, '0'), mm = String(m).padStart(2, '0');
  return [
    { kind: 'art', label: `A ring clock: the planet sits at ${hh}:${mm}, New York City time.`, segs: [grid.map(r => r.join('')).join('\n')] },
    t(`o = ${hh}:${mm} in ${d.city}`, 'dim'),
  ];
}

function stars(): Line[] {
  // A fresh patch of sky each time.
  const W = 30, H = 6, glyphs = ['.', '.', '.', '·', '+', '*'];
  const rows = Array.from({ length: H }, () => Array.from({ length: W }, () => (Math.random() < 0.09 ? glyphs[Math.floor(Math.random() * glyphs.length)] : ' ')).join(''));
  const n = rows.join('').replace(/ /g, '').length;
  return [{ kind: 'art', label: `A small patch of night sky with ${n} stars.`, segs: [rows.join('\n')] }, t(`${n} stars. no clouds.`, 'dim')];
}

/** Runs one command line. `history` and the clock are handled by the UI through effects. */
export function run(input: string, d: TermData, now = new Date()): Result {
  const words = parse(input.trim());
  if (!words.length) return { lines: [] };
  const [raw, ...args] = words;
  const cmd = ALIASES[raw.toLowerCase()] ?? raw.toLowerCase();
  const arg = args.join(' ');

  switch (cmd) {
    case 'help': return { lines: help() };
    case 'ls': return ls(d, args[0]);
    case 'pwd': return { lines: [t('/home/devashish')] };
    case 'cd': {
      if (!args.length || HOME.includes(args[0])) return { lines: [t('→ ~', 'dim')], effect: { type: 'nav', href: '/' } };
      const s = findSection(d, args[0]);
      if (!s) {
        if (d.files[args[0]]) return { error: true, lines: [t(`not a section: ${args[0]}`, 'err'), { kind: 'dim', segs: ['try ', `cat ${args[0]}`] }] };
        return suggest(args[0], sectionNames(d), 'no such section');
      }
      return { lines: [t(`→ ${s.href}`, 'dim')], effect: { type: 'nav', href: s.href } };
    }
    case 'cat': {
      if (!args.length) return { error: true, lines: [t('cat: which file?', 'err'), t(fileNames(d).join('  '), 'dim')] };
      const name = args[0].replace(/^~?\/+/, '');
      const f = d.files[name] ?? d.files[name + '.txt'] ?? d.files[unique(fileNames(d), x => x, name.toLowerCase()) ?? ''];
      if (f) return { lines: f };
      if (findSection(d, name)) return { error: true, lines: [t(`cat: ${name}: is a section`, 'err'), { kind: 'dim', segs: [`try cd ${name} or ls ${name}`] }] };
      return suggest(name, fileNames(d), 'no such file');
    }
    case 'open': {
      if (!args.length) return { error: true, lines: [t('open: which project?', 'err'), t(projectIds(d).join('  '), 'dim')] };
      const p = findProject(d, arg) ?? findProject(d, args[0]);
      if (!p) return suggest(args[0], projectIds(d), 'no such project');
      return {
        lines: [
          { kind: 'hot', segs: [p.name] },
          t(p.meta, 'dim'),
          t(p.summary),
          ...p.links.map(l => ({ row: true, segs: [{ text: `${l.label} ↗`, href: l.href, ext: /^https?:/.test(l.href) }] } as Line)),
        ],
        effect: { type: 'nav', href: `/projects#${p.id}` },
      };
    }
    case 'search':
      if (!arg) return { error: true, lines: [t('search: for what?', 'err')] };
      return { lines: [], effect: { type: 'search', q: arg } };
    case 'whoami': return { lines: [t('guest'), t(`(this is ${d.name}’s site: ${d.role}, ${d.city})`, 'dim')] };
    case 'date': return { lines: [], effect: { type: 'date' } };
    case 'sound': {
      const v = args[0]?.toLowerCase();
      if (v && v !== 'on' && v !== 'off') return { error: true, lines: [t(`sound: on or off, not ${v}`, 'err')] };
      return { lines: [], effect: { type: 'sound', value: v ? v === 'on' : undefined } };
    }
    case 'history': return { lines: [], effect: { type: 'history' } };
    case 'echo': return { lines: [t(arg)] };
    case 'clear': return { lines: [], effect: { type: 'clear' } };
    case 'exit': return { lines: [t('bye', 'dim')], effect: { type: 'nav', href: '/' } };
    case 'orbit': return { lines: orbit(d, now) };
    case 'stars': return { lines: stars() };
    case 'sudo':
      return { lines: args.length ? [t(`sudo ${arg}: no root here, only rings.`), t('this incident will not be reported.', 'dim')] : [t('sudo: no root here, only rings.')] };
    default:
      return suggest(raw, NAMES, 'command not found');
  }
}

/** Tab completion. Returns the new input and, when several fit, the choices to show. */
export function complete(input: string, d: TermData): { value: string; options: string[] } | null {
  const lead = input.replace(/^\s+/, '');
  const words = lead.split(/\s+/);
  const pool = (() => {
    if (words.length === 1) return NAMES;
    const c = ALIASES[words[0].toLowerCase()] ?? words[0].toLowerCase();
    if (words.length > 2) return [];
    if (c === 'cd') return sectionNames(d).filter(n => n !== 'home');
    if (c === 'ls') return [...sectionNames(d).filter(n => n !== 'home'), ...fileNames(d)];
    if (c === 'cat') return fileNames(d);
    if (c === 'open') return projectIds(d);
    if (c === 'sound') return ['on', 'off'];
    return [];
  })();
  const last = words[words.length - 1].toLowerCase();
  const hits = pool.filter(p => p.toLowerCase().startsWith(last));
  if (!hits.length) return null;
  const head = words.slice(0, -1).join(' ');
  const join = (w: string) => (head ? head + ' ' : '') + w;
  if (hits.length === 1) return { value: join(hits[0]) + ' ', options: [] };
  let prefix = hits[0];
  for (const h of hits) while (!h.toLowerCase().startsWith(prefix.toLowerCase())) prefix = prefix.slice(0, -1);
  return { value: join(prefix.length > last.length ? prefix : words[words.length - 1]), options: hits };
}

// ---------- search over /search-index.json ----------
export type IndexEntry = { id: string; type: string; title: string; meta?: string; blurb?: string; kw?: string; text?: string; href?: string; ext?: string };

export function searchLines(q: string, index: IndexEntry[]): Line[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = index
    .filter(e => e.href || e.ext)
    .map(e => {
      const title = e.title.toLowerCase();
      const rest = [e.meta, e.blurb, e.kw].join(' ').toLowerCase();
      const text = (e.text ?? '').toLowerCase();
      let s = 0;
      for (const w of terms) {
        if (title.startsWith(w)) s += 4;
        else if (title.includes(w)) s += 3;
        else if (rest.includes(w)) s += 1.5;
        else if (text.includes(w)) s += 0.5;
        else return { e, s: 0 };
      }
      return { e, s };
    })
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 6);
  if (!scored.length) return [t(`no results for “${q}”`, 'err')];
  return [
    t(`${scored.length} result${scored.length === 1 ? '' : 's'}`, 'dim'),
    ...scored.map(({ e }) => {
      const href = e.href ?? e.ext!;
      const ext = !e.href && !!e.ext;
      return { row: true, cols: 9, segs: [e.type, { text: e.title + (ext ? ' ↗' : ''), href, ext }] } as Line;
    }),
  ];
}
