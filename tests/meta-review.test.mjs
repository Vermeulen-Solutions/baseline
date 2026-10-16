import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { collectUpdates } from '../scripts/check-upstream-updates.mjs';
import { registerSite, validateSite } from '../scripts/register-site.mjs';

test('Astro and adapter updates surface independently of unchanged EmDash; outages remain unverified and read-only', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'emdash-meta-test-'));
  try {
    await fs.writeFile(path.join(root, 'package.json'), JSON.stringify({ dependencies: { astro: '^7.3.2', emdash: '1.3.0', '@astrojs/node': '^11.1.6' } }));
    await fs.writeFile(path.join(root, 'package-lock.json'), JSON.stringify({ packages: { 'node_modules/astro': { version: '7.3.5' }, 'node_modules/emdash': { version: '1.3.0' }, 'node_modules/@astrojs/node': { version: '11.1.6' } } }));
    const files = await fs.readdir(root);
    const lookup = { package: async name => { const latest = { astro: '7.4.0', emdash: '1.3.0', '@astrojs/node': '11.1.8' }[name]; return { 'dist-tags': { latest }, versions: Object.fromEntries([latest, name === 'astro' ? '7.3.7' : latest].map(v => [v, {}])) }; }, skill: async () => { throw Error('offline'); }, node: async () => { throw Error('offline'); } };
    const report = await collectUpdates(root, lookup);
    assert.equal(report.packages.find(p => p.name === 'astro').upstreamStatus, 'update-available');
    assert.equal(report.packages.find(p => p.name === 'astro').availablePatch, '7.3.7');
    assert.equal(report.packages.find(p => p.name === 'emdash').upstreamStatus, 'current');
    assert.equal(report.packages.find(p => p.name === '@astrojs/node').upstreamStatus, 'update-available');
    assert.equal(report.node.status, 'unverified'); assert.ok(report.skills.every(s => s.status === 'unverified'));
    const offline = await collectUpdates(root, { ...lookup, package: async () => { throw Error('rate limited'); } });
    assert.ok(offline.packages.every(p => p.upstreamStatus === 'unverified')); assert.deepEqual(await fs.readdir(root), files);
    const refs = await collectUpdates(root, { ...lookup, skill: async () => ({ object: { type: 'commit', sha: 'a'.repeat(40) } }) });
    assert.ok(refs.skills.every(skill => skill.availableCommit === 'a'.repeat(40)));
    const malformed = await collectUpdates(root, { ...lookup, skill: async () => ({ object: { sha: 'main' } }) });
    assert.ok(malformed.skills.every(skill => skill.status === 'unverified'));
  } finally { assert.equal(path.dirname(root), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('emdash-meta-test-')); await fs.rm(root, { recursive: true, force: true }); }
});

test('private site registry is idempotent, preserves rename/archive history and records inaccessible central registration', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'emdash-meta-test-'));
  try {
    execFileSync('git', ['init', '--quiet'], { cwd: root });
    await fs.writeFile(path.join(root, '.gitignore'), '.emdash/\n');
    const site = { siteId: 'test-site', repository: 'https://github.com/example/private-site', starterCommit: 'a'.repeat(40), starterRelease: null, runtimeProfile: 'node-sqlite', ownerTeam: 'test-team', status: 'active', lastAudit: null, standardsVersion: null };
    const registry = path.join(root, '.emdash', 'site-registry.private.json');
    await registerSite(root, site, registry); const before = await fs.readFile(registry, 'utf8');
    await registerSite(root, site, registry); assert.equal(await fs.readFile(registry, 'utf8'), before);
    await registerSite(root, { ...site, repository: 'https://github.com/example/renamed', status: 'archived' }, registry);
    assert.equal(JSON.parse(await fs.readFile(registry, 'utf8')).sites[0].previousRepositories[0], site.repository);
    await assert.rejects(registerSite(root, site, registry), /Archived/);
    await assert.rejects(registerSite(root, site, path.join(root, 'public-registry.json')), /public checkout/);
    assert.throws(() => validateSite({ ...site, email: 'private@example.com' }), /contract fields/);
    const pending = await registerSite(root, site, null); assert.equal(pending.status, 'pending-reviewed-registration');
    assert.equal(JSON.parse(await fs.readFile(pending.destination, 'utf8')).site.siteId, site.siteId);
    execFileSync('git', ['add', '--force', '--', registry], { cwd: root });
    await assert.rejects(registerSite(root, site, registry, { reactivate: true }), /already tracked/);
  } finally { assert.equal(path.dirname(root), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith('emdash-meta-test-')); await fs.rm(root, { recursive: true, force: true }); }
});
