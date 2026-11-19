import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, parseSitemap, sampleRoutes, aggregate, formatReport } from '../scripts/audit-ui.mjs';

// Portable: argument, sitemap, sampling and reporting logic only; no browser is launched.
test('audit:ui arguments need an origin and a route source, and reject Git Bash path conversion', () => {
  assert.throws(() => parseArgs(['--routes', '/']), /--base/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321']), /--routes, --routes-file or --sitemap/);
  assert.deepEqual(parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', 'C:/Program Files/Git/']).routes, ['/'], 'Git Bash rewrites are undone');
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', 'D:/sites/page']), /MSYS_NO_PATHCONV=1/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--sitemap', '--widths', '100']), /--widths/);
  const options = parseArgs(['--base', 'http://127.0.0.1:4321', '--sitemap', '--sample', '^/news/.+=2', '--hide', '#dev-panel']);
  assert.deepEqual(options.widths, [390, 768, 1440]);
  assert.equal(options.samples[0].keep, 2);
  assert.ok(options.samples[0].pattern.test('/news/a'));
  assert.deepEqual(options.hide, ['#dev-panel']);
});

test('sitemaps and sitemap indexes become paths on the audited origin', () => {
  const index = parseSitemap('<sitemapindex><sitemap><loc>https://example.org/sitemap-pages.xml</loc></sitemap></sitemapindex>');
  assert.equal(index.isIndex, true);
  assert.deepEqual(index.locs, ['/sitemap-pages.xml']);
  const pages = parseSitemap('<urlset><url><loc>https://example.org/</loc></url><url><loc> https://example.org/about/ </loc></url></urlset>');
  assert.deepEqual(pages.locs, ['/', '/about/']);
});

test('sampling keeps every unmatched route and a few of each template', () => {
  const routes = ['/', '/about/', '/news/a', '/news/b', '/news/c', '/news/a', '/en/news/x', '/en/news/y'];
  const kept = sampleRoutes(routes, [{ pattern: /^\/news\/.+/, keep: 2 }, { pattern: /^\/en\/news\/.+/, keep: 1 }]);
  assert.deepEqual(kept, ['/', '/about/', '/news/a', '/news/b', '/en/news/x']);
});

test('issues aggregate per problem with every place they occur', () => {
  const entries = aggregate([
    { kind: 'edge-on-hover', sig: 'article.card', route: '/', width: 1440, gap: 0, left: 0, right: 40, top: 12, text: 'Story' },
    { kind: 'edge-on-hover', sig: 'article.card', route: '/news/', width: 1440, gap: 0, left: 0, right: 40, top: 12, text: 'Story' },
    { kind: 'http', sig: '404', route: '/old', width: 390 },
  ]);
  assert.equal(entries.length, 2);
  assert.deepEqual(entries[0].where, ['1440 /', '1440 /news/']);
  const report = formatReport(entries, 9);
  assert.match(report, /9 route\/width combinations, 2 distinct issue/);
  assert.match(report, /== edge-on-hover: 1/);
});

test('enlarged-text cases default on, can be narrowed or switched off, and reject nonsense', async () => {
  const { parseTextScale, DEFAULT_TEXT_SCALE } = await import('../scripts/audit-ui.mjs');
  const base = ['--base', 'http://127.0.0.1:4321', '--sitemap'];
  assert.deepEqual(parseArgs(base).textScale, parseTextScale(DEFAULT_TEXT_SCALE));
  assert.deepEqual(parseArgs(base).textScale.map(s => `${s.kind}:${s.factor}`), ['root:1.6', 'root:2', 'text:1.5', 'text:2']);
  assert.deepEqual(parseArgs([...base, '--text-scale', 'off']).textScale, []);
  assert.deepEqual(parseArgs([...base, '--text-scale', 'text:2']).textScale, [{ kind: 'text', factor: 2 }]);
  assert.throws(() => parseArgs([...base, '--text-scale', 'zoom:2']), /--text-scale/);
  assert.throws(() => parseArgs([...base, '--text-scale', 'root:1']), /--text-scale/);
  assert.equal(parseArgs(base).contrast, false);
  assert.equal(parseArgs([...base, '--contrast']).contrast, true);
});

test('measurements are reported without splitting one problem into many entries', () => {
  // The pixel note varies per route and width; it must not be part of the aggregation key.
  const entries = aggregate([
    { kind: 'large-text-offscreen', sig: 'h1', detail: 'at text ×2', note: 'spans 34..511 of 390px', route: '/', width: 390 },
    { kind: 'large-text-offscreen', sig: 'h1', detail: 'at text ×2', note: 'spans 32..453 of 320px', route: '/', width: 320 },
  ]);
  assert.equal(entries.length, 1);
  assert.match(formatReport(entries, 2), /h1 at text ×2 \[spans 34\.\.511 of 390px\] — 2×/);
});

