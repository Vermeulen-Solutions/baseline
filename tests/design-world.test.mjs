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
  assert.throws(() => parseArgs(['draw', 'x']), /search, get, palette or faces/);
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

test('a busy archive is asked again after a wait, and a search that finds nothing is tried with fewer words', async () => {
  const { broaderSearches, retryDelay } = await import('../scripts/design-world.mjs');
  assert.deepEqual([retryDelay(0), retryDelay(1), retryDelay(2), retryDelay(3)], [5000, 15000, 30000, null]);
  assert.equal(retryDelay(0, '12'), 12000);
  assert.equal(retryDelay(0, '600'), 60000);
  assert.equal(retryDelay(1, 'soon'), 15000);
  assert.deepEqual(broaderSearches('service sticker boiler'), ['service sticker', 'service']);
  assert.deepEqual(broaderSearches('enamel sign'), ['enamel']);
  assert.deepEqual(broaderSearches('manometer'), []);
});

test('a shortlist of faces is a repeatable sample of one kind of lettering, without the faces chosen from memory', async () => {
  const { FACE_CATEGORIES, FACE_POOL, FROM_MEMORY, displayWeight, faceLine, facesInRecord, seededOrder, shortlist, specimenHtml } = await import('../scripts/design-world.mjs');
  assert.ok(FACE_CATEGORIES.includes('stencil') && FACE_CATEGORIES.includes('hand') && FACE_CATEGORIES.includes('lights'));
  for (const kind of FACE_CATEGORIES) {
    assert.ok(FACE_POOL[kind].matches.length > 20, kind);
    assert.ok(FACE_POOL[kind].ids.split(' ').length >= 8, `${kind} has at least a sheet of faces`);
    for (const id of FACE_POOL[kind].ids.split(' ')) assert.match(id, /^[a-z0-9-]+$/);
  }
  const font = (id, extra = {}) => ({ id, family: id.replace(/-/g, ' '), category: 'display', subsets: ['latin'], styles: ['normal'], weights: [400, 700], license: 'OFL-1.1', variable: false, ...extra });
  const catalogue = [...FACE_POOL.stencil.ids.split(' ').map((id) => font(id)), font('oswald'), font('not-in-the-pool')];
  const first = shortlist(catalogue, { category: 'stencil', count: 6, seed: 'site-a/stencil/1' });
  assert.equal(first.length, 6);
  assert.deepEqual(first, shortlist(catalogue, { category: 'stencil', count: 6, seed: 'site-a/stencil/1' }));
  assert.notDeepEqual(first.map((f) => f.id), shortlist(catalogue, { category: 'stencil', count: 6, seed: 'site-b/stencil/1' }).map((f) => f.id));
  for (const face of first) assert.ok(FACE_POOL.stencil.ids.split(' ').includes(face.id) && !FROM_MEMORY.includes(face.id));
  // A face the catalogue no longer has is skipped; a remembered face in a pool is never sampled.
  assert.equal(shortlist([font('tektur')], { category: 'stencil', count: 6, seed: 'x' }).length, 1);
  assert.equal(shortlist([font('bodoni-moda')], { category: 'didone', count: 6, seed: 'x' }).length, 0);
  assert.deepEqual(seededOrder([1, 2, 3, 4, 5], 'a').sort(), [1, 2, 3, 4, 5]);
  assert.equal(displayWeight(font('x', { weights: [300, 400, 600, 800] })), 800);
  assert.equal(displayWeight(font('x', { weights: [400] })), 400);
  const html = specimenHtml([font('tektur', { family: 'Tektur' })], 'Une fuite ? <On arrive>');
  assert.match(html, /fontsource\/fonts\/tektur@latest\/latin-700-normal\.woff2/);
  assert.match(html, /Une fuite \? &lt;On arrive&gt;/);
  const line = faceLine(font('tektur', { family: 'Tektur', variable: true }));
  assert.match(line, /^- Tektur \(`tektur`\): display, OFL-1\.1, weights 400 700, variable; install with `npm install @fontsource-variable\/tektur`$/);
  assert.deepEqual(facesInRecord(`# Faces\n\n## Sheet 1\n\n${line}\n- Share Tech (\`share-tech\`): sans-serif\n`), ['tektur', 'share tech']);
});

test('faces takes a kind of lettering and the line to show', () => {
  assert.equal(parseArgs(['faces', 'stencil', '--text', 'Une fuite ?']).line, 'Une fuite ?');
  assert.deepEqual(parseArgs(['faces', 'hand', '--text', 'x', '--include', 'Caveat, Barlow Condensed']).include, ['Caveat', 'Barlow Condensed']);
  assert.throws(() => parseArgs(['faces', 'serif', '--text', 'x']), /kind of lettering, one of: didone/);
  assert.throws(() => parseArgs(['faces', 'stencil']), /--text/);
  assert.throws(() => parseArgs(['faces']), /kind of lettering/);
});
