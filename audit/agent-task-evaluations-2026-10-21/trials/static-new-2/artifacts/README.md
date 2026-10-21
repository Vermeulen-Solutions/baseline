# Northline Planning

A local static Astro site for an independent planning consultancy. The owner and coding assistant maintain content in Git.

## Develop and check

Use Node ^22.22.3, ^24.16.0 or >=26.3.0 and npm. The initial install has created package-lock.json; use `npm ci` for a clean install.

```sh
npm run dev
npm run verify
npm run build
npm run check:dev-tools
npm run preview
```

The four routes are `/`, `/services/`, `/about/` and `/contact/`. Native Astro Content Collections validate the Markdown in `src/content/pages/` and `src/content/services/`. Edit page titles, headings, descriptions and Markdown bodies there; services are ordered by their `order` field. Draft entries are omitted. Navigation, identity, enquiry email and primary action live in `src/config/site.ts`.

Design decisions are in AGENTS.md, with tokens and layered styles in `src/styles/global.css`. The site uses Georgia and system sans fonts with no external font requests. No browser CMS, accounts, forms, tracking or deployment is configured.

Only `dist/` is the production output. Baseline's isolated component fixtures use `npm run fixtures:build` and `npm run fixtures:serve`; never publish `dist-fixtures/`. The normal build excludes `/_styleguide/` and starter sample routes. The local development styleguide route returned 404 during this build; the fixture path was used for calibration without modifying Baseline scripts.

No public domain is set. Set SITE_URL only when a public origin is chosen. Future hosting must return actual 404 statuses without SPA rewrites. The supplied example email is presented through mailto links; no email was sent. Local evidence is in `audit/`, with delivery notes one directory above this project.

Baseline provenance remains in baseline.config.json and .baseline/managed-files.json. Review staged upstream changes using the supplied sync:baseline process; do not overwrite local tokens or content automatically.
