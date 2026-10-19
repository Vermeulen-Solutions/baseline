import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collectMigrationHTTP } from '../scripts/migration-http.mjs';
import { localEvidenceVerifier, runMigration } from '../scripts/migration-verify.mjs';
import { migrationReport } from '../scripts/migration-report.mjs';
import { contractDigest, validateManifest, validateObservations, validateMigrationReport } from '../standards/schemas/migration-acceptance.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const baseline = () => JSON.parse(fs.readFileSync(new URL('./fixtures/migration-acceptance/manifest.json', import.meta.url)));
const required = value => ({ value, required: true });
async function site(run, handler) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-migration-http-'));
  const requests = []; let active = 0, maximum = 0, origin;
  const server = http.createServer((req, res) => {
    requests.push({ path: req.url, method: req.method, headers: req.headers }); active++; maximum = Math.max(active, maximum);
    res.once('close', () => { active--; });
    if (handler?.(req, res, origin) === true) return;
    const url = new URL(req.url, origin);
    if (url.pathname === '/' || url.pathname === '/ok/' || url.pathname === '/end/') {
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(`<!doctype html><html><head><TITLE>Example &amp; Co</TITLE><meta NAME="description" content="Fixture > description"><link REL="canonical" href="${origin}/"><meta name="robots" content="index, follow"></head><body><h1 id="welcome">Welcome</h1><a href="/ok/?a=1&amp;b=2">Internal</a><a href="https://external.example.test/">External</a><picture><source srcset="/wide.png 1200w, /narrow.png 600w"><img src="/image.png?x=1&amp;y=2" srcset="/image.png 1x, /image-2.png 2x" loading="lazy"></picture><script>const fake = '<a href="/must-not-request/">';</script></body></html>`); return;
    }
    if (/\.png$/.test(url.pathname)) { res.setHeader('content-type', 'image/png'); res.end('synthetic-image-no-decode-claim'); return; }
    res.statusCode = 404; res.setHeader('content-type', 'text/html'); res.end('<!doctype html><title>Missing</title>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); origin = `http://127.0.0.1:${server.address().port}`;
  try { return await run({ directory, origin, server, requests, maximum: () => maximum }); }
  finally {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir())); assert.match(path.basename(directory), /^baseline-migration-http-/);
    fs.rmSync(directory, { recursive: true, force: true });
  }
}
function manifestFor(origin) {
  const manifest = baseline(); manifest.manifestVersion = 2;
  manifest.targetOrigin = origin; manifest.productionOrigin = origin; manifest.allowedAssetOrigins = [origin];
  manifest.urls = [{ id: 'home', sourceUrl: manifest.sourceOrigin + '/', locale: 'en', disposition: 'retained', requestPath: '/', expected: { status: 200, title: required('Example & Co'), description: required('Fixture > description'), canonical: required(origin + '/'), robots: required(['index', 'follow']), fragments: required(['welcome']), indexability: required('indexable'), links: required('reachable'), assets: required('reachable'), reviewSignals: { value: 'report', required: false } } }];
  return manifest;
}
async function collect(manifest, directory, signal) {
  const out = path.join(directory, 'run-' + fs.readdirSync(directory).length); fs.mkdirSync(out);
  const observations = await collectMigrationHTTP(manifest, { directory: out, signal });
  const report = migrationReport(manifest, observations, { scope: 'url', runId: 'http-test', generatedAt: new Date().toISOString(), verifyArtifact: localEvidenceVerifier(out), collected: true });
  assert.deepEqual(validateObservations(observations, manifest), []); assert.deepEqual(validateMigrationReport(report, manifest), []);
  return { report, observations, out };
}
const check = (report, suffix) => report.checks.find(item => item.id === `url:home:${suffix}`);

test('v2 opts into HTTP assertions without changing v1 declaration meanings or permitting unbounded limits', () => {
  const reference = JSON.parse(fs.readFileSync(new URL('./fixtures/migration-acceptance/http-manifest.json', import.meta.url)));
  assert.deepEqual(validateManifest(reference), []);
  const manifest = manifestFor('http://127.0.0.1:12345'); assert.deepEqual(validateManifest(manifest), []);
  manifest.manifestVersion = 1; assert.ok(validateManifest(manifest).length);
  manifest.manifestVersion = 2; manifest.http = { concurrency: 5 }; assert.ok(validateManifest(manifest).length);
  manifest.http = { timeoutMs: 10, maxRequests: 1 }; assert.deepEqual(validateManifest(manifest), []);
  manifest.urls[0].expected.reviewSignals.required = true; assert.ok(validateManifest(manifest).length);
});

