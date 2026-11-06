# Yoga teacher site (French, five pages): work plan

## Plan

### Profile and track

- **Profile: `static`.** The developer maintains content as typed Markdown and the owner emails changes, so no browser editor or CMS is needed. Sveltia and EmDash are not justified by the brief. Static output is a rebuild on each content change.
- **Track: Express.** Five routes (at most six), one locale (French), and at most three collections (classes and timetable). The brief names no booking, payment, accounts, roles or integrations. Move to Standard if online booking/payment appears, if English or another locale is added, or if the owner later needs editors.
- **Root folder caveat.** `site-q3` is the EmDash foundation. There is no `baseline.config.json` (no receipt), and AGENTS.md says absence means EmDash. Do not build this brochure in this root. Generate a fresh static project from a Baseline source checkout with `npm.cmd run init:profile -- --profile static --out <new empty directory>`, then work in that folder and read its generated AGENTS.md, which governs its verification and release. Tell the owner the destination folder when it is created.
- **Surface.** No canvas was requested, so the default is HTML/browser concepts. Offer Brilliant, OpenPencil and Penpot once at the concept checkpoint, as a choice, not a stop. The `open-design` and `pencil` MCP servers failed to connect. They are not needed on the HTML path, but report the failure if the owner picks a surface that depends on them.

### Checkpoint A: brief, platform and content schema (Stages 1 to 3)

- Record the brief, the visitor, the outcome (enquire or book a first class) and a labelled working assumption for French routes: `/`, `/cours`, `/horaires`, `/a-propos`, `/contact`. Put the facts in `AGENTS.md`. Do not create `PROJECT.md` unless it is adopted.
- Model collections in `src/content.config.ts` with Zod: classes (name, level, duration, description, image, alt text) and timetable entries (day, start time, class reference). Draft the French copy at real length and mark it as draft. Do not invent credentials, testimonials, prices or addresses.
- Ask the owner in chat, in one batch of three questions:
  1. Which email should receive enquiries, and do they want a contact form? A form needs an external form service and a privacy text from the owner.
  2. Do students book or pay online, and how often does the timetable change? Booking or payment would move this to Standard and re-open the platform decision. Frequent changes favour a simple timetable data file.
  3. Who supplies the facts and approved wording (bio, qualifications, prices, address, opening hours, photo rights), and does the owner want to appear by name or photo on the About page?
- Gate: brief, route inventory and content owner map are recorded. No visual work yet.

### Checkpoint B: art direction and calibration (Stages 4 to 4.5)

- Inspect the logo and photos. Build two or three structurally distinct HTML concepts in `audit/visual-concepts/round-1/` (`direction-a.html`, `direction-b.html`, `direction-c.html`) with real photos and copy excerpts. Add an `index.html` comparison at 1440x900 and 390x844, and fill the concept quality gate table.
- Ask the owner to pick one direction, and ask whether they are short on references. If so, offer the prompt libraries once. Ask for their favourite sites as references. Spacing uses the shared Express defaults with balanced density, recorded as an assumption.
- Save the Art Direction Record in `AGENTS.md`: aesthetic lane, narrative metaphor, typography pairing (confirm the fonts serve French accents), token physics, and two or three anti-patterns. Then run:
  - `npm.cmd run design:tokens -- --init-client --lane <lane> --write --write-record --write-calibration` (or `--seed-accent <hex>`)
  - `npm.cmd run check:art-direction -- --require-record` (must pass before any site-specific visual code)
  - `npm.cmd run design:tokens` and `npm.cmd run test:design` (contrast and fluid bounds)
- Calibrate primitives on `/_styleguide/` (trailing slash) with `npm.cmd run dev`. Record viewports, states and limits in `audit/component-calibration.md`.
- Gate: saved record plus passing gate, with calibration evidence. Concept files under `audit/visual-concepts/` are an allowed exception.

### Checkpoint C: representative pages, critique and verification (Stages 5 to 6)

- Build the home page first as the representative route, then one page per archetype: classes, timetable, about, contact. Use real photos.
- Images: run `npm.cmd run media:prepare -- --source <photo folder> --out .baseline/backups/images-001`, inspect the manifest and output, then copy eligible files to `src/assets/`. The logo is probably an SVG, so put it in an override file with `preset: preserve` and a reason. Every image needs alt text.
- Outline a section-by-section pacing blueprint before markup. No two adjacent sections should repeat the same three-column card grid.
- Timetable entries are repeated content: read `delivery-evidence.md` and check the loops that render them.
- Contact form: submit only to a destination the owner approved. Otherwise use a mailto link and mark the form as pending. Privacy copy comes from the owner, marked as draft.
- Run an Impeccable critique on the representative routes. Fix shared tokens or components first, then sweep all routes at three widths.
- Show the owner the rendered home and classes draft for wording review. This is a review, not a stop.
- Gate: representative pages work with real content at 390, 768 and 1440. Impeccable findings are resolved or recorded.

