import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { auditHTMLIntegrity } from '../scripts/audit-html-integrity.mjs';
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
    <img width=320 height=200 alt="Photo > sunrise"><img style="aspect-ratio: 4 / 3" alt=Photo>
    <img alt=Missing><img width=0 height=20 alt=Zero><img width=20 height=30 alt=" "><img style="aspect-ratio: 0" alt=Zero>`,
}, root => {
  const errors = auditHTMLIntegrity(root).errors;
  assert.equal(errors.filter(e => e.rule === 'image-dimensions').length, 3);
  assert.equal(errors.filter(e => e.rule === 'image-alt').length, 1);
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

test('HTML audit CLI fails on missing build/broken HTML and states empty SSR coverage explicitly', () => fixture({
  'server/entry.mjs': 'throw Error("Do not execute");',
}, root => {
  const cli = fileURLToPath(new URL('../scripts/audit-html-integrity.mjs', import.meta.url));
  const run = directory => spawnSync(process.execPath, [cli, directory], { encoding: 'utf8' });
  const empty = run(root); assert.equal(empty.status, 0); assert.match(empty.stdout, /0 HTML files/); assert.match(empty.stdout, /SSR HTML is not emitted or audited/);
  fs.writeFileSync(path.join(root, 'index.html'), '<img>');
  assert.equal(run(root).status, 1);
  assert.equal(run(path.join(root, 'missing')).status, 1);
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
