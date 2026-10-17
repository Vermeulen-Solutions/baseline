---
name: emdash-content-modeling
description: Architect, normalize, refine, and migrate EmDash content models for both greenfield builds and active brownfield sites. Covers relational design vs embedded fields, enum constraints, entity variant decomposition, schema migration scripts, dual-read template compatibility, multi-database parity (SQLite, D1, seed), field pruning, and menu synchronization.
---

# EmDash Content Modeling & Schema Evolution

Design and evolve content schemas, relationships, and data pipelines for Astro + EmDash sites.

This skill operates in two distinct situations:
1. **Greenfield Architecture:** Designing clean, normalized collections, fields, and relations during initial site setup (Stage 3 of `new-site-workflow`).
2. **Brownfield Evolution:** Refactoring, normalizing, or pruning content models on an **existing site with live data** across local SQLite, remote Cloudflare D1, and reproducible seeds.

---

## 1. Core Architectural Principles

### Relational vs. Embedded Decision Tree
Do not bury entities in unstructured JSON repeaters, ad-hoc text fields, or delimiter-separated strings (e.g. `"Lead Designer · Product Manager"`) if those entities require independent lifecycle management.

| Pattern | When to Use | EmDash Implementation |
|---|---|---|
| **Dedicated Collection + Relation** | Entity is shared, cross-linked, filtered, or has its own metadata (e.g. Locations/Venues, Schedule Sessions, People/Team Members, Documents, Partners). | Distinct collection + `_emdash_relations` + `_emdash_content_references` |
| **Strict Select / Enum Field** | Value belongs to a closed, predictable set (e.g. Status: `draft`/`published`/`archived`; Tiers: `platinum`/`gold`/`community`; Days: `monday`–`sunday`; Categories: `article`/`case-study`/`announcement`). | Field `type: "select"` with explicit `options: [...]` |
| **Repeater Field** | Lightweight, strictly private sub-items that never need to be linked elsewhere or shared between parents. | Field `type: "repeater"` |
| **Rich Text / Portable Text** | Unstructured narrative copy, long-form editorial content. | Field `type: "rich_text"` |

### Entity Variant & Sub-Category Decomposition (First-Class Records)
When an organization has multiple distinct variants, sub-teams, or cohorts within a high-level category (e.g. specialized departments within an agency, distinct squad age-cohorts in a sports club, or distinct service packages):
- **Avoid:** Cramming multiple variants into a single parent record using confusing "subgroup" strings or messy repeater exceptions.
- **Adopt:** Create distinct first-class collection entries for each variant. Each entry owns its own:
  - Distinct leads, managers, or contacts (via relations to `people`).
  - Distinct media assets (photos, logos, badges) and display title.
  - Distinct schedule sessions or operational times (via relations to a child collection such as `sessions` or `schedules`).
  - Distinct external link endpoints (e.g. external booking links, portal URLs, partner sites).
- **Navigation & ordering:** Keep entity variants grouped logically in navigation menus and directories (e.g. sub-departments ordered under their parent division).

