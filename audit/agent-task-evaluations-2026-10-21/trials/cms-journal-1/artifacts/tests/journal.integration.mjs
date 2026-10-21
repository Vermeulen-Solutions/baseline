// Opt-in acceptance against this site's disposable CMS:
// JOURNAL_TEST_URL=http://127.0.0.1:<port> node tests/journal.integration.mjs
import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const origin = process.env.JOURNAL_TEST_URL;
if (!origin || !['127.0.0.1', 'localhost'].includes(new URL(origin).hostname)) {
  throw new Error('Set JOURNAL_TEST_URL to the authorized disposable loopback CMS.');
}
const browser = await chromium.launch();
const evidence = new URL('../../evidence/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
mkdirSync(evidence, {recursive: true});
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  for (const width of [1440, 390]) {
    await page.setViewportSize({width, height: 900});
    for (const [path, title] of [
      ['/journal/', 'Journal'],
      ['/journal/planning-your-first-workshop/', 'Planning your first workshop'],
      ['/posts', 'Posts'],
      ['/posts/planning-your-first-workshop', 'Planning your first workshop'],
    ]) {
      const response = await page.goto(origin + path);
      assert.equal(response.status(), 200, path);
      assert.equal(await page.locator('main h1').innerText(), title);
      assert.equal(await page.locator('nav a[href="/journal/"]').count(), 1);
      assert.ok(!(await page.locator('body').innerText()).includes('Unannounced workshop'));
      assert.equal(await page.locator('[contenteditable]').count(), 0);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth), `Overflow: ${path} at ${width}`);
      if(path.startsWith('/journal/')) {
        assert.ok((await page.locator('main').innerText()).includes('Make the first conversation useful.'));
        if(path.includes('planning-')) assert.ok((await page.locator('main [data-editorial-content]').innerText()).includes('Start with a clear purpose and a manageable group.'));
        await page.screenshot({path: `${evidence}${title==='Journal'?'journal-index':'journal-article'}-${width}.png`, fullPage: true});
      }
    }
  }
  for(const path of ['/journal/unannounced-workshop/', '/journal/does-not-exist/']) {
    const response = await page.goto(origin + path);
    assert.equal(response.status(), 404, path);
    assert.equal(await page.locator('main h1').innerText(), 'Page not found');
    assert.ok(!(await page.content()).includes('Unannounced workshop'));
  }
  console.log('PASS: Journal published content, excerpt, rich text, draft/missing 404, navigation, existing Posts URLs, anonymous editor isolation, 390/1440 reflow.');
} finally { await browser.close(); }
