---
bump: patch
platforms: [emdash, static]
areas: [styles, tooling, skills]
adoption: copy
visible: yes
database: no
files: [src/styles/global.css, src/styles/expressive.css, scripts/css-contracts.mjs, tests/css-contracts.test.mjs, scripts/audit-composition.mjs]
---

# Scroll-driven motion runs on the built site

The production CSS minifier folds `animation: x linear both` and `animation-timeline: view()` of one rule into `animation: linear both x view()`. Browsers reject that value (the timeline is reset-only in the shorthand), the animation name computes to `none`, and the motion never runs on the built site, while the unminified dev server shows it. The starter's shared scroll reveal (`data-reveal`) and the expressive scroll effects (`data-reveal="frame"`, `"mask"`, `data-scroll="open"`, `"recede"`, `"rise"`) were written that way, so on every production build they have not run; a trial found it when its own scroll entrances stopped.

- The starter's scroll-driven rules are written as longhands (`animation-name`, `animation-timing-function`, `animation-fill-mode`), which survive minification.
- `check:css` fails on a rule that sets the `animation` shorthand and `animation-timeline` together.
- The world-building and fluid-tokens recipes show the longhand form.
- `audit:composition` counts objects turned with the independent `rotate` property as depth, as well as `transform: rotate()`.
- The Stage 5 comparison may give one reviewer every page's sheets at once.

## For sites

Copy the files. Pages that use `data-reveal` or the expressive scroll attributes start animating on the built site: check them once on the preview. Run `npm run check:css` and rewrite any rule it names in the site's own CSS as longhands.
