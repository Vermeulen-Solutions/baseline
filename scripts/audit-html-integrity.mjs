import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { scanHTML } from './html-tags.mjs';
import { snapshotSSR } from './snapshot-ssr.mjs';
export { scanHTML } from './html-tags.mjs';

const origin = 'https://artifact.invalid';

const httpURL = value => {
  try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) && !u.username && !u.password && !/\s/.test(value); }
  catch { return false; }
};
const schemaContext = value => typeof value === 'string' && /^https?:\/\/schema\.org\/?$/.test(value);
function schemaValid(value, inherited = false) {
  if (Array.isArray(value)) return value.length > 0 && value.every(node => schemaValid(node, inherited));
  if (!value || typeof value !== 'object') return false;
  const context = inherited || schemaContext(value['@context']) || (value['@context'] && typeof value['@context'] === 'object' && schemaContext(value['@context']['@vocab']));
  if (!context) return false;
  if (value['@graph']) return schemaValid(value['@graph'], true);
  const types = Array.isArray(value['@type']) ? value['@type'] : [value['@type']];
  return types.length > 0 && types.every(type => typeof type === 'string' && /^(?:https?:\/\/schema\.org\/)?[A-Za-z][\w]*$/.test(type));
}

const leaked = relative => relative.split('/').some(part => /^(?:_styleguide|_form-recovery)(?:[._-]|$)|^(?:__fixtures__|fixtures?|tests?|__tests__|dev-fixtures)(?:\.|$)/i.test(part)) || /\.(?:test|spec)\.[cm]?[jt]sx?$/i.test(relative);

