## Plan

**Scope and gaps found before any edit.** This folder holds only the Baseline starter root: it has no `baseline.config.json`, no `src/`, no `audit/`, no `PROJECT.md`/`DESIGN.md`, and its `AGENTS.md` has no `## Art Direction Record`. The request describes a launched static yoga site with a saved record, so the real site folder is needed. Per AGENTS.md, a missing receipt at this root means the EmDash application, which conflicts with the static description. Confirm the profile in the real site before anything else.

**1. Confirm the profile and commands.** Read `baseline.config.json` in the site root (expect `static`). Read `package.json` scripts and use only commands that exist (`verify`, `verify:fast`, `build`, `check:dev-tools`, `check:art-direction`, `design:tokens`, `test:design`, `check:css` if present). Skip EmDash-only steps (`doctor`, `audit:html`, `setup:hooks`, `site:register`, CMS commands). Use `npm.cmd` in PowerShell.

**2. Classify the request.** This is a scoped day-2 visual change under `new-site-workflow` (Scoped maintenance and `references/site-maintenance.md`, row "Spacing or visual tokens"). It is not a new site, so no Express/Standard stages, discovery or handoff prompts. Preserve everything the owner did not mention: the desktop layout, copy, navigation, other grids and the Classes page content.

**3. Check the Art Direction gate.** Any change under `src/` or `public/` is visual work and needs a saved `## Art Direction Record` in `AGENTS.md`, then `npm run check:art-direction -- --require-record`. If the real site has no record, stop the visual edit and report the gap. Do not invent a record or add an exception for a page; exceptions cover only functional or infrastructure files. Record a passing gate as evidence, not as owner approval.

**4. Reproduce and trace the owner's complaint.** Load `astro-site-design` (`SKILL.md` and `references/rollout-verification.md`). Start the dev server or a fixed build and inspect the Classes route at 375px and 390x844 (plus 768px and 1440px for regression). Measure the actual card gap in computed style: row gap, column gap, and any card margins or flow margins that add to it, so the same relationship is not counted twice. Find the owner: a page-level `Grid` gap prop, the `--layout-grid-gap` alias, or the `Card` primitive default. Grep for `Card` and `Grid` consumers before touching any shared default.

**5. Choose the smallest scope.** Use this order from `docs/design-framework.md` section 8 and `site-maintenance.md`:
- one `Grid` gap prop or a layered regional alias scoped to the Classes grid is preferred;
- a root `--layout-grid-gap` change is a site-wide change and is not the default here;
- do not change the global `--spacing-grid` scale or the `Card` defaults unless the consumer check shows it is the right owner.
Working assumption to record: the owner's "too far apart" comment is about phones, so the tighter gap should apply at the phone widths. If the same gap is also used on desktop, decide explicitly whether desktop may change (state it in the report) or add one narrow rule. Avoid a breakpoint ladder, and do not add flow margins to a gapped grid.

**6. Preview token changes before writing.** If a token route is used, run `npm run design:tokens -- --set "--root:--layout-grid-gap=calc(var(--spacing-grid) * 0.75)" --json` (or the regional selector form) as a preview only. Review the diff and then write explicitly. Use `--write-calibration` only when saved calibration evidence is needed. For a primitive gap prop, edit the Classes template only and skip the token CLI.

**7. Implement in the right layer.** Keep CSS in `@layer base` or `@layer components`, use `:where()` for contextual defaults, and preserve the spacing ownership rules (`automatic-v2`, Section/Container/Grid gaps). Do not change routes, navigation, metadata or copy, so no redirect is needed.

**8. Verify at the right level.**
- `verify:fast` during edits; then `verify`, `build`, `check:dev-tools`, `check:art-direction -- --require-record`, and `design:tokens` plus `test:design` when tokens changed.
- Check the emitted HTML and computed gaps in the built output.
- Browser acceptance: zero horizontal overflow and no awkward heading wraps at 375, 390x844, 768 and 1440. Compare the gap before and after at each width. Check that the other grids and the desktop layout (unless the owner accepted a change) are unchanged. Inspect `/_styleguide` for the Grid and Card specimens.
- Use the site's installed critique tool if present. `impeccable` is referenced by the workflow but is not installed under `.agents/skills/` in this folder, so if unavailable, report that critique as manual.
- Visual regression runs only locally on Windows, and only if the site has baselines.

**9. Record and hand off.** Update the existing tracker or handoff with the changed file(s), the chosen scope, checks actually run and the phone-check still pending for the owner. Update `audit/component-calibration.md` only if calibration was written. Add a note to `AGENTS.md` only if the tighter grid is a deliberate local exception.

**10. Release.** Keep it local unless the owner's existing authorization covers commit, push and deployment. Report commit, branch and deployed URL only after they are observed. Do not deploy on your own initiative.

**Final report.** Say what changed and where, which checks ran and which are pending (owner phone check, manual critique), and any unresolved gap (missing record or profile, unconfirmed desktop change).

## Files read

1. AGENTS.md
2. README.md
3. .agents/skills/new-site-workflow/SKILL.md
4. .agents/skills/new-site-workflow/references/site-maintenance.md
5. docs/site-working-rules.md
6. docs/design-framework.md
7. docs/native-composition.md
8. .agents/skills/astro-site-design/SKILL.md
9. .agents/skills/astro-site-design/references/rollout-verification.md
