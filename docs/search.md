# Optional site search (Pagefind)

Baseline ships an optional, progressively enhanced search primitive: `SearchDialog.astro` (a native `<dialog>`), a framework-free controller in `src/lib/search.ts`, and a post-build indexer exposed as `npm run search:index`. It adds no runtime npm dependency and no hosted service. Search stays off until a site opts in.

## What you get

- A trigger button that opens a modal search dialog with `showModal()`. Escape, the visible close button and a backdrop click close it, and focus returns to the control that opened it. If that control was removed, focus goes to the trigger, or stays where the browser put it after navigation.
- Ctrl+K and Cmd+K open search. An optional `/` shortcut is off by default. Shortcuts are ignored while typing in inputs, textareas, selects and contenteditable regions, during IME composition and when another handler already called `preventDefault()`. Search never changes browser history.
- The generated Pagefind bundle is loaded on the first open, not on page load. Results render through text nodes and `<mark>` elements only; index content never becomes executable HTML. Result links must be same-origin.
- Loading, empty, error and "index not built yet" states are shown in the dialog and announced through a mounted Baseline Announcer. A newer query aborts the previous one. ClientRouter swaps and DOM removal close the dialog and release listeners, timers and pending queries; a persisted instance survives once.

## Opt in

1. Configure the capability in `astro.config.mjs`. `bundlePath` is the public directory, relative to the site base, where the index is written:

   ```js
   baselineFeatures({ search: { engine: 'pagefind', bundlePath: '_pagefind' } }),
   ```

2. Install the Pagefind CLI as an exact, explicitly selected dev dependency. The indexer refuses ranges, runtime `dependencies` and mismatched installs, and it never downloads a CLI:

   ```bash
   npm install --save-dev --save-exact pagefind@1.6.0
   ```

3. Mount the dialog and one Announcer in the site's layout (for example the header of `src/layouts/Base.astro`). Pass localized copy for every locale you publish:

   ```astro
   ---
   import Announcer from '../components/Announcer.astro';
   import SearchDialog from '../components/SearchDialog.astro';
   ---
   <SearchDialog
     fallbackHref="/posts/"
     labels={{
       trigger: 'Rechercher', title: 'Rechercher sur le site', inputLabel: 'Termes de recherche', close: 'Fermer',
       idle: 'Saisissez au moins deux caractères.', loading: 'Recherche…', empty: 'Aucun résultat pour « {query} ».',
       results: { one: '{count} résultat pour « {query} ».', other: '{count} résultats pour « {query} ».' },
       unavailable: 'La recherche n’est pas encore disponible : l’index n’a pas été généré.',
       error: 'La recherche a échoué. Réessayez.',
     }}
   />
   <Announcer id="site-announcer" />
   ```

4. Build, then index: `npm run build && npm run search:index`. To index on every build, set the site's `postbuild` script to run the existing release check followed by `npm run search:index`.

## Zero-JavaScript fallback

Without JavaScript the dialog trigger stays hidden, so there is no button that does nothing. Pass `fallbackHref` to show an ordinary link instead, pointing at a public page you choose, such as a sitemap, archive or index page. Without `fallbackHref` and without JavaScript, nothing is rendered.

## What gets indexed

The indexer reads the build's configuration receipt (`.baseline-search.json`, written by `astro build` when search is configured). A configured option is not an index: the indexer writes a separate readiness receipt, `.baseline-search-index.json`, with the Pagefind version, page count per language, exclusions and warnings. A rebuild removes the previous readiness receipt. Until an index exists, opening search explains that it is not available yet.

| Profile | Source of HTML | Bundle served from |
| --- | --- | --- |
| `static`, `static-sveltia` | Emitted public HTML in the build output (normally `dist/`) | `<output>/<bundlePath>/` |
| `emdash` (Node) | Prerendered HTML in `dist/client`, plus an explicit anonymous public export | `dist/client/<bundlePath>/` |

Ordinary EmDash SSR routes are never discovered by scanning the build tree, and `dist/server` is never read. To index CMS pages, capture an anonymous public snapshot of the fresh release build and pass it explicitly:

```bash
npm run build
npm run audit:html
npm run search:index -- --source .emdash/snapshots/capture-<id>
```

`audit:html` prints the snapshot directory. It captures pages with unauthenticated loopback GET requests only. The indexer refuses snapshots older than the build, failed captures and query-string URLs. It performs no CMS writes, authentication or setup bypass, and it never turns a static site into a server site.

Always excluded: `/_emdash`, `/_astro`, `/_image`, `/_server-islands`, the styleguide and other developer fixtures, `/admin` (Sveltia), any route segment that starts with `_`, the bundle directory, `/404`, `/500`, and pages with `<meta name="robots" content="noindex">`. Add more prefixes with `--exclude /members`. Developer-fixture builds (`ASTRO_TEST_FIXTURES=1`) are refused, so fixture indexes never reach a release artifact. Keep drafts and private content out of public HTML in the first place; the indexer only sees what a visitor could request.

The shared `SiteShell` marks `<main>` with `data-pagefind-body`, so headers, navigation, skip links and footers stay out of results, and the search dialog marks itself `data-pagefind-ignore="all"`. Pagefind then indexes only pages that contain a `data-pagefind-body` region: a page rendered without SiteShell needs its own marker. Use `data-pagefind-ignore` inside `<main>` for repeated boilerplate.

## Languages, base paths and URLs

Each page's `<html lang>` selects its Pagefind language index, and the browser searches the index matching the current page's language. Pages without `lang` produce a warning. Result URLs include the Astro `base`, and the browser loads the bundle from `capabilities.base` plus `capabilities.search.bundlePath`, so a site under `/docs/` with `bundlePath: 'search'` loads `/docs/search/pagefind.js`.

## Styling

The component uses Baseline surface, text, border, link, focus, spacing and radius tokens. Override these hooks on `.search` or an ancestor: `--search-surface`, `--search-text`, `--search-muted`, `--search-border`, `--search-link`, `--search-focus`, `--search-radius`, `--search-control-radius`, `--search-gap`, `--search-width` and `--search-mark`. It uses logical properties for RTL and has forced-colors rules, and it does not animate.

## Verification

`tests/search.test.mjs` covers the browser-free contracts with a stubbed Pagefind. Before shipping search on a site, check the real index in a browser: open the dialog with the trigger and with Ctrl+K, search for a known page, follow a result, check that Escape returns focus, check that a backdrop click closes the dialog while a text-selection drag from the input onto the backdrop does not, check the missing-index message before indexing, and check every published locale and the base path.

Baseline maintainers can automate these checks against a generated project with `npm run rehearse:search -- --site <project>` in the Baseline repository. It runs local headless Chromium only and never runs in CI.
