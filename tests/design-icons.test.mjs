import test from 'node:test';
import assert from 'node:assert/strict';
import { creditLine, licenceAllowed, needsVisibleCredit, parseArgs, setsInCredits } from '../scripts/design-icons.mjs';

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
