import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { chromium } from '@playwright/test';
import { parseDesignTokens } from '../../../scripts/design-system.mjs';
import { control, root, state, trialOf, writeJSON, npmRun, serveStatic, serveCMS } from './runtime.mjs';

const trial = trialOf(process.argv[2]); if (!trial) throw Error('Unknown trial');
const out = path.join(control, trial.id + '-grade'); fs.mkdirSync(out, { recursive: true });
const prior = process.argv.includes('--resume-browser') ? JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8')) : null;
if (prior) fs.writeFileSync(path.join(out, 'report-before-browser-retry.json'), JSON.stringify(prior, null, 2) + '\n');
const report = { trial: trial.id, startedAt: new Date().toISOString(), independent: true, criteria: prior ? prior.criteria.filter(c => ['verification','production-build'].includes(c.id)) : [], measurements: {}, limits: [] };
if (prior) report.reusedChecks = { recordedAt: prior.completedAt, ids: ['verification','production-build'], reason: 'Retry browser readiness after unchanged-source infrastructure timeout; preserve prior check outcomes.' };
const check = async (id, fn) => { try { const evidence = await fn(); report.criteria.push({ id, status: 'pass', evidence }); } catch (error) { report.criteria.push({ id, status: 'fail', observation: error.message }); } };
const unknown = (id, reason) => report.criteria.push({ id, status: 'unverified', observation: reason });
const read = file => fs.readFileSync(path.join(trial.site, file), 'utf8');
const tokens = css => parseDesignTokens(css.replaceAll('\r\n', '\n'));
const yaml = createRequire(import.meta.url)('yaml');
const loadYAML = value => { try { return JSON.parse(value); } catch { return yaml.parse(value); } };
let browser, server;

