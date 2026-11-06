# H-T1-k7 work plan

## Plan

**Starting position.** site-k7 is the EmDash foundation. It has no `baseline.config.json` and no profile receipt, and its `package.json` carries the EmDash runtime. The static profile cannot be applied in place. I would generate a new static project into a new, empty folder with `npm.cmd run init:profile -- --profile static --out <new-dir>` and leave site-k7 unchanged. I would confirm the folder name with the developer before running it, because the generator writes files.

**Profile: static.** The owner emails changes, the developer maintains Markdown, and nothing needs a database, forms backend or browser editor. I would not choose static-sveltia unless the owner wants to edit in a browser, and I would not choose emdash. Changing profile later is a migration, so I would settle this at Checkpoint A with one question: will the owner ever edit text in a browser?

**Track: Express.** The brief fits the Express heuristics: 5 routes (home, classes, timetable, about, contact) against a limit of 6; about 2 collections (classes, timetable entries) against a limit of 3; one locale (French). Two parts need care: the timetable is a schedule, and the contact form raises a delivery decision. Either one would move the work to Standard only if booking or payments, a second language, or a large class catalogue appear.

**Design surface.** No canvas was requested, so the default is HTML/browser concepts. Brilliant, OpenPencil and Penpot are presented once as options at Checkpoint B. If the owner does not answer, HTML stays the default. The Brilliant, Pencil and open-design MCP servers failed to connect in this session (Brilliant with ECONNREFUSED, the other two with timeouts or a closed connection). None is needed for the HTML default, but each would need fixing before its canvas path.

### Checkpoint A: brief, platform and content (Stages 1 to 3)

Work:
- Record the brief in AGENTS.md: purpose, the main visitor action (book a trial class or make contact), audience, and labelled assumptions.
- List the routes with their archetypes: home (landing), classes (listing, optional detail), timetable (schedule), about (editorial), contact (form).
- Define the content model with native Zod schemas in `src/content.config.ts`: a `classes` collection (name, level, description, duration, image, order) and timetable entries (day, start and end time, class reference, teacher, room, cancellation flag). Site identity and navigation live in `src/config/site.ts`.
- Draft French copy at realistic length, using a consistent "vous" register and French typographic spacing. Mark every draft as a draft. Do not invent prices, teacher bios, addresses, testimonials or class numbers.
- Take an inventory of the logo (format, whether a vector master exists) and the photos (subject, who appears in them, usage rights).
- Set a single locale: `lang="fr"` on the document, no locale routing. The internationalization guide is written for EmDash, so only its single-locale point applies here.

Ask the owner (two or three at a time, grouped):
1. Will you ever edit text yourself in a browser, or will you always email changes? The default is email, which keeps the project static.
2. Where should contact messages go, and is booking external (a link) or absent? If the form has no delivery destination yet, it is shown as not yet connected and never presented as working.
3. Which facts can be published, and who signs them off: prices, weekly schedule, levels, teachers, address, trial offer?
4. Which photos may be used, whether people shown have consented, and how they should be credited. Is a vector logo available?
5. Whose voice does the site use: "I" as the teacher, or a studio name? And what is the owner's working language for review material? I would assume French and say so.

Handoff: write the Express Checkpoint A handoff (platform, routes, collections, open questions).

### Media gate (before any image enters the project)

- Keep the full-size originals outside the repository and out of Git.
- Run `npm.cmd run media:prepare -- --source <photos-folder> --out .baseline/backups/images-001`. The logo may need a reviewed `preserve` override with a reason if it is SVG, so pass it through `--overrides`.
- Inspect `manifest.json` and any `review` or `rejected` entries. Copy only the eligible `upload/` files into `src/assets/`. Give every meaningful image real alt text.

### Checkpoint B: art direction and calibration (Stages 4 to 4.5)

- Lane: nothing in the four lanes fits yoga well. I would start from Editorial Paper and adapt it: a warm bone canvas, a serif display with an italic accent, hairline rules, and spacious density. The anti-patterns would be neon or glass effects, bright action colours and generic wellness stock imagery. The narrative metaphor would be something like "a quiet studio in morning light", which the owner must confirm. If the owner wants a different identity, the choice is Custom / existing brand with a stated rationale.
- Timetable: plan it as a day-by-day index on desktop that stacks cleanly on a phone. Read the ground UX anatomy for schedules before styling it.
- Concepts: build two or three structurally different directions as HTML files under `audit/visual-concepts/<round>/` (direction-a, direction-b, direction-c), with an index comparison page. Render each at 1440x900 and 390x844. Fill the concept quality gate table. Ask for references only once, and offer the prompt libraries only if the owner says they have none.
- Ask the owner to choose one direction, and to confirm the Art Direction Record and which parts are approved versus assumed.
- Layout spacing: explain the shared responsive defaults in one short paragraph, with balanced density unless the brief says otherwise. Do not add a separate spacing question.

Commands, in order:
1. `npm.cmd run design:tokens -- --list-lanes` to confirm the lane ID.
2. `npm.cmd run design:tokens -- --init-client --lane <lane>`, or `--seed-accent <hex>`. Then refine `src/styles/global.css`.
3. Write the complete `## Art Direction Record` in AGENTS.md using the exact schema. Scaffolding with `--write-record` is allowed, then the prose is refined by hand.
4. `npm.cmd run check:art-direction -- --require-record`. This must pass before any site-specific visual work.
5. `npm.cmd run design:tokens` and `npm.cmd run test:design` (contrast pairs, fluid clamp bounds, font faces).
6. `npm.cmd run dev`, then open `/_styleguide/` with the trailing slash. Calibrate buttons, headings, cards, the timetable row, form controls and the image frame at narrow and wide widths.
7. Record observations in `audit/component-calibration.md`, then run `npm.cmd run design:tokens -- --write-calibration`.

