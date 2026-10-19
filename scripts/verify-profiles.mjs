import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { initProfile } from './init-profile.mjs';
import { spawnNpmSync } from './process-runner.mjs';

const source = fileURLToPath(new URL('../', import.meta.url));
const option = name => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1]; };
const profiles = option('--profile') ? [option('--profile')] : ['static', 'static-sveltia'];
const publicBrowser = process.argv.includes('--public-browser');
if (publicBrowser && (process.env.CI || process.env.GITHUB_ACTIONS === 'true')) throw new Error('Browser verification is local-only; CI may run HTTP checks only');
if (profiles.some(p => !['static', 'static-sveltia'].includes(p))) throw new Error('Unknown static profile');
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'baseline-profile-verification-'));
const receipts = [];
const fixtureSite = 'https://static-profile.example.test';
try {
  for (const profile of profiles) {
    const root = path.join(temporary, profile);
    await initProfile({ profile, out: root });
    // Explicit content fixture only inside this owned generated project. Never a source-template entry.
    const draftPath = 'src/content/posts/metadata-draft.md';
    const draft = '---\ntitle: PRIVATE METADATA DRAFT\ndescription: Must not be published\npublishedAt: 2026-01-01\ndraft: true\n---\nPrivate synthetic draft.\n';
    await fs.writeFile(path.join(root, draftPath), draft);
    const gatePath = path.join(root, 'audit/design-gate-exceptions.json');
    const gate = JSON.parse(await fs.readFile(gatePath, 'utf8'));
    gate.push({ path: draftPath, reason: 'Exact synthetic publication-filter fixture in the owned generated verification project only; no client visual implementation.', sha256: createHash('sha256').update(draft).digest('hex') });
    await fs.writeFile(gatePath, JSON.stringify(gate, null, 2) + '\n');
    for (const args of [['install', '--no-audit', '--no-fund'], ['ci', '--no-audit', '--no-fund'], ['run', 'verify'], ['run', 'build'], ['run', 'check:dev-tools'], ['run', 'fixtures:build']]) {
      console.log(`[${profile}] npm ${args.join(' ')}`);
      const result = spawnNpmSync(args, { cwd: root, stdio: 'inherit', timeout: 300000, env: { ...process.env, SITE_URL: fixtureSite } });
      if (result.error) throw result.error;
      assert.equal(result.status, 0, `${profile}: npm ${args.join(' ')}`);
    }
    const lock = JSON.parse(await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'));
    assert.ok(!Object.keys(lock.packages).some(name => /(?:^|\/)(?:@emdash-cms|emdash|[^/]*sqlite[^/]*|libsql|@libsql)(?:\/|$)/i.test(name)), 'CMS/database package in independent lockfile');
    assert.equal((await fs.lstat(path.join(root, 'node_modules'))).isSymbolicLink(), false);
    for (const relative of ['dist/server', 'data.db', 'seed', '.agents/skills/building-emdash-site']) await assert.rejects(fs.stat(path.join(root, relative)), { code: 'ENOENT' });
    if (profile === 'static-sveltia') {
      for (const relative of ['admin/index.html', 'admin/config.yml']) assert.deepEqual(await fs.readFile(path.join(root, 'dist', relative)), await fs.readFile(path.join(root, 'public', relative)));
    } else await assert.rejects(fs.stat(path.join(root, 'dist/admin')), { code: 'ENOENT' });
    const result = spawnSync(process.execPath, ['tests/static-pilot.integration.mjs', '--root', root, '--site-url', fixtureSite, ...(publicBrowser ? ['--public-browser'] : [])], { cwd: source, stdio: 'inherit', timeout: publicBrowser ? 240000 : 120000 });
    assert.equal(result.status, 0, 'Generated profile HTTP integration');
    receipts.push({ profile, root, independentInstall: true, cleanInstall: true, databasePackages: 0, verify: 'passed', production: 'passed', fixtures: 'passed', http: 'passed', ...(publicBrowser && { publicBrowser: 'passed' }) });
  }
  console.log(JSON.stringify(receipts, null, 2));
} finally {
  if (process.argv.includes('--keep')) console.log('Retained verification directory: ' + temporary);
  else {
    assert.equal(path.dirname(temporary), path.resolve(os.tmpdir()));
    assert.ok(path.basename(temporary).startsWith('baseline-profile-verification-'));
    await fs.rm(temporary, { recursive: true, force: true });
  }
}
