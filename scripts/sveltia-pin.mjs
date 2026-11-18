// The Sveltia CMS script that the static-sveltia profile loads from a CDN.
//
// The editor is not an npm dependency, so `npm update` never sees it. This module reads the pinned
// version and its Subresource Integrity value from the profile's admin HTML, compares the pin with
// the latest npm release and, when asked, moves the pin: it downloads the exact file the page will
// load, cross-checks those bytes against a second CDN, computes `sha384-<base64>` from them and
// rewrites the URL, the integrity attribute, the version named in the profile guide and the
// reviewed design-gate exception for the admin HTML. The weekly upstream workflow then runs
// `npm run verify`, `npm run build` and `npm run test:profiles` before it proposes anything.
//
//   node scripts/sveltia-pin.mjs [--check]                 report the pin against npm (no writes)
//   node scripts/sveltia-pin.mjs --apply [--version x.y.z] move the pin (latest by default)
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const SVELTIA_PACKAGE = '@sveltia/cms';
export const SVELTIA_ADMIN_HTML = 'profiles/static-sveltia/project/public/admin/index.html';
export const SVELTIA_GUIDE = 'profiles/static-sveltia/project/docs/sveltia-cms.md';
export const GATE_EXCEPTIONS = 'audit/design-gate-exceptions.json';

const VERSION = /^\d+\.\d+\.\d+$/;
const SCRIPT_TAG = /<script\b[^>]*\bsrc="https:\/\/unpkg\.com\/@sveltia\/cms@([^/"]+)\/dist\/sveltia-cms\.js"[^>]*>/g;
const INTEGRITY = /\bintegrity="(sha384-[A-Za-z0-9+/]{64})"/;
const GUIDE_VERSION = /(Sveltia \*\*)(\d+\.\d+\.\d+)(\*\*)/g;

export const scriptUrl = version => `https://unpkg.com/${SVELTIA_PACKAGE}@${version}/dist/sveltia-cms.js`;
export const mirrorUrl = version => `https://cdn.jsdelivr.net/npm/${SVELTIA_PACKAGE}@${version}/dist/sveltia-cms.js`;

const tuple = version => VERSION.test(version ?? '') ? version.split('.').map(Number) : null;

