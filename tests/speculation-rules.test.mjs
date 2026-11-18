import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { speculationRules, PREFETCH_EXCLUDED_PATHS, PREFETCH_EXCLUDED_LINKS } from '../src/lib/speculation-rules.ts';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('speculation rules prefetch same-origin documents and never prerender', () => {
  assert.equal(speculationRules('off'), null);
  assert.equal(speculationRules(/** @type {any} */ ('eager')), null, 'only moderate and conservative are emitted');
  for (const eagerness of ['moderate', 'conservative']) {
    const json = speculationRules(eagerness);
    assert.ok(json && !json.includes('<'), 'JSON must not be able to close its script element');
    const rules = JSON.parse(json);
    assert.deepEqual(Object.keys(rules), ['prefetch'], 'prefetch only, no prerender');
    const [rule] = rules.prefetch;
    assert.equal(rule.source, 'document');
    assert.equal(rule.eagerness, eagerness);
    assert.deepEqual(rule.where.and[0], { href_matches: '/*' });
    const excludedPaths = rule.where.and.filter((c) => c.not?.href_matches).map((c) => c.not.href_matches);
    assert.deepEqual(excludedPaths, [...PREFETCH_EXCLUDED_PATHS]);
    assert.ok(rule.where.and.some((c) => c.not?.selector_matches === PREFETCH_EXCLUDED_LINKS));
  }
});

test('excluded paths match internals, APIs and admin but not public pages', { skip: typeof URLPattern !== 'function' && 'URLPattern unavailable' }, () => {
  const base = 'https://example.test/posts/hello/';
  const excluded = (url) => PREFETCH_EXCLUDED_PATHS.some((p) => new URLPattern(p, base).test(url));
  const sameOrigin = (url) => new URLPattern('/*', base).test(url);
  for (const url of ['https://example.test/_emdash/admin', 'https://example.test/_astro/x.css', 'https://example.test/api/search', 'https://example.test/admin/']) {
    assert.ok(excluded(url), `${url} must be excluded`);
  }
  for (const url of ['https://example.test/', 'https://example.test/posts/other', 'https://example.test/category/news']) {
    assert.ok(sameOrigin(url) && !excluded(url), `${url} must be eligible`);
  }
  assert.ok(!sameOrigin('https://elsewhere.test/'), 'other origins are never matched');
});

test('excluded link selectors cover opt-outs, reloads, downloads, targets, queries and fragments', () => {
  for (const selector of ['[data-astro-prefetch="false"]', '[data-astro-prefetch="false"] a', '[data-astro-reload]', '[download]', '[target]:not([target="_self"])', '[href*="?"]', '[href*="#"]']) {
    assert.ok(PREFETCH_EXCLUDED_LINKS.split(', ').includes(selector), `missing ${selector}`);
  }
});

test('SiteShell emits the rules only when asked and the Base layouts opt in outside edit mode', () => {
  const shell = read('src/layouts/SiteShell.astro');
  assert.match(shell, /prefetch = 'off'/, 'SiteShell defaults to no prefetch');
  assert.match(shell, /\{prefetchRules && <script type="speculationrules" is:inline set:html=\{prefetchRules\}><\/script>\}/);
  const base = read('src/layouts/Base.astro');
  assert.match(base, /const prefetch = editMode \? 'off' : 'moderate';/, 'EmDash Base turns prefetch off in edit mode');
  assert.match(base, /prefetch=\{prefetch\}/);
  assert.match(read('profiles/static/project/src/layouts/Base.astro'), /prefetch="moderate"/);
});
