# Site Architecture

Applies when changing application code, pages, scripts, routing, styles, or offline behavior.

## Development Reloads

`src/integrations/dev-reload-lock/index.ts`, registered in `astro.config.mjs`, coalesces edit bursts. A body-only `docs/**/*.{md,mdx}` edit waits for a 120ms quiet period, sends `sn:content-changed`, and `src/scripts/live-update.ts` patches the open note’s article, TOC, title, breadcrumb, and sidebar label in place.

Any frontmatter change, component/script/config change, or added/removed note uses a real `full-reload` after a 1.3s quiet period. Frontmatter is detected by comparing each file’s raw frontmatter block, because page chrome depends on fields that live update does not patch.

## Soft Navigation

`src/scripts/note-swap.ts` turns previous/next links, sidebar note links, and left/right shortcuts into in-place swaps within a view transition. It falls back to a normal navigation before touching the DOM if the target is not a note, uses a different sidebar, or needs a script absent from the current page.

The `illustration-script-marker` Vite plugin marks scripts under `src/components/illustrations/`; `note-swap.ts` reruns marked scripts after a swap. A new page-level script that must survive a swap exports an `init...()` function and is called from `applyDocument`, as `initNoteFeedback` is. In development, `live-update.ts` reads the changed file path for each event because soft navigation can change the displayed note.

## Offline Support

`public/sw.js` is registered by `src/scripts/offline.ts` through `Layout.astro` in production only. It caches visited pages stale-while-revalidate, expires cached entries after 30 days, and never caches `/api`, `/og`, `/pagefind`, or unapproved third-party hosts.

- Bump `VERSION` in `public/sw.js` whenever caching logic changes.
- Keep `PAGE_CACHE_PREFIX`, `AT_HEADER`, and `MAX_AGE_MS` identical in the worker and `offline.ts`.
- Soft-navigated pages are stored through `initOfflineStatus()` in `applyDocument`; hover previews refresh only pages already cached.
- Network-dependent UI must react to `html[data-offline]`, using `syncOfflineUi()` or a scoped `:global(html[data-offline])` rule.
- `src/pages/offline.astro` is the fallback for uncached navigations and is precached with its assets.

## Routing and Layout

- `src/pages/index.astro`
  Homepage, grouped by semester.
- `src/pages/[sem].astro`
  Semester overview.
- `src/pages/[...slug].astro`
  Note page with a three-column layout and static paths for every note.
- `src/pages/og/[...slug].ts`
  Per-note Open Graph images.
- `src/pages/sitemap-index.xml.ts` and `src/pages/sitemaps/[sem].xml.ts`
  Semester-split sitemaps.

`src/content.config.ts` globs `./docs/**/*.{md,mdx}`. Components are grouped under `icons/`, `illustrations/`, `layout/`, `home/`, `note/`, and `mdx/`. Shared helpers live in `src/utils/`.

## Styling

- Light/dark mode uses `data-theme` on `<html>` and localStorage key `sn-theme`.
- Semester accents are `--s1` through `--s8` in `src/styles/global.css`.
- Do not use Tailwind Typography. Note prose styles are hand-written in `src/pages/[...slug].astro`; `global.css` only contains CSS variables and the box-sizing reset. Component styles use scoped `<style>` blocks.
- Math uses `remark-math` and `rehype-katex`; KaTeX CSS comes from the CDN in `Layout.astro`.
- Custom Markdown classes are `.callout` and `.term`.
- Do not write a multi-line `/* ... */` comment in an Astro `<style>` block. Use one single-line comment per line so Prettier remains stable.
