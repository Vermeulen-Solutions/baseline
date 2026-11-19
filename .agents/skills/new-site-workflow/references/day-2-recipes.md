# Day-2 recipes: the requests a live site gets

Read this for an everyday change on a site that is already built: a new page, a rebrand, a form, a language, a collection, a component, a video or a map. Each recipe names where the change belongs and the check that proves it. Read the site's `AGENTS.md` (and `PRODUCT.md`, if adopted) first: the site's own conventions and the Art Direction Record win over the examples here. Record any decision you made without asking under Assumptions in `PRODUCT.md`, and use `[[placeholder: …]]` for facts nobody gave you (see [content patterns](content-patterns.md)).

Every recipe ends the same way: `npm run verify`, a build served locally, and `npm run check:quality -- --base <origin> --routes <changed routes>`; for visible changes also `audit:ui` on the changed routes and the art-direction gate. A green check is evidence, not approval.

## Add a page

- **EmDash:** an editorial page is content. Create it in the admin (Pages), or seed it when it must exist on every install. Give it its own SEO title and description (60 and 70 to 160 characters) and add it to the menu in the admin. Only a page with behaviour code (a calculator, an integration) becomes a route in `src/pages/`, using `Base.astro`.
- **Static:** add a route in `src/pages/` that renders `Base.astro` with `title` and `description`; add it to `site.navigation` in `src/config/site.ts` and to `sitemap.xml.ts` when it is not generated from a collection.
- Compose from the shipped primitives (`Section`, `Container`, `Grid`, `Card`, `Heading`) before writing new markup; one `<h1>` per page.
- **Check:** `check:quality` on the route (title, description, one `<h1>`, share image), and the link from the navigation.

## Rebrand

- **Colours and type:** change the tokens in `src/styles/global.css` (`@theme`): surfaces, text, action and focus colours, `--font-body` and `--font-display`. Never hard-code a colour in a component. Run `npm run design:tokens` for contrast and record the change in the Art Direction Record.
- **Fonts:** self-host them (`@fontsource-variable/*`, imported in `global.css` by the package path without `.css` as Fontsource documents it, such as `@import "@fontsource-variable/newsreader/wght";`, or the `.woff2` files in `src/styles/fonts/` with `@font-face` in `global.css` and a relative `url("./fonts/…")`, which Vite fingerprints and which `design:tokens` and the starter's token tests (they copy `src/styles` whole) both read), preload only the first screen's face, and check them with `docs/font-preflight.md`.
- **Logo and icons:** replace `public/favicon.svg`, then `npm run icons -- --background "#<brand ground>"` and commit the PNGs. On EmDash also set the logo in the site settings.
- **Name and share image:** the site title and tagline (EmDash settings, or `src/config/site.ts`), the default share image (EmDash SEO settings, or a 1200×630 file in `public/` that Base passes as the fallback `image`; one per language when the headline differs), and the business facts in the metadata plugin's `options.organization`.
- **Check:** `design:tokens`, the art-direction gate, `check:quality` (no `default-identity`, no contrast findings from axe), `audit:ui`, and a look at the share image and home-screen icon.

## Give a page a signature moment

- Read the Art Direction Record first: the governing idea says what the moment is about. One per page archetype is enough: an image-led stage for a place or a craft, one fitted line for a statement, an index that previews the work, a page transition that suits the subject.
- Use the expressive layer (`docs/reusable-public-patterns.md`, Expressive layer): `MediaStage`, `IndexList`, `data-shape`, `.display-fit`, the `data-reveal`/`data-scroll` effects and `SiteShell transitionStyle`. On an older site, adopt `src/styles/expressive.css` and the component with `npm run site:files -- --site <path> --files <paths> --apply` from a Baseline checkout and add `import '../styles/expressive.css';` after the SiteShell import in `Base.astro`.
- Use real photographs prepared with `media:prepare`; pass `priority` and a `focus` point to a first-screen stage.
- **Check:** `audit:ui` at 390, 768 and 1440 (no sideways scroll, no hidden first screen, crops), the words over the photograph by eye at wide widths, 200% text on a fitted line, and reduced motion.

## Connect a form

- Follow the emdash-production-cutover skill's contact-forms reference on EmDash sites: store first, then send, with honeypot, rate limit or challenge, and the suspicious-submission scoring. On static sites point `Form.astro`'s `action` at the site's own endpoint or a provider, never at `#`.
- Write the field messages in the page's language with `data-error-*` attributes; name the form provider in the privacy notice.
- **Check:** one real submission as an anonymous visitor reaches the inbox; `check:quality` reports no `form-no-destination`.

## Add a language

- Read `docs/internationalization.md` for the site's locale model (EmDash i18n, or static routes per locale). Translate meaning and register, not words, and keep one record per locale.
- Set `lang` per page, link the language versions to each other (`hreflang`) and give each its own title and description.
- Give the consent banner, `Hours`, `BeforeAfter`, `VideoEmbed` and form messages their labels in the new language through their props.
- **Check:** `check:quality` on both versions (titles, descriptions, `copy` rules per language) and the language switcher by keyboard.

## Add a collection

- **EmDash:** use the emdash-content-modeling skill: decide `required` and `unique` at creation, give entries an SEO description, keep quotes and reviews honest, and add a listing route that passes `robots: 'noindex, follow'` while empty.
- **Static:** add it to `src/content.config.ts` with field bounds in the schema, a listing and a detail route, and its sitemap entries; gate the section until its first entry (`gatedRoutes()`).
- **Check:** `npm run typecheck`, the listing empty and with one entry, and `check:quality` on both routes.

## Add a component

- Check the shipped primitives and the astro-site-design skill first; reuse beats a near-duplicate. Prefer the platform: `<details>`, `<dialog>`, `popover`, a range input.
- Put site components in `src/components/`, style them with tokens only, give every interactive part a visible focus state and a 24×24 px target, and answer reduced motion. A Baseline-owned file is replaced by the next update: change a site copy instead, and expect `fleet:drift` to list it.
- **Check:** `check:css`, the art-direction gate, `audit:ui` at phone and desktop widths, and `check:quality` (axe, target size, hidden first screen).

## Show a video, a map or opening hours

- `VideoEmbed.astro` (YouTube or Vimeo) and `MapEmbed.astro` contact the provider only on click; name the provider in the privacy notice and add its origin to `frame-src` in `CSP_SOURCES` when a CSP is on.
- On a site with its own palette, map the tokens these components read (`--color-surface`, `--color-text`, `--color-border`, `--color-border-strong`, `--color-focus`) onto the site's colours on the embed's container. They style inside `@layer components`, so a site's unlayered `img` or `figcaption` rules win: restate the poster fill there if the poster does not cover the frame. `VideoEmbed` expects the current `ResponsiveImage` (which accepts imported images); on an older one, narrow `poster` to a URL string.
- Opening hours go in one list passed to both `Hours.astro` and the metadata plugin's `options.organization.openingHours`, so the page and search results agree.
- **Check:** no request to the provider before the click (`check:quality` lists none in `csp-violation` either), and the hours match the business's public listing.

## Turn on analytics

- Follow [trust and measurement](trust-and-measurement.md): choose the tier with the owner, set the ids and `PUBLIC_ANALYTICS_HOSTS` in the production build environment, give the banner the site's language, add a footer link with `data-consent-open`, and update the privacy notice.
- **Check:** on the production hostname the banner appears once, Reject keeps Consent Mode denied, and nothing loads on a preview hostname.
