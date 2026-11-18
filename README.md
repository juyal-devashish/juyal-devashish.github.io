# juyal-devashish.github.io

Devashish Juyal's personal site. Next.js 16 (App Router), deployed on Vercel.

```sh
npm ci
npm run dev                                   # http://localhost:3000
npm test && npx tsc --noEmit
npx next build && npx next start -p 3200      # then: npm run check && npm run check:palette
```

## Content

- **Profile, projects, résumé, now, nav:** `lib/site.ts`
- **Stack:** `lib/papers.ts`. Only papers with `read: true` appear.
- **Photos:** `lib/photos.ts` + `public/assets/img/photos/`
- **Writing:** `content/posts/<slug>.md` with `title`, `date`, `summary` front matter
- **Résumé PDF:** `public/assets/devashish-juyal-resume.pdf`

Every page also has a markdown copy (`/projects.md`, …), plus `/llms.txt`, `/rss.xml`, `/sitemap.xml` and `/search-index.json` (the ⌘K palette), all built from the same data.

## Live data (optional)

Set in Vercel (see `.env.example`). Without a variable, its widget is simply not shown.

| Variable | For |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Absolute links. Default `https://juyal-devashish.vercel.app` |
| `GITHUB_TOKEN` | Contribution calendar (recommended; without it the public calendar page is used, and a year it can't fully cover is hidden) |
| `WAKATIME_TOKEN`, `WAKATIME_API_URL`, `WAKATIME_AUTH` | Coding hours |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Upstash store for coding history and post views |
| `CRON_SECRET` | Daily `/api/cron` |
| `VERCEL_ANALYTICS_TOKEN`, `VERCEL_PROJECT_ID`, `VERCEL_TEAM_ID` | Page views on the year page |

## Rules

Minimal words. Stack = papers he has read, nothing else. No health widgets. Live widgets show real data or nothing. Zero axe violations in both themes, 44px targets, no sideways scroll, works without JavaScript.

## Moving from GitHub Pages

1. Deploy to Vercel.
2. Set `NEXT_PUBLIC_SITE_URL`.
3. Push `legacy-pages/` contents to a `gh-pages` branch.
4. Switch the Pages source to that branch.

Details in `legacy-pages/README.md`.
