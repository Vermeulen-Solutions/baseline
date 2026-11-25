import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { assertLocalCopyTarget, keyPath, mediaURL, prepareLocalCopy, serveCommands } from '../scripts/d1-local-copy.mjs';

// Portable: throwaway folders, a stubbed `git`, a stubbed fetch and a stubbed Wrangler; no network.
const scratch = prefix => mkdtempSync(path.join(os.tmpdir(), prefix));
const git = answers => (command, args) => args[0] === 'rev-parse' ? { status: answers.inside ? 0 : 128, stdout: answers.inside ? 'true\n' : '' } : { status: answers.ignored ? 0 : 1, stdout: '' };

test('local copy: refuses a folder Git would track, and media keys that leave the media folder', () => {
  assert.throws(() => assertLocalCopyTarget('.emdash/local-copy', git({ inside: true, ignored: false })), /not ignored by Git/);
  assert.doesNotThrow(() => assertLocalCopyTarget('.emdash/backups/local-1', git({ inside: true, ignored: true })));
  const uploads = path.join(os.tmpdir(), 'uploads');
  assert.equal(keyPath(uploads, 'registry/r_abc/1.0.0/backend.js'), path.join(uploads, 'registry', 'r_abc', '1.0.0', 'backend.js'));
  assert.throws(() => keyPath(uploads, '../data.db'), /leaves the media folder/);
  assert.equal(mediaURL('https://club.example/', 'photo one.jpg'), 'https://club.example/_emdash/api/media/file/photo%20one.jpg');
  assert.throws(() => mediaURL('file:///etc/passwd', 'x.jpg'), /http\(s\)/);
  const commands = serveCommands(path.join(process.cwd(), '.emdash', 'backups', 'local-1'));
  assert.equal(commands.posix, 'EMDASH_SQLITE_URL=file:./.emdash/backups/local-1/data.db EMDASH_LOCAL_MEDIA_DIR=./.emdash/backups/local-1/uploads npm run dev');
  assert.match(commands.powershell, /^\$env:EMDASH_SQLITE_URL = 'file:\.\/\.emdash\/backups\/local-1\/data\.db'; \$env:EMDASH_LOCAL_MEDIA_DIR = '\.\/\.emdash\/backups\/local-1\/uploads'; npm\.cmd run dev$/);
});

test('local copy: loads the export, fetches media from the live site and plugin code from R2, leaves data.db alone', async () => {
  const dir = scratch('local-copy-');
  const log = console.log;
  try {
    const exportFile = path.join(dir, 'export.sql');
    writeFileSync(exportFile, `CREATE TABLE child (id INTEGER PRIMARY KEY, parent_id INTEGER REFERENCES parent(id));
CREATE TABLE parent (id INTEGER PRIMARY KEY);
CREATE TABLE media (id TEXT PRIMARY KEY, storage_key TEXT, created_at TEXT);
CREATE TABLE _plugin_state (plugin_id TEXT, version TEXT, status TEXT, source TEXT, marketplace_version TEXT);
INSERT INTO child VALUES (1, 1);
INSERT INTO parent VALUES (1);
INSERT INTO media VALUES ('a', 'one.jpg', '2026-11-02'), ('b', 'two.png', '2026-11-01'), ('c', 'gone.jpg', '2026-10-01');
INSERT INTO _plugin_state VALUES ('r_abc', '1.2.0', 'active', 'registry', NULL), ('off', '1.0.0', 'inactive', 'registry', NULL);`);
    const fetched = [];
    const fetcher = async url => { fetched.push(url); return url.endsWith('gone.jpg') ? { ok: false, status: 404 } : { ok: true, status: 200, arrayBuffer: async () => new TextEncoder().encode(`bytes of ${url.split('/').at(-1)}`).buffer }; };
    const r2 = [];
    const runNpm = args => {
      const key = args[args.indexOf('get') + 1];
      r2.push(key);
      if (key.endsWith('admin.js')) throw Object.assign(new Error('not found'), { stderr: 'The specified key does not exist.' });
      writeFileSync(args[args.indexOf('--file') + 1], `code of ${key}`);
    };
    console.log = () => {};
    const to = path.join(dir, 'copy');
    const result = await prepareLocalCopy({ from: exportFile, to, origin: 'https://club.example', bucket: 'club-media' }, { runNpm, fetcher, run: git({ inside: false }) });
    console.log = log;

    const db = new DatabaseSync(result.file, { readOnly: true });
    assert.equal(db.prepare('SELECT count(*) AS n FROM child').get().n, 1, 'a child row inserted before its parent loads');
    db.close();
    assert.deepEqual([result.record.integrity, result.record.foreignKeyViolations], ['ok', 0]);
    assert.equal(readFileSync(path.join(to, 'uploads', 'one.jpg'), 'utf8'), 'bytes of one.jpg');
    assert.deepEqual([result.record.media.copied, result.record.media.failed], [2, ['gone.jpg (404)']]);
    assert.ok(fetched.every(url => url.startsWith('https://club.example/_emdash/api/media/file/')));
    assert.deepEqual(r2, ['club-media/registry/r_abc/1.2.0/manifest.json', 'club-media/registry/r_abc/1.2.0/backend.js', 'club-media/registry/r_abc/1.2.0/admin.js'], 'only active registry plugins; admin.js is optional');
    assert.equal(readFileSync(path.join(to, 'uploads', 'registry', 'r_abc', '1.2.0', 'backend.js'), 'utf8'), 'code of club-media/registry/r_abc/1.2.0/backend.js');
    assert.ok(existsSync(path.join(to, 'local-copy.json')));
    await assert.rejects(prepareLocalCopy({ from: exportFile, to, origin: 'https://club.example' }, { runNpm, fetcher, run: git({ inside: false }) }), /not empty/);
  } finally {
    console.log = log;
    rmSync(dir, { recursive: true, force: true });
  }
});
