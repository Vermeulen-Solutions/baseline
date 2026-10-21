# Northline Planning — local delivery notes

Completed 2026-10-21 in `C:/dev/baseline-task-evals-20261021-cde21c0d/static-new-2/site`.

## Completed scope

- Generated a fresh Baseline `static` profile from this trial's SOURCE. Original SOURCE remains clean (`git -C ../source status --short` produced no changes). No fixture history, baseline scripts or external services were changed.
- Four English routes: `/`, `/services/`, `/about/`, `/contact/`, plus a proper 404 page. Starter posts and their sample content were removed from the client site.
- Git-owned typed Markdown `pages` and `services` collections, native Astro `getStaticPaths()`/`render()`, shared SiteShell, Base, Section, Container and RichText. All supplied copy and service descriptions retained.
- Forest green #215846, warm paper surfaces, Georgia/system sans, typographic name, visible wrapping navigation, ruled service list and direct email actions. No photographs, generated images, invented proof, forms, browser CMS, accounts, tracking or deployment.
- Saved site decisions and Art Direction Record in AGENTS.md, product/design records and maintenance instructions in README.md. Calibrated actual shared components through the isolated styleguide fixture build before page assembly.

## Commands and actual results

| Command / check | Result |
| --- | --- |
| `npm.cmd run init:profile -- --profile static --out <SITE>` from SOURCE | PASS; 164 generated files; source commit 44ed9d438461ba2dc49da8dca6b13356348bf6ae; sourceTreeDirty false |
| `npm.cmd install` in SITE | Completed; independent package-lock.json created; Windows cleanup warning for optional WASM package directory; one high toolchain advisory reported, see limitations |
| `npm.cmd run design:tokens -- --init-client --lane editorial-paper` | PASS after installation; pruned starter exceptions; then customized accent/record to supplied brand |
| `npm.cmd run check:art-direction -- --require-record` | PASS before page implementation after correcting record/palette setup |
| `npm.cmd run test:design` | PASS; 19 tests |
| `npm.cmd run fixtures:build`, `npm.cmd run fixtures:serve` | PASS; inspected styleguide at 390, 768 and 1440 CSS pixels through http://127.0.0.1:4349/_styleguide/ |
| `npm.cmd run verify` — final run | PASS: script/template lint; CSS contracts; art direction; 14 contrast pairs; 39 tests; Astro check 32 files, 0 errors/warnings/hints |
| `npm.cmd run build` — final run | PASS; four requested pages and 404; release artifact checker passed |
| `npm.cmd run check:dev-tools` | PASS; no styleguide route, fixture specimens or server entrypoint in release |
| `npm.cmd run design:tokens -- --write-calibration` | PASS; final saved-source token evidence in audit/component-calibration.md |
| `node audit/browser-review.mjs` | PASS; 16 route/viewport combinations, keyboard skip/focus, reduced motion, 200% root text plus expanded text spacing, HTTP status and public page checks |
| Impeccable mechanical detector on Base and route template | `[]`; no source findings; no browser overlay claimed |
| `npm.cmd audit --json` | Reported one high advisory affecting pinned development dependency sharp 0.35.4; report saved |

## Browser and visual evidence

Local production preview used: `http://127.0.0.1:4373/` (stopped after verification). Restart from SITE using `npm.cmd run preview -- --host 127.0.0.1 --port 4373`. Development used port 4372; isolated fixtures used port 4349; these temporary servers were stopped.

- `site/audit/browser-review.json`: all four routes return 200 at 320, 390, 768 and 1440 CSS pixels, one h1 each, correct active navigation and email action, no horizontal overflow, forms or external scripts. No page errors.
- `/_styleguide/`, `/posts/`, `/missing/` return 404 on production preview.
- `site/audit/home-390.png`, `home-768.png`, `home-1440.png`.
- `site/audit/services-390.png`, `services-1440.png`.
- `site/audit/about-390.png`, `about-1440.png`.
- `site/audit/contact-390.png`, `contact-1440.png`.
- `site/audit/keyboard-focus.png`, `text-stress-final.png`.
- `site/audit/styleguide-{390,768,1440}.png`, viewport crops `styleguide-top-{390,1440}.png`, `styleguide-layout-{390,1440}.png`.
- `site/audit/visual-review.md`: bounded Impeccable review and concrete fixes. Explicitly single-context because this assignment prohibited delegation.

All final page captures were inspected. Shared footer gutter alignment was fixed. A home heading overflow under enlarged text was fixed with shared heading wrapping; final stress check passes. Initial styleguide-mobile.png/styleguide-desktop.png captured a development 404 and are failed-path evidence, not calibration evidence. Initial text-stress-before.png records the resolved overflow.

## Assumptions and clarification

No clarification was needed. The task explicitly supplied sufficient content and authorized complete local delivery without stage-by-stage continuation requests. Editorial Paper lane, Georgia/system sans pairing, balanced density, no imagery or motion, and shared responsive spacing were reversible implementation assumptions, not separate human approvals. The brief's system-font requirement takes precedence over general skill preferences for sourced display fonts.

SITE_URL is unset because no public domain exists. No canonical origin, production host, delivery integration, or infrastructure account was invented. The supplied email is preserved exactly as a mailto destination; no message was sent and no email-client launch or delivery was tested.

## Limitations and recovered checks

- Actual browser zoom, screen-reader/assistive technology and a full accessibility conformance audit were not performed. Narrow reflow, keyboard, reduced motion, text resizing/spacing and automated contrast checks are the observed evidence.
- Development `/_styleguide/` returned 404 despite the normal dev invocation. Used the supported isolated fixtures workflow successfully; did not alter baseline scripts to conceal or fix the issue.
- Early art-direction checks failed for untouched neutral tokens and a malformed record edit; both were corrected before visual page templates. A token invocation raced the initial dependency install and failed; it succeeded after install. First verify identified a duplicate root-token block; consolidated to one authoritative root and the final verify passes. These were resolved implementation/setup errors.
- Preview initially refused a second instance while fixtures were running. Stopped only this site's fixture preview through Astro, then started the production preview.
- Initial keyboard harness incorrectly treated the document body between tab cycles as an interactive focus failure; corrected the assertion to examine anchors. The skip link reached main and all focused anchors had solid outlines.
- `npm audit` reports sharp <0.35.5 affected by GHSA-wq5f-xc86-pv6w. This is the starter-pinned development image toolchain; no client content images are processed and no public server runtime is shipped. Dependencies were not silently upgraded during this task. See `site/audit/npm-audit.json`.
- No deployment or external mutations were performed. The deliverable is the local source plus verified `site/dist/`.
