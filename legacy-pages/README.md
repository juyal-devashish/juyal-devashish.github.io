# legacy-pages

What `juyal-devashish.github.io` serves after the move to Vercel: redirect stubs for the old URLs, plus real copies of the files people and crawlers may still fetch there.

| File | Does |
|---|---|
| `index.html` | Redirects to the new home. Old anchors land on the new page: `#sama4` → `/projects#sama4`, `#micron` → `/resume#micron`, `#fun` → `/photos`; any other hash is kept. |
| `papers.html` | Redirects to `/stack`, keeping the hash. Read papers keep their slug; anchors for papers not on the stack land at the top. |
| `404.html` | Redirects any other old path to the new home. |
| `index.md`, `papers.md`, `llms.txt` | Copies of the new `/index.md`, `/stack.md` and `/llms.txt`. |
| `assets/devashish-juyal-resume.pdf` | The résumé at its old path. A PDF can't redirect, so this is a copy; refresh it when the résumé changes. |
| `.nojekyll` | Serve files as they are. |

Each stub runs `location.replace(...)` first, then has an instant `<meta http-equiv="refresh">`, a `rel=canonical` and a visible link, so it works with or without JavaScript.

Regenerate (after changing content or the site URL):

```sh
NEXT_PUBLIC_SITE_URL=https://juyal-devashish.vercel.app npx next build
npx next start -p 3200 &
NEXT_PUBLIC_SITE_URL=https://juyal-devashish.vercel.app node tools/legacy-pages.mjs http://127.0.0.1:3200
```

## Cutover

1. **Deploy to Vercel.** Import the repo, framework Next.js, defaults. Add the env vars from `.env.example` that you use.
2. **Set `NEXT_PUBLIC_SITE_URL`** in Vercel to the final address (default `https://juyal-devashish.vercel.app`), and redeploy. If it differs from the default, regenerate this folder with the same value.
3. **Push this folder's contents to a `gh-pages` branch**, as the branch root (once `legacy-pages/` is committed on `main`):
   ```sh
   git subtree split --prefix legacy-pages -b gh-pages
   git push origin gh-pages
   ```
4. **Switch GitHub Pages** (repo Settings → Pages → Build and deployment) to "Deploy from a branch", branch `gh-pages`, folder `/ (root)`.
