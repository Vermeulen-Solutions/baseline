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

test('an advisory about several sections says which ones, by place and heading', () => {
  const grids = page([section({ heading: 'Le club' }), section({ heading: 'Nos soirées', cardGrid: true }), section({ heading: null, cardGrid: true }), section({ heading: 'Venir' })]);
  const finding = assessComposition(grids).find((f) => f.code === 'card-grids');
  assert.match(finding.message, /keep at most one card grid per page\. They are: section 2 \("Nos soirées"\), section 3\.$/);
  const splits = page([section({ heading: 'Un', split: true }), section({ heading: 'Deux' }), section({ heading: 'Trois', split: true }), section({ heading: 'Quatre', split: true })]);
  assert.match(assessComposition(splits).find((f) => f.code === 'split-openings').message, /They are: section 1 \("Un"\), section 3 \("Trois"\), section 4 \("Quatre"\)\.$/);
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
  assert.deepEqual(finding.missing, ['surface', 'drawn objects', 'depth', 'motion']);
  // The number of type voices is not an ingredient: designer-made pages use two as often as three.
  const twoVoices = page([section(designed)], { signature: true, craft: { elements: 600, voices: 2, surfaces: 3, drawn: 4, rotated: 2, masked: 0, motion: 5 } });
  assert.deepEqual(codes(twoVoices), []);
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
  assert.deepEqual([...FLOOR], ['bare-page', 'soft-photo', 'world-motion', 'impression-motion']);
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
  const source = (await import('node:fs')).readFileSync(new URL('../scripts/audit-composition.mjs', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
  // Design trials got soft-photo for a full-width picture: the audit read the 800px src beside the srcset before the browser had chosen a file.
  assert.match(source, /await page\.evaluate\(loadPendingImages\);\s*const model = await page\.evaluate\(measurePage\);/);
  assert.match(source, /url: img\.currentSrc \|\| \(img\.srcset \? '' : img\.src\) \|\| ''/, 'a picture with a srcset counts only by the file the browser chose');
  assert.doesNotMatch(source, /url: img\.currentSrc \|\| img\.src \|\| ''/);
});

test('an impression site must carry a smoothed scroll, moving page changes and a pinned scene', async () => {
  const { assessImpression, FLOOR: floor } = await import('../scripts/audit-composition.mjs');
  assert.ok(floor.includes('impression-motion'));
  const built = { smoothScroll: true, pageTransitions: true, pinnedScenes: 1 };
  const bare = { smoothScroll: false, pageTransitions: false, pinnedScenes: 0 };
  // Other tiers, and an audit with no measured route, are never judged.
  assert.equal(assessImpression('task', [bare]), null);
  assert.equal(assessImpression('editorial', [bare]), null);
  assert.equal(assessImpression(null, [bare]), null);
  assert.equal(assessImpression('impression', []), null);
  assert.equal(assessImpression('impression', [built]), null);
  // A piece counts when any audited route has it: the scene sits on the home page, the scroll and the layer on every page.
  assert.equal(assessImpression('impression', [{ ...built, pinnedScenes: 0 }, built]), null);
  const missing = assessImpression('impression', [bare, { ...bare, smoothScroll: true }]);
  assert.equal(missing.code, 'impression-motion');
  assert.equal(missing.missing.length, 2);
  assert.match(missing.message, /page changes that move/);
  assert.match(missing.message, /a pinned scene/);
  assert.doesNotMatch(missing.message, /a smoothed scroll/);
  assert.equal(assessImpression('impression', [bare]).missing.length, 3);
});

test('an impression scene must change the screen; references are measured once', async () => {
  const { assessImpression, SCENE_CHANGE, parseArgs: parse } = await import('../scripts/audit-composition.mjs');
  const built = { smoothScroll: true, pageTransitions: true, pinnedScenes: 1 };
  // One clock hand turning beside three lines of text: the scene exists and shows nothing.
  const token = assessImpression('impression', [{ ...built, sceneChange: 0.002 }]);
  assert.equal(token.code, 'impression-motion');
  assert.match(token.message, /a pinned scene that carries the subject/);
  assert.match(token.message, /only 0% of the screen changes/);
  // Photographs changing across the stage pass; the best scene on any audited route counts.
  assert.equal(assessImpression('impression', [{ ...built, sceneChange: 0.35 }]), null);
  assert.equal(assessImpression('impression', [{ ...built, sceneChange: 0.01 }, { ...built, sceneChange: 0.58 }]), null);
  assert.equal(assessImpression('impression', [{ ...built, sceneChange: SCENE_CHANGE }]), null);
  // A scene that was not measured (another tier's run, an older report) is not judged on it.
  assert.equal(assessImpression('impression', [built]), null);
  assert.equal(parse(['--base', 'http://127.0.0.1:4321', '--routes', '/', '--references', 'audit/references/references.md', '--refresh-references']).refreshReferences, true);
  const source = (await import('node:fs')).readFileSync(new URL('../scripts/audit-composition.mjs', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
  assert.match(source, /reference-measures\.json/);
  // An arrival that plays once at load has run: animation starts are recorded from the first paint.
  assert.match(source, /addInitScript\(\(\) => \{ window\.__animationsStarted = \[\]/);
  assert.match(source, /const names = new Set\(window\.__animationsStarted \?\? \[\]\)/);
});

test('a label above three headings and an italic word in the page heading are floor findings for a sourced direction only', async () => {
  const { SOURCED_FLOOR, floorCodes } = await import('../scripts/audit-composition.mjs');
  const legibility = ['text-collision', 'text-cut', 'text-squeezed', 'text-tiny', 'text-unreadable', 'text-covered', 'text-against-edge', 'placeholder-text'];
  assert.deepEqual([...SOURCED_FLOOR], ['kicker-openings', 'accent-word', ...legibility]);
  assert.deepEqual(floorCodes(false), [...FLOOR]);
  assert.deepEqual(floorCodes(true), [...FLOOR, 'kicker-openings', 'accent-word', ...legibility]);
  // An accented phrase in some headings and not others is the reflex.
  const accented = page([section()], { accentWord: 'Glycine', accentHeadings: 2, headings: 6 });
  const finding = assessComposition(accented).find((f) => f.code === 'accent-word');
  assert.match(finding.message, /2 of 6 headings set a word or phrase in italics \("Glycine"\) and the rest are set in one style/);
  assert.match(finding.message, /once, in the page heading, on the words the sentence turns on; or as the direction's way of setting every heading/);
  // Earned: once, in the page heading; or as the way every heading is set. No accent at all is no finding either.
  const accentCodes = (extra) => assessComposition(page([section()], extra)).some((f) => f.code === 'accent-word');
  assert.equal(accentCodes({ accentWord: 'Glycine', accentHeadings: 1, headings: 6 }), false);
  assert.equal(accentCodes({ accentWord: 'Glycine' }), false);
  assert.equal(accentCodes({ accentWord: 'works', accentHeadings: 5, headings: 6 }), false);
  assert.equal(accentCodes({ accentWord: 'works', accentHeadings: 2, headings: 2 }), false);
  assert.equal(accentCodes({ accentWord: null }), false);
  // Three labels that only name their section are the finding; a label that carries a fact is not counted.
  const labelled = page([section({ kicker: true }), section({ kicker: true }), section({ kicker: true })]);
  assert.match(assessComposition(labelled).find((f) => f.code === 'kicker-openings').message, /3 sections open with a small label that only names the section\. A label above a heading is earned by a fact the visitor needs: a date, an hour, a price, a count, a distance/);
  assert.equal(assessComposition(page([section({ kicker: true }), section({ kicker: true }), section()])).some((f) => f.code === 'kicker-openings'), false);
  const earned = page([section({ kicker: true, kickerFact: true }), section({ kicker: true, kickerFact: true }), section({ kicker: true, kickerFact: true }), section({ kicker: true })]);
  assert.equal(assessComposition(earned).some((f) => f.code === 'kicker-openings'), false);
  // In the page: a figure or a currency in the label earns it, once a bare index at its start is set aside.
  const source = (await import('node:fs')).readFileSync(new URL('../scripts/audit-composition.mjs', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
  const strip = /const said = before\.textContent\.trim\(\)\.replace\((\/.*\/i), ''\);/.exec(source)?.[1];
  assert.ok(strip, 'the index-stripping expression is in the page code');
  const index = new RegExp(strip.slice(1, strip.lastIndexOf('/')), 'i');
  const fact = (label) => /\d|[€$£]|\bCHF\b/i.test(label.replace(index, ''));
  for (const label of ['Jeudi 26 novembre', '26 novembre · 20h30', 'Depuis 1998', '01 // Forge Tower [392 m]', 'Entrée 15 CHF', '3 concerts ce mois', 'Samedi 8 h – 12 h']) assert.equal(fact(label), true, label);
  for (const label of ['Nos services', '01 // Architecture', '[02] Projets', '03 · Hébergements', '01 Services', 'N° 4 — Atelier', 'La maison']) assert.equal(fact(label), false, label);
});

test('text lying over other text is found from the lines of the page, and a ghost word, a link in its paragraph and a neighbour are not', async () => {
  const { collidingText } = await import('../scripts/audit-composition.mjs');
  const line = (el, text, x, y, w, h, extra = {}) => ({ el, text, x, y, w, h, alpha: 1, inside: [], ...extra });
  // A dial's small caption printed across its large number.
  const dial = [line(0, '079 000 00 00', 100, 400, 260, 30), line(1, 'Bureau 021 000 00 00', 150, 412, 120, 8)];
  assert.deepEqual(collidingText(dial), [{ over: '079 000 00 00', under: 'Bureau 021 000 00 00', y: 412 }]);
  // Two lines of one heading, a link inside its paragraph, and a word beside another share nothing that counts.
  assert.deepEqual(collidingText([line(0, 'Une fuite ?', 0, 0, 400, 80), line(0, 'On arrive.', 0, 60, 400, 80)]), []);
  assert.deepEqual(collidingText([line(0, 'Read the', 0, 0, 200, 14), line(1, 'programme', 60, 0, 70, 14, { inside: [0] })]), []);
  assert.deepEqual(collidingText([line(0, '26', 0, 0, 40, 30), line(1, 'jeu.', 36, 0, 30, 30)]), []);
  // Tight leading lets the boxes of two lines touch by a few pixels: under 40% of the lower one is not a collision.
  assert.deepEqual(collidingText([line(0, 'Quatre pannes,', 0, 0, 400, 40), line(1, 'une réponse.', 0, 30, 400, 40)]), []);
  // A ghost word painted faintly behind a heading is a layer, not a collision; the same word painted solid is one.
  const ghost = [line(0, 'Programme', 0, 0, 600, 120, { alpha: 0.08 }), line(1, 'Cette semaine', 40, 40, 200, 30)];
  assert.deepEqual(collidingText(ghost), []);
  assert.equal(collidingText(ghost.map((b) => ({ ...b, alpha: 1 }))).length, 1);
  // Two elements meeting on several lines are one place.
  const steps = [line(0, 'Les portes', 0, 0, 300, 20), line(0, 'ouvrent', 0, 24, 300, 20), line(1, 'La salle', 0, 4, 300, 20), line(1, 'se remplit', 0, 28, 300, 20)];
  assert.equal(collidingText(steps).length, 1);
  // The same words printed twice in one place (an offset shadow) are one line.
  assert.deepEqual(collidingText([line(0, 'L’Almanach', 0, 0, 300, 60), line(1, 'L’Almanach', 3, 3, 300, 60)]), []);
});

test('text-collision reports the places with the width or the scene they were seen in', () => {
  const model = page([section()], {
    collisions: [{ over: '23:00', under: 'Cinq heures, cinq moments.', y: 2574 }],
    narrow: { width: 390, viewportHeight: 844, h1Bottom: 200, collisions: [{ over: 'Caisse du soir', under: 'Prochain rendez-vous', y: 510 }] },
    impression: { sceneCollisions: [{ over: 'Les portes', under: 'La salle se remplit', y: 3000 }] },
  });
  const finding = assessComposition(model).find((f) => f.code === 'text-collision');
  assert.equal(finding.count, 3);
  assert.match(finding.message, /3 places where one line of text lies over another: "23:00" over "Cinq heures, cinq moments." at 1440px; "Caisse du soir" over "Prochain rendez-vous" at 390px; "Les portes" over "La salle se remplit" in the pinned scene/);
  assert.match(finding.message, /one step's words are gone before the next step's arrive/);
  assert.equal(codes(page([section()], { collisions: [], narrow: { width: 390, viewportHeight: 844, h1Bottom: 200, collisions: [] } })).includes('text-collision'), false);
});

test('the collision measure reads the page from its top, skips unpainted text and leaves a sticky bar out of scene frames', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync(new URL('../scripts/audit-composition.mjs', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
  assert.ok(source.includes('await page.evaluate(() => scrollTo(0, 0));\n    await page.waitForTimeout(150);\n    Object.assign(model, legibility ? await readLegibility(browser, page) : { collisions: collidingText(await page.evaluate(textBoxes)) });'));
  assert.ok(source.includes('el.checkVisibility?.({ visibilityProperty: true }) === false'));
  assert.ok(source.includes('if (f.fixed || f.unknown || (viewportOnly && f.bar)) continue;'));
  assert.ok(source.includes('collidingText(await page.evaluate(textBoxes, { viewportOnly: true }))'));
  // A turned object's lines are kept for the size and width measures and left out of the collisions.
  const { collidingText } = await import('../scripts/audit-composition.mjs');
  const turned = [{ el: 0, text: 'Billet', x: 0, y: 0, w: 200, h: 40, alpha: 1, inside: [], turned: true }, { el: 1, text: 'Caisse du soir', x: 20, y: 10, w: 120, h: 20, alpha: 1, inside: [] }];
  assert.deepEqual(collidingText(turned), []);
});

test('lines cut off, runs squeezed into a few letters and text painted too small are read from the same lines', async () => {
  const { cutText, squeezedText, tinyText } = await import('../scripts/audit-composition.mjs');
  const line = (node, text, y, extra = {}) => ({ el: node, node, chars: text.length, text, x: 20, y, w: 200, h: 14, alpha: 1, size: 16, lost: 0, upright: true, turned: false, ...extra });
  // A ticket wider than the phone: its lines lose part of their width at the screen's edge.
  assert.deepEqual(cutText([line(0, 'Prochain rendez-vous', 100, { lost: 0.78, w: 60 }), line(1, 'Portes', 130, { lost: 0.19, w: 40 })]), [{ text: 'Prochain rendez-vous', lost: 0.78, y: 100 }, { text: 'Portes', lost: 0.19, y: 130 }]);
  // A hair off the edge, a word set very large that bleeds on purpose, a faint line and a line wholly out of sight do not count.
  assert.deepEqual(cutText([line(0, '00h30', 0, { lost: 0.04 }), line(1, 'NUIT', 0, { lost: 0.3, size: 180 }), line(2, 'Programme', 0, { lost: 0.4, alpha: 0.1 }), line(3, 'Menu', 0, { lost: 0.95 })]), []);
  // One run of text wrapped onto three lines of a few letters: a card a few letters wide.
  const card = [line(0, 'Troc de printemps', 0, { size: 28 }), line(0, 'Troc de printemps', 30, { size: 28 }), line(0, 'Troc de printemps', 60, { size: 28 })];
  assert.deepEqual(squeezedText(card), [{ text: 'Troc de printemps', lines: 3, perLine: 5.7, y: 0 }]);
  // Three short lines broken on purpose are three runs; a paragraph in a full column has long lines; a large heading may stack.
  assert.deepEqual(squeezedText([line(0, 'Tout le', 0), line(1, 'village,', 30), line(2, 'sur un fil.', 60)]), []);
  assert.deepEqual(squeezedText([0, 20, 40].map((y) => line(0, 'Chaque mois de juin, la place et la rue se remplissent de tables, de tentes et de monde.', y))), []);
  assert.deepEqual(squeezedText(card.map((b) => ({ ...b, size: 64 }))), []);
  // A plan drawn for a wide screen and scaled to a phone: its labels come out at 5px.
  assert.deepEqual(tinyText([line(0, 'Échallens', 0, { size: 5.4 }), line(1, 'Assens', 20, { size: 8.6 }), line(2, '→', 40, { size: 6 }), line(3, 'Bottens', 60, { size: 5.4, alpha: 0.3 })]), [{ text: 'Échallens', size: 5.4, y: 0 }]);
});

test('a line that cannot be told from the picture behind it is found from its ground, and a flat ground is left to the contrast check', async () => {
  const { linesToSample, unreadableText } = await import('../scripts/audit-composition.mjs');
  const boxes = [
    { el: 0, node: 0, chars: 28, text: 'La terrasse, sous la glycine', x: 112, y: 2244, w: 529, h: 53, alpha: 1, size: 40, upright: true, turned: false, rgb: [238, 235, 226] },
    { el: 1, node: 1, chars: 18, text: 'de mai à septembre', x: 112, y: 2308, w: 146, h: 9, alpha: 0.8, size: 12, upright: true, turned: false, rgb: [237, 235, 226] },
    { el: 2, node: 2, chars: 2, text: 'OK', x: 0, y: 0, w: 30, h: 12, alpha: 1, size: 12, upright: true, turned: false, rgb: [0, 0, 0] },
    { el: 3, node: 3, chars: 9, text: 'Programme', x: 0, y: 40, w: 300, h: 60, alpha: 1, size: 60, upright: true, turned: false, rgb: null },
  ];
  const lines = linesToSample(boxes);
  // Large type is held to 2 to 1, small type to 3 to 1; two letters or an unknown colour are not sampled.
  assert.deepEqual(lines.map((l) => [l.text, l.need]), [['La terrasse, sous la glycine', 2], ['de mai à septembre', 3]]);
  assert.deepEqual(unreadableText(lines, [{ low: 0.7, spread: 57 }, { low: 0.95, spread: 39 }]), [{ text: 'La terrasse, sous la glycine', low: 0.7, y: 2244 }, { text: 'de mai à septembre', low: 0.95, y: 2308 }]);
  // Mostly clear of the picture's light parts, a flat ground, and a line the screenshot did not reach.
  assert.deepEqual(unreadableText(lines, [{ low: 0.14, spread: 49 }, { low: 0.9, spread: 2 }]), []);
  assert.deepEqual(unreadableText(lines, [null, null]), []);
});

test('a letter gone from inside a line that otherwise shows is a candidate for being covered, at that letter', async () => {
  const { coveredText, linesToSample } = await import('../scripts/audit-composition.mjs');
  const letters = [[928, 7], [936, 7], [944, 7], [952, 6], [959, 7], [967, 7], [975, 6], [982, 7], [990, 7]];
  const line = { text: 'Entretien', x: 928, y: 1697, w: 69, h: 7, letters };
  const shown = { low: 0, spread: 3, painted: 0.5, hidden: 0, side: 'left' };
  // A valve's stem drawn through the fifth letter of a tag: the point to look at is that letter's middle.
  assert.deepEqual(coveredText([line], [{ ...shown, struck: [4] }]), [{ text: 'Entretien', hidden: 0.11, letters: 1, x: 963, y: 1701 }]);
  // Every letter shows; or the letters were not read; or the line is three letters long.
  assert.deepEqual(coveredText([line], [{ ...shown, struck: [] }]), []);
  assert.deepEqual(coveredText([line], [shown]), []);
  assert.deepEqual(coveredText([{ ...line, letters: letters.slice(0, 3) }], [{ ...shown, struck: [1] }]), []);
  // Most of the letters gone is a line that cannot be read against its ground, which is another finding's business.
  assert.deepEqual(coveredText([line], [{ ...shown, struck: [1, 2, 4, 6] }]), []);
  // Display type may be set behind an object on purpose: its letters are not handed over.
  const box = { el: 0, node: 0, chars: 9, text: 'Entretien', x: 928, y: 1697, w: 69, h: 7, alpha: 1, lost: 0, upright: true, turned: false, rgb: [0, 0, 0], letters };
  assert.deepEqual(linesToSample([{ ...box, size: 11 }])[0].letters, letters);
  assert.equal(linesToSample([{ ...box, size: 96 }])[0].letters, undefined);
  const source = (await import('node:fs')).readFileSync(new URL('../scripts/audit-composition.mjs', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
  assert.ok(source.includes('await page.evaluate(textBoxes, { letters: true })'));
  assert.ok(source.includes('const gone = (letter) => letter && letter[0] < 0.1 && letter[1] < 0.5 * depth;'));
});

test('a line whose letters do not show at one end, or at all, is a candidate for being covered, with the point to look at', async () => {
  const { coveredText } = await import('../scripts/audit-composition.mjs');
  const lines = [
    { text: 'L’allée du jardin, un samedi de juin.', x: 20, y: 3140, w: 200, h: 10 },
    { text: 'Le bar, à 1h du matin.', x: 20, y: 400, w: 160, h: 10 },
    { text: '28 couverts', x: 40, y: 918, w: 80, h: 10 },
    { text: 'Fermé.', x: 20, y: 600, w: 40, h: 10 },
  ];
  const grounds = [
    // The right quarter shows no letters: the point to look at is in the middle of that quarter.
    { low: 0, spread: 3, painted: 0.2, hidden: 0.25, side: 'right' },
    // Letters from end to end.
    { low: 0, spread: 3, painted: 0.25, hidden: 0, side: 'left' },
    // No letters anywhere: the whole line, looked at in its middle.
    { low: 0, spread: 3, painted: 0, hidden: 1, side: 'left' },
    // A sixteenth of a short line is a full stop, not a cover.
    { low: 0, spread: 3, painted: 0.2, hidden: 0.0625, side: 'right' },
  ];
  assert.deepEqual(coveredText(lines, grounds), [
    { text: 'L’allée du jardin, un samedi de juin.', hidden: 0.25, x: 195, y: 3145 },
    { text: '28 couverts', hidden: 1, x: 80, y: 923 },
  ]);
  // Without the picture of the page as it is painted there is nothing to compare: no candidates.
  assert.deepEqual(coveredText(lines, [{ low: 0, spread: 3 }, null, null, null]), []);
  const source = (await import('node:fs')).readFileSync(new URL('../scripts/audit-composition.mjs', import.meta.url), 'utf8').replaceAll('\r\n', '\n');
  // A candidate counts only when something else than its own element lies on top at that point, and a bar that rides over the page is not that.
  assert.match(source, /covered = hidden\.filter\(\(_, i\) => shown\[i\]\)/);
  assert.match(source, /position === 'fixed' \|\| position === 'sticky'\) return false/);
});

test('a line against the side of its ground is a candidate from the boxes, and words standing in for a missing fact are found', async () => {
  const { edgeText, placeholderText } = await import('../scripts/audit-composition.mjs');
  const line = (node, text, extra = {}) => ({ el: node, node, chars: text.length, text, x: 17, y: 100 + node * 30, w: 200, h: 14, alpha: 1, size: 16, lost: 0, upright: true, turned: false, edge: null, ...extra });
  // A heading that begins where its panel begins, and a line that ends where it ends.
  assert.deepEqual(edgeText([line(0, 'Le chauffage qui tient', { edge: 'left' }), line(1, 'Bureau : 021 000 00 00', { edge: 'right' }), line(2, 'On vient chez vous.')]),
    [{ text: 'Le chauffage qui tient', edge: 'left', x: 17, y: 100, w: 200, h: 14 }, { text: 'Bureau : 021 000 00 00', edge: 'right', x: 17, y: 130, w: 200, h: 14 }]);
  // A word set very large may run to the edge; a faint line, a cut line (reported as cut) and two letters do not count.
  assert.deepEqual(edgeText([line(0, 'ROCHAT', { edge: 'left', size: 180 }), line(1, 'Programme', { edge: 'left', alpha: 0.2 }), line(2, 'Prochain rendez-vous', { edge: 'right', lost: 0.4 }), line(3, 'OK', { edge: 'left' })]), []);
  assert.deepEqual(placeholderText([line(0, 'Bureau : à confirmer'), line(1, '079 __ __ __'), line(2, 'BIENTÔT'), line(3, 'Line-up to be confirmed'), line(4, '079 ------ ------')]).map((p) => p.text),
    ['Bureau : à confirmer', '079 __ __ __', 'BIENTÔT', 'Line-up to be confirmed', '079 ------ ------']);
  // A sentence that says something is coming, a form's blank to fill by hand, a price with a dash and a date range are not placeholders.
  assert.deepEqual(placeholderText([line(0, 'Réservation en ligne bientôt disponible'), line(1, 'N° ______'), line(2, 'CHF 15.–'), line(3, '23h — 05h'), line(4, 'Les prochaines dates à venir')]), []);
});

test('the legibility findings name the lines, the width they were seen at and what to do', () => {
  const model = page([section()], {
    width: 1440,
    legibility: { cut: [], squeezed: [], tiny: [], unreadable: [{ text: 'La terrasse, sous la glycine', low: 0.7, y: 2244 }] },
    narrow: { width: 390, viewportHeight: 844, h1Bottom: 200, collisions: [], legibility: {
      cut: [{ text: 'Prochain rendez-vous', lost: 0.78, y: 100 }],
      squeezed: [{ text: 'Troc de printemps', lines: 3, perLine: 5.7, y: 900 }],
      tiny: [{ text: 'Échallens', size: 5.4, y: 1500 }, { text: 'Assens', size: 5.4, y: 1510 }],
      unreadable: [],
      edge: [{ text: 'Le chauffage qui tient', edge: 'left', y: 4921 }],
      placeholder: [{ text: '079 __ __ __', y: 700 }],
      covered: [{ text: 'L’allée du jardin, un samedi de juin.', hidden: 0.25, y: 3144 }, { text: 'Salle de bains', hidden: 1, y: 3370 }],
    } },
  });
  const more = Object.fromEntries(assessComposition(model).map((f) => [f.code, f]));
  assert.match(more['text-covered'].message, /2 lines of text are hidden behind something laid over them: at 390px "L’allée du jardin, un samedi de juin\." \(25% of the line\), "Salle de bains" \(all of it\)\. Move what covers the words or move the words/);
  assert.match(more['text-against-edge'].message, /1 line of text stands against the edge of the ground they are on: at 390px "Le chauffage qui tient" \(left edge\)\. Give the ground an inner margin/);
  assert.match(more['placeholder-text'].message, /1 line stands in for a fact nobody has given: at 390px "079 __ __ __"\. Leave the element out/);
  const found = Object.fromEntries(assessComposition(model).map((f) => [f.code, f]));
  assert.match(found['text-cut'].message, /1 line of text is cut off by a frame or the edge of the screen: at 390px "Prochain rendez-vous" \(78% cut off\)\. Make the words fit/);
  assert.match(found['text-squeezed'].message, /1 run of text stands in a column a few letters wide: at 390px "Troc de printemps" \(3 lines of 5\.7 characters\)\. Give the text the width/);
  assert.match(found['text-tiny'].message, /2 lines of text are painted under 9px: at 390px "Échallens" \(5\.4px\), "Assens" \(5\.4px\)\. Set no text under 11px\. Where a drawing is scaled down for this width its labels shrink with it/);
  assert.match(found['text-unreadable'].message, /1 line of text cannot be told from the picture behind: at 1440px "La terrasse, sous la glycine"\. Put a ground under the words/);
  assert.equal(found['text-tiny'].count, 2);
  const clean = { cut: [], squeezed: [], tiny: [], unreadable: [] };
  assert.equal(codes(page([section()], { width: 1440, legibility: clean, narrow: { width: 390, viewportHeight: 844, h1Bottom: 200, collisions: [], legibility: clean } })).some((code) => code.startsWith('text-')), false);
});