test('live loopback pass parses structural HTML, entities, headings, srcset and records bounded evidence', async () => site(async ({ directory, origin, requests }) => {
  const manifest = manifestFor(origin), { report, out, observations } = await collect(manifest, directory);
  assert.equal(report.exitCode, 0); assert.equal(report.reportVersion, 2);
  assert.match(report.scopeNotice, /content, editor and provider parity were not assessed/);
  assert.equal(check(report, 'title').status, 'pass'); assert.equal(check(report, 'assets').status, 'pass');
  assert.ok(report.checks.filter(item => item.category !== 'url').every(item => item.status === 'not-applicable'));
  assert.ok(requests.some(request => request.path === '/ok/?a=1&b=2'));
  for (const image of ['/wide.png', '/narrow.png', '/image-2.png', '/image.png?x=1&y=2']) assert.ok(requests.some(request => request.path === image), image);
  assert.ok(!requests.some(request => request.path === '/must-not-request/'));
  const artifact = JSON.parse(fs.readFileSync(path.join(out, 'artifacts/home.json')));
  assert.deepEqual(artifact.headings, [{ level: 1, text: 'Welcome' }]); assert.equal(artifact.producer, 'baseline-http-collector/1');
  assert.equal(observations.manifestSHA256, contractDigest(manifest));
  const altered=structuredClone(report);delete altered.scopeNotice;assert.ok(validateMigrationReport(altered,manifest).length);
}));

test('wrong page status is a failure; unavailable metadata remains unknown with failure retained', async () => site(async ({ directory, origin }) => {
  const manifest = manifestFor(origin); manifest.urls[0].requestPath = '/lost/';
  const { report } = await collect(manifest, directory);
  assert.equal(check(report, 'status').status, 'fail'); assert.equal(report.exitCode, 2);
  manifest.urls[0].expected = { status: 200 };
  assert.equal((await collect(manifest, directory)).report.exitCode, 1);
}));

test('exact redirect paths, query bytes and slash policy pass; loops and wrong destinations fail', async () => site(async ({ directory, origin }) => {
  const manifest = manifestFor(origin); manifest.urls[0].requestPath = '/old/?a=1&b=2'; manifest.urls[0].disposition = 'redirected';
  manifest.urls[0].expected = { status: 200, redirects: [{ status: 301, path: '/middle/?a=1&b=2' }, { status: 302, path: '/end/?a=1&b=2' }] };
  assert.equal((await collect(manifest, directory)).report.exitCode, 0);
  manifest.urls[0].expected.redirects[1].path = '/end/?b=2&a=1';
  assert.equal((await collect(manifest, directory)).report.exitCode, 1);
  manifest.urls[0].requestPath = '/loop/';
  assert.equal((await collect(manifest, directory)).report.exitCode, 1);
}, (req, res) => {
  if (req.url.startsWith('/old/')) { res.writeHead(301, { location: '/middle/?a=1&b=2' }); res.end(); return true; }
  if (req.url.startsWith('/middle/')) { res.writeHead(302, { location: '/end/?a=1&b=2' }); res.end(); return true; }
  if (req.url === '/loop/') { res.writeHead(301, { location: '/loop/' }); res.end(); return true; }
  return false;
}));

test('redirects to undeclared hosts, user-info URLs, missing destinations and error pages cannot pass', async () => site(async ({ directory, origin, requests }) => {
  for (const route of ['/external/', '/userinfo/', '/no-location/', '/to-error/']) {
    const manifest = manifestFor(origin); manifest.urls[0].requestPath = route; manifest.urls[0].expected = { status: 200 };
    assert.equal((await collect(manifest, directory)).report.exitCode, 1, route);
  }
  assert.ok(!requests.some(request => request.path === '/never/' || request.path === '/secret/'));
}, (req, res, origin) => {
  const destinations = { '/external/': 'http://127.0.0.1:1/never/', '/userinfo/': origin.replace('://', '://user:secret@') + '/secret/', '/to-error/': '/lost/' };
  if (req.url in destinations || req.url === '/no-location/') { res.writeHead(301, destinations[req.url] ? { location: destinations[req.url] } : {}); res.end(); return true; }
  return false;
}));

