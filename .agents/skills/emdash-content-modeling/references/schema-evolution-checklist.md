# Schema Evolution & Brownfield Migration Checklist

This reference provides concrete patterns for evolving an EmDash content model on a live site without downtime or data corruption.

## 1. Relational Junction Queries in EmDash

When querying parent entries with child references (e.g. `teams` with child `training_sessions`, `coaches`, `managers`):

```typescript
// Querying an entry with expanded relational references
const result = await getEmDashEntry("teams", slugOrId, {
  references: {
    coaches: { limit: 100 },
    managers: { limit: 100 },
    training_sessions: { limit: 100 },
    documents: { limit: 100 }
  },
  locale
});

const coaches = (result.entry?.references?.coaches?.entries || []) as Entry[];
const managers = (result.entry?.references?.managers?.entries || []) as Entry[];
const sessions = (result.entry?.references?.training_sessions?.entries || []) as Entry[];
```

## 2. Safe SQLite & D1 Data Migration Template

When writing a migration script to normalize embedded data into child rows:

```javascript
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";

const db = new DatabaseSync("data.db");

// Helper to generate a 26-char ULID-like identifier if needed
function generateId() {
  return "01M" + crypto.randomBytes(11).toString("hex").toUpperCase().slice(0, 23);
}

// 1. Fetch parent rows containing legacy embedded data
const parents = db.prepare("SELECT id, slug, translation_group, locale, training_schedule FROM ec_teams WHERE training_schedule IS NOT NULL").all();

for (const parent of parents) {
  const schedule = JSON.parse(parent.training_schedule || "[]");
  for (const session of schedule) {
    const childId = generateId();
    const childGroup = generateId();

    // 2. Insert normalized child entry
    db.prepare(`
      INSERT INTO ec_training_sessions (id, translation_group, locale, status, title, season, day, time, location_text, created_at, updated_at)
      VALUES (?, ?, ?, 'published', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(childId, childGroup, parent.locale, `${parent.slug} ${session.day}`, session.season, session.day, session.time, session.location);

    // 3. Link via _emdash_content_references
    db.prepare(`
      INSERT INTO _emdash_content_references (id, relation_id, parent_group, child_group, sort_order, created_at)
      VALUES (?, ?, ?, ?, 0, datetime('now'))
    `).run(generateId(), "teams_training_sessions_relation_id", parent.translation_group, childGroup);
  }
}
```

## 3. Remote Cloudflare D1 Migration Execution

Always write D1 migrations to `.sql` files to avoid shell escaping issues with Unicode characters or special symbols:

```bash
# Execute against remote D1 database
npx wrangler d1 execute <database-binding-name> --remote --file=scripts/migration.sql
```

## 4. Pruning Obsolete Fields from the Admin UI

To prevent editors from entering stale data into deprecated fields without dropping underlying table columns:

```sql
-- Remove field registration so it disappears from the EmDash editor
DELETE FROM _emdash_fields WHERE collection_id = 'teams_collection_id' AND slug IN ('old_field_slug_1', 'old_field_slug_2');
```

Always back up the existing rows from `_emdash_fields` before deletion.
