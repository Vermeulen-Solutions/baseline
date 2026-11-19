import test from 'node:test';
import assert from 'node:assert/strict';
import { assessComposition, parseArgs, sectionSignature, formatRoute } from '../scripts/audit-composition.mjs';

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

test('a statement heading counts as a signature moment', () => {
  assert.ok(codes(page([section()])).includes('no-signature'));
  assert.ok(!codes(page([section()], { h2Max: 44 })).includes('no-signature'));
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
