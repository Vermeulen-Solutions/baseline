import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { getViteConfig } from 'astro/config';
import { createServer } from 'vite';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';

function queryAll(node, predicate) {
  const matches = [];
  const walk = (curr) => {
    if (!curr) return;
    if (predicate(curr)) matches.push(curr);
    if (curr.childNodes) {
      for (const child of curr.childNodes) walk(child);
    }
  };
  walk(node);
  return matches;
}

function queryOne(node, predicate) {
  return queryAll(node, predicate)[0] || null;
}

function getAttr(node, name) {
  return node?.attrs?.find(a => a.name === name)?.value;
}

function hasClass(node, className) {
  const classes = (getAttr(node, 'class') || '').split(/\s+/).filter(Boolean);
  return classes.includes(className);
}

function getTextContent(node) {
  if (!node) return '';
  if (node.nodeName === '#text') return node.value;
  return (node.childNodes || []).map(getTextContent).join('');
}

let server;
let container;
let cardMod;
let sectionMod;
let containerMod;
let disclosureMod;

test.before(async () => {
  // Use a minimal CMS-free configuration (configFile: false) so primitive rendering tests retain isolation
  const viteConfig = await getViteConfig({}, { configFile: false })({ command: 'serve', mode: 'development' });
  server = await createServer({
    ...viteConfig,
    server: { middlewareMode: true },
    appType: 'custom',
  });
  container = await AstroContainer.create();

  cardMod = await server.ssrLoadModule('./src/components/Card.astro');
  sectionMod = await server.ssrLoadModule('./src/components/Section.astro');
  containerMod = await server.ssrLoadModule('./src/components/Container.astro');
  disclosureMod = await server.ssrLoadModule('./src/components/Disclosure.astro');
});

test.after(async () => {
  if (server) await server.close();
});

test('Card renders semantic article, heading hierarchy, clickable parent and attribute proxies', async () => {
  const html = await container.renderToString(cardMod.default, {
    props: {
      title: 'Accessible Card',
      href: '/stories/accessible-design',
      description: 'Comprehensive design system guide',
      action: 'Read story',
      headingLevel: 2,
      titleEdit: { 'data-emdash-field': 'title' },
      descriptionEdit: { 'data-emdash-field': 'description' },
      actionEdit: { 'data-emdash-field': 'action' },
      transitionName: 'story-hero',
    },
    slots: {
      default: '<span class="custom-badge">New</span>',
    },
  });

  const doc = parse(html);
  const article = queryOne(doc, n => n.tagName === 'article');
  assert.ok(article, 'Card must render a semantic <article>');
  assert.ok(hasClass(article, 'card'), 'Card must have base .card class');
  assert.ok(hasClass(article, 'card--clickable'), 'Card with href must have .card--clickable class');
  assert.ok(hasClass(article, 'focus-parent'), 'Card with href must have .focus-parent class');
  assert.equal(getAttr(article, 'data-editorial-island'), '', 'Card must declare data-editorial-island');

  // Heading check
  const h2 = queryOne(article, n => n.tagName === 'h2');
  assert.ok(h2, 'Card with headingLevel=2 must render an <h2>');
  assert.ok(hasClass(h2, 'card-title'), 'Heading must have .card-title class');
  assert.equal(getAttr(h2, 'data-emdash-field'), 'title', 'Heading must forward titleEdit attributes');
  assert.match(getAttr(h2, 'style') || '', /view-transition-name:\s*story-hero-title/, 'Heading style must receive view-transition-name');

  // Anchor inside heading
  const link = queryOne(h2, n => n.tagName === 'a');
  assert.ok(link, 'Heading must contain the main navigation link');
  assert.equal(getAttr(link, 'href'), '/stories/accessible-design');
  assert.ok(hasClass(link, 'card-link'), 'Link must have .card-link class');
  assert.ok(hasClass(link, 'clickable-parent'), 'Link must have .clickable-parent class');
  assert.equal(getTextContent(link).trim(), 'Accessible Card');

  // Description & default slot
  const descContainer = queryOne(article, n => hasClass(n, 'card-description'));
  assert.ok(descContainer, 'Card must render .card-description');
  const p = queryOne(descContainer, n => n.tagName === 'p');
  assert.ok(p, 'Description text must be wrapped in a <p>');
  assert.equal(getAttr(p, 'data-emdash-field'), 'description', 'Description paragraph must forward descriptionEdit attributes');
  assert.equal(getTextContent(p).trim(), 'Comprehensive design system guide');

  const customBadge = queryOne(descContainer, n => hasClass(n, 'custom-badge'));
  assert.ok(customBadge, 'Default slot content must be rendered inside .card-description');
  assert.equal(getTextContent(customBadge).trim(), 'New');

  // Action span & actionEdit
  const actionSpan = queryOne(article, n => hasClass(n, 'card-action'));
  assert.ok(actionSpan, 'Card must render .card-action');
  assert.equal(getAttr(actionSpan, 'data-emdash-field'), 'action', 'Action span must forward actionEdit attributes');
  assert.match(getTextContent(actionSpan), /Read story/);
});

