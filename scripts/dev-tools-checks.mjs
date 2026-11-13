// Site-neutral helpers for check-dev-tools.mjs. They hold no starter sample copy, fixed script
// list or exact header string, so the release-isolation check keeps working on customized sites.
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';

const RELATIVE_IMPORT = /(?:\bfrom\s*|\bimport\s*\(?\s*)['"](\.{1,2}\/[^'"]+)['"]/g;

/**
 * Copy every local JavaScript module reachable from `entry` by relative import into `stage`,
 * following imports transitively. Directories that the caller copies whole are skipped, as is
 * anything that resolves outside `root`. Returns the copied paths (POSIX, relative to root).
 */
export async function copyConfigImports(root, stage, entry, { copiedWhole = ['src', 'public', 'seed', 'node_modules'] } = {}, seen = new Set(), copied = []) {
  if (seen.has(entry)) return copied;
  seen.add(entry);
  const source = await readFile(path.join(root, entry), 'utf8');
  for (const [, specifier] of source.matchAll(RELATIVE_IMPORT)) {
    const relative = path.relative(root, path.resolve(root, path.dirname(entry), specifier)).split(path.sep).join('/');
    if (relative.startsWith('..') || path.isAbsolute(relative)) continue;
    if (copiedWhole.some(directory => relative.startsWith(directory + '/'))) continue;
    if (!/\.(mjs|js|cjs)$/.test(relative) || seen.has(relative)) continue;
    await mkdir(path.dirname(path.join(stage, relative)), { recursive: true });
    await copyFile(path.join(root, relative), path.join(stage, relative));
    copied.push(relative);
    await copyConfigImports(root, stage, relative, { copiedWhole }, seen, copied);
  }
  return copied;
}

/**
 * The public home must be the site's own rendered page, never a setup, login or crash response.
 * Sites replace the starter's sample copy, and a schema-only seed has no home entry yet, so the
 * site's own 404 page (with its heading) is accepted alongside a seeded 200. Public pages embed
 * the editor script, which names the login URL, so the verdict uses where the request ended
 * rather than searching the markup for that URL. Returns the observed status.
 */
export async function assertPublicPage(response, message) {
  const html = await response.text();
  assert.ok([200, 404].includes(response.status), `${message}: status ${response.status}`);
  assert.ok(/<h1\b/i.test(html), `${message}: no page heading`);
  const finalPath = new URL(response.url).pathname;
  assert.ok(!finalPath.startsWith('/_emdash/'), `${message}: redirected to ${finalPath}`);
  return response.status;
}

/** True when a Cache-Control value carries the no-store directive, alone or beside stricter ones such as `private`. */
export function forbidsStorage(cacheControl) {
  return /(?:^|,)\s*no-store\s*(?:,|$)/i.test(cacheControl ?? '');
}
