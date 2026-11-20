---
bump: none
platforms: [emdash]
areas: [tooling, docs]
adoption: none
visible: no
database: no
---

# Visual reference images are checked against their manifest

The Windows visual suite runs only locally, so a starter change could reach main with outdated reference images, and images could be committed without being recorded in `manifest.json`. A unit test and `npm run check:visual-references` now fail when a reference image under `tests/visual/baselines/` is missing from its manifest, differs from its recorded SHA-256, or is listed but absent. CI adds a notice (not a failure) when a change touches `src/styles/`, `src/components/` or `src/layouts/` without renewing the references, and the release guide's Certify step runs `npm run test:visual` on the candidate first.

## For sites

Nothing. The check covers Baseline's own starter references.
