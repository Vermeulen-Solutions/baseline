import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { once } from 'node:events';
import { auditPage, layoutShiftWindow, localPageURL, pageAuditOptions, pageRequestPolicy, parsePageAuditArgs, preparePageAuditOutput, publicResourceURL } from '../scripts/audit-page.mjs';

function fixture(run) {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-page-evidence-'));
  return Promise.resolve().then(() => run(parent)).finally(() => {
    assert.equal(path.dirname(parent), path.resolve(os.tmpdir()));
    assert.ok(path.basename(parent).startsWith('baseline-page-evidence-'));
    fs.rmSync(parent, { recursive: true, force: true });
  });
}

test('page evidence accepts an explicit public loopback URL and refuses remote, credentialed or ambiguous requests', () => {
  assert.equal(localPageURL('http://127.0.0.1:4321/services/').pathname, '/services/');
  assert.equal(localPageURL('http://[::1]:4321/').hostname, '[::1]');
  for (const url of ['https://example.com/', 'http://example.com/', 'file:///tmp/page.html', 'http://127.0.0.1:4321/?token=secret', 'http://127.0.0.1:4321/#section', 'http://user:pass@localhost/', 'http://localhost/_emdash/admin', 'http://localhost/api/content', 'http://localhost/admin/', 'http://localhost/with space']) assert.throws(() => localPageURL(url));
  assert.equal(publicResourceURL('http://user:pass@127.0.0.1:4321/font.woff2?token=private#fragment'), 'http://127.0.0.1:4321/font.woff2');
  assert.equal(publicResourceURL('data:text/plain,private'), 'data:[omitted]');
});

test('page evidence options bound observation work and preserve explicit conditions without universal budgets', () => {
  const options = pageAuditOptions({ url: 'http://localhost:4321/', out: '.emdash/checks/example' });
  assert.equal(options.runs, 3); assert.equal(options.width, 390); assert.equal(options.cpuRate, 1);
  assert.deepEqual(parsePageAuditArgs(['--help']), { help: true });
  assert.equal(parsePageAuditArgs(['--url', 'http://localhost:4321/', '--out', '.emdash/checks/new', '--width', '1440', '--cpu-rate', '4']).width, 1440);
  assert.throws(() => pageAuditOptions({ url: 'http://localhost/', out: 'src/generated-report' }));
  for (const input of [{ runs: 6 }, { runs: '1.5' }, { width: 100 }, { height: 99999 }, { settleMs: 20000 }, { timeoutMs: 0 }, { cpuRate: -1 }, { label: 'token=private' }]) assert.throws(() => pageAuditOptions({ url: 'http://localhost:4321/', out: '.emdash/checks/new', ...input }));
  for (const args of [['--url'], ['--url', 'http://localhost/', '--url', 'http://localhost/'], ['--unknown', 'x'], ['--help', '--out', 'new']]) assert.throws(() => parsePageAuditArgs(args));
});

test('page request policy blocks administrative setup/auth even on GET while allowing public media and ordinary public API resources', () => {
  const origin = 'http://127.0.0.1:4321';
  for (const pathname of ['/_emdash/api/setup/dev-bypass', '/_emdash/api/content/pages', '/%5femdash/api/setup/dev-bypass', '/_emdash%2Fapi/setup/dev-bypass']) assert.equal(pageRequestPolicy(origin + pathname, origin, 'GET'), 'administrative-endpoint');
  assert.equal(pageRequestPolicy(origin + '/admin/', origin, 'GET', true), 'administrative-endpoint');
  assert.equal(pageRequestPolicy(origin + '/api/route', origin, 'GET', true), 'administrative-endpoint');
  assert.equal(pageRequestPolicy(origin + '/api/public-feed', origin, 'GET'), null);
  assert.equal(pageRequestPolicy(origin + '/_emdash/api/media/file/example.webp', origin, 'GET'), null);
  assert.equal(pageRequestPolicy(origin + '/_image?href=media', origin, 'GET'), null);
  assert.equal(pageRequestPolicy(origin + '/_emdash/api/media/file/example.webp', origin, 'POST'), 'outside-public-get-origin');
});

