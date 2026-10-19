// Explicit local rehearsal of trusted local Git snapshots, not a downstream migration tool.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stageBaseline, applyBaseline } from '../scripts/sync-baseline.mjs';
import { applyTokenOverrides, parseDesignTokens, formatArtDirectionRecord } from '../scripts/design-system.mjs';

assert.ok(!process.env.CI && !process.env.GITHUB_ACTIONS, 'Adoption/browser rehearsal is local-only');
assert.equal(process.platform, 'win32', 'This acceptance rehearsal uses the local Windows renderer');
const options = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const key = process.argv[i], value = process.argv[i + 1];
  assert.ok(['--from', '--to', '--out'].includes(key) && value && !options[key], 'Use --from <SHA> --to <SHA> --out <new-directory>');
  options[key] = value;
}
for (const key of ['--from', '--to']) assert.match(options[key] ?? '', /^[a-f0-9]{40}$/, 'Use immutable local Git revisions');
const source = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(options['--out']);
await assert.rejects(fs.stat(output), { code: 'ENOENT' });
await fs.mkdir(output, { recursive: true });
const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'baseline-architecture-adoption-'));
const oldSource = path.join(temporary, 'historical-source');
const git = (cwd, args, extra = {}) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'], ...extra });
const upstream = relative => Buffer.from(execFileSync('git', ['-C', source, 'show', `${options['--to']}:${relative}`], { maxBuffer: 32 * 1024 * 1024 }));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const npm = process.env.npm_execpath ?? path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const receipt = { version: 1, from: options['--from'], to: options['--to'], transport: 'Trusted local git show bytes supplied to the production stage/apply API; no claim of fetching unpublished revisions from GitHub', temporary, fixtures: [] };
const run = (root, args, label) => {
  console.log(label);
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', timeout: 300000, env: { ...process.env, SITE_URL: 'https://static-profile.example.test' } });
  assert.equal(result.status, 0, `${label}: ${result.error?.message ?? 'nonzero exit'}`);
};
const write = async (root, target, bytes) => { await fs.mkdir(path.dirname(path.join(root, target)), { recursive: true }); await fs.writeFile(path.join(root, target), bytes); };
const added = {
  'src/components/StaticMetadata.astro': 'profiles/static/project/src/components/StaticMetadata.astro',
  'src/config/routing.ts': 'profiles/static/project/src/config/routing.ts',
  'src/lib/metadata.ts': 'profiles/static/project/src/lib/metadata.ts',
  'src/lib/json-ld.ts': 'profiles/static/project/src/lib/json-ld.ts',
  'tests/metadata.test.mjs': 'profiles/static/project/tests/metadata.test.mjs',
  ...Object.fromEntries(['eslint.config.mjs', 'tests/template-lint.test.mjs', 'tests/fluid-tokens.test.mjs', 'src/components/Disclosure.astro', 'src/components/Cluster.astro', 'src/components/Sidebar.astro', 'src/components/dev/CompositionSpecimens.astro', 'src/dev/disclosure-prose.md', 'docs/design-framework.md', 'docs/native-composition.md', 'docs/baseline-updates.md'].map(file => [file, file])),
};
const manualPatches = ['astro.config.mjs', 'src/layouts/Base.astro', 'src/pages/index.astro', 'src/pages/404.astro', 'src/pages/posts/[...id].astro'];
try {
  execFileSync('git', ['clone', '--shared', '--no-checkout', '--', source, oldSource], { stdio: ['ignore', 'pipe', 'pipe'] });
  git(oldSource, ['config', 'core.autocrlf', 'false']);
  git(oldSource, ['checkout', '--detach', options['--from']]);
  const { initProfile } = await import(pathToFileURL(path.join(oldSource, 'scripts/init-profile.mjs')).href);
  const canonical = JSON.parse(upstream('package.json'));
  for (const [profile, customized] of [['static', false], ['static-sveltia', true]]) {
    const root = path.join(temporary, profile);
    await initProfile({ profile, out: root });
    git(root, ['init', '--initial-branch=main']);
    for (const [key, value] of [['user.name', 'Baseline synthetic rehearsal'], ['user.email', 'fixture@example.invalid'], ['core.autocrlf', 'false']]) git(root, ['config', key, value]);
    git(root, ['add', '.']); git(root, ['commit', '-m', 'Synthetic generated baseline']);
    if (customized) {
      // A synthetic fixture record precedes calibration/wrapper edits; no real client direction is invented.
      const agents = await fs.readFile(path.join(root, 'AGENTS.md'), 'utf8');
      await write(root, 'AGENTS.md', agents + '\n\n' + formatArtDirectionRecord('editorial-paper') + '\n');
      await write(root, 'src/styles/global.css', applyTokenOverrides(await fs.readFile(path.join(root, 'src/styles/global.css'), 'utf8'), 'editorial-paper'));
      run(root, ['scripts/check-art-direction.mjs', '--require-record'], profile + ': synthetic calibration established before wrapper changes');
      await write(root, 'src/layouts/Base.astro', (await fs.readFile(path.join(root, 'src/layouts/Base.astro'), 'utf8')).replace('class="site-footer"', 'class="site-footer" data-client-wrapper="retained"'));
      await write(root, 'src/config/site.ts', (await fs.readFile(path.join(root, 'src/config/site.ts'), 'utf8')).replace("label: 'Posts'", "label: 'Journal'"));
      git(root, ['add', '.']); git(root, ['commit', '-m', 'Synthetic client calibration and ownership']);
    }
    const protectedPaths = ['baseline.config.json', 'package.json', 'src/layouts/Base.astro', 'src/config/site.ts', 'src/content/posts/welcome.md', ...(customized ? ['public/admin/config.yml'] : [])];
    const before = Object.fromEntries(await Promise.all(protectedPaths.map(async relative => [relative, sha(await fs.readFile(path.join(root, relative)))])));
    const cssBefore = await fs.readFile(path.join(root, 'src/styles/global.css'), 'utf8');
    const tokensBefore = parseDesignTokens(cssBefore);
    const themeBefore = tokensBefore.theme;
    const originalManaged = JSON.parse(await fs.readFile(path.join(root, '.baseline/managed-files.json'), 'utf8'));
    const stage = await stageBaseline({ root, commit: options['--to'], readSource: upstream });
    assert.ok(stage.entries.length > 0);
    assert.ok(!stage.entries.some(entry => /layouts\/Base|src\/pages|src\/config|public\/admin|package\.json/.test(entry.target)));
    for (const target of Object.keys(added).filter(target => !originalManaged.files[target])) assert.ok(!stage.entries.some(entry => entry.target === target), 'New membership cannot be added by sync');
    const synced = await applyBaseline({ root, commit: options['--to'] });
    assert.deepEqual(synced.conflicts, customized ? ['src/styles/global.css'] : []);
    for (const relative of protectedPaths) assert.equal(sha(await fs.readFile(path.join(root, relative))), before[relative], `${profile}: sync preserved ${relative}`);
    if (customized) assert.deepEqual(parseDesignTokens(await fs.readFile(path.join(root, 'src/styles/global.css'), 'utf8')).theme, themeBefore);
    assert.deepEqual(Object.keys(JSON.parse(await fs.readFile(path.join(root, '.baseline/managed-files.json'), 'utf8')).files), Object.keys(originalManaged.files));
    git(root, ['add', '.']); git(root, ['commit', '-m', 'Reviewed bounded synchronization subset']);
    const packageBefore = await fs.readFile(path.join(root, 'package.json'), 'utf8');
    const pkg = JSON.parse(packageBefore);
    for (const name of ['eslint', 'eslint-plugin-astro', 'eslint-plugin-jsx-a11y-x', '@typescript-eslint/parser', 'parse5']) pkg.devDependencies[name] = canonical.devDependencies[name];
    pkg.engines = canonical.engines;
    Object.assign(pkg.scripts, { lint: canonical.scripts.lint, 'lint:scripts': canonical.scripts['lint:scripts'], 'lint:templates': 'eslint src --max-warnings 0', 'test:design': 'node --test tests/static-foundation.test.mjs tests/fluid-tokens.test.mjs' });
    await write(root, 'package.json', json(pkg));
    for (const [target, from] of Object.entries(added)) await write(root, target, upstream(from));
    for (const target of [...manualPatches, ...(customized ? ['src/styles/global.css'] : [])]) {
      if (target === 'src/styles/global.css') {
        // Reviewed reconciliation for this token-only synthetic fixture, not a
        // general merge algorithm. Refuse any additional local rule changes.
        const original = await fs.readFile(path.join(oldSource, target), 'utf8');
        const calibration = { theme: tokensBefore.theme, root: tokensBefore.root, dark: tokensBefore.dark };
        assert.equal(applyTokenOverrides(original, calibration), cssBefore, 'Fixture contains only the reviewed calibration delta');
        await write(root, target, applyTokenOverrides(upstream(target).toString('utf8'), calibration));
        continue;
      }
      const from = target === 'src/styles/global.css' ? target : 'profiles/static/project/' + target;
      let patch = git(source, ['diff', options['--from'], options['--to'], '--', from]);
      if (from !== target) patch = patch.replaceAll('a/' + from, 'a/' + target).replaceAll('b/' + from, 'b/' + target);
      if (patch.trim()) git(root, ['apply', '--3way', '--index', '-'], { input: patch });
    }
    // Retain the old receipt's membership/provenance; manual additions stay locally owned.
    assert.deepEqual(Object.keys(JSON.parse(await fs.readFile(path.join(root, '.baseline/managed-files.json'), 'utf8')).files), Object.keys(originalManaged.files));
    const afterTheme = parseDesignTokens(await fs.readFile(path.join(root, 'src/styles/global.css'), 'utf8')).theme;
    assert.deepEqual(afterTheme, themeBefore, 'All 31 calibrated theme values survive manual semantic CSS merge');
    assert.equal(sha(await fs.readFile(path.join(root, 'src/config/site.ts'))), before['src/config/site.ts']);
    if (customized) assert.match(await fs.readFile(path.join(root, 'src/layouts/Base.astro'), 'utf8'), /data-client-wrapper="retained"/);
    const gates = JSON.parse(await fs.readFile(path.join(root, 'audit/design-gate-exceptions.json'), 'utf8'));
    const upstreamGates = JSON.parse(upstream('audit/design-gate-exceptions.json'));
    for (const [target, from] of [...Object.entries(added), ...manualPatches.map(target => [target, 'profiles/static/project/' + target])]) {
      if (!target.startsWith('src/')) continue;
      const bytes = await fs.readFile(path.join(root, target), 'utf8');
      const normalized = sha(bytes.replaceAll('\r\n', '\n'));
      const exact = upstreamGates.find(entry => entry.path === from && entry.sha256 === normalized);
      const old = gates.findIndex(entry => entry.path === target);
      if (exact) { if (old >= 0) gates.splice(old, 1); gates.push({ ...exact, path: target }); }
      else assert.ok(customized, 'No new blanket exemption for client-adapted source');
    }
    await write(root, 'audit/design-gate-exceptions.json', json(gates));
    git(root, ['add', '.']);
    const patch = git(root, ['diff', '--cached', 'HEAD', '--', '.', ':!package-lock.json', ':!audit/design-gate-exceptions.json', ':!.baseline/managed-files.json']);
    await fs.writeFile(path.join(output, `${profile}-additive.patch`), patch);
    for (const args of [['install', '--no-audit', '--no-fund'], ['ci', '--no-audit', '--no-fund'], ['run', 'verify'], ['run', 'build'], ['run', 'check:dev-tools'], ['run', 'fixtures:build']]) run(root, [npm, ...args], profile + ': npm ' + args.join(' '));
    assert.equal((await fs.lstat(path.join(root, 'node_modules'))).isSymbolicLink(), false);
    const lock = JSON.parse(await fs.readFile(path.join(root, 'package-lock.json'), 'utf8'));
    assert.ok(!Object.keys(lock.packages).some(name => /(?:^|\/)(?:emdash|[^/]*sqlite[^/]*|@libsql|libsql)(?:\/|$)/i.test(name)));
    run(source, ['tests/static-pilot.integration.mjs', '--root', root, '--site-url', 'https://static-profile.example.test', '--public-browser', ...(customized ? ['--browser'] : []), '--out', path.join(output, `${profile}-http-browser.json`)], profile + ': built HTTP, public browser and applicable sign-in smoke');
    if (customized) {
      assert.match(await fs.readFile(path.join(root, 'dist/index.html'), 'utf8'), /data-client-wrapper="retained"/);
      assert.match(await fs.readFile(path.join(root, 'dist/index.html'), 'utf8'), />Journal<\/a>/);
      assert.equal(sha(await fs.readFile(path.join(root, 'public/admin/config.yml'))), before['public/admin/config.yml']);
    }
    assert.equal(sha(await fs.readFile(path.join(root, 'baseline.config.json'))), before['baseline.config.json']);
    const result = { profile, root, customized, stage: stage.entries, applied: synced.applied, conflicts: synced.conflicts, manualFiles: Object.keys(added), cssReconciliation: customized ? 'Explicit token-only fixture reconciliation; arbitrary local rule edits rejected; sync conflict retained' : 'Unchanged shared CSS eligible through bounded sync', packageUpgrade: { before: sha(packageBefore), after: sha(await fs.readFile(path.join(root, 'package.json'))), explicitDevelopmentDependencies: ['eslint', 'eslint-plugin-astro', 'eslint-plugin-jsx-a11y-x', '@typescript-eslint/parser', 'parse5'], independentInstall: true, cleanInstall: true, databasePackages: 0 }, invariants: { managedMembershipUnchanged: true, originalProvenanceUnchanged: true, calibratedThemeValuesUnchanged: true, siteConfigAndContentPreserved: true, customWrapperAndNavigationPreserved: customized, sveltiaConfigurationPreserved: customized }, acceptance: 'verify/build/fixture/HTTP/public browser passed; Sveltia sign-in offered where applicable', additivePatchSHA256: sha(patch) };
    receipt.fixtures.push(result);
    await fs.writeFile(path.join(output, 'adoption.json'), json(receipt));
  }
  receipt.complete = true;
  await fs.writeFile(path.join(output, 'adoption.json'), json(receipt));
  console.log(json({ complete: true, output, temporary, profiles: receipt.fixtures.map(f => f.profile) }));
} finally {
  console.log('Retained owned synthetic fixtures for review: ' + temporary);
}
