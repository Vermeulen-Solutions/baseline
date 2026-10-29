import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync, backup } from 'node:sqlite';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { configuredSQLite, checkBackup } from '../scripts/check-backup.mjs';

const configText = `import { defineConfig } from 'astro/config'; import cms from 'emdash/astro'; import { sqlite as sql } from 'emdash/db'; export default defineConfig({integrations:[cms({database:sql({url:'file:./data.db'})})]});`;
const make = (file, count = 2) => {
  const db = new DatabaseSync(file);
  db.exec('CREATE TABLE _emdash_collections(slug TEXT); INSERT INTO _emdash_collections VALUES (\'pages\'); CREATE TABLE media(id TEXT); CREATE TABLE ec_pages(id INTEGER, title TEXT);');
  for (let i = 0; i < count; i++) db.prepare('INSERT INTO ec_pages VALUES (?,?)').run(i, `synthetic ${i}`);
  db.close();
};
async function fixture(run, count = 2) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-backup-'));
  try {
    const config = path.join(root, 'astro.config.mjs'), database = path.join(root, 'data.db'), snapshot = path.join(root, 'snapshot.db');
    fs.writeFileSync(config, configText); make(database, count);
    const db = new DatabaseSync(database, { readOnly: true });
    try { await backup(db, snapshot); } finally { db.close(); }
    await run({ root, config, database, snapshot, expected: { ec_pages: count, media: 0 } });
  } finally {
    assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));
    assert.match(path.basename(root),/^baseline-backup-/);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('backup check resolves the actual config and verifies a consistent snapshot and isolated restore', () => fixture(async args => {
  const before = fs.readFileSync(args.database);
  const result = checkBackup(args);
  assert.equal(result.identity, 'static-config'); assert.equal(result.counts.ec_pages, 2);
  const restored = path.join(args.root, 'restored.db');
  const saved = new DatabaseSync(args.snapshot, { readOnly: true });
  try { await backup(saved, restored); } finally { saved.close(); }
  const readback = new DatabaseSync(restored, { readOnly: true });
  try { assert.deepEqual(readback.prepare('SELECT title FROM ec_pages ORDER BY id').all().map(r => r.title), ['synthetic 0', 'synthetic 1']); } finally { readback.close(); }
  assert.deepEqual(fs.readFileSync(args.database), before);
}));

test('wrong existing database, missing source, missing snapshot and malformed native structure are refused without creation', () => fixture(args => {
  fs.mkdirSync(path.join(args.root, '.emdash'));
  const wrong = path.join(args.root, '.emdash', 'data.db'); make(wrong, 0);
  assert.throws(() => checkBackup({ ...args, database: wrong }), /differs/);
  assert.throws(() => checkBackup({ ...args, snapshot: wrong }), /differs/);
  const missing = path.join(args.root, 'missing.db');
  assert.throws(() => checkBackup({ ...args, snapshot: missing }));
  assert.equal(fs.existsSync(missing), false);
  fs.unlinkSync(args.database);
  assert.throws(() => checkBackup(args)); assert.equal(fs.existsSync(args.database), false);
  const db = new DatabaseSync(args.database); db.exec('CREATE TABLE unrelated(id TEXT)'); db.close();
  assert.throws(() => checkBackup(args), /native CMS/);
}));

test('a copied but changed snapshot, a hard link, live sidecars and absent expected inventory cannot pass', () => fixture(args => {
  assert.throws(() => checkBackup({ ...args, expected: {} }), /inventory/);
  assert.throws(() => checkBackup({ ...args, expected: { ec_pages: 9 } }), /reviewed inventory/);
  assert.throws(() => checkBackup({ ...args, snapshot: args.database }), /different/);
  const linked = path.join(args.root, 'hardlink.db'); fs.linkSync(args.database, linked);
  assert.throws(() => checkBackup({ ...args, snapshot: linked }), /hard links/);
  fs.writeFileSync(args.snapshot + '-wal', 'sidecar');
  assert.throws(() => checkBackup(args), /standalone/); fs.unlinkSync(args.snapshot + '-wal');
  const db = new DatabaseSync(args.snapshot); db.exec('DELETE FROM ec_pages'); db.close();
  assert.throws(() => checkBackup(args), /Snapshot inventory/);
}));

test('intentionally empty sites require an explicit empty-site choice', () => fixture(args => {
  assert.throws(() => checkBackup(args), /Populated migration/);
  assert.equal(checkBackup({ ...args, allowEmpty: true }).status, 'passed');
}, 0));

test('dynamic config is not executed and requires an explicit reviewed database', () => fixture(args => {
  const malicious = `import fs from 'node:fs'; fs.writeFileSync(${JSON.stringify(path.join(args.root, 'executed'))},'bad'); export default getConfig();`;
  fs.writeFileSync(args.config, malicious);
  assert.equal(configuredSQLite(malicious), null);
  const { database, ...other } = args;
  assert.throws(() => checkBackup(other), /dynamic/);
  assert.equal(checkBackup({ ...other, database }).identity, 'operator-explicit');
  assert.equal(fs.existsSync(path.join(args.root, 'executed')), false);
  assert.equal(configuredSQLite(configText.replace("'file:./data.db'", 'process.env.DATABASE_URL')), null);
  const cli = spawnSync(process.execPath, [fileURLToPath(new URL('../scripts/check-backup.mjs', import.meta.url)), '--config', args.config, '--snapshot', args.snapshot], { encoding: 'utf8' });
  assert.equal(cli.status, 1); assert.doesNotMatch(cli.stderr, /synthetic|executed|file:\/\//);
}));

test('the installed native seed schema, rather than only a hand-built fixture, passes identity and backup checks', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-native-backup-'));
  try {
    const seed = path.join(root, 'seed.json'), config = path.join(root, 'astro.config.mjs'), database = path.join(root, 'data.db'), snapshot = path.join(root, 'snapshot.db');
    fs.writeFileSync(config, configText);
    fs.writeFileSync(seed, JSON.stringify({ version:'1', collections:[{slug:'pages',label:'Pages',fields:[{slug:'title',label:'Title',type:'string'}]}],content:{pages:[{id:'synthetic-one',slug:'one',status:'published',data:{title:'Synthetic native record'}}]} }));
    execFileSync(process.execPath, [fileURLToPath(new URL('../node_modules/emdash/dist/cli/index.mjs', import.meta.url)), 'seed', seed, '--database', database, '--with-content'], {cwd:root,stdio:'pipe',timeout:30000});
    const db = new DatabaseSync(database, {readOnly:true});
    try { await backup(db, snapshot); } finally { db.close(); }
    const snapshotBytes = fs.readFileSync(snapshot);
    const result = checkBackup({root,config,snapshot,expected:{ec_pages:1,media:0}});
    assert.equal(result.status,'passed'); assert.equal(result.counts._emdash_collections,1);
    assert.equal(checkBackup({root,config,snapshot,expected:{ec_pages:1,media:0}}).snapshotSHA256,result.snapshotSHA256);
    assert.deepEqual(fs.readFileSync(snapshot),snapshotBytes);
    assert.equal(fs.existsSync(snapshot+'-wal'),false); assert.equal(fs.existsSync(snapshot+'-shm'),false);
  } finally {
    assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));
    assert.match(path.basename(root),/^baseline-native-backup-/);
    fs.rmSync(root, {recursive:true,force:true});
  }
});
