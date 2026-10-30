// Explicit local rehearsal: installs the opt-in plugin only in an owned temporary tree.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomBytes, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import { spawnNpmSync } from '../scripts/process-runner.mjs';
import { startVisualSite } from './visual/site.mjs';

assert.ok(!process.env.CI && !process.env.GITHUB_ACTIONS, 'Explicit local browser/plugin rehearsal only');
const root = fileURLToPath(new URL('../', import.meta.url));
await fs.mkdir(path.join(root, '.emdash/checks'), { recursive: true });
const report = await fs.mkdtemp(path.join(root, '.emdash/checks/forms-'));
const dependencies = await fs.mkdtemp(path.join(os.tmpdir(), 'baseline-forms-deps-'));
const key = randomBytes(32).toString('hex');
const receipt = { core: '1.4.0', forms: '0.2.12', node: process.versions.node, scope: 'Disposable Node/SQLite, native npm plugin and built SSR; no external delivery or Worker claim', checks: [], passed: false };
let site, browser, activePage, origin, adminCookie, editorCookie, token, formId, formPages;
const check = name => { receipt.checks.push(name); console.log('PASS ' + name); };
try {
  receipt.sourceSHA256 = Object.fromEntries(await Promise.all(['tests/forms.integration.mjs','tests/visual/site.mjs','astro.config.mjs','package-lock.json'].map(async file=>[file,createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex')])));
  const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json')));
  assert.equal(pkg.dependencies.emdash, receipt.core);
  delete pkg.scripts;
  pkg.dependencies['@emdash-cms/plugin-forms'] = receipt.forms;
  await fs.writeFile(path.join(dependencies, 'package.json'), JSON.stringify(pkg));
  await fs.copyFile(path.join(root, 'package-lock.json'), path.join(dependencies, 'package-lock.json'));
  console.log('Installing exact forms plugin in isolated dependency tree');
  const install = spawnNpmSync(['install', '--ignore-scripts', '--prefer-offline', '--no-audit', '--no-fund'], { cwd: dependencies, encoding: 'utf8', timeout: 240000 });
  await fs.writeFile(path.join(report, 'install.log'), (install.stdout ?? '') + (install.stderr ?? ''));
  assert.equal(install.status, 0, 'Isolated plugin install; see private install log');
  const installed = JSON.parse(await fs.readFile(path.join(dependencies, 'node_modules/@emdash-cms/plugin-forms/package.json')));
  assert.equal(installed.version, receipt.forms);
  receipt.packageLockSHA256 = createHash('sha256').update(await fs.readFile(path.join(dependencies, 'package-lock.json'))).digest('hex');
  const api = async (route, data, { cookie = adminCookie, status = 200 } = {}) => {
    const response = await fetch(origin + '/_emdash/api/' + route, { method: data === undefined ? 'GET' : 'POST', redirect: 'manual', headers: { ...(cookie ? { Cookie: cookie } : {}), Origin: origin, 'X-EmDash-Request': '1', 'Content-Type': 'application/json', 'User-Agent': 'Baseline synthetic forms probe', Referer: origin + '/forms-proof' }, ...(data === undefined ? {} : { body: JSON.stringify(data) }), signal: AbortSignal.timeout(30000) });
    const body = await response.json();
    assert.equal(response.status, status, route + ': ' + JSON.stringify(body.error));
    return body.data ?? body;
  };
  const plugin = (route, data, options) => api('plugins/emdash-forms/' + route, data, options);
  const values = { email: 'visitor@example.invalid', message: 'Synthetic review only', choice: 'one' };
  site = await startVisualSite(root, report, { dependencyRoot: dependencies, releaseOnly: true, fixedClock: false,
    async prepareStage({ stage, origin: url }) {
      origin = url;
      const configPath = path.join(stage, 'astro.config.mjs');
      let config = await fs.readFile(configPath, 'utf8');
      config = config.replace('const siteUrl = process.env.SITE_URL || env.SITE_URL;', 'const siteUrl = '+JSON.stringify(url)+';');
      config = "import { formsPlugin } from '@emdash-cms/plugin-forms';\n" + config.replace('plugins: [{', 'plugins: [formsPlugin(), {');
      // Private fixture route uses normal native auth/session middleware; absent from root src/.
      config = config.replace('integrations: [', `integrations: [{name:'forms-fixture-auth',hooks:{'astro:config:setup':({injectRoute})=>injectRoute({pattern:'/forms-fixture-auth',entrypoint:new URL('./src/pages/forms-fixture-auth.ts',import.meta.url),prerender:false})}},`);
      await fs.writeFile(configPath, config);
      await fs.writeFile(path.join(stage, 'src/pages/forms-fixture-auth.ts'), `import {createKyselyAdapter} from '@emdash-cms/auth/adapters/kysely';
export async function GET({request,locals,session}) {
 if(!import.meta.env.DEV || locals.user?.role!==50 || request.headers.get('x-fixture-key')!==${JSON.stringify(key)})return new Response(null,{status:404});
 const adapter=createKyselyAdapter(locals.emdash.db);const user=await adapter.createUser({email:'editor@example.invalid',name:'Synthetic Forms Editor',role:40,emailVerified:true});session.set('user',{id:user.id});return Response.json({created:true});
}`);
      await fs.writeFile(path.join(stage, 'src/pages/forms-proof.astro'), `---
import Base from '../layouts/Base.astro';
import {Form} from '@emdash-cms/plugin-forms/ui';
---
<Base title="Native forms review"><h1>Native forms review</h1><Form id="baseline-review" /></Base>`);
    },
    async onDevReady() {
      const response = await fetch(origin + '/_emdash/api/setup/dev-bypass?token=1');
      token = (await response.json()).data.token;
      adminCookie = response.headers.getSetCookie().map(s => s.split(';')[0]).join('; ');
      assert.ok(token && adminCookie);
      const separate = await fetch(origin + '/_emdash/api/setup/dev-bypass');
      const separateCookie = separate.headers.getSetCookie().map(s => s.split(';')[0]).join('; ');
      const editor = await fetch(origin + '/forms-fixture-auth', { headers: { Cookie: separateCookie, 'x-fixture-key': key } });
      assert.equal(editor.status, 200);
      editorCookie = editor.headers.getSetCookie().map(s => s.split(';')[0]).join('; ');
      assert.ok(editorCookie);
      const field = (name, type, extra = {}) => ({ id: name, name, type, label: name, required: true, ...extra });
      const created = await plugin('forms/create', { name: 'Baseline synthetic review', slug: 'baseline-review', pages: [{ fields: [field('email', 'email'), field('message', 'textarea'), field('choice', 'select', { placeholder: 'Choose one', options: [{ value: 'one', label: 'One' }, { value: 'two', label: 'Two' }] })] }], settings: { spamProtection: 'honeypot', submitLabel: 'Send my message', retentionDays: 7 } });
      formId = created.id; formPages = created.pages; assert.ok(formId); assert.equal(created.settings.retentionDays, 7);
      check('native registration, create and deliberate retention setting');
    },
  });
  const badEmail = await plugin('submit', { formId, data: { ...values, email: 'broken' } }, { cookie: '' });
  assert.equal(badEmail.success, false); assert.ok(badEmail.errors.some(e => e.field === 'email'));
  const badText = await plugin('submit', { formId, data: { ...values, message: '' } }, { cookie: '' });
  assert.equal(badText.success, false); assert.ok(badText.errors.some(e => e.field === 'message'));
  assert.equal((await plugin('submissions/list', { formId, limit: 20 })).items.length, 0);
  check('anonymous malformed email and missing required text rejected without storage');
  await plugin('submit', { formId, data: { ...values, _hp: 'bot' } }, { cookie: '' });
  assert.equal((await plugin('submissions/list', { formId, limit: 20 })).items.length, 0);
  check('honeypot silently succeeds without storing');
  const foreign = await fetch(origin+'/_emdash/api/plugins/emdash-forms/submit',{method:'POST',headers:{Origin:'https://foreign.example.invalid','Content-Type':'application/json'},body:JSON.stringify({formId,data:values})});
  assert.equal(foreign.status,403); assert.equal((await foreign.json()).error.code,'CSRF_REJECTED');
  check('foreign-origin public submission rejected without a custom-header bypass');
  await plugin('submit', { formId, data: values }, { cookie: '' });
  const list = await plugin('submissions/list', { formId, limit: 20 });
  assert.equal(list.items.length, 1); const submission = list.items[0];
  assert.equal(submission.data.message, values.message);
  assert.ok(submission.meta.userAgent);
  const editorList = await plugin('submissions/list', { formId, limit: 20 }, { cookie: editorCookie });
  assert.equal(editorList.items.length, 1);
  assert.equal(editorList.items[0].data.email, values.email);
  for (const name of ['ip', 'userAgent', 'referer']) assert.equal(editorList.items[0].meta[name], undefined);
  const editorGet = await plugin('submissions/get', { id: submission.id }, { cookie: editorCookie });
  assert.equal(editorGet.meta.userAgent, undefined);
  await plugin('submissions/delete', { id: submission.id }, { cookie: editorCookie, status: 403 });
  await plugin('submissions/export', { formId, format: 'json' }, { cookie: editorCookie, status: 403 });
  await plugin('forms/update', { id: formId, name: 'Forbidden' }, { cookie: editorCookie, status: 403 });
  check('stored submission; Editor reads content but no IP/agent/referer, mutations/export denied');
  await plugin('forms/update', { id: formId, settings: { webhookUrl: 'https://example.invalid/synthetic-secret' } });
  assert.equal((await plugin('forms/list', {}, { cookie: editorCookie })).items[0].settings.webhookUrl, undefined);
  await plugin('forms/update', { id: formId, settings: { webhookUrl: '' } });
  check('webhook credential hidden from Editor with no webhook sent');
  browser = await chromium.launch();
  const page = activePage = await browser.newPage();
  const problems = []; page.on('pageerror', e => problems.push(e.message));
  const rendered = await page.goto(origin + '/forms-proof');
  receipt.browserOrigin = await page.evaluate(()=>({url:location.href,origin:location.origin,base:document.baseURI,action:document.querySelector('form[data-ec-form]')?.action}));
  receipt.publicCSP=rendered.headers()['content-security-policy'] ?? null;
  await expect(page.locator('[data-ec-form]')).toHaveAttribute('data-ec-initialized','1');
  const message = page.getByLabel('message', { exact: false });
  await expect(message).toHaveValue('');
  expect(await message.evaluate(e => e.checkValidity())).toBe(false);
  const select = page.getByLabel('choice', { exact: false });
  await expect(select).toHaveValue('');
  expect(await select.evaluate(e => e.checkValidity())).toBe(false);
  await expect(select.locator('option').first()).toHaveText('Choose one');
  await page.getByLabel('email', { exact: false }).fill(values.email);
  await message.fill(values.message); await select.selectOption('one');
  const action = page.getByRole('button', { name: 'Send my message', exact: true });
  // A stale browser form must still obey a newly strengthened server rule.
  // No request interception or manufactured Origin headers are involved.
  const stricterPages = structuredClone(formPages);
  stricterPages[0].fields.find(field=>field.name==='message').validation = {minLength:100};
  await plugin('forms/update',{id:formId,pages:stricterPages});
  const rejectedResponse = page.waitForResponse(r => r.url().endsWith('/plugins/emdash-forms/submit'));
  await action.click();
  const rejected = await rejectedResponse; receipt.browserRejection = {status:rejected.status(),requestOrigin:(await rejected.request().allHeaders()).origin,url:rejected.url(),body:await rejected.json()};
  await expect(page.locator('[data-error-for="message"]')).toContainText('100');
  await expect(action).toHaveText('Send my message');
  assert.equal((await plugin('submissions/list', {formId,limit:20})).items.length,1);
  await plugin('forms/update',{id:formId,pages:formPages});
  await action.click();
  await expect(page.locator('[data-form-status]')).toContainText('Thank you');
  await expect(action).toHaveText('Send my message');
  await expect(message).toHaveValue('');
  assert.equal((await plugin('submissions/list', { formId, limit: 20 })).items.length, 2);
  assert.deepEqual(problems, []);
  check('built native Form: empty required textarea/select, placeholder, enhanced rejection/success, labels and reset');
  // Native admin bundle must actually render with the installed plugin, not just build.
  await page.context().addCookies([{ name: adminCookie.split('=')[0], value: adminCookie.slice(adminCookie.indexOf('=') + 1), url: origin }]);
  await page.goto(origin + '/_emdash/admin/plugins/emdash-forms');
  await expect(page.getByText('Baseline synthetic review', { exact: true })).toBeVisible({ timeout: 30000 });
  assert.deepEqual(problems, []); check('native admin Forms page loads registered synthetic form');
  await page.screenshot({ path: path.join(report, 'admin.png'), fullPage: true });
  receipt.passed = true;
} catch(error) {
  receipt.error=error.message;
  if(activePage){await activePage.screenshot({path:path.join(report,'failure.png'),fullPage:true,timeout:5000}).catch(()=>{}); await activePage.locator('body').innerHTML({timeout:1500}).then(body=>fs.writeFile(path.join(report,'failure.html'),body)).catch(()=>{});}
  throw error;
} finally {
  await browser?.close(); await site?.cleanup();
  assert.equal(path.dirname(dependencies), path.resolve(os.tmpdir()));
  assert.ok(path.basename(dependencies).startsWith('baseline-forms-deps-'));
  await fs.rm(dependencies, { recursive: true, force: true });
  receipt.cleanup = 'Owned app/server, dependency tree and synthetic credentials removed; working CMS and root package unchanged';
  await fs.writeFile(path.join(report, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log('Receipt: ' + path.join(report, 'receipt.json'));
}
