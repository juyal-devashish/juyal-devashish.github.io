// Everything the pages say about me, in one place. Keep words short.

export const site = {
  name: 'Devashish Juyal',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://juyal-devashish.vercel.app',
  role: 'AI engineer',
  pitch: 'I build end-to-end AI products.',
  city: 'New York City',
  // The home hero's aurora timelapse (tools/hero-video.mjs).
  heroCredit: 'Aurora, recorded on my GoPro in my Ann Arbor backyard, November 2024.',
  timeZone: 'America/New_York',
  email: 'djuyal23@gmail.com',
  resume: '/assets/devashish-juyal-resume.pdf',
  links: {
    github: 'https://github.com/juyal-devashish',
    linkedin: 'https://www.linkedin.com/in/devashish-juyal',
  },
  glance: [
    { label: 'Now', value: 'AI Engineer, Tech Observer' },
    { label: 'Grad', value: 'MS ECE, University of Michigan' },
    { label: 'Undergrad', value: 'B.Tech ECE, MNIT Jaipur' },
    { label: 'Before', value: 'Micron, MITACS, ISRO' },
    { label: 'Off hours', value: 'Photography, trails, movies' },
  ],
};

export type Status = 'Live' | 'Live · beta' | 'Demo' | 'Prototype' | 'Research' | 'Archived';
export type Project = {
  id: string; // also the #anchor; keep stable, old links use it
  name: string;
  year?: string;
  area: string;
  status: Status;
  tags?: string[];
  summary: string;
  role?: string;
  links: { label: string; href: string }[];
  thumb?: string;
  shot?: { src: string; alt: string; width: number; height: number };
  video?: { mp4: string; webm: string; poster: string; label: string; width: number; height: number }; // silent loop, recorded from the live demo
  notes?: { problem: string; built: string; result: string };
  sketch?: { src: string; alt: string; caption: string; width: number; height: number };
  featured?: boolean;
};

