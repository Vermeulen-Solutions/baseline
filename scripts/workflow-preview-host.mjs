// Private controller child for a replay-owned static Astro preview.
import { spawn } from 'node:child_process';
import http from 'node:http';

const [site, port, controlPort, token, stateFile] = process.argv.slice(2);
if (!site || !port || !controlPort || !token || !stateFile) throw Error('Preview host requires owned site, ports, capability and state file');
const child = spawn(process.execPath, ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', port], { cwd: site, shell: false, windowsHide: true, stdio: 'ignore', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } });
let childExit = null;
child.once('exit', (code, signal) => { childExit = { code, signal }; });
const waitForChildExit = async () => {
  if (childExit) return;
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 5000))]);
  if (!childExit) {
    child.kill('SIGKILL');
    await Promise.race([new Promise(resolve => child.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 2000))]);
  }
};
const server = http.createServer(async (request, response) => {
  if (request.headers.authorization !== `Bearer ${token}`) { response.writeHead(404); response.end(); return; }
  if (request.url === '/status') { response.writeHead(200, { 'content-type': 'application/json' }); response.end(JSON.stringify({ alive: !childExit, childExit })); return; }
  if (request.url === '/stop' && request.method === 'POST') {
    response.writeHead(200); response.end('stopping'); child.kill();
    void (async () => { await waitForChildExit(); server.closeAllConnections(); server.close(); process.exit(0); })();
    return;
  }
  response.writeHead(404); response.end();
});
server.listen(Number(controlPort), '127.0.0.1');
await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
let ready = false, error = null;
for (let i = 0; i < 300 && !childExit; i++) {
  try { const result = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1000), redirect: 'manual' }); if (result.status < 500) { ready = true; break; } } catch {}
  await new Promise(resolve => setTimeout(resolve, 200));
}
if (!ready) error = childExit ? 'Astro preview exited before readiness' : 'Astro preview readiness timeout';
const fs = await import('node:fs'); fs.writeFileSync(stateFile, JSON.stringify({ ready, error, controlPort: Number(controlPort), previewPort: Number(port), pid: process.pid }));
if (!ready) { child.kill(); server.close(); process.exitCode = 1; }
