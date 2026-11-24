// Upgrade rehearsal on a local copy of a Workers site's D1 database, from `npm run db:export-d1`.
// Nothing here writes to Cloudflare: the remote side is only read (R2 objects are downloaded).
//
//   npm run db:rehearse -- --from <export.sql> --persist-to <empty dir Git ignores, e.g. .emdash/backups/rehearse-<date>> [--database <name>]
//        [--bucket <name>] [--port 8790] [--media-sample <n>] [--no-plugin-bundles]
//   npm run db:rehearse -- --compare --persist-to <dir> [--port 8790]
//
// Prepare (the default):
// 1. Lets Wrangler create the local D1 file, then loads the export into it directly with
//    node:sqlite. `wrangler d1 execute --file` cannot load rows over D1's 100 KB statement limit.
// 2. Copies the code of every active registry and marketplace plugin (`registry/<id>/<version>/`
//    or `marketplace/<id>/<version>/` in R2) into the local R2. Without them, pages that call a
//    sandboxed plugin fail with "Plugin route not found", which looks like an upgrade defect.
// 3. Optionally copies the newest <n> media files, enough to see images on sampled pages; copying
//    a whole media library takes seconds per object.
// 4. Records row counts, then prints the exact `wrangler dev` command after checking the port.
// Compare (after stopping that server): migrations, row changes per table, integrity, foreign keys.
import fs from 'node:fs';
import os from 'node:os';
import net from 'node:net';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { parse as parseJSONC } from 'jsonc-parser';
import { execNpmSync } from './process-runner.mjs';
import { argumentsOf, bytesOf, isMain } from './infrastructure-io.mjs';
import { DEFAULT_BACKUP_DIR, gitIgnoreStatus, quoteIdentifier } from './d1-export.mjs';

export const BEFORE_FILE = 'rehearsal-before.json';

// The rehearsal copy holds the site's users, sessions and content, like the export it is loaded from.
// Refuse a folder Git would track: on a live site a scratch folder under .emdash/ was staged for commit.
export function assertRehearsalTarget(persistTo, run) {
  if (gitIgnoreStatus(path.join(path.resolve(persistTo), BEFORE_FILE), run) === 'tracked') {
    throw new Error(`${persistTo} is not ignored by Git, and the rehearsal copy holds users, sessions and content. Use a folder under ${DEFAULT_BACKUP_DIR}/ (for example ${DEFAULT_BACKUP_DIR}/rehearse-<date>) or outside the repository.`);
  }
}
const wrangler = ['exec', '--', 'wrangler'];

export function wranglerBindings(directory = '.') {
  for (const file of ['wrangler.jsonc', 'wrangler.json']) {
    const full = path.join(directory, file);
    if (!fs.existsSync(full)) continue;
    const errors = [];
    const data = parseJSONC(bytesOf(full, 1024 * 1024).toString('utf8'), errors, { allowTrailingComma: true });
    if (errors.length) continue;
    return { database: data.d1_databases?.[0]?.database_name ?? null, bucket: data.r2_buckets?.find(item => item.binding === 'MEDIA')?.bucket_name ?? data.r2_buckets?.[0]?.bucket_name ?? null };
  }
  return { database: null, bucket: null };
}

// The SQLite file Wrangler's local D1 uses under --persist-to.
export function findD1File(persistTo) {
  const directory = path.join(persistTo, 'v3', 'd1', 'miniflare-D1DatabaseObject');
  if (!fs.existsSync(directory)) return null;
  const files = fs.readdirSync(directory).filter(name => name.endsWith('.sqlite') && name !== 'metadata.sqlite');
  if (files.length > 1) throw new Error(`More than one local D1 database in ${directory}; use a fresh --persist-to directory per rehearsal.`);
  return files.length ? path.join(directory, files[0]) : null;
}

export function tableCounts(db) {
  const names = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name").all().map(row => row.name);
  return Object.fromEntries(names.map(name => [name, db.prepare(`SELECT count(*) AS n FROM ${quoteIdentifier(name)}`).get().n]));
}

export function databaseHealth(db) {
  const has = name => !!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name);
  return {
    migrations: has('_emdash_migrations') ? db.prepare('SELECT count(*) AS n FROM _emdash_migrations').get().n : null,
    lastMigration: has('_emdash_migrations') ? db.prepare('SELECT max(name) AS name FROM _emdash_migrations').get().name : null,
    integrity: db.prepare('PRAGMA integrity_check').get().integrity_check,
    foreignKeyViolations: db.prepare('PRAGMA foreign_key_check').all().length,
  };
}

// Loads an export into the local D1 file. Foreign keys are checked after loading, as D1 does at
// commit with deferred keys.
export function loadExport(file, sql) {
  const db = new DatabaseSync(file, { enableForeignKeyConstraints: false });
  try {
    db.exec(sql);
    return { counts: tableCounts(db), ...databaseHealth(db) };
  } finally { db.close(); }
}

