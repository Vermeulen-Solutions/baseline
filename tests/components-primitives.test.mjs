import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolvePublicCapabilities } from '../src/lib/capabilities.ts';
import { resolveLocale, getLocaleDirection } from '../src/lib/locale.ts';
import { resolveTheme } from '../src/lib/theme.ts';
import { extractCopyableText } from '../src/lib/clipboard.ts';
import { announce } from '../src/lib/announce.ts';
import { TabsController } from '../src/lib/tabs.ts';

test('resolvePublicCapabilities derives authoritative profile, normalizes base, and excludes secrets', () => {
  // Test explicit profile enforcement and trailing slash stripping on base
  const staticCaps = resolvePublicCapabilities({}, { base: 'blog/' }, 'static');
  assert.equal(staticCaps.profile, 'static');
  assert.equal(staticCaps.base, '/blog');
  assert.equal(staticCaps.trailingSlash, 'ignore');
  assert.equal(staticCaps.headingLinks, false);
  assert.equal(staticCaps.callouts, false);
  assert.equal(staticCaps.search, false);

  // Test root base normalization and empty base
  const rootCaps = resolvePublicCapabilities({}, { base: '/' }, 'emdash');
  assert.equal(rootCaps.base, '/');
  assert.equal(rootCaps.profile, 'emdash');

  const emptyBase = resolvePublicCapabilities({}, { base: '' }, 'static');
  assert.equal(emptyBase.base, '/');

  // Test feature flags and search bundle path normalization
  const searchCaps = resolvePublicCapabilities(
    {
      headingLinks: true,
      callouts: true,
      search: { engine: 'pagefind', bundlePath: '\\assets\\pagefind\\' },
    },
    { base: '/docs', trailingSlash: 'always' },
    'static-sveltia'
  );
  assert.equal(searchCaps.profile, 'static-sveltia');
  assert.equal(searchCaps.headingLinks, true);
  assert.equal(searchCaps.callouts, true);
  assert.equal(searchCaps.trailingSlash, 'always');
  assert.ok(searchCaps.search);
  assert.equal(searchCaps.search.engine, 'pagefind');
  assert.equal(searchCaps.search.bundlePath, 'assets/pagefind');

  // Test that Windows filesystem bundle paths or directory traversal throw
  assert.throws(() => resolvePublicCapabilities({ search: { engine: 'pagefind', bundlePath: 'C:\\dist\\pagefind' } }));
  assert.throws(() => resolvePublicCapabilities({ search: { engine: 'pagefind', bundlePath: '../secret/pagefind' } }));

  // Verify no server secrets or filesystem paths exist in returned object
  const keys = Object.keys(searchCaps);
  assert.deepEqual(keys.sort(), ['base', 'callouts', 'headingLinks', 'profile', 'search', 'trailingSlash'].sort());
  assert.ok(!('database' in searchCaps));
  assert.ok(!('storage' in searchCaps));
  assert.ok(!('outDir' in searchCaps));
});

test('resolveLocale canonicalizes tags, resolves script subtags for RTL, and keeps keys distinct', () => {
  // Standard LTR language
  const en = resolveLocale({ key: 'primary', lang: 'en-US', label: 'English (US)' });
  assert.equal(en.key, 'primary');
  assert.equal(en.lang, 'en-US');
  assert.equal(en.dir, 'ltr');

  // Standard RTL language
  const ar = resolveLocale({ key: 'arabic', lang: 'ar-EG', label: 'Arabic' });
  assert.equal(ar.key, 'arabic');
  assert.equal(ar.dir, 'rtl');

  const he = resolveLocale({ key: 'hebrew', lang: 'he', label: 'Hebrew' });
  assert.equal(he.dir, 'rtl');

  // Critical script subtag test: az-Arab is RTL, az-Latn is LTR
  const azArab = resolveLocale({ key: 'az-south', lang: 'az-Arab', label: 'South Azerbaijani' });
  assert.equal(azArab.dir, 'rtl', 'az-Arab must resolve to rtl because of Arab script subtag');

  const azLatn = resolveLocale({ key: 'az-north', lang: 'az-Latn', label: 'North Azerbaijani' });
  assert.equal(azLatn.dir, 'ltr', 'az-Latn must resolve to ltr because of Latn script subtag');

  // Explicit dir override takes precedence
  const override = resolveLocale({ key: 'custom', lang: 'en', label: 'Custom', dir: 'rtl' });
  assert.equal(override.dir, 'rtl');

  // Gracefully handles invalid/fallback inputs
  const invalid = resolveLocale({ key: 'bad', lang: 'not a valid locale !@#$', label: 'Bad' });
  assert.equal(invalid.dir, 'ltr');

  // Test getLocaleDirection directly
  assert.equal(getLocaleDirection('fa'), 'rtl');
  assert.equal(getLocaleDirection('ur'), 'rtl');
  assert.equal(getLocaleDirection('fr'), 'ltr');
  assert.equal(getLocaleDirection('ar-Latn'), 'ltr');
});

test('resolveTheme resolves light/dark and handles system dark mode accurately', () => {
  // Explicit preference overrides system state
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('light', false), 'light');
  assert.equal(resolveTheme('dark', true), 'dark');
  assert.equal(resolveTheme('dark', false), 'dark');

  // System preference follows systemDark boolean
  assert.equal(resolveTheme('system', true), 'dark');
  assert.equal(resolveTheme('system', false), 'light');
});

