import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';
import { iconExportMap, rewriteIconImports, namedIconImports, summarizeClientBundle } from '../scripts/client-bundles.mjs';

const entry = createRequire(import.meta.url).resolve('@phosphor-icons/react');
const icons = iconExportMap(entry);

test('installed icon exports resolve aliases to public per-icon paths', () => {
  assert.deepEqual(icons.get('ArrowRight'), { specifier: '@phosphor-icons/react/dist/csr/ArrowRight', name: 'ArrowRight' });
  assert.equal(icons.get('ArrowRightIcon').specifier, icons.get('ArrowRight').specifier);
  assert.equal(icons.get('XIcon').specifier, '@phosphor-icons/react/dist/csr/X');
  assert.deepEqual(icons.get('ActivityIcon'), { specifier: '@phosphor-icons/react/dist/csr/Pulse', name: 'PulseIcon' });
  assert.equal(icons.has('IconContext'), false);
  assert.equal(icons.has('SSR'), false);
  assert.ok(icons.size > 1000);
});

test('named imports preserve local names, type imports, unknown exports and other code', () => {
  const source = `// unchanged comment\nimport { ArrowRight as Next, type Icon, XIcon, ActivityIcon as HeartRate, FutureIcon } from '@phosphor-icons/react';\nconst view = <Next />;`;
  const result = rewriteIconImports(source, 'component.tsx', icons);
  assert.match(result.code, /import \{ ArrowRight as Next \} from "@phosphor-icons\/react\/dist\/csr\/ArrowRight";/);
  assert.match(result.code, /import \{ XIcon \} from "@phosphor-icons\/react\/dist\/csr\/X";/);
  assert.match(result.code, /import \{ PulseIcon as HeartRate \} from "@phosphor-icons\/react\/dist\/csr\/Pulse";/);
  assert.match(result.code, /import \{ type Icon, FutureIcon \} from "@phosphor-icons\/react";/);
  assert.ok(result.code.startsWith('// unchanged comment\n'));
  assert.ok(result.code.endsWith('const view = <Next />;'));
  assert.equal(result.map, null);
});

test('namespace and dynamic icon imports stay intact, including custom admin catalogs', () => {
  for (const source of [
    `import * as Icons from '@phosphor-icons/react'; const icon = Icons[name];`,
    `const icons = await import('@phosphor-icons/react');`,
    `import type { ArrowRight } from '@phosphor-icons/react';`,
    `const text = 'import { ArrowRight } from "@phosphor-icons/react"';`,
    `// import { ArrowRight } from '@phosphor-icons/react';`,
    `import { IconContext } from '@phosphor-icons/react';`,
  ]) assert.equal(rewriteIconImports(source, 'component.tsx', icons), undefined, source);
  const source = `import Other, { X } from '@phosphor-icons/react';`;
  assert.match(rewriteIconImports(source, 'component.tsx', icons).code, /import Other from "@phosphor-icons\/react";/);
});

test('build transform resolves from the importer and ignores icon internals and virtual IDs', () => {
  const plugin = namedIconImports();
  const source = `import { Check } from '@phosphor-icons/react';`;
  const file = path.resolve('src/components/test-icon.tsx');
  assert.match(plugin.transform(source, file).code, /dist\/csr\/Check/);
  assert.equal(plugin.transform(source, '\0virtual:test'), undefined);
  assert.equal(plugin.transform(source, path.resolve('node_modules/@phosphor-icons/react/dist/index.es.js')), undefined);
  assert.equal(plugin.transform('<p>Example</p>', file), undefined);
});

test('unsupported package export layouts preserve the original imports', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-icon-exports-'));
  try {
    fs.mkdirSync(path.join(directory, 'dist'));
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ exports: { '.': { import: './dist/index.js' } } }));
    const map = iconExportMap(path.join(directory, 'dist/index.cjs.js'));
    assert.equal(map.size, 0);
    assert.equal(rewriteIconImports(`import { X } from '@phosphor-icons/react';`, 'component.js', map), undefined);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test('bundle report counts static import closure once, handles cycles and excludes dynamic imports/assets', () => {
  const chunk = (fileName, imports, dynamicImports = [], modules = {}) => ({ type: 'chunk', fileName, imports, dynamicImports, modules, code: '/* ' + fileName + ' */' });
  const report = summarizeClientBundle({
    editor: chunk('editor.js', ['shared.js', 'shared.js'], ['admin.js'], { 'C:\\project\\node_modules\\emdash\\src\\components\\InlinePortableTextEditor.tsx': {} }),
    shared: chunk('shared.js', ['editor.js']),
    admin: chunk('admin.js', [], [], { '/project/node_modules/emdash/dist/astro/routes/PluginRegistry.mjs': {} }),
    css: { type: 'asset', fileName: 'style.css', source: 'body{}' },
  });
  const editor = report.entries.find(item => item.roles.includes('inline-editor'));
  assert.equal(editor.staticChunks, 2);
  assert.equal(editor.bytes, Buffer.byteLength('/* editor.js *//* shared.js */'));
  assert.ok(editor.gzipBytes > 0);
  assert.equal(report.chunks.length, 3);
  assert.ok(report.entries.some(item => item.file === 'admin.js' && item.roles.includes('admin')));
  assert.deepEqual(report.chunks.find(item => item.file === 'editor.js').packages, ['emdash']);
  assert.match(report.scope, /Excludes CSS, dynamic imports/);
});
