import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRecord, validateRecordDecided } from '../scripts/check-art-direction.mjs';

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

test('the lanes for organisations, places and makers are accepted, and the optional direction fields do not break the record', () => {
  for (const lane of ['Atelier & Craft', 'Civic & Community', 'Club & Fixture']) {
    const withLane = record.replace(/- \*\*Aesthetic Lane:\*\* .+/, `- **Aesthetic Lane:** ${lane} — the visitor's own world, adapted to this site`);
    assert.deepEqual(validateRecord(withLane), [], lane);
  }
  const withIdea = record.trimEnd() + '\n- **Governing Idea:** The term\'s course catalogue: contents page first, courses as coded entries, prices as a rate card\n- **Signature Moments:** Home: one fitted line; course page: the cover at full width\n';
  assert.deepEqual(validateRecord(withIdea), []);
  assert.ok(validateRecord(record.replace(/- \*\*Aesthetic Lane:\*\* .+/, '- **Aesthetic Lane:** Craftsy Vibes — anything')).length, 'an unknown lane is still rejected');
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

test('a second record body pasted into a sentence is rejected, not silently ignored', () => {
  // Seen on a real site: the newer record was spliced into prose, so its heading was not at the
  // start of a line and the gate kept validating the older section at the end of the file.
  const newer = record.replace('Orbit', 'Reply badge').replace('## Art Direction Record\n', '');
  const spliced = `Before client-specific visual work,\nsave a complete \`## Art Direction Record\n\nSelected by the owner.\n\n${newer}\n## Content\n\nText.\n\n${record}`;
  const errors = validateRecord(spliced);
  assert.ok(errors.some(e => /2 record bodies/.test(e)), errors.join(' | '));
  assert.ok(errors.some(e => /pasted into a sentence/.test(e)), errors.join(' | '));
  // Mentioning the heading in prose, as the shipped AGENTS.md does, stays valid.
  assert.deepEqual(validateRecord(`Save a complete \`## Art Direction Record\` with every field.\n\n${record}`), []);
});

test('a record still marked as lane defaults is not decided; the marker elsewhere does not count', () => {
  const marked = record.replace('## Art Direction Record\n', '## Art Direction Record\n\n<!-- art-direction-record: lane defaults from design:tokens. Replace every line with this site\'s decisions, then delete this comment. -->\n\n');
  assert.deepEqual(validateRecord(marked), []);
  assert.equal(validateRecordDecided(marked).length, 1);
  assert.deepEqual(validateRecordDecided(record), []);
  assert.deepEqual(validateRecordDecided(`${record}\n## Notes\n<!-- art-direction-record: lane defaults -->\n`), []);
});
