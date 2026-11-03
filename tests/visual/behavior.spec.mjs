import { chromium } from '@playwright/test';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { resolveFormAction } from '../../src/lib/form-transport.ts';
import { test, expect, prepare, settlePage, noOverflow, galleryCaptionsFit, styleguide, observe } from './helpers.mjs';
import { visualContract as contract } from './contract.mjs';
import { skipLinkJourney, fieldErrorJourney } from '../journeys/public.mjs';
import { disclosureJourney, intrinsicLayoutJourney } from '../journeys/composition.mjs';

const ticker = page => page.getByRole('region', { name: 'Synthetic partner ticker', exact: true });
test('behavior public skip link transfers keyboard focus into main', async ({ page }, info) => {
  const results = [];
  for (const route of [contract.routes.find(route => route.name === 'home'), styleguide]) {
    await prepare(page, route, page.visualProblems);
    const next = route.name === 'home' ? page.locator('main a[href="/posts/welcome"]') : page.getByRole('button', { name: 'Native button', exact: true });
    results.push({ route: route.path, ...await skipLinkJourney(page, next) });
  }
  await info.attach('public-keyboard-journeys', { body: JSON.stringify(results), contentType: 'application/json' });
});

test('behavior field labels and errors resolve and summary activation focuses the field', async ({ page }, info) => {
  await prepare(page, styleguide, page.visualProblems);
  await info.attach('field-error-journey', { body: JSON.stringify(await fieldErrorJourney(page)), contentType: 'application/json' });
});
async function assertSeam(root, rtl = false) {
  const result = await root.evaluate((element, rtl) => {
    const groups = [...element.querySelectorAll('ul')];
    const animations = groups.map(group => group.getAnimations()[0]);
    if (animations.some(animation => !animation)) throw new Error('Expected two actual CSS animations');
    return [0, .5, .999].map(phase => {
      animations.forEach(animation => { animation.pause(); animation.currentTime = Number(animation.effect.getTiming().duration) * phase; });
      const [a, b] = groups.map(group => group.getBoundingClientRect());
      const viewport = element.querySelector('.logo-ticker__viewport').getBoundingClientRect();
      const visibleItems = [...element.querySelectorAll('li')].filter(item => { const r = item.getBoundingClientRect(); return Math.min(r.right, viewport.right) - Math.max(r.left, viewport.left) > 1; }).length;
      return { phase, width: a.width, duplicateWidth: b.width, seam: Math.abs(rtl ? a.left - b.right : a.right - b.left), viewport: viewport.width, coverageStart: Math.min(a.left, b.left) - viewport.left, coverageEnd: Math.max(a.right, b.right) - viewport.right, visibleItems };
    });
  }, rtl);
  for (const frame of result) {
    // Transformed DOMRects can differ by ~0.0001px despite equal CSS widths.
    expect(frame.seam).toBeLessThan(1); expect(Math.abs(frame.width - frame.duplicateWidth)).toBeLessThan(.01); expect(frame.width + .01).toBeGreaterThanOrEqual(frame.viewport);
    expect(frame.coverageStart, 'Tracks must cover viewport start').toBeLessThanOrEqual(1);
    expect(frame.coverageEnd, 'Tracks must cover viewport end').toBeGreaterThanOrEqual(-1);
    expect(frame.visibleItems, 'Actual logo content must remain visible').toBeGreaterThan(0);
  }
  return result;
}

