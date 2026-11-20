---
bump: patch
platforms: [emdash, static]
areas: [styles, tooling, docs]
adoption: copy
visible: no
database: no
files: [src/styles/expressive.css, scripts/design-system.mjs]
---

# Duotone frames of any shape; lanes without a preset are named

- The duotone inks follow `--tone-inset` (default 0) and the frame's `border-radius`, so a mount with padding, a bordered plate or a round crop no longer needs its own `::before`/`::after` override. Existing frames render as before.
- `design:tokens --list-lanes` names the organisation lanes that have no preset (Atelier & Craft, Civic & Community, Club & Fixture) and the preset each seeds from; agents met the gap there before reading the lanes reference.

## For sites

Copy the files.
