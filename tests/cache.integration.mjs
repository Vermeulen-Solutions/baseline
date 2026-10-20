// Explicit local production rehearsal. Never modifies the working CMS or a cloud account.
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { startVisualSite } from './visual/site.mjs';
import { retainBuildAssets } from '../scripts/retain-build-assets.mjs';

assert.ok(!process.env.CI && !process.env.GITHUB_ACTIONS, 'Cache production rehearsal is an explicit local check');
const root = fileURLToPath(new URL('../', import.meta.url));
await mkdir('.emdash/checks', { recursive: true });
const reportDir = await mkdtemp(path.resolve('.emdash/checks/cache-'));
const receipt = { version: 1, scope: 'Disposable Node/SQLite production builds; real Astro memory route cache and authenticated CMS writes; no Cloudflare certification', checks: [], builds: [] };
receipt.sourceSHA256 = Object.fromEntries(await Promise.all(['astro.config.mjs', 'src/layouts/Base.astro', 'src/pages/posts/[slug].astro', 'src/pages/posts/index.astro', 'tests/cache.integration.mjs', 'src/plugins/baseline-metadata/index.ts', 'scripts/retain-build-assets.mjs', 'tests/visual/site.mjs'].map(async file => [file, createHash('sha256').update((await readFile(file, 'utf8')).replaceAll('\r\n', '\n')).digest('hex')])));
let site, token, editorCookie, origin;
const proofPage = color => `---
import Base from '../layouts/Base.astro';
import { getEmDashCollection } from 'emdash';
const {cacheHint}=await getEmDashCollection('posts');
if(Astro.cache?.enabled)Astro.cache.set(cacheHint);
---
<Base title="Cache deployment"><h1 class="proof">Welcome cache deployment</h1></Base>
<style>@layer components { .proof { outline-color: ${color}; } }</style>`;

