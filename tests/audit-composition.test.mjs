import test from 'node:test';
import assert from 'node:assert/strict';
import { assessComposition, assessWorldMotion, FLOOR, parseArgs, sectionSignature, formatRoute, softPhotos } from '../scripts/audit-composition.mjs';

const section = (overrides = {}) => ({ tag: 'section', heading: 'A heading', kicker: false, split: false, centered: false, ground: false, action: false, cardGrid: false, list: false, mediaCount: 0, fullBleedMedia: false, width: 1376, ...overrides });
const page = (sections, overrides = {}) => ({ width: 1440, bodySize: 16, h1Size: 72, h2Max: 36, imageCover: 0.2, fullWidthMedia: 0, signature: false, sections, ...overrides });
const codes = (model) => assessComposition(model).map((finding) => finding.code);

test('a templated page is reported: kicker and split openings, card grids, a closing band, no full-width photograph', () => {
  const templated = page([
    section({ kicker: true, split: true, mediaCount: 1 }),
    section({ kicker: true, split: true, cardGrid: true, mediaCount: 3 }),
    section({ kicker: true, split: true, cardGrid: true, mediaCount: 3, ground: true }),
    section({ kicker: true, ground: true }),
    section({ centered: true, action: true, ground: true }),
  ]);
  assert.deepEqual(codes(templated), ['kicker-openings', 'split-openings', 'card-grids', 'no-full-width-media', 'closing-band', 'no-signature']);
});

test('a page with a stage, a ruled list and varied openings is not reported', () => {
  const designed = page([
    section({ fullBleedMedia: true, mediaCount: 1, ground: true }),
    section({ list: true }),
    section({ split: true, mediaCount: 1 }),
    section({ heading: null }),
  ], { h2Max: 96, signature: true });
  assert.deepEqual(codes(designed), []);
});

test('neighbours repeat only when the repeat is structural', () => {
  const twoSplits = page([section({ split: true, mediaCount: 1, ground: true }), section({ split: true, mediaCount: 1, ground: true })], { signature: true });
  assert.deepEqual(codes(twoSplits).filter((c) => c === 'repeated-neighbours'), ['repeated-neighbours']);
  const twoTexts = page([section(), section()], { signature: true });
  assert.deepEqual(codes(twoTexts), [], 'two plain text sections are not a template sign');
  assert.equal(sectionSignature(section({ kicker: true, cardGrid: true, ground: true })), 'kicker|cards|ground');
});

test('photographs at a tenth of the page without one at full width are reported; a page without photographs is not', () => {
  assert.ok(codes(page([section({ mediaCount: 2 })], { imageCover: 0.3, signature: true })).includes('no-full-width-media'));
  assert.ok(!codes(page([section({ mediaCount: 1 })], { imageCover: 0.02, signature: true })).includes('no-full-width-media'));
});

test('a statement heading counts as a signature moment only when it stands out from the other headings', () => {
  assert.ok(codes(page([section()])).includes('no-signature'));
  assert.ok(!codes(page([section()], { h2Max: 44, h2Median: 24 })).includes('no-signature'), 'one heading markedly larger');
  assert.ok(codes(page([section()], { h2Max: 88, h2Median: 88 })).includes('no-signature'), 'every heading equally large is not a statement');
  assert.ok(!codes(page([section()], { h1Size: 200, h2Max: 60, h2Median: 60 })).includes('no-signature'), 'a giant opening line is a statement');
});

test('the split hero and a uniform gallery are reported', () => {
  assert.deepEqual(codes(page([section({ fullBleedMedia: false })], { splitHero: true, signature: true })), ['split-hero']);
  const gallery = assessComposition(page([section()], { uniformGallery: 15, signature: true }));
  assert.equal(gallery[0].code, 'uniform-gallery');
  assert.match(gallery[0].message, /^15 photographs sit in a grid of equal frames/);
});

test('the page heading must be on a phone first screen', () => {
  const model = page([section({ fullBleedMedia: true })], { signature: true, narrow: { width: 390, viewportHeight: 844, h1Bottom: 900 } });
  assert.deepEqual(codes(model), ['first-screen-heading']);
});

