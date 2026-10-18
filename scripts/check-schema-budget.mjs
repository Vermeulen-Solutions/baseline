import { DatabaseSync } from 'node:sqlite';
import { statSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkCollectionColumnBudget } from './lib/schema-column-budget.mjs';

// Match installed EmDash 1.2: strip "file:" only. Decoding percent escapes or
// removing query/hash suffixes would select a different file from the app.
export function resolveSqlitePath(value = 'file:./data.db', cwd = process.cwd()) {
  const filename = value.startsWith('file:') ? value.slice(5) : value;
  if (!filename || filename === ':memory:' || filename.startsWith('//') ||
      (/^[a-z][a-z0-9+.-]*:/i.test(filename) && !/^[a-z]:[\\/]/i.test(filename))) {
    throw new Error('Schema budget not measured: provide a local SQLite filename (file:./name.db or an absolute path).');
  }
  return path.resolve(cwd, filename);
}

export function measureSchemaBudget(filename) {
  // A failed/missing preflight must never create a database or pass empty.
  try {
    if (!statSync(filename).isFile()) throw new Error('Not a regular file');
  } catch {
    throw new Error('Schema budget not measured: selected SQLite file is missing or not a regular file. Supply an existing database; this check never seeds one.');
  }
  const db = new DatabaseSync(filename, { readOnly: true });
  try {
    db.exec('PRAGMA query_only=ON');
    const counts = checkCollectionColumnBudget(db);
    if (!counts.length) throw new Error('Schema budget not measured: selected SQLite file has no EmDash collection tables.');
    return counts;
  } finally { db.close(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.argv.length > 3 || process.argv[2]?.startsWith('--')) throw new Error('Usage: node scripts/check-schema-budget.mjs [sqlite-filename]');
    const filename = resolveSqlitePath(process.argv[2] || process.env.EMDASH_SQLITE_URL || 'file:./data.db');
    console.log(JSON.stringify(measureSchemaBudget(filename), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
