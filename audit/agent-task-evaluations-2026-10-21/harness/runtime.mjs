import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { availableLoopbackPort } from '../../../scripts/loopback-port.mjs';

export const root = process.cwd();
export const control = path.join(root, '.emdash/checks/agent-task-evals');
export const state = () => JSON.parse(fs.readFileSync(path.join(control, 'state.json')));
export const trialOf = id => state().trials.find(trial => trial.id === id);
export function writeJSON(file, value) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n'); }
export async function npmRun(directory, args, log, { timeout = 600000, allowFailure = false } = {}) {
  fs.mkdirSync(path.dirname(log), { recursive: true }); const fd = fs.openSync(log, 'w');
  const child = spawn(process.execPath, ['C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js', ...args], { cwd: directory, windowsHide: true, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', fd, fd] });
  const timer = setTimeout(() => child.kill(), timeout);
  let code; try { [code] = await once(child, 'exit'); } finally { clearTimeout(timer); fs.closeSync(fd); }
  if (code !== 0 && !allowFailure) throw Error(args.join(' ') + ': ' + fs.readFileSync(log, 'utf8').slice(-2200));
  return { code, log };
}
export async function serveStatic(directory) {
  const port = await availableLoopbackPort();
  const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };
  const server = http.createServer((request, response) => {
    let pathname; try { pathname = decodeURIComponent(new URL(request.url, 'http://local.test').pathname); } catch { response.writeHead(400); response.end(); return; }
    const relative = pathname.replace(/^\/+/, '');
    if (relative.split('/').includes('..') || relative.includes('\\')) { response.writeHead(400); response.end(); return; }
    const candidates = [relative, path.join(relative, 'index.html'), relative + '.html'];
    const file = candidates.map(name => path.join(directory, name)).find(file => fs.existsSync(file) && fs.statSync(file).isFile());
    const target = file ?? path.join(directory, '404.html');
    response.writeHead(file ? 200 : 404, { 'content-type': mime[path.extname(target)] ?? 'application/octet-stream' });
    response.end(fs.existsSync(target) ? fs.readFileSync(target) : 'Not found');
  });
  server.listen(port, '127.0.0.1'); await once(server, 'listening');
  return { origin: 'http://127.0.0.1:' + port, stop: async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } };
}
export async function serveCMS(directory, log) {
  const port = await availableLoopbackPort(), origin = 'http://127.0.0.1:' + port;
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(PATH|PATHEXT|SYSTEMROOT|WINDIR|COMSPEC|TEMP|TMP|HOME|USERPROFILE|LOCALAPPDATA|APPDATA)$/i.test(key)));
  Object.assign(env, { ASTRO_TELEMETRY_DISABLED: '1' });
  fs.mkdirSync(path.dirname(log), { recursive: true }); const fd = fs.openSync(log, 'w');
  const child = spawn(process.execPath, ['--env-file-if-exists=.env', 'node_modules/astro/bin/astro.mjs', 'dev', '--host', '127.0.0.1', '--port', String(port)], { cwd: directory, env, windowsHide: true, stdio: ['ignore', fd, fd] });
  const stop = async () => { if (child.exitCode === null) { const done = once(child, 'exit'); child.kill(); await done; } fs.closeSync(fd); };
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) { await stop(); throw Error('CMS exited before readiness'); }
    try { const r = await fetch(origin + '/', { signal: AbortSignal.timeout(2000) }); if (r.status < 500) return { origin, stop }; } catch {}
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  await stop(); throw Error('CMS readiness timed out');
}

if (process.argv[2] === 'bootstrap-cms') {
  const trial = trialOf(process.argv[3]);
  const server = await serveCMS(trial.site, path.join(control, trial.id + '-bootstrap.log'));
  try {
    const setup = await fetch(server.origin + '/_emdash/api/setup/dev-bypass', { redirect: 'manual' });
    if (setup.status >= 400) throw Error('Synthetic CMS setup failed: ' + setup.status);
    const auth = await fetch(server.origin + '/_emdash/api/auth/dev-bypass', { redirect: 'manual' });
    const cookie = auth.headers.get('set-cookie')?.split(';')[0];
    if (!cookie) throw Error('Synthetic CMS development session unavailable');
    const r = await fetch(server.origin + '/_emdash/api/content/posts?status=all&limit=20', { headers: { cookie } });
    const data = await r.json();
    const text = JSON.stringify(data);
    if (!r.ok || !text.includes('planning-your-first-workshop') || !text.includes('unannounced-workshop')) throw Error('Expected synthetic posts not present');
    writeJSON(path.join(control, trial.id + '-bootstrap.json'), { status: 'pass', syntheticOnly: true, databaseReady: true, originalDatabaseCopied: false, fixturePosts: ['planning-your-first-workshop', 'unannounced-workshop'] });
    console.log(trial.id + ' CMS initialized with synthetic published/draft posts.');
  } finally { await server.stop(); }
}
