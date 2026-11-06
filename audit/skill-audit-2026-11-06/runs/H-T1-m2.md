# H-T1-m2 work plan: French yoga teacher website (five pages)

## Plan

### Starting position

- This checkout (site-m2) is the Baseline root. It has no `baseline.config.json`, so per AGENTS.md and the workflow it is the existing EmDash Node.js + SQLite foundation. Do not build the yoga site in this root.
- A static site is generated into a new, empty sibling folder with `npm.cmd run init:profile -- --profile static --out <parent>\<site-name>` (Windows PowerShell, from this checkout). The generated folder then has its own AGENTS.md, package scripts and receipt. Work only there from then on.
- Generation is a file-writing step. I would not run it during planning.

### Profile and track

- **Profile: `static`.** The developer maintains content in typed Markdown and the owner emails changes, so no browser editor, relational CMS or server runtime is needed. `static-sveltia` only if the owner later wants browser editing. `emdash` is not justified. Record this as a labeled assumption and confirm it in the Checkpoint A questions.
- **Track: Express.** Five routes (home, classes, timetable, about, contact) is within the six-route limit. The collections (classes, timetable sessions) are within three. There is one locale. Re-assess toward Standard only if the owner asks for bookings or payments, a members area, class detail pages, or an English version.
- **Locale: French only.** Set `<html lang="fr">`, French titles and descriptions, and French typographic spacing (non-breaking spaces before `:` `;` `?` `!`). No locale routing is needed. Confirm the chosen font covers é è ê ç à ù œ, which the font preflight checks.

### Checkpoint A: brief, content and routes (Stages 1-3)

- **Load:** `new-site-workflow/SKILL.md`, `references/express-track.md`, `references/brief-platform-content.md`, `references/discovery-and-content.md`, `references/copywriting.md`.
- **Work:**
  - Run core discovery (the brief is small). Record in the generated AGENTS.md: the priority visitor (complete beginners or returning students), the main action (book a trial class or send an enquiry), voice ("je" as the teacher or a studio name), and whether the teacher's photo is shown.
  - Write a compact page brief for home, classes, timetable, about and contact. Draft French copy at real length and label it as a draft.
  - Keep a claim ledger (claim, source, permitted use, owner). Do not invent prices, schedules, certifications, testimonials or legal text.
  - Plan the content model: a `classes` collection and a `sessions` collection (day, time, class, room) as file-owned Zod schemas in `src/content/`. This keeps the weekly timetable edits in one place.
