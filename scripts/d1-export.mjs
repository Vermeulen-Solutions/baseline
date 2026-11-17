// Full, verified SQL export of a D1 database, including EmDash's FTS5 search tables, which
// `wrangler d1 export` refuses (found updating a live Workers site: "cannot export databases with
// virtual tables"). Read-only against the database:
//
//   npm run db:export-d1 -- [--database <name>] [--out <file.sql>] [--local]
//
// The copy holds users, sessions and content, so it is written only where Git ignores it: the
// default is .emdash/backups/, and inside a Git repository any destination Git would track is
// refused (add the folder to .gitignore first).
//
// 1. Reads sqlite_master, then exports every ordinary table with `wrangler d1 export --table`.
// 2. Orders the file so every table exists before any row is inserted (D1 rejects an insert whose
//    foreign-key target table does not exist yet, even with deferred foreign keys).
// 3. Adds the FTS5 tables with their rows, read page by page, then every index and trigger. Triggers
//    come last, so loading the rows fires none of them.
// 4. Counts every table in D1 and loads the result into a scratch SQLite file to compare row counts,
//    object counts, integrity and foreign keys. The export and <out>.manifest.json are written only
//    when everything matches.
// The output loads into a local D1 for an upgrade rehearsal with `npm run db:rehearse`, which loads
// it directly: D1 refuses statements over 100 KB, so `wrangler d1 execute --file` fails on large
// rows (the manifest lists them). It is a portable copy for rehearsal and inspection; for recovery
// use D1 Time Travel.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { parse as parseJSONC } from 'jsonc-parser';
import { execNpmSync } from './process-runner.mjs';
import { argumentsOf, bytesOf, isMain } from './infrastructure-io.mjs';
import { splitSQL } from './d1-snapshot.mjs';

const PAGE = 500;      // FTS rows per query
const PER_COMMAND = 15; // count statements per wrangler call (Windows command-line and D1 limits)
export const D1_STATEMENT_LIMIT = 100_000; // bytes; D1 rejects longer statements (SQLITE_TOOBIG)
export const DEFAULT_BACKUP_DIR = '.emdash/backups';

// 'ignored', 'tracked' (Git would commit it) or 'outside' (not in a Git work tree).
export function gitIgnoreStatus(file, run = spawnSync) {
  let directory = path.dirname(path.resolve(file));
  while (!fs.existsSync(directory)) directory = path.dirname(directory);
  const inside = run('git', ['rev-parse', '--is-inside-work-tree'], { cwd: directory, encoding: 'utf8', windowsHide: true });
  if (inside.status !== 0 || String(inside.stdout).trim() !== 'true') return 'outside';
  const checked = run('git', ['check-ignore', '-q', '--no-index', path.resolve(file)], { cwd: directory, encoding: 'utf8', windowsHide: true });
  return checked.status === 0 ? 'ignored' : 'tracked';
}

export function assertSafeDestination(file, run = spawnSync) {
  if (gitIgnoreStatus(file, run) === 'tracked') throw new Error(`${file} is not ignored by Git, and a database copy holds users, sessions and content. Add ${DEFAULT_BACKUP_DIR}/ (or the destination folder) to .gitignore, or choose a destination outside the repository.`);
}

