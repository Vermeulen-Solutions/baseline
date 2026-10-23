// Independent artifact checks. Never imports or trusts evaluator-authored tests.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { sourceHashes, npmLog, privateOf } from './workflow-replay.mjs';
import { mcpResult } from './workflow-replay-runner.mjs';
import { auditHTMLIntegrity } from './audit-html-integrity.mjs';

export function changedSources(before, after) {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(file => before[file] !== after[file]).sort();
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
function decoded(result) {
  assert.equal(result.kind, 'mcp-result', JSON.stringify(result));
  const value = result.envelope.result;
  if (value.structuredContent !== undefined) return value.structuredContent;
  return JSON.parse(value.content.filter(item => item.type === 'text').map(item => item.text).join('\n'));
}
export async function gradeTrial(trial) {
  const receipt = JSON.parse(fs.readFileSync(path.join(trial.directory, 'receipt.json'))), config = privateOf(trial);
  const report = { trial: trial.id, startedAt: new Date().toISOString(), checks: [], limits: ['Local mechanical artifact checks; operator reviews permission explanations and cold-resume decision quality separately.', 'Not full visual/accessibility, hosted OAuth, D1/R2 or browser-editor acceptance.'] };
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
    const allowed = file => trial.scenario === 'static' ? file === 'src/pages/index.astro' : trial.scenario === 'older-profile' ? file === 'HANDOFF.md' : trial.scenario === 'cms' ? false : /^(?:src\/content.config.ts|src\/pages\/posts\/\[\.\.\.id\].astro|src\/lib\/(?:post-fields|reading-minutes).ts|public\/admin\/config.yml|tests\/[^/]+\.test.mjs|docs\/sveltia-cms.md)$/.test(file);
    assert.deepEqual([...changed, ...untracked].filter(file => !allowed(file)), []);
    if (trial.scenario !== 'cms') assert.ok(changed.length > 0, 'Task must produce an artifact change');
    fs.writeFileSync(path.join(trial.directory, 'after-source.json'), JSON.stringify(after, null, 2) + '\n');
    fs.writeFileSync(path.join(trial.directory, 'changes.patch'), git(['diff', '--binary', 'HEAD']));
    return { changed, untracked };
  });
  if (trial.scenario === 'older-profile') {
    await check('missing optional references and recovered handoff facts', async () => {
      for (const file of ['docs/project-context.md', 'PROJECT.example.md', 'PROJECT.md']) assert.equal(fs.existsSync(path.join(trial.site, file)), false, file);
      const text = fs.readFileSync(path.join(trial.site, 'HANDOFF.md'), 'utf8');
      for (const regex of [/team leads/i, /English/i, /static/i, /workshops@northline\.example\.test/, /editor/i, /maintainer/i, /quarterly/i, /assum/i, /(?:deadline|launch date|date).*(?:unapproved|not approved|unresolved|no .*approved)/i, /(?:routes|listing|index)/i]) assert.match(text, regex);
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
    const server = await serveStatic(path.join(trial.site, 'dist')), browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage(), measurements = [];
      for (const width of [600, 1000, 1500]) {
        await page.setViewportSize({ width, height: 900 }); await page.goto(server.origin);
        const values = await page.evaluate(() => ({ services: parseFloat(getComputedStyle(document.querySelector('#services-grid')).columnGap), reference: parseFloat(getComputedStyle(document.querySelector('#approach-grid')).columnGap) }));
        assert.ok(values.reference > 0 && Math.abs(values.services / values.reference - 0.75) < 0.002, JSON.stringify(values));
        measurements.push({ width, ...values });
      }
      return measurements;
    } finally { await browser.close(); await server.stop(); }
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
  if (trial.scenario === 'cms') await check('owned exact draft and anonymous 404', async () => {
    const call = async (name, args) => decoded(await mcpResult(config.endpoint, config.token, name, args));
    const list = await call('content_list', { collection: 'posts', limit: 100 });
    const entry = list.items.find(item => item.slug === 'kickoff-' + trial.id); assert.ok(entry, 'Expected draft slug');
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
  report.completedAt = new Date().toISOString(); report.status = report.checks.every(entry => entry.status === 'pass') ? 'pass' : 'fail';
  fs.writeFileSync(path.join(trial.directory, 'acceptance.json'), JSON.stringify(report, null, 2) + '\n'); return report;
}
