# H-T1-p9 work plan

## Plan

**Starting position.** The folder `site-p9` is the Baseline EmDash foundation: its root `package.json` is the CMS application and there is no `baseline.config.json`, so it is not a generated static site. Do not convert this root in place. The yoga site should be generated as a new static project into an empty directory, from a Baseline source checkout, with `npm.cmd run init:profile -- --profile static --out <new-empty-dir>`. All site work then happens in that generated folder and follows its own generated AGENTS.md. Note: the generated static AGENTS.md (`profiles/static/project/AGENTS.md`) is not present in this checkout, so its verify and release sections must be read from the generated project before those commands run.

**Profile: `static`.** The owner emails changes and the developer maintains the content, so nobody needs a browser editor or a relational CMS. `static-sveltia` is not chosen because no owner logins are needed; `emdash` is not chosen because there is no live canvas, MCP or relational need. Record the rationale in the generated AGENTS.md as a working assumption. Re-open the profile question only if the owner later wants to edit in a browser.

**Track: Express.** Five routes (home, classes, timetable, about, contact) are within the six-archetype limit. Collections (classes, timetable entries, optionally a settings file) stay within three. One locale (French). Switch to Standard if any of these appear: a booking or payment integration, an English locale, several teachers with separate pages or roles, or a timetable that must hold bookings or capacity.

**Checkpoints (Express).** Checkpoints are progress reports, not stops. Continue authorized work after each one and record assumptions.

- **Checkpoint A (Stages 1 to 3: brief, platform, routes and content model).** Work: synthesize the brief in AGENTS.md (audience, the main next action, which is most likely a trial class or an enquiry), define the route list, the classes and timetable collections with Zod schemas, and the draft French copy with owner status per block. Ask the owner, in one to three plain questions:
  1. Preferred visitor action: book a trial class, send an enquiry, or both?
  2. Timetable: is it weekly and fixed, or does it change often? Who will send updates, and in what form (table, PDF, email)?
  3. Contact: which email address receives enquiries, and is a contact form or a mailto link wanted?
  Also ask for the teacher's qualifications, class prices and the privacy wording for the contact form. Do not invent any of these; keep them as labelled drafts with an owner.
- **Checkpoint B (Stages 4 to 4.5: art direction and calibration).** Work: read the logo and photos, then propose one brief-led direction with a plain-language description. Offer the design surface once: no canvas was requested, so default to HTML/browser concepts, with Brilliant, OpenPencil and Penpot named as optional canvases. Note that the open-design and pencil MCP servers failed to connect in this session, so they cannot be used for a canvas right now; retry or fix them only if the owner asks for one. Ask the owner only about what changes the look: the colours and tone they want (calm, warm, editorial, etc.), and whether the logo colours are fixed. Use shared layout spacing with balanced density unless the brief says otherwise, and state that as an assumption. Ask once whether the owner approves the direction.
- **Checkpoint C (Stages 5 to 6: representative pages, critique and verification).** Work: build the shell and home first, then one page per remaining archetype (classes, timetable, about, contact). Run the visual critique and the content acceptance against each page's brief. Ask the owner to review the French copy, the photos and the timetable data before any publication, and to confirm the contact destination.
- **Stage 7 (cutover).** Out of scope for this plan. Hosting, domain and DNS are separate authorizations. Ask for them only after the local verified build, and say which action each approval would cover.

**Art Direction Gate (before any site-specific visual code).** Save the complete `## Art Direction Record` in the generated AGENTS.md, with Aesthetic Lane (from `site-art-direction/references/aesthetic-lanes.md`), Narrative Metaphor, Typography Pairing (fonts the project can legally serve), Token Physics (Canvas, Action/Accent, Borders, Spatial Density) and two or three semicolon-separated Site Anti-Patterns. Then run:

1. `npm.cmd run design:tokens -- --init-client --lane <lane>` (or `--seed-accent <hex>`), after checking the script exists in the generated `package.json`.
2. `npm.cmd run check:art-direction -- --require-record`. This must pass before visual implementation.
3. Calibrate the primitives on the local `/_styleguide/` URL (the trailing slash is required) and record observations in `audit/component-calibration.md`. A generated checklist is not browser evidence.

