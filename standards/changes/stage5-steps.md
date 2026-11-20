---
bump: patch
platforms: [emdash, static]
areas: [tooling, skills]
adoption: copy
visible: no
database: no
files: [scripts/capture-routes.mjs, scripts/audit-composition.mjs]
---

# Stage 5 builds cleanly, captures load, wrapped sections are read

From a design trial for a plumbing business:

- `capture:routes` scrolls more slowly (400px every 220ms) so pages that load their pictures as they come into view, such as studio case studies, are no longer captured with empty panels.
- `audit:composition` finds a page's sections when they sit in one wrapper beside thin decoration (a pipe drawn behind every section); it had reported two sections for a page of six.
- Stage 5: fix visible defects before each capture (reviewers scored the same page alike for three rounds of additions until its collisions and phone overflow were fixed), read `OVERFLOW-X` at 390, write each addition's rules beside its component instead of appending them after the phone rules, and build three additions in round 2.
- World building: look at what each photograph shows before placing or captioning it.

## For sites

Copy the files.