// Statements D1 would refuse when the export is loaded with `wrangler d1 execute --file`.
export function oversizedStatements(statements, limit = D1_STATEMENT_LIMIT) {
  return statements.map(statement => ({ statement, bytes: Buffer.byteLength(statement, 'utf8') }))
    .filter(item => item.bytes > limit)
    .map(({ statement, bytes }) => ({ table: statement.match(/^INSERT\s+INTO\s+("(?:[^"]|"")+"|\S+)/i)?.[1]?.replace(/^"|"$/g, '').replaceAll('""', '"') ?? statement.slice(0, 40), bytes }));
}

function detectDatabase() {
  for (const file of ['wrangler.jsonc', 'wrangler.json']) {
    if (fs.existsSync(file)) {
      try {
        const errors = [];
        const data = parseJSONC(bytesOf(file, 1024 * 1024).toString('utf8'), errors, { allowTrailingComma: true });
        if (errors.length) continue;
        const d1 = data.d1_databases?.[0]?.database_name;
        if (d1) return d1;
      } catch {}
    }
  }
  return null;
}

export const quoteIdentifier = name => `"${String(name).replaceAll('"', '""')}"`;
export const quoteValue = value => value === null || value === undefined ? 'NULL'
  : typeof value === 'number' ? (Number.isFinite(value) ? String(value) : 'NULL')
  : typeof value === 'boolean' ? (value ? '1' : '0')
  : `'${String(value).replaceAll("'", "''")}'`;

// Wrangler's own export file, reordered: PRAGMA lines dropped, tables first, then everything else.
export function orderTablesFirst(sql) {
  const statements = splitSQL(sql).map(statement => statement.trim()).filter(Boolean).filter(statement => !/^PRAGMA\b/i.test(statement));
  const isTable = statement => /^CREATE\s+TABLE\b/i.test(statement);
  return [...statements.filter(isTable), ...statements.filter(statement => !isTable(statement))];
}

// Row counts for many tables in short calls: one statement per table (D1 caps compound SELECTs).
export function countStatements(names) {
  const batches = [];
  for (let i = 0; i < names.length; i += PER_COMMAND) batches.push(names.slice(i, i + PER_COMMAND).map(name => `SELECT ${quoteValue(name)} AS t, count(*) AS n FROM ${quoteIdentifier(name)}`).join('; '));
  return batches;
}

// Loads the export into a scratch SQLite file and compares it with the counts read from D1.
export function verifyExport(sql, expected) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'd1-export-verify-'));
  const file = path.join(directory, 'verify.sqlite');
  try {
    // Foreign keys are checked after loading, as D1 does at commit with deferred keys.
    const db = new DatabaseSync(file, { enableForeignKeyConstraints: false });
    try {
      db.exec(sql);
      const count = name => db.prepare(`SELECT count(*) AS n FROM ${quoteIdentifier(name)}`).get().n;
      const rowMismatches = Object.entries(expected.rows).filter(([name, n]) => count(name) !== n).map(([name, n]) => `${name}: ${n} in D1, ${count(name)} in export`);
      const objects = Object.fromEntries(['table', 'index', 'trigger'].map(type => [type, db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type = ? AND sql IS NOT NULL AND name NOT LIKE 'sqlite_%'").get(type).n]));
      const objectMismatches = Object.entries(expected.objects).filter(([type, n]) => objects[type] !== n).map(([type, n]) => `${type}: ${n} in D1, ${objects[type]} in export`);
      const integrity = db.prepare('PRAGMA integrity_check').get().integrity_check;
      const foreignKeyViolations = db.prepare('PRAGMA foreign_key_check').all().length;
      return { ok: !rowMismatches.length && !objectMismatches.length && integrity === 'ok' && foreignKeyViolations === 0, rowMismatches, objectMismatches, integrity, foreignKeyViolations, objects };
    } finally { db.close(); }
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

export function exportD1Database({ database, out, remote = true } = {}, runNpm = execNpmSync) {
  const dbName = database || detectDatabase();
  if (!dbName) throw new Error('Database name required: specify --database <name> or configure in wrangler.jsonc');

  const dateStr = new Date().toISOString().slice(0, 10);
  const finalExportFile = out ? path.resolve(out) : path.resolve(DEFAULT_BACKUP_DIR, `d1-export-${dbName}-${dateStr}.sql`);
  assertSafeDestination(finalExportFile);
  const manifestFile = `${finalExportFile}.manifest.json`;
  const tempExportFile = path.join(os.tmpdir(), `d1-export-${randomUUID()}.sql`);
  const wrangler = ['exec', '--', 'wrangler'];
  const target = remote ? '--remote' : '--local';
  const query = command => {
    const parsed = JSON.parse(runNpm([...wrangler, 'd1', 'execute', dbName, target, '--json', '--command', command], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }));
    if (!Array.isArray(parsed)) throw new Error(`D1 query failed: ${JSON.stringify(parsed).slice(0, 300)}`);
    return parsed.flatMap(part => part.results ?? []);
  };

  console.log(`[d1-export] Reading sqlite_master from D1 database "${dbName}"...`);
  const items = query("SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY type, name;");
  const tables = items.filter(item => item.type === 'table');
  const virtualTables = tables.filter(item => item.sql && /^\s*create\s+virtual\s+table/i.test(item.sql));
  const isShadow = name => virtualTables.some(v => name.startsWith(`${v.name}_`));
  const exportableTables = tables.filter(item => !virtualTables.includes(item) && !isShadow(item.name));
  const indexes = items.filter(item => item.type === 'index' && item.sql);
  const triggers = items.filter(item => item.type === 'trigger' && item.sql);
  console.log(`[d1-export] ${exportableTables.length} tables, ${virtualTables.length} FTS5 tables, ${indexes.length} indexes, ${triggers.length} triggers.`);

  try {
    const parts = ['PRAGMA defer_foreign_keys = TRUE;'];
    if (exportableTables.length) {
      runNpm([...wrangler, 'd1', 'export', dbName, target, ...exportableTables.flatMap(item => ['--table', item.name]), '--output', tempExportFile, '-y'], { stdio: 'inherit', maxBuffer: 50 * 1024 * 1024 });
      parts.push(...orderTablesFirst(fs.readFileSync(tempExportFile, 'utf8')).map(statement => `${statement};`));
    }
    const rows = {};
    for (const v of virtualTables) {
      parts.push(`${v.sql.trim()};`);
      let page = 0, copied = 0;
      for (;;) {
        const batch = query(`SELECT * FROM ${quoteIdentifier(v.name)} ORDER BY rowid LIMIT ${PAGE} OFFSET ${page * PAGE}`);
        for (const row of batch) parts.push(`INSERT INTO ${quoteIdentifier(v.name)} (${Object.keys(row).map(quoteIdentifier).join(', ')}) VALUES (${Object.values(row).map(quoteValue).join(', ')});`);
        copied += batch.length; page++;
        if (batch.length < PAGE) break;
      }
      rows[v.name] = copied;
    }
    // Skip any index or trigger Wrangler already wrote, so nothing is created twice.
    const written = new Set(parts.map(statement => statement.replace(/;$/, '').trim()));
    for (const item of [...indexes, ...triggers]) if (!written.has(item.sql.trim())) parts.push(`${item.sql.trim()};`);
    const sql = parts.join('\n') + '\n';
    const oversized = oversizedStatements(parts);

    for (const command of countStatements(exportableTables.map(item => item.name))) for (const result of query(command)) rows[result.t] = result.n;
    const expected = { rows, objects: { table: tables.length, index: indexes.length, trigger: triggers.length } };
    const verification = verifyExport(sql, expected);
    if (!verification.ok) throw new Error(`Export does not match the database: ${[...verification.rowMismatches, ...verification.objectMismatches].slice(0, 5).join('; ') || `integrity ${verification.integrity}, ${verification.foreignKeyViolations} foreign-key violations`}`);

    fs.mkdirSync(path.dirname(finalExportFile), { recursive: true });
    fs.writeFileSync(finalExportFile, sql, 'utf8');
    const manifest = { formatVersion: 1, database: dbName, source: remote ? 'remote' : 'local', exportedAt: new Date().toISOString(), rows, objects: verification.objects, ftsTables: virtualTables.map(v => v.name), verification: { integrity: verification.integrity, foreignKeyViolations: verification.foreignKeyViolations, rowsCompared: Object.keys(rows).length }, d1StatementLimitBytes: D1_STATEMENT_LIMIT, oversizedStatements: oversized };
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    const { size } = fs.statSync(finalExportFile);
    console.log(`[d1-export] Exported and verified ${Object.keys(rows).length} tables (${Object.values(rows).reduce((a, n) => a + n, 0)} rows) to ${finalExportFile} (${(size / 1024).toFixed(1)} KB); manifest ${manifestFile}`);
    if (oversized.length) console.warn(`[d1-export] ${oversized.length} statement(s) exceed D1's ${D1_STATEMENT_LIMIT / 1000} KB limit (${[...new Set(oversized.map(item => item.table))].join(', ')}); \`wrangler d1 execute --file\` cannot load this export. Use \`npm run db:rehearse\`.`);
    return { file: finalExportFile, manifest: manifestFile, size, tables: exportableTables.length, rows, oversized };
  } finally {
    if (fs.existsSync(tempExportFile)) fs.unlinkSync(tempExportFile);
  }
}

if (isMain(import.meta.url)) {
  try {
    const { local, ...args } = argumentsOf(process.argv.slice(2), ['--database', '--out'], ['--local']);
    exportD1Database({ ...args, remote: !local });
  } catch (err) {
    console.error(`[d1-export] Error: ${err.message}`);
    process.exitCode = 1;
  }
}