test('empty query markers and encoded/repeated query values survive exact path comparison', async () => site(async ({ directory, origin, requests }) => {
  for (const requestPath of ['/empty/?', '/encoded/?q=one%20two&q=three&empty=']) {
    const manifest=manifestFor(origin);manifest.urls[0].requestPath=requestPath;manifest.urls[0].expected={status:200};
    assert.equal((await collect(manifest,directory)).report.exitCode,0);
    assert.ok(requests.some(request=>request.path===requestPath || (requestPath === '/empty/?' && request.path === '/empty/')));
  }
},(req,res)=>{
  if(req.url.startsWith('/empty/')||req.url.startsWith('/encoded/')){res.end('exact URL');return true;}return false;
}));

test('production canonicals, duplicate tags, unexpected header noindex and missing fragment IDs are detected', async () => site(async ({ directory, origin }) => {
  const manifest = manifestFor(origin); manifest.productionOrigin = 'https://production.example.test'; manifest.urls[0].expected.canonical.value = manifest.productionOrigin + '/';
  const report = (await collect(manifest, directory)).report;
  assert.equal(check(report, 'canonical').status, 'fail'); assert.equal(check(report, 'indexability').status, 'fail');
  assert.equal(check(report, 'title').status, 'fail'); assert.equal(check(report, 'fragments').status, 'fail'); assert.equal(report.exitCode, 1);
}, (req, res, origin) => {
  if (req.url !== '/') return false;
  res.writeHead(200, { 'content-type': 'text/html', 'x-robots-tag': 'noindex' });
  res.end(`<!doctype html><head><title>Example &amp; Co</title><title>Duplicate</title><meta name="description" content="Fixture > description"><link rel="canonical" href="${origin}/"></head><body></body>`); return true;
}));

test('broken internal links and missing/nonimage media fail; HEAD 405 fallback uses bounded GET', async () => site(async ({ directory, origin, requests }) => {
  const manifest = manifestFor(origin), report = (await collect(manifest, directory)).report;
  assert.equal(check(report, 'links').status, 'fail'); assert.equal(check(report, 'assets').status, 'fail'); assert.equal(report.exitCode, 1);
  assert.ok(requests.some(request => request.path === '/fallback/' && request.method === 'HEAD'));
  assert.ok(requests.some(request => request.path === '/fallback/' && request.method === 'GET'));
  assert.ok(requests.some(request => request.path === '/fallback.png' && request.method === 'GET'));
}, (req, res, origin) => {
  if (req.url === '/') { res.setHeader('content-type','text/html'); res.end(`<!doctype html><title>Example &amp; Co</title><meta name="description" content="Fixture > description"><link rel="canonical" href="${origin}/"><meta name="robots" content="index,follow"><h1 id="welcome">Hi</h1><a href="/missing-link/">Missing</a><a href="/fallback/">Fallback</a><img src="/fallback.png"><img src="/missing.png"><img src="/pretend.png">`); return true; }
  if (req.url === '/fallback/' || req.url === '/fallback.png') { res.writeHead(req.method === 'HEAD' ? 405 : 200, { 'content-type': req.url.endsWith('.png') ? 'image/png' : 'text/html' }); res.end('fixture'); return true; }
  if (req.url === '/missing.png') { res.writeHead(404, {'content-type':'image/png'}); res.end(); return true; }
  if (req.url === '/pretend.png') { res.setHeader('content-type','text/html'); res.end('error page'); return true; }
  return false;
}));

test('removals and exclusions remain visible, excluded pages are never fetched', async () => site(async ({ directory, origin, requests }) => {
  const manifest = manifestFor(origin);
  manifest.urls = [
    { ...manifest.urls[0], requestPath: '/gone/', disposition: 'removed', expected: { status: 410 } },
    { id: 'excluded', sourceUrl: manifest.sourceOrigin + '/private/', locale: 'en', disposition: 'excluded', reason: 'Deliberate private exclusion.' },
  ];
  const { report } = await collect(manifest, directory);
  assert.equal(report.exitCode, 0); assert.equal(report.coverage.urls.excluded, 1); assert.ok(!requests.some(request => request.path === '/private/'));
}, (req, res) => { if (req.url === '/gone/') { res.writeHead(410); res.end(); return true; } return false; }));

