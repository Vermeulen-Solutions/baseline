---
bump: minor
platforms: [emdash]
areas: [components, docs, tooling]
adoption: manual
visible: no
database: no
files: [docs/editor-experience.md, src/lib/derived-order.ts, src/plugins/editor-ui/admin.tsx, src/plugins/editor-ui/config.ts, scripts/cms-admin-metadata.mjs]
---

# A guide and templates for an admin non-technical editors can use

`docs/editor-experience.md` covers deriving display order from data instead of number fields, a drag-and-drop order page for truly editorial orders, localised select labels without a data migration, list columns, a "where this appears" panel, a help page and dashboard card, hidden navigation items, the translation-group key trap and comparing a draft with the live row before discarding it. `src/lib/derived-order.ts` adds weekday/time, list-then-title and taxonomy-rank comparators. The `editorial-order` and `editor-ui` native plugin templates ship inactive, and `cms:admin-metadata` reviews admin labels.

## For sites

Nothing changes until a site chooses to. Read the guide when editors find the admin hard to use, and adopt the parts that fit; the plugin templates must be registered deliberately. The public site is unaffected.
