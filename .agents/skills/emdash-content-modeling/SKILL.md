---
name: emdash-content-modeling
description: Architect, normalize, refine, and migrate EmDash content models for both greenfield builds and active brownfield sites. Covers relational design vs embedded fields, enum constraints, squad decomposition, schema migration scripts, dual-read template compatibility, multi-database parity (SQLite, D1, seed), field pruning, and menu synchronization.
---

# EmDash Content Modeling & Schema Evolution

Design and evolve content schemas, relationships, and data pipelines for Astro + EmDash sites.

This skill operates in two distinct situations:
1. **Greenfield Architecture:** Designing clean, normalized collections, fields, and relations during initial site setup (Stage 3 of `new-site-workflow`).
2. **Brownfield Evolution:** Refactoring, normalizing, or pruning content models on an **existing site with live data** across local SQLite, remote Cloudflare D1, and reproducible seeds.

---

## 1. Core Architectural Principles

### Relational vs. Embedded Decision Tree
Do not bury entities in unstructured JSON repeaters, ad-hoc text fields, or delimiter-separated strings (e.g. `"Josefina · Céline"`) if those entities require independent lifecycle management.

| Pattern | When to Use | EmDash Implementation |
|---|---|---|
| **Dedicated Collection + Relation** | Entity is shared, cross-linked, filtered, or has its own metadata (e.g. Venues, Training Sessions, People/Coaches, Documents). | Distinct collection + `_emdash_relations` + `_emdash_content_references` |
| **Strict Select / Enum Field** | Value belongs to a closed, predictable set (e.g. Seasons: `outdoor`/`indoor`; Days: `Lundi`, `Mercredi`, `Vendredi`; Squad Genders: `Hommes`, `Dames`, `Filles`, `Mixte`). | Field `type: "select"` with explicit `options: [...]` |
| **Repeater Field** | Lightweight, strictly private sub-items that never need to be linked elsewhere or shared between parents. | Field `type: "repeater"` |
| **Rich Text / Portable Text** | Unstructured narrative copy, long-form editorial content. | Field `type: "rich_text"` |

### Squad & Team Decomposition (First-Class Squads)
When an athletic club or organization has multiple squads within a category (e.g. Juniors U15 Mixte vs. Juniors U15 Filles, or multiple competitive age cohorts):
- **Avoid:** Cramming multiple squads into a single team record using confusing "subgroup" strings or messy repeater exceptions.
- **Adopt:** Create distinct first-class `teams` entries for each squad. Each entry owns its own:
  - Distinct team managers and coaches (via relations to `people`).
  - Distinct squad photo and display name.
  - Distinct training sessions (via relations to `training_sessions`).
  - Distinct league, results, and fixtures URLs (e.g. Clubee, Swiss Hockey).
- **Navigation & ordering:** Keep squads grouped logically in navigation menus and team directories (e.g. U15 Mixte immediately followed by U15 Filles before U12).

### Native Row-per-Locale Multilingual Architecture
- Every editorial collection must use native row-per-locale architecture: each record has a `locale` (`fr` or `en`) and a shared `translation_group` ULID.
- Cross-collection relations link parents and children via `translation_group`s so that referencing an item automatically resolves to the matching locale row in public queries.
- Never duplicate fields with language suffixes (avoid `title_en`, `description_en` columns).

---

## 2. Brownfield Evolution Protocol (Existing Live Sites)

When modifying content models on an active site with existing content in SQLite (`data.db`) and Cloudflare D1 (`legacy WordPress migration`), follow this zero-downtime, non-destructive sequence:

### Step 1: Audit & Backup
1. Inspect existing table schemas (`PRAGMA table_info(...)`).
2. Identify smells:
   - Repeated JSON arrays that should be relational rows.
   - Ambiguous free-text fields where editors type inconsistent strings.
   - Orphaned, confusing, or unused legacy fields (e.g. "sous groupe", "lieu libre").
3. Create a snapshot backup before running schema modifications.

### Step 2: Schema Registration
1. Register new collections in `_emdash_collections`.
2. Register new or modified fields in `_emdash_fields` (including `options` for select enums).
3. Register new relations in `_emdash_relations` (e.g. `teams_training_sessions`, `training_sessions_locations`).
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
const rawRelational = Astro.props.trainingSessions || item.training_sessions;
const relationalRows = Array.isArray(rawRelational) && rawRelational.length
  ? rawRelational.map((s: any) => ({
      ...(s.data || s),
      location: s.data?.location_text ?? s.location_text ?? s.location
    }))
  : [];

const legacySchedule = Array.isArray(data.training_schedule) ? data.training_schedule : [];
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
When splitting entities, adding new teams, or reordering items:
1. Update database menus (`_emdash_menus` and `_emdash_menu_items`) in both locales.
   - Set explicit `sort_order` and matching `parent_id`.
2. Update template fallback orders (e.g. `teamOrder` arrays in `Base.astro` and `TeamsPage.astro`).
3. Verify mobile submenus, disclosure dropdowns, and breadcrumbs.

### Step 7: Safe Field Pruning & Deprecation
Once new structures are verified live:
1. Remove deprecated field definitions from `_emdash_fields` so editors no longer see obsolete, confusing inputs in the EmDash admin UI.
2. Keep the database columns in the table (or leave them nullable) so historical backups remain restorable.
3. Document retired fields and their migration paths in the repository audit log.

---

## 3. Verification Checklist

- [ ] `npm run typecheck` passes with 0 errors across all files.
- [ ] Both locales (`fr` and `en`) render complete records without missing fields or broken links.
- [ ] Primary navigation and mobile disclosures display items in the correct designated order.
- [ ] Remote D1 has all relational rows and junction references (`_emdash_content_references`).
- [ ] `seed/seed.json` reflects the evolved schema and content items.
- [ ] Cloudflare Worker is built and deployed (`build:cloudflare` + `deploy:cloudflare`).
