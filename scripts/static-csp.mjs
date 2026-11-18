// Content-Security-Policy for static builds.
//
// EmDash sites compute a policy per response in middleware. A static site has no server, so the
// build computes one site-wide policy instead: every inline <script> and <style> in the built
// HTML is hashed, and the union goes into dist/_headers for the host to send (Cloudflare Workers
// static assets, Cloudflare Pages and Netlify read that file). The policy text is also written to
// dist/.baseline-csp.txt for hosts that set headers elsewhere.
//
// Off by default. CSP_MODE=report sends Content-Security-Policy-Report-Only; CSP_MODE=enforce
// sends Content-Security-Policy. CSP_SOURCES adds origins, as on EmDash sites. Both are read from
// the build environment, then from .env.production and .env.
import { existsSync, readFileSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parseEnv } from 'node:util';
import { buildPolicy, cspMode, hashSource, inlineBlocks, parseSources } from '../src/lib/content-security-policy.ts';

export const CSP_RECEIPT = '.baseline-csp.txt';
// Cloudflare refuses longer header lines in _headers.
export const HEADER_LINE_LIMIT = 2000;

/** CSP_MODE and CSP_SOURCES from the process environment, then .env.production, then .env. */
export function cspSettings(root, env = process.env) {
  const files = ['.env.production', '.env'].map(name => path.join(root, name)).filter(file => existsSync(file));
  const fromFiles = Object.assign({}, ...files.reverse().map(file => parseEnv(readFileSync(file, 'utf8'))));
  const value = name => env[name] ?? fromFiles[name];
  return { mode: cspMode(value('CSP_MODE')), extra: parseSources(value('CSP_SOURCES')) };
}

async function htmlFiles(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await htmlFiles(file));
    else if (entry.isFile() && entry.name.endsWith('.html')) found.push(file);
  }
  return found.sort();
}

/** One policy covering every inline block in the built pages. */
export async function staticPolicy(directory, extra = {}) {
  const scripts = new Set(), styles = new Set();
  const pages = await htmlFiles(directory);
  for (const file of pages) {
    const blocks = inlineBlocks(await readFile(file, 'utf8'));
    for (const block of blocks.scripts) scripts.add(await hashSource(block));
    for (const block of blocks.styles) styles.add(await hashSource(block));
  }
  return { pages: pages.length, policy: buildPolicy({ scripts: [...scripts].sort(), styles: [...styles].sort() }, extra) };
}

/** Adds the policy to dist/_headers for every path, unless the site's own _headers already sets one. */
export function withPolicyHeader(existing, header, policy) {
  if (/^\s*content-security-policy(?:-report-only)?\s*:/im.test(existing)) return { text: existing, skipped: true };
  const block = `/*\n  ${header}: ${policy}\n`;
  return { text: existing ? existing.replace(/\s*$/, '\n\n') + block : block, skipped: false };
}

export async function writeStaticCsp({ directory, root, logger = console, env = process.env }) {
  const { mode, extra } = cspSettings(root, env);
  if (mode === 'off') return null;
  const { pages, policy } = await staticPolicy(directory, extra);
  const header = mode === 'enforce' ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';
  const headersFile = path.join(directory, '_headers');
  const existing = existsSync(headersFile) ? await readFile(headersFile, 'utf8') : '';
  const { text, skipped } = withPolicyHeader(existing, header, policy);
  await writeFile(path.join(directory, CSP_RECEIPT), `${header}: ${policy}\n`);
  if (skipped) {
    logger.warn(`CSP: _headers already sets a Content-Security-Policy; left unchanged. The computed policy is in ${CSP_RECEIPT}.`);
    return { mode, header, policy, pages, skipped };
  }
  if (`  ${header}: ${policy}`.length > HEADER_LINE_LIMIT) logger.warn(`CSP: the policy line is longer than ${HEADER_LINE_LIMIT} characters, which Cloudflare refuses in _headers. Move repeated inline code into bundled scripts, or set the header at the host from ${CSP_RECEIPT}.`);
  await writeFile(headersFile, text);
  logger.info(`CSP: ${header} for ${pages} pages written to _headers (${mode}).`);
  return { mode, header, policy, pages, skipped };
}
