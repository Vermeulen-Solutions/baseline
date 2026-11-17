---
bump: minor
platforms: [emdash, static]
areas: [tooling]
adoption: copy
visible: no
database: no
files: [scripts/design-system.mjs, scripts/css-contracts.mjs, scripts/check-css-contracts.mjs, scripts/audit-ui.mjs, scripts/audit-design-system.mjs]
---

# Token guardrails, resize-text ratio and fairer rendered-UI audits

`check:css` prints advisory token guardrails (Tailwind default palette and type utilities, arbitrary values, raw colours, spacing and z-index outside token definitions); `--strict-guardrails` makes them fail. `design:tokens` checks that every fluid text token's maximum is at most 2.5 times its minimum (a warning on stylesheets that predate the rule), exports DTCG 2025.10 with `--format dtcg`, and applies a strict theme for new client sites (`--init-client`; existing sites opt in with `--strict-theme`). `audit:ui` measures empty bands against 1.5 times the page's own `--spacing-section` (`--band <px>` keeps a fixed limit) and measures `::before`/`::after` decorations by what their clipping ancestors let through, which removes false overlaps.

## For sites

Static sites receive these through `sync:baseline`. EmDash sites copy the scripts whole when they carry Baseline's versions; a site that owns its own `design-system.mjs` keeps it and runs Baseline's read-only from a Baseline checkout (`node <baseline>/scripts/design-system.mjs`). `audit:ui` runs from a Baseline checkout against any origin without installing it.
