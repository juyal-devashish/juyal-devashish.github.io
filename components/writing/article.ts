// Turns a post's markdown into page-ready HTML plus a table of contents.
// Adds stable heading ids, keyboard-scrollable code blocks with a language label, and scrollable tables.
import { renderMarkdown } from '@/lib/posts';
import { slug } from '@/lib/text';

export type TocItem = { id: string; text: string; level: 2 | 3 };

const decode = (s: string) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, '\'').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&');

export function renderArticle(md: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Set<string>(['main', 'top', 'toc', 'palette', 'lightbox', 'post-h', 'toc-h']);
  let html = renderMarkdown(md);

  // The page title is the only h1: demote any h1 in the body to h2.
  html = html.replace(/<(\/?)h1>/g, '<$1h2>');

  html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_, lvl: string, inner: string) => {
    const text = decode(inner.replace(/<[^>]+>/g, '')).trim();
    let id = slug(text) || 'section';
    for (let i = 2; used.has(id); i++) id = `${slug(text) || 'section'}-${i}`;
    used.add(id);
    toc.push({ id, text, level: Number(lvl) as 2 | 3 });
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`;
  });

  html = html.replace(/<pre><code(?: class="language-([\w+#.-]+)")?>/g, (_, lang?: string) =>
    `<div class="code"${lang ? ` data-lang="${lang}"` : ''}><pre tabindex="0"><code${lang ? ` class="language-${lang}"` : ''}>`);
  html = html.replace(/<\/code><\/pre>/g, '</code></pre></div>');

  html = html.replace(/<table>/g, '<div class="table" tabindex="0" role="region" aria-label="Table"><table>').replace(/<\/table>/g, '</table></div>');

  // Images: lazy-load and decode off the main thread.
  html = html.replace(/<img /g, '<img loading="lazy" decoding="async" ');

  return { html, toc };
}