test('page evidence output is exclusive and refuses links and missing parents before creating reports', () => fixture(parent => {
  const out = path.join(parent, 'report');
  assert.equal(preparePageAuditOutput(out), out);
  fs.writeFileSync(path.join(out, 'owner.txt'), 'preserve');
  assert.throws(() => preparePageAuditOutput(out));
  assert.equal(fs.readFileSync(path.join(out, 'owner.txt'), 'utf8'), 'preserve');
  assert.throws(() => preparePageAuditOutput(path.join(parent, 'missing', 'report')));
  assert.equal(fs.existsSync(path.join(parent, 'missing')), false);
  const linked = path.join(parent, 'linked');
  fs.symlinkSync(out, linked, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => preparePageAuditOutput(path.join(linked, 'nested')));
  assert.equal(fs.existsSync(path.join(out, 'nested')), false);
}));

test('layout-shift observation uses bounded one-second/five-second session windows rather than adding unrelated shifts', () => {
  assert.equal(layoutShiftWindow([]), 0);
  assert.equal(layoutShiftWindow([{ time: 0, value: 0.1 }, { time: 900, value: 0.2 }, { time: 1900, value: 0.4 }]), 0.4);
  const shifts = Array.from({ length: 8 }, (_, i) => ({ time: i * 800, value: 0.1 }));
  assert.ok(Math.abs(layoutShiftWindow(shifts) - 0.7) < 0.000001);
});

test('local browser collection refuses CI before output or browser launch', () => fixture(async parent => {
  const before = process.env.CI;
  process.env.CI = '1';
  try {
    await assert.rejects(auditPage({ url: 'http://localhost:4321/', out: path.join(parent, 'report') }), /local-only/);
    assert.equal(fs.existsSync(path.join(parent, 'report')), false);
  } finally { if (before === undefined) delete process.env.CI; else process.env.CI = before; }
}));

