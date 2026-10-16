# Baseline — Astro & EmDash visual toolkit

Build content-backed Astro sites with a visual workflow you can inspect and verify. Start locally with EmDash, SQLite, native Astro images and Tailwind v4; calibrate real components before assembling pages, then keep client content separate from code deployments.

**Astro 7.4.0 · EmDash 1.3.0 · Node 22.22.2 minimum · Node 24 LTS recommended · MIT**

![The neutral component styleguide](docs/images/styleguide.jpg)

## 60-second quickstart

Run these commands to start setup; package download and first compilation time depend on your machine.

```sh
git clone https://github.com/Vermeulen-Solutions/emdash-baseline.git my-site
cd my-site
npm install
npx emdash secrets generate --write .env
npm run dev
```

Open the URL printed by Astro, then visit **/_emdash/admin** to complete setup and create your administrator account. There are no shared default credentials. Keep .env, local databases, uploads and encryption-key backups private. Rename the package for your site and use one npm lockfile.

Use **Use this template** when available to create a separate repository per site. Before adapting the starter, read [AGENTS.md](AGENTS.md), review staged skill updates using [the synchronization runbook](docs/skill-synchronization.md), and begin with [new-site-workflow](.agents/skills/new-site-workflow/SKILL.md).

## What ships

| Capability | Shipped behavior and boundary |
| --- | --- |
| Development HUD | T opens token controls; B compares source baseline; G shows actual container columns; O aligns a local screenshot; P inspects observed CMS ownership annotations. Development only. |
| Component quarantine | /_styleguide renders real primitives and synthetic fixtures before page assembly. Normal production artifacts return 404 for this route. |
| Schema budget | Preflight counts actual SQLite physical columns, including generated columns, against a conservative 50-column budget. Cloudflare D1 parity is future work. |
| LogoTicker | Zero-JS SSR/CSS primitive with native pause control, reduced-motion and RTL handling. Trusted noninteractive items only; linked/editor-owned partners use an unduplicated list. |
| Images and galleries | Native Astro processing and EmDash storage-backed delivery; preserve originals, captions, order and media ownership. PhotoSwipe progressively enhances gallery links. |
| Local visual checks | Pinned Windows Chromium captures at 390/768/1440, plus motion, no-JS, text-spacing, actual zoom and deliberate-defect tests. Explicit reviewed --update only. |
| Agent workflow | Saved art direction, open structural slots, deliberate semantic composites, maintained specialist skills and upstream provenance. |
| Standards baseline | Scoped standards-v0.1.1 certifies Node/SQLite/local media and pinned Windows Chromium. Worker/D1/R2, live providers and opt-in locale/cache scopes need separate verification. |

## Calibrate in the browser

Press **T** in development. Token changes are temporary; export reviewed CSS into src/styles/global.css, reload without overrides and verify narrow/wide layouts. Layout and content changes belong in source.

| Key | Tool |
| --- | --- |
| T | Open or close token drawer |
| B | Compare the unchanged source baseline |
| G | Container grid guide |
| O | Local raster reference: opacity, offsets, DPR/scale, document or viewport alignment |
| P | Read-only EmDash ownership inspector |

G/O/P shortcuts require the open drawer and yield to inputs and editor dialogs. Escape dismisses the active tool before closing the drawer. O uses revocable in-memory object URLs with no uploads, fetching or persistence. P reports annotations and unknown text; it does not certify field registration, editing or saving. [HUD guide](docs/dev-hud.md).

<img src="docs/images/reference-overlay.png" alt="Local reference overlay controls" width="280" />
<img src="docs/images/ownership-inspector.png" alt="Read-only ownership diagnostics on a public fixture" width="280" />

## Verify locally; keep CI small

```sh
node --test tests/*.test.mjs
npm run lint
npm run check:schema-budget
npm run typecheck
npm run build
```

For browser work, follow [visual regression](docs/visual-regression.md) to install the exact local renderer, then run npm run test:visual and npm run test:dev-hud. Baseline updates require an explicit local --update and reviewed image/manifest differences. No browser tests run on push/PR or as build/deployment dependencies. CI has one Node 22.23.3 job for fast checks and a normal build; actual duration varies with runner/setup/cache.

Use npm run check:dev-tools for isolated dev/built HTTP probes. Fixture builds use separate dist-fixtures/ output, ephemeral synthetic data and loopback serving; release guards reject them. [Fixture contract](docs/styleguide-fixtures.md).

## Adapt a site deliberately

Record the brief, locales, content ownership and routes before art direction. Save the required Art Direction Record before site-specific visual implementation, then calibrate representative components on /_styleguide. Translate screenshots as evidence, with explicit responsive assumptions. Keep photographs in src/assets/ or EmDash Media Library; do not bypass native processing by downloading them straight into public/.

The starter provides Posts/Pages and neutral Section/Container/Grid primitives, not a finished client theme. Render editorial Portable Text in .flow, forward edit attributes onto the exact stored field and verify actual save/reload separately from public rendering. [Editorial canvas](docs/emdash-editorial-canvas.md) · [gallery workflow](docs/gallery-workflow.md) · [image delivery](docs/image-delivery.md).

WordPress migration, presentation rebuilding and hosted content transfer are separate workstreams. Do not assume a code deployment copies local CMS data or media. Back up and verify target-specific mappings. Existing media organization/R2 scripts are legacy utilities, not a certified ingestion/parity pipeline; Phase 5 must harden them before real remote use.

## Hosting and standards

This checkout runs **Node + SQLite + local storage** without a cloud account. Cloudflare is an optional per-site architecture decision; its adapter, D1/R2 bindings and image delivery require their own configuration and certification. Do not copy Node configuration into a Worker unchanged. [Setup skill](.agents/skills/emdash-site-setup/SKILL.md) · [site transfer](https://docs.emdashcms.com/guides/site-transfer/).

The [standards manifest](standards/manifest.json) and [0.1.1 release scope](standards/releases/0.1.1.md) identify tested facts and pending scopes. npm run audit:baseline records local observations; npm run check:upstream evaluates Astro, adapters, EmDash and Node independently on every meta-review. Version pins are a tested baseline, not an upgrade ceiling. [Meta-review](docs/starter-meta-review.md).

Phase 4 includes a read-only diagnostic scaffold: `npm run audit:site -- --root ../my-site`. It verifies the pinned offline standards manifest, reports static version/hash observations and leaves missing evidence unverified. It never installs, syncs, migrates or deploys. Reports must be written outside the audited target. [Audit usage and limits](docs/site-standards-audit.md) · [implementation plan](audit/roadmap-review-2026-10-15/implementation-plan.md).

## Contribute and reuse

[Contributing](CONTRIBUTING.md) explains tests, privacy and skill ownership. The three EmDash mirrors are staged/reviewed upstream snapshots; Vermeulen-maintained guidance is distributed separately. Impeccable retains its own provenance and license. [MIT license](LICENSE) · [third-party notices](THIRD_PARTY_NOTICES.md) · [Code of Conduct](CODE_OF_CONDUCT.md).

This repository starts from a sanitized root snapshot with no inherited private Git history. Historical receipt hashes refer to original private evidence; edited copies are redacted. [Public release procedure](docs/public-release.md) · [pending launch gates](https://github.com/Vermeulen-Solutions/emdash-baseline/issues/1). Packaging does not change repository visibility or announce a launch.
