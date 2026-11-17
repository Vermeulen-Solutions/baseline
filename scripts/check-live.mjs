// Post-deploy check of a live site: every sitemap page and every stylesheet those pages use.
// Read-only GET requests; nothing is sent to the CMS.
//
//   npm run check:live -- --origin https://example.com [--max-pages 300] [--strict-seo]
//
// A page counts when it answers 200, or redirects to a page that answers 200 (reported). Every
// stylesheet the pages reference must answer 200: after a deploy, a cache that still serves the
// previous build's HTML points at stylesheets the new deploy no longer has, and pages render
// unstyled. The sitemap's own host is ignored, so a staging or workers.dev origin is checked even
// when the sitemap names the production domain. Exit code 1 when anything fails.
//
// Search-facing warnings (exit code 1 only with --strict-seo): a sitemap URL that redirects; a page
// without exactly one canonical naming itself, or without exactly one meta description; a repeated
// hreflang; and hreflang links in the page head that differ from the sitemap's alternates for that
// URL. Paths are compared, not hosts, for the same reason as above.
import { argumentsOf, isMain } from './infrastructure-io.mjs';

const TIMEOUT_MS = 20_000;

export function parseSitemap(xml) {
  const locs = [...String(xml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map(match => match[1].replaceAll('&amp;', '&'));
  return { index: /<sitemapindex[\s>]/i.test(xml), locs };
}

// hreflang alternates the sitemap declares for each <loc>, keyed by that loc as written.
export function sitemapAlternates(xml) {
  const result = new Map();
  for (const [, block] of String(xml).matchAll(/<url>([\s\S]*?)<\/url>/gi)) {
    const loc = block.match(/<loc>\s*([^<\s]+)\s*<\/loc>/i)?.[1]?.replaceAll('&amp;', '&');
    if (!loc) continue;
    const links = [...block.matchAll(/<xhtml:link\b[^>]*>/gi)].map(([tag]) => ({
      hreflang: attribute(tag, 'hreflang') ?? '',
      href: attribute(tag, 'href') ?? '',
    })).filter(link => link.hreflang && link.href);
    if (links.length) result.set(loc, links);
  }
  return result;
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1]?.replaceAll('&amp;', '&');
}

// Canonical links, meta descriptions and hreflang alternates a page's HTML declares.
export function headSignals(html, pageUrl) {
  const canonicals = [], alternates = [];
  for (const tag of String(html).match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attribute(tag, 'rel') ?? '').toLowerCase().split(/\s+/);
    const href = attribute(tag, 'href');
    if (!href) continue;
    if (rel.includes('canonical')) canonicals.push(new URL(href, pageUrl).href);
    const hreflang = attribute(tag, 'hreflang');
    if (rel.includes('alternate') && hreflang) alternates.push({ hreflang, href: new URL(href, pageUrl).href });
  }
  const descriptions = (String(html).match(/<meta\b[^>]*\bname\s*=\s*["']description["'][^>]*>/gi) ?? []).length;
  return { canonicals, descriptions, alternates };
}

const pathOf = href => { const url = new URL(href); return url.pathname + url.search; };
const alternateSet = links => links.map(link => `${link.hreflang.toLowerCase()}=${pathOf(link.href)}`).sort();

// Search-facing problems for one sitemap page that answered 200 at its own address. The page's
// sitemap alternates are compared only when the sitemap declares some.
export function seoWarnings(page, html, sitemapLinks = []) {
  const warnings = [];
  const { canonicals, descriptions, alternates } = headSignals(html, page);
  if (canonicals.length !== 1) warnings.push(`${page} has ${canonicals.length} canonical links`);
  else if (pathOf(canonicals[0]) !== pathOf(page)) warnings.push(`${page} names ${canonicals[0]} as canonical`);
  if (descriptions !== 1) warnings.push(`${page} has ${descriptions} meta descriptions`);
  const languages = alternates.map(link => link.hreflang.toLowerCase());
  const repeated = [...new Set(languages.filter((language, index) => languages.indexOf(language) !== index))];
  if (repeated.length) warnings.push(`${page} repeats hreflang ${repeated.join(', ')}`);
  if (sitemapLinks.length && alternateSet(alternates).join() !== alternateSet(sitemapLinks).join()) {
    warnings.push(`${page} declares hreflang ${alternateSet(alternates).join(' ') || '(none)'}; the sitemap lists ${alternateSet(sitemapLinks).join(' ')}`);
  }
  return warnings;
}

// The path of a sitemap URL, served from the origin being checked.
export function reroot(loc, origin) {
  const url = new URL(loc, origin);
  return new URL(url.pathname + url.search, origin).href;
}

export function stylesheetHrefs(html, pageUrl) {
  const hrefs = new Set();
  for (const tag of String(html).match(/<link\b[^>]*>/gi) ?? []) {
    if (!/\brel\s*=\s*["']?[^"'>]*\bstylesheet\b/i.test(tag)) continue;
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (href) hrefs.add(new URL(href.replaceAll('&amp;', '&'), pageUrl).href);
  }
  return [...hrefs];
}

async function get(url, { redirect = 'manual' } = {}) {
  const response = await fetch(url, { redirect, signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'User-Agent': 'baseline-check-live' } });
  return { status: response.status, location: response.headers.get('location'), body: response.status === 200 ? await response.text() : (await response.arrayBuffer(), '') };
}

// Every page the sitemap (or its index) lists, rerooted on the checked origin, with the hreflang
// alternates declared for each.
export async function sitemapEntries(origin, fetcher = get) {
  const pages = new Set();
  const alternates = new Map();
  const queue = [new URL('/sitemap.xml', origin).href];
  const seen = new Set();
  while (queue.length) {
    const url = queue.shift();
    if (seen.has(url)) continue;
    seen.add(url);
    const response = await fetcher(url, { redirect: 'follow' });
    if (response.status !== 200) throw new Error(`${url} answered ${response.status}`);
    const { index, locs } = parseSitemap(response.body);
    const declared = index ? new Map() : sitemapAlternates(response.body);
    for (const loc of locs) {
      if (index) { queue.push(reroot(loc, origin)); continue; }
      const page = reroot(loc, origin);
      pages.add(page);
      if (declared.has(loc)) alternates.set(page, declared.get(loc));
    }
  }
  return { pages: [...pages], alternates };
}

export async function sitemapPages(origin, fetcher = get) {
  return (await sitemapEntries(origin, fetcher)).pages;
}

export async function checkLive({ origin, maxPages = 300, strictSeo = false }, fetcher = get) {
  const base = new URL(origin).origin;
  const report = { origin: base, health: null, pages: [], redirects: [], failures: [], warnings: [], stylesheets: [], extra: {} };
  const health = await fetcher(new URL('/_emdash/api/health', base).href, { redirect: 'follow' });
  if (health.status === 200) { try { report.health = JSON.parse(health.body).data ?? null; } catch {} }
  const listed = await sitemapEntries(base, fetcher);
  const inSitemap = new Set(listed.pages);
  const pages = listed.pages.slice(0, maxPages);
  if (!pages.includes(new URL('/', base).href)) pages.unshift(new URL('/', base).href);
  const sheets = new Map();
  for (const page of pages) {
    let response = await fetcher(page);
    let final = page;
    if (response.status >= 300 && response.status < 400 && response.location) {
      final = new URL(response.location, page).href;
      const target = await fetcher(final, { redirect: 'follow' });
      report.redirects.push({ from: page, status: response.status, to: final, targetStatus: target.status });
      if (inSitemap.has(page)) report.warnings.push(`The sitemap lists ${page}, which redirects (${response.status}) to ${final}`);
      response = target;
    }
    report.pages.push({ url: page, status: response.status });
    if (response.status !== 200) { report.failures.push(`${page} answered ${response.status}${final !== page ? ` (after a redirect to ${final})` : ''}`); continue; }
    if (final === page && inSitemap.has(page)) report.warnings.push(...seoWarnings(page, response.body, listed.alternates.get(page)));
    for (const href of stylesheetHrefs(response.body, final)) if (!sheets.has(href)) sheets.set(href, page);
  }
  for (const [href, page] of sheets) {
    const response = await fetcher(href, { redirect: 'follow' });
    report.stylesheets.push({ url: href, status: response.status, firstSeenOn: page });
    if (response.status !== 200) report.failures.push(`Stylesheet ${href} (used by ${page}) answered ${response.status}`);
  }
  for (const [name, path] of [['robots', '/robots.txt'], ['missingPage', `/check-live-missing-${Date.now()}`]]) {
    const response = await fetcher(new URL(path, base).href);
    report.extra[name] = { status: response.status, location: response.location };
  }
  if (report.extra.robots.status !== 200) report.failures.push(`/robots.txt answered ${report.extra.robots.status}`);
  if (report.extra.missingPage.status >= 500) report.failures.push(`A missing page answered ${report.extra.missingPage.status}`);
  report.ok = report.failures.length === 0 && (!strictSeo || report.warnings.length === 0);
  return report;
}

if (isMain(import.meta.url)) {
  try {
    const argv = process.argv.slice(2);
    const strictSeo = argv.includes('--strict-seo');
    const args = argumentsOf(argv.filter(arg => arg !== '--strict-seo'), ['--origin', '--max-pages']);
    if (!args.origin) throw new Error('Specify --origin <https://site>');
    const report = await checkLive({ origin: args.origin, maxPages: args['max-pages'] ? Number(args['max-pages']) : 300, strictSeo });
    const ok200 = report.pages.filter(page => page.status === 200).length;
    console.log(`[check:live] ${report.origin}${report.health?.version ? ` (EmDash ${report.health.version})` : ''}`);
    console.log(`[check:live] Pages: ${ok200} of ${report.pages.length} answer 200${report.redirects.length ? `; ${report.redirects.length} redirect (${report.redirects.slice(0, 5).map(item => `${new URL(item.from).pathname} -> ${new URL(item.to).pathname} ${item.targetStatus}`).join(', ')}${report.redirects.length > 5 ? `, and ${report.redirects.length - 5} more` : ''})` : ''}.`);
    console.log(`[check:live] Stylesheets: ${report.stylesheets.filter(item => item.status === 200).length} of ${report.stylesheets.length} answer 200.`);
    console.log(`[check:live] robots.txt ${report.extra.robots.status}; a missing page answers ${report.extra.missingPage.status}${report.extra.missingPage.location ? ` -> ${report.extra.missingPage.location}` : ''}.`);
    console.log(`[check:live] Search-facing warnings: ${report.warnings.length}${strictSeo ? ' (--strict-seo: each one fails the check)' : ''}.`);
    for (const warning of report.warnings.slice(0, 40)) console.log(`[check:live] WARN ${warning}`);
    if (report.warnings.length > 40) console.log(`[check:live] WARN and ${report.warnings.length - 40} more`);
    for (const failure of report.failures) console.log(`[check:live] FAIL ${failure}`);
    if (!report.ok) process.exitCode = 1;
  } catch (err) {
    console.error(`[check:live] Error: ${err.message}`);
    process.exitCode = 1;
  }
}
