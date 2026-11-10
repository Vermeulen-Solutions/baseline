# Shipped interaction and navigation primitives

Read at Stage 3 when deciding each route archetype's wayfinding and features, and again at Stage 5 before composing those routes. Baseline ships these components in `src/components/` on every profile. They are opt-in: nothing renders until a template uses them, so a primitive the plan never names is never built. Check that the installed file exists first; an older site that lacks one needs reviewed adoption (`docs/baseline-updates.md`), not a hand-written copy.

Use a primitive only for a visitor need from the brief or page briefs. Record each choice per route archetype in the route inventory (for example "posts/[slug]: TableOfContents + Heading anchors"), so later stages build it and acceptance checks it. A feature count is not a quality measure.

## Choose by visitor need

| Visitor need | Primitive | Typical archetype | Setup beyond the template |
| --- | --- | --- | --- |
| Find a page by words on sites with many pages, docs, or a large archive | `SearchDialog` (optional Pagefind) | Site header, every route | Config, pinned dev dependency, post-build index: see [Site search](#site-search) |
| Orient within a long article and jump to sections | `TableOfContents` + `Heading` | Guides, docs, long posts, policies | Stable heading IDs; `--header-height` for sticky headers |
| Share or bookmark a specific section | `Heading` with `anchor` | Docs, FAQs, long-form reference | Explicit `id`s (`slugifyHeading`, `deduplicateHeadingId` in `src/lib/headings.ts`) |
| See the same content in parallel variants (OS, plan, language of a code sample) | `Tabs` | Docs, pricing details, install instructions | Unique `id`; `syncKey` + `persist` to keep a choice across tabsets |
| Copy a command, code, coupon or address exactly | `CopyButton` + `Announcer` | Docs, developer pages, contact details | One `Announcer` per announcer id on the page |
| Notice a warning, tip or important condition inside prose | `Callout` (`note`, `tip`, `caution`, `danger`) | Articles, guides, policies | Calibrate `--color-callout-*` against the site's light and dark surfaces |
| Follow a numbered procedure | `Steps` | How-to pages, onboarding, booking process | None |
| Choose light, dark or system appearance | `ThemeSelect` or `data-surface-toggle` | Site header or footer | Only when the Art Direction Record supports both surfaces |
| Hear the result of an in-page action (copy, filter, search) | `Announcer` | Mounted once in the layout | None; it is the shared live region |
| Judge whether to read an article now | `readingTime()` in `src/lib/reading-time.ts` | Article and post templates, sometimes listings | Pass the page's `locale`; format `minutes` with localized copy, because the returned `text` is English only |

Disclosure, Cluster, Sidebar, LogoTicker, PhotoGallery, PartnersPanel and Form have their own guidance in the skill, `docs/native-composition.md` and `docs/reusable-public-patterns.md` when installed.

## Contracts to keep

- **Localize every visible label.** `SearchDialog` takes `labels`, `ThemeSelect` takes `labels`, `CopyButton` takes `label`/`copiedLabel`/`copiedMessage`/`errorMessage`, `Heading` takes `anchorLabel`, and `TableOfContents` takes `label`. English defaults are not acceptable on a French-first or multilingual site.
- **Progressive enhancement.** Tab panels stay readable without JavaScript, the table of contents is native links, and Steps and Callout are server-rendered. CopyButton, ThemeSelect and the search dialog need JavaScript; search shows only its optional `fallbackHref` link without it.
- **Headings and TOC share IDs.** For Markdown, map each Astro heading's `slug` to the record's `id`. For EmDash Portable Text, use `headingsFromPortableBlocks()` from `src/lib/emdash-headings.ts` with the same `RichText` scope.
- **Spacing belongs to the parent.** Callout, Steps and TableOfContents have no outer margin; use the surrounding Container/Section gap.
- **Lifecycle is built in.** Every controller tears down and reinitializes across ClientRouter swaps. Do not add a second `astro:page-load` initializer.

## Site search

Search is a Stage 3 decision, not a default. Recommend it when visitors need to find content they cannot reach through navigation in two or three steps, for example a documentation site, a resource library or an archive with dozens of entries. A small marketing site rarely needs it. Record the decision and the zero-JavaScript fallback page (an archive, sitemap page or index) in the route inventory.

When chosen, follow `docs/search.md`. In short:

1. Add `search: { engine: 'pagefind', bundlePath: '_pagefind' }` to `baselineFeatures()` in `astro.config.mjs`.
2. Install Pagefind as an exact dev dependency: `npm install --save-dev --save-exact pagefind@1.6.0`. Never add it to `dependencies`.
3. Mount `<SearchDialog fallbackHref=… labels={…} />` and one `<Announcer id="site-announcer" />` in the site's `Base.astro`.
4. Make sure every indexable page uses SiteShell (its `<main>` carries `data-pagefind-body`) and has the correct `<html lang>`. Pages that must stay out of search need `robots` `noindex`.
5. After `npm run build`, run `npm run search:index`, or chain it into the site's `postbuild`. On EmDash, SSR pages are indexed only from an explicit snapshot: `npm run audit:html`, then `npm run search:index -- --source <printed snapshot directory>`.

Acceptance happens in a browser, on the built site with its real index:

- Open search with the button and with Ctrl+K, and search for a known page in each published locale.
- Follow a result: the URL keeps the base path.
- Escape closes the dialog and returns focus to what opened it.
- A backdrop click closes the dialog; a text-selection drag from the input onto the backdrop does not.
- A noindex or private page never appears.
- With JavaScript off, only the fallback link shows.

A configured option is not an index: `.baseline-search-index.json` in the build output records what was actually indexed.
