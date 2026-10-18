// Optional local integration rehearsal. Never targets an existing CMS/database.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { chromium, expect as baseExpect } from '@playwright/test';

const root = fileURLToPath(new URL('../', import.meta.url));
const report = path.join(root, 'audit/emdash-1.3-review-2026-10-18');
assert.ok(!process.env.CI, 'Run this browser rehearsal locally, not in screenshot CI');
await fs.mkdir(path.join(root, '.emdash/checks'), { recursive: true });
const stage = await fs.mkdtemp(path.join(root, '.emdash/checks/emdash13-'));
const site = path.join(stage, 'site');
await fs.mkdir(site);
await fs.mkdir(report, { recursive: true });
const expect = baseExpect.configure({ timeout: 20000 });
const receipt = { schemaVersion: 1, node: process.versions.node, platform: process.platform, startedAt: new Date().toISOString(), emdash: JSON.parse(await fs.readFile(path.join(root, 'node_modules/emdash/package.json'), 'utf8')).version, copiedWorkingDatabase: false, independentInstall: false, authentication: 'Synthetic users and session provisioning only in the disposable fixture; native request middleware and permissions active', checks: [], passed: false };
const hashes = {};
receipt.sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
receipt.sourceTreeDirty = Boolean(execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim());
for (const relative of ['scripts/check-emdash13.mjs', 'src/layouts/Base.astro', 'src/layouts/SiteShell.astro', 'src/components/RichText.astro', 'src/components/Card.astro']) hashes[relative] = createHash('sha256').update(await fs.readFile(path.join(root, relative))).digest('hex');
for (const relative of ['src', 'seed', 'astro.config.mjs', 'package.json', 'tsconfig.json', 'emdash-env.d.ts', 'scripts/dev-tools-integration.mjs', 'scripts/dev-tools-middleware.mjs']) {
  const target = path.join(site, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.cp(path.join(root, relative), target, { recursive: true });
  if (!['src', 'seed'].includes(relative)) hashes[relative] = createHash('sha256').update(await fs.readFile(target)).digest('hex');
}
await fs.mkdir(path.join(site, 'public'), { recursive: true });
await fs.symlink(path.join(root, 'node_modules'), path.join(site, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
// Authentication provisioning is deliberately absent from Baseline src/. The
// fixture uses the installed auth adapter and normal Astro user sessions.
const key = randomBytes(32).toString('hex');
await fs.mkdir(path.join(site, 'src/pages/_emdash/api'), { recursive: true });
await fs.writeFile(path.join(site, 'src/pages/_emdash/api/fixture-auth.ts'), `import {createKyselyAdapter} from '@emdash-cms/auth/adapters/kysely';
export const prerender = false;
export async function GET({request, url, locals, session}) {
  if (!import.meta.env.DEV || locals.user?.role !== 50 || request.headers.get('x-fixture-key') !== process.env.EMDASH13_FIXTURE_KEY) return new Response(null, {status:404});
  const name = url.searchParams.get('name'), role = Number(url.searchParams.get('role'));
  if (!['Contributor A','Contributor B','Revision Editor'].includes(name) || ![20,40].includes(role)) return new Response(null,{status:400});
  const adapter = createKyselyAdapter(locals.emdash.db);
  const email = name.toLowerCase().replaceAll(' ','-')+'@example.invalid';
  const user = await adapter.getUserByEmail(email) ?? await adapter.createUser({email,name,role,emailVerified:true});
  session.set('user',{id:user.id});
  return Response.json({id:user.id,name:user.name,role:user.role});
}
`);
// Astro ignores underscore-prefixed source routes unless explicitly injected.
const configPath = path.join(site, 'astro.config.mjs');
const config = await fs.readFile(configPath, 'utf8');
assert.equal(config.split('integrations: [').length, 2);
await fs.writeFile(configPath, config.replace('integrations: [', `integrations: [
  { name: 'emdash13-disposable-auth', hooks: { 'astro:config:setup': ({injectRoute}) => injectRoute({pattern:'/_emdash/api/fixture-auth',entrypoint:new URL('./src/pages/_emdash/api/fixture-auth.ts',import.meta.url),prerender:false}) } },`).replace('vite: {', `vite: { server: { fs: { allow: ${JSON.stringify([site, path.join(root, 'node_modules')])} } },`));
const socket = createServer(); socket.listen(0, '127.0.0.1'); await once(socket, 'listening');
const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA)$/i.test(name)));
Object.assign(env, { EMDASH_ENCRYPTION_KEY: 'emdash_enc_v1_' + randomBytes(32).toString('base64url'), EMDASH13_FIXTURE_KEY: key });
let server, browser, activePage;
const logs = [];
const check = (name, details) => { receipt.checks.push({ name, passed: true, ...details }); console.log('PASS ' + name); };
try {
  console.log('Starting disposable Node/SQLite server');
  server = spawn(process.execPath, [path.join(root, 'node_modules/astro/bin/astro.mjs'), 'dev', '--host', '127.0.0.1', '--port', String(port)], { cwd: site, env, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [server.stdout, server.stderr]) stream.on('data', chunk => logs.push(String(chunk)));
  const deadline = Date.now() + 120000;
  let ready = false;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error('Disposable dev server exited');
    try { if ((await fetch(origin + '/', { signal: AbortSignal.timeout(15000) })).ok) { ready = true; break; } } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'Disposable CMS server readiness');
  console.log('Server ready; provisioning isolated sessions');
  browser = await chromium.launch({ headless: true });
  const admin = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-US' });
  await admin.request.get(origin + '/_emdash/api/setup/dev-bypass?content=0&redirect=/_emdash/admin');
  const request = async (context, endpoint, options = {}, status) => {
    const response = await context.request.fetch(origin + endpoint, { ...options, headers: { origin, referer: origin + '/', 'X-EmDash-Request': '1', ...options.headers } });
    const body = await response.json();
    if (status) assert.equal(response.status(), status, endpoint + ': ' + JSON.stringify(body));
    else assert.ok(response.ok() && body.success, endpoint + ': ' + JSON.stringify(body));
    return { status: response.status(), body, data: body.data };
  };
  const actors = {};
  for (const [name, role] of [['Contributor A', 20], ['Contributor B', 20], ['Revision Editor', 40]]) {
    const context = await browser.newContext({ locale: 'en-US', viewport: { width: 1440, height: 1000 } });
    await context.request.get(origin + '/_emdash/api/setup/dev-bypass?content=0');
    const response = await context.request.get(origin + '/_emdash/api/fixture-auth?' + new URLSearchParams({ name, role: String(role) }), { headers: { 'x-fixture-key': key } });
    assert.ok(response.ok(), await response.text());
    const user = await response.json(); assert.equal(user.role, role);
    actors[name] = { context, user };
  }
  const a = actors['Contributor A'], b = actors['Contributor B'], editor = actors['Revision Editor'];
  const content = text => [{ _type: 'block', _key: 'paragraph', style: 'normal', markDefs: [], children: [{ _type: 'span', _key: 'span', text, marks: [] }] }];
  const create = async (context, slug, text) => (await request(context, '/_emdash/api/content/posts', { method: 'POST', data: { slug, data: { title: slug, content: content(text) } } })).data.item;
  const get = async id => (await request(admin, '/_emdash/api/content/posts/' + id)).data.item;
  const update = async (context, id, text, status) => {
    const item = await get(id);
    return request(context, '/_emdash/api/content/posts/' + id, { method: 'PUT', data: { _rev: item._rev, data: { content: content(text) } } }, status);
  };
  const own = await create(a.context, 'contributor-own', 'Own original');
  const other = await create(b.context, 'contributor-other', 'Other original');
  assert.equal((await get(own.id)).authorId, a.user.id);
  await update(a.context, own.id, 'Own changed');
  assert.ok(JSON.stringify((await get(own.id)).data).includes('Own changed'));
  check('contributor-own-draft-create-and-save', { role: 20, status: (await get(own.id)).status });
  const deny = async (name, id, endpoint, options) => {
    const before = await get(id);
    const revisions = (await request(admin, '/_emdash/api/content/posts/' + id + '/revisions')).data;
    const result = await request(a.context, endpoint, options, 403);
    assert.deepEqual(await get(id), before);
    assert.deepEqual((await request(admin, '/_emdash/api/content/posts/' + id + '/revisions')).data, revisions);
    check(name, { status: result.status, code: result.body.error.code, canonicalUnchanged: true, revisionsUnchanged: true });
  };
  const otherItem = await get(other.id);
  await deny('contributor-other-draft-update-denied', other.id, '/_emdash/api/content/posts/' + other.id, { method: 'PUT', data: { _rev: otherItem._rev, data: { title: 'Forbidden change' } } });
  await deny('contributor-publish-denied', own.id, '/_emdash/api/content/posts/' + own.id + '/publish', { method: 'POST', data: { _rev: (await get(own.id))._rev } });
  await deny('contributor-other-lock-denied', other.id, '/_emdash/api/content/posts/' + other.id + '/lock', { method: 'POST', data: {} });
  const ownedLock = await request(a.context, '/_emdash/api/content/posts/' + own.id + '/lock', { method: 'POST', data: {} });
  check('contributor-own-draft-lock', { status: ownedLock.status });
  await request(a.context, '/_emdash/api/content/posts/' + own.id + '/lock', { method: 'DELETE' });
  await request(admin, '/_emdash/api/content/posts/' + own.id + '/publish', { method: 'POST', data: { _rev: (await get(own.id))._rev } });
  const published = await get(own.id); assert.equal(published.status, 'published');
  await deny('contributor-published-update-denied', own.id, '/_emdash/api/content/posts/' + own.id, { method: 'PUT', data: { _rev: published._rev, data: { title: 'Forbidden published edit' } } });
  const scheduled = await create(a.context, 'contributor-scheduled', 'Scheduled original');
  await request(admin, '/_emdash/api/content/posts/' + scheduled.id + '/schedule', { method: 'POST', data: { _rev: (await get(scheduled.id))._rev, scheduledAt: new Date(Date.now() + 86400000).toISOString() } });
  const scheduledItem = await get(scheduled.id); assert.equal(scheduledItem.status, 'scheduled');
  await deny('contributor-scheduled-update-denied', scheduled.id, '/_emdash/api/content/posts/' + scheduled.id, { method: 'PUT', data: { _rev: scheduledItem._rev, data: { title: 'Forbidden scheduled edit' } } });

  const revisionEntry = await create(admin, 'revision-review', 'Seed revision wording');
  await update(admin, revisionEntry.id, 'Original revision wording');
  await request(admin, '/_emdash/api/content/posts/' + revisionEntry.id + '/publish', { method: 'POST', data: {} });
  await update(editor.context, revisionEntry.id, 'Changed revision wording');
  await request(editor.context, '/_emdash/api/content/posts/' + revisionEntry.id + '/publish', { method: 'POST', data: {} });
  const revisions = (await request(editor.context, '/_emdash/api/content/posts/' + revisionEntry.id + '/revisions')).data;
  await fs.writeFile(path.join(report, 'revision-api.json'), JSON.stringify(revisions, null, 2) + '\n');
  const list = revisions.items ?? revisions.revisions ?? revisions;
  assert.ok(Array.isArray(list));
  assert.ok(list.some(r => r.author?.id === editor.user.id && r.author.name === editor.user.name));
  assert.ok(list.some(r => r.author?.name === 'Dev Admin'));
  check('revision-author-api-without-user-management', { authorName: editor.user.name, revisions: list.length, userManagementStatus: (await request(editor.context, '/_emdash/api/admin/users', {}, 403)).status });
  activePage = await editor.context.newPage();
  const browserErrors = [];
  activePage.on('pageerror', error => browserErrors.push(error.message));
  receipt.browserErrors = browserErrors;
  await activePage.goto(origin + '/_emdash/admin/content/posts/' + revisionEntry.id);
  await activePage.getByRole('button', { name: 'Get Started', exact: true }).click();
  await activePage.getByRole('button', { name: 'Revisions', exact: true }).click();
  await expect(activePage.locator('[data-revision-row]')).not.toHaveCount(0);
  const targetRevision = list.find(r => r.author?.id === editor.user.id);
  await activePage.locator(`[data-revision-row][data-revision-id="${targetRevision.id}"]`).click();
  await expect(activePage.getByRole('switch', { name: 'Show changes' })).toBeVisible();
  await expect(activePage.locator('[data-emdash-editor-canvas] ins')).not.toHaveCount(0);
  await expect(activePage.locator('[data-emdash-editor-canvas] del')).not.toHaveCount(0);
  await expect(activePage.locator('[data-revision-row]').filter({ hasText: editor.user.name }).first()).toBeVisible();
  await expect(activePage.locator('[data-emdash-editor-canvas] [contenteditable="true"]:visible')).toHaveCount(0);
  await activePage.getByRole('switch', { name: 'Show changes' }).click();
  await expect(activePage.locator('[data-emdash-editor-canvas] ins')).toHaveCount(0);
  await activePage.getByRole('switch', { name: 'Show changes' }).click();
  await expect(activePage.locator('[data-emdash-editor-canvas] ins')).not.toHaveCount(0);
  await activePage.screenshot({ path: path.join(report, 'revision-diff.png'), fullPage: true });
  check('revision-diff-browser', { additions: await activePage.locator('ins').allTextContents(), removals: await activePage.locator('del').allTextContents(), author: editor.user.name });
  const originalRevision = list.find(r => r.author?.name === 'Dev Admin');
  assert.ok(originalRevision, 'Original revision with a second author');
  await activePage.locator(`[data-revision-row][data-revision-id="${originalRevision.id}"]`).click();
  await activePage.getByRole('button', { name: 'Restore', exact: true }).click();
  await activePage.getByRole('dialog').getByRole('button', { name: 'Restore', exact: true }).click();
  await expect.poll(async () => JSON.stringify((await get(revisionEntry.id)).data)).toContain('Original revision wording');
  await expect(activePage.locator('.tiptap:visible')).toContainText('Original revision wording');
  await expect(activePage.getByRole('button', { name: 'Back to editing', exact: true })).toHaveCount(0);
  check('standard-admin-restore-refresh', { restoredCanonicalDraft: true, returnedToEditing: true });
  // Toolbar and link acceptance is performed on the real public post template.
  await activePage.goto(origin + '/posts/revision-review');
  await activePage.locator('.emdash-tb-toggle').click();
  await expect(activePage.locator('.tiptap')).toBeVisible({ timeout: 60000 });
  const selectText = async () => {
    await activePage.locator('.tiptap p').first().click();
    await activePage.keyboard.press('Home'); await activePage.keyboard.press('Shift+End');
  };
  await selectText();
  const toolbar = activePage.getByRole('toolbar', { name: 'Format selection' });
  await expect(toolbar).toBeVisible();
  await toolbar.getByRole('button', { name: 'Turn into', exact: true }).click();
  await expect(activePage.getByRole('menu')).toContainText('Heading 2');
  await activePage.keyboard.press('Escape');
  await selectText();
  await toolbar.getByRole('button', { name: 'Bold', exact: true }).click();
  await expect(activePage.locator('.tiptap strong')).not.toHaveCount(0);
  await toolbar.getByRole('button', { name: 'Add link', exact: true }).click();
  await activePage.getByRole('textbox', { name: 'Link URL', exact: true }).fill('example.invalid/original');
  await toolbar.getByRole('button', { name: 'Apply link', exact: true }).click();
  await expect(activePage.locator('.tiptap a')).toHaveAttribute('href', 'https://example.invalid/original');
  await activePage.locator('#emdash-toolbar').click({ position: { x: 20, y: 20 } });
  await expect.poll(async () => JSON.stringify((await get(revisionEntry.id)).data)).toContain('https://example.invalid/original');
  await activePage.reload();
  await expect(activePage.locator('.tiptap a')).toHaveAttribute('href', 'https://example.invalid/original');
  const beforeLinkClick = activePage.url();
  await activePage.locator('.tiptap a').click();
  const linkBar = activePage.getByRole('toolbar', { name: 'Link options' });
  await expect(linkBar).toBeVisible();
  await expect(linkBar.getByRole('button', { name: 'Remove link', exact: true })).toBeVisible();
  assert.equal(activePage.url(), beforeLinkClick, 'Caret link click must not navigate');
  await activePage.screenshot({ path: path.join(report, 'inline-link-controls.png'), fullPage: true });
  await linkBar.getByRole('button', { name: 'Edit link', exact: true }).click();
  await activePage.getByRole('textbox', { name: 'Link URL', exact: true }).fill('example.invalid/changed');
  await toolbar.getByRole('button', { name: 'Apply link', exact: true }).click();
  await expect(activePage.locator('.tiptap a')).toHaveAttribute('href', 'https://example.invalid/changed');
  await activePage.keyboard.press('ArrowLeft');
  await activePage.locator('.tiptap a').click();
  await linkBar.getByRole('button', { name: 'Remove link', exact: true }).click();
  await expect(activePage.locator('.tiptap a')).toHaveCount(0);
  await activePage.locator('#emdash-toolbar').click({ position: { x: 20, y: 20 } });
  await expect.poll(async () => JSON.stringify((await get(revisionEntry.id)).data)).not.toContain('example.invalid');
  await activePage.reload();
  await expect(activePage.locator('.tiptap strong')).not.toHaveCount(0);
  assert.equal(await activePage.locator('.tiptap a').count(), 0);
  check('inline-toolbar-links-save-reload', { turnIntoMenu: true, boldPersisted: true, bareDomainPrefixed: true, caretPreviewAndNoNavigation: true, linkEdited: true, linkRemoved: true, canonicalAndReloadVerified: true });
  receipt.passed = true;
} catch (error) {
  receipt.error = error.stack;
  if (activePage) {
    await fs.writeFile(path.join(report, 'failure-ui.txt'), await activePage.locator('body').innerText()).catch(() => {});
    await fs.writeFile(path.join(report, 'failure-body.html'), await activePage.locator('.article-body').innerHTML()).catch(() => {});
    await activePage.screenshot({ path: path.join(report, 'failure.png'), fullPage: true }).catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  if (server && server.exitCode === null) { const done = once(server, 'exit'); server.kill(); await done; }
  await fs.writeFile(path.join(report, 'server.log'), logs.join(''));
  Object.assign(receipt, { completedAt: new Date().toISOString(), serverStopped: !server || server.exitCode !== null || server.signalCode !== null, sourceHashes: hashes, fixtureDirectory: path.relative(root, stage).replaceAll('\\', '/') });
  await fs.writeFile(path.join(report, 'verification.json'), JSON.stringify(receipt, null, 2) + '\n');
  if (receipt.passed) for (const name of ['failure-ui.txt', 'failure.png', 'failure-body.html']) await fs.unlink(path.join(report, name)).catch(error => { if (error.code !== 'ENOENT') throw error; });
  await fs.unlink(path.join(site, 'node_modules'));
}
