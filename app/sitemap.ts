import type { MetadataRoute } from 'next';
import { pageList } from '@/lib/text';
import { getPosts } from '@/lib/posts';
import { site } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...pageList().map(p => ({ url: site.url + (p.path === '/' ? '' : p.path) })),
    { url: `${site.url}/cmd` }, // the terminal; no markdown copy, so not in pageList()
    ...getPosts().map(p => ({ url: `${site.url}/writing/${p.slug}`, lastModified: p.date })),
  ];
}