test('CSS contracts enforce forced-colors, print contracts, and code block RTL isolation', () => {
  const css = readFileSync('src/styles/global.css', 'utf8');

  // Forced-colors active contracts
  assert.ok(css.includes('@media (forced-colors: active)'), 'Must include forced-colors: active query');
  assert.ok(css.includes('Highlight'), 'Must use system Highlight for focus rings');
  assert.ok(css.includes('ButtonBorder'), 'Must use system ButtonBorder for buttons/controls');
  assert.ok(css.includes('GrayText'), 'Must use system GrayText for disabled states');

  // Print media contracts
  assert.ok(css.includes('@media print'), 'Must include print media query');
  assert.ok(css.includes('[data-print-content]'), 'Must support opt-in [data-print-content]');
  assert.ok(css.includes('.tabs__panel'), 'Print contract must reveal component-managed tabpanels');

  // RTL code block isolation
  assert.ok(css.includes(':where(pre)'), 'Must target pre for code isolation');
  assert.ok(css.includes('direction: ltr !important'), 'Pre elements must enforce direction: ltr');
  assert.ok(css.includes('text-align: start !important'), 'Pre elements must enforce text-align: start');
  assert.ok(!css.includes('direction: auto'), 'CSS direction: auto is invalid and must not be present');
});

test('Announcer routes messages to polite and assertive channels, inspects DOM updates, and handles cancellation', async () => {
  let politeText = '';
  let assertiveText = '';

  const mockAnnouncer = {
    querySelector(selector) {
      if (selector === '[data-announcer-polite]') {
        return {
          get textContent() { return politeText; },
          set textContent(v) { politeText = v; },
        };
      }
      if (selector === '[data-announcer-assertive]') {
        return {
          get textContent() { return assertiveText; },
          set textContent(v) { assertiveText = v; },
        };
      }
      return null;
    },
  };

  globalThis.document = {
    getElementById(id) {
      if (id === 'test-announcer') return mockAnnouncer;
      return null;
    },
  };

  // Test polite announcement: region is cleared synchronously and populated via microtask
  const ok1 = announce('test-announcer', 'Action succeeded');
  assert.equal(ok1, true);
  assert.equal(politeText, '', 'Polite region must be cleared synchronously before announcement');

  await new Promise((resolve) => queueMicrotask(resolve));
  assert.equal(politeText, 'Action succeeded', 'Polite region must receive announcement after microtask');

  // Test repeated announcement with identical message
  const okRepeat = announce('test-announcer', 'Action succeeded');
  assert.equal(okRepeat, true);
  assert.equal(politeText, '', 'Repeated message must clear region synchronously to trigger screen readers');

  await new Promise((resolve) => queueMicrotask(resolve));
  assert.equal(politeText, 'Action succeeded');

  // Test cancellation during queued microtask
  const acQueue = new AbortController();
  announce('test-announcer', 'Cancelled in flight', { signal: acQueue.signal });
  assert.equal(politeText, '');
  acQueue.abort();
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.equal(politeText, '', 'Aborted signal must prevent queued microtask from populating region');

  // Test assertive announcement
  const ok2 = announce('test-announcer', 'Critical error occurred', { priority: 'assertive' });
  assert.equal(ok2, true);
  await new Promise((resolve) => queueMicrotask(resolve));
  assert.equal(assertiveText, 'Critical error occurred');

  // Test missing container returns false
  const okMissing = announce('non-existent', 'Hello');
  assert.equal(okMissing, false);

  // Test already-aborted signal returns false
  const ac = new AbortController();
  ac.abort();
  const okAborted = announce('test-announcer', 'Cancelled', { signal: ac.signal });
  assert.equal(okAborted, false);
});

test('extractCopyableText excludes designated decorations while preserving legitimate code operators', () => {
  // Mock element with prompt decoration and line numbers alongside real code operators
  const mockContainer = {
    cloneNode() {
      const removed = [];
      return {
        querySelectorAll(selector) {
          assert.ok(selector.includes('[data-copy-exclude]') && selector.includes('.prompt'));
          return [
            { remove() { removed.push('prompt'); } },
            { remove() { removed.push('line-number'); } },
          ];
        },
        get textContent() {
          return 'npm install @baseline/core';
        },
      };
    },
  };

  const text = extractCopyableText(mockContainer);
  assert.equal(text, 'npm install @baseline/core');

  // Test value extraction
  const inputEl = {
    value: 'git checkout main',
  };
  const val = extractCopyableText(inputEl, 'value');
  assert.equal(val, 'git checkout main');
});

test('TabsController registers and tears down cleanly with AbortController', () => {
  const root = {
    getAttribute(attr) {
      if (attr === 'data-tabs-id') return 'mock-tabs';
      if (attr === 'data-sync-key') return 'mock-sync';
      return null;
    },
    setAttribute() {},
    children: [],
    querySelector() { return null; },
  };

  const ctrl = new TabsController(root);
  assert.equal(ctrl.id, 'mock-tabs');
  assert.equal(ctrl.syncKey, 'mock-sync');
  assert.equal(ctrl.isDestroyed, false);

  ctrl.destroy();
  assert.equal(ctrl.isDestroyed, true);
});

