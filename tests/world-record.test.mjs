import test from 'node:test';
import assert from 'node:assert/strict';
import { validateWorld, worldMotionNames, WORLD_BAR } from '../scripts/check-art-direction.mjs';

// A neutral brief: a beekeeper who sells honey at the market.
const inventory = 'frame of comb; smoker; jar; lid paper; veil; hive record card; harvest label; market price board; wax; kraft paper; queen dot; batch stamp';
const record = ({ world = true, inventoryList = inventory, motion = '`stamp-lands`: the batch stamp on the label; `route-draws`: the flight path; `lid-twists`: the jar lid on hover', decisions = 3 } = {}) => [
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
  assert.match(validateWorld(record({ motion: 'stamp lands; route draws; lid twists' })).join('\n'), /Motion names 0 animations in backticks; name at least three/);
  assert.match(validateWorld(record().replace('in jar-label windows, warm tone', '<the frames>')).join('\n'), /"Photographs" needs a concrete value/);
});

test('the world block is read only inside the record section', () => {
  const outside = record({ world: false }).replace('## Next section', '## Next section\n- **World:**\n  - Source object: elsewhere');
  assert.match(validateWorld(outside).join('\n'), /add the "- \*\*World:\*\*" block/);
});

test('the motion names are read from the record for the composition audit', () => {
  assert.deepEqual(worldMotionNames(record()), ['stamp-lands', 'route-draws', 'lid-twists']);
  assert.deepEqual(worldMotionNames(record({ world: false })), []);
});

test('only the motions the line describes are promised; the starter\'s own words are never counted', () => {
  // The form design sprints wrote: world motions, then the page transition, the arrival attribute and the scroll library.
  const mixed = '`dial-sweep`: the bezel turns; `stamp-lands`: the age stamp on the door sheet (`CLUB`); `ticket-rises`: the slips enter with `animation-timeline`; plus `curtain` between pages with `data-arrive`, `Lenis` on a desktop, all inside `prefers-reduced-motion`';
  assert.deepEqual(worldMotionNames(record({ motion: mixed })), ['dial-sweep', 'stamp-lands', 'ticket-rises']);
  assert.deepEqual(validateWorld(record({ motion: mixed })), []);
  // Names followed by a bracket are the same form.
  assert.deepEqual(worldMotionNames(record({ motion: '`needle-settles` (the gauge needle), `pipe-draws` (the copper run), `stamp-lands` (the Saturday stamp). Native scroll, no `Lenis`, transition `lift`' })), ['needle-settles', 'pipe-draws', 'stamp-lands']);
  // A starter word is not a world motion even when it is written like one.
  assert.deepEqual(worldMotionNames(record({ motion: '`lift`: between pages; `stamp-lands`: the stamp; `route-draws`: the path; `lid-twists`: the lid' })), ['stamp-lands', 'route-draws', 'lid-twists']);
  assert.match(validateWorld(record({ motion: '`lift`: between pages; `wipe`: back; `stamp-lands`: the stamp' })).join('\n'), /Motion names 1 animation in backticks/);
  // An older record that only lists names keeps every one of them.
  assert.deepEqual(worldMotionNames(record({ motion: '`stamp-lands`, `route-draws` and `lid-twists`' })), ['stamp-lands', 'route-draws', 'lid-twists']);
});

