# Shared components and CSS

The layout already renders the rail, the controls, the palette, the footer (contact band) and `<main id="main">`.
Pages render **only their content**: no `<main>`, no footer, exactly one `<h1>`.

## Tokens (app/globals.css)
Colours: `--bg --bg-deep --surface --surface-2 --ink --ink-2 --ink-3 --hair --hair-2 --accent --accent-strong --on-accent --ring --ring-soft --glow --shadow`.
Hero art: `--hero-filter --hero-fg --hero-fg-2 --hero-scrim (r,g,b) --hero-accent --hero-halo`. Calendar dots: `--c0..--c4 --c-edge`.
Fonts: `--f-serif` (Newsreader, italic accent words), `--f-sans` (Inter), `--f-mono` (JetBrains Mono). Never write literal font names or colours.
Layout: `--max` 1180px, `--prose` 68ch, `--g` side gutter, `--rail` 168px (desktop), `--bar` 64px (phone bottom bar), `--ease`.
Theme: night is the default; daybreak via `prefers-color-scheme: light` or `html[data-theme=light]`. Test both.

## Classes
- Layout: `.wrap` (centred, gutters), `.wrap.narrow` (prose width), `.sec` (section spacing), `.sec.first` (first section on a page, clears the controls), `.bleed` (full-bleed band that reaches under the desktop rail; add your own inner padding), `.prose` (markdown/body text), `.stack` (vertical rhythm).
- Type: `.kicker` (mono caps with orange dash), `.label` (small mono caps), `.meta` (mono row of facts), `.display` (big serif; `em` turns orange), `.mono`, `.serif`, `.muted`, `.faint`, `.vh` (visually hidden).
- Buttons/links: `.hbtn` (pill, 48px), `.hbtn.primary` (orange), `.hbtn.solid` (surface fill), `.hbtns` (row); `.qlink` (orange underlined link, 44px), `.qlinks` (row); `.ibtn` (small icon+label pill, 44px; `.compact` hides the label under 600px).
- Badges: `<StatusBadge status>` → `.badge.live|demo|proto|research|archived`; tags: `.badge.note`; topic chips: `.chip` in `.chips`.
- Surfaces: `.card` (+ `.lift` hover, `.glow` orange corner, `.raised` featured gradient), `.panel` + `.panel-src` (data widgets), `.rows` (hairline-separated list), `.stretch` (on the one link inside a card: whole card clickable).
- `.js-only`: hidden until `html.js` (set before paint). Use for controls that need JS.

## Components
- `<SectionHeader id no label title accent after as dek copy ornament />` — "02 — Projects", serif heading with italic accent, drawn orbit arcs, Copy link (when `id` set). Heading id is `${id}-h`; put `id` on your `<section aria-labelledby="${id}-h">`. Use `as="h1"` for the page title.
- `<Reveal as className delay>` — reveal on scroll. Server component; visible without JS/with reduced motion.
- `<StatusBadge status />` — project status ring badge.
- `<Lightbox group items openOnHash label />` (client) — render thumbnails as `<a href={full} data-lightbox={group} data-index={i}>` (works without JS); `items: { id?, src, alt, caption?, meta?, width?, height? }[]`. `openOnHash` opens `#id` deep links (photos: id = file name without `.jpg`). Ids `#lightbox #lb-img #lb-cap`.
- `<Clock />` — "7:37 PM in New York", client only (nothing without JS). `<CopyEmail className />` — copy button.
- `lib/sound.ts` `play('nav'|'toggle'|'open'|'close'|'type'|'error'|'copy')` — call on UI events; it no-ops unless the visitor turned sounds on.
- `components/util.ts`: `announce(msg)` (page live region), `copyText(text)`, `openPalette()`, `isTyping(e)`.
- `lib/theme.ts`: `currentTheme() toggleTheme() onThemeChange(fn)`.

## Rules
Keyboard: Alt+1..7 pages (from `lib/site` nav), Alt+T theme, Ctrl/⌘K search. Don't bind these elsewhere.
Targets ≥44px tall and ≥24px wide outside running text. Live widgets: render nothing when the source returns null.
Motion: `.rv-armed`/`.orn.armed` are added by `components/Motion` only for below-the-fold elements and never under reduced motion or `navigator.webdriver` (screenshots/axe see the finished page).
- `lib/meta.ts` `pageMeta(path, title, description, { md, images })`: page metadata with canonical, the `.md` alternate, and the RSS and llms.txt links repeated (Next merges `alternates` shallowly).
