import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { photos } from '@/lib/photos';
import SectionHeader from '@/components/SectionHeader';

export const metadata: Metadata = { title: 'Not found', robots: { index: false } };

const photo = photos.find(p => p.file === 'img_8046.jpg') ?? photos[0];

export default function NotFound() {
  return (
    <section className="sec first">
      <div className="nf">
        <div>
          <SectionHeader no="404" label="Not found" title="Lost in" accent="orbit" as="h1" copy={false} />
          <p className="muted" style={{ fontSize: '1.125rem', marginTop: -24 }}>This page isn’t here. It may have moved.</p>
          <div className="hbtns" style={{ marginTop: 28 }}>
            <Link className="hbtn primary" href="/">Home</Link>
            <Link className="hbtn" href="/projects">Projects</Link>
            <Link className="hbtn" href="/stack">Stack</Link>
          </div>
        </div>
        {photo && (
          <figure className="nf-photo">
            <Image src={`/assets/img/photos/${photo.file}`} alt={photo.alt} width={photo.width} height={photo.height} sizes="(min-width: 900px) 420px, 90vw" priority />
            <figcaption>{photo.caption}</figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