test('timeout and cancellation retain completed evidence and do not become clean passes', async () => site(async ({ directory, origin }) => {
  const manifest = manifestFor(origin); manifest.http = { timeoutMs: 100, concurrency: 1, runTimeoutMs: 5000 };
  manifest.urls[0].expected = { status: 200 };
  manifest.urls.push({ ...structuredClone(manifest.urls[0]), id: 'slow', sourceUrl: manifest.sourceOrigin + '/slow/', requestPath: '/slow/' });
  const report = (await collect(manifest, directory)).report;
  assert.equal(check(report, 'status').status, 'pass'); assert.equal(report.checks.find(item => item.id === 'url:slow:status').status, 'unverified'); assert.equal(report.exitCode, 2);
  const controller = new AbortController(); controller.abort();
  assert.equal((await collect(manifest, directory, controller.signal)).report.exitCode, 2);
  const during = new AbortController(), timeout = setTimeout(() => during.abort(), 30);
  try { assert.equal((await collect(manifest, directory, during.signal)).report.exitCode, 2); }
  finally { clearTimeout(timeout); }
}, (req) => req.url === '/slow/'));

test('a broken reference and a timed-out reference retain failure plus required unknown coverage', async () => site(async ({ directory, origin }) => {
  const manifest = manifestFor(origin); manifest.http = { timeoutMs: 100 };
  manifest.urls[0].expected = { status: 200, links: required('reachable') };
  const report = (await collect(manifest, directory)).report;
  assert.equal(check(report, 'links').status, 'fail'); assert.equal(check(report, 'collection').status, 'unverified'); assert.equal(report.exitCode, 2);
}, (req,res) => {
  if(req.url==='/'){res.setHeader('content-type','text/html');res.end('<!doctype html><a href="/lost/">Lost</a><a href="/slow/">Slow</a>');return true;}
  return req.url==='/slow/';
}));

test('streamed over-budget bodies and a stalled 404 preserve bounded partial evidence', async () => site(async ({ directory, origin }) => {
  const manifest=manifestFor(origin);manifest.http={maxResponseBytes:1000,timeoutMs:100};
  manifest.urls[0].requestPath='/large/';manifest.urls[0].expected={status:200,title:required('Expected')};
  assert.equal((await collect(manifest,directory)).report.exitCode,2);
  manifest.urls[0].requestPath='/stalled-error/';
  const report=(await collect(manifest,directory)).report;
  assert.equal(check(report,'status').status,'fail');assert.equal(check(report,'title').status,'unverified');assert.equal(report.exitCode,2);
},(req,res)=>{
  if(req.url==='/large/'){res.writeHead(200,{'content-type':'text/html'});res.write('x'.repeat(2000));res.end();return true;}
  if(req.url==='/stalled-error/'){res.writeHead(404,{'content-type':'text/html'});res.flushHeaders();res.write('<title>Partial');return true;}
  return false;
}));

test('same-origin legacy references remain legitimate and undeclared image origins are not requested', async () => site(async ({ directory, origin, requests }) => {
  const manifest=manifestFor(origin);manifest.sourceOrigin=origin;manifest.urls[0].sourceUrl=origin+'/';
  manifest.urls[0].expected={status:200,assets:required('reachable'),reviewSignals:{value:'report',required:false}};
  const report=(await collect(manifest,directory)).report;
  assert.equal(check(report,'reviewSignals').status,'pass');assert.equal(check(report,'assets').status,'fail');
  assert.equal(requests.length,1);
},(req,res,origin)=>{
  if(req.url!=='/')return false;
  res.setHeader('content-type','text/html');res.end(`<!doctype html><title>Site</title><a href="${origin}/">Retained domain</a><img src="http://127.0.0.1:1/not-allowed.png">`);return true;
}));

