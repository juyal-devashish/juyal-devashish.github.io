# juyal-devashish.github.io

Personal portfolio of Devashish Juyal. A static site: `index.html`, `papers.html`, `404.html` and `assets/`. The only build step is the reading notes (below).

- Design tokens and style rules: `design-dna.json`. The site is dark only: a deep navy page with cream text, and one horizon orange that means "clickable" and nothing else. Newsreader for headings, Inter for text, JetBrains Mono only for dates and metrics.
- **Reading notes:** edit `assets/js/papers-data.js`, then run `node tools/build-papers.js`. It writes every entry into `papers.html` as plain HTML, so the notes work without JavaScript and show up in search and link previews. Citations follow "First author et al., venue year".
- **Projects:** each row is an `<article class="project">` in `index.html`. Images live in `assets/img/work/` (`name.jpg` 1280x800 for the details, `name-t.jpg` 320x200 for the row). `#project-id` links open that row.
- **Photos:** the strip at the foot of the page. Put a JPEG 600px tall, with metadata such as GPS stripped, in `assets/img/photos/` and add a line to `assets/js/photos.js` in time-of-day order, with its width, a caption (place and month) and alt text. Only name a place when the photo was taken within about 10 km of it.
- **Hero:** `assets/img/hero/` holds the ring artwork as a 1800px-wide crop and an 876x1168 phone crop. The hero sets its own text and scrim colours (`--h-*` in `style.css`). If you change the image or the scrims, re-check that every hero text box is still at least 4.5:1 against the actual pixels.
- Local preview: `python3 -m http.server 8000`
