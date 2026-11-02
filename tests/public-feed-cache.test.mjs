import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicFeedCacheState, recordPublicFeed, finalizePublicFeedCache } from '../src/lib/public-feed-cache.ts';

const now = Date.parse('2026-11-01T12:00:00.000Z');
function resolver(feeds, options) {
  if (feeds.some(f => !f.cache)) return false;
  const expiry = Math.min(...feeds.map(f => Date.parse(f.cache.expiresAt)), ...options.boundaries.map(Date.parse));
  const maxAge = Math.floor((expiry - options.now) / 1000);
  return maxAge > 0 ? { tags: [...new Set(feeds.flatMap(f => f.cache.dependencies))], maxAge, swr: 0 } : false;
}
const feed = (seconds, dependencies = ['events', 'emdash:settings']) => ({ ok: true, cache: { dependencies, expiresAt: new Date(now + seconds * 1000).toISOString() } });

test('split dependencies include empty results and keep the earliest absolute expiry', () => {
  const state = createPublicFeedCacheState(now);
  recordPublicFeed(state, feed(14));
  recordPublicFeed(state, feed(8, ['venues', 'emdash:settings']));
  const result = finalizePublicFeedCache(state, resolver, 15, now + 2500);
  assert.deepEqual(result, { tags: ['events', 'emdash:settings', 'venues'], maxAge: 5, swr: 0 });
});
test('request render time and a renderer boundary can only shorten the host budget', () => {
  const state = createPublicFeedCacheState(now);
  recordPublicFeed(state, feed(100), [new Date(now + 7000).toISOString()]);
  assert.equal(finalizePublicFeedCache(state, resolver, 15, now + 2000).maxAge, 5);
  state.boundaries = [];
  assert.equal(finalizePublicFeedCache(state, resolver, 15, now + 2000).maxAge, 13);
});
test('failed parts, missing metadata and exhausted lifetimes refuse the entire page', () => {
  const state = createPublicFeedCacheState(now);
  assert.equal(finalizePublicFeedCache(state, resolver, 15, now), false);
  recordPublicFeed(state, feed(15));
  recordPublicFeed(state, { ok: true });
  assert.equal(finalizePublicFeedCache(state, resolver, 15, now), false);
  state.feeds.pop();
  assert.equal(finalizePublicFeedCache(state, resolver, 15, now + 14500), false);
  recordPublicFeed(state, { ok: false });
  assert.equal(finalizePublicFeedCache(state, resolver, 15, now), false);
});
test('evidence is request-owned and immutable after recording', () => {
  const first = createPublicFeedCacheState(now), second = createPublicFeedCacheState(now);
  const input = feed(10); recordPublicFeed(first, input);
  input.cache.dependencies.push('unrelated'); input.cache.expiresAt = new Date(now + 100000).toISOString();
  assert.equal(second.feeds.length, 0);
  assert.deepEqual(finalizePublicFeedCache(first, resolver, 15, now), { tags: ['events', 'emdash:settings'], maxAge: 10, swr: 0 });
});
test('a resolver cannot widen TTL, enable stale serving or return unsafe tags', () => {
  const state = createPublicFeedCacheState(now); recordPublicFeed(state, feed(15));
  for (const bad of [{ maxAge: 16, swr: 0, tags: ['events'] }, { maxAge: 10, swr: 1, tags: ['events'] }, { maxAge: 1.5, swr: 0, tags: ['events'] }, { maxAge: 5, swr: 0, tags: ['bad\r\ntag'] }]) assert.equal(finalizePublicFeedCache(state, () => bad, 15, now), false);
  assert.equal(finalizePublicFeedCache(state, () => { throw new Error('unsupported'); }, 15, now), false);
});
test('invalid and backwards host clocks/TTLs fail closed', () => {
  const state = createPublicFeedCacheState(now); recordPublicFeed(state, feed(15));
  for (const ttl of [NaN, Infinity, 0, -1]) assert.equal(finalizePublicFeedCache(state, resolver, ttl, now), false);
  assert.equal(finalizePublicFeedCache(state, resolver, 15, now - 1), false);
});
