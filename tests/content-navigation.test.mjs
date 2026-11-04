import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildToc, slugifyHeading, deduplicateHeadingId } from '../src/lib/headings.ts';
import {
  headingsFromPortableBlocks,
  sanitizeBlockKey,
  decoratePortableHeadingBlocks,
  getPortableHeadingId,
} from '../src/lib/emdash-headings.ts';
import {
  getTargetIdsFromHref,
  linkMatchesHeadingId,
  decodeFragment,
} from '../src/lib/toc.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

test('buildToc: builds nested hierarchy and filters by minDepth / maxDepth', () => {
  const headings = [
    { id: 'h1-title', text: 'Page Title', depth: 1 },
    { id: 'h2-intro', text: 'Introduction', depth: 2 },
    { id: 'h3-overview', text: 'Overview', depth: 3 },
    { id: 'h3-prereq', text: 'Prerequisites', depth: 3 },
    { id: 'h2-usage', text: 'Usage', depth: 2 },
    { id: 'h3-basic', text: 'Basic Example', depth: 3 },
    { id: 'h4-code', text: 'Code Snippet', depth: 4 },
  ];

  // Default: minDepth = 2, maxDepth = 3
  const toc = buildToc(headings);

  assert.equal(toc.length, 2);
  assert.equal(toc[0].id, 'h2-intro');
  assert.equal(toc[0].depth, 2);
  assert.equal(toc[0].children.length, 2);
  assert.equal(toc[0].children[0].id, 'h3-overview');
  assert.equal(toc[0].children[1].id, 'h3-prereq');

  assert.equal(toc[1].id, 'h2-usage');
  assert.equal(toc[1].children.length, 1);
  assert.equal(toc[1].children[0].id, 'h3-basic');
  // h4-code should be excluded by default maxDepth: 3
  assert.equal(toc[1].children[0].children.length, 0);
});

test('buildToc: handles skipped heading levels without throwing', () => {
  const headings = [
    { id: 'h2-section', text: 'Section', depth: 2 },
    // h2 followed directly by h4 (skipped h3)
    { id: 'h4-deep', text: 'Deep Subsection', depth: 4 },
  ];

  const toc = buildToc(headings, { minDepth: 2, maxDepth: 4 });

  assert.equal(toc.length, 1);
  assert.equal(toc[0].id, 'h2-section');
  assert.equal(toc[0].children.length, 1);
  assert.equal(toc[0].children[0].id, 'h4-deep');
  assert.equal(toc[0].children[0].depth, 4);
});

test('buildToc: builds arbitrarily deep trees from depths 1 through 6', () => {
  const deepHeadings = [
    { id: 'h1', text: 'Depth 1', depth: 1 },
    { id: 'h2', text: 'Depth 2', depth: 2 },
    { id: 'h3', text: 'Depth 3', depth: 3 },
    { id: 'h4', text: 'Depth 4', depth: 4 },
    { id: 'h5', text: 'Depth 5', depth: 5 },
    { id: 'h6', text: 'Depth 6', depth: 6 },
  ];

  const toc = buildToc(deepHeadings, { minDepth: 1, maxDepth: 6 });
  assert.equal(toc.length, 1);
  assert.equal(toc[0].depth, 1);
  assert.equal(toc[0].children[0].depth, 2);
  assert.equal(toc[0].children[0].children[0].depth, 3);
  assert.equal(toc[0].children[0].children[0].children[0].depth, 4);
  assert.equal(toc[0].children[0].children[0].children[0].children[0].depth, 5);
  assert.equal(toc[0].children[0].children[0].children[0].children[0].children[0].depth, 6);
});

test('buildToc: ignores empty IDs and whitespace-only text', () => {
  const headings = [
    { id: '', text: 'Missing ID', depth: 2 },
    { id: 'h2-valid', text: '  Valid Heading  ', depth: 2 },
    { id: 'h2-empty', text: '   ', depth: 2 },
  ];

  const toc = buildToc(headings);
  assert.equal(toc.length, 1);
  assert.equal(toc[0].id, 'h2-valid');
  assert.equal(toc[0].text, 'Valid Heading');
});

