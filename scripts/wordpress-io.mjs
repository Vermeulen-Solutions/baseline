import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP, BlockList } from 'node:net';
import https from 'node:https';
import http from 'node:http';

export const WP_LIMITS = Object.freeze({ items: 10000, pages: 500, responseBytes: 16 * 1024 * 1024, mediaBytes: 32 * 1024 * 1024, totalBytes: 1024 * 1024 * 1024, timeout: 20000, runTimeout: 15 * 60 * 1000, requests: 20000 });
export class WordPressMigrationError extends Error {}
export const fact = (ok, message) => { if (!ok) throw new WordPressMigrationError(message); };
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export const jsonBytes = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');
export const safeKey = key => typeof key === 'string' && key.length > 0 && key.length < 600 && !/[\\:\u0000-\u001f\u007f]/.test(key) && key.split('/').every(part => part && part !== '.' && part !== '..') && !path.posix.isAbsolute(key);
export function noLinks(file) {
  const absolute = path.resolve(file);
  let cursor = path.parse(absolute).root;
  for (const part of absolute.slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, part);
    try { fact(!fs.lstatSync(cursor).isSymbolicLink(), 'Linked paths are refused'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return absolute;
}
export const inside = (root, file) => file === root || file.startsWith(root + path.sep);
export function backupRoot(root) {
  root = noLinks(root);
  const config = path.join(root, 'baseline.config.json');
  return path.join(root, fs.existsSync(config) && JSON.parse(fs.readFileSync(config, 'utf8')).foundation === 'static' ? '.baseline' : '.emdash', 'backups');
}
export function privateDirectory(out, root = process.cwd()) {
  const directory = noLinks(out), allowed = noLinks(backupRoot(root));
  fact(inside(allowed, directory) && directory !== allowed && !fs.existsSync(directory), 'Use a new directory inside the project ignored backups directory');
  // Do not turn a missing .gitignore into permission to put private captures in Git.
  const ignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
  const relative = path.relative(root, allowed).split(path.sep).join('/');
  fact(ignore.split(/\r?\n/).some(line => [relative + '/', '/' + relative + '/', relative.split('/')[0] + '/', '/' + relative.split('/')[0] + '/'].includes(line.trim())), 'Project must ignore its private backup root');
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  return directory;
}
export function readBytes(file, max = WP_LIMITS.responseBytes) {
  file = noLinks(file);
  const stat = fs.statSync(file);
  fact(stat.isFile() && stat.size <= max, 'Input is missing, oversized or not a regular file');
  return fs.readFileSync(file);
}
export function createFile(root, key, bytes) {
  fact(safeKey(key), 'Unsafe output path');
  const file = noLinks(path.join(root, key));
  fact(inside(noLinks(root), file), 'Output escapes its directory');
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  fs.writeFileSync(file, bytes, { flag: 'wx', mode: 0o600 });
}
export function writeBundle(directory, files, kind, metadata = {}) {
  const inventory = [];
  for (const [key, value] of files) {
    const bytes = Buffer.isBuffer(value) ? value : Buffer.from(value);
    createFile(directory, key, bytes);
    inventory.push({ path: key, bytes: bytes.length, sha256: digest(bytes) });
  }
  const manifest = { version: 1, kind, ...metadata, files: inventory };
  const bytes = jsonBytes(manifest);
  createFile(directory, 'manifest.json', bytes);
  return { manifest, sha256: digest(bytes) };
}
export function readBundle(directory, kind) {
  directory = noLinks(directory);
  const bytes = readBytes(path.join(directory, 'manifest.json'));
  const manifest = JSON.parse(bytes);
  fact(manifest.version === 1 && manifest.kind === kind && Array.isArray(manifest.files) && manifest.files.length <= 30000, 'Unsupported bundle');
  const files = new Map();
  for (const entry of manifest.files) {
    fact(safeKey(entry.path) && !files.has(entry.path), 'Invalid or duplicate bundle path');
    const value = readBytes(path.join(directory, entry.path), WP_LIMITS.mediaBytes);
    fact(value.length === entry.bytes && digest(value) === entry.sha256, 'Bundle bytes changed');
    files.set(entry.path, value);
  }
  return { directory, manifest, files, sha256: digest(bytes) };
}

const reserved = new BlockList();
for (const [network, bits] of [['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16], ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16], ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4]]) reserved.addSubnet(network, bits, 'ipv4');
for (const [network, bits] of [['2001::', 23], ['2001:db8::', 32], ['2002::', 16], ['3fff::', 20]]) reserved.addSubnet(network, bits, 'ipv6');
export function publicAddress(address) {
  const family = isIP(address);
  if (family === 4) return !reserved.check(address, 'ipv4');
  // Global unicast only; this also refuses IPv4-mapped IPv6, NAT64 and local scopes.
  return family === 6 && /^[23]/i.test(address) && !reserved.check(address, 'ipv6');
}
export function sourceURL(value) {
  const url = new URL(value);
  fact(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && !/%2f|%5c|%2e/i.test(url.pathname), 'WordPress source must be an HTTPS URL without credentials, query or fragment');
  fact(!isIP(url.hostname.replace(/^\[|\]$/g, '')) && url.hostname.includes('.') && !/\.local$|\.localhost$/i.test(url.hostname), 'Source must use a public hostname');
  url.pathname = url.pathname.replace(/\/+$/, '') + '/';
  return url;
}

/** DNS is resolved once and pinned to the connection. Redirect handling belongs to the caller. */
export async function publicRequest(url, { headers = {}, maxBytes = WP_LIMITS.responseBytes, timeout = WP_LIMITS.timeout } = {}) {
  url = new URL(url);
  fact(url.protocol === 'https:' && !url.username && !url.password, 'Only HTTPS destinations without URL credentials are allowed');
  const addresses = await Promise.race([lookup(url.hostname, { all: true, verbatim: true }), new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('DNS request timed out')), timeout); timer.unref(); })]);
  fact(addresses.length > 0 && addresses.every(item => publicAddress(item.address)), 'Destination resolves to a private or reserved address');
  const pinned = addresses[0];
  return new Promise((resolve, reject) => {
    const request = (url.protocol === 'https:' ? https : http).request(url, {
      method: 'GET', headers: { 'user-agent': 'Baseline-WordPress-Migration/1', 'accept-encoding': 'identity', ...headers },
      lookup: (_hostname, options, callback) => options.all ? callback(null, [pinned]) : callback(null, pinned.address, pinned.family),
    }, response => {
      const chunks = []; let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > maxBytes) { response.destroy(); reject(new Error('Response exceeds the byte bound')); }
        else chunks.push(chunk);
      });
      response.on('error', () => reject(new Error('Response stream interrupted')));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks) }));
    });
    const timer = setTimeout(() => request.destroy(new Error('Request timed out')), timeout);
    request.on('close', () => clearTimeout(timer));
    request.on('error', () => reject(new Error('WordPress request unavailable or timed out')));
    request.end();
  });
}

