---
bump: minor
platforms: [emdash, static]
areas: [tooling, skills, docs]
adoption: copy
visible: no
database: no
files: [scripts/check-quality.mjs, tests/check-quality.test.mjs, scripts/capture-routes.mjs, tests/capture-routes.test.mjs, .agents/skills/astro-site-design/references/interaction-techniques.md]
---

# The first screen never opens on a scroll-driven entrance caught part-way

A launched site opened every desktop visit on a half-tilted, faded board. The board's top showed at the bottom of the first screen at 1440×900, and its entrance was scroll-driven (`animation-timeline: view()`, starting tilted, shifted and at 40% opacity), so its progress at load came from where it sat. The guidance already said the first screen is never hidden, but nothing caught this case: `check:quality` only reported a first screen that starts mostly transparent, and `capture:routes` runs with reduced motion and finishes every animation, so the evidence showed a settled board.

- `check:quality` reports `first-viewport-scroll-motion`: an element on the first screen, at the phone or desktop width, whose `view()` animation changes opacity, rotation, scale, blur or clip and is part-way through straight after load. A parallax that only translates is not reported. The run exits 2 on it, like every other finding.
- `capture:routes --motion` captures with full motion and adds a `load` frame: the first screen as it paints, before any animation is forced to its end. Without `--motion`, captures stay as they were (reduced motion, every animation at its end).
- The interaction guidance says nothing on the first screen rides a scroll-driven entrance at any width: give it no entrance, or play it once when it comes into view and leave it still when it is already on screen at load.

## For sites

Copy the two scripts and their tests. A site with a scroll-driven entrance on an element that shows on the first screen now fails `check:quality` until the entrance is removed or plays once on view.
