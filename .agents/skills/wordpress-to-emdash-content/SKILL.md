---
name: wordpress-to-emdash-content
description: Migrate WordPress content, media, and form workflows into EmDash and Astro, including choosing the importer, reviewing mappings, and classifying form replacements. Use for migration work, not Astro visual design or theme implementation.
---

# WordPress content migration to EmDash

Use EmDash's supported importer for WordPress content before manually rebuilding existing pages. Keep content import separate from Astro design/theme work. This skill covers the source inventory, import, media preparation, and content verification; use the Astro site design workflow to recreate the presentation.

## Prepare the migration

1. Take a WordPress database and uploads backup. Record the canonical origin, permalink patterns, redirects, menus, post types, taxonomies, plugin-owned fields, representative content, and behaviors that are not content records (forms, search, widgets, integrations, and plugin workflows). Record the active theme and builders—especially Blocksy, Stackable, and Elementor—and inspect their global settings, templates, reusable blocks/widgets, and responsive rules; see the builder-specific audit below. Record whether the site is multilingual and identify its language plugin and version—expect Polylang on this user's sites, but check rather than assume. Also record language codes/locales, default language, translation relationships, locale-specific slugs/URLs, menus, taxonomy terms, and which custom post types and taxonomies are configured as translatable. Decide which need replacements.
2. Inventory media before transfer: identify used and unused assets, dimensions, formats, file sizes, duplicates, and missing alt text. Decide whether oversized or unsuitable files should be resized, compressed, converted, or omitted. The EmDash importer copies attachment bytes and deduplicates identical bytes; it does not optimize images. Plan optimization before importing/copying media and preserve a source-to-optimized URL mapping for references.
3. Keep the WordPress origin available through import and final media verification.

## Choose and run the import

