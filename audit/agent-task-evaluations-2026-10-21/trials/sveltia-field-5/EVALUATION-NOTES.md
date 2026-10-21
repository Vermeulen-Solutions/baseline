# Sveltia reading-time evaluation

Completed locally on 2026-10-21 in `site/`, a generated `static-sveltia` publication
using Astro 7.4.0 and pinned Sveltia 0.248.0. No deployment or live GitHub/Sveltia
account was used. No delegation or inspection of other trial evidence occurred.

## Requested result and actual changes

- Added optional `readingTime` to `src/content.config.ts` with the actual Zod
  contract `z.number().int().min(1).max(60).optional()`.
- Added the matching Sveltia Number field with `value_type: int`, `min: 1`,
  `max: 60`, `step: 1`, `required: false`, an explanatory label/hint and no default.
  Preserved the existing `omit_empty_optional_fields: true` policy.
- Article detail headers conditionally show `<value> min read`. An omitted field
  adds no element or blank label. Existing typography and spacing own presentation;
  no CSS, tokens, primitives, site identity or navigation were changed.
- Added `field-notes.md` and `practice-update.md` with exactly the supplied titles,
  descriptions, dates and body copy. Both explicitly have `draft: false`. Only
  Field notes has `readingTime: 5`; Practice update omits the field entirely.
- Preserved Welcome and all existing content. Updated the exact Sveltia field-set
  regression assertion to include the new field, retaining every original check,
  and added number/optional/range assertions. Added `tests/reading-time.test.mjs`
  to exercise the real post schema through Astro's published config implementation.
- Documented the contract in `docs/sveltia-cms.md` and `AGENTS.md`.

## Instructions and assumptions

Read the local AGENTS, README, profile, Sveltia guide and applicable checked-in
Astro design skill. Used the existing Art Direction Record, which passed
`check:art-direction -- --require-record` before the template edit. This was a
scoped content extension, not a new site or redesign; retained the incumbent
automatic-v2 spacing and editorial-paper system without token recalibration or
broad page assembly. Used Impeccable context/craft-floor and a bounded direct
rendered review; its context tool explicitly allowed scoped existing work.

The user did not prescribe a machine field name; `readingTime` was selected. Minutes
are editor-entered, not calculated from the short sample bodies. The filename
provides each requested slug through the existing native glob loader. Omission
is the persisted empty representation, matching the installed Sveltia output
policy; no older-article backfill or invented default was added.

Verified current native collection schema guidance with the configured Astro
Docs MCP and number-field semantics against the official Sveltia documentation:

- https://docs.astro.build/en/guides/content-collections/#defining-the-collection-schema
- https://sveltiacms.app/en/docs/fields/number

## Checks and results

- `npm.cmd run check:art-direction -- --require-record`: PASS before implementation.
- `npm.cmd run verify`: PASS. Script syntax, Astro accessibility lint, CSS contracts,
  changed-source art direction and design-token audits passed; all **42 tests**
  passed. Astro type checking reported **0 errors, 0 warnings, 4 hints**: existing
  unused Card/Grid imports in Services and Contact, outside the requested scope.
- The real schema accepts omission and integers 1, 5, 60. Regression tests reject
  -1, 0, 61, 1.5, NaN, Infinity, numeric strings, empty strings, null and booleans.
- Impeccable detector on the changed article template returned `[]`.
- `npm.cmd run build`: PASS; 9 static pages, both sample routes, preserved Welcome,
  and three optimized native image sizes. Postbuild release profile check passed.
- `npm.cmd run check:dev-tools`: PASS; production excludes styleguide routes,
  fixture specimens and server entrypoints.
- `git diff --check`: PASS. Reviewed the changed paths; existing site settings,
  navigation, Welcome, tokens, primitive components and unrelated field contracts
  remain untouched.
- Ran owned Astro preview on `http://127.0.0.1:4455/` against that fresh `dist/`.
  `browser-acceptance.mjs` passed 12 article/viewport checks: Field notes, Practice
  update and Welcome at **320, 390, 768 and 1440 CSS pixels**. Checked status 200,
  correct titles, dates and bodies, expected presence/absence of reading labels,
  no empty metadata paragraph, and no horizontal overflow.
- Checked all three post links in the listing, status 200 for Home/About/Services/
  Contact, successful native Welcome image loading with alt text, visible keyboard
  focus on the skip link and working Enter transfer to the main landmark. No
  browser page errors. Visually inspected full-page captures of Field notes at
  every width, Practice update at 320 and Welcome at 390; the new label fits the
  existing article rhythm and missing-value layouts have no empty metadata row.
- Preview was stopped through its owned execution session. Confirmed no listener
  remains on port 4455. The browser context closes in a `finally` block.

Evidence: `verify.log`, `build.log`, `dev-tools.log`, `browser.log`,
`evidence/browser-results.json` and full-page screenshots under `evidence/`.
The standalone browser script and evidence stay at trial root, outside site source.

## Friction and acceptance boundary

- The static instructions correctly avoided EmDash operations and unavailable CMS
  tools. The exact field-set test needed an intentional update for the feature;
  its previous checks were retained rather than bypassed.
- Node 24.21.0 and installed dependencies were usable. Initial Astro command startup
  was slow. The first browser attempt got connection refused before preview's
  ready message; after confirming its listener, the retry used the exact printed
  IPv4 address and passed. This was a local acceptance-run startup issue.
- The Impeccable context tool reports missing PRODUCT.md but explicitly permits
  narrow work on an incumbent implementation; no unrelated documentation setup
  or design interview was introduced. No full independent/subagent critique is
  claimed, consistent with the explicit no-delegation boundary.
- Explicit authored files, evidence, test temp directories, later npm cache,
  Impeccable cache and browser profile were directed inside the trial. The initial
  npm art-direction command preceded npm-cache redirection; npm-owned global
  bookkeeping was not audited, so strict process-level write isolation is not
  claimed. No intentional external file mutation was performed.
- Acceptance covers paired local configuration, real schema validation, successful
  static output and rendered public behavior. Real Sveltia sign-in, editing/saving
  through GitHub, rebuild automation, deployment and logout were **not tested**;
  no account or deployment was available or needed for this task. Preserve that
  distinction before a future credentialed editor handoff.
