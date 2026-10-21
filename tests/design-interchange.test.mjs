import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validateDesign, checkMapping } from '../scripts/design-interchange.mjs';
test('pinned DESIGN.md bridge validates the neutral specimen and rejects typography/reference losses', async () => {
  const content = await readFile(new URL('../audit/visual-concepts/neutral-interchange/DESIGN.md', import.meta.url), 'utf8');
  assert.equal(validateDesign(content).summary.errors, 0);
  assert.ok(validateDesign(content.replace('fontWeight: 400', 'fontWeight: banana')).summary.errors > 0);
  assert.ok(validateDesign(content.replace('{colors.primary}', '{colors.missing}')).summary.errors > 0);
  assert.ok(validateDesign(content.replace('fontWeight: 400', 'fontWeight: 400\n    fontSize: "clamp(1rem, 2vi, 2rem)"')).summary.errors > 0);
  const mapping = JSON.parse(await readFile(new URL('../audit/visual-concepts/neutral-interchange/mapping.json', import.meta.url), 'utf8'));
  const root = await mkdtemp(path.join(tmpdir(), 'baseline-design-mapping-'));
  try {
    await mkdir(path.join(root, 'src/styles'), { recursive: true });
    const css = await readFile(new URL('./fixtures/design/neutral.css', import.meta.url), 'utf8');
    await writeFile(path.join(root, mapping.source), css);
    assert.equal((await checkMapping(root, mapping)).status, 'current');
    const drift = structuredClone(mapping); drift.mappings[0].value = '#ffffff';
    assert.equal((await checkMapping(root, drift)).status, 'drift');
    await writeFile(path.join(root, mapping.source), css.replace('oklch(43% 0.14 250)', '#ffffff'));
    assert.deepEqual((await checkMapping(root, mapping)).drift, ['--color-action']);
  } finally {
    assert.equal(path.dirname(root), path.resolve(tmpdir()));
    assert.ok(path.basename(root).startsWith('baseline-design-mapping-'));
    await rm(root, { recursive: true, force: true });
  }
});