test('hover targets survive commas inside :is() and incomplete prefixes', async () => {
  const { splitSelectors, hoverBases } = await import('../scripts/audit-ui.mjs');
  assert.deepEqual(splitSelectors('.a:hover, main :is(.link, p a):hover, [data-x="a,b"] b:hover'), ['.a:hover', 'main :is(.link, p a):hover', '[data-x="a,b"] b:hover']);
  // The part before :hover when it is a whole selector; otherwise the selector without :hover.
  assert.deepEqual(hoverBases(['.card:hover .title', 'main :is(.link, p a):hover', ':is(.a:hover, .b) span', '.x > a:hover']), ['.card', 'main :is(.link, p a)', ':is(.a, .b) span', '.x > a']);
  // A selector that only negates hover has nothing to hover; plain rules are ignored.
  assert.deepEqual(hoverBases(['.menu:not(:hover) a', '.plain']), []);
  assert.deepEqual(hoverBases([':not(:hover)']), []);
});

test('progress lines name the step, width, route and finding count', async () => {
  const { progressLine } = await import('../scripts/audit-ui.mjs');
  assert.equal(progressLine(3, 42, 390, '/contact/', 1), '[3/42] 390 /contact/: 1 finding');
  assert.equal(progressLine(42, 42, 1440, '/', 0), '[42/42] 1440 /: 0 findings');
});

test('hover contrast and clipped images report with their measurements', () => {
  const entries = aggregate([
    { kind: 'hover-low-contrast', sig: 'a.text-link', text: 'All dates', detail: 'needs 4.5:1', note: '1.30:1', route: '/', width: 1440 },
    { kind: 'image-clipped', sig: 'img in div.portrait', text: 'Coach', note: 'image 104x160 in a 104x104 frame', route: '/team/', width: 390 },
    { kind: 'image-clipped', sig: 'img in div.portrait', text: 'Coach', note: 'image 104x160 in a 104x104 frame', route: '/team/', width: 1440 },
  ]);
  assert.equal(entries.length, 2);
  const report = formatReport(entries, 3);
  assert.match(report, /== hover-low-contrast: 1\n {2}a\.text-link "All dates" needs 4\.5:1 \[1\.30:1\]/);
  assert.match(report, /img in div\.portrait "Coach" \[image 104x160 in a 104x104 frame\] — 2×/);
});

test('header controls count as one row until a control starts below the others', async () => {
  const { countRows } = await import('../scripts/audit-ui.mjs');
  // A tall brand link, a button and a language switch, vertically centred on one line.
  assert.equal(countRows([{ top: 10, bottom: 70 }, { top: 18, bottom: 62 }, { top: 18, bottom: 62 }]), 1);
  // The language switch has wrapped under the brand.
  assert.equal(countRows([{ top: 18, bottom: 62 }, { top: 10, bottom: 70 }, { top: 78, bottom: 122 }]), 2);
  assert.equal(countRows([]), 0);
  const entries = aggregate([{ kind: 'large-text-header-wrapped', sig: 'header.site-header', detail: 'at text ×1.5', note: 'controls on 2 rows, 1 at the normal size', route: '/', width: 360 }]);
  assert.match(formatReport(entries, 1), /header\.site-header at text ×1\.5 \[controls on 2 rows, 1 at the normal size\]/);
});

test('--widths auto keeps the given or default widths as the base, and --crop/--band are validated', () => {
  const base = ['--base', 'http://127.0.0.1:4321', '--sitemap'];
  assert.equal(parseArgs(base).autoWidths, false);
  assert.deepEqual(parseArgs([...base, '--widths', 'auto']), { ...parseArgs(base), autoWidths: true });
  const mixed = parseArgs([...base, '--widths', 'auto,320,1440']);
  assert.equal(mixed.autoWidths, true);
  assert.deepEqual(mixed.widths, [320, 1440]);
  assert.throws(() => parseArgs([...base, '--widths', 'auto,100']), /--widths/);
  assert.deepEqual([parseArgs(base).crop, parseArgs(base).band], [15, null]);
  assert.equal(parseArgs([...base, '--band', '200']).band, 200);
  assert.throws(() => parseArgs([...base, '--crop', '0']), /--crop/);
  assert.throws(() => parseArgs([...base, '--band', '-1']), /--band/);
});

