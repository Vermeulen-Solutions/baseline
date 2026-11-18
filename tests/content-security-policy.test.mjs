import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { cspMode, inlineBlocks, hashSource, parseSources, buildPolicy, cspApplies, withContentSecurityPolicy } from '../src/lib/content-security-policy.ts';

const html = (body, headers = {}) => new Response(body, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', ...headers } });
const options = (extra = {}) => ({ mode: 'enforce', pathname: '/', method: 'GET', cookie: null, ...extra });

test('the mode is off unless the build says report or enforce', () => {
  assert.equal(cspMode(undefined), 'off');
  assert.equal(cspMode('yes'), 'off');
  assert.equal(cspMode('report'), 'report');
  assert.equal(cspMode('enforce'), 'enforce');
});

test('inline blocks: executed scripts and styles, not external, data or commented-out ones', () => {
  const page = `<script>a()</script><script src="/x.js"></script><script type="module">b()</script>
    <script type="application/ld+json">{"@type":"Thing"}</script><script type="speculationrules">{"prefetch":[]}</script>
    <script type='importmap'>{}</script><!-- <script>c()</script> --><style>p{}</style><style media="print">\r\nq{}</style>`;
  assert.deepEqual(inlineBlocks(page), { scripts: ['a()', 'b()', '{"prefetch":[]}', '{}'], styles: ['p{}', '\nq{}'] });
});

test('hash sources are base64 SHA-256, as browsers compute them', async () => {
  const expected = `'sha256-${createHash('sha256').update('alert(1)').digest('base64')}'`;
  assert.equal(await hashSource('alert(1)'), expected);
});

test('extra sources add to directives, and anything that could break the header is refused', () => {
  const extra = parseSources('script-src https://static.cloudflareinsights.com; connect-src https://cloudflareinsights.com;frame-src https://www.youtube-nocookie.com');
  assert.deepEqual(extra, { 'script-src': ['https://static.cloudflareinsights.com'], 'connect-src': ['https://cloudflareinsights.com'], 'frame-src': ['https://www.youtube-nocookie.com'] });
  assert.deepEqual(parseSources(undefined), {});
  assert.throws(() => parseSources('Script-Src https://a.test'), /not a directive name/);
  assert.throws(() => parseSources('img-src https://a.test,https://b.test'), /not a source expression/);
  assert.throws(() => parseSources("img-src 'self\"'"), /not a source expression/);
  const policy = buildPolicy({ scripts: ["'sha256-AAA='"], styles: ["'sha256-BBB='"] }, { ...extra, 'object-src': ["'none'"], 'img-src': ["'none'"] });
  assert.match(policy, /script-src 'self' 'sha256-AAA=' https:\/\/static\.cloudflareinsights\.com/);
  assert.match(policy, /style-src 'self' 'sha256-BBB='/);
  assert.match(policy, /style-src-attr 'unsafe-inline'/);
  assert.match(policy, /frame-src 'self' https:\/\/www\.youtube-nocookie\.com/);
  assert.match(policy, /img-src 'none'(;|$)/, "an explicit 'none' replaces the base list");
  assert.match(policy, /frame-ancestors 'self'/);
  assert.doesNotMatch(policy, /unsafe-inline' 'sha|script-src[^;]*unsafe/);
});

test('the policy skips the admin, signed-in requests, existing policies, non-HTML and bodiless responses', () => {
  assert.equal(cspApplies(html('<p>'), options()), true);
  assert.equal(cspApplies(html('<p>'), options({ mode: 'off' })), false);
  assert.equal(cspApplies(html('<p>'), options({ pathname: '/_emdash/admin' })), false);
  assert.equal(cspApplies(html('<p>'), options({ pathname: '/_emdashboard' })), true, 'only the /_emdash segment is skipped');
  assert.equal(cspApplies(html('<p>'), options({ method: 'HEAD' })), false);
  assert.equal(cspApplies(html('<p>'), options({ cookie: 'theme=dark; astro-session=abc' })), false);
  assert.equal(cspApplies(html('<p>'), options({ cookie: 'emdash-edit-mode=1' })), false);
  assert.equal(cspApplies(html('<p>'), options({ cookie: 'theme=dark' })), true);
  assert.equal(cspApplies(html('<p>', { 'content-security-policy': "default-src 'none'" }), options()), false);
  assert.equal(cspApplies(html('<p>', { 'content-security-policy-report-only': "default-src 'none'" }), options()), false);
  assert.equal(cspApplies(new Response('{}', { headers: { 'content-type': 'application/json' } }), options()), false);
  assert.equal(cspApplies(new Response(null, { status: 302, headers: { location: '/', 'content-type': 'text/html' } }), options()), false);
});

test('report mode sends the report-only header, enforce the real one, with the body unchanged', async () => {
  const body = '<!doctype html><html><head><style>p{}</style></head><body><script>go()</script></body></html>';
  const reported = await withContentSecurityPolicy(html(body, { 'x-kept': '1' }), options({ mode: 'report' }));
  assert.equal(reported.headers.has('content-security-policy'), false);
  const policy = reported.headers.get('content-security-policy-report-only');
  assert.ok(policy.includes(await hashSource('go()')));
  assert.ok(policy.includes(await hashSource('p{}')));
  assert.equal(reported.headers.get('x-kept'), '1');
  assert.equal(await reported.text(), body);
  const enforced = await withContentSecurityPolicy(html(body), options());
  assert.ok(enforced.headers.get('content-security-policy').includes(await hashSource('go()')));
  const untouched = html(body);
  assert.equal(await withContentSecurityPolicy(untouched, options({ mode: 'off' })), untouched);
});

test('the middleware applies the computed policy before the baseline security headers', () => {
  const middleware = readFileSync(new URL('../src/middleware.ts', import.meta.url), 'utf8');
  assert.match(middleware, /const CSP_MODE = cspMode\(import\.meta\.env\.CSP_MODE\);/);
  assert.match(middleware, /return withSecurityHeaders\(response\);/);
  assert.ok(middleware.indexOf('withContentSecurityPolicy(await handle(') < middleware.indexOf('return withSecurityHeaders(response)'));
});
