import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { assertCollectionColumnBudget, collectionColumnCounts } from './schema-column-budget.mjs';

function sqlitePath(value) {
  let path = String(value || 'file:./data.db').replace(/^file:/, '').split(/[?#]/, 1)[0];
  path = decodeURIComponent(path);
  if (/^\/{1,3}[A-Za-z]:[\\/]/.test(path)) path = path.replace(/^\/+/, '');
  return isAbsolute(path) ? path : resolve(path || './data.db');
}

const path = sqlitePath(process.argv[2] || process.env.EMDASH_SQLITE_URL);
if (!existsSync(path)) {
  console.warn(`Schema budget not measured: local SQLite database not found at ${path}. Run this check after EmDash setup and before a schema migration or D1 release.`);
  process.exit(0);
}

const db = new DatabaseSync(path, { readOnly: true });
try {
  const counts = collectionColumnCounts(db);
  if (counts.length === 0) {
    console.warn(`Schema budget not measured: no EmDash collection tables found in ${path}.`);
    process.exitCode = 0;
  } else {
    assertCollectionColumnBudget(counts);
    console.log(JSON.stringify(counts, null, 2));
  }
} finally {
  db.close();
}