// R2 prefixes holding the code of each active sandboxed plugin installed from the registry or the
// marketplace, from `_plugin_state` rows.
export function pluginBundlePrefixes(states) {
  return states
    .filter(state => state.status === 'active' && (state.source === 'registry' || state.source === 'marketplace'))
    .map(state => {
      const version = state.source === 'marketplace' ? state.marketplace_version ?? state.version : state.version;
      return { pluginId: state.plugin_id, version, prefix: `${state.source}/${state.plugin_id}/${version}` };
    });
}

export function pluginStates(file) {
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = '_plugin_state'").get()) return [];
    return db.prepare('SELECT * FROM _plugin_state').all().map(row => ({ ...row }));
  } finally { db.close(); }
}

export function newestMediaKeys(file, limit) {
  if (!limit) return [];
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'media'").get()) return [];
    return db.prepare("SELECT storage_key FROM media WHERE storage_key IS NOT NULL ORDER BY created_at DESC LIMIT ?").all(limit).map(row => row.storage_key);
  } finally { db.close(); }
}

export function compareCounts(before, after) {
  const changed = [], added = [], dropped = [], lostRows = [];
  for (const [name, n] of Object.entries(after)) {
    if (!(name in before)) added.push({ table: name, rows: n });
    else if (n !== before[name]) { changed.push({ table: name, before: before[name], after: n }); if (n < before[name]) lostRows.push(name); }
  }
  for (const name of Object.keys(before)) if (!(name in after)) dropped.push(name);
  return { changed, added, dropped, lostRows };
}

export function portFree(port, host = '127.0.0.1') {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, host);
  });
}

function copyR2Object(bucket, key, persistTo, runNpm, { optional = false } = {}) {
  const temporary = path.join(os.tmpdir(), `d1-rehearse-${randomUUID()}`);
  try {
    try {
      runNpm([...wrangler, 'r2', 'object', 'get', `${bucket}/${key}`, '--remote', '--file', temporary], { stdio: 'pipe' });
    } catch (error) {
      if (optional) return false;
      throw new Error(`Could not read ${bucket}/${key} from R2: ${String(error.stderr ?? error.message).trim().split('\n').at(-1)}`);
    }
    runNpm([...wrangler, 'r2', 'object', 'put', `${bucket}/${key}`, '--local', '--persist-to', persistTo, '--file', temporary], { stdio: 'pipe' });
    return true;
  } finally { fs.rmSync(temporary, { force: true }); }
}

export async function prepareRehearsal({ from, persistTo, database, bucket, port = 8790, mediaSample = 0, pluginBundles = true }, runNpm = execNpmSync) {
  if (!from || !persistTo) throw new Error('Specify --from <export.sql> and --persist-to <empty directory>.');
  const bindings = wranglerBindings();
  const dbName = database || bindings.database;
  const bucketName = bucket || bindings.bucket;
  if (!dbName) throw new Error('Database name required: specify --database <name> or configure it in wrangler.jsonc');
  const target = path.resolve(persistTo);
  assertRehearsalTarget(target);
  if (fs.existsSync(target) && fs.readdirSync(target).length) throw new Error(`${target} is not empty. Use a fresh directory for each rehearsal so the copy starts unmigrated.`);
  fs.mkdirSync(target, { recursive: true });

  console.log(`[db:rehearse] Creating the local D1 database "${dbName}" in ${target}...`);
  runNpm([...wrangler, 'd1', 'execute', dbName, '--local', '--persist-to', target, '--command', 'SELECT 1'], { stdio: 'pipe' });
  const file = findD1File(target);
  if (!file) throw new Error('Wrangler did not create a local D1 file; check wrangler.jsonc.');
  const loaded = loadExport(file, fs.readFileSync(path.resolve(from), 'utf8'));
  if (loaded.integrity !== 'ok' || loaded.foreignKeyViolations) throw new Error(`The loaded copy is not sound: integrity ${loaded.integrity}, ${loaded.foreignKeyViolations} foreign-key violations.`);
  console.log(`[db:rehearse] Loaded ${Object.keys(loaded.counts).length} tables (${Object.values(loaded.counts).reduce((a, n) => a + n, 0)} rows); ${loaded.migrations ?? 'no'} migrations applied, last ${loaded.lastMigration ?? '-'}.`);

  const copied = [];
  const bundles = pluginBundles ? pluginBundlePrefixes(pluginStates(file)) : [];
  if (bundles.length && !bucketName) throw new Error('Active registry or marketplace plugins need their code from R2: specify --bucket <name>.');
  for (const bundle of bundles) {
    for (const name of ['manifest.json', 'backend.js']) { copyR2Object(bucketName, `${bundle.prefix}/${name}`, target, runNpm); copied.push(`${bundle.prefix}/${name}`); }
    if (copyR2Object(bucketName, `${bundle.prefix}/admin.js`, target, runNpm, { optional: true })) copied.push(`${bundle.prefix}/admin.js`);
  }
  if (bundles.length) console.log(`[db:rehearse] Copied the code of ${bundles.length} sandboxed plugin(s): ${bundles.map(item => `${item.pluginId}@${item.version}`).join(', ')}.`);
  const media = bucketName ? newestMediaKeys(file, mediaSample) : [];
  let mediaCopied = 0;
  for (const key of media) if (copyR2Object(bucketName, key, target, runNpm, { optional: true })) mediaCopied++;
  if (mediaSample) console.log(`[db:rehearse] Copied ${mediaCopied} of the ${media.length} newest media files.`);

  const before = { formatVersion: 1, preparedAt: new Date().toISOString(), export: path.resolve(from), database: dbName, bucket: bucketName, ...loaded, pluginBundles: copied, mediaCopied };
  fs.writeFileSync(path.join(target, BEFORE_FILE), JSON.stringify(before, null, 2) + '\n', 'utf8');

  const free = await portFree(port);
  if (!free) console.warn(`[db:rehearse] Port ${port} is in use. A previous \`wrangler dev\` (or its workerd child) may still be serving; stop it, or pass --port.`);
  console.log(`[db:rehearse] Next:
  1. Build the site for Workers, then serve the copy:
       npx wrangler dev --persist-to "${target}" --port ${port} --ip 127.0.0.1
     The first request applies pending migrations. Check that your requests appear in that
     server's own log: an old server left on the port would answer instead.
  2. Stop it, make sure port ${port} is free, then compare:
       npm run db:rehearse -- --compare --persist-to "${target}" --port ${port}`);
  return { file, before, free };
}

