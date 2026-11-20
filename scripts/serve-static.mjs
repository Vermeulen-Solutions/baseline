#!/usr/bin/env node
// A small static server for local captures: concept HTML (audit/visual-concepts), a built dist/, or any
// folder of pages that capture:routes, audit:composition or design:sheet need a URL for.
//
//   npm run serve:static -- --dir audit/visual-concepts --port 4400
//   npm run serve:static -- --dir dist --port 4401
//
// Listens on 127.0.0.1 only, serves files inside --dir and nothing outside it, answers a folder with its
// index.html, and stops with Ctrl+C (or by its port). Not a production server.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const TYPES = Object.freeze({
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml', '.ics': 'text/calendar; charset=utf-8', '.mp4': 'video/mp4', '.webm': 'video/webm',
});

export function parseArgs(argv) {
  const out = { dir: null, port: 4400 };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => { const v = argv[++i]; if (v === undefined || v.startsWith('--')) throw Error('Missing value for ' + flag); return v; };
    if (flag === '--dir') out.dir = value();
    else if (flag === '--port') out.port = Number(value());
    else if (flag === '--help' || flag === '-h') out.help = true;
    else throw Error('Unknown option: ' + flag);
  }
  if (out.help) return out;
  if (!out.dir) throw Error('--dir <folder> is required');
  if (!Number.isInteger(out.port) || out.port < 1024 || out.port > 65535) throw Error('--port must be an integer between 1024 and 65535');
  return out;
}

/** The file a request path maps to inside root, or null when it would leave root. */
export function resolveRequest(root, urlPath) {
  let decoded;
  try { decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]); } catch { return null; }
  if (decoded.includes('\0')) return null;
  const base = path.resolve(root);
  const target = path.resolve(base, '.' + path.posix.normalize('/' + decoded.replace(/\\/g, '/')));
  if (target !== base && !target.startsWith(base + path.sep)) return null;
  return target;
}

export function serve({ dir, port }) {
  const root = path.resolve(dir);
  const server = createServer((req, res) => {
    let file = resolveRequest(root, req.url ?? '/');
    if (file && existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!file || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(file).pipe(res);
  });
  server.listen(port, '127.0.0.1');
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) console.log('Usage: npm run serve:static -- --dir <folder> [--port 4400]\nServes the folder on http://127.0.0.1:<port>/ for captures; Ctrl+C or stopping the port ends it.');
    else {
      if (!existsSync(options.dir) || !statSync(options.dir).isDirectory()) throw Error(`--dir ${options.dir} is not a folder`);
      const server = serve(options);
      server.on('listening', () => console.log(`Serving ${path.resolve(options.dir)} on http://127.0.0.1:${options.port}/`));
      server.on('error', (error) => { console.error(error.code === 'EADDRINUSE' ? `Port ${options.port} is in use: pick another with --port.` : error.message); process.exitCode = 1; });
    }
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
