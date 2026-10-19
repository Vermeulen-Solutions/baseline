import path from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { startVisualSite } from './site.mjs';
import { visualContract } from './contract.mjs';

export default async function setup() {
  const browsers = JSON.parse(await readFile('node_modules/playwright-core/browsers.json', 'utf8'));
  if (browsers.browsers.find(browser => browser.name === 'chromium').revision !== visualContract.chromiumRevision) throw new Error('Unexpected Chromium revision');
  const reportDir = path.resolve('.emdash/visual');
  await mkdir(reportDir, { recursive: true });
  const site = await startVisualSite(process.cwd(), reportDir, { prepareStage: async ({ stage }) => {
    await writeFile(path.join(stage, 'src/pages/primitive-edge.astro'), `---
import EditorialImage from '../components/EditorialImage.astro';
import PhotoGallery from '../components/PhotoGallery.astro';
import Disclosure from '../components/Disclosure.astro';
const bad = { toString: null };
---
<html lang="en"><head><title>Primitive resilience</title></head><body>
<EditorialImage node={null} />
<EditorialImage node={{ asset: { url: '/missing.jpg' }, caption: bad, link: bad, alignment: bad }} />
<EditorialImage node={{ asset: { _ref: 'missing' }, caption: bad }} />
<PhotoGallery value={null} node={bad} layout={null} breakout={bad} title={bad} />
<PhotoGallery node={{ _type:'gallery', columns:bad, images:[null,bad] }} />
<Disclosure id="edge-panel"><span slot="summary">Panel</span>Body</Disclosure>
</body></html>`);
  } });
  try {
    process.env.VISUAL_ORIGIN = site.origin;
    const hash = async file => createHash('sha256').update(await readFile(file)).digest('hex');
    await writeFile(path.join(reportDir, 'environment.json'), JSON.stringify({ ...visualContract, observedNode: process.versions.node, platform: process.platform, arch: process.arch, seedSHA256: await hash('seed/seed.json'), sourceCSS_SHA256: await hash('src/styles/global.css') }, null, 2) + '\n');
    return site.cleanup;
  } catch (error) { await site.cleanup(); throw error; }
}