test('breakpoints are read from min/max and range media queries as the first width of the wider layout', async () => {
  const { parseBreakpoints } = await import('../scripts/audit-ui.mjs');
  assert.deepEqual(parseBreakpoints([
    '(min-width: 768px)', '(max-width: 767px)', 'screen and (max-width: 767.98px)',
    '(width >= 48rem)', '(600px <= width < 990px)', '(width > 1200px)', '(width <= 30em)',
    'print and (max-width: 500px)', '(min-height: 700px)', '(min-device-width: 900px)', '(prefers-color-scheme: dark)',
  ]), [{ edge: 481, count: 1 }, { edge: 600, count: 1 }, { edge: 768, count: 4 }, { edge: 990, count: 1 }, { edge: 1201, count: 1 }]);
  // A media query list counts each query.
  assert.deepEqual(parseBreakpoints(['(max-width: 599px), (min-width: 1000px) and (max-width: 1099px)']).map(b => b.edge), [600, 1000, 1100]);
});

test('auto widths add one width on each side of the most used breakpoints, merged and capped', async () => {
  const { autoWidths } = await import('../scripts/audit-ui.mjs');
  const edges = [{ edge: 600, count: 2 }, { edge: 610, count: 1 }, { edge: 768, count: 9 }, { edge: 990, count: 3 }, { edge: 1201, count: 1 }];
  assert.deepEqual(autoWidths([390, 768, 1440], edges), { widths: [390, 599, 600, 767, 768, 989, 990, 1200, 1201, 1440], edges: [600, 768, 990, 1201] });
  assert.deepEqual(autoWidths([390], edges, { max: 2 }), { widths: [390, 767, 768, 989, 990], edges: [768, 990] });
  assert.deepEqual(autoWidths([390, 1440], []), { widths: [390, 1440], edges: [] });
});

test('object-position resolves keywords, percentages, lengths and edge offsets', async () => {
  const { objectPosition } = await import('../scripts/audit-ui.mjs');
  assert.deepEqual(objectPosition('50% 50%', -100, -40), [-50, -20]);
  assert.deepEqual(objectPosition('0% 0%', -100, -40), [0, 0]);
  assert.deepEqual(objectPosition('top', -100, -40), [-50, 0]);
  assert.deepEqual(objectPosition('bottom left', -100, -40), [0, -40]);
  assert.deepEqual(objectPosition('10px 25%', -100, -40), [10, -10]);
  assert.deepEqual(objectPosition('right 10px bottom 20%', -100, -40), [-110, -32]);
  assert.deepEqual(objectPosition('calc(50% + 4px) 50%', -100, -40), [-50, -20]);
});

test('cover cropping is measured per side from the natural size, the frame and object-position', async () => {
  const { coverCrop } = await import('../scripts/audit-ui.mjs');
  const round = shares => Object.fromEntries(Object.entries(shares).map(([k, v]) => [k, Math.round(v * 100)]));
  // A 3:2 group photo in a 1000x400 band: the image is 1000x667, 267px of its height hidden.
  assert.deepEqual(round(coverCrop({ naturalWidth: 1500, naturalHeight: 1000, width: 1000, height: 400 })), { top: 20, right: 0, bottom: 20, left: 0 });
  assert.deepEqual(round(coverCrop({ naturalWidth: 1500, naturalHeight: 1000, width: 1000, height: 400, position: '50% 0%' })), { top: 0, right: 0, bottom: 40, left: 0 });
  // A frame with the photo's own shape hides nothing.
  assert.deepEqual(round(coverCrop({ naturalWidth: 1500, naturalHeight: 1000, width: 600, height: 400 })), { top: 0, right: 0, bottom: 0, left: 0 });
  assert.deepEqual(round(coverCrop({ naturalWidth: 1000, naturalHeight: 1000, width: 300, height: 150, position: 'left' })), { top: 25, right: 0, bottom: 25, left: 0 });
});

test('decorations report the content outside their host they touch, not the content inside a drawn ring', async () => {
  const { decorationHits } = await import('../scripts/audit-ui.mjs');
  const host = { left: 100, right: 500, top: 200, bottom: 500 };
  const ring = { rect: { left: 70, right: 530, top: 170, bottom: 530 }, inner: { left: 72, right: 528, top: 172, bottom: 528 }, host };
  const button = { sig: 'a.button', text: 'Contact', rect: { left: 120, right: 220, top: 130, bottom: 168 } };
  const far = { sig: 'p', text: 'Far', rect: { left: 120, right: 400, top: 40, bottom: 60 } };
  const caption = { sig: 'p.caption', text: 'Inside', rect: { left: 120, right: 400, top: 505, bottom: 520 } };
  assert.deepEqual(decorationHits(ring, [button, far, caption]), { outside: 30, hits: [button] });
  // A text glyph has no inner area: anything it touches counts.
  assert.deepEqual(decorationHits({ ...ring, inner: null }, [caption]).hits, [caption]);
  // Within 2px of the host is not "outside".
  assert.deepEqual(decorationHits({ rect: { left: 98, right: 502, top: 198, bottom: 502 }, inner: null, host }, [button]), { outside: 2, hits: [] });
});

