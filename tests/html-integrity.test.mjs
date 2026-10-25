import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { auditHTMLIntegrity, auditBuildIntegrity } from '../scripts/audit-html-integrity.mjs';
import { snapshotSSR } from '../scripts/snapshot-ssr.mjs';
import devTools from '../scripts/dev-tools-integration.mjs';

function fixture(files, check) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'html-integrity-'));
  try {
    for (const [file, content] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.writeFileSync(path.join(root, file), content);
    }
    return check(root);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

test('HTML auditor resolves directory/file routes, queries, entities and cross-page encoded anchors', () => fixture({
  'index.html': '<link rel="canonical" href="https://example.com/"><a href="/about/?x=1&amp;y=2#caf%C3%A9">About</a><a href="file.pdf">File</a><a href="https://elsewhere.invalid/missing">External</a><a href="mailto:a@example.com">Mail</a>',
  'about/index.html': '<h1 id="café">About</h1><a href="../#top">Home</a>',
  'file.pdf': '',
}, root => {
  fs.appendFileSync(path.join(root, 'index.html'), '<h1 id="top">Home</h1>');
  const report = auditHTMLIntegrity(root);
  assert.deepEqual(report.errors, []); assert.equal(report.htmlFiles, 2);
  assert.ok(report.durationMs < 1000);
}));

test('HTML auditor catches 404s, same-origin absolute links and broken anchors', () => fixture({
  'index.html': '<link rel=canonical href="https://example.com/"><a href="/missing">Bad</a><a href="#absent">Bad</a><a href="https://example.com/missing">Bad</a><a href="/%xx">Invalid</a>',
}, root => {
  const errors = auditHTMLIntegrity(root).errors;
  assert.equal(errors.filter(e => e.rule === 'link').length, 3);
  assert.equal(errors.filter(e => e.rule === 'anchor').length, 1);
}));

test('HTML auditor checks delivered image metadata and ignores fake tags in raw text/comments', () => fixture({
  'index.html': `<!-- <img> --><script>const fake = '<img>';</script><style>/* <img> */</style><textarea><img></textarea>
    <img width=320 height=200 alt="Photo > sunrise"><img style="aspect-ratio: 4 / 3" alt=Photo><img width=20 height=10 alt="">
    <img alt=Missing><img width=20 height=10><img width=0 height=20 alt=Zero><img width=20 height=30 alt=" "><img style="aspect-ratio: 0" alt=Zero>`,
}, root => {
  const errors = auditHTMLIntegrity(root).errors;
  assert.equal(errors.filter(e => e.rule === 'image-dimensions').length, 3);
  assert.equal(errors.filter(e => e.rule === 'image-alt').length, 2);
  assert.ok(errors.some(e => e.rule === 'image-alt' && e.message.includes('alt=""')));
}));

test('HTML auditor validates JSON-LD syntax/context/types and canonical/OpenGraph URLs', () => fixture({
  'index.html': `<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","name":"A & B"}</script>
    <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization"}]}</script>
    <script type="application/ld+json">{broken</script><script type="application/ld+json">{"name":"No schema"}</script>
    <link rel=canonical href="/relative"><meta property=og:url content="javascript:bad"><meta property=og:title content="">`,
}, root => {
  const errors = auditHTMLIntegrity(root).errors;
  assert.equal(errors.filter(e => e.rule === 'json-ld').length, 2);
  assert.equal(errors.filter(e => e.rule === 'canonical').length, 1);
  assert.equal(errors.filter(e => e.rule === 'opengraph').length, 2);
}));

test('HTML auditor rejects fixture/test output and runtime fixture routes without executing server code', () => fixture({
  'client/index.html': '', 'client/_styleguide/index.html': '', 'server/example.test.mjs': '', 'server/chunks/_styleguide_hash.mjs': '',
  '.starter-routes.json': JSON.stringify([{ route: '/_form-recovery', prerender: false }]),
}, root => {
  const report = auditHTMLIntegrity(root);
  assert.equal(report.valid, false); assert.equal(report.runtimeRoutes, 1);
  assert.ok(report.errors.some(e => e.file === 'server/example.test.mjs'));
  assert.ok(report.errors.some(e => e.file === 'server/chunks/_styleguide_hash.mjs'));
  assert.ok(report.errors.some(e => e.file === '/_form-recovery'));
}));

test('HTML audit CLI fails on missing builds, broken HTML and failed SSR instead of passing zero HTML', () => fixture({
  'server/entry.mjs': 'throw Error("Do not execute");',
}, root => {
  const cli = fileURLToPath(new URL('../scripts/audit-html-integrity.mjs', import.meta.url));
  const run = directory => spawnSync(process.execPath, [cli, directory], { encoding: 'utf8' });
  const empty = run(root); assert.equal(empty.status, 1); assert.doesNotMatch(empty.stdout, /HTML integrity: PASS/);
  fs.writeFileSync(path.join(root, 'index.html'), '<img>');
  assert.equal(run(root).status, 1);
  assert.equal(run(path.join(root, 'missing')).status, 1);
}));

const serverSource = `
import http from 'node:http';
const page = content => '<!doctype html><html><head><link rel="canonical" href="https://snapshot.example/"><script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script></head><body><main id="main">'+content+'</main></body></html>';
const server = http.createServer((req,res) => {
 const url = new URL(req.url,'http://localhost');
 if(url.pathname==='/legacy'){res.writeHead(301,{location:'/sample/'});res.end();return;}
 if(url.pathname.startsWith('/baseline-audit-missing-')){res.writeHead(302,{location:'/404'});res.end();return;}
 res.setHeader('content-type','text/html');
 if(url.pathname==='/')res.end(page('<a href="/sample/?view=full#detail">Sample</a><a href="/legacy#detail">Old</a><img width="120" height="80" alt="Sample">'+(process.env.SNAPSHOT_BROKEN ? '<a href="/missing">Broken</a><a href="#absent">Anchor</a><img alt="No dimensions"><script type="application/ld+json">broken</script>' : '')));
 else if(url.pathname==='/sample/')res.end(page('<h1 id="detail">Sample</h1><a href="../#main">Home</a>'));
 else{res.statusCode=404;res.end(page('<h1>Not found</h1><a href="#main">Skip</a><a href="/">Home</a>'));}
});
server.listen(Number(process.env.PORT),process.env.HOST,()=>console.log('Server listening on http://127.0.0.1:'+server.address().port));
process.on('SIGTERM',()=>{server.closeAllConnections();server.close(()=>process.exit());});
`;
async function serverFixture(source, check) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'baseline-ssr-'));
  try {
    const artifact = path.join(root, 'dist'); fs.mkdirSync(path.join(artifact, 'server'), { recursive: true });
    fs.writeFileSync(path.join(artifact, '.starter-build.json'), JSON.stringify({ version: 1, profile: 'release', deployable: true }));
    fs.writeFileSync(path.join(artifact, 'server/entry.mjs'), source);
    await check(root, artifact);
  } finally {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('baseline-ssr-'));
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('SSR snapshots capture and audit real responses, redirects, queries and 404 anchors below three seconds', () => serverFixture(serverSource, async (root, artifact) => {
  let child;
  const started = performance.now();
  const report = await auditBuildIntegrity(artifact, { cwd: root, onSpawn: process => { child = process; } });
  assert.equal(report.valid, true, JSON.stringify(report.errors));
  assert.ok(report.htmlFiles >= 3);
  assert.ok(fs.existsSync(path.join(report.ssr.directory, '.ssr-snapshot.json')));
  assert.ok(performance.now() - started < 3000);
  assert.ok(child.exitCode !== null || child.signalCode !== null, 'Server must have exited before returning');
  const manifest = JSON.parse(fs.readFileSync(path.join(report.ssr.directory, '.ssr-snapshot.json'), 'utf8'));
  assert.ok(manifest.resources.some(r => r.url === '/sample/?view=full' && r.status === 200));
  assert.ok(manifest.resources.some(r => r.status === 404 && r.file));
}));

