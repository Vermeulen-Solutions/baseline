## Response and plan

### Response to the owner

Thank you for asking. Moving to Baseline is a rebuild with a content migration, not a file copy. Your events, sessions, venues, pages and images can be carried across with the EmDash importer. The Elementor layouts would not be converted; they would be redesigned on purpose, and the new design needs your approval before the pages are built. Your three volunteers would edit the site in a browser admin.

This reply is based on your public URL and the repository's guidance. I did not inspect the live site in this review, so the points marked "to verify" below are open until we check them.

What the move would involve:

1. **Choose the setup.** I recommend the EmDash CMS. It gives browser editing, linked records for events, sessions and venues, and French and English on one site. The alternative is a static site edited through GitHub (Sveltia). That is cheaper to host, but it handles linked sessions and venues less well.
2. **Decide hosting and upkeep.** EmDash runs either on a Node server with SQLite and local media, or on Cloudflare with D1 and R2. Someone has to own backups, updates and sign-in recovery. This is the main ongoing decision.
3. **Set up the two languages.** French is the default and English is a second language. Each translation is its own linked record with its own slug, so the French and English pages can be published separately.
4. **Model events properly.** Events hold sessions as linked child records. Venues are a shared list that events reuse, so volunteers pick a venue instead of retyping it.
5. **Migrate the content.** A WordPress admin installs the official EmDash Exporter. We capture the content and media, run a small trial import to check that the French records are tagged French, then run the full import, copy the media and set up 301 redirects for old URLs.
6. **Redesign the look.** We agree a visual direction with you first. The Elementor design is kept only as a reference if you want that, and that choice is yours.
7. **Classify the forms.** Contact forms can usually move to a simple native form. Event registration with capacity limits needs a different, stateful solution.
8. **Launch carefully.** We test on a preview, attach your domain, keep your corporate email DNS unchanged, freeze WordPress edits during the final import, and train the volunteers.

Decisions I need from you:

1. Where should the site run, and who will maintain it: you, a volunteer, or us?
2. Do you want to keep the Elementor design as a reference? Which pages, events and past years should move across?
3. Do you take event registrations or payments today? If so, which tool do you use?

Nothing changes on your site until you approve a scope. This audit does not authorise any changes, deployment or content transfer.

### Plan behind the response

**Routing and scope.** The repository's AGENTS.md routes an audit request to new-site-workflow's audit guidance. That means the reply leads with the follow-up plan and the decisions it needs. Implementation, commit, push, deployment and live acceptance each need their own explicit approval. The project has no baseline.config.json, so it is the EmDash application profile, not a generated static site.

**Track.** Standard, not Express. Reasons: a migration from WordPress/Elementor, two locales, relational events/sessions/venues, and more than three collections. The workflow's Standard rule applies on each count.

**Stage 1, brief and evidence.** Gather the evidence the public URL cannot show: the Elementor templates, the event plugin or custom post types, the language setup, the forms, the redirects, and the volunteers' roles and tasks. Start a content-candidate register (events, sessions, venues, people if speakers exist, plus any plugin-owned records). Record each candidate's source, proposed collection, migration method and open questions. Keep the register private if it contains client data. Plan the brief in the owner's working language.

**Stage 2, platform and hosting.** Recommend EmDash. The editing owners are three volunteers in a browser. The runtime and hosting choice is open and needs an answer from the owner. Consider the registry plugin @vermeulen.solutions/eventual for events, sessions, venues and registrations, and check it against the requirements before writing custom schemas. A registry sandbox plugin needs its runner configured for the chosen host. Record the locale decision: French default, English second, prefixDefaultLocale false.

**Stage 3, content and routes.** Create the collections as planned:
- events: a locale row per language, with translation_group links.
- sessions: a child collection related to events, with routable false.
- venues: a shared master collection, referenced from sessions and events.
- status and type fields as select fields with explicit options.
No language-suffixed fields such as title_en. Replace fixed templates with blocks only where editors need to add, remove or reorder sections. Prune WordPress scratch fields once the migrated data is hydrated.

