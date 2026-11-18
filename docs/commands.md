# Command reference

[Back to Baseline](../README.md) · [Getting started](getting-started.md)

Run npm commands from the project that owns the work. This reference distinguishes the root EmDash foundation from generated static projects. Read the installed package.json: an unavailable CMS command is not a reason to add CMS dependencies to a static site. In Windows PowerShell, use npm.cmd and npx.cmd.

## Everyday work

| Command | Scope | Purpose |
| --- | --- | --- |
| `npm run dev` | All profiles | Start Astro and print local development destinations |
| `npm run verify` | All profiles | Run the installed profile's complete verification suite |
| `npm run build` | All profiles | Build production output for the configured runtime |
| `npm run verify:fast` | Root EmDash | Lint, CSS/art-direction/token checks and the unit test tier |
| `npm run design:tokens` | All profiles | Audit colors, typography, fonts, fluid values and applicable editing bindings |
| `npm run design:canvas-kit` | All profiles | Extract source tokens and semantic previews for OpenDesign, OpenPencil, or Penpot ([canvas kit](canvas-kit.md)) |
| `npm run design:artifact-check` | All profiles, when installed | Opt-in source preflight for current HTML concepts/exports, without OpenDesign ([artifact lint](artifact-lint.md)) |
| `npm run search:index` | All profiles, when search is configured | Optional post-build Pagefind index of public HTML; needs an exact `pagefind` devDependency ([site search](search.md)) |
| `npm run test:design` | All profiles | Run the installed design-contract tests |
| `npm run typecheck` | All profiles | Astro/TypeScript diagnostics and applicable schema preflight |
| `npm test` | All profiles | Run the installed test suite |

In the root, full verify includes lint, CSS/art-direction/token checks, the full test suite and typecheck. The test runner executes bounded unit tests followed by sequential database, HTTP, importer and generated-project rehearsals. `test:unit` and `test:rehearsal` select those tiers independently. [CONTRIBUTING.md](../CONTRIBUTING.md) covers test classification, CI budgets and maintainer acceptance; [engineering evidence](../audit/engineering-maintenance-plan.md) records the measured scope.

Use `npm run design:tokens -- --init-client --lane <lane>` to initialize a real client site. It also applies the strict theme: Tailwind's default colour, type-size, radius and shadow namespaces are cleared at the top of `@theme` so only the site's tokens compile. An existing site adopts it on its own with `npm run design:tokens -- --strict-theme --write`, after `npm run check:css -- --guardrails` shows it uses none of those defaults. Read [art direction](art-direction-workflow.md) and the [design framework](design-framework.md) before writing/calibrating tokens.

`design:tokens -- --json` includes `fontLoading.preflight` with bounded local reference/case/format checks, role mappings and unresolved-source advice. See [font preflight](font-preflight.md); static source validation does not replace actual rendered-font readback. For a scoped design change, omit `--write` to preview the candidate, then review the exact CSS change and apply the same arguments. The installed `site-art-direction/references/token-handoff.md` describes this handoff without a new importer.

## Before handoff

For the root EmDash foundation:

```sh
npm run doctor
npm run verify
npm run build
npm run audit:html
npm run check:dev-tools
```

audit:html checks emitted HTML and, where needed, captures linked public SSR responses from the local production CMS. Missing published content or broken navigation fails the audit. See [HTML integrity](html-integrity.md) for capture limits and snapshot inspection. `npm run setup:hooks` installs the supplemental local doctor/verify:fast pre-commit hook.

For generated static and static-sveltia projects:

```sh
npm run verify
npm run build
npm run check:dev-tools
```

check:dev-tools confirms that development styleguide/fixture markers are absent from production output. Follow the generated site's README for its exact loop. Deploy only verified production output; dist-fixtures/ is not deployable.

