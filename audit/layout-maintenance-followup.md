# Layout spacing setup and tooling follow-up

Scope authorized after the eight-phase refactor: finish direct baseline work and
optional bundle/test-harness improvements. Client adoption, cross-browser,
physical-device and manual accessibility acceptance are deferred by the user.

## Phase A — New-site setup language and choice

Complete: Standard and Express design handoffs explain layout spacing. The
initial shared/custom choice was refined by the persona pass below: Express
uses shared defaults; Standard asks only for a material unresolved choice.
Root and generated-profile instructions share that contract. CSS remains the
configuration source; `automatic-v2` remains only the compatibility API name.
The generator remains noninteractive. Existing decisions and autonomous design
authorization take precedence; this is not a new maintenance approval gate.

Terminology follows layout primitives/stacks, spacing tokens, CSS gap, fluid
spacing and flow spacing. No external-product references are in the setup flow.
Historical audit evidence and compatibility identifiers are retained.

Validation: `npm.cmd run verify:fast` passed (129 tests), followed by review of
both handoff paths and generated-profile instruction inheritance.

## Phase B — Local test reliability

Complete: all owned loopback harnesses use a shared dynamic/private-range port
allocator (49152–65535), with bounded occupied/excluded-port retries. SSR capture
keeps its 3.5-second default deadline. A child-process reservation cannot remove
the cross-process bind race; readiness/exit checks remain in force.

The root full suite runs all unit files with concurrency 2, then all rehearsal
files with concurrency 1. Fast local/CI checks use the same unit cap. No tests or
performance assertions were removed or relaxed. Collision/Fetch/readiness and
listener cleanup regression checks were added; root and EmDash inventory updated.

Validation: `npm.cmd run verify` passed 130 unit + 130 rehearsal tests, followed
by Astro checks. Targeted HTTP/migration checks retain cancellation, streaming
deadlines, resource limits and server teardown coverage. Log:
`.emdash/visual/layout-maintenance-verify.log`.

## Phase C — Editor/admin bundle investigation

Complete: `scripts/client-bundles.mjs` maps known named icon imports to the
installed package's public per-icon export subpaths. It reads actual exported
names, including renamed legacy aliases, preserves local names and type imports,
and leaves namespace/dynamic imports intact. Dependency files are not patched.
An entry-aware icon group keeps the full admin catalog out of the editor graph;
the ProseMirror dependency graph and warning thresholds are preserved.

`npm.cmd run build:analyze` writes local ignored JS graph/size evidence to
`.emdash/checks/client-bundles.json`. The inline editor's minified static JS
closure fell from **5,914,444 bytes / 6 chunks** to **965,056 bytes / 7 chunks**,
an **83.68% reduction**. The current summed per-chunk gzip estimate is 290,019
bytes. This excludes CSS, dynamic imports, headers, caching and actual browser
transfer. The upstream admin's initial static JS remains large (9,353,897 bytes
across 37 chunks; previously 9,604,762 across 13). Its largest chunk remains
3,644,681 bytes, and the build size advisory remains visible. Changing the
prebuilt upstream admin's internal feature boundaries is outside this baseline
optimization; suppressing its warning or generic size splitting is not a fix.

The built Node/SQLite rehearsal passed real editor selection/type/blur-save,
reload, UI publish, anonymous public output, nested lists, empty-field selection,
admin collection navigation and an uncommon custom icon (`acorn`, with its
rendered path matched against the installed package component). Fresh disposable
source/seed/session storage were used; no working content was changed. Cleanup
receipt confirms server stop, dependency-junction unlink and temporary-tree
removal. The first extended admin run encountered the real first-login welcome
dialog; the harness now dismisses it through its visible Get Started button.

Six regression tests cover named/renamed/type/unknown/namespace/dynamic imports,
unsupported package layouts, package resolution and static graph accounting
(shared dependencies, cycles, dynamic exclusions and compiled admin entry IDs).
See `docs/client-bundles.md` for the maintenance commands and scope.

Final timing calibration also identified the existing native Git/npm hook
lifecycle test in the unit file. Its two hook tests were moved unchanged into
the rehearsal tier; parser/doctor/port contracts stay in the unit tier. No
coverage was removed. A standalone unit run passed 134 tests in **7.68s**; the
local fast-CI command passed in **23.09s** against its unchanged 60-second limit
(its unit step was 8.15s, below the existing 10-second acceptance ceiling).
These are observed local timings, not a guarantee under external machine load.

## Phase D — Persona walkthrough and Express defaults

Complete: `audit/new-site-workflow-persona-pass.md` records five representative
journeys, eleven findings and their resolutions, discovery question groups,
conditional questions, Express defaults and four outcome walkthroughs. This is
a source-based reasoning pass, not interviews or usability-test evidence.

The skill and root/generated instructions implement those decisions: ask only
missing consequential questions, capture visitor/content/maintenance ownership,
record approved versus assumed choices, keep material integration/locale/launch
decisions explicit, and default technical choices in Express. Shared spacing
and brief-led density (balanced if unspecified) need no separate CSS-policy
question. Checkpoints are up to three decision bundles, not mandatory pauses.
Stock completion copy now requires actual coverage and limitations rather than
invented contrast counts or accessibility certification.

## Final verification receipt

Local Windows, Node 24.21.0, 2026-10-20:

- `npm.cmd run doctor`: critical checks passed; expected Windows launcher advisory.
- `npm.cmd run verify`: passed **134 unit + 132 rehearsal tests (266 total)**;
  47 Astro files, zero errors/warnings/hints. The fresh unit phase took 7.67s.
  Full log: `.emdash/visual/layout-final-verify.log`. A missing import introduced
  while moving the hook test was caught, fixed, then the full gate passed.
- `npm.cmd run build:analyze`: normal release build and isolation gate passed;
  report `.emdash/checks/client-bundles.json`, log
  `.emdash/visual/layout-final-build.log`. Size/graph evidence describes this root
  release artifact. Editor/admin behavior was verified separately in the owned
  disposable build using the same optimized configuration; its artifact hashes
  are not asserted to equal the root build's hashes.
- `npm.cmd run audit:html`: passed on the fresh release artifact, 9 HTML documents
  and 10 anonymous public responses. The original 3.5-second capture deadline,
  resource/body limits and teardown checks remain unchanged. Log:
  `.emdash/visual/layout-final-html.log`.
- `npm.cmd run check:ci-fast`: passed locally in 23.09s, below the unchanged 60s
  ceiling. This is local CI-command evidence, not an actual GitHub Actions run.
- `node tests/visual/editor-rehearsal.mjs`: actual built editor/admin journey and
  cleanup passed; `.emdash/visual/editor-rehearsal/receipt.json` and
  `.emdash/visual/layout-editor-rehearsal.log`.
- Named-import/graph and relocated hook regressions passed; final full verification
  also includes both groups. Generated-profile assembly, bounded inventory and
  preservation checks passed in the full suite. No new CMS dependencies are
  included in either static profile.

All authorized direct baseline changes and bounded optional improvements in this
follow-up are implemented. The upstream admin size advisory remains visible as
explained above. Cross-browser/device/manual accessibility acceptance, deployed
editing integrations, client adoption and deployment remain deferred. No push,
external client change or GitHub issue/PR was made. The previously policy-blocked
temporary folder from the earlier work remains outside the repository and was
not retried through a different cleanup mechanism. Unrelated audit documents
appearing during this work were preserved and excluded from these commits.
