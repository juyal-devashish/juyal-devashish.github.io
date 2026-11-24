// Home: hero, at a glance, now, projects, instruments (live data only), writing, stack, photos.
// The layout supplies the rail, controls, footer (contact) and <main>.
import Link from 'next/link';
import { site, projects, work } from '@/lib/site';
import { readPapers } from '@/lib/papers';
import { photos } from '@/lib/photos';
import { getPosts, formatDate } from '@/lib/posts';
import { getRecentContributions, RECENT_WEEKS, RECENT_LABEL } from '@/lib/github';
import { fixtureContributions } from '@/lib/fixtures';
import { slug } from '@/lib/text';
import SectionHeader from '@/components/SectionHeader';
import Reveal from '@/components/Reveal';
import StatusBadge from '@/components/StatusBadge';
import Clock from '@/components/Clock';
import DemoClip from '@/components/home/DemoClip';
import HeroArt from '@/components/home/HeroArt';
import GitHubCalendar from '@/components/widgets/GitHubCalendar';
import s from './page.module.css';

export const revalidate = 3600;

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi'];
// The three papers the home page shows, by title (hand-picked; /stack orders by citations).
const HOME_PAPERS = ['Language Models are Few-Shot Learners', 'The Llama 3 Herd of Models', 'DeepSeek-V3 Technical Report'];
const TEASER_PHOTOS = ['img_1128', 'img_3684', 'img_5342', 'img_7344', 'img_1364', 'img_8046'];
const Arrow = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