test('SSR query samples can be seeded explicitly and discovered query pages can be status-only', () => serverFixture(serverSource.replace("res.end(page('<h1 id=\"detail\">Sample</h1><a href=\"../#main\">Home</a>'));", "res.end(page('<h1 id=\"detail\">Sample</h1><a href=\"../#main\">Home</a><a href=\"/sample/?view=nested\">Nested query</a>'));"), async (root, artifact) => {
  const report = await auditBuildIntegrity(artifact, { cwd: root, routes: ['/', '/sample/?view=cards'], queryLinkMode: 'status-only' });
  assert.equal(report.valid, true, JSON.stringify(report.errors));
  const manifest = JSON.parse(fs.readFileSync(path.join(report.ssr.directory, '.ssr-snapshot.json'), 'utf8'));
  assert.ok(manifest.resources.some(resource => resource.url === '/sample/?view=full' && resource.status === 200));
  assert.ok(manifest.resources.some(resource => resource.url === '/sample/?view=cards' && resource.status === 200));
  assert.ok(manifest.resources.some(resource => resource.url === '/sample/?view=nested' && resource.status === 200 && !resource.file));
  const cli = fileURLToPath(new URL('../scripts/audit-html-integrity.mjs', import.meta.url));
  const command = spawnSync(process.execPath, [cli, artifact, '--route', '/', '--route', '/sample/?view=cards', '--query-link-mode', 'status-only', '--timeout-ms', '10000'], { cwd: root, encoding: 'utf8' });
  assert.equal(command.status, 0, command.stderr);
}));