### Checkpoint C: build and verify (Stages 5 to 6)

- Build in this order: shell (SiteShell, header, footer, landmarks, skip link), then home and timetable as the representative pages, then classes, about and contact.
- Use `ResponsiveImage` with `src/assets` metadata. Mark the hero with `loading="eager" fetchpriority="high"`.
- Contact form: labelled native fields, reason-specific error messages and a status region. Do not claim delivery until a destination exists.
- Keep JavaScript to what is required. If a timetable filter or a menu toggle is added, it needs the headless checks below.
- Impeccable is not installed in this checkout. There is no impeccable folder under `.agents/skills`, and only its licence file sits under `docs/licenses`. Do not run `sync:impeccable` without the developer's approval, because it is an upstream refresh. The critique runs manually against the five-point rubric, and I would report it as manual.

Gates:
- During edits: `npm.cmd run verify:fast`, if the generated project provides it.
- Before handoff: `npm.cmd run verify`, `npm.cmd run build`, `npm.cmd run check:dev-tools`. Run `npm.cmd run audit:html` only if the generated project provides it, because AGENTS.md lists it for the EmDash foundation.
- In `dist/`, confirm that `/_styleguide` is absent, that unknown paths return 404 without an SPA rewrite, and that there is no server adapter or database. Check that metadata is correct, and that `SITE_URL` is set or URL-dependent metadata is omitted.
- Browser acceptance with headless Chromium through the installed Playwright runner: widths 375, 390x844, 768 and 1440x900. Check zero horizontal overflow, awkward one-word headings, the keyboard path, focus visibility, reduced motion, and zero `pageerror` or `console.error` entries if any JavaScript is added. Test rapid clicks and back and forward navigation for any interactive element.
- Record the evidence in project notes. The EmDash screenshot harness does not apply to a static project.

Then: report the preview URL and the checks actually run. List the content gaps (prices, bios, photos awaiting consent) as owner follow-ups.

### Stage 7: delivery (not yet authorized)

The local verified build is the default endpoint. Hosting, domain, DNS, form service and deployment each need their own authorization. At the final handoff I would ask one question: where should it be hosted, and who controls the domain? A rebuild is needed for every content change, so I would note who runs it.

### Skills and references, loaded when needed

Already loaded, with the stage they serve:
- Setup and routing: AGENTS.md, README.md, `docs/platform-profiles.md`, `package.json` scripts, `new-site-workflow/SKILL.md`, `site-art-direction/SKILL.md`, `astro-site-design/SKILL.md`.
- Stages 1 to 3: `new-site-workflow/references/discovery-and-content.md`, `new-site-workflow/references/copywriting.md`, `docs/internationalization.md` (single-locale point only).
- Stage 4: `site-art-direction/references/design-iteration.md`, `site-art-direction/references/aesthetic-lanes.md`, `docs/media-preparation.md`.
- Stage 6 acceptance: `astro-site-design/references/rollout-verification.md`.

Load before their stage:
- Stage 3 to 4: `astro-site-design/references/landing-page-archetypes.md` for the home page. Confirm it exists in the generated project first.
- Stage 4.5: `astro-site-design/references/fluid-tokens.md`, `astro-primitives.md` and `responsive-architecture.md`, plus `accessibility.md` before the contact form and navigation.
- Only if needed: `site-art-direction/references/brand-assets.md` for logo variants, `site-art-direction/references/token-handoff.md` for later shared-token changes, `capability-routing.md` for motion or illustration, `astro-site-design/references/interaction-motion.md` for motion, and `screen-reader-checks.md` if scripted interaction is added.
- Stage 5: `new-site-workflow/references/delivery-evidence.md` for the owner-task map.
- Stage 6: `new-site-workflow/references/site-maintenance.md` to reconcile the completion register.

Not loaded, because they do not apply: every EmDash skill (`building-emdash-site`, `emdash-content-modeling`, `emdash-cli`, `emdash-site-setup`, `emdash-production-cutover`, `creating-plugins`, `wordpress-to-emdash-content`); the Brilliant, OpenPencil, Penpot and OpenDesign skills unless the owner picks that surface; `component-quarantine.md` (no URL migration); `visitor-research.md` (not requested); `parallel-delivery.md` (no delegation needed).

### Notes for the developer

- The `express-track.md` reference named in some summaries is not in this folder, so the Express rules come from `new-site-workflow/SKILL.md`.
- Impeccable is missing, as described above.
- The generated static project may not include every script named here (`verify:fast`, `audit:html`). Check its `package.json` before running each one.

## Files read

1. AGENTS.md
2. README.md
3. docs/platform-profiles.md
4. .agents/skills/new-site-workflow/SKILL.md
5. .agents/skills/new-site-workflow/references/express-track.md (attempted; the file does not exist in this folder, so the read failed)
6. package.json
7. .agents/skills/site-art-direction/SKILL.md
8. .agents/skills/astro-site-design/SKILL.md
9. .agents/skills/site-art-direction/references/design-iteration.md
10. docs/media-preparation.md
11. docs/internationalization.md
12. .agents/skills/new-site-workflow/references/discovery-and-content.md
13. .agents/skills/new-site-workflow/references/copywriting.md
14. .agents/skills/site-art-direction/references/aesthetic-lanes.md
15. .agents/skills/astro-site-design/references/rollout-verification.md
