---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills]
adoption: copy
visible: no
database: no
files: [scripts/design-system.mjs, tests/spacing-tokens.test.mjs, scripts/check-art-direction.mjs, tests/reference-research.test.mjs, scripts/audit-composition.mjs, tests/audit-composition.test.mjs]
---

# The record is not overwritten; gates read what agents write; inner pages are measured fairly

From a design trial for a plumbing business:

- `design:tokens --init-client` keeps an Art Direction Record that already holds the site's `World` (it had replaced a whole direction with the lane's generic record, with one line of output); `--write-record` still replaces it when asked.
- `check:art-direction` reads a concept verdict with its reason in brackets (`chosen (16 of 18)`) and says which forms it accepts, and reads a comparison recorded as one table per round under the same heading (a repeated header was read as a row).
- `audit:composition --references` holds inner pages to the references only; the studio level, measured on studio-built home pages, applies to the home page. Its arrows had stayed on every inner page of a two-page plumber whatever was built.
- Guidance: concept reviewers do not ask for facts the owner has not given; the Stage 5 reviewer gets the type sizes from the measures (the sheet is at half scale) and, in round 2, round 1's additions to keep; rounds share one table; full-width photographs are prepared with `--max-edge 2880`.

## For sites

Copy the files.