test('SSR audit detects rendered broken links, anchors, image dimensions and malformed JSON-LD', () => serverFixture(serverSource.replace('process.env.SNAPSHOT_BROKEN', 'true'), async (root, artifact) => {
  let child;
  const report = await auditBuildIntegrity(artifact, { cwd: root, onSpawn: process => { child = process; } });
  for (const rule of ['link', 'anchor', 'image-dimensions', 'json-ld']) assert.ok(report.errors.some(error => error.rule === rule), rule);
  assert.equal(report.valid, false);
  assert.ok(child.exitCode !== null || child.signalCode !== null);
  const entry = path.join(artifact, 'server/entry.mjs');
  fs.writeFileSync(entry, serverSource.replace("location:'/sample/'", "location:'/sample/#absent'"));
  const redirected = await auditBuildIntegrity(artifact, { cwd: root });
  assert.ok(redirected.errors.some(error => error.rule === 'anchor' && error.message.includes('/legacy#detail')), 'Redirect fragments override the incoming fragment');
}));

test('SSR finally kills a hung server on deadline and cleans signal listeners', () => serverFixture("process.on('SIGTERM',()=>{});setInterval(()=>{},1000);", async (root, artifact) => {
  const before = process.listenerCount('SIGTERM'); let child;
  const started = performance.now();
  await assert.rejects(snapshotSSR({ directory: artifact, cwd: root, timeoutMs: 300, onSpawn: process => { child = process; } }), /deadline/);
  assert.ok(child.exitCode !== null || child.signalCode !== null);
  assert.equal(process.listenerCount('SIGTERM'), before);
  assert.ok(performance.now() - started < 3000);
}));

test('SSR finally kills the server on caller failure and refuses external redirects', () => serverFixture(serverSource.replace("location:'/sample/'", "location:'https://external.invalid/'"), async (root, artifact) => {
  let child;
  await assert.rejects(snapshotSSR({ directory: artifact, cwd: root, onSpawn: process => { child = process; } }), /External redirect/);
  assert.ok(child.exitCode !== null || child.signalCode !== null);
  await assert.rejects(snapshotSSR({ directory: artifact, cwd: root, onSpawn: process => { child = process; throw Error('caller failure'); } }), /caller failure/);
  assert.ok(child.exitCode !== null || child.signalCode !== null);
}));

test('SSR rejects a soft 404 instead of declaring successful error-page coverage', () => serverFixture(serverSource.replace('res.statusCode=404', 'res.statusCode=200'), async (root, artifact) => {
  let child;
  await assert.rejects(snapshotSSR({ directory: artifact, cwd: root, onSpawn: process => { child = process; } }), /error page with status 404/);
  assert.ok(child.exitCode !== null || child.signalCode !== null);
}));

test('SSR cancellation and streaming-body deadlines both terminate the server', () => serverFixture(`
import http from 'node:http';
const server=http.createServer((req,res)=>{res.writeHead(200,{'content-type':'text/html'});res.flushHeaders();res.write('<html>');});
server.listen(Number(process.env.PORT),'127.0.0.1',()=>console.log('Server listening on http://127.0.0.1:'+server.address().port));
`, async (root, artifact) => {
  let child; const controller = new AbortController();
  await assert.rejects(snapshotSSR({ directory: artifact, cwd: root, signal: controller.signal, onSpawn: process => { child = process; controller.abort(Error('caller cancelled')); } }), /caller cancelled/);
  assert.ok(child.exitCode !== null || child.signalCode !== null);
  await assert.rejects(snapshotSSR({ directory: artifact, cwd: root, timeoutMs: 300, onSpawn: process => { child = process; } }), /deadline/);
  assert.ok(child.exitCode !== null || child.signalCode !== null);
}));

test('Astro resolved route metadata reaches the offline runtime leak guard', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'html-routes-'));
  try {
    const { hooks } = devTools();
    hooks['astro:config:done']({ config: { outDir: pathToFileURL(root + path.sep) } });
    hooks['astro:routes:resolved']({ routes: [{ pattern: '/_styleguide', isPrerendered: false }] });
    await hooks['astro:build:done']();
    const report = auditHTMLIntegrity(root);
    assert.equal(report.valid, false); assert.equal(report.runtimeRoutes, 1);
    assert.ok(report.errors.some(error => error.file === '/_styleguide'));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('HTML auditor stays below one second on a 250-page generated site', () => fixture(
  Object.fromEntries(Array.from({ length: 250 }, (_, index) => [`page${index}.html`, `<h1 id=top>Page</h1><a href="page${(index + 1) % 250}.html#top">Next</a><img width=32 height=24 alt=Photo>`])),
  root => {
    const report = auditHTMLIntegrity(root);
    assert.deepEqual(report.errors, []); assert.equal(report.htmlFiles, 250);
    assert.ok(report.durationMs < 1000, `Audit took ${report.durationMs}ms`);
  },
));