**Pre-implementation commands.** Commit the first lockfile created by `npm install` in the generated project. Then use `npm.cmd ci` for later installs. Do not run the EmDash-only `npm run doctor`, `audit:html`, `test:visual`, `site:register` or registry commands, and do not add CMS packages. Check each command name in the generated `package.json` before running it.

**Images (logo and photos).** Inspect each file first: a PNG extension does not say whether it is a photo, screenshot or logo. Keep full-size originals outside Git. Run `npm.cmd run media:prepare -- --source <folder> --out .baseline/backups/images-001` (static profile path). For the logo, if it is an SVG, use a reviewed `preserve` override with a reason in an overrides file, and treat the logo as a faithful brand asset. Inspect `manifest.json` and resolve any `review` or `rejected` entries before copying the `upload/` files into `src/assets/`. Write French alt text per photo, and ask the owner about rights, credit and whether the teacher's own photo is wanted on the About page.

**Implementation and verification gates (static).** During edits: `npm.cmd run verify:fast` (if present in the generated package.json). Before handoff, on a fresh build: `npm.cmd run verify`, `npm.cmd run build` and `npm.cmd run check:dev-tools`, then confirm `dist/` has no `/_styleguide` and no server adapter. Check 404 behaviour for a missing path with no SPA rewrite. If a client script such as a contact-form enhancement is added, run headless Chromium against the build and listen for `pageerror` and `console.error`. Browser checks run at 390, 768 and 1440 px for each page. Run `impeccable` critique on the representative and final routes. Do not run the Windows visual-regression harness: it is EmDash-only.

**Skills and references, loaded when each stage starts.**

- At start: `new-site-workflow` (SKILL.md) for the router and track decision. `decisions-and-release.md` before the first owner question.
- Stages 1 to 3 (Checkpoint A): `references/brief-platform-content.md`, `references/discovery-and-content.md`, `references/copywriting.md` for the French copy, `docs/platform-profiles.md` and `docs/site-delivery-workflow.md` (already read).
- Stage 4 (Checkpoint B): `site-art-direction` (SKILL.md, already read), its `references/aesthetic-lanes.md`, and `references/design-iteration.md` for the surface offer and concept review. `references/art-direction-and-calibration.md` for the gate and calibration, plus `astro-site-design` for calibration and layout.
- Stages 5 to 6 (Checkpoint C): `references/build-verify-launch.md`, `references/delivery-evidence.md` (owner task map for the static file edits), `docs/media-preparation.md`, and `impeccable` for critique. `docs/internationalization.md` only as a check that the single French locale stays simple: set `lang="fr"` and skip multi-locale routing unless a second locale is added later.
- Not loaded because they do not apply: all EmDash specialists (`building-emdash-site`, `emdash-content-modeling`, `emdash-site-setup`, `emdash-cli`, cutover and migration skills), `docs/forms-adoption.md` (EmDash native forms plugin; a static contact form needs an external provider chosen with the owner), and `wordpress-*` skills (no migration).

**Release and approvals.** Local verified build is the default endpoint. Commit, push, deployment, DNS changes and form-provider accounts each need their own owner authorization. Record unobserved checks (live form delivery, deployed 404, real browser on the owner's device) as pending.

## Files read

Paths are relative to the project root `site-p9`.

1. `AGENTS.md`
2. `README.md`
3. `package.json`
4. `docs/platform-profiles.md`
5. `docs/site-delivery-workflow.md`
6. `.agents/skills/new-site-workflow/SKILL.md`
7. `.agents/skills/new-site-workflow/references/express-track.md`
8. `.agents/skills/new-site-workflow/references/decisions-and-release.md`
9. `.agents/skills/new-site-workflow/references/brief-platform-content.md`
10. `.agents/skills/new-site-workflow/references/art-direction-and-calibration.md`
11. `.agents/skills/new-site-workflow/references/build-verify-launch.md`
12. `.agents/skills/new-site-workflow/references/delivery-evidence.md`
13. `.agents/skills/site-art-direction/references/design-iteration.md`
14. `docs/media-preparation.md`
15. `docs/internationalization.md`
16. `docs/forms-adoption.md`
17. `.agents/skills/new-site-workflow/references/discovery-and-content.md`
18. `.agents/skills/site-art-direction/SKILL.md`

Attempted but not present: `profiles/static/project/AGENTS.md` (read failed, file does not exist in this checkout). Directory listings (Glob) and a lookup for `baseline.config.json` (no match) were also run; no other files were opened.
