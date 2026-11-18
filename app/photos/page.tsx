import type { Metadata } from 'next';
import { pageMeta } from '@/lib/meta';
import SectionHeader from '@/components/SectionHeader';
import Gallery from '@/components/photos/Gallery';
import { photos } from '@/lib/photos';
import { nav, site } from '@/lib/site';

const no = nav.findIndex(n => n.href === '/photos') + 1;
const summary = `${photos.length} photos.`;

export const metadata: Metadata = pageMeta('/photos', 'Photos', `Photos by ${site.name}.`, {
  images: photos[0] ? [{ url: `/assets/img/photos/${photos[0].file}`, width: photos[0].width, height: photos[0].height, alt: photos[0].alt }] : undefined,
});

export default function PhotosPage() {
  return (
    <section className="sec first" id="photos" aria-labelledby="photos-h">
      <SectionHeader id="photos" as="h1" no={no || undefined} label="Photos" title="" accent="Photos" dek={summary} />
      <Gallery photos={photos} />
    </section>
  );
}
