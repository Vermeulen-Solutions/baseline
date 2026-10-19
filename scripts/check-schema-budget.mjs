import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { assertCollectionColumnBudget, collectionColumnCounts, COLLECTION_COLUMN_BUDGET } from './schema-column-budget.mjs';

function sqlitePath(value) {
  let path = String(value || 'file:./data.db').replace(/^file:/, '').split(/[?#]/, 1)[0];
  path = decodeURIComponent(path);
  if (/^\/{1,3}[A-Za-z]:[\\/]/.test(path)) path = path.replace(/^\/+/, '');
  return isAbsolute(path) ? path : resolve(path || './data.db');
}

function main() {
  const path = sqlitePath(process.argv[2] || process.env.EMDASH_SQLITE_URL);
  if (!existsSync(path)) {
    console.warn(`Schema budget not measured: local SQLite database not found at ${path}. Run this check after EmDash setup and before a schema migration or D1 release.`);
    return;
  }

  const db = new DatabaseSync(path, { readOnly: true });
  try {
    const counts = collectionColumnCounts(db);
    if (counts.length === 0) {
      console.warn(`Schema budget not measured: no EmDash collection tables found in ${path}.`);
      process.exitCode = 0;
    } else {
      const oversized = counts.filter(item => item.columns > COLLECTION_COLUMN_BUDGET);
      if (oversized.length) {
        console.error('Collection column budget exceeded\nExpected vs Received:');
        for (const { table, columns } of oversized) {
          const names = db.prepare(`PRAGMA table_xinfo("${table.replaceAll('"', '""')}")`).all().slice(COLLECTION_COLUMN_BUDGET).map(column => column.name);
          console.error(`  Table: ${table}\n  Expected: <= ${COLLECTION_COLUMN_BUDGET} physical columns\n  Received: ${columns} physical columns\n  Extra columns (ordinal ${COLLECTION_COLUMN_BUDGET + 1}+): ${names.map(name => JSON.stringify(name)).join(', ')}`);
        }
        console.error(`Source: ${path}\nRemediation: review generated/retained columns and normalize the collection via emdash-content-modeling. Ordinal overflow is not a safe deletion list.\nRecheck: npm run check:schema-budget -- "${path}"`);
        process.exitCode = 1;
        return;
      }
      assertCollectionColumnBudget(counts);
      console.log(JSON.stringify(counts, null, 2));
    }
  } finally {
    db.close();
  }
}

try { main(); }
catch (error) {
  console.error(`Schema budget check failed: ${error.message}\nRemediation: check the SQLite path/permissions, then run npm run check:schema-budget -- <database-file>.`);
  process.exitCode = 1;
}
