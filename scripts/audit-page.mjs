import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MAX_RESOURCES = 256;
const FONT_SELECTORS = ['h1', 'main p', 'body'];
// Refusal messages are fixed text that names the option and its rule but never echoes the
// supplied value, which may contain credentials or private paths.
class PageAuditRefusal extends Error {}
const fail = message => { throw new PageAuditRefusal(message); };
const decodedPath = url => { try { return decodeURIComponent(url.pathname); } catch { return '/_emdash/invalid-encoding'; } };
const integer = (value, fallback, min, max, name) => {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < min || Number(value) > max) fail(`--${name} must be a whole number from ${min} to ${max}`);
  return Number(value);
};

export function localPageURL(value) {
  let url;
  try { url = new URL(value); } catch { fail('--url must be an explicit http:// loopback page URL (127.0.0.1, [::1] or localhost)'); }
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]', 'localhost'].includes(url.hostname) || url.username || url.password || url.search || url.hash || /\s/.test(value)) fail('--url must use http:// on 127.0.0.1, [::1] or localhost, without credentials, query string, fragment or spaces');
  if (/^\/(?:_emdash|admin|api)(?:\/|$)/i.test(decodedPath(url))) fail('--url must be a public page, not an administrative or API endpoint (/_emdash, /admin, /api)');
  return url;
}

export function publicResourceURL(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return `${url.protocol}[omitted]`;
    url.username = ''; url.password = ''; url.search = ''; url.hash = '';
    return url.href;
  } catch { return '[invalid URL]'; }
}

export function pageRequestPolicy(value, origin, method, navigation = false) {
  let url;
  try { url = new URL(value); } catch { return 'outside-public-get-origin'; }
  if (url.origin !== origin || url.username || url.password || !['GET', 'HEAD'].includes(method)) return 'outside-public-get-origin';
  const pathname = decodedPath(url);
  const cmsEndpoint = /^\/_emdash(?:\/|$)/i.test(pathname);
  const publicMedia = /^\/_emdash\/api\/media\/file\/[^/]/i.test(pathname);
  if ((cmsEndpoint && !publicMedia) || (navigation && /^\/(?:_emdash|admin|api)(?:\/|$)/i.test(pathname))) return 'administrative-endpoint';
  return null;
}

export function pageAuditOptions(input) {
  const url = localPageURL(input.url);
  if (typeof input.out !== 'string' || !input.out.trim()) fail('--out is required: a new directory for the report');
  const out = path.resolve(input.out), relative = path.relative(process.cwd(), out).split(path.sep).join('/');
  if (!relative.startsWith('../') && !path.isAbsolute(relative) && !['.emdash/checks/', '.emdash/visual/', '.baseline/backups/'].some(prefix => relative.startsWith(prefix))) fail('--out inside the project must be under .emdash/checks/, .emdash/visual/ or .baseline/backups/');
  if (input.label !== undefined && !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,119}$/.test(input.label)) fail('--label must be 1-120 characters of letters, digits, ".", "_", "/" or "-", starting with a letter or digit (no spaces); use a non-secret build reference');
  return {
    url: url.href, out, label: input.label ?? null,
    width: integer(input.width, 390, 240, 3840, 'width'), height: integer(input.height, 844, 240, 2160, 'height'),
    runs: integer(input.runs, 3, 1, 5, 'runs'), settleMs: integer(input.settleMs, 1500, 250, 10000, 'settle-ms'),
    timeoutMs: integer(input.timeoutMs, 15000, 1000, 30000, 'timeout-ms'), cpuRate: integer(input.cpuRate, 1, 1, 20, 'cpu-rate'),
  };
}

export function parsePageAuditArgs(values) {
  if (values.length === 1 && values[0] === '--help') return { help: true };
  const flags = { '--url': 'url', '--out': 'out', '--label': 'label', '--width': 'width', '--height': 'height', '--runs': 'runs', '--settle-ms': 'settleMs', '--timeout-ms': 'timeoutMs', '--cpu-rate': 'cpuRate' };
  const result = {};
  for (let i = 0; i < values.length; i++) {
    const key = flags[values[i]];
    if (!key || Object.hasOwn(result, key) || !values[i + 1] || values[i + 1].startsWith('--')) fail(`Unknown, duplicate or valueless argument at position ${i + 1}; options: ${Object.keys(flags).join(', ')}`);
    result[key] = values[++i];
  }
  return pageAuditOptions(result);
}