test('the motion tier is a recorded decision with the client\'s words', async () => {
  const { motionTier, validateMotionTier, MOTION_TIERS } = await import('../scripts/check-art-direction.mjs');
  assert.deepEqual([...MOTION_TIERS], ['task', 'editorial', 'impression']);
  const withTier = (line) => record().replace('- **World:**', `${line}\n- **World:**`);
  const impression = withTier('- **Motion Tier:** impression — "We want a site that strikes from the first second"');
  assert.equal(motionTier(impression), 'impression');
  assert.deepEqual(validateMotionTier(impression, { required: true }), []);
  // A new direction must record it; an older record without the line stays valid.
  assert.equal(motionTier(record()), null);
  assert.match(validateMotionTier(record(), { required: true }).join('\n'), /Motion Tier: add the line/);
  assert.deepEqual(validateMotionTier(record()), []);
  // Another word, or no reason, fails whenever the line is there.
  assert.equal(motionTier(withTier('- **Motion Tier:** lively')), 'invalid');
  assert.match(validateMotionTier(withTier('- **Motion Tier:** lively')).join('\n'), /first word must be task, editorial or impression/);
  assert.match(validateMotionTier(withTier('- **Motion Tier:** task')).join('\n'), /quote the client's words/);
  assert.match(validateMotionTier(withTier('- **Motion Tier:** task — <the client\'s words>')).join('\n'), /quote the client's words/);
  // The line is read only inside the record section.
  assert.equal(motionTier(record().replace('## Next section', '## Next section\n- **Motion Tier:** impression — outside the record')), null);
});

test('a new direction names the photographs and saved pictures its world is taken from', async () => {
  const { validateSources, worldSources, SOURCE_BAR } = await import('../scripts/check-art-direction.mjs');
  assert.deepEqual({ ...SOURCE_BAR }, { total: 4, client: 2, world: 2 });
  const withSources = (line) => record().replace('  - Inventory:', `  - Sources: ${line}\n  - Inventory:`);
  const four = '`src/assets/photos/hives.jpg`: painted hive boxes → the numbered ground; `src/assets/photos/jars.jpg`: jars on a shelf → the product row; `audit/world/12-smoker.jpg`: a tin smoker → the display lettering; `audit/world/34-comb.jpg`: a frame of comb → the edge';
  const files = ['src/assets/photos/hives.jpg', 'src/assets/photos/jars.jpg', 'audit/world/12-smoker.jpg', 'audit/world/34-comb.jpg'];
  const exists = (file) => files.includes(file);
  assert.deepEqual(worldSources(withSources(four)), files);
  assert.deepEqual(validateSources(withSources(four), { required: true, exists }), []);
  // An older record without the line stays valid; a new direction must write it.
  assert.equal(worldSources(record()), null);
  assert.deepEqual(validateSources(record()), []);
  assert.match(validateSources(record(), { required: true }).join('\n'), /add "  - Sources: `<file>`/);
  // A file that is not in the site is named, whenever the line is there.
  assert.match(validateSources(withSources(four), { exists: (file) => file !== 'audit/world/34-comb.jpg' }).join('\n'), /Sources names `audit\/world\/34-comb\.jpg`, which is not in the site/);
  // Two of the client's photographs and two saved pictures are the least.
  const clientOnly = '`src/assets/photos/hives.jpg`: boxes → ground; `src/assets/photos/jars.jpg`: jars → row; `src/assets/photos/veil.jpg`: a veil → frame; `src/assets/photos/market.jpg`: the stall → hero';
  assert.match(validateSources(withSources(clientOnly), { exists: () => true }).join('\n'), /names 4 of the client's photographs and 0 saved pictures under audit\/world\//);
  // Windows separators and a leading ./ are read as the same path; words in backticks without an extension are not files.
  assert.deepEqual(worldSources(withSources('`.\\src\\assets\\a.jpg`: x → y; `audit/world/b.png`: the `enamel` sign → z')), ['src/assets/a.jpg', 'audit/world/b.png']);
});

test('a new direction chooses its display face from a specimen sheet', async () => {
  const { displayFace, validateFaces } = await import('../scripts/check-art-direction.mjs');
  const withType = (value) => record().replace('- **World:**', `- **Typography Pairing:** ${value}\n- **World:**`);
  const sheet = '# Faces looked at\n\n## Sheet 1: stencil, "Miel du plateau"\n\n- Stardos Stencil (`stardos-stencil`): display, OFL-1.1\n- Tektur (`tektur`): display, OFL-1.1, variable\n';
  assert.equal(displayFace(withType('Display: Tektur Variable (cut like the hive numbers), Body: Work Sans, Utility: Tektur')), 'Tektur');
  assert.equal(displayFace(withType('Display: "Stardos Stencil", Body: Work Sans')), 'Stardos Stencil');
  assert.equal(displayFace(record()), null);
  assert.deepEqual(validateFaces(withType('Display: Tektur Variable, Body: Work Sans'), { required: true, facesText: sheet }), []);
  // No sheet yet: a new direction is told to make one; an older site is left alone.
  assert.match(validateFaces(withType('Display: Tektur, Body: Work Sans'), { required: true }).join('\n'), /no specimen sheet yet\. Run npm run design:world -- faces/);
  assert.deepEqual(validateFaces(withType('Display: Tektur, Body: Work Sans')), []);
  // A face that is on no sheet is named, with the command that puts it on one.
  assert.match(validateFaces(withType('Display: Bodoni Moda (from the dial), Body: Archivo'), { required: true, facesText: sheet }).join('\n'), /the display face "Bodoni Moda" is on no specimen sheet.*--include "Bodoni Moda"/);
});

test('a third voice is chosen from a specimen sheet too, or left out', async () => {
  const { thirdFace, validateFaces } = await import('../scripts/check-art-direction.mjs');
  const withType = (value) => record().replace('- **World:**', `- **Typography Pairing:** ${value}\n- **World:**`);
  const sheet = '# Faces looked at\n\n## Sheet 1: stencil, "Miel du plateau"\n\n- Tektur (`tektur`): display, OFL-1.1, variable\n\n## Sheet 2: typewriter, "N° 0041"\n\n- Cutive Mono (`cutive-mono`): monospace, OFL-1.1\n';
  assert.equal(thirdFace(withType('Display: Tektur, Body: Work Sans, Utility: IBM Plex Mono (dates, prices)')), 'IBM Plex Mono');
  assert.equal(thirdFace(withType('Display: Tektur, Body: Work Sans; Mono: "Cutive Mono"')), 'Cutive Mono');
  assert.equal(thirdFace(withType('Display: Tektur, Body: Work Sans')), null);
  assert.equal(thirdFace(withType('Display: Tektur, Body: Work Sans, Utility: none')), null);
  // A sentence that says there is none names no family, and the reading face used for labels is not a third voice.
  assert.equal(thirdFace(withType('Display: Tektur, Body: Work Sans. No third voice: labels are set in the reading face')), null);
  assert.equal(thirdFace(withType('Display: Tektur, Body: Work Sans; pas de Utility: les étiquettes restent en Work Sans')), null);
  assert.equal(thirdFace(withType('Display: Tektur, Body: Work Sans, Labels: Work Sans')), null);
  assert.deepEqual(validateFaces(withType('Display: Tektur, Body: Work Sans, Utility: Cutive Mono'), { required: true, facesText: sheet }), []);
  // The display face used again for labels is not a third voice.
  assert.deepEqual(validateFaces(withType('Display: Tektur, Body: Work Sans, Utility: Tektur'), { required: true, facesText: sheet }), []);
  const errors = validateFaces(withType('Display: Tektur, Body: Work Sans, Utility: IBM Plex Mono'), { required: true, facesText: sheet });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /the third voice "IBM Plex Mono" is on no specimen sheet.*Name that picture.*remove the third voice and set the labels in the reading face/);
});