test('behavior ticker active motion, native stop, pause, RTL seam', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await prepare(page, styleguide, page.visualProblems);
  const root = ticker(page), group = root.locator('ul').first(), toggle = root.locator('input');
  await expect(toggle).toBeChecked();
  await page.mouse.move(0, 0);
  const start = await group.evaluate(element => getComputedStyle(element).transform);
  await expect.poll(() => group.evaluate(element => getComputedStyle(element).transform)).not.toBe(start);
  await root.hover();
  await expect.poll(() => group.evaluate(element => getComputedStyle(element).animationPlayState)).toBe('paused');
  await page.mouse.move(0, 0);
  await toggle.press('Space');
  await expect(toggle).not.toBeChecked();
  await expect(root.locator('ul[aria-hidden]')).toBeHidden();
  await toggle.press('Space');
  await expect.poll(() => group.evaluate(element => getComputedStyle(element).animationPlayState)).toBe('paused');
  await toggle.press('Tab');
  await expect.poll(() => group.evaluate(element => getComputedStyle(element).animationPlayState)).toBe('running');
  const seam = await assertSeam(root);
  await expect(root).toHaveScreenshot('ticker-active.png', { animations: 'allow' });
  const rtl = page.getByRole('region', { name: 'Single static RTL logo' });
  await rtl.locator('input').check();
  const rtlSeam = await assertSeam(rtl, true);
  await expect(rtl).toHaveScreenshot('ticker-rtl.png', { animations: 'allow' });
  await expect(root.locator('ul[aria-hidden]')).toHaveAttribute('inert', '');
  await expect(page.locator('#specimen-empty-logos-motion')).toHaveCount(0);
  await info.attach('seam-geometry', { body: JSON.stringify({ seam, rtlSeam }), contentType: 'application/json' });
});

test('behavior reduced motion and print preserve a single complete list', async ({ page }) => {
  await prepare(page, styleguide, page.visualProblems);
  const root = ticker(page);
  await expect(root.locator('input')).toBeHidden();
  await expect(root.locator('ul[aria-hidden]')).toBeHidden();
  expect(await root.locator('ul').first().evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  await expect(root).toHaveScreenshot('ticker-reduced.png');
  await page.emulateMedia({ media: 'print', reducedMotion: 'no-preference' });
  await expect(root.locator('input')).toBeHidden();
  await expect(root.locator('ul[aria-hidden]')).toBeHidden();
});

test('behavior no-JS native controls, ticker and gallery fallback', async ({ browser, page: scriptPage }, info) => {
  const instrument = async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('</head>', '<script>window.__visualDocumentScriptExecuted = true</script></head>') });
  };
  // addInitScript is privileged automation and runs even when document JS is disabled.
  await scriptPage.route('**/_styleguide', instrument);
  await scriptPage.goto(process.env.VISUAL_ORIGIN + '/_styleguide');
  expect(await scriptPage.evaluate(() => window.__visualDocumentScriptExecuted)).toBe(true);
  const context = await browser.newContext({ viewport: info.project.use.viewport, javaScriptEnabled: false, reducedMotion: 'no-preference', locale: 'en-US', timezoneId: 'UTC', colorScheme: 'light', deviceScaleFactor: 1 });
  try {
    const page = await context.newPage(), problems = observe(page);
    await context.route('**/*', route => new URL(route.request().url()).origin === process.env.VISUAL_ORIGIN ? route.continue() : route.abort());
    await prepare(page, contract.routes.find(route => route.name === 'home'), problems, { scripts: false });
    await skipLinkJourney(page, page.locator('main a[href="/posts/welcome"]'));
    const [post] = await Promise.all([page.waitForNavigation(), page.locator('main a[href="/posts/welcome"]').press('Enter')]);
    expect(post.status()).toBe(200);
    await expect(page.locator('h1')).toHaveText('Welcome');
    await page.route('**/_styleguide', instrument);
    await prepare(page, styleguide, problems, { scripts: false });
    await skipLinkJourney(page, page.getByRole('button', { name: 'Native button', exact: true }));
    await fieldErrorJourney(page);
    await disclosureJourney(page);
    await intrinsicLayoutJourney(page);
    expect(await page.evaluate(() => typeof window.__visualDocumentScriptExecuted)).toBe('undefined');
    const root = ticker(page);
    await root.locator('input').press('Space');
    await expect(root.locator('input')).not.toBeChecked();
    await expect(root.locator('ul[aria-hidden]')).toBeHidden();
    await page.getByRole('checkbox', { name: 'Check this sample', exact: true }).press('Space');
    await expect(page.getByRole('checkbox', { name: 'Check this sample', exact: true })).toBeChecked();
    await expect(page.locator('[data-photo-gallery] a[data-lightbox]').first()).toHaveAttribute('href', /_astro\//);
    await noOverflow(page);
    await expect(page).toHaveScreenshot('styleguide-no-js.png', { fullPage: true });
    const [navigation] = await Promise.all([page.waitForNavigation(), page.locator('[data-photo-gallery] a[data-lightbox]').first().press('Enter')]);
    expect(navigation.status()).toBe(200);
    expect(navigation.headers()['content-type']).toContain('image/svg+xml');
    expect(problems, 'no-JS runtime/network health').toEqual([]);
  } finally { await context.close(); }
});

