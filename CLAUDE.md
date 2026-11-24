# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Devashish Juyal's personal site: a Next.js 16 App Router app (React 19, TypeScript, plain CSS and CSS modules, no Tailwind), deployed on Vercel. Next 16 differs from older versions (async `params`, etc.): read `node_modules/next/dist/docs/` before using an API (see `AGENTS.md`).

## Commands

```sh
npm run dev                      # http://localhost:3000
npm test                         # unit tests (node --test, tests/*.test.ts)
npx tsc --noEmit                 # on a fresh clone run `npx next typegen` first
npx next build && npx next start -p 3200
npm run check                    # axe (system set to dark and to light; the site must look the same), tap targets, sideways scroll, h1, no-JS, text routes, screenshots at 12 sizes
npm run check:palette            # search palette behaviour + every /search-index.json link resolves to a 200 page with that #id
```

Several dev servers can run side by side: `NEXT_DIST_DIR=.next-<name> npx next dev -p <port>`. CI (`.github/workflows/checks.yml`) is kept minimal: typegen, tsc, unit tests and build. Run both check scripts locally before shipping UI changes.

## Where things live

- `lib/site.ts`: profile, projects, work (the home Now card), archive, now, uses, nav (order = Alt+1..7).
- `lib/resume.ts`: the résumé page in the PDF's order. Its PDF layer is word for word (checked by `tests/resume.test.ts` against `tests/fixtures/resume-pdf.txt`, the PDF's text without the phone number); `more` holds extra detail from the project READMEs. Refresh the fixture whenever the PDF changes.
- `lib/papers.ts`: papers; only `read: true` ones are shown anywhere.
- `lib/photos.ts`: photos, in time-of-day order; files in `public/assets/img/photos/` (600px tall, metadata stripped).
- `content/posts/<slug>.md`: posts, front matter `title`, `date`, `summary`, optional `draft: true`.
- `lib/text.ts`: markdown copies (`/<page>.md`), `llms.txt`, the search index. Built from the same data as the pages.
- Live data, each `null` when unconfigured: `lib/github.ts` (`GITHUB_TOKEN`), `lib/store.ts` (Upstash `KV_REST_API_*`), `lib/views.ts` (`VERCEL_ANALYTICS_TOKEN`, `VERCEL_PROJECT_ID`). All env vars are in `.env.example`.
- `components/README.md`: shared tokens, classes and components. The layout renders the rail, controls, palette and footer; pages render only content with exactly one h1.
- `legacy-pages/`: GitHub Pages redirect stubs for the old URLs (cutover steps in its README; regenerate with `tools/legacy-pages.mjs`).

## Rules

- Minimal words: short labels, one-line summaries. Never invent biography facts; everything comes from `lib/`.
- The stack (/stack, formerly the shelf) shows only papers he has read. No books, films or shows. No health or fitness widgets.
- Live widgets render real data only. With no data, render nothing. Sample data (`DEV_FIXTURES=1`, `lib/fixtures.ts`) never reaches a production build.
- Accessibility is enforced: zero axe violations (wcag2a/aa, 21aa, 22aa, best-practice) with the system set to dark or light (the site is night only); controls outside running text ≥ 44px tall and ≥ 24px wide; no sideways scroll at 360–2560px; contrast ≥ 4.5:1; respects reduced motion; content and links work without JavaScript.
- Stable anchors: project ids on `/projects`, role ids on `/resume`, `slug(title)` on `/stack`, file names without `.jpg` on `/photos`. Search results link to them.
- Colours and fonts only through the tokens in `app/globals.css`.
- New dependencies only if essential, pinned to an exact version.

## Commits

History uses a plain imperative sentence as the subject (no prefixes like `feat:`) and a prose body explaining why the change was made and how it was verified.
