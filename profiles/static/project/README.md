# Baseline static project

This project was assembled from an explicit Baseline allowlist. It uses native
Astro Content Collections, shared design tokens and primitives, and static output.
No database, React integration or server adapter is required. Read
`baseline.config.json` for the selected profile. `static-sveltia` adds a pinned
browser editor at `/admin/`; configure the new site's repository and authentication
with `docs/sveltia-cms.md` before using it. Pure `static` includes no admin assets.

```sh
npm install
npm run dev
npm run verify
npm run build
npm run check:dev-tools
npm run preview
```

The first install creates a project-specific `package-lock.json`; commit it and
use `npm ci` for subsequent clean installs. Dependency versions originate from
Baseline's canonical package definition. No source lockfile is copied from EmDash.

Edit `src/config/site.ts` for navigation and site identity, and
`src/content/posts/welcome.md` for sample content. Add Markdown posts to the same
collection. Required fields are title, description and publication date; hero
images require descriptive alt text. Drafts are excluded from both listings and
detail routes. Content changes require a successful rebuild and deployment.

Visit `/_styleguide` during development to calibrate the common components.
`npm run fixtures:build` and `npm run fixtures:serve` create an isolated static
specimen build in `dist-fixtures/`. The release checker rejects that artifact.
Normal production builds omit the styleguide route; configure static hosting to
serve `404.html` with status 404 for missing URLs, without an SPA fallback.

Set `SITE_URL` in the build environment to enable canonical URLs. Host the contents
of `dist/` on a static host. Astro's preview server is for local inspection.

`baseline.config.json` records the profile and base source commit.
`.baseline/managed-files.json` records source/output hashes and whether assembly
used an uncommitted source tree. These receipts are provenance, not certification
of future edits. Generated GitHub CI runs clean installs, token/art-direction checks,
tests, typecheck, static build and release checks. The first lockfile must be committed.

Use `npm run sync:baseline -- --ref <immutable-40-character-SHA>` to stage shared
component/token/tool/skill updates. Inspect `.baseline/updates/<SHA>/`, then use
`npm run sync:baseline -- --apply <SHA>` and verify. Local modifications are conflicts
for review; content, routes, settings, admin config and npm dependencies are excluded.
See `docs/baseline-updates.md`. The manual upstream workflow verifies a disposable
proposal and uploads a review artifact; it never pushes to the site repository.

Record browser acceptance and deployment ownership in project notes. The EmDash
database audit, site registry and Windows screenshot baseline commands are not
included in this profile.