Review public routes, narrow reflow, keyboard focus, images and relevant editing journeys in a browser. EmDash editing changes need actual typing/save/reload checks. Sveltia handoff needs real authentication, upload, save, rebuild and sign-out. Neither a green check nor a generated calibration record proves those observations.

For the root maintainer's disposable workflow pilot, `npm run rehearse:workflow` exercises fictional owner tasks, collection loops and shared components using the existing local Windows visual helper. It is not installed in generated static projects, CI or production builds. `-- --hold` leaves the owned temporary server available for read-only inspection/page evidence until its report-directory stop file is created. Keep raw receipts under ignored local report paths; no root CMS content is changed.

## Discovery and diagnostics

| Command | Scope | Purpose |
| --- | --- | --- |
| `npm run doctor` | Root EmDash | Dependency-free Node/SQLite, shell and workspace preflight; warns about files Baseline has retired |
| `npm run baseline:inspect -- --json` | All profiles | Discover installed commands, entry points and declared core props |
| `npm run baseline:inspect -- --structure --json` | All profiles, when installed | Inspect bounded source relationships and repeated-render observations; runtime behavior remains unverified |
| `npm run audit:page -- --url <loopback-public-url> --out <fresh-report-directory>` | All profiles, opt-in local | Record controlled public-page loading/resource and rendered-font evidence ([scope](page-performance.md)) |
| `npm run check:docs` | Root EmDash | Check documentation Markdown files for unwrapped paragraph formatting |
| `npm run check:dev-tools` | All profiles | Check production development-tool isolation |
| `npm run build:analyze` | Root EmDash | Build and inspect client JavaScript ownership |
| `npm run start:local` | Root EmDash | Run the built Node artifact using the local .env |
| `npm run audit:site -- --root ../my-site` | Root EmDash tooling | Diagnose an older npm- or pnpm-based downstream repository without changing it |
| `npm run audit:modern-web -- [path]` | Root EmDash tooling, opt-in | Advisory scan for legacy web patterns using a pinned `modern-web-guidance`, with telemetry off; needs network on first run, never a gate. Review findings against `astro-site-design/references/native-platform.md` |

Doctor accepts `-- --json`; use `npm --silent run doctor -- --json` for JSON-only output, or `node scripts/doctor.mjs --json` if npm itself cannot start. It bounds its probes and may report unavailable observations rather than a failure. NO_COLOR disables colored output. Inspection is optional, source-derived discovery with [declared pilot limits](project-inspection.md). See also [client bundle maintenance](client-bundles.md) and [downstream audits](site-standards-audit.md).

## WordPress source capture and conversion

`npm run migration:wordpress -- --help` is available on all new profiles. Use `probe` or `capture` for the first-party WordPress exporter/WXR source, `assess` for source/field coverage and optional Elementor kit inspection, `plan` for the installed profile's output, and `apply` for a reviewed static plan. `acceptance` generates a reviewed manifest/checklist for the shared `migration:verify` engine. Supply migration credentials privately through the environment. See [dashboard migration](wordpress-migration.md) for output directories, conflict preservation, media handling, native EmDash handoff and existing-site adoption.

## Image preparation commands

| Command | Profiles | Purpose |
| --- | --- | --- |
| `npm run media:prepare -- --source <file-or-directory> --out <ignored-stage>` | All | Prepare stored image copies locally for greenfield builds or day-2 maintenance |
| `npm run media:upload -- --stage <stage> --url <origin> --metadata <file>` | EmDash | Upload eligible prepared files and verify stored bytes/metadata with a destination-bound receipt |

See [media preparation](media-preparation.md) for presets, per-file exceptions, profile-specific staging, editorial metadata and interrupted-upload recovery.

## CMS schema and migrations

These commands belong to the root EmDash tooling, not generated static sites.