test('a decoration clipped by its host or an ancestor only touches what can be drawn', async () => {
  const { decorationHits } = await import('../scripts/audit-ui.mjs');
  // A footer with overflow: clip and a ring reaching 150px above it: the page text above is never painted over.
  const host = { left: 0, right: 800, top: 1000, bottom: 1400 };
  const ring = { rect: { left: 500, right: 900, top: 850, bottom: 1250 }, inner: null, host };
  const above = { sig: 'p', text: 'Last line of the page', rect: { left: 520, right: 780, top: 900, bottom: 920 } };
  const inside = { sig: 'a.button', text: 'Get in touch', rect: { left: 560, right: 700, top: 1040, bottom: 1080 } };
  assert.deepEqual(decorationHits(ring, [above]).hits, [above], 'unclipped, the overlap is reported as before');
  assert.deepEqual(decorationHits({ ...ring, clip: { left: 0, right: 800, top: 1000, bottom: 1400 } }, [above, inside]), { outside: 0, hits: [] });
  // Clipping only one axis still reports what the other axis lets through.
  const sideways = { rect: { left: 700, right: 900, top: 1100, bottom: 1200 }, inner: null, host };
  const right = { sig: 'aside', text: 'Beside', rect: { left: 810, right: 880, top: 1120, bottom: 1140 } };
  assert.deepEqual(decorationHits({ ...sideways, clip: { left: -Infinity, right: Infinity, top: 1000, bottom: 1400 } }, [right]).hits, [right]);
  assert.deepEqual(decorationHits({ ...sideways, clip: { left: 0, right: 800, top: -Infinity, bottom: Infinity } }, [right]).hits, []);
});

test('empty bands are gaps between content on one ground with no rule, measured across empty blocks', async () => {
  const { emptyBands } = await import('../scripts/audit-ui.mjs');
  const block = (sig, top, bottom, extra = {}) => ({ sig, top, bottom, ground: 'white', edgeTop: false, edgeBottom: false, ignored: false, ...extra });
  assert.deepEqual(emptyBands([block('header.page', 0, 300), block('section.groups', 490, 900), block('section.cta', 1000, 1200)], 160), [{ sig: 'header.page → section.groups', gap: 190 }]);
  // A background change or a rule separates the blocks.
  assert.deepEqual(emptyBands([block('a', 0, 300), block('b', 490, 900, { ground: 'beige' })], 160), []);
  assert.deepEqual(emptyBands([block('a', 0, 300, { edgeBottom: true }), block('b', 490, 900)], 160), []);
  // An empty block on the same ground does not hide the gap; one on another ground ends it.
  assert.deepEqual(emptyBands([block('a', 0, 300), block('spacer', null, null), block('b', 500, 900)], 160), [{ sig: 'a → b', gap: 200 }]);
  assert.deepEqual(emptyBands([block('a', 0, 300), block('band', null, null, { ground: 'navy' }), block('b', 500, 900)], 160), []);
  assert.deepEqual(emptyBands([block('a', 0, 300), block('b', 500, 900, { ignored: true }), block('c', 1100, 1200)], 160), []);
});

test('the empty-band limit follows the page section step unless --band fixes it', async () => {
  const { bandThreshold, emptyBands } = await import('../scripts/audit-ui.mjs');
  // A 144px step (9rem at 1440px): a same-ground join of one step passes, two stacked steps do not.
  assert.deepEqual(bandThreshold({ sectionStep: 144 }), { limit: 216, basis: 'section-step', step: 144 });
  const block = (sig, top, bottom) => ({ sig, top, bottom, ground: 'white', edgeTop: false, edgeBottom: false, ignored: false });
  const limit = bandThreshold({ sectionStep: 144 }).limit;
  assert.deepEqual(emptyBands([block('a', 0, 300), block('b', 300 + 144 + 20, 900)], limit), []);
  assert.deepEqual(emptyBands([block('a', 0, 300), block('b', 300 + 288 + 20, 900)], limit), [{ sig: 'a → b', gap: 308 }]);
  // --band is an explicit override; a page without the token keeps the earlier 160px limit.
  assert.deepEqual(bandThreshold({ band: 400, sectionStep: 144 }), { limit: 400, basis: 'fixed' });
  assert.deepEqual(bandThreshold({ band: null, sectionStep: 0 }), { limit: 160, basis: 'fallback' });
});

