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

test('added Penpot and OpenPencil membership stages without replacing existing local site guidance', async () => {
  assert.ok(sources.site.skills.includes('penpot-site-design'));
  assert.ok(sources.site.skills.includes('openpencil-site-design'));
  assert.ok(sources.site.skills.includes('opendesign-site-design'));
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'emdash-sync-test-'));
  try {
    const config = sources.site;
    const existing = '.agents/skills/site-art-direction/SKILL.md';
    await fs.mkdir(path.dirname(path.join(root, existing)), { recursive: true });
    await fs.writeFile(path.join(root, existing), '# Locally calibrated direction\n');
    const before = await inventory(path.join(root, '.agents', 'skills'), config.skills);
    const files = Object.fromEntries(config.skills.map(name => [name + '/SKILL.md', { bytes: Buffer.from('# Incoming\n'), mode: '100644' }]));
    files['penpot-site-design/assets/design-handoff.md'] = { bytes: Buffer.from('# Portable handoff\n'), mode: '100644' };
    files['openpencil-site-design/references/connection-and-api.md'] = { bytes: Buffer.from('# OpenPencil API\n'), mode: '100644' };
    const candidate = { commitSha: 'c'.repeat(40), files };
    const report = await review(root, config, candidate);
    assert.deepEqual(report.conflicts, ['site-art-direction/SKILL.md']);
    const id = await stageSync(root, 'site', config, candidate, report);
    assert.deepEqual(await inventory(path.join(root, '.agents', 'skills'), config.skills), before);
    assert.equal(await fs.readFile(path.join(root, '.emdash/skill-sync', id, 'incoming/penpot-site-design/assets/design-handoff.md'), 'utf8'), '# Portable handoff\n');
    assert.equal(await fs.readFile(path.join(root, '.emdash/skill-sync', id, 'incoming/openpencil-site-design/references/connection-and-api.md'), 'utf8'), '# OpenPencil API\n');
    await assert.rejects(applySync(root, 'site', id), /conflict|resolution/i);
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

test('a locked skill directory is retried, then rolled back with a clear cause, and the same stage applies afterwards', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'emdash-sync-test-'));
  try {
    const config = sources.emdash, files = {};
    for (const name of config.skills) {
      files[name + '/SKILL.md'] = { bytes: Buffer.from('# upstream v2\n'), mode: '100644' };
      await fs.mkdir(path.join(root, '.agents', 'skills', name), { recursive: true });
      await fs.writeFile(path.join(root, '.agents', 'skills', name, 'SKILL.md'), '# upstream v1\n');
    }
    await fs.mkdir(path.join(root, '.emdash'));
    const before = await inventory(path.join(root, '.agents', 'skills'), config.skills);
    await fs.writeFile(path.join(root, '.emdash', config.manifest), JSON.stringify({ commitSha: 'd'.repeat(40), files: before }));
    const candidate = { commitSha: 'e'.repeat(40), files };
    const report = await review(root, config, candidate);
    assert.deepEqual(report.conflicts, []);
    const id = await stageSync(root, 'emdash', config, candidate, report);
    const locked = () => Object.assign(Error('EPERM: operation not permitted, rename'), { code: 'EPERM' });

    // A lock that never clears (a running dev server watching the directory).
    let attempts = 0;
    const persistent = { rename: async (from, to) => { if (from.endsWith(config.skills[1]) && !from.includes('incoming')) { attempts++; throw locked(); } return fs.rename(from, to); } };
    await assert.rejects(applySync(root, 'emdash', id, null, persistent), error => error.code === 'EPERM' && /running dev server/.test(error.message) && error.message.includes(`--apply ${id}`));
    assert.equal(attempts, 5, 'retried before giving up');
    assert.deepEqual(await inventory(path.join(root, '.agents', 'skills'), config.skills), before, 'every change rolled back');
    assert.equal(JSON.parse(await fs.readFile(path.join(root, '.emdash', 'skill-sync', id, 'journal.json'), 'utf8')).state, 'rolled-back');

    // A transient lock clears after one retry; the same stage now applies without restaging.
    let failedOnce = false;
    const transient = { rename: async (from, to) => { if (!failedOnce && from.endsWith(config.skills[0]) && !from.includes('incoming')) { failedOnce = true; throw locked(); } return fs.rename(from, to); } };
    assert.equal((await applySync(root, 'emdash', id, null, transient)).status, 'applied');
    assert.equal(failedOnce, true);
    assert.equal((await review(root, config, candidate)).status, 'current');
    await assert.rejects(applySync(root, 'emdash', id), /already applied/);
  } finally { assert.equal(path.dirname(root), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('emdash-sync-test-')); await fs.rm(root, { recursive: true, force: true }); }
});

