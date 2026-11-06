## Plan

**Starting point.** The project root is the EmDash starter. It has no `baseline.config.json`, so it is not a generated static site and should not be edited in place. AGENTS.md says to generate a new static project into an empty folder and work there. The generated project has its own AGENTS.md and package scripts, and those govern the build once it exists. Commands named in this plan are checked against that project's `package.json` before running.

**Profile: `static`.** The developer maintains the content, the owner sends changes by email, and nothing asks for browser editing or a database. `static-sveltia` is rejected because the owner does not edit in a browser. `emdash` is rejected because no CMS is needed.

**Track: Express.** The site has five routes (home, classes, timetable, about, contact), one locale (French) and at most one data collection. It becomes Standard if any of these are true: online booking or payment, member accounts, a second language, or individual class detail pages that add route archetypes.

**Generation (no files changed yet).** From a Baseline checkout, in PowerShell: `npm.cmd run init:profile -- --profile static --out <new empty folder>`. Then `npm.cmd install` creates the project lockfile, which should be committed (only when the user asks) before using `npm.cmd ci`. Set `<html lang="fr">` in the shell. Single-locale sites do not need the i18n routing in `docs/internationalization.md`; adding English later would be a Standard-track change.

### Checkpoint A: brief, platform and content (Stages 1 to 3)

- **Load now:** `new-site-workflow/references/brief-platform-content.md` and `decisions-and-release.md` (before the first owner question). Load `discovery-and-content.md` when drafting page briefs.
- **Ask in chat, one batch of at most three:**
  1. Will visitors book or pay online for classes or trials? A yes moves the project to Standard and adds an integration decision. Recommendation: contact or booking-link only for now.
  2. Where should contact-form messages go, and is a third-party form service acceptable? A static site needs an external endpoint. Recommendation: a form service that emails the owner.
  3. Do classes need individual pages, or is one classes list enough? Recommendation: one list page, which keeps the route count within Express.
- **Working assumptions, labelled and not asked:** French with formal *vous* throughout; the timetable is a typed data file so the developer can update it from emailed changes; photos are client-supplied and their credits are unknown.
- **Owner supplies later, not blocking local work:** address, phone, email, hours, prices, teacher bios, photo rights, the public domain (`SITE_URL`), social links, and privacy-notice wording for the contact form. Policy text is not drafted as final.
- **Gate:** brief, route inventory, content owners and a claim ledger are recorded. Missing proof gets honest placeholders marked as drafts, not invented testimonials or prices.

### Checkpoint B: art direction and calibration (Stages 4 to 4.5)

- **Assets:** keep the supplied logo unchanged. Do not load `brand-assets.md` unless a variant is requested. Run `npm.cmd run media:prepare -- --source <photos> --out .baseline/backups/images-001`, inspect `manifest.json` and the outputs, then copy eligible files into `src/assets/`.
- **Design surface:** no canvas was requested, so use HTML/browser concepts under `audit/visual-concepts/<round>/`. Mention once, in one line, that Brilliant, OpenPencil and Penpot exist if the owner wants a canvas. Do not make this a stop. Ask once whether they have visual references; offer the prompt libraries only if they say they are short on inspiration.
- **Load now:** `site-art-direction/SKILL.md`, `references/design-iteration.md` (read) and `references/aesthetic-lanes.md`.
- **Decision to ask:** present two or three structurally different directions side by side (`index.html` with A/B/C, at 1440×900 and 390×844), each passing the concept quality-gate table, and ask the owner to choose one. Working recommendation: a calm, editorial lane suited to a yoga practice; confirm against `aesthetic-lanes.md`.
- **Spacing:** explain shared responsive spacing with balanced density in the handoff. Do not ask a separate question.
- **Record:** write the `## Art Direction Record` in AGENTS.md. Then run `npm.cmd run design:tokens -- --init-client --lane <lane>` (or `--seed-accent <hex>`) and refine tokens in `src/styles/global.css`.
- **Gates before visual implementation:** `npm.cmd run check:art-direction -- --require-record` passes. Then `npm.cmd run design:tokens` and `npm.cmd run test:design`, if the generated scripts include them. Calibrate primitives on `/_styleguide`, record the results in `audit/component-calibration.md`, and run `npm.cmd run design:tokens -- --write-calibration`.

