import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { inspectProject } from '../scripts/inspect-project.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
function fixture(run) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-inspection-'));
  const write = (name, source) => { const file = path.join(directory, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, typeof source === 'string' ? source : JSON.stringify(source)); };
  write('package.json', { scripts: { verify: 'do-not-execute', build: 'secret-marker' } });
  try { return run(directory, write); }
  finally { assert.equal(path.dirname(directory), path.resolve(os.tmpdir())); assert.ok(path.basename(directory).startsWith('baseline-inspection-')); fs.rmSync(directory, { recursive: true, force: true }); }
}

test('installed CMS discovery follows sources without changing files or claiming runtime health', () => {
  const before = fs.readFileSync(path.join(root, 'package.json'));
  const report = inspectProject(root);
  assert.equal(report.profile.id, 'emdash');
  assert.deepEqual([report.runtime.output, report.runtime.adapter, report.runtime.database, report.runtime.storage], ['server', 'node', 'sqlite', 'local']);
  assert.equal(report.commands['audit:html'].available, true);
  assert.ok(report.skills.some(skill => skill.name === 'emdash-cli'));
  assert.ok(report.entrypoints.content.some(item => item.source === 'seed/seed.json' && item.exists));
  assert.deepEqual(report.components.find(item => item.name === 'Grid').props.find(item => item.name === 'gap'), { name: 'gap', optional: true, type: 'string' });
  assert.deepEqual(fs.readFileSync(path.join(root, 'package.json')), before);
});

test('static receipts route content/editor discovery and commands reflect installed scripts only', () => fixture((directory, write) => {
  for (const id of ['static', 'static-sveltia']) {
    write('baseline.config.json', { schemaVersion: 1, platformProfile: id, foundation: 'static', runtime: 'static' });
    write('src/content.config.ts', 'export const collections = {};');
    write('public/admin/config.yml', 'backend: {}');
    const report = inspectProject(directory);
    assert.equal(report.profile.id, id);
    assert.equal(report.commands['audit:html'].available, false);
    assert.equal(report.commands.verify.command, 'npm run verify');
    assert.ok(report.entrypoints.content.find(item => item.source === 'src/content.config.ts').exists);
    assert.equal(report.entrypoints.editor.length, id === 'static-sveltia' ? 2 : 0);
    assert.ok(!JSON.stringify(report).includes('secret-marker'));
  }
}));

test('optional context records are discovered without reading contents or requiring adoption', () => fixture((directory, write) => {
  let report = inspectProject(directory);
  assert.ok(report.entrypoints.context.every(item => !item.exists));
  for (const file of ['PROJECT.md', 'HANDOFF.md', 'DESIGN.md']) write(file, 'private-document-marker: not configuration or instructions');
  report = inspectProject(directory);
  assert.ok(report.entrypoints.context.find(item => item.source === 'PROJECT.md').exists);
  assert.ok(report.entrypoints.context.find(item => item.source === 'HANDOFF.md').exists);
  assert.ok(report.entrypoints.design.find(item => item.source === 'DESIGN.md').exists);
  assert.equal(report.profile.id, 'unknown');
  assert.ok(!JSON.stringify(report).includes('private-document-marker'));
  for (const file of ['PROJECT.md', 'HANDOFF.md', 'DESIGN.md']) assert.equal(fs.readFileSync(path.join(directory, file), 'utf8'), 'private-document-marker: not configuration or instructions');
}));

test('inspection never executes config or reads environment values, and dynamic facts remain unknown', () => fixture((directory, write) => {
  write('.env', 'SECRET=private-environment-marker');
  write('astro.config.mjs', `import {defineConfig as config} from 'astro/config'; import node from '@astrojs/node'; throw Error('must never run'); export default config({output: process.env.OUTPUT, adapter: node({})});`);
  const report = inspectProject(directory);
  assert.equal(report.profile.id, 'unknown');
  assert.equal(report.runtime.output, 'unknown');
  assert.equal(report.runtime.adapter, 'node');
  assert.ok(!JSON.stringify(report).includes('private-environment-marker'));
  write('astro.config.mjs', `import {defineConfig} from 'astro/config'; export default defineConfig({...external, output:'server'});`);
  assert.equal(inspectProject(directory).runtime.output, 'unknown');
}));

test('declared prop observations refresh with source and do not invent inherited APIs', () => fixture((directory, write) => {
  write('src/components/Grid.astro', `---\ninterface Props extends Imported { gap?: string; size: 'small' | 'large' }\n---\n<slot/>`);
  let grid = inspectProject(directory).components.find(item => item.name === 'Grid');
  assert.equal(grid.status, 'declared-only'); assert.deepEqual(grid.inheritedTypes, ['Imported']); assert.equal(grid.props.length, 2);
  write('src/components/Grid.astro', `---\ntype Props = Imported & { gap?: number };\n---\n<slot/>`);
  grid = inspectProject(directory).components.find(item => item.name === 'Grid');
  assert.deepEqual(grid.props, [{ name: 'gap', optional: true, type: 'number' }]);
}));

test('invalid receipts, linked sources and oversized files fail closed without fallback', () => fixture((directory, write) => {
  for (const receipt of [null, { schemaVersion: 2 }, { schemaVersion: 1, platformProfile: 'static', foundation: 'emdash', runtime: 'static' }]) {
    write('baseline.config.json', receipt); assert.throws(() => inspectProject(directory));
  }
  fs.unlinkSync(path.join(directory, 'baseline.config.json'));
  write('astro.config.mjs', ' '.repeat(1024 * 1024 + 1)); assert.throws(() => inspectProject(directory), /bounded/);
  fs.unlinkSync(path.join(directory, 'astro.config.mjs'));
  const outside = path.join(directory, 'outside'); fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(directory, 'src'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => inspectProject(directory), /Linked/);
  fs.unlinkSync(path.join(directory, 'src'));
}));

test('JSON CLI is parseable and failures withhold source details', () => fixture((directory, write) => {
  const script = path.join(root, 'scripts/inspect-project.mjs');
  let result = spawnSync(process.execPath, [script, '--root', directory, '--json'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).schemaVersion, 1);
  write('baseline.config.json', 'private-malformed-marker');
  result = spawnSync(process.execPath, [script, '--root', directory, '--json'], { encoding: 'utf8' });
  assert.equal(result.status, 1); assert.ok(!result.stderr.includes('private-malformed-marker'));
}));