test('slugifyHeading: generates URL-safe slugs with diacritic and HTML stripping', () => {
  assert.equal(slugifyHeading('Hello World'), 'hello-world');
  assert.equal(slugifyHeading('Crème Brûlée & Café'), 'creme-brulee-cafe');
  assert.equal(slugifyHeading('<code>API</code> Documentation (v2.0)'), 'api-documentation-v20');
  assert.equal(slugifyHeading('Über den Wolken!'), 'uber-den-wolken');
  assert.equal(slugifyHeading('  Trailing and -- multiple   spaces_and-dashes  '), 'trailing-and-multiple-spaces-and-dashes');

  // Quoted attribute containing '>'
  assert.equal(slugifyHeading('<em title="a > b">Hi</em>'), 'hi');

  // Devanagari vowel marks preservation (\p{M})
  const ki = slugifyHeading('कि');
  const kee = slugifyHeading('की');
  assert.notEqual(ki, kee, 'Devanagari vowel signs must not collapse into bare consonant');
  assert.ok(ki.length > 0);
  assert.ok(kee.length > 0);
});

test('deduplicateHeadingId: reserves generated suffixes preventing "Repeat, Repeat, Repeat 2" collisions', () => {
  const seen = new Set();
  const id1 = deduplicateHeadingId('article-repeat', seen);
  const id2 = deduplicateHeadingId('article-repeat', seen);
  const id3 = deduplicateHeadingId('article-repeat-2', seen);

  assert.equal(id1, 'article-repeat');
  assert.equal(id2, 'article-repeat-2');
  assert.equal(id3, 'article-repeat-2-2', 'Generated suffix must be reserved so "Repeat 2" never collides with "Repeat" #2');
  assert.notEqual(id2, id3);
});

test('sanitizeBlockKey: injective escaping prevents collision between "a.b" and "a_2e_b"', () => {
  const keyDot = sanitizeBlockKey('a.b');
  const keyEsc = sanitizeBlockKey('a_2e_b');
  const keyQuestion = sanitizeBlockKey('a?b');

  assert.equal(keyDot, 'a_2e_b');
  assert.equal(keyEsc, 'a_5f_2e_5f_b');
  assert.equal(keyQuestion, 'a_3f_b');

  assert.notEqual(keyDot, keyEsc, 'Injective encoding ensures a.b and a_2e_b do not collide');
  assert.notEqual(keyDot, keyQuestion);
  assert.equal(sanitizeBlockKey('normal-key-123'), 'normal-key-123');
});

test('RichText and emdash-headings: preserves allocated heading IDs when wrapper ID and namespace differ', () => {
  const blocks = [
    {
      _type: 'block',
      _key: 'bk100',
      style: 'h2',
      children: [{ _type: 'span', text: 'Authored Section' }],
    },
    {
      _type: 'block',
      _key: 'bk101',
      style: 'h3',
      children: [{ _type: 'span', text: 'Authored Subsection' }],
    },
  ];

  // 1. Extract TOC with scope 'article'
  const extracted = headingsFromPortableBlocks(blocks, 'article');
  assert.equal(extracted[0].id, 'article-bk100');
  assert.equal(extracted[1].id, 'article-bk101');

  // 2. Simulate <RichText id="review-article" value={blocks} />
  // RichText passes blocks to decoratePortableHeadingBlocks without scopeId override.
  // The wrapper div's id ("review-article") MUST NOT invalidate the allocated "article-*" targets!
  decoratePortableHeadingBlocks(blocks, undefined);

  assert.equal(blocks[0].__emdash_heading_id, 'article-bk100', 'Existing allocated scope is preserved when wrapper id differs');
  assert.equal(blocks[1].__emdash_heading_id, 'article-bk101');
  assert.equal(getPortableHeadingId(blocks[0]), 'article-bk100');
  assert.equal(getPortableHeadingId(blocks[1]), 'article-bk101');

  // 3. Editorial text edit: text changes, but _key and allocated scope remain intact
  blocks[0].children = [{ _type: 'span', text: 'Edited Section Title' }];
  const editedHeadings = headingsFromPortableBlocks(blocks, 'article');
  assert.equal(editedHeadings[0].id, 'article-bk100');
  assert.equal(editedHeadings[0].text, 'Edited Section Title');
  assert.equal(blocks[0].__emdash_heading_id, 'article-bk100');
});

