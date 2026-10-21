import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tokenOperation, TOKEN_PRESETS } from '../scripts/create-mcp-token.mjs';

function fixture(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-mcp-access-'));
  const file = path.join(directory, 'cms.sqlite'), db = new DatabaseSync(file);
  db.exec(`CREATE TABLE users(id TEXT PRIMARY KEY, email TEXT, role INTEGER);
    CREATE TABLE _emdash_api_tokens(id TEXT PRIMARY KEY, name TEXT, token_hash TEXT, prefix TEXT, user_id TEXT REFERENCES users(id), scopes TEXT, expires_at TEXT, created_at TEXT);
    INSERT INTO users VALUES ('admin-id','admin@example.test',50),('editor-id','editor@example.test',40),('author-id','author@example.test',30),('contributor-id','contributor@example.test',20),('subscriber-id','subscriber@example.test',10);`);
  try { return run({ directory, file, db, options: { db: file, user: 'admin-id' } }); }
  finally {
    db.close(); assert.equal(path.dirname(directory), path.resolve(os.tmpdir())); assert.ok(path.basename(directory).startsWith('baseline-mcp-access-'));
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test('default access planning does not change bytes, create users or reveal credentials', () => fixture(({ file, db, options }) => {
  const before = fs.readFileSync(file), plan = tokenOperation(options);
  assert.equal(plan.status, 'planned'); assert.equal(plan.elevated, false);
  assert.deepEqual(plan.scopes, TOKEN_PRESETS['read-only']);
  assert.ok(!Object.hasOwn(plan, 'token')); assert.equal(db.prepare('SELECT count(*) n FROM _emdash_api_tokens').get().n, 0);
  assert.equal(db.prepare('SELECT count(*) n FROM users').get().n, 5);
  assert.deepEqual(fs.readFileSync(file), before);
}));

test('explicit apply stores only the hash, selected owner, exact scopes and expiry', () => fixture(({ db, options }) => {
  const result = tokenOperation({ ...options, user: 'author@example.test', preset: 'content-authoring', apply: true });
  const row = db.prepare('SELECT * FROM _emdash_api_tokens WHERE id = ?').get(result.tokenId);
  assert.equal(row.user_id, 'author-id'); assert.deepEqual(JSON.parse(row.scopes), TOKEN_PRESETS['content-authoring']);
  assert.equal(row.token_hash, createHash('sha256').update(result.token).digest('base64url'));
  assert.ok(!JSON.stringify(row).includes(result.token)); assert.equal(row.expires_at, result.expiresAt);
  assert.ok(result.elevated && result.notes.some(note => note.includes('taxonomy and menu')));
  assert.ok(!JSON.parse(row.scopes).some(scope => scope === 'admin' || scope.startsWith('mcp:') || scope.startsWith('transfer:')));
}));

test('role limits, unknown scopes, malformed expiry and ambiguous owners fail without changes', () => fixture(({ file, db, options }) => {
  const cases = [
    { user: 'missing' }, { user: 'subscriber-id' }, { user: 'editor-id', preset: 'setup' },
    { scopes: 'content:read,unknown:write' }, { scopes: 'content:read,content:read' },
    { preset: 'unknown' }, { preset: 'setup', scopes: 'content:read' },
    { 'expires-at': 'yesterday' }, { 'expires-at': '2000-01-01T00:00:00Z' },
    { url: 'https://production.example.test' }, { url: 'http://user:secret@localhost' },
  ];
  for (const candidate of cases) {
    const before = fs.readFileSync(file);
    assert.throws(() => tokenOperation({ ...options, ...candidate, apply: true }));
    assert.deepEqual(fs.readFileSync(file), before);
  }
  db.prepare('INSERT INTO users VALUES (?,?,?)').run('admin@example.test', 'other@example.test', 'admin');
  assert.throws(() => tokenOperation({ ...options, user: 'admin@example.test', apply: true }), /ambiguous/);
  assert.equal(db.prepare('SELECT count(*) n FROM _emdash_api_tokens').get().n, 0);
}));

test('narrow custom scopes support lower roles; setup is explicit and excludes plugin/transfer grants', () => fixture(({ options }) => {
  const read = tokenOperation({ ...options, user: 'subscriber-id', scopes: 'content:read,media:read' });
  assert.equal(read.elevated, false);
  assert.equal(tokenOperation({ ...options, user: 'contributor-id', preset: 'content-authoring' }).user.role, 'contributor');
  const setup = tokenOperation({ ...options, preset: 'setup' });
  assert.ok(setup.elevated && setup.scopes.includes('schema:write') && setup.scopes.includes('settings:manage'));
  assert.ok(!setup.scopes.some(scope => scope === 'admin' || scope.startsWith('mcp:') || scope.startsWith('transfer:')));
}));

test('revocation is planned by default and limited to the selected owner and token', () => fixture(({ db, options }) => {
  const first = tokenOperation({ ...options, apply: true }), second = tokenOperation({ ...options, apply: true });
  const args = { ...options, revoke: first.tokenId };
  assert.equal(tokenOperation(args).status, 'planned');
  assert.throws(() => tokenOperation({ ...args, user: 'editor-id', apply: true }), /not found/);
  assert.equal(tokenOperation({ ...args, apply: true }).status, 'revoked');
  assert.equal(db.prepare('SELECT count(*) n FROM _emdash_api_tokens WHERE id = ?').get(first.tokenId).n, 0);
  assert.equal(db.prepare('SELECT count(*) n FROM _emdash_api_tokens WHERE id = ?').get(second.tokenId).n, 1);
  assert.throws(() => tokenOperation({ ...args, apply: true }), /not found/);
}));

test('CLI refuses legacy remote SQL and missing explicit inputs without creating a database', () => fixture(({ directory, file }) => {
  const script = fileURLToPath(new URL('../scripts/create-mcp-token.mjs', import.meta.url));
  const help = spawnSync(process.execPath, [script], { cwd: directory, encoding: 'utf8' });
  assert.equal(help.status, 0); assert.ok(help.stdout.includes('Without --apply'));
  for (const args of [['--d1', 'remote-db'], ['--db', file], ['--db', path.join(directory, 'missing.sqlite'), '--user', 'admin-id']]) {
    const result = spawnSync(process.execPath, [script, ...args], { cwd: directory, encoding: 'utf8' });
    assert.equal(result.status, 1); assert.ok(!result.stdout.includes('ec_pat_'));
  }
  assert.ok(!fs.existsSync(path.join(directory, 'missing.sqlite')));
}));