test('arguments: routes must be paths, and a Git Bash path rewrite is explained', () => {
  assert.deepEqual(parseArgs(['--base', 'http://127.0.0.1:4321/', '--routes', '/,/about']).routes, ['/', '/about']);
  assert.deepEqual(parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', 'C:/Program Files/Git/']).routes, ['/'], 'Git Bash rewrites are undone');
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', 'D:/sites/page']), /MSYS_NO_PATHCONV/);
  assert.throws(() => parseArgs(['--routes', '/']), /--base/);
});

test('the report names the measurements and each finding', () => {
  const model = page([section({ kicker: true }), section({ kicker: true }), section({ kicker: true })]);
  const text = formatRoute('/', model, assessComposition(model));
  assert.match(text, /^\/: h1 72px, largest h2 36px, body 16px, image cover 0\.2, full-width media 0, 3 sections/);
  assert.match(text, /\[kicker-openings\] 3 sections open with a small label/);
});

test('a page made only of type, photographs and rules is reported as bare; a made world is not', () => {
  const designed = { fullBleedMedia: true, mediaCount: 1, ground: true };
  const bare = page([section(designed)], { signature: true, craft: { elements: 150, voices: 1, surfaces: 0, drawn: 0, rotated: 0, masked: 0, motion: 0 } });
  const finding = assessComposition(bare).find((f) => f.code === 'bare-page');
  assert.deepEqual(finding.missing, ['surface', 'drawn objects', 'three type voices', 'depth', 'motion']);
  const made = page([section(designed)], { signature: true, craft: { elements: 700, voices: 3, surfaces: 4, drawn: 13, rotated: 7, masked: 0, motion: 7 } });
  assert.deepEqual(codes(made), []);
  // Two missing ingredients is a quieter world, not a bare page.
  const calm = page([section(designed)], { signature: true, craft: { elements: 500, voices: 3, surfaces: 2, drawn: 1, rotated: 0, masked: 2, motion: 0 } });
  assert.deepEqual(codes(calm), []);
  assert.match(formatRoute('/', made, []), /700 elements, 3 type voices, 4 surfaces, 13 drawings, 7 rotated or masked, 7 animations/);
});

test('a wide photograph shown wider than its file is soft; one at its own size, or narrow, is not', () => {
  const images = [
    { shown: 1440, natural: 1024, url: 'https://example.org/_astro/bench.abc.webp?v=1' },
    { shown: 1440, natural: 3000, url: '/_astro/lake.webp' },
    { shown: 720, natural: 1024, url: '/_astro/plate.webp' },
    { shown: 800, natural: 0, url: '/_astro/broken.webp' },
  ];
  assert.deepEqual(softPhotos(images), [{ shown: 1440, natural: 1024, src: 'bench.abc.webp' }]);
  // Device pixels count: on a 2x screen the 720px plate needs 1,440 pixels.
  assert.deepEqual(softPhotos(images, 2).map((p) => p.src), ['bench.abc.webp', 'plate.webp']);
  const model = page([section({ fullBleedMedia: true, mediaCount: 1 })], { signature: true, softPhotos: softPhotos(images) });
  assert.deepEqual(codes(model), ['soft-photo']);
});

test('motions named in the record must run; the floor findings are the built world', () => {
  assert.equal(assessWorldMotion([], ['baseline-reveal']), null);
  assert.equal(assessWorldMotion(['stamp-lands', 'route-draws'], ['route-draws', 'stamp-lands', 'baseline-reveal']), null);
  const missing = assessWorldMotion(['stamp-lands', 'route-draws', 'lid-twists'], ['stamp-lands']);
  assert.equal(missing.code, 'world-motion');
  assert.deepEqual(missing.missing, ['route-draws', 'lid-twists']);
  assert.match(missing.message, /`route-draws`, `lid-twists` in World › Motion, and none of them ran/);
  assert.deepEqual([...FLOOR], ['bare-page', 'soft-photo', 'world-motion']);
  assert.equal(parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', '/', '--record', 'site/AGENTS.md']).record, 'site/AGENTS.md');
});
