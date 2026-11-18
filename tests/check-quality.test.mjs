// Portable: argument, budget, scoring and reporting logic; the fixture-page browser run is opt-in
// (BASELINE_UI_BROWSER_TESTS=1, needs npx playwright install chromium).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_LIMITS, parseArgs, parseBudget, normalRoute, limitsFor, largestShiftWindow, jsonLdTypes,
  crowdedTargets, weightIssues, initBudget, budgetIssues, formatIssue, parseCopyRules, copyMatches,
  jsonLdGraphIssues, metadataIssues, duplicateIssues,
} from '../scripts/check-quality.mjs';

test('JSON-LD graphs: ids defined once, references resolved, no rating on the site\'s own organization', () => {
  const org = { '@type': 'Organization', '@id': 'https://example.test/#org', name: 'Example' };
  const page = { '@context': 'https://schema.org', '@type': 'WebPage', '@id': 'https://example.test/#page', publisher: { '@id': 'https://example.test/#org' } };
  assert.deepEqual(jsonLdGraphIssues([{ '@context': 'https://schema.org', '@graph': [org, page] }]), []);
  assert.deepEqual(jsonLdGraphIssues([page]), ['reference https://example.test/#org is not defined on the page']);
  assert.deepEqual(jsonLdGraphIssues([org, { ...org }]), ['https://example.test/#org is defined 2 times']);
  assert.deepEqual(jsonLdGraphIssues([{ '@type': 'Dentist', name: 'X', aggregateRating: { ratingValue: 5 } }]), [], 'not every LocalBusiness subtype is named; only the common business types are flagged');
  assert.deepEqual(jsonLdGraphIssues([{ '@type': ['ProfessionalService', 'LocalBusiness'], name: 'X', aggregateRating: { ratingValue: 5 } }]), ['self-serving aggregateRating on ProfessionalService/LocalBusiness']);
  assert.deepEqual(jsonLdGraphIssues([{ '@type': 'Product', name: 'X', review: { reviewRating: 5 } }]), [], 'reviews of a product are fine');
});

test('titles and descriptions are sized for search results; noindex pages need only a title', () => {
  const limits = { titleChars: 60, descriptionMinChars: 70, descriptionMaxChars: 160 };
  const ok = { route: '/', title: 'Home | Example', description: 'x'.repeat(100) };
  assert.deepEqual(metadataIssues(ok, limits), []);
  assert.deepEqual(metadataIssues({ ...ok, title: '' }, limits).map(i => [i.kind, i.value]), [['title', 'missing']]);
  assert.deepEqual(metadataIssues({ ...ok, title: 'x'.repeat(61) }, limits).map(i => [i.kind, i.value, i.limit]), [['title', 61, 60]]);
  assert.deepEqual(metadataIssues({ ...ok, description: 'Short.' }, limits).map(i => i.kind), ['description']);
  assert.deepEqual(metadataIssues({ ...ok, description: 'x'.repeat(161) }, limits).map(i => i.limit), [160]);
  assert.deepEqual(metadataIssues({ ...ok, description: '', noindex: true }, limits), []);
});

test('the same title or description on two indexable routes is reported once with every route', () => {
  const m = (route, title, description, noindex = false) => ({ route, title, description, noindex });
  const issues = duplicateIssues([m('/', 'Home', 'Same words'), m('/about', 'About', 'Same words'), m('/contact', 'Contact', 'Same words'), m('/404', 'Home', 'Gone', true)]);
  assert.deepEqual(issues.map(i => [i.kind, i.value]), [['duplicate-description', '3 routes']]);
  assert.match(issues[0].detail, /^\/, \/about, \/contact: "Same words"$/);
});

test('arguments need an origin and routes, and refuse Git Bash path conversion', () => {
  assert.deepEqual(parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', '/,/about']).routes, ['/', '/about']);
  assert.throws(() => parseArgs(['--routes', '/']), /--base must be an http\(s\) origin/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321/about', '--routes', '/']), /--base must be an http\(s\) origin/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321']), /Give --routes/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', 'C:/Program Files/Git/']), /MSYS_NO_PATHCONV/);
  assert.throws(() => parseArgs(['--base', 'http://127.0.0.1:4321', '--routes', '/', '--tabs', '-1']), /--tabs/);
  assert.equal(parseArgs(['--base', 'https://example.test', '--sitemap', '--init']).init, true);
});

