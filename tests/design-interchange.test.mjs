import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateDesign, checkMapping } from '../scripts/design-interchange.mjs';
test('pinned DESIGN.md bridge validates the neutral specimen and rejects typography/reference losses', async () => {
  const content = await readFile(new URL('../audit/visual-concepts/neutral-interchange/DESIGN.md', import.meta.url), 'utf8');
  assert.equal(validateDesign(content).summary.errors, 0);
  assert.ok(validateDesign(content.replace('fontWeight: 400', 'fontWeight: banana')).summary.errors > 0);
  assert.ok(validateDesign(content.replace('{colors.primary}', '{colors.missing}')).summary.errors > 0);
  assert.ok(validateDesign(content.replace('fontWeight: 400', 'fontWeight: 400\n    fontSize: "clamp(1rem, 2vi, 2rem)"')).summary.errors > 0);
  const mapping = JSON.parse(await readFile(new URL('../audit/visual-concepts/neutral-interchange/mapping.json', import.meta.url), 'utf8'));
  assert.equal((await checkMapping(process.cwd(), mapping)).status, 'current');
  const drift = structuredClone(mapping); drift.mappings[0].value = '#ffffff';
  assert.equal((await checkMapping(process.cwd(), drift)).status, 'drift');
});
