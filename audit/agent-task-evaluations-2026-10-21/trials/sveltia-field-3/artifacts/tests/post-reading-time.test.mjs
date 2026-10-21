import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { z } from 'astro/zod';

// Node cannot resolve Astro's virtual module. Keep its collection wrapper inert
// so these tests exercise the actual site schema, including its refinements.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'astro:content') return { url: 'data:text/javascript,export const defineCollection = input => input;', shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
let collections;
try {
  ({ collections } = await import('../src/content.config.ts'));
} finally {
  hooks.deregister();
}
const schema = collections.posts.schema({ image: () => z.any() });
const legacyPost = { title: 'Legacy article', description: 'Existing description.', publishedAt: '2026-01-01' };

test('reading time remains optional for existing and empty Sveltia posts', () => {
  assert.equal(schema.safeParse(legacyPost).success, true);
  assert.equal(schema.safeParse({ ...legacyPost, readingTime: null }).success, true);
  assert.equal(schema.parse(legacyPost).draft, false);
});

test('reading time accepts whole minutes from 1 through 60 inclusively', () => {
  for (const readingTime of [1, 5, 60]) {
    const result = schema.safeParse({ ...legacyPost, readingTime });
    assert.equal(result.success, true, `Expected ${readingTime} to be valid`);
    assert.equal(result.data.readingTime, readingTime);
  }
});

test('reading time rejects out-of-range, fractional and nonnumeric values', () => {
  for (const readingTime of [0, -1, 61, 1.5, '5', '', 'five', false, NaN, Infinity]) {
    const result = schema.safeParse({ ...legacyPost, readingTime });
    assert.equal(result.success, false, `Expected ${String(readingTime)} to be invalid`);
    assert.ok(result.error.issues.some(issue => issue.path[0] === 'readingTime'));
  }
});
