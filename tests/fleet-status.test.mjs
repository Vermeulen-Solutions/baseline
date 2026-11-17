import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { compareWithStandard, fleetStatus, siteStatus, htmlCacheKeyedPerBuild, loadFleet, markdownStatus, repositoryName, versionAtLeast } from '../scripts/fleet-status.mjs';
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
    assert.match(markdown, /\*\*1 of 3 Baseline sites match standards /);
    assert.match(markdown, /\| current-site \| copy \(emdash\) \| cloudflare \| [^|]+ \| [^|]+ \| current \| not pinned \| not pinned \|.*1 uncommitted \|/);
    assert.match(markdown, /\| old-static \| static \|.*\| behind: 2 \|.*\| not a Git repository \|/);
    assert.match(markdown, /## Other projects[\s\S]*\| other-site \| netlify \| 5\.7\.0 \|/);
    assert.match(markdown, /\| gone-site \| missing \|/);
    assert.match(markdown, /### old-static\n\n- astro 7\.0\.1/);
    assert.doesNotMatch(markdown, /### current-site/);

    // With a release that pins its distribution, skills and helpers count too, and a site page is linked.
    put(path.join(dir, "private"), "sites/current-site.md", "# current-site");
    put(current, ".agents/skills/impeccable/SKILL.md", "old");
    const pinned = { ...JSON.parse(readFileSync(new URL(`../standards/baselines/${STANDARD.version}.json`, import.meta.url), "utf8")), distribution: { skills: { impeccable: { files: 1, sha256: "0".repeat(64) } }, optionalSkills: [], emdashOnlySkills: [], tools: {}, impeccable: {} } };
    const [withPins] = loadFleet(config).filter(site => site.id === "current-site").map(site => siteStatus(site, pinned));
    assert.equal(withPins.page, "sites/current-site.md");
    assert.equal(withPins.standards.current, false);
    assert.deepEqual(withPins.standards.distributionBehind, ["skills differ from the release: impeccable"]);
    const pinnedMarkdown = markdownStatus({ ...report, sites: [withPins] });
    assert.match(pinnedMarkdown, /\| \[current-site\]\(sites\/current-site\.md\) \|.*\| current \| 1 differ \| none installed \|/);
    assert.match(pinnedMarkdown, /### current-site\n\n- skills differ from the release: impeccable/);
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

test('Workers rules flag an old Cloudflare adapter on EmDash 1.5 and an HTML cache keyed by URL only', () => {
  const manifest = JSON.parse(readFileSync(new URL(`../standards/baselines/${STANDARD.version}.json`, import.meta.url), 'utf8'));
  const base = { versions: { emdash: '1.5.0', '@emdash-cms/cloudflare': '1.5.0' }, engines: certified.nodeEngineRange };
  const behind = site => compareWithStandard(site, manifest).behind;
  assert.match(behind({ ...base, versions: { ...base.versions, '@astrojs/cloudflare': '14.3.3' } }).join('\n'), /@astrojs\/cloudflare 14\.3\.3 \(EmDash 1\.5\.0\+ on Workers needs 14\.4\.0/);
  assert.equal(behind({ ...base, versions: { ...base.versions, '@astrojs/cloudflare': '14.4.8' } }).some(item => item.startsWith('@astrojs/cloudflare')), false);
  assert.equal(behind({ ...base, versions: { emdash: '1.4.0', '@astrojs/cloudflare': '14.3.3' } }).some(item => item.startsWith('@astrojs/cloudflare')), false, 'EmDash 1.4 sites are not held to the 1.5 rule');
  assert.match(behind({ ...base, htmlCacheKeyedPerBuild: false }).join('\n'), /HTML edge cache keyed by URL only/);
  assert.equal(behind({ ...base, htmlCacheKeyedPerBuild: null }).some(item => item.startsWith('HTML')), false);
  assert.equal(versionAtLeast('14.4.0-beta.1', '14.4.0'), true);
  assert.equal(versionAtLeast('14.10.0', '14.4.0'), true);
  assert.equal(versionAtLeast('13.9.9', '14.4.0'), false);

  const dir = mkdtempSync(path.join(os.tmpdir(), 'fleet-cache-'));
  try {
    assert.equal(htmlCacheKeyedPerBuild(dir), null);
    put(dir, 'src/lib/cloudflare-cache-provider.mjs', "const cacheKey = new Request(url.toString(), { method: 'GET' });");
    assert.equal(htmlCacheKeyedPerBuild(dir), false);
    put(dir, 'src/lib/cloudflare-cache-provider.mjs', "const BUILD_ID = typeof __SITE_BUILD_ID__ !== 'undefined' ? __SITE_BUILD_ID__ : 'dev';");
    assert.equal(htmlCacheKeyedPerBuild(dir), true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