test('stage reports upstream skills not installed, --add-skill stages one, membership persists and helper drift is reported', async () => {
  const { runSync, memberSkills } = await import('../scripts/skill-sync.mjs');
  const { createHash } = await import('node:crypto');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'emdash-sync-test-'));
  try {
    const sha = 'd'.repeat(40), blob = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    const upstreamHelper = Buffer.from('// upstream helper\n');
    const files = Object.fromEntries([...sources.site.skills, 'demo-extra-skill'].map(name => [`.agents/skills/${name}/SKILL.md`, Buffer.from(`# ${name}\n`)]));
    files['scripts/skill-sync.mjs'] = upstreamHelper;
    const tree = [...[...sources.site.skills, 'demo-extra-skill', 'building-emdash-site'].map(name => ({ path: `.agents/skills/${name}`, type: 'tree' })),
      ...Object.entries(files).map(([p, bytes]) => ({ path: p, type: 'blob', mode: '100644', sha: blob(bytes) }))];
    const request = async url => {
      if (url.includes('/commits/')) return new Response(JSON.stringify({ sha }));
      if (url.includes('/git/trees/')) return new Response(JSON.stringify({ tree, truncated: false }));
      const p = url.split(`/${sha}/`)[1];
      return files[p] ? new Response(files[p]) : new Response('missing', { status: 404 });
    };
    await fs.mkdir(path.join(root, 'scripts'), { recursive: true });
    await fs.mkdir(path.join(root, '.agents', 'skills'), { recursive: true });
    await fs.writeFile(path.join(root, 'scripts', 'skill-sync.mjs'), '// older local helper\r\n');
    const check = await runSync(root, 'site', ['--check', '--ref', sha], request);
    assert.deepEqual(check.notInstalled, ['demo-extra-skill'], 'mirrored EmDash skills are not offered as site skills');
    assert.equal(check.helper.status, 'differs');
    await assert.rejects(runSync(root, 'site', ['--stage', '--stage'], request), /repeated option/);
    await assert.rejects(runSync(root, 'site', ['--apply', 'x', '--add-skill', 'demo-extra-skill'], request), /only valid with --stage/);
    await assert.rejects(runSync(root, 'site', ['--stage', '--add-skill', '../escape'], request), /Invalid skill name/);
    const staged = await runSync(root, 'site', ['--stage', '--ref', sha, '--add-skill', 'demo-extra-skill'], request);
    assert.deepEqual(staged.added, ['demo-extra-skill']);
    await applySync(root, 'site', staged.stageId);
    assert.equal(await fs.readFile(path.join(root, '.agents', 'skills', 'demo-extra-skill', 'SKILL.md'), 'utf8'), '# demo-extra-skill\n');
    assert.ok((await memberSkills(root, 'site')).includes('demo-extra-skill'), 'added skill stays managed for later syncs');
    await fs.writeFile(path.join(root, 'scripts', 'skill-sync.mjs'), upstreamHelper.toString().replace('\n', '\r\n'));
    const again = await runSync(root, 'site', ['--check', '--ref', sha], request);
    assert.equal(again.status, 'current'); assert.equal(again.helper.status, 'current', 'CRLF checkout of the same helper counts as current');
    assert.equal(again.notInstalled, undefined);
  } finally { assert.ok(path.basename(root).startsWith('emdash-sync-test-')); await fs.rm(root, { recursive: true, force: true }); }
});
