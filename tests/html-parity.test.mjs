import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, routeFile, normalizeHTML, diffText, capture, compare } from '../scripts/html-parity.mjs';

test('arguments: capture needs an origin, routes and a folder; compare needs two folders', () => {
  assert.equal(parseArgs([]).help, true);
  assert.deepEqual(parseArgs(['capture', '--base', 'http://127.0.0.1:4321', '--routes', '/,/a', '--out', 'x']).routes, ['/', '/a']);
  assert.throws(() => parseArgs(['check']), /capture or compare/);
  assert.throws(() => parseArgs(['capture', '--routes', '/', '--out', 'x']), /--base/);
  assert.throws(() => parseArgs(['capture', '--base', 'http://127.0.0.1:4321', '--routes', '/']), /--out/);
  assert.throws(() => parseArgs(['capture', '--base', 'http://127.0.0.1:4321', '--routes', 'C:/Program Files/Git/', '--out', 'x']), /MSYS_NO_PATHCONV/);
  assert.throws(() => parseArgs(['capture', '--base', 'http://127.0.0.1:4321', '--routes', '/', '--out', 'x', '--ignore', '(']), /not a regular expression/);
  assert.deepEqual(parseArgs(['compare', 'a', 'b']).dirs, ['a', 'b']);
  assert.throws(() => parseArgs(['compare', 'a']), /two capture folders/);
});

test('route file names are stable and distinct', () => {
  assert.equal(routeFile('/'), 'index.html');
  assert.equal(routeFile('/posts/hello/'), 'posts~hello.html');
  assert.equal(routeFile('/posts/hello'), 'posts~hello.html');
  assert.equal(routeFile('/search?q=a&page=2'), 'search@q+a,page+2.html');
  assert.equal(routeFile('/caf\u00e9'), 'caf%e9.html');
});

test('normalizing removes build noise and puts each tag on its own line', () => {
  const before = '<link rel="stylesheet" href="/_astro/index.Ab12Cd34.css" integrity="sha384-x"><div data-astro-cid-abc123 class="a">\r\n  <astro-island uid="Z1" component-url="/_astro/C.Ef56Gh78.js"></astro-island></div><meta http-equiv="x" content="script-src \'sha256-AAAA=\'">';
  const after = '<link rel="stylesheet" href="/_astro/index.Zz99Yy88.css"><div class="a" data-astro-cid-def456>\n<astro-island uid="Q9" component-url="/_astro/C.Ij90Kl12.js"></astro-island></div><meta http-equiv="x" content="script-src \'sha256-BBBB=\'">';
  assert.equal(normalizeHTML(before), normalizeHTML(after));
  assert.match(normalizeHTML(before), /^<link rel="stylesheet" href="\/_astro\/index\.css">\n<div class="a">\n<astro-island url="\/_astro\/C\.js">/);
  assert.equal(normalizeHTML('<p>© 2026</p>', ['20\\d\\d']), '<p>© [ignored]</p>\n');
});

test('a diff names the route and the changed element', () => {
  assert.equal(diffText('/', 'a\n', 'a\n'), '');
  const diff = diffText('/about', '<h1>About</h1>\n<p>One</p>\n', '<h1>About us</h1>\n<p>One</p>\n');
  assert.match(diff, /^diff \/about$/m);
  assert.match(diff, /^-<h1>About<\/h1>$/m);
  assert.match(diff, /^\+<h1>About us<\/h1>$/m);
});

test('capture and compare find a markup change, a status change, an unstable route and a missing route', async () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'html-parity-'));
  try {
    let calls = 0;
    const site = pages => async url => {
      const route = new URL(url).pathname;
      calls++;
      if (route === '/sitemap.xml') return new Response(`<urlset>${Object.keys(pages).map(p => `<url><loc>https://example.test${p}</loc></url>`).join('')}</urlset>`);
      const page = pages[route];
      if (page?.redirect) return new Response('', { status: 301, headers: { location: page.redirect } });
      return new Response(typeof page === 'function' ? page() : page ?? 'missing', { status: page ? 200 : 404 });
    };
    const before = path.join(temporary, 'before'), after = path.join(temporary, 'after');
    const base = 'http://127.0.0.1:4321';
    await capture({ base, routes: [], sitemap: true, samples: [], ignore: [], out: before }, site({ '/': '<h1>Home</h1>', '/about/': '<h1>About</h1>', '/old/': '<p>Old</p>', '/clock/': () => `<p>${calls}</p>` }));
    await capture({ base, routes: [], sitemap: true, samples: [], ignore: [], out: after }, site({ '/': '<h1>Home</h1>', '/about/': '<h1>About us</h1>', '/old/': { redirect: '/about/' }, '/clock/': () => `<p>${calls}</p>`, '/new/': '<p>New</p>' }));
    const results = Object.fromEntries(compare(before, after).map(r => [r.route, r]));
    assert.equal(results['/'].state, 'same');
    assert.equal(results['/about/'].state, 'changed');
    assert.match(results['/about/'].diff, /^\+<h1>About us<\/h1>$/m);
    assert.equal(results['/old/'].status, 'status 200 became 301 → /about/');
    assert.equal(results['/clock/'].unstable, true, 'a route that changes between requests is flagged');
    assert.equal(results['/new/'].state, 'missing-before');
    assert.throws(() => compare(before, path.join(temporary, 'nothing')), /has no parity\.json/);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
});
