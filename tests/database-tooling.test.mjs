import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { MIGRATION_NAMES, validateSeed } from 'emdash';
import { inspectSQLite, compareSchemas } from '../scripts/sqlite-schema.mjs';
import { diffDatabase } from '../scripts/db-diff.mjs';
import { reconstructIsolated, exportD1, pullRemote } from '../scripts/d1-snapshot.mjs';
import { exportSeedCandidate, projectSeed } from '../scripts/db-export-seed.mjs';
import { resolveCloudflare, sha256 } from '../scripts/infrastructure-io.mjs';

const root = fileURLToPath(new URL('../', import.meta.url)), cli = path.join(root, 'node_modules/emdash/dist/cli/index.mjs');
const target = { kind: 'd1', account: '1'.repeat(32), environment: 'preview', binding: 'DB', database: '11111111-1111-4111-8111-111111111111' };
function sandbox(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-database-'));
  const done = () => { assert.equal(path.dirname(directory), path.resolve(os.tmpdir())); assert.match(path.basename(directory), /^baseline-database-/); fs.rmSync(directory, { recursive: true, force: true }); };
  try { const result = run(directory); if (result?.then) return result.finally(done); done(); return result; } catch (error) { done(); throw error; }
}
function database(directory, name = 'one.sqlite', change = '') {
  const file = path.join(directory, name), db = new DatabaseSync(file);
  db.exec(`CREATE TABLE _emdash_migrations(name TEXT PRIMARY KEY); CREATE TABLE _emdash_collections(id TEXT PRIMARY KEY, slug TEXT); CREATE TABLE _emdash_fields(collection_id TEXT,slug TEXT,type TEXT,column_type TEXT,required INTEGER,"unique" INTEGER,default_value TEXT,validation TEXT,options TEXT); INSERT INTO _emdash_collections VALUES('one','example'); INSERT INTO _emdash_fields VALUES('one','title','string','TEXT',0,0,NULL,NULL,NULL); CREATE TABLE ec_example(id TEXT PRIMARY KEY,title TEXT DEFAULT ('hello'));`);
  for (const name of MIGRATION_NAMES) db.prepare('INSERT INTO _emdash_migrations VALUES (?)').run(name);
  if (change) db.exec(change); db.close(); return file;
}
test('schema equality is deterministic, metadata-only and byte-preserving; default/type spelling normalizes', () => sandbox(directory => {
  const first = database(directory), before = sha256(fs.readFileSync(first));
  const second = database(directory, 'two.sqlite', "ALTER TABLE ec_example ADD COLUMN version INT DEFAULT ((1.0));");
  const third = database(directory, 'three.sqlite', 'ALTER TABLE ec_example ADD COLUMN version INTEGER DEFAULT 1;');
  const report = compareSchemas(inspectSQLite(second), inspectSQLite(third)); assert.equal(report.status, 'equal'); assert.equal(report.exitCode, 0);
  assert.deepEqual(inspectSQLite(first), inspectSQLite(first)); assert.equal(sha256(fs.readFileSync(first)), before);
  assert.equal(fs.readdirSync(directory).some(name => /-wal|-shm/.test(name)), false);
}));
test('generated/retained columns, index/FK/default and migration drift never become content parity', () => sandbox(directory => {
  const first = database(directory), second = database(directory, 'two.sqlite', 'ALTER TABLE ec_example ADD COLUMN generated TEXT AS (lower(title)) VIRTUAL; CREATE UNIQUE INDEX changed ON ec_example(title DESC);');
  const snapshot = inspectSQLite(second), report = compareSchemas(inspectSQLite(first), snapshot);
  assert.equal(report.exitCode, 1); assert.equal(snapshot.schema.tables.find(table => table.name === 'ec_example').columns.at(-1).hidden, 2);
  assert.ok(report.issues.some(issue => issue.rule === 'unregistered-column-review'));
  const db = new DatabaseSync(second); db.exec("DELETE FROM _emdash_migrations WHERE name='001_initial'"); db.close();
  assert.equal(compareSchemas(inspectSQLite(first), inspectSQLite(second)).exitCode, 2);
  assert.match(report.scope, /no content equality/);
}));
test('foreign keys, column-owned collation/checks, nullability and defaults remain distinct', () => sandbox(directory => {
  const first = database(directory, 'a.sqlite', 'CREATE TABLE related(id INTEGER PRIMARY KEY AUTOINCREMENT, a TEXT COLLATE NOCASE, b TEXT, parent TEXT REFERENCES ec_example(id) DEFERRABLE INITIALLY DEFERRED, CHECK(length(a)>0));');
  const second = database(directory, 'b.sqlite', 'CREATE TABLE related(id INTEGER PRIMARY KEY, a TEXT, b TEXT COLLATE NOCASE NOT NULL DEFAULT 1, parent TEXT REFERENCES ec_example(id), CHECK(length(a)>1));');
  assert.equal(compareSchemas(inspectSQLite(first), inspectSQLite(second)).exitCode, 1);
  const a = inspectSQLite(first).schema.tables.find(table => table.name === 'related'); assert.ok(a.foreignKeys.length); assert.ok(a.expressions.some(value => value.owner === 'a'));
}));
test('numeric affinity normalization cannot hide different TEXT defaults', () => sandbox(directory => {
  const first = database(directory, 'a.sqlite', 'CREATE TABLE defaults(value TEXT DEFAULT 1);');
  const second = database(directory, 'b.sqlite', 'CREATE TABLE defaults(value TEXT DEFAULT 1.0);');
  assert.equal(compareSchemas(inspectSQLite(first), inspectSQLite(second)).exitCode, 1);
}));
test('registry JSON key order normalizes while values and array order remain significant', () => sandbox(directory => {
  const first = database(directory), second = database(directory, 'two.sqlite');
  function set(file, json) { const db = new DatabaseSync(file); db.prepare('UPDATE _emdash_fields SET options=?').run(json); db.close(); }
  set(first, '{"widget":{"size":2,"label":"Example"},"choices":["a","b"]}');
  set(second, '{ "choices": ["a", "b"], "widget": {"label":"Example", "size":2} }');
  assert.equal(compareSchemas(inspectSQLite(first), inspectSQLite(second)).exitCode, 0);
  set(second, '{"widget":{"size":2,"label":"Example"},"choices":["b","a"]}');
  assert.equal(compareSchemas(inspectSQLite(first), inspectSQLite(second)).exitCode, 1);
}));