try {
  site = await startVisualSite(root, reportDir, {
    releaseOnly: true, fixedClock: false,
    async prepareStage({ stage, origin: loopback }) {
      origin = loopback;
      const configPath = path.join(stage, 'astro.config.mjs');
      const config = await readFile(configPath, 'utf8');
      await writeFile(configPath, config.replace('import { defineConfig }', 'import { defineConfig, memoryCache }').replace('output: "server",', `output: "server",
        build: { inlineStylesheets: "never" },
        cache: { provider: memoryCache() },
        routeRules: Object.fromEntries(['/', '/posts', '/posts/[slug]', '/category/[slug]', '/tag/[slug]', '/cache-deploy'].map(route => [route, {maxAge:300,swr:0}])),`).replace('emdash({', 'emdash({ toolbar: "client",'));
      await writeFile(path.join(stage, 'src/pages/cache-deploy.astro'), proofPage('red'));
    },
    async onDevReady() {
      // Mint only in the temporary dev app. Production never exposes dev bypass.
      // Raw token stays in this process and is excluded from all receipts/logs.
      const response = await fetch(origin + '/_emdash/api/setup/dev-bypass?token=1');
      const body = await response.json();
      assert.equal(response.status, 200); token = body.data.token;
      assert.equal(typeof token, 'string');
      editorCookie = response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
      assert.ok(editorCookie, 'the temporary dev app issued a real persisted browser session');
    },
    async afterReleaseBuild({ stage }) {
      const retained = await retainBuildAssets(path.join(stage, 'dist/client/_astro'), path.join(reportDir, 'archive'));
      receipt.builds.push({ current: retained.current, retained: retained.retained });
    },
  });
  const api = async (route, method = 'GET', body) => {
    const response = await fetch(origin + '/_emdash/api/' + route, {
      method, headers: { Authorization: 'Bearer ' + token, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}), redirect: 'manual',
    });
    const result = await response.json();
    assert.equal(response.status, 200, route + ': ' + JSON.stringify(result.error));
    assert.equal(result.success, true, route);
    assert.notEqual(response.headers.get('x-astro-cache'), 'HIT', 'admin responses are private');
    return result.data;
  };
  const page = async (route, options) => {
    const response = await fetch(origin + route, { redirect: 'manual', ...options });
    return { status: response.status, cache: response.headers.get('x-astro-cache'), headers: response.headers, html: await response.text() };
  };
  const warm = async route => {
    await page(route);
    const hit = await page(route);
    assert.equal(hit.status, 200); assert.equal(hit.cache, 'HIT', route + ' must genuinely hit the production route cache');
    assert.ok(!hit.html.includes('id="emdash-toolbar"'));
    return hit;
  };
  const fresh = async (route, expected) => {
    const response = await page(route);
    assert.equal(response.status, 200); assert.equal(response.cache, 'MISS', route + ' must render after invalidation');
    assert.ok(response.html.includes(expected), route + ' contains the new public value');
    return warm(route);
  };
  await warm('/'); await warm('/posts/welcome'); await warm('/category/general');
  const original = (await api('content/posts/welcome')).item;
  await api('content/posts/' + original.id, 'PUT', { _rev: original._rev, data: { title: 'Welcome cache published title' } });
  const pending = (await api('content/posts/' + original.id)).item;
  await api('content/posts/' + original.id + '/publish', 'POST', { _rev: pending._rev });
  await fresh('/', 'Welcome cache published title');
  await fresh('/posts/welcome', 'Welcome cache published title');
  receipt.checks.push('content publish invalidates entry and collection cache tags');

  const menu = await api('menus/primary');
  const item = menu.items.find(item => item.label === 'Home'); assert.ok(item);
  await api('menus/primary/items/' + item.id, 'PUT', { label: 'Cache menu label' });
  await fresh('/', 'Cache menu label'); await fresh('/posts/welcome', 'Cache menu label');
  receipt.checks.push('menu writes invalidate shared chrome on multiple templates');

  await warm('/category/general');
  await api('taxonomies/category/terms/general', 'PUT', { label: 'Cache category label' });
  await fresh('/category/general', 'Cache category label'); await fresh('/posts/welcome', 'Cache category label');
  receipt.checks.push('taxonomy label writes invalidate term and hydrated article views');

  await warm('/posts'); await warm('/posts/welcome');
  await api('taxonomies/tag/terms/starter', 'PUT', { label: 'Cache tag label' });
  await fresh('/posts', 'Cache tag label'); await fresh('/posts/welcome', 'Cache tag label');
  receipt.checks.push('tag labels invalidate the batched listing and hydrated article tags');

  await api('settings', 'POST', { tagline: 'Cache settings tagline' });
  await fresh('/', 'Cache settings tagline');
  receipt.checks.push('settings writes invalidate the home metadata/chrome hint');

  const shared = await warm('/posts/welcome');
  const editorShared = await page('/posts/welcome', { headers: { Cookie: editorCookie } });
  assert.equal(editorShared.cache, 'HIT'); assert.equal(editorShared.html, shared.html);
  const editing = await page('/posts/welcome?_edit=1', { headers: { Cookie: editorCookie } });
  assert.equal(editing.status, 200); assert.notEqual(editing.cache, 'HIT');
  assert.match(editing.headers.get('cache-control'), /private.*no-store/);
  assert.ok(editing.html.includes('id="emdash-toolbar"'));
  const anonymousEdit = await page('/posts/welcome?_edit=1');
  assert.ok([302, 303, 307].includes(anonymousEdit.status)); assert.notEqual(anonymousEdit.cache, 'HIT');
  assert.equal((await warm('/posts/welcome')).html, shared.html);
  receipt.checks.push('anonymous warm → editor shared → private edit → anonymous keeps identities isolated');

  const before = await warm('/cache-deploy');
  const styles = html => [...html.matchAll(/<link\b[^>]*href="([^"]+)"/g)].map(match => match[1]).filter(url => url.startsWith('/_astro/') && url.endsWith('.css'));
  const oldStyles = styles(before.html); assert.ok(oldStyles.length);
  const modified = before.headers.get('last-modified'); assert.ok(modified);
  await site.rebuildRelease(async ({ stage }) => { await writeFile(path.join(stage, 'src/pages/cache-deploy.astro'), proofPage('green')); });
  const after = await page('/cache-deploy', { headers: { 'If-Modified-Since': modified } });
  assert.equal(after.status, 200, 'a code-only deploy cannot answer stale HTML with 304');
  assert.notEqual(after.headers.get('last-modified'), modified);
  assert.ok(styles(after.html).some(url => !oldStyles.includes(url)), 'the rebuild actually changed a stylesheet hash');
  for (const url of new Set([...oldStyles, ...styles(after.html)])) {
    const response = await fetch(origin + url); assert.equal(response.status, 200, url);
    assert.match(response.headers.get('content-type'), /text\/css/);
  }
  assert.ok(receipt.builds[1].retained > 0);
  receipt.checks.push('real code rebuild changes validators and CSS hashes while retained old/current assets both load');
  receipt.validators = { before: modified, after: after.headers.get('last-modified'), oldStyles, newStyles: styles(after.html) };
  receipt.status = 'passed';
} catch (error) {
  receipt.status = 'failed'; receipt.error = error.message;
  throw error;
} finally {
  await site?.cleanup();
  receipt.cleanup = 'Owned temporary app, server and credential store removed; working CMS and cloud unchanged';
  await writeFile(path.join(reportDir, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
}
console.log(JSON.stringify({ status: receipt.status, checks: receipt.checks.length, receipt: path.join(reportDir, 'receipt.json') }));
