import { chromium } from '@playwright/test';
import fs from 'node:fs';
const browser = await chromium.launch();
const page = await browser.newPage();
const base = 'http://127.0.0.1:4373';
const results = [];
const errors = [];
page.on('pageerror', error => errors.push(error.message));
for (const width of [320, 390, 768, 1440]) {
  await page.setViewportSize({ width, height: 1000 });
  for (const route of ['/', '/services/', '/about/', '/contact/']) {
    const response = await page.goto(base + route);
    await page.evaluate(() => document.fonts.ready);
    const observation = await page.evaluate(() => ({
      title: document.title,
      heading: document.querySelector('h1')?.textContent,
      h1s: document.querySelectorAll('h1').length,
      overflow: document.documentElement.scrollWidth > innerWidth,
      action: [...document.querySelectorAll('a.primary-action')].map(a => ({ text: a.textContent, href: a.getAttribute('href'), height: a.getBoundingClientRect().height })),
      current: document.querySelector('[aria-current="page"]')?.textContent,
      forms: document.querySelectorAll('form').length,
      scripts: document.querySelectorAll('script[src]').length,
      bodyFont: getComputedStyle(document.body).fontFamily,
      displayFont: getComputedStyle(document.querySelector('h1')).fontFamily,
    }));
    results.push({ route, width, status: response.status(), ...observation });
    if (response.status() !== 200 || observation.h1s !== 1 || observation.overflow || observation.forms || observation.scripts || observation.action[0]?.href !== 'mailto:hello@northline.example.test') throw new Error(JSON.stringify(results.at(-1)));
    if ([390, 1440].includes(width)) await page.screenshot({ path: `audit/${route === '/' ? 'home' : route.split('/')[1]}-${width}.png`, fullPage: true });
  }
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(base + '/');
await page.keyboard.press('Tab');
const skipFocused = await page.locator('.skip-link').evaluate(a => a === document.activeElement);
await page.screenshot({ path: 'audit/keyboard-focus.png' });
await page.keyboard.press('Enter');
const skipReachedMain = await page.locator('main').evaluate(a => a === document.activeElement);
const keyboard = [];
for (let i = 0; i < 10; i++) {
  await page.keyboard.press('Tab');
  keyboard.push(await page.evaluate(() => ({ tag: document.activeElement?.tagName, label: document.activeElement?.textContent, outline: getComputedStyle(document.activeElement).outlineStyle })));
}

if (!skipFocused || !skipReachedMain || keyboard.some(item => item.tag === 'A' && item.outline === 'none')) throw new Error('Keyboard focus failure');
await page.emulateMedia({ reducedMotion: 'reduce' });
const reducedMotion = await page.evaluate(() => ({ preference: matchMedia('(prefers-reduced-motion: reduce)').matches, scroll: getComputedStyle(document.documentElement).scrollBehavior }));
const reflow = [];
for (const route of ['/', '/services/', '/about/', '/contact/']) {
  await page.goto(base + route);
  await page.addStyleTag({ content: 'html { font-size: 200%; } p, li, a, dt, dd { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-block-end: 2em !important; }' });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  reflow.push({ route, rootFont: await page.evaluate(() => getComputedStyle(document.documentElement).fontSize), overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) });
}
console.log(JSON.stringify(reflow));
if (reflow.some(item => item.overflow)) throw new Error('Text resize/spacing overflow');
const statuses = {};
for (const route of ['/', '/services/', '/about/', '/contact/', '/_styleguide/', '/posts/', '/missing/']) statuses[route] = (await page.goto(base + route)).status();
const output = { results, skipFocused, skipReachedMain, keyboard, reducedMotion, reflow, statuses, errors, note: 'Text size and narrow CSS viewport checked; actual browser zoom and assistive technology not tested. Email href checked; no message sent.' };
fs.writeFileSync('audit/browser-review.json', JSON.stringify(output, null, 2));
console.log(JSON.stringify({ pages: results.length, statuses, skipFocused, skipReachedMain, reducedMotion, reflow, errors }, null, 2));
await browser.close();
