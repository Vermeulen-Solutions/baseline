import { expect } from '@playwright/test';
import { focusVisible } from './public.mjs';
import { contrastRatio } from '../../scripts/design-system.mjs';

export async function disclosureJourney(page) {
  const details = page.locator('#specimen-disclosure');
  const summary = details.locator(':scope > summary');
  const bodyLink = page.locator('#disclosure-body-link');
  await expect(summary).toHaveAccessibleName('How does this optional explanation work?');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(bodyLink).toBeHidden();
  await summary.press('Tab');
  await expect(page.locator('#disclosure-after-link')).toBeFocused();
  // Native keyboard pacing allows toggle layout/scroll anchoring to settle;
  // this also works with document JavaScript disabled. No focus/scroll repair.
  await summary.press('Enter', { delay: 50 });
  await expect(details).toHaveAttribute('open', '');
  await expect(bodyLink).toBeVisible();
  await focusVisible(summary);
  await summary.press('Tab', { delay: 50 });
  await focusVisible(bodyLink);
  await bodyLink.press('Shift+Tab');
  await expect(summary).toBeFocused();
  await summary.press('Space');
  await expect(details).not.toHaveAttribute('open', '');
  await expect(bodyLink).toBeHidden();

  await summary.press('Enter');
  const a = page.locator('#disclosure-group-a'), b = page.locator('#disclosure-group-b');
  await a.locator('summary').press('Enter');
  await b.locator('summary').press('Space');
  await expect(a).not.toHaveAttribute('open', '');
  await expect(b).toHaveAttribute('open', '');
  await expect(details).toHaveAttribute('open', '');
  await b.locator('summary').press('Space');
  await summary.press('Space');

  const dark = page.locator('#disclosure-dark');
  await dark.locator('summary').press('Enter');
  await focusVisible(dark.locator('summary'));
  const colors = await dark.evaluate(element => ({
    text: getComputedStyle(element.querySelector('a')).color,
    surface: getComputedStyle(element).backgroundColor,
  }));
  const linkContrast = contrastRatio(colors.text, colors.surface);
  expect(linkContrast, JSON.stringify(colors)).toBeGreaterThanOrEqual(4.5);
  expect(await dark.evaluate(element => ({
    marker: getComputedStyle(element.querySelector('summary')).display,
    ownState: !element.querySelector('summary').hasAttribute('aria-expanded') || element.querySelector('summary').getAttribute('aria-expanded') === String(element.open),
    dark: getComputedStyle(element).backgroundColor !== getComputedStyle(document.querySelector('#specimen-disclosure')).backgroundColor,
    overflow: element.scrollWidth > element.clientWidth + 1,
  }))).toEqual({ marker: 'list-item', ownState: true, dark: true, overflow: false });
  await dark.locator('summary').press('Space');

  // This is real fragment navigation, not a synthetic beforematch/toggle event.
  await page.locator('#disclosure-after-link').press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await expect(page.locator('#disclosure-reveal-target')).toBeVisible();
  await summary.press('Space');
  return { enter: 'open', space: 'close', focus: 'native summary/body tab order', closedLink: 'skipped', exclusiveGroup: 'native name', independent: true, longDarkSummary: 'visible focus/no overflow/native marker', linkContrast, fragment: 'native reveal', toolbarFind: 'manual check pending' };
}

export async function intrinsicLayoutJourney(page) {
  const geometry = await page.evaluate(() => {
    const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, bottom: r.bottom }; };
    return Object.fromEntries(['specimen-sidebar-wide', 'specimen-sidebar-narrow', 'specimen-sidebar-single', 'specimen-cluster'].map(id => {
      const root = document.getElementById(id);
      return [id, { root: rect(root), direction: getComputedStyle(root).direction,
        scroll: root.scrollWidth, client: root.clientWidth,
        children: [...root.children].map(element => ({ ...rect(element), order: getComputedStyle(element).order, scroll: element.scrollWidth, client: element.clientWidth })) }];
    }));
  });
  for (const [id, item] of Object.entries(geometry)) {
    expect(item.scroll, id).toBeLessThanOrEqual(item.client + 1);
    for (const child of item.children) {
      expect(child.order, id).toBe('0');
      expect(child.scroll, id).toBeLessThanOrEqual(child.client + 1);
      expect(child.width, id).toBeLessThanOrEqual(item.root.width + 1);
    }
  }
  const wide = geometry['specimen-sidebar-wide'], narrow = geometry['specimen-sidebar-narrow'];
  const [main, supporting] = wide.children;
  if (Math.abs(main.y - supporting.y) < 1) expect(main.width / wide.root.width).toBeGreaterThanOrEqual(.6 - .002);
  const viewport = await page.evaluate(() => innerWidth);
  if (viewport >= 1200) expect(Math.abs(main.y - supporting.y)).toBeLessThan(1);
  if (viewport <= 390) expect(supporting.y).toBeGreaterThanOrEqual(main.bottom);
  expect(narrow.direction).toBe('rtl');
  expect(narrow.children[1].y).toBeGreaterThanOrEqual(narrow.children[0].bottom);
  const single = geometry['specimen-sidebar-single'];
  expect(Math.abs(single.children[0].width - single.root.width)).toBeLessThan(1);
  await page.locator('#specimen-sidebar-narrow > :first-child a').press('Tab');
  await focusVisible(page.locator('#specimen-sidebar-narrow > :nth-child(2) a'));
  return { viewport, geometry, readingOrder: 'main then supporting; native RTL', narrowHost: 'wrapped', optionalSupporting: 'full-width main' };
}
