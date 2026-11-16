# juyal-devashish.github.io

Personal portfolio of Devashish Juyal. A static site with no build step: `index.html`, `papers.html`, and `assets/`.

- Design tokens and style rules: `design-dna.json` (generated with the design-dna skill). The theme is "golden hour": warm paper, ink navy and one terracotta accent, Newsreader serif headings over Inter, with soft neumorphic depth and a blue-hour dark mode.
- To add a paper to the reading list, append an entry to `assets/js/papers-data.js`.
- To add a photo, put a JPEG in `assets/img/photos/` (long edge 1400px, metadata such as GPS stripped) and add a line with alt text to `assets/js/photos.js`.
- Local preview: `python3 -m http.server 8000`
