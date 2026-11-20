---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills]
adoption: copy
visible: no
database: no
files: [scripts/check-art-direction.mjs, tests/reference-research.test.mjs]
---

# The concept bar is enforced at Stage 5, where it can be reached

The bar may be reached in the built page scored with the Stage 5 comparison, but the gate a build starts from (`check:art-direction -- --require-record --require-references`) failed on it for the whole build, which read like a stop.

- Before Stage 5 (no `--require-comparison` and no `### Built against the references` table yet), a chosen concept under the bar, or under 2 on a design line, is printed as a note; with `--require-comparison`, or once the comparison table exists, it fails as before.
- A concept verdict may give its reason after a dash as well as a colon (`chosen — improved in round 2`).
- World building: full-width objects use `.bleed` instead of widening the shell's main column or zeroing section padding; where fonts go. Stage 5: cap stages sized in `svh` so full-page captures show what a visitor sees.

## For sites

Copy the files.
