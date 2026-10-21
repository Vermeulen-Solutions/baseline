# Workshop continuation — actual work and acceptance

Completed 2026-10-21 in this trial's `site/` only. Used the written handoff and
saved project files; no other trial or parent-repository evidence was inspected.
No delegation, external writes, deployment, CMS or registration backend.

## Changes

- Added `src/pages/workshops/index.astro`: native `getCollection('workshops',
  ({ data }) => !data.draft)`, existing Base/Section/Container/Grid/Card components,
  h1/h2 structure, stable supplied-slug anchors, semantic `time datetime`, venue,
  exact summary and “Ask about a place” linking exactly to
  `mailto:hello@northline.example.test`. Includes an empty listing message.
- Added a Workshops link after Services in `src/config/site.ts`.
- Added `src/lib/workshop-presentation.ts` for ascending date/slug ordering and
  explicit-UTC English calendar-date display. Added two tests to the existing
  workshop schema suite for ordering and western/eastern build time zones.
- Scoped `overflow-wrap: anywhere` to the workshop listing after a real stress
  failure. Existing design tokens, layout primitives, schema, workshop content,
  slugs and other page copy remain unchanged.
- Updated AGENTS and appended the completed continuation to HANDOFF. Added
  actual layout-review evidence to `audit/component-calibration.md`.
- Saved `audit/workshops-acceptance.mjs` and PNG evidence. This production browser
  check is repeatable after a fresh build and local preview; it does not send email.

## Observed checks

Node v24.21.0 and the existing installed dependencies were used; no install or
package/lockfile changes. The art-direction `--require-record` gate passed before
visual edits. The existing Editorial Paper direction was preserved. Relevant
Astro collection filtering/sorting API documentation was checked via Astro Docs MCP.

- Final `npm.cmd run verify`: PASS, including script/template lint, layered CSS,
  art direction, unchanged token/contrast audits, all 44 tests and type checking.
  Astro: 0 errors, 0 warnings, four pre-existing unused-import hints in unchanged
  `contact.astro` and `services.astro`. No checks were removed or weakened.
- Final `npm.cmd run build`: PASS; eight output pages including `/workshops/` and
  404; native image optimization and existing postbuild release assertion pass.
- Final `npm.cmd run check:dev-tools`: PASS; no styleguide/fixture/server leakage.
- `git diff --check`: PASS (Git reports LF-to-CRLF notices on inherited files).
- Impeccable context loaded successfully. The mechanical detector returned `[]`
  on the page and navigation; repeated after the responsive fix with no findings.
- `node audit/workshops-acceptance.mjs`: PASS against fresh production output on
  local preview port 45882. At 320, 390, 768 and 1280 CSS pixels: one published
  workshop, exact title/date/venue/summary/email destination, one h1, no public
  form/script, no runtime page errors or document overflow, skip-link and email
  focus visibility, natural keyboard reachability, text spacing and 200% root
  text sizing. Navigation activation with Enter succeeds. Scans of emitted
  HTML/JS/JSON/XML/text find none of the supplied draft title, slug or summary.
- Existing `/`, `/services/`, `/about/`, `/contact/`, `/posts/`, `/posts/welcome/`
  return 200 at 390px with one h1, correct Workshops navigation and no overflow;
  the native post image loads with alt text. Both possible workshop detail URLs
  and production `/_styleguide/` return 404 as intended.
- Final page captures at all four widths were actually viewed. Relevant
  development styleguide layout captures at 390/768/1280px were actually viewed;
  no page overflow, five card specimens, automatic-v2 policy. Development workshop
  listing also excludes the draft. Final combined stress capture was viewed.

## Assumptions, friction and limits

Ascending date then slug was a handoff proposal, not a user-specified ordering;
it is recorded as an implementation assumption. Dates use en-GB display and
explicit UTC only to preserve their supplied calendar day; no time/time zone or
capacity is invented. No dates, titles, summaries, draft status or slugs changed.

The first preview request arrived before server readiness and failed connection;
the server became ready and subsequent requests passed. The first combined 320px
text-spacing plus 200% text check found overflow. The listing heading and a long
summary word were the cause; scoped inherited wrapping fixed the issue without
weakening the assertion. Final verify, build and all acceptance checks were rerun.

No discovery interview was restarted: the explicit continuation request and
settled handoff override the generic skill's context-init prompts. No new identity,
concept-selection exercise or PRODUCT.md was needed. Relevant incumbent components
were visually inspected before template work; the broader styleguide layout check
was performed after assembly and does not establish a prior full calibration.

Review used Chromium only, not Firefox/WebKit, assistive technology or a physical
device. 320px reflow and 200% root sizing were exercised; no claim of an actual
400% browser-zoom or complete accessibility conformance audit. The empty-list branch
was implemented but not exercised by changing the supplied content. Multiple-record
ordering was unit-tested rather than adding synthetic public content. Only the
existing supplied record was accepted visually. The email destination is a native
mailto link and was verified without launching a mail client or sending a message.
No hosting/canonical-URL/deployment acceptance is claimed.

Owned preview (45882) and development (45883) servers were stopped after acceptance.
The final production artifact is `site/dist/`, with development tooling excluded.
