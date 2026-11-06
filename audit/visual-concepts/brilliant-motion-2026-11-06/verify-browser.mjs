import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../../../package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const browser = await chromium.launch({ headless: true });
const results = [];
const url = new URL('browser-motion.html', import.meta.url).href;
try {
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(url);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(60);
    const state = () => page.evaluate(() => window.motionStudy.state);
    const steps = page.locator('.step');
    await steps.nth(2).click();
    await page.waitForTimeout(60);
    const moving = await page.evaluate(() => ({ ...window.motionStudy.state, painted: getComputedStyle(document.querySelector('.marker')).transform, destination: document.querySelector('.marker').style.transform }));
    assert.equal(moving.selected, 2);
    assert.equal(moving.activeAnimations, 1, 'normal-motion movement must actually run');
    const retarget = await page.evaluate(() => {
      const marker = document.querySelector('.marker');
      const painted = getComputedStyle(marker).transform;
      document.querySelector('[data-stage="1"]').click();
      const from = marker.getAnimations()[0].effect.getKeyframes()[0].transform;
      const markerRight = marker.getBoundingClientRect().right;
      const labelLeft = document.querySelector('.step span').getBoundingClientRect().left;
      return { painted, from, markerRight, labelLeft };
    });
    assert.equal(retarget.from, retarget.painted, 'interrupted movement must start from its painted position');
    assert.ok(retarget.markerRight < retarget.labelLeft, 'moving marker must stay outside label paint');
    await page.waitForFunction(() => window.motionStudy.state.activeAnimations === 0);
    for (const index of [0, 2, 1, 0, 2, 1]) await steps.nth(index).click();
    await page.waitForFunction(() => window.motionStudy.state.activeAnimations === 0);
    assert.equal((await state()).selected, 1);
    assert.equal(await page.locator('.step[aria-pressed="true"]').count(), 1);
    await steps.nth(0).focus();
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    assert.equal((await state()).selected, 1);
    const keyboardFocus = await page.evaluate(() => ({ stage: document.activeElement.dataset.stage, outline: getComputedStyle(document.activeElement).outlineStyle }));
    assert.equal(keyboardFocus.stage, '1');
    assert.equal(keyboardFocus.outline, 'solid');
    await page.locator('#replay').click();
    await page.waitForTimeout(120);
    await page.locator('#stop').click();
    await page.waitForTimeout(1650);
    assert.deepEqual({selected:(await state()).selected,timers:(await state()).pendingTimers,running:(await state()).running}, {selected:0,timers:0,running:false});
    for (let i = 0; i < 3; i++) await page.locator('#replay').click();
    await steps.nth(2).click();
    await page.waitForTimeout(1650);
    const interrupted = await state();
    assert.equal(interrupted.selected, 2);
    assert.equal(interrupted.pendingTimers, 0);
    assert.equal(interrupted.running, false);
    await page.locator('#long-copy').click();
    const longCopy = await page.evaluate(() => ({ width: innerWidth, documentWidth: document.documentElement.scrollWidth, description: document.querySelector('#description').textContent, controlsBottom: document.querySelector('.controls').getBoundingClientRect().bottom, state: window.motionStudy.state }));
    assert.ok(longCopy.documentWidth <= width);
    assert.equal(longCopy.state.selected, 2);
    assert.equal(longCopy.state.expanded, true);
    await page.screenshot({ path: fileURLToPath(new URL(`browser-${width}.png`, import.meta.url)), fullPage: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => window.motionStudy.state.reduced);
    await page.locator('#replay').click();
    const reduced = await state();
    assert.equal(reduced.selected, 2);
    assert.equal(reduced.pendingTimers, 0);
    assert.equal(reduced.activeAnimations, 0);
    for (const index of [0, 1, 2]) {
      await steps.nth(index).click();
      assert.equal((await state()).selected, index);
      assert.equal((await state()).activeAnimations, 0);
    }
    if (width === 390) {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.locator('#replay').click();
      await page.waitForTimeout(1700);
      assert.equal((await state()).selected, 1);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForTimeout(300);
      assert.equal((await state()).pendingTimers, 0);
      assert.equal((await state()).activeAnimations, 0);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.locator('#replay').click();
      await page.waitForTimeout(6300);
      assert.deepEqual({selected:(await state()).selected,timers:(await state()).pendingTimers,running:(await state()).running}, {selected:2,timers:0,running:false});
    }
    assert.deepEqual(errors, []);
    results.push({ width, moving, retarget, interrupted, keyboardFocus, longCopy, reduced, errors, passed: true });
    await page.close();
  }
  const noScript = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noScript.goto(url);
  assert.match(await noScript.locator('h1').innerText(), /Start with the brief/);
  assert.equal(await noScript.locator('noscript').isVisible(), true);
  assert.ok(await noScript.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  results.push({ javaScriptDisabled: true, contentVisible: true, overflow: false });
  await noScript.close();
  await writeFile(new URL('browser-checks.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify({ passed: true, widths: [390,768,1440], cases: results.length }));
} finally {
  await browser.close();
}
