import test from 'node:test';
import assert from 'node:assert/strict';
import { clusterColours, hex, licenceUse, oklabToRgb, oklchText, parseArgs, pictureFrom, plain, rgbToOklab, slug, sourceLine, vividColours } from '../scripts/design-world.mjs';

test('arguments: search takes words, get takes numbers, palette takes photographs', () => {
  assert.equal(parseArgs(['search', 'enamel sign']).subject, 'enamel sign');
  assert.equal(parseArgs(['search', 'enamel sign', '--limit', '20']).limit, 20);
  assert.deepEqual(parseArgs(['get', '12, 34']).ids, ['12', '34']);
  assert.equal(parseArgs(['get', '12']).out, 'audit/world');
  assert.equal(parseArgs(['palette', 'src/assets/photos', '--colours', '5']).colours, 5);
  assert.throws(() => parseArgs(['get', 'owl']), /not a number from search/);
  assert.throws(() => parseArgs(['search']), /words to look for/);
  assert.throws(() => parseArgs(['palette']), /folder of photographs/);
  assert.throws(() => parseArgs(['draw', 'x']), /search, get or palette/);
  assert.throws(() => parseArgs(['search', 'x', '--limit', '0']), /--limit/);
  assert.equal(parseArgs([]).help, true);
});

test('a picture may be shown on the site only under a public-domain or attribution licence', () => {
  for (const name of ['Public domain', 'CC0', 'PD-old-100', 'No restrictions']) assert.deepEqual([licenceUse(name).use, licenceUse(name).credit], ['site', false], name);
  for (const name of ['CC BY 4.0', 'CC BY 2.0']) assert.deepEqual([licenceUse(name).use, licenceUse(name).credit], ['site', true], name);
  for (const name of ['CC BY-SA 4.0', 'CC BY-NC 2.0', 'GFDL', '', undefined]) assert.equal(licenceUse(name).use, 'look', String(name));
});

test('a search answer becomes a picture with a plain author, and a record line that says what is allowed', () => {
  const picture = pictureFrom({
    pageid: 42, title: 'File:Enseigne émaillée (1920).jpg', index: 2,
    imageinfo: [{ width: 2000, height: 1500, descriptionurl: 'https://commons.wikimedia.org/wiki/File:X.jpg', thumburl: 'https://upload.example/1280px-X.jpg',
      extmetadata: { LicenseShortName: { value: 'CC BY 4.0' }, Artist: { value: '<a href="//example">Jeanne &amp; Paul</a>' }, DateTimeOriginal: { value: '1920' } } }],
  });
  assert.deepEqual([picture.id, picture.title, picture.author, picture.licence.use], ['42', 'Enseigne émaillée (1920).jpg', 'Jeanne & Paul', 'site']);
  assert.equal(slug(picture.title), 'enseigne-emaillee-1920');
  const line = sourceLine('42-enseigne-emaillee-1920.jpg', picture);
  assert.match(line, /^- `42-enseigne-emaillee-1920\.jpg`: Enseigne émaillée \(1920\)\.jpg — Jeanne & Paul, 1920; CC BY 4\.0; may be shown on the site with a credit visitors can see; https:/);
  assert.match(sourceLine('x.jpg', { ...picture, licence: licenceUse('CC BY-SA 4.0') }), /look only, never shown on the site/);
  assert.equal(plain('<b>a</b>&nbsp;b'), 'a b');
});

test('colours convert to OKLab and back, and print as oklch', () => {
  for (const rgb of [[0, 0, 0], [255, 255, 255], [197, 79, 77], [32, 146, 194]]) assert.deepEqual(oklabToRgb(...rgbToOklab(...rgb)), rgb);
  assert.equal(hex([32, 146, 194]), '#2092c2');
  assert.match(oklchText(rgbToOklab(32, 146, 194)), /^oklch\(62% 0\.11\d 23\d\)$/);
  assert.equal(oklchText(rgbToOklab(128, 128, 128)), 'oklch(60% 0.000 0)');
});

test('photograph colours are grouped by share, and the small vivid ones are found on their own', () => {
  const dark = rgbToOklab(20, 18, 16);
  const pale = rgbToOklab(220, 220, 214);
  const blue = rgbToOklab(32, 146, 194);
  const points = [...Array(600).fill(dark), ...Array(380).fill(pale), ...Array(20).fill(blue)];
  const groups = clusterColours(points, 4);
  assert.equal(hex(oklabToRgb(...groups[0].lab)), '#141210');
  assert.ok(Math.abs(groups[0].share - 0.6) < 0.01);
  assert.ok(Math.abs(groups.reduce((sum, group) => sum + group.share, 0) - 1) < 1e-9);
  const vivid = vividColours(points);
  assert.equal(vivid.length, 1);
  assert.equal(hex(oklabToRgb(...vivid[0].lab)), '#2092c2');
  assert.ok(Math.abs(vivid[0].share - 0.02) < 1e-9);
  assert.deepEqual(vividColours([...Array(1000).fill(dark)]), []);
  assert.deepEqual(clusterColours([], 4), []);
});