/** Orders two exact x.y.z versions; prerelease or malformed input throws instead of guessing. */
export function compareVersions(a, b) {
  const x = tuple(a), y = tuple(b);
  if (!x || !y) throw new Error(`Cannot compare versions ${JSON.stringify(a)} and ${JSON.stringify(b)}`);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

/** The Subresource Integrity value browsers check for these exact bytes. */
export const sri = bytes => `sha384-${createHash('sha384').update(bytes).digest('base64')}`;

/** The design gate's hash: SHA-256 of the LF-normalized text (scripts/check-art-direction.mjs). */
export const gateHash = text => createHash('sha256').update(String(text).replaceAll('\r\n', '\n')).digest('hex');

/** Reads the one pinned Sveltia script tag; refuses anything it cannot pin safely. */
export function parseSveltiaPin(html) {
  const tags = [...String(html).matchAll(SCRIPT_TAG)];
  if (tags.length !== 1) throw new Error(`Expected exactly one pinned Sveltia CMS script tag, found ${tags.length}`);
  const [tag, version] = tags[0];
  if (!VERSION.test(version)) throw new Error(`Sveltia CMS must be pinned to an exact x.y.z version, not ${JSON.stringify(version)}`);
  const integrity = INTEGRITY.exec(tag)?.[1];
  if (!integrity) throw new Error('The Sveltia CMS script tag needs a sha384 integrity attribute');
  if (!/\bcrossorigin="anonymous"/.test(tag)) throw new Error('The Sveltia CMS script tag needs crossorigin="anonymous" for its integrity check');
  return { version, url: scriptUrl(version), integrity, tag };
}

/** Moves the script tag to `version` with `integrity`, leaving every other byte of the page alone. */
export function rewriteSveltiaPin(html, { version, integrity }) {
  if (!VERSION.test(version ?? '')) throw new Error(`Refusing to pin Sveltia CMS to ${JSON.stringify(version)}`);
  if (!INTEGRITY.test(`integrity="${integrity}"`)) throw new Error('Refusing a malformed sha384 integrity value');
  const current = parseSveltiaPin(html);
  const tag = current.tag.replace(current.url, scriptUrl(version)).replace(current.integrity, integrity);
  const next = String(html).replace(current.tag, () => tag);
  const check = parseSveltiaPin(next);
  if (check.version !== version || check.integrity !== integrity) throw new Error('Sveltia CMS pin rewrite did not take');
  return next;
}

/** Keeps the version the profile guide names in step with the pin. */
export function rewriteGuideVersion(markdown, version) {
  if (!VERSION.test(version ?? '')) throw new Error(`Refusing to name Sveltia CMS version ${JSON.stringify(version)}`);
  const found = [...String(markdown).matchAll(GUIDE_VERSION)].length;
  if (found !== 1) throw new Error(`Expected the Sveltia guide to name the pinned version once as Sveltia **x.y.z**, found ${found}`);
  return String(markdown).replace(GUIDE_VERSION, (_, before, _old, after) => `${before}${version}${after}`);
}

/**
 * Moves the reviewed gate exception for the admin HTML from `before` to `after`, but only while the
 * exception still matches `before`: a stale or hand-edited exception stays a reviewer's decision.
 */
export function rewriteGateException(exceptionsText, file, before, after) {
  const entries = JSON.parse(exceptionsText);
  const entry = Array.isArray(entries) ? entries.filter(item => item.path === file && !item.deleted) : [];
  if (entry.length !== 1) throw new Error(`Expected one design-gate exception for ${file}, found ${entry.length}`);
  const from = gateHash(before), to = gateHash(after);
  if (entry[0].sha256 !== from) throw new Error(`The design-gate exception for ${file} does not match the current file; review it by hand before moving the pin`);
  if (from === to) return exceptionsText;
  const field = `"sha256": "${from}"`;
  if (exceptionsText.split(field).length !== 2) throw new Error(`Cannot locate the design-gate hash for ${file} exactly once`);
  return exceptionsText.replace(field, `"sha256": "${to}"`);
}

/** The report entry for the pin: same status vocabulary as the package report. */
export function sveltiaPinStatus(pin, metadata) {
  const latest = metadata?.['dist-tags']?.latest;
  if (!tuple(latest)) throw new Error('Latest stable Sveltia CMS metadata unavailable');
  return {
    name: SVELTIA_PACKAGE,
    kind: 'cdn-script',
    file: SVELTIA_ADMIN_HTML,
    pinned: pin.version,
    integrity: pin.integrity,
    availableStable: latest,
    releaseDate: metadata.time?.[latest] ?? null,
    upstreamStatus: compareVersions(latest, pin.version) > 0 ? 'update-available' : 'current',
    source: `https://www.npmjs.com/package/${SVELTIA_PACKAGE}`,
  };
}

const USER_AGENT = { 'User-Agent': 'baseline-upstream-review' };
async function npmMetadata(name) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, { headers: USER_AGENT, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`npm registry HTTP ${response.status}`);
  return response.json();
}
async function download(url) {
  const response = await fetch(url, { headers: USER_AGENT, redirect: 'follow', signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

/** Report-only: null when this checkout has no static-sveltia profile (an installed EmDash site). */
export async function checkSveltiaPin(root = ROOT, { packageLookup = npmMetadata } = {}) {
  const file = path.join(root, SVELTIA_ADMIN_HTML);
  if (!existsSync(file)) return null;
  try {
    const pin = parseSveltiaPin(readFileSync(file, 'utf8'));
    return sveltiaPinStatus(pin, await packageLookup(SVELTIA_PACKAGE));
  } catch (error) {
    return { name: SVELTIA_PACKAGE, kind: 'cdn-script', file: SVELTIA_ADMIN_HTML, upstreamStatus: 'unverified', reason: error.message };
  }
}

/**
 * Moves the pin to `version` (default: npm's latest). Every check runs before the first write, so
 * a failure leaves the checkout untouched.
 */
export async function applySveltiaPin(root = ROOT, { packageLookup = npmMetadata, fetchBytes = download, version } = {}) {
  const read = relative => readFileSync(path.join(root, relative), 'utf8');
  const html = read(SVELTIA_ADMIN_HTML);
  const pin = parseSveltiaPin(html);
  const metadata = await packageLookup(SVELTIA_PACKAGE);
  const target = version ?? metadata?.['dist-tags']?.latest;
  if (!tuple(target)) throw new Error(`No exact Sveltia CMS version to pin (got ${JSON.stringify(target)})`);
  if (!metadata?.versions?.[target]) throw new Error(`Sveltia CMS ${target} is not published on npm`);
  if (metadata.versions[target].deprecated) throw new Error(`Sveltia CMS ${target} is deprecated on npm`);
  if (compareVersions(target, pin.version) <= 0) return { status: 'current', from: pin.version, to: pin.version, integrity: pin.integrity };

  const bytes = await fetchBytes(scriptUrl(target));
  if (!bytes?.length) throw new Error(`Empty Sveltia CMS script at ${scriptUrl(target)}`);
  const integrity = sri(bytes);
  const mirrored = await fetchBytes(mirrorUrl(target));
  if (!mirrored?.length || sri(mirrored) !== integrity) throw new Error(`Sveltia CMS ${target} differs between ${scriptUrl(target)} and ${mirrorUrl(target)}; not pinning`);

  const nextHtml = rewriteSveltiaPin(html, { version: target, integrity });
  const nextGuide = rewriteGuideVersion(read(SVELTIA_GUIDE), target);
  const nextExceptions = rewriteGateException(read(GATE_EXCEPTIONS), SVELTIA_ADMIN_HTML, html, nextHtml);
  writeFileSync(path.join(root, SVELTIA_ADMIN_HTML), nextHtml);
  writeFileSync(path.join(root, SVELTIA_GUIDE), nextGuide);
  writeFileSync(path.join(root, GATE_EXCEPTIONS), nextExceptions);
  return { status: 'applied', from: pin.version, to: target, integrity, bytes: bytes.length, files: [SVELTIA_ADMIN_HTML, SVELTIA_GUIDE, GATE_EXCEPTIONS] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    const at = args.indexOf('--version');
    const result = args.includes('--apply')
      ? await applySveltiaPin(ROOT, at >= 0 ? { version: args[at + 1] } : {})
      : await checkSveltiaPin(ROOT);
    console.log(JSON.stringify(result, null, 2));
    if (result?.upstreamStatus === 'unverified') process.exitCode = 1;
  } catch (error) {
    console.error(`[sveltia-pin] ${error.message}`);
    process.exitCode = 1;
  }
}
