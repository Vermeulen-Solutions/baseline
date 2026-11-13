import { test, expect, prepare } from './helpers.mjs';
import { visualContract as contract } from './contract.mjs';

const home = contract.routes.find(route => route.name === 'home');
// A compact header that loses about 24px at every width (the nav wraps on phones, so the padding
// carries the change there): less than the shell's 72px hysteresis band, more than the 16px paint
// threshold, so the same rule keyed to data-scrolled is the known flip defect.
const shrink = state => `[data-sticky-header][${state}] .site-nav { min-block-size: 2.5rem; padding-block: 0; }`;

async function tallPage(page, css) {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await prepare(page, home, page.visualProblems);
  await page.addStyleTag({ content: `[data-sticky-header], [data-sticky-header] * { transition: none !important; } ${css}` });
  await page.evaluate(() => document.querySelector('main').insertAdjacentHTML('beforeend', '<div data-test-spacer style="block-size:300vh"></div>'));
}

// Scroll from the top to `y`, let the scroll event and scroll anchoring settle, then count every
// state-attribute change on the header across `frames` animation frames at rest.
function sampleAtRest(page, y, frames = 30) {
  return page.evaluate(async ({ y, frames }) => {
    const header = document.querySelector('[data-sticky-header]');
    const frame = () => new Promise(resolve => requestAnimationFrame(resolve));
    // Instant scrolls, then wait until scroll anchoring has stopped moving the page.
    const rest = async top => {
      scrollTo({ top, behavior: 'instant' });
      for (let still = 0, last = -1, i = 0; still < 4 && i < 120; i++) { await frame(); still = scrollY === last ? still + 1 : 0; last = scrollY; }
    };
    await rest(0);
    const expandedHeight = header.getBoundingClientRect().height;
    await rest(y);
    let flips = 0;
    const observer = new MutationObserver(records => { flips += records.length; });
    observer.observe(header, { attributes: true, attributeFilter: ['data-scrolled', 'data-compact'] });
    const heights = new Set(), positions = new Set();
    for (let i = 0; i < frames; i++) {
      await frame();
      heights.add(Math.round(header.getBoundingClientRect().height));
      positions.add(Math.round(scrollY));
    }
    flips += observer.takeRecords().length;
    observer.disconnect();
    return { y, flips, heights: [...heights], positions: [...positions], expandedHeight, top: header.getBoundingClientRect().top,
      scrolled: header.hasAttribute('data-scrolled'), compact: header.hasAttribute('data-compact') };
  }, { y, frames });
}

test('behavior sticky header rests without state flips just past either threshold', async ({ page }, info) => {
  test.setTimeout(180000);
  await tallPage(page, shrink('data-compact'));
  const results = [];
  // Every pixel on the desktop viewport, where a compacting header was seen to flip; every third
  // pixel on the others to keep the local suite inside its time budget.
  const step = info.project.name === 'chromium-1440' ? 1 : 3;
  // Old single threshold: 16px. Rest at threshold+1..+30.
  for (let y = 17; y <= 46; y += step) {
    const sample = await sampleAtRest(page, y);
    results.push(sample);
    expect(sample.flips, `state flips at rest ${y}px: ${JSON.stringify(sample)}`).toBe(0);
    expect(sample.scrolled, `paint state at ${y}px`).toBe(true);
    expect(sample.compact, `size state must wait for its own threshold at ${y}px`).toBe(false);
    expect(sample.heights, `header height must not change at ${y}px`).toHaveLength(1);
    expect(sample.top, 'header stays stuck to the viewport').toBe(0);
  }
  // Compact threshold: 96px. Rest at threshold+1..+30; scroll anchoring pulls scrollY back by the
  // height change, which must stay inside the hysteresis band.
  for (let y = 97; y <= 126; y += step) {
    const sample = await sampleAtRest(page, y);
    results.push(sample);
    expect(sample.flips, `state flips at rest ${y}px: ${JSON.stringify(sample)}`).toBe(0);
    expect(sample.compact, `compact at ${y}px`).toBe(true);
    expect(sample.heights, `header height must settle at ${y}px`).toHaveLength(1);
    expect(sample.expandedHeight - sample.heights[0], 'the compact header really is shorter').toBeGreaterThanOrEqual(16);
  }
  await info.attach('sticky-header-rest-samples', { body: JSON.stringify(results), contentType: 'application/json' });
});

