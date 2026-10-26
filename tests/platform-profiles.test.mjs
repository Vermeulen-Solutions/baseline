import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { BASELINE_REPOSITORY, BASELINE_PROVENANCE_REPOSITORIES, PROFILE_IDS, profileManifest, profilePackages, validateProfileConfig } from '../profiles/contract.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const pkg = json('package.json');
const safe = file => typeof file === 'string' && !file.includes('\\') && !file.includes(':') && !file.split('/').some(part => !part || part === '.' || part === '..');
const config = profile => {
  const manifest = profileManifest(profile);
  return { schemaVersion: 1, platformProfile: profile, foundation: manifest.foundation, runtime: manifest.runtimes[0], source: { repository: BASELINE_REPOSITORY, commit: 'a'.repeat(40), release: null }, generatorVersion: '0.1.0', features: [], checks: [...manifest.checks], skills: [...manifest.skills] };
};

test('trusted plugin sources and Workers capability types remain EmDash-only', () => {
  const inventory = json('profiles/file-inventory.json').files;
  for (const file of ['src/plugins/.gitkeep', 'src/plugins/README.md']) {
    assert.ok(fs.existsSync(path.join(root, file)));
    assert.equal(inventory[file].disposition, 'emdash-only');
    assert.ok(profileManifest('emdash').files.includes(file));
  }
  for (const profile of ['static', 'static-sveltia']) {
    const manifest = profileManifest(profile);
    assert.ok(!manifest.files.some(file => file.startsWith('src/plugins/')));
    assert.ok(!manifest.overrides.some(entry => entry.target.startsWith('src/plugins/')));
    assert.ok(!Object.hasOwn(profilePackages(profile, pkg).devDependencies, '@cloudflare/workers-types'));
  }
});

test('profile contract binds foundation/runtime, immutable provenance and exact applicable skills/checks', () => {
  assert.deepEqual(PROFILE_IDS, json('profiles/baseline.config.schema.json').properties.platformProfile.enum);
  for (const profile of PROFILE_IDS) assert.equal(validateProfileConfig(config(profile)).platformProfile, profile);
  const edge = config('emdash'); edge.runtime = 'cloudflare-d1-r2'; validateProfileConfig(edge);
  for (const mutate of [
    c => { c.platformProfile = 'unknown'; }, c => { c.schemaVersion = 2; },
    c => { c.runtime = 'node-sqlite'; }, c => { c.foundation = 'emdash'; },
    c => { c.source.commit = 'main'; }, c => { c.source.repository += '?token=secret'; },
    c => { c.source.extra = true; }, c => { c.source.release = '../release'; },
    c => { c.generatorVersion = 'latest'; }, c => { c.features = ['sveltia']; },
    c => { c.skills.push('building-emdash-site'); }, c => { c.checks.pop(); },
    c => { c.checks.push(c.checks[0]); }, c => { c.secret = 'not permitted'; },
  ]) { const value = config('static'); mutate(value); assert.throws(() => validateProfileConfig(value)); }
  assert.throws(() => validateProfileConfig(null));
});

test('provenance accepts only the canonical repository and its exact historical name without rewriting history', () => {
  const repositories = ['https://github.com/Vermeulen-Solutions/baseline', 'https://github.com/Vermeulen-Solutions/emdash-baseline'];
  assert.equal(BASELINE_REPOSITORY, repositories[0]);
  assert.deepEqual(BASELINE_PROVENANCE_REPOSITORIES, repositories);
  assert.deepEqual(json('profiles/baseline.config.schema.json').properties.source.properties.repository.enum, repositories);
  for (const profile of PROFILE_IDS) {
    for (const repository of repositories) {
      const value = config(profile); value.source.repository = repository;
      const before = structuredClone(value);
      validateProfileConfig(value);
      assert.deepEqual(value, before);
    }
  }
  for (const repository of ['https://github.com/other/baseline', 'https://example.invalid/Vermeulen-Solutions/baseline', ...repositories.flatMap(url => [url + '.git', url + '/', url + '?ref=main', url + '#main', url + '-fork', url.replace('https:', 'http:')])]) {
    const value = config('static'); value.source.repository = repository;
    assert.throws(() => validateProfileConfig(value), /provenance/);
  }
});

