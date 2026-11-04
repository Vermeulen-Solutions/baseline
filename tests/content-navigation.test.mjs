import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildToc, slugifyHeading } from '../src/lib/headings.ts';
import {
  headingsFromPortableBlocks,
  sanitizeBlockKey,
  decoratePortableHeadingBlocks,
  getPortableHeadingId,
} from '../src/lib/emdash-headings.ts';
import {
  getTargetIdsFromHref,
  linkMatchesHeadingId,
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

test('sanitizeBlockKey: escapes non-alphanumeric chars deterministically avoiding collisions', () => {
  const key1 = sanitizeBlockKey('a.b');
  const key2 = sanitizeBlockKey('a?b');
  assert.equal(key1, 'a_2e_b');
  assert.equal(key2, 'a_3f_b');
  assert.notEqual(key1, key2, 'Distinct keys with special characters must never collide');
  assert.equal(sanitizeBlockKey('normal-key_123'), 'normal-key_123');
});

test('headingsFromPortableBlocks: preserves stable _key across text changes and shares ID with renderer', () => {
  const originalBlocks = [
    {
      _type: 'block',
      _key: 'bk100',
      style: 'h2',
      children: [{ _type: 'span', text: 'Initial Section Title' }],
    },
    {
      _type: 'block',
      _key: 'bk101',
      style: 'normal',
      children: [{ _type: 'span', text: 'Just paragraph body prose.' }],
    },
    {
      _type: 'block',
      _key: 'bk102',
      style: 'h3',
      children: [
        { _type: 'span', text: 'Sub ' },
        { _type: 'span', text: 'Section' },
      ],
    },
  ];

  const headings1 = headingsFromPortableBlocks(originalBlocks, 'article');
  assert.equal(headings1.length, 2);
  assert.equal(headings1[0].id, 'article-bk100');
  assert.equal(headings1[0].text, 'Initial Section Title');
  assert.equal(headings1[0].depth, 2);
  assert.equal(headings1[1].id, 'article-bk102');
  assert.equal(headings1[1].text, 'Sub Section');
  assert.equal(headings1[1].depth, 3);

  // Assert that block was decorated with matching ID for RichText heading rendering
  assert.equal(originalBlocks[0].__emdash_heading_id, 'article-bk100');
  assert.equal(getPortableHeadingId(originalBlocks[0]), 'article-bk100');

  // Now simulate editorial text change: text changes, but _key remains identical
  const editedBlocks = [
    {
      _type: 'block',
      _key: 'bk100',
      style: 'h2',
      children: [{ _type: 'span', text: 'Refined Section Title' }],
    },
  ];

  const headings2 = headingsFromPortableBlocks(editedBlocks, 'article');
  assert.equal(headings2.length, 1);
  // Anchor ID MUST remain article-bk100 so incoming links do not break
  assert.equal(headings2[0].id, 'article-bk100');
  assert.equal(headings2[0].text, 'Refined Section Title');
  assert.equal(editedBlocks[0].__emdash_heading_id, 'article-bk100');
  assert.equal(getPortableHeadingId(editedBlocks[0]), 'article-bk100');
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

test('TOC fragment handling: isolates malformed URIs (#100%) and handles literal %20', () => {
  // 100% is malformed URI sequence, should not throw
  const ids100 = getTargetIdsFromHref('#100%');
  assert.deepEqual(ids100, ['100%']);

  // test%20me produces both literal and decoded
  const idsEncoded = getTargetIdsFromHref('#test%20me');
  assert.ok(idsEncoded.includes('test%20me'));
  assert.ok(idsEncoded.includes('test me'));

  // linkMatchesHeadingId with mock anchor
  const mockAnchor = (href) => ({
    getAttribute(name) {
      return name === 'href' ? href : null;
    },
  });

  assert.ok(linkMatchesHeadingId(mockAnchor('#100%'), '100%'));
  assert.ok(linkMatchesHeadingId(mockAnchor('#100%25'), '100%'));
  assert.ok(linkMatchesHeadingId(mockAnchor('#test%20me'), 'test%20me'));
  assert.ok(linkMatchesHeadingId(mockAnchor('#test%20me'), 'test me'));
  assert.ok(linkMatchesHeadingId(mockAnchor('#test%2520me'), 'test%20me'));
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
  }

  const rtPath = path.join(ROOT, 'src/components/RichText.astro');
  if (fs.existsSync(rtPath)) {
    const rtSrc = fs.readFileSync(rtPath, 'utf8');
    if (rtSrc.includes('emdash/ui')) {
      assert.ok(rtSrc.includes('PortableTextHeading'), 'RichText must register PortableTextHeading for headings');
      assert.ok(rtSrc.includes('decoratePortableHeadingBlocks'), 'RichText must decorate heading blocks with IDs');
    }
  }
});
