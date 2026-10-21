import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { z } from 'astro/zod';

// Resolve Astro's virtual config import to its published implementation in Node.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === 'astro:content' ? 'astro/content/config' : specifier, context);
  },
});
const { collections } = await import('../src/content.config.ts');
hooks.deregister();
const schema = collections.posts.schema({ image: () => z.unknown() });
const article = { title: 'Existing article', description: 'Description.', publishedAt: '2026-10-01' };

test('post schema accepts omitted reading time and whole minutes including both boundaries', () => {
  assert.equal(schema.parse(article).readingTime, undefined);
  for (const readingTime of [1, 5, 60]) {
    assert.equal(schema.parse({ ...article, readingTime }).readingTime, readingTime);
  }
});

test('post schema rejects out-of-range, fractional and non-number reading times', () => {
  for (const readingTime of [-1, 0, 61, 1.5, NaN, Infinity, '5', '', null, true]) {
    const result = schema.safeParse({ ...article, readingTime });
    assert.equal(result.success, false, `Unexpectedly accepted ${String(readingTime)}`);
    assert.ok(result.error.issues.some(issue => issue.path[0] === 'readingTime'));
  }
});
