# Optional post reading time — local completion notes

## Completed scope

- Added optional `readingTime` to the actual Astro collection: `z.number().int().min(1).max(60).optional()`.
- Paired the Sveltia Posts form with a number widget, integer storage, minimum 1, maximum 60, step 1, no default, and `required: false`. Retained the existing `omit_empty_optional_fields: true` output policy so a cleared field is omitted.
- The existing article template conditionally renders `<value> min read`. No label or empty paragraph is emitted when the value is absent.
- Added published, `draft: false` samples at `/posts/field-notes/` and `/posts/practice-update/`, with the exact requested titles, descriptions, dates and bodies. Only Field notes has reading time 5.
- Preserved Welcome, identity, navigation, unrelated fields, CSS and shared components. Updated the editor documentation and AGENTS content contract.
- Used installed `astro-site-design` and a scoped Impeccable visual refinement/check. Existing saved art direction remains authoritative. Consulted official Astro schema documentation via the configured Docs MCP and [Sveltia number-field documentation](https://sveltiacms.app/en/docs/fields/number) for form options.

## Commands and observed results

All project commands ran with cwd `C:/dev/baseline-task-evals-20261021-cde21c0d/sveltia-field-1/site`, Node v24.21.0. Dependencies were already installed; no install or upgrade was performed.

| Command | Result |
| --- | --- |
| `npm.cmd run check:art-direction -- --require-record` before edits | PASS; existing saved record is structurally valid. |
| `.agents/skills/impeccable/scripts/impeccable.cmd context --target 'src/pages/posts/[...id].astro'` | PASS; narrow refinement of incumbent implementation allowed. No PRODUCT.md/DESIGN.md was invented. |
| `npm.cmd run verify` | FAIL: lint, CSS contracts, art-direction check and token audit passed; tests were 39 PASS / 1 FAIL. The sole failing assertion is `tests/sveltia-config.test.mjs:20`, which requires the old exact field-name list and rejects the newly requested `readingTime`. The chained command stops before typecheck. |
| `npm.cmd run typecheck` separately | PASS: 38 files; 0 errors, 0 warnings, 4 existing unused-import hints in contact/services routes. |
| `npm.cmd run build` | PASS: 9 static pages, including both new articles and existing Welcome; native image optimization succeeds. Automatic postbuild release-artifact check passes. |
| `npm.cmd run check:dev-tools` | PASS: production artifact excludes styleguide, fixture specimens and server entrypoint. |
| `.agents/skills/impeccable/scripts/impeccable.cmd detect --json 'src/pages/posts/[...id].astro'` | PASS: output `[]`. |
| `node ../acceptance.mjs` | PASS: executes the authored schema using installed Astro Zod (inert loader registration/image stub), checks editor field options, and uses Chromium against a local HTTP server serving fresh `dist/`. Accepts absent, 1, 5, 60; rejects 0, 61, 1.5, -1, strings, null and boolean. |
| Browser portion of `node ../acceptance.mjs` | PASS: both samples and Welcome return 200; exact headings/copy/dates, label presence/absence, no empty header paragraphs, listing links, existing home/services/about/contact routes and Northline identity, skip-link keyboard navigation, no page errors, and no horizontal overflow at 390, 768 and 1440 pixels. |
| `git diff --check` | PASS. |

Baseline verification scripts and tests were left unchanged as instructed. The outstanding fixed-list test is a real verification failure, not a successful full verify. The task-specific acceptance script is outside the site repository, in this trial directory; it does not modify or bypass baseline checks.

The first pre-edit browser navigation returned connection refused while Astro was starting; retry succeeded. Two exploratory reads used nonexistent guessed route filenames; route discovery then found the real `[...id].astro`. Neither issue affected the final verification.

## Browser evidence

All screenshots are in `C:/dev/baseline-task-evals-20261021-cde21c0d/sveltia-field-1/`:

- `before-welcome-390.png` — pre-edit incumbent article.
- `after-field-notes-390.png`, `after-field-notes-768.png`, `after-field-notes-1440.png`.
- `after-practice-update-390.png`, `after-practice-update-768.png`, `after-practice-update-1440.png`.
- `after-welcome-390.png`, `after-welcome-768.png`, `after-welcome-1440.png`.

Visually inspected Field notes at 390/768 and Practice update at 1440 after capture. The added line uses existing article typography and stack spacing; identity and navigation retain the incumbent styling. The absent-value example goes directly from its date to its body, without a blank reading-time label. Automated browser assertions cover all nine captured states. This is scoped visual acceptance, not a claim of a full-site accessibility audit or styleguide recalibration.

## Assumptions, clarification and acceptance boundary

- No clarification was needed. Interpreted “draft-free” as explicit `draft: false`; filenames provide the requested slugs through the existing native loader. The optional editor-supplied value is shown on article detail pages; no automatic estimator or listing redesign was requested.
- An omitted frontmatter value represents empty. Explicit null/string/empty-string frontmatter is rejected by the numeric schema; Sveltia's existing empty-field omission setting supplies the supported representation.
- No deployment or live GitHub/Sveltia account was available or needed. No external writes, login, save/clear round trip, Git commit from Sveltia, upload, rebuild webhook or logout was attempted. Existing repository/auth placeholders remain untouched. Static schema/config/build/browser acceptance does not certify that credentialed workflow.
- No other trial folders, evaluation criteria or the original checkout were read. No agents were spawned and no external services were mutated.
