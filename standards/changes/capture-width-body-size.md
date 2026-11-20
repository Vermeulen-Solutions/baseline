---
bump: patch
platforms: [emdash, static]
areas: [tooling]
adoption: copy
visible: no
database: no
files: [scripts/capture-routes.mjs, scripts/audit-composition.mjs]
---

# Captures show the page a visitor sees; the body size is the reading text's

From a design trial for an association:

- `capture:routes` warns `OVERFLOW-X` when the page or its body is wider than the screen even though `overflow-x: hidden` on `html` hides it from the visitor, and clips the full-page capture to the viewport width: a 1,525px-wide capture at 1440 had put a shifted page on the comparison sheet that no visitor sees.
- `audit:composition` measures the body size weighted by characters, so a page of short labels (a twelve-month frieze, tickets) no longer reports its 14px label size as the body; Stage 5 gives these sizes to the reviewer.

## For sites

Copy the files.
