## Response and plan

Short answer: yes, moving this site to Baseline is realistic, but it is a full migration rather than a re-skin. It has four parts: moving the WordPress/Elementor content into an EmDash CMS with French and English as linked translations, modelling events, sessions and venues as related records, redesigning the front end through Baseline's art-direction gate, and a cutover that keeps every public URL working or redirected.

Important limit: I did not inspect your live site. This run had no web access and I worked only from the repository instructions and skills. The findings below are therefore the audit scope and plan, not observations about your pages. The first step of the plan is a read-only capture and rendered review that produces that evidence.

### Decisions I need from you

1. **Default language and URLs.** Proposed: French at the root, English under `/en/`, no prefix on the default language (Baseline's standard). Which language is the default, and should English pages have their own translated slugs?
2. **Event features.** Do you need online registration or ticketing, or only listings with sessions and venues? If registration: are there capacity limits, who receives registrations, and who owns that personal data?
3. **Volunteers and approval.** Who are the three editors, what may each one do (edit, review, publish), and must anything be approved before it goes live?
4. **Hosting and upkeep.** Who maintains the site after launch? Node with SQLite, or Cloudflare (Workers, D1, R2)? This decides whether an event plugin can run (see Stage 2).
5. **Existing design.** Keep the Elementor design as a reference (optional template-kit export), or are you open to a visual refresh?
6. **Release scope.** Which environment receives the site, and who authorizes content transfer and the domain switch? Nothing is deployed, imported or switched without that approval. An audit alone does not authorize implementation.

### Plan (Standard track, seven stages)

The track is Standard because the project has a migration, two locales, related collections (events, sessions, venues) and multiple editors. Each stage has its own handoff. Only the first three stages run before any design work.

**Stage 1 - Brief and evidence (read-only on the live site)**
- Capture the WordPress source with the first-party EmDash Exporter, installed from its official release ZIP by someone with plugin rights. The migration key goes to the operator through a private channel, never into chat. Fallback: WordPress WXR export.
- Run the portable capture and assessment (`migration:wordpress` capture, then assess). Record post types, pages, menus, redirects, media, Polylang language assignments and translation links, forms, and Elementor widgets and global templates.
- Build a content-candidate register. Likely candidates are events, sessions, venues, and possibly people, documents and FAQs that are currently embedded in ordinary pages or Elementor widgets. Each candidate gets a source location, target collection, migration method and owner.
- Inventory every contact CTA and form. Classify each form by tier: a plain contact form is Tier 1 (native form, no database); event registration with capacity limits or deduplication is Tier 2 (stateful). Do not replace a form or popup with a `mailto:` link unless that was the source behavior.
- Audit the Elementor site at desktop and mobile widths: global settings, Theme Builder templates, dynamic tags, responsive overrides. The template-kit export is optional and only if you keep the design as a reference.

**Stage 2 - Platform**
- Choose EmDash. Static with Sveltia would not model sessions and venues as related records, and the volunteers need browser editing.
- Choose hosting. Node needs a `workerd` sandbox runner for registry plugins; Cloudflare needs Worker Loader, which requires the Workers Paid plan.
- Event management: the starter's curated registry table names `@vermeulen.solutions/eventual` for schedules, venues, speakers and registrations. I have not verified its bilingual behaviour or fit for your requirements. Evaluate it against the Stage 1 findings before deciding between it and custom collections.

**Stage 3 - Content model and routes**
- Events as a collection; sessions as a child collection related to events; venues as a shared lookup collection referenced by sessions. Venue names must not be typed as free text on each session.
- Native row-per-locale translations linked by `translation_group`. No `title_en`-style fields. Astro i18n with default `fr`, locales `fr` and `en`, and `prefixDefaultLocale: false`.
- Enumerated values (for example, event status or type) become select fields with French labels and English slugs.
- Routable versus non-routable collections are set explicitly (sessions and similar records are not routable).
- Before bulk import, confirm how the importer handles Polylang language and translation links. Do not assume they carry over.

**Stage 4 - Art direction**
- Offer the design surface once. HTML/browser concepts are the default. Compare two or three directions at desktop and mobile widths and pick one before broad implementation.
- Save the Art Direction Record in `AGENTS.md` and pass `npm run check:art-direction -- --require-record` before any visual implementation.

**Stage 4.5 - Calibration**
- Initialise tokens and calibrate primitives on `/_styleguide`, with observations recorded in `audit/component-calibration.md`.

**Stages 5-6 - Representative pages, then full build**
- Build the event listing, an event detail page with sessions and venue, and a French/English pair for the same event. Test with real content at mobile, intermediate and wide widths.
- Give every changed or removed URL a 301 redirect. Keep navigation intact.

**Migration acceptance**
- Run a disposable, scoped import first. Read the imported records back without a locale filter and run `migration:check-locale` with `--expected-locale fr` (and `en` for English samples). A mismatch stops the batch.
- Then run the full import, media copy and URL rewrite. Reconcile counts by type, locale and status. Confirm unpublished pages stay absent.
- Run `migration:verify --scope full` with an acceptance mapping. Content reconciliation and editor acceptance stay unverified until their evidence is supplied; an HTTP pass alone is not migration acceptance.
- Have each of the three volunteers complete a real edit, save, reload, preview and publish in both languages.
- Verify with the site's own commands. Check each name in `package.json` first. Expected: `doctor`, `verify:fast`, `verify`, `build`, `audit:html`. For any client-side script, run headless browser checks for `pageerror` and `console.error`.

**Stage 7 - Cutover (only after release approval)**
- Content freeze and final capture, following the cutover guide, then delta reconciliation.
- Check TLS, editor login, form and mail delivery, and redirects. Set up the owner's passkey through the protected setup path, and confirm setup status reports `needsSetup: false`.
- Report only the milestones actually observed.

### Main risks

- Elementor layouts, dynamic widgets and popups do not convert automatically. They are rebuilt, not ported.
- Registration and contact forms carry the most risk: data protection, capacity enforcement and delivery. Treat them as Stage 1 decisions.
- Polylang translation relationships may not survive import; a bulk import without the language check would create duplicates or unlinked rows.
- Event data stored as free text (dates, venue names) must be parsed into relations, not copied across as text.
- Old URLs need an explicit redirect map before cutover.

### Next action

After you answer the decisions above, I would run the read-only capture and assessment and produce the audit report with a phased follow-up plan. Implementation begins only after you select its scope and release endpoint.

## Files read

1. AGENTS.md
2. .agents/skills/new-site-workflow/SKILL.md
3. .agents/skills/wordpress-to-emdash-content/SKILL.md
4. docs/wordpress-migration.md
5. .agents/skills/new-site-workflow/references/decisions-and-release.md
6. docs/internationalization.md
7. .agents/skills/new-site-workflow/references/brief-platform-content.md
8. .agents/skills/emdash-site-setup/SKILL.md
9. .agents/skills/emdash-content-modeling/SKILL.md
