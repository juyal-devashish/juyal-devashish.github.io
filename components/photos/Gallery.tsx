// Justified photo gallery: rows of equal height, filled edge to edge, in the data's
// time-of-day order (row-major, so reading and tab order match). Pure CSS: each tile
// grows in proportion to its aspect ratio. Thumbnails are plain links to the full image
// (works without JS); the shared Lightbox takes over when JS is on.
import { Fragment, type CSSProperties } from 'react';
import Lightbox, { type LightboxItem } from '@/components/Lightbox';
import type { Photo } from '@/lib/photos';
import s from './Gallery.module.css';

export const photoId = (p: Photo) => p.file.replace(/\.jpg$/i, '');
const src = (p: Photo) => `/assets/img/photos/${p.file}`;
const gear = (p: Photo) => [p.camera, p.settings].filter(Boolean).join(' · ');

// How many tiles load eagerly (roughly the first row on a wide screen).
const EAGER = 4;

export default function Gallery({ photos }: { photos: Photo[] }) {
  const items: LightboxItem[] = photos.map(p => ({
    id: photoId(p),
    src: src(p),
    alt: p.alt,
    caption: p.caption,
    meta: gear(p) || undefined,
    width: p.width,
    height: p.height,
  }));

  return (
    <>
      <ul className={s.grid}>
        {photos.map((p, i) => {
          const r = +(p.width / p.height).toFixed(4);
          const g = gear(p);
          return (
            <li key={p.file} className={s.tile} style={{ '--r': r } as CSSProperties}>
              <figure id={photoId(p)} className={s.fig}>
                <a href={src(p)} data-lightbox="photos" data-index={i} className={s.link}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src(p)}
                    alt={p.alt}
                    width={p.width}
                    height={p.height}
                    loading={i < EAGER ? 'eager' : 'lazy'}
                    decoding="async"
                    className={s.img}
                  />
                  <span className={s.trails} aria-hidden="true" />
                </a>
                <figcaption className={s.cap}>
                  <span className={s.place}>{p.caption.split(' · ').map((part, j) => <Fragment key={j}>{j ? <> · <span>{part}</span></> : part}</Fragment>)}</span>
                  {g ? <span className={s.gear}>{g}</span> : null}
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ul>
      <Lightbox group="photos" items={items} openOnHash label="Photo viewer" />
    </>
  );
}