Consult the current [Migrate from WordPress](https://docs.emdashcms.com/migration/from-wordpress/) and [Content import](https://docs.emdashcms.com/migration/content-import/) docs before operating the importer.

For multilingual sources, consult EmDash's [internationalization guide](https://docs.emdashcms.com/guides/internationalization/) before importing. Configure the target Astro locales and default locale first. For Polylang, inspect its configured languages and URL mode, language assignments and translation links on posts and terms, per-language menus, translated strings, and relevant custom-field/ACF settings. Check whether translated URL slugs or language-specific media are in use; available behavior can differ between Polylang and Polylang Pro. The [Polylang language setup](https://polylang.pro/documentation/support/guides/configure-the-languages/) and [multilingual post types and taxonomies](https://polylang.pro/documentation/support/guides/multilingual-custom-post-types-and-taxonomies/) docs describe these source settings. Verify the current EmDash importer preserves the source's translated records and translation relationships; do not assume Polylang metadata or language-plugin relationships are imported just because each post is present. During analysis and import, check locale mapping, per-language slugs, and whether entries are linked as translations. If relationship mapping is missing or ambiguous, pause and document a mapping/recovery plan before importing rather than creating unrelated duplicates. Preserve per-locale statuses and review fallback and URL behavior in Astro.

**Crucial Architecture Rule:** Multilingual content in EmDash must ALWAYS use the native row-per-locale model linked via 	ranslation_group / 	ranslationOf. **NEVER** map translations into duplicate field columns on a single entry (e.g. 	itle_en, content_en, acilities_en, or a custom language string field). Doing so breaks EmDash's visual editor, prevents independent publishing per language, creates unmanageable forms as languages scale, and breaks native { locale } content queries. See docs/internationalization.md.

- Prefer EmDash's admin at `/_emdash/admin/import/wordpress`.
- When you control WordPress and need authenticated content or supported settings, use the EmDash Exporter with its migration key or documented application-password flow.
- Otherwise export WXR XML using WordPress Tools → Export and upload it. WXR includes attachment metadata and source URLs, not media bytes.
- Entering a public WordPress URL alone only probes/counts content. It does not import directly from the REST API.

Review analysis and mappings before preparing schema: post types, collection targets, field compatibility, authors, taxonomies, custom-field suggestions, reusable sections, and attachments. Schema preparation adds compatible collections/fields; it does not change the type of an incompatible existing field.

WXR imports posts, pages, custom post types, supported taxonomies, reusable blocks, authors/bylines, and attachments. The Exporter can additionally fetch authenticated content and supported comments, menus, settings, SEO, and matching custom meta/ACF fields. Do not assume arbitrary plugin data, serialized PHP, repeaters, shortcodes, page-builder markup, or every SEO/plugin field converts correctly.

### Identify implicit content types

A WordPress custom post type is only one signal that something deserves its own content model. During the source audit, inspect repeated or independently managed material in page content, ACF repeaters, builder sections and reusable blocks, plugin-owned tables or endpoints, menus, widgets, and rendered archive/detail patterns. Examples include projects, properties, team members, events, products, testimonials, galleries, and offices that may currently be embedded in ordinary pages.

Create a content-candidate register before finalizing the EmDash schema. For each candidate, record:

- the candidate name and the evidence that it is a distinct editorial entity;
- the source location and extraction path, including whether the data is a post, custom field, builder block, plugin record, REST response, or rendered-only pattern;
- the record grain and cardinality, including ordering, grouping, taxonomy, relationships, and locale behavior;
- the proposed EmDash collection, fields, relationships, route needs, and editor ownership;
- the migration method: importer mapping, custom extraction/migration script, manual entry, or deliberate exclusion;
- confidence, unresolved questions, and the acceptance checks required after migration.

For a substantial migration, keep the register in `audit/content-candidate-register.md` and link it from `AGENTS.md`. For a small migration, a focused section in `AGENTS.md` is sufficient.

Classify every repeated editorial element as an EmDash collection, page/Portable Text content, a site setting, plugin or integration data, or deliberately excluded content. Do not create a collection only because markup repeats: use one when editors need to manage records independently or the site needs to query, filter, order, relate, or link them. If the source exposes only raw HTML or opaque plugin storage, the importer will not infer its meaning reliably; document and implement the extraction or mapping explicitly, preserving source identifiers where they are needed for retries and verification.

### Schema design, semantic typing & relational modeling

A successful migration does not merely copy raw WordPress postmeta shapes; it provides a clean, maintainable content model and an intuitive editing environment for the client's team.

1. **Semantic Field Typing over Stringly-Typed Dumping:**
   - **Enums & Choices:** Never leave fixed categories, partner types, tiers, statuses, or roles as free-text strings. Convert them to `select` or `multiSelect` fields with explicit options, labels, and sensible defaults (e.g. `partner` vs `sponsor`, or `full-time` vs `contract`).
   - **Routable vs Non-Routable:** Explicitly designate `routable: false` on collections that do not have their own public URLs (e.g. `sessions`, `membership_submissions`, `contact_messages`, `slider_items`). This avoids forcing editors to fill in meaningless URL slugs for internal or embedded records.
   - **Rich Text vs Plain Text:** Strip legacy WordPress shortcodes and HTML wrapper markup when mapping to `portableText` or plain `text`.

2. **First-Class Relational Modeling (EmDash Relations & References):**
   - **Stop Embedding Repeated Operational Entities:** Do NOT dump repeated schedules, sessions, shifts, linked venues, rosters, or documents into raw JSON textareas or bloated repeaters inside the parent record.
   - **Extract and Relate:**
     - **1:N Operational Child Collections:** E.g. `events` -> `sessions` or `departments` -> `teams`. The parent collection holds a multi-entry reference field (`relationSide: "parent"`), and the child references the parent (`relationSide: "child"`, single entry).
     - **Shared Master Data / Lookups:** E.g. `locations` (offices, venues, facilities) or `categories`. Never hardcode repeated venue names as free-text strings across child rows. Create a master data collection and bind child records via a `reference` field.
     - **N:M Cross-Entity Relations:** E.g. `people` (speakers, leads, contributors) <-> `projects` / `events`. Use bidirectional relations where each side reflects its role cleanly.
   - **Automatic Cross-Locale Resolution:** EmDash relations (`_emdash_content_references`) link entries using translation groups (`parent_group` and `child_group`). A relationship established in one language binds automatically across all locales without manual re-linking or duplicate arrays.

3. **Admin Audience, Language Strategy & Form Polish:**
   - **Identify the Client's Working Language:** Determine the primary administrative language of the client's editors (e.g., French for a Swiss or French client, Dutch for a Netherlands business, or English for a global agency).
   - **Programmatic Slugs vs Display Labels:**
     - **Slugs** MUST remain clean, standardized ASCII / kebab-case / English conventions (`sessions`, `title`, `phone`, `kind`, `sort_order`, `url`) for API stability, frontend queries, and database column consistency.
     - **Display Labels** (`label`, `label_singular`), **field labels** (`field.label`), **select option labels**, and **admin group folders** (`nav_group`) MUST be authored in the client's working language.
   - **Admin Organization & Polish:**
     - Group collections into 2–4 logical collapsible sidebar folders (`nav_group`), e.g. *Editorial Content*, *Organization & Teams*, *Forms & Submissions* (translated into the client's working language).
     - Assign appropriate Phosphor icons and helpful descriptions so non-technical client team members immediately understand what each content type represents.
   - **Post-Import Form Hygiene & Schema Pruning:**
     - WordPress imports inevitably leave scratch columns and legacy markers (e.g. `asset` holding `wordpress-attachment:123`, `legacy_id`, serialized JSON dumps, raw HTML blocks).
     - Once structured fields and relations are hydrated (e.g. raw attachments hydrated to structured media objects, legacy sessions migrated to child collections), **prune or retire legacy fields from `_emdash_fields`**.
     - Editors must NEVER be confronted with intimidating raw JSON textareas containing legacy multilingual fields (`period_en`, `day_en`) or obsolete WordPress markers.

### Theme and page-builder audit

Treat the rendered WordPress site as the visual/behavior reference and the builder configuration as supporting evidence. Content import does not migrate the theme, builder design system, templates, or responsive behavior. Inspect the source front end at desktop and mobile sizes, and inspect the WordPress settings/templates when available; record the site-wide shell separately from page content.

- **Blocksy:** inspect Customizer/global colors and typography, content/container widths, header and footer builder layouts, sticky or transparent header behavior, archive/single templates, sidebars, and responsive visibility/spacing. Note whether Blocksy Companion or Pro features provide content conditions, hooks, or custom templates.
- **Stackable:** inspect global color/typography/spacing presets, design system settings, block defaults, reusable designs/patterns, and responsive controls such as stacking order, visibility, and alignment. Record each section's content roles and hierarchy, not its nested Stackable wrapper markup.
- **Elementor:** inspect Site Settings/global tokens, Theme Builder templates and display conditions, global widgets, reusable templates, dynamic tags/fields, responsive breakpoints and per-device overrides, popups, and widget-specific interactions. Identify Elementor Pro features and third-party widgets whose behavior or data needs a replacement.

For each distinct page archetype, separate global tokens and shared components from one-off editorial layout. Record meaningful interactions, responsive changes, source assets, and settings/templates that could not be inspected. Do not recreate builder wrapper trees or blindly port generated CSS into Astro. Use the route-by-route screenshots and preserve/improve/replace record in the Astro visual-audit workflow to rebuild the visual language with semantic HTML, shared tokens, and reusable components.

Run content import, then media copy and URL rewrite. Use the optimized media mapping if assets were prepared separately. Review failed media downloads and broken references; byte-identical retries are deduplicated.

### Media Library organization, renaming & hydration

WordPress imports deposit media in a flat, unfiled pool with messy legacy slugs (e.g. `3206-Photo-team-scaled.jpg`), and custom fields may store raw string attachment markers (`wordpress-attachment:123` or raw URLs). These prevent EmDash's Media Picker UI from functioning and make editorial management difficult.

Before public handoff:
1. Run `npm run media:migrate-wp -- --source <uploads-path> --source-id <id>` (or `--out <dest> --prepare`) to generate and inspect the media migration plan through supported EmDash APIs. (The legacy raw-SQL `media:organize` helper is retired).
2. Verify standard folders (`Pages`, `Articles`, `Documents`, `Media`) and collection-matching folders (`Teams`, `People`, `Sponsors`, etc.) are established in `media_folders`.
3. Verify that raw numeric IDs, `-scaled`, `-150x150`, and camera prefixes are stripped from `media.filename` in favor of clean kebab-case slugs.
4. Verify that raw attachment strings in content collection tables (`ec_*`) are hydrated into full EmDash structured media objects (`{ id, provider: 'local', filename, url, width, height, ... }`) so the Admin UI renders thumbnails properly.
5. If deploying to Cloudflare, run `npm run media:sync-r2` to ensure local `./uploads/` are synchronized with remote R2 storage.

## Verify and hand off

### Gallery migration acceptance

For galleries, distinguish the Media Library assets, album/image membership and order, the editing workflow, and public presentation. Inspect the installed EmDash version: native Portable Text gallery blocks support bulk media selection and contextual captions/alt; image repeater support is version-dependent. Do not assume a separate `gallery` schema field exists or install a plugin just because an older source says native galleries are unavailable.

- Map every source attachment ID/key/URL to a canonical target media ID/provider reference. Copying files into `public/` and rendering them through a static URL map does **not** register them in the Media Library. Preserve the mapping, original order, contextual metadata, covers, locales, and intentional repeated positions.
- Trial one complete album in the editor: select/upload multiple images, reorder, edit captions/alt, save, reload, preview, and publish. Verify that a newly selected CMS image appears on the public page without editing code. Raw JSON text fields, WordPress marker strings inside image fields, and manual numeric position fields are not sufficient gallery-editor acceptance.
- Use one canonical editable gallery source. For repairs, retain the old payload as a recovery snapshot, fence writes against concurrent edits, and migrate through supported schema/content/media APIs. A seed edit does not change the schema of an existing instance.
- Reconcile album/image counts and ordered source identities, and verify every media reference and available target file. Store the actual source URL or storage key alongside the native reference: Cloudflare media IDs can differ from storage filenames. Check actual rendered preview/full-image URLs, not only Media Library API URLs. Report unresolved references explicitly; never substitute unrelated stock/fallback photos to conceal an unresolved gallery image.
- Test the largest real album before selecting a single gallery block versus separate image records and an album manager. Shared frontend components and lightboxes do not fix bulk editorial workflows. Code deployment and remote media/content transfer remain separate operations.
- For mixed portrait/landscape albums, use the starter's uncropped justified rows as the public default, with lazy previews and PhotoSwipe. Preserve source and keyboard order; avoid filling gaps by cropping artworks or reordering photos. Trial the final incomplete row, captions, and desktop-to-mobile resizing inside the real page container. Fixed columns remain an explicit component option, and the non-JavaScript fallback must retain every image and its full-image link. See `docs/gallery-workflow.md` for the reusable component contract.

See the starter's `audit/gallery-evaluation-and-repair-plan.md` and `audit/gallery-migration-case-study.md` for the evaluated options and the legacy WordPress migration pilot findings; those audits are evidence, not a mandatory client schema.

Compare counts by source post type and proposed collection, locale, and status; inspect representative translation groups across every source language as well as Gutenberg, Classic Editor, shortcode, and page-builder content. For each content candidate, verify required fields, ordering, relationships, taxonomy assignments, source identifiers, and intended routes. Create or edit representative entries in EmDash and confirm the public Astro loop renders the updated data. Check images, rewritten URLs, alt text, authors/bylines, taxonomies and their translations, locale-specific menus/settings where applicable, and every old URL that needs a redirect. Confirm translations are linked in EmDash, keep their intended per-language publication states, and verify fallback behavior. WordPress `pending`, `private`, `future`, `trash`, and unknown statuses may import as drafts; review before publishing. WordPress scheduled dates and visibility rules are not reconstructed.

For a partial retry, inspect the import results and slugs. Existing entries match on collection, slug, and locale, not WordPress ID, so a changed slug can create a duplicate. Keep the source and backup until the migrated site is verified and rollback is no longer needed.

The importer transfers content, not the WordPress theme, PHP templates, public URL routing, form behavior, widgets, or plugin workflows. Do not call a selective manual reconstruction a complete migration. Report the content-candidate register, import counts by source and target type, skipped/failed items, unresolved fields or candidates, media work, source-to-target identifiers, and behavioral replacements before handing off to Astro implementation. Include the route inventory, repeatable content types, and verified purpose of meaningful media/links in that handoff; the Astro design skill uses these alongside full-page visual references to build and check every route.

### Post-Import Handoff Prompt

After importing content and preparing media, present this prompt:
> **WordPress Content Import Complete!**
> We have successfully imported your WordPress content and images.
>
> **What would you like to do next?**
> 1. **(Recommended) Full Post-Import Preparation (Clean Admin Forms + Verify Media):**
>    - *Step A:* Clean up messy WordPress custom fields and repeaters into clear, friendly EmDash admin forms (`emdash-content-modeling`).
>    - *Step B:* Verify image dimensions, alt text, and captions, and organize them into clean folders (`media:migrate-wp`).
> 2. **Clean up admin forms only for now:**
>    - Normalize schema and fields first; defer media preparation.
> 3. **Proceed directly to visual styling (Stage 4 Art Direction):**
>    - Start styling the front end right away using the raw imported data.
>
> *(Reply `1` for the complete recommended preparation.)*

## Forms: classify before replacing

Do not migrate WordPress forms as embeds or iframes. Rebuild the form with accessible native HTML and the site's Tailwind design tokens/components. During the audit, inspect each form's actual configuration and workflow, not just the visible fields or plugin name. Inventory every contact CTA separately: record its label and location, whether it opens a popup/modal, reveals an inline form, navigates to a contact page, or directly opens email, and implement and verify that observed interaction. Never replace a form or popup CTA with a `mailto:` link unless direct email is the source behavior or the client explicitly chooses it.

| Tier | Use when | Default replacement |
| --- | --- | --- |
| **1 — simple** | Contact/inquiry form; validation is field-local; no submission history, cross-submission rules, inventory, hard cap, or client inbox is needed. | Native Astro `<form>` posting directly to a client-owned, currently suitable form-to-email SaaS. No application DB writes. |
| **2 — stateful** | Hard quotas, deduplication, spot/inventory counts, conditional server validation, submission lifecycle, searchable client inbox, or export is required. | Native Astro `<form>` → documented Astro Action with Zod → EmDash collection-backed private submissions and server-side email delivery. Enforce quota and dedupe atomically; don't use a non-atomic count-then-insert as the authority. |

Use these heuristics: inspect Gravity Forms/WS Form/WPForms/Contact Form 7 settings, add-ons, conditional rules, notification recipients, export/history needs, and integrations. Ask whether the rule depends on other submissions or whether the client must retrieve/manage records later. A visual counter or “limit submissions” option alone is not enough to classify it—determine whether it is a real server-enforced cap. If every submission only sends an email and disappears, keep it Tier 1 even if the form has several fields. If there is payment, file upload, sensitive data, signatures, CRM ownership, or an external system acting as the source of truth, stop and document that integration separately instead of forcing it into either tier.

Read [`references/forms.md`](references/forms.md) for the native form, Astro Action, EmDash collection, quota/deduplication, email, privacy, and CSV export recipes. For a Tier 1 form, ask the client which provider they prefer before implementation; if they have no preference, compare suitable current services and present the tradeoffs for a choice. Do not infer consent to a provider from an example in the reference. Before coding, check the current Astro Actions guide and EmDash seed, collection, content, and REST API docs. The REST API OpenAPI document from the target EmDash site is authoritative for exact request and response schemas. Do not invent a universal `ctx.db`, Astro Action database binding, SQL adapter API, or undocumented EmDash helper.

## Image-quality diagnosis and recovery

Before blaming import optimization for softness, compare decoded oriented pixels and native dimensions with the actual export originals; file hashes may differ only because metadata was stripped. Search for larger originals versus WordPress derivatives, measure rendered width and pixel density, and inspect the browser's selected responsive source. Preserve small originals without enlargement or repeated lossy encoding. Keep official logo artwork/colors and suitable local grounds; readable locale-specific alt text should use verified source context, never invented pictured identities/action. Apply content corrections through APIs with backups/revision checks while preserving media identities, captions and order. See docs/reusable-public-patterns.md when using this starter's image preparation.

Form failures should preserve allowlisted non-secret answers in private short-lived sessions, expose reason-specific localized feedback and field links, and align native/server date formats. Put fees/documents/preparation before forms at mobile widths. Treat this separately from the agreed storage/email-provider workflow; recovery utilities alone do not deliver or store submissions.
