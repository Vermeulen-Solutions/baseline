#!/usr/bin/env node
/**
 * Maintainer-only local headless Chromium rehearsal for the optional SearchDialog.
 *
 *   node scripts/rehearse-search.mjs --site <generated static project> [--out <evidence dir>]
 *
 * The site must already be generated, installed with an exact pagefind
 * devDependency, configured with baselineFeatures({ search }) and mount
 * <SearchDialog slashShortcut /> plus <Announcer /> in its layout, with these
 * synthetic pages: /greenhouse/ (en, escaped hostile markup text), /members/
 * (robots noindex, word "quokkaberry"), /fr/ (lang fr, word "jardin", textarea
 * and contenteditable). It rebuilds the site, probes the missing-index state,
 * indexes it, then probes real results. Never runs in CI.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from '@playwright/test';

if (process.env.CI || process.env.GITHUB_ACTIONS === 'true') throw new Error('Search browser rehearsal is local-only.');
const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const site = path.resolve(arg('--site') || fail('--site <generated project> is required'));
const out = path.resolve(arg('--out') || path.join(site, '.search-rehearsal'));
function fail(message) { throw new Error(message); }
fs.mkdirSync(out, { recursive: true });

const npm = (...args) => {
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { cwd: site, encoding: 'utf8', shell: process.platform === 'win32', env: { ...process.env, SITE_URL: process.env.SITE_URL || 'https://search-rehearsal.example' } });
  if (result.status !== 0) fail(`npm ${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
};

npm('run', 'build');
const dist = path.join(site, 'dist');
const config = JSON.parse(fs.readFileSync(path.join(dist, '.baseline-search.json'), 'utf8'));
const base = config.base === '/' ? '' : config.base;
const bundleSegment = `${base}/${config.bundlePath}/`;

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.xml': 'application/xml' };
const server = http.createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);
  if (base && !(pathname === base || pathname.startsWith(base + '/'))) { response.writeHead(404).end('outside base'); return; }
  pathname = pathname.slice(base.length) || '/';
  let file = path.join(dist, pathname);
  if (!file.startsWith(dist)) { response.writeHead(403).end(); return; }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { response.writeHead(404, { 'content-type': 'text/html' }).end('<!doctype html><title>404</title>'); return; }
  response.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const route = p => origin + base + p;

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: Boolean(ok), detail }); if (!ok) console.error(`FAIL ${name} ${detail}`); };
const browser = await chromium.launch({ channel: 'chromium', headless: true });
const errors = [];
const page_ = async (options = {}) => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...options });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error' && !/404|Failed to load|Failed to fetch dynamically imported module/.test(message.text())) errors.push(`console: ${message.text()}`); });
  return { context, page };
};
const state = page => page.locator('[data-search-root]').getAttribute('data-search-state');
const waitState = async (page, values) => {
  try { await page.waitForFunction(v => v.includes(document.querySelector('[data-search-root]')?.getAttribute('data-search-state')), values, { timeout: 8000 }); }
  catch (error) { throw new Error(`Expected search state ${values.join('|')}; observed ${await page.evaluate(() => JSON.stringify({ state: document.querySelector('[data-search-root]')?.getAttribute('data-search-state'), status: document.querySelector('[data-search-status]')?.textContent, links: [...document.querySelectorAll('[data-search-results] a')].map(a => a.pathname) }))}`); }
};
const dialogOpen = page => page.evaluate(() => Boolean(document.querySelector('dialog[data-search-dialog]')?.open));
const active = page => page.evaluate(() => { const el = document.activeElement; return el ? (el.getAttribute('data-search-input') !== null ? 'input' : el.getAttribute('data-search-trigger') !== null ? 'trigger' : el.tagName + (el.id ? '#' + el.id : '')) : null; });

try {
  // 1. Missing index: configuration without readiness.
  {
    const { context, page } = await page_();
    await page.goto(route('/'));
    await page.getByRole('button', { name: 'Search' }).click();
    check('dialog opens from trigger', await dialogOpen(page));
    check('focus moves into search input', await active(page) === 'input');
    await page.keyboard.type('greenhouse');
    await waitState(page, ['unavailable']);
    check('missing index shows accessible explanation', /not available yet/.test(await page.locator('[data-search-status]').textContent()));
    await page.keyboard.press('Escape');
    check('Escape closes', !(await dialogOpen(page)));
    check('focus returns to trigger', await active(page) === 'trigger');
    await context.close();
  }

  // 1b. Light dismiss: native closedby, then the fallback with native support removed.
  for (const [name, withoutNative] of [['native closedby', false], ['fallback without closedBy', true]]) {
    const { context, page } = await page_();
    if (withoutNative) await page.addInitScript(() => { delete HTMLDialogElement.prototype.closedBy; });
    await page.goto(route('/'));
    if (withoutNative) await page.evaluate(() => document.querySelector('dialog[data-search-dialog]').removeAttribute('closedby'));
    const open = async () => {
      await page.getByRole('button', { name: 'Search' }).click();
      await page.locator('[data-search-input]').fill('greenhouse');
    };
    await open();
    await page.locator('.search__title').click();
    check(`${name}: clicking inside keeps the dialog open`, await dialogOpen(page));
    const input = await page.locator('[data-search-input]').boundingBox();
    const box = await page.locator('dialog[data-search-dialog]').boundingBox();
    const y = input.y + input.height / 2;
    await page.mouse.move(input.x + 20, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width + 40, y, { steps: 8 });
    await page.mouse.up();
    check(`${name}: selection drag onto the backdrop keeps the dialog open`, await dialogOpen(page));
    await page.mouse.click(10, 10);
    await page.waitForFunction(() => !document.querySelector('dialog[data-search-dialog]')?.open);
    check(`${name}: backdrop click closes`, !(await dialogOpen(page)));
    check(`${name}: focus returns to trigger`, await active(page) === 'trigger');
    await context.close();
  }

  const receipt = JSON.parse(npm('run', '--silent', 'search:index', '--', '--json'));
  check('index receipt distinguishes readiness', receipt.kind === 'search-index' && receipt.pages >= 3, JSON.stringify({ pages: receipt.pages, languages: receipt.languages }));
  check('noindex page excluded', receipt.excluded.some(e => e.route === '/members/' && e.reason === 'noindex'));
  check('bundle URL follows base and bundlePath', receipt.bundleUrl === bundleSegment, receipt.bundleUrl);

  // 2. Real results.
  {
    const { context, page } = await page_();
    const bundleRequests = [];
    page.on('request', request => { if (request.url().includes(bundleSegment)) bundleRequests.push(request.url()); });
    await page.goto(route('/'));
    await page.waitForTimeout(300);
    check('no bundle request on initial load', bundleRequests.length === 0, bundleRequests.join(','));
    await page.locator('main a').first().focus();
    const invoker = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80));
    await page.keyboard.press('Control+k');
    check('Ctrl+K opens dialog', await dialogOpen(page));
    check('bundle fetched lazily after open', bundleRequests.length > 0);
    await page.keyboard.type('greenhouse');
    await waitState(page, ['results']);
    const hrefs = await page.locator('[data-search-results] a').evaluateAll(links => links.map(a => a.href));
    check('result URL keeps base path', hrefs.includes(route('/greenhouse/')), hrefs.join(','));
    const status = await page.locator('[data-search-status]').textContent();
    await page.waitForTimeout(50);
    const announced = await page.locator('#site-announcer [data-announcer-polite]').textContent();
    check('result count announced via Announcer', announced === status && /result/.test(status), `${status} | ${announced}`);
    check('Cmd+K also handled', await page.evaluate(() => { const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true, cancelable: true }); document.dispatchEvent(e); return e.defaultPrevented; }));
    await page.keyboard.press('Escape');
    check('focus restored to invoking link', await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 80)) === invoker);

    // Hostile text stays inert.
    await page.keyboard.press('Control+k');
    await page.locator('[data-search-input]').fill('onerror');
    await waitState(page, ['results']);
    const inert = await page.evaluate(() => ({ pwned: 'pwned' in window || '__pwned' in window, imgs: document.querySelectorAll('[data-search-results] img, [data-search-results] script').length, marks: document.querySelectorAll('[data-search-results] mark').length, text: document.querySelector('[data-search-results]')?.textContent }));
    check('indexed markup rendered as text only', !inert.pwned && inert.imgs === 0 && inert.marks > 0 && inert.text.includes('<img'), JSON.stringify(inert));

    // Private content is not searchable.
    await page.locator('[data-search-input]').fill('quokkaberry');
    await waitState(page, ['empty']);
    check('noindex content absent from results', !(await page.locator('[data-search-results] a').evaluateAll(links => links.some(a => a.pathname.includes('/members')))) && await page.locator('[data-search-results] li').count() === 0);

    // Rapid query cancellation: only the final query renders.
    await page.evaluate(() => {
      const input = document.querySelector('[data-search-input]');
      for (const term of ['gr', 'greenhouse', 'orch', 'welcome', 'greenh', 'welcome']) { input.value = term; input.dispatchEvent(new Event('input', { bubbles: true })); input.form.requestSubmit(); }
    });
    await waitState(page, ['results', 'empty']);
    await page.waitForTimeout(600);
    const final = await page.evaluate(() => ({ status: document.querySelector('[data-search-status]').textContent, links: [...document.querySelectorAll('[data-search-results] a')].map(a => a.pathname) }));
    check('superseded queries never render', /welcome/.test(final.status) && !final.links.some(p => p.includes('greenhouse')), JSON.stringify(final));
    await page.keyboard.press('Escape');

    // Shortcut boundaries.
    for (const selector of ['input[aria-label="Name"]']) {
      await page.goto(route('/greenhouse/'));
      await page.locator(selector).focus();
      await page.keyboard.press('Control+k');
      await page.keyboard.press('/');
      check(`shortcuts ignored in ${selector}`, !(await dialogOpen(page)));
    }
    await page.locator('select').focus();
    await page.keyboard.press('Control+k');
    check('Ctrl+K ignored in select', !(await dialogOpen(page)));
    await page.evaluate(() => { const block = e => { if (e.key.toLowerCase() === 'k') { e.preventDefault(); document.removeEventListener('keydown', block, true); } }; document.addEventListener('keydown', block, true); });
    await page.locator('h1').click();
    await page.keyboard.press('Control+k');
    check('already-prevented event ignored', !(await dialogOpen(page)));
    const historyLength = await page.evaluate(() => history.length);
    await page.keyboard.press('/');
    check('slash opens when enabled', await dialogOpen(page));
    await page.keyboard.press('Escape');
    check('no history entries added', await page.evaluate(() => history.length) === historyLength);

    // ClientRouter: navigate via a result, repeatedly; exactly one live instance.
    await page.goto(route('/'));
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Control+k');
      await page.locator('[data-search-input]').fill(i % 2 ? 'welcome' : 'greenhouse');
      await waitState(page, ['results']);
      await page.locator('[data-search-results] a').first().click();
      await page.waitForFunction(() => !document.querySelector('dialog[data-search-dialog]')?.open && document.querySelector('[data-search-root]')?.getAttribute('data-search-enhanced') === 'true');
      await page.waitForTimeout(150);
    }
    const afterSwaps = await page.evaluate(() => ({ enhanced: document.querySelectorAll('[data-search-enhanced]').length, open: document.querySelectorAll('dialog[open]').length, url: location.pathname }));
    check('ClientRouter swaps tear down and reinitialize once', afterSwaps.enhanced === 1 && afterSwaps.open === 0, JSON.stringify(afterSwaps));
    let opened = 0;
    await page.exposeFunction('__countOpen', () => { opened++; });
    await page.evaluate(() => { const d = document.querySelector('dialog[data-search-dialog]'); const orig = d.showModal.bind(d); d.showModal = () => { window.__countOpen(); orig(); }; });
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(100);
    check('single shortcut handler after swaps', opened === 1 && await dialogOpen(page), String(opened));
    await page.keyboard.press('Escape');
    // DOM removal tears down: shortcut no longer opens a detached dialog.
    await page.evaluate(() => document.querySelector('[data-search-root]').remove());
    await page.waitForTimeout(50);
    await page.keyboard.press('Control+k');
    check('DOM removal releases shortcut', await page.evaluate(() => document.querySelectorAll('dialog[open]').length) === 0);
    await context.close();
  }

  // 3. Locale-separated index and localized copy.
  {
    const { context, page } = await page_({ locale: 'fr-FR' });
    await page.goto(route('/fr/'));
    check('localized trigger', await page.getByRole('button', { name: 'Rechercher' }).isVisible());
    await page.locator('textarea').focus();
    await page.keyboard.press('Control+k');
    check('Ctrl+K ignored in textarea', !(await dialogOpen(page)));
    await page.locator('[contenteditable]').focus();
    await page.keyboard.press('/');
    check('slash ignored in contenteditable', !(await dialogOpen(page)));
    await page.getByRole('button', { name: 'Rechercher' }).click();
    await page.keyboard.type('jardin');
    await waitState(page, ['results']);
    const fr = await page.evaluate(() => ({ status: document.querySelector('[data-search-status]').textContent, links: [...document.querySelectorAll('[data-search-results] a')].map(a => a.pathname), name: document.querySelector('dialog').getAttribute('aria-labelledby') && document.getElementById(document.querySelector('dialog').getAttribute('aria-labelledby')).textContent }));
    check('French result and localized count', fr.links.includes(`${base}/fr/`) && /résultat/.test(fr.status) && fr.name === 'Rechercher sur le site', JSON.stringify(fr));
    await page.locator('[data-search-input]').fill('greenhouse');
    await waitState(page, ['empty']);
    check('French page searches the French index only', /Aucun résultat/.test(await page.locator('[data-search-status]').textContent()));
    await page.screenshot({ path: path.join(out, 'search-fr-1280.png') });
    await context.close();
  }

  // 4. No-JS fallback, narrow viewport, dark, forced colors, RTL.
  {
    const { context, page } = await page_({ javaScriptEnabled: false });
    await page.goto(route('/'));
    const noJs = await page.evaluate(() => ({ link: document.querySelector('[data-search-fallback]')?.getAttribute('href'), linkHidden: document.querySelector('[data-search-fallback]')?.hidden, triggerVisible: !!document.querySelector('[data-search-trigger]')?.offsetParent }));
    check('no-JS shows fallback link, not a dead trigger', noJs.link === `${base}/posts/` && !noJs.linkHidden && !noJs.triggerVisible, JSON.stringify(noJs));
    await context.close();
  }
  for (const [name, options, media] of [
    ['mobile-dark', { viewport: { width: 360, height: 740 }, colorScheme: 'dark' }, {}],
    ['forced-colors', { viewport: { width: 1280, height: 900 } }, { forcedColors: 'active' }],
    ['rtl-reduced-motion', { viewport: { width: 390, height: 800 }, reducedMotion: 'reduce' }, {}],
  ]) {
    const { context, page } = await page_(options);
    await page.emulateMedia(media);
    await page.goto(route('/'));
    if (name.startsWith('rtl')) await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
    if (name.endsWith('dark')) await page.evaluate(() => { document.documentElement.dataset.surface = 'dark'; });
    await page.getByRole('button', { name: 'Search' }).click();
    await page.keyboard.type('greenhouse');
    await waitState(page, ['results']);
    const box = await page.evaluate(() => { const r = document.querySelector('dialog[data-search-dialog]').getBoundingClientRect(); return { excerpt: document.querySelector('.search__result-excerpt')?.textContent.slice(0, 40), surface: getComputedStyle(document.querySelector('dialog')).backgroundColor, left: r.left, right: r.right, vw: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth, border: getComputedStyle(document.querySelector('dialog')).borderTopStyle }; });
    check(`${name}: excerpt excludes shell chrome`, !/Skip to content/.test(box.excerpt), box.excerpt);
    check(`${name}: dialog fits viewport and is centered`, box.left >= 0 && box.right <= box.vw && Math.abs(box.left - (box.vw - box.right)) < 2 && !box.overflow && box.border === 'solid', JSON.stringify(box));
    await page.screenshot({ path: path.join(out, `search-${name}.png`) });
    await context.close();
  }
  check('zero runtime exceptions', errors.length === 0, errors.join('\n'));
} catch (error) {
  check('rehearsal completed', false, String(error?.stack || error).split('\n').slice(0, 6).join('\n'));
} finally {
  await browser.close();
  server.close();
  fs.writeFileSync(path.join(out, 'search-rehearsal.json'), JSON.stringify({ site: path.basename(site), base: config.base, bundlePath: config.bundlePath, results }, null, 2) + '\n');
}

const failed = results.filter(r => !r.ok);
console.log(`Search rehearsal: ${results.length - failed.length}/${results.length} checks passed. Evidence: ${out}`);
if (failed.length) process.exitCode = 1;
