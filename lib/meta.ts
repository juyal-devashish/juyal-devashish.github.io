// Page metadata. Next merges metadata shallowly, so a page's `alternates` replaces the
// layout's: this repeats the RSS and llms.txt links next to the page's markdown copy.
import type { Metadata } from 'next';
import { site } from './site';

type Opts = { md?: boolean; images?: { url: string; width?: number; height?: number; alt?: string }[] };

export function pageMeta(path: string, title: string, description: string, { md = true, images }: Opts = {}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
      types: {
        ...(md ? { 'text/markdown': [{ url: `${path}.md`, title: `${title} (markdown)` }] } : {}),
        'application/rss+xml': [{ url: '/rss.xml', title: `${site.name}: writing` }],
        'text/plain': [{ url: '/llms.txt', title: 'llms.txt' }],
      },
    },
    openGraph: { type: 'website', siteName: site.name, title: `${title} · ${site.name}`, description, url: path, locale: 'en_US', ...(images ? { images } : {}) },
    twitter: { card: 'summary_large_image', title: `${title} · ${site.name}`, description },
  };
}
