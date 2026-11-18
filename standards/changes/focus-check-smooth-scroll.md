---
bump: patch
platforms: [emdash, static]
areas: [tooling]
adoption: copy
visible: no
database: no
files: [scripts/check-quality.mjs]
---

# check:quality no longer reports controls off screen on smooth-scrolling pages

On a page with `html { scroll-behavior: smooth }`, a browser scrolls the control reached with Tab into view over a few hundred milliseconds. `check:quality` measured straight after the key press, so every control below the first screen was reported as `focus-obscured` ("off screen"): over 60 false findings on one site. The check now scrolls at once while it tabs. The page keeps its own setting for visitors.

## For sites

Copy `scripts/check-quality.mjs` with the next helper update. Rerun `check:quality`; the remaining `focus-obscured` findings are real.
