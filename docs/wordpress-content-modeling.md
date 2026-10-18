# WordPress Migration & Content Modeling

Migrating a WordPress website to EmDash and Astro is not just a copy-paste job. Real WordPress sites are messy: they accumulate legacy custom post types (CPTs), bloated ACF repeater fields, unstructured shortcodes, and operational data stuffed into raw Gutenberg or Elementor blocks.

Baseline provides a structured methodology to turn that legacy sprawl into a clean, normalized EmDash schema that clients love editing and that performs exceptionally well on Astro.

## EmDash 1.3 importer behavior

Use EmDash's supported WordPress importer at `/_emdash/admin/import/wordpress`;
Baseline does not ship a `scripts/migrate-wordpress.mjs` wrapper. Keep the source
export, reviewed analysis/mappings and a target backup before importing. The
following behavior is supplied by EmDash 1.3, not a custom Baseline migration:

- **ACF internal post types:** WXR imports skip `acf_field` and `acf_field_group`.
  They are field definitions, not editorial collections. Audit accidental
  collections from older imports before removing them; check dependencies and
  preserve backups rather than automatically deleting anything.
- **Imported links:** links to the source WordPress domain become root-relative
  paths while retaining the source permalink structure. `/2024/05/example/` is
  not automatically mapped to a new `/news/example/` route. Maintain an explicit
  redirect/URL register and test links, fragments, queries and locale destinations
  on representative imported content. Rewriting a URL is not media-byte transfer.
- **Exporter ACF values:** the EmDash Exporter can import matching ACF fields;
  repeaters, groups and relationships arrive as JSON. Relationship, post-object,
  user and taxonomy values retain IDs rather than nested records. Treat this as
  preservation input for the candidate register and normalized target model,
  not proof that native relations have been modeled. Older over-expanded JSON
  needs a reviewed repair; re-importing skips existing entries and will not fix it.
- **Cloudflare challenges:** a challenged source returns `WP_SITE_CHALLENGE`
  (HTTP 502) with an actionable explanation. Challenges on taxonomy/menu/settings/
  media-list requests stop the import rather than silently producing an incomplete
  site. Fix access for the authorized migration client using narrowly scoped source
  protection rules, or use the supported offline WXR path. Retry analysis and
  reconcile counts before execution; never classify a challenge as an empty source.
- **Dynamic blocks:** unsupported server-rendered blocks can survive as HTML
  placeholders containing the original block comments. They render no public
  content until deliberately rebuilt; count and classify them during acceptance.
- **Fidelity & Acceptance Matrix:** Consult the [WordPress Importer Fidelity Matrix](importer-fidelity-matrix.md)
  for runtime-verified behavior on blocks, galleries, SEO overrides, and guest bylines.
  Verify migrations programmatically with [Migration Acceptance](migration-acceptance.md),
  [Content Inventories](migration-content-inventories.md), and the [Migration Cutover Runbook](migration-cutover.md).

