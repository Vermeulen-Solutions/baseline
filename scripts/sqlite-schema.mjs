import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { MIGRATION_NAMES } from 'emdash';
import { bytesOf, requireFact, sha256, writeJSON } from './infrastructure-io.mjs';

const quoted = name => '"' + name.replaceAll('"', '""') + '"';
const catalog = JSON.parse(fs.readFileSync(new URL('../standards/emdash-1.3.0-database-tables.json', import.meta.url)));
const sort = rows => rows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b), 'en'));
export const affinity = type => /INT/i.test(type) ? 'INTEGER' : /CHAR|CLOB|TEXT/i.test(type) ? 'TEXT' : /BLOB/i.test(type) || !type ? 'BLOB' : /REAL|FLOA|DOUB/i.test(type) ? 'REAL' : 'NUMERIC';
/** Bounded SQL lexer: literals stay exact, identifiers/keywords normalize; never evaluates SQL. */
export function sqlTokens(sql) {
  requireFact(typeof sql === 'string' && sql.length <= 8 * 1024 * 1024, 'SQL exceeds supported bound');
  const tokens = []; let i = 0;
  while (i < sql.length) {
    if (/\s/.test(sql[i])) { i++; continue; }
    if (sql.startsWith('--', i)) { const end = sql.indexOf('\n', i); i = end < 0 ? sql.length : end + 1; continue; }
    if (sql.startsWith('/*', i)) { const end = sql.indexOf('*/', i + 2); requireFact(end >= 0, 'Unclosed SQL comment'); i = end + 2; continue; }
    const start = i, quote = sql[i];
    if (["'", '"', '`', '['].includes(quote)) {
      const end = quote === '[' ? ']' : quote; i++; let closed = false;
      while (i < sql.length) { if (sql[i++] === end) { if (sql[i] === end && quote !== '[') i++; else { closed = true; break; } } }
      requireFact(closed, 'Unclosed SQL literal/identifier'); const raw = sql.slice(start, i);
      tokens.push(quote === "'" ? raw : raw.slice(1, -1).replaceAll(end + end, end).toLowerCase());
    } else if (/[a-zA-Z_]/.test(sql[i])) { while (/[a-zA-Z0-9_$]/.test(sql[i] ?? '')) i++; tokens.push(sql.slice(start, i).toLowerCase()); }
    else if (/[0-9]/.test(sql[i])) { while (/[0-9.eE+-]/.test(sql[i] ?? '')) i++; tokens.push(sql.slice(start, i)); }
    else tokens.push(sql[i++]);
    requireFact(tokens.length <= 1000000, 'Too many SQL tokens');
  }
  return tokens;
}
const normalize = sql => sqlTokens(sql ?? '').join(' ');
function normalizedRegistryJSON(value) {
  if (value === null) return null;
  function ordered(value, depth = 0) {
    requireFact(depth <= 50, 'Registry JSON nesting bound exceeded');
    if (Array.isArray(value)) return value.map(child => ordered(child, depth + 1));
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key], depth + 1)]));
    return value;
  }
  requireFact(typeof value === 'string' && value.length <= 1024 * 1024, 'Unsupported registry JSON');
  return JSON.stringify(ordered(JSON.parse(value)));
}
function normalizedDefault(value, storageAffinity) {
  if (value === null) return null;
  let tokens = sqlTokens(String(value));
  while (tokens[0] === '(' && tokens.at(-1) === ')') {
    let depth = 0, outer = true;
    for (let i = 0; i < tokens.length - 1; i++) { depth += tokens[i] === '(' ? 1 : tokens[i] === ')' ? -1 : 0; if (!depth) { outer = false; break; } }
    if (!outer) break; tokens = tokens.slice(1, -1);
  }
  const text = tokens.join(' ');
  if (text === 'null') return null;
  return ['INTEGER', 'REAL', 'NUMERIC'].includes(storageAffinity) && /^[-+]?\d+(?:\.\d+)?$/.test(text) && Number.isSafeInteger(Number(text)) ? String(Number(text)) : text;
}
const systemColumns = new Set(['id', 'slug', 'status', 'author_id', 'primary_byline_id', 'created_at', 'updated_at', 'published_at', 'scheduled_at', 'deleted_at', 'version', 'live_revision_id', 'draft_revision_id', 'locale', 'translation_group']);
function storageField(field) {
  const validation = field.validation ? JSON.parse(field.validation) : null;
  return !(field.type === 'reference' && typeof validation?.relation === 'string' && validation.relation.length > 0);
}
function contextualSemantics(tokens, columns) {
  const open = tokens.indexOf('('), segments = []; let depth = 0, start = open + 1;
  for (let i = start; i < tokens.length; i++) {
    if (tokens[i] === '(') depth++;
    if (tokens[i] === ')') { if (depth === 0) { segments.push(tokens.slice(start, i)); break; } depth--; }
    if (tokens[i] === ',' && depth === 0) { segments.push(tokens.slice(start, i)); start = i + 1; }
  }
  return segments.map(segment => {
    const column = columns.find(column => column.name.toLowerCase() === segment[0]);
    const special = [];
    for (let i = 0; i < segment.length; i++) {
      if (segment[i] === 'collate') special.push(segment.slice(i, i + 2).join(' '));
      if (segment[i] === 'autoincrement') special.push('autoincrement');
      if (segment[i] === 'conflict') special.push('conflict ' + segment[i + 1]);
      if (['check', 'as'].includes(segment[i]) && segment[i + 1] === '(') { let end = i + 1, depth = 0; do { if (segment[end] === '(') depth++; if (segment[end] === ')') depth--; end++; } while (end < segment.length && depth); special.push(segment.slice(i, end).join(' ')); }
    }
    if (segment.includes('references')) special.push(segment.slice(segment.indexOf('references')).join(' '));
    return special.length ? { owner: column?.name ?? (segment.includes('references') ? 'table:' + segment.slice(0, segment.indexOf('references')).join(' ') : 'table-constraint'), clauses: special } : null;
  }).filter(Boolean);
}
function schemaOf(db) {
  const masters = db.prepare("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name,type LIMIT 5001").all();
  requireFact(masters.length <= 5000, 'Schema object bound exceeded');
  const tableFacts = db.prepare('PRAGMA table_list').all();
  const tables = masters.filter(row => row.type === 'table').map(row => {
    const info = tableFacts.find(table => table.name === row.name);
    requireFact(info && (info.type !== 'virtual' || /\busing\s+fts5\s*\(/i.test(row.sql ?? '')), 'Unknown virtual module needs a reviewed inspection adapter');
    const columns = db.prepare(`PRAGMA table_xinfo(${quoted(row.name)})`).all().map(col => ({ position: col.cid, name: col.name, affinity: affinity(col.type), notNull: Boolean(col.notnull), default: normalizedDefault(col.dflt_value, affinity(col.type)), primaryKey: col.pk, hidden: col.hidden }));
    const indexes = sort(db.prepare(`PRAGMA index_list(${quoted(row.name)})`).all().map(index => {
      const keys = db.prepare(`PRAGMA index_xinfo(${quoted(index.name)})`).all().filter(key => key.key).map(key => ({ column: key.name, expression: key.cid === -2, descending: Boolean(key.desc), collation: key.coll?.toLowerCase() ?? null }));
      const definition = masters.find(master => master.type === 'index' && master.name === index.name)?.sql ?? '';
      return { unique: Boolean(index.unique), origin: index.origin, keys, expressionAndPredicate: keys.some(key => key.expression) || index.partial ? normalize(definition.slice(definition.indexOf('('))) : null };
    }));
    const groups = new Map();
    for (const { id, ...fk } of db.prepare(`PRAGMA foreign_key_list(${quoted(row.name)})`).all()) { if (!groups.has(id)) groups.set(id, []); groups.get(id).push(fk); }
    const foreignKeys = sort([...groups.values()].map(rows => rows.sort((a, b) => a.seq - b.seq)));
    // Preserve constraints/generation/collation conservatively; never claim unknown SQL expressions equivalent.
    const tokens = sqlTokens(row.sql ?? ''), expressions = contextualSemantics(tokens, columns);
    return { name: row.name, owner: row.name.startsWith('ec_') ? 'cms-collection' : info.type === 'shadow' || info.type === 'virtual' || row.name.startsWith('_cf_') || row.name === 'd1_migrations' ? 'engine' : catalog.tables.includes(row.name) || row.name.startsWith('_emdash_') || row.name.startsWith('kysely_') ? 'cms-system' : row.name.startsWith('ep_') ? 'plugin' : 'custom', module: info.type === 'virtual' ? 'fts5' : info.type === 'shadow' ? 'fts-shadow' : null, withoutRowid: Boolean(info.wr), strict: Boolean(info.strict), columns, indexes, foreignKeys, expressions };
  });
  let registry = null, migrations = null;
  if (tables.some(t => t.name === '_emdash_collections') && tables.some(t => t.name === '_emdash_fields')) {
    registry = db.prepare('SELECT id,slug FROM _emdash_collections ORDER BY slug LIMIT 501').all().map(collection => ({ slug: collection.slug, fields: db.prepare('SELECT slug,type,column_type,required,"unique",default_value,validation,options FROM _emdash_fields WHERE collection_id=? ORDER BY slug LIMIT 2001').all(collection.id).map(field => ({ ...field, ...Object.fromEntries(['default_value', 'validation', 'options'].map(key => [key, normalizedRegistryJSON(field[key])])) })) }));
    requireFact(registry.length <= 500 && registry.every(c => /^[a-z][a-z0-9_]{0,62}$/.test(c.slug) && c.fields.length <= 2000), 'Unsupported registry inventory');
  }
  if (tables.some(table => table.name === '_emdash_migrations')) migrations = db.prepare('SELECT name FROM _emdash_migrations ORDER BY name').all().map(row => row.name);
  const issues = [], unknown = [];
  if (!registry) unknown.push('registry-unavailable');
  if (!migrations || MIGRATION_NAMES.some(name => !migrations.includes(name)) || migrations.some(name => !MIGRATION_NAMES.includes(name))) unknown.push('incompatible-or-unverified-migrations');
  for (const table of tables.filter(table => table.owner === 'cms-collection')) {
    if (table.columns.length > 50) issues.push({ rule: 'physical-column-budget', table: table.name, physicalColumns: table.columns.length, limit: 50 });
    const collection = registry?.find(collection => 'ec_' + collection.slug === table.name);
    if (registry && !collection) issues.push({ rule: 'unregistered-collection', table: table.name });
    if (collection) {
      const physical = new Set(table.columns.map(column => column.name));
      for (const field of collection.fields.filter(storageField)) if (!physical.has(field.slug)) issues.push({ rule: 'registered-field-without-column', table: table.name, field: field.slug });
      const extra = [...physical].filter(name => !systemColumns.has(name) && !collection.fields.some(field => field.slug === name));
      if (extra.length) issues.push({ rule: 'unregistered-column-review', table: table.name, columns: extra, action: 'Review retained legacy/generated columns; never auto-drop' });
    }
  }
  for (const collection of registry ?? []) if (!tables.some(table => table.name === 'ec_' + collection.slug)) issues.push({ rule: 'registered-collection-without-table', collection: collection.slug });
  return { tables, viewsAndTriggers: masters.filter(row => ['view', 'trigger'].includes(row.type)).map(row => ({ type: row.type, name: row.name, table: row.tbl_name, definition: normalize(row.sql) })), registry, migrations, issues, unknown };
}
export function inspectSQLite(file) {
  const installed = JSON.parse(fs.readFileSync(new URL('../node_modules/emdash/package.json', import.meta.url)));
  requireFact(installed.version === catalog.emdash && sha256(fs.readFileSync(new URL('../node_modules/emdash/src/database/types.ts', import.meta.url))) === catalog.sourceSHA256, 'Installed CMS differs from reviewed metadata adapter');
  const source = bytesOf(file);
  requireFact(!['-wal', '-shm', '-journal'].some(suffix => fs.existsSync(file + suffix)), 'Use a closed consistent snapshot without SQLite sidecars');
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-db-inspect-')); let db;
  try {
    const copy = path.join(scratch, 'inspection.sqlite'); fs.writeFileSync(copy, source, { mode: 0o600 });
    db = new DatabaseSync(copy, { readOnly: true, allowExtension: false }); db.exec('PRAGMA query_only=ON');
    requireFact(db.prepare('PRAGMA integrity_check').all().every(row => Object.values(row)[0] === 'ok'), 'SQLite integrity check failed');
    requireFact(db.prepare('PRAGMA foreign_key_check').all().length === 0, 'SQLite foreign key check failed');
    const schema = schemaOf(db);
    return { schemaVersion: 1, adapter: 'emdash-1.3.0/sqlite-metadata-v1', sourceSHA256: sha256(source), sqliteVersion: db.prepare('SELECT sqlite_version() AS version').get().version, schema, schemaSHA256: sha256(JSON.stringify(schema)) };
  } finally { db?.close(); requireFact(path.dirname(scratch) === path.resolve(os.tmpdir()) && path.basename(scratch).startsWith('baseline-db-inspect-'), 'Unsafe scratch cleanup'); fs.rmSync(scratch, { recursive: true, force: true }); }
}
export function compareSchemas(left, right) {
  for (const snapshot of [left, right]) requireFact(snapshot?.schemaVersion === 1 && snapshot.adapter === 'emdash-1.3.0/sqlite-metadata-v1' && snapshot.schemaSHA256 === sha256(JSON.stringify(snapshot.schema)), 'Invalid schema snapshot contract/digest');
  const comparable = schema => ({ ...schema, tables: schema.tables.filter(table => table.owner !== 'engine') });
  const equal = JSON.stringify(comparable(left.schema)) === JSON.stringify(comparable(right.schema));
  const unknown = [...new Set([...left.schema.unknown, ...right.schema.unknown])];
  const issues = [...left.schema.issues, ...right.schema.issues];
  return { reportVersion: 1, status: unknown.length ? 'unverified' : !equal || issues.length ? 'drift' : 'equal', exitCode: unknown.length ? 2 : !equal || issues.length ? 1 : 0, physicalEqual: equal, sources: [left.sourceSHA256, right.sourceSHA256], schemaSHA256: [left.schemaSHA256, right.schemaSHA256], issues, unknown, scope: 'Structural/registry/migration parity only; no content equality, D1 query-limit or Worker/R2 certification', left, right };
}
export function schemaMarkdown(report) {
  const cell = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('|', '\\|').replaceAll(/[\r\n]/g, ' ');
  const rows = [report.left, report.right].flatMap((snapshot, source) => snapshot.schema.tables.filter(table => table.owner === 'cms-collection').map(table => `| ${source + 1} | ${cell(table.name)} | ${table.columns.length} | ${snapshot.schema.registry?.find(collection => 'ec_' + collection.slug === table.name)?.fields.length ?? 'unverified'} | ${table.columns.filter(column => column.hidden).length} |`));
  return `# Database structural inspection\n\nStatus: **${report.status}**; exit ${report.exitCode}.\n\n${report.scope}\n\n| Source | Schema SHA-256 |\n| --- | --- |\n${report.schemaSHA256.map((digest, index) => `| ${index + 1} | ${digest} |`).join('\n')}\n\n| Source | Collection table | Physical columns | Logical fields | Generated/hidden |\n| --- | --- | --- | --- | --- |\n${rows.join('\n')}\n\nIssues: ${report.issues.length}; unverified scopes: ${report.unknown.join(', ') || 'none'}.\n\n${report.issues.map(issue => '- ' + cell(JSON.stringify(issue))).join('\n')}\n\nDetailed structural, registry and optional seed-subset evidence: [report.json](report.json).\n`;
}
export function saveSchema(snapshot, directory) { writeJSON(path.join(directory, 'schema.json'), snapshot); }
