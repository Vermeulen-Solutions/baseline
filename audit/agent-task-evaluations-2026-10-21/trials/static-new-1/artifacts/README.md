# Northline Planning

Local static Astro website for Northline Planning. Four English routes: `/`, `/services/`, `/about/` and `/contact/`. The primary action opens an email to `hello@northline.example.test`. No forms, tracking, accounts or browser CMS.

## Edit and preview

Use Node `^22.22.3 || ^24.16.0 || >=26.3.0` and npm. The independent lockfile is included; use `npm ci` for subsequent installs.

- `src/content/pages/*.md` owns each page heading, description and Markdown prose.
- `src/content/services/*.md` owns the shared service titles, descriptions and ordering. `draft: true` excludes an entry.
- `src/config/site.ts` owns identity, navigation, email and primary action text.
- `src/content.config.ts` defines the typed content schemas.
- `src/styles/global.css` owns the visual tokens and shared component styles.

Run `npm run dev` for editing. Run `npm run verify`, `npm run build` and `npm run check:dev-tools` before handoff, then `npm run preview` to inspect the production output. Every content change needs a rebuild. `dist/` is the static site; no server adapter or database is used. No deployment is configured or performed.

The generated development styleguide URL returned 404 under the default slash policy during this run. Use `npm run fixtures:build` and `npm run fixtures:serve` for its isolated specimen output, `dist-fixtures/`; that output is deliberately nondeployable. Production builds exclude the styleguide and all fixture assets. See `audit/component-calibration.md` and `audit/browser-review.json` for actual local evidence.

The user supplied system fonts, warm light surfaces and forest green `#215846`. No external assets or generated claims are used. `AGENTS.md` records the art direction and maintenance ownership. No `SITE_URL` was supplied for this local-only assignment; canonical and other origin-dependent metadata stay omitted. If publishing later, set a real URL and serve `404.html` with status 404 without an SPA rewrite.
