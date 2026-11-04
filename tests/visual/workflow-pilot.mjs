import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { chromium, expect } from '@playwright/test';
import { startVisualSite } from './site.mjs';
import { prepareImages } from '../../scripts/prepare-images.mjs';

if (process.platform !== 'win32' || process.env.CI || process.env.GITHUB_ACTIONS === 'true') throw Error('Local Windows workflow rehearsal only');
const hold = process.argv.includes('--hold');
if (process.argv.slice(2).some(value => value !== '--hold')) throw Error('Only --hold is supported');
const root = process.cwd();
const report = path.resolve('.emdash/visual/workflow-pilot-' + Date.now());
await fs.mkdir(report, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const rootSeedHash = hash(await fs.readFile(path.join(root, 'seed/seed.json')));
const sourcePaths = ['src/pages/workshop.astro', 'src/pages/workshop-services/index.astro', 'src/pages/workshop-services/[slug].astro', 'src/components/WorkflowServiceCard.astro'];
const componentSource = `---
import Card from './Card.astro';
const { service } = Astro.props;
---
<Card class="workflow-service-card" data-service={service.data.slug} title={service.data.title} titleEdit={service.edit.title} description={service.data.description} descriptionEdit={service.edit.description} href={'/workshop-services/' + service.id} headingLevel={2} style="--card-padding: 0.5rem">
  <p slot="metadata" {...service.edit.price_label}>{service.data.price_label}</p>
</Card>
`;
const listingSource = `---
import { getEmDashCollection } from 'emdash';
import Base from '../../layouts/Base.astro';
import Section from '../../components/Section.astro';
import Grid from '../../components/Grid.astro';
import WorkflowServiceCard from '../../components/WorkflowServiceCard.astro';
const { entries: services, cacheHint } = await getEmDashCollection('workshop_services', { orderBy: { title: 'asc' } });
if (Astro.cache?.enabled) Astro.cache.set(cacheHint);
---
<Base title="Workshop services — synthetic rehearsal">
  <Section labelledBy="services-title"><h1 id="services-title">Workshop services</h1><p>Synthetic repair-workshop rehearsal. No real business or booking.</p><Grid>{services.map(service => <WorkflowServiceCard service={service} />)}</Grid></Section>
</Base>
`;
const detailSource = `---
import { getEmDashEntry } from 'emdash';
import { Image } from 'emdash/ui';
import Base from '../../layouts/Base.astro';
import Section from '../../components/Section.astro';
const slug = Astro.params.slug;
const { entry: service, cacheHint } = await getEmDashEntry('workshop_services', slug);
if (!service) return Astro.redirect('/404');
if (Astro.cache?.enabled) Astro.cache.set(cacheHint);
---
<Base title={service.data.title} content={{ collection: 'workshop_services', id: service.data.id, slug }}>
<Section labelledBy="service-title"><h1 id="service-title" {...service.edit.title}>{service.data.title}</h1><p>Synthetic repair-workshop rehearsal.</p><p data-price {...service.edit.price_label}>{service.data.price_label}</p><p {...service.edit.description}>{service.data.description}</p>{service.data.image && <div data-service-image><Image image={service.data.image} /></div>}<a href="/workshop-services">All workshop services</a></Section>
</Base>
`;
const overviewSource = `---
import { getEmDashCollection } from 'emdash';
import Base from '../layouts/Base.astro';
import Section from '../components/Section.astro';
import Grid from '../components/Grid.astro';
import WorkflowServiceCard from '../components/WorkflowServiceCard.astro';
const { entries: services, cacheHint } = await getEmDashCollection('workshop_services', { orderBy: { title: 'asc' } });
if (Astro.cache?.enabled) Astro.cache.set(cacheHint);
---
<Base title="Alder Repair Workshop — synthetic rehearsal"><Section labelledBy="workshop-title"><h1 id="workshop-title">Alder Repair Workshop</h1><p>Fictional local workshop. Browse a service, then ask for an assessment. No real bookings or customer claims.</p><Grid>{services.map(service => <WorkflowServiceCard service={service} />)}</Grid></Section></Base>
`;
let browser, context, page, stage, origin, site;
const runtimeErrors = [];
const receipt = { synthetic: true, independentInstall: false, dependencies: 'Existing repository dependencies through the visual helper junction', workingDatabaseCopied: false, workingSeedChanged: false, tasks: {}, sourceMap: [], runtimeErrors };
async function write(name, value) { await fs.writeFile(path.join(report, name), JSON.stringify(value, null, 2) + '\n'); }
async function sourceHashes() {
  const entries = await Promise.all(sourcePaths.map(async name => [name, hash(await fs.readFile(path.join(stage, name)))]));
  return Object.fromEntries(entries);
}
async function unrelatedContentHashes() {
  const result = {};
  for (const collection of ['pages', 'posts']) {
    const response = await context.request.get(origin + '/_emdash/api/content/' + collection);
    expect(response.status()).toBe(200);
    result[collection] = hash(JSON.stringify(await response.json()));
  }
  return result;
}
async function publicRead(route, expectedCount) {
  const anon = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const target = await anon.newPage();
  await target.goto(origin + route);
  if (expectedCount !== undefined) await expect(target.locator('.workflow-service-card')).toHaveCount(expectedCount);
  return { anon, target };
}
async function screenshot(name) { await page.screenshot({ path: path.join(report, name + '.png'), fullPage: true }); }
async function saveAdmin() {
  const creating = new URL(page.url()).pathname.endsWith('/new');
  const response = page.waitForResponse(r => r.url().includes('/_emdash/api/content/workshop_services') && ['POST', 'PUT'].includes(r.request().method()));
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  const saved = await response; expect(saved.ok()).toBeTruthy();
  await write('last-admin-save.json', { status: saved.status(), payload: saved.request().postDataJSON(), response: await saved.json() });
  if (creating) await page.waitForURL(url => !url.pathname.endsWith('/new'));
  return saved;
}
async function publishAdmin() {
  const published = page.waitForResponse(response => response.url().includes('/api/content/workshop_services/') && response.url().includes('/publish') && response.request().method() === 'POST');
  await page.getByRole('button', { name: /^Publish (now|changes)$/ }).click();
  const confirmation = page.getByRole('dialog', { name: /^Publish (now|changes)\?$/ });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: /^Publish (now|changes)$/ }).click();
  expect((await published).status()).toBe(200);
  await expect(confirmation).not.toBeVisible();
}
async function uploadMedia(files) {
  await page.goto(origin + '/_emdash/admin/media');
  await expect(page.getByRole('heading', { name: 'Media Library', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Upload Files', exact: true }).first().click();
  await page.getByLabel('Browse files to upload').setInputFiles(files);
  await expect(page.getByText(files.length + ' of ' + files.length + ' complete', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  for (const file of files) {
    await page.getByRole('button', { name: path.basename(file), exact: true }).click();
    const details = page.getByRole('dialog', { name: 'Media details' }); await expect(details).toBeVisible();
    await details.getByRole('textbox', { name: 'Alt Text' }).fill('Synthetic workshop illustration ' + path.basename(file));
    await details.getByRole('textbox', { name: 'Caption' }).fill('Synthetic rehearsal asset; no real workshop photograph.');
    const saved = page.waitForResponse(response => response.url().includes('/_emdash/api/media/') && response.request().method() === 'PUT');
    await details.getByRole('button', { name: 'Save', exact: true }).click(); expect((await saved).status()).toBe(200);
    await details.getByRole('button', { name: 'Close', exact: true }).click();
  }
}
async function selectMedia(filename, replace = false) {
  const oldImage = replace ? await page.locator('fieldset img').getAttribute('src') : null;
  await page.getByRole('button', { name: replace ? 'Replace' : 'Select image', exact: true }).click();
  const picker = page.getByRole('dialog', { name: replace ? 'Replace Service image' : 'Select Service image', exact: true });
  const selected = picker.getByRole('button', { name: filename, exact: true });
  await selected.click();
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await picker.getByRole('button', { name: replace ? 'Replace' : 'Select', exact: true }).click();
  await expect(picker).not.toBeVisible();
  await expect(page.locator('fieldset img')).toBeVisible();
  if (oldImage) await expect(page.locator('fieldset img')).not.toHaveAttribute('src', oldImage);
}
try {
  site = await startVisualSite(root, report, { fixedClock: false, releaseOnly: true, prepareStage: async info => {
    stage = info.stage; origin = info.origin;
    await fs.mkdir(path.join(stage, 'src/pages/workshop-services'), { recursive: true });
    for (const [name, source] of [[sourcePaths[0], overviewSource], [sourcePaths[1], listingSource], [sourcePaths[2], detailSource], [sourcePaths[3], componentSource]]) await fs.writeFile(path.join(stage, name), source);
    const config = path.join(stage, 'astro.config.mjs');
    let source = await fs.readFile(config, 'utf8');
    source = source.replace('import { defineConfig } from "astro/config";', 'import { defineConfig, sessionDrivers } from "astro/config";');
    source = source.replace('  output: "server",', '  output: "server",\n  session:{driver:sessionDrivers.fsLite({base:' + JSON.stringify(path.join(stage, 'workflow-sessions')) + '})},');
    await fs.writeFile(config, source);
    const target = path.join(stage, 'seed/seed.json'), seed = JSON.parse(await fs.readFile(target, 'utf8'));
    seed.collections.push({ slug: 'workshop_services', label: 'Workshop Services', labelSingular: 'Workshop Service', urlPattern: '/workshop-services/{slug}', supports: ['drafts', 'revisions', 'search'], fields: [{ slug: 'title', label: 'Title', type: 'string', required: true }, { slug: 'price_label', label: 'Price label', type: 'string', required: true }, { slug: 'description', label: 'Description', type: 'text' }, { slug: 'image', label: 'Service image', type: 'image' }] });
    seed.content.workshop_services = [{ id: 'workflow-chair', slug: 'chair-joints', status: 'published', data: { title: 'Chair joint repair', price_label: 'From £85 per chair', description: 'Inspect a loose wooden dining-chair joint and agree a quote before repair.' } }, { id: 'workflow-stool', slug: 'stool-joints', status: 'published', data: { title: 'Stool joint repair', price_label: 'From £65 per stool', description: 'An assessment of a loose wooden stool before an agreed repair.' } }];
    await fs.writeFile(target, JSON.stringify(seed));
  }, onDevReady: async () => {
    browser = await chromium.launch({ channel: 'chromium' });
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    page = await context.newPage(); page.setDefaultTimeout(20000);
    page.on('pageerror', error => runtimeErrors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
    await page.goto(origin + '/_styleguide'); await page.evaluate(() => document.fonts.ready); await screenshot('calibration-wide');
    await page.setViewportSize({ width: 390, height: 844 }); await screenshot('calibration-narrow');
    receipt.calibration = { path: '/_styleguide', viewports: [390, 1440], primitives: ['Section', 'Grid', 'Card'], synthetic: true };
    await page.goto(origin + '/_emdash/api/setup/dev-bypass?redirect=/workshop');
  } });
  receipt.origin = origin; receipt.stage = stage;
  await page.setViewportSize({ width: 1280, height: 960 });
  await page.goto(origin + '/workshop-services');
  await expect(page.locator('.workflow-service-card')).toHaveCount(2);
  runtimeErrors.length = 0; // The owned dev-to-build transition intentionally stops its dev server.
  const unrelatedBefore = await unrelatedContentHashes();
  const initialHashes = await sourceHashes();
  await page.goto(origin + '/workshop-services/chair-joints');
  await expect(page.locator('#emdash-edit-toggle')).toBeAttached();
  if (!await page.locator('#emdash-edit-toggle').isChecked()) await page.locator('label.emdash-tb-toggle').click();
  const price = page.locator('[data-price]');
  await price.click(); await price.press('Control+A'); await page.keyboard.insertText('From £95 per chair');
  const save = page.waitForResponse(r => r.url().includes('/api/content/workshop_services/') && r.request().method() === 'PUT');
  await page.locator('h1').click(); const saved = await save; expect(saved.status()).toBe(200);
  await page.reload(); await expect(price).toContainText('From £95 per chair');
  const published = page.waitForResponse(r => r.url().includes('/visual-editing/content/workshop_services/') && r.url().endsWith('/publish') && r.request().method() === 'POST');
  await page.locator('#emdash-tb-publish').click(); expect((await published).status()).toBe(200);
  let anonymous = await publicRead('/workshop-services/chair-joints'); await expect(anonymous.target.locator('[data-price]')).toHaveText('From £95 per chair'); await anonymous.anon.close();
  receipt.tasks.changePrice = { interface: 'inline editor', save: 200, reload: true, publish: true, anonymousReadback: true };
  console.log('Owner task 1 passed: inline price edit, save/reload/publish and anonymous readback.');
  await page.goto(origin + '/_emdash/admin');
  const start = page.getByRole('button', { name: 'Get Started', exact: true }); await expect(start).toBeVisible({ timeout: 30000 }); await start.click();
  await page.locator('a[href="/_emdash/admin/content/workshop_services"]').first().click();
  await page.getByRole('link', { name: 'Add New', exact: true }).click();
  await screenshot('new-service-form');
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Bench joint repair');
  await page.getByRole('textbox', { name: 'Price label', exact: true }).fill('Assessment and quote');
  await page.getByRole('textbox', { name: 'Description', exact: true }).fill('A fictional additional service entered once through the collection editor.');
  await saveAdmin(); await page.reload(); await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toHaveValue('Bench joint repair');
  await publishAdmin();
  anonymous = await publicRead('/workshop-services', 3); await expect(anonymous.target.locator('.workflow-service-card')).toContainText(['Bench joint repair', 'Chair joint repair', 'Stool joint repair']);
  const addedService = anonymous.target.getByRole('link', { name: 'Bench joint repair', exact: true });
  const addedDestination = await addedService.getAttribute('href');
  expect(addedDestination).toMatch(/^\/workshop-services\/[^/]+$/);
  await addedService.click();
  await expect(anonymous.target.locator('h1')).toHaveText('Bench joint repair');
  await expect(anonymous.target.locator('[data-price]')).toHaveText('Assessment and quote');
  await expect(anonymous.target.locator('main')).toContainText('A fictional additional service entered once through the collection editor.');
  await anonymous.anon.close();
  expect(await sourceHashes()).toEqual(initialHashes);
  receipt.tasks.addService = { interface: 'collection admin', save: true, reload: true, publish: true, initialItems: 2, finalItems: 3, sourceUnchanged: true, addedDestination, linkedDetailReadback: true, renderedBy: 'services.map(service => <WorkflowServiceCard service={service} />)' };
  console.log('Owner task 2 passed: native collection entry increased listing from 2 to 3 with unchanged source.');
  const imageSources = path.join(report, 'image-sources'); await fs.mkdir(imageSources);
  for (const [name, background] of [['synthetic-before.png', '#d8d8d8'], ['synthetic-after.png', '#b0c2b0']]) await sharp({ create: { width: 320, height: 180, channels: 3, background } }).png().toFile(path.join(imageSources, name));
  const prepared = path.join(root, '.emdash/backups', 'workflow-pilot-' + path.basename(report));
  const preparation = prepareImages({ source: imageSources, out: prepared, preset: 'artwork' }, { projectRoot: root });
  expect(preparation.status).toBe('ready');
  const mediaManifest = JSON.parse(await fs.readFile(preparation.manifest, 'utf8'));
  const eligible = mediaManifest.entries.map(entry => ({ source: entry.path, file: path.join(prepared, entry.output.path), filename: path.basename(entry.output.path), sha256: entry.output.sha256 }));
  await uploadMedia(eligible.map(entry => entry.file));
  await page.goto(origin + '/_emdash/admin/content/workshop_services');
  await page.getByText('Chair joint repair', { exact: true }).click();
  await selectMedia(eligible.find(entry => entry.source === 'synthetic-before.png').filename);
  await saveAdmin(); await publishAdmin();
  anonymous = await publicRead('/workshop-services/chair-joints');
  const firstImage = anonymous.target.locator('[data-service-image] img'); await expect(firstImage).toBeVisible();
  const firstImageUrl = await firstImage.getAttribute('src'); await anonymous.anon.close();
  await selectMedia(eligible.find(entry => entry.source === 'synthetic-after.png').filename, true);
  await saveAdmin(); await page.reload(); await publishAdmin();
  anonymous = await publicRead('/workshop-services/chair-joints');
  const replacement = anonymous.target.locator('[data-service-image] img'); await expect(replacement).toBeVisible();
  expect(await replacement.getAttribute('src')).not.toBe(firstImageUrl); expect(await replacement.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await anonymous.target.screenshot({ path: path.join(report, 'public-media-replacement.png'), fullPage: true }); await anonymous.anon.close();
  receipt.tasks.replaceMedia = { interface: 'native content image picker', prepared: preparation.summary ?? { status: preparation.status, files: preparation.files }, firstReferenceSavedAndPublished: true, replacementSavedReloadedAndPublished: true, differentAnonymousImageUrl: true, decoded: true };
  console.log('Owner task 3 passed: prepared images selected/replaced, saved/reloaded/published and decoded anonymously.');
  anonymous = await publicRead('/workshop-services', 3);
  const beforePadding = await anonymous.target.locator('.workflow-service-card .card-body').evaluateAll(elements => elements.map(element => getComputedStyle(element).padding));
  const beforeText = await anonymous.target.locator('.workflow-service-card').allTextContents();
  await anonymous.target.screenshot({ path: path.join(report, 'component-before.png'), fullPage: true }); await anonymous.anon.close();
  await site.rebuildRelease(async () => {
    const file = path.join(stage, 'src/components/WorkflowServiceCard.astro'); const source = await fs.readFile(file, 'utf8');
    expect(source.includes('--card-padding: 0.5rem')).toBe(true); await fs.writeFile(file, source.replace('--card-padding: 0.5rem', '--card-padding: var(--spacing-content)'));
  });
  runtimeErrors.length = 0;
  const layoutEvidence = [];
  for (const width of [390, 768, 1440]) {
    const anon = await browser.newContext({ viewport: { width, height: 900 } }), target = await anon.newPage();
    target.on('pageerror', error => runtimeErrors.push(error.message)); target.on('console', message => { if (message.type() === 'error') runtimeErrors.push(message.text()); });
    await target.goto(origin + '/workshop-services'); await expect(target.locator('.workflow-service-card')).toHaveCount(3);
    expect(await target.locator('.workflow-service-card').allTextContents()).toEqual(beforeText);
    const padding = await target.locator('.workflow-service-card .card-body').evaluateAll(elements => elements.map(element => getComputedStyle(element).padding));
    expect(padding.every(value => value !== beforePadding[0])).toBe(true);
    expect(await target.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await target.screenshot({ path: path.join(report, 'services-' + width + '.png'), fullPage: true });
    await target.goto(origin + '/workshop'); await expect(target.locator('.workflow-service-card')).toHaveCount(3);
    const sharedPadding = await target.locator('.workflow-service-card .card-body').evaluateAll(elements => elements.map(element => getComputedStyle(element).padding)); expect(sharedPadding).toEqual(padding);
    layoutEvidence.push({ width, listingCards: 3, overviewCards: 3, padding, noOverflow: true }); await anon.close();
  }
  receipt.tasks.sharedComponent = { change: 'Synthetic cramped-card control corrected to the existing content spacing token', sourceFilesChanged: ['src/components/WorkflowServiceCard.astro'], beforePadding, after: layoutEvidence, unrelatedCardTextRetained: true, sourceImportsAndMapObserved: true };
  const finalHashes = await sourceHashes(); for (const name of sourcePaths.filter(name => !name.endsWith('WorkflowServiceCard.astro'))) expect(finalHashes[name]).toBe(initialHashes[name]);
  receipt.sourceMap = sourcePaths.map(source => ({ source, initialSHA256: initialHashes[source], finalSHA256: finalHashes[source] }));
  const unrelatedAfter = await unrelatedContentHashes(); expect(unrelatedAfter).toEqual(unrelatedBefore);
  expect(hash(await fs.readFile(path.join(root, 'seed/seed.json')))).toBe(rootSeedHash);
  receipt.preservation = { rootSeedSHA256: rootSeedHash, rootSeedUnchanged: true, unrelatedContentBefore: unrelatedBefore, unrelatedContentAfter: unrelatedAfter, nativeReadback: true };
  expect(runtimeErrors).toEqual([]);
  await write('receipt.json', receipt);
  await write('progress.json', receipt);
  console.log('Pilot stage:', stage, 'origin:', origin, 'report:', report);
  await write('ready.json', { origin, stage, report, status: 'owner tasks and loops/components passed; available for parent read-only evidence capture' });
  if (hold) { console.log('Holding for parent review; create stop file in report directory to finish.'); while (true) { try { await fs.access(path.join(report, 'stop')); break; } catch {} await new Promise(resolve => setTimeout(resolve, 1000)); } }
} catch (error) {
  await screenshot('failure').catch(() => {});
  if (page) await fs.writeFile(path.join(report, 'failure.html'), await page.content().catch(() => ''));
  await write('failure.json', { message: error.message, runtimeErrors, origin, stage });
  console.error(error); process.exitCode = 1;
} finally {
  await context?.close(); await browser?.close(); await site?.cleanup();
  console.log('Workflow pilot artifacts:', report);
}
