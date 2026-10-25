# Command reference

[Back to Baseline](../README.md) · [Getting started](getting-started.md)

Run npm commands from the project that owns the work. This reference distinguishes
the root EmDash foundation from generated static projects. Read the installed
package.json: an unavailable CMS command is not a reason to add CMS dependencies
to a static site. In Windows PowerShell, use npm.cmd and npx.cmd.

## Everyday work

| Command | Scope | Purpose |
| --- | --- | --- |
| `npm run dev` | All profiles | Start Astro and print local development destinations |
| `npm run verify` | All profiles | Run the installed profile's complete verification suite |
| `npm run build` | All profiles | Build production output for the configured runtime |
| `npm run verify:fast` | Root EmDash | Lint, CSS/art-direction/token checks and the unit test tier |
| `npm run design:tokens` | All profiles | Audit colors, typography, fonts, fluid values and applicable editing bindings |
| `npm run test:design` | All profiles | Run the installed design-contract tests |
| `npm run typecheck` | All profiles | Astro/TypeScript diagnostics and applicable schema preflight |
| `npm test` | All profiles | Run the installed test suite |

In the root, full verify includes lint, CSS/art-direction/token checks, the full
test suite and typecheck. The test runner executes bounded unit tests followed by
sequential database, HTTP, importer and generated-project rehearsals.
`test:unit` and `test:rehearsal` select those tiers independently.
[CONTRIBUTING.md](../CONTRIBUTING.md) covers test classification, CI budgets and
maintainer acceptance; [engineering evidence](../audit/engineering-maintenance-plan.md)
records the measured scope.

Use `npm run design:tokens -- --init-client --lane <lane>` to initialize a real client
site. Read [art direction](art-direction-workflow.md) and the
[design framework](design-framework.md) before writing/calibrating tokens.

## Before handoff

For the root EmDash foundation:

```sh
npm run doctor
npm run verify
npm run build
npm run audit:html
```

audit:html checks emitted HTML and, where needed, captures linked public SSR
responses from the local production CMS. Missing published content or broken
navigation fails the audit. See [HTML integrity](html-integrity.md) for capture
limits and snapshot inspection. `npm run setup:hooks` installs the supplemental
local doctor/verify:fast pre-commit hook.

For generated static and static-sveltia projects:

```sh
npm run verify
npm run build
npm run check:dev-tools
```

check:dev-tools confirms that development styleguide/fixture markers are absent
from production output. Follow the generated site's README for its exact loop.
Deploy only verified production output; dist-fixtures/ is not deployable.

Review public routes, narrow reflow, keyboard focus, images and relevant editing
journeys in a browser. EmDash editing changes need actual typing/save/reload checks.
Sveltia handoff needs real authentication, upload, save, rebuild and sign-out.
Neither a green check nor a generated calibration record proves those observations.

## Discovery and diagnostics

| Command | Scope | Purpose |
| --- | --- | --- |
| `npm run doctor` | Root EmDash | Dependency-free Node/SQLite, shell and workspace preflight |
| `npm run baseline:inspect -- --json` | All profiles | Discover installed commands, entry points and declared core props |
| `npm run check:dev-tools` | All profiles | Check production development-tool isolation |
| `npm run build:analyze` | Root EmDash | Build and inspect client JavaScript ownership |
| `npm run start:local` | Root EmDash | Run the built Node artifact using the local .env |
| `npm run audit:site -- --root ../my-site` | Root EmDash tooling | Diagnose a downstream repository without changing it |

Doctor accepts `-- --json`; use `npm --silent run doctor -- --json` for JSON-only
output, or `node scripts/doctor.mjs --json` if npm itself cannot start.
It bounds its probes and may report unavailable observations rather than a failure.
NO_COLOR disables colored output. Inspection is optional, source-derived discovery
with [declared pilot limits](project-inspection.md). See also
[client bundle maintenance](client-bundles.md) and [downstream audits](site-standards-audit.md).

## Image preparation

| Command | Profiles | Purpose |
| --- | --- | --- |
| `npm run media:prepare -- --source <file-or-directory> --out <ignored-stage>` | All | Prepare stored image copies locally for greenfield builds or day-2 maintenance |
| `npm run media:upload -- --stage <stage> --url <origin> --metadata <file>` | EmDash | Upload eligible prepared files and verify stored bytes/metadata with a destination-bound receipt |

See [media preparation](media-preparation.md) for presets, per-file exceptions,
profile-specific staging, editorial metadata and interrupted-upload recovery.

## CMS schema and migrations

These commands belong to the root EmDash tooling, not generated static sites.

| Command | Purpose |
| --- | --- |
| `npm run check:schema-budget` | Measure physical collection width before build/typecheck |
| `npm run db:diff` | Compare offline SQLite/D1 schema parity and column budgets |
| `npm run media:migrate-wp` | Prepare/import WordPress media and stage media storage operations |
| `npm run migration:verify -- --manifest <file>` | Collect bounded HTTP observations and reconcile offline inventories |
| `npm run rehearse:importer` | Rehearse WordPress importer fidelity against synthetic fixtures |

Read the [database workflow](database-workflow.md), [image delivery](image-delivery.md),
[migration acceptance contract](migration-acceptance.md) and
[importer fidelity matrix](importer-fidelity-matrix.md) before using their operations.
Database/media writes and production migration remain separately scoped tasks.
CMS content API/MCP setup and scoped local-token help are documented in
[agent configuration](agent-documentation.md).

## Visual regression and maintenance

`npm run test:visual` uses the pinned local Windows renderer and reviewed image
references. Follow [visual regression](visual-regression.md); screenshot comparisons
do not run in automated CI or production builds.

Root `npm run check:ci-fast` measures the fast checks plus a normal build/release
gate, enforces the 60-second budget and writes .emdash/checks/ci-fast.{json,log}.
`npm run test:profiles` independently installs/verifies/builds/HTTP-checks both
generated static profiles. These are maintainer tools rather than generated-site
delivery prerequisites.

For dependency proposals, `npm run check:upstream` reviews available framework,
adapter, EmDash and Node updates. Source updates for static sites use
sync:baseline with an immutable reference. Skill updates are deliberate staged
operations, not routine new-clone setup. Follow
[reviewed upstream maintenance](automated-upstream-updates.md),
[Baseline updates](baseline-updates.md) and [skill synchronization](skill-synchronization.md).