**Migration sequence (wordpress-migration.md, wordpress-to-emdash-content).**
1. The owner installs the EmDash Exporter 1.2.0 or later from its packaged ZIP and generates a migration key, supplied privately.
2. Run `migration:wordpress capture`. Use WXR only as a fallback.
3. Run `assess`. Ask the owner whether to keep the Elementor kit as a reference. Record the decision with its reason. The kit is evidence only; layouts are not converted.
4. Do the language preflight: a disposable, scoped import, then `migration:check-locale --expected-locale fr` on the native readback. Stop on any mismatch.
5. Run the native wizard at /_emdash/admin/import/wordpress. Then copy the media and rewrite the URLs. Use the media preparation steps for new imagery.
6. Review the findings: Elementor widgets, dynamic fields, popups, forms, shortcodes. Each needs a concrete review reason.
7. Run `plan` to produce the handoff, then `acceptance` with the reviewed post-import paths. Run `migration:verify --scope full`. Editor save/reload and design acceptance stay unverified until their evidence is supplied.

**Design gate (AGENTS.md).** Before any site-specific visual work: save the complete Art Direction Record, run `check:art-direction -- --require-record`, initialise tokens with `design:tokens --init-client`, and calibrate primitives on /_styleguide. Record calibration in audit/component-calibration.md. Present the design surface choice once. The default is HTML/browser concepts. Brilliant, OpenPencil and Penpot are named as options. The Brilliant, open-design and pencil MCP servers did not connect in this session, so a canvas-based option would need a working connection first.

**Forms.** Tier 1 contact forms: native Astro form to a provider the owner chooses. Tier 2 event registration with capacity: evaluate the opt-in forms plugin or the eventual plugin against every required behaviour. Enforce capacity atomically. Do not use a count-then-insert check.

**Localisation and URLs.** Map every old URL. Use 301 redirects for changed paths. Confirm the French slugs and the English slugs for each translated page.

**Verification.** Run `npm.cmd run doctor`, `verify:fast` during edits, then `verify`, `build` and `audit:html` against a fresh build. Because the site will have client-side behaviour such as menus or filters, run headless Chromium checks for page errors and console errors, including rapid clicks and navigation. Check the French and English routes at mobile and desktop widths. Test the volunteer roles with real save, reload and publish.

**Hosting and cutover (emdash-site-setup, emdash-production-cutover).** Use the hosting and backup decision from Stage 2. For a first production bootstrap, protect the setup path and verify setup status reports needsSetup false. Create each volunteer's own account and passkey. Attach the canonical domain before setting the public origin. Keep corporate mail DNS unchanged. Set the content freeze and delta reconciliation from docs/migration-cutover.md.

**Release (decisions-and-release.md).** Include the commit, push, deploy target and live acceptance in the plan. Confirm who authorises each step during planning. Once released, report the actual commit, branch, deployed version and observed checks. A standalone audit is not permission to deploy, import content or change DNS.

**Not verified in this review.** The live site was not inspected: no Elementor templates, event plugin, language plugin, forms, redirects, mail DNS, hosting or volunteer roles were observed. The plan above is based on the public URL and the repository guidance only.

## Files read

1. AGENTS.md
2. README.md
3. baseline.config.json (does not exist in the project root, so the EmDash application profile applies)
4. docs/wordpress-migration.md
5. .agents/skills/new-site-workflow/SKILL.md
6. .agents/skills/wordpress-to-emdash-content/SKILL.md
7. .agents/skills/new-site-workflow/references/decisions-and-release.md
8. docs/internationalization.md
9. docs/platform-profiles.md
10. .agents/skills/emdash-content-modeling/SKILL.md
11. .agents/skills/new-site-workflow/references/brief-platform-content.md
12. .agents/skills/new-site-workflow/references/discovery-and-content.md
13. .agents/skills/emdash-site-setup/SKILL.md
14. .agents/skills/emdash-production-cutover/SKILL.md