### Checkpoint C: representative pages, critique and verification (Stages 5 to 6)

- **Load now:** `astro-site-design/SKILL.md` and its references for responsive architecture, accessibility, primitives and rollout verification. Load `impeccable` for the critique pass. Load `delivery-evidence.md` for owner-editing and page-loading evidence.
- **Build order:** shell and home page first, then the classes list (photo-led), then timetable, about and contact.
- **Pacing:** plan each page's section sequence first so no two adjacent sections are identical three-column card grids.
- **Timetable:** use a native table with real headers and a caption, and allow horizontal scrolling on small screens without losing the table structure.
- **Contact:** labelled fields, clear errors, and the form approach the owner chose.
- **Copy:** draft French at real length in `src/content/` files, using `vous` consistently and typographic spaces before `:`, `;`, `?` and `!`. Load `copywriting.md` when writing. Mark drafts clearly and show them to the owner in chat for approval before treating them as final.
- **Images:** use `ResponsiveImage` from `src/assets/`. Write meaningful alt text, and use `alt=""` for decorative images.
- **Gate:** all five routes and the 404 page render with real or clearly labelled content at 390, 768 and 1440 px. Findings that recur on two or more routes are fixed in shared styles or components.
- **Commands, in order:**
  - During edits: `npm.cmd run verify:fast`.
  - Before handoff: `npm.cmd run verify`, `npm.cmd run build`, `npm.cmd run check:dev-tools`, and `audit:html` if the generated `package.json` provides it.
  - Confirm `dist/` has no `/_styleguide` route and no server adapter. Confirm missing paths return HTTP 404 with no SPA rewrite.
  - Browser checks, using the installed Playwright and headless Chromium against the build or the URL Astro prints: each route at three widths, keyboard focus, reduced motion, and no horizontal page scroll at 390 px. If any client JavaScript is added (for example a mobile menu), listen to `pageerror` and `console.error` and expect zero exceptions.
  - Visual regression is optional, local-only on Windows, and follows `docs/visual-regression.md`.
- **Close-out:** `new-site-workflow/references/site-maintenance.md` completion register; `rollout-verification.md` for browser evidence.

### Release (Stage 7): out of scope for now

Deploying `dist/`, DNS, the domain and `SITE_URL`, and the form-service account each need their own authorization. The delivery default is a verified local build. The final report should say: verified local build; pending owner copy approval, form destination, privacy text, hosting and domain.

### Skills not loaded

EmDash specialists, WordPress migration skills, the plugin skills, and the Brilliant, OpenPencil, Penpot and OpenDesign specialists stay unloaded unless the owner chooses that surface or a CMS becomes part of the scope.

### Reporting

At each checkpoint, report the completed scope, observed evidence, unresolved decisions and the next authorized action. Label every assumption. A saved record or passing check is not owner approval.

## Files read

1. AGENTS.md
2. README.md
3. .agents/skills/new-site-workflow/SKILL.md
4. .agents/skills/new-site-workflow/references/express-track.md
5. .agents/skills/new-site-workflow/references/brief-platform-content.md
6. .agents/skills/new-site-workflow/references/decisions-and-release.md
7. .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
8. .agents/skills/new-site-workflow/references/build-verify-launch.md
9. .agents/skills/site-art-direction/SKILL.md
10. .agents/skills/site-art-direction/references/design-iteration.md
11. docs/platform-profiles.md
12. docs/internationalization.md
13. .agents/skills/site-art-direction/references/brand-assets.md
14. docs/media-preparation.md
15. .agents/skills/new-site-workflow/references/copywriting.md