### Gates and commands

Before visual implementation:
1. `npm.cmd install` in the new project (first run creates the lockfile, which is committed), then `npm.cmd ci` afterwards.
2. Check `package.json` scripts for each name below. If a name is missing, use the generated AGENTS.md equivalent or do a manual check and report it as manual.
3. `npm.cmd run verify` as a baseline before editing.
4. Art direction commands listed in Checkpoint B, ending with `npm.cmd run check:art-direction -- --require-record` passing.

During edits: `npm.cmd run verify:fast`.

After visual implementation, before handoff:
1. `npm.cmd run verify`
2. `npm.cmd run build`
3. `npm.cmd run check:dev-tools`
4. `npm.cmd run audit:html` if the script exists in the generated project. It is listed for the EmDash foundation, so confirm it.
5. Inspect `dist/`: no `/_styleguide`, no server adapter or database, and a 404 page that returns HTTP 404 with no SPA rewrite.
6. Headless browser check (Playwright) on all five routes at 390, 768 and 1440. Listen for `pageerror` and `console.error`, and check the mobile navigation if it uses JavaScript.
7. Report checks actually run and remaining limits. Do not claim a deploy. The EmDash Windows screenshot harness and `setup:hooks` do not apply to static.

### Stage 7 (only when deployment is authorized)

Deploy the verified `dist/` to a host the owner chooses, configure 404 behaviour and rebuild-on-commit, and set the form service. Do not transfer or touch DNS without an explicit authorization that covers it. A commit or push needs a request first.

### Skills and references, and when each loads

- Already read: `AGENTS.md`, `README.md`, `new-site-workflow/SKILL.md`, `express-track.md`.
- Checkpoint A: `brief-platform-content.md`, `discovery-and-content.md`, `decisions-and-release.md` (before the first owner question), `copywriting.md` (before drafting French copy), `docs/platform-profiles.md`, `docs/project-context.md`. `docs/internationalization.md` is EmDash-oriented; a single locale needs no i18n routing.
- Checkpoint B: `site-art-direction/SKILL.md`, `site-art-direction/references/design-iteration.md`, `aesthetic-lanes.md`, `art-direction-and-calibration.md`, `astro-site-design` (calibration), `brand-assets.md` if the logo needs variants, `external-prompt-adaptation.md` only if the owner takes a library prompt.
- Checkpoint C: `build-verify-launch.md`, `delivery-evidence.md`, `docs/media-preparation.md`, `astro-site-design` (`rollout-verification.md`), `impeccable`, `site-maintenance.md` (completion register before handoff), and the representative-result review in `discovery-and-content.md`.
- Stage 7 only: the static branch of `build-verify-launch.md`.
- Not loaded: `emdash-*`, `building-emdash-site`, `wordpress-to-emdash-content`, `creating-plugins`, and the Brilliant, OpenPencil, Penpot and OpenDesign design skills unless the owner chooses that surface.

### Questions to the owner, by checkpoint

- A: the three questions above (enquiry email and form, booking/payment and timetable churn, who supplies facts and wording).
- B: pick one of the directions, optional reference libraries, favourite sites.
- C: wording review of the rendered draft.
- Stage 7, later: hosting account, domain, DNS, form service authorization. Ask only when that stage is reached.

## Files read

Paths are relative to the project root `site-q3`. Glob calls listed directories but opened no file contents.

1. AGENTS.md
2. README.md
3. .agents/skills/new-site-workflow/SKILL.md
4. .agents/skills/new-site-workflow/references/express-track.md
5. .agents/skills/new-site-workflow/references/brief-platform-content.md
6. .agents/skills/new-site-workflow/references/discovery-and-content.md
7. .agents/skills/new-site-workflow/references/art-direction-and-calibration.md
8. .agents/skills/new-site-workflow/references/build-verify-launch.md
9. .agents/skills/new-site-workflow/references/decisions-and-release.md
10. .agents/skills/site-art-direction/SKILL.md
11. .agents/skills/site-art-direction/references/design-iteration.md
12. .agents/skills/new-site-workflow/references/copywriting.md
13. docs/platform-profiles.md
14. docs/internationalization.md
15. docs/media-preparation.md
16. docs/project-context.md