test('51 actual columns fail even when the saved schema is identical; missing registry/malformed snapshots are unverified', () => sandbox(directory => {
  const file = database(directory), db = new DatabaseSync(file);
  for (let i = 0; i < 49; i++) db.exec(`ALTER TABLE ec_example ADD COLUMN old_${i} TEXT`); db.close();
  const snapshot = inspectSQLite(file); assert.equal(compareSchemas(snapshot, snapshot).exitCode, 1);
  assert.ok(snapshot.schema.issues.some(issue => issue.physicalColumns === 51));
  assert.throws(() => compareSchemas(snapshot, { ...snapshot, schemaSHA256: '0'.repeat(64) }));
  fs.writeFileSync(path.join(directory, 'broken.sqlite'), 'not SQLite'); assert.throws(() => inspectSQLite(path.join(directory, 'broken.sqlite')));
  fs.writeFileSync(file + '-wal', 'active'); assert.throws(() => inspectSQLite(file), /closed consistent/);
}));
test('JSONC/TOML explicit targets refuse ambiguity, inheritance, missing auth and shell-like selections', async () => sandbox(async directory => {
  const json = path.join(directory, 'wrangler.jsonc');
  fs.writeFileSync(json, JSON.stringify({ account_id: target.account, env: { preview: { d1_databases: [{ binding: 'DB', database_id: target.database }] } } }));
  assert.deepEqual(resolveCloudflare({ config: json, env: 'preview', account: target.account, database: target.database }, 'd1').database, target.database);
  const toml = path.join(directory, 'wrangler.toml'); fs.writeFileSync(toml, `account_id = "${target.account}"\n[[env.preview.d1_databases]]\nbinding="DB"\ndatabase_id="${target.database}"\n`);
  assert.equal(resolveCloudflare({ config: toml, env: 'preview', account: target.account, database: target.database }, 'd1').binding, 'DB');
  assert.throws(() => resolveCloudflare({ config: json, env: 'production', account: target.account, database: target.database }, 'd1'));
  assert.throws(() => resolveCloudflare({}, 'd1'));
  const duplicated = JSON.parse(fs.readFileSync(json)); duplicated.env.preview.d1_databases.push(duplicated.env.preview.d1_databases[0]); fs.writeFileSync(json, JSON.stringify(duplicated));
  assert.throws(() => resolveCloudflare({ config: json, env: 'preview', account: target.account, database: target.database }, 'd1'), /ambiguous/);
  let calls = 0; await assert.rejects(exportD1(target, { token: '', request: () => { calls++; } })); assert.equal(calls, 0);
}));
test('bounded D1 export polling/download uses explicit identity, rejects auth/error/changing bookmarks and never forwards credentials to downloads', async () => {
  const calls = [];
  const request = async (url, options) => { calls.push({ url, options }); return calls.length === 1 ? Response.json({ success: true, result: { at_bookmark: 'one' } }) : calls.length === 2 ? Response.json({ success: true, result: { status: 'complete', at_bookmark: 'one', result: { signed_url: 'https://fixture.r2.cloudflarestorage.com/export.sql?signature=synthetic' } } }) : new Response('CREATE TABLE example(id TEXT);'); };
  const result = await exportD1(target, { token: 'synthetic', request, wait: async () => {} }); assert.ok(result.sql.toString().startsWith('CREATE TABLE')); assert.equal(calls[2].options.headers, undefined);
  assert.equal(JSON.parse(calls[1].options.body).current_bookmark, 'one');
  await assert.rejects(exportD1(target, { token: 'synthetic', request: async () => new Response('', { status: 403 }) }));
  await assert.rejects(exportD1(target, { token: 'synthetic', request: async () => Response.json({ success: true, result: { status: 'complete', result: { signed_url: 'https://example.invalid/secret' } } }) }));
  let reads = 0;
  await assert.rejects(exportD1(target, { token: 'synthetic', wait: async () => {}, request: async () => Response.json({ success: true, result: ++reads === 1 ? { at_bookmark: 'one' } : { status: 'complete', at_bookmark: 'changed', result: { signed_url: 'https://fixture.r2.cloudflarestorage.com/export.sql' } } }) })); assert.equal(reads, 2);
});
test('isolated SQL reconstruction accepts literals, validates FK/integrity and quarantines malicious/trigger/virtual SQL without touching working DB', () => sandbox(directory => {
  const sql = path.join(directory, 'export.sql'), output = path.join(directory, 'inspection.sqlite');
  fs.writeFileSync(sql, "PRAGMA foreign_keys=OFF; BEGIN TRANSACTION; CREATE TABLE sample(id INTEGER PRIMARY KEY, text TEXT); INSERT INTO sample VALUES(1,'quote; -- still a literal'); COMMIT;");
  const receipt = reconstructIsolated(sql, output); assert.equal(receipt.statements, 2); assert.ok(fs.existsSync(output)); assert.throws(() => reconstructIsolated(sql, output));
  assert.throws(() => reconstructIsolated(sql, path.join(directory, 'DATA.DB')));
  for (const source of ["ATTACH DATABASE 'other.sqlite' AS private", 'CREATE TRIGGER bad AFTER INSERT ON sample BEGIN DELETE FROM sample; END;', 'CREATE VIRTUAL TABLE bad USING fts5(text);', "CREATE TABLE sample(id TEXT); INSERT INTO sample VALUES(readfile('/private'));", 'CREATE TABLE ???']) {
    fs.writeFileSync(sql, source); assert.throws(() => reconstructIsolated(sql, path.join(directory, 'refused-' + sha256(source).slice(0, 8) + '.sqlite')));
  }
  assert.equal(fs.existsSync(path.join(directory, 'other.sqlite')), false); assert.equal(fs.existsSync(path.join(directory, 'data.db')), false);
}));
test('mocked D1 pull reconstructs a new ignored snapshot, records provenance and refuses unsafe/existing outputs before another request', async () => sandbox(async directory => {
  const config = path.join(directory, 'wrangler.jsonc'); fs.writeFileSync(config, JSON.stringify({ account_id: target.account, env: { preview: { d1_databases: [{ binding: 'DB', database_id: target.database }] } } }));
  const sql = 'CREATE TABLE _emdash_migrations(name TEXT PRIMARY KEY); CREATE TABLE _emdash_collections(id TEXT,slug TEXT); CREATE TABLE _emdash_fields(collection_id TEXT,slug TEXT,type TEXT,column_type TEXT,required INTEGER,"unique" INTEGER,default_value TEXT,validation TEXT,options TEXT);' + MIGRATION_NAMES.map(name => `INSERT INTO _emdash_migrations VALUES('${name}');`).join('');
  let calls = 0;
  const dependencies = { token: 'synthetic', request: async url => { calls++; return String(url).includes('/export') ? Response.json({ success: true, result: { status: 'complete', at_bookmark: 'synthetic-bookmark', result: { signed_url: 'https://fixture.r2.cloudflarestorage.com/snapshot.sql' } } }) : new Response(sql); } };
  const out = path.join(root, '.emdash/backups', path.basename(directory) + '-pull'), options = { config, env: 'preview', account: target.account, database: target.database, out };
  try {
    const result = await pullRemote(options, dependencies); assert.equal(result.receipt.exitCode, 0); assert.equal(result.receipt.status, 'inspected'); assert.equal(calls, 2); assert.equal(result.schema.schema.migrations.length, MIGRATION_NAMES.length);
    assert.ok(fs.existsSync(path.join(out, 'inspection.sqlite'))); assert.equal(JSON.stringify(result.receipt).includes('signed_url'), false);
    await assert.rejects(pullRemote(options, dependencies)); await assert.rejects(pullRemote({ ...options, out: path.join(directory, 'data.db') }, dependencies)); assert.equal(calls, 2); assert.equal(fs.existsSync(path.join(directory, 'data.db')), false);
  } finally { assert.equal(path.dirname(out), path.join(root, '.emdash/backups')); if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true }); }
}));
test('diff CLI requires one explicit target; saved capture yields equal JSON/Markdown and error exit 2 preserves sources', async () => sandbox(async directory => {
  const file = database(directory), capture = path.join(directory, 'capture'), before = sha256(fs.readFileSync(file));
  assert.equal((await diffDatabase({ local: file, capture: true, out: capture })).status, 'captured');
  const out = path.join(directory, 'report'); assert.equal((await diffDatabase({ local: file, snapshot: path.join(capture, 'schema.json'), out })).exitCode, 0); assert.ok(fs.existsSync(path.join(out, 'report.md')));
  await assert.rejects(diffDatabase({ local: file })); await assert.rejects(pullRemote({}));
  for (const script of ['db-diff.mjs', 'd1-snapshot.mjs']) { const result = spawnSync(process.execPath, [path.join(root, 'scripts', script)], { encoding: 'utf8' }); assert.equal(result.status, 2); assert.match(result.stderr, /unverified/); }
  assert.equal(sha256(fs.readFileSync(file)), before);
  const seed = path.join(directory, 'expectations.json'); fs.writeFileSync(seed, JSON.stringify({ version: '1', collections: [{ slug: 'example', label: 'Example', fields: [{ slug: 'missing', label: 'Missing', type: 'string' }] }] }));
  const drift = await diffDatabase({ local: file, snapshot: path.join(capture, 'schema.json'), seed }); assert.equal(drift.exitCode, 1); assert.equal(drift.seedExpectations.status, 'drift');
}));
test('seed allowlist retains array/reference/locale semantics and refuses excluded references or relation gaps', () => {
  const seed = { version: '1', settings: { privateEmail: 'never-export' }, collections: [{ slug: 'pages', label: 'Pages', fields: [{ slug: 'title', label: 'Title', type: 'string' }, { slug: 'secret', label: 'Secret', type: 'string' }] }], content: { pages: [{ id: 'a', slug: 'a', data: { title: ['second', 'first'], secret: 'private' } }] } };
  const policy = { policyVersion: 1, collections: { pages: { fields: ['title'], content: true } } }, result = projectSeed(seed, policy);
  assert.deepEqual(result.seed.content.pages[0].data.title, ['second', 'first']); assert.equal(JSON.stringify(result).includes('never-export'), false); assert.equal(JSON.stringify(result.seed).includes('secret'), false);
  seed.content.pages[0].data.title = '$ref:excluded'; assert.throws(() => projectSeed(seed, policy));
});
test('installed EmDash CLI export wrapper is read-only, allowlisted and round-trips a fresh synthetic seed without leaking private fields', () => sandbox(directory => {
  const seed = { version: '1', collections: [{ slug: 'pages', label: 'Pages', fields: [{ slug: 'title', label: 'Title', type: 'string' }, { slug: 'private_note', label: 'Private note', type: 'string' }] }], content: { pages: [{ id: 'one', slug: 'one', status: 'published', data: { title: 'Synthetic title', private_note: 'DO-NOT-EXPORT' } }] } };
  const input = path.join(directory, 'input.json'); fs.writeFileSync(input, JSON.stringify(seed));
  const source = path.join(directory, 'source.sqlite');
  const cliRun = args => execFileSync(process.execPath, [cli, ...args], { cwd: directory, timeout: 60000, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  cliRun(['seed', input, '--database', source, '--with-content']);
  const original = sha256(fs.readFileSync(source)), policy = path.join(directory, 'policy.json'); fs.writeFileSync(policy, JSON.stringify({ policyVersion: 1, collections: { pages: { fields: ['title'], content: true } } }));
  // Candidate staging root is deliberately confined to ignored storage in this tooling repository.
  const out = path.join(root, '.emdash/backups', path.basename(directory));
  try {
    const receipt = exportSeedCandidate({ database: source, policy, out }); assert.equal(receipt.exitCode, 0);
    const candidate = path.join(out, 'candidate.json'), value = JSON.parse(fs.readFileSync(candidate)); assert.equal(validateSeed(value).valid, true); assert.equal(fs.readFileSync(candidate, 'utf8').includes('DO-NOT-EXPORT'), false);
    assert.equal(sha256(fs.readFileSync(source)), original);
    const destination = path.join(directory, 'fresh.sqlite'); cliRun(['seed', candidate, '--database', destination, '--with-content']);
    const roundTrip = JSON.parse(cliRun(['export-seed', '--database', destination, '--with-content', 'pages']));
    assert.equal(roundTrip.content.pages[0].data.title, 'Synthetic title'); assert.equal(Object.hasOwn(roundTrip.content.pages[0].data, 'private_note'), false);
    assert.throws(() => exportSeedCandidate({ database: source, policy, out }));
    assert.throws(() => exportSeedCandidate({ database: source, policy, out: path.join(directory, 'seed') }));
  } finally { assert.equal(path.dirname(out), path.join(root, '.emdash/backups')); if (fs.existsSync(out)) fs.rmSync(out, { recursive: true, force: true }); }
}));
