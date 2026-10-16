import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { test, expect, prepare, styleguide, controls } from './helpers.mjs';

test('capture sensitivity control', async ({ page }) => {
  await prepare(page, styleguide, page.visualProblems);
  await expect(controls(page)).toHaveScreenshot('sensitivity-control.png');
});

for (const [name, css] of Object.entries({
  'shared-token': ':root { --spacing-content: 2.5rem; --color-action: #8a1520; }',
  'small-target': '#controls + .control-row button:first-child { padding-inline: calc(.75rem + 2px); border-width: 4px; }',
})) test(`sensitivity detects ${name} and clean revert`, async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-390' || process.env.VISUAL_UPDATE === '1', 'Sensitivity is verification-only, one renderer size');
  await prepare(page, styleguide, page.visualProblems);
  const expected = info.snapshotPath('sensitivity-control.png');
  const hash = async () => createHash('sha256').update(await readFile(expected)).digest('hex');
  const before = await hash();
  await expect(controls(page)).toHaveScreenshot('sensitivity-control.png');
  const style = await page.addStyleTag({ content: css });
  const failure = await expect(controls(page)).toHaveScreenshot('sensitivity-control.png', { timeout: 1500 }).then(() => null, error => error);
  expect(failure, 'Injected defect must fail the real screenshot matcher').not.toBeNull();
  expect(failure.message).toMatch(/pixels.*different|Screenshot comparison failed/);
  const diffs = info.attachments.filter(attachment => attachment.name.includes('diff'));
  expect(diffs.length, 'Expected/actual/diff artifacts must be retained').toBeGreaterThan(0);
  await info.attach('expected-defect-failure', { body: failure.message, contentType: 'text/plain' });
  await style.evaluate(element => element.remove());
  await expect(controls(page)).toHaveScreenshot('sensitivity-control.png');
  expect(await hash()).toBe(before);
});

test('sensitivity missing baseline fails without writing a golden', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-390' || process.env.VISUAL_UPDATE === '1');
  await prepare(page, styleguide, page.visualProblems);
  const failure = await expect(controls(page)).toHaveScreenshot('intentionally-missing.png', { timeout: 1000 }).then(() => null, error => error);
  expect(failure?.message).toMatch(/doesn't exist|does not exist|missing/i);
  await expect(readFile(info.snapshotPath('intentionally-missing.png'))).rejects.toHaveProperty('code', 'ENOENT');
});

for (const fault of ['route', 'setup', 'image', 'font']) test(`sensitivity readiness rejects missing ${fault}`, async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-390' || process.env.VISUAL_UPDATE === '1');
  if (fault === 'route') await page.route('**/_styleguide', route => route.fulfill({ status: 404, body: 'Missing route' }));
  if (fault === 'setup') await page.route('**/_styleguide', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<h1>Set up your site</h1><main>Login</main>' }));
  if (fault === 'image') await page.route('**/*.svg', route => route.fulfill({ status: 404, body: 'Missing image' }));
  if (fault === 'font') await page.route('**/*.woff2', route => route.fulfill({ status: 404, body: 'Missing font' }));
  const failure = await prepare(page, styleguide, page.visualProblems).then(() => null, error => error);
  expect(failure, `Missing ${fault} must fail readiness`).not.toBeNull();
  expect(failure.message).toMatch({ route: /route status/, setup: /route identity/, image: /capture network\/runtime readiness|decoded image readiness/, font: /required local font faces|font|FontFace/ }[fault]);
  await info.attach('expected-readiness-failure', { body: failure.message, contentType: 'text/plain' });
});
