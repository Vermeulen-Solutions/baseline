import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, resolveRequest, serve } from '../scripts/serve-static.mjs';

test('arguments: a folder is required and the port is checked', () => {
  assert.deepEqual(parseArgs(['--dir', 'dist', '--port', '4401']), { dir: 'dist', port: 4401 });
  assert.throws(() => parseArgs([]), /--dir <folder> is required/);
  assert.throws(() => parseArgs(['--dir', 'dist', '--port', '80']), /--port must be/);
});

test('requests never leave the served folder', () => {
  const root = path.resolve('fixture-root');
  assert.equal(resolveRequest(root, '/concept-a.html'), path.join(root, 'concept-a.html'));
  assert.equal(resolveRequest(root, '/'), root);
  assert.equal(resolveRequest(root, '/../secret.txt'), path.join(root, 'secret.txt'));
  assert.equal(resolveRequest(root, '/%2e%2e/%2e%2e/secret.txt'), path.join(root, 'secret.txt'));
  assert.equal(resolveRequest(root, '/a%00b'), null);
});

test('serves files and folder indexes on 127.0.0.1, 404 otherwise', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'serve-static-'));
  mkdirSync(path.join(dir, 'la-carte'));
  writeFileSync(path.join(dir, 'index.html'), '<h1>home</h1>');
  writeFileSync(path.join(dir, 'la-carte', 'index.html'), '<h1>carte</h1>');
  const server = serve({ dir, port: 0 });
  try {
    await new Promise((resolve) => server.on('listening', resolve));
    const { port } = server.address();
    const get = (p) => fetch(`http://127.0.0.1:${port}${p}`);
    const home = await get('/');
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-type'), /text\/html/);
    assert.equal(await home.text(), '<h1>home</h1>');
    assert.equal(await (await get('/la-carte/')).text(), '<h1>carte</h1>');
    assert.equal((await get('/missing.html')).status, 404);
  } finally {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
