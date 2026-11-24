import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const OVERLAP = /\/_emdash\/|['"]\/_image['"]|Cache-Control|exclusive_hook|robots\.txt/;
const EXEMPT = path => path.startsWith('src/dev/') || path === 'src/pages/_styleguide.astro';

function sourceFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const relative = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...sourceFiles(relative));
    else if (/\.(?:m?[jt]sx?|astro)$/.test(entry.name)) out.push(relative);
  }
  return out;
}

function registered() {
  const text = fs.readFileSync(path.join(root, 'docs/emdash-overlap.md'), 'utf8').replaceAll('\r\n', '\n');
  const rows = text.split('\n').filter(line => line.startsWith('| `'));
  return new Set(rows.flatMap(row => [...row.split(' | ')[0].matchAll(/`([^`]+)`/g)].map(match => match[1])));
}

test('every source file that overlaps EmDash behaviour has a row in docs/emdash-overlap.md', () => {
  const listed = registered();
  const overlapping = sourceFiles('src').filter(file => !EXEMPT(file) && OVERLAP.test(fs.readFileSync(path.join(root, file), 'utf8')));
  const missing = overlapping.filter(file => !listed.has(file));
  assert.deepEqual(missing, [], 'Add a row for each file to docs/emdash-overlap.md: what it does with EmDash and what to re-check on an upgrade');
});

test('every row in docs/emdash-overlap.md names a file that exists', () => {
  const stale = [...registered()].filter(file => !fs.existsSync(path.join(root, file)));
  assert.deepEqual(stale, [], 'Remove or rename these rows in docs/emdash-overlap.md');
});
