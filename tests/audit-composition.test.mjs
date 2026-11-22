import test from 'node:test';
import assert from 'node:assert/strict';
import { assessAgainst, assessComposition, assessWorldMotion, FLOOR, itemLayoutKey, longestItemRun, formatAgainst, GAP_MEASURES, parseArgs, sectionSignature, selectedSources, formatRoute, softPhotos, STUDIO_LEVEL } from '../scripts/audit-composition.mjs';

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

test('the page is measured against its selected references: under half of their median is marked', () => {
  const page = { drawn: 2, motion: 19, rotated: 3, masked: 2, surfaces: 4, colours: 18, typeSizes: 18, elements: 191 };
  const refs = [
    { drawn: 10, motion: 141, rotated: 20, masked: 6, surfaces: 5, colours: 41, typeSizes: 24, elements: 654 },
    { drawn: 69, motion: 136, rotated: 40, masked: 20, surfaces: 63, colours: 30, typeSizes: 20, elements: 1113 },
    { drawn: 0, motion: 71, rotated: 4, masked: 4, surfaces: 8, colours: 44, typeSizes: 27, elements: 636 },
  ];
  const gap = assessAgainst(page, refs);
  assert.deepEqual(gap.map((g) => g.key), GAP_MEASURES.map(([key]) => key));
  const by = Object.fromEntries(gap.map((g) => [g.key, g]));
  assert.equal(by.drawn.references, 10);
  assert.equal(by.layers.references, 26);
  assert.deepEqual(gap.filter((g) => g.short).map((g) => g.key), ['drawn', 'motion', 'layers', 'colours', 'elements']);
  assert.match(formatAgainst(gap, 3), /under half on drawn, motion, layers, colours, elements/);
  assert.match(formatAgainst(gap, 3), /→ drawn objects \(SVG or canvas, 32px or more\): 2 here, 10 on the references, 10 at the studio level/);
  assert.deepEqual(assessAgainst(page, []), []);
});

test('quiet references do not lower the level: the page is marked against the studio level too', () => {
  // One trial's references measured 1 drawing, 5.5 animations and 12.5 colours; its home page passed them all.
  const quiet = [
    { drawn: 2, motion: 7, rotated: 2, masked: 3, surfaces: 0, colours: 5, typeSizes: 3, elements: 373 },
    { drawn: 0, motion: 0, rotated: 0, masked: 0, surfaces: 1, colours: 2, typeSizes: 4, elements: 199 },
  ];
  const page = { drawn: 20, motion: 156, rotated: 12, masked: 8, surfaces: 7, colours: 11, typeSizes: 18, elements: 732 };
  const gap = assessAgainst(page, quiet);
  assert.deepEqual(gap.filter((g) => g.short).map((g) => g.key), ['colours']);
  assert.equal(gap.find((g) => g.key === 'colours').studio, STUDIO_LEVEL.colours);
  // A measure neither the references nor the studio level has much of is never marked.
  assert.equal(assessAgainst({ ...page, surfaces: 0 }, quiet).find((g) => g.key === 'surfaces').short, true);
  assert.equal(assessAgainst({ ...page, surfaces: 4 }, quiet).find((g) => g.key === 'surfaces').short, false);
});