// Opt-in browser run against a fixture page with one example of each defect class found by eye
// on a real site. Run locally with BASELINE_UI_BROWSER_TESTS=1 (needs npx playwright install chromium).
if (process.env.BASELINE_UI_BROWSER_TESTS === '1') {
  test('a real browser run finds breakpoint-only decorations, cover crops and stacked bands', { timeout: 300000 }, async () => {
    const { createServer } = await import('node:http');
    const { audit } = await import('../scripts/audit-ui.mjs');
    const photo = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#888"/></svg>';
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Fixture</title><style>
      body { margin: 0; font: 16px/1.5 sans-serif; background: #fff; color: #111 }
      section { padding: 100px 24px }
      .actions a { display: inline-block; padding: 8px 16px; background: #eee; color: #111 }
      figure { position: relative; margin: 0 }
      .photo, .texture { display: block; width: 100%; height: 150px; object-fit: cover }
      .portrait { display: block; width: 150px; height: 100px; object-fit: cover }
      .calm { position: relative; margin-top: 200px }
      .calm::after { content: ""; position: absolute; inset: -6px; border: 1px solid #c00 }
      @media (min-width: 700px) and (max-width: 989px) {
        figure { margin-top: 8px }
        figure::before { content: ""; position: absolute; inset: -30px; border: 2px dashed #333 }
      }
    </style></head><body><main>
      <section class="intro"><h1>Fixture</h1><div class="actions"><a href="/contact">Contact</a></div>
        <figure><img class="photo" src="/photo.svg" alt="Group photo"></figure></section>
      <section class="next"><h2>Next</h2><img class="texture" data-audit-crop-ok src="/photo.svg" alt="">
        <img class="portrait" src="/photo.svg" alt="Fitting photo"><p class="calm">A framed note with room around it.</p>
        <p class="nowrap" style="white-space: nowrap">A line that never wraps and runs past a phone screen edge</p></section>
    </main></body></html>`;
    const server = createServer((req, res) => {
      if (req.url === '/photo.svg') { res.writeHead(200, { 'content-type': 'image/svg+xml' }); res.end(photo); return; }
      res.writeHead(req.url === '/' ? 200 : 404, { 'content-type': 'text/html' }); res.end(html);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const base = `http://127.0.0.1:${server.address().port}`;
      const options = parseArgs(['--base', base, '--routes', '/', '--widths', 'auto', '--text-scale', 'off', '--tabs', '0', '--max-hover', '0']);
      const { widths, breakpoints, entries } = await audit(options);
      assert.deepEqual(breakpoints, [700, 990]);
      assert.deepEqual(widths, [390, 699, 700, 768, 989, 990, 1440]);
      const of = kind => entries.filter(e => e.kind === kind);
      const [crop, ...otherCrops] = of('image-cover-cropped');
      assert.equal(crop.sig, 'img in figure');
      assert.equal(crop.detail, 'top+bottom');
      assert.equal(crop.where.length, widths.length);
      assert.deepEqual(otherCrops, [], 'the texture is opted out and the portrait has the shape of the photo');
      const overlaps = of('decoration-overlap');
      assert.deepEqual(overlaps.map(e => [e.sig, e.detail]), [['figure::before', 'touches a']]);
      assert.deepEqual(overlaps[0].where.sort(), ['700 /', '768 /', '989 /']);
      // Text that overflows its own box (the box stays on screen) is measured by its text.
      assert.deepEqual(of('text-offscreen').map(e => [e.sig, e.where]), [['p.nowrap', ['390 /']]]);
      const bands = of('empty-band');
      assert.deepEqual(bands.map(e => [e.sig, e.where]), [['section.intro "Fixture" → section.next "Next"', ['1440 /']]]);
    } finally { server.close(); }
  });
}

test('--open-details is opt-in and opens folds outside the header and navigation', async () => {
  assert.equal(parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', '/']).openDetails, undefined);
  assert.equal(parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', '/', '--open-details']).openDetails, true);
  const { openFolds } = await import('../scripts/audit-ui.mjs');
  const make = (inside) => ({ open: false, closest: selector => (inside && selector.includes(inside) ? {} : null) });
  const folds = [make(null), make('header'), make('nav'), make(null)];
  const previous = globalThis.document;
  globalThis.document = { querySelectorAll: () => folds };
  try { assert.equal(openFolds(), 2); } finally { globalThis.document = previous; }
  assert.deepEqual(folds.map(f => f.open), [true, false, false, true]);
});
