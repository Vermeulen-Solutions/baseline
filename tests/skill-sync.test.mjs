import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { sources, inventory, hash, review, stageSync, applySync, recoverSync } from '../scripts/skill-sync.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('skill staging detects same-commit drift, extras and missing skills; failed apply restores originals', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'emdash-sync-test-'));
  try {
    const config = sources.emdash, files = {};
    for (const name of config.skills) {
      files[name + '/SKILL.md'] = { bytes: Buffer.from('# upstream\n'), mode: '100644' };
      await fs.mkdir(path.join(root, '.agents', 'skills', name), { recursive: true });
      await fs.writeFile(path.join(root, '.agents', 'skills', name, 'SKILL.md'), '# upstream\r\n');
    }
    const original = await inventory(path.join(root, '.agents', 'skills'), config.skills);
    await fs.mkdir(path.join(root, '.emdash'));
    const candidate = { commitSha: 'a'.repeat(40), files };
    await fs.writeFile(path.join(root, '.emdash', config.manifest), JSON.stringify({ commitSha: candidate.commitSha, files: original }));
    assert.equal((await review(root, config, candidate)).status, 'current');
    await fs.writeFile(path.join(root, '.agents', 'skills', config.skills[0], 'SKILL.md'), '# local policy\n');
    await fs.writeFile(path.join(root, '.agents', 'skills', config.skills[1], 'extra.md'), 'local addition');
    await fs.unlink(path.join(root, '.agents', 'skills', config.skills[2], 'SKILL.md'));
    const before = await inventory(path.join(root, '.agents', 'skills'), config.skills);
    const report = await review(root, config, candidate);
    assert.equal(report.status, 'local-drift'); assert.equal(report.conflicts.length, 3);
    const id = await stageSync(root, 'emdash', config, candidate, report);
    await assert.rejects(applySync(root, 'emdash', id), /reviewed exact-path/);
    assert.deepEqual(await inventory(path.join(root, '.agents', 'skills'), config.skills), before);
    const resolution = { reviewSha256: hash(await fs.readFile(path.join(root, '.emdash', 'skill-sync', id, 'review.json'))), replacePaths: report.conflicts };
    await assert.rejects(applySync(root, 'emdash', id, resolution, { afterBackup(skill) { if (skill === config.skills[1]) throw Error('simulated interruption'); } }), /simulated interruption/);
    assert.deepEqual(await inventory(path.join(root, '.agents', 'skills'), config.skills), before);
    const nextId = await stageSync(root, 'emdash', config, candidate, report);
    resolution.reviewSha256 = hash(await fs.readFile(path.join(root, '.emdash', 'skill-sync', nextId, 'review.json')));
    await applySync(root, 'emdash', nextId, resolution);
    assert.deepEqual(await inventory(path.join(root, '.agents', 'skills'), config.skills), original);
    assert.equal(await fs.readFile(path.join(root, '.emdash', 'skill-sync', nextId, 'backup', config.skills[1], 'extra.md'), 'utf8'), 'local addition');
    assert.equal((await review(root, config, candidate)).status, 'current');
  } finally { assert.equal(path.dirname(root), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('emdash-sync-test-')); await fs.rm(root, { recursive: true, force: true }); }
});

test('a killed skill apply leaves a recoverable journal and binary corruption is detected', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'emdash-sync-test-'));
  try {
    const config = sources.emdash;
    for (const skill of config.skills) { await fs.mkdir(path.join(root, '.agents', 'skills', skill), { recursive: true }); await fs.writeFile(path.join(root, '.agents', 'skills', skill, 'SKILL.md'), 'old'); }
    await fs.writeFile(path.join(root, '.agents', 'skills', config.skills[0], 'binary'), Buffer.from([0xff]));
    const before = await inventory(path.join(root, '.agents', 'skills'), config.skills);
    await fs.writeFile(path.join(root, '.agents', 'skills', config.skills[0], 'binary'), Buffer.from([0xfe]));
    assert.notEqual((await inventory(path.join(root, '.agents', 'skills'), config.skills))[config.skills[0] + '/binary'], before[config.skills[0] + '/binary']);
    await fs.writeFile(path.join(root, '.agents', 'skills', config.skills[0], 'binary'), Buffer.from([0xff]));
    const candidate = { commitSha: 'c'.repeat(40), files: Object.fromEntries(config.skills.map(skill => [skill + '/SKILL.md', { bytes: Buffer.from('new'), mode: '100644' }])) };
    const report = await review(root, config, candidate), id = await stageSync(root, 'emdash', config, candidate, report);
    const resolution = { reviewSha256: hash(await fs.readFile(path.join(root, '.emdash', 'skill-sync', id, 'review.json'))), replacePaths: report.conflicts };
    const code = `import {applySync} from ${JSON.stringify(new URL('../scripts/skill-sync.mjs', import.meta.url).href)}; await applySync(process.argv[1], 'emdash', process.argv[2], JSON.parse(process.argv[3]), {afterBackup(skill){if(skill==='creating-plugins')process.exit(99)}});`;
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', code, root, id, JSON.stringify(resolution)], { encoding: 'utf8' });
    assert.equal(child.status, 99, child.stderr);
    // This test owns the exited child and its entire temporary workspace.
    await fs.unlink(path.join(root, '.emdash', 'skill-sync.lock'));
    await recoverSync(root, 'emdash', id);
    assert.deepEqual(await inventory(path.join(root, '.agents', 'skills'), config.skills), before);
  } finally { assert.equal(path.dirname(root), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('emdash-sync-test-')); await fs.rm(root, { recursive: true, force: true }); }
});

test('skill apply refuses post-review edits and symlinks; managed distribution includes content modeling', async () => {
  assert.equal(sources.site.repository, 'Vermeulen-Solutions/baseline');
  assert.ok(sources.site.skills.includes('emdash-content-modeling'));
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'emdash-sync-test-'));
  try {
    const config = sources.emdash;
    await fs.mkdir(path.join(root, '.agents', 'skills'), { recursive: true });
    const candidate = { commitSha: 'b'.repeat(40), files: Object.fromEntries(config.skills.map(name => [name + '/SKILL.md', { bytes: Buffer.from('new'), mode: '100644' }])) };
    const report = await review(root, config, candidate), id = await stageSync(root, 'emdash', config, candidate, report);
    await fs.mkdir(path.join(root, '.agents', 'skills', config.skills[0]));
    await fs.writeFile(path.join(root, '.agents', 'skills', config.skills[0], 'SKILL.md'), 'new local work');
    await assert.rejects(applySync(root, 'emdash', id), /changed since review/);
    await fs.symlink(path.join(root, '.agents', 'skills'), path.join(root, '.agents', 'skills', 'link'), process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(inventory(path.join(root, '.agents', 'skills'), ['link']), /Symlinks/);
    await fs.unlink(path.join(root, '.agents', 'skills', 'link'));
  } finally { assert.equal(path.dirname(root), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('emdash-sync-test-')); await fs.rm(root, { recursive: true, force: true }); }
});
