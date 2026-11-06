## Response and plan

Moving this site to Baseline is a rebuild with a content migration, not a theme swap. I would run it on the Standard track (migration, two languages, linked events, sessions and venues) and use the EmDash profile so the three volunteers can keep editing in the browser.

**What I could check:** only the public URL you gave and the Baseline repository. I did not open the live site, the WordPress admin or its plugins, so nothing below is an observed finding about your site. Those findings come from the audit once the access listed under "What I need from you" is in place.

### Recommendation

1. **Platform: EmDash.** Volunteers edit in the browser; events, sessions and venues are relational (a session belongs to an event and points to a shared venue record); French and English need native per-language records linked by translation group. Static + Sveltia is the alternative. It edits the same files through Git, but the event/session/venue relations would be maintained by hand in Markdown and there is no live page editing. Choose it only if the volunteers are comfortable with Git and rebuilds.
2. **Hosting, decided later by you:** Node with SQLite and local media (simpler to run), or Cloudflare Workers with D1 and R2 (separate setup and cutover). Also decide who maintains it after launch.
3. **Track:** Standard, seven stages, with a local build and verification before any release.

### What moving would involve

**Stage 1: capture without changing WordPress.**
- Install the first-party EmDash Exporter from its official release ZIP (Plugins → Add New → Upload Plugin), then generate a migration key. Send the key through the agreed private channel, not in chat or email. Fallback: Tools → Export → All content (WXR).
- Keep WordPress live until cutover.
- Elementor: ask whether the current design should stay as a rebuild reference. If yes, export the Website Template kit; if not, use the live pages and agreed screenshots as visual evidence.
- The capture contains private and draft content and must be kept private.

**Stage 2: find the hidden content types.** Check whether events, sessions, venues, people, documents, sponsors and galleries are custom post types, ACF repeaters, Elementor widgets, plugin tables or plain page text. For each candidate record the source location, cardinality, proposed collection, migration method and open question in `audit/content-candidate-register.md`, linked from AGENTS.md.

Likely model, to confirm after the audit:
- `events`: bilingual records (one row per language, linked by translation group).
- `sessions`: a child collection referencing its event, not routable, with day, start/end time and venue reference.
- `venues`: a shared master collection, so a venue name is not retyped across sessions.
- `people`, `documents`, `sponsors`: separate collections only if editors must manage them independently.
- Admin labels and select options in French; slugs in ASCII English.

The new-site workflow notes a registry option for event management (`@vermeulen.solutions/eventual`). Evaluate it against sessions, venues, French/English behavior and the exact EmDash version before choosing it. Do not assume it fits.

**Stage 3: languages before any bulk import.**
- Confirm the language plugin (Polylang is expected, but check it), its language codes, URL mode, translatable post types and translation links.
- Configure fr and en as EmDash locales with the default locale and `prefixDefaultLocale: false`.
- Run a disposable import of a few events with their translations. Check each imported record's locale with `migration:check-locale`, and check the translation group in the editor and on the public routes. Stop on any mismatch.

**Stage 4: gaps the importer will not close.** These come from Baseline's importer fidelity matrix, which is based on synthetic fixtures, not your site:
- Elementor layouts are not recreated; widgets become reviewable outlines, not pages.
- Shortcodes (forms, galleries) are kept as text and do not run.
- Dynamic plugin blocks are unsupported and need a rebuild.
- Yoast or Rank Math titles, descriptions and canonicals are not mapped automatically and must be written through the native SEO fields.
- Old permalinks (for example `/2024/05/…`) are not remapped; a redirect register and 301s on the host are needed.
- Parent page relationships are not rebuilt; guest authors can duplicate; custom links on gallery images are lost.
- `pending`, `private` and `trash` become drafts; future-dated posts are scheduled.
- Images are copied but not optimized; prepare them with `media:prepare` first and keep full-size originals outside the library.

**Stage 5: forms and contact actions.** Classify each form by its actual workflow, not its plugin name. A contact or inquiry form that only emails is a simple form (native Astro form to an email provider you choose). Event sign-ups with limited places, a client inbox or cross-submission rules are stateful: evaluate the first-party forms plugin on the exact version, and do not build a capacity counter yourself because the submission-limit feature is not yet released. Record every contact CTA (popup, inline, page or direct email) and reproduce it as observed.

**Stage 6: design.** There is no Art Direction Record yet. Needed: logo, brand references, real event photos with usage rights. Compare two or three HTML concepts side by side with the current site, with desktop and mobile views. If you want an editable canvas, the tools are Brilliant, OpenPencil or Penpot; you choose. Save the Art Direction Record, pass `check:art-direction`, and calibrate components on `/_styleguide` before page assembly. Representative pages: home, event listing, event detail, venue, and one Elementor-heavy page.

**Stage 7: build, verify and editor acceptance.**
- Run `verify`, `build` and `audit:html`; check both languages at mobile and desktop widths, focus order and the 404 page.
- Migration acceptance: a URL inventory with each old URL marked 200, 301 or 410, and a content count reconciliation by type, locale and status (`migration:verify`).
- Editor rehearsal with the three volunteers: each creates or edits an event in both languages, adds a session, changes a venue, saves, reloads and publishes. Their acceptance is separate from the automated checks.

**Stage 8: release and cutover, each authorized separately.** Deploying code, transferring CMS content, switching DNS and retiring WordPress are different actions. Freeze source edits before the final capture, reconcile late changes, and report each milestone only when observed: code deployed, sign-in working, content transferred, publication verified.

### Decisions I need from you

1. Hosting: a Node server (who runs it) or Cloudflare (who runs it)?
2. Events: evaluate the event plugin, or build the collections directly?
3. Event sign-ups: do people register for limited places? Which email provider do you use for contact forms?
4. Elementor: keep the current design as a reference, or start visually fresh?
5. Which old URLs must survive, and do you accept redirects for the rest?
6. Launch languages, and which pages must exist in both languages on day one.
7. Who is the lead editor among the three volunteers?

### What I need from you

- Access for the admin who can install the exporter, or a WXR export file.
- The plugin list with versions (events, language, SEO, forms, page builder, ACF).
- Brand assets and event photos, with rights to use them.
- Whether events, sessions and venues live in plugin tables, custom post types or page text.

### Risks

- Venues and schedules typed as free text in pages will need manual cleanup.
- Translation links may not import as expected; verify them on a sample before the bulk import.
- Unknown plugin behavior can add work once the audit is done.

I cannot estimate duration until the capture and content-candidate register exist.

Nothing was implemented, deployed, sent or contacted.

## Files read

1. AGENTS.md
2. README.md
3. .agents/skills/new-site-workflow/SKILL.md
4. .agents/skills/wordpress-to-emdash-content/SKILL.md
5. docs/wordpress-migration.md
6. docs/internationalization.md
7. docs/platform-profiles.md
8. docs/wordpress-content-modeling.md
9. docs/importer-fidelity-matrix.md
10. docs/forms-adoption.md
11. docs/migration-review.md

Directory listings (Glob) were used for discovery of `.agents/skills/` and the root and `docs/` file names; none of those listed files were opened beyond the ones above.
