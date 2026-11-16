import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fleetStatus, loadFleet, markdownStatus, repositoryName } from '../scripts/fleet-status.mjs';
import { STANDARD } from '../scripts/audit-site.mjs';

// Portable: throwaway site folders and one throwaway Git repository; no network.
const certified = JSON.parse(readFileSync(new URL(`../standards/baselines/${STANDARD.version}.json`, import.meta.url), 'utf8')).runtimeProfiles['node-sqlite'];
const put = (root, file, value) => { mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); writeFileSync(path.join(root, file), typeof value === 'string' ? value : JSON.stringify(value)); };

test('fleet status classifies sites, reads locked versions and compares Baseline sites with the pinned standards', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'fleet-status-'));
  try {
    // A current Baseline-copy Workers site, built from the pinned baseline itself.
    const current = path.join(dir, 'sites/current-site');
    put(current, 'scripts/check-art-direction.mjs', '');
    put(current, 'wrangler.jsonc', '{}');
    put(current, 'package.json', { engines: { node: certified.nodeEngineRange }, dependencies: { astro: certified.dependencies.astro, emdash: certified.dependencies.emdash, '@emdash-cms/cloudflare': certified.dependencies.emdash } });
    // A generated static site whose lockfile is older than its declared range.
    const old = path.join(dir, 'sites/old-static');
    put(old, 'baseline.config.json', { platformProfile: 'static', source: { commit: 'a'.repeat(40) } });
    put(old, 'package.json', { engines: { node: '^22.0.0' }, dependencies: { astro: '^7.0.0' } });
    put(old, 'package-lock.json', { packages: { 'node_modules/astro': { version: '7.0.1' } } });
    // A non-Baseline site on another host.
    const other = path.join(dir, 'elsewhere/other-site');
    put(other, 'netlify.toml', '');
    put(other, 'package.json', { dependencies: { astro: '^5.7.0' } });
    execFileSync('git', ['-C', current, 'init', '-q']);
    execFileSync('git', ['-C', current, 'add', '-A']);
    execFileSync('git', ['-C', current, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', 'commit', '-q', '-m', 'one']);
    put(current, 'notes.txt', 'unsaved');
    const config = path.join(dir, 'private/fleet.json');
    put(config, '', '');
    writeFileSync(config, JSON.stringify({ sites: [
      { id: 'current-site', path: '../sites/current-site' },
      { id: 'old-static', path: '../sites/old-static' },
      { id: 'other-site', path: '../elsewhere/other-site' },
      { id: 'gone-site', path: '../sites/gone-site' },
    ] }));

    const report = fleetStatus(config);
    const site = id => report.sites.find(s => s.id === id);
    assert.equal(report.standard, STANDARD.version);
    assert.deepEqual([site('current-site').kind, site('current-site').profile, site('current-site').hosting], ['baseline-copy', 'emdash', 'cloudflare']);
    assert.equal(site('current-site').standards.current, true, site('current-site').standards.behind.join('; '));
    assert.deepEqual([site('current-site').git.uncommitted, site('current-site').git.repository], [1, null]);
    assert.deepEqual([site('old-static').kind, site('old-static').profile, site('old-static').versions.astro], ['baseline', 'static', '7.0.1'], 'the locked version wins over the declared range');
    assert.equal(site('old-static').git, null);
    assert.equal(site('old-static').standards.behind.length, 2);
    assert.match(site('old-static').standards.behind.join('; '), new RegExp(`astro 7\\.0\\.1 \\(certified ${certified.dependencies.astro.replaceAll('.', '\\.')}\\).*Node range \\^22\\.0\\.0`));
    assert.deepEqual([site('other-site').kind, site('other-site').hosting, site('other-site').standards], ['other', 'netlify', null]);
    assert.equal(site('gone-site').missing, true);

    const markdown = markdownStatus(report);
    assert.match(markdown, /\| current-site \| Baseline copy \(emdash\) \| cloudflare \| [^|]+ \| [^|]+ \| current \(/);
    assert.match(markdown, /\| current-site \|.*1 uncommitted \|/);
    assert.match(markdown, /\| old-static \| Baseline static \|.*behind: 2 \| not a Git repository \|/);
    assert.match(markdown, /\| other-site \| other \| netlify \| 5\.7\.0 \| - \| n\/a \|/);
    assert.match(markdown, /\| gone-site \| missing \|/);
    assert.match(markdown, /## Behind the standards\n\n- \*\*old-static:\*\* astro 7\.0\.1/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('fleet config is validated before anything is read, and repository URLs are shortened', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'fleet-config-'));
  try {
    const write = value => { const file = path.join(dir, 'fleet.json'); writeFileSync(file, JSON.stringify(value)); return file; };
    assert.throws(() => loadFleet(write({})), /non-empty "sites"/);
    assert.throws(() => loadFleet(write({ sites: [{ id: 'Bad Id', path: 'x' }] })), /lowercase/);
    assert.throws(() => loadFleet(write({ sites: [{ id: 'a', path: 'x' }, { id: 'a', path: 'y' }] })), /duplicate site id: a/);
    assert.throws(() => loadFleet(write({ sites: [{ id: 'a' }] })), /needs a path/);
    assert.equal(loadFleet(write({ sites: [{ id: 'a', path: 'sub/a' }] }))[0].path, path.join(dir, 'sub/a'));
    assert.equal(repositoryName('https://github.com/example-org/example-site.git'), 'example-org/example-site');
    assert.equal(repositoryName('git@github.com:example-org/example-site.git'), 'example-org/example-site');
    assert.equal(repositoryName(null), null);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