export function requester({ request = publicRequest, allowedOrigins, authorization, sourceOrigin, maxRequests = WP_LIMITS.requests } = {}) {
  let count = 0, total = 0; const started = Date.now();
  return async (initial, { authenticated = false, maxBytes, allowedStatuses = [200] } = {}) => {
    let current = new URL(initial);
    for (let hop = 0; hop <= 5; hop++) {
      fact(count++ < maxRequests && Date.now() - started <= WP_LIMITS.runTimeout && allowedOrigins.has(current.origin) && current.protocol === 'https:' && !current.username && !current.password, 'Request budget or declared destination boundary exceeded');
      fact(!authenticated || current.origin === sourceOrigin, 'Credentials cannot leave the WordPress origin');
      // Credentialed API calls never redirect, even within the same origin.
      const response = await request(current, { maxBytes, headers: { accept: authenticated ? 'application/json' : '*/*', ...(authenticated ? { authorization } : {}) } });
      total += response.body.length;
      fact(total <= WP_LIMITS.totalBytes, 'Capture exceeds the total byte bound');
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        fact(!authenticated && response.headers.location && hop < 5, 'API redirect or media redirect limit refused');
        current = new URL(response.headers.location, current); continue;
      }
      fact(!authenticated || current.origin === sourceOrigin, 'Credentials cannot leave the WordPress origin');
      fact(allowedStatuses.includes(response.status) && response.headers['cf-mitigated'] !== 'challenge', 'WordPress response failed; check exporter, credentials and source protection');
      return response;
    }
    throw new Error('Redirect limit exceeded');
  };
}
