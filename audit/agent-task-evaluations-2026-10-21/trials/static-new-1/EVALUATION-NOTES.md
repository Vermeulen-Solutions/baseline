# Northline Planning — local delivery notes

Completed 21 October 2026. All work stayed inside this trial directory. SOURCE was used only for instructions, generation and read-only source-state verification; its Git working tree remains clean. No source history, baseline checker or baseline script was changed. No deployment, external mutation, outbound message, account, browser CMS, tracking or form was created.

## Completed scope

- Generated SITE from SOURCE with the Baseline `static` profile, receipt source commit `44ed9d438461ba2dc49da8dca6b13356348bf6ae`, generator 0.4.0.
- Built the four requested English routes: `/`, `/services/`, `/about/`, `/contact/`, plus the standard 404 document.
- Exact supplied Home and Contact headings, Home/About prose, three service names/descriptions and email destination are present. Every requested route has “Discuss your project” linking to `mailto:hello@northline.example.test`.
- Owner/assistant content editing is file based: `site/src/content/pages/*.md`, `site/src/content/services/*.md`, typed by `site/src/content.config.ts`. `site/src/config/site.ts` owns identity, navigation and email. Draft filtering is implemented. Starter posts were removed.
- Understated editorial styling uses system Georgia/sans stacks, #215846 forest green, warm light surfaces, responsive primitives and a typographic name. No photographs or invented testimonials, credentials, clients or statistics.
- Wrote site-specific decisions and the Art Direction Record to `site/AGENTS.md`; maintenance instructions in `site/README.md`; visual record in `site/DESIGN.md`; calibration and browser evidence in `site/audit/`.

## Commands and actual results

Commands ran from SOURCE for generation and from SITE for site checks, using npm.cmd on Windows and Node v24.21.0.

| Command/check | Result |
| --- | --- |
| `npm.cmd run init:profile -- --profile static --out <SITE>` | PASS, 164 generated files, static receipt |
| `npm.cmd install` | PASS, independent package-lock.json; npm cleanup warning and one high audit advisory noted below |
| `npm.cmd run check:art-direction -- --require-record` | Final PASS before client templates; initial neutral-palette rejection and a record-edit error were corrected without changing the checker |
| `npm.cmd run design:tokens -- --init-client --lane editorial-paper` | PASS after install completed; seeded lane and pruned sample exceptions; manually refined to the supplied green/system fonts |
| `npm.cmd run design:tokens -- --write-calibration` | Final PASS, saved-source evidence updated after final CSS |
| `npm.cmd run test:design` | PASS, 19 tests |
| `npm.cmd run fixtures:build` | PASS after representative Home implementation; earlier transitional run failed because removed starter posts were still imported |
| `npm.cmd run fixtures:serve` | PASS at http://127.0.0.1:4350; fixture styleguide 200 at 390/768/1440px, no measured horizontal overflow |
| `npm.cmd run verify` | Final PASS: script and template lint, CSS contracts, art direction, 14 contrast pairs, 39 tests, Astro check 35 files with 0 errors/warnings/hints |
| `npm.cmd run build` | Final PASS: 5 HTML documents (4 requested routes and 404), static output, release-artifact checker PASS |
| `npm.cmd run check:dev-tools` | PASS: no styleguide/fixture/server output in production |
| Impeccable `context --target src/pages/index.astro` | Ran once; direct project context and sufficient user brief used; no optional skill update performed |
| Impeccable `detect --json src/pages src/layouts/Base.astro src/components/ProjectAction.astro src/components/ServicesList.astro` | Empty findings list, `site/audit/impeccable-detector.json` |
| `node audit/review-browser.mjs` | Final PASS: 16 route/viewport combinations, all four navigation clicks, exact primary mailto links, one H1 per page, current-page navigation, skip-link activation, visible focus outline, no forms/executable public scripts/page errors; production missing route and styleguide return 404 |
| 320px text stress | Final PASS with 200% root text, expanded letter/word/line spacing. Initial forced-brand overflow was fixed, then the full browser pass repeated |
| `npm.cmd audit --json` | 1 high advisory: pinned dev dependency sharp 0.35.4, GHSA-wq5f-xc86-pv6w, fixed version reported as 0.35.5. No automatic force update or dependency churn performed |
| `git -C ../source status --short` | Empty output; SOURCE remains clean |

A first attempt to initialize tokens ran while npm installation was still in progress and could not resolve postcss; retry after successful installation passed. One Windows file-lock write was retried after stopping the dev server. An attempted grouped shell edit was rejected by command policy before execution; file changes used narrower operations afterward.

## Responsive and visual evidence

Production review used http://127.0.0.1:4312. It was launched with `npm.cmd run preview -- --host 127.0.0.1 --port 4312` and remains available for local inspection at handoff; stop with Ctrl+C in its terminal (tool session 63563), or Astro's local preview stop command from SITE. The fixture preview was stopped before production preview because Astro permits one preview per project.

- `site/audit/browser-review.json` — route/viewport details and keyboard/text-stress results.
- `site/audit/screenshots/home-1440.png` and `home-390.png`.
- `site/audit/screenshots/services-1440.png` and `services-390.png`.
- `site/audit/screenshots/about-1440.png` and `about-390.png`.
- `site/audit/screenshots/contact-1440.png` and `contact-390.png`.
- `site/audit/screenshots/keyboard-focus.png` and `contact-text-spacing-320.png`.
- `site/audit/screenshots/styleguide-390.png`, `styleguide-768.png`, `styleguide-1440.png`, and typography/control viewport captures.
- `site/.impeccable/review/desktop.png` and `mobile.png` duplicate final Home captures for design-review provenance.

All eight final normal route captures, the text-stress capture and keyboard capture were opened and visually inspected. Wide/narrow layouts show the correct copy, navigation and footer. The first round led to one batch of fixes: wrapping the enlarged brand, keeping action widths bounded and aligning header/main gutters. Final screenshots confirm those fixes. The Impeccable review was single-context because the task explicitly prohibited delegation; see `site/audit/design-review.md`.

## Assumptions, clarification and limits

- No clarification was needed. The assignment explicitly supplied sufficient content and authorized complete local delivery; no mandatory continuation prompts were introduced.
- Express track, balanced editorial density and shared responsive spacing were working assumptions. Sections separate topics, containers group copy, and service rows reuse shared tokens. No custom spacing-policy panel was added.
- Services and About headings were derived from the supplied service/consultancy description. No additional factual claims were authored.
- The generated dev `/_styleguide` URL returned 404 after trailing-slash normalization; unmodified isolated fixture build/serve provided calibration evidence instead. Fixture builds pin Noto Sans by design, so exact system stacks were checked again in the production browser pass. No baseline script or routing policy was altered to bypass that issue.
- `SITE_URL` was not supplied for local-only delivery; canonical and other public-origin metadata are intentionally omitted. No real hosting or mail-delivery claim is made.
- Keyboard automation and Chromium rendering were checked; actual browser zoom, screen-reader review, additional browser engines and full WCAG conformance certification were not performed. The 320px and root-text stress checks are not mislabeled as browser zoom.
- Email links were verified by destination only; no message was sent. No deployment or external service acceptance applies to this task.
- The inherited sharp advisory remains a dependency maintenance follow-up. The delivered public output is static HTML/CSS and uses no image uploads or server runtime.