// Explicit local-only browser acceptance; these fixtures never run in normal CI/test tiers.
if (process.env.BASELINE_PAGE_BROWSER_TESTS === '1') {
  if (process.env.CI || process.env.GITHUB_ACTIONS === 'true') throw new Error('Page browser fixtures are local-only');
  test('real local browser reads rendered custom fonts, received bytes and bounded loading observations', () => fixture(async parent => {
    const font = fs.readFileSync('node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff2');
    const server = http.createServer((request, response) => {
      if (request.url === '/face.woff2') { response.writeHead(200, { 'content-type': 'font/woff2' }); response.end(font); return; }
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end('<!doctype html><html lang="en"><head><link rel="icon" href="data:,"><style>@font-face{font-family:SampleFace;src:url(/face.woff2) format("woff2");font-weight:400}body{font-family:SampleFace,sans-serif}h1{font-weight:400}</style></head><body><main><h1>Fictional chair repair</h1><p>Local font evidence with actual rendered glyphs.</p></main></body></html>');
    });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    try {
      const report = await auditPage({ url: `http://127.0.0.1:${server.address().port}/`, out: path.join(parent, 'report'), runs: 2, settleMs: 500, label: 'synthetic-font-fixture' });
      assert.equal(report.status, 'observed', JSON.stringify(report)); assert.equal(report.runs.length, 2);
      for (const run of report.runs) {
        assert.ok(run.resourceSummary.encodedBytes > font.length);
        assert.equal(run.blockedRequests.length, 0); assert.deepEqual(run.runtimeErrors, []);
        const heading = run.fonts.samples.find(item => item.selector === 'h1');
        assert.match(heading.css.family, /SampleFace/);
        assert.ok(heading.platformFonts.some(item => item.custom && item.family === 'Noto Sans' && item.glyphCount > 0));
        assert.ok(run.timings.largestContentfulPaint?.startTime >= 0);
        assert.ok(run.timings.layoutShiftWindowMax >= 0);
      }
      assert.ok(fs.existsSync(path.join(parent, 'report', 'page-evidence.json')));
    } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  }));

  test('real local browser blocks external/mutating requests and exposes missing fonts without logging secret query values', () => fixture(async parent => {
    let externalHits = 0, writes = 0, socketHits = 0;
    const external = http.createServer((request, response) => { externalHits++; response.end('unexpected'); });
    external.on('upgrade', (_request, socket) => { socketHits++; socket.destroy(); });
    external.listen(0, '127.0.0.1'); await once(external, 'listening');
    const server = http.createServer((request, response) => {
      if (request.method !== 'GET') { writes++; response.end('unexpected'); return; }
      if (request.url.startsWith('/missing.woff2')) { response.writeHead(404); response.end('missing'); return; }
      response.writeHead(200, { 'content-type': 'text/html' });
      response.end(`<!doctype html><style>@font-face{font-family:MissingFace;src:url('/missing.woff2?token=private') }body{font-family:MissingFace,serif}</style><h1>Font fallback</h1><p>Bounded local observation.</p><img src="http://127.0.0.1:${external.address().port}/remote?key=private"><script>fetch('/write?token=private',{method:'POST',body:'private'});new WebSocket('ws://127.0.0.1:${external.address().port}/socket?token=private');new WebSocket('ws://'+location.host+'/socket?token=private');window.open('http://127.0.0.1:${external.address().port}/popup?token=private');window.open('/popup-redirect');</script>`);
    });
    server.on('upgrade', (_request, socket) => { socketHits++; socket.destroy(); });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    try {
      const report = await auditPage({ url: `http://127.0.0.1:${server.address().port}/`, out: path.join(parent, 'report'), runs: 1, settleMs: 500 });
      assert.equal(report.status, 'incomplete'); assert.equal(externalHits, 0); assert.equal(writes, 0); assert.equal(socketHits, 0);
      assert.ok(report.runs[0].blockedRequests.some(item => item.method === 'POST'));
      assert.equal(report.runs[0].blockedRequests.filter(item => item.method === 'WEBSOCKET').length, 2);
      assert.ok(report.runs[0].blockedRequests.some(item => item.reason === 'unexpected-popup-navigation'));
      assert.ok(report.runs[0].fonts.failedResources.length > 0);
      assert.ok(report.runs[0].fonts.samples.some(item => item.platformFonts?.some(font => !font.custom)));
      assert.doesNotMatch(fs.readFileSync(path.join(parent, 'report', 'page-evidence.json'), 'utf8'), /private/);
    } finally { server.closeAllConnections(); external.closeAllConnections(); await Promise.all([new Promise(resolve => server.close(resolve)), new Promise(resolve => external.close(resolve))]); }
  }));

  test('real local browser refuses setup requests and redirected admin navigation while still fetching public CMS media', () => fixture(async parent => {
    let setupHits = 0, mediaHits = 0;
    const server = http.createServer((request, response) => {
      if (request.url.startsWith('/_emdash/api/setup/')) { setupHits++; response.end('unexpected setup'); return; }
      if (request.url === '/_emdash/api/media/file/example.svg') { mediaHits++; response.writeHead(200, { 'content-type': 'image/svg+xml' }); response.end('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'); return; }
      if (request.url === '/redirect') { response.writeHead(302, { location: '/_emdash/api/setup/dev-bypass' }); response.end(); return; }
      response.writeHead(200, { 'content-type': 'text/html' }); response.end('<!doctype html><link rel="icon" href="data:,"><h1>Public fixture</h1><main><p>Public media remains readable.</p><img width="10" height="10" src="/_emdash/api/media/file/example.svg"></main><script>fetch("/_emdash/api/setup/dev-bypass");</script>');
    });
    server.listen(0, '127.0.0.1'); await once(server, 'listening');
    try {
      const origin = `http://127.0.0.1:${server.address().port}`;
      const publicReport = await auditPage({ url: origin + '/', out: path.join(parent, 'public-report'), runs: 1, settleMs: 250 });
      assert.equal(publicReport.status, 'incomplete'); assert.equal(setupHits, 0); assert.equal(mediaHits, 1);
      assert.ok(publicReport.runs[0].blockedRequests.some(item => item.reason === 'administrative-endpoint'));
      const redirectReport = await auditPage({ url: origin + '/redirect', out: path.join(parent, 'redirect-report'), runs: 1, settleMs: 250 });
      assert.equal(redirectReport.status, 'incomplete'); assert.equal(setupHits, 0);
      assert.ok(redirectReport.runs[0].blockedRequests.some(item => item.reason === 'administrative-endpoint'));
    } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  }));
}
