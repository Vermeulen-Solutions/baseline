import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { acquireAssetArchiveLock, recoverAssetArchiveLock, retainBuildAssets } from '../scripts/retain-build-assets.mjs';

async function temporary(run) {
  const root = await mkdtemp(join(tmpdir(), 'baseline-retention-'));
  try { await run(root); }
  finally {
    assert.equal(dirname(root), resolve(tmpdir()));
    assert.ok(root.includes('baseline-retention-'));
    await rm(root, { recursive: true, force: true });
  }
}

test('archive locking rejects concurrent work and cannot recover a live owner', () => temporary(async root => {
  const archive = join(root, 'archive'), assets = join(root, 'assets');
  await mkdir(archive); await mkdir(assets); await writeFile(join(assets, 'Current.js'), 'current');
  const lock = await acquireAssetArchiveLock(archive);
  try {
    await assert.rejects(retainBuildAssets(assets, archive), /locked/);
    await assert.rejects(recoverAssetArchiveLock(archive, 'wrong-token'), /token/);
    await assert.rejects(recoverAssetArchiveLock(archive, lock.token), /still running/);
    assert.deepEqual(await readdir(assets), ['Current.js']);
  } finally { await lock.release(); }
  assert.equal((await retainBuildAssets(assets, archive)).current, 1);
  await assert.rejects(readFile(join(archive, '.retention.lock')), { code: 'ENOENT' });
}));

test('an abruptly killed job leaves staging quarantined and can be recovered before a clean deployment', () => temporary(async root => {
  const archive = join(root, 'archive'); await mkdir(archive);
  const source = `
    import { mkdir, writeFile } from 'node:fs/promises';
    import { join } from 'node:path';
    import { randomUUID } from 'node:crypto';
    import { acquireAssetArchiveLock } from ${JSON.stringify(pathToFileURL(resolve('scripts/retain-build-assets.mjs')).href)};
    const lock = await acquireAssetArchiveLock(${JSON.stringify(archive)});
    const stage = join(${JSON.stringify(archive)}, '.pending-' + randomUUID());
    await mkdir(join(stage, '_astro'), {recursive:true});
    await writeFile(join(stage, '_astro', 'Incomplete.js'), 'incomplete');
    process.stdout.write(lock.token + '\\n', () => process.kill(process.pid, 'SIGKILL'));
  `;
  const child = spawn(process.execPath, ['--input-type=module', '-e', source], { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '', error = '';
  child.stdout.on('data', bytes => output += bytes); child.stderr.on('data', bytes => error += bytes);
  await new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  assert.equal(error, ''); const token = output.trim(); assert.match(token, /^[0-9a-f-]{36}$/);
  const assets = join(root, 'fresh'); await mkdir(assets); await writeFile(join(assets, 'Fresh.js'), 'fresh');
  await assert.rejects(retainBuildAssets(assets, archive), /locked/);
  await recoverAssetArchiveLock(archive, token);
  const result = await retainBuildAssets(assets, archive);
  assert.equal(result.interrupted.length, 1);
  await assert.rejects(readFile(join(assets, 'Incomplete.js')), { code: 'ENOENT' });
  assert.ok((await readdir(result.release)).includes('manifest.json'));
  assert.deepEqual((await readdir(join(result.release, '_astro'))), ['Fresh.js']);
}));

test('repeat/incomplete output cannot refresh inherited asset lifetimes; validation errors release locks', () => temporary(async root => {
  const archive = join(root, 'archive'), assets = join(root, 'assets');
  await mkdir(assets); await writeFile(join(assets, 'Current.js'), 'current');
  await retainBuildAssets(assets, archive);
  await assert.rejects(retainBuildAssets(assets, archive), /Rebuild cleanly/);
  const receipt = join(assets, '.baseline-retention.json');
  await writeFile(receipt, JSON.stringify({ version: 1, state: 'merging' }));
  await assert.rejects(retainBuildAssets(assets, archive), /interrupted/);
  await assert.rejects(readFile(join(archive, '.retention.lock')), { code: 'ENOENT' });
}));

test('nested real build assets retain exact paths and bytes', () => temporary(async root => {
  const archive = join(root, 'archive'), first = join(root, 'first'), next = join(root, 'next');
  await mkdir(join(first, 'chunks', 'nested'), { recursive: true });
  await writeFile(join(first, 'chunks', 'nested', 'CaseHash.js'), 'nested original');
  const now = Date.now();
  await retainBuildAssets(first, archive, now);
  await mkdir(next); await writeFile(join(next, 'New.js'), 'new');
  await retainBuildAssets(next, archive, now + 1000);
  assert.equal(await readFile(join(next, 'chunks', 'nested', 'CaseHash.js'), 'utf8'), 'nested original');
}));
