---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/check-art-direction.mjs, tests/design-workflow.test.mjs, tests/reference-research.test.mjs, scripts/capture-routes.mjs, tests/capture-routes.test.mjs]
---

# Redesigning an existing site

A design trial redesigned an existing club site on an older Baseline with the current process, and found where a redesign differs from a new site:

- `check:art-direction` reads a record kept under a `## Superseded Art Direction Record (<date>)` (or `## Previous …`) heading as history, so a redesign keeps the direction it replaces in `AGENTS.md`; a second live record still fails. A candidate above the bar left out for a reason takes `not selected: <reason>`.
- `capture:routes --route-timeout <s>` (default 180) skips a route that never settles; two reference captures had hung the run with empty logs.
- `site-art-direction` has a section on redesigning an existing site: read the record, its Site Anti-Patterns and the owner's rules first and give them to every reviewer; a recorded owner rule outranks an advisory or a reviewer's suggestion and is named in the gap; raise a direction inside the one in place with templates and rules scoped to the pages it raises; inherited shared components meet the new floor checks; capture the current pages first. A direction stylesheet on an older site whose stylesheets are unlayered is written unlayered and scoped.
- Reference research gives the scorer the bar, states how the bar is computed (the median of each reference's seven-line sum), and records a built page as a new `chosen` row of the concepts table. Stage 5: a final score-only review is not a round.

## For sites

Copy the files.
