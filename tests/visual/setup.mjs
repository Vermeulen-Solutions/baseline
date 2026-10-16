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
  const site = await startVisualSite(process.cwd(), reportDir);
  try {
    process.env.VISUAL_ORIGIN = site.origin;
    const hash = async file => createHash('sha256').update(await readFile(file)).digest('hex');
    await writeFile(path.join(reportDir, 'environment.json'), JSON.stringify({ ...visualContract, observedNode: process.versions.node, platform: process.platform, arch: process.arch, seedSHA256: await hash('seed/seed.json'), sourceCSS_SHA256: await hash('src/styles/global.css') }, null, 2) + '\n');
    return site.cleanup;
  } catch (error) { await site.cleanup(); throw error; }
}