| Command | Purpose |
| --- | --- |
| `npm run check:schema-budget` | Measure physical collection width before build/typecheck |
| `npm run db:diff` | Compare offline SQLite/D1 schema parity and column budgets |
| `npm run migration:check-library -- --help` | Compare supplied native media/folder/link readbacks with reviewed expectations |
| `npm run migration:check-editorial -- --help` | Flag suspicious Portable Text/HTML structure and changed wording without rewriting prose |
| `npm run db:check-backup -- --help` | Check an existing Node snapshot against the configured source and reviewed native inventory; never creates a database |
| `npm run check:hosted-auth -- --help` | Probe reviewed EmDash 1.3.0/1.4.0/1.5.0 session/validation guards with no credentials before owner setup |
| `npm run media:migrate-wp` | Prepare/import WordPress media and stage media storage operations |
| `npm run rehearse:importer` | Rehearse WordPress importer fidelity against synthetic fixtures |

Read the [database workflow](database-workflow.md), [image delivery](image-delivery.md), [migration acceptance contract](migration-acceptance.md) and [importer fidelity matrix](importer-fidelity-matrix.md) before using their operations. Database/media writes and production migration remain separately scoped tasks. CMS content API/MCP setup and scoped local-token help are documented in [agent configuration](agent-documentation.md).

The backup/authentication checks are EmDash-only opt-in commands; they do not certify content equality, a restore drill or a successful owner login. Read `docs/release-trust.md` in the EmDash foundation for supported inputs and remaining acceptance. Generated static sites omit that CMS-only runbook and these commands.

## Visual regression and maintenance

Root `npm run rehearse:tokens` is an explicit local Windows rehearsal of a synthetic HTML/CSS canvas mapping through existing token preview/apply, native styleguide calibration and production-before/after route comparisons. It owns disposable CMS source copies with fresh seed data and a dependency junction, writes ignored `.emdash/visual/` evidence and cleans up its instances. It is maintainer-only, refuses CI and does not join ordinary verification/build or generated-site commands. It does not claim external-canvas integration, independent installation or human design approval.

`npm run test:visual` uses the pinned local Windows renderer and reviewed image references. Follow [visual regression](visual-regression.md); screenshot comparisons do not run in automated CI or production builds. `npm run check:cache` is the explicit local production cache/build rehearsal for the Node foundation; it refuses CI/GitHub Actions and does not certify Workers cache. When a shell exports `CI=true`, unset it for that local run rather than weakening the guard.

Root `npm run check:ci-fast` measures the fast checks plus a normal build/release gate, enforces the 60-second budget and writes .emdash/checks/ci-fast.{json,log}. It includes the documentation format check, and when a step fails it prints the end of that step's output and names the steps that did not run. `npm run test:profiles` independently installs/verifies/builds/HTTP-checks both generated static profiles. These are maintainer tools rather than generated-site delivery prerequisites.

For dependency proposals, `npm run check:upstream` reviews available framework, adapter, EmDash and Node updates. Source updates for static sites use sync:baseline with an immutable reference. Skill updates are deliberate staged operations, not routine new-clone setup. Follow [reviewed upstream maintenance](automated-upstream-updates.md), [Baseline updates](baseline-updates.md) and [skill synchronization](skill-synchronization.md).

## Further commands

Commands that the workflow and skills name but the sections above do not. Scope says where a command exists: "Root tooling" runs from a Baseline checkout, usually against another site or origin, and does not ship in generated sites. A site generated before a command was added needs the reviewed adoption in [Baseline updates](baseline-updates.md) before it has it.

### Design and review

