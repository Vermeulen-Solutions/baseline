import { cp, copyFile, mkdir, mkdtemp, readFile, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { assertReleaseArtifact } from '../../scripts/assert-release-artifact.mjs';
import { visualContract } from './contract.mjs';

export async function startVisualSite(root, reportDir, { signal, onDevReady, devOnly = false } = {}) {
  const stage = await mkdtemp(path.join(tmpdir(), 'emdash-visual-'));
  let child, cleaned = false, cancelled = false;
  const logs = [];
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA)$/i.test(key)));
  const socket = createServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
  const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  Object.assign(env, { HOST: '127.0.0.1', PORT: String(port), TZ: 'UTC', EMDASH_ENCRYPTION_KEY: 'emdash_enc_v1_' + randomBytes(32).toString('base64url') });
  const clock = pathToFileURL(path.join(root, 'tests/visual/fixed-clock.mjs')).href;
  const onSignal = () => { cancelled = true; child?.kill(); };
  process.once('SIGINT', onSignal); process.once('SIGTERM', onSignal);
  signal?.addEventListener('abort', onSignal, { once: true });
  const request = (url, options = {}) => fetch(origin + url, { ...options, signal: AbortSignal.timeout(30000) });
  async function stop() {
    if (child && child.exitCode === null && child.signalCode === null) {
      const target = child, done = once(target, 'exit');
      const kill = setTimeout(() => target.kill('SIGKILL'), 5000); kill.unref(); target.kill();
      try { await done; } finally { clearTimeout(kill); }
    }
    child = undefined;
  }
  function launch(args, extra = {}) {
    if (cancelled) throw new Error('Visual bootstrap cancelled');
    assert.ok(!child, 'Stop the owned child before starting another');
    child = spawn(process.execPath, args, { cwd: stage, env: { ...env, ...extra }, stdio: ['ignore', 'pipe', 'pipe'] });
    for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { logs.push(String(data)); if (logs.length > 300) logs.shift(); });
    return child;
  }
  async function ready(marker) {
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      if (cancelled) throw new Error('Visual bootstrap cancelled');
      if (child.exitCode !== null) throw new Error('Owned server exited: ' + logs.slice(-10).join(''));
      try { const r = await request('/_styleguide'); if (r.status === 200 && (await r.text()).includes(marker)) return; } catch {}
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error('Visual server readiness timed out');
  }
  async function build(fixtures) {
    const target = launch(['node_modules/astro/bin/astro.mjs', 'build'], fixtures ? { ASTRO_TEST_FIXTURES: '1' } : {});
    const timeout = setTimeout(() => target.kill('SIGKILL'), 180000); timeout.unref();
    try { const [code] = await once(target, 'exit'); assert.equal(code, 0, logs.slice(-15).join('')); } finally { clearTimeout(timeout); child = undefined; }
  }
  async function cleanup() {
    if (cleaned) return; cleaned = true;
    process.removeListener('SIGINT', onSignal); process.removeListener('SIGTERM', onSignal);
    signal?.removeEventListener('abort', onSignal);
    await stop();
    await mkdir(reportDir, { recursive: true });
    await writeFile(path.join(reportDir, 'server.log'), logs.join(''));
    assert.equal(path.dirname(stage), path.resolve(tmpdir()));
    assert.ok(path.basename(stage).startsWith('emdash-visual-'));
    try { await unlink(path.join(stage, 'node_modules')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await rm(stage, { recursive: true, force: true });
    await writeFile(path.join(reportDir, 'cleanup.json'), JSON.stringify({ serverStopped: true, dependencyJunctionUnlinked: true, temporaryTreeRemoved: true, workingDatabaseCopied: false }) + '\n');
  }
  try {
    for (const name of ['src', 'public', 'seed']) {
      try { await cp(path.join(root, name), path.join(stage, name), { recursive: true }); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    for (const name of ['astro.config.mjs', 'package.json', 'tsconfig.json']) await copyFile(path.join(root, name), path.join(stage, name));
    await mkdir(path.join(stage, 'scripts'), { recursive: true });
    await copyFile(path.join(root, 'scripts/dev-tools-integration.mjs'), path.join(stage, 'scripts/dev-tools-integration.mjs'));
    await copyFile(path.join(root, 'scripts/dev-tools-middleware.mjs'), path.join(stage, 'scripts/dev-tools-middleware.mjs'));
    await symlink(path.join(root, 'node_modules'), path.join(stage, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    // Seed is the checked-in public starter fixture; supported dev setup applies its sample content.
    launch(['--import', clock, 'node_modules/astro/bin/astro.mjs', 'dev', '--host', '127.0.0.1', '--port', String(port)]);
    await ready('data-styleguide-ready');
    await onDevReady?.();
    if (cancelled) throw new Error('Visual bootstrap cancelled');
    assert.equal((await request('/_emdash/api/setup/dev-bypass?redirect=/_emdash/admin')).status, 200);
    assert.ok((await (await request('/posts/welcome')).text()).includes('What to do next'));
    if (devOnly) {
      await mkdir(reportDir, { recursive: true });
      await writeFile(path.join(reportDir, 'bootstrap.json'), JSON.stringify({ devOnly: true, freshSeed: true, workingDatabaseCopied: false, loopback: true }) + '\n');
      return { origin, cleanup };
    }
    await stop();
    await build(false);
    await assertReleaseArtifact(path.join(stage, 'dist'));
    launch(['--import', clock, 'dist/server/entry.mjs'], { NODE_ENV: 'production', ASTRO_TEST_FIXTURES: '1' });
    let normalReady = false;
    const normalDeadline = Date.now() + 90000;
    while (Date.now() < normalDeadline) {
      if (cancelled) throw new Error('Visual bootstrap cancelled');
      if (child.exitCode !== null) throw new Error('Normal server exited before public readiness');
      try { const r = await request('/'); if (r.status === 200 && (await r.text()).includes('Welcome')) { normalReady = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.ok(normalReady, 'Clean built public content must be healthy');
    for (const method of ['GET', 'HEAD']) assert.equal((await request('/_styleguide?fixtures=1', { method, headers: { cookie: 'fixtures=1' } })).status, 404);
    await stop();
    await build(true);
    await assert.rejects(assertReleaseArtifact(path.join(stage, 'dist-fixtures')), /Refusing fixture-enabled/);
    launch(['--import', clock, 'dist-fixtures/server/entry.mjs'], { NODE_ENV: 'production' });
    await ready('data-fixture-version="2"');
    await mkdir(reportDir, { recursive: true });
    await writeFile(path.join(reportDir, 'bootstrap.json'), JSON.stringify({ isolation: 'Owned temporary source + fresh DB; no working DB/media/env/credentials copied', fixtureVersion: visualContract.fixtureVersion, seed: 'seed/seed.json via supported dev setup', date: visualContract.date, normalStyleguide: 404, fixtureStyleguide: 200, fixtureReleaseRejected: true }, null, 2) + '\n');
    return { origin, cleanup };
  } catch (error) { await cleanup(); throw error; }
}
