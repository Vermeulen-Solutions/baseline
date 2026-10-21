# Workshop feature handoff — 2026-10-21

This update records source inspection and next steps only. No application source,
dependencies, configuration, design records or durable client context were changed.
No tests, build, browser review, client acceptance or deployment were performed.

## Established need and decisions

The [adopted brief](PROJECT.md) defines practical workshops for team leads at small
local organizations, with a workshop index and detail pages in one English locale.
The [2026-10-19 decision note](audit/brief-decision.md) confirms developer-owned
static editing and email registration at
`mailto:workshops@northline.example.test`. Preserve that endpoint. The studio editor
supplies workshop copy; the site maintainer owns code, build and deployment.

The earlier handoff's pending-platform, EmDash-installation and rediscovery steps
are obsolete: the later decision note, `baseline.config.json` and
`astro.config.mjs` agree on native Astro static output. No browser CMS or payment
integration is in scope. No launch date or external deployment is approved;
quarterly publication remains an assumption. These distinctions remain owned by
the brief and decision note, rather than being new approvals in this handoff.

## Current implementation

- [Schema](src/content.config.ts): a native `glob`-loaded `workshops` collection
  with required `title`, coerced `date`, and `draft` defaulting to `false`.
- [Supplied workshop](src/content/workshops/clear-briefs.md): “Clear project briefs”,
  dated `2026-11-12`, `draft: false`; body: “Leave with a clear brief and manageable
  next steps.” Preserve these supplied values and copy. The workshop date is not a
  launch deadline or evidence of client acceptance.
- [Current page](src/pages/index.astro): only `<h1>Northline workshops</h1>`.
  No workshop listing, detail template, registration link or route-generation
  logic exists in the inspected source.
- The selected visual direction is recorded in [AGENTS.md](AGENTS.md), including
  Editorial Paper and balanced density. Its presence does not prove approval,
  a passing art-direction gate or component calibration.
- [CSS](src/styles/global.css) owns the implemented fluid grid gap,
  `clamp(1rem, 0.5rem + 2vi, 2.25rem)`, with `--layout-grid-gap` referencing it.
  [DESIGN.md](DESIGN.md) explicitly labels its fixed 32px gap and EmDash note as
  an unselected older concept; neither supersedes current CSS or platform evidence.

## Remaining work and next local action

The next concrete local preparation is to map the existing entry to a small static
route plan: proposed `/workshops/` listing and `/workshops/[id]/` detail archetypes,
using the collection entry ID for links. These URLs are implementation proposals,
not an already approved or implemented route inventory. Keep the root page and
its navigation role explicit when preparing that plan; no route removal or rename
is requested. Existing brief and registration decisions are sufficient for this
preparation, so no customer rediscovery or permission checkpoint is needed.

For subsequent implementation, exclude drafts from both the listing and detail
`getStaticPaths()`, use native `render()` and the shared RichText wrapper for the
Markdown body, and link registration to the exact mailto endpoint above. Wire
navigation and metadata consistently. Preserve the supplied entry rather than
inventing schedules, payment behavior or replacement workshop copy.

Before visual template work, verify the saved Art Direction Record with the
repository gate and complete component calibration using the established tokens
and shared primitives. No calibration record or evidence was present in this
fixture. Shared responsive spacing remains the starting approach; the old concept
snapshot does not authorize fixed-gap overrides.

This fixture also has no `package.json`, lockfile, local check scripts or shared
layout/component sources. In the implementation checkout, first inspect the
available static-profile tooling and primitives before running its documented
checks or assembling templates. Do not install EmDash to resolve these omissions.
After implementation, run the available prescribed verification/build/release
checks, then inspect route coverage, draft behavior, registration links, keyboard
focus and responsive layouts. Record actual results and pending acceptance;
deployment remains a separate action requiring applicable authorization.

No questions are needed to complete this handoff or the route-planning step.
Launch date, cadence confirmation and hosting/release details may remain deferred
until work depends on them. This request ends at the handoff; implementation and
external actions have not been undertaken.
