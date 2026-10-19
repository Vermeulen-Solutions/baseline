import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const origin = 'https://artifact.invalid';
const decode = value => value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (all, entity) => {
  if (entity[0] !== '#') return ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: '\u00a0' })[entity.toLowerCase()];
  const n = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
  return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '\ufffd';
});

// A bounded HTML start-tag scanner: quoted '>' is legal, comments and raw-text
// elements cannot manufacture tags. Script bodies retain their literal JSON.
export function scanHTML(html) {
  const tags = [];
  const pattern = /<!--[\s\S]*?(?:-->|$)|<![^>]*>|<\/?([a-z][\w:-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/gi;
  let match;
  while ((match = pattern.exec(html))) {
    if (!match[1] || match[0][1] === '/') continue;
    const name = match[1].toLowerCase(), attrs = Object.create(null);
    for (const attr of match[2].matchAll(/([^\s=/'"<>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      const key = attr[1].toLowerCase();
      if (!Object.hasOwn(attrs, key)) attrs[key] = decode(attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    let body = '';
    if (['script', 'style', 'textarea', 'title'].includes(name)) {
      const closing = new RegExp(`</${name}\\s*>`, 'gi'); closing.lastIndex = pattern.lastIndex;
      const end = closing.exec(html);
      body = html.slice(pattern.lastIndex, end?.index ?? html.length);
      pattern.lastIndex = end ? closing.lastIndex : html.length;
    }
    tags.push({ name, attrs, body });
  }
  return tags;
}

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

/** Offline only. SSR responses require a separately rendered HTML snapshot. */
export function auditHTMLIntegrity(directory = 'dist') {
  const start = performance.now(), root = path.resolve(directory), files = new Set(), errors = [], pages = new Map();
  const fail = (file, rule, message) => errors.push({ file, rule, message });
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
  for (const file of files) if (/\.html?$/i.test(file)) {
    const tags = scanHTML(fs.readFileSync(path.join(client, file), 'utf8'));
    pages.set(file, { tags, anchors: new Set(tags.flatMap(({ name, attrs }) => [attrs.id, ...(name === 'a' ? [attrs.name] : [])]).filter(Boolean)) });
  }
  const routeFor = file => '/' + file.replace(/index\.html?$/i, '');
  for (const [file, { tags }] of pages) {
    const canonical = tags.find(t => t.name === 'link' && t.attrs.rel?.toLowerCase().split(/\s+/).includes('canonical'));
    const pageOrigin = canonical && httpURL(canonical.attrs.href) ? new URL(canonical.attrs.href).origin : origin;
    let base = new URL(routeFor(file), pageOrigin);
    const baseTag = tags.find(t => t.name === 'base' && t.attrs.href !== undefined);
    if (baseTag) { try { base = new URL(baseTag.attrs.href, base); } catch { fail(file, 'link', 'Invalid base href'); } }
    for (const { name, attrs, body } of tags) {
      if (name === 'a' && attrs.href !== undefined) {
        const href = attrs.href.trim();
        try {
          const url = new URL(href, base);
          if (!['http:', 'https:'].includes(url.protocol) || url.origin !== pageOrigin) continue;
          const relative = decodeURIComponent(url.pathname).replace(/^\//, '');
          if (relative.split('/').includes('..') || relative.includes('\\') || relative.includes('\0')) throw Error('Unsafe path');
          const target = [relative, relative.replace(/\/$/, '') + '/index.html', relative + '.html'].find(candidate => files.has(candidate)) ?? (relative === '' && files.has('index.html') ? 'index.html' : null);
          if (!target) { fail(file, 'link', `Missing internal destination: ${href}`); continue; }
          if (url.hash && pages.has(target) && !pages.get(target).anchors.has(decodeURIComponent(url.hash.slice(1)))) fail(file, 'anchor', `Missing anchor: ${href}`);
        } catch { fail(file, 'link', `Invalid internal URL: ${href}`); }
      }
      if (name === 'img') {
        if (!attrs.alt?.trim()) fail(file, 'image-alt', 'Image requires a non-empty alt attribute');
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

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.argv.length > 3 || process.argv[2]?.startsWith('-')) throw Error('Usage: node scripts/audit-html-integrity.mjs [dist-or-rendered-html-directory]');
    const report = auditHTMLIntegrity(process.argv[2]);
    for (const error of report.errors) console.error(`${error.file} [${error.rule}] ${error.message}`);
    console.log(`HTML integrity: ${report.valid ? 'PASS' : 'FAIL'}; ${report.htmlFiles} HTML files; ${report.durationMs.toFixed(1)}ms.`);
    if (!report.htmlFiles || report.runtimeRoutes) console.log(`Coverage: ${report.runtimeRoutes} runtime routes; SSR HTML is not emitted or audited. Audit a rendered snapshot directory to check runtime responses.`);
    process.exitCode = report.valid ? 0 : 1;
  } catch (error) { console.error(`HTML integrity: ${error.message}`); process.exitCode = 1; }
}
