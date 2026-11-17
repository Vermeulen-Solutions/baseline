// Delivery rules for EmDash sites on Cloudflare Workers, learned updating live sites to EmDash 1.5.
// The certified standards profile does not cover Workers yet, so these are checked by
// `fleet:status` and `audit:site` rather than pinned in the standards:
// - @astrojs/cloudflare below 14.4 leaves a CommonJS require("path") (PostCSS, through EmDash 1.5's
//   sanitize-html) in the Workers bundle, and every page fails;
// - an HTML edge cache keyed by URL alone keeps serving the previous build's pages after a deploy,
//   pointing at stylesheets the new deploy no longer has, so pages render unstyled.
import fs from 'node:fs';
import path from 'node:path';

export const WORKERS_RULES = { emdashFrom: '1.5.0', adapterMinimum: '14.4.0' };

export function versionAtLeast(version, minimum) {
  const parse = value => String(value).replace(/^[^\d]*/, '').split('-')[0].split('.').map(part => Number.parseInt(part, 10) || 0);
  const [a, b] = [parse(version), parse(minimum)];
  for (let i = 0; i < 3; i++) if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
  return true;
}

export function isWorkersSite(dir) {
  return ['wrangler.jsonc', 'wrangler.json', 'wrangler.toml'].some(name => fs.existsSync(path.join(dir, name)));
}

// 'fail' when EmDash 1.5+ runs with an adapter that cannot bundle it for Workers, 'pass' when the
// adapter is new enough or EmDash predates the rule, 'unverified' when either version is unknown.
export function workersAdapterStatus(emdashVersion, adapterVersion) {
  if (!emdashVersion || !adapterVersion) return 'unverified';
  if (!versionAtLeast(emdashVersion, WORKERS_RULES.emdashFrom)) return 'pass';
  return versionAtLeast(adapterVersion, WORKERS_RULES.adapterMinimum) ? 'pass' : 'fail';
}

// true when the site's own Cloudflare cache provider keys HTML per build, false when it keys by URL
// only, null when the site has no custom provider (Astro's own provider needs no change).
export function htmlCacheKeyedPerBuild(dir) {
  const lib = path.join(dir, 'src', 'lib');
  if (!fs.existsSync(lib)) return null;
  const providers = fs.readdirSync(lib).filter(name => /cache-provider\.(?:mjs|js|ts)$/.test(name));
  if (!providers.length) return null;
  return providers.some(name => /__SITE_BUILD_ID__|\bbuildId\b|\bBUILD_ID\b/.test(fs.readFileSync(path.join(lib, name), 'utf8')));
}

// @emdash-cms/* packages a site imports from its own source without declaring them. npm only hoists
// a dependency's dependencies by accident: EmDash 1.5 nests @emdash-cms/admin under emdash, and a
// site importing it undeclared stopped type-checking and building.
export function undeclaredEmDashImports(dir, declared) {
  const found = new Map();
  const walk = (current, depth) => {
    if (depth > 8) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) { if (!['node_modules', '.astro', 'dist'].includes(entry.name)) walk(full, depth + 1); continue; }
      if (!/\.(?:m?[jt]sx?|astro)$/.test(entry.name)) continue;
      const text = fs.readFileSync(full, 'utf8');
      for (const match of text.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["'](@emdash-cms\/[a-z0-9-]+)(?:\/[^"']*)?["']/g)) {
        if (!declared.has(match[1]) && !found.has(match[1])) found.set(match[1], path.relative(dir, full).replaceAll('\\', '/'));
      }
    }
  };
  for (const folder of ['src', 'astro.config.mjs']) {
    const full = path.join(dir, folder);
    if (!fs.existsSync(full)) continue;
    if (fs.statSync(full).isDirectory()) walk(full, 0);
  }
  return [...found].map(([name, file]) => ({ name, file }));
}
