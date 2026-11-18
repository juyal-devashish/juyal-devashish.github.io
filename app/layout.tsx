import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Newsreader } from 'next/font/google';
import { site } from '@/lib/site';
import Rail from '@/components/Rail';
import Controls from '@/components/Controls';
import Palette from '@/components/Palette';
import Footer from '@/components/Footer';
import Motion from '@/components/Motion';
import SiteAnalytics from '@/components/year/SiteAnalytics';
import './globals.css';

const serif = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], axes: ['opsz'], variable: '--font-newsreader', display: 'swap' });
const sans = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jbm', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.pitch,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  alternates: {
    types: {
      'application/rss+xml': [{ url: '/rss.xml', title: `${site.name}: writing` }],
      'text/plain': [{ url: '/llms.txt', title: 'llms.txt' }],
    },
  },
  openGraph: { type: 'website', siteName: site.name, title: site.name, description: site.pitch, url: '/', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title: site.name, description: site.pitch },
  icons: { icon: [{ url: '/assets/img/favicon-32.png', sizes: '32x32', type: 'image/png' }], apple: '/assets/img/favicon-180.png' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark',
  themeColor: '#0A1330',
};

const bootScript = `(function(){document.documentElement.classList.add('js');try{localStorage.removeItem('theme')}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Before paint: mark html.js, and drop the theme pick stored by the old light mode. */}
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <a className="skip" href="#main">Skip to content</a>
        <Rail />
        <Controls />
        <main id="main" tabIndex={-1}>{children}</main>
        <Footer />
        <Palette />
        <Motion />
        <SiteAnalytics />
      </body>
    </html>
  );
}