### Native Row-per-Locale Multilingual Architecture
- Every editorial collection must use native row-per-locale architecture: each record has a `locale` (matching the site's configured locales, e.g. `defaultLocale` and secondary locales) and a shared `translation_group` ULID.
- Cross-collection relations link parents and children via `translation_group`s so that referencing an item automatically resolves to the matching locale row in public queries.
- Never duplicate fields with language suffixes (avoid `title_en`, `description_en` columns).

---

## 2. Brownfield Evolution Protocol (Existing Live Sites)

When modifying content models on an active site with existing content in SQLite (`data.db`) and Cloudflare D1 (or a legacy CMS migration), follow this zero-downtime, non-destructive sequence:

### Step 1: Audit & Backup
1. Inspect existing table schemas (`PRAGMA table_info(...)`).
2. Identify smells:
   - Repeated JSON arrays that should be relational rows.
   - Ambiguous free-text fields where editors type inconsistent strings.
   - Orphaned, confusing, or unused legacy fields (e.g. free-text location notes, scratch marker columns).
3. Create a snapshot backup before running schema modifications.
4. **Present the Schema Evolution Plan to the user:**
   Do not modify tables immediately without presenting a plain-English proposal:
   > **Content Model Audit Findings**
   > We identified the following areas to improve in your database:
   > - *[Smell]*: E.g., Event schedule sessions are crammed inside free-text fields.
   > - *[Proposal]*: Extract into a dedicated `sessions` collection linked to `events`.
   >
   > **Recommended Action:**
   > 1. **(Recommended) Execute the zero-downtime migration:** Register new collections, run the migration script, and update templates with dual-read fallbacks.
   > 2. **Adjust schema proposals:** Modify proposed collection names or fields before migrating.

### Step 2: Schema Registration
1. Register new collections in `_emdash_collections`.
2. Register new or modified fields in `_emdash_fields` (including `options` for select enums).
3. Register new relations in `_emdash_relations` (e.g. `events_sessions`, `sessions_locations`).
4. Update `.emdash/schema.json` and project types (`npm run build` or `npm run typecheck`).

### Step 3: Data Migration Scripting
Write an idempotent Node.js migration script using `node:sqlite` (or `better-sqlite3` depending on environment):
1. Read existing rows from the source table.
2. Transform and generate new normalized child entries with valid ULIDs and translation groups.
3. Insert relation records into `_emdash_content_references` mapping `parent_group` to `child_group`.
4. Keep the legacy column populated as a fallback during the transition phase.

### Step 4: Backward-Compatible Astro Templates (Dual-Read Pattern)
Never break existing page rendering while migrating. Components must accept both relational data and legacy fields:

```astro
---
// Dual-read fallback pattern
const rawRelational = Astro.props.sessions || item.sessions;
const relationalRows = Array.isArray(rawRelational) && rawRelational.length
  ? rawRelational.map((s: any) => ({
      ...(s.data || s),
      location: s.data?.location_text ?? s.location_text ?? s.location
    }))
  : [];

const legacySchedule = Array.isArray(data.schedule) ? data.schedule : [];
// Prefer relational rows if populated; fall back to legacy array
const scheduleRows = relationalRows.length ? relationalRows : legacySchedule;
---
```

### Step 5: The 3-Way Multi-Environment Parity Protocol
Every schema and data change must be applied and verified across all three environments:

1. **Local SQLite (`data.db`):** Run the migration script locally. Test with `npm run dev` and `npm run typecheck`.
2. **Cloudflare D1 (`<db-binding>`):**
   - Export SQL statements or write a dedicated `.sql` migration script.
   - Execute via Wrangler: `npx wrangler d1 execute <db-name> --remote --file=scripts/<migration>.sql`.
   - Rebuild and deploy the Cloudflare Worker: `npm run build:cloudflare && npm run deploy:cloudflare`.
   - Verify live rendered HTML on `workers.dev` or production domain.
3. **Version-Controlled Seed (`seed/seed.json`):**
   - Sync the new collections, fields, relations, and migrated entries into `seed/seed.json`.
   - Ensures fresh clones or team checkouts reproduce the exact evolved data model.

### Step 6: Navigation & Menu Synchronization
When splitting entities, adding new categories, or reordering items:
1. Update database menus (`_emdash_menus` and `_emdash_menu_items`) across all configured locales.
   - Set explicit `sort_order` and matching `parent_id`.
2. Update template fallback order arrays (e.g. category or directory sort order lists in layout shells).
3. Verify mobile submenus, disclosure dropdowns, and breadcrumbs.

### Step 7: Safe Field Pruning & Deprecation
Once new structures are verified live:
1. Remove deprecated field definitions from `_emdash_fields` so editors no longer see obsolete, confusing inputs in the EmDash admin UI.
2. Keep the database columns in the table (or leave them nullable) so historical backups remain restorable.
3. Document retired fields and their migration paths in the repository audit log.

---

## 3. Verification Checklist

- [ ] `npm run typecheck` passes with 0 errors across all files.
- [ ] All configured site locales render complete records without missing fields or broken links.
- [ ] Primary navigation and mobile disclosures display items in the correct designated order.
- [ ] Remote D1 has all relational rows and junction references (`_emdash_content_references`).
- [ ] `seed/seed.json` reflects the evolved schema and content items.
- [ ] Cloudflare Worker is built and deployed (`build:cloudflare` + `deploy:cloudflare`) when Cloudflare hosting is used.

---

## 4. Schema Evolution Handoff Prompt

When the schema migration and verification checklist pass:
> **Content Modeling Complete & Verified!**
> All normalized collections, relations, and dual-read templates have been tested across local and remote databases.
>
> **Recommended Next Step:**
> - Return to `new-site-workflow`:
>   - If in a greenfield build: proceed to **Stage 4: Visual Direction & Art Direction**.
>   - If in brownfield modernization: run `npm run typecheck` and `npm run test:site-audit` to confirm all standards pass.