test('a budget refuses unknown keys and bad values instead of falling back to a default', () => {
  const budget = parseBudget(JSON.stringify({
    _comment: 'ignored',
    limits: { htmlKB: 200, _note: 'comments are fine' },
    pages: { '/gallery/': { _why: 'photos are the page', imagesKB: 2400 } },
    jsonLd: { '/': ['Organization'] },
    islands: ['/search/'],
  }));
  assert.deepEqual(budget.limits, { htmlKB: 200 });
  assert.deepEqual(budget.pages, { '/gallery': { imagesKB: 2400 } });
  assert.deepEqual(budget.islands, ['/search']);
  assert.throws(() => parseBudget('{"limits":{"htmlKb":200}}'), /htmlKb is not a known limit/);
  assert.throws(() => parseBudget('{"limits":{"htmlKB":"200"}}'), /must be a non-negative number/);
  assert.throws(() => parseBudget('{"limit":{}}'), /unknown key "limit"/);
  assert.throws(() => parseBudget('{"pages":{"gallery":{}}}'), /must start with \//);
  assert.throws(() => parseBudget('{"jsonLd":{"/":"Organization"}}'), /list of type names/);
  assert.throws(() => parseBudget('not json', 'page-budget.json'), /page-budget.json is not valid JSON/);
});

test('limits layer defaults, site limits and one route, with or without a trailing slash', () => {
  const budget = parseBudget(JSON.stringify({ limits: { htmlKB: 200 }, pages: { '/gallery': { imagesKB: 2400 } } }));
  assert.equal(normalRoute('/gallery/'), '/gallery');
  assert.equal(normalRoute('/'), '/');
  assert.equal(normalRoute('/a/?x=1#y'), '/a');
  assert.equal(limitsFor(budget, '/gallery/').imagesKB, 2400);
  assert.equal(limitsFor(budget, '/gallery/').htmlKB, 200);
  assert.equal(limitsFor(budget, '/about').imagesKB, DEFAULT_LIMITS.imagesKB);
  assert.deepEqual(limitsFor(null, '/'), { ...DEFAULT_LIMITS });
});

test('layout shift is the largest session window, ignoring shifts after input', () => {
  assert.equal(largestShiftWindow([]), 0);
  // Two bursts more than a second apart: the larger burst counts, not the total.
  assert.equal(largestShiftWindow([{ value: 0.03, startTime: 100 }, { value: 0.02, startTime: 400 }, { value: 0.04, startTime: 3000 }]), 0.05);
  // A window closes after five seconds even when shifts keep coming.
  const drip = Array.from({ length: 12 }, (_, i) => ({ value: 0.01, startTime: i * 900 }));
  assert.equal(largestShiftWindow(drip), 0.06);
  assert.equal(largestShiftWindow([{ value: 0.3, startTime: 10, hadRecentInput: true }, { value: 0.01, startTime: 20 }]), 0.01);
});

test('JSON-LD types are found in graphs, lists and nested objects', () => {
  const types = jsonLdTypes({ '@context': 'https://schema.org', '@graph': [{ '@type': 'WebPage', breadcrumb: { '@type': 'BreadcrumbList' } }, { '@type': ['Organization', 'https://schema.org/LocalBusiness'] }] });
  assert.deepEqual([...types].sort(), ['BreadcrumbList', 'LocalBusiness', 'Organization', 'WebPage']);
});

test('an undersized target fails only when its 24px circle reaches another target', () => {
  const box = (sig, x, y, width = 16, height = 16) => ({ sig, x, y, width, height });
  assert.deepEqual(crowdedTargets([box('a.big', 0, 0, 44, 44), box('a.far', 200, 0)]), []);
  assert.deepEqual(crowdedTargets([box('a.one', 0, 0), box('a.two', 18, 0)]).map(t => [t.sig, t.neighbour]), [['a.one', 'a.two'], ['a.two', 'a.one']]);
  // 16px icons 30px apart: circles centred 30px apart do not meet.
  assert.deepEqual(crowdedTargets([box('a.one', 0, 0), box('a.two', 30, 0)]), []);
  // A small target right beside a large one fails; the large one does not.
  assert.deepEqual(crowdedTargets([box('a.icon', 0, 0), box('a.button', 18, 0, 120, 44)]).map(t => t.sig), ['a.icon']);
  // A circle that only touches the neighbour (12px from the centre) passes.
  assert.deepEqual(crowdedTargets([box('a.icon', 0, 0), box('a.button', 20, 0, 120, 44)]), []);
});

test('weight issues name the measure, the value and the limit', () => {
  const m = { htmlKB: 160, inlineCssKB: 10, scriptKB: 20, imagesKB: 100, largestImage: { url: '/a.jpg', kb: 450 }, lcpImage: { url: '/a.jpg', kb: 450 }, fontPreloads: [{ url: '/f.ttf', kb: 200 }] };
  const kinds = weightIssues('/', m, DEFAULT_LIMITS).map(i => i.kind);
  assert.deepEqual(kinds, ['html-weight', 'image-weight', 'lcp-image-weight', 'font-preload-format', 'font-preload-weight']);
  assert.match(formatIssue({ kind: 'html-weight', route: '/', value: 160, limit: 150, detail: 'HTML document, decoded KB' }), /html-weight\s+\/ 160 > 150/);
  assert.match(formatIssue({ kind: 'target-size', route: '/', width: 390, value: 'a.x 16x16' }), /\/ @390 a\.x 16x16/);
});

test('budget issues cover layout shift, islands and required JSON-LD types', () => {
  const m = { route: '/', title: 'Home', description: 'A description long enough for search results, about what this page offers.', htmlKB: 10, inlineCssKB: 1, scriptKB: 1, imagesKB: 0, largestImage: null, lcpImage: null, fontPreloads: [], islands: 2, jsonLdTypes: ['WebPage'], layoutShiftPhone: 0.08, layoutShiftDesktop: 0.01 };
  const budget = parseBudget(JSON.stringify({ jsonLd: { '/': ['WebPage', 'Organization'] } }));
  assert.deepEqual(budgetIssues(m, budget).map(i => [i.kind, i.width ?? null]), [['layout-shift', 390], ['island', null], ['json-ld', null]]);
  const allowed = parseBudget(JSON.stringify({ islands: ['/'], limits: { layoutShift: 0.1 } }));
  assert.deepEqual(budgetIssues(m, allowed), []);
});

test('copy rules are validated, matched case-insensitively by default and reported once per rule', () => {
  assert.deepEqual(parseCopyRules(undefined), []);
  assert.deepEqual(parseCopyRules([{ pattern: '\\bwe\\b', why: 'one person' }]), [{ pattern: '\\bwe\\b', flags: 'i', why: 'one person' }]);
  assert.throws(() => parseCopyRules({}), /copy must be a list/);
  assert.throws(() => parseCopyRules([{ why: 'x' }]), /copy\[0\] needs a pattern/);
  assert.throws(() => parseCopyRules([{ pattern: '(' }]), /not a regular expression/);
  assert.throws(() => parseCopyRules([{ pattern: 'x', flags: 'g' }]), /may only use i, m, s and u/);
  const rules = parseCopyRules([{ pattern: '\\bwe\\b', why: 'one person: say I' }, { pattern: 'world-class' }]);
  const found = copyMatches('Hello.\nWe build sites, and we answer fast.\nNothing else.', rules);
  assert.deepEqual(found.map(f => [f.match, f.count]), [['We', 2]]);
  assert.match(found[0].context, /We build sites/);
  const budget = parseBudget(JSON.stringify({ copy: [{ pattern: '\\bwe\\b', why: 'one person: say I' }] }));
  const issues = budgetIssues({ route: '/about', copyText: 'We build sites.', jsonLdTypes: [] }, budget);
  assert.deepEqual(issues.map(i => [i.kind, i.value]), [['copy-rule', '"We"']]);
  assert.match(issues[0].detail, /^one person: say I: …We build sites\.…$/);
  assert.deepEqual(budgetIssues({ route: '/', copyText: 'I build sites.', jsonLdTypes: [] }, budget), []);
});

test('--init writes the median route plus 25%, and gives heavy routes their own entry', () => {
  const route = (r, htmlKB, imagesKB) => ({ route: r, htmlKB, inlineCssKB: 2, scriptKB: 30, imagesKB, largestImage: null, lcpImage: null, fontPreloads: [] });
  const written = initBudget([route('/', 180, 100), route('/about', 170, 120), route('/gallery', 175, 3000)], { jsonLd: { '/': ['Organization'] }, islands: ['/search'], copy: [{ pattern: 'x', flags: 'i', why: '' }] });
  assert.deepEqual(written.copy, [{ pattern: 'x', flags: 'i' }], 'existing copy rules are kept');
  assert.equal(written.limits.htmlKB, 220, 'median 175 plus 25% rounded up to 10');
  assert.equal(written.limits.imagesKB, DEFAULT_LIMITS.imagesKB, 'never below the default');
  assert.equal(written.pages['/gallery'].imagesKB, 3750);
  assert.match(written.pages['/gallery']._why, /imagesKB 3000/);
  assert.deepEqual(written.jsonLd, { '/': ['Organization'] }, 'existing jsonLd is kept');
  assert.deepEqual(written.islands, ['/search']);
  assert.doesNotThrow(() => parseBudget(JSON.stringify(written)), 'what --init writes is a valid budget');
});

if (process.env.BASELINE_UI_BROWSER_TESTS === '1') {
  test('a real browser run finds each defect class on a fixture site', { timeout: 300000 }, async () => {
    const { createServer } = await import('node:http');
    const { checkQuality } = await import('../scripts/check-quality.mjs');
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const big = 'x'.repeat(60 * 1024);
    const clean = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Clean</title>
      <meta name="description" content="A clean fixture page that passes every quality gate, with a description of a sensible length.">
      <style>body { margin: 0; font: 16px/1.5 sans-serif } a { display: inline-block; padding: 12px }</style>
      <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Fixture"}</script>
      </head><body><main><h1>Clean</h1><p>Text with an <a href="/a">inline link</a> in it.</p><a href="/b">Big enough</a>
      <blockquote>We loved working with them.</blockquote><p data-copy-ignore>Our family, as we say.</p><code>we()</code></main></body></html>`;
    const broken = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Broken</title>
      <style>/* ${big} */
        body { margin: 0; font: 16px/1.5 sans-serif }
        header { position: fixed; inset: 0 0 auto 0; height: 120px; background: #fff; z-index: 2 }
        .under { position: absolute; top: 40px; left: 20px }
        .fade { opacity: 0; transition: opacity 2s }
        .icons a { display: inline-block; width: 16px; height: 16px; background: #333 }
        .late { height: 300px; background: #ccc }
      </style>
      <script type="application/ld+json">{ not json }</script>
      </head><body><header>Sticky header</header><a class="under" href="/hidden">Under the header</a>
      <main style="padding-top: 140px"><h1 class="fade">Hidden heading</h1><p>We build websites.</p>
      <p>[[placeholder: opening hours]]</p><h1>A second heading</h1><button onclick="go()">Go</button>
      <a href="javascript:void(0)">Nowhere</a><form action="#"><button>Send</button></form><a href="mailto:hello@example.com">Mail</a>
      <div class="icons"><a href="/1" aria-label="One"></a><a href="/2" aria-label="Two"></a></div>
      <astro-island></astro-island><div id="slot"></div><p>Below</p><p style="height:2000px">Tall</p></main>
      <script>setTimeout(() => { const d = document.createElement('div'); d.className = 'late'; document.getElementById('slot').append(d); }, 300);</script>
      </body></html>`;
    const server = createServer((req, res) => {
      const html = req.url.startsWith('/broken') ? broken : clean;
      const headers = { 'content-type': 'text/html' };
      // Report-only: the broken page's inline script would be blocked, and nothing is.
      if (req.url === '/broken') headers['content-security-policy-report-only'] = "script-src 'self'";
      res.writeHead(['/', '/broken'].includes(req.url) ? 200 : 404, headers);
      res.end(html);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const base = `http://127.0.0.1:${server.address().port}`;
      const budgetFile = path.join(os.tmpdir(), `check-quality-budget-${process.pid}.json`);
      fs.writeFileSync(budgetFile, JSON.stringify({ copy: [{ pattern: '\\bwe\\b', why: 'one person: say I' }] }));
      const options = { ...parseArgs(['--base', base, '--routes', '/,/broken', '--tabs', '10']), budget: budgetFile };
      const { issues, measurements } = await checkQuality(options);
      const on = route => [...new Set(issues.filter(i => i.route === route).map(i => i.kind))].sort();
      assert.deepEqual(on('/'), [], 'the clean page passes');
      assert.deepEqual(on('/broken'), ['copy-rule', 'csp-violation', 'default-identity', 'description', 'first-viewport-hidden', 'focus-obscured', 'form-no-destination', 'inline-css-weight', 'inline-handler', 'island', 'javascript-url', 'json-ld', 'layout-shift', 'multiple-h1', 'placeholder', 'target-size']);
      assert.ok(measurements.find(m => m.route === '/').jsonLdTypes.includes('Organization'));
      assert.ok(issues.some(i => i.kind === 'csp-violation' && /script-src-elem inline/.test(i.value) && /report-only/.test(i.detail)), 'report-only violations are reported');
      assert.ok(issues.some(i => i.kind === 'focus-obscured' && /Under the header/.test(i.value) && /header/.test(i.detail)));
    } finally { server.close(); }
  });
}
