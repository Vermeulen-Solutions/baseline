import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { initProfile } from '../scripts/init-profile.mjs';
import { stageBaseline, applyBaseline } from '../scripts/sync-baseline.mjs';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { profileSource } from './helpers/profile-source.mjs';

const fixtureSource = await profileSource();
after(fixtureSource.dispose);
const source = pathToFileURL(fixtureSource.root + path.sep);
async function fixture(run, profile = 'static') {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'baseline-sync-test-'));
  try { const root = path.join(temp, 'site'); await initProfile({ profile, out: root, sourceRoot: fixtureSource.root }); await run(root); }
  finally { assert.equal(path.dirname(temp), path.resolve(os.tmpdir())); assert.ok(path.basename(temp).startsWith('baseline-sync-test-')); await fs.rm(temp, { recursive: true, force: true }); }
}
const readSource = transform => async relative => transform(relative, await fs.readFile(new URL(relative, source)));

test('older installed inventory preserves legacy primitives, calibrated tokens and Base until additive spacing migration', () => fixture(async root => {
  const commit = '1'.repeat(40), hash = value => createHash('sha256').update(value).digest('hex');
  const managedPath = path.join(root,'.baseline/managed-files.json');
  const managed = JSON.parse(await fs.readFile(managedPath,'utf8'));
  for (const target of ['src/lib/layout-style.ts','scripts/css-contracts.mjs','scripts/check-css-contracts.mjs','tests/css-contracts.test.mjs','tests/spacing-tokens.test.mjs']) {
    delete managed.files[target];await fs.unlink(path.join(root,target));
  }
  const packagePath=path.join(root,'package.json'), pkg=JSON.parse(await fs.readFile(packagePath,'utf8'));
  for(const name of ['postcss','postcss-selector-parser','astro-eslint-parser'])delete pkg.devDependencies[name];
  await fs.writeFile(packagePath,JSON.stringify(pkg));const originalPackage=await fs.readFile(packagePath);
  const originals={};
  for(const target of ['src/components/Section.astro','src/components/Container.astro','src/components/Grid.astro','scripts/design-system.mjs']) {
    // A historical-shape installation: no imports of the additive helper or parsers.
    const legacy=target.endsWith('.astro')?'---\nconst {class:className}=Astro.props;\n---\n<div class={className}><slot /></div>\n':'export const legacy = true;\n';
    await fs.writeFile(path.join(root,target),legacy);managed.files[target].sha256=hash(legacy);originals[target]=legacy;
  }
  const cssPath=path.join(root,'src/styles/global.css');let css=await fs.readFile(cssPath,'utf8');
  css=css.replace(/^\s*--layout-(?:section-padding|container-gap|content-gap|grid-gap):[^;]+;\s*$/gm,'');
  managed.files['src/styles/global.css'].sha256=hash(css);
  css+='\n/* Retain client density and palette */\n@layer base { :root { --client-calibration: 1; } }\n';await fs.writeFile(cssPath,css);
  const basePath=path.join(root,'src/layouts/Base.astro');const base=(await fs.readFile(basePath,'utf8')).replace(' spacingPolicy="automatic-v2"','');await fs.writeFile(basePath,base);
  await fs.writeFile(managedPath,JSON.stringify(managed));
  const beforeMembership=Object.keys(managed.files).sort();
  const stage=await stageBaseline({root,commit,readSource:readSource((file,bytes)=>file==='scripts/design-system.mjs'?Buffer.concat([bytes,Buffer.from("\nimport 'constructor';\n")]):bytes)});
  for(const target of Object.keys(originals))assert.ok(stage.entries.find(e=>e.target===target)?.migrationReasons.length,target);
  // Editable stage flags are not a bypass: apply recomputes from incoming bytes.
  const stagePath=path.join(root,`.baseline/updates/${commit}/stage.json`);for(const entry of stage.entries){entry.migrationReasons=[];entry.conflict=false;}await fs.writeFile(stagePath,JSON.stringify(stage));
  const result=await applyBaseline({root,commit});
  for(const [target,legacy]of Object.entries(originals)){assert.ok(result.conflicts.includes(target));assert.equal(await fs.readFile(path.join(root,target),'utf8'),legacy);}
  assert.match(result.migrations['scripts/design-system.mjs'].join('\n'),/Undeclared direct package: postcss/);
  assert.match(result.migrations['scripts/design-system.mjs'].join('\n'),/Undeclared direct package: constructor/,'Inherited object keys are not declared packages');
  assert.match(result.migrations['src/components/Section.astro'].join('\n'),/Missing local import/);
  assert.equal(await fs.readFile(cssPath,'utf8'),css);assert.equal(await fs.readFile(basePath,'utf8'),base);assert.deepEqual(await fs.readFile(packagePath),originalPackage);
  assert.deepEqual(Object.keys(JSON.parse(await fs.readFile(managedPath,'utf8')).files).sort(),beforeMembership);
}));
test('profile sync stages shared changes and skills, preserves calibrated tokens and excludes client files and packages', () => fixture(async root => {
  const commit = 'a'.repeat(40);
  const local = '/* local calibration */\n';
  await fs.appendFile(path.join(root, 'src/styles/global.css'), local);
  const pkg = await fs.readFile(path.join(root, 'package.json'));
  const stage = await stageBaseline({ root, commit, readSource: readSource((file, bytes) => ['src/layouts/SiteShell.astro', 'src/styles/global.css', '.agents/skills/new-site-workflow/SKILL.md'].includes(file) ? Buffer.concat([bytes, Buffer.from('\n<!-- upstream revision -->\n')]) : bytes) });
  assert.equal(stage.entries.length, 3);
  assert.equal(stage.entries.filter(e => e.conflict).length, 1);
  const result = await applyBaseline({ root, commit });
  assert.deepEqual(result.conflicts, ['src/styles/global.css']);
  assert.equal(result.applied.length, 2);
  assert.ok((await fs.readFile(path.join(root, 'src/styles/global.css'), 'utf8')).endsWith(local));
  assert.deepEqual(await fs.readFile(path.join(root, 'package.json')), pkg);
  assert.ok(!stage.entries.some(e => /public\/admin|src\/pages|src\/content|src\/config|layouts\/Base|building-emdash/.test(e.target)));
}));
test('sync refuses changed local files and altered staged payloads before any writes', () => fixture(async root => {
  const commit = 'b'.repeat(40), target = 'src/layouts/SiteShell.astro';
  await stageBaseline({ root, commit, readSource: readSource((file, bytes) => file === target ? Buffer.concat([bytes, Buffer.from('\n<!-- update -->')]) : bytes) });
  const initial = await fs.readFile(path.join(root, target));
  await fs.appendFile(path.join(root, target), 'local');
  await assert.rejects(applyBaseline({ root, commit }), /changed after staging/);
  await fs.writeFile(path.join(root, target), initial);
  await fs.appendFile(path.join(root, `.baseline/updates/${commit}/files/${target}`), 'tamper');
  await assert.rejects(applyBaseline({ root, commit }), /Staged bytes changed/);
  assert.deepEqual(await fs.readFile(path.join(root, target)), initial);
}));
test('sync rejects mutable refs, traversal and attempts to exceed installed membership', () => fixture(async root => {
  await assert.rejects(stageBaseline({ root, commit: 'main' }), /immutable/);
  const commit = 'c'.repeat(40);
  await stageBaseline({ root, commit, readSource: readSource((file, bytes) => bytes) });
  const stagePath = path.join(root, `.baseline/updates/${commit}/stage.json`);
  const stage = JSON.parse(await fs.readFile(stagePath, 'utf8'));
  stage.entries.push({ target: '.agents/skills/building-emdash-site/SKILL.md' });
  await fs.writeFile(stagePath, JSON.stringify(stage));
  await assert.rejects(applyBaseline({ root, commit }), /membership/);
  stage.entries[0].target = '../outside'; await fs.writeFile(stagePath, JSON.stringify(stage));
  await assert.rejects(applyBaseline({ root, commit }), /Unsafe/);
}));
for (const profile of ['static', 'static-sveltia']) for (const repository of ['https://github.com/Vermeulen-Solutions/baseline', 'https://github.com/Vermeulen-Solutions/emdash-baseline']) {
test(`${profile} sync accepts ${repository.split('/').at(-1)} provenance and fetches only canonical immutable URLs`, () => fixture(async root => {
  const configPath = path.join(root, 'baseline.config.json');
  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  config.source.repository = repository;
  await fs.writeFile(configPath, JSON.stringify(config, null, 2) + '\n');
  const originalConfig = await fs.readFile(configPath);
  const fetch = globalThis.fetch;
  const commit = 'd'.repeat(40);
  const prefix = `https://raw.githubusercontent.com/Vermeulen-Solutions/baseline/${commit}/`;
  const target = 'src/layouts/SiteShell.astro';
  const initial = await fs.readFile(path.join(root, target));
  const incoming = Buffer.concat([initial, Buffer.from('\n<!-- shared update -->\n')]);
  let calls = 0;
  try {
    globalThis.fetch = async url => {
      assert.ok(url.startsWith(prefix)); calls++;
      const file = url.slice(prefix.length);
      return new Response(file === target ? incoming : await fs.readFile(new URL(file, source)));
    };
    const stage = await stageBaseline({ root, commit });
    assert.ok(calls > 50); assert.equal(stage.entries.length, 1);
  } finally { globalThis.fetch = fetch; }
  assert.deepEqual((await applyBaseline({ root, commit })).applied, [target]);
  assert.deepEqual(await fs.readFile(path.join(root, target)), incoming);
  assert.deepEqual(await fs.readFile(configPath), originalConfig, 'historical provenance is preserved');
  const linked = path.join(root, '.baseline/updates', 'e'.repeat(40));
  await fs.symlink(path.join(root, 'src'), linked, process.platform === 'win32' ? 'junction' : 'dir');
  try { await assert.rejects(stageBaseline({ root, commit: 'e'.repeat(40) }), /Symlinked/); }
  finally { await fs.unlink(linked); }
}, profile));
}

test('sync rejects lookalike upstream identities before fetching or staging', () => fixture(async root => {
  const configPath = path.join(root, 'baseline.config.json');
  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  const fetch = globalThis.fetch;
  let calls = 0;
  try {
    globalThis.fetch = async () => { calls++; throw new Error('must not fetch'); };
    for (const repository of ['https://github.com/other/baseline', 'https://example.invalid/Vermeulen-Solutions/baseline', ...['baseline', 'emdash-baseline'].flatMap(name => ['.git', '/', '?ref=main', '#main', '-fork'].map(suffix => `https://github.com/Vermeulen-Solutions/${name}${suffix}`))]) {
      config.source.repository = repository;
      await fs.writeFile(configPath, JSON.stringify(config));
      await assert.rejects(stageBaseline({ root, commit: 'f'.repeat(40) }), /requires a generated static Platform Profile/);
    }
    assert.equal(calls, 0);
    await assert.rejects(fs.stat(path.join(root, '.baseline/updates')), { code: 'ENOENT' });
  } finally { globalThis.fetch = fetch; }
}));
