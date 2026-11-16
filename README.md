# juyal-devashish.github.io

Devashish Juyal's personal site, served by GitHub Pages from `main`. Plain HTML, CSS and JavaScript; no build step except the reading notes.

- **Preview:** `python3 -m http.server 8000`
- **Reading notes:** edit `assets/js/papers-data.js`, then run `node tools/build-papers.js` and commit `papers.html`.
- **Checks:** every push runs `.github/workflows/checks.yml` (accessibility, tap targets, screenshots, links, Lighthouse). Locally: `node tools/check.js http://127.0.0.1:8000` with `playwright` and `axe-core` installed.
