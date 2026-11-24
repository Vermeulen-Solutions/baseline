---
bump: patch
platforms: [emdash, static]
areas: [tooling, components]
adoption: copy
visible: no
database: no
files: [scripts/design-look.mjs, scripts/capture-routes.mjs, scripts/audit-composition.mjs, scripts/audit-ui.mjs, scripts/check-quality.mjs, scripts/record-motion.mjs, src/components/Disclosure.astro, tests/design-look.test.mjs, tests/capture-routes.test.mjs, tests/components-primitives.test.mjs, docs/native-composition.md]
---

# The look covers a long page to its foot, the browser tools find a site under either local name, and Disclosure can be restyled

Two sites were built out by a weaker model from a full client kit. Their pages were longer than any before them, and the builders' notes named these faults in Baseline itself.

- **The look stopped at 14 screens.** The two phone pages were 14 and 17 screens long, so the last sections of each were never looked at. `design:look` now takes up to 40 screens a width, which covers a phone page of about 30 000px. A page longer than that says in its own section of `look.md` how many pixels are outside the look and to look at the rest in the page itself.
- **A screen that had changed was called unchanged.** A second look keeps the lines of the screens that did not change. The test was the average difference over a 24 by 24 grid, and a small drawing added to a screen moved that average too little. The grid is now 48 by 48 and any one cell that moved counts. An unchanged page still reads as unchanged: 81 of 82 screens on two runs over two built sites. A `look.json` from an older look is read as "changed" once, then replaced.
- **`--base http://127.0.0.1:<port>` was refused while the site was up.** A dev server started on `localhost` listens on `::1` on some machines, and `127.0.0.1` then refuses the connection. `capture:routes`, `design:look`, `audit:composition`, `check:quality`, `audit:ui` and `record:motion` now try the other local names when a local origin does not answer, use the one that does and say so. When none answers they say what to start, before the list of skipped routes.
- **Disclosure could not be restyled from a site's stylesheet.** Its scoped rules carried the component's attribute, so `.disclosure { … }` in the same layer lost to them and the builder wrote its own `<details>` instead. The default look now has no specificity: `.disclosure`, `.disclosure > summary` and `.disclosure__body` rules in `@layer components` win wherever the stylesheet loads. The component looks the same until a site restyles it.

Two things in the builders' notes were not faults. A lone `/` route under Git Bash was already put back by every route-taking command except `design:look`, which was fixed in the previous release; `npm` still prints the rewritten path in its echo of the command, and the tools read it correctly. And `audit:composition` counts SVG and canvas drawings as "drawn objects" by design: a framed block of text is counted under surfaces, not drawings.

## For sites

Copy the six scripts, the three tests, `src/components/Disclosure.astro` and `docs/native-composition.md`. A site that restyled Disclosure with a selector of two or more classes keeps its look; a site that relied on the component's own border or padding winning over a one-class rule of its own will now see its own rule apply.
