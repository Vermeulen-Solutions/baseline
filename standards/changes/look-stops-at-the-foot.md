---
bump: patch
platforms: [emdash, static]
areas: [tooling, skills]
adoption: copy
visible: no
database: no
files: [scripts/design-look.mjs, scripts/audit-composition.mjs, tests/design-look.test.mjs, tests/audit-composition.test.mjs]
---

# The look stops at a page's real foot, and composition advisories say which sections they mean

Two sites were built out by a second model from a designer's start. Their notes named these faults.

- `design:look` measured a page with a pinned scene and a smoothed scroll taller than it is once reduced motion is on, and showed the footer three times in the last screens. The look now waits for the page to settle before measuring and stops at the first screen the browser cannot scroll past.
- `audit:composition` said "3 sections are grids of equal boxed items" without saying which. The `kicker-openings`, `split-openings` and `card-grids` findings now end with the sections by place and heading: `They are: section 2 ("Nos soirées"), section 3.`
- `astro-site-design` says that a class passed to a child component gets none of the parent's scoped styles, and what to do instead.
- `interaction-motion.md` says what a hover, a focus or a press shows under reduced motion: the new state, without the travel.

## For sites

Copy the scripts and their tests, and sync the `astro-site-design` skill.