test('decoratePortableHeadingBlocks: deduplicates identical heading IDs', () => {
  const duplicateBlocks = [
    {
      _type: 'block',
      _key: 'intro',
      style: 'h2',
      children: [{ _type: 'span', text: 'Duplicate Section' }],
    },
    {
      _type: 'block',
      _key: 'intro',
      style: 'h2',
      children: [{ _type: 'span', text: 'Duplicate Section Second' }],
    },
  ];

  decoratePortableHeadingBlocks(duplicateBlocks, 'doc');
  assert.equal(duplicateBlocks[0].__emdash_heading_id, 'doc-intro');
  assert.equal(duplicateBlocks[1].__emdash_heading_id, 'doc-intro-2');
});

test('headingsFromPortableBlocks: handles fallback when _key is missing and handles empty inputs', () => {
  const blocksWithoutKey = [
    {
      _type: 'block',
      style: 'h2',
      children: [{ _type: 'span', text: 'Fallback Heading' }],
    },
  ];

  const result = headingsFromPortableBlocks(blocksWithoutKey, 'doc');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'doc-fallback-heading');
  assert.equal(result[0].text, 'Fallback Heading');
  assert.equal(result[0].depth, 2);

  // Empty or invalid input
  assert.deepEqual(headingsFromPortableBlocks([], 'doc'), []);
  assert.deepEqual(headingsFromPortableBlocks(null, 'doc'), []);
  assert.deepEqual(headingsFromPortableBlocks(undefined, 'doc'), []);
});

test('TOC fragment handling: canonical decoding and non-overlapping matching for 100% and 100%25', () => {
  // Canonical decoding test
  assert.equal(decodeFragment('100%25'), '100%');
  assert.equal(decodeFragment('100%2525'), '100%25');
  assert.equal(decodeFragment('100%'), '100%'); // raw fallback on malformed URI

  const mockAnchor = (href) => ({
    getAttribute(name) {
      return name === 'href' ? href : null;
    },
  });

  const link100 = mockAnchor('#100%25');
  const link10025 = mockAnchor('#100%2525');

  // link100 targets "100%", must NOT match "100%25"
  assert.ok(linkMatchesHeadingId(link100, '100%'));
  assert.ok(!linkMatchesHeadingId(link100, '100%25'), 'Link to 100% must never match 100%25');

  // link10025 targets "100%25", must NOT match "100%"
  assert.ok(linkMatchesHeadingId(link10025, '100%25'));
  assert.ok(!linkMatchesHeadingId(link10025, '100%'), 'Link to 100%25 must never match 100%');

  // Raw fallback test
  const linkRaw100 = mockAnchor('#100%');
  assert.ok(linkMatchesHeadingId(linkRaw100, '100%'));
});