export const projects: Project[] = [
  {
    id: 'sama4', name: 'Sama4', year: '2026', area: 'News and retrieval', status: 'Live', featured: true,
    summary: 'News that explains itself, right beside the story.',
    links: [{ label: 'Live', href: 'https://www.sama4.online/' }, { label: 'Code', href: 'https://github.com/juyal-devashish/Sama4' }],
    thumb: '/assets/img/work/sama4-loop-poster.jpg',
    video: { mp4: '/assets/video/sama4-loop.mp4', webm: '/assets/video/sama4-loop.webm', poster: '/assets/img/work/sama4-loop-poster.jpg', label: 'A 10-second silent demo of the Sama4 reader: selecting the highlighted name Cade Cunningham in a story slides in a panel that explains who that is, in the context of the story.', width: 1280, height: 800 },
    notes: { problem: 'Headlines assume you know the backstory.', built: 'A daily reader that explains unfamiliar names and terms in context.', result: 'Live, new stories nightly.' },
    sketch: { src: '/assets/img/work/sama4-sketch.jpg', width: 720, height: 1400, alt: 'Hand-drawn sketches of the Samā4 wordmark on grid paper: four versions of the name, each with a small owl perched on the bar over the ā.', caption: 'Where it started: four tries at the wordmark, owl on the ā.' },
  },
  {
    id: 'release-gate', name: 'AI operator release gate', year: '2026', area: 'AI quality', status: 'Demo', tags: ['Simulated factory'],
    summary: 'An AI agent earns trust step by step, and loses it fast.',
    links: [{ label: 'Live', href: 'https://evosdemo.vercel.app' }, { label: 'Walkthrough', href: 'https://www.loom.com/share/98c262700b4d478b86f9436d93006a86' }, { label: 'Code', href: 'https://github.com/juyal-devashish/EvosDemo' }],
    thumb: '/assets/img/work/evos-t.jpg',
    video: { mp4: '/assets/video/release-gate-loop.mp4', webm: '/assets/video/release-gate-loop.webm', poster: '/assets/img/work/release-gate-poster.jpg', width: 1280, height: 800, label: 'A 13-second silent demo of the release gate results: op-v1 failed two of its 8 scenarios, op-v2 passed all 8, and a day-by-day chart where reviews stop agreeing with op-v1 from day 4 and op-v2 takes over on day 7.' },
    shot: { src: '/assets/img/work/evos.jpg', alt: 'Release suite results: the flawed release failed, its fix passed all 8 scenarios.', width: 1280, height: 800 },
    notes: { problem: 'A factory agent shouldn’t get full trust at once.', built: 'A release test, earned permissions, and a monitor that revokes them.', result: 'Blocked a flawed release; rolled back a faulty one.' },
  },
  {
    id: 'onboarding', name: 'Health-first voice onboarding', year: '2026', area: 'Health, voice and LLMs', status: 'Demo', tags: ['Synthetic data'],
    summary: 'Sign-up rebuilt around Apple Health and your voice.',
    links: [{ label: 'Live', href: 'https://eatopia-demo.vercel.app' }, { label: 'Code', href: 'https://github.com/juyal-devashish/eatopia' }],
    thumb: '/assets/img/work/eatopia-t.jpg',
    video: { mp4: '/assets/video/onboarding-loop.mp4', webm: '/assets/video/onboarding-loop.webm', poster: '/assets/img/work/onboarding-poster.jpg', width: 1280, height: 800, label: 'An 11-second silent demo of the onboarding on a phone: the intro, the Apple Health step, then the simulated permission sheet listing the six facts it would read: sex, date of birth, height, weight, steps and workouts.' },
    shot: { src: '/assets/img/work/eatopia.jpg', alt: 'The simulated Apple Health permission screen, listing the six facts it will read.', width: 640, height: 800 },
    notes: { problem: 'Forms ask what your phone already knows.', built: 'Reads Apple Health, fills the rest from a few spoken sentences. Health data never reaches the model.', result: 'Most of the form fills itself.' },
  },
  {
    id: 'adjudication', name: 'Agentic Adjudication', year: '2026', area: 'Clinical trials and agents', status: 'Prototype', tags: ['Synthetic data'],
    summary: 'Agents prepare trial safety cases; people make every call.',
    links: [{ label: 'Code', href: 'https://github.com/juyal-devashish/Agentic-Adjudication' }],
    thumb: '/assets/img/work/adjudication-t.jpg',
    video: { mp4: '/assets/video/adjudication-loop.mp4', webm: '/assets/video/adjudication-loop.webm', poster: '/assets/img/work/adjudication-poster.jpg', width: 1280, height: 800, label: 'A 12-second silent demo of a synthetic myocardial infarction case: its status and steps, a quality check with all 6 checks passed, the AI suggestion, and each EDC field matched against quotes from the documents.' },
    shot: { src: '/assets/img/work/adjudication.jpg', alt: 'A synthetic case ready for adjudication, with its quality checks all passed.', width: 1280, height: 800 },
    notes: { problem: 'Preparing safety cases is slow and manual.', built: 'Agents gather, de-identify and draft; code checks; people sign.', result: 'Working proof of concept.' },
  },
  {
    id: 'watermark', name: 'Sequential watermark detection', year: '2025', area: 'Research', status: 'Research', tags: ['Group project'],
    summary: 'Spotting AI-written text with far less compute.',
    role: 'One of four authors, University of Michigan.',
    links: [{ label: 'Exhibit', href: 'https://juyal-devashish.github.io/LLM-Sequential-Watermarking/' }, { label: 'Code', href: 'https://github.com/juyal-devashish/LLM-Sequential-Watermarking' }],
    thumb: '/assets/img/work/watermark-t.jpg',
    video: { mp4: '/assets/video/watermark-loop.mp4', webm: '/assets/video/watermark-loop.webm', poster: '/assets/img/work/watermark-poster.jpg', width: 1280, height: 800, label: 'A 14-second silent demo of the exhibit’s interactive figure: a strong synthetic signal reaches the illustrative threshold after 9 comparisons, while a chance-like one zigzags on, comparison after comparison.' },
    shot: { src: '/assets/img/work/watermark.jpg', alt: 'The project exhibit: Sequential Testing for Language Model Watermarks.', width: 1280, height: 800 },
    notes: { problem: 'Watermark checks cost a fixed, heavy amount of compute.', built: 'A test that stops once the evidence is clear.', result: 'Report and interactive exhibit.' },
  },
  {
    id: 'michiganslm', name: 'MichiganSLM', year: '2026', area: 'Small models', status: 'Research',
    summary: 'Experiments behind Michigan’s first small language model.',
    links: [{ label: 'Code', href: 'https://github.com/juyal-devashish/umichslm-walkthrough' }],
    thumb: '/assets/img/work/michiganslm-poster.jpg',
    video: { mp4: '/assets/video/michiganslm-loop.mp4', webm: '/assets/video/michiganslm-loop.webm', poster: '/assets/img/work/michiganslm-poster.jpg', width: 1280, height: 800, label: 'The Wolverine Works team logo for the UMich SLM project: a wolverine mascot with goggles and a wrench, with electric sparks crackling around the badge.' },
  },
  {
    id: 'multi-stage-distillation', name: 'Multi-stage distillation', year: '2025', area: 'Small models', status: 'Research',
    summary: 'Shrinking a large model into small ones, step by step.',
    links: [{ label: 'Code', href: 'https://github.com/juyal-devashish/ELI500Model-Sequential-Distillation' }],
    thumb: '/assets/img/work/distillation-poster.jpg',
    video: { mp4: '/assets/video/distillation-loop.mp4', webm: '/assets/video/distillation-loop.webm', poster: '/assets/img/work/distillation-poster.jpg', width: 1280, height: 800, label: 'A 10-second silent animation of two-stage distillation: the 7B Arcee-Spark teacher, drawn as a glowing constellation, passes knowledge along an arc to the 1.5B Qwen2-1.5B model in stage 1, which then teaches the 0.5B Qwen2-0.5B student in stage 2.' },
  },
];

