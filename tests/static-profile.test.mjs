import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import devTools from '../scripts/dev-tools-integration.mjs';
import { containedPath, initProfile, planProfile } from '../scripts/init-profile.mjs';
import { onRequest } from '../scripts/dev-tools-middleware.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

test('server release reserves the styleguide path before any CMS catch-all can render it', () => {
  for (const suffix of ['', '/', '?fixtures=1']) {
    const response = onRequest({ url: new URL('https://example.invalid/_styleguide' + suffix) }, () => { throw new Error('CMS catch-all must not execute'); });
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  assert.equal(onRequest({ url: new URL('https://example.invalid/%5fstyleguide/') }, () => new Response('CMS page')).status, 404);
  const response = onRequest({ url: new URL('https://example.invalid/posts/welcome') }, () => new Response('Public content'));
  assert.equal(response.status, 200);
});

test('static developer tools inject only dev/fixture routes, prerender static fixtures and never resolve a CMS version', async () => {
  for (const command of ['dev', 'build', 'preview', 'sync']) {
    for (const fixtures of [false, true]) {
      const routes = [], definitions = [];
      const plugin = devTools({ platform: 'static', fixtures });
      await plugin.hooks['astro:config:setup']({ config: { output: 'static' }, command, injectRoute: route => routes.push(route), injectScript: () => {}, updateConfig: config => definitions.push(config.vite.define) });
      assert.equal(routes.length, command === 'dev' || (command === 'build' && fixtures) ? 1 : 0);
      if (routes.length) { assert.equal(routes[0].pattern, '/_styleguide'); assert.equal(routes[0].prerender, true); }
      assert.ok(!Object.hasOwn(definitions[0], 'import.meta.env.STARTER_EMDASH_VERSION'));
    }
  }
  assert.throws(() => devTools({ platform: 'unknown' }));
});

test('generator refuses unknown/unavailable profiles, overlapping roots, populated destinations and linked destinations before writing', async () => {
  const stage = await fs.mkdtemp(path.join(os.tmpdir(), 'baseline-generator-refusal-'));
  let linked = false;
  try {
    const options = { profile: 'static', out: path.join(stage, 'site') };
    for (const profile of ['unknown', 'emdash']) await assert.rejects(planProfile({ ...options, profile }));
    await assert.rejects(planProfile({ profile: 'static', out: root }), /overlap/);
    await assert.rejects(planProfile({ profile: 'static', out: path.join(root, 'nested-pilot') }), /overlap/);
    await fs.mkdir(options.out);
    await fs.writeFile(path.join(options.out, 'keep.txt'), 'unchanged');
    await assert.rejects(initProfile(options), /new or empty/);
    assert.equal(await fs.readFile(path.join(options.out, 'keep.txt'), 'utf8'), 'unchanged');
    await fs.symlink(options.out, path.join(stage, 'linked'), process.platform === 'win32' ? 'junction' : 'dir'); linked = true;
    await assert.rejects(planProfile({ ...options, out: path.join(stage, 'linked') }), /Symlinked/);
    for (const relative of ['../escape', '/absolute', 'nested/../../escape', 'C:/absolute', 'nested\\escape']) assert.throws(() => containedPath(stage, relative));
  } finally {
    assert.equal(path.dirname(stage), path.resolve(os.tmpdir()));
    assert.ok(path.basename(stage).startsWith('baseline-generator-refusal-'));
    if (linked) await fs.unlink(path.join(stage, 'linked'));
    await fs.rm(stage, { recursive: true, force: true });
  }
});

test('allowlisted assembly is dry-run safe, records exact provenance and keeps the design gate active before Git initialization', async () => {
  const stage = await fs.mkdtemp(path.join(os.tmpdir(), 'baseline-generator-assembly-'));
  try {
    const options = { profile: 'static', out: path.join(stage, 'project with spaces') };
    assert.equal((await initProfile({ ...options, dryRun: true })).dryRun, true);
    await assert.rejects(fs.stat(options.out), { code: 'ENOENT' });
    const receipt = await initProfile(options);
    assert.equal(receipt.profile, 'static');
    const readJSON = async file => JSON.parse(await fs.readFile(path.join(options.out, file), 'utf8'));
    const pkg = await readJSON('package.json');
    assert.equal((await readJSON('baseline.config.json')).source.repository, 'https://github.com/Vermeulen-Solutions/baseline');
    assert.equal(pkg.name, 'project-with-spaces');
    assert.ok(!JSON.stringify(pkg).includes('schema-budget'));
    assert.ok(!Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).some(name => /emdash|react|sqlite|@astrojs\/(node|cloudflare)/.test(name)));
    for (const file of ['seed', 'data.db', 'uploads', 'src/live.config.ts', 'emdash-env.d.ts', '.emdash', '.mcp.json', 'package-lock.json', '.agents/skills/building-emdash-site']) await assert.rejects(fs.stat(path.join(options.out, file)), { code: 'ENOENT' });
    const provenance = await readJSON('.baseline/managed-files.json');
    assert.equal(provenance.sourceCommit, receipt.sourceCommit);
    assert.equal(typeof provenance.sourceTreeDirty, 'boolean');
    for (const [file, record] of Object.entries(provenance.files)) assert.equal(createHash('sha256').update(await fs.readFile(path.join(options.out, file))).digest('hex'), record.sha256, file);
    const gate = () => spawnSync(process.execPath, ['scripts/check-art-direction.mjs', '--changed'], { cwd: options.out, encoding: 'utf8' });
    let result = gate(); assert.equal(result.status, 0, result.stdout + result.stderr);
    await fs.appendFile(path.join(options.out, 'src/layouts/Base.astro'), '\n<!-- client modification -->\n');
    result = gate(); assert.equal(result.status, 1, 'Edited starter source must require a real art direction record');
    assert.match(result.stderr, /Art Direction Record/);
  } finally {
    assert.equal(path.dirname(stage), path.resolve(os.tmpdir()));
    assert.ok(path.basename(stage).startsWith('baseline-generator-assembly-'));
    await fs.rm(stage, { recursive: true, force: true });
  }
});
