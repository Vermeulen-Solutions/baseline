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

In progress: measure actual module ownership and delivery, then make bounded
changes that preserve dependency initialization and editor behavior. Never
hide the size advisory or reinstate the generic vendor split that broke editing.

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
