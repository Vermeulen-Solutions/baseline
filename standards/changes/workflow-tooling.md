---
bump: patch
platforms: [emdash, static]
areas: [tooling, docs]
adoption: copy
visible: no
database: no
files: [scripts/capture-routes.mjs, scripts/audit-ui.mjs, scripts/check-quality.mjs]
---

# Workflow fixes: Git Bash routes, visual updates that keep passing goldens, reduced motion in the harness

Three frictions met while building and verifying a new capability:

- **Git Bash routes.** Git Bash rewrites a route argument such as `/` or `/contact` into a path under its install directory (`C:/Program Files/Git/contact`) before Node sees it. `capture:routes`, `audit:ui` and `check:quality` used to stop and ask for `MSYS_NO_PATHCONV=1`; they now map a rewritten route back to the route that was typed (`restoreGitBashRoute()` in `scripts/capture-routes.mjs`, reading the Git install from `EXEPATH` and the usual folders). A Windows path outside the Git install is still refused with the same advice.
- **Visual updates.** `npm run test:visual -- --update` rewrote every captured golden, and the PNG encoder produced different bytes for unchanged pictures, so an update for one new specimen showed a dozen changed goldens to review and restore by hand. It now uses Playwright's `changed` mode: new goldens are written, mismatching ones rewritten, passing ones left untouched.
- **Reduced motion in the harness.** The visual harness emulates `prefers-reduced-motion: reduce` everywhere, so a motion test silently saw no transitions. `docs/visual-regression.md` now says so and how a motion test switches it off.

## For sites

Copy the three scripts when convenient; until then keep prefixing those commands with `MSYS_NO_PATHCONV=1` in Git Bash. The visual harness change is Baseline-only.