/** Offline HTML validation, including URL/status maps from captured responses. */
export function auditHTMLIntegrity(directory = 'dist') {
  const start = performance.now(), root = path.resolve(directory), files = new Set(), errors = [], pages = new Map();
  const resources = new Map(), pageURLs = new Map();
  const fail = (file, rule, message) => errors.push({ file: pageURLs.get(file) ?? file, rule, message });
  if (!fs.statSync(root).isDirectory()) throw new Error('HTML audit requires a build directory');
  const client = fs.existsSync(path.join(root, 'client')) ? path.join(root, 'client') : root;
  const walk = (dir, prefix = '') => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const relative = prefix + entry.name;
      if (entry.isSymbolicLink()) { fail(relative, 'artifact', 'Symlink cannot be audited offline'); continue; }
      if (leaked(relative)) fail(relative, 'leak', 'Developer fixture or test emitted in release');
      if (entry.isDirectory()) walk(path.join(dir, entry.name), relative + '/');
      else files.add(relative);
    }
  };
  // Include server output in the leak check, but never treat it as public files.
  walk(root);
  if (client !== root) {
    const publicFiles = [...files].filter(file => file.startsWith('client/')).map(file => file.slice(7));
    files.clear(); for (const file of publicFiles) files.add(file);
  }
  const markerFile = path.join(root, '.starter-build.json');
  if (fs.existsSync(markerFile)) {
    const marker = JSON.parse(fs.readFileSync(markerFile, 'utf8'));
    if (marker.profile !== 'release' || marker.deployable !== true) fail('.starter-build.json', 'leak', 'Fixture or nondeployable artifact');
  }
  const routeFile = path.join(root, '.starter-routes.json');
  let runtimeRoutes = 0;
  if (fs.existsSync(routeFile)) {
    for (const route of JSON.parse(fs.readFileSync(routeFile, 'utf8'))) {
      if (leaked(route.route.replace(/^\//, ''))) fail(route.route, 'leak', 'Developer route emitted in release manifest');
      if (!route.prerender) runtimeRoutes++;
    }
  }
  const snapshotFile = path.join(root, '.ssr-snapshot.json');
  let snapshot;
  if (fs.existsSync(snapshotFile)) {
    snapshot = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
    if (snapshot.version !== 1 || !httpURL(snapshot.origin) || !Array.isArray(snapshot.resources)) throw Error('Invalid SSR snapshot manifest');
    for (const resource of snapshot.resources) {
      if (typeof resource.url !== 'string' || !resource.url.startsWith('/') || resource.url.startsWith('//') || resources.has(resource.url) || !Number.isInteger(resource.status)) throw Error('Invalid SSR resource');
      if (resource.file) {
        if (!/^page-\d+\.html$/.test(resource.file) || !files.has(resource.file)) throw Error('Missing or unsafe SSR snapshot HTML file');
        pageURLs.set(resource.file, resource.url);
      }
      resources.set(resource.url, resource);
    }
  }
  for (const file of files) if (/\.html?$/i.test(file)) {
    const tags = scanHTML(fs.readFileSync(path.join(client, file), 'utf8'));
    pages.set(file, { tags, anchors: new Set(tags.flatMap(({ name, attrs }) => [attrs.id, ...(name === 'a' ? [attrs.name] : [])]).filter(Boolean)) });
  }
  const routeFor = file => '/' + file.replace(/index\.html?$/i, '');
  for (const [file, { tags }] of pages) {
    const canonical = tags.find(t => t.name === 'link' && t.attrs.rel?.toLowerCase().split(/\s+/).includes('canonical'));
    const pageOrigin = canonical && httpURL(canonical.attrs.href) ? new URL(canonical.attrs.href).origin : snapshot?.origin ?? origin;
    let base = new URL(pageURLs.get(file) ?? routeFor(file), pageOrigin);
    const baseTag = tags.find(t => t.name === 'base' && t.attrs.href !== undefined);
    if (baseTag) { try { base = new URL(baseTag.attrs.href, base); } catch { fail(file, 'link', 'Invalid base href'); } }
    for (const { name, attrs, body } of tags) {
      if (name === 'a' && attrs.href !== undefined) {
        const href = attrs.href.trim();
        try {
          const url = new URL(href, base);
          if (!['http:', 'https:'].includes(url.protocol) || ![pageOrigin, snapshot?.origin].includes(url.origin)) continue;
          if (snapshot) {
            if ((href === '' || href.startsWith('#')) && url.pathname + url.search === pageURLs.get(file)) {
              if (url.hash && !pages.get(file).anchors.has(decodeURIComponent(url.hash.slice(1)))) fail(file, 'anchor', `Missing anchor: ${href}`);
              continue;
            }
            let key = url.pathname + url.search, hash = url.hash;
            const visited = new Set();
            while (resources.get(key)?.redirect) {
              if (visited.has(key)) throw Error('Redirect loop');
              if (Object.hasOwn(resources.get(key), 'fragment')) hash = resources.get(key).fragment;
              visited.add(key); key = resources.get(key).redirect;
            }
            const resource = resources.get(key);
            if (!resource || resource.status < 200 || resource.status >= 300) { fail(file, 'link', `Broken internal destination: ${href} (HTTP ${resource?.status ?? 'not captured'})`); continue; }
            if (hash && resource.file && !pages.get(resource.file)?.anchors.has(decodeURIComponent(hash.slice(1)))) fail(file, 'anchor', `Missing anchor: ${href}`);
            continue;
          }
          const relative = decodeURIComponent(url.pathname).replace(/^\//, '');
          if (relative.split('/').includes('..') || relative.includes('\\') || relative.includes('\0')) throw Error('Unsafe path');
          const target = [relative, relative.replace(/\/$/, '') + '/index.html', relative + '.html'].find(candidate => files.has(candidate)) ?? (relative === '' && files.has('index.html') ? 'index.html' : null);
          if (!target) { fail(file, 'link', `Missing internal destination: ${href}`); continue; }
          if (url.hash && pages.has(target) && !pages.get(target).anchors.has(decodeURIComponent(url.hash.slice(1)))) fail(file, 'anchor', `Missing anchor: ${href}`);
        } catch { fail(file, 'link', `Invalid internal URL: ${href}`); }
      }
      if (name === 'img') {
        if (attrs.alt === undefined) fail(file, 'image-alt', 'Image requires an alt attribute; use alt="" for decorative images');
        else if (attrs.alt !== '' && !attrs.alt.trim()) fail(file, 'image-alt', 'Informative image alt text cannot contain only whitespace');
        const dimensions = /^\d+(?:\.\d+)?$/.test(attrs.width ?? '') && Number(attrs.width) > 0 && /^\d+(?:\.\d+)?$/.test(attrs.height ?? '') && Number(attrs.height) > 0;
        const ratio = attrs.style?.match(/(?:^|;)\s*aspect-ratio\s*:\s*(\d+(?:\.\d+)?)(?:\s*\/\s*(\d+(?:\.\d+)?))?\s*(?:;|$)/i);
        if (!dimensions && !(ratio && Number(ratio[1]) > 0 && Number(ratio[2] ?? 1) > 0)) fail(file, 'image-dimensions', 'Image requires positive width/height or inline aspect-ratio');
      }
      if (name === 'script' && attrs.type?.toLowerCase().trim() === 'application/ld+json') {
        try { if (!schemaValid(JSON.parse(body))) fail(file, 'json-ld', 'Schema.org JSON-LD requires @context and @type (or a typed @graph)'); }
        catch { fail(file, 'json-ld', 'Malformed JSON-LD'); }
      }
      if (name === 'link' && attrs.rel?.toLowerCase().split(/\s+/).includes('canonical')) {
        if (!httpURL(attrs.href) || new URL(attrs.href).hash) fail(file, 'canonical', 'Canonical must be an absolute HTTP(S) URL without fragment');
      }
      if (name === 'meta' && /^og:/i.test(attrs.property ?? '')) {
        if (!/^og:[a-z_]+(?::[a-z_]+)*$/i.test(attrs.property) || !attrs.content?.trim()) fail(file, 'opengraph', 'OpenGraph property/content is invalid');
        else if (/^og:(?:url|image|video|audio)(?::(?:url|secure_url))?$/.test(attrs.property) && !httpURL(attrs.content)) fail(file, 'opengraph', 'OpenGraph URL must be absolute HTTP(S)');
      }
    }
  }
  return { valid: errors.length === 0, htmlFiles: pages.size, runtimeRoutes, durationMs: performance.now() - start, errors };
}

/** Static artifacts stay offline; Node SSR artifacts capture real public HTML. */
export async function auditBuildIntegrity(directory = 'dist', options = {}) {
  const started = performance.now();
  const artifact = path.resolve(options.cwd ?? process.cwd(), directory);
  const report = auditHTMLIntegrity(artifact);
  if (!report.valid || report.htmlFiles) return report;
  if (!fs.existsSync(path.join(artifact, 'server/entry.mjs'))) throw Error('No emitted HTML or Node SSR entrypoint to audit');
  const capture = await snapshotSSR({ ...options, directory: artifact });
  const rendered = auditHTMLIntegrity(capture.directory);
  return { ...rendered, runtimeRoutes: report.runtimeRoutes, ssr: capture, durationMs: performance.now() - started };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = { routes: [] };
    let directory, routeSeen = false;
    for (let index = 2; index < process.argv.length; index++) {
      const flag = process.argv[index], value = process.argv[index + 1];
      if (flag === '--route' && value && !value.startsWith('--')) { options.routes.push(value); routeSeen = true; index++; }
      else if (flag === '--timeout-ms' && value && /^\d+$/.test(value) && options.timeoutMs === undefined) { options.timeoutMs = Number(value); index++; }
      else if (flag === '--max-resources' && value && /^\d+$/.test(value) && options.maxResources === undefined) { options.maxResources = Number(value); index++; }
      else if (flag === '--query-link-mode' && ['crawl', 'status-only'].includes(value) && options.queryLinkMode === undefined) { options.queryLinkMode = value; index++; }
      else if (!directory && !flag.startsWith('-')) directory = flag;
      else throw Error('Usage: node scripts/audit-html-integrity.mjs [dist] [--route <path>] [--timeout-ms <1-10000>] [--max-resources <2-512>] [--query-link-mode crawl|status-only]');
    }
    if (!routeSeen) options.routes = ['/'];
    if (options.maxResources !== undefined && (!Number.isSafeInteger(options.maxResources) || options.maxResources < 2 || options.maxResources > 512)) throw Error('SSR resource budget must be an integer between 2 and 512');
    const report = await auditBuildIntegrity(directory, options);
    for (const error of report.errors) console.error(`${error.file} [${error.rule}] ${error.message}`);
    console.log(`HTML integrity: ${report.valid ? 'PASS' : 'FAIL'}; ${report.htmlFiles} HTML files; ${report.durationMs.toFixed(1)}ms.`);
    if (report.ssr) console.log(`SSR capture: ${report.ssr.resources} public responses; snapshots: ${report.ssr.directory}. Representative linked routes only; ${report.runtimeRoutes} runtime route patterns in the build.`);
    process.exitCode = report.valid ? 0 : 1;
  } catch (error) { console.error(`HTML integrity: ${error.message}`); process.exitCode = 1; }
}
