import test from 'node:test';
import assert from 'node:assert/strict';
import cloudflareCacheProvider from '../src/lib/cloudflare-cache-provider.mjs';

function createFakeEdgeCache() {
  const store = new Map();
  return {
    store,
    async match(req) {
      const hit = store.get(req.url);
      return hit ? hit.clone() : undefined;
    },
    async put(req, res) {
      store.set(req.url, res.clone());
    },
  };
}

function context(path = '/events/', headers = {}, method = 'GET') {
  return { request: new Request('https://example.workers.dev' + path, { method, headers }), logger: { warn() {} } };
}

test('caches anonymous HTML in edgeCache while preventing outer CDN cookie-blind caching', async () => {
  const edgeCache = createFakeEdgeCache();
  const provider = cloudflareCacheProvider({ edgeCache, query: { exclude: [] } });
  let renders = 0;
  const next = async () =>
    new Response(`<html>Render ${++renders}</html>`, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'CDN-Cache-Control': 'public, max-age=3600, stale-while-revalidate=0',
        'Cache-Tag': 'pages',
      },
    });

  const first = await provider.onRequest(context('/about/'), next);
  assert.equal(await first.text(), '<html>Render 1</html>');
  assert.equal(first.headers.get('Cache-Control'), 'no-cache');
  assert.equal(first.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');

  const second = await provider.onRequest(context('/about/'), next);
  assert.equal(second.headers.get('X-Astro-Cache'), 'HIT');
  assert.equal(await second.text(), '<html>Render 1</html>');
  assert.equal(renders, 1);

  const adminReq = await provider.onRequest(context('/about/', { Cookie: 'emdash_session=admin' }), next);
  assert.notEqual(adminReq.headers.get('X-Astro-Cache'), 'HIT');
  assert.equal(await adminReq.text(), '<html>Render 2</html>');
  assert.equal(renders, 2);
});

test('caches /_image and /_emdash/api/media/file/* with immutable 1-year headers even when cookies are present', async () => {
  const edgeCache = createFakeEdgeCache();
  const provider = cloudflareCacheProvider({ edgeCache });
  let transforms = 0;
  const next = async () =>
    new Response(`webp-${++transforms}`, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });

  const first = await provider.onRequest(
    context('/_image?href=%2F_emdash%2Fapi%2Fmedia%2Ffile%2Fhero.jpg&w=800&f=webp', { Cookie: 'emdash_session=1' }),
    next
  );
  assert.equal(await first.text(), 'webp-1');
  assert.equal(first.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');

  const second = await provider.onRequest(
    context('/_image?href=%2F_emdash%2Fapi%2Fmedia%2Ffile%2Fhero.jpg&w=800&f=webp'),
    next
  );
  assert.equal(second.headers.get('X-Astro-Cache'), 'HIT');
  assert.equal(second.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
  assert.equal(await second.text(), 'webp-1');
  assert.equal(transforms, 1);
});

test('HTML cache entries are keyed per build so a deploy never serves the previous build', async () => {
  const edgeCache = createFakeEdgeCache();
  const html = (label) => async () => new Response(`<html>${label}</html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'CDN-Cache-Control': 'max-age=3600' } });
  const oldBuild = cloudflareCacheProvider({ edgeCache, buildId: 'build-a', query: { exclude: [] } });
  await oldBuild.onRequest(context('/'), html('old'));
  const hitOld = await oldBuild.onRequest(context('/'), html('unused'));
  assert.equal(hitOld.headers.get('X-Astro-Cache'), 'HIT');
  assert.equal(await hitOld.text(), '<html>old</html>');

  // Same edge cache, new deploy: the old entry must not be served.
  const newBuild = cloudflareCacheProvider({ edgeCache, buildId: 'build-b', query: { exclude: [] } });
  const fresh = await newBuild.onRequest(context('/'), html('new'));
  assert.notEqual(fresh.headers.get('X-Astro-Cache'), 'HIT');
  assert.equal(await fresh.text(), '<html>new</html>');
  assert.ok([...edgeCache.store.keys()].some((key) => key.includes('__build=build-a')));
  assert.ok([...edgeCache.store.keys()].some((key) => key.includes('__build=build-b')));
});

test('a visitor query string never collides with the build key', async () => {
  const { htmlCacheKey } = await import('../src/lib/cloudflare-cache-provider.mjs');
  assert.equal(htmlCacheKey('https://example.workers.dev/', 'b1').url, 'https://example.workers.dev/?__build=b1');
  assert.equal(htmlCacheKey('https://example.workers.dev/', undefined).url, 'https://example.workers.dev/');
});
