import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { assertPublicPage, copyConfigImports, forbidsStorage } from '../scripts/dev-tools-checks.mjs';

async function workspace(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'dev-tools-checks-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const root = path.join(directory, 'site'), stage = path.join(directory, 'stage');
  await fs.mkdir(root); await fs.mkdir(stage);
  return { root, stage };
}
async function write(root, file, content) {
  await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
  await fs.writeFile(path.join(root, file), content);
}
const exists = file => fs.access(file).then(() => true, () => false);

test('a config-imported integration and its own imports reach the disposable copy', async t => {
  const { root, stage } = await workspace(t);
  await write(root, 'astro.config.mjs', [
    'import { defineConfig } from "astro/config";',
    'import devTools from "./scripts/dev-tools-integration.mjs";',
    "import runtime from './scripts/site-runtime-integration.mjs';",
    "import theme from './src/theme.mjs';",
    "import escape from '../outside.mjs';",
    "import data from './site.config.json';",
    'const lazy = () => import("./integrations/lazy.js");',
    'export default defineConfig({ integrations: [devTools(), runtime()] });',
  ].join('\n'));
  await write(root, 'scripts/dev-tools-integration.mjs', 'export default () => ({ name: "dev" });\n');
  await write(root, 'scripts/site-runtime-integration.mjs', 'import { helper } from "./lib/runtime-helper.mjs";\nimport "./site-runtime-integration.mjs";\nexport default () => helper;\n');
  await write(root, 'scripts/lib/runtime-helper.mjs', 'export const helper = { name: "runtime" };\n');
  await write(root, 'scripts/unrelated.mjs', 'export {};\n');
  await write(root, 'integrations/lazy.js', 'export default {};\n');
  await write(root, 'src/theme.mjs', 'export default {};\n');
  await write(root, 'site.config.json', '{}\n');
  await write(path.dirname(root), 'outside.mjs', 'export default {};\n');

  const copied = await copyConfigImports(root, stage, 'astro.config.mjs');
  assert.deepEqual(copied.sort(), ['integrations/lazy.js', 'scripts/dev-tools-integration.mjs', 'scripts/lib/runtime-helper.mjs', 'scripts/site-runtime-integration.mjs']);
  for (const file of copied) assert.equal(await fs.readFile(path.join(stage, file), 'utf8'), await fs.readFile(path.join(root, file), 'utf8'), file);
  assert.equal(await exists(path.join(stage, 'scripts/unrelated.mjs')), false, 'Only reachable modules are copied');
  assert.equal(await exists(path.join(stage, 'src/theme.mjs')), false, 'Directories copied whole are left to the caller');
  assert.equal(await exists(path.join(stage, 'site.config.json')), false, 'Non-script imports are not copied');
  const staged = (await fs.readdir(stage, { recursive: true, withFileTypes: true })).filter(entry => entry.isFile()).length;
  assert.equal(staged, copied.length, 'Imports that resolve outside the site are skipped');
  assert.deepEqual((await fs.readdir(path.dirname(stage))).sort(), ['outside.mjs', 'site', 'stage'], 'Nothing is written outside the stage');
});

test('a missing config-imported module fails instead of producing a partial copy', async t => {
  const { root, stage } = await workspace(t);
  await write(root, 'astro.config.mjs', "import gone from './scripts/gone.mjs';\n");
  await assert.rejects(copyConfigImports(root, stage, 'astro.config.mjs'), { code: 'ENOENT' });
});

test('the public page check accepts a seeded home or a schema-only 404 and rejects setup, login and crash responses', async t => {
  const page = heading => `<!doctype html><html><body><h1>${heading}</h1><script>const login = "/_emdash/admin/login";</script></body></html>`;
  const server = http.createServer((request, response) => {
    const send = (status, body, headers = {}) => { response.writeHead(status, { 'content-type': 'text/html', ...headers }); response.end(body); };
    if (request.url === '/seeded') send(200, page('Our own home'));
    else if (request.url === '/schema-only') send(404, page('Page not found'));
    else if (request.url === '/setup') send(302, '', { location: '/_emdash/admin/setup' });
    else if (request.url === '/_emdash/admin/setup') send(200, page('Set up your site'));
    else if (request.url === '/crash') send(500, page('Internal error'));
    else if (request.url === '/blank') send(200, '<!doctype html><html><body></body></html>');
    else send(404, 'Not found');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;

  assert.equal(await assertPublicPage(await fetch(origin + '/seeded'), 'seeded'), 200);
  // A site whose seed is schema-only has no home entry yet: its own 404 page is its rendered home.
  assert.equal(await assertPublicPage(await fetch(origin + '/schema-only'), 'schema-only'), 404);
  await assert.rejects(async () => assertPublicPage(await fetch(origin + '/setup'), 'setup'), /redirected to \/_emdash\/admin\/setup/);
  await assert.rejects(async () => assertPublicPage(await fetch(origin + '/crash'), 'crash'), /status 500/);
  await assert.rejects(async () => assertPublicPage(await fetch(origin + '/blank'), 'blank'), /no page heading/);
  await assert.rejects(async () => assertPublicPage(await fetch(origin + '/missing'), 'bare'), /no page heading/);
});

test('fixture caching requires the no-store directive, not one exact header value', () => {
  for (const value of ['no-store', 'private, no-store', 'no-store, private', 'private,no-store,max-age=0', 'No-Store', ' no-store ']) assert.equal(forbidsStorage(value), true, value);
  for (const value of [null, undefined, '', 'private', 'no-cache', 'public, max-age=60', 'x-no-store', 'no-store-ish', 'private; no-store']) assert.equal(forbidsStorage(value), false, String(value));
});
