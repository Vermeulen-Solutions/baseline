## Plan

**Request:** On phone widths the class cards on the Classes page feel too far apart. Tighten them a bit. Everything else stays as it is.

**Track and routing.** This is a scoped maintenance change on an existing site, not a new site or rebuild. Per AGENTS.md and `new-site-workflow`, no track applies. Start at the earliest affected stage, which is spacing on an existing route. Load `new-site-workflow/references/site-maintenance.md` (section "Spacing and shared components" and "Reconcile completion before handoff"). Load `astro-site-design` for the implementation, and its `references/responsive-architecture.md` and `references/accessibility.md` only if the chosen fix touches a media query or card focus behavior. Load `impeccable` for the bounded rendered critique (the skill is referenced by AGENTS.md but is not in this checkout's `.agents/skills/`, so confirm it is installed before relying on it). Do not load `site-art-direction` or a design-canvas skill: a small refinement reuses the accepted world (AGENTS.md, Design iteration surface). Do not load EmDash skills unless the profile check below says `emdash`, and then only if queries or templates change, which this fix should not require.

**Step 1: Confirm the platform and gate state before touching files.**
- The root has no `baseline.config.json`. Per AGENTS.md that means this is the EmDash foundation, but the owner describes a static site and the site source is not in this folder. Read the real site's `baseline.config.json` (or profile receipt) and its generated AGENTS.md before editing. The profile decides which specialists apply and which verification commands exist.
- The owner says the AGENTS.md holds a saved Art Direction Record. The AGENTS.md read for this plan has no `## Art Direction Record` section. Treat that as a discrepancy to resolve first. A spacing change is still visual work, so the gate applies: run `npm run check:art-direction -- --require-record` (or the site's equivalent per `new-site-workflow` "Start here" command-availability rule). If the record is missing, do not invent one and do not edit the Classes page. Report it to the owner and ask for the record or the approved direction.
- Check `package.json` scripts for `verify:fast`, `verify`, `design:tokens`, `audit:html`, `check:art-direction` and `test:design`. Use only the ones that exist.

**Step 2: Trace the owner of the gap.** Find the Classes route, then the component that renders the cards (likely `Grid` with a card `Card` consumer, or a page-level gap). Determine which of these sets the phone spacing: the Grid `gap` prop or `--grid-gap` (from `--layout-grid-gap`), the Card's `--card-gap`, Container/Section `gap`, or a page `class`. Search for other consumers of the same `Grid` and `Card` so a shared default is not changed by accident. Note the existing `minimum` ("compact|standard|wide") on the grid, because it sets the column count at phone width.

**Step 3: Capture the current state.** Render the Classes page in the local dev server (or the site's preview) at 375px, 390x844, 768px and 1440px. Record the card gap and card padding with computed styles. Keep these captures as the "before" evidence for the register.

**Step 4: Choose the smallest scope.** Use `docs/site-working-rules.md` "Day-2 client changes" and `docs/design-framework.md` section 8 (scope table).
- Preferred: an instance control on the Classes page grid only, for example `<Grid gap="calc(var(--layout-grid-gap) * 0.75)">` or a local `gap` prop. This leaves the other grids untouched. If the gap must differ only on phones, decide whether a single existing breakpoint on this composition is justified. Do not add new spacing breakpoints to repair unclear ownership (`docs/design-framework.md` section 1).
- Avoid a shared `Card` default change or a root `--layout-grid-gap` change, which would also move every other grid on the site. If a regional alias is chosen, use a layered `:where()` rule in `@layer components`, not a `!important` override.
- Avoid adding flow margins to a gapped group. Keep the card's internal padding and the desktop geometry unchanged unless the critique shows they are the actual cause.
- Preview any token-level change first with `npm run design:tokens -- --set "..." --json`, review it, then write it. Global token changes would need `--write-calibration` and a `design:tokens` run.

**Step 5: Implement.** Edit only the Classes route or its local instance control. Do not change copy, navigation or other routes. If the site is static, no CMS, schema or migration work applies. If the site is EmDash, do not touch queries, edit proxies or `entry.edit.*` attributes.

**Step 6: Verify.**
- Run the fast gate during edits (`verify:fast` or the site equivalent), then `verify`, `build` and `audit:html` against a fresh build before handoff. If the profile is static, use its own `verify`/`build` scripts and do not add CMS tooling.
- Run `design:tokens` and `test:design` if any token or `global.css` value changed, and check the tokens/calibration record.
- Rendered acceptance (required, not optional). At 375px, 390x844, 768px and 1440px:
  - card gap is visibly tighter on phone, and the difference is roughly the requested amount, not a collapse;
  - no horizontal overflow, no clipped text, no awkward single-word headings; text and button wrapping still works;
  - desktop and tablet geometry is unchanged compared with the "before" captures;
  - other pages that use the same `Grid`/`Card` are unchanged;
  - focus rings on the card (`.focus-parent`) remain visible and whole; tap targets are not smaller.
- Run `impeccable` as a bounded critique on the Classes page only, then fix or record its findings.
- Run the local visual regression (`test:visual`) only on Windows and only locally, if the site has it. Never run it in CI.

**Step 7: Record and hand off.** Update the existing tracker or handoff with: the changed surface and the reason, the phone values before and after, the checks actually run (and which were not run), and any remaining acceptance. Keep the register from `site-maintenance.md` short: route, viewport, implementation, observed evidence, status.

**Boundaries.** Do not commit, push or deploy unless the owner or the existing authorization covers it. The email asks for a visual tweak only. If a release step is needed later, follow `new-site-workflow` release rules. Keep the reply to the owner in English; the site copy stays as it is.

**Open items to surface.**
- Missing Art Direction Record in AGENTS.md (gate).
- Profile unknown from this folder (root has no `baseline.config.json`).
- `impeccable` not present in this checkout's `.agents/skills/`.

## Files read

1. AGENTS.md
2. README.md
3. docs/site-working-rules.md
4. docs/native-composition.md
5. docs/design-framework.md
6. .agents/skills/new-site-workflow/SKILL.md
7. .agents/skills/astro-site-design/SKILL.md
8. .agents/skills/new-site-workflow/references/site-maintenance.md
9. package.json

Glob listings (paths only, no contents opened): `.agents/skills/*/SKILL.md`; `src/pages/**`, `src/components/**`, `audit/**`, `scripts/design-system.mjs`, `package.json`, `baseline.config.json` (only `package.json` matched, so `src/`, `audit/` and `baseline.config.json` are absent from this folder).
