import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { planModernization, writePlan, runModernization } from '../scripts/audit-modernize.mjs';
import { sha256 } from '../scripts/audit-evidence.mjs';

const cli = fileURLToPath(new URL('../scripts/audit-modernize.mjs', import.meta.url));
function fixture(fn, { prebuild = 'node scripts/prepare-assets.mjs' } = {}) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-recipe-')), root = path.join(parent, 'site'); fs.mkdirSync(root);
  const put = (file, bytes) => { const full = path.join(root, file); fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, bytes); };
  put('package.json', JSON.stringify({ name: 'synthetic-recipe-fixture', private: true, scripts: { build: 'astro build', 'check:schema-budget': 'node scripts/check-schema-budget.mjs', ...(prebuild === null ? {} : { prebuild }) } }, null, 2) + '\n');
  put('package-lock.json', JSON.stringify({ packages: { 'node_modules/astro': { version: '7.4.0' }, 'node_modules/emdash': { version: '1.3.0' } } }));
  put('.gitignore', 'node_modules/\ndata.db*\n*.marker\n');
  put('scripts/prepare-assets.mjs', "import fs from 'node:fs';fs.writeFileSync('prepared.marker','prepared');\n");
  for (const file of ['check-schema-budget.mjs', 'schema-column-budget.mjs']) put('scripts/' + file, fs.readFileSync(new URL('../scripts/' + file, import.meta.url)));
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-q', '-b', 'codex/schema-preflight-fixture'); git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture');
  try { return fn({ root, parent, put, git, pkg: () => fs.readFileSync(path.join(root, 'package.json')) }); }
  finally { assert.equal(path.dirname(parent), path.resolve(os.tmpdir())); assert.match(path.basename(parent), /^baseline-recipe-/); fs.rmSync(parent, { recursive: true, force: true }); }
}
test('revision-bound plan is read-only; apply twice, rollback twice and reapply preserve exact bytes and existing hook', () => fixture(({ root, parent, pkg, git }) => {
  const before = pkg(), lock = fs.readFileSync(path.join(root, 'package-lock.json'));
  const plan = planModernization(root); assert.deepEqual(pkg(), before); assert.equal(git('status', '--short'), '');
  assert.equal(plan.prebuildAfter, 'npm run check:schema-budget && node scripts/prepare-assets.mjs'); assert.equal(JSON.stringify(plan).includes(root), false);
  const file = writePlan(plan, path.join(parent, 'plan'), root);
  assert.equal(runModernization(root, file).status, 'applied'); const applied = pkg();
  assert.equal(runModernization(root, file).status, 'applied'); assert.deepEqual(pkg(), applied);
  assert.deepEqual(fs.readFileSync(path.join(root, 'package-lock.json')), lock);
  assert.equal(runModernization(root, file, { rollback: true }).status, 'rolled-back'); assert.deepEqual(pkg(), before);
  assert.equal(runModernization(root, file, { rollback: true }).status, 'rolled-back'); assert.equal(git('status', '--short'), '');
  assert.equal(runModernization(root, file).status, 'applied');
}));
test('missing hook gets one preflight; already-current package is a zero-write no-op', () => {
  fixture(({ root, parent }) => { const plan = planModernization(root); assert.equal(plan.prebuildAfter, 'npm run check:schema-budget'); const file = writePlan(plan, path.join(parent, 'plan'), root); assert.equal(runModernization(root, file).status, 'applied'); }, { prebuild: null });
  fixture(({ root, parent, pkg }) => { const before = pkg(), plan = planModernization(root); assert.equal(plan.operation, 'already-current'); const file = writePlan(plan, path.join(parent, 'plan'), root); assert.equal(runModernization(root, file).status, 'already-current'); assert.deepEqual(pkg(), before); assert.equal(fs.existsSync(path.join(parent, 'plan/package.before.json')), false); }, { prebuild: 'npm run check:schema-budget' });
});
test('changed revision, staged files, modified helpers and unsupported command chains refuse without overwriting edits', () => {
  fixture(({ root, parent, put, git, pkg }) => { const file = writePlan(planModernization(root), path.join(parent, 'plan'), root); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-qm', 'changed'); const before = pkg(); assert.throws(() => runModernization(root, file), /revision/); assert.deepEqual(pkg(), before); put('scripts/check-schema-budget.mjs', 'throw Error("modified")'); assert.throws(() => planModernization(root), /dirty/); });
  fixture(({ root, git }) => { fs.appendFileSync(path.join(root, 'package.json'), '\n'); git('add', 'package.json'); assert.throws(() => planModernization(root), /dirty/); });
  fixture(({ root, put }) => { put('untracked-note.md', 'Preserve this work'); assert.throws(() => planModernization(root), /untracked/); });
  fixture(({ root, parent, pkg }) => { const file = writePlan(planModernization(root), path.join(parent, 'plan'), root); const value = JSON.parse(pkg()); value.description = 'New work after review'; fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(value)); const before = pkg(); assert.throws(() => runModernization(root, file), /Package changed/); assert.deepEqual(pkg(), before); });
  fixture(({ root }) => assert.throws(() => planModernization(root), /Complex/), { prebuild: 'node scripts/prepare-assets.mjs || echo bypass' });
  fixture(({ root, git }) => { fs.appendFileSync(path.join(root, 'scripts/check-schema-budget.mjs'), '// altered\n'); git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'changed helper'); assert.throws(() => planModernization(root), /helper differs/); });
});
test('journal recovery accepts interrupted finalization; backup corruption and post-apply edits block rollback', () => fixture(({ root, parent, pkg }) => {
  const file = writePlan(planModernization(root), path.join(parent, 'plan'), root); runModernization(root, file);
  const journal = path.join(parent, 'plan/receipt.json'), receipt = JSON.parse(fs.readFileSync(journal)); receipt.status = 'prepared'; fs.writeFileSync(journal, JSON.stringify(receipt));
  const applied = pkg(); assert.equal(runModernization(root, file).status, 'applied'); assert.deepEqual(pkg(), applied);
  const edited = JSON.parse(applied); edited.description = 'Later developer change'; fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(edited)); const bytes = pkg();
  assert.throws(() => runModernization(root, file, { rollback: true }), /Post-apply/); assert.deepEqual(pkg(), bytes);
  fs.writeFileSync(path.join(root, 'package.json'), applied); fs.appendFileSync(path.join(parent, 'plan/package.before.json'), '\n');
  assert.throws(() => runModernization(root, file, { rollback: true }), /backup changed/);
}));
test('plan tampering, target output and linked backup are refused', () => fixture(({ root, parent, pkg }) => {
  const plan = planModernization(root); assert.throws(() => writePlan(plan, path.join(root, 'reports'), root), /outside/);
  const file = writePlan(plan, path.join(parent, 'plan'), root); const original = fs.readFileSync(file); const tampered = JSON.parse(original); tampered.prebuildAfter = 'echo unexpected'; fs.writeFileSync(file, JSON.stringify(tampered));
  const before = pkg(); assert.throws(() => runModernization(root, file), /identity/); assert.deepEqual(pkg(), before); fs.writeFileSync(file, original);
  runModernization(root, file); const backup = path.join(parent, 'plan/package.before.json'), hidden = path.join(parent, 'saved.json'); fs.renameSync(backup, hidden);
  if (process.platform !== 'win32') { fs.symlinkSync(hidden, backup); assert.throws(() => runModernization(root, file, { rollback: true }), /linked/); }
  else { fs.writeFileSync(backup, 'wrong backup'); assert.throws(() => runModernization(root, file, { rollback: true }), /backup changed/); }
}));
test('actual npm lifecycle blocks over-budget builds, preserves existing hook and rolls back exactly (synthetic build executable)', () => fixture(({ root, parent, put, pkg, git }) => {
  const before = pkg();
  // A deliberate build test double records whether npm reaches the build phase. No Astro build is claimed here.
  put('build-fixture.mjs', "import fs from 'node:fs';fs.writeFileSync('built.marker','built');\n"); git('add', '.'); git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'lifecycle test fixture');
  if (process.platform === 'win32') put('node_modules/.bin/astro.cmd', '@"' + process.execPath + '" "%~dp0\\..\\..\\build-fixture.mjs"\r\n');
  else { put('node_modules/.bin/astro', '#!/usr/bin/env node\nimport("node:fs").then(fs=>fs.writeFileSync("built.marker","built"));\n'); fs.chmodSync(path.join(root, 'node_modules/.bin/astro'), 0o755); }
  const database = path.join(root, 'data.db'); let db = new DatabaseSync(database); db.exec(`CREATE TABLE ec_wide(${Array.from({ length: 51 }, (_, i) => `c${i} TEXT`).join(',')})`); db.close();
  const build = () => spawnSync('npm run build', { shell: true, cwd: root, encoding: 'utf8', timeout: 20000, env: { ...process.env, EMDASH_SQLITE_URL: 'file:./data.db' } });
  assert.equal(build().status, 0); assert.equal(fs.existsSync(path.join(root, 'built.marker')), true); fs.unlinkSync(path.join(root, 'built.marker')); fs.unlinkSync(path.join(root, 'prepared.marker'));
  const file = writePlan(planModernization(root), path.join(parent, 'plan'), root); runModernization(root, file);
  const rejected = build(); assert.notEqual(rejected.status, 0); assert.match(rejected.stdout + rejected.stderr, /budget exceeded/); assert.equal(fs.existsSync(path.join(root, 'built.marker')), false); assert.equal(fs.existsSync(path.join(root, 'prepared.marker')), false);
  db = new DatabaseSync(database); db.exec('DROP TABLE ec_wide;CREATE TABLE ec_valid(id TEXT)'); db.close(); const accepted = build(); assert.equal(accepted.status, 0, accepted.stdout + accepted.stderr); assert.equal(fs.existsSync(path.join(root, 'prepared.marker')), true); assert.equal(fs.existsSync(path.join(root, 'built.marker')), true);
  runModernization(root, file, { rollback: true }); assert.deepEqual(pkg(), before);
}));
test('CLI defaults to planning only and malformed flags never apply', () => fixture(({ root, pkg }) => {
  const before = sha256(pkg()); const result = spawnSync(process.execPath, [cli, '--root', root], { encoding: 'utf8' }); assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).recipe, 'schema-budget-prebuild@1'); assert.equal(sha256(pkg()), before);
  assert.equal(spawnSync(process.execPath, [cli, '--root', root, '--apply'], { encoding: 'utf8' }).status, 2); assert.equal(sha256(pkg()), before);
}));