test('profile allowlists contain only explicit existing sources and correctly declare generation readiness', () => {
  for (const profile of PROFILE_IDS) {
    const manifest = profileManifest(profile);
    assert.equal(manifest.generationReady, profile !== 'emdash');
    assert.equal(manifest.pending.length > 0, profile === 'emdash');
    for (const file of manifest.files) {
      assert.ok(safe(file), file);
      assert.ok(fs.statSync(path.join(root, file)).isFile(), file);
      assert.ok(!/^(?:node_modules|\.git|\.emdash|uploads|dist|audit)\//.test(file), file);
    }
    for (const pending of manifest.pending) { assert.ok(safe(pending.target)); assert.ok(pending.reason); }
    for (const entry of manifest.overrides) {
      assert.ok(safe(entry.source) && safe(entry.target));
      assert.ok(fs.statSync(path.join(root, entry.source)).isFile(), entry.source);
    }
    for (const name of manifest.scripts) assert.ok(pkg.scripts[name], name);
    profilePackages(profile, pkg);
  }
  const staticProfile = profileManifest('static');
  const sveltia = profileManifest('static-sveltia');
  assert.deepEqual(sveltia.files, staticProfile.files);
  assert.deepEqual(sveltia.packages, staticProfile.packages);
  assert.ok(!staticProfile.files.some(file => /(?:seed\/|live.config|emdash-env|EmDashImage|image-source|schema-budget)/.test(file)));
  assert.ok(!staticProfile.scripts.includes('start'));
  assert.ok(!staticProfile.scripts.includes('sync:emdash-skills'));
  const packages = profilePackages('static', pkg);
  assert.ok(!Object.keys({ ...packages.dependencies, ...packages.devDependencies }).some(name => /emdash|react|@astrojs\/(node|cloudflare)|photoswipe|aws4fetch/.test(name)));
  assert.throws(() => profilePackages('static', { dependencies: {} }), /Missing canonical/);
});

test('Penpot and OpenPencil guidance ships complete on every profile without a runtime dependency', () => {
  const penpotDir = '.agents/skills/penpot-site-design';
  const openpencilDir = '.agents/skills/openpencil-site-design';
  const collect = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? collect(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);
  const expectedPenpot = collect(penpotDir).sort();
  const expectedOpenpencil = collect(openpencilDir).sort();
  const iterationReference = '.agents/skills/site-art-direction/references/design-iteration.md';
  const onboardingDocs = ['docs/penpot-onboarding.md', 'docs/openpencil-onboarding.md'];
  assert.ok(expectedPenpot.includes(`${penpotDir}/assets/design-brief.md`));
  assert.ok(expectedPenpot.includes(`${penpotDir}/assets/design-handoff.md`));
  assert.ok(expectedOpenpencil.includes(`${openpencilDir}/SKILL.md`));
  assert.ok(expectedOpenpencil.includes(`${openpencilDir}/references/connection-and-api.md`));
  for (const profile of PROFILE_IDS) {
    const manifest = profileManifest(profile);
    assert.ok(manifest.skills.includes('penpot-site-design'), profile);
    assert.ok(manifest.skills.includes('openpencil-site-design'), profile);
    assert.deepEqual(manifest.skillFiles.filter(file => file.startsWith(`${penpotDir}/`)).sort(), expectedPenpot, profile);
    assert.deepEqual(manifest.skillFiles.filter(file => file.startsWith(`${openpencilDir}/`)).sort(), expectedOpenpencil, profile);
    assert.ok(manifest.skillFiles.includes(iterationReference), profile);
    for (const doc of onboardingDocs) assert.ok(manifest.files.includes(doc), `${profile}: missing ${doc}`);
    const packages = profilePackages(profile, pkg);
    assert.ok(!Object.keys({ ...packages.dependencies, ...packages.devDependencies }).some(name => /penpot|open-pencil/.test(name)), profile);
    for (const file of [...expectedPenpot.filter(file => file.endsWith('.md')), ...expectedOpenpencil.filter(file => file.endsWith('.md')), iterationReference, ...onboardingDocs]) {
      for (const [, href] of fs.readFileSync(path.join(root, file), 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
        if (/^https?:/.test(href) || href.startsWith('#')) continue;
        const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), href.split('#')[0]));
        assert.ok(manifest.files.includes(target) || manifest.skillFiles.includes(target), `${profile}: unshipped reference ${target} in ${file}`);
      }
    }
  }
});

test('bundled OpenPencil mechanics retain reviewed upstream bytes and license on every profile', () => {
  const dir = '.agents/skills/openpencil-site-design/references/upstream';
  const provenance = json(`${dir}/PROVENANCE.json`);
  assert.equal(provenance.repository, 'https://github.com/open-pencil/open-pencil');
  assert.match(provenance.commit, /^[a-f0-9]{40}$/);
  assert.deepEqual(provenance.files.map(file => file.path).sort(), ['LICENSE.txt', 'SKILL.md', 'references/design-authoring.md']);
  for (const record of provenance.files) {
    assert.ok(safe(record.path));
    assert.equal(record.sourcePath, `skills/open-pencil/${record.path}`);
    const text = fs.readFileSync(path.join(root, dir, record.path), 'utf8').replaceAll('\r\n', '\n');
    assert.equal(createHash('sha256').update(text).digest('hex'), record.sha256, `${record.path}: upstream drift needs explicit review`);
    for (const profile of PROFILE_IDS) assert.ok(profileManifest(profile).skillFiles.includes(`${dir}/${record.path}`), profile);
  }
});

