// Real HTTP checks on disposable source/database/media. Never starts the working DB.
import { cp, copyFile, mkdir, mkdtemp, readFile, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { assertReleaseArtifact } from './assert-release-artifact.mjs';

const root = process.cwd();
const stage = await mkdtemp(path.join(tmpdir(), 'emdash-dev-tools-'));
const logs = [];
let child;
async function freePort() {
  const socket = createServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
  const port = socket.address().port; await new Promise(resolve => socket.close(resolve)); return port;
}
const port = await freePort(), origin = `http://127.0.0.1:${port}`;
// Do not inherit CMS/Cloudflare credentials, production origin or user env files.
const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA|CI)$/i.test(name)));
Object.assign(env, { HOST: '127.0.0.1', PORT: String(port), EMDASH_ENCRYPTION_KEY: 'emdash_enc_v1_' + randomBytes(32).toString('base64url') });
async function stop() {
  if (child && child.exitCode === null && child.signalCode === null) {
    const target = child, exited = once(target, 'exit');
    const timer = setTimeout(() => target.kill('SIGKILL'), 5000);
    timer.unref(); target.kill();
    try { await exited; } finally { clearTimeout(timer); }
  }
  child = undefined;
}
function launch(args, extra = {}) {
  child = spawn(process.execPath, args, { cwd: stage, env: { ...env, ...extra }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', data => logs.push(String(data)));
  child.stderr.on('data', data => logs.push(String(data)));
  return child;
}
async function ready() {
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) throw new Error('Server exited: ' + logs.slice(-8).join(''));
    try { const response = await fetch(origin + '/_styleguide'); if ([200, 404].includes(response.status)) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Server readiness timed out.');
}
const report = { dev: {}, production: {}, isolation: 'Fresh temporary root; no working database, media, env file or credentials copied.' };
try {
  for (const name of ['src', 'public', 'seed']) {
    try { await cp(path.join(root, name), path.join(stage, name), { recursive: true }); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  for (const name of ['astro.config.mjs', 'package.json', 'tsconfig.json']) await copyFile(path.join(root, name), path.join(stage, name));
  await mkdir(path.join(stage, 'scripts'), { recursive: true });
  await copyFile(path.join(root, 'scripts', 'dev-tools-integration.mjs'), path.join(stage, 'scripts', 'dev-tools-integration.mjs'));
  await copyFile(path.join(root, 'scripts', 'dev-tools-middleware.mjs'), path.join(stage, 'scripts', 'dev-tools-middleware.mjs'));
  await symlink(path.join(root, 'node_modules'), path.join(stage, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
  launch(['node_modules/astro/bin/astro.mjs', 'dev', '--host', '127.0.0.1', '--port', String(port)]);
  await ready();
  const response = await fetch(origin + '/_styleguide');
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.ok(html.includes('data-styleguide-ready'), 'Expected specimens, not a setup/login response');
  assert.ok(!html.includes('data-emdash-ref='), 'Synthetic fixtures must not pretend to be editable records');
  const imagePaths = [...html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)].map(match => match[1]);
  assert.ok(imagePaths.length >= 5);
  for (const image of new Set(imagePaths)) assert.equal((await fetch(new URL(image, origin))).status, 200, image);
  report.dev = { status: response.status, specimens: true, images: imagePaths.length, fakeEditBindings: false };
  // Complete only this disposable site's supported dev setup so production health
  // cannot accidentally pass on an error/setup response.
  const setup = await fetch(origin + '/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin');
  assert.equal(setup.status, 200, 'Disposable dev setup must succeed');
  assert.ok((await (await fetch(origin + '/')).text()).includes('Welcome'), 'Expected seeded public content');
  await stop();
  const fixtureBuild = launch(['node_modules/astro/bin/astro.mjs', 'build'], { ASTRO_TEST_FIXTURES: '1' });
  const [fixtureCode] = await once(fixtureBuild, 'exit'); child = undefined;
  assert.equal(fixtureCode, 0, logs.slice(-12).join(''));
  await assert.rejects(assertReleaseArtifact(path.join(stage, 'dist-fixtures')), /Refusing fixture-enabled/);
  launch(['dist-fixtures/server/entry.mjs'], { NODE_ENV: 'production' });
  await ready();
  const fixtureResponse = await fetch(origin + '/_styleguide');
  const fixtureHtml = await fixtureResponse.text();
  assert.equal(fixtureResponse.status, 200);
  assert.ok(fixtureHtml.includes('data-fixture-version="2"'));
  assert.equal(fixtureResponse.headers.get('cache-control'), 'no-store');
  const tickerMarkup = [...fixtureHtml.matchAll(/<div[^>]*data-logo-ticker[^>]*>([\s\S]*?)<\/ul>\s*<\/div>\s*<\/div>\s*<\/div>/g)];
  assert.equal(tickerMarkup.length, 2, 'Empty ticker renders nothing');
  for (const [markup] of tickerMarkup) {
    assert.ok(!/<script\b|<astro-island\b|data-emdash-ref=/.test(markup), 'Ticker must add no scripts, islands or fake proxies');
    assert.ok(/aria-hidden="true"[^>]*inert/.test(markup), 'Duplicate track must be hidden and inert');
  }
  for (const image of new Set([...fixtureHtml.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)].map(match => match[1]))) assert.equal((await fetch(new URL(image, origin))).status, 200, image);
  report.fixtures = { status: 200, fixtureVersion: 2, tickerInstances: tickerMarkup.length, emptyTickerOmitted: true, releaseRejected: true, images: 'all successful' };
  await stop();
  const build = launch(['node_modules/astro/bin/astro.mjs', 'build']);
  const [code] = await once(build, 'exit'); child = undefined;
  assert.equal(code, 0, logs.slice(-12).join(''));
  await assertReleaseArtifact(path.join(stage, 'dist'));
  // Runtime flags/cookies/query strings must not activate a production artifact.
  launch(['dist/server/entry.mjs'], { NODE_ENV: 'production', ASTRO_TEST_FIXTURES: '1', DEV: 'true' });
  await ready();
  for (const method of ['GET', 'HEAD']) {
    for (const suffix of ['', '?fixtures=1']) {
      const result = await fetch(origin + '/_styleguide' + suffix, { method, headers: { cookie: 'fixtures=1' } });
      const body = await result.text();
      assert.equal(result.status, 404);
      assert.ok(!body.includes('data-styleguide-ready'));
      report.production[method + suffix] = result.status;
    }
  }
  const publicResponse = await fetch(origin + '/');
  assert.equal(publicResponse.status, 200, 'Built public route must be healthy');
  const index = await publicResponse.text();
  assert.ok(index.includes('Welcome') && index.includes('Recent Posts'), 'Built public content must render, not setup/error markup');
  report.production.publicStatus = publicResponse.status;
  const { readdir } = await import('node:fs/promises');
  const serverOutput = path.join(stage, 'dist', 'server');
  for (const name of await readdir(serverOutput, { recursive: true })) {
    if (!name.endsWith('.mjs')) continue;
    const source = await readFile(path.join(serverOutput, name), 'utf8');
    assert.ok(!/(?:from\s*|import\s*\()\s*["']zod(?:\/[^"']*)?["']/.test(source), `Server chunk relies on hoisted Zod: ${name}`);
  }
  report.production.zodResolution = 'Dependency-local validators bundled; no bare Zod imports in emitted server modules';
  await mkdir(path.join(root, '.emdash', 'checks'), { recursive: true });
  await writeFile(path.join(root, '.emdash', 'checks', 'dev-tools.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('Dev/fixture specimens/assets, fixture release rejection and clean production GET/HEAD isolation passed.');
  if (process.argv.includes('--inspect')) {
    await stop();
    launch(['dist-fixtures/server/entry.mjs'], { NODE_ENV: 'production' }); await ready();
    assert.equal((await fetch(origin + '/_styleguide')).status, 200);
    console.log(`Browser inspection: ${origin}/_styleguide (disposable data). Press Ctrl+C to stop and remove.`);
    await new Promise(resolve => { process.once('SIGINT', resolve); process.once('SIGTERM', resolve); });
  }
} catch (error) { console.error(logs.slice(-14).join('')); throw error; }
finally {
  await stop();
  assert.equal(path.dirname(stage), path.resolve(tmpdir()));
  assert.ok(path.basename(stage).startsWith('emdash-dev-tools-'));
  try { await unlink(path.join(stage, 'node_modules')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await rm(stage, { recursive: true, force: true });
}
