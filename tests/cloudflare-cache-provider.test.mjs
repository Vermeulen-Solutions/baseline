import test from 'node:test';
import assert from 'node:assert/strict';
import cloudflareCacheProvider from '../src/lib/cloudflare-cache-provider.mjs';
import { MEDIA_EDGE_MAX_AGE, isMediaPath, serveMedia } from '../src/lib/media-edge-cache.mjs';

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

test('media keeps EmDash\'s browser header, gets a bounded edge copy and skips the memory provider', async () => {
  const edgeCache = createFakeEdgeCache();
  const provider = cloudflareCacheProvider({ edgeCache });
  let transforms = 0;
  const next = async () =>
    new Response(`webp-${++transforms}`, {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'CDN-Cache-Control': 'public, max-age=31536000',
      },
    });
  const path = '/_image?href=%2F_emdash%2Fapi%2Fmedia%2Ffile%2Fhero.jpg&w=800&f=webp';

  const first = await provider.onRequest(context(path, { Cookie: 'emdash_session=1' }), next);
  assert.equal(await first.text(), 'webp-1');
  assert.equal(first.headers.get('Cache-Control'), 'public, max-age=0, must-revalidate', 'the browser revalidates: a replaced image keeps its URL');

  const stored = edgeCache.store.get('https://example.workers.dev' + path);
  assert.equal(stored.headers.get('Cache-Control'), `public, max-age=${MEDIA_EDGE_MAX_AGE}`, 'the edge copy lives an hour, not a year');
  assert.equal(stored.headers.get('CDN-Cache-Control'), null);

  const second = await provider.onRequest(context(path), next);
  assert.equal(second.headers.get('X-Astro-Cache'), 'HIT');
  assert.equal(second.headers.get('Cache-Control'), 'public, max-age=0, must-revalidate');
  assert.equal(await second.text(), 'webp-1');
  assert.equal(transforms, 1, 'the edge copy saves the transform');

  // EmDash 1.6 asks the route cache to keep media for a year; the in-isolate memory provider must not.
  const noEdge = cloudflareCacheProvider({ edgeCache: null });
  let originals = 0;
  const original = async () => new Response(`jpeg-${++originals}`, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=0, must-revalidate', 'CDN-Cache-Control': 'public, max-age=31536000' } });
  await noEdge.onRequest(context('/_emdash/api/media/file/hero.jpg'), original);
  const again = await noEdge.onRequest(context('/_emdash/api/media/file/hero.jpg'), original);
  assert.equal(await again.text(), 'jpeg-2');
  assert.notEqual(again.headers.get('X-Astro-Cache'), 'HIT');
});

test('a replaced image is served once the bounded edge copy has expired', async () => {
  const store = new Map();
  let now = 0;
  const edgeCache = {
    async match(req) {
      const hit = store.get(req.url);
      if (!hit) return undefined;
      const maxAge = Number(/max-age=(\d+)/.exec(hit.response.headers.get('Cache-Control'))?.[1] ?? 0);
      return now - hit.at < maxAge * 1000 ? hit.response.clone() : undefined;
    },
    async put(req, res) { store.set(req.url, { at: now, response: res.clone() }); },
  };
  let bytes = 'old';
  const next = async () => new Response(bytes, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=0, must-revalidate' } });
  const request = () => new Request('https://example.workers.dev/_emdash/api/media/file/01ABC.jpg');
  assert.equal(await (await serveMedia(request(), next, { edgeCache })).text(), 'old');
  bytes = 'new'; // "Replace original" keeps the storage key, so the URL is unchanged.
  now += 60_000;
  assert.equal(await (await serveMedia(request(), next, { edgeCache })).text(), 'old', 'within the hour the edge copy may still answer');
  now += MEDIA_EDGE_MAX_AGE * 1000;
  assert.equal(await (await serveMedia(request(), next, { edgeCache })).text(), 'new');
});

test('media requests pass through untouched without an edge cache, and non-200 responses are not stored', async () => {
  const response = new Response('x', { headers: { 'Cache-Control': 'public, max-age=0, must-revalidate' } });
  assert.equal(await serveMedia(new Request('https://example.test/_image?href=a'), async () => response, {}), response);
  const edgeCache = createFakeEdgeCache();
  await serveMedia(new Request('https://example.test/_emdash/api/media/file/missing.jpg'), async () => new Response('no', { status: 404 }), { edgeCache });
  assert.equal(edgeCache.store.size, 0);
  assert.equal(isMediaPath('/_image'), true);
  assert.equal(isMediaPath('/_emdash/api/media/file/a/b.jpg'), true);
  assert.equal(isMediaPath('/events/1/publicEventImage'), true);
  assert.equal(isMediaPath('/_emdash/api/media'), false);
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
