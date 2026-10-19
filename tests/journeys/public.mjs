import { expect } from '@playwright/test';

export async function focusVisible(locator) {
  await expect(locator).toBeFocused();
  await expect.poll(() => locator.evaluate(element => {
    const rect = element.getBoundingClientRect();
    // Baseline's stretched card link delegates its visible ring to the focus parent.
    const style = getComputedStyle(element.closest('.focus-parent') ?? element);
    const x = rect.left + rect.width / 2, y = rect.top + Math.min(rect.height / 2, 16);
    const covering = document.elementFromPoint(x, y);
    return { inViewport: x >= 0 && x < innerWidth && y >= 0 && y < innerHeight,
      uncovered: covering === element || element.contains(covering),
      outline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0 };
  }), { message: 'Keyboard focus must be visible, within the viewport and unobscured' }).toEqual({ inViewport: true, uncovered: true, outline: true });
}

/** Starts on a freshly navigated document; does not repair focus with automation. */
export async function skipLinkJourney(page, mainControl) {
  const skip = page.locator('a.skip-link'), main = page.locator('main#main-content');
  await page.keyboard.press('Tab');
  await focusVisible(skip);
  await expect(skip).toHaveAttribute('href', '#main-content');
  await skip.press('Enter');
  await expect(main).toBeFocused();
  expect(await main.evaluate(element => {
    const rect = element.getBoundingClientRect();
    return rect.top >= -1 && rect.top < innerHeight && getComputedStyle(document.documentElement).scrollBehavior === 'auto';
  }), 'Skip destination and nonanimated keyboard scroll').toBe(true);
  await page.keyboard.press('Tab');
  await focusVisible(mainControl);
  return { firstTab: 'skip link', activation: 'main focused', nextTab: await mainControl.evaluate(element => element.tagName), unobscured: true, keyboardScroll: 'auto' };
}

export async function fieldErrorJourney(page) {
  const field = page.locator('#specimen-invalid');
  await expect(field).toHaveAccessibleName('Required sample');
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  const references = await field.getAttribute('aria-describedby');
  expect(references).toBeTruthy();
  for (const id of references.split(/\s+/)) {
    const error = page.locator(`[id="${id}"]`);
    await expect(error).toHaveCount(1); await expect(error).toBeVisible();
    expect((await error.textContent()).trim().length).toBeGreaterThan(0);
  }
  await page.locator('#specimen-summary a[href="#specimen-invalid"]').press('Enter');
  await focusVisible(field);
  return { label: 'resolved', errors: references.split(/\s+/), summaryLink: 'field focused' };
}

export async function reducedMotionJourney(page) {
  expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  const ticker = page.getByRole('region', { name: 'Synthetic partner ticker', exact: true });
  await expect(ticker.locator('input')).toBeHidden();
  await expect(ticker.locator('ul[aria-hidden]')).toBeHidden();
  expect(await ticker.locator('ul').first().evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  return { preference: 'reduce', ticker: 'single static list', scroll: 'auto' };
}

export async function textSpacingJourney(page, exerciseComposition) {
  const viewport = page.viewportSize();
  await page.setViewportSize({ width: 320, height: 900 });
  const style = await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-block-end: 2em !important; }' });
  try {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), '320px text-spacing reflow').toBe(true);
  await page.getByRole('combobox', { name: 'Selection', exact: true }).press('ArrowDown');
  await expect(page.getByRole('combobox', { name: 'Selection', exact: true })).toHaveValue('A much longer choice to inspect narrow layouts');
  await fieldErrorJourney(page);
  return { width: 320, spacing: '1.5/.12em/.16em/2em', overflow: false, keyboard: 'usable', ...(exerciseComposition && { composition: await exerciseComposition() }) };
  } finally {
    await style.evaluate(element => element.remove());
    await page.setViewportSize(viewport);
  }
}
