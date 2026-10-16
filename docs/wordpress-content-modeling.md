# WordPress Migration & Content Modeling

Migrating a WordPress website to EmDash and Astro is not just a copy-paste job. Real WordPress sites are messy: they accumulate legacy custom post types (CPTs), bloated ACF repeater fields, unstructured shortcodes, and operational data stuffed into raw Gutenberg or Elementor blocks.

Baseline provides a structured methodology to turn that legacy sprawl into a clean, normalized EmDash schema that clients love editing and that performs exceptionally well on Astro.

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
│      ec_teams            │          │   ec_training_sessions   │
├──────────────────────────┤          ├──────────────────────────┤
│ id                       │◄─────────│ team_id (reference)      │
│ title                    │          │ day_of_week (enum)       │
│ head_coach (reference)   │          │ start_time               │
│ roster (reference array) │          │ venue_id (reference)     │
└──────────────────────────┘          └──────────────────────────┘
```

* **1:N Operational Child Collections:** E.g. `teams` → `training_sessions`. The parent holds references to children, or children reference the parent.
* **Shared Master Data:** E.g. `venues`. Bind child records via a `reference` field rather than re-typing venue names as free-text strings across fifty entries.
* **Cross-Locale Automatic Binding:** EmDash relations (`_emdash_content_references`) store `parent_group` and `child_group`. A relationship linked in French resolves automatically on the English version of the page without manual re-linking.

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
  * **Database Slugs:** Always keep collection and field slugs in clean, standardized **ASCII kebab-case / English** (`training_sessions`, `phone_number`, `sort_order`). This guarantees stable API queries and clean database columns.
  * **Admin Display Labels:** Author all human-facing labels (`label`, `label_singular`, `field.label`, select options) in the **client's primary working language** (e.g., French or Dutch).
* **Sidebar Grouping (`nav_group`):** Group collections into 2–4 logical collapsible folders in `live.config.ts`:
  * *Contenu éditorial* (Pages, Articles, Actualités)
  * *Club & Équipes* (Équipes, Horaires d'entraînement, Lieux)
  * *Partenaires & Médias* (Sponsors, Galeries, Documents)
* **Phosphor Icons:** Assign descriptive Phosphor icons to each collection so volunteers can navigate visually.

---

## 5. Post-Import Media Cleanup & Hydration

WordPress imports deposit assets into an unfiled, flat media pool with messy filenames (e.g. `3206-Photo-team-scaled.jpg`) and leave custom fields storing raw string pointers (`wordpress-attachment:123`).

Before handing off the site, run Baseline's automated media organizer:

```bash
# Preview changes in dry-run mode:
node scripts/organize-media.mjs --dry-run

# Execute organization and database hydration:
npm run media:organize
```

This utility automatically:
1. **Establishes Folders:** Organizes assets into standard categories (`Pages`, `Articles`, `Documents`, `Media`) and collection-specific folders (`Teams`, `Sponsors`, `Galleries`).
2. **Slugifies Filenames:** Strips WordPress camera prefixes, numeric IDs, and resizing tags (`-scaled`, `-150x150`) into clean lowercase slugs (`photo-team.jpg`).
3. **Hydrates Content Fields:** Updates renamed filenames across `ec_*` tables and converts raw attachment strings into full EmDash structured media objects (`{ id, provider: 'local', filename, url, width, height }`) so the CMS Media Picker can render thumbnails.