test('response, reference, request and hop caps yield bounded failures/unknowns rather than silent truncation', async () => site(async ({ directory, origin }) => {
  const manifest = manifestFor(origin); manifest.http = { maxResponseBytes: 100 };
  assert.equal((await collect(manifest, directory)).report.exitCode, 2);
  manifest.http = { maxReferencesPerPage: 1 };
  assert.equal(check((await collect(manifest, directory)).report, 'assets').status, 'unverified');
  manifest.http = { maxRequests: 1 };
  assert.equal(check((await collect(manifest, directory)).report, 'links').status, 'unverified');
  manifest.http = { maxRedirects: 1 }; manifest.urls[0].requestPath = '/hop/'; manifest.urls[0].expected = { status: 200 };
  assert.equal((await collect(manifest, directory)).report.exitCode, 1);
}, (req,res) => {
  if (req.url === '/hop/' || req.url === '/hop-two/') { res.writeHead(301,{location:req.url==='/hop/'?'/hop-two/':'/end/'}); res.end(); return true; } return false;
}));

test('network concurrency is bounded and no cookies, auth or sensitive headers cross allowed origins', async () => {
  let destination;
  await site(async ({ directory, origin, maximum }) => {
    await site(async ({ origin: second, requests: remote }) => {
      destination = second;
      const manifest = manifestFor(origin); manifest.productionOrigin = second; manifest.http = { concurrency: 2 };
      manifest.urls = Array.from({length:4},(_,i)=>({id:'route-'+i,sourceUrl:manifest.sourceOrigin+'/route-'+i+'/',locale:'en',disposition:'redirected',requestPath:'/route-'+i+'/',expected:{status:200,redirects:[{status:301,path:'/end/'}]}}));
      const { report } = await collect(manifest, directory);
      assert.equal(report.exitCode, 0, JSON.stringify(report));
      assert.ok(maximum() <= 2); assert.ok(remote.length);
      for(const request of remote)for(const header of ['authorization','cookie','referer','x-api-key'])assert.equal(request.headers[header],undefined);
    });
  }, (req,res) => {
    if(!req.url.startsWith('/route-'))return false;
    setTimeout(()=>{res.writeHead(301,{location:destination+'/end/','set-cookie':'secret=must-not-forward','x-api-key':'must-not-forward'});res.end();},25);return true;
  });
});

test('review signals use parsed text/comments, are advisory, and srcset data commas do not create fake requests', async () => site(async ({ directory, origin, requests }) => {
  const manifest = manifestFor(origin); manifest.urls[0].expected = {status:200,assets:required('reachable'),reviewSignals:{value:'report',required:false}};
  const {report} = await collect(manifest,directory);
  assert.equal(report.exitCode,0); assert.equal(check(report,'reviewSignals').status,'advisory');
  assert.ok(!requests.some(request=>request.path.includes('svg')));
},(req,res)=>{
  if(req.url!=='/')return false;
  res.setHeader('content-type','text/html');res.end('<!doctype html><title>Review</title><p>[gallery ids="1"] https://legacy.example.test/</p><!-- wp:unsupported /--><img srcset="data:image/svg+xml,%3Csvg%3E 1x, /image.png 2x">');return true;
}));

test('CLI collects live observations, replays them offline, and refuses existing output before requests', async () => site(async ({directory,origin,requests})=>{
  const manifest=manifestFor(origin),file=path.join(directory,'manifest.json');fs.writeFileSync(file,JSON.stringify(manifest));
  const out=path.join(directory,'live');
  const run=await runMigration({manifest:file,scope:'url',format:'both',out});assert.equal(run.report.exitCode,0);
  const count=requests.length;
  const replay=await runMigration({manifest:file,observations:path.join(out,'observations.json'),scope:'url',format:'both',out:path.join(directory,'replay')});
  assert.deepEqual(replay.report.checks,run.report.checks);assert.equal(requests.length,count);
  await assert.rejects(runMigration({manifest:file,scope:'url',format:'both',out}));assert.equal(requests.length,count);
  const child=spawn(process.execPath,[path.join(root,'scripts/migration-verify.mjs'),'--manifest',file,'--scope','url','--out',path.join(directory,'cli')],{stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';child.stdout.on('data',bytes=>stdout+=bytes);child.stderr.on('data',bytes=>stderr+=bytes);
  const [code]=await once(child,'exit');assert.equal(code,0,stderr);assert.equal(JSON.parse(stdout).scope,'url');
}));