test('reflow 320px with text-spacing overrides and native keyboard controls', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-390', 'One explicit narrow placement');
  await page.setViewportSize({ width: 320, height: 900 });
  await prepare(page, styleguide, page.visualProblems);
  await page.addStyleTag({ content: '* { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } p { margin-block-end: 2em !important; }' });
  await settlePage(page);
  await noOverflow(page);
  await galleryCaptionsFit(page);
  await disclosureJourney(page);
  await intrinsicLayoutJourney(page);
  await page.getByRole('combobox', { name: 'Selection' }).press('ArrowDown');
  await page.getByRole('radio', { name: 'First radio', exact: true }).press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Second radio', exact: true })).toBeChecked();
  await page.getByRole('link', { name: 'Required sample', exact: true }).press('Enter');
  await expect(page.locator('#specimen-invalid')).toBeFocused();
  await expect(page).toHaveScreenshot('text-spacing-320.png', { fullPage: true });
});

test('zoom actual Chromium page zoom at 200% and 400%', async ({}, info) => {
  test.skip(info.project.name !== 'chromium-1440', 'Separate 1280px physical viewport for actual browser zoom');
  const extension = path.resolve('tests/visual/zoom-extension');
  const context = await chromium.launchPersistentContext('', { headless: true, channel: 'chromium', viewport: { width: 1280, height: 960 }, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC', reducedMotion: 'reduce', args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  try {
    const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
    const page = await context.newPage(), problems = observe(page);
    await page.route('**/*', route => new URL(route.request().url()).origin === process.env.VISUAL_ORIGIN ? route.continue() : route.abort());
    await prepare(page, styleguide, problems);
    const measurements = [];
    for (const factor of [2, 4]) {
      const zoom = await worker.evaluate(async factor => {
        const tabs = await chrome.tabs.query({});
        const tab = tabs.find(tab => tab.url?.includes('/_styleguide'));
        if (!tab) throw new Error('Owned zoom fixture tab missing');
        await chrome.tabs.setZoom(tab.id, factor);
        return chrome.tabs.getZoom(tab.id);
      }, factor);
      expect(zoom).toBeCloseTo(factor, 8);
      await expect.poll(() => page.evaluate(() => innerWidth)).toBe(1280 / factor);
      expect(await page.evaluate(() => devicePixelRatio)).toBeCloseTo(factor, 8);
      await settlePage(page);
      const dimensions = await noOverflow(page);
      await galleryCaptionsFit(page);
      await disclosureJourney(page);
      await intrinsicLayoutJourney(page);
      measurements.push({ factor, innerWidth: await page.evaluate(() => innerWidth), dpr: await page.evaluate(() => devicePixelRatio), ...dimensions });
      await page.getByLabel('Name', { exact: true }).press('Tab');
      await expect(page.locator('#specimen-invalid')).toBeFocused();
      await expect(page).toHaveScreenshot(`zoom-${factor * 100}.png`, { fullPage: true });
    }
    await info.attach('actual-page-zoom', { body: JSON.stringify(measurements), contentType: 'application/json' });
    expect(problems, 'zoom runtime/network health').toEqual([]);
  } finally { await context.close(); }
});

test('behavior SiteShell inline script, rapid card morph, and lifecycle teardown in Chromium', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-1440', 'Run once on standard desktop viewport');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const problems = observe(page);
  const shell = readFileSync('src/layouts/SiteShell.astro', 'utf8');
  const scripts = [...shell.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)].map(m => m[1]);

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        ${scripts.map(s => `<script>${s}</script>`).join('\n')}
      </head>
      <body>
        <a id="link1" href="/posts/a/">Valid</a>
        <a id="linkOptOut" href="/posts/b/" data-astro-prefetch="false">Opt Out</a>
        <a id="linkReload" href="/posts/c/" data-astro-reload>Reload</a>
        <a id="linkAction" href="/_actions/submit">Action</a>
        <div id="cardA" class="card" data-vt-card>
          <div class="card-media">Img A</div>
          <div class="card-title">Title A</div>
        </div>
        <div id="cardB" class="card" data-vt-card>
          <div class="card-media">Img B</div>
          <div class="card-title">Title B</div>
        </div>
        <div id="articleHero" data-vt-hero-media>Article Hero Img</div>
        <div id="post-title">Article Title</div>
      </body>
    </html>
  `);

  const result = await page.evaluate(async () => {
    const cardA = document.getElementById('cardA');
    const cardB = document.getElementById('cardB');

    // 1. Rapid card morph: Navigation 1 on Card A
    const evA = new Event('astro:before-preparation');
    evA.sourceElement = cardA;
    document.dispatchEvent(evA);
    const aInitial = cardA.querySelector('.card-media').style.viewTransitionName;

    // Rapid superseding Navigation 2 on Card B
    const evB = new Event('astro:before-preparation');
    evB.sourceElement = cardB;
    document.dispatchEvent(evB);
    const aAfterB = cardA.querySelector('.card-media').style.viewTransitionName;
    const bAfterB = cardB.querySelector('.card-media').style.viewTransitionName;

    let vtStatus = 'OK';
    try {
      if (document.startViewTransition) {
        const vt = document.startViewTransition(() => {});
        await vt.ready;
      }
    } catch (err) {
      vtStatus = err.message;
    }

    // 2. Navigation abort signal teardown
    const controller = new AbortController();
    const evAbort = new Event('astro:before-preparation');
    evAbort.sourceElement = cardA;
    evAbort.signal = controller.signal;
    document.dispatchEvent(evAbort);
    const nameBeforeAbort = cardA.querySelector('.card-media').style.viewTransitionName;
    controller.abort();
    const nameAfterAbort = cardA.querySelector('.card-media').style.viewTransitionName;

    // 3. BFCache restoration (pageshow persisted: true)
    document.documentElement.setAttribute('data-vt-loading', '');
    cardA.querySelector('.card-media').style.viewTransitionName = 'hero-media';
    const pageShowEv = new Event('pageshow');
    Object.defineProperty(pageShowEv, 'persisted', { value: true });
    window.dispatchEvent(pageShowEv);
    const hasLoadingAfterBFCache = document.documentElement.hasAttribute('data-vt-loading');
    const nameAfterBFCache = cardA.querySelector('.card-media').style.viewTransitionName;

    // 4. Reverse morphing using event.from source URL
    let reverseMorphWorked = false;
    const evReverse = new Event('astro:before-preparation');
    evReverse.from = new URL('http://localhost:4321/posts/welcome/');
    evReverse.to = new URL('http://localhost:4321/');
    const mockDestDoc = document.implementation.createHTMLDocument();
    mockDestDoc.body.innerHTML = `
      <div id="destCard" class="card" data-vt-card>
        <a href="/posts/welcome/" class="card-link">Post</a>
        <div class="card-media">Card Img</div>
        <div class="card-title">Card Title</div>
      </div>
    `;
    evReverse.newDocument = mockDestDoc;
    evReverse.loader = () => Promise.resolve();
    document.dispatchEvent(evReverse);
    await evReverse.loader();
    const destCardMedia = mockDestDoc.querySelector('.card-media');
    if (destCardMedia && destCardMedia.style.viewTransitionName === 'hero-media') {
      reverseMorphWorked = true;
    }

    return {
      aInitial,
      aAfterB,
      bAfterB,
      vtStatus,
      nameBeforeAbort,
      nameAfterAbort,
      hasLoadingAfterBFCache,
      nameAfterBFCache,
      reverseMorphWorked,
    };
  });

  expect(result.aInitial).toBe('hero-media');
  expect(result.aAfterB).toBe('');
  expect(result.bAfterB).toBe('hero-media');
  expect(result.vtStatus).toBe('OK');
  expect(result.nameBeforeAbort).toBe('hero-media');
  expect(result.nameAfterAbort).toBe('');
  expect(result.hasLoadingAfterBFCache).toBe(false);
  expect(result.nameAfterBFCache).toBe('');
  expect(result.reverseMorphWorked).toBe(true);
  expect(problems).toEqual([]);
});

test('behavior Form rejects protocol-relative and control-character external destinations in Chromium', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-1440', 'Run once on standard desktop viewport');
  const problems = observe(page);
  const interceptedRequests = [];

  // Register route handler to intercept and fulfill any calls to outside.test
  await page.route('**/*', async (route) => {
    const url = route.request().url();
    if (url.includes('outside.test')) {
      interceptedRequests.push(url);
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
      return;
    }
    await route.continue();
  });

  // 1. Navigate to real HTTP fixture origin (styleguide)
  await prepare(page, styleguide, page.visualProblems);

  // 2. Positive control: prove that on this HTTP origin, Chromium strips control characters and dispatches to outside.test
  await page.evaluate(async () => {
    try {
      await fetch('/\t/outside.test/form', { method: 'POST', body: 'positive-control' });
    } catch {
      // Ignored
    }
  });

  // Verify positive control successfully triggered external request interception
  const positiveHits = interceptedRequests.filter(url => url.includes('outside.test'));
  expect(positiveHits.length).toBeGreaterThan(0);
  expect(positiveHits[0]).toContain('outside.test');

  // Reset intercepted tracker for sanitized profile checks
  interceptedRequests.length = 0;

  // 3. Test both static profiles for string and object endpoints with tab, CR, and LF evasion
  for (const staticProfile of ['static', 'static-sveltia']) {
    const stringTabAction = resolveFormAction('/\t/outside.test/form', staticProfile);
    const stringCrAction = resolveFormAction('/\r/outside.test/form', staticProfile);
    const stringLfAction = resolveFormAction('/\n/outside.test/form', staticProfile);
    const objTabAction = resolveFormAction({ endpoint: '/\t/outside.test/form' }, staticProfile);
    const objCrAction = resolveFormAction({ endpoint: '/\r/outside.test/form' }, staticProfile);
    const objLfAction = resolveFormAction({ endpoint: '/\n/outside.test/form' }, staticProfile);

    // Assert resolver output is strictly empty string
    expect(stringTabAction).toBe('');
    expect(stringCrAction).toBe('');
    expect(stringLfAction).toBe('');
    expect(objTabAction).toBe('');
    expect(objCrAction).toBe('');
    expect(objLfAction).toBe('');

    // Exercise form submission on the HTTP page with the resolved actions
    await page.evaluate(async ({ stringTabAction, objCrAction }) => {
      // Create and inspect a form configured with the resolved action
      const form = document.createElement('form');
      form.method = 'POST';
      if (stringTabAction) form.action = stringTabAction;
      document.body.appendChild(form);

      // In browser DOM, form.action resolves relative URLs against document.location
      // When stringTabAction is '', form.action resolves safely to current page, never outside.test
      const effectiveAction = form.action;
      if (effectiveAction.includes('outside.test')) {
        await fetch(effectiveAction, { method: 'POST' });
      }
      form.remove();

      // Test object endpoint resolution as well
      const formObj = document.createElement('form');
      formObj.method = 'POST';
      if (objCrAction) formObj.action = objCrAction;
      document.body.appendChild(formObj);
      if (formObj.action.includes('outside.test')) {
        await fetch(formObj.action, { method: 'POST' });
      }
      formObj.remove();
    }, { stringTabAction, objCrAction });
  }

  // Assert ZERO external requests were dispatched for all sanitized endpoints
  const leaked = interceptedRequests.filter(url => url.includes('outside.test'));
  expect(leaked).toEqual([]);
  expect(problems).toEqual([]);
});

test('behavior directional transitions, targeted replacement, and persistent element swap in Chromium', async ({ page }, info) => {
  test.skip(info.project.name !== 'chromium-1440', 'Run once on standard desktop viewport');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const problems = observe(page);

  // Navigate to built home route on the actual running visual server (renders SiteShell)
  const homeRoute = contract.routes.find((r) => r.name === 'home');
  await prepare(page, homeRoute, page.visualProblems);

  const results = await page.evaluate(async () => {
    // 1. Verify that window.__astro_swap is installed on the built route and exposes swapFunctions
    const swapApiInstalled = Boolean(
      window['__astro_swap'] &&
      typeof window['__astro_swap'].deselectScripts === 'function' &&
      typeof window['__astro_swap'].swapRootAttributes === 'function' &&
      typeof window['__astro_swap'].swapHeadElements === 'function' &&
      typeof window['__astro_swap'].saveFocus === 'function'
    );

    // 2. Set up real audio element with actual WAV data (no synthetic playback properties)
    const wav = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
    const liveAudio = document.createElement('audio');
    liveAudio.id = 'live-audio-player';
    liveAudio.setAttribute('data-astro-transition-persist', 'global-player');
    liveAudio.setAttribute('data-vt-persist', 'global-player');
    liveAudio.src = wav;
    document.body.appendChild(liveAudio);

    // Real playback: start audio and wait for canplay
    await new Promise((resolve) => {
      if (liveAudio.readyState >= 2) return resolve();
      liveAudio.oncanplay = resolve;
      setTimeout(resolve, 500);
    });
    await liveAudio.play();
    const liveAudioPlayingBeforeSwap = !liveAudio.paused && liveAudio.readyState >= 2;

    // 3. Set up targeted container in the live page for replacement
    const testContainer = document.createElement('div');
    testContainer.id = 'targeted-test-container';
    testContainer.setAttribute('data-vt-replace', '');
    testContainer.innerHTML = `
      <a id="forwardLink" href="/posts/deep/entry/">Deeper</a>
      <a id="backLinkOverride" href="/posts/deep/entry/" data-vt-direction="back">Back Override</a>
      <div id="nested-container" data-vt-replace>
        <p id="nested-content">Initial Nested Content</p>
      </div>
      <p id="main-body-text">Initial Main Content</p>
    `;
    document.body.appendChild(testContainer);

    const forwardLink = document.getElementById('forwardLink');
    const backLinkOverride = document.getElementById('backLinkOverride');

    // 4. [P4 Verification]: Navigation direction derivation
    // 4a. Ordinary push navigation going deeper
    const evPushDeeper = new Event('astro:before-preparation');
    evPushDeeper.navigationType = 'push';
    evPushDeeper.direction = 'forward';
    evPushDeeper.from = new URL(location.href);
    evPushDeeper.to = new URL('/posts/deep/entry/', location.href);
    evPushDeeper.sourceElement = forwardLink;
    document.dispatchEvent(evPushDeeper);
    const dirPushDeeper = document.documentElement.getAttribute('data-vt-direction');

    // 4b. Anchor override: push navigation where anchor specifies data-vt-direction="back"
    const evPushOverride = new Event('astro:before-preparation');
    evPushOverride.navigationType = 'push';
    evPushOverride.direction = 'forward'; // Astro router supplies forward!
    evPushOverride.from = new URL(location.href);
    evPushOverride.to = new URL('/posts/deep/entry/', location.href);
    evPushOverride.sourceElement = backLinkOverride;
    document.dispatchEvent(evPushOverride);
    const dirPushOverride = document.documentElement.getAttribute('data-vt-direction');

    // 4c. Depth comparison: push navigation moving shallower
    const evPushShallower = new Event('astro:before-preparation');
    evPushShallower.navigationType = 'push';
    evPushShallower.direction = 'forward'; // Astro router supplies forward!
    evPushShallower.from = new URL('/posts/deep/entry/', location.href);
    evPushShallower.to = new URL('/posts/', location.href);
    document.dispatchEvent(evPushShallower);
    const dirPushShallower = document.documentElement.getAttribute('data-vt-direction');

    // 4d. History traversal: popstate back traversal
    const evTraverseBack = new Event('astro:before-preparation');
    evTraverseBack.navigationType = 'traverse';
    evTraverseBack.direction = 'back';
    document.dispatchEvent(evTraverseBack);
    const dirTraverseBack = document.documentElement.getAttribute('data-vt-direction');

    // 4e. History traversal: popstate forward traversal
    const evTraverseForward = new Event('astro:before-preparation');
    evTraverseForward.navigationType = 'traverse';
    evTraverseForward.direction = 'forward';
    document.dispatchEvent(evTraverseForward);
    const dirTraverseForward = document.documentElement.getAttribute('data-vt-direction');

    // Reset direction for swap test
    const evPrepForSwap = new Event('astro:before-preparation');
    evPrepForSwap.navigationType = 'push';
    evPrepForSwap.direction = 'forward';
    evPrepForSwap.from = new URL(location.href);
    evPrepForSwap.to = new URL('/page-b', location.href);
    document.dispatchEvent(evPrepForSwap);

    // 5. [P1 & P2 & P3 Verification]: Targeted replacement swap with real media and incoming audio
    const existingStyleLinks = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'))
      .map((link) => link.outerHTML)
      .join('\n');
    const nextDoc = document.implementation.createHTMLDocument('Page B Title');
    nextDoc.documentElement.lang = 'fr';
    nextDoc.documentElement.setAttribute('data-surface', 'dark');
    nextDoc.head.innerHTML = `
      <title>Page B Title</title>
      <meta name="description" content="Page B Description" />
      <link rel="canonical" href="${location.origin}/page-b" />
      ${existingStyleLinks}
      <style id="page-style-b">.page-b-only { color: blue; }</style>
      <script>window.__b_head_script_ran = true;</script>
    `;
    nextDoc.body.innerHTML = `
      <div id="targeted-test-container" data-vt-replace>
        <div id="nested-container" data-vt-replace>
          <p id="nested-content">Replaced Nested Content</p>
        </div>
        <p id="main-body-text">Replaced Main Content</p>
        <audio id="live-audio-player" data-astro-transition-persist="global-player" data-vt-persist="global-player"></audio>
        <audio id="new-incoming-audio" controls><source src="${wav}" type="audio/wav"></audio>
        <script>window.__b_body_script_ran = true;</script>
      </div>
    `;

    let defaultSwapCalled = false;
    const evSwap = new Event('astro:before-swap');
    evSwap.newDocument = nextDoc;
    evSwap.swap = () => { defaultSwapCalled = true; };
    document.dispatchEvent(evSwap);

    const dirInNewDoc = nextDoc.documentElement.getAttribute('data-vt-direction');

    // Execute swap
    if (typeof evSwap.swap === 'function') {
      evSwap.swap();
    }

    // Inspect results after targeted swap
    const pageTitleAfterSwap = document.title;
    const metaDescAfterSwap = document.querySelector('meta[name="description"]')?.getAttribute('content');
    const canonicalAfterSwap = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    const surfaceAfterSwap = document.documentElement.getAttribute('data-surface');
    const styleBPresentAfterSwap = Boolean(document.getElementById('page-style-b'));

    const mainContentAfterSwap = document.getElementById('main-body-text')?.textContent?.trim();
    const nestedContentAfterSwap = document.getElementById('nested-content')?.textContent?.trim();

    // Persistent audio assertions (real playback, strict node identity, uninterrupted)
    const audioAfterSwap = document.getElementById('live-audio-player');
    const audioSameNode = audioAfterSwap === liveAudio;
    const audioPausedAfterSwap = audioAfterSwap ? audioAfterSwap.paused : true;
    const audioReadyStateAfterSwap = audioAfterSwap ? audioAfterSwap.readyState : 0;

    // Newly introduced incoming audio assertions (reified from DOMParser, readyState >= 2, play() succeeds)
    const newIncomingAudio = document.getElementById('new-incoming-audio');
    let newAudioPlaySucceeded = false;
    let newAudioReadyState = 0;
    if (newIncomingAudio) {
      await new Promise((resolve) => {
        if (newIncomingAudio.readyState >= 2) return resolve();
        newIncomingAudio.oncanplay = resolve;
        setTimeout(resolve, 500);
      });
      newAudioReadyState = newIncomingAudio.readyState;
      try {
        await newIncomingAudio.play();
        newAudioPlaySucceeded = !newIncomingAudio.paused;
      } catch {}
    }

    // 6. [P2/P3 Topology Verification]: Distinct incoming matches that overlap must fall back before mutation
    const tempContainerA = document.createElement('div');
    tempContainerA.id = 'topo-test-a';
    tempContainerA.innerHTML = `
      <section id="topo-first" data-vt-replace>Outgoing Sibling First</section>
      <section id="topo-second" data-vt-replace>Outgoing Sibling Second</section>
    `;
    document.body.appendChild(tempContainerA);

    const topoDocNext = document.implementation.createHTMLDocument('Topology Next');
    topoDocNext.body.innerHTML = `
      <section id="topo-first" data-vt-replace>
        <section id="topo-second" data-vt-replace>Incoming Nested Second</section>
      </section>
    `;

    let topoFallbackCalled = false;
    const evTopoSwap = new Event('astro:before-swap');
    evTopoSwap.newDocument = topoDocNext;
    evTopoSwap.swap = () => { topoFallbackCalled = true; };
    document.dispatchEvent(evTopoSwap);
    if (typeof evTopoSwap.swap === 'function') {
      evTopoSwap.swap();
    }
    tempContainerA.remove();

    // 7. BFCache teardown
    const pageShowEv = new Event('pageshow');
    Object.defineProperty(pageShowEv, 'persisted', { value: true });
    window.dispatchEvent(pageShowEv);
    const dirAfterBFCache = document.documentElement.getAttribute('data-vt-direction');

    // Cleanup test container & audio
    document.getElementById('targeted-test-container')?.remove();
    liveAudio.remove();

    return {
      swapApiInstalled,
      liveAudioPlayingBeforeSwap,
      dirPushDeeper,
      dirPushOverride,
      dirPushShallower,
      dirTraverseBack,
      dirTraverseForward,
      dirInNewDoc,
      defaultSwapCalled,
      pageTitleAfterSwap,
      metaDescAfterSwap,
      canonicalAfterSwap,
      surfaceAfterSwap,
      styleBPresentAfterSwap,
      mainContentAfterSwap,
      nestedContentAfterSwap,
      audioSameNode,
      audioPausedAfterSwap,
      audioReadyStateAfterSwap,
      newAudioReadyState,
      newAudioPlaySucceeded,
      topoFallbackCalled,
      dirAfterBFCache,
    };
  });

  // Verify swapApi installed by SiteShell
  expect(results.swapApiInstalled).toBe(true);

  // [P4] Direction assertions
  expect(results.dirPushDeeper).toBe('forward');
  expect(results.dirPushOverride).toBe('back');
  expect(results.dirPushShallower).toBe('back');
  expect(results.dirTraverseBack).toBe('back');
  expect(results.dirTraverseForward).toBe('forward');
  expect(results.dirInNewDoc).toBe('forward');

  // [P1] Targeted swap head & root synchronization
  expect(results.defaultSwapCalled).toBe(false);
  expect(results.pageTitleAfterSwap).toBe('Page B Title');
  expect(results.metaDescAfterSwap).toBe('Page B Description');
  expect(results.canonicalAfterSwap).toContain('/page-b');
  expect(results.surfaceAfterSwap).toBe('dark');
  expect(results.styleBPresentAfterSwap).toBe(true);

  // [P2] Connected-DOM real audio playback & identity
  expect(results.liveAudioPlayingBeforeSwap).toBe(true);
  expect(results.audioSameNode).toBe(true);
  expect(results.audioPausedAfterSwap).toBe(false);
  expect(results.audioReadyStateAfterSwap).toBeGreaterThanOrEqual(2);

  // [P2] Newly introduced media reified & playable
  expect(results.newAudioReadyState).toBeGreaterThanOrEqual(2);
  expect(results.newAudioPlaySucceeded).toBe(true);

  // [P3] Topology check: overlapping incoming targets trigger safe fallback before mutation
  expect(results.topoFallbackCalled).toBe(true);

  // Nested target preservation
  expect(results.mainContentAfterSwap).toBe('Replaced Main Content');
  expect(results.nestedContentAfterSwap).toBe('Replaced Nested Content');

  // Teardown
  expect(results.dirAfterBFCache).toBe(null);

  // Reduced motion check
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotionSuppression = await page.evaluate(() => {
    function searchRules(rules) {
      for (const rule of rules) {
        if (rule.cssRules) {
          if (searchRules(rule.cssRules)) return true;
        }
        const text = rule.cssText || '';
        if (text.includes('data-vt-direction') && text.includes('animation') && text.includes('none')) {
          return true;
        }
      }
      return false;
    }
    for (const sheet of document.styleSheets) {
      try {
        if (sheet.cssRules && searchRules(sheet.cssRules)) return true;
      } catch {}
    }
    return false;
  });
  expect(reducedMotionSuppression).toBe(true);
  expect(problems).toEqual([]);
});