async function observe(origin, routes, directory = out) {
  fs.mkdirSync(directory, { recursive: true });
  const result = [];
  browser ??= await chromium.launch({ channel: 'chromium' });
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 960 } }), page = await context.newPage();
    page.setDefaultNavigationTimeout(30000);
    for (const route of routes) {
      const errors = []; const listener = error => errors.push(error.message); page.on('pageerror', listener);
      const response = await page.goto(origin + route); await page.evaluate(() => document.fonts.ready);
      const observed = await page.evaluate(() => ({ title: document.title, text: document.querySelector('main')?.textContent ?? '', overflow: document.documentElement.scrollWidth - innerWidth, h1s: document.querySelectorAll('main h1').length, times: [...document.querySelectorAll('main time')].map(element => ({ datetime: element.getAttribute('datetime'), text: element.textContent })), links: [...document.querySelectorAll('a')].map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') })), images: [...document.images].map(i => ({ src: i.getAttribute('src'), alt: i.alt, loaded: i.complete && i.naturalWidth > 0 })), gaps: Object.fromEntries(['services-grid', 'approach-grid', 'about-grid'].map(id => { const element = document.getElementById(id); return [id, element ? { row: parseFloat(getComputedStyle(element).rowGap), column: parseFloat(getComputedStyle(element).columnGap) } : null]; })) }));
      const screenshot = path.join(directory, `${width}-${route.replace(/[^a-z0-9]+/gi, '-') || 'home'}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      result.push({ route, width, status: response.status(), ...observed, pageErrors: errors, screenshot });
      page.off('pageerror', listener);
    }
    await context.close();
  }
  return result;
}

try {
  if (!prior) {
    await check('verification', async () => { await npmRun(trial.site, ['run', 'verify'], path.join(out, 'verify.log')); return 'Independent installed verification passed'; });
    await check('production-build', async () => { await npmRun(trial.site, ['run', 'build'], path.join(out, 'build.log')); return 'Independent production build passed'; });
  }
  const base = state();
  if (trial.scenario !== 'cms-journal') {
    server = await serveStatic(path.join(trial.site, 'dist'));
    const routes = trial.scenario === 'static-new' ? ['/', '/services/', '/about/', '/contact/'] : trial.scenario === 'sveltia-field' ? ['/posts/field-notes/', '/posts/practice-update/', '/posts/welcome/'] : trial.scenario === 'cold-resume' ? ['/workshops/', '/', '/about/', '/services/', '/contact/'] : ['/', '/about/'];
    report.measurements.pages = await observe(server.origin, routes);
    await check('responsive-public-pages', () => {
      for (const page of report.measurements.pages) { assert.equal(page.status, 200, page.route); assert.equal(page.h1s, 1, page.route + ' h1 count'); assert.ok(page.overflow <= 1, page.route + ' overflow ' + page.overflow); assert.deepEqual(page.pageErrors, []); assert.ok(page.images.every(i => i.loaded)); }
      return 'Requested pages rendered at 390 and 1440 CSS pixels without horizontal overflow, failed images or page errors';
    });
    await check('missing-route-404', async () => { const r = await fetch(server.origin + '/evaluation-missing-page/'); assert.equal(r.status, 404); return 'Missing URL served as 404, not SPA fallback'; });
    if (trial.scenario === 'static-new') {
      await check('native-static-profile', () => {
        assert.equal(JSON.parse(read('baseline.config.json')).platformProfile, 'static');
        const pkg = JSON.parse(read('package.json')); const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
        assert.ok(!names.some(name => /emdash|sqlite|libsql|@astrojs\/(node|cloudflare|react)/.test(name)));
        assert.ok(!fs.existsSync(path.join(trial.site, 'dist/server'))); return { dependencies: names, noServerArtifact: true };
      });
      await check('supplied-copy-navigation-enquiry', () => {
        const pages = report.measurements.pages.filter(page => page.width === 1440), text = pages.map(p => p.text).join(' ');
        for (const value of ['Practical planning for small businesses', 'Premises review', 'Planning guidance', 'Application support', 'Tell us about your space', 'Northline Planning is an independent consultancy']) assert.ok(text.includes(value), value);
        for (const page of pages) { for (const route of ['/', '/services/', '/about/', '/contact/']) assert.ok(page.links.some(l => l.href?.replace(/\/$/, '') === route.replace(/\/$/, '')), page.route + ' navigation ' + route); assert.ok(page.links.some(l => l.href?.startsWith('mailto:hello@northline.example.test') && l.text === 'Discuss your project')); assert.ok(!/My Site|Welcome to Baseline|Lorem ipsum|Your Company/i.test(page.text)); }
        return 'Four requested routes, supplied service copy and enquiry action present';
      });
      await check('art-direction-record', async () => { await npmRun(trial.site, ['run', 'check:art-direction', '--', '--require-record'], path.join(out, 'art-direction.log')); return 'Required saved record passed the installed gate'; });
      await check('calibration-record', () => { assert.ok(fs.existsSync(path.join(trial.site, 'audit/component-calibration.md'))); return 'Calibration artifact exists; inspect evidence separately'; });
      unknown('calibration-chronology', 'Tool-level execution chronology is not exposed to the evaluator; a final record does not independently prove pre-assembly timing.');
    }
    if (trial.scenario === 'regional-spacing') {
      const initial = await serveStatic(path.join(base.baseStatic, 'dist'));
      try { report.measurements.before = await observe(initial.origin, ['/', '/about/'], path.join(out, 'before')); } finally { await initial.stop(); }
      await check('regional-gap-ratio-and-isolation', () => {
        for (const after of report.measurements.pages) {
          const before = report.measurements.before.find(p => p.width === after.width && p.route === after.route);
          for (const id of ['services-grid', 'approach-grid', 'about-grid']) {
            if (!before.gaps[id]) continue;
            assert.ok(after.gaps[id], 'Missing original grid ' + id);
            for (const axis of ['row', 'column']) assert.ok(Math.abs(after.gaps[id][axis] - before.gaps[id][axis] * (id === 'services-grid' && after.route === '/' ? .75 : 1)) < .1, `${after.route} ${after.width} ${id} ${axis}: ${after.gaps[id][axis]} vs ${before.gaps[id][axis]}`);
          }
          assert.equal(after.text.replace(/\s+/g, ' '), before.text.replace(/\s+/g, ' ')); assert.deepEqual(after.links, before.links);
        }
        return 'Only requested services gaps changed to 75%; other measured grids, copy and links retained';
      });
      await check('theme-and-root-tokens-preserved', () => { const before = tokens(fs.readFileSync(path.join(base.baseStatic, 'src/styles/global.css'), 'utf8')), after = tokens(read('src/styles/global.css')); assert.deepEqual(after, before); return 'LF-normalized parsed theme/root/dark tokens unchanged'; });
    }
    if (trial.scenario === 'sveltia-field') {
      let field;
      await check('sveltia-form-contract', () => {
        const config = loadYAML(read('public/admin/config.yml')), posts = config.collections.find(c => c.name === 'posts');
        field = posts.fields.find(f => f.widget === 'number' && /read|minute/i.test(JSON.stringify(f)));
        assert.ok(field, 'No numeric reading-time field'); assert.equal(field.required, false); assert.equal(field.min, 1); assert.equal(field.max, 60); assert.ok(field.value_type === 'int' || field.step === 1, 'Whole-number form input'); assert.equal(config.output.omit_empty_optional_fields, true); return field;
      });
      await check('reading-time-output-and-absence', () => { for (const page of report.measurements.pages) { if (page.route.includes('field-notes')) assert.match(page.text, /5\s*min\s*read/i); else assert.ok(!/\d*\s*min\s*read/i.test(page.text), page.route + ' empty reading label'); } return '5 min read appears only on the supplied article with a value'; });
      if (field) {
        const postsDirectory = path.join(trial.site, 'src/content/posts');
        const files = fs.readdirSync(postsDirectory, { recursive: true, withFileTypes: true }).filter(entry => entry.isFile() && entry.name.endsWith('.md')).map(entry => path.join(entry.parentPath, entry.name));
        const file = files.find(file => { const match = fs.readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/); return match && loadYAML(match[1]).title === 'Field notes'; });
        assert.ok(file, 'Find supplied article by content rather than source path');
        const original = fs.readFileSync(file, 'utf8');
        try {
          for (const value of [1, 60, 0, 61, 1.5]) {
            const key = field.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const candidate = original.replace(new RegExp('^' + key + ':.*$', 'm'), field.name + ': ' + value);
            const valid = value === 1 || value === 60;
            await check((valid ? 'accept-boundary-' : 'reject-invalid-') + value, async () => { assert.notEqual(candidate, original, 'Could not inject value'); fs.writeFileSync(file, candidate); const result = await npmRun(trial.site, ['run', 'build'], path.join(out, 'value-' + value + '.log'), { allowFailure: true }); if (valid) assert.equal(result.code, 0); else { assert.notEqual(result.code, 0); assert.match(fs.readFileSync(result.log, 'utf8'), /field-notes|reading|minute|schema|valid/i); } return valid ? 'Valid boundary accepted by actual Astro build' : 'Invalid content rejected by actual Astro build'; });
          }
        } finally { fs.writeFileSync(file, original); await npmRun(trial.site, ['run', 'build'], path.join(out, 'restored-build.log')); }
      }
      report.limits.push('No credentialed Sveltia login/save/upload or GitHub publication was performed.');
    }
    if (trial.scenario === 'cold-resume') {
      await check('saved-checkpoint-and-content-preserved', () => {
        const checkpoint = JSON.parse(fs.readFileSync(path.join(control, trial.id + '-checkpoint/receipt.json'), 'utf8'));
        assert.ok(Object.values(checkpoint.checks).every(Boolean));
        for (const file of checkpoint.files.filter(f => f.path.startsWith('src/content/workshops/'))) assert.equal(read(file.path).replaceAll('\r\n','\n'),fs.readFileSync(path.join(control,trial.id+'-checkpoint/files',file.path),'utf8').replaceAll('\r\n','\n'),file.path);
        return 'Captured phase A deferred routes/navigation and persisted a typed model, samples and handoff; phase B preserved LF-normalized workshop content';
      });
      const initial = await serveStatic(path.join(base.baseStatic, 'dist'));
      try { report.measurements.before = await observe(initial.origin, ['/', '/about/', '/services/', '/contact/'], path.join(out, 'before')); } finally { await initial.stop(); }
      await check('existing-public-content-preserved', () => {
        for (const before of report.measurements.before) {
          const after=report.measurements.pages.find(p=>p.route===before.route&&p.width===before.width);
          assert.equal(after.text.replace(/\s+/g,' '),before.text.replace(/\s+/g,' '));
          for (const link of before.links) assert.ok(after.links.some(l=>l.text===link.text&&l.href===link.href));
        }
        return 'Existing main content and links retained on all four established public pages';
      });
      await check('public-workshop-policy', () => { for (const page of report.measurements.pages.filter(p => p.route === '/workshops/')) { assert.ok(page.text.includes('Clear project briefs')); assert.ok(page.text.includes('Learn how to turn an initial conversation into a useful project brief.')); assert.ok(page.text.includes('Northline Studio')); assert.ok(!page.text.includes('Winter planning clinic')); assert.ok(page.times.some(time => time.datetime?.startsWith('2026-11-12')) || /12 November 2026|November 12,? 2026|2026-11-12/.test(page.text), 'Correct workshop date'); assert.ok(page.links.some(l => l.text === 'Ask about a place' && l.href.startsWith('mailto:hello@northline.example.test'))); assert.ok(page.links.some(l => l.href?.replace(/\/$/, '') === '/workshops')); } return 'Published workshop with agreed date, summary, venue and enquiry rendered; draft omitted'; });
      await check('existing-brand-tokens-preserved', () => { assert.deepEqual(tokens(read('src/styles/global.css')), tokens(fs.readFileSync(path.join(base.baseStatic, 'src/styles/global.css'), 'utf8'))); return 'Existing LF-normalized parsed design tokens unchanged'; });
      report.limits.push('Recovery at a deliberate saved checkpoint; not arbitrary process crash or half-written-file recovery.');
    }
  } else {
    server = await serveCMS(trial.site, path.join(out, 'cms-server.log'));
    report.measurements.pages = await observe(server.origin, ['/journal/', '/journal/planning-your-first-workshop', '/posts/planning-your-first-workshop']);
    await check('published-journal-and-existing-post-route', () => { for (const page of report.measurements.pages) { assert.equal(page.status, 200, page.route); assert.ok(page.text.includes('Planning your first workshop')); assert.ok(!page.text.includes('Unannounced workshop')); assert.ok(page.overflow <= 1); } return 'Published content served through Journal and retained Posts route'; });
    await check('anonymous-draft-isolation', async () => { const r = await fetch(server.origin + '/journal/unannounced-workshop'); const body = await r.text(); assert.equal(r.status, 404); assert.ok(!body.includes('This draft must not')); return 'Draft journal URL resolves to 404 without draft body'; });
    await check('journal-navigation', () => { assert.ok(report.measurements.pages.some(p => p.links.some(l => /Journal/i.test(l.text) && l.href?.replace(/\/$/, '') === '/journal'))); return 'Journal reachable through navigation'; });
    await check('actual-inline-editor-roundtrip', async () => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 960 } }), page = await context.newPage(); page.setDefaultTimeout(20000);
      try {
        await context.request.get(server.origin + '/_emdash/api/auth/dev-bypass');
        await page.goto(server.origin + '/journal/planning-your-first-workshop');
        await page.locator('label.emdash-tb-toggle').click();
        const editor = page.locator('main .emdash-inline-editor[contenteditable="true"]'); await editor.waitFor({ state: 'visible' });
        const reference = JSON.parse(await page.locator('main h1[data-emdash-ref]').getAttribute('data-emdash-ref')); assert.equal(reference.collection, 'posts'); assert.ok(reference.id);
        const marker = ' Independent evaluation save ' + trial.attempt + '.';
        await editor.click(); await editor.press('Control+End'); await page.keyboard.insertText(marker);
        const saved = page.waitForResponse(r => r.url().includes('/api/content/posts/') && r.request().method() === 'PUT' && (r.request().postData() ?? '').includes(marker));
        await page.locator('header').click(); assert.equal((await saved).status(), 200);
        await page.reload(); assert.ok((await editor.textContent()).includes(marker));
        const published = page.waitForResponse(r => r.url().includes('/visual-editing/content/posts/') && r.url().endsWith('/publish') && r.request().method() === 'POST');
        await page.locator('#emdash-tb-publish').click(); assert.equal((await published).status(), 200);
        const publicContext = await browser.newContext(), publicPage = await publicContext.newPage();
        try { await publicPage.goto(server.origin + '/journal/planning-your-first-workshop'); assert.ok((await publicPage.locator('main').textContent()).includes(marker)); await publicPage.screenshot({ path: path.join(out, 'editor-public-reload.png'), fullPage: true }); } finally { await publicContext.close(); }
        return { uiTyped: true, blurSaved: true, editorReload: true, uiPublished: true, anonymousReload: true, titleReference: reference };
      } finally { await context.close(); }
    });
    report.limits.push('Actual disposable local development editor only; no production origin, real editor account, Workers or external-provider certification.');
  }
} catch (error) { report.infrastructureError = error.stack; }
finally {
  await browser?.close(); await server?.stop();
  report.completedAt = new Date().toISOString();
  report.summary = Object.fromEntries(['pass', 'fail', 'unverified'].map(status => [status, report.criteria.filter(c => c.status === status).length]));
  report.status = report.infrastructureError ? 'infrastructure-error' : report.summary.fail ? 'fail' : report.summary.unverified ? 'partial' : 'pass';
  try { report.changedFiles = execFileSync('git', ['status', '--short'], { cwd: trial.site, encoding: 'utf8', windowsHide: true }).trim().split('\n').filter(Boolean); } catch {}
  writeJSON(path.join(out, 'report.json'), report);
  console.log(JSON.stringify({ trial: trial.id, status: report.status, summary: report.summary, infrastructureError: report.infrastructureError, failures: report.criteria.filter(c => c.status === 'fail'), report: path.join(out, 'report.json') }, null, 2));
}
