import test from 'node:test';
import assert from 'node:assert/strict';
import { creditLine, KIND_LABEL, licenceAllowed, needsVisibleCredit, orderSets, parseArgs, setKind, setsInCredits } from '../scripts/design-icons.mjs';

test('arguments: search takes a word, get takes set:name ids and a folder', () => {
  assert.equal(parseArgs(['search', 'owl']).subject, 'owl');
  assert.deepEqual(parseArgs(['get', 'game-icons:owl,game-icons:turtle', '--out', 'src/assets/drawn']).ids, ['game-icons:owl', 'game-icons:turtle']);
  assert.throws(() => parseArgs(['get', 'owl', '--out', 'x']), /set:name id/);
  assert.throws(() => parseArgs(['get', 'game-icons:owl']), /--out/);
  assert.throws(() => parseArgs(['draw', 'owl']), /search or get/);
  assert.equal(parseArgs([]).help, true);
});

test('only open licences without share-alike or non-commercial clauses are allowed', () => {
  for (const spdx of ['MIT', 'Apache-2.0', 'CC-BY-3.0', 'CC0-1.0']) assert.equal(licenceAllowed(spdx), true, spdx);
  for (const spdx of ['CC-BY-SA-4.0', 'CC-BY-NC-4.0', 'GPL-3.0', undefined, '?']) assert.equal(licenceAllowed(spdx), false, String(spdx));
  assert.equal(needsVisibleCredit('CC-BY-3.0'), true);
  assert.equal(needsVisibleCredit('MIT'), false);
});

test('credit lines name the set, the author and the licence; the sets in a credits file are read back', () => {
  const info = { name: 'Game Icons', author: { name: 'GameIcons', url: 'https://github.com/game-icons/icons' }, license: { title: 'CC BY 3.0', spdx: 'CC-BY-3.0', url: 'https://example.test/license' } };
  const line = creditLine('game-icons:owl', info);
  assert.match(line, /^- `owl\.svg`: Game Icons \(`game-icons`\), GameIcons, CC BY 3\.0/);
  assert.deepEqual(setsInCredits(`# Drawing credits\n\n${line}\n${creditLine('tabler:bike', { ...info, name: 'Tabler Icons' })}\n`), ['game-icons', 'tabler']);
});

test('--sets keeps a search to the set a site has chosen', () => {
  assert.deepEqual(parseArgs(['search', 'owl', '--sets', 'game-icons, tabler']).sets, ['game-icons', 'tabler']);
});

test('search lists figurative sets first and marks UI and emoji sets', () => {
  assert.equal(setKind('Thematic'), 'figurative');
  assert.equal(setKind('UI 24px'), 'ui');
  assert.equal(setKind('UI Multicolor'), 'ui');
  assert.equal(setKind('Material'), 'ui');
  assert.equal(setKind('Emoji'), 'emoji');
  assert.equal(setKind('Holiday / Seasonal'), 'other');
  assert.equal(setKind(undefined), 'other');
  assert.match(KIND_LABEL.ui, /interface/);
  // The order the catalogue returned for "owl": UI sets, emoji, then the one figurative set at the end.
  const row = (prefix, category, spdx = 'MIT') => ({ prefix, names: ['owl'], info: { category, license: { spdx } } });
  const found = [row('material-symbols', 'Material', 'Apache-2.0'), row('iconoven', 'UI 24px'), row('openmoji', 'Emoji', 'CC-BY-SA-4.0'), row('noto', 'Emoji', 'Apache-2.0'), row('arcticons', 'High Detail', 'CC-BY-SA-4.0'), row('withicons-lunar', 'Holiday / Seasonal'), row('game-icons', 'Thematic', 'CC-BY-3.0')];
  assert.deepEqual(orderSets(found).map((r) => r.prefix), ['game-icons', 'withicons-lunar', 'arcticons', 'material-symbols', 'iconoven', 'noto', 'openmoji']);
  assert.equal(parseArgs(['search', 'owl']).limit, 200);
});