export default async function Home() {
  const gh = (await getRecentContributions()) ?? fixtureContributions();
  const posts = getPosts().slice(0, 3);
  const read = readPapers();
  const shelf = HOME_PAPERS.map(t => read.find(p => p.title === t)).filter(p => !!p);
  const featured = projects.find(p => p.featured);
  const cards = projects.filter(p => !p.featured && p.thumb);
  const smaller = projects.filter(p => !p.featured && !p.thumb);
  const teaser = TEASER_PHOTOS.map(id => photos.find(p => p.file === `${id}.jpg`)).filter(p => !!p);
  const [since] = work.dates.split('–');

  // Sections come and go with their data, so numbers are assigned in order.
  let n = 0;
  const no = () => ++n;

  return (
    <>
      <div className={`${s.hero} bleed`} id="top">
        <HeroArt className={s.art} />
        <div className={s.heroIn}>
          <p className="kicker">{site.role} · {site.city}</p>
          <h1 className={s.name}>Devashish <span className={s.l2}><em>Juyal</em></span></h1>
          <p className={s.pitch}>{site.pitch}</p>
          <div className={s.heroMeta}>
            <img className={s.face} src="/assets/img/devashish-240.jpg" alt={site.name} width={44} height={44} />
            <span><i className={s.dot} aria-hidden="true" />{work.role} at {work.org}</span>
            <Clock />
          </div>
          <div className={`hbtns ${s.actions}`}>
            <a className="hbtn primary" href={`mailto:${site.email}`}>Email me</a>
            <a className="hbtn" href={site.resume}>Résumé (PDF)</a>
            <a className="hbtn" href={site.links.linkedin} rel="noopener">LinkedIn</a>
            <a className="hbtn" href={site.links.github} rel="noopener">GitHub</a>
          </div>
        </div>
        <p className={s.credit}>{site.heroCredit}</p>
      </div>

      <div className="wrap">
        <dl className={s.glance}>
          {site.glance.map(g => <div key={g.label}><dt>{g.label}</dt><dd>{g.value}</dd></div>)}
        </dl>
      </div>

      <section className="sec" id="now" aria-labelledby="now-h">
        <SectionHeader id="now" no={no()} label="Now" title="What I’m" accent="doing" after="now" />
        <div className={s.now}>
          <Reveal className={`card glow ${s.nowCard}`}>
            <h3>{work.org}</h3>
            <p className={s.role}>{work.role}</p>
            <p className={s.since}><b>{since}</b><span>to now</span></p>
            <svg className={s.mini} viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="40" /><circle cx="100" cy="100" r="60" /><circle cx="100" cy="100" r="80" /><circle cx="100" cy="100" r="98" /></svg>
          </Reveal>
          <Reveal as="ol" className={s.workList}>
            {work.items.map((it, i) => (
              <li key={it.name}><span className={s.i} aria-hidden="true">{ROMAN[i]}</span><h3>{it.name}</h3><p>{it.text}</p></li>
            ))}
          </Reveal>
        </div>
        <p className={s.more}><Link className="qlink" href="/now">More on now</Link></p>
      </section>

      <section className="sec" id="projects" aria-labelledby="projects-h">
        <SectionHeader id="projects" no={no()} label="Projects" title="Things I’ve" accent="made" />
        {featured ? (
          <Reveal as="article" className={`card raised ${s.feat}`} aria-labelledby={`f-${featured.id}`}>
            <figure className={s.featVis}>
              {featured.video
                ? <DemoClip {...featured.video} className={s.shot} />
                : featured.thumb ? <img className={s.shot} src={featured.thumb} alt="" width={1280} height={800} /> : null}
              {featured.sketch ? (
                <>
                  <img className={s.sketch} src={featured.sketch.src} alt={featured.sketch.alt} width={featured.sketch.width} height={featured.sketch.height} loading="lazy" />
                  <figcaption>{featured.sketch.caption}</figcaption>
                </>
              ) : null}
            </figure>
            <div>
              <p className="meta">{featured.year ? <><span>{featured.year}</span><span aria-hidden="true">·</span></> : null}<span>{featured.area}</span><StatusBadge status={featured.status} /></p>
              <h3 id={`f-${featured.id}`}><Link href={`/projects#${featured.id}`}>{featured.name}</Link></h3>
              <p className={s.sum}>{featured.summary}</p>
              {featured.notes ? (
                <div className={s.psr}>
                  <p><b>Problem.</b> {featured.notes.problem}</p>
                  <p><b>Built.</b> {featured.notes.built}</p>
                  <p><b>Result.</b> {featured.notes.result}</p>
                </div>
              ) : null}
              <p className="qlinks">
                {featured.links.map(l => <a key={l.href} className="qlink" href={l.href} rel="noopener">{l.label}</a>)}
                <Link className="qlink" href={`/projects#${featured.id}`}>Details</Link>
              </p>
            </div>
          </Reveal>
        ) : null}

        <div className={s.grid}>
          {cards.map((p, i) => (
            <Reveal as="article" key={p.id} className={`card lift ${s.proj}`} delay={(i % 3) * 80}>
              <div className={s.thumb}>{p.video ? <DemoClip {...p.video} name={p.name} card /> : <img src={p.thumb} alt="" width={1280} height={800} loading="lazy" />}</div>
              <div className={s.body}>
                <p className="meta">{p.year ? <span>{p.year} · {p.area}</span> : <span>{p.area}</span>}<StatusBadge status={p.status} />{p.tags?.map(t => <span key={t} className="badge note">{t}</span>)}</p>
                <h3><Link className="stretch" href={`/projects#${p.id}`}>{p.name}</Link></h3>
                <p>{p.summary}</p>
                {p.role ? <p className={s.pRole}>{p.role}</p> : null}
              </div>
            </Reveal>
          ))}
        </div>

        {smaller.length ? (
          <Reveal className={s.smaller}>
            <h3>Smaller things</h3>
            <ul>
              {smaller.map(p => (
                <li key={p.id}><Link href={`/projects#${p.id}`}>{p.name}</Link>{p.year ? <span className={s.yr}>{p.year}</span> : null}<p>{p.summary}</p></li>
              ))}
            </ul>
          </Reveal>
        ) : null}
        <p className={s.more}><Link className="qlink" href="/projects">All projects</Link></p>
      </section>

      {gh ? (
        <section className="sec" id="instruments" aria-labelledby="instruments-h">
          <SectionHeader id="instruments" no={no()} label="Instruments" title="The week," accent="in orbit" />
          <div className={s.inst}>
            <Reveal className="panel"><GitHubCalendar data={gh} weeks={RECENT_WEEKS} phoneWeeks={null} span={RECENT_LABEL} range /></Reveal>
          </div>
        </section>
      ) : null}

      {posts.length ? (
        <section className="sec" id="writing" aria-labelledby="writing-h">
          <SectionHeader id="writing" no={no()} label="Writing" title="Latest" accent="writing" />
          <ul className={s.posts}>
            {posts.map(p => (
              <Reveal as="li" key={p.slug}>
                <Link href={`/writing/${p.slug}`}>
                  <time dateTime={p.date}>{formatDate(p.date)}</time>
                  <div><h3>{p.title}</h3>{p.summary ? <p>{p.summary}</p> : null}</div>
                  <span className={s.arr} aria-hidden="true"><Arrow /></span>
                </Link>
              </Reveal>
            ))}
          </ul>
          <p className={s.more}><Link className="qlink" href="/writing">All writing</Link></p>
        </section>
      ) : null}

      {read.length ? (
        <section className="sec" id="stack" aria-labelledby="stack-h">
          <SectionHeader id="stack" no={no()} label="Stack" title="Papers I’ve" accent="read" />
          <div className={s.shelf}>
            <Reveal className={s.count}>
              <b>{read.length}</b>
              <p>papers read, each with notes.</p>
              <p><Link className="qlink" href="/stack">Browse my notes</Link></p>
            </Reveal>
            <div className={s.papers}>
              {shelf.map((p, i) => (
                <Reveal as="article" key={p.title} className={s.paper} delay={i * 60}>
                  <p className={s.d}><span>{p.date}</span><span>{p.tags.slice(0, 2).join(' · ')}</span></p>
                  <h3><Link className="stretch" href={`/stack#${slug(p.title)}`}>{p.title}</Link></h3>
                  <p className={s.ex}>{p.takeaway}</p>
                  <p className={s.au}>{p.authors}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {teaser.length ? (
        <section className="sec" id="photos" aria-labelledby="photos-h">
          <SectionHeader id="photos" no={no()} label="Photos" title="" accent="Photos" />
          <ul className={s.photos}>
            {teaser.map((p, i) => {
              const id = p.file.replace(/\.jpg$/, '');
              return (
                <Reveal as="li" key={id} className={s[`p${i + 1}`]} delay={i * 50}>
                  <Link href={`/photos#${id}`}>
                    <img src={`/assets/img/photos/${p.file}`} alt={p.alt} width={p.width} height={p.height} loading="lazy" />
                    <span className={s.cap}>{p.caption}</span>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
          <p className={s.more}><Link className="qlink" href="/photos">See more photos</Link></p>
        </section>
      ) : null}
    </>
  );
}