- **Owner questions (in chat, at most three per round, plain language, in the owner's working language once confirmed):**
  1. Enquiries: where should the contact form go, and is a third-party form service acceptable? A static site has no server, so this needs the owner's approval before any service is connected. A mailto or phone fallback is an option.
  2. Classes and timetable: class types, levels, prices, trial offer, weekly schedule, location, and how often the timetable changes.
  3. Booking and domain: is booking external (link) or enquiry-only, and what is the public domain for `SITE_URL`?
- **Later, not blocking:** the owner supplies mentions légales and privacy text. The agent does not draft it as fact.
- **Gate:** brief, evidence inventory with content owners, route archetypes, profile and track recorded. Continue with labeled assumptions except for the form destination, which is a consequential open decision.
- **Handoff:** static profile, Express track, two collections, five routes, open items with owners.

### Checkpoint B: art direction and calibration (Stages 4-4.5)

- **Load:** `site-art-direction/SKILL.md`, `references/design-iteration.md`, `references/aesthetic-lanes.md`, `astro-site-design/SKILL.md`, `docs/site-working-rules.md`, `docs/font-preflight.md`.
- **Surface:** no canvas was requested, so the default is HTML/browser concepts under `audit/visual-concepts/round-1/`. Produce two or three structurally distinct directions (separate HTML files, not colour skins of one layout), an `index.html` comparison at 1440x900 and 390x844, a review shell, and the fixed concept quality gate table. Mention Brilliant (editable canvas, recommended only if asked), OpenPencil (local) and Penpot (shared cloud review) once, in one line. Proceed with HTML if there is no answer. Offer the prompt libraries only if the owner says they are short of references.
- **Owner decisions:** pick one direction, and name any fixed brand commitments (logo, colours, fonts). Ask once whether they have visual references they like.
- **Art Direction Record:** write it in the generated AGENTS.md with a lane from `aesthetic-lanes.md` (or Custom with rationale), a narrative metaphor, a typography pairing using locally served WOFF2 faces that cover French glyphs, token physics (canvas, action/accent, borders, spatial density), and two or three anti-patterns separated by semicolons. Explain layout spacing: shared responsive defaults, balanced density unless the brief says otherwise. Record whether each choice is approved or assumed.
- **Commands (check the generated package.json first):**
  1. `npm.cmd run design:tokens -- --lane <lane> --write --write-record` (or `--seed-accent <hex>`), then refine tokens in `src/styles/global.css`.
  2. `npm.cmd run design:tokens` and `npm.cmd run design:tokens -- --json` (contrast and font-source preflight).
  3. `npm.cmd run test:design`.
  4. **Gate:** `npm.cmd run check:art-direction -- --require-record`. No site-specific visual edits under `src/` or `public/` before this passes.
  5. `npm.cmd run dev`, then calibrate on `/_styleguide/` (trailing slash). Run `npm.cmd run design:tokens -- --write-calibration` and record observations in `audit/component-calibration.md`, including narrow and wide widths, keyboard focus and reduced motion.
- **Gate:** saved record passes the check, and the calibration record names which patterns are ready for pages.
- **Handoff:** the direction chosen, the approved versus assumed decisions, and the actual check results.

### Checkpoint C: build, critique and verify (Stages 5-6)

- **Load:** `astro-site-design` (already loaded), `new-site-workflow/references/build-verify-launch.md`, `references/delivery-evidence.md` (for the repeated class and session entries), `references/site-maintenance.md` if spacing or shared components need change, `docs/media-preparation.md`, `astro-site-design/references/responsive-architecture.md`, and `accessibility.md` for the form and navigation. `impeccable` is named for the critique pass.
- **Media:** run `npm.cmd run media:prepare -- --source <photos> --out .baseline/backups/images-001`. Inspect the manifest and the outputs, then copy only eligible `upload/` files into `src/assets/`. Keep originals out of Git. Process the logo as SVG only with the `preserve` preset and a recorded reason. Write French alt text for every meaningful image.
- **Build order:**
  1. Shell: `Base` and `SiteShell`, the five-route navigation, skip link, landmarks, French metadata, a 404 page, and `SITE_URL` once the domain is known.
  2. Representative routes first: home and classes. These exercise the collection, cards and calls to action.
  3. Timetable as a real table with a caption and a mobile reflow strategy that hides no content.
  4. About, then contact. Contact follows the owner's form decision, with no secrets in the repo and no simulated submission.
- **Interaction:** keep JavaScript minimal (a mobile navigation toggle only if needed). Do not add View Transitions unless required. If any client script or router hook is added, run headless Chromium against the build, listen for `pageerror` and `console.error` (both must be zero), and probe rapid clicks and BFCache restoration.
- **Browser acceptance:** widths 375 or 390, 768 and 1440. Check zero horizontal overflow, keyboard focus, reduced motion, awkward French heading wraps and image crops. Record the evidence in project notes. Visual regression is EmDash-only, so do not use it here.
- **Critique:** run `impeccable` on the representative routes first, then on the full set. Fix shared tokens and components before repeating a pattern.
- **Before handoff (generated project; check each script exists):**
  - `npm.cmd run verify:fast` during edits.
  - `npm.cmd run verify`, `npm.cmd run build`, `npm.cmd run check:dev-tools`.
  - `audit:html` only if the generated package.json has it.
  - Start `npm.cmd run preview` and confirm a missing path returns HTTP 404 with no SPA rewrite.
  - Confirm the build contains no `/_styleguide` route and no server adapter or database.
- **Do not run:** `doctor`, `site:register`, `db:*`, `media:upload`, `migration:verify`, `test:visual`, or any CMS command. These are EmDash-only.
- **Dependencies:** run `npm.cmd install` once in the generated folder to create its lockfile, commit that lockfile, then use `npm.cmd ci` from then on.
- **Stage 6 handoff:** the delivery default is a verified local build. Deployment, DNS and any form-service connection need explicit authorization. Ask about hosting only when deployment is wanted.

### Owner touchpoints

- **A:** form destination, class and timetable facts, booking, domain, voice.
- **B:** pick a direction, name fixed brand elements, share references once.
- **C:** review the French copy and the photos (accuracy, rights, alt text) and approve the final copy. No deployment question unless requested.

### Gaps to flag

- The root has no receipt, so it is the EmDash foundation. Build in the generated static folder, not here.
- `impeccable` is named by AGENTS.md but no `impeccable` skill is present in this checkout's `.agents/skills/`. Check the generated project. If it is missing, report the gap. Installing or syncing skills needs authorization.
- The generated AGENTS.md does not exist yet. Its own rules govern once generated.
- No client Art Direction Record exists in the root. Infrastructure exceptions in `audit/design-gate-exceptions.json` do not cover client visuals.

## Files read

Paths are relative to the project root (`site-m2`).

1. `AGENTS.md`
2. `README.md`
3. `docs/platform-profiles.md`
4. `.agents/skills/new-site-workflow/SKILL.md`
5. `.agents/skills/new-site-workflow/references/express-track.md`
6. `.agents/skills/new-site-workflow/references/brief-platform-content.md`
7. `.agents/skills/new-site-workflow/references/decisions-and-release.md`
8. `.agents/skills/new-site-workflow/references/art-direction-and-calibration.md`
9. `.agents/skills/new-site-workflow/references/build-verify-launch.md`
10. `package.json`
11. `.agents/skills/site-art-direction/SKILL.md`
12. `.agents/skills/astro-site-design/SKILL.md`
13. `.agents/skills/new-site-workflow/references/discovery-and-content.md`
14. `.agents/skills/new-site-workflow/references/copywriting.md`
15. `docs/site-working-rules.md`
16. `docs/media-preparation.md`
17. `docs/internationalization.md`
18. `docs/font-preflight.md`
19. `.agents/skills/site-art-direction/references/design-iteration.md`

Glob searches (not file reads): for `baseline.config.json`, `PROJECT.md`, `PROJECT.example.md`, `DESIGN.md`, `.agents/skills/*/SKILL.md`, `docs/*.md`, and for an impeccable skill under `.agents` (none found). The first search showed that `baseline.config.json`, `PROJECT.md` and `DESIGN.md` are absent.
