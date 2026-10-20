import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { scanHTML } from './html-tags.mjs';
import { assertReleaseArtifact } from './assert-release-artifact.mjs';
import { availableLoopbackPort } from './loopback-port.mjs';

/** Anonymous, loopback-only GETs against the existing local production CMS.
 * No setup bypass, seeding, authentication or external redirect is performed.
 */
export async function snapshotSSR({ directory = 'dist', cwd = process.cwd(), routes = ['/'],
  timeoutMs = 3500, signal, onSpawn, maxResources = 64, maxBytes = 2_000_000 } = {}) {
  const started = performance.now(), root = path.resolve(cwd), artifact = path.resolve(root, directory);
  await assertReleaseArtifact(artifact);
  const entry = path.join(artifact, 'server/entry.mjs');
  if (!fs.statSync(entry).isFile()) throw Error('SSR snapshots require a Node standalone server/entry.mjs');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 4000) throw Error('SSR capture deadline must be between 1 and 4000ms');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(Error('SSR snapshot deadline exceeded')), timeoutMs);
  const interrupt = () => controller.abort(Error('SSR snapshot interrupted'));
  const abort = () => controller.abort(signal.reason);
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  for (const event of ['SIGINT', 'SIGTERM']) process.on(event, interrupt);
  let child, exited, failure, logs = '', address, out, result;
  const check = () => {
    controller.signal.throwIfAborted();
    if (failure) throw failure;
    if (child && (child.exitCode !== null || child.signalCode !== null)) throw Error('SSR server exited before capture completed');
  };
  try {
    check();
    const parent = path.join(root, '.emdash/snapshots');
    fs.mkdirSync(parent, { recursive: true });
    out = fs.mkdtempSync(path.join(parent, 'capture-'));
    const port = await availableLoopbackPort();
    check();
    child = spawn(process.execPath, ['--env-file-if-exists=' + path.join(root, '.env'), entry], {
      cwd: root, env: { ...process.env, NODE_ENV: 'production', HOST: '127.0.0.1', PORT: String(port), ASTRO_TEST_FIXTURES: '0' },
      windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
    });
    // Register immediately, before the first await, including spawn failures.
    exited = new Promise(resolve => { child.once('close', resolve); child.once('error', error => { failure = error; resolve(); }); });
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', text => {
      logs = (logs + text).slice(-8192);
      address ??= logs.match(/Server listening on http:\/\/127\.0\.0\.1:(\d+)/)?.[1];
    });
    // Drain stderr without echoing runtime secrets or private server diagnostics.
    child.stderr.on('data', () => {});
    onSpawn?.(child);
    while (!address) { check(); await delay(15, undefined, { signal: controller.signal }); }
    const origin = `http://127.0.0.1:${address}`;
    const resources = new Map(), queued = new Set(), queue = [];
    const enqueue = route => {
      const url = new URL(route, origin);
      if (url.origin !== origin || url.username || url.password) throw Error('SSR capture only accepts local public routes');
      const key = url.pathname + url.search;
      if (!queued.has(key)) {
        if (queued.size >= maxResources) throw Error(`SSR link crawl exceeds ${maxResources} resources`);
        queued.add(key); queue.push(key);
      }
      return key;
    };
    for (const route of routes) enqueue(route);
    // Request a guaranteed missing route, rather than treating /404 status 200
    // or a setup/login response as successful error-page coverage.
    const missing = enqueue('/baseline-audit-missing-' + randomUUID());
    let pageCount = 0;
    for (let at = 0; at < queue.length; at++) {
      check();
      const route = queue[at];
      const response = await fetch(origin + route, { redirect: 'manual', signal: controller.signal, headers: { accept: 'text/html' } });
      const resource = { url: route, status: response.status };
      resources.set(route, resource);
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) throw Error(`Missing redirect Location while capturing ${route}`);
        const target = new URL(location, origin + route);
        // Never follow an external redirect or a production authentication flow.
        if (target.origin !== origin) throw Error(`External redirect while capturing ${route}`);
        if (target.pathname.startsWith('/_emdash/')) throw Error(`SSR ${route} redirects to CMS setup/auth; initialize the local CMS first`);
        resource.redirect = enqueue(target.pathname + target.search);
        // An explicit redirect fragment overrides the incoming link's fragment;
        // otherwise browsers inherit it, including across multiple redirects.
        if (location.includes('#')) resource.fragment = target.hash;
        await response.body?.cancel();
        continue;
      }
      if (!response.headers.get('content-type')?.toLowerCase().includes('text/html')) {
        await response.body?.cancel(); continue;
      }
      const parts = []; let size = 0;
      for await (const part of response.body) {
        size += part.length;
        if (size > maxBytes) throw Error(`SSR HTML exceeds ${maxBytes} bytes: ${route}`);
        parts.push(part);
      }
      const html = Buffer.concat(parts).toString('utf8');
      resource.file = `page-${pageCount++}.html`;
      fs.writeFileSync(path.join(out, resource.file), html);
      const tags = scanHTML(html);
      const canonical = tags.find(t => t.name === 'link' && t.attrs.rel?.split(/\s+/i).includes('canonical'));
      let publicOrigin = origin;
      try { if (canonical) publicOrigin = new URL(canonical.attrs.href).origin; } catch { /* auditor reports malformed SEO */ }
      let base = new URL(route, publicOrigin);
      const baseTag = tags.find(t => t.name === 'base' && t.attrs.href !== undefined);
      try { if (baseTag) base = new URL(baseTag.attrs.href, base); } catch { /* auditor reports malformed base */ }
      for (const tag of tags) if (tag.name === 'a' && tag.attrs.href !== undefined) {
        try {
          const url = new URL(tag.attrs.href, base);
          if ([origin, publicOrigin].includes(url.origin) && ['http:', 'https:'].includes(url.protocol)) enqueue(url.pathname + url.search);
        } catch (error) { if (error.message.startsWith('SSR link crawl')) throw error; }
      }
    }
    const resolve = route => {
      const visited = new Set();
      while (resources.get(route)?.redirect) {
        if (visited.has(route)) throw Error(`SSR redirect loop: ${route}`);
        visited.add(route); route = resources.get(route).redirect;
      }
      return resources.get(route);
    };
    for (const route of routes) {
      const result = resolve(new URL(route, origin).pathname + new URL(route, origin).search);
      if (result?.status !== 200 || !result.file) throw Error(`SSR public route did not render HTML with status 200: ${route}`);
    }
    if (resolve(missing)?.status !== 404 || !resolve(missing)?.file) throw Error('SSR missing route must render an HTML error page with status 404');
    if (![...resources.values()].some(r => r.url !== '/' && r.status === 200 && r.file)) throw Error('SSR capture needs a linked published sample page or post');
    fs.writeFileSync(path.join(out, '.ssr-snapshot.json'), JSON.stringify({ version: 1, origin, resources: [...resources.values()] }, null, 2) + '\n');
    check();
    result = { directory: out, htmlFiles: pageCount, resources: resources.size };
    return result;
  } catch (error) {
    if (out) fs.writeFileSync(path.join(out, 'capture-error.txt'), controller.signal.aborted ? String(controller.signal.reason) : error.message);
    throw controller.signal.aborted ? controller.signal.reason : error;
  } finally {
    clearTimeout(timer);
    controller.abort();
    try {
      if (child && child.exitCode === null && child.signalCode === null) {
        child.kill('SIGTERM');
        const force = setTimeout(() => child.kill('SIGKILL'), 250);
        try { await Promise.race([exited, delay(750, undefined, { ref: false }).then(() => { throw Error('SSR server did not exit after SIGKILL'); })]); }
        finally { clearTimeout(force); }
      } else if (exited) await exited;
    } finally {
      signal?.removeEventListener('abort', abort);
      for (const event of ['SIGINT', 'SIGTERM']) process.removeListener(event, interrupt);
      if (result) result.durationMs = performance.now() - started;
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    if (process.argv.length > 3 || process.argv[2]?.startsWith('-')) throw Error('Usage: node scripts/snapshot-ssr.mjs [dist]');
    const result = await snapshotSSR({ directory: process.argv[2] });
    console.log(`SSR snapshots: ${result.htmlFiles} HTML files saved to ${result.directory} (${result.durationMs.toFixed(1)}ms).`);
  } catch (error) { console.error(`SSR snapshots: ${error.message}`); process.exitCode = 1; }
}
