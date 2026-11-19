---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/check-art-direction.mjs, tests/reference-research.test.mjs, profiles/static/project/AGENTS.md]
---

# Reference research is required and judged

Reference research was an offer to the owner: when no references were supplied, the agent asked once whether they wanted examples, and researched only if they accepted. A trial build from a plain brief recorded "no outside site, prompt library or template was used", designed to the model's own defaults, and compared its concepts only with each other.

- `site-art-direction/references/reference-research.md` now makes it a required step for every new site and new direction. The agent finds at least eight candidates itself (at least five real sites in the trade and neighbouring ones, at least one prompt, template or design system), captures each at 1440 and 390, and scores each on one eight-line card (first screen, specificity, type, photographs, composition, craft, phone, fit), by a fresh reviewer that sees only the screenshots when a sub-agent exists. Hard rejections (the template look, stock photography, page-builder defaults, a broken phone page) are written down. At least three are selected at 17 of 24 or more with specificity and fit of 2 or more, at least two of them real sites; too few means searching again, never a lower bar.
- The selected references are the minimum bar: each concept is scored on the same card beside them, and the chosen concept must reach their median total and score 2 or more on every line, or be improved and scored again.
- `check:art-direction --require-references` validates `audit/references/references.md` (searches, candidates, scores and totals, verdicts with reasons, the selected references' captures and lessons, the concepts against the bar). The Stage 4 gate now runs `--require-record --require-references` for a new direction; once the Art Direction Record names the file (`- **References:**`), every run checks it.
- Owner references join the candidates and are kept as constraints; the owner is never asked to find references first. Component registries such as `21st.dev` remain outside the research and serve only a concrete component gap at Stage 4.5.
- The workflow, express track, design iteration, adaptation guide, both AGENTS files and the docs say the same.

## For sites

Nothing changes on an existing site until it starts a new direction: the check applies only with `--require-references` or when the record names the file. To take it, copy `scripts/check-art-direction.mjs` and `tests/reference-research.test.mjs` (`site:files --files scripts/check-art-direction.mjs,tests/reference-research.test.mjs --apply`); the guidance arrives with the usual skill sync.
