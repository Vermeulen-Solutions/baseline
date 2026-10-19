import { test, expect, observe } from './helpers.mjs';

const route = '/_form-recovery';
async function submit(page, button, status) {
  const [response] = await Promise.all([
    page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === route),
    page.getByRole('button', { name: button, exact: true }).click(),
  ]);
  expect(response.status()).toBe(status);
}
async function errors(page, ids) {
  await expect(page.locator('#form-errors')).toBeFocused();
  await expect(page).toHaveTitle('Correct the sample form');
  await expect(page.locator('[aria-invalid="true"]')).toHaveCount(ids.length);
  for (const id of ids) {
    const input = page.locator(`#recovery-${id}`);
    await expect(input).toHaveAttribute('aria-describedby', `recovery-${id}-error`);
    await expect(page.locator(`#recovery-${id}-error`)).toBeVisible();
    await page.locator(`#form-errors a[href="#recovery-${id}"]`).press('Enter');
    await expect(input).toBeFocused();
  }
}
async function journey(page, { noSession = false } = {}) {
  const url = process.env.VISUAL_ORIGIN + route + (noSession ? '?mode=no-session' : '');
  const first = await page.goto(url); expect(first.status()).toBe(200);
  await expect(page.locator('[data-form-recovery-fixture]')).toHaveText('Form recovery fixture');
  await page.getByRole('button', { name: 'Submit sample', exact: true }).click();
  await expect(page.locator('#recovery-name')).toBeFocused();
  expect(await page.locator('#recovery-name').evaluate(input => input.validity.valueMissing)).toBe(true);
  // The explicitly marked fixture button bypasses native constraints, exercising actual server validation.
  await page.locator('#recovery-email').fill('invalid');
  await page.locator('#recovery-message').fill('Synthetic retained message');
  await submit(page, 'Exercise server validation', noSession ? 422 : 303);
  await errors(page, ['name', 'email']);
  await expect(page.locator('#recovery-email')).toHaveValue('invalid');
  await expect(page.locator('#recovery-message')).toHaveValue('Synthetic retained message');
  if (!noSession) {
    const duplicate = await page.context().newPage();
    try {
      expect((await duplicate.goto(page.url())).status()).toBe(200);
      await expect(duplicate.locator('#form-errors')).toHaveCount(0);
      await expect(duplicate.locator('#recovery-message')).toHaveValue('');
    } finally { await duplicate.close(); }
  }
  await page.locator('#recovery-name').fill('Synthetic person');
  await submit(page, 'Exercise server validation', noSession ? 422 : 303);
  await errors(page, ['email']);
  await expect(page.locator('#recovery-name')).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#recovery-name')).toHaveValue('Synthetic person');
  await expect(page.locator('#recovery-email')).toHaveValue('invalid');
  await page.locator('#recovery-email').fill('person@example.test');
  await submit(page, 'Submit sample', 303);
  await expect(page.locator('[data-form-success]')).toBeVisible();
  await expect(page.locator('#form-errors')).toHaveCount(0);
  expect((await page.goto(url + (noSession ? '&' : '?') + 'errors=1')).status()).toBe(200);
  await expect(page.locator('#recovery-name')).toHaveValue('');
  await expect(page.locator('#form-errors')).toHaveCount(0);
  return { noSession, nativeValidation: true, invalidPost: noSession ? 422 : 303, repeatedFailure: 'unrelated email error retained', correction: 'accepted', oneReadRetention: noSession ? 'inline only' : 'consumed', announcementPolicy: 'native error-summary autofocus; AT output untested' };
}

for (const javaScriptEnabled of [true, false]) test(`behavior form recovery with JavaScript ${javaScriptEnabled ? 'enabled' : 'disabled'}`, async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled, viewport: info.project.use.viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
  try {
    const failures = [];
    await context.route('**/*', route => {
      if (new URL(route.request().url()).origin === process.env.VISUAL_ORIGIN) return route.continue();
      failures.push('external request'); return route.abort();
    });
    const page = await context.newPage(), problems = observe(page);
    const results = [await journey(page), await journey(page, { noSession: true })];
    const response = await page.request.post(process.env.VISUAL_ORIGIN + route, {
      form: { name: 'x', email: 'bad', message: 'x'.repeat(4000), password: 'synthetic-secret', unexpected: 'unallowlisted' }, maxRedirects: 0,
    });
    expect(response.status()).toBe(303);
    await page.goto(process.env.VISUAL_ORIGIN + response.headers().location);
    await expect(page.locator('#recovery-message')).toHaveValue('x'.repeat(2000));
    const html = await page.content(); expect(html).not.toContain('synthetic-secret'); expect(html).not.toContain('unallowlisted');
    if (!javaScriptEnabled) {
      // A privileged evaluate call can run with document JS disabled; use an actual document-script sentinel.
      await page.route('**/_form-recovery', async route => {
        const response = await route.fetch(); await route.fulfill({ response, body: (await response.text()).replace('</head>', '<script>window.__formDocumentScriptRan=true</script></head>') });
      });
      await page.goto(process.env.VISUAL_ORIGIN + route);
      expect(await page.evaluate(() => typeof window.__formDocumentScriptRan)).toBe('undefined');
    }
    expect(problems).toEqual([]); expect(failures).toEqual([]);
    await info.attach('form-recovery-journeys', { body: JSON.stringify({ javaScriptEnabled, results, boundedValue: 2000, secretAndUnknownValues: 'not retained', pageErrors: problems }), contentType: 'application/json' });
  } finally { await context.close(); }
});
