import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { apply, candidates, missingImports, plan } from '../scripts/site-files.mjs';

const head = file => execFileSync('git', ['show', `HEAD:${file}`]);
const inventory = JSON.parse(head('profiles/file-inventory.json').toString('utf8'));

test('candidates are the shipped code files the site does not own', () => {
  const emdash = candidates(inventory, 'emdash').map(entry => entry.target);
  const staticEntries = candidates(inventory, 'static'), statics = staticEntries.map(entry => entry.target);
  assert.ok(emdash.includes('src/components/Form.astro'));
  assert.ok(statics.includes('src/components/Form.astro'));
  for (const list of [emdash, statics]) {
    assert.ok(!list.includes('src/layouts/Base.astro'), 'the site wrapper stays with the site');
    assert.ok(!list.some(file => /^src\/(?:pages|content|config|styles)\/|^\.agents\//.test(file)));
  }
  assert.ok(!staticEntries.some(entry => inventory.files[entry.source].disposition === 'emdash-only'), 'no EmDash-only sources on a static site');
});

test('imports the site lacks block an adoption', () => {
  const has = file => file === 'src/lib/present.ts';
  assert.deepEqual(missingImports('src/components/X.astro', Buffer.from("import a from '../lib/present.ts';\nimport b from '../lib/absent';\nimport c from 'astro:assets';\nimport d from '@scope/pkg/sub';\n"), has, new Set()), ['local ../lib/absent', 'package @scope/pkg']);
  assert.deepEqual(missingImports('README.md', Buffer.from("import x from 'y'"), has, new Set()), []);
  // Comments and test strings are not imports; dynamic and side-effect imports are.
  const source = "/** @param {import('../lib/typed.js').T} t */\n// import gone from './gone';\nconst pattern = /from '\\.\\.\\/lib'/;\nassert.match(text, /import x from 'fixture'/);\nimport './side-effect.css';\nconst lazy = await import('./lazy.ts');\n";
  assert.deepEqual(missingImports('src/lib/X.ts', Buffer.from(source), () => false, new Set()), ['local ./side-effect.css', 'local ./lazy.ts']);
});

test('a site file is current, behind, edited or missing, and only untouched files are replaced', () => {
  const site = fs.mkdtempSync(path.join(os.tmpdir(), 'site-files-'));
  try {
    const pkg = JSON.parse(head('package.json').toString('utf8'));
    fs.writeFileSync(path.join(site, 'package.json'), JSON.stringify({ dependencies: { emdash: pkg.dependencies.emdash, ...pkg.dependencies }, devDependencies: pkg.devDependencies }));
    const write = (file, bytes) => { fs.mkdirSync(path.dirname(path.join(site, file)), { recursive: true }); fs.writeFileSync(path.join(site, file), bytes); };
    // current (with CRLF line endings), edited, and behind (a version Baseline once committed).
    write('src/lib/opening-hours.ts', head('src/lib/opening-hours.ts').toString('utf8').replaceAll('\n', '\r\n'));
    write('src/lib/consent.ts', '// my own consent\n');
    write('src/lib/form-transport.ts', head('src/lib/form-transport.ts'));
    const older = execFileSync('git', ['log', '--format=%H', '-2', '--', 'src/components/Form.astro']).toString().trim().split('\n')[1];
    write('src/components/Form.astro', execFileSync('git', ['show', `${older}:src/components/Form.astro`]));
    const result = plan(site, { files: ['src/components/Hours.astro'] });
    const status = Object.fromEntries(result.entries.map(entry => [entry.target, entry.status]));
    assert.equal(status['src/lib/opening-hours.ts'], 'current');
    assert.equal(status['src/lib/consent.ts'], 'edited');
    assert.equal(status['src/components/Form.astro'], 'behind');
    assert.equal(status['src/components/Hours.astro'], 'missing');
    assert.deepEqual(result.adopting, ['src/components/Form.astro', 'src/components/Hours.astro']);
    const written = apply(result);
    assert.deepEqual(written, ['src/components/Form.astro', 'src/components/Hours.astro']);
    assert.ok(fs.readFileSync(path.join(site, 'src/components/Form.astro')).equals(head('src/components/Form.astro')));
    assert.equal(fs.readFileSync(path.join(site, 'src/lib/consent.ts'), 'utf8'), '// my own consent\n', 'an edited file is never replaced');
    const short = result.commit.slice(0, 12);
    assert.ok(fs.existsSync(path.join(site, '.baseline/incoming', short, 'src/lib/consent.ts')), 'Baseline\'s version is written beside it');
    assert.ok(fs.existsSync(path.join(site, '.baseline/backups', short, 'src/components/Form.astro')), 'the replaced original is kept');
    const receipt = JSON.parse(fs.readFileSync(path.join(site, '.baseline/owned-files.json'), 'utf8'));
    assert.deepEqual(Object.keys(receipt.files).sort(), ['src/components/Form.astro', 'src/components/Hours.astro', 'src/lib/form-transport.ts', 'src/lib/opening-hours.ts']);
    assert.equal(receipt.baseline.commit, result.commit);
    // A recorded file the site never touched is behind even when Baseline never committed those bytes.
    receipt.files['src/lib/consent.ts'] = { source: 'src/lib/consent.ts', sha256: execFileSync('node', ['-e', "process.stdout.write(require('crypto').createHash('sha256').update('// my own consent\\n').digest('hex'))"]).toString(), commit: result.commit };
    fs.writeFileSync(path.join(site, '.baseline/owned-files.json'), JSON.stringify(receipt));
    assert.equal(plan(site).entries.find(entry => entry.target === 'src/lib/consent.ts').status, 'behind');
    assert.throws(() => plan(site, { files: ['src/pages/index.astro'] }), /Not a Baseline-owned code file/);
  } finally { fs.rmSync(site, { recursive: true, force: true }); }
});
