// Explicit local-only synthetic pilot. Never invoked by build, deployment or CI.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { DatabaseSync, backup } from 'node:sqlite';
import { chromium, expect } from '@playwright/test';
import { sources, inventory } from './skill-sync.mjs';
import { evidenceBinding } from './audit-runtime-evidence.mjs';
import { sha256, gitRead } from './audit-evidence.mjs';
import { visualContract } from '../tests/visual/contract.mjs';

if (process.env.CI || process.env.GITHUB_ACTIONS || process.platform !== 'win32') throw Error('Synthetic browser pilot is Windows/local only');
assert.equal(process.versions.node, visualContract.node);
const root = fileURLToPath(new URL('../', import.meta.url));
assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'node_modules/@playwright/test/package.json'))).version, visualContract.playwright);
assert.ok(chromium.executablePath().includes('chromium-' + visualContract.chromiumRevision), 'Use the pinned local Chromium renderer');
const npm = process.env.npm_execpath;
assert.ok(npm?.endsWith('npm-cli.js'), 'Invoke through npm run audit:pilot');
assert.equal(process.argv[2], '--out'); assert.equal(process.argv.length, 4);
const out = path.resolve(process.argv[3]); assert.ok(!fs.existsSync(out), 'Choose a new output directory');
const scratchParent = path.join(root, '.emdash/checks'); fs.mkdirSync(scratchParent, { recursive: true });
const scratch = fs.mkdtempSync(path.join(scratchParent, 'site-pilot-'));
const source = path.join(scratch, 'legacy-source'), target = path.join(scratch, 'target');
assert.ok(!out.startsWith(scratch + path.sep), 'Evidence must survive disposable cleanup');
fs.mkdirSync(out, { recursive: true });
const receipts = { date: new Date().toISOString(), scope: 'Synthetic older-workflow fixture, not a real client or older-framework upgrade', sourceCommit: gitRead(root, 'rev-parse', 'HEAD'), node: process.versions.node, playwright: visualContract.playwright, viewports: visualContract.viewports, commands: [] };
const run = (binary, args, cwd = root, env = process.env) => execFileSync(binary, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 240000, maxBuffer: 8 * 1024 * 1024 });
function command(label, args, cwd = root, env = process.env) {
  const output = run(process.execPath, [npm, 'run', ...args], cwd, env);
  receipts.commands.push({ command: label, exitCode: 0, outputSHA256: sha256(output) });
  console.log(label + ': passed'); return output;
}
const git = (cwd, ...args) => run('git', args, cwd);
let server, browser;
const serverLogs = [];
async function stop() {
  if (!server) return;
  const owned = server; server = undefined;
  if (owned.exitCode === null && owned.signalCode === null) {
    const done = once(owned, 'exit'), timer = setTimeout(() => owned.kill('SIGKILL'), 5000); timer.unref();
    owned.kill(); try { await done; } finally { clearTimeout(timer); }
  }
}
const socket = createServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
const origin = 'http://127.0.0.1:' + port;
// Do not forward deployment credentials, database URLs, NODE_OPTIONS or other local site settings.
const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA)$/i.test(name)));
Object.assign(env, { HOST: '127.0.0.1', PORT: String(port), TZ: 'UTC', EMDASH_ENCRYPTION_KEY: 'emdash_enc_v1_' + randomBytes(32).toString('base64url') });
async function launch(dev) {
  const args = dev ? ['node_modules/astro/bin/astro.mjs', 'dev', '--host', '127.0.0.1', '--port', String(port)] : ['dist/server/entry.mjs'];
  server = spawn(process.execPath, args, { cwd: target, env: { ...env, NODE_ENV: dev ? 'development' : 'production' }, stdio: ['ignore', 'pipe', 'pipe'] });
  server.on('error', () => {});
  for (const stream of [server.stdout, server.stderr]) stream.on('data', data => { serverLogs.push(String(data)); if (serverLogs.length > 200) serverLogs.shift(); });
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw Error('Owned fixture server exited');
    try { if ((await fetch(origin + (dev ? '/_styleguide' : '/about'), { signal: AbortSignal.timeout(2000) })).status === 200) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw Error('Owned fixture readiness timeout');
}
async function ready(page) {
  await page.locator('h1').waitFor();
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => image.decode())); });
  const route = new URL(page.url()).pathname;
  if (route === '/about') await expect(page.locator('.article-body')).toContainText('This is the about page.', { timeout: 15000 });
  if (route === '/posts/welcome') await expect(page.locator('.article-body')).toContainText('What to do next', { timeout: 15000 });
}
async function observations(label, editorContext, publicContext) {
  const directory = path.join(out, label); fs.mkdirSync(directory);
  const bundle = { evidenceVersion: 1, capturedAt: new Date().toISOString(), runtime: 'node-sqlite', binding: evidenceBinding(target), expected: [], captures: [], editors: [] };
  for (const viewport of visualContract.viewports) {
    for (const [route, state] of [['/', 'public'], ['/about', 'public'], ['/posts/welcome', 'public'], ['/about', 'editor']]) {
      const page = await (state === 'editor' ? editorContext : publicContext).newPage(); await page.setViewportSize(viewport);
      const errors = []; page.on('pageerror', error => errors.push(error.name)); page.on('console', message => { if (message.type() === 'error') errors.push('console'); });
      const response = await page.goto(origin + route); assert.equal(response.status(), 200); await ready(page);
      if (state === 'editor') await expect(page.locator('h1[data-emdash-ref]')).toHaveCount(1);
      const fact = { route, state, locale: 'en', viewport };
      bundle.expected.push(fact);
      const name = `${bundle.captures.length}-${state}-${viewport.width}.png`;
      const bytes = await page.screenshot({ path: path.join(directory, name), fullPage: false, animations: 'disabled', caret: 'hide' });
      bundle.captures.push({ ...fact, httpStatus: response.status(), ready: true, overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), consoleErrors: errors.length, annotationCount: await page.locator('[data-emdash-ref]').count(), screenshot: { path: name, sha256: sha256(bytes) } });
      await page.close();
    }
  }
  const page = await editorContext.newPage(), anonymous = await publicContext.newPage();
  await page.goto(origin + '/about'); await ready(page);
  const heading = page.locator('h1'), original = (await heading.textContent()).trim(), changed = original + ' pilot verification';
  async function edit(value) {
    await heading.click(); await expect(heading).toHaveAttribute('contenteditable', 'plaintext-only');
    const saved = page.waitForResponse(response => response.request().method() === 'PUT' && new URL(response.url()).pathname.startsWith('/_emdash/api/content/pages/'));
    await heading.fill(value); await heading.press('Enter'); const response = await saved; assert.equal(response.status(), 200);
    await expect(page.locator('#emdash-tb-publish')).toBeVisible();
    const published = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname.endsWith('/publish'));
    await Promise.all([page.waitForNavigation(), page.locator('#emdash-tb-publish').click()]); assert.equal((await published).status(), 200);
    await ready(page); await expect(heading).toHaveText(value); return response.status();
  }
  const status = await edit(changed);
  await page.reload(); await ready(page); const reloaded = (await heading.textContent()).trim(); assert.equal(reloaded, changed);
  await anonymous.goto(origin + '/about'); await ready(anonymous); const published = (await anonymous.locator('h1').textContent()).trim(); assert.equal(published, changed);
  await page.screenshot({ path: path.join(directory, 'editor-changed.png'), animations: 'disabled' });
  await edit(original); await anonymous.reload(); await expect(anonymous.locator('h1')).toHaveText(original);
  const identity = { route: '/about', locale: 'en', field: 'title', surface: 'emdash-inline' };
  const receipt = Buffer.from(JSON.stringify({ ...identity, beforeSHA256: sha256(original), submittedSHA256: sha256(changed), reloadedSHA256: sha256(reloaded), publicSHA256: sha256(published), saveHTTPStatus: status, restored: true }, null, 2) + '\n');
  fs.writeFileSync(path.join(directory, 'save.json'), receipt);
  bundle.editors.push({ ...identity, receipt: { path: 'save.json', sha256: sha256(receipt) } });
  assert.deepEqual(bundle.binding, evidenceBinding(target), 'Runtime checks must preserve source bytes');
  fs.writeFileSync(path.join(directory, 'bundle.json'), JSON.stringify(bundle, null, 2) + '\n');
  await page.close(); await anonymous.close(); return path.join(directory, 'bundle.json');
}
function diagnose(label, evidence, snapshot) {
  const before = evidenceBinding(target), dbHash = sha256(fs.readFileSync(snapshot));
  const databaseFiles = () => ['', '-wal', '-shm', '-journal'].map(suffix => { const file = path.join(target, 'data.db') + suffix; return fs.existsSync(file) ? sha256(fs.readFileSync(file)) : null; });
  const originalDatabase = databaseFiles();
  const directory = path.join(out, label + '-report');
  command(`audit:site (${label})`, ['audit:site', '--', '--root', target, '--db-snapshot', snapshot, '--evidence', evidence, '--out', directory, '--strict']);
  assert.deepEqual(evidenceBinding(target), before); assert.equal(sha256(fs.readFileSync(snapshot)), dbHash);
  assert.deepEqual(databaseFiles(), originalDatabase, 'Diagnosis must preserve fixture DB and sidecars');
  const report = JSON.parse(fs.readFileSync(path.join(directory, 'report.json'))); assert.equal(report.schemaVersion, 2);
  for (const id of ['route-capture-evidence', 'editor-save-reload', 'physical-schema']) assert.equal(report.rules.find(rule => rule.id === id).status, 'pass', id);
  receipts[label] = { summary: report.summary, reportSHA256: sha256(fs.readFileSync(path.join(directory, 'report.json'))), sourceBinding: before, schemaWidths: report.rules.find(rule => rule.id === 'physical-schema').observed.physicalWidths };
  return report;
}
async function snapshotAt(name) {
  const snapshot = path.join(scratch, name + '.sqlite'); assert.ok(!fs.existsSync(snapshot));
  const database = new DatabaseSync(path.join(target, 'data.db'), { readOnly: true });
  try { await backup(database, snapshot); } finally { database.close(); }
  assert.equal(['-wal', '-shm', '-journal'].some(suffix => fs.existsSync(snapshot + suffix)), false);
  receipts.snapshotAcquisition = 'node:sqlite.backup from stopped disposable seeded fixture; new offline output without sidecars';
  return snapshot;
}
try {
  git(root, 'clone', '--no-local', '--no-hardlinks', root, source);
  git(source, 'switch', '-c', 'codex/older-workflow-fixture');
  git(source, 'config', 'user.name', 'Baseline synthetic pilot'); git(source, 'config', 'user.email', 'fixture@example.invalid');
  const pkg = JSON.parse(fs.readFileSync(path.join(source, 'package.json'))); pkg.scripts.prebuild = 'node scripts/pilot-prepare.mjs';
  fs.writeFileSync(path.join(source, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
  fs.writeFileSync(path.join(source, 'scripts/pilot-prepare.mjs'), 'console.log("Synthetic existing prebuild hook preserved");\n');
  for (const group of Object.values(sources)) {
    const files = await inventory(path.join(source, '.agents/skills'), group.skills);
    fs.writeFileSync(path.join(source, '.emdash', group.manifest), JSON.stringify({ formatVersion: 2, commitSha: receipts.sourceCommit, skills: group.skills, files, note: 'Local fixture snapshot inventory, not an upstream authenticity assertion' }, null, 2) + '\n');
  }
  git(source, 'add', 'package.json', 'scripts/pilot-prepare.mjs', '.emdash/upstream-skills.json', '.emdash/site-skills.json'); git(source, 'commit', '-m', 'fixture: older workflow without schema prebuild guard');
  git(root, 'clone', '--no-local', '--no-hardlinks', '--single-branch', source, target); git(target, 'switch', '-c', 'codex/phase4-pilot');
  git(target, 'config', 'user.name', 'Baseline synthetic pilot'); git(target, 'config', 'user.email', 'fixture@example.invalid');
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(target, 'node_modules'), 'junction');
  const original = fs.readFileSync(path.join(target, 'package.json'));
  browser = await chromium.launch({ headless: true, channel: 'chromium' }); receipts.browser = browser.version();
  const editor = await browser.newContext({ viewport: visualContract.viewports[2], reducedMotion: 'reduce' }), anonymous = await browser.newContext({ reducedMotion: 'reduce' });
  await launch(true);
  assert.equal((await editor.request.get(origin + '/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin')).status(), 200);
  await stop();
  command('npm run build (before)', ['build'], target, env);
  // Fresh EmDash setup regenerates types. Establish that fixture fact before binding capture/recipe evidence.
  const generated = gitRead(target, 'status', '--porcelain');
  let committedTypes = false;
  if (generated) {
    assert.equal(generated, 'M emdash-env.d.ts', 'Only known generated fixture types may change during bootstrap');
    git(target, 'add', 'emdash-env.d.ts');
    // Windows type generation can change only CRLF/LF. Git add refreshes that clean state without an empty commit.
    if (gitRead(target, 'diff', '--cached', '--name-only')) { git(target, 'commit', '-m', 'fixture: record types generated from fresh seed'); committedTypes = true; }
  }
  receipts.fixturePreparation = { generatedSeedTypesSettledBeforeEvidence: Boolean(generated), generatedTypeCommit: committedTypes, branch: 'codex/phase4-pilot' };
  await launch(false);
  const editorPage = await editor.newPage(); await editorPage.goto(origin + '/about');
  await Promise.all([editorPage.waitForNavigation(), editorPage.locator('.emdash-tb-toggle').click()]);
  await expect(editorPage.locator('h1[data-emdash-ref]')).toHaveCount(1); await editorPage.close();
  const beforeEvidence = await observations('before', editor, anonymous); await stop();
  const snapshot = await snapshotAt('before');
  const beforeReport = diagnose('before', beforeEvidence, snapshot);
  assert.equal(beforeReport.rules.find(rule => rule.id === 'schema-prebuild').status, 'warning');
  assert.equal(gitRead(target, 'status', '--porcelain'), '', 'Pilot branch must be clean before planning');
  const baselineBinding = evidenceBinding(target), planDirectory = path.join(scratch, 'plan');
  command('audit:modernize --plan', ['audit:modernize', '--', '--root', target, '--recipe', 'schema-budget-prebuild@1', '--plan', planDirectory]);
  const planFile = path.join(planDirectory, 'plan.json'), plan = JSON.parse(fs.readFileSync(planFile));
  assert.equal(plan.prebuildBefore, 'node scripts/pilot-prepare.mjs'); assert.equal(plan.prebuildAfter, 'npm run check:schema-budget && node scripts/pilot-prepare.mjs'); assert.equal(plan.revision, baselineBinding.revision);
  fs.copyFileSync(planFile, path.join(out, 'reviewed-plan.json')); receipts.reviewedPlanId = plan.planId;
  command('audit:modernize --apply', ['audit:modernize', '--', '--root', target, '--apply', planFile]);
  command('audit:modernize --apply (repeat)', ['audit:modernize', '--', '--root', target, '--apply', planFile]);
  const preflight = command('check:schema-budget (real seeded DB)', ['check:schema-budget'], target, env).toString(); assert.ok(preflight.includes('columns')); assert.ok(!preflight.includes('not measured'));
  const built = command('npm run build (after)', ['build'], target, env).toString(); assert.ok(built.includes('Synthetic existing prebuild hook preserved'));
  await launch(false); const afterEvidence = await observations('after', editor, anonymous); await stop();
  diagnose('after', afterEvidence, await snapshotAt('after'));
  const beforeBundle = JSON.parse(fs.readFileSync(beforeEvidence)), afterBundle = JSON.parse(fs.readFileSync(afterEvidence));
  assert.deepEqual(beforeBundle.captures.map(fact => fact.screenshot.sha256), afterBundle.captures.map(fact => fact.screenshot.sha256), 'Package hook must not change route pixels');
  receipts.identicalBeforeAfterCaptures = beforeBundle.captures.length;
  command('audit:modernize --rollback', ['audit:modernize', '--', '--root', target, '--rollback', planFile]);
  command('audit:modernize --rollback (repeat)', ['audit:modernize', '--', '--root', target, '--rollback', planFile]);
  assert.ok(fs.readFileSync(path.join(target, 'package.json')).equals(original)); assert.deepEqual(evidenceBinding(target), baselineBinding); assert.equal(gitRead(target, 'status', '--porcelain'), '');
  receipts.rollback = { byteExactPackage: true, packageSHA256: sha256(original), sourceInventoryRestored: true, cleanFeatureBranch: true };
  receipts.status = 'passed';
} catch (error) {
  receipts.status = 'failed';
  const logs = path.join(root, '.emdash/runtime-logs'); fs.mkdirSync(logs, { recursive: true });
  fs.writeFileSync(path.join(logs, 'phase4-pilot.log'), serverLogs.join(''));
  throw error;
} finally {
  await browser?.close(); await stop();
  // Remove the dependency junction before deleting only the owned scratch tree.
  const junction = path.join(target, 'node_modules'); if (fs.existsSync(junction)) { assert.ok(fs.lstatSync(junction).isSymbolicLink()); fs.unlinkSync(junction); }
  assert.equal(path.dirname(scratch), scratchParent); assert.ok(path.basename(scratch).startsWith('site-pilot-'));
  fs.rmSync(scratch, { recursive: true, force: true });
  receipts.cleanup = { serverStopped: true, dependencyJunctionRemoved: true, disposableRepositoriesRemoved: true, privateDatabaseRemoved: true };
  receipts.serverLogSHA256 = sha256(serverLogs.join(''));
  fs.writeFileSync(path.join(out, 'verification.json'), JSON.stringify(receipts, null, 2) + '\n');
}
console.log('Synthetic Phase 4 pilot passed; no client or production resource modified.');