test('Component Contracts: Callout, Steps, Heading, TableOfContents, PortableTextHeading', () => {
  const calloutSrc = fs.readFileSync(path.join(ROOT, 'src/components/Callout.astro'), 'utf8');
  assert.ok(!calloutSrc.includes('role="alert"'), 'Callout MUST NOT carry role="alert"');
  assert.ok(calloutSrc.includes('<aside'), 'Callout must be an <aside> element');
  assert.ok(calloutSrc.includes('<p class="callout__title">'), 'Callout must use a styled paragraph title, not a heading tag');
  assert.ok(calloutSrc.includes('<slot />'), 'Callout must use its default slot');
  assert.ok(calloutSrc.includes('margin: 0;'), 'Callout must zero out margin-block to avoid compounding layout gaps');

  const stepsSrc = fs.readFileSync(path.join(ROOT, 'src/components/Steps.astro'), 'utf8');
  assert.ok(stepsSrc.includes('role="list"'), 'Steps must explicitly preserve role="list" on <ol>');
  assert.ok(stepsSrc.includes('value={stepNumber}'), 'Steps must set value on <li> for assistive tech');
  assert.ok(stepsSrc.includes('inset-inline-start:'), 'Steps must use CSS logical properties for connector alignment in RTL');
  assert.ok(stepsSrc.includes('<slot name={item.value} />'), 'Steps must use named slots matching item values');

  const headingSrc = fs.readFileSync(path.join(ROOT, 'src/components/Heading.astro'), 'utf8');
  assert.ok(headingSrc.includes('heading-anchor'), 'Heading must render heading-anchor permalink');
  assert.ok(headingSrc.includes('heading-target'), 'Heading must have heading-target class');
  assert.ok(headingSrc.includes('encodeURIComponent(id)'), 'Heading must URL-encode fragment target');

  const tocSrc = fs.readFileSync(path.join(ROOT, 'src/components/TableOfContents.astro'), 'utf8');
  assert.ok(tocSrc.includes('<nav'), 'TableOfContents must render a semantic <nav>');
  assert.ok(tocSrc.includes('role="list"'), 'TableOfContents must render semantic list with role="list"');
  assert.ok(tocSrc.includes('data-toc-link'), 'TableOfContents links must have data-toc-link');
  assert.ok(tocSrc.includes('encodeURIComponent(node.id)'), 'TableOfContents must URL-encode fragment target');
  assert.ok(tocSrc.includes('--color-link'), 'TableOfContents active link must use --color-link for WCAG AA dark contrast');
  assert.ok(tocSrc.includes('.toc :global(.toc__link)'), 'TableOfContents must use root-scoped global descendant selector for set:html styles');
  assert.ok(!tocSrc.includes('.is-active'), 'TableOfContents must not use .is-active class (ARIA-only contract)');

  const tocLibSrc = fs.readFileSync(path.join(ROOT, 'src/lib/toc.ts'), 'utf8');
  assert.ok(tocLibSrc.includes('aria-current'), 'TOC library must set aria-current="location"');
  assert.ok(tocLibSrc.includes('astro:before-swap'), 'TOC library must clean up on astro:before-swap');
  assert.ok(!tocLibSrc.includes('.classList.add(\'is-active\')'), 'TOC library must not toggle .is-active');
  assert.ok(!tocLibSrc.includes('history.pushState'), 'TOC scroll spy must never mutate browser history');

  const pthPath = path.join(ROOT, 'src/components/PortableTextHeading.astro');
  if (fs.existsSync(pthPath)) {
    const pthSrc = fs.readFileSync(pthPath, 'utf8');
    assert.ok(pthSrc.includes('getPortableHeadingId'), 'PortableTextHeading must import getPortableHeadingId');
    assert.ok(pthSrc.includes('heading-target'), 'PortableTextHeading must have heading-target class');
    assert.ok(pthSrc.includes('has-text-align-center'), 'PortableTextHeading must support center alignment');
    assert.ok(pthSrc.includes('has-text-align-right'), 'PortableTextHeading must support right alignment');
    assert.ok(pthSrc.includes('has-text-align-justify'), 'PortableTextHeading must support justify alignment');
  }

  const rtPath = path.join(ROOT, 'src/components/RichText.astro');
  if (fs.existsSync(rtPath)) {
    const rtSrc = fs.readFileSync(rtPath, 'utf8');
    if (rtSrc.includes('emdash/ui')) {
      assert.ok(rtSrc.includes('PortableTextHeading'), 'RichText must register PortableTextHeading for headings');
      assert.ok(rtSrc.includes('decoratePortableHeadingBlocks'), 'RichText must decorate heading blocks with IDs');
      assert.ok(!rtSrc.includes('attributes.id'), 'RichText must never use attributes.id as heading namespace override');
    }
  }
});
