# Schema Evolution & Brownfield Migration Checklist

This reference provides concrete patterns for evolving an EmDash content model on a live site without downtime or data corruption.

## 1. Relational Junction Queries in EmDash

When querying parent entries with child references (e.g. `events` with child `sessions`, `speakers`, `documents`):

```typescript
// Querying an entry with expanded relational references
const result = await getEmDashEntry("events", slugOrId, {
  references: {
    speakers: { limit: 100 },
    sessions: { limit: 100 },
    documents: { limit: 100 }
  },
  locale
});

const speakers = (result.entry?.references?.speakers?.entries || []) as Entry[];
const sessions = (result.entry?.references?.sessions?.entries || []) as Entry[];
const documents = (result.entry?.references?.documents?.entries || []) as Entry[];
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
const parents = db.prepare("SELECT id, slug, translation_group, locale, legacy_sessions FROM ec_events WHERE legacy_sessions IS NOT NULL").all();

for (const parent of parents) {
  const sessions = JSON.parse(parent.legacy_sessions || "[]");
  for (const session of sessions) {
    const childId = generateId();
    const childGroup = generateId();

    // 2. Insert normalized child entry
    db.prepare(`
      INSERT INTO ec_sessions (id, translation_group, locale, status, title, format, day, start_time, location_text, created_at, updated_at)
      VALUES (?, ?, ?, 'published', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(childId, childGroup, parent.locale, `${parent.slug} - ${session.title}`, session.format, session.day, session.start_time, session.location);

    // 3. Link via _emdash_content_references
    db.prepare(`
      INSERT INTO _emdash_content_references (id, relation_id, parent_group, child_group, sort_order, created_at)
      VALUES (?, ?, ?, ?, 0, datetime('now'))
    `).run(generateId(), "events_sessions_relation_id", parent.translation_group, childGroup);
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
DELETE FROM _emdash_fields WHERE collection_id = 'events_collection_id' AND slug IN ('old_field_slug_1', 'old_field_slug_2');
```

Always back up the existing rows from `_emdash_fields` before deletion.