| Command | Scope | Purpose |
| --- | --- | --- |
| `npm run check:art-direction` | All profiles | Art-direction gate: validates the record in `AGENTS.md` for changed visual source; `-- --require-record` before site-specific visual work ([art direction](art-direction-workflow.md)) |
| `npm run design:prompt-check -- <file>` | All profiles | Preflight an external design prompt before it informs a concept |
| `npm run design:watch -- --dir <folder>` | All profiles | Open changed top-level concept HTML files; a file opener, not a live-reload server |
| `npm run design:canvas-check` | Root tooling | Check Claude Design canvas boards locally before upload |
| `npm run audit:ui -- --base <origin> --routes <list>` | All profiles, against any origin; needs a local Chromium | Rendered UI audit: off-screen and squeezed text, enlarged phone text, contrast, hover states, clipped and cover-cropped images, decorations touching content and stacked empty bands; `--widths auto` adds widths around the site's own breakpoints |
| `npm run capture:routes -- --base <origin> --routes <list> --out <dir>` | All profiles, against any origin; needs a local Chromium | Before/after full-page and viewport captures, optionally with a concept CSS overlay |
| `npm run record:motion` | Root tooling | Record a real route with headless Chromium as a GIF for image-only review surfaces |
| `npm run cms:admin-metadata -- --base <origin> --plan <file>` | Root EmDash | Print, then with `--apply` write and read back, reviewed admin metadata: field widgets, labels, added select options, list columns, quick create ([editor experience](editor-experience.md)) |
| `npm run audit:cms-roundtrip` | Root tooling, disposable EmDash copy only | Check edit targets, save, publish and public reload without touching real content |
| `npm run fixtures:build` / `fixtures:serve` | All profiles | Build and serve isolated styleguide fixtures ([styleguide fixtures](styleguide-fixtures.md)); never deploy the output |
| `npm run test:visual:update` / `test:visual:sensitivity` / `test:visual:functional` | Root EmDash, local Windows | Update reviewed screenshots explicitly, prove the comparison detects a change, and run functional browser checks ([visual regression](visual-regression.md)) |
| `npm run check:visual-cleanup` | Root EmDash | Confirm the visual harness left no owned processes or temporary state behind |

### Checks and build helpers

