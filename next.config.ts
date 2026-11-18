import type { NextConfig } from 'next';
import { uses } from './lib/site';

const config: NextConfig = {
  // Lets several dev servers run side by side (NEXT_DIST_DIR=.next-foo next dev -p 3101).
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  // The dev badge covers the phone bottom bar.
  devIndicators: false,
  // Project screenshots are UI with small text: 75 (the default) smears it, so they ask for 90.
  images: { qualities: [75, 90] },
  // The year (New York) this build was made in: year pages and their links stop there.
  env: { SITE_BUILD_YEAR: new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric' }).format(new Date()) },
  // Posts are read from disk at request time (/api/views, hourly revalidation of / and /<year>).
  outputFileTracingIncludes: { '/**': ['./content/posts/**/*'] },
  // Old GitHub Pages URLs keep working.
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/papers.html', destination: '/stack', permanent: true },
      { source: '/shelf', destination: '/stack', permanent: true },
      { source: '/shelf.md', destination: '/stack.md', permanent: true },
      { source: '/papers.md', destination: '/stack.md', permanent: true },
      { source: '/404.html', destination: '/', permanent: false },
    ];
  },
  // /anything.md → markdown copy of that page
  async rewrites() {
    return {
      // While lib/site `uses` is empty, /uses goes to an unmatched path so the 404 page renders
      // at routing time (a notFound() thrown by the page needs JS to show).
      beforeFiles: uses.length ? [] : [{ source: '/uses', destination: '/uses/empty' }],
      afterFiles: [
        { source: '/index.md', destination: '/md' },
        { source: '/:path*.md', destination: '/md/:path*' },
      ],
      fallback: [],
    };
  },
};
export default config;
