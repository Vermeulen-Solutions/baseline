# Workshops continuation — evaluation B

Completed locally on 2026-10-21, from `site/HANDOFF.md` and the saved project.
Work stayed within this assigned trial directory. No other trial or parent
repository evidence was inspected. No deployment, external write, registration,
CMS/backend work, commit or delegation was performed.

## Actual changes

- Added `site/src/pages/workshops.astro`, using the established Base, Section,
  Container and collection-list/item styles. It queries the typed native
  collection with `!data.draft` in development and production.
- Public entry: **Clear project briefs**, anchor `clear-project-briefs`,
  **12 November 2026**, **Northline Studio**, unchanged supplied summary and
  **Ask about a place** linking exactly to
  `mailto:hello@northline.example.test`.
- Explicit UTC date formatting and date-only `datetime` preserve authored
  calendar days. Date is not a publication filter.
- Added Workshops to the shared navigation in `site/src/config/site.ts`.
  No workshop detail routes were introduced; existing slugs and content files
  remain unchanged.
- Updated the workshop scope record in `site/AGENTS.md`, retaining the original
  handoff as content-stage history. Recorded scoped calibration evidence in
  `site/audit/component-calibration.md`.
- Added four production-output regression checks in
  `site/tests/workshops-output.mjs`. They inspect actual emitted HTML for public
  content/draft exclusion, date/venue, enquiry/navigation and the exact route
  inventory. `test:workshops` runs from `postbuild` after the retained release
  artifact check. No existing check, test or gate was removed, disabled or weakened.
- Added the reproducible trial-level `responsive-review.mjs`, its successful
  `responsive-review-results.json` report, and screenshots listed below.

## Actual verification results

- Pre-write `npm.cmd run check:art-direction -- --require-record`: PASS using
  the already saved Editorial Paper record. No discovery restart, invented
  client approval, token recalibration or design replacement occurred.
- `npm.cmd run verify`: PASS after correcting one redundant `role="list"`
  reported by the existing accessibility linter. Script/template lint, CSS
  contract check (28 inputs), art-direction gate, token audit, all **39/39**
  installed tests and Astro check passed. Typecheck: **0 errors, 0 warnings,
  4 existing unused-import hints** in unchanged contact/services pages.
- Fresh final `npm.cmd run build` with `TZ=America/Los_Angeles`: PASS. Exactly
  eight HTML pages emitted, preserving the previous seven and adding workshops.
  Retained release artifact check: PASS. New output acceptance: **4/4 PASS**.
  Despite the US Pacific timezone, the workshop displays 12 November 2026.
- `npm.cmd run check:dev-tools`: PASS; production contains no styleguide,
  fixture specimens or server entrypoint.
- Impeccable mechanical detector over the changed page/navigation: `[]`, no
  findings. This is a mechanical result, not design or accessibility certification.
- `git diff --check`: PASS. Prior content-stage changes and handoff were
  preserved; the trial remains uncommitted.

## Rendered acceptance

Local production preview used `127.0.0.1:4382`; development used
`127.0.0.1:4381`. Final review ran in Chromium **156.0.8078.4**, with JavaScript
disabled and browser timezone America/Los_Angeles. See
`responsive-review-results.json` for exact widths, focus order, geometry and HTTP
statuses.

- Visually inspected the complete workshops page at **320, 390, 768, 1440px**.
  No horizontal document overflow; heading, date, venue, summary and email action
  remain readable. Header wraps naturally at narrow widths. Existing editorial
  colors, serif headings, spacing and footer were retained.
- Actual Tab input at all four widths reached skip link, brand, navigation and
  the email action in natural order. The focus report records solid 3px outlines;
  the email action was within the viewport. The 390px focus screenshot was also
  visually inspected.
- Visually inspected **200% root text size at 1280px**; no horizontal overflow or
  lost workshop information. The 320px viewport supplies a separate narrow
  reflow check; actual browser UI zoom was not exercised.
- All seven linked public routes returned HTTP 200. Clicking Workshops from the
  homepage reached `/workshops/`. Production `/_styleguide/` and both unrequested
  workshop detail URLs returned HTTP 404.
- Production and development each showed exactly one workshop and excluded
  Winter planning clinic. The output checks also scanned every emitted HTML
  page for the draft title, slug and summary.
- Before implementation, inspected `/services/` and the real `/_styleguide/`
  specimens at 390/768/1440px. Styleguide document overflow was absent. This
  inherited-layout review was scoped to the components and typography used;
  it does not certify every styleguide interaction.
- Browser report contains no page errors. The mail action destination was
  verified without opening an email client or sending a message.

Captures at trial root: `services-before.png`,
`styleguide-390.png`, `styleguide-768.png`, `styleguide-1440.png`,
`workshops-320.png`, `workshops-390.png`, `workshops-768.png`,
`workshops-1440.png`, `workshops-keyboard-390.png`, `workshops-text-200.png`.

## Assumptions, friction and limits

- Ascending date order with a slug tie-break adopts the handoff recommendation;
  it was not presented as a newly approved user requirement. The listing stays
  simple, with no detail routes or inferred booking capacity/time information.
- Existing shared responsive spacing and English editorial design are settled
  project inputs. No repeated brief questions were necessary.
- The Impeccable context launch interpreted the route target `/workshops/` as a
  filesystem path and reported missing context. Actual project instructions,
  saved art-direction record, tokens, code and local render supplied the authority.
  Its generic setup prompts did not override the user's instruction to continue
  the agreed brief without rediscovery.
- One early browser attempt occurred before Astro was ready and failed with
  connection refused; subsequent requests waited for server readiness.
- Under the installed trailing-slash policy, slashless `/_styleguide` returned
  the site's 404 page. Retried `/_styleguide/` returned 200 with the real heading;
  the initial 404 captures were replaced and were not claimed as calibration.
- The first responsive script run stalled while injecting a style element in
  the JavaScript-disabled context. It was interrupted, changed to direct DOM
  root font-size assignment, given bounded locator timeouts and rerun completely.
  Only the successful final run is recorded as browser acceptance.
- Browser coverage is local Chromium only, without assistive-technology or
  cross-browser testing, a complete WCAG audit, or a real mail client. The
  empty-list message is implemented but was not exercised by altering agreed
  content; no multiple-public-entry or hostile-content stress fixture was added.
- Regression expectations deliberately describe the supplied fixture and route
  inventory; future authorized content/route changes must update those specific
  expectations while retaining draft privacy and existing gates.
- Owned development and preview servers were stopped after acceptance; the
  port shutdown check is recorded in the completion report.
