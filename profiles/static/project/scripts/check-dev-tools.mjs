import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { assertReleaseArtifact } from './assert-release-artifact.mjs';

await assertReleaseArtifact(path.resolve('dist'));
const files = await fs.readdir('dist', { recursive: true });
assert.ok(!files.some(file => /(?:^|[\\/])_styleguide(?:[\\/.]|$)/.test(file)), 'Release must omit the styleguide route');
assert.ok(!files.some(file => /(?:^|[\\/])server(?:[\\/]|$)/.test(file)), 'Static output must not contain a server entrypoint');
for (const file of files.filter(file => /\.(html|js|mjs)$/.test(file))) {
  const source = await fs.readFile(path.join('dist', file), 'utf8');
  assert.ok(!/data-styleguide-ready|data-fixture-version/.test(source), `Fixture specimens leaked into ${file}`);
}
console.log('Static release contains no styleguide route, fixture specimens or server entrypoint.');
