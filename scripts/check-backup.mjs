import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import ts from 'typescript';
import { argumentsOf, bytesOf, noLinks, isMain, requireFact, sha256 } from './infrastructure-io.mjs';

const object = node => {
  if (!node || !ts.isObjectLiteralExpression(node) || node.properties.some(p => !ts.isPropertyAssignment(p) || ts.isComputedPropertyName(p.name))) return null;
  const entries = node.properties.map(p => [p.name.text, p.initializer]);
  return new Set(entries.map(([key]) => key)).size === entries.length ? Object.fromEntries(entries) : null;
};

/** Deliberately narrow static inspection. Never import or execute the site's config. */
export function configuredSQLite(source) {
  const ast = ts.createSourceFile('astro.config.mjs', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if (ast.parseDiagnostics.length) return null;
  const imports = new Map();
  for (const node of ast.statements) if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
    const clause = node.importClause;
    if (clause?.name) imports.set(clause.name.text, [node.moduleSpecifier.text, 'default']);
    if (clause?.namedBindings && ts.isNamedImports(clause.namedBindings)) for (const n of clause.namedBindings.elements) imports.set(n.name.text, [node.moduleSpecifier.text, n.propertyName?.text ?? n.name.text]);
  }
  const call = (node, module, name) => node && ts.isCallExpression(node) && ts.isIdentifier(node.expression) && imports.get(node.expression.text)?.join(':') === `${module}:${name}`;
  const exports = ast.statements.filter(ts.isExportAssignment);
  if (exports.length !== 1) return null;
  const expression = exports[0].expression;
  const config = object(call(expression, 'astro/config', 'defineConfig') ? expression.arguments[0] : expression);
  if (!config || !config.integrations || !ts.isArrayLiteralExpression(config.integrations)) return null;
  const integrations = config.integrations.elements.filter(n => call(n, 'emdash/astro', 'default'));
  const options = integrations.length === 1 ? object(integrations[0].arguments[0]) : null;
  if (!options || !call(options.database, 'emdash/db', 'sqlite')) return null;
  const url = object(options.database.arguments[0])?.url;
  return url && ts.isStringLiteral(url) ? url.text : null;
}