function noLinks(value) {
  const absolute = path.resolve(value), root = path.parse(absolute).root;
  let current = root;
  for (const part of absolute.slice(root.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try { if (fs.lstatSync(current).isSymbolicLink()) fail('Linked output paths are refused'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return absolute;
}

export function preparePageAuditOutput(value) {
  const absolute = noLinks(value);
  if (fs.existsSync(absolute)) fail('Output already exists; choose a new destination');
  const parent = path.dirname(absolute);
  if (!fs.existsSync(parent) || !fs.statSync(parent).isDirectory()) fail('Output parent must be an existing directory');
  fs.mkdirSync(absolute, { mode: 0o700 });
  return absolute;
}

function observeLoading() {
  const state = { supported: PerformanceObserver.supportedEntryTypes, lcp: null, shifts: [], shiftsTruncated: false };
  const observers = [];
  for (const type of ['largest-contentful-paint', 'layout-shift']) {
    if (!state.supported.includes(type)) continue;
    const observer = new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (type === 'largest-contentful-paint') state.lcp = { startTime: entry.startTime, size: entry.size, element: entry.element?.tagName ?? null };
        else if (!entry.hadRecentInput) {
          if (state.shifts.length < 1000) state.shifts.push({ time: entry.startTime, value: entry.value });
          else state.shiftsTruncated = true;
        }
      }
    });
    observer.observe({ type, buffered: true }); observers.push(observer);
  }
  Object.defineProperty(window, '__baselineLoadingObservation', { value: state });
}

export function layoutShiftWindow(shifts) {
  let maximum = 0, current = 0, start = null, previous = null;
  for (const shift of shifts) {
    if (start === null || shift.time - previous >= 1000 || shift.time - start >= 5000) { start = shift.time; current = 0; }
    current += shift.value; previous = shift.time; maximum = Math.max(maximum, current);
  }
  return maximum;
}

async function renderedFonts(page, session) {
  await session.send('DOM.enable'); await session.send('CSS.enable');
  const { root } = await session.send('DOM.getDocument');
  const results = [];
  for (const selector of FONT_SELECTORS) {
    const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
    if (!nodeId) { results.push({ selector, status: 'missing' }); continue; }
    const computed = await page.locator(selector).first().evaluate(element => {
      const css = getComputedStyle(element), rect = element.getBoundingClientRect();
      return { family: css.fontFamily, weight: css.fontWeight, style: css.fontStyle, size: css.fontSize, visible: rect.width > 0 && rect.height > 0, characterCount: element.textContent?.length ?? 0 };
    });
    try {
      const { fonts } = await session.send('CSS.getPlatformFontsForNode', { nodeId });
      results.push({ selector, status: fonts.length ? 'observed' : 'no-rendered-glyphs', css: computed, platformFonts: fonts.map(font => ({ family: font.familyName, postScriptName: font.postScriptName, custom: font.isCustomFont, glyphCount: font.glyphCount })) });
    } catch { results.push({ selector, status: 'unavailable', css: computed }); }
  }
  return results;
}

async function runPage(browser, options, index) {
  const origin = new URL(options.url).origin;
  const context = await browser.newContext({ viewport: { width: options.width, height: options.height }, deviceScaleFactor: 1, serviceWorkers: 'block', reducedMotion: 'reduce' });
  const deadline = setTimeout(() => { context.close().catch(() => {}); }, options.timeoutMs + options.settleMs + 10000);
  deadline.unref();
  const page = await context.newPage();
  page.setDefaultTimeout(options.timeoutMs); page.setDefaultNavigationTimeout(options.timeoutMs);
  const errors = [], blocked = [], resources = new Map();
  let requestCount = 0, truncated = false, response = null, navigationError = false;
  await context.routeWebSocket('**/*', async socket => {
    requestCount++;
    if (blocked.length < MAX_RESOURCES) blocked.push({ url: publicResourceURL(socket.url()), method: 'WEBSOCKET', reason: 'websocket-outside-public-get-scope' });
    if (requestCount > MAX_RESOURCES) truncated = true;
    // Without connectToServer the intercepted socket never reaches its destination.
    await socket.close({ code: 1008, reason: 'Public page observation only' }).catch(() => {});
  });
  // Context routing covers the first request of popups before a page event can close them.
  // Keep the page's protocol interception below for every redirect hop as well.
  await context.route('**/*', async route => {
    const request = route.request();
    let popup = false;
    if (request.isNavigationRequest()) {
      try { popup = request.frame().page() !== page; }
      catch { popup = true; } // A popup's first request can precede its frame.
    }
    const reason = popup ? 'unexpected-popup-navigation' : pageRequestPolicy(request.url(), origin, request.method(), request.isNavigationRequest());
    if (reason) {
      if (blocked.length < MAX_RESOURCES) blocked.push({ url: publicResourceURL(request.url()), method: request.method(), reason });
      else truncated = true;
      await route.abort('blockedbyclient').catch(() => {}); return;
    }
    await route.continue().catch(() => {});
  });
  const session = await context.newCDPSession(page);
  const addError = category => { if (errors.length < 50) errors.push(category); };
  page.on('pageerror', () => addError('pageerror'));
  page.on('console', message => { if (message.type() === 'error') addError('console.error'); });
  page.on('dialog', async dialog => { addError('unexpected-dialog'); await dialog.dismiss().catch(() => {}); });
  context.on('page', popup => { if (popup !== page) { addError('unexpected-popup'); popup.close().catch(() => {}); } });
  // Intercept every redirect hop; context route callbacks only see the first URL.
  session.on('Fetch.requestPaused', async event => {
    const request = event.request;
    const policyReason = pageRequestPolicy(request.url, origin, request.method, event.resourceType === 'Document');
    requestCount++;
    if (policyReason || requestCount > MAX_RESOURCES) {
      if (blocked.length < MAX_RESOURCES) blocked.push({ url: publicResourceURL(request.url), method: request.method, reason: requestCount > MAX_RESOURCES ? 'request-bound' : policyReason });
      if (requestCount > MAX_RESOURCES) truncated = true;
      await session.send('Fetch.failRequest', { requestId: event.requestId, errorReason: 'BlockedByClient' }).catch(() => {}); return;
    }
    await session.send('Fetch.continueRequest', { requestId: event.requestId }).catch(() => {});
  });
  session.on('Network.requestWillBeSent', event => {
    if (!resources.has(event.requestId) && resources.size >= MAX_RESOURCES) { truncated = true; return; }
    resources.set(event.requestId, { url: publicResourceURL(event.request.url), type: event.type, status: null, mimeType: null, encodedBytes: null, complete: false, redirected: Boolean(event.redirectResponse) });
  });
  session.on('Network.responseReceived', event => {
    const resource = resources.get(event.requestId);
    if (resource) Object.assign(resource, { status: event.response.status, mimeType: event.response.mimeType, fromDiskCache: event.response.fromDiskCache ?? false, fromServiceWorker: event.response.fromServiceWorker ?? false });
  });
  session.on('Network.loadingFinished', event => {
    const resource = resources.get(event.requestId);
    if (resource) Object.assign(resource, { encodedBytes: event.encodedDataLength, complete: true });
  });
  session.on('Network.loadingFailed', event => {
    const resource = resources.get(event.requestId);
    if (resource) Object.assign(resource, { failed: true, canceled: Boolean(event.canceled) });
  });
  try {
    await session.send('Network.enable'); await session.send('Network.setCacheDisabled', { cacheDisabled: true });
    await session.send('Fetch.enable', { patterns: [{ urlPattern: '*', requestStage: 'Request' }] });
    await session.send('Emulation.setCPUThrottlingRate', { rate: options.cpuRate });
    await page.addInitScript(observeLoading);
    try { response = await page.goto(options.url, { waitUntil: 'load' }); }
    catch { navigationError = true; addError('navigation-failed-or-timed-out'); }
    await page.waitForTimeout(options.settleMs);
    const pageData = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      return {
        observer: window.__baselineLoadingObservation ?? null,
        navigation: nav ? Object.fromEntries(['startTime', 'duration', 'responseStart', 'domInteractive', 'domContentLoadedEventEnd', 'loadEventEnd', 'transferSize', 'encodedBodySize', 'decodedBodySize'].map(key => [key, nav[key]])) : null,
        firstContentfulPaintMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null,
        fontFaceSet: { status: document.fonts.status, faces: [...document.fonts].slice(0, 64).map(font => ({ family: font.family, weight: font.weight, style: font.style, status: font.status })) },
        documentWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth,
      };
    }).catch(() => null);
    const fonts = await renderedFonts(page, session).catch(() => FONT_SELECTORS.map(selector => ({ selector, status: 'unavailable' })));
    const entries = [...resources.values()];
    const failed = entries.filter(item => item.failed || item.status >= 400);
    return {
      run: index, status: !navigationError && response?.ok() && !errors.length && !blocked.length && !failed.length && !truncated && !pageData?.observer?.shiftsTruncated && !entries.some(item => !item.complete && !item.failed) && fonts.some(sample => sample.status === 'observed') ? 'observed' : 'incomplete',
      document: { requestedURL: options.url, finalURL: publicResourceURL(page.url()), status: response?.status() ?? null },
      timings: pageData ? { navigation: pageData.navigation, firstContentfulPaintMs: pageData.firstContentfulPaintMs, largestContentfulPaint: pageData.observer?.lcp ?? null, layoutShiftWindowMax: pageData.observer?.supported.includes('layout-shift') ? layoutShiftWindow(pageData.observer.shifts) : null, layoutShiftCount: pageData.observer?.shifts.length ?? null, layoutShiftsTruncated: pageData.observer?.shiftsTruncated ?? false, supportedEntryTypes: pageData.observer?.supported ?? [] } : null,
      resourceSummary: { count: entries.length, completed: entries.filter(item => item.complete).length, encodedBytes: entries.reduce((sum, item) => sum + (item.encodedBytes ?? 0), 0), failed: failed.length, pending: entries.filter(item => !item.complete && !item.failed).length, truncated },
      resources: entries, blockedRequests: blocked, runtimeErrors: errors,
      fonts: { samples: fonts, faceSet: pageData?.fontFaceSet ?? null, failedResources: entries.filter(item => item.type === 'Font' && (item.failed || item.status >= 400)) },
      geometry: pageData ? { documentWidth: pageData.documentWidth, scrollWidth: pageData.scrollWidth, horizontalOverflow: pageData.scrollWidth > pageData.documentWidth } : null,
    };
  } finally { clearTimeout(deadline); await context.close(); }
}

