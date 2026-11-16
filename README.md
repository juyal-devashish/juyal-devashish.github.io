# juyal-devashish.github.io

Personal portfolio of Devashish Juyal. A static site with no build step: `index.html`, `papers.html`, and `assets/`.

- Design tokens and style rules: `design-dna.json` (generated with the design-dna skill). The theme is "golden hour": warm paper, ink navy and one terracotta accent, Newsreader serif headings over Inter, with soft neumorphic depth and a blue-hour dark mode.
- To add a paper to the reading list, append an entry to `assets/js/papers-data.js`.
- To add a photo to the Fun stuff strip, put a JPEG 600px tall in `assets/img/photos/` (metadata such as GPS stripped) and add a line with its width and alt text to `assets/js/photos.js`.
- The home-page hero is `assets/img/hero/` (a 2400x1500 wide crop and a 1080x1440 phone crop of the same photo, horizon kept low so text sits on sky).
- Local preview: `python3 -m http.server 8000`