function localFile(url, root) {
  requireFact(/^file:(?:\.\/|\.\.\/|[A-Za-z0-9_-])/.test(url) && !/[?#%\0]/.test(url), 'Use a plain local SQLite file URL or explicitly reviewed --database path');
  return path.resolve(root, url.slice(5));
}

function inventory(file) {
  noLinks(file);
  const stat = fs.statSync(file);
  requireFact(stat.isFile() && stat.size > 0 && stat.size <= 64 * 1024 * 1024, 'Database must already exist as a regular file of 1 byte to 64 MiB');
  const db = new DatabaseSync(file, { readOnly: true, allowExtension: false });
  try {
    db.exec('PRAGMA query_only=ON; PRAGMA busy_timeout=2000; BEGIN');
    requireFact(db.prepare('PRAGMA integrity_check').all().every(row => row.integrity_check === 'ok'), 'Database integrity check failed');
    const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' LIMIT 501").all();
    requireFact(tables.length <= 500, 'Database table bound exceeded');
    const ordinary = name => tables.some(t => t.name === name && /^CREATE TABLE\b/i.test(t.sql ?? ''));
    requireFact(ordinary('_emdash_collections') && ordinary('media'), 'Expected native CMS tables are missing');
    const collections = db.prepare('SELECT slug FROM _emdash_collections LIMIT 101').all();
    requireFact(collections.length > 0 && collections.length <= 100 && collections.every(c => /^[a-z][a-z0-9_-]{0,79}$/.test(c.slug)), 'Expected bounded native collection registry');
    const names = ['_emdash_collections', 'media', ...collections.map(c => `ec_${c.slug}`)].sort();
    requireFact(names.every(ordinary), 'A registered collection table is missing or unsupported');
    const counts = Object.fromEntries(names.map(name => [name, db.prepare(`SELECT count(*) AS count FROM "${name}"`).get().count]));
    return counts;
  } finally { db.close(); }
}

function snapshotInventory(bytes) {
  // Even read-only SQLite can create WAL/SHM sidecars. Inspect a private copy so
  // a standalone WAL-mode backup stays untouched and can be checked repeatedly.
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-backup-inspection-'));
  try {
    const copy = path.join(temporary, 'snapshot.db');
    fs.writeFileSync(copy, bytes, { flag: 'wx', mode: 0o600 });
    return inventory(copy);
  } finally {
    requireFact(path.dirname(path.resolve(temporary)) === path.resolve(os.tmpdir()) && path.basename(temporary).startsWith('baseline-backup-inspection-'), 'Temporary inspection cleanup boundary changed');
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

export function checkBackup({ config, database, snapshot, expected, allowEmpty = false, root = process.cwd() }) {
  requireFact(config && snapshot && expected && typeof expected === 'object' && !Array.isArray(expected), 'Use --config, --snapshot and a reviewed --expected inventory JSON');
  const configured = configuredSQLite(bytesOf(config, 1024 * 1024).toString('utf8'));
  requireFact(configured || database, 'Config is dynamic or unsupported: review its effective SQLite target and supply --database explicitly');
  const resolved = configured ? localFile(configured, root) : null;
  const source = database ? path.resolve(database) : resolved;
  requireFact(!resolved || source === resolved, 'Explicit database differs from the statically configured target');
  const target = path.resolve(snapshot);
  noLinks(source); noLinks(target);
  requireFact(source !== target && fs.realpathSync(source) !== fs.realpathSync(target), 'Source and snapshot must be different existing files');
  requireFact(['-wal', '-shm', '-journal'].every(suffix => !fs.existsSync(target + suffix)), 'Snapshot must be closed and standalone, without WAL/SHM/journal files');
  const snapshotBytes = bytesOf(target);
  const actual = inventory(source), copied = snapshotInventory(snapshotBytes);
  const entries = Object.entries(expected);
  requireFact(entries.length > 0 && entries.length <= 102 && entries.every(([key, value]) => Object.hasOwn(actual, key) && Number.isSafeInteger(value) && value >= 0), 'Expected inventory must contain native table names and nonnegative integer counts');
  requireFact(entries.some(([key]) => key.startsWith('ec_')), 'Expected inventory must include at least one content collection');
  requireFact(entries.every(([key, value]) => actual[key] === value), 'Source differs from the reviewed inventory');
  requireFact(allowEmpty || Object.entries(actual).some(([key, value]) => key.startsWith('ec_') && value > 0), 'Populated migration expected; use --allow-empty only for an intentionally empty site');
  requireFact(JSON.stringify(actual) === JSON.stringify(copied), 'Snapshot inventory differs from the configured source; freeze writes and reconcile');
  requireFact(fs.statSync(source).ino !== fs.statSync(target).ino || fs.statSync(source).dev !== fs.statSync(target).dev, 'Source and snapshot cannot be hard links');
  return { status: 'passed', identity: resolved ? 'static-config' : 'operator-explicit', source, snapshot: target, counts: actual, snapshotSHA256: sha256(snapshotBytes), scope: 'identity, integrity and inventory only; not content equality or a restore drill' };
}

if (isMain(import.meta.url)) {
  try {
    if (process.argv.length === 3 && process.argv[2] === '--help') console.log('Read-only source: --config astro.config.mjs --snapshot <existing closed SQLite> --expected <private table-count JSON> [--database <reviewed path for dynamic config>] [--allow-empty]. Output contains private paths/counts. Snapshot inspection uses an owned disposable copy; no missing source/snapshot is created and no backup/restore is performed.');
    else {
      const args = argumentsOf(process.argv.slice(2), ['--config', '--database', '--snapshot', '--expected'], ['--allow-empty']);
      requireFact(args.expected, 'Expected inventory required');
      console.log(JSON.stringify(checkBackup({ ...args, expected: JSON.parse(bytesOf(args.expected, 32768).toString('utf8')), allowEmpty: args['allow-empty'] }), null, 2));
    }
  } catch { console.error('Backup is unverified. Check --help, existing source/snapshot identity, native tables and reviewed counts. No source or snapshot was created or repaired.'); process.exitCode = 1; }
}
