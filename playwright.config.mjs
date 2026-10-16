import { defineConfig } from '@playwright/test';
import path from 'node:path';
import { visualContract as contract } from './tests/visual/contract.mjs';

const updating = process.env.VISUAL_UPDATE === '1';
if (process.argv.some(arg => arg.startsWith('--update-snapshots')) && !updating) throw new Error('Use npm run test:visual -- --update; raw snapshot update flags are forbidden');
if (process.env.CI || process.env.GITHUB_ACTIONS === 'true') throw new Error('Visual tests are local-only; never run them in GitHub Actions');
if (process.platform !== 'win32') throw new Error('The local reference renderer is Windows; Linux/Docker baselines are not required');
if (updating && process.env.CI) throw new Error('CI cannot update visual baselines');
if (process.versions.node !== contract.node) throw new Error(`Visual renderer requires Node ${contract.node}; observed ${process.versions.node}`);

export default defineConfig({
  testDir: './tests/visual', testMatch: '**/*.spec.mjs',
  globalSetup: './tests/visual/setup.mjs',
  fullyParallel: false, workers: 1, retries: 0,
  timeout: 45000, globalTimeout: 600000, maxFailures: 3,
  forbidOnly: !!process.env.CI,
  updateSnapshots: updating ? 'all' : 'none',
  snapshotPathTemplate: '{testDir}/baselines/{platform}/{projectName}/{arg}{ext}',
  outputDir: '.emdash/visual/results',
  reporter: [['list'], ['html', { outputFolder: '.emdash/visual/report', open: 'never' }], ['json', { outputFile: '.emdash/visual/results.json' }]],
  expect: { timeout: 5000, toHaveScreenshot: { ...contract.comparison, stylePath: path.resolve('tests/visual/capture.css') }, toMatchSnapshot: { threshold: contract.comparison.threshold, maxDiffPixels: 0 } },
  use: { browserName: 'chromium', channel: 'chromium', headless: true,
    locale: contract.locale, timezoneId: contract.timezoneId, colorScheme: contract.colorScheme,
    deviceScaleFactor: contract.deviceScaleFactor, reducedMotion: 'reduce',
    serviceWorkers: 'block', trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
  projects: contract.viewports.map(viewport => ({ name: `chromium-${viewport.width}`, use: { viewport } })),
});
