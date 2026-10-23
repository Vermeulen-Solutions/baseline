// Independent artifact checks. Never imports or trusts evaluator-authored tests.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chromium } from '@playwright/test';
import { sourceHashes, npmLog, privateOf } from './workflow-replay.mjs';
import { mcpResult } from './workflow-replay-runner.mjs';
import { auditHTMLIntegrity } from './audit-html-integrity.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');

export function changedSources(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(file => before[file] !== after[file]).sort();
}
export function sourceChangeAllowed(scenario, file) {
  if (scenario === 'static') return file === 'src/pages/index.astro';
  if (scenario === 'older-profile') return file === 'HANDOFF.md';
  if (scenario === 'cms') return false;
  return /^(?:src\/content\.config\.ts|src\/pages\/posts\/\[\.\.\.id\]\.astro|src\/lib\/[a-z0-9-]+\.ts|public\/admin\/config\.yml|tests\/(?:sveltia|post|reading)[a-z0-9-]*\.test\.mjs|docs\/sveltia-cms\.md)$/.test(file);
}
export function hasUnapprovedLaunchDate(text) {
  return /(?:\bno\b.{0,40}\b(?:approved|approval)\b.{0,30}\b(?:launch date|deadline|date)\b|\bno\b.{0,80}\b(?:launch date|deadline|date)\b.{0,160}\b(?:approved|approval)\b|\b(?:launch date|deadline|date)\b.{0,40}\b(?:unapproved|not approved|unresolved)\b)/i.test(text);
}
async function serveStatic(directory) {
  const server = http.createServer((request, response) => {
    let relative;
    try { relative = decodeURIComponent(new URL(request.url, 'http://local.invalid').pathname).replace(/^\/+/, ''); } catch { response.writeHead(400); response.end(); return; }
    if (relative.includes('\\') || relative.split('/').includes('..')) { response.writeHead(400); response.end(); return; }
    const file = [relative, path.join(relative, 'index.html')].map(file => path.join(directory, file)).find(file => fs.existsSync(file) && fs.statSync(file).isFile());
    response.writeHead(file ? 200 : 404, { 'content-type': file?.endsWith('.css') ? 'text/css' : file?.endsWith('.js') ? 'text/javascript' : 'text/html' });
    response.end(file ? fs.readFileSync(file) : 'Not found');
  });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  return { origin: 'http://127.0.0.1:' + server.address().port, stop: async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
}
export async function captureStaticObservations(directory) {
  const server = await serveStatic(directory); let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage(), viewports = [];
    for (const width of [600, 1000, 1500]) {
      await page.setViewportSize({ width, height: 900 }); await page.goto(server.origin);
      viewports.push({ width, ...await page.evaluate(() => {
        const gap = selector => { const node = document.querySelector(selector); if (!node) throw Error('Missing grid ' + selector); return { row: parseFloat(getComputedStyle(node).rowGap), column: parseFloat(getComputedStyle(node).columnGap), columns: getComputedStyle(node).gridTemplateColumns }; };
        const main = document.querySelector('main');
        return { services: gap('#services-grid'), reference: gap('#approach-grid'), mainText: (main?.innerText ?? '').replace(/\s+/g, ' ').trim(), navigation: [...document.querySelectorAll('header a, nav a')].map(a => ({ text: a.innerText.trim(), href: a.getAttribute('href') })) };
      }) });
    }
    return { capturedAt: new Date().toISOString(), browser: browser.version(), viewports };
  } finally { if (browser) await browser.close(); await server.stop(); }
}
function decoded(result) {
  assert.equal(result.kind, 'mcp-result', JSON.stringify(result));
  const value = result.envelope.result;
  if (value.structuredContent !== undefined) return value.structuredContent;
  return JSON.parse(value.content.filter(item => item.type === 'text').map(item => item.text).join('\n'));
}
function mcpValue(result, label) {
  assert.equal(result.kind, 'mcp-result', `${label}: ${JSON.stringify(result)}`);
  const value = result.envelope.result;
  if (value.structuredContent !== undefined) return value.structuredContent;
  if (!Array.isArray(value.content)) return value;
  const text = value.content.filter(item => item.type === 'text').map(item => item.text).join('\n');
  try { return JSON.parse(text); } catch { return text; }
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
export async function captureCmsBaseline(endpoint, token, collections, request = fetch) {
  const call = async (name, args = {}) => mcpValue(await mcpResult(endpoint, token, name, args, request), name);
  const inventory = await mcpValue(await mcpResult(endpoint, token, 'tools/list', {}, request), 'tools/list');
  const tools = inventory.tools ?? inventory.result?.tools;
  assert.ok(Array.isArray(tools), 'MCP tools/list did not return tool definitions');
  const definition = name => tools.find(tool => tool.name === name);
  assert.ok(definition('content_list') && definition('content_get'), 'MCP content read tools are unavailable');
  assert.ok(definition('menu_list') && definition('settings_get'), 'MCP menu and settings read tools are unavailable');
  assert.ok(Array.isArray(collections) && collections.length, 'No CMS collection inventory was supplied from the frozen fixture seed');
  assert.ok(collections.length <= 50, 'MCP collection inventory exceeds the replay limit');
  const content = {};
  for (const collection of [...collections].sort()) {
    const listed = await call('content_list', { collection, limit: 100 });
    const rows = listed.items ?? listed.entries ?? listed.content ?? listed;
    assert.ok(Array.isArray(rows), `content_list(${collection}) returned an unexpected shape`);
    assert.ok(!(listed.nextCursor || listed.next || listed.hasMore), `content_list(${collection}) indicates an incomplete page`);
    assert.ok(rows.length < 100, `content_list(${collection}) may be truncated at 100 entries`);
    const snapshots = [];
    for (const row of rows) {
      assert.equal(typeof row.id, 'string', `content_list(${collection}) row has no stable id`);
      const item = await call('content_get', { collection, id: row.id });
      snapshots.push({ id: row.id, sha256: hash(JSON.stringify(stable(item))) });
    }
    content[collection] = snapshots.sort((a, b) => a.id.localeCompare(b.id));
  }
  const menus = definition('menu_list') ? await call('menu_list') : { unavailable: true };
  const settings = definition('settings_get') ? await call('settings_get') : { unavailable: true };
  assert.notDeepEqual(menus, { unavailable: true }, 'Observer token cannot read menus');
  assert.notDeepEqual(settings, { unavailable: true }, 'Observer token cannot read site settings');
  const reduced = { schemaTools: tools.map(tool => tool.name).sort(), content, menusSHA256: hash(JSON.stringify(stable(menus))), settingsSHA256: hash(JSON.stringify(stable(settings))) };
  return { capturedAt: new Date().toISOString(), sha256: hash(JSON.stringify(reduced)), ...reduced };
}
export async function compareCmsBaseline(before, endpoint, token, allowedDraftId, request = fetch) {
  const after = await captureCmsBaseline(endpoint, token, Object.keys(before.content), request);
  const normalized = structuredClone(after.content);
  const newRows = [];
  for (const [collection, rows] of Object.entries(normalized)) {
    const previous = new Set((before.content[collection] ?? []).map(row => row.id));
    for (const row of rows) if (!previous.has(row.id)) newRows.push({ collection, ...row });
    normalized[collection] = rows.filter(row => !(collection === 'posts' && row.id === allowedDraftId));
  }
  assert.deepEqual(normalized, before.content, 'Existing content changed or was deleted, or an unexpected content item was created');
  assert.deepEqual(newRows, [{ collection: 'posts', id: allowedDraftId, sha256: newRows[0]?.sha256 }], 'Expected only the single owned posts draft to be added');
  assert.equal(after.menusSHA256, before.menusSHA256, 'CMS menus changed during the task');
  assert.equal(after.settingsSHA256, before.settingsSHA256, 'CMS settings changed during the task');
  return { beforeSHA256: before.sha256, afterSHA256: after.sha256, unchangedExistingContent: true, onlyAdded: { collection: 'posts', id: allowedDraftId }, menusUnchanged: true, settingsUnchanged: true };
}
async function gradeTrialImpl(trial) {
  const receipt = JSON.parse(fs.readFileSync(path.join(trial.directory, 'receipt.json'))), config = privateOf(trial);
  const report = { trial: trial.id, startedAt: new Date().toISOString(), checks: [], mechanicalStatus: 'pending', reviewStatus: trial.scenario === 'older-profile' || trial.scenario === 'cms' ? 'pending' : 'not-required', limits: ['Local mechanical artifact checks; CMS permission explanations and cold-resume decision quality require independent review.', 'Not full visual/accessibility, hosted OAuth, D1/R2 or browser-editor acceptance.'] };
  const check = async (name, run) => {
    try { const evidence = await run(); report.checks.push({ name, status: 'pass', evidence }); }
    catch (error) { report.checks.push({ name, status: 'fail', error: error.message }); }
  };
  const run = async (name, label = name) => {
    const result = await npmLog(trial, ['run', name], 'grade-' + label.replaceAll(':', '-'), { EMDASH_ENCRYPTION_KEY: config.encryptionKey });
    assert.equal(result.exitCode, 0, JSON.stringify(result)); return result;
  };
  const git = args => execFileSync('git', args, { cwd: trial.site, encoding: 'utf8' });
  await check('source preservation and bounded changes', async () => {
    const after = sourceHashes(trial.site), changed = changedSources(receipt.source, after);
    const untracked = git(['ls-files', '--others', '--exclude-standard', '-z']).split('\0').filter(Boolean);
    fs.writeFileSync(path.join(trial.directory, 'after-source.json'), JSON.stringify(after, null, 2) + '\n');
    fs.writeFileSync(path.join(trial.directory, 'changes.patch'), git(['diff', '--binary', 'HEAD']));
    const files = [...new Set([...changed, ...untracked])].sort().map(file => {
      const target = path.join(trial.site, file);
      if (!fs.existsSync(target)) return { path: file, status: 'deleted', beforeSHA256: receipt.source[file] ?? null, afterSHA256: null };
      const stat = fs.lstatSync(target); if (stat.isSymbolicLink() || !stat.isFile()) return { path: file, status: 'unsafe-or-nonfile', beforeSHA256: receipt.source[file] ?? null, afterSHA256: after[file] ?? null };
      if (stat.size > 500000) return { path: file, status: 'content-over-limit', beforeSHA256: receipt.source[file] ?? null, afterSHA256: after[file] ?? null, bytes: stat.size };
      const bytes = fs.readFileSync(target), content = bytes.toString('utf8');
      const validText = Buffer.from(content, 'utf8').equals(bytes);
      return { path: file, status: validText ? 'present' : 'content-not-utf8', beforeSHA256: receipt.source[file] ?? null, afterSHA256: after[file] ?? null, bytes: bytes.length, content: validText ? content : null };
    });
    fs.writeFileSync(path.join(trial.directory, 'source-changes.json'), JSON.stringify({ capturedAt: new Date().toISOString(), files }, null, 2) + '\n');
    assert.ok(files.every(file => file.status === 'present' || file.status === 'deleted'), 'Changed source contains a linked, nonfile or over-limit artifact');
    assert.deepEqual([...changed, ...untracked].filter(file => !sourceChangeAllowed(trial.scenario, file)), []);
    if (trial.scenario !== 'cms') assert.ok(changed.length > 0, 'Task must produce an artifact change');
    return { changed, untracked };
  });
  if (trial.scenario === 'older-profile') {
    await check('missing optional references and recovered handoff facts', async () => {
      for (const file of ['docs/project-context.md', 'PROJECT.example.md', 'PROJECT.md']) assert.equal(fs.existsSync(path.join(trial.site, file)), false, file);
      const text = fs.readFileSync(path.join(trial.site, 'HANDOFF.md'), 'utf8');
      for (const regex of [/team leads/i, /English/i, /static/i, /workshops@northline\.example\.test/, /editor/i, /maintainer/i, /quarterly/i, /assum/i, /(?:routes|listing|index)/i]) assert.match(text, regex);
      assert.ok(hasUnapprovedLaunchDate(text), 'Handoff must state that no launch date is approved');
      assert.equal(fs.existsSync(path.join(trial.site, 'src/pages/workshops')), false);
      return { handoff: text, optionalReferencesAbsent: true };
    });
  } else {
    await check('independent verify', () => run('verify'));
    await check('independent build', () => run('build'));
    if (trial.scenario === 'cms') await check('independent HTML audit', () => run('audit:html'));
    else {
      await check('independent production isolation', () => run('check:dev-tools'));
      await check('emitted HTML integrity', () => { const result = auditHTMLIntegrity(path.join(trial.site, 'dist')); assert.equal(result.valid, true, JSON.stringify(result)); return result; });
    }
  }
  if (trial.scenario === 'static') await check('responsive regional gap', async () => {
    const server = await serveStatic(path.join(trial.site, 'dist')); let browser;
    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage(), measurements = [];
      for (const width of [600, 1000, 1500]) {
        await page.setViewportSize({ width, height: 900 }); await page.goto(server.origin);
        const values = await page.evaluate(() => {
          const gap = selector => { const node = document.querySelector(selector); if (!node) throw Error('Missing grid ' + selector); return { row: parseFloat(getComputedStyle(node).rowGap), column: parseFloat(getComputedStyle(node).columnGap), columns: getComputedStyle(node).gridTemplateColumns }; };
          const main = document.querySelector('main');
          return { services: gap('#services-grid'), reference: gap('#approach-grid'), mainText: (main?.innerText ?? '').replace(/\s+/g, ' ').trim(), navigation: [...document.querySelectorAll('header a, nav a')].map(a => ({ text: a.innerText.trim(), href: a.getAttribute('href') })) };
        });
        const baseline = JSON.parse(fs.readFileSync(path.join(trial.directory, 'baseline-observations.json'))).viewports.find(item => item.width === width);
        assert.ok(values.reference.column > 0 && Math.abs(values.services.column / values.reference.column - 0.75) < 0.002, JSON.stringify(values));
        assert.deepEqual(values.reference, baseline.reference); assert.ok(Math.abs(values.services.row / baseline.services.row - 0.75) < 0.002, JSON.stringify(values));
        assert.equal(values.mainText, baseline.mainText); assert.deepEqual(values.navigation, baseline.navigation);
        measurements.push({ width, ...values });
      }
      return measurements;
    } finally { if (browser) await browser.close(); await server.stop(); }
  });
  if (trial.scenario === 'sveltia') {
    await check('paired editor field', async () => {
      // The generated config is JSON-compatible YAML; a changed serialization is
      // a recorded limitation/failure for manual inspection, never a guessed pass.
      const form = JSON.parse(fs.readFileSync(path.join(trial.site, 'public/admin/config.yml')));
      const field = form.collections.find(item => item.name === 'posts').fields.find(item => item.name === 'readingMinutes');
      assert.ok(field && field.widget === 'number' && field.required === false && field.min === 1 && field.max === 60 && (field.value_type === 'int' || field.step === 1)); return field;
    });
    const file = path.join(trial.site, 'src/content/posts/welcome.md'), original = fs.readFileSync(file, 'utf8');
    try {
      for (const [label, value, valid] of [['min', '1', true], ['max', '60', true], ['zero', '0', false], ['above-max', '61', false], ['fraction', '1.5', false], ['string', '"2"', false]]) await check('real content boundary: ' + label, async () => {
        fs.writeFileSync(file, original.replace(/^---\r?\n/, '---\nreadingMinutes: ' + value + '\n'));
        const result = await npmLog(trial, ['run', 'build'], 'grade-boundary-' + label);
        if (valid) { assert.equal(result.exitCode, 0); assert.match(fs.readFileSync(path.join(trial.site, 'dist/posts/welcome/index.html'), 'utf8'), new RegExp('>' + value + ' min read<')); }
        else { assert.notEqual(result.exitCode, 0); assert.match(fs.readFileSync(path.join(trial.directory, result.log), 'utf8'), /readingMinutes/); }
        return result;
      });
    } finally {
      fs.writeFileSync(file, original);
      await check('restored absent legacy value', async () => { const result = await run('build', 'restored-build'); assert.doesNotMatch(fs.readFileSync(path.join(trial.site, 'dist/posts/welcome/index.html'), 'utf8'), /\d+ min read/); assert.equal(fs.readFileSync(file, 'utf8'), original); return result; });
    }
  }
  let cmsCreatedId;
  if (trial.scenario === 'cms') {
    await check('owned exact draft and anonymous 404', async () => {
    const call = async (name, args) => decoded(await mcpResult(config.endpoint, config.token, name, args));
    const list = await call('content_list', { collection: 'posts', limit: 100 });
    const entry = list.items.find(item => item.slug === 'kickoff-' + trial.id); assert.ok(entry, 'Expected draft slug');
    cmsCreatedId = entry.id;
    const current = await call('content_get', { collection: 'posts', id: entry.id });
    const item = current.item; assert.equal(item.status, 'draft'); assert.equal(item.data.title, 'Planning a useful kickoff'); assert.equal(item.data.excerpt, 'A short agenda for the first conversation.');
    const body = item.data.content ?? item.data.body;
    const text = typeof body === 'string' ? body.trim() : body.map(block => block.children?.map(child => child.text ?? '').join('') ?? '').join('\n').trim();
    assert.equal(text, 'Agree the purpose, invite the people doing the work, and leave with clear next steps.');
    const owner = item.authorId;
    assert.equal(owner, config.userId);
    assert.equal(item.publishedAt, null); assert.equal(item.liveRevisionId, null);
    const origin = new URL(config.endpoint).origin, response = await fetch(origin + '/posts/' + item.slug, { signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 404); assert.ok(!(await response.text()).includes(item.data.title));
    return { id: item.id, slug: item.slug, status: item.status, owner, title: item.data.title, excerpt: item.data.excerpt, body: text, anonymousHTTP: response.status };
    });
    await check('existing CMS content, menus and settings preserved', async () => {
      const baseline = JSON.parse(fs.readFileSync(path.join(trial.directory, 'baseline-cms.json'), 'utf8'));
      const observer = { token: config.observerToken };
      assert.equal(typeof observer.token, 'string', 'Read-only observer token is unavailable in private runner config');
      assert.ok(cmsCreatedId, 'Owned draft could not be identified');
      const result = await compareCmsBaseline(baseline, config.endpoint, observer.token, cmsCreatedId);
      fs.writeFileSync(path.join(trial.directory, 'cms-after.json'), JSON.stringify(result, null, 2) + '\n');
      return result;
    });
  }
  report.completedAt = new Date().toISOString(); report.mechanicalStatus = report.checks.every(entry => entry.status === 'pass') ? 'pass' : 'fail';
  report.status = report.mechanicalStatus === 'pass' && report.reviewStatus !== 'pending' ? 'pass' : report.mechanicalStatus === 'fail' ? 'fail' : 'pending-review';
  return report;
}
export async function gradeTrial(trial) {
  const target = path.join(trial.directory, 'acceptance.json'); let report;
  try { report = await gradeTrialImpl(trial); }
  catch (error) { report = { trial: trial.id, startedAt: new Date().toISOString(), completedAt: new Date().toISOString(), mechanicalStatus: 'fail', reviewStatus: 'pending', status: 'fail', checks: [{ name: 'grader-runtime', status: 'fail', error: error.message }], limits: ['Grader stopped after a runtime or setup failure; partial checks may be absent.'] }; }
  try { report.afterGradeSource = sourceHashes(trial.site); fs.writeFileSync(path.join(trial.directory, 'after-source.json'), JSON.stringify(report.afterGradeSource, null, 2) + '\n'); } catch (error) { report.restorationStatus = 'unknown'; report.checks.push({ name: 'post-grade-source-capture', status: 'fail', error: error.message }); report.mechanicalStatus = report.status = 'fail'; }
  fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n'); return report;
}