test('dependency inventory accounts for every root dependency and versions have a single source', () => {
  const inventory = json('profiles/dependency-inventory.json').packages;
  assert.deepEqual(Object.keys(inventory).sort(), Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).sort());
  for (const profile of PROFILE_IDS) {
    const selected = profilePackages(profile, pkg);
    for (const section of ['dependencies', 'devDependencies']) {
      assert.deepEqual(Object.keys(selected[section]).sort(), Object.keys(inventory).filter(name => inventory[name].section === section && inventory[name].profiles.includes(profile)).sort());
      for (const [name, version] of Object.entries(selected[section])) assert.equal(version, pkg[section][name]);
    }
  }
});

test('native design checks remain available without installing a DESIGN.md exchange tool', () => {
  const lock = json('package-lock.json');
  assert.ok(!Object.keys(lock.packages).some(name => name.endsWith('/@google/design.md')));
  assert.equal(pkg.scripts['design:tokens'], 'node scripts/design-system.mjs');
  for (const command of ['verify:fast', 'verify']) assert.ok(pkg.scripts[command].includes('npm run design:tokens'));
  assert.ok(!pkg.scripts['test:design'].includes('design-interchange'));
  for (const profile of PROFILE_IDS) {
    const manifest = profileManifest(profile);
    const packages = profilePackages(profile, pkg);
    assert.ok(!Object.hasOwn({ ...packages.dependencies, ...packages.devDependencies }, '@google/design.md'), profile);
    assert.ok(!manifest.files.includes('scripts/design-interchange.mjs'), profile);
    for (const command of ['design:check', 'design:export']) {
      assert.ok(!Object.hasOwn(pkg.scripts, command));
      assert.ok(!manifest.scripts.includes(command), profile);
    }
    for (const check of ['check:art-direction', 'design:tokens']) assert.ok(manifest.checks.includes(check), profile);
  }
});

test('shared image preparation ships to all profiles while CMS upload stays EmDash-only', () => {
  for (const profile of PROFILE_IDS) {
    const manifest = profileManifest(profile), packages = profilePackages(profile, pkg);
    assert.ok(manifest.scripts.includes('media:prepare'), profile);
    assert.ok(packages.devDependencies.sharp, profile);
    for (const file of ['scripts/prepare-images.mjs', 'scripts/prepare-image.mjs', 'docs/media-preparation.md']) assert.ok(manifest.files.includes(file), profile);
    assert.equal(manifest.scripts.includes('media:upload'), profile === 'emdash');
    assert.equal(manifest.files.includes('scripts/upload-prepared-media.mjs'), profile === 'emdash');
  }
});

test('source inventory covers the declared surface and shared presentation imports stay inside its allowlist', () => {
  const inventory = json('profiles/file-inventory.json');
  const collect = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? collect(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);
  const surface = [...collect('src'), ...fs.readdirSync(path.join(root, 'scripts')).filter(f => f.endsWith('.mjs')).map(f => `scripts/${f}`), ...fs.readdirSync(path.join(root, 'tests')).filter(f => f.endsWith('.test.mjs')).map(f => `tests/${f}`)];
  for (const file of surface) assert.ok(inventory.files[file], `Classify new source explicitly: ${file}`);
  for (const file of Object.keys(inventory.files)) assert.ok(fs.existsSync(path.join(root, file)), file);
  const allowed = new Set(profileManifest('static').files);
  for (const file of allowed) {
    assert.equal(inventory.files[file].static, 'copy', file);
    if (!/^src\/.*\.(astro|ts)$/.test(file)) continue;
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const imports = [...source.matchAll(/\b(?:import|export)\s+(?:[^;'"\n]*?\s+from\s*)?['"]([^'"]+)['"]/g)].map(match => match[1]);
    for (const specifier of imports) {
      assert.ok(!/^(?:emdash|@emdash-cms\/|react)/.test(specifier), `${file}: ${specifier}`);
      if (!specifier.startsWith('.')) continue;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
      assert.ok([resolved, `${resolved}.ts`, `${resolved}.astro`].some(candidate => allowed.has(candidate)), `${file} imports unshipped ${specifier}`);
    }
  }
});
