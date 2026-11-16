# juyal-devashish.github.io

Personal portfolio of Devashish Juyal. A static site: `index.html`, `papers.html`, `404.html` and `assets/`. The only build step is the reading notes (below).

- Design tokens and style rules: `design-dna.json`. Colours are sampled from the hero photo: the navy of the sky, the grey-lavender of the clouds and the orange of the horizon. The accent colour means "clickable" and nothing else. Newsreader for headings, Inter for text, JetBrains Mono only for dates and metrics.
- **Reading notes:** edit `assets/js/papers-data.js`, then run `node tools/build-papers.js`. It writes every entry into `papers.html` as plain HTML, so the notes work without JavaScript and show up in search and link previews. Citations follow "First author et al., venue year".
- **Projects:** each row is an `<article class="project">` in `index.html`. Images live in `assets/img/work/` (`name.jpg` 1280x800 for the details, `name-t.jpg` 320x200 for the row). `#project-id` links open that row.
- **Photos:** the strip at the foot of the page. Put a JPEG 600px tall, with metadata such as GPS stripped, in `assets/img/photos/` and add a line to `assets/js/photos.js` in time-of-day order, with its width, a caption (place and month) and alt text. Only name a place when the photo was taken within about 10 km of it.
- **Hero:** `assets/img/hero/` holds a day photo and a night photo, each as a 2400x1500 wide crop and a 1080x1440 phone crop. Night mode shows the night photo. If you change a photo or the scrims in `style.css`, re-check that every hero text box is still at least 4.5:1 against the actual pixels.
- Local preview: `python3 -m http.server 8000`
