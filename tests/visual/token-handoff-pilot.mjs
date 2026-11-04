// Explicit local rehearsal; no canvas service, client source or production state is changed.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import { chromium, expect } from '@playwright/test';
import { startVisualSite } from './site.mjs';
import { applyTokenOverrides, parseDesignTokens } from '../../scripts/design-system.mjs';

if (process.platform !== 'win32' || process.env.CI || process.env.GITHUB_ACTIONS === 'true') throw Error('Local Windows token handoff rehearsal only');
if (process.argv.length > 2) throw Error('No arguments are supported; this rehearsal always owns a disposable instance');
const root = process.cwd(), report = path.resolve('.emdash/visual/token-handoff-' + Date.now());
await fs.mkdir(report, { recursive: true });
const hash = value => createHash('sha256').update(value).digest('hex');
const cssRelative = 'src/styles/global.css', routeRelative = 'src/pages/token-handoff.astro';
const rootInputs = ['src/styles/global.css', 'src/components/Card.astro', 'src/components/Grid.astro', 'seed/seed.json', 'AGENTS.md'];
const rootHashes = Object.fromEntries(await Promise.all(rootInputs.map(async name => [name, hash(await fs.readFile(path.join(root, name)))])));
const save = async (name, value) => fs.writeFile(path.join(report, name), JSON.stringify(value, null, 2) + '\n');
const selectedTokens = { '--canvas-action': 'oklch(37% 0.092 155)', '--canvas-radius': '1.125rem', '--canvas-content': 'clamp(1.125rem, calc(0.9583rem + 0.8333vi), 1.625rem)' };
const mapping = { '--canvas-action': '--color-action', '--canvas-radius': '--radius-card', '--canvas-content': '--spacing-content' };
const selectedHTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="icon" href="data:,"><title>Synthetic selected handoff specimen</title>
<style data-selected-tokens>:root { ${Object.entries(selectedTokens).map(([name, value]) => name + ':' + value + ';').join('')} }</style>
<style>body{margin:0;padding:24px;font-family:ui-sans-serif,system-ui,sans-serif;background:#fafbfd;color:#202630}main{max-width:68rem;margin:auto}h1{font-size:clamp(1.75rem,calc(1.25rem + 2.5vi),3.25rem)}.canvas-grid{display:grid;gap:24px;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))}.canvas-card{background:white;border:1px solid #c9cdd5;border-radius:var(--canvas-radius)}.canvas-card-body{padding:var(--canvas-content)}h2{font-size:1.25rem;margin:0}p{line-height:1.6}.canvas-action{display:inline-flex;padding:12px 18px;border-radius:6px;background:var(--canvas-action);color:white;text-decoration:none}</style></head><body><main><h1>Alder repair workshop</h1><p>Synthetic agent-selected HTML/CSS canvas. No real business, user design approval or booking.</p><div class="canvas-grid"><article class="canvas-card"><div class="canvas-card-body"><h2>Chair joint repair</h2><p>An inspection and an agreed quote before repair.</p></div></article><article class="canvas-card"><div class="canvas-card-body"><h2>Stool joint repair</h2><p>Keep the existing copy and destinations during this token change.</p></div></article></div><p><a class="canvas-action" href="/posts/welcome">Read the workshop note</a></p></main></body></html>`;
const routeSource = `---
import SiteShell from '../layouts/SiteShell.astro';
import Section from '../components/Section.astro';
import Container from '../components/Container.astro';
import Grid from '../components/Grid.astro';
import Card from '../components/Card.astro';
---
<SiteShell title="Synthetic token handoff rehearsal" spacingPolicy="automatic-v2">
  <link slot="head" rel="icon" href="data:," />
  <Section labelledBy="handoff-title"><Container width="wide"><h1 id="handoff-title">Alder repair workshop</h1><p>Synthetic agent-selected token handoff. No real business, user design approval or booking.</p><Grid><Card class="handoff-card" title="Chair joint repair" description="An inspection and an agreed quote before repair." href="/posts/welcome" headingLevel={2}/><Card class="handoff-card" title="Stool joint repair" description="Keep the existing copy and destinations during this token change." href="/posts/welcome" headingLevel={2}/></Grid><p><a class="btn handoff-action" href="/posts/welcome">Read the workshop note</a></p></Container></Section>
</SiteShell>
`;
let browser, site, calibrationSite, stage, origin;
const receipt = { synthetic: true, selection: 'Agent-selected controlled HTML/CSS specimen; not user approval or an external canvas application trial', profile: 'owned CMS source copy with fresh seed; no working database copied', independentInstall: false, dependencies: 'Existing repository node_modules through owned junctions', mapping, rootHashes, comparisons: [], calibration: [], runtimeErrors: [], limits: ['Three tokens in one explicit scope; no general canvas importer or lossless design/code synchronization.', 'Computed card padding/radius and action color are compared; full-page pixel equality between different compositions is not claimed.', 'Calibration is development evidence; representative before/after route comparisons use separate production builds.', 'System font readback samples the heading; this is not exhaustive font/weight or multilingual acceptance.'] };

function mappedOverrides(html, map) {
  const styles = html.match(/<style data-selected-tokens>([\s\S]*?)<\/style>/)?.[1];
  assert.ok(styles, 'Selected token block is missing');
  const values = {};
  postcss.parse(styles).walkDecls(decl => { assert.ok(Object.hasOwn(map, decl.prop), 'Missing mapping: ' + decl.prop); assert.ok(!Object.hasOwn(values, map[decl.prop]), 'Duplicate target mapping'); values[map[decl.prop]] = decl.value; });
  assert.deepEqual(Object.keys(values).sort(), Object.values(map).sort());
  return { theme: values };
}
function tokenCLI(flags) {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/design-system.mjs'), '--css', path.join(stage, cssRelative), ...flags], { cwd: stage, encoding: 'utf8', timeout: 30000, maxBuffer: 4 * 1024 * 1024 });
  assert.ifError(result.error);
  return result;
}
async function fonts(page) {
  const session = await page.context().newCDPSession(page);
  try { await session.send('DOM.enable'); await session.send('CSS.enable'); const { root: dom } = await session.send('DOM.getDocument'); const { nodeId } = await session.send('DOM.querySelector', { nodeId: dom.nodeId, selector: 'h1' }); const { fonts: used } = await session.send('CSS.getPlatformFontsForNode', { nodeId }); return used.map(font => ({ family: font.familyName, custom: font.isCustomFont, glyphCount: font.glyphCount })); }
  finally { await session.detach(); }
}
async function capture(label, width, canvas = false) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    page.on('pageerror', error => receipt.runtimeErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') receipt.runtimeErrors.push(message.text()); });
    if (canvas) await page.setContent(selectedHTML); else { const response = await page.goto(origin + '/token-handoff'); assert.equal(response.status(), 200); }
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(canvas ? '.canvas-card' : '.handoff-card')).toHaveCount(2);
    const observed = await page.evaluate(canvas => {
      const card = document.querySelector(canvas ? '.canvas-card' : '.handoff-card');
      const body = document.querySelector(canvas ? '.canvas-card-body' : '.handoff-card .card-body');
      const action = document.querySelector(canvas ? '.canvas-action' : '.handoff-action');
      return { radius: getComputedStyle(card).borderRadius, padding: getComputedStyle(body).padding, actionColor: getComputedStyle(action).backgroundColor, overflow: document.documentElement.scrollWidth > innerWidth, text: document.querySelector('main').innerText, links: [...document.querySelectorAll('main a')].map(a => [a.getAttribute('href'), a.textContent]), requestedFont: getComputedStyle(document.querySelector('h1')).fontFamily };
    }, canvas);
    observed.fonts = await fonts(page);
    assert.ok(observed.fonts.some(font => font.glyphCount > 0)); assert.equal(observed.overflow, false);
    await page.screenshot({ path: path.join(report, label + '-' + width + '.png'), fullPage: true });
    return observed;
  } finally { await context.close(); }
}
async function calibrate(label, calibrationOrigin) {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    try { const page = await context.newPage(); const errors = []; page.on('pageerror', error => errors.push(error.message)); await page.goto(calibrationOrigin + '/_styleguide'); await page.evaluate(() => document.fonts.ready); await expect(page.locator('[data-styleguide-ready]')).toBeAttached(); const cards = await page.locator('.card').count(); assert.ok(cards > 0); assert.deepEqual(errors, []); const sample = await page.locator('.card').first().evaluate(card => ({ radius: getComputedStyle(card).borderRadius, padding: getComputedStyle(card.querySelector('.card-body')).padding })); await page.screenshot({ path: path.join(report, label + '-' + width + '.png'), fullPage: true }); receipt.calibration.push({ label, width, cards, sample, fonts: await fonts(page), evidence: 'development styleguide, not production route acceptance' }); }
    finally { await context.close(); }
  }
}
try {
  await fs.writeFile(path.join(report, 'selected-canvas.html'), selectedHTML);
  browser = await chromium.launch({ channel: 'chromium' });
  site = await startVisualSite(root, report, { fixedClock: false, releaseOnly: true, prepareStage: async info => { stage = info.stage; origin = info.origin; await fs.writeFile(path.join(stage, routeRelative), routeSource); }, onDevReady: async () => calibrate('calibration-before', origin) });
  const initial = await fs.readFile(path.join(stage, cssRelative), 'utf8');
  const routeHash = hash(await fs.readFile(path.join(stage, routeRelative)));
  const originalTokens = parseDesignTokens(initial);
  const overrides = mappedOverrides(selectedHTML, mapping);
  const missingMap = { ...mapping }; delete missingMap['--canvas-radius'];
  assert.throws(() => mappedOverrides(selectedHTML, missingMap), /Missing mapping/);
  assert.equal(await fs.readFile(path.join(stage, cssRelative), 'utf8'), initial);
  const rejected = tokenCLI(['--set', '--missing-canvas-token=1rem', '--write', '--json']);
  assert.notEqual(rejected.status, 0); assert.equal(await fs.readFile(path.join(stage, cssRelative), 'utf8'), initial);
  receipt.refusal = { missingMappingRejected: true, unknownTargetCLIRejected: true, savedCSSPreserved: true };
  const flags = Object.entries(overrides.theme).flatMap(([name, value]) => ['--set', name + '=' + value]);
  const preview = tokenCLI([...flags, '--json']);
  assert.equal(preview.status, 0, preview.stderr); const previewReport = JSON.parse(preview.stdout); assert.equal(previewReport.mode, 'preview'); assert.equal(previewReport.valid, true); assert.equal(await fs.readFile(path.join(stage, cssRelative), 'utf8'), initial);
  assert.deepEqual(previewReport.changes.theme, overrides.theme);
  await save('token-preview.json', previewReport);
  const expected = applyTokenOverrides(initial, overrides);
  receipt.preview = { readOnly: true, initialCSSSHA256: hash(initial), candidateCSSSHA256: hash(expected), exactThemeChanges: overrides.theme, expressionPreserved: overrides.theme['--spacing-content'], reviewedBy: 'Rehearsal assertions and implementing agent; no human approval claim' };
  const before = new Map();
  for (const width of [390, 768, 1440]) before.set(width, await capture('production-before', width));
  await site.rebuildRelease(async () => {
    const applied = tokenCLI([...flags, '--write', '--json']); assert.equal(applied.status, 0, applied.stderr); const appliedReport = JSON.parse(applied.stdout); assert.equal(appliedReport.mode, 'saved'); await save('token-applied.json', appliedReport);
    assert.equal(await fs.readFile(path.join(stage, cssRelative), 'utf8'), expected);
    const updated = parseDesignTokens(expected);
    for (const scope of ['theme', 'root', 'dark', 'light']) for (const [name, value] of Object.entries(originalTokens[scope] ?? {})) if (!(scope === 'theme' && Object.hasOwn(overrides.theme, name))) assert.equal(updated[scope][name], value, 'Unrelated scoped token changed: ' + scope + ':' + name);
    assert.equal(hash(await fs.readFile(path.join(stage, routeRelative))), routeHash);
  });
  for (const width of [390, 768, 1440]) {
    const canvas = await capture('selected-canvas', width, true), after = await capture('production-after', width), previous = before.get(width);
    for (const key of ['radius', 'padding', 'actionColor']) { assert.equal(after[key], canvas[key], 'Canvas/native mismatch: ' + key); assert.notEqual(after[key], previous[key], 'Requested change did not reach native specimen: ' + key); }
    assert.equal(after.text, previous.text); assert.deepEqual(after.links, previous.links);
    assert.deepEqual(after.fonts, canvas.fonts);
    receipt.comparisons.push({ width, before: previous, canvas, after, mappedValuesEqual: true, copyAndDestinationsPreserved: true });
  }
  // Reopen the updated source in a separate owned dev copy for actual native styleguide calibration.
  calibrationSite = await startVisualSite(stage, path.join(report, 'after-calibration'), { fixedClock: false, devOnly: true, dependencyRoot: root });
  await calibrate('calibration-after', calibrationSite.origin);
  for (const item of receipt.calibration.filter(item => item.label === 'calibration-after')) assert.equal(item.sample.radius, '18px');
  await calibrationSite.cleanup(); calibrationSite = undefined;
  for (const name of rootInputs) assert.equal(hash(await fs.readFile(path.join(root, name))), rootHashes[name], 'Working project was changed: ' + name);
  assert.deepEqual(receipt.runtimeErrors, []);
  receipt.status = 'passed'; receipt.rootPreserved = true; receipt.routeSourcePreserved = true;
  await save('receipt.json', receipt);
  console.log(JSON.stringify({ status: receipt.status, report, viewports: receipt.comparisons.map(item => item.width), preview: receipt.preview, refusal: receipt.refusal }));
} catch (error) { await save('failure.json', { message: error.message, stack: error.stack }); throw error; }
finally { await calibrationSite?.cleanup(); await site?.cleanup(); await browser?.close(); console.log('Token handoff evidence:', report); }
