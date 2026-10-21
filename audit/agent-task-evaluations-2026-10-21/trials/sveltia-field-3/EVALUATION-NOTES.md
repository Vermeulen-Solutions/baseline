# Optional post reading time

Completed on 2026-10-21 inside this trial only.

## Completed scope

- Added optional `readingTime` to the native Astro Posts collection: numeric whole minutes, inclusive range 1–60. Missing and null values are valid; fractions, out-of-range numbers, numeric strings, empty strings and other malformed values fail validation.
- Paired the Sveltia Posts form with an optional number field (`value_type: int`, `min: 1`, `max: 60`, `step: 1`) and no default. Preserved the existing `omit_empty_optional_fields: true` setting and every unrelated field/backend setting.
- Article headers conditionally render `5 min read` when present, with no label or empty paragraph when absent. Existing tokens, article spacing and primitives remain unchanged.
- Added published `field-notes` and `practice-update` Markdown posts with the exact requested title, description, date and body. Field notes has reading time 5; Practice update has none. Both have `draft: false` and appear in the public Posts listing.
- Updated the form contract regression test, added real collection-schema behavior tests, and documented the editing contract in site docs/AGENTS.md. No checks were removed, disabled or weakened.
- Confirmed the existing Welcome content, identity/navigation config, Base layout, stylesheet, dependency manifest and lockfile are unchanged from HEAD.

## Actual commands and results

Commands below ran from `C:/dev/baseline-task-evals-20261021-cde21c0d/sveltia-field-3/site`.

| Command | Result |
| --- | --- |
| `node --version` | v24.21.0 |
| `npm.cmd run check:art-direction -- --require-record` (before implementation) | Passed; existing Art Direction Record structurally valid. |
| `npm.cmd run build` (before implementation) | Passed; 7 pages, native optimized hero, release artifact postbuild check passed. Used to inspect the existing article presentation. |
| `npm.cmd run verify` (after feature/test changes) | Passed: script/template lint, CSS contracts (27 inputs), art direction, token audit (14 contrast pairs), all 43 tests, and Astro check. Astro check reported 0 errors, 0 warnings, 4 hints for existing unused Grid/Card imports in services/contact; those unrelated pages were not edited. |
| `npm.cmd run build` (after feature/test changes) | Passed; 9 pages including both new posts, optimized legacy hero images, release artifact postbuild check passed. |
| `npm.cmd run check:dev-tools` | Passed; no styleguide route, fixture specimens or server entrypoint in production output. |
| `npm.cmd run preview -- --host 127.0.0.1 --port 4383` | Started local production-output preview for browser checks. Stopped with Ctrl+C after checks. A final fetch rejection confirmed port 4383 no longer responds. |
| `node ../browser-check.mjs` | Passed in headless Chromium: Field notes, Practice update and Welcome at 390, 768, 1440 pixels; content and conditional labels, no horizontal overflow, native legacy hero load, post listing links, existing public route responses, served admin config, keyboard skip-to-main and visible navigation focus, no page errors. |
| `git diff --check` | Passed. |
| `git diff --exit-code HEAD -- src/config/site.ts src/layouts/Base.astro src/styles/global.css src/content/posts/welcome.md package.json package-lock.json` | Passed with no diff. |

The schema tests import the actual collection configuration, with only Astro's virtual `defineCollection` wrapper mocked for Node and an image-helper stub. They verify missing/null values, accepted 1/5/60, and rejected 0/-1/61/1.5/string/boolean/NaN/Infinity cases. The Sveltia field contract test keeps its exact field inventory and all existing assertions, adding the requested field and bounds.

## Browser evidence

Screenshots are under `C:/dev/baseline-task-evals-20261021-cde21c0d/sveltia-field-3/screenshots/`:

- `welcome-before-desktop.png`: initial 1440px reference, visually inspected.
- `field-notes-390.png`, `field-notes-768.png`, `field-notes-1440.png`: visually inspected; requested label and established hierarchy/spacing preserved.
- `practice-update-390.png`: visually inspected; no reading-time label or blank gap.
- `welcome-390.png`: visually inspected; existing image and article reflow preserved.
- Also captured `practice-update-768.png`, `practice-update-1440.png`, `welcome-768.png`, `welcome-1440.png`; browser DOM/overflow assertions passed at these widths.

The reproducible browser check is `C:/dev/baseline-task-evals-20261021-cde21c0d/sveltia-field-3/browser-check.mjs`. It requires the local preview running on port 4383.

## Assumptions, limitations and clarification

- The existing post filename supplies the slug, so the requested URLs are `/posts/field-notes/` and `/posts/practice-update/` without introducing a new slug field.
- Reading time is editor supplied, not calculated from body text. Display is on the article detail template; the existing listing design is preserved.
- Empty editor values remain compatible through the existing optional-field omission setting and explicit schema acceptance of null. Arbitrary string frontmatter is not coerced into numbers.
- Consulted the installed `astro-site-design` skill, Astro Docs MCP content-schema guidance, and the official [Sveltia number-field documentation](https://sveltiacms.app/en/docs/fields/number) for the integer/range/empty-value contract.
- Local source, schema, form-contract, static build and public-browser acceptance are complete. No deployment, live GitHub account, OAuth/PAT login, remote save/upload, publishing rebuild, or logout was performed or certified. The public admin HTML/config response was checked; authenticated Sveltia form interaction was not exercised. The existing repository placeholder and authentication settings are preserved.
- No clarification was needed. No external services were mutated, no messages sent, no subagents used, and no servers remain running from this task.