test('Card sanitizes unsafe links and preserves non-linked heading', async () => {
  const html = await container.renderToString(cardMod.default, {
    props: {
      title: 'Untrusted Card',
      href: 'javascript:alert(1)',
      headingLevel: 3,
    },
  });

  const doc = parse(html);
  const article = queryOne(doc, n => n.tagName === 'article');
  assert.ok(!hasClass(article, 'card--clickable'), 'Card with unsafe href must not have .card--clickable');
  assert.ok(!hasClass(article, 'focus-parent'), 'Card with unsafe href must not have .focus-parent');

  const h3 = queryOne(article, n => n.tagName === 'h3');
  assert.ok(h3, 'Card must render <h3> by default');
  const link = queryOne(h3, n => n.tagName === 'a');
  assert.equal(link, null, 'Unsafe link must not render an <a> tag');
  assert.equal(getTextContent(h3).trim(), 'Untrusted Card');
});

test('Section renders semantic section with aria-labelledby and layout contracts', async () => {
  const html = await container.renderToString(sectionMod.default, {
    props: {
      labelledBy: 'features-heading',
      spacing: 'content',
      gap: 'var(--spacing-large)',
    },
    slots: {
      default: '<h2 id="features-heading">Key Features</h2><p>Feature list</p>',
    },
  });

  const doc = parse(html);
  const section = queryOne(doc, n => n.tagName === 'section');
  assert.ok(section, 'Must render semantic <section>');
  assert.equal(getAttr(section, 'aria-labelledby'), 'features-heading', 'Must set aria-labelledby');
  assert.equal(getAttr(section, 'data-spacing'), 'content', 'Must declare non-default spacing in data-spacing');
  assert.equal(getAttr(section, 'data-layout'), 'stack', 'Must declare default layout stack');
  assert.ok(hasClass(section, 'section'), 'Must have base .section class');
  assert.match(getAttr(section, 'style') || '', /--container-gap:\s*var\(--spacing-large\)/, 'Must map gap to --container-gap');

  const h2 = queryOne(section, n => n.tagName === 'h2');
  assert.ok(h2);
  assert.equal(getAttr(h2, 'id'), 'features-heading');
});

test('Container handles standard widths and content-grid breakout layouts', async () => {
  // Standard reading width
  const readingHtml = await container.renderToString(containerMod.default, {
    props: { width: 'reading' },
    slots: { default: '<p>Prose content</p>' },
  });
  const readingDoc = parse(readingHtml);
  const readingDiv = queryOne(readingDoc, n => n.tagName === 'div');
  assert.ok(hasClass(readingDiv, 'container-shell'), 'Standard container must have .container-shell');
  assert.ok(hasClass(readingDiv, 'container-shell--reading'), 'Must have width-specific class .container-shell--reading');
  assert.equal(getAttr(readingDiv, 'data-layout'), 'stack');

  // Breakout content-grid
  const breakoutHtml = await container.renderToString(containerMod.default, {
    props: { breakout: true, gap: 'var(--spacing-grid)' },
    slots: { default: '<p class="content--feature">Featured block</p>' },
  });
  const breakoutDoc = parse(breakoutHtml);
  const breakoutDiv = queryOne(breakoutDoc, n => n.tagName === 'div');
  assert.ok(hasClass(breakoutDiv, 'content-grid'), 'Breakout container must have .content-grid class');
  assert.ok(!hasClass(breakoutDiv, 'container-shell'), 'Breakout container must not have .container-shell');
  assert.equal(getAttr(breakoutDiv, 'data-layout'), 'breakout', 'Breakout container must have data-layout="breakout"');
  assert.match(getAttr(breakoutDiv, 'style') || '', /--content-gap:\s*var\(--spacing-grid\)/);
});

test('Disclosure renders accessible native details and summary with synchronized attributes', async () => {
  const html = await container.renderToString(disclosureMod.default, {
    props: {
      id: 'faq-item-1',
      open: true,
    },
    slots: {
      summary: 'What is Baseline?',
      default: '<p>A multi-profile Astro starter.</p>',
    },
  });

  const doc = parse(html);
  const details = queryOne(doc, n => n.tagName === 'details');
  assert.ok(details, 'Must render native <details>');
  assert.equal(getAttr(details, 'id'), 'faq-item-1');
  assert.equal(getAttr(details, 'data-disclosure'), '');
  assert.equal(getAttr(details, 'data-editorial-island'), '');
  assert.ok(details.attrs.some(a => a.name === 'open'), 'Must have open attribute when open=true');

  const summary = queryOne(details, n => n.tagName === 'summary');
  assert.ok(summary, 'Must render native <summary>');
  assert.equal(getAttr(summary, 'aria-controls'), 'faq-item-1-body', 'Summary must point to body id via aria-controls');
  assert.equal(getTextContent(summary).trim(), 'What is Baseline?');

  const body = queryOne(details, n => getAttr(n, 'id') === 'faq-item-1-body');
  assert.ok(body, 'Must render disclosure body with matching id');
  assert.ok(hasClass(body, 'disclosure__body'), 'Body must have .disclosure__body class');
  assert.equal(getAttr(body, 'data-editorial-content'), '');
  assert.match(getTextContent(body), /A multi-profile Astro starter\./);
});