export const work = {
  id: 'tech-observer', org: 'Tech Observer', role: 'AI Engineer', dates: '2024–now',
  items: [
    { name: 'Multi-agent workflows', text: 'Agents that plan, call tools and check their own work, so people step in less.' },
    { name: 'Document automation', text: 'Pipelines that read, extract and act on messy documents end to end.' },
    { name: 'Agent evaluation', text: 'Tests and gates that decide when an agent is ready to ship.' },
  ],
};

export const archive = [
  { full: '/assets/img/archive/ms-diploma.jpg', thumb: '/assets/img/archive/ms-diploma-t.jpg', w: 480, h: 605, alt: 'My University of Michigan diploma: Master of Science in Electrical and Computer Engineering.', caption: 'Michigan, 2026' },
  { full: '/assets/img/archive/mitacs-cohort.jpg', thumb: '/assets/img/archive/mitacs-cohort-t.jpg', w: 480, h: 481, alt: 'My MITACS certificate of participation from the University of Alberta, among my cohort’s certificates, which are blurred.', caption: 'MITACS, Edmonton, 2023' },
  { full: '/assets/img/archive/mnit-exam.jpg', thumb: '/assets/img/archive/mnit-exam-t.jpg', w: 480, h: 880, alt: 'The cover of my graph theory end-term exam at MNIT Jaipur, with the mark circled in red.', caption: 'Graph theory, MNIT, 2022' },
];

// /now — edit freely; `updated` shows on the page.
export const now = {
  updated: '2026-11-17',
  focus: 'AI Engineer at Tech Observer, building agentic AI systems: multi-agent workflows that cut human touchpoints, tool-using pipelines, and the checks that keep them reliable.',
  building: projects.filter(p => p.status.startsWith('Live')).map(p => p.name),
};

// /uses — empty until filled in; the page hides itself from nav while empty.
export const uses: { group: string; items: { name: string; note: string; href?: string }[] }[] = [];

// Writing is switched off for now: no nav item, /writing 404s, posts appear nowhere.
// Flip to true to bring it back (posts live in content/posts).
export const writingOn = false;

// Nav order = Alt+1..n
export const nav = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  ...(writingOn ? [{ href: '/writing', label: 'Writing' }] : []),
  { href: '/stack', label: 'Stack' },
  { href: '/resume', label: 'Résumé' },
  { href: '/photos', label: 'Photos' },
  { href: '/cmd', label: 'Terminal' },
];
