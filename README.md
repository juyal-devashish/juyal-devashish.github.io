# juyal-devashish.github.io

Devashish Juyal's personal site, served by GitHub Pages from `main`. Plain HTML, CSS and JavaScript; the only build step makes the files generated from the site's own content.

- **Preview:** `python3 -m http.server 8000`
- **Papers on the shelf:** edit `assets/js/papers-data.js`, run `node tools/build.js`, and commit what it writes (`papers.html`, `papers.md`, `index.md`, `llms.txt`, `assets/search-index.json`). The search index is built from the page's own projects, background rows, papers and photo captions, so a result's link target needs an `id` in the HTML. Run it after editing `index.html` too, so `index.md` and `llms.txt` follow.
- **Checks:** every push runs `.github/workflows/checks.yml` (generated files up to date, accessibility, tap targets, screenshots, links, Lighthouse). Locally: `node tools/check.js http://127.0.0.1:8000` with `playwright` and `axe-core` installed.