See the [1.3 release notes](https://github.com/emdash-cms/emdash/releases/tag/emdash%401.3.0)
and [official migration guide](https://docs.emdashcms.com/migration/from-wordpress/).
These operations apply to the `emdash` profile. Static profiles need their own
reviewed extraction into native file collections.

---

## 1. The Content Candidate Register

A WordPress custom post type is only one signal that something deserves its own content model. In many WordPress sites, critical operational entities were never modeled as CPTs at all—they were embedded in page bodies, widget areas, or ACF JSON blobs.

### Uncovering Implicit Entities

Before designing the EmDash schema, audit the source site for repeated or independently managed entities:
* **Embedded Rosters & People:** Coaches, board members, speakers, or staff listed inside page text.
* **Schedules & Sessions:** Training hours, office shifts, or class timetables trapped in tables or builder accordions.
* **Locations & Venues:** Pitches, stadiums, branch offices, or meeting rooms hardcoded in contact pages.
* **Sponsors & Partners:** Logos and tier lists pasted into footers or page builder columns.
* **Documents & Downloads:** PDF policy documents, annual reports, or match rules scattered across posts.

### Register Format

Document your audit in `audit/content-candidate-register.md`:

| Candidate Entity | Source Location | Cardinality | Proposed EmDash Model | Rationale / Relationship |
| :--- | :--- | :--- | :--- | :--- |
| `training_sessions` | Club page accordion | 1:N per Team | Separate collection (`routable: false`) | Linked to `teams` via reference; schedules change seasonally |
| `venues` / `pitches` | Free text in sessions | 1:N shared | Master lookup collection | Shared address & map links across all team training |
| `sponsors` | Homepage footer grid | N items | Translatable collection | Editors need to add/remove sponsors with active dates |
| `documents` | Resources page | N items | Collection with media field | Categorized downloads linked to committee meetings |

Classify every candidate as:
1. **First-Class Collection:** Independent entity with structured querying, filtering, or relations.
2. **Page Content / Portable Text:** Genuine narrative prose belonging to a single page.
3. **Site Setting:** Global shared configuration (e.g. social links, contact email).
4. **Deliberate Exclusion:** Obsolete plugins, dead campaigns, or legacy spam.

---

## 2. Relational Modeling vs. Schema Column Limits

### The 50-Column Physical Schema Budget

Cloudflare D1 enforces a hard limit of **100 columns per database table**. SQLite allows more, but wide tables degrade query performance and result sets.

Baseline enforces a project-level budget of **50 physical columns per collection table**. Verify this at any time:
```sh
npm run check:schema-budget
```

### Relational Normalization (Stop Dumping Repeaters into JSON)

Avoid the anti-pattern of creating 40 custom fields on a single page or dumping complex repeaters into raw JSON textareas. Instead, extract child entities into separate collections:

```text
┌──────────────────────────┐          ┌──────────────────────────┐
│      ec_events           │          │       ec_sessions        │
├──────────────────────────┤          ├──────────────────────────┤
│ id                       │◄─────────│ event_id (reference)     │
│ title                    │          │ day_of_week (enum)       │
│ lead_speaker (reference) │          │ start_time               │
│ speakers (ref array)     │          │ venue_id (reference)     │
└──────────────────────────┘          └──────────────────────────┘
```

* **1:N Operational Child Collections:** E.g. `events` → `sessions`. The parent holds references to children, or children reference the parent.
* **Shared Master Data:** E.g. `venues` or `locations`. Bind child records via a `reference` field rather than re-typing venue names as free-text strings across fifty entries.
* **Cross-Locale Automatic Binding:** EmDash relations (`_emdash_content_references`) store `parent_group` and `child_group`. A relationship linked in the default locale resolves automatically on secondary locale versions without manual re-linking.

---

## 3. Semantic Field Typing

Never leave raw, stringly-typed WordPress meta values in your clean CMS.

1. **Enums & Choices:** Convert free-text strings (e.g. partner tiers, membership types, categories) into `select` or `multiSelect` fields with explicit options and sensible defaults.
2. **Routable vs Non-Routable Collections:** Explicitly set `routable: false` in collection definitions for entities that do not have their own standalone public page (e.g., `training_sessions`, `hero_slides`, `contact_submissions`). This frees editors from having to invent meaningless URL slugs.
3. **Clean Rich Text:** Strip legacy WordPress shortcodes (`[gallery]`, `[vc_row]`) and wrapper markup when mapping to EmDash's `portableText`.

---

## 4. Admin UX & Language Strategy

Make the administrative CMS intuitive for non-technical client editors:

* **Slugs vs. Display Labels:**
  * **Database Slugs:** Keep collection and field slugs in consistent **ASCII / English** (`training_sessions`, `phone_number`, `sort_order`) and use localized display labels. Stable identifiers make API mappings easier to maintain; schema and query acceptance remain separate checks.
  * **Admin Display Labels:** Author all human-facing labels (`label`, `label_singular`, `field.label`, select options) in the **client's primary working language** (e.g., French or Dutch).
* **Sidebar Grouping (`nav_group`):** Group collections into 2–4 logical collapsible folders in `live.config.ts`:
  * *Contenu éditorial* (Pages, Articles, Actualités)
  * *Club & Équipes* (Équipes, Horaires d'entraînement, Lieux)
  * *Partenaires & Médias* (Sponsors, Galeries, Documents)
* **Phosphor Icons:** Assign descriptive Phosphor icons to each collection so volunteers can navigate visually.

---

## 5. Post-Import Media Preparation & Ingestion

WordPress imports often leave assets in an unfiled, flat media pool with messy filenames (e.g. `3206-Photo-team-scaled.jpg`) and unmigrated attachment references.

Instead of mutating raw SQLite tables in place, use Baseline's manifest-driven media preparation pipeline ([Native Image Delivery](image-delivery.md)):

```bash
# 1. Inventory reviewed attachment metadata; no source, CMS or R2 mutations:
npm run media:migrate-wp -- --source ./wp-uploads --source-id legacy-site --metadata ./wp-media.json --out .emdash/backups/wp-plan-001

# 2. After reviewing manifest.json, prepare bytes into a new private stage:
npm run media:migrate-wp -- --prepare --source ./wp-uploads --source-id legacy-site --metadata ./wp-media.json --out .emdash/backups/wp-prepared-001

# 3. Review plan.json / prepared.json; supply EMDASH_TOKEN securely for this local target:
npm run media:migrate-wp -- --apply-local --stage .emdash/backups/wp-prepared-001 --url http://127.0.0.1:4321
```

The metadata file must use the reviewed `metadataVersion: 1` attachment format
in [Native Image Delivery](image-delivery.md), not an arbitrary WordPress export.
Use the actual local URL printed by Astro. Every output directory must be new;
`--resume` applies only to an identical preparation stage.

1. **Preserves originals and identity:** hashes bytes, records attachment/locale/crop relationships and quarantines unresolved inputs. Filename suffixes do not authorize renaming or deleting originals; distinct metadata identities are not collapsed by equal bytes.
2. **Separates artifacts:** inventory produces `manifest.json`; preparation produces `plan.json`, `prepared.json`, archived originals and prepared bytes. There is no generated `plan.md` or automatic clean-slug rewrite.
3. **Uses supported ingestion:** uploads to an explicitly selected loopback EmDash instance through the REST media API and verifies returned IDs, metadata, storage keys and bytes. Updating content references is a separate revision-bound API operation.
4. **Stages cloud objects separately:** `--stage-r2` consumes the verified prepared stage and writes an object tree plus `staging.json`; it does not upload to R2. Use the explicit `media:sync-r2` plan/apply commands in the image-delivery runbook for that step.