export async function compareRehearsal({ persistTo, port = 8790 }) {
  const target = path.resolve(persistTo ?? '');
  const beforeFile = path.join(target, BEFORE_FILE);
  if (!fs.existsSync(beforeFile)) throw new Error(`No ${BEFORE_FILE} in ${target}; prepare the rehearsal first.`);
  if (!await portFree(port)) throw new Error(`Port ${port} is still in use. Stop the rehearsal server (and any workerd child) before comparing, so the copy is complete on disk.`);
  const before = JSON.parse(fs.readFileSync(beforeFile, 'utf8'));
  const file = findD1File(target);
  const db = new DatabaseSync(file);
  let after;
  try { after = { counts: tableCounts(db), ...databaseHealth(db) }; } finally { db.close(); }
  const diff = compareCounts(before.counts, after.counts);
  const ok = !diff.dropped.length && !diff.lostRows.length && after.integrity === 'ok' && after.foreignKeyViolations === 0;
  console.log(`[db:rehearse] Migrations ${before.migrations} -> ${after.migrations} (last ${after.lastMigration}).`);
  console.log(`[db:rehearse] Changed: ${diff.changed.map(item => `${item.table} ${item.before}->${item.after}`).join('; ') || 'none'}`);
  console.log(`[db:rehearse] New tables: ${diff.added.map(item => `${item.table} (${item.rows})`).join(', ') || 'none'}; dropped: ${diff.dropped.join(', ') || 'none'}`);
  console.log(`[db:rehearse] Integrity ${after.integrity}; ${after.foreignKeyViolations} foreign-key violations. ${ok ? 'No table lost rows.' : 'REVIEW: rows were lost, a table was dropped, or the copy is not sound.'}`);
  if (after.migrations === before.migrations) console.warn('[db:rehearse] No migration ran: was the copy served with the new build, and did a request reach that server?');
  return { ok, before, after, diff };
}

if (isMain(import.meta.url)) {
  try {
    const args = argumentsOf(process.argv.slice(2), ['--from', '--persist-to', '--database', '--bucket', '--port', '--media-sample'], ['--compare', '--no-plugin-bundles']);
    const port = args.port ? Number(args.port) : 8790;
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('--port must be a port number');
    if (args.compare) {
      const { ok } = await compareRehearsal({ persistTo: args['persist-to'], port });
      if (!ok) process.exitCode = 1;
    } else {
      const mediaSample = args['media-sample'] ? Number(args['media-sample']) : 0;
      if (!Number.isInteger(mediaSample) || mediaSample < 0) throw new Error('--media-sample must be a whole number');
      await prepareRehearsal({ from: args.from, persistTo: args['persist-to'], database: args.database, bucket: args.bucket, port, mediaSample, pluginBundles: !args['no-plugin-bundles'] });
    }
  } catch (err) {
    console.error(`[db:rehearse] Error: ${err.message}`);
    process.exitCode = 1;
  }
}