export async function auditPage(input) {
  const options = pageAuditOptions(input);
  if (process.env.CI || process.env.GITHUB_ACTIONS === 'true') fail('Page browser evidence is local-only; never run in CI or production builds');
  const out = preparePageAuditOutput(options.out);
  let browser;
  const report = {
    schemaVersion: 1, status: 'incomplete', label: options.label, page: options.url, createdAt: new Date().toISOString(),
    conditions: { viewport: { width: options.width, height: options.height }, deviceScaleFactor: 1, runs: options.runs, settleAfterLoadMs: options.settleMs, navigationTimeoutMs: options.timeoutMs, cache: 'browser cache disabled; fresh anonymous context per run; origin/server caches uncontrolled', serviceWorkers: 'blocked', cpuSlowdown: options.cpuRate, network: 'unthrottled loopback host; no remote-network simulation', requests: 'same-origin GET/HEAD only; external and mutating requests and all WebSockets blocked', reducedMotion: 'reduce', interaction: 'none; no scrolling or clicks', resourceLimit: MAX_RESOURCES },
    runs: [],
    limits: ['Observations from a bounded local load window, not a performance score, budget pass, real-user field data or accessibility certification.', 'LCP and layout shifts can change after this observation window; no interactions or below-fold lazy-loading journey was exercised.', 'Encoded byte totals use completed protocol loading events; pending/failed requests and prior redirect hops can make totals incomplete. These are received bytes, not source bundle sizes.', 'Blocked external or mutating requests can change page behavior; a scope-limited run is incomplete, not evidence of normal deployed operation.', 'Font samples report actual platform-font glyph use for selected nodes and their child text nodes, not an exhaustive font inventory. CSS weight is requested weight, not proof of a particular font file/variable-axis selection. A nonempty FontFaceSet alone is not proof of rendering.', 'Query/fragment/credentials are omitted from resource URLs; no page text, response bodies, console message text, cookies or authorization headers are retained.'],
  };
  try {
    const { chromium } = await import('@playwright/test');
    browser = await chromium.launch({ channel: 'chromium', headless: true }); report.browser = { engine: 'Chromium', version: browser.version() };
    for (let index = 1; index <= options.runs; index++) report.runs.push(await runPage(browser, options, index));
    report.status = report.runs.every(run => run.status === 'observed') ? 'observed' : 'incomplete';
  } catch { report.failure = 'Browser or required evidence unavailable; details withheld'; }
  finally {
    await browser?.close();
    noLinks(out);
    fs.writeFileSync(path.join(out, 'page-evidence.json'), JSON.stringify(report, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  }
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parsePageAuditArgs(process.argv.slice(2));
    if (options.help) console.log('Usage: node scripts/audit-page.mjs --url http://127.0.0.1:PORT/page --out NEW_DIRECTORY [--label BUILD_ID] [--width 390] [--height 844] [--runs 3] [--settle-ms 1500] [--timeout-ms 15000] [--cpu-rate 1]');
    else {
      const report = await auditPage(options);
      console.log(JSON.stringify({ status: report.status, runs: report.runs.length, report: path.join(options.out, 'page-evidence.json') }));
      if (report.status !== 'observed') process.exitCode = 2;
    }
  } catch (error) {
    console.error(error instanceof PageAuditRefusal ? `Page evidence refused: ${error.message}.` : 'Page evidence refused: unsupported execution context or unexpected failure (details withheld).');
    process.exitCode = 2;
  }
}