test('behavior sticky header compacts and expands once each way, honours overrides and reloads', async ({ page }) => {
  await tallPage(page, shrink('data-compact'));
  const header = page.locator('[data-sticky-header]');
  const settle = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(resolve)))));
  await page.evaluate(() => {
    window.__compactChanges = 0;
    new MutationObserver(records => { window.__compactChanges += records.length; })
      .observe(document.querySelector('[data-sticky-header]'), { attributes: true, attributeFilter: ['data-compact'] });
  });
  // Real wheel input in small steps, down past the compact threshold and back to the top.
  await page.mouse.move(400, 400);
  for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 40); await settle(); }
  await expect(header).toHaveAttribute('data-compact', '');
  expect(await page.evaluate(() => window.__compactChanges), 'one compaction on the way down').toBe(1);
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, -40); await settle(); }
  await expect(header).not.toHaveAttribute('data-compact');
  await expect(header).not.toHaveAttribute('data-scrolled');
  expect(await page.evaluate(() => window.__compactChanges), 'one expansion on the way up').toBe(2);

  // Inside the band the previous state is kept in both directions.
  const at = async y => { await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await settle(); return page.evaluate(() => document.querySelector('[data-sticky-header]').hasAttribute('data-compact')); };
  expect(await at(60)).toBe(false);
  expect(await at(140)).toBe(true);
  expect(await at(60)).toBe(true);
  expect(await at(10)).toBe(false);

  // Per-header thresholds for a header whose height change needs a wider band.
  await header.evaluate(element => { element.setAttribute('data-compact-after', '300'); element.setAttribute('data-expand-below', '180'); });
  expect(await at(200)).toBe(false);
  expect(await at(320)).toBe(true);
  expect(await at(200)).toBe(true);
  expect(await at(170)).toBe(false);
  // Unusable values fall back to the defaults: an expansion offset at or above compaction would leave no band.
  await header.evaluate(element => { element.setAttribute('data-compact-after', 'soon'); element.setAttribute('data-expand-below', '500'); });
  expect(await at(120)).toBe(true);
  expect(await at(60)).toBe(true);
  expect(await at(0)).toBe(false);

  // A persisted page restore re-reads the scroll position.
  await page.evaluate(() => scrollTo({ top: 400, behavior: 'instant' }));
  await settle();
  await header.evaluate(element => { element.removeAttribute('data-compact'); element.removeAttribute('data-scrolled'); });
  await page.evaluate(() => { const event = new Event('pageshow'); Object.defineProperty(event, 'persisted', { value: true }); window.dispatchEvent(event); });
  await expect(header).toHaveAttribute('data-compact', '');
  await expect(header).toHaveAttribute('data-scrolled', '');
});

test('behavior sticky header probe catches a size change keyed to data-scrolled', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-1440', 'One control run on the desktop viewport');
  test.setTimeout(120000);
  await tallPage(page, shrink('data-scrolled'));
  const samples = [];
  for (const y of [18, 22, 26, 30, 34, 38]) samples.push(await sampleAtRest(page, y));
  await info.attach('sticky-header-defect-samples', { body: JSON.stringify(samples), contentType: 'application/json' });
  const flipping = samples.filter(sample => sample.flips > 0);
  expect(flipping.length, `the probe must reproduce the single-threshold flip: ${JSON.stringify(samples.map(sample => [sample.y, sample.flips]))}`).toBeGreaterThan(0);
});
