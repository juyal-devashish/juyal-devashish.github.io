// Contact band + footer line. Also hosts the page-wide live region (#announcer).
import { site } from '@/lib/site';
import Clock from './Clock';
import CopyEmail from './CopyEmail';

export default function Footer() {
  return (
    <footer id="contact" className="contact" aria-labelledby="contact-h">
      <div className="contact-in">
        <h2 id="contact-h">Let’s <em>talk</em></h2>
        <a className="mail" href={`mailto:${site.email}`}>{site.email}</a>
        <div className="hbtns">
          <CopyEmail />
          <a className="hbtn" href={site.resume}>Résumé (PDF)</a>
          <a className="hbtn" href={site.links.github} rel="noopener">GitHub</a>
          <a className="hbtn" href={site.links.linkedin} rel="noopener">LinkedIn</a>
        </div>
      </div>
      <div className="foot">
        <p>
          <span>© {new Date().getFullYear()} {site.name}</span>
          <Clock />
        </p>
      </div>
      <div id="announcer" className="vh" role="status" aria-live="polite" />
    </footer>
  );
}
