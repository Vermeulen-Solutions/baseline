# Explicit runtime targets and downstream extensions

The root EmDash application defaults to Node/SQLite/local media. Keep `astro.config.mjs` explicit so existing inspection, Node review and source recovery remain understandable. For an authorized Worker target, use a separate `astro.cloudflare.config.mjs`, separate output/cache directories and explicit build/deploy scripts. Static profiles stay static and gain no CMS/Worker dependencies.

The overlay must replace the adapter and native EmDash database/storage integration, retaining site-owned integrations/plugins, languages and settings deliberately. Do not append a second EmDash instance or discard every integration. Use matching installed Cloudflare/EmDash adapters, dedicated D1/R2/session bindings and supported native images. Retain Astro sessions; see [release trust checks](release-trust.md). Runtime configuration expressions/imported spreads may remain unknown to the read-only inspector: inspect the selected overlay directly and verify the effective build/bindings. Do not evaluate arbitrary config or make a working Node target conditional just to obtain a second target.

| Concern | Node review | Worker preview |
| --- | --- | --- |
| Astro configuration | Explicit default `astro.config.mjs` | Explicit `--config astro.cloudflare.config.mjs` |
| Build/cache | Existing `dist` / `.astro` | Separate `dist-cloudflare` / `.astro-cloudflare` |
| CMS data/media | Configured SQLite/local library | Separate named D1/R2 resources; code deploy transfers no records |
| Sessions | Supported adapter filesystem store | Supported adapter KV/explicit driver and exact environment binding |
| Development specimens | Existing guarded local developer routes | Omit Node-only synthetic backends; production dev bypass remains forbidden |

This is a configuration contract, not a Cloudflare scaffold or hosting certification. Do not add paid sandbox infrastructure without an actual registry-plugin requirement. First admin credentials, native content transfer, publishing and later domain cutover retain their separate authorization/acceptance. Never reset an existing database to repair setup.

## Classify a bounded downstream addition

Inspect the installed profile and ownership before adopting helpers. In a full EmDash checkout, a new root helper, top-level test, package script or dependency can require several linked inventories. Keep inherited guards; do not remove the inventory to make verification pass.

| Change | Review together |
| --- | --- |
| Helper/source path | `profiles/file-inventory.json`; applicable resolved manifest membership only when it is actually distributed |
| Top-level test | `tests/test-tiers.json` with meaningful unit/rehearsal reason, plus source classification |
| Command | `package.json`, applicable manifest scripts and installed command documentation |
| Dependency | Lockfile, dependency inventory and applicable manifest package membership; avoid CMS packages in static profiles |
| Maintained skill | Reviewed source/provenance and bounded `sync:site-skills` membership; preserve local instructions/calibration |
| Generated static update | Immutable `sync:baseline` plan/conflicts; new membership requires explicit additive adoption rather than silently widening sync |

Site-owned routes/content/tokens do not become starter-distributed merely by being classified. Preserve client edits, unknown paths and prior adoption records. Run `verify:fast`, then full applicable verification/build, including generated profiles when distribution changes. [Baseline updates](baseline-updates.md) owns adoption; this is not a new inventory or evaluator.

## Refresh lifecycle metadata on promotion

When the owner authorizes a repository or changes runtime, update the existing registry proposal and current checkpoint. `site:register` without a configured private registry writes an explicit pending proposal; it is not central registration. A deliberately local-only rehearsal without an authorized repository records that reason privately instead of inventing a repository URL. Do not treat missing central access as a blocker to authorized local/preview work. Keep old pending context as superseded history, with the current proposal easy to find. See [site registration](site-registry.md).
