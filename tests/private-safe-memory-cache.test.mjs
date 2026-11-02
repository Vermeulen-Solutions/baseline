import test from 'node:test';
import assert from 'node:assert/strict';
import factory from '../src/lib/private-safe-memory-cache.mjs';

function context(path = '/events/', headers = {}) {
  return { request: new Request('https://example.test' + path, { headers }), logger: { warn() {} } };
}
function fixture() {
  const provider = factory({ query: { exclude: [] } }); let renders = 0;
  const next = async () => new Response(`<html><body>Render ${++renders}</body></html>`, { headers: { 'Content-Type': 'text/html', 'CDN-Cache-Control': 'public, max-age=15, stale-while-revalidate=0', 'Cache-Tag': 'events' } });
  return { provider, next };
}
test('native memory provider stores and invalidates real HTML', async () => {
  const { provider, next } = fixture();
  const first = await provider.onRequest(context(), next); const body = await first.text();
  const hit = await provider.onRequest(context(), next); assert.equal(hit.headers.get('X-Astro-Cache'), 'HIT'); assert.equal(await hit.text(), body);
  await provider.invalidate({ tags: ['events'] }); const fresh = await provider.onRequest(context(), next); assert.equal(fresh.headers.get('X-Astro-Cache'), 'MISS'); assert.notEqual(await fresh.text(), body);
});
test('auth, every cookie and every query bypass a warm entry without replacing it', async () => {
  const { provider, next } = fixture(); const first = await provider.onRequest(context(), next); const body = await first.text();
  for (const request of [context('/events/', { Cookie: 'session=private' }), context('/events/', { Authorization: 'Bearer private' }), context('/events/?_edit=1'), context('/events/?_preview=1'), context('/events/?utm_source=example')]) {
    const result = await provider.onRequest(request, next); assert.notEqual(result.headers.get('X-Astro-Cache'), 'HIT'); assert.notEqual(await result.text(), body);
  }
  const hit = await provider.onRequest(context(), next); assert.equal(hit.headers.get('X-Astro-Cache'), 'HIT'); assert.equal(await hit.text(), body);
});
test('expiry never serves stale when the origin fails', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 100000 }); const { provider, next } = fixture(); await provider.onRequest(context(), next);
  t.mock.timers.tick(15001); await assert.rejects(provider.onRequest(context(), async () => { throw new Error('Origin unavailable'); }), /Origin unavailable/);
});
test('a Set-Cookie response cannot fill the anonymous cache', async () => {
  const { provider } = fixture(); let calls = 0;
  const next = async () => new Response(String(++calls), { headers: { 'CDN-Cache-Control': 'public, max-age=15', 'Set-Cookie': 'private=1' } });
  const first = await provider.onRequest(context(), next), second = await provider.onRequest(context(), next);
  assert.equal(await first.text(), '1'); assert.equal(await second.text(), '2'); assert.notEqual(second.headers.get('X-Astro-Cache'), 'HIT');
});