| Command | Scope | Purpose |
| --- | --- | --- |
| `npm run lint:scripts` / `lint:templates` / `check:css` | All profiles | Script syntax, Astro template accessibility lint and CSS layer/spacing contracts; all part of `verify`. `check:css` also prints advisory token guardrails (Tailwind default palette, type, radius and shadow utilities, numeric spacing and arbitrary-value classes, raw `gap` props, and raw colour, ≥1rem spacing and z-index values outside token definitions); `-- --guardrails` lists every finding, `-- --strict-guardrails` fails on them |
| `npm run check:release-artifact` | All profiles | Confirm the build output matches the configured profile; also runs automatically after `build` (`postbuild`) and before `start` (`prestart`, `prestart:local`) |
| `npm run build:timings` | All profiles | Build with Astro timing output |
| `npm run check:native-images` | Root EmDash, Node with local media | Disposable fixture check of responsive image output, including media uploaded after the build; needs port 4332 |
| `npm run check:cache` | Root EmDash | Local memory-cache rehearsal of the cache contracts; does not certify Workers Cache |
| `npm run check:production-setup` | Root EmDash | Read the deployed setup status; passes only on the actual JSON `needsSetup: false` |
| `npm run check:live -- --origin <url> [--strict-seo] [--timing]` | Any deployed site | After a deploy: every sitemap page answers 200 (or redirects to one) and every stylesheet they use answers 200; read-only GET requests. Also warns about search-facing problems: sitemap URLs that redirect, a canonical that is not the page itself, more or fewer than one description, repeated hreflang, and head hreflang that differs from the sitemap. `--strict-seo` makes them fail. `--timing` (with `--samples`, `--timing-pages`) adds cold and warm response times per page from this machine, with cache and placement headers; run it locally, not from CI |
| `npm run db:rehearse` | EmDash, Workers | Load a `db:export-d1` copy into a fresh local D1 with the active plugin bundles, print the exact `wrangler dev` command, then `--compare` row counts after the first request; see [Cloudflare recovery](cloudflare-backup-restore.md#portable-copy-and-a-local-upgrade-rehearsal) |
| `npm run check:emdash-current` | Root EmDash, opt-in local | Built integration rehearsal of the installed EmDash version on a disposable project |
| `npm run check:docs-mcp` | Root EmDash | Read-only transport check of the configured documentation MCP servers |
| `npm run assets:retain` | Root EmDash, Workers | Merge previous build assets into the new adapter output so cached pages keep loading their files |
| `npm run test:site-audit` | Root EmDash | Run the site-standards audit tests |

### Site audits and updates

| Command | Scope | Purpose |
| --- | --- | --- |
| `npm run audit:modernize -- --recipe <id>` | Root EmDash tooling | Plan, apply or roll back one bounded modernization recipe on an older site ([site standards audit](site-standards-audit.md)) |
| `npm run update:plan` | Root tooling | Classify upstream changes for a reviewed existing-site update, and report retired files the site still has ([Baseline updates](baseline-updates.md)) |
| `npm run audit:baseline` | Root EmDash tooling | Read-only inventory of a project's package and lockfile state; observations, not certification |
| `npm run update:all` | Root EmDash | Collect upstream updates and run the staged skill synchronization ([automated upstream updates](automated-upstream-updates.md)) |
| `npm run sync:emdash-skills` / `sync:site-skills` / `sync:impeccable` / `sync:upstream-skills` | Root EmDash | Stage reviewed skill snapshots; staging is not permission to overwrite local drift ([skill synchronization](skill-synchronization.md)) |
| `npm run init:profile -- --profile static|static-sveltia --out <new-directory>` | Root | Generate a static project into an empty directory ([platform profiles](platform-profiles.md)) |
| `npm run site:register` | Root EmDash | Record a new or launched site in the private registry, or leave a pending-registration artifact ([site registry](site-registry.md)) |
| `npm run fleet:status -- --config <private fleet.json>` | Root tooling | Read-only table of every site in a private fleet list: Git state, kind, hosting, versions, and each Baseline site against the pinned standards: dependencies, skills, helpers and Impeccable ([site registry](site-registry.md#fleet-status)) |
| `npm run standards:change -- --slug <name>` | Root tooling | Write a change note for a change sites receive ([standards releases](standards-releases.md)) |
| `npm run standards:check` | Root tooling | Validate change notes; with `--base <ref>`, require one when shipped files changed; `--list` shows pending notes |
| `npm run standards:release -- --version <x.y.z> --source-commit <sha>` | Root tooling | Turn the notes into release notes, pin the distribution and the release digest ([standards releases](standards-releases.md)) |
| `npm run mcp:token` | Root EmDash | Create a personal access token for the site MCP endpoint |
| `npm run workflow:replay` | Root maintainer | Replay a recorded workflow brief against a disposable project ([workflow replay](workflow-replay.md)) |

### Data, media and rehearsals

| Command | Scope | Purpose |
| --- | --- | --- |
| `npm run db:export-seed` | Root EmDash | Export the local content model and content as a seed for new installs; not a migration ([database workflow](database-workflow.md)) |
| `npm run db:export-d1` / `db:pull-remote` | Root EmDash, Workers | Verified SQL copy of a D1 database, including FTS5 search tables, for rehearsal and comparison ([Cloudflare recovery](cloudflare-backup-restore.md#portable-copy-and-a-local-upgrade-rehearsal)); or a snapshot for offline comparison |
| `npm run media:sync-r2` | Root EmDash, Workers | Plan, then explicitly apply, staged media storage keys to R2 ([image delivery](image-delivery.md)) |
| `npm run media:organize` | Root EmDash | Retired: refuses the old flags and points to the reviewed manifest workflow |
| `npm run migration:check-locale` | Root EmDash | Check that migrated entries carry the expected native locale metadata |
| `npm run rehearse:search` / `rehearse:media` / `audit:pilot` | Root maintainer, local only | Synthetic rehearsals of search, media preparation and the site audit on owned disposable data |
