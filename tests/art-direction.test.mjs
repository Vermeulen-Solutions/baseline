import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRecord } from '../scripts/check-art-direction.mjs';

// Portable: depends only on scripts/check-art-direction.mjs and synthetic records, so
// generated and older adopting sites can run it (the root design-workflow suite cannot).
const record = `## Art Direction Record
- **Aesthetic Lane:** Custom / existing brand — evolves a dark violet identity into a confident studio presence
- **Narrative Metaphor:** Orbit — the real logo becomes a slowly turning system around the client's project.
- **Typography Pairing:** Display: Clash Display, Body: Satoshi
- **Token Physics:**
  - Canvas: deep violet night page with a raised surface and fine grain
  - Action/Accent: violet action with a rose companion for gradients and focus
  - Borders: hairline white at low opacity, generous card radius
  - Spatial Density: generous section rhythm, dense detail only inside cards
- **Site Anti-Patterns:** no repeated row-and-card skeletons; no placeholder or invented proof; no motion that ignores reduced motion
`;

test('a complete record passes, including a ban that mentions the word "placeholder"', () => {
  assert.deepEqual(validateRecord(record), []);
  assert.deepEqual(validateRecord(record.replaceAll('\n', '\r\n')), []);
});

test('template markers and undecided values are rejected', () => {
  const cases = {
    angleTemplate: record.replace('Orbit — the real logo becomes a slowly turning system around the client\'s project.', '<concrete visual narrative>'),
    squareTemplate: record.replace('Display: Clash Display, Body: Satoshi', 'Display: [family], Body: Satoshi'),
    tbd: record.replace('generous card radius', 'TBD'),
    barePlaceholder: record.replace('Orbit — the real logo becomes a slowly turning system around the client\'s project.', 'placeholder'),
    oneBan: record.replace('no repeated row-and-card skeletons; no placeholder or invented proof; no motion that ignores reduced motion', 'no clutter'),
    missingPhysicsField: record.replace('  - Canvas: deep violet night page with a raised surface and fine grain\n', ''),
  };
  for (const [name, markdown] of Object.entries(cases)) assert.ok(validateRecord(markdown).length, name);
});
