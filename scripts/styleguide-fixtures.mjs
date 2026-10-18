import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const command = process.argv[2];
if (!['build', 'serve'].includes(command)) throw new Error('Use build or serve');
const isStatic = existsSync('baseline.config.json') && JSON.parse(readFileSync('baseline.config.json', 'utf8')).foundation === 'static';
const args = command === 'build' ? ['node_modules/astro/bin/astro.mjs', 'build'] : isStatic
  ? ['node_modules/astro/bin/astro.mjs', 'preview', '--host', '127.0.0.1', '--port', process.env.PORT || '4349']
  : ['dist-fixtures/server/entry.mjs'];
const child = spawn(process.execPath, args, {
  cwd: path.resolve('.'), stdio: 'inherit',
  env: { ...process.env, ASTRO_TEST_FIXTURES: '1', HOST: '127.0.0.1', PORT: process.env.PORT || '4349' },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
const [code] = await once(child, 'exit');
process.exitCode = code ?? 1;
