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

Use the **Component calibration** path printed by `npm run dev` on Astro's local
origin to calibrate the common components. With the default routing policy this
is `/_styleguide/`, including the trailing slash; `/_styleguide` returns 404.
The printed path also follows a configured base or `trailingSlash: 'never'`.
`npm run fixtures:build` and `npm run fixtures:serve` create an isolated static
specimen build in `dist-fixtures/`; open the same canonical path on its local
origin (normally `http://127.0.0.1:4349`). The release checker rejects that artifact.
Normal production builds omit the styleguide route; configure static hosting to
serve `404.html` with status 404 for missing URLs, without an SPA fallback.

Set `SITE_URL` in the build environment to enable public canonical, social and
structured-data URLs. Without it, URL-dependent metadata is omitted rather than
using the build/preview hostname. `src/config/routing.ts` supplies Astro and the
metadata resolver with one base/slash/output policy; its default is directory
output with trailing slashes. `Base.astro` supplies the sole static metadata
renderer through the shared shell's head slot. Posts use their real publication
date and native hero; missing author/update fields stay absent. No editorial
schema changes or public JavaScript are required. Metadata tests run in `verify`;
`parse5` is a development-only parser dependency.

Host the contents of `dist/` on a static host. Astro's preview server is for local inspection.

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

Generator 0.4.0 includes per-platform metadata, native Disclosure/Cluster/Sidebar,
Astro accessibility lint and fluid-token diagnostics. Existing sites need explicit
additions before adopting dependent shared files; sync does not install packages,
add scripts or expand managed membership. See
`docs/architecture-hardening-upgrade.md` and its reviewed example patch. Preserve
the site's original provenance, calibrated tokens, Base/navigation and admin config.

Record browser acceptance and deployment ownership in project notes. The EmDash
database audit, site registry and Windows screenshot baseline commands are not
included in this profile.

Template verification requires Node `^22.22.3 || ^24.16.0 || >=26.3.0` (Node 24 LTS recommended). Run `npm run lint:templates` for Astro accessibility checks; `npm run verify` also retains script syntax, tokens, tests and type checking.