test('the selected references are read from the references file, owner references aside', () => {
  const file = [
    '| id | source | kind | first screen | total | verdict |',
    '|---|---|---|---|---|---|',
    '| a | https://maker.test/ | site | 3 | 21 | selected |',
    '| b | https://client.test/ | study | 3 | 20 | selected |',
    '| c | https://old.test/ | owner | 1 | 9 | kept: the owner likes its colours |',
    '| d | https://other.test/ | site | 1 | 9 | rejected: stock photographs |',
  ].join('\n');
  assert.deepEqual(selectedSources(file), [{ id: 'a', url: 'https://maker.test/', kind: 'site' }, { id: 'b', url: 'https://client.test/', kind: 'study' }]);
  assert.equal(parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', '/', '--references', 'audit/references/references.md']).references, 'audit/references/references.md');
});

test('four or more sections built the same way are a repeated run, even on alternating grounds', () => {
  const works = page([
    section({ mediaCount: 1, fullBleedMedia: true }),
    ...Array.from({ length: 6 }, (_, i) => section({ mediaCount: 1, ground: i % 2 === 0 })),
    section({ list: true }),
  ]);
  const run = assessComposition(works).find((finding) => finding.code === 'repeated-run');
  assert.equal(run?.count, 6);
  assert.match(run.message, /Sections 2 to 7 are 6 in a row/);
  const three = page([section({ mediaCount: 1, fullBleedMedia: true }), ...Array.from({ length: 3 }, (_, i) => section({ mediaCount: 1, ground: i % 2 === 0 })), section({ list: true })]);
  assert.ok(!codes(three).includes('repeated-run'));
});

test('a section that sets its entries as tall blocks one after another is a repeated run', () => {
  const works = page([section({ mediaCount: 1, fullBleedMedia: true }), section({ mediaCount: 12, itemRun: 12 }), section({ list: true })]);
  assert.match(assessComposition(works).find((f) => f.code === 'repeated-run')?.message ?? '', /Section 2 sets 12 tall items/);
  assert.ok(!codes(page([section({ mediaCount: 1, fullBleedMedia: true }), section({ mediaCount: 3, itemRun: 3 })])).includes('repeated-run'));
});

test('a reference source may carry a note after its URL', () => {
  const file = ['| id | source | kind | first screen | total | verdict |', '|---|---|---|---|---|---|', '| s | https://client.test/ (case study by a small studio) | study | 3 | 21 | selected |'].join('\n');
  assert.deepEqual(selectedSources(file), [{ id: 's', url: 'https://client.test/', kind: 'study' }]);
});

test('inner pages are held to the references only; the studio level is for the home page', () => {
  const refs = [{ drawn: 2, motion: 12, rotated: 1, masked: 1, surfaces: 1, colours: 8, typeSizes: 8, elements: 400 }];
  const page = { drawn: 3, motion: 20, rotated: 2, masked: 1, surfaces: 2, colours: 12, typeSizes: 12, elements: 300 };
  const inner = assessAgainst(page, refs, { studio: false });
  assert.deepEqual(inner.filter((g) => g.short).map((g) => g.key), []);
  assert.equal(inner[0].studio, null);
  assert.doesNotMatch(formatAgainst(inner, 1), /studio level/);
  assert.ok(assessAgainst(page, refs).some((g) => g.short));
});

test('tall items are compared by how they are laid out, not by their tag and class', () => {
  const item = (overrides = {}) => ({ tag: 'li', cls: 'entry', share: 0.45, pictures: 1, beside: true, ground: 'rgba(0, 0, 0, 0)', ...overrides });
  const bark = 'rgb(40, 30, 20) image';
  // A register in five arrangements on three grounds: portrait beside text, full-width spread, mirrored
  // portrait on bark. No two neighbours are laid out the same way.
  const varied = [item({ ground: bark }), item({ share: 1, beside: false }), item(), item({ ground: bark }), item({ share: 1, beside: false }), item(), item({ ground: bark })];
  assert.equal(longestItemRun([varied]), 1);
  // Seven identical blocks, or blocks that only mirror the picture, are a run.
  assert.equal(longestItemRun([Array.from({ length: 7 }, () => item())]), 7);
  assert.equal(itemLayoutKey(item()), itemLayoutKey(item({ share: 0.42 })), 'a mirror image or a few pixels is the same layout');
  assert.notEqual(itemLayoutKey(item()), itemLayoutKey(item({ pictures: 2 })));
  // Rows are separate containers; a gap (an item that is not tall) breaks a run.
  assert.equal(longestItemRun([[item(), item(), null, item(), item(), item()], [item(), item()]]), 3);
  assert.equal(longestItemRun(undefined), 0);
});

test('a lazy picture that has not loaded is brought into view and waited for, never read from its fallback src', async () => {
  const { loadPendingImages } = await import('../scripts/audit-composition.mjs');
  assert.equal(typeof loadPendingImages, 'function');
  const source = (await import('node:fs')).readFileSync(new URL('../scripts/audit-composition.mjs', import.meta.url), 'utf8');
  // Design trials got soft-photo for a full-width picture: the audit read the 800px src beside the srcset before the browser had chosen a file.
  assert.match(source, /await page\.evaluate\(loadPendingImages\);\s*const model = await page\.evaluate\(measurePage\);/);
  assert.match(source, /url: img\.currentSrc \|\| \(img\.srcset \? '' : img\.src\) \|\| ''/, 'a picture with a srcset counts only by the file the browser chose');
  assert.doesNotMatch(source, /url: img\.currentSrc \|\| img\.src \|\| ''/);
});
