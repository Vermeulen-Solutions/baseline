import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWorld, WORLD_BAR } from '../scripts/check-art-direction.mjs';

// A neutral brief: a beekeeper who sells honey at the market.
const inventory = 'frame of comb; smoker; jar; lid paper; veil; hive record card; harvest label; market price board; wax; kraft paper; queen dot; batch stamp';
const record = ({ world = true, inventoryList = inventory, motion = 'stamp lands on the label; route draws itself; lid twists', decisions = 3 } = {}) => [
  '# Site', '', '## Art Direction Record', '- **Aesthetic Lane:** Atelier & Craft — the hive as a workshop',
  ...(world ? [
    '- **World:**',
    '  - Source object: the harvest label the beekeeper already stamps by hand',
    `  - Inventory: ${inventoryList}`,
    '  - Objects: home: label hero, hive cards, price board; honeys: jars on a shelf',
    '  - Surfaces: kraft paper with grain; wax with a hexagon edge',
    '  - Type: stamped condensed display; book face; mono for batch codes; display 128px',
    `  - Motion: ${motion}`,
    '  - Photographs: in jar-label windows, warm tone',
    '  - Feature: a honey finder that suggests a jar from taste and use, built from the batch records',
  ] : []),
  '- **Decisions:**',
  ...['Look. Easy: cream ground and one amber accent. Ours: kraft label with a batch stamp',
    'Feature. Easy: a contact form. Ours: a honey finder from the batch records',
    'Content. Easy: a list of products. Ours: each batch with its hive and month'].slice(0, decisions).map(line => `  - ${line}`),
  '', '## Next section',
].join('\n');

test('a complete world and three decisions pass', () => {
  assert.deepEqual(validateWorld(record()), []);
});

test('a missing world block or decisions block is named', () => {
  assert.match(validateWorld(record({ world: false })).join('\n'), /add the "- \*\*World:\*\*" block/);
  assert.match(validateWorld(record({ decisions: 1 })).join('\n'), /Decisions: 1 entry with "Easy: … Ours: …"; write at least 3/);
});

test('a short inventory, too few motions or a placeholder part fails', () => {
  assert.match(validateWorld(record({ inventoryList: 'jar; smoker; veil' })).join('\n'), new RegExp(`lists 3 things; list at least ${WORLD_BAR.inventory}`));
  assert.match(validateWorld(record({ motion: 'stamp lands' })).join('\n'), /at least three motions/);
  assert.match(validateWorld(record().replace('in jar-label windows, warm tone', '<the frames>')).join('\n'), /"Photographs" needs a concrete value/);
});

test('the world block is read only inside the record section', () => {
  const outside = record({ world: false }).replace('## Next section', '## Next section\n- **World:**\n  - Source object: elsewhere');
  assert.match(validateWorld(outside).join('\n'), /add the "- \*\*World:\*\*" block/);
});
